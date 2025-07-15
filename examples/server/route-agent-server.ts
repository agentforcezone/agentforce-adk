import AgentForceServer, { type ServerConfig } from "@lib/server";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "product-owner-agent"
};

const ProductOwnerAgent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a product owner agent. You will create Tickets (Epics, user stories, and tasks) for the Backlog.")
    .withTemplate("templates/basic-story.md");

const serverConfig: ServerConfig = {
    name: "RouteAgentServer",
    logger: "json",
};

new AgentForceServer(serverConfig)

    //.registerWorkflow("examples/workflows/story-creation.ts")
    .addRouteAgent("POST","/story", ProductOwnerAgent)
    .addRouteAgent("GET","/story", ProductOwnerAgent)
    //.addRouteAgent("GET","/image", DesignAgent)
    .serve("localhost", 3000);
