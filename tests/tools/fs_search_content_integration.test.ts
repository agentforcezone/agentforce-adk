import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/mod";

describe('fs_search_content Integration Tests', () => {
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        const config: AgentConfig = {
            name: "TestSearchAgent",
            tools: ["fs_search_content"]
        };
        agent = new AgentForceAgent(config);
    });

    test("should work with agent for simple pattern search", async () => {
        const response = await agent
            .useLLM("ollama", "qwen3-coder-tool")
            .systemPrompt("You are a file search assistant. Use the fs_search_content tool to search for patterns.")
            .prompt("Search for 'function' in TypeScript files (.ts) and return the first 2 matches with line numbers")
            .getResponse();

        expect(response).toBeString();
        expect(response.length).toBeGreaterThan(0);
        // Response should contain search results or tool output
        expect(response.toLowerCase()).toContain("found");
    });

    test("should work with agent for regex pattern search", async () => {
        const response = await agent
            .useLLM("ollama", "qwen3-coder-tool")
            .systemPrompt("You are a code analysis assistant. Use the fs_search_content tool with regex patterns.")
            .prompt("Search for 'import' in .ts files, limit to 1 match")
            .getResponse();

        expect(response).toBeString();
        expect(response.length).toBeGreaterThan(0);
    });

    test("should handle tool configuration through agent", async () => {
        const tools = agent["getTools"]();
        expect(tools).toContain("fs_search_content");
    });

    test("should work with complex search requests", async () => {
        const response = await agent
            .useLLM("ollama", "qwen3-coder-tool")
            .systemPrompt("You are an expert code analyzer. Use fs_search_content tool to find code patterns.")
            .prompt("Find class definitions using pattern 'class' in .ts files, max 1 match")
            .getResponse();

        expect(response).toBeString();
        expect(response.length).toBeGreaterThan(0);
    });
});
