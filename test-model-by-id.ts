import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "ModelByIdTestAgent",
    type: "test-model-by-id-agent"
};

// Create an agent with Ollama provider and start server to test the new endpoint
console.log("Starting server to test /v1/models/{model} endpoint...");

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "mistral-small3.1:latest")
    .debug()
    .serve("localhost", 3003); // Use port 3003
