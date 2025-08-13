import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { addRouteAgent, createAgentRouteHandler } from "../../../lib/server/methods/addRouteAgent";
import type { RouteAgentSchema } from "../../../lib/server/methods/addRouteAgent";
import type { AgentForceLogger } from "../../../lib/types";

// Mock AgentForceServer interface for testing
interface MockServer {
    getName(): string;
    getLogger(): AgentForceLogger;
    addToRouteAgents: jest.MockedFunction<(routeAgent: any) => void>;
}

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
        json: jest.MockedFunction<() => Promise<any>>;
        header: jest.MockedFunction<() => Record<string, string>>;
    };
    json: jest.MockedFunction<(object: any, status?: number) => Response>;
}

describe("addRouteAgent Method Tests", () => {
    let mockServer: MockServer;
    let mockLogger: AgentForceLogger;
    let mockAgent: MockAgent;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        mockAgent = {
            getName: jest.fn<() => string>().mockReturnValue("TestAgent"),
            prompt: jest.fn<(prompt: string) => MockAgent>().mockReturnThis(),
            getResponse: jest.fn<() => Promise<string>>().mockResolvedValue("Test response")
        };

        mockServer = {
            getName: () => "TestServer",
            getLogger: () => mockLogger,
            addToRouteAgents: jest.fn()
        };
    });

    describe("Input Validation", () => {
        test("should throw error for empty method", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, "", "/test", mockAgent as any);
            }).toThrow("HTTP method must be a non-empty string");
        });

        test("should throw error for non-string method", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, null as any, "/test", mockAgent as any);
            }).toThrow("HTTP method must be a non-empty string");
        });

        test("should throw error for empty path", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, "GET", "", mockAgent as any);
            }).toThrow("Route path must be a non-empty string");
        });

        test("should throw error for non-string path", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, "GET", null as any, mockAgent as any);
            }).toThrow("Route path must be a non-empty string");
        });

        test("should throw error for missing agent", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, "GET", "/test", null as any);
            }).toThrow("Agent instance is required");
        });

        test("should throw error for undefined agent", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, "GET", "/test", undefined as any);
            }).toThrow("Agent instance is required");
        });

        test("should throw error for invalid HTTP method", () => {
            expect(() => {
                addRouteAgent.call(mockServer as any, "INVALID", "/test", mockAgent as any);
            }).toThrow("Invalid HTTP method: INVALID. Valid methods are: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS");
        });
    });

    describe("Method Normalization", () => {
        test("should normalize method to uppercase", () => {
            const result = addRouteAgent.call(mockServer as any, "get", "/test", mockAgent as any);

            expect(result).toBe(mockServer);
            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: undefined
            });
        });

        test("should handle already uppercase method", () => {
            const result = addRouteAgent.call(mockServer as any, "POST", "/test", mockAgent as any);

            expect(result).toBe(mockServer);
            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "POST",
                path: "/test",
                agent: mockAgent,
                schema: undefined
            });
        });
    });

    describe("Path Normalization", () => {
        test("should add leading slash to path", () => {
            addRouteAgent.call(mockServer as any, "GET", "test", mockAgent as any);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: undefined
            });
        });

        test("should keep existing leading slash", () => {
            addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: undefined
            });
        });
    });

    describe("Valid HTTP Methods", () => {
        const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

        validMethods.forEach(method => {
            test(`should accept ${method} method`, () => {
                const result = addRouteAgent.call(mockServer as any, method, "/test", mockAgent as any);

                expect(result).toBe(mockServer);
                expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                    method: method,
                    path: "/test",
                    agent: mockAgent,
                    schema: undefined
                });
            });
        });
    });

    describe("Schema Handling", () => {
        test("should handle missing schema", () => {
            addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: undefined
            });
        });

        test("should handle empty schema object", () => {
            const schema: RouteAgentSchema = {};
            addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any, schema);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: {
                    input: ["prompt"],
                    output: ["success", "method", "path", "agentName", "prompt", "response"]
                }
            });
        });

        test("should normalize schema with custom input fields", () => {
            const schema: RouteAgentSchema = {
                input: ["title", "content"]
            };
            addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any, schema);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: {
                    input: ["title", "content", "prompt"],
                    output: ["success", "method", "path", "agentName", "prompt", "response"]
                }
            });
        });

        test("should normalize schema with custom output fields", () => {
            const schema: RouteAgentSchema = {
                output: ["success", "data"]
            };
            addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any, schema);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: {
                    input: ["prompt"],
                    output: ["success", "data"]
                }
            });
        });

        test("should not duplicate prompt in input fields", () => {
            const schema: RouteAgentSchema = {
                input: ["prompt", "title"]
            };
            addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any, schema);

            expect(mockServer.addToRouteAgents).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                agent: mockAgent,
                schema: {
                    input: ["prompt", "title"],
                    output: ["success", "method", "path", "agentName", "prompt", "response"]
                }
            });
        });
    });

    describe("Logging", () => {
        test("should log route agent addition", () => {
            addRouteAgent.call(mockServer as any, "GET", "/api/story", mockAgent as any);

            expect(mockLogger.info).toHaveBeenCalledWith({
                serverName: "TestServer",
                method: "GET",
                path: "/api/story",
                agentName: "AgentForce Agent",
                schema: undefined,
                action: "route_agent_added"
            }, "Adding route agent: GET /api/story");
        });

        test("should log route agent addition with schema", () => {
            const schema: RouteAgentSchema = {
                input: ["title"],
                output: ["success", "story"]
            };
            addRouteAgent.call(mockServer as any, "POST", "/create", mockAgent as any, schema);

            expect(mockLogger.info).toHaveBeenCalledWith({
                serverName: "TestServer",
                method: "POST",
                path: "/create",
                agentName: "AgentForce Agent",
                schema: {
                    input: ["title", "prompt"],
                    output: ["success", "story"]
                },
                action: "route_agent_added"
            }, "Adding route agent: POST /create");
        });
    });

    describe("Method Chaining", () => {
        test("should return server instance for chaining", () => {
            const result = addRouteAgent.call(mockServer as any, "GET", "/test", mockAgent as any);
            expect(result).toBe(mockServer);
        });
    });
});

describe("createAgentRouteHandler Function Tests", () => {
    let mockContext: MockContext;
    let mockAgent: MockAgent;
    let mockResponse: Response;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock console methods to avoid test output noise
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});

        mockResponse = new Response();
        mockContext = {
            req: {
                url: "http://localhost:3000/test",
                json: jest.fn<() => Promise<any>>(),
                header: jest.fn<() => Record<string, string>>().mockReturnValue({})
            },
            json: jest.fn<(object: any, status?: number) => Response>().mockReturnValue(mockResponse)
        };

        mockAgent = {
            getName: jest.fn<() => string>().mockReturnValue("TestAgent"),
            prompt: jest.fn<(prompt: string) => MockAgent>().mockReturnThis(),
            getResponse: jest.fn<() => Promise<string>>().mockResolvedValue("Test agent response")
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST Request Handling", () => {
        test("should handle valid POST request with prompt", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockAgent.prompt).toHaveBeenCalledWith("Create a story");
            expect(mockAgent.getResponse).toHaveBeenCalled();
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                method: "POST",
                path: "/test",
                agentName: "TestAgent",
                prompt: "Create a story",
                response: "Test agent response"
            });
        });

        test("should handle POST request with schema validation", async () => {
            const requestData = { prompt: "Create a story", title: "My Story" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title"],
                output: ["success", "response"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test", schema);
            await handler(mockContext as any);

            expect(mockAgent.prompt).toHaveBeenCalledWith("Create a story");
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                response: "Test agent response"
            });
        });

        test("should return error for missing prompt in POST request", async () => {
            const requestData = { title: "My Story" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing or invalid prompt",
                message: "Request must include a \"prompt\" field with a string value",
                example: { prompt: "create a story for an auth service in bun" },
                expectedFields: ["prompt"]
            }, 400);
        });

        test("should return error for invalid JSON in POST request", async () => {
            mockContext.req.json.mockRejectedValue(new Error("Invalid JSON"));
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Invalid JSON in request body",
                message: "Please provide valid JSON data"
            }, 400);
        });

        test("should validate required fields with schema", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: title, category",
                missingFields: ["title", "category"],
                expectedFields: ["prompt", "title", "category"],
                providedFields: ["prompt"]
            }, 400);
        });

        test("should validate unexpected fields with schema", async () => {
            const requestData = { prompt: "Create a story", unexpected: "field" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const schema: RouteAgentSchema = {
                input: ["prompt"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: unexpected",
                unexpectedFields: ["unexpected"],
                expectedFields: ["prompt"],
                providedFields: ["prompt", "unexpected"]
            }, 400);
        });

        test("should validate required fields with empty string values", async () => {
            const requestData = { prompt: "Create a story", title: "", category: "fiction" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: title",
                missingFields: ["title"],
                expectedFields: ["prompt", "title", "category"],
                providedFields: ["prompt", "title", "category"]
            }, 400);
        });

        test("should validate required fields with null values", async () => {
            const requestData = { prompt: "Create a story", title: null, category: undefined };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: title, category",
                missingFields: ["title", "category"],
                expectedFields: ["prompt", "title", "category"],
                providedFields: ["prompt", "title", "category"]
            }, 400);
        });
    });

    describe("GET Request Handling", () => {
        test("should handle valid GET request with prompt", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20a%20story";
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test");
            await handler(mockContext as any);

            expect(mockAgent.prompt).toHaveBeenCalledWith("Create a story");
            expect(mockAgent.getResponse).toHaveBeenCalled();
            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                method: "GET",
                path: "/test",
                agentName: "TestAgent",
                prompt: "Create a story",
                response: "Test agent response"
            });
        });

        test("should return error for missing prompt in GET request", async () => {
            mockContext.req.url = "http://localhost:3000/test";
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing or invalid prompt",
                message: "Request must include a \"prompt\" query parameter with a string value",
                example: "?prompt=create a story for an auth service in bun",
                expectedFields: ["prompt"]
            }, 400);
        });

        test("should validate query parameters with schema", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20a%20story&unexpected=field";
            
            const schema: RouteAgentSchema = {
                input: ["prompt"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Unexpected fields in request",
                message: "The following fields are not allowed: unexpected",
                unexpectedFields: ["unexpected"],
                expectedFields: ["prompt"],
                providedFields: ["prompt", "unexpected"]
            }, 400);
        });

        test("should validate missing required query parameters with schema", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20a%20story";
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: title, category",
                missingFields: ["title", "category"],
                expectedFields: ["prompt", "title", "category"],
                providedFields: ["prompt"]
            }, 400);
        });

        test("should validate empty query parameters with schema", async () => {
            mockContext.req.url = "http://localhost:3000/test?prompt=Create%20a%20story&title=&category=fiction";
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title", "category"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "GET", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Missing required fields",
                message: "The following required fields are missing: title",
                missingFields: ["title"],
                expectedFields: ["prompt", "title", "category"],
                providedFields: ["prompt", "title", "category"]
            }, 400);
        });
    });

    describe("Agent Execution", () => {
        test("should handle agent execution error", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json.mockResolvedValue(requestData);
            mockAgent.getResponse.mockRejectedValue(new Error("Agent failed"));
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Agent failed",
                success: false
            }, 500);
        });

        test("should handle non-Error agent exceptions", async () => {
            const requestData = { prompt: "Create a story" };
            mockContext.req.json.mockResolvedValue(requestData);
            mockAgent.getResponse.mockRejectedValue("String error");
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Unknown error",
                success: false
            }, 500);
        });
    });

    describe("Response Filtering", () => {
        test("should filter response based on output schema", async () => {
            const requestData = { prompt: "Create a story", title: "My Story" };
            mockContext.req.json.mockResolvedValue(requestData);
            
            const schema: RouteAgentSchema = {
                input: ["prompt", "title"],
                output: ["success", "response", "title"]
            };
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test", schema);
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                success: true,
                response: "Test agent response",
                title: "My Story"
            });
        });
    });

    describe("Error Handling", () => {
        test("should handle unexpected errors", async () => {
            // Force an unexpected error by making the entire context throw
            const requestData = { prompt: "Create a story" };
            mockContext.req.json.mockResolvedValue(requestData);
            // Make agent execution throw an error to reach the agent execution error handler
            mockAgent.prompt.mockImplementation(() => {
                throw new Error("Unexpected error");
            });
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Unexpected error",
                success: false
            }, 500);
        });

        test("should handle non-Error exceptions in main handler", async () => {
            // Force a non-Error exception in agent execution
            const requestData = { prompt: "Create a story" };
            mockContext.req.json.mockResolvedValue(requestData);
            mockAgent.prompt.mockImplementation(() => {
                throw "String exception";
            });
            
            const handler = createAgentRouteHandler(mockAgent as any, "POST", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: "Agent execution failed",
                message: "Unknown error",
                success: false
            }, 500);
        });
    });

    describe("Unsupported HTTP Methods", () => {
        test("should throw error for unsupported HTTP method", async () => {
            const handler = createAgentRouteHandler(mockAgent as any, "TRACE", "/test");
            await handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                method: "TRACE",
                path: "/test",
                error: "Internal server error",
                message: "Unsupported HTTP method: TRACE"
            }, 500);
        });
    });
});