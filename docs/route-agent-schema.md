# Route Agent Schema Support

The AgentForce ADK now supports dynamic input and output schemas for the `.addRouteAgent()` method, allowing you to customize how your endpoints handle requests and format responses with **strict validation**.

## Overview

By default, route agents expect a `prompt` field in the request and return a comprehensive response object. With schemas, you can:

- Define custom input fields beyond just `prompt`
- **Enforce strict validation** - all schema-defined fields become required
- Control which fields are included in the response
- Reject requests with unexpected fields when using schemas
- Maintain backward compatibility with existing endpoints (no schema = flexible validation)

## Validation Modes

### Legacy Mode (No Schema)
- Only `prompt` is required
- Additional fields are accepted and ignored
- Backward compatible with existing implementations

### Strict Mode (With Schema)
- **All fields defined in `input` array are required** (except `prompt` which is always required)
- **Unexpected fields are rejected** with HTTP 400 error
- Provides clear error messages for missing or unexpected fields

## Basic Usage

### Without Schema (Legacy Behavior)

```typescript
server.addRouteAgent("POST", "/create-story", StoryAgent)
```

**Default Input:** `["prompt"]` (required)

**Default Output:** 
```json
{
  "success": true,
  "method": "POST",
  "path": "/create-story",
  "agentName": "StoryAgent",
  "agentType": "story-agent",
  "prompt": "create a story for an auth service",
  "response": "Generated story content..."
}
```

### With Custom Schema

```typescript
const schema: RouteAgentSchema = {
    input: ["prompt", "project_name", "priority"],
    output: ["success", "prompt", "response", "project_name", "priority"]
};

server.addRouteAgent("POST", "/create-user-story", StoryAgent, schema)
```

**Custom Input:** `["prompt", "project_name", "priority"]`

**Custom Output:**
```json
{
  "success": true,
  "prompt": "create a user story for login feature",
  "response": "Generated user story...",
  "project_name": "AuthService",
  "priority": "high"
}
```

## Schema Configuration

### RouteAgentSchema Interface

```typescript
interface RouteAgentSchema {
    input?: string[];   // Optional: defaults to ["prompt"]
    output?: string[];  // Optional: defaults to full response
}
```

### Input Fields

- **`prompt`** is always required and will be automatically added if not present
- **When using a schema**: All fields in the `input` array become **required**
- **When using a schema**: Requests with unexpected fields (not in `input` array) are **rejected**
- **Without a schema**: Additional input fields are accepted but ignored (legacy behavior)
- All input fields can be provided in the request body (POST/PUT/PATCH) or query parameters (GET/DELETE)

### Output Fields

Available output fields include:
- `success` - Boolean indicating request success
- `method` - HTTP method used
- `path` - Route path
- `agentName` - Name of the agent
- `agentType` - Type of the agent
- `prompt` - The original prompt
- `response` - The agent's response
- Any custom input fields that were provided in the request

## Examples

### 1. Minimal Schema (Only Response)

```typescript
const minimalSchema: RouteAgentSchema = {
    output: ["success", "response"]
};

server.addRouteAgent("POST", "/minimal", Agent, minimalSchema);
```

**Response:**
```json
{
  "success": true,
  "response": "Agent response..."
}
```

### 2. Extended Input Schema (Strict Validation)

```typescript
const extendedSchema: RouteAgentSchema = {
    input: ["prompt", "user_id", "project_id", "priority", "assignee"],
    output: ["success", "response", "user_id", "project_id", "priority", "assignee"]
};

server.addRouteAgent("POST", "/create-task", TaskAgent, extendedSchema);
```

**Valid Request:**
```json
{
  "prompt": "Create a new authentication task",
  "user_id": "12345",
  "project_id": "auth-service",
  "priority": "high",
  "assignee": "john.doe"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Authentication task created...",
  "user_id": "12345",
  "project_id": "auth-service",
  "priority": "high",
  "assignee": "john.doe"
}
```

**Invalid Request (Missing Required Field):**
```json
{
  "prompt": "Create a new authentication task",
  "user_id": "12345"
  // Missing: project_id, priority, assignee
}
```

**Error Response:**
```json
{
  "error": "Missing required fields",
  "message": "The following required fields are missing: project_id, priority, assignee",
  "missingFields": ["project_id", "priority", "assignee"],
  "expectedFields": ["prompt", "user_id", "project_id", "priority", "assignee"],
  "providedFields": ["prompt", "user_id"]
}
```

**Invalid Request (Unexpected Field):**
```json
{
  "prompt": "Create a new authentication task",
  "user_id": "12345",
  "project_id": "auth-service",
  "priority": "high",
  "assignee": "john.doe",
  "unexpected_field": "not_allowed"
}
```

**Error Response:**
```json
{
  "error": "Unexpected fields in request",
  "message": "The following fields are not allowed: unexpected_field",
  "unexpectedFields": ["unexpected_field"],
  "expectedFields": ["prompt", "user_id", "project_id", "priority", "assignee"],
  "providedFields": ["prompt", "user_id", "project_id", "priority", "assignee", "unexpected_field"]
}
```

### 3. Default Values and Normalization

```typescript
// Empty schema uses defaults
const defaultSchema: RouteAgentSchema = {};

// Equivalent to:
const equivalentSchema: RouteAgentSchema = {
    input: ["prompt"],
    output: ["success", "method", "path", "agentName", "agentType", "prompt", "response"]
};
```

### 4. Schema with Custom Fields Only

```typescript
const customSchema: RouteAgentSchema = {
    input: ["prompt", "custom_param"],
    output: ["response", "custom_param"]  // No standard fields
};
```

## Request Examples

### POST Request with Extended Schema

```bash
curl -X POST http://localhost:3000/create-user-story \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a user story for login feature",
    "project_name": "AuthService",
    "priority": "high"
  }'
```

### GET Request with Query Parameters

```bash
curl "http://localhost:3000/user-story?prompt=Create%20a%20simple%20story&project_name=MyProject"
```

## Method Chaining

Schemas work seamlessly with method chaining:

```typescript
const userStorySchema: RouteAgentSchema = {
    input: ["prompt", "project_name", "priority"],
    output: ["success", "response", "project_name", "priority"]
};

const simpleSchema: RouteAgentSchema = {
    output: ["success", "response"]
};

new AgentForceServer(config)
    .addRouteAgent("POST", "/create-story", StoryAgent, userStorySchema)
    .addRouteAgent("GET", "/health-check", HealthAgent, simpleSchema)
    .addRouteAgent("POST", "/legacy-endpoint", LegacyAgent) // No schema
    .serve();
```

## Error Handling

### Missing Required Fields (Schema Mode)

When using a schema, all fields in the `input` array are required:

```json
{
  "error": "Missing required fields",
  "message": "The following required fields are missing: project_name, priority",
  "missingFields": ["project_name", "priority"],
  "expectedFields": ["prompt", "project_name", "priority"],
  "providedFields": ["prompt"]
}
```

### Unexpected Fields (Schema Mode)

When using a schema, unexpected fields are rejected:

```json
{
  "error": "Unexpected fields in request",
  "message": "The following fields are not allowed: key",
  "unexpectedFields": ["key"],
  "expectedFields": ["prompt", "project_name", "priority"],
  "providedFields": ["prompt", "project_name", "priority", "key"]
}
```

### Missing Required Fields (Legacy Mode)

If the `prompt` field is missing (regardless of schema):

```json
{
  "error": "Missing or invalid prompt",
  "message": "Request must include a \"prompt\" field with a string value",
  "example": { "prompt": "create a story for an auth service in bun" },
  "expectedFields": ["prompt", "project_name", "priority"]
}
```

### Invalid JSON

```json
{
  "error": "Invalid JSON in request body",
  "message": "Please provide valid JSON data"
}
```

## Best Practices

1. **Use schemas for strict APIs**: When you need controlled input validation
2. **Use legacy mode for flexible APIs**: When you want to accept optional parameters
3. **Keep schemas simple**: Only include fields you actually need and validate
4. **Use consistent field names**: Maintain naming conventions across your API
5. **Document your schemas**: Include examples in your API documentation
6. **Validate input types**: Consider adding additional validation in your agent logic
7. **Plan for schema evolution**: Design schemas that can be extended without breaking existing clients

## Validation Behavior Summary

| Mode | Schema Defined | Required Fields | Unexpected Fields | Use Case |
|------|----------------|-----------------|-------------------|----------|
| **Legacy** | No | `prompt` only | Accepted & ignored | Backward compatibility, flexible APIs |
| **Strict** | Yes | All schema `input` fields | Rejected with error | Controlled APIs, strict validation |

## Migration Guide

To migrate existing endpoints to use schemas:

1. **Start with default behavior**: Add schema parameter as `undefined` initially
2. **Gradually customize**: Add custom fields one at a time
3. **Test thoroughly**: Ensure existing clients continue to work
4. **Update documentation**: Document the new schema requirements

```typescript
// Before
.addRouteAgent("POST", "/endpoint", Agent)

// After (gradual migration)
.addRouteAgent("POST", "/endpoint", Agent, undefined) // Same as before
.addRouteAgent("POST", "/endpoint", Agent, { output: ["success", "response"] }) // Simplified output
.addRouteAgent("POST", "/endpoint", Agent, { 
    input: ["prompt", "new_field"], 
    output: ["success", "response", "new_field"] 
}) // Extended functionality
```
