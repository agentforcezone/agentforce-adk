import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "DebugAgent",
    type: "model-test-agent"
};

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .systemPrompt("you are a helpful Assistant")
    .debug();

console.log("Agent:", agent);