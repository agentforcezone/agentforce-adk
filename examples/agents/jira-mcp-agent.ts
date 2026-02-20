import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "AtlassianMCPAgent",
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 128000, // 128k tokens for handling large tool results
  maxToolRounds: 20,
};

// Create and configure your Playwright MCP-enabled agent
const JiraMCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "openai/gpt-5-mini", modelConfig)
  .addMCP({
    name: "atlassian",
    command: "npx",
    args: [
      "-y", 
      "mcp-remote", 
      "https://mcp.atlassian.com/v1/sse"
    ]
  })
  .prompt(`Use the Atlassian MCP and and connect Jira`)
  .task(`Get my Projects from Jira and list them out`)
  .task(`Then list all issues assigned to the Project AgentForce`)

const response = await JiraMCPAgent.saveToFile("examples/files/responses/jira-mcp-agent.md");
console.log(response);