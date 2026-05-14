# Title: pi-search-multi: a 12-backend search + content extraction extension I built for pi

---

## Suggested subreddits

- **r/PiAI** — primary, it's a pi package
- **r/commandline** — pi is a terminal coding agent
- **r/AI_Agents** — developer tooling adjacent
- **r/webdev** — search tooling for dev workflows

---

## Post draft

I've been using [pi](https://pi.dev) as my daily coding agent for a while now, and one thing kept bugging me — the search tool was single-backend. Just DuckDuckGo. No fallback.

So I built pi-search-multi, which chains **12 backends** together with auto-fallback and parallel combine mode. And since then it's grown some legs — content extraction, credential resolution, the works.

**12 backends, no key needed for 3 of them:**

- DuckDuckGo — no key, free, rate-limited
- **Jina AI** (new) — returns full markdown content, free tier with API key
- Marginalia — anti-SEO search, public key optional
- Serper — Google via API, 2500 free
- Brave — independent index, 2000 free/mo
- Tavily — best quality in my testing, 1000 free/mo
- Exa — fastest (~137ms), AI-native, 10 QPS free
- Firecrawl — 500 free credits, search + crawl
- LangSearch — genuinely free, no CC
- WebSearchAPI — Google-powered, 2000 free credits
- Perplexity Sonar — unlimited free, citation-based answers
- SearXNG — self-hosted metasearch, 70+ providers

**Latest additions:**

- **web_read** tool — fetch any URL as clean markdown using Jina Reader API (free, no key). Agent can read docs, articles, reference pages without a separate step
- **RRF combine mode** — when `combine=true`, results from all backends are merged using Reciprocal Rank Fusion (position-based scoring). Way better than arbitrary merge
- **Backend registry refactor** — adding a new backend is now one object definition, not 6+ edit points across the file
- **Config deep-merge fix** — global backends no longer silently lost when project config exists
- **ALL_CAPS warning** — if your API key looks like an env var name but the var is unset, you get a warning instead of silent failure

Install: `pi install npm:pi-search-multi`

Docs + benchmark: [github.com/ronnieops/pi-search-multi](https://github.com/ronnieops/pi-search-multi)

MIT, open source, feedback welcome.

---

## Post notes (not for Reddit)

- Target audience: devs using pi or curious about pi extensions
- Tone: casual, dev sharing a tool, not a launch
- Keep it real — mention free tier limits, DuckDuckGo slowness
- Jina AI and web_read are the headline new features worth calling out
