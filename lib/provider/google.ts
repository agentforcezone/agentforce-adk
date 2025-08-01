import { GoogleGenAI, Content } from "@google/genai";

// Type for Google provider interface
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
    private ai: GoogleGenAI;

    constructor(model: string) {
        this.model = model;

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
            const response = await this.ai.models.generateContent({
                model: this.model,
                contents: prompt,
            });
            return response.text ?? "No response text available";
        } catch (error) {
            throw new Error(`Google gemini provider error: ${error}`);
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
            };

            const response = await this.ai.models.generateContent({
                model: this.model,
                config,
                contents,
            });

            if (!response.text) {
                throw new Error("No response text available from Google Gemini");
            }
            return response.text;

        } catch (error) {
            throw new Error(`Google Gemini provider error: ${error}`);
        }
    }

    getModel(): string {
        return this.model;
    }

    setModel(model: string): void {
        this.model = model;
    }
}