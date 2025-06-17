# AgentForce SDK

<div align="center">
  <img src="https://avatars.githubusercontent.com/u/212582904?s=200" alt="AgentForce Logo" width="200" height="200">
  
  <p><strong>A powerful TypeScript framework for building AI agents</strong></p>

  <p>
    <a href="#installation">Installation</a> •
    <a href="#quick-start">Quick Start</a> •
    <a href="#features">Features</a> •
    <a href="#examples">Examples</a> •
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

- **`.output(format)`**: Generate output in specified format
  - `format`: Output type ("text", "json", "md")

- **`.debug()`**: Log debug information and return agent instance for development

- **`.serve(host?, port?)`**: Start agent as web server
  - `host`: Server host (default: "0.0.0.0")
  - `port`: Server port (default: 3000)

#### Example Usage

```typescript
// Method chaining
const agent = new AgentForceAgent(config)
  .useLLM("openai", "gpt-4")
  .systemPrompt("You are helpful")
  .prompt("Hello")
  .debug()
  .output("json");

// Multiple configurations
agent
  .useLLM("anthropic", "claude-3")
  .systemPrompt("New system prompt")
  .output("text")
  .output("md");
```

## Roadmap

- [x] Method chaining with fluent interface
- [x] Multiple AI provider support (OpenAI, Anthropic, Ollama, Google)
- [x] Prompt management (system and user prompts)
- [x] Multiple output formats (text, JSON, markdown)
- [x] Server deployment capabilities
- [x] Comprehensive test coverage
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
