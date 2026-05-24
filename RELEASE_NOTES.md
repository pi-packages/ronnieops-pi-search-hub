# Release v2.0.0

## 🚀 New Features
- **Smart Backend Scoring**: Uses composite scoring (Success Rate, Latency, and Result Quality) for the `best-latency` strategy.
- **Search Result Caching**: LRU cache with TTL to reduce API quota usage.
- **Enhanced DuckDuckGo**: Leverages ddgs v9.x metasearch features (backend selection, region, and timelimit).
- **Per-Backend Configuration**: Custom `timeout`, `maxResults`, and `headers` per search provider.
- **Combine Mode Config**: Option to force multi-backend RRF mode directly from `search.json`.

## 🛠 Refactoring & Improvements
- **Modular Architecture**: Major refactor from a single-file monolith to a modular structure for improved maintainability.
- **Improved Marginalia**: Updated to the new `api2.marginalia-search.com` endpoint.
- **Robustness**: Enhanced error sanitization and credential resolution (env/shell/literal).

## 🧪 Testing
- Added comprehensive integration tests covering dispatch, config, credentials, and caching.
