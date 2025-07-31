import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe('AgentForceWorkflow onSuccess Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent: AgentForceAgent;
    let successAgent: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow"
        });
        
        testAgent = new AgentForceAgent({ name: "TestAgent" });
        successAgent = new AgentForceAgent({ name: "SuccessAgent" });
    });

    test("should return workflow instance for method chaining", () => {
        const result = workflow
            .sequence([testAgent])
            .onSuccess(successAgent);
        
        expect(result).toBe(workflow);
        expect(result).toBeInstanceOf(AgentForceWorkflow);
    });

    test("should work with method chaining", () => {
        const result = workflow
            .sequence([testAgent])
            .onSuccess(successAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should handle onSuccess after sequence", () => {
        const result = workflow
            .registerAgent(testAgent)
            .sequence([testAgent])
            .onSuccess(successAgent);
        
        expect(result).toBe(workflow);
    });

    test("should handle onSuccess after parallel", () => {
        const result = workflow
            .parallel([testAgent])
            .onSuccess(successAgent);
        
        expect(result).toBe(workflow);
    });

    test("should handle onSuccess after iterate", () => {
        const items = ["item1", "item2"];
        const result = workflow
            .iterate(items, testAgent)
            .onSuccess(successAgent);
        
        expect(result).toBe(workflow);
    });

    test("should handle onSuccess when no previous step exists", () => {
        // This should log a warning but not throw
        const result = workflow.onSuccess(successAgent);
        expect(result).toBe(workflow);
    });

    test("should be chainable with other workflow methods", () => {
        const result = workflow
            .registerAgent(testAgent)
            .sequence([testAgent])
            .onSuccess(successAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should work with multiple steps and handlers", () => {
        const agent2 = new AgentForceAgent({ name: "Agent2" });
        const success2 = new AgentForceAgent({ name: "Success2" });
        
        const result = workflow
            .sequence([testAgent])
            .onSuccess(successAgent)
            .parallel([agent2])
            .onSuccess(success2);
        
        expect(result).toBe(workflow);
    });

    test("should work in complex workflow scenarios", () => {
        const result = workflow
            .registerAgent(testAgent)
            .registerAgent(successAgent)
            .sequence([testAgent])
            .onSuccess(successAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });
});