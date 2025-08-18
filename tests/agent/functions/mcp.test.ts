import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";
import {
    loadAgentMCPConfig,
    loadMCPs,
    getMCPTools,
    executeMCPTool,
    loadMCPResources,
    loadMCPPrompts,
    disconnectMCPs
} from "../../../lib/agent/functions/mcp";
import { truncate } from "../../../lib/utils/truncate";

// Mock the MCP registry
jest.mock("../../../lib/mcp/registry", () => ({
    loadMCPConfig: jest.fn(),
    createMCPClient: jest.fn(),
    getMCPClient: jest.fn(),
    disconnectAllMCPClients: jest.fn()
}));

// Import the mocked registry
import * as mcpRegistry from "../../../lib/mcp/registry";
const mockMCPRegistry = mcpRegistry as jest.Mocked<typeof mcpRegistry>;

describe("MCP Functions", () => {
    let mockAgent: any;
    let mockLogger: any;
    let mockMCPClient: any;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Create mock MCP client
        mockMCPClient = {
            name: "test-server",
            config: {},
            isConnected: false,
            connect: jest.fn(),
            disconnect: jest.fn(),
            listTools: jest.fn(),
            callTool: jest.fn(),
            listResources: jest.fn(),
            readResource: jest.fn(),
            listPrompts: jest.fn(),
            getPrompt: jest.fn()
        };

        // Create mock agent with proper bracket notation access methods
        mockAgent = {
            ["getMcpConfig"]: jest.fn(),
            ["getMCPs"]: jest.fn(),
            ["getCustomMcpConfigs"]: jest.fn(() => new Map()),
            ["getLogger"]: jest.fn(() => mockLogger),
            ["getSystemPrompt"]: jest.fn(),
            ["setSystemPrompt"]: jest.fn()
        };

        // Reset all mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("loadAgentMCPConfig", () => {
        test("should load MCP config when mcpConfig is provided", () => {
            // Arrange
            mockAgent["getMcpConfig"].mockReturnValue("/path/to/config.json");

            // Act
            loadAgentMCPConfig(mockAgent);

            // Assert
            expect(mockAgent["getMcpConfig"]).toHaveBeenCalled();
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { mcpConfig: "/path/to/config.json" },
                "Loading agent-specific MCP config"
            );
            expect(mockMCPRegistry.loadMCPConfig).toHaveBeenCalledWith("/path/to/config.json");
        });

        test("should not load MCP config when mcpConfig is not provided", () => {
            // Arrange
            mockAgent["getMcpConfig"].mockReturnValue(undefined);

            // Act
            loadAgentMCPConfig(mockAgent);

            // Assert
            expect(mockAgent["getMcpConfig"]).toHaveBeenCalled();
            expect(mockLogger.debug).not.toHaveBeenCalled();
            expect(mockMCPRegistry.loadMCPConfig).not.toHaveBeenCalled();
        });

        test("should not load MCP config when mcpConfig is not a string", () => {
            // Arrange
            mockAgent["getMcpConfig"].mockReturnValue(123 as any);

            // Act
            loadAgentMCPConfig(mockAgent);

            // Assert
            expect(mockAgent["getMcpConfig"]).toHaveBeenCalled();
            expect(mockLogger.debug).not.toHaveBeenCalled();
            expect(mockMCPRegistry.loadMCPConfig).not.toHaveBeenCalled();
        });
    });

    describe("loadMCPs", () => {
        test("should return early when no MCPs are configured", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(undefined);

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockAgent["getMCPs"]).toHaveBeenCalled();
            expect(mockMCPRegistry.getMCPClient).not.toHaveBeenCalled();
        });

        test("should return early when MCPs array is empty", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue([]);

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockAgent["getMCPs"]).toHaveBeenCalled();
            expect(mockMCPRegistry.getMCPClient).not.toHaveBeenCalled();
        });

        test("should connect to existing MCP client", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = false;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockMCPRegistry.getMCPClient).toHaveBeenCalledWith("test-server");
            expect(mockMCPClient.connect).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith(
                { mcpName: "test-server" },
                "MCP server connected"
            );
        });

        test("should create new MCP client when not found", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = false;
            mockMCPRegistry.getMCPClient.mockReturnValue(undefined);
            mockMCPRegistry.createMCPClient.mockResolvedValue(mockMCPClient);

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockMCPRegistry.getMCPClient).toHaveBeenCalledWith("test-server");
            expect(mockMCPRegistry.createMCPClient).toHaveBeenCalledWith("test-server");
            expect(mockMCPClient.connect).toHaveBeenCalled();
        });

        test("should not connect if client is already connected", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockMCPRegistry.getMCPClient).toHaveBeenCalledWith("test-server");
            expect(mockMCPClient.connect).not.toHaveBeenCalled();
        });

        test("should handle errors when loading MCP server", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            const error = new Error("Connection failed");
            mockMCPRegistry.getMCPClient.mockImplementation(() => {
                throw error;
            });

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                { mcpName: "test-server", error },
                "Failed to load MCP server: Connection failed"
            );
        });

        test("should handle string errors", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPRegistry.getMCPClient.mockImplementation(() => {
                throw "String error";
            });

            // Act
            await loadMCPs(mockAgent);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                { mcpName: "test-server", error: "String error" },
                "Failed to load MCP server: String error"
            );
        });
    });

    describe("getMCPTools", () => {
        test("should return empty array when no MCPs are configured", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(undefined);

            // Act
            const result = await getMCPTools(mockAgent);

            // Assert
            expect(result).toEqual([]);
        });

        test("should return empty array when MCPs array is empty", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue([]);

            // Act
            const result = await getMCPTools(mockAgent);

            // Assert
            expect(result).toEqual([]);
        });

        test("should return tools from connected MCP server", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);
            
            const mockTools = [
                {
                    name: "read_file",
                    description: "Read a file",
                    inputSchema: { type: "object", properties: { path: { type: "string" } } }
                }
            ];
            mockMCPClient.listTools.mockResolvedValue(mockTools);

            // Act
            const result = await getMCPTools(mockAgent);

            // Assert
            expect(result).toEqual([
                {
                    type: "function",
                    function: {
                        name: "mcp_test-server_read_file",
                        description: "[MCP:test-server] Read a file",
                        parameters: { type: "object", properties: { path: { type: "string" } } }
                    }
                }
            ]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { mcpName: "test-server", toolCount: 1 },
                "Loaded MCP tools"
            );
        });

        test("should skip disconnected clients", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = false;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            // Act
            const result = await getMCPTools(mockAgent);

            // Assert
            expect(result).toEqual([]);
            expect(mockMCPClient.listTools).not.toHaveBeenCalled();
        });

        test("should skip when client not found", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPRegistry.getMCPClient.mockReturnValue(undefined);

            // Act
            const result = await getMCPTools(mockAgent);

            // Assert
            expect(result).toEqual([]);
        });

        test("should handle errors when getting tools", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);
            const error = new Error("Failed to list tools");
            mockMCPClient.listTools.mockRejectedValue(error);

            // Act
            const result = await getMCPTools(mockAgent);

            // Assert
            expect(result).toEqual([]);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { mcpName: "test-server", error },
                "Failed to get MCP tools: Failed to list tools"
            );
        });
    });

    describe("executeMCPTool", () => {
        test("should execute MCP tool successfully", async () => {
            // Arrange
            const toolName = "mcp_test-server_read_file";
            const args = { path: "/test/file.txt" };
            const expectedResult = { content: "file content" };

            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);
            // Setup the callTool mock to return a promise
            mockMCPClient.callTool.mockImplementation(() => Promise.resolve(expectedResult));

            // Act
            const result = await executeMCPTool(mockAgent, toolName, args);

            // Assert
            expect(result).toEqual(expectedResult);
            expect(mockMCPRegistry.getMCPClient).toHaveBeenCalledWith("test-server");
            expect(mockMCPClient.callTool).toHaveBeenCalledWith("read_file", args);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                "Executing MCP tool",
                { serverName: "test-server", mcpToolName: "read_file", args }
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                "MCP tool executed successfully",
                { 
                    serverName: "test-server", 
                    mcpToolName: "read_file",
                    result: truncate(JSON.stringify(expectedResult), 200)
                }
            );
        });

        test("should throw error for invalid tool name format", async () => {
            // Arrange
            const toolName = "invalid_tool_name";
            const args = {};

            // Act & Assert
            await expect(executeMCPTool(mockAgent, toolName, args)).rejects.toThrow(
                "Invalid MCP tool name format: invalid_tool_name"
            );
        });

        test("should throw error for tool name without server name", async () => {
            // Arrange
            const toolName = "mcp__tool_name";
            const args = {};

            // Act & Assert
            await expect(executeMCPTool(mockAgent, toolName, args)).rejects.toThrow(
                "Invalid MCP tool name format: mcp__tool_name"
            );
        });

        test("should throw error for tool name without tool name", async () => {
            // Arrange
            const toolName = "mcp_server_";
            const args = {};

            // Act & Assert
            await expect(executeMCPTool(mockAgent, toolName, args)).rejects.toThrow(
                "Invalid MCP tool name format: mcp_server_"
            );
        });

        test("should throw error when client not found", async () => {
            // Arrange
            const toolName = "mcp_test-server_read_file";
            const args = {};
            mockMCPRegistry.getMCPClient.mockReturnValue(undefined);

            // Act & Assert
            await expect(executeMCPTool(mockAgent, toolName, args)).rejects.toThrow(
                "MCP client not found: test-server"
            );
        });

        test("should throw error when client not connected", async () => {
            // Arrange
            const toolName = "mcp_test-server_read_file";
            const args = {};
            mockMCPClient.isConnected = false;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            // Act & Assert
            await expect(executeMCPTool(mockAgent, toolName, args)).rejects.toThrow(
                "MCP client not connected: test-server"
            );
        });

        test("should handle and rethrow tool execution errors", async () => {
            // Arrange
            const toolName = "mcp_test-server_read_file";
            const args = { path: "/test/file.txt" };
            const error = new Error("Tool execution failed");

            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);
            mockMCPClient.callTool.mockRejectedValue(error);

            // Act & Assert
            await expect(executeMCPTool(mockAgent, toolName, args)).rejects.toThrow(error);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverName: "test-server", mcpToolName: "read_file", args, error },
                "MCP tool execution failed: Tool execution failed"
            );
        });
    });

    describe("loadMCPResources", () => {
        test("should return early when no MCPs are configured", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(undefined);

            // Act
            await loadMCPResources(mockAgent);

            // Assert
            expect(mockAgent["getMCPs"]).toHaveBeenCalled();
            expect(mockMCPRegistry.getMCPClient).not.toHaveBeenCalled();
        });

        test("should load and add resources to system prompt", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockAgent["getSystemPrompt"].mockReturnValue("Current prompt");
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            const mockResources = [
                { name: "doc1", uri: "file://doc1.txt" }
            ];
            mockMCPClient.listResources.mockResolvedValue(mockResources);
            mockMCPClient.readResource.mockResolvedValue({
                contents: [
                    { type: "text", text: "Resource content" }
                ]
            });

            // Act
            await loadMCPResources(mockAgent);

            // Assert
            expect(mockMCPClient.listResources).toHaveBeenCalled();
            expect(mockMCPClient.readResource).toHaveBeenCalledWith("file://doc1.txt");
            expect(mockAgent["setSystemPrompt"]).toHaveBeenCalledWith(
                "Current prompt\n\n# MCP Resources\n\n## MCP Resource: doc1 (test-server)\nResource content"
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                { resourceCount: 1 },
                "MCP resources added to context"
            );
        });

        test("should skip disconnected clients", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = false;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            // Act
            await loadMCPResources(mockAgent);

            // Assert
            expect(mockMCPClient.listResources).not.toHaveBeenCalled();
        });

        test("should filter out non-text content", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockAgent["getSystemPrompt"].mockReturnValue("Current prompt");
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            const mockResources = [
                { name: "doc1", uri: "file://doc1.txt" }
            ];
            mockMCPClient.listResources.mockResolvedValue(mockResources);
            mockMCPClient.readResource.mockResolvedValue({
                contents: [
                    { type: "image", data: "base64data" },
                    { type: "text", text: "Text content" }
                ]
            });

            // Act
            await loadMCPResources(mockAgent);

            // Assert
            expect(mockAgent["setSystemPrompt"]).toHaveBeenCalledWith(
                "Current prompt\n\n# MCP Resources\n\n## MCP Resource: doc1 (test-server)\nText content"
            );
        });

        test("should handle resource read errors gracefully", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            const mockResources = [
                { name: "doc1", uri: "file://doc1.txt" }
            ];
            mockMCPClient.listResources.mockResolvedValue(mockResources);
            mockMCPClient.readResource.mockRejectedValue(new Error("Read failed"));

            // Act
            await loadMCPResources(mockAgent);

            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(
                { mcpName: "test-server", resourceUri: "file://doc1.txt" },
                "Failed to read MCP resource"
            );
        });

        test("should handle errors when listing resources", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);
            const error = new Error("List failed");
            mockMCPClient.listResources.mockRejectedValue(error);

            // Act
            await loadMCPResources(mockAgent);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                { mcpName: "test-server", error },
                "Failed to load MCP resources: List failed"
            );
        });
    });

    describe("loadMCPPrompts", () => {
        test("should return early when no MCPs are configured", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(undefined);

            // Act
            await loadMCPPrompts(mockAgent);

            // Assert
            expect(mockAgent["getMCPs"]).toHaveBeenCalled();
            expect(mockMCPRegistry.getMCPClient).not.toHaveBeenCalled();
        });

        test("should load and add prompts to system prompt", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockAgent["getSystemPrompt"].mockReturnValue("Current prompt");
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            const mockPrompts = [
                { name: "coding-prompt", description: "A prompt for coding assistance" }
            ];
            mockMCPClient.listPrompts.mockResolvedValue(mockPrompts);

            // Act
            await loadMCPPrompts(mockAgent);

            // Assert
            expect(mockMCPClient.listPrompts).toHaveBeenCalled();
            expect(mockAgent["setSystemPrompt"]).toHaveBeenCalledWith(
                "Current prompt\n\n# Available MCP Prompts\n\n## Available MCP Prompt: coding-prompt (test-server)\nA prompt for coding assistance"
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                { promptCount: 1 },
                "MCP prompts added to context"
            );
        });

        test("should skip disconnected clients", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = false;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);

            // Act
            await loadMCPPrompts(mockAgent);

            // Assert
            expect(mockMCPClient.listPrompts).not.toHaveBeenCalled();
        });

        test("should handle errors when listing prompts", async () => {
            // Arrange
            mockAgent["getMCPs"].mockReturnValue(["test-server"]);
            mockMCPClient.isConnected = true;
            mockMCPRegistry.getMCPClient.mockReturnValue(mockMCPClient);
            const error = new Error("List failed");
            mockMCPClient.listPrompts.mockRejectedValue(error);

            // Act
            await loadMCPPrompts(mockAgent);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                { mcpName: "test-server", error },
                "Failed to load MCP prompts: List failed"
            );
        });
    });

    describe("disconnectMCPs", () => {
        test("should disconnect all MCP clients with agent logger", async () => {
            // Arrange
            mockMCPRegistry.disconnectAllMCPClients.mockResolvedValue(undefined);

            // Act
            await disconnectMCPs(mockAgent);

            // Assert
            expect(mockLogger.debug).toHaveBeenCalledWith("Disconnecting all MCP servers");
            expect(mockMCPRegistry.disconnectAllMCPClients).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith("All MCP servers disconnected");
        });

        test("should disconnect all MCP clients without agent logger", async () => {
            // Arrange
            mockMCPRegistry.disconnectAllMCPClients.mockResolvedValue(undefined);

            // Act
            await disconnectMCPs();

            // Assert
            expect(mockMCPRegistry.disconnectAllMCPClients).toHaveBeenCalled();
        });

        test("should handle errors when disconnecting", async () => {
            // Arrange
            const error = new Error("Disconnect failed");
            mockMCPRegistry.disconnectAllMCPClients.mockRejectedValue(error);

            // Act
            await disconnectMCPs(mockAgent);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                { error },
                "Failed to disconnect MCP servers: Disconnect failed"
            );
        });

        test("should handle string errors when disconnecting", async () => {
            // Arrange
            mockMCPRegistry.disconnectAllMCPClients.mockRejectedValue("String error");

            // Act
            await disconnectMCPs(mockAgent);

            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(
                { error: "String error" },
                "Failed to disconnect MCP servers: String error"
            );
        });

        test("should handle errors when agent has no logger", async () => {
            // Arrange
            const mockAgentNoLogger = {
                ["getLogger"]: undefined
            } as any;
            const error = new Error("Disconnect failed");
            mockMCPRegistry.disconnectAllMCPClients.mockRejectedValue(error);

            // Act
            await disconnectMCPs(mockAgentNoLogger);

            // Assert
            expect(mockMCPRegistry.disconnectAllMCPClients).toHaveBeenCalled();
            // Should not throw even without logger
        });
    });
});