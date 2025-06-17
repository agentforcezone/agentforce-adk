import AgentForceAgent from "@agentforce-sdk/agent";

/**
 * Connects the AI agent to a Language Learning Model.
 * Sets the provider and model for the agent using separate parameters.
 *
 * @memberof AgentForceAgent
 * @function useLLM
 * @param {string} provider - The AI provider name (e.g., "ollama", "openai", "anthropic", "google")
 * @param {string} model - The model name (e.g., "phi4-mini:latest", "gpt-3.5-turbo", "claude-3")
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 * 
 * @example
 * ```typescript
 * const agent = new AgentForceAgent(config);
 * 
 * // Set provider and model separately
 * agent.useLLM("ollama", "phi4-mini:latest");
 * 
 * // Different providers
 * agent.useLLM("openai", "gpt-3.5-turbo");
 * agent.useLLM("anthropic", "claude-3");
 * 
 * // Method chaining
 * agent.useLLM("google", "gemini-pro").useLLM("ollama", "llama2");
 * ```
 */
export function useLLM(this: AgentForceAgent, provider = "ollama", model = "gemma3:4b"): AgentForceAgent {
    // Update agent settings with provided parameters
    this.setProvider(provider);
    this.setModel(model);

    return this;
}