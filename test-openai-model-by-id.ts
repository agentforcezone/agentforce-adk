import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "OpenAIModelByIdTestAgent",
    type: "test-openai-model-by-id-agent"
};

// Create an agent with OpenAI provider to test fallback behavior for the new endpoint
console.log("Starting OpenAI server to test /v1/models/{model} endpoint fallback...");

const agent = new AgentForceAgent(agentConfig)
    .useLLM("openai", "gpt-4")
    .debug()
    .serve("localhost", 3004); // Use port 3004
