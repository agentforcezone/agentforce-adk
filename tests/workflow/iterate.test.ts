import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe('AgentForceWorkflow iterate Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow"
        });
        
        testAgent = new AgentForceAgent({
            name: "TestAgent"
        });
    });

    test("should return workflow instance for method chaining", () => {
        const items = ["item1", "item2", "item3"];
        const result = workflow.iterate(items, testAgent);
        expect(result).toBe(workflow);
        expect(result).toBeInstanceOf(AgentForceWorkflow);
    });

    test("should work with method chaining", () => {
        const items = ["a", "b", "c"];
        const result = workflow.iterate(items, testAgent).debug();
        expect(result).toBe(workflow);
    });

    test("should handle array of items", () => {
        const items = [1, 2, 3, 4, 5];
        const result = workflow.iterate(items, testAgent);
        expect(result).toBe(workflow);
    });

    test("should handle string key for shared store", () => {
        const storeKey = "itemList";
        const result = workflow.iterate(storeKey, testAgent);
        expect(result).toBe(workflow);
    });

    test("should handle empty array", () => {
        const items: any[] = [];
        const result = workflow.iterate(items, testAgent);
        expect(result).toBe(workflow);
    });

    test("should handle different data types in array", () => {
        const items = ["string", 42, { key: "value" }, true];
        const result = workflow.iterate(items, testAgent);
        expect(result).toBe(workflow);
    });

    test("should be chainable with other workflow methods", () => {
        const items = ["test1", "test2"];
        const result = workflow
            .registerAgent(testAgent)
            .iterate(items, testAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should work with multiple iterate calls", () => {
        const items1 = ["batch1"];
        const items2 = ["batch2"];
        
        const result = workflow
            .iterate(items1, testAgent)
            .iterate(items2, testAgent);
        
        expect(result).toBe(workflow);
    });
});