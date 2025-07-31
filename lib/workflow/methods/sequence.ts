import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Adds a 'sequence' step to the execution plan.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param agents - An array of agents to execute in sequence.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function sequence(this: AgentForceWorkflow, agents: AgentForceAgent[]): AgentForceWorkflow {
    this.executionPlan.push({ type: "sequence", payload: agents });
    return this;
}