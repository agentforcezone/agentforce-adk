import { describe, expect, test, beforeEach } from "@jest/globals";

// Import just the agent class directly to avoid import.meta issues
import { AgentForceAgent } from "../lib/agent";
import type { AgentConfig } from "../lib/types";

describe("AgentForceAgent Basic Tests", () => {
    let agent: AgentForceAgent;
    const testConfig: AgentConfig = {
        name: "TestAgent"
    };

    beforeEach(() => {
        agent = new AgentForceAgent(testConfig);
    });

    test("should create agent instance", () => {
        expect(agent).toBeInstanceOf(AgentForceAgent);
    });

    test("should return agent for method chaining - debug", () => {
        const result = agent.debug();
        expect(result).toBe(agent);
    });

    test("should return agent for method chaining - prompt", () => {
        const result = agent.prompt("test prompt");
        expect(result).toBe(agent);
    });

    test("should return agent for method chaining - systemPrompt", () => {
        const result = agent.systemPrompt("test system prompt");
        expect(result).toBe(agent);
    });

    test("should support method chaining", () => {
        const result = agent
            .debug()
            .prompt("test prompt")
            .systemPrompt("test system prompt");
        expect(result).toBe(agent);
    });

    test("should access assetPath through getAssetPath method", () => {
        // Test the getAssetPath method (line 93) by accessing it through bracket notation
        // This is how it's used internally by the skills loading function
        const assetPath = agent["getAssetPath"]();
        expect(typeof assetPath).toBe("string");
        expect(assetPath).toBe("."); // Default value
    });

    test("should use custom assetPath when provided in config", () => {
        const customConfig: AgentConfig = {
            name: "TestAgent",
            assetPath: "/custom/path"
        };
        const customAgent = new AgentForceAgent(customConfig);
        
        const assetPath = customAgent["getAssetPath"]();
        expect(assetPath).toBe("/custom/path");
    });

    test("should use environment variable for assetPath when config assetPath not provided", () => {
        // Save original environment variable
        const originalAssetPath = process.env.AGENT_ASSETS_PATH;
        
        // Set environment variable
        process.env.AGENT_ASSETS_PATH = "/env/path";
        
        const envConfig: AgentConfig = {
            name: "TestAgent"
            // No assetPath provided in config
        };
        const envAgent = new AgentForceAgent(envConfig);
        
        const assetPath = envAgent["getAssetPath"]();
        expect(assetPath).toBe("/env/path");
        
        // Restore original environment variable
        if (originalAssetPath !== undefined) {
            process.env.AGENT_ASSETS_PATH = originalAssetPath;
        } else {
            delete process.env.AGENT_ASSETS_PATH;
        }
    });
});