import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceAgent } from "../../../../lib/agent";
import type { AgentConfig } from "../../../../lib/types";

// Mock the execute function
jest.mock("../../../../lib/agent/methods/async/execute", () => ({
    execute: jest.fn(),
}));

describe("AgentForceAgent getResponse Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        agent = new AgentForceAgent(testConfig);
    });

    test("should return the response from execute when successful", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        const expectedResponse = "This is a test response";
        mockExecute.mockResolvedValueOnce(expectedResponse);

        const result = await agent.getResponse();
        
        expect(result).toBe(expectedResponse);
        expect(mockExecute).toHaveBeenCalledTimes(1);
    });

    test("should return error message from chat history when execute fails with error in history", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        // Mock execute to throw an error
        mockExecute.mockRejectedValueOnce(new Error("Execution failed"));

        // Mock getChatHistory to return an error message
        const mockGetChatHistory = jest.spyOn(agent as any, "getChatHistory");
        mockGetChatHistory.mockReturnValue([
            { role: "user", content: "Test prompt" },
            { role: "assistant", content: "Error: Provider failed to respond" }
        ]);

        const result = await agent.getResponse();
        
        expect(result).toBe("Error: Provider failed to respond");
        expect(mockGetChatHistory).toHaveBeenCalled();
    });

    test("should log and return formatted error when execute fails with Error instance", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        // Mock execute to throw an error
        const errorMessage = "Connection timeout";
        mockExecute.mockRejectedValueOnce(new Error(errorMessage));

        // Mock getChatHistory to return no error message
        const mockGetChatHistory = jest.spyOn(agent as any, "getChatHistory");
        mockGetChatHistory.mockReturnValue([
            { role: "user", content: "Test prompt" }
        ]);

        // Mock the logger
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        const mockGetLogger = jest.spyOn(agent as any, "getLogger");
        mockGetLogger.mockReturnValue(mockLogger);

        const result = await agent.getResponse();
        
        expect(result).toBe(`Error: Failed to get response - ${errorMessage}`);
        expect(mockLogger.error).toHaveBeenCalledWith(`Failed to get response: ${errorMessage}`);
    });

    // LINE 29 COVERAGE: Test with non-Error thrown value
    test("should handle non-Error thrown values and convert to string", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        // Mock execute to throw a non-Error value (like a string or object)
        const nonErrorValue = "String error thrown";
        mockExecute.mockRejectedValueOnce(nonErrorValue);

        // Mock getChatHistory to return no error message
        const mockGetChatHistory = jest.spyOn(agent as any, "getChatHistory");
        mockGetChatHistory.mockReturnValue([
            { role: "user", content: "Test prompt" }
        ]);

        // Mock the logger
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        const mockGetLogger = jest.spyOn(agent as any, "getLogger");
        mockGetLogger.mockReturnValue(mockLogger);

        const result = await agent.getResponse();
        
        expect(result).toBe(`Error: Failed to get response - ${nonErrorValue}`);
        expect(mockLogger.error).toHaveBeenCalledWith(`Failed to get response: ${nonErrorValue}`);
    });

    // Additional test for non-Error object thrown
    test("should handle thrown objects that are not Error instances", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        // Mock execute to throw an object (not an Error)
        const nonErrorObject = { code: 500, message: "Internal error" };
        mockExecute.mockRejectedValueOnce(nonErrorObject);

        // Mock getChatHistory to return no error message
        const mockGetChatHistory = jest.spyOn(agent as any, "getChatHistory");
        mockGetChatHistory.mockReturnValue([]);

        // Mock the logger
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        const mockGetLogger = jest.spyOn(agent as any, "getLogger");
        mockGetLogger.mockReturnValue(mockLogger);

        const result = await agent.getResponse();
        
        // String() on an object returns [object Object], not JSON
        const expectedStringified = String(nonErrorObject);
        expect(result).toBe(`Error: Failed to get response - ${expectedStringified}`);
        expect(mockLogger.error).toHaveBeenCalledWith(`Failed to get response: ${expectedStringified}`);
    });

    test("should handle thrown null values", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        // Mock execute to throw null
        mockExecute.mockRejectedValueOnce(null);

        // Mock getChatHistory to return no error message
        const mockGetChatHistory = jest.spyOn(agent as any, "getChatHistory");
        mockGetChatHistory.mockReturnValue([]);

        // Mock the logger
        const mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        const mockGetLogger = jest.spyOn(agent as any, "getLogger");
        mockGetLogger.mockReturnValue(mockLogger);

        const result = await agent.getResponse();
        
        expect(result).toBe("Error: Failed to get response - null");
        expect(mockLogger.error).toHaveBeenCalledWith("Failed to get response: null");
    });

    test("should return assistant error message even when not the last message", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        // Mock execute to throw an error
        mockExecute.mockRejectedValueOnce(new Error("Execution failed"));

        // Mock getChatHistory with error message not as last message
        const mockGetChatHistory = jest.spyOn(agent as any, "getChatHistory");
        mockGetChatHistory.mockReturnValue([
            { role: "user", content: "First prompt" },
            { role: "assistant", content: "Error: First attempt failed" },
            { role: "user", content: "Retry prompt" },
        ]);

        const result = await agent.getResponse();
        
        // Should find the last assistant message with Error:
        expect(result).toBe("Error: First attempt failed");
    });

    test("should work with method chaining", async () => {
        const { execute } = await import("../../../../lib/agent/methods/async/execute");
        const mockExecute = execute as jest.MockedFunction<typeof execute>;
        
        mockExecute.mockResolvedValueOnce("Chained response");

        const result = await agent
            .prompt("Test prompt")
            .systemPrompt("System prompt")
            .getResponse();
        
        expect(result).toBe("Chained response");
    });
});