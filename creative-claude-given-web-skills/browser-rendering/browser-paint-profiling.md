# SKILL: browser-paint-profiling
**Layer:** 27 — Browser Rendering
**Goal:** Use browser developer tools and repeatable traces to identify which rendering stage causes slow first paint, scrolling jank, expensive animations, and large repaint regions.

---

## Why This Matters (Senior Perspective)
A screenshot cannot tell you why a page is slow. The same visible delay might come from a late network response, JavaScript blocking the main thread, style recalculation, layout thrashing, image decoding, rasterization, or GPU contention. Guessing often produces cosmetic code changes with no measurable improvement. Profiling skill means setting up a repeatable test, capturing evidence, locating the dominant cost, changing one cause, and proving the result under the same conditions.

The practical rule is to establish a baseline, state the expected user-visible outcome, and change one cause at a time. Use DevTools and browser performance APIs as evidence, not as decoration. Test a cold visit and a repeat visit, a narrow viewport and a wide viewport, and at least one browser outside Chromium when compatibility matters. A creative portfolio can have an ambitious visual identity without forcing the first useful content to wait for every effect, font, and analytics request.

---

## Core Concepts

### 1. Choose a measurable symptom
Translate vague reports such as 'the hero feels late' into a metric or trace question: when is LCP, which task blocks input, or which frame exceeds the budget?

**Practical consequence:** Write down the target and test conditions before opening DevTools.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:1:choose-a-measurable-symptom";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Write down the target and test conditions before opening DevTools. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 2. Use the Performance panel
Record a page load or interaction and inspect the main-thread track, network activity, screenshots, layout events, paint events, and long tasks. Track names vary somewhat by browser version.

**Practical consequence:** Capture the interaction that reproduces the issue, not just a fresh page load.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:2:use-the-performance-panel";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Capture the interaction that reproduces the issue, not just a fresh page load. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 3. Separate network from CPU delay
A resource can be late because it was discovered late, queued behind higher-priority requests, transferred slowly, or decoded after transfer. A CPU bottleneck has a different trace signature.

**Practical consequence:** Compare request timing with main-thread activity and resource decode events.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:3:separate-network-from-cpu-delay";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Compare request timing with main-thread activity and resource decode events. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 4. Inspect layout and style events
Repeated Recalculate Style or Layout work around event handlers can indicate broad invalidation or forced synchronous layout. One layout event is not automatically a bug.

**Practical consequence:** Expand call stacks and identify the JavaScript or style change that initiated the work.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:4:inspect-layout-and-style-events";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Expand call stacks and identify the JavaScript or style change that initiated the work. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 5. Interpret paint and raster activity
Paint flashing and rendering diagnostics can show regions that repaint. Raster work may be distributed across threads, so inspect the whole trace rather than only the main-thread flame chart.

**Practical consequence:** Check whether a small interaction invalidates a huge region.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:5:interpret-paint-and-raster-activity";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Check whether a small interaction invalidates a huge region. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 6. Frame budget and dropped frames
At 60 Hz a frame interval is about 16.7 ms, but the browser must share that time with input, style, layout, paint, and compositing. Higher refresh-rate screens have less time per frame.

**Practical consequence:** Use frame tracks and long-frame markers; do not treat 16.7 ms as a universal deadline for all devices.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:6:frame-budget-and-dropped-frames";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use frame tracks and long-frame markers; do not treat 16.7 ms as a universal deadline for all devices. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 7. Lighthouse and lab variability
Lab audits are useful for repeatable scenarios but can vary with CPU, cache, server, extensions, and third-party scripts. Field data captures real distributions and real-user conditions.

**Practical consequence:** Use multiple runs and compare medians or distributions rather than celebrating one unusually good score.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:7:lighthouse-and-lab-variability";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use multiple runs and compare medians or distributions rather than celebrating one unusually good score. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 8. Chrome DevTools rendering tools
Paint flashing, layer borders, FPS meter, and performance recordings reveal different symptoms. Availability and labels can change between Chromium versions.

**Practical consequence:** Choose the tool that answers a specific question and disable overlays before final screenshots.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:8:chrome-devtools-rendering-tools";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Choose the tool that answers a specific question and disable overlays before final screenshots. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 9. Safari and Firefox diagnostics
Safari Web Inspector and Firefox Performance tools provide their own timelines and rendering diagnostics. Chromium-only traces do not prove that another engine behaves identically.

**Practical consequence:** Reproduce serious rendering bugs in the target browser and record engine/version.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:9:safari-and-firefox-diagnostics";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Reproduce serious rendering bugs in the target browser and record engine/version. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 10. Instrument a targeted interaction
Use Performance marks and measures around application phases or interactions when the browser trace alone lacks useful boundaries.

**Practical consequence:** Keep marks descriptive and avoid adding heavy logging to hot paths.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:10:instrument-a-targeted-interaction";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Keep marks descriptive and avoid adding heavy logging to hot paths. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 11. Compare before and after
Keep viewport, throttling, cache state, data, and interaction sequence constant. A performance fix should reduce the targeted work without introducing a layout shift or regression elsewhere.

**Practical consequence:** Export traces or write down baseline measurements so the result is auditable.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:11:compare-before-and-after";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Export traces or write down baseline measurements so the result is auditable. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 12. Turn findings into a regression check
Once the root cause is known, add a test, performance budget, or reproducible checklist to catch regressions. Synthetic metrics need interpretation; they do not replace user-centric review.

**Practical consequence:** Set budgets around important user journeys and monitor field performance after release.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "browser-paint-profiling:12:turn-findings-into-a-regression-check";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Set budgets around important user journeys and monitor field performance after release. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern: Reproducible recording checklist
What it does: Creates comparable traces. Use when: A performance bug is intermittent or depends on cache and viewport.

```js
const testConditions = {
  viewport: "1440x900",
  cache: "warm",
  network: "Fast 3G",
  cpu: "4x slowdown",
  action: "Open navigation, then scroll to project grid"
};
console.table(Object.entries(testConditions).map(([condition, value]) => ({ condition, value })));
```

### Pattern: Add performance marks
What it does: Names a meaningful app phase in the browser timeline. Use when: A flame chart lacks product-specific boundaries.

```js
performance.mark("filter-update-start");
renderFilteredProjects();
performance.mark("filter-update-end");
performance.measure("project-filter-update", "filter-update-start", "filter-update-end");
console.table(performance.getEntriesByName("project-filter-update").map((entry) => ({
  durationMs: entry.duration,
  startMs: entry.startTime
})));
```

### Pattern: Observe long tasks defensively
What it does: Records main-thread tasks that exceed the long-task threshold where supported. Use when: Input feels delayed despite low network time.

```js
if ("PerformanceObserver" in window) {
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const task of list.getEntries()) {
        console.warn("Long task detected", {
          startTime: task.startTime,
          duration: task.duration
        });
      }
    });
    longTaskObserver.observe({ type: "longtask", buffered: true });
  } catch {
    console.info("This browser does not expose long-task observation.");
  }
}
```

### Pattern: Isolate the target interaction
What it does: Marks the start and end of a user action without logging every event. Use when: A menu or filter is the only interaction that janks.

```js
const filterForm = document.querySelector("#project-filter");
filterForm?.addEventListener("change", () => {
  performance.mark("project-filter-interaction");
  // Reproduce the same filter state during each recording.
  applyProjectFilters();
  requestAnimationFrame(() => performance.mark("project-filter-next-frame"));
});
```

### Pattern: Compare paint invalidation
What it does: Uses a targeted CSS state change to determine whether an effect expands repaint area. Use when: A shadow or backdrop effect causes unexpected paint cost.

```js
const previewCard = document.querySelector(".preview-card");
previewCard?.addEventListener("pointerenter", () => previewCard.classList.add("is-previewing"));
previewCard?.addEventListener("pointerleave", () => previewCard.classList.remove("is-previewing"));
/* Record this exact hover in DevTools with Paint Flashing enabled. */
```

### Pattern: Safe debug helper
What it does: Reports key geometry and computed styles in one structured snapshot. Use when: A rendering trace points to a layout-sensitive component.

```js
function inspectRenderingElement(selector) {
  const element = document.querySelector(selector);
  if (!element) return console.warn(`No element matches ${selector}`);
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  console.table([{
    selector, width: rect.width, height: rect.height,
    display: style.display, position: style.position,
    transform: style.transform, contain: style.contain
  }]);
}
inspectRenderingElement(".project-card");
```

### Pattern: Baseline-to-regression workflow
What it does: Keeps the browser paint profiling improvement measurable after code changes. Use when: A team ships repeated visual updates or adds third-party assets.

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
Build a production-style landing page that demonstrates browser paint profiling decisions for a creative studio portfolio. The challenge must include a real failure case: start with a deliberately poor implementation, capture the evidence, fix the root cause, and demonstrate that the improvement did not break readability, layout stability, or browser compatibility.

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
