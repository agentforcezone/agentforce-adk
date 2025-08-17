import type { AgentForceAgent } from "../../../agent";
import type { OutputType } from "../../../types";
import { execute } from "./execute";
import { writeFileSync } from "fs";
import { join, extname } from "path";
import { stringifyYaml } from "../../../utils/yaml";
import { formatResponseAsHtml } from "../../../utils/html";

/**
 * Executes the agent and saves the response to a file (execution method)
 * @param this - The AgentForceAgent instance (bound context)
 * @param fileName - The filename to save to (extension determines format: .txt, .json, .md, .yaml, .yml, .html, .htm)
 * @returns {Promise<string>} Returns the file path where content was saved - NOT the agent instance (execution method)
 */
export async function saveToFile(this: AgentForceAgent, fileName: string): Promise<string> {
    // Validate input
    if (!fileName || typeof fileName !== "string") {
        throw new Error("Filename must be a non-empty string");
    }
    
    // Determine output type from file extension
    const fileExtension = extname(fileName).toLowerCase();
    let outputType: OutputType;
    
    switch (fileExtension) {
        case ".txt":
            outputType = "text";
            break;
        case ".json":
            outputType = "json";
            break;
        case ".md":
            outputType = "md";
            break;
        case ".yaml":
        case ".yml":
            outputType = "yaml";
            break;
        case ".html":
        case ".htm":
            outputType = "html";
            break;
        default:
            const logger = this.getLogger();
            logger.error(`Unsupported file extension: ${fileExtension}. Use .txt, .json, .md, .yaml, .yml, .html, or .htm`);
            return `Error: Unsupported file extension: ${fileExtension}`;
    }

    // Execute the provider call to get the response
    let assistantResponse: string;
    try {
        assistantResponse = await execute.call(this);
    } catch (error) {
        // If execution fails, use error message as response
        assistantResponse = error instanceof Error ? error.message : "Unknown error occurred";
    }
    
    // Get agent information using protected methods
    const agentName = this.getName();
    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt();
    const provider = this.getProvider();
    const model = this.getModel();
    
    // Generate content based on the output type using actual chat history
    let content: string;
    
    switch (outputType) {
        case "text":
            content = `=== Agent ${agentName} Output (Text Format) ===\nSystem: ${systemPrompt}\nUser: ${userPrompt}\nResponse: ${assistantResponse}`;
            break;
            
        case "json":
            const jsonOutput = {
                agent: agentName,
                provider: provider,
                model: model,
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                response: assistantResponse,
                timestamp: new Date().toISOString(),
            };
            content = JSON.stringify(jsonOutput, null, 2);
            break;
            
        case "md":
            content = `${assistantResponse}`;
            break;
            
        case "yaml":
            const yamlOutput = {
                agent: agentName,
                provider: provider,
                model: model,
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                response: assistantResponse,
                timestamp: new Date().toISOString(),
            };
            content = stringifyYaml(yamlOutput);
            break;
            
        case "html":
            content = formatResponseAsHtml(assistantResponse);
            break;
            
        /* istanbul ignore next - defensive code for impossible case */
        default:
            const logger = this.getLogger();
            logger.error(`Unsupported output type: ${outputType}`);
            content = `Error: Unsupported output type: ${outputType}`;
    }
    
    // Write content to file synchronously since this is the last operation
    try {
        const fullPath = join(process.cwd(), fileName);
        
        // Use synchronous write to ensure file is completely written before returning
        writeFileSync(fullPath, content, "utf8");
        
        const logger = this.getLogger();
        logger.debug("File written successfully");
        
        return fullPath;

    } catch (error) {
        const logger = this.getLogger();
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`Failed to write file: ${errorMessage}`);
        return `Error: Failed to write file: ${errorMessage}`;
    }
}
