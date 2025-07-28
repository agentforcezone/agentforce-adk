import { readdirSync, statSync } from "fs";
import { join, isAbsolute, basename } from "path";

/**
 * Recursively generates a file tree from a given path in various output formats.
 *
 * @param path The root directory to start from (must be absolute).
 * @param outputFormat 'array' | 'json' | 'yaml'
 * @param excludes Directory names to exclude (e.g., ['node_modules', '.git'])
 * @returns File tree in the specified format
 * @throws {Error} if the provided path is not absolute or outputFormat is invalid.
 */
export function get_file_tree(
    path: string,
    outputFormat: "array" | "json" | "yaml",
    excludes: string[] = []
): string[] | object | string {
    if (!isAbsolute(path)) {
        throw new Error("The path must be absolute.");
    }
    if (!["array", "json", "yaml"].includes(outputFormat)) {
        throw new Error("Invalid outputFormat. Use 'array', 'json', or 'yaml'.");
    }

    // Helper for array output
    function walkArray(dir: string, arr: string[]) {
        let stats;
        try {
            stats = statSync(dir);
        } catch {
            return;
        }
        if (stats.isDirectory()) {
            if (excludes.includes(basename(dir))) return;
            arr.push(dir);
            try {
                const entries = readdirSync(dir, { withFileTypes: true });
                entries.sort((a, b) => {
                    if (a.isDirectory() && !b.isDirectory()) return -1;
                    if (!a.isDirectory() && b.isDirectory()) return 1;
                    return a.name.localeCompare(b.name);
                });
                for (const entry of entries) {
                    walkArray(join(dir, entry.name), arr);
                }
            } catch {
                return;
            }
        } else if (stats.isFile()) {
            arr.push(dir);
        }
    }

    // Helper for JSON tree
    function walkJson(dir: string): any {
        let stats;
        try {
            stats = statSync(dir);
        } catch {
            return null;
        }
        if (stats.isDirectory()) {
            if (excludes.includes(basename(dir))) return null;
            const children: any[] = [];
            try {
                const entries = readdirSync(dir, { withFileTypes: true });
                entries.sort((a, b) => {
                    if (a.isDirectory() && !b.isDirectory()) return -1;
                    if (!a.isDirectory() && b.isDirectory()) return 1;
                    return a.name.localeCompare(b.name);
                });
                for (const entry of entries) {
                    const child = walkJson(join(dir, entry.name));
                    if (child) children.push(child);
                }
            } catch {
                // On error, we will fall through and return the directory with empty children, which is fine.
            }
            return { name: basename(dir), path: dir, type: "directory", children };
        } else if (stats.isFile()) {
            return { name: basename(dir), path: dir, type: "file" };
        }
        return null;
    }

    // Helper for YAML indentation list
    function walkYaml(dir: string, indent: number, lines: string[]) {
        let stats;
        try {
            stats = statSync(dir);
        } catch {
            return;
        }
        const prefix = "  ".repeat(indent);
        if (stats.isDirectory()) {
            if (excludes.includes(basename(dir))) return;
            lines.push(`${prefix}${basename(dir)}/`);
            try {
                const entries = readdirSync(dir, { withFileTypes: true });
                entries.sort((a, b) => {
                    if (a.isDirectory() && !b.isDirectory()) return -1;
                    if (!a.isDirectory() && b.isDirectory()) return 1;
                    return a.name.localeCompare(b.name);
                });
                for (const entry of entries) {
                    walkYaml(join(dir, entry.name), indent + 1, lines);
                }
            } catch {
                return;
            }
        } else if (stats.isFile()) {
            lines.push(`${prefix}${basename(dir)}`);
        }
    }

    if (outputFormat === "array") {
        const arr: string[] = [];
        walkArray(path, arr);
        return arr;
    }
    if (outputFormat === "json") {
        return walkJson(path);
    }
    if (outputFormat === "yaml") {
        const lines: string[] = [];
        walkYaml(path, 0, lines);
        return lines.join("\n");
    }
    return [];
}
