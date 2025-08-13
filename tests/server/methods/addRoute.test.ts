import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { addRoute, createStaticRouteHandler } from "../../../lib/server/methods/addRoute";
import type { AgentForceLogger } from "../../../lib/types";

// Mock AgentForceServer interface for testing
interface MockServer {
    getName(): string;
    getLogger(): AgentForceLogger;
    addToStaticRoutes: jest.MockedFunction<(staticRoute: any) => void>;
}

// Mock Hono Context for handler testing
interface MockContext {
    json: jest.Mock;
}

describe("addRoute Method Tests", () => {
    let mockServer: MockServer;
    let mockLogger: AgentForceLogger;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        mockServer = {
            getName: () => "TestServer",
            getLogger: () => mockLogger,
            addToStaticRoutes: jest.fn()
        };
    });

    describe("Input Validation", () => {
        test("should throw error for empty method", () => {
            expect(() => {
                addRoute.call(mockServer as any, "", "/test", { data: "test" });
            }).toThrow("HTTP method must be a non-empty string");
        });

        test("should throw error for non-string method", () => {
            expect(() => {
                addRoute.call(mockServer as any, null as any, "/test", { data: "test" });
            }).toThrow("HTTP method must be a non-empty string");
        });

        test("should throw error for empty path", () => {
            expect(() => {
                addRoute.call(mockServer as any, "GET", "", { data: "test" });
            }).toThrow("Route path must be a non-empty string");
        });

        test("should throw error for non-string path", () => {
            expect(() => {
                addRoute.call(mockServer as any, "GET", null as any, { data: "test" });
            }).toThrow("Route path must be a non-empty string");
        });

        test("should throw error for undefined response data", () => {
            expect(() => {
                addRoute.call(mockServer as any, "GET", "/test", undefined);
            }).toThrow("Response data is required");
        });

        test("should throw error for null response data", () => {
            expect(() => {
                addRoute.call(mockServer as any, "GET", "/test", null);
            }).toThrow("Response data is required");
        });

        test("should throw error for invalid HTTP method", () => {
            expect(() => {
                addRoute.call(mockServer as any, "INVALID", "/test", { data: "test" });
            }).toThrow("Invalid HTTP method: INVALID. Valid methods are: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS");
        });
    });

    describe("Method Normalization", () => {
        test("should normalize method to uppercase", () => {
            const result = addRoute.call(mockServer as any, "get", "/test", { data: "test" });

            expect(result).toBe(mockServer);
            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                responseData: { data: "test" }
            });
        });

        test("should handle already uppercase method", () => {
            const result = addRoute.call(mockServer as any, "POST", "/test", { data: "test" });

            expect(result).toBe(mockServer);
            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "POST",
                path: "/test",
                responseData: { data: "test" }
            });
        });
    });

    describe("Path Normalization", () => {
        test("should add leading slash to path", () => {
            addRoute.call(mockServer as any, "GET", "test", { data: "test" });

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                responseData: { data: "test" }
            });
        });

        test("should keep existing leading slash", () => {
            addRoute.call(mockServer as any, "GET", "/test", { data: "test" });

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/test",
                responseData: { data: "test" }
            });
        });
    });

    describe("Valid HTTP Methods", () => {
        const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

        validMethods.forEach(method => {
            test(`should accept ${method} method`, () => {
                const result = addRoute.call(mockServer as any, method, "/test", { data: "test" });

                expect(result).toBe(mockServer);
                expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                    method: method,
                    path: "/test",
                    responseData: { data: "test" }
                });
            });
        });
    });

    describe("Logging", () => {
        test("should log route addition", () => {
            addRoute.call(mockServer as any, "GET", "/health", { status: "ok" });

            expect(mockLogger.info).toHaveBeenCalledWith({
                serverName: "TestServer",
                method: "GET",
                path: "/health",
                action: "static_route_added"
            }, "Adding static route: GET /health");
        });
    });

    describe("Response Data Handling", () => {
        test("should handle object response data", () => {
            const responseData = { message: "Hello World", timestamp: Date.now() };
            addRoute.call(mockServer as any, "GET", "/hello", responseData);

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/hello",
                responseData: responseData
            });
        });

        test("should handle string response data", () => {
            const responseData = "Simple string response";
            addRoute.call(mockServer as any, "GET", "/message", responseData);

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/message",
                responseData: responseData
            });
        });

        test("should handle function response data", () => {
            const responseData = () => ({ dynamic: "response" });
            addRoute.call(mockServer as any, "GET", "/dynamic", responseData);

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/dynamic",
                responseData: responseData
            });
        });

        test("should handle number response data", () => {
            const responseData = 42;
            addRoute.call(mockServer as any, "GET", "/number", responseData);

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/number",
                responseData: responseData
            });
        });

        test("should handle boolean response data", () => {
            const responseData = true;
            addRoute.call(mockServer as any, "GET", "/boolean", responseData);

            expect(mockServer.addToStaticRoutes).toHaveBeenCalledWith({
                method: "GET",
                path: "/boolean",
                responseData: responseData
            });
        });
    });

    describe("Method Chaining", () => {
        test("should return server instance for chaining", () => {
            const result = addRoute.call(mockServer as any, "GET", "/test", { data: "test" });
            expect(result).toBe(mockServer);
        });
    });
});

describe("createStaticRouteHandler Function Tests", () => {
    let mockContext: MockContext;
    let mockResponse: Response;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockResponse = new Response();
        mockContext = {
            json: jest.fn().mockReturnValue(mockResponse)
        };
    });

    describe("Object Response Data", () => {
        test("should return JSON response for object data", () => {
            const responseData = { message: "Hello", status: "success" };
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            const result = handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith(responseData);
            expect(result).toBe(mockResponse);
        });

        test("should return JSON response for primitive data", () => {
            const responseData = "Simple string";
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            const result = handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith(responseData);
            expect(result).toBe(mockResponse);
        });
    });

    describe("Function Response Data", () => {
        test("should call function and return JSON response", () => {
            const responseData = jest.fn().mockReturnValue({ dynamic: "response" });
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            const result = handler(mockContext as any);

            expect(responseData).toHaveBeenCalledWith(mockContext);
            expect(mockContext.json).toHaveBeenCalledWith({ dynamic: "response" });
            expect(result).toBe(mockResponse);
        });

        test("should return Response object directly if function returns Response", () => {
            const directResponse = new Response("Direct response");
            const responseData = jest.fn().mockReturnValue(directResponse);
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            const result = handler(mockContext as any);

            expect(responseData).toHaveBeenCalledWith(mockContext);
            expect(mockContext.json).not.toHaveBeenCalled();
            expect(result).toBe(directResponse);
        });

        test("should handle async function returning data", async () => {
            const asyncData = { async: "data" };
            const responseData = jest.fn();
            (responseData as any).mockResolvedValue(asyncData);
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            const result = await handler(mockContext as any);

            expect(responseData).toHaveBeenCalledWith(mockContext);
            expect(mockContext.json).toHaveBeenCalledWith(asyncData);
            expect(result).toBe(mockResponse);
        });

        test("should handle async function returning Response", async () => {
            const directResponse = new Response("Async response");
            const responseData = jest.fn();
            (responseData as any).mockResolvedValue(directResponse);
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            const result = await handler(mockContext as any);

            expect(responseData).toHaveBeenCalledWith(mockContext);
            expect(mockContext.json).not.toHaveBeenCalled();
            expect(result).toBe(directResponse);
        });
    });

    describe("Error Handling", () => {
        test("should handle function execution errors", () => {
            const errorMessage = "Function execution failed";
            const responseData = jest.fn().mockImplementation(() => {
                throw new Error(errorMessage);
            });
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            // Mock console.error to avoid test output noise
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            const result = handler(mockContext as any);

            expect(consoleErrorSpy).toHaveBeenCalledWith("Error in static route GET /test:", expect.any(Error));
            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                method: "GET",
                path: "/test",
                error: "Internal server error",
                message: errorMessage
            }, 500);
            expect(result).toBe(mockResponse);

            consoleErrorSpy.mockRestore();
        });

        test("should handle non-Error exceptions", () => {
            const responseData = jest.fn().mockImplementation(() => {
                throw "String error";
            });
            const handler = createStaticRouteHandler(responseData, "GET", "/test");

            // Mock console.error to avoid test output noise
            const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            const result = handler(mockContext as any);

            expect(mockContext.json).toHaveBeenCalledWith({
                success: false,
                method: "GET",
                path: "/test",
                error: "Internal server error",
                message: "Unknown error occurred"
            }, 500);
            expect(result).toBe(mockResponse);

            consoleErrorSpy.mockRestore();
        });
    });
});