import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

describe('AgentForceAgent serve Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
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
});
