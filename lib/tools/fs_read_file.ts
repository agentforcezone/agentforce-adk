import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import type { ToolImplementation } from "./types";

/**
 * File system read file tool
 * Reads the contents of a specified file
 */
export const fs_read_file: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_read_file",
            description: "Read the contents of a specified file",
            parameters: {
                type: "object",
                properties: {
                    path: {
                        type: "string",
                        description: "The file path to read",
                    },
                    encoding: {
                        type: "string",
                        description: "The encoding to use (default: utf-8)",
                        enum: ["utf-8", "base64", "hex", "ascii"],
                    },
                    max_length: {
                        type: "number",
                        description: "Maximum number of characters to read (default: unlimited)",
                    },
                },
                required: ["path"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const filePath = args.path;
        const encoding = args.encoding || "utf-8";
        const maxLength = args.max_length;

        try {
            const absolutePath = resolve(process.cwd(), filePath);
            
            if (!existsSync(absolutePath)) {
                return {
                    success: false,
                    error: `File not found: ${filePath}`,
                    path: filePath,
                };
            }

            let content = readFileSync(absolutePath, encoding as BufferEncoding);
            
            // Truncate if max_length is specified
            if (maxLength && typeof content === "string" && content.length > maxLength) {
                content = content.substring(0, maxLength) + "... [truncated]";
            }

            return {
                success: true,
                path: filePath,
                encoding: encoding,
                content: content,
                size: content.length,
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