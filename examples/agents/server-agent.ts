import { AgentForceAgent, type AgentConfig } from "../../lib/agent"; //"@agentforce/adk";

const agentConfig: AgentConfig = {
    name: "ServerTestAgent"
};

new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .debug()
    .serve("0.0.0.0", 3000);

    // Create an agent and start a web server
    // Browser: http://localhost:3000/?prompt=Tell%20me%20a%20joke
    // Curl: curl -X GET "http://localhost:3000" -G --data-urlencode "prompt=Tell me a joke"
    // use `af deploy agent` to deploy this agent to the cloud (comming soon)