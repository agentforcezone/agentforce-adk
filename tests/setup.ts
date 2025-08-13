// Jest setup file
// Global test configuration and mocks

// Mock puppeteer modules
jest.mock("puppeteer-extra");
jest.mock("puppeteer-extra-plugin-stealth");

// Mock modules that use import.meta
jest.mock("../lib/agent/functions/skills", () => ({
  loadSkills: jest.fn().mockResolvedValue(""),
}));

jest.mock("../lib/agent/functions/tools", () => ({
  loadTools: jest.fn().mockReturnValue([]),
}));

// Note: We don't mock execute.ts here since we want to test it directly

// Mock utility functions
jest.mock("../lib/utils/truncate", () => ({
  truncate: jest.fn((text: string, length: number) => 
    text.length > length ? text.substring(0, length) + "..." : text
  ),
}));

// Mock provider modules to avoid type issues
const createMockProvider = (defaultResponse: string) => ({
  generate: jest.fn().mockResolvedValue(defaultResponse),
  generateWithTools: jest.fn().mockResolvedValue(`${defaultResponse} with tools`),
  chat: jest.fn().mockResolvedValue(`${defaultResponse} chat`),
  chatWithTools: jest.fn().mockResolvedValue(`${defaultResponse} chat with tools`),
  getModel: jest.fn().mockReturnValue("mock-model"),
  setModel: jest.fn(),
});

// Mock providers
jest.mock("../lib/provider/ollama", () => ({
  OllamaProvider: jest.fn().mockImplementation(() => createMockProvider("Ollama mock response"))
}));

jest.mock("../lib/provider/openrouter", () => ({
  OpenRouterProvider: jest.fn().mockImplementation(() => createMockProvider("OpenRouter mock response"))
}));

jest.mock("../lib/provider/google", () => ({
  GoogleProvider: jest.fn().mockImplementation(() => createMockProvider("Google mock response"))
}));

// Mock tooluse
jest.mock("../lib/provider/ollama-tooluse", () => ({
  OllamaToolUseProvider: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue("mock response"),
    chat: jest.fn().mockResolvedValue("mock response"),
    getModel: jest.fn().mockReturnValue("mock-model"),
    setModel: jest.fn(),
  }))
}));

jest.mock("../lib/provider/openrouter-tooluse", () => ({
  OpenRouterToolUseProvider: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockResolvedValue("mock response"),
    chat: jest.fn().mockResolvedValue("mock response"),
    getModel: jest.fn().mockReturnValue("mock-model"),
    setModel: jest.fn(),
  }))
}));

// Mock fs operations for testing
jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn((path: string) => {
    if (path.includes(".hbs")) {
      return "Hello {{name}}, your role is {{role}}!";
    }
    return "Mock template content";
  }),
  writeFileSync: jest.fn(),
}));

// Mock fs/promises for saveToFile function
jest.mock("fs/promises", () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// Mock path operations - ensure proper implementation that actually works
const actualPath = require("path");
jest.mock("path", () => ({
  join: jest.fn((...paths: string[]) => {
    // Ensure we return a proper path
    return paths.filter(Boolean).join("/");
  }),
  extname: jest.fn((path: string) => {
    // Use the actual Node.js path.extname implementation for correctness
    if (typeof path !== 'string') return '';
    const lastDot = path.lastIndexOf('.');
    const lastSlash = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    if (lastDot === -1 || lastDot <= lastSlash) return '';
    return path.substring(lastDot);
  }),
  resolve: jest.fn((basePath: string, relativePath: string) => `${basePath}/${relativePath}`),
  dirname: jest.fn((path: string) => actualPath.dirname(path)),
}));

// Mock Handlebars for template testing
jest.mock("handlebars", () => ({
  compile: jest.fn((template: string) => {
    return jest.fn((data: any) => `Compiled: ${template} with ${JSON.stringify(data)}`);
  })
}));

// Mock environment variables that may be needed
process.env.OPENROUTER_API_KEY = "test-key";
process.env.GOOGLE_GENAI_API_KEY = "test-key";

// Suppress all error outputs in tests by setting LOG_LEVEL to silent
process.env.LOG_LEVEL = "silent";

// Mock process.stderr.write globally to suppress any remaining error outputs
const originalStderrWrite = process.stderr.write;
const originalStdoutWrite = process.stdout.write;

beforeAll(() => {
    process.stderr.write = jest.fn(() => true) as any;
    process.stdout.write = jest.fn(() => true) as any;
});

afterAll(() => {
    process.stderr.write = originalStderrWrite;
    process.stdout.write = originalStdoutWrite;
});