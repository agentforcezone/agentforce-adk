import { describe, expect, test, beforeEach } from "bun:test";
import { fs_search_content } from "../../lib/tools/fs_search_content";

describe('fs_search_content Tool Tests', () => {
    test("should search for simple text patterns", async () => {
        const result = await fs_search_content.execute({
            pattern: "import",
            file_extensions: [".ts"],
            max_total_matches: 5,
        });

        expect(result.success).toBe(true);
        expect(result.total_matches).toBeGreaterThan(0);
        expect(result.matches).toBeArray();
        if (result.matches && result.matches.length > 0) {
            expect(result.matches[0]).toHaveProperty("file");
            expect(result.matches[0]).toHaveProperty("line_number");
            expect(result.matches[0]).toHaveProperty("match");
            expect(result.matches[0]).toHaveProperty("full_line");
        }
    });

    test("should search for regex patterns", async () => {
        const result = await fs_search_content.execute({
            pattern: "function\\s+\\w+",
            use_regex: true,
            file_extensions: [".ts"],
            max_total_matches: 3,
        });

        expect(result.success).toBe(true);
        expect(result.use_regex).toBe(true);
        if (result.total_matches && result.total_matches > 0) {
            expect(result.matches).toBeArray();
            expect(result.matches![0]).toHaveProperty("match");
        }
    });

    test("should include context lines when requested", async () => {
        const result = await fs_search_content.execute({
            pattern: "export",
            file_extensions: [".ts"],
            include_context: true,
            context_lines: 2,
            max_total_matches: 2,
        });

        expect(result.success).toBe(true);
        if (result.matches && result.matches.length > 0) {
            expect(result.matches[0]).toHaveProperty("context_before");
            expect(result.matches[0]).toHaveProperty("context_after");
            expect(result.matches[0].context_before).toBeArray();
            expect(result.matches[0].context_after).toBeArray();
        }
    });

    test("should respect case sensitivity settings", async () => {
        const caseSensitiveResult = await fs_search_content.execute({
            pattern: "Export", // Capital E
            case_sensitive: true,
            file_extensions: [".ts"],
            max_total_matches: 5,
        });

        const caseInsensitiveResult = await fs_search_content.execute({
            pattern: "Export", // Capital E
            case_sensitive: false,
            file_extensions: [".ts"],
            max_total_matches: 5,
        });

        expect(caseSensitiveResult.success).toBe(true);
        expect(caseInsensitiveResult.success).toBe(true);
        expect(caseSensitiveResult.case_sensitive).toBe(true);
        expect(caseInsensitiveResult.case_sensitive).toBe(false);
        
        // Case insensitive should typically find more matches
        expect(caseInsensitiveResult.total_matches).toBeGreaterThanOrEqual(caseSensitiveResult.total_matches);
    });

    test("should filter by file extensions", async () => {
        const tsResult = await fs_search_content.execute({
            pattern: "test",
            file_extensions: [".ts"],
            max_total_matches: 5,
        });

        const mdResult = await fs_search_content.execute({
            pattern: "test",
            file_extensions: [".md"],
            max_total_matches: 5,
        });

        expect(tsResult.success).toBe(true);
        expect(mdResult.success).toBe(true);
        
        // Check that results only contain files with specified extensions
        if (tsResult.matches && tsResult.matches.length > 0) {
            expect(tsResult.matches[0].file).toMatch(/\.ts$/);
        }
        if (mdResult.matches && mdResult.matches.length > 0) {
            expect(mdResult.matches[0].file).toMatch(/\.md$/);
        }
    });

    test("should respect max matches limits", async () => {
        const result = await fs_search_content.execute({
            pattern: "the",
            max_total_matches: 3,
            max_matches_per_file: 1,
        });

        expect(result.success).toBe(true);
        expect(result.total_matches).toBeLessThanOrEqual(3);
        
        // Check that no file has more than max_matches_per_file
        if (result.matches && result.matches.length > 0) {
            const fileMatchCounts: Record<string, number> = {};
            for (const match of result.matches) {
                fileMatchCounts[match.file] = (fileMatchCounts[match.file] || 0) + 1;
            }
            
            for (const count of Object.values(fileMatchCounts)) {
                expect(count).toBeLessThanOrEqual(1);
            }
        }
    });

    test("should handle invalid regex patterns", async () => {
        const result = await fs_search_content.execute({
            pattern: "[invalid regex",
            use_regex: true,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid regex pattern");
    });

    test("should handle non-existent search paths", async () => {
        const result = await fs_search_content.execute({
            pattern: "test",
            path: "./non-existent-directory",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Search path does not exist");
    });

    test("should include proper metadata in results", async () => {
        const result = await fs_search_content.execute({
            pattern: "function",
            file_extensions: [".ts"],
            max_total_matches: 2,
        });

        expect(result.success).toBe(true);
        expect(result).toHaveProperty("pattern");
        expect(result).toHaveProperty("file_extensions");
        expect(result).toHaveProperty("total_matches");
        expect(result).toHaveProperty("files_searched");
        expect(result).toHaveProperty("files_with_matches");
        expect(result).toHaveProperty("settings");
        expect(result).toHaveProperty("message");
        
        expect(result.pattern).toBe("function");
        expect(result.file_extensions).toEqual([".ts"]);
    });

    test("should provide column numbers for matches", async () => {
        const result = await fs_search_content.execute({
            pattern: "import",
            file_extensions: [".ts"],
            max_total_matches: 1,
        });

        expect(result.success).toBe(true);
        if (result.matches && result.matches.length > 0) {
            expect(result.matches[0]).toHaveProperty("column");
            expect(result.matches[0].column).toBeGreaterThan(0);
        }
    });
});
