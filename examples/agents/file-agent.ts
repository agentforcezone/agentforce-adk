import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "FileTestAgent"
};

const output = await new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a technical documentation writer. Write clear, direct API documentation without any introductory phrases, acknowledgments, or meta-commentary. Start immediately with the documentation content. Never begin responses with phrases like 'Here is', 'Okay', 'Sure', 'I'll help', or similar introductory statements.")
    .prompt("Write API docs")
    .saveToFile("examples/files/api-docs.md");

console.log(JSON.stringify(output, null, 2));
