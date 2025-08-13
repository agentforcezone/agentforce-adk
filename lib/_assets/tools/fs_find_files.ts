import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import type { ToolImplementation } from "../../types";
import { parseGitignore, shouldExclude } from "../utils/gitignore_parser";

/**
 * File system find files by extension tool
 * Recursively searches for files with specified extensions
 */
export const fs_find_files: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_find_files",
            description: "Recursively find files by extension(s) in a directory, with automatic .gitignore exclusions",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The directory path to search in (defaults to current working directory)",
                    },
                    extensions: {
                        type: "array",
                        description: "Array of file extensions to search for (e.g., ['.md', '.ts', '.js'])",
                    },
                    use_gitignore: {
                        type: "boolean",
                        description: "Whether to use .gitignore patterns for exclusions (default: true)",
                    },
                    additional_excludes: {
                        type: "array",
                        description: "Additional directories to exclude from search",
                    },
                    max_depth: {
                        type: "number",
                        description: "Maximum depth to search (default: 10)",
                    },
                },
                required: ["extensions"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const searchPath = args.path || process.cwd();
        const extensions = args.extensions || [];
        const useGitignore = args.use_gitignore !== false; // Default true
        const additionalExcludes = args.additional_excludes || [];
        const maxDepth = args.max_depth || 10;

        try {
            // Get excludes from .gitignore if enabled
            let excludes: string[] = [...additionalExcludes];
            if (useGitignore) {
                const gitignoreExcludes = parseGitignore(searchPath);
                excludes = [...excludes, ...gitignoreExcludes];
            }

            const foundFiles: any[] = [];

            const searchDirectory = (dirPath: string, depth = 0): void => {
                if (depth > maxDepth) return;

                // Check if this directory should be excluded
                const relativePath = relative(searchPath, dirPath);
                if (relativePath && shouldExclude(relativePath, excludes)) {
                    return;
                }

                try {
                    const items = readdirSync(dirPath);

                    for (const item of items) {
                        const fullPath = join(dirPath, item);
                        const relPath = relative(searchPath, fullPath);
                        
                        try {
                            const stats = statSync(fullPath);

                            if (stats.isDirectory()) {
                                // Skip if directory should be excluded
                                if (shouldExclude(relPath, excludes, false)) {
                                    continue;
                                }
                                // Recursively search subdirectories
                                searchDirectory(fullPath, depth + 1);
                            } else if (stats.isFile()) {
                                // Skip if file should be excluded
                                if (shouldExclude(relPath, excludes, true)) {
                                    continue;
                                }
                                // Check if file matches any of the extensions
                                const hasMatchingExtension = extensions.some((ext: string) => {
                                    // Handle extensions with or without leading dot
                                    const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
                                    return item.endsWith(normalizedExt);
                                });

                                if (hasMatchingExtension) {
                                    foundFiles.push({
                                        name: item,
                                        path: relPath,
                                        fullPath: fullPath,
                                        size: stats.size,
                                        modified: stats.mtime,
                                    });
                                }
                            }
                        } catch (error) {
                            // Skip files/directories we can't access
                            continue;
                        }
                    }
                } catch (error) {
                    // Skip directories we can't read
                }
            };

            searchDirectory(searchPath);

            // Sort files by path for consistent output
            foundFiles.sort((a, b) => a.path.localeCompare(b.path));

            return {
                success: true,
                searchPath: searchPath,
                extensions: extensions,
                excludes: excludes,
                count: foundFiles.length,
                files: foundFiles,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                searchPath: searchPath,
            };
        }
    },
};