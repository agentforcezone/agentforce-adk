import type { AgentForceServer } from "../../server";
import { Hono } from "hono";
import { logger as loggerMiddleware } from "hono/logger";
import { createAgentRouteHandler } from "./addRouteAgent";
import { createStaticRouteHandler } from "./addRoute";
import { createOpenAICompatibleRouteHandler } from "./useOpenAICompatibleRouting";
import { createOllamaGenerateRouteHandler, createOllamaChatRouteHandler } from "./useOllamaCompatibleRouting";

/**
 * Starts an HTTP server for the AgentForceServer (terminal method)
 * Compatible with Bun, Node.js, and Deno runtimes
 * @param this - The AgentForceServer instance (bound context)
 * @param host - The host address to bind the server to (default: "localhost")
 * @param port - The port number to listen on (default: 3000)
 * @returns {Promise<void>} This is a terminal method that starts the server - does not return the server instance
 */
export async function serve(this: AgentForceServer, host: string = "localhost", port: number = 3000): Promise<void> {
    // Validate inputs
    if (!host || typeof host !== "string") {
        throw new Error("Host must be a non-empty string");
    }
    
    if (typeof port !== "number" || port <= 0 || port > 65535) {
        throw new Error("Port must be a valid number between 1 and 65535");
    }

    // Get server information for logging
    const serverName = this.getName();
    const log = this.getLogger();

    log.info({
        serverName,
        host,
        port,
        action: "server_starting",
    }, `Starting server: ${serverName}`);

    console.log(`Starting server: ${serverName}`);
    console.log(`Server will bind to: ${host}:${port}`);

    // Custom logger function for Hono middleware that parses HTTP request info
    const customLogger = (message: string, ...rest: string[]): void => {
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
                durationUnit: "ms",
            });
        } else {
            // Fallback for non-HTTP log messages
            log.info(message, ...rest);
        }
    };

    // Create Hono app with logger middleware
    const app = new Hono();
    app.use(loggerMiddleware(customLogger));

    // Check for existing static routes to avoid conflicts
    const staticRoutes = this.getStaticRoutes();
    const existingRoutes = new Set(staticRoutes.map(route => `${route.method}:${route.path}`));

    // Default route
    app.get("/", (c) => {
        return c.json({ 
            status: "ok", 
            server: serverName,
            timestamp: new Date().toISOString(),
            version: "1.0.0",
        });
    });

    // Health check route (only if not overridden by static route)
    if (!existingRoutes.has("GET:/health")) {
        app.get("/health", (c) => {
            return c.json({ 
                status: "healthy",
                server: serverName,
                timestamp: new Date().toISOString(),
            });
        });
    }

    // Add dynamic route agents
    const routeAgents = this.getRouteAgents();
    log.info({
        serverName,
        routeAgentsCount: routeAgents.length,
        action: "registering_route_agents",
    }, `Registering ${routeAgents.length} route agents`);

    routeAgents.forEach(routeAgent => {
        const { method, path, agent, schema } = routeAgent;
        
        // Determine route type and create appropriate handler
        let handler;
        let routeType: string;
        
        if (path === "/v1/chat/completions") {
            // OpenAI-compatible route
            handler = createOpenAICompatibleRouteHandler(agent, path);
            routeType = "OpenAI-compatible";
        } else if (path === "/api/generate") {
            // Ollama Generate route
            handler = createOllamaGenerateRouteHandler(agent, path);
            routeType = "Ollama-compatible (generate)";
        } else if (path === "/api/chat") {
            // Ollama Chat route
            handler = createOllamaChatRouteHandler(agent, path);
            routeType = "Ollama-compatible (chat)";
        } else {
            // Legacy route with schema support
            handler = createAgentRouteHandler(agent, method, path, schema);
            routeType = schema ? "custom (with schema)" : "legacy";
        }
        
        // Register the route based on HTTP method
        switch (method) {
            case "GET":
                app.get(path, handler);
                break;
            case "POST":
                app.post(path, handler);
                break;
            case "PUT":
                app.put(path, handler);
                break;
            case "DELETE":
                app.delete(path, handler);
                break;
            case "PATCH":
                app.patch(path, handler);
                break;
            case "HEAD":
                // Hono doesn't have a dedicated head method, use all()
                app.all(path, (c) => {
                    if (c.req.method === "HEAD") {
                        return handler(c);
                    }
                    return c.notFound();
                });
                break;
            case "OPTIONS":
                app.options(path, handler);
                break;
            default:
                log.warn({
                    serverName,
                    method,
                    path,
                    action: "unsupported_method",
                }, `Unsupported HTTP method: ${method} for path: ${path}`);
        }
        
        log.info({
            serverName,
            method,
            path,
            agentName: agent.getName(),
            routeType,
            action: "route_registered",
        }, `Registered ${routeType} route: ${method} ${path}`);
    });

    // Add static routes
    log.info({
        serverName,
        staticRoutesCount: staticRoutes.length,
        action: "registering_static_routes",
    }, `Registering ${staticRoutes.length} static routes`);

    staticRoutes.forEach(staticRoute => {
        const { method, path, responseData } = staticRoute;
        
        // Create static route handler
        const handler = createStaticRouteHandler(responseData, method, path);
        
        // Register the route based on HTTP method
        switch (method) {
            case "GET":
                app.get(path, handler);
                break;
            case "POST":
                app.post(path, handler);
                break;
            case "PUT":
                app.put(path, handler);
                break;
            case "DELETE":
                app.delete(path, handler);
                break;
            case "PATCH":
                app.patch(path, handler);
                break;
            case "HEAD":
                // Hono doesn't have a dedicated head method, use all()
                app.all(path, (c) => {
                    if (c.req.method === "HEAD") {
                        return handler(c);
                    }
                    return c.notFound();
                });
                break;
            case "OPTIONS":
                app.options(path, handler);
                break;
            default:
                log.warn({
                    serverName,
                    method,
                    path,
                    action: "unsupported_method",
                }, `Unsupported HTTP method: ${method} for path: ${path}`);
        }
        
        log.info({
            serverName,
            method,
            path,
            routeType: "static",
            action: "route_registered",
        }, `Registered static route: ${method} ${path}`);
    });

    // Start the server using runtime-appropriate method
    // Runtime detection and server startup
    try {
        if (typeof globalThis.Bun !== "undefined") {
            // Bun runtime
            const server = (globalThis as any).Bun.serve({
                hostname: host,
                port: port,
                fetch: app.fetch,
                idleTimeout: 120, // Set timeout to 120 seconds (2 minutes) for AI agent responses
            });

            log.info({
                serverName,
                host: server.hostname,
                port: server.port,
                runtime: "bun",
                action: "server_started",
            }, `🚀 Server running at http://${server.hostname}:${server.port}`);

            console.log(`🚀 Server running at http://${server.hostname}:${server.port}`);
        } else if (typeof (globalThis as any).Deno !== "undefined") {
            // Deno runtime
            (globalThis as any).Deno.serve({ 
                hostname: host, 
                port: port,
            }, app.fetch);

            log.info({
                serverName,
                host,
                port,
                runtime: "deno",
                action: "server_started",
            }, `🚀 Server running at http://${host}:${port}`);

            console.log(`🚀 Server running at http://${host}:${port}`);
        } else {
            // Node.js runtime - use Node.js built-in http module
            const http = await import("node:http");
            
            const server = http.createServer(async (req, res) => {
                // Convert Node.js request to Web API Request
                const url = `http://${host}:${port}${req.url || "/"}`;
                const headers: Record<string, string> = {};
                
                // Copy headers from Node.js request
                for (const [key, value] of Object.entries(req.headers)) {
                    if (typeof value === "string") {
                        headers[key] = value;
                    } else if (Array.isArray(value)) {
                        headers[key] = value.join(", ");
                    }
                }

                // Handle request body for POST/PUT/PATCH
                let body: string | undefined;
                if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
                    const chunks: Buffer[] = [];
                    for await (const chunk of req) {
                        chunks.push(chunk);
                    }
                    body = Buffer.concat(chunks).toString();
                }

                // Create Web API Request
                const request = new Request(url, {
                    method: req.method || "GET",
                    headers,
                    body: body,
                });

                try {
                    // Process request with Hono app
                    const response = await app.fetch(request);
                    
                    // Set response status and headers
                    res.statusCode = response.status;
                    response.headers.forEach((value, key) => {
                        res.setHeader(key, value);
                    });

                    // Send response body
                    if (response.body) {
                        const reader = response.body.getReader();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            res.write(value);
                        }
                    }
                    res.end();
                } catch (error) {
                    console.error("Error processing request:", error);
                    res.statusCode = 500;
                    res.end("Internal Server Error");
                }
            });

            server.listen(port, host, () => {
                log.info({
                    serverName,
                    host,
                    port,
                    runtime: "node",
                    action: "server_started",
                }, `🚀 Server running at http://${host}:${port}`);

                console.log(`🚀 Server running at http://${host}:${port}`);
            });
        }
    } catch (error) {
        log.error({
            serverName,
            error: error instanceof Error ? error.message : String(error),
            action: "server_start_failed",
        }, "Failed to start server");
        
        throw new Error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Terminal method - does not return the server instance (server runs indefinitely)
}
