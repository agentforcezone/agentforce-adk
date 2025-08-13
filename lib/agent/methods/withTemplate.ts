import type { AgentForceAgent } from "../../agent";
import { readFileSync } from "fs";
import { resolve } from "path";
import Handlebars from "handlebars";

/**
 * Loads a template file and sets it as the agent's template.
 * Supports both regular templates and Handlebars (.hbs) templates with data injection.
 * @param this - The AgentForceAgent instance (bound context)
 * @param templatePath - The path to the template file to load
 * @param templateData - Optional data for Handlebars template rendering
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function withTemplate(this: AgentForceAgent, templatePath: string, templateData?: Record<string, unknown>): AgentForceAgent {
    // Validate input
    if (typeof templatePath !== "string") {
        throw new Error("Template path must be a string");
    }
    
    if (!templatePath.trim()) {
        throw new Error("Template path cannot be empty");
    }
    
    try {
        // Resolve the template path relative to the current working directory
        const resolvedPath = resolve(templatePath);
        
        // Read the template file content
        const templateContent = readFileSync(resolvedPath, "utf-8");
        
        // Check if this is a Handlebars template (.hbs extension)
        const isHandlebarsTemplate = templatePath.toLowerCase().endsWith(".hbs");
        
        let finalTemplateContent = templateContent;
        
        if (isHandlebarsTemplate && templateData) {
            // Compile and render the Handlebars template with the provided data
            const handlebarsTemplate = Handlebars.compile(templateContent);
            finalTemplateContent = handlebarsTemplate(templateData);
        }
        
        // Set the template content (rendered if Handlebars, original if not)
        this.setTemplate(finalTemplateContent);
        
        // Return 'this' for method chaining
        return this;

    } catch (error) {
        const logger = this.getLogger();
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to load template from "${templatePath}": ${errorMessage}`);
        
        // Set empty template and continue - allows chain to proceed
        this.setTemplate("");
        return this;
    }
}
