import { describe, expect, test, beforeEach, spyOn } from "bun:test";

// Set environment variable before importing logger
process.env.LOG_LEVEL = "debug";

// Import logger after setting environment
import { defaultLogger } from "../../lib/logger";

describe('Logger Tests', () => {
    let consoleDebugSpy: any;
    let consoleLogSpy: any;
    let consoleWarnSpy: any;
    let consoleErrorSpy: any;

    beforeEach(() => {
        // Spy on console methods to capture output
        consoleDebugSpy = spyOn(console, "debug").mockImplementation(() => {});
        consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
        consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});
        consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
    });

    test("should handle circular references in arrays with debug (covers lines 102-105)", () => {
        // Create an array with circular reference
        const circularArray: any = ["test"];
        circularArray.push(circularArray); // Circular reference
        
        // This should trigger the catch block in formatAsJson (lines 102-105)
        defaultLogger.debug("Testing circular array:", circularArray);
        
        expect(consoleDebugSpy).toHaveBeenCalled();
        const loggedMessage = consoleDebugSpy.mock.calls[0][1];
        expect(loggedMessage).toContain("[Circular]");
    });

    test("should log info messages (covers lines 66-69)", () => {
        defaultLogger.info("Test info message", { data: "test" });
        
        expect(consoleLogSpy).toHaveBeenCalled();
        const loggedMessage = consoleLogSpy.mock.calls[0][1];
        expect(loggedMessage).toContain("Test info message");
        expect(loggedMessage).toContain('"data":"test"');
    });

    test("should log warn messages (covers lines 72-75)", () => {
        defaultLogger.warn("Test warning message", { level: "warning" });
        
        expect(consoleWarnSpy).toHaveBeenCalled();
        const loggedMessage = consoleWarnSpy.mock.calls[0][1];
        expect(loggedMessage).toContain("Test warning message");
        expect(loggedMessage).toContain('"level":"warning"');
    });

    test("should log error messages (covers lines 78-81)", () => {
        defaultLogger.error("Test error message", { code: 500 });
        
        expect(consoleErrorSpy).toHaveBeenCalled();
        const loggedMessage = consoleErrorSpy.mock.calls[0][1];
        expect(loggedMessage).toContain("Test error message");
        expect(loggedMessage).toContain('"code":500');
    });

    test("should handle circular references with all log levels", () => {
        const circularArray: any = ["circular"];
        circularArray.push(circularArray);
        
        // Test all log levels with circular references
        defaultLogger.debug("Debug circular:", circularArray);
        defaultLogger.info("Info circular:", circularArray);
        defaultLogger.warn("Warn circular:", circularArray);
        defaultLogger.error("Error circular:", circularArray);
        
        expect(consoleDebugSpy).toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
        
        // Check that circular references are handled properly
        // The calls should contain [Circular] in the appropriate positions
        const debugCalls = consoleDebugSpy.mock.calls;
        const infoCalls = consoleLogSpy.mock.calls;
        const warnCalls = consoleWarnSpy.mock.calls;
        const errorCalls = consoleErrorSpy.mock.calls;
        
        expect(debugCalls[debugCalls.length - 1][1]).toContain("[Circular]");
        expect(infoCalls[infoCalls.length - 1][1]).toContain("[Circular]");
        expect(warnCalls[warnCalls.length - 1][1]).toContain("[Circular]");
        expect(errorCalls[errorCalls.length - 1][1]).toContain("[Circular]");
    });
});