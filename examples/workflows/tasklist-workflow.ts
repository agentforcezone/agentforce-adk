import { AgentForceWorkflow, type WorkflowConfig } from "../../lib/workflow";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

const dispatcherConfig: AgentConfig = {
    name: "DispatcherAgent"
};

const Dispatcher = new AgentForceAgent(dispatcherConfig)
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a dispatcher agent. You will manage the workflow and coordinate between different agents. you will create a task list based on the user prompt.")

const GCPAgent = new AgentForceAgent({
    name: "gcpAgent",
    skills: ["devops"]
})
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a GCP expert. You will run gcloud commands to create resources in GCP.")

const PorductOwnerAgent = new AgentForceAgent({
    name: "productOwnerAgent",
    skills: ["productOwner"]
})
    .useLLM("ollama", "gemma3:12b")
    .systemPrompt("You are a product owner agent. You will create a user story based on the user prompt.");

const workflowConfig: WorkflowConfig = {
    name: "TaskListWorkflow"
};

const globalOutput = await new AgentForceWorkflow(workflowConfig)
    .prompt("I want to create a Cloudbucket in GCP using gcloud cli")
    .dispatcher(Dispatcher) 
    .sharedStore("projectId", "my-gcp-project")
    .registerAgent(GCPAgent)
    .registerAgent(PorductOwnerAgent)
    .debug()
    .run();

console.log(JSON.stringify(globalOutput, null, 2));
