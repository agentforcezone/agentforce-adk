import type { AgentForceWorkflow } from "../../workflow";
import type { AgentForceAgent } from "../../agent";

/**
 * Registers an agent with the workflow.
 * This makes the agent available for use in other steps like sequence, parallel, or by a dispatcher.
 *
 * @param this - The AgentForceWorkflow instance.
 * @param agent - The AgentForceAgent to register.
 * @returns The AgentForceWorkflow instance for method chaining.
 */
export function registerAgent(this: AgentForceWorkflow, agent: AgentForceAgent): AgentForceWorkflow {
    // @ts-ignore
    this.pushAgent(agent.getName(), agent, [], agent.getTools());
    // @ts-ignore
    this.agentToolRegistry.set(agent.getName(), agent.getTools());
    this.getLogger().info({ message: `Registered agent: ${agent.getName()}` });
    return this;
}
