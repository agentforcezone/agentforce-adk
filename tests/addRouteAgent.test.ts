import { describe, expect, test, beforeEach } from "bun:test";
import { 
    AgentForceAgent, 
    type AgentConfig,
    AgentForceServer,  
    type ServerConfig,
    type RouteAgentSchema
} from "../lib/mod";

describe('AgentForceServer addRouteAgent Method Tests', () => {
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
            agent: agent,
            schema: undefined
        });
    });

    test("should handle multiple route agents", () => {
        const agent2 = new AgentForceAgent({ name: "TestAgent2" });
        
        server
            .addRouteAgent("POST", "/story", agent)
            .addRouteAgent("GET", "/image", agent2)
            .addRouteAgent("PUT", "/update", agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(3);
        
        expect(routeAgents[0]).toEqual({
            method: "POST",
            path: "/story",
            agent: agent,
            schema: undefined
        });
        
        expect(routeAgents[1]).toEqual({
            method: "GET",
            path: "/image",
            agent: agent2,
            schema: undefined
        });
        
        expect(routeAgents[2]).toEqual({
            method: "PUT",
            path: "/update",
            agent: agent,
            schema: undefined
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

    // Schema-related tests
    test("should accept schema parameter for input and output configuration", () => {
        const schema: RouteAgentSchema = {
            input: ["prompt", "custom_param"],
            output: ["success", "prompt", "response"]
        };
        
        const result = server.addRouteAgent("POST", "/custom", agent, schema);
        expect(result).toBe(server);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.schema).toEqual({
            input: ["prompt", "custom_param"],
            output: ["success", "prompt", "response"]
        });
    });

    test("should normalize schema with default values", () => {
        const schema: RouteAgentSchema = {
            output: ["success", "response"]
        };
        
        server.addRouteAgent("POST", "/normalized", agent, schema);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.schema).toEqual({
            input: ["prompt"], // Default input
            output: ["success", "response"]
        });
    });

    test("should ensure prompt is always included in input schema", () => {
        const schema: RouteAgentSchema = {
            input: ["custom_param", "another_param"],
            output: ["success", "response"]
        };
        
        server.addRouteAgent("POST", "/with-prompt", agent, schema);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.schema?.input).toContain("prompt");
        expect(routeAgents[0]?.schema?.input).toContain("custom_param");
        expect(routeAgents[0]?.schema?.input).toContain("another_param");
    });

    test("should work with method chaining when using schema", () => {
        const schema1: RouteAgentSchema = {
            input: ["prompt", "param1"],
            output: ["success", "response"]
        };
        
        const schema2: RouteAgentSchema = {
            input: ["prompt", "param2"],
            output: ["success", "prompt", "response"]
        };
        
        const result = server
            .addRouteAgent("POST", "/endpoint1", agent, schema1)
            .addRouteAgent("GET", "/endpoint2", agent, schema2);
        
        expect(result).toBe(server);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(2);
        expect(routeAgents[0]?.schema).toEqual({
            input: ["prompt", "param1"],
            output: ["success", "response"]
        });
        expect(routeAgents[1]?.schema).toEqual({
            input: ["prompt", "param2"],
            output: ["success", "prompt", "response"]
        });
    });

    test("should handle empty schema object", () => {
        const schema: RouteAgentSchema = {};
        
        server.addRouteAgent("POST", "/empty-schema", agent, schema);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.schema).toEqual({
            input: ["prompt"], // Default input
            output: ["success", "method", "path", "agentName", "agentType", "prompt", "response"] // Default output
        });
    });

    test("should validate that schema enforces strict field requirements", () => {
        const strictSchema: RouteAgentSchema = {
            input: ["prompt", "required_field1", "required_field2"],
            output: ["success", "response"]
        };
        
        server.addRouteAgent("POST", "/strict", agent, strictSchema);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.schema?.input).toEqual(["prompt", "required_field1", "required_field2"]);
    });

    test("should handle schema with only prompt in input", () => {
        const promptOnlySchema: RouteAgentSchema = {
            input: ["prompt"],
            output: ["success", "response"]
        };
        
        server.addRouteAgent("POST", "/prompt-only", agent, promptOnlySchema);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.schema?.input).toEqual(["prompt"]);
    });
});
