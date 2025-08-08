import ollama from "ollama";
import type { Tool } from "../tools/types";
import { OllamaToolUse } from "./ollama-tooluse";
import type { AgentForceLogger, ModelConfig } from "../types";

// Type for Ollama provider interface
export interface OllamaProviderInterface {
    generate(prompt: string, system?: string): Promise<string>;
    generateWithTools(prompt: string, tools: Tool[], system?: string, logger?: AgentForceLogger): Promise<string>;
    chatWithTools(messages: Array<{ role: string; content: string }>, tools: Tool[], logger?: AgentForceLogger): Promise<string>;
    getModel(): string;
}

/**
 * Ollama provider implementation for the AgentForce SDK
 * Handles communication with locally running Ollama models
 */
export class OllamaProvider implements OllamaProviderInterface {
    private model: string;
    private modelConfig?: ModelConfig;
    private toolUse: OllamaToolUse;

    constructor(model: string, modelConfig?: ModelConfig) {
        this.model = model;
        this.modelConfig = modelConfig;
        this.toolUse = new OllamaToolUse(model, modelConfig);
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
     * Generate response using the Ollama model
     * @param prompt - The user prompt to send to the model
     * @param system - Optional system prompt to override the model's default
     * @returns Promise with the model's response
     */
    async generate(prompt: string, system?: string): Promise<string> {
        try {
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
     * Chat with the Ollama model
     * @param messages - Array of messages for the conversation
     * @returns Promise with the model's response
     */
    async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
        try {
            const response = await ollama.chat({
                model: this.model,
                messages: messages,
                options: this.getOllamaOptions(),
            });
            return response.message.content;
        } catch (error) {
            throw new Error(`Ollama provider error: ${error}`);
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
        this.toolUse = new OllamaToolUse(model, this.modelConfig);
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
        return this.toolUse.generateWithTools(prompt, tools, system, logger);
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
        return this.toolUse.chatWithTools(messages, tools, logger);
    }
}
