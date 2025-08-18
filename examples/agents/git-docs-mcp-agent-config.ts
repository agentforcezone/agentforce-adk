import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

// Agent config that references the MCP config file and pre-configured servers
const config: AgentConfig = {
  name: "GitAgentforceMCPAgent",
  mcps: ["agentforce-adk-docs"], // Reference the server name from docs-mcp-config.json
  mcpConfig: "examples/configs/sse-mcp-config.json" // Path to the MCP config file
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 8000, 
  maxToolRounds: 20, // Allow tool rounds for MCP interactions
};

// Create and configure your MCP-enabled agent using config file approach
const GitMCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "z-ai/glm-4.5v", modelConfig)
  .prompt(`Give me a comprehensive overview of the Agentforce ADK project, its features, and provide examples of how to use it.`);

const response = await GitMCPAgent.saveToFile("examples/files/responses/git-mcp-agent-config.md");
console.log(response);
