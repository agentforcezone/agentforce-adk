import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "ModelsTestAgent",
    type: "test-models-agent"
};

// Create an agent with Ollama provider and start server to test models endpoint
const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .debug()
    .serve("localhost", 3001); // Use port 3001 to avoid conflicts
