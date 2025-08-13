import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Attaches a success handler to the last step in the execution plan.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param agent - The agent to execute on success.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function onSuccess(this: AgentForceWorkflow, agent: AgentForceAgent): AgentForceWorkflow {
    const lastStep = this.executionPlan[this.executionPlan.length - 1];
    if (lastStep) {
        lastStep.onSuccess = agent;
    } else {
        const logger = this.getLogger();
        logger.warn("Cannot call .onSuccess() before defining a step.");
    }
    return this;
}