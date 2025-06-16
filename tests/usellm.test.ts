import { describe, expect, test, beforeEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

describe('AgentForceAgent useLLM Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent",
        type: "test-agent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should use default model when no parameter provided", () => {
        agent.useLLM();
        
        const debugInfo = agent.debug();
        expect(debugInfo).toEqual({
            name: "TestAgent",
            type: "test-agent",
            provider: "ollama",
            model: "gemma3:4b"
        });
    });

    test("should parse colon separator format (ollama:gemma3:4b)", () => {
        agent.useLLM("ollama:gemma3:4b");
        
        expect(agent.getProvider()).toBe("ollama");
        expect(agent.getModel()).toBe("gemma3:4b");
    });

    test("should parse colon separator with complex model name (ollama:microsoft/phi4:latest)", () => {
        agent.useLLM("ollama:microsoft/phi4:latest");
        
        expect(agent.getProvider()).toBe("ollama");
        expect(agent.getModel()).toBe("microsoft/phi4:latest");
    });

    test("should parse slash separator format (openai/gpt-3.5-turbo)", () => {
        agent.useLLM("openai/gpt-3.5-turbo");
        
        expect(agent.getProvider()).toBe("openai");
        expect(agent.getModel()).toBe("gpt-3.5-turbo");
    });

    test("should parse slash separator with nested paths (huggingface/models/llama2)", () => {
        agent.useLLM("huggingface/models/llama2");
        
        expect(agent.getProvider()).toBe("huggingface");
        expect(agent.getModel()).toBe("models/llama2");
    });

    test("should handle mixed format with slash first (provider/model:version)", () => {
        agent.useLLM("google/gemini:pro");
        
        expect(agent.getProvider()).toBe("google");
        expect(agent.getModel()).toBe("gemini:pro");
    });

    test("should handle various provider and model combinations", () => {
        const testCases = [
            { input: "anthropic/claude-3", expectedProvider: "anthropic", expectedModel: "claude-3" },
            { input: "google:gemini-pro", expectedProvider: "google", expectedModel: "gemini-pro" },
            { input: "azure:gpt-4", expectedProvider: "azure", expectedModel: "gpt-4" },
            { input: "custom/my-model:v1.0", expectedProvider: "custom", expectedModel: "my-model:v1.0" }
        ];

        testCases.forEach(({ input, expectedProvider, expectedModel }) => {
            const testAgent = new AgentForceAgent(agentConfig);
            testAgent.useLLM(input);
            
            expect(testAgent.getProvider()).toBe(expectedProvider);
            expect(testAgent.getModel()).toBe(expectedModel);
        });
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.useLLM("openai/gpt-4");
        
        expect(result).toBe(agent);
        expect(result instanceof AgentForceAgent).toBe(true);
    });

    test("should support method chaining with multiple useLLM calls", () => {
        agent.useLLM("google:gemini-pro").useLLM("huggingface:llama2");
        
        // Should have the last model set
        expect(agent.getProvider()).toBe("huggingface");
        expect(agent.getModel()).toBe("llama2");
    });

    test("should maintain agent name and type after useLLM", () => {
        agent.useLLM("openai/gpt-4");
        
        expect(agent.name).toBe("TestAgent");
        expect(agent.type).toBe("test-agent");
    });

    test("should handle edge case with just provider name", () => {
        agent.useLLM("ollama");
        
        expect(agent.getProvider()).toBe("ollama");
        expect(agent.getModel()).toBe("ollama");
    });

    test("should handle empty string gracefully", () => {
        agent.useLLM("");
        
        // Should use the entire empty string as model name with default provider
        expect(agent.getProvider()).toBe("ollama");
        expect(agent.getModel()).toBe("");
    });

    test("should integrate with debug method correctly", () => {
        agent.useLLM("anthropic/claude-3.5");
        
        const debugInfo = agent.debug();
        expect(debugInfo).toEqual({
            name: "TestAgent",
            type: "test-agent",
            provider: "anthropic",
            model: "claude-3.5"
        });
    });

    test("should handle complex model names with multiple separators", () => {
        agent.useLLM("huggingface:microsoft/DialoGPT-medium:v1.0");
        
        expect(agent.getProvider()).toBe("huggingface");
        expect(agent.getModel()).toBe("microsoft/DialoGPT-medium:v1.0");
    });
});