import type { AgentForceWorkflow, ExecutionStep } from "../../../workflow";
import type { AgentForceAgent } from "../../../agent";

/**
 * Executes a single step in the workflow's execution plan.
 * This is a helper function for the main `run` function.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param step - The execution step to process.
 * @param input - The input for the current step, often the output of the previous step.
 * @returns The output of the executed step.
 */
async function executeStep(this: AgentForceWorkflow, step: ExecutionStep, input: any): Promise<any> {
    this.getLogger().debug({ message: `Executing step: ${step.type}`, input });
    let output: any;
    let success = true;

    try {
        switch (step.type) {
            case 'prompt':
                this.setUserPrompt(step.payload);
                output = step.payload; // Pass the prompt content as output
                break;

            case 'sequence':
                let sequenceInput = input;
                const sequenceAgents = step.payload as AgentForceAgent[];
                for (const agent of sequenceAgents) {
                    this.getLogger().info({ message: `Executing agent '${agent.getName()}' in sequence.` });
                    sequenceInput = await agent.execute(sequenceInput);
                }
                output = sequenceInput;
                break;

            case 'parallel':
                const parallelAgents = step.payload as AgentForceAgent[];
                this.getLogger().info({ message: `Executing ${parallelAgents.length} agents in parallel.` });
                const parallelPromises = parallelAgents.map(agent => agent.execute(input));
                output = await Promise.all(parallelPromises);
                break;

            case 'iterate':
                const { items, agent } = step.payload;
                let itemList: any[] = [];

                if (typeof items === 'string') {
                    itemList = this.getSharedStoreItem(items);
                    if (!Array.isArray(itemList)) {
                        throw new Error(`Shared store key "${items}" for iteration does not contain an array.`);
                    }
                } else {
                    itemList = items;
                }
                
                this.getLogger().info({ message: `Iterating over ${itemList.length} items with agent '${agent.getName()}'.` });
                const iterationPromises = itemList.map(item => agent.execute(item));
                output = await Promise.all(iterationPromises);
                break;
        }
    } catch (error) {
        success = false;
        output = error;
        this.getLogger().error({ message: `Step ${step.type} failed`, error: (error as Error).message, stack: (error as Error).stack });
        
        if (step.onFail) {
            this.getLogger().warn({ message: `Executing onFail handler for step: ${step.type}` });
            // The input to the onFail handler is the error message
            return await step.onFail.execute((error as Error).message);
        } else {
            // Re-throw if there's no onFail handler to stop the workflow
            throw error;
        }
    }

    if (success && step.onSuccess) {
        this.getLogger().info({ message: `Executing onSuccess handler for step: ${step.type}` });
        // The input to the onSuccess handler is the output of the successful step
        return await step.onSuccess.execute(output);
    }

    return output;
}

/**
 * Executes the workflow by processing the execution plan step by step.
 *
 * @param this - The AgentForceWorkflow instance.
 * @returns An object containing the final output and the state of the shared store.
 */
export async function run(this: AgentForceWorkflow): Promise<any> {
    this.getLogger().info({ message: "Running workflow...", name: this.getName() });

    if (!this.executionPlan || this.executionPlan.length === 0) {
        this.getLogger().warn({ message: "Execution plan is empty. Nothing to run." });
        return { finalOutput: undefined, sharedStore: Object.fromEntries(this.internalSharedStore.entries()) };
    }

    let lastOutput: any = this.getUserPrompt();

    for (const step of this.executionPlan) {
        lastOutput = await executeStep.call(this, step, lastOutput);
    }

    this.getLogger().info({ message: "Workflow execution finished." });

    return { 
        finalOutput: lastOutput, 
        sharedStore: Object.fromEntries(this.internalSharedStore.entries()) 
    };
}
