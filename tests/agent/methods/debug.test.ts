import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../../lib/agent";
import type { AgentConfig, AgentForceLogger } from "../../../lib/types";

describe("AgentForceAgent debug Method Tests", () => {
    let agent: AgentForceAgent;
    let mockLogger: AgentForceLogger;
    
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Create agent instance
        agent = new AgentForceAgent(testConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.debug();
        expect(result).toBe(agent);
    });

    test("should log debug information with basic agent configuration", () => {
        // Override the getLogger method to return our mock
        (agent as any).getLogger = () => mockLogger;

        agent.debug();

        expect(mockLogger.debug).toHaveBeenCalledTimes(1);
        expect(mockLogger.debug).toHaveBeenCalledWith({
            name: "TestAgent",
            provider: "ollama",  // default provider
            model: "gemma3:4b",  // default model
            tools: [],
            systemPrompt: "You are an AI agent created by AgentForceZone. You can perform various tasks based on the methods provided.",
            template: "",
            prompt: ""
        }, "AgentForce Debug");
    });

    test("should work with method chaining", () => {
        (agent as any).getLogger = () => mockLogger;

        const result = agent
            .debug()
            .prompt("test")
            .debug();
        
        expect(result).toBe(agent);
        expect(mockLogger.debug).toHaveBeenCalledTimes(2);
    });

    test("should log debug information with configured LLM provider and model", () => {
        (agent as any).getLogger = () => mockLogger;

        agent
            .useLLM("google", "gemini-1.5-flash")
            .debug();

        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "TestAgent",
                provider: "google",
                model: "gemini-1.5-flash"
            }),
            "AgentForce Debug"
        );
    });

    test("should log debug information with system prompt", () => {
        (agent as any).getLogger = () => mockLogger;

        agent
            .systemPrompt("You are a helpful AI assistant")
            .debug();

        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                systemPrompt: "You are a helpful AI assistant"
            }),
            "AgentForce Debug"
        );
    });

    test("should log debug information with user prompt", () => {
        (agent as any).getLogger = () => mockLogger;

        agent
            .prompt("What is the capital of France?")
            .debug();

        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: "What is the capital of France?"
            }),
            "AgentForce Debug"
        );
    });

    test("should log debug information with tools configured", () => {
        (agent as any).getLogger = () => mockLogger;

        const agentWithTools = new AgentForceAgent({
            name: "ToolAgent",
            tools: ["web_fetch", "fs_write_file", "api_fetch"]
        });
        (agentWithTools as any).getLogger = () => mockLogger;

        agentWithTools.debug();

        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "ToolAgent",
                tools: ["web_fetch", "fs_write_file", "api_fetch"]
            }),
            "AgentForce Debug"
        );
    });

    test("should log complete debug information with all configurations", () => {
        (agent as any).getLogger = () => mockLogger;

        agent
            .useLLM("openrouter", "anthropic/claude-3-haiku")
            .systemPrompt("You are a professional code reviewer")
            .prompt("Review this TypeScript code")
            .debug();

        expect(mockLogger.debug).toHaveBeenCalledWith({
            name: "TestAgent",
            provider: "openrouter",
            model: "anthropic/claude-3-haiku",
            tools: [],
            systemPrompt: "You are a professional code reviewer",
            template: "",
            prompt: "Review this TypeScript code"
        }, "AgentForce Debug");
    });

    test("should handle agent with skills configured", () => {
        const agentWithSkills = new AgentForceAgent({
            name: "SkillAgent",
            skills: ["product-owner.md", "developer.md"]
        });
        (agentWithSkills as any).getLogger = () => mockLogger;

        agentWithSkills.debug();

        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "SkillAgent",
                tools: [], // Skills don't affect tools array directly
                systemPrompt: "You are an AI agent created by AgentForceZone. You can perform various tasks based on the methods provided.",
                template: "",
                prompt: ""
            }),
            "AgentForce Debug"
        );
    });

    test("should log debug information multiple times with changing state", () => {
        (agent as any).getLogger = () => mockLogger;

        // First debug call
        agent.debug();
        
        // Modify agent state
        agent
            .useLLM("google", "gemini-1.5-pro")
            .systemPrompt("Updated system prompt")
            .prompt("Updated user prompt");

        // Second debug call should show updated state
        agent.debug();

        expect(mockLogger.debug).toHaveBeenCalledTimes(2);
        
        // Check first call
        const firstCall = (mockLogger.debug as jest.MockedFunction<any>).mock.calls[0];
        expect(firstCall[0]).toEqual({
            name: "TestAgent",
            provider: "ollama",
            model: "gemma3:4b",
            tools: [],
            systemPrompt: "You are an AI agent created by AgentForceZone. You can perform various tasks based on the methods provided.",
            template: "",
            prompt: ""
        });

        // Check second call with updated state
        const secondCall = (mockLogger.debug as jest.MockedFunction<any>).mock.calls[1];
        expect(secondCall[0]).toEqual({
            name: "TestAgent",
            provider: "google",
            model: "gemini-1.5-pro",
            tools: [],
            systemPrompt: "Updated system prompt",
            template: "",
            prompt: "Updated user prompt"
        });
    });

    test("should handle custom logger from agent configuration", () => {
        const customLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        const agentWithCustomLogger = new AgentForceAgent({
            name: "CustomLoggerAgent",
            logger: customLogger
        });

        agentWithCustomLogger.debug();

        expect(customLogger.debug).toHaveBeenCalledTimes(1);
        expect(customLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "CustomLoggerAgent"
            }),
            "AgentForce Debug"
        );
    });

    test("should call logger.debug exactly once per debug call", () => {
        (agent as any).getLogger = () => mockLogger;

        agent.debug();
        agent.debug();
        agent.debug();

        expect(mockLogger.debug).toHaveBeenCalledTimes(3);
    });

    test("should handle complex workflow with debug calls between operations", () => {
        (agent as any).getLogger = () => mockLogger;

        const result = agent
            .debug() // Initial state
            .useLLM("openrouter", "meta-llama/llama-2-7b-chat")
            .debug() // After LLM config
            .systemPrompt("You are a data analyst")
            .debug() // After system prompt
            .prompt("Analyze this dataset")
            .debug(); // Final state

        expect(result).toBe(agent);
        expect(mockLogger.debug).toHaveBeenCalledTimes(4);
        
        // Verify progression of states
        const calls = (mockLogger.debug as jest.MockedFunction<any>).mock.calls;
        
        // Initial state
        expect(calls[0][0]).toEqual(expect.objectContaining({
            provider: "ollama",
            model: "gemma3:4b",
            systemPrompt: "You are an AI agent created by AgentForceZone. You can perform various tasks based on the methods provided.",
            prompt: ""
        }));

        // After LLM config
        expect(calls[1][0]).toEqual(expect.objectContaining({
            provider: "openrouter",
            model: "meta-llama/llama-2-7b-chat",
            systemPrompt: "You are an AI agent created by AgentForceZone. You can perform various tasks based on the methods provided.",
            prompt: ""
        }));

        // After system prompt
        expect(calls[2][0]).toEqual(expect.objectContaining({
            provider: "openrouter",
            model: "meta-llama/llama-2-7b-chat",
            systemPrompt: "You are a data analyst",
            prompt: ""
        }));

        // Final state
        expect(calls[3][0]).toEqual(expect.objectContaining({
            provider: "openrouter",
            model: "meta-llama/llama-2-7b-chat",
            systemPrompt: "You are a data analyst",
            prompt: "Analyze this dataset"
        }));
    });

    test("should include template field in debug output even when empty", () => {
        (agent as any).getLogger = () => mockLogger;

        agent.debug();

        expect(mockLogger.debug).toHaveBeenCalledWith(
            expect.objectContaining({
                template: ""
            }),
            "AgentForce Debug"
        );
    });

    test("should preserve all debug info properties", () => {
        (agent as any).getLogger = () => mockLogger;

        agent
            .useLLM("google", "gemini-1.5-flash")
            .systemPrompt("Test system")
            .prompt("Test prompt")
            .debug();

        const debugCall = (mockLogger.debug as jest.MockedFunction<any>).mock.calls[0];
        const debugInfo = debugCall[0];

        // Verify all expected properties are present
        expect(debugInfo).toHaveProperty('name');
        expect(debugInfo).toHaveProperty('provider');
        expect(debugInfo).toHaveProperty('model');
        expect(debugInfo).toHaveProperty('tools');
        expect(debugInfo).toHaveProperty('systemPrompt');
        expect(debugInfo).toHaveProperty('template');
        expect(debugInfo).toHaveProperty('prompt');
        
        // Verify correct values
        expect(debugInfo.name).toBe("TestAgent");
        expect(debugInfo.provider).toBe("google");
        expect(debugInfo.model).toBe("gemini-1.5-flash");
        expect(debugInfo.tools).toEqual([]);
        expect(debugInfo.systemPrompt).toBe("Test system");
        expect(debugInfo.template).toBe("");
        expect(debugInfo.prompt).toBe("Test prompt");
        
        // Verify the debug label
        expect(debugCall[1]).toBe("AgentForce Debug");
    });

    test("should work in method chains without breaking flow", () => {
        (agent as any).getLogger = () => mockLogger;

        // Test that debug doesn't break the method chain flow
        expect(() => {
            agent
                .useLLM("ollama", "llama2")
                .debug()
                .systemPrompt("Chain test")
                .debug()
                .prompt("Chain prompt")
                .debug();
        }).not.toThrow();

        expect(mockLogger.debug).toHaveBeenCalledTimes(3);
    });
});