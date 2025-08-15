import ollama from "ollama";
import type { Tool } from "../types";
import { executeTool } from "../agent/functions/tools";
import type { AgentForceLogger, ModelConfig } from "../types";
import { truncate } from "../utils/truncate";

// Type for Ollama tool use interface
export interface OllamaToolUseInterface {
    generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger): Promise<string>;
    chatWithTools(messages: Array<{ role: string; content: string }>, tools: Tool[], logger?: AgentForceLogger): Promise<string>;
}

// Re-export types for convenience
export type { Tool, AgentForceLogger, ModelConfig };

/**
 * Ollama tool use functionality for the AgentForce SDK
 * Handles tool execution with locally running Ollama models
 */
export class OllamaToolUse implements OllamaToolUseInterface {
    private model: string;
    private modelConfig?: ModelConfig;

    constructor(model: string, modelConfig?: ModelConfig) {
        this.model = model;
        this.modelConfig = modelConfig;
    }

    /**
     * Get the combined options for Ollama API calls
     * Merges default options with user-provided ModelConfig
     */
    private getOllamaOptions(): { temperature?: number; "num_ctx"?: number } {
        const options: { temperature?: number; "num_ctx"?: number } = {};

        if (!this.modelConfig) {
            return options;
        }

        if (this.modelConfig.temperature !== undefined) {
            options.temperature = this.modelConfig.temperature;
        }
        if (this.modelConfig.maxTokens !== undefined) {
            options["num_ctx"] = this.modelConfig.maxTokens;
        }
        
        return options;
    }

    /**
     * Apply request delay if configured
     * Helps prevent rate limiting by spacing out API calls
     */
    private async applyRequestDelay(): Promise<void> {
        if (this.modelConfig?.requestDelay && this.modelConfig.requestDelay > 0) {
            const delayMs = this.modelConfig.requestDelay * 1000; // Convert seconds to milliseconds
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    /**
     * Generate response with tool support using the Ollama model
     * @param prompt - The user prompt to send to the model
     * @param tools - Array of tool definitions
     * @param system - Optional system prompt
     * @param logger - Optional logger for debugging
     * @returns Promise with the model's response after tool execution
     */
    async generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger): Promise<string> {
        try {
            if (logger) {
                logger.debug("Initial LLM call with tools", {
                    model: this.model,
                    toolsAvailable: tools.map(t => t.function.name),
                    prompt: prompt.substring(0, 100) + "...",
                });
            }

            // Prepare conversation messages
            const messages: Array<{ role: string; content: string }> = [
                ...(system ? [{ role: "system", content: system }] : []),
                { role: "user", content: prompt },
            ];

            const maxRounds = this.modelConfig?.maxToolRounds ?? 20; // configurable via ModelConfig, default 10
            let lastToolResults: string[] = [];
            for (let round = 0; round < maxRounds; round++) {
                // Apply delay before each API call to prevent rate limiting
                if (round > 0) { // Skip delay on first call
                    await this.applyRequestDelay();
                }

                const response = await ollama.chat({
                    model: this.model,
                    messages,
                    tools,
                    options: this.getOllamaOptions(),
                });

                // Debug: log the full response structure
                if (logger) {
                    logger.debug("Ollama response structure", {
                        hasToolCalls: !!response.message.tool_calls,
                        toolCallsLength: response.message.tool_calls?.length || 0,
                        messageContent: response.message.content?.substring(0, 200),
                        messageKeys: Object.keys(response.message),
                    });
                }

                // Determine tool calls from response
                let toolCalls = response.message.tool_calls as Array<{ function: { name: string; arguments: any } }>|undefined;

                // If no tool_calls but content looks like a tool call JSON, try to parse it
                if (!toolCalls && response.message.content) {
                    let content = response.message.content.trim();
                    
                    // Remove markdown code blocks if present
                    if (content.startsWith("```json") && content.endsWith("```")) {
                        content = content.slice(7, -3).trim();
                    } else if (content.startsWith("```") && content.endsWith("```")) {
                        content = content.slice(3, -3).trim();
                    } else if (content.startsWith("```json")) {
                        // Handle incomplete code blocks
                        const lines = content.split("\n");
                        const jsonStartIndex = lines.findIndex(line => line.trim() === "```json");
                        const jsonEndIndex = lines.findIndex((line, idx) => idx > jsonStartIndex && line.trim() === "```");
                        if (jsonStartIndex !== -1) {
                            const endIndex = jsonEndIndex !== -1 ? jsonEndIndex : lines.length;
                            const jsonLines = lines.slice(jsonStartIndex + 1, endIndex);
                            content = jsonLines.join("\n").trim();
                        }
                    } else if (content.startsWith("```")) {
                        // Handle other incomplete code blocks  
                        const lines = content.split("\n");
                        if (lines.length > 1) {
                            content = lines.slice(1).join("\n").replace(/```$/, "").trim();
                        }
                    }
                    
                    if (content.startsWith("{") && content.includes("\"name\"") && content.includes("\"arguments\"")) {
                        try {
                            const parsed = JSON.parse(content);
                            if (parsed.name && parsed.arguments) {
                                toolCalls = [{ function: { name: parsed.name, arguments: parsed.arguments } }];
                                if (logger) {
                                    logger.debug("Parsed tool call from content", { toolName: parsed.name, args: parsed.arguments });
                                }
                            }
                        } catch {
                            // Not valid JSON, ignore
                        }
                    }
                }

                if (toolCalls && toolCalls.length > 0) {
                    if (logger) {
                        logger.debug("Model requested tool calls", {
                            toolCalls: toolCalls.map(tc => ({ tool: tc.function.name, args: truncate(JSON.stringify(tc.function.arguments), 200) })),
                        });
                    }

                    const toolResults: string[] = [];

                    // Execute each tool call
                    for (const toolCall of toolCalls) {
                        if (logger) {
                            logger.debug("Executing tool", { tool: toolCall.function.name, args: truncate(JSON.stringify(toolCall.function.arguments), 200) });
                        }
                        try {
                            const result = await executeTool(
                                toolCall.function.name,
                                toolCall.function.arguments,
                            );
                            if (logger) {
                                logger.debug("Tool executed successfully", { tool: toolCall.function.name, args: toolCall.function.arguments });
                            }
                            // Include args in the tool result content returned to the LLM
                            toolResults.push(
                                `Tool ${toolCall.function.name} args: ${JSON.stringify(toolCall.function.arguments)}\nResult: ${JSON.stringify(result, null, 2)}`,
                            );
                        } catch (error: any) {
                            if (logger) {
                                logger.error("Tool execution failed", { tool: toolCall.function.name, args: toolCall.function.arguments, error: error.message });
                            }
                            toolResults.push(
                                `Tool ${toolCall.function.name} args: ${JSON.stringify(toolCall.function.arguments)}\nError: ${error.message}`,
                            );
                        }
                    }

                    lastToolResults = toolResults; // keep latest for optional appending

                    if (logger) {
                        logger.debug("Sending tool results back to LLM for follow-up", { round: round + 1 });
                    }

                    // Append assistant tool-call message and tool results, then continue
                    messages.push(response.message);
                    messages.push({ role: "tool", content: toolResults.join("\n\n") });

                    // Continue to next round to let the model produce final content or request more tools
                    continue;
                }

                // No tool calls -> final answer
                if (logger) {
                    logger.debug("Final response generated after tool execution", {
                        round: round + 1,
                        contentPreview: response.message.content?.substring(0, 200),
                    });
                }
                const finalContent = response.message.content;
                if (this.modelConfig?.appendToolResults && lastToolResults.length > 0) {
                    return `${finalContent}\n\n---\nRaw tool results:\n${lastToolResults.join("\n\n")}`;
                }
                return finalContent;
            }

            // Safety fallback if max rounds reached
            if (logger) {
                logger.debug("Max tool rounds reached, returning last message content");
            }
            // Fallback to basic generate without tools
            await this.applyRequestDelay(); // Apply delay before fallback call
            const response = await ollama.generate({
                model: this.model,
                prompt: prompt,
                system: system,
                options: this.getOllamaOptions(),
            });
            return response.response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (logger) {
                logger.error(`Ollama provider error: ${errorMessage}`);
            }
            return `Error: Ollama provider error - ${errorMessage}`;
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
                logger.debug("Initial chat call with tools", {
                    model: this.model,
                    toolsAvailable: tools.map(t => t.function.name),
                    messageCount: messages.length,
                });
            }

            const convo: Array<{ role: string; content: string }> = [...messages];
            const maxRounds = this.modelConfig?.maxToolRounds ?? 20; // configurable via ModelConfig, default 10
            let lastToolResults: string[] = [];
            for (let round = 0; round < maxRounds; round++) {
                // Apply delay before each API call to prevent rate limiting
                if (round > 0) { // Skip delay on first call
                    await this.applyRequestDelay();
                }

                const response = await ollama.chat({
                    model: this.model,
                    messages: convo,
                    tools,
                    options: this.getOllamaOptions(),
                });

                // Determine tool calls from response
                let toolCalls = response.message.tool_calls as Array<{ function: { name: string; arguments: any } }>|undefined;

                // If no tool_calls but content looks like a tool call JSON, try to parse it
                if (!toolCalls && response.message.content) {
                    let content = response.message.content.trim();
                    
                    // Remove markdown code blocks if present
                    if (content.startsWith("```json") && content.endsWith("```")) {
                        content = content.slice(7, -3).trim();
                    } else if (content.startsWith("```") && content.endsWith("```")) {
                        content = content.slice(3, -3).trim();
                    } else if (content.startsWith("```json")) {
                        // Handle incomplete code blocks
                        const lines = content.split("\n");
                        const jsonStartIndex = lines.findIndex(line => line.trim() === "```json");
                        const jsonEndIndex = lines.findIndex((line, idx) => idx > jsonStartIndex && line.trim() === "```");
                        if (jsonStartIndex !== -1) {
                            const endIndex = jsonEndIndex !== -1 ? jsonEndIndex : lines.length;
                            const jsonLines = lines.slice(jsonStartIndex + 1, endIndex);
                            content = jsonLines.join("\n").trim();
                        }
                    } else if (content.startsWith("```")) {
                        // Handle other incomplete code blocks  
                        const lines = content.split("\n");
                        if (lines.length > 1) {
                            content = lines.slice(1).join("\n").replace(/```$/, "").trim();
                        }
                    }
                    
                    if (content.startsWith("{") && content.includes("\"name\"") && content.includes("\"arguments\"")) {
                        try {
                            const parsed = JSON.parse(content);
                            if (parsed.name && parsed.arguments) {
                                toolCalls = [{ function: { name: parsed.name, arguments: parsed.arguments } }];
                                if (logger) {
                                    logger.debug("Parsed tool call from content", { toolName: parsed.name, args: parsed.arguments });
                                }
                            }
                        } catch {
                            // Not valid JSON, ignore
                        }
                    }
                }

                if (toolCalls && toolCalls.length > 0) {
                    if (logger) {
                        logger.debug("Model requested tool calls", {
                            toolCalls: toolCalls.map(tc => ({ tool: tc.function.name, args: truncate(JSON.stringify(tc.function.arguments), 200) })),
                        });
                    }

                    const toolResults: string[] = [];
                    // Execute each tool call
                    for (const toolCall of toolCalls) {
                        if (logger) {
                            logger.debug("Executing tool", { tool: toolCall.function.name, args: truncate(JSON.stringify(toolCall.function.arguments), 200) });
                        }
                        try {
                            const result = await executeTool(
                                toolCall.function.name,
                                toolCall.function.arguments,
                            );
                            if (logger) {
                                logger.debug("Tool executed successfully", { tool: toolCall.function.name, args: toolCall.function.arguments });
                            }
                            toolResults.push(
                                `Tool ${toolCall.function.name} args: ${JSON.stringify(toolCall.function.arguments)}\nResult: ${JSON.stringify(result, null, 2)}`,
                            );
                        } catch (error: any) {
                            if (logger) {
                                logger.error("Tool execution failed", { tool: toolCall.function.name, args: toolCall.function.arguments, error: error.message });
                            }
                            toolResults.push(
                                `Tool ${toolCall.function.name} args: ${JSON.stringify(toolCall.function.arguments)}\nError: ${error.message}`,
                            );
                        }
                    }

                    lastToolResults = toolResults;

                    // Append assistant tool-call message and tool results, then continue
                    convo.push(response.message);
                    convo.push({ role: "tool", content: toolResults.join("\n\n") });

                    // Continue to next round
                    continue;
                }

                // No tool calls -> final answer
                if (logger) {
                    logger.debug("Final response generated after tool execution", {
                        round: round + 1,
                        contentPreview: response.message.content?.substring(0, 200),
                    });
                }
                const finalContent = response.message.content;
                if (this.modelConfig?.appendToolResults && lastToolResults.length > 0) {
                    return `${finalContent}\n\n---\nRaw tool results:\n${lastToolResults.join("\n\n")}`;
                }
                return finalContent;
            }

            if (logger) {
                logger.debug("Max tool rounds reached, returning last attempt content");
            }
            await this.applyRequestDelay(); // Apply delay before final attempt
            const lastAttempt = await ollama.chat({ model: this.model, messages: convo, options: this.getOllamaOptions() });
            return lastAttempt.message.content;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (logger) {
                logger.error(`Ollama provider error: ${errorMessage}`);
            }
            return `Error: Ollama provider error - ${errorMessage}`;
        }
    }
}
