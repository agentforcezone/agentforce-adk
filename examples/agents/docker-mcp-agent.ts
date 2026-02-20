import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "DockerMCPAgent",
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 128000, // 128k tokens for handling large tool results
  maxToolRounds: 20,
};

// Create and configure your Docker MCP-enabled agent
const DockerMCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "openai/gpt-5-mini", modelConfig)
  //.useLLM("ollama", "qwen3-coder-tool", modelConfig)
  .addMCP({
    name: "MCP_DOCKER",
    type: "local",
    command: "docker",
    args: [
      "mcp",
      "gateway",
      "run"
    ],
  })
  .prompt(`what are the tools from MCP_DOCKER ? List them with a short description.`)
  .task(`mcp_MCP_DOCKER_browser_navigate https://docs.agentforce.zone/ and summarize the content.`)


 const response = await DockerMCPAgent.saveToFile("examples/files/responses/docker-mcp-agent.md");
console.log(response);

