/**
 * DuckDuckGo search backend — free, no key needed.
 * Spawns Python subprocess using the ddgs library.
 */

import { spawn } from "node:child_process";
import { HTTP_TIMEOUT_MS } from "../utils.js";
import type { SearchResult } from "../types.js";

export async function searchDuckDuckGo(
	query: string,
	numResults: number,
	signal?: AbortSignal,
): Promise<{ results: SearchResult[] }> {
	if (signal?.aborted) throw new Error("DuckDuckGo search aborted");

	const pyScript = `
import json, sys
try:
    from ddgs import DDGS
except ImportError:
    # ddgs may be installed as a uv tool — find it and add to sys.path
    import subprocess, pathlib
    try:
        ddgs_bin = subprocess.check_output(["which", "ddgs"], text=True, stderr=subprocess.DEVNULL).strip()
        if ddgs_bin:
            # Walk up from the binary until we find site-packages — no hardcoded depth assumption
            ddgs_path = pathlib.Path(ddgs_bin).resolve()
            found = False
            for parent in [ddgs_path, *ddgs_path.parents]:
                for py_ver_dir in sorted((parent / "lib").iterdir(), reverse=True):
                    sp = py_ver_dir / "site-packages"
                    if sp.is_dir():
                        sys.path.insert(0, str(sp))
                        found = True
                        break
                if found:
                    break
            if not found:
                sys.exit(1)
    except Exception:
        sys.exit(1)
    from ddgs import DDGS
results = []
with DDGS() as ddgs:
    for i, r in enumerate(ddgs.text(${JSON.stringify(query)}, max_results=${numResults})):
        results.append({"title": r.get("title",""), "url": r.get("href",""), "snippet": r.get("body","")})
print(json.dumps({"results": results}))
`;

	return new Promise((resolve, reject) => {
		const pythonCmd = process.platform === "win32" ? "python" : "python3";
		const proc = spawn(pythonCmd, ["-c", pyScript], {
			stdio: ["pipe", "pipe", "pipe"],
		});

		let stdout = "";
		let stderr = "";

		proc.stdout.on("data", (data: Buffer) => { stdout += data.toString(); });
		proc.stderr.on("data", (data: Buffer) => { stderr += data.toString(); });

		// Timeout timer
		const timeout = setTimeout(() => {
			proc.kill();
			reject(new Error("DuckDuckGo search timed out"));
		}, HTTP_TIMEOUT_MS);

		// Abort signal handler
		const onAbort = () => {
			clearTimeout(timeout);
			proc.kill();
			reject(new Error("DuckDuckGo search aborted"));
		};
		if (signal) {
			if (signal.aborted) { clearTimeout(timeout); reject(new Error("DuckDuckGo search aborted")); return; }
			signal.addEventListener("abort", onAbort, { once: true });
		}

		proc.on("close", (code) => {
			clearTimeout(timeout);
			if (signal) signal.removeEventListener("abort", onAbort);
			if (code === 0) {
				try {
					resolve(JSON.parse(stdout.trim()));
				} catch {
					reject(new Error(`DuckDuckGo search: invalid JSON output: ${stdout.slice(0, 200)}`));
				}
			} else {
				const msg = stderr.trim().slice(0, 300);
				reject(new Error(`DuckDuckGo search failed (exit ${code}): ${msg || "unknown error"}`));
			}
		});

		proc.on("error", (err) => {
			clearTimeout(timeout);
			if (signal) signal.removeEventListener("abort", onAbort);
			reject(new Error(`DuckDuckGo search failed: ${err.message}`));
		});
	});
}
