import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../lib/workflow";

describe('AgentForceWorkflow run Method Tests', () => {
    let workflow: AgentForceWorkflow;

    beforeEach(() => {
        const workflowConfig: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(workflowConfig);
    });

    test("should run the workflow", async () => {
        // @ts-ignore - setTaskList is protected
        workflow.setTaskList([
            { id: 1, description: "Task 1", status: "pending" },
            { id: 2, description: "Task 2", status: "pending" },
        ]);

        const result = await workflow.run();
        expect(Array.isArray(result)).toBe(true);
    });

    test("should handle an empty task list", async () => {
        const result = await workflow.run();
        expect(Array.isArray(result)).toBe(true);
    });
});
