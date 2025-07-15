import {
    debug,
    useLLM,
    serve,
    systemPrompt,
    prompt,
    output,
    run,
    execute,
    saveToFile,
    getResponse,
    withTemplate,
} from './agent/mod';

import pino from 'pino';

import type { AgentConfig, LoggerType, ProviderType, OutputType } from './types';
export type { AgentConfig };

/**
 * Represents an AI agent within the AgentForce framework.
 * This class provides the core functionality for creating and managing AI agents,
 * including configuration of name, type, AI provider, and model.
 *
 * @class AgentForceAgent
 */
export class AgentForceAgent {

    private _name: string;
    private _type: string;
    private _systemPrompt: string = "You are an AI agent created by AgentForce. You can perform various tasks based on the methods provided.";
    private _userPrompt: string = "";
    private _template: string = "";
    private _chatHistory: {role: string, content: string}[] = [];

    private _logger: LoggerType = "json";
    private _pinoLogger: pino.Logger;

    private _provider: string = "ollama";
    private _model: string = "gemma3:4b"

    /**
     * Constructs the AgentForceAgent class.
     * @param config - Configuration object for the agent
     */
    constructor(config: AgentConfig) {
        this._name = config.name;
        this._type = config.type;
        this._logger = config.logger || "json";
        
        // Initialize pino logger based on the logger type
        if (this._logger === "pretty") {
            try {
                this._pinoLogger = pino({
                    transport: {
                        target: 'pino-pretty',
                        options: {
                            colorize: true
                        }
                    }
                });
            } catch (error) {
                // Fallback to JSON logger if pino-pretty is not available
                console.warn('⚠️  pino-pretty not found. Falling back to JSON logger. Install pino-pretty for pretty logging: npm install pino-pretty');
                this._pinoLogger = pino();
                this._logger = "json";
            }
        } else {
            this._pinoLogger = pino();
        }
    }

    /**
     * Get the name of the agent.
     */
    public getName(): string {
        return this._name;
    }

    /**
     * Get the type of the agent.
     */
    public getType(): string {
        return this._type;
    }

    /**
     * Get the user prompt of the agent.
     */
    protected getUserPrompt(): string {
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
    public getSystemPrompt(): string {
        return this._systemPrompt;
    }

    /**
     * Set the system prompt of the agent.
     * @param prompt - The system prompt to set
     */
    protected setSystemPrompt(prompt: string): void {
        this._systemPrompt = prompt;
    }

    /**
     * Get the template content of the agent.
     */
    public getTemplate(): string {
        return this._template;
    }

    /**
     * Set the template content of the agent.
     * @param template - The template content to set
     */
    protected setTemplate(template: string): void {
        this._template = template;
    }

    /**
     * Get the name of the AgentForceAgent model.
     */
    public getModel(): string {
        return this._model;
    }

    /**
     * Set the name of the AgentForceAgent model.
     * @param model
     */
    protected setModel(model: string): void {
        this._model = model;
    }

    /**
     * Get the name of the AgentForceAgent provider.
     */
    public getProvider(): string {
        return this._provider;
    }

    /**
     * Set the name of the AgentForceAgent provider.
     * @param provider
     */
    protected setProvider(provider: string): void {
        this._provider = provider;
    }

    /**
     * Push a response to the chat history.
     * @param role - The role of the message sender ('user' or 'assistant')
     * @param content - The content of the message
     */
    protected pushToChatHistory(role: string, content: string): void {
        this._chatHistory.push({ role, content });
    }

    /**
     * Get the chat history.
     * @returns Array of chat messages with role and content
     */
    protected getChatHistory(): {role: string, content: string}[] {
        return this._chatHistory;
    }

    /**
     * Get the logger type of the agent.
     */
    public getLoggerType(): LoggerType {
        return this._logger;
    }

    /**
     * Get the pino logger instance.
     */
    protected getLogger(): pino.Logger {
        return this._pinoLogger;
    }

    protected execute: (userPrompt?: string) => Promise<string> = execute.bind(this);

    // Chainable methods
    debug: () => AgentForceAgent = debug.bind(this);
    useLLM: (provider?: ProviderType, model?: string) => AgentForceAgent = useLLM.bind(this);
    systemPrompt: (prompt: string) => AgentForceAgent = systemPrompt.bind(this);
    prompt: (userPrompt: string) => AgentForceAgent = prompt.bind(this);
    withTemplate: (templatePath: string) => AgentForceAgent = withTemplate.bind(this);
    run: () => Promise<AgentForceAgent> = run.bind(this);
    
    // Terminal/Non-chainable methods (return output, not this)
    serve: (host?: string, port?: number) => void = serve.bind(this);
    output: (outputType: OutputType) => Promise<string | object> = output.bind(this);
    getResponse: () => Promise<string> = getResponse.bind(this);
    saveToFile: (fileName: string) => Promise<string> = saveToFile.bind(this);

}
