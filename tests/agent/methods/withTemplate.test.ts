import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../../lib/agent";
import type { AgentConfig } from "../../../lib/types";

describe("AgentForceAgent withTemplate Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.withTemplate("test.md");
        expect(result).toBe(agent);
    });

    test("should work with markdown template", () => {
        const result = agent.withTemplate("template.md");
        expect(result).toBe(agent);
    });

    test("should work with text template", () => {
        const result = agent.withTemplate("template.txt");
        expect(result).toBe(agent);
    });

    test("should work with handlebars template without data", () => {
        const result = agent.withTemplate("template.hbs");
        expect(result).toBe(agent);
    });

    test("should support method chaining", () => {
        const result = agent
            .withTemplate("test.md")
            .systemPrompt("test system")
            .prompt("test prompt")
            .debug();
        expect(result).toBe(agent);
    });

    test("should work with relative paths", () => {
        const result = agent.withTemplate("./templates/agent.md");
        expect(result).toBe(agent);
    });

    test("should work with absolute paths", () => {
        const result = agent.withTemplate("/path/to/template.md");
        expect(result).toBe(agent);
    });

    test("should work with different file extensions", () => {
        const result = agent
            .withTemplate("system.txt")
            .withTemplate("user.md")
            .withTemplate("config.json");
        expect(result).toBe(agent);
    });

    // Error handling tests
    test("should throw error for non-string template path", () => {
        expect(() => agent.withTemplate(123 as any)).toThrow("Template path must be a string");
        expect(() => agent.withTemplate(null as any)).toThrow("Template path must be a string");
        expect(() => agent.withTemplate(undefined as any)).toThrow("Template path must be a string");
    });

    test("should throw error for empty template path", () => {
        expect(() => agent.withTemplate("")).toThrow("Template path cannot be empty");
        expect(() => agent.withTemplate("   ")).toThrow("Template path cannot be empty");
    });

    test("should return agent instance when file read fails", () => {
        // Mock stderr to suppress error output
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        const result = agent.withTemplate("/nonexistent/file/that/does/not/exist.md");
        expect(result).toBe(agent);
        
        // Restore stderr
        process.stderr.write = originalStderrWrite;
    });

    test("should continue chaining when file read fails", () => {
        // Mock stderr to suppress error output
        const originalStderrWrite = process.stderr.write;
        process.stderr.write = jest.fn(() => true) as any;
        
        const result = agent
            .withTemplate("/nonexistent/file/that/does/not/exist.md")
            .prompt("test");
        expect(result).toBe(agent);
        
        // Restore stderr
        process.stderr.write = originalStderrWrite;
    });
});