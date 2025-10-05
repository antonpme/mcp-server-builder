# MCP Server Builder — Work Plan (Release Readiness)

This plan is written for a solo, non‑coder sponsor. It lists what will be delivered so the extension is production‑ready.

## Goals
- Generate a runnable MCP server (stdio/SSE) with at least one real tool and input schema.
- Preview before writing files; clear errors; friendly onboarding.
- Automated tests and CI to avoid regressions; VSIX ships compiled code only.

## Done
- Project setup (TypeScript, ESLint/Prettier, VSCE).
- Command wiring; secrets via VS Code SecretStorage; basic webview.
- OpenAI client + offline fallback template.
- Unit tests for OpenAI flow and fallback; CI green for tests.
- Packaging on Node 20; VSIX excludes sources/docs.

## In Progress
- Template catalogue expansion and MCP SDK wiring.
- Wizard + preview UI.
- Error taxonomy + retries for OpenAI service.

## Next Up (Deliverables)
1) Core Generator
- Integrate MCP SDK (stdio + SSE variants).
- Expand templates (basic/tools/resources/prompts/advanced) for TS/JS.
- Normalize paths, generate `package.json` scripts, and README snippet for the generated project.

2) AI Provider Layer (robust & flexible)
- Abstraction that supports OpenAI plus additional providers (Google Gemini, Claude, OpenRouter).
- Provider-specific configuration in UI (model list, keys, optional org IDs) and a unified retry/backoff strategy.
- Clear error categories per provider (auth/quota/network/content) surfaced with guidance.
- Always‑useful offline scaffold + “what’s missing” checklist when every provider fails.

3) UX (wizard + preview)
- Steps: Describe → Options → Preview → Generate.
- File tree + content preview; disable Generate until validation passes.
- First‑run example; structured progress and retry buttons.

4) Validation & Tests
- Format + lint + compile check for generated TS projects.
- Unit tests: parser, templates (snapshots), OpenAI service.
- Integration: generate project, compile, minimal smoke run.
- UI smoke: wizard opens and renders preview.

5) CI/CD (hands‑off)
- Test on Node 16/18; package on Node 20; cache npm.
- Upload VSIX, coverage, logs; Dependabot + `npm audit` gate.

6) Docs
- Public README: quick start, screenshots, troubleshooting, FAQ.
- Private internal docs live in a private repo; `npm run sync-docs` pulls them when authorized; docs excluded from VSIX.

7) Security
- SecretStorage only; redact keys; license checks.

8) Release & Aftercare
- Marketplace assets (icon, screenshots), listing copy.
- Tag‑based publish with manual approval; feedback link in UI.

## Acceptance Criteria
- A sample description generates a project that runs and exposes one real tool.
- Offline generation is useful and clearly labeled.
- Unit + integration suites pass; coverage gate on core modules (~80%).
- CI green; VSIX packages cleanly.
- README has screenshots + troubleshooting; internal docs synced privately.
