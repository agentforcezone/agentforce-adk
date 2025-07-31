import type { AgentForceAgent } from "../../../agent";
import { GoogleProvider } from "../../../provider/google";
import { OllamaProvider } from "../../../provider/ollama";
import { OpenRouterProvider } from "../../../provider/openrouter";

/**
 * Executes the agent's provider call to generate response
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<string>} Returns the generated response from the provider
 */
export async function execute(this: AgentForceAgent): Promise<string> {
    const logger = this.getLogger();
    
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

    // Log the execution details
    logger.debug(
        "Run execute", 
        { agent: this.getName() }, 
        { provider: provider },
        { model: model }, 
        { systemPrompt: fullSystemPrompt }, 
        { userPrompt: userPrompt },
    );
    
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
                // Initialize Ollama provider
                const ollamaProvider = new OllamaProvider(model);
                // Generate response using Ollama
                response = await ollamaProvider.generate(userPrompt, fullSystemPrompt);
                break;

            case "openrouter":
                // Initialize OpenRouter provider
                const openRouterProvider = new OpenRouterProvider(model);
                // Generate response using OpenRouter
                response = await openRouterProvider.generate(userPrompt, fullSystemPrompt);
                break;

            case "google":
                // Initialize Google provider
                const googleProvider = new GoogleProvider(model);
                // Generate response using Google
                response = await googleProvider.generate(userPrompt, fullSystemPrompt);
                break;    

            case "openai":
                response = "OpenAI integration not implemented yet.";
                break;

            case "anthropic":
                response = "Anthropic integration not implemented yet.";
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
        logger.error("Execution error:", errorMessage);
        throw error; // Re-throw to let caller handle the error
    }
}
