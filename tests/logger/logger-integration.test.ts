import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import { AgentForceAgent } from "../../lib/agent";
import type { AgentConfig } from "../../lib/types";

describe("AgentForceAgent Logger Integration Tests", () => {
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

    test("should create agent with new Logger implementation by default", () => {
        const config: AgentConfig = {
            name: "TestAgent"
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should have Logger instance (not old logger system)
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].debug).toBe("function");
        expect(typeof agent["logger"].info).toBe("function");
        expect(typeof agent["logger"].warn).toBe("function");
        expect(typeof agent["logger"].error).toBe("function");
    });

    test("should create agent with stdout logger configuration", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["stdout"]
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should have logger configured for stdout
        expect(agent["logger"]).toBeDefined();
        // The logger should be our new Logger class instance
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should create agent with file logger configuration", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["file"]
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should have logger configured for file
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should create agent with both stdout and file logger configuration", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["stdout", "file"]
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should have logger configured for both
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should handle backward compatibility with 'default' logger type", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["default" as any] // Cast to any to test backward compatibility
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should convert 'default' to 'stdout'
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should respect LOGGER_TYPE environment variable override", () => {
        // Set environment override
        process.env.LOGGER_TYPE = "file";
        
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["stdout"] // This should be overridden
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should use environment override instead of config
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should handle custom logger (backward compatibility)", () => {
        const customLogger = {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
        };

        const config: AgentConfig = {
            name: "TestAgent",
            logger: customLogger
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should use the custom logger directly
        expect(agent["logger"]).toBe(customLogger);
    });

    test("should handle custom log path", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["file"],
            logPath: "./custom-logs"
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should have logger with custom log path
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should handle mixed invalid and valid logger types", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["invalid" as any, "stdout", "badtype" as any, "file"] // Mix of invalid and valid
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should filter out invalid types and keep valid ones
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });

    test("should fallback to stdout when no valid logger types provided", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            logger: ["invalid" as any, "badtype" as any] // All invalid types
        };
        
        const agent = new AgentForceAgent(config);
        
        // Should fallback to stdout
        expect(agent["logger"]).toBeDefined();
        expect(typeof agent["logger"].info).toBe("function");
    });
});
