# HANDOFF.md

## 1. Current Objective
Maintain `pi-search-hub` (pi package). Recently shipped configurable backend selection strategies (Issue #9). Next: keep ship steady, handle bug reports.

## 2. Current Status
- **v1.4.5** released and published to npm + GitHub
- AGENTS.md removed from git repo (not needed in-distro; kept local if desired)
- All 26 tests passing
- Publish workflow fixed: `NODE_AUTH_TOKEN` now wired to `secrets.NPM_TOKEN`

## 3. Recent Decisions
- Removed AGENTS.md from git to keep distro clean; keep as local dev doc
- `NPM_TOKEN` secret added to GitHub repo for workflow CI/CD
- Publish workflow: both `npm ci` and `npm publish` pass `NODE_AUTH_TOKEN`

## 4. Important Constraints
- AGENTS.md is **not in repo** — do not reference it as a file path in code
- DuckDuckGo requires `pip3 install ddgs`
- Jina search needs free key from jina.ai; web_read is free
- Perplexity Sonar is paid-only
- SearXNG needs self-hosted instance
- `execSync` for shell-command credential resolution (user-owned config only)
- No scoped npm package — plain `pi-search-hub` on registry

## 5. Known Issues / Risks
- DuckDuckGo's `ddgs` Python CLI can be flaky (no fix planned)
- 12 backends = high maintenance surface for API changes
- Exa pricing changed March 2026 — content extraction free for first 10 results
- No npm publish from CI yet (need to verify workflow end-to-end on next release)

## 6. Pending Tasks
- (none currently)

## 7. Suggested Next Actions
- If new issue comes in: test with `npx vitest run` before editing
- If adding backend: add to `BACKEND_DEFS` in `search-hub.ts`, parser in `parsers.ts`, test in `parsers.test.ts`
- If publishing: run `npm version patch`, tag, push, then trigger workflow dispatch OR `npm publish` local

## 8. Important Files / Commands
| File | Role |
|------|------|
| `extensions/search-hub.ts` | Main extension (~1700 lines) |
| `backends/parsers.ts` | Search result parsers (~250 lines) |
| `backends/parsers.test.ts` | Vitest tests |
| `.pi/search.json` | Project-level config |
| `.github/workflows/publish.yml` | CI/CD for npm publish |
| `search.json.example` | Config reference |

| Command | Purpose |
|---------|---------|
| `npx vitest run` | Run all tests |
| `npx vitest run backends/parsers.test.ts` | Parser tests only |
| `npm version patch && git push --tags` | Bump + tag |
| `npm publish` | Ship to npm |

## 9. Validation Status
- **Tests:** 26/26 passing (parsers.test.ts)
- **CI/CD:** Workflow updated but not tested end-to-end since fix
- **npm:** v1.4.5 published successfully
- **GitHub:** Release v1.4.5 live, tag pushed

## 10. Session Metadata
| Field | Value |
|-------|-------|
| updated_at | 2026-05-21 |
| branch | main |
| repo state | clean (package-lock.json unstaged, ignore) |
| active components | search-hub.ts, parsers.ts, publish.yml |
| latest release | v1.4.5 |

## META PROMPT

**Before acting, future agent MUST:**
1. Read both `HANDOFF.md` and `AGENTS.md` (if present locally, not in repo)
2. Run `npx vitest run` to confirm baseline
3. Verify current branch and git status with `git status --short`
4. Check the repo for any existing `HANDOFF.md` or `AGENTS.md` before referencing them as paths

**Current priorities:**
- Package is stable, shipping. Prioritize bug fixes over new backends.
- If touching CI workflow, ensure `NODE_AUTH_TOKEN` is wired — easy to forget.
- If adding a backend: 3-file pattern (defs + runner in search-hub.ts, parser in parsers.ts, test in parsers.test.ts).

**Anti-hallucination rules:**
- AGENTS.md is NOT tracked in git — do not `git rm` / `git add` it, do not reference as `@AGENTS.md`
- Do not invent env vars — only `SEARCH_<BACKEND>_API_KEY` patterns from `FALLBACK_ENV_MAP`
- Do not invent files — `ls` before edit, verify path
- Mark unknowns with `[?]` prefix

**Workflow:**
- Make smallest correct change. Test. Reflect. Update handoff only if materially important context changes.
- Prefer in-place update of this file over appending.
