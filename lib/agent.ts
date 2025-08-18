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
    task,
    addMCP,
} from "./agent/mod";

import type { 
    AgentConfig, 
    ProviderType, 
    OutputType,
    AgentForceLogger,
    ModelConfig,
    MCPServerConfig,
} from "./types";

export type { AgentConfig };

import { defaultLogger } from "./logger";

/**
 * Represents an AI agent within the AgentForce framework.
 * This class provides the core functionality for creating and managing AI agents,
 * including configuration of name, type, AI provider, and model.
 *
 * @example Basic agent creation and execution
 * ```ts
 * const agent = new AgentForceAgent({ name: "Assistant" })
 *   .systemPrompt("You are a helpful AI assistant")
 *   .useLLM("ollama", "llama2")
 *   .prompt("What is TypeScript?");
 * 
 * const response = await agent.run();
 * console.log(response);
 * ```
 * 
 * @example Agent with tools and skills
 * ```ts
 * const agent = new AgentForceAgent({
 *   name: "DataAnalyst",
 *   tools: ["web_fetch", "fs_read_file"],
 *   skills: ["data-analysis.md"]
 * })
 *   .systemPrompt("You are a data analyst")
 *   .useLLM("openrouter", "anthropic/claude-3-haiku")
 *   .task("Fetch latest data from the API")
 *   .task("Analyze the trends")
 *   .task("Save results to file");
 * 
 * const results = await agent.run();
 * ```
 * 
 * @example Method chaining for complex workflows
 * ```ts
 * const response = await new AgentForceAgent({ name: "Writer" })
 *   .debug()
 *   .systemPrompt("You are a creative writer")
 *   .withTemplate("story-template.hbs", { genre: "sci-fi" })
 *   .useLLM("google", "gemini-1.5-flash")
 *   .prompt("Write a short story about AI")
 *   .run();
 * ```
 *
 * @class AgentForceAgent
 */
export class AgentForceAgent {

    private name: string;
    private agentSystemPrompt: string = "You are an AI agent created by AgentForceZone. You can perform various tasks based on the methods provided.";
    private userPrompt: string = "";
    private template: string = "";
    private tools: string[] = [];
    private skills: string[] = [];
    private mcps: string[] = [];
    private mcpConfig?: string;
    private customMcpConfigs: Map<string, MCPServerConfig> = new Map();
    private assetPath: string = ".";
    private taskList: {description: string, result: string | null}[] = [];
    private chatHistory: {role: string, content: string}[] = [];
    private logger: AgentForceLogger;

    private provider: string = "ollama";
    private model: string = "gemma3:4b";
    private modelConfig?: ModelConfig; // store provider model configuration

    /**
     * Constructs the AgentForceAgent class.
     * 
     * @param config - Configuration object for the agent
     * @param config.name - The name of the agent
     * @param config.tools - Optional array of tool types the agent can use
     * @param config.skills - Optional array of skill file paths to load
     * @param config.assetPath - Optional base path for assets (defaults to current directory)
     * @param config.logger - Optional custom logger instance
     * 
     * @example
     * ```ts
     * const agent = new AgentForceAgent({
     *   name: "DataAnalyst",
     *   tools: ["web_fetch", "fs_read_file"],
     *   skills: ["data-analysis.md"],
     *   assetPath: "./assets"
     * });
     * ```
     */
    constructor(config: AgentConfig) {
        this.name = config.name;
        this.tools = config.tools || [];
        this.skills = config.skills || [];
        this.mcps = config.mcps || [];
        this.mcpConfig = config.mcpConfig;
        
        // AssetPath priority: config.assetPath > AGENT_ASSETS_PATH env var > default "."
        this.assetPath = config.assetPath || process.env.AGENT_ASSETS_PATH || ".";
        
        // Handle logger configuration
        if (config.logger) {
            if (Array.isArray(config.logger)) {
                // New array-based configuration for logging modes
                const loggers: AgentForceLogger[] = [];
                
                if (config.logger.includes("default")) {
                    loggers.push(defaultLogger);
                }
                
                if (config.logger.includes("file")) {
                    const { createFileLogger } = require("./logger");
                    const fileLogger = createFileLogger(config.name, config.logPath);
                    loggers.push(fileLogger);
                }
                
                // Use composite logger if multiple modes, otherwise use single logger
                if (loggers.length > 1) {
                    const { createCompositeLogger } = require("./logger");
                    this.logger = createCompositeLogger(loggers);
                } else if (loggers.length === 1) {
                    this.logger = loggers[0]!;
                } else {
                    // No valid logger modes specified, use default
                    this.logger = defaultLogger;
                }
            } else {
                // Existing custom logger (backward compatibility)
                this.logger = config.logger;
            }
        } else {
            // Default behavior - console logging only
            this.logger = defaultLogger;
        }
    }

    /**
     * Get the name of the agent.
     * 
     * @returns {string} The agent's name
     */
    protected getName(): string {
        return this.name;
    }

    /**
     * Get the tools configured for the agent.
     * 
     * @returns {string[]} Array of tool names the agent can use
     */
    protected getTools(): string[] {
        return this.tools;
    }

    /**
     * Get the skills of the agent.
     */
    protected getSkills(): string[] {
        return this.skills;
    }

    /**
     * Get the MCP servers configured for the agent.
     * 
     * @returns {string[]} Array of MCP server names the agent can connect to
     */
    protected getMCPs(): string[] {
        return this.mcps;
    }

    /**
     * Set the MCP servers for the agent.
     * @param mcps - Array of MCP server names to set
     */
    protected setMCPs(mcps: string[]): void {
        this.mcps = mcps;
    }

    /**
     * Get the MCP config file path for the agent.
     * 
     * @returns {string | undefined} Path to the agent-specific MCP config file
     */
    protected getMcpConfig(): string | undefined {
        return this.mcpConfig;
    }

    /**
     * Get custom MCP server configurations for the agent.
     * 
     * @returns {Map<string, MCPServerConfig>} Map of server names to their configurations
     */
    protected getCustomMcpConfigs(): Map<string, MCPServerConfig> {
        return this.customMcpConfigs;
    }

    /**
     * Add a custom MCP server configuration.
     * 
     * @param name - Server name
     * @param config - Server configuration
     */
    protected addCustomMcpConfig(name: string, config: MCPServerConfig): void {
        this.customMcpConfigs.set(name, config);
    }

    /**
     * Get the asset path of the agent.
     */
    protected getAssetPath(): string {
        return this.assetPath;
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
    protected getSystemPrompt(): string {
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
    protected getTemplate(): string {
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
    protected getModel(): string {
        return this.model;
    }

    /**
     * Set the name of the AgentForceAgent model.
     * @param model
     */
    protected setModel(model: string): void {
        this.model = model;
    }

    /**
     * Get the name of the AgentForceAgent provider.
     */
    protected getProvider(): string {
        return this.provider;
    }

    /**
     * Set the name of the AgentForceAgent provider.
     * @param provider
     */
    protected setProvider(provider: string): void {
        this.provider = provider;
    }

    /**
     * Get the provider model configuration.
     */
    protected getModelConfig(): ModelConfig | undefined {
        return this.modelConfig;
    }

    /**
     * Set the provider model configuration.
     */
    protected setModelConfig(config?: ModelConfig): void {
        this.modelConfig = config;
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
     * Get the task list.
     */
    protected getTaskList(): {description: string, result: string | null}[] {
        return this.taskList;
    }

    /**
     * Set the task list.
     * @param taskList - The task list to set
     */
    protected setTaskList(taskList: {description: string, result: string | null}[]): void {
        this.taskList = taskList;
    }

    /**
     * Clear the task list.
     */
    protected clearTaskList(): void {
        this.taskList = [];
    }

    /**
     * Execute the agent with the current user prompt.
     * @returns The response from the agent
     */
    protected execute: (userPrompt?: string) => Promise<string> = execute.bind(this);


    // Chainable methods
    debug: () => AgentForceAgent = debug.bind(this);
    useLLM: (provider?: ProviderType, model?: string, modelConfig?: ModelConfig) => AgentForceAgent = useLLM.bind(this);
    systemPrompt: (prompt: string) => AgentForceAgent = systemPrompt.bind(this);
    prompt: (userPrompt: string) => AgentForceAgent = prompt.bind(this);
    withTemplate: (templatePath: string, templateData?: Record<string, unknown>) => AgentForceAgent = withTemplate.bind(this);
    task: (taskDescription: string) => AgentForceAgent = task.bind(this);
    addMCP: (serverNameOrConfig: string | MCPServerConfig) => AgentForceAgent = addMCP.bind(this);
    run: () => Promise<AgentForceAgent> = run.bind(this);
    
    // Execution/Non-chainable methods (return output, not this)
    serve: (host?: string, port?: number) => Promise<void> = serve.bind(this);
    output: (outputType: OutputType, enableCodeBlockParsing?: boolean) => Promise<string | object> = output.bind(this);
    getResponse: () => Promise<string> = getResponse.bind(this);
    saveToFile: (fileName: string) => Promise<string> = saveToFile.bind(this);

}
