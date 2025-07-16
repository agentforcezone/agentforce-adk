import type { AgentForceAgent } from "../../agent";
import { Hono } from "hono";
import { logger as loggerMiddleware } from "hono/logger";
import pino from "pino";

/**
 * Starts an HTTP server for the agent (terminal method)
 * Compatible with Bun, Node.js, and Deno runtimes
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

    console.log(`Starting server for agent: ${agentName}`);
    console.log(`Current config: ${currentProvider}/${currentModel}`);
    console.log(`Server will bind to: ${host}:${port}`);

    // Create Pino logger instance
    const log = pino({
        name: "agentforce-sdk-server",
        level: process.env.LOG_LEVEL || "warning", // Use LOG_LEVEL env var or default
        timestamp: pino.stdTimeFunctions.isoTime,
        base: undefined, // Remove default fields like pid and hostname
        formatters: {
            level: (label) => {
                return { level: label };
            },
        },
    });

    // Custom logger function for Hono middleware that parses HTTP request info
    const customLogger = (message: string, ...rest: string[]): void => {
        // Parse the message format: "--> GET /v1/models \u001b[32m200\u001b[0m 12ms"
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

    // Default route
    app.get("/", (c) => {
        return c.json({ status: "ok", agent: agentName });
    });

    // Start the server using runtime-appropriate method
    try {
        if (typeof globalThis.Bun !== "undefined") {
            // Bun runtime
            const server = (globalThis as any).Bun.serve({
                hostname: host,
                port: port,
                fetch: app.fetch,
            });

            log.info(`🚀 Agent server running at http://${server.hostname}:${server.port}`);
            console.log(`🚀 Agent server running at http://${server.hostname}:${server.port}`);
        } else if (typeof (globalThis as any).Deno !== "undefined") {
            // Deno runtime
            (globalThis as any).Deno.serve({ 
                hostname: host, 
                port: port,
            }, app.fetch);

            log.info(`🚀 Agent server running at http://${host}:${port}`);
            console.log(`🚀 Agent server running at http://${host}:${port}`);
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
                log.info(`🚀 Agent server running at http://${host}:${port}`);
                console.log(`🚀 Agent server running at http://${host}:${port}`);
            });
        }
    } catch (error) {
        log.error({
            agentName,
            error: error instanceof Error ? error.message : String(error),
            action: "server_start_failed",
        }, "Failed to start agent server");
        
        throw new Error(`Failed to start agent server: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Terminal method - does not return the agent (server runs indefinitely)
}
