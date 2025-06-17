import { Hono } from 'hono';
import type { Context } from 'hono';

/**
 * Models route handler for /v1/models endpoint
 * Returns a list of available models in OpenAI-compatible format
 */
export function createModelsRoute(currentModel: string | null, currentProvider: string | null) {
    const app = new Hono();

    app.get('/models', (c: Context) => {
        const modelsResponse = {
            object: "list",
            data: [
                {
                    id: currentModel || "agentforce-default",
                    object: "model",
                    created: Math.floor(Date.now() / 1000),
                    owned_by: currentProvider || "agentforce",
                    permission: [],
                    root: currentModel || "agentforce-default",
                    parent: null
                },
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
            ]
        };

        return c.json(modelsResponse);
    });

    return app;
}
