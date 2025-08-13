import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import type { AgentForceLogger } from "../../../lib/types";

// Import just the debug function directly to avoid importing the full workflow module
import { debug } from "../../../lib/workflow/methods/debug";

// Create a minimal mock workflow interface for testing
interface MockWorkflow {
    getName(): string;
    getLogger(): AgentForceLogger;
    getUserPrompt(): string;
    getDispatcher(): any;
    executionPlan: any[];
    agents: Array<{ name: string; agent: any; outputs: any[]; tools: string[] }>;
    internalSharedStore: Map<string, any>;
}

describe("AgentForceWorkflow debug Method Tests", () => {
    let mockWorkflow: MockWorkflow;
    let mockLogger: AgentForceLogger;
    let mockAgent: any;

    beforeEach(() => {
        // Create mock logger
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        // Create mock agent
        mockAgent = {
            getName: () => "TestAgent"
        };

        // Create mock workflow with non-null dispatcher to avoid the bug
        mockWorkflow = {
            getName: () => "TestWorkflow",
            getLogger: () => mockLogger,
            getUserPrompt: () => "",
            getDispatcher: () => mockAgent,  // Use mockAgent as default dispatcher
            executionPlan: [],
            agents: [],
            internalSharedStore: new Map()
        };
    });

    test("should return workflow instance for method chaining", () => {
        const result = debug.call(mockWorkflow as any);
        expect(result).toBe(mockWorkflow);
    });

    test("should log debug information with basic configuration", () => {
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalledWith({
            message: "Workflow Debug Information",
            configuration: {
                name: "TestWorkflow",
                logger: "AgentForceLogger"
            },
            prompt: "",
            dispatcher: "TestAgent",  // Now using the default mockAgent dispatcher
            executionPlan: [],
            registeredAgents: [],
            sharedStoreItems: {}
        });
    });

    test("should log user prompt when set", () => {
        mockWorkflow.getUserPrompt = () => "Test user prompt";
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: "Test user prompt"
            })
        );
    });

    test("should log dispatcher information when set", () => {
        mockWorkflow.getDispatcher = () => mockAgent;
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                dispatcher: "TestAgent"
            })
        );
    });

    test("should handle null dispatcher gracefully without throwing", () => {
        // Mock dispatcher returns null - this should now work without throwing
        mockWorkflow.getDispatcher = () => null;
        
        // Bug has been fixed - method now handles null dispatcher gracefully
        expect(() => debug.call(mockWorkflow as any)).not.toThrow();
    });

    // This test demonstrates what the expected behavior should be after fixing the bug
    test("should handle null dispatcher gracefully", () => {
        // Bug has been fixed - null dispatcher now returns "None" instead of throwing error
        // Fixed the bug in debug.ts line 11 by adding null check
        mockWorkflow.getDispatcher = () => null;
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                dispatcher: "None"
            })
        );
    });

    test("should handle dispatcher with empty name gracefully", () => {
        // Cover the || "None" fallback branch on line 20
        const emptyNameAgent = {
            getName: () => ""  // Empty string should trigger fallback
        };
        mockWorkflow.getDispatcher = () => emptyNameAgent;
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                dispatcher: "None"
            })
        );
    });

    test("should log registered agents", () => {
        mockWorkflow.agents = [
            { name: "Agent1", agent: mockAgent, outputs: [], tools: ["tool1"] },
            { name: "Agent2", agent: mockAgent, outputs: [], tools: ["tool2"] }
        ];
        
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                registeredAgents: ["Agent1", "Agent2"]
            })
        );
    });

    test("should log shared store items", () => {
        mockWorkflow.internalSharedStore.set("key1", "value1");
        mockWorkflow.internalSharedStore.set("key2", { nested: "object" });
        
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                sharedStoreItems: {
                    key1: "value1",
                    key2: { nested: "object" }
                }
            })
        );
    });

    test("should log execution plan when available", () => {
        mockWorkflow.executionPlan = [{
            type: "sequence",
            description: "Test sequence step",
            onSuccess: mockAgent,
            onFail: mockAgent
        }];
        
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                executionPlan: [{
                    type: "sequence",
                    description: "Test sequence step",
                    onSuccess: "TestAgent",
                    onFail: "TestAgent"
                }]
            })
        );
    });

    test("should handle execution plan with null success/fail handlers", () => {
        mockWorkflow.executionPlan = [{
            type: "parallel",
            description: "Test parallel step"
        }];
        
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                executionPlan: [{
                    type: "parallel",
                    description: "Test parallel step",
                    onSuccess: undefined,
                    onFail: undefined
                }]
            })
        );
    });

    test("should work with complex workflow state", () => {
        // Set up complex mock state
        mockWorkflow.getUserPrompt = () => "Complex workflow prompt";
        mockWorkflow.getDispatcher = () => mockAgent;
        mockWorkflow.agents = [
            { name: "ComplexAgent", agent: mockAgent, outputs: [], tools: ["tool1", "tool2"] }
        ];
        mockWorkflow.internalSharedStore.set("config", { setting: "value" });
        mockWorkflow.executionPlan = [{
            type: "iterate",
            description: "Iterate over items",
            executionAgentName: "ComplexAgent"
        }];

        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith({
            message: "Workflow Debug Information",
            configuration: {
                name: "TestWorkflow",
                logger: "AgentForceLogger"
            },
            prompt: "Complex workflow prompt",
            dispatcher: "TestAgent",
            executionPlan: [{
                type: "iterate",
                description: "Iterate over items",
                onSuccess: undefined,
                onFail: undefined
            }],
            registeredAgents: ["ComplexAgent"],
            sharedStoreItems: {
                config: { setting: "value" }
            }
        });
    });

    test("should handle empty shared store", () => {
        mockWorkflow.internalSharedStore = new Map();
        
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
                sharedStoreItems: {}
            })
        );
    });

    test("should call logger.info exactly once per debug call", () => {
        debug.call(mockWorkflow as any);
        debug.call(mockWorkflow as any);
        debug.call(mockWorkflow as any);

        expect(mockLogger.info).toHaveBeenCalledTimes(3);
    });
});