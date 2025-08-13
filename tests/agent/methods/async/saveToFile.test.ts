import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../../../lib/agent";
import type { AgentConfig } from "../../../../lib/types";

// Import the mocked modules so we can check calls
import { writeFile } from "fs/promises";
import { join, extname } from "path";

// Ensure the mocks are typed correctly
const mockedWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockedJoin = join as jest.MockedFunction<typeof join>;
const mockedExtname = extname as jest.MockedFunction<typeof extname>;

describe("AgentForceAgent saveToFile Method Tests - Fixed", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };
    let originalStderrWrite: typeof process.stderr.write;

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
        
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Mock process.stderr.write to suppress error output in tests
        originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        // Ensure the mocks return proper values
        mockedWriteFile.mockResolvedValue();
        mockedJoin.mockImplementation((...paths: string[]) => paths.join("/"));
        mockedExtname.mockImplementation((path: string) => {
            if (typeof path !== 'string') return '';
            const lastDot = path.lastIndexOf('.');
            if (lastDot === -1) return '';
            return path.substring(lastDot);
        });
    });

    afterEach(() => {
        // Restore original process.stderr.write
        process.stderr.write = originalStderrWrite;
    });

    test("should save to text file (.txt) and return file path", async () => {
        agent
            .systemPrompt("You are helpful")
            .prompt("What is JavaScript?")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.txt");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("test.txt");
    });

    test("should save to json file (.json) and return file path", async () => {
        agent
            .systemPrompt("You are an expert")
            .prompt("Explain TypeScript")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("response.json");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("response.json");
    });

    test("should save to markdown file (.md) and return file path", async () => {
        agent
            .systemPrompt("You are a writer")
            .prompt("Write a short story")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("story.md");
        
        expect(typeof result).toBe("string");
        expect(result).toContain("story.md");
    });

    test("should handle case-insensitive extensions - .TXT", async () => {
        agent
            .prompt("Test content")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("output.TXT");
        
        expect(result).toContain("output.TXT");
    });

    test("should handle case-insensitive extensions - .JSON", async () => {
        agent
            .prompt("Test content")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("data.JSON");
        
        expect(result).toContain("data.JSON");
    });

    test("should handle case-insensitive extensions - .MD", async () => {
        agent
            .prompt("Test content")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("readme.MD");
        
        expect(result).toContain("readme.MD");
    });

    test("should handle nested directory paths", async () => {
        agent
            .prompt("Test content")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("output/data/result.txt");
        
        expect(result).toContain("output/data/result.txt");
    });

    test("should work with method chaining", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are helpful")
            .prompt("Hello world")
            .useLLM("ollama", "gemma3:4b")
            .saveToFile("output.txt");

        expect(result).toContain("output.txt");
    });

    test("should work with tasks", async () => {
        const result = await agent
            .systemPrompt("You are a task executor")
            .task("First task")
            .task("Second task")
            .useLLM("ollama", "gemma3:4b")
            .saveToFile("tasks.json");

        expect(result).toContain("tasks.json");
    });

    test("should work with templates", async () => {
        const result = await agent
            .systemPrompt("You are a code reviewer")
            .withTemplate("review.md")
            .prompt("Review this code")
            .useLLM("ollama", "gemma3:4b")
            .saveToFile("review.md");

        expect(result).toContain("review.md");
    });

    test("should work with different providers", async () => {
        const result = await agent
            .prompt("Test prompt")
            .useLLM("openrouter", "anthropic/claude-3-haiku")
            .saveToFile("openrouter.txt");

        expect(result).toContain("openrouter.txt");
    });

    test("should work with google provider", async () => {
        const result = await agent
            .prompt("Test prompt") 
            .useLLM("google", "gemini-1.5-flash")
            .saveToFile("google.json");

        expect(result).toContain("google.json");
    });

    test("should work with tools configured", async () => {
        const agentWithTools = new AgentForceAgent({
            name: "ToolAgent",
            tools: ["web_fetch", "fs_write_file"]
        });

        const result = await agentWithTools
            .systemPrompt("You are a tool-using assistant")
            .prompt("Fetch and save data")
            .useLLM("ollama", "gemma3:4b")
            .saveToFile("tools.txt");

        expect(result).toContain("tools.txt");
    });

    test("should work with skills configured", async () => {
        const agentWithSkills = new AgentForceAgent({
            name: "SkillAgent",
            skills: ["product-owner.md"]
        });

        const result = await agentWithSkills
            .systemPrompt("You are skilled")
            .prompt("Create specification")
            .useLLM("ollama", "gemma3:4b")
            .saveToFile("skills.md");

        expect(result).toContain("skills.md");
    });

    test("should work with empty prompts", async () => {
        const result = await agent
            .systemPrompt("")
            .prompt("")
            .useLLM("ollama", "gemma3:4b")
            .saveToFile("empty.txt");

        expect(result).toContain("empty.txt");
    });

    test("should work with model configuration", async () => {
        const modelConfig = {
            temperature: 0.8,
            maxTokens: 2048
        };

        const result = await agent
            .useLLM("ollama", "gemma3:4b", modelConfig)
            .prompt("Creative story")
            .saveToFile("creative.md");

        expect(result).toContain("creative.md");
    });

    // Error handling tests - input validation still throws
    test("should throw error for empty filename", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.saveToFile("")).rejects.toThrow("Filename must be a non-empty string");
    });

    test("should throw error for null filename", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.saveToFile(null as any)).rejects.toThrow("Filename must be a non-empty string");
    });

    test("should throw error for undefined filename", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.saveToFile(undefined as any)).rejects.toThrow("Filename must be a non-empty string");
    });

    test("should throw error for non-string filename", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        await expect(agent.saveToFile(123 as any)).rejects.toThrow("Filename must be a non-empty string");
    });

    test("should return error message for unsupported extension - .pdf", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.pdf");
        expect(result).toBe("Error: Unsupported file extension: .pdf");
    });

    test("should return error message for unsupported extension - .html", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.html");
        expect(result).toBe("Error: Unsupported file extension: .html");
    });

    test("should return error message for unsupported extension - .xml", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.xml");
        expect(result).toBe("Error: Unsupported file extension: .xml");
    });

    test("should return error message for file without extension", async () => {
        agent.prompt("Test").useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("testfile");
        expect(result).toBe("Error: Unsupported file extension: ");
    });

    test("should execute successfully and call writeFile", async () => {
        const { writeFile } = require("fs/promises");
        
        agent
            .systemPrompt("Test system")
            .prompt("Test prompt")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.txt");

        expect(writeFile).toHaveBeenCalled();
        expect(result).toContain("test.txt");
    });

    test("should handle different file paths correctly", async () => {
        const testCases = [
            "simple.txt",
            "path/to/file.json", 
            "deep/nested/path/file.md",
            "file-with-dashes.txt",
            "file_with_underscores.json",
            "file123.md"
        ];

        for (const filePath of testCases) {
            agent.prompt("Test").useLLM("ollama", "gemma3:4b");
            const result = await agent.saveToFile(filePath);
            expect(result).toContain(filePath);
        }
    });

    // Test to cover line 92 - file write error handling
    test("should return error message when writeFile fails", async () => {
        const { writeFile } = require("fs/promises");
        
        // Mock writeFile to throw an error
        writeFile.mockRejectedValueOnce(new Error("Permission denied"));
        
        agent
            .systemPrompt("Test system")
            .prompt("Test prompt")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.txt");
        expect(result).toBe("Error: Failed to write file: Permission denied");
    });

    test("should handle non-Error exceptions in writeFile", async () => {
        const { writeFile } = require("fs/promises");
        
        // Mock writeFile to throw a non-Error
        writeFile.mockRejectedValueOnce("String error");
        
        agent
            .systemPrompt("Test system")
            .prompt("Test prompt")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.saveToFile("test.txt");
        expect(result).toBe("Error: Failed to write file: Unknown error");
    });


});