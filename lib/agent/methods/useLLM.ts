import type { AgentForceAgent } from "../../agent";
import { OllamaProvider } from "../../provider/ollama";
import { OpenRouterProvider } from "../../provider/openrouter";
import { GoogleProvider } from "../../provider/google";
import type { ProviderType, ModelConfig } from "../../types";

/**
 * Connects the AI agent to a Language Learning Model.
 * Sets the provider and model for the agent using separate parameters.
 *
 * @memberof AgentForceAgent
 * @function useLLM
 * @param {ProviderType} provider - The AI provider name (e.g., "ollama", "openai", "anthropic", "google", "openrouter")
 * @param {string} model - The model name (e.g., "phi4-mini:latest", "gpt-3.5-turbo", "claude-3", "moonshotai/kimi-k2:free")
 * @param {ModelConfig} [modelConfig] - Optional model configuration (temperature, maxTokens, etc.)
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 * 
 * @example
 * ```typescript
 * const agent = new AgentForceAgent(config);
 * 
 * // Set provider and model separately
 * agent.useLLM("ollama", "phi4-mini:latest");
 * 
 * // With model configuration
 * agent.useLLM("ollama", "phi4-mini:latest", { temperature: 0.8, maxTokens: 8192 });
 * 
 * // Different providers
 * agent.useLLM("openai", "gpt-3.5-turbo");
 * agent.useLLM("anthropic", "claude-3");
 * agent.useLLM("openrouter", "moonshotai/kimi-k2:free");
 * 
 * // Method chaining
 * agent.useLLM("google", "gemini-1.5-flash").useLLM("ollama", "llama2");
 * ```
 */
export function useLLM(this: AgentForceAgent, provider: ProviderType = "ollama", model = "gemma3:4b", modelConfig?: ModelConfig): AgentForceAgent {
    // Update agent settings with provided parameters
    this.setProvider(provider);
    this.setModel(model);
    this.setModelConfig(modelConfig); // persist model configuration on agent

    // Initialize the appropriate provider
    switch ((provider || "ollama").toLowerCase()) {
        case "ollama":
            // Initialize Ollama provider
            new OllamaProvider(model, modelConfig);
            break;
        
        case "openrouter":
            // Initialize OpenRouter provider
            new OpenRouterProvider(model);
            break;
        
        case "google":
            new GoogleProvider(model);
            break;
        
        case "openai":
            console.log(`⚠️  OpenAI provider not implemented yet. Model: ${model}`);
            break;
        
        case "anthropic":
            console.log(`⚠️  Anthropic provider not implemented yet. Model: ${model}`);
            break;
        
        default:
            console.log(`⚠️  Unknown provider: ${provider}. Model: ${model}`);
            break;
    }

    return this;
}