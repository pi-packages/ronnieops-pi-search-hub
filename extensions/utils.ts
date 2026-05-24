/**
 * Shared utilities for pi-search-hub extension.
 */

import { join } from "node:path";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const HTTP_TIMEOUT_MS = 30_000;
export const COOLDOWN_MS = 2_000;
export const COMMAND_TIMEOUT_MS = 5_000;

export const MISSING_KEY_HELP =
	"Set the API key via env var (SEARCH_<BACKEND>_API_KEY), " +
	"config reference (\"apiKey\": \"SOME_ENV_VAR\"), " +
	"shell command (\"apiKey\": \"!pass show api/backend\"), " +
	"or a literal key in ~/.pi/agent/extensions/search.json. " +
	"DuckDuckGo & Marginalia need no key.";

// ---------------------------------------------------------------------------
// Agent directory
// ---------------------------------------------------------------------------

export function getAgentDir(): string {
	return join(process.env.HOME || process.env.USERPROFILE || "~", ".pi", "agent");
}

// ---------------------------------------------------------------------------
// Per-backend cooldown
// ---------------------------------------------------------------------------

const backendCooldowns = new Map<string, number>();

export function waitForCooldown(backend: string): Promise<void> {
	const until = backendCooldowns.get(backend);
	if (!until) return Promise.resolve();
	const delay = until - Date.now();
	if (delay <= 0) return Promise.resolve();
	return new Promise(r => setTimeout(r, delay));
}

export function markCooldown(backend: string) {
	backendCooldowns.set(backend, Date.now() + COOLDOWN_MS);
}

export function clearCooldowns() {
	backendCooldowns.clear();
}

// ---------------------------------------------------------------------------
// Signal helpers
// ---------------------------------------------------------------------------

/** Combine an optional caller signal with a default timeout. */
export function timeoutSignal(signal?: AbortSignal): AbortSignal | undefined {
	if (!signal) return AbortSignal.timeout(HTTP_TIMEOUT_MS);
	return AbortSignal.any([signal, AbortSignal.timeout(HTTP_TIMEOUT_MS)]);
}

// ---------------------------------------------------------------------------
// Error sanitization
// ---------------------------------------------------------------------------

/** Sanitize API error text — truncate and strip potential secrets. */
export function sanitizeError(status: number, text: string): string {
	const safe = text
		// Redact "Bearer <token>" and "Token <value>" patterns
		.replace(/(bearer|token)\s+[\w.\/-]{8,}/gi, "$1 [redacted]")
		// Redact key=value or "key": "value" pairs for known secret keys
		.replace(/(api[-_]?key|bearer|token|authorization|secret|password)["']?\s*[:=]\s*["']?[\w.\/-]{8,}/gi, "[redacted]")
		// Redact JSON key-value pairs where the value looks like a key
		.replace(/"(?:api[-_]?key|apiKey|token|secret|password|bearer)"\s*:\s*"[^"']{8,}"/gi, '"[redacted]"')
		// Redact x-api-key / Authorization header values in raw text
		.replace(/(x-api-key|authorization)\s*:\s*[\w.\/-]{8,}/gi, "$1: [redacted]")
		.slice(0, 300);
	return `API error (${status}): ${safe}`;
}
