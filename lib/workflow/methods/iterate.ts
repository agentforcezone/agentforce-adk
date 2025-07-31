import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Adds an 'iterate' step to the execution plan.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param items - An array of items or a key to a list in the sharedStore.
 * @param agent - The agent to execute for each item.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function iterate(this: AgentForceWorkflow, items: any[] | string, agent: AgentForceAgent): AgentForceWorkflow {
    this.executionPlan.push({ type: "iterate", payload: { items, agent } });
    return this;
}