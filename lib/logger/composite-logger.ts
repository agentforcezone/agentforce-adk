import type { AgentForceLogger } from "../types";
import type { ExecutionAwareLogger } from "./file-logger";

/**
 * CompositeLogger that forwards log calls to multiple loggers
 * Allows simultaneous logging to console and file
 */
export class CompositeLogger implements AgentForceLogger, ExecutionAwareLogger {
    private loggers: AgentForceLogger[];
    
    /**
     * Creates a new CompositeLogger
     * @param loggers - Array of loggers to forward calls to
     */
    constructor(loggers: AgentForceLogger[]) {
        this.loggers = loggers;
    }
    
    /**
     * Sets execution ID on all loggers that support it
     * @param executionId - Unique execution ID
     */
    setExecutionId(executionId: string): void {
        this.loggers.forEach(logger => {
            if ("setExecutionId" in logger && typeof (logger as any).setExecutionId === "function") {
                (logger as ExecutionAwareLogger).setExecutionId(executionId);
            }
        });
    }
    
    debug(...args: unknown[]): void {
        this.loggers.forEach(logger => logger.debug(...args));
    }
    
    info(...args: unknown[]): void {
        this.loggers.forEach(logger => logger.info(...args));
    }
    
    warn(...args: unknown[]): void {
        this.loggers.forEach(logger => logger.warn(...args));
    }
    
    error(...args: unknown[]): void {
        this.loggers.forEach(logger => logger.error(...args));
    }
}