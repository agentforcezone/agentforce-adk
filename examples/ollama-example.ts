import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

// Create agent configuration
const agentConfig: AgentConfig = {
    name: "OllamaTestAgent", 
    type: "test-agent"
};

// Create a new agent instance
const agent = new AgentForceAgent(agentConfig);

// Example 1: Use Ollama with default model
console.log("=== Example 1: Ollama with default model ===");
agent.useLLM("ollama", "gemma3:4b").debug();

console.log("\n=== Example 2: Ollama with different model ===");
agent.useLLM("ollama", "llama3.1").debug();

console.log("\n=== Example 3: Other providers (not implemented yet) ===");
agent.useLLM("openai", "gpt-4").debug();
agent.useLLM("anthropic", "claude-3").debug();

console.log("\n=== Example 4: Method chaining ===");
agent
    .useLLM("ollama", "phi4-mini:latest")
    .systemPrompt("You are a helpful AI assistant running on Ollama")
    .prompt("Hello, how are you?")
    .output("json")
    .debug();
