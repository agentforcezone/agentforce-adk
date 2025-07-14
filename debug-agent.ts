#!/usr/bin/env bun
/**
 * Debug script to test agent routePrompt functionality
 */

import AgentForceAgent, { type AgentConfig } from "@lib/agent";

const agentConfig: AgentConfig = {
    name: "DebugAgent",
    type: "debug-agent",
    logger: "json"
};

console.log('🔍 Creating agent...');

const agent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("Debug agent")
    .routePrompt();

console.log('✅ Agent created');
console.log('🔍 Agent routePrompt enabled:', agent.getUseRoutePrompt());
console.log('🔍 Agent name:', agent.getName());
console.log('🔍 Agent type:', agent.getType());

// Test methods availability
console.log('🔍 Methods availability:');
console.log('  - getName:', typeof agent.getName);
console.log('  - getType:', typeof agent.getType);
console.log('  - getUseRoutePrompt:', typeof agent.getUseRoutePrompt);
console.log('  - prompt:', typeof agent.prompt);
console.log('  - run:', typeof agent.run);
console.log('  - output:', typeof agent.output);

// Test the route configuration process
console.log('\n🔍 Testing route configuration...');
const routeAgent = {
    method: 'POST',
    path: '/test',
    agent: agent
};

console.log('🔍 Route agent object:', {
    method: routeAgent.method,
    path: routeAgent.path,
    agentConstructor: routeAgent.agent.constructor.name,
    agentMethods: Object.getOwnPropertyNames(routeAgent.agent)
});

// Test the stored agent
const storedAgent = routeAgent.agent;
console.log('🔍 Stored agent routePrompt enabled:', storedAgent.getUseRoutePrompt());

console.log('✅ Debug completed successfully!');
