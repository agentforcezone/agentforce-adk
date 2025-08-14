import { existsSync, readFileSync } from "fs";
import { join } from "path";

/**
 * Parse .gitignore file and return exclude patterns
 */
export function parseGitignore(rootPath: string): string[] {
    const gitignorePath = join(rootPath, ".gitignore");
    const excludes: string[] = [
        // Always exclude these
        "node_modules",
        ".git",
        "dist",
        "build",
        "coverage",
        ".idea",
        ".vscode",
    ];

    if (existsSync(gitignorePath)) {
        try {
            const content = readFileSync(gitignorePath, "utf-8");
            const lines = content.split("\n");
            
            for (const line of lines) {
                const trimmed = line.trim();
                // Skip comments and empty lines
                if (trimmed && !trimmed.startsWith("#")) {
                    // Handle directory patterns
                    if (trimmed.endsWith("/")) {
                        excludes.push(trimmed.slice(0, -1));
                    } else if (trimmed.startsWith("**/")) {
                        // Convert glob patterns to simple directory names
                        excludes.push(trimmed.replace("**/", "").replace("*", ""));
                    } else if (trimmed.includes("/")) {
                        // Handle paths with slashes
                        const firstPart = trimmed.split("/")[0];
                        if (firstPart) {
                            excludes.push(firstPart);
                        }
                    } else if (!trimmed.includes("*")) {
                        // Include directory names, hidden directories, and specific files
                        // Only exclude patterns that are clearly generic file extensions (like *.tgz, *.lcov)
                        const isGenericExtension = trimmed.startsWith("*.");
                        if (!isGenericExtension) {
                            excludes.push(trimmed);
                        }
                    }
                }
            }
        } catch {
            // Ignore errors reading .gitignore
        }
    }

    return [...new Set(excludes)]; // Remove duplicates
}

/**
 * Check if a path should be excluded based on gitignore patterns
 */
export function shouldExclude(path: string, excludes: string[], isFile: boolean = false): boolean {
    const pathParts = path.split(/[\/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    
    for (const exclude of excludes) {
        // For files, also check if the filename matches exactly
        if (isFile && fileName === exclude) {
            return true;
        }
        
        // Check if any part of the path matches an exclude pattern
        if (pathParts.some(part => part === exclude || part.startsWith(exclude))) {
            return true;
        }
        
        // Check if the full path contains the exclude pattern
        if (path.includes(exclude)) {
            return true;
        }
    }
    
    return false;
}