import type { AgentForceAgent } from "../../agent";

/**
 * Logs debug information about the agent and returns the agent instance for chaining.
 * This method is chainable and logs agent details using the configured logger.
 *
 * @memberof AgentForceAgent
 * @function debug
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function debug(this: AgentForceAgent): AgentForceAgent {
    const debugInfo = {
        name: (this as any)["getName"](),
        provider: (this as any)["getProvider"](),
        model: (this as any)["getModel"](),
        tools: (this as any)["getTools"](),
        systemPrompt: (this as any)["getSystemPrompt"](),
        template: (this as any)["getTemplate"](),
    };
    
    // Log debug info
    const logger = this.getLogger();
    logger.debug(debugInfo, "AgentForce Debug");
    
    return this;
}