/**
 * Marginalia Search backend — anti-SEO, free with "public" key.
 */

import { timeoutSignal, sanitizeError } from "../utils.js";
import { parseMarginalia } from "../../backends/parsers.js";
import type { SearchResult } from "../types.js";

export async function searchMarginalia(
	query: string,
	numResults: number,
	apiKey: string | undefined,
	signal?: AbortSignal,
): Promise<{ results: SearchResult[] }> {
	const key = apiKey || "public";
	const response = await fetch(
		`https://api2.marginalia-search.com/${encodeURIComponent(key)}/search/${encodeURIComponent(query)}?index=0&count=${Math.min(numResults, 50)}`,
		{
			signal: timeoutSignal(signal),
			headers: { "Accept": "application/json" },
		},
	);

	if (!response.ok) {
		const text = await response.text().catch(() => "");
		throw new Error(`Marginalia ${sanitizeError(response.status, text)}`);
	}

	const data = (await response.json()) as Record<string, unknown>;
	return { results: parseMarginalia(data, numResults) };
}
