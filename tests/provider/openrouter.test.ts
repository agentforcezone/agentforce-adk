import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";
import { OpenRouterProvider } from "../../lib/provider/openrouter";

describe("OpenRouterProvider Tests", () => {
    let provider: OpenRouterProvider;
    let originalEnv: string | undefined;
    let originalSiteUrl: string | undefined;
    let originalSiteName: string | undefined;

    beforeEach(() => {
        // Store original env values
        originalEnv = process.env.OPENROUTER_API_KEY;
        originalSiteUrl = process.env.YOUR_SITE_URL;
        originalSiteName = process.env.YOUR_SITE_NAME;
        
        // Set test API key
        process.env.OPENROUTER_API_KEY = "test-api-key";
    });

    afterEach(() => {
        // Restore original env values
        if (originalEnv !== undefined) {
            process.env.OPENROUTER_API_KEY = originalEnv;
        } else {
            delete process.env.OPENROUTER_API_KEY;
        }
        
        if (originalSiteUrl !== undefined) {
            process.env.YOUR_SITE_URL = originalSiteUrl;
        } else {
            delete process.env.YOUR_SITE_URL;
        }
        
        if (originalSiteName !== undefined) {
            process.env.YOUR_SITE_NAME = originalSiteName;
        } else {
            delete process.env.YOUR_SITE_NAME;
        }
    });

    describe("Constructor and Client Initialization", () => {
        test("should initialize with correct model", () => {
            provider = new OpenRouterProvider("moonshotai/kimi-k2:free");
            expect(provider.getModel()).toBe("moonshotai/kimi-k2:free");
        });

        test("should initialize OpenAI client with default headers", () => {
            provider = new OpenRouterProvider("test-model");
            expect(provider).toBeInstanceOf(OpenRouterProvider);
            
            // Verify the client is created (through successful instantiation)
            expect(provider["client"]).toBeDefined();
        });

        test("should use custom site URL and name in headers", () => {
            process.env.YOUR_SITE_URL = "https://custom-site.com";
            process.env.YOUR_SITE_NAME = "Custom Site";
            
            provider = new OpenRouterProvider("test-model");
            expect(provider).toBeInstanceOf(OpenRouterProvider);
        });

        test("should use default headers when custom ones not provided", () => {
            delete process.env.YOUR_SITE_URL;
            delete process.env.YOUR_SITE_NAME;
            
            provider = new OpenRouterProvider("test-model");
            expect(provider).toBeInstanceOf(OpenRouterProvider);
        });

        test("should throw error when OPENROUTER_API_KEY is missing", () => {
            delete process.env.OPENROUTER_API_KEY;
            
            expect(() => {
                new OpenRouterProvider("test-model");
            }).toThrow("OPENROUTER_API_KEY environment variable is required");
        });

        test("should throw error when OPENROUTER_API_KEY is empty", () => {
            process.env.OPENROUTER_API_KEY = "";
            
            expect(() => {
                new OpenRouterProvider("test-model");
            }).toThrow("OPENROUTER_API_KEY environment variable is required");
        });
    });

    describe("Model Management", () => {
        beforeEach(() => {
            provider = new OpenRouterProvider("moonshotai/kimi-k2:free");
        });

        test("should allow setting new model", () => {
            provider.setModel("openai/gpt-4o");
            expect(provider.getModel()).toBe("openai/gpt-4o");
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
            provider = new OpenRouterProvider("moonshotai/kimi-k2:free");
        });

        test("should call OpenAI client with correct parameters for generate", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Generated response"
                    }
                }]
            } as any);

            const result = await provider.generate("Test prompt");

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "user", content: "Test prompt" }
                ]
            });
            expect(result).toBe("Generated response");

            mockCreate.mockRestore();
        });

        test("should include system message when provided", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Response with system"
                    }
                }]
            } as any);

            const result = await provider.generate("Test prompt", "System message");

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "system", content: "System message" },
                    { role: "user", content: "Test prompt" }
                ]
            });
            expect(result).toBe("Response with system");

            mockCreate.mockRestore();
        });

        test("should handle empty system message", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Response without system"
                    }
                }]
            } as any);

            const result = await provider.generate("Test prompt", "");

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "user", content: "Test prompt" }
                ]
            });
            expect(result).toBe("Response without system");

            mockCreate.mockRestore();
        });

        test("should use current model in generate call", async () => {
            provider.setModel("openai/gpt-4o");
            
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Response from new model"
                    }
                }]
            } as any);

            await provider.generate("Test prompt");

            expect(mockCreate).toHaveBeenCalledWith({
                model: "openai/gpt-4o",
                messages: [
                    { role: "user", content: "Test prompt" }
                ]
            });

            mockCreate.mockRestore();
        });

        test("should return empty string when no content in response", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: null
                    }
                }]
            } as any);

            const result = await provider.generate("Test prompt");
            expect(result).toBe("");

            mockCreate.mockRestore();
        });

        test("should return empty string when no message in response", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: null
                }]
            } as any);

            const result = await provider.generate("Test prompt");
            expect(result).toBe("");

            mockCreate.mockRestore();
        });

        test("should return empty string when no choices in response", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: []
            } as any);

            const result = await provider.generate("Test prompt");
            expect(result).toBe("");

            mockCreate.mockRestore();
        });

        test("should throw error when OpenAI client fails", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockRejectedValue(
                new Error("API Error")
            );

            await expect(provider.generate("Test prompt")).rejects.toThrow(
                "OpenRouter provider error: Error: API Error"
            );

            mockCreate.mockRestore();
        });

        test("should handle non-Error exceptions in generate", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockRejectedValue(
                "String error"
            );

            await expect(provider.generate("Test prompt")).rejects.toThrow(
                "OpenRouter provider error: String error"
            );

            mockCreate.mockRestore();
        });
    });

    describe("Chat Method", () => {
        beforeEach(() => {
            provider = new OpenRouterProvider("moonshotai/kimi-k2:free");
        });

        test("should call OpenAI client with correct parameters for chat", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Chat response"
                    }
                }]
            } as any);

            const messages = [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi there" }
            ];

            const result = await provider.chat(messages);

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "user", content: "Hello" },
                    { role: "assistant", content: "Hi there" }
                ]
            });
            expect(result).toBe("Chat response");

            mockCreate.mockRestore();
        });

        test("should handle single message in chat", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Single message response"
                    }
                }]
            } as any);

            const messages = [{ role: "user", content: "Single message" }];
            const result = await provider.chat(messages);

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "user", content: "Single message" }
                ]
            });
            expect(result).toBe("Single message response");

            mockCreate.mockRestore();
        });

        test("should handle empty messages array", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Empty chat response"
                    }
                }]
            } as any);

            const result = await provider.chat([]);

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: []
            });
            expect(result).toBe("Empty chat response");

            mockCreate.mockRestore();
        });

        test("should convert message roles correctly", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Role conversion response"
                    }
                }]
            } as any);

            const messages = [
                { role: "system", content: "System message" },
                { role: "user", content: "User message" },
                { role: "assistant", content: "Assistant message" }
            ];

            const result = await provider.chat(messages);

            expect(mockCreate).toHaveBeenCalledWith({
                model: "moonshotai/kimi-k2:free",
                messages: [
                    { role: "system", content: "System message" },
                    { role: "user", content: "User message" },
                    { role: "assistant", content: "Assistant message" }
                ]
            });
            expect(result).toBe("Role conversion response");

            mockCreate.mockRestore();
        });

        test("should use current model in chat call", async () => {
            provider.setModel("openai/gpt-4o");
            
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: "Chat response from new model"
                    }
                }]
            } as any);

            const messages = [{ role: "user", content: "Test" }];
            await provider.chat(messages);

            expect(mockCreate).toHaveBeenCalledWith({
                model: "openai/gpt-4o",
                messages: [
                    { role: "user", content: "Test" }
                ]
            });

            mockCreate.mockRestore();
        });

        test("should return empty string when no content in chat response", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: {
                        content: null
                    }
                }]
            } as any);

            const result = await provider.chat([{ role: "user", content: "Hello" }]);
            expect(result).toBe("");

            mockCreate.mockRestore();
        });

        test("should return empty string when no message in chat response", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: [{
                    message: null
                }]
            } as any);

            const result = await provider.chat([{ role: "user", content: "Hello" }]);
            expect(result).toBe("");

            mockCreate.mockRestore();
        });

        test("should return empty string when no choices in chat response", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockResolvedValue({
                choices: []
            } as any);

            const result = await provider.chat([{ role: "user", content: "Hello" }]);
            expect(result).toBe("");

            mockCreate.mockRestore();
        });

        test("should throw error when OpenAI client fails in chat", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockRejectedValue(
                new Error("Chat API Error")
            );

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "OpenRouter provider error: Error: Chat API Error"
            );

            mockCreate.mockRestore();
        });

        test("should handle non-Error exceptions in chat", async () => {
            const mockCreate = spyOn(provider["client"].chat.completions, "create").mockRejectedValue(
                "String chat error"
            );

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "OpenRouter provider error: String chat error"
            );

            mockCreate.mockRestore();
        });
    });

    describe("Interface Compliance", () => {
        beforeEach(() => {
            provider = new OpenRouterProvider("moonshotai/kimi-k2:free");
        });

        test("should implement OpenRouterProviderInterface", () => {
            expect(typeof provider.generate).toBe("function");
            expect(typeof provider.chat).toBe("function");
            expect(typeof provider.getModel).toBe("function");
            expect(typeof provider.setModel).toBe("function");
        });

        test("should be instantiable", () => {
            expect(provider).toBeInstanceOf(OpenRouterProvider);
        });

        test("should maintain interface compatibility", () => {
            // Test that all interface methods exist and are callable
            expect(provider.generate).toBeInstanceOf(Function);
            expect(provider.chat).toBeInstanceOf(Function);
            expect(provider.getModel).toBeInstanceOf(Function);
            expect(provider.setModel).toBeInstanceOf(Function);
        });
    });
});
