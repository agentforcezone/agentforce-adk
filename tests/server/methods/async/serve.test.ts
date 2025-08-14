import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";

// Mock Hono before any imports that use it
jest.mock("hono");

// Mock Node.js http module
jest.mock("node:http", () => ({
    default: { createServer: jest.fn() },
    createServer: jest.fn(),
}), { virtual: true });

// Mock handler functions
jest.mock("../../../../lib/server/methods/addRouteAgent", () => ({
    createAgentRouteHandler: jest.fn(() => jest.fn())
}));
jest.mock("../../../../lib/server/methods/addRoute", () => ({
    createStaticRouteHandler: jest.fn(() => jest.fn())
}));
jest.mock("../../../../lib/server/methods/useOpenAICompatibleRouting", () => ({
    createOpenAICompatibleRouteHandler: jest.fn(() => jest.fn())
}));
jest.mock("../../../../lib/server/methods/useOllamaCompatibleRouting", () => ({
    createOllamaGenerateRouteHandler: jest.fn(() => jest.fn()),
    createOllamaChatRouteHandler: jest.fn(() => jest.fn())
}));

// Import the serve function directly
import { serve } from "../../../../lib/server/methods/async/serve";
import type { AgentForceServer } from "../../../../lib/server";

describe("AgentForceServer serve Method Tests", () => {
    let originalBun: any;
    let originalDeno: any;
    
    // Mock functions
    let mockHonoUse: jest.Mock;
    let mockHonoGet: jest.Mock;
    let mockHonoPost: jest.Mock;
    let mockHonoPut: jest.Mock;
    let mockHonoDelete: jest.Mock;
    let mockHonoPatch: jest.Mock;
    let mockHonoOptions: jest.Mock;
    let mockHonoAll: jest.Mock;
    let mockHonoFetch: jest.Mock;
    let mockCreateServer: jest.Mock;
    let mockListen: jest.Mock;
    let mockServer: any;
    
    // Mock server instance
    let mockServerInstance: Partial<AgentForceServer>;
    
    beforeEach(() => {
        // Setup Hono mock
        mockHonoUse = jest.fn();
        mockHonoGet = jest.fn();
        mockHonoPost = jest.fn();
        mockHonoPut = jest.fn();
        mockHonoDelete = jest.fn();
        mockHonoPatch = jest.fn();
        mockHonoOptions = jest.fn();
        mockHonoAll = jest.fn();
        mockHonoFetch = jest.fn() as any;
        
        const mockHonoInstance = {
            use: mockHonoUse,
            get: mockHonoGet,
            post: mockHonoPost,
            put: mockHonoPut,
            delete: mockHonoDelete,
            patch: mockHonoPatch,
            options: mockHonoOptions,
            all: mockHonoAll,
            fetch: mockHonoFetch,
        };
        
        const { Hono } = require("hono");
        Hono.mockImplementation(() => mockHonoInstance);
        
        // Setup http mock
        mockCreateServer = jest.fn();
        mockListen = jest.fn(((_port: any, _host: any, callback?: () => void) => {
            if (callback) callback();
        }) as any);
        mockServer = { listen: mockListen };
        mockCreateServer.mockReturnValue(mockServer);
        
        const http = require("node:http");
        http.createServer = mockCreateServer;
        http.default = { createServer: mockCreateServer };
        
        // Create mock server instance
        mockServerInstance = {
            getName: jest.fn().mockReturnValue("TestServer") as any,
            getLogger: jest.fn().mockReturnValue({
                info: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                debug: jest.fn(),
            }) as any,
            getStaticRoutes: jest.fn().mockReturnValue([]) as any,
            getRouteAgents: jest.fn().mockReturnValue([]) as any,
        } as any;
        
        // Save and clear runtime globals
        originalBun = (global as any).Bun;
        originalDeno = (global as any).Deno;
        delete (global as any).Bun;
        delete (global as any).Deno;
        
        // Mock console methods
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore globals
        if (originalBun) (global as any).Bun = originalBun;
        if (originalDeno) (global as any).Deno = originalDeno;
        jest.clearAllMocks();
    });

    describe("Input validation", () => {
        test("should validate host parameter", async () => {
            await expect(serve.call(mockServerInstance as any, "", 3000)).rejects.toThrow("Host must be a non-empty string");
            await expect(serve.call(mockServerInstance as any, null as any, 3000)).rejects.toThrow("Host must be a non-empty string");
        });

        test("should validate port parameter", async () => {
            await expect(serve.call(mockServerInstance as any, "0.0.0.0", 0)).rejects.toThrow("Port must be a valid number between 1 and 65535");
            await expect(serve.call(mockServerInstance as any, "0.0.0.0", -1)).rejects.toThrow("Port must be a valid number between 1 and 65535");
            await expect(serve.call(mockServerInstance as any, "0.0.0.0", 65536)).rejects.toThrow("Port must be a valid number between 1 and 65535");
            await expect(serve.call(mockServerInstance as any, "0.0.0.0", "invalid" as any)).rejects.toThrow("Port must be a valid number between 1 and 65535");
        });
    });

    describe("Runtime-specific server startup", () => {
        test("should start server with Bun runtime", async () => {
            const mockBunServe = jest.fn().mockReturnValue({
                hostname: "0.0.0.0",
                port: 3000,
            });
            
            (global as any).Bun = { serve: mockBunServe };
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "info").mockImplementation(() => {});

            await serve.call(mockServerInstance as any, "0.0.0.0", 3000);

            expect(mockBunServe).toHaveBeenCalledWith({
                hostname: "0.0.0.0",
                port: 3000,
                fetch: expect.any(Function),
                idleTimeout: 120,
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    runtime: "bun",
                    action: "server_started",
                }),
                expect.stringContaining("Server running")
            );
        });

        test("should start server with Deno runtime", async () => {
            const mockDenoServe = jest.fn();
            (global as any).Deno = { serve: mockDenoServe };
            
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "info").mockImplementation(() => {});

            await serve.call(mockServerInstance as any, "localhost", 8080);

            expect(mockDenoServe).toHaveBeenCalledWith(
                { hostname: "localhost", port: 8080 },
                expect.any(Function)
            );

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    runtime: "deno",
                    action: "server_started",
                }),
                expect.stringContaining("Server running")
            );
        });

        test("should start server with Node.js runtime", async () => {
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "info").mockImplementation(() => {});

            await serve.call(mockServerInstance as any, "127.0.0.1", 4000);

            expect(mockCreateServer).toHaveBeenCalledWith(expect.any(Function));
            expect(mockListen).toHaveBeenCalledWith(4000, "127.0.0.1", expect.any(Function));

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    runtime: "node",
                    action: "server_started",
                }),
                expect.stringContaining("Server running")
            );
        });
    });

    describe("Server initialization", () => {
        test("should log server startup information", async () => {
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "info").mockImplementation(() => {});

            await serve.call(mockServerInstance as any);

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    serverName: "TestServer",
                    action: "server_starting",
                }),
                expect.stringContaining("Starting server: TestServer")
            );
        });

        test("should handle server startup errors", async () => {
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "error").mockImplementation(() => {});

            mockCreateServer.mockImplementation(() => {
                throw new Error("Failed to create server");
            });

            await serve.call(mockServerInstance as any);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "Failed to create server",
                    action: "server_start_failed",
                }),
                "Failed to start server"
            );
        });

        test("should handle non-Error exceptions in server startup", async () => {
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "error").mockImplementation(() => {});

            mockCreateServer.mockImplementation(() => {
                throw "String error not an Error object";
            });

            await serve.call(mockServerInstance as any);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "String error not an Error object",
                    action: "server_start_failed",
                }),
                "Failed to start server"
            );
        });
    });

    describe("Hono app configuration", () => {
        test("should configure Hono middleware and routes", async () => {
            await serve.call(mockServerInstance as any);

            expect(mockHonoUse).toHaveBeenCalledWith(expect.any(Function));
            expect(mockHonoGet).toHaveBeenCalledWith("/", expect.any(Function));
            expect(mockHonoGet).toHaveBeenCalledWith("/health", expect.any(Function));
        });

        test("should register default routes", async () => {
            await serve.call(mockServerInstance as any);

            // Should register default "/" route
            expect(mockHonoGet).toHaveBeenCalledWith("/", expect.any(Function));
            
            // Should register default "/health" route when no conflict
            expect(mockHonoGet).toHaveBeenCalledWith("/health", expect.any(Function));
        });

        test("should handle custom logger with logger middleware", async () => {
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "info").mockImplementation(() => {});

            await serve.call(mockServerInstance as any);

            // The custom logger function should be passed to the Hono logger middleware
            expect(mockHonoUse).toHaveBeenCalledWith(expect.any(Function));
        });
    });

    describe("Route agents registration", () => {
        test("should register route agents with different types", async () => {
            // Mock createRouteHandler functions
            const { createAgentRouteHandler } = require("../../../../lib/server/methods/addRouteAgent");
            const { createOpenAICompatibleRouteHandler } = require("../../../../lib/server/methods/useOpenAICompatibleRouting");
            const { createOllamaGenerateRouteHandler, createOllamaChatRouteHandler } = require("../../../../lib/server/methods/useOllamaCompatibleRouting");
            
            createAgentRouteHandler.mockReturnValue(jest.fn());
            createOpenAICompatibleRouteHandler.mockReturnValue(jest.fn());
            createOllamaGenerateRouteHandler.mockReturnValue(jest.fn());
            createOllamaChatRouteHandler.mockReturnValue(jest.fn());

            // Mock route agents
            const mockAgent = { getName: jest.fn().mockReturnValue("TestAgent") };
            
            (mockServerInstance as any).getRouteAgents = jest.fn().mockReturnValue([
                {
                    method: "POST",
                    path: "/v1/chat/completions",
                    agent: mockAgent,
                    schema: undefined
                },
                {
                    method: "POST", 
                    path: "/api/generate",
                    agent: mockAgent,
                    schema: undefined
                },
                {
                    method: "POST",
                    path: "/api/chat",
                    agent: mockAgent,
                    schema: undefined
                }
            ]);

            await serve.call(mockServerInstance as any);

            expect(mockHonoPost).toHaveBeenCalledWith("/v1/chat/completions", expect.any(Function));
            expect(mockHonoPost).toHaveBeenCalledWith("/api/generate", expect.any(Function));
            expect(mockHonoPost).toHaveBeenCalledWith("/api/chat", expect.any(Function));
        });

        test("should register all HTTP methods for route agents", async () => {
            // Mock createRouteHandler functions
            const { createAgentRouteHandler } = require("../../../../lib/server/methods/addRouteAgent");
            createAgentRouteHandler.mockReturnValue(jest.fn());

            const mockAgent = { getName: jest.fn().mockReturnValue("TestAgent") };
            const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];
            
            (mockServerInstance as any).getRouteAgents = jest.fn().mockReturnValue(
                methods.map(method => ({
                    method,
                    path: `/${method.toLowerCase()}`,
                    agent: mockAgent,
                    schema: undefined
                }))
            );

            await serve.call(mockServerInstance as any);

            expect(mockHonoGet).toHaveBeenCalledWith("/get", expect.any(Function));
            expect(mockHonoPost).toHaveBeenCalledWith("/post", expect.any(Function));
            expect(mockHonoPut).toHaveBeenCalledWith("/put", expect.any(Function));
            expect(mockHonoDelete).toHaveBeenCalledWith("/delete", expect.any(Function));
            expect(mockHonoPatch).toHaveBeenCalledWith("/patch", expect.any(Function));
            expect(mockHonoAll).toHaveBeenCalledWith("/head", expect.any(Function));
            expect(mockHonoOptions).toHaveBeenCalledWith("/options", expect.any(Function));
        });

        test("should handle unsupported HTTP methods", async () => {
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "warn").mockImplementation(() => {});
            
            const mockAgent = { getName: jest.fn().mockReturnValue("TestAgent") };
            
            (mockServerInstance as any).getRouteAgents = jest.fn().mockReturnValue([{
                method: "CUSTOM",
                path: "/test",
                agent: mockAgent,
                schema: undefined
            }]);

            await serve.call(mockServerInstance as any);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: "CUSTOM",
                    action: "unsupported_method",
                }),
                expect.stringContaining("Unsupported HTTP method")
            );
        });

        test("should register HEAD method using all()", async () => {
            const mockAgent = { getName: jest.fn().mockReturnValue("TestAgent") };
            
            (mockServerInstance as any).getRouteAgents = jest.fn().mockReturnValue([{
                method: "HEAD",
                path: "/test", 
                agent: mockAgent,
                schema: undefined
            }]);

            await serve.call(mockServerInstance as any);

            expect(mockHonoAll).toHaveBeenCalledWith("/test", expect.any(Function));
        });

        test("should handle HEAD request method properly in route agent handler", async () => {
            const { createAgentRouteHandler } = require("../../../../lib/server/methods/addRouteAgent");
            const mockHandler = jest.fn();
            createAgentRouteHandler.mockReturnValue(mockHandler);

            const mockAgent = { getName: jest.fn().mockReturnValue("TestAgent") };
            
            (mockServerInstance as any).getRouteAgents = jest.fn().mockReturnValue([{
                method: "HEAD",
                path: "/head-test", 
                agent: mockAgent,
                schema: undefined
            }]);

            let headHandler: any;
            mockHonoAll.mockImplementation((...args: any[]) => {
                const [path, handler] = args;
                if (path === "/head-test") {
                    headHandler = handler;
                }
            });

            await serve.call(mockServerInstance as any);

            // Test HEAD request handling (lines 145-148)
            const mockContext = {
                req: { method: "HEAD" },
                notFound: jest.fn().mockReturnValue("not found")
            };

            const result = headHandler(mockContext);
            expect(mockHandler).toHaveBeenCalledWith(mockContext);

            // Test non-HEAD request fallback
            mockContext.req.method = "POST";
            const notFoundResult = headHandler(mockContext);
            expect(mockContext.notFound).toHaveBeenCalled();
        });
    });

    describe("Static routes registration", () => {
        test("should register static routes", async () => {
            const { createStaticRouteHandler } = require("../../../../lib/server/methods/addRoute");
            createStaticRouteHandler.mockReturnValue(jest.fn());
            
            (mockServerInstance as any).getStaticRoutes = jest.fn().mockReturnValue([
                {
                    method: "GET",
                    path: "/api/status", 
                    responseData: { status: "ok" }
                },
                {
                    method: "POST",
                    path: "/api/webhook",
                    responseData: { received: true }
                }
            ]);

            await serve.call(mockServerInstance as any);

            expect(mockHonoGet).toHaveBeenCalledWith("/api/status", expect.any(Function));
            expect(mockHonoPost).toHaveBeenCalledWith("/api/webhook", expect.any(Function));
        });

        test("should handle all HTTP methods for static routes", async () => {
            const { createStaticRouteHandler } = require("../../../../lib/server/methods/addRoute");
            createStaticRouteHandler.mockReturnValue(jest.fn());
            
            const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];
            
            (mockServerInstance as any).getStaticRoutes = jest.fn().mockReturnValue(
                methods.map(method => ({
                    method,
                    path: `/${method.toLowerCase()}`,
                    responseData: { method }
                }))
            );

            await serve.call(mockServerInstance as any);

            expect(mockHonoGet).toHaveBeenCalledWith("/get", expect.any(Function));
            expect(mockHonoPost).toHaveBeenCalledWith("/post", expect.any(Function));
            expect(mockHonoPut).toHaveBeenCalledWith("/put", expect.any(Function));
            expect(mockHonoDelete).toHaveBeenCalledWith("/delete", expect.any(Function));
            expect(mockHonoPatch).toHaveBeenCalledWith("/patch", expect.any(Function));
            expect(mockHonoOptions).toHaveBeenCalledWith("/options", expect.any(Function));
            expect(mockHonoAll).toHaveBeenCalledWith("/head", expect.any(Function));
        });
        
        test("should skip /health route when overridden by static route", async () => {
            (mockServerInstance as any).getStaticRoutes = jest.fn().mockReturnValue([{
                method: "GET",
                path: "/health",
                responseData: { custom: true }
            }]);
            
            await serve.call(mockServerInstance as any);
            
            // Should not add duplicate /health route
            const healthCalls = mockHonoGet.mock.calls.filter(call => call[0] === "/health");
            expect(healthCalls.length).toBe(1); // Only the static route, not the default
        });

        test("should handle unsupported HTTP methods for static routes", async () => {
            const { createStaticRouteHandler } = require("../../../../lib/server/methods/addRoute");
            createStaticRouteHandler.mockReturnValue(jest.fn());
            
            const mockLogger = mockServerInstance.getLogger!() as any;
            jest.spyOn(mockLogger, "warn").mockImplementation(() => {});
            
            (mockServerInstance as any).getStaticRoutes = jest.fn().mockReturnValue([{
                method: "UNSUPPORTED",
                path: "/unsupported",
                responseData: { error: "unsupported method" }
            }]);

            await serve.call(mockServerInstance as any);

            expect(mockLogger.warn).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: "UNSUPPORTED",
                    action: "unsupported_method",
                }),
                expect.stringContaining("Unsupported HTTP method")
            );
        });

        test("should handle HEAD request method properly in static route handler", async () => {
            const { createStaticRouteHandler } = require("../../../../lib/server/methods/addRoute");
            const mockHandler = jest.fn();
            createStaticRouteHandler.mockReturnValue(mockHandler);
            
            (mockServerInstance as any).getStaticRoutes = jest.fn().mockReturnValue([{
                method: "HEAD",
                path: "/static-head",
                responseData: { data: "head response" }
            }]);

            let headHandler: any;
            mockHonoAll.mockImplementation((...args: any[]) => {
                const [path, handler] = args;
                if (path === "/static-head") {
                    headHandler = handler;
                }
            });

            await serve.call(mockServerInstance as any);

            // Test HEAD request handling for static routes (lines 206-209)
            const mockContext = {
                req: { method: "HEAD" },
                notFound: jest.fn().mockReturnValue("not found")
            };

            const result = headHandler(mockContext);
            expect(mockHandler).toHaveBeenCalledWith(mockContext);

            // Test non-HEAD request fallback
            mockContext.req.method = "GET";
            const notFoundResult = headHandler(mockContext);
            expect(mockContext.notFound).toHaveBeenCalled();
        });
    });

    describe("Node.js request handling", () => {
        test("should handle basic HTTP request in Node.js", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const mockReq = {
                url: "/",
                method: "GET",
                headers: { "content-type": "application/json" },
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            (mockHonoFetch as any).mockResolvedValue(
                new Response(JSON.stringify({ status: "ok" }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            expect(mockRes.statusCode).toBe(200);
            expect(mockRes.setHeader).toHaveBeenCalledWith("content-type", "application/json");
            expect(mockRes.end).toHaveBeenCalled();
        });

        test("should handle POST request with body in Node.js", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const chunks = [Buffer.from("test"), Buffer.from("body")];
            const mockReq = {
                url: "/api/test",
                method: "POST",
                headers: {},
                [Symbol.asyncIterator]: async function* () {
                    for (const chunk of chunks) yield chunk;
                },
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            (mockHonoFetch as any).mockResolvedValue(
                new Response(JSON.stringify({ success: true }), {
                    status: 201,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            expect(mockRes.statusCode).toBe(201);
            expect(mockHonoFetch).toHaveBeenCalled();
            
            const calledWith = (mockHonoFetch as any).mock.calls[0]?.[0] as Request;
            expect(calledWith).toBeInstanceOf(Request);
            expect(calledWith.method).toBe("POST");
        });

        test("should handle request processing errors in Node.js", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const mockReq = {
                url: "/",
                method: "GET",
                headers: {},
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            (mockHonoFetch as any).mockRejectedValue(new Error("Processing failed"));

            await requestHandler(mockReq, mockRes);

            expect(mockRes.statusCode).toBe(500);
            expect(mockRes.end).toHaveBeenCalledWith("Internal Server Error");
        });

        test("should handle array headers in Node.js request", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const mockReq = {
                url: "/",
                method: "GET",
                headers: {
                    "accept-encoding": ["gzip", "deflate"],
                    "accept": "application/json",
                },
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            (mockHonoFetch as any).mockResolvedValue(
                new Response(JSON.stringify({ status: "ok" }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            const calledWith = (mockHonoFetch as any).mock.calls[0]?.[0] as Request;
            expect(calledWith.headers.get("accept-encoding")).toBe("gzip, deflate");
        });

        test("should handle response with streaming body in Node.js", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const mockReq = {
                url: "/",
                method: "GET",
                headers: {},
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            const chunks = [
                new Uint8Array([72, 101]), // "He"
                new Uint8Array([108, 108, 111]), // "llo"
            ];
            
            let chunkIndex = 0;
            const mockReader = {
                read: jest.fn().mockImplementation(async () => {
                    if (chunkIndex < chunks.length) {
                        return { done: false, value: chunks[chunkIndex++] };
                    }
                    return { done: true, value: undefined };
                }),
            };

            const mockBody = { getReader: jest.fn().mockReturnValue(mockReader) };
            const mockResponse = new Response(null, {
                status: 200,
                headers: new Headers({ "content-type": "text/plain" }),
            });
            
            Object.defineProperty(mockResponse, "body", { value: mockBody });
            (mockHonoFetch as any).mockResolvedValue(mockResponse);

            await requestHandler(mockReq, mockRes);

            expect(mockRes.write).toHaveBeenCalledTimes(2);
            expect(mockRes.end).toHaveBeenCalled();
        });

        test("should handle response without body in Node.js", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const mockReq = {
                url: "/",
                method: "GET",
                headers: {},
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            const mockResponse = new Response(null, {
                status: 204,
                headers: new Headers({}),
            });
            
            Object.defineProperty(mockResponse, "body", { value: null });
            (mockHonoFetch as any).mockResolvedValue(mockResponse);

            await requestHandler(mockReq, mockRes);

            expect(mockRes.statusCode).toBe(204);
            expect(mockRes.write).not.toHaveBeenCalled();
            expect(mockRes.end).toHaveBeenCalled();
        });

        test("should handle undefined URL and method in Node.js", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await serve.call(mockServerInstance as any);

            const mockReq = {
                url: undefined,
                method: undefined,
                headers: {},
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            (mockHonoFetch as any).mockResolvedValue(
                new Response(JSON.stringify({ status: "ok" }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            const calledWith = (mockHonoFetch as any).mock.calls[0]?.[0] as Request;
            expect(calledWith.url).toBe("http://0.0.0.0:3000/");
            expect(calledWith.method).toBe("GET");
        });
    });

    describe("Default route handlers", () => {
        test("should handle default root route", async () => {
            let rootHandler: any;
            mockHonoGet.mockImplementation((path: any, handler: any) => {
                if (path === "/") rootHandler = handler;
            });

            await serve.call(mockServerInstance as any);

            const mockContext = {
                json: jest.fn(),
            };

            rootHandler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith({
                status: "ok",
                server: "TestServer",
                timestamp: expect.any(String),
                version: "1.0.0",
            });
        });

        test("should handle default health route", async () => {
            let healthHandler: any;
            mockHonoGet.mockImplementation((path: any, handler: any) => {
                if (path === "/health") healthHandler = handler;
            });

            await serve.call(mockServerInstance as any);

            const mockContext = {
                json: jest.fn(),
            };

            healthHandler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith({
                status: "healthy",
                server: "TestServer",
                timestamp: expect.any(String),
            });
        });
    });
});