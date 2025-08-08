import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "IntegrationAgent",
  skills: ["product-owner"],
  tools: ["fs_read_file"],
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 8192, // 8k tokens
}

// Create and configure your agent
const IntegrationAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "openai/gpt-oss-20b:free", modelConfig) 
  .prompt(`Create a user story for the Game Development Marketplace website project initialization.`)

const response = await IntegrationAgent.saveToFile("examples/files/responses/integration-agent.md")
console.log(response);