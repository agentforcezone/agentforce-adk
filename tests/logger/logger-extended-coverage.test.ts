import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";

describe("Logger Extended Coverage Tests", () => {
    let originalLogLevel: string | undefined;
    let originalLoggerType: string | undefined;
    let stdoutWriteSpy: any;
    let stderrWriteSpy: any;
    let consoleWarnSpy: any;

    beforeEach(() => {
        // Store original environment variables
        originalLogLevel = process.env.LOG_LEVEL;
        originalLoggerType = process.env.LOGGER_TYPE;
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Create spies
        stdoutWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
        stderrWriteSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore original environment variables
        if (originalLogLevel !== undefined) {
            process.env.LOG_LEVEL = originalLogLevel;
        } else {
            delete process.env.LOG_LEVEL;
        }
        
        if (originalLoggerType !== undefined) {
            process.env.LOGGER_TYPE = originalLoggerType;
        } else {
            delete process.env.LOGGER_TYPE;
        }
        
        // Restore spies
        stdoutWriteSpy.mockRestore();
        stderrWriteSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    // LINES 11-12: Test invalid log level handling fallback to info
    test("should handle invalid LOG_LEVEL and fallback to info (lines 11-12)", async () => {
        process.env.LOG_LEVEL = "invalid_level";
        
        const { defaultLogger } = await import("../../lib/logger");
        
        // Debug should not execute (invalid falls back to info level)
        defaultLogger.debug("This should not appear");
        expect(stdoutWriteSpy).not.toHaveBeenCalled();
        
        // Info should execute
        defaultLogger.info("This should appear");
        expect(stdoutWriteSpy).toHaveBeenCalledTimes(1);
    });

    // LINES 22-24: Test empty/invalid LOGGER_TYPE handling with warning
    test("should handle invalid LOGGER_TYPE with console.warn (lines 22-24)", async () => {
        process.env.LOGGER_TYPE = "invalid,wrong";
        
        const { Logger } = await import("../../lib/logger");
        
        // This should trigger the console.warn and fall back to ["stdout"]
        const logger = new Logger("TestAgent");
        
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "Invalid LOGGER_TYPE value: invalid,wrong. Valid values are: stdout, file, or stdout,file. Falling back to stdout."
        );
        
        expect(logger["types"]).toEqual(["stdout"]);
    });

    // LINES 65-110: Test defaultStdoutLogger methods structure
    test("should have correct defaultStdoutLogger method structure (lines 65-110)", async () => {
        const { defaultLogger } = await import("../../lib/logger");
        
        // Test that all methods exist and are functions
        expect(typeof defaultLogger.debug).toBe("function");
        expect(typeof defaultLogger.info).toBe("function");
        expect(typeof defaultLogger.warn).toBe("function");
        expect(typeof defaultLogger.error).toBe("function");
        
        // Test that methods execute without throwing (regardless of log level)
        expect(() => defaultLogger.debug("Test debug")).not.toThrow();
        expect(() => defaultLogger.info("Test info")).not.toThrow();
        expect(() => defaultLogger.warn("Test warn")).not.toThrow();
        expect(() => defaultLogger.error("Test error")).not.toThrow();
    });

    // LINE 138: Test error handling in setupLogger for file logging without agent name
    test("should throw error when setting up file logger without agent name (line 138)", async () => {
        const { Logger } = await import("../../lib/logger");
        
        // Creating Logger without agent name but requesting file logging should throw
        expect(() => {
            new Logger().loggerType(["file"]);
        }).toThrow("Agent name is required for file logging");
    });

    // LINE 142: Test FileLogger creation path in setupLogger
    test("should create FileLogger when types include file only (line 142)", async () => {
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent", "/custom/path").loggerType(["file"]);
        
        // Verify the logger was set up correctly
        expect(logger["actualLogger"]).toBeDefined();
        expect(logger["types"]).toEqual(["file"]);
    });

    // LINES 174-175: Test Logger proxy methods (debug, info, warn, error)
    test("should proxy all log methods to actualLogger (lines 174-175)", async () => {
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        // Mock the actualLogger
        const mockActualLogger = {
            debug: jest.fn(),
            info: jest.fn(), 
            warn: jest.fn(),
            error: jest.fn()
        };
        
        logger["actualLogger"] = mockActualLogger;
        
        // Test all proxy methods
        logger.debug("test debug");
        logger.info("test info");
        logger.warn("test warn");
        logger.error("test error");
        
        expect(mockActualLogger.debug).toHaveBeenCalledWith("test debug");
        expect(mockActualLogger.info).toHaveBeenCalledWith("test info");
        expect(mockActualLogger.warn).toHaveBeenCalledWith("test warn");
        expect(mockActualLogger.error).toHaveBeenCalledWith("test error");
    });

    // LINES 180-194: Test setExecutionId method
    test("should set execution ID on logger that supports it (lines 180-194)", async () => {
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        // Mock actualLogger with setExecutionId method
        const mockSetExecutionId = jest.fn();
        const mockActualLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setExecutionId: mockSetExecutionId
        };
        
        logger["actualLogger"] = mockActualLogger;
        
        // Test setExecutionId
        logger.setExecutionId("test-execution-id");
        
        expect(mockSetExecutionId).toHaveBeenCalledWith("test-execution-id");
    });

    test("should handle setExecutionId when actualLogger doesn't support it (lines 180-194)", async () => {
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        // Mock actualLogger without setExecutionId method
        const mockActualLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        
        logger["actualLogger"] = mockActualLogger;
        
        // This should not throw an error
        expect(() => {
            logger.setExecutionId("test-execution-id");
        }).not.toThrow();
    });

    // LINES 205-209: Test deprecated functions createFileLogger and createCompositeLogger
    test("should create FileLogger using deprecated createFileLogger function (lines 205-209)", async () => {
        const { createFileLogger } = await import("../../lib/logger");
        
        const fileLogger = createFileLogger("TestAgent", "/custom/path");
        
        expect(fileLogger).toBeDefined();
        expect(typeof fileLogger.debug).toBe("function");
        expect(typeof fileLogger.info).toBe("function");
        expect(typeof fileLogger.warn).toBe("function");
        expect(typeof fileLogger.error).toBe("function");
    });

    test("should create CompositeLogger using deprecated createCompositeLogger function (lines 205-209)", async () => {
        const { createCompositeLogger, defaultLogger } = await import("../../lib/logger");
        
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        
        const compositeLogger = createCompositeLogger([defaultLogger, mockLogger]);
        
        expect(compositeLogger).toBeDefined();
        expect(typeof compositeLogger.debug).toBe("function");
        expect(typeof compositeLogger.info).toBe("function");
        expect(typeof compositeLogger.warn).toBe("function");
        expect(typeof compositeLogger.error).toBe("function");
    });

    // Test generateExecutionId function
    test("should generate unique execution IDs with correct format", async () => {
        const { generateExecutionId } = await import("../../lib/logger");
        
        const id1 = generateExecutionId();
        const id2 = generateExecutionId();
        
        // Should be 16 characters long
        expect(id1).toHaveLength(16);
        expect(id2).toHaveLength(16);
        
        // Should be different
        expect(id1).not.toBe(id2);
        
        // Should be valid hex
        expect(/^[0-9a-f]{16}$/.test(id1)).toBe(true);
        expect(/^[0-9a-f]{16}$/.test(id2)).toBe(true);
    });

    // Test Logger constructor with environment override
    test("should apply LOGGER_TYPE override in constructor", async () => {
        process.env.LOGGER_TYPE = "file";
        
        const { Logger } = await import("../../lib/logger");
        
        // Even without calling loggerType(), the environment should set it
        const logger = new Logger("TestAgent");
        
        expect(logger["types"]).toEqual(["file"]);
    });

    // Test setupLogger for both stdout and file
    test("should setup composite logger for both stdout and file", async () => {
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent").loggerType(["stdout", "file"]);
        
        expect(logger["types"]).toEqual(["stdout", "file"]);
        expect(logger["actualLogger"]).toBeDefined();
    });

    // Test setupLogger error handling for composite logger without agent name
    test("should throw error when setting up composite logger without agent name", async () => {
        const { Logger } = await import("../../lib/logger");
        
        expect(() => {
            new Logger().loggerType(["stdout", "file"]);
        }).toThrow("Agent name is required for file logging");
    });

    // Test case where envTypes is empty array but not null
    test("should handle empty LOGGER_TYPE environment variable", async () => {
        process.env.LOGGER_TYPE = "";
        
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        // Should default to stdout when LOGGER_TYPE is empty
        expect(logger["types"]).toEqual(["stdout"]);
    });

    // Test mixed valid and invalid types in LOGGER_TYPE
    test("should filter out invalid types from LOGGER_TYPE", async () => {
        process.env.LOGGER_TYPE = "stdout,invalid,file,wrong";
        
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        expect(logger["types"]).toEqual(["stdout", "file"]);
    });

    // Test whitespace handling in LOGGER_TYPE
    test("should handle whitespace in LOGGER_TYPE values", async () => {
        process.env.LOGGER_TYPE = " stdout , file ";
        
        const { Logger } = await import("../../lib/logger");
        
        const logger = new Logger("TestAgent");
        
        expect(logger["types"]).toEqual(["stdout", "file"]);
    });
});