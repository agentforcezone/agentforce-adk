import { describe, expect, test, beforeEach, afterEach } from "@jest/globals";
import { AgentForceAgent } from "../lib/agent";
import type { AgentConfig } from "../lib/types";

// Mock Hono before any imports that use it
jest.mock("hono");

// Mock Node.js http module
jest.mock("node:http", () => ({
    default: { createServer: jest.fn() },
    createServer: jest.fn(),
}), { virtual: true });

describe("AgentForceAgent serve Method Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = { name: "TestAgent" };
    
    let originalBun: any;
    let originalDeno: any;
    
    // Mock functions
    let mockHonoUse: jest.Mock;
    let mockHonoGet: jest.Mock;
    let mockHonoFetch: jest.Mock;
    let mockCreateServer: jest.Mock;
    let mockListen: jest.Mock;
    let mockServer: any;
    
    beforeEach(() => {
        // Setup Hono mock
        mockHonoUse = jest.fn();
        mockHonoGet = jest.fn();
        mockHonoFetch = jest.fn();
        
        const mockHonoInstance = {
            use: mockHonoUse,
            get: mockHonoGet,
            fetch: mockHonoFetch,
        };
        
        const { Hono } = require("hono");
        Hono.mockImplementation(() => mockHonoInstance);
        
        // Setup http mock
        mockCreateServer = jest.fn();
        mockListen = jest.fn((_port: number, _host: string, callback?: () => void) => {
            if (callback) callback();
        });
        mockServer = { listen: mockListen };
        mockCreateServer.mockReturnValue(mockServer);
        
        const http = require("node:http");
        http.createServer = mockCreateServer;
        http.default = { createServer: mockCreateServer };
        
        // Create agent
        agent = new AgentForceAgent(testConfig);
        
        // Save and clear runtime globals
        originalBun = (global as any).Bun;
        originalDeno = (global as any).Deno;
        delete (global as any).Bun;
        delete (global as any).Deno;
    });
    
    afterEach(() => {
        // Restore globals
        if (originalBun) (global as any).Bun = originalBun;
        if (originalDeno) (global as any).Deno = originalDeno;
        jest.clearAllMocks();
    });

    describe("Input validation", () => {
        test("should validate host parameter", async () => {
            await expect(agent.serve("", 3000)).rejects.toThrow("Host must be a non-empty string");
            await expect(agent.serve(null as any, 3000)).rejects.toThrow("Host must be a non-empty string");
        });

        test("should validate port parameter", async () => {
            await expect(agent.serve("0.0.0.0", 0)).rejects.toThrow("Port must be a valid number between 1 and 65535");
            await expect(agent.serve("0.0.0.0", -1)).rejects.toThrow("Port must be a valid number between 1 and 65535");
            await expect(agent.serve("0.0.0.0", 65536)).rejects.toThrow("Port must be a valid number between 1 and 65535");
            await expect(agent.serve("0.0.0.0", "invalid" as any)).rejects.toThrow("Port must be a valid number between 1 and 65535");
        });
    });

    describe("Runtime-specific server startup", () => {
        test("should start server with Bun runtime", async () => {
            const mockBunServe = jest.fn().mockReturnValue({
                hostname: "0.0.0.0",
                port: 3000,
            });
            
            (global as any).Bun = { serve: mockBunServe };
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "info").mockImplementation();

            await agent.serve("0.0.0.0", 3000);

            expect(mockBunServe).toHaveBeenCalledWith({
                hostname: "0.0.0.0",
                port: 3000,
                fetch: expect.any(Function),
            });

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    runtime: "bun",
                    action: "server_started",
                }),
                expect.stringContaining("Agent server running")
            );
        });

        test("should start server with Deno runtime", async () => {
            const mockDenoServe = jest.fn();
            (global as any).Deno = { serve: mockDenoServe };
            
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "info").mockImplementation();

            await agent.serve("localhost", 8080);

            expect(mockDenoServe).toHaveBeenCalledWith(
                { hostname: "localhost", port: 8080 },
                expect.any(Function)
            );

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    runtime: "deno",
                    action: "server_started",
                }),
                expect.stringContaining("Agent server running")
            );
        });

        test("should start server with Node.js runtime", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "info").mockImplementation();

            await agent.serve("127.0.0.1", 4000);

            expect(mockCreateServer).toHaveBeenCalledWith(expect.any(Function));
            expect(mockListen).toHaveBeenCalledWith(4000, "127.0.0.1", expect.any(Function));

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    runtime: "nodejs",
                    action: "server_started",
                }),
                expect.stringContaining("Agent server running")
            );
        });
    });

    describe("Server initialization", () => {
        test("should log server startup information", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "info").mockImplementation();

            await agent.serve();

            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    agentName: "TestAgent",
                    action: "server_starting",
                }),
                expect.stringContaining("Starting server for agent")
            );
        });

        test("should handle server startup errors", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "error").mockImplementation();

            mockCreateServer.mockImplementation(() => {
                throw new Error("Failed to create server");
            });

            // serve() no longer throws, it just logs and returns
            await agent.serve();

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "Failed to create server",
                    action: "server_start_failed",
                }),
                "Failed to start agent server: Failed to create server"
            );
        });

        // LINE 195 COVERAGE: Test non-Error exception handling in server startup
        test("should handle non-Error exceptions in server startup", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "error").mockImplementation();

            mockCreateServer.mockImplementation(() => {
                throw "String error not an Error object"; // Non-Error exception
            });

            // serve() no longer throws, it just logs and returns
            await agent.serve();

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "String error not an Error object",
                    action: "server_start_failed",
                }),
                "Failed to start agent server: String error not an Error object"
            );
        });
    });

    describe("Hono app configuration", () => {
        test("should configure Hono middleware and routes", async () => {
            await agent.serve();

            expect(mockHonoUse).toHaveBeenCalledWith("*", expect.any(Function));
            expect(mockHonoGet).toHaveBeenCalledWith("/", expect.any(Function));
        });

        test("should handle middleware logging", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "info").mockImplementation();
            
            let middlewareHandler: any;
            mockHonoUse.mockImplementation((path: string, handler: any) => {
                if (path === "*") middlewareHandler = handler;
            });

            await agent.serve();

            const mockContext = {
                req: { method: "POST", path: "/api/test" }
            };
            
            const mockNext = jest.fn();
            await middlewareHandler(mockContext, mockNext);

            expect(mockLogger.info).toHaveBeenCalledWith({
                httpMethod: "POST",
                route: "/api/test",
            });
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe("GET request handling", () => {
        test("should handle GET request without prompt", async () => {
            let getHandler: any;
            mockHonoGet.mockImplementation((path: string, handler: any) => {
                if (path === "/") getHandler = handler;
            });

            await agent.serve();

            const mockContext = {
                req: { query: jest.fn().mockReturnValue(undefined) },
                json: jest.fn(),
            };

            await getHandler(mockContext);

            expect(mockContext.json).toHaveBeenCalledWith({
                status: "ok",
                agent: "TestAgent",
            });
        });

        test("should handle GET request with prompt query", async () => {
            let getHandler: any;
            mockHonoGet.mockImplementation((path: string, handler: any) => {
                if (path === "/") getHandler = handler;
            });

            jest.spyOn(agent, "prompt").mockReturnThis();
            jest.spyOn(agent, "getResponse").mockResolvedValue("Test response");

            await agent.serve();

            const mockContext = {
                req: { query: jest.fn().mockReturnValue("test prompt") },
                json: jest.fn(),
            };

            await getHandler(mockContext);

            expect(agent.prompt).toHaveBeenCalledWith("test prompt");
            expect(agent.getResponse).toHaveBeenCalled();
            expect(mockContext.json).toHaveBeenCalledWith({
                status: "ok",
                agent: "TestAgent",
                prompt: "test prompt",
                response: "Test response",
            });
        });

        test("should handle prompt execution errors", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "error").mockImplementation();
            
            let getHandler: any;
            mockHonoGet.mockImplementation((path: string, handler: any) => {
                if (path === "/") getHandler = handler;
            });

            jest.spyOn(agent, "prompt").mockReturnThis();
            jest.spyOn(agent, "getResponse").mockRejectedValue(new Error("Execution failed"));

            await agent.serve();

            const mockContext = {
                req: { query: jest.fn().mockReturnValue("failing prompt") },
                json: jest.fn().mockReturnValue({}),
            };

            await getHandler(mockContext);

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "Execution failed",
                    action: "prompt_execution_failed",
                }),
                "Failed to execute agent with prompt"
            );

            expect(mockContext.json).toHaveBeenCalledWith(
                {
                    status: "error",
                    agent: "TestAgent",
                    prompt: "failing prompt",
                    error: "Execution failed",
                },
                500
            );
        });
    });

    describe("Node.js request handling", () => {
        test("should handle basic GET request", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

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

            mockHonoFetch.mockResolvedValue(
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

        test("should handle POST request with body", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

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

            mockHonoFetch.mockResolvedValue(
                new Response(JSON.stringify({ success: true }), {
                    status: 201,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            expect(mockRes.statusCode).toBe(201);
            expect(mockHonoFetch).toHaveBeenCalled();
            
            // Check that a Request object was created with correct properties
            const calledWith = mockHonoFetch.mock.calls[0][0];
            expect(calledWith).toBeInstanceOf(Request);
            expect(calledWith.method).toBe("POST");
            expect(calledWith.url).toBe("http://0.0.0.0:3000/api/test");
            
            // Verify body was collected correctly
            const bodyText = await calledWith.text();
            expect(bodyText).toBe("testbody");
        });

        test("should handle response with body streaming", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

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
            mockHonoFetch.mockResolvedValue(mockResponse);

            await requestHandler(mockReq, mockRes);

            expect(mockBody.getReader).toHaveBeenCalled();
            expect(mockReader.read).toHaveBeenCalledTimes(3);
            expect(mockRes.write).toHaveBeenCalledTimes(2);
            expect(mockRes.end).toHaveBeenCalled();
        });

        test("should handle response without body", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

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
            mockHonoFetch.mockResolvedValue(mockResponse);

            await requestHandler(mockReq, mockRes);

            expect(mockRes.statusCode).toBe(204);
            expect(mockRes.write).not.toHaveBeenCalled();
            expect(mockRes.end).toHaveBeenCalled();
        });

        // LINE 128 COVERAGE: Direct test of array header processing (focused coverage)
        test("should process array headers specifically for line 128 coverage", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

            // Create a very specific scenario that will hit line 128
            const chunks = [Buffer.from("test"), Buffer.from("body")];
            const mockReq = {
                url: "/api/test",
                method: "POST", 
                headers: {
                    // Use specific headers that Node.js commonly makes into arrays
                    "set-cookie": ["cookie1=value1; Path=/", "cookie2=value2; Path=/"], // Common array header
                    "accept": "application/json", // Regular string header
                },
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

            mockHonoFetch.mockResolvedValue(
                new Response(JSON.stringify({ success: true }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            // Verify request was processed and array headers were handled
            const calledWith = mockHonoFetch.mock.calls[0][0];
            expect(calledWith).toBeInstanceOf(Request);
            
            // Check that array header was joined - this should hit line 128
            expect(calledWith.headers.get("set-cookie")).toBe("cookie1=value1; Path=/, cookie2=value2; Path=/");
            expect(calledWith.headers.get("accept")).toBe("application/json");
        });

        // LINE 128 COVERAGE: Test headers with array values (Node.js specific case)
        test("should handle headers with array values (multiple header values)", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

            const mockReq = {
                url: "/",
                method: "GET",
                headers: {
                    "accept": "text/html",
                    "accept-encoding": ["gzip", "deflate", "br"], // Array of values
                    "x-forwarded-for": ["192.168.1.1", "10.0.0.1"], // Multiple IPs
                    "cookie": ["session=abc123", "user=john"], // Multiple cookies
                },
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            mockHonoFetch.mockResolvedValue(
                new Response(JSON.stringify({ status: "ok" }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            // Verify that the Request was created with properly formatted headers
            const calledWith = mockHonoFetch.mock.calls[0][0];
            expect(calledWith).toBeInstanceOf(Request);
            
            // Check that array headers were joined with commas
            expect(calledWith.headers.get("accept-encoding")).toBe("gzip, deflate, br");
            expect(calledWith.headers.get("x-forwarded-for")).toBe("192.168.1.1, 10.0.0.1");
            expect(calledWith.headers.get("cookie")).toBe("session=abc123, user=john");
            expect(calledWith.headers.get("accept")).toBe("text/html");
            
            expect(mockRes.statusCode).toBe(200);
            expect(mockRes.end).toHaveBeenCalled();
        });

        test("should handle request processing errors", async () => {
            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "error").mockImplementation();

            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

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

            mockHonoFetch.mockRejectedValue(new Error("Processing failed"));

            await requestHandler(mockReq, mockRes);

            expect(mockLogger.error).toHaveBeenCalledWith("Error processing request:", expect.any(Error));
            expect(mockRes.statusCode).toBe(500);
            expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "application/json");
            expect(mockRes.write).toHaveBeenCalledWith(JSON.stringify({ error: "Internal Server Error" }));
        });

        // LINES 70-78 COVERAGE: Test non-Error exception handling in GET route
        test("should handle non-Error exceptions in GET request handler", async () => {
            let getHandler: any;
            mockHonoGet.mockImplementation((path: string, handler: any) => {
                if (path === "/") getHandler = handler;
            });

            // Mock agent methods to throw non-Error
            jest.spyOn(agent, "prompt").mockReturnThis();
            jest.spyOn(agent, "getResponse").mockRejectedValue("String error not an Error object");

            const mockLogger = (agent as any).getLogger();
            jest.spyOn(mockLogger, "error").mockImplementation();

            await agent.serve();

            const mockContext = {
                req: { query: jest.fn().mockReturnValue("test prompt") },
                json: jest.fn(),
            };

            await getHandler(mockContext);

            // Should handle String(error) path - line 70
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: "String error not an Error object",
                    action: "prompt_execution_failed",
                }),
                "Failed to execute agent with prompt"
            );

            // Should return error with "Unknown error" - line 78
            expect(mockContext.json).toHaveBeenCalledWith(
                {
                    status: "error",
                    agent: "TestAgent",
                    prompt: "test prompt",
                    error: "Unknown error",
                },
                500
            );
        });

        // LINE 121 COVERAGE: Test undefined req.url handling
        test("should handle undefined req.url in Node.js handler", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

            const mockReq = {
                url: undefined, // This will trigger req.url || "/"
                method: "GET",
                headers: {},
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            mockHonoFetch.mockResolvedValue(
                new Response(JSON.stringify({ status: "ok" }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            // Verify that default URL "/" was used
            const calledWith = mockHonoFetch.mock.calls[0][0];
            expect(calledWith.url).toBe("http://0.0.0.0:3000/");
        });

        // LINE 145 COVERAGE: Test undefined req.method handling
        test("should handle undefined req.method in Node.js handler", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

            const mockReq = {
                url: "/test",
                method: undefined, // This will trigger req.method || "GET"
                headers: {},
            };

            const mockRes = {
                statusCode: 0,
                setHeader: jest.fn(),
                write: jest.fn(),
                end: jest.fn(),
            };

            mockHonoFetch.mockResolvedValue(
                new Response(JSON.stringify({ status: "ok" }), {
                    status: 200,
                    headers: new Headers({ "content-type": "application/json" }),
                })
            );

            await requestHandler(mockReq, mockRes);

            // Verify that default method "GET" was used
            const calledWith = mockHonoFetch.mock.calls[0][0];
            expect(calledWith.method).toBe("GET");
        });

        // LINES 168-170 COVERAGE: Test response streaming with undefined value
        test("should handle undefined values in response stream", async () => {
            let requestHandler: any;
            mockCreateServer.mockImplementation((handler: any) => {
                requestHandler = handler;
                return mockServer;
            });

            await agent.serve();

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

            // Mock reader that returns undefined values to test line 168 condition
            let chunkIndex = 0;
            const chunks = [
                new Uint8Array([72, 101]), // "He"
                undefined, // This will test the if (value) condition on line 168
                new Uint8Array([108, 108, 111]), // "llo"
            ];
            
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
            mockHonoFetch.mockResolvedValue(mockResponse);

            await requestHandler(mockReq, mockRes);

            expect(mockReader.read).toHaveBeenCalledTimes(4); // 3 chunks + done
            expect(mockRes.write).toHaveBeenCalledTimes(2); // Only called for non-undefined values
            expect(mockRes.end).toHaveBeenCalled();
        });
    });
});