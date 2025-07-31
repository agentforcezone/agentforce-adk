import { describe, expect, test, beforeEach } from "bun:test";
import { AgentForceWorkflow } from "../../lib/workflow";
import { AgentForceAgent } from "../../lib/agent";

describe('AgentForceWorkflow debug Method Tests', () => {
    let workflow: AgentForceWorkflow;
    let testAgent: AgentForceAgent;

    beforeEach(() => {
        workflow = new AgentForceWorkflow({
            name: "TestWorkflow"
        });
        
        testAgent = new AgentForceAgent({
            name: "TestAgent"
        });
    });

    test("should return workflow instance for method chaining", () => {
        const result = workflow.debug();
        expect(result).toBe(workflow);
        expect(result).toBeInstanceOf(AgentForceWorkflow);
    });

    test("should work with method chaining", () => {
        const result = workflow.prompt("Test prompt").debug().registerAgent(testAgent);
        expect(result).toBe(workflow);
    });

    test("should debug empty workflow", () => {
        expect(() => workflow.debug()).not.toThrow();
    });

    test("should debug workflow with registered agent", () => {
        const result = workflow
            .registerAgent(testAgent)
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should debug workflow with prompt", () => {
        const result = workflow
            .prompt("Test workflow prompt")
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should debug workflow with multiple agents", () => {
        const agent2 = new AgentForceAgent({ name: "TestAgent2" });
        
        const result = workflow
            .registerAgent(testAgent)
            .registerAgent(agent2)
            .prompt("Multi-agent test")
            .debug();
        
        expect(result).toBe(workflow);
    });

    test("should be chainable with other workflow methods", () => {
        const result = workflow
            .prompt("Chainable test")
            .registerAgent(testAgent)
            .debug()
            .sequence([testAgent]);
        
        expect(result).toBe(workflow);
    });
});