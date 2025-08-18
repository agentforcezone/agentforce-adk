import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { Tool } from "../types";
import { executeTool } from "../agent/functions/tools";
import type { AgentForceLogger, ModelConfig } from "../types";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { truncate } from "../utils/truncate";

/**
 * Interface for OpenRouter tool use functionality
 * @interface OpenRouterToolUseInterface  
 * @property {function} generateWithTools - Generate response with tool support using a prompt
 * @property {function} chatWithTools - Chat with tool support using message history
 */
export interface OpenRouterToolUseInterface {
    generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger, agent?: any): Promise<string>;
    chatWithTools(messages: Array<{ role: string; content: string }>, tools: Tool[], logger?: AgentForceLogger, agent?: any): Promise<string>;
}

// Re-export types for convenience
export type { Tool, AgentForceLogger, ModelConfig };

/**
 * OpenRouter tool use functionality for the AgentForce SDK
 * Handles tool execution with OpenRouter models via OpenAI-compatible interface
 */
export class OpenRouterToolUse implements OpenRouterToolUseInterface {
    private model: string;
    private modelConfig?: ModelConfig;
    private client: OpenAI;

    constructor(model: string, modelConfig?: ModelConfig) {
        this.model = model;
        this.modelConfig = modelConfig;
        
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            throw new Error("OPENROUTER_API_KEY environment variable is required");
        }

        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: apiKey,
            defaultHeaders: {
                "HTTP-Referer": process.env.YOUR_SITE_URL || "https://agentforce.zone",
                "X-Title": process.env.YOUR_SITE_NAME || "AgentForce ADK",
            },
        });
    }

    /**
     * Convert AgentForce Tool format to OpenAI ChatCompletionTool format
     * @param tools - Array of AgentForce tool definitions
     * @returns Array of OpenAI-compatible tool definitions
     */
    private convertToolsToOpenAIFormat(tools: Tool[]): ChatCompletionTool[] {
        return tools.map(tool => ({
            type: "function",
            function: {
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters,
            },
        }));
    }

    /**
     * Get the options for OpenRouter API calls
     * Merges default options with user-provided ModelConfig
     */
    private getOpenRouterOptions(): { temperature?: number; max_tokens?: number } {
        const options: { temperature?: number; max_tokens?: number } = {};

        if (!this.modelConfig) {
            return options;
        }

        if (this.modelConfig.temperature !== undefined) {
            options.temperature = this.modelConfig.temperature;
        }
        if (this.modelConfig.maxTokens !== undefined) {
            options.max_tokens = this.modelConfig.maxTokens;
        }
        
        return options;
    }

    /**
     * Apply request delay if configured
     * Helps prevent rate limiting by spacing out API calls
     */
    private async applyRequestDelay(logger?: AgentForceLogger): Promise<void> {
        if (this.modelConfig?.requestDelay && this.modelConfig.requestDelay > 0) {
            const delayMs = this.modelConfig.requestDelay * 1000; // Convert seconds to milliseconds
            
            if (logger) {
                logger.debug("Applying request delay", { 
                    delaySeconds: this.modelConfig.requestDelay,
                    delayMs,
                    provider: "openrouter",
                    model: this.model, 
                });
            }
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    /**
     * Sanitize tool results for LLM context by removing large binary data
     * This prevents context overflow while preserving useful metadata
     * Auto-saves screenshots and provides file paths
     */
    private sanitizeToolResultForContext(result: any): any {
        if (typeof result !== "object" || result === null) {
            return result;
        }

        const sanitized = { ...result };

        // Helper function to detect base64 image data
        const isBase64Image = (str: string): boolean => {
            if (typeof str !== "string" || str.length < 100) return false;
            // Check for base64 image patterns
            return /^[A-Za-z0-9+/]{100,}={0,2}$/.test(str) || 
                   /^data:image\/[^;]+;base64,/.test(str);
        };

        // Helper function to save binary data to file
        const saveBinaryToFile = (data: string, prefix: string = "binary"): string => {
            try {
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const urlPart = sanitized.url ? 
                    sanitized.url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20) : 
                    "unknown";
                
                // Determine file extension from data
                let extension = "bin";
                if (data.startsWith("data:image/png") || isBase64Image(data)) {
                    extension = "png";
                } else if (data.startsWith("data:image/jpeg") || data.startsWith("data:image/jpg")) {
                    extension = "jpg";
                } else if (data.startsWith("data:image/gif")) {
                    extension = "gif";
                }
                
                const filename = `${prefix}_${urlPart}_${timestamp}.${extension}`;
                const absolutePath = resolve(process.cwd(), filename);
                const dirPath = dirname(absolutePath);
                mkdirSync(dirPath, { recursive: true });
                
                // Clean base64 data (remove data URL prefix if present)
                let cleanData = data;
                if (data.startsWith("data:")) {
                    cleanData = data.split(",")[1] || data;
                }
                
                const originalLength = cleanData.length;
                writeFileSync(absolutePath, cleanData, "base64");
                
                return `[BINARY_SAVED_TO: ${filename}, SIZE: ${Math.round(originalLength * 0.75)} bytes]`;
            } catch (error: any) {
                return `[BINARY_SAVE_FAILED: ${error.message}]`;
            }
        };

        // Auto-save screenshot data and replace with file path info
        if (sanitized.screenshot && typeof sanitized.screenshot === "string") {
            if (isBase64Image(sanitized.screenshot)) {
                sanitized.screenshot = saveBinaryToFile(sanitized.screenshot, "screenshot");
                sanitized.screenshotSaved = true;
            }
        }

        // Handle other common binary data fields
        const binaryFields = ["image", "photo", "picture", "screenshotData", "imageData"];
        for (const field of binaryFields) {
            if (sanitized[field] && typeof sanitized[field] === "string" && isBase64Image(sanitized[field])) {
                sanitized[field] = saveBinaryToFile(sanitized[field], field);
                sanitized[`${field}Saved`] = true;
            }
        }

        // Recursively check nested objects for binary data
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === "object" && value !== null) {
                sanitized[key] = this.sanitizeToolResultForContext(value);
            }
        }

        // Truncate other potentially large text data
        if (sanitized.html && typeof sanitized.html === "string" && sanitized.html.length > 10000) {
            sanitized.html = sanitized.html.substring(0, 2000) + "...[truncated]";
        }

        if (sanitized.content && typeof sanitized.content === "string" && sanitized.content.length > 10000) {
            sanitized.content = sanitized.content.substring(0, 3000) + "...[truncated]";
        }

        // Handle very large strings that might be binary data
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === "string" && value.length > 5000) {
                if (isBase64Image(value)) {
                    sanitized[key] = saveBinaryToFile(value, key);
                    sanitized[`${key}Saved`] = true;
                } else if (value.length > 15000) {
                    // Truncate very large non-binary strings
                    sanitized[key] = value.substring(0, 3000) + "...[truncated]";
                }
            }
        }

        return sanitized;
    }

    /**
     * Generate response with tool support using the OpenRouter model
     * @param prompt - The user prompt to send to the model
     * @param tools - Array of tool definitions
     * @param system - Optional system prompt
     * @param logger - Optional logger for debugging
     * @param agent - Optional agent instance for MCP tool execution
     * @returns Promise with the model's response after tool execution
     */
    async generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger, agent?: any): Promise<string> {
        try {
            if (logger) {
                logger.debug("Initial OpenRouter LLM call with tools", {
                    model: this.model,
                    toolsAvailable: tools.map(t => t.function.name),
                    prompt: prompt.substring(0, 100) + "...",
                });
            }

            // Prepare conversation messages
            const messages: ChatCompletionMessageParam[] = [
                ...(system ? [{ role: "system" as const, content: system }] : []),
                { role: "user" as const, content: prompt },
            ];

            const maxRounds = this.modelConfig?.maxToolRounds ?? 20; // configurable via ModelConfig, default 10
            let lastToolResults: string[] = [];
            
            // Convert tools to OpenAI format
            const openAITools = this.convertToolsToOpenAIFormat(tools);

            for (let round = 0; round < maxRounds; round++) {
                // Apply delay before each API call to prevent rate limiting
                if (round > 0) { // Skip delay on first call
                    await this.applyRequestDelay(logger);
                }

                const completion = await this.client.chat.completions.create({
                    model: this.model,
                    messages,
                    tools: openAITools,
                    tool_choice: "auto", // Let model decide when to use tools
                    ...this.getOpenRouterOptions(),
                });

                const response = completion.choices[0]?.message;
                if (!response) {
                    if (logger) {
                        logger.error("No response from OpenRouter API");
                    }
                    return "Error: No response from OpenRouter API";
                }

                // Debug: log the response structure
                if (logger) {
                    logger.debug("OpenRouter response structure", {
                        hasToolCalls: !!response.tool_calls,
                        toolCallsLength: response.tool_calls?.length || 0,
                        messageContent: response.content?.substring(0, 200),
                        finishReason: completion.choices[0]?.finish_reason,
                    });
                }

                // Handle error finish reasons - OpenRouter may return custom finish reasons
                const finishReason = completion.choices[0]?.finish_reason;
                // Check for unexpected finish reasons that might indicate an error
                if (finishReason && !['stop', 'length', 'tool_calls', 'content_filter', 'function_call'].includes(finishReason)) {
                    const errorMsg = `OpenRouter API returned unexpected finish reason: ${finishReason}. Content: ${response.content || "No content"}`;
                    if (logger) {
                        logger.error(errorMsg, {
                            model: this.model,
                            finishReason,
                            fullResponse: completion,
                        });
                    }
                    return `Error: ${errorMsg}`;
                }

                // Check if model wants to use tools
                if (response.tool_calls && response.tool_calls.length > 0) {
                    if (logger) {
                        logger.debug("Model requested tool calls", {
                            toolCalls: response.tool_calls.map(tc => ({ 
                                id: tc.id,
                                tool: (tc as any).function?.name || 'unknown', 
                                args: truncate((tc as any).function?.arguments || '{}', 200), 
                            })),
                        });
                    }

                    const toolResults: string[] = [];

                    // Execute each tool call
                    for (const toolCall of response.tool_calls) {
                        if (logger) {
                            logger.debug("Executing tool", { 
                                toolId: toolCall.id,
                                tool: (toolCall as any).function?.name || 'unknown', 
                                args: truncate((toolCall as any).function?.arguments || '{}', 200), 
                            });
                        }

                        try {
                            // Parse arguments if they're a string
                            let args = (toolCall as any).function?.arguments || '{}';
                            if (typeof args === "string") {
                                args = JSON.parse(args);
                            }

                            const result = await executeTool(
                                (toolCall as any).function?.name || 'unknown',
                                args as unknown as Record<string, any>,
                                agent,
                                logger,
                            );
                            
                            if (logger) {
                                logger.debug("Tool executed successfully", { 
                                    toolId: toolCall.id,
                                    tool: (toolCall as any).function?.name || 'unknown',
                                    result: truncate(JSON.stringify(result), 200)
                                });
                            }

                            toolResults.push(
                                `Tool ${(toolCall as any).function?.name || 'unknown'} (${toolCall.id}) args: ${JSON.stringify(args)}
Result: ${JSON.stringify(result, null, 2)}`,
                            );

                            // Add tool result message for OpenRouter (exclude large data like screenshots)
                            const contextResult = this.sanitizeToolResultForContext(result);
                            messages.push({
                                role: "tool" as const,
                                tool_call_id: toolCall.id,
                                content: JSON.stringify(contextResult),
                            });

                        } catch (error: any) {
                            if (logger) {
                                logger.error("Tool execution failed", { 
                                    toolId: toolCall.id,
                                    tool: (toolCall as any).function?.name || 'unknown', 
                                    args: (toolCall as any).function?.arguments || '{}', 
                                    error: error.message, 
                                });
                            }

                            toolResults.push(
                                `Tool ${(toolCall as any).function?.name || 'unknown'} (${toolCall.id}) args: ${(toolCall as any).function?.arguments || '{}'}
Error: ${error.message}`,
                            );

                            // Add error as tool result
                            messages.push({
                                role: "tool" as const,
                                tool_call_id: toolCall.id,
                                content: `Error: ${error.message}`,
                            });
                        }
                    }

                    lastToolResults = toolResults;

                    if (logger) {
                        logger.debug("Sending tool results back to LLM for follow-up", { round: round + 1 });
                    }

                    // Add assistant message with tool calls to conversation history
                    messages.push(response);

                    // Continue to next round to let the model produce final content or request more tools
                    continue;
                }

                // No tool calls -> final answer
                if (logger) {
                    logger.debug("Final response generated after tool execution", {
                        round: round + 1,
                        contentPreview: response.content?.substring(0, 200),
                        finishReason: completion.choices[0]?.finish_reason,
                    });
                }

                const finalContent = response.content || "";
                if (this.modelConfig?.appendToolResults && lastToolResults.length > 0) {
                    return `${finalContent}

---
Raw tool results:
${lastToolResults.join("\n\n")}`;
                }
                return finalContent;
            }

            // Safety fallback if max rounds reached
            if (logger) {
                logger.debug("Max tool rounds reached, returning basic response");
            }
            
            // Remove tool-related messages and try basic generation
            const basicMessages = messages.filter(m => m.role !== "tool");
            await this.applyRequestDelay(logger); // Apply delay before fallback call
            const fallbackCompletion = await this.client.chat.completions.create({
                model: this.model,
                messages: basicMessages,
                ...this.getOpenRouterOptions(),
            });

            return fallbackCompletion.choices[0]?.message?.content || "";
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (logger) {
                logger.error(`OpenRouter provider error: ${errorMessage}`);
            }
            return `Error: OpenRouter provider error - ${errorMessage}`;
        }
    }

    /**
     * Chat with tool support
     * @param messages - Array of messages for the conversation
     * @param tools - Array of tool definitions
     * @param logger - Optional logger for debugging
     * @param agent - Optional agent instance for MCP tool execution
     * @returns Promise with the model's response after tool execution
     */
    async chatWithTools(
        messages: Array<{ role: string; content: string }>,
        tools: Tool[],
        logger?: AgentForceLogger,
        agent?: any,
    ): Promise<string> {
        try {
            if (logger) {
                logger.debug("Initial OpenRouter chat call with tools", {
                    model: this.model,
                    toolsAvailable: tools.map(t => t.function.name),
                    messageCount: messages.length,
                });
            }

            // Convert messages to OpenAI format
            const convo: ChatCompletionMessageParam[] = messages.map(msg => {
                const baseMsg = {
                    role: msg.role as "system" | "user" | "assistant" | "tool",
                    content: msg.content,
                };
                
                // Tool messages need tool_call_id, but we don't have it from input messages
                // So we filter out any tool messages from the initial conversion
                if (msg.role === "tool") {
                    // Skip tool messages in initial conversion - they'll be added during tool execution
                    return null;
                }
                
                return baseMsg;
            }).filter(msg => msg !== null) as ChatCompletionMessageParam[];

            const maxRounds = this.modelConfig?.maxToolRounds ?? 20;
            let lastToolResults: string[] = [];
            
            // Convert tools to OpenAI format
            const openAITools = this.convertToolsToOpenAIFormat(tools);

            for (let round = 0; round < maxRounds; round++) {
                // Apply delay before each API call to prevent rate limiting
                if (round > 0) { // Skip delay on first call
                    await this.applyRequestDelay(logger);
                }

                const completion = await this.client.chat.completions.create({
                    model: this.model,
                    messages: convo,
                    tools: openAITools,
                    tool_choice: "auto",
                    ...this.getOpenRouterOptions(),
                });

                const response = completion.choices[0]?.message;
                if (!response) {
                    if (logger) {
                        logger.error("No response from OpenRouter API");
                    }
                    return "Error: No response from OpenRouter API";
                }

                // Check if model wants to use tools
                if (response.tool_calls && response.tool_calls.length > 0) {
                    if (logger) {
                        logger.debug("Model requested tool calls", {
                            toolCalls: response.tool_calls.map(tc => ({ 
                                id: tc.id,
                                tool: (tc as any).function?.name || 'unknown', 
                                args: truncate((tc as any).function?.arguments || '{}', 200), 
                            })),
                        });
                    }

                    const toolResults: string[] = [];

                    // Add assistant message with tool calls first
                    convo.push(response);

                    // Execute each tool call
                    for (const toolCall of response.tool_calls) {
                        if (logger) {
                            logger.debug("Executing tool", { 
                                toolId: toolCall.id,
                                tool: (toolCall as any).function?.name || 'unknown', 
                                args: truncate((toolCall as any).function?.arguments || '{}', 200), 
                            });
                        }

                        try {
                            // Parse arguments if they're a string
                            let args = (toolCall as any).function?.arguments || '{}';
                            if (typeof args === "string") {
                                args = JSON.parse(args);
                            }

                            const result = await executeTool(
                                (toolCall as any).function?.name || 'unknown',
                                args as unknown as Record<string, any>,
                                agent,
                                logger,
                            );
                            
                            if (logger) {
                                logger.debug("Tool executed successfully", { 
                                    toolId: toolCall.id,
                                    tool: (toolCall as any).function?.name || 'unknown',
                                    result: truncate(JSON.stringify(result), 200)
                                });
                            }

                            toolResults.push(
                                `Tool ${(toolCall as any).function?.name || 'unknown'} (${toolCall.id}) args: ${JSON.stringify(args)}
Result: ${JSON.stringify(result, null, 2)}`,
                            );

                            // Add tool result message to conversation (exclude large data like screenshots)
                            const contextResult = this.sanitizeToolResultForContext(result);
                            convo.push({
                                role: "tool" as const,
                                tool_call_id: toolCall.id,
                                content: JSON.stringify(contextResult),
                            });

                        } catch (error: any) {
                            if (logger) {
                                logger.error("Tool execution failed", { 
                                    toolId: toolCall.id,
                                    tool: (toolCall as any).function?.name || 'unknown', 
                                    args: (toolCall as any).function?.arguments || '{}', 
                                    error: error.message, 
                                });
                            }

                            toolResults.push(
                                `Tool ${(toolCall as any).function?.name || 'unknown'} (${toolCall.id}) args: ${(toolCall as any).function?.arguments || '{}'}
Error: ${error.message}`,
                            );

                            // Add error as tool result
                            convo.push({
                                role: "tool" as const,
                                tool_call_id: toolCall.id,
                                content: `Error: ${error.message}`,
                            });
                        }
                    }

                    lastToolResults = toolResults;

                    // Continue to next round
                    continue;
                }

                // No tool calls -> final answer
                if (logger) {
                    logger.debug("Final response generated after tool execution", {
                        round: round + 1,
                        contentPreview: response.content?.substring(0, 200),
                        finishReason: completion.choices[0]?.finish_reason,
                    });
                }

                const finalContent = response.content || "";
                if (this.modelConfig?.appendToolResults && lastToolResults.length > 0) {
                    return `${finalContent}

---
Raw tool results:
${lastToolResults.join("\n\n")}`;
                }
                return finalContent;
            }

            if (logger) {
                logger.debug("Max tool rounds reached, returning last attempt content");
            }
            
            // Remove tool messages and try basic chat
            const basicMessages = convo.filter(m => m.role !== "tool");
            await this.applyRequestDelay(logger); // Apply delay before final attempt
            const lastAttempt = await this.client.chat.completions.create({ 
                model: this.model, 
                messages: basicMessages, 
                ...this.getOpenRouterOptions(), 
            });
            
            return lastAttempt.choices[0]?.message?.content || "";
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (logger) {
                logger.error(`OpenRouter provider error: ${errorMessage}`);
            }
            return `Error: OpenRouter provider error - ${errorMessage}`;
        }
    }
}