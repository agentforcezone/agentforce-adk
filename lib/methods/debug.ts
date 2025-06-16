import AgentForceAgent from "@agentforce-sdk/agent";

/**
 * Returns a debug representation of the object.
 *
 * @memberof AgentForceAgent
 * @function debug
 * @returns {Object} An object containing debug information.
 */
export function debug(this: AgentForceAgent): object {
    return {
        name: this.name,
        type: this.type,
        provider: this.getProvider(),
        model: this.getModel()
    };
}