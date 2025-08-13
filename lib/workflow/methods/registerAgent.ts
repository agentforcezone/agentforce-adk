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
    const name = agent["getName"]();
    const tools = agent["getTools"]();
    this.pushAgent(name, agent, [], tools);
    this.agentToolRegistry.set(name, tools);
    const logger = this.getLogger();
    logger.info({ message: `Registered agent: ${name}` });
    return this;
}
