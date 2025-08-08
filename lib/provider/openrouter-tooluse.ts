import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { Tool } from "../tools/types";
import { executeTool } from "../agent/functions/tools";
import type { AgentForceLogger, ModelConfig } from "../types";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";

// Type for OpenRouter tool use interface
export interface OpenRouterToolUseInterface {
    generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger): Promise<string>;
    chatWithTools(messages: Array<{ role: string; content: string }>, tools: Tool[], logger?: AgentForceLogger): Promise<string>;
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

        // Auto-save screenshot data and replace with file path info
        if (sanitized.screenshot && typeof sanitized.screenshot === "string") {
            try {
                // Generate a temporary filename
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const urlPart = sanitized.url ? 
                    sanitized.url.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30) : 
                    "webpage";
                const filename = `screenshot_${urlPart}_${timestamp}.png`;
                
                // Ensure directory exists
                const absolutePath = resolve(process.cwd(), filename);
                const dirPath = dirname(absolutePath);
                mkdirSync(dirPath, { recursive: true });
                
                // Save original length before overwriting
                const originalLength = sanitized.screenshot.length;
                
                // Write base64 data to file
                writeFileSync(absolutePath, sanitized.screenshot, "base64");
                
                // Replace screenshot data with file path info
                sanitized.screenshot = `[SCREENSHOT_SAVED_TO: ${filename}]`;
                sanitized.screenshotSaved = true;
                sanitized.screenshotPath = filename;
                sanitized.screenshotSize = `${Math.round(originalLength * 0.75)} bytes`;
                
            } catch (error: any) {
                sanitized.screenshot = `[SCREENSHOT_SAVE_FAILED: ${error.message}]`;
            }
        }

        // Remove other potentially large binary data
        if (sanitized.html && typeof sanitized.html === "string" && sanitized.html.length > 10000) {
            sanitized.html = sanitized.html.substring(0, 2000) + "...[truncated]";
        }

        if (sanitized.content && typeof sanitized.content === "string" && sanitized.content.length > 5000) {
            sanitized.content = sanitized.content.substring(0, 2000) + "...[truncated]";
        }

        return sanitized;
    }

    /**
     * Generate response with tool support using the OpenRouter model
     * @param prompt - The user prompt to send to the model
     * @param tools - Array of tool definitions
     * @param system - Optional system prompt
     * @param logger - Optional logger for debugging
     * @returns Promise with the model's response after tool execution
     */
    async generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger): Promise<string> {
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
                    throw new Error("No response from OpenRouter API");
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

                // Check if model wants to use tools
                if (response.tool_calls && response.tool_calls.length > 0) {
                    if (logger) {
                        logger.debug("Model requested tool calls", {
                            toolCalls: response.tool_calls.map(tc => ({ 
                                id: tc.id,
                                tool: tc.function.name, 
                                args: tc.function.arguments, 
                            })),
                        });
                    }

                    const toolResults: string[] = [];

                    // Execute each tool call
                    for (const toolCall of response.tool_calls) {
                        if (logger) {
                            logger.debug("Executing tool", { 
                                toolId: toolCall.id,
                                tool: toolCall.function.name, 
                                args: toolCall.function.arguments, 
                            });
                        }

                        try {
                            // Parse arguments if they're a string
                            let args = toolCall.function.arguments;
                            if (typeof args === "string") {
                                args = JSON.parse(args);
                            }

                            const result = await executeTool(
                                toolCall.function.name,
                                args as unknown as Record<string, any>,
                            );
                            
                            if (logger) {
                                logger.debug("Tool executed successfully", { 
                                    toolId: toolCall.id,
                                    tool: toolCall.function.name, 
                                });
                            }

                            toolResults.push(
                                `Tool ${toolCall.function.name} (${toolCall.id}) args: ${JSON.stringify(args)}
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
                                    tool: toolCall.function.name, 
                                    args: toolCall.function.arguments, 
                                    error: error.message, 
                                });
                            }

                            toolResults.push(
                                `Tool ${toolCall.function.name} (${toolCall.id}) args: ${toolCall.function.arguments}
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
            throw new Error(`OpenRouter provider error: ${error}`);
        }
    }

    /**
     * Chat with tool support
     * @param messages - Array of messages for the conversation
     * @param tools - Array of tool definitions
     * @param logger - Optional logger for debugging
     * @returns Promise with the model's response after tool execution
     */
    async chatWithTools(
        messages: Array<{ role: string; content: string }>,
        tools: Tool[],
        logger?: AgentForceLogger,
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
                    throw new Error("No response from OpenRouter API");
                }

                // Check if model wants to use tools
                if (response.tool_calls && response.tool_calls.length > 0) {
                    if (logger) {
                        logger.debug("Model requested tool calls", {
                            toolCalls: response.tool_calls.map(tc => ({ 
                                id: tc.id,
                                tool: tc.function.name, 
                                args: tc.function.arguments, 
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
                                tool: toolCall.function.name, 
                                args: toolCall.function.arguments, 
                            });
                        }

                        try {
                            // Parse arguments if they're a string
                            let args = toolCall.function.arguments;
                            if (typeof args === "string") {
                                args = JSON.parse(args);
                            }

                            const result = await executeTool(
                                toolCall.function.name,
                                args as unknown as Record<string, any>,
                            );
                            
                            if (logger) {
                                logger.debug("Tool executed successfully", { 
                                    toolId: toolCall.id,
                                    tool: toolCall.function.name, 
                                });
                            }

                            toolResults.push(
                                `Tool ${toolCall.function.name} (${toolCall.id}) args: ${JSON.stringify(args)}
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
                                    tool: toolCall.function.name, 
                                    args: toolCall.function.arguments, 
                                    error: error.message, 
                                });
                            }

                            toolResults.push(
                                `Tool ${toolCall.function.name} (${toolCall.id}) args: ${toolCall.function.arguments}
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
            throw new Error(`OpenRouter provider error: ${error}`);
        }
    }
}