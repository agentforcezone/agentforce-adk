import { AgentForceAgent } from "../../lib/agent";

// Create an agent with both console and file logging
const agent = new AgentForceAgent({
    name: "FileLoggingDemo",
    logger: ["stdout", "file"], // Enable both console and file logging (can be overridden by LOGGER_TYPE env var)
    logPath: "./file-logs",     // Custom log file path (optional)
    tools: ["fs_list_dir", "fs_write_file"]
});

// Configure the agent
agent
    .systemPrompt("You are a helpful assistant that demonstrates file logging.")
    .useLLM("ollama", "qwen3-coder-tool")
    .prompt("List the files in the ./lib directory and explain what you found (relative paths only).")
    .task("Save the directory listing as YAML to examples/files/responses/file-logging-output.yaml.");

const response = await agent.getResponse();
console.log(response);