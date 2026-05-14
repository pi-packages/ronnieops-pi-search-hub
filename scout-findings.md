# Scout Findings — pi-search-multi

## Files Retrieved

1. `extensions/pi-search.ts` (lines 1-1382) — entire extension, 11 backends, config, credential resolution, tool registration
2. `benchmark/benchmark.mjs` (lines 1-453) — standalone benchmark, duplicates all backend HTTP logic
3. `handoffs/handoff-20260511-205100.md` — v1.3.0 handoff documenting HIGH severity ALL_CAPS bug
4. `package.json` — v1.3.0, peerDeps on `@mariozechner/pi-coding-agent` and `@mariozechner/pi-ai`
5. `README.md` (lines 1-240) — user-facing docs, credential resolution table

---

## 1. Architecture Hotspots in `extensions/pi-search.ts`

### Single-file monolith (1382 lines)
- **All 11 backends**, config, credential resolution, result formatting, commands, and tool registration in one file.
- Adding a backend = edit 6+ locations: `SearchConfig` interface, `FALLBACK_ENV_MAP`, `backendLabels` map, `runBackend` switch, `search-status` labels, and `search-setup` list. Very easy to miss one.
- **Backend dispatcher** (`runBackend`, lines ~970-1050) is a 70-line `switch` statement. Coupling point: any backend interface change (params, return type) ripples through every case.

### Highest coupling points
1. **`runBackend` switch** — every backend's key resolution + call signature is unique (some need apiKey, some instanceUrl, some nothing). No shared interface — each case is bespoke.
2. **`SearchConfig.backends` typed as union of 11 optional fields** — adding backend = edit the interface + all downstream consumers.
3. **`formatCombinedResults` has a hardcoded `backendLabel` map** (lines ~925-935) — must mirror backends exactly.

### What breaks if backend interface changes
- Backend-specific response parsing (each has unique JSON shape) is inline in each `search*` function. API response format change = silent wrong results or crash.
- `resolveBackendKey` assumes uniform key resolution — SearXNG's `instanceUrl` already broke the pattern (special-cased in `runBackend`).

---

## 2. Benchmark Drift

### Stale/duplicated code — YES, significant drift risk
- `benchmark/benchmark.mjs` **re-implements all 11 backend HTTP calls** from scratch (no import from extension).
- **Not in sync by mechanism** — extension uses `resolveBackendKey()` with caching + `resolveConfigValue()`. Benchmark reads `loadApiKey()` directly from JSON config (no env resolution, no shell commands, no FALLBACK_ENV_MAP).
- **Perplexity response parsing**: both extract citations identically (good), but any future change to the extension must be manually mirrored.
- **DuckDuckGo**: both embed the same Python script string. Duplicated ~20 lines.
- **Drift vector**: if extension fixes a parsing bug, benchmark won't reflect it. Benchmark results could be stale/inaccurate.
- **No shared test harness** — benchmark can't exercise `runBackend()` directly.

---

## 3. Open Issue: ALL_CAPS Regex Bug

### STILL PRESENT. Not fixed.

**Location:** `resolveConfigValue()` at line 121-123:
```typescript
const envValue = process.env[reference];
if (envValue !== undefined) return envValue;
if (/^[A-Z][A-Z0-9_]*$/.test(reference)) return undefined;
// Otherwise → literal string
return reference;
```

**The bug:** If `apiKey` in config is a literal string that happens to match `^[A-Z][A-Z0-9_]*$` (e.g., `"MYKEY123"`, `"ABCDEF"`), it's treated as an env var reference. If that env var is unset, `resolveConfigValue()` returns `undefined` — the literal key is **silently discarded**.

**Blast radius:**
- Real API keys usually start with `sk-`, `pk_`, or are hex — they DON'T match the pattern. Low practical impact for normal keys.
- But any short all-caps token (e.g., `"PUBLIC"`, `"TEST"`, `"DEMO"`) is silently broken.
- Handoff says this is "documented but not fixed" — still true.

**Suggested fix:** When `apiKey` matches ALL_CAPS but env var is unset, log a warning or throw. Or add explicit `env:` prefix convention to disambiguate.

---

## 4. Config Merge Correctness

### `loadConfig()` deep merge (lines 189-217)

**Good:**
- Global config loaded first, then project config deep-merges `backends` per-key.
- If project lists `serper: { enabled: true }` and global has `serper: { apiKey: "..." }`, both are preserved.
- Auto-enable via `FALLBACK_ENV_MAP` runs last, only for backends not explicitly configured.

**Edge cases / bugs:**
1. **Shallow spread before deep merge** — line 201: `config = { ...config, ...project }` overwrites `config.backends` with `project.backends` (shallow). Then lines 204-212 attempt deep merge. BUT: the deep merge starts from `{ ...config.backends }` which is now already `project.backends` (the spread replaced it). **Wait — actually `config.backends` at line 204 is the *spread result*, which is `project.backends` because the spread on line 201 overwrote the `backends` key.** So `merged` starts as `project.backends`, then only merges entries that exist in *both* `project.backends` and `merged` (which is the same object). **Global-only backends are LOST.**

   **Reproducing:** Global has `{ backends: { serper: { apiKey: "..." } } }`. Project has `{ backends: { tavily: { apiKey: "..." } } }`. After line 201, `config.backends = { tavily: { ... } }` (serper gone). Lines 204-212 iterate `project.backends` (just tavily), merge with `merged` (just tavily) — serper never appears.

   **This is a bug.** Line 204 should start from the *pre-spread* global backends, not from `config.backends` after the spread.

2. **`null` override** — if project config has `"backends": null`, the `if (project.backends)` guard skips the deep merge, but the spread on line 201 already set `config.backends = null`. Result: no backends at all.

3. **`defaultBackend` not deep-merged** — spread correctly gives project precedence, which is the right behavior.

**Severity:** The global backend loss bug is MEDIUM-HIGH. Any user with both global and project configs will lose global-only backends silently.

---

## 5. Extension API Surface

### Methods used from `ExtensionAPI`:
| Method | Usage |
|--------|-------|
| `pi.registerTool()` | Registers `web_search` tool with schema, execute handler |
| `pi.registerCommand()` | Registers `/search-setup` and `/search-status` |
| `pi.on("session_start")` | Initializes config and sets status bar |

### Types used:
- `ExtensionAPI` from `@mariozechner/pi-coding-agent`
- `StringEnum` from `@mariozechner/pi-ai`
- `Type` from `typebox`

### Context API used in handlers:
- `ctx.cwd` — working directory for config loading
- `ctx.hasUI` — guards interactive commands
- `ctx.ui.notify()` — display messages
- `ctx.ui.select()` — interactive picker
- `ctx.ui.input()` — interactive text input
- `ctx.ui.setStatus()` — status bar update

### Potentially useful newer methods (check pi docs):
- `pi.registerPrompt()` — could add prompt suggestions for common search patterns
- `pi.on("config_change")` — if it exists, could replace the 10s TTL polling for config changes
- `ctx.ui.progress()` or `ctx.ui.spinner()` — if available, would improve UX during long searches
- `pi.registerMiddleware()` — if available, could intercept/transform search queries

---

## 6. Top 3 Improvements (Highest Impact)

### 1. Extract backend registry pattern (Maintainability — HUGE)
Replace the 11-case switch + scattered labels with a `BackendRegistry`:
```typescript
interface BackendDefinition {
  name: string;
  label: string;
  needsKey: boolean;
  search: (query, num, deps) => Promise<Results>;
}
```
Adding a backend = one object. Eliminates 6 edit points → 1. Removes ~300 lines of dispatcher boilerplate.

### 2. Fix config merge bug (Correctness — HIGH)
Line 201's `{ ...config, ...project }` destroys global-only backends. Fix: deep-merge `backends` *before* the spread, or save `globalBackends` separately and merge after.

### 3. Extract shared backend test harness (Drift prevention — MEDIUM-HIGH)
Move HTTP call + response parsing into shared modules that both extension and benchmark import. Benchmark currently has 453 lines of duplicated code that will silently diverge. A shared `backends/` directory with per-backend modules would cut total LOC ~40% and eliminate drift.

---

## Remaining Clarification Questions

1. **ALL_CAPS fix strategy** — warn-on-unset? throw? require `env:` prefix? This is a breaking change for anyone using ALL_CAPS literal keys (probably zero users, but needs decision).

2. **Pi API docs access** — are there newer `ExtensionAPI` methods beyond `registerTool`, `registerCommand`, `on`? No type defs in node_modules (peer deps not installed). Need access to `@mariozechner/pi-coding-agent` types.

3. **Backend registry refactor scope** — should this be one PR (all backends) or incremental (refactor one backend at a time)?

4. **Benchmark rewrite scope** — should benchmark import from extension directly, or should backends be extracted into a shared package first?

5. **Config merge fix timing** — is this blocking anyone now, or can it ship with the next feature PR?
