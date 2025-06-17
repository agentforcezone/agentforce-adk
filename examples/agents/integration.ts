import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "DebugAgent",
    type: "model-test-agent"
};

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .debug();

console.log("Agent:", agent);