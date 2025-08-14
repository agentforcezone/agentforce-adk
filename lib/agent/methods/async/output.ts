import type { AgentForceAgent } from "../../../agent";
import type { OutputType } from "../../../types";
import { execute } from "./execute";
import { formatResponseAsYaml } from "../../../utils/yaml";
import { formatResponseAsJson } from "../../../utils/json";
import { formatResponseAsMarkdown } from "../../../utils/markdown";
import { formatResponseAsHtml } from "../../../utils/html";

/**
 * Executes the agent and outputs the response in the specified format (execution method)
 * 
 * Use this when you need structured output with metadata, timestamps, and formatting control.
 * For simple access to just the assistant's response content, use getResponse() instead.
 * 
 * @param this - The AgentForceAgent instance (bound context)
 * @param outputType - The output format type ('text', 'json', 'md', 'yaml')
 * @param enableCodeBlockParsing - Optional boolean to enable/disable code block parsing (default: true). Set to false to return whole response.
 * @returns {Promise<string|object>} Returns the formatted output - NOT the agent instance (execution method)
 */
export async function output(this: AgentForceAgent, outputType: OutputType, enableCodeBlockParsing?: boolean): Promise<string | object> {
    // Validate input
    if (!outputType || typeof outputType !== "string") {
        throw new Error("Output type must be a string");
    }
    
    const validTypes: OutputType[] = ["text", "json", "md", "yaml", "html"];
    if (!validTypes.includes(outputType as OutputType)) {
        throw new Error("Output type must be one of: text, json, md, yaml, html");
    }

    // Execute the provider call first to get the response
    try {
        await execute.call(this);
    } catch {
        // Error handling is already done in execute function
        // Continue with output generation using the error message from chat history
    }
    
    // Get agent information using protected methods
    const agentName = this.getName();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    const provider = this.getProvider();
    const model = this.getModel();
    const chatHistory = this.getChatHistory();
    const logger = this.getLogger();
    
    // Get the latest assistant response from chat history
    const latestAssistantMessage = chatHistory.findLast(msg => msg.role === "assistant");
    const assistantResponse = latestAssistantMessage ? latestAssistantMessage.content : "No response available";
    
    // Generate output based on the output type using actual chat history
    switch (outputType) {
        case "text":
            const textOutput = `=== Agent ${agentName} Output (Text Format) ===\nSystem: ${systemPrompt}\nUser: ${userPrompt}\nResponse: ${assistantResponse}`;
            return textOutput;
            
        case "json":
            try {
                const enableParsing = enableCodeBlockParsing !== false; // Default to true
                const jsonOutput = formatResponseAsJson(assistantResponse, enableParsing);
                return jsonOutput;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Failed to format response as JSON: ${errorMessage}`);
                return `Error: Failed to format response as JSON - ${errorMessage}`;
            }
            
        case "md":
            try {
                const enableParsing = enableCodeBlockParsing !== false; // Default to true
                const markdownOutput = formatResponseAsMarkdown(assistantResponse, enableParsing);
                return markdownOutput;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Failed to format response as Markdown: ${errorMessage}`);
                return `Error: Failed to format response as Markdown - ${errorMessage}`;
            }
            
        case "yaml":
            try {
                const enableParsing = enableCodeBlockParsing !== false; // Default to true
                const yamlOutput = formatResponseAsYaml(assistantResponse, enableParsing);
                return yamlOutput;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Failed to format response as YAML: ${errorMessage}`);
                return `Error: Failed to format response as YAML - ${errorMessage}`;
            }
            
        case "html":
            try {
                const enableParsing = enableCodeBlockParsing !== false; // Default to true
                const htmlOutput = formatResponseAsHtml(assistantResponse, {}, enableParsing);
                return htmlOutput;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`Failed to format response as HTML: ${errorMessage}`);
                return `Error: Failed to format response as HTML - ${errorMessage}`;
            }
            
        default:
            logger.error(`Unsupported output type: ${outputType}`);
            return `Error: Unsupported output type: ${outputType}`;
    }
}
