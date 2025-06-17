/**
 * Type definitions for the AgentForce SDK
 */

/**
 * Configuration object for creating an AgentForce agent
 * @typedef {Object} AgentConfig
 * @property {string} name - Name of the agent
 * @property {string} type - Type of the agent
 */
export type AgentConfig = {
    name: string;
    type: string;
};

/**
 * Type definition for output formats
 */
export type OutputType = 'text' | 'json' | 'md';
