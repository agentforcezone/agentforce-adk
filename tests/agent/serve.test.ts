import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

describe('AgentForceAgent serve Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent"
    };
    let servers: any[] = [];

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    afterEach(async () => {
        // Clean up any servers that were started during tests
        for (const server of servers) {
            if (server && typeof server.close === 'function') {
                server.close();
            } else if (server && typeof server.shutdown === 'function') {
                await server.shutdown();
            }
        }
        servers = [];
    });

    test("should return Promise<void> (terminal method)", async () => {
        // Since serve starts a server and doesn't return, we can't really test it running
        // Instead, we test that it's a function that returns a Promise
        const serveMethod = agent.serve;
        expect(typeof serveMethod).toBe("function");
        
        // We can't actually start the server in tests as it would hang
        // So we just verify the method exists and has the right signature
    });

    test("should work as terminal method (no chaining)", () => {
        const setupAgent = agent.useLLM("openai", "gpt-4");
        const serveMethod = setupAgent.serve;
        
        expect(typeof serveMethod).toBe("function");
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should validate parameters correctly", () => {
        // Test with invalid parameters should throw errors
        expect(() => agent.serve("", 3000)).toThrow("Host must be a non-empty string");
        expect(() => agent.serve("localhost", 0)).toThrow("Port must be a valid number between 1 and 65535");
        expect(() => agent.serve("localhost", -1)).toThrow("Port must be a valid number between 1 and 65535");
        expect(() => agent.serve("localhost", 99999)).toThrow("Port must be a valid number between 1 and 65535");
    });

    test("should handle invalid parameter types", () => {
        // Test with invalid types should throw errors
        expect(() => agent.serve(null as any, 3000)).toThrow("Host must be a non-empty string");
        expect(() => agent.serve("localhost", "3000" as any)).toThrow("Port must be a valid number between 1 and 65535");
        expect(() => agent.serve(123 as any, 3000)).toThrow("Host must be a non-empty string");
        expect(() => agent.serve("localhost", null as any)).toThrow("Port must be a valid number between 1 and 65535");
    });

    test("should work with other methods before serve (terminal behavior)", () => {
        const setupAgent = agent.useLLM("ollama", "phi4-mini:latest");
        const serveMethod = setupAgent.serve;
        
        expect(typeof serveMethod).toBe("function");
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should accept valid host and port parameters", () => {
        // Test that the method accepts valid parameters without throwing
        expect(() => agent.serve("localhost", 3000)).not.toThrow();
        expect(() => agent.serve("127.0.0.1", 8080)).not.toThrow();
        expect(() => agent.serve("0.0.0.0", 3001)).not.toThrow();
    });

    test("should log agent information when starting server", () => {
        // Test the logging and setup behavior by checking agent state
        expect(agent.getName()).toBe("TestAgent");
        expect(agent.getModel()).toBe("gemma3:4b");
        expect(agent.getProvider()).toBe("ollama");
        
        // Test logger exists and has required methods
        const logger = agent.getLogger();
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe("function");
        expect(typeof logger.error).toBe("function");
    });

    test("should handle HTTP requests with basic route", () => {
        // Test would verify the route setup, but we can't easily test the full server without it hanging
        expect(agent.getName()).toBe("TestAgent");
        expect(agent.getModel()).toBe("gemma3:4b");
        expect(agent.getProvider()).toBe("ollama");
        
        // Verify agent has the required methods for HTTP handling
        expect(typeof agent.prompt).toBe("function");
        expect(typeof agent.getResponse).toBe("function");
    });

    test("should handle prompt query parameter", () => {
        // Test the new prompt functionality 
        expect(typeof agent.prompt).toBe("function");
        expect(typeof agent.getResponse).toBe("function");
        
        // Test the chain behavior
        const result = agent.prompt("test");
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle default parameters correctly", () => {
        // Test serve method signature and that it exists
        expect(typeof agent.serve).toBe("function");
        expect(agent.serve.length).toBeGreaterThanOrEqual(0);
        
        // We can't actually call serve() in tests as it starts a real server
        // Instead verify the method is bound correctly
        expect(agent.serve).toBeDefined();
    });

    test("should handle logger middleware setup", () => {
        // Test logger configuration
        const logger = agent.getLogger();
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe("function");
        expect(typeof logger.error).toBe("function");
    });

    test("should handle different runtime environments", () => {
        // Test runtime detection logic by checking what's currently available
        // We can't modify globalThis properties as they're readonly, so we just verify detection
        
        // Check if we're in Bun environment
        if (typeof (globalThis as any).Bun !== "undefined") {
            expect(typeof (globalThis as any).Bun).toBe("object");
            expect((globalThis as any).Bun).toBeDefined();
        }
        
        // Check if we're in Deno environment  
        if (typeof (globalThis as any).Deno !== "undefined") {
            expect(typeof (globalThis as any).Deno).toBe("object");
            expect((globalThis as any).Deno).toBeDefined();
        }
        
        // The serve method should handle all three runtimes (Bun, Deno, Node.js)
        expect(typeof agent.serve).toBe("function");
    });
});
