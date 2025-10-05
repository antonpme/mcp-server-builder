# MCP Server Builder — Technology Stack (MVP)

## Runtime & Languages
- Node.js: test on 16.x and 18.x; package on 20.x
- TypeScript for extension and templates (JS also supported)

## Key Libraries
- VS Code API (extension host, webview)
- MCP SDK (`@modelcontextprotocol/sdk`) for server generation
- Zod for schema validation of model responses
- OpenAI SDK for generation requests

## UI
- Webview HTML/CSS/vanilla TS for the wizard and preview
- Optional Playwright (future) for UI smoke tests

## Build & Testing
- TypeScript compiler + ESLint/Prettier
- Jest for unit tests (compiled JS run config)
- VS Code test harness launched via CLI for integration

## CI/CD
- GitHub Actions:
  - Job: test on Node 16/18 (lint, compile, tests)
  - Job: package on Node 20 (VSIX artifact)
  - Cache npm; upload VSIX + coverage
- Dependabot for updates; `npm audit` check

## Packaging
- `vsce` to build VSIX
- `.vscodeignore` excludes sources, tests, and `docs/` so VSIX contains only compiled `out/**`
