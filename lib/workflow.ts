import { 
    prompt,
    dispatcher,
    registerAgent,
    sharedStore,
    sequence,
    parallel,
    onSuccess,
    onFail,
    iterate,
    run,
    loop,
    debug,
} from "./workflow/mod";

import type { WorkflowConfig, LoggerType, AgentForceLogger } from "./types";
import type { AgentForceAgent } from "./agent";
import { defaultLogger } from "./logger";

export type { WorkflowConfig };

export interface AgentOutput {
    timestamp: Date;
    output: any;
}

export type ExecutionStepType = "prompt" | "sequence" | "parallel" | "iterate";

export interface ExecutionStep {
    type: ExecutionStepType;
    description: string;
    executionAgentName?: string;
    payload: any;
    onSuccess?: AgentForceAgent;
    onFail?: AgentForceAgent;
}

/**
 * Represents a workflow instance within the AgentForce framework.
 * This class provides the core functionality for creating and managing workflows.
 *
 * @class AgentForceWorkflow
 */
export class AgentForceWorkflow {

    private name: string;
    private logger: LoggerType = "json";
    private workflowLogger: AgentForceLogger;
    
    // Properties accessed by method files should be protected
    protected userPrompt: string = "";
    protected dispatcherAgent: AgentForceAgent | null = null;
    protected agents: { name: string, agent: AgentForceAgent, outputs: AgentOutput[], tools: string[] }[] = [];
    protected executionPlan: ExecutionStep[] = [];
    protected agentToolRegistry: Map<string, string[]> = new Map(); // Maps agent name to tool names
    protected internalSharedStore: Map<string, any> = new Map();

    /**
     * Constructs the AgentForceWorkflow class.
     * @param config - Configuration object for the workflow
     */
    constructor(config: WorkflowConfig) {
        this.name = config.name;
        this.logger = config.logger || "json";
        
        // Initialize logger
        this.workflowLogger = defaultLogger;
    }

    // --- Getters & Setters ---

    /**
     * Get the name of the workflow.
     */
    public getName(): string {
        return this.name;
    }

    /**
     * Get the logger type of the workflow.
     */
    public getLoggerType(): LoggerType {
        return this.logger;
    }

    /**
     * Get the logger instance.
     */
    public getLogger(): AgentForceLogger {
        return this.workflowLogger;
    }

    /**
     * Get the user prompt of the workflow.
     */
    protected getUserPrompt(): string {
        return this.userPrompt;
    }

    /**
     * Set the user prompt of the workflow.
     * @param prompt - The user prompt to set
     */
    protected setUserPrompt(prompt: string): void {
        this.userPrompt = prompt;
    }

    /**
     * Get the dispatcher agent of the workflow.
     */
    protected getDispatcher(): AgentForceAgent | null {
        return this.dispatcherAgent;
    }

    /**
     * Set the dispatcher agent of the workflow.
     * @param agent - The dispatcher agent to set
     */
    protected setDispatcher(agent: AgentForceAgent): void {
        this.dispatcherAgent = agent;
    }

    /**
     * Gets a value from the shared data store.
     * @param key The key of the data to retrieve.
     * @returns The stored value, or undefined if the key doesn't exist.
     */
    public getSharedStoreItem(key: string): any {
        return this.internalSharedStore.get(key);
    }

    /**
     * Sets a value in the shared data store. For internal use by chainable methods.
     * @param key The key to store the data under.
     * @param value The value to store.
     */
    protected setSharedStoreItem(key: string, value: any): void {
        this.internalSharedStore.set(key, value);
    }

    /**
     * Pushes an agent to the internal agents list. For internal use by chainable methods.
     * @param name The name of the agent.
     * @param agent The agent instance.
     * @param outputs The initial outputs array.
     * @param tools The list of tools for the agent.
     */
    protected pushAgent(name: string, agent: AgentForceAgent, outputs: AgentOutput[], tools: string[]): void {
        this.agents.push({ name, agent, outputs, tools });
    }
    
    // --- Chainable Methods ---
    public prompt: (userPrompt: string) => AgentForceWorkflow = prompt.bind(this);
    public dispatcher: (agent: AgentForceAgent) => AgentForceWorkflow = dispatcher.bind(this);
    public registerAgent: (agent: AgentForceAgent) => AgentForceWorkflow = registerAgent.bind(this);
    public sharedStore: (key: string, value: any) => AgentForceWorkflow = sharedStore.bind(this);
    public sequence: (agents: AgentForceAgent[]) => AgentForceWorkflow = sequence.bind(this);
    public parallel: (agents: AgentForceAgent[]) => AgentForceWorkflow = parallel.bind(this);
    public onSuccess: (agent: AgentForceAgent) => AgentForceWorkflow = onSuccess.bind(this);
    public onFail: (agent: AgentForceAgent) => AgentForceWorkflow = onFail.bind(this);
    public iterate: (items: any[] | string, agent: AgentForceAgent) => AgentForceWorkflow = iterate.bind(this);
    public debug: () => AgentForceWorkflow = debug.bind(this);
    
    // --- Terminal Methods ---
    public run: () => Promise<any> = run.bind(this);
    public loop: (delayInMs?: number) => void = loop.bind(this);

}
