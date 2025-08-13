import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { createAgentRouteHandler } from "../../../lib/server/methods/addRouteAgent";
import type { RouteAgentSchema } from "../../../lib/server/methods/addRouteAgent";

// Mock AgentForceAgent interface for testing
interface MockAgent {
    getName: jest.MockedFunction<() => string>;
    prompt: jest.MockedFunction<(prompt: string) => MockAgent>;
    getResponse: jest.MockedFunction<() => Promise<string>>;
}

// Mock Hono Context for handler testing
interface MockContext {
    req: {
        url: string;
        json?: jest.MockedFunction<() => Promise<any>>;
        header?: jest.MockedFunction<() => Record<string, string>>;
    };
    json: jest.MockedFunction<(object: any, status?: number) => Response>;
}

describe("createAgentRouteHandler Extended Edge Case Tests", () => {
    let mockAgent: MockAgent;
    let mockContext: MockContext;
    let mockResponse: Response;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console methods to capture debug logs
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});

        mockResponse = new Response();
        mockAgent = {
            getName: jest.fn<() => string>().mockReturnValue("TestAgent"),
            prompt: jest.fn<(prompt: string) => MockAgent>().mockReturnThis(),
            getResponse: jest.fn<() => Promise<string>>().mockResolvedValue("Test agent response")
        };

        mockContext = {
            req: {
                url: "http://localhost:3000/test",
                json: jest.fn<() => Promise<any>>(),
                header: jest.fn<() => Record<string, string>>().mockReturnValue({})
            },
            json: jest.fn<(object: any, status?: number) => Response>().mockReturnValue(mockResponse)
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Edge Case: Line 142 - Debug logging for request body keys", () => {
        test("should log request body keys when processing POST request", async () => {
            const requestData = { prompt: "Create a story", title: "My Story", extra: "data" };
            mockContext.req.json!.mockResolvedValue(requestData);
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            // Verify that console.log was called with request body keys
            expect(console.log).toHaveBeenCalledWith("Request Body Keys:", ["prompt", "title", "extra"]);
        });

        test("should log empty array when request data is empty object", async () => {
            const requestData = {};
            mockContext.req.json!.mockResolvedValue(requestData);
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            // Verify that console.log was called with empty array
            expect(console.log).toHaveBeenCalledWith("Request Body Keys:", []);
        });
    });

    describe("Edge Case: Lines 252-273 - GET method unexpected fields validation", () => {
        test("should validate and reject GET request with unexpected fields when schema is provided", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20story&unexpected=field&another=value";
            
            const schema: RouteAgentSchema = {
                input: ["prompt"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: unexpected, another",
                unexpectedFields: ["unexpected", "another"],
                expectedFields: ["prompt"],
                providedFields: ["prompt", "unexpected", "another"]
            }, 400);
        });

        test("should validate and reject HEAD request with missing fields first, then unexpected fields", async () => {
            // Test case where missing fields take precedence over unexpected fields
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20story&unwanted=field";
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "HEAD", "/test", schema);
            await handler(mockContext as any);

            // Missing fields validation happens first
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: category",
                missingFields: ["category"],
                expectedFields: ["prompt", "category"],
                providedFields: ["prompt", "unwanted"]
            }, 400);
        });

        test("should validate and reject HEAD request with only unexpected fields", async () => {
            // Test case where all required fields are present but there are unexpected fields
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20story&unwanted=field";
            
            const schema: RouteAgentSchema = {
                input: ["prompt"]  // Only prompt required
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "HEAD", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: unwanted",
                unexpectedFields: ["unwanted"],
                expectedFields: ["prompt"],
                providedFields: ["prompt", "unwanted"]
            }, 400);
        });

        test("should validate and reject OPTIONS request with unexpected fields", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20story&extra=value";
            
            const schema: RouteAgentSchema = {
                input: ["prompt"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "OPTIONS", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: extra",
                unexpectedFields: ["extra"],
                expectedFields: ["prompt"],
                providedFields: ["prompt", "extra"]
            }, 400);
        });

        test("should validate and reject DELETE request with unexpected fields", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Delete%20item&invalid=parameter";
            
            const schema: RouteAgentSchema = {
                input: ["prompt"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "DELETE", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: invalid",
                unexpectedFields: ["invalid"],
                expectedFields: ["prompt"],
                providedFields: ["prompt", "invalid"]
            }, 400);
        });

        test("should handle GET request with missing required fields and unexpected fields simultaneously", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20story&unexpected=field";
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test", schema);
            await handler(mockContext as any);

            // Should report missing fields first (takes precedence)
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: title, category",
                missingFields: ["title", "category"],
                expectedFields: ["prompt", "title", "category"],
                providedFields: ["prompt", "unexpected"]
            }, 400);
        });
    });

    describe("Edge Case: Line 318 - Error message fallback in main catch block", () => {
        test("should trigger main catch block and return error response with non-Error exception", async () => {
            // Create a mock context that will trigger the main catch block
            const faultyContext = {
                req: {
                    url: "http://localhost:3000/test",
                    json: jest.fn<() => Promise<any>>().mockRejectedValue(new Error("JSON parse error")),
                    header: jest.fn<() => Record<string, string>>().mockReturnValue({})
                },
                json: jest.fn<(object: any, status?: number) => Response>().mockReturnValue(mockResponse)
            };
            
            // Mock agent execution
            mockAgent.getResponse.mockResolvedValue("Test response");
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(faultyContext as any);
            
            // Should call c.json with error response including line 318 fallback
            expect(faultyContext.json).toHaveBeenCalledWith({
                error: "Invalid JSON in request body",
                message: "Please provide valid JSON data"
            }, 400);
            
            // Verify console.log was called for debug logging
            expect(console.log).toHaveBeenCalledWith("❌ JSON Parse Error:", expect.any(Error));
        });

        test("should handle Error objects in agent execution catch block", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json!.mockResolvedValue(requestData);
            
            // Make agent.getResponse throw an Error object
            mockAgent.getResponse.mockRejectedValue(new Error("Agent execution failed"));
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Agent execution failed",
                success: false
            }, 500);
        });

        test("should handle non-Error exceptions in agent execution with fallback", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json!.mockResolvedValue(requestData);
            
            // Make agent.getResponse throw a non-Error object
            mockAgent.getResponse.mockRejectedValue("String error - not an Error object");
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Unknown error",
                success: false
            }, 500);
        });

        test("should handle null exceptions in agent execution", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json!.mockResolvedValue(requestData);
            
            // Make agent.getResponse throw null
            mockAgent.getResponse.mockRejectedValue(null);
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Unknown error",
                success: false
            }, 500);
        });

        test("should handle undefined exceptions in agent execution", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json!.mockResolvedValue(requestData);
            
            // Make agent.getResponse throw undefined
            mockAgent.getResponse.mockRejectedValue(undefined);
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Unknown error",
                success: false
            }, 500);
        });
    });

    describe("Complete Edge Case Integration Test", () => {
        test("should handle complex scenario with all edge cases", async () => {
            // This test combines multiple edge cases to ensure comprehensive coverage
            mockContext.req.url = "http://localhost:3000/complex?prompt=Test&valid=field&invalid=field";
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "valid"],
                output: ["success", "response"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/complex", schema);
            await handler(mockContext as any);

            // Should detect and report unexpected field
            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: invalid",
                unexpectedFields: ["invalid"],
                expectedFields: ["prompt", "valid"],
                providedFields: ["prompt", "valid", "invalid"]
            }, 400);

            // Verify debug logging occurred
            expect(console.log).toHaveBeenCalledWith("Expected Input Fields:", ["prompt", "valid"]);
        });
    });
});