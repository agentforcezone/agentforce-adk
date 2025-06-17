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

    test("should return formatted output (not agent instance) as terminal method", () => {
        const result = agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke")
            .output("text");
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
    });

    test("should work as terminal method (no chaining)", () => {
        const setupAgent = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        const result = setupAgent.output("text");
        
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
        
        // Agent should still be accessible for debugging
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle all valid output types and return correct format", () => {
        const validTypes = ['text', 'json', 'md'];
        
        validTypes.forEach(type => {
            expect(() => agent.output(type as any)).not.toThrow();
            const result = agent.output(type as any);
            if (type === 'json') {
                expect(typeof result).toBe("object");
            } else {
                expect(typeof result).toBe("string");
            }
            expect(result).not.toBe(agent);
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
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    });

    test("should output json format correctly", () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        // Test that json output doesn't throw
        expect(() => agent.output("json")).not.toThrow();
        const result = agent.output("json");
        expect(typeof result).toBe("object");
        expect(result).not.toBe(agent);
    });

    test("should output markdown format correctly", () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        // Test that md output doesn't throw
        expect(() => agent.output("md")).not.toThrow();
        const result = agent.output("md");
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    });

    test("should work with other methods before output (terminal behavior)", () => {
        const setupAgent = agent
            .useLLM("ollama", "phi4-mini:latest")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        const result = setupAgent.output("json");
        
        expect(typeof result).toBe("object");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
        
        // Can still use debug on the agent separately
        const debugResult = setupAgent.debug();
        expect(debugResult).toBe(agent);
    });

    test("should work with multiple output calls separately", () => {
        const setupAgent = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a comedian")
            .prompt("tell me a joke");
        
        // Each output call should return the formatted result
        const textResult = setupAgent.output("text");
        const jsonResult = setupAgent.output("json");
        const mdResult = setupAgent.output("md");
        
        expect(typeof textResult).toBe("string");
        expect(typeof jsonResult).toBe("object");
        expect(typeof mdResult).toBe("string");
        
        // None should return the agent
        expect(textResult).not.toBe(agent);
        expect(jsonResult).not.toBe(agent);
        expect(mdResult).not.toBe(agent);
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
            { provider: "openai" as const, model: "gpt-4" },
            { provider: "anthropic" as const, model: "claude-3" },
            { provider: "ollama" as const, model: "phi4-mini:latest" },
        ];

        configurations.forEach(config => {
            const testAgent = new AgentForceAgent(agentConfig);
            const setupAgent = testAgent
                .useLLM(config.provider, config.model)
                .systemPrompt("You are a helpful assistant")
                .prompt("Hello");
            
            const result = setupAgent.output("text");
            
            expect(typeof result).toBe("string");
            expect(result).not.toBe(testAgent);
            expect(setupAgent).toBe(testAgent);
        });
    });
});
