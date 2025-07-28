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
 * @property {string[]} [tools] - List of tools the agent can use
 * @property {string} [skill] - Skill or expertise of the agent (e.g
 * @property {object} [logger] - Logger instance with a log method
 */
export type AgentConfig = {
    name: string;
    tools?: string[];
    skills?: string[];
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
 * Configuration object for creating an AgentForce workflow
 * @typedef {Object} WorkflowConfig
 * @property {string} name - Name of the workflow
 * @property {LoggerType} [logger] - Logger format ('json' or 'pretty'), defaults to 'json'
 */
export type WorkflowConfig = {
    name: string;
    logger?: AgentForceLogger;
};
