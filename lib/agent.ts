import {
    debug,
    useLLM,
    serve,
    systemPrompt,
    prompt,
    output
} from '@agentforce-sdk/mod';

import type { AgentConfig } from './types';
export type { AgentConfig };

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

    private _name: string;
    private _type: string;
    private _systemPrompt: string = "You are an AI agent created by AgentForce. You can perform various tasks based on the methods provided.";
    private _userPrompt: string = "";

    private logging: boolean = true;

    private provider: string = "ollama";
    private model: string = "gemma3:4b"

    /**
     * Constructs the AgentForceAgent class.
     * @param config - Configuration object for the agent
     */
    constructor(config: AgentConfig) {
        this._name = config.name;
        this._type = config.type;
    }

    /**
     * Get the name of the agent.
     */
    protected getName() {
        return this._name;
    }

    /**
     * Get the type of the agent.
     */
    protected getType() {
        return this._type;
    }

    /**
     * Get the user prompt of the agent.
     */
    protected getUserPrompt() {
        return this._userPrompt;
    }

    /**
     * Set the user prompt of the agent.
     * @param prompt - The user prompt to set
     */
    protected setUserPrompt(prompt: string) {
        this._userPrompt = prompt;
    }

    /**
     * Get the system prompt of the agent.
     */
    protected getSystemPrompt() {
        return this._systemPrompt;
    }

    /**
     * Set the system prompt of the agent.
     * @param prompt - The system prompt to set
     */
    protected setSystemPrompt(prompt: string) {
        this._systemPrompt = prompt;
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
    serve = serve.bind(this);
    systemPrompt = systemPrompt.bind(this);
    prompt = prompt.bind(this);
    output = output.bind(this);

}