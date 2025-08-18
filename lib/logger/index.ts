import type { AgentForceLogger } from "../types";
import type { FileLogger } from "./file-logger";
import type { CompositeLogger } from "./composite-logger";
import { createStructuredLogEntry, formatStructuredLogForStdout } from "../utils/logging";

const COLORIZE = false;

/**
 * @fileoverview Default logger for AgentForce ADK.
 *
 * Default logger utility for AgentForce ADK.
 * Provides structured JSON logging for info, warn, error, and debug methods.
 * The log level can be controlled via the `LOG_LEVEL` environment variable.
 * Color output can be controlled by setting the `COLORIZE` constant.
 * Supported levels: "debug", "info", "warn", "error". Defaults to "info".
 *
 * @example
 * // Set LOG_LEVEL in your environment:
 * // LOG_LEVEL=debug
 *
 * const logger = this.getLogger();
 * 
 * // Simple message logging
 * logger.debug("Model:", "gemma3:4b", { agent: "TestAgent" });
 * // Output: {"timestamp":"2024-01-01T00:00:00.000Z","level":"debug","msg":"Model: gemma3:4b","agent":"TestAgent"}
 *
 * // Structured object logging
 * logger.info({agent: "TestAgent"}, "Agent created");
 * // Output: {"timestamp":"2024-01-01T00:00:00.000Z","level":"info","msg":"Agent created","agent":"TestAgent"}
 *
 * logger.warn("This is a warning");
 * // Output: {"timestamp":"2024-01-01T00:00:00.000Z","level":"warn","msg":"This is a warning"}
 * 
 * logger.error("An error occurred", { code: 500, details: "Internal Server Error" });
 * // Output: {"timestamp":"2024-01-01T00:00:00.000Z","level":"error","msg":"An error occurred","code":500,"details":"Internal Server Error"}
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

const currentLogLevel = getLogLevel();

export const defaultLogger = {
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


// Export FileLogger and CompositeLogger classes
export { FileLogger, type ExecutionAwareLogger } from "./file-logger";
export { CompositeLogger } from "./composite-logger";

/**
 * Creates a FileLogger instance
 * @param agentName - Name of the agent
 * @param logPath - Optional custom log path
 * @returns FileLogger instance
 */
export function createFileLogger(agentName: string, logPath?: string): FileLogger {
    const { FileLogger } = require("./file-logger");
    return new FileLogger(agentName, logPath);
}

/**
 * Creates a CompositeLogger that forwards to multiple loggers
 * @param loggers - Array of loggers to compose
 * @returns CompositeLogger instance
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