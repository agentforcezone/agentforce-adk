import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { AgentForceAgent } from "../lib/agent";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { resolve } from "path";

describe('AgentForceAgent withTemplate Method Tests', () => {
    let agent: AgentForceAgent;
    let testTemplateFile: string;
    let testTemplateContent: string;
    let testHandlebarsFile: string;
    let testHandlebarsContent: string;
    
    beforeEach(() => {
        agent = new AgentForceAgent({ name: "TestAgent", type: "test-agent" });
        
        // Create a test template file
        testTemplateFile = resolve('test-template.md');
        testTemplateContent = `# Test Template

This is a test template for the withTemplate method.

## Instructions
- Follow these test instructions
- Use the template content`;
        
        writeFileSync(testTemplateFile, testTemplateContent);

        // Create a test Handlebars template file
        testHandlebarsFile = resolve('test-template.hbs');
        testHandlebarsContent = `# {{title}}

**As a** {{persona}}
**I want** {{description}}
**So that** {{outcome}}.

## Details
- Project: {{project}}
- Priority: {{priority}}`;
        
        writeFileSync(testHandlebarsFile, testHandlebarsContent);
    });

    // Clean up after each test
    afterEach(() => {
        if (existsSync(testTemplateFile)) {
            unlinkSync(testTemplateFile);
        }
        if (existsSync(testHandlebarsFile)) {
            unlinkSync(testHandlebarsFile);
        }
    });

    test("should return agent instance for method chaining", () => {
        const result = agent.withTemplate(testTemplateFile);
        expect(result).toBe(agent);
    });

    test("should load template file content correctly", () => {
        agent.withTemplate(testTemplateFile);
        expect(agent.getTemplate()).toBe(testTemplateContent);
    });

    test("should work with method chaining", () => {
        const result = agent
            .withTemplate(testTemplateFile)
            .useLLM("ollama", "gemma3:4b")
            .systemPrompt("Test system prompt")
            .debug();
        
        expect(result).toBe(agent);
        expect(agent.getTemplate()).toBe(testTemplateContent);
    });

    test("should throw error for non-string template path", () => {
        expect(() => {
            // @ts-expect-error Testing invalid input type
            agent.withTemplate(123);
        }).toThrow("Template path must be a string");
    });

    test("should throw error for empty template path", () => {
        expect(() => {
            agent.withTemplate("");
        }).toThrow("Template path cannot be empty");
        
        expect(() => {
            agent.withTemplate("   ");
        }).toThrow("Template path cannot be empty");
    });

    test("should throw error for non-existent template file", () => {
        expect(() => {
            agent.withTemplate("non-existent-template.md");
        }).toThrow(/Failed to load template from "non-existent-template.md"/);
    });

    test("should handle relative paths correctly", () => {
        // Create template in current directory for relative path test
        const relativeTemplateFile = "./relative-test-template.md";
        writeFileSync(relativeTemplateFile, "Relative template content");
        
        try {
            agent.withTemplate(relativeTemplateFile);
            expect(agent.getTemplate()).toBe("Relative template content");
        } finally {
            if (existsSync(relativeTemplateFile)) {
                unlinkSync(relativeTemplateFile);
            }
        }
    });

    test("should preserve template content with special characters", () => {
        const specialContent = `# Template with Special Characters

## Code Example
\`\`\`typescript
const example = "Hello World!";
console.log(example);
\`\`\`

### Characters: @#$%^&*()_+-={}[]|\\:";'<>?,./

Unicode: 🚀 🌟 ✨`;
        
        writeFileSync(testTemplateFile, specialContent);
        
        agent.withTemplate(testTemplateFile);
        expect(agent.getTemplate()).toBe(specialContent);
    });

    test("should clear previous template when loading new one", () => {
        // Load first template
        agent.withTemplate(testTemplateFile);
        expect(agent.getTemplate()).toBe(testTemplateContent);
        
        // Create and load second template
        const secondTemplateFile = resolve('test-template-2.md');
        const secondTemplateContent = "Second template content";
        writeFileSync(secondTemplateFile, secondTemplateContent);
        
        try {
            agent.withTemplate(secondTemplateFile);
            expect(agent.getTemplate()).toBe(secondTemplateContent);
        } finally {
            if (existsSync(secondTemplateFile)) {
                unlinkSync(secondTemplateFile);
            }
        }
    });

    test("should load Handlebars template file content correctly", () => {
        agent.withTemplate(testHandlebarsFile);
        expect(agent.getTemplate()).toBe(testHandlebarsContent);
    });

    test("should render Handlebars template with provided data", () => {
        const data = {
            title: "Test Title",
            persona: "developer",
            description: "test description",
            outcome: "successful test",
            project: "test project",
            priority: "high"
        };

        agent.withTemplate(testHandlebarsFile, data);
        const expectedContent = `# Test Title

**As a** developer
**I want** test description
**So that** successful test.

## Details
- Project: test project
- Priority: high`;

        expect(agent.getTemplate()).toBe(expectedContent);
    });

    describe('Handlebars Template Support', () => {
        test("should render Handlebars template with data", () => {
            const templateData = {
                title: "AWS Account Setup",
                persona: "DevOps Engineer",
                description: "initialize the AWS account",
                outcome: "development teams can deploy applications",
                project: "AgentForce ADK",
                priority: "High"
            };

            agent.withTemplate(testHandlebarsFile, templateData);
            
            const expectedContent = `# AWS Account Setup

**As a** DevOps Engineer
**I want** initialize the AWS account
**So that** development teams can deploy applications.

## Details
- Project: AgentForce ADK
- Priority: High`;

            expect(agent.getTemplate()).toBe(expectedContent);
        });

        test("should return agent instance for method chaining with Handlebars", () => {
            const templateData = {
                title: "Test Story",
                persona: "Developer"
            };

            const result = agent.withTemplate(testHandlebarsFile, templateData);
            expect(result).toBe(agent);
        });

        test("should work with method chaining for Handlebars templates", () => {
            const templateData = {
                title: "Test Story",
                persona: "Developer",
                description: "implement feature",
                outcome: "users can benefit"
            };

            const result = agent
                .withTemplate(testHandlebarsFile, templateData)
                .useLLM("ollama", "gemma3:4b")
                .systemPrompt("Test system prompt")
                .debug();
            
            expect(result).toBe(agent);
            expect(agent.getTemplate()).toContain("# Test Story");
            expect(agent.getTemplate()).toContain("**As a** Developer");
        });

        test("should handle Handlebars template without data", () => {
            // When no data is provided, Handlebars placeholders should remain
            agent.withTemplate(testHandlebarsFile);
            
            expect(agent.getTemplate()).toContain("{{title}}");
            expect(agent.getTemplate()).toContain("{{persona}}");
        });

        test("should handle non-Handlebars templates with templateData parameter", () => {
            // Regular .md templates should ignore templateData and load normally
            const templateData = {
                title: "This should be ignored",
                persona: "Should not appear"
            };

            agent.withTemplate(testTemplateFile, templateData);
            expect(agent.getTemplate()).toBe(testTemplateContent);
        });

        test("should handle empty templateData object", () => {
            agent.withTemplate(testHandlebarsFile, {});
            
            // Empty placeholders should render as empty strings
            expect(agent.getTemplate()).toContain("# ");
            expect(agent.getTemplate()).toContain("**As a** ");
        });

        test("should handle partial templateData", () => {
            const partialData = {
                title: "Partial Story",
                persona: "Developer"
                // Missing other fields
            };

            agent.withTemplate(testHandlebarsFile, partialData);
            
            expect(agent.getTemplate()).toContain("# Partial Story");
            expect(agent.getTemplate()).toContain("**As a** Developer");
            // Missing fields should render as empty
            expect(agent.getTemplate()).toContain("**I want** ");
        });
    });
});
