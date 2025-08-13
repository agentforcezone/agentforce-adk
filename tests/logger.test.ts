import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";

describe("Default Logger Comprehensive Tests", () => {
    let originalEnv: string | undefined;
    let stdoutWriteSpy: any;
    let stderrWriteSpy: any;

    beforeEach(() => {
        // Store original LOG_LEVEL
        originalEnv = process.env.LOG_LEVEL;
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Create spies for process.stdout and process.stderr
        stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
        // Restore original LOG_LEVEL
        if (originalEnv !== undefined) {
            process.env.LOG_LEVEL = originalEnv;
        } else {
            delete process.env.LOG_LEVEL;
        }
        
        // Restore process methods
        stdoutWriteSpy.mockRestore();
        stderrWriteSpy.mockRestore();
        
        // Clear the module cache to reset logger state
        jest.resetModules();
    });

    // Test formatAsJson for different scenarios
    
    // LINES 61-64 COVERAGE: debug method execution with timestamp
    test("should execute debug method and create timestamp when LOG_LEVEL=debug", async () => {
        // Set LOG_LEVEL to debug to enable debug logging
        process.env.LOG_LEVEL = "debug";
        
        // Re-import logger to pick up new LOG_LEVEL
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.debug("Debug message", { data: "test" });
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toMatch(/DEBUG.*\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
        expect(call).toContain('"msg":"Debug message"');
        expect(call).toContain('"data":"test"');
    });

    // LINES 67-70 COVERAGE: info method execution with timestamp  
    test("should execute info method and create timestamp when LOG_LEVEL=info", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.info("Info message", { status: "success" });
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toMatch(/INFO.*\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
        expect(call).toContain('"msg":"Info message"');
        expect(call).toContain('"status":"success"');
    });

    // LINES 73-76 COVERAGE: warn method execution with timestamp
    test("should execute warn method and create timestamp when LOG_LEVEL=warn", async () => {
        process.env.LOG_LEVEL = "warn";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.warn("Warning message", { code: 400 });
        
        expect(stderrWriteSpy).toHaveBeenCalledTimes(1);
        const call = stderrWriteSpy.mock.calls[0][0];
        expect(call).toMatch(/WARN.*\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
        expect(call).toContain('"msg":"Warning message"');
        expect(call).toContain('"code":400');
    });

    // LINES 79-82 COVERAGE: error method execution with timestamp
    test("should execute error method and create timestamp when LOG_LEVEL=error", async () => {
        process.env.LOG_LEVEL = "error";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.error("Error message", { error: "critical" });
        
        expect(stderrWriteSpy).toHaveBeenCalledTimes(1);
        const call = stderrWriteSpy.mock.calls[0][0];
        expect(call).toMatch(/ERROR.*\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
        expect(call).toContain('"msg":"Error message"');
        expect(call).toContain('"error":"critical"');
    });

    // Test that methods don't execute when log level is too high
    test("should not execute debug when LOG_LEVEL=info", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.debug("Should not appear");
        
        expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });

    test("should not execute info when LOG_LEVEL=warn", async () => {
        process.env.LOG_LEVEL = "warn";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.info("Should not appear");
        
        expect(stdoutWriteSpy).not.toHaveBeenCalled();
    });

    test("should not execute warn when LOG_LEVEL=error", async () => {
        process.env.LOG_LEVEL = "error";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.warn("Should not appear");
        
        expect(stderrWriteSpy).not.toHaveBeenCalled();
    });

    test("should not execute any logs when LOG_LEVEL=silent", async () => {
        process.env.LOG_LEVEL = "silent";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.debug("Should not appear");
        testLogger.info("Should not appear");
        testLogger.warn("Should not appear");
        testLogger.error("Should not appear");
        
        expect(stdoutWriteSpy).not.toHaveBeenCalled();
        expect(stderrWriteSpy).not.toHaveBeenCalled();
    });

    // LINES 62-63 COVERAGE: Timestamp creation for debug logs
    test("should create proper timestamp format for all log methods", async () => {
        process.env.LOG_LEVEL = "debug";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        // Test that timestamps are in ISO format
        testLogger.debug("Timestamp test");
        
        const debugCall = stdoutWriteSpy.mock.calls[0][0];
        const timestampMatch = debugCall.match(/\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]/);
        expect(timestampMatch).toBeTruthy();
        
        // Verify it's a valid date
        const timestamp = new Date(timestampMatch[1]);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.toISOString()).toBe(timestampMatch[1]);
    });

    // LINE 105 COVERAGE: Test circular reference handling in array arguments
    test("should handle circular references in array arguments using [Circular] fallback", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        // Create a circular array that will be stringified as part of the message
        const circularArray: any[] = ["item1", "item2"];
        circularArray.push(circularArray); // Create circular reference
        
        // This should not throw - it should catch the error and use [Circular]
        testLogger.info("Circular array test", circularArray);
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain('"msg":"Circular array test [Circular]"');
    });

    // Test array handling in formatAsJson
    test("should properly stringify arrays in log messages", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.info("Array test", [1, 2, 3], { items: ["a", "b"] });
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain('"msg":"Array test [1,2,3]"');
        expect(call).toContain('"items":["a","b"]');
    });

    // Test null and undefined handling
    test("should handle null and undefined values properly", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.info("Null test", null, undefined, { value: null });
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain('"msg":"Null test null undefined"');
        expect(call).toContain('"value":null');
    });

    // Test empty message handling
    test("should handle empty messages correctly", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.info({ data: "only object" });
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain('{"data":"only object"}');
        expect(call).not.toContain('"msg":');
    });

    // Test multiple object merging
    test("should merge multiple objects in log arguments", async () => {
        process.env.LOG_LEVEL = "info";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.info("Merge test", { a: 1 }, { b: 2 }, { c: 3 });
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain('"msg":"Merge test"');
        expect(call).toContain('"a":1');
        expect(call).toContain('"b":2');
        expect(call).toContain('"c":3');
    });

    // Test that log level defaults to info when not set
    test("should default to info level when LOG_LEVEL is not set", async () => {
        delete process.env.LOG_LEVEL;
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.debug("Should not appear");
        testLogger.info("Should appear");
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain("Should appear");
        expect(call).not.toContain("Should not appear");
    });

    // Test invalid log level handling
    test("should default to info level when LOG_LEVEL is invalid", async () => {
        process.env.LOG_LEVEL = "invalid";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.debug("Should not appear");
        testLogger.info("Should appear");
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain("Should appear");
        expect(call).not.toContain("Should not appear");
    });

    // Test case insensitive log level
    test("should handle case insensitive LOG_LEVEL", async () => {
        process.env.LOG_LEVEL = "DEBUG";
        
        const { defaultLogger: testLogger } = await import("../lib/logger");
        
        testLogger.debug("Debug should appear");
        
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
        const call = stdoutWriteSpy.mock.calls[0][0];
        expect(call).toContain("Debug should appear");
    });
});