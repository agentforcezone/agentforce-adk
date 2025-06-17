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

    test("should use default provider and model when no parameters provided", () => {
        agent.useLLM();
        
        // Since debug() is now chainable, use getters to verify state
        expect(agent.getProvider()).toBe("ollama");
        expect(agent.getModel()).toBe("gemma3:4b");
        expect(agent.name).toBe("TestAgent");
        expect(agent.type).toBe("test-agent");
    });

    test("should set provider and model with separate parameters", () => {
        agent.useLLM("ollama", "phi4-mini:latest");
        
        expect(agent.getProvider()).toBe("ollama");
        expect(agent.getModel()).toBe("phi4-mini:latest");
    });

    test("should handle different providers correctly", () => {
        const testCases = [
            { provider: "openai", model: "gpt-3.5-turbo" },
            { provider: "anthropic", model: "claude-3" },
            { provider: "google", model: "gemini-pro" },
            { provider: "huggingface", model: "llama2" },
            { provider: "azure", model: "gpt-4" }
        ];

        testCases.forEach(({ provider, model }) => {
            const testAgent = new AgentForceAgent(agentConfig);
            testAgent.useLLM(provider, model);
            
            expect(testAgent.getProvider()).toBe(provider);
            expect(testAgent.getModel()).toBe(model);
        });
    });

    test("should handle complex model names with versions and variants", () => {
        const testCases = [
            { provider: "ollama", model: "microsoft/phi4:latest" },
            { provider: "huggingface", model: "meta-llama/Llama-2-7b-chat-hf" },
            { provider: "openai", model: "gpt-4-turbo-preview" },
            { provider: "anthropic", model: "claude-3-opus-20240229" }
        ];

        testCases.forEach(({ provider, model }) => {
            const testAgent = new AgentForceAgent(agentConfig);
            testAgent.useLLM(provider, model);
            
            expect(testAgent.getProvider()).toBe(provider);
            expect(testAgent.getModel()).toBe(model);
        });
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.useLLM("openai", "gpt-4");
        
        expect(result).toBe(agent);
        expect(result instanceof AgentForceAgent).toBe(true);
    });

    test("should support method chaining with multiple useLLM calls", () => {
        agent.useLLM("google", "gemini-pro").useLLM("anthropic", "claude-3");
        
        // Should have the last model set
        expect(agent.getProvider()).toBe("anthropic");
        expect(agent.getModel()).toBe("claude-3");
    });

    test("should maintain agent name and type after useLLM", () => {
        agent.useLLM("openai", "gpt-4");
        
        expect(agent.name).toBe("TestAgent");
        expect(agent.type).toBe("test-agent");
    });

    test("should handle only provider parameter with default model", () => {
        agent.useLLM("anthropic");
        
        expect(agent.getProvider()).toBe("anthropic");
        expect(agent.getModel()).toBe("gemma3:4b"); // default model
    });

    test("should handle empty strings gracefully", () => {
        agent.useLLM("", "");
        
        expect(agent.getProvider()).toBe("");
        expect(agent.getModel()).toBe("");
    });

    test("should integrate with debug method correctly", () => {
        agent.useLLM("anthropic", "claude-3.5");
        
        // Since debug() is now chainable, verify state using getters
        expect(agent.getProvider()).toBe("anthropic");
        expect(agent.getModel()).toBe("claude-3.5");
        expect(agent.name).toBe("TestAgent");
        expect(agent.type).toBe("test-agent");
        
        // Test that debug() is chainable
        const result = agent.debug();
        expect(result).toBe(agent);
    });

    test("should handle special characters in provider and model names", () => {
        agent.useLLM("custom-provider", "model-name_v1.0:beta");
        
        expect(agent.getProvider()).toBe("custom-provider");
        expect(agent.getModel()).toBe("model-name_v1.0:beta");
    });

    test("should override previous settings when called multiple times", () => {
        // Set initial values
        agent.useLLM("initial-provider", "initial-model");
        expect(agent.getProvider()).toBe("initial-provider");
        expect(agent.getModel()).toBe("initial-model");
        
        // Override with new values
        agent.useLLM("new-provider", "new-model");
        expect(agent.getProvider()).toBe("new-provider");
        expect(agent.getModel()).toBe("new-model");
    });
});