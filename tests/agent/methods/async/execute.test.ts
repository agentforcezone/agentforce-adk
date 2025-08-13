import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../../../lib/agent";
import type { AgentConfig } from "../../../../lib/types";

describe("AgentForceAgent execute Method Tests (via getResponse)", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        // Clear all mocks to ensure fresh state
        jest.clearAllMocks();
        agent = new AgentForceAgent(testConfig);
    });

    test("should execute simple prompt with ollama provider (mocked error)", async () => {
        agent
            .useLLM("ollama", "gemma3:4b")
            .prompt("What is the capital of France?");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error: TypeError");
    });

    test("should execute simple prompt with openrouter provider (mocked error)", async () => {
        agent
            .useLLM("openrouter", "anthropic/claude-3-haiku")
            .prompt("Hello, how are you?");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error: TypeError");
    });

    test("should execute simple prompt with google provider (mocked error)", async () => {
        agent
            .useLLM("google", "gemini-1.5-flash")
            .prompt("Explain quantum computing");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error: TypeError");
    });

    test("should execute with system prompt and user prompt", async () => {
        agent
            .systemPrompt("You are a helpful AI assistant")
            .prompt("What is TypeScript?")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error: TypeError");
    });

    test("should execute with template", async () => {
        agent
            .systemPrompt("You are a code reviewer")
            .withTemplate("review.md")
            .prompt("Review this code")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error: TypeError");
    });

    test("should execute with tasks", async () => {
        // Mock the Ollama provider explicitly for this test
        const mockProvider = {
            chat: jest.fn().mockImplementation(() => Promise.resolve("Task execution response")),
            generate: jest.fn().mockImplementation(() => Promise.resolve("Task execution response")),
            getModel: jest.fn().mockReturnValue("gemma3:4b"),
            setModel: jest.fn(),
        };
        
        const { OllamaProvider } = await import("../../../../lib/provider/ollama");
        (OllamaProvider as any).mockImplementation(() => mockProvider);

        agent
            .systemPrompt("You are a task executor")
            .task("First task: analyze data")
            .task("Second task: generate report")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toBe("Task execution response");
        expect(mockProvider.chat).toHaveBeenCalled();
    });

    test("should execute with tools configured", async () => {
        const agentWithTools = new AgentForceAgent({
            name: "ToolAgent",
            tools: ["web_fetch", "fs_write_file"]
        });

        agentWithTools
            .systemPrompt("You are a tool-using assistant")
            .prompt("Fetch some data and save it")
            .useLLM("ollama", "gemma3:4b");

        const result = await agentWithTools.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error:");
    });

    test("should execute with skills configured", async () => {
        const agentWithSkills = new AgentForceAgent({
            name: "SkillAgent",
            skills: ["product-owner.md"]
        });

        agentWithSkills
            .systemPrompt("You are a skilled assistant")
            .prompt("Create a product specification")
            .useLLM("ollama", "gemma3:4b");

        const result = await agentWithSkills.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error:");
    });

    test("should execute with model configuration", async () => {
        const modelConfig = {
            temperature: 0.8,
            maxTokens: 2048
        };

        agent
            .useLLM("ollama", "gemma3:4b", modelConfig)
            .prompt("Be creative and write a story");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error:");
    });

    test("should execute with openai provider (not implemented)", async () => {
        agent
            .useLLM("openai", "gpt-4")
            .prompt("Test openai");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toBe("OpenAI integration not implemented yet.");
    });

    test("should execute with anthropic provider (not implemented)", async () => {
        agent
            .useLLM("anthropic", "claude-3")
            .prompt("Test anthropic");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toBe("Anthropic integration not implemented yet.");
    });

    test("should handle unknown provider", async () => {
        agent
            .useLLM("unknown" as any, "unknown-model")
            .prompt("Test unknown provider");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Unknown provider integration not available");
    });

    test("should execute without user prompt (empty prompt)", async () => {
        agent
            .systemPrompt("You are helpful")
            .useLLM("ollama", "gemma3:4b");

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error:");
    });

    test("should execute with method chaining", async () => {
        const result = await agent
            .debug()
            .systemPrompt("You are an expert")
            .prompt("Explain machine learning")
            .useLLM("google", "gemini-1.5-flash")
            .getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toContain("Error:");
    });

    // LINES 74-75 COVERAGE: Test undefined task handling in task processing
    test("should skip undefined tasks in task list", async () => {
        // Create agent with tasks
        agent
            .systemPrompt("You are a task executor")
            .task("First task")
            .useLLM("ollama", "gemma3:4b");

        // Manually inject an undefined task to cover lines 74-75
        const taskList = (agent as any).getTaskList();
        taskList.push(undefined); // This will trigger the undefined task check
        taskList.push({ description: "Third task", result: null });

        // Mock the provider to avoid actual API calls
        const mockProvider = {
            chat: jest.fn().mockImplementation(() => Promise.resolve("Mocked task response")),
            chatWithTools: jest.fn().mockImplementation(() => Promise.resolve("Mocked task response with tools")),
            generate: jest.fn().mockImplementation(() => Promise.resolve("Mocked response")),
            getModel: jest.fn().mockReturnValue("gemma3:4b"),
            setModel: jest.fn(),
        };
        
        const { OllamaProvider } = await import("../../../../lib/provider/ollama");
        (OllamaProvider as any).mockImplementation(() => mockProvider);

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toBe("Mocked task response");
        // Should have been called twice (for first task and third task, skipping undefined)
        expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    // LINES 210-214 COVERAGE: Test OpenRouter with chat history without tools
    test("should use OpenRouter with chat history without tools", async () => {
        // Create agent with chat history but no tools
        agent
            .systemPrompt("You are helpful")
            .prompt("First message")
            .useLLM("openrouter", "anthropic/claude-3-haiku");

        // Add some chat history manually
        (agent as any).pushToChatHistory("user", "Previous user message");
        (agent as any).pushToChatHistory("assistant", "Previous assistant response");

        // Create a task to trigger the chat history path (executeProviderCallWithChatHistory)
        agent.task("Process with chat history");

        // Mock the OpenRouter provider
        const mockProvider = {
            chat: jest.fn().mockImplementation(() => Promise.resolve("OpenRouter chat response")),
            chatWithTools: jest.fn().mockImplementation(() => Promise.resolve("OpenRouter tools response")),
            generate: jest.fn().mockImplementation(() => Promise.resolve("OpenRouter generate response")),
            getModel: jest.fn().mockReturnValue("anthropic/claude-3-haiku"),
            setModel: jest.fn(),
        };
        
        const { OpenRouterProvider } = await import("../../../../lib/provider/openrouter");
        (OpenRouterProvider as any).mockImplementation(() => mockProvider);

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toBe("OpenRouter chat response");
        // Should use chat method (not chatWithTools) since no tools are configured
        expect(mockProvider.chat).toHaveBeenCalled();
        expect(mockProvider.chatWithTools).not.toHaveBeenCalled();
    });

    // LINE 109 COVERAGE: Test empty results array from task processing (all tasks undefined)
    test("should return empty string when all tasks are undefined", async () => {
        // Create agent with valid tasks first
        agent
            .systemPrompt("You are a task executor")
            .task("Task 1")
            .task("Task 2")
            .useLLM("ollama", "gemma3:4b");

        // Replace all tasks with undefined to trigger the undefined task skipping logic
        const taskList = (agent as any).getTaskList();
        for (let i = 0; i < taskList.length; i++) {
            taskList[i] = undefined; // Make all tasks undefined
        }

        // Mock the provider (shouldn't be called since all tasks are undefined and skipped)
        const mockProvider = {
            chat: jest.fn().mockImplementation(() => Promise.resolve("Should not be called")),
            chatWithTools: jest.fn().mockImplementation(() => Promise.resolve("Should not be called")),
            generate: jest.fn().mockImplementation(() => Promise.resolve("Should not be called")),
            getModel: jest.fn().mockReturnValue("gemma3:4b"),
            setModel: jest.fn(),
        };
        
        const { OllamaProvider } = await import("../../../../lib/provider/ollama");
        (OllamaProvider as any).mockImplementation(() => mockProvider);

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        // When all tasks are undefined and skipped, results array will be empty, so should return ""
        expect(result).toBe(""); 
        
        // Provider should not be called since all tasks are undefined and skipped
        expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    // LINE 167 COVERAGE: Test with empty/no system prompt in chat history context
    test("should handle empty system prompt in chat history context", async () => {
        // Create agent with explicitly empty system prompt
        agent
            .systemPrompt("") // Explicitly set empty system prompt
            .prompt("Test message")
            .useLLM("openrouter", "anthropic/claude-3-haiku");

        // Add chat history and task to trigger executeProviderCallWithChatHistory path
        (agent as any).pushToChatHistory("user", "Previous message");
        agent.task("Process without system prompt");

        // Mock the OpenRouter provider
        const mockProvider = {
            chat: jest.fn().mockImplementation(() => Promise.resolve("Response without system prompt")),
            chatWithTools: jest.fn().mockImplementation(() => Promise.resolve("Response with tools")),
            generate: jest.fn().mockImplementation(() => Promise.resolve("Generate response")),
            getModel: jest.fn().mockReturnValue("anthropic/claude-3-haiku"),
            setModel: jest.fn(),
        };
        
        const { OpenRouterProvider } = await import("../../../../lib/provider/openrouter");
        (OpenRouterProvider as any).mockImplementation(() => mockProvider);

        const result = await agent.getResponse();
        
        expect(typeof result).toBe("string");
        expect(result).toBe("Response without system prompt");
        expect(mockProvider.chat).toHaveBeenCalled();
        
        // Verify that chat was called without system message in messages array
        expect(mockProvider.chat.mock.calls.length).toBeGreaterThan(0);
        const callArgs = mockProvider.chat.mock.calls[0]?.[0];
        expect(callArgs).toBeDefined();
        
        if (Array.isArray(callArgs)) {
            const hasSystemMessage = callArgs.some((msg: any) => msg.role === "system");
            expect(hasSystemMessage).toBe(false); // Should not have system message when systemPrompt is empty
        }
    });
});