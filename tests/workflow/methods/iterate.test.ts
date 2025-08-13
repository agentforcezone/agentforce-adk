import { describe, expect, test, beforeEach } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";

// Import just the iterate function directly to avoid importing the full workflow module
import { iterate } from "../../../lib/workflow/methods/iterate";

// Create a minimal mock workflow interface for testing
interface MockWorkflow {
    executionPlan: Array<{
        type: string;
        description: string;
        payload: any;
    }>;
}

// Create a minimal mock agent interface for testing
interface MockAgent {
    getName(): string;
}

describe("AgentForceWorkflow iterate Method Tests", () => {
    let mockWorkflow: MockWorkflow;
    let mockAgent: MockAgent;

    beforeEach(() => {
        // Create mock workflow with empty execution plan
        mockWorkflow = {
            executionPlan: []
        };

        // Create mock agent
        mockAgent = {
            getName: () => "TestAgent"
        };
    });

    test("should return workflow instance for method chaining", () => {
        const items = ["item1", "item2", "item3"];
        const result = iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);
        
        expect(result).toBe(mockWorkflow);
    });

    test("should add iterate step to execution plan with array of items", () => {
        const items = ["item1", "item2", "item3"];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "iterate",
            description: "Iterate over items with agent",
            payload: { items, agent: mockAgent }
        });
    });

    test("should add iterate step to execution plan with string key", () => {
        const itemsKey = "myDataList";
        
        iterate.call(mockWorkflow as any, itemsKey, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "iterate",
            description: "Iterate over items with agent",
            payload: { items: itemsKey, agent: mockAgent }
        });
    });

    test("should handle empty array", () => {
        const items: any[] = [];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "iterate",
            description: "Iterate over items with agent",
            payload: { items: [], agent: mockAgent }
        });
    });

    test("should handle array of numbers", () => {
        const items = [1, 2, 3, 4, 5];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toEqual(items);
    });

    test("should handle array of objects", () => {
        const items = [
            { id: 1, name: "Object 1" },
            { id: 2, name: "Object 2" },
            { id: 3, name: "Object 3" }
        ];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toEqual(items);
        expect(mockWorkflow.executionPlan[0]?.payload.agent).toBe(mockAgent);
    });

    test("should append to existing execution plan", () => {
        // Pre-populate execution plan with an existing step
        mockWorkflow.executionPlan.push({
            type: "existing",
            description: "Existing step",
            payload: "some data"
        });

        const items = ["new", "items"];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "existing",
            description: "Existing step",
            payload: "some data"
        });
        expect(mockWorkflow.executionPlan[1]).toEqual({
            type: "iterate",
            description: "Iterate over items with agent",
            payload: { items, agent: mockAgent }
        });
    });

    test("should work with method chaining", () => {
        const items1 = ["first", "batch"];
        const items2 = "secondBatchKey";

        const result1 = iterate.call(mockWorkflow as any, items1, mockAgent as unknown as AgentForceAgent);
        const result2 = iterate.call(result1 as any, items2, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "iterate",
            description: "Iterate over items with agent",
            payload: { items: items1, agent: mockAgent }
        });
        expect(mockWorkflow.executionPlan[1]).toEqual({
            type: "iterate",
            description: "Iterate over items with agent",
            payload: { items: items2, agent: mockAgent }
        });
        expect(result2).toBe(mockWorkflow);
    });

    test("should preserve agent references in payload", () => {
        const items = ["test", "data"];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        // Verify the exact same agent instance is stored
        expect(mockWorkflow.executionPlan[0]?.payload.agent).toBe(mockAgent);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toBe(items);
    });

    test("should have correct step type and description", () => {
        const items = ["test"];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        const step = mockWorkflow.executionPlan[0];
        expect(step?.type).toBe("iterate");
        expect(step?.description).toBe("Iterate over items with agent");
    });

    test("should maintain execution plan structure", () => {
        const items = ["structural", "test"];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        const step = mockWorkflow.executionPlan[0];
        expect(step).toHaveProperty("type");
        expect(step).toHaveProperty("description");
        expect(step).toHaveProperty("payload");
        expect(typeof step?.type).toBe("string");
        expect(typeof step?.description).toBe("string");
        expect(step?.payload).toHaveProperty("items");
        expect(step?.payload).toHaveProperty("agent");
    });

    test("should handle mixed data types in array", () => {
        const items = ["string", 42, { key: "value" }, true, null];
        
        iterate.call(mockWorkflow as any, items, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toEqual(items);
    });

    test("should handle empty string as key", () => {
        const itemsKey = "";
        
        iterate.call(mockWorkflow as any, itemsKey, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toBe("");
    });

    test("should handle large arrays", () => {
        // Create a large array to test scalability
        const largeItems = Array.from({ length: 1000 }, (_, i) => `item-${i}`);
        
        iterate.call(mockWorkflow as any, largeItems, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toHaveLength(1000);
        expect(mockWorkflow.executionPlan[0]?.type).toBe("iterate");
    });

    test("should handle nested arrays", () => {
        const nestedItems = [["a", "b"], ["c", "d"], ["e", "f"]];
        
        iterate.call(mockWorkflow as any, nestedItems, mockAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload.items).toEqual(nestedItems);
    });

    test("should work with different agent instances", () => {
        const mockAgent2 = { getName: () => "SecondAgent" };
        const items1 = ["first"];
        const items2 = ["second"];
        
        iterate.call(mockWorkflow as any, items1, mockAgent as unknown as AgentForceAgent);
        iterate.call(mockWorkflow as any, items2, mockAgent2 as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]?.payload.agent).toBe(mockAgent);
        expect(mockWorkflow.executionPlan[1]?.payload.agent).toBe(mockAgent2);
    });
});