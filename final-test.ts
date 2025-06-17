import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "FinalTestAgent",
    type: "final-test-agent"
};

// Create an agent with Ollama provider and start server for final testing
console.log("Starting final test server...");

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "phi4-mini:latest")
    .debug()
    .serve("localhost", 3005); // Use port 3005
