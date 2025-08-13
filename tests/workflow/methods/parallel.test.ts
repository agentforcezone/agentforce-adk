import { describe, expect, test, beforeEach } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";

// Import just the parallel function directly to avoid importing the full workflow module
import { parallel } from "../../../lib/workflow/methods/parallel";

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

describe("AgentForceWorkflow parallel Method Tests", () => {
    let mockWorkflow: MockWorkflow;
    let mockAgent1: MockAgent;
    let mockAgent2: MockAgent;
    let mockAgent3: MockAgent;

    beforeEach(() => {
        // Create mock workflow with empty execution plan
        mockWorkflow = {
            executionPlan: []
        };

        // Create mock agents
        mockAgent1 = {
            getName: () => "Agent1"
        };

        mockAgent2 = {
            getName: () => "Agent2"
        };

        mockAgent3 = {
            getName: () => "Agent3"
        };
    });

    test("should return workflow instance for method chaining", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        const result = parallel.call(mockWorkflow as any, agents);
        
        expect(result).toBe(mockWorkflow);
    });

    test("should add parallel step to execution plan with single agent", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        
        parallel.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: agents
        });
    });

    test("should add parallel step to execution plan with multiple agents", () => {
        const agents = [
            mockAgent1 as unknown as AgentForceAgent,
            mockAgent2 as unknown as AgentForceAgent,
            mockAgent3 as unknown as AgentForceAgent
        ];
        
        parallel.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: agents
        });
    });

    test("should handle empty agents array", () => {
        const agents: AgentForceAgent[] = [];
        
        parallel.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: []
        });
    });

    test("should append to existing execution plan", () => {
        // Pre-populate execution plan with an existing step
        mockWorkflow.executionPlan.push({
            type: "existing",
            description: "Existing step",
            payload: "some data"
        });

        const agents = [mockAgent1 as unknown as AgentForceAgent, mockAgent2 as unknown as AgentForceAgent];
        
        parallel.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "existing",
            description: "Existing step",
            payload: "some data"
        });
        expect(mockWorkflow.executionPlan[1]).toEqual({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: agents
        });
    });

    test("should work with method chaining", () => {
        const agents1 = [mockAgent1 as unknown as AgentForceAgent];
        const agents2 = [mockAgent2 as unknown as AgentForceAgent, mockAgent3 as unknown as AgentForceAgent];

        const result = parallel.call(mockWorkflow as any, agents1);
        parallel.call(result as any, agents2);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: agents1
        });
        expect(mockWorkflow.executionPlan[1]).toEqual({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: agents2
        });
    });

    test("should preserve agent references in payload", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent, mockAgent2 as unknown as AgentForceAgent];
        
        parallel.call(mockWorkflow as any, agents);

        // Verify the exact same agent instances are stored
        expect(mockWorkflow.executionPlan[0]?.payload).toBe(agents);
        expect(mockWorkflow.executionPlan[0]?.payload[0]).toBe(mockAgent1);
        expect(mockWorkflow.executionPlan[0]?.payload[1]).toBe(mockAgent2);
    });

    test("should have correct step type and description", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        
        parallel.call(mockWorkflow as any, agents);

        const step = mockWorkflow.executionPlan[0];
        expect(step?.type).toBe("parallel");
        expect(step?.description).toBe("Execute agents in parallel");
    });

    test("should maintain execution plan structure", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        
        parallel.call(mockWorkflow as any, agents);

        const step = mockWorkflow.executionPlan[0];
        expect(step).toHaveProperty("type");
        expect(step).toHaveProperty("description");
        expect(step).toHaveProperty("payload");
        expect(typeof step?.type).toBe("string");
        expect(typeof step?.description).toBe("string");
        expect(Array.isArray(step?.payload)).toBe(true);
    });

    test("should handle large number of agents", () => {
        // Create an array of many agents to test scalability
        const manyAgents: AgentForceAgent[] = [];
        for (let i = 0; i < 100; i++) {
            manyAgents.push({
                getName: () => `Agent${i}`
            } as unknown as AgentForceAgent);
        }
        
        parallel.call(mockWorkflow as any, manyAgents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload).toHaveLength(100);
        expect(mockWorkflow.executionPlan[0]?.type).toBe("parallel");
    });
});