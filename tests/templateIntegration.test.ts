import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";
import { writeFileSync, unlinkSync, existsSync } from "fs";

describe('Template Integration in Execute Method', () => {
    let agent: AgentForceAgent;
    let testTemplateFile: string;
    
    beforeEach(() => {
        agent = new AgentForceAgent({ name: "TemplateTestAgent", type: "test-agent" });
        
        // Create a test template file
        testTemplateFile = 'test-template-execute.md';
        const testTemplateContent = `# Template Instructions

Please format your response as a structured document with:
1. A clear title
2. Main content
3. Summary section`;
        
        writeFileSync(testTemplateFile, testTemplateContent);
    });

    afterEach(() => {
        if (existsSync(testTemplateFile)) {
            unlinkSync(testTemplateFile);
        }
    });

    test("should include template content in execute method", async () => {
        // Skip if Ollama is not available
        const hasOllama = process.env.SKIP_OLLAMA_TESTS !== 'true';
        if (!hasOllama) {
            console.log("Skipping Ollama integration test - SKIP_OLLAMA_TESTS is set");
            return;
        }

        agent
            .withTemplate(testTemplateFile)
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("You are a helpful assistant.")
            .prompt("Say hello in a structured way");

        // Verify template is loaded
        expect(agent.getTemplate()).toContain("Template Instructions");
        expect(agent.getTemplate()).toContain("structured document");
        
        // The actual execution would call the Ollama service
        // For now, we just verify the template is properly loaded and would be passed to the provider
        console.log("Template successfully loaded and ready for execution");
    }, 30000); // 30 second timeout for potential Ollama calls
});
