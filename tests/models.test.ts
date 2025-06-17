import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

describe('Models Route Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "ModelsTestAgent",
        type: "models-test-agent"
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

    // Note: We don't test the actual HTTP endpoints here as that would require
    // starting a server and making HTTP requests. The integration with the
    // actual Ollama API is tested manually as shown in the implementation.
});
