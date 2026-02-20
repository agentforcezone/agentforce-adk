import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import type { ModelConfig } from "../../lib/types";

const config: AgentConfig = {
  name: "ChromeDevToolsMCPAgent",
};

const modelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 128000, // 128k tokens for handling large tool results
  maxToolRounds: 20,
};

// Create and configure your Playwright MCP-enabled agent
const CDTAgent = new AgentForceAgent(config)
  .useLLM("openrouter", "openai/gpt-5-mini", modelConfig)
  .addMCP({
    name: "chrome-devtools",
    command: "npx",
    args: [
      "chrome-devtools-mcp@latest"
    ]
  })
  .prompt(`Use the CDT MCP and open the page https://docs.agentforce.zone/ and summarize the content.`)

const response = await CDTAgent.saveToFile("examples/files/responses/cdt-mcp-agent.md");
console.log(response);
