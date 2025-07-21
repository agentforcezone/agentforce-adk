import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "integration-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("you are a funny Pirate")
    .prompt("tell me a joke about pirates")
    .output("json");

console.log(JSON.stringify(output, null, 2));

// .triggerN8N({ workflowId: "your-workflow-id", data: output })
// .createGithubIssue("agentforcezone/agentforce-adk") or use a tool
// .registerTools("./tools" , [ "github_list_repos.ts", "fs_file_tree.ts" ])
// .function("to_uppercase", (text: string) => text.toUpperCase())
// .function("add_to_number", (num: number, add: number) => num + add)
// .context("context_instruction_file.txt")
// .forwardToAgent(AgentTwo)