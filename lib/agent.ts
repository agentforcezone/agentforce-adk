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
} from "./agent/mod";

import type { 
    AgentConfig, 
    ProviderType, 
    OutputType,
    AgentForceLogger,
} from "./types";

export type { AgentConfig };

import { defaultLogger } from "./logger";

/**
 * Represents an AI agent within the AgentForce framework.
 * This class provides the core functionality for creating and managing AI agents,
 * including configuration of name, type, AI provider, and model.
 *
 * @class AgentForceAgent
 */
export class AgentForceAgent {

    private name: string;
    private agentSystemPrompt: string = "You are an AI agent created by AgentForce. You can perform various tasks based on the methods provided.";
    private userPrompt: string = "";
    private template: string = "";
    private tools: string[] = [];
    private chatHistory: {role: string, content: string}[] = [];
    private logger: AgentForceLogger;

    private provider: string = "ollama";
    private model: string = "gemma3:4b";

    /**
     * Constructs the AgentForceAgent class.
     * @param config - Configuration object for the agent
     */
    constructor(config: AgentConfig) {
        this.name = config.name;
        this.tools = config.tools || [];
        // Accept injected logger or use default
        this.logger = config.logger || defaultLogger;
    }

    /**
     * Get the name of the agent.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get the tools of the agent.
     */
    public getTools(): string[] {
        return this.tools;
    }

    /**
     * Get the user prompt of the agent.
     */
    protected getUserPrompt(): string {
        return this.userPrompt;
    }

    /**
     * Set the user prompt of the agent.
     * @param prompt - The user prompt to set
     */
    protected setUserPrompt(prompt: string): void {
        this.userPrompt = prompt;
    }

    /**
     * Get the system prompt of the agent.
     */
    public getSystemPrompt(): string {
        return this.agentSystemPrompt;
    }

    /**
     * Set the system prompt of the agent.
     * @param prompt - The system prompt to set
     */
    protected setSystemPrompt(prompt: string): void {
        this.agentSystemPrompt = prompt;
    }

    /**
     * Get the template content of the agent.
     */
    public getTemplate(): string {
        return this.template;
    }

    /**
     * Set the template content of the agent.
     * @param template - The template content to set
     */
    protected setTemplate(template: string): void {
        this.template = template;
    }

    /**
     * Get the name of the AgentForceAgent model.
     */
    public getModel(): string {
        return this.model;
    }

    /**
     * Set the name of the AgentForceAgent model.
     * @param model
     */
    public setModel(model: string): void {
        this.model = model;
    }

    /**
     * Get the name of the AgentForceAgent provider.
     */
    public getProvider(): string {
        return this.provider;
    }

    /**
     * Set the name of the AgentForceAgent provider.
     * @param provider
     */
    public setProvider(provider: string): void {
        this.provider = provider;
    }

    /**
     * Push a response to the chat history.
     * @param role - The role of the message sender ('user' or 'assistant')
     * @param content - The content of the message
     */
    protected pushToChatHistory(role: string, content: string): void {
        this.chatHistory.push({ role, content });
    }

    /**
     * Get the chat history.
     * @returns Array of chat messages with role and content
     */
    protected getChatHistory(): {role: string, content: string}[] {
        return this.chatHistory;
    }

    /**
     * Get the logger instance.
     */
    protected getLogger(): AgentForceLogger {
        return this.logger;
    }

    /**
     * Execute the agent with the current user prompt.
     * @returns The response from the agent
     */
    protected execute: (userPrompt?: string) => Promise<string> = execute.bind(this);

    // Chainable methods
    debug: () => AgentForceAgent = debug.bind(this);
    useLLM: (provider?: ProviderType, model?: string) => AgentForceAgent = useLLM.bind(this);
    systemPrompt: (prompt: string) => AgentForceAgent = systemPrompt.bind(this);
    prompt: (userPrompt: string) => AgentForceAgent = prompt.bind(this);
    withTemplate: (templatePath: string, templateData?: Record<string, unknown>) => AgentForceAgent = withTemplate.bind(this);
    run: () => Promise<AgentForceAgent> = run.bind(this);
    
    // Terminal/Non-chainable methods (return output, not this)
    serve: (host?: string, port?: number) => Promise<void> = serve.bind(this);
    output: (outputType: OutputType) => Promise<string | object> = output.bind(this);
    getResponse: () => Promise<string> = getResponse.bind(this);
    saveToFile: (fileName: string) => Promise<string> = saveToFile.bind(this);

}
