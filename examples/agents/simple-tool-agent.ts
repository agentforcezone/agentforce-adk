import { AgentForceAgent, type AgentConfig } from "@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "FileAgent",
    tools: ["fs_read_file", "fs_write_file", "fs_list_dir"]
};

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gpt-oss:20b")
    .systemPrompt("You are a file management assistant.")
    .prompt("Read the package.json file, then create a summary file");

const response = await agent.getResponse();