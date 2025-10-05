# MCP Server Builder

A VS Code extension that turns natural language descriptions into fully scaffolded Model Context Protocol (MCP) servers. The extension now ships with an integrated OpenAI workflow, secure configuration management, and an offline fallback template so generation never leaves you stranded.

## Current Status
- ✅ Phase 1 foundation complete (extension lifecycle, configuration, UI shell)
- 🚧 Phase 2 core features underway with OpenAI-driven generation, intelligent fallbacks, and automated tests

## Highlights
- **Natural language generation** – describe the server you need and let the extension assemble the project
- **OpenAI integration** – prompt engineering, request dispatch, and response parsing ready for GPT-4o-mini (or compatible) models
- **Offline fallback** – if the API key is missing or a request fails, a production-ready template is generated locally
- **Secure secrets** – OpenAI API keys are stored via VS Code secret storage with seamless migration from legacy settings
- **Guided workflow** – choose language and transport, auto-suggest project names, and pick an output folder from the UI
- **Status-rich webview** – progress messaging, disable/enable states, and form validation to keep you informed
- **Unit tests** – Jest-based coverage for prompt flows and fallback logic, runnable via a single script

## Requirements
- VS Code 1.74 or newer
- Node.js 16.x or newer (Node 18+ recommended)
- OpenAI API key (optional – required only for AI-assisted generation)

## Extension Settings
- `mcpServerBuilder.openaiApiKey` – OpenAI API key stored securely via VS Code secrets
- `mcpServerBuilder.defaultLanguage` – default language for new servers (`typescript`, `javascript`, `python`)
- `mcpServerBuilder.defaultTransport` – default transport (`stdio`, `sse`)

## Using the Extension
1. Install the extension (VSIX or marketplace) and run **“Open MCP Server Builder”**.
2. Provide a description, pick a language and transport, and optionally set a project name.
3. If you have an OpenAI key configured, the extension requests AI-generated scaffolding.
4. If the request fails or you choose to skip the key, the built-in template still generates a functional MCP server.
5. Select the destination folder and open the generated project straight from the success notification.

## Implementation Progress
- ✅ Phase 1 – Project scaffolding, configuration manager, command wiring, baseline webview
- ✅ Phase 2 Core – OpenAI service, response parser integration, fallback project builder, enhanced UX
- 🚧 Phase 2 Extras – UI code preview, richer template catalogue, MCP transport variants
- ⏳ Phase 3 – Collaboration tooling, deployment helpers, analytics

## Development

### Install & Build
```bash
npm install
npm run compile
```

### Unit Tests
Runs the TypeScript compiler first, then executes the compiled Jest suites.
```bash
npm run test:unit
```

### Package the Extension
```bash
npm run package
```

## Contributing
Issues and PRs are welcome. Please open an issue to discuss significant changes so we can keep the roadmap aligned.

## License
MIT
