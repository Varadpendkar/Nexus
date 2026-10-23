# SKILL: localstorage-patterns
**Layer:** 16 — State Management
**Goal:** Use browser localStorage safely for small durable client preferences, drafts, and cross-tab signals with schema validation, expiry, and graceful failure handling.

---

## Why This Matters (Senior Perspective)
localStorage looks simple because `getItem` and `setItem` are simple. Production failures happen around them: a stored JSON string is malformed, a previous release wrote a different schema, a user disables storage, quota is exceeded, private browsing behaves differently, or two tabs overwrite each other's changes. Another common failure is treating localStorage as a secure database. Any script executing on the origin can read it, so storing access tokens, secrets, or sensitive health/payment details creates avoidable exposure.

A senior developer treats storage as an unreliable persistence adapter. Reads can fail and values can be stale, untrusted, or from an older schema. They define a small storage contract, validate values before use, version keys or payloads, handle expiry explicitly, and provide an in-memory/default fallback when persistence is unavailable. They also distinguish persistence from synchronization: writing a key in one tab does not update React state in that same tab automatically, and the `storage` event is delivered to other same-origin documents rather than the tab that performed the write.

For creative websites and client apps, localStorage is excellent for theme choice, density preferences, a dismissed onboarding flag, or a small recoverable draft. It is not a replacement for a server database, not an authorization system, and not suitable for large binary datasets. Keep payloads small, avoid write-on-every-keystroke loops, and make the UI work even when storage throws. Persistence should improve the experience without becoming a single point of failure.

## Core Concepts

### 1. Use storage only for suitable data

localStorage is synchronous and string-based. It is suitable for small, non-sensitive values that should survive browser restarts. Use IndexedDB for larger structured data and a server for shared durable records.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const THEME_KEY = "portfolio:theme:v1";
type Theme = "light" | "dark";
function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}
```

**Gotcha:** Synchronous storage reads and writes can block the main thread; avoid large payloads and frequent hot-path writes.

**Before/after check:** Before the change, reproduce the failure for “use storage only for suitable data.” After the change, verify both the normal path and the edge case described above.

### 2. Wrap reads and writes in a safe adapter

Storage access can throw because of browser policy, disabled persistence, quota limits, or test environments. Centralize exception handling instead of scattering raw `localStorage` calls through components.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function safeGet(key: string): string | null {
  try { return window.localStorage.getItem(key); }
  catch (error) { console.warn("Storage read unavailable", error); return null; }
}
function safeSet(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true; }
  catch (error) { console.warn("Storage write unavailable", error); return false; }
}
```

**Gotcha:** Accessing `window.localStorage` itself may throw in restricted contexts; wrap the property access inside the try block.

**Before/after check:** Before the change, reproduce the failure for “wrap reads and writes in a safe adapter.” After the change, verify both the normal path and the edge case described above.

### 3. Validate parsed JSON

JSON parsing proves only that the string is valid JSON, not that it has the shape your app expects. Validate the result before using fields, and fall back to a safe default when validation fails.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type Preferences = { theme: Theme; compact: boolean };
function parsePreferences(raw: string | null): Preferences {
  if (!raw) return { theme: "dark", compact: false };
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value === "object" && value !== null &&
        "theme" in value && isTheme((value as { theme: unknown }).theme)) {
      return { theme: (value as { theme: Theme }).theme,
        compact: (value as { compact?: unknown }).compact === true };
    }
  } catch { /* Corrupt persisted data is recoverable. */ }
  return { theme: "dark", compact: false };
}
```

**Gotcha:** TypeScript casts do not validate runtime data; treat parsed values as `unknown` until checked.

**Before/after check:** Before the change, reproduce the failure for “validate parsed json.” After the change, verify both the normal path and the edge case described above.

### 4. Version the storage schema

Stored values can outlive the code that wrote them. Include a version in the key or payload and provide a migration for known old shapes. If migration cannot safely recover data, reset to a documented default.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type StoredEnvelope<T> = { version: 2; savedAt: number; value: T };
function encodePreferences(value: Preferences): string {
  const envelope: StoredEnvelope<Preferences> = { version: 2, savedAt: Date.now(), value };
  return JSON.stringify(envelope);
}
```

**Gotcha:** Renaming a key without a migration can strand user preferences; decide whether old data should migrate or intentionally expire.

**Before/after check:** Before the change, reproduce the failure for “version the storage schema.” After the change, verify both the normal path and the edge case described above.

### 5. Add expiry to temporary values

localStorage has no built-in TTL. Store an expiration timestamp and validate it on read. Expiry is useful for temporary dismissals, onboarding prompts, or short-lived drafts—not for enforcing security deadlines.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type ExpiringValue<T> = { value: T; expiresAt: number };
function readExpiring<T>(key: string, validate: (value: unknown) => value is T): T | null {
  const raw = safeGet(key);
  if (!raw) return null;
  try {
    const record: unknown = JSON.parse(raw);
    if (typeof record !== "object" || record === null) return null;
    const item = record as { value?: unknown; expiresAt?: unknown };
    if (typeof item.expiresAt !== "number" || item.expiresAt <= Date.now()) return null;
    return validate(item.value) ? item.value : null;
  } catch { return null; }
}
```

**Gotcha:** Client clocks can be wrong; expiry in localStorage is a UX cleanup mechanism, not a security control.

**Before/after check:** Before the change, reproduce the failure for “add expiry to temporary values.” After the change, verify both the normal path and the edge case described above.

### 6. Handle SSR and first render

Browser storage is unavailable during server rendering. Avoid reading it at module scope or assuming server and client have identical values. Choose a deterministic default and hydrate after mount, or use a framework-supported client-only boundary.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function useStoredTheme() {
  const [theme, setTheme] = React.useState<Theme>("dark");
  React.useEffect(() => {
    const stored = safeGet(THEME_KEY);
    if (isTheme(stored)) setTheme(stored);
  }, []);
  return [theme, setTheme] as const;
}
```

**Gotcha:** Applying the stored theme only after mount can cause a flash; use an early safe theme bootstrap where appropriate and avoid hydration mismatch.

**Before/after check:** Before the change, reproduce the failure for “handle ssr and first render.” After the change, verify both the normal path and the edge case described above.

### 7. Sync updates across tabs

The `storage` event fires in other documents when a storage area changes. Listen and clean up the listener. The writing tab must update its own UI directly because it does not receive its own event.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
React.useEffect(() => {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_KEY || !isTheme(event.newValue)) return;
    setTheme(event.newValue);
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}, []);
```

**Gotcha:** `clear()` emits an event with `key === null`; decide whether your app should treat that as reset.

**Before/after check:** Before the change, reproduce the failure for “sync updates across tabs.” After the change, verify both the normal path and the edge case described above.

### 8. Avoid write amplification

Saving on every render or every keystroke can cause needless synchronous work and wear through quota. Write only when values change, debounce draft writes when appropriate, and flush important edits deliberately.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const saveDraft = (() => {
  let timer: number | undefined;
  return (draft: string) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => safeSet("editor:draft:v2", draft), 250);
  };
})();
```

**Gotcha:** A debounced write can be lost if the page closes immediately; choose an explicit autosave interval and communicate draft status.

**Before/after check:** Before the change, reproduce the failure for “avoid write amplification.” After the change, verify both the normal path and the edge case described above.

### 9. Handle quota and corrupted values

A failed write should not crash the feature. Keep the current UI state in memory, show a restrained warning if persistence matters, and allow recovery by clearing or replacing the bad record.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function persistDraft(draft: string): { saved: boolean } {
  const saved = safeSet("editor:draft:v2", draft);
  return { saved };
}
```

**Gotcha:** Do not silently claim “Saved” when the write failed; distinguish saved-to-device from currently available in memory.

**Before/after check:** Before the change, reproduce the failure for “handle quota and corrupted values.” After the change, verify both the normal path and the edge case described above.

### 10. Never store secrets or authorization

localStorage is accessible to JavaScript on the origin. XSS can read it, browser extensions may have access, and users can modify values manually. The server must enforce permissions independently.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
// Safe: a display preference.
// Unsafe: accessToken, refreshToken, password, role: "admin".
safeSet("portfolio:theme:v1", "dark");
```

**Gotcha:** A client-side `isAdmin` flag can control presentation but must never authorize a server action.

**Before/after check:** Before the change, reproduce the failure for “never store secrets or authorization.” After the change, verify both the normal path and the edge case described above.

### 11. Choose storage events versus BroadcastChannel

The storage event is enough for simple same-origin key synchronization. BroadcastChannel supports richer messages without using persistent keys, but has its own lifecycle and browser-support considerations.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const channel = new BroadcastChannel("portfolio-preferences");
channel.postMessage({ type: "theme-changed", theme: "light" });
channel.close();
```

**Gotcha:** Close BroadcastChannel instances when no longer needed; do not create one repeatedly during render.

**Before/after check:** Before the change, reproduce the failure for “choose storage events versus broadcastchannel.” After the change, verify both the normal path and the edge case described above.

### 12. Test storage failure and migrations

Tests should cover missing values, malformed JSON, old versions, expiry, quota exceptions, and cross-tab synchronization. Mock the storage boundary rather than assuming the test environment behaves like every browser.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const storage = {
  getItem: (key: string) => { throw new Error("blocked"); },
  setItem: (_key: string, _value: string) => { throw new Error("quota"); },
};
function loadTheme(adapter = storage): Theme {
  try { const value = adapter.getItem(THEME_KEY); return isTheme(value) ? value : "dark"; }
  catch { return "dark"; }
}
```

**Gotcha:** A happy-path test in jsdom does not prove real Safari/private-mode behavior; test the fallback and verify target browsers.

**Before/after check:** Before the change, reproduce the failure for “test storage failure and migrations.” After the change, verify both the normal path and the edge case described above.

### 13. Build a resilient preference system

Combine safe access, schema validation, migration, cross-tab sync, accessibility, and a visible fallback. The interface must still work if persistence is blocked or stale.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function saveTheme(theme: Theme) {
  setTheme(theme); // Update the active tab immediately.
  const saved = safeSet(THEME_KEY, theme);
  return saved;
}
```

**Gotcha:** Keep storage keys namespaced by feature and version so unrelated code does not overwrite the same key.

**Before/after check:** Before the change, reproduce the failure for “build a resilient preference system.” After the change, verify both the normal path and the edge case described above.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Safe storage adapter

**What it does:** centralizes exceptions and provides a predictable fallback. **When to use it:** every production feature that reads or writes browser storage.

```tsx
const raw = safeGet("portfolio:theme:v1");
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 2: Validated JSON envelope

**What it does:** parses unknown data into a versioned, checked schema. **When to use it:** preferences or drafts that persist across deployments.

```tsx
const envelope = JSON.parse(raw) as unknown;
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 3: Versioned migration

**What it does:** transforms a known old schema into the current one. **When to use it:** when a release changes field names or defaults.

```tsx
if (record.version === 1) return migrateV1(record);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 4: Expiry wrapper

**What it does:** drops temporary records after a deadline. **When to use it:** dismissals, onboarding hints, and short-lived client drafts.

```tsx
{ value, expiresAt: Date.now() + 86_400_000 }
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 5: Cross-tab storage listener

**What it does:** updates other tabs after a preference changes. **When to use it:** theme and small user-visible settings.

```tsx
window.addEventListener("storage", onStorage);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 6: Debounced draft persistence

**What it does:** limits synchronous writes during fast typing. **When to use it:** editor drafts where a short delay is acceptable.

```tsx
window.setTimeout(() => safeSet(key, draft), 250);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 7: Memory-first fallback

**What it does:** keeps the current interaction usable even when persistence fails. **When to use it:** preferences and drafts where a storage failure should not block editing.

```tsx
setTheme(theme); const saved = safeSet(key, theme);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Storing access tokens | Any same-origin script can read localStorage. | Use a server-managed session and appropriately configured HttpOnly cookies. |
| Trusting parsed JSON shape | Old or edited data crashes components. | Validate every required field before returning typed data. |
| Accessing storage during SSR | Server render references `window` and throws. | Read in a client effect or a deliberate client-only bootstrap. |
| Ignoring quota errors | Saving a large draft crashes the feature. | Catch write errors and retain an in-memory fallback. |
| Claiming save success falsely | UI says saved although persistence failed. | Track persisted status separately from in-memory state. |
| No schema version | New code misreads old saved fields. | Version the envelope and implement a migration or reset path. |
| Using expiry for security | Users can edit timestamps and client clocks. | Enforce authorization and expiration on the server. |
| Writing on every render | Synchronous storage work causes jank. | Persist only on meaningful value changes and debounce suitable drafts. |
| Expecting same-tab storage event | The writer's UI never updates from its own event. | Update local state in the same function that writes storage. |
| Forgetting listener cleanup | Hot reload or remount creates duplicate updates. | Remove the event listener in the effect cleanup. |
| No handling for clear() | All keys disappear but UI remains stale. | Handle `event.key === null` according to a defined reset policy. |
| Unnamespaced keys | Two features overwrite each other's values. | Use feature-prefixed keys and explicit versions. |
| Large data in localStorage | Synchronous serialization blocks rendering. | Use IndexedDB for larger structured or binary data. |
| Assuming private mode behavior | Storage may be blocked or limited by policy. | Treat storage as optional and test failure paths. |

## Mental Models

1. **Storage is an unreliable adapter.** Reads and writes can fail, and the UI must still work.
2. **JSON is syntax, not validation.** A parseable object can still be the wrong schema.
3. **Persistence is not security.** Browser-readable data must be treated as exposed and editable.
4. **The writer does not hear its own storage event.** Update the current tab directly.
5. **Saved is a claim that needs evidence.** Distinguish in-memory state from durable persistence.
6. **Small data belongs in localStorage.** Larger structured records belong in IndexedDB or a server.
7. **Expiry is cleanup, not authorization.** Security decisions belong on trusted server infrastructure.

## Quick Reference

| Situation | Decision | Implementation cue |
|---|---|---|
| Theme preference | Small, non-sensitive, durable | `localStorage + validated enum` |
| Large offline records | Many/large structured values | `IndexedDB` |
| Authentication session | Security-sensitive | `Server session / HttpOnly cookie` |
| Malformed JSON | Parsing fails | `Catch and reset safely` |
| Schema change | Old saved values exist | `Version + migration` |
| Temporary dismissal | Expires after interval | `expiresAt timestamp` |
| Storage blocked | Read/write throws | `In-memory fallback` |
| Cross-tab theme | Other tabs need update | `storage event` |
| Same-tab update | Writer must update immediately | `Update app state directly` |
| Fast typing draft | Avoid many sync writes | `Debounce + status` |
| Quota exceeded | Write does not persist | `Catch error and explain recoverable state` |
| SSR | No window on server | `Client effect/bootstrap` |
| Sensitive role flag | Can be edited by user | `Never use for authorization` |
| Test coverage | Browser behaviors vary | `Mock adapter + real-device check` |

## Build Challenge

### Build: Build a resilient settings and draft-saving module for a portfolio editor. Persist theme, compact layout, and a small draft; expire a temporary onboarding dismissal after seven days; sync theme changes across tabs; migrate an older preference schema; and remain usable when localStorage throws. Demonstrate malformed JSON and quota failure, and never store credentials or trust client-side role values.

#### Requirements

1. Create a storage adapter that catches property-access, read, parse, and write failures.
2. Validate every stored value before using it.
3. Version the payload and implement a migration from a previous shape.
4. Persist only non-sensitive durable preferences and a bounded draft.
5. Implement an expiry timestamp for a temporary dismissal.
6. Update the active tab immediately after a preference change.
7. Listen for storage events and remove the listener on cleanup.
8. Handle clear() and malformed records explicitly.
9. Debounce draft writes and report whether persistence succeeded.
10. Provide deterministic SSR defaults and avoid module-scope window access.
11. Test missing, malformed, expired, migrated, and throwing storage cases.
12. Demonstrate that the app remains usable when persistence is unavailable.

#### Failure scenarios you must reproduce

1. Start from a clean browser context and confirm the initial state is deterministic.
2. Inject malformed or obsolete persisted input and confirm the application recovers without a blank screen.
3. Trigger two competing updates and prove that the older intent cannot overwrite the latest one.
4. Disable or break the persistence/network boundary and verify that the core interaction remains usable.
5. Navigate with keyboard only and confirm that controls expose their current state and error feedback.

#### Definition of done

- [ ] All state has a named owner and the source of truth is documented.
- [ ] The main user journey works from a clean load and after refresh.
- [ ] Malformed, stale, or failed external input is handled without an uncaught exception.
- [ ] The required race/failure scenario is reproduced by an automated test.
- [ ] Controls have accessible names, keyboard behavior, and meaningful status feedback.
- [ ] No secret or authorization decision is trusted from client-controlled state.
- [ ] The quick reference choices are reflected in the implementation.
- [ ] A short debugging note explains how to inspect the failure and verify the fix.

#### Debugging sequence

1. Reproduce the bug with a fixed test case rather than random clicking.
2. Inspect the actual URL/store/storage payload and compare it with the declared schema.
3. Trace the event from the UI control to the state transition and persistence boundary.
4. Check browser DevTools console and storage/network panels for the first failing operation.
5. Add a regression test for the exact failure before considering the work complete.

#### Browser and runtime compatibility

Browser storage, History API, SSR behavior, and framework router integrations vary by runtime. Verify the target browsers and the exact library version in the project. Provide a deterministic fallback when the browser feature or persistence adapter is unavailable. Do not rely on development-only behavior as proof of production correctness.

#### Performance and accessibility review

Measure before optimizing. Avoid broad subscriptions, repeated synchronous writes, or navigation updates that trigger unnecessary work. Keep keyboard access, focus visibility, semantic controls, and clear loading/error feedback in the acceptance criteria. Test reduced-motion preferences if the feature includes transitions, and ensure state changes do not depend on animation finishing.

#### Gotchas to revisit

- **Gotcha:** Synchronous storage reads and writes can block the main thread; avoid large payloads and frequent hot-path writes.
- **Gotcha:** Accessing `window.localStorage` itself may throw in restricted contexts; wrap the property access inside the try block.
- **Gotcha:** TypeScript casts do not validate runtime data; treat parsed values as `unknown` until checked.
- **Gotcha:** Renaming a key without a migration can strand user preferences; decide whether old data should migrate or intentionally expire.

#### Review checklist

- [ ] At least one unit test covers a normal transition.
- [ ] At least one integration test covers the failure scenario.
- [ ] State is validated at every external boundary.
- [ ] No component subscribes to more state than it needs.
- [ ] The app behaves predictably after refresh, direct entry, or storage failure.
- [ ] Error messages explain the next action without exposing internal details.

## Production Review Notes

### Storage availability is a capability check

Do not assume the existence of the `localStorage` property means reads and writes will succeed. Access can fail under browser policy, sandboxed frames, privacy settings, or test doubles. Probe the actual operation inside a try/catch when necessary, and keep the application functional if the probe fails. A storage adapter also makes failure cases easy to test.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Schema validation and migration discipline

Persisted values outlive deploys, so a storage schema needs a policy. Include a version and validate the payload before exposing it to components. Migrations should be explicit, pure, and covered by fixtures from previous releases. If a value is too old to migrate safely, reset it and explain the behavior where user work could be lost.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Cross-tab consistency is not a database transaction

The storage event can notify other tabs that a key changed, but it does not provide locking or conflict resolution. Two tabs can edit a draft and overwrite each other. For simple preferences, last-write-wins may be acceptable; for meaningful user content, use server revisions, conflict detection, or a storage system designed for richer coordination.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Quota and size budgets

localStorage stores strings and requires serialization. Large payloads can consume quota and block the main thread during JSON conversion. Establish a small size budget, store only the fields needed to restore the experience, and move larger records to IndexedDB or a server. Handle write failures without losing the active in-memory edit.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Debounce versus durability

Debouncing reduces repeated synchronous writes, but it creates a window in which the latest change exists only in memory. Pick a delay based on the cost of lost work, expose a saving/saved state when appropriate, and flush at deliberate checkpoints. Do not rely on unload handlers as a universal guarantee that a final write will succeed.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Security and trust boundaries

Storage content is fully under client control. XSS, extensions, manual edits, or old application versions can modify it. Never use stored values to authorize an operation or determine a trusted price, role, entitlement, or server permission. Validate identifiers and business rules on the server, and keep credentials out of localStorage.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### SSR, hydration, and flash of wrong theme

Server rendering cannot read browser storage. If a stored theme is applied only after hydration, the user may briefly see the default theme. Choose a deterministic server default, then apply a carefully designed early bootstrap or client effect. Avoid reading `window` during module evaluation and ensure the resulting markup does not create a hydration mismatch.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Cross-tab reset and logout

A clear or logout operation must reset both persisted values and in-memory state. The `storage` event may report `key === null` for a clear operation. Define whether that should reset all preferences or only keys owned by the feature. When accounts switch, remove account-specific drafts before rendering the new account's workspace.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Testing with injected adapters

An adapter lets tests simulate blocked reads, quota exceptions, malformed JSON, and old schemas without relying on a browser's exact implementation. Add at least one real-browser smoke test for target browsers because jsdom cannot reproduce every privacy and storage policy. Ensure tests clear shared storage to avoid order-dependent failures.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Observability without leaking content

Diagnostics should say which key failed and whether the operation was read, parse, migration, or write. Do not log the complete draft or sensitive payload. A small telemetry event can count storage failures and browser categories while respecting privacy requirements. Make user-facing messaging proportionate: a failed theme preference write may need no blocking alert, while a failed draft save deserves clear status.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Storage events and same-tab updates

The tab that writes a key does not receive its own `storage` event. The write function must update current React state directly, then let other tabs synchronize through the event. Always remove event listeners when the owning component or provider unmounts, and validate incoming `newValue` before applying it.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Expiry and clock assumptions

An expiry timestamp is useful for housekeeping, but the client clock may be wrong and the user can edit stored values. Use expiry only for non-security UX such as onboarding hints. If a server-side session or signed link expires, enforce that on the server. Clear expired values when encountered to prevent repeated parsing of dead data.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

