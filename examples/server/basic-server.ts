import { AgentForceAgent, AgentForceServer, type RouteAgentSchema } from "../../lib/mod"; //"@agentforce/adk";

const UserStoryAgent = new AgentForceAgent({ name: "StoryCreationAgent"})
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a Product Owner agent. You will respond with a user story.")
    .withTemplate("examples/templates/user-story.md");

// Define schemas for custom endpoints (reqired inputs and outputs)
const UserStorySchema: RouteAgentSchema = {
    input: ["prompt", "persona"],
    output: ["success", "persona", "prompt", "response"]
};

new AgentForceServer({ name: "StoryCreationServer" })
    // Add static routes
    .addRoute("GET", "/health", {"status": "ok"})
    
    // Add custom routes with schemas
    .addRouteAgent("POST", "/create-user-story", UserStoryAgent, UserStorySchema)
    
    // Start server with default host and port (0.0.0.0:3000)
    .serve();
