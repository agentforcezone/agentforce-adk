import { readdirSync, statSync } from "fs";
import { join } from "path";
import type { ToolImplementation } from "../../types";

/**
 * File system list directory tool
 * Lists files and directories in a specified path
 */
export const fs_list_dir: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_list_dir",
            description: "List files and directories in a specified path",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The directory path to list contents from (defaults to current working directory)",
                    },
                    include_hidden: {
                        type: "boolean",
                        description: "Whether to include hidden files (starting with .)",
                    },
                    recursive: {
                        type: "boolean",
                        description: "Whether to list directories recursively",
                    },
                },
                required: [],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const path = args.path || process.cwd();
        const includeHidden = args.include_hidden || false;
        const recursive = args.recursive || false;

        try {
            const listDirectory = (dirPath: string, level = 0): any[] => {
                const items = readdirSync(dirPath);
                const result: any[] = [];

                for (const item of items) {
                    if (!includeHidden && item.startsWith(".")) {
                        continue;
                    }

                    const fullPath = join(dirPath, item);
                    const stats = statSync(fullPath);
                    const isDirectory = stats.isDirectory();

                    result.push({
                        name: item,
                        path: fullPath,
                        type: isDirectory ? "directory" : "file",
                        size: stats.size,
                        modified: stats.mtime,
                    });

                    if (recursive && isDirectory && level < 3) {
                        const subItems = listDirectory(fullPath, level + 1);
                        result.push(...subItems);
                    }
                }

                return result;
            };

            const contents = listDirectory(path);
            
            return {
                success: true,
                path: path,
                count: contents.length,
                items: contents,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                path: path,
            };
        }
    },
};