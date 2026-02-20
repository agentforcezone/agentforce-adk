import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Tool } from "../types";
import { ZAiToolUse } from "./z-ai-tooluse";
import type { AgentForceLogger, ModelConfig } from "../types";

/**
 * Interface for Z.AI provider functionality
 * @interface ZAiProviderInterface
 * @property {function} generate - Generate response from prompt without tools
 * @property {function} generateWithTools - Generate response with tool support
 * @property {function} chatWithTools - Chat with tool support using message history
 * @property {function} chat - Chat without tool support using message history
 * @property {function} getModel - Get current model name
 * @property {function} setModel - Set model name
 */
export interface ZAiProviderInterface {
    generate(prompt: string, system?: string): Promise<string>;
    generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger, agent?: any): Promise<string>;
    chatWithTools(messages: Array<{ role: string; content: string }>, tools: Tool[], logger?: AgentForceLogger, agent?: any): Promise<string>;
    chat(messages: Array<{ role: string; content: string }>): Promise<string>;
    getModel(): string;
    setModel(model: string): void;
    cleanup(): void;
}

/**
 * Z.AI provider implementation for the AgentForce SDK
 * Handles communication with Z.AI's API using OpenAI-compatible interface
 *
 * Requires explicit endpoint selection using model name prefix:
 * - "coding/glm-4.7" -> Coding endpoint (https://api.z.ai/api/coding/paas/v4)
 * - "api/glm-4.7" -> General API endpoint (https://api.z.ai/api/paas/v4)
 *
 * @example
 * ```typescript
 * // Use coding endpoint (for GLM Coding Plan)
 * agent.useLLM("z-ai", "coding/glm-4.7")
 *
 * // Use general API endpoint
 * agent.useLLM("z-ai", "api/glm-4.7")
 * ```
 */
export class ZAiProvider implements ZAiProviderInterface {
    private model: string;
    private modelConfig?: ModelConfig;
    private client: OpenAI;
    private toolUse: ZAiToolUse;

    constructor(model: string, modelConfig?: ModelConfig) {
        this.model = model;
        this.modelConfig = modelConfig;

        const apiKey = process.env.ZAI_API_KEY;
        if (!apiKey) {
            throw new Error("ZAI_API_KEY environment variable is required");
        }

        // Determine the base URL based on model name prefix
        const baseURL = this.getBaseURL(model);

        this.client = new OpenAI({
            baseURL: baseURL,
            apiKey: apiKey,
        });

        this.toolUse = new ZAiToolUse(model, modelConfig);
    }

    /**
     * Determine the appropriate base URL based on model name prefix
     * @param model - Model name with required prefix (e.g., "coding/glm-4.7", "api/glm-4.7")
     * @returns The appropriate base URL for the model
     * @throws Error if model doesn't have a valid prefix
     * @private
     */
    private getBaseURL(model: string): string {
        if (model.startsWith("api/")) {
            // General API endpoint
            return "https://api.z.ai/api/paas/v4";
        } else if (model.startsWith("coding/")) {
            // Coding endpoint (for GLM Coding Plan)
            return "https://api.z.ai/api/coding/paas/v4";
        } else {
            // No prefix found - throw error
            throw new Error(
                'Z.AI model name must start with "api/" or "coding/" prefix. ' +
                'Example: "api/glm-4.7" for general API or "coding/glm-4.7" for coding endpoint. ' +
                `Received: "${model}"`
            );
        }
    }

    /**
     * Get the actual model name without the endpoint prefix
     * @returns The clean model name
     */
    private getCleanModelName(): string {
        if (this.model.startsWith("coding/")) {
            return this.model.substring(7); // Remove "coding/" prefix (7 chars)
        } else if (this.model.startsWith("api/")) {
            return this.model.substring(4); // Remove "api/" prefix (4 chars)
        }
        return this.model;
    }

    /**
     * Generate response using the Z.AI model
     * @param prompt - The user prompt to send to the model
     * @param system - Optional system prompt to override the model's default
     * @returns Promise with the model's response
     */
    async generate(prompt: string, system?: string): Promise<string> {
        try {
            const messages: ChatCompletionMessageParam[] = [];

            if (system) {
                messages.push({ role: "system", content: system });
            }

            messages.push({ role: "user", content: prompt });

            const completion = await this.client.chat.completions.create({
                model: this.getCleanModelName(),
                messages: messages,
                ...(this.modelConfig?.temperature !== undefined && { temperature: this.modelConfig.temperature }),
                ...(this.modelConfig?.maxTokens !== undefined && { max_tokens: this.modelConfig.maxTokens }),
            });

            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error: Z.AI provider error - ${errorMessage}`;
        }
    }

    /**
     * Chat with the Z.AI model
     * @param messages - Array of messages for the conversation
     * @returns Promise with the model's response
     */
    async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
        try {
            // Convert messages to OpenAI format
            const openAIMessages: ChatCompletionMessageParam[] = messages.map(msg => ({
                role: msg.role as "system" | "user" | "assistant",
                content: msg.content,
            }));

            const completion = await this.client.chat.completions.create({
                model: this.getCleanModelName(),
                messages: openAIMessages,
                ...(this.modelConfig?.temperature !== undefined && { temperature: this.modelConfig.temperature }),
                ...(this.modelConfig?.maxTokens !== undefined && { max_tokens: this.modelConfig.maxTokens }),
            });

            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error: Z.AI provider error - ${errorMessage}`;
        }
    }

    /**
     * Get the current model name
     */
    getModel(): string {
        return this.model;
    }

    /**
     * Set a new model
     */
    setModel(model: string): void {
        this.model = model;
        this.toolUse = new ZAiToolUse(model, this.modelConfig);
    }

    /**
     * Generate response with tool support using the Z.AI model
     * @param prompt - The user prompt to send to the model
     * @param tools - Array of tool definitions
     * @param system - Optional system prompt
     * @param logger - Optional logger for debugging
     * @param agent - Optional agent instance for MCP tool execution
     * @returns Promise with the model's response after tool execution
     */
    async generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger, agent?: any): Promise<string> {
        return this.toolUse.generateWithTools(prompt, tools, system, logger, agent);
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
        return this.toolUse.chatWithTools(messages, tools, logger, agent);
    }

    /**
     * Cleanup HTTP connections to allow process to exit cleanly
     */
    cleanup(): void {
        // Force close any HTTP connections
        if (this.client && (this.client as any)._httpAgent) {
            const agent = (this.client as any)._httpAgent;
            if (agent && typeof agent.destroy === "function") {
                agent.destroy();
            }
        }
    }
}
