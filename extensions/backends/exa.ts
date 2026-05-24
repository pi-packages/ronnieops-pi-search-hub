/**
 * Exa backend — AI-native search, needs API key.
 */

import { timeoutSignal, sanitizeError } from "../utils.js";
import { parseExa } from "../../backends/parsers.js";
import type { SearchResult } from "../types.js";

export async function searchExa(
	query: string,
	numResults: number,
	apiKey: string,
	signal?: AbortSignal,
): Promise<{ results: SearchResult[] }> {
	const body = {
		query,
		numResults: Math.min(numResults, 25),
		contents: { text: true, highlights: true },
	};
	const response = await fetch("https://api.exa.ai/search", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": apiKey,
		},
		body: JSON.stringify(body),
		signal: timeoutSignal(signal),
	});
	if (!response.ok) {
		const text = await response.text().catch(() => "");
		let detail = text;
		try {
			const json = JSON.parse(text);
			detail = json.error || json.message || text;
		} catch {
			// use raw
		}
		throw new Error(`Exa ${sanitizeError(response.status, detail)}`);
	}
	const data = (await response.json()) as Record<string, unknown>;
	return { results: parseExa(data, numResults) };
}
