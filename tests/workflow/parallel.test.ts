import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe('AgentForceWorkflow parallel Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent1: AgentForceAgent;
    let testAgent2: AgentForceAgent;
    let testAgent3: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow"
        });
        
        testAgent1 = new AgentForceAgent({ name: "TestAgent1" });
        testAgent2 = new AgentForceAgent({ name: "TestAgent2" });
        testAgent3 = new AgentForceAgent({ name: "TestAgent3" });
    });

    test("should return workflow instance for method chaining", () => {
        const agents = [testAgent1, testAgent2];
        const result = workflow.parallel(agents);
        expect(result).toBe(workflow);
        expect(result).toBeInstanceOf(AgentForceWorkflow);
    });

    test("should work with method chaining", () => {
        const agents = [testAgent1];
        const result = workflow.parallel(agents).debug();
        expect(result).toBe(workflow);
    });

    test("should handle single agent", () => {
        const agents = [testAgent1];
        const result = workflow.parallel(agents);
        expect(result).toBe(workflow);
    });

    test("should handle multiple agents", () => {
        const agents = [testAgent1, testAgent2, testAgent3];
        const result = workflow.parallel(agents);
        expect(result).toBe(workflow);
    });

    test("should handle empty array", () => {
        const agents: AgentForceAgent[] = [];
        const result = workflow.parallel(agents);
        expect(result).toBe(workflow);
    });

    test("should be chainable with other workflow methods", () => {
        const agents = [testAgent1, testAgent2];
        const result = workflow
            .registerAgent(testAgent1)
            .registerAgent(testAgent2)
            .parallel(agents)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should work with sequential parallel calls", () => {
        const agents1 = [testAgent1];
        const agents2 = [testAgent2, testAgent3];
        
        const result = workflow
            .parallel(agents1)
            .parallel(agents2);
        
        expect(result).toBe(workflow);
    });

    test("should work with mixed workflow operations", () => {
        const parallelAgents = [testAgent1, testAgent2];
        const sequenceAgents = [testAgent1, testAgent2];
        
        const result = workflow
            .registerAgent(testAgent1)
            .registerAgent(testAgent2)
            .parallel(parallelAgents)
            .sequence(sequenceAgents);
        
        expect(result).toBe(workflow);
    });
});