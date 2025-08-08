import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { OpenRouterToolUse } from "../../lib/provider/openrouter-tooluse";
import type { ModelConfig } from "../../lib/types";

// Mock the OpenAI client
const mockOpenAI = {
    chat: {
        completions: {
            create: mock()
        }
    }
};

mock.module("openai", () => ({
    default: mock(() => mockOpenAI)
}));

// Mock the executeTool function
const mockExecuteTool = mock();
mock.module("../../lib/agent/functions/tools", () => ({
    executeTool: mockExecuteTool
}));

describe("Request Delay Functionality Tests", () => {
    let mockLogger: any;
    const testModel = "openai/gpt-4o-mini";

    beforeEach(() => {
        process.env.OPENROUTER_API_KEY = "test-api-key";
        
        mockLogger = {
            debug: mock(),
            info: mock(),
            warn: mock(),
            error: mock()
        };

        mockOpenAI.chat.completions.create.mockReset();
        mockExecuteTool.mockReset();
    });

    afterEach(() => {
        delete process.env.OPENROUTER_API_KEY;
    });

    test("should apply request delay when configured", async () => {
        const modelConfig: ModelConfig = {
            requestDelay: 1, // 1 second delay
            maxToolRounds: 2
        };

        const toolUse = new OpenRouterToolUse(testModel, modelConfig);

        // Mock multiple tool calls to trigger delay
        mockOpenAI.chat.completions.create
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: "call_1",
                            type: "function",
                            function: {
                                name: "test_tool",
                                arguments: JSON.stringify({ query: "test" })
                            }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: "Final response",
                        tool_calls: null
                    },
                    finish_reason: "stop"
                }]
            });

        mockExecuteTool.mockResolvedValue({ success: true });

        const startTime = Date.now();
        
        await toolUse.generateWithTools(
            "Test prompt", 
            [{
                type: "function",
                function: {
                    name: "test_tool",
                    description: "Test tool",
                    parameters: {
                        type: "object",
                        properties: {
                            query: { type: "string" }
                        },
                        required: ["query"]
                    }
                }
            }], 
            "Test system", 
            mockLogger
        );

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Should take at least 1 second due to delay
        expect(executionTime).toBeGreaterThan(950); // Allow some margin for execution time

        // Should log the delay
        expect(mockLogger.debug).toHaveBeenCalledWith(
            "Applying request delay",
            expect.objectContaining({
                delaySeconds: 1,
                delayMs: 1000,
                provider: "openrouter",
                model: testModel
            })
        );
    });

    test("should not apply delay when requestDelay is 0", async () => {
        const modelConfig: ModelConfig = {
            requestDelay: 0, // No delay
            maxToolRounds: 2
        };

        const toolUse = new OpenRouterToolUse(testModel, modelConfig);

        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: "Quick response",
                    tool_calls: null
                },
                finish_reason: "stop"
            }]
        });

        const startTime = Date.now();
        
        await toolUse.generateWithTools(
            "Test prompt", 
            [], 
            "Test system", 
            mockLogger
        );

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Should be fast (under 100ms for mocked response)
        expect(executionTime).toBeLessThan(100);

        // Should not log any delay
        expect(mockLogger.debug).not.toHaveBeenCalledWith(
            "Applying request delay",
            expect.any(Object)
        );
    });

    test("should not apply delay when requestDelay is undefined", async () => {
        const modelConfig: ModelConfig = {
            // requestDelay not specified
            maxToolRounds: 1
        };

        const toolUse = new OpenRouterToolUse(testModel, modelConfig);

        mockOpenAI.chat.completions.create.mockResolvedValueOnce({
            choices: [{
                message: {
                    content: "Quick response",
                    tool_calls: null
                },
                finish_reason: "stop"
            }]
        });

        await toolUse.generateWithTools("Test prompt", [], "Test system", mockLogger);

        // Should not log any delay
        expect(mockLogger.debug).not.toHaveBeenCalledWith(
            "Applying request delay",
            expect.any(Object)
        );
    });

    test("should skip delay on first API call but apply on subsequent calls", async () => {
        const modelConfig: ModelConfig = {
            requestDelay: 0.5, // 0.5 second delay
            maxToolRounds: 3
        };

        const toolUse = new OpenRouterToolUse(testModel, modelConfig);

        // Mock 3 rounds of tool calls
        mockOpenAI.chat.completions.create
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: "call_1",
                            type: "function",
                            function: { name: "test_tool", arguments: "{}" }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: null,
                        tool_calls: [{
                            id: "call_2", 
                            type: "function",
                            function: { name: "test_tool", arguments: "{}" }
                        }]
                    },
                    finish_reason: "tool_calls"
                }]
            })
            .mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: "Final response",
                        tool_calls: null
                    },
                    finish_reason: "stop"
                }]
            });

        mockExecuteTool.mockResolvedValue({ success: true });

        await toolUse.generateWithTools(
            "Test prompt",
            [{
                type: "function",
                function: {
                    name: "test_tool", 
                    description: "Test tool",
                    parameters: { type: "object", properties: {} }
                }
            }],
            "Test system",
            mockLogger
        );

        // Should have called delay twice (rounds 1 and 2, but not round 0)
        const delayCalls = mockLogger.debug.mock.calls.filter(call => 
            call[0] === "Applying request delay"
        );
        expect(delayCalls).toHaveLength(2);
    });
});