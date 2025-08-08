import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

describe("AgentForceAgent ModelConfig Tests", () => {
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestAgent",
        };
        agent = new AgentForceAgent(config);
    });

    test("should accept ModelConfig in useLLM method", () => {
        const modelConfig: ModelConfig = {
            temperature: 0.7,
            maxTokens: 16384,
        };
        
        const result = agent.useLLM("ollama", "llama3", modelConfig);
        expect(result).toBe(agent);
    });

    test("should store ModelConfig internally", () => {
        const modelConfig: ModelConfig = {
            temperature: 0.8,
            maxTokens: 8192,
            maxToolRounds: 5,
            appendToolResults: true,
        };
        
        agent.useLLM("openrouter", "model-name", modelConfig);
        
        // Access the stored config using protected method
        const storedConfig = agent["getModelConfig"]();
        expect(storedConfig).toEqual(modelConfig);
        expect(storedConfig?.temperature).toBe(0.8);
        expect(storedConfig?.maxTokens).toBe(8192);
        expect(storedConfig?.maxToolRounds).toBe(5);
        expect(storedConfig?.appendToolResults).toBe(true);
    });

    test("should work with method chaining", () => {
        const modelConfig: ModelConfig = {
            temperature: 0.5,
        };
        
        const result = agent
            .useLLM("google", "gemini-pro", modelConfig)
            .systemPrompt("Test prompt")
            .prompt("User query");
        
        expect(result).toBe(agent);
        expect(agent["getModelConfig"]()).toEqual(modelConfig);
    });

    test("should handle undefined ModelConfig", () => {
        const result = agent.useLLM("ollama", "model");
        expect(result).toBe(agent);
        
        const storedConfig = agent["getModelConfig"]();
        expect(storedConfig).toBeUndefined();
    });

    test("should update ModelConfig when called multiple times", () => {
        const config1: ModelConfig = { temperature: 0.3 };
        const config2: ModelConfig = { temperature: 0.9, maxTokens: 4096 };
        
        agent.useLLM("ollama", "model1", config1);
        expect(agent["getModelConfig"]()).toEqual(config1);
        
        agent.useLLM("ollama", "model2", config2);
        expect(agent["getModelConfig"]()).toEqual(config2);
    });

    test("should work with all provider types", () => {
        const modelConfig: ModelConfig = { temperature: 0.6 };
        
        // Test with different providers
        const providers: Array<["ollama" | "openrouter" | "google", string]> = [
            ["ollama", "llama3"],
            ["openrouter", "openai/gpt-4"],
            ["google", "gemini-pro"],
        ];
        
        providers.forEach(([provider, model]) => {
            const newAgent = new AgentForceAgent({ name: "TestAgent" });
            const result = newAgent.useLLM(provider, model, modelConfig);
            
            expect(result).toBe(newAgent);
            expect(newAgent["getModelConfig"]()).toEqual(modelConfig);
            expect(newAgent["getProvider"]()).toBe(provider);
            expect(newAgent["getModel"]()).toBe(model);
        });
    });
});