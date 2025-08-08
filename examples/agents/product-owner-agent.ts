import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const config: AgentConfig = {
  name: "ProductOwnerAgent",
  skills: ["product-owner"]
};

// Create and configure your agent
const ProductOwnerAgent = new AgentForceAgent(config)
  .useLLM("ollama", "gemma3:12b") 
  .systemPrompt("examples/files/prompts/po-systemprompt.md")
  .withTemplate("examples/files/templates/user-story.md")
  .prompt(`
    I need a User Story for a new feature in our product. 
    The feature is a authentication system that allows users to log in using their email and password, 
    with options for two-factor authentication.`
  );

// Run the agent and get the response in markdown format
const response = await ProductOwnerAgent.saveToFile("examples/files/responses/product-owner-agent.md")
console.log(response);