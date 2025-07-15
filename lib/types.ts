/**
 * Type definitions for the AgentForce SDK
 */

/**
 * Type definition for logger formats
 */
export type LoggerType = "json" | "pretty";

/**
 * Configuration object for creating an AgentForce agent
 * @typedef {Object} AgentConfig
 * @property {string} name - Name of the agent
 * @property {string} type - Type of the agent
 * @property {LoggerType} [logger] - Logger format ('json' or 'pretty'), defaults to 'json'
 */
export type AgentConfig = {
    name: string;
    type: string;
    logger?: LoggerType;
};

/**
 * Configuration object for creating an AgentForce server
 * @typedef {Object} ServerConfig
 * @property {string} name - Name of the server
 * @property {LoggerType} [logger] - Logger format ('json' or 'pretty'), defaults to 'json'
 */
export type ServerConfig = {
    name: string;
    logger?: LoggerType;
};

/**
 * Type definition for output formats
 */
export type OutputType = "text" | "json" | "md";

/**
 * Type definition for supported AI providers
 */
export type ProviderType = "ollama" | "openai" | "anthropic" | "google";
