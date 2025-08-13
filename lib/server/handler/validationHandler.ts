/**
 * HTTP request validation utilities for server handlers
 */

/**
 * Validates HTTP method
 * @param method - HTTP method to validate
 * @returns Normalized uppercase method
 * @throws Error if method is invalid
 */
export function validateHttpMethod(method: string): string {
    if (!method || typeof method !== "string") {
        throw new Error("HTTP method must be a non-empty string");
    }
    
    const normalizedMethod = method.toUpperCase();
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
    
    if (!validMethods.includes(normalizedMethod)) {
        throw new Error(`Invalid HTTP method: ${method}. Valid methods are: ${validMethods.join(", ")}`);
    }
    
    return normalizedMethod;
}

/**
 * Normalizes a path to ensure it starts with /
 * @param path - The path to normalize
 * @returns Normalized path
 * @throws Error if path is invalid
 */
export function normalizePath(path: string): string {
    if (!path || typeof path !== "string") {
        throw new Error("Route path must be a non-empty string");
    }
    
    return path.startsWith("/") ? path : `/${path}`;
}