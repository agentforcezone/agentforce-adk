import { AgentForceWorkflow, type WorkflowConfig } from "../../lib/workflow";

const workflowConfig: WorkflowConfig = {
    name: "BasicWorkflow"
};

const workflow = new AgentForceWorkflow(workflowConfig);

console.log(`Workflow "${workflow.getName()}" created successfully.`);
