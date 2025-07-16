# Node.js Example

Here's how to use the AgentForce ADK in a Node.js environment:

## Installation

```bash
npm install @agentforce/adk
```

## Example Server (Node.js)

```javascript
// server.js
import { AgentForceServer, AgentForceAgent } from "@agentforce/adk";

// Create an agent
const storyAgent = new AgentForceAgent({ 
    name: "StoryAgent", 
    type: "story-generator" 
});

// Configure the agent
storyAgent
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a creative story writer. Generate engaging stories based on user prompts.");

// Create a server
const server = new AgentForceServer({
    name: "StoryServer",
    logger: "json"
});

// Add route agents
server
    .addRouteAgent("POST", "/story", storyAgent)
    .addRouteAgent("GET", "/health", storyAgent);

// Start the server (now async and works with Node.js!)
await server.serve("localhost", 3000);
```

## Running the Server

```bash
# With Node.js and tsx (TypeScript support)
npx tsx server.js

# Or with plain Node.js (if using .mjs extension)
node server.mjs
```

## Key Changes for Cross-Runtime Support

The AgentForce ADK now supports:

- **Bun** (native support)
- **Node.js** (using Node.js built-in http module)
- **Deno** (using Deno.serve API)

The `serve()` method is now async and detects the runtime automatically.

## Runtime Detection

The library automatically detects which runtime you're using:

```javascript
// This works in all runtimes (Bun, Node.js, Deno)
await server.serve("localhost", 3000);
```

The server will use the appropriate serving mechanism for each runtime:
- Bun: Uses `Bun.serve()`
- Deno: Uses `Deno.serve()`
- Node.js: Uses Node.js built-in `http` module with Hono adapter
