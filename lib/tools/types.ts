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