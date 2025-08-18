Now I'll analyze the documentation to give you a comprehensive overview of the Agentforce ADK project:

# Agentforce ADK: Comprehensive Overview

## Project Introduction

Agentforce ADK (Agent Development Kit) is a TypeScript-based framework designed for creating, managing, and orchestrating AI agents. It provides a simple yet powerful interface for developing agent-based applications with modern TypeScript practices.

## Key Features

### Core Capabilities
- **Simple API**: Easy-to-use interface for creating agents
- **Method Chaining**: Fluent interface for configuring agents
- **Multi-Runtime Support**: Works seamlessly in Bun, Node.js, and Deno
- **Multiple AI Providers**: Supports Ollama (local), OpenRouter (cloud), with OpenAI/Anthropic/Google coming soon
- **Flexible Model Switching**: Easily change models using `useLLM()`
- **Prompt Management**: Set system/user prompts with dedicated methods
- **Multiple Output Formats**: Text, JSON, YAML, and Markdown support
- **Type Safety**: Full TypeScript support with proper typing
- **Debugging Tools**: Built-in debugging capabilities
- **Testing Support**: Comprehensive test coverage

### Advanced Features
- **Server Deployment**: Built-in server functionality for agent deployment
- **OpenAI Compatibility**: Full OpenAI chat completions API compatibility
- **Browser Automation**: Advanced web interaction capabilities
- **MCP Integration**: Model Context Protocol support for extended tool connectivity

## Installation Methods

### Package Managers
| Method | Command |
|--------|---------|
| npm | `npm install @agentforce/adk` |
| JSR (for TypeScript projects) | `npx jsr add @agentforce/adk` |
| Bun | `bun add @agentforce/adk` |

### Runtime Support
- **Node.js**: Via npm or JSR
- **Deno**: Via JSR
- **Bun**: Via npm or JSR
- **Browsers**: Works with bundlers like Vite, Webpack, or Rollup

## Getting Started

Here's a basic example of creating and running an agent:

```typescript
import { AgentForceAgent } from "@agentforce/adk";

// Create and configure your agent
const agent = new AgentForceAgent({ name: "StoryTellerAgent" })
  .useLLM("ollama", "gemma3:4b") 
  .systemPrompt("You are a creative story writer.")
  .prompt("Write a short story about AI and humanity.");

// Run the agent and get response
const response = await agent.output("md");
console.log(response);
```

## Tool Ecosystem

Agentforce ADK comes with a rich set of built-in tools:

### File System Tools
- `fs_read_file`: Read file contents
- `fs_write_file`: Write to files  
- `fs_list_dir`: Directory listing
- `fs_move_file`: Move/rename files
- `fs_find_files`: File pattern search
- `fs_get_file_tree`: Complete file tree structure

### Web and API Tools
- `web_fetch`: Web scraping with JavaScript rendering
- `api_fetch`: HTTP requests with security limits
- `filter_content`: Content filtering
- `browser_use`: Advanced browser automation

### Git and GitHub Tools
- `gh_list_repos`: GitHub repository listing

### System and Utility Tools
- `os_exec`: System command execution
- `md_create_ascii_tree`: Markdown ASCII trees

## MCP Integration

Agentforce ADK supports Model Context Protocol (MCP) for connecting to external tools and services. You can configure MCP servers in `mcp.config.json` and enable them for agents:

```typescript
const agent = new AgentForceAgent({
  name: "MCPAgent",
  mcps: ["filesystem", "github"] // Connect to these MCP servers
})
.useLLM("openrouter", "glm-4.5v")
.prompt("List files in /tmp and show my GitHub repositories");

await agent.run();
```

## Current Status and Roadmap

### Current Version: Beta
The project is in early development and not yet production-ready. It's intended for testing and experimentation.

### Completed Features (MVP)
✅ Method chaining with fluent interface
✅ Multiple output formats
✅ Server deployment capabilities  
✅ Comprehensive testing
✅ Ollama and OpenRouter support
✅ Tool integration and function calling

### Coming Soon (until v1.0.0)
⏳ Streaming responses
⏳ Multi-agent workflows
⏳ Advanced error handling
⏳ More AI provider support
⏳ Enhanced debugging tools
⏳ MCP Server Integration
⏳ AgentForceZone CLI and marketplace

Would you like me to elaborate on any specific aspect of the Agentforce ADK, such as installation details, example usage, or tool implementations?