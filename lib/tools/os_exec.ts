import type { ToolImplementation } from "./types";
import { spawn } from "child_process";
import { resolve } from "path";

/**
 * Maximum output size in bytes (1MB default)
 */
const MAX_OUTPUT_BYTES_DEFAULT = 1_000_000;

/**
 * Default timeout in milliseconds (15 seconds)
 */
const TIMEOUT_MS_DEFAULT = 15_000;

/**
 * Allowlisted commands that can be executed
 * This can be made configurable in the future
 */
const ALLOWLIST = new Set([
    "node",
    "bun",
    "npm",
    "pnpm",
    "yarn",
    "git",
    "ls",
    "cat",
    "grep",
    "sed",
    "awk",
    "echo",
    "which",
    "whoami",
    "pwd",
    "date",
    "curl",
    "wget",
    "tar",
    "zip",
    "unzip",
    "mkdir",
    "rm",
    "cp",
    "mv",
    "find",
    "sort",
    "uniq",
    "head",
    "tail",
    "wc",
    "diff",
    "patch",
]);

/**
 * Execute a system command safely without shell injection
 * Enforces allowlist, sandboxing, timeouts, and output limits
 */
export const os_exec: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "os_exec",
            description: "Execute a system command safely without a shell. Captures stdout/stderr with limits and timeout. Commands are allowlisted for security.",
            parameters: {
                type: "object",
                properties: {
                    command: {
                        type: "string",
                        description: "Executable name (must be in allowlist: node, bun, npm, git, ls, cat, grep, etc.)",
                    },
                    args: {
                        type: "string",
                        description: "Arguments to pass to the command as JSON array (e.g., '[\"--version\", \"--help\"]'). Defaults to empty array.",
                    },
                    cwd: {
                        type: "string",
                        description: "Working directory (must be inside project root). Defaults to project root.",
                    },
                    env: {
                        type: "string",
                        description: "Extra environment variables as JSON object (e.g., '{\"NODE_ENV\":\"dev\"}'). Defaults to empty object.",
                    },
                    timeout_ms: {
                        type: "number",
                        description: "Timeout in milliseconds (default 15000)",
                    },
                    max_output_bytes: {
                        type: "number",
                        description: "Maximum combined stdout+stderr bytes (default 1MB)",
                    },
                },
                required: ["command"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const command = String(args.command || "").trim();
        const timeoutMs = Number.isFinite(args.timeout_ms) ? Number(args.timeout_ms) : TIMEOUT_MS_DEFAULT;
        const maxBytes = Number.isFinite(args.max_output_bytes) ? Number(args.max_output_bytes) : MAX_OUTPUT_BYTES_DEFAULT;

        // Parse arguments array from string
        let argv: string[] = [];
        if (args.args) {
            try {
                const parsed = JSON.parse(String(args.args));
                if (Array.isArray(parsed)) {
                    argv = parsed.map(String);
                } else {
                    return {
                        success: false,
                        error: "args must be a JSON array of strings",
                    };
                }
            } catch {
                return {
                    success: false,
                    error: "args must be valid JSON array",
                };
            }
        }

        // Parse environment variables from string
        let envVars: Record<string, string> = {};
        if (args.env) {
            try {
                const parsed = JSON.parse(String(args.env));
                if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
                    envVars = parsed;
                } else {
                    return {
                        success: false,
                        error: "env must be a JSON object with string values",
                    };
                }
            } catch {
                return {
                    success: false,
                    error: "env must be valid JSON object",
                };
            }
        }

        // Validate command
        if (!command) {
            return {
                success: false,
                error: "command is required and cannot be empty",
            };
        }

        if (!ALLOWLIST.has(command)) {
            return {
                success: false,
                error: `Command '${command}' is not allowed. Allowed commands: ${Array.from(ALLOWLIST).sort().join(", ")}`,
            };
        }

        // Validate and sanitize working directory
        const projectRoot = resolve(process.cwd());
        const cwdArg = args.cwd ? resolve(String(args.cwd)) : projectRoot;
        
        if (!cwdArg.startsWith(projectRoot)) {
            return {
                success: false,
                error: "Working directory must be inside project root for security",
                projectRoot,
                requestedCwd: cwdArg,
            };
        }

        // Prepare environment
        const childEnv = { ...process.env, ...envVars };

        // Execute command
        return await new Promise((resolve) => {
            const child = spawn(command, argv, {
                cwd: cwdArg,
                env: childEnv,
                shell: false,
                stdio: ["ignore", "pipe", "pipe"],
            });

            let stdoutBufs: Buffer[] = [];
            let stderrBufs: Buffer[] = [];
            let totalBytes = 0;
            let killedForLimit = false;
            let timedOut = false;

            const killForLimit = (): void => {
                if (!child.killed) {
                    child.kill("SIGKILL");
                }
                killedForLimit = true;
            };

            const onData = (chunk: Buffer, target: Buffer[]): void => {
                totalBytes += chunk.length;
                if (totalBytes > maxBytes) {
                    killForLimit();
                    return;
                }
                target.push(chunk);
            };

            child.stdout?.on("data", (chunk: Buffer) => onData(chunk, stdoutBufs));
            child.stderr?.on("data", (chunk: Buffer) => onData(chunk, stderrBufs));

            // Set timeout
            const timer = setTimeout(() => {
                if (!child.killed) {
                    child.kill("SIGKILL");
                }
                timedOut = true;
            }, timeoutMs);

            child.on("close", (code, signal) => {
                clearTimeout(timer);
                
                const stdoutStr = Buffer.concat(stdoutBufs).toString("utf8");
                const stderrStr = Buffer.concat(stderrBufs).toString("utf8");

                if (timedOut) {
                    resolve({
                        success: false,
                        error: "Command timed out",
                        timedOut: true,
                        timeoutMs,
                        exitCode: null,
                        signal: signal || "SIGKILL",
                        stdout: stdoutStr,
                        stderr: stderrStr,
                        command,
                        args: argv,
                    });
                    return;
                }

                if (killedForLimit) {
                    resolve({
                        success: false,
                        error: "Output exceeded maximum size limit",
                        outputLimitExceeded: true,
                        maxBytes,
                        exitCode: null,
                        signal: signal || "SIGKILL",
                        stdout: stdoutStr,
                        stderr: stderrStr,
                        command,
                        args: argv,
                    });
                    return;
                }

                resolve({
                    success: code === 0,
                    exitCode: code,
                    signal: signal || null,
                    stdout: stdoutStr,
                    stderr: stderrStr,
                    command,
                    args: argv,
                    cwd: cwdArg,
                });
            });

            child.on("error", (error) => {
                clearTimeout(timer);
                resolve({
                    success: false,
                    error: `Failed to start command: ${error.message}`,
                    spawnError: true,
                    command,
                    args: argv,
                });
            });
        });
    },
};
