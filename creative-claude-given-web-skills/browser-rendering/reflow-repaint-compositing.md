# SKILL: reflow-repaint-compositing
**Layer:** 27 — Browser Rendering
**Goal:** Predict and reduce the rendering work caused by DOM and CSS updates, using layout, paint, and compositing diagnostics instead of blanket performance rules.

---

## Why This Matters (Senior Perspective)
Production interfaces often stutter for reasons that are invisible in source code: reading geometry after writing styles forces synchronous layout, a shadow animation repaints a large area on every frame, or too many promoted layers consume memory on mobile GPUs. A page can pass a static visual review and still hitch while a menu opens, a dashboard filters, or a portfolio card follows the pointer. The goal is not to avoid every layout or paint; it is to choose the right update strategy for the visual effect and verify its cost in a trace.

The practical rule is to establish a baseline, state the expected user-visible outcome, and change one cause at a time. Use DevTools and browser performance APIs as evidence, not as decoration. Test a cold visit and a repeat visit, a narrow viewport and a wide viewport, and at least one browser outside Chromium when compatibility matters. A creative portfolio can have an ambitious visual identity without forcing the first useful content to wait for every effect, font, and analytics request.

---

## Core Concepts

### 1. Layout invalidation
Layout determines element geometry and relationships. Changes to width, font metrics, content, or flow position may invalidate layout for the changed node and related ancestors or descendants.

**Practical consequence:** Prefer an intentional single layout update over repeated geometry mutations across many frames.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:1:layout-invalidation";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Prefer an intentional single layout update over repeated geometry mutations across many frames. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 2. Paint invalidation
Paint records colors, borders, text, shadows, and other visual details. A change can repaint without changing geometry, but large painted regions and expensive effects can still cost time.

**Practical consequence:** Measure repaint regions and avoid animating a large blur across the entire viewport.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:2:paint-invalidation";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Measure repaint regions and avoid animating a large blur across the entire viewport. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 3. Compositing and layers
The compositor combines rasterized layers and can update certain transforms or opacity changes efficiently. Layer promotion is a trade-off: it can reduce repeated painting but increases memory and management costs.

**Practical consequence:** Do not add will-change to every card; apply it narrowly and remove it when the effect ends.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:3:compositing-and-layers";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Do not add will-change to every card; apply it narrowly and remove it when the effect ends. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 4. Forced synchronous layout
A write followed by a geometry read may force the browser to calculate pending layout immediately so JavaScript can return an accurate measurement. Repeating this in a loop creates layout thrashing.

**Practical consequence:** Batch reads first and writes second, or measure once and apply a single coordinated update.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:4:forced-synchronous-layout";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Batch reads first and writes second, or measure once and apply a single coordinated update. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 5. Read/write batching
Separate DOM measurement from DOM mutation so the browser can coalesce work. A frame scheduler can collect reads, then writes, and keep visual updates predictable.

**Practical consequence:** Use a requestAnimationFrame callback for coordinated visual work, not as a magic fix for expensive calculations.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:5:read/write-batching";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use a requestAnimationFrame callback for coordinated visual work, not as a magic fix for expensive calculations. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 6. Transform-based motion
Transforms change the visual coordinate system without changing normal-flow geometry. They are often suitable for movement and scale, though filters, blending, and large layers may still be costly.

**Practical consequence:** Use translate/scale for visual movement when the layout should remain unchanged.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:6:transform-based-motion";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use translate/scale for visual movement when the layout should remain unchanged. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 7. Opacity and layer cost
Opacity can be compositor-friendly when the element is already rasterized, but translucent layers may require extra blending and memory. Large text or image surfaces can still be expensive.

**Practical consequence:** Fade a bounded element rather than an enormous full-screen layer when the design allows it.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:7:opacity-and-layer-cost";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Fade a bounded element rather than an enormous full-screen layer when the design allows it. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 8. Containment and content visibility
CSS containment can limit the scope of layout, paint, or style work. content-visibility can skip rendering work for off-screen content, but intrinsic sizing and accessibility expectations must be considered.

**Practical consequence:** Apply containment only when component boundaries are real and test scroll jumps, find-in-page, and focus behavior.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:8:containment-and-content-visibility";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Apply containment only when component boundaries are real and test scroll jumps, find-in-page, and focus behavior. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 9. Animation property selection
Properties have different rendering costs, but actual behavior depends on the browser, effect, element size, and surrounding CSS. A blanket rule that transform is always free is wrong.

**Practical consequence:** Prototype the intended effect and inspect the Performance panel on representative hardware.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:9:animation-property-selection";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Prototype the intended effect and inspect the Performance panel on representative hardware. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 10. DOM size and update scope
Large DOM trees increase style, layout, memory, and accessibility-tree costs. Frequent framework renders can also trigger DOM changes that invalidate rendering work.

**Practical consequence:** Virtualize genuinely long collections and keep component updates scoped to the data that changed.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:10:dom-size-and-update-scope";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Virtualize genuinely long collections and keep component updates scoped to the data that changed. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 11. Resize and scroll event pressure
Scroll and resize can fire frequently. Handlers that measure and mutate layout on every event can create jank and compete with scrolling.

**Practical consequence:** Use passive listeners where appropriate, throttle non-visual work, and schedule visual writes coherently.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:11:resize-and-scroll-event-pressure";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use passive listeners where appropriate, throttle non-visual work, and schedule visual writes coherently. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 12. GPU and mobile constraints
Compositing uses GPU resources and memory; large high-DPI layers can be costly even if the main thread is quiet. Battery, thermal throttling, and memory pressure matter on mobile.

**Practical consequence:** Cap visual complexity, avoid giant offscreen layers, and profile on a mid-range mobile device.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "reflow-repaint-compositing:12:gpu-and-mobile-constraints";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Cap visual complexity, avoid giant offscreen layers, and profile on a mid-range mobile device. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern: Read then write
What it does: Groups measurements before mutations to avoid forced synchronous layout. Use when: Updating multiple cards or rows from measured dimensions.

```js
const cards = [...document.querySelectorAll(".project-card")];
const widths = cards.map((card) => card.getBoundingClientRect().width);
// All geometry reads happen before any style writes.
cards.forEach((card, index) => {
  card.style.setProperty("--measured-card-width", `${widths[index]}px`);
});
```

### Pattern: Transform-based entrance
What it does: Moves an element visually without changing document flow. Use when: A card or menu should slide into place without pushing siblings.

```js
.project-card {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 220ms ease-out, transform 220ms ease-out;
}
.project-card.is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .project-card { transition: none; transform: none; }
}
```

### Pattern: Narrow will-change lifetime
What it does: Hints that a property will change shortly, while avoiding permanent layer promotion. Use when: Profiling confirms a specific repeated animation benefits from preparation.

```js
const galleryCard = document.querySelector(".gallery-card");
galleryCard?.addEventListener("pointerenter", () => {
  galleryCard.style.willChange = "transform";
});
galleryCard?.addEventListener("transitionend", (event) => {
  if (event.propertyName === "transform") galleryCard.style.willChange = "auto";
});
```

### Pattern: Coalesced visual updates
What it does: Schedules visual writes for a rendering opportunity. Use when: Pointer movement updates a decorative element on every event.

```js
const cursorGlow = document.querySelector(".cursor-glow");
let latestX = 0;
let latestY = 0;
let framePending = false;
document.addEventListener("pointermove", (event) => {
  latestX = event.clientX;
  latestY = event.clientY;
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(() => {
    cursorGlow?.style.setProperty("--cursor-x", `${latestX}px`);
    cursorGlow?.style.setProperty("--cursor-y", `${latestY}px`);
    framePending = false;
  });
}, { passive: true });
```

### Pattern: Off-screen content containment
What it does: Skips much rendering work for distant content while preserving a size estimate. Use when: A long editorial page contains many independent sections below the fold.

```js
.case-study-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 720px;
}
/* Verify scroll position, find-in-page, and focus behavior on real content. */
```

### Pattern: Profile before layer promotion
What it does: Makes layer decisions based on evidence. Use when: An animation looks smooth on desktop but causes memory pressure on mobile.

```js
function summarizeLongTasks(entries) {
  console.table(entries.map((entry) => ({
    startTime: Math.round(entry.startTime),
    duration: Math.round(entry.duration),
    name: entry.name
  })));
}
if ("PerformanceObserver" in window) {
  const observer = new PerformanceObserver((list) => summarizeLongTasks(list.getEntries()));
  try { observer.observe({ type: "longtask", buffered: true }); }
  catch (error) { console.info("Long-task entries are unavailable in this browser.", error); }
}
```

### Pattern: Baseline-to-regression workflow
What it does: Keeps the reflow repaint compositing improvement measurable after code changes. Use when: A team ships repeated visual updates or adds third-party assets.

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
Build a production-style landing page that demonstrates reflow repaint compositing decisions for a creative studio portfolio. The challenge must include a real failure case: start with a deliberately poor implementation, capture the evidence, fix the root cause, and demonstrate that the improvement did not break readability, layout stability, or browser compatibility.

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
