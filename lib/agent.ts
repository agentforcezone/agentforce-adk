import {
    debug
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

}