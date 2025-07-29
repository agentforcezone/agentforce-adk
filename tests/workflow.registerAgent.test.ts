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
        // Since agents array is protected and there's no getter,
        // we can only test that registerAgent returns the workflow instance
        const result = workflow.registerAgent(agent);
        expect(result).toBe(workflow);
        
        // We can test the functionality indirectly by running the workflow
        // with the registered agent
    });

    test("should return the workflow instance for method chaining", () => {
        const result = workflow.registerAgent(agent);
        expect(result).toBe(workflow);
    });
});
