import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "Context7MCPAgent",
  mcps: ["context7"],
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 8000, 
  maxToolRounds: 20,
};

// Create and configure your MCP-enabled agent
const Context7MCPAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "z-ai/glm-4.5v", modelConfig)
  .prompt(`get library docs from Shadcn version and give me the theme colors options`)


const response = await Context7MCPAgent.saveToFile("examples/files/responses/context7-agent.md");
console.log(response);