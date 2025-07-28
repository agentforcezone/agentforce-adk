import { readFileSync } from 'fs';
import { join, isAbsolute } from 'path';

/**
 * Reads the content of a file at the given path synchronously.
 * If a workspace is provided, the path is treated as relative to the workspace.
 * Otherwise, the path must be absolute.
 *
 * @param path The path to the file to read. Can be relative if `workspace` is provided.
 * @param workspace The absolute path to the workspace directory.
 * @returns The content of the file as a string.
 * @throws {Error} if the path is not absolute and no workspace is provided.
 */
export function file_read(
    path: string, 
    workspace?: string
): string {
    let filePath: string;
    if (workspace) {
        // If workspace is provided, join it with the (potentially) relative path.
        filePath = join(workspace, path);
    } else {
        // If no workspace, path must be absolute.
        if (!isAbsolute(path)) {
            throw new Error('The path must be absolute when no workspace is provided.');
        }
        filePath = path;
    }
    return readFileSync(filePath, { encoding: 'utf-8' });
}
