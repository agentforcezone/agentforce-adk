import { 
    AgentForceAgent,  
    AgentForceServer,
    type AgentConfig,
    type ServerConfig 
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

new AgentForceServer(serverConfig)
    // Added the "/v1/chat/completions" route
    .useOpenAICompatibleRouting(Agent) 
    // Added the "/api/generate" and "/api/chat" route
    .useOllamaCompatibleRouting(Agent) 
    
    // Add custom routes
    .addRouteAgent("POST", "/create-user-story", StoryAgent)
    .addRouteAgent("GET", "/user-story", StoryAgent)
    
    // Add static routes
    .addRoute("GET", "/health", {"status": "ok"})
    .serve();


// New Methods for integration    
//.addRouteAgent("POST", "/create-tool", OpenAICompatibleAgent, schema)
//.outputSchema("OpenAICompatibleAgent", OpenAICompatibleAgent.schema)