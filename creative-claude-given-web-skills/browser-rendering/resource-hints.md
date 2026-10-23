# SKILL: resource-hints
**Layer:** 27 — Browser Rendering
**Goal:** Use preload, preconnect, dns-prefetch, and fetchpriority selectively to improve discovery and scheduling of genuinely critical browser resources without creating request contention.

---

## Why This Matters (Senior Perspective)
Resource hints are powerful because they influence what the browser does before ordinary discovery would have reached a resource. They are also easy to misuse: preloading several fonts can compete with the LCP image, preconnecting to many origins spends connection resources, and a preload URL that differs from the eventual request can download the same bytes twice. On a high-impact landing page, hints should express a small, evidence-backed priority plan—not a list of every asset that might be useful.

The practical rule is to establish a baseline, state the expected user-visible outcome, and change one cause at a time. Use DevTools and browser performance APIs as evidence, not as decoration. Test a cold visit and a repeat visit, a narrow viewport and a wide viewport, and at least one browser outside Chromium when compatibility matters. A creative portfolio can have an ambitious visual identity without forcing the first useful content to wait for every effect, font, and analytics request.

---

## Core Concepts

### 1. Hint types and intent
dns-prefetch resolves a hostname; preconnect may perform DNS, TCP, and TLS setup; preload fetches a known current-navigation resource early; prefetch is a lower-priority hint for likely future navigation in supported contexts.

**Practical consequence:** Pick the hint based on the bottleneck and how certain the resource is to be used.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:1:hint-types-and-intent";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Pick the hint based on the bottleneck and how certain the resource is to be used. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 2. Preload versus ordinary discovery
Preload is useful when the browser can identify a critical resource early but normal discovery would find it late, such as a CSS background image. It is less useful when the resource is already discovered promptly in HTML.

**Practical consequence:** Confirm late discovery in the waterfall before adding a preload.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:2:preload-versus-ordinary-discovery";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Confirm late discovery in the waterfall before adding a preload. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 3. Correct as and crossorigin
The as attribute tells the browser the destination resource type and helps apply appropriate priority and request behavior. Fonts commonly require crossorigin even when same-origin.

**Practical consequence:** Match the eventual request's URL, credentials mode, and resource type to avoid duplicate downloads.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:3:correct-as-and-crossorigin";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Match the eventual request's URL, credentials mode, and resource type to avoid duplicate downloads. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 4. Preconnect budget
Preconnect can save setup time for a critical third-party origin, but each open connection has a cost and may be wasted if the origin is never used.

**Practical consequence:** Use only for origins needed very early, such as a critical font or image CDN.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:4:preconnect-budget";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use only for origins needed very early, such as a critical font or image CDN. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 5. dns-prefetch as a lighter hint
DNS prefetch can be useful for likely future third-party connections when a full preconnect is too expensive or unnecessary.

**Practical consequence:** Do not add it indiscriminately for dozens of analytics and embed hosts.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:5:dns-prefetch-as-a-lighter-hint";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Do not add it indiscriminately for dozens of analytics and embed hosts. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 6. fetchpriority and image priority
fetchpriority can influence how the browser prioritizes a resource, but it does not guarantee a particular schedule. Use high priority only for a true critical image or fetch.

**Practical consequence:** Pair priority with prompt discovery and correct markup; priority cannot fix a resource hidden behind late JavaScript.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:6:fetchpriority-and-image-priority";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Pair priority with prompt discovery and correct markup; priority cannot fix a resource hidden behind late JavaScript. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 7. LCP image strategy
A hero image may benefit from eager discovery and high fetch priority. Native lazy loading is usually inappropriate for an image visible at initial load.

**Practical consequence:** Use responsive srcset and sizes so the prioritized image is also the right size for the viewport.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:7:lcp-image-strategy";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use responsive srcset and sizes so the prioritized image is also the right size for the viewport. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 8. Responsive preload pitfalls
A preload that hardcodes one image URL can conflict with the responsive candidate selected by srcset. imagesrcset and imagesizes can help when supported and correctly used.

**Practical consequence:** Verify the selected candidate on desktop and mobile to avoid redundant transfers.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:8:responsive-preload-pitfalls";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Verify the selected candidate on desktop and mobile to avoid redundant transfers. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 9. Modulepreload and JavaScript modules
modulepreload can fetch and prepare an ES module and its dependency graph earlier. It should be applied to known critical modules rather than every file in the bundle.

**Practical consequence:** Inspect bundler output and avoid hints that duplicate framework-generated preloads.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:9:modulepreload-and-javascript-modules";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Inspect bundler output and avoid hints that duplicate framework-generated preloads. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 10. Preload fonts carefully
A font preload should use the correct file, type, and crossorigin mode. Variable font and subset selection must match what CSS will request.

**Practical consequence:** Remove preloads for below-the-fold typography and unused weight variants.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:10:preload-fonts-carefully";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Remove preloads for below-the-fold typography and unused weight variants. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 11. HTTP cache and hint interaction
Hints affect request timing, not the freshness policy or correctness of the cache. Cache-Control, content hashes, and CDN configuration still determine reuse.

**Practical consequence:** Fix cache headers separately from discovery and priority issues.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:11:http-cache-and-hint-interaction";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Fix cache headers separately from discovery and priority issues. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 12. Support, speculation, and graceful behavior
Browsers can ignore hints based on their own scheduling, connection state, data-saving policies, or resource constraints. Hints are advisory, so the page must work without them.

**Practical consequence:** Test with hints removed and in Safari, Firefox, and Chromium-based browsers.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "resource-hints:12:support,-speculation,-and-graceful-behavior";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Test with hints removed and in Safari, Firefox, and Chromium-based browsers. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern: Preload a critical hero image
What it does: Starts a confirmed LCP image request early. Use when: The image is discovered late through CSS or markup that arrives late.

```html
<link
  rel="preload"
  as="image"
  href="/images/hero-1280.avif"
  fetchpriority="high">
<img
  src="/images/hero-1280.avif"
  width="1280" height="800"
  fetchpriority="high"
  alt="Abstract architectural forms in warm afternoon light">
```

### Pattern: Preconnect to one critical origin
What it does: Reduces connection setup delay for an early, required third-party origin. Use when: A critical font or image must be fetched from a known CDN.

```html
<link rel="preconnect" href="https://fonts-cdn.example.invalid" crossorigin>
<!-- Only keep this if the first viewport actually needs that origin. -->
```

### Pattern: Lower-cost DNS hint for later use
What it does: Resolves a likely future hostname without opening a full connection. Use when: A third-party destination is likely to be used but is not critical at startup.

```html
<link rel="dns-prefetch" href="//video-cdn.example.invalid">
<!-- A hint is optional; the page must work if the browser ignores it. -->
```

### Pattern: Responsive image preload
What it does: Lets the preload candidate align with the image's responsive selection. Use when: The LCP image has materially different desktop and mobile files.

```html
<link
  rel="preload"
  as="image"
  imagesrcset="/images/hero-640.avif 640w, /images/hero-1280.avif 1280w"
  imagesizes="(max-width: 700px) 100vw, 60vw"
  fetchpriority="high">
```

### Pattern: Preload a font with matching request mode
What it does: Makes the early font request reusable by CSS. Use when: A single local font is proven critical to first-viewport rendering.

```html
<link
  rel="preload"
  href="/fonts/studio-sans-latin.woff2"
  as="font"
  type="font/woff2"
  crossorigin>
<!-- The @font-face src URL must match this URL exactly. -->
```

### Pattern: Module preload a critical dependency
What it does: Starts fetching a known critical ES module before the module graph would otherwise discover it. Use when: A measured startup dependency is reliably needed immediately.

```html
<link rel="modulepreload" href="/assets/navigation-controller.js">
<script type="module" src="/assets/app-entry.js"></script>
<!-- Confirm the build output and browser behavior before adding more modulepreloads. -->
```

### Pattern: Baseline-to-regression workflow
What it does: Keeps the resource hints improvement measurable after code changes. Use when: A team ships repeated visual updates or adds third-party assets.

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
Build a production-style landing page that demonstrates resource hints decisions for a creative studio portfolio. The challenge must include a real failure case: start with a deliberately poor implementation, capture the evidence, fix the root cause, and demonstrate that the improvement did not break readability, layout stability, or browser compatibility.

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
