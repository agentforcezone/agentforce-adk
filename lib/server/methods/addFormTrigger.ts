import type { AgentForceServer } from "../../server";
import type { AgentForceAgent } from "../../agent";
import type { RouteAgentSchema } from "./addRouteAgent";
import { createHtmlFileHandler, createFormPostHandler, normalizePath } from "../shared/handlers";

/**
 * Adds a form trigger that creates both GET and POST routes for form handling (chainable method)
 * - GET route serves the HTML or Handlebars template file
 * - POST route processes form submission with the agent
 * 
 * @param this - The AgentForceServer instance (bound context)
 * @param formName - The name/path for the form routes (e.g., "simple-prompt-input")
 * @param filePath - Path to the HTML or HBS form file to serve
 * @param agent - The AgentForce agent to handle form submissions
 * @param schema - Optional schema configuration for input and output validation
 * @returns {AgentForceServer} The server instance for method chaining
 */
export function addFormTrigger(
    this: AgentForceServer,
    formName: string,
    filePath: string,
    agent: AgentForceAgent,
    schema?: RouteAgentSchema,
): AgentForceServer {
    // Validate inputs
    if (!formName || typeof formName !== "string") {
        throw new Error("Form name must be a non-empty string");
    }

    if (!filePath || typeof filePath !== "string") {
        throw new Error("File path must be a non-empty string");
    }

    if (!agent) {
        throw new Error("Agent instance is required");
    }

    // Normalize the path
    const normalizedPath = normalizePath(formName);

    const log = this.getLogger();
    const serverName = this.getName();

    log.info({
        serverName,
        formName,
        path: normalizedPath,
        filePath,
        agentName: agent.getName(),
        schema,
        action: "form_trigger_adding",
    }, `Adding form trigger: ${normalizedPath}`);

    // Prepare template data for Handlebars templates
    const templateData = {
        action: normalizedPath,
        title: `Form: ${formName}`,
        submitText: "Submit",
    };

    // We need to store handlers directly as they return Response objects
    // not data to be wrapped in JSON
    
    // Store the GET route for serving HTML/HBS
    this.addToStaticRoutes({
        method: "GET",
        path: normalizedPath,
        responseData: createHtmlFileHandler(filePath, templateData),
    });

    // Store the POST route for form submission with schema support
    this.addToStaticRoutes({
        method: "POST",
        path: normalizedPath,
        responseData: createFormPostHandler(agent, normalizedPath, schema),
    });

    log.info({
        serverName,
        formName,
        path: normalizedPath,
        action: "form_trigger_added",
    }, `Form trigger added: GET/POST ${normalizedPath}`);

    return this;
}