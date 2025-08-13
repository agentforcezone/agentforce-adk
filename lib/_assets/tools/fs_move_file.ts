import { renameSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import type { ToolImplementation } from "../../types";

/**
 * File system move/rename tool
 * Moves or renames files and directories
 */
export const fs_move_file: ToolImplementation = {
    definition: {
        type: "function",
        function: {
            name: "fs_move_file",
            description: "Move or rename a file or directory to a new location",
            parameters: {
                type: "object",
                properties: {
                    source: {
                        type: "string",
                        description: "The source file or directory path to move/rename",
                    },
                    destination: {
                        type: "string",
                        description: "The destination path for the file or directory",
                    },
                    create_dirs: {
                        type: "boolean",
                        description: "Whether to create parent directories for destination if they don't exist (default: true)",
                    },
                    overwrite: {
                        type: "boolean",
                        description: "Whether to overwrite existing destination file (default: false)",
                    },
                },
                required: ["source", "destination"],
            },
        },
    },
    execute: async (args: Record<string, any>) => {
        const sourcePath = args.source;
        const destinationPath = args.destination;
        const createDirs = args.create_dirs !== false;
        const overwrite = args.overwrite === true;

        try {
            // Resolve absolute paths
            const absoluteSource = resolve(process.cwd(), sourcePath);
            const absoluteDestination = resolve(process.cwd(), destinationPath);
            
            // Security check: ensure we're not accessing outside the current working directory
            const cwd = resolve(process.cwd());
            if (!absoluteSource.startsWith(cwd) || !absoluteDestination.startsWith(cwd)) {
                return {
                    success: false,
                    error: "Access denied: cannot move files outside current working directory",
                    source: sourcePath,
                    destination: destinationPath,
                };
            }

            // Check if source exists
            if (!existsSync(absoluteSource)) {
                return {
                    success: false,
                    error: `Source not found: ${sourcePath}`,
                    source: sourcePath,
                    destination: destinationPath,
                };
            }

            // Check if destination already exists and overwrite is not allowed
            if (existsSync(absoluteDestination) && !overwrite) {
                return {
                    success: false,
                    error: `Destination already exists: ${destinationPath}. Use overwrite: true to replace.`,
                    source: sourcePath,
                    destination: destinationPath,
                };
            }

            // Create parent directories for destination if needed
            if (createDirs) {
                const destinationDir = dirname(absoluteDestination);
                mkdirSync(destinationDir, { recursive: true });
            }

            // Perform the move/rename operation
            renameSync(absoluteSource, absoluteDestination);

            return {
                success: true,
                source: sourcePath,
                destination: destinationPath,
                absoluteSource: absoluteSource,
                absoluteDestination: absoluteDestination,
                message: `Successfully moved ${sourcePath} to ${destinationPath}`,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                source: sourcePath,
                destination: destinationPath,
            };
        }
    },
};