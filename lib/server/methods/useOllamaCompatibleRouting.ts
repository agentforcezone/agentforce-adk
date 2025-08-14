import type { AgentForceServer } from "../../server";
import type { AgentForceAgent } from "../../agent";
import type { Context } from "hono";

/**
 * Ollama generate request format
 */
export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    format?: string;
    options?: Record<string, unknown>;
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    keep_alive?: string | number;
}

/**
 * Ollama chat message format
 */
export interface OllamaChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
    images?: string[];
}

/**
 * Ollama chat request format
 */
export interface OllamaChatRequest {
    model: string;
    messages: OllamaChatMessage[];
    format?: string;
    options?: Record<string, unknown>;
    stream?: boolean;
    keep_alive?: string | number;
}

/**
 * Adds Ollama-compatible agents that respond to "/api/generate" and "/api/chat" endpoints (chainable method)
 * @param this - The AgentForceServer instance (bound context)
 * @param agent - The AgentForce agent instance to handle Ollama-compatible requests
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function useOllamaCompatibleRouting(
    this: AgentForceServer,
    agent: AgentForceAgent,
): AgentForceServer {
    if (!agent) {
        throw new Error("Agent instance is required");
    }

    // Validate that the agent has the required methods using bracket notation
    if (typeof agent["getName"] !== "function") {
        throw new Error("Agent instance is required");
    }

    const log = this.getLogger();
    const serverName = this.getName();

    // Add /api/generate route
    const generatePath = "/api/generate";
    const generateMethod = "POST";

    log.info({
        serverName,
        method: generateMethod,
        path: generatePath,
        agentName: agent["getName"](),
        action: "ollama_compatible_agent_added",
    }, `Adding Ollama-compatible agent: ${generateMethod} ${generatePath}`);

    const generateRouteAgent = {
        method: generateMethod,
        path: generatePath,
        agent,
    };

    this.addToRouteAgents(generateRouteAgent);

    // Add /api/chat route
    const chatPath = "/api/chat";
    const chatMethod = "POST";

    log.info({
        serverName,
        method: chatMethod,
        path: chatPath,
        agentName: agent["getName"](),
        action: "ollama_compatible_agent_added",
    }, `Adding Ollama-compatible agent: ${chatMethod} ${chatPath}`);

    const chatRouteAgent = {
        method: chatMethod,
        path: chatPath,
        agent,
    };

    this.addToRouteAgents(chatRouteAgent);

    return this;
}

/**
 * Validates Ollama generate request format
 * @param data - The request data to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateOllamaGenerateRequest(data: any): data is OllamaGenerateRequest {
    if (!data || typeof data !== "object") {
        throw new Error("Request body must be a valid JSON object");
    }

    if (!data.model || typeof data.model !== "string") {
        throw new Error("Missing or invalid \"model\" field. Must be a non-empty string");
    }

    if (!data.prompt || typeof data.prompt !== "string") {
        throw new Error("Missing or invalid \"prompt\" field. Must be a non-empty string");
    }

    // Validate optional fields
    if (data.format !== undefined && typeof data.format !== "string") {
        throw new Error("Invalid \"format\" field. Must be a string if provided");
    }

    if (data.system !== undefined && typeof data.system !== "string") {
        throw new Error("Invalid \"system\" field. Must be a string if provided");
    }

    if (data.template !== undefined && typeof data.template !== "string") {
        throw new Error("Invalid \"template\" field. Must be a string if provided");
    }

    if (data.stream !== undefined && typeof data.stream !== "boolean") {
        throw new Error("Invalid \"stream\" field. Must be a boolean if provided");
    }

    if (data.raw !== undefined && typeof data.raw !== "boolean") {
        throw new Error("Invalid \"raw\" field. Must be a boolean if provided");
    }

    if (data.context !== undefined && !Array.isArray(data.context)) {
        throw new Error("Invalid \"context\" field. Must be an array if provided");
    }

    return true;
}

/**
 * Validates Ollama chat request format
 * @param data - The request data to validate
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateOllamaChatRequest(data: any): data is OllamaChatRequest {
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

        // Optional field validations
        if (message.images !== undefined && !Array.isArray(message.images)) {
            throw new Error(`Message at index ${i} has invalid "images" field. Must be an array if provided`);
        }
    }

    // Validate optional fields
    if (data.format !== undefined && typeof data.format !== "string") {
        throw new Error("Invalid \"format\" field. Must be a string if provided");
    }

    if (data.stream !== undefined && typeof data.stream !== "boolean") {
        throw new Error("Invalid \"stream\" field. Must be a boolean if provided");
    }

    return true;
}

/**
 * Converts Ollama chat messages to a conversation context string
 * @param messages - Array of Ollama chat messages
 * @returns {string} The full conversation formatted for the model
 */
function formatOllamaChatContext(messages: OllamaChatMessage[]): string {
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
 * Parses Ollama model parameter to extract provider and model
 * @param modelParam - The model parameter from Ollama request (e.g., "llama3.2")
 * @returns {object} Object containing provider and model
 */
function parseOllamaModelParameter(modelParam: string): { provider: "ollama"; model: string } {
    if (!modelParam || typeof modelParam !== "string") {
        throw new Error("Model parameter must be a non-empty string");
    }

    // Ollama models are typically just model names without provider prefix
    // We'll assume ollama provider by default
    return { provider: "ollama", model: modelParam.trim() };
}

/**
 * Creates a Hono route handler for Ollama generate endpoint
 * @param agent - The AgentForce agent to handle the request
 * @param path - Route path for logging purposes
 * @returns Hono route handler function
 */
export function createOllamaGenerateRouteHandler(agent: AgentForceAgent, path: string): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            let requestData: Record<string, unknown> = {};

            // 🔍 DEBUG: Log incoming request details
            console.log("=== OLLAMA GENERATE REQUEST DEBUG ===");
            console.log("Path:", path);
            console.log("Request URL:", c.req.url);
            console.log("Request Headers:", c.req.header());

            try {
                requestData = await c.req.json();
                
                // 🔍 DEBUG: Log the parsed request body
                console.log("📝 Request Body (parsed JSON):", JSON.stringify(requestData, null, 2));
                
            } catch (jsonError) {
                console.log("❌ JSON Parse Error:", jsonError);
                return c.json({
                    error: "Invalid JSON in request body",
                    message: "Please provide valid JSON data",
                }, 400);
            }

            console.log("🔍 Ollama Generate Endpoint - Validating Request...");
            
            try {
                validateOllamaGenerateRequest(requestData);
                console.log("✅ Ollama Generate Request Validation Passed");
                
                const ollamaRequest = requestData as unknown as OllamaGenerateRequest;
                console.log("🤖 Ollama Model:", ollamaRequest.model);
                console.log("💬 Ollama Prompt:", ollamaRequest.prompt);
                
                // Parse and set provider/model from the request
                try {
                    const { provider, model } = parseOllamaModelParameter(ollamaRequest.model);
                    console.log(`🔧 Setting agent to use provider: ${provider}, model: ${model}`);
                    
                    // Configure the agent with the requested model
                    agent.useLLM(provider, model);
                    
                    // Set system prompt if provided
                    if (ollamaRequest.system) {
                        agent.systemPrompt(ollamaRequest.system);
                    }
                    
                } catch (parseError) {
                    console.error("❌ Model parsing error:", parseError);
                    return c.json({
                        error: "Invalid model parameter",
                        message: parseError instanceof Error ? parseError.message : "Could not parse model parameter",
                    }, 400);
                }

                // Execute the agent with the prompt
                let response: string;
                try {
                    console.log("🤖 Executing agent with prompt...");
                    response = await agent.prompt(ollamaRequest.prompt).getResponse();
                    console.log("✅ Agent execution completed");
                    console.log("📤 Agent response:", response);
                } catch (error) {
                    console.error("❌ Agent execution error:", error);
                    return c.json({
                        error: "Agent execution failed",
                        message: error instanceof Error ? error.message : "Unknown execution error",
                    }, 500);
                }

                // Return Ollama-compatible response
                console.log("📤 Returning Ollama-compatible generate response");
                
                const ollamaResponse = {
                    model: ollamaRequest.model,
                    created_at: new Date().toISOString(),
                    response: response,
                    done: true,
                    context: [], // Could be implemented to track conversation context
                    total_duration: 0, // Could be implemented to track timing
                    load_duration: 0,
                    prompt_eval_count: 0,
                    prompt_eval_duration: 0,
                    eval_count: 0,
                    eval_duration: 0,
                };

                return c.json(ollamaResponse);

            } catch (error) {
                console.error("❌ Ollama generate validation/execution error:", error);
                
                return c.json({
                    error: "Invalid request",
                    message: error instanceof Error ? error.message : "Request validation failed",
                }, 400);
            }

        } catch (error) {
            console.error(`Error in Ollama generate route ${path}:`, error);

            return c.json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            }, 500);
        }
    };
}

/**
 * Creates a Hono route handler for Ollama chat endpoint
 * @param agent - The AgentForce agent to handle the request
 * @param path - Route path for logging purposes
 * @returns Hono route handler function
 */
export function createOllamaChatRouteHandler(agent: AgentForceAgent, path: string): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            let requestData: Record<string, unknown> = {};

            // 🔍 DEBUG: Log incoming request details
            console.log("=== OLLAMA CHAT REQUEST DEBUG ===");
            console.log("Path:", path);
            console.log("Request URL:", c.req.url);
            console.log("Request Headers:", c.req.header());

            try {
                requestData = await c.req.json();
                
                // 🔍 DEBUG: Log the parsed request body
                console.log("📝 Request Body (parsed JSON):", JSON.stringify(requestData, null, 2));
                
            } catch (jsonError) {
                console.log("❌ JSON Parse Error:", jsonError);
                return c.json({
                    error: "Invalid JSON in request body",
                    message: "Please provide valid JSON data",
                }, 400);
            }

            console.log("🔍 Ollama Chat Endpoint - Validating Request...");
            
            try {
                validateOllamaChatRequest(requestData);
                console.log("✅ Ollama Chat Request Validation Passed");
                
                const ollamaRequest = requestData as unknown as OllamaChatRequest;
                console.log("📧 Ollama Messages:", JSON.stringify(ollamaRequest.messages, null, 2));
                console.log("🤖 Ollama Model:", ollamaRequest.model);
                
                const prompt = formatOllamaChatContext(ollamaRequest.messages);
                console.log("💬 Formatted Conversation Context:", prompt);
                
                // Parse and set provider/model from the request
                try {
                    const { provider, model } = parseOllamaModelParameter(ollamaRequest.model);
                    console.log(`🔧 Setting agent to use provider: ${provider}, model: ${model}`);
                    
                    // Configure the agent with the requested model
                    agent.useLLM(provider, model);
                    
                    // Set system prompt from messages if present
                    const systemMessage = ollamaRequest.messages.find(msg => msg.role === "system");
                    if (systemMessage) {
                        agent.systemPrompt(systemMessage.content);
                    }
                    
                } catch (parseError) {
                    console.error("❌ Model parsing error:", parseError);
                    return c.json({
                        error: "Invalid model parameter",
                        message: parseError instanceof Error ? parseError.message : "Could not parse model parameter",
                    }, 400);
                }

                // Execute the agent with the formatted conversation
                let response: string;
                try {
                    console.log("🤖 Executing agent with conversation...");
                    response = await agent.prompt(prompt).getResponse();
                    console.log("✅ Agent execution completed");
                    console.log("📤 Agent response:", response);
                } catch (error) {
                    console.error("❌ Agent execution error:", error);
                    return c.json({
                        error: "Agent execution failed",
                        message: error instanceof Error ? error.message : "Unknown execution error",
                    }, 500);
                }

                // Return Ollama-compatible response
                console.log("📤 Returning Ollama-compatible chat response");
                
                const ollamaResponse = {
                    model: ollamaRequest.model,
                    created_at: new Date().toISOString(),
                    message: {
                        role: "assistant",
                        content: response,
                    },
                    done: true,
                    total_duration: 0, // Could be implemented to track timing
                    load_duration: 0,
                    prompt_eval_count: 0,
                    prompt_eval_duration: 0,
                    eval_count: 0,
                    eval_duration: 0,
                };

                return c.json(ollamaResponse);

            } catch (error) {
                console.error("❌ Ollama chat validation/execution error:", error);
                
                return c.json({
                    error: "Invalid request",
                    message: error instanceof Error ? error.message : "Request validation failed",
                }, 400);
            }

        } catch (error) {
            console.error(`Error in Ollama chat route ${path}:`, error);

            return c.json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            }, 500);
        }
    };
}
