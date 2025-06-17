import type AgentForceAgent from '../agent';

/**
 * Starts a Bun HTTP server for the agent
 * @param this - The AgentForceAgent instance (bound context)
 * @param host - The host address to bind the server to (default: "0.0.0.0")
 * @param port - The port number to listen on (default: 3000)
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function serve(this: AgentForceAgent, host: string = "0.0.0.0", port: number = 3000): AgentForceAgent {
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

    // Start the Bun server
    const server = Bun.serve({
        hostname: host,
        port: port,
        fetch(req) {
            return new Response(JSON.stringify({ status: "ok" }), {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        },
    });

    console.log(`🚀 Agent server running at http://${server.hostname}:${server.port}`);

    // Return 'this' for method chaining
    return this;
}
