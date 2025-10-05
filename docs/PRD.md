# MCP Server Builder — Product Requirements (MVP)

## 1. Purpose
Help developers create runnable MCP servers from natural-language descriptions directly inside VS Code.

## 2. Minimum Viable Product
- Generate a runnable server (TypeScript/JavaScript) with:
  - stdio or SSE transport
  - at least one real tool, with input schema and error handling
  - `package.json` scripts to build/run
- Wizard UX with preview:
  - Steps: Describe → Options → Preview → Generate
  - File tree + content preview; prevent generation if validation fails
- AI provider layer with robust behavior:
  - Support OpenAI, Google Gemini, Claude, and OpenRouter behind a common adapter
  - Clear error messages (auth/quota/network/content) with retries, backoff, and timeouts
  - Guaranteed offline fallback producing a useful scaffold when providers fail
- Validation of generated output:
  - Format + lint; compile check for TS template
- Documentation (public):
  - Quick start, screenshots/GIFs, troubleshooting, FAQ

## 3. Non-Goals (for MVP)
- Python generation
- Advanced collaboration/analytics features

## 4. UX Notes
- First-run onboarding and an "Example" description
- Status updates during generation and retry path on failures
- Success page links to open the generated folder and readme

## 5. Security
- API keys stored in VS Code SecretStorage only; never logged
- Redact secrets in all errors/status messages

## 6. Performance Targets
- Initial response to input within seconds; background steps show progress
- VSIX size minimal (compiled code only)

## 7. Success Metrics
- Successful generation rate
- Fallback usage rate (indicator of provider quota/issues)
- User reported satisfaction and reduced setup time
