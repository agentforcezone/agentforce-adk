import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";
import { AgentForceAgent } from "../../lib/agent";
import { MockOllamaProvider } from "../mocks/MockOllamaProvider";
import { OllamaProvider } from "../../lib/provider/ollama";
import { OpenRouterProvider } from "../../lib/provider/openrouter";
import { GoogleProvider } from "../../lib/provider/google";

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

describe('AgentForceAgent Real Execute Method Coverage Tests', () => {
    let agent: AgentForceAgent;
    let ollamaSpy: any;
    let openRouterSpy: any;
    let googleSpy: any;
    
    beforeEach(() => {
        agent = new AgentForceAgent({ name: "TestAgent", type: "test-agent" });
        
        // Mock the providers to avoid real API calls
        ollamaSpy = spyOn(OllamaProvider.prototype, "generate").mockResolvedValue("Mocked Ollama response");
        openRouterSpy = spyOn(OpenRouterProvider.prototype, "generate").mockResolvedValue("Mocked OpenRouter response");
        googleSpy = spyOn(GoogleProvider.prototype, "generate").mockResolvedValue("Mocked Google response");
    });

    afterEach(() => {
        // Clean up spies after each test
        if (ollamaSpy) ollamaSpy.mockRestore();
        if (openRouterSpy) openRouterSpy.mockRestore();
        if (googleSpy) googleSpy.mockRestore();
    });

    test("should handle template concatenation with system prompt (covers line 24)", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a helpful assistant")
             .prompt("Hello");

        // Manually set a template to trigger line 24
        const template = "This is a test template with instructions.";
        agent.setTemplate(template);

        const response = await agent.execute();
        
        expect(response).toBe("Mocked Ollama response");
        expect(ollamaSpy).toHaveBeenCalled();
        
        // Verify the system prompt was concatenated with template
        const callArgs = ollamaSpy.mock.calls[0];
        const fullSystemPrompt = callArgs[1]; // Second parameter is system prompt
        expect(fullSystemPrompt).toContain("You are a helpful assistant");
        expect(fullSystemPrompt).toContain(template);
    });

    test("should handle OpenRouter provider (covers lines 56,58,60-61)", async () => {
        agent.useLLM("openrouter", "anthropic/claude-3.5-sonnet")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        const response = await agent.execute();
        
        expect(response).toBe("Mocked OpenRouter response");
        expect(openRouterSpy).toHaveBeenCalledWith("Test user prompt", "Test system prompt");
    });

    test("should handle Google provider (covers lines 63,65,67)", async () => {
        agent.useLLM("google", "gemini-pro")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        const response = await agent.execute();
        
        expect(response).toBe("Mocked Google response");
        expect(googleSpy).toHaveBeenCalledWith("Test user prompt", "Test system prompt");
    });

    test("should handle unknown provider (covers line 79)", async () => {
        // Set an unknown provider directly
        (agent as any).setProvider("unknown-provider");
        agent.systemPrompt("Test system prompt").prompt("Test user prompt");

        const response = await agent.execute();
        
        expect(response).toBe("Unknown provider integration not available: unknown-provider");
        
        // Verify it was stored in chat history
        const chatHistory = agent.getChatHistory();
        const lastMessage = chatHistory[chatHistory.length - 1];
        expect(lastMessage.role).toBe("assistant");
        expect(lastMessage.content).toBe("Unknown provider integration not available: unknown-provider");
    });

    test("should handle provider execution errors (covers lines 88,90-93)", async () => {
        // Make the Ollama provider throw an error
        ollamaSpy.mockRejectedValue(new Error("Network connection failed"));
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        await expect(agent.execute()).rejects.toThrow("Network connection failed");
        
        // Verify error was stored in chat history
        const chatHistory = agent.getChatHistory();
        const lastMessage = chatHistory[chatHistory.length - 1];
        expect(lastMessage.role).toBe("assistant");
        expect(lastMessage.content).toContain("Error: Error: Network connection failed");
    });

    test("should handle non-Error exceptions in catch block", async () => {
        // Make the provider throw a non-Error object
        ollamaSpy.mockRejectedValue("String error instead of Error object");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        await expect(agent.execute()).rejects.toBe("String error instead of Error object");
        
        // Verify error was stored in chat history
        const chatHistory = agent.getChatHistory();
        const lastMessage = chatHistory[chatHistory.length - 1];
        expect(lastMessage.role).toBe("assistant");
        expect(lastMessage.content).toBe("Error: String error instead of Error object");
    });

    test("should handle OpenAI provider (covers lines 70-72)", async () => {
        agent.useLLM("openai", "gpt-4")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        const response = await agent.execute();
        
        expect(response).toBe("OpenAI integration not implemented yet.");
        
        // Verify it was stored in chat history
        const chatHistory = agent.getChatHistory();
        const lastMessage = chatHistory[chatHistory.length - 1];
        expect(lastMessage.role).toBe("assistant");
        expect(lastMessage.content).toBe("OpenAI integration not implemented yet.");
    });

    test("should handle Anthropic provider (covers lines 74-75)", async () => {
        agent.useLLM("anthropic", "claude-3")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        const response = await agent.execute();
        
        expect(response).toBe("Anthropic integration not implemented yet.");
        
        // Verify it was stored in chat history
        const chatHistory = agent.getChatHistory();
        const lastMessage = chatHistory[chatHistory.length - 1];
        expect(lastMessage.role).toBe("assistant");
        expect(lastMessage.content).toBe("Anthropic integration not implemented yet.");
    });

    test("should handle OpenRouter with template (covers template + OpenRouter)", async () => {
        // Clear previous spy calls
        openRouterSpy.mockClear();
        
        const template = "Use this template: {{instruction}}";
        agent.setTemplate(template);
        
        agent.useLLM("openrouter", "anthropic/claude-3.5-sonnet")
             .systemPrompt("Base system prompt")
             .prompt("Test prompt");

        const response = await agent.execute();
        
        expect(response).toBe("Mocked OpenRouter response");
        expect(openRouterSpy).toHaveBeenCalled();
        
        // Verify system prompt includes template
        const callArgs = openRouterSpy.mock.calls[0];
        const fullSystemPrompt = callArgs[1];
        expect(fullSystemPrompt).toContain("Base system prompt");
        expect(fullSystemPrompt).toContain(template);
    });

    test("should handle Google with template (covers template + Google)", async () => {
        // Clear previous spy calls
        googleSpy.mockClear();
        
        const template = "Follow these instructions carefully.";
        agent.setTemplate(template);
        
        agent.useLLM("google", "gemini-pro")
             .systemPrompt("Base system prompt")
             .prompt("Test prompt");

        const response = await agent.execute();
        
        expect(response).toBe("Mocked Google response");
        expect(googleSpy).toHaveBeenCalled();
        
        // Verify system prompt includes template
        const callArgs = googleSpy.mock.calls[0];
        const fullSystemPrompt = callArgs[1];
        expect(fullSystemPrompt).toContain("Base system prompt");
        expect(fullSystemPrompt).toContain(template);
    });

    test("should not duplicate user messages in chat history", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        // Manually add the same user message to chat history first
        agent.pushToChatHistory("user", "Test prompt");
        const initialChatLength = agent.getChatHistory().length;
        
        await agent.execute();
        
        // Should not add another duplicate user message
        const finalChatHistory = agent.getChatHistory();
        const userMessages = finalChatHistory.filter(msg => msg.role === "user" && msg.content === "Test prompt");
        expect(userMessages.length).toBe(1); // Should only have one user message
    });

    test("should add user message to chat history when not present", async () => {
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("New unique prompt");

        const initialChatLength = agent.getChatHistory().length;
        
        await agent.execute();
        
        // Should add the user message since it wasn't there before
        const finalChatHistory = agent.getChatHistory();
        const userMessages = finalChatHistory.filter(msg => msg.role === "user" && msg.content === "New unique prompt");
        expect(userMessages.length).toBe(1);
        
        // Should also add the assistant response
        const assistantMessages = finalChatHistory.filter(msg => msg.role === "assistant");
        expect(assistantMessages.length).toBeGreaterThan(0);
    });
});
