import type { AgentForceAgent } from "../../agent";

/**
 * Sets the system prompt for the agent
 * @param this - The AgentForceAgent instance (bound context)
 * @param prompt - The system prompt to set for the agent
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function systemPrompt(this: AgentForceAgent, prompt: string): AgentForceAgent {
    // Validate input
    if (typeof prompt !== "string") {
        throw new Error("System prompt must be a string");
    }
    
    // Set the system prompt using the internal setter
    this.setSystemPrompt(prompt);
    
    // Return 'this' for method chaining
    return this;
}
