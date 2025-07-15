import type { AgentForceServer } from "../../server";
import type { AgentForceAgent } from "../../agent";
import type { Context } from "hono";

/**
 * Route agent configuration for HTTP endpoints
 */
export interface RouteAgent {
    method: string;
    path: string;
    agent: AgentForceAgent;
}

/**
 * Adds a route agent to handle specific HTTP endpoints (chainable method)
 * @param this - The AgentForceServer instance (bound context)
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param path - The route path (e.g., "/story", "/image")
 * @param agent - The AgentForce agent instance to handle requests for this route
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function addRouteAgent(
    this: AgentForceServer,
    method: string,
    path: string,
    agent: AgentForceAgent,
): AgentForceServer {
    // Validate inputs
    if (!method || typeof method !== "string") {
        throw new Error("HTTP method must be a non-empty string");
    }

    if (!path || typeof path !== "string") {
        throw new Error("Route path must be a non-empty string");
    }

    if (!agent) {
        throw new Error("Agent instance is required");
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
        agentName: "AgentForce Agent",
        action: "route_agent_added",
    }, `Adding route agent: ${normalizedMethod} ${normalizedPath}`);

    // Store the route agent configuration
    const routeAgent: RouteAgent = {
        method: normalizedMethod,
        path: normalizedPath,
        agent,
    };

    // Add to the server's route agents collection
    this.addToRouteAgents(routeAgent);

    return this;
}

/**
 * Creates a Hono route handler for an agent endpoint
 * @param agent - The AgentForce agent to handle the request
 * @param method - HTTP method for logging purposes
 * @param path - Route path for logging purposes
 * @returns Hono route handler function
 */
export function createAgentRouteHandler(agent: AgentForceAgent, method: string, path: string): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            let requestData: Record<string, unknown> = {};

            // Extract request data based on HTTP method
            if (["POST", "PUT", "PATCH"].includes(method)) {
                try {
                    requestData = await c.req.json();
                } catch {
                    return c.json({
                        error: "Invalid JSON in request body",
                        message: "Please provide valid JSON data",
                    }, 400);
                }
            } else if (["GET", "HEAD", "OPTIONS", "DELETE"].includes(method)) {
                // For GET, HEAD, OPTIONS, DELETE requests, use query parameters
                const url = new URL(c.req.url);
                requestData = Object.fromEntries(url.searchParams.entries());
            }

            // Validate prompt in request data
            if (!requestData.prompt || typeof requestData.prompt !== "string") {
                return c.json({
                    error: "Missing or invalid prompt",
                    message: "Request must include a \"prompt\" field with a string value",
                    example: { prompt: "create a story for an auth service in bun" },
                }, 400);
            }

            // Check if agent is configured to use route prompts
            let response: string;
            
            // Execute the agent with the provided prompt
            try {
                response = await agent
                    .prompt(requestData.prompt)
                    .getResponse();
            } catch (error) {
                console.error("Error executing agent:", error);
                throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            }

            return c.json({
                success: true,
                method,
                path,
                agentName: agent.getName(),
                agentType: agent.getType(),
                prompt: requestData.prompt,
                response,
            });

        } catch (error) {
            console.error(`Error in route agent ${method} ${path}:`, error);

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
