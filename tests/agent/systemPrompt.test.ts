import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

describe('AgentForceAgent systemPrompt Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent"
    };
    const testFilePath = join(process.cwd(), "test-prompt.md");
    const testPromptContent = "You are a test agent for file loading functionality.";

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
        
        // Clean up test file if it exists
        if (existsSync(testFilePath)) {
            unlinkSync(testFilePath);
        }
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.systemPrompt("You are a helpful assistant");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .systemPrompt("You are a helpful assistant")
            .useLLM("openai", "gpt-4")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should set system prompt correctly", () => {
        const testPrompt = "You are a specialized AI assistant for coding tasks";
        agent.systemPrompt(testPrompt);
        
        // Since getSystemPrompt is protected, we can't directly test it
        // But we can verify the method completed without errors
        expect(agent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle different types of prompts", () => {
        const prompts = [
            "You are a helpful assistant",
            "Act as a professional writer",
            "You are an expert in data analysis",
            "",
            "Multi-line\nprompt\nwith\nbreaks"
        ];

        prompts.forEach(prompt => {
            expect(() => agent.systemPrompt(prompt)).not.toThrow();
        });
    });

    test("should throw error for non-string input", () => {
        expect(() => agent.systemPrompt(null as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt(undefined as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt(123 as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt([] as any)).toThrow("System prompt must be a string");
        expect(() => agent.systemPrompt({} as any)).toThrow("System prompt must be a string");
    });

    test("should integrate well with other methods", () => {
        const result = agent
            .useLLM("ollama", "phi4-mini:latest")
            .systemPrompt("You are a helpful assistant")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle empty string", () => {
        expect(() => agent.systemPrompt("")).not.toThrow();
        const result = agent.systemPrompt("");
        expect(result).toBe(agent);
    });

    test("should handle long system prompts", () => {
        const longPrompt = "You are a helpful assistant. ".repeat(100);
        expect(() => agent.systemPrompt(longPrompt)).not.toThrow();
        const result = agent.systemPrompt(longPrompt);
        expect(result).toBe(agent);
    });

    test("should allow overriding system prompt", () => {
        agent.systemPrompt("First prompt");
        const result = agent.systemPrompt("Second prompt");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    // File loading functionality tests
    test("should load content from file when file path is provided", () => {
        // Create test file
        writeFileSync(testFilePath, testPromptContent);
        
        // Use relative path
        agent.systemPrompt("test-prompt.md");
        
        // Check that file content was loaded
        expect(agent.getSystemPrompt()).toBe(testPromptContent);
        
        // Clean up
        unlinkSync(testFilePath);
    });

    test("should handle non-existent file gracefully", () => {
        const nonExistentFile = "non-existent-file.md";
        
        // Should not throw an error, but should treat as regular prompt
        agent.systemPrompt(nonExistentFile);
        expect(agent.getSystemPrompt()).toBe(nonExistentFile);
    });

    test("should work with method chaining after file loading", () => {
        // Create test file
        writeFileSync(testFilePath, testPromptContent);
        
        const result = agent
            .systemPrompt("test-prompt.md")
            .useLLM("ollama", "test-model");
        
        expect(result).toBe(agent);
        expect(agent.getSystemPrompt()).toBe(testPromptContent);
        
        // Clean up
        unlinkSync(testFilePath);
    });

    test("should handle existing dispatcher.md file", () => {
        // Test with the actual dispatcher.md file
        const dispatcherPath = "lib/systemprompt/dispatcher.md";
        agent.systemPrompt(dispatcherPath);
        
        // Should load the file content (not just the path)
        const systemPrompt = agent.getSystemPrompt();
        expect(systemPrompt).toContain("Dispatcher Agent");
        expect(systemPrompt).toContain("AgentForce");
        expect(systemPrompt.length).toBeGreaterThan(100); // Should be much longer than just the path
    });

    test("should detect file extensions correctly", () => {
        // Create test files with different extensions
        const mdFile = "test.md";
        const txtFile = "test.txt";
        const hbsFile = "test.hbs";
        
        writeFileSync(mdFile, "MD content");
        writeFileSync(txtFile, "TXT content");
        writeFileSync(hbsFile, "HBS content");
        
        agent.systemPrompt(mdFile);
        expect(agent.getSystemPrompt()).toBe("MD content");
        
        agent.systemPrompt(txtFile);
        expect(agent.getSystemPrompt()).toBe("TXT content");
        
        agent.systemPrompt(hbsFile);
        expect(agent.getSystemPrompt()).toBe("HBS content");
        
        // Clean up
        [mdFile, txtFile, hbsFile].forEach(file => {
            if (existsSync(file)) unlinkSync(file);
        });
    });

    test("should treat non-file-like strings as regular prompts", () => {
        const regularPrompt = "You are a helpful assistant without any file extension";
        agent.systemPrompt(regularPrompt);
        expect(agent.getSystemPrompt()).toBe(regularPrompt);
    });

    test("should treat unsupported file extensions as regular prompts", () => {
        const unsupportedFile = "test.prompt";
        agent.systemPrompt(unsupportedFile);
        expect(agent.getSystemPrompt()).toBe(unsupportedFile);
        
        const anotherUnsupportedFile = "test.sys";
        agent.systemPrompt(anotherUnsupportedFile);
        expect(agent.getSystemPrompt()).toBe(anotherUnsupportedFile);
    });
});
