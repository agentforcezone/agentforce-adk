import { describe, expect, test, beforeEach, spyOn } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe("AgentForceWorkflow loop Method Tests", () => {
    let workflow: AgentForceWorkflow;
    let testAgent: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow",
        });
        
        testAgent = new AgentForceAgent({
            name: "TestAgent",
        });
    });

    test("should not return workflow instance (void method)", () => {
        // Mock setTimeout to prevent infinite loop
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        // Mock the run method to prevent actual execution
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        
        const result = workflow.loop();
        expect(result).toBeUndefined();
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
    });

    test("should start loop with default delay of 0ms", () => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        const loggerSpy = spyOn(workflow.getLogger(), "info");
        
        workflow.loop();
        
        expect(loggerSpy).toHaveBeenCalledWith("Starting workflow loop with delay: 0ms");
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
        loggerSpy.mockRestore();
    });

    test("should start loop with custom delay", () => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        const loggerSpy = spyOn(workflow.getLogger(), "info");
        
        workflow.loop(5000);
        
        expect(loggerSpy).toHaveBeenCalledWith("Starting workflow loop with delay: 5000ms");
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
        loggerSpy.mockRestore();
    });

    test("should call run method during loop execution", () => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        
        workflow.loop(100);
        
        // The runLoop function is called immediately, so run should be called
        expect(runSpy).toHaveBeenCalled();
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
    });

    test("should use correct delay parameter in setTimeout call", (done) => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation((callback, delay) => {
            expect(delay).toBe(1500);
            // Cleanup
            setTimeoutSpy.mockRestore();
            runSpy.mockRestore();
            done();
            return 1 as unknown as NodeJS.Timeout;
        });
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        
        workflow.loop(1500);
    });

    test("should handle errors during workflow run", (done) => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const testError = new Error("Test workflow error");
        const runSpy = spyOn(workflow, "run").mockRejectedValue(testError);
        const loggerErrorSpy = spyOn(workflow.getLogger(), "error").mockImplementation((logData) => {
            expect(logData).toEqual({
                message: "Workflow loop iteration failed.",
                error: "Test workflow error",
            });
            // Cleanup
            setTimeoutSpy.mockRestore();
            runSpy.mockRestore();
            loggerErrorSpy.mockRestore();
            done();
        });
        
        workflow.loop(100);
    });

    test("should continue scheduling after error", (done) => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation((callback, delay) => {
            // If setTimeout is called, the loop is continuing after error
            expect(delay).toBe(10);
            // Cleanup
            setTimeoutSpy.mockRestore();
            runSpy.mockRestore();
            done();
            return 1 as unknown as NodeJS.Timeout;
        });
        
        const testError = new Error("Test error");
        const runSpy = spyOn(workflow, "run").mockRejectedValue(testError);
        
        workflow.loop(10);
    });

    test("should work with registered agents", () => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        const loggerSpy = spyOn(workflow.getLogger(), "info");
        
        workflow
            .registerAgent(testAgent)
            .prompt("Test workflow with agent")
            .loop(2000);
        
        expect(loggerSpy).toHaveBeenCalledWith("Starting workflow loop with delay: 2000ms");
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
        loggerSpy.mockRestore();
    });

    test("should work with sequence configuration", () => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        const loggerSpy = spyOn(workflow.getLogger(), "info");
        
        workflow
            .registerAgent(testAgent)
            .sequence([testAgent])
            .loop(500);
        
        expect(loggerSpy).toHaveBeenCalledWith("Starting workflow loop with delay: 500ms");
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
        loggerSpy.mockRestore();
    });

    test("should handle zero delay correctly", (done) => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation((callback, delay) => {
            expect(delay).toBe(0);
            // Cleanup
            setTimeoutSpy.mockRestore();
            runSpy.mockRestore();
            done();
            return 1 as unknown as NodeJS.Timeout;
        });
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        
        workflow.loop(0);
    });

    test("should handle negative delay by logging it correctly", () => {
        const setTimeoutSpy = spyOn(global, "setTimeout").mockImplementation(() => 1 as unknown as NodeJS.Timeout);
        const runSpy = spyOn(workflow, "run").mockResolvedValue();
        const loggerSpy = spyOn(workflow.getLogger(), "info");
        
        workflow.loop(-100);
        
        expect(loggerSpy).toHaveBeenCalledWith("Starting workflow loop with delay: -100ms");
        
        // Cleanup
        setTimeoutSpy.mockRestore();
        runSpy.mockRestore();
        loggerSpy.mockRestore();
    });
});