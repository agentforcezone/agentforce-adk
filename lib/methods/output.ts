import type AgentForceAgent from '@agentforce-sdk/agent';
import type { OutputType } from '../types';

/**
 * Outputs the agent's response in the specified format
 * @param this - The AgentForceAgent instance (bound context)
 * @param outputType - The output format type ('text', 'json', 'md')
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function output(this: AgentForceAgent, outputType: OutputType): AgentForceAgent {
    // Validate input
    if (!outputType || typeof outputType !== 'string') {
        throw new Error('Output type must be a string');
    }
    
    const validTypes: OutputType[] = ['text', 'json', 'md'];
    if (!validTypes.includes(outputType as OutputType)) {
        throw new Error('Output type must be one of: text, json, md');
    }
    
    // Get agent information using protected methods
    const agentName = this.getName();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    const provider = this.getProvider();
    const model = this.getModel();
    
    // Generate dummy output based on the output type
    switch (outputType) {
        case 'text':
            console.log(`=== Agent ${agentName} Output (Text Format) ===`);
            console.log(`System: ${systemPrompt}`);
            console.log(`User: ${userPrompt}`);
            console.log(`Response: This is a dummy text response from ${provider}/${model}. The agent would normally process the prompts and generate a meaningful response here.`);
            break;
            
        case 'json':
            const jsonOutput = {
                agent: agentName,
                provider: provider,
                model: model,
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                response: "This is a dummy JSON response from the agent. The agent would normally process the prompts and generate a meaningful response here.",
                timestamp: new Date().toISOString(),
                status: "success"
            };
            console.log(JSON.stringify(jsonOutput, null, 2));
            break;
            
        case 'md':
            console.log(`=== Agent ${agentName} Output (Markdown Format) ===`);
            console.log(`# Agent Response\n`);
            console.log(`**Agent:** ${agentName}`);
            console.log(`**Provider:** ${provider}`);
            console.log(`**Model:** ${model}\n`);
            console.log(`## System Prompt`);
            console.log(`${systemPrompt}\n`);
            console.log(`## User Prompt`);
            console.log(`${userPrompt}\n`);
            console.log(`## Response`);
            console.log(`This is a **dummy markdown response** from the agent. The agent would normally process the prompts and generate a meaningful response here.\n`);
            console.log(`*Generated at: ${new Date().toISOString()}*`);
            break;
    }
    
    // Return 'this' for method chaining
    return this;
}
