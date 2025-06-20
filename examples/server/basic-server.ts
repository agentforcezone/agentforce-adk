import AgentForceServer, { type ServerConfig } from "@lib/server";

const serverConfig: ServerConfig = {
    name: "BaseServer",
    logger: "json",
};

await new AgentForceServer(serverConfig)
    .serve("localhost", 3000);
