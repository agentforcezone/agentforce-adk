import { describe, expect, test, beforeEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

describe('AgentForceAgent output Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent",
        type: "test-agent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.output("text");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke")
            .output("text")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle all valid output types", () => {
        const validTypes = ['text', 'json', 'md'];
        
        validTypes.forEach(type => {
            expect(() => agent.output(type as any)).not.toThrow();
            const result = agent.output(type as any);
            expect(result).toBe(agent);
        });
    });

    test("should throw error for invalid output type", () => {
        expect(() => agent.output("xml" as any)).toThrow("Output type must be one of: text, json, md");
        expect(() => agent.output("html" as any)).toThrow("Output type must be one of: text, json, md");
        expect(() => agent.output("csv" as any)).toThrow("Output type must be one of: text, json, md");
    });

    test("should throw error for non-string input", () => {
        expect(() => agent.output(null as any)).toThrow("Output type must be a string");
        expect(() => agent.output(undefined as any)).toThrow("Output type must be a string");
        expect(() => agent.output(123 as any)).toThrow("Output type must be a string");
        expect(() => agent.output([] as any)).toThrow("Output type must be a string");
        expect(() => agent.output({} as any)).toThrow("Output type must be a string");
    });

    test("should output text format correctly", () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        // Test that text output doesn't throw
        expect(() => agent.output("text")).not.toThrow();
        const result = agent.output("text");
        expect(result).toBe(agent);
    });

    test("should output json format correctly", () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        // Test that json output doesn't throw
        expect(() => agent.output("json")).not.toThrow();
        const result = agent.output("json");
        expect(result).toBe(agent);
    });

    test("should output markdown format correctly", () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        // Test that md output doesn't throw
        expect(() => agent.output("md")).not.toThrow();
        const result = agent.output("md");
        expect(result).toBe(agent);
    });

    test("should integrate well with other methods", () => {
        const result = agent
            .useLLM("ollama", "phi4-mini:latest")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke")
            .output("json")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work in complex method chains", () => {
        const result = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a comedian")
            .prompt("tell me a joke")
            .output("text")
            .useLLM("anthropic", "claude-3")
            .prompt("tell me another joke")
            .output("json")
            .output("md");
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle case sensitivity", () => {
        // Should be case sensitive - these should throw
        expect(() => agent.output("TEXT" as any)).toThrow("Output type must be one of: text, json, md");
        expect(() => agent.output("JSON" as any)).toThrow("Output type must be one of: text, json, md");
        expect(() => agent.output("MD" as any)).toThrow("Output type must be one of: text, json, md");
        expect(() => agent.output("Text" as any)).toThrow("Output type must be one of: text, json, md");
    });

    test("should work with empty prompts", () => {
        // Test with empty prompts
        agent
            .systemPrompt("")
            .prompt("");
        
        expect(() => agent.output("text")).not.toThrow();
        expect(() => agent.output("json")).not.toThrow();
        expect(() => agent.output("md")).not.toThrow();
    });

    test("should work with different LLM configurations", () => {
        const configurations = [
            { provider: "openai", model: "gpt-4" },
            { provider: "anthropic", model: "claude-3" },
            { provider: "ollama", model: "phi4-mini:latest" },
            { provider: "google", model: "gemini-pro" }
        ];

        configurations.forEach(config => {
            const testAgent = new AgentForceAgent(agentConfig);
            const result = testAgent
                .useLLM(config.provider, config.model)
                .systemPrompt("You are a helpful assistant")
                .prompt("Hello")
                .output("text");
            
            expect(result).toBe(testAgent);
        });
    });
});
