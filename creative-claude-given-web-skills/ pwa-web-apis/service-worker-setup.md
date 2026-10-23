# service-worker-setup

**Layer:** 18 — PWA & Web APIs  
**Goal:** Design, register, update, debug, and safely remove a service worker for a production web application.

## Why This Matters

A service worker is a programmable network intermediary with its own lifecycle. A bad setup can keep serving an old JavaScript bundle after deployment, make users believe a site is broken because an old cache is still active, or leave a page offline with no recovery path. Registration can fail because the script is outside its allowed scope, because the site is not served from a secure context, or because the script returns an HTML error page with status 200 instead of JavaScript. Updates are also subtle: installing a new worker does not mean every open tab immediately uses it. The browser can keep the old worker active while old clients remain open, which is safe by default but can surprise teams who expect instant deployment.

The production task is therefore not “add `navigator.serviceWorker.register()`.” It is to define a safe origin and scope, feature-detect support, register only after the page is ready, make install and activation work predictable, communicate update state to users, handle failures without breaking the ordinary website, and test the lifecycle under realistic network and deployment conditions. A service worker must be treated as a separately deployed client-side program: it can be cached, updated, terminated, restarted, and run without a page being open. Never rely on a global variable or an in-memory state surviving between events.

A service worker requires a secure context in normal production use: HTTPS is required, with localhost treated as trustworthy for development. It is not a replacement for server security, authentication, or authorization. Every request must still be validated by the server. The worker can intercept requests made by controlled pages, but it should not be used to bypass access checks or store sensitive responses in a shared cache. Keep the first implementation small, observable, and reversible. Add caching strategies only after registration and lifecycle behavior are proven.

## Core Concepts

### 1. Secure contexts and capability detection

Service workers are available in secure contexts. Detect both the API and the deployment context rather than assuming that a browser name implies support. Keep the page usable if registration is unavailable.

```js
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    registerServiceWorker().catch((error) => {
      console.error("Service worker registration failed", error);
    });
  }, { once: true });
} else {
  console.info("Offline enhancements are unavailable in this context.");
}
```

**Gotcha:** `localhost` can be trustworthy for development, but an arbitrary LAN IP or plain HTTP staging URL may not be. Test the actual origin.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 2. Registration URL and scope

The registration URL identifies the worker script. Its directory and the registration options determine the maximum controlled URL scope. Put the file where its intended scope is valid, and avoid assuming a nested app can control the whole origin.

```js
async function registerServiceWorker() {
  const registration = await navigator.serviceWorker.register("/service-worker.js", {
    scope: "/",
    updateViaCache: "none"
  });
  console.info("Worker registered for", registration.scope);
  return registration;
}
```

**Gotcha:** A worker at `/app/service-worker.js` cannot normally control `/` unless the server explicitly grants a broader `Service-Worker-Allowed` header.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 3. Registration timing

Register after the initial page has loaded or at a deliberate application boot point. Registration does not need to block rendering, and it should never be awaited by the critical path that displays the main interface.

```js
window.addEventListener("load", () => {
  void registerServiceWorker().catch((error) => {
    reportWorkerError("registration", error);
  });
}, { once: true });

function reportWorkerError(stage, error) {
  console.error(`Service worker ${stage} error`, error);
}
```

**Gotcha:** A rejected registration promise should not become an unhandled rejection or prevent the user from using the page.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 4. Install event and atomic precaching

The install event is the place to prepare resources needed by a known offline shell. `event.waitUntil()` tells the browser that installation depends on the promise. Use a versioned cache and fail installation if a required shell asset is missing; otherwise the worker may activate without its promised offline baseline.

```js
const SHELL_CACHE = "app-shell-v1";
const SHELL_URLS = ["/", "/offline.html", "/styles.css", "/app.js"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL_URLS);
  })());
});
```

**Gotcha:** `cache.addAll()` rejects when any required request fails. Decide whether that is correct for your app shell; do not silently pretend the shell is complete.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 5. Activate event and cache retirement

Activation is a suitable place to remove old caches owned by this worker. Restrict deletion to a clear namespace so the worker does not delete unrelated caches belonging to another app on the same origin.

```js
const OWNED_CACHE_PREFIX = "myapp-";
const CURRENT_CACHES = new Set(["myapp-shell-v2", "myapp-runtime-v2"]);

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(OWNED_CACHE_PREFIX) && !CURRENT_CACHES.has(name))
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});
```

**Gotcha:** Deleting every cache on the origin can break a second app or embedded tool sharing the origin.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 6. Lifecycle states and waiting workers

A worker may be installing, installed, waiting, activating, or activated. The waiting state protects tabs controlled by the previous worker from a sudden code swap. Surface a clear update prompt and let the user reload at a safe moment.

```js
function watchRegistration(registration) {
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener("statechange", () => {
      console.info("New worker state:", worker.state);
    });
  });
}
```

**Gotcha:** “Installed” can mean the new worker is waiting, not that it controls this page.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 7. Controller state and first visit

A newly registered worker may not control the current page until a navigation or a deliberate claim strategy. Check `navigator.serviceWorker.controller` rather than inferring control from successful registration.

```js
function showControlStatus() {
  const controlled = Boolean(navigator.serviceWorker.controller);
  document.documentElement.dataset.workerControlled = String(controlled);
}

navigator.serviceWorker?.addEventListener("controllerchange", showControlStatus);
showControlStatus();
```

**Gotcha:** The first visit often has no controller. Do not treat that as registration failure.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 8. Fetch interception boundaries

The fetch event runs for requests initiated by controlled clients within the worker’s scope. Always preserve the browser’s normal network behavior for requests your worker does not intentionally handle. Do not intercept everything with a cache-only strategy.

```js
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/private/")) return;
  event.respondWith(fetch(request));
});
```

**Gotcha:** A fetch handler that calls `respondWith()` twice for one event throws. Choose one response path.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 9. Update detection and stale script avoidance

Browsers periodically check for a changed worker script. Explicitly call `registration.update()` when a user returns to the app or after a controlled interval, but do not create a tight polling loop. Ensure deployment serves the worker script with suitable revalidation behavior.

```js
async function checkForWorkerUpdate() {
  const registration = await navigator.serviceWorker.getRegistration("/");
  if (!registration) return;
  try {
    await registration.update();
  } catch (error) {
    console.warn("Update check deferred", error);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") void checkForWorkerUpdate();
});
```

**Gotcha:** Aggressive CDN caching of `service-worker.js` can delay updates even when the application bundle has changed.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 10. Skip waiting and controlled activation

`self.skipWaiting()` asks an installing worker to move through the waiting phase; it does not by itself guarantee that every open tab has safely switched. Pair forced activation with an explicit reload or a carefully tested compatibility plan.

```js
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});
```

**Gotcha:** Activating a new worker while an old tab runs incompatible JavaScript can create mixed-version behavior.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 11. Message channels and trust boundaries

Use messages to coordinate update prompts, diagnostics, or cache commands between a page and its worker. Validate message types and payloads; messages are input, not trusted commands.

```js
navigator.serviceWorker?.controller?.postMessage({
  type: "CLIENT_READY",
  schemaVersion: 1
});

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || typeof message !== "object") return;
  if (message.type === "CLIENT_READY" && message.schemaVersion === 1) {
    console.info("Compatible client connected");
  }
});
```

**Gotcha:** Never let an arbitrary message trigger broad cache deletion or privileged application actions.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 12. Error handling and observability

Registration failures can come from a missing file, invalid MIME type, syntax error, scope mismatch, CSP, insecure origin, or network failure. Log enough context to diagnose the stage while keeping the main UI functional.

```js
async function safeRegister() {
  try {
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    console.info("Registration scope:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Unable to register service worker", {
      origin: location.origin,
      secure: isSecureContext,
      message: error.message
    });
    return null;
  }
}
```

**Gotcha:** A successful HTTP status does not guarantee the worker file is valid JavaScript; an HTML fallback page can still fail script parsing.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 13. Security, privacy, and cache policy

A service worker can persist responses beyond a page session. Cache public, versioned assets deliberately; avoid caching account pages, personalized API responses, payment details, or responses marked private unless a reviewed design explicitly requires it.

```js
function isSafeStaticRequest(request, url) {
  return request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/assets/") &&
    !url.pathname.includes("/private/");
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (!isSafeStaticRequest(event.request, url)) return;
  event.respondWith(fetch(event.request));
});
```

**Gotcha:** A cache is not an access-control system. Logout must not leave private cached responses accessible to another user of the same device.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 14. Testing and debugging lifecycle behavior

Test a clean install, a returning visit, update waiting, offline navigation, missing precache assets, and worker syntax errors. Use DevTools Application panel to inspect registrations, clients, cache storage, and lifecycle status; use Network throttling to reproduce flaky installs.

```js
async function inspectWorkerState() {
  const registration = await navigator.serviceWorker.getRegistration("/");
  console.table({
    supported: "serviceWorker" in navigator,
    secure: isSecureContext,
    controlled: Boolean(navigator.serviceWorker.controller),
    scope: registration?.scope ?? "not registered",
    activeState: registration?.active?.state ?? "none",
    waitingState: registration?.waiting?.state ?? "none"
  });
}

void inspectWorkerState();
```

**Gotcha:** DevTools can bypass cache or keep a worker alive in ways that differ from a normal user session. Verify with DevTools closed too.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

### 15. Deployment and rollback

Deploy the worker script and its referenced assets as a compatible set. Keep old hashed assets available long enough for existing clients and old workers to finish. A rollback should restore a known-good worker and assets, not merely revert application HTML.

```js
// Example deployment manifest generated by the build, not hand-maintained.
const RELEASE = {
  worker: "/service-worker.js",
  shell: ["/assets/app.7f31c2.js", "/assets/site.91ad0e.css"],
  releaseId: "2026-10-23.1"
};

console.info("Building release", RELEASE.releaseId);
```

**Gotcha:** Deleting previous hashed assets immediately can cause old open tabs to request files that no longer exist.

**Before / after:** Before this concept is implemented, the behavior is implicit and difficult to diagnose. After it is implemented, the worker has a clear contract, observable state, and a defined fallback when the browser or network does not cooperate.

## Implementation Patterns

The patterns below are intentionally small and composable. Start with registration and lifecycle correctness, then introduce caching. A worker that reliably declines to intercept a request is safer than a worker that intercepts it incorrectly.

### Pattern 1 — Progressive registration

What it does: registers only when the browser supports service workers and the context is secure. When to use: every production PWA, especially sites that must remain usable in unsupported browsers.

```js
export async function registerWorker() {
  if (!("serviceWorker" in navigator) || !isSecureContext) return null;
  try {
    return await navigator.serviceWorker.register("/service-worker.js", {
      scope: "/",
      updateViaCache: "none"
    });
  } catch (error) {
    console.error("PWA enhancement unavailable", error);
    return null;
  }
}
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

### Pattern 2 — Required shell precache

What it does: installs only when the minimum offline shell is available. When to use: apps that must show a meaningful screen after a repeat visit without connectivity.

```js
const CACHE = "myapp-shell-v3";
const REQUIRED = ["/offline.html", "/assets/app.js", "/assets/app.css"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(REQUIRED)));
});
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

### Pattern 3 — Namespaced cleanup

What it does: removes stale caches created by this application and preserves unrelated origin caches. When to use: every cache-version migration.

```js
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keep = new Set(["myapp-shell-v3", "myapp-runtime-v3"]);
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("myapp-") && !keep.has(name))
      .map((name) => caches.delete(name)));
  })());
});
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

### Pattern 4 — User-approved update

What it does: notifies the page when a new worker is waiting and lets the user reload intentionally. When to use: applications where a sudden client-version swap could interrupt editing or checkout.

```js
function offerUpdate(registration) {
  if (!registration.waiting) return;
  const button = document.querySelector("[data-update-app]");
  if (!button) return;
  button.hidden = false;
  button.addEventListener("click", () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  }, { once: true });
}

navigator.serviceWorker?.addEventListener("controllerchange", () => location.reload());
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

### Pattern 5 — Safe static-asset interception

What it does: restricts cache logic to same-origin GET requests under an asset path. When to use: immutable build assets that are safe to reuse between visits.

```js
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== location.origin) return;
  if (!url.pathname.startsWith("/assets/")) return;
  event.respondWith((async () => {
    const cache = await caches.open("myapp-runtime-v3");
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await cache.put(request, response.clone());
    return response;
  })());
});
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

### Pattern 6 — Diagnostic status panel

What it does: exposes supported, secure, controlled, waiting, and active states for QA. When to use: debugging production reports and automated smoke tests.

```js
async function workerDiagnostics() {
  const reg = await navigator.serviceWorker?.getRegistration("/");
  return {
    secure: isSecureContext,
    supported: "serviceWorker" in navigator,
    controlled: Boolean(navigator.serviceWorker?.controller),
    scope: reg?.scope ?? null,
    active: reg?.active?.state ?? null,
    waiting: reg?.waiting?.state ?? null
  };
}
workerDiagnostics().then((status) => console.table(status));
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

### Pattern 7 — Safe teardown in test environments

What it does: unregisters the application worker and clears only the test application cache namespace. When to use: end-to-end tests and local recovery after a broken worker build.

```js
async function resetPwaForTest() {
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations
    .filter((registration) => new URL(registration.scope).origin === location.origin)
    .map((registration) => registration.unregister()));
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith("myapp-test-"))
    .map((name) => caches.delete(name)));
}
```

**Operational note:** verify this pattern with a clean browser profile, an existing controlled tab, and a failed-network scenario. Confirm the regular page still works when the enhancement is absent.

## Common Mistakes and Specific Fixes

| Mistake | Why it fails | Specific fix |
|---|---|---|
| Assuming registration means control | The current page may not yet be controlled. | Check `navigator.serviceWorker.controller` and test the first navigation separately. |
| Registering from an insecure origin | The browser rejects service worker access outside a secure context. | Serve production over HTTPS and use localhost for local development. |
| Placing the script under the wrong directory | The default maximum scope is limited by the worker script path. | Move the script to the intended root or configure `Service-Worker-Allowed` deliberately. |
| Caching every request | Personalized or transient data can become stale or leak across sessions. | Allowlist immutable public assets and explicitly bypass private endpoints. |
| Deleting every origin cache | Other apps on the same origin can lose their data. | Use a unique cache prefix and delete only names owned by this application. |
| Skipping `event.waitUntil()` | The browser can end the event before asynchronous work completes. | Return the complete install, activate, or message promise through `waitUntil()`. |
| Calling `respondWith()` on multiple branches | The fetch event accepts a single response decision. | Compute one branch first, then call `respondWith()` exactly once. |
| Treating `skipWaiting()` as a harmless default | Old tabs can run incompatible JavaScript against new assets. | Use a user-approved update flow or prove cross-version compatibility. |
| Assuming an HTML fallback is a valid worker script | A successful HTTP response can still contain invalid JavaScript. | Inspect response MIME type and body in DevTools Network and serve the real file. |
| Caching a failed response | A transient 404 or 500 can become a persistent cached failure. | Cache only successful responses and define a deliberate fallback for failures. |
| Keeping all old caches forever | Storage grows and old responses may conflict with new releases. | Maintain a version allowlist and retire old app-owned caches on activation. |
| Updating only the HTML document | Existing clients may still request old hashed assets. | Retain previous build assets through the worker transition and rollback window. |
| Testing only with DevTools open | DevTools settings can change cache and worker behavior. | Repeat lifecycle tests in a normal browser session with DevTools closed. |
| Swallowing registration errors silently | Deployment problems become invisible to QA and support. | Log stage, origin, secure-context state, and error message without blocking the UI. |
| Making the worker mandatory for rendering | A registration failure can blank an otherwise valid page. | Treat service-worker behavior as progressive enhancement with a network-first page fallback. |
| Trusting page messages blindly | Any controlled page can send malformed or unexpected messages. | Validate message shape, type, schema version, and allowed operation before acting. |
| Using a broad cache name | Cleanup can collide with unrelated tools. | Prefix cache names with a product-specific namespace such as `myapp-`. |
| Assuming update checks are instantaneous | Browser update checks and CDN revalidation have timing constraints. | Set correct cache headers for the worker script and verify with `registration.update()`. |
| Forgetting to test worker syntax errors | A parse failure can leave the old worker active and hide the new release. | Inspect the worker console and test a deliberately invalid build in staging. |
| Serving stale worker code from a CDN | Users continue to run an older worker despite new application files. | Revalidate `service-worker.js` and purge deployment caches when publishing a release. |

## Mental Models

1. **The worker is a separate process-like agent.** It can be terminated and restarted, so persist important state in durable storage rather than globals.
2. **Registration is not control.** A successful registration creates a lifecycle relationship; it does not guarantee that the current document is controlled immediately.
3. **The lifecycle is a safety protocol.** Waiting protects open tabs from a version switch that could break compatibility.
4. **The cache is a product decision.** Every cached response has freshness, privacy, invalidation, and rollback implications.
5. **A service worker is an enhancement, not the page itself.** The page must still explain errors and work online when registration fails.
6. **Scope is a boundary.** The worker can only control clients within its allowed scope; deployment layout is part of architecture.
7. **Offline means an explicit promise.** Cache a defined shell and fallback, then test that promise under a real disconnected network.
8. **Deployment is a compatibility window.** Old clients, old workers, and new assets can coexist temporarily; retain compatible assets accordingly.
9. **Messages are untrusted input.** Treat cross-context communication like a small API with a schema and allowlist.
10. **Observability is part of the feature.** A supportable PWA can answer “which worker is active, what scope controls this page, and what cache version exists?”

## Quick Reference

| Need | API or mechanism | Notes |
|---|---|---|
| Detect capability | `"serviceWorker" in navigator` | Also check `isSecureContext`. |
| Register | `navigator.serviceWorker.register()` | Handle rejected promises. |
| Find registration | `navigator.serviceWorker.getRegistration()` | May return `undefined`. |
| Enumerate registrations | `navigator.serviceWorker.getRegistrations()` | Useful for tests and diagnostics. |
| Check controller | `navigator.serviceWorker.controller` | `null` is normal on first visit. |
| Observe control change | `controllerchange` | Consider reload compatibility carefully. |
| Detect new worker | `updatefound` | Inspect `registration.installing`. |
| Inspect lifecycle | `worker.state` | Includes installing, installed, activating, activated, redundant. |
| Ask update check | `registration.update()` | Do not poll aggressively. |
| Skip waiting | `self.skipWaiting()` | Pair with a safe update strategy. |
| Claim clients | `clients.claim()` | Use when activation should control eligible open clients. |
| Keep event alive | `event.waitUntil(promise)` | Required for async lifecycle work. |
| Intercept request | `event.respondWith(promise)` | Call at most once per fetch event. |
| Open cache | `caches.open(name)` | Namespace cache names. |
| Match cache entry | `cache.match(request)` | Consider request method and cache policy. |
| Store response | `cache.put(request, response.clone())` | Responses are streams; clone when needed twice. |
| Inspect in DevTools | Application → Service Workers / Cache Storage | Re-test outside DevTools. |
| Remove registration | `registration.unregister()` | Existing controlled tabs may still finish. |
| Secure production | HTTPS | Localhost is a development exception. |

## Build Challenge: Reliable PWA Worker with Failure Injection

Build a minimal service-worker setup for a fictional documentation app. It must register safely, precache a small offline shell, activate without deleting unrelated origin caches, expose update state, and remain usable when the worker fails. Do not stop at a happy-path demo: deliberately break the worker file and one precached asset, then demonstrate recovery.

### Requirements

1. Create a `/service-worker.js` file at a scope appropriate for the app.
2. Register only when the API is supported and the context is secure.
3. Defer registration until the page is ready without blocking initial rendering.
4. Catch and report registration failures without crashing the application.
5. Precache at least an offline page and the minimum styles/scripts needed to render it.
6. Use a versioned, product-specific cache namespace.
7. Use `event.waitUntil()` for install and activation work.
8. Remove obsolete caches only when they belong to the app namespace.
9. Check whether the current page is controlled and display that state in a diagnostic panel.
10. Detect `updatefound` and inspect the installing worker's state transitions.
11. Display a clear update action when a new worker is waiting.
12. Do not force an update while a user is editing unsaved content.
13. Restrict fetch interception to intended same-origin GET requests.
14. Bypass private API routes and personalized responses.
15. Cache only successful, safe static responses.
16. Provide a meaningful offline navigation fallback.
17. Ensure a failed cache lookup can fall back to the network when online.
18. Validate incoming messages before acting on them.
19. Include a diagnostic function that reports support, secure context, controller, scope, active state, and waiting state.
20. Document the HTTPS requirement and localhost development exception.
21. Test in Chromium-based browsers and Firefox, then verify Safari behavior on a real supported device where possible.
22. Test a fresh install, returning visit, update, and rollback.
23. Test with the Network panel set to offline and throttled conditions.
24. Remove or corrupt the worker script and confirm the ordinary site still renders.
25. Remove one required precache asset and confirm installation fails visibly in diagnostics rather than silently claiming success.
26. Test with two tabs open so the waiting-worker behavior is observable.
27. Verify that old tabs do not request deleted hashed assets after deployment.
28. Confirm logout does not leave private responses in Cache Storage.
29. Inspect console output and Network responses for script syntax, MIME type, scope, and caching problems.
30. Write a rollback note explaining how to restore the prior worker and its compatible assets.

### Failure-injection test matrix

| Injected failure | Expected result | Evidence to collect |
|---|---|---|
| Serve page over plain HTTP on a non-localhost host | Worker registration is skipped or rejected; page still works online. | Diagnostic state and registration error. |
| Rename `/service-worker.js` to simulate 404 | Registration fails without blocking page rendering. | Network 404 and error log. |
| Return HTML for the worker URL | Parsing or MIME validation fails; previous active worker may remain. | Network response body and worker console. |
| Remove `/offline.html` from required precache | Install rejects; incomplete new worker does not become active. | Install state and cache contents. |
| Open two tabs, then deploy a new worker | New worker waits or update flow is shown; existing tab behavior is deliberate. | `registration.waiting` and `controllerchange`. |
| Add a cache with another product's prefix | Activation preserves it. | Cache Storage before and after activation. |
| Disconnect the network after a successful visit | Cached shell or fallback is served for supported routes. | Network offline simulation and rendered page. |
| Request a private API route | Request bypasses public asset cache logic. | Network request and absence of private cache entry. |
| Roll back to previous release | Existing and new clients can still fetch compatible assets. | Smoke test across old and new tabs. |

## Definition of Done

- [ ] Registration is feature-detected, secure-context-aware, and non-blocking.
- [ ] The intended scope is confirmed in the browser's Application panel.
- [ ] Install work completes atomically for required shell assets.
- [ ] Activation deletes only stale caches owned by this application.
- [ ] The first visit and a controlled repeat visit both behave as expected.
- [ ] Update prompts and waiting-worker behavior are tested with multiple tabs.
- [ ] Private or personalized responses are not cached by the public asset strategy.
- [ ] Offline fallback is useful and its limits are documented.
- [ ] Worker failure leaves the ordinary online page functional.
- [ ] Browser, deployment, rollback, and failure-injection evidence is recorded.

## Browser Support and Compatibility Notes

Service workers are supported by modern Chromium, Firefox, and Safari releases, but behavior around installation, storage eviction, background execution, and debugging can vary. Treat browser support as a test matrix, not as a one-time checkbox. Safari on iOS has platform-specific lifecycle and storage constraints; do not assume a worker runs continuously in the background. The browser may terminate it when idle and start it again for a later event. Keep event handlers self-contained and do not depend on timers running forever. For compatibility claims, check current browser documentation and MDN compatibility data before setting a minimum version.

The API requires a secure context. HTTPS should be the production default, and HTTP should redirect to HTTPS at the hosting layer. `localhost` is treated as trustworthy for development, but this exception should not be copied into deployment assumptions. Confirm that the server sends the worker script as JavaScript, that Content Security Policy permits the relevant script, and that the script URL is not rewritten to an application HTML fallback. CDN cache rules deserve separate review: long-lived immutable caching is appropriate for hashed assets, while the worker script should be revalidated so new releases can be discovered.

## Debugging Sequence

1. Open DevTools and inspect the exact worker URL in the Network panel. Confirm status, response body, content type, and cache headers.
2. Open the Application panel's Service Workers section. Verify the registered script, scope, active worker, waiting worker, and controlled clients.
3. Read the worker-specific console, not only the page console. Syntax errors and rejected install promises often appear there.
4. Inspect Cache Storage. Confirm the expected version exists, old app-owned versions are retired, and unrelated caches remain untouched.
5. Test one variable at a time: first registration, then install, then activate, then fetch handling, then update behavior.
6. Reproduce the issue with a clean profile and a normal browser session. DevTools options such as bypassing cache can change observations.
7. If a new worker does not appear, inspect CDN and server caching for `/service-worker.js`, then trigger `registration.update()` once and observe the result.
8. If offline navigation fails, distinguish “no controller yet” from “controlled but no matching cached route.” These are different failures and require different fixes.

## Production Checklist

Before launch, confirm HTTPS and redirect behavior, worker scope, script response headers, cache ownership, offline fallback copy, privacy boundaries, update prompt copy, telemetry, rollback assets, and a test plan across target browsers. Agree on who owns cache version changes and who checks the worker after deployments. Keep the worker file small enough that a failed release can be diagnosed quickly. Do not use the worker as a dumping ground for unrelated business logic. A clear worker architecture has a short registration path, explicit cache policies, predictable lifecycle handling, safe defaults, and a documented recovery path.

### Field Note: Choosing a registration strategy

For a simple static site, one root worker and one cache namespace may be enough. For a multi-tenant origin or an app hosted below a path prefix, scope becomes a design decision that should be documented before the first registration. If the application is deployed under `/docs/`, a root-relative script URL and a relative script URL have different meanings. Confirm the final resolved URL in DevTools rather than trusting how it looks in source code. Avoid registering multiple workers with overlapping assumptions from independent bundles. Centralize registration so two components do not race to attach separate update handlers or display duplicate update banners.

### Field Note: Caching policy is separate from lifecycle setup

The Cache API is storage, not a complete caching strategy. You must decide which requests are cacheable, how entries become stale, whether a network failure should return a fallback, and whether a response is safe to persist. Static hashed files are usually straightforward because their URL changes when content changes. HTML and API responses are harder: HTML can point to a new bundle while an older worker is active, and API data may become outdated or private. Choose cache-first, network-first, or stale-while-revalidate only for request classes whose failure behavior is understood. The right strategy for a font file is not automatically right for an account dashboard.

### Field Note: Lifecycle compatibility during release

A new worker and an old page can coexist. This is a normal safety feature, not a bug. The old worker may continue to control existing tabs until clients close or a new worker is deliberately activated. If the new app bundle expects an API or cache format that the old worker cannot provide, a forced activation can expose a compatibility gap. Prefer backward-compatible changes: keep old hashed assets available, version caches, and ensure the new worker can handle requests from the previous page version for a short migration window. If that is impossible, present a clear update prompt and reload at a safe boundary.

### Field Note: Storage pressure and eviction

Browser-managed storage is not guaranteed to be permanent. Users can clear site data, private browsing modes may impose restrictions, and the browser may evict storage under pressure. Treat offline support as best-effort persistence, not as an archival guarantee. The app should detect missing cache entries and provide a useful message instead of assuming every precached response still exists. Avoid storing huge media collections unless there is a deliberate quota and eviction strategy. Test behavior after clearing site data, not only after a normal update.

### Field Note: Security review of fetch handlers

Fetch handlers are powerful because they can return content for requests initiated by controlled pages. Keep routing logic explicit. Check method, origin, path, and response status before storing data. Never cache a response just because it is same-origin; same-origin endpoints can still return user-specific content. Do not bypass server-side authorization because the user is offline. If the app needs offline editing, define a separate local-data model, conflict strategy, and synchronization contract rather than caching privileged server responses. Treat messages from pages as untrusted and never interpret arbitrary strings as cache names or URLs to delete.

### Field Note: Testing beyond the happy path

A successful first visit is the least demanding test. The useful tests are transitions: an incomplete install, a worker update while multiple tabs are open, a user returning after a long period, a cleared cache, an offline deep link, a deployment where one asset is missing, and a rollback while an old tab remains open. Record the expected lifecycle state for each test. Automated browser tests can assert that the page remains visible and that a waiting worker appears, but they should not rely on fixed sleeps. Wait for observable state such as `registration.waiting`, a rendered status element, or a navigation response.

### Field Note: Operational ownership

Assign an owner for service-worker changes because a small edit can affect every route under the scope. Include the worker in release review, especially when cache names, precache manifests, or update behavior change. A release checklist should identify the worker script version, required precache URLs, retained old assets, and rollback plan. If a deployment goes wrong, support should be able to ask the user to inspect a concise status screen rather than walk through vague steps. The status screen should avoid exposing private information; scope, state, and release identifiers are generally enough.

### Troubleshooting Case: A blank page after deployment

Likely cause: the new HTML references a hashed JavaScript file that was removed while an old tab or worker still expects it. Inspect Network for the missing asset, check which worker controls the tab, and verify whether the prior build assets still exist. Restore the missing asset or roll back the HTML and worker as a compatible set. Prevent recurrence by retaining old hashed files through the deployment window and testing rollback with a tab left open.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: The worker registers but offline refresh fails

Likely cause: the page was not controlled on its first visit, the navigation URL was never cached, or the fetch handler intentionally bypasses navigations. Confirm `navigator.serviceWorker.controller`, then inspect the cache entries and route logic. Add a deliberate navigation fallback only if the app has an appropriate offline shell. Test the second visit separately from the first; they have different control states.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: A new worker never activates

Likely cause: an existing controlled client keeps the previous worker active, or installation failed because a required resource could not be cached. Inspect `registration.installing`, `registration.waiting`, and the worker console. Close test tabs to validate the default lifecycle, then test the designed update prompt. Do not immediately add `skipWaiting()` as a reflex; determine whether old and new clients can safely coexist.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: Cache contains an unexpected old response

Likely cause: cache names were not versioned, cleanup was too broad or too narrow, or the fetch strategy did not revalidate an HTML response. Inspect request URLs, response headers, and cache names. Give each strategy a documented cache name and cleanup rule. For immutable assets, prefer content-hashed URLs; for HTML, choose a freshness strategy appropriate to deployment and offline requirements.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: Registration works in one browser but not another

Likely cause: insecure context, browser lifecycle differences, storage restrictions, CSP, MIME type, or server routing. Compare the exact script response and console error in each browser. Test on supported desktop and mobile browsers, especially Safari if iOS users matter. Do not infer support solely from user-agent strings; use capability detection and maintain a documented compatibility matrix.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: Private data appears after logout

Likely cause: a fetch handler cached personalized responses or logout did not clear a deliberately designed private offline store. Treat this as a security incident, not a cosmetic cache bug. Stop caching the affected endpoint, clear the app-owned private entries, and verify the server still enforces authorization. Add a regression test using two accounts in the same browser profile. Public asset caching must remain separate from user-specific data storage.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: The update banner appears repeatedly

Likely cause: the app does not distinguish an already-dismissed waiting worker, multiple registration handlers are installed, or the page re-renders the banner without checking current state. Centralize update observation and make the banner state derive from `registration.waiting`. Use one event listener per registration and clean up UI listeners when the component is removed. Confirm the banner disappears after `controllerchange` or after the user dismisses it.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Troubleshooting Case: Install fails only on a slow connection

Likely cause: required assets are unavailable before the install event finishes, the server intermittently returns errors, or the precache list contains oversized resources. Inspect each precache response and network timing. Keep the required shell minimal, use hashed build assets, and make install fail when truly required files are missing. Move optional media out of the atomic shell and load it later through a deliberate runtime strategy.

**Verification:** reproduce the condition in staging, capture the relevant lifecycle state and Network evidence, apply one targeted fix, then repeat both the failure case and a normal online visit.

### Recipe: Offline navigation fallback

```js
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.mode !== "navigate" || url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch {
      const cache = await caches.open("myapp-shell-v3");
      return (await cache.match("/offline.html")) || Response.error();
    }
  })());
});
```

**Use it when:** Use only when an offline document is genuinely useful. Ensure the offline page is precached and never returns private or misleading content.

### Recipe: Waiting worker notification

```js
function connectUpdatePrompt(registration, button) {
  const reveal = () => { button.hidden = !registration.waiting; };
  registration.addEventListener("updatefound", () => {
    registration.installing?.addEventListener("statechange", reveal);
  });
  button.addEventListener("click", () => {
    registration.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
  reveal();
}
```

**Use it when:** Bind one prompt to one registration and make the button accessible with a useful label. Add a reload confirmation if unsaved work could be lost.

### Recipe: Scoped fetch policy

```js
function shouldHandle(request) {
  const url = new URL(request.url);
  return request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith("/assets/") &&
    !url.pathname.startsWith("/assets/user-uploads/");
}
```

**Use it when:** Keep route allowlists narrow. A broad prefix can accidentally include uploads or personalized resources after the application grows.

### Recipe: Worker release identity

```js
const WORKER_RELEASE = "docs-2026-10-23-1";
self.addEventListener("message", (event) => {
  if (event.data?.type === "GET_RELEASE") {
    event.source?.postMessage({ type: "WORKER_RELEASE", release: WORKER_RELEASE });
  }
});
```

**Use it when:** A release identifier helps support compare what the page expects with what the active worker reports. Do not expose secrets in diagnostics.
