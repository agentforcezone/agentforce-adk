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

    test("should return formatted output (not agent instance) as terminal method", async () => {
        const result = await agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke")
            .output("text");
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
    });

    test("should work as terminal method (no chaining)", async () => {
        const setupAgent = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");

        const result = await setupAgent.output("text");

        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
        
        // Agent should still be accessible for debugging
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle all valid output types and return correct format", async () => {
        const validTypes = ['text', 'json', 'md'];
        
        for (const type of validTypes) {
            const result = await agent.output(type as any);
            if (type === 'json') {
                expect(typeof result).toBe("object");
            } else {
                expect(typeof result).toBe("string");
            }
            expect(result).not.toBe(agent);
        }
    });

    test("should throw error for invalid output type", async () => {
        await expect(agent.output("xml" as any)).rejects.toThrow("Output type must be one of: text, json, md");
        await expect(agent.output("html" as any)).rejects.toThrow("Output type must be one of: text, json, md");
        await expect(agent.output("csv" as any)).rejects.toThrow("Output type must be one of: text, json, md");
    });

    test("should throw error for non-string input", async () => {
        await expect(agent.output(null as any)).rejects.toThrow("Output type must be a string");
        await expect(agent.output(undefined as any)).rejects.toThrow("Output type must be a string");
        await expect(agent.output(123 as any)).rejects.toThrow("Output type must be a string");
        await expect(agent.output([] as any)).rejects.toThrow("Output type must be a string");
        await expect(agent.output({} as any)).rejects.toThrow("Output type must be a string");
    });

    test("should output text format correctly", async () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        const result = await agent.output("text");
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    });

    test("should output json format correctly", async () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        const result = await agent.output("json");
        expect(typeof result).toBe("object");
        expect(result).not.toBe(agent);
    });

    test("should output markdown format correctly", async () => {
        agent
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        const result = await agent.output("md");
        expect(typeof result).toBe("string");
        expect(result).not.toBe(agent);
    });

    test("should work with other methods before output (terminal behavior)", async () => {
        const setupAgent = agent
            .useLLM("ollama", "phi4-mini:latest")
            .systemPrompt("You are a helpful assistant")
            .prompt("tell me a joke");
        
        const result = await setupAgent.output("json");
        
        expect(typeof result).toBe("object");
        expect(result).not.toBe(agent);
        expect(result).not.toBeInstanceOf(AgentForceAgent);
        
        // Can still use debug on the agent separately
        const debugResult = setupAgent.debug();
        expect(debugResult).toBe(agent);
    });

    test("should work with multiple output calls separately", async () => {
        const setupAgent = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a comedian")
            .prompt("tell me a joke");
        
        // Each output call should return the formatted result
        const textResult = await setupAgent.output("text");
        const jsonResult = await setupAgent.output("json");
        const mdResult = await setupAgent.output("md");
        
        expect(typeof textResult).toBe("string");
        expect(typeof jsonResult).toBe("object");
        expect(typeof mdResult).toBe("string");
        
        // None should return the agent
        expect(textResult).not.toBe(agent);
        expect(jsonResult).not.toBe(agent);
        expect(mdResult).not.toBe(agent);
    });

    test("should handle case sensitivity", async () => {
        // Should be case sensitive - these should throw
        await expect(agent.output("TEXT" as any)).rejects.toThrow("Output type must be one of: text, json, md");
        expect(() => agent.output("JSON" as any)).toThrow("Output type must be one of: text, json, md");
        await expect(agent.output("MD" as any)).rejects.toThrow("Output type must be one of: text, json, md");
        await expect(agent.output("Text" as any)).rejects.toThrow("Output type must be one of: text, json, md");
    });

    test("should work with empty prompts", async () => {
        // Test with empty prompts
        agent
            .systemPrompt("")
            .prompt("");
        
        const textResult = await agent.output("text");
        const jsonResult = await agent.output("json");
        const mdResult = await agent.output("md");
        
        expect(typeof textResult).toBe("string");
        expect(typeof jsonResult).toBe("object");
        expect(typeof mdResult).toBe("string");
    });

    test("should work with different LLM configurations", async () => {
        const configurations = [
            { provider: "openai" as const, model: "gpt-4" },
            { provider: "anthropic" as const, model: "claude-3" },
            { provider: "ollama" as const, model: "phi4-mini:latest" },
        ];

        for (const config of configurations) {
            const testAgent = new AgentForceAgent(agentConfig);
            const setupAgent = testAgent
                .useLLM(config.provider, config.model)
                .systemPrompt("You are a helpful assistant")
                .prompt("Hello");
            
            const result = await setupAgent.output("text");
            
            expect(typeof result).toBe("string");
            expect(result).not.toBe(testAgent);
            expect(setupAgent).toBe(testAgent);
        }
    });
});
