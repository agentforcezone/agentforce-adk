import type { AgentForceLogger } from "../types";
import type { FileLogger, ExecutionAwareLogger } from "./file-logger";
import type { CompositeLogger } from "./composite-logger";
import { createStructuredLogEntry, formatStructuredLogForStdout } from "../utils/logging";

const COLORIZE = false;

/**
 * @fileoverview Refactored Logger for AgentForce ADK.
 *
 * New Logger class with fluent API for configuring output types.
 * Provides structured JSON logging for info, warn, error, and debug methods.
 * The log level can be controlled via the `LOG_LEVEL` environment variable.
 * The logger type can be controlled via the `LOGGER_TYPE` environment variable,
 * which overrides individual logger settings.
 * 
 * @example
 * // Default logger (stdout only)
 * const logger = new Logger();
 * logger.info("This goes to stdout");
 *
 * // Configure for both stdout and file
 * const logger = new Logger("AgentName").loggerType(["stdout", "file"]);
 * logger.info("This goes to both stdout and file");
 *
 * // Configure for file only
 * const logger = new Logger("AgentName").loggerType(["file"]);
 * logger.info("This goes to file only");
 * 
 * // Environment override examples:
 * // LOGGER_TYPE=file - forces all loggers to file only
 * // LOGGER_TYPE=stdout - forces all loggers to stdout only
 * // LOGGER_TYPE=stdout,file - forces all loggers to both outputs
 */

// Define log levels with numeric priorities. Lower numbers are more verbose.
const logLevels: {
    debug: number;
    info: number;
    warn: number;
    error: number;
    silent: number;
    [key: string]: number | undefined;
} = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    silent: Infinity,
};

// Get the log level from environment variables, default to 'info'.
const getLogLevel = (): number => {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || "info";
    return logLevels[envLevel] ?? logLevels.info;
};

// Get the logger types from environment variables
const getLoggerTypesFromEnv = (): ("stdout" | "file")[] | null => {
    const envTypes = process.env.LOGGER_TYPE?.toLowerCase();
    if (!envTypes) return null;
    
    const types = envTypes.split(",").map(t => t.trim()).filter(t => t);
    const validTypes = types.filter(t => t === "stdout" || t === "file") as ("stdout" | "file")[];
    
    if (validTypes.length === 0) {
        // Invalid LOGGER_TYPE, fall back to stdout only with warning
        console.warn(`Invalid LOGGER_TYPE value: ${envTypes}. Valid values are: stdout, file, or stdout,file. Falling back to stdout.`);
        return ["stdout"];
    }
    
    return validTypes;
};

const currentLogLevel = getLogLevel();

// Create the default stdout logger
const defaultStdoutLogger = {
    debug: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.debug) {
            const entry = createStructuredLogEntry("debug", args);
            const output = formatStructuredLogForStdout(entry, "structured", COLORIZE);
            process.stdout.write(`${output}\n`);
        }
    },
    info: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.info) {
            const entry = createStructuredLogEntry("info", args);
            const output = formatStructuredLogForStdout(entry, "structured", COLORIZE);
            process.stdout.write(`${output}\n`);
        }
    },
    warn: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.warn) {
            const entry = createStructuredLogEntry("warn", args);
            const output = formatStructuredLogForStdout(entry, "structured", COLORIZE);
            process.stderr.write(`${output}\n`);
        }
    },
    error: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.error) {
            const entry = createStructuredLogEntry("error", args);
            const output = formatStructuredLogForStdout(entry, "structured", COLORIZE);
            process.stderr.write(`${output}\n`);
        }
    },
};

/**
 * Logger class with fluent API for configuring output types
 */
export class Logger implements AgentForceLogger, ExecutionAwareLogger {
    private agentName?: string;
    private logPath?: string;
    private types: ("stdout" | "file")[] = ["stdout"];
    private actualLogger: AgentForceLogger = defaultStdoutLogger;

    constructor(agentName?: string, logPath?: string) {
        this.agentName = agentName;
        this.logPath = logPath;
        
        // Check for environment variable override for default constructor behavior
        const envTypes = getLoggerTypesFromEnv();
        if (envTypes !== null) {
            this.types = envTypes;
        }
        
        this.setupLogger();
    }

    /**
     * Configure the logger types
     * @param types - Array of logger types: "stdout", "file"
     * @returns Logger instance for chaining
     */
    loggerType(types: ("stdout" | "file")[]): Logger {
        // Check for environment variable override first
        const envTypes = getLoggerTypesFromEnv();
        if (envTypes !== null) {
            // Environment variable overrides individual settings
            this.types = envTypes;
        } else {
            // Use provided types
            this.types = types;
        }
        this.setupLogger();
        return this;
    }

    /**
     * Sets execution ID on the underlying logger if it supports it
     * @param executionId - Unique execution ID
     */
    setExecutionId(executionId: string): void {
        if ("setExecutionId" in this.actualLogger && typeof (this.actualLogger as any).setExecutionId === "function") {
            (this.actualLogger as ExecutionAwareLogger).setExecutionId(executionId);
        }
    }

    private setupLogger(): void {
        if (this.types.length === 1 && this.types[0] === "stdout") {
            // Stdout only
            this.actualLogger = defaultStdoutLogger;
        } else if (this.types.length === 1 && this.types[0] === "file") {
            // File only
            if (!this.agentName) {
                throw new Error("Agent name is required for file logging");
            }
            const { FileLogger } = require("./file-logger");
            this.actualLogger = new FileLogger(this.agentName, this.logPath);
        } else if (this.types.includes("stdout") && this.types.includes("file")) {
            // Both stdout and file
            if (!this.agentName) {
                throw new Error("Agent name is required for file logging");
            }
            const { FileLogger } = require("./file-logger");
            const { CompositeLogger } = require("./composite-logger");
            const fileLogger = new FileLogger(this.agentName, this.logPath);
            this.actualLogger = new CompositeLogger([defaultStdoutLogger, fileLogger]);
        }
    }

    debug(...args: unknown[]): void {
        this.actualLogger.debug(...args);
    }

    info(...args: unknown[]): void {
        this.actualLogger.info(...args);
    }

    warn(...args: unknown[]): void {
        this.actualLogger.warn(...args);
    }

    error(...args: unknown[]): void {
        this.actualLogger.error(...args);
    }
}

// Export the old interfaces for backward compatibility
export const defaultLogger = defaultStdoutLogger;

// Export FileLogger and CompositeLogger classes
export { FileLogger, type ExecutionAwareLogger } from "./file-logger";
export { CompositeLogger } from "./composite-logger";

/**
 * Creates a FileLogger instance
 * @param agentName - Name of the agent
 * @param logPath - Optional custom log path (defaults to ./logs)
 * @returns FileLogger instance
 * @deprecated Use new Logger().loggerType(["file"]) instead
 */
export function createFileLogger(agentName: string, logPath?: string): FileLogger {
    const { FileLogger } = require("./file-logger");
    return new FileLogger(agentName, logPath);
}

/**
 * Creates a CompositeLogger that forwards to multiple loggers
 * @param loggers - Array of loggers to compose
 * @returns CompositeLogger instance
 * @deprecated Use new Logger().loggerType(["stdout", "file"]) instead
 */
export function createCompositeLogger(loggers: AgentForceLogger[]): CompositeLogger {
    const { CompositeLogger } = require("./composite-logger");
    return new CompositeLogger(loggers);
}

/**
 * Generates a unique execution ID (Jaeger-like trace ID)
 * Format: 16 hex characters (timestamp + random)
 * @returns Unique execution ID
 */
export function generateExecutionId(): string {
    // Use timestamp (12 hex chars) + random (4 hex chars)
    const timestamp = Date.now().toString(16).padStart(12, "0");
    const random = Math.random().toString(16).substring(2, 6).padStart(4, "0");
    return `${timestamp}${random}`;
}