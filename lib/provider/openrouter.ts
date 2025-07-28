import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Type for OpenRouter provider interface
export interface OpenRouterProviderInterface {
    generate(prompt: string, system?: string): Promise<string>;
    chat(messages: Array<{ role: string; content: string }>): Promise<string>;
    getModel(): string;
    setModel(model: string): void;
}

/**
 * OpenRouter provider implementation for the AgentForce SDK
 * Handles communication with OpenRouter's API using OpenAI-compatible interface
 */
export class OpenRouterProvider implements OpenRouterProviderInterface {
    private model: string;
    private client: OpenAI;

    constructor(model: string) {
        this.model = model;
        
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
     * Generate response using the OpenRouter model
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
                model: this.model,
                messages: messages,
            });

            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            throw new Error(`OpenRouter provider error: ${error}`);
        }
    }

    /**
     * Chat with the OpenRouter model
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
                model: this.model,
                messages: openAIMessages,
            });

            return completion.choices[0]?.message?.content || "";
        } catch (error) {
            throw new Error(`OpenRouter provider error: ${error}`);
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
    }
}
