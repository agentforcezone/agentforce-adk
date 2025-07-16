import { describe, expect, test, beforeEach } from "bun:test";
import { 
    AgentForceAgent, 
    type AgentConfig,
    AgentForceServer,  
    type ServerConfig 
} from "../lib/mod";

describe('AgentForceServer addRouteAgent Method Tests', () => {
    let server: AgentForceServer;
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const serverConfig: ServerConfig = {
            name: "TestServer",
            logger: "json"
        };
        server = new AgentForceServer(serverConfig);
        
        const agentConfig: AgentConfig = {
            name: "TestAgent",
            type: "test-agent"
        };
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return server instance for method chaining", () => {
        const result = server.addRouteAgent("POST", "/test", agent);
        expect(result).toBe(server);
    });

    test("should work with method chaining", () => {
        const result = server
            .addRouteAgent("POST", "/story", agent)
            .addRouteAgent("GET", "/health", agent);
        expect(result).toBe(server);
    });

    test("should validate HTTP method parameter", () => {
        expect(() => server.addRouteAgent("", "/test", agent))
            .toThrow("HTTP method must be a non-empty string");
        
        expect(() => server.addRouteAgent("INVALID", "/test", agent))
            .toThrow("Invalid HTTP method: INVALID");
    });

    test("should validate route path parameter", () => {
        expect(() => server.addRouteAgent("POST", "", agent))
            .toThrow("Route path must be a non-empty string");
    });

    test("should validate agent parameter", () => {
        expect(() => server.addRouteAgent("POST", "/test", null as any))
            .toThrow("Agent instance is required");
    });

    test("should normalize HTTP method to uppercase", () => {
        server.addRouteAgent("post", "/test", agent);
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.method).toBe("POST");
    });

    test("should normalize path to start with slash", () => {
        server.addRouteAgent("POST", "test", agent);
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.path).toBe("/test");
    });

    test("should accept valid HTTP methods", () => {
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
        
        validMethods.forEach((method, index) => {
            expect(() => server.addRouteAgent(method, `/test${index}`, agent))
                .not.toThrow();
        });
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(validMethods.length);
    });

    test("should store route agent configuration", () => {
        server.addRouteAgent("POST", "/story", agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]).toEqual({
            method: "POST",
            path: "/story",
            agent: agent
        });
    });

    test("should handle multiple route agents", () => {
        const agent2 = new AgentForceAgent({ name: "TestAgent2", type: "test-agent-2" });
        
        server
            .addRouteAgent("POST", "/story", agent)
            .addRouteAgent("GET", "/image", agent2)
            .addRouteAgent("PUT", "/update", agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(3);
        
        expect(routeAgents[0]).toEqual({
            method: "POST",
            path: "/story",
            agent: agent
        });
        
        expect(routeAgents[1]).toEqual({
            method: "GET",
            path: "/image",
            agent: agent2
        });
        
        expect(routeAgents[2]).toEqual({
            method: "PUT",
            path: "/update",
            agent: agent
        });
    });

    test("should handle case-insensitive HTTP methods", () => {
        server.addRouteAgent("post", "/test1", agent);
        server.addRouteAgent("GET", "/test2", agent);
        server.addRouteAgent("Put", "/test3", agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(3);
        expect(routeAgents[0]?.method).toBe("POST");
        expect(routeAgents[1]?.method).toBe("GET");
        expect(routeAgents[2]?.method).toBe("PUT");
    });
});
