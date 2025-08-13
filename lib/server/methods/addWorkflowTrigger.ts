import type { AgentForceServer } from "../../server";
import type { Context } from "hono";
import { validateHttpMethod, normalizePath } from "../shared/handlers";

/**
 * Adds a workflow trigger that executes a workflow file when the route is called (chainable method)
 * 
 * @param this - The AgentForceServer instance (bound context)
 * @param method - HTTP method (typically "GET")
 * @param path - The route path (e.g., "/trigger-workflow")
 * @param workflowFilePath - Path to the workflow TypeScript file to execute
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function addWorkflowTrigger(
    this: AgentForceServer,
    method: string,
    path: string,
    workflowFilePath: string,
): AgentForceServer {
    // Validate inputs
    const normalizedMethod = validateHttpMethod(method);
    const normalizedPath = normalizePath(path);

    if (!workflowFilePath || typeof workflowFilePath !== "string") {
        throw new Error("Workflow file path must be a non-empty string");
    }

    const log = this.getLogger();
    const serverName = this.getName();

    log.info({
        serverName,
        method: normalizedMethod,
        path: normalizedPath,
        workflowFilePath,
        action: "workflow_trigger_adding",
    }, `Adding workflow trigger: ${normalizedMethod} ${normalizedPath}`);

    // Create workflow trigger handler
    const workflowHandler = createWorkflowTriggerHandler(workflowFilePath, normalizedMethod, normalizedPath);

    // Add as static route
    this.addToStaticRoutes({
        method: normalizedMethod,
        path: normalizedPath,
        responseData: workflowHandler,
    });

    log.info({
        serverName,
        method: normalizedMethod,
        path: normalizedPath,
        action: "workflow_trigger_added",
    }, `Workflow trigger added: ${normalizedMethod} ${normalizedPath}`);

    return this;
}

/**
 * Creates a handler for executing workflow files
 * @param workflowFilePath - Path to the workflow file to execute
 * @param method - HTTP method for logging purposes
 * @param path - Route path for logging purposes
 * @returns Hono route handler function
 */
export function createWorkflowTriggerHandler(
    workflowFilePath: string,
    method: string,
    path: string,
): (c: Context) => Promise<Response> {
    return async (c: Context): Promise<Response> => {
        try {
            console.log(`🔄 Executing workflow: ${workflowFilePath}`);
            
            // Resolve the absolute path to the workflow file
            const { resolve } = await import("node:path");
            const absolutePath = resolve(workflowFilePath);
            
            console.log(`📁 Resolved workflow path: ${absolutePath}`);
            
            // Execute the workflow file
            // Note: This will execute the workflow file which should contain the workflow logic
            // The workflow file is expected to export or execute a workflow
            
            let workflowResult: any;
            
            if (typeof globalThis.Bun !== "undefined") {
                // Bun runtime - execute the file using Bun subprocess to avoid dynamic import issues
                try {
                    const proc = Bun.spawn(["bun", "run", absolutePath], {
                        stdout: "pipe",
                        stderr: "pipe",
                    });
                    
                    const output = await new Response(proc.stdout).text();
                    const error = await new Response(proc.stderr).text();
                    
                    if (proc.exitCode !== 0) {
                        console.error(`❌ Workflow execution failed: ${error}`);
                        return c.json({
                            success: false,
                            error: "Workflow execution failed",
                            message: error,
                            method,
                            path,
                            workflowPath: absolutePath,
                        }, 500);
                    }
                    
                    // Try to parse output as JSON, fallback to string
                    try {
                        workflowResult = JSON.parse(output);
                    } catch {
                        workflowResult = { output, executedAt: new Date().toISOString() };
                    }
                } catch (bunError) {
                    console.error(`❌ Error executing workflow with Bun: ${bunError}`);
                    const errorMessage = bunError instanceof Error ? bunError.message : "Unknown error";
                    return c.json({
                        success: false,
                        error: "Workflow execution failed",
                        message: errorMessage,
                        method,
                        path,
                        workflowPath: absolutePath,
                    }, 500);
                }
            } else {
                // Node.js runtime - use child_process
                const { exec } = await import("node:child_process");
                const { promisify } = await import("node:util");
                const execAsync = promisify(exec);
                
                try {
                    const { stdout, stderr } = await execAsync(`node ${absolutePath}`);
                    
                    if (stderr && stderr.trim() !== "") {
                        console.warn(`⚠️ Workflow stderr: ${stderr}`);
                    }
                    
                    workflowResult = { 
                        output: stdout,
                        executedAt: new Date().toISOString(),
                        stderr: stderr || null,
                    };
                } catch (execError: any) {
                    console.error(`❌ Error executing workflow with Node: ${execError.message}`);
                    return c.json({
                        success: false,
                        error: "Workflow execution failed",
                        message: execError.message,
                        method,
                        path,
                        workflowPath: absolutePath,
                    }, 500);
                }
            }
            
            console.log("✅ Workflow executed successfully");
            
            // Return success response
            return c.json({
                success: true,
                message: "Workflow triggered successfully.",
                workflowPath: workflowFilePath,
                executedAt: new Date().toISOString(),
                result: workflowResult,
            });
            
        } catch (error) {
            console.error(`❌ Error executing workflow ${workflowFilePath}:`, error);
            
            return c.json({
                success: false,
                message: "Workflow execution failed.",
                workflowPath: workflowFilePath,
                error: error instanceof Error ? error.message : "Unknown error occurred",
                executedAt: new Date().toISOString(),
            }, 500);
        }
    };
}