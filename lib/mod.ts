/**
 * AgentForce Agent Development Kit (ADK)
 * 
 * A powerful TypeScript framework for building AI agents and servers with chainable APIs,
 * multiple LLM provider support, and built-in server capabilities.
 * 
 * @example
 * ```ts
 * import { AgentForceAgent } from "@agentforce/adk";
 * 
 * // Create a simple agent
 * const agent = new AgentForceAgent({ name: "MyAgent" })
 *   .systemPrompt("You are a helpful assistant")
 *   .useLLM("ollama", "phi4")
 *   .prompt("Hello world");
 * 
 * const response = await agent.run();
 * console.log(response);
 * ```
 * 
 * @example
 * ```ts
 * import { AgentForceServer } from "@agentforce/adk";
 * 
 * // Create a server with agent routes
 * const server = new AgentForceServer({ name: "MyServer" })
 *   .addRouteAgent("POST", "/chat", agent)
 *   .serve();
 * ```
 * 
 * @module
 */

export * from "./types";

export { AgentForceAgent } from "./agent";
export { AgentForceServer, type RouteAgentSchema } from "./server";
export { AgentForceWorkflow } from "./workflow";

// MCP exports
export * from "./mcp/mod";
