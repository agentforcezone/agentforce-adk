import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import * as executeModule from "../../lib/agent/methods/async/execute";

describe('AgentForceAgent getResponse Method Tests', () => {
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestAgent"
        };
        agent = new AgentForceAgent(config);
    });

    test("should return string response (terminal method)", async () => {
        const result = await agent
            .useLLM("anthropic", "claude-3")  // Use non-Ollama provider to avoid API calls
            .systemPrompt("You are a helpful assistant")
            .prompt("Hello")
            .getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
    });

    test("should work as terminal method (no chaining after)", async () => {
        const setupAgent = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .prompt("Tell me a joke");

        const result = await setupAgent.getResponse();

        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
        
        // Agent should still be accessible for debugging
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with method chaining", async () => {
        const result = await agent
            .useLLM("ollama", "gemma3:4b")  // Use ollama to avoid timeouts
            .systemPrompt("You are a test agent")
            .prompt("Generate a test response")
            .getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    }, 10000);  // Increase timeout to 10 seconds

    test("should return only LLM response without metadata", async () => {
        agent
            .useLLM("anthropic", "claude-3")
            .systemPrompt("You are a helpful assistant")
            .prompt("Hello world");
        
        const response = await agent.getResponse();
        const output = await agent.output("json");
        
        // getResponse should return just the string
        expect(typeof response).toBe("string");
        
        // output should return structured object
        expect(typeof output).toBe("object");
        expect(output).toHaveProperty("response");
        expect(output).toHaveProperty("agent");
        expect(output).toHaveProperty("timestamp");
    });

    test("should work with different providers", async () => {
        const providers = [
            { provider: "ollama" as const, model: "gemma3:4b" },  // Use working provider
            { provider: "openai" as const, model: "gpt-4" },
            { provider: "anthropic" as const, model: "claude-3" }
        ];

        for (const config of providers) {
            const testAgent = new AgentForceAgent({
                name: "TestAgent"
            });
            
            const result = await testAgent
                .useLLM(config.provider, config.model)
                .systemPrompt("You are a helpful assistant")
                .prompt("Hello")
                .getResponse();
            
            expect(typeof result).toBe("string");
            expect(result).not.toBe(testAgent);
        }
    }, 15000);  // Increase timeout to 15 seconds

    test("should handle empty prompts", async () => {
        const result = await agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("")
            .prompt("")
            .getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    });

    test("should maintain chat history", async () => {
        await agent
            .useLLM("anthropic", "claude-3")
            .systemPrompt("You are helpful")
            .prompt("First message")
            .getResponse();

        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(2);
        expect(history[0]).toEqual({ role: 'user', content: 'First message' });
        expect(history[1].role).toBe('assistant');
        expect(typeof history[1].content).toBe('string');
    });

    test("should work with multiple getResponse calls", async () => {
        const setupAgent = agent
            .useLLM("ollama", "gemma3:4b")  // Use ollama instead of google
            .systemPrompt("You are helpful");
        
        // First call
        const result1 = await setupAgent
            .prompt("First question")
            .getResponse();
        
        // Second call
        const result2 = await setupAgent
            .prompt("Second question")
            .getResponse();
        
        expect(typeof result1).toBe("string");
        expect(typeof result2).toBe("string");
        expect(result1).not.toBe(agent);
        expect(result2).not.toBe(agent);
        
        // Chat history should have 4 entries (2 user, 2 assistant)
        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(4);
    }, 15000);  // Increase timeout to 15 seconds

    test("should return different response type than output method", async () => {
        const setupAgent = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are helpful")
            .prompt("Test prompt");
        
        const response = await setupAgent.getResponse();
        const jsonOutput = await setupAgent.output("json");
        const textOutput = await setupAgent.output("text");
        
        // getResponse returns raw string
        expect(typeof response).toBe("string");
        
        // output methods return formatted results
        expect(typeof jsonOutput).toBe("object");
        expect(typeof textOutput).toBe("string");
        
        // All should be different from agent instance
        expect(response).not.toBe(agent);
        expect(jsonOutput).not.toBe(agent);
        expect(textOutput).not.toBe(agent);
    });
});

describe('AgentForceAgent getResponse Error Handling Tests', () => {
    let agent: AgentForceAgent;
    let executeSpy: any;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestAgent"
        };
        agent = new AgentForceAgent(config);
        
        // Spy on the execute function
        executeSpy = spyOn(executeModule, "execute");
    });

    afterEach(() => {
        // Clean up spy after each test
        if (executeSpy) {
            executeSpy.mockRestore();
        }
    });

    test("should handle execute errors and return error from chat history (covers lines 14,16-17,19-21)", async () => {
        // Mock execute to throw an error
        const testError = new Error("Network connection failed");
        executeSpy.mockRejectedValue(testError);
        
        // Manually add an error message to chat history that execute would normally add
        agent.pushToChatHistory("user", "Test user prompt");
        agent.pushToChatHistory("assistant", "Error: Network connection failed");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test user prompt");

        const response = await agent.getResponse();
        
        // Should return the error message from chat history instead of throwing
        expect(response).toBe("Error: Network connection failed");
        expect(executeSpy).toHaveBeenCalled();
    });

    test("should throw original error when no error message in chat history", async () => {
        // Mock execute to throw an error
        const testError = new Error("Connection timeout");
        executeSpy.mockRejectedValue(testError);
        
        // Add non-error message to chat history
        agent.pushToChatHistory("user", "Test prompt");
        agent.pushToChatHistory("assistant", "Normal response without error");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        // Should throw the original error since there's no error message in history
        await expect(agent.getResponse()).rejects.toThrow("Connection timeout");
        expect(executeSpy).toHaveBeenCalled();
    });

    test("should handle empty chat history during error", async () => {
        // Mock execute to throw an error
        const testError = new Error("API key not found");
        executeSpy.mockRejectedValue(testError);
        
        // Don't add anything to chat history - it should be empty
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        // Should throw the original error since chat history is empty
        await expect(agent.getResponse()).rejects.toThrow("API key not found");
        expect(executeSpy).toHaveBeenCalled();
    });

    test("should handle assistant message that doesn't start with Error:", async () => {
        // Mock execute to throw an error
        const testError = new Error("Unknown error");
        executeSpy.mockRejectedValue(testError);
        
        // Add assistant message that doesn't start with "Error:"
        agent.pushToChatHistory("user", "Test prompt");
        agent.pushToChatHistory("assistant", "Something went wrong but not formatted as error");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        // Should throw the original error since the assistant message doesn't start with "Error:"
        await expect(agent.getResponse()).rejects.toThrow("Unknown error");
        expect(executeSpy).toHaveBeenCalled();
    });

    test("should handle multiple messages and find the latest assistant error", async () => {
        // Mock execute to throw an error
        const testError = new Error("Multiple errors");
        executeSpy.mockRejectedValue(testError);
        
        // Add multiple messages with the latest being an error
        agent.pushToChatHistory("user", "First prompt");
        agent.pushToChatHistory("assistant", "First response");
        agent.pushToChatHistory("user", "Second prompt");
        agent.pushToChatHistory("assistant", "Error: Latest error message");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        const response = await agent.getResponse();
        
        // Should return the latest error message
        expect(response).toBe("Error: Latest error message");
        expect(executeSpy).toHaveBeenCalled();
    });

    test("should handle non-Error exceptions", async () => {
        // Mock execute to throw a non-Error object
        executeSpy.mockRejectedValue("String error instead of Error object");
        
        // Add error message to chat history
        agent.pushToChatHistory("user", "Test prompt");
        agent.pushToChatHistory("assistant", "Error: String error instead of Error object");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        const response = await agent.getResponse();
        
        // Should return the error message from chat history
        expect(response).toBe("Error: String error instead of Error object");
        expect(executeSpy).toHaveBeenCalled();
    });
});
