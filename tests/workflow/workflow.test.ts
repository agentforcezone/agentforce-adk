import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../../lib/workflow";

describe('AgentForceWorkflow Tests', () => {
    let workflow: AgentForceWorkflow;
    
    beforeEach(() => {
        const config: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(config);
    });

    test("should return the correct name", () => {
        expect(workflow.getName()).toBe("TestWorkflow");
    });

    test("should have a default logger type of json", () => {
        expect(workflow.getLoggerType()).toBe("json");
    });
});
