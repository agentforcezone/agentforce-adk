import { Hono } from "hono";
import type { Context } from "hono";
import ollama from "ollama";

/**
 * Models route handler for /v1/models endpoints
 * Returns a list of available models in OpenAI-compatible format
 * 
 * Endpoints:
 * - GET /models - List all available models
 * - GET /models/{model} - Get specific model information by ID
 * 
 * Features:
 * - Fetches actual Ollama models when provider is "ollama" using ollama.list()
 * - Normalizes model IDs by replacing "/" with "-" for URL compatibility
 * - Includes current model configuration in the response
 * - Falls back to common models for non-Ollama providers
 * - Returns additional Ollama-specific metadata (size, digest, details)
 * - Handles Ollama connection errors gracefully
 * - Supports model-specific lookups with proper 404 handling
 * - Preserves original model names in the "root" field
 * 
 * URL Compatibility:
 * - Model names with "/" (e.g., "huihui_ai/mistral-small-abliterated:latest") 
 *   are returned with ID "huihui_ai-mistral-small-abliterated:latest"
 * - Original names are preserved in the "root" field
 * - Lookup supports: normalized IDs (dashes), URL-encoded names (%2F), and original names
 * - Use normalized IDs for URL-safe API calls: /v1/models/huihui_ai-mistral-small-abliterated:latest
 * - Or use URL-encoded slashes: /v1/models/huihui_ai%2Fmistral-small-abliterated:latest
 * 
 * @param currentModel - The current model configured in the agent
 * @param currentProvider - The current provider configured in the agent
 * @returns Hono app with /models and /models/{model} endpoints
 */
export function createModelsRoute(currentModel: string | null, currentProvider: string | null): Hono {
    const app = new Hono();

    app.get("/models", async (c: Context) => {
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
                parent: null,
            });
        }

        // Fetch Ollama models if provider is ollama
        if (currentProvider === "ollama") {
            try {
                const ollamaResponse = await ollama.list();
                
                // Convert Ollama models to OpenAI-compatible format
                const ollamaModels = ollamaResponse.models.map(model => ({
                    id: model.name.replace(/\//g, "-"), // Replace forward slashes with dashes for URL compatibility
                    object: "model",
                    created: Math.floor(new Date(model.modified_at).getTime() / 1000),
                    owned_by: "ollama",
                    permission: [],
                    root: model.name, // Keep original name in root field
                    parent: null,
                    // Additional Ollama-specific metadata
                    size: model.size,
                    digest: model.digest,
                    details: model.details,
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
                        parent: null,
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
                    parent: null,
                },
                {
                    id: "gpt-3.5-turbo",
                    object: "model",
                    created: 1677610602,
                    owned_by: "openai", 
                    permission: [],
                    root: "gpt-3.5-turbo",
                    parent: null,
                },
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
            data: modelData,
        };

        return c.json(modelsResponse);
    });

    app.get("/models/:model", async (c: Context) => {
        const modelId = c.req.param("model");
        
        if (!modelId) {
            return c.json({ error: "Model ID is required" }, 400);
        }

        // Check if it's the current model first (handle normalized, URL-encoded, and original names)
        if (currentModel) {
            const decodedModelId = decodeURIComponent(modelId);
            const normalizedCurrentModel = currentModel.replace(/\//g, "-");
            
            if (currentModel === modelId || // Direct match with original name
                currentModel === decodedModelId || // Match URL-decoded name
                normalizedCurrentModel === modelId || // Match normalized name
                normalizedCurrentModel === decodedModelId // Match normalized decoded name
            ) {
                const modelInfo = {
                id: currentModel.replace(/\//g, "-"), // Return normalized ID
                object: "model",
                created: Math.floor(Date.now() / 1000),
                owned_by: currentProvider || "agentforce",
                permission: [],
                root: currentModel, // Keep original name in root
                parent: null,
            };
            return c.json(modelInfo);
            }
        }

        // If provider is Ollama, search through Ollama models
        if (currentProvider === "ollama") {
            try {
                const ollamaResponse = await ollama.list();
                
                // Find the specific model by checking both normalized ID and original name
                // The incoming modelId could be either the normalized version (with dashes) or URL-encoded (with %2F)
                const decodedModelId = decodeURIComponent(modelId); // Handle URL-encoded slashes (%2F)
                const foundModel = ollamaResponse.models.find(model => 
                    model.name === modelId || // Direct match with original name
                    model.name === decodedModelId || // Match URL-decoded name
                    model.name.replace(/\//g, "-") === modelId || // Match normalized name
                    model.name.replace(/\//g, "-") === decodedModelId, // Match normalized decoded name
                );
                
                if (foundModel) {
                    const modelInfo = {
                        id: foundModel.name.replace(/\//g, "-"), // Return normalized ID
                        object: "model",
                        created: Math.floor(new Date(foundModel.modified_at).getTime() / 1000),
                        owned_by: "ollama",
                        permission: [],
                        root: foundModel.name,
                        parent: null,
                        // Additional Ollama-specific metadata
                        size: foundModel.size,
                        digest: foundModel.digest,
                        details: foundModel.details,
                    };
                    
                    console.log(`✅ Found Ollama model: ${modelId}`);
                    return c.json(modelInfo);
                }
                
                console.log(`⚠️ Ollama model not found: ${modelId}`);
                return c.json({ error: `Model '${modelId}' not found` }, 404);
                
            } catch (error) {
                console.error(`⚠️ Failed to fetch Ollama model ${modelId}: ${error}`);
                return c.json({ error: "Failed to fetch model information" }, 500);
            }
        } else {
            // For non-Ollama providers, check against known models
            const knownModels = [
                {
                    id: "gpt-4",
                    object: "model", 
                    created: 1687882411,
                    owned_by: "openai",
                    permission: [],
                    root: "gpt-4",
                    parent: null,
                },
                {
                    id: "gpt-3.5-turbo",
                    object: "model",
                    created: 1677610602,
                    owned_by: "openai", 
                    permission: [],
                    root: "gpt-3.5-turbo",
                    parent: null,
                },
            ];

            const foundModel = knownModels.find(model => model.id === modelId);
            
            if (foundModel) {
                console.log(`✅ Found ${currentProvider || "fallback"} model: ${modelId}`);
                return c.json(foundModel);
            }
            
            console.log(`⚠️ Model not found: ${modelId}`);
            return c.json({ error: `Model '${modelId}' not found` }, 404);
        }
    });

    return app;
}
