import { AgentForceAgent, type AgentConfig } from "../../lib";

const agentConfig: AgentConfig = {
    name: "IntegrationTestAgent",
    type: "product-owner-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a product owner agent. You will create Tickets (Epics, user stories, and tasks) for the Backlog.")
    .prompt("create a Story to initialize the AWS Account")
    .withTemplate("templates/story.hbs", {
        title: "AWS Account Initialization",
        persona: "DevOps Engineer"
    })
    .saveToFile("story-hbs.md");

console.log(JSON.stringify(output, null, 2));
