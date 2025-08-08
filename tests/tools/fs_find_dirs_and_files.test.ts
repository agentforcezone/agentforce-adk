import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { fs_find_dirs_and_files } from "../../lib/tools/fs_find_dirs_and_files";
import { existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { resolve, join } from "path";

describe("fs_find_dirs_and_files Tool Tests", () => {
    const testDir = resolve(process.cwd(), "test_search_output");
    
    beforeEach(() => {
        // Clean up any existing test files
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }

        // Create test structure
        mkdirSync(testDir, { recursive: true });
        
        // Create directories
        mkdirSync(join(testDir, "src"), { recursive: true });
        mkdirSync(join(testDir, "test"), { recursive: true });
        mkdirSync(join(testDir, "docs"), { recursive: true });
        mkdirSync(join(testDir, "node_modules"), { recursive: true });
        mkdirSync(join(testDir, "src", "components"), { recursive: true });
        mkdirSync(join(testDir, "src", "test-utils"), { recursive: true });
        mkdirSync(join(testDir, "docs", "examples"), { recursive: true });
        
        // Create files
        writeFileSync(join(testDir, "README.md"), "# Test Project");
        writeFileSync(join(testDir, "package.json"), "{}");
        writeFileSync(join(testDir, "test.js"), "// test file");
        writeFileSync(join(testDir, "src", "index.ts"), "export {};");
        writeFileSync(join(testDir, "src", "test.ts"), "// test file");
        writeFileSync(join(testDir, "src", "components", "Button.tsx"), "export {}");
        writeFileSync(join(testDir, "src", "test-utils", "helpers.ts"), "export {}");
        writeFileSync(join(testDir, "test", "unit.test.js"), "// unit test");
        writeFileSync(join(testDir, "docs", "README.md"), "# Docs");
        writeFileSync(join(testDir, "docs", "examples", "test-example.md"), "# Example");
        writeFileSync(join(testDir, "node_modules", "somepackage"), "// should be excluded");
        
        // Create .gitignore
        writeFileSync(join(testDir, ".gitignore"), "node_modules/\n.env\n*.log\ndist/");
    });

    afterEach(() => {
        // Clean up test files
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    test("should find files and directories matching pattern", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "test",
        });

        expect(result.success).toBe(true);
        expect(result.pattern).toBe("test");
        expect(result.case_sensitive).toBe(false);
        
        // Should find directories with "test" in name
        expect(result.dirs.count).toBeGreaterThan(0);
        expect(result.dirs.items).toContain("test_search_output/test");
        expect(result.dirs.items).toContain("test_search_output/src/test-utils");
        
        // Should find files with "test" in name
        expect(result.files.count).toBeGreaterThan(0);
        expect(result.files.items).toContain("test_search_output/test.js");
        expect(result.files.items).toContain("test_search_output/src/test.ts");
        expect(result.files.items).toContain("test_search_output/test/unit.test.js");
        expect(result.files.items).toContain("test_search_output/docs/examples/test-example.md");
    });

    test("should exclude node_modules by default with gitignore", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "node",
            use_gitignore: true,
        });

        expect(result.success).toBe(true);
        expect(result.use_gitignore).toBe(true);
        
        // Should not find anything in node_modules
        expect(result.dirs.items.filter(item => item.includes("node_modules"))).toHaveLength(0);
        expect(result.files.items.filter(item => item.includes("node_modules"))).toHaveLength(0);
    });

    test("should include node_modules when gitignore is disabled", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "node",
            use_gitignore: false,
        });

        expect(result.success).toBe(true);
        expect(result.use_gitignore).toBe(false);
        
        // Should find node_modules directory
        expect(result.dirs.items).toContain("test_search_output/node_modules");
    });

    test("should handle case-sensitive search", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "TEST", // Upper case
            case_sensitive: true,
        });

        expect(result.success).toBe(true);
        expect(result.case_sensitive).toBe(true);
        
        // Should not find anything since all test files/dirs are lowercase
        expect(result.dirs.count).toBe(0);
        expect(result.files.count).toBe(0);
    });

    test("should handle case-insensitive search (default)", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "TEST", // Upper case
            case_sensitive: false,
        });

        expect(result.success).toBe(true);
        expect(result.case_sensitive).toBe(false);
        
        // Should find test files/dirs despite case difference
        expect(result.dirs.count).toBeGreaterThan(0);
        expect(result.files.count).toBeGreaterThan(0);
    });

    test("should handle additional excludes", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "src",
            additional_excludes: ["components"],
        });

        expect(result.success).toBe(true);
        
        // Should find src directory
        expect(result.dirs.items).toContain("test_search_output/src");
        
        // Should not find components directory
        expect(result.dirs.items.filter(item => item.includes("components"))).toHaveLength(0);
    });

    test("should respect max_depth parameter", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "example", // Only in docs/examples
            max_depth: 1, // Only search 1 level deep
        });

        expect(result.success).toBe(true);
        expect(result.max_depth).toBe(1);
        
        // Should not find examples directory (it's 2 levels deep)
        expect(result.dirs.items.filter(item => item.includes("examples"))).toHaveLength(0);
        expect(result.files.items.filter(item => item.includes("test-example"))).toHaveLength(0);
    });

    test("should respect max_results parameter", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "t", // Very broad pattern to get many results
            max_results: 3,
        });

        expect(result.success).toBe(true);
        expect(result.max_results).toBe(3);
        expect(result.total_found).toBeLessThanOrEqual(3);
        expect(result.truncated).toBe(true);
        expect(result.message).toContain("truncated");
    });

    test("should handle empty pattern gracefully", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "",
        });

        expect(result.success).toBe(true);
        
        // Empty pattern should match everything (not excluded)
        expect(result.total_found).toBeGreaterThan(0);
    });

    test("should handle non-existent path", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "non_existent_directory",
            pattern: "test",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    test("should reject paths outside current working directory", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "../../../etc",
            pattern: "passwd",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Access denied");
        expect(result.error).toContain("outside current working directory");
    });

    test("should handle relative paths correctly", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "./test_search_output",
            pattern: "README",
        });

        expect(result.success).toBe(true);
        expect(result.files.items).toContain("test_search_output/README.md");
        expect(result.files.items).toContain("test_search_output/docs/README.md");
    });

    test("should handle current directory as default path", async () => {
        const result = await fs_find_dirs_and_files.execute({
            pattern: "package", // Should find package.json if it exists
        });

        expect(result.success).toBe(true);
        expect(result.search_path).toBe(process.cwd());
    });

    test("should cap max_depth and max_results at reasonable limits", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "t",
            max_depth: 1000, // Should be capped at 20
            max_results: 10000, // Should be capped at 500
        });

        expect(result.success).toBe(true);
        expect(result.max_depth).toBe(20);
        expect(result.max_results).toBe(500);
    });

    test("should return comprehensive metadata", async () => {
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: "test",
        });

        expect(result.success).toBe(true);
        expect(result.pattern).toBe("test");
        expect(result.search_path).toBe("test_search_output");
        expect(result.absolute_search_path).toBeDefined();
        expect(result.case_sensitive).toBe(false);
        expect(result.max_depth).toBe(10);
        expect(result.max_results).toBe(100);
        expect(result.use_gitignore).toBe(true);
        expect(typeof result.excludes).toBe("number");
        expect(result.total_found).toBe(result.dirs.count + result.files.count);
        expect(result.truncated).toBe(false);
        expect(result.message).toContain("Found");
    });

    test("should handle pattern with special characters", async () => {
        // Create file with special characters
        writeFileSync(join(testDir, "test-file.spec.ts"), "// spec file");
        
        const result = await fs_find_dirs_and_files.execute({
            path: "test_search_output",
            pattern: ".spec",
        });

        expect(result.success).toBe(true);
        expect(result.files.items).toContain("test_search_output/test-file.spec.ts");
    });
});
