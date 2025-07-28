import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Adds a 'parallel' step to the execution plan.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param agents - An array of agents to execute in parallel.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function parallel(this: AgentForceWorkflow, agents: AgentForceAgent[]): AgentForceWorkflow {
    this.executionPlan.push({ type: 'parallel', payload: agents });
    return this;
}