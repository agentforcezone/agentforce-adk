import AgentForceAgent from "@agentforce-sdk/agent";

/**
 * Logs debug information about the agent and returns the agent instance for chaining.
 * This method is chainable and logs agent details to the console.
 *
 * @memberof AgentForceAgent
 * @function debug
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function debug(this: AgentForceAgent): AgentForceAgent {
    const debugInfo = {
        name: this.getName(),
        type: this.getType(),
        provider: this.getProvider(),
        model: this.getModel()
    };
    
    // Log debug info to console for development purposes
    console.log('AgentForce Debug:', debugInfo);
    
    return this;
}