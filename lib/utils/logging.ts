import { existsSync, mkdirSync, appendFileSync } from "fs";
import { dirname } from "path";
import { truncate } from "./truncate";
import type { StructuredLogEntry, StdoutLogFormat, FileLogFormat } from "../types";

/**
 * Ensures a directory exists, creating it recursively if needed
 * @param dirPath - The directory path to ensure exists
 */
export function ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Appends a JSON object as a line to a file (JSON Lines format)
 * @param filepath - The file path to append to
 * @param data - The data object to append as JSON
 */
export function appendJsonLine(filepath: string, data: object): void {
    const dir = dirname(filepath);
    ensureDirectoryExists(dir);
    appendFileSync(filepath, JSON.stringify(data) + "\n", "utf8");
}

/**
 * Formats log arguments into a structured object
 * Merges objects and concatenates other values into a message
 * @param args - The log arguments to format
 * @returns Formatted log data with optional msg property
 */
export function formatLogData(args: unknown[]): { msg?: string; [key: string]: any } {
    const stringParts: string[] = [];
    const objectPayload: { [key: string]: any } = {};
    
    for (const arg of args) {
        if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
            Object.assign(objectPayload, arg);
        } else {
            if (typeof arg === "object" && arg !== null) {
                try {
                    stringParts.push(JSON.stringify(arg));
                } catch {
                    stringParts.push("[Circular]");
                }
            } else {
                stringParts.push(String(arg));
            }
        }
    }
    
    const message = stringParts.join(" ");
    return message ? { msg: message, ...objectPayload } : objectPayload;
}

/**
 * Formats log arguments with truncation applied to long values
 * Truncates string values and stringified objects to prevent huge log entries
 * @param args - The log arguments to format
 * @param maxLength - Maximum length for individual values (default: 200)
 * @returns Formatted log data with truncation applied
 */
export function formatLogDataWithTruncation(args: unknown[], maxLength: number = 200): { msg?: string; [key: string]: any } {
    const stringParts: string[] = [];
    const objectPayload: { [key: string]: any } = {};
    
    for (const arg of args) {
        if (typeof arg === "object" && arg !== null && !Array.isArray(arg)) {
            // Truncate object values that are strings
            const truncatedObject: { [key: string]: any } = {};
            for (const [key, value] of Object.entries(arg)) {
                if (typeof value === "string" && value.length > maxLength) {
                    truncatedObject[key] = truncate(value, maxLength);
                } else if (typeof value === "object" && value !== null) {
                    try {
                        const stringified = JSON.stringify(value);
                        truncatedObject[key] = stringified.length > maxLength 
                            ? truncate(stringified, maxLength) 
                            : value;
                    } catch {
                        truncatedObject[key] = "[Circular]";
                    }
                } else {
                    truncatedObject[key] = value;
                }
            }
            Object.assign(objectPayload, truncatedObject);
        } else {
            if (typeof arg === "object" && arg !== null) {
                try {
                    const stringified = JSON.stringify(arg);
                    stringParts.push(stringified.length > maxLength 
                        ? truncate(stringified, maxLength) 
                        : stringified);
                } catch {
                    stringParts.push("[Circular]");
                }
            } else {
                const stringValue = String(arg);
                stringParts.push(stringValue.length > maxLength 
                    ? truncate(stringValue, maxLength) 
                    : stringValue);
            }
        }
    }
    
    const message = stringParts.join(" ");
    const truncatedMessage = message.length > maxLength ? truncate(message, maxLength) : message;
    return truncatedMessage ? { msg: truncatedMessage, ...objectPayload } : objectPayload;
}

/**
 * Creates a structured log entry with timestamp and level
 * @param level - Log level (debug, info, warn, error)
 * @param args - Log arguments
 * @param executionId - Optional execution ID for transaction tracking
 * @param agentName - Optional agent name
 * @param truncate - Whether to apply truncation (default: false)
 * @returns Structured log entry
 */
export function createStructuredLogEntry(
    level: string, 
    args: unknown[], 
    executionId?: string, 
    agentName?: string, 
    truncateContent: boolean = false,
): StructuredLogEntry {
    const logData = truncateContent ? formatLogDataWithTruncation(args, 200) : formatLogData(args);
    
    const entry: StructuredLogEntry = {
        timestamp: new Date().toISOString(),
        level,
        ...logData,
    };
    
    if (executionId) {
        entry.executionId = executionId;
    }
    
    if (agentName) {
        entry.agentName = agentName;
    }
    
    return entry;
}

/**
 * Formats a structured log entry for stdout output
 * @param entry - The structured log entry
 * @param format - The output format ("structured" or "console")
 * @param colorize - Whether to apply colors to the output (default: false)
 * @returns Formatted string for stdout
 */
export function formatStructuredLogForStdout(entry: StructuredLogEntry, format: StdoutLogFormat, colorize: boolean = false): string {
    // Color functions
    const blue = (text: string) => colorize ? `\x1b[34m${text}\x1b[0m` : text;
    const green = (text: string) => colorize ? `\x1b[32m${text}\x1b[0m` : text;
    const yellow = (text: string) => colorize ? `\x1b[33m${text}\x1b[0m` : text;
    const red = (text: string) => colorize ? `\x1b[31m${text}\x1b[0m` : text;
    
    const colorMap = {
        debug: blue,
        info: green,
        warn: yellow,
        error: red,
    };
    
    switch (format) {
        case "structured":
            const jsonOutput = JSON.stringify(entry);
            if (colorize) {
                // Apply color to the entire JSON output
                const colorFn = colorMap[entry.level as keyof typeof colorMap] || ((text: string) => text);
                return colorFn(jsonOutput);
            }
            return jsonOutput;
        case "console":
            // Legacy colored console format
            const colorFn = colorMap[entry.level as keyof typeof colorMap] || ((text: string) => text);
            const levelText = colorFn(entry.level.toUpperCase());
            
            // Create a copy without timestamp for JSON serialization
            const { timestamp, ...logData } = entry;
            const jsonData = Object.keys(logData).length > 0 ? JSON.stringify(logData) : "";
            
            return `${levelText} [${timestamp}] ${jsonData}`;
        default:
            const defaultJsonOutput = JSON.stringify(entry);
            if (colorize) {
                const colorFn = colorMap[entry.level as keyof typeof colorMap] || ((text: string) => text);
                return colorFn(defaultJsonOutput);
            }
            return defaultJsonOutput;
    }
}

/**
 * Formats a structured log entry for file output
 * @param entry - The structured log entry
 * @param format - The file format (currently only "structured")
 * @returns Formatted string for file output
 */
export function formatStructuredLogForFile(entry: StructuredLogEntry, format: FileLogFormat): string {
    switch (format) {
        case "structured":
            return JSON.stringify(entry);
        default:
            return JSON.stringify(entry);
    }
}