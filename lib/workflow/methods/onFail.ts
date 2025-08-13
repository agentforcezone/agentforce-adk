import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Attaches a failure handler to the last step in the execution plan.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param agent - The agent to execute on failure.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function onFail(this: AgentForceWorkflow, agent: AgentForceAgent): AgentForceWorkflow {
    const lastStep = this.executionPlan[this.executionPlan.length - 1];
    if (lastStep) {
        lastStep.onFail = agent;
    } else {
        const logger = this.getLogger();
        logger.warn("Cannot call .onFail() before defining a step.");
    }
    return this;
}