import { describe, expect, test, beforeEach } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";
import type { AgentForceLogger } from "../../../lib/types";

// Import just the onFail function directly to avoid importing the full workflow module
import { onFail } from "../../../lib/workflow/methods/onFail";

// Create a minimal mock workflow interface for testing
interface MockWorkflow {
    executionPlan: Array<{
        type: string;
        description: string;
        payload: any;
        onFail?: any;
        onSuccess?: any;
    }>;
    getLogger(): AgentForceLogger;
}

// Create a minimal mock agent interface for testing
interface MockAgent {
    getName(): string;
}

describe("AgentForceWorkflow onFail Method Tests", () => {
    let mockWorkflow: MockWorkflow;
    let mockAgent: MockAgent;
    let mockFailAgent: MockAgent;
    let mockLogger: AgentForceLogger;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Create mock workflow with empty execution plan
        mockWorkflow = {
            executionPlan: [],
            getLogger: () => mockLogger
        };

        // Create mock agents
        mockAgent = {
            getName: () => "TestAgent"
        };

        mockFailAgent = {
            getName: () => "FailureAgent"
        };
    });

    test("should return workflow instance for method chaining", () => {
        // Add a step first so we have something to attach the failure handler to
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const result = onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);
        
        expect(result).toBe(mockWorkflow);
    });

    test("should attach failure handler to last step when steps exist", () => {
        // Add a step to the execution plan
        mockWorkflow.executionPlan.push({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: [mockAgent]
        });

        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
    });

    test("should warn when calling onFail with empty execution plan", () => {
        // Execution plan is empty (default state)
        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        expect(mockLogger.warn).toHaveBeenCalledWith("Cannot call .onFail() before defining a step.");
        expect(mockWorkflow.executionPlan).toHaveLength(0);
    });

    test("should attach to the most recent step when multiple steps exist", () => {
        // Add multiple steps to the execution plan
        mockWorkflow.executionPlan.push({
            type: "sequence",
            description: "First step",
            payload: [mockAgent]
        });

        mockWorkflow.executionPlan.push({
            type: "parallel",
            description: "Second step",
            payload: [mockAgent]
        });

        mockWorkflow.executionPlan.push({
            type: "iterate",
            description: "Third step",
            payload: { items: ["item1"], agent: mockAgent }
        });

        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBeUndefined();
        expect(mockWorkflow.executionPlan[1]?.onFail).toBeUndefined();
        expect(mockWorkflow.executionPlan[2]?.onFail).toBe(mockFailAgent);
    });

    test("should work with method chaining after adding steps", () => {
        // Add a step first
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const result1 = onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);
        
        // Add another step and attach another failure handler
        mockWorkflow.executionPlan.push({
            type: "test2",
            description: "Test step 2",
            payload: "test data 2"
        });

        const mockFailAgent2 = { getName: () => "FailureAgent2" };
        const result2 = onFail.call(result1 as any, mockFailAgent2 as unknown as AgentForceAgent);

        expect(result1).toBe(mockWorkflow);
        expect(result2).toBe(mockWorkflow);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
        expect(mockWorkflow.executionPlan[1]?.onFail).toBe(mockFailAgent2);
    });

    test("should preserve existing onFail handler when overwriting", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const firstFailAgent = { getName: () => "FirstFailAgent" };
        const secondFailAgent = { getName: () => "SecondFailAgent" };

        // Attach first failure handler
        onFail.call(mockWorkflow as any, firstFailAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(firstFailAgent);

        // Overwrite with second failure handler
        onFail.call(mockWorkflow as any, secondFailAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(secondFailAgent);
    });

    test("should not interfere with existing onSuccess handlers", () => {
        const mockSuccessAgent = { getName: () => "SuccessAgent" };

        // Add a step with existing onSuccess handler
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data",
            onSuccess: mockSuccessAgent
        });

        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should work correctly when adding onFail before onSuccess", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const mockSuccessAgent = { getName: () => "SuccessAgent" };

        // Add failure handler first
        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);
        
        // Then add success handler to the same step
        mockWorkflow.executionPlan[0]!.onSuccess = mockSuccessAgent;

        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should handle different types of workflow steps", () => {
        const testCases = [
            { type: "sequence", description: "Execute agents in sequence", payload: [mockAgent] },
            { type: "parallel", description: "Execute agents in parallel", payload: [mockAgent] },
            { type: "iterate", description: "Iterate over items", payload: { items: ["item"], agent: mockAgent } }
        ];

        testCases.forEach((stepConfig, index) => {
            const failAgent = { getName: () => `FailAgent${index}` };
            
            mockWorkflow.executionPlan.push(stepConfig);
            onFail.call(mockWorkflow as any, failAgent as unknown as AgentForceAgent);

            expect(mockWorkflow.executionPlan[index]?.onFail).toBe(failAgent);
        });
    });

    test("should preserve agent references", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        // Verify the exact same agent instance is stored
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
    });

    test("should handle steps added after onFail warning", () => {
        // First call onFail with empty execution plan (should warn)
        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);
        expect(mockLogger.warn).toHaveBeenCalledWith("Cannot call .onFail() before defining a step.");

        // Now add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        // Call onFail again (should work now)
        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
    });

    test("should work with complex workflow scenarios", () => {
        // Build a complex workflow
        mockWorkflow.executionPlan.push({
            type: "sequence",
            description: "Initial sequence",
            payload: [mockAgent]
        });

        const failAgent1 = { getName: () => "FailAgent1" };
        onFail.call(mockWorkflow as any, failAgent1 as unknown as AgentForceAgent);

        mockWorkflow.executionPlan.push({
            type: "parallel", 
            description: "Parallel execution",
            payload: [mockAgent]
        });

        const failAgent2 = { getName: () => "FailAgent2" };
        onFail.call(mockWorkflow as any, failAgent2 as unknown as AgentForceAgent);

        mockWorkflow.executionPlan.push({
            type: "iterate",
            description: "Iterate over items", 
            payload: { items: ["a", "b"], agent: mockAgent }
        });

        const failAgent3 = { getName: () => "FailAgent3" };
        onFail.call(mockWorkflow as any, failAgent3 as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(failAgent1);
        expect(mockWorkflow.executionPlan[1]?.onFail).toBe(failAgent2);
        expect(mockWorkflow.executionPlan[2]?.onFail).toBe(failAgent3);
    });

    test("should not call warn when logger is accessed correctly", () => {
        // Test that the logger is properly accessed and used
        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith("Cannot call .onFail() before defining a step.");

        // Clear the mock
        jest.clearAllMocks();

        // Add a step and call onFail again - should not warn
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);
        expect(mockLogger.warn).not.toHaveBeenCalled();
    });

    test("should maintain execution plan integrity", () => {
        // Add multiple steps
        const originalSteps = [
            { type: "step1", description: "Step 1", payload: "data1" },
            { type: "step2", description: "Step 2", payload: "data2" },
            { type: "step3", description: "Step 3", payload: "data3" }
        ];

        mockWorkflow.executionPlan.push(...originalSteps);

        onFail.call(mockWorkflow as any, mockFailAgent as unknown as AgentForceAgent);

        // Verify execution plan structure is maintained
        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]).toMatchObject(originalSteps[0]!);
        expect(mockWorkflow.executionPlan[1]).toMatchObject(originalSteps[1]!);
        expect(mockWorkflow.executionPlan[2]).toMatchObject(originalSteps[2]!);
        
        // Only the last step should have onFail
        expect(mockWorkflow.executionPlan[0]?.onFail).toBeUndefined();
        expect(mockWorkflow.executionPlan[1]?.onFail).toBeUndefined();
        expect(mockWorkflow.executionPlan[2]?.onFail).toBe(mockFailAgent);
    });
});