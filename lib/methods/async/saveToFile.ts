import type AgentForceAgent from '@agentforce-sdk/agent';
import type { OutputType } from '../../types';
import { execute } from './execute';
import { writeFile } from 'fs/promises';
import { join, extname } from 'path';

/**
 * Executes the agent and saves the response to a file (terminal method)
 * @param this - The AgentForceAgent instance (bound context)
 * @param fileName - The filename to save to (extension determines format: .txt, .json, .md)
 * @returns {Promise<string>} Returns the file path where content was saved - NOT the agent instance (terminal method)
 */
export async function saveToFile(this: AgentForceAgent, fileName: string): Promise<string> {
    // Validate input
    if (!fileName || typeof fileName !== 'string') {
        throw new Error('Filename must be a non-empty string');
    }
    
    // Determine output type from file extension
    const fileExtension = extname(fileName).toLowerCase();
    let outputType: OutputType;
    
    switch (fileExtension) {
        case '.txt':
            outputType = 'text';
            break;
        case '.json':
            outputType = 'json';
            break;
        case '.md':
            outputType = 'md';
            break;
        default:
            throw new Error('Unsupported file extension. Use .txt, .json, or .md');
    }

    // Execute the provider call first to get the response
    try {
        await execute.call(this);
    } catch (error) {
        // Error handling is already done in execute function
        // Continue with file generation using the error message from chat history
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
    
    // Generate content based on the output type using actual chat history
    let content: string;
    
    switch (outputType) {
        case 'text':
            content = `=== Agent ${agentName} Output (Text Format) ===\nSystem: ${systemPrompt}\nUser: ${userPrompt}\nResponse: ${assistantResponse}`;
            break;
            
        case 'json':
            const jsonOutput = {
                agent: agentName,
                provider: provider,
                model: model,
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                response: assistantResponse,
                timestamp: new Date().toISOString()
            };
            content = JSON.stringify(jsonOutput, null, 2);
            break;
            
        case 'md':
            content = `${assistantResponse}`;
            break;
            
        default:
            throw new Error(`Unsupported output type: ${outputType}`);
    }
    
    // Write content to file
    try {
        const fullPath = join(process.cwd(), fileName);
        await writeFile(fullPath, content, 'utf8');
        return fullPath;
    } catch (error) {
        throw new Error(`Failed to write file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
