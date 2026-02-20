import { AgentForceAgent } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config = {
  name: "ZAI_General_Agent",
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 4096,
};

// Create and configure your Z.AI agent with general API endpoint
const agent = new AgentForceAgent(config)
  .useLLM("z-ai", "api/glm-4.7", modelConfig)
  .systemPrompt("You are a helpful AI assistant powered by Z.AI's general API endpoint.")
  .prompt("Hello! Can you introduce yourself?");

// Run the agent
const response = await agent.output("md");
console.log(response);
