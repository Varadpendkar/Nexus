# SKILL: critical-rendering-path
**Layer:** 27 — Browser Rendering
**Goal:** Make the browser display useful, stable content as quickly as possible by controlling the dependencies between HTML, CSS, JavaScript, fonts, images, layout, paint, and compositing.

---

## Why This Matters (Senior Perspective)
A slow critical rendering path is visible before a user can explain it: a blank viewport while CSS blocks rendering, a hero that appears late because its image is discovered through JavaScript, or a page that flashes unstyled content when CSS arrives after HTML. These failures are especially costly on campaign pages and portfolio homepages where the first viewport carries the brand impression. Senior developers trace dependencies instead of blindly minifying every asset: they identify which bytes are required for the first meaningful render, which work can wait, and which late changes cause a second layout or paint.

The practical rule is to establish a baseline, state the expected user-visible outcome, and change one cause at a time. Use DevTools and browser performance APIs as evidence, not as decoration. Test a cold visit and a repeat visit, a narrow viewport and a wide viewport, and at least one browser outside Chromium when compatibility matters. A creative portfolio can have an ambitious visual identity without forcing the first useful content to wait for every effect, font, and analytics request.

---

## Core Concepts

### 1. The rendering pipeline and its boundaries
The browser parses HTML into a DOM, parses CSS into a CSSOM, combines relevant structure and styles into a render tree, computes layout, paints display items, and composites layers. Real engines overlap stages and may skip work when a change does not affect earlier stages. Treat the pipeline as a diagnostic model, not a promise that every update executes every stage.

**Practical consequence:** A class change that alters font size can invalidate layout and paint; changing only opacity can often reuse existing layout and paint output.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:1:the-rendering-pipeline-and-its-boundaries";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** A class change that alters font size can invalidate layout and paint; changing only opacity can often reuse existing layout and paint output. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 2. Resource discovery and dependency graphs
The preload scanner can discover ordinary HTML resources while the main parser is busy, but resources hidden behind CSS imports, JavaScript insertion, or CSS background declarations may be discovered later. Earlier discovery matters when the resource is needed for the first viewport.

**Practical consequence:** Use ordinary HTML image markup for a key hero image where possible; avoid requiring a large application bundle to insert the only visible image.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:2:resource-discovery-and-dependency-graphs";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use ordinary HTML image markup for a key hero image where possible; avoid requiring a large application bundle to insert the only visible image. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 3. Parser-blocking scripts
Classic scripts without async or defer can pause HTML parsing while fetched and executed. defer scripts download in parallel and execute after parsing in document order; async scripts execute when ready and do not preserve order.

**Practical consequence:** Do not use async for a script that depends on another script's initialization order.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:3:parser-blocking-scripts";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Do not use async for a script that depends on another script's initialization order. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 4. Render-blocking CSS
Stylesheets in the document head commonly block rendering until the browser can determine how content should look. CSS is not automatically bad; a small, promptly delivered stylesheet can prevent an ugly flash and layout correction.

**Practical consequence:** Keep first-viewport styles easy to discover, avoid chains of @import, and split non-critical styling only when the fallback remains acceptable.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:4:render-blocking-css";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Keep first-viewport styles easy to discover, avoid chains of @import, and split non-critical styling only when the fallback remains acceptable. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 5. Critical CSS and the cost of inlining
Inlining a small amount of above-the-fold CSS can remove a request dependency, but it duplicates bytes across pages and can delay HTML delivery if it becomes large. A critical CSS budget should be measured, not guessed.

**Practical consequence:** Inline only the rules required for the first meaningful viewport and load the rest through a normal stylesheet link.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:5:critical-css-and-the-cost-of-inlining";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Inline only the rules required for the first meaningful viewport and load the rest through a normal stylesheet link. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 6. JavaScript execution and main-thread contention
Downloading JavaScript is only one cost. Parsing, compiling, executing, hydration, event handlers, and third-party tags can occupy the main thread and delay input, style calculation, and paint.

**Practical consequence:** Use code splitting and defer non-essential work; do not move every script earlier just because the network is fast.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:6:javascript-execution-and-main-thread-contention";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use code splitting and defer non-essential work; do not move every script earlier just because the network is fast. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 7. Layout, paint, and compositing dependencies
Layout calculates geometry; paint records visual output; compositing combines layers. A layout-affecting change may trigger downstream work, while some transform and opacity updates can be handled without re-running full layout.

**Practical consequence:** Use performance traces to confirm the stage affected rather than assuming a CSS property is always cheap.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:7:layout,-paint,-and-compositing-dependencies";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use performance traces to confirm the stage affected rather than assuming a CSS property is always cheap. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 8. First Contentful Paint and Largest Contentful Paint
FCP measures when any eligible content first appears. LCP identifies when the largest eligible content in the viewport is rendered. A fast tiny logo does not prove that the hero image or headline is fast.

**Practical consequence:** Identify the actual LCP element in the page and optimize its discovery, transfer, decode, and render dependencies.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:8:first-contentful-paint-and-largest-contentful-paint";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Identify the actual LCP element in the page and optimize its discovery, transfer, decode, and render dependencies. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 9. Network priority and contention
The browser schedules requests based on discovery, type, hints, and its own prioritization logic. Excessive preloads can compete with the hero resource; priority hints influence scheduling but are not a guarantee.

**Practical consequence:** Reserve high priority for genuinely important resources, and check the Network panel to see whether the browser's actual order matches intent.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:9:network-priority-and-contention";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Reserve high priority for genuinely important resources, and check the Network panel to see whether the browser's actual order matches intent. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 10. Hydration and server-rendered HTML
Server-rendered content can appear before client JavaScript hydrates it, but hydration work can still block responsiveness or cause visual mismatches. Client-only rendering may hide meaningful content until JavaScript executes.

**Practical consequence:** Render core content in HTML when feasible and ensure hydration produces the same initial structure.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:10:hydration-and-server-rendered-html";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Render core content in HTML when feasible and ensure hydration produces the same initial structure. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 11. Long tasks and rendering opportunities
A long main-thread task can prevent the browser from responding to input or reaching a rendering opportunity. A page may have downloaded all resources and still feel frozen because synchronous work monopolizes the main thread.

**Practical consequence:** Break expensive work into smaller tasks, yield when appropriate, and avoid synchronous processing of large datasets during startup.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:11:long-tasks-and-rendering-opportunities";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Break expensive work into smaller tasks, yield when appropriate, and avoid synchronous processing of large datasets during startup. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 12. Measurement and causal debugging
Use field metrics to understand real users and lab traces to isolate causes. A single Lighthouse run is a clue, not a universal truth; cache state, CPU throttling, network conditions, and third-party variability change results.

**Practical consequence:** Record conditions and compare multiple runs before attributing a change to one optimization.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "critical-rendering-path:12:measurement-and-causal-debugging";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Record conditions and compare multiple runs before attributing a change to one optimization. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern: Server-rendered first viewport
What it does: Delivers meaningful text and structure before client application code finishes. Use when: The page has public content, marketing copy, article text, or a hero that should remain useful on slow JavaScript.

```html
<main>
  <section aria-labelledby="hero-title">
    <h1 id="hero-title">Design systems that ship faster</h1>
    <p>Build consistent interfaces without delaying the first useful view.</p>
    <a href="/work">Explore selected work</a>
  </section>
</main>
<script type="module" src="/assets/enhancements.js"></script>
```

### Pattern: Defer non-critical behavior
What it does: Keeps optional interaction code from blocking initial HTML parsing. Use when: Analytics enhancements, secondary widgets, or non-essential UI can initialize after the document is parsed.

```html
<script defer src="/assets/site-navigation.js"></script>
<script async src="https://analytics.example.invalid/collect.js"></script>
<!-- Keep async only when execution order is independent. -->
```

### Pattern: Critical image discovery
What it does: Makes a visible hero image discoverable in HTML and gives the browser a clear priority signal. Use when: The hero image is the LCP candidate and traces show late discovery.

```html
<img
  src="/images/studio-hero-1280.avif"
  srcset="/images/studio-hero-640.avif 640w, /images/studio-hero-1280.avif 1280w"
  sizes="(max-width: 700px) 100vw, 60vw"
  fetchpriority="high"
  width="1280"
  height="800"
  alt="A sunlit design studio with a large worktable">
```

### Pattern: Measure a named phase
What it does: Adds meaningful timing marks around a startup phase. Use when: You need to separate initialization cost from network delay in a repeatable trace.

```js
performance.mark("app-enhancement-start");
// Initialize only the interaction layer; the server-rendered content is already usable.
initializeNavigationEnhancements();
performance.mark("app-enhancement-end");
performance.measure("app-enhancement", "app-enhancement-start", "app-enhancement-end");
console.table(performance.getEntriesByName("app-enhancement").map(({ name, duration }) => ({ name, duration })));
```

### Pattern: Conditional enhancement
What it does: Loads expensive functionality only after a clear user action or need. Use when: A 3D viewer, map, or video player is below the fold and not required for initial content.

```js
const launchButton = document.querySelector("[data-launch-viewer]");
launchButton?.addEventListener("click", async () => {
  launchButton.disabled = true;
  try {
    const { mountViewer } = await import("./product-viewer.js");
    await mountViewer(document.querySelector("#product-viewer"));
  } catch (error) {
    console.error("The optional viewer could not be loaded.", error);
    launchButton.disabled = false;
  }
});
```

### Pattern: Avoid stylesheet request chains
What it does: Removes serial discovery dependencies from critical CSS. Use when: A waterfall shows the main stylesheet importing additional required stylesheets.

```js
/* main.css */
/* Keep critical rules directly in the stylesheet rather than chaining @import requests. */
@layer reset, tokens, layout, components;
@import url("./reset.css"); /* Prefer bundling critical CSS at build time for production. */
```

### Pattern: Baseline-to-regression workflow
What it does: Keeps the critical rendering path improvement measurable after code changes. Use when: A team ships repeated visual updates or adds third-party assets.

```js
function summarizeResources() {
  const resources = performance.getEntriesByType('resource');
  const summary = resources.map((resource) => ({
    name: resource.name.split('/').pop(),
    durationMs: Math.round(resource.duration),
    transferBytes: resource.transferSize
  }));
  console.table(summary);
  return summary;
}
summarizeResources();
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| A. Optimizing before measuring | The visible symptom is mistaken for its cause. | Record a baseline trace with fixed viewport, cache, and throttling. |
| B. Preloading every possible asset | Hints are treated as commands without opportunity cost. | Keep only hints supported by a request waterfall and remove unused ones. |
| C. Ignoring mobile hardware | Desktop GPU and CPU hide memory and frame-time limits. | Profile a representative mid-range mobile device and reduce surface area. |
| D. Assuming JavaScript download equals startup cost | Parsing, execution, hydration, and layout are omitted from the mental model. | Inspect the main-thread flame chart and split expensive startup work. |
| E. Treating transform as free | Large layers and blending can still cost GPU memory and time. | Measure compositing and raster activity with the actual element size. |
| F. Hiding text until fonts load | Visual consistency is prioritized over readable initial content. | Use a readable fallback and tune font metrics to reduce shift. |
| G. Using an inaccurate fallback font | Different glyph widths cause headings and navigation to reflow. | Compare representative strings and use metric overrides where supported. |
| H. Loading all font weights | Every declared face is assumed to be needed immediately. | Audit actual usage and preload only one verified critical file. |
| I. Adding preconnects to many domains | Connection setup savings seem free. | Restrict preconnect to critical early origins and use lighter hints for later ones. |
| J. Preloading a different responsive image | The preload URL does not match the selected srcset candidate. | Use responsive preload attributes where supported and verify candidate reuse. |
| K. Reading geometry after each style write | The code accidentally forces synchronous layout repeatedly. | Batch all reads first, then perform the writes in one phase. |
| L. Using a single Lighthouse run as proof | Run variance and cache differences distort conclusions. | Repeat runs and compare stable distributions under documented conditions. |
| M. Ignoring layout shifts after optimization | A faster first paint is accepted even if content jumps later. | Inspect CLS and test late image, font, and hydration arrival. |
| N. Forgetting non-Chromium engines | Chromium-specific behavior is assumed universal. | Reproduce critical issues in Safari and Firefox and record versions. |
| O. Leaving debug instrumentation in hot paths | Logging and observers add overhead to the thing being measured. | Gate diagnostics behind development flags and remove them from production. |

---

## Mental Models

1. **Discovery before delivery** — a resource cannot help the first render until the browser knows it is needed.
2. **Dependencies create delay** — a chain of required work is often more expensive than the same bytes delivered in parallel.
3. **Rendering is a pipeline, not a single event** — network completion, DOM readiness, paint, and interactivity are different milestones.
4. **Every hint spends a priority budget** — making one request earlier can make another critical request later.
5. **Layout is shared geometry** — one measurement or style mutation can affect more than the element that appears in the code.
6. **A layer trades CPU work for memory and GPU work** — promotion is a measured choice, not a universal optimization.
7. **Readable fallback beats invisible perfection** — content should remain useful while custom resources arrive or fail.
8. **A trace is a hypothesis tester** — it helps locate a cause; it does not automatically explain the product impact.
9. **Lab and field data answer different questions** — controlled traces isolate causes; real-user data shows the distribution of outcomes.
10. **Correctness survives without hints** — preload and priority are advisory, so ordinary markup must still work.

---

## Quick Reference

| Situation | First check | Preferred action | Watch out for |
|---|---|---|---|
| Blank first viewport | Render-blocking CSS and scripts | Reduce critical dependencies | FOUC after over-splitting CSS |
| Late hero image | Resource discovery and priority | HTML image markup and measured priority | Duplicate preload candidate |
| Slow interaction | Long tasks and event handlers | Split work and reduce main-thread occupancy | Hiding latency with spinners |
| Repeated layout | Layout events and call stacks | Batch reads and writes | Stale geometry |
| Large repaint | Paint flashing and invalidation | Bound effect area or change strategy | Shadow and filter cost |
| Janky transform animation | Frame and raster tracks | Reduce layer size and profile GPU | Excess layer memory |
| Font flash | Font request and font-display | Readable fallback plus tuned metrics | Unsupported glyphs |
| Font duplicate request | URL and CORS mode | Match preload and CSS request | crossorigin mismatch |
| Third-party delay | Connection and request waterfall | One critical preconnect or DNS hint | Unused open connections |
| Mobile-only slowdown | Device CPU/GPU and DPR | Reduce work and test on device | Desktop-only conclusions |
| Layout shift after load | CLS entries and font/image dimensions | Reserve dimensions and tune fallback | Late hydration mismatch |
| Browser-specific bug | Engine/version differences | Test Safari, Firefox, Chromium | Unsupported assumptions |
| Unstable benchmark | Cache, CPU, network variance | Repeat and compare distributions | Single-run overconfidence |
| Optional 3D delays page | Startup import graph | Lazy-load on intent or visibility | Heavy code loaded too early |
| Regression after launch | Field metrics and traces | Add budget and monitor release | Lab score as sole KPI |

---

## Build Challenge
Build a production-style landing page that demonstrates critical rendering path decisions for a creative studio portfolio. The challenge must include a real failure case: start with a deliberately poor implementation, capture the evidence, fix the root cause, and demonstrate that the improvement did not break readability, layout stability, or browser compatibility.

### Numbered requirements

1. Create semantic HTML with a meaningful heading, primary navigation, main content, and a visible hero.
2. Set explicit width and height or aspect ratio for major images to reserve geometry.
3. Record a repeatable baseline with viewport, cache state, CPU/network settings, and browser version.
4. Identify the actual first-viewport critical resources using the Network panel.
5. Capture a Performance trace during both page load and one interactive action.
6. Explain which dependency or rendering stage causes the initial failure.
7. Implement one focused optimization and document why it addresses the measured cause.
8. Test a slow-network scenario and confirm core content remains readable.
9. Test a narrow mobile viewport and check resource selection and frame behavior.
10. Test keyboard access and screen-reader semantics; performance must not remove accessibility.
11. Check focus-visible styling on interactive controls and retain visible focus.
12. Respect prefers-reduced-motion for any animated transition included in the page.
13. Repeat the original measurement with the same conditions and compare the targeted metric.
14. Check for CLS, console errors, duplicate requests, and unnecessary preloads after the change.
15. Write a short regression checklist that another developer can repeat.

### Required failure scenario

After the first successful run, introduce a regression deliberately. Depending on the skill, use a hero image discovered only after JavaScript executes, a style read/write loop that forces repeated layout, a costly shadow animation, a font preload with a mismatched URL or request mode, or excessive preconnect/preload hints. Capture the failure, explain its trace signature, fix the specific cause, and rerun the same test. A submission that only builds a page without diagnosing a regression is incomplete.

### Definition of done

- [ ] The page displays meaningful content before optional enhancements finish.
- [ ] The critical resource list is short, justified, and confirmed in DevTools.
- [ ] The primary failure is reproduced and documented before it is fixed.
- [ ] The fix improves the targeted measure without creating duplicate downloads.
- [ ] The page remains readable if a font, hint, or optional script is ignored.
- [ ] No unexpected layout shift appears when images, fonts, or scripts arrive.
- [ ] Keyboard navigation, visible focus, semantic landmarks, and reduced-motion behavior remain intact.
- [ ] The result is checked in Chromium and at least one of Safari or Firefox where available.
- [ ] Before/after conditions are identical and the comparison is recorded.
- [ ] A regression checklist is included for future changes.

---

## Browser Support and Debug Notes

Resource prioritization and rendering diagnostics evolve across browser releases. `fetchpriority`, responsive preload attributes, font metric overrides, PerformanceObserver entry types, and rendering-tool labels may differ by engine or version. Treat unsupported hints as a graceful no-op; do not make essential content depend on them. Check current compatibility data such as MDN and Can I Use when adopting a newer feature, then test the actual target browsers. Safari, Firefox, and Chromium-based browsers can make different scheduling and compositing decisions even when standards-based markup is shared.

Use DevTools deliberately: Network for discovery and request reuse, Performance for main-thread and rendering activity, Rendering tools for paint flashing and layer borders, and the console for targeted diagnostics. `getComputedStyle()` and `getBoundingClientRect()` are useful but can force style or layout work when called at the wrong time. Keep debug helpers outside production hot paths. The examples use semantic HTML, meaningful names, error handling where a resource can fail, keyboard access, focus-visible styles, and reduced-motion fallbacks because performance work must not make the interface less usable.

## Final Review Checklist

- [ ] Topic-specific failure modes are explained rather than replaced with generic performance advice.
- [ ] Code examples use valid browser APIs and real resource attributes.
- [ ] Every named pattern states what it does, when to use it, and provides code.
- [ ] Mistake fixes are distinct and actionable.
- [ ] The challenge tests a real failure and requires before/after evidence.
- [ ] The implementation remains resilient when hints are ignored or resources fail.
