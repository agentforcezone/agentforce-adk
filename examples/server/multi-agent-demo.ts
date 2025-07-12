#!/usr/bin/env bun
/**
 * Demo script showing how to use addRouteAgent functionality
 * This script demonstrates setting up different agents for different routes
 */

import AgentForceServer, { type ServerConfig } from "@lib/server";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";

console.log("🚀 AgentForce SDK - Route Agent Demo");
console.log("=====================================\n");

// Create different agents for different purposes
const storyAgentConfig: AgentConfig = {
    name: "StoryAgent",
    type: "creative-writer-agent"
};

const imageAgentConfig: AgentConfig = {
    name: "ImageAgent", 
    type: "visual-description-agent"
};

const analysisAgentConfig: AgentConfig = {
    name: "AnalysisAgent",
    type: "data-analysis-agent"
};

// Configure the agents
const StoryAgent = new AgentForceAgent(storyAgentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a creative writing agent. Create engaging stories and narratives based on user prompts. Always respond in a storytelling format.");

const ImageAgent = new AgentForceAgent(imageAgentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a visual description agent. Create detailed visual descriptions and image concepts based on user prompts.");

const AnalysisAgent = new AgentForceAgent(analysisAgentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a data analysis agent. Analyze requirements, create technical specifications, and provide structured insights.");

// Create server configuration
const serverConfig: ServerConfig = {
    name: "MultiAgentServer",
    logger: "json",
};

console.log("📝 Creating server with multiple route agents...");

// Create server and add different agents to different routes
const server = new AgentForceServer(serverConfig)
    .addRouteAgent("POST", "/story", StoryAgent)
    .addRouteAgent("POST", "/image", ImageAgent)
    .addRouteAgent("POST", "/analysis", AnalysisAgent)
    .addRouteAgent("GET", "/story", StoryAgent)     // GET version for simple queries
    .addRouteAgent("GET", "/image", ImageAgent)     // GET version for simple queries
    .addRouteAgent("GET", "/analysis", AnalysisAgent); // GET version for simple queries

console.log("✅ Route agents configured:");
console.log("   POST /story     -> StoryAgent");
console.log("   POST /image     -> ImageAgent");  
console.log("   POST /analysis  -> AnalysisAgent");
console.log("   GET  /story     -> StoryAgent");
console.log("   GET  /image     -> ImageAgent");
console.log("   GET  /analysis  -> AnalysisAgent");
console.log("\n🌐 Starting server on localhost:3001...");

// Start the server
server.serve("localhost", 3001);

console.log("\n📚 Example usage:");
console.log("\n1. Create a story (POST):");
console.log('   curl -X POST http://localhost:3001/story \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"prompt": "create a story about a brave robot"}\'');

console.log("\n2. Generate image description (POST):");
console.log('   curl -X POST http://localhost:3001/image \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"prompt": "describe a futuristic city dashboard"}\'');

console.log("\n3. Analyze requirements (POST):");
console.log('   curl -X POST http://localhost:3001/analysis \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"prompt": "analyze the requirements for a user authentication system"}\'');

console.log("\n4. Simple story query (GET):");
console.log('   curl "http://localhost:3001/story?prompt=tell%20me%20a%20short%20tale"');

console.log("\n5. Check server status:");
console.log('   curl http://localhost:3001/');
console.log('   curl http://localhost:3001/health');

console.log("\n🎯 Each route is handled by a specialized agent optimized for that specific task!");
