import type { AgentForceServer } from "../../server";
import type { AgentForceAgent } from "../../agent";
import type { Context } from "hono";

/**
 * Schema configuration for route agent input and output
 */
export interface RouteAgentSchema {
    input?: string[];
    output?: string[];
}

/**
 * Route agent configuration for HTTP endpoints
 */
export interface RouteAgent {
    method: string;
    path: string;
    agent: AgentForceAgent;
    schema?: RouteAgentSchema;
}

/**
 * Adds a route agent to handle specific HTTP endpoints (chainable method)
 * @param this - The AgentForceServer instance (bound context)
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param path - The route path (e.g., "/story", "/image")
 * @param agent - The AgentForce agent instance to handle requests for this route
 * @param schema - Optional schema configuration for input and output fields
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function addRouteAgent(
    this: AgentForceServer,
    method: string,
    path: string,
    agent: AgentForceAgent,
    schema?: RouteAgentSchema,
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

    // Validate and normalize schema if provided
    let normalizedSchema: RouteAgentSchema | undefined;
    if (schema) {
        normalizedSchema = {
            input: schema.input || ["prompt"],
            output: schema.output || ["success", "method", "path", "agentName", "prompt", "response"],
        };

        // Ensure "prompt" is always included in input (required field)
        if (normalizedSchema.input && !normalizedSchema.input.includes("prompt")) {
            normalizedSchema.input.push("prompt");
        }
    }

    const log = this.getLogger();
    const serverName = this.getName();

    log.info({
        serverName,
        method: normalizedMethod,
        path: normalizedPath,
        agentName: "AgentForce Agent",
        schema: normalizedSchema,
        action: "route_agent_added",
    }, `Adding route agent: ${normalizedMethod} ${normalizedPath}`);

    // Store the route agent configuration
    const routeAgent: RouteAgent = {
        method: normalizedMethod,
        path: normalizedPath,
        agent,
        schema: normalizedSchema,
    };

    // Add to the server's route agents collection
    this.addToRouteAgents(routeAgent);

    return this;
}

/**
 * Creates a Hono route handler for an agent endpoint with schema support
 * @param agent - The AgentForce agent to handle the request
 * @param method - HTTP method for logging purposes
 * @param path - Route path for logging purposes
 * @param schema - Optional schema configuration for input and output
 * @returns Hono route handler function
 */
export function createAgentRouteHandler(
    agent: AgentForceAgent, 
    method: string, 
    path: string, 
    schema?: RouteAgentSchema,
): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            let requestData: Record<string, unknown> = {};
            let prompt: string;

            // Get expected input fields from schema or use default
            const expectedInputFields = schema?.input || ["prompt"];

            // 🔍 DEBUG: Log incoming request details
            console.log("=== INCOMING REQUEST DEBUG ===");
            console.log("Method:", method);
            console.log("Path:", path);
            console.log("Request URL:", c.req.url);
            console.log("Request Headers:", c.req.header());
            console.log("Expected Input Fields:", expectedInputFields);

            // Extract request data based on HTTP method
            if (["POST", "PUT", "PATCH"].includes(method)) {
                try {
                    requestData = await c.req.json();
                    
                    // 🔍 DEBUG: Log the parsed request body
                    console.log("📝 Request Body (parsed JSON):", JSON.stringify(requestData, null, 2));
                    console.log("Request Body Type:", typeof requestData);
                    console.log("Request Body Keys:", Object.keys(requestData || {}));
                    
                } catch (jsonError) {
                    console.log("❌ JSON Parse Error:", jsonError);
                    return c.json({
                        error: "Invalid JSON in request body",
                        message: "Please provide valid JSON data",
                    }, 400);
                }

                // Validate required fields based on schema or default behavior
                if (!requestData.prompt || typeof requestData.prompt !== "string") {
                    return c.json({
                        error: "Missing or invalid prompt",
                        message: "Request must include a \"prompt\" field with a string value",
                        example: { prompt: "create a story for an auth service in bun" },
                        expectedFields: expectedInputFields,
                    }, 400);
                }
                prompt = requestData.prompt as string;

                // Strict validation when schema is provided
                if (schema && schema.input) {
                    // Check for missing required fields (all fields in schema.input except 'prompt')
                    const missingFields: string[] = [];
                    const unexpectedFields: string[] = [];

                    // Validate that all schema-defined fields are present
                    for (const field of schema.input) {
                        if (field !== "prompt" && (!requestData[field] || requestData[field] === "")) {
                            missingFields.push(field);
                        }
                    }

                    // Check for unexpected fields (not in schema)
                    for (const field of Object.keys(requestData)) {
                        if (!schema.input.includes(field)) {
                            unexpectedFields.push(field);
                        }
                    }

                    // Return error if there are missing required fields
                    if (missingFields.length > 0) {
                        return c.json({
                            error: "Missing required fields",
                            message: `The following required fields are missing: ${missingFields.join(", ")}`,
                            missingFields,
                            expectedFields: schema.input,
                            providedFields: Object.keys(requestData),
                        }, 400);
                    }

                    // Return error if there are unexpected fields
                    if (unexpectedFields.length > 0) {
                        return c.json({
                            error: "Unexpected fields in request",
                            message: `The following fields are not allowed: ${unexpectedFields.join(", ")}`,
                            unexpectedFields,
                            expectedFields: schema.input,
                            providedFields: Object.keys(requestData),
                        }, 400);
                    }
                }
            } else if (["GET", "HEAD", "OPTIONS", "DELETE"].includes(method)) {
                // For GET, HEAD, OPTIONS, DELETE requests, use query parameters
                const url = new URL(c.req.url);
                requestData = Object.fromEntries(url.searchParams.entries());

                if (!requestData.prompt || typeof requestData.prompt !== "string") {
                    return c.json({
                        error: "Missing or invalid prompt",
                        message: "Request must include a \"prompt\" query parameter with a string value",
                        example: "?prompt=create a story for an auth service in bun",
                        expectedFields: expectedInputFields,
                    }, 400);
                }
                prompt = requestData.prompt as string;

                // Strict validation when schema is provided
                if (schema && schema.input) {
                    // Check for missing required fields (all fields in schema.input except 'prompt')
                    const missingFields: string[] = [];
                    const unexpectedFields: string[] = [];

                    // Validate that all schema-defined fields are present
                    for (const field of schema.input) {
                        if (field !== "prompt" && (!requestData[field] || requestData[field] === "")) {
                            missingFields.push(field);
                        }
                    }

                    // Check for unexpected fields (not in schema)
                    for (const field of Object.keys(requestData)) {
                        if (!schema.input.includes(field)) {
                            unexpectedFields.push(field);
                        }
                    }

                    // Return error if there are missing required fields
                    if (missingFields.length > 0) {
                        return c.json({
                            error: "Missing required fields",
                            message: `The following required fields are missing: ${missingFields.join(", ")}`,
                            missingFields,
                            expectedFields: schema.input,
                            providedFields: Object.keys(requestData),
                        }, 400);
                    }

                    // Return error if there are unexpected fields
                    if (unexpectedFields.length > 0) {
                        return c.json({
                            error: "Unexpected fields in request",
                            message: `The following fields are not allowed: ${unexpectedFields.join(", ")}`,
                            unexpectedFields,
                            expectedFields: schema.input,
                            providedFields: Object.keys(requestData),
                        }, 400);
                    }
                }
            } else {
                throw new Error(`Unsupported HTTP method: ${method}`);
            }

            // Execute the agent with the extracted prompt
            let response: string;
            try {
                console.log("🚀 Executing Agent with Prompt:", prompt);
                response = await agent
                    .prompt(prompt)
                    .getResponse();
                console.log("✅ Agent Response Received:", response.substring(0, 100) + (response.length > 100 ? "..." : ""));
            } catch (error) {
                console.error("❌ Error executing agent:", error);
                throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            }

            // Build response data based on schema configuration
            const baseResponseData = {
                success: true,
                method,
                path,
                agentName: agent.getName(),
                prompt,
                response,
                // Include any additional input fields from the request
                ...Object.fromEntries(
                    Object.entries(requestData).filter(([key]) => 
                        expectedInputFields.includes(key) && key !== "prompt",
                    ),
                ),
            };

            // Filter response data based on output schema or use default
            const expectedOutputFields = schema?.output || ["success", "method", "path", "agentName", "agentType", "prompt", "response"];
            const filteredResponseData = Object.fromEntries(
                Object.entries(baseResponseData).filter(([key]) => 
                    expectedOutputFields.includes(key),
                ),
            );

            return c.json(filteredResponseData);

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
