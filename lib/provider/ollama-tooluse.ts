import ollama from "ollama";
import type { Tool } from "../tools/types";
import { executeTool } from "../agent/functions/tools";
import type { AgentForceLogger, ModelConfig } from "../types";

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
    private getOllamaOptions(): { keep_alive: string; temperature?: number; "num_ctx"?: number } {
        const defaultOptions = {
            keep_alive: "60s", // Maintain backward compatibility
        };

        if (!this.modelConfig) {
            return defaultOptions;
        }

        return {
            ...defaultOptions,
            ...(this.modelConfig.temperature !== undefined && { temperature: this.modelConfig.temperature }),
            ...(this.modelConfig.maxTokens !== undefined && { "num_ctx": this.modelConfig.maxTokens }),
        };
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

            const maxRounds = this.modelConfig?.maxToolRounds ?? 10; // configurable via ModelConfig, default 10
            let lastToolResults: string[] = [];
            for (let round = 0; round < maxRounds; round++) {
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
                    const content = response.message.content.trim();
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
                            toolCalls: toolCalls.map(tc => ({ tool: tc.function.name, args: tc.function.arguments })),
                        });
                    }

                    const toolResults: string[] = [];

                    // Execute each tool call
                    for (const toolCall of toolCalls) {
                        if (logger) {
                            logger.debug("Executing tool", { tool: toolCall.function.name, args: toolCall.function.arguments });
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
            const response = await ollama.generate({
                model: this.model,
                prompt: prompt,
                system: system,
                options: this.getOllamaOptions(),
            });
            return response.response;
        } catch (error) {
            throw new Error(`Ollama provider error: ${error}`);
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
            const maxRounds = this.modelConfig?.maxToolRounds ?? 10; // configurable via ModelConfig, default 10
            let lastToolResults: string[] = [];
            for (let round = 0; round < maxRounds; round++) {
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
                    const content = response.message.content.trim();
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
                            toolCalls: toolCalls.map(tc => ({ tool: tc.function.name, args: tc.function.arguments })),
                        });
                    }

                    const toolResults: string[] = [];
                    // Execute each tool call
                    for (const toolCall of toolCalls) {
                        if (logger) {
                            logger.debug("Executing tool", { tool: toolCall.function.name, args: toolCall.function.arguments });
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
            const lastAttempt = await ollama.chat({ model: this.model, messages: convo, options: this.getOllamaOptions() });
            return lastAttempt.message.content;
        } catch (error) {
            throw new Error(`Ollama provider error: ${error}`);
        }
    }
}
