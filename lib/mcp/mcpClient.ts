import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { MCPClient, MCPServerConfig, MCPTool, MCPResource, MCPPrompt } from "../types";
import { Logger } from "../logger";

/**
 * Simplified MCP client implementation based on Anthropic's example
 * This is much easier to test and maintain than the complex old client
 */
export class McpClient implements MCPClient {
    public readonly name: string;
    public readonly config: MCPServerConfig;
    private mcp: Client;
    private transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null = null;
    private isConnectedState: boolean = false;
    private logger: Logger;

    constructor(config: MCPServerConfig) {
        this.name = config.name;
        this.config = config;
        // Configure logger (can be overridden by LOGGER_TYPE environment variable)
        this.logger = new Logger(`MCP Client ${this.name}`);
        
        this.mcp = new Client({ 
            name: "agentforce-adk-client", 
            version: "0.11.0", 
            // Use a simple logger for the MCP SDK - it expects a different interface
            logger: {
                debug: (message: string) => this.logger.debug(`${message}`),
                info: (message: string) => this.logger.info(`${message}`),
                warn: (message: string) => this.logger.warn(`${message}`),
                error: (message: string) => this.logger.error(`${message}`),
            },
        });
    }

    get isConnected(): boolean {
        return this.isConnectedState;
    }

    getLogger(): Logger {
        return this.logger;
    }

    /**
     * Connect to the MCP server
     */
    async connect(): Promise<void> {
        try {
            this.logger.info(`Connecting to ${this.name} server...`);

            if (this.isHttpTransport()) {
                await this.connectHttp();
            } else {
                await this.connectStdio();
            }

            this.isConnectedState = true;
            this.logger.info(`Connected to ${this.name} server`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to connect to MCP server ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * Connect using HTTP/SSE transport for remote servers
     */
    private async connectHttp(): Promise<void> {
        const serverUrl = this.config.url || this.config.env?.MCP_SERVER_URL;
        
        if (!serverUrl) {
            throw new Error(`HTTP transport requires url property or MCP_SERVER_URL in env config for ${this.name}`);
        }

        const transportType = this.config.type === "http" ? "http-stream" : 
                             this.config.env?.MCP_TRANSPORT_TYPE || "sse";

        if (transportType === "http-stream" || transportType === "http") {
            this.transport = new StreamableHTTPClientTransport(
                new URL(serverUrl),
                {
                    requestInit: {
                        headers: {
                            Authorization: this.config.env?.AUTHORIZATION || "",
                            ...this.getCustomHeaders(),
                        },
                    },
                },
            );
        } else {
            // SSE transport - include custom headers via custom fetch function
            const customHeaders = this.getCustomHeaders();
            if (Object.keys(customHeaders).length > 0 || this.config.env?.AUTHORIZATION) {
                const allHeaders = {
                    Authorization: this.config.env?.AUTHORIZATION || "",
                    ...customHeaders,
                };
                
                // Filter out empty headers
                const filteredHeaders = Object.fromEntries(
                    Object.entries(allHeaders).filter(([_, value]) => value),
                );

                this.transport = new SSEClientTransport(new URL(serverUrl), {
                    requestInit: {
                        headers: filteredHeaders,
                    },
                    eventSourceInit: {
                        fetch: (url, init) => {
                            // Merge custom headers with the existing headers
                            const mergedHeaders = {
                                ...init.headers,
                                ...filteredHeaders,
                            };
                            
                            return globalThis.fetch(url, {
                                ...init,
                                headers: mergedHeaders,
                            });
                        },
                    },
                });
            } else {
                this.transport = new SSEClientTransport(new URL(serverUrl));
            }
        }

        await this.mcp.connect(this.transport);
    }

    /**
     * Connect using stdio transport for local command-based servers
     */
    private async connectStdio(): Promise<void> {
        if (!this.config.command) {
            throw new Error(`Local transport requires command property for ${this.name}`);
        }

        // Build environment variables
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

        // Determine script type and command
        let command = this.config.command;
        let args = this.config.args || [];

        // If command looks like a script file, prepend appropriate runtime
        if (command.endsWith(".py")) {
            const pythonCmd = process.platform === "win32" ? "python" : "python3";
            args = [command, ...args];
            command = pythonCmd;
        } else if (command.endsWith(".js")) {
            args = [command, ...args];
            command = process.execPath; // Use current Node.js executable
        }

        this.transport = new StdioClientTransport({
            command,
            args,
            env,
        });

        await this.mcp.connect(this.transport);
    }

    /**
     * Check if this config uses HTTP transport
     */
    private isHttpTransport(): boolean {
        return this.config.type === "sse" || 
               this.config.type === "http" || 
               !!this.config.url || 
               !!this.config.env?.MCP_SERVER_URL;
    }

    /**
     * Get custom headers from config with environment variable substitution
     */
    private getCustomHeaders(): Record<string, string> {
        const headers: Record<string, string> = {};
        
        // First, add headers from the headers field (official MCP standard)
        if (this.config.headers) {
            for (const [key, value] of Object.entries(this.config.headers)) {
                if (typeof value === "string") {
                    headers[key] = this.resolveEnvironmentVariable(value);
                }
            }
        }
        
        // Legacy support: check for env.headers object (deprecated)
        if (this.config.env && this.config.env.headers && typeof this.config.env.headers === "object") {
            for (const [key, value] of Object.entries(this.config.env.headers)) {
                if (typeof value === "string") {
                    headers[key] = this.resolveEnvironmentVariable(value);
                }
            }
        }
        
        // Legacy support: add headers from env with MCP_HEADER_ prefix (deprecated)
        if (this.config.env) {
            for (const [key, value] of Object.entries(this.config.env)) {
                if (key.startsWith("MCP_HEADER_") && typeof value === "string") {
                    const headerName = key.replace("MCP_HEADER_", "").replace(/_/g, "-");
                    headers[headerName] = this.resolveEnvironmentVariable(value);
                }
            }
        }

        return headers;
    }

    /**
     * Resolve environment variable references in header values
     * Supports both ${VAR} and $VAR formats
     */
    private resolveEnvironmentVariable(value: string): string {
        // Handle ${VARIABLE_NAME} format
        const envVarPattern = /\$\{([^}]+)\}/g;
        let resolved = value.replace(envVarPattern, (match, varName) => {
            const envValue = process.env[varName];
            if (envValue === undefined) {
                this.logger.warn(`Environment variable ${varName} not found, using empty string`);
                return "";
            }
            return envValue;
        });

        // Handle $VARIABLE_NAME format (word boundary)
        const simpleEnvVarPattern = /\$([A-Z_][A-Z0-9_]*)/g;
        resolved = resolved.replace(simpleEnvVarPattern, (match, varName) => {
            const envValue = process.env[varName];
            if (envValue === undefined) {
                this.logger.warn(`Environment variable ${varName} not found, using empty string`);
                return "";
            }
            return envValue;
        });

        return resolved;
    }

    /**
     * Disconnect from the MCP server
     */
    async disconnect(): Promise<void> {
        try {
            if (this.mcp && this.isConnectedState) {
                this.logger.info(`Closing connection for ${this.name}`);
                await this.mcp.close();
            }

            this.transport = null;
            this.isConnectedState = false;
            
            this.logger.info(`Disconnected from ${this.name} server`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error disconnecting from ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * List available tools from the MCP server
     */
    async listTools(): Promise<MCPTool[]> {
        if (!this.isConnectedState) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            const response = await this.mcp.listTools();
            
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
        if (!this.isConnectedState) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            this.logger.info(`Calling tool ${name} on server ${this.name}`);
            this.logger.info("Arguments:", arguments_);
            
            const response = await this.mcp.callTool({
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
        if (!this.isConnectedState) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            const response = await this.mcp.listResources();
            
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
        if (!this.isConnectedState) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            this.logger.info(`Reading resource ${uri} from server ${this.name}`);
            
            const response = await this.mcp.readResource({ uri });

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
        if (!this.isConnectedState) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            const response = await this.mcp.listPrompts();
            
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
        if (!this.isConnectedState) {
            throw new Error(`MCP client ${this.name} is not connected`);
        }

        try {
            this.logger.info(`Getting prompt ${name} from server ${this.name}`);
            if (arguments_) {
                this.logger.info("Arguments:", arguments_);
            }
            
            const response = await this.mcp.getPrompt({
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
