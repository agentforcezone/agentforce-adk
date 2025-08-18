#!/usr/bin/env bun

/**
 * Example demonstrating file logging functionality
 * This agent will create a transaction log file in the logs directory
 */

import { AgentForceAgent } from "../../lib/agent";

// Create an agent with both console and file logging
const agent = new AgentForceAgent({
    name: "FileLoggingDemo",
    logger: ["default", "file"],  // Enable both console and file logging
    logPath: "./logs",        // Custom log path (optional)
    tools: ["fs_list_dir", "fs_write_file"]
});

// Configure the agent
agent
    .systemPrompt("You are a helpful assistant that demonstrates file logging.")
    .useLLM("ollama", "qwen3-coder-tool")
    .prompt("List the files in the ./lib directory and explain what you found (relative paths only).")
    .task("Save the directory listing as YAML to examples/files/responses/file-logging-output.yaml.");

// Run the agent - this will create a log file
console.log("\n📝 Starting agent with file logging enabled...");
console.log(`📁 Log files will be created in: ./logs/YYYY/MM/DD/`);
console.log("=".repeat(50));

agent.run().then(response => {
    console.log("\n✅ Agent completed successfully!");
    console.log("\n📋 Response:");
    console.log(response);
    console.log("\n💾 Check the ./logs/YYYY/MM/DD/ directory for the transaction log file.");
    console.log("   The log file name format is: <executionId>-<date>-<agentName>.log");
    console.log("   Example: ./logs/2025/08/18/0198be04bf2e6b70-2025-08-18-FileLoggingDemo.log");
}).catch(error => {
    console.error("❌ Error:", error);
});