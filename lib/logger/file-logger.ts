import { join } from "path";
import type { AgentForceLogger } from "../types";
import { appendJsonLine, createStructuredLogEntry } from "../utils/logging";

/**
 * FileLogger implementation that writes logs to JSON files
 * Each execution gets its own log file with a unique execution ID
 */
export class FileLogger implements AgentForceLogger {
    private agentName: string;
    private logPath: string;
    private executionId: string | null = null;
    private logFilePath: string | null = null;
    
    /**
     * Creates a new FileLogger instance
     * @param agentName - Name of the agent (used in log file naming)
     * @param logPath - Optional custom log path (defaults to LOG_PATH env var or current directory)
     */
    constructor(agentName: string, logPath?: string) {
        this.agentName = agentName;
        this.logPath = logPath || process.env.LOG_PATH || process.cwd();
    }
    
    /**
     * Sets the execution ID and initializes the log file path
     * Creates folder structure: YYYY/MM/DD/
     * @param executionId - Unique execution ID (Jaeger-like trace ID)
     */
    setExecutionId(executionId: string): void {
        this.executionId = executionId;
        const now = new Date();
        const date = now.toISOString().split("T")[0]; // YYYY-MM-DD
        
        // Create date-based folder structure: YYYY/MM/DD
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = now.getDate().toString().padStart(2, "0");
        
        const dateFolder = join(this.logPath, year, month, day);
        this.logFilePath = join(dateFolder, `${executionId}-${date}-${this.agentName}.log`);
    }
    
    /**
     * Writes a log entry to the file
     * @param level - Log level (debug, info, warn, error)
     * @param args - Log arguments
     */
    private writeLog(level: string, args: unknown[]): void {
        if (!this.logFilePath) {
            // If no execution ID set yet, skip file logging
            return;
        }
        
        const entry = createStructuredLogEntry(level, args, this.executionId || undefined, this.agentName, true);
        
        try {
            appendJsonLine(this.logFilePath, entry);
        } catch {
            // Silently fail file logging to not disrupt agent execution
            // Could optionally write to stderr here if needed for debugging
        }
    }
    
    debug(...args: unknown[]): void {
        this.writeLog("debug", args);
    }
    
    info(...args: unknown[]): void {
        this.writeLog("info", args);
    }
    
    warn(...args: unknown[]): void {
        this.writeLog("warn", args);
    }
    
    error(...args: unknown[]): void {
        this.writeLog("error", args);
    }
}

/**
 * Interface extension for loggers that support execution ID
 */
export interface ExecutionAwareLogger extends AgentForceLogger {
    setExecutionId(executionId: string): void;
}