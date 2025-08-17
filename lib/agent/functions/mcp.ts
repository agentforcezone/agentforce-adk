import type { AgentForceAgent } from "../../agent";
import { createMCPClient, getMCPClient, disconnectAllMCPClients, loadMCPConfig } from "../../mcp/registry";

/**
 * Loads agent-specific MCP configuration from the file path specified in agent config.
 * This function automatically loads the MCP config file when an agent has the mcpConfig property set.
 * 
 * @param agent - The AgentForceAgent instance to load MCP config for
 */
export function loadAgentMCPConfig(agent: AgentForceAgent): void {
    const mcpConfig = agent["getMcpConfig"]();
    if (mcpConfig && typeof mcpConfig === "string") {
        const logger = agent["getLogger"]();
        logger.debug({ mcpConfig }, "Loading agent-specific MCP config");
        loadMCPConfig(mcpConfig);
    }
}

/**
 * Loads and connects to MCP servers defined in the agent configuration.
 * This function is called automatically during agent execution to establish connections
 * to the MCP servers specified in the agent's mcps array.
 * 
 * @param agent - The AgentForceAgent instance to load MCP servers for
 * @returns Promise that resolves when all MCP servers are loaded and connected
 */
export async function loadMCPs(agent: AgentForceAgent): Promise<void> {
    // First load agent-specific MCP config if specified
    loadAgentMCPConfig(agent);
    
    const mcps = agent["getMCPs"]();
    if (!mcps || mcps.length === 0) return;

    const logger = agent["getLogger"]();
    
    for (const mcpName of mcps) {
        try {
            logger.debug({ mcpName }, "Loading MCP server");
            
            // Check if client already exists
            let client = getMCPClient(mcpName);
            
            if (!client) {
                // Create new client from pre-configured servers
                client = await createMCPClient(mcpName);
            }
            
            // Connect if not already connected
            if (!client.isConnected) {
                await client.connect();
                logger.info({ mcpName }, "MCP server connected");
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ mcpName, error }, `Failed to load MCP server: ${errorMessage}`);
        }
    }
}

/**
 * Retrieves available MCP tools from connected servers and converts them to AgentForce tool format.
 * This function fetches tools from all connected MCP servers and formats them for use with LLM providers.
 * 
 * @param agent - The AgentForceAgent instance to get MCP tools for
 * @returns Promise resolving to an array of formatted tool definitions
 */
export async function getMCPTools(agent: AgentForceAgent): Promise<any[]> {
    const mcps = agent["getMCPs"]();
    if (!mcps || mcps.length === 0) return [];

    const logger = agent["getLogger"]();
    const allTools: any[] = [];
    
    for (const mcpName of mcps) {
        try {
            const client = getMCPClient(mcpName);
            if (!client || !client.isConnected) continue;
            
            const mcpTools = await client.listTools();
            
            // Convert MCP tools to AgentForce tool format
            for (const mcpTool of mcpTools) {
                const agentTool = {
                    type: "function" as const,
                    function: {
                        name: `mcp_${mcpName}_${mcpTool.name}`,
                        description: `[MCP:${mcpName}] ${mcpTool.description}`,
                        parameters: mcpTool.inputSchema,
                    },
                };
                allTools.push(agentTool);
            }
            
            logger.debug({ mcpName, toolCount: mcpTools.length }, "Loaded MCP tools");
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ mcpName, error }, `Failed to get MCP tools: ${errorMessage}`);
        }
    }
    
    return allTools;
}

/**
 * Executes MCP tool calls by routing them to the appropriate MCP server.
 * This function handles tool execution requests that come from LLM providers for MCP-based tools.
 * 
 * @param agent - The AgentForceAgent instance executing the tool
 * @param toolName - The MCP tool name in format "mcp_{serverName}_{toolName}"
 * @param args - Arguments to pass to the MCP tool
 * @returns Promise resolving to the tool execution result
 */
export async function executeMCPTool(agent: AgentForceAgent, toolName: string, args: Record<string, any>): Promise<any> {
    const logger = agent["getLogger"]();
    
    // Parse MCP tool name: mcp_{serverName}_{toolName}
    const match = toolName.match(/^mcp_([^_]+)_(.+)$/);
    if (!match) {
        throw new Error(`Invalid MCP tool name format: ${toolName}`);
    }
    
    const [, serverName, mcpToolName] = match;
    
    if (!serverName || !mcpToolName) {
        throw new Error(`Invalid MCP tool name format: ${toolName}`);
    }
    
    try {
        const client = getMCPClient(serverName);
        if (!client) {
            throw new Error(`MCP client not found: ${serverName}`);
        }
        
        if (!client.isConnected) {
            throw new Error(`MCP client not connected: ${serverName}`);
        }
        
        logger.debug({ serverName, mcpToolName, args }, "Executing MCP tool");
        
        const result = await client.callTool(mcpToolName, args);
        
        logger.debug({ serverName, mcpToolName }, "MCP tool executed successfully");
        
        return result;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ serverName, mcpToolName, args, error }, `MCP tool execution failed: ${errorMessage}`);
        throw error;
    }
}

/**
 * Loads MCP resources from connected servers and enriches the agent's context.
 * This function fetches available resources from MCP servers and adds them to the agent's system prompt.
 * 
 * @param agent - The AgentForceAgent instance to enrich with MCP resources
 * @returns Promise that resolves when all resources are loaded and added to context
 */
export async function loadMCPResources(agent: AgentForceAgent): Promise<void> {
    const mcps = agent["getMCPs"]();
    if (!mcps || mcps.length === 0) return;

    const logger = agent["getLogger"]();
    const resourceContents: string[] = [];
    
    for (const mcpName of mcps) {
        try {
            const client = getMCPClient(mcpName);
            if (!client || !client.isConnected) continue;
            
            const resources = await client.listResources();
            
            for (const resource of resources) {
                try {
                    const content = await client.readResource(resource.uri);
                    
                    // Extract text content from resource
                    const textContents = content.contents
                        .filter(c => c.type === "text" && c.text)
                        .map(c => c.text)
                        .join("\n");
                    
                    if (textContents) {
                        resourceContents.push(`\n## MCP Resource: ${resource.name} (${mcpName})\n${textContents}`);
                    }
                    
                } catch {
                    logger.warn({ mcpName, resourceUri: resource.uri }, "Failed to read MCP resource");
                }
            }
            
            logger.debug({ mcpName, resourceCount: resources.length }, "Loaded MCP resources");
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ mcpName, error }, `Failed to load MCP resources: ${errorMessage}`);
        }
    }
    
    // Add resources to system prompt if any were loaded
    if (resourceContents.length > 0) {
        const currentPrompt = agent["getSystemPrompt"]();
        const enrichedPrompt = `${currentPrompt}\n\n# MCP Resources\n${resourceContents.join("\n")}`;
        agent["setSystemPrompt"](enrichedPrompt);
        
        logger.info({ resourceCount: resourceContents.length }, "MCP resources added to context");
    }
}

/**
 * Loads MCP prompts from connected servers and makes them available to the agent.
 * This function fetches available prompts from MCP servers and adds information about them to the system prompt.
 * 
 * @param agent - The AgentForceAgent instance to load MCP prompts for
 * @returns Promise that resolves when all prompts are loaded and added to context
 */
export async function loadMCPPrompts(agent: AgentForceAgent): Promise<void> {
    const mcps = agent["getMCPs"]();
    if (!mcps || mcps.length === 0) return;

    const logger = agent["getLogger"]();
    const promptContents: string[] = [];
    
    for (const mcpName of mcps) {
        try {
            const client = getMCPClient(mcpName);
            if (!client || !client.isConnected) continue;
            
            const prompts = await client.listPrompts();
            
            for (const prompt of prompts) {
                promptContents.push(`\n## Available MCP Prompt: ${prompt.name} (${mcpName})\n${prompt.description}`);
            }
            
            logger.debug({ mcpName, promptCount: prompts.length }, "Loaded MCP prompts");
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error({ mcpName, error }, `Failed to load MCP prompts: ${errorMessage}`);
        }
    }
    
    // Add prompt information to system prompt if any were loaded
    if (promptContents.length > 0) {
        const currentPrompt = agent["getSystemPrompt"]();
        const enrichedPrompt = `${currentPrompt}\n\n# Available MCP Prompts\n${promptContents.join("\n")}`;
        agent["setSystemPrompt"](enrichedPrompt);
        
        logger.info({ promptCount: promptContents.length }, "MCP prompts added to context");
    }
}

/**
 * Disconnects all MCP servers and cleans up resources.
 * This function should be called when agent execution is complete to properly close MCP connections.
 * 
 * @param agent - Optional AgentForceAgent instance for logging context
 * @returns Promise that resolves when all MCP servers are disconnected
 */
export async function disconnectMCPs(agent?: AgentForceAgent): Promise<void> {
    const logger = agent?.["getLogger"]?.();
    
    try {
        if (logger) {
            logger.debug("Disconnecting all MCP servers");
        }
        
        await disconnectAllMCPClients(logger);
        
        if (logger) {
            logger.info("All MCP servers disconnected");
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (logger) {
            logger.error({ error }, `Failed to disconnect MCP servers: ${errorMessage}`);
        }
    }
}