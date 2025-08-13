import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import type { AgentForceLogger } from "../../../../lib/types";

// Import just the loop function directly to avoid importing the full workflow module
import { loop } from "../../../../lib/workflow/methods/async/loop";

// Create a minimal mock workflow interface for testing
interface MockWorkflow {
    getLogger(): AgentForceLogger;
    run: jest.MockedFunction<() => Promise<any>>;
}

describe("AgentForceWorkflow loop Method Tests", () => {
    let mockWorkflow: MockWorkflow;
    let mockLogger: AgentForceLogger;
    let originalSetTimeout: typeof setTimeout;
    let setTimeoutCalls: Array<{ callback: Function; delay: number }>;

    beforeEach(() => {
        // Store original setTimeout
        originalSetTimeout = global.setTimeout;
        setTimeoutCalls = [];

        // Mock setTimeout to capture calls without executing
        global.setTimeout = ((callback: Function, delay: number) => {
            setTimeoutCalls.push({ callback, delay });
            return 1 as any; // Return a fake timeout ID
        }) as any;

        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Create mock workflow
        mockWorkflow = {
            getLogger: () => mockLogger,
            run: jest.fn<() => Promise<any>>().mockResolvedValue("success")
        };
    });

    afterEach(() => {
        // Restore setTimeout and clear mocks
        global.setTimeout = originalSetTimeout;
        setTimeoutCalls = [];
        jest.clearAllMocks();
    });

    test("should start workflow loop with default delay", () => {
        loop.call(mockWorkflow as any);

        // Should log the start message with default delay
        expect(mockLogger.info).toHaveBeenCalledWith("Starting workflow loop with delay: 0ms");
    });

    test("should start workflow loop with custom delay", () => {
        const customDelay = 5000;
        loop.call(mockWorkflow as any, customDelay);

        // Should log the start message with custom delay
        expect(mockLogger.info).toHaveBeenCalledWith(`Starting workflow loop with delay: ${customDelay}ms`);
    });

    test("should call workflow run method immediately", async () => {
        loop.call(mockWorkflow as any);

        // Allow async operations to complete
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        // Should call the run method
        expect(mockWorkflow.run).toHaveBeenCalled();
    });

    test("should schedule next iteration with setTimeout", async () => {
        const delay = 1000;
        loop.call(mockWorkflow as any, delay);

        // Allow async operations to complete
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        // Should call setTimeout with the specified delay
        expect(setTimeoutCalls).toHaveLength(1);
        expect(setTimeoutCalls[0]?.delay).toBe(delay);
    });

    test("should handle workflow run errors gracefully", async () => {
        const errorMessage = "Workflow execution failed";
        const error = new Error(errorMessage);
        mockWorkflow.run = jest.fn<() => Promise<any>>().mockRejectedValue(error);

        loop.call(mockWorkflow as any);

        // Allow async operations to complete
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        // Should log the error
        expect(mockLogger.error).toHaveBeenCalledWith({
            message: "Workflow loop iteration failed.",
            error: errorMessage
        });
    });

    test("should continue loop after error", async () => {
        const error = new Error("Test error");
        mockWorkflow.run = jest.fn<() => Promise<any>>()
            .mockRejectedValueOnce(error)  // First call fails
            .mockResolvedValue("success"); // Second call succeeds

        // Execute the first callback manually to test continuation
        loop.call(mockWorkflow as any);

        // Allow initial execution
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        // Execute the scheduled callback to test the continuation
        if (setTimeoutCalls.length > 0 && setTimeoutCalls[0]) {
            await setTimeoutCalls[0].callback();
        }

        // Should call run multiple times despite the error
        expect(mockWorkflow.run).toHaveBeenCalledTimes(2);
        expect(mockLogger.error).toHaveBeenCalledTimes(1);
    });

    test("should handle non-Error objects thrown by run", async () => {
        const stringError = "String error message";
        mockWorkflow.run = jest.fn<() => Promise<any>>().mockRejectedValue(stringError);

        loop.call(mockWorkflow as any);

        // Allow async operations to complete
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        // Should handle non-Error objects by casting to Error - but string.message is undefined
        expect(mockLogger.error).toHaveBeenCalledWith({
            message: "Workflow loop iteration failed.",
            error: undefined // string.message is undefined
        });
    });

    test("should use default delay of 0 when no delay provided", async () => {
        loop.call(mockWorkflow as any);

        // Allow async operations to complete
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        expect(setTimeoutCalls).toHaveLength(1);
        expect(setTimeoutCalls[0]?.delay).toBe(0);
    });

    test("should return void (no return value)", () => {
        const result = loop.call(mockWorkflow as any);
        expect(result).toBeUndefined();
    });

    test("should create recursive loop structure", async () => {
        loop.call(mockWorkflow as any, 100);

        // Allow async operations to complete
        await new Promise(resolve => originalSetTimeout(resolve, 0));

        // Should have scheduled at least one timeout for the next iteration
        expect(setTimeoutCalls).toHaveLength(1);
        expect(setTimeoutCalls[0]?.delay).toBe(100);
    });
});