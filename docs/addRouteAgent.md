# addRouteAgent Method

The `addRouteAgent` method allows you to dynamically add different agents to handle specific HTTP routes in your AgentForce server. This enables you to create specialized endpoints where each route is handled by an agent optimized for that specific task.

## Features

- ✅ **Multiple HTTP Methods**: Supports GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS
- ✅ **Method Chaining**: Chainable with other server methods
- ✅ **Agent Specialization**: Different agents can handle different routes
- ✅ **Automatic Route Registration**: Routes are automatically registered with the Hono server
- ✅ **Request Validation**: Validates request data and provides helpful error messages
- ✅ **JSON Response Format**: Standardized response format with metadata
- ✅ **Comprehensive Logging**: Detailed logging for debugging and monitoring

## Basic Usage

```typescript
import AgentForceServer, { type ServerConfig } from "@lib/server";
import AgentForceAgent, { type AgentConfig } from "@lib/agent";

// Create agents for different purposes
const storyAgent = new AgentForceAgent({ name: "StoryAgent", type: "creative-writer" })
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a creative writing agent.");

const imageAgent = new AgentForceAgent({ name: "ImageAgent", type: "visual-description" })
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a visual description agent.");

// Create server and add route agents
const server = new AgentForceServer({ name: "MultiAgentServer", logger: "json" })
    .addRouteAgent("POST", "/story", storyAgent)
    .addRouteAgent("GET", "/image", imageAgent)
    .serve("localhost", 3000);
```

## Method Signature

```typescript
addRouteAgent(method: string, path: string, agent: AgentForceAgent): AgentForceServer
```

### Parameters

- **method** (string): HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **path** (string): Route path (e.g., "/story", "/image")
- **agent** (AgentForceAgent): The agent instance to handle requests for this route

### Returns

Returns the AgentForceServer instance for method chaining.

## Request Format

### POST/PUT/PATCH Requests

Send JSON data with a `prompt` field:

```bash
curl -X POST http://localhost:3000/story \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create a story about a brave robot"}'
```

### GET Requests

Use query parameters with a `prompt` field:

```bash
curl "http://localhost:3000/image?prompt=describe%20a%20futuristic%20city"
```

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    "agent": "StoryAgent",
    "provider": "ollama",
    "model": "gemma3:4b",
    "systemPrompt": "You are a creative writing agent.",
    "userPrompt": "create a story about a brave robot",
    "response": "Generated response from the agent...",
    "chatHistory": [...],
    "timestamp": "2025-07-12T21:34:48.012Z",
    "status": "success"
  },
  "metadata": {
    "method": "POST",
    "path": "/story",
    "prompt": "create a story about a brave robot",
    "timestamp": "2025-07-12T21:34:48.012Z",
    "agent": {
      "name": "AgentForce Agent",
      "type": "route-agent"
    }
  }
}
```

## Error Handling

### Missing Prompt

```json
{
  "error": "Missing or invalid prompt",
  "message": "Request must include a \"prompt\" field with a string value",
  "example": { "prompt": "create a story for an auth service in bun" }
}
```

### Invalid JSON (POST/PUT/PATCH)

```json
{
  "error": "Invalid JSON in request body",
  "message": "Please provide valid JSON data"
}
```

### Server Errors

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error description...",
  "metadata": {
    "method": "POST",
    "path": "/story",
    "timestamp": "2025-07-12T21:34:48.012Z"
  }
}
```

## Advanced Example

```typescript
// Create specialized agents
const productOwnerAgent = new AgentForceAgent({
    name: "ProductOwnerAgent",
    type: "product-owner-agent"
}).useLLM("ollama", "gemma3:4b")
  .systemPrompt("You are a product owner agent. Create user stories and product requirements.");

const techLeadAgent = new AgentForceAgent({
    name: "TechLeadAgent", 
    type: "tech-lead-agent"
}).useLLM("ollama", "gemma3:4b")
  .systemPrompt("You are a technical lead. Provide technical architecture and implementation guidance.");

const designerAgent = new AgentForceAgent({
    name: "DesignerAgent",
    type: "ux-designer-agent"
}).useLLM("ollama", "gemma3:4b")
  .systemPrompt("You are a UX designer. Create user interface designs and user experience guidance.");

// Create server with multiple specialized routes
const server = new AgentForceServer({
    name: "ProductDevelopmentServer",
    logger: "json"
})
    .addRouteAgent("POST", "/user-story", productOwnerAgent)
    .addRouteAgent("POST", "/architecture", techLeadAgent)
    .addRouteAgent("POST", "/design", designerAgent)
    .addRouteAgent("GET", "/user-story", productOwnerAgent)
    .addRouteAgent("GET", "/architecture", techLeadAgent)
    .addRouteAgent("GET", "/design", designerAgent)
    .serve("localhost", 3000);
```

## Testing

Test the routes using curl or any HTTP client:

```bash
# Test user story creation
curl -X POST http://localhost:3000/user-story \
  -H "Content-Type: application/json" \
  -d '{"prompt": "create user stories for a real-time chat application"}'

# Test architecture guidance
curl -X POST http://localhost:3000/architecture \
  -H "Content-Type: application/json" \
  -d '{"prompt": "design the architecture for a scalable microservices system"}'

# Test design guidance
curl -X POST http://localhost:3000/design \
  -H "Content-Type: application/json" \
  -d '{"prompt": "design a mobile-first dashboard for analytics"}'
```

## Validation Rules

- **HTTP Method**: Must be one of: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Path**: Must be a non-empty string, automatically prefixed with "/" if not present
- **Agent**: Must be a valid AgentForceAgent instance
- **Prompt**: Required in request data, must be a non-empty string

## Built-in Routes

The server automatically includes these built-in routes:

- **GET /**: Server status and information
- **GET /health**: Health check endpoint

## Logging

The method provides comprehensive logging:

```json
{
  "level": 30,
  "time": 1752355952332,
  "serverName": "MultiAgentServer",
  "method": "POST",
  "path": "/story",
  "agentName": "AgentForce Agent",
  "action": "route_agent_added",
  "msg": "Adding route agent: POST /story"
}
```

## Method Chaining

The `addRouteAgent` method is chainable, allowing you to build complex server configurations:

```typescript
const server = new AgentForceServer(config)
    .addRouteAgent("POST", "/endpoint1", agent1)
    .addRouteAgent("GET", "/endpoint2", agent2)
    .addRouteAgent("PUT", "/endpoint3", agent3)
    .serve("localhost", 3000);
```

## Use Cases

1. **Multi-Agent API**: Different agents for different business domains
2. **Specialized Endpoints**: Each endpoint optimized for specific tasks
3. **Microservices Pattern**: Route-based agent specialization
4. **A/B Testing**: Different agents for the same endpoint
5. **Progressive Enhancement**: Add new agents/routes without changing existing ones
