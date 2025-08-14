# Changelog

All notable changes to the AgentForce ADK project will be documented in this file.

## [0.10.0] - 2025-08-14

### Added
- Content filter tool and improved file save formats
- HTML, JSON, Markdown, and YAML output utilities
- Configurable asset path for agent skills

### Fixed
- Expanded agent and server route handler tests

### Changed
- Updated Examples for the Integration Agent
- Updated all tests to the Jest Test Runner
- Changed TestRunner from bun:test to jest

## [0.9.0] - 2025-08-09

### Added
- Tool usage capabilities for agents
- Enhanced server and workflow functions
- Updated test directory structure
- New examples showcasing advanced features

### Fixed
- JSR warning issues resolved

### Changed
- Updated JSR version synchronization

## [0.8.0] - 2025-07-29

### Added
- OpenRouter provider integration
- Basic documentation pages
- Comprehensive workflow and server implementation
- New examples and test coverage improvements

### Changed
- Updated JSR configuration
- Enhanced test coverage and examples

## [0.6.0] - 2025-07-17

### Added
- New server methods for enhanced routing capabilities
- Schema validation for addRouteAgent method
- Updated integration test server

### Changed
- Improved routing functionality

## [0.5.0] - 2025-07-16

### Added
- OpenAI compatible route handling
- Enhanced server functionality

### Changed
- Version bump and compatibility improvements

## [0.4.0] - 2025-07-15

### Added
- Template support with withTemplate method
- npm and JSR publish integration
- README updates and project cleanup

### Changed
- Export structure improvements
- Explicit typing for methods
- Removed lib alias for JSR compatibility

### Fixed
- Type definitions cleanup
- ESLint integration and fixes

## [0.3.0] - 2025-07-12

### Added
- AgentForceServer base class
- Docker support for local server deployment
- Kubernetes deployment configuration
- RouteAgent functionality
- Enhanced logging with pino logger

### Changed
- Server architecture refactoring
- Improved saveToFile functionality
- Node.js compatibility enhancements

## [0.2.0] - 2025-06-18

### Added
- Hono web framework integration
- saveToFile method for AgentForceAgent
- Models endpoint with Ollama list functionality
- Route handling for individual models
- Custom logger for routes
- Logger integration in AgentConfig and AgentForceAgent

### Fixed
- Ollama model ID handling improvements

## [0.1.0] - 2025-06-16

### Added
- Initial AgentForceAgent implementation
- AgentForce License
- JSDOC documentation
- Core methods: useLLM, systemPrompt, prompt, output
- Basic type system setup
- Ollama provider integration
- Protected execute function
- Method chaining capabilities

### Changed
- Improved Ollama handling and output processing
- Enhanced ollama generate functionality and .run() implementation

---

## Legend

- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).