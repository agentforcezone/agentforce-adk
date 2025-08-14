import type { Context } from "hono";
import type { AgentForceAgent } from "../../agent";
import type { RouteAgentSchema } from "../methods/addRouteAgent";

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
        const logger = agent["getLogger"]();
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
            logger.error(`Error in form POST handler ${path}:`, error);
            
            return c.json({
                success: false,
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            }, 500);
        }
    };
}