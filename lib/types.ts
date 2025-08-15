/**
 * Core type definitions for the AgentForce SDK
 * 
 * This module contains all the essential type definitions used throughout the AgentForce ADK,
 * including configuration interfaces, provider types, tool definitions, and model configurations.
 * 
 * @example
 * ```ts
 * import type { AgentConfig, ProviderType, ToolType } from "@agentforce/adk";
 * 
 * const config: AgentConfig = {
 *   name: "MyAgent",
 *   tools: ["web_fetch", "fs_read_file"],
 *   skills: ["product-owner.md"]
 * };
 * ```
 * 
 * @module
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
 * Configuration object for creating an {@link AgentForceAgent}
 * @typedef {Object} AgentConfig
 * @property {string} name - Name of the agent
 * @property {string} type - Type of the agent (e.g., 'developer', 'product-owner')
 * @property {ToolType[]} [tools] - List of tools the agent can use (see {@link ToolType} for available options)
 * @property {string[]} [skills] - List of skill files to load for the agent
 * @property {string} [assetPath] - Base path for agent assets (skills, templates, etc.), supports both relative and absolute paths, defaults to current working directory
 * @property {AgentForceLogger} [logger] - Logger instance with logging methods (see {@link AgentForceLogger})
 */
export type AgentConfig = {
    name: string;
    tools?: ToolType[];
    skills?: string[];
    assetPath?: string;
    logger?: AgentForceLogger;
};


/**
 * Configuration object for creating an {@link AgentForceServer}
 * @typedef {Object} ServerConfig
 * @property {string} name - Name of the server
 * @property {AgentForceLogger} [logger] - Logger instance (see {@link AgentForceLogger}), defaults to built-in logger
 */
export type ServerConfig = {
    name: string;
    logger?: AgentForceLogger;
};

/**
 * Type definition for output formats
 */
export type OutputType = "text" | "json" | "md" | "yaml" | "html";

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
    | "fs_get_file_tree"
    | "filter_content"
    | "browser_use";

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
 * Configuration object for creating an {@link AgentForceWorkflow}
 * @typedef {Object} WorkflowConfig
 * @property {string} name - Name of the workflow
 * @property {AgentForceLogger} [logger] - Logger instance (see {@link AgentForceLogger}), defaults to built-in logger
 */
export type WorkflowConfig = {
    name: string;
    logger?: AgentForceLogger;
};

/**
 * Tool definition types for AgentForce ADK
 * These types match the Ollama tool calling format
 */

/**
 * Parameter definition for a tool function
 * @interface ToolParameter
 * @property {string} type - Parameter data type (e.g., "string", "number", "boolean")
 * @property {string} description - Human-readable description of the parameter
 * @property {string[]} [enum] - Optional array of allowed values for the parameter
 */
export interface ToolParameter {
    type: string;
    description: string;
    enum?: string[];
}

/**
 * Collection of tool parameters indexed by parameter name
 * @interface ToolProperties
 */
export interface ToolProperties {
    /** Parameter definitions indexed by parameter name */
    [key: string]: ToolParameter;
}

/**
 * Function definition for a tool
 * @interface ToolFunction
 * @property {string} name - The function name
 * @property {string} description - Human-readable description of what the function does
 * @property {object} parameters - Parameter schema definition
 * @property {ToolProperties} parameters.properties - Available parameters (see {@link ToolProperties})
 * @property {string[]} [parameters.required] - Names of required parameters
 */
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
