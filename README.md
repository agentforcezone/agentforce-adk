# AgentForce ADK -  The Agent Development Kit

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/212582904?s=200" alt="AgentForce Logo" width="200" height="200">
  
  <br/> <br/>

  <p><strong>A powerful TypeScript Agentic Framework for building AiAgent Workflows</strong></p>

  <br/>

  <p>
    <a href="#installation">Installation</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#features">Features</a> •
    <a href="#examples">Examples</a> •
    <a href="#running-examples">Running Examples</a> •
    <a href="#api-reference">API Reference</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </p>
</div>

## Overview

AgentForce ADK is a TypeScript Agent library for creating, managing, and orchestrating AiAgent Workflows. Built with modern TypeScript practices, it provides a simple powerful interface to develop Agent-Based applications. The Agent Development Kit supports multiple AI providers and models, making it flexible for various use cases.

## Installation

AgentForce ADK is available on both npm and JSR registries:

```bash
# Install via npm
npm install @agentforce/adk

# Install via JSR (JavaScript Registry)
npx jsr add @agentforce/adk        # For Node.js projects
bunx jsr add @agentforce/adk       # For Bun projects  
deno add @agentforce/adk           # For Deno projects

# Install via Bun (from npm)
bun add @agentforce/adk
```

#### Installation Method Comparison:

| Method | Best For | Command | Benefits |
|--------|----------|---------|----------|
| **npm** | Node.js projects, existing npm workflows | `npm install @agentforce/adk` | Largest ecosystem, familiar tooling |
| **JSR** | TypeScript-first projects, Deno/Bun compatibility | `npx jsr add @agentforce/adk` (Node.js)<br>`bunx jsr add @agentforce/adk` (Bun)<br>`deno add @agentforce/adk` (Deno) | Native TypeScript support, better type checking |
| **Bun (npm)** | Fast development, modern JavaScript projects | `bun add @agentforce/adk` | Fastest package manager, built-in TypeScript support |

#### Runtime Compatibility:

- **Node.js**: 
  - npm: `npm install @agentforce/adk`
  - JSR: `npx jsr add @agentforce/adk`
- **Deno**: 
  - JSR: `deno add @agentforce/adk` (recommended)
- **Bun**: 
  - npm: `bun add @agentforce/adk` 
  - JSR: `bunx jsr add @agentforce/adk`
- **Browsers**: Works with bundlers like Vite, Webpack, or Rollup using any installation method

## Provider Setup

### Ollama (Recommended for local development)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model, e.g
ollama pull gemma3:12b
ollama pull phi4-mini-reasoning:latest
ollama pull magistral:latest
```

### OpenAI, Anthropic, Google

Not yet implemented! Coming Soon

## Quick Start

Create your first agent in just a few lines of code:

```typescript
import { AgentForceAgent, type AgentConfig } from "@agentforce/adk";

// Configure your agent
const agentConfig: AgentConfig = {
  name: "MyFirstAgent",
  type: "assistant"
};

// Create and configure your agent with method chaining
const agent = new AgentForceAgent(agentConfig)
  .useLLM("ollama", "llama2")
  .systemPrompt("You are a helpful AI assistant")
  .prompt("Hello, What is your role?")
  .output("json");
```

## Features

- **Simple API**: Create agents with minimal code
- **Method Chaining**: Fluent interface for configuring agents
- **Provider Agnostic**: Support for multiple AI providers (For now only Ollama is implemented)
- **Model Switching**: Easily switch between different models with `useLLM()`
- **Prompt Management**: Set system and user prompts with `.systemPrompt()` and `.prompt()`
- **Multiple Output Formats**: Support for text, JSON, and Markdown output formats
- **Type Safe**: Full TypeScript support with proper type definitions
- **Debug Support**: Built-in debugging capabilities
- **Test-Friendly**: Comprehensive test coverage and designed for testability
- **Server Mode**: Built-in server functionality for agent deployment

## Examples

### Basic Agent with Method Chaining

```typescript
import { AgentForceAgent } from "@agentforce/adk";

const agent = new AgentForceAgent({
  name: "ChatBot",
  type: "conversational-agent"
})
  .useLLM("ollama", "phi4")
  .systemPrompt("You are a friendly chatbot")
  .prompt("Tell me a joke")
  .output("text");
```

### Different Output Formats

```typescript
import { AgentForceAgent } from "@agentforce/adk";

const agent = new AgentForceAgent({
  name: "DataAgent",
  type: "data-processor"
})
  .useLLM("ollama", "llama3.2")
  .systemPrompt("You are a data analysis expert")
  .prompt("Analyze this dataset");

// Text output
agent.output("text");

// JSON output
agent.output("json");

// Markdown output
agent.output("md");
```

### Agent as Server

```typescript
import { AgentForceAgent } from "@agentforce/adk";

const agent = new AgentForceAgent({
  name: "WebAgent",  
  type: "web-service"
})
  .useLLM("ollama", "phi4-mini:latest")
  .systemPrompt("You are a web API assistant")
  .serve("localhost", 3000); // Starts server on localhost:3000
```

## Server Functionality

AgentForce SDK includes built-in server capabilities powered by Hono framework, allowing you to deploy agents as HTTP APIs with structured logging and route management.

### `AgentForceServer`

The server class provides functionality for creating HTTP APIs with agent-powered endpoints.

#### Constructor

```typescript
import { AgentForceServer, type ServerConfig } from "@agentforce/adk";

const serverConfig: ServerConfig = {
    name: "MyAgentServer",
    logger: "json" // or "pretty" for colored console output
};

const server = new AgentForceServer(serverConfig);
```

#### Server Methods

- **`.addRouteAgent(method, path, agent)`**: Add an agent to handle specific HTTP endpoints (chainable)
  - `method`: HTTP method ("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS")
  - `path`: Route path (e.g., "/story", "/image")
  - `agent`: AgentForceAgent instance to handle requests

- **`.serve(host?, port?)`**: Start the HTTP server (terminal method)
  - `host`: Server host (default: "0.0.0.0")
  - `port`: Server port (default: 3000)

#### Complete Server Example

```typescript
import { AgentForceServer, AgentForceAgent, type ServerConfig, type AgentConfig } from "@agentforce/adk";

// Create agents
const productOwnerAgent = new AgentForceAgent({
    name: "ProductOwnerAgent",
    type: "product-owner-agent"
})
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a product owner agent. Create tickets, epics, and user stories.");

const designAgent = new AgentForceAgent({
    name: "DesignAgent", 
    type: "design-agent"
})
    .useLLM("ollama", "phi4-mini:latest")
    .systemPrompt("You are a UI/UX design expert. Create design specifications and wireframes.");

// Configure server
const serverConfig: ServerConfig = {
    name: "AgentAPIServer",
    logger: "json"
};

// Create server with route agents
new AgentForceServer(serverConfig)
    .addRouteAgent("POST", "/story", productOwnerAgent)
    .addRouteAgent("GET", "/story", productOwnerAgent)
    .addRouteAgent("POST", "/design", designAgent)
    .serve("localhost", 3000);
```

#### API Request/Response Format

**Request Format:**
```bash
# POST request
curl -X POST http://localhost:3000/story \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a user story for authentication system"}'

# GET request  
curl "http://localhost:3000/story?prompt=Create%20a%20user%20story%20for%20login"
```

**Response Format:**
```json
{
  "success": true,
  "method": "POST",
  "path": "/story",
  "agentName": "IntegrationTestAgent",
  "agentType": "product-owner-agent",
  "prompt": "create a Story for a Design Website",
  "response": "Okay, here's a Story created using the ..."
}
```

**Error Response:**
```json
{
  "error": "Missing or invalid prompt",
  "message": "Request must include a \"prompt\" field with a string value",
  "example":{
    "prompt": "create a story for an auth service in bun"
  }
}
```

#### Server Features

- **Multiple HTTP Methods**: Support for GET, POST
- **Route Management**: Easy configuration of agent-powered endpoints
- **Structured Logging**: Built-in logging with Pino (JSON or pretty-printed format)
- **Error Handling**: Error responses with helpful messages
- **Request Validation**: Automatic validation of required fields
- **Agent Response Wrapping**: AI responses are wrapped with structured metadata including timestamps and agent information
- **Method Chaining**: Fluent interface for server configuration

#### Logging Configuration

```typescript
// JSON logging (default)
const server = new AgentForceServer({
    name: "MyServer",
    logger: "json"
});

// Pretty-printed colored logging for development
const server = new AgentForceServer({
    name: "MyServer", 
    logger: "pretty"
});
```

#### Production Deployment

```typescript
// Production server configuration
const server = new AgentForceServer({
    name: "ProductionAgentAPI",
    logger: "json"
})
    .addRouteAgent("POST", "/api/v1/generate", agent)
    .addRouteAgent("GET", "/api/v1/health", healthAgent)
    .serve("0.0.0.0", process.env.PORT || 8080);
```

## API Reference

### `AgentForceAgent`

Main class for creating and managing AI agents with chainable methods.

#### Constructor

```typescript
constructor(config: AgentConfig)
```

- `config`: Configuration object for the agent
  - `name`: Name of the agent (string)
  - `type`: Type of the agent (string)

#### Chainable Methods

All methods return the agent instance for fluent chaining:

- **`.useLLM(provider, model)`**: Configure AI provider and model
  - `provider`: AI provider ("openai", "anthropic", "ollama", "google")
  - `model`: Model name (e.g., "gpt-4", "claude-3", "phi4-mini:latest")

- **`.systemPrompt(prompt)`**: Set the system prompt
  - `prompt`: System instruction string

- **`.prompt(userPrompt)`**: Set the user prompt  
  - `userPrompt`: User input string

- **`.run()`**: Execute the agent chain with real API calls to the configured provider
  - Returns: `Promise<AgentForceAgent>` for async chaining
  - Makes actual API calls to the specified provider (e.g., Ollama, OpenAI)
  - Logs execution details and AI responses to console

- **`.output(format)`**: Generate output in specified format
  - `format`: Output type ("text", "json", "md")

- **`.debug()`**: Log debug information and return agent instance for development

- **`.serve(host?, port?)`**: Start agent as web server
  - `host`: Server host (default: "0.0.0.0")
  - `port`: Server port (default: 3000)

## Roadmap

- [x] Method chaining with fluent interface
- [x] Prompt management (system and user prompts)
- [x] Agent execution with real API calls (`.run()` method)
- [x] Multiple output formats (text, JSON, markdown)
- [x] Server deployment capabilities
- [x] Comprehensive test coverage with mock data support
- [ ] Multiple AI provider support (Ollama, Google, OpenRouter, ...)
- [ ] Streaming responses
- [ ] Function calling and tool integration
- [ ] Multi-agent workflows and communication
- [ ] Advanced error handling and retry mechanisms
- [ ] Performance monitoring and analytics
- [ ] ...

## License

This project is licensed under the AgentForce License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the AgentForce Team</p>
</div>
