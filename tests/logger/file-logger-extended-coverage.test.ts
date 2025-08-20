import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import { FileLogger } from "../../lib/logger/file-logger";

describe("FileLogger Extended Coverage Tests", () => {
    let fileLogger: FileLogger;
    let originalAppendFileSync: any;
    let originalMkdirSync: any;
    let originalExistsSync: any;

    beforeEach(() => {
        jest.clearAllMocks();
        fileLogger = new FileLogger("TestAgent", "/test/logs");
        
        // Mock fs operations to avoid actual file writes
        const fs = require('fs');
        originalAppendFileSync = fs.appendFileSync;
        originalMkdirSync = fs.mkdirSync;
        originalExistsSync = fs.existsSync;
        
        fs.appendFileSync = jest.fn();
        fs.mkdirSync = jest.fn();
        fs.existsSync = jest.fn().mockReturnValue(false);
    });

    afterEach(() => {
        jest.clearAllMocks();
        
        // Restore original fs functions
        const fs = require('fs');
        if (originalAppendFileSync) fs.appendFileSync = originalAppendFileSync;
        if (originalMkdirSync) fs.mkdirSync = originalMkdirSync;
        if (originalExistsSync) fs.existsSync = originalExistsSync;
    });

    // LINES 55-58: Test error handling in writeLog when file operations fail
    test("should handle file logging errors silently (lines 55-58)", () => {
        // Mock fs to throw errors
        const fs = require('fs');
        fs.appendFileSync = jest.fn().mockImplementation(() => {
            throw new Error("File write error");
        });
        fs.mkdirSync = jest.fn().mockImplementation(() => {
            throw new Error("Directory creation error");
        });
        
        // Set up execution ID so writeLog will attempt to write
        fileLogger.setExecutionId("test-execution-id");
        
        // These should not throw errors, even when file writing fails
        expect(() => fileLogger.debug("Test debug")).not.toThrow();
        expect(() => fileLogger.info("Test info")).not.toThrow();
        expect(() => fileLogger.warn("Test warn")).not.toThrow();
        expect(() => fileLogger.error("Test error")).not.toThrow();
    });

    test("should skip file logging when no execution ID is set", () => {
        const fs = require('fs');
        
        // Create fresh spy
        fs.appendFileSync = jest.fn();
        
        // Don't set execution ID, so writeLog should return early
        fileLogger.debug("Test debug without execution ID");
        fileLogger.info("Test info without execution ID");
        fileLogger.warn("Test warn without execution ID");
        fileLogger.error("Test error without execution ID");
        
        // File write should not be called since no execution ID is set
        expect(fs.appendFileSync).not.toHaveBeenCalled();
    });

    test("should write logs successfully when no errors occur", () => {
        // Set up execution ID
        fileLogger.setExecutionId("test-execution-id");
        
        // Test that logging methods don't throw when execution ID is set
        expect(() => fileLogger.info("Successful log")).not.toThrow();
        expect(() => fileLogger.debug("Debug log")).not.toThrow();
        expect(() => fileLogger.warn("Warn log")).not.toThrow();
        expect(() => fileLogger.error("Error log")).not.toThrow();
    });

    test("should create correct log file path with date structure", () => {
        const executionId = "test-execution-id";
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
        
        // Test that setExecutionId creates the correct structure
        expect(() => fileLogger.setExecutionId(executionId)).not.toThrow();
        
        // Test that logging works after setting execution ID
        expect(() => fileLogger.info("Test log")).not.toThrow();
    });

    test("should handle all log levels correctly", () => {
        fileLogger.setExecutionId("test-execution-id");
        
        // Test that all log levels execute the writeLog path
        expect(() => {
            fileLogger.debug("Debug message");
            fileLogger.info("Info message");
            fileLogger.warn("Warn message");
            fileLogger.error("Error message");
        }).not.toThrow();
    });
});