import { describe, expect, test, beforeEach } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";
import type { AgentForceLogger } from "../../../lib/types";

// Import just the onSuccess function directly to avoid importing the full workflow module
import { onSuccess } from "../../../lib/workflow/methods/onSuccess";

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

describe("AgentForceWorkflow onSuccess Method Tests", () => {
    let mockWorkflow: MockWorkflow;
    let mockAgent: MockAgent;
    let mockSuccessAgent: MockAgent;
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

        mockSuccessAgent = {
            getName: () => "SuccessAgent"
        };
    });

    test("should return workflow instance for method chaining", () => {
        // Add a step first so we have something to attach the success handler to
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const result = onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
        
        expect(result).toBe(mockWorkflow);
    });

    test("should attach success handler to last step when steps exist", () => {
        // Add a step to the execution plan
        mockWorkflow.executionPlan.push({
            type: "sequence",
            description: "Execute agents in sequence",
            payload: [mockAgent]
        });

        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(1);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should warn when calling onSuccess with empty execution plan", () => {
        // Execution plan is empty (default state)
        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        expect(mockLogger.warn).toHaveBeenCalledWith("Cannot call .onSuccess() before defining a step.");
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

        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBeUndefined();
        expect(mockWorkflow.executionPlan[1]?.onSuccess).toBeUndefined();
        expect(mockWorkflow.executionPlan[2]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should work with method chaining after adding steps", () => {
        // Add a step first
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const result1 = onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
        
        // Add another step and attach another success handler
        mockWorkflow.executionPlan.push({
            type: "test2",
            description: "Test step 2",
            payload: "test data 2"
        });

        const mockSuccessAgent2 = { getName: () => "SuccessAgent2" };
        const result2 = onSuccess.call(result1 as any, mockSuccessAgent2 as unknown as AgentForceAgent);

        expect(result1).toBe(mockWorkflow);
        expect(result2).toBe(mockWorkflow);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
        expect(mockWorkflow.executionPlan[1]?.onSuccess).toBe(mockSuccessAgent2);
    });

    test("should preserve existing onSuccess handler when overwriting", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const firstSuccessAgent = { getName: () => "FirstSuccessAgent" };
        const secondSuccessAgent = { getName: () => "SecondSuccessAgent" };

        // Attach first success handler
        onSuccess.call(mockWorkflow as any, firstSuccessAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(firstSuccessAgent);

        // Overwrite with second success handler
        onSuccess.call(mockWorkflow as any, secondSuccessAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(secondSuccessAgent);
    });

    test("should not interfere with existing onFail handlers", () => {
        const mockFailAgent = { getName: () => "FailAgent" };

        // Add a step with existing onFail handler
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data",
            onFail: mockFailAgent
        });

        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
    });

    test("should work correctly when adding onSuccess before onFail", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const mockFailAgent = { getName: () => "FailAgent" };

        // Add success handler first
        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
        
        // Then add fail handler to the same step
        mockWorkflow.executionPlan[0]!.onFail = mockFailAgent;

        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
    });

    test("should handle different types of workflow steps", () => {
        const testCases = [
            { type: "sequence", description: "Execute agents in sequence", payload: [mockAgent] },
            { type: "parallel", description: "Execute agents in parallel", payload: [mockAgent] },
            { type: "iterate", description: "Iterate over items", payload: { items: ["item"], agent: mockAgent } }
        ];

        testCases.forEach((stepConfig, index) => {
            const successAgent = { getName: () => `SuccessAgent${index}` };
            
            mockWorkflow.executionPlan.push(stepConfig);
            onSuccess.call(mockWorkflow as any, successAgent as unknown as AgentForceAgent);

            expect(mockWorkflow.executionPlan[index]?.onSuccess).toBe(successAgent);
        });
    });

    test("should preserve agent references", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        // Verify the exact same agent instance is stored
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should handle steps added after onSuccess warning", () => {
        // First call onSuccess with empty execution plan (should warn)
        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
        expect(mockLogger.warn).toHaveBeenCalledWith("Cannot call .onSuccess() before defining a step.");

        // Now add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        // Call onSuccess again (should work now)
        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should work with complex workflow scenarios", () => {
        // Build a complex workflow
        mockWorkflow.executionPlan.push({
            type: "sequence",
            description: "Initial sequence",
            payload: [mockAgent]
        });

        const successAgent1 = { getName: () => "SuccessAgent1" };
        onSuccess.call(mockWorkflow as any, successAgent1 as unknown as AgentForceAgent);

        mockWorkflow.executionPlan.push({
            type: "parallel", 
            description: "Parallel execution",
            payload: [mockAgent]
        });

        const successAgent2 = { getName: () => "SuccessAgent2" };
        onSuccess.call(mockWorkflow as any, successAgent2 as unknown as AgentForceAgent);

        mockWorkflow.executionPlan.push({
            type: "iterate",
            description: "Iterate over items", 
            payload: { items: ["a", "b"], agent: mockAgent }
        });

        const successAgent3 = { getName: () => "SuccessAgent3" };
        onSuccess.call(mockWorkflow as any, successAgent3 as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(successAgent1);
        expect(mockWorkflow.executionPlan[1]?.onSuccess).toBe(successAgent2);
        expect(mockWorkflow.executionPlan[2]?.onSuccess).toBe(successAgent3);
    });

    test("should not call warn when logger is accessed correctly", () => {
        // Test that the logger is properly accessed and used
        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        expect(mockLogger.warn).toHaveBeenCalledTimes(1);
        expect(mockLogger.warn).toHaveBeenCalledWith("Cannot call .onSuccess() before defining a step.");

        // Clear the mock
        jest.clearAllMocks();

        // Add a step and call onSuccess again - should not warn
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
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

        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);

        // Verify execution plan structure is maintained
        expect(mockWorkflow.executionPlan).toHaveLength(3);
        expect(mockWorkflow.executionPlan[0]).toMatchObject(originalSteps[0]!);
        expect(mockWorkflow.executionPlan[1]).toMatchObject(originalSteps[1]!);
        expect(mockWorkflow.executionPlan[2]).toMatchObject(originalSteps[2]!);
        
        // Only the last step should have onSuccess
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBeUndefined();
        expect(mockWorkflow.executionPlan[1]?.onSuccess).toBeUndefined();
        expect(mockWorkflow.executionPlan[2]?.onSuccess).toBe(mockSuccessAgent);
    });

    test("should work alongside onFail handlers on the same step", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const mockFailAgent = { getName: () => "FailAgent" };

        // Add both success and fail handlers to the same step
        onSuccess.call(mockWorkflow as any, mockSuccessAgent as unknown as AgentForceAgent);
        mockWorkflow.executionPlan[0]!.onFail = mockFailAgent;

        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(mockSuccessAgent);
        expect(mockWorkflow.executionPlan[0]?.onFail).toBe(mockFailAgent);
    });

    test("should support success handler replacement", () => {
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });

        const originalSuccessAgent = { getName: () => "OriginalSuccessAgent" };
        const newSuccessAgent = { getName: () => "NewSuccessAgent" };

        // Add initial success handler
        onSuccess.call(mockWorkflow as any, originalSuccessAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(originalSuccessAgent);

        // Replace with new success handler
        onSuccess.call(mockWorkflow as any, newSuccessAgent as unknown as AgentForceAgent);
        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(newSuccessAgent);
    });

    test("should handle agents with different properties", () => {
        const specialAgent = {
            getName: () => "SpecialSuccessAgent",
            customProperty: "special"
        };
        
        // Add a step
        mockWorkflow.executionPlan.push({
            type: "test",
            description: "Test step",
            payload: "test data"
        });
        
        onSuccess.call(mockWorkflow as any, specialAgent as unknown as AgentForceAgent);

        expect(mockWorkflow.executionPlan[0]?.onSuccess).toBe(specialAgent);
    });
});