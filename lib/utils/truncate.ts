/**
 * Truncates a string to the specified length and adds ellipsis if truncated
 * @param str - The string to truncate
 * @param length - Maximum length before truncation
 * @returns Truncated string with "..." appended if needed
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) {
        return str;
    }
    return str.substring(0, length - 3) + "...";
}