import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../lib/workflow";
describe('AgentForceWorkflow prompt Method Tests', () => {
    let workflow: AgentForceWorkflow;
    
    beforeEach(() => {
        const config: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(config);
    });

    test("should set the user prompt", () => {
        const promptText = "This is a test prompt";
        workflow.prompt(promptText);
        // @ts-ignore - getUserPrompt is protected
        expect(workflow.getUserPrompt()).toBe(promptText);
    });

    test("should return the workflow instance for method chaining", () => {
        const result = workflow.prompt("Another test prompt");
        expect(result).toBe(workflow);
    });
});
