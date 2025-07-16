import { 
    AgentForceAgent,  
    AgentForceServer,
    type AgentConfig,
    type ServerConfig 
} from "../../lib/mod"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "OpenAICompatibleAgent",
    type: "openai-compatible-agent"
};
const OpenAICompatibleAgent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are an OpenAI compatible agent. You will respond to requests in a compatible format.");

    const serverConfig: ServerConfig = {
    name: "OpenAICompatibleServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    .addRouteAgent("POST", "/v1/chat/completions", OpenAICompatibleAgent)
    .addRouteAgent("GET", "/story", OpenAICompatibleAgent)
    .serve("0.0.0.0", 3000);