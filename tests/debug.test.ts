import {describe, expect, test} from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../lib/agent";

const agentConfig: AgentConfig = {
    name: "TestAgent"
};

describe('AgentForceAgent Debug Method Tests', () => {
    test("Debug method returns agent instance for chaining", () => {
        const agent = new AgentForceAgent(agentConfig);
        const result = agent.debug();
        
        // Should return the agent instance itself
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("Debug method can be chained with other methods", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test method chaining - debug is chainable since it's in lib/methods/*
        const result = agent
            .debug()
            .useLLM("ollama", "gemma3:4b")
            .debug();
        
        expect(result).toBe(agent);
    });

    test("Debug method works with useLLM chaining", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        const result = agent
            .useLLM("openai", "gpt-4")
            .debug();
        
        expect(result).toBe(agent);
    });

    test("Debug method works with logger functionality", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test that debug method can be called without errors
        // Since the logger is internal, we just test the method returns properly
        const result = agent.debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });
});
