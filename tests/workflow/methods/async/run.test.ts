import { describe, expect, test, beforeEach, jest } from "@jest/globals";
import { run } from "../../../../lib/workflow/methods/async/run";
import type { AgentForceLogger } from "../../../../lib/types";

describe("AgentForceWorkflow run Method Tests", () => {
    // Test Coverage Plan:
    // ✅ Main run function execution flow
    // ✅ Empty execution plan handling  
    // ✅ Final output and shared store return
    // ✅ executeStep - prompt type (sets user prompt)
    // ✅ executeStep - sequence type (runs agents in sequence)
    // ✅ executeStep - parallel type (runs agents in parallel)
    // ✅ executeStep - iterate type (iterates over items with agent)
    // ✅ executeStep - iterate with shared store items
    // ✅ executeStep - error handling without onFail handler
    // ✅ executeStep - error handling with onFail handler  
    // ✅ executeStep - onSuccess handler execution
    // ✅ executeStep - multiple steps workflow
    // ✅ Edge cases (unknown step types, empty shared store)

    interface MockAgent {
        getName(): string;
        execute: jest.MockedFunction<(input: any) => Promise<any>>;
    }

    interface MockWorkflow {
        getName(): string;
        getLogger(): AgentForceLogger;
        getUserPrompt(): string;
        setUserPrompt: jest.MockedFunction<(prompt: string) => void>;
        getSharedStoreItem: jest.MockedFunction<(key: string) => any>;
        executionPlan: any[];
        internalSharedStore: Map<string, any>;
    }

    let mockWorkflow: MockWorkflow;
    let mockLogger: AgentForceLogger;
    let mockAgent: MockAgent;

    beforeEach(() => {
        jest.clearAllMocks();

        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };

        mockAgent = {
            getName: () => "TestAgent",
            execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Agent execution result")
        };

        mockWorkflow = {
            getName: () => "TestWorkflow",
            getLogger: () => mockLogger,
            getUserPrompt: () => "Initial user prompt",
            setUserPrompt: jest.fn<(prompt: string) => void>(),
            getSharedStoreItem: jest.fn<(key: string) => any>(),
            executionPlan: [],
            internalSharedStore: new Map()
        };
    });

    describe("Main run function", () => {
        test("should log start and end messages", async () => {
            // Add a simple execution plan so we get the end message
            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Test step",
                payload: "test"
            }];
            
            await run.call(mockWorkflow as any);

            expect(mockLogger.info).toHaveBeenCalledTimes(2);
            expect(mockLogger.info).toHaveBeenNthCalledWith(1, {
                message: "Running workflow...",
                name: "TestWorkflow"
            });
            expect(mockLogger.info).toHaveBeenNthCalledWith(2, {
                message: "Workflow execution finished."
            });
        });

        test("should handle empty execution plan", async () => {
            mockWorkflow.executionPlan = [];
            
            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.warn).toHaveBeenCalledWith({
                message: "Execution plan is empty. Nothing to run."
            });
            expect(result).toEqual({
                finalOutput: undefined,
                sharedStore: {}
            });
        });

        test("should return final output and shared store", async () => {
            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Set user prompt", 
                payload: "Test prompt"
            }];
            mockWorkflow.internalSharedStore.set("key1", "value1");

            const result = await run.call(mockWorkflow as any);

            expect(result).toEqual({
                finalOutput: "Test prompt",
                sharedStore: { key1: "value1" }
            });
        });

        test("should pass user prompt as initial input", async () => {
            mockWorkflow.getUserPrompt = () => "Initial prompt input";
            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Test step",
                payload: "Updated prompt"
            }];

            await run.call(mockWorkflow as any);

            expect(mockWorkflow.setUserPrompt).toHaveBeenCalledWith("Updated prompt");
        });
    });

    describe("executeStep - prompt type", () => {
        test("should execute prompt step and set user prompt", async () => {
            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Set new prompt",
                payload: "New user prompt"
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.debug).toHaveBeenCalledWith({
                message: "Executing step: prompt",
                input: "Initial user prompt"
            });
            expect(mockWorkflow.setUserPrompt).toHaveBeenCalledWith("New user prompt");
            expect(result.finalOutput).toBe("New user prompt");
        });
    });

    describe("executeStep - sequence type", () => {
        test("should execute sequence of agents", async () => {
            const mockAgent2 = {
                getName: () => "TestAgent2",
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Agent 2 result")
            };

            mockWorkflow.executionPlan = [{
                type: "sequence",
                description: "Execute agents in sequence",
                payload: [mockAgent, mockAgent2]
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Executing agent 'TestAgent' in sequence."
            });
            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Executing agent 'TestAgent2' in sequence."
            });
            expect(mockAgent.execute).toHaveBeenCalledWith("Initial user prompt");
            expect(mockAgent2.execute).toHaveBeenCalledWith("Agent execution result");
            expect(result.finalOutput).toBe("Agent 2 result");
        });

        test("should handle single agent in sequence", async () => {
            mockWorkflow.executionPlan = [{
                type: "sequence",
                description: "Single agent sequence",
                payload: [mockAgent]
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockAgent.execute).toHaveBeenCalledWith("Initial user prompt");
            expect(result.finalOutput).toBe("Agent execution result");
        });
    });

    describe("executeStep - parallel type", () => {
        test("should execute agents in parallel", async () => {
            const mockAgent2 = {
                getName: () => "TestAgent2", 
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Agent 2 result")
            };

            mockWorkflow.executionPlan = [{
                type: "parallel",
                description: "Execute agents in parallel",
                payload: [mockAgent, mockAgent2]
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Executing 2 agents in parallel."
            });
            expect(mockAgent.execute).toHaveBeenCalledWith("Initial user prompt");
            expect(mockAgent2.execute).toHaveBeenCalledWith("Initial user prompt");
            expect(result.finalOutput).toEqual(["Agent execution result", "Agent 2 result"]);
        });
    });

    describe("executeStep - iterate type", () => {
        test("should iterate over array of items", async () => {
            mockAgent.execute = jest.fn<(input: any) => Promise<any>>()
                .mockResolvedValueOnce("Result for item1")
                .mockResolvedValueOnce("Result for item2")
                .mockResolvedValueOnce("Result for item3");

            mockWorkflow.executionPlan = [{
                type: "iterate", 
                description: "Iterate over items",
                payload: {
                    items: ["item1", "item2", "item3"],
                    agent: mockAgent
                }
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Iterating over 3 items with agent 'TestAgent'."
            });
            expect(mockAgent.execute).toHaveBeenCalledTimes(3);
            expect(mockAgent.execute).toHaveBeenNthCalledWith(1, "item1");
            expect(mockAgent.execute).toHaveBeenNthCalledWith(2, "item2");
            expect(mockAgent.execute).toHaveBeenNthCalledWith(3, "item3");
            expect(result.finalOutput).toEqual([
                "Result for item1",
                "Result for item2", 
                "Result for item3"
            ]);
        });

        test("should iterate over items from shared store", async () => {
            mockWorkflow.getSharedStoreItem = jest.fn<(key: string) => any>().mockReturnValue(["shared1", "shared2"]);
            mockAgent.execute = jest.fn<(input: any) => Promise<any>>()
                .mockResolvedValueOnce("Result for shared1") 
                .mockResolvedValueOnce("Result for shared2");

            mockWorkflow.executionPlan = [{
                type: "iterate",
                description: "Iterate over shared items",
                payload: {
                    items: "sharedArrayKey",
                    agent: mockAgent
                }
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockWorkflow.getSharedStoreItem).toHaveBeenCalledWith("sharedArrayKey");
            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Iterating over 2 items with agent 'TestAgent'."
            });
            expect(result.finalOutput).toEqual([
                "Result for shared1",
                "Result for shared2"
            ]);
        });

        test("should handle invalid shared store key (not array)", async () => {
            mockWorkflow.getSharedStoreItem = jest.fn<(key: string) => any>().mockReturnValue("not-an-array");

            mockWorkflow.executionPlan = [{
                type: "iterate",
                description: "Iterate over invalid shared items",
                payload: {
                    items: "invalidKey",
                    agent: mockAgent
                }
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'Shared store key "invalidKey" for iteration does not contain an array.'
            );
            expect(result.finalOutput).toBe(
                'Error: Shared store key "invalidKey" for iteration does not contain an array.'
            );
        });

        test("should handle empty array iteration", async () => {
            mockWorkflow.executionPlan = [{
                type: "iterate",
                description: "Iterate over empty array",
                payload: {
                    items: [],
                    agent: mockAgent
                }
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Iterating over 0 items with agent 'TestAgent'."
            });
            expect(mockAgent.execute).not.toHaveBeenCalled();
            expect(result.finalOutput).toEqual([]);
        });
    });

    describe("executeStep - error handling", () => {
        test("should handle step execution error without onFail handler", async () => {
            mockAgent.execute = jest.fn<(input: any) => Promise<any>>().mockRejectedValue(new Error("Agent execution failed"));

            mockWorkflow.executionPlan = [{
                type: "sequence",
                description: "Failing sequence",
                payload: [mockAgent]
            }];

            await expect(run.call(mockWorkflow as any)).rejects.toThrow("Agent execution failed");

            expect(mockLogger.error).toHaveBeenCalledWith({
                message: "Step sequence failed",
                error: "Agent execution failed",
                stack: expect.any(String)
            });
        });

        test("should execute onFail handler when step fails", async () => {
            const onFailAgent = {
                getName: () => "OnFailAgent",
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Failure handled")
            };

            mockAgent.execute = jest.fn<(input: any) => Promise<any>>().mockRejectedValue(new Error("Agent execution failed"));

            mockWorkflow.executionPlan = [{
                type: "sequence",
                description: "Failing sequence with onFail",
                payload: [mockAgent],
                onFail: onFailAgent
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.error).toHaveBeenCalledWith({
                message: "Step sequence failed",
                error: "Agent execution failed",
                stack: expect.any(String)
            });
            expect(mockLogger.warn).toHaveBeenCalledWith({
                message: "Executing onFail handler for step: sequence"
            });
            expect(onFailAgent.execute).toHaveBeenCalledWith("Agent execution failed");
            expect(result.finalOutput).toBe("Failure handled");
        });

        test("should handle onFail handler execution error", async () => {
            const onFailAgent = {
                getName: () => "OnFailAgent",
                execute: jest.fn<(input: any) => Promise<any>>().mockRejectedValue(new Error("OnFail handler failed"))
            };

            mockAgent.execute = jest.fn<(input: any) => Promise<any>>().mockRejectedValue(new Error("Agent execution failed"));

            mockWorkflow.executionPlan = [{
                type: "sequence", 
                description: "Failing sequence with failing onFail",
                payload: [mockAgent],
                onFail: onFailAgent
            }];

            await expect(run.call(mockWorkflow as any)).rejects.toThrow("OnFail handler failed");
        });
    });

    describe("executeStep - onSuccess handlers", () => {
        test("should execute onSuccess handler when step succeeds", async () => {
            const onSuccessAgent = {
                getName: () => "OnSuccessAgent",
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Success processed")
            };

            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Successful prompt with onSuccess",
                payload: "Test prompt",
                onSuccess: onSuccessAgent
            }];

            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.info).toHaveBeenCalledWith({
                message: "Executing onSuccess handler for step: prompt"
            });
            expect(onSuccessAgent.execute).toHaveBeenCalledWith("Test prompt");
            expect(result.finalOutput).toBe("Success processed");
        });

        test("should not execute onSuccess handler when step fails", async () => {
            const onSuccessAgent = {
                getName: () => "OnSuccessAgent", 
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Success processed")
            };

            mockAgent.execute = jest.fn<(input: any) => Promise<any>>().mockRejectedValue(new Error("Agent execution failed"));

            mockWorkflow.executionPlan = [{
                type: "sequence",
                description: "Failing sequence with onSuccess",
                payload: [mockAgent],
                onSuccess: onSuccessAgent
            }];

            await expect(run.call(mockWorkflow as any)).rejects.toThrow("Agent execution failed");
            expect(onSuccessAgent.execute).not.toHaveBeenCalled();
        });

        test("should handle onSuccess handler execution error", async () => {
            const onSuccessAgent = {
                getName: () => "OnSuccessAgent",
                execute: jest.fn<(input: any) => Promise<any>>().mockRejectedValue(new Error("OnSuccess handler failed"))
            };

            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Prompt with failing onSuccess",
                payload: "Test prompt",
                onSuccess: onSuccessAgent
            }];

            await expect(run.call(mockWorkflow as any)).rejects.toThrow("OnSuccess handler failed");
        });
    });

    describe("executeStep - multiple steps workflow", () => {
        test("should execute multiple steps in sequence", async () => {
            const mockAgent2 = {
                getName: () => "TestAgent2",
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Step 2 result")
            };

            mockWorkflow.executionPlan = [
                {
                    type: "prompt",
                    description: "Step 1: Set prompt",
                    payload: "Step 1 output"
                },
                {
                    type: "sequence",
                    description: "Step 2: Execute agent",
                    payload: [mockAgent2]
                }
            ];

            const result = await run.call(mockWorkflow as any);

            expect(mockWorkflow.setUserPrompt).toHaveBeenCalledWith("Step 1 output");
            expect(mockAgent2.execute).toHaveBeenCalledWith("Step 1 output");
            expect(result.finalOutput).toBe("Step 2 result");
        });

        test("should pass output from previous step as input to next step", async () => {
            mockWorkflow.executionPlan = [
                {
                    type: "prompt",
                    description: "Step 1", 
                    payload: "Modified prompt"
                },
                {
                    type: "sequence",
                    description: "Step 2",
                    payload: [mockAgent]
                }
            ];

            await run.call(mockWorkflow as any);

            expect(mockAgent.execute).toHaveBeenCalledWith("Modified prompt");
        });
    });

    describe("executeStep - complex scenarios", () => {
        test("should handle mixed step types with success and failure handlers", async () => {
            const successAgent = {
                getName: () => "SuccessAgent",
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Success handled")
            };

            mockWorkflow.executionPlan = [
                {
                    type: "prompt",
                    description: "Initial prompt",
                    payload: "Initial"
                },
                {
                    type: "parallel",
                    description: "Parallel execution",
                    payload: [mockAgent],
                    onSuccess: successAgent
                }
            ];

            const result = await run.call(mockWorkflow as any);

            expect(result.finalOutput).toBe("Success handled");
            expect(successAgent.execute).toHaveBeenCalledWith(["Agent execution result"]);
        });

        test("should handle all step types in single workflow", async () => {
            mockWorkflow.getSharedStoreItem = jest.fn<(key: string) => any>().mockReturnValue(["shared1", "shared2"]);
            
            const iterateAgent = {
                getName: () => "IterateAgent",
                execute: jest.fn<(input: any) => Promise<any>>().mockResolvedValue("Iterate result")
            };

            mockWorkflow.executionPlan = [
                {
                    type: "prompt",
                    description: "Set prompt",
                    payload: "Test prompt"
                },
                {
                    type: "sequence",
                    description: "Sequential execution",
                    payload: [mockAgent]
                },
                {
                    type: "parallel", 
                    description: "Parallel execution",
                    payload: [mockAgent]
                },
                {
                    type: "iterate",
                    description: "Iterate execution",
                    payload: {
                        items: "sharedKey",
                        agent: iterateAgent
                    }
                }
            ];

            const result = await run.call(mockWorkflow as any);

            expect(mockWorkflow.setUserPrompt).toHaveBeenCalledWith("Test prompt");
            expect(mockAgent.execute).toHaveBeenCalledTimes(2); // Once for sequence, once for parallel
            expect(iterateAgent.execute).toHaveBeenCalledTimes(2); // Once for each shared item
            expect(result.finalOutput).toEqual(["Iterate result", "Iterate result"]);
        });
    });

    describe("Edge cases and error scenarios", () => {
        test("should handle unknown step type gracefully", async () => {
            mockWorkflow.executionPlan = [{
                type: "unknown",
                description: "Unknown step type",
                payload: "test"
            }];

            const result = await run.call(mockWorkflow as any);

            // Unknown step type should result in undefined output (no case match)
            expect(result.finalOutput).toBeUndefined();
        });

        test("should handle workflow with empty shared store", async () => {
            mockWorkflow.internalSharedStore = new Map();
            mockWorkflow.executionPlan = [{
                type: "prompt",
                description: "Simple prompt",
                payload: "test"
            }];

            const result = await run.call(mockWorkflow as any);

            expect(result.sharedStore).toEqual({});
        });

        test("should handle null execution plan", async () => {
            mockWorkflow.executionPlan = null as any;
            
            const result = await run.call(mockWorkflow as any);

            expect(mockLogger.warn).toHaveBeenCalledWith({
                message: "Execution plan is empty. Nothing to run."
            });
            expect(result).toEqual({
                finalOutput: undefined,
                sharedStore: {}
            });
        });
    });

});