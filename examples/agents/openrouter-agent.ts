import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "OpenrouterTestAgent",
    type: "openrouter-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    //.useLLM("openrouter", "moonshotai/kimi-k2:free")
    .useLLM("openrouter", "mistralai/mistral-small-3.2-24b-instruct:free")
    .systemPrompt("you are a funny Pirate")
    .prompt("Drink a bottle of rum and tell me a joke about pirates")
    .output("json");

console.log(JSON.stringify(output, null, 2));
