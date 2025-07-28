import { readdirSync, statSync } from "fs";
import { join, isAbsolute, basename } from "path";

/**
 * Recursively searches for files matching a pattern starting from a given path.
 *
 * This function synchronously traverses the file system using an iterative approach
 * to prevent stack overflow on very deep directory structures. For applications
 * where performance and non-blocking I/O are critical, consider using an
 * asynchronous version.
 *
 * @param path The directory or file path to start searching from (must be an absolute path).
 * @param fileNamePattern The pattern to match within file names. The search is case-insensitive
 * and checks if the file's basename (e.g., 'README.md') contains the pattern.
 * @param excludes An optional array of directory names to exclude from the search (e.g., ['node_modules', '.git']).
 * @returns An array of absolute file paths that match the pattern.
 * @throws {Error} if the provided path is not absolute.
 */
export function find_files(path: string, fileNamePattern: string, excludes: string[] = []): string[] {
    if (!isAbsolute(path)) {
        throw new Error("The path must be absolute.");
    }

    const results: string[] = [];
    const lowerCasePattern = fileNamePattern.toLowerCase();

    // Using a stack for an iterative approach to avoid deep recursion issues.
    const stack: string[] = [path];

    while (stack.length > 0) {
        // Non-null assertion is safe because of the while loop condition.
        const currentPath = stack.pop()!;

        let stats;
        try {
            stats = statSync(currentPath);
        } catch (error) {
            // Silently ignore errors (e.g., permission denied, file not found)
            // and continue to the next path in the stack.
            continue;
        }

        if (stats.isDirectory()) {
            // Check if the directory should be excluded.
            if (excludes.includes(basename(currentPath))) {
                continue;
            }

            try {
                const entries = readdirSync(currentPath);
                // Add directory entries to the stack to be processed.
                for (const entry of entries) {
                    stack.push(join(currentPath, entry));
                }
            } catch (error) {
                // Ignore errors when reading directory contents and continue.
                continue;
            }
        } else if (stats.isFile()) {
            if (basename(currentPath).toLowerCase().includes(lowerCasePattern)) {
                results.push(currentPath);
            }
        }
    }

    return results;
}