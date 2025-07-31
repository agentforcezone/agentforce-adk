import { describe, expect, test, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { AgentForceAgent } from "../../lib/agent";
import { 
    createHtmlFileHandler, 
    createFormPostHandler, 
    validateHttpMethod, 
    normalizePath 
} from "../../lib/server/shared/handlers";
import type { Context } from "hono";
import type { RouteAgentSchema } from "../../lib/server/methods/addRouteAgent";

// Mock Hono Context
const createMockContext = (overrides: Partial<Context> = {}): Context => {
    const mockContext = {
        html: mock((content: string, status?: number) => {
            return new Response(content, {
                status: status || 200,
                headers: { "Content-Type": "text/html" }
            });
        }),
        json: mock((data: any, status?: number) => {
            return new Response(JSON.stringify(data), {
                status: status || 200,
                headers: { "Content-Type": "application/json" }
            });
        }),
        req: {
            parseBody: mock(async () => ({})),
            ...overrides.req
        },
        ...overrides
    } as unknown as Context;
    
    return mockContext;
};

describe('Server Shared Handlers Tests', () => {
    let agent: AgentForceAgent;
    let mockConsoleError: any;

    beforeEach(() => {
        agent = new AgentForceAgent({ name: "TestAgent" });
        mockConsoleError = spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        mockConsoleError.mockRestore();
    });

    describe('createHtmlFileHandler', () => {
        test("should create a handler function", () => {
            const handler = createHtmlFileHandler("/test/path.html");
            expect(typeof handler).toBe("function");
        });

        test("should handle file not found error", async () => {
            const handler = createHtmlFileHandler("/nonexistent/file.html");
            const context = createMockContext();
            
            const response = await handler(context);
            
            expect(context.html).toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalled();
            
            // Should return 404 error HTML
            const calls = (context.html as any).mock.calls;
            expect(calls[0][1]).toBe(404); // Status code
            expect(calls[0][0]).toContain("404 - File Not Found");
            expect(calls[0][0]).toContain("/nonexistent/file.html");
        });

        test("should handle Handlebars template files with template data", async () => {
            // Create a temporary handlebars file for testing
            const { writeFileSync, unlinkSync, existsSync } = await import("node:fs");
            const testFile = "test-template.hbs";
            const templateContent = "<h1>Hello {{name}}!</h1><p>Welcome to {{app}}</p>";
            const templateData = { name: "Test User", app: "AgentForce ADK" };
            
            try {
                writeFileSync(testFile, templateContent);
                
                const handler = createHtmlFileHandler(testFile, templateData);
                const context = createMockContext();
                
                await handler(context);
                
                expect(context.html).toHaveBeenCalled();
                const htmlCall = (context.html as any).mock.calls[0];
                expect(htmlCall[0]).toContain("Hello Test User!");
                expect(htmlCall[0]).toContain("Welcome to AgentForce ADK");
            } finally {
                if (existsSync(testFile)) {
                    unlinkSync(testFile);
                }
            }
        });

        test("should handle static HTML files without template data", async () => {
            // Create a temporary HTML file for testing
            const { writeFileSync, unlinkSync, existsSync } = await import("node:fs");
            const testFile = "test-static.html";
            const htmlContent = "<h1>Static HTML</h1><p>This is static content</p>";
            
            try {
                writeFileSync(testFile, htmlContent);
                
                const handler = createHtmlFileHandler(testFile);
                const context = createMockContext();
                
                await handler(context);
                
                expect(context.html).toHaveBeenCalled();
                const htmlCall = (context.html as any).mock.calls[0];
                expect(htmlCall[0]).toBe(htmlContent);
            } finally {
                if (existsSync(testFile)) {
                    unlinkSync(testFile);
                }
            }
        });

        test("should handle Handlebars template files without template data", async () => {
            // Create a temporary handlebars file for testing
            const { writeFileSync, unlinkSync, existsSync } = await import("node:fs");
            const testFile = "test-no-data.hbs";
            const templateContent = "<h1>Hello {{name}}!</h1><p>No data provided</p>";
            
            try {
                writeFileSync(testFile, templateContent);
                
                const handler = createHtmlFileHandler(testFile); // No template data
                const context = createMockContext();
                
                await handler(context);
                
                expect(context.html).toHaveBeenCalled();
                const htmlCall = (context.html as any).mock.calls[0];
                expect(htmlCall[0]).toContain("Hello !"); // Empty name since no data provided
                expect(htmlCall[0]).toContain("No data provided");
            } finally {
                if (existsSync(testFile)) {
                    unlinkSync(testFile);
                }
            }
        });

        test("should handle template data", () => {
            const templateData = { title: "Test Page", content: "Hello World" };
            const handler = createHtmlFileHandler("/test/template.hbs", templateData);
            expect(typeof handler).toBe("function");
        });

        test("should handle server errors gracefully", async () => {
            const handler = createHtmlFileHandler("/test/file.html");
            const context = createMockContext();
            
            const response = await handler(context);
            
            expect(context.html).toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalled();
        });

        test("should handle non-ENOENT errors with 500 status", async () => {
            // Test by creating a valid file first, then trying to test a non-file-related error
            // Let's test the Handlebars compilation error path instead
            const { writeFileSync, unlinkSync, existsSync } = await import("node:fs");
            const testFile = "test-bad-template.hbs";
            // Create a handlebars template with invalid syntax to cause a compilation error
            const badTemplateContent = "<h1>Hello {{unclosed</h1>"; // Missing closing }}
            
            try {
                writeFileSync(testFile, badTemplateContent);
                
                const handler = createHtmlFileHandler(testFile, { name: "Test" });
                const context = createMockContext();
                
                const response = await handler(context);
                
                expect(context.html).toHaveBeenCalled();
                expect(mockConsoleError).toHaveBeenCalled();
                
                const calls = (context.html as any).mock.calls;
                const lastCall = calls[calls.length - 1];
                
                // Should return 500 error for template compilation errors
                expect(lastCall[1]).toBe(500);
                expect(lastCall[0]).toContain("500 - Internal Server Error");
            } finally {
                if (existsSync(testFile)) {
                    unlinkSync(testFile);
                }
            }
        });

        test("should differentiate between .hbs and regular HTML files", () => {
            const hbsHandler = createHtmlFileHandler("template.hbs");
            const htmlHandler = createHtmlFileHandler("page.html");
            
            expect(typeof hbsHandler).toBe("function");
            expect(typeof htmlHandler).toBe("function");
        });
    });

    describe('createFormPostHandler', () => {
        test("should create a handler function", () => {
            const handler = createFormPostHandler(agent, "/test");
            expect(typeof handler).toBe("function");
        });

        test("should handle valid form data", async () => {
            const formData = { prompt: "Test prompt", name: "Test User" };
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            // Mock agent getResponse
            const mockGetResponse = spyOn(agent, "getResponse").mockResolvedValue("Test response");
            const mockPrompt = spyOn(agent, "prompt").mockReturnValue(agent);
            
            const handler = createFormPostHandler(agent, "/test");
            const response = await handler(context);
            
            expect(context.req.parseBody).toHaveBeenCalled();
            expect(mockPrompt).toHaveBeenCalledWith("Test prompt");
            expect(mockGetResponse).toHaveBeenCalled();
            expect(context.json).toHaveBeenCalled();
            
            // Check response structure
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("success", true);
            expect(jsonCall[0]).toHaveProperty("prompt", "Test prompt");
            expect(jsonCall[0]).toHaveProperty("response", "Test response");
            expect(jsonCall[0]).toHaveProperty("agentName", "TestAgent");
            
            mockGetResponse.mockRestore();
            mockPrompt.mockRestore();
        });

        test("should handle missing prompt", async () => {
            const formData = { name: "Test User" }; // No prompt
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const handler = createFormPostHandler(agent, "/test");
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("error", "Missing or invalid prompt");
            expect(jsonCall[1]).toBe(400); // Status code
        });

        test("should handle empty prompt", async () => {
            const formData = { prompt: "" };
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const handler = createFormPostHandler(agent, "/test");
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("error", "Missing or invalid prompt");
            expect(jsonCall[1]).toBe(400);
        });

        test("should handle non-string prompt", async () => {
            const formData = { prompt: 123 }; // Non-string prompt
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const handler = createFormPostHandler(agent, "/test");
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("error", "Missing or invalid prompt");
            expect(jsonCall[1]).toBe(400);
        });

        test("should validate schema input fields", async () => {
            const schema: RouteAgentSchema = {
                input: ["prompt", "name", "email"],
                output: ["success", "response"]
            };
            
            const formData = { prompt: "Test", name: "John" }; // Missing email
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const handler = createFormPostHandler(agent, "/test", schema);
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("error", "Missing required fields");
            expect(jsonCall[0].missingFields).toContain("email");
            expect(jsonCall[1]).toBe(400);
        });

        test("should handle unexpected fields in schema", async () => {
            const schema: RouteAgentSchema = {
                input: ["prompt"],
                output: ["success", "response"]
            };
            
            const formData = { prompt: "Test", extraField: "unexpected" };
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const handler = createFormPostHandler(agent, "/test", schema);
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("error", "Unexpected fields in request");
            expect(jsonCall[0].unexpectedFields).toContain("extraField");
            expect(jsonCall[1]).toBe(400);
        });

        test("should filter output based on schema", async () => {
            const schema: RouteAgentSchema = {
                input: ["prompt"],
                output: ["success", "response"] // Only these fields should be returned
            };
            
            const formData = { prompt: "Test prompt" };
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const mockGetResponse = spyOn(agent, "getResponse").mockResolvedValue("Test response");
            const mockPrompt = spyOn(agent, "prompt").mockReturnValue(agent);
            
            const handler = createFormPostHandler(agent, "/test", schema);
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("success", true);
            expect(jsonCall[0]).toHaveProperty("response", "Test response");
            expect(jsonCall[0]).not.toHaveProperty("agentName"); // Should be filtered out
            expect(jsonCall[0]).not.toHaveProperty("prompt"); // Should be filtered out
            
            mockGetResponse.mockRestore();
            mockPrompt.mockRestore();
        });

        test("should handle agent execution errors", async () => {
            const formData = { prompt: "Test prompt" };
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const mockPrompt = spyOn(agent, "prompt").mockReturnValue(agent);
            const mockGetResponse = spyOn(agent, "getResponse").mockRejectedValue(new Error("Agent error"));
            
            const handler = createFormPostHandler(agent, "/test");
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            expect(mockConsoleError).toHaveBeenCalled();
            
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("success", false);
            expect(jsonCall[0]).toHaveProperty("error", "Internal server error");
            expect(jsonCall[1]).toBe(500);
            
            mockPrompt.mockRestore();
            mockGetResponse.mockRestore();
        });

        test("should include additional input fields in response when in schema", async () => {
            const schema: RouteAgentSchema = {
                input: ["prompt", "name", "age"],
                output: ["success", "prompt", "response", "agentName", "name", "age"]
            };
            
            const formData = { prompt: "Test", name: "John", age: "25" };
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const mockGetResponse = spyOn(agent, "getResponse").mockResolvedValue("Test response");
            const mockPrompt = spyOn(agent, "prompt").mockReturnValue(agent);
            
            const handler = createFormPostHandler(agent, "/test", schema);
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("name", "John");
            expect(jsonCall[0]).toHaveProperty("age", "25");
            
            mockGetResponse.mockRestore();
            mockPrompt.mockRestore();
        });
    });

    describe('validateHttpMethod', () => {
        test("should validate and normalize valid HTTP methods", () => {
            expect(validateHttpMethod("get")).toBe("GET");
            expect(validateHttpMethod("POST")).toBe("POST");
            expect(validateHttpMethod("put")).toBe("PUT");
            expect(validateHttpMethod("Delete")).toBe("DELETE");
            expect(validateHttpMethod("PATCH")).toBe("PATCH");
            expect(validateHttpMethod("head")).toBe("HEAD");
            expect(validateHttpMethod("options")).toBe("OPTIONS");
        });

        test("should throw error for invalid HTTP methods", () => {
            expect(() => validateHttpMethod("INVALID")).toThrow("Invalid HTTP method");
            expect(() => validateHttpMethod("CONNECT")).toThrow("Invalid HTTP method");
            expect(() => validateHttpMethod("TRACE")).toThrow("Invalid HTTP method");
        });

        test("should throw error for empty or non-string methods", () => {
            expect(() => validateHttpMethod("")).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod(null as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod(undefined as any)).toThrow("HTTP method must be a non-empty string");
            expect(() => validateHttpMethod(123 as any)).toThrow("HTTP method must be a non-empty string");
        });

        test("should include valid methods in error message", () => {
            try {
                validateHttpMethod("INVALID");
            } catch (error) {
                expect(error instanceof Error).toBe(true);
                expect((error as Error).message).toContain("Valid methods are:");
                expect((error as Error).message).toContain("GET");
                expect((error as Error).message).toContain("POST");
            }
        });
    });

    describe('normalizePath', () => {
        test("should normalize paths correctly", () => {
            expect(normalizePath("/api/test")).toBe("/api/test");
            expect(normalizePath("api/test")).toBe("/api/test");
            expect(normalizePath("test")).toBe("/test");
            expect(normalizePath("/")).toBe("/");
        });

        test("should handle paths that already start with /", () => {
            expect(normalizePath("/already/normalized")).toBe("/already/normalized");
            expect(normalizePath("/test/")).toBe("/test/");
        });

        test("should throw error for invalid paths", () => {
            expect(() => normalizePath("")).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath(null as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath(undefined as any)).toThrow("Route path must be a non-empty string");
            expect(() => normalizePath(123 as any)).toThrow("Route path must be a non-empty string");
        });

        test("should handle edge cases", () => {
            expect(normalizePath("a")).toBe("/a");
            expect(normalizePath("api")).toBe("/api");
            expect(normalizePath("complex/nested/path")).toBe("/complex/nested/path");
        });
    });

    describe('Integration Tests', () => {
        test("should work together in typical server setup", () => {
            // Test that all functions can be used together
            const method = validateHttpMethod("post");
            const path = normalizePath("api/form");
            const htmlHandler = createHtmlFileHandler("form.html");
            const formHandler = createFormPostHandler(agent, path);
            
            expect(method).toBe("POST");
            expect(path).toBe("/api/form");
            expect(typeof htmlHandler).toBe("function");
            expect(typeof formHandler).toBe("function");
        });

        test("should handle complex schema validation", async () => {
            const schema: RouteAgentSchema = {
                input: ["prompt", "userId", "sessionId"],
                output: ["success", "response", "timestamp"]
            };
            
            const formData = { 
                prompt: "Complex test", 
                userId: "12345", 
                sessionId: "abcdef",
                extraField: "should be rejected"
            };
            
            const context = createMockContext({
                req: {
                    parseBody: mock(async () => formData)
                }
            });
            
            const handler = createFormPostHandler(agent, "/complex", schema);
            const response = await handler(context);
            
            expect(context.json).toHaveBeenCalled();
            const jsonCall = (context.json as any).mock.calls[0];
            expect(jsonCall[0]).toHaveProperty("error", "Unexpected fields in request");
            expect(jsonCall[0].unexpectedFields).toContain("extraField");
            expect(jsonCall[1]).toBe(400);
        });
    });
});