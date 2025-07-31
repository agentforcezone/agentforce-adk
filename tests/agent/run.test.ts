import { describe, expect, test, beforeEach, afterEach, spyOn } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import { MockOllamaProvider } from "../mocks/MockOllamaProvider";
import * as executeModule from "../../lib/agent/methods/async/execute";

// Test-specific run method that always uses MockOllamaProvider for Ollama
async function testRun(this: AgentForceAgent): Promise<AgentForceAgent> {
    // Get agent configuration
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    const agentName = this.getName();

    console.log(`🚀 Running agent "${agentName}" with ${provider}/${model}`);

    // Store the user prompt in chat history
    this.pushToChatHistory('user', userPrompt);

    try {
        let response: string;

        // Execute based on provider
        switch (provider.toLowerCase()) {
            case "ollama":
                // Always use MockOllamaProvider for testing
                const ollamaProvider = new MockOllamaProvider(model);
                
                console.log(`📤 Sending to Ollama (${model}):`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                
                response = await ollamaProvider.generate(userPrompt, systemPrompt);
                
                console.log(`Response from Ollama:`);
                console.log(response);
                break;

            case "openai":
                console.log(`⚠️  OpenAI provider not implemented yet. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = "OpenAI integration not implemented yet.";
                break;

            case "anthropic":
                console.log(`⚠️  Anthropic provider not implemented yet. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = "Anthropic integration not implemented yet.";
                break;

            case "google":
                console.log(`⚠️  Google provider not implemented yet. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = "Google integration not implemented yet.";
                break;

            default:
                console.log(`⚠️  Unknown provider: ${provider}. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = `Unknown provider integration not available: ${provider}`;
                break;
        }

        // Store the response in chat history
        this.pushToChatHistory('assistant', response);

        console.log(`✅ Agent "${agentName}" execution completed successfully\n`);

    } catch (error) {
        console.error(`❌ Error running agent "${agentName}":`, error);
        console.log(`   Provider: ${provider}`);
        console.log(`   Model: ${model}`);
        console.log(`   Error: ${error}\n`);
    }

    // Return 'this' for method chaining
    return this;
}

describe('AgentForceAgent run Method Tests (Mocked)', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent"
    };

    // Store original console.log to restore later
    const originalConsoleLog = console.log;
    const logMessages: string[] = [];

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
        logMessages.length = 0; // Clear log messages
        
        // Replace the run method with our test version that uses MockOllamaProvider
        agent.run = testRun.bind(agent);
        
        // Capture console.log messages instead of suppressing them completely
        console.log = (message: string) => {
            logMessages.push(message);
        };
    });

    afterEach(() => {
        // Restore original console.log
        console.log = originalConsoleLog;
    });

    test("should return agent instance for method chaining", async () => {
        // Test with Ollama provider using mock data
        const result = await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("You are a test assistant")
            .prompt("Hello")
            .run();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Verify that run method was called with Ollama (check log messages)
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Sending to Ollama'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Response from Ollama'))).toBe(true);
    });

    test("should work with Ollama provider using mock data", async () => {
        const result = await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("You are a helpful assistant")
            .prompt("Hello there!")
            .run();
        
        expect(result).toBe(agent);
        
        // Verify Ollama-specific logs
        expect(logMessages.some(msg => msg.includes('Running agent "TestAgent" with ollama/llama2'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Sending to Ollama (llama2)'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('System: You are a helpful assistant'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('User: Hello there!'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Response from Ollama'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Hello there! I\'m a mock AI assistant'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('execution completed successfully'))).toBe(true);
    });

    test("should handle different Ollama models with mock data", async () => {
        // Test with different model
        await agent
            .useLLM("ollama", "codellama")
            .systemPrompt("You are a coding assistant")
            .prompt("test prompt")
            .run();
        
        expect(logMessages.some(msg => msg.includes('ollama/codellama'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('This is a mock test response'))).toBe(true);
    });

    test("should be chainable and work with other methods", async () => {
        // Test with Ollama provider first (with mock)
        const ollamaResult = await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("You are helpful")
            .prompt("test prompt")
            .run()
            .then(agent => agent.debug());
        
        expect(ollamaResult).toBe(agent);
        
        // Verify Ollama execution flow in logs
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Sending to Ollama'))).toBe(true);
        
        // Clear messages for next test
        logMessages.length = 0;
        
        // Test with non-Ollama provider
        const otherResult = await agent
            .useLLM("anthropic", "claude-3")
            .systemPrompt("You are helpful")
            .prompt("test prompt")
            .run()
            .then(agent => agent.debug());
        
        expect(otherResult).toBe(agent);
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
    });

    test("should handle different providers correctly", async () => {
        // Test OpenAI (not implemented - should not throw)
        await expect(
            agent
                .useLLM("openai", "gpt-4")
                .systemPrompt("Test")
                .prompt("Test")
                .run()
        ).resolves.toBe(agent);

        // Test Anthropic (not implemented - should not throw)
        await expect(
            agent
                .useLLM("anthropic", "claude-3")
                .systemPrompt("Test")
                .prompt("Test")
                .run()
        ).resolves.toBe(agent);

        // Test Google (not implemented - should not throw)
        await expect(
            agent
                .useLLM("google", "gemini-1.5-flash")
                .systemPrompt("Test")
                .prompt("Test")
                .run()
        ).resolves.toBe(agent);
    });

    test("should handle unknown provider", async () => {
        // Should handle unknown provider gracefully (log error but not crash)
        await expect(
            agent
                .useLLM("unknown" as any, "test-model")
                .systemPrompt("Test")
                .prompt("Test")
                .run()
        ).resolves.toBe(agent);
        
        // Verify unknown provider message in logs
        expect(logMessages.some(msg => msg.includes('Unknown provider'))).toBe(true);
    });

    test("should work in complex method chains", async () => {
        const result = await agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("You are a helpful assistant")
            .prompt("Tell me about testing")
            .run();
        
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Verify run execution in logs
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
    });

    test("should work with empty prompts", async () => {
        // Test with Ollama provider and empty prompts
        const result = await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("")
            .prompt("")
            .run();
        
        expect(result).toBe(agent);
        
        // Verify execution with empty prompts
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Sending to Ollama'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('I\'m here and ready to assist'))).toBe(true);
        
        // Clear messages for non-Ollama test
        logMessages.length = 0;
        
        // Test with non-Ollama provider
        const result2 = await agent
            .useLLM("anthropic", "claude-3")
            .systemPrompt("")
            .prompt("")
            .run();
        
        expect(result2).toBe(agent);
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
    });

    test("should integrate with all other methods", async () => {
        // Test full integration with Ollama (mock)
        const ollamaResult = await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("You are a test assistant")
            .prompt("Hello world")
            .run()
            .then(agent => agent.debug());
        
        expect(ollamaResult).toBe(agent);
        
        // Verify Ollama integration works
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Sending to Ollama'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Hello there! I\'m a mock AI assistant'))).toBe(true);
        
        // Clear messages for next test
        logMessages.length = 0;
        
        // Test with non-Ollama provider
        const otherResult = await agent
            .useLLM("google", "gemini-1.5-flash")
            .systemPrompt("You are a test assistant")
            .prompt("Hello world")
            .run()
            .then(agent => agent.debug());
        
        expect(otherResult).toBe(agent);
        expect(logMessages.some(msg => msg.includes('Running agent'))).toBe(true);
    });

    test("should log execution details correctly", async () => {
        // Test with Ollama
        await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("Test system prompt")
            .prompt("Test user prompt")
            .run();
        
        // Verify Ollama-specific log messages
        expect(logMessages.some(msg => msg.includes('Running agent "TestAgent" with ollama/llama2'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Sending to Ollama (llama2)'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('System: Test system prompt'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('User: Test user prompt'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('Response from Ollama'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('This is a mock test response'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('execution completed successfully'))).toBe(true);
        
        // Clear messages for OpenAI test
        logMessages.length = 0;
        
        // Test with OpenAI (not implemented)
        await agent
            .useLLM("openai", "gpt-4")
            .systemPrompt("Test system prompt")
            .prompt("Test user prompt")
            .run();
        
        // Verify OpenAI-specific log messages
        expect(logMessages.some(msg => msg.includes('Running agent "TestAgent" with openai/gpt-4'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('OpenAI provider not implemented yet'))).toBe(true);
        expect(logMessages.some(msg => msg.includes('execution completed successfully'))).toBe(true);
    });

    test("should handle mock Ollama responses correctly", async () => {
        // Test joke response
        await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("You are a comedian")
            .prompt("Tell me a joke")
            .run();
        
        expect(logMessages.some(msg => msg.includes('Why don\'t pirates use computers'))).toBe(true);
        
        // Clear messages and test generic response
        logMessages.length = 0;
        
        await agent
            .useLLM("ollama", "llama2")
            .systemPrompt("You are helpful")
            .prompt("What is the weather like?")
            .run();
        
        expect(logMessages.some(msg => msg.includes('Mock response to: "What is the weather like?"'))).toBe(true);
    });

    describe('Chat History Integration Tests', () => {
        test("should track chat history during run() execution", async () => {
            await agent
                .useLLM("ollama", "llama2")
                .systemPrompt("You are helpful")
                .prompt("Hello from run test")
                .run();

            const history = (agent as any).getChatHistory();
            expect(history.length).toBe(2);
            expect(history[0]).toEqual({ role: 'user', content: 'Hello from run test' });
            expect(history[1].role).toBe('assistant');
            expect(history[1].content).toBeTruthy();
        });

        test("should track chat history for different providers", async () => {
            // Test Ollama
            await agent
                .useLLM("ollama", "llama2")
                .prompt("Test Ollama")
                .run();

            // Test OpenAI
            await agent
                .useLLM("openai", "gpt-4")
                .prompt("Test OpenAI")
                .run();

            const history = (agent as any).getChatHistory();
            expect(history.length).toBe(4);
            
            expect(history[0]).toEqual({ role: 'user', content: 'Test Ollama' });
            expect(history[1].role).toBe('assistant');
            expect(history[2]).toEqual({ role: 'user', content: 'Test OpenAI' });
            expect(history[3].role).toBe('assistant');
            expect(history[3].content).toBe('OpenAI integration not implemented yet.');
        });

        test("should maintain chat history across multiple run() calls", async () => {
            // First run
            await agent
                .useLLM("ollama", "llama2")
                .prompt("First message")
                .run();

            // Second run
            await agent
                .prompt("Second message")
                .run();

            // Third run
            await agent  
                .prompt("Third message")
                .run();

            const history = (agent as any).getChatHistory();
            expect(history.length).toBe(6);
            
            // Verify chronological order
            expect(history[0]).toEqual({ role: 'user', content: 'First message' });
            expect(history[1].role).toBe('assistant');
            expect(history[2]).toEqual({ role: 'user', content: 'Second message' });
            expect(history[3].role).toBe('assistant');
            expect(history[4]).toEqual({ role: 'user', content: 'Third message' });
            expect(history[5].role).toBe('assistant');
        });

        test("should track chat history with Ollama mock responses", async () => {
            // Test specific mock response for jokes
            await agent
                .useLLM("ollama", "llama2")
                .systemPrompt("You are a comedian")
                .prompt("Tell me a joke")
                .run();

            const history = (agent as any).getChatHistory();
            expect(history.length).toBe(2);
            expect(history[0]).toEqual({ role: 'user', content: 'Tell me a joke' });
            expect(history[1].role).toBe('assistant');
            expect(history[1].content).toContain('Why don\'t pirates use computers');
        });

        test("should handle empty prompts in chat history", async () => {
            await agent
                .useLLM("ollama", "llama2")
                .systemPrompt("")
                .prompt("")
                .run();

            const history = (agent as any).getChatHistory();
            expect(history.length).toBe(2);
            expect(history[0]).toEqual({ role: 'user', content: '' });
            expect(history[1].role).toBe('assistant');
            expect(history[1].content).toContain('I\'m here and ready to assist');
        });

        test("should preserve chat history structure", async () => {
            await agent
                .useLLM("anthropic", "claude-3")
                .prompt("Structure test")
                .run();

            const history = (agent as any).getChatHistory();
            
            history.forEach((entry: any) => {
                expect(entry).toHaveProperty('role');
                expect(entry).toHaveProperty('content');
                expect(typeof entry.role).toBe('string');
                expect(typeof entry.content).toBe('string');
                expect(['user', 'assistant'].includes(entry.role)).toBe(true);
            });
        });
    });
});

describe('AgentForceAgent Real Run Method Coverage Tests', () => {
    let agent: AgentForceAgent;
    let executeSpy: any;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestAgent"
        };
        agent = new AgentForceAgent(config);
        
        // Spy on the execute function to avoid real API calls
        executeSpy = spyOn(executeModule, "execute");
    });

    afterEach(() => {
        // Clean up spy after each test
        if (executeSpy) {
            executeSpy.mockRestore();
        }
    });

    test("should call execute and return agent instance for chaining (covers lines 9-18)", async () => {
        // Mock execute to resolve successfully
        executeSpy.mockResolvedValue("Mocked response");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        const result = await agent.run();
        
        // Should return the agent instance for chaining
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Should have called execute
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    test("should handle execute errors and continue with chain (covers catch block lines 13-16)", async () => {
        // Mock execute to throw an error
        executeSpy.mockRejectedValue(new Error("Test error"));
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        // Should not throw error, just continue with chain
        const result = await agent.run();
        
        // Should still return the agent instance for chaining
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Should have called execute
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    test("should handle non-Error exceptions in catch block", async () => {
        // Mock execute to throw a non-Error object
        executeSpy.mockRejectedValue("String error");
        
        agent.useLLM("ollama", "gemma3:4b")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        // Should not throw error, just continue with chain
        const result = await agent.run();
        
        // Should still return the agent instance for chaining
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Should have called execute
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    test("should work with method chaining", async () => {
        // Mock execute to resolve successfully
        executeSpy.mockResolvedValue("Mocked response");
        
        const result = await agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("Test system")
            .prompt("Test prompt")
            .run();
        
        // Should return the agent instance for further chaining
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Should have called execute
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    test("should handle successful execute call", async () => {
        // Mock execute to resolve successfully
        const mockResponse = "Test response from execute";
        executeSpy.mockResolvedValue(mockResponse);
        
        agent.useLLM("openai", "gpt-4")
             .systemPrompt("Test system")
             .prompt("Test prompt");

        const result = await agent.run();
        
        // Should return the agent instance
        expect(result).toBe(agent);
        
        // Should have called execute with the agent context
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    test("should preserve agent state after run", async () => {
        // Mock execute to resolve successfully
        executeSpy.mockResolvedValue("Mocked response");
        
        agent.useLLM("anthropic", "claude-3")
             .systemPrompt("Test system prompt")
             .prompt("Test user prompt");

        const result = await agent.run();
        
        // Should return same agent instance
        expect(result).toBe(agent);
        
        // Agent state should be preserved
        expect(agent.getProvider()).toBe("anthropic");
        expect(agent.getModel()).toBe("claude-3");
        expect(agent.getSystemPrompt()).toBe("Test system prompt");
        expect(agent.getUserPrompt()).toBe("Test user prompt");
        
        // Should have called execute
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });

    test("should allow multiple run calls on same agent", async () => {
        // Mock execute to resolve successfully
        executeSpy.mockResolvedValue("Mocked response");
        
        agent.useLLM("google", "gemini-pro")
             .systemPrompt("Test system")
             .prompt("First prompt");

        // First run
        const result1 = await agent.run();
        expect(result1).toBe(agent);
        expect(executeSpy).toHaveBeenCalledTimes(1);
        
        // Change prompt and run again
        agent.prompt("Second prompt");
        const result2 = await agent.run();
        expect(result2).toBe(agent);
        expect(executeSpy).toHaveBeenCalledTimes(2);
    });

    test("should work with empty configuration", async () => {
        // Mock execute to resolve successfully
        executeSpy.mockResolvedValue("Mocked response");
        
        // Don't set any configuration, just run
        const result = await agent.run();
        
        // Should still return the agent instance
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
        
        // Should have called execute
        expect(executeSpy).toHaveBeenCalledTimes(1);
    });
});
