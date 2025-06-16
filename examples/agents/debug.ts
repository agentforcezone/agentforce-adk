import AiAgent, { type AgentConfig } from "@agentforce-sdk/agent";

const agentConfig: AgentConfig = {
    name: "DebugAgent",
    type: "development-agent"
};

const agent = new AiAgent(agentConfig);
const debugInfo = agent.debug();
console.log("Debug Information:", debugInfo);