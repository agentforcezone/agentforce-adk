import { describe, expect, test, beforeEach, afterEach, jest } from "@jest/globals";
import { MCPNodeClient } from "../../lib/mcp/client";

class MockTransport {
    closed = false;
    close() { this.closed = true; }
}

class MockClient {
    connected = false;
    connectCalledWith: any;
    async connect(transport: any) { this.connectCalledWith = transport; this.connected = true; }
    async close() { this.connected = false; }

    async listTools() {
        return { tools: [{ name: "tool1", description: "desc", inputSchema: { type: "object", properties: {} } }] };
    }

    async callTool(opts: any) {
        return { result: `called ${opts.name}` };
    }

    async listResources() {
        return { resources: [{ uri: "res:1", name: "r1", description: "d1", mimeType: "text/plain" }] };
    }

    async readResource(opts: any) {
        return { contents: [{ type: "text", text: "hello" }] };
    }

    async listPrompts() {
        return { prompts: [{ name: "p1", description: "pd", arguments: [] }] };
    }

    async getPrompt(opts: any) {
        return { description: "pd", messages: [{ role: "system", content: { text: "hi" } }] };
    }
}

describe("MCPNodeClient happy path", () => {
    let client: MCPNodeClient;
    let mockClient: MockClient;
    let originalConsoleLog: typeof console.log;

    beforeEach(() => {
        // Mock console.log to suppress MCP connection messages in tests
        originalConsoleLog = console.log;
        console.log = jest.fn();
        
        mockClient = new MockClient();

        client = new MCPNodeClient(
            {
                name: "test",
                command: "echo",
                args: ["hello"],
                env: {},
            } as any,
            // Inject mock Client class and transport classes
            MockClient as any,
            MockTransport as any,
            MockTransport as any,
            MockTransport as any,
        );
    });

    afterEach(async () => {
        await client.disconnect();
        // Restore original console.log
        console.log = originalConsoleLog;
    });

    test("connect -> listTools -> callTool -> readResource -> listPrompts -> getPrompt -> disconnect", async () => {
        await client.connect();
        expect(client.isConnected).toBe(true);

        const tools = await client.listTools();
        expect(Array.isArray(tools)).toBe(true);
    expect(tools[0]!.name).toBe("tool1");

        const callResp = await client.callTool("tool1", { a: 1 });
        expect(callResp).toHaveProperty("result");

        const resources = await client.listResources();
    expect(resources[0]!.uri).toBe("res:1");

        const read = await client.readResource("res:1");
    expect(read.contents[0]!.text).toBe("hello");

        const prompts = await client.listPrompts();
    expect(prompts[0]!.name).toBe("p1");

        const prompt = await client.getPrompt("p1");
    expect(prompt.messages[0]!.content.text).toBe("hi");

        await client.disconnect();
        expect(client.isConnected).toBe(false);
    });
});

