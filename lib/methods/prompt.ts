import type AgentForceAgent from '@agentforce-sdk/agent';

/**
 * Sets the user prompt for the agent
 * @param this - The AgentForceAgent instance (bound context)
 * @param prompt - The user prompt to set for the agent
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function prompt(this: AgentForceAgent, prompt: string): AgentForceAgent {
    // Validate input
    if (typeof prompt !== 'string') {
        throw new Error('User prompt must be a string');
    }
    
    // Set the user prompt using the internal setter
    this.setUserPrompt(prompt);
    
    // Return 'this' for method chaining
    return this;
}
