import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../lib";

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
        // Test that the method works without throwing errors
        const result = agent.useLLM();
        
        // Verify method chaining works
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should set provider and model with separate parameters", () => {
        // Test that the method works with parameters
        const result = agent.useLLM("ollama", "phi4-mini:latest");
        
        // Verify method chaining works
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
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
            const result = testAgent.useLLM(provider, model);
            
            // Verify method chaining works
            expect(result).toBe(testAgent);
            expect(result).toBeInstanceOf(AgentForceAgent);
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
            const result = testAgent.useLLM(provider, model);
            
            // Verify method chaining works
            expect(result).toBe(testAgent);
            expect(result).toBeInstanceOf(AgentForceAgent);
        });
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.useLLM("openai", "gpt-4");
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should support method chaining with multiple useLLM calls", () => {
        const result = agent.useLLM("google", "gemini-pro").useLLM("anthropic", "claude-3");
        
        // Verify final method chaining works
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should maintain agent instance after useLLM", () => {
        const result = agent.useLLM("openai", "gpt-4");
        
        // Verify the agent instance is maintained
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle only provider parameter", () => {
        const result = agent.useLLM("anthropic");
        
        // Verify method chaining works
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle empty strings gracefully", () => {
        const result = agent.useLLM("", "");
        
        // Verify method chaining works even with empty strings
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should integrate with debug method correctly", () => {
        // Test method chaining with debug
        const result = agent.useLLM("anthropic", "claude-3.5").debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle special characters in provider and model names", () => {
        const result = agent.useLLM("custom-provider", "model-name_v1.0:beta");
        
        // Verify method chaining works with special characters
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should override previous settings when called multiple times", () => {
        // Test multiple calls work without errors
        const result1 = agent.useLLM("initial-provider", "initial-model");
        const result2 = agent.useLLM("new-provider", "new-model");
        
        // Verify both calls return the same agent instance
        expect(result1).toBe(agent);
        expect(result2).toBe(agent);
        expect(result1).toBeInstanceOf(AgentForceAgent);
        expect(result2).toBeInstanceOf(AgentForceAgent);
    });

    test("should work in complex method chains", () => {
        // Test complex method chaining
        const result = agent
            .useLLM("openai", "gpt-4")
            .useLLM("anthropic", "claude-3")
            .debug()
            .useLLM("ollama", "phi4-mini:latest");
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle undefined and null parameters gracefully", () => {
        // Test that method doesn't crash with undefined/null
        expect(() => agent.useLLM(undefined as any)).not.toThrow();
        expect(() => agent.useLLM(null as any)).not.toThrow();
        expect(() => agent.useLLM("openai", undefined as any)).not.toThrow();
        expect(() => agent.useLLM("openai", null as any)).not.toThrow();
    });
});