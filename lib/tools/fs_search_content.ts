import { readdirSync, statSync, readFileSync } from "fs";
import { join, resolve, relative, extname } from "path";
import type { ToolImplementation } from "./types";
import { parseGitignore } from "../utils/gitignore_parser";

/**
 * File content search tool - searches for patterns within file contents
 * Returns filenames, line numbers, and matched content
 */
export const fs_search_content: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_search_content",
            description: "Search for patterns within file contents and return matches with line numbers and context",
            parameters: {
                type: "object",
                properties: {
                    pattern: {
                        type: "string",
                        description: "The pattern to search for (can be regex if use_regex is true)",
                    },
                    path: {
                        type: "string",
                        description: "The directory path to search in (defaults to current working directory)",
                    },
                    file_extensions: {
                        type: "array",
                        description: "File extensions to include in search (e.g., ['.ts', '.js', '.md']). If empty, searches all text files.",
                    },
                    use_regex: {
                        type: "boolean",
                        description: "Whether to treat the pattern as a regular expression (default: false)",
                    },
                    case_sensitive: {
                        type: "boolean",
                        description: "Whether the search should be case-sensitive (default: true)",
                    },
                    include_context: {
                        type: "boolean",
                        description: "Whether to include surrounding lines as context (default: true)",
                    },
                    context_lines: {
                        type: "number",
                        description: "Number of lines before and after match to include as context (default: 2, max: 5)",
                    },
                    max_matches_per_file: {
                        type: "number",
                        description: "Maximum matches to return per file (default: 10, max: 50)",
                    },
                    max_total_matches: {
                        type: "number",
                        description: "Maximum total matches to return across all files (default: 100, max: 500)",
                    },
                    use_gitignore: {
                        type: "boolean",
                        description: "Whether to respect .gitignore patterns (default: true)",
                    },
                    max_depth: {
                        type: "number",
                        description: "Maximum directory depth to search (default: 10, max: 20)",
                    },
                    max_file_size: {
                        type: "number",
                        description: "Maximum file size in bytes to search (default: 1MB, max: 10MB)",
                    },
                },
                required: ["pattern"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const pattern = args.pattern;
        const searchPath = args.path || process.cwd();
        const fileExtensions = args.file_extensions || [];
        const useRegex = args.use_regex === true;
        const caseSensitive = args.case_sensitive !== false; // Default to true
        const includeContext = args.include_context !== false; // Default to true
        const contextLines = Math.min(args.context_lines || 2, 5);
        const maxMatchesPerFile = Math.min(args.max_matches_per_file || 10, 50);
        const maxTotalMatches = Math.min(args.max_total_matches || 100, 500);
        const useGitignore = args.use_gitignore !== false; // Default to true
        const maxDepth = Math.min(args.max_depth || 10, 20);
        const maxFileSize = Math.min(args.max_file_size || 1024 * 1024, 10 * 1024 * 1024); // Default 1MB, max 10MB

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

            // Prepare search pattern
            let searchRegex: RegExp;
            try {
                if (useRegex) {
                    searchRegex = new RegExp(pattern, caseSensitive ? "g" : "gi");
                } else {
                    // Escape special regex characters for literal search
                    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                    searchRegex = new RegExp(escapedPattern, caseSensitive ? "g" : "gi");
                }
            } catch (error: any) {
                return {
                    success: false,
                    error: `Invalid regex pattern: ${error.message}`,
                    pattern: pattern,
                };
            }

            // Prepare exclusions
            let excludes: string[] = [];
            if (useGitignore) {
                excludes = parseGitignore(cwd);
            }

            // Common binary file extensions to skip
            const binaryExtensions = new Set([
                ".exe", ".dll", ".so", ".dylib", ".a", ".lib", ".bin", ".dat",
                ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".ico", ".svg",
                ".mp3", ".mp4", ".avi", ".mov", ".wav", ".pdf", ".zip",
                ".tar", ".gz", ".rar", ".7z", ".node", ".wasm",
            ]);

            const results: Array<{
                file: string;
                line_number: number;
                column: number;
                match: string;
                context_before: string[];
                context_after: string[];
                full_line: string;
            }> = [];

            const searchedFiles: string[] = [];
            const skippedFiles: string[] = [];
            const stack: Array<{ path: string; depth: number }> = [{ path: absoluteSearchPath, depth: 0 }];

            let totalMatches = 0;

            while (stack.length > 0 && totalMatches < maxTotalMatches) {
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

                if (stats.isDirectory()) {
                    const baseName = require("path").basename(currentPath);
                    
                    // Check if directory should be excluded
                    if (useGitignore && excludes.includes(baseName)) {
                        continue;
                    }

                    // Add subdirectories and files to search stack
                    try {
                        const entries = readdirSync(currentPath);
                        for (const entry of entries) {
                            if (totalMatches >= maxTotalMatches) break;
                            stack.push({
                                path: join(currentPath, entry),
                                depth: depth + 1,
                            });
                        }
                    } catch {
                        continue; // Skip directories we can't read
                    }
                } else if (stats.isFile()) {
                    const relativePath = relative(cwd, currentPath);
                    const ext = extname(currentPath);
                    
                    // Skip if file size exceeds limit
                    if (stats.size > maxFileSize) {
                        skippedFiles.push(`${relativePath} (file too large: ${Math.round(stats.size / 1024)}KB)`);
                        continue;
                    }

                    // Skip binary files
                    if (binaryExtensions.has(ext.toLowerCase())) {
                        continue;
                    }

                    // Filter by file extensions if specified
                    if (fileExtensions.length > 0 && !fileExtensions.includes(ext)) {
                        continue;
                    }

                    // Check if file should be excluded
                    const baseName = require("path").basename(currentPath);
                    if (useGitignore && excludes.includes(baseName)) {
                        continue;
                    }

                    try {
                        // Read file content
                        const content = readFileSync(currentPath, "utf-8");
                        const lines = content.split("\n");
                        searchedFiles.push(relativePath);

                        let fileMatches = 0;

                        // Search each line
                        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                            if (fileMatches >= maxMatchesPerFile || totalMatches >= maxTotalMatches) {
                                break;
                            }

                            const line = lines[lineIndex];
                            if (!line) continue; // Skip undefined lines
                            
                            let match;
                            searchRegex.lastIndex = 0; // Reset regex state

                            while ((match = searchRegex.exec(line)) !== null && fileMatches < maxMatchesPerFile && totalMatches < maxTotalMatches) {
                                const contextBefore = includeContext 
                                    ? lines.slice(Math.max(0, lineIndex - contextLines), lineIndex)
                                    : [];
                                const contextAfter = includeContext 
                                    ? lines.slice(lineIndex + 1, Math.min(lines.length, lineIndex + 1 + contextLines))
                                    : [];

                                results.push({
                                    file: relativePath,
                                    line_number: lineIndex + 1,
                                    column: match.index + 1,
                                    match: match[0],
                                    context_before: contextBefore,
                                    context_after: contextAfter,
                                    full_line: line,
                                });

                                fileMatches++;
                                totalMatches++;

                                // Prevent infinite loops with zero-width matches
                                if (match[0].length === 0) {
                                    searchRegex.lastIndex++;
                                }
                            }
                        }
                    } catch (error: any) {
                        // Skip files that can't be read as text
                        skippedFiles.push(`${relativePath} (${error.message})`);
                        continue;
                    }
                }
            }

            const truncated = totalMatches >= maxTotalMatches;

            return {
                success: true,
                pattern: pattern,
                use_regex: useRegex,
                case_sensitive: caseSensitive,
                search_path: searchPath,
                file_extensions: fileExtensions,
                total_matches: totalMatches,
                files_searched: searchedFiles.length,
                files_with_matches: new Set(results.map(r => r.file)).size,
                matches: results,
                searched_files: searchedFiles,
                skipped_files: skippedFiles,
                truncated: truncated,
                settings: {
                    max_matches_per_file: maxMatchesPerFile,
                    max_total_matches: maxTotalMatches,
                    context_lines: contextLines,
                    max_depth: maxDepth,
                    max_file_size: maxFileSize,
                },
                message: truncated 
                    ? `Found ${totalMatches} matches (truncated at ${maxTotalMatches} limit). Use max_total_matches parameter to increase limit.`
                    : `Found ${totalMatches} matches across ${new Set(results.map(r => r.file)).size} files`,
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
