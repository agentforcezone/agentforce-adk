import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../../lib/workflow";

describe('AgentForceWorkflow run Method Tests', () => {
    let workflow: AgentForceWorkflow;

    beforeEach(() => {
        const workflowConfig: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(workflowConfig);
    });

    test("should run the workflow", async () => {
        // Create a test agent
        const { AgentForceAgent } = await import("../../lib/agent");
        const testAgent = new AgentForceAgent({ name: "TestAgent" });
        
        // Set up a simple workflow execution plan with a sequence
        workflow.prompt("Test prompt").sequence([testAgent]);

        const result = await workflow.run();
        expect(result).toHaveProperty("finalOutput");
        expect(result).toHaveProperty("sharedStore");
        // The output will be the result of running the agent, not just the prompt
        expect(typeof result.finalOutput).toBe("string");
    });

    test("should handle an empty execution plan", async () => {
        const result = await workflow.run();
        expect(result).toHaveProperty("finalOutput");
        expect(result).toHaveProperty("sharedStore");
        expect(result.finalOutput).toBeUndefined();
    });
});
