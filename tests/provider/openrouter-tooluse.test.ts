import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { OpenRouterToolUse } from "../../lib/provider/openrouter-tooluse";
import type { Tool, ModelConfig } from "../../lib/types";

// Mock the OpenAI client
const mockOpenAI = {
    chat: {
        completions: {
            create: mock()
        }
    }
};

// Mock the OpenAI constructor
mock.module("openai", () => ({
    default: mock(() => mockOpenAI)
}));

// Mock the executeTool function
const mockExecuteTool = mock();
mock.module("../../lib/agent/functions/tools", () => ({
    executeTool: mockExecuteTool
}));

describe("OpenRouterToolUse Tests", () => {
    let toolUse: OpenRouterToolUse;
    let mockLogger: any;
    const testModel = "openai/gpt-oss-20b:free";
    const testModelConfig: ModelConfig = {
        temperature: 0.7,
        maxTokens: 4096,
        maxToolRounds: 5,
        appendToolResults: false
    };

    const testTools: Tool[] = [
        {
            type: "function",
            function: {
                name: "test_tool",
                description: "A test tool for unit testing",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "Test query parameter"
                        }
                    },
                    required: ["query"]
                }
            }
        }
    ];

    beforeEach(() => {
        // Set up environment variables
        process.env.OPENROUTER_API_KEY = "test-api-key";
        
        // Create mock logger
        mockLogger = {
            debug: mock(),
            info: mock(),
            warn: mock(),
            error: mock()
        };

        // Reset mocks
        mockOpenAI.chat.completions.create.mockReset();
        mockExecuteTool.mockReset();

        // Create tool use instance
        toolUse = new OpenRouterToolUse(testModel, testModelConfig);
    });

    afterEach(() => {
        delete process.env.OPENROUTER_API_KEY;
    });

    test("should create OpenRouterToolUse instance with correct configuration", () => {
        expect(toolUse).toBeInstanceOf(OpenRouterToolUse);
    });

    test("should throw error when OPENROUTER_API_KEY is missing", () => {
        delete process.env.OPENROUTER_API_KEY;
        
        expect(() => {
            new OpenRouterToolUse(testModel, testModelConfig);
        }).toThrow("OPENROUTER_API_KEY environment variable is required");
    });

    test("should convert tools to OpenAI format correctly", () => {
        // This tests the private method indirectly through generateWithTools
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: "Test response without tools",
                    tool_calls: null
                },
                finish_reason: "stop"
            }]
        });

        toolUse.generateWithTools("Test prompt", testTools, "Test system", mockLogger);

        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
            expect.objectContaining({
                model: testModel,
                tools: expect.arrayContaining([
                    expect.objectContaining({
                        type: "function",
                        function: expect.objectContaining({
                            name: "test_tool",
                            description: "A test tool for unit testing"
                        })
                    })
                ])
            })
        );
    });

    test("should handle generateWithTools without tool calls", async () => {
        const testResponse = "This is a test response without tool calls";
        
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: testResponse,
                    tool_calls: null
                },
                finish_reason: "stop"
            }]
        });

        const result = await toolUse.generateWithTools(
            "Test prompt", 
            testTools, 
            "Test system", 
            mockLogger
        );

        expect(result).toBe(testResponse);
        expect(mockLogger.debug).toHaveBeenCalled();
        expect(mockExecuteTool).not.toHaveBeenCalled();
    });

    test("should handle generateWithTools with successful tool calls", async () => {
        const toolCallId = "call_123";
        const toolResult = { success: true, data: "Tool result" };
        const finalResponse = "Final response after tool execution";

        // First call returns tool call
        mockOpenAI.chat.completions.create
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: toolCallId,
                            type: "function",
                            function: {
                                name: "test_tool",
                                arguments: JSON.stringify({ query: "test query" })
                            }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            // Second call returns final response
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: finalResponse,
                        tool_calls: null
                    },
                    finish_reason: "stop"
                }]
            });

        mockExecuteTool.mockResolvedValueOnce(toolResult);

        const result = await toolUse.generateWithTools(
            "Test prompt", 
            testTools, 
            "Test system", 
            mockLogger
        );

        expect(result).toBe(finalResponse);
        expect(mockExecuteTool).toHaveBeenCalledWith("test_tool", { query: "test query" });
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2);
    });

    test("should handle generateWithTools with tool execution errors", async () => {
        const toolCallId = "call_123";
        const toolError = new Error("Tool execution failed");
        const finalResponse = "Final response after tool error";

        // First call returns tool call
        mockOpenAI.chat.completions.create
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: toolCallId,
                            type: "function",
                            function: {
                                name: "test_tool",
                                arguments: JSON.stringify({ query: "test query" })
                            }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            // Second call returns final response
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: finalResponse,
                        tool_calls: null
                    },
                    finish_reason: "stop"
                }]
            });

        mockExecuteTool.mockRejectedValueOnce(toolError);

        const result = await toolUse.generateWithTools(
            "Test prompt", 
            testTools, 
            "Test system", 
            mockLogger
        );

        expect(result).toBe(finalResponse);
        expect(mockLogger.error).toHaveBeenCalledWith(
            "Tool execution failed",
            expect.objectContaining({
                error: toolError.message
            })
        );
    });

    test("should handle chatWithTools without tool calls", async () => {
        const testMessages = [
            { role: "user", content: "Hello" }
        ];
        const testResponse = "Hello! How can I help you?";
        
        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: testResponse,
                    tool_calls: null
                },
                finish_reason: "stop"
            }]
        });

        const result = await toolUse.chatWithTools(testMessages, testTools, mockLogger);

        expect(result).toBe(testResponse);
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
            expect.objectContaining({
                model: testModel,
                messages: expect.arrayContaining([
                    expect.objectContaining({
                        role: "user",
                        content: "Hello"
                    })
                ]),
                tools: expect.any(Array)
            })
        );
    });

    test("should handle chatWithTools with tool calls", async () => {
        const testMessages = [
            { role: "user", content: "Use the test tool" }
        ];
        const toolCallId = "call_456";
        const toolResult = { success: true, data: "Chat tool result" };
        const finalResponse = "Tool executed successfully in chat";

        mockOpenAI.chat.completions.create
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: toolCallId,
                            type: "function",
                            function: {
                                name: "test_tool",
                                arguments: JSON.stringify({ query: "chat query" })
                            }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: finalResponse,
                        tool_calls: null
                    },
                    finish_reason: "stop"
                }]
            });

        mockExecuteTool.mockResolvedValueOnce(toolResult);

        const result = await toolUse.chatWithTools(testMessages, testTools, mockLogger);

        expect(result).toBe(finalResponse);
        expect(mockExecuteTool).toHaveBeenCalledWith("test_tool", { query: "chat query" });
    });

    test("should respect maxToolRounds configuration", async () => {
        const limitedModelConfig: ModelConfig = {
            ...testModelConfig,
            maxToolRounds: 1
        };
        
        const limitedToolUse = new OpenRouterToolUse(testModel, limitedModelConfig);

        // Mock continuous tool calls that would exceed the limit
        mockOpenAI.chat.completions.create.mockResolvedValue({
            choices: [{
                message: {
                    content: null,
                    tool_calls: [{
                        id: "call_123",
                        type: "function",
                        function: {
                            name: "test_tool",
                            arguments: JSON.stringify({ query: "endless" })
                        }
                    }]
                },
                finish_reason: "tool_calls"
            }]
        });

        mockExecuteTool.mockResolvedValue({ success: true });

        await limitedToolUse.generateWithTools(
            "Test prompt", 
            testTools, 
            "Test system", 
            mockLogger
        );

        // Should only call once due to maxToolRounds limit
        expect(mockOpenAI.chat.completions.create).toHaveBeenCalledTimes(2); // 1 + 1 fallback
    });

    test("should handle appendToolResults configuration", async () => {
        const appendConfig: ModelConfig = {
            ...testModelConfig,
            appendToolResults: true
        };
        
        const appendToolUse = new OpenRouterToolUse(testModel, appendConfig);
        
        const toolResult = { success: true, data: "Appended result" };
        const finalResponse = "Final response";

        mockOpenAI.chat.completions.create
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: "call_123",
                            type: "function",
                            function: {
                                name: "test_tool",
                                arguments: JSON.stringify({ query: "append test" })
                            }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: finalResponse,
                        tool_calls: null
                    },
                    finish_reason: "stop"
                }]
            });

        mockExecuteTool.mockResolvedValueOnce(toolResult);

        const result = await appendToolUse.generateWithTools(
            "Test prompt", 
            testTools, 
            "Test system", 
            mockLogger
        );

        expect(result).toContain(finalResponse);
        expect(result).toContain("Raw tool results:");
        expect(result).toContain("test_tool");
    });

    test("should handle OpenRouter API errors", async () => {
        const apiError = new Error("OpenRouter API rate limit exceeded");
        
        mockOpenAI.chat.completions.create.mockRejectedValueOnce(apiError);

        await expect(
            toolUse.generateWithTools("Test prompt", testTools, "Test system", mockLogger)
        ).rejects.toThrow("OpenRouter provider error");
    });
});