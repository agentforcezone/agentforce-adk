import {describe, expect, test} from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "TestAgent",
    type: "TestType"
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
            .useLLM("testProvider", "testModel")
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

    test("Debug method logs information (console output test)", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Mock console.log to capture debug output
        const originalLog = console.log;
        let loggedMessage = '';
        let loggedData = {};
        
        console.log = (message: string, data: any) => {
            loggedMessage = message;
            loggedData = data;
        };
        
        agent.debug();
        
        expect(loggedMessage).toBe('AgentForce Debug:');
        expect(loggedData).toEqual({
            name: "TestAgent",
            type: "TestType",
            provider: "ollama",
            model: "gemma3:4b"
        });
        
        // Restore original console.log
        console.log = originalLog;
    });
});
