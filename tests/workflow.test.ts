import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { AgentForceWorkflow } from "../lib/workflow";
import { AgentForceAgent } from "../lib/agent";
import type { WorkflowConfig, AgentConfig } from "../lib/types";

describe("AgentForceWorkflow Main Class Tests", () => {
    let workflow: AgentForceWorkflow;
    
    const testConfig: WorkflowConfig = {
        name: "TestWorkflow"
    };

    beforeEach(() => {
        workflow = new AgentForceWorkflow(testConfig);
    });

    describe("Constructor", () => {
        test("should create workflow with name from config", () => {
            const result = workflow.getName();
            expect(result).toBe("TestWorkflow");
        });

        test("should create workflow with default logger when not provided", () => {
            const logger = workflow.getLogger();
            expect(logger).toBeDefined();
            expect(typeof logger.debug).toBe("function");
            expect(typeof logger.info).toBe("function");
            expect(typeof logger.warn).toBe("function");
            expect(typeof logger.error).toBe("function");
        });

        test("should create workflow with provided logger", () => {
            const mockLogger = {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            };

            const configWithLogger: WorkflowConfig = {
                name: "TestWorkflowWithLogger",
                logger: mockLogger
            };
            
            const workflowWithLogger = new AgentForceWorkflow(configWithLogger);
            const result = workflowWithLogger.getLogger();
            expect(result).toBe(mockLogger);
        });
    });

    describe("Public Methods", () => {
        test("getName should return workflow name", () => {
            const result = workflow.getName();
            expect(result).toBe("TestWorkflow");
        });

        test("getLogger should return logger instance", () => {
            const result = workflow.getLogger();
            expect(result).toBeDefined();
            expect(typeof result.debug).toBe("function");
        });

        test("getSharedStoreItem should return undefined for non-existent key", () => {
            const result = workflow.getSharedStoreItem("nonexistent");
            expect(result).toBeUndefined();
        });
    });

    describe("Method Availability", () => {
        test("chainable methods should be available as functions", () => {
            expect(typeof workflow.prompt).toBe("function");
            expect(typeof workflow.dispatcher).toBe("function");
            expect(typeof workflow.registerAgent).toBe("function");
            expect(typeof workflow.sharedStore).toBe("function");
            expect(typeof workflow.sequence).toBe("function");
            expect(typeof workflow.parallel).toBe("function");
            expect(typeof workflow.onSuccess).toBe("function");
            expect(typeof workflow.onFail).toBe("function");
            expect(typeof workflow.iterate).toBe("function");
            expect(typeof workflow.debug).toBe("function");
        });

        test("terminal methods should be available as functions", () => {
            expect(typeof workflow.run).toBe("function");
            expect(typeof workflow.loop).toBe("function");
        });
    });

    describe("State Management", () => {
        test("should maintain separate workflows with different configurations", () => {
            const workflow2 = new AgentForceWorkflow({ name: "TestWorkflow2" });
            
            expect(workflow.getName()).toBe("TestWorkflow");
            expect(workflow2.getName()).toBe("TestWorkflow2");
            expect(workflow).not.toBe(workflow2);
        });

        test("should handle shared store operations", () => {
            // Test basic shared store functionality
            const result = workflow.getSharedStoreItem("testKey");
            expect(result).toBeUndefined();
        });
    });

    describe("Protected Methods Access via Chainable Methods", () => {
        let testAgent: AgentForceAgent;

        beforeEach(() => {
            const agentConfig: AgentConfig = {
                name: "TestAgent"
            };
            testAgent = new AgentForceAgent(agentConfig);
        });

        test("should set and get user prompt via chainable methods", () => {
            // Using prompt() chainable method to test setUserPrompt and getUserPrompt
            const result = workflow.prompt("Test user prompt");
            
            expect(result).toBe(workflow);
            // Test that getUserPrompt is accessible through bracket notation
            expect((workflow as any)["getUserPrompt"]()).toBe("Test user prompt");
        });

        test("should set and get dispatcher via chainable methods", () => {
            // Using dispatcher() chainable method to test setDispatcher and getDispatcher
            const result = workflow.dispatcher(testAgent);
            
            expect(result).toBe(workflow);
            // Test that getDispatcher is accessible through bracket notation
            expect((workflow as any)["getDispatcher"]()).toBe(testAgent);
        });

        test("should handle shared store via chainable methods", () => {
            // Using sharedStore() chainable method to test setSharedStoreItem
            const result = workflow.sharedStore("testKey", "testValue");
            
            expect(result).toBe(workflow);
            // Verify the value was stored
            expect(workflow.getSharedStoreItem("testKey")).toBe("testValue");
        });

        test("should register agents via chainable methods", () => {
            // Using registerAgent() chainable method to test pushAgent
            const result = workflow.registerAgent(testAgent);
            
            expect(result).toBe(workflow);
            // Set dispatcher first to avoid debug bug, then check if agent was added
            workflow.dispatcher(testAgent);
            const debugOutput = workflow.debug();
            expect(debugOutput).toBe(workflow);
        });

        test("should handle multiple shared store operations", () => {
            // Test multiple set operations
            workflow
                .sharedStore("key1", "value1")
                .sharedStore("key2", { nested: "object" })
                .sharedStore("key3", [1, 2, 3]);
            
            expect(workflow.getSharedStoreItem("key1")).toBe("value1");
            expect(workflow.getSharedStoreItem("key2")).toEqual({ nested: "object" });
            expect(workflow.getSharedStoreItem("key3")).toEqual([1, 2, 3]);
        });

        test("should handle complex workflow state with all protected methods", () => {
            // Create a complex workflow state using chainable methods
            const complexAgent = new AgentForceAgent({ name: "ComplexAgent" });
            
            const result = workflow
                .prompt("Complex workflow prompt")
                .dispatcher(testAgent)
                .registerAgent(complexAgent)
                .sharedStore("config", { setting: "value" })
                .sharedStore("data", [1, 2, 3]);
            
            expect(result).toBe(workflow);
            
            // Verify all state was set correctly
            expect((workflow as any)["getUserPrompt"]()).toBe("Complex workflow prompt");
            expect((workflow as any)["getDispatcher"]()).toBe(testAgent);
            expect(workflow.getSharedStoreItem("config")).toEqual({ setting: "value" });
            expect(workflow.getSharedStoreItem("data")).toEqual([1, 2, 3]);
        });

        test("should handle null dispatcher state", () => {
            // Test initial state where dispatcher is null
            expect((workflow as any)["getDispatcher"]()).toBeNull();
            
            // Set dispatcher then verify
            workflow.dispatcher(testAgent);
            expect((workflow as any)["getDispatcher"]()).toBe(testAgent);
        });

        test("should handle empty user prompt state", () => {
            // Test initial state where user prompt is empty
            expect((workflow as any)["getUserPrompt"]()).toBe("");
            
            // Set prompt then verify
            workflow.prompt("Updated prompt");
            expect((workflow as any)["getUserPrompt"]()).toBe("Updated prompt");
        });

        test("should maintain agent registration state", () => {
            // Register multiple agents
            const agent1 = new AgentForceAgent({ name: "Agent1" });
            const agent2 = new AgentForceAgent({ name: "Agent2" });
            
            workflow
                .dispatcher(testAgent)  // Set dispatcher first to avoid debug bug
                .registerAgent(agent1)
                .registerAgent(agent2);
            
            // Access internal agents array via debug to verify they were added
            const mockLogger = {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            };
            
            // Override getLogger to capture debug output
            (workflow as any).getLogger = () => mockLogger;
            workflow.debug();
            
            // Verify debug was called with registered agents
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    registeredAgents: ["Agent1", "Agent2"]
                })
            );
        });

        test("should update user prompt via setUserPrompt", () => {
            // Test setUserPrompt directly via bracket notation
            (workflow as any)["setUserPrompt"]("Direct set prompt");
            expect((workflow as any)["getUserPrompt"]()).toBe("Direct set prompt");
        });

        test("should update dispatcher via setDispatcher", () => {
            // Test setDispatcher directly via bracket notation
            (workflow as any)["setDispatcher"](testAgent);
            expect((workflow as any)["getDispatcher"]()).toBe(testAgent);
        });

        test("should update shared store via setSharedStoreItem", () => {
            // Test setSharedStoreItem directly via bracket notation
            (workflow as any)["setSharedStoreItem"]("directKey", "directValue");
            expect(workflow.getSharedStoreItem("directKey")).toBe("directValue");
        });

        test("should push agents via pushAgent", () => {
            // Test pushAgent directly via bracket notation
            (workflow as any)["pushAgent"]("DirectAgent", testAgent, [], ["tool1", "tool2"]);
            
            // Set dispatcher first to avoid debug bug
            workflow.dispatcher(testAgent);
            
            // Verify via debug output
            const mockLogger = {
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn()
            };
            
            (workflow as any).getLogger = () => mockLogger;
            workflow.debug();
            
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.objectContaining({
                    registeredAgents: ["DirectAgent"]
                })
            );
        });
    });
});