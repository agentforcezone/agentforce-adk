import { 
    AgentForceAgent,  
    AgentForceServer,
    type AgentConfig,
    type ServerConfig,
    type RouteAgentSchema 
} from "../../lib/mod"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "IntegrationAgent",
    type: "integration-agent"
};

const Agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are an Integration test agent. You will respond to requests in a compatible format.");

const StoryAgent = new AgentForceAgent(agentConfig)
    .useLLM("openrouter", "mistralai/mistral-small-3.2-24b-instruct:free")
    .systemPrompt("You are a Product Owner agent. You will respond with a user story.")
    .withTemplate("examples/templates/user-story.md");

// Define schemas for custom endpoints
const userStorySchema: RouteAgentSchema = {
    input: ["prompt", "persona"],
    output: ["success", "persona", "prompt", "response"]
};

const serverConfig: ServerConfig = {
    name: "IntegrationTestServer",
    logger: "json",
};

new AgentForceServer(serverConfig)

    // Added the "/v1/chat/completions" route
    .useOpenAICompatibleRouting(Agent) 
    // Added the "/api/generate" and "/api/chat" route
    .useOllamaCompatibleRouting(Agent) 
    
    // Add custom routes with schemas
    .addRouteAgent("POST", "/create-user-story", StoryAgent, userStorySchema)
    
    // add custom route without schema (default in and output)
    .addRouteAgent("GET", "/user-story", StoryAgent)
    
    // Add static routes
    .addRoute("GET", "/health", {"status": "ok"})
    
    // Start server with default host and port (0.0.0.0:3000)
    .serve();
