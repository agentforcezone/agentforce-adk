import type { AgentForceAgent } from "../../agent";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

/**
 * Sets the system prompt for the agent
 * @param this - The AgentForceAgent instance (bound context)
 * @param prompt - The system prompt to set for the agent, or a file path to read the prompt from (.md, .txt, .hbs files supported)
 * @returns {AgentForceAgent} Returns the agent instance for method chaining
 */
export function systemPrompt(this: AgentForceAgent, prompt: string): AgentForceAgent {
    // Validate input
    if (typeof prompt !== "string") {
        throw new Error("System prompt must be a string");
    }
    
    let finalPrompt = prompt;
    
    // Check if the prompt looks like a file path (contains file extensions .md, .txt, or .hbs)
    const isLikelyFilePath = /\.(md|txt|hbs)$/i.test(prompt);
    
    if (isLikelyFilePath) {
        try {
            // Try to resolve the path from current working directory
            const absolutePath = resolve(process.cwd(), prompt);
            
            // Check if file exists
            if (existsSync(absolutePath)) {
                // Read the file content directly
                finalPrompt = readFileSync(absolutePath, "utf-8");
            } else {
                // If file doesn't exist, treat as regular prompt but log a warning
                console.warn(`Warning: File '${prompt}' not found, treating as regular prompt text`);
            }
        } catch (error) {
            // If reading fails, treat as regular prompt but log the error
            console.warn(`Warning: Failed to read file '${prompt}': ${error instanceof Error ? error.message : "Unknown error"}. Treating as regular prompt text.`);
        }
    }
    
    // Set the system prompt using the internal setter
    this.setSystemPrompt(finalPrompt);
    
    // Return 'this' for method chaining
    return this;
}
