import { AgentForceServer,  type ServerConfig } from "../../lib/server"; //"@agentforce/adk";

const serverConfig: ServerConfig = {
    name: "BaseServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    .serve("0.0.0.0", 3000);
