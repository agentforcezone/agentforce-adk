# AgentForce SDK

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/212582904?s=200" alt="AgentForce Logo" width="200" height="200">
  
  <br/>

  <p><strong>A powerful TypeScript framework for building AI agents</strong></p>

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

AgentForce SDK is a TypeScript library for creating, managing, and orchestrating AI agents. Built with modern TypeScript practices, it provides a simple yet powerful interface to develop agent-based applications. The SDK supports multiple AI providers and models, making it flexible for various use cases.

## Installation

```bash
# Using npm
npm install agentforce-sdk

# Using Yarn
yarn add agentforce-sdk

# Using Bun
bun add agentforce-sdk
```

## Provider Setup

To use the `.run()` method with real AI providers, you'll need to set up the respective services:

### Ollama (Recommended for local development)
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama2
ollama pull codellama
ollama pull phi4-mini
```

### OpenAI, Anthropic, Google
These providers are recognized by the SDK but require additional implementation. Currently, the SDK will show "not implemented" messages for these providers when using `.run()`.

## Quick Start

Create your first agent in just a few lines of code:

```typescript
import AgentForceAgent, { type AgentConfig } from "@agentforce-sdk/agent";

// Configure your agent
const agentConfig: AgentConfig = {
  name: "MyFirstAgent",
  type: "assistant"
};

// Create and configure your agent with method chaining
const agent = new AgentForceAgent(agentConfig)
  .useLLM("ollama", "llama2")
  .systemPrompt("You are a helpful AI assistant")
  .prompt("Hello, how can I help you today?")
  .run(); // Execute the agent and get AI response

// Or use different output formats
agent
  .useLLM("openai", "gpt-4")
  .systemPrompt("You are a helpful AI assistant")
  .prompt("Hello, how can I help you today?")
  .output("json");
```

## Features

- 🚀 **Simple API**: Create agents with minimal code
- � **Method Chaining**: Fluent interface for configuring agents
- �🔌 **Provider Agnostic**: Support for multiple AI providers (OpenAI, Anthropic, Ollama, Google)
- 🤖 **Model Switching**: Easily switch between different models with `useLLM()`
- 💬 **Prompt Management**: Set system and user prompts with `.systemPrompt()` and `.prompt()`
- ⚡ **Agent Execution**: Execute agents with real API calls using `.run()`
- 📄 **Multiple Output Formats**: Support for text, JSON, and Markdown output formats
- 🛡️ **Type Safe**: Full TypeScript support with proper type definitions
- 📊 **Debug Support**: Built-in debugging capabilities
- 🧪 **Test-Friendly**: Comprehensive test coverage and designed for testability
- 🌐 **Server Mode**: Built-in server functionality for agent deployment

## Examples

### Basic Agent with Method Chaining

```typescript
import AgentForceAgent from "@agentforce-sdk/agent";

const agent = new AgentForceAgent({
  name: "ChatBot",
  type: "conversational-agent"
})
  .useLLM("openai", "gpt-4")
  .systemPrompt("You are a friendly chatbot")
  .prompt("Tell me a joke")
  .output("text");
```

### Agent Execution with Real AI Responses

```typescript
// Execute agent with real API calls
const agent = new AgentForceAgent({
  name: "AssistantBot",
  type: "ai-assistant"
});

// Using Ollama (requires running Ollama locally)
await agent
  .useLLM("ollama", "llama2")
  .systemPrompt("You are a helpful programming assistant")
  .prompt("Explain the concept of async/await in JavaScript")
  .run(); // Makes actual API call and logs response

// Chain with other methods
await agent
  .useLLM("ollama", "codellama")
  .systemPrompt("You are a code reviewer")
  .prompt("Review this function for best practices")
  .run()
  .then(agent => agent.debug()); // Log debug info after execution
```

### Different Output Formats

```typescript
const agent = new AgentForceAgent({
  name: "DataAgent",
  type: "data-processor"
})
  .useLLM("anthropic", "claude-3")
  .systemPrompt("You are a data analysis expert")
  .prompt("Analyze this dataset");

// Text output
agent.output("text");

// JSON output
agent.output("json");

// Markdown output
agent.output("md");
```

### Server Deployment

```typescript
const agent = new AgentForceAgent({
  name: "WebAgent",  
  type: "web-service"
})
  .useLLM("ollama", "phi4-mini:latest")
  .systemPrompt("You are a web API assistant")
  .serve("localhost", 3000); // Starts server on localhost:3000
```

## Running Examples

The SDK comes with ready-to-run examples that demonstrate various capabilities:

### Integration Example

Run the integration example to see how agents interact with different LLM providers:

```bash
# Using npm
npm run example-integration

# Using Yarn
yarn example-integration

# Using Bun (recommended)
bun example-integration
```

This example demonstrates:
- Setting up agents with different configurations
- Using different LLM providers and models
- Basic prompt interactions and responses

### Server Example

Run the server example to see how agents can be deployed as web services:

```bash
# Using npm
npm run example-server

# Using Yarn
yarn example-server

# Using Bun (recommended)
bun example-server
```

This example demonstrates:
- Creating an agent with web server capabilities
- Configuring server host and port
- Processing requests and generating responses
- Basic API endpoint structure

After running the server example, you can interact with the agent by sending HTTP requests to the configured endpoints.

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

#### Example Usage

```typescript
// Method chaining with execution
const agent = new AgentForceAgent(config)
  .useLLM("ollama", "llama2")
  .systemPrompt("You are helpful")
  .prompt("Hello")
  .debug();

// Execute with real API call
await agent.run();

// Chain execution with other methods
await agent
  .useLLM("anthropic", "claude-3")
  .systemPrompt("New system prompt")
  .prompt("Explain machine learning")
  .run()
  .then(agent => agent.output("text"));

// Multiple output formats
agent
  .output("json")
  .output("md");
```

## Roadmap

- [x] Method chaining with fluent interface
- [x] Multiple AI provider support (OpenAI, Anthropic, Ollama, Google)
- [x] Prompt management (system and user prompts)
- [x] Agent execution with real API calls (`.run()` method)
- [x] Multiple output formats (text, JSON, markdown)
- [x] Server deployment capabilities
- [x] Comprehensive test coverage with mock data support
- [ ] Streaming responses
- [ ] Function calling and tool integration
- [ ] Multi-agent workflows and communication
- [ ] Plugin system for extensibility
- [ ] Advanced error handling and retry mechanisms
- [ ] Performance monitoring and analytics

## License

This project is licensed under the AgentForce License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the AgentForce Team</p>
</div>
