import type { AgentForceWorkflow } from "../../workflow";

/**
 * Logs the finalized executionPlan and other configuration details for inspection.
 *
 * @param this - The AgentForceWorkflow instance.
 */
export function debug(this: AgentForceWorkflow): AgentForceWorkflow {
    const logger = this.getLogger();
    const dispatcherAgent = this.getDispatcher();
    const name = dispatcherAgent!["getName"]();

    logger.info({
        message: "Workflow Debug Information",
        configuration: {
            name: this.getName(),
            logger: "AgentForceLogger",
        },
        prompt: this.getUserPrompt(),
        dispatcher: name || "None",
        executionPlan: this.executionPlan.map(step => ({
            type: step.type,
            description: step.description,
            onSuccess: step.onSuccess?.["getName"](),
            onFail: step.onFail?.["getName"](),
        })),
        registeredAgents: this.agents.map(a => a.name),
        sharedStoreItems: Object.fromEntries(this.internalSharedStore.entries()),
    });
    return this;
}