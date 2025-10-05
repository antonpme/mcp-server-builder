# MCP Server Builder — Design (MVP)

## Architecture
- Extension Controller (activation, commands, state)
- Wizard UI (webview)
  - Steps: Describe → Options → Preview → Generate
  - File tree + content preview; status area
- Generation Engine
  - Templates (basic/tools/resources/prompts/advanced)
  - Response parsing (Zod); normalization + safety checks
  - Post‑processing: format, lint, compile check (TS)
- OpenAI Service
  - Prompt building; retries with backoff; timeouts; rate limiting
  - Error taxonomy (auth/quota/network/content)
  - Offline fallback generator always available
- MCP SDK integration
  - Create server with stdio/SSE; register at least one tool

## Flows
1) Preview Flow
User → Wizard → OpenAI (optional) → Parse → Render preview (files + content). Validation must pass before “Generate”.

2) Generate Flow
Wizard → CodeGenerator → Write files → Post‑process (format/lint/compile) → Success screen with next steps.

## Security
- API keys: VS Code SecretStorage
- No secret logging; redact in error messages

## Packaging / CI
- Test on Node 16/18; package VSIX on Node 20
- VSIX contents: compiled `out/**` only; exclude sources and docs

## Testing Strategy
- Unit: OpenAI service, parser, template rendering (snapshots)
- Integration: generate TS server, compile, minimal smoke run
- UI smoke: wizard opens and preview renders
