import ollama from 'ollama';

// Type for Ollama provider interface
export interface OllamaProviderInterface {
    generate(prompt: string, system?: string): Promise<string>;
    getModel(): string;
}

/**
 * Ollama provider implementation for the AgentForce SDK
 * Handles communication with locally running Ollama models
 */
export class OllamaProvider implements OllamaProviderInterface {
    private model: string;

    constructor(model: string) {
        this.model = model;
    }

    /**
     * Generate response using the Ollama model
     * @param prompt - The user prompt to send to the model
     * @param system - Optional system prompt to override the model's default
     * @returns Promise with the model's response
     */
    async generate(prompt: string, system?: string): Promise<string> {
        try {
            const response = await ollama.generate({
                model: this.model,
                prompt: prompt,
                system: system,
            });
            return response.response;
        } catch (error) {
            throw new Error(`Ollama provider error: ${error}`);
        }
    }

    /**
     * Chat with the Ollama model
     * @param messages - Array of messages for the conversation
     * @returns Promise with the model's response
     */
    async chat(messages: Array<{ role: string; content: string }>) {
        try {
            const response = await ollama.chat({
                model: this.model,
                messages: messages,
            });
            return response.message.content;
        } catch (error) {
            throw new Error(`Ollama provider error: ${error}`);
        }
    }

    /**
     * Get the current model name
     */
    getModel(): string {
        return this.model;
    }

    /**
     * Set a new model
     */
    setModel(model: string): void {
        this.model = model;
    }
}
