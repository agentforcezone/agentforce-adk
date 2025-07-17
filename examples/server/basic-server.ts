import { AgentForceServer,  type ServerConfig } from "../../lib/server"; //"@agentforce/adk";

const serverConfig: ServerConfig = {
    name: "BaseServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    .addRoute("GET", "/health", {"status": "ok"})
    .addRoute("GET", "/version", {"version": "0.5.0"})
    .serve("0.0.0.0", 3000);
