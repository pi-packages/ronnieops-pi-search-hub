# Release v2.0.1 (fix broken 2.0.0 tarball)

**v2.0.0 was deprecated.** NPM tarball was missing module files due to restrictive `.npmignore`.

Features same as 2.0.0:
- Smart backend scoring (composite: success rate + latency + quality)
- Search result caching (LRU with TTL, configurable)
- DuckDuckGo v9.x metasearch (backend, region, timelimit)
- Per-backend config (timeout, maxResults, headers)
- Combine mode config option in search.json
- Modular architecture (20 files from 1 monolith)
- 21 new integration tests

Fixes:
- `.npmignore` now includes all extension module files
- Publish workflow skips if version already on registry
