import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { fs_move_file } from "../../lib/tools/fs_move_file";
import { writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { resolve } from "path";

describe("fs_move_file Tool Tests", () => {
    const testDir = "./test_move_files";
    const sourceFile = `${testDir}/source.txt`;
    const destinationFile = `${testDir}/destination.txt`;
    const nestedDestination = `${testDir}/nested/moved.txt`;

    beforeEach(() => {
        // Clean up any existing test directory
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
        
        // Create test directory and source file
        mkdirSync(testDir, { recursive: true });
        writeFileSync(sourceFile, "test content");
    });

    afterEach(() => {
        // Clean up test directory
        if (existsSync(testDir)) {
            rmSync(testDir, { recursive: true, force: true });
        }
    });

    test("should successfully move a file", async () => {
        const result = await fs_move_file.execute({
            source: sourceFile,
            destination: destinationFile,
        });

        expect(result.success).toBe(true);
        expect(result.source).toBe(sourceFile);
        expect(result.destination).toBe(destinationFile);
        expect(result.message).toContain("Successfully moved");
        
        // Verify file was moved
        expect(existsSync(sourceFile)).toBe(false);
        expect(existsSync(destinationFile)).toBe(true);
    });

    test("should create parent directories when create_dirs is true", async () => {
        const result = await fs_move_file.execute({
            source: sourceFile,
            destination: nestedDestination,
            create_dirs: true,
        });

        expect(result.success).toBe(true);
        expect(existsSync(sourceFile)).toBe(false);
        expect(existsSync(nestedDestination)).toBe(true);
    });

    test("should fail when source file does not exist", async () => {
        const result = await fs_move_file.execute({
            source: `${testDir}/nonexistent.txt`,
            destination: destinationFile,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Source not found");
    });

    test("should fail when destination exists and overwrite is false", async () => {
        // Create destination file
        writeFileSync(destinationFile, "existing content");

        const result = await fs_move_file.execute({
            source: sourceFile,
            destination: destinationFile,
            overwrite: false,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Destination already exists");
        
        // Verify source still exists
        expect(existsSync(sourceFile)).toBe(true);
        expect(existsSync(destinationFile)).toBe(true);
    });

    test("should succeed when destination exists and overwrite is true", async () => {
        // Create destination file
        writeFileSync(destinationFile, "existing content");

        const result = await fs_move_file.execute({
            source: sourceFile,
            destination: destinationFile,
            overwrite: true,
        });

        expect(result.success).toBe(true);
        
        // Verify file was moved and overwrote destination
        expect(existsSync(sourceFile)).toBe(false);
        expect(existsSync(destinationFile)).toBe(true);
    });

    test("should prevent moving files outside current working directory", async () => {
        const result = await fs_move_file.execute({
            source: sourceFile,
            destination: "/tmp/malicious_move.txt",
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Access denied");
    });

    test("should prevent moving files from outside current working directory", async () => {
        const result = await fs_move_file.execute({
            source: "/tmp/malicious_source.txt",
            destination: destinationFile,
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Access denied");
    });

    test("should handle moving directories", async () => {
        const sourceDir = `${testDir}/source_dir`;
        const destinationDir = `${testDir}/destination_dir`;
        
        // Create source directory with content
        mkdirSync(sourceDir);
        writeFileSync(`${sourceDir}/file.txt`, "directory content");

        const result = await fs_move_file.execute({
            source: sourceDir,
            destination: destinationDir,
        });

        expect(result.success).toBe(true);
        expect(existsSync(sourceDir)).toBe(false);
        expect(existsSync(destinationDir)).toBe(true);
        expect(existsSync(`${destinationDir}/file.txt`)).toBe(true);
    });

    test("should have correct tool definition structure", () => {
        expect(fs_move_file.definition).toBeDefined();
        expect(fs_move_file.definition.type).toBe("function");
        expect(fs_move_file.definition.function.name).toBe("fs_move_file");
        expect(fs_move_file.definition.function.description).toContain("Move or rename");
        
        const params = fs_move_file.definition.function.parameters;
        expect(params.type).toBe("object");
        expect(params.required).toEqual(["source", "destination"]);
        expect(params.properties.source).toBeDefined();
        expect(params.properties.destination).toBeDefined();
        expect(params.properties.create_dirs).toBeDefined();
        expect(params.properties.overwrite).toBeDefined();
    });

    test("should handle errors gracefully", async () => {
        // Test with invalid characters or system errors
        const result = await fs_move_file.execute({
            source: sourceFile,
            destination: "", // Invalid destination
        });

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.source).toBe(sourceFile);
        expect(result.destination).toBe("");
    });
});