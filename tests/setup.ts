// Jest setup file for AgentForce ADK tests

// Mock console methods to avoid noisy test output
global.console = {
  ...console,
  // Uncomment these lines if you want to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Increase timeout for longer running tests
jest.setTimeout(30000);

// Set up environment variables for testing
process.env.NODE_ENV = "test";