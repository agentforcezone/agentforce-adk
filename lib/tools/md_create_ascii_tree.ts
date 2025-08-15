import { readdirSync, statSync } from "fs";
import { join, relative } from "path";
import type { ToolImplementation } from "../types";
import { parseGitignore, shouldExclude } from "../utils/gitignore_parser";

interface TreeNode {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: TreeNode[];
    isIgnored?: boolean;
}

/**
 * Create ASCII tree structure from directory
 */
function buildTree(dirPath: string, rootPath: string, excludes: string[], maxDepth: number, currentDepth = 0): TreeNode[] {
    if (currentDepth >= maxDepth) return [];

    const nodes: TreeNode[] = [];

    try {
        const items = readdirSync(dirPath);
        const sortedItems = items.sort((a, b) => {
            // Directories first, then files, both alphabetically
            const aPath = join(dirPath, a);
            const bPath = join(dirPath, b);
            const aIsDir = statSync(aPath).isDirectory();
            const bIsDir = statSync(bPath).isDirectory();
            
            if (aIsDir && !bIsDir) return -1;
            if (!aIsDir && bIsDir) return 1;
            return a.localeCompare(b);
        });

        for (const item of sortedItems) {
            const fullPath = join(dirPath, item);
            const relativePath = relative(rootPath, fullPath);

            try {
                const stats = statSync(fullPath);
                const isDirectory = stats.isDirectory();
                const isExcluded = shouldExclude(relativePath, excludes, !isDirectory);

                const node: TreeNode = {
                    name: item,
                    path: relativePath,
                    isDirectory,
                    isIgnored: isExcluded,
                };

                if (isDirectory) {
                    if (isExcluded) {
                        // If directory is ignored, show only the folder itself, not its children
                        node.children = [];
                    } else {
                        // Recursively get children for non-ignored directories
                        node.children = buildTree(fullPath, rootPath, excludes, maxDepth, currentDepth + 1);
                    }
                }

                nodes.push(node);
            } catch {
                // Skip files/directories we can't access
                continue;
            }
        }
    } catch {
        // Skip directories we can't read
    }

    return nodes;
}

/**
 * Convert tree structure to ASCII representation
 */
function treeToAscii(nodes: TreeNode[], prefix = "", _isLast = true): string {
    let result = "";

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isLastItem = i === nodes.length - 1;
        const connector = isLastItem ? "└── " : "├── ";
        const childPrefix = prefix + (isLastItem ? "    " : "│   ");

        // Add folder indicators and ignored markers
        let displayName = node.name;
        if (node.isDirectory) {
            displayName += "/";
        }
        if (node.isIgnored) {
            displayName += " (ignored)";
        }

        result += prefix + connector + displayName + "\n";

        // Add children if it's a directory and not ignored
        if (node.isDirectory && node.children && node.children.length > 0 && !node.isIgnored) {
            result += treeToAscii(node.children, childPrefix, false);
        }
    }

    return result;
}

/**
 * Markdown ASCII tree creator tool
 * Creates a visual ASCII tree representation of a directory structure
 */
export const md_create_ascii_tree: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "md_create_ascii_tree",
            description: "Create an ASCII tree view of a directory structure, respecting .gitignore patterns. Ignored directories are shown but their contents are not explored.",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The directory path to create tree for (defaults to current working directory)",
                    },
                    use_gitignore: {
                        type: "boolean",
                        description: "Whether to use .gitignore patterns for exclusions (default: true)",
                    },
                    additional_excludes: {
                        type: "array",
                        description: "Additional directories/files to exclude from tree",
                    },
                    max_depth: {
                        type: "number",
                        description: "Maximum depth to traverse (default: 5)",
                    },
                    include_files: {
                        type: "boolean",
                        description: "Whether to include files in the tree (default: true)",
                    },
                    markdown_format: {
                        type: "boolean",
                        description: "Whether to format output as markdown code block (default: true)",
                    },
                },
                required: [],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const searchPath = args.path || process.cwd();
        const useGitignore = args.use_gitignore !== false; // Default true
        const additionalExcludes = args.additional_excludes || [];
        const maxDepth = args.max_depth || 5;
        const includeFiles = args.include_files !== false; // Default true
        const markdownFormat = args.markdown_format !== false; // Default true

        try {
            // Get excludes from .gitignore if enabled
            let excludes: string[] = [...additionalExcludes];
            if (useGitignore) {
                const gitignoreExcludes = parseGitignore(searchPath);
                excludes = [...excludes, ...gitignoreExcludes];
            }

            // Build the tree structure
            const tree = buildTree(searchPath, searchPath, excludes, maxDepth);

            // Filter out files if not requested
            const filterTree = (nodes: TreeNode[]): TreeNode[] => {
                return nodes.filter(node => {
                    if (!includeFiles && !node.isDirectory) {
                        return false;
                    }
                    if (node.children) {
                        node.children = filterTree(node.children);
                    }
                    return true;
                });
            };

            const filteredTree = filterTree(tree);

            // Convert to ASCII representation
            const rootName = searchPath === process.cwd() ? "." : searchPath.split(/[\/\\]/).pop() || searchPath;
            let asciiTree = `${rootName}/\n`;
            asciiTree += treeToAscii(filteredTree);

            // Format as markdown if requested
            let output = asciiTree;
            if (markdownFormat) {
                output = "```\n" + asciiTree + "```";
            }

            // Calculate statistics
            const stats = {
                totalDirectories: 0,
                totalFiles: 0,
                ignoredDirectories: 0,
            };

            const countNodes = (nodes: TreeNode[]): void => {
                for (const node of nodes) {
                    if (node.isDirectory) {
                        stats.totalDirectories++;
                        if (node.isIgnored) {
                            stats.ignoredDirectories++;
                        }
                        if (node.children) {
                            countNodes(node.children);
                        }
                    } else {
                        stats.totalFiles++;
                    }
                }
            };

            countNodes(tree);

            return {
                success: true,
                path: searchPath,
                tree: output,
                statistics: stats,
                excludes: excludes,
                settings: {
                    maxDepth,
                    includeFiles,
                    useGitignore,
                    markdownFormat,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                path: searchPath,
            };
        }
    },
};