import { GoogleGenAI, Content } from "@google/genai";
import type { ModelConfig } from "../types";

/**
 * Interface for Google provider functionality
 * @interface GoogleProviderInterface
 * @property {function} generate - Generate response from prompt
 * @property {function} chat - Chat using message history
 * @property {function} getModel - Get current model name
 * @property {function} setModel - Set model name
 */
export interface GoogleProviderInterface {
    generate(prompt: string, system?: string): Promise<string>;
    chat(messages: Array<{ role: string; content: string }>): Promise<string>;
    getModel(): string;
    setModel(model: string): void;
}

/**
 * Google Gemini provider implementation for the AgentForce SDK
 * Handles communication with Google's Gemini models
 */
export class GoogleProvider implements GoogleProviderInterface {
    private model: string;
    private modelConfig?: ModelConfig;
    private ai: GoogleGenAI;

    constructor(model: string, modelConfig?: ModelConfig) {
        this.model = model;
        this.modelConfig = modelConfig;

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is required");
        }

        this.ai = new GoogleGenAI({ apiKey });
    }

    /**
     * Generate response using the Google Gemini model
     * @param prompt - The user prompt to send to the model
     * @param system - Optional system prompt to provide context
     * @returns Promise with the model's response
     */
    public async generate(prompt: string, _system?: string): Promise<string> {
        try {
            const generationConfig: any = {};
            if (this.modelConfig?.temperature !== undefined) {
                generationConfig.temperature = this.modelConfig.temperature;
            }
            if (this.modelConfig?.maxTokens !== undefined) {
                generationConfig.maxOutputTokens = this.modelConfig.maxTokens;
            }
            
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
                ...(Object.keys(generationConfig).length > 0 && { generationConfig }),
            });
            return response.text ?? "No response text available";
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error: Google Gemini provider error - ${errorMessage}`;
        }
    }

    /**
     * Chat with the Google Gemini model
     * @param messages - Array of messages for the conversation
     * @returns Promise with the model's response
     */
    async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
        try {
            const contents: Content[] = [];

            for (const msg of messages) {
                if (msg.role === "system") {
                    // System messages are handled differently in Gemini API
                    // For now, we'll skip them as they're not directly supported in contents
                } else {
                    // The Gemini API uses 'user' and 'model' roles
                    contents.push({
                        role: msg.role === "assistant" ? "model" : "user",
                        parts: [{ text: msg.content }],
                    });
                }
            }
            const tools = [
                {
                    googleSearch: {
                    },
                },
            ];

            const config = {
                thinkingConfig: {
                    thinkingBudget: 0,
                },
                tools,
                responseMimeType: "text/plain",
                generationConfig: {
                    ...(this.modelConfig?.temperature !== undefined && { temperature: this.modelConfig.temperature }),
                    ...(this.modelConfig?.maxTokens !== undefined && { maxOutputTokens: this.modelConfig.maxTokens }),
                },
            };

            const response = await this.ai.models.generateContent({
                model: this.model,
                config,
                contents,
            });

            if (!response.text) {
                return "Error: No response text available from Google Gemini";
            }
            return response.text;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return `Error: Google Gemini provider error - ${errorMessage}`;
        }
    }

    getModel(): string {
        return this.model;
    }

    setModel(model: string): void {
        this.model = model;
    }
}