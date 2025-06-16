import {
    debug,
    useLLM
} from '@agentforce-sdk/mod';

/**
 * define the agent config type
 * @typedef { Object } AgentConfig
 * @property { string } name - Name of the agent
 * @property { string } type - Type of the agent
 */
export type AgentConfig = {
    name: string;
    type: string;
};

/**
 * Represents an AI agent within the AgentForce framework.
 * This class provides the core functionality for creating and managing AI agents,
 * including configuration of name, type, AI provider, and model.
 *
 * @class AgentForceAgent
 * @example
 * ```typescript
 * import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";
 *
 * // Define the agent's configuration
 * const agentConfig: AgentConfig = {
 *   name: "MyAwesomeAgent",
 *   type: "TaskExecutionAgent"
 * };
 *
 * // Create a new agent instance
 * const agent = new AgentForceAgent(agentConfig);
 *
 * // Log agent's name and type
 * console.log(`Agent Name: ${agent.name}`);
 * console.log(`Agent Type: ${agent.type}`);
 *
 * // Get debug information
 * const debugInfo = agent.debug();
 * console.log("Debug Info:", debugInfo);
 * // Expected output:
 * // Debug Info: { name: 'MyAwesomeAgent', type: 'TaskExecutionAgent', provider: 'ollama', model: 'gemma3:4b' }
 * ```
 */
export default class AgentForceAgent {

    name: string;
    type: string;

    private logging: boolean = true;

    private provider: string = "ollama";
    private model: string = "gemma3:4b"

    /**
     * Constructs the AgentForceAgent class.
     * @param config - Configuration object for the agent
     */
    constructor(config: AgentConfig) {
        this.name = config.name;
        this.type = config.type;
    }

    /**
     * Get the name of the AgentForceAgent model.
     */
    getModel() {
        return this.model;
    }

    /**
     * Set the name of the AgentForceAgent model.
     * @param model
     */
    setModel(model: string) {
        this.model = model;
    }

    /**
     * Get the name of the AgentForceAgent provider.
     */
    getProvider() {
        return this.provider;
    }

    /**
     * Set the name of the AgentForceAgent provider.
     * @param provider
     */
    setProvider(provider: string) {
        this.provider = provider;
    }

    debug = debug.bind(this);
    useLLM = useLLM.bind(this);

}