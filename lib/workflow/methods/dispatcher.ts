import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Sets the dispatcher agent for the workflow.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param agent - The AgentForceAgent to set as the dispatcher.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function dispatcher(this: AgentForceWorkflow, agent: AgentForceAgent): AgentForceWorkflow {
    this.setDispatcher(agent);
    return this;
}
