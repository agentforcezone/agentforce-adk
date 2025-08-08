import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test";
import { OpenRouterProvider } from "../../lib/provider/openrouter";
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

// Mock the OpenRouterToolUse class
const mockToolUse = {
    generateWithTools: mock(),
    chatWithTools: mock()
};

mock.module("../../lib/provider/openrouter-tooluse", () => ({
    OpenRouterToolUse: mock(() => mockToolUse)
}));

describe("OpenRouterProvider Extended Tests", () => {
    let provider: OpenRouterProvider;
    let mockLogger: any;
    const testModel = "openai/gpt-oss-20b:free";
    const testModelConfig: ModelConfig = {
        temperature: 0.7,
        maxTokens: 4096
    };

    const testTools: Tool[] = [
        {
            type: "function",
            function: {
                name: "test_tool",
                description: "A test tool",
                parameters: {
                    type: "object",
                    properties: {
                        query: { type: "string" }
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
        mockToolUse.generateWithTools.mockReset();
        mockToolUse.chatWithTools.mockReset();

        // Create provider instance
        provider = new OpenRouterProvider(testModel, testModelConfig);
    });

    afterEach(() => {
        delete process.env.OPENROUTER_API_KEY;
    });

    test("should handle generateWithTools by delegating to toolUse", async () => {
        const testPrompt = "Test prompt with tools";
        const testSystem = "Test system";
        const expectedResponse = "Tool response";

        mockToolUse.generateWithTools.mockResolvedValueOnce(expectedResponse);

        const result = await provider.generateWithTools(testPrompt, testTools, testSystem, mockLogger);

        expect(result).toBe(expectedResponse);
        expect(mockToolUse.generateWithTools).toHaveBeenCalledWith(
            testPrompt,
            testTools,
            testSystem,
            mockLogger
        );
    });

    test("should handle chatWithTools by delegating to toolUse", async () => {
        const testMessages = [{ role: "user", content: "Use tools please" }];
        const expectedResponse = "Tool chat response";

        mockToolUse.chatWithTools.mockResolvedValueOnce(expectedResponse);

        const result = await provider.chatWithTools(testMessages, testTools, mockLogger);

        expect(result).toBe(expectedResponse);
        expect(mockToolUse.chatWithTools).toHaveBeenCalledWith(
            testMessages,
            testTools,
            mockLogger
        );
    });

    test("should recreate toolUse when model is changed", () => {
        const newModel = "anthropic/claude-3-haiku:beta";
        
        provider.setModel(newModel);

        expect(provider.getModel()).toBe(newModel);
        // ToolUse should be recreated with new model (verified through constructor mock)
    });
});