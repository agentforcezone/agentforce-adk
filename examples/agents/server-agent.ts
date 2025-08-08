import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "ServerTestAgent"
};

// Create an agent and start a web server
// now you can run http://localhost:3000/?prompt="Tell me a joke"
new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .debug()
    .serve("0.0.0.0", 3000);

// use `af deploy agent` to deploy this agent to the cloud 