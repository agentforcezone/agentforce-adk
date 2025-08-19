import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { McpClient } from "../../lib/mcp/mcpClient";
import type { MCPServerConfig } from "../../lib/types";

// Create proper mock classes instead of using jest.mock
class MockClient {
    async connect(transport: any) { return Promise.resolve(); }
    async close() { return Promise.resolve(); }
    
    async listTools() {
        return {
            tools: [
                {
                    name: "test_tool",
                    description: "A test tool",
                    inputSchema: {
                        type: "object",
                        properties: { input: { type: "string" } },
                        required: ["input"]
                    }
                }
            ]
        };
    }

    async callTool(args: { name: string; arguments: any }) {
        return { content: [{ type: "text", text: "Tool executed successfully" }] };
    }

    async listResources() {
        return {
            resources: [
                {
                    uri: "test://resource",
                    name: "Test Resource",
                    description: "A test resource",
                    mimeType: "text/plain"
                }
            ]
        };
    }

    async readResource(args: { uri: string }) {
        return { contents: [{ type: "text", text: "Resource content" }] };
    }

    async listPrompts() {
        return {
            prompts: [
                {
                    name: "test_prompt",
                    description: "A test prompt",
                    arguments: [
                        { name: "input", description: "Input parameter", required: true }
                    ]
                }
            ]
        };
    }

    async getPrompt(args: { name: string; arguments?: any }) {
        return {
            description: "Test prompt response",
            messages: [
                {
                    role: "user",
                    content: { type: "text", text: "Prompt content" }
                }
            ]
        };
    }
}

class MockTransport {
    async close() { return Promise.resolve(); }
}

describe("McpClient Tests", () => {
    let client: McpClient;
    let mockConfig: MCPServerConfig;
    let originalConsoleLog: typeof console.log;

    beforeEach(() => {
        // Mock console methods to suppress outputs during testing
        originalConsoleLog = console.log;
        console.log = jest.fn();
        console.error = jest.fn();

        mockConfig = {
            name: "test-server",
            command: "python",
            args: ["test-server.py"],
            env: {
                TEST_VAR: "test_value"
            }
        };

        // Override the client's internal mcp property with our mock after construction
        client = new McpClient(mockConfig);
        (client as any).mcp = new MockClient();
    });

    afterEach(() => {
        // Restore original console methods
        console.log = originalConsoleLog;
        jest.restoreAllMocks();
    });

    describe("Constructor", () => {
        test("should create client with correct name and config", () => {
            expect(client.name).toBe("test-server");
            expect(client.config).toBe(mockConfig);
            expect(client.isConnected).toBe(false);
        });
    });

    describe("Connection Management", () => {
        test("should connect to stdio server successfully", async () => {
            // Mock transport creation
            (client as any).transport = new MockTransport();

            await client.connect();
            expect(client.isConnected).toBe(true);
        });

        test("should connect to HTTP server successfully", async () => {
            const httpConfig: MCPServerConfig = {
                name: "http-server",
                type: "sse",
                url: "https://example.com/mcp"
            };

            const httpClient = new McpClient(httpConfig);
            (httpClient as any).mcp = new MockClient();
            (httpClient as any).transport = new MockTransport();

            await httpClient.connect();
            expect(httpClient.isConnected).toBe(true);
        });

        test("should disconnect successfully", async () => {
            // Mock transport
            (client as any).transport = new MockTransport();

            await client.connect();
            expect(client.isConnected).toBe(true);

            await client.disconnect();
            expect(client.isConnected).toBe(false);
        });

        test("should handle connection errors", async () => {
            const badConfig: MCPServerConfig = {
                name: "bad-server"
                // Missing required command for stdio
            };

            const badClient = new McpClient(badConfig);

            await expect(badClient.connect()).rejects.toThrow(
                "Local transport requires command property for bad-server"
            );
        });
    });

    describe("Tool Operations", () => {
        beforeEach(async () => {
            (client as any).transport = new MockTransport();
            await client.connect();
        });

        test("should list tools successfully", async () => {
            const tools = await client.listTools();
            
            expect(tools).toHaveLength(1);
            expect(tools[0]).toEqual({
                name: "test_tool",
                description: "A test tool",
                inputSchema: {
                    type: "object",
                    properties: {
                        input: { type: "string" }
                    },
                    required: ["input"]
                }
            });
        });

        test("should call tool successfully", async () => {
            const result = await client.callTool("test_tool", { input: "test" });
            
            expect(result).toEqual({
                content: [{ type: "text", text: "Tool executed successfully" }]
            });
        });

        test("should throw error when calling tool on disconnected client", async () => {
            await client.disconnect();

            await expect(client.callTool("test_tool", {})).rejects.toThrow(
                "MCP client test-server is not connected"
            );
        });
    });

    describe("Resource Operations", () => {
        beforeEach(async () => {
            (client as any).transport = new MockTransport();
            await client.connect();
        });

        test("should list resources successfully", async () => {
            const resources = await client.listResources();
            
            expect(resources).toHaveLength(1);
            expect(resources[0]).toEqual({
                uri: "test://resource",
                name: "Test Resource",
                description: "A test resource",
                mimeType: "text/plain"
            });
        });

        test("should read resource successfully", async () => {
            const result = await client.readResource("test://resource");
            
            expect(result).toEqual({
                contents: [
                    { type: "text", text: "Resource content", data: undefined }
                ]
            });
        });
    });

    describe("Prompt Operations", () => {
        beforeEach(async () => {
            (client as any).transport = new MockTransport();
            await client.connect();
        });

        test("should list prompts successfully", async () => {
            const prompts = await client.listPrompts();
            
            expect(prompts).toHaveLength(1);
            expect(prompts[0]).toEqual({
                name: "test_prompt",
                description: "A test prompt",
                arguments: {
                    type: "object",
                    properties: {
                        input: {
                            type: "string",
                            description: "Input parameter"
                        }
                    },
                    required: ["input"]
                }
            });
        });

        test("should get prompt successfully", async () => {
            const result = await client.getPrompt("test_prompt", { input: "test" });
            
            expect(result).toEqual({
                description: "Test prompt response",
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: "Prompt content"
                        }
                    }
                ]
            });
        });
    });

    describe("Transport Type Detection", () => {
        test("should detect HTTP transport from url config", () => {
            const httpConfig: MCPServerConfig = {
                name: "http-server",
                url: "https://example.com/mcp"
            };

            const httpClient = new McpClient(httpConfig);
            expect(httpClient.config.url).toBe("https://example.com/mcp");
        });

        test("should detect HTTP transport from type config", () => {
            const httpConfig: MCPServerConfig = {
                name: "http-server",
                type: "sse",
                env: {
                    MCP_SERVER_URL: "https://example.com/mcp"
                }
            };

            const httpClient = new McpClient(httpConfig);
            expect(httpClient.config.type).toBe("sse");
        });

        test("should use stdio transport for command config", () => {
            const stdioConfig: MCPServerConfig = {
                name: "stdio-server",
                command: "python",
                args: ["server.py"]
            };

            const stdioClient = new McpClient(stdioConfig);
            expect(stdioClient.config.command).toBe("python");
        });
    });

    describe("Script Type Detection", () => {
        test("should handle Python scripts", async () => {
            const pythonConfig: MCPServerConfig = {
                name: "python-server",
                command: "test-server.py"
            };

            const pythonClient = new McpClient(pythonConfig);
            (pythonClient as any).mcp = new MockClient();
            (pythonClient as any).transport = new MockTransport();

            await pythonClient.connect();
            expect(pythonClient.isConnected).toBe(true);
        });

        test("should handle JavaScript scripts", async () => {
            const jsConfig: MCPServerConfig = {
                name: "js-server",
                command: "test-server.js"
            };

            const jsClient = new McpClient(jsConfig);
            (jsClient as any).mcp = new MockClient();
            (jsClient as any).transport = new MockTransport();

            await jsClient.connect();
            expect(jsClient.isConnected).toBe(true);
        });
    });
});
