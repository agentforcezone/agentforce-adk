import type { AgentForceAgent } from "../../../agent";
import { execute } from "./execute";

/**
 * Executes the agent's chain by making the actual API call to the configured provider
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<AgentForceAgent>} Returns the agent instance for method chaining
 */
export async function run(this: AgentForceAgent): Promise<AgentForceAgent> {
    try {
        // Use the execute function to handle the provider call
        await execute.call(this);
    } catch {
        // Error handling is already done in execute function
        // Just continue with the chain
    }

    // Return 'this' for method chaining
    return this;
}
