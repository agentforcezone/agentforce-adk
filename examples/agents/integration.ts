import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "integration-test-agent"
};

const agent = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a joke about pirates")
    .run();

let output = agent.output("json");

console.log(JSON.stringify(output, null, 2));
