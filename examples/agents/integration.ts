import { AgentForceAgent, type AgentConfig } from "../../lib";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "integration-test-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a joke about pirates")
    .output("json");

console.log(JSON.stringify(output, null, 2));
