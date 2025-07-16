import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../lib/agent";

describe('AgentForceAgent serve Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent",
        type: "test-agent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return void (terminal method)", () => {
        const result = agent.serve("localhost", 3001);
        expect(result).toBeUndefined();
    });

    test("should work as terminal method (no chaining)", () => {
        const setupAgent = agent.useLLM("openai", "gpt-4");
        const result = setupAgent.serve("localhost", 3002);
        
        expect(result).toBeUndefined();
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle default parameters correctly", () => {
        // Test with default parameters (using different port to avoid conflicts)
        const result = agent.serve("127.0.0.1", 3020);
        expect(result).toBeUndefined();
    });

    test("should handle custom host and port", () => {
        const result = agent.serve("127.0.0.1", 8080);
        expect(result).toBeUndefined();
    });

    test("should handle edge cases with empty parameters", () => {
        // Test with empty strings should throw errors
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
        const result = setupAgent.serve("0.0.0.0", 3010);
        
        expect(result).toBeUndefined();
        expect(setupAgent).toBe(agent);
        expect(setupAgent).toBeInstanceOf(AgentForceAgent);
    });

    test("should handle various port values (terminal behavior)", () => {
        // Test with various number port formats
        const result1 = agent.serve("localhost", 3011);
        const result2 = agent.serve("localhost", 3012);
        const result3 = agent.serve("localhost", 3013);
        
        expect(result1).toBeUndefined();
        expect(result2).toBeUndefined();
        expect(result3).toBeUndefined();
    });
});
