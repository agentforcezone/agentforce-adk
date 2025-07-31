import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe('AgentForceWorkflow sharedStore Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow"
        });
        
        testAgent = new AgentForceAgent({ name: "TestAgent" });
    });

    test("should return workflow instance for method chaining", () => {
        const result = workflow.sharedStore("key1", "value1");
        expect(result).toBe(workflow);
        expect(result).toBeInstanceOf(AgentForceWorkflow);
    });

    test("should work with method chaining", () => {
        const result = workflow
            .sharedStore("key1", "value1")
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should handle string values", () => {
        const result = workflow.sharedStore("stringKey", "hello world");
        expect(result).toBe(workflow);
    });

    test("should handle number values", () => {
        const result = workflow.sharedStore("numberKey", 42);
        expect(result).toBe(workflow);
    });

    test("should handle object values", () => {
        const objectValue = { name: "test", count: 5 };
        const result = workflow.sharedStore("objectKey", objectValue);
        expect(result).toBe(workflow);
    });

    test("should handle array values", () => {
        const arrayValue = [1, 2, 3, "test"];
        const result = workflow.sharedStore("arrayKey", arrayValue);
        expect(result).toBe(workflow);
    });

    test("should handle boolean values", () => {
        const result = workflow.sharedStore("boolKey", true);
        expect(result).toBe(workflow);
    });

    test("should handle null values", () => {
        const result = workflow.sharedStore("nullKey", null);
        expect(result).toBe(workflow);
    });

    test("should handle undefined values", () => {
        const result = workflow.sharedStore("undefinedKey", undefined);
        expect(result).toBe(workflow);
    });

    test("should be chainable with other workflow methods", () => {
        const result = workflow
            .sharedStore("config", { mode: "test" })
            .registerAgent(testAgent)
            .sequence([testAgent])
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should handle multiple shared store calls", () => {
        const result = workflow
            .sharedStore("key1", "value1")
            .sharedStore("key2", "value2")
            .sharedStore("key3", { nested: "object" });
        
        expect(result).toBe(workflow);
    });

    test("should work with complex workflow scenarios", () => {
        const result = workflow
            .sharedStore("data", ["item1", "item2"])
            .registerAgent(testAgent)
            .iterate("data", testAgent)
            .sharedStore("processed", true)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should handle overwriting existing keys", () => {
        const result = workflow
            .sharedStore("key", "value1")
            .sharedStore("key", "value2"); // Overwrite
        
        expect(result).toBe(workflow);
    });

    test("should work with empty string keys", () => {
        const result = workflow.sharedStore("", "emptyKeyValue");
        expect(result).toBe(workflow);
    });
});