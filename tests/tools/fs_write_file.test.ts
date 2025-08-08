import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { fs_write_file } from "../../lib/tools/fs_write_file";
import { existsSync, readFileSync, rmSync, mkdirSync } from "fs";
import { resolve, join } from "path";

describe("fs_write_file Tool Tests", () => {
    const testDir = resolve(process.cwd(), "test_output");
    const testFile = join(testDir, "test_file.txt");
    const nestedFile = join(testDir, "nested", "deep", "file.txt");

    beforeEach(() => {
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

    test("should write content to a simple file", async () => {
        const content = "Hello, world!";
        const result = await fs_write_file.execute({
            path: "test_output/test_file.txt",
            content: content,
        });

        expect(result.success).toBe(true);
        expect(result.path).toBe("test_output/test_file.txt");
        expect(result.size).toBe(content.length);
        expect(result.encoding).toBe("utf-8");
        expect(existsSync(testFile)).toBe(true);
        expect(readFileSync(testFile, "utf-8")).toBe(content);
    });

    test("should create parent directories when they don't exist", async () => {
        const content = "Nested content";
        const result = await fs_write_file.execute({
            path: "test_output/nested/deep/file.txt",
            content: content,
            create_dirs: true,
        });

        expect(result.success).toBe(true);
        expect(existsSync(nestedFile)).toBe(true);
        expect(readFileSync(nestedFile, "utf-8")).toBe(content);
    });

    test("should fail when parent directories don't exist and create_dirs is false", async () => {
        const content = "This should fail";
        const result = await fs_write_file.execute({
            path: "test_output/nested/deep/file.txt",
            content: content,
            create_dirs: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(existsSync(nestedFile)).toBe(false);
    });

    test("should write with different encodings", async () => {
        const content = "Hello, world!";
        const base64Content = Buffer.from(content).toString("base64");
        
        const result = await fs_write_file.execute({
            path: "test_output/base64_file.txt",
            content: base64Content,
            encoding: "base64",
        });

        expect(result.success).toBe(true);
        expect(result.encoding).toBe("base64");
        expect(existsSync(join(testDir, "base64_file.txt"))).toBe(true);
        
        // Read the file as binary and decode
        const fileContent = readFileSync(join(testDir, "base64_file.txt"));
        expect(fileContent.toString()).toBe(content);
    });

    test("should handle empty content", async () => {
        const result = await fs_write_file.execute({
            path: "test_output/empty_file.txt",
            content: "",
        });

        expect(result.success).toBe(true);
        expect(result.size).toBe(0);
        expect(existsSync(join(testDir, "empty_file.txt"))).toBe(true);
        expect(readFileSync(join(testDir, "empty_file.txt"), "utf-8")).toBe("");
    });

    test("should handle special characters and Unicode", async () => {
        const content = "Special chars: 🎉 äöü ñ 中文 العربية";
        const result = await fs_write_file.execute({
            path: "test_output/unicode_file.txt",
            content: content,
        });

        expect(result.success).toBe(true);
        expect(existsSync(join(testDir, "unicode_file.txt"))).toBe(true);
        expect(readFileSync(join(testDir, "unicode_file.txt"), "utf-8")).toBe(content);
    });

    test("should handle large content", async () => {
        const content = "A".repeat(10000); // 10KB of 'A's
        const result = await fs_write_file.execute({
            path: "test_output/large_file.txt",
            content: content,
        });

        expect(result.success).toBe(true);
        expect(result.size).toBe(10000);
        expect(existsSync(join(testDir, "large_file.txt"))).toBe(true);
        expect(readFileSync(join(testDir, "large_file.txt"), "utf-8")).toBe(content);
    });

    test("should reject paths outside current working directory", async () => {
        const result = await fs_write_file.execute({
            path: "../../../etc/passwd",
            content: "malicious content",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Access denied");
        expect(result.error).toContain("outside current working directory");
    });

    test("should handle missing required parameters", async () => {
        // Missing content
        const result1 = await fs_write_file.execute({
            path: "test_output/test.txt",
        });

        expect(result1.success).toBe(false);
        expect(result1.error).toBeDefined();

        // Missing path
        const result2 = await fs_write_file.execute({
            content: "test content",
        });

        expect(result2.success).toBe(false);
        expect(result2.error).toBeDefined();
    });

    test("should overwrite existing files", async () => {
        const originalContent = "Original content";
        const newContent = "New content";

        // Create the directory first
        mkdirSync(testDir, { recursive: true });

        // Write original content
        const result1 = await fs_write_file.execute({
            path: "test_output/overwrite_test.txt",
            content: originalContent,
        });

        expect(result1.success).toBe(true);
        expect(readFileSync(join(testDir, "overwrite_test.txt"), "utf-8")).toBe(originalContent);

        // Overwrite with new content
        const result2 = await fs_write_file.execute({
            path: "test_output/overwrite_test.txt",
            content: newContent,
        });

        expect(result2.success).toBe(true);
        expect(readFileSync(join(testDir, "overwrite_test.txt"), "utf-8")).toBe(newContent);
    });

    test("should handle relative paths correctly", async () => {
        const content = "Relative path test";
        const result = await fs_write_file.execute({
            path: "./test_output/relative_file.txt",
            content: content,
        });

        expect(result.success).toBe(true);
        expect(existsSync(join(testDir, "relative_file.txt"))).toBe(true);
        expect(readFileSync(join(testDir, "relative_file.txt"), "utf-8")).toBe(content);
    });

    test("should return correct absolute path in response", async () => {
        const content = "Path test";
        const result = await fs_write_file.execute({
            path: "test_output/path_test.txt",
            content: content,
        });

        expect(result.success).toBe(true);
        expect(result.absolutePath).toBe(resolve(process.cwd(), "test_output/path_test.txt"));
        expect(result.path).toBe("test_output/path_test.txt");
    });
});
