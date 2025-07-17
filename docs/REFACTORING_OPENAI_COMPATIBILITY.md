# AgentForce ADK OpenAI Compatibility Refactoring

## Overview

This document describes the refactoring of the AgentForce ADK server to properly separate OpenAI-compatible functionality from legacy custom endpoint handling.

## Changes Made

### 1. New OpenAI-Compatible Method: `useOpenAICompatibleRouting()`

- **File**: `lib/server/methods/runOpenAICompatibleAgent.ts`
- **Purpose**: Dedicated method for creating OpenAI-compatible chat completion endpoints
- **Route**: Automatically registers the agent to handle `POST /v1/chat/completions`
- **Features**:
  - Full OpenAI chat completion request validation
  - Multi-modal message support (text and images)
  - Conversation context formatting
  - Dynamic model/provider parsing from request
  - OpenAI-compatible response format

### 2. Simplified `addRouteAgent()` Method

- **File**: `lib/server/methods/addRouteAgent.ts`
- **Purpose**: Handles custom/legacy endpoint formats only
- **Changes**:
  - Removed all OpenAI-specific logic
  - Simplified to handle only `{ "prompt": "text" }` format
  - Supports GET (query params) and POST/PUT/PATCH (JSON body)
  - Returns custom response format with success/error information

### 3. Updated Server Registration

- **File**: `lib/server.ts`
- **Changes**:
  - Added `useOpenAICompatibleRouting` as a chainable method
  - Imported OpenAI-specific types and functions

### 4. Smart Route Handling

- **File**: `lib/server/methods/serve.ts`
- **Changes**:
  - Automatically detects OpenAI-compatible routes (`/v1/chat/completions`)
  - Uses appropriate handler based on route type
  - Improved logging with route type information

## Usage Examples

### OpenAI-Compatible Endpoint

```typescript
import { AgentForceAgent, AgentForceServer } from "@agentforce/adk";

const agent = new AgentForceAgent({ name: "MyAgent", type: "openai-compatible-agent" })
    .useLLM("ollama", "gemma3:4b")
    .systemPrompt("You are a helpful assistant.");

new AgentForceServer({ name: "MyServer", logger: "json" })
    .useOpenAICompatibleRouting(agent)  // Registers POST /v1/chat/completions
    .serve("0.0.0.0", 3001);
```

**Request Format:**
```bash
curl -X POST http://localhost:3001/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "ollama/gemma3:4b",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

**Response Format:**
```json
{
  "id": "chatcmpl-1752743220991",
  "object": "chat.completion",
  "created": 1752743220,
  "model": "ollama/gemma3:4b",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 50,
    "total_tokens": 75
  }
}
```

### Legacy Custom Endpoint

```typescript
new AgentForceServer({ name: "MyServer", logger: "json" })
    .addRouteAgent("POST", "/story", agent)  // Custom endpoint
    .addRouteAgent("GET", "/story", agent)   // Custom endpoint
    .serve("0.0.0.0", 3001);
```

**POST Request Format:**
```bash
curl -X POST http://localhost:3001/story \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a story about AI"}'
```

**GET Request Format:**
```bash
curl "http://localhost:3001/story?prompt=Write+a+story+about+AI"
```

**Response Format:**
```json
{
  "success": true,
  "method": "POST",
  "path": "/story", 
  "agentName": "MyAgent",
  "agentType": "openai-compatible-agent",
  "prompt": "Write a story about AI",
  "response": "Once upon a time..."
}
```

## Benefits

1. **Clear Separation**: OpenAI and custom formats are handled by separate, specialized functions
2. **Better Maintainability**: Each handler focuses on one specific format
3. **Improved Logging**: Route type is clearly identified in logs
4. **Backwards Compatibility**: Existing custom endpoints continue to work unchanged
5. **Standards Compliance**: Full OpenAI chat completion API compatibility
6. **Flexibility**: Can mix both endpoint types in the same server

## Migration Guide

### For New Projects
- Use `.useOpenAICompatibleRouting()` for OpenAI-compatible endpoints
- Use `.addRouteAgent()` for custom application-specific endpoints

### For Existing Projects
- No changes required for existing `.addRouteAgent()` usage
- Add `.useOpenAICompatibleRouting()` to enable OpenAI compatibility

## File Structure

```
lib/server/methods/
├── addRouteAgent.ts           # Legacy/custom endpoint handler
├── runOpenAICompatibleAgent.ts # OpenAI-compatible endpoint handler
└── serve.ts                   # Smart route registration logic
```

## Testing

The refactoring has been tested with:
- ✅ OpenAI chat completion requests (`/v1/chat/completions`)
- ✅ Legacy POST requests with JSON body
- ✅ Legacy GET requests with query parameters
- ✅ Multiple agents on different routes
- ✅ Proper error handling and validation
- ✅ Logging and route type identification

## Future Enhancements

- Support for streaming responses in OpenAI format
- Function calling support
- Enhanced multimodal capabilities
- Additional OpenAI API endpoints (embeddings, etc.)
