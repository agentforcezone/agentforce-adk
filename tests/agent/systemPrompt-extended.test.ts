import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../lib/agent";
import type { AgentConfig } from "../../lib/types";

// Import fs functions to mock them
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

// Create typed mocks
const mockedExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockedReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockedResolve = resolve as jest.MockedFunction<typeof resolve>;

describe("AgentForceAgent systemPrompt Method Comprehensive Tests", () => {
    let agent: AgentForceAgent;
    let consoleWarnSpy: any;
    
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
        
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Mock console.warn to check warning messages
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        // Setup default mock implementations
        mockedResolve.mockImplementation((base, path) => `${base}/${path}`);
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Mock file content");
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    // Basic functionality tests (already covered but ensuring consistency)
    test("should return agent instance for method chaining", () => {
        const result = agent.systemPrompt("You are helpful");
        expect(result).toBe(agent);
    });

    test("should work with simple text prompt", () => {
        const result = agent.systemPrompt("You are a helpful AI assistant");
        expect(result).toBe(agent);
    });

    // LINE 14 COVERAGE: Type validation error
    test("should throw error for non-string input - null", () => {
        expect(() => agent.systemPrompt(null as any)).toThrow("System prompt must be a string");
    });

    test("should throw error for non-string input - undefined", () => {
        expect(() => agent.systemPrompt(undefined as any)).toThrow("System prompt must be a string");
    });

    test("should throw error for non-string input - number", () => {
        expect(() => agent.systemPrompt(123 as any)).toThrow("System prompt must be a string");
    });

    test("should throw error for non-string input - object", () => {
        expect(() => agent.systemPrompt({} as any)).toThrow("System prompt must be a string");
    });

    test("should throw error for non-string input - array", () => {
        expect(() => agent.systemPrompt([] as any)).toThrow("System prompt must be a string");
    });

    test("should throw error for non-string input - boolean", () => {
        expect(() => agent.systemPrompt(true as any)).toThrow("System prompt must be a string");
    });

    // LINES 23-30 COVERAGE: Successful file reading
    test("should read .md file when file exists", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Content from MD file");

        const result = agent.systemPrompt("system-prompt.md");

        expect(mockedResolve).toHaveBeenCalledWith(process.cwd(), "system-prompt.md");
        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalledWith(expect.any(String), "utf-8");
        expect(result).toBe(agent);
    });

    test("should read .txt file when file exists", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Content from TXT file");

        const result = agent.systemPrompt("system-prompt.txt");

        expect(mockedResolve).toHaveBeenCalledWith(process.cwd(), "system-prompt.txt");
        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalledWith(expect.any(String), "utf-8");
        expect(result).toBe(agent);
    });

    test("should read .hbs file when file exists", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Content from HBS file");

        const result = agent.systemPrompt("system-prompt.hbs");

        expect(mockedResolve).toHaveBeenCalledWith(process.cwd(), "system-prompt.hbs");
        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalledWith(expect.any(String), "utf-8");
        expect(result).toBe(agent);
    });

    test("should handle case-insensitive file extensions - .MD", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Content from MD file");

        const result = agent.systemPrompt("system-prompt.MD");

        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    test("should handle case-insensitive file extensions - .TXT", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Content from TXT file");

        const result = agent.systemPrompt("system-prompt.TXT");

        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    test("should handle case-insensitive file extensions - .HBS", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Content from HBS file");

        const result = agent.systemPrompt("system-prompt.HBS");

        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    // LINES 31-34 COVERAGE: File not found scenario
    test("should handle file not found - use prompt as text and warn", () => {
        mockedExistsSync.mockReturnValue(false);

        const result = agent.systemPrompt("nonexistent-file.md");

        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith("Warning: File 'nonexistent-file.md' not found, treating as regular prompt text");
        expect(result).toBe(agent);
    });

    test("should handle file not found with different extensions", () => {
        mockedExistsSync.mockReturnValue(false);

        agent.systemPrompt("missing.txt");
        expect(consoleWarnSpy).toHaveBeenCalledWith("Warning: File 'missing.txt' not found, treating as regular prompt text");

        agent.systemPrompt("missing.hbs");
        expect(consoleWarnSpy).toHaveBeenCalledWith("Warning: File 'missing.hbs' not found, treating as regular prompt text");
    });

    // LINES 35-37 COVERAGE: File read error scenario
    test("should handle file read error - use prompt as text and warn", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockImplementation(() => {
            throw new Error("Permission denied");
        });

        const result = agent.systemPrompt("error-file.md");

        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith("Warning: Failed to read file 'error-file.md': Permission denied. Treating as regular prompt text.");
        expect(result).toBe(agent);
    });

    test("should handle file read error with unknown error type", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockImplementation(() => {
            throw "Unknown error";  // Non-Error object
        });

        const result = agent.systemPrompt("error-file.txt");

        expect(consoleWarnSpy).toHaveBeenCalledWith("Warning: Failed to read file 'error-file.txt': Unknown error. Treating as regular prompt text.");
        expect(result).toBe(agent);
    });

    test("should handle resolve path error", () => {
        mockedResolve.mockImplementation(() => {
            throw new Error("Path resolution failed");
        });

        const result = agent.systemPrompt("some-file.md");

        expect(consoleWarnSpy).toHaveBeenCalledWith("Warning: Failed to read file 'some-file.md': Path resolution failed. Treating as regular prompt text.");
        expect(result).toBe(agent);
    });

    // Edge cases and integration tests
    test("should not treat regular text as file path", () => {
        const result = agent.systemPrompt("You are helpful and nice");

        expect(mockedExistsSync).not.toHaveBeenCalled();
        expect(mockedReadFileSync).not.toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    test("should not treat text with non-supported extensions as file path", () => {
        const result = agent.systemPrompt("image.png");

        expect(mockedExistsSync).not.toHaveBeenCalled();
        expect(mockedReadFileSync).not.toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    test("should handle empty string", () => {
        const result = agent.systemPrompt("");

        expect(result).toBe(agent);
    });

    test("should handle whitespace-only string", () => {
        const result = agent.systemPrompt("   ");

        expect(result).toBe(agent);
    });

    test("should work with method chaining", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("File content");

        const result = agent
            .systemPrompt("system.md")
            .prompt("Hello")
            .debug()
            .useLLM("ollama", "gemma3:4b");

        expect(result).toBe(agent);
        expect(mockedReadFileSync).toHaveBeenCalled();
    });

    test("should handle multiple systemPrompt calls", () => {
        const result = agent
            .systemPrompt("First prompt")
            .systemPrompt("Second prompt")
            .systemPrompt("final.md");

        expect(result).toBe(agent);
        expect(mockedExistsSync).toHaveBeenCalledTimes(1); // Only for the last call
    });

    test("should work with complex file paths", () => {
        mockedExistsSync.mockReturnValue(true);
        mockedReadFileSync.mockReturnValue("Complex file content");

        const result = agent.systemPrompt("prompts/system/advanced-agent.md");

        expect(mockedResolve).toHaveBeenCalledWith(process.cwd(), "prompts/system/advanced-agent.md");
        expect(mockedExistsSync).toHaveBeenCalled();
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(result).toBe(agent);
    });
});