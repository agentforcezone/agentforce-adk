import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";
import { GoogleProvider } from "../../lib/provider/google";

describe("GoogleProvider Tests", () => {
    let provider: GoogleProvider;
    let originalEnv: string | undefined;

    beforeEach(() => {
        // Store original env value
        originalEnv = process.env.GEMINI_API_KEY;
        
        // Set test API key
        process.env.GEMINI_API_KEY = "test-api-key";
    });

    afterEach(() => {
        // Restore original env value
        if (originalEnv !== undefined) {
            process.env.GEMINI_API_KEY = originalEnv;
        } else {
            delete process.env.GEMINI_API_KEY;
        }
    });

    describe("Constructor", () => {
        test("should initialize with correct model when API key is present", () => {
            provider = new GoogleProvider("gemini-1.5-flash");
            expect(provider.getModel()).toBe("gemini-1.5-flash");
        });

        test("should initialize GoogleGenAI instance when API key is present", () => {
            provider = new GoogleProvider("gemini-1.5-flash");
            expect(provider).toBeInstanceOf(GoogleProvider);
        });

        test("should throw error when GEMINI_API_KEY is not set", () => {
            delete process.env.GEMINI_API_KEY;
            
            expect(() => {
                new GoogleProvider("gemini-1.5-flash");
            }).toThrow("GEMINI_API_KEY environment variable is required");
        });

        test("should throw error when GEMINI_API_KEY is empty string", () => {
            process.env.GEMINI_API_KEY = "";
            
            expect(() => {
                new GoogleProvider("gemini-1.5-flash");
            }).toThrow("GEMINI_API_KEY environment variable is required");
        });
    });

    describe("Model Management", () => {
        beforeEach(() => {
            provider = new GoogleProvider("gemini-1.5-flash");
        });

        test("should get current model", () => {
            expect(provider.getModel()).toBe("gemini-1.5-flash");
        });

        test("should allow setting new model", () => {
            provider.setModel("gemini-1.5-pro");
            expect(provider.getModel()).toBe("gemini-1.5-pro");
        });

        test("should handle model name changes correctly", () => {
            const originalModel = provider.getModel();
            provider.setModel("new-model");
            expect(provider.getModel()).toBe("new-model");
            expect(provider.getModel()).not.toBe(originalModel);
        });
    });

    describe("Generate Method", () => {
        beforeEach(() => {
            provider = new GoogleProvider("gemini-1.5-flash");
        });

        test("should call generate with correct parameters", async () => {
            // Mock the GoogleGenAI instance
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Generated response"
            });

            const result = await provider.generate("Test prompt");

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                contents: "Test prompt"
            });
            expect(result).toBe("Generated response");

            mockGenerateContent.mockRestore();
        });

        test("should handle system prompt parameter (ignored)", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Generated response"
            });

            const result = await provider.generate("Test prompt", "System prompt");

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                contents: "Test prompt"
            });
            expect(result).toBe("Generated response");

            mockGenerateContent.mockRestore();
        });

        test("should return default message when response.text is null", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: null
            });

            const result = await provider.generate("Test prompt");

            expect(result).toBe("No response text available");

            mockGenerateContent.mockRestore();
        });

        test("should return default message when response.text is undefined", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: undefined
            });

            const result = await provider.generate("Test prompt");

            expect(result).toBe("No response text available");

            mockGenerateContent.mockRestore();
        });

        test("should throw error when generate fails", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockRejectedValue(
                new Error("API Error")
            );

            await expect(provider.generate("Test prompt")).rejects.toThrow(
                "Google gemini provider error: Error: API Error"
            );

            mockGenerateContent.mockRestore();
        });

        test("should handle non-Error exceptions", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockRejectedValue(
                "String error"
            );

            await expect(provider.generate("Test prompt")).rejects.toThrow(
                "Google gemini provider error: String error"
            );

            mockGenerateContent.mockRestore();
        });
    });

    describe("Chat Method", () => {
        beforeEach(() => {
            provider = new GoogleProvider("gemini-1.5-flash");
        });

        test("should handle user messages correctly", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Chat response"
            });

            const messages = [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi there" },
                { role: "user", content: "How are you?" }
            ];

            const result = await provider.chat(messages);

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0
                    },
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ],
                    responseMimeType: "text/plain"
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: "Hello" }]
                    },
                    {
                        role: "model", // assistant -> model
                        parts: [{ text: "Hi there" }]
                    },
                    {
                        role: "user",
                        parts: [{ text: "How are you?" }]
                    }
                ]
            });
            expect(result).toBe("Chat response");

            mockGenerateContent.mockRestore();
        });

        test("should skip system messages", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Chat response"
            });

            const messages = [
                { role: "system", content: "You are a helpful assistant" },
                { role: "user", content: "Hello" }
            ];

            const result = await provider.chat(messages);

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0
                    },
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ],
                    responseMimeType: "text/plain"
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: "Hello" }]
                    }
                ]
            });
            expect(result).toBe("Chat response");

            mockGenerateContent.mockRestore();
        });

        test("should convert assistant role to model role", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Chat response"
            });

            const messages = [
                { role: "assistant", content: "I'm an assistant" }
            ];

            const result = await provider.chat(messages);

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0
                    },
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ],
                    responseMimeType: "text/plain"
                },
                contents: [
                    {
                        role: "model",
                        parts: [{ text: "I'm an assistant" }]
                    }
                ]
            });
            expect(result).toBe("Chat response");

            mockGenerateContent.mockRestore();
        });

        test("should handle empty messages array", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Empty chat response"
            });

            const result = await provider.chat([]);

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0
                    },
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ],
                    responseMimeType: "text/plain"
                },
                contents: []
            });
            expect(result).toBe("Empty chat response");

            mockGenerateContent.mockRestore();
        });

        test("should handle mixed message roles", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: "Mixed response"
            });

            const messages = [
                { role: "system", content: "System message" },
                { role: "user", content: "User message" },
                { role: "assistant", content: "Assistant message" },
                { role: "unknown", content: "Unknown role message" }
            ];

            const result = await provider.chat(messages);

            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: "gemini-1.5-flash",
                config: {
                    thinkingConfig: {
                        thinkingBudget: 0
                    },
                    tools: [
                        {
                            googleSearch: {}
                        }
                    ],
                    responseMimeType: "text/plain"
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: "User message" }]
                    },
                    {
                        role: "model",
                        parts: [{ text: "Assistant message" }]
                    },
                    {
                        role: "user", // unknown -> user (default)
                        parts: [{ text: "Unknown role message" }]
                    }
                ]
            });
            expect(result).toBe("Mixed response");

            mockGenerateContent.mockRestore();
        });

        test("should throw error when response.text is null", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: null
            });

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "No response text available from Google Gemini"
            );

            mockGenerateContent.mockRestore();
        });

        test("should throw error when response.text is undefined", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: undefined
            });

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "No response text available from Google Gemini"
            );

            mockGenerateContent.mockRestore();
        });

        test("should throw error when response.text is empty string", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockResolvedValue({
                text: ""
            });

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "No response text available from Google Gemini"
            );

            mockGenerateContent.mockRestore();
        });

        test("should handle API errors in chat", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockRejectedValue(
                new Error("Chat API Error")
            );

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "Google Gemini provider error: Error: Chat API Error"
            );

            mockGenerateContent.mockRestore();
        });

        test("should handle non-Error exceptions in chat", async () => {
            const mockGenerateContent = spyOn(provider["ai"].models, "generateContent").mockRejectedValue(
                "String chat error"
            );

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "Google Gemini provider error: String chat error"
            );

            mockGenerateContent.mockRestore();
        });
    });

    describe("Interface Compliance", () => {
        beforeEach(() => {
            provider = new GoogleProvider("gemini-1.5-flash");
        });

        test("should implement GoogleProviderInterface", () => {
            expect(typeof provider.generate).toBe("function");
            expect(typeof provider.chat).toBe("function");
            expect(typeof provider.getModel).toBe("function");
            expect(typeof provider.setModel).toBe("function");
        });

        test("should be instantiable", () => {
            expect(provider).toBeInstanceOf(GoogleProvider);
        });
    });
});