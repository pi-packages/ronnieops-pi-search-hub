# AGENTS.md

Unified web search + content extraction extension for pi with 12 backends.

## 1. Mission

Build and maintain `pi-search-hub` — a pi package that provides `web_search` and `web_read` tools with:
- Auto-fallback across 12 search backends
- RRF (Reciprocal Rank Fusion) combine mode for parallel querying
- Secure credential resolution (env vars, shell commands, literals)
- Auto-enable via `SEARCH_<BACKEND>_API_KEY` env vars

## 2. Active State

**Stack:** TypeScript, Node.js ESM, vitest, `typebox`
**Entry point:** `extensions/search-hub.ts` (~1,400 lines)
**Parsers:** `backends/parsers.ts` (imported by extension)
**Tests:** `backends/parsers.test.ts` (vitest)
**Config:** `.pi/search.json` (project) or `~/.pi/agent/extensions/search.json` (global)
**Config fields:** `defaultBackend`, `selectionStrategy` ("sequential" | "random" | "round-robin" | "best-latency"), `backends`

**Module state (ephemeral, in-memory):**
- `roundRobinIndex: number` — counter for round-robin strategy
- `latencyMap: Map<backend, {ms, timestamp}[]>` — rolling latency samples (60s TTL)
- Resets on pi restart

**Key commands:****
```bash
npx vitest run backends/parsers.test.ts    # Run unit tests
```

**Active task:** (none — check todo list and recent commits)

**Known constraints:**
- DuckDuckGo requires `pip3 install ddgs`
- Jina search requires free API key from jina.ai; web_read is free
- Perplexity Sonar is paid-only
- SearXNG requires self-hosted instance

**Known risks:**
- 12 backends = high maintenance surface for API changes
- `execSync` for shell-command credential resolution (user-owned config only)
- Exa pricing changed March 2026 — content extraction now free for first 10 results

## 3. Seed Principles

1. **Smallest correct change** — verify edge cases before broad edits
2. **Test before commit** — `vitest run` must pass
3. **Preserve user intent** — don't break config compatibility
4. **Mark unknowns explicitly** — don't invent APIs, files, commands, or env vars
5. **Prefer repo evidence** — README, findings.md, and code over assumptions
6. **Never overwrite higher-priority instructions** — user config > project config > global config
7. **Prevent hallucinations** — confirm file existence before editing

## 4. Development Loop

```
observe → plan → edit → test → reflect → update only if useful
```

1. **Observe:** Read relevant files, check recent commits, run tests
2. **Plan:** Identify minimal change, note edge cases
3. **Edit:** Apply targeted fix
4. **Test:** `npx vitest run` (and manual smoke test if touching HTTP logic)
5. **Reflect:** Did it work? Any regressions?
6. **Update:** Only if findings or AGENTS.md needs correction

## 5. Verification

- Run `npx vitest run backends/parsers.test.ts` after parser changes
- Manual curl tests documented in README.md Testing section
- Check `findings.md` for prior issues before assuming behavior

## 6. Anti-Hallucination Rules

| Rule | Action |
|------|--------|
| Don't invent APIs | Use only backends in `BACKEND_DEFS` in `search-hub.ts` |
| Don't invent files | `ls` before edit; verify path exists |
| Don't invent commands | Use only `npx vitest run`, documented curl commands |
| Don't invent env vars | Only `SEARCH_<BACKEND>_API_KEY` patterns from `FALLBACK_ENV_MAP` |
| Mark unknowns | Prefix with `[?]` if behavior is unverified |
| Preserve conventions | Match existing code style (snake_case in backends, camelCase in config types) |

## 7. Update Policy

- Update this file when: new backend added, key architecture changes, new constraint discovered
- Don't update for: one-off bug fixes, test additions, minor doc fixes
- Keep it compact — if it grows beyond 100 lines, trim
- If `AGENTS.md` exists, merge carefully: merge sections, don't duplicate