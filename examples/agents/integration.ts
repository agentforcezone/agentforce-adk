import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "integration-test-agent"
};

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a Joke!")
    .run();
