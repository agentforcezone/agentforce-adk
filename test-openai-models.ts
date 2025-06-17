import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "OpenAITestAgent",
    type: "test-openai-agent"
};

// Create an agent with OpenAI provider to test fallback models
const agent = new AgentForceAgent(agentConfig)
    .useLLM("openai", "gpt-4")
    .debug()
    .serve("localhost", 3002); // Use port 3002
