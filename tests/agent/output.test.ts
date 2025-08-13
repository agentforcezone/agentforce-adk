import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../lib/agent";
import type { AgentConfig, OutputType } from "../../lib/types";

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
        
        expect(typeof result).toBe("object");
        expect(result).not.toBeNull();
        
        const jsonResult = result as any;
        expect(jsonResult.agent).toBe("TestAgent");
        expect(jsonResult.provider).toBe("openrouter");
        expect(jsonResult.model).toBe("anthropic/claude-3-haiku");
        expect(jsonResult.systemPrompt).toBe("You are an expert");
        expect(jsonResult.userPrompt).toBe("Explain TypeScript");
        expect(jsonResult).toHaveProperty("response");
        expect(jsonResult).toHaveProperty("chatHistory");
        expect(jsonResult).toHaveProperty("timestamp");
        expect(jsonResult.status).toBe("success");
    });

    test("should return markdown format output", async () => {
        agent
            .systemPrompt("You are a writer")
            .prompt("Write a short story")
            .useLLM("google", "gemini-1.5-flash");

        const result = await agent.output("md");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("*Generated at:");
        expect(result).toMatch(/\*Generated at: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\*/);
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
        
        expect(typeof result).toBe("object");
        const jsonResult = result as any;
        expect(jsonResult.systemPrompt).toBe("");
        expect(jsonResult.userPrompt).toBe("");
    });

    test("should work with method chaining", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are helpful")
            .prompt("Hello world")
            .useLLM("ollama", "gemma3:4b")
            .output("json");

        expect(typeof result).toBe("object");
        const jsonResult = result as any;
        expect(jsonResult.agent).toBe("TestAgent");
    });

    test("should handle different providers in json output", async () => {
        agent
            .prompt("Test prompt")
            .useLLM("google", "gemini-1.5-flash");

        const result = await agent.output("json");
        
        const jsonResult = result as any;
        expect(jsonResult.provider).toBe("google");
        expect(jsonResult.model).toBe("gemini-1.5-flash");
    });

    test("should include chat history in json output", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Test message")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.output("json");
        
        const jsonResult = result as any;
        expect(jsonResult.chatHistory).toBeDefined();
        expect(Array.isArray(jsonResult.chatHistory)).toBe(true);
    });

    test("should include timestamp in json output", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        const result = await agent.output("json");
        
        const jsonResult = result as any;
        expect(jsonResult.timestamp).toBeDefined();
        expect(typeof jsonResult.timestamp).toBe("string");
        expect(jsonResult.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
    });

    // Error handling tests
    test("should throw error for invalid output type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.output("invalid" as OutputType)).rejects.toThrow("Output type must be one of: text, json, md");
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
        const executeModule = await import("../../lib/agent/methods/async/execute");
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

    // Test to cover the default case in switch statement (line 71-72)
    test("should log error and return error message for valid string that is not a recognized type", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");
        
        // Spy on the logger
        const mockLogger = (agent as any).getLogger();
        const errorSpy = jest.spyOn(mockLogger, "error").mockImplementation();
        
        // Directly call the internal output logic with a type that passes string validation
        // but isn't in the validTypes array
        const outputFunc = (agent as any).output.bind(agent);
        
        // Override the includes check temporarily
        const originalIncludes = Array.prototype.includes;
        let includesCalled = false;
        Array.prototype.includes = function(...args) {
            // Only override for our specific check
            if (!includesCalled && this.length === 3 && this[0] === "text" && args[0] === "xml") {
                includesCalled = true;
                return true; // Pretend "xml" is valid to pass validation
            }
            return originalIncludes.apply(this, args);
        };
        
        try {
            const result = await outputFunc("xml");
            
            // The switch statement doesn't have a case for "xml", so it hits default
            expect(errorSpy).toHaveBeenCalledWith("Unsupported output type: xml");
            expect(result).toBe("Error: Unsupported output type: xml");
        } finally {
            // Restore original includes
            Array.prototype.includes = originalIncludes;
        }
    });
});