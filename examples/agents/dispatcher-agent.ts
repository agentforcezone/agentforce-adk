import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "DispatcherTestAgent",
    type: "dispatcher-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a task dispatcher AiAgent, you create a JSON ONLY output for various specific AiAgents that will execute the task from the user.")
    .prompt("Create a Rest endpoint for my bun service")
    .withTemplate("examples/templates/dispatcher.md")
    .getResponse();

console.log(JSON.stringify(output, null, 2));
