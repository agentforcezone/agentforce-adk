import {
    debug,
    useLLM,
    serve,
    systemPrompt,
    prompt,
    output,
    run,
    execute,
    saveToFile
} from '@lib/agent/mod';
import pino from 'pino';

import type { AgentConfig, LoggerType } from './types';
export type { AgentConfig };

/**
 * Represents an AI agent within the AgentForce framework.
 * This class provides the core functionality for creating and managing AI agents,
 * including configuration of name, type, AI provider, and model.
 *
 * @class AgentForceAgent
 */
export default class AgentForceAgent {

    private _name: string;
    private _type: string;
    private _systemPrompt: string = "You are an AI agent created by AgentForce. You can perform various tasks based on the methods provided.";
    private _userPrompt: string = "";
    private _chatHistory: {role: string, content: string}[] = [];

    private logger: LoggerType = "json";
    private _pinoLogger: pino.Logger;

    private provider: string = "ollama";
    private model: string = "gemma3:4b"

    /**
     * Constructs the AgentForceAgent class.
     * @param config - Configuration object for the agent
     */
    constructor(config: AgentConfig) {
        this._name = config.name;
        this._type = config.type;
        this.logger = config.logger || "json";
        
        // Initialize pino logger based on the logger type
        if (this.logger === "pretty") {
            this._pinoLogger = pino({
                transport: {
                    target: 'pino-pretty',
                    options: {
                        colorize: true
                    }
                }
            });
        } else {
            this._pinoLogger = pino();
        }
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

    /**
     * Push a response to the chat history.
     * @param role - The role of the message sender ('user' or 'assistant')
     * @param content - The content of the message
     */
    protected pushToChatHistory(role: string, content: string) {
        this._chatHistory.push({ role, content });
    }

    /**
     * Get the chat history.
     * @returns Array of chat messages with role and content
     */
    protected getChatHistory() {
        return this._chatHistory;
    }

    /**
     * Get the logger type of the agent.
     */
    protected getLoggerType() {
        return this.logger;
    }

    /**
     * Get the pino logger instance.
     */
    protected getLogger() {
        return this._pinoLogger;
    }

    protected execute = execute.bind(this);

    // Chainable methods
    debug = debug.bind(this);
    useLLM = useLLM.bind(this);
    systemPrompt = systemPrompt.bind(this);
    prompt = prompt.bind(this);
    run = run.bind(this);
    
    // Terminal/Non-chainable methods (return output, not this)
    serve = serve.bind(this);
    output = output.bind(this);
    saveToFile = saveToFile.bind(this);

}
