import Handlebars from "handlebars";

/**
 * Handlebars template utilities for AgentForce ADK
 */

/**
 * Renders a Handlebars template with the provided data
 * @param templateContent - The Handlebars template content as a string
 * @param templateData - Optional data to pass to the template
 * @returns Rendered HTML content
 */
export function renderTemplate(templateContent: string, templateData?: Record<string, any>): string {
    const template = Handlebars.compile(templateContent);
    return template(templateData || {});
}

/**
 * Checks if a file path is a Handlebars template file
 * @param filePath - Path to check
 * @returns True if the file is a Handlebars template (.hbs extension)
 */
export function isHandlebarsTemplate(filePath: string): boolean {
    return filePath.endsWith(".hbs");
}

/**
 * Reads and renders a Handlebars template file
 * @param filePath - Path to the template file
 * @param templateData - Optional data to pass to the template
 * @returns Rendered HTML content
 */
export async function renderTemplateFile(filePath: string, templateData?: Record<string, any>): Promise<string> {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    
    const fullPath = resolve(filePath);
    const fileContent = readFileSync(fullPath, "utf-8");
    
    if (isHandlebarsTemplate(filePath)) {
        return renderTemplate(fileContent, templateData);
    } else {
        // Return as static HTML if not a Handlebars template
        return fileContent;
    }
}