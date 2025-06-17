import { Hono } from 'hono';
import type { Context } from 'hono';
import ollama from 'ollama';

/**
 * Models route handler for /v1/models endpoint
 * Returns a list of available models in OpenAI-compatible format
 * 
 * Features:
 * - Fetches actual Ollama models when provider is "ollama" using ollama.list()
 * - Includes current model configuration in the response
 * - Falls back to common models for non-Ollama providers
 * - Returns additional Ollama-specific metadata (size, digest, details)
 * - Handles Ollama connection errors gracefully
 * 
 * @param currentModel - The current model configured in the agent
 * @param currentProvider - The current provider configured in the agent
 * @returns Hono app with /models endpoint
 */
export function createModelsRoute(currentModel: string | null, currentProvider: string | null) {
    const app = new Hono();

    app.get('/models', async (c: Context) => {
        let modelData = [];

        // Always include the current model if available
        if (currentModel && currentProvider) {
            modelData.push({
                id: currentModel,
                object: "model",
                created: Math.floor(Date.now() / 1000),
                owned_by: currentProvider,
                permission: [],
                root: currentModel,
                parent: null
            });
        }

        // Fetch Ollama models if provider is ollama
        if (currentProvider === "ollama") {
            try {
                const ollamaResponse = await ollama.list();
                
                // Convert Ollama models to OpenAI-compatible format
                const ollamaModels = ollamaResponse.models.map(model => ({
                    id: model.name,
                    object: "model",
                    created: Math.floor(new Date(model.modified_at).getTime() / 1000),
                    owned_by: "ollama",
                    permission: [],
                    root: model.name,
                    parent: null,
                    // Additional Ollama-specific metadata
                    size: model.size,
                    digest: model.digest,
                    details: model.details
                }));

                // Add Ollama models to the data array (avoid duplicates)
                ollamaModels.forEach(ollamaModel => {
                    if (!modelData.some(existingModel => existingModel.id === ollamaModel.id)) {
                        modelData.push(ollamaModel);
                    }
                });

                console.log(`✅ Fetched ${ollamaModels.length} Ollama models`);
            } catch (error) {
                console.error(`⚠️ Failed to fetch Ollama models: ${error}`);
                
                // Fallback to current model only if Ollama is not available
                if (modelData.length === 0) {
                    modelData.push({
                        id: "ollama-unavailable",
                        object: "model",
                        created: Math.floor(Date.now() / 1000),
                        owned_by: "ollama",
                        permission: [],
                        root: "ollama-unavailable",
                        parent: null
                    });
                }
            }
        } else {
            // Add some common models for other providers as fallback
            const fallbackModels = [
                {
                    id: "gpt-4",
                    object: "model", 
                    created: 1687882411,
                    owned_by: "openai",
                    permission: [],
                    root: "gpt-4",
                    parent: null
                },
                {
                    id: "gpt-3.5-turbo",
                    object: "model",
                    created: 1677610602,
                    owned_by: "openai", 
                    permission: [],
                    root: "gpt-3.5-turbo",
                    parent: null
                }
            ];

            // Add fallback models (avoid duplicates)
            fallbackModels.forEach(fallbackModel => {
                if (!modelData.some(existingModel => existingModel.id === fallbackModel.id)) {
                    modelData.push(fallbackModel);
                }
            });
        }

        const modelsResponse = {
            object: "list",
            data: modelData
        };

        return c.json(modelsResponse);
    });

    return app;
}
