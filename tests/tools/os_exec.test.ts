import { describe, expect, test, beforeEach } from "bun:test";
import { os_exec } from "../../lib/tools/os_exec";

describe("os_exec Tool Tests", () => {
    test("should execute simple allowed command successfully", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: '["hello", "world"]',
        });

        expect(result.success).toBe(true);
        expect(result.exitCode).toBe(0);
        expect(result.stdout.trim()).toBe("hello world");
        expect(result.stderr).toBe("");
        expect(result.command).toBe("echo");
        expect(result.args).toEqual(["hello", "world"]);
    });

    test("should reject disallowed commands", async () => {
        const result = await os_exec.execute({
            command: "malicious-command",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("not allowed");
        expect(result.error).toContain("malicious-command");
    });

    test("should require command parameter", async () => {
        const result = await os_exec.execute({});

        expect(result.success).toBe(false);
        expect(result.error).toContain("command is required");
    });

    test("should handle empty command", async () => {
        const result = await os_exec.execute({
            command: "",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("command is required");
    });

    test("should parse JSON arguments correctly", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: '["arg1", "arg2", "arg3"]',
        });

        expect(result.success).toBe(true);
        expect(result.args).toEqual(["arg1", "arg2", "arg3"]);
        expect(result.stdout.trim()).toBe("arg1 arg2 arg3");
    });

    test("should handle missing args parameter", async () => {
        const result = await os_exec.execute({
            command: "pwd",
        });

        expect(result.success).toBe(true);
        expect(result.args).toEqual([]);
    });

    test("should reject invalid JSON in args", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: "invalid-json",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("valid JSON array");
    });

    test("should reject non-array args", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: '{"not": "array"}',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("JSON array of strings");
    });

    test("should handle environment variables", async () => {
        const result = await os_exec.execute({
            command: "node",
            args: '["-e", "console.log(process.env.TEST_VAR)"]',
            env: '{"TEST_VAR": "test_value"}',
        });

        expect(result.success).toBe(true);
        expect(result.stdout.trim()).toBe("test_value");
    });

    test("should reject invalid JSON in env", async () => {
        const result = await os_exec.execute({
            command: "echo",
            env: "invalid-json",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("valid JSON object");
    });

    test("should reject non-object env", async () => {
        const result = await os_exec.execute({
            command: "echo",
            env: '["not", "object"]',
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("JSON object with string values");
    });

    test("should handle working directory within project", async () => {
        const result = await os_exec.execute({
            command: "pwd",
            cwd: "./lib",
        });

        expect(result.success).toBe(true);
        expect(result.stdout).toContain("lib");
    });

    test("should reject working directory outside project", async () => {
        const result = await os_exec.execute({
            command: "pwd",
            cwd: "/etc",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("inside project root");
        expect(result.projectRoot).toBeDefined();
        expect(result.requestedCwd).toBeDefined();
    });

    test("should handle command that fails", async () => {
        const result = await os_exec.execute({
            command: "ls",
            args: '["/nonexistent/directory"]',
        });

        expect(result.success).toBe(false);
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toBeDefined();
    });

    test("should respect timeout", async () => {
        const result = await os_exec.execute({
            command: "node",
            args: '["-e", "setTimeout(() => {}, 5000)"]', // 5 second timeout
            timeout_ms: 1000, // 1 second timeout
        });

        expect(result.success).toBe(false);
        expect(result.timedOut).toBe(true);
        expect(result.timeoutMs).toBe(1000);
        expect(result.error).toContain("timed out");
    });

    test("should respect output size limit", async () => {
        const result = await os_exec.execute({
            command: "node",
            args: '["-e", "console.log(\\"x\\".repeat(2000))"]', // 2KB output
            max_output_bytes: 1000, // 1KB limit
        });

        expect(result.success).toBe(false);
        expect(result.outputLimitExceeded).toBe(true);
        expect(result.maxBytes).toBe(1000);
        expect(result.error).toContain("exceeded maximum size");
    });

    test("should use default timeout and output limits", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: '["test"]',
        });

        expect(result.success).toBe(true);
        // Should not have timeout or limit exceeded flags
        expect(result.timedOut).toBeUndefined();
        expect(result.outputLimitExceeded).toBeUndefined();
    });

    test("should handle spawn errors gracefully", async () => {
        // This test may be platform-specific, but we'll try with an invalid command
        const result = await os_exec.execute({
            command: "node",
            args: '["/completely/invalid/path/script.js"]',
        });

        // The command should start but fail during execution
        expect(result.success).toBe(false);
        expect(result.exitCode).not.toBe(0);
    });

    test("should include command context in response", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: '["context", "test"]',
            cwd: "./lib",
        });

        expect(result.command).toBe("echo");
        expect(result.args).toEqual(["context", "test"]);
        expect(result.cwd).toContain("lib");
    });

    test("should handle numeric timeout and max_output_bytes", async () => {
        const result = await os_exec.execute({
            command: "echo",
            args: '["test"]',
            timeout_ms: 5000,
            max_output_bytes: 1000000,
        });

        expect(result.success).toBe(true);
        expect(result.stdout.trim()).toBe("test");
    });
});
