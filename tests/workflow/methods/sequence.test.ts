import { describe, expect, test, beforeEach } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";

// Import just the sequence function directly to avoid importing the full workflow module
import { sequence } from "../../../lib/workflow/methods/sequence";

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

describe("AgentForceWorkflow sequence Method Tests", () => {
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
        const result = sequence.call(mockWorkflow as any, agents);
        
        expect(result).toBe(mockWorkflow);
    });

    test("should add sequence step to execution plan with single agent", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        
        sequence.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: agents
        });
    });

    test("should add sequence step to execution plan with multiple agents", () => {
        const agents = [
            mockAgent1 as unknown as AgentForceAgent,
            mockAgent2 as unknown as AgentForceAgent,
            mockAgent3 as unknown as AgentForceAgent
        ];
        
        sequence.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: agents
        });
    });

    test("should handle empty agents array", () => {
        const agents: AgentForceAgent[] = [];
        
        sequence.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "sequence",
            description: "Execute agents in sequence",
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
        
        sequence.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "existing",
            description: "Existing step",
            payload: "some data"
        });
        expect(mockWorkflow.executionPlan[1]).toEqual({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: agents
        });
    });

    test("should work with method chaining", () => {
        const agents1 = [mockAgent1 as unknown as AgentForceAgent];
        const agents2 = [mockAgent2 as unknown as AgentForceAgent, mockAgent3 as unknown as AgentForceAgent];

        const result = sequence.call(mockWorkflow as any, agents1);
        sequence.call(result as any, agents2);

        expect(mockWorkflow.executionPlan).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]).toEqual({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: agents1
        });
        expect(mockWorkflow.executionPlan[1]).toEqual({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: agents2
        });
    });

    test("should preserve agent references in payload", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent, mockAgent2 as unknown as AgentForceAgent];
        
        sequence.call(mockWorkflow as any, agents);

        // Verify the exact same agent instances are stored
        expect(mockWorkflow.executionPlan[0]?.payload).toBe(agents);
        expect(mockWorkflow.executionPlan[0]?.payload[0]).toBe(mockAgent1);
        expect(mockWorkflow.executionPlan[0]?.payload[1]).toBe(mockAgent2);
    });

    test("should have correct step type and description", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        
        sequence.call(mockWorkflow as any, agents);

        const step = mockWorkflow.executionPlan[0];
        expect(step?.type).toBe("sequence");
        expect(step?.description).toBe("Execute agents in sequence");
    });

    test("should maintain execution plan structure", () => {
        const agents = [mockAgent1 as unknown as AgentForceAgent];
        
        sequence.call(mockWorkflow as any, agents);

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
        
        sequence.call(mockWorkflow as any, manyAgents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload).toHaveLength(100);
        expect(mockWorkflow.executionPlan[0]?.type).toBe("sequence");
    });

    test("should maintain agent order in sequence", () => {
        const agents = [
            mockAgent1 as unknown as AgentForceAgent,
            mockAgent2 as unknown as AgentForceAgent,
            mockAgent3 as unknown as AgentForceAgent
        ];
        
        sequence.call(mockWorkflow as any, agents);

        const step = mockWorkflow.executionPlan[0];
        expect(step?.payload).toHaveLength(3);
        expect(step?.payload[0]).toBe(mockAgent1);
        expect(step?.payload[1]).toBe(mockAgent2);
        expect(step?.payload[2]).toBe(mockAgent3);
    });

    test("should work with duplicate agents", () => {
        const agents = [
            mockAgent1 as unknown as AgentForceAgent,
            mockAgent1 as unknown as AgentForceAgent, // Same agent twice
            mockAgent2 as unknown as AgentForceAgent
        ];
        
        sequence.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.payload).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]?.payload[0]).toBe(mockAgent1);
        expect(mockWorkflow.executionPlan[0]?.payload[1]).toBe(mockAgent1);
        expect(mockWorkflow.executionPlan[0]?.payload[2]).toBe(mockAgent2);
    });

    test("should support mixed sequential and parallel steps", () => {
        // First add a sequence step
        const sequenceAgents = [mockAgent1 as unknown as AgentForceAgent];
        sequence.call(mockWorkflow as any, sequenceAgents);

        // Add some other step to simulate mixed workflow
        mockWorkflow.executionPlan.push({
            type: "parallel",
            description: "Execute agents in parallel",
            payload: [mockAgent2, mockAgent3]
        });

        // Add another sequence step
        const secondSequenceAgents = [mockAgent2 as unknown as AgentForceAgent];
        sequence.call(mockWorkflow as any, secondSequenceAgents);

        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]?.type).toBe("sequence");
        expect(mockWorkflow.executionPlan[1]?.type).toBe("parallel");
        expect(mockWorkflow.executionPlan[2]?.type).toBe("sequence");
    });

    test("should create independent execution steps", () => {
        const agents1 = [mockAgent1 as unknown as AgentForceAgent];
        const agents2 = [mockAgent2 as unknown as AgentForceAgent];

        sequence.call(mockWorkflow as any, agents1);
        sequence.call(mockWorkflow as any, agents2);

        // Verify that modifying one agents array doesn't affect the other
        const firstStepPayload = mockWorkflow.executionPlan[0]?.payload;
        const secondStepPayload = mockWorkflow.executionPlan[1]?.payload;

        expect(firstStepPayload).not.toBe(secondStepPayload);
        expect(firstStepPayload[0]).toBe(mockAgent1);
        expect(secondStepPayload[0]).toBe(mockAgent2);
    });

    test("should work with complex workflow chaining", () => {
        const agents1 = [mockAgent1 as unknown as AgentForceAgent];
        const agents2 = [mockAgent2 as unknown as AgentForceAgent];
        const agents3 = [mockAgent3 as unknown as AgentForceAgent];

        // Chain multiple sequence calls
        const result1 = sequence.call(mockWorkflow as any, agents1);
        const result2 = sequence.call(result1 as any, agents2);
        const result3 = sequence.call(result2 as any, agents3);

        expect(result3).toBe(mockWorkflow);
        expect(mockWorkflow.executionPlan).toHaveLength(3);
        
        expect(mockWorkflow.executionPlan[0]?.payload).toEqual(agents1);
        expect(mockWorkflow.executionPlan[1]?.payload).toEqual(agents2);
        expect(mockWorkflow.executionPlan[2]?.payload).toEqual(agents3);
    });

    test("should handle agents with different properties", () => {
        const specialAgent = {
            getName: () => "SpecialAgent",
            customProperty: "special"
        };
        
        const agents = [
            mockAgent1 as unknown as AgentForceAgent,
            specialAgent as unknown as AgentForceAgent
        ];
        
        sequence.call(mockWorkflow as any, agents);

        expect(mockWorkflow.executionPlan[0]?.payload).toHaveLength(2);
        expect(mockWorkflow.executionPlan[0]?.payload[0]).toBe(mockAgent1);
        expect(mockWorkflow.executionPlan[0]?.payload[1]).toBe(specialAgent);
    });
});