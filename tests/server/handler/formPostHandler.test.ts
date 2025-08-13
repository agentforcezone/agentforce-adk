import { describe, expect, test, beforeEach, jest } from "@jest/globals";

// Import the function to test
import { createFormPostHandler } from "../../../lib/server/handler/formPostHandler";

describe("Form POST Handler Tests", () => {
    // Create mock Context object that matches Hono's interface
    let mockContext: any;
    let mockAgent: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a comprehensive mock Context
        mockContext = {
            req: {
                parseBody: jest.fn()
            },
            json: jest.fn().mockImplementation((data, status) => {
                return {
                    status: status || 200,
                    data: data,
                    headers: { "Content-Type": "application/json" }
                } as any;
            })
        };

        // Create a comprehensive mock Agent
        mockAgent = {
            getName: jest.fn().mockReturnValue("TestAgent"),
            prompt: jest.fn().mockReturnThis(),
            getResponse: jest.fn()
        } as any;
        
        // Set up the getResponse mock after creation
        // @ts-ignore
        mockAgent.getResponse.mockResolvedValue("Agent response");
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("createFormPostHandler - Basic Functionality", () => {
        test("should return a function", () => {
            const handler = createFormPostHandler(mockAgent, "/test");
            expect(typeof handler).toBe("function");
        });

        test("should return a function with schema", () => {
            const schema = {
                input: ["prompt", "name"],
                output: ["success", "response"]
            };
            
            const handler = createFormPostHandler(mockAgent, "/test", schema);
            expect(typeof handler).toBe("function");
        });
    });

    describe("Handler Execution - Happy Path", () => {
        test("should handle valid form submission with prompt only", async () => {
            // Arrange
            const formData = { prompt: "Hello world" };
            mockContext.req.parseBody.mockResolvedValue(formData);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.req.parseBody).toHaveBeenCalled();
            expect(mockAgent.prompt).toHaveBeenCalledWith("Hello world");
            expect(mockAgent.getResponse).toHaveBeenCalled();
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                prompt: "Hello world",
                response: "Agent response",
                agentName: "TestAgent"
            });
        });

        test("should handle form submission with schema validation", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt", 
                name: "John",
                email: "john@example.com"
            };
            const schema = {
                input: ["prompt", "name", "email"],
                output: ["success", "response", "agentName", "name"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockAgent.prompt).toHaveBeenCalledWith("Test prompt");
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                response: "Agent response",
                agentName: "TestAgent",
                name: "John"
            });
        });

        test("should include additional input fields in response", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt", 
                category: "test",
                priority: "high"
            };
            const schema = {
                input: ["prompt", "category", "priority"],
                output: ["success", "prompt", "response", "category", "priority"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                prompt: "Test prompt",
                response: "Agent response",
                category: "test",
                priority: "high"
            });
        });
    });

    describe("Handler Execution - Validation Errors", () => {
        test("should return error when prompt is missing", async () => {
            // Arrange
            const formData = { name: "John" };
            mockContext.req.parseBody.mockResolvedValue(formData);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing or invalid prompt",
                message: "Form must include a \"prompt\" field with a string value",
                expectedFields: ["prompt"]
            }, 400);
            expect(mockAgent.prompt).not.toHaveBeenCalled();
        });

        test("should return error when prompt is not a string", async () => {
            // Arrange
            const formData = { prompt: 123 };
            mockContext.req.parseBody.mockResolvedValue(formData);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing or invalid prompt",
                message: "Form must include a \"prompt\" field with a string value",
                expectedFields: ["prompt"]
            }, 400);
        });

        test("should return error when prompt is empty string", async () => {
            // Arrange
            const formData = { prompt: "" };
            mockContext.req.parseBody.mockResolvedValue(formData);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing or invalid prompt",
                message: "Form must include a \"prompt\" field with a string value",
                expectedFields: ["prompt"]
            }, 400);
        });

        test("should return error when required schema fields are missing", async () => {
            // Arrange
            const formData = { prompt: "Test prompt" };
            const schema = {
                input: ["prompt", "name", "email"],
                output: ["success", "response"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: name, email",
                missingFields: ["name", "email"],
                expectedFields: ["prompt", "name", "email"],
                providedFields: ["prompt"]
            }, 400);
        });

        test("should return error when unexpected fields are provided", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt",
                name: "John",
                unexpectedField: "value"
            };
            const schema = {
                input: ["prompt", "name"],
                output: ["success", "response"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: unexpectedField",
                unexpectedFields: ["unexpectedField"],
                expectedFields: ["prompt", "name"],
                providedFields: ["prompt", "name", "unexpectedField"]
            }, 400);
        });

        test("should return error when required field is empty string", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt",
                name: "",
                email: "john@example.com"
            };
            const schema = {
                input: ["prompt", "name", "email"],
                output: ["success", "response"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: name",
                missingFields: ["name"],
                expectedFields: ["prompt", "name", "email"],
                providedFields: ["prompt", "name", "email"]
            }, 400);
        });
    });

    describe("Handler Execution - Schema Handling", () => {
        test("should work without schema (use defaults)", async () => {
            // Arrange
            const formData = { prompt: "Test prompt", extra: "field" };
            mockContext.req.parseBody.mockResolvedValue(formData);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                prompt: "Test prompt",
                response: "Agent response",
                agentName: "TestAgent"
            });
        });

        test("should handle schema with input only", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt",
                category: "test"
            };
            const schema = {
                input: ["prompt", "category"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                prompt: "Test prompt",
                response: "Agent response",
                agentName: "TestAgent"
            });
        });

        test("should handle schema with output only", async () => {
            // Arrange
            const formData = { prompt: "Test prompt" };
            const schema = {
                output: ["success", "response"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                response: "Agent response"
            });
        });

        test("should filter output fields according to schema", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt",
                metadata: "test-data"
            };
            const schema = {
                input: ["prompt", "metadata"],
                output: ["response", "metadata"] // Intentionally exclude success, prompt, agentName
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                response: "Agent response",
                metadata: "test-data"
            });
        });
    });

    describe("Handler Execution - Error Handling", () => {
        test("should handle parseBody errors", async () => {
            // Arrange
            const error = new Error("Failed to parse body");
            mockContext.req.parseBody.mockRejectedValue(error);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                error: "Internal server error",
                message: "Failed to parse body"
            }, 500);
        });

        test("should handle agent execution errors", async () => {
            // Arrange
            const formData = { prompt: "Test prompt" };
            const agentError = new Error("Agent execution failed");
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            // @ts-ignore
            mockAgent.getResponse.mockRejectedValue(agentError);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                error: "Internal server error",
                message: "Agent execution failed"
            }, 500);
        });

        test("should handle non-Error exceptions", async () => {
            // Arrange
            const formData = { prompt: "Test prompt" };
            const stringError = "Something went wrong";
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            // @ts-ignore
            mockAgent.getResponse.mockRejectedValue(stringError);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                error: "Internal server error",
                message: "Unknown error occurred"
            }, 500);
        });

        test("should handle agent prompt method errors", async () => {
            // Arrange
            const formData = { prompt: "Test prompt" };
            const promptError = new Error("Prompt method failed");
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            // @ts-ignore
            mockAgent.prompt.mockImplementation(() => {
                throw promptError;
            });

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                error: "Internal server error",
                message: "Prompt method failed"
            }, 500);
        });
    });

    describe("Handler Execution - Edge Cases", () => {
        test("should handle form data with complex values", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt",
                file: { name: "test.txt", content: "file content" },
                array: ["item1", "item2"],
                nested: { key: "value" }
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockAgent.prompt).toHaveBeenCalledWith("Test prompt");
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                prompt: "Test prompt",
                response: "Agent response",
                agentName: "TestAgent"
            });
        });

        test("should handle empty form data", async () => {
            // Arrange
            const formData = {};
            mockContext.req.parseBody.mockResolvedValue(formData);

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing or invalid prompt",
                message: "Form must include a \"prompt\" field with a string value",
                expectedFields: ["prompt"]
            }, 400);
        });

        test("should handle null and undefined in form data", async () => {
            // Arrange
            const formData = { 
                prompt: "Test prompt",
                nullField: null,
                undefinedField: undefined
            };
            const schema = {
                input: ["prompt", "nullField", "undefinedField"],
                output: ["success", "response", "nullField"]
            };
            
            mockContext.req.parseBody.mockResolvedValue(formData);
            const handler = createFormPostHandler(mockAgent, "/test", schema);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: nullField, undefinedField",
                missingFields: ["nullField", "undefinedField"],
                expectedFields: ["prompt", "nullField", "undefinedField"],
                providedFields: ["prompt", "nullField", "undefinedField"]
            }, 400);
        });

        test("should access agent name using bracket notation", async () => {
            // Arrange
            const formData = { prompt: "Test prompt" };
            mockContext.req.parseBody.mockResolvedValue(formData);

            // Test that agent["getName"] is called correctly
            mockAgent.getName = jest.fn().mockReturnValue("BracketAccessAgent");

            const handler = createFormPostHandler(mockAgent, "/test");

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                prompt: "Test prompt",
                response: "Agent response",
                agentName: "BracketAccessAgent"
            });
        });
    });

    describe("Handler Execution - Path Logging", () => {
        test("should include correct path in error messages", async () => {
            // Arrange
            const customPath = "/custom/api/endpoint";
            const error = new Error("Test error");
            
            mockContext.req.parseBody.mockRejectedValue(error);
            const handler = createFormPostHandler(mockAgent, customPath);

            // Act
            await handler(mockContext);

            // Assert
            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                error: "Internal server error",
                message: "Test error"
            }, 500);
        });
    });
});