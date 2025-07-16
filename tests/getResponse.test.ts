import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../lib/agent";

describe('AgentForceAgent getResponse Method Tests', () => {
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestAgent",
            type: "test-agent",
            logger: "json"
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
            .useLLM("google", "gemini-pro")
            .systemPrompt("You are a test agent")
            .prompt("Generate a test response")
            .getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    });

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
            { provider: "openai" as const, model: "gpt-4" },
            { provider: "anthropic" as const, model: "claude-3" },
            { provider: "google" as const, model: "gemini-pro" },
        ];

        for (const config of providers) {
            const testAgent = new AgentForceAgent({
                name: "TestAgent",
                type: "test-agent"
            });
            
            const result = await testAgent
                .useLLM(config.provider, config.model)
                .systemPrompt("You are a helpful assistant")
                .prompt("Hello")
                .getResponse();
            
            expect(typeof result).toBe("string");
            expect(result).not.toBe(testAgent);
        }
    });

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
            .useLLM("google", "gemini-pro")
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
    });

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
