# Intersection Observer: Production Patterns for Viewport-Aware Interfaces

> **Skill:** `intersection-observer`  
> **Layer:** 04 — JavaScript & Browser APIs  
> **Primary use:** Detect when an element enters or leaves a relevant viewport or scroll container without polling its geometry on every frame.  
> **Audience:** Frontend engineers building scroll reveals, lazy loading, infinite lists, active-section navigation, sticky-state signals, media activation, and visibility-aware UI.

## Why This Matters

Intersection Observer is easy to wire up and easy to misuse. In production, a lazy-loaded image can remain blank because its observer was attached before the component had a usable source; a reveal animation can replay on every tiny scroll reversal; an infinite feed can request pages repeatedly because its sentinel remains intersecting; and an active-section indicator can jump between neighboring headings because the configuration treats a broad intersection as a precise reading position. These are not merely visual defects. They can increase network traffic, waste CPU, delay content, create inaccessible motion, and make interfaces feel unreliable.

The API lets the browser report changes in the relationship between a target element and a root rectangle. It does not promise a callback for every pixel of movement, a precise scroll-progress value, or a synchronous answer to “is this visible right now?” A robust implementation defines what visibility means for the product, chooses a root and thresholds deliberately, treats notifications as asynchronous state updates, and owns observer lifecycle explicitly.

Use Intersection Observer when the application needs a threshold-based visibility signal. Use scroll position or a dedicated scroll-animation system when the requirement is continuous progress, exact geometric control, or per-frame animation. Use CSS where CSS alone expresses the desired behavior. Do not turn every element into an observed target by default: observer callbacks still need to be bounded, meaningful, and cleaned up.

## Operating Principles

1. **Visibility is a product rule, not a universal fact.** “Visible” might mean one pixel has entered the viewport, 50% of a card is visible, or an element has crossed a custom reading line. Choose the rule from the user experience.
2. **An observation is a notification, not a command.** Callbacks can contain multiple entries and can arrive after layout changes. Process the entries that were delivered rather than assuming the callback refers to one target.
3. **The root defines the coordinate context.** `root: null` means the top-level viewport. A scrollable panel may require that panel as the root. A wrong root can make an observer appear broken.
4. **Thresholds are crossing points.** They are not a continuous progress stream. A threshold of `0.5` means the observer reports when the ratio crosses 50%, not at every intermediate ratio.
5. **Lifecycle is part of correctness.** Disconnect observers when their owning view is disposed, unobserve one-shot targets when appropriate, and prevent stale callbacks from updating removed UI.
6. **A sentinel needs a state machine.** Infinite scrolling must coordinate intersection, loading, errors, and exhaustion. The observer alone does not prevent duplicate requests.

## 1. The Observation Model

An `IntersectionObserver` watches one or more target elements against a root rectangle. When the relationship crosses a configured threshold or otherwise produces an initial observation, the browser queues an `IntersectionObserverEntry` for the callback. Each entry includes the target, bounding rectangles, intersection rectangle, ratio, and an `isIntersecting` boolean. The callback receives a batch because several targets can change during the same delivery.

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    console.log({
      target: entry.target,
      isIntersecting: entry.isIntersecting,
      ratio: entry.intersectionRatio,
      bounds: entry.boundingClientRect,
      intersection: entry.intersectionRect,
    });
  }
});

observer.observe(document.querySelector("[data-observe]"));
```

The API is asynchronous by design. Do not expect `observe()` to synchronously return a visibility result, and do not build logic that assumes a callback will happen before the next line executes. The first notification is useful for establishing the initial state, including the case where the target begins outside the root. A target may have a zero ratio at a boundary; use `isIntersecting` for the basic entering/leaving state and `intersectionRatio` when the requirement genuinely depends on area proportion.

The ratio is the area of the intersection rectangle divided by the target's bounding-box area, with edge cases handled by the platform. It is not “percent of the element the user can perceive.” Occlusion by another element, opacity, clipping beyond the root calculation, and whether the content is meaningful to the user are separate concerns. A target can geometrically intersect while being covered by a sticky overlay. Newer visibility-tracking options have different support and cost characteristics; do not assume ordinary intersection proves actual on-screen perceptibility.

**Gotcha:** `isIntersecting` does not mean “the element is at least half visible.” If the product rule is a minimum ratio, test both `isIntersecting` and the ratio against the required threshold.

## 2. Root, Root Margin, and Nested Scrollers

The root determines the rectangle against which the target is compared. With `root: null`, the browser uses the top-level viewport. With an element root, that element defines the relevant scroll container context; it must be an appropriate ancestor of the target and should represent the region that actually scrolls. A common failure is observing items inside a nested panel against the viewport and assuming the panel's own scrolling will be interpreted as intended.

`rootMargin` expands or contracts the root rectangle. It accepts CSS-like top, right, bottom, and left offsets. A positive bottom margin can begin loading content before it reaches the visible viewport; a negative margin can require a target to move farther into the root before it counts. Margins are not target margins and do not change document layout. Use them to express preloading or activation lead time, not to compensate for a fundamentally incorrect root.

```js
const feed = document.querySelector(".feed-scrollport");
const observer = new IntersectionObserver(onEntries, {
  root: feed,
  rootMargin: "0px 0px 320px 0px",
  threshold: 0,
});

function onEntries(entries) {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.dataset.nearViewport = "true";
    }
  }
}
```

A percentage in `rootMargin` is resolved relative to the root rectangle's dimensions according to the API's rules; do not treat it as a target-relative percentage. Test margins on real viewport sizes, including short mobile screens and browser zoom. If the root element is replaced during rendering, the observer still references the original element. Rebuild or reconfigure the observer when the root changes.

**Gotcha:** A positive root margin may make an element intersect before it is visibly on screen. This is useful for prefetching but often wrong for analytics that claim an impression was actually seen.

## 3. Thresholds and Entry Ordering

`threshold` can be a number or an array of ratios. The browser queues entries when the intersection ratio crosses one of the configured thresholds, as well as for initial observation. A single threshold of `0` is common for “entered the root” behavior. A threshold of `1` requires full intersection where possible, but a target larger than the root may never reach that ratio. A list such as `[0, 0.25, 0.5, 0.75, 1]` creates several crossing points, not a reliable animation timeline.

```js
const observer = new IntersectionObserver(handleEntries, {
  threshold: [0, 0.25, 0.5, 0.75, 1],
});

function handleEntries(entries) {
  for (const entry of entries) {
    updateCardVisibility(entry.target, entry.intersectionRatio);
  }
}
```

The `entries` array may include multiple targets and multiple records relevant to an observation timeline. If logic depends on chronological order, use `entry.time` to compare records rather than assuming array order maps to DOM order. For one target, the latest relevant record may matter more than the first record in a batch. Do not sort all records by document position and then interpret that as temporal order.

Threshold arrays should be as small as the product behavior allows. Excessive thresholds can increase callback activity and encourage using the API for a task it was not designed to solve. If a progress bar needs smooth continuous progress, calculate progress from a scroll timeline or a dedicated scroll handler with appropriate scheduling rather than attempting hundreds of thresholds.

**Gotcha:** A target larger than the viewport can never be 100% visible. Prefer a realistic threshold such as `0.1` or `0.25`, or use a sentinel with a predictable size.

## 4. One-Shot Scroll Reveals

Scroll reveal behavior often needs a simple state transition: before entry, the element is hidden or translated; after the first qualifying intersection, it becomes visible and is no longer observed. Use CSS classes for the visual effect and JavaScript only to toggle state. This keeps styling declarative and makes it easier to support reduced motion without embedding animation mechanics inside the observer callback.

```html
<section class="feature-card reveal" data-reveal>
  <h2>Built for real workflows</h2>
  <p>Content remains meaningful when motion is disabled.</p>
</section>
```

```css
.reveal {
  opacity: 0;
  transform: translateY(1rem);
  transition: opacity 420ms ease, transform 420ms ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal.is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

```js
const revealObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }
}, { threshold: 0.12 });

document.querySelectorAll("[data-reveal]").forEach((node) => {
  revealObserver.observe(node);
});
```

Keep the content available if JavaScript fails. A robust approach starts with visible content and enables hidden-before-reveal styling only after the observer has been initialized, or uses a no-JavaScript fallback class on the document. Otherwise, an API failure or script-loading error can leave important text permanently transparent. Avoid adding reveal effects to every paragraph: the motion becomes noise and can delay reading. Use a small number of meaningful groups and preserve focus visibility for interactive descendants.

**Gotcha:** If the hidden class is applied in the initial HTML and the script fails before adding `is-visible`, content can remain invisible. Prefer a progressive enhancement strategy that fails open.

## 5. Lazy Loading Images and Media

Intersection Observer is useful for starting work before media enters the viewport. Native `loading="lazy"` is often the better default for ordinary images because the browser already has loading heuristics. Use a custom observer when you need a placeholder swap, custom data attributes, a nonstandard media source, an analytics hook, or coordinated behavior. Do not replace native lazy loading with custom JavaScript merely because the API is available.

For images, preserve intrinsic dimensions with `width` and `height` or an aspect-ratio box to reduce layout shift. Use meaningful `alt` text for informative images and empty alt text for purely decorative ones. An image source should be set in a way that preserves a fallback if JavaScript never runs. When observing a batch of images, unobserve a target after a successful source activation if no future visibility changes matter.

```html
<img
  class="deferred-image"
  src="/images/placeholder.webp"
  data-src="/images/team-workshop.webp"
  width="1200"
  height="800"
  alt="A team reviewing a design on a large display"
/>
```

```js
const imageObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const image = entry.target;
    const nextSource = image.dataset.src;
    if (nextSource) {
      image.src = nextSource;
      image.removeAttribute("data-src");
    }
    observer.unobserve(image);
  }
}, { rootMargin: "250px 0px", threshold: 0 });

document.querySelectorAll("img[data-src]").forEach((image) => {
  imageObserver.observe(image);
});
```

Production code should account for loading and error states. A source can be unavailable, the network can fail, or the component can be removed while loading. Do not interpret the observer callback as proof that the image loaded successfully; use the image's `load` and `error` events for that. Avoid placing the largest above-the-fold hero image behind a conservative lazy loader: doing so can delay Largest Contentful Paint. Preload only genuinely critical resources and measure the effect rather than preloading everything.

## 6. Infinite Scrolling and Sentinel State

An infinite feed commonly observes a small sentinel near the end of a list. When it intersects, the application may request the next page. The sentinel should be a normal semantic element with a stable location and a useful loading/error state around it. It should not be the only way to reach content: provide a “Load more” button as a fallback, support keyboard operation, and avoid unexpectedly stealing focus when new items are appended.

The critical design is a state machine. A simple state model includes `idle`, `loading`, `error`, and `exhausted`. The observer can request a load only from `idle`. Once loading starts, additional intersection notifications must not start another request. When the response completes, the code either returns to `idle` or moves to `exhausted`; on failure it moves to `error` and exposes a retry. A small viewport may keep the sentinel intersecting continuously after a page is appended, so the implementation must decide whether to auto-fill the viewport and how many pages it may fetch in succession.

```js
let status = "idle";
let nextPage = 1;
const sentinel = document.querySelector("[data-feed-sentinel]");
const loadMoreButton = document.querySelector("[data-load-more]");

async function loadNextPage() {
  if (status !== "idle") return;
  status = "loading";
  loadMoreButton.disabled = true;
  announceStatus("Loading more results");

  try {
    const response = await fetch(`/api/results?page=${nextPage}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    appendResultItems(payload.items);
    nextPage += 1;
    status = payload.hasMore ? "idle" : "exhausted";
    if (status === "exhausted") observer.unobserve(sentinel);
    announceStatus(payload.items.length ? `${payload.items.length} results added` : "No more results");
  } catch (error) {
    status = "error";
    showFeedError(error);
  } finally {
    loadMoreButton.disabled = status === "loading" || status === "exhausted";
  }
}

const observer = new IntersectionObserver((entries) => {
  if (entries.some((entry) => entry.target === sentinel && entry.isIntersecting)) {
    if (status === "idle") loadNextPage();
  }
}, { rootMargin: "0px 0px 500px 0px" });

observer.observe(sentinel);
loadMoreButton.addEventListener("click", () => {
  if (status === "error") status = "idle";
  loadNextPage();
});
```

The snippet shows the state boundary, not every application-specific helper. Real implementations should prevent an older response from updating a newer feed after route changes, abort requests when the owning view is disposed, validate response shape, and render user-facing error text. If the application uses a framework, prefer the framework's lifecycle and request-cancellation patterns instead of relying on module-global mutable variables.

**Gotcha:** A sentinel can remain in the expanded root margin after a page is appended. If the status is switched to `idle` immediately and the observer keeps reporting it as intersecting, the feed may fetch pages until the viewport fills. Decide whether that is intended and cap automatic page chains.

## 7. Active Navigation and Reading Position

Intersection Observer can help update an in-page table of contents as sections enter a reading region. It is not a perfect replacement for scroll-position logic in every layout. Sections vary in height, multiple headings can intersect simultaneously, and a short section may enter and leave the root between callbacks. Define a deterministic selection rule, such as choosing the intersecting heading closest to a virtual reading line, rather than simply activating whichever entry was processed last.

A negative top root margin can shrink the effective root near a fixed header. A negative bottom margin can create a narrow band where the current section is selected. Test this with headings that are short, tall, close together, and nested. Ensure the URL hash, browser back/forward behavior, and keyboard navigation still work. Do not use a visual active state as a substitute for a proper `<nav>` with descriptive links.

```js
const tocLinks = new Map(
  [...document.querySelectorAll(".toc a[href^='#']")].map((link) => [
    decodeURIComponent(link.hash.slice(1)), link,
  ])
);

const sectionObserver = new IntersectionObserver((entries) => {
  const candidates = entries.filter((entry) => entry.isIntersecting);
  if (!candidates.length) return;
  candidates.sort((a, b) => {
    const aDistance = Math.abs(a.boundingClientRect.top - 120);
    const bDistance = Math.abs(b.boundingClientRect.top - 120);
    return aDistance - bDistance;
  });
  const id = candidates[0].target.id;
  for (const [sectionId, link] of tocLinks) {
    if (sectionId === id) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}, {
  root: null,
  rootMargin: "-100px 0px -65% 0px",
  threshold: 0,
});

document.querySelectorAll("main section[id]").forEach((section) => {
  sectionObserver.observe(section);
});
```

Because callbacks contain changed observations rather than a complete snapshot of every section, this simple pattern may need a maintained state map for complex layouts. Keep a record of each observed section's latest intersection state and choose the active section from that map when an entry changes. When the user jumps directly to a hash, initialize the state consistently and avoid overriding it with stale initial entries. `aria-current="location"` communicates the current destination to assistive technology; use it only on the current link.

## 8. Video, Audio, and Expensive Widgets

An observer can be used as a signal to start or stop work for media and interactive widgets. For example, a video preview may begin playback only when it enters a large enough region, or a chart can defer expensive rendering until the user approaches it. However, visibility is not consent. Autoplay rules, sound expectations, data usage, user preferences, and browser policies still apply. Muted autoplay may be permitted in some cases but must never be treated as guaranteed.

For an embedded widget, use an explicit state model: `not-mounted`, `mounted`, `active`, `paused`, and `disposed` may be enough. Do not repeatedly construct and destroy expensive objects whenever a target crosses the threshold by a few pixels. Use hysteresis where appropriate—different activation and deactivation conditions, or a debounce/hold timer—to avoid thrashing. If the component uses WebGL, audio, or a worker, observer lifecycle should be coordinated with that component's own lifecycle and resource disposal.

```js
const widgetObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const widget = entry.target;
    if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
      activateWidget(widget);
    } else {
      deactivateWidget(widget);
    }
  }
}, { threshold: [0, 0.25] });

document.querySelectorAll("[data-expensive-widget]").forEach((widget) => {
  widgetObserver.observe(widget);
});
```

This sample intentionally delegates idempotence to `activateWidget` and `deactivateWidget`. Those functions should check current state before doing expensive work, and they should be safe if invoked more than once. For video, handle `play()` rejection, pause when appropriate, and avoid surprising audio. For charts, distinguish “not rendered yet” from “rendered but currently off-screen” so a later intersection does not repeat expensive setup unnecessarily.

## 9. Observer Reuse, Cleanup, and Component Lifecycles

An observer can watch many targets that share the same root, root margin, and threshold policy. Reuse is often simpler and cheaper than creating one observer per element. Keep the callback focused and route each entry to the right component or behavior. Separate observers when the policies differ meaningfully; a lazy image preloader and a narrow active-section detector probably need different options.

`unobserve(target)` stops tracking one target. `disconnect()` stops tracking all targets. `takeRecords()` returns queued entries and clears the queue; it is useful in specialized teardown or deterministic test scenarios, not as a normal way to force a synchronous answer. Cleanup should be owned by the same view or module that created the observer. If an observer is shared, one component must not disconnect it while other components still depend on it.

```js
function observeRevealTargets(container) {
  const targets = [...container.querySelectorAll("[data-reveal]")];
  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      currentObserver.unobserve(entry.target);
    }
  }, { threshold: 0.15 });

  targets.forEach((target) => observer.observe(target));

  return () => {
    observer.disconnect();
  };
}

const stopObserving = observeRevealTargets(document.querySelector("main"));
// Call stopObserving() when this view is disposed or replaced.
```

Avoid stale closure bugs. If a callback captures an old array of items or a component instance that has been disposed, a late delivery can update the wrong UI. Use an `active` flag, a current-instance token, or framework-native cleanup where needed. Disconnecting is not a substitute for aborting an in-flight network request triggered by an observer; those are different resources and need their own cancellation path.

**Gotcha:** Calling `disconnect()` on a shared observer during one child component's cleanup can silently disable every other target registered with it. Document ownership and scope the observer accordingly.

## 10. Progressive Enhancement and Accessibility

Visibility-driven behavior should not make content inaccessible when JavaScript is unavailable or the observer API is missing. The default document should contain real semantic content in a sensible reading order. Reveal effects should be cosmetic; essential information must not depend on a callback firing. Lazy-loaded content should have meaningful placeholders or a non-JavaScript fallback when required. Infinite scroll should offer a keyboard-accessible “Load more” control and preserve a stable focus location as results are appended.

For interactive controls, use native elements such as `<button>`, `<a>`, `<nav>`, `<main>`, `<section>`, `<figure>`, and `<img>` instead of clickable generic containers. Make focus state visible with `:focus-visible`. If newly appended content needs to be announced, use a restrained `aria-live="polite"` status region; do not announce every observer entry. Avoid moving focus automatically unless the interaction explicitly requires it. If a reveal changes visibility of focusable descendants, ensure hidden content cannot receive keyboard focus while visually hidden; opacity alone does not remove content from the focus order.

```html
<nav aria-label="On this page" class="toc">
  <a href="#overview">Overview</a>
  <a href="#examples">Examples</a>
</nav>
<main>
  <section id="overview" data-reveal>
    <h2>Overview</h2>
    <p>Read this content in normal document order.</p>
  </section>
  <p id="feed-status" role="status" aria-live="polite"></p>
  <button type="button" data-load-more>Load more results</button>
</main>
```

```css
.toc a:focus-visible,
button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Respect `prefers-reduced-motion: reduce` for scroll reveals and other movement triggered by visibility. Prefer eliminating nonessential motion rather than merely making it faster. For users who prefer reduced motion, the content should be immediately readable and the observer should still be allowed to perform nonvisual tasks such as lazy loading. Reduced-motion preferences are not a reason to disable the entire observer if it serves a non-motion function.

## 11. Performance, Scale, and Browser Work

Intersection Observer avoids application code repeatedly calling `getBoundingClientRect()` inside a high-frequency scroll listener for every target. The browser manages observation and batches notifications. That does not make observation free. Thousands of targets, large callbacks, expensive DOM writes, repeated network requests, and a huge threshold array can still cause performance problems. Observe only what the feature needs, use a shared observer for common policies, and unobserve completed targets.

Keep callbacks small. A callback should generally inspect entries, update a small amount of state, and return. Do not synchronously parse huge documents, create hundreds of DOM nodes, or run expensive layout-sensitive code for every entry. If a callback triggers layout writes that affect many observed elements, the resulting geometry changes may produce additional deliveries. Batch UI changes where appropriate, and schedule heavy work in a task or idle period only when doing so preserves the user experience. `requestIdleCallback` is not universally available and should have a fallback if used.

Measure the result with browser DevTools: inspect long tasks, the Performance panel, layout shifts, network waterfalls, and memory behavior during repeated navigation. Verify that targets are unobserved after one-shot work, that observers are disconnected on route transitions, and that images above the fold are not delayed. Use the Network panel to confirm preloading actually starts earlier and does not overfetch excessively. Use the Rendering panel and layout-shift diagnostics to catch media placeholders that change dimensions when the real asset arrives.

**Gotcha:** A large positive `rootMargin` can improve perceived loading but can also download many assets the user never reaches. Tune it against real latency and scrolling speed, not intuition alone.

## 12. Testing, Debugging, and Unsupported Environments

Intersection Observer callbacks are asynchronous and tied to layout and rendering updates, so tests that call `observe()` and immediately assert a callback are brittle. Browser integration tests should scroll a real target into and out of the root, wait for the callback or a visible state change, and assert behavior. Unit tests can mock the API to exercise state transitions deterministically, but they do not prove that the browser's geometry calculations match the layout. Use both when the feature is important.

When debugging, confirm the API exists, the target is an actual element, the root is the intended scrollport, and the target is within the root's effective rectangle after margins. Log `rootBounds`, `boundingClientRect`, `intersectionRect`, `intersectionRatio`, and `isIntersecting`. Check CSS that may keep the target zero-sized, detached, or positioned unexpectedly. If the callback fires once and then not again, verify the configured thresholds and whether the ratio has actually crossed them. If it fires too often, inspect threshold arrays and state transitions.

```js
function debugIntersection(entry) {
  console.table({
    target: entry.target?.tagName,
    id: entry.target?.id,
    isIntersecting: entry.isIntersecting,
    ratio: entry.intersectionRatio,
    targetTop: entry.boundingClientRect.top,
    targetBottom: entry.boundingClientRect.bottom,
    rootTop: entry.rootBounds?.top,
    rootBottom: entry.rootBounds?.bottom,
  });
}
```

Feature-detect the API when supporting environments that may not provide it: `"IntersectionObserver" in window`. A fallback should be proportional to the feature. For simple reveal content, the fallback can leave content visible. For a custom lazy loader, use native `loading="lazy"` where suitable or a modest throttled scroll/resize fallback if necessary. Do not build an elaborate geometry engine solely to reproduce the API for a decorative enhancement. Check current browser support targets and the oldest browsers your product promises to support; support can differ for advanced options, so avoid assuming every option is available just because the base constructor exists.

## Mental Models

1. **Intersection Observer is a threshold-crossing notifier, not a scroll-progress meter.** Choose another mechanism when continuous progress is required.
2. **The root is the measuring window.** A correct target paired with the wrong root can produce correct API behavior and incorrect product behavior.
3. **Root margin is lead time or exclusion space.** It adjusts when a target qualifies; it does not move the target or change page layout.
4. **A callback is a batch of changes.** Iterate all entries and do not assume one callback equals one target or one scroll action.
5. **One-shot behavior is an explicit lifecycle transition.** Add state, unobserve, and ensure failure leaves content readable.
6. **Infinite scrolling is a network state machine with a visibility trigger.** The observer only signals demand; the state machine prevents duplicate work.
7. **Geometry is not perception.** Intersection does not guarantee that pixels are unobscured, meaningful, or noticed by the user.
8. **Accessibility is independent of animation.** Content order, keyboard access, focus indication, and fallbacks must work even if the observer never runs.
9. **Cleanup is a correctness condition.** Disposed views should not continue receiving updates or triggering requests.
10. **Tune preloading empirically.** The best margin depends on asset size, network latency, and realistic scrolling behavior.

## Implementation Patterns

### Pattern 1 — One shared reveal observer

**What it does:** Observes many reveal targets using one consistent threshold policy, adds a visible class when they qualify, and stops tracking each target after its first reveal.

**When to use it:** Use for decorative cards, editorial sections, and nonessential scroll reveals where a one-time transition is sufficient. Avoid using it to gate essential content or to create complex scroll-linked motion.

```js
function createRevealObserver(root = null) {
  return new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }, { root, threshold: 0.12 });
}
```

Ensure CSS fails open when JavaScript is missing and add a reduced-motion override. Use `:focus-visible` on links and buttons within revealed cards.

### Pattern 2 — Predictive image loading

**What it does:** Starts loading an image before it enters the visible viewport by using a positive bottom root margin.

**When to use it:** Use for galleries or image-heavy content where custom loading state is required. Prefer native lazy loading for standard cases and do not defer critical hero media.

```js
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const image = entry.target;
    if (image.dataset.src) image.src = image.dataset.src;
    delete image.dataset.src;
    observer.unobserve(image);
  });
}, { rootMargin: "300px 0px", threshold: 0 });
```

Pair this with stable image dimensions, meaningful `alt`, and `error` handling. Monitor the Network panel to avoid fetching far more assets than users consume.

### Pattern 3 — Infinite feed with guarded fetch

**What it does:** Uses a sentinel to request the next page only while the feed is idle and stops observing when no more results exist.

**When to use it:** Use for long result feeds where incremental loading improves usability. Keep a visible button fallback and do not rely on intersection state to guard concurrent requests.

```js
let loading = false;
let exhausted = false;
async function requestMore() {
  if (loading || exhausted) return;
  loading = true;
  try {
    const page = await fetchNextPage();
    appendItems(page.items);
    exhausted = !page.hasMore;
  } finally {
    loading = false;
  }
}
```

In production, add error state, cancellation, response validation, and a cap on auto-filling multiple pages when the sentinel remains intersecting.

### Pattern 4 — Narrow reading-band observer

**What it does:** Shrinks the effective viewport to a reading band so headings near a chosen reading line can be considered active.

**When to use it:** Use for table-of-contents highlighting and chapter navigation. Do not use a last-callback-wins rule when sections can overlap or vary greatly in height.

```js
const readingObserver = new IntersectionObserver(onHeadingEntries, {
  rootMargin: "-15% 0px -70% 0px",
  threshold: 0,
});
```

Maintain latest state for all headings if selection must remain stable between callbacks. Preserve normal anchor navigation and set `aria-current="location"` only on the active link.

### Pattern 5 — Activate an expensive chart once

**What it does:** Delays initialization of a heavy chart until it approaches the viewport and remembers whether initialization already occurred.

**When to use it:** Use for charts below the fold, maps, code editors, and other expensive widgets. Keep state separate for “initialized” and “currently visible.”

```js
const initialized = new WeakSet();
const chartObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting || initialized.has(entry.target)) continue;
    initialized.add(entry.target);
    renderChart(entry.target);
    observer.unobserve(entry.target);
  }
}, { rootMargin: "200px 0px", threshold: 0 });
```

Handle chart initialization failures and dispose charts when their owner is removed. If the chart needs a measurable width, ensure it has layout dimensions before rendering.

### Pattern 6 — Element-root observation

**What it does:** Observes targets relative to a specific scrollable element instead of the browser viewport.

**When to use it:** Use for carousel panels, nested dashboards, chat history, and independently scrolling regions.

```js
const scrollport = document.querySelector(".messages-scrollport");
const observer = new IntersectionObserver(onMessageEntries, {
  root: scrollport,
  rootMargin: "0px 0px 120px 0px",
  threshold: 0,
});
```

Confirm the scrollport is an ancestor of the targets and has the intended overflow behavior. Recreate the observer if the root node is replaced.

### Pattern 7 — Fail-open progressive enhancement

**What it does:** Keeps content readable when JavaScript or the API is unavailable and only applies hidden-before-reveal styling after setup succeeds.

**When to use it:** Use for nonessential reveal effects and any content that must remain available during script failure.

```js
if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("has-intersection-observer");
  startRevealBehavior();
}
```

Use CSS so the default state is visible and only `.has-intersection-observer` enables the initial hidden state. Remove or avoid the hidden state if initialization throws.

### Pattern 8 — Deterministic observer wrapper

**What it does:** Wraps observer creation, observation, and cleanup behind a small API so the owning component can dispose it predictably.

**When to use it:** Use in multi-module sites where several screens share a behavior but still need explicit lifecycle ownership.

```js
function watchTargets(targets, callback, options) {
  const observer = new IntersectionObserver(callback, options);
  for (const target of targets) observer.observe(target);
  let disposed = false;
  return {
    unobserve(target) { if (!disposed) observer.unobserve(target); },
    dispose() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
    },
  };
}
```

Document whether the wrapper owns all targets or receives a shared observer. Idempotent disposal avoids errors during overlapping route teardown paths.

## Mistake Table

| ID | Mistake | Why it fails | Fix |
|---|---|---|---|
| A | Assuming `observe()` returns current visibility | Observation is asynchronous and does not return a result. | Store a pending state and update it from the first callback. |
| B | Using `root: null` for a nested scroll panel | The top-level viewport is not the panel's intended measurement context. | Pass the actual scrollport as `root` and verify it contains the target. |
| C | Treating `isIntersecting` as a 50% threshold | It reports basic intersection, not a custom minimum ratio. | Check `intersectionRatio` against the product's explicit minimum. |
| D | Using threshold `1` for a tall card | A target larger than the root may never be fully visible. | Select a reachable ratio or observe a small sentinel. |
| E | Treating threshold arrays as continuous progress | Callbacks occur at crossings, not every pixel. | Use scroll progress APIs or scheduled scroll measurement for continuous effects. |
| F | Using the last callback entry as active section | Delivery order does not necessarily represent the best reading-position choice. | Track each section's latest state and apply a deterministic selection rule. |
| G | Hiding content before observer initialization | Script failure can leave important content invisible. | Make the default state visible and gate reveal styling behind successful setup. |
| H | Forgetting to unobserve one-shot targets | Targets continue generating work after their behavior is complete. | Call `unobserve()` immediately after the one-time transition. |
| I | Disconnecting a shared observer from a child cleanup | Other components lose their observations too. | Give the observer a clear owner or reference-count shared registrations. |
| J | Fetching on every sentinel callback | Multiple notifications can start duplicate requests. | Gate requests with explicit loading state and disable repeated triggers. |
| K | Not handling a sentinel that stays intersecting | A feed can auto-fetch pages indefinitely. | Cap automatic chaining and check `hasMore` before each request. |
| L | Assuming intersection means media loaded | Visibility and network success are separate events. | Handle the media element's `load` and `error` events. |
| M | Lazy-loading the primary hero image | Critical content may arrive too late and harm LCP. | Keep above-the-fold media eager or prioritize it based on measured performance. |
| N | Omitting image dimensions | Layout shifts occur when media dimensions become known. | Provide width/height attributes or reserve an aspect-ratio box. |
| O | Creating a new observer for every target | Duplicated policies and lifecycle work become harder to manage. | Share one observer among targets with the same options. |
| P | Doing heavy work inside the callback | Long callback work can delay rendering and input responsiveness. | Keep the callback small and defer nonurgent work with a supported fallback. |
| Q | Ignoring reduced-motion preferences | Visibility triggers may produce unwanted motion for some users. | Disable nonessential transitions under `prefers-reduced-motion: reduce`. |
| R | Making opacity the only hidden state | Invisible controls may remain keyboard-focusable. | Use a focus-safe reveal strategy and ensure hidden interactive descendants cannot receive focus. |
| S | Assuming the observer API exists everywhere | Older or constrained environments may not implement it. | Feature-detect and provide a simple, proportionate fallback. |
| T | Testing only with a mocked observer | Mocks do not validate real browser geometry or root margins. | Add browser-level tests that scroll actual targets through the root. |
| U | Ignoring failed network requests in infinite scroll | A feed can remain stuck in a loading state or provide no recovery. | Model error explicitly and provide an accessible retry action. |
| V | Using a huge root margin without measurement | The page can download resources users never see. | Tune the margin using real network latency and scroll behavior. |
| W | Capturing stale component state in callbacks | A late entry can update a replaced or disposed view. | Use lifecycle cleanup, cancellation, or an instance token before committing updates. |
| X | Replacing the root element without rebuilding | The observer keeps the old root reference. | Dispose and create a new observer when the root node changes. |

## Quick Reference

| Need | Configuration or method | Important caveat |
|---|---|---|
| Observe top-level viewport | `root: null` | Does not represent nested scrollport behavior. |
| Observe a nested panel | `root: scrollportElement` | Root should be the appropriate ancestor. |
| Enter/leave signal | `threshold: 0` | Use `isIntersecting` for basic state. |
| Minimum visible proportion | `threshold: 0.25` | Still check ratio for product-specific state. |
| Multiple crossing points | `threshold: [0, 0.5, 1]` | Not continuous progress. |
| Preload before entry | `rootMargin: "300px 0px"` | May fetch content users never reach. |
| Ignore the target after completion | `observer.unobserve(target)` | Other targets remain observed. |
| Stop all observation | `observer.disconnect()` | Use only when the observer owner is done. |
| Inspect pending records | `observer.takeRecords()` | Does not force fresh geometry synchronously. |
| Debug geometry | `entry.rootBounds`, `boundingClientRect`, `intersectionRect` | Geometry alone does not prove perception. |
| Read intersection ratio | `entry.intersectionRatio` | A ratio can be limited by root size. |
| Identify target | `entry.target` | Handle all entries in each callback. |
| Compare observation timestamps | `entry.time` | Do not infer time from DOM order. |
| Support reduced motion | `@media (prefers-reduced-motion: reduce)` | Keep nonvisual observation behavior if needed. |
| Fallback | `"IntersectionObserver" in window` | Choose the simplest fallback that preserves the feature. |
| Lazy-load ordinary images | `loading="lazy"` | Often better than a custom observer. |
| Avoid layout shift | `width`, `height`, or `aspect-ratio` | Reserve media dimensions before loading. |
| Support keyboard users | Native buttons/links and `:focus-visible` | Never make scrolling the only way to load more. |
| Announce feed updates | `role="status"` / `aria-live="polite"` | Avoid announcing every intersection record. |
| Verify real geometry | Browser integration test | Mock tests alone are insufficient. |

## Browser Compatibility and Progressive Fallbacks

The base Intersection Observer API is supported in modern major browsers, but products should verify their actual support matrix rather than rely on a blanket claim. Some advanced configuration options, including visibility tracking, may have different support and performance characteristics from the core API. Feature-detect the capability actually used and check the current compatibility data for the supported browser versions. If the feature is cosmetic, the safest fallback is often to show all content. If the feature is lazy loading, consider native `loading="lazy"` before building a scroll/resize fallback. If a fallback is necessary, throttle or schedule geometry checks, remove listeners during cleanup, and avoid forcing layout reads for every target on every scroll event.

When supporting a browser without Intersection Observer, do not leave elements in a hidden initial state. Keep all content visible, activate media using a supported loading mechanism, and provide a manual control for paginated feeds. A fallback should preserve access to the content even if it does not reproduce the same animation or preloading behavior. This is an example of graceful degradation: the enhancement may differ, but the user still completes the task.

## Debugging Checklist

- [ ] Confirm `IntersectionObserver` exists in the current browser and test environment.
- [ ] Confirm each target is a connected DOM element and is not accidentally replaced after observation.
- [ ] Confirm the chosen root matches the viewport or nested scrollport that actually moves.
- [ ] Log `rootBounds`, `boundingClientRect`, `intersectionRect`, `intersectionRatio`, `isIntersecting`, and `time`.
- [ ] Verify the target crosses a configured threshold instead of assuming every scroll movement triggers a callback.
- [ ] Check target size, clipping, overflow ancestors, transforms, sticky headers, and reserved media dimensions.
- [ ] Verify callback code handles all entries and is idempotent.
- [ ] Check loading state, error state, and request cancellation for sentinel-triggered work.
- [ ] Use DevTools Performance and Network panels to inspect long tasks, layout shifts, duplicate requests, and overfetching.
- [ ] Test keyboard navigation, visible focus, reduced motion, zoom, small screens, and the no-JavaScript fallback.
- [ ] Confirm route changes disconnect observers and prevent late updates to disposed views.
- [ ] Test both a real browser and deterministic unit-level state transitions.

## Production Build Challenge: Visibility-Aware Resource Gallery

Build a responsive gallery that uses Intersection Observer for deferred image loading, one-shot reveals, and a “Load more” sentinel. The implementation must keep the document useful without the enhancement and must be testable in a real browser.

### Required deliverables

1. Create a semantic `<main>` with a descriptive heading, a `<section>` for the gallery, and `<figure>`/`<img>` markup for each item.
2. Give every informative image meaningful `alt` text, and use empty alt text only for decorative images.
3. Reserve image dimensions using `width` and `height` or a stable `aspect-ratio` container to avoid layout shift.
4. Use one shared observer for reveal targets that share the same root and threshold policy.
5. Unobserve each reveal target after the first successful reveal so it cannot replay on scroll reversal.
6. Keep the default content visible when JavaScript is disabled or Intersection Observer is unavailable.
7. Implement reduced-motion behavior with `prefers-reduced-motion: reduce` so nonessential reveal movement is removed.
8. Use a positive `rootMargin` for deferred images and explain why its size is appropriate for the chosen assets and network assumptions.
9. Do not lazy-load the main above-the-fold hero image; justify the loading strategy in the README or code comments.
10. Implement a sentinel that requests the next page only when the feed state is `idle` and data remains available.
11. Include `loading`, `error`, and `exhausted` states for pagination, with a retry action after a failed request.
12. Provide a keyboard-accessible “Load more” button so the feed does not depend on scrolling or observer support.
13. Announce pagination status changes with a restrained `role="status"` region without moving focus automatically.
14. Ensure all buttons and links have a visible `:focus-visible` treatment and meaningful accessible names.
15. Use `disconnect()` when the gallery view is disposed and abort any in-flight request that belongs to the disposed view.
16. Add a development-only diagnostic mode that logs target ID, intersection ratio, root bounds, and intersecting state.
17. Add unit tests for the pagination state machine, including duplicate observer notifications while a request is pending.
18. Add browser integration tests that scroll an image from outside the root margin into the effective root and verify source activation.
19. Test on a short viewport and in a nested scroll container to confirm the chosen root and root margin behave as intended.
20. Document browser support assumptions, the fallback behavior, and a method for measuring whether preloading improves perceived performance.

### Required failure and edge-case tests

- **Network failure:** Force a page request to return an error. The gallery must leave the loading state, announce the failure, and offer a working retry.
- **Duplicate notifications:** Deliver multiple intersecting entries while the request is pending. Only one page request may be active at a time.
- **Sentinel remains visible:** Use a short list and a tall viewport so the sentinel remains inside the effective root after a page append. Verify automatic page chaining is bounded and stops when `hasMore` is false.
- **No API:** Remove or mock out `IntersectionObserver`. Content must remain visible and the “Load more” button must still work.
- **Reduced motion:** Emulate the reduced-motion preference. Content must remain readable and reveal transitions must be removed.
- **Route teardown:** Dispose the gallery while a request is pending. The old response must not append items to a newly mounted gallery.
- **Image error:** Make a deferred image return 404. The page must preserve the layout and expose an appropriate fallback rather than pretending the asset loaded.
- **Root replacement:** Replace the nested scrollport element. The new instance must receive a new observer and the old observer must be disconnected.

### Definition of Done / Success Criteria

- [ ] The implementation uses a deliberate root, threshold, and root margin for each distinct behavior.
- [ ] Observer callbacks iterate batches safely and never assume one entry per callback.
- [ ] One-shot targets are unobserved and the view's observer is disconnected during teardown.
- [ ] Pagination cannot issue duplicate concurrent requests and has visible loading, error, retry, and exhausted states.
- [ ] Images reserve layout space, informative images have meaningful alt text, and the critical hero is not unnecessarily deferred.
- [ ] The no-API and no-JavaScript paths leave content readable and navigable.
- [ ] Reduced-motion users do not receive nonessential reveal motion.
- [ ] Keyboard-only users can load more results and see focus clearly.
- [ ] Unit tests cover state transitions; browser tests validate real intersection geometry.
- [ ] DevTools checks show no repeated page requests, obvious long tasks, or major layout shifts caused by deferred media.
- [ ] The code documents lifecycle ownership and does not disconnect observers owned by other modules.
- [ ] The failure and edge-case tests above pass with recorded evidence.

## Final Engineering Rules

- Use Intersection Observer to answer “has this target crossed my visibility rule?” rather than “what is its exact scroll progress?”
- Keep observer options stable and share observers where policy and ownership align.
- Treat root and root margin as product decisions; test them in the actual scroll layout.
- Separate geometric intersection from network success, media readiness, user perception, and application state.
- Use explicit state machines for pagination and other work triggered by repeated intersections.
- Keep callbacks short, make state changes idempotent, and measure the result in DevTools.
- Preserve semantic structure, visible focus, keyboard operation, and reduced-motion preferences.
- Make content available when JavaScript or the API fails; progressive enhancement should fail open.
- Test browser geometry in a real browser, not only through a mocked observer.
- Treat teardown and cancellation as part of feature correctness, not optional cleanup.
