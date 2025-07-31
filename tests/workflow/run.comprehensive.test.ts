import { describe, expect, test, beforeEach, mock, spyOn } from "bun:test";
import { AgentForceWorkflow, type WorkflowConfig } from "../../lib/workflow";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";

describe('AgentForceWorkflow run Method Comprehensive Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent1: AgentForceAgent;
    let testAgent2: AgentForceAgent;
    let testAgent3: AgentForceAgent;
    let failAgent: AgentForceAgent;
    let successHandlerAgent: AgentForceAgent;
    let failHandlerAgent: AgentForceAgent;

    beforeEach(() => {
        const workflowConfig: WorkflowConfig = { name: "TestWorkflow" };
        workflow = new AgentForceWorkflow(workflowConfig);
        
        // Create test agents
        testAgent1 = new AgentForceAgent({ name: "TestAgent1" });
        testAgent2 = new AgentForceAgent({ name: "TestAgent2" });
        testAgent3 = new AgentForceAgent({ name: "TestAgent3" });
        failAgent = new AgentForceAgent({ name: "FailAgent" });
        successHandlerAgent = new AgentForceAgent({ name: "SuccessHandler" });
        failHandlerAgent = new AgentForceAgent({ name: "FailHandler" });
        
        // Mock agent execute methods
        spyOn(testAgent1, "execute").mockResolvedValue("Result from TestAgent1");
        spyOn(testAgent2, "execute").mockResolvedValue("Result from TestAgent2");
        spyOn(testAgent3, "execute").mockResolvedValue("Result from TestAgent3");
        spyOn(successHandlerAgent, "execute").mockResolvedValue("Success handled");
        spyOn(failHandlerAgent, "execute").mockResolvedValue("Failure handled");
    });

    describe('Prompt Step Type (Manual Execution Plan)', () => {
        test("should handle prompt step type when manually added to execution plan", async () => {
            // This tests lines 20-22 by manually adding prompt step
            // Since there's no public method to add prompt steps, we'll extend the class
            class TestWorkflow extends AgentForceWorkflow {
                addPromptStep(prompt: string) {
                    this.executionPlan.push({ type: "prompt", payload: prompt, description: "Test prompt step" });
                }
            }
            
            const testWorkflow = new TestWorkflow({ name: "TestWorkflow" });
            testWorkflow.addPromptStep("Test prompt content");
            
            const result = await testWorkflow.run();
            
            expect(result.finalOutput).toBe("Test prompt content");
            expect(result).toHaveProperty("sharedStore");
        });

        test("should handle multiple prompt steps", async () => {
            // Test multiple prompt steps
            class TestWorkflow extends AgentForceWorkflow {
                addPromptStep(prompt: string) {
                    this.executionPlan.push({ type: "prompt", payload: prompt, description: "Test prompt step" });
                }
            }
            
            const testWorkflow = new TestWorkflow({ name: "TestWorkflow" });
            testWorkflow.addPromptStep("First prompt");
            testWorkflow.addPromptStep("Second prompt");
            
            const result = await testWorkflow.run();
            
            expect(result.finalOutput).toBe("Second prompt");
        });
    });

    describe('Sequence Step Type', () => {
        test("should handle sequence execution", async () => {
            workflow
                .registerAgent(testAgent1)
                .registerAgent(testAgent2)
                .sequence([testAgent1, testAgent2]);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledWith("");
            expect(testAgent2.execute).toHaveBeenCalledWith("Result from TestAgent1");
            expect(result.finalOutput).toBe("Result from TestAgent2");
        });

        test("should handle sequence with prompt input", async () => {
            workflow
                .prompt("Initial input")
                .registerAgent(testAgent1)
                .sequence([testAgent1]);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledWith("Initial input");
            expect(result.finalOutput).toBe("Result from TestAgent1");
        });
    });

    describe('Parallel Step Type', () => {
        test("should handle parallel execution", async () => {
            // This tests lines 35-40
            workflow
                .registerAgent(testAgent1)
                .registerAgent(testAgent2)
                .registerAgent(testAgent3)
                .parallel([testAgent1, testAgent2, testAgent3]);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledWith("");
            expect(testAgent2.execute).toHaveBeenCalledWith("");
            expect(testAgent3.execute).toHaveBeenCalledWith("");
            expect(result.finalOutput).toEqual([
                "Result from TestAgent1",
                "Result from TestAgent2",
                "Result from TestAgent3"
            ]);
        });

        test("should handle parallel with input from previous step", async () => {
            workflow
                .prompt("Parallel input")
                .registerAgent(testAgent1)
                .registerAgent(testAgent2)
                .parallel([testAgent1, testAgent2]);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledWith("Parallel input");
            expect(testAgent2.execute).toHaveBeenCalledWith("Parallel input");
            expect(result.finalOutput).toEqual([
                "Result from TestAgent1",
                "Result from TestAgent2"
            ]);
        });
    });

    describe('Iterate Step Type', () => {
        test("should handle iterate with array items", async () => {
            // This tests lines 42-44, 52, 55-57
            workflow
                .registerAgent(testAgent1)
                .iterate(["item1", "item2", "item3"], testAgent1);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledTimes(3);
            expect(testAgent1.execute).toHaveBeenCalledWith("item1");
            expect(testAgent1.execute).toHaveBeenCalledWith("item2");
            expect(testAgent1.execute).toHaveBeenCalledWith("item3");
            expect(result.finalOutput).toEqual([
                "Result from TestAgent1",
                "Result from TestAgent1",
                "Result from TestAgent1"
            ]);
        });

        test("should handle iterate with shared store key", async () => {
            // This tests lines 46-51
            workflow
                .sharedStore("myItems", ["a", "b", "c"])
                .registerAgent(testAgent1)
                .iterate("myItems", testAgent1);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledTimes(3);
            expect(testAgent1.execute).toHaveBeenCalledWith("a");
            expect(testAgent1.execute).toHaveBeenCalledWith("b");
            expect(testAgent1.execute).toHaveBeenCalledWith("c");
        });

        test("should throw error when shared store key contains non-array", async () => {
            // This tests lines 48-50
            workflow
                .sharedStore("notAnArray", "string value")
                .registerAgent(testAgent1)
                .iterate("notAnArray", testAgent1);
            
            await expect(workflow.run()).rejects.toThrow('Shared store key "notAnArray" for iteration does not contain an array');
        });

        test("should handle iterate with empty array", async () => {
            workflow
                .registerAgent(testAgent1)
                .iterate([], testAgent1);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).not.toHaveBeenCalled();
            expect(result.finalOutput).toEqual([]);
        });
    });

    describe('Error Handling and onFail', () => {
        test("should handle step failure with onFail handler", async () => {
            // This tests lines 60-63, 65-66, 68-69
            spyOn(failAgent, "execute").mockRejectedValue(new Error("Agent failed"));
            
            workflow
                .registerAgent(failAgent)
                .registerAgent(failHandlerAgent)
                .sequence([failAgent])
                .onFail(failHandlerAgent);
            
            const result = await workflow.run();
            
            expect(failHandlerAgent.execute).toHaveBeenCalledWith("Agent failed");
            expect(result.finalOutput).toBe("Failure handled");
        });

        test("should re-throw error when no onFail handler", async () => {
            spyOn(failAgent, "execute").mockRejectedValue(new Error("Agent failed"));
            
            workflow
                .registerAgent(failAgent)
                .sequence([failAgent]);
            
            await expect(workflow.run()).rejects.toThrow("Agent failed");
        });

        test("should handle parallel execution failure with onFail", async () => {
            spyOn(testAgent2, "execute").mockRejectedValue(new Error("Parallel agent failed"));
            
            workflow
                .registerAgent(testAgent1)
                .registerAgent(testAgent2)
                .registerAgent(failHandlerAgent)
                .parallel([testAgent1, testAgent2])
                .onFail(failHandlerAgent);
            
            const result = await workflow.run();
            
            expect(failHandlerAgent.execute).toHaveBeenCalledWith("Parallel agent failed");
            expect(result.finalOutput).toBe("Failure handled");
        });

        test("should handle iterate execution failure with onFail", async () => {
            spyOn(testAgent1, "execute").mockRejectedValue(new Error("Iterate failed"));
            
            workflow
                .registerAgent(testAgent1)
                .registerAgent(failHandlerAgent)
                .iterate(["item1"], testAgent1)
                .onFail(failHandlerAgent);
            
            const result = await workflow.run();
            
            expect(failHandlerAgent.execute).toHaveBeenCalledWith("Iterate failed");
            expect(result.finalOutput).toBe("Failure handled");
        });
    });

    describe('Success Handling and onSuccess', () => {
        test("should handle successful step with onSuccess handler", async () => {
            // This tests line 76
            workflow
                .registerAgent(testAgent1)
                .registerAgent(successHandlerAgent)
                .sequence([testAgent1])
                .onSuccess(successHandlerAgent);
            
            const result = await workflow.run();
            
            expect(successHandlerAgent.execute).toHaveBeenCalledWith("Result from TestAgent1");
            expect(result.finalOutput).toBe("Success handled");
        });

        test("should handle parallel success with onSuccess handler", async () => {
            workflow
                .registerAgent(testAgent1)
                .registerAgent(testAgent2)
                .registerAgent(successHandlerAgent)
                .parallel([testAgent1, testAgent2])
                .onSuccess(successHandlerAgent);
            
            const result = await workflow.run();
            
            expect(successHandlerAgent.execute).toHaveBeenCalledWith([
                "Result from TestAgent1",
                "Result from TestAgent2"
            ]);
            expect(result.finalOutput).toBe("Success handled");
        });

        test("should handle iterate success with onSuccess handler", async () => {
            workflow
                .registerAgent(testAgent1)
                .registerAgent(successHandlerAgent)
                .iterate(["a", "b"], testAgent1)
                .onSuccess(successHandlerAgent);
            
            const result = await workflow.run();
            
            expect(successHandlerAgent.execute).toHaveBeenCalledWith([
                "Result from TestAgent1",
                "Result from TestAgent1"
            ]);
            expect(result.finalOutput).toBe("Success handled");
        });
    });

    describe('Complex Workflow Scenarios', () => {
        test("should handle mixed step types", async () => {
            workflow
                .prompt("Start")
                .registerAgent(testAgent1)
                .registerAgent(testAgent2)
                .registerAgent(testAgent3)
                .sequence([testAgent1])
                .parallel([testAgent2, testAgent3])
                .iterate(["final1", "final2"], testAgent1);
            
            const result = await workflow.run();
            
            // Verify execution order
            const calls = (testAgent1.execute as any).mock.calls;
            expect(calls[0][0]).toBe("Start"); // First sequence call
            expect(calls[1][0]).toBe("final1"); // First iterate call
            expect(calls[2][0]).toBe("final2"); // Second iterate call
            
            expect(result.finalOutput).toEqual([
                "Result from TestAgent1",
                "Result from TestAgent1"
            ]);
        });

        test("should handle shared store throughout workflow", async () => {
            workflow
                .sharedStore("config", { mode: "test" })
                .sharedStore("items", ["x", "y"])
                .registerAgent(testAgent1)
                .iterate("items", testAgent1);
            
            const result = await workflow.run();
            
            expect(result.sharedStore).toEqual({
                config: { mode: "test" },
                items: ["x", "y"]
            });
            expect(testAgent1.execute).toHaveBeenCalledWith("x");
            expect(testAgent1.execute).toHaveBeenCalledWith("y");
        });

        test("should handle nested error scenarios", async () => {
            const errorMessage = "Complex workflow error";
            let callCount = 0;
            
            spyOn(testAgent1, "execute").mockImplementation(() => {
                callCount++;
                if (callCount === 2) {
                    return Promise.reject(new Error(errorMessage));
                }
                return Promise.resolve(`Call ${callCount}`);
            });
            
            workflow
                .registerAgent(testAgent1)
                .registerAgent(failHandlerAgent)
                .iterate(["a", "b", "c"], testAgent1)
                .onFail(failHandlerAgent);
            
            const result = await workflow.run();
            
            expect(failHandlerAgent.execute).toHaveBeenCalledWith(errorMessage);
            expect(result.finalOutput).toBe("Failure handled");
        });
    });

    describe('Edge Cases', () => {
        test("should handle empty execution plan", async () => {
            const result = await workflow.run();
            
            expect(result.finalOutput).toBeUndefined();
            expect(result.sharedStore).toEqual({});
        });

        test("should handle workflow with only prompt steps", async () => {
            workflow
                .prompt("First")
                .prompt("Second")
                .prompt("Third");
            
            const result = await workflow.run();
            
            // No execution steps, so finalOutput is undefined
            expect(result.finalOutput).toBeUndefined();
        });

        test("should handle undefined prompt as initial input", async () => {
            workflow
                .registerAgent(testAgent1)
                .sequence([testAgent1]);
            
            const result = await workflow.run();
            
            expect(testAgent1.execute).toHaveBeenCalledWith("");
        });
    });
});