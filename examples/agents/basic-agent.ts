import { AgentForceAgent } from "../../lib/agent"; //"@agentforce/adk";

// Create and configure your agent
const agent = new AgentForceAgent({ name: "StoryTellerAgent" })
  .useLLM("ollama", "gemma3:4b") 
  .systemPrompt("You are a creative story writer.")
  .prompt("Write a short story about AI and humanity.");

// Run the agent and get the response in markdown format
const response = await agent.output("md");
console.log(response);