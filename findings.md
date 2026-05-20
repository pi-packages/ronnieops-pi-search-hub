# pi-search-hub Research & Scouting Findings

**Current version:** v1.4.4
**Last updated:** 2026-05-20

This file consolidates research and code analysis from all prior investigations.
Items are marked **DONE** if resolved, **DONE** if shipped but notable, or **OPEN** if still relevant.

---

## Search API Landscape (2026-05)

### Backend Status

| Backend          | Free Tier      | API Key  | Notes                                                                      |
| ---------------- | -------------- | -------- | -------------------------------------------------------------------------- |
| DuckDuckGo       | Unlimited      | No       | via `ddgs` Python lib                                                      |
| Jina AI          | Free tier      | Optional | key = higher rate limits. Auth implemented in web_read.                    |
| Marginalia       | Unlimited      | No       | shared `public` key                                                        |
| Tavily           | 1,000/mo       | Yes      | AI summaries                                                               |
| Serper           | 2,500 one-time | Yes      | Google SERPs                                                               |
| Brave            | 2,000/mo       | Yes      | independent index                                                          |
| Firecrawl        | 500 credits    | Yes      | search + crawl, v2 API                                                     |
| Exa              | 1,000/mo       | Yes      | **March 2026: content for first 10 results included free**                 |
| LangSearch       | Free, no CC    | Yes      | hybrid keyword + embedding                                                 |
| WebSearchAPI     | 2,000 credits  | Yes      | Google-powered                                                             |
| Perplexity Sonar | Paid           | Yes      | **Model variants: sonar, sonar-pro, sonar-deep-research, sonar-reasoning** |
| SearXNG          | Unlimited      | No       | self-hosted only                                                           |

### Notable Pricing Changes

- **Exa (March 2026):** Content extraction for first 10 results per request now included at no extra cost. Previously charged separately. Enable via `contents: { text: true }` in search request.
- **Perplexity:** Added `sonar-pro` (higher quality), `sonar-deep-research` (multi-step reasoning), and `sonar-reasoning` (DeepSeek R1-based) as model variants. Configurable via `model` field in backend config.

### New APIs Considered but Not Added

- **Search1API** — unified search+crawl+extract. Could be a 13th backend.
- **Linkup** — enterprise-grade, GDPR angle.
- **You.com** — AI-native but overlaps with Perplexity.

---

## Code Analysis Findings

### Architecture (v1.4.4)

Single-file extension (~1,400 lines) with 12 backends. Each backend has a `search*` function and a registry entry in `BACKEND_DEFS`.

**Key patterns:**

- `resolveBackendKey(backend)` — lazy credential resolution: config → resolveConfigValue() → FALLBACK_ENV_MAP fallback
- `resolveConfigValue(reference)` — `!command` → shell exec, ALL_CAPS → env var, else literal
- `runBackend(backend, ...)` — dispatcher calls `resolveBackendKey()` then executes the backend
- `refreshConfig(cwd)` — reloads config JSON, clears `commandValueCache`, 10s TTL

### Credential Resolution Pipeline

```
Config: { apiKey: "SERPER_API_KEY" }
  → resolveConfigValue("SERPER_API_KEY")
    → matches ALL_CAPS regex → process.env.SERPER_API_KEY → resolved value
    → or: !pass show api/serper → shell exec, cached

Config: { apiKey: "sk-abc123" }
  → resolveConfigValue("sk-abc123")
    → no special prefix → returned as-is (literal)

FALLBACK_ENV_MAP: { jina: "SEARCH_JINA_API_KEY", ... }
  → if no apiKey in config, check process.env.SEARCH_<BACKEND>_API_KEY
  → also auto-enables backend if the env var is set
```

### `optionalKey` Flag

Jina uses `optionalKey: true` — key is resolved if available but doesn't throw if missing.
All other backends with keys use `needsKey: true` (throws `MISSING_KEY_HELP` if unresolved).

---

## Resolved Issues

### ✅ ALL_CAPS regex — warning now emitted (was HIGH severity)

**Old behavior:** Literal ALL_CAPS strings (e.g., `"PROD_KEY"`) silently returned `undefined` if env var unset.

**Current behavior:** `resolveConfigValue()` detects ALL_CAPS pattern and emits:

```
[p[i-search] Credential reference "PROD_KEY" matches ALL_CAPS env-var pattern
but process.env.PROD_KEY is not set. If this is a literal key, use a different
name to avoid confusion.
```

### ✅ Config merge null edge case (was MEDIUM-HIGH)

**Old behavior:** Project `backends: null` would destroy global backends via shallow spread.

**Current behavior:** After spread, if `config.backends == null`, restored from pre-spread backup.

### ✅ Cache invalidation (was MEDIUM)

**Old behavior:** `commandValueCache` never cleared — shell-command-resolved keys stayed cached forever.

**Current behavior:** `refreshConfig()` calls `clearCredentialCache()`, which clears the cache. Key rotation works after config edit or `/reload`.

### ✅ Benchmark drift (was MEDIUM-HIGH)

**Old behavior:** `benchmark/benchmark.mjs` duplicated all HTTP logic — silent divergence risk.

**Current behavior:** Deleted. Replaced with unit tests in `backends/parsers.test.ts` (26 tests, vitest).

### ✅ Parser extraction

All 11 backend response parsers extracted to `backends/parsers.ts`. Extension imports from there. Eliminates inline parsing duplication across `searchMarginalia`, `searchWebSearchAPI`, `searchSerper`, etc.

---

## Still-True Notes

### Config merge global-backends loss

**Fixed.** The spread-then-merge pattern no longer loses global-only backends. Pre-spread backup is restored if deep merge doesn't cover all global entries.

### execSync in config resolution

Shell commands prefixed with `!` are executed via `execSync` (5s timeout). A malicious config could embed arbitrary shell commands — mitigated by config file ownership (user-owned, `0o600` perms). Not documented in user-facing docs. Low practical risk given the trust model.

### SearXNG not in FALLBACK_ENV_MAP

Intentional. SearXNG is self-hosted and typically has no API key. Convenience env `SEARCH_SEARXNG_API_KEY` will not auto-enable it — correct behavior.

---

## Outstanding Questions

1. **SearXNG `FALLBACK_ENV_MAP` missing** — intentional (self-hosted, no key needed). Could add `SEARCH_SEARXNG_API_KEY` for users who run authenticated instances.

2. **Perplexity model config** — implemented as `model` field in `BackendConfig`. Not exposed as a `web_search` param — users set it in config. Matches the "set and forget" pattern for model selection.

3. **Jina optional key for web_read** — configured separately from the `jina` search backend. Both use `SEARCH_JINA_API_KEY` env var / config key. web_read resolves the key and adds `Authorization: Bearer` header if present.

---

## Future Considerations (Not Implemented)

- **Backend registry pattern** — extract each backend into a self-contained object in `BACKEND_DEFS`. Would reduce the 70-line `runBackend` switch to a dispatcher loop.
- **Content extraction tool** — pi-web-providers exposes `web_contents` (full-page fetch). Jina Reader (`web_read`) already covers this use case.
- **Answer synthesis tool** — pi-web-providers has `web_answer`. Perplexity already returns synthesized answers with citations.
- **Per-backend RRF weights** — trust some backends more than others via a `weight` field in config.
- **Cross-encoder reranking** — apply Jina Reranker to RRF top-20 for quality boost. Adds ~100-500ms latency.
