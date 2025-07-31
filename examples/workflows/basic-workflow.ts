import { AgentForceAgent, AgentForceWorkflow } from "../../lib/mod";

const Dispatcher = new AgentForceAgent({ name: "DispatcherAgent" })
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You will manage the workflow and coordinate between different agents.")

const GCPAgent = new AgentForceAgent({
    name: "gcpAgent",
    skills: ["devops"]
})
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a GCP expert. You will run gcloud commands to create resources in GCP.")

const ProductOwnerAgent = new AgentForceAgent({
    name: "productOwnerAgent",
    skills: ["productOwner"]
})
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You will create a user story based on the user prompt.");

const workflowOutput = await new AgentForceWorkflow({ name: "TaskListWorkflow"})
    .prompt("I want to create a Cloudbucket in GCP using gcloud cli")
    .dispatcher(Dispatcher) 
    .sharedStore("projectId", "my-gcp-project")
    .registerAgent(GCPAgent)
    .registerAgent(ProductOwnerAgent)
    .run();

console.log(JSON.stringify(workflowOutput, null, 2));