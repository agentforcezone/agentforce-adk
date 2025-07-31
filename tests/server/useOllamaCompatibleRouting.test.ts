import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceServer, type ServerConfig } from "../../lib/server";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

describe("AgentForceServer useOllamaCompatibleRouting Method Tests", () => {
    let server: AgentForceServer;
    let agent: AgentForceAgent;

    beforeEach(() => {
        const serverConfig: ServerConfig = {
            name: "TestServer"
        };
        server = new AgentForceServer(serverConfig);

        const agentConfig: AgentConfig = {
            name: "TestAgent"
        };
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return server instance for method chaining", () => {
        const result = server.useOllamaCompatibleRouting(agent);
        expect(result).toBe(server);
    });

    test("should throw error for undefined agent parameter", () => {
        expect(() => {
            server.useOllamaCompatibleRouting(undefined as any);
        }).toThrow("Agent instance is required");
    });

    test("should throw error for null agent parameter", () => {
        expect(() => {
            server.useOllamaCompatibleRouting(null as any);
        }).toThrow("Agent instance is required");
    });

    test("should throw error for invalid agent parameter (string)", () => {
        expect(() => {
            server.useOllamaCompatibleRouting("invalid" as any);
        }).toThrow("Agent instance is required");
    });

    test("should throw error for invalid agent parameter (object without getName)", () => {
        expect(() => {
            server.useOllamaCompatibleRouting({} as any);
        }).toThrow("Agent instance is required");
    });

    test("should work with method chaining", () => {
        const result = server
            .useOllamaCompatibleRouting(agent)
            .addRouteAgent("GET", "/test", agent);
        expect(result).toBe(server);
    });

    test("should add Ollama Generate route to route agents", () => {
        server.useOllamaCompatibleRouting(agent);
        const routeAgents = server.getRouteAgents();
        
        // Should have 2 routes: /api/generate and /api/chat
        expect(routeAgents.length).toBe(2);
        
        // Check Generate route
        const generateRoute = routeAgents.find(ra => ra.path === "/api/generate");
        expect(generateRoute).toBeDefined();
        expect(generateRoute?.method).toBe("POST");
        expect(generateRoute?.agent).toBe(agent);
    });

    test("should add Ollama Chat route to route agents", () => {
        server.useOllamaCompatibleRouting(agent);
        const routeAgents = server.getRouteAgents();
        
        // Check Chat route
        const chatRoute = routeAgents.find(ra => ra.path === "/api/chat");
        expect(chatRoute).toBeDefined();
        expect(chatRoute?.method).toBe("POST");
        expect(chatRoute?.agent).toBe(agent);
    });

    test("should handle multiple Ollama route registrations", () => {
        const agent2 = new AgentForceAgent({ name: "TestAgent2" });
        
        server.useOllamaCompatibleRouting(agent);
        server.useOllamaCompatibleRouting(agent2);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents.length).toBe(4); // 2 routes x 2 agents = 4 total routes
    });

    test("should preserve existing route agents when adding Ollama routes", () => {
        // Add a regular route first
        server.addRouteAgent("GET", "/existing", agent);
        
        // Add Ollama routes
        server.useOllamaCompatibleRouting(agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents.length).toBe(3); // 1 existing + 2 Ollama routes
        
        // Verify existing route is still there
        const existingRoute = routeAgents.find(ra => ra.path === "/existing");
        expect(existingRoute).toBeDefined();
        expect(existingRoute?.method).toBe("GET");
    });

    test("should use correct HTTP method for both Ollama endpoints", () => {
        server.useOllamaCompatibleRouting(agent);
        const routeAgents = server.getRouteAgents();
        
        routeAgents.forEach(route => {
            expect(route.method).toBe("POST");
        });
    });

    test("should work after other chainable methods", () => {
        const result = server
            .addRouteAgent("GET", "/test", agent)
            .useOllamaCompatibleRouting(agent);
        expect(result).toBe(server);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents.length).toBe(3); // 1 manual + 2 Ollama routes
    });
});
