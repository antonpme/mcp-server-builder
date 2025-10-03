# Changelog

All notable changes to the MCP Server Builder extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-03

### Added
- Initial release of MCP Server Builder extension
- Basic VS Code extension structure with activation and deactivation hooks
- Configuration management for OpenAI API key with secure storage
- Command registration for creating MCP servers via VS Code command palette
- Basic webview panel for user interface with HTML/CSS/JS integration
- Support for TypeScript, JavaScript, and Python languages for server generation
- Support for stdio and SSE transport types for MCP server communication
- CI/CD pipeline with GitHub Actions for automated testing and publishing
- Basic testing framework setup with Jest and VS Code test runner

### Features
- Natural language to code generation (placeholder implementation)
  - User can describe desired MCP server functionality in natural language
  - Extension processes the description and generates appropriate code
  - Generated code follows MCP server best practices and conventions
- Configuration management for API keys and settings
  - Secure storage of OpenAI API key in VS Code settings
  - Configuration validation and error handling
  - Default settings with user customization options
- Interactive UI for server creation
  - Clean, intuitive interface for specifying server requirements
  - Real-time validation of user inputs
  - Preview of generated code before finalization
- Progress notifications during server generation
  - Status updates during code generation process
  - Error handling with user-friendly messages
  - Success notification with next steps
- Welcome message on first activation
  - Introduction to extension features
  - Quick start guide for new users
  - Links to documentation and examples

### Project Structure
- `/src/extension.ts` - Main extension entry point with activation logic
- `/src/commands/` - Command handlers for user interactions
  - `CreateServerCommand.ts` - Handles MCP server creation workflow
  - `OpenWebviewCommand.ts` - Manages webview panel operations
- `/src/config/` - Configuration management
  - `ConfigurationManager.ts` - Handles API keys and extension settings
- `/src/ui/` - User interface components
  - `WebviewPanel.ts` - Manages the webview panel for server creation
- `/test/` - Test suite for extension functionality
  - `suite/extension.test.ts` - Main extension tests
  - `runTest.ts` - Test runner configuration

### Technical Details
- TypeScript configuration and build pipeline
  - Strict type checking for improved code quality
  - Source map generation for debugging
  - Module resolution for clean imports
- ESLint and Prettier for code formatting
  - Consistent code style across the project
  - Automated formatting on save
  - Pre-commit hooks for code quality
- Jest testing framework
  - Unit tests for core functionality
  - Mock implementations for VS Code APIs
  - Coverage reporting for test validation
- VS Code extension packaging configuration
  - Proper manifest definition for extension metadata
  - Resource bundling for efficient distribution
  - Compatibility with VS Code extension marketplace

### Known Limitations
- Natural language to code generation is currently a placeholder implementation
  - Actual AI integration with OpenAI API is not yet implemented
  - Code generation templates are limited in scope
  - No support for advanced MCP server patterns
- Limited language support (TypeScript, JavaScript, Python only)
  - No support for other common languages like Go, Rust, or C#
  - Language-specific optimizations are not yet implemented
- Basic error handling without detailed recovery options
  - Limited retry mechanisms for failed operations
  - Generic error messages without specific guidance
- No integration with external MCP server registries
  - Servers must be created from scratch
  - No template library or server discovery features
- Limited customization options for generated servers
  - No advanced configuration options
  - No support for custom transport implementations