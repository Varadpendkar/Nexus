# SKILL: offline-functionality
**Layer:** 18 — PWA & Web APIs  
**Goal:** Build an offline-capable web experience that chooses the right cached response, communicates network state honestly, and recovers safely when connectivity returns.

---

## Why This Matters (Senior Perspective)

Offline support is a product behavior, not a checkbox. A portfolio site may need its case studies to remain readable on a train with unreliable reception; an event site may need previously loaded schedules at a venue with congested Wi-Fi; a field-work dashboard may need to preserve a draft while a connection drops. If offline behavior is designed late, the result is often worse than no offline support: a page appears to load but has missing fonts and images, an old HTML shell requests JavaScript chunks that no longer exist, a failed API request is mistaken for an empty dataset, or a user sees a success toast even though their change never reached the server.

A beginner often treats “offline” as “put everything in Cache Storage.” A senior developer starts with user journeys and data guarantees. Which routes must open after a prior visit? Which data is safe to retain on a shared device? Which content can be stale, and for how long? Which actions can be queued, and which must fail visibly? How will the app tell a network timeout from an authorization error? Offline capability depends on coordination between the service worker, Cache Storage, IndexedDB, application state, API semantics, deployment versioning, and the interface. Each layer has a different responsibility and failure mode.

For creative portfolio and freelance work, the offline experience should preserve the brand rather than reveal a broken technical demo. A cached page should still have typography, layout, and meaningful imagery; an offline fallback should be designed intentionally; and status messaging should be calm and specific. But offline-first is not always correct. A live stock quote, payment authorization, account balance, or permission-sensitive response must not be presented as current merely because a cached copy exists. Decide what can be stale, label it, and avoid caching sensitive responses by default. The goal is resilient usefulness with honest limits—not pretending that a disconnected browser is fully online.

## Core Concepts
### 1. Define the offline contract before caching

An offline contract lists the user journeys that remain useful without a network, the content that must have been visited or downloaded beforehand, and the actions that require a live server. It prevents a vague “works offline” claim from hiding important limitations.

```js
const offlinePolicy = {
  available: ["read-cached-case-study", "open-app-shell", "view-saved-draft"],
  unavailable: ["submit-payment", "refresh-live-pricing"],
  staleContentLabel: "Saved copy — may be out of date"
};

function canAttemptOfflineAction(action) {
  return offlinePolicy.available.includes(action);
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Promise that the entire application works offline. Correct: document supported journeys and their prerequisites, then test each one with a cold cache and a warm cache.

**Gotcha:** Gotcha: A page that worked offline after browsing it once may fail for a first-time visitor with an empty cache.

### 2. Cache Storage is not the HTTP cache

Cache Storage is an explicit store controlled by application code, commonly through a service worker. The browser HTTP cache is managed by normal HTTP caching rules. They are separate layers, so a response can be present in one and absent from the other.

```js
const CACHE_NAME = "portfolio-pages-v1";

async function savePublicPage(request, response) {
  if (!response || !response.ok || response.type === "opaque") return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Assume a browser-cached image means `caches.match()` will find it. Correct: deliberately populate and inspect the Cache Storage entries your worker owns.

**Gotcha:** Gotcha: `Cache.put()` consumes a response body, so clone a response if the original must also be returned to the page.

### 3. Choose a strategy by resource and freshness

Cache-first favors speed and offline availability; network-first favors freshness and falls back to a cached copy; stale-while-revalidate returns cached content quickly while refreshing in the background. There is no universal strategy for every URL.

```js
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Apply cache-first to all requests, including changing API data. Correct: map assets and endpoints to strategies based on freshness, offline value, and sensitivity.

**Gotcha:** Gotcha: A successful HTTP response with status 404 does not reject `fetch()`; inspect `response.ok` before caching.

### 4. Cache a navigational shell deliberately

A single-page application often needs an HTML entry point to boot when the user navigates while offline. Cache the intended shell during install or after a successful navigation, and ensure its JavaScript and CSS dependencies remain available too.

```js
const SHELL_CACHE = "studio-shell-v2";
const SHELL_ASSETS = ["/", "/offline.html", "/assets/app.css", "/assets/app.js"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL_ASSETS);
  })());
});
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Cache `/` and assume every dependency will also be available. Correct: make the shell dependency graph explicit and verify every required asset is deployed at the expected path.

**Gotcha:** Gotcha: `cache.addAll()` rejects the install if any required request fails; decide whether all listed files are truly mandatory.

### 5. Handle navigation separately from assets

HTML navigation requests have different fallback needs than scripts, styles, images, and API calls. Match navigations intentionally and use an offline document only when the request is a navigation that can reasonably show it.

```js
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate") return;

  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open("studio-shell-v2");
      return (await cache.match("/offline.html")) || new Response(
        "You are offline. Reconnect and try again.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
  })());
});
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Return an HTML fallback for every failed fetch, including a `.js` file. Correct: restrict the document fallback to navigations and let asset requests use asset-appropriate behavior.

**Gotcha:** Gotcha: Returning `index.html` for a missing JavaScript chunk can produce a confusing MIME-type error rather than a useful fallback.

### 6. Treat connectivity signals as hints

`navigator.onLine` and online/offline events describe the browser’s network connection state, not guaranteed reachability of your API. Captive portals, DNS failures, VPNs, and server outages can all make a supposedly online browser unable to reach the application.

```js
function updateConnectivityHint() {
  const hint = document.querySelector("[data-connectivity-status]");
  if (!hint) return;
  hint.textContent = navigator.onLine
    ? "Connection may be available"
    : "You appear to be offline";
}

window.addEventListener("online", updateConnectivityHint);
window.addEventListener("offline", updateConnectivityHint);
updateConnectivityHint();
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: If `navigator.onLine` is true, show “All changes synced.” Correct: show it only after a real request or sync operation confirms success.

**Gotcha:** Gotcha: A browser can report online while the target server is unreachable; never use this property as proof of API health.

### 7. Keep offline status accessible and non-blocking

Connectivity messaging should communicate a useful state without covering content, repeatedly interrupting the user, or relying only on color. A banner or status region can update when the connection state changes and disappear when it no longer adds value.

```js
<aside class="connection-banner" role="status" aria-live="polite" data-connectivity-status>
  Checking connection…
</aside>

<style>
.connection-banner { padding: .65rem 1rem; border-radius: .5rem; }
.connection-banner[hidden] { display: none; }
</style>
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Use a red dot with no text. Correct: pair any visual indicator with concise text, preserve keyboard and screen-reader usability, and avoid announcing every transient network event.

**Gotcha:** Gotcha: `aria-live="assertive"` can interrupt users; ordinary connection hints usually do not need assertive announcements.

### 8. Distinguish transport failure from HTTP failure

`fetch()` rejects for transport-level failures, but resolves for HTTP statuses such as 401, 404, and 500. Offline fallback should not mask an authorization failure or silently replace a server error with unrelated cached content.

```js
async function requestJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  return response.json();
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Catch every error and show “You are offline.” Correct: classify network errors, HTTP errors, parsing errors, and permission errors separately, then show a truthful message.

**Gotcha:** Gotcha: A network-first strategy that falls back on every status can hide a 403 or 500 unless the response path checks the status explicitly.

### 9. Version caches and clean up safely

Give application-owned caches explicit names and versions. When a new release is activated, delete obsolete caches within your own namespace while retaining current assets. Cache cleanup is part of deployment compatibility, not housekeeping to improvise later.

```js
const CURRENT_CACHES = new Set(["studio-shell-v3", "studio-media-v2"]);
const CACHE_PREFIX = "studio-";

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.has(name))
      .map((name) => caches.delete(name)));
  })());
});
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Delete every cache whose name is not exactly one cache name. Correct: use a prefix owned by your app and a complete allowlist of caches needed by the current version.

**Gotcha:** Gotcha: Multiple applications can share an origin; deleting all caches may break another application hosted there.

### 10. Prevent old HTML from referencing missing bundles

Offline compatibility can break after deployment if cached HTML points to hashed JavaScript files that have been removed from the server and cache. Keep deployment assets compatible for a transition period, or update the shell and its dependencies as one coherent version.

```js
// Example build output manifest consumed by the service worker build step.
const BUILD_ASSETS = [
  "/assets/app.4c12a.js",
  "/assets/app.82d1f.css",
  "/offline.html"
];

// Generate this list from the build manifest; do not hand-maintain hashed names.
const PRECACHE_VERSION = "studio-build-2026-10-23";
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Cache the current HTML but immediately delete every previous chunk. Correct: deploy immutable hashed assets, keep old chunks available during rollout where practical, and verify the shell and assets belong to a compatible build.

**Gotcha:** Gotcha: A service worker update and a page refresh are not automatically atomic across all open tabs.

### 11. Respect sensitive data and privacy boundaries

Offline storage persists beyond a request and can remain on a shared or lost device. Do not cache private API responses, account details, payment pages, or authentication-dependent HTML unless a reviewed design explicitly requires it and includes expiry and logout cleanup.

```js
function mayStoreResponse(request, response) {
  const url = new URL(request.url);
  if (request.method !== "GET") return false;
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/api/private/")) return false;
  if (response.headers.get("Cache-Control")?.includes("no-store")) return false;
  return response.ok;
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Cache every successful same-origin GET. Correct: apply an allowlist for public resources and respect server cache directives and application privacy requirements.

**Gotcha:** Gotcha: A same-origin URL is not automatically public; its response may contain user-specific information.

### 12. Bound storage and provide cache resilience

Storage is finite and can be evicted by the browser. Runtime caches should have limits and cleanup rules, and the app must recover when a cache entry is absent or storage writes fail.

```js
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;
  if (excess > 0) {
    await Promise.all(keys.slice(0, excess).map((request) => cache.delete(request)));
  }
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Add every viewed image forever. Correct: set per-cache limits, avoid caching oversized or low-value responses, and ensure a cache miss returns to the network or a designed fallback.

**Gotcha:** Gotcha: Browser quota and eviction behavior varies by browser, device, and available disk space; do not promise permanent storage.

### 13. Use Background Sync only as an enhancement

Background Sync can defer some work until connectivity returns in supporting browsers, but it is not universally available and is not a substitute for a durable outbox or visible retry UI. Queue only operations whose semantics make retry safe.

```js
async function registerSync(registration) {
  if ("sync" in registration) {
    try {
      await registration.sync.register("sync-saved-drafts");
      return true;
    } catch (error) {
      console.warn("Background Sync unavailable for this attempt", error);
    }
  }
  return false;
}
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Assume a queued sync will run immediately when the device reconnects. Correct: persist pending work, expose its status, retry when the app opens, and use Background Sync as an optional accelerator.

**Gotcha:** Gotcha: Browser support, scheduling, and execution constraints vary; the browser may delay or omit background execution.

### 14. Design idempotent retries for writes

Offline writes can be repeated when the browser retries, a user presses a button twice, or the response is lost after the server committed the operation. Use unique operation IDs and server-side idempotency where possible.

```js
const operation = {
  id: crypto.randomUUID(),
  type: "save-note",
  createdAt: new Date().toISOString(),
  payload: { title: "Venue notes", body: "Entrance is on the east side." }
};

// Persist this operation in IndexedDB before reporting it as safely queued.
await savePendingOperation(operation);
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Retry a POST blindly after a timeout. Correct: give the operation a stable ID, make the server deduplicate it, and represent pending/synced/failed states explicitly.

**Gotcha:** Gotcha: A timeout does not prove the server did nothing; the request may have committed before the response was lost.

### 15. Recover and reconcile after reconnect

Reconnection is a transition, not proof that pending work is complete. Refresh data, process queued operations with conflict rules, and preserve user edits if the server version changed while the client was offline.

```js
async function onReconnect() {
  try {
    await refreshPublicData();
    await syncPendingOperations();
    setSyncMessage("Your saved changes are up to date.");
  } catch (error) {
    setSyncMessage("Connection returned, but syncing is still pending.");
    console.warn("Reconnect sync incomplete", error);
  }
}

window.addEventListener("online", () => { void onReconnect(); });
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Clear the offline queue as soon as a request starts. Correct: remove each operation only after the server acknowledges it, and retain failures for retry or user resolution.

**Gotcha:** Gotcha: Two devices can edit the same record offline; the app needs a documented conflict policy rather than “last response wins” by accident.

### 16. Test cold-cache, warm-cache, and deployment states

Offline testing must cover more than toggling DevTools offline after the page is loaded. Test a first visit with no cache, a repeat visit, a deep link, missing assets, worker update, storage quota failure, and reconnection with pending work.

```js
const offlineTestCases = [
  "cold cache + offline navigation",
  "warm cache + deep link",
  "cached HTML + missing bundle",
  "offline draft + reconnect",
  "HTTP 401 while online",
  "storage write failure"
];

console.table(offlineTestCases.map((name) => ({ test: name, required: true })));
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Mark offline support done because one cached homepage loads. Correct: test the complete user journey and its failure states on at least one mobile browser and one desktop browser.

**Gotcha:** Gotcha: DevTools can simulate offline conditions but does not reproduce every real-world radio transition, captive portal, or device storage constraint.

### 17. Integrate the complete offline experience

A production-ready offline experience combines a versioned app shell, a navigation fallback, resource-specific strategies, a status indicator, a durable draft queue when needed, and truthful recovery messaging. Keep live-only actions disabled or clearly blocked while disconnected.

```js
// Application-level example: the UI reflects actual persistence and sync state.
function renderSaveState(state) {
  const status = document.querySelector("[data-save-state]");
  const labels = {
    saved: "Saved on this device",
    pending: "Saved on this device — waiting to sync",
    synced: "Saved and synced",
    failed: "Not saved yet — retry"
  };
  status.textContent = labels[state] || "Save status unknown";
}

// Call "saved" only after IndexedDB confirms the local transaction committed.
// Call "synced" only after the server confirms the operation.
renderSaveState("saved");
```

**What the example demonstrates:** The code isolates one decision that can be tested independently. Adapt names and cache policies to the application, but keep the behavior explicit rather than burying it in a catch-all fetch handler.

**Naive approach / Correct approach:** Naive: Use a single “Saved” label for local persistence and server confirmation. Correct: distinguish local save, pending sync, confirmed sync, and failure in the interface.

**Gotcha:** Gotcha: A local IndexedDB transaction can commit successfully while later synchronization fails; those are different guarantees.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Navigation network-first with a designed offline page

**What it does:** Attempts to load fresh HTML and serves a pre-cached offline document only when the network request fails.

**When to use it:** Use for document navigations on a content site where freshness matters, but a user should still receive a branded explanation when disconnected.

```js
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith((async () => {
    try {
      return await fetch(event.request);
    } catch {
      const cache = await caches.open("studio-shell-v2");
      return (await cache.match("/offline.html")) || new Response(
        "You are offline. Reconnect to continue.",
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
  })());
});
```

This is appropriate for navigations, not for every asset request. If the server returns an HTTP 500 response, `fetch()` resolves; decide explicitly whether that response should be shown rather than automatically treating it as a connection failure.

### Pattern 2: Cache-first for fingerprinted static assets

**What it does:** Returns a cached immutable asset quickly and fetches it only when absent.

**When to use it:** Use for build-generated filenames that contain a content hash, such as `/assets/app.4c12a.js`, where a changed file receives a new URL.

```js
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
```

This pattern depends on reliable content hashing and cache cleanup. Do not use it for a mutable URL whose content changes without the URL changing unless you have an explicit revalidation policy.

### Pattern 3: Stale-while-revalidate for public editorial content

**What it does:** Serves a cached response immediately while requesting a fresh version for a future visit.

**When to use it:** Use for public project descriptions, article content, or non-sensitive images where a slightly stale first response is acceptable.

```js
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(request, response.clone());
    return response;
  });

  if (cached) {
    void refresh.catch((error) => console.debug("Refresh deferred", error));
    return cached;
  }
  return refresh;
}
```

Label data with a timestamp when users could mistake stale content for current information. Avoid this strategy for personalized or sensitive responses.

### Pattern 4: Runtime cache with an explicit entry limit

**What it does:** Stores useful resources but prevents the cache from growing without bounds.

**When to use it:** Use for a portfolio image gallery or a catalog where users may view many images over time.

```js
async function putWithLimit(cacheName, request, response, limit = 80) {
  if (!response.ok || response.type === "opaque") return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  const overflow = keys.length - limit;
  if (overflow > 0) {
    await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
  }
}
```

This simple FIFO policy is easy to understand, but it is not a true least-recently-used algorithm. If recency matters, persist access metadata and account for the cost of updating it.

### Pattern 5: Separate local save from remote synchronization

**What it does:** Confirms a draft is safely stored on the device before reporting that it is saved, then separately reports server synchronization.

**When to use it:** Use for notes, form drafts, or field-work records that should survive a tab close while the device is disconnected.

```js
async function saveDraft(draft) {
  await draftStore.put({ ...draft, syncState: "pending" });
  renderSaveState("pending");
  if (!navigator.onLine) return;

  try {
    await syncDraft(draft.id);
    await draftStore.markSynced(draft.id);
    renderSaveState("synced");
  } catch {
    renderSaveState("pending");
  }
}
```

`draftStore` is an application-owned IndexedDB wrapper and must resolve only after the transaction commits. Do not label the record “saved on this device” before durable persistence succeeds.

### Pattern 6: Reconnect with bounded retries and visible state

**What it does:** Tries to synchronize pending operations when connectivity appears to return, without creating an unbounded retry loop.

**When to use it:** Use for an outbox of safe, idempotent operations that can be submitted after a temporary connection loss.

```js
async function syncWithBackoff(syncOnce, maxAttempts = 4) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await syncOnce();
      return { ok: true };
    } catch (error) {
      if (attempt === maxAttempts - 1) return { ok: false, error };
      const delay = Math.min(1000 * (2 ** attempt), 8000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return { ok: false };
}
```

Use this only when the caller can safely retry and the server deduplicates operations where necessary. In a service worker, respect event lifetime limits and use `event.waitUntil()` for work tied to an event; a timer is not a guarantee of background execution.

### Pattern 7: Explicitly bypass caching for private endpoints

**What it does:** Keeps private or no-store responses out of application-managed caches.

**When to use it:** Use when a site mixes public content with signed-in routes or account APIs.

```js
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/private/")) return;
  if (url.pathname.startsWith("/account/")) return;

  // Add only explicitly public routes to a caching strategy.
});
```

A bypass is not a substitute for server-side authorization. Keep the rule aligned with actual route semantics, and remember that HTML pages can contain private information too.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Saying “offline supported” after caching the homepage | Deep links, assets, and first-visit behavior may still fail | Define and test offline journeys with explicit prerequisites |
| Using one strategy for all requests | APIs, navigation, images, and hashed bundles have different freshness needs | Route by request type and resource policy |
| Returning HTML for a failed script request | The browser expects JavaScript and may report MIME or parse errors | Restrict HTML fallback to navigation requests |
| Treating `navigator.onLine` as server health | Captive portals and server outages still occur | Confirm reachability through real requests |
| Caching all successful GET responses | Private or user-specific data can persist on disk | Allowlist public resources and honor `no-store` |
| Caching non-OK responses | A 404 or 500 can become a persistent cached failure | Check `response.ok` and define error policy |
| Deleting every origin cache | Other apps on the origin can break | Delete only caches owned by your namespace |
| Clearing queued work when a request starts | A lost response can erase unsynced user data | Remove items only after server acknowledgement |
| Retrying non-idempotent writes blindly | Duplicate records or payments may result | Use stable operation IDs and server-side deduplication |
| Ignoring storage quota and eviction | Cache entries can disappear unexpectedly | Handle cache misses and bound runtime storage |
| Showing “synced” on `online` event | Network state does not prove server acknowledgement | Update status only after successful sync |
| Testing only with a warm cache | First-visit and cold-cache users are unprotected | Test cold and warm cache paths separately |

## Mental Models

1. **Offline is a set of journeys, not a global boolean.** A page can be readable offline while search, authentication, and submission still require a server.
2. **Cache is a replica, not the source of truth.** A cached response is a copy with a freshness policy; it does not prove the server still agrees.
3. **Choose the strategy from the consequence of staleness.** A stale hero image is usually tolerable; a stale account balance is not.
4. **Connectivity is evidence, not certainty.** `online` is a hint; a successful request is evidence for that specific endpoint at that moment.
5. **Local persistence and remote acknowledgement are different promises.** “Saved on this device” and “synced to your account” must not be conflated.
6. **A deployment is a compatibility window.** HTML, service worker, and hashed assets can be observed at different times across open tabs and caches.
7. **Fallbacks should match the failed resource.** A document fallback helps a navigation; it cannot repair a missing module script.
8. **Retries require semantics.** Retrying is safe only when the operation is repeatable or deduplicated.
9. **The browser owns storage lifetime.** Cache Storage and IndexedDB can be evicted; persistent storage requests reduce risk but do not justify absolute guarantees.
10. **Offline UX is part of visual design.** It should preserve hierarchy, accessibility, and brand while clearly communicating what can and cannot happen.

## Quick Reference

| Need | Starting point | Key caveat |
|---|---|---|
| Open previously visited pages offline | Navigation fallback + cached shell | Cold-cache visits still need a network |
| Keep hashed JS/CSS available | Cache-first | URLs must change when content changes |
| Show public content quickly | Stale-while-revalidate | Label stale data where freshness matters |
| Favor fresh API data | Network-first | Fallback must not hide authorization or server errors |
| Detect apparent connectivity changes | `online` / `offline` events | Does not prove API reachability |
| Store drafts offline | IndexedDB | Distinguish local save from remote sync |
| Queue mutations | Durable outbox + idempotency key | Server must support deduplication/conflict handling |
| Limit cached assets | Cache key count / size policy | FIFO is not LRU; storage may still be evicted |
| Prevent private response caching | Explicit route allowlist/bypass | Same-origin does not mean public |
| Debug a missing offline page | DevTools Application → Cache Storage and Service Workers | Verify scope, worker control, and actual cache entries |

## Build Challenge

### Build: Resilient Offline Portfolio and Saved-Work Flow

Build an offline-capable portfolio site with a branded fallback and one durable saved-work feature. The challenge is complete only when the offline behavior is observable and its limitations are clearly explained.

#### Functional requirements

1. Register a service worker from a secure context and leave the normal site usable if registration fails.
2. Pre-cache a minimal shell that includes the main HTML entry, required CSS, required JavaScript, and `/offline.html`.
3. Give caches application-owned names with explicit versions.
4. Delete only obsolete caches in the application’s namespace during activation.
5. Implement network-first handling for navigation requests.
6. Return the branded offline document only for navigation failures.
7. Use cache-first for at least one fingerprinted static asset class.
8. Use stale-while-revalidate for a public resource where stale content is acceptable.
9. Do not cache non-GET requests.
10. Do not cache private API routes or responses marked `Cache-Control: no-store`.
11. Check response status before caching a fetched response.
12. Keep runtime cache growth bounded.
13. Display a text-based connection hint that is accessible to assistive technology.
14. Do not treat `navigator.onLine` as proof that the server is reachable.
15. Add a saved-work form with title and body fields.
16. Persist drafts in IndexedDB before reporting local save success.
17. Show distinct local-pending, synced, and failed states.
18. Queue pending operations with stable IDs if the feature includes remote synchronization.
19. Do not remove queued operations until the server acknowledges them.
20. Handle duplicate submissions or retries safely.
21. Reconcile pending work when the app opens and when connectivity returns.
22. Preserve a user’s draft if sync fails.
23. Include a clear action for removing a local draft.
24. Document which pages and actions require a previous visit.
25. Provide a short “What works offline” note in the interface or project README.

#### Suggested architecture

```text
Browser UI
  ├─ Connection hint (informational only)
  ├─ Saved-work form
  │    └─ IndexedDB local persistence
  └─ Sync state (pending / synced / failed)

Service worker
  ├─ Install: precache shell
  ├─ Activate: clean owned old caches
  └─ Fetch routing
       ├─ navigation → network-first + offline fallback
       ├─ fingerprinted assets → cache-first
       ├─ public content → stale-while-revalidate
       └─ private API / mutations → explicit bypass

Server
  ├─ Authenticate and authorize every request
  ├─ Deduplicate operation IDs when supporting retries
  └─ Return explicit success/failure for sync
```

#### Test matrix

| Scenario | Expected result | Evidence to collect |
|---|---|---|
| First visit online | App loads and shell assets cache successfully | Network panel + Cache Storage |
| First visit offline with empty cache | Honest browser/network failure or designed generic fallback; no false success | Fresh profile, disable network |
| Repeat visit offline | Cached shell opens and explains connection state | Reload after offline mode enabled |
| Deep-link navigation offline | Offline document appears if it was precached | Open a nested URL directly |
| Static asset already cached | Asset loads without network | Network panel shows cache/service-worker response |
| Static asset missing from cache offline | Graceful missing-resource behavior; no HTML masquerading as JS | Clear one cache entry and reload |
| Server returns HTTP 401 | App does not label the response “offline” or cache private data | Mock/authenticated request |
| Public endpoint returns HTTP 500 | Defined server-error behavior; error is not silently cached as valid content | Network throttling or test endpoint |
| Draft saved while offline | Draft survives refresh and is marked pending | IndexedDB + refresh test |
| Network returns but server rejects sync | Draft remains available and state is not “synced” | Force a rejected sync response |
| Sync response is lost | Retry does not create duplicate records | Inspect server-side test data |
| New app version deployed | Current shell and its assets remain compatible | Test with an older open tab and a new tab |
| Storage write fails | UI does not falsely claim local save succeeded | Simulate transaction failure |
| Cache cleanup runs | Only old app-owned caches are removed | Inspect Cache Storage names |

#### Definition of Done

- [ ] The site remains useful for the explicitly documented offline journeys.
- [ ] The first-visit limitation is clear and tested.
- [ ] Navigation fallbacks never replace JavaScript or CSS responses.
- [ ] Cache strategies differ by resource class and freshness needs.
- [ ] Private responses are excluded from application-managed caches by default.
- [ ] Cache names are versioned and cleanup is scoped.
- [ ] Runtime storage is bounded and cache misses are handled.
- [ ] Connectivity hints do not claim server health or sync completion.
- [ ] Draft persistence is confirmed before local-save messaging appears.
- [ ] Pending operations survive failed synchronization.
- [ ] Retries are bounded and safe for the chosen operation semantics.
- [ ] Keyboard, screen-reader, mobile, cold-cache, warm-cache, and deployment-update tests pass.
- [ ] README documents supported offline flows, limitations, and manual test steps.

#### Debugging sequence

1. Confirm the page is served in a secure context and the service worker is supported.
2. Confirm the worker script URL, HTTP status, MIME type, and registration scope.
3. Confirm the page is controlled by the expected active worker.
4. Inspect Cache Storage for the exact versioned cache and expected request keys.
5. Check whether the failed request is a navigation, static asset, or API request.
6. Check request method, origin, path, status, and cache policy before changing the fallback.
7. Inspect console output for failed `cache.addAll()`, quota, or `respondWith()` errors.
8. Reproduce with a cold cache, then a warm cache; do not test only one state.
9. Verify the cached HTML and asset filenames belong to a compatible deployment version.
10. Confirm the user-visible status matches actual local persistence and server acknowledgement.

#### Production checklist

- [ ] HTTPS is configured for production.
- [ ] Service worker and offline page are deployed at stable paths.
- [ ] Required shell assets are generated from the current build, not copied manually from an old release.
- [ ] Immutable assets use content-hashed filenames.
- [ ] Cache cleanup uses an application-specific namespace.
- [ ] Server cache headers and service-worker cache policies do not contradict one another accidentally.
- [ ] Private routes, account pages, and authentication flows are reviewed for persistent storage risks.
- [ ] The offline page explains what users can do next and offers a retry path.
- [ ] API errors are not confused with transport failures.
- [ ] Sync queue items include stable IDs and timestamps where relevant.
- [ ] Conflicts and permanent sync failures have a recovery path.
- [ ] Cache and IndexedDB failures are observable without exposing personal data in logs.
- [ ] Browser support limitations are documented and core online functionality still works without offline APIs.

Offline support is complete when it preserves useful work and communicates its limits accurately—not merely when a cached page happens to appear.
