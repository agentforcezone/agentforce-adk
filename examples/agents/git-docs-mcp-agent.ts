import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "GitAgentforceMCPAgent",
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 8000, 
  maxToolRounds: 20, // Allow tool rounds for MCP interactions
};

// Create and configure your MCP-enabled agent
const GitMCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "z-ai/glm-4.5v", modelConfig)
  .prompt(`Give me a Overvorview of the Agentforce ADK project and its features.`)
  .addMCP({
    name: "agentforce-adk-docs",
    type: "sse",
    url: "https://gitmcp.io/agentforcezone/agentforce-adk"
  })

const response = await GitMCPAgent.saveToFile("examples/files/responses/git-docs-mcp-agent.md");
console.log(response);
