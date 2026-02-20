import { AgentForceAgent } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config = {
  name: "ZAI_Coding_Agent",
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 4096,
};

// Create and configure your Z.AI agent with coding endpoint
const agent = new AgentForceAgent(config)
  .useLLM("z-ai", "coding/glm-4.7", modelConfig)
  .systemPrompt("You are a helpful AI assistant powered by Z.AI's")
  .prompt("Hello! Can you introduce yourself and tell me what you're capable of?");

// Run the agent
const response = await agent.output("md");
console.log(response);
