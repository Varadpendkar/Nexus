# Page Transition Kit — Production Skill

## Why This Matters

Page transitions connect one route or major view to another. They can make a site feel coherent, preserve context, and help users understand that navigation occurred. They can also create serious usability failures: the new route appears behind an old overlay, focus stays on a removed link, scroll position is wrong, an animation runs twice in development, or navigation feels blocked while decorative motion completes.

A reliable transition system separates navigation state from visual choreography. The route should change according to the router's rules, accessible state should remain correct, and motion should be a progressive enhancement. Avoid turning every route into a cinematic sequence. Most content navigation benefits from a short, quiet transition—or no transition at all.

This skill covers route-transition architecture, CSS and Framer Motion patterns, exit/entry coordination, scroll restoration, focus management, reduced motion, interruption, debugging, and performance. Framework-specific routing APIs differ; verify the exact behavior and API for the installed framework and version.

### 1. Mental Models

1. **Navigation is a state change; animation is a presentation.** Do not let an animation become the authority for which route is active.
2. **One owner coordinates route presence.** Keep the router and the transition layer's responsibilities explicit.
3. **The destination must be usable.** A visual transition must not leave stale content, hidden controls, or incorrect focus behind.
4. **Entry and exit are separate concerns.** The outgoing page may animate out while the incoming page mounts, but the system must define which page is interactive.
5. **Focus follows navigation intent.** On route change, move focus to the new page's main heading or main region according to the app's navigation pattern.
6. **Scroll restoration is policy.** New routes may start at the top, while back/forward navigation may restore prior positions.
7. **Reduced motion preserves the route outcome.** It removes unnecessary movement, not navigation or content.
8. **Interruptions are normal.** Fast route changes must settle on the latest destination without stale completion callbacks winning.
9. **Every route needs a non-animated path.** Deep links, refreshes, server rendering, and failed JavaScript must still provide content.
10. **The simplest transition is often the best.** Animate only when motion helps users understand continuity or change.

### 2. Establish Route and Transition Ownership

Start with the routing framework's standard navigation behavior. A transition wrapper should observe route identity and coordinate presentation; it should not invent a second routing system. Choose a stable route key that changes when the meaningful page changes, but avoid keys that change on every render.

Before implementing motion, document:
- Which route changes animate.
- Whether the outgoing page remains mounted during exit.
- When the destination becomes interactive.
- How focus moves.
- How scroll position is selected.
- What happens when a second navigation occurs mid-transition.
- How reduced motion changes the presentation.
- How errors, redirects, and not-found routes behave.

A route key based on pathname alone may not represent every state change in an app. Query parameters, hash navigation, and nested route identity can have different semantics. Do not animate a full page for a small query-string update unless that behavior is intentional.

### 3. CSS View Transitions as Progressive Enhancement

The View Transition API can coordinate snapshots of an old and new DOM state for supported same-document updates. It is not a replacement for routing and does not automatically solve focus, scroll restoration, or route identity. Browser support and framework integration vary, so verify current support before relying on it.

```js
function updateView(renderNewState) {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      renderNewState();
    });
  } else {
    renderNewState();
  }
}
```

In a framework, call the API around the framework's state update in the manner supported by that framework. Do not manually mutate a framework-managed DOM tree. A real implementation should also catch errors from the update path and make sure navigation can complete without the transition API.

```css
::view-transition-old(root) {
  animation: 140ms ease-in both page-fade-out;
}

::view-transition-new(root) {
  animation: 180ms ease-out both page-fade-in;
}

@keyframes page-fade-out {
  to { opacity: 0; }
}

@keyframes page-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

This fade is intentionally restrained. The View Transition API can use named elements and more complex transitions, but avoid adding elaborate movement without a user benefit. Keep the underlying route usable when the API is unavailable.

**Gotcha:** Calling `document.startViewTransition` does not make an asynchronous router update synchronous. Confirm that the callback performs the state update expected by the framework and that the new DOM is committed within the framework's lifecycle.

### 4. Framer Motion Route Presence

A common React pattern uses `AnimatePresence` to keep an exiting page mounted long enough to animate. The exact integration depends on the router and version. The following illustrates the animation layer, not a universal drop-in router implementation.

```jsx
import { AnimatePresence, motion } from "framer-motion";

export function RouteFrame({ routeKey, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={routeKey}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
```

`mode="wait"` delays entry until the exiting child finishes. This can be appropriate for a short transition but may make navigation feel blocked if the exit is too long. Other presence modes have different overlap behavior; check the installed version's documentation. Ensure that only the intended page is keyed and that nested route layouts do not create duplicate transitions.

The `main` element should represent the page's primary content and should not be duplicated accidentally by nested route shells. If the application already renders a `<main>`, animate a wrapper that does not introduce a second main landmark.

### 5. Route Identity and Stable Keys

The transition layer needs a stable key for the route instance. A key that never changes prevents expected transitions; a key that changes on every render remounts the page repeatedly. Select the key based on the product's navigation semantics.

```js
function getTransitionKey(location) {
  return `${location.pathname}${location.search}`;
}
```

This is an example only. Including `search` means each query-string change can trigger a transition. If query parameters control filters that should update in place, use the route identity or pathname instead. Hash navigation usually indicates an in-page destination and may need a different focus and scroll policy.

Use React keys derived from stable route identity, never from random values generated during render. Check whether nested layouts should persist across sibling route changes rather than exit and re-enter.

### 6. Focus Management After Navigation

When navigation completes, keyboard and assistive technology users need a predictable destination. A common approach is to focus the new page heading or a focusable main container, but the correct policy depends on the application and router. Do not move focus on every small state change, such as a filter update that does not represent a new page.

```jsx
import { useEffect, useRef } from "react";

export function PageContent({ title, children }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      {children}
    </main>
  );
}
```

This simple example focuses whenever `title` changes. In a real router, use a navigation identity and an explicit policy to avoid focusing on unrelated title updates. Consider preserving focus for modal flows or in-page navigation. Verify that focus does not land in an exiting page or behind an overlay.

**Gotcha:** Focusing an element that is not yet mounted or is hidden by an exit layer can silently fail. Coordinate focus with the destination's committed state, not only with the start of a transition.

### 7. Scroll Restoration and Hash Navigation

Scroll behavior should follow navigation semantics. New route navigation commonly starts at the top, browser back/forward navigation may restore a saved position, and hash links should scroll to their target. Do not blindly call `window.scrollTo(0, 0)` for every route change, because that can break history restoration and deep links.

```js
function applyNavigationScroll({ isPopNavigation, hash }) {
  if (hash) {
    const target = document.getElementById(hash.slice(1));
    target?.scrollIntoView({ block: "start" });
    return;
  }

  if (isPopNavigation) {
    // Delegate to the router's saved-position restoration policy.
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}
```

The inputs in this example are supplied by the routing layer; they are not browser-provided globals. A production implementation should wait until the target route content exists before resolving the hash, and account for sticky headers with `scroll-margin-top`. When reduced motion is enabled, use immediate scrolling rather than smooth scrolling.

### 8. Reduced Motion for Route Transitions

Respect `prefers-reduced-motion` in CSS and JavaScript. For a route transition, reduced motion should still switch pages, update focus and scroll, and remove unnecessary visual movement. Do not leave the outgoing page visible indefinitely because an animation was disabled.

```css
.page-transition-enter {
  animation: page-fade-in 160ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .page-transition-enter {
    animation: none;
  }
}
```

If the initial state is opacity zero, make sure the no-animation path does not preserve that hidden state. JavaScript animation libraries should also use their supported reduced-motion API where available. Test the application with operating-system reduced motion enabled and by emulating the preference in DevTools.

### 9. Prevent Stale Navigation and Interrupted Exits

Users can navigate rapidly, use browser back, or trigger a redirect while an exit animation is running. The latest route should win. Avoid using an animation completion callback as the only mechanism for committing navigation. Router state remains authoritative.

If an asynchronous data request belongs to a route, cancel or disregard stale responses so the outgoing route cannot overwrite destination state. If an exit animation is present, verify how the library handles a second route key before the first exit completes. Avoid locking all navigation until a long decorative animation finishes.

```js
let latestNavigationId = 0;

async function loadRouteData(url) {
  const navigationId = ++latestNavigationId;
  const response = await fetch(url);
  const data = await response.json();

  if (navigationId !== latestNavigationId) {
    return null;
  }

  return data;
}
```

This small pattern illustrates stale-response protection, not a full router. In production, prefer the router or data-fetching library's built-in cancellation and race handling where available. Handle HTTP errors, JSON parsing failures, and aborted requests explicitly.

**Gotcha:** A stale network response and a stale animation callback are separate race conditions. Fixing one does not automatically fix the other.

### 10. Transition Only What Needs Transitioning

Avoid animating the entire application shell when only a small content region changes. Persistent navigation, search input, and shared layouts can remain mounted while route content changes. This preserves user context and reduces remounting.

```jsx
export function AppShell({ navigation, page }) {
  return (
    <div className="app-shell">
      <header>{navigation}</header>
      <div className="route-content">{page}</div>
      <footer>Site information</footer>
    </div>
  );
}
```

The shell is stable; the route content can own its transition wrapper. Use semantic landmarks that match the actual page structure. Avoid a new `<main>` around another nested `<main>`, and ensure repeated navigation links have accessible names. Stable shell components also help preserve state in search fields, tabs, and other persistent controls.

### 11. Avoid Layout-Triggering Motion

Prefer opacity and transform for short route transitions. Animating `top`, `left`, `width`, or `height` can trigger layout and paint work, especially when many elements move together. Shadows, filters, and large clipping effects can also be expensive.

```css
.route-enter {
  opacity: 0;
  transform: translateY(0.375rem);
}

.route-enter.is-active {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 160ms ease-out,
    transform 160ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .route-enter,
  .route-enter.is-active {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

Avoid applying `will-change` globally to every route element. It may increase memory use and create too many compositor layers. Profile first, use `will-change` only for a measured need, and remove it after the transition when appropriate. Check DevTools Performance for reflow, repaint, dropped frames, and long tasks.

### 12. Browser Support and Progressive Enhancement

The View Transition API is not uniformly available in every browser version and framework environment. Check current browser support and caniuse, and provide a standard navigation path when the API is unavailable. `@supports` can test CSS features, but it cannot determine whether a JavaScript API exists or whether the router integrates with it correctly.

```js
function runTransition(update) {
  if (typeof document.startViewTransition === "function") {
    document.startViewTransition(() => update());
  } else {
    update();
  }
}
```

For a production app, wrap failures carefully and verify the state update still occurs. Do not assume support from one desktop browser means support on every mobile browser. Test Safari, Firefox, and Chromium-based browsers in the project's supported versions.

### 13. Nested Routes and Persistent Layouts

Nested route layouts create a choice: transition only the leaf content, or transition a larger section when the user crosses a meaningful boundary. Transitioning every nested level can create multiple overlapping fades, duplicate main landmarks, and confusing focus behavior.

```jsx
export function WorkspaceLayout({ sidebar, children }) {
  return (
    <section aria-label="Workspace">
      <aside>{sidebar}</aside>
      <div className="workspace__content">{children}</div>
    </section>
  );
}
```

Keep the sidebar persistent when moving between pages in the same workspace, then transition the leaf content. For a move to an entirely different section of the product, a broader transition may be justified. Define a route identity that matches this boundary and verify that focus is moved only once.

### 14. Test Deep Links, Refreshes, and JavaScript Failure

Route transitions must not become prerequisites for rendering content. Test direct URL entry, page refresh, back/forward navigation, redirects, and not-found routes. Server-rendered or statically rendered pages should remain readable before enhancement scripts load. If a transition layer fails, the user should still reach the requested destination.

Use a no-animation test mode when possible. Assert the route content and accessible landmarks rather than taking snapshots of transient opacity values. Test keyboard navigation during entry and exit. Ensure that a failed data request displays an error state rather than leaving the old route visually present as if it were current.

```js
function reportRouteTransition({ from, to, startedAt, finishedAt }) {
  const durationMs = Math.max(0, finishedAt - startedAt);
  console.table([{ from, to, durationMs }]);
  return durationMs;
}
```

Use the helper in a development-only diagnostic path. Do not log sensitive route data, query parameters containing secrets, or personally identifiable information. A performance trace should focus on timing and rendering rather than exposing user content.

### 15. Scroll, Focus, and Transition Coordination

Focus and scroll policies should be coordinated, not bolted on separately. If the new page heading is focused, browsers may scroll it into view automatically. If the route also calls `scrollTo`, the final position can jump twice. Decide which action owns the final position and test it with sticky headers, nested scroll containers, and hash links.

For a route change, a useful sequence is:
1. Router updates the destination identity.
2. The new route content is committed.
3. The scroll policy chooses top, saved position, or hash target.
4. Focus moves to the appropriate destination when that is the app's policy.
5. Any short visual transition completes without blocking the page.

This is a conceptual order; framework lifecycles may require a different implementation. Do not force a focus move for every route update if the product intentionally preserves context. Ensure `:focus-visible` styling remains obvious after programmatic focus and keyboard navigation.

### 16. Framework API Verification

Routing and animation APIs evolve. Verify the installed router's recommended route-transition integration, the motion library version, and whether the framework supports concurrent or deferred updates. Treat sample code as a pattern, not a substitute for checking package versions and official documentation.

Before implementation, record:
- Framework and router version.
- Motion library and version.
- Whether route content is server-rendered.
- How route keys are computed.
- Whether exit presence is supported by the current router integration.
- Whether focus and scroll restoration are already managed.
- How reduced motion is configured.
- How transitions are tested in the project's environment.

Avoid mixing code from multiple major versions. When an API is not available, implement the behavior using the project's supported lifecycle rather than adding a speculative fallback.

### 17. Transition Observability and Debugging

A route transition is easier to debug when the team can identify the current route, transition state, and relevant timings. In development, record route identity and duration without exposing private query data. Use DevTools Elements and Computed panels to inspect opacity, transform, stacking context, and pointer-event behavior. Use the Performance panel to find long tasks and expensive paint.

```js
function inspectTransition(element, routeKey) {
  if (!element) {
    console.warn("Transition inspection skipped: element is missing");
    return null;
  }

  const style = getComputedStyle(element);
  const report = {
    routeKey,
    opacity: style.opacity,
    transform: style.transform,
    transitionDuration: style.transitionDuration,
    animationName: style.animationName,
    pointerEvents: style.pointerEvents
  };

  console.table(report);
  return report;
}
```

Run this helper only in development. If the route appears blank, inspect whether an initial hidden style remains active, whether the destination mounted, and whether an overlay covers it. If clicks do not work, inspect stacking context, `pointer-events`, and whether the outgoing layer still intercepts input.

**Gotcha:** A transparent exiting page can still cover the destination and intercept pointer events. Coordinate pointer behavior and presence state; visual opacity alone does not make an element inert.

### 18. Security, Privacy, and Route Content

Do not log full URLs if query parameters can contain tokens, email addresses, search terms, or other sensitive information. Transition analytics should record only the minimum useful route identifier and timing. Keep route data and user-specific content out of debugging screenshots or shared logs.

Avoid placing untrusted route content into raw HTML just to simplify a transition. Animation does not change normal rendering security requirements. Keep text rendering escaped by the framework and use validated route parameters. If a route loads private data, ensure the outgoing page does not remain visible longer than intended after permissions or identity change.

### 19. Patterns for Real Interfaces

### Pattern: Quiet Fade

**What it does:** Uses a short opacity transition to acknowledge navigation without adding spatial distraction.

**When to use it:** Content pages where continuity matters but a large movement would be excessive.

```css
.route-content {
  animation: route-fade 140ms ease-out;
}

@keyframes route-fade {
  from { opacity: 0.85; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .route-content { animation: none; }
}
```

### Pattern: Small Directional Shift

**What it does:** Adds a small transform to imply progression while keeping the effect brief.

**When to use it:** A guided multi-step flow where the direction is meaningful.

```css
.route-content {
  animation: route-enter 160ms ease-out both;
}

@keyframes route-enter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Pattern: Stable Shell

**What it does:** Leaves navigation and persistent controls mounted while only the page content changes.

**When to use it:** Applications with shared navigation, filters, or workspace context.

```jsx
<div className="app-shell">
  <header>{navigation}</header>
  <main>{routeContent}</main>
</div>
```

### Pattern: Presence-Managed Exit

**What it does:** Keeps outgoing content mounted long enough for a short exit animation.

**When to use it:** A route transition where a brief exit adds clarity and the router integration supports it.

```jsx
<AnimatePresence mode="wait">
  <motion.main key={routeKey} exit={{ opacity: 0 }}>
    {children}
  </motion.main>
</AnimatePresence>
```

### Pattern: View Transition Enhancement

**What it does:** Uses browser-managed snapshots for supported same-document DOM updates.

**When to use it:** A progressive enhancement where unsupported browsers still navigate normally.

```js
if (document.startViewTransition) {
  document.startViewTransition(() => updateState());
} else {
  updateState();
}
```

### Pattern: Navigation Focus Target

**What it does:** Moves focus to a meaningful destination after route change.

**When to use it:** Client-side navigation that otherwise leaves keyboard focus on a removed link.

```jsx
<h1 ref={headingRef} tabIndex={-1}>{pageTitle}</h1>
```

### Pattern: Scroll Policy by Navigation Type

**What it does:** Separates top-of-page navigation, hash navigation, and history restoration.

**When to use it:** Routers that need consistent scroll behavior across links and browser history.

```js
if (hash) target?.scrollIntoView({ block: "start" });
else if (!isPopNavigation) window.scrollTo({ top: 0, behavior: "auto" });
```

### Pattern: Reduced-Motion Route

**What it does:** Preserves navigation while removing visual travel and long delays.

**When to use it:** Any route transition system that includes motion.

```css
@media (prefers-reduced-motion: reduce) {
  .route-content { animation: none; transform: none; opacity: 1; }
}
```

### Pattern: Latest-Navigation Wins

**What it does:** Prevents an older asynchronous request from replacing newer route data.

**When to use it:** Route-driven fetching or search navigation with potentially overlapping requests.

```js
const requestId = ++latestRequestId;
const data = await loadData();
if (requestId !== latestRequestId) return;
```

### 20. Build Challenge: Production-Ready Page Transition Kit

Build a transition layer for a small multi-route application. Keep the routing framework authoritative and treat motion as an optional presentation layer.

1. Define the supported route boundaries and document which transitions are enabled.
2. Keep the shared header and navigation mounted across sibling routes.
3. Choose a stable route key that matches the intended navigation semantics.
4. Use one transition owner per route boundary to avoid nested duplicate animations.
5. Use transform and opacity for visual motion and avoid layout-triggering animation by default.
6. Set an explicit short duration and named easing value.
7. Provide a no-animation path for reduced motion and test it in DevTools.
8. Ensure all content is readable if JavaScript animation fails or is disabled.
9. Move focus to the destination according to the app's navigation policy.
10. Preserve browser back/forward scroll restoration and support hash navigation.
11. Test deep links, refresh, redirects, and not-found routes.
12. Trigger two navigations rapidly and confirm the latest destination wins.
13. Test a stale data response and ensure it cannot replace the current route's data.
14. Test an outgoing page containing the focused link and verify focus remains meaningful.
15. Test that an exiting transparent layer cannot intercept clicks.
16. Check Safari, Firefox, and Chromium-based browsers in supported versions.
17. Profile the transition in DevTools Performance on a lower-powered device.
18. Add a development-only diagnostic that reports duration and route identity without logging sensitive query data.
19. Verify semantic landmarks are not duplicated by nested layouts.
20. Add a test that disables animations and asserts that the destination content is still visible and interactive.
21. Confirm reduced-motion mode does not leave opacity at zero or focus trapped in outgoing content.
22. Document the fallback behavior when the View Transition API or a motion-library feature is unavailable.

## Definition of Done

- [ ] Router state remains authoritative.
- [ ] Route identity and key behavior are documented.
- [ ] Shared layout remains mounted where appropriate.
- [ ] There is no duplicate main landmark caused by transition wrappers.
- [ ] Motion uses transform and opacity unless a measured reason supports another property.
- [ ] Reduced-motion behavior preserves the final route and all content.
- [ ] Keyboard focus reaches a meaningful destination when appropriate.
- [ ] Scroll behavior supports new navigation, history restoration, and hash links.
- [ ] Rapid navigation settles on the latest destination.
- [ ] Stale network responses cannot overwrite current route data.
- [ ] Exiting layers do not intercept input after they should be inactive.
- [ ] Direct URL entry and refresh work without relying on animation.
- [ ] Errors and not-found routes remain readable and actionable.
- [ ] Performance has been checked on realistic content and target browsers.
- [ ] Debug logs avoid sensitive route information.
- [ ] Browser support and framework API versions have been verified.

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Treating animation as navigation state | A visual callback can leave the wrong route active | Let the router own route identity and state |
| Using a random key on every render | The page remounts and transitions repeatedly | Derive a stable key from route identity |
| Keying every nested layout | Persistent UI remounts and loses context | Animate only the route boundary that changes |
| Using a long exit animation | Navigation feels blocked | Keep exits short and avoid gating route state on them |
| Animating every query-string change | Small filter updates feel like full page changes | Define route semantics and choose a narrower key |
| Ignoring focus after client navigation | Keyboard focus may remain on a removed link | Move focus according to a documented navigation policy |
| Focusing before destination mount | Focus calls silently fail | Focus after the destination commits |
| Scrolling to top on every change | Back/forward history and hash links break | Separate new navigation, pop navigation, and hash policy |
| Assuming View Transition API is universal | Unsupported browsers lose the enhancement | Provide standard navigation fallback |
| Using `@supports` to test a JS API | CSS feature queries cannot detect JavaScript integration | Check the API at runtime and test framework support |
| Keeping a transparent exit layer interactive | It can intercept clicks on the destination | Manage pointer behavior and presence state |
| Animating width or top every frame | Layout and paint costs can rise | Prefer transform and opacity |
| Applying `will-change` to every route child | Excessive layers consume memory | Profile and apply only to proven hotspots |
| Ignoring reduced motion in JavaScript | CSS alone may not override inline styles | Use the library's reduced-motion support too |
| Hiding the initial route with opacity zero | Failed scripts can leave a blank screen | Keep a visible base state and enhancement-only animation |
| Duplicating main landmarks | Screen-reader landmark navigation becomes confusing | Keep one primary main landmark per page |
| Ignoring rapid route changes | Stale callbacks or data can win | Test interruption and make latest route authoritative |
| Logging full route URLs | Query data may expose private information | Log a sanitized route identifier |
| Assuming exit presence is automatic | Removed elements may never animate out | Use the framework/library's supported presence pattern |
| Testing only one browser | Scroll, focus, and API support may differ | Test Safari, Firefox, and Chromium |
| Relying on screenshots of transient frames | Tests become flaky and miss semantics | Assert destination content and accessible state |
| Forgetting hash navigation | Deep links land at the wrong position | Resolve the hash after destination content exists |
| Failing to handle redirects | Transition layer may animate a stale destination | Let router redirects update route identity normally |
| Leaving focus in removed content | Focus can fall back unpredictably | Move focus before removal when required |
| Treating opacity zero as hidden | Controls may remain in accessibility and keyboard order | Use correct semantic and focusability state |

## Quick Reference

| Concern | Recommended default | Verify |
|---|---|---|
| Route authority | Router owns state | Navigation remains correct without motion |
| Route key | Stable semantic route identity | No remount on incidental renders |
| Transition target | Leaf route content | Shared shell stays mounted |
| Motion properties | Transform and opacity | No avoidable reflow or repaint |
| Exit duration | Short and non-blocking | Rapid navigation still works |
| Reduced motion | Immediate final state | No invisible content |
| Focus | Destination heading or region by policy | `:focus-visible` remains clear |
| Scroll | Policy by navigation type | Back/forward and hashes work |
| View Transition API | Progressive enhancement | Runtime fallback exists |
| Presence handling | Router/library-supported pattern | Exit actually renders |
| Dynamic data | Cancel or ignore stale responses | Old data cannot replace current route |
| Browser testing | Safari, Firefox, Chromium | Target versions are supported |
| Debugging | DevTools Computed and Performance panels | Inspect opacity, transform, stacking |
| Logging | Sanitized route identifiers | No sensitive query values |
| Layout landmarks | One main landmark | Nested routes do not duplicate it |
| CSS feature support | Check caniuse and use `@supports` where suitable | Fallback remains usable |
| Performance | Profile before adding `will-change` | No excess layers or jank |
| Automated tests | Assert final state | Test with animations disabled |
| Error state | Visible and actionable | Failure does not preserve stale content |
| Hash links | Resolve after destination mounts | Sticky-header offset is considered |



## Route Transition Testing Matrix

A transition should be tested as a navigation behavior, not only as a visual flourish. Create a small matrix of route types, navigation methods, motion preferences, and interruption cases. This makes hidden assumptions visible before they become production bugs.

| Scenario | Expected behavior | Failure signal |
|---|---|---|
| Directly open a nested URL | Destination content renders | App requires a previous page |
| Refresh a nested route | Same route remains available | Server returns an unintended error |
| Click a normal internal link | Route changes and focus policy runs | Focus remains on a removed control |
| Use browser Back | Prior route and scroll policy are restored | Scroll unexpectedly jumps to top |
| Follow a hash link | Target is reached after content mounts | Hash target is missing or obscured |
| Navigate twice quickly | Latest destination wins | Older route appears afterward |
| Enable reduced motion | Navigation completes without unnecessary travel | Content stays hidden or delayed |
| Disable JavaScript animation | Destination remains readable | Blank or stale page remains |
| Remove focused outgoing content | Focus moves to a meaningful surviving target | Focus becomes lost or hidden |
| Load a not-found route | Error content is readable and actionable | Previous page remains visible as current |

Use the matrix in manual QA and translate the highest-risk rows into automated tests. The exact test tooling depends on the application. Avoid brittle assertions against a particular animation frame; assert route identity, visible content, focus, and scroll outcomes instead.

## Stacking Contexts and Pointer Events

Route layers can create stacking contexts through transforms, opacity, filters, positioned elements, and `z-index`. An exiting route may appear above the new route even if its opacity is nearly zero. It can also intercept pointer events while visually transparent. Inspect the Elements panel and Computed styles when clicks or focus behave unexpectedly.

```css
.route-layer {
  position: relative;
}

.route-layer[data-exiting="true"] {
  pointer-events: none;
}
```

Only disable pointer events when the exiting layer should no longer receive interaction. Do not apply this rule blindly if the old page is intentionally interactive during an overlapping transition. Keep focus management separate: `pointer-events: none` does not remove descendants from keyboard navigation or the accessibility tree.

If overlapping routes are used, document the stacking order and the point at which the outgoing layer becomes inert. Avoid using a large `z-index` as a substitute for understanding which element owns the stacking context. In DevTools, inspect the actual stacking ancestors rather than only the child element's computed `z-index`.

**Gotcha:** A high `z-index` cannot escape an ancestor stacking context. If the old route is trapped above the new route, inspect the ancestors and their stacking-context triggers.

## Avoid Scroll Jank During Route Changes

Scroll behavior can become unstable when a route transition and layout shift happen together. Images without reserved dimensions, fonts that change line wrapping, and content that mounts after the scroll command can all move the destination unexpectedly. Reserve media space, wait for the target to exist before resolving a hash, and avoid combining smooth scrolling with focus-induced scrolling unless the interaction is deliberate.

```css
.article-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

[id] {
  scroll-margin-top: 5rem;
}
```

The global ID rule is illustrative; in a real project, scope `scroll-margin-top` to relevant anchor targets so it does not alter unrelated elements. The `aspect-ratio` property is widely supported in modern browsers, but check current browser support and caniuse if the project's support matrix includes older browsers. A stable layout reduces scroll jumps and improves perceived performance.

For pages with nested scroll containers, identify which container owns restoration. The document viewport and an inner scrolling panel are separate scroll contexts. Restoring one while the other is expected to preserve its position can create a confusing result.

## Error Boundaries and Transition Failure

Animation should not mask a route rendering error. If the destination throws during render or fails to load its data, the application should show its established error boundary or route error state. Do not keep an outgoing screenshot or stale page as the only visible response to a failed destination.

```jsx
export function RouteError({ retry, message }) {
  return (
    <section aria-labelledby="route-error-title" role="alert">
      <h1 id="route-error-title">This page could not be opened</h1>
      <p>{message || "Something went wrong while loading this page."}</p>
      <button type="button" onClick={retry}>Try again</button>
    </section>
  );
}
```

Use the application's real error-boundary and retry mechanism. The sample shows the semantic shape, not a complete error recovery system. If a retry triggers another route transition, ensure it does not reuse stale animation state or leave the old error layer on top of the successful page. Keep the error message specific enough to help without exposing stack traces or private implementation details.

**Gotcha:** A route transition completing successfully does not mean route data loaded successfully. Treat rendering, data, and animation outcomes as separate concerns.

## Timing Review: Measure the Whole Journey

A short transition can still feel slow when it waits for data, waits for exit presence, then waits again for an entry delay. Measure the complete journey from user navigation to the destination becoming usable. Separate network time, render time, exit duration, entry duration, focus update, and scroll restoration in diagnostics.

```js
function describeNavigationTiming({
  startedAt,
  destinationCommittedAt,
  transitionFinishedAt
}) {
  const commitMs = Math.max(0, destinationCommittedAt - startedAt);
  const visualMs = Math.max(0, transitionFinishedAt - destinationCommittedAt);

  const summary = {
    timeToDestinationCommitMs: commitMs,
    visualTransitionMs: visualMs,
    totalMs: commitMs + visualMs
  };

  console.table(summary);
  return summary;
}
```

Use a monotonic timing source such as `performance.now()` for elapsed durations when implementing the real diagnostic. Avoid storing raw user content in telemetry. If the destination is already committed but the transition is still running, consider whether the motion is delaying the user's next action. A route transition should not become a disguised loading spinner.

## Integration Checklist for Existing Applications

Before adding a transition to an established application, audit what the router already does. Many routers or frameworks already provide scroll restoration, pending states, focus conventions, error boundaries, or view-transition integration. Replacing these behaviors without understanding them can introduce regressions.

1. Identify the current route-change lifecycle and the point at which destination content is committed.
2. Confirm whether the router already restores scroll positions or handles hash navigation.
3. Confirm whether navigation already moves focus or announces route changes.
4. Identify the shared shell and the smallest content boundary that needs motion.
5. Confirm how redirects, not-found routes, and error boundaries interact with the transition.
6. Verify whether the installed framework supports the intended animation API and version.
7. Choose the no-motion behavior before writing the animated version.
8. Test the route using keyboard-only navigation and reduced motion.
9. Inspect stacking contexts and pointer events during the exit state.
10. Measure the full time until the destination can be used, not only the animation duration.
11. Check the current browser support matrix and use progressive enhancement where needed.
12. Document the transition's owner so future components do not add duplicate route animations.


## Final Principle

A page transition should make navigation easier to follow, never harder to complete. Keep routing authoritative, motion short and optional, focus and scroll deliberate, and every destination usable when the animation is skipped.
