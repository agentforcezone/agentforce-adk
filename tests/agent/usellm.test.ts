import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../lib/agent";
import type { AgentConfig } from "../../lib/types";

describe("AgentForceAgent useLLM Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.useLLM("ollama", "gemma3:4b");
        expect(result).toBe(agent);
    });

    test("should work with default parameters (ollama, gemma3:4b)", () => {
        const result = agent.useLLM();
        expect(result).toBe(agent);
    });

    test("should work with ollama provider", () => {
        const result = agent.useLLM("ollama", "llama2");
        expect(result).toBe(agent);
    });

    test("should work with openrouter provider", () => {
        const result = agent.useLLM("openrouter", "anthropic/claude-3-haiku");
        expect(result).toBe(agent);
    });

    test("should work with google provider", () => {
        const result = agent.useLLM("google", "gemini-1.5-flash");
        expect(result).toBe(agent);
    });

    test("should work with model configuration", () => {
        const modelConfig = { temperature: 0.8, maxTokens: 8192 };
        const result = agent.useLLM("ollama", "gemma3:4b", modelConfig);
        expect(result).toBe(agent);
    });

    test("should support method chaining with other methods", () => {
        const result = agent
            .useLLM("ollama", "gemma3:4b")
            .debug()
            .prompt("test prompt")
            .systemPrompt("test system prompt");
        expect(result).toBe(agent);
    });

    test("should support multiple useLLM calls in chain", () => {
        const result = agent
            .useLLM("ollama", "llama2")
            .useLLM("google", "gemini-1.5-flash");
        expect(result).toBe(agent);
    });

    test("should handle null provider and default to ollama", () => {
        const result = agent.useLLM(null as any, "gemma3:4b");
        expect(result).toBe(agent);
    });

    test("should handle undefined provider and default to ollama", () => {
        const result = agent.useLLM(undefined as any, "gemma3:4b");
        expect(result).toBe(agent);
    });

    test("should handle openai provider (not implemented)", () => {
        const result = agent.useLLM("openai", "gpt-3.5-turbo");
        expect(result).toBe(agent);
    });

    test("should handle anthropic provider (not implemented)", () => {
        const result = agent.useLLM("anthropic", "claude-3");
        expect(result).toBe(agent);
    });

    test("should handle unknown provider", () => {
        const result = agent.useLLM("unknown-provider" as any, "some-model");
        expect(result).toBe(agent);
    });
});