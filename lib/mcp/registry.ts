import type { MCPClient, MCPRegistry, MCPServerConfig } from "../types";
import { McpClient } from "./mcpClient";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { defaultLogger } from "../logger";

/**
 * Central registry for MCP clients
 * Maps MCP server names to their client instances
 */
export const mcpRegistry: MCPRegistry = {};

/**
 * Loaded MCP server configurations from config file and defaults
 */
let mcpServerConfigs: Record<string, MCPServerConfig> = {};


/**
 * Load MCP server configurations from config file
 * @param configPath - Path to the MCP config file (defaults to ./mcp.config.json or MCP_CONFIG env var)
 */
export function loadMCPConfig(configPath?: string): void {
    const envConfigPath = process.env.MCP_CONFIG;
    const defaultConfigPath = resolve(process.cwd(), "mcp.config.json");
    const finalConfigPath = configPath || envConfigPath || defaultConfigPath;
    
    try {
        if (existsSync(finalConfigPath)) {
            const configContent = readFileSync(finalConfigPath, "utf-8");
            const config = JSON.parse(configContent);
            
            if (config.mcpServers && typeof config.mcpServers === "object") {
                // Process each server config and resolve environment variables
                const processedConfigs: Record<string, MCPServerConfig> = {};
                
                for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
                    const typedConfig = serverConfig as any;
                    
                    // Resolve environment variables in env object
                    const resolvedEnv: Record<string, string> = {};
                    if (typedConfig.env) {
                        for (const [key, value] of Object.entries(typedConfig.env)) {
                            const stringValue = String(value);
                            // Replace ${VAR_NAME} with actual environment variable
                            resolvedEnv[key] = stringValue.replace(/\$\{([^}]+)\}/g, (_, varName) => {
                                return process.env[varName] || "";
                            });
                        }
                    }
                    
                    processedConfigs[name] = {
                        name,
                        type: typedConfig.type || "local",
                        command: typedConfig.command,
                        args: typedConfig.args || [],
                        url: typedConfig.url,
                        env: resolvedEnv,
                        workingDirectory: typedConfig.workingDirectory,
                        timeout: typedConfig.timeout || 10000,
                    };
                }
                
                // Set the loaded configurations
                mcpServerConfigs = processedConfigs;
                defaultLogger.info(`[MCP] Loaded ${Object.keys(processedConfigs).length} server configs from ${finalConfigPath}`);
            } else {
                defaultLogger.error(`[MCP] Invalid config format in ${finalConfigPath}`);
                mcpServerConfigs = {};
            }
        } else {
            defaultLogger.error(`[MCP] Config file not found at ${finalConfigPath}`);
            mcpServerConfigs = {};
        }
    } catch (error) {
        defaultLogger.error(`[MCP] Error loading config from ${finalConfigPath}:`, error);
        mcpServerConfigs = {};
    }
}

/**
 * Get the current MCP server configurations
 * @returns Record of server name to configuration
 */
export function getMCPServerConfigs(): Record<string, MCPServerConfig> {
    return mcpServerConfigs;
}

// Auto-load config on module initialization
loadMCPConfig();

/**
 * Get an MCP client by name
 * @param name - The name of the MCP server
 * @returns The MCP client instance or undefined if not found
 */
export function getMCPClient(name: string): MCPClient | undefined {
    return mcpRegistry[name];
}

/**
 * Register an MCP client in the registry
 * @param name - The name of the MCP server
 * @param client - The MCP client instance
 */
export function registerMCPClient(name: string, client: MCPClient): void {
    mcpRegistry[name] = client;
}

/**
 * Create and register an MCP client from config
 * @param name - The name of the MCP server
 * @param config - Optional custom config, uses pre-configured if not provided
 * @returns The created MCP client
 */
export async function createMCPClient(name: string, config?: MCPServerConfig): Promise<MCPClient> {
    const serverConfig = config || getMCPServerConfigs()[name];
    
    if (!serverConfig) {
        throw new Error(`No configuration found for MCP server: ${name}`);
    }

    const client = new McpClient(serverConfig);
    registerMCPClient(name, client);
    
    return client;
}

/**
 * Get all registered MCP client names
 * @returns Array of MCP client names
 */
export function getRegisteredMCPClients(): string[] {
    return Object.keys(mcpRegistry);
}

/**
 * Check if an MCP client is registered
 * @param name - The name of the MCP server
 * @returns true if the client is registered
 */
export function hasMCPClient(name: string): boolean {
    return name in mcpRegistry;
}

/**
 * Remove an MCP client from the registry
 * @param name - The name of the MCP server
 * @param logger - Optional logger for debug messages
 */
export async function removeMCPClient(name: string, logger?: any): Promise<void> {
    const client = mcpRegistry[name];
    if (client && client.isConnected) {
        await client.disconnect();
    }
    delete mcpRegistry[name];
    if (logger) {
        logger.debug(`[MCP] Removed client ${name} from registry`);
    }
}

/**
 * Connect all registered MCP clients
 */
export async function connectAllMCPClients(): Promise<void> {
    const clients = Object.values(mcpRegistry);
    await Promise.all(clients.map(client => {
        if (!client.isConnected) {
            return client.connect();
        }
        return Promise.resolve();
    }));
}

/**
 * Get all registered MCP clients as a Map
 * @returns Map of MCP client names to client instances
 */
export function getAllMCPClients(): Map<string, MCPClient> {
    return new Map(Object.entries(mcpRegistry));
}

/**
 * Disconnect all registered MCP clients
 */
export async function disconnectAllMCPClients(logger?: any): Promise<void> {
    const clients = Object.values(mcpRegistry);
    const loggerToUse = logger || defaultLogger;
    
    loggerToUse.debug(`[MCP] Starting disconnect of ${clients.length} MCP clients`);
    
    // Add global timeout for all disconnections to prevent hanging
    const disconnectPromise = Promise.all(clients.map(client => {
        if (client.isConnected) {
            return client.disconnect();
        }
        return Promise.resolve();
    }));
    
    const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new Error("Global MCP disconnect timeout")), 5000);
        timer.unref(); // Don't keep the event loop alive
    });
    
    try {
        await Promise.race([disconnectPromise, timeoutPromise]);
        loggerToUse.debug("[MCP] All MCP clients disconnected successfully");
    } catch (error) {
        // Log timeout but continue - we want to mark clients as disconnected
        loggerToUse.debug(`[MCP] Global disconnect timeout: ${error}`);
        
        // Force mark all clients as disconnected and try to kill any hanging processes
        for (const client of clients) {
            (client as any).isConnectedState = false;
            
            // Try to force cleanup the transport
            const transport = (client as any).transport;
            if (transport) {
                try {
                    const process = transport.process || transport._process;
                    if (process && typeof process.kill === "function") {
                        loggerToUse.debug("[MCP] Force killing hanging process for client");
                        process.kill("SIGTERM");
                        const killTimer = setTimeout(() => {
                            if (!process.killed) {
                                process.kill("SIGKILL");
                                loggerToUse.debug("[MCP] Force killed hanging process with SIGKILL");
                            }
                        }, 1000);
                        killTimer.unref(); // Don't keep the event loop alive
                    }
                } catch (killError) {
                    // Ignore kill errors
                    loggerToUse.debug(`[MCP] Kill error ignored: ${killError}`);
                }
                (client as any).transport = undefined;
            }
        }
    }
    
    // Clear the registry after disconnection
    const registrySize = Object.keys(mcpRegistry).length;
    for (const name of Object.keys(mcpRegistry)) {
        delete mcpRegistry[name];
    }
    loggerToUse.debug(`[MCP] Cleared ${registrySize} clients from registry`);
}