import type { AgentForceAgent } from '../../lib/agent';
import { MockOllamaProvider } from '../mocks/MockOllamaProvider';

/**
 * Test-specific run method that always uses MockOllamaProvider for Ollama
 * This replaces the injection mechanism for cleaner testing
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<AgentForceAgent>} Returns the agent instance for method chaining
 */
export async function testRun(this: AgentForceAgent): Promise<AgentForceAgent> {
    // Get agent configuration
    const provider = this.getProvider();
    const model = this.getModel();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    const agentName = this.getName();

    console.log(`🚀 Running agent "${agentName}" with ${provider}/${model}`);

    try {
        let response: string;

        // Execute based on provider
        switch (provider.toLowerCase()) {
            case "ollama":
                // Always use MockOllamaProvider for testing
                const ollamaProvider = new MockOllamaProvider(model);
                
                // Prepare messages for Ollama
                const messages = [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ];

                console.log(`📤 Sending to Ollama (${model}):`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                
                response = await ollamaProvider.chat(messages);
                
                console.log(`📥 Response from Ollama:`);
                console.log(response);
                break;

            case "openai":
                console.log(`⚠️  OpenAI provider not implemented yet. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = "OpenAI integration not implemented yet.";
                break;

            case "anthropic":
                console.log(`⚠️  Anthropic provider not implemented yet. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = "Anthropic integration not implemented yet.";
                break;

            case "google":
                console.log(`⚠️  Google provider not implemented yet. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = "Google integration not implemented yet.";
                break;

            default:
                console.log(`⚠️  Unknown provider: ${provider}. Would call with:`);
                console.log(`   Model: ${model}`);
                console.log(`   System: ${systemPrompt}`);
                console.log(`   User: ${userPrompt}`);
                response = `Unknown provider integration not available: ${provider}`;
                break;
        }

        console.log(`✅ Agent "${agentName}" execution completed successfully\n`);

    } catch (error) {
        console.error(`❌ Error running agent "${agentName}":`, error);
        console.log(`   Provider: ${provider}`);
        console.log(`   Model: ${model}`);
        console.log(`   Error: ${error}\n`);
    }

    // Return 'this' for method chaining
    return this;
}
