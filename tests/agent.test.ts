import { describe, expect, test, beforeEach } from "@jest/globals";

// Import just the agent class directly to avoid import.meta issues
import { AgentForceAgent } from "../lib/agent";
import type { AgentConfig } from "../lib/types";

describe("AgentForceAgent Basic Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should create agent instance", () => {
        expect(agent).toBeInstanceOf(AgentForceAgent);
    });

    test("should return agent for method chaining - debug", () => {
        const result = agent.debug();
        expect(result).toBe(agent);
    });

    test("should return agent for method chaining - prompt", () => {
        const result = agent.prompt("test prompt");
        expect(result).toBe(agent);
    });

    test("should return agent for method chaining - systemPrompt", () => {
        const result = agent.systemPrompt("test system prompt");
        expect(result).toBe(agent);
    });

    test("should support method chaining", () => {
        const result = agent
            .debug()
            .prompt("test prompt")
            .systemPrompt("test system prompt");
        expect(result).toBe(agent);
    });
});