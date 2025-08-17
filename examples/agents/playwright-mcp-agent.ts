import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "PlaywrightMCPAgent",
  mcps: ["playwright"], // Only playwright MCP server
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 128000, // 128k tokens for handling large tool results
  maxToolRounds: 20,
};

// Create and configure your Playwright MCP-enabled agent
const PlaywrightMCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "openai/gpt-5-mini", modelConfig)
  .prompt(`Visit https://docs.agentforce.zone/ and summarize the content.`)

const response = await PlaywrightMCPAgent.saveToFile("examples/files/responses/playwright-mcp-agent.md");
console.log(response);