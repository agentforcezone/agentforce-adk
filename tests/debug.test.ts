import {describe, expect, test} from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "TestAgent",
    type: "TestType"
};

describe('AgentForceAgent Debug Function Test', () => {
    test("Debug function returns correct information", () => {
        const agent = new AgentForceAgent(agentConfig);
        agent.setModel("testModel");
        agent.setProvider("testProvider");
        
        const debugInfo = agent.debug();
        
        expect(debugInfo).toEqual({
            name: "TestAgent",
            type: "TestType",
            provider: "testProvider",
            model: "testModel"
        });
    });

    test("Debug function returns default values when not set", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        const debugInfo = agent.debug();
        
        expect(debugInfo).toEqual({
            name: "TestAgent",
            type: "TestType",
            provider: "ollama",
            model: "gemma3:4b"
        });
    });
});
