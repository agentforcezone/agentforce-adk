import { describe, expect, test } from "bun:test";
import { toolRegistry, getTool, getAvailableTools, hasTool } from "../../lib/tools/registry";
import { ToolType } from "../../lib/types";

describe("Tool Registry Integration Tests", () => {
    test("should include fs_move_file in registry", () => {
        expect(hasTool("fs_move_file")).toBe(true);
    });

    test("should be able to get fs_move_file tool", () => {
        const tool = getTool("fs_move_file");
        expect(tool).toBeDefined();
        expect(tool?.definition.function.name).toBe("fs_move_file");
    });

    test("should include fs_move_file in available tools list", () => {
        const availableTools = getAvailableTools();
        expect(availableTools).toContain("fs_move_file");
    });

    test("should have all tools from ToolType union available", () => {
        const toolTypeValues: ToolType[] = [
            "fs_list_dir",
            "fs_read_file", 
            "fs_write_file",
            "fs_move_file",
            "fs_find_files",
            "fs_find_dirs_and_files",
            "fs_search_content",
            "md_create_ascii_tree",
            "gh_list_repos",
            "os_exec",
            "api_fetch",
            "web_fetch"
        ];
        const availableTools = getAvailableTools();
        
        for (const toolName of toolTypeValues) {
            expect(availableTools).toContain(toolName);
            expect(hasTool(toolName)).toBe(true);
        }
    });

    test("ToolType union should match registry keys", () => {
        const registryKeys = Object.keys(toolRegistry);
        const toolTypeValues: ToolType[] = [
            "fs_list_dir",
            "fs_read_file", 
            "fs_write_file",
            "fs_move_file",
            "fs_find_files",
            "fs_find_dirs_and_files",
            "fs_search_content",
            "md_create_ascii_tree",
            "gh_list_repos",
            "os_exec",
            "api_fetch",
            "web_fetch"
        ];
        
        // All union type values should be in registry
        for (const toolValue of toolTypeValues) {
            expect(registryKeys).toContain(toolValue);
        }
    });

    test("fs_move_file tool should have correct definition structure", () => {
        const tool = getTool("fs_move_file");
        expect(tool).toBeDefined();
        
        if (tool) {
            expect(tool.definition.type).toBe("function");
            expect(tool.definition.function.name).toBe("fs_move_file");
            expect(tool.definition.function.description).toContain("Move or rename");
            
            const params = tool.definition.function.parameters;
            expect(params.required).toEqual(["source", "destination"]);
            expect(params.properties.source).toBeDefined();
            expect(params.properties.destination).toBeDefined();
            expect(params.properties.create_dirs).toBeDefined();
            expect(params.properties.overwrite).toBeDefined();
        }
    });

    test("should be able to use ToolType union values", () => {
        const moveFile: ToolType = "fs_move_file";
        const readFile: ToolType = "fs_read_file";
        const writeFile: ToolType = "fs_write_file";
        const listDir: ToolType = "fs_list_dir";
        
        expect(moveFile).toBe("fs_move_file");
        expect(readFile).toBe("fs_read_file");
        expect(writeFile).toBe("fs_write_file");
        expect(listDir).toBe("fs_list_dir");
    });
});