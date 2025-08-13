import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../lib/agent";
import type { AgentConfig } from "../../lib/types";

// Import fs and path functions to mock them
import { readFileSync } from "fs";
import { resolve } from "path";
import Handlebars from "handlebars";

// Create typed mocks
const mockedReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockedResolve = resolve as jest.MockedFunction<typeof resolve>;
const mockedHandlebarsCompile = Handlebars.compile as jest.MockedFunction<typeof Handlebars.compile>;

describe("AgentForceAgent withTemplate Method Comprehensive Tests", () => {
    let agent: AgentForceAgent;
    
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
        
        // Clear all mocks before each test
        jest.clearAllMocks();
        
        // Setup default mock implementations
        mockedResolve.mockImplementation((path: string) => `/absolute/path/${path}`);
        mockedReadFileSync.mockReturnValue("Mock template content");
        
        // Mock Handlebars.compile to return a function that formats data
        mockedHandlebarsCompile.mockReturnValue((data: any) => `Compiled template with: ${JSON.stringify(data)}`);
    });

    // Basic functionality tests
    test("should return agent instance for method chaining", () => {
        const result = agent.withTemplate("template.txt");
        expect(result).toBe(agent);
    });

    test("should work with simple text template", () => {
        mockedReadFileSync.mockReturnValue("Simple text template");
        
        const result = agent.withTemplate("simple.txt");
        
        expect(mockedResolve).toHaveBeenCalledWith("simple.txt");
        expect(mockedReadFileSync).toHaveBeenCalledWith("/absolute/path/simple.txt", "utf-8");
        expect(result).toBe(agent);
    });

    // LINE 17 COVERAGE: Type validation error for non-string templatePath
    test("should throw error for non-string templatePath - null", () => {
        expect(() => agent.withTemplate(null as any)).toThrow("Template path must be a string");
    });

    test("should throw error for non-string templatePath - undefined", () => {
        expect(() => agent.withTemplate(undefined as any)).toThrow("Template path must be a string");
    });

    test("should throw error for non-string templatePath - number", () => {
        expect(() => agent.withTemplate(123 as any)).toThrow("Template path must be a string");
    });

    test("should throw error for non-string templatePath - object", () => {
        expect(() => agent.withTemplate({} as any)).toThrow("Template path must be a string");
    });

    test("should throw error for non-string templatePath - array", () => {
        expect(() => agent.withTemplate([] as any)).toThrow("Template path must be a string");
    });

    test("should throw error for non-string templatePath - boolean", () => {
        expect(() => agent.withTemplate(true as any)).toThrow("Template path must be a string");
    });

    // LINE 21 COVERAGE: Empty string validation error
    test("should throw error for empty string templatePath", () => {
        expect(() => agent.withTemplate("")).toThrow("Template path cannot be empty");
    });

    test("should throw error for whitespace-only templatePath", () => {
        expect(() => agent.withTemplate("   ")).toThrow("Template path cannot be empty");
    });

    test("should throw error for tab-only templatePath", () => {
        expect(() => agent.withTemplate("\t\t")).toThrow("Template path cannot be empty");
    });

    test("should throw error for newline-only templatePath", () => {
        expect(() => agent.withTemplate("\n\n")).toThrow("Template path cannot be empty");
    });

    test("should throw error for mixed whitespace templatePath", () => {
        expect(() => agent.withTemplate(" \t\n ")).toThrow("Template path cannot be empty");
    });

    // LINES 38-39 COVERAGE: Handlebars template compilation and rendering
    test("should compile and render .hbs template with templateData", () => {
        mockedReadFileSync.mockReturnValue("Hello {{name}}, you are {{role}}!");
        
        const templateData = { name: "Alice", role: "developer" };
        const result = agent.withTemplate("greeting.hbs", templateData);
        
        expect(mockedResolve).toHaveBeenCalledWith("greeting.hbs");
        expect(mockedReadFileSync).toHaveBeenCalledWith("/absolute/path/greeting.hbs", "utf-8");
        expect(mockedHandlebarsCompile).toHaveBeenCalledWith("Hello {{name}}, you are {{role}}!");
        expect(result).toBe(agent);
    });

    test("should handle .hbs template with complex templateData", () => {
        mockedReadFileSync.mockReturnValue("Complex template {{data.nested.value}}");
        
        const templateData = { 
            data: { 
                nested: { 
                    value: "test",
                    array: [1, 2, 3]
                }
            },
            timestamp: new Date().toISOString()
        };
        
        const result = agent.withTemplate("complex.hbs", templateData);
        
        expect(mockedHandlebarsCompile).toHaveBeenCalledWith("Complex template {{data.nested.value}}");
        expect(result).toBe(agent);
    });

    test("should handle .HBS extension (case-insensitive)", () => {
        mockedReadFileSync.mockReturnValue("Template {{value}}");
        
        const result = agent.withTemplate("uppercase.HBS", { value: "test" });
        
        expect(mockedHandlebarsCompile).toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    test("should handle .hbs template without templateData - no compilation", () => {
        mockedReadFileSync.mockReturnValue("Template without data {{value}}");
        
        const result = agent.withTemplate("no-data.hbs");
        
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(mockedHandlebarsCompile).not.toHaveBeenCalled(); // Should not compile without data
        expect(result).toBe(agent);
    });

    test("should handle .hbs template with empty templateData - no compilation", () => {
        mockedReadFileSync.mockReturnValue("Template with empty data {{value}}");
        
        const result = agent.withTemplate("empty-data.hbs", {});
        
        expect(mockedReadFileSync).toHaveBeenCalled();
        expect(mockedHandlebarsCompile).toHaveBeenCalledWith("Template with empty data {{value}}");
        expect(result).toBe(agent);
    });

    // Non-Handlebars templates should not be compiled
    test("should not compile non-.hbs template even with templateData", () => {
        mockedReadFileSync.mockReturnValue("Regular template {{value}}");
        
        const result = agent.withTemplate("regular.txt", { value: "test" });
        
        expect(mockedHandlebarsCompile).not.toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    // LINES 49-52 COVERAGE: Error handling scenarios
    test("should return agent instance when file read error occurs", () => {
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        mockedReadFileSync.mockImplementation(() => {
            throw new Error("File not found");
        });

        const result = agent.withTemplate("missing.txt");
        expect(result).toBe(agent);
        
        process.stderr.write = originalStderrWrite;
    });

    test("should return agent instance when permission denied error occurs", () => {
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        mockedReadFileSync.mockImplementation(() => {
            throw new Error("Permission denied");
        });

        const result = agent.withTemplate("protected.hbs");
        expect(result).toBe(agent);
        
        process.stderr.write = originalStderrWrite;
    });

    test("should return agent instance when path resolve error occurs", () => {
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        mockedResolve.mockImplementation(() => {
            throw new Error("Invalid path");
        });

        const result = agent.withTemplate("invalid-path.txt");
        expect(result).toBe(agent);
        
        process.stderr.write = originalStderrWrite;
    });

    test("should return agent instance when non-Error exception occurs", () => {
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        mockedReadFileSync.mockImplementation(() => {
            throw "Unknown error"; // Non-Error object
        });

        const result = agent.withTemplate("error.txt");
        expect(result).toBe(agent);
        
        process.stderr.write = originalStderrWrite;
    });

    test("should return agent instance when Handlebars compilation error occurs", () => {
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        mockedReadFileSync.mockReturnValue("Valid template content");
        mockedHandlebarsCompile.mockImplementation(() => {
            throw new Error("Handlebars compilation failed");
        });

        const result = agent.withTemplate("compile-error.hbs", { data: "test" });
        expect(result).toBe(agent);
        
        process.stderr.write = originalStderrWrite;
    });

    test("should return agent instance when Handlebars rendering error occurs", () => {
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        const mockCompiledTemplate = jest.fn().mockImplementation(() => {
            throw new Error("Rendering failed");
        }) as any;
        mockedHandlebarsCompile.mockReturnValue(mockCompiledTemplate);
        mockedReadFileSync.mockReturnValue("Template content");

        const result = agent.withTemplate("render-error.hbs", { data: "test" });
        expect(result).toBe(agent);
        
        process.stderr.write = originalStderrWrite;
    });

    // Integration and edge cases
    test("should work with method chaining", () => {
        mockedReadFileSync.mockReturnValue("Chainable template");

        const result = agent
            .debug()
            .systemPrompt("You are helpful")
            .withTemplate("chain.txt")
            .prompt("Hello")
            .useLLM("ollama", "gemma3:4b");

        expect(result).toBe(agent);
        expect(mockedReadFileSync).toHaveBeenCalled();
    });

    test("should handle complex file paths", () => {
        mockedReadFileSync.mockReturnValue("Complex path content");

        const result = agent.withTemplate("templates/prompts/system/advanced.hbs", { 
            role: "expert",
            domain: "AI"
        });

        expect(mockedResolve).toHaveBeenCalledWith("templates/prompts/system/advanced.hbs");
        expect(mockedHandlebarsCompile).toHaveBeenCalled();
        expect(result).toBe(agent);
    });

    test("should handle multiple withTemplate calls", () => {
        mockedReadFileSync.mockReturnValue("Template content");

        const result = agent
            .withTemplate("first.txt")
            .withTemplate("second.hbs", { data: "test" })
            .withTemplate("final.md");

        expect(result).toBe(agent);
        expect(mockedReadFileSync).toHaveBeenCalledTimes(3);
    });

    test("should work with different file extensions", () => {
        const testCases = [
            { path: "template.txt", expectCompile: false },
            { path: "template.md", expectCompile: false },
            { path: "template.json", expectCompile: false },
            { path: "template.hbs", expectCompile: true },
            { path: "template.HBS", expectCompile: true },
            { path: "template.handlebars", expectCompile: false }, // Only .hbs supported
        ];

        testCases.forEach(({ path, expectCompile }) => {
            jest.clearAllMocks();
            mockedReadFileSync.mockReturnValue("Template content {{value}}");

            agent.withTemplate(path, { value: "test" });

            if (expectCompile) {
                expect(mockedHandlebarsCompile).toHaveBeenCalled();
            } else {
                expect(mockedHandlebarsCompile).not.toHaveBeenCalled();
            }
        });
    });

    test("should preserve original template content for non-hbs files", () => {
        const templateContent = "Original content with {{placeholders}}";
        mockedReadFileSync.mockReturnValue(templateContent);

        const result = agent.withTemplate("plain.txt", { placeholders: "data" });

        expect(mockedHandlebarsCompile).not.toHaveBeenCalled();
        expect(result).toBe(agent);
    });
});