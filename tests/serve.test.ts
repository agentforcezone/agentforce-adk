import { describe, expect, test, beforeEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

describe('AgentForceAgent serve Method Tests', () => {
    let agent: AgentForceAgent;
    const agentConfig: AgentConfig = {
        name: "TestAgent",
        type: "test-agent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(agentConfig);
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.serve("localhost", 3001);
        expect(result).toBe(agent);
        expect(result).toBeInstanceOf(AgentForceAgent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .useLLM("openai", "gpt-4")
            .serve("localhost", 3002)
            .debug();
        
        expect(result).toBe(agent);
    });

    test("should handle default parameters correctly", () => {
        // Test with default parameters
        const result = agent.serve();
        expect(result).toBe(agent);
    });

    test("should handle custom host and port", () => {
        const result = agent.serve("127.0.0.1", 8080);
        expect(result).toBe(agent);
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

    test("should integrate well with other methods", () => {
        const result = agent
            .useLLM("ollama", "phi4-mini:latest")
            .serve("0.0.0.0", 3010)
            .debug();
        
        expect(result).toBe(agent);
    });

    test("should handle number port values", () => {
        // Test with various number port formats
        const result1 = agent.serve("localhost", 3011);
        const result2 = agent.serve("localhost", 3012);
        const result3 = agent.serve("localhost", 3013);
        
        expect(result1).toBe(agent);
        expect(result2).toBe(agent);
        expect(result3).toBe(agent);
    });
});
