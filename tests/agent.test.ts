import {describe, expect, test} from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "TestAgent",
    type: "TestType"
};

describe('AgentForceAgent Class Test', () => {
    test("Constructing a new agent", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test that the agent was created successfully
        expect(agent).toBeInstanceOf(AgentForceAgent);
        
        // Test that the agent has the expected methods
        expect(typeof agent.useLLM).toBe("function");
        expect(typeof agent.debug).toBe("function");
        expect(typeof agent.serve).toBe("function");
        expect(typeof agent.systemPrompt).toBe("function");
    });

    test("Agent methods should be chainable", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test method chaining
        const result = agent.useLLM("test-provider", "test-model");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("Agent should support complex method chaining", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test complex method chaining
        const result = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });
});