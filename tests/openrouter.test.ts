import { describe, expect, test, beforeEach } from "bun:test";
import { OpenRouterProvider } from "../lib/provider/openrouter";

describe('OpenRouterProvider Tests', () => {
    let provider: OpenRouterProvider;
    let originalEnv: string | undefined;

    beforeEach(() => {
        // Store original env value
        originalEnv = process.env.OPENROUTER_API_KEY;
        
        // Set test API key
        process.env.OPENROUTER_API_KEY = "test-api-key";
        
        provider = new OpenRouterProvider("moonshotai/kimi-k2:free");
    });

    test("should initialize with correct model", () => {
        expect(provider.getModel()).toBe("moonshotai/kimi-k2:free");
    });

    test("should allow setting new model", () => {
        provider.setModel("openai/gpt-4o");
        expect(provider.getModel()).toBe("openai/gpt-4o");
    });

    test("should be instantiable", () => {
        expect(provider).toBeInstanceOf(OpenRouterProvider);
    });

    test("should throw error when OPENROUTER_API_KEY is missing", () => {
        delete process.env.OPENROUTER_API_KEY;
        
        expect(() => {
            new OpenRouterProvider("test-model");
        }).toThrow("OPENROUTER_API_KEY environment variable is required");
        
        // Restore env for other tests
        process.env.OPENROUTER_API_KEY = originalEnv;
    });

    // Note: We don't test the actual chat/generate methods here as they would make
    // external API calls. In a real-world scenario, you'd mock the OpenAI client.
});
