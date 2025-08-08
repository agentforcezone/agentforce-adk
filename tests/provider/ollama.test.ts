import { describe, expect, test, beforeEach, spyOn } from "bun:test";
import { OllamaProvider } from "../../lib/provider/ollama";
import ollama from "ollama";

describe("OllamaProvider Tests", () => {
    let provider: OllamaProvider;

    beforeEach(() => {
        provider = new OllamaProvider("gemma3:4b");
    });

    describe("Constructor and Model Management", () => {
        test("should initialize with correct model", () => {
            expect(provider.getModel()).toBe("gemma3:4b");
        });

        test("should allow setting new model", () => {
            provider.setModel("llama3.1");
            expect(provider.getModel()).toBe("llama3.1");
        });

        test("should be instantiable", () => {
            expect(provider).toBeInstanceOf(OllamaProvider);
        });

        test("should handle model name changes correctly", () => {
            const originalModel = provider.getModel();
            provider.setModel("new-model");
            expect(provider.getModel()).toBe("new-model");
            expect(provider.getModel()).not.toBe(originalModel);
        });
    });

    describe("Generate Method", () => {
        test("should call ollama.generate with correct parameters", async () => {
            const mockGenerate = spyOn(ollama, "generate").mockResolvedValue({
                response: "Generated response"
            });

            const result = await provider.generate("Test prompt");

            expect(mockGenerate).toHaveBeenCalledTimes(1);
            const call = mockGenerate.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'gemma3:4b');
            expect(call).toHaveProperty('prompt', 'Test prompt');
            expect(call).toHaveProperty('system', undefined);
            expect(result).toBe("Generated response");

            mockGenerate.mockRestore();
        });

        test("should call ollama.generate with system prompt", async () => {
            const mockGenerate = spyOn(ollama, "generate").mockResolvedValue({
                response: "Generated response with system"
            });

            const result = await provider.generate("Test prompt", "System prompt");

            expect(mockGenerate).toHaveBeenCalledTimes(1);
            const call = mockGenerate.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'gemma3:4b');
            expect(call).toHaveProperty('prompt', 'Test prompt');
            expect(call).toHaveProperty('system', 'System prompt');
            expect(result).toBe("Generated response with system");

            mockGenerate.mockRestore();
        });

        test("should use current model in generate call", async () => {
            provider.setModel("llama3.1");
            
            const mockGenerate = spyOn(ollama, "generate").mockResolvedValue({
                response: "Response from new model"
            });

            await provider.generate("Test prompt");

            expect(mockGenerate).toHaveBeenCalledTimes(1);
            const call = mockGenerate.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'llama3.1');
            expect(call).toHaveProperty('prompt', 'Test prompt');
            expect(call).toHaveProperty('system', undefined);

            mockGenerate.mockRestore();
        });

        test("should throw error when ollama.generate fails", async () => {
            const mockGenerate = spyOn(ollama, "generate").mockRejectedValue(
                new Error("Connection failed")
            );

            await expect(provider.generate("Test prompt")).rejects.toThrow(
                "Ollama provider error: Error: Connection failed"
            );

            mockGenerate.mockRestore();
        });

        test("should handle non-Error exceptions in generate", async () => {
            const mockGenerate = spyOn(ollama, "generate").mockRejectedValue(
                "String error"
            );

            await expect(provider.generate("Test prompt")).rejects.toThrow(
                "Ollama provider error: String error"
            );

            mockGenerate.mockRestore();
        });
    });

    describe("Chat Method", () => {
        test("should call ollama.chat with correct parameters", async () => {
            const mockChat = spyOn(ollama, "chat").mockResolvedValue({
                message: {
                    content: "Chat response"
                }
            });

            const messages = [
                { role: "user", content: "Hello" },
                { role: "assistant", content: "Hi there" }
            ];

            const result = await provider.chat(messages);

            expect(mockChat).toHaveBeenCalledTimes(1);
            const call = mockChat.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'gemma3:4b');
            expect(call).toHaveProperty('messages', messages);
            expect(result).toBe("Chat response");

            mockChat.mockRestore();
        });

        test("should handle single message in chat", async () => {
            const mockChat = spyOn(ollama, "chat").mockResolvedValue({
                message: {
                    content: "Single message response"
                }
            });

            const messages = [{ role: "user", content: "Single message" }];
            const result = await provider.chat(messages);

            expect(mockChat).toHaveBeenCalledTimes(1);
            const call = mockChat.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'gemma3:4b');
            expect(call).toHaveProperty('messages', messages);
            expect(result).toBe("Single message response");

            mockChat.mockRestore();
        });

        test("should handle empty messages array", async () => {
            const mockChat = spyOn(ollama, "chat").mockResolvedValue({
                message: {
                    content: "Empty chat response"
                }
            });

            const result = await provider.chat([]);

            expect(mockChat).toHaveBeenCalledTimes(1);
            const call = mockChat.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'gemma3:4b');
            expect(call).toHaveProperty('messages', []);
            expect(result).toBe("Empty chat response");

            mockChat.mockRestore();
        });

        test("should use current model in chat call", async () => {
            provider.setModel("llama3.1");
            
            const mockChat = spyOn(ollama, "chat").mockResolvedValue({
                message: {
                    content: "Chat response from new model"
                }
            });

            const messages = [{ role: "user", content: "Test" }];
            await provider.chat(messages);

            expect(mockChat).toHaveBeenCalledTimes(1);
            const call = mockChat.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'llama3.1');
            expect(call).toHaveProperty('messages', messages);

            mockChat.mockRestore();
        });

        test("should handle various message roles", async () => {
            const mockChat = spyOn(ollama, "chat").mockResolvedValue({
                message: {
                    content: "Mixed roles response"
                }
            });

            const messages = [
                { role: "system", content: "You are helpful" },
                { role: "user", content: "Question" },
                { role: "assistant", content: "Answer" },
                { role: "user", content: "Follow up" }
            ];

            const result = await provider.chat(messages);

            expect(mockChat).toHaveBeenCalledTimes(1);
            const call = mockChat.mock.calls[0][0];
            expect(call).toHaveProperty('model', 'gemma3:4b');
            expect(call).toHaveProperty('messages', messages);
            expect(call).toHaveProperty('options');
            expect(result).toBe("Mixed roles response");

            mockChat.mockRestore();
        });

        test("should throw error when ollama.chat fails", async () => {
            const mockChat = spyOn(ollama, "chat").mockRejectedValue(
                new Error("Chat connection failed")
            );

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "Ollama provider error: Error: Chat connection failed"
            );

            mockChat.mockRestore();
        });

        test("should handle non-Error exceptions in chat", async () => {
            const mockChat = spyOn(ollama, "chat").mockRejectedValue(
                "String chat error"
            );

            const messages = [{ role: "user", content: "Hello" }];

            await expect(provider.chat(messages)).rejects.toThrow(
                "Ollama provider error: String chat error"
            );

            mockChat.mockRestore();
        });
    });

    describe("Interface Compliance", () => {
        test("should implement OllamaProviderInterface", () => {
            expect(typeof provider.generate).toBe("function");
            expect(typeof provider.getModel).toBe("function");
            expect(typeof provider.setModel).toBe("function");
            expect(typeof provider.chat).toBe("function");
        });

        test("should maintain interface compatibility", () => {
            // Test that all interface methods exist and are callable
            expect(provider.generate).toBeInstanceOf(Function);
            expect(provider.getModel).toBeInstanceOf(Function);
            expect(provider.setModel).toBeInstanceOf(Function);
            expect(provider.chat).toBeInstanceOf(Function);
        });
    });
});
