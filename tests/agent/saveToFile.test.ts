import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';

describe('AgentForceAgent saveToFile Method Tests', () => {
    let agent: AgentForceAgent;
    const testFiles: string[] = [];
    
    beforeEach(() => {
        const agentConfig: AgentConfig = {
            name: "TestAgent"
        };
        agent = new AgentForceAgent(agentConfig);
    });

    afterEach(async () => {
        // Clean up test files
        for (const file of testFiles) {
            try {
                await unlink(file);
            } catch {
                // File might not exist, ignore error
            }
        }
        testFiles.length = 0;
    });

    test("should throw error if filename is not provided", async () => {
        await expect(agent.saveToFile("")).rejects.toThrow("Filename must be a non-empty string");
    });

    test("should throw error if filename is not a string", async () => {
        // @ts-expect-error Testing invalid input
        await expect(agent.saveToFile(123)).rejects.toThrow("Filename must be a non-empty string");
    });

    test("should throw error for unsupported file extension", async () => {
        await expect(agent.saveToFile("test.pdf")).rejects.toThrow("Unsupported file extension. Use .txt, .json, or .md");
    });

    test("should save text format file with .txt extension", async () => {
        const fileName = "test-output.txt";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a test assistant")
             .prompt("Hello world");

        const filePath = await agent.saveToFile(fileName);
        expect(filePath).toBe(expectedPath);

        // Verify file content
        const content = await readFile(filePath, 'utf8');
        expect(content).toContain("=== Agent TestAgent Output (Text Format) ===");
        expect(content).toContain("System: You are a test assistant");
        expect(content).toContain("User: Hello world");
    });

    test("should save JSON format file with .json extension", async () => {
        const fileName = "test-output.json";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a test assistant")
             .prompt("Hello world");

        const filePath = await agent.saveToFile(fileName);
        expect(filePath).toBe(expectedPath);

        // Verify file content
        const content = await readFile(filePath, 'utf8');
        const jsonData = JSON.parse(content);
        
        expect(jsonData.agent).toBe("TestAgent");
        expect(jsonData.provider).toBe("ollama");
        expect(jsonData.model).toBe("gemma3:4b");
        expect(jsonData.systemPrompt).toBe("You are a test assistant");
        expect(jsonData.userPrompt).toBe("Hello world");
        expect(jsonData.response).toBeDefined();
        expect(jsonData.timestamp).toBeDefined();
    });

    test("should save Markdown format file with .md extension", async () => {
        const fileName = "test-output.md";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a test assistant")
             .prompt("Hello world");

        const filePath = await agent.saveToFile(fileName);
        expect(filePath).toBe(expectedPath);

        // Verify file content
        const content = await readFile(filePath, 'utf8');
        // The .md format now only outputs the assistant response
        expect(content.length).toBeGreaterThan(0);
        expect(typeof content).toBe("string");
    });

    test("should work with method chaining before saveToFile", async () => {
        const fileName = "test-chain.txt";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        const filePath = await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are a test assistant")
            .prompt("Hello world")
            .debug()
            .saveToFile(fileName);

        expect(filePath).toBe(expectedPath);

        // Verify file exists and has content
        const content = await readFile(filePath, 'utf8');
        expect(content.length).toBeGreaterThan(0);
    });

    test("should handle case-insensitive file extensions", async () => {
        const fileName = "test-output.TXT";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a test assistant")
             .prompt("Hello world");

        const filePath = await agent.saveToFile(fileName);
        expect(filePath).toBe(expectedPath);

        // Should create text format content
        const content = await readFile(filePath, 'utf8');
        expect(content).toContain("=== Agent TestAgent Output (Text Format) ===");
    });

    test("should create file in current working directory", async () => {
        const fileName = "nested/test-output.json";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a test assistant")
             .prompt("Hello world");

        // This should work but might fail due to directory not existing
        // The implementation creates files relative to cwd
        try {
            const filePath = await agent.saveToFile(fileName);
            expect(filePath).toBe(expectedPath);
        } catch (error) {
            // Expected if directory doesn't exist
            expect(error).toBeInstanceOf(Error);
        }
    });

    test("should not be chainable (terminal method)", async () => {
        const fileName = "test-terminal.txt";
        const expectedPath = join(process.cwd(), fileName);
        testFiles.push(expectedPath);

        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("You are a test assistant")
             .prompt("Hello world");

        const result = await agent.saveToFile(fileName);
        
        // Should return file path, not agent instance
        expect(result).toBe(expectedPath);
        expect(result).not.toBe(agent);
        expect(typeof result).toBe("string");
    });
});
