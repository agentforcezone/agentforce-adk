import {describe, expect, test, beforeEach, afterEach} from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

import { MockOllamaProvider } from '../mocks/MockOllamaProvider';

const agentConfig: AgentConfig = {
    name: "TestAgent"
};

// Test-specific run method that uses MockOllamaProvider for testing
async function testRun(this: AgentForceAgent): Promise<AgentForceAgent> {
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();

    // Store the user prompt in chat history
    this.pushToChatHistory('user', userPrompt);

    try {
        let response: string;

        switch (provider.toLowerCase()) {
            case "ollama":
                const ollamaProvider = new MockOllamaProvider(model);
                response = await ollamaProvider.generate(userPrompt, systemPrompt);
                break;
            default:
                response = `Mock response for ${provider}`;
                break;
        }

        // Store the response in chat history
        this.pushToChatHistory('assistant', response);

    } catch (error) {
        // In case of error, store error message
        this.pushToChatHistory('assistant', `Error: ${error}`);
    }

    return this;
}

describe('AgentForceAgent Class Test', () => {
    test("Constructing a new agent", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test that the agent was created successfully
        expect(agent).toBeInstanceOf(AgentForceAgent);
        
        // Test that the agent has the expected methods
        expect(typeof agent.useLLM).toBe("function");
        expect(typeof agent.debug).toBe("function");
        expect(typeof agent.serve).toBe("function");
        expect(typeof agent.systemPrompt).toBe("function");
    });

    test("Agent methods should be chainable", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test method chaining
        const result = agent.useLLM("ollama", "gemma3:4b");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("Agent should support complex method chaining", () => {
        const agent = new AgentForceAgent(agentConfig);
        
        // Test complex method chaining
        const result = agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .debug();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });
});

describe('AgentForceAgent Chat History Tests', () => {
    let agent: AgentForceAgent;
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
        // Replace the run method with our test version
        agent.run = testRun.bind(agent);
        
        // Suppress console output during tests
        console.log = () => {};
        console.error = () => {};
    });

    afterEach(() => {
        // Restore original console methods
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    test("should initialize with empty chat history", () => {
        const agent = new AgentForceAgent(agentConfig);
        // Access chat history through a method we know exists
        const history = (agent as any).getChatHistory();
        expect(history).toEqual([]);
    });

    test("should track user prompt in chat history when run() is called", async () => {
        await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are helpful")
            .prompt("Hello, how are you?")
            .run();

        const history = (agent as any).getChatHistory();
        expect(history.length).toBeGreaterThanOrEqual(1);
        expect(history[0]).toEqual({
            role: 'user',
            content: 'Hello, how are you?'
        });
    });

    test("should track assistant response in chat history when run() is called", async () => {
        await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are helpful")
            .prompt("Tell me a joke")
            .run();

        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(2);
        
        // Check user message
        expect(history[0]).toEqual({
            role: 'user',
            content: 'Tell me a joke'
        });
        
        // Check assistant response
        expect(history[1].role).toBe('assistant');
        expect(history[1].content).toBeTruthy();
        expect(typeof history[1].content).toBe('string');
    });

    test("should track multiple conversation turns", async () => {
        // First conversation
        await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are helpful")
            .prompt("Hello")
            .run();

        // Second conversation
        await agent
            .prompt("How are you?")
            .run();

        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(4);
        
        // First turn
        expect(history[0]).toEqual({ role: 'user', content: 'Hello' });
        expect(history[1].role).toBe('assistant');
        
        // Second turn
        expect(history[2]).toEqual({ role: 'user', content: 'How are you?' });
        expect(history[3].role).toBe('assistant');
    });

    test("should track chat history for different providers", async () => {
        // Test with Ollama
        await agent
            .useLLM("ollama", "gemma3:4b")
            .prompt("Test message 1")
            .run();

        // Test with OpenAI (mocked)
        await agent
            .useLLM("openai", "gpt-4")
            .prompt("Test message 2")
            .run();

        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(4);
        
        expect(history[0]).toEqual({ role: 'user', content: 'Test message 1' });
        expect(history[1].role).toBe('assistant');
        expect(history[2]).toEqual({ role: 'user', content: 'Test message 2' });
        expect(history[3].role).toBe('assistant');
    });

    test("should maintain chat history through method chaining", async () => {
        const result = await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are a test assistant")
            .prompt("Chain test message")
            .run()
            .then(agent => agent.debug());

        expect(result).toBe(agent);
        
        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(2);
        expect(history[0]).toEqual({ role: 'user', content: 'Chain test message' });
        expect(history[1].role).toBe('assistant');
    });

    test("should track empty prompts in chat history", async () => {
        await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("")
            .prompt("")
            .run();

        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(2);
        expect(history[0]).toEqual({ role: 'user', content: '' });
        expect(history[1].role).toBe('assistant');
    });

    test("should handle chat history with long prompts", async () => {
        const longPrompt = "This is a very long prompt that contains multiple sentences and should be stored correctly in the chat history. ".repeat(10);
        
        await agent
            .useLLM("ollama", "gemma3:4b")
            .prompt(longPrompt)
            .run();

        const history = (agent as any).getChatHistory();
        expect(history[0]).toEqual({ role: 'user', content: longPrompt });
    });

    test("should preserve chat history object structure", async () => {
        await agent
            .useLLM("ollama", "gemma3:4b")
            .prompt("Structure test")
            .run();

        const history = (agent as any).getChatHistory();
        
        // Verify each entry has the correct structure
        history.forEach((entry: any) => {
            expect(entry).toHaveProperty('role');
            expect(entry).toHaveProperty('content');
            expect(typeof entry.role).toBe('string');
            expect(typeof entry.content).toBe('string');
            expect(['user', 'assistant'].includes(entry.role)).toBe(true);
        });
    });

    test("pushToChatHistory should work correctly when called directly", () => {
        // Test the protected method directly (for internal testing)
        (agent as any).pushToChatHistory('user', 'Direct test message');
        (agent as any).pushToChatHistory('assistant', 'Direct test response');

        const history = (agent as any).getChatHistory();
        expect(history.length).toBe(2);
        expect(history[0]).toEqual({ role: 'user', content: 'Direct test message' });
        expect(history[1]).toEqual({ role: 'assistant', content: 'Direct test response' });
    });

    test("should handle special characters in chat history", async () => {
        const specialPrompt = "Hello! 🤖 Can you help with this? @#$%^&*()_+ 日本語 émojis";
        
        await agent
            .useLLM("ollama", "gemma3:4b")
            .prompt(specialPrompt)
            .run();

        const history = (agent as any).getChatHistory();
        expect(history[0]).toEqual({ role: 'user', content: specialPrompt });
    });
});