import type AgentForceAgent from "@lib/agent";
import type { OutputType } from "@lib/types";
import { execute } from './execute';

/**
 * Executes the agent and outputs the response in the specified format (terminal method)
 * @param this - The AgentForceAgent instance (bound context)
 * @param outputType - The output format type ('text', 'json', 'md')
 * @returns {Promise<string|object>} Returns the formatted output - NOT the agent instance (terminal method)
 */
export async function output(this: AgentForceAgent, outputType: OutputType): Promise<string | object> {
    // Validate input
    if (!outputType || typeof outputType !== 'string') {
        throw new Error('Output type must be a string');
    }
    
    const validTypes: OutputType[] = ['text', 'json', 'md'];
    if (!validTypes.includes(outputType as OutputType)) {
        throw new Error('Output type must be one of: text, json, md');
    }

    // Execute the provider call first to get the response
    try {
        await execute.call(this);
    } catch (error) {
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
    
    // Get the latest assistant response from chat history
    const latestAssistantMessage = chatHistory.findLast(msg => msg.role === 'assistant');
    const assistantResponse = latestAssistantMessage ? latestAssistantMessage.content : 'No response available';
    
    // Generate output based on the output type using actual chat history
    switch (outputType) {
        case 'text':
            const textOutput = `=== Agent ${agentName} Output (Text Format) ===\nSystem: ${systemPrompt}\nUser: ${userPrompt}\nResponse: ${assistantResponse}`;
            return textOutput;
            
        case 'json':
            const jsonOutput = {
                agent: agentName,
                provider: provider,
                model: model,
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                response: assistantResponse,
                chatHistory: chatHistory,
                timestamp: new Date().toISOString(),
                status: "success"
            };
            return jsonOutput;
            
        case 'md':
            const mdOutput = `=== Agent ${agentName} Output (Markdown Format) ===\n# Agent Response\n\n**Agent:** ${agentName}\n**Provider:** ${provider}\n**Model:** ${model}\n\n## System Prompt\n${systemPrompt}\n\n## User Prompt\n${userPrompt}\n\n## Response\n${assistantResponse}\n\n*Generated at: ${new Date().toISOString()}*`;
            return mdOutput;
            
        default:
            throw new Error(`Unsupported output type: ${outputType}`);
    }
}
