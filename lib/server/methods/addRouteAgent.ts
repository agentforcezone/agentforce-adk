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
 * OpenAI-compatible message format
 */
export interface OpenAIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * OpenAI-compatible chat completion request format
 */
export interface OpenAIChatCompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string | string[];
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
 * Validates OpenAI chat completion request format
 * @param data - The request data to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateOpenAIChatCompletionRequest(data: any): data is OpenAIChatCompletionRequest {
    if (!data || typeof data !== "object") {
        throw new Error("Request body must be a valid JSON object");
    }

    if (!data.model || typeof data.model !== "string") {
        throw new Error("Missing or invalid \"model\" field. Must be a non-empty string");
    }

    if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error("Missing or invalid \"messages\" field. Must be an array");
    }

    if (data.messages.length === 0) {
        throw new Error("Messages array cannot be empty");
    }

    // Validate each message
    for (let i = 0; i < data.messages.length; i++) {
        const message = data.messages[i];
        
        if (!message || typeof message !== "object") {
            throw new Error(`Message at index ${i} must be a valid object`);
        }

        if (!message.role || typeof message.role !== "string") {
            throw new Error(`Message at index ${i} missing or invalid "role" field`);
        }

        if (!["system", "user", "assistant"].includes(message.role)) {
            throw new Error(`Message at index ${i} has invalid role "${message.role}". Must be "system", "user", or "assistant"`);
        }

        if (!message.content || typeof message.content !== "string") {
            throw new Error(`Message at index ${i} missing or invalid "content" field. Must be a non-empty string`);
        }
    }

    return true;
}

/**
 * Converts OpenAI messages format to a conversation context string
 * @param messages - Array of OpenAI messages
 * @returns {string} The full conversation formatted for the model
 */
function formatConversationContext(messages: OpenAIMessage[]): string {
    if (messages.length === 0) {
        throw new Error("Messages array cannot be empty");
    }

    // Find the last user message for validation
    const userMessages = messages.filter(msg => msg.role === "user");
    if (userMessages.length === 0) {
        throw new Error("No user message found in messages array");
    }

    // If only one user message and no assistant messages, return just the user content
    if (messages.length === 1 && messages[0]?.role === "user") {
        return messages[0].content;
    }

    // Format the full conversation for context
    const conversationLines: string[] = [];
    
    for (const message of messages) {
        switch (message.role) {
            case "system":
                conversationLines.push(`System: ${message.content}`);
                break;
            case "user":
                conversationLines.push(`Human: ${message.content}`);
                break;
            case "assistant":
                conversationLines.push(`Assistant: ${message.content}`);
                break;
        }
    }

    // Add the current context instruction
    conversationLines.push("\nPlease respond as the Assistant, taking into account the full conversation history above.");

    return conversationLines.join("\n");
}

/**
 * Parses OpenAI model parameter to extract provider and model
 * @param modelParam - The model parameter from OpenAI request (e.g., "ollama/gemma3:12b")
 * @returns {object} Object containing provider and model
 */
function parseModelParameter(modelParam: string): { provider: string; model: string } {
    if (!modelParam || typeof modelParam !== "string") {
        throw new Error("Model parameter must be a non-empty string");
    }

    // Check if model contains provider separator "/"
    if (modelParam.includes("/")) {
        const parts = modelParam.split("/", 2);
        const provider = parts[0]?.trim();
        const model = parts[1]?.trim();

        if (!provider || !model) {
            throw new Error("Invalid model format. Expected 'provider/model' (e.g., 'ollama/gemma3:12b')");
        }

        return { provider, model };
    }

    // If no provider specified, assume it's just a model name and use default provider
    return { provider: "ollama", model: modelParam.trim() };
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
            let prompt: string;

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

                // Check if this is an OpenAI chat completions endpoint
                if (path.includes("/v1/chat/completions")) {
                    try {
                        validateOpenAIChatCompletionRequest(requestData);
                        const openAIRequest = requestData as unknown as OpenAIChatCompletionRequest;
                        prompt = formatConversationContext(openAIRequest.messages);
                        
                        // Parse and set provider/model from the request
                        try {
                            const { provider, model } = parseModelParameter(openAIRequest.model);
                            agent.setProvider(provider);
                            agent.setModel(model);
                        } catch (parseError) {
                            return c.json({
                                error: "Invalid model parameter",
                                message: parseError instanceof Error ? parseError.message : "Unable to parse model parameter",
                                example: {
                                    model: "ollama/gemma3:12b",
                                    messages: [
                                        {
                                            role: "user",
                                            content: "what llm are you",
                                        },
                                    ],
                                },
                            }, 400);
                        }
                    } catch (error) {
                        return c.json({
                            error: "Invalid OpenAI chat completion format",
                            message: error instanceof Error ? error.message : "Unknown validation error",
                            example: {
                                model: "ollama/gemma3:12b",
                                messages: [
                                    {
                                        role: "user",
                                        content: "what llm are you",
                                    },
                                ],
                            },
                        }, 400);
                    }
                } else {
                    // Legacy format validation for non-OpenAI endpoints
                    if (!requestData.prompt || typeof requestData.prompt !== "string") {
                        return c.json({
                            error: "Missing or invalid prompt",
                            message: "Request must include a \"prompt\" field with a string value",
                            example: { prompt: "create a story for an auth service in bun" },
                        }, 400);
                    }
                    prompt = requestData.prompt as string;
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
                    }, 400);
                }
                prompt = requestData.prompt as string;
            } else {
                throw new Error(`Unsupported HTTP method: ${method}`);
            }

            // Execute the agent with the extracted prompt
            let response: string;
            try {
                response = await agent
                    .prompt(prompt)
                    .getResponse();
            } catch (error) {
                console.error("Error executing agent:", error);
                throw new Error(`Agent execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
            }

            // Return OpenAI-compatible response for chat completions endpoints
            if (path.includes("/v1/chat/completions")) {
                return c.json({
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion",
                    created: Math.floor(Date.now() / 1000),
                    model: (requestData as unknown as OpenAIChatCompletionRequest).model,
                    choices: [
                        {
                            index: 0,
                            message: {
                                role: "assistant",
                                content: response,
                            },
                            finish_reason: "stop",
                        },
                    ],
                    usage: {
                        prompt_tokens: prompt.length / 4, // Rough estimate
                        completion_tokens: response.length / 4, // Rough estimate
                        total_tokens: (prompt.length + response.length) / 4,
                    },
                });
            }

            // Legacy response format for non-OpenAI endpoints
            return c.json({
                success: true,
                method,
                path,
                agentName: agent.getName(),
                agentType: agent.getType(),
                prompt,
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
