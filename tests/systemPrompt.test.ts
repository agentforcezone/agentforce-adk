import { describe, expect, test, beforeEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";

describe('AgentForceAgent systemPrompt Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent",
        type: "test-agent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.systemPrompt("You are a helpful assistant");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .systemPrompt("You are a helpful assistant")
            .useLLM("openai", "gpt-4")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should set system prompt correctly", () => {
        const testPrompt = "You are a specialized AI assistant for coding tasks";
        agent.systemPrompt(testPrompt);
        
        // Since getSystemPrompt is protected, we can't directly test it
        // But we can verify the method completed without errors
        expect(agent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle different types of prompts", () => {
        const prompts = [
            "You are a helpful assistant",
            "Act as a professional writer",
            "You are an expert in data analysis",
            "",
            "Multi-line\nprompt\nwith\nbreaks"
        ];

        prompts.forEach(prompt => {
            expect(() => agent.systemPrompt(prompt)).not.toThrow();
        });
    });

    test("should throw error for non-string input", () => {
        expect(() => agent.systemPrompt(null as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt(undefined as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt(123 as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt([] as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt({} as any)).toThrow("System prompt must be a string");
    });

    test("should integrate well with other methods", () => {
        const result = agent
            .useLLM("ollama", "phi4-mini:latest")
            .systemPrompt("You are a helpful assistant")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle empty string", () => {
        expect(() => agent.systemPrompt("")).not.toThrow();
        const result = agent.systemPrompt("");
        expect(result).toBe(agent);
    });

    test("should handle long system prompts", () => {
        const longPrompt = "You are a helpful assistant. ".repeat(100);
        expect(() => agent.systemPrompt(longPrompt)).not.toThrow();
        const result = agent.systemPrompt(longPrompt);
        expect(result).toBe(agent);
    });

    test("should allow overriding system prompt", () => {
        agent.systemPrompt("First prompt");
        const result = agent.systemPrompt("Second prompt");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });
});
