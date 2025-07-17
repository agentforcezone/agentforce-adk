import { describe, expect, test, beforeEach } from "bun:test";
import { 
    AgentForceAgent, 
    type AgentConfig,
    AgentForceServer,  
    type ServerConfig 
} from "../lib/mod";

describe('AgentForceServer useOpenAICompatibleRouting Method Tests', () => {
    let server: AgentForceServer;
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const serverConfig: ServerConfig = {
            name: "TestServer",
            logger: "json"
        };
        server = new AgentForceServer(serverConfig);
        
        const agentConfig: AgentConfig = {
            name: "OpenAICompatibleAgent",
            type: "openai-compatible-agent"
        };
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return server instance for method chaining", () => {
        const result = server.useOpenAICompatibleRouting(agent);
        expect(result).toBe(server);
    });

    test("should work with method chaining", () => {
        const result = server
            .useOpenAICompatibleRouting(agent)
            .addRouteAgent("POST", "/story", agent)
            .addRouteAgent("GET", "/health", agent);
        expect(result).toBe(server);
    });

    test("should validate agent parameter", () => {
        expect(() => {
            // @ts-ignore - Testing runtime validation
            server.useOpenAICompatibleRouting(null);
        }).toThrow("Agent instance is required");

        expect(() => {
            // @ts-ignore - Testing runtime validation
            server.useOpenAICompatibleRouting(undefined);
        }).toThrow("Agent instance is required");

        expect(() => {
            // @ts-ignore - Testing runtime validation
            server.useOpenAICompatibleRouting("not-an-agent");
        }).toThrow("Agent instance is required");
    });

    test("should automatically register the /v1/chat/completions route", () => {
        server.useOpenAICompatibleRouting(agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        
        const openAIRoute = routeAgents[0];
        expect(openAIRoute?.method).toBe("POST");
        expect(openAIRoute?.path).toBe("/v1/chat/completions");
        expect(openAIRoute?.agent).toBe(agent);
    });

    test("should store OpenAI-compatible route agent configuration", () => {
        server.useOpenAICompatibleRouting(agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        
        const routeAgent = routeAgents[0];
        expect(routeAgent).toBeDefined();
        expect(routeAgent?.method).toBe("POST");
        expect(routeAgent?.path).toBe("/v1/chat/completions");
        expect(routeAgent?.agent.getName()).toBe("OpenAICompatibleAgent");
    });

    test("should work with multiple OpenAI-compatible agents", () => {
        const agentConfig2: AgentConfig = {
            name: "SecondOpenAIAgent",
            type: "openai-compatible-agent"
        };
        const agent2 = new AgentForceAgent(agentConfig2);

        // Note: In practice, you would typically only have one OpenAI-compatible route
        // but the method should technically support being called multiple times
        server.useOpenAICompatibleRouting(agent);
        server.useOpenAICompatibleRouting(agent2);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(2);
        
        // Both should have the same path but different agents
        expect(routeAgents[0]?.path).toBe("/v1/chat/completions");
        expect(routeAgents[1]?.path).toBe("/v1/chat/completions");
        expect(routeAgents[0]?.agent.getName()).toBe("OpenAICompatibleAgent");
        expect(routeAgents[1]?.agent.getName()).toBe("SecondOpenAIAgent");
    });

    test("should combine with addRouteAgent method", () => {
        server
            .useOpenAICompatibleRouting(agent)
            .addRouteAgent("POST", "/story", agent)
            .addRouteAgent("GET", "/health", agent);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(3);
        
        // Check that OpenAI route is registered
        const openAIRoute = routeAgents.find(ra => ra.path === "/v1/chat/completions");
        expect(openAIRoute).toBeDefined();
        expect(openAIRoute?.method).toBe("POST");
        
        // Check that custom routes are also registered
        const storyRoute = routeAgents.find(ra => ra.path === "/story");
        expect(storyRoute).toBeDefined();
        expect(storyRoute?.method).toBe("POST");
        
        const healthRoute = routeAgents.find(ra => ra.path === "/health");
        expect(healthRoute).toBeDefined();
        expect(healthRoute?.method).toBe("GET");
    });

    test("should work with agents that have LLM configuration", () => {
        const configuredAgent = agent
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are an OpenAI compatible agent.");
        
        const result = server.useOpenAICompatibleRouting(configuredAgent);
        expect(result).toBe(server);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(1);
        expect(routeAgents[0]?.agent).toBe(configuredAgent);
    });

    test("should maintain server state correctly", () => {
        const serverName = server.getName();
        const loggerType = server.getLoggerType();
        
        server.useOpenAICompatibleRouting(agent);
        
        // Server properties should remain unchanged
        expect(server.getName()).toBe(serverName);
        expect(server.getLoggerType()).toBe(loggerType);
        
        // Only route agents should be added
        expect(server.getRouteAgents()).toHaveLength(1);
    });

    test("should handle different agent types", () => {
        const configs = [
            { name: "Agent1", type: "chat-agent" },
            { name: "Agent2", type: "completion-agent" },
            { name: "Agent3", type: "custom-agent" },
        ] as const;
        
        configs.forEach((config, index) => {
            const testAgent = new AgentForceAgent(config);
            const result = server.useOpenAICompatibleRouting(testAgent);
            expect(result).toBe(server);
        });
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(configs.length);
        
        // All should be registered to the same OpenAI-compatible path
        routeAgents.forEach(routeAgent => {
            expect(routeAgent.path).toBe("/v1/chat/completions");
            expect(routeAgent.method).toBe("POST");
        });
    });

    test("should support complex method chaining scenarios", () => {
        const agentConfig2: AgentConfig = {
            name: "StoryAgent",
            type: "story-agent"
        };
        const storyAgent = new AgentForceAgent(agentConfig2);
        
        const result = server
            .addRouteAgent("GET", "/status", agent)
            .useOpenAICompatibleRouting(agent)
            .addRouteAgent("POST", "/story", storyAgent)
            .addRouteAgent("GET", "/story", storyAgent);
        
        expect(result).toBe(server);
        
        const routeAgents = server.getRouteAgents();
        expect(routeAgents).toHaveLength(4);
        
        // Verify all routes are properly registered
        const paths = routeAgents.map(ra => ra.path);
        expect(paths).toContain("/status");
        expect(paths).toContain("/v1/chat/completions");
        expect(paths).toContain("/story");
        
        // Verify OpenAI route is correctly configured
        const openAIRoute = routeAgents.find(ra => ra.path === "/v1/chat/completions");
        expect(openAIRoute?.method).toBe("POST");
        expect(openAIRoute?.agent.getName()).toBe("OpenAICompatibleAgent");
    });
});
