import AgentForceAgent from "@agentforce-sdk/agent";

/**
 * Connects the AI agent to a Language Learning Model.
 * Parses the model string and updates the agent's provider and model settings.
 *
 * @memberof AgentForceAgent
 * @function useLLM
 * @param {string} model - Model specification in format "provider/model" or "provider:model" (e.g. "ollama/gemma3:4b", "ollama:microsoft/phi4:latest", "openai/gpt-3.5-turbo")
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 * 
 * @example
 * ```typescript
 * const agent = new AgentForceAgent(config);
 * 
 * // Using colon separator
 * agent.useLLM("ollama:microsoft/phi4:latest");
 * 
 * // Using slash separator  
 * agent.useLLM("openai/gpt-3.5-turbo");
 * ```
 */
export function useLLM(this: AgentForceAgent, model = "ollama/gemma3:4b"): AgentForceAgent {
    let providerName = "ollama";
    let modelName = model;

    // Parse model string - support both colon and slash separators
    if (model.includes(":") && !model.includes("/")) {
        // Handle format like "ollama:gemma3:4b" (colon only)
        const colonParts = model.split(":");
        if (colonParts.length > 1 && colonParts[0]) {
            providerName = colonParts[0];
            modelName = colonParts.slice(1).join(":");
        }
    } else if (model.includes("/") && !model.includes(":")) {
        // Handle format like "openai/gpt-3.5-turbo" (slash only)
        const slashParts = model.split("/");
        if (slashParts.length > 1 && slashParts[0]) {
            providerName = slashParts[0];
            modelName = slashParts.slice(1).join("/");
        }
    } else if (model.includes("/") && model.includes(":")) {
        // Handle mixed format like "ollama/gemma3:4b" or "ollama:microsoft/phi4:latest"
        // Check which separator comes first to determine the parsing strategy
        const slashIndex = model.indexOf("/");
        const colonIndex = model.indexOf(":");
        
        if (slashIndex < colonIndex) {
            // Slash comes first: "ollama/gemma3:4b"
            const slashParts = model.split("/");
            if (slashParts.length > 1 && slashParts[0]) {
                providerName = slashParts[0];
                modelName = slashParts.slice(1).join("/");
            }
        } else {
            // Colon comes first: "ollama:microsoft/phi4:latest"
            const colonParts = model.split(":");
            if (colonParts.length > 1 && colonParts[0]) {
                providerName = colonParts[0];
                modelName = colonParts.slice(1).join(":");
            }
        }
    }

    // Update agent settings
    this.setProvider(providerName);
    this.setModel(modelName);

    return this;
}