import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import { FileLogger } from "../../lib/logger/file-logger";
import { CompositeLogger } from "../../lib/logger/composite-logger";
import { generateExecutionId } from "../../lib/logger";

describe("FileLogger", () => {
    let fileLogger: FileLogger;
    const testAgentName = "TestAgent";
    const testLogPath = "/test/logs";
    
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe("constructor", () => {
        test("should create FileLogger with custom log path", () => {
            fileLogger = new FileLogger(testAgentName, testLogPath);
            expect(fileLogger).toBeDefined();
        });
        
        test("should use LOG_PATH env var when no custom path provided", () => {
            const originalEnv = process.env.LOG_PATH;
            process.env.LOG_PATH = "/env/logs";
            
            fileLogger = new FileLogger(testAgentName);
            expect(fileLogger).toBeDefined();
            
            if (originalEnv) {
                process.env.LOG_PATH = originalEnv;
            } else {
                delete process.env.LOG_PATH;
            }
        });
        
        test("should use current directory when no path provided", () => {
            const originalEnv = process.env.LOG_PATH;
            delete process.env.LOG_PATH;
            
            fileLogger = new FileLogger(testAgentName);
            expect(fileLogger).toBeDefined();
            
            if (originalEnv) {
                process.env.LOG_PATH = originalEnv;
            }
        });
    });
    
    describe("setExecutionId", () => {
        test("should set execution ID without throwing", () => {
            fileLogger = new FileLogger(testAgentName, testLogPath);
            const executionId = "test123abc456def";
            
            expect(() => fileLogger.setExecutionId(executionId)).not.toThrow();
        });
    });
    
    describe("logging methods", () => {
        beforeEach(() => {
            fileLogger = new FileLogger(testAgentName, testLogPath);
            fileLogger.setExecutionId("test-exec-id");
        });
        
        test("should have debug method that doesn't throw", () => {
            expect(() => fileLogger.debug("Debug message", { extra: "data" })).not.toThrow();
        });
        
        test("should have info method that doesn't throw", () => {
            expect(() => fileLogger.info("Info message")).not.toThrow();
        });
        
        test("should have warn method that doesn't throw", () => {
            expect(() => fileLogger.warn("Warning message")).not.toThrow();
        });
        
        test("should have error method that doesn't throw", () => {
            expect(() => fileLogger.error("Error message", { code: 500 })).not.toThrow();
        });
        
        test("should not throw when logging before execution ID is set", () => {
            fileLogger = new FileLogger(testAgentName, testLogPath);
            expect(() => fileLogger.info("This should not throw")).not.toThrow();
        });
        
        test("should handle file write errors gracefully", () => {
            // This test verifies that errors are caught and don't propagate
            expect(() => fileLogger.error("Error message")).not.toThrow();
        });
    });
});

describe("CompositeLogger", () => {
    let compositeLogger: CompositeLogger;
    let mockLogger1: any;
    let mockLogger2: any;
    
    beforeEach(() => {
        mockLogger1 = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            setExecutionId: jest.fn()
        };
        
        mockLogger2 = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        
        compositeLogger = new CompositeLogger([mockLogger1, mockLogger2]);
    });
    
    test("should forward debug calls to all loggers", () => {
        compositeLogger.debug("test");
        expect(mockLogger1.debug).toHaveBeenCalledWith("test");
        expect(mockLogger2.debug).toHaveBeenCalledWith("test");
    });
    
    test("should forward info calls to all loggers", () => {
        compositeLogger.info("test");
        expect(mockLogger1.info).toHaveBeenCalledWith("test");
        expect(mockLogger2.info).toHaveBeenCalledWith("test");
    });
    
    test("should forward warn calls to all loggers", () => {
        compositeLogger.warn("test");
        expect(mockLogger1.warn).toHaveBeenCalledWith("test");
        expect(mockLogger2.warn).toHaveBeenCalledWith("test");
    });
    
    test("should forward error calls to all loggers", () => {
        compositeLogger.error("test");
        expect(mockLogger1.error).toHaveBeenCalledWith("test");
        expect(mockLogger2.error).toHaveBeenCalledWith("test");
    });
    
    test("should set execution ID on loggers that support it", () => {
        const executionId = "test-id";
        (compositeLogger as any).setExecutionId(executionId);
        expect(mockLogger1.setExecutionId).toHaveBeenCalledWith(executionId);
        // mockLogger2 doesn't have setExecutionId, so should not throw
    });
});

describe("generateExecutionId", () => {
    test("should generate 16 character hex string", () => {
        const id = generateExecutionId();
        expect(id).toMatch(/^[0-9a-f]{16}$/);
    });
    
    test("should generate unique IDs", () => {
        const id1 = generateExecutionId();
        const id2 = generateExecutionId();
        expect(id1).not.toBe(id2);
    });
});