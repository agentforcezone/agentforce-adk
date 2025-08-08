import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent } from "../../lib/mod";
import { existsSync, rmSync, readFileSync } from "fs";
import { resolve, join } from "path";

describe("fs_write_file Tool Integration Tests", () => {
    let agent: AgentForceAgent;
    const testDir = resolve(process.cwd(), "test_integration_output");

    beforeEach(() => {
        agent = new AgentForceAgent({
            name: "WriteFileTestAgent",
            tools: ["fs_write_file"],
        });

        // Clean up any existing test files
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    afterEach(() => {
        // Clean up test files
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    test("should load fs_write_file tool from config", () => {
        const tools = agent["getTools"]();
        expect(tools).toContain("fs_write_file");
    });

    test("should have fs_write_file available in tool registry", () => {
        const { getTool } = require("../../lib/tools/registry");
        const tool = getTool("fs_write_file");
        
        expect(tool).toBeDefined();
        expect(tool.definition.function.name).toBe("fs_write_file");
        expect(tool.execute).toBeFunction();
    });

    test("should execute fs_write_file tool correctly", async () => {
        const { getTool } = require("../../lib/tools/registry");
        const tool = getTool("fs_write_file");
        
        const result = await tool.execute({
            path: "test_integration_output/integration_test.txt",
            content: "Integration test content",
        });

        expect(result.success).toBe(true);
        expect(existsSync(join(testDir, "integration_test.txt"))).toBe(true);
        expect(readFileSync(join(testDir, "integration_test.txt"), "utf-8")).toBe("Integration test content");
    });
});
