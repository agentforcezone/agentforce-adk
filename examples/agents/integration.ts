import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "integration-test-agent"
};

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a Joke!")
    .run();
