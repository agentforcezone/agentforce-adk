import { describe, expect, test, beforeEach } from "bun:test";
import { MockOllamaProvider } from "./MockOllamaProvider";

describe('MockOllamaProvider Tests', () => {
    let mockProvider: MockOllamaProvider;
    
    beforeEach(() => {
        mockProvider = new MockOllamaProvider("test-model");
    });

    describe('Constructor and Model Management', () => {
        test("should initialize with provided model", () => {
            const provider = new MockOllamaProvider("llama2");
            expect(provider.getModel()).toBe("llama2");
        });

        test("should get current model", () => {
            expect(mockProvider.getModel()).toBe("test-model");
        });

        test("should set new model", () => {
            mockProvider.setModel("new-model");
            expect(mockProvider.getModel()).toBe("new-model");
        });

        test("should handle model changes correctly", () => {
            const initialModel = mockProvider.getModel();
            expect(initialModel).toBe("test-model");
            
            mockProvider.setModel("codellama");
            expect(mockProvider.getModel()).toBe("codellama");
            
            mockProvider.setModel("mistral");
            expect(mockProvider.getModel()).toBe("mistral");
        });
    });

    describe('Generate Method', () => {
        test("should return joke response for joke prompts", async () => {
            const response = await mockProvider.generate("Tell me a joke");
            expect(response).toContain("Why don't pirates use computers");
            expect(response).toContain("Mock response");
        });

        test("should return hello response for hello prompts", async () => {
            const response = await mockProvider.generate("Hello there!");
            expect(response).toBe("Hello there! I'm a mock AI assistant ready to help you.");
        });

        test("should handle empty prompts", async () => {
            const response = await mockProvider.generate("");
            expect(response).toBe("I'm here and ready to assist! Please let me know what you need.");
        });

        test("should return test response for test prompts", async () => {
            const response = await mockProvider.generate("This is a test");
            expect(response).toBe("This is a mock test response. No real API call was made.");
        });

        test("should return generic response for other prompts", async () => {
            const response = await mockProvider.generate("What is the weather?");
            expect(response).toBe('Mock response to: "What is the weather?"');
        });

        test("should handle case insensitive joke detection", async () => {
            const responses = await Promise.all([
                mockProvider.generate("JOKE"),
                mockProvider.generate("JoKe"),
                mockProvider.generate("tell me a JOKE please")
            ]);
            
            responses.forEach(response => {
                expect(response).toContain("Why don't pirates use computers");
            });
        });

        test("should handle case insensitive hello detection", async () => {
            const responses = await Promise.all([
                mockProvider.generate("HELLO"),
                mockProvider.generate("HeLLo"),
                mockProvider.generate("hello world")
            ]);
            
            responses.forEach(response => {
                expect(response).toBe("Hello there! I'm a mock AI assistant ready to help you.");
            });
        });

        test("should handle case insensitive test detection", async () => {
            const responses = await Promise.all([
                mockProvider.generate("TEST"),
                mockProvider.generate("TeSt"),
                mockProvider.generate("testing something")
            ]);
            
            responses.forEach(response => {
                expect(response).toBe("This is a mock test response. No real API call was made.");
            });
        });

        test("should handle system prompt parameter", async () => {
            // System prompt is not used in mock, but we should verify it doesn't break
            const response = await mockProvider.generate("Hello", "You are a helpful assistant");
            expect(response).toBe("Hello there! I'm a mock AI assistant ready to help you.");
        });

        test("should handle various prompt scenarios", async () => {
            const testCases = [
                { prompt: "Tell me a joke about coding", expected: "Why don't pirates use computers" },
                { prompt: "Say hello", expected: "Hello there!" },
                { prompt: "Run a test", expected: "This is a mock test response" },
                { prompt: "Random question", expected: 'Mock response to: "Random question"' }
            ];
            
            for (const testCase of testCases) {
                const response = await mockProvider.generate(testCase.prompt);
                expect(response).toContain(testCase.expected);
            }
        });
    });

    describe('Integration Tests', () => {
        test("should work with model changes and generate", async () => {
            const provider = new MockOllamaProvider("initial-model");
            expect(provider.getModel()).toBe("initial-model");
            
            const response1 = await provider.generate("Hello");
            expect(response1).toContain("Hello there!");
            
            provider.setModel("changed-model");
            expect(provider.getModel()).toBe("changed-model");
            
            const response2 = await provider.generate("Test");
            expect(response2).toContain("mock test response");
        });

        test("should handle edge cases", async () => {
            // Very long prompt
            const longPrompt = "test ".repeat(100);
            const response1 = await mockProvider.generate(longPrompt);
            expect(response1).toBe("This is a mock test response. No real API call was made.");
            
            // Special characters
            const specialPrompt = "Hello!@#$%^&*()";
            const response2 = await mockProvider.generate(specialPrompt);
            expect(response2).toBe("Hello there! I'm a mock AI assistant ready to help you.");
            
            // Whitespace only
            const whitespacePrompt = "   ";
            const response3 = await mockProvider.generate(whitespacePrompt);
            expect(response3).toBe('Mock response to: "   "');
        });
    });
});