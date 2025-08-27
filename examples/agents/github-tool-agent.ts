#!/usr/bin/env bun
/**
 * GitHub Copilot LSP Integration Test
 * Tests the LSP authentication flow with claude-sonnet-4 model
 * 
 * Requirements:
 * - GitHub Copilot Language Server (@github/copilot-language-server)
 * - Active GitHub Copilot subscription
 * 
 * Usage:
 * bun run examples/agents/github-tool-agent.ts
 */

import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; // "@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "LSPTestAgent",
    tools: ["fs_read_file", "fs_write_file", "fs_list_dir"]
};

console.log("🚀 Testing GitHub Copilot LSP integration with claude-sonnet-4");

const agent = new AgentForceAgent(agentConfig)
    .useLLM("github-copilot", "claude-sonnet-4") // This will now use LSP by default
    .systemPrompt("You are a file management assistant. Always use the current working directory (pwd) when listing files.")
    .prompt("List the files in the current working directory and save the listing to ./files2.json");

const response = await agent.getResponse();
console.log("🤖 Response:", response);