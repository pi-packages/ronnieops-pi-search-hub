# Research: pi-search-multi Extension Ecosystem & Search API Landscape

**Date:** 2026-05-14

## Summary

The search API landscape for AI agents is highly active in 2026. Key changes include: Exa simplified pricing (free content for first 10 results), Perplexity Sonar added Pro Search with multi-step reasoning, Google deprecated "search entire web" in Programmable Search Engine, and ddgs renamed from `duckduckgo-search` to `ddgs` (Dux Distributed Global Search). No breaking auth changes detected for other backends. Several new APIs (Search1API, Linkup, Jina s.jina.ai) merit consideration as 12th+ backends. Pi extension ecosystem is thriving with pi-web-providers as the main competitor — pi-search-multi differentiates with 11 backends vs pi-web-providers' provider-routing model.

---

## 1. Search API Changes Since May 2026

### DuckDuckGo (ddgs)
- **Major rename:** `duckduckgo-search` package renamed to `ddgs` (Dux Distributed Global Search). Import changed from `from duckduckgo_search import DDGS` to `from ddgs import DDGS`. [PyPI](https://pypi.org/project/ddgs/)
- **Version:** Latest is 8.1.1 as of Jul 2025. [MLtools](https://bthek1.github.io/Python_Libs/duckduckgo-search.html)
- **Scope expanded:** Now a "metasearch library that aggregates results from diverse web search services" — not just DuckDuckGo. [GitHub](https://github.com/deedy5/ddgs)
- **Still free, no API key needed.**
- **Action:** Check pi-search-multi's ddgs dependency name and import path. If still using `duckduckgo-search`, update to `ddgs`.

### Tavily
- **Free tier unchanged:** 1,000 API calls/month. [NivaaLabs](https://nivaalabs.com/how-to-use-tavily-api-for-content-research-free/)
- **Purpose-built for AI agents:** Returns short summaries with context, not just links. [FreeCodeCamp](https://www.freecodecamp.org/news/how-to-add-real-time-web-search-to-your-llm-using-tavily/)
- **New partnerships:** IBM WatsonX, JetBrains integrations announced. [Tavily](https://www.tavily.com/)
- **No breaking API changes detected.**

### Serper
- **Free tier:** 2,500 free queries on sign-up (one-time, not monthly). [Scrappa](https://scrappa.co/serper-alternative)
- **Pricing model:** Pay-as-you-go from $50 for 50k credits ($1.00/1k) down to $0.30/1k at volume. No monthly subscription. [Serper.dev](https://serper.dev/)
- **No breaking changes detected.** Still Google SERP API.

### Brave Search
- **Free tier:** 2,000 queries/month (confirmed as of May 2026). [CostBench](https://costbench.com/software/ai-search-apis/brave-search-api/free-plan/)
- **New feature:** "Answers" mode (AI-generated answers) vs "Search" mode (raw results). Search is better for programmatic use. [blog.laozhang.ai](https://blog.laozhang.ai/en/posts/brave-search-api)
- **Independent index:** No longer relies on Google or Bing. 30B+ pages. [Wikipedia](https://en.wikipedia.org/wiki/Brave_Search)
- **No breaking changes detected.**

### Exa
- **Major pricing change (March 2026):** Simplified pricing. Contents for first 10 results per request now included free. Previously charged separately for search + content. [Exa Changelog](https://exa.ai/docs/changelog/pricing-update)
- **Free plan:** $0/month for low-volume access. Pro: ~$5/1k requests. [CostBench](https://costbench.com/software/web-scraping/exa/)
- **New product:** Exa Fast — p50 latency below 425ms. [Exa Blog](https://exa.ai/blog/fastest-search-api)
- **Action:** Update pi-search-multi's Exa integration to leverage free content inclusion, potentially saving extra fetch calls.

### Perplexity Sonar
- **Pricing:** Sonar at $1/M input tokens + $5/1K requests (~$0.006/query). Sonar Pro at ~$0.013/query. [AICostHub](https://aicosthub.com/guides/perplexity-api-cost-2026/)
- **New features:** Pro Search with automated tool usage and multi-step reasoning. Sonar Deep Research model (Feb 2025). Sonar Reasoning based on DeepSeek R1. [Perplexity Docs](https://docs.perplexity.ai/docs/getting-started/pricing)
- **Model expansion:** Multiple Sonar variants now available (base, Pro, Deep Research, Reasoning).
- **Action:** Consider exposing Sonar model variant selection in pi-search-multi config.

### Firecrawl
- **Free tier available** for prototyping. [Octoparse](https://www.octoparse.com/blog/bright-data-alternative)
- **New /search endpoint:** Pass query, returns titles/descriptions/URLs. Optional `scrapeOptions` to get full markdown/HTML per result. [Firecrawl Docs](https://docs.firecrawl.dev/features/search)
- **No breaking changes detected.**

### LangSearch
- **Free tier:** Free Web Search API + Free Rerank API. "Free access as we build AGI together." [LangSearch](https://langsearch.com/pricing)
- **Features:** Hybrid search (keyword + embedding), natural language queries, semantic reranking. [GitHub](https://github.com/langsearch-ai/langsearch)
- **No breaking changes detected.** Relatively new/stable.

### WebSearchAPI.ai
- **Built on Google Search.** Extracts and cleans content automatically. [WebSearchAPI.ai](https://websearchapi.ai/)
- **No significant changes detected.** Small/niche provider.

### SearXNG
- **Actively maintained:** Version 2026.5.13+ documented. Aggregates 249 search services. [SearXNG Docs](https://docs.searxng.org/)
- **Self-hosted only.** No official hosted API; requires running own instance or using public instances. [NoloWiz](https://nolowiz.com/how-to-use-searxng-as-a-private-search-api-step-by-step-guide/)
- **No breaking changes.** Still JSON API via `/search` endpoint.

### Marginalia
- **Stable, niche:** Indie search engine for text-heavy, non-commercial websites. Requires API key from `api.marginalia.nu`. [Marginalia API](https://www.marginalia.nu/marginalia-search/api/)
- **SearXNG integration:** Available as engine in SearXNG with `api_key` config. [SearXNG Docs](https://docs.searxng.org/dev/engines/online/marginalia.html)
- **No significant changes detected.**

### ⚠️ Google Programmable Search Engine (Deprecation Notice)
- **Deprecated "Search the entire web" option** (March 2026). New engines require at least one specific site. [Discourse](https://meta.discourse.org/t/google-search-for-discourse-ai-programmable-search-engine-and-custom-search-api/307107)
- **Free tier:** 100 queries/day still available for existing engines. [Google Developers](https://developers.google.com/custom-search/v1/overview)
- **Impact:** If pi-search-multi uses Google CSE, this is a breaking change.

---

## 2. New Search APIs Worth Adding (12th+ Backend)

### Search1API — ⭐ HIGH VALUE ADD
- **URL:** https://www.search1api.com/
- **Features:** Search, crawl, extract, and reason over live web. MCP support, CLI, reusable skills. One API for everything.
- **Why add:** Combines search + crawl + extract in one endpoint. Good complement to specialized backends.
- **Pricing:** Check site for current free tier.

### Linkup — ⭐ GOOD FOR EUROPEAN/ENTERPRISE
- **URL:** https://www.linkup.so/
- **Features:** Production-grade web search API for AI. `standard` and `deep` search modes. Returns structured results.
- **Why add:** High accuracy, enterprise-grade. Good for users needing European compliance (GDPR).
- **Compared in:** [AI Search API comparison 2026](https://aicraftguide.com/article/tavily-vs-exa-vs-perplexity-sonar-vs-linkup-ai-search-apis-2026)

### Jina Search (s.jina.ai) — ⭐ HIGH VALUE ADD
- **URL:** https://jina.ai/
- **Features:** `s.jina.ai` returns top 5 results as full markdown (not just snippets). No API key needed for basic use. Free tier with generous rate limits. Also has `r.jina.ai` for reading URLs and reranker API.
- **Why add:** Zero-config free search, returns full content not just snippets. Acquired by Elastic — long-term stability. [MarkTechPost](https://www.marktechpost.com/2026/05/04/top-search-and-fetch-apis-for-building-ai-agents-in-2026-tools-tradeoffs-and-free-tiers/)
- **Best for:** Fallback backend requiring zero setup.

### You.com Search API
- **URL:** https://you.com/pricing
- **Features:** Free tier available, up to $50/1K queries for paid. AI-native search with answers mode.
- **Why add:** Another AI-native option with good quality. [HumAI Comparison](https://www.humai.blog/perplexity-vs-tavily-vs-exa-vs-you-com-the-complete-ai-search-engine-comparison-2026/)

### Recommendation Priority for pi-search-multi
1. **Jina s.jina.ai** — Free, no key needed, full content. Best 12th backend.
2. **Search1API** — Unified search+crawl+extract. Good all-rounder.
3. **Linkup** — Enterprise/GDPR angle.
4. **You.com** — AI-native, but overlapping with existing Perplexity Sonar.

---

## 3. Pi Extension Best Practices

### Extension API Structure
- **TypeScript modules** extending pi's behavior via `ExtensionAPI` type from `@earendil-works/pi-coding-agent`. [Pi Extensions Docs](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
- **Capabilities:** Subscribe to lifecycle events, register custom tools callable by the LLM, add commands, configure settings. [Extensions README](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/README.md)
- **Tool registration:** Extensions use `ctx.tools.register()` or equivalent to expose tools to the LLM. Runtime tool registration by owner extensions supported. [pi.dev packages](https://pi.dev/packages/@tryinget/pi-toolbox-discovery)

### Installation
- `pi install npm:<package-name>` or `pi install git:github.com/user/repo`
- Extensions live in `~/.pi/` directory

### Config Handling
- Per-extension config in `~/.pi/agent/settings.json` or extension-specific config files
- pi-web-providers uses "explicit provider-specific option schemas for each managed tool" — good pattern to follow. [pi-web-providers](https://github.com/mavam/pi-web-providers)

### Latest API Additions (from pi releases)
- Extension APIs can **replace finalized `message_end` messages**
- **Custom editor factories** via `ctx.ui.getEditorComponent()`
- **Thinking level observation** — extensions can observe model thinking state changes
- [Pi Releases](https://github.com/earendil-works/pi/releases)

### Patterns from Popular Extensions
- **vegardx/pi-extensions:** Monorepo pattern with multiple extensions. Reports loaded extensions and config on session start. [GitHub](https://github.com/vegardx/pi-extensions)
- **ronnieops/pi-search:** 9 backend providers with auto-fallback. One `web_search` tool. [GitHub](https://github.com/ronnieops/pi-search)
- **buddingnewinsights/pi-search:** Bundles 4 search tools into one package (research toolkit). [GitHub](https://github.com/buddingnewinsights/pi-search)
- **nicobailon/pi-web-access:** Web search + content analysis via Exa/Perplexity/Gemini. [GitHub](https://github.com/nicobailon/pi-web-access)
- **ttttmr/pi-web-search:** Free Google Search using Gemini. No API key required. [GitHub](https://github.com/ttttmr/pi-web-search)

---

## 4. Result Quality / Re-ranking Approaches

### Reciprocal Rank Fusion (RRF) — ⭐ RECOMMENDED FOR pi-search-multi
- **Algorithm:** For each result in each backend's ranked list, score = Σ(1 / (k + rank_i)) where k≈60. Merge and sort.
- **Why it works:** Rank-based (not score-based), so works across backends with incompatible scoring systems. Robust to score scale differences. [Glaforge](https://glaforge.dev/posts/2026/02/10/advanced-rag-understanding-reciprocal-rank-fusion-in-hybrid-search/)
- **Implementation:** Simple, no ML needed. ~20 lines of code. [Safjan](https://safjan.com/implementing-rank-fusion-in-python/)

### Cross-Encoder Reranking
- **How:** After RRF merge, take top N results and run through a cross-encoder model (e.g., `jina-reranker-v2`, Cohere rerank) to re-score query-document pairs.
- **Trade-off:** Much higher quality but adds latency (100-500ms) and cost. Best for deep research mode.
- **Libraries:** `rerankers` (unified Python library for all ranking methods). [Answer.ai](https://www.answer.ai/posts/2024-09-16-rerankers.html)

### rankfuse Library
- **Python library** providing: cross-encoder reranking, RRF, weighted score combination, round-robin interleaving.
- **GitHub:** https://github.com/chu2bard/rankfuse
- **Best for:** Drop-in solution for multi-backend result fusion.

### Recommended Approach for pi-search-multi
1. **Default:** RRF with k=60 across all returned backend results. Fast, no extra dependencies.
2. **Quality boost:** Optional cross-encoder reranking on RRF top-20 using `jina-reranker-v2` (free tier) or LangSearch Rerank API (free).
3. **Dedup:** URL normalization + hostname+path dedup before RRF.
4. **Backend weighting:** Allow per-backend weight multiplier in config (e.g., trust Exa more than DDG).

---

## 5. Competitive Landscape

### Direct Competitors

| Extension | Backends | Key Differentiator | Gap vs pi-search-multi |
|-----------|----------|--------------------|------------------------|
| **pi-web-providers** (mavam) | Codex, Exa, Gemini, Parallel, Valyu | Provider-routing architecture, TUI for config, exposes 4 capabilities (search/contents/answers/research) | Fewer backends but richer capabilities per provider (answers, research mode) |
| **ronnieops/pi-search** | 9 backends | Auto-fallback, one tool | Fewer backends (9 vs 11), no parallel mode |
| **buddingnewinsights/pi-search** | 4 tools (Exa, GitHub code search, etc.) | Research toolkit focus (docs, code, libraries) | Different scope — research vs general search |
| **nicobailon/pi-web-access** | Exa, Perplexity, Gemini | Synthesized answers with citations | Fewer backends |
| **ttttmr/pi-web-search** | Google via Gemini | Free, no API key | Single backend |
| **@ollama/pi-web-search** | Ollama-native | Auto-managed with Ollama | Single provider |
| **@jmcombs/pi-tavily-search** | Tavily only | Simple, focused | Single backend |

### What pi-search-multi is Missing
1. **Content extraction** — pi-web-providers exposes `web_contents` tool. pi-search-multi only searches.
2. **Answer synthesis** — pi-web-providers has `web_answer` (grounded answers) and `web_research` (deep research). pi-search-multi returns raw results.
3. **Provider routing TUI** — pi-web-providers has interactive provider selection. pi-search-multi auto-selects.
4. **MCP support** — Search1API, Jina, and others expose MCP servers. Not clear if pi-search-multi supports MCP passthrough.
5. **Search modes** — pi-web-providers supports neural/keyword/hybrid/deep-research modes.

### pi-search-multi Advantages
1. **11 backends** — widest coverage of any pi search extension
2. **Parallel execution** with `combine=true` mode
3. **Graceful degradation** — fallback when backends fail
4. **Unified interface** — one `web_search` tool regardless of backend

---

## Sources

### Kept
- ddgs PyPI — package rename confirmation (https://pypi.org/project/ddgs/)
- ddgs GitHub — scope expansion details (https://github.com/deedy5/ddgs)
- Tavily — free tier confirmation (https://www.tavily.com/)
- Serper — pricing details (https://serper.dev/, https://scrappa.co/serper-alternative)
- Brave Search — free tier + independence (https://brave.com/search/api/, https://costbench.com/software/ai-search-apis/brave-search-api/free-plan/)
- Exa pricing update — March 2026 change (https://exa.ai/docs/changelog/pricing-update)
- Perplexity Sonar — pricing + new models (https://docs.perplexity.ai/docs/getting-started/pricing, https://aicosthub.com/guides/perplexity-api-cost-2026/)
- Firecrawl search — new endpoint (https://docs.firecrawl.dev/features/search)
- LangSearch — free tier + reranker (https://langsearch.com/pricing, https://github.com/langsearch-ai/langsearch)
- SearXNG — current version (https://docs.searxng.org/)
- Marginalia — API docs (https://www.marginalia.nu/marginalia-search/api/)
- Google CSE deprecation — March 2026 (https://meta.discourse.org/t/google-search-for-discourse-ai-programmable-search-engine-and-custom-search-api/307107)
- Jina Search — free, no-key search (https://jina.ai/, https://vibecodedthis.com/pricing/jina-ai-pricing/)
- Search1API — unified search+crawl (https://www.search1api.com/)
- Linkup — production-grade search (https://www.linkup.so/)
- Pi extensions docs — ExtensionAPI (https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
- pi-web-providers — competitor analysis (https://github.com/mavam/pi-web-providers)
- ronnieops/pi-search — 9-backend competitor (https://github.com/ronnieops/pi-search)
- RRF explanation — algorithm details (https://glaforge.dev/posts/2026/02/10/advanced-rag-understanding-reciprocal-rank-fusion-in-hybrid-search/)
- rankfuse — fusion library (https://github.com/chu2bard/rankfuse)
- rerankers — unified reranking (https://www.answer.ai/posts/2024-09-16-rerankers.html)

### Dropped
- Various SEO/comparison articles without primary data
- Bing Web Search API — no longer a free-tier option relevant to pi-search-multi
- Generic AI agent articles not specific to search APIs

---

## Gaps & Clarification Questions

1. **Which Google CSE engine ID does pi-search-multi use?** If it relies on "search entire web," the March 2026 deprecation is breaking.
2. **Does pi-search-multi already implement RRF?** If not, this is the single highest-value feature to add.
3. **Is content extraction in scope?** pi-web-providers exposes `web_contents` — should pi-search-multi add this to stay competitive?
4. **What's the pi-search-multi npm package name?** Couldn't find it published. Is it private/local only?
5. **Should answer synthesis (web_answer tool) be added?** pi-web-providers has it; Perplexity Sonar already returns synthesized answers.
6. **Is there a pi-search-multi-specific config schema?** The pi-web-providers pattern of "per-tool provider schemas" is elegant.
7. **Backend weighting preferences:** Should some backends be preferred by default (e.g., Exa for code, Brave for general, Sonar for answers)?

---

## Supervisor Coordination

No blockers. Research complete. Key decisions needed:
- Whether to add Jina s.jina.ai as 12th backend (recommended — free, no key)
- Whether to implement RRF for multi-backend result merging
- Whether to add content extraction and answer synthesis tools to match pi-web-providers
