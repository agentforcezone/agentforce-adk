/**
 * Type definitions for the AgentForce SDK
 */

/**
 * Interface for a logger that can be used by the Agent.
 * It supports log, warn, error, and debug levels.
 */
export interface AgentForceLogger {
    debug: (...args: unknown[]) => void;
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
}

/**
 * Configuration object for creating an AgentForce agent
 * @typedef {Object} AgentConfig
 * @property {string} name - Name of the agent
 * @property {string} type - Type of the agent (e.g., 'developer', 'product-owner')
 * @property {ToolType[]} [tools] - List of tools the agent can use (only predefined tool types allowed)
 * @property {string[]} [skills] - List of skill files to load for the agent
 * @property {string} [assetPath] - Base path for agent assets (skills, templates, etc.), supports both relative and absolute paths, defaults to current working directory
 * @property {AgentForceLogger} [logger] - Logger instance with logging methods
 */
export type AgentConfig = {
    name: string;
    tools?: ToolType[];
    skills?: string[];
    assetPath?: string;
    logger?: AgentForceLogger;
};


/**
 * Configuration object for creating an AgentForce server
 * @typedef {Object} ServerConfig
 * @property {string} name - Name of the server
 * @property {LoggerType} [logger] - Logger format ('json' or 'pretty'), defaults to 'json'
 */
export type ServerConfig = {
    name: string;
    logger?: AgentForceLogger;
};

/**
 * Type definition for output formats
 */
export type OutputType = "text" | "json" | "md";

/**
 * Type definition for supported AI providers
 */
export type ProviderType = "ollama" | "openai" | "anthropic" | "google" | "openrouter";

/**
 * Union type for all available tool types
 * Based on tools available in the tools registry
 */
export type ToolType = 
    | "fs_list_dir"
    | "fs_read_file"
    | "fs_write_file"
    | "fs_move_file"
    | "fs_find_files"
    | "fs_find_dirs_and_files"
    | "fs_search_content"
    | "md_create_ascii_tree"
    | "gh_list_repos"
    | "os_exec"
    | "api_fetch"
    | "web_fetch"
    | "fs_get_file_tree";

/**
 * Configuration for model parameters
 * @typedef {Object} ModelConfig
 * @property {number} [temperature] - Controls randomness in generation (0.0-1.0)
 * @property {number} [maxTokens] - Maximum number of tokens to generate
 * @property {number} [maxToolRounds] - Maximum number of tool-execution rounds per request (default 10)
 * @property {boolean} [appendToolResults] - If true, append raw tool results after the final model response
 * @property {number} [requestDelay] - Delay in seconds between API requests to prevent rate limiting (default 0)
 */
export type ModelConfig = {
    temperature?: number;
    maxTokens?: number;
    maxToolRounds?: number;
    appendToolResults?: boolean;
    requestDelay?: number;
};

/**
 * Configuration object for creating an AgentForce workflow
 * @typedef {Object} WorkflowConfig
 * @property {string} name - Name of the workflow
 * @property {LoggerType} [logger] - Logger format ('json' or 'pretty'), defaults to 'json'
 */
export type WorkflowConfig = {
    name: string;
    logger?: AgentForceLogger;
};

/**
 * Tool definition types for AgentForce ADK
 * These types match the Ollama tool calling format
 */

export interface ToolParameter {
    type: string;
    description: string;
    enum?: string[];
}

export interface ToolProperties {
    [key: string]: ToolParameter;
}

export interface ToolFunction {
    name: string;
    description: string;
    parameters: {
        type: "object";
        properties: ToolProperties;
        required?: string[];
    };
}

export interface Tool {
    type: "function";
    function: ToolFunction;
}

export interface ToolCall {
    function: {
        name: string;
        arguments: Record<string, any>;
    };
}

export interface ToolImplementation {
    definition: Tool;
    execute: (args: Record<string, any>) => Promise<any>;
}

export interface ToolRegistry {
    [key: string]: ToolImplementation;
}
