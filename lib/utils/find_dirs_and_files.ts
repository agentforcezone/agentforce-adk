import { readdirSync, statSync } from "fs";
import { join, isAbsolute, basename } from "path";

/**
 * Recursively searches for files and directories matching a pattern starting from a given path.
 *
 * This function synchronously traverses the file system using an iterative approach
 * to prevent stack overflow on very deep directory structures. For applications
 * where performance and non-blocking I/O are critical, consider using an
 * asynchronous version.
 *
 * @param path The directory or file path to start searching from (must be an absolute path).
 * @param fileNamePattern The pattern to match within file and directory names. The search is case-insensitive
 * and checks if the basename (e.g., 'README.md' or 'src') contains the pattern.
 * @param excludes An optional array of directory names to exclude from the search (e.g., ['node_modules', '.git']).
 * @returns An object with arrays of matching directories and files, each with count and items.
 * @throws {Error} if the provided path is not absolute.
 */
export function find_dirs_and_files(
    path: string,
    fileNamePattern: string,
    excludes: string[] = []
): {
    dirs: { count: number; items: string[] };
    files: { count: number; items: string[] };
} {
    if (!isAbsolute(path)) {
        throw new Error("The path must be absolute.");
    }

    const dirResults: string[] = [];
    const fileResults: string[] = [];
    const lowerCasePattern = fileNamePattern.toLowerCase();
    const stack: string[] = [path];

    while (stack.length > 0) {
        const currentPath = stack.pop()!;
        let stats;
        try {
            stats = statSync(currentPath);
        } catch (error) {
            continue;
        }

        if (stats.isDirectory()) {
            if (excludes.includes(basename(currentPath))) {
                continue;
            }
            if (basename(currentPath).toLowerCase().includes(lowerCasePattern)) {
                dirResults.push(currentPath);
            }
            try {
                const entries = readdirSync(currentPath);
                for (const entry of entries) {
                    stack.push(join(currentPath, entry));
                }
            } catch (error) {
                continue;
            }
        } else if (stats.isFile()) {
            if (basename(currentPath).toLowerCase().includes(lowerCasePattern)) {
                fileResults.push(currentPath);
            }
        }
    }

    return {
        dirs: {
            count: dirResults.length,
            items: dirResults,
        },
        files: {
            count: fileResults.length,
            items: fileResults,
        },
    };
}
