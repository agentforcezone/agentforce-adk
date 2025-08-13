import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../../lib/agent";
import type { AgentConfig } from "../../../lib/types";

describe("AgentForceAgent systemPrompt Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.systemPrompt("You are a helpful assistant");
        expect(result).toBe(agent);
    });

    test("should work with simple system prompt", () => {
        const result = agent.systemPrompt("You are a helpful AI assistant");
        expect(result).toBe(agent);
    });

    test("should work with empty system prompt", () => {
        const result = agent.systemPrompt("");
        expect(result).toBe(agent);
    });

    test("should work with detailed system prompt", () => {
        const systemPrompt = "You are an expert software developer with knowledge of TypeScript, Node.js, and Jest testing frameworks.";
        const result = agent.systemPrompt(systemPrompt);
        expect(result).toBe(agent);
    });

    test("should work with multiline system prompt", () => {
        const systemPrompt = `You are a helpful AI assistant.
        Your task is to help users with their questions.
        Always be polite and professional.`;
        const result = agent.systemPrompt(systemPrompt);
        expect(result).toBe(agent);
    });

    test("should support method chaining", () => {
        const result = agent
            .systemPrompt("You are a helpful assistant")
            .prompt("Hello")
            .debug()
            .useLLM("ollama", "gemma3:4b");
        expect(result).toBe(agent);
    });

    test("should allow multiple systemPrompt calls (last one wins)", () => {
        const result = agent
            .systemPrompt("First system prompt")
            .systemPrompt("Second system prompt")
            .systemPrompt("Final system prompt");
        expect(result).toBe(agent);
    });
});