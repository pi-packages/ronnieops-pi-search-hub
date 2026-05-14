# Research: Credential Resolution Patterns in pi Extension Ecosystem

## Summary

The pi extension ecosystem lacks formal written guidelines for credential handling, but established patterns exist across related tools (OpenClaw, MCP, pi-web-providers). The core convention is that **ALL_CAPS string values in config files are interpreted as environment variable references**, not literal secrets. PR #3's approach of using `^[A-Z][A-Z0-9_]*$` regex to detect env var references is consistent with this ecosystem pattern, though direct source code verification of pi-web-providers' exact implementation was not achievable.

## Findings

### 1. pi-web-providers Source Code Access
- **Finding:** pi-web-providers (by mavam) is a meta web extension that routes search/content/answers across Codex, Exa, Gemini, Parallel, and Valyu providers with per-tool provider routing. It stores config in `~/.pi/agent/web-providers.json`.
- **Limitation:** Direct source code access for the credential resolution logic was not available through web search. The npm package is published at `pi-web-providers` v2.4.0 (MIT license), but the GitHub repo's implementation details for `apiKey` resolution were not retrievable via search.
- [Source: jsDelivr CDN](https://www.jsdelivr.com/package/npm/pi-web-providers), [pi.dev package page](https://pi.dev/packages/pi-web-providers)

### 2. OpenClaw as Parallel Reference (Highest Relevance)
- **Finding:** OpenClaw's model providers configuration (in `openclaw.json`) shows the established pattern for credential resolution. Their docs explicitly state: **"A common misconfiguration is setting `apiKey: "${ENV_VAR}"` instead of `apiKey: "ENV_VAR"`"** — indicating the config file should contain just the env var name (ALL_CAPS), not the `${}` syntax.
- **Finding:** OpenClaw supports env var substitution in config with explicit mention of `env` (inline env vars) and `env_vars` (forward shell variables) fields.
- **Finding:** OpenClaw's source code at `src/agents/models-config.providers.ts` auto-registers providers when credentials exist (via env var or auth profile) without requiring explicit models.providers config.
- [Source: DeepWiki - OpenClaw Model Providers & Authentication](https://deepwiki.com/openclaw/openclaw/3.3-model-providers-and-authentication)

### 3. MCP Configuration Pattern (Cross-Ecosystem Validation)
- **Finding:** MCP clients handle env var interpolation differently — some use `${VAR}` syntax in `.mcp.json` which gets resolved at config load time, while others (like pi's approach) expect bare variable names in the config file.
- **Finding:** The pi MCP adapter supports `${VAR}` syntax for header value interpolation: `headers: { "X-API-Key": "${API_KEY}" }` — a different pattern than the config-file convention.
- **Finding:** The standard convention used by Claude Code, Cursor, and VS Code MCP configs is to pass env vars directly via the `env` field rather than interpolating in values.
- [Source: Mintlify - Pi MCP Adapter Authentication](https://www.mintlify.com/nicobobailon/pi-mcp-adapter/configuration/authentication), [Cursor Forum](https://forum.cursor.com/t/resolve-local-environment-variables-in-mcp-server-definitions/79639)

### 4. pi-mono-sentinel (Security Extension Precedent)
- **Finding:** pi-mono-sentinel by Earendil Inc. specifically guards against credential leaks with "Credential safety — the LLM never hardcodes API keys or secrets in tool calls." This is the closest thing to a security guideline in the pi ecosystem.
- **Finding:** The pi ecosystem's security stance is that credentials should NOT be hardcoded and should flow through env var resolution patterns.
- [Source: pi.dev - pi-mono-sentinel](https://pi.dev/packages/pi-mono-sentinel)

### 5. ALL_CAPS Detection Pattern Precedent
- **Finding:** The UNIX convention that environment variables should have UPPER CASE names is well-established. This makes ALL_CAPS detection a valid heuristic for distinguishing env var references from literal strings.
- **Finding:** No specific regex precedent for `^[A-Z][A-Z0-9_]*$` was found in official documentation, but the pattern aligns with POSIX environment variable naming conventions.
- **Finding:** The convention that a bare ALL_CAPS string in a config file means "read from environment variable NAME" (not the literal value NAME) is consistent across OpenClaw and implied in pi-web-providers documentation.
- [Source: ArchWiki - Environment Variables](https://wiki.archlinux.org/title/Environment_variables), [DeepWiki - OpenClaw](https://deepwiki.com/openclaw/openclaw/3.3-model-providers-and-authentication)

### 6. Node.js execSync Cache Invalidation for Secrets
- **Finding:** Standard Node.js best practice is to NOT cache secrets in long-running processes. If execSync is used to fetch credentials via shell command, each request should invoke the command fresh (no caching layer).
- **Finding:** For secret rotation in long-running Node processes, the recommended patterns are:
  1. **TTL-based invalidation**: Re-fetch credentials after a configurable timeout
  2. **Event-driven invalidation**: On SIGHUP or config change signal
  3. **Process restart**: For critical rotations, restart the Node process
- **Finding:** If using execSync for credential fetching, the result should be stored in memory only for the lifetime of the request/operation, not cached across multiple operations.
- [Source: Stack Overflow / Node.js child_process docs](https://stackoverflow.com/questions/30134236/use-child-process-execsync-but-keep-output-in-console), [umatechnology.org - Node Maintenance Best Practices](https://umatechnology.org/node-maintenance-best-practices-for-in-cluster-secrets-rotation-verified-with-sla-stress-tests/)

## Sources

### Primary Sources (Kept)
- **DeepWiki - OpenClaw Model Providers & Authentication** (https://deepwiki.com/openclaw/openclaw/3.3-model-providers-and-authentication) — Most relevant precedent; explicit documentation of env var name convention vs literal string for apiKey
- **pi.dev packages** (https://pi.dev/packages/pi-web-providers, https://pi.dev/packages/pi-mono-sentinel) — Official pi extension registry entries confirming ecosystem conventions
- **Mintlify Pi MCP Adapter** (https://www.mintlify.com/nicobobailon/pi-mcp-adapter/configuration/authentication) — pi's MCP implementation showing `${VAR}` syntax as separate pattern
- **OpenClaw Configuration Reference** (https://docs.openclaw.ai/gateway/configuration-reference) — Official docs showing env/env_vars config fields

### Secondary Sources (Kept for Context)
- **ArchWiki - Environment Variables** (https://wiki.archlinux.org/title/Environment_variables) — POSIX naming convention reference
- **Stack Overflow - Node.js execSync** (https://stackoverflow.com/questions/30134236/) — execSync best practices

### Dropped Sources
- Generic YouTube videos on hiding API keys — No specific ecosystem relevance
- Generic dotenv documentation — Standard library, not ecosystem-specific
- Pi Wikipedia/math pages — Unrelated (Greek letter π)
- Generic credential management articles — Not specific to pi/Node.js extension patterns

## Gaps

1. **pi-web-providers source code not directly accessible**: Could not retrieve the actual TypeScript source for pi-web-providers to verify the exact credential resolution implementation. Recommend checking the npm package source directly or filing an issue on the repo.

2. **No formal pi extension security guidelines**: While pi-mono-sentinel shows the security stance, there's no written "pi extension security guide" documenting credential handling conventions. The ecosystem relies on implicit conventions from OpenClaw and MCP patterns.

3. **execSync shell command security**: No specific guidance found on whether pi extensions should execute shell commands for credential resolution (security implications, sandboxing).

4. **Cache invalidation for env var changes**: No specific precedent found for how to handle dynamic env var changes in long-running pi extensions. This is an open design question.

## Questions for PR #3 Review

Based on this research, the following questions should be addressed before merging PR #3:

1. **Does pi-web-providers actually use bare ALL_CAPS detection, or does it use a different pattern?** The PR claims to follow pi-web-providers convention but we couldn't verify the exact mechanism.

2. **Should the regex be anchored (`^` and `$`) or allow partial matches?** If someone has a config value like `MY_KEY_` (ending with underscore), the regex `^[A-Z][A-Z0-9_]*$` matches it literally, but this might be intentional vs accidental.

3. **What is the fallback behavior when the env var doesn't exist?** Should it fail fast, use a default, or leave the original string as-is?

4. **Should execSync results be cached, and if so, for how long?** This matters for secret rotation during long-running pi sessions.

5. **Is shell command execution for credential resolution acceptable in the pi extension security model?** pi-mono-sentinel guards against credential exposure, but doesn't address credential acquisition.

6. **Should there be a warning when a literal-looking string (e.g., starts with "sk-" or "AIza") is passed as-is?** This could catch accidental hardcoded secrets.

## Supervisor Coordination

No supervisor contact needed. Research is complete with clear findings on ecosystem conventions and remaining gaps that require PR author clarification.
