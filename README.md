# AgentForce SDK

<div align="center">
  <img src="https://via.placeholder.com/200x200?text=AgentForce" alt="AgentForce Logo" width="200" height="200">
  
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
import AiAgent, { type AgentConfig } from "agentforce-sdk/agent";

// Configure your agent
const agentConfig: AgentConfig = {
  name: "MyFirstAgent",
  type: "assistant"
};

// Create an instance
const agent = new AiAgent(agentConfig);

// Use the agent
const debugInfo = agent.debug();
console.log("Agent Info:", debugInfo);
```

## Features

- 🚀 **Simple API**: Create agents with minimal code
- 🔌 **Provider Agnostic**: Works with various AI providers (default: Ollama)
- 🔄 **Model Switching**: Easily switch between different models
- 🧩 **Extensible**: Build custom workflows and agent behaviors
- 📊 **Debug Support**: Built-in debugging capabilities
- 🧪 **Test-Friendly**: Designed with testability in mind

## Examples

### Basic Agent

```typescript
import AiAgent from "agentforce-sdk/agent";

const agent = new AiAgent({
  name: "SimpleAgent",
  type: "general-purpose"
});

// Change the provider and model
agent.setProvider("openai");
agent.setModel("gpt-4");
```

### Debug Information

```typescript
const agent = new AiAgent({
  name: "DebugAgent",
  type: "development-agent"
});

const debugInfo = agent.debug();
console.log(debugInfo);
// Output: { name: "DebugAgent", type: "development-agent", provider: "ollama", model: "gemma3:4b" }
```

## API Reference

### `AgentForceAgent`

Main class for creating agents.

#### Constructor

```typescript
constructor(config: AgentConfig)
```

- `config`: Configuration object for the agent
  - `name`: Name of the agent (string)
  - `type`: Type of the agent (string)

#### Methods

- `getModel()`: Returns the current model name
- `setModel(model: string)`: Sets the model name
- `getProvider()`: Returns the current provider name
- `setProvider(provider: string)`: Sets the provider name
- `debug()`: Returns debug information for the agent

## Roadmap

- [ ] Add support for more AI providers
- [ ] Implement agent workflows and multi-agent communication
- [ ] Add streaming responses
- [ ] Provide tools and function-calling capabilities
- [ ] Create more examples and documentation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the AgentForce License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the AgentForce Team</p>
</div>
