import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "integration-test-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a joke about pirates")
    .output("json");

console.log(JSON.stringify(output, null, 2));


// .triggerN8N({ workflowId: "your-workflow-id", data: output })
// .iterate("sommer", "winter") run multiple times
// .iterate(["sommer", "winter"], IterationAgent)
// .iterate("sommer", "winter", (item) => item.toUpperCase())
// .createGithubIssue("agentforcezone/agentforce-adk") or use a tool
