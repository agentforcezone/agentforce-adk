import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import type { ToolImplementation } from "../../types";

/**
 * File system write tool - writes content to a file
 * Creates parent directories if they don't exist
 */
export const fs_write_file: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_write_file",
            description: "Write content to a file, creating parent directories if needed",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The file path to write to (relative to current directory)",
                    },
                    content: {
                        type: "string",
                        description: "The content to write to the file",
                    },
                    encoding: {
                        type: "string",
                        description: "The encoding to use (default: utf-8)",
                        enum: ["utf-8", "base64", "hex", "ascii"],
                    },
                    create_dirs: {
                        type: "boolean",
                        description: "Whether to create parent directories if they don't exist (default: true)",
                    },
                },
                required: ["path", "content"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const filePath = args.path;
        const content = args.content;
        const encoding = args.encoding || "utf-8";
        const createDirs = args.create_dirs !== false;

        try {
            // Resolve the absolute path
            const absolutePath = resolve(process.cwd(), filePath);
            
            // Security check: ensure we're not writing outside the current working directory
            const cwd = resolve(process.cwd());
            if (!absolutePath.startsWith(cwd)) {
                return {
                    success: false,
                    error: "Access denied: cannot write outside current working directory",
                    path: filePath,
                };
            }

            // Create parent directories if needed
            if (createDirs) {
                const dir = dirname(absolutePath);
                mkdirSync(dir, { recursive: true });
            }

            // Write the file
            writeFileSync(absolutePath, content, encoding as BufferEncoding);

            return {
                success: true,
                path: filePath,
                absolutePath: absolutePath,
                encoding: encoding,
                size: content.length,
                message: `Successfully wrote ${content.length} characters to ${filePath}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                path: filePath,
            };
        }
    },
};
