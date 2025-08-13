import type { Context } from "hono";
import type { AgentForceAgent } from "../../agent";
import type { RouteAgentSchema } from "../methods/addRouteAgent";
import Handlebars from "handlebars";

/**
 * Shared handler creation functions for server routes
 */

/**
 * Creates a handler for serving HTML or Handlebars template files
 * @param filePath - Path to the HTML or HBS file to serve
 * @param templateData - Optional data to pass to Handlebars templates
 * @returns Hono route handler function
 */
export function createHtmlFileHandler(filePath: string, templateData?: Record<string, any>): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            // Use fs.readFileSync for all runtimes
            const { readFileSync } = await import("node:fs");
            const { resolve } = await import("node:path");
            
            const fullPath = resolve(filePath);
            const fileContent = readFileSync(fullPath, "utf-8");
            
            let htmlContent: string;
            
            // Check if it's a Handlebars template
            if (filePath.endsWith(".hbs")) {
                // Compile and render the Handlebars template
                const template = Handlebars.compile(fileContent);
                htmlContent = template(templateData || {});
            } else {
                // Serve as static HTML
                htmlContent = fileContent;
            }
            
            // Return HTML response
            return c.html(htmlContent);
        } catch (error) {
            console.error(`Error serving file ${filePath}:`, error);
            
            if (error instanceof Error && error.message.includes("ENOENT")) {
                return c.html(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>File Not Found</title>
                    </head>
                    <body>
                        <h1>404 - File Not Found</h1>
                        <p>The requested file could not be found: ${filePath}</p>
                    </body>
                    </html>
                `, 404);
            }
            
            return c.html(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Server Error</title>
                </head>
                <body>
                    <h1>500 - Internal Server Error</h1>
                    <p>An error occurred while serving the HTML file.</p>
                </body>
                </html>
            `, 500);
        }
    };
}

/**
 * Creates a handler for processing form POST requests with an agent
 * @param agent - The AgentForce agent to handle the request
 * @param path - Route path for logging purposes
 * @param schema - Optional schema configuration for input and output validation
 * @returns Hono route handler function
 */
export function createFormPostHandler(
    agent: AgentForceAgent, 
    path: string,
    schema?: RouteAgentSchema,
): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            // Parse form data
            const formData = await c.req.parseBody();
            
            // Convert form data to a plain object
            const requestData: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(formData)) {
                requestData[key] = value;
            }
            
            // Get expected input fields from schema or use default
            const expectedInputFields = schema?.input || ["prompt"];
            
            // Extract prompt from form data
            const prompt = requestData["prompt"];
            
            if (!prompt || typeof prompt !== "string") {
                return c.json({
                    error: "Missing or invalid prompt",
                    message: "Form must include a \"prompt\" field with a string value",
                    expectedFields: expectedInputFields,
                }, 400);
            }
            
            // Validate schema if provided
            if (schema && schema.input) {
                const missingFields: string[] = [];
                const unexpectedFields: string[] = [];
                
                // Check for missing required fields
                for (const field of schema.input) {
                    if (field !== "prompt" && (!requestData[field] || requestData[field] === "")) {
                        missingFields.push(field);
                    }
                }
                
                // Check for unexpected fields
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
            
            // Execute the agent with the prompt
            const response = await agent
                .prompt(prompt as string)
                .getResponse();
            
            // Build base response data
            const baseResponseData = {
                success: true,
                prompt,
                response,
                agentName: agent["getName"](),
                // Include any additional input fields from the request
                ...Object.fromEntries(
                    Object.entries(requestData).filter(([key]) => 
                        expectedInputFields.includes(key) && key !== "prompt",
                    ),
                ),
            };
            
            // Filter response data based on output schema or use default
            const expectedOutputFields = schema?.output || ["success", "prompt", "response", "agentName"];
            const filteredResponseData = Object.fromEntries(
                Object.entries(baseResponseData).filter(([key]) => 
                    expectedOutputFields.includes(key),
                ),
            );
            
            // Return JSON response for form submission
            return c.json(filteredResponseData);
            
        } catch (error) {
            console.error(`Error in form POST handler ${path}:`, error);
            
            return c.json({
                success: false,
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            }, 500);
        }
    };
}

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