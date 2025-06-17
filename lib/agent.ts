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
 * // Debug method is chainable and logs information
 * agent.useLLM("openai", "gpt-4").debug();
 * ```
 */
export default class AgentForceAgent {

    private name: string;
    private type: string;

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
     * Get the name of the agent.
     */
    protected getName() {
        return this.name;
    }

    /**
     * Get the type of the agent.
     */
    protected getType() {
        return this.type;
    }

    /**
     * Get the name of the AgentForceAgent model.
     */
    protected getModel() {
        return this.model;
    }

    /**
     * Set the name of the AgentForceAgent model.
     * @param model
     */
    protected setModel(model: string) {
        this.model = model;
    }

    /**
     * Get the name of the AgentForceAgent provider.
     */
    protected getProvider() {
        return this.provider;
    }

    /**
     * Set the name of the AgentForceAgent provider.
     * @param provider
     */
    protected setProvider(provider: string) {
        this.provider = provider;
    }

    // Functions for chaining methods from lib/methods

    debug = debug.bind(this);
    useLLM = useLLM.bind(this);

}