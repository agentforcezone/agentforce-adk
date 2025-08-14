# AgentForce ADK -  The Agent Development Kit

<br/>

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
    <a href="#api-reference">API Reference</a> •
    <a href="#license">License</a>
  </p>
  <p> or goto </p>
  <p> 
  <a href="https://docs.agentforce.zone">The AgentForceZone Documentation Page 
  </p>
</div>

<br/>

<br/>

## We are in Beta!

This project is in early development and is not yet production-ready. It is intended for testing and experimentation only. Use at your own risk.

<br/>

## Overview

AgentForce ADK is a TypeScript Agent library for creating, managing, and orchestrating AiAgent Workflows. Built with modern TypeScript practices, it provides a simple powerful interface to develop Agent-Based applications. The Agent Development Kit supports multiple AI providers and models, making it flexible for various use cases.

<br/>

## Installation

AgentForce ADK is available on both npm and JSR registries:

```bash
# Install via npm
npm install @agentforce/adk

# Install via JSR (JavaScript Registry)
npx jsr add @agentforce/adk        # For Node.js projects
bunx jsr add @agentforce/adk       # For Bun projects  
deno add jsr:@agentforce/adk       # For Deno projects

# Install via Bun (from npm)
bun add @agentforce/adk
```

#### Installation Method Comparison:

| Method | Best For | Command | Benefits |
|--------|----------|---------|----------|
| **npm** | Node.js projects, existing npm workflows | `npm install @agentforce/adk` | Largest ecosystem, familiar tooling |
| **JSR** | TypeScript-first projects, Deno/Bun compatibility | `npx jsr add @agentforce/adk` (Node.js)<br>`bunx jsr add @agentforce/adk` (Bun)<br>`deno add @agentforce/adk` (Deno) | Native TypeScript support, better type checking |
| **Bun (npm)** | Fast development, modern JavaScript projects | `bun add @agentforce/adk` | Fastest package manager, built-in TypeScript support |

<br/>

#### Runtime Compatibility:

- **Node.js**: 
  - npm: `npm install @agentforce/adk`
  - JSR: `npx jsr add @agentforce/adk`
- **Deno**: 
  - JSR: `deno add jsr:@agentforce/adk` (recommended)
- **Bun**: 
  - npm: `bun add @agentforce/adk` 
  - JSR: `bunx jsr add @agentforce/adk`
- **Browsers**: Works with bundlers like Vite, Webpack, or Rollup using any installation method

<br/>

### Provider Setup

#### Ollama (Recommended for local development)
```bash
# Install Ollama on macOS using Homebrew
brew install ollama

# Or install via curl
curl -fsSL https://ollama.ai/install.sh | sh

# Verify installation
ollama --version

# Start Ollama server
ollama serve

# Pull a model, e.g
ollama pull gemma3:12b
ollama pull phi4-mini-reasoning:latest
ollama pull magistral:latest
```
<br/>

#### OpenRouter (Multiple Models via API)
```bash
# Set your OpenRouter API key
export OPENROUTER_API_KEY=sk-or-v1-your-api-key-here

# Or add to .env file
echo "OPENROUTER_API_KEY=sk-or-v1-your-api-key-here" >> .env
```

<br/>

Get your API key at [OpenRouter.ai](https://openrouter.ai/settings/keys) to access models from:
- OpenAI (GPT-5, gpt-oss-120b, gpt-4, gpt-3.5-turbo)
- Anthropic (Claude Opus 4, Claude Sonnet 4, Claude Sonnet 3.5)
- Google (Gemini 2.5 Pro, Gemini 2.5 Flash, Gemma 3)
- Meta (Llama 4, Llama 3)
- Free models (GLM 4.5 Air (free), Qwen3 Coder (free), Kimi K2 (free), etc.)

<br/>

#### OpenAI, Anthropic, Google

Not yet implemented! Coming Soon

<br/>

## Quick Start

Create your first agent in just a few lines of code:

```typescript
// Import main classes
import { AgentForceAgent } from "@agentforce/adk";

// Create and configure your agent
const agent = new AgentForceAgent({ name: "StoryTellerAgent" })
  .useLLM("ollama", "gemma3:4b") 
  .systemPrompt("You are a creative story writer.")
  .prompt("Write a short story about AI and humanity.");

// Run the agent and get the response in markdown format
const response = await agent.output("md");
console.log(response);
```

<br/>

## Features

- **Simple API**: Create agents with minimal code
- **Method Chaining**: Fluent interface for configuring agents
- **Cross-Runtime Support**: Works seamlessly in Bun, Node.js, and Deno environments
- **Multiple AI Providers**: Support for Ollama (local), OpenRouter (cloud), with OpenAI/Anthropic/Google coming soon
- **Model Switching**: Easily switch between different models with `useLLM()`
- **Cloud & Local Models**: Use local Ollama models or cloud models via OpenRouter
- **Prompt Management**: Set system and user prompts with `.systemPrompt()` and `.prompt()`
- **Multiple Output Formats**: Support for text, JSON, and Markdown output formats
- **Type Safe**: Full TypeScript support with proper type definitions
- **Debug Support**: Built-in debugging capabilities
- **Test-Friendly**: Comprehensive test coverage and designed for testability
- **Server Mode**: Built-in server functionality for agent deployment with automatic runtime detection
- **OpenAI Compatibility**: Full OpenAI chat completions API compatibility for seamless integration

<br/>

## Examples

[A Basic Agent Example](https://docs.agentforce.zone/adk/examples/basic/)

[A Simple Server Example](https://docs.agentforce.zone/adk/examples/server/)

[Advanced Agent Example](https://docs.agentforce.zone/adk/examples/advanced/)

<br/>

And many more!

[The Awesome ADK Example Repository](https://github.com/agentforcezone/agentforce-adk-awesome)

<br/>


## API Reference

For detailed API documentation, visit the [AgentForce ADK API Reference](https://docs.agentforce.zone/adk/).

<br/>

## MVP Roadmap

- [x] Method chaining with fluent interface
- [x] Prompt management (system and user prompts)
- [x] Agent execution with real API calls (`.run()` method)
- [x] Multiple output formats (text, JSON, markdown)
- [x] Server deployment capabilities
- [x] Comprehensive test coverage with mock data support
- [x] Ollama provider support (local models)
- [x] OpenRouter provider support (cloud models with multiple providers)
- [x] Function calling and tool integration

## Coming soon

- [ ] Native OpenAI, Anthropic, Google provider support
- [ ] Streaming responses
- [ ] Multi-agent workflows and communication
- [ ] Advanced error handling and retry mechanisms
- [ ] Performance monitoring and analytics
- [ ] ...

<br/>

## License

This project is licensed under the AgentForceZone License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built with ❤️ by the AgentForceZone Team</p>
</div>
