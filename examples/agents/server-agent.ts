import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "ServerTestAgent"
};

// Create an agent and start a web server (serve is terminal - doesn't return agent)
new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .debug()
    .serve("0.0.0.0", 3000);
