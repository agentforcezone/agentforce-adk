import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import type { AgentForceAgent } from "../../../lib/agent";
import type { AgentForceLogger } from "../../../lib/types";
import type { RouteAgentSchema } from "../../../lib/server/methods/addRouteAgent";

// Import the function to test
import { addFormTrigger } from "../../../lib/server/methods/addFormTrigger";

// Create mock interfaces for testing
interface MockServer {
    getName(): string;
    getLogger(): AgentForceLogger;
    addToStaticRoutes(route: any): void;
}

interface MockAgent {
    getName(): string;
}

describe("AgentForceServer addFormTrigger Method Tests", () => {
    let mockServer: MockServer;
    let mockAgent: MockAgent;
    let mockLogger: AgentForceLogger;
    let addToStaticRoutesSpy: jest.Mock;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Create spy for addToStaticRoutes
        addToStaticRoutesSpy = jest.fn();

        // Create mock server
        mockServer = {
            getName: () => "TestServer",
            getLogger: () => mockLogger,
            addToStaticRoutes: addToStaticRoutesSpy
        };

        // Create mock agent
        mockAgent = {
            getName: () => "TestAgent"
        };

        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test("should return server instance for method chaining", () => {
        const result = addFormTrigger.call(
            mockServer as any,
            "test-form",
            "test.html",
            mockAgent as unknown as AgentForceAgent
        );

        expect(result).toBe(mockServer);
    });

    test("should validate formName parameter", () => {
        // Test empty string
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "",
                "test.html",
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("Form name must be a non-empty string");

        // Test non-string type
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                null as any,
                "test.html",
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("Form name must be a non-empty string");

        // Test undefined
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                undefined as any,
                "test.html",
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("Form name must be a non-empty string");

        // Test non-string types
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                123 as any,
                "test.html",
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("Form name must be a non-empty string");
    });

    test("should validate filePath parameter", () => {
        // Test empty string
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                "",
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("File path must be a non-empty string");

        // Test non-string type
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                123 as any,
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("File path must be a non-empty string");

        // Test null
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                null as any,
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("File path must be a non-empty string");

        // Test undefined
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                undefined as any,
                mockAgent as unknown as AgentForceAgent
            );
        }).toThrow("File path must be a non-empty string");
    });

    test("should validate agent parameter", () => {
        // Test null agent
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                "test.html",
                null as any
            );
        }).toThrow("Agent instance is required");

        // Test undefined agent
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                "test.html",
                undefined as any
            );
        }).toThrow("Agent instance is required");
    });

    test("should add GET and POST routes to static routes", () => {
        addFormTrigger.call(
            mockServer as any,
            "contact-form",
            "forms/contact.html",
            mockAgent as unknown as AgentForceAgent
        );

        expect(addToStaticRoutesSpy).toHaveBeenCalledTimes(2);

        // Check that both routes were added
        const calls = addToStaticRoutesSpy.mock.calls;
        expect(calls[0]?.[0]).toMatchObject({
            method: "GET",
            path: "/contact-form"
        });
        expect(calls[1]?.[0]).toMatchObject({
            method: "POST", 
            path: "/contact-form"
        });
    });

    test("should handle form names that need path normalization", () => {
        addFormTrigger.call(
            mockServer as any,
            "simple-form", // No leading slash
            "simple.html",
            mockAgent as unknown as AgentForceAgent
        );

        // Both routes should use normalized path
        const calls = addToStaticRoutesSpy.mock.calls;
        expect(calls[0]?.[0]).toMatchObject({
            method: "GET",
            path: "/simple-form"
        });
        expect(calls[1]?.[0]).toMatchObject({
            method: "POST",
            path: "/simple-form"
        });
    });

    test("should handle schema parameter when provided", () => {
        const schema: RouteAgentSchema = {
            input: ["prompt", "name", "email"],
            output: ["success", "response", "agentName"]
        };

        addFormTrigger.call(
            mockServer as any,
            "advanced-form",
            "advanced.html",
            mockAgent as unknown as AgentForceAgent,
            schema
        );

        expect(addToStaticRoutesSpy).toHaveBeenCalledTimes(2);
    });

    test("should work without schema parameter", () => {
        addFormTrigger.call(
            mockServer as any,
            "basic-form",
            "basic.html",
            mockAgent as unknown as AgentForceAgent
            // No schema provided
        );

        expect(addToStaticRoutesSpy).toHaveBeenCalledTimes(2);
    });

    test("should log form trigger adding action", () => {
        addFormTrigger.call(
            mockServer as any,
            "newsletter-signup",
            "newsletter.html",
            mockAgent as unknown as AgentForceAgent
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                serverName: "TestServer",
                formName: "newsletter-signup",
                path: "/newsletter-signup",
                filePath: "newsletter.html",
                agentName: "TestAgent",
                schema: undefined,
                action: "form_trigger_adding"
            }),
            "Adding form trigger: /newsletter-signup"
        );
    });

    test("should log form trigger added action", () => {
        addFormTrigger.call(
            mockServer as any,
            "survey-form",
            "survey.hbs",
            mockAgent as unknown as AgentForceAgent
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                serverName: "TestServer",
                formName: "survey-form",
                path: "/survey-form",
                action: "form_trigger_added"
            }),
            "Form trigger added: GET/POST /survey-form"
        );
    });

    test("should log schema information when provided", () => {
        const schema: RouteAgentSchema = {
            input: ["prompt", "category"],
            output: ["success", "response"]
        };

        addFormTrigger.call(
            mockServer as any,
            "categorized-form",
            "categorized.html",
            mockAgent as unknown as AgentForceAgent,
            schema
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                schema: schema
            }),
            expect.any(String)
        );
    });

    test("should work with different file extensions", () => {
        // Test with .html file
        addFormTrigger.call(
            mockServer as any,
            "html-form",
            "form.html",
            mockAgent as unknown as AgentForceAgent
        );

        // Test with .hbs file  
        addFormTrigger.call(
            mockServer as any,
            "hbs-form",
            "form.hbs",
            mockAgent as unknown as AgentForceAgent
        );

        expect(addToStaticRoutesSpy).toHaveBeenCalledTimes(4); // 2 calls per form
    });

    test("should handle complex form names and paths", () => {
        addFormTrigger.call(
            mockServer as any,
            "complex/nested-form-name",
            "forms/complex/nested.html",
            mockAgent as unknown as AgentForceAgent
        );

        const calls = addToStaticRoutesSpy.mock.calls;
        expect(calls[0]?.[0]).toMatchObject({
            method: "GET",
            path: "/complex/nested-form-name"
        });
    });

    test("should work with method chaining", () => {
        const result1 = addFormTrigger.call(
            mockServer as any,
            "form1",
            "form1.html",
            mockAgent as unknown as AgentForceAgent
        );

        const result2 = addFormTrigger.call(
            result1 as any,
            "form2",
            "form2.html",
            mockAgent as unknown as AgentForceAgent
        );

        expect(result1).toBe(mockServer);
        expect(result2).toBe(mockServer);
        expect(addToStaticRoutesSpy).toHaveBeenCalledTimes(4); // 2 routes per form
    });

    test("should handle agents with special characters in names", () => {
        const specialAgent = {
            getName: () => "Special Agent #1 (Test-Agent_v2)"
        };

        addFormTrigger.call(
            mockServer as any,
            "special-form",
            "special.html",
            specialAgent as unknown as AgentForceAgent
        );

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                agentName: "Special Agent #1 (Test-Agent_v2)"
            }),
            expect.any(String)
        );
    });

    test("should maintain execution order of route additions", () => {
        addFormTrigger.call(
            mockServer as any,
            "ordered-form",
            "ordered.html",
            mockAgent as unknown as AgentForceAgent
        );

        // GET route should be added first, then POST route
        const calls = addToStaticRoutesSpy.mock.calls;
        expect(calls[0]?.[0]).toMatchObject({
            method: "GET",
            path: "/ordered-form"
        });
        expect(calls[1]?.[0]).toMatchObject({
            method: "POST",
            path: "/ordered-form"
        });
    });

    test("should handle multiple forms with different configurations", () => {
        const schema1: RouteAgentSchema = {
            input: ["prompt"],
            output: ["response"]
        };

        const schema2: RouteAgentSchema = {
            input: ["prompt", "category", "priority"],
            output: ["success", "response", "agentName", "timestamp"]
        };

        const agent2 = { getName: () => "SecondAgent" };

        // Add first form
        addFormTrigger.call(
            mockServer as any,
            "form-1",
            "form1.html",
            mockAgent as unknown as AgentForceAgent,
            schema1
        );

        // Add second form
        addFormTrigger.call(
            mockServer as any,
            "form-2",
            "form2.hbs",
            agent2 as unknown as AgentForceAgent,
            schema2
        );

        expect(addToStaticRoutesSpy).toHaveBeenCalledTimes(4);
        expect(mockLogger.info).toHaveBeenCalledTimes(4); // 2 logs per form
    });

    test("should handle form names with leading slash", () => {
        addFormTrigger.call(
            mockServer as any,
            "/api-form", // Already has leading slash
            "api.html",
            mockAgent as unknown as AgentForceAgent
        );

        const calls = addToStaticRoutesSpy.mock.calls;
        expect(calls[0]?.[0]).toMatchObject({
            method: "GET",
            path: "/api-form"
        });
    });

    test("should call addToStaticRoutes with responseData property", () => {
        addFormTrigger.call(
            mockServer as any,
            "test-form",
            "test.html",
            mockAgent as unknown as AgentForceAgent
        );

        const calls = addToStaticRoutesSpy.mock.calls;
        
        // Both calls should have responseData
        expect(calls[0]?.[0]).toHaveProperty("responseData");
        expect(calls[1]?.[0]).toHaveProperty("responseData");
        
        // Response data should be functions (handlers)
        expect(typeof (calls[0]?.[0] as any)?.responseData).toBe("function");
        expect(typeof (calls[1]?.[0] as any)?.responseData).toBe("function");
    });

    test("should handle boolean agent parameter validation", () => {
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                "test.html",
                false as any
            );
        }).toThrow("Agent instance is required");
    });

    test("should handle whitespace-only form names", () => {
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "   ",
                "test.html",
                mockAgent as unknown as AgentForceAgent
            );
        }).not.toThrow(); // Whitespace is technically a non-empty string
    });

    test("should handle whitespace-only file paths", () => {
        expect(() => {
            addFormTrigger.call(
                mockServer as any,
                "test-form",
                "   ",
                mockAgent as unknown as AgentForceAgent
            );
        }).not.toThrow(); // Whitespace is technically a non-empty string
    });
});