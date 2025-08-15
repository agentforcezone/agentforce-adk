/**
 * Truncates a string to the specified length and adds ellipsis if truncated
 * 
 * @param str - The string to truncate
 * @param length - Maximum length before truncation (must be > 3 for meaningful truncation)
 * @returns {string} Truncated string with "..." appended if needed, original string if length <= specified limit
 * 
 * @example
 * ```ts
 * truncate("Hello world", 8); // "Hello..."
 * truncate("Hi", 10); // "Hi"
 * ```
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) {
        return str;
    }
    return str.substring(0, length - 3) + "...";
}