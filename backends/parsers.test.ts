import { describe, it, expect } from "vitest";
import {
	parseMarginalia,
	parseWebSearchAPI,
	parseSerper,
	parseTavily,
	parseExa,
	parseBrave,
	parseLangSearch,
	parseFirecrawl,
	parsePerplexity,
	parseSearXNG,
	parseJina,
} from "./parsers.js";

// ---------------------------------------------------------------------------
// Marginalia
// ---------------------------------------------------------------------------

describe("parseMarginalia", () => {
	it("parses standard response", () => {
		const data = {
			results: [
				{ title: "Test 1", url: "https://example.com/1", description: "Desc 1" },
				{ title: "Test 2", url: "https://example.com/2", description: "Desc 2" },
			],
		};
		const results = parseMarginalia(data, 10);
		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({ title: "Test 1", url: "https://example.com/1", snippet: "Desc 1" });
	});

	it("handles missing fields gracefully", () => {
		const data = { results: [{}] };
		const results = parseMarginalia(data, 10);
		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({ title: "", url: "", snippet: "" });
	});

	it("truncates long descriptions to 500 chars", () => {
		const data = { results: [{ description: "x".repeat(600) }] };
		const results = parseMarginalia(data, 10);
		expect(results[0].snippet.length).toBe(500);
	});

	it("respects numResults limit", () => {
		const data = { results: Array.from({ length: 10 }, (_, i) => ({ title: `T${i}`, url: `https://e.com/${i}` })) };
		const results = parseMarginalia(data, 3);
		expect(results).toHaveLength(3);
	});

	it("handles empty results", () => {
		const results = parseMarginalia({}, 10);
		expect(results).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// WebSearchAPI
// ---------------------------------------------------------------------------

describe("parseWebSearchAPI", () => {
	it("parses organic results", () => {
		const data = {
			organic: [
				{ title: "Web 1", url: "https://web.com/1", description: "Web desc" },
			],
		};
		const results = parseWebSearchAPI(data, 10);
		expect(results).toHaveLength(1);
		expect(results[0]).toEqual({ title: "Web 1", url: "https://web.com/1", snippet: "Web desc" });
	});

	it("handles missing organic field", () => {
		const results = parseWebSearchAPI({}, 10);
		expect(results).toHaveLength(0);
	});

	it("handles organic as non-array", () => {
		const results = parseWebSearchAPI({ organic: "not an array" }, 10);
		expect(results).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// Serper
// ---------------------------------------------------------------------------

describe("parseSerper", () => {
	it("maps link to url", () => {
		const data = { organic: [{ title: "S", link: "https://s.com", snippet: "snip" }] };
		const results = parseSerper(data, 10);
		expect(results[0]).toEqual({ title: "S", url: "https://s.com", snippet: "snip" });
	});
});

// ---------------------------------------------------------------------------
// Tavily
// ---------------------------------------------------------------------------

describe("parseTavily", () => {
	it("maps content to snippet and preserves content field", () => {
		const data = { results: [{ title: "T", url: "https://t.com", content: "full content" }] };
		const results = parseTavily(data, 10);
		expect(results[0].snippet).toBe("full content");
		expect(results[0].content).toBe("full content");
	});
});

// ---------------------------------------------------------------------------
// Exa
// ---------------------------------------------------------------------------

describe("parseExa", () => {
	it("prefers text over highlight for snippet", () => {
		const data = { results: [{ title: "E", url: "https://e.com", text: "text val", highlight: "high val" }] };
		const results = parseExa(data, 10);
		expect(results[0].snippet).toBe("text val");
	});

	it("falls back to highlight when no text", () => {
		const data = { results: [{ title: "E", url: "https://e.com", highlight: "high val" }] };
		const results = parseExa(data, 10);
		expect(results[0].snippet).toBe("high val");
	});
});

// ---------------------------------------------------------------------------
// Brave
// ---------------------------------------------------------------------------

describe("parseBrave", () => {
	it("navigates web.results path", () => {
		const data = { web: { results: [{ title: "B", url: "https://b.com", description: "desc" }] } };
		const results = parseBrave(data, 10);
		expect(results[0]).toEqual({ title: "B", url: "https://b.com", snippet: "desc" });
	});

	it("returns empty when web is missing", () => {
		expect(parseBrave({}, 10)).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// LangSearch
// ---------------------------------------------------------------------------

describe("parseLangSearch", () => {
	it("navigates data.webPages.value path", () => {
		const data = { data: { webPages: { value: [{ name: "LS", url: "https://ls.com", snippet: "sn" }] } } };
		const results = parseLangSearch(data, 10);
		expect(results[0].title).toBe("LS");
		expect(results[0].snippet).toBe("sn");
	});

	it("prefers name over title", () => {
		const data = { data: { webPages: { value: [{ name: "Name", title: "Title", url: "https://ls.com" }] } } };
		const results = parseLangSearch(data, 10);
		expect(results[0].title).toBe("Name");
	});
});

// ---------------------------------------------------------------------------
// Firecrawl v2
// ---------------------------------------------------------------------------

describe("parseFirecrawl", () => {
	it("parses v2 object response with web array", () => {
		const data = { data: { web: [{ title: "FC", url: "https://fc.com", description: "d" }] } };
		const results = parseFirecrawl(data, 10);
		expect(results[0]).toEqual({ title: "FC", url: "https://fc.com", snippet: "d" });
	});

	it("parses v2 flat array response", () => {
		const data = { data: [{ title: "FC", url: "https://fc.com" }] };
		const results = parseFirecrawl(data, 10);
		expect(results).toHaveLength(1);
	});

	it("falls back to v1 results field", () => {
		const data = { results: [{ title: "FC1", url: "https://fc.com/1" }] };
		const results = parseFirecrawl(data, 10);
		expect(results).toHaveLength(1);
	});

	it("falls back to images when web is empty", () => {
		const data = { data: { web: [], images: [{ title: "Img", url: "https://img.com" }] } };
		const results = parseFirecrawl(data, 10);
		expect(results[0].title).toBe("Img");
	});
});

// ---------------------------------------------------------------------------
// Perplexity
// ---------------------------------------------------------------------------

describe("parsePerplexity", () => {
	it("builds answer result from content + citations", () => {
		const data = {
			citations: ["https://src1.com", "https://src2.com"],
			choices: [{ message: { content: "The answer is 42" } }],
		};
		const results = parsePerplexity(data, "what is the answer", 10);
		expect(results[0].title).toBe("Answer: what is the answer");
		expect(results[0].snippet).toBe("The answer is 42");
		expect(results).toHaveLength(3); // answer + 2 citations
	});

	it("extracts hostname as title from citation URLs", () => {
		const data = { citations: ["https://www.example.com/path/to/page"] };
		const results = parsePerplexity(data, "test", 10);
		expect(results[0].title).toBe("example.com/path/to/page");
	});

	it("handles empty citations", () => {
		const data = { citations: [] };
		const results = parsePerplexity(data, "test", 10);
		expect(results).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// SearXNG
// ---------------------------------------------------------------------------

describe("parseSearXNG", () => {
	it("prefers content over snippet", () => {
		const data = { results: [{ title: "SX", url: "https://sx.com", content: "content", snippet: "snip" }] };
		const results = parseSearXNG(data, 10);
		expect(results[0].snippet).toBe("content");
	});
});

// ---------------------------------------------------------------------------
// Jina
// ---------------------------------------------------------------------------

describe("parseJina", () => {
	it("parses data array with content", () => {
		const data = { data: [{ title: "J", url: "https://j.com", content: "full article" }] };
		const results = parseJina(data, 10);
		expect(results[0].title).toBe("J");
		expect(results[0].content).toBe("full article");
		expect(results[0].snippet).toBe("full article");
	});

	it("truncates content to 2000 chars", () => {
		const data = { data: [{ title: "J", url: "https://j.com", content: "x".repeat(3000) }] };
		const results = parseJina(data, 10);
		expect(results[0].content.length).toBe(2000);
	});
});
