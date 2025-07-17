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
- **Cross-Runtime Support**: Works seamlessly in Bun, Node.js, and Deno environments
- **Provider Agnostic**: Support for multiple AI providers (For now only Ollama is implemented)
- **Model Switching**: Easily switch between different models with `useLLM()`
- **Prompt Management**: Set system and user prompts with `.systemPrompt()` and `.prompt()`
- **Multiple Output Formats**: Support for text, JSON, and Markdown output formats
- **Type Safe**: Full TypeScript support with proper type definitions
- **Debug Support**: Built-in debugging capabilities
- **Test-Friendly**: Comprehensive test coverage and designed for testability
- **Server Mode**: Built-in server functionality for agent deployment with automatic runtime detection
- **OpenAI Compatibility**: Full OpenAI chat completions API compatibility for seamless integration

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
  .systemPrompt("You are a web API assistant");

// Start server (now async and works across Bun, Node.js, and Deno)
await agent.serve("localhost", 3000);
```

## Server Functionality

AgentForce SDK includes built-in server capabilities powered by Hono framework, allowing you to deploy agents as HTTP APIs with structured logging and route management.

### OpenAI API Compatibility

AgentForce ADK provides full OpenAI chat completions API compatibility, allowing you to use it as a drop-in replacement for OpenAI's API. This enables seamless integration with existing OpenAI-compatible tools and applications.

#### OpenAI-Compatible Server Example

```typescript
import { AgentForceAgent, AgentForceServer, type AgentConfig, type ServerConfig } from "@agentforce/adk";

// Create an OpenAI-compatible agent
const agentConfig: AgentConfig = {
    name: "OpenAICompatibleAgent",
    type: "openai-compatible-agent"
};

const openAIAgent = new AgentForceAgent(agentConfig)
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are an OpenAI compatible agent. You will respond to requests in a compatible format.");

// Create server with OpenAI chat completions endpoint
const serverConfig: ServerConfig = {
    name: "OpenAICompatibleServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    .addRouteAgent("POST", "/v1/chat/completions", openAIAgent)
    .serve("0.0.0.0", 3000);
```

#### OpenAI-Compatible API Usage

**Request Format (Standard OpenAI Chat Completions):**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "What model are you using?"
      }
    ]
  }'
```

**Response Format (OpenAI-Compatible):**
```json
{
  "id": "chatcmpl-1752677425345",
  "object": "chat.completion", 
  "created": 1752677425,
  "model": "ollama/gemma3:12b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I am using the Gemma 3 12B model running on Ollama."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 15,
    "total_tokens": 21
  }
}
```

#### Dynamic Provider and Model Selection

AgentForce ADK supports dynamic provider and model selection through the `model` parameter in OpenAI requests. This allows you to override the default agent configuration on a per-request basis:

**Supported Model Formats:**
- `"ollama/gemma3:12b"` → Provider: ollama, Model: gemma3:12b
- `"openai/gpt-4"` → Provider: openai, Model: gpt-4  
- `"anthropic/claude-3"` → Provider: anthropic, Model: claude-3
- `"gemma3:4b"` → Provider: ollama (default), Model: gemma3:4b

**Example with Different Providers:**
```bash
# Use Ollama with microsoft phi4 model
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "ollama/phi4:latest", "messages": [{"role": "user", "content": "Hello"}]}'

# Use OpenAI GPT-4 (when implemented)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "openai/gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'
```

#### Multi-Turn Conversation Examples

AgentForce ADK maintains full conversation context across multiple messages, enabling natural conversational AI experiences:

**Basic Multi-Turn Conversation:**
```bash
# Step 1: User introduces themselves
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "Hi, my name is Dave Smith. I work as a software engineer at a tech startup."
      }
    ]
  }'

# Response: "Hello Dave Smith! It's nice to meet you. That sounds like exciting work..."

# Step 2: Continue conversation with full context
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "Hi, my name is Dave Smith. I work as a software engineer at a tech startup."
      },
      {
        "role": "assistant",
        "content": "Hello Dave Smith! It'\''s nice to meet you. That sounds like exciting work - working at a tech startup must be quite dynamic and fast-paced. What kind of projects are you currently working on?"
      },
      {
        "role": "user",
        "content": "Do you remember my name?"
      }
    ]
  }'

# Response: "Yes, I remember your name is Dave Smith. You mentioned that you work as a software engineer at a tech startup."
```

**Complete Multi-Turn JSON Example:**
```json
{
  "model": "ollama/gemma3:12b",
  "messages": [
    {
      "role": "user",
      "content": "Hi, my name is Dave Smith. I work as a software engineer at a tech startup."
    },
    {
      "role": "assistant",
      "content": "Hello Dave Smith! It's nice to meet you. That sounds like exciting work - working at a tech startup must be quite dynamic and fast-paced. What kind of projects are you currently working on?"
    },
    {
      "role": "user",
      "content": "Do you remember my name?"
    }
  ]
}
```

**Extended Conversation with Code Request:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "What LLM are you?"
      },
      {
        "role": "assistant",
        "content": "I am Gemma 3, a 12 billion parameter language model developed by Google DeepMind. I'\''m currently running on Ollama through the AgentForce ADK framework."
      },
      {
        "role": "user",
        "content": "Can you help me write a Python function to calculate fibonacci numbers?"
      },
      {
        "role": "assistant",
        "content": "Certainly! Here'\''s a Python function to calculate Fibonacci numbers:\n\n```python\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```\n\nThis is a recursive implementation. For better performance with larger numbers, you might want to use an iterative approach or memoization."
      },
      {
        "role": "user",
        "content": "Show me the iterative version please"
      }
    ]
  }'
```

**Programmatic Multi-Turn Conversation with OpenAI SDK:**
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000',
  apiKey: 'not-needed',
});

async function conversationExample() {
  // Step 1: Introduction
  const intro = await client.chat.completions.create({
    model: 'ollama/gemma3:12b',
    messages: [
      {
        role: 'user',
        content: 'Hi, my name is Dave Smith. I work as a software engineer at a tech startup.'
      }
    ],
  });

  console.log('Assistant:', intro.choices[0].message.content);

  // Step 2: Test memory with full conversation context
  const memoryTest = await client.chat.completions.create({
    model: 'ollama/gemma3:12b',
    messages: [
      {
        role: 'user',
        content: 'Hi, my name is Dave Smith. I work as a software engineer at a tech startup.'
      },
      {
        role: 'assistant',
        content: intro.choices[0].message.content || ''
      },
      {
        role: 'user',
        content: 'Do you remember my name?'
      }
    ],
  });

  console.log('Memory test:', memoryTest.choices[0].message.content);
}

conversationExample();
```

**Key Features of Multi-Turn Conversations:**

1. **Context Preservation**: Full conversation history is maintained across requests
2. **Memory**: The AI remembers information from earlier messages (names, preferences, etc.)
3. **Natural Flow**: Supports user → assistant → user → assistant patterns
4. **Flexible Messaging**: Include system prompts, multiple user inputs, and assistant responses
5. **Dynamic Models**: Switch models mid-conversation using the `model` parameter

#### Extended OpenAI Parameters Support

AgentForce ADK supports all standard OpenAI chat completions parameters, providing full compatibility with OpenAI clients and tools. Only `model` and `messages` are required - all other parameters are optional.

**Supported Optional Parameters:**
- `temperature` (0.0-2.0): Controls randomness in responses
- `max_tokens`: Maximum tokens in response
- `top_p` (0.0-1.0): Nucleus sampling parameter
- `n` (1-128): Number of chat completion choices to generate
- `stream` (boolean): Enable streaming responses
- `stream_options`: Streaming configuration options
- `stop`: Up to 4 sequences where the API will stop generating
- `presence_penalty` (-2.0 to 2.0): Penalty for new tokens based on presence
- `frequency_penalty` (-2.0 to 2.0): Penalty for new tokens based on frequency
- `logit_bias`: Modify likelihood of specified tokens
- `user`: Unique identifier representing your end-user
- `tools`: List of tools the model may call
- `tool_choice`: Controls which (if any) tool is called
- `response_format`: Format of the response (text or json_object)
- `seed`: Random seed for reproducible outputs

**Multimodal Content Support:**

AgentForce ADK supports both simple string content and complex content arrays for multimodal interactions:

```bash
# Simple string content (traditional)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like?"
      }
    ]
  }'

# Complex content array (multimodal)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Describe this image:"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/image.jpg",
              "detail": "high"
            }
          }
        ]
      }
    ],
    "temperature": 0.7,
    "max_tokens": 150,
    "stream": false
  }'
```

**Complete Parameter Example:**
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "system",
        "content": "You are a helpful assistant specialized in technical documentation."
      },
      {
        "role": "user",
        "content": "Explain REST API best practices"
      }
    ],
    "temperature": 0.8,
    "max_tokens": 500,
    "top_p": 0.9,
    "frequency_penalty": 0.1,
    "presence_penalty": 0.1,
    "stop": ["###", "---"],
    "stream": false,
    "user": "user-123",
    "response_format": { "type": "text" }
  }'
```

**Validation and Error Handling:**

The system provides comprehensive validation with detailed error messages:

```bash
# Invalid content type
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "invalid",
            "text": "This will fail"
          }
        ]
      }
    ]
  }'

# Response: 
# {
#   "error": "Invalid OpenAI chat completion format",
#   "message": "Message at index 0, content object at index 0 has invalid type \"invalid\". Must be \"text\" or \"image_url\"",
#   "example": { ... }
# }
```

The agent's provider and model are dynamically configured based on the request, overriding the default `.useLLM()` configuration.

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

- **`.addRoute(method, path, responseData)`**: Add static routes that return predefined data (chainable)
  - `method`: HTTP method ("GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS")
  - `path`: Route path (e.g., "/health", "/version")
  - `responseData`: Data to return - can be object, function, or primitive value

- **`.useOpenAICompatibleRouting(agent)`**: Add OpenAI-compatible chat completions endpoint (chainable)
  - Automatically adds the agent to handle `POST /v1/chat/completions`
  - Provides full OpenAI API compatibility for seamless integration
  - `agent`: AgentForceAgent instance to handle OpenAI-compatible requests

- **`.useOllamaCompatibleRouting(agent)`**: Add Ollama-compatible API endpoints (chainable)
  - Automatically adds the agent to handle `POST /api/generate` and `POST /api/chat`
  - Provides Ollama API compatibility for existing Ollama integrations
  - `agent`: AgentForceAgent instance to handle Ollama-compatible requests

- **`.serve(host?, port?)`**: Start the HTTP server (terminal method, async, returns Promise<void>)
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

// Create server with both agent routes and static routes
const server = new AgentForceServer(serverConfig)
    // API compatibility routes
    .useOpenAICompatibleRouting(productOwnerAgent)  // Adds POST /v1/chat/completions
    .useOllamaCompatibleRouting(designAgent)        // Adds POST /api/generate and /api/chat
    // Static utility routes
    .addRoute("GET", "/health", {"status": "ok"})
    .addRoute("GET", "/version", {"version": "1.0.0"})
    .addRoute("POST", "/webhook", (context) => ({
        received: true,
        timestamp: new Date().toISOString(),
        method: context.req.method
    }))
    // Custom agent-powered routes
    .addRouteAgent("POST", "/story", productOwnerAgent)
    .addRouteAgent("GET", "/story", productOwnerAgent)
    .addRouteAgent("POST", "/design", designAgent);

// Start server (async)
await server.serve("localhost", 3000);
```

#### Static Routes with `addRoute`

The `addRoute` method allows you to create endpoints that return predefined data without requiring an AI agent. This is perfect for health checks, status endpoints, webhooks, and other utility routes.

**Basic static data:**
```typescript
new AgentForceServer(serverConfig)
    .addRoute("GET", "/health", {"status": "ok"})
    .addRoute("GET", "/version", {"version": "1.0.0"})
    .serve("localhost", 3000);
```

**Dynamic data with functions:**
```typescript
new AgentForceServer(serverConfig)
    .addRoute("GET", "/time", () => ({
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    }))
    .addRoute("POST", "/webhook", (context) => ({
        received: true,
        method: context.req.method,
        url: context.req.url,
        timestamp: new Date().toISOString()
    }))
    .serve("localhost", 3000);
```

**Features of static routes:**
- **Route conflict prevention**: Custom routes override default server routes
- **Function support**: Response data can be functions for dynamic content
- **Context access**: Functions receive Hono context for request details
- **Type flexibility**: Supports objects, functions, primitives, and async functions
- **HTTP method validation**: Validates all standard HTTP methods
- **Path normalization**: Automatically adds leading slash to paths

#### API Compatibility Routes

AgentForce ADK provides convenience methods for adding standard API endpoints that are compatible with popular AI service APIs:

**OpenAI API Compatibility:**
```typescript
new AgentForceServer(serverConfig)
    .useOpenAICompatibleRouting(agent)  // Adds POST /v1/chat/completions
    .serve("localhost", 3000);

// Equivalent to:
// .addRouteAgent("POST", "/v1/chat/completions", agent)
```

**Ollama API Compatibility:**
```typescript
new AgentForceServer(serverConfig)
    .useOllamaCompatibleRouting(agent)  // Adds POST /api/generate and /api/chat
    .serve("localhost", 3000);

// Equivalent to:
// .addRouteAgent("POST", "/api/generate", agent)
// .addRouteAgent("POST", "/api/chat", agent)
```

**Combined API Compatibility:**
```typescript
new AgentForceServer(serverConfig)
    .useOpenAICompatibleRouting(openaiAgent)   // OpenAI-compatible endpoints
    .useOllamaCompatibleRouting(ollamaAgent)   // Ollama-compatible endpoints
    .addRoute("GET", "/health", {"status": "ok"})
    .serve("localhost", 3000);

// This creates endpoints:
// POST /v1/chat/completions (OpenAI format)
// POST /api/generate (Ollama format)  
// POST /api/chat (Ollama format)
// GET /health (custom static route)
```

#### API Request/Response Format

**Static Route Requests (addRoute endpoints):**
```bash
# GET static route
curl http://localhost:3000/health

# POST static route with function response
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Static Route Responses:**
```json
{
  "status": "ok"
}

{
  "received": true,
  "timestamp": "2025-07-17T10:38:07.289Z",
  "method": "POST",
  "url": "http://localhost:3000/webhook"
}
```

**Legacy Request Format (addRouteAgent endpoints):**
```bash
# POST request
curl -X POST http://localhost:3000/story \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a user story for authentication system"}'

# GET request  
curl "http://localhost:3000/story?prompt=Create%20a%20user%20story%20for%20login"
```

**OpenAI-Compatible Request Format:**
```bash
# OpenAI chat completions format (for /v1/chat/completions endpoints)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "Create a user story for authentication system"
      }
    ]
  }'
```

**Legacy Response Format:**
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

**OpenAI-Compatible Response Format:**
```json
{
  "id": "chatcmpl-1752677425345",
  "object": "chat.completion",
  "created": 1752677425,
  "model": "ollama/gemma3:12b",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Okay, here's a Story created using the ..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 42,
    "total_tokens": 57
  }
}
```

**Error Response:**
```json
{
  "error": "Missing or invalid prompt",
  "message": "Request must include a \"prompt\" field with a string value",
  "example": {
    "prompt": "create a story for an auth service in bun"
  }
}
```

**OpenAI-Compatible Error Response:**
```json
{
  "error": "Invalid OpenAI chat completion format",
  "message": "Missing or invalid \"model\" field. Must be a non-empty string",
  "example": {
    "model": "ollama/gemma3:12b",
    "messages": [
      {
        "role": "user",
        "content": "what llm are you"
      }
    ]
  }
}
```

#### Server Features

- **Multiple HTTP Methods**: Support for GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Route Management**: Easy configuration of agent-powered and static endpoints
- **Static Routes**: Built-in support for utility endpoints (health checks, webhooks, etc.)
- **Dynamic Responses**: Static routes can use functions for dynamic data generation
- **Structured Logging**: Built-in logging with Pino (JSON or pretty-printed format)
- **Error Handling**: Error responses with helpful messages
- **Request Validation**: Automatic validation of required fields
- **Agent Response Wrapping**: AI responses are wrapped with structured metadata including timestamps and agent information
- **Method Chaining**: Fluent interface for server configuration
- **OpenAI API Compatibility**: Full support for OpenAI chat completions format
- **Dynamic Model Selection**: Override provider and model per request
- **Backward Compatibility**: Legacy endpoints work alongside OpenAI-compatible ones
- **Route Conflict Prevention**: Custom static routes override default server routes

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
    .addRouteAgent("POST", "/v1/chat/completions", openAIAgent); // OpenAI-compatible endpoint

// Start production server (async)
await server.serve("0.0.0.0", process.env.PORT || 8080);
```

### Integration with OpenAI-Compatible Tools

AgentForce ADK's OpenAI compatibility allows seamless integration with existing tools and libraries that support OpenAI's API:

- **LangChain**: Use AgentForce as an OpenAI provider
- **OpenAI SDK**: Point to your AgentForce server endpoint
- **Chatbot UIs**: Any interface that supports OpenAI chat completions
- **Development Tools**: Postman, Insomnia, curl, etc.

Example with OpenAI SDK:
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'http://localhost:3000',  // Your AgentForce server
  apiKey: 'not-needed', // AgentForce doesn't require API keys
});

const completion = await client.chat.completions.create({
  model: 'ollama/gemma3:12b',
  messages: [{ role: 'user', content: 'Hello!' }],
});
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

- **`.serve(host?, port?)`**: Start agent as web server (async, returns Promise<void>)
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
