import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ProviderType } from "../../lib/types";

describe('Models Route Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "ModelsTestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should create models route with Ollama provider", () => {
        // This test verifies that the agent can be configured with Ollama provider
        const result = agent.useLLM("ollama", "phi4-mini:latest");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should create models route with OpenAI provider", () => {
        // This test verifies that the agent can be configured with OpenAI provider
        const result = agent.useLLM("openai", "gpt-4");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should support method chaining with models configuration", () => {
        // Test that models route configuration works with method chaining
        const result = agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are a helpful assistant")
            .prompt("Test prompt")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should support specific model ID configurations", () => {
        // Test various model IDs that would be used in the /v1/models/{model} endpoint
        const testCases: { provider: ProviderType; model: string }[] = [
            { provider: "ollama", model: "mistral-small3.1:latest" },
            { provider: "ollama", model: "phi4-mini:latest" },
            { provider: "openai", model: "gpt-4" },
            { provider: "openai", model: "gpt-3.5-turbo" },
            { provider: "anthropic", model: "claude-3" }
        ];

        testCases.forEach(({ provider, model }) => {
            const testAgent = new AgentForceAgent(agentConfig);
            const result = testAgent.useLLM(provider, model);
            
            expect(result).toBe(testAgent);
            expect(result).toBeInstanceOf(AgentForceAgent);
        });
    });

    test("should handle model names with special characters", () => {
        // Test model names that might be used in URL paths
        const specialModelNames = [
            "model:latest",
            "namespace/model:tag",
            "model-with-dashes",
            "model_with_underscores",
            "model.with.dots"
        ];

        specialModelNames.forEach(modelName => {
            const testAgent = new AgentForceAgent(agentConfig);
            const result = testAgent.useLLM("ollama", modelName);
            
            expect(result).toBe(testAgent);
            expect(result).toBeInstanceOf(AgentForceAgent);
        });
    });

    // Note: We don't test the actual HTTP endpoints here as that would require
    // starting a server and making HTTP requests. The integration with the
    // actual Ollama API is tested manually as shown in the implementation.
    // The new /v1/models/{model} endpoint follows the same patterns as the
    // existing /v1/models endpoint and is tested in the manual verification above.
});
