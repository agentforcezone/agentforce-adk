# AGENTS.md - AgentForce ADK Developer Guide

This file guides agentic coding agents working in this repository.

## Build, Test, and Quality Commands

### Testing
```bash
bun run test                    # Run all tests with Jest
bun run test:cov                # Run with coverage report
bun run test:watch              # Watch mode for TDD
npx jest tests/agent.test.ts --runInBand    # Run single test file
npx jest agent --runInBand                      # Run tests matching pattern
```

### Linting and Type Checking
```bash
bun run lint                    # ESLint check
bun run lint:fix                # Auto-fix linting issues
bun run lint:check              # Lint with zero warnings tolerance
npx tsc --noEmit                # Type check without emitting files
npx tsc -p tsconfig.json        # Generate type declarations to dist/
```

### Examples
```bash
bun run agent:integration       # Run browser automation agent
bun run agent:mcp               # Run MCP-enabled agent
bun run server:basic            # Run basic server example
```

## Code Style Guidelines

### Import Style
- Use **type-only imports** for type annotations only:
  ```typescript
  import type { AgentForceAgent } from "../../agent";
  import type { ModelConfig } from "../../types";
  ```
- Use **regular imports** when using code at runtime:
  ```typescript
  import { SomeClass } from "../../some-module";
  ```

### String and Formatting
- **Double quotes** for all imports and string literals
- **Semicolons** required
- **Trailing commas** in multiline arrays/objects
- **4 spaces** for indentation

### TypeScript and Types
- **No underscore prefix** on private members - use `private` keyword
- Use `type` for type unions/aliases, `interface` for object shapes
- Strict mode enabled in tsconfig.json
- Prefer explicit return types for exported functions

### Naming Conventions
- **camelCase** for variables, functions, methods
- **PascalCase** for classes, interfaces, types
- **UPPER_SNAKE_CASE** for constants
- **Descriptive names** - avoid abbreviations

### Error Handling
- **CRITICAL**: Prefer `logger.error()` over `throw` for runtime errors
- Use `throw` only for input validation (programming errors)
- NEVER use `console.*` methods - always use logger instance
- Example:
  ```typescript
  // Runtime error - use logger
  try {
    await readFile(path);
  } catch (error) {
    logger.error({ path, error }, "Failed to read file");
    return;
  }

  // Input validation - throw
  if (!path || path.trim() === "") {
    throw new Error("Path cannot be empty");
  }
  ```

### Method Implementation Pattern
- Chainable methods return `this` and use `.bind(this)` pattern
- Create method in `lib/agent/methods/` or `lib/server/routes/`
- Export from `lib/agent/mod.ts` or `lib/server/mod.ts`
- Bind in main class: `methodName: () => AgentForceAgent = methodName.bind(this)`
- Include JSDoc with @memberof and @example

### Documentation
- JSDoc comments for all public APIs with `@example` blocks
- Document parameters with `@param {Type} name description`
- Document return values with `@returns {Type} description`

### Architecture Patterns
- **No transpilation** - ship TypeScript source files directly
- **ESM only** - all modules use `"type": "module"`
- **Method chaining** - fluent interface pattern for agents
- **Protected accessors** - use bracket notation for external class access:
  ```typescript
  const name = agent["getName"]();
  ```

### Testing
- Test files mirror lib structure in `tests/`
- Use Jest with `ts-jest` ESM preset
- Mock external dependencies (Puppeteer, etc.)
- Minimum 90% line coverage target

## Key Files
- `lib/mod.ts` - Main entry point, exports all public APIs
- `lib/agent.ts` - Core AgentForceAgent class
- `lib/types.ts` - All type definitions
- `lib/tools/` - Modular tool registry
- `tests/` - Jest test files (mirror lib structure)
