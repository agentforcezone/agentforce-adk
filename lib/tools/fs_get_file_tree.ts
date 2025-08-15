import { readdirSync, statSync } from "fs";
import { join, isAbsolute, basename } from "path";
import type { ToolImplementation } from "../types";

/**
 * File system get file tree tool
 * Recursively generates a file tree from a given path in various output formats
 */
export const fs_get_file_tree: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_get_file_tree",
            description: "Recursively generates a file tree from a given directory path in various output formats (array, json, yaml)",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The root directory to start from (must be absolute path)",
                    },
                    output_format: {
                        type: "string",
                        description: "The output format for the file tree",
                        enum: ["array", "json", "yaml"],
                    },
                    excludes: {
                        type: "array",
                        description: "Directory names to exclude (e.g., ['node_modules', '.git'])",
                    },
                },
                required: ["path", "output_format"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const path = args.path;
        const outputFormat = args.output_format || "array";
        const excludes = args.excludes || [];

        try {
            if (!isAbsolute(path)) {
                return {
                    success: false,
                    error: "The path must be absolute.",
                    path: path,
                };
            }

            if (!["array", "json", "yaml"].includes(outputFormat)) {
                return {
                    success: false,
                    error: "Invalid outputFormat. Use 'array', 'json', or 'yaml'.",
                    output_format: outputFormat,
                };
            }

            // Helper for array output
            const walkArray = (dir: string, arr: string[]) => {
                let stats;
                try {
                    stats = statSync(dir);
                } catch {
                    return;
                }
                if (stats.isDirectory()) {
                    if (excludes.includes(basename(dir))) return;
                    arr.push(dir);
                    try {
                        const entries = readdirSync(dir, { withFileTypes: true });
                        entries.sort((a, b) => {
                            if (a.isDirectory() && !b.isDirectory()) return -1;
                            if (!a.isDirectory() && b.isDirectory()) return 1;
                            return a.name.localeCompare(b.name);
                        });
                        for (const entry of entries) {
                            walkArray(join(dir, entry.name), arr);
                        }
                    } catch {
                        return;
                    }
                } else if (stats.isFile()) {
                    arr.push(dir);
                }
            };

            // Helper for JSON tree
            const walkJson = (dir: string): any => {
                let stats;
                try {
                    stats = statSync(dir);
                } catch {
                    return null;
                }
                if (stats.isDirectory()) {
                    if (excludes.includes(basename(dir))) return null;
                    const children: any[] = [];
                    try {
                        const entries = readdirSync(dir, { withFileTypes: true });
                        entries.sort((a, b) => {
                            if (a.isDirectory() && !b.isDirectory()) return -1;
                            if (!a.isDirectory() && b.isDirectory()) return 1;
                            return a.name.localeCompare(b.name);
                        });
                        for (const entry of entries) {
                            const child = walkJson(join(dir, entry.name));
                            if (child) children.push(child);
                        }
                    } catch {
                        // On error, we will fall through and return the directory with empty children, which is fine.
                    }
                    return { name: basename(dir), path: dir, type: "directory", children };
                } else if (stats.isFile()) {
                    return { name: basename(dir), path: dir, type: "file" };
                }
                return null;
            };

            // Helper for YAML indentation list
            const walkYaml = (dir: string, indent: number, lines: string[]) => {
                let stats;
                try {
                    stats = statSync(dir);
                } catch {
                    return;
                }
                const prefix = "  ".repeat(indent);
                if (stats.isDirectory()) {
                    if (excludes.includes(basename(dir))) return;
                    lines.push(`${prefix}${basename(dir)}/`);
                    try {
                        const entries = readdirSync(dir, { withFileTypes: true });
                        entries.sort((a, b) => {
                            if (a.isDirectory() && !b.isDirectory()) return -1;
                            if (!a.isDirectory() && b.isDirectory()) return 1;
                            return a.name.localeCompare(b.name);
                        });
                        for (const entry of entries) {
                            walkYaml(join(dir, entry.name), indent + 1, lines);
                        }
                    } catch {
                        return;
                    }
                } else if (stats.isFile()) {
                    lines.push(`${prefix}${basename(dir)}`);
                }
            };

            let result;
            if (outputFormat === "array") {
                const arr: string[] = [];
                walkArray(path, arr);
                result = arr;
            } else if (outputFormat === "json") {
                result = walkJson(path);
            } else if (outputFormat === "yaml") {
                const lines: string[] = [];
                walkYaml(path, 0, lines);
                result = lines.join("\n");
            } else {
                result = [];
            }

            return {
                success: true,
                path: path,
                output_format: outputFormat,
                excludes: excludes,
                result: result,
                count: Array.isArray(result) ? result.length : (typeof result === "string" ? result.split("\n").length : 1),
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                path: path,
                output_format: outputFormat,
            };
        }
    },
};