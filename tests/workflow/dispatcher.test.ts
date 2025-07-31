import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../../lib/workflow";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

describe('AgentForceWorkflow dispatcher Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let agent: AgentForceAgent;

    beforeEach(() => {
        const workflowConfig: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(workflowConfig);

        const agentConfig: AgentConfig = { name: "TestAgent" };
        agent = new AgentForceAgent(agentConfig);
    });

    test("should set the dispatcher agent", () => {
        workflow.dispatcher(agent);
        // @ts-ignore - getDispatcher is protected
        expect(workflow.getDispatcher()).toBe(agent);
    });

    test("should return the workflow instance for method chaining", () => {
        const result = workflow.dispatcher(agent);
        expect(result).toBe(workflow);
    });
});
