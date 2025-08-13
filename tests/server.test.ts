import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import type { ServerConfig, AgentConfig } from "../lib/types";

// Mock the problematic server module to avoid compilation errors
jest.mock("../lib/server/methods/useOpenAICompatibleRouting", () => ({
    useOpenAICompatibleRouting: jest.fn()
}));

jest.mock("../lib/server/methods/useOllamaCompatibleRouting", () => ({
    useOllamaCompatibleRouting: jest.fn()
}));

// Now import after mocking
import { AgentForceServer } from "../lib/server";
import { AgentForceAgent } from "../lib/agent";

// Define RouteAgentSchema locally to match the actual interface
interface RouteAgentSchema {
    input?: string[];
    output?: string[];
}

describe("AgentForceServer Base Class Tests", () => {
    let server: AgentForceServer;
    let testAgent: AgentForceAgent;
    
    const testServerConfig: ServerConfig = {
        name: "TestServer"
    };

    const testAgentConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        server = new AgentForceServer(testServerConfig);
        testAgent = new AgentForceAgent(testAgentConfig);
    });

    describe("Constructor", () => {
        test("should create server with name from config", () => {
            const result = server.getName();
            expect(result).toBe("TestServer");
        });

        test("should create server with default logger when not provided", () => {
            const logger = server.getLogger();
            expect(logger).toBeDefined();
            expect(typeof logger.debug).toBe("function");
            expect(typeof logger.info).toBe("function");
            expect(typeof logger.warn).toBe("function");
            expect(typeof logger.error).toBe("function");
        });

        test("should create server with provided logger", () => {
            const mockLogger = {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            };

            const configWithLogger: ServerConfig = {
                name: "TestServerWithLogger",
                logger: mockLogger
            };
            
            const serverWithLogger = new AgentForceServer(configWithLogger);
            const result = serverWithLogger.getLogger();
            expect(result).toBe(mockLogger);
        });
    });

    describe("Public Methods", () => {
        test("getName should return server name", () => {
            const result = server.getName();
            expect(result).toBe("TestServer");
        });

        test("getLogger should return logger instance", () => {
            const result = server.getLogger();
            expect(result).toBeDefined();
            expect(typeof result.debug).toBe("function");
        });

        test("getRouteAgents should return empty array initially", () => {
            const result = server.getRouteAgents();
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });

        test("getStaticRoutes should return empty array initially", () => {
            const result = server.getStaticRoutes();
            expect(result).toEqual([]);
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe("Route Agent Management", () => {
        test("addToRouteAgents should add route agent to collection", () => {
            const mockRouteAgent = {
                method: "GET",
                path: "/test",
                agent: testAgent,
                schema: undefined
            };

            server.addToRouteAgents(mockRouteAgent);
            const result = server.getRouteAgents();
            
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(mockRouteAgent);
        });

        test("addToRouteAgents should handle multiple route agents", () => {
            const routeAgent1 = {
                method: "GET",
                path: "/test1",
                agent: testAgent,
                schema: undefined
            };

            const routeAgent2 = {
                method: "POST",
                path: "/test2",
                agent: testAgent,
                schema: { input: ["prompt", "message"], output: ["success", "response"] }
            };

            server.addToRouteAgents(routeAgent1);
            server.addToRouteAgents(routeAgent2);
            
            const result = server.getRouteAgents();
            expect(result).toHaveLength(2);
            expect(result[0]).toBe(routeAgent1);
            expect(result[1]).toBe(routeAgent2);
        });

        test("getRouteAgents should return same array reference", () => {
            const mockRouteAgent = {
                method: "GET",
                path: "/test",
                agent: testAgent,
                schema: undefined
            };

            server.addToRouteAgents(mockRouteAgent);
            const result1 = server.getRouteAgents();
            const result2 = server.getRouteAgents();
            
            expect(result1).toBe(result2);
        });
    });

    describe("Static Route Management", () => {
        test("addToStaticRoutes should add static route to collection", () => {
            const mockStaticRoute = {
                method: "GET",
                path: "/static",
                responseData: { message: "Hello World" }
            };

            server.addToStaticRoutes(mockStaticRoute);
            const result = server.getStaticRoutes();
            
            expect(result).toHaveLength(1);
            expect(result[0]).toBe(mockStaticRoute);
        });

        test("addToStaticRoutes should handle multiple static routes", () => {
            const staticRoute1 = {
                method: "GET",
                path: "/health",
                responseData: { status: "ok" }
            };

            const staticRoute2 = {
                method: "POST",
                path: "/webhook",
                responseData: { received: true }
            };

            server.addToStaticRoutes(staticRoute1);
            server.addToStaticRoutes(staticRoute2);
            
            const result = server.getStaticRoutes();
            expect(result).toHaveLength(2);
            expect(result[0]).toBe(staticRoute1);
            expect(result[1]).toBe(staticRoute2);
        });

        test("getStaticRoutes should return same array reference", () => {
            const mockStaticRoute = {
                method: "GET",
                path: "/static",
                responseData: { message: "Hello World" }
            };

            server.addToStaticRoutes(mockStaticRoute);
            const result1 = server.getStaticRoutes();
            const result2 = server.getStaticRoutes();
            
            expect(result1).toBe(result2);
        });
    });

    describe("Method Availability", () => {
        test("chainable methods should be available as functions", () => {
            expect(typeof server.addRouteAgent).toBe("function");
            expect(typeof server.addRoute).toBe("function");
            expect(typeof server.addFormTrigger).toBe("function");
            expect(typeof server.addWorkflowTrigger).toBe("function");
            expect(typeof server.useOpenAICompatibleRouting).toBe("function");
            expect(typeof server.useOllamaCompatibleRouting).toBe("function");
        });

        test("terminal methods should be available as functions", () => {
            expect(typeof server.serve).toBe("function");
        });
    });

    describe("State Management", () => {
        test("should maintain separate servers with different configurations", () => {
            const server2 = new AgentForceServer({ name: "TestServer2" });
            
            expect(server.getName()).toBe("TestServer");
            expect(server2.getName()).toBe("TestServer2");
            expect(server).not.toBe(server2);
        });

        test("should maintain independent route collections", () => {
            const server2 = new AgentForceServer({ name: "TestServer2" });
            
            const routeAgent1 = {
                method: "GET",
                path: "/server1",
                agent: testAgent,
                schema: undefined
            };

            const routeAgent2 = {
                method: "GET",
                path: "/server2",
                agent: testAgent,
                schema: undefined
            };

            server.addToRouteAgents(routeAgent1);
            server2.addToRouteAgents(routeAgent2);
            
            expect(server.getRouteAgents()).toHaveLength(1);
            expect(server2.getRouteAgents()).toHaveLength(1);
            expect(server.getRouteAgents()[0]).toBe(routeAgent1);
            expect(server2.getRouteAgents()[0]).toBe(routeAgent2);
        });

        test("should maintain independent static route collections", () => {
            const server2 = new AgentForceServer({ name: "TestServer2" });
            
            const staticRoute1 = {
                method: "GET",
                path: "/static1",
                responseData: { server: 1 }
            };

            const staticRoute2 = {
                method: "GET",
                path: "/static2",
                responseData: { server: 2 }
            };

            server.addToStaticRoutes(staticRoute1);
            server2.addToStaticRoutes(staticRoute2);
            
            expect(server.getStaticRoutes()).toHaveLength(1);
            expect(server2.getStaticRoutes()).toHaveLength(1);
            expect(server.getStaticRoutes()[0]).toBe(staticRoute1);
            expect(server2.getStaticRoutes()[0]).toBe(staticRoute2);
        });
    });

    describe("Complex State Management", () => {
        test("should handle mixed route and static route collections", () => {
            const routeAgent = {
                method: "POST",
                path: "/agent-endpoint",
                agent: testAgent,
                schema: { input: ["prompt", "data"], output: ["success", "result"] }
            };

            const staticRoute = {
                method: "GET",
                path: "/health",
                responseData: { status: "healthy" }
            };

            server.addToRouteAgents(routeAgent);
            server.addToStaticRoutes(staticRoute);
            
            expect(server.getRouteAgents()).toHaveLength(1);
            expect(server.getStaticRoutes()).toHaveLength(1);
            expect(server.getRouteAgents()[0]).toBe(routeAgent);
            expect(server.getStaticRoutes()[0]).toBe(staticRoute);
        });

        test("should handle complex route agent with schema", () => {
            const complexSchema: RouteAgentSchema = {
                input: ["prompt", "message", "priority"],
                output: ["success", "response", "timestamp", "agentName"]
            };

            const complexRouteAgent = {
                method: "POST",
                path: "/complex-endpoint",
                agent: testAgent,
                schema: complexSchema
            };

            server.addToRouteAgents(complexRouteAgent);
            const result = server.getRouteAgents();
            
            expect(result).toHaveLength(1);
            expect(result[0]?.schema).toBe(complexSchema);
            expect(result[0]?.schema?.input).toEqual(["prompt", "message", "priority"]);
        });

        test("should handle various HTTP methods in route collections", () => {
            const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
            
            methods.forEach((method, index) => {
                const routeAgent = {
                    method,
                    path: `/endpoint-${index}`,
                    agent: testAgent,
                    schema: undefined
                };

                const staticRoute = {
                    method,
                    path: `/static-${index}`,
                    responseData: { method, index }
                };

                server.addToRouteAgents(routeAgent);
                server.addToStaticRoutes(staticRoute);
            });
            
            expect(server.getRouteAgents()).toHaveLength(methods.length);
            expect(server.getStaticRoutes()).toHaveLength(methods.length);
            
            // Verify all methods are present
            const routeAgentMethods = server.getRouteAgents().map(ra => ra.method);
            const staticRouteMethods = server.getStaticRoutes().map(sr => sr.method);
            
            methods.forEach(method => {
                expect(routeAgentMethods).toContain(method);
                expect(staticRouteMethods).toContain(method);
            });
        });
    });

    describe("Agent Integration", () => {
        test("should store agent references correctly in route agents", () => {
            const agent1 = new AgentForceAgent({ name: "Agent1" });
            const agent2 = new AgentForceAgent({ name: "Agent2" });
            
            const routeAgent1 = {
                method: "GET",
                path: "/agent1",
                agent: agent1,
                schema: undefined
            };

            const routeAgent2 = {
                method: "POST",
                path: "/agent2",
                agent: agent2,
                schema: undefined
            };

            server.addToRouteAgents(routeAgent1);
            server.addToRouteAgents(routeAgent2);
            
            const routes = server.getRouteAgents();
            expect(routes[0]?.agent).toBe(agent1);
            expect(routes[1]?.agent).toBe(agent2);
            expect((routes[0]?.agent as any)["getName"]()).toBe("Agent1");
            expect((routes[1]?.agent as any)["getName"]()).toBe("Agent2");
        });

        test("should handle same agent on multiple routes", () => {
            const sharedAgent = new AgentForceAgent({ name: "SharedAgent" });
            
            const routeAgent1 = {
                method: "GET",
                path: "/shared1",
                agent: sharedAgent,
                schema: undefined
            };

            const routeAgent2 = {
                method: "POST",
                path: "/shared2",
                agent: sharedAgent,
                schema: undefined
            };

            server.addToRouteAgents(routeAgent1);
            server.addToRouteAgents(routeAgent2);
            
            const routes = server.getRouteAgents();
            expect(routes[0]?.agent).toBe(sharedAgent);
            expect(routes[1]?.agent).toBe(sharedAgent);
            expect(routes[0]?.agent).toBe(routes[1]?.agent);
        });
    });

    describe("Schema Handling", () => {
        test("should handle route agents without schema", () => {
            const routeAgent = {
                method: "GET",
                path: "/no-schema",
                agent: testAgent,
                schema: undefined
            };

            server.addToRouteAgents(routeAgent);
            const result = server.getRouteAgents();
            
            expect(result[0]?.schema).toBeUndefined();
        });

        test("should handle route agents with partial schema", () => {
            const partialSchema: RouteAgentSchema = {
                input: ["prompt", "query"]
                // output is optional and not provided
            };

            const routeAgent = {
                method: "GET",
                path: "/partial-schema",
                agent: testAgent,
                schema: partialSchema
            };

            server.addToRouteAgents(routeAgent);
            const result = server.getRouteAgents();
            
            expect(result[0]?.schema?.input).toBeDefined();
            expect(result[0]?.schema?.input).toEqual(["prompt", "query"]);
            expect(result[0]?.schema?.output).toBeUndefined();
        });
    });
});