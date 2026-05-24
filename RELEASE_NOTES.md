# Release v2.0.1 (fix broken 2.0.0 tarball)

**v2.0.0 was deprecated.** The NPM tarball was missing module files (`types.ts`, `utils.ts`, etc.) due to restrictive `.npmignore` rules. 2.0.1 includes all files.

## 🚀 New Features (same as 2.0.0)
- **Smart Backend Scoring**: Composite score (success rate + latency + quality) for `best-latency`
- **Search Result Caching**: LRU cache with TTL, configurable via `cacheTtl`/`cacheMax`
- **DuckDuckGo v9.x Metasearch**: Supports `ddgsBackend`, `ddgsRegion`, `ddgsTimelimit`
- **Per-Backend Config**: Custom `timeout`, `maxResults`, `headers` per backend
- **Combine Mode Config**: Force RRF combine via `"combine": true` in `search.json`

## 🛠 Refactoring
- Modular architecture (20 files from 1 monolith)
- Marginalia endpoint updated to `api2.marginalia-search.com`

## 🔧 Fixes
- `.npmignore` now allows all extension module files
