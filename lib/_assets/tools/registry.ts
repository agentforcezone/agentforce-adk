import type { ToolImplementation, ToolRegistry } from "../../types";
import { fs_list_dir } from "./fs_list_dir";
import { fs_read_file } from "./fs_read_file";
import { fs_write_file } from "./fs_write_file";
import { fs_move_file } from "./fs_move_file";
import { fs_find_files } from "./fs_find_files";
import { fs_find_dirs_and_files } from "./fs_find_dirs_and_files";
import { fs_search_content } from "./fs_search_content";
import { md_create_ascii_tree } from "./md_create_ascii_tree";
import { gh_list_repos } from "./gh_list_repos";
import { os_exec } from "./os_exec";
import { api_fetch } from "./api_fetch";
import { web_fetch } from "./web_fetch";
import { fs_get_file_tree } from "./fs_get_file_tree";
import { filter_content } from "./filter_content";

/**
 * Central registry for all available tools
 * Maps tool names to their implementations
 */
export const toolRegistry: ToolRegistry = {
    fs_list_dir: fs_list_dir,
    fs_read_file: fs_read_file,
    fs_write_file: fs_write_file,
    fs_move_file: fs_move_file,
    fs_find_files: fs_find_files,
    fs_find_dirs_and_files: fs_find_dirs_and_files,
    fs_search_content: fs_search_content,
    md_create_ascii_tree: md_create_ascii_tree,
    gh_list_repos: gh_list_repos,
    os_exec: os_exec,
    api_fetch: api_fetch,
    web_fetch: web_fetch,
    fs_get_file_tree: fs_get_file_tree,
    filter_content: filter_content,
};

/**
 * Get a tool implementation by name
 * @param name - The name of the tool
 * @returns The tool implementation or undefined if not found
 */
export function getTool(name: string): ToolImplementation | undefined {
    return toolRegistry[name];
}

/**
 * Get all available tool names
 * @returns Array of tool names
 */
export function getAvailableTools(): string[] {
    return Object.keys(toolRegistry);
}

/**
 * Check if a tool exists
 * @param name - The name of the tool
 * @returns true if the tool exists
 */
export function hasTool(name: string): boolean {
    return name in toolRegistry;
}