import type { MCPClient, MCPServerConfig, MCPTool, MCPResource, MCPPrompt } from "../types";
import { Client as DefaultClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport as DefaultStdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport as DefaultSSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport as DefaultStreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Node.js implementation of MCP client using the official Anthropic SDK
 */
export class MCPNodeClient implements MCPClient {
    public readonly name: string;
    public readonly config: MCPServerConfig;
    private isConnectedState: boolean = false;
    private client?: any;
    private transport?: any;

    // Allow injecting dependencies for easier testing
    constructor(
        config: MCPServerConfig,
        private ClientImpl: typeof DefaultClient = DefaultClient,
        private StdioClientTransportImpl: typeof DefaultStdioClientTransport = DefaultStdioClientTransport,
        private SSEClientTransportImpl: typeof DefaultSSEClientTransport = DefaultSSEClientTransport,
        private StreamableHTTPClientTransportImpl: typeof DefaultStreamableHTTPClientTransport = DefaultStreamableHTTPClientTransport,
    ) {
        this.name = config.name;
        this.config = config;
    }

    get isConnected(): boolean {
        return this.isConnectedState;
    }

    /**
     * Connect to the MCP server using the official Anthropic SDK
     */
    async connect(): Promise<void> {
        try {
            // Note: No logger available here during connection, using console.log
            console.log(`[MCP] Connecting to ${this.name} server...`);
            
            // Initialize the MCP client
            this.client = new this.ClientImpl({
                name: "agentforce-adk",
                version: "0.11.0",
            }, {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {},
                },
            });

            // Determine transport type based on config
            if (this.isHttpTransport()) {
                // HTTP/SSE transport for remote servers
                await this.connectHttp();
            } else {
                // Stdio transport for local command-based servers
                await this.connectStdio();
            }

            this.isConnectedState = true;
            console.log(`[MCP] Connected to ${this.name} server`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to connect to MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * Connect using HTTP/SSE transport for remote servers
     */
    private async connectHttp(): Promise<void> {
        if (!this.config.env?.MCP_SERVER_URL) {
            throw new Error(`HTTP transport requires MCP_SERVER_URL in env config for ${this.name}`);
        }

        const serverUrl = this.config.env.MCP_SERVER_URL;
        const transportType = this.config.env.MCP_TRANSPORT_TYPE || "sse";

        if (transportType === "http-stream") {
            // Use StreamableHTTPClientTransport for HTTP streaming
            this.transport = new this.StreamableHTTPClientTransportImpl(
                new URL(serverUrl),
                {
                    requestInit: {
                        headers: {
                            Authorization: this.config.env.AUTHORIZATION || "",
                            ...this.getCustomHeaders(),
                        },
                    },
                },
            );
        } else {
            // Use SSE transport (default)
            this.transport = new this.SSEClientTransportImpl(
                new URL(serverUrl),
            );
        }

        await this.client!.connect(this.transport);
    }

    /**
     * Connect using stdio transport for local command-based servers
     */
    private async connectStdio(): Promise<void> {
        // Create stdio transport - it will handle process spawning internally
        const env: Record<string, string> = {};
        
        // Add process environment variables
        for (const [key, value] of Object.entries(process.env)) {
            if (value !== undefined) {
                env[key] = value;
            }
        }
        
        // Add config environment variables
        if (this.config.env) {
            for (const [key, value] of Object.entries(this.config.env)) {
                if (value) {
                    env[key] = value;
                }
            }
        }

        this.transport = new this.StdioClientTransportImpl({
            command: this.config.command,
            args: this.config.args,
            env,
        });

        // Connect with timeout
        const timeout = this.config.timeout || 10000;
        const connectPromise = this.client!.connect(this.transport);
        const timeoutPromise = new Promise((_, reject) => {
            const timer = setTimeout(() => reject(new Error("Connection timeout")), timeout);
            timer.unref(); // Don't keep the event loop alive
        });

        await Promise.race([connectPromise, timeoutPromise]);
    }

    /**
     * Check if this config uses HTTP transport
     */
    private isHttpTransport(): boolean {
        return !!this.config.env?.MCP_SERVER_URL;
    }

    /**
     * Get custom headers from config
     */
    private getCustomHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        
        // Extract custom headers from env (prefixed with MCP_HEADER_)
        if (this.config.env) {
            for (const [key, value] of Object.entries(this.config.env)) {
                if (key.startsWith("MCP_HEADER_") && value) {
                    const headerName = key.replace("MCP_HEADER_", "").replace(/_/g, "-");
                    headers[headerName] = value;
                }
            }
        }

        return headers;
    }

    /**
     * Disconnect from the MCP server
     */
    async disconnect(logger?: any): Promise<void> {
        try {
            if (this.client) {
                if (logger) {
                    logger.debug(`[MCP] Closing client connection for ${this.name}`);
                }
                await this.client.close();
                this.client = undefined;
            }

            if (this.transport) {
                if (logger) {
                    logger.debug(`[MCP] Closing transport for ${this.name}`);
                }
                
                // Add timeout to transport close to prevent hanging
                const closePromise = this.transport.close?.();
                if (closePromise) {
                    const timeoutPromise = new Promise((_, reject) => {
                        const timer = setTimeout(() => reject(new Error("Transport close timeout")), 3000);
                        timer.unref(); // Don't keep the event loop alive
                    });
                    
                    try {
                        await Promise.race([closePromise, timeoutPromise]);
                        if (logger) {
                            logger.debug(`[MCP] Transport closed successfully for ${this.name}`);
                        }
                    } catch (error) {
                        // Log timeout but don't throw - we still want to mark as disconnected
                        if (logger) {
                            logger.debug(`[MCP] Transport close timeout for ${this.name}: ${error}`);
                        } else {
                            console.warn(`[MCP] Transport close timeout for ${this.name}: ${error}`);
                        }
                        
                        // Force close the transport if it has a process
                        if (this.transport && typeof this.transport.close === "function") {
                            try {
                                // Try to access the underlying process and kill it
                                const process = (this.transport as any).process || (this.transport as any)._process;
                                if (process && typeof process.kill === "function") {
                                    if (logger) {
                                        logger.debug(`[MCP] Force killing transport process for ${this.name}`);
                                    } else {
                                        console.warn(`[MCP] Force killing transport process for ${this.name}`);
                                    }
                                    process.kill("SIGTERM");
                                    // Give it a moment then force kill, but don't keep the event loop alive
                                    const killTimer = setTimeout(() => {
                                        if (!process.killed) {
                                            process.kill("SIGKILL");
                                            if (logger) {
                                                logger.debug(`[MCP] Force killed transport process with SIGKILL for ${this.name}`);
                                            }
                                        }
                                    }, 1000);
                                    killTimer.unref(); // Don't keep the event loop alive
                                }
                            } catch (killError) {
                                if (logger) {
                                    logger.debug(`[MCP] Failed to force kill process for ${this.name}: ${killError}`);
                                } else {
                                    console.warn(`[MCP] Failed to force kill process for ${this.name}: ${killError}`);
                                }
                            }
                        }
                    }
                }
                this.transport = undefined;
            }

            
            this.isConnectedState = false;
            if (logger) {
                logger.debug(`[MCP] Disconnected from ${this.name} server`);
            } else {
                console.log(`[MCP] Disconnected from ${this.name} server`);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (logger) {
                logger.error(`[MCP] Error disconnecting from ${this.name}: ${errorMessage}`);
            } else {
                console.error(`[MCP] Error disconnecting from ${this.name}: ${errorMessage}`);
            }
        }
    }

    /**
     * List available tools from the MCP server
     */
    async listTools(): Promise<MCPTool[]> {
        if (!this.isConnectedState || !this.client) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            const response = await this.client.listTools();
            
            return response.tools.map((tool: any) => ({
                name: tool.name,
                description: tool.description || "",
                inputSchema: tool.inputSchema as {
                    type: "object";
                    properties: Record<string, any>;
                    required?: string[];
                },
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to list tools from MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * Call a tool on the MCP server
     */
    async callTool(name: string, arguments_: Record<string, any>): Promise<any> {
        if (!this.isConnectedState || !this.client) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            console.log(`[MCP] Calling tool ${name} on server ${this.name}`);
            console.log("[MCP] Arguments:", arguments_);
            
            const response = await this.client.callTool({
                name,
                arguments: arguments_,
            });

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to call tool ${name} on MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * List available resources from the MCP server
     */
    async listResources(): Promise<MCPResource[]> {
        if (!this.isConnectedState || !this.client) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            const response = await this.client.listResources();
            
            return response.resources.map((resource: any) => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to list resources from MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * Read a resource from the MCP server
     */
    async readResource(uri: string): Promise<{ contents: Array<{ type: string; text?: string; data?: string }> }> {
        if (!this.isConnectedState || !this.client) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            console.log(`[MCP] Reading resource ${uri} from server ${this.name}`);
            
            const response = await this.client.readResource({ uri });

            return {
                contents: response.contents.map((content: any) => ({
                    type: String(content.type),
                    text: content.type === "text" ? (content as any).text : undefined,
                    data: content.type === "blob" ? (content as any).data : undefined,
                })),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to read resource ${uri} from MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * List available prompts from the MCP server
     */
    async listPrompts(): Promise<MCPPrompt[]> {
        if (!this.isConnectedState || !this.client) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            const response = await this.client.listPrompts();
            
            return response.prompts.map((prompt: any) => ({
                name: prompt.name,
                description: prompt.description || "",
                arguments: prompt.arguments ? {
                    type: "object" as const,
                    properties: prompt.arguments.reduce((acc: Record<string, any>, arg: any) => {
                        acc[arg.name] = {
                            type: "string",
                            description: arg.description,
                        };
                        return acc;
                    }, {} as Record<string, any>),
                    required: prompt.arguments.filter((arg: any) => arg.required).map((arg: any) => arg.name),
                } : undefined,
            }));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to list prompts from MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * Get a prompt from the MCP server
     */
    async getPrompt(name: string, arguments_?: Record<string, any>): Promise<{ description?: string; messages: Array<{ role: string; content: { type: string; text: string } }> }> {
        if (!this.isConnectedState || !this.client) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            console.log(`[MCP] Getting prompt ${name} from server ${this.name}`);
            if (arguments_) {
                console.log("[MCP] Arguments:", arguments_);
            }
            
            const response = await this.client.getPrompt({
                name,
                arguments: arguments_,
            });

            return {
                description: response.description,
                messages: response.messages.map((message: any) => ({
                    role: message.role,
                    content: {
                        type: "text",
                        text: Array.isArray(message.content) 
                            ? message.content.map((c: any) => (c as any).text || "").join("")
                            : (message.content as any)?.text || "",
                    },
                })),
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get prompt ${name} from MCP server ${this.name}: ${errorMessage}`);
        }
    }
}