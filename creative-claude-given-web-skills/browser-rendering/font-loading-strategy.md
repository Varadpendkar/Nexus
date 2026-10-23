# SKILL: font-loading-strategy
**Layer:** 27 — Browser Rendering
**Goal:** Deliver web typography with minimal invisible text, layout shift, and late font swaps while preserving readable fallbacks, language coverage, and privacy-aware loading.

---

## Why This Matters (Senior Perspective)
Fonts affect both appearance and geometry. If a heading initially renders in a fallback font and later swaps to a wider custom face, navigation can wrap, hero text can shift, and the page's LCP element can change size after the first render. If font-display is chosen carelessly, visitors may see invisible text; if too many weights and subsets are loaded, font requests compete with the actual content. Production typography is a rendering strategy: choose formats and subsets, declare accurate faces, design metric-compatible fallbacks, and load only what the page needs.

The practical rule is to establish a baseline, state the expected user-visible outcome, and change one cause at a time. Use DevTools and browser performance APIs as evidence, not as decoration. Test a cold visit and a repeat visit, a narrow viewport and a wide viewport, and at least one browser outside Chromium when compatibility matters. A creative portfolio can have an ambitious visual identity without forcing the first useful content to wait for every effect, font, and analytics request.

---

## Core Concepts

### 1. Font request lifecycle
A font is usually discovered after CSS rules identify a face needed by visible text. The browser fetches, decodes, and applies it subject to font-display and cache behavior.

**Practical consequence:** Inspect the actual font request waterfall instead of assuming a file is fetched at HTML parse time.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:1:font-request-lifecycle";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Inspect the actual font request waterfall instead of assuming a file is fetched at HTML parse time. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 2. font-display behavior
auto, block, swap, fallback, and optional express different trade-offs between invisible text, fallback display, and swapping. Exact timing behavior is browser-defined and can vary.

**Practical consequence:** Choose based on the role of the typeface and the acceptability of a late swap.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:2:font-display-behavior";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Choose based on the role of the typeface and the acceptability of a late swap. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 3. Metric-compatible fallbacks
Fallback fonts with similar ascent, descent, and character widths reduce layout changes when the custom face loads. CSS size-adjust and related metric overrides can help tune the fallback.

**Practical consequence:** Measure a representative heading and paragraph, not only a single letter.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:3:metric-compatible-fallbacks";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Measure a representative heading and paragraph, not only a single letter. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 4. WOFF2 and font payload
WOFF2 is broadly supported in modern browsers and usually offers efficient compression. Payload still depends on glyph coverage, font tables, axes, and subset strategy.

**Practical consequence:** Serve only the glyphs and styles the page uses, while keeping language support correct.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:4:woff2-and-font-payload";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Serve only the glyphs and styles the page uses, while keeping language support correct. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 5. Variable fonts and axes
A variable font can package a range of weights or widths in one file, but it may be larger than a single static face and should be evaluated against actual usage.

**Practical consequence:** Use a variable face when the design uses several axis values and the total payload makes sense.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:5:variable-fonts-and-axes";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use a variable face when the design uses several axis values and the total payload makes sense. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 6. Unicode subsets and language coverage
Latin-only subsets can be smaller but can break names, punctuation, or non-Latin text if coverage is incomplete. Subset declarations need correct unicode-range and fallback planning.

**Practical consequence:** Test real content from every supported language, including accented characters and punctuation.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:6:unicode-subsets-and-language-coverage";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Test real content from every supported language, including accented characters and punctuation. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 7. Preload only critical fonts
A preload can start a font request earlier than normal CSS discovery, but preloading an unused weight wastes bandwidth and can compete with LCP images.

**Practical consequence:** Preload only a verified above-the-fold font file and match crossorigin and URL exactly.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:7:preload-only-critical-fonts";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Preload only a verified above-the-fold font file and match crossorigin and URL exactly. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 8. Cross-origin font requests
Fonts fetched from another origin commonly need CORS-compatible responses; preload mode and normal CSS fetch must align so the browser can reuse the request.

**Practical consequence:** Check response headers and duplicate requests in DevTools when preload appears ineffective.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:8:cross-origin-font-requests";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Check response headers and duplicate requests in DevTools when preload appears ineffective. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 9. Font loading API
document.fonts.ready and document.fonts.check can support measurement or visual tests, but should not block core content indefinitely.

**Practical consequence:** Use font readiness for screenshot capture or a controlled interaction, not as a reason to hide the entire page.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:9:font-loading-api";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Use font readiness for screenshot capture or a controlled interaction, not as a reason to hide the entire page. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 10. CLS and typography
A font swap can alter line wrapping and element dimensions. Reserving space and selecting stable fallback metrics reduces visible movement.

**Practical consequence:** Measure layout shifts in the actual hero and navigation under slow network conditions.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:10:cls-and-typography";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Measure layout shifts in the actual hero and navigation under slow network conditions. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 11. Privacy and third-party font services
External font services add DNS, connection, request, and third-party dependency considerations. Self-hosting can improve control but creates maintenance and licensing responsibilities.

**Practical consequence:** Choose a delivery model based on privacy, cache behavior, operational control, and licensing.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:11:privacy-and-third-party-font-services";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Choose a delivery model based on privacy, cache behavior, operational control, and licensing. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

### 12. Accessibility and readability
Custom fonts must preserve legibility, language coverage, zoom behavior, and sensible fallback. Do not rely on icon glyphs in fonts for essential accessible labels.

**Practical consequence:** Ensure meaningful text remains readable if font downloads fail or are blocked.

```js
// Capture a small, named observation so the investigation can be repeated.
const observationLabel = "font-loading-strategy:12:accessibility-and-readability";
performance.mark(`${observationLabel}:start`);
// Perform the exact page action under investigation before taking the end mark.
requestAnimationFrame(() => {
  performance.mark(`${observationLabel}:frame`);
  const entries = performance.getEntriesByName(`${observationLabel}:frame`);
  console.table(entries.map(({ name, startTime }) => ({ name, startTime })));
});
```

**Gotcha:** Ensure meaningful text remains readable if font downloads fail or are blocked. Confirm the browser's actual behavior under the same viewport, cache, and network conditions instead of relying on a property name or a single lab score.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern: Swap with metric-aware fallback
What it does: Shows readable fallback text immediately and reduces geometry differences when the custom face arrives. Use when: Headings and navigation must not remain invisible during font loading.

```js
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans-latin.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: "Studio Sans Fallback";
  src: local("Arial");
  size-adjust: 98%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
body { font-family: "Studio Sans", "Studio Sans Fallback", sans-serif; }
```

### Pattern: Preload one verified face
What it does: Starts fetching a critical font before CSS discovery would normally reach it. Use when: The first viewport depends on a specific face and a trace confirms late discovery.

```html
<link
  rel="preload"
  href="/fonts/studio-sans-latin.woff2"
  as="font"
  type="font/woff2"
  crossorigin>
<link rel="stylesheet" href="/assets/site.css">
```

### Pattern: Subset with explicit coverage
What it does: Separates language coverage while allowing the browser to fetch only a matching face. Use when: A site serves multiple scripts and font payloads are significant.

```js
@font-face {
  font-family: "Editorial Serif";
  src: url("/fonts/editorial-serif-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F;
}
/* Add tested subsets for every supported writing system; do not assume Latin covers all copy. */
```

### Pattern: Wait for fonts in visual tests
What it does: Makes screenshot capture deterministic without hiding production content. Use when: Automated visual tests otherwise capture fallback typography inconsistently.

```js
async function waitForCriticalTypography() {
  await document.fonts.ready;
  const headingFontLoaded = document.fonts.check('700 48px "Studio Sans"');
  if (!headingFontLoaded) {
    throw new Error("Critical heading font did not load; capture should be marked as a fallback-font run.");
  }
}
waitForCriticalTypography().then(() => console.info("Critical typography is ready."));
```

### Pattern: Use variable font ranges intentionally
What it does: Declares a supported range and lets CSS select values without multiple redundant font files. Use when: The design uses several weights or width settings.

```js
@font-face {
  font-family: "Variable Display";
  src: url("/fonts/variable-display.woff2") format("woff2");
  font-weight: 300 800;
  font-style: normal;
  font-display: swap;
}
.hero-title { font-family: "Variable Display", sans-serif; font-weight: 650; }
```

### Pattern: Debug duplicate font fetches
What it does: Exposes the common case where preload and CSS do not refer to the same request. Use when: The Network panel shows the same font file requested twice.

```js
const fontRequests = performance.getEntriesByType("resource")
  .filter((resource) => /\.woff2?(?:\?|$)/i.test(resource.name))
  .map((resource) => ({ url: resource.name, duration: resource.duration, transferSize: resource.transferSize }));
console.table(fontRequests);
```

### Pattern: Baseline-to-regression workflow
What it does: Keeps the font loading strategy improvement measurable after code changes. Use when: A team ships repeated visual updates or adds third-party assets.

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
Build a production-style landing page that demonstrates font loading strategy decisions for a creative studio portfolio. The challenge must include a real failure case: start with a deliberately poor implementation, capture the evidence, fix the root cause, and demonstrate that the improvement did not break readability, layout stability, or browser compatibility.

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
