import {describe, expect, test} from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "TestAgent",
    type: "TestType"
};
describe('AgentForceAgent Class Test', () => {
    test("Constructing a new agent", () => {
        const agent = new AgentForceAgent(agentConfig);
        expect(agent.name).toBe("TestAgent");
        expect(agent.type).toBe("TestType");
    });

    test("Setting and getting model", () => {
        const agent = new AgentForceAgent(agentConfig);
        agent.setModel("testModel");
        expect(agent.getModel()).toBe("testModel");
    });

    test("Setting and getting provider", () => {
        const agent = new AgentForceAgent(agentConfig);
        agent.setProvider("testProvider");
        expect(agent.getProvider()).toBe("testProvider");
    });
});