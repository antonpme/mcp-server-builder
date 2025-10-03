# MCP Server Builder

A VS Code extension that enables developers to create Model Context Protocol (MCP) servers through natural language descriptions.

## Current Status: Phase 1 Complete ✅

The foundation of the MCP Server Builder extension is now complete. Phase 1 has successfully implemented the core infrastructure, configuration management, command system, and basic UI components. The extension is now ready for the next phase of development, which will focus on implementing the actual code generation functionality.

## Features

### Currently Implemented (Phase 1)
- Extension framework with proper activation and deactivation
- Configuration management for API keys and settings
- Command system for creating MCP servers and opening the webview
- Basic webview UI with VS Code theming
- Form inputs for server description, language, and transport selection
- Progress notifications during server generation
- Responsive design with VS Code integration
- Comprehensive testing framework setup
- CI/CD pipeline with GitHub Actions

### Planned Features (Phase 2 and beyond)
- Natural language to code generation for MCP servers
- Support for TypeScript/JavaScript and Python
- Template system for common MCP server patterns
- Interactive code editor with syntax highlighting
- Built-in testing framework
- File explorer for generated projects
- Real-time preview functionality

## Requirements

- VS Code 1.74.0 or higher
- Node.js 16.x or higher
- OpenAI API key (for Phase 2 code generation)

## Extension Settings

This extension contributes the following settings:

- `mcpServerBuilder.openaiApiKey`: OpenAI API key for code generation
- `mcpServerBuilder.defaultLanguage`: Default programming language for generated MCP servers
- `mcpServerBuilder.defaultTransport`: Default transport type for generated MCP servers

## Getting Started

### Current Implementation (Phase 1)

1. Install the extension from the VS Code Marketplace or from the generated VSIX file
2. Configure your OpenAI API key in the extension settings (for future use)
3. Run the "Open MCP Server Builder" command from the command palette
4. The webview panel will open with the basic UI
5. You can input server descriptions and select language/transport options
6. The extension is now ready for the next phase of development

### Future Implementation (Phase 2)

Once Phase 2 is complete, you'll be able to:

1. Describe your desired MCP server functionality in natural language
2. Select your preferred programming language and transport type
3. Generate code automatically based on your description
4. Review and customize the generated code in an integrated editor
5. Export/deploy your MCP server

## Implementation Status

### Phase 1: Foundation ✅ Complete
- Project setup and configuration
- Extension framework
- Configuration management
- Command system
- Basic UI implementation
- Testing framework
- CI/CD pipeline

### Phase 2: Code Generation 🚧 In Progress
- OpenAI API integration
- Code generation engine
- MCP protocol implementation
- Advanced UI features

### Phase 3: Advanced Features 📋 Planned
- Template system
- Testing framework integration
- File explorer
- Real-time preview
- Deployment options

## Development

### Building

```bash
npm install
npm run compile
```

### Testing

```bash
npm test
```

### Packaging

```bash
npm run package
```

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a pull request.

## License

MIT