import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import type { MCPServerConfig, MCPClient } from "../../lib/types";

// Create mocks before any imports
const mockedReadFileSync = jest.fn();
const mockedExistsSync = jest.fn();
const mockedResolve = jest.fn();
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
};
const mockMcpClient = jest.fn();

// Mock modules before importing the registry
jest.doMock("fs", () => ({
    readFileSync: mockedReadFileSync,
    existsSync: mockedExistsSync,
    writeFileSync: jest.fn(),
}));

jest.doMock("path", () => ({
    resolve: mockedResolve,
    join: jest.fn((...paths: string[]) => paths.filter(Boolean).join("/")),
    dirname: jest.fn(),
}));

jest.doMock("../../lib/logger", () => ({
    defaultLogger: mockLogger,
    Logger: jest.fn().mockImplementation(() => mockLogger)
}));

jest.doMock("../../lib/mcp/mcpClient", () => ({
    McpClient: mockMcpClient
}));

// Now import the registry module
import {
    loadMCPConfig,
    getMCPServerConfigs,
    getMCPClient,
    registerMCPClient,
    createMCPClient,
    getRegisteredMCPClients,
    hasMCPClient,
    removeMCPClient,
    connectAllMCPClients,
    getAllMCPClients,
    disconnectAllMCPClients,
    mcpRegistry
} from "../../lib/mcp/registry";

describe("MCP Registry", () => {
    let mockClient: jest.Mocked<MCPClient>;
    let originalEnv: typeof process.env;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };

        // Create mock MCP client
        mockClient = {
            name: "test-server",
            config: {} as MCPServerConfig,
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

        // Clear the registry
        Object.keys(mcpRegistry).forEach(key => delete mcpRegistry[key]);

        // Reset all mocks
        jest.clearAllMocks();
        mockMcpClient.mockReturnValue(mockClient);

        // Setup default mock values
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue('{"mcpServers":{}}');
        mockedResolve.mockReturnValue("/default/path/mcp.config.json");
    });

    afterEach(() => {
        // Restore original environment
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    describe("loadMCPConfig", () => {
        test("should load config from specified path", () => {
            const configPath = "/custom/config.json";
            const mockConfig = {
                mcpServers: {
                    "test-server": {
                        command: "python",
                        args: ["server.py"],
                        env: { API_KEY: "test-key" }
                    }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig(configPath);

            expect(mockedExistsSync).toHaveBeenCalledWith(configPath);
            expect(mockedReadFileSync).toHaveBeenCalledWith(configPath, "utf-8");
            expect(mockLogger.info).toHaveBeenCalledWith(
                "Loaded 1 server configs from /custom/config.json"
            );

            const configs = getMCPServerConfigs();
            expect(configs["test-server"]).toMatchObject({
                name: "test-server",
                command: "python",
                args: ["server.py"],
                env: { API_KEY: "test-key" },
                timeout: 10000
            });
        });

        test("should use MCP_CONFIG environment variable when no path specified", () => {
            process.env.MCP_CONFIG = "/env/config.json";
            const mockConfig = {
                mcpServers: {
                    "env-server": {
                        command: "node",
                        args: ["server.js"]
                    }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig();

            expect(mockedExistsSync).toHaveBeenCalledWith("/env/config.json");
        });

        test("should resolve environment variables in config", () => {
            process.env.MY_API_KEY = "secret-key";
            process.env.MY_PORT = "8080";
            
            const mockConfig = {
                mcpServers: {
                    "env-var-server": {
                        command: "python",
                        args: ["server.py"],
                        env: {
                            API_KEY: "${MY_API_KEY}",
                            PORT: "${MY_PORT}",
                            STATIC_VAR: "static-value",
                            MISSING_VAR: "${MISSING_VAR}"
                        }
                    }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig("/test/config.json");

            const configs = getMCPServerConfigs();
            expect(configs["env-var-server"]?.env).toEqual({
                API_KEY: "secret-key",
                PORT: "8080",
                STATIC_VAR: "static-value",
                MISSING_VAR: ""
            });
        });

        test("should handle config with empty args and set default timeout", () => {
            const mockConfig = {
                mcpServers: {
                    "minimal-server": {
                        command: "python"
                        // No args, no timeout
                    }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig("/test/config.json");

            const configs = getMCPServerConfigs();
            expect(configs["minimal-server"]).toMatchObject({
                name: "minimal-server",
                command: "python",
                args: [],
                env: {},
                timeout: 10000
            });
        });

        test("should handle config with custom timeout", () => {
            const mockConfig = {
                mcpServers: {
                    "timeout-server": {
                        command: "python",
                        timeout: 60000
                    }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig("/test/config.json");

            const configs = getMCPServerConfigs();
            expect(configs["timeout-server"]?.timeout).toBe(60000);
        });

        test("should handle missing config file", () => {
            mockedExistsSync.mockReturnValue(false);

            loadMCPConfig("/missing/config.json");

            expect(mockLogger.debug).toHaveBeenCalledWith(
                "Config file not found at /missing/config.json (this is expected if MCP is not used)"
            );
            expect(getMCPServerConfigs()).toEqual({});
        });

        test("should handle invalid JSON in config file", () => {
            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue("invalid json {");

            loadMCPConfig("/invalid/config.json");

            expect(mockLogger.error).toHaveBeenCalledWith(
                "Error loading config from /invalid/config.json:",
                expect.any(Error)
            );
            expect(getMCPServerConfigs()).toEqual({});
        });

        test("should handle config without mcpServers property", () => {
            const mockConfig = { otherProperty: "value" };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig("/test/config.json");

            expect(mockLogger.debug).toHaveBeenCalledWith(
                "Invalid config format in /test/config.json"
            );
            expect(getMCPServerConfigs()).toEqual({});
        });

        test("should handle config with non-object mcpServers", () => {
            const mockConfig = { mcpServers: "not an object" };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));

            loadMCPConfig("/test/config.json");

            expect(mockLogger.debug).toHaveBeenCalledWith(
                "Invalid config format in /test/config.json"
            );
            expect(getMCPServerConfigs()).toEqual({});
        });

        test("should handle file read error", () => {
            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockImplementation(() => {
                throw new Error("File read error");
            });

            loadMCPConfig("/error/config.json");

            expect(mockLogger.error).toHaveBeenCalledWith(
                "Error loading config from /error/config.json:",
                expect.any(Error)
            );
            expect(getMCPServerConfigs()).toEqual({});
        });
    });

    describe("getMCPServerConfigs", () => {
        test("should return current server configurations", () => {
            const mockConfig = {
                mcpServers: {
                    "server1": { command: "python", args: ["server1.py"] },
                    "server2": { command: "node", args: ["server2.js"] }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
            loadMCPConfig("/test/config.json");

            const configs = getMCPServerConfigs();
            expect(Object.keys(configs)).toEqual(["server1", "server2"]);
            expect(configs.server1?.command).toBe("python");
            expect(configs.server2?.command).toBe("node");
        });
    });

    describe("getMCPClient", () => {
        test("should return registered client", () => {
            registerMCPClient("test-server", mockClient);
            
            const client = getMCPClient("test-server");
            expect(client).toBe(mockClient);
        });

        test("should return undefined for unregistered client", () => {
            const client = getMCPClient("non-existent");
            expect(client).toBeUndefined();
        });
    });

    describe("registerMCPClient", () => {
        test("should register client in registry", () => {
            registerMCPClient("test-server", mockClient);
            
            expect(mcpRegistry["test-server"]).toBe(mockClient);
        });

        test("should overwrite existing client", () => {
            const anotherClient = { ...mockClient, name: "another-client" } as MCPClient;
            
            registerMCPClient("test-server", mockClient);
            registerMCPClient("test-server", anotherClient);
            
            expect(mcpRegistry["test-server"]).toBe(anotherClient);
        });
    });

    describe("createMCPClient", () => {
        test("should create client with provided config", async () => {
            const customConfig: MCPServerConfig = {
                name: "custom-server",
                command: "python",
                args: ["custom.py"]
            };

            const client = await createMCPClient("custom-server", customConfig);

            expect(mockMcpClient).toHaveBeenCalledWith(customConfig);
            expect(client).toBe(mockClient);
            expect(mcpRegistry["custom-server"]).toBe(mockClient);
        });

        test("should create client with pre-configured config", async () => {
            const mockConfig = {
                mcpServers: {
                    "pre-configured": {
                        command: "node",
                        args: ["server.js"]
                    }
                }
            };

            mockedExistsSync.mockReturnValue(true);
            mockedReadFileSync.mockReturnValue(JSON.stringify(mockConfig));
            loadMCPConfig("/test/config.json");

            const client = await createMCPClient("pre-configured");

            expect(mockMcpClient).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: "pre-configured",
                    command: "node",
                    args: ["server.js"]
                })
            );
            expect(client).toBe(mockClient);
            expect(mcpRegistry["pre-configured"]).toBe(mockClient);
        });

        test("should throw error when no config found", async () => {
            await expect(createMCPClient("non-existent")).rejects.toThrow(
                "No configuration found for MCP server: non-existent"
            );
        });
    });

    describe("getRegisteredMCPClients", () => {
        test("should return empty array when no clients registered", () => {
            const clients = getRegisteredMCPClients();
            expect(clients).toEqual([]);
        });

        test("should return array of registered client names", () => {
            registerMCPClient("server1", mockClient);
            registerMCPClient("server2", { ...mockClient, name: "server2" } as MCPClient);

            const clients = getRegisteredMCPClients();
            expect(clients.sort()).toEqual(["server1", "server2"]);
        });
    });

    describe("hasMCPClient", () => {
        test("should return true for registered client", () => {
            registerMCPClient("test-server", mockClient);
            
            expect(hasMCPClient("test-server")).toBe(true);
        });

        test("should return false for unregistered client", () => {
            expect(hasMCPClient("non-existent")).toBe(false);
        });
    });

    describe("removeMCPClient", () => {
        test("should remove disconnected client", async () => {
            mockClient.isConnected = false;
            registerMCPClient("test-server", mockClient);

            await removeMCPClient("test-server");

            expect(mockClient.disconnect).not.toHaveBeenCalled();
            expect(mcpRegistry["test-server"]).toBeUndefined();
        });

        test("should disconnect and remove connected client", async () => {
            mockClient.isConnected = true;
            registerMCPClient("test-server", mockClient);

            await removeMCPClient("test-server");

            expect(mockClient.disconnect).toHaveBeenCalled();
            expect(mcpRegistry["test-server"]).toBeUndefined();
        });

        test("should handle removal of non-existent client", async () => {
            await removeMCPClient("non-existent");
            expect(mcpRegistry["non-existent"]).toBeUndefined();
        });
    });

    describe("connectAllMCPClients", () => {
        test("should connect all disconnected clients", async () => {
            const client1 = { ...mockClient, name: "client1", isConnected: false, connect: jest.fn() } as MCPClient;
            const client2 = { ...mockClient, name: "client2", isConnected: false, connect: jest.fn() } as MCPClient;
            const client3 = { ...mockClient, name: "client3", isConnected: true, connect: jest.fn() } as MCPClient;

            registerMCPClient("client1", client1);
            registerMCPClient("client2", client2);
            registerMCPClient("client3", client3);

            await connectAllMCPClients();

            expect(client1.connect).toHaveBeenCalled();
            expect(client2.connect).toHaveBeenCalled();
            expect(client3.connect).not.toHaveBeenCalled(); // Already connected
        });

        test("should handle empty registry", async () => {
            await connectAllMCPClients();
        });
    });

    describe("getAllMCPClients", () => {
        test("should return empty Map when no clients registered", () => {
            const clients = getAllMCPClients();
            expect(clients.size).toBe(0);
        });

        test("should return Map with all registered clients", () => {
            const client1 = { ...mockClient, name: "client1" } as MCPClient;
            const client2 = { ...mockClient, name: "client2" } as MCPClient;

            registerMCPClient("client1", client1);
            registerMCPClient("client2", client2);

            const clients = getAllMCPClients();
            expect(clients.size).toBe(2);
            expect(clients.get("client1")).toBe(client1);
            expect(clients.get("client2")).toBe(client2);
        });
    });

    describe("disconnectAllMCPClients", () => {
        test("should disconnect all connected clients", async () => {
            const client1 = { ...mockClient, name: "client1", isConnected: true, disconnect: jest.fn() } as MCPClient;
            const client2 = { ...mockClient, name: "client2", isConnected: true, disconnect: jest.fn() } as MCPClient;
            const client3 = { ...mockClient, name: "client3", isConnected: false, disconnect: jest.fn() } as MCPClient;

            registerMCPClient("client1", client1);
            registerMCPClient("client2", client2);
            registerMCPClient("client3", client3);

            await disconnectAllMCPClients();

            expect(client1.disconnect).toHaveBeenCalled();
            expect(client2.disconnect).toHaveBeenCalled();
            expect(client3.disconnect).not.toHaveBeenCalled(); // Not connected
        });

        test("should handle empty registry", async () => {
            await disconnectAllMCPClients();
        });
    });
});