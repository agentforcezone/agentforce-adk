import type { AgentForceAgent } from "../../../agent";
import { execute } from "./execute";

/**
 * Executes the agent and returns only the raw LLM response (execution method)
 * 
 * Use this when you only need the assistant's response content without any metadata.
 * For structured output with metadata, timestamps, and formatting options, use output() instead.
 * 
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<string>} Returns only the LLM response - NOT the agent instance (terminal method)
 */
export async function getResponse(this: AgentForceAgent): Promise<string> {
    // Execute the provider call to get the response
    try {
        const response = await execute.call(this);
        return response;
    } catch (error) {
        // Get the error message from chat history if execute failed
        const chatHistory = this.getChatHistory();
        const latestAssistantMessage = chatHistory.findLast(msg => msg.role === "assistant");
        
        if (latestAssistantMessage && latestAssistantMessage.content.startsWith("Error:")) {
            return latestAssistantMessage.content;
        }
        
        // If no error message in history, log and return error message
        const logger = this.getLogger();
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Failed to get response: ${errorMessage}`);
        return `Error: Failed to get response - ${errorMessage}`;
    }
}
