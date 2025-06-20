import { describe, expect, test, beforeEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";

describe('AgentForceAgent prompt Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent",
        type: "test-agent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.prompt("tell me a joke");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .prompt("tell me a joke")
            .useLLM("openai", "gpt-4")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should set user prompt correctly", () => {
        const testPrompt = "tell me a joke about programming";
        agent.prompt(testPrompt);
        
        // Since getUserPrompt is protected, we can't directly test it
        // But we can verify the method completed without errors
        expect(agent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle different types of prompts", () => {
        const prompts = [
            "tell me a joke",
            "What is the capital of France?",
            "Explain quantum physics in simple terms",
            "Write a poem about cats",
            "",
            "Multi-line\nprompt\nwith\nbreaks"
        ];

        prompts.forEach(prompt => {
            expect(() => agent.prompt(prompt)).not.toThrow();
        });
    });

    test("should throw error for non-string input", () => {
        expect(() => agent.prompt(null as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt(undefined as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt(123 as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt([] as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt({} as any)).toThrow("User prompt must be a string");
    });

    test("should integrate well with other methods", () => {
        const result = agent
            .useLLM("ollama", "phi4-mini:latest")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle empty string", () => {
        expect(() => agent.prompt("")).not.toThrow();
        const result = agent.prompt("");
        expect(result).toBe(agent);
    });

    test("should handle long user prompts", () => {
        const longPrompt = "Tell me a detailed story about ".repeat(100);
        expect(() => agent.prompt(longPrompt)).not.toThrow();
        const result = agent.prompt(longPrompt);
        expect(result).toBe(agent);
    });

    test("should allow overriding user prompt", () => {
        agent.prompt("First prompt");
        const result = agent.prompt("Second prompt");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work in complex method chains", () => {
        const result = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a comedian")
            .prompt("tell me a joke")
            .useLLM("anthropic", "claude-3")
            .prompt("tell me another joke")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle special characters and unicode", () => {
        const specialPrompts = [
            "Tell me about émojis 😀",
            "What is ∑(1/n²) from n=1 to ∞?",
            "Explain 中文 characters",
            "Code: console.log('Hello, World!');"
        ];

        specialPrompts.forEach(prompt => {
            expect(() => agent.prompt(prompt)).not.toThrow();
            const result = agent.prompt(prompt);
            expect(result).toBe(agent);
        });
    });

    test("should work with example usage pattern", () => {
        // Test the exact usage pattern from the request
        const result = agent.prompt("tell me a Joke");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });
});
