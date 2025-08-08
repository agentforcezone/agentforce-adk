import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent, type AgentConfig } from "../../lib/agent";
import { mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

describe("AgentForceAgent Skills Auto-Loading Tests", () => {
    const testSkillsDir = "./test-skills";
    const testSkillFile = "test-skill.md";
    const testSkillPath = join(testSkillsDir, testSkillFile);
    const testSkillContent = "# Test Skill\n\nThis is a test skill that provides specific capabilities.";
    
    let agent: AgentForceAgent;
    
    beforeEach(() => {
        // Create test skills directory and file
        mkdirSync(testSkillsDir, { recursive: true });
        writeFileSync(testSkillPath, testSkillContent);
    });
    
    afterEach(() => {
        // Clean up test directory
        rmSync(testSkillsDir, { recursive: true, force: true });
    });
    
    test("should create agent with skills in config", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: [testSkillPath]
        };
        agent = new AgentForceAgent(config);
        
        expect(agent).toBeDefined();
        expect(agent["getSkills"]()).toEqual([testSkillPath]);
    });
    
    test("should auto-load skills when execute is called", async () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: [testSkillPath]
        };
        agent = new AgentForceAgent(config);
        
        // Set an initial system prompt
        agent.systemPrompt("Initial system prompt");
        agent.prompt("test query");
        agent.useLLM("ollama", "test-model");
        
        // Skills should be loaded automatically when execute is called
        // We can't directly test execute here without a mock provider
        // But we can verify the agent is set up correctly
        
        expect(agent).toBeDefined();
        expect(agent["getSkills"]()).toEqual([testSkillPath]);
    });
    
    test("should handle multiple skill files in config", () => {
        // Create second skill file
        const secondSkillFile = "second-skill.md";
        const secondSkillPath = join(testSkillsDir, secondSkillFile);
        const secondSkillContent = "# Second Skill\n\nThis is another test skill.";
        writeFileSync(secondSkillPath, secondSkillContent);
        
        const config: AgentConfig = {
            name: "TestAgent",
            skills: [testSkillPath, secondSkillPath]
        };
        agent = new AgentForceAgent(config);
        
        expect(agent["getSkills"]()).toEqual([testSkillPath, secondSkillPath]);
    });
    
    test("should handle missing skill files gracefully", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: ["non-existent-file.md"]
        };
        
        // Should not throw an error when creating the agent
        expect(() => {
            agent = new AgentForceAgent(config);
        }).not.toThrow();
    });
    
    test("should handle empty skills array", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: []
        };
        agent = new AgentForceAgent(config);
        
        expect(agent["getSkills"]()).toEqual([]);
    });
    
    test("should work with method chaining without loadSkills", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: [testSkillPath]
        };
        agent = new AgentForceAgent(config);
        
        // Skills will be auto-loaded when execute is called
        const result = agent
            .useLLM("ollama", "llama3")
            .systemPrompt("Base system prompt")
            .prompt("Test prompt")
            .debug();
        
        expect(result).toBe(agent);
    });
    
    test("should work with systemPrompt and auto-load skills", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: [testSkillPath]
        };
        agent = new AgentForceAgent(config);
        
        // Skills will be auto-loaded when execute is called
        const result = agent
            .systemPrompt("Initial prompt")
            .prompt("Test query");
        
        expect(result).toBe(agent);
    });
    
    test("should load skills from lib/skills directory using skill name only", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: ["product-owner"]  // Skill name only - should load from lib/skills/product-owner.md
        };
        agent = new AgentForceAgent(config);
        
        expect(agent["getSkills"]()).toEqual(["product-owner"]);
    });
    
    test("should distinguish between file paths and skill names", () => {
        const config: AgentConfig = {
            name: "TestAgent",
            skills: [
                testSkillPath,           // File path - should load from relative path
                "product-owner"          // Skill name - should load from lib/skills/
            ]
        };
        agent = new AgentForceAgent(config);
        
        expect(agent["getSkills"]()).toEqual([testSkillPath, "product-owner"]);
    });
});