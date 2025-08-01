import {
    serve,
    addRouteAgent,
    addRoute,
    addFormTrigger,
    addWorkflowTrigger,
    useOpenAICompatibleRouting,
    useOllamaCompatibleRouting,
    type RouteAgent,
    type StaticRoute,
    type RouteAgentSchema,
} from "./server/mod";

import type { AgentForceAgent } from "./agent";
import type { ServerConfig, AgentForceLogger } from "./types";
import { defaultLogger } from "./logger";
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
    private serverLogger: AgentForceLogger;
    private routeAgents: RouteAgent[] = [];
    private staticRoutes: StaticRoute[] = [];

    /**
     * Constructs the AgentForceServer class.
     * @param config - Configuration object for the server
     */
    constructor(config: ServerConfig) {
        this.name = config.name;
        // Accept injected logger or use default
        this.serverLogger = config.logger || defaultLogger;
    }

    /**
     * Get the name of the server.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get the logger instance.
     */
    public getLogger(): AgentForceLogger {
        return this.serverLogger;
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
    addFormTrigger: (formName: string, htmlFilePath: string, agent: AgentForceAgent, schema?: RouteAgentSchema) => AgentForceServer = addFormTrigger.bind(this);
    addWorkflowTrigger: (method: string, path: string, workflowFilePath: string) => AgentForceServer = addWorkflowTrigger.bind(this);
    useOpenAICompatibleRouting: (agent: AgentForceAgent) => AgentForceServer = useOpenAICompatibleRouting.bind(this);
    useOllamaCompatibleRouting: (agent: AgentForceAgent) => AgentForceServer = useOllamaCompatibleRouting.bind(this);

    // Terminal/Non-chainable methods
    serve: (host?: string, port?: number) => Promise<void> = serve.bind(this);

}
