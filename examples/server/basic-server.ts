import AgentForceServer, { type ServerConfig } from "@lib/server";

const serverConfig: ServerConfig = {
    name: "BaseServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    .serve("localhost", 3000);
