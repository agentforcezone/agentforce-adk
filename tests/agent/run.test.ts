import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../lib/agent";
import type { AgentConfig } from "../../lib/types";

describe("AgentForceAgent run Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("Hello world")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.run();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with simple prompt and system prompt", async () => {
        const result = await agent
            .systemPrompt("You are an AI assistant")
            .prompt("What is TypeScript?")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with different providers", async () => {
        const result = await agent
            .prompt("Test prompt")
            .useLLM("openrouter", "anthropic/claude-3-haiku")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with google provider", async () => {
        const result = await agent
            .prompt("Explain quantum computing")
            .useLLM("google", "gemini-1.5-flash")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with tasks", async () => {
        const result = await agent
            .systemPrompt("You are a task executor")
            .task("First task: analyze data")
            .task("Second task: generate report")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with templates", async () => {
        const result = await agent
            .systemPrompt("You are a code reviewer")
            .withTemplate("review.md")
            .prompt("Review this code")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with debug mode", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are helpful")
            .prompt("Debug test")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with minimal configuration", async () => {
        const result = await agent
            .prompt("Hello")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with empty prompt", async () => {
        const result = await agent
            .systemPrompt("System only")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with method chaining after run", async () => {
        const result = await agent
            .prompt("Initial prompt")
            .useLLM("ollama", "gemma3:4b")
            .run();

        // Should be able to chain more methods after run
        const secondResult = await result
            .prompt("Second prompt")
            .run();

        expect(result).toBe(agent);
        expect(secondResult).toBe(agent);
    });

    test("should work with tools configured", async () => {
        const agentWithTools = new AgentForceAgent({
            name: "ToolAgent",
            tools: ["web_fetch", "fs_write_file"]
        });

        const result = await agentWithTools
            .systemPrompt("You are a tool-using assistant")
            .prompt("Fetch some data and save it")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agentWithTools);
    });

    test("should work with skills configured", async () => {
        const agentWithSkills = new AgentForceAgent({
            name: "SkillAgent", 
            skills: ["product-owner.md"]
        });

        const result = await agentWithSkills
            .systemPrompt("You are a skilled assistant")
            .prompt("Create a product specification")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agentWithSkills);
    });

    test("should work with model configuration", async () => {
        const modelConfig = {
            temperature: 0.8,
            maxTokens: 2048
        };

        const result = await agent
            .useLLM("ollama", "gemma3:4b", modelConfig)
            .prompt("Be creative and write a story")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with openai provider (not implemented)", async () => {
        const result = await agent
            .useLLM("openai", "gpt-4")
            .prompt("Test openai")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with anthropic provider (not implemented)", async () => {
        const result = await agent
            .useLLM("anthropic", "claude-3")
            .prompt("Test anthropic")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with unknown provider", async () => {
        const result = await agent
            .useLLM("unknown" as any, "unknown-model")
            .prompt("Test unknown provider")
            .run();

        expect(result).toBe(agent);
    });

    test("should handle errors gracefully (not re-throw)", async () => {
        // Even if execute throws an error, run should not re-throw and should return agent
        const result = await agent
            .prompt("This might cause an error")
            .useLLM("ollama", "gemma3:4b")
            .run();

        expect(result).toBe(agent);
    });

    test("should work with complex method chaining", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are an expert AI assistant")
            .withTemplate("complex.md")
            .task("Analyze the requirements")
            .task("Generate a solution")
            .prompt("Please complete these tasks")
            .useLLM("google", "gemini-1.5-flash")
            .run();

        expect(result).toBe(agent);
    });
});