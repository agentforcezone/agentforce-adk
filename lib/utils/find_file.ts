import { readdirSync, statSync } from "fs";
import { join, isAbsolute } from "path";

/**
 * Recursively searches for files matching a pattern starting from a given path.
 *
 * @param path The directory or file path to start searching from (absolute path).
 * @param fileNamePattern The pattern to match in file names (substring or full name).
 * @returns Array of absolute file paths that match the pattern.
 * @throws {Error} if the path is not absolute or does not exist.
 */
export function find_file(path: string, fileNamePattern: string): string[] {
    if (!isAbsolute(path)) {
        throw new Error("The path must be absolute.");
    }
    const results: string[] = [];
    function search(currentPath: string) {
        let stat;
        try {
            stat = statSync(currentPath);
        } catch (e) {
            return;
        }
        if (stat.isDirectory()) {
            for (const entry of readdirSync(currentPath)) {
                search(join(currentPath, entry));
            }
        } else if (stat.isFile()) {
            if (
                currentPath.toLowerCase().includes(fileNamePattern.toLowerCase())
            ) {
                results.push(currentPath);
            }
        }
    }
    search(path);
    return results;
}
