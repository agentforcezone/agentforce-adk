import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";

describe("Logger Environment Variable Override Tests", () => {
    let originalLoggerType: string | undefined;

    beforeEach(() => {
        // Store original LOGGER_TYPE
        originalLoggerType = process.env.LOGGER_TYPE;
    });

    afterEach(() => {
        // Restore original LOGGER_TYPE
        if (originalLoggerType !== undefined) {
            process.env.LOGGER_TYPE = originalLoggerType;
        } else {
            delete process.env.LOGGER_TYPE;
        }
    });

    test("should override loggerType() call with LOGGER_TYPE=file", async () => {
        // Set LOGGER_TYPE environment variable
        process.env.LOGGER_TYPE = "file";
        
        // Import Logger after setting environment variable
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent").loggerType(["stdout"]); // This should be overridden
        
        // The logger should be configured for file logging despite calling loggerType(["stdout"])
        expect(logger["types"]).toEqual(["file"]);
    });

    test("should override loggerType() call with LOGGER_TYPE=stdout,file", async () => {
        // Set LOGGER_TYPE environment variable
        process.env.LOGGER_TYPE = "stdout,file";
        
        // Import Logger after setting environment variable
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent").loggerType(["stdout"]); // This should be overridden
        
        // The logger should be configured for both outputs
        expect(logger["types"]).toEqual(["stdout", "file"]);
    });

    test("should use default constructor behavior with LOGGER_TYPE=file", async () => {
        // Set LOGGER_TYPE environment variable
        process.env.LOGGER_TYPE = "file";
        
        // Import Logger after setting environment variable
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent"); // No loggerType() call
        
        // The logger should be configured for file logging by default
        expect(logger["types"]).toEqual(["file"]);
    });

    test("should handle invalid LOGGER_TYPE values gracefully", async () => {
        // Mock console.warn to capture warning
        const originalWarn = console.warn;
        let warnCalled = false;
        let warnMessage = "";
        console.warn = (message: string) => {
            warnCalled = true;
            warnMessage = message;
        };
        
        // Set invalid LOGGER_TYPE
        process.env.LOGGER_TYPE = "invalid,badtype";
        
        // Import Logger after setting environment variable
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        // Should fall back to stdout and show warning
        expect(logger["types"]).toEqual(["stdout"]);
        expect(warnCalled).toBe(true);
        expect(warnMessage).toContain("Invalid LOGGER_TYPE value: invalid,badtype");
        
        // Restore console.warn
        console.warn = originalWarn;
    });

    test("should not override when LOGGER_TYPE is not set", async () => {
        // Ensure LOGGER_TYPE is not set
        delete process.env.LOGGER_TYPE;
        
        // Import Logger after removing environment variable
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent").loggerType(["stdout", "file"]);
        
        // Should use the explicitly set types
        expect(logger["types"]).toEqual(["stdout", "file"]);
    });

    test("should handle LOGGER_TYPE with spaces and mixed case", async () => {
        // Set LOGGER_TYPE with spaces and mixed case
        process.env.LOGGER_TYPE = " STDOUT , File ";
        
        // Import Logger after setting environment variable
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        // Should normalize and use both types
        expect(logger["types"]).toEqual(["stdout", "file"]);
    });
});
