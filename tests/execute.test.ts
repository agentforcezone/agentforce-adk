import { describe, expect, test, beforeEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";
import { MockOllamaProvider } from "./mocks/MockOllamaProvider";

// Test-specific execute function that always uses MockOllamaProvider for Ollama
async function testExecute(this: AgentForceAgent): Promise<string> {
    // Get agent configuration
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();

    // Store the user prompt in chat history if not already stored
    const chatHistory = this.getChatHistory();
    const lastUserMessage = chatHistory.findLast(msg => msg.role === 'user');
    if (!lastUserMessage || lastUserMessage.content !== userPrompt) {
        this.pushToChatHistory('user', userPrompt);
    }

    try {
        let response: string;

        // Execute based on provider
        switch (provider.toLowerCase()) {
            case "ollama":
                // Always use MockOllamaProvider for testing
                const ollamaProvider = new MockOllamaProvider(model);
                
                // Use generate method with prompt and system parameters
                response = await ollamaProvider.generate(userPrompt, systemPrompt);
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
        this.pushToChatHistory('assistant', response);
        
        return response;

    } catch (error) {
        // Store error in chat history as well
        const errorMessage = `Error: ${error}`;
        this.pushToChatHistory('assistant', errorMessage);
        
        throw error; // Re-throw to let caller handle the error
    }
}

describe('AgentForceAgent execute Method Tests', () => {
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        agent = new AgentForceAgent({ name: "TestAgent", type: "test-agent" });
    });

    test("should execute and return response with mock", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("you are a funny Pirate")
             .prompt("joke");

        const response = await testExecute.call(agent);
        
        expect(typeof response).toBe("string");
        expect(response).toContain("pirates");
        expect(response).toContain("Mock response");
    });

    test("should handle ollama provider with mock", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("test system")
             .prompt("test");

        const response = await testExecute.call(agent);

        expect(typeof response).toBe("string");
        expect(response).toBe("This is a mock test response. No real API call was made.");
    });

    test("should handle unsupported providers gracefully", async () => {
        // Using any to test unsupported provider
        (agent as any).setProvider("unsupported");
        agent.systemPrompt("test system").prompt("test user prompt");

        const response = await testExecute.call(agent);
        
        expect(response).toBe("Unknown provider integration not available: unsupported");
    });

    test("should work with different system prompts", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a helpful assistant")
             .prompt("hello");

        const response = await testExecute.call(agent);
        
        expect(typeof response).toBe("string");
        expect(response).toBe("Hello there! I'm a mock AI assistant ready to help you.");
    });

    test("should test execute functionality through output method with real execute", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a helpful assistant")
             .prompt("hello");

        const output = await agent.output("json");
        
        expect(typeof output).toBe("object");
        expect((output as any).response).toBeDefined();
        expect((output as any).response.length).toBeGreaterThan(0);
    });
});
