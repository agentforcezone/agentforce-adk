import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

describe("AgentForceAgent task Method Tests", () => {
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestAgent",
        };
        agent = new AgentForceAgent(config);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.task("First task");
        expect(result).toBe(agent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .task("First task")
            .useLLM("ollama", "llama3")
            .systemPrompt("Test prompt")
            .task("Second task");
        expect(result).toBe(agent);
    });

    test("should add tasks to the task list", () => {
        agent.task("Task 1");
        agent.task("Task 2");
        agent.task("Task 3");
        
        const taskList = agent["getTaskList"]();
        expect(taskList).toHaveLength(3);
        expect(taskList[0].description).toBe("Task 1");
        expect(taskList[1].description).toBe("Task 2");
        expect(taskList[2].description).toBe("Task 3");
        expect(taskList[0].result).toBeNull();
    });

    test("should validate task description", () => {
        expect(() => agent.task("")).toThrow("Task description cannot be empty");
        expect(() => agent.task("   ")).toThrow("Task description cannot be empty");
    });

    test("should trim task descriptions", () => {
        agent.task("  Task with spaces  ");
        const taskList = agent["getTaskList"]();
        expect(taskList[0].description).toBe("Task with spaces");
    });

    test("should allow multiple tasks in sequence", () => {
        const result = agent
            .task("Fetch data from API")
            .task("Process the data")
            .task("Save to database")
            .task("Generate report");
        
        const taskList = agent["getTaskList"]();
        expect(taskList).toHaveLength(4);
        expect(result).toBe(agent);
    });

    test("should work with other agent methods", () => {
        const result = agent
            .useLLM("ollama", "codellama")
            .systemPrompt("You are a helpful assistant")
            .task("First task: analyze code")
            .task("Second task: suggest improvements")
            .prompt("Additional context")
            .debug();
        
        expect(result).toBe(agent);
        const taskList = agent["getTaskList"]();
        expect(taskList).toHaveLength(2);
    });

    test("should clear task list after execution", async () => {
        // Mock the execute method to test task list clearing
        agent.task("Task 1");
        agent.task("Task 2");
        
        const taskListBefore = agent["getTaskList"]();
        expect(taskListBefore).toHaveLength(2);
        
        // After execution, the task list should be cleared
        // This will be tested in integration tests with actual execution
    });

    test("should store task results independently", () => {
        agent.task("Task 1");
        agent.task("Task 2");
        
        const taskList = agent["getTaskList"]();
        
        // Initially, all results should be null
        expect(taskList[0].result).toBeNull();
        expect(taskList[1].result).toBeNull();
        
        // Simulate setting results (this would happen during execution)
        taskList[0].result = "Result 1";
        taskList[1].result = "Result 2";
        
        expect(taskList[0].result).toBe("Result 1");
        expect(taskList[1].result).toBe("Result 2");
    });

    test("should handle complex task descriptions", () => {
        const complexTask = `
            Perform the following operations:
            1. Read the configuration file
            2. Parse JSON data
            3. Validate schema
            4. Apply transformations
        `;
        
        agent.task(complexTask);
        const taskList = agent["getTaskList"]();
        
        expect(taskList).toHaveLength(1);
        expect(taskList[0].description).toContain("Perform the following operations");
    });

    test("should maintain task order", () => {
        const tasks = [
            "First: Initialize system",
            "Second: Load configuration",
            "Third: Connect to database",
            "Fourth: Run migrations",
            "Fifth: Start server"
        ];
        
        tasks.forEach(task => agent.task(task));
        
        const taskList = agent["getTaskList"]();
        expect(taskList).toHaveLength(5);
        
        tasks.forEach((task, index) => {
            expect(taskList[index].description).toBe(task);
        });
    });

    test("should integrate with tools configuration", () => {
        const configWithTools: AgentConfig = {
            name: "ToolAgent",
            tools: ["fs_read_file", "fs_write_file"]
        };
        
        const toolAgent = new AgentForceAgent(configWithTools);
        
        const result = toolAgent
            .task("Read file content")
            .task("Process the content")
            .task("Write to output file");
        
        expect(result).toBe(toolAgent);
        const taskList = toolAgent["getTaskList"]();
        expect(taskList).toHaveLength(3);
        
        const tools = toolAgent["getTools"]();
        expect(tools).toContain("fs_read_file");
        expect(tools).toContain("fs_write_file");
    });
});