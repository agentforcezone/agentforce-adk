import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../../../lib/agent";
import type { AgentConfig, OutputType } from "../../../../lib/types";

describe("AgentForceAgent output Method", () => {
    let agent: AgentForceAgent;
    const mockConfig: AgentConfig = { name: "TestAgent" };

    beforeEach(() => {
        agent = new AgentForceAgent(mockConfig);
        jest.clearAllMocks();
    });

    describe("Input Validation", () => {
        test("should throw error for null output type", async () => {
            await expect(agent.output(null as any))
                .rejects.toThrow("Output type must be a string");
        });

        test("should throw error for undefined output type", async () => {
            await expect(agent.output(undefined as any))
                .rejects.toThrow("Output type must be a string");
        });

        test("should throw error for non-string output type", async () => {
            await expect(agent.output(123 as any))
                .rejects.toThrow("Output type must be a string");
        });

        test("should throw error for empty string output type", async () => {
            await expect(agent.output("" as any))
                .rejects.toThrow("Output type must be a string");
        });

        test("should throw error for invalid output type", async () => {
            await expect(agent.output("invalid" as OutputType))
                .rejects.toThrow("Output type must be one of: text, json, md, yaml, html");
        });

        test("should throw error for unsupported output type", async () => {
            await expect(agent.output("xml" as any))
                .rejects.toThrow("Output type must be one of: text, json, md, yaml, html");
        });
    });

    describe("Text Output", () => {
        test("should return text format output", async () => {
            agent.systemPrompt("Test system").prompt("Test user").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("text");
            
            expect(typeof result).toBe("string");
            expect(result).toContain("Agent TestAgent Output (Text Format)");
            expect(result).toContain("System: Test system");
            expect(result).toContain("User: Test user");
        });

        test("should handle empty prompts in text format", async () => {
            agent.useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("text");
            
            expect(result).toContain("Agent TestAgent Output (Text Format)");
            expect(result).toContain("System: You are an AI agent");
            expect(result).toContain("User: ");
        });
    });

    describe("JSON Output", () => {
        test("should return json format output with parsing enabled", async () => {
            agent.prompt("Return JSON").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("json");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should return json format output with parsing disabled", async () => {
            agent.prompt("Return JSON").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("json", false);
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should handle JSON formatting errors gracefully", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const jsonUtils = await import("../../../../lib/utils/json");
            const mockFormatJson = jest.spyOn(jsonUtils, "formatResponseAsJson");
            mockFormatJson.mockImplementation(() => {
                throw new Error("JSON formatting failed");
            });

            const result = await agent.output("json");
            expect(result).toBe("Error: Failed to format response as JSON - JSON formatting failed");

            mockFormatJson.mockRestore();
        });

        test("should handle non-Error exceptions in JSON formatting", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const jsonUtils = await import("../../../../lib/utils/json");
            const mockFormatJson = jest.spyOn(jsonUtils, "formatResponseAsJson");
            mockFormatJson.mockImplementation(() => {
                throw "String error not an Error object";
            });

            const result = await agent.output("json");
            expect(result).toBe("Error: Failed to format response as JSON - String error not an Error object");

            mockFormatJson.mockRestore();
        });
    });

    describe("Markdown Output", () => {
        test("should return markdown format output with parsing enabled", async () => {
            agent.prompt("Return markdown").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("md");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should return markdown format output with parsing disabled", async () => {
            agent.prompt("Return markdown").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("md", false);
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should handle Markdown formatting errors gracefully", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const markdownUtils = await import("../../../../lib/utils/markdown");
            const mockFormatMarkdown = jest.spyOn(markdownUtils, "formatResponseAsMarkdown");
            mockFormatMarkdown.mockImplementation(() => {
                throw new Error("Markdown formatting failed");
            });

            const result = await agent.output("md");
            expect(result).toBe("Error: Failed to format response as Markdown - Markdown formatting failed");

            mockFormatMarkdown.mockRestore();
        });

        test("should handle non-Error exceptions in Markdown formatting", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const markdownUtils = await import("../../../../lib/utils/markdown");
            const mockFormatMarkdown = jest.spyOn(markdownUtils, "formatResponseAsMarkdown");
            mockFormatMarkdown.mockImplementation(() => {
                throw "Markdown formatting error";
            });

            const result = await agent.output("md");
            expect(result).toBe("Error: Failed to format response as Markdown - Markdown formatting error");

            mockFormatMarkdown.mockRestore();
        });
    });

    describe("YAML Output", () => {
        test("should return yaml format output with parsing enabled", async () => {
            agent.prompt("Return YAML").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("yaml");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should return yaml format output with parsing disabled", async () => {
            agent.prompt("Return YAML").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("yaml", false);
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should handle YAML formatting errors gracefully", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const yamlUtils = await import("../../../../lib/utils/yaml");
            const mockFormatYaml = jest.spyOn(yamlUtils, "formatResponseAsYaml");
            mockFormatYaml.mockImplementation(() => {
                throw new Error("YAML formatting failed");
            });

            const result = await agent.output("yaml");
            expect(result).toBe("Error: Failed to format response as YAML - YAML formatting failed");

            mockFormatYaml.mockRestore();
        });

        test("should handle non-Error exceptions in YAML formatting", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const yamlUtils = await import("../../../../lib/utils/yaml");
            const mockFormatYaml = jest.spyOn(yamlUtils, "formatResponseAsYaml");
            mockFormatYaml.mockImplementation(() => {
                throw { message: "Complex error object" };
            });

            const result = await agent.output("yaml");
            expect(result).toBe("Error: Failed to format response as YAML - [object Object]");

            mockFormatYaml.mockRestore();
        });
    });

    describe("HTML Output", () => {
        test("should return html format output with parsing enabled", async () => {
            agent.prompt("Return HTML").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("html");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should return html format output with parsing disabled", async () => {
            agent.prompt("Return HTML").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("html", false);
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should handle HTML formatting errors gracefully", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const htmlUtils = await import("../../../../lib/utils/html");
            const mockFormatHtml = jest.spyOn(htmlUtils, "formatResponseAsHtml");
            mockFormatHtml.mockImplementation(() => {
                throw new Error("HTML formatting failed");
            });

            const result = await agent.output("html");
            expect(result).toBe("Error: Failed to format response as HTML - HTML formatting failed");

            mockFormatHtml.mockRestore();
        });

        test("should handle non-Error exceptions in HTML formatting", async () => {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");

            const htmlUtils = await import("../../../../lib/utils/html");
            const mockFormatHtml = jest.spyOn(htmlUtils, "formatResponseAsHtml");
            mockFormatHtml.mockImplementation(() => {
                throw "HTML formatting error string";
            });

            const result = await agent.output("html");
            expect(result).toBe("Error: Failed to format response as HTML - HTML formatting error string");

            mockFormatHtml.mockRestore();
        });
    });

    describe("Method Chaining", () => {
        test("should work with method chaining for text output", async () => {
            const result = await agent
                .debug()
                .systemPrompt("System prompt")
                .prompt("User prompt")
                .useLLM("ollama", "gemma3:4b")
                .output("text");

            expect(typeof result).toBe("string");
            expect(result).toContain("Agent TestAgent Output (Text Format)");
        });

        test("should work with method chaining for json output", async () => {
            const result = await agent
                .systemPrompt("Return JSON")
                .prompt("Create JSON data")
                .useLLM("openrouter", "anthropic/claude-3-haiku")
                .output("json");

            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should work with method chaining for yaml output", async () => {
            const result = await agent
                .debug()
                .systemPrompt("Return YAML")
                .prompt("Create YAML config")
                .useLLM("google", "gemini-1.5-flash")
                .output("yaml");

            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });
    });

    describe("Provider Integration", () => {
        test("should work with different providers for json output", async () => {
            agent.prompt("Test prompt").useLLM("google", "gemini-1.5-flash");
            
            const result = await agent.output("json");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should work with different providers for yaml output", async () => {
            agent.prompt("Test YAML prompt").useLLM("openrouter", "anthropic/claude-3-haiku");
            
            const result = await agent.output("yaml");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });
    });

    describe("Error Handling", () => {
        test("should handle execution errors gracefully", async () => {
            const executeModule = await import("../../../../lib/agent/methods/async/execute");
            const mockExecute = jest.spyOn(executeModule, "execute");
            mockExecute.mockRejectedValueOnce(new Error("Execution failed"));
            
            agent.systemPrompt("Test system").prompt("Test prompt").useLLM("ollama", "gemma3:4b");

            const result = await agent.output("text");
            
            expect(typeof result).toBe("string");
            expect(result).toContain("Agent TestAgent Output (Text Format)");
            expect(result).toContain("Response: No response available");

            mockExecute.mockRestore();
        });
    });

    describe("Chat History Integration", () => {
        test("should include chat history in output", async () => {
            agent.systemPrompt("Test system").prompt("Test message").useLLM("ollama", "gemma3:4b");
            
            const result = await agent.output("json");
            
            expect(typeof result).toBe("string");
            expect((result as string).length).toBeGreaterThan(0);
        });

        test("should handle missing assistant response gracefully", async () => {
            // Test with a fresh agent that has no execution history
            const freshAgent = new AgentForceAgent({ name: "FreshAgent" });
            freshAgent.prompt("Test").useLLM("ollama", "gemma3:4b");
            
            // Mock the execution to fail, ensuring no assistant response is available
            const executeModule = await import("../../../../lib/agent/methods/async/execute");
            const mockExecute = jest.spyOn(executeModule, "execute");
            mockExecute.mockRejectedValueOnce(new Error("No response"));
            
            const result = await freshAgent.output("text");
            expect(result).toContain("Response: No response available");
            
            mockExecute.mockRestore();
        });
    });
});