/**
 * Mock implementation of OllamaProvider for testing
 * This replaces the actual Ollama API calls with mock responses
 */
export class MockOllamaProvider {
    private model: string;

    constructor(model: string) {
        this.model = model;
    }

    /**
     * Mock chat method that returns predefined responses based on input
     */
    async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
        const userMessage = messages.find(msg => msg.role === 'user')?.content || '';
        
        // Return different mock responses based on the input
        if (userMessage.toLowerCase().includes('joke')) {
            return "Why don't pirates use computers? Because they prefer to navigate by the stars! Arrr! (Mock response)";
        } else if (userMessage.toLowerCase().includes('hello')) {
            return "Hello there! I'm a mock AI assistant ready to help you.";
        } else if (userMessage === '') {
            return "I'm here and ready to assist! Please let me know what you need.";
        } else if (userMessage.toLowerCase().includes('test')) {
            return "This is a mock test response. No real API call was made.";
        } else {
            return `Mock response to: "${userMessage}"`;
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
