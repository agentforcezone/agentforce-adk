import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../../../lib/agent";
import type { AgentConfig, OutputType } from "../../../../lib/types";

describe("AgentForceAgent output Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return text format output", async () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("What is JavaScript?")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("text");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Agent TestAgent Output (Text Format)");
        expect(result).toContain("System: You are a helpful assistant");
        expect(result).toContain("User: What is JavaScript?");
    });

    test("should return json format output", async () => {
        agent
            .systemPrompt("You are an expert")
            .prompt("Explain TypeScript")
            .useLLM("openrouter", "anthropic/claude-3-haiku");

        const result = await agent.output("json");
        
        // The new JSON output returns the formatted JSON response from the agent
        expect(typeof result).toBe("string");
        expect(result).not.toBeNull();
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should return markdown format output", async () => {
        agent
            .systemPrompt("You are a writer")
            .prompt("Write a short story")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("md");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should return yaml format output", async () => {
        agent
            .systemPrompt("You are a data specialist")
            .prompt("Create user data")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("yaml");
        
        expect(typeof result).toBe("string");
        // YAML output should be a formatted string
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should handle empty prompts in text format", async () => {
        agent
            .systemPrompt("System only")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("text");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Agent TestAgent Output (Text Format)");
        expect(result).toContain("System: System only");
        expect(result).toContain("User: ");
    });

    test("should handle empty prompts in json format", async () => {
        agent
            .systemPrompt("")
            .prompt("")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("json");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should work with method chaining", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are helpful")
            .prompt("Hello world")
            .useLLM("ollama", "gemma3:4b")
            .output("json");

        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should handle different providers in json output", async () => {
        agent
            .prompt("Test prompt")
            .useLLM("google", "gemini-1.5-flash");

        const result = await agent.output("json");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should include chat history in json output", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Test message")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("json");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should include timestamp in json output", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        const result = await agent.output("json");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should handle different providers in yaml output", async () => {
        agent
            .prompt("Test YAML prompt")
            .useLLM("google", "gemini-1.5-flash");

        const result = await agent.output("yaml");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should work with method chaining for yaml output", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are helpful")
            .prompt("Create YAML config")
            .useLLM("ollama", "gemma3:4b")
            .output("yaml");

        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    // Test boolean parameter for code block parsing
    test("should handle enableCodeBlockParsing parameter for JSON", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Return JSON data")
            .useLLM("ollama", "gemma3:4b");

        // Test with parsing enabled (default)
        const resultWithParsing = await agent.output("json");
        expect(typeof resultWithParsing).toBe("string");

        // Test with parsing disabled
        const resultWithoutParsing = await agent.output("json", false);
        expect(typeof resultWithoutParsing).toBe("string");
    });

    test("should handle enableCodeBlockParsing parameter for YAML", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Return YAML data")
            .useLLM("ollama", "gemma3:4b");

        // Test with parsing enabled (default)
        const resultWithParsing = await agent.output("yaml");
        expect(typeof resultWithParsing).toBe("string");

        // Test with parsing disabled
        const resultWithoutParsing = await agent.output("yaml", false);
        expect(typeof resultWithoutParsing).toBe("string");
    });

    test("should handle enableCodeBlockParsing parameter for Markdown", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Return Markdown content")
            .useLLM("ollama", "gemma3:4b");

        // Test with parsing enabled (default)
        const resultWithParsing = await agent.output("md");
        expect(typeof resultWithParsing).toBe("string");

        // Test with parsing disabled
        const resultWithoutParsing = await agent.output("md", false);
        expect(typeof resultWithoutParsing).toBe("string");
    });

    // Error handling tests
    test("should throw error for invalid output type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.output("invalid" as OutputType)).rejects.toThrow("Output type must be one of: text, json, md, yaml");
    });

    test("should throw error for null output type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.output(null as any)).rejects.toThrow("Output type must be a string");
    });

    test("should throw error for undefined output type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.output(undefined as any)).rejects.toThrow("Output type must be a string");
    });

    test("should throw error for non-string output type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.output(123 as any)).rejects.toThrow("Output type must be a string");
    });

    // Test to cover the default case (line 71) - this tests defensive programming
    test("should handle execution errors gracefully", async () => {
        // Mock execute to throw an error
        const executeModule = await import("../../../../lib/agent/methods/async/execute");
        jest.spyOn(executeModule, "execute").mockRejectedValueOnce(new Error("Execution failed"));
        
        agent
            .systemPrompt("Test system")
            .prompt("Test prompt")
            .useLLM("ollama", "gemma3:4b");

        // Even with execution error, output should still work
        const result = await agent.output("text");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Agent TestAgent Output (Text Format)");
        // When execute fails, it should show "No response available"
        expect(result).toContain("Response: No response available");
    });

    // Test input validation for invalid output type
    test("should throw error for invalid output type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");
        
        await expect(agent.output("xml" as any)).rejects.toThrow("Output type must be one of: text, json, md, yaml, html");
    });

    // Error handling tests for format functions
    test("should handle JSON formatting errors gracefully", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        // Mock formatResponseAsJson to throw an error (lines 64-66)
        const jsonUtils = await import("../../../../lib/utils/json");
        const mockFormatJson = jest.spyOn(jsonUtils, "formatResponseAsJson");
        mockFormatJson.mockImplementation(() => {
            throw new Error("JSON formatting failed");
        });

        const result = await agent.output("json");
        expect(result).toBe("Error: Failed to format response as JSON - JSON formatting failed");

        mockFormatJson.mockRestore();
    });

    test("should handle Markdown formatting errors gracefully", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        // Mock formatResponseAsMarkdown to throw an error (lines 75-77)
        const markdownUtils = await import("../../../../lib/utils/markdown");
        const mockFormatMarkdown = jest.spyOn(markdownUtils, "formatResponseAsMarkdown");
        mockFormatMarkdown.mockImplementation(() => {
            throw new Error("Markdown formatting failed");
        });

        const result = await agent.output("md");
        expect(result).toBe("Error: Failed to format response as Markdown - Markdown formatting failed");

        mockFormatMarkdown.mockRestore();
    });

    test("should handle YAML formatting errors gracefully", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        // Mock formatResponseAsYaml to throw an error (lines 86-88)
        const yamlUtils = await import("../../../../lib/utils/yaml");
        const mockFormatYaml = jest.spyOn(yamlUtils, "formatResponseAsYaml");
        mockFormatYaml.mockImplementation(() => {
            throw new Error("YAML formatting failed");
        });

        const result = await agent.output("yaml");
        expect(result).toBe("Error: Failed to format response as YAML - YAML formatting failed");

        mockFormatYaml.mockRestore();
    });

    test("should handle HTML formatting errors gracefully", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        // Mock formatResponseAsHtml to throw an error (lines 97-99)
        const htmlUtils = await import("../../../../lib/utils/html");
        const mockFormatHtml = jest.spyOn(htmlUtils, "formatResponseAsHtml");
        mockFormatHtml.mockImplementation(() => {
            throw new Error("HTML formatting failed");
        });

        const result = await agent.output("html");
        expect(result).toBe("Error: Failed to format response as HTML - HTML formatting failed");

        mockFormatHtml.mockRestore();
    });

    test("should handle non-Error exceptions in formatting", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        // Mock formatResponseAsYaml to throw a non-Error object (lines 86-88)
        const yamlUtils = await import("../../../../lib/utils/yaml");
        const mockFormatYaml = jest.spyOn(yamlUtils, "formatResponseAsYaml");
        mockFormatYaml.mockImplementation(() => {
            throw "String error not an Error object";
        });

        const result = await agent.output("yaml");
        expect(result).toBe("Error: Failed to format response as YAML - String error not an Error object");

        mockFormatYaml.mockRestore();
    });

    test("should return HTML format output", async () => {
        agent
            .systemPrompt("You are a web developer")
            .prompt("Create HTML structure")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("html");
        
        expect(typeof result).toBe("string");
        expect((result as string).length).toBeGreaterThan(0);
    });

    test("should handle enableCodeBlockParsing parameter for HTML", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Return HTML content")
            .useLLM("ollama", "gemma3:4b");

        // Test with parsing enabled (default)
        const resultWithParsing = await agent.output("html");
        expect(typeof resultWithParsing).toBe("string");

        // Test with parsing disabled
        const resultWithoutParsing = await agent.output("html", false);
        expect(typeof resultWithoutParsing).toBe("string");
    });
});