import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("google", "gemini-2.0-flash-exp")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a joke about pirates")
    .output("json");

console.log(JSON.stringify(output, null, 2));
