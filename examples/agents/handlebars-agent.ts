import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "HandlebarsTestAgent",
    type: "product-owner-agent",
    logger: "pretty"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a product owner agent. You will create Tickets (Epics, user stories, and tasks) for the Backlog.")
    .prompt("create a Story to initialize the AWS Account")
    .withTemplate("examples/templates/story.hbs", {
        title: "AWS Account Initialization",
        persona: "DevOps Engineer"
    })
    .saveToFile("examples/files/handlebars-story.md");

console.log(JSON.stringify(output, null, 2));
