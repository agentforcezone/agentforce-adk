# addRoute Method Documentation

## Overview

The `addRoute` method allows you to add static routes to your AgentForceServer that return predefined data without requiring an AI agent. This is perfect for health checks, status endpoints, webhooks, and other utility routes.

## Syntax

```typescript
.addRoute(method: string, path: string, responseData: any): AgentForceServer
```

## Parameters

- **method** (string): HTTP method (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- **path** (string): Route path (automatically normalized to start with `/`)
- **responseData** (any): Data to return - can be object, function, or primitive value

## Usage Examples

### Basic Static Data

```typescript
import { AgentForceServer, type ServerConfig } from "@agentforce/adk";

const serverConfig: ServerConfig = {
    name: "MyServer",
    logger: "json",
};

new AgentForceServer(serverConfig)
    .addRoute("GET", "/health", {"status": "ok"})
    .addRoute("GET", "/version", {"version": "1.0.0"})
    .addRoute("POST", "/webhook", {"received": true})
    .serve("localhost", 3000);
```

### Dynamic Data with Functions

```typescript
new AgentForceServer(serverConfig)
    .addRoute("GET", "/time", () => ({
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    }))
    .addRoute("POST", "/echo", (context) => ({
        received: true,
        method: context.req.method,
        url: context.req.url,
        timestamp: new Date().toISOString()
    }))
    .serve("localhost", 3000);
```

### Method Chaining

The `addRoute` method is chainable and can be combined with other server methods:

```typescript
new AgentForceServer(serverConfig)
    .addRoute("GET", "/health", {"status": "ok"})
    .addRouteAgent("POST", "/story", storyAgent)
    .useOpenAICompatibleRouting(openaiAgent)
    .addRoute("GET", "/ready", {"ready": true})
    .serve("localhost", 3000);
```

## Features

### Route Conflict Prevention

The server automatically prevents conflicts with default routes. If you define a custom `/health` route, it will override the default health check endpoint.

### HTTP Method Validation

Only valid HTTP methods are accepted:
- GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS

### Path Normalization

Paths are automatically normalized:
- `"health"` becomes `"/health"`
- `"/health"` remains `"/health"`

### Response Types

The `responseData` parameter accepts various types:

1. **Objects**: Returned as JSON
   ```typescript
   .addRoute("GET", "/status", {status: "running", port: 3000})
   ```

2. **Functions**: Called when route is accessed
   ```typescript
   .addRoute("GET", "/time", () => ({timestamp: Date.now()}))
   ```

3. **Functions with Context**: Access request context
   ```typescript
   .addRoute("POST", "/echo", (context) => ({
       method: context.req.method,
       headers: Object.fromEntries(context.req.headers.entries())
   }))
   ```

4. **Primitives**: Numbers, strings, booleans
   ```typescript
   .addRoute("GET", "/count", 42)
   .addRoute("GET", "/message", "Hello World")
   .addRoute("GET", "/enabled", true)
   ```

### Async Functions

Async functions are automatically handled:

```typescript
.addRoute("GET", "/async-data", async (context) => {
    const data = await fetchSomeData();
    return {data, timestamp: new Date().toISOString()};
})
```

## Error Handling

The method includes comprehensive error handling:

- **Invalid HTTP method**: Throws error with valid methods list
- **Missing path**: Throws error requiring non-empty string
- **Missing response data**: Throws error requiring some data

## Logging

All routes are logged when added and when registered with the server:

```json
{
  "level": 30,
  "serverName": "MyServer",
  "method": "GET",
  "path": "/health",
  "action": "static_route_added",
  "msg": "Adding static route: GET /health"
}
```

## Integration with AgentForce Agents

Static routes work seamlessly alongside AI agent routes:

```typescript
new AgentForceServer(serverConfig)
    // Static utility routes
    .addRoute("GET", "/health", {"status": "ok"})
    .addRoute("GET", "/version", {"version": "1.0.0"})
    
    // AI agent routes
    .addRouteAgent("POST", "/story", storyAgent)
    .useOpenAICompatibleRouting(chatAgent)
    
    // More static routes
    .addRoute("POST", "/webhook", {"received": true})
    
    .serve("localhost", 3000);
```

## Testing

The implementation includes comprehensive tests covering:
- Method chaining
- Route validation
- HTTP method validation
- Path normalization
- Response data types
- Error handling
- Multiple route registration

Run tests with:
```bash
bun test tests/addRoute.test.ts
```

## Best Practices

1. **Use descriptive paths**: `/health`, `/version`, `/status` instead of `/h`, `/v`, `/s`
2. **Return consistent data structures**: Always include timestamp for dynamic routes
3. **Handle errors gracefully**: Use try-catch in function responses for external calls
4. **Keep responses lightweight**: Avoid large data payloads for health checks
5. **Use appropriate HTTP methods**: GET for data retrieval, POST for data submission

## Example Use Cases

### Health Check Endpoint
```typescript
.addRoute("GET", "/health", {"status": "healthy", "version": "1.0.0"})
```

### API Version Information
```typescript
.addRoute("GET", "/version", {
    "version": "1.0.0",
    "build": "abc123",
    "environment": "production"
})
```

### Webhook Receiver
```typescript
.addRoute("POST", "/webhook", (context) => ({
    "received": true,
    "timestamp": new Date().toISOString(),
    "source": context.req.header("user-agent")
}))
```

### Status Dashboard Data
```typescript
.addRoute("GET", "/stats", () => ({
    "uptime": process.uptime(),
    "memory": process.memoryUsage(),
    "timestamp": new Date().toISOString()
}))
```
