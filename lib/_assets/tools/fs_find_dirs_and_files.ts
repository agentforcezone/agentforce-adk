import { readdirSync, statSync } from "fs";
import { join, resolve, basename, relative } from "path";
import type { ToolImplementation } from "../../types";
import { parseGitignore } from "../utils/gitignore_parser";

/**
 * Enhanced file system search tool - finds both files and directories matching a pattern
 * Includes .gitignore support and configurable exclusions
 */
export const fs_find_dirs_and_files: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_find_dirs_and_files",
            description: "Find both files and directories matching a pattern, with .gitignore support and configurable exclusions",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The directory path to search in (defaults to current working directory). Can be relative or absolute.",
                    },
                    pattern: {
                        type: "string",
                        description: "The pattern to match in file/directory names (case-insensitive substring match)",
                    },
                    use_gitignore: {
                        type: "boolean",
                        description: "Whether to use .gitignore patterns for exclusions (default: true)",
                    },
                    additional_excludes: {
                        type: "array",
                        description: "Additional directories/files to exclude from search",
                    },
                    max_depth: {
                        type: "number",
                        description: "Maximum depth to search (default: 10, max: 20)",
                    },
                    max_results: {
                        type: "number",
                        description: "Maximum total results to return (default: 100, max: 500)",
                    },
                    case_sensitive: {
                        type: "boolean",
                        description: "Whether pattern matching should be case-sensitive (default: false)",
                    },
                },
                required: ["pattern"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const pattern = args.pattern;
        const searchPath = args.path || process.cwd();
        const useGitignore = args.use_gitignore !== false; // Default to true
        const additionalExcludes = args.additional_excludes || [];
        const maxDepth = Math.min(args.max_depth || 10, 20); // Cap at 20
        const maxResults = Math.min(args.max_results || 100, 500); // Cap at 500
        const caseSensitive = args.case_sensitive === true; // Default to false

        try {
            // Resolve the absolute path
            const absoluteSearchPath = resolve(process.cwd(), searchPath);
            
            // Security check: ensure we're not searching outside the current working directory
            const cwd = resolve(process.cwd());
            if (!absoluteSearchPath.startsWith(cwd)) {
                return {
                    success: false,
                    error: "Access denied: cannot search outside current working directory",
                    path: searchPath,
                };
            }

            // Check if the search path exists
            try {
                statSync(absoluteSearchPath);
            } catch {
                return {
                    success: false,
                    error: `Search path does not exist: ${searchPath}`,
                    path: searchPath,
                };
            }

            // Prepare exclusions
            let excludes: string[] = [];
            if (useGitignore) {
                excludes = parseGitignore(cwd);
            }
            excludes = [...excludes, ...additionalExcludes];

            // Prepare pattern matching
            const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();

            const dirResults: string[] = [];
            const fileResults: string[] = [];
            const stack: Array<{ path: string; depth: number }> = [{ path: absoluteSearchPath, depth: 0 }];

            let totalResults = 0;

            while (stack.length > 0 && totalResults < maxResults) {
                const { path: currentPath, depth } = stack.pop()!;

                // Check depth limit
                if (depth > maxDepth) {
                    continue;
                }

                let stats;
                try {
                    stats = statSync(currentPath);
                } catch {
                    continue; // Skip inaccessible paths
                }

                const baseName = basename(currentPath);
                const relativePath = relative(cwd, currentPath);

                if (stats.isDirectory()) {
                    // Check if directory should be excluded
                    // Only check the basename for directory exclusions to avoid false positives
                    if (useGitignore && excludes.includes(baseName)) {
                        continue;
                    }
                    
                    // Check additional excludes
                    if (additionalExcludes.includes(baseName)) {
                        continue;
                    }

                    // Check if directory name matches pattern
                    const nameToCheck = caseSensitive ? baseName : baseName.toLowerCase();
                    if (nameToCheck.includes(searchPattern)) {
                        dirResults.push(relativePath || ".");
                        totalResults++;
                    }

                    // Add subdirectories to search stack
                    try {
                        const entries = readdirSync(currentPath);
                        for (const entry of entries) {
                            if (totalResults >= maxResults) break;
                            stack.push({
                                path: join(currentPath, entry),
                                depth: depth + 1,
                            });
                        }
                    } catch {
                        continue; // Skip directories we can't read
                    }
                } else if (stats.isFile()) {
                    // Check if file should be excluded  
                    // Only check the basename for file exclusions to avoid false positives
                    if (useGitignore && excludes.includes(baseName)) {
                        continue;
                    }
                    
                    // Check additional excludes
                    if (additionalExcludes.includes(baseName)) {
                        continue;
                    }

                    // Check if file name matches pattern
                    const nameToCheck = caseSensitive ? baseName : baseName.toLowerCase();
                    if (nameToCheck.includes(searchPattern)) {
                        fileResults.push(relativePath);
                        totalResults++;
                    }
                }
            }

            const totalFound = dirResults.length + fileResults.length;
            const truncated = totalResults >= maxResults;

            return {
                success: true,
                pattern: pattern,
                search_path: searchPath,
                absolute_search_path: absoluteSearchPath,
                case_sensitive: caseSensitive,
                max_depth: maxDepth,
                max_results: maxResults,
                use_gitignore: useGitignore,
                excludes: excludes.length,
                dirs: {
                    count: dirResults.length,
                    items: dirResults,
                },
                files: {
                    count: fileResults.length,
                    items: fileResults,
                },
                total_found: totalFound,
                truncated: truncated,
                message: truncated 
                    ? `Found ${totalFound} results (truncated at ${maxResults} limit). Use max_results parameter to increase limit.`
                    : `Found ${totalFound} results (${dirResults.length} directories, ${fileResults.length} files)`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                pattern: pattern,
                path: searchPath,
            };
        }
    },
};
