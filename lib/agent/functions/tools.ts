import type { AgentForceAgent } from "../../agent";
import type { Tool } from "../../tools/types";
import { getTool, hasTool } from "../../tools/registry";

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
 * @internal
 */
export async function executeTool(
    toolName: string, 
    args: Record<string, any>,
): Promise<any> {
    const tool = getTool(toolName);
    
    if (!tool) {
        throw new Error(`Tool ${toolName} not found in registry`);
    }
    
    try {
        const result = await tool.execute(args);
        return result;
    } catch (error: any) {
        throw new Error(`Tool execution failed for ${toolName}: ${error.message}`);
    }
}