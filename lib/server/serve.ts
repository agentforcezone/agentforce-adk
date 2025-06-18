import type AgentForceAgent from '../agent';
import { Hono } from 'hono';
import { logger as loggerMiddleware } from 'hono/logger';
import pino from 'pino';
import { createModelsRoute } from './routes/v1/models';

/**
 * Starts a Bun HTTP server for the agent (terminal method)
 * @param this - The AgentForceAgent instance (bound context)
 * @param host - The host address to bind the server to (default: "0.0.0.0")
 * @param port - The port number to listen on (default: 3000)
 * @returns {void} This is a terminal method that starts the server - does not return the agent
 */
export function serve(this: AgentForceAgent, host: string = "0.0.0.0", port: number = 3000): void {
    // Validate inputs
    if (!host || typeof host !== 'string') {
        throw new Error('Host must be a non-empty string');
    }
    
    if (typeof port !== 'number' || port <= 0 || port > 65535) {
        throw new Error('Port must be a valid number between 1 and 65535');
    }

    // Get agent information for logging
    const agentName = this.getName();
    const currentModel = this.getModel();
    const currentProvider = this.getProvider();

    console.log(`Starting server for agent: ${agentName}`);
    console.log(`Current config: ${currentProvider}/${currentModel}`);
    console.log(`Server will bind to: ${host}:${port}`);

    // Create Pino logger instance
    const log = pino({
        name: "agentforce-sdk-server",
        level: process.env.LOG_LEVEL || "info", // Use LOG_LEVEL env var or default
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => {
                return { level: label };
            },
        },
    });

    // Custom logger function for Hono middleware
    const customLogger = (message: string, ...rest: string[]) => {
        log.info(message, ...rest);
    };

    // Create Hono app with logger middleware
    const app = new Hono();
    app.use(loggerMiddleware(customLogger));

    // Mount v1 routes
    const modelsRoute = createModelsRoute(currentModel, currentProvider);
    app.route('/v1', modelsRoute);

    // Default route
    app.get('/', (c) => {
        return c.json({ status: "ok", agent: agentName });
    });

    // Start the server using Bun's serve with Hono
    const server = Bun.serve({
        hostname: host,
        port: port,
        fetch: app.fetch,
    });

    log.info(`🚀 Agent server running at http://${server.hostname}:${server.port}`);

    // Terminal method - does not return the agent (server runs indefinitely)
}
