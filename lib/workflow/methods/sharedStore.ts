import type { AgentForceWorkflow } from "../../workflow";

/**
 * Sets a value in the workflow's shared data store.
 * This value is available to all agents and steps throughout the workflow.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param key - The key to store the data under.
 * @param value - The value to store.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function sharedStore(this: AgentForceWorkflow, key: string, value: any): AgentForceWorkflow {
    this.setSharedStoreItem(key, value);
    const logger = this.getLogger();
    logger.info({ message: `Set shared store key '${key}'` });
    return this;
}