import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "GitMCPAgent",
  mcps: ["github"], // Only github MCP server (without Token only public repos)
  mcpConfig: "examples/files/config/mcp.config.json", // Path to MCP config file
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 8000, 
  maxToolRounds: 20, // Allow tool rounds for MCP interactions
};

// Create and configure your MCP-enabled agent
const GitMCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "z-ai/glm-4.5v", modelConfig)
  .prompt(`Give me a list of repos from the https://github.com/agentforcezone organization.`)

const response = await GitMCPAgent.saveToFile("examples/files/responses/git-mcp-agent.md");
console.log(response);
