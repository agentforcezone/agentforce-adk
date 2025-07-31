/**
 * @fileoverview Default logger for AgentForce ADK.
 *
 * Default logger utility for AgentForce ADK.
 * Provides structured JSON logging for info, warn, error, and debug methods.
 * The log level can be controlled via the `LOG_LEVEL` environment variable.
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
 * // Output: DEBUG [timestamp] {"msg":"Model: gemma3:4b", "agent":"TestAgent"}
 *
 * // Structured object logging
 * logger.info({agent: "TestAgent"}, "Agent created");
 * // Output: INFO [timestamp] {"msg":"Agent created","agent":"TestAgent"}
 *
 * logger.warn("This is a warning");
 * // Output: WARN [timestamp] {"msg":"This is a warning"}
 * 
 * logger.error("An error occurred", { code: 500, details: "Internal Server Error" });
 * // Output: ERROR [timestamp] {"msg":"An error occurred", "code":
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

const blue = (text: string) => `\x1b[34m${text}\x1b[0m`;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;
const yellow = (text: string) => `\x1b[33m${text}\x1b[0m`;
const red = (text: string) => `\x1b[31m${text}\x1b[0m`;

export const defaultLogger = {
    debug: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.debug) {
            const timestamp = new Date().toISOString();
            console.debug(`${blue("DEBUG")} [${timestamp}]`, formatAsJson(args));
        }
    },
    info: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.info) {
            const timestamp = new Date().toISOString();
            console.log(`${green("INFO")} [${timestamp}]`, formatAsJson(args));
        }
    },
    warn: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.warn) {
            const timestamp = new Date().toISOString();
            console.warn(`${yellow("WARN")} [${timestamp}]`, formatAsJson(args));
        }
    },
    error: (...args: unknown[]) => {
        if (currentLogLevel <= logLevels.error) {
            const timestamp = new Date().toISOString();
            console.error(`${red("ERROR")} [${timestamp}]`, formatAsJson(args));
        }
    },
};

/**
 * Formats log arguments into a JSON string. Any objects in the arguments are merged
 * into the log object. All other arguments are concatenated into a 'msg' property,
 * which will be the first key in the resulting JSON.
 * @param args - The arguments to format.
 * @returns A JSON string representation of the log object.
 */
const formatAsJson = (args: unknown[]): string => {
    const stringParts: string[] = [];
    const objectPayload: { [key:string]: any } = {};

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

    // To ensure 'msg' is the first key, we construct the final object in order.
    const message = stringParts.join(" ");
    const finalLogObject = message ? { msg: message, ...objectPayload } : { ...objectPayload };

    return JSON.stringify(finalLogObject);
};