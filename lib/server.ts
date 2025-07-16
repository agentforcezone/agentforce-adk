import pino from "pino";
import {
    serve,
    addRouteAgent,
    type RouteAgent,
} from "./server/mod";

import type { AgentForceAgent } from "./agent";
import type { ServerConfig, LoggerType } from "./types";
export type { ServerConfig };

/**
 * Represents a server instance within the AgentForce framework.
 * This class provides the core functionality for creating and managing servers,
 * including configuration of name and logging.
 *
 * @class AgentForceServer
 */
export class AgentForceServer {

    private name: string;
    private logger: LoggerType = "json";
    private pinoLogger: pino.Logger;
    private routeAgents: RouteAgent[] = [];

    /**
     * Constructs the AgentForceServer class.
     * @param config - Configuration object for the server
     */
    constructor(config: ServerConfig) {
        this.name = config.name;
        this.logger = config.logger || "json";
        
        // Initialize pino logger based on the logger type
        if (this.logger === "pretty") {
            try {
                this.pinoLogger = pino({
                    transport: {
                        target: "pino-pretty",
                        options: {
                            colorize: true,
                        },
                    },
                });
            } catch {
                // Fallback to JSON logger if pino-pretty is not available
                console.warn("⚠️  pino-pretty not found. Falling back to JSON logger. Install pino-pretty for pretty logging: npm install pino-pretty");
                this.pinoLogger = pino();
                this.logger = "json";
            }
        } else {
            this.pinoLogger = pino();
        }
    }

    /**
     * Get the name of the server.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get the logger type of the server.
     */
    public getLoggerType(): LoggerType {
        return this.logger;
    }

    /**
     * Get the pino logger instance.
     */
    public getLogger(): pino.Logger {
        return this.pinoLogger;
    }

    /**
     * Add a route agent to the collection.
     * @param routeAgent - The route agent configuration to add
     */
    public addToRouteAgents(routeAgent: RouteAgent): void {
        this.routeAgents.push(routeAgent);
    }

    /**
     * Get all route agents.
     * @returns Array of route agent configurations
     */
    public getRouteAgents(): RouteAgent[] {
        return this.routeAgents;
    }

    // Chainable methods
    addRouteAgent: (method: string, path: string, agent: AgentForceAgent) => AgentForceServer = addRouteAgent.bind(this);

    // Terminal/Non-chainable methods
    serve: (host?: string, port?: number) => void = serve.bind(this);

}
