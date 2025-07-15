import type { AgentForceAgent } from "../../../agent";
import { OllamaProvider } from "../../../provider/ollama";

/**
 * Executes the agent's provider call to generate response
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<string>} Returns the generated response from the provider
 */
export async function execute(this: AgentForceAgent): Promise<string> {
    // Get agent configuration
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const template = this.getTemplate();
    const userPrompt = this.getUserPrompt();

    // Construct the full system prompt with template if available
    let fullSystemPrompt = systemPrompt;
    if (template && template.trim()) {
        fullSystemPrompt = `${systemPrompt}\n\n${template}`;
    }
    console.log(`Executing with provider: ${provider}, model: ${model}`);
    console.log(`Full system prompt: ${fullSystemPrompt}`);
    console.log(`User prompt: ${userPrompt}`);

    // Store the user prompt in chat history if not already stored
    const chatHistory = this.getChatHistory();
    const lastUserMessage = chatHistory.findLast(msg => msg.role === "user");
    if (!lastUserMessage || lastUserMessage.content !== userPrompt) {
        this.pushToChatHistory("user", userPrompt);
    }

    try {
        let response: string;

        // Execute based on provider
        switch (provider.toLowerCase()) {
            case "ollama":
                // Use the real OllamaProvider for production
                const ollamaProvider = new OllamaProvider(model);
                
                // Use generate method with prompt and system parameters (including template)
                response = await ollamaProvider.generate(userPrompt, fullSystemPrompt);
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

        // Store the assistant response in chat history
        this.pushToChatHistory("assistant", response);
        
        return response;

    } catch (error) {
        // Store error in chat history as well
        const errorMessage = `Error: ${error}`;
        this.pushToChatHistory("assistant", errorMessage);
        
        throw error; // Re-throw to let caller handle the error
    }
}
