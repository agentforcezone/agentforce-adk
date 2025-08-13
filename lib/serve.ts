import type { AgentForceAgent } from "./agent";
import { Hono } from "hono";

/**
 * Starts an HTTP server for the agent using Hono (terminal method)
 * Compatible with Bun, Node.js, and Deno runtimes via Hono
 * @param this - The AgentForceAgent instance (bound context)
 * @param host - The host address to bind the server to (default: "0.0.0.0")
 * @param port - The port number to listen on (default: 3000)
 * @returns {Promise<void>} This is a terminal method that starts the server - does not return the agent
 */
export async function serve(this: AgentForceAgent, host: string = "0.0.0.0", port: number = 3000): Promise<void> {
    // Validate inputs
    if (!host || typeof host !== "string") {
        throw new Error("Host must be a non-empty string");
    }
    
    if (typeof port !== "number" || port <= 0 || port > 65535) {
        throw new Error("Port must be a valid number between 1 and 65535");
    }

    // Get agent information for logging
    const agentName = this.getName();
    const currentModel = this.getModel();
    const currentProvider = this.getProvider();

    // Get the agent's logger instance
    const logger = this.getLogger();

    // Log server startup information using structured logging
    logger.info({
        agentName,
        provider: currentProvider,
        model: currentModel,
        host,
        port,
        action: "server_starting",
    }, `Starting server for agent: ${agentName}`);

    // Create Hono app with HTTP request logging middleware
    const app = new Hono();
    
    // Add middleware to log all HTTP requests
    app.use("*", async (c, next) => {
        logger.info({
            httpMethod: c.req.method,
            route: c.req.path,
        });
        await next();
    });

    // Default route - enhanced to handle prompt query parameter
    app.get("/", async (c) => {
        const prompt = c.req.query("prompt");
        
        if (prompt) {
            try {
                // Execute the agent with the provided prompt
                const response = await this.prompt(prompt).getResponse();
                return c.json({ 
                    status: "ok", 
                    agent: agentName, 
                    prompt: prompt,
                    response: response, 
                });
            } catch (error) {
                logger.error({
                    agentName,
                    prompt,
                    error: error instanceof Error ? error.message : String(error),
                    action: "prompt_execution_failed",
                }, "Failed to execute agent with prompt");
                
                return c.json({ 
                    status: "error", 
                    agent: agentName, 
                    prompt: prompt,
                    error: error instanceof Error ? error.message : "Unknown error", 
                }, 500);
            }
        }
        
        return c.json({ status: "ok", agent: agentName });
    });

    // Start the server using runtime-appropriate method
    try {
        if (typeof Bun !== "undefined") {
            // Bun runtime
            const server = Bun.serve({
                hostname: host,
                port: port,
                fetch: app.fetch,
            });

            logger.info({
                hostname: server.hostname,
                port: server.port,
                runtime: "bun",
                action: "server_started",
            }, `🚀 Agent server running at http://${server.hostname}:${server.port}`);
        } else if (typeof (globalThis as any).Deno !== "undefined") {
            // Deno runtime
            (globalThis as any).Deno.serve({ 
                hostname: host, 
                port: port,
            }, app.fetch);

            logger.info({
                hostname: host,
                port: port,
                runtime: "deno",
                action: "server_started",
            }, `🚀 Agent server running at http://${host}:${port}`);
        } else {
            // Node.js runtime - use built-in http module
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

                    // Handle response body
                    if (response.body) {
                        const reader = response.body.getReader();
                        
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            
                            if (value) {
                                res.write(value);
                            }
                        }
                    }
                    
                    res.end();
                } catch (error) {
                    logger.error("Error processing request:", error);
                    res.statusCode = 500;
                    res.setHeader("Content-Type", "application/json");
                    res.write(JSON.stringify({ error: "Internal Server Error" }));
                    res.end();
                }
            });

            server.listen(port, host, () => {
                logger.info({
                    hostname: host,
                    port: port,
                    runtime: "nodejs",
                    action: "server_started",
                }, `🚀 Agent server running at http://${host}:${port}`);
            });
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({
            agentName,
            error: errorMessage,
            action: "server_start_failed",
        }, `Failed to start agent server: ${errorMessage}`);
        
        // Since serve() returns Promise<void>, we can't return an error message
        // The error is already logged, so we just return to allow graceful handling
        return;
    }
}
