import type AgentForceServer from '../../server';
import { Hono } from 'hono';
import { logger as loggerMiddleware } from 'hono/logger';
import { createAgentRouteHandler } from './addRouteAgent';

/**
 * Starts a Bun HTTP server for the AgentForceServer (terminal method)
 * @param this - The AgentForceServer instance (bound context)
 * @param host - The host address to bind the server to (default: "localhost")
 * @param port - The port number to listen on (default: 3000)
 * @returns {void} This is a terminal method that starts the server - does not return the server instance
 */
export function serve(this: AgentForceServer, host: string = "localhost", port: number = 3000): void {
    // Validate inputs
    if (!host || typeof host !== 'string') {
        throw new Error('Host must be a non-empty string');
    }
    
    if (typeof port !== 'number' || port <= 0 || port > 65535) {
        throw new Error('Port must be a valid number between 1 and 65535');
    }

    // Get server information for logging
    const serverName = this.getName();
    const log = this.getLogger();

    log.info({
        serverName,
        host,
        port,
        action: 'server_starting'
    }, `Starting server: ${serverName}`);

    console.log(`Starting server: ${serverName}`);
    console.log(`Server will bind to: ${host}:${port}`);

    // Custom logger function for Hono middleware that parses HTTP request info
    const customLogger = (message: string, ...rest: string[]) => {
        // Parse the message format: "--> GET /path \u001b[32m200\u001b[0m 12ms"
        const httpLogPattern = /^--> (\w+) (.+?) (?:\u001b\[\d+m)?(\d+)(?:\u001b\[\d+m)? (\d+)ms$/;
        const match = message.match(httpLogPattern);
        
        if (match && match.length >= 5) {
            const [, method, route, statusCode, duration] = match;
            log.info({
                type: "http_request",
                method,
                route,
                statusCode: parseInt(statusCode || "0"),
                duration: parseInt(duration || "0"),
                durationUnit: "ms"
            });
        } else {
            // Fallback for non-HTTP log messages
            log.info(message, ...rest);
        }
    };

    // Create Hono app with logger middleware
    const app = new Hono();
    app.use(loggerMiddleware(customLogger));

    // Default route
    app.get('/', (c) => {
        return c.json({ 
            status: "ok", 
            server: serverName,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });

    // Health check route
    app.get('/health', (c) => {
        return c.json({ 
            status: "healthy",
            server: serverName,
            timestamp: new Date().toISOString()
        });
    });

    // Add dynamic route agents
    const routeAgents = this.getRouteAgents();
    log.info({
        serverName,
        routeAgentsCount: routeAgents.length,
        action: 'registering_route_agents'
    }, `Registering ${routeAgents.length} route agents`);

    routeAgents.forEach(routeAgent => {
        const { method, path, agent } = routeAgent;
        const handler = createAgentRouteHandler(agent, method, path);
        
        // Register the route based on HTTP method
        switch (method) {
            case 'GET':
                app.get(path, handler);
                break;
            case 'POST':
                app.post(path, handler);
                break;
            case 'PUT':
                app.put(path, handler);
                break;
            case 'DELETE':
                app.delete(path, handler);
                break;
            case 'PATCH':
                app.patch(path, handler);
                break;
            case 'HEAD':
                // Hono doesn't have a dedicated head method, use all()
                app.all(path, (c) => {
                    if (c.req.method === 'HEAD') {
                        return handler(c);
                    }
                    return c.notFound();
                });
                break;
            case 'OPTIONS':
                app.options(path, handler);
                break;
            default:
                log.warn({
                    serverName,
                    method,
                    path,
                    action: 'unsupported_method'
                }, `Unsupported HTTP method: ${method} for path: ${path}`);
        }
        
        log.info({
            serverName,
            method,
            path,
            agentName: 'AgentForce Agent',
            action: 'route_registered'
        }, `Registered route: ${method} ${path}`);
    });

    // Start the server using Bun's serve with Hono
    const server = Bun.serve({
        hostname: host,
        port: port,
        fetch: app.fetch,
        idleTimeout: 120, // Set timeout to 120 seconds (2 minutes) for AI agent responses
    });

    log.info({
        serverName,
        host: server.hostname,
        port: server.port,
        action: 'server_started'
    }, `🚀 Server running at http://${server.hostname}:${server.port}`);

    console.log(`🚀 Server running at http://${server.hostname}:${server.port}`);

    // Terminal method - does not return the server instance (server runs indefinitely)
}
