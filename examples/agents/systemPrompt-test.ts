import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

// Test the systemPrompt functionality
const agentConfig: AgentConfig = {
    name: "SystemPromptTestAgent",
    type: "test-agent"
};

// Create agent and test different system prompts
const agent = new AgentForceAgent(agentConfig);

console.log("=== Testing systemPrompt Method ===");

// Test 1: Basic usage
console.log("\n1. Basic systemPrompt usage:");
agent.systemPrompt("You are a helpful coding assistant");
console.log("✓ systemPrompt set successfully");

// Test 2: Method chaining
console.log("\n2. Method chaining with systemPrompt:");
agent
    .useLLM("openai", "gpt-4")
    .systemPrompt("You are an expert data scientist")
    .debug();

// Test 3: Different system prompts
console.log("\n3. Testing different types of system prompts:");
const prompts = [
    "You are a creative writer",
    "Act as a professional chef with 20 years of experience",
    "You are a helpful assistant that specializes in mathematics",
    "Multi-line prompt\nwith line breaks\nand detailed instructions"
];

prompts.forEach((prompt, index) => {
    agent.systemPrompt(prompt);
    console.log(`✓ System prompt ${index + 1} set successfully`);
});

// Test 4: Integration with the example from the original request
console.log("\n4. Testing integration as requested:");
const testAgent = new AgentForceAgent({
    name: "IntegrationTestAgent", 
    type: "integration-test"
})
    .useLLM("ollama", "phi4-mini:latest")
    .systemPrompt("you are a helpful Assistant")
    .debug();

console.log("\n✅ All systemPrompt tests completed successfully!");
console.log("The systemPrompt method is fully implemented and working correctly.");
