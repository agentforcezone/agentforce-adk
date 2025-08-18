import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../../lib/agent";
import type { AgentConfig, MCPServerConfig } from "../../../lib/types";

describe("AgentForceAgent addMCP Method Tests", () => {
    let agent: AgentForceAgent;
    let mockLogger: any;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        agent = new AgentForceAgent(testConfig);
        
        // Mock the logger
        jest.spyOn(agent, "getLogger" as any).mockReturnValue(mockLogger);
        
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe("Method Chaining", () => {
        test("should return agent instance for method chaining", () => {
            const result = agent.addMCP("filesystem");
            expect(result).toBe(agent);
        });

        test("should support method chaining with other methods", () => {
            const result = agent
                .addMCP("filesystem")
                .addMCP("brave-search")
                .useLLM("ollama", "llama3")
                .debug()
                .prompt("test prompt");
            expect(result).toBe(agent);
        });
    });

    describe("Adding Pre-configured MCP Servers", () => {
        test("should add a single MCP server by name", () => {
            // Spy on getMCPs and setMCPs to verify behavior
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP("filesystem");

            expect(getMCPsSpy).toHaveBeenCalled();
            expect(setMCPsSpy).toHaveBeenCalledWith(["filesystem"]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "filesystem", isCustomConfig: false },
                "MCP server added to agent configuration"
            );
        });

        test("should add multiple MCP servers", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any)
                .mockReturnValueOnce([])  // First call: empty
                .mockReturnValueOnce(["filesystem"])  // Second call: has filesystem
                .mockReturnValueOnce(["filesystem", "brave-search"]);  // Third call: has filesystem + brave-search
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP("filesystem").addMCP("brave-search").addMCP("git");

            expect(setMCPsSpy).toHaveBeenCalledTimes(3);
            expect(setMCPsSpy).toHaveBeenNthCalledWith(1, ["filesystem"]);
            expect(setMCPsSpy).toHaveBeenNthCalledWith(2, ["filesystem", "brave-search"]);
            expect(setMCPsSpy).toHaveBeenNthCalledWith(3, ["filesystem", "brave-search", "git"]);
        });

        test("should not add duplicate MCP servers", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any)
                .mockReturnValueOnce([])  // First call: empty array
                .mockReturnValueOnce(["filesystem"]);  // Second call: already has filesystem
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP("filesystem").addMCP("filesystem");

            expect(setMCPsSpy).toHaveBeenCalledTimes(1); // Only called once
            expect(setMCPsSpy).toHaveBeenCalledWith(["filesystem"]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "filesystem" },
                "MCP server already configured, skipping"
            );
        });

        test("should preserve existing MCP servers when adding new ones", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue(["existing-server"]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP("filesystem");

            expect(setMCPsSpy).toHaveBeenCalledWith(["existing-server", "filesystem"]);
        });
    });

    describe("Adding Custom MCP Server Configurations", () => {
        test("should add MCP server with custom configuration", () => {
            const customConfig: MCPServerConfig = {
                name: "custom-server",
                command: "python",
                args: ["/path/to/server.py"],
                env: { API_KEY: "secret" },
                timeout: 10000
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP(customConfig);

            expect(setMCPsSpy).toHaveBeenCalledWith(["custom-server"]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "custom-server", isCustomConfig: true },
                "MCP server added to agent configuration"
            );
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "custom-server" },
                "Custom MCP config stored for execution"
            );
        });

        test("should handle custom config with minimal properties", () => {
            const customConfig: MCPServerConfig = {
                name: "minimal-server",
                command: "node",
                args: ["server.js"]
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP(customConfig);

            expect(setMCPsSpy).toHaveBeenCalledWith(["minimal-server"]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "minimal-server", isCustomConfig: true },
                "MCP server added to agent configuration"
            );
        });

        test("should handle custom config with all properties", () => {
            const customConfig: MCPServerConfig = {
                name: "full-server",
                command: "python",
                args: ["-m", "my_mcp_server"],
                env: { 
                    API_KEY: "secret",
                    DEBUG: "true",
                    PORT: "8080"
                },
                workingDirectory: "/app",
                timeout: 30000
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP(customConfig);

            expect(setMCPsSpy).toHaveBeenCalledWith(["full-server"]);
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "full-server", isCustomConfig: true },
                "MCP server added to agent configuration"
            );
        });
    });

    describe("Error Handling", () => {
        test("should handle empty string server name", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            const result = agent.addMCP("");

            expect(result).toBe(agent); // Should still return agent for chaining
            expect(setMCPsSpy).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: "", error: expect.any(Error) },
                "Failed to add MCP server: MCP server name cannot be empty"
            );
        });

        test("should handle whitespace-only server name", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            const result = agent.addMCP("   ");

            expect(result).toBe(agent);
            expect(setMCPsSpy).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: "   ", error: expect.any(Error) },
                "Failed to add MCP server: MCP server name cannot be empty"
            );
        });

        test("should handle custom config with empty name", () => {
            const customConfig: MCPServerConfig = {
                name: "",
                command: "python",
                args: ["server.py"]
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            const result = agent.addMCP(customConfig);

            expect(result).toBe(agent);
            expect(setMCPsSpy).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: customConfig, error: expect.any(Error) },
                "Failed to add MCP server: MCP server name cannot be empty"
            );
        });

        test("should handle custom config with whitespace-only name", () => {
            const customConfig: MCPServerConfig = {
                name: "  \t  ",
                command: "python",
                args: ["server.py"]
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            const result = agent.addMCP(customConfig);

            expect(result).toBe(agent);
            expect(setMCPsSpy).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: customConfig, error: expect.any(Error) },
                "Failed to add MCP server: MCP server name cannot be empty"
            );
        });

        test("should handle getMCPs throwing an error", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockImplementation(() => {
                throw new Error("Failed to get MCPs");
            });
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            const result = agent.addMCP("filesystem");

            expect(result).toBe(agent);
            expect(setMCPsSpy).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: "filesystem", error: expect.any(Error) },
                "Failed to add MCP server: Failed to get MCPs"
            );
        });

        test("should handle setMCPs throwing an error", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue([]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {
                throw new Error("Failed to set MCPs");
            });

            const result = agent.addMCP("filesystem");

            expect(result).toBe(agent);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: "filesystem", error: expect.any(Error) },
                "Failed to add MCP server: Failed to set MCPs"
            );
        });

        test("should handle non-Error exceptions", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockImplementation(() => {
                throw "String error";
            });

            const result = agent.addMCP("filesystem");

            expect(result).toBe(agent);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: "filesystem", error: "String error" },
                "Failed to add MCP server: String error"
            );
        });

        test("should handle null input", () => {
            const result = agent.addMCP(null as any);

            expect(result).toBe(agent);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: null, error: expect.any(Error) },
                expect.stringContaining("Failed to add MCP server:")
            );
        });

        test("should handle undefined input", () => {
            const result = agent.addMCP(undefined as any);

            expect(result).toBe(agent);
            expect(mockLogger.error).toHaveBeenCalledWith(
                { serverNameOrConfig: undefined, error: expect.any(Error) },
                expect.stringContaining("Failed to add MCP server:")
            );
        });
    });

    describe("Mixed Usage Scenarios", () => {
        test("should handle mixed string and config additions", () => {
            const customConfig: MCPServerConfig = {
                name: "custom-server",
                command: "python",
                args: ["server.py"]
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any)
                .mockReturnValueOnce([])  // First call: empty
                .mockReturnValueOnce(["filesystem"])  // Second call: has filesystem
                .mockReturnValueOnce(["filesystem", "custom-server"]);  // Third call: has both
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent
                .addMCP("filesystem")
                .addMCP(customConfig)
                .addMCP("brave-search");

            expect(setMCPsSpy).toHaveBeenCalledTimes(3);
            expect(setMCPsSpy).toHaveBeenNthCalledWith(1, ["filesystem"]);
            expect(setMCPsSpy).toHaveBeenNthCalledWith(2, ["filesystem", "custom-server"]);
            expect(setMCPsSpy).toHaveBeenNthCalledWith(3, ["filesystem", "custom-server", "brave-search"]);
        });

        test("should handle duplicate custom config names", () => {
            const customConfig1: MCPServerConfig = {
                name: "duplicate-server",
                command: "python",
                args: ["server1.py"]
            };

            const customConfig2: MCPServerConfig = {
                name: "duplicate-server",
                command: "node",
                args: ["server2.js"]
            };

            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any)
                .mockReturnValueOnce([])  // First call: empty
                .mockReturnValueOnce(["duplicate-server"]);  // Second call: has duplicate-server
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP(customConfig1).addMCP(customConfig2);

            expect(setMCPsSpy).toHaveBeenCalledTimes(1); // Only first one added
            expect(mockLogger.debug).toHaveBeenCalledWith(
                { serverName: "duplicate-server" },
                "MCP server already configured, skipping"
            );
        });
    });

    describe("Agent Configuration Integration", () => {
        test("should work with agent that has pre-configured MCPs", () => {
            const configWithMCPs: AgentConfig = {
                name: "TestAgent",
                mcps: ["pre-configured-server"]
            };

            const agentWithMCPs = new AgentForceAgent(configWithMCPs);
            jest.spyOn(agentWithMCPs, "getLogger" as any).mockReturnValue(mockLogger);

            const getMCPsSpy = jest.spyOn(agentWithMCPs, "getMCPs" as any).mockReturnValue(["pre-configured-server"]);
            const setMCPsSpy = jest.spyOn(agentWithMCPs, "setMCPs" as any).mockImplementation(() => {});

            agentWithMCPs.addMCP("filesystem");

            expect(setMCPsSpy).toHaveBeenCalledWith(["pre-configured-server", "filesystem"]);
        });

        test("should preserve agent's existing MCP configuration order", () => {
            const getMCPsSpy = jest.spyOn(agent, "getMCPs" as any).mockReturnValue(["server1", "server2"]);
            const setMCPsSpy = jest.spyOn(agent, "setMCPs" as any).mockImplementation(() => {});

            agent.addMCP("server3");

            expect(setMCPsSpy).toHaveBeenCalledWith(["server1", "server2", "server3"]);
        });
    });
});