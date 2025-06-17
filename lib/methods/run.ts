import type AgentForceAgent from '@agentforce-sdk/agent';
import { OllamaProvider } from '../provider/ollama';

// Type for injectable provider (used for testing)
interface OllamaProviderInterface {
    chat(messages: Array<{ role: string; content: string }>): Promise<string>;
    getModel(): string;
}

// Injectable provider for testing
let _ollamaProviderFactory: ((model: string) => OllamaProviderInterface) | null = null;

/**
 * Injects a custom Ollama provider factory (for testing)
 * @param factory - Function that creates a provider instance
 */
export function injectOllamaProvider(factory: (model: string) => OllamaProviderInterface): void {
    _ollamaProviderFactory = factory;
}

/**
 * Resets the provider factory to use the default Ollama provider
 */
export function resetOllamaProvider(): void {
    _ollamaProviderFactory = null;
}

/**
 * Executes the agent's chain by making the actual API call to the configured provider
 * @param this - The AgentForceAgent instance (bound context)
 * @returns {Promise<AgentForceAgent>} Returns the agent instance for method chaining
 */
export async function run(this: AgentForceAgent): Promise<AgentForceAgent> {
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
                // Use injected provider for testing or default OllamaProvider
                const ollamaProvider = _ollamaProviderFactory 
                    ? _ollamaProviderFactory(model) 
                    : new OllamaProvider(model);
                
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
