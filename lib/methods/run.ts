import type AgentForceAgent from '@agentforce-sdk/agent';
import { OllamaProvider } from '../provider/ollama';

/**
 * Executes the agent's chain by making the actual API call to the configured provider
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<AgentForceAgent>} Returns the agent instance for method chaining
 */
export async function run(this: AgentForceAgent): Promise<AgentForceAgent> {
    // Get agent configuration
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    const agentName = this.getName();

    // Store the user prompt in chat history
    this.pushToChatHistory('user', userPrompt);

    try {
        let response: string;

        // Execute based on provider
        switch (provider.toLowerCase()) {
            case "ollama":
                // Use the real OllamaProvider for production
                const ollamaProvider = new OllamaProvider(model);
                
                // Prepare messages for Ollama
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ];

                response = await ollamaProvider.chat(messages);
                break;

            case "openai":
                response = "OpenAI integration not implemented yet.";
                break;

            case "anthropic":
                response = "Anthropic integration not implemented yet.";
                break;

            case "google":
                response = "Google integration not implemented yet.";
                break;

            default:
                response = `Unknown provider integration not available: ${provider}`;
                break;
        }

        // Store the assistant response in chat history for all providers
        this.pushToChatHistory('assistant', response);

    } catch (error) {
        // Store error in chat history as well
        const errorMessage = `Error: ${error}`;
        this.pushToChatHistory('assistant', errorMessage);
    }

    // Return 'this' for method chaining
    return this;
}
