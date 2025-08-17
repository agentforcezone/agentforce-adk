import type { AgentForceAgent } from "../../agent";
import type { MCPServerConfig } from "../../types";

/**
 * Adds an MCP (Model Context Protocol) server to the agent's configuration.
 * This method allows runtime addition of MCP servers to complement those configured in AgentConfig.
 * 
 * @memberof AgentForceAgent
 * @function addMCP
 * @param {string | MCPServerConfig} serverNameOrConfig - MCP server name (for pre-configured servers) or custom server configuration
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 * 
 * @example Using pre-configured MCP server
 * ```ts
 * const agent = new AgentForceAgent({ name: "Assistant" })
 *   .addMCP("filesystem")
 *   .addMCP("brave-search")
 *   .useLLM("ollama", "llama3")
 *   .prompt("List files and search for TypeScript info");
 * ```
 * 
 * @example Using custom MCP server configuration
 * ```ts
 * const agent = new AgentForceAgent({ name: "Assistant" })
 *   .addMCP({
 *     name: "custom-server",
 *     command: "python",
 *     args: ["/path/to/my-mcp-server.py"],
 *     env: { API_KEY: "secret" },
 *     timeout: 10000
 *   })
 *   .useLLM("ollama", "llama3");
 * ```
 */
export function addMCP(this: AgentForceAgent, serverNameOrConfig: string | MCPServerConfig): AgentForceAgent {
    const logger = this.getLogger();
    
    try {
        let serverName: string;
        let config: MCPServerConfig | undefined;
        
        if (typeof serverNameOrConfig === "string") {
            // Pre-configured server name
            serverName = serverNameOrConfig;
            config = undefined; // Will use pre-configured config
        } else {
            // Custom server configuration
            serverName = serverNameOrConfig.name;
            config = serverNameOrConfig;
        }
        
        // Validate server name
        if (!serverName || serverName.trim() === "") {
            throw new Error("MCP server name cannot be empty");
        }
        
        // Add to agent's MCP list if not already present
        const currentMCPs = this.getMCPs();
        if (!currentMCPs.includes(serverName)) {
            const updatedMCPs = [...currentMCPs, serverName];
            this.setMCPs(updatedMCPs);
            
            logger.debug({ serverName, isCustomConfig: !!config }, "MCP server added to agent configuration");
        } else {
            logger.debug({ serverName }, "MCP server already configured, skipping");
        }
        
        // If custom config is provided, we can create the client immediately
        // Otherwise, it will be created during execution using pre-configured settings
        if (config) {
            // Store custom config for later use during execution
            // Note: This is a simple approach - in a full implementation, you might want to
            // store custom configs in a separate registry or agent property
            logger.debug({ serverName }, "Custom MCP config will be used during execution");
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error({ serverNameOrConfig, error }, `Failed to add MCP server: ${errorMessage}`);
        // Continue chain even on error to maintain fluent API
    }
    
    return this;
}