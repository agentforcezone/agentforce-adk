import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../lib/workflow";
import { AgentForceAgent, type AgentConfig } from "../lib/agent";

describe('AgentForceWorkflow addAgent Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let agent: AgentForceAgent;

    beforeEach(() => {
        const workflowConfig: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(workflowConfig);

        const agentConfig: AgentConfig = { name: "TestAgent" };
        agent = new AgentForceAgent(agentConfig);
    });

    test("should add an agent to the workflow", () => {
        workflow.registerAgent(agent);
        // @ts-ignore - getAgents is protected
        const agents = workflow.getAgents();
        expect(agents).toHaveLength(1);
        expect(agents[0].name).toBe("TestAgent");
        expect(agents[0].agent).toBe(agent);
    });

    test("should return the workflow instance for method chaining", () => {
        const result = workflow.registerAgent(agent);
        expect(result).toBe(workflow);
    });
});
