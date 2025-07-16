import { 
    AgentForceAgent,  
    AgentForceServer,
    type AgentConfig,
    type ServerConfig 
} from "../../lib/mod"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "product-owner-agent"
};

const ProductOwnerAgent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a product owner agent. You will create Tickets (Epics, user stories, and tasks) for the Backlog.")
    .withTemplate("examples/templates/basic-story.md");

const serverConfig: ServerConfig = {
    name: "RouteAgentServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    //.registerWorkflow("examples/workflows/story-creation.ts")
    .addRouteAgent("POST","/story", ProductOwnerAgent)
    .addRouteAgent("GET","/story", ProductOwnerAgent)
    .serve("localhost", 3000);
