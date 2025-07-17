import type { AgentForceServer } from "../../server";
import type { AgentForceAgent } from "../../agent";
import type { Context } from "hono";

/**
 * OpenAI content object for multimodal messages
 */
export interface OpenAIContentObject {
    type: "text" | "image_url";
    text?: string;
    image_url?: {
        url: string;
        detail?: "auto" | "low" | "high";
    };
}

/**
 * OpenAI-compatible message format with flexible content
 */
export interface OpenAIMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | OpenAIContentObject[];
    name?: string;
    tool_calls?: Array<{
        id: string;
        type: "function";
        function: {
            name: string;
            arguments: string;
        };
    }>;
    tool_call_id?: string;
}

/**
 * OpenAI streaming options
 */
export interface OpenAIStreamOptions {
    include_usage?: boolean;
}

/**
 * OpenAI tool definition
 */
export interface OpenAITool {
    type: "function";
    function: {
        name: string;
        description?: string;
        parameters?: Record<string, unknown>;
    };
}

/**
 * OpenAI-compatible chat completion request format with all optional parameters
 */
export interface OpenAIChatCompletionRequest {
    model: string;
    messages: OpenAIMessage[];
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    n?: number;
    stream?: boolean;
    stream_options?: OpenAIStreamOptions;
    stop?: string | string[];
    presence_penalty?: number;
    frequency_penalty?: number;
    logit_bias?: Record<string, number>;
    user?: string;
    tools?: OpenAITool[];
    tool_choice?: "none" | "auto" | { type: "function"; function: { name: string } };
    response_format?: { type: "text" | "json_object" };
    seed?: number;
}

/**
 * OpenAI-compatible agent route configuration
 */
export interface OpenAICompatibleRouteAgent {
    path: string;
    agent: AgentForceAgent;
}

/**
 * Adds an OpenAI-compatible agent that responds to "/v1/chat/completions" endpoint (chainable method)
 * @param this - The AgentForceServer instance (bound context)
 * @param agent - The AgentForce agent instance to handle OpenAI-compatible requests
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function useOpenAICompatibleRouting(
    this: AgentForceServer,
    agent: AgentForceAgent,
): AgentForceServer {
    if (!agent) {
        throw new Error("Agent instance is required");
    }

    // Validate that the agent has the required methods
    if (typeof agent.getName !== "function") {
        throw new Error("Agent instance is required");
    }

    const path = "/v1/chat/completions";
    const method = "POST";

    const log = this.getLogger();
    const serverName = this.getName();

    log.info({
        serverName,
        method,
        path,
        agentName: agent.getName(),
        action: "openai_compatible_agent_added",
    }, `Adding OpenAI-compatible agent: ${method} ${path}`);

    // Store the OpenAI-compatible route agent configuration
    const routeAgent = {
        method,
        path,
        agent,
    };

    // Add to the server's route agents collection
    this.addToRouteAgents(routeAgent);

    return this;
}

/**
 * Validates OpenAI content object
 * @param content - The content to validate
 * @param messageIndex - Index of the message for error reporting
 * @returns {boolean} True if valid, throws error if invalid
 */
function validateOpenAIContent(content: any, messageIndex: number): boolean {
    if (typeof content === "string") {
        if (content.length === 0) {
            throw new Error(`Message at index ${messageIndex} has empty content string`);
        }
        return true;
    }

    if (Array.isArray(content)) {
        if (content.length === 0) {
            throw new Error(`Message at index ${messageIndex} has empty content array`);
        }

        for (let j = 0; j < content.length; j++) {
            const contentObj = content[j];
            
            if (!contentObj || typeof contentObj !== "object") {
                throw new Error(`Message at index ${messageIndex}, content object at index ${j} must be a valid object`);
            }

            if (!contentObj.type || typeof contentObj.type !== "string") {
                throw new Error(`Message at index ${messageIndex}, content object at index ${j} missing "type" field`);
            }

            if (!["text", "image_url"].includes(contentObj.type)) {
                throw new Error(`Message at index ${messageIndex}, content object at index ${j} has invalid type "${contentObj.type}". Must be "text" or "image_url"`);
            }

            if (contentObj.type === "text" && (!contentObj.text || typeof contentObj.text !== "string")) {
                throw new Error(`Message at index ${messageIndex}, content object at index ${j} with type "text" must have a non-empty "text" field`);
            }

            if (contentObj.type === "image_url") {
                if (!contentObj.image_url || typeof contentObj.image_url !== "object") {
                    throw new Error(`Message at index ${messageIndex}, content object at index ${j} with type "image_url" must have an "image_url" object`);
                }
                if (!contentObj.image_url.url || typeof contentObj.image_url.url !== "string") {
                    throw new Error(`Message at index ${messageIndex}, content object at index ${j} with type "image_url" must have a valid "url" in image_url object`);
                }
            }
        }
        return true;
    }

    throw new Error(`Message at index ${messageIndex} content must be either a string or an array of content objects`);
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

        if (!["system", "user", "assistant", "tool"].includes(message.role)) {
            throw new Error(`Message at index ${i} has invalid role "${message.role}". Must be "system", "user", "assistant", or "tool"`);
        }

        if (message.content === undefined || message.content === null) {
            throw new Error(`Message at index ${i} missing "content" field`);
        }

        validateOpenAIContent(message.content, i);

        // Optional field validations
        if (message.name !== undefined && typeof message.name !== "string") {
            throw new Error(`Message at index ${i} has invalid "name" field. Must be a string if provided`);
        }

        if (message.tool_call_id !== undefined && typeof message.tool_call_id !== "string") {
            throw new Error(`Message at index ${i} has invalid "tool_call_id" field. Must be a string if provided`);
        }

        if (message.tool_calls !== undefined) {
            if (!Array.isArray(message.tool_calls)) {
                throw new Error(`Message at index ${i} has invalid "tool_calls" field. Must be an array if provided`);
            }
            // Additional tool_calls validation could be added here
        }
    }

    // Validate optional parameters with type checking
    if (data.temperature !== undefined && (typeof data.temperature !== "number" || data.temperature < 0 || data.temperature > 2)) {
        throw new Error("Invalid \"temperature\" field. Must be a number between 0 and 2 if provided");
    }

    if (data.max_tokens !== undefined && (typeof data.max_tokens !== "number" || data.max_tokens < 1)) {
        throw new Error("Invalid \"max_tokens\" field. Must be a positive number if provided");
    }

    if (data.top_p !== undefined && (typeof data.top_p !== "number" || data.top_p < 0 || data.top_p > 1)) {
        throw new Error("Invalid \"top_p\" field. Must be a number between 0 and 1 if provided");
    }

    if (data.n !== undefined && (typeof data.n !== "number" || data.n < 1 || data.n > 128)) {
        throw new Error("Invalid \"n\" field. Must be a number between 1 and 128 if provided");
    }

    if (data.stream !== undefined && typeof data.stream !== "boolean") {
        throw new Error("Invalid \"stream\" field. Must be a boolean if provided");
    }

    if (data.presence_penalty !== undefined && (typeof data.presence_penalty !== "number" || data.presence_penalty < -2 || data.presence_penalty > 2)) {
        throw new Error("Invalid \"presence_penalty\" field. Must be a number between -2 and 2 if provided");
    }

    if (data.frequency_penalty !== undefined && (typeof data.frequency_penalty !== "number" || data.frequency_penalty < -2 || data.frequency_penalty > 2)) {
        throw new Error("Invalid \"frequency_penalty\" field. Must be a number between -2 and 2 if provided");
    }

    if (data.user !== undefined && typeof data.user !== "string") {
        throw new Error("Invalid \"user\" field. Must be a string if provided");
    }

    return true;
}

/**
 * Extracts text content from OpenAI message content (string or array)
 * @param content - The content field from an OpenAI message
 * @returns {string} The extracted text content
 */
function extractTextContent(content: string | OpenAIContentObject[]): string {
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        // Extract text from content objects
        const textParts: string[] = [];
        
        for (const contentObj of content) {
            if (contentObj.type === "text" && contentObj.text) {
                textParts.push(contentObj.text);
            } else if (contentObj.type === "image_url") {
                // For image content, add a placeholder or description
                textParts.push("[Image provided]");
            }
        }
        
        return textParts.join(" ");
    }

    return "";
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
        return extractTextContent(messages[0].content);
    }

    // Format the full conversation for context
    const conversationLines: string[] = [];
    
    for (const message of messages) {
        const textContent = extractTextContent(message.content);
        
        switch (message.role) {
            case "system":
                conversationLines.push(`System: ${textContent}`);
                break;
            case "user":
                conversationLines.push(`Human: ${textContent}`);
                break;
            case "assistant":
                conversationLines.push(`Assistant: ${textContent}`);
                break;
            case "tool":
                conversationLines.push(`Tool: ${textContent}`);
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
 * Creates a Hono route handler for OpenAI-compatible endpoints
 * @param agent - The AgentForce agent to handle the request
 * @param path - Route path for logging purposes
 * @returns Hono route handler function
 */
export function createOpenAICompatibleRouteHandler(agent: AgentForceAgent, path: string): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            let requestData: Record<string, unknown> = {};

            // 🔍 DEBUG: Log incoming request details
            console.log("=== OPENAI COMPATIBLE REQUEST DEBUG ===");
            console.log("Path:", path);
            console.log("Request URL:", c.req.url);
            console.log("Request Headers:", c.req.header());

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

            console.log("🔍 OpenAI Endpoint - Validating Request...");
            console.log("Request Data for Validation:", JSON.stringify(requestData, null, 2));
            
            try {
                validateOpenAIChatCompletionRequest(requestData);
                console.log("✅ OpenAI Request Validation Passed");
                
                const openAIRequest = requestData as unknown as OpenAIChatCompletionRequest;
                console.log("📧 OpenAI Messages:", JSON.stringify(openAIRequest.messages, null, 2));
                console.log("🤖 OpenAI Model:", openAIRequest.model);
                
                const prompt = formatConversationContext(openAIRequest.messages);
                console.log("💬 Formatted Conversation Context:", prompt);
                
                // Parse and set provider/model from the request
                try {
                    const { provider, model } = parseModelParameter(openAIRequest.model);
                    agent.setProvider(provider);
                    agent.setModel(model);
                } catch (parseError) {
                    console.log("❌ Model Parameter Parse Error:", parseError);
                    console.log("Failed Model Parameter:", openAIRequest.model);
                    
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
                    return c.json({
                        error: "Agent execution failed",
                        message: error instanceof Error ? error.message : "Unknown error occurred",
                    }, 500);
                }

                // Return OpenAI-compatible response
                console.log("📤 Returning OpenAI-compatible response");
                const openAIResponse = {
                    id: `chatcmpl-${Date.now()}`,
                    object: "chat.completion",
                    created: Math.floor(Date.now() / 1000),
                    model: openAIRequest.model,
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
                };
                console.log("Response JSON:", JSON.stringify(openAIResponse, null, 2));
                return c.json(openAIResponse);

            } catch (error) {
                console.log("❌ OpenAI Request Validation Failed:", error);
                console.log("Failed Request Data:", JSON.stringify(requestData, null, 2));
                
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

        } catch (error) {
            console.error(`Error in OpenAI-compatible route ${path}:`, error);

            return c.json({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error occurred",
            }, 500);
        }
    };
}
