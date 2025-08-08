import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent } from "../../lib/mod";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "fs";
import { resolve, join } from "path";

describe("fs_find_dirs_and_files Tool Integration Tests", () => {
    let agent: AgentForceAgent;
    const testDir = resolve(process.cwd(), "test_integration_search");

    beforeEach(() => {
        agent = new AgentForceAgent({
            name: "SearchAgent",
            tools: ["fs_find_dirs_and_files"],
        });

        // Clean up any existing test files
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }

        // Create test structure
        mkdirSync(testDir, { recursive: true });
        mkdirSync(join(testDir, "src"), { recursive: true });
        writeFileSync(join(testDir, "test.js"), "// test file");
        writeFileSync(join(testDir, "src", "component.test.ts"), "// test file");
    });

    afterEach(() => {
        // Clean up test files
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    test("should load fs_find_dirs_and_files tool from config", () => {
        const tools = agent["getTools"]();
        expect(tools).toContain("fs_find_dirs_and_files");
    });

    test("should have fs_find_dirs_and_files available in tool registry", () => {
        const { getTool } = require("../../lib/tools/registry");
        const tool = getTool("fs_find_dirs_and_files");
        
        expect(tool).toBeDefined();
        expect(tool.definition.function.name).toBe("fs_find_dirs_and_files");
        expect(tool.execute).toBeFunction();
    });

    test("should execute fs_find_dirs_and_files tool correctly", async () => {
        const { getTool } = require("../../lib/tools/registry");
        const tool = getTool("fs_find_dirs_and_files");
        
        const result = await tool.execute({
            path: "test_integration_search",
            pattern: "test",
        });

        expect(result.success).toBe(true);
        expect(result.total_found).toBeGreaterThan(0);
        expect(result.files.items).toContain("test_integration_search/test.js");
        expect(result.files.items).toContain("test_integration_search/src/component.test.ts");
    });

    test("should work with different search parameters", async () => {
        const { getTool } = require("../../lib/tools/registry");
        const tool = getTool("fs_find_dirs_and_files");
        
        const result = await tool.execute({
            path: "test_integration_search",
            pattern: "src",
            use_gitignore: false,
            max_results: 50,
        });

        expect(result.success).toBe(true);
        expect(result.use_gitignore).toBe(false);
        expect(result.max_results).toBe(50);
        expect(result.dirs.items).toContain("test_integration_search/src");
    });
});
