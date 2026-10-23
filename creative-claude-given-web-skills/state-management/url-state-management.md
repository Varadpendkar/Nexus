# SKILL: url-state-management
**Layer:** 16 — State Management
**Goal:** Treat query parameters and paths as a typed, shareable interface for filters, sorting, pagination, tabs, and navigable UI state.

---

## Why This Matters (Senior Perspective)
URL state is often treated as a routing detail until a production user copies a link and loses the filters, presses Back and gets an unexpected screen, or reloads a search page and sees a different result. These are not cosmetic bugs: they break collaboration, support reproduction, browser navigation, analytics, and trust. Query parameters can also become a source of subtle bugs when repeated keys are collapsed accidentally, defaults are serialized inconsistently, malformed values crash a page, or private information is placed in a shareable URL.

A senior developer decides which state deserves a URL representation. Search terms, sort order, page number, selected public tab, and filters usually belong there because users expect to bookmark, share, refresh, and navigate through them. Temporary modal animation progress, password fields, and private tokens do not. They parse URL values as untrusted input, normalize them into a stable internal shape, and serialize them canonically so equivalent states do not produce a mess of URLs.

For portfolio galleries, catalog pages, documentation, and dashboards, URL state makes a view reproducible. A client can send a link to a filtered project list and the recipient sees the same view. The key is to define history semantics: use `push` when the user has made a meaningful navigational choice, and `replace` for noisy intermediate updates such as each keystroke when that is the desired UX. Always preserve unrelated query parameters and provide sensible defaults when values are absent or invalid.

## Core Concepts

### 1. Decide what belongs in the URL

Public, navigable, reproducible view state belongs in the URL. Private form values, ephemeral hover state, and secrets do not. This boundary keeps links useful without exposing data that should not travel through browser history or referrer logs.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
// URL-worthy: q, sort, page, category.
// Usually local-only: hoveredCardId, animationProgress, passwordDraft.
const initialFilters = { query: "", sort: "newest", page: 1 };
```

**Gotcha:** Query strings can be copied, logged, bookmarked, and sent as referrers; never put credentials or sensitive personal data there.

**Before/after check:** Before the change, reproduce the failure for “decide what belongs in the url.” After the change, verify both the normal path and the edge case described above.

### 2. Parse parameters defensively

URLSearchParams returns strings or null, not trusted typed values. Validate enums, clamp numeric ranges, and use defaults when parameters are malformed.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function parsePage(params: URLSearchParams): number {
  const raw = Number(params.get("page"));
  return Number.isInteger(raw) && raw >= 1 && raw <= 500 ? raw : 1;
}
function parseSort(params: URLSearchParams): "newest" | "popular" {
  return params.get("sort") === "popular" ? "popular" : "newest";
}
```

**Gotcha:** `Number(null)` is zero; check absence and validate the intended range explicitly.

**Before/after check:** Before the change, reproduce the failure for “parse parameters defensively.” After the change, verify both the normal path and the edge case described above.

### 3. Serialize state canonically

A canonical serializer removes defaults, orders keys consistently when constructing from scratch, and encodes values correctly. Canonical URLs reduce duplicate links and simplify tests.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function serializeFilters(filters: { query: string; sort: string; page: number }) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.page !== 1) params.set("page", String(filters.page));
  return params.toString();
}
```

**Gotcha:** Do not manually concatenate raw query text; spaces, ampersands, and Unicode need proper encoding.

**Before/after check:** Before the change, reproduce the failure for “serialize state canonically.” After the change, verify both the normal path and the edge case described above.

### 4. Preserve unrelated parameters

A widget should update only the keys it owns. Replacing the full query string can silently erase campaign attribution, another feature's filters, or a parameter owned by the parent route.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function updateQueryKey(key: string, value: string | null) {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(key);
  else url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}
```

**Gotcha:** `replaceState` changes the URL but does not emit a `popstate` event; keep your own UI synchronized or use the router's navigation API.

**Before/after check:** Before the change, reproduce the failure for “preserve unrelated parameters.” After the change, verify both the normal path and the edge case described above.

### 5. Choose push versus replace

`pushState` creates a Back-button stop; `replaceState` edits the current history entry. Search keystrokes often use replace or a debounced push, while page navigation and deliberate filter submissions may use push.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function writeUrl(next: URL, mode: "push" | "replace") {
  if (mode === "push") window.history.pushState({}, "", next);
  else window.history.replaceState({}, "", next);
}
```

**Gotcha:** Pushing on every keystroke makes Back feel broken because users must traverse every character.

**Before/after check:** Before the change, reproduce the failure for “choose push versus replace.” After the change, verify both the normal path and the edge case described above.

### 6. Support repeated parameters

Some filters are multi-select and naturally use repeated keys, such as `tag=css&tag=react`. Use `getAll` and `append` rather than assuming every key has one value.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const params = new URLSearchParams("?tag=css&tag=react");
const tags = params.getAll("tag");
const next = new URLSearchParams();
for (const tag of [...new Set(tags)].sort()) next.append("tag", tag);
```

**Gotcha:** `set` replaces all values for a key; use it only when the parameter is truly single-valued.

**Before/after check:** Before the change, reproduce the failure for “support repeated parameters.” After the change, verify both the normal path and the edge case described above.

### 7. Synchronize browser Back and Forward

The browser updates the URL during history traversal. Listen for `popstate` in vanilla apps, or let the routing framework own the subscription. Clean up listeners to avoid duplicated handlers.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
React.useEffect(() => {
  const syncFromUrl = () => setFilters(parseFilters(new URLSearchParams(window.location.search)));
  window.addEventListener("popstate", syncFromUrl);
  return () => window.removeEventListener("popstate", syncFromUrl);
}, []);
```

**Gotcha:** `pushState` and `replaceState` do not themselves trigger `popstate`; the event fires during traversal, not on writes.

**Before/after check:** Before the change, reproduce the failure for “synchronize browser back and forward.” After the change, verify both the normal path and the edge case described above.

### 8. Avoid stale URL snapshots

If several controls update the URL based on a captured query string, a delayed callback can overwrite a newer update. Read the latest URL at commit time or use router state and functional updates.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function setParamFromLatestUrl(key: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.replaceState({}, "", url);
}
```

**Gotcha:** Debounced updates need cancellation on unmount and when a newer value supersedes the pending one.

**Before/after check:** Before the change, reproduce the failure for “avoid stale url snapshots.” After the change, verify both the normal path and the edge case described above.

### 9. Keep URL state and component state aligned

Choose one source of truth for URL-represented values. If local state is used for immediate typing, define a deliberate draft-versus-committed model; otherwise a URL change can update one copy but not the other.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const [draftQuery, setDraftQuery] = React.useState(committedQuery);
React.useEffect(() => {
  setDraftQuery(committedQuery);
}, [committedQuery]);
```

**Gotcha:** An effect that copies props to state can overwrite a user's draft; only synchronize when the product's draft/commit semantics require it.

**Before/after check:** Before the change, reproduce the failure for “keep url state and component state aligned.” After the change, verify both the normal path and the edge case described above.

### 10. Handle router framework boundaries

In React Router or Next.js, use the framework's navigation/search-param APIs when available. Direct History API writes may bypass router subscriptions, cache invalidation, or server-rendered route behavior.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
// React Router example
const [searchParams, setSearchParams] = useSearchParams();
function selectSort(sort: "newest" | "popular") {
  setSearchParams(current => {
    const next = new URLSearchParams(current);
    if (sort === "newest") next.delete("sort");
    else next.set("sort", sort);
    return next;
  });
}
```

**Gotcha:** Framework APIs vary by version and router mode; verify the API for the installed version instead of mixing navigation models.

**Before/after check:** Before the change, reproduce the failure for “handle router framework boundaries.” After the change, verify both the normal path and the edge case described above.

### 11. Make filters accessible and predictable

URL state should power semantic controls. A selected tab needs tab semantics if it behaves as a tab set; a sort control can be a labelled select. Announce meaningful result updates without flooding screen readers on every keystroke.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function SortControl({ value, onChange }: {
  value: "newest" | "popular"; onChange: (value: "newest" | "popular") => void;
}) {
  return <label>Sort projects
    <select value={value} onChange={event => onChange(event.target.value as "newest" | "popular")}>
      <option value="newest">Newest</option>
      <option value="popular">Most popular</option>
    </select>
  </label>;
}
```

**Gotcha:** URL changes alone do not guarantee an accessible announcement; provide a status region when result content meaningfully changes.

**Before/after check:** Before the change, reproduce the failure for “make filters accessible and predictable.” After the change, verify both the normal path and the edge case described above.

### 12. Test malformed and shared links

A URL is an external input boundary. Test missing parameters, invalid enums, repeated values, encoded Unicode, out-of-range pages, and direct entry into a nested route.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const cases = [
  ["?page=0", 1],
  ["?page=9999", 1],
  ["?page=3", 3],
] as const;
for (const [search, expected] of cases) {
  console.assert(parsePage(new URLSearchParams(search)) === expected);
}
```

**Gotcha:** A route that works only after navigating from the homepage may fail on direct load due to server rewrite or route configuration.

**Before/after check:** Before the change, reproduce the failure for “test malformed and shared links.” After the change, verify both the normal path and the edge case described above.

### 13. Build a shareable filtered view

Integrate parsing, canonical serialization, history behavior, repeated keys, accessibility, and tests. The URL should recreate the same meaningful view after refresh or in a new tab.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type Filters = { q: string; page: number; sort: "newest" | "popular"; tags: string[] };
function parseFilters(params: URLSearchParams): Filters {
  const pageValue = Number(params.get("page"));
  return {
    q: (params.get("q") ?? "").slice(0, 120),
    page: Number.isInteger(pageValue) && pageValue > 0 && pageValue <= 500 ? pageValue : 1,
    sort: params.get("sort") === "popular" ? "popular" : "newest",
    tags: [...new Set(params.getAll("tag").filter(Boolean))].slice(0, 10),
  };
}
```

**Gotcha:** Do not trust a URL's selected ID if the referenced record is deleted or the current user lacks permission to view it.

**Before/after check:** Before the change, reproduce the failure for “build a shareable filtered view.” After the change, verify both the normal path and the edge case described above.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Parse-normalize-serialize

**What it does:** converts untrusted URL strings into validated typed state and back into a canonical query. **When to use it:** every page with shareable filters or pagination.

```tsx
const filters = parseFilters(new URLSearchParams(location.search));
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 2: History policy by interaction

**What it does:** gives Back meaningful navigation stops without recording every transient edit. **When to use it:** search inputs, filter submission, tabs, and pagination.

```tsx
history.replaceState({}, "", nextUrl);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 3: Repeated-key multi-select

**What it does:** represents multi-select filters without inventing fragile comma formats. **When to use it:** tags, categories, or multiple facets.

```tsx
const selected = params.getAll("tag");
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 4: Preserve-and-update

**What it does:** changes one owned key while retaining other features' query parameters. **When to use it:** independently developed filter widgets or embedded search panels.

```tsx
const next = new URLSearchParams(current); next.set("sort", "popular");
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 5: Back/Forward synchronization

**What it does:** restores the UI from the URL when history changes. **When to use it:** vanilla History API applications or custom routers.

```tsx
window.addEventListener("popstate", syncFromUrl);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 6: Draft versus committed search

**What it does:** lets typing remain immediate while URL updates happen at a deliberate boundary. **When to use it:** remote search where each keystroke should not create history entries.

```tsx
setDraftQuery(value); debouncedCommit(value);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 7: Framework-native navigation

**What it does:** keeps URL updates inside the router's state model. **When to use it:** React Router, Next.js, or other framework-managed routing.

```tsx
setSearchParams(current => new URLSearchParams(current));
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Trusting numeric params | Malformed values create page zero or NaN behavior. | Validate integer, minimum, and maximum before using the value. |
| Putting secrets in query strings | Links and logs can expose credentials. | Keep secrets in server-managed sessions or secure request bodies. |
| Erasing unrelated keys | A filter update destroys analytics or other feature state. | Clone current URLSearchParams and change only owned keys. |
| Pushing each keystroke | Back becomes a character-by-character undo tool. | Use replace for drafts and push for deliberate committed changes. |
| Ignoring repeated keys | Multi-select filters silently lose options. | Read with getAll and serialize with append. |
| Manual string concatenation | Ampersands and Unicode break encoding. | Use URL and URLSearchParams APIs. |
| No popstate sync | Back changes address but leaves stale results visible. | Subscribe to popstate or use the router's state hooks. |
| Expecting pushState to emit popstate | UI synchronization never runs on programmatic writes. | Update app state in the write path; use popstate for history traversal. |
| Stale debounced callback | An old timer overwrites the newest filter. | Cancel prior timers and read the latest URL before committing. |
| Duplicate source of truth | URL and React state disagree after refresh or Back. | Declare URL as canonical or define explicit draft/commit semantics. |
| No default normalization | Equivalent states produce noisy duplicate links. | Omit defaults and normalize invalid values consistently. |
| Unsafe selected ID | A copied URL points to a deleted or unauthorized record. | Validate record existence and authorization on data access. |
| Direct-route failure | Shared links return server 404 despite client navigation working. | Configure hosting rewrites and test direct entry. |
| Inaccessible update feedback | Users cannot tell that results changed. | Use semantic controls and a restrained status announcement. |

## Mental Models

1. **A URL is an external input boundary.** Parse and validate it like any other user input.
2. **Shareability is a feature contract.** A copied link should reproduce the meaningful view.
3. **History is part of the interface.** Back and Forward must have intentional semantics.
4. **Canonical state reduces entropy.** One view should not generate many equivalent URLs.
5. **One source of truth prevents drift.** Draft state is acceptable only when its boundary is explicit.
6. **Query parameters are public metadata.** Never put credentials or secrets in them.
7. **A route must work from a cold start.** Client-only navigation is not enough.

## Quick Reference

| Situation | Decision | Implementation cue |
|---|---|---|
| Search term | Shareable and reproducible | `q parameter` |
| Page number | Bookmarkable navigation | `page parameter + bounds` |
| Sort order | Stable view preference | `enum validation` |
| Multi-select facets | Several values for one key | `getAll/append` |
| Default value | Avoid noisy URLs | `Omit default during serialize` |
| Meaningful navigation | Back should return to prior view | `pushState/router push` |
| Typing draft | Avoid history spam | `replaceState/debounce` |
| Back/Forward | URL changed through history | `popstate/router hook` |
| Independent widget | Keep other query keys | `Clone params then update` |
| Private form data | Not safe to share | `Local state; never URL` |
| Nested route | Link opens directly | `Server rewrite + route test` |
| Malformed URL | Untrusted input | `Parse, validate, normalize` |
| Framework app | Router tracks navigation | `Use native router API` |
| Result refresh | View changed after filter | `Accessible status message` |

## Build Challenge

### Build: Build a shareable project directory with query, sort, page, and repeated category filters. The URL must restore the view in a fresh tab, survive malformed values, preserve unrelated campaign parameters, and behave sensibly with Back/Forward. Include a delayed search update and prove an older debounce cannot overwrite a newer query. Test direct route entry and keyboard-accessible controls.

#### Requirements

1. Define a typed filter model and explicit defaults.
2. Parse all query parameters as untrusted strings.
3. Clamp page numbers and reject unsupported sort values.
4. Support repeated category keys without dropping selections.
5. Serialize canonically and omit default values.
6. Preserve unrelated query parameters during updates.
7. Choose push versus replace behavior and document why.
8. Synchronize state on Back/Forward navigation.
9. Cancel or supersede stale debounced updates.
10. Keep secrets and sensitive fields out of the URL.
11. Use accessible labels and status feedback for changed results.
12. Test malformed, repeated, Unicode, and direct-entry URLs.

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

- **Gotcha:** Query strings can be copied, logged, bookmarked, and sent as referrers; never put credentials or sensitive personal data there.
- **Gotcha:** `Number(null)` is zero; check absence and validate the intended range explicitly.
- **Gotcha:** Do not manually concatenate raw query text; spaces, ampersands, and Unicode need proper encoding.
- **Gotcha:** `replaceState` changes the URL but does not emit a `popstate` event; keep your own UI synchronized or use the router's navigation API.

#### Review checklist

- [ ] At least one unit test covers a normal transition.
- [ ] At least one integration test covers the failure scenario.
- [ ] State is validated at every external boundary.
- [ ] No component subscribes to more state than it needs.
- [ ] The app behaves predictably after refresh, direct entry, or storage failure.
- [ ] Error messages explain the next action without exposing internal details.

## Production Review Notes

### URL contract and naming

Treat query keys as a public contract that may appear in bookmarks, documentation, analytics, and support tickets. Prefer short but meaningful names, document repeated keys, and avoid changing semantics silently. If a key must be renamed, support the old name for a migration window or redirect to a canonical URL. Do not let unrelated widgets invent conflicting meanings for the same key.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Canonicalization and duplicate links

Equivalent states can produce different URLs when defaults are explicit in one link and omitted in another, or when repeated values appear in different orders. Canonical serialization makes links easier to compare and reduces duplicate analytics dimensions. Sort unordered multi-select filters before writing them, but preserve order when the user's selection order has actual meaning.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### History behavior as product design

History is not merely a browser implementation detail. A user expects Back to return to a meaningful prior view, not to undo each character in a search box. Decide whether a filter change is immediate navigation, a draft, or a committed search. Use `replace` for intermediate states and `push` for deliberate navigation when that matches the product's mental model.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Debouncing and race control

Debouncing a search URL update can reduce work, but it introduces a delayed write that can race with a newer selection or route change. Cancel the timer on unmount, capture the intended value, and verify the route is still the one that scheduled it before committing. Test the sequence where a user types, selects a category, then navigates Back before the timer fires.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Server rendering and direct entry

A shareable route must work when opened in a new tab or pasted into a browser, not only after client navigation. Hosting must serve the application shell for supported client routes, and server-rendered frameworks must parse the same parameters on the server and client. Test direct entry with malformed values and ensure it produces a stable fallback rather than a 404 or hydration mismatch.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Privacy and URL exposure

Query strings can appear in browser history, copied messages, screenshots, analytics, server logs, and referrer headers. Keep credentials, one-time secrets, private notes, and sensitive personal information out of query parameters. A random-looking identifier is not a substitute for authorization: the server still checks whether the current user can access the referenced resource.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Framework navigation boundaries

Routers often provide APIs that coordinate URL changes with rendering, data loading, and cache behavior. Calling `history.pushState` directly inside a framework can leave framework state unaware of the update. Use the framework's search-param/navigation API when possible and test the exact version. In a vanilla application, centralize History API access behind one adapter.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Accessibility of dynamic results

When a query changes results, controls must remain labelled and keyboard-operable. Use a status region for a meaningful result-count update, but avoid announcing every keystroke in a fast search. Focus should not jump unexpectedly after each parameter change. If tabs are represented in the URL, preserve correct tab keyboard behavior rather than merely styling links to look like tabs.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Validation and resource limits

Limit query length, page bounds, repeated filter counts, and accepted enum values. These limits protect both UX and backend cost. Never use an unvalidated page value to generate huge requests or assume a filter ID is valid because it came from a URL. Validation should happen at the client boundary for usability and again on the server for security.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Testing the URL as an interface

Write table-driven tests for missing values, invalid values, repeated keys, Unicode, encoded delimiters, and default omission. Add integration tests for Back/Forward, direct route loading, and preservation of unrelated parameters. A serializer test alone does not prove the router or hosting environment supports the URL.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Analytics and canonical links

Canonical URLs help analytics group equivalent views, but avoid placing high-cardinality or personal data in query strings. If the site emits canonical metadata, make sure it reflects the public canonical page rather than every transient filter combination unless filtered pages are intentionally indexable. Search-engine behavior and framework metadata APIs can vary by deployment.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Offline and unsupported routes

If a route contains a valid filter but the referenced data is unavailable offline, preserve the URL and show a recoverable offline state rather than silently resetting filters. For unknown enum values, normalize to a safe default and optionally replace the URL with its canonical form. Do not rewrite the URL repeatedly in a render loop.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```


### Release checklist for URL contracts

Before release, capture representative URLs from production-like data and open each in a clean browser profile. Confirm the page does not depend on navigation from the home page, that default values are stable, and that a copied link works for a second user with the appropriate permissions. Verify that encoded spaces, Unicode labels, repeated filter keys, and unknown values do not break parsing. If the feature is used by support staff, document the query keys so a reported URL can be reproduced without guessing.

A URL contract is versioned by usage even when it has no formal schema file. When changing a parameter's meaning, preserve compatibility where practical, normalize old forms, and add a regression case. Monitor whether Back/Forward behavior matches the intended workflow after a release. The feature is not complete until direct entry, refresh, browser history, and invalid input all behave predictably.

```ts
function assertCanonicalRoundTrip(search: string) {
  const parsed = parseFilters(new URLSearchParams(search));
  const canonical = serializeFilters(parsed);
  const reparsed = parseFilters(new URLSearchParams(canonical));
  return JSON.stringify(parsed) === JSON.stringify(reparsed);
}
```
