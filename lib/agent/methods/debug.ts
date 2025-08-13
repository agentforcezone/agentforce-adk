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
        name: this.getName(),
        provider: this.getProvider(),
        model: this.getModel(),
        tools: this.getTools(),
        systemPrompt: this.getSystemPrompt(),
        template: this.getTemplate(),
        prompt: this.getUserPrompt(),
    };
    
    // Log debug info
    const logger = this.getLogger();
    logger.debug(debugInfo, "AgentForce Debug");
    
    return this;
}