import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe('AgentForceWorkflow onFail Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent: AgentForceAgent;
    let failAgent: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow"
        });
        
        testAgent = new AgentForceAgent({ name: "TestAgent" });
        failAgent = new AgentForceAgent({ name: "FailAgent" });
    });

    test("should return workflow instance for method chaining", () => {
        const result = workflow
            .sequence([testAgent])
            .onFail(failAgent);
        
        expect(result).toBe(workflow);
        expect(result).toBeInstanceOf(AgentForceWorkflow);
    });

    test("should work with method chaining", () => {
        const result = workflow
            .sequence([testAgent])
            .onFail(failAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should handle onFail after sequence", () => {
        const result = workflow
            .registerAgent(testAgent)
            .sequence([testAgent])
            .onFail(failAgent);
        
        expect(result).toBe(workflow);
    });

    test("should handle onFail after parallel", () => {
        const result = workflow
            .parallel([testAgent])
            .onFail(failAgent);
        
        expect(result).toBe(workflow);
    });

    test("should handle onFail after iterate", () => {
        const items = ["item1", "item2"];
        const result = workflow
            .iterate(items, testAgent)
            .onFail(failAgent);
        
        expect(result).toBe(workflow);
    });

    test("should handle onFail when no previous step exists", () => {
        // This should log a warning but not throw
        const result = workflow.onFail(failAgent);
        expect(result).toBe(workflow);
    });

    test("should be chainable with other workflow methods", () => {
        const result = workflow
            .registerAgent(testAgent)
            .sequence([testAgent])
            .onFail(failAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should work with both onSuccess and onFail", () => {
        const successAgent = new AgentForceAgent({ name: "SuccessAgent" });
        
        const result = workflow
            .sequence([testAgent])
            .onSuccess(successAgent)
            .onFail(failAgent);
        
        expect(result).toBe(workflow);
    });

    test("should work with multiple steps and handlers", () => {
        const agent2 = new AgentForceAgent({ name: "Agent2" });
        const fail2 = new AgentForceAgent({ name: "Fail2" });
        
        const result = workflow
            .sequence([testAgent])
            .onFail(failAgent)
            .parallel([agent2])
            .onFail(fail2);
        
        expect(result).toBe(workflow);
    });

    test("should work in complex workflow scenarios", () => {
        const result = workflow
            .registerAgent(testAgent)
            .registerAgent(failAgent)
            .sequence([testAgent])
            .onFail(failAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });
});