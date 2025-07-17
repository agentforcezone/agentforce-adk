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
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a Product Owner agent. You will respond with a user story.")
    .withTemplate("examples/templates/user-story.md");

const serverConfig: ServerConfig = {
    name: "IntegrationTestServer",
    logger: "json",
};

// Define schemas for custom endpoints
const userStorySchema: RouteAgentSchema = {
    input: ["prompt", "persona"],
    output: ["success", "persona", "prompt", "response"]
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
    .serve();


// New Methods for integration    
//.addRouteAgent("POST", "/create-tool", OpenAICompatibleAgent, schema)
//.outputSchema("OpenAICompatibleAgent", OpenAICompatibleAgent.schema)

// Example usage with different schemas:
//
// Basic schema (only prompt and response):
// const basicSchema = {
//     input: ["prompt"],
//     output: ["success", "response"]
// };
//
// Extended schema with custom fields:
// const extendedSchema = {
//     input: ["prompt", "project_name", "priority", "assignee"],
//     output: ["success", "prompt", "response", "project_name", "priority", "assignee", "timestamp"]
// };
//
// Usage:
// .addRouteAgent("POST", "/create-task", TaskAgent, extendedSchema)