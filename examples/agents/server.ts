import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "WebServerAgent",
    type: "http-server-agent"
};

// Create an agent and start a web server
const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .debug()
    .serve("0.0.0.0", 3000);
