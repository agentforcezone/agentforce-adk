import type { AgentForceServer } from "../../server";
import type { Context } from "hono";

/**
 * Static route configuration for HTTP endpoints
 */
export interface StaticRoute {
    method: string;
    path: string;
    responseData: any;
}

/**
 * Adds a static route that returns predefined data (chainable method)
 * @param this - The AgentForceServer instance (bound context)
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param path - The route path (e.g., "/health", "/status")
 * @param responseData - The data to return for this route (object or function)
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function addRoute(
    this: AgentForceServer,
    method: string,
    path: string,
    responseData: any,
): AgentForceServer {
    // Validate inputs
    if (!method || typeof method !== "string") {
        throw new Error("HTTP method must be a non-empty string");
    }

    if (!path || typeof path !== "string") {
        throw new Error("Route path must be a non-empty string");
    }

    if (responseData === undefined || responseData === null) {
        throw new Error("Response data is required");
    }

    // Normalize method to uppercase
    const normalizedMethod = method.toUpperCase();

    // Validate HTTP method
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
    if (!validMethods.includes(normalizedMethod)) {
        throw new Error(`Invalid HTTP method: ${method}. Valid methods are: ${validMethods.join(", ")}`);
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;

    const log = this.getLogger();
    const serverName = this.getName();

    log.info({
        serverName,
        method: normalizedMethod,
        path: normalizedPath,
        action: "static_route_added",
    }, `Adding static route: ${normalizedMethod} ${normalizedPath}`);

    // Store the static route configuration
    const staticRoute: StaticRoute = {
        method: normalizedMethod,
        path: normalizedPath,
        responseData,
    };

    // Add to the server's static routes collection
    this.addToStaticRoutes(staticRoute);

    return this;
}

/**
 * Creates a Hono route handler for a static endpoint
 * @param responseData - The data to return (object or function)
 * @param method - HTTP method for logging purposes
 * @param path - Route path for logging purposes
 * @returns Hono route handler function
 */
export function createStaticRouteHandler(responseData: any, method: string, path: string): (c: Context) => Promise<Response> | Response {
    return (c: Context): Promise<Response> | Response => {
        try {
            // If responseData is a function, call it with the context
            if (typeof responseData === "function") {
                const result = responseData(c);
                
                // Handle async functions
                if (result instanceof Promise) {
                    return result.then(data => c.json(data));
                }
                
                return c.json(result);
            }

            // If responseData is an object or primitive, return it directly
            return c.json(responseData);

        } catch (error) {
            console.error(`Error in static route ${method} ${path}:`, error);

            return c.json({
                success: false,
                method,
                path,
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            }, 500);
        }
    };
}
