import AgentForceServer, { type ServerConfig } from "@lib/server";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "product-owner-agent"
};

const ProductOwnerAgent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b").systemPrompt("You are a product owner agent. You will answer questions about the product and provide images when requested.")
    //.useTool("web-search", "search", { description: "Search the web for information." })
    //.useTool("image-generator", "generateImage", { description: "Generate an image based on the provided description." })
    .output("json")

const serverConfig: ServerConfig = {
    name: "RouteAgentServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    //.addDispatchAgent(ProductOwnerAgent)
    //.addRouteAgent("POST","/story", ProductOwnerAgent)
    //.addRouteAgent("GET","/image", ProductOwnerAgent)
    .serve("localhost", 3000);
