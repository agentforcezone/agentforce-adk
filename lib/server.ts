import pino from "pino";
import {
    serve,
    addRouteAgent,
    addRoute,
    useOpenAICompatibleRouting,
    useOllamaCompatibleRouting,
    type RouteAgent,
    type StaticRoute,
    type RouteAgentSchema,
} from "./server/mod";

import type { AgentForceAgent } from "./agent";
import type { ServerConfig, LoggerType } from "./types";
export type { ServerConfig, RouteAgentSchema };

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
    private staticRoutes: StaticRoute[] = [];

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

    /**
     * Add a static route to the collection.
     * @param staticRoute - The static route configuration to add
     */
    public addToStaticRoutes(staticRoute: StaticRoute): void {
        this.staticRoutes.push(staticRoute);
    }

    /**
     * Get all static routes.
     * @returns Array of static route configurations
     */
    public getStaticRoutes(): StaticRoute[] {
        return this.staticRoutes;
    }

    // Chainable methods
    addRouteAgent: (method: string, path: string, agent: AgentForceAgent, schema?: RouteAgentSchema) => AgentForceServer = addRouteAgent.bind(this);
    addRoute: (method: string, path: string, responseData: any) => AgentForceServer = addRoute.bind(this);
    useOpenAICompatibleRouting: (agent: AgentForceAgent) => AgentForceServer = useOpenAICompatibleRouting.bind(this);
    useOllamaCompatibleRouting: (agent: AgentForceAgent) => AgentForceServer = useOllamaCompatibleRouting.bind(this);

    // Terminal/Non-chainable methods
    serve: (host?: string, port?: number) => Promise<void> = serve.bind(this);

}
