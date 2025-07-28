import type { AgentForceWorkflow } from "../../workflow";

/**
 * Sets the initial user prompt for the workflow.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param userPrompt - The prompt to set.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function prompt(this: AgentForceWorkflow, userPrompt: string): AgentForceWorkflow {
    this.setUserPrompt(userPrompt);
    return this;
}
