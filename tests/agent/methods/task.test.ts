import { describe, expect, test, beforeEach } from "@jest/globals";
import { AgentForceAgent } from "../../../lib/agent";
import type { AgentConfig } from "../../../lib/types";

describe("AgentForceAgent task Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.task("Test task description");
        expect(result).toBe(agent);
    });

    test("should work with simple task description", () => {
        const result = agent.task("Analyze the data");
        expect(result).toBe(agent);
    });

    test("should work with detailed task description", () => {
        const result = agent.task("Fetch content from the URL and extract all the links, then save them to a file");
        expect(result).toBe(agent);
    });

    test("should support multiple tasks", () => {
        const result = agent
            .task("First task")
            .task("Second task")
            .task("Third task");
        expect(result).toBe(agent);
    });

    test("should work with various task types", () => {
        const result = agent
            .task("Fetch data from API")
            .task("Process the data")
            .task("Generate report")
            .task("Send email notification");
        expect(result).toBe(agent);
    });

    test("should support method chaining with other methods", () => {
        const result = agent
            .task("Main task")
            .systemPrompt("You are a task executor")
            .prompt("Execute the tasks")
            .debug()
            .useLLM("ollama", "gemma3:4b");
        expect(result).toBe(agent);
    });

    test("should handle task with whitespace", () => {
        const result = agent.task("  Task with leading and trailing spaces  ");
        expect(result).toBe(agent);
    });

    test("should work with multiline task description", () => {
        const multilineTask = `Process the user data:
        1. Validate the input
        2. Transform the data
        3. Store in database`;
        const result = agent.task(multilineTask);
        expect(result).toBe(agent);
    });

    test("should throw error for empty task description", () => {
        expect(() => agent.task("")).toThrow("Task description cannot be empty");
    });

    test("should throw error for whitespace-only task description", () => {
        expect(() => agent.task("   ")).toThrow("Task description cannot be empty");
        expect(() => agent.task("\t")).toThrow("Task description cannot be empty");
        expect(() => agent.task("\n")).toThrow("Task description cannot be empty");
    });

    test("should throw error for null or undefined task description", () => {
        expect(() => agent.task(null as any)).toThrow("Task description cannot be empty");
        expect(() => agent.task(undefined as any)).toThrow("Task description cannot be empty");
    });
});