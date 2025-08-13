import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../../lib/agent";
import type { AgentConfig } from "../../../lib/types";

describe("AgentForceAgent prompt Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.prompt("test prompt");
        expect(result).toBe(agent);
    });

    test("should work with simple text prompt", () => {
        const result = agent.prompt("What is the capital of France?");
        expect(result).toBe(agent);
    });

    test("should work with empty prompt", () => {
        const result = agent.prompt("");
        expect(result).toBe(agent);
    });

    test("should work with long prompt", () => {
        const longPrompt = "This is a very long prompt that contains multiple sentences and detailed instructions for the AI agent to process and understand properly.";
        const result = agent.prompt(longPrompt);
        expect(result).toBe(agent);
    });

    test("should work with multiline prompt", () => {
        const multilinePrompt = `This is a multiline prompt
        with multiple lines
        and different formatting.`;
        const result = agent.prompt(multilinePrompt);
        expect(result).toBe(agent);
    });

    test("should support method chaining", () => {
        const result = agent
            .prompt("test prompt")
            .debug()
            .systemPrompt("test system")
            .useLLM("ollama", "gemma3:4b");
        expect(result).toBe(agent);
    });

    test("should allow multiple prompt calls (last one wins)", () => {
        const result = agent
            .prompt("first prompt")
            .prompt("second prompt")
            .prompt("final prompt");
        expect(result).toBe(agent);
    });

    test("should throw error for non-string prompt", () => {
        expect(() => agent.prompt(123 as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt(null as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt(undefined as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt({} as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt([] as any)).toThrow("User prompt must be a string");
        expect(() => agent.prompt(true as any)).toThrow("User prompt must be a string");
    });
});