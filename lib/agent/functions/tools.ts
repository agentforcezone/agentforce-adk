import type { AgentForceAgent } from "../../agent";
import type { Tool } from "../../types";
import { getTool, hasTool } from "../../tools/registry";
import { executeMCPTool } from "./mcp";

/**
 * Internal function to load tools defined in agent config
 * This function is called internally during agent execution
 * @internal
 */
export function loadTools(agent: AgentForceAgent): Tool[] {
    const tools = agent["getTools"]();
    const logger = agent["getLogger"]();
    const loadedTools: Tool[] = [];
    
    if (!tools || tools.length === 0) {
        return loadedTools;
    }
    
    logger.debug({ requestedTools: tools }, "Loading tools for agent");
    
    for (const toolName of tools) {
        if (hasTool(toolName)) {
            const tool = getTool(toolName);
            if (tool) {
                loadedTools.push(tool.definition);
                logger.debug({ tool: toolName }, "Tool loaded successfully");
            }
        } else {
            logger.warn({ tool: toolName }, "Tool not found in registry");
        }
    }
    
    logger.info({ loadedCount: loadedTools.length }, "Tools loaded for agent");
    return loadedTools;
}

/**
 * Execute a tool call with the provided arguments
 * This function handles both regular AgentForce tools and MCP tools
 * @internal
 */
export async function executeTool(
    toolName: string, 
    args: Record<string, any>,
    agent?: AgentForceAgent,
    logger?: any,
): Promise<any> {
    // Check if this is an MCP tool (prefixed with "mcp_")
    if (toolName.startsWith("mcp_")) {
        if (!agent) {
            const errorMessage = "Agent instance required for MCP tool execution";
            if (logger) {
                logger.error(errorMessage);
            }
            return { error: errorMessage };
        }
        
        try {
            return await executeMCPTool(agent, toolName, args);
        } catch (error: any) {
            const errorMessage = `MCP tool execution failed for ${toolName}: ${error.message}`;
            if (logger) {
                logger.error(errorMessage);
            }
            return { error: errorMessage };
        }
    }
    
    // Handle regular AgentForce tools
    const tool = getTool(toolName);
    
    if (!tool) {
        const errorMessage = `Tool ${toolName} not found in registry`;
        if (logger) {
            logger.error(errorMessage);
        }
        return { error: errorMessage };
    }
    
    try {
        const result = await tool.execute(args);
        return result;
    } catch (error: any) {
        const errorMessage = `Tool execution failed for ${toolName}: ${error.message}`;
        if (logger) {
            logger.error(errorMessage);
        }
        return { error: errorMessage };
    }
}