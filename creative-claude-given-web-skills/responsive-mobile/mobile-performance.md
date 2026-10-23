# SKILL: mobile-performance

**Layer:** 08 — Responsive Mobile

**Goal:** Build mobile experiences that remain responsive under real device constraints by controlling rendering cost, JavaScript work, network payloads, media delivery, and interaction latency.

## Why This Matters (Senior Perspective)

A mobile interface is not a desktop interface compressed into a narrower rectangle. It runs on a different performance budget: variable CPU and GPU capability, memory pressure, battery limits, intermittent connectivity, thermal throttling, and browser chrome that changes the visible viewport. A landing page that feels instant on a developer laptop can stutter on a mid-range phone after several sections of animation, oversized images, third-party widgets, and a long hydration task have accumulated. Users experience the combined result, not the isolated quality of each implementation choice.

Senior developers treat performance as a product requirement with observable outcomes. They establish a baseline, measure on representative hardware and network conditions, prioritize the largest bottlenecks, and re-test after changes. They do not add `will-change` to every animated element, lazy-load the hero image, or remove all motion because those choices sound like performance advice. Each technique has a cost and must fit the specific workload. A portfolio site with a full-screen WebGL scene, a restaurant site with image-heavy menus, and a product landing page with video all need different budgets and fallback strategies.

Mobile performance is also a creative constraint. The goal is not to remove visual character; it is to preserve the intended hierarchy and motion while avoiding work that the device cannot deliver smoothly. A polished result may use fewer simultaneous effects, carefully sized art direction, transforms instead of layout-triggering animation, progressive enhancement, and a clear static fallback. Performance decisions should be documented so a future design change does not quietly reintroduce the bottleneck.

## Core Concepts

### 1. Establish a performance budget before optimizing

**Mental model:** A budget turns “make it fast” into limits that can be tested. Without a budget, teams can spend time shaving tiny costs while a multi-megabyte hero asset dominates the experience.

Choose targets based on the project, user base, and measurement method. For web vitals, use current field and lab data together: field data reflects real users, while lab tests make controlled comparisons possible. Core Web Vitals commonly include Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS). A lab score is diagnostic, not a promise that every device will behave the same way.

```js
// Keep project-specific thresholds together so reviews discuss one agreed budget.
export const performanceBudget = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  initialJavaScriptKb: 180,
  initialImageKb: 500,
  longTaskMs: 50
};
```

A budget should name the route, device profile, network profile, cache state, and test procedure. A marketing homepage and a logged-in dashboard may require different budgets because their content and interaction patterns differ.

```js
export function evaluateVitals({ lcpMs, inpMs, cls }, budget) {
  return {
    lcp: lcpMs <= budget.lcpMs,
    inp: inpMs <= budget.inpMs,
    cls: cls <= budget.cls
  };
}
```

Do not interpret a passing local Lighthouse run as proof of field performance. Compare repeatable lab runs, then monitor real-user measurements when analytics and privacy requirements permit.

```js
const result = evaluateVitals(
  { lcpMs: 2380, inpMs: 185, cls: 0.04 },
  performanceBudget
);

console.table(result);
```

### 2. Measure the experience users actually receive

**Mental model:** Measurement identifies the bottleneck; intuition only proposes candidates. A page may feel slow because its largest image arrives late, because the main thread is busy, or because content shifts after fonts load.

Use browser performance tooling to inspect the critical path, long tasks, layout shifts, image decoding, and network waterfall. Test on a physical device when possible. CPU throttling is useful for comparing changes, but it is still an approximation of real mobile hardware.

```js
// This helper gives a lightweight local signal; use browser tooling for full diagnosis.
export function observeLongTasks(onLongTask) {
  if (!("PerformanceObserver" in window)) return () => {};

  const observer = new PerformanceObserver((entries) => {
    for (const entry of entries.getEntries()) {
      onLongTask({
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name
      });
    }
  });

  observer.observe({ type: "longtask", buffered: true });
  return () => observer.disconnect();
}
```

The Performance API can expose resource timing, navigation timing, and paint timing. It does not replace a trace: a timing entry alone rarely explains why a task took so long.

```js
export function getNavigationSummary() {
  const nav = performance.getEntriesByType("navigation")[0];
  if (!nav) return null;

  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    connection: nav.connectEnd - nav.connectStart,
    response: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive,
    loadEvent: nav.loadEventEnd
  };
}
```

Run tests with a cold cache and a warm cache. The cold run exposes first-visit cost; the warm run helps diagnose repeat navigation. Record both rather than choosing whichever result looks better.

```js
const resourceSummary = performance
  .getEntriesByType("resource")
  .map((entry) => ({
    name: new URL(entry.name).pathname,
    transferBytes: entry.transferSize,
    durationMs: Math.round(entry.duration)
  }))
  .sort((a, b) => b.transferBytes - a.transferBytes);

console.table(resourceSummary.slice(0, 10));
```

### 3. Keep the main thread available for input

**Mental model:** A tap cannot feel immediate while the main thread is occupied by unrelated work. JavaScript, style calculation, layout, paint preparation, and other browser tasks compete for the same responsiveness window.

Split large work into smaller units, defer non-critical tasks, and avoid expensive synchronous parsing or repeated DOM updates during an interaction. A task that runs for more than roughly 50 ms is generally considered a long task and can delay input.

```js
export function processInChunks(items, processItem, chunkSize = 40) {
  let index = 0;

  function runChunk() {
    const end = Math.min(index + chunkSize, items.length);

    while (index < end) {
      processItem(items[index]);
      index += 1;
    }

    if (index < items.length) {
      setTimeout(runChunk, 0);
    }
  }

  runChunk();
}
```

Chunking yields control between batches. It is not suitable for every operation: if each item performs heavy layout work, the page can still be slow. Prefer data-only work in the chunk and update the DOM in a small, deliberate render step.

```js
// Batch DOM changes so one item does not force a layout for every iteration.
function renderCards(container, cards) {
  const fragment = document.createDocumentFragment();

  for (const card of cards) {
    const article = document.createElement("article");
    article.className = "project-card";
    article.textContent = card.title;
    fragment.append(article);
  }

  container.replaceChildren(fragment);
}
```

For expensive computations that can run independently of the DOM, consider a Web Worker. A worker cannot access `document`, but it can transform data, search large arrays, or parse computationally expensive input without blocking the UI thread.

```js
// search-worker.js: keep expensive filtering away from tap and scroll handling.
self.addEventListener("message", (event) => {
  const { records, query } = event.data;
  const normalizedQuery = query.trim().toLowerCase();

  const matches = records.filter((record) =>
    record.title.toLowerCase().includes(normalizedQuery)
  );

  self.postMessage(matches);
});
```

```js
// main.js: the UI stays free while the worker searches the supplied records.
const searchWorker = new Worker(
  new URL("./search-worker.js", import.meta.url),
  { type: "module" }
);

searchWorker.addEventListener("message", (event) => {
  renderSearchResults(event.data);
});

function searchProjects(records, query) {
  searchWorker.postMessage({ records, query });
}
```

### 4. Avoid layout thrashing

**Mental model:** Read layout, calculate, then write. Alternating geometry reads with style writes can force the browser to repeatedly recalculate layout.

Properties such as `offsetHeight`, `getBoundingClientRect()`, and some computed-style reads can require current layout information. If code writes styles and immediately reads geometry, it may force synchronous work. Group reads and writes by phase.

```js
// Wrong: every style write may be followed by a forced geometry read.
function positionBadgesBadly(badges) {
  for (const badge of badges) {
    badge.style.width = `${badge.parentElement.offsetWidth}px`;
    badge.style.left = `${badge.parentElement.getBoundingClientRect().left}px`;
  }
}
```

```js
// Better: collect geometry before making any visual changes.
function positionBadges(badges) {
  const measurements = badges.map((badge) => {
    const parent = badge.parentElement;
    const rect = parent.getBoundingClientRect();

    return { badge, width: rect.width, left: rect.left };
  });

  for (const item of measurements) {
    item.badge.style.width = `${item.width}px`;
    item.badge.style.left = `${item.left}px`;
  }
}
```

Prefer CSS layout systems for ordinary alignment. JavaScript geometry code is appropriate when the design requires measured relationships, not as a replacement for Grid, Flexbox, or normal document flow.

```css
/* Let the layout engine align cards without per-card geometry measurements. */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}
```

### 5. Animate compositor-friendly properties

**Mental model:** Make motion change appearance without repeatedly recalculating layout. `transform` and `opacity` are usually safer animation candidates than `top`, `left`, `width`, or `height`, though the browser's actual rendering path still depends on context.

```css
/* Transform and opacity usually avoid layout work on each animation frame. */
.card-enter {
  opacity: 0;
  transform: translateY(0.75rem);
}

.card-enter.is-visible {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity 240ms ease-out,
    transform 240ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

Avoid animating layout dimensions across many elements on low-powered devices. If an accordion needs a height animation, assess whether a simple opacity/transform transition or an instant state change would preserve the interaction more reliably.

```css
/* Expensive pattern: width changes can trigger layout across neighboring content. */
.progress-fill {
  width: 0;
  transition: width 700ms ease;
}

/* Alternative for a fixed track: scale the inner fill from its left edge. */
.progress-fill--composited {
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 700ms ease;
}
```

```js
function setProgress(fill, fraction) {
  const clamped = Math.max(0, Math.min(1, fraction));
  fill.style.transform = `scaleX(${clamped})`;
}
```

`will-change` is a hint, not a universal speed switch. Promoting too many elements can increase memory use and compositing overhead.

```css
/* Apply only to a known element during an active interaction. */
.dragging-card {
  will-change: transform;
}
```

```js
function beginDrag(card) {
  card.classList.add("dragging-card");
}

function endDrag(card) {
  card.classList.remove("dragging-card");
}
```

### 6. Reduce image transfer and decode cost

**Mental model:** The best image is the smallest image that preserves the intended art direction at the actual rendered size. Sending a 3000-pixel photograph to a 360-pixel card wastes bandwidth, decode time, and memory.

Use responsive image candidates, modern formats where supported, explicit dimensions, and lazy loading for below-the-fold content. Do not lazy-load the likely LCP image: it should be discoverable early and may deserve preload or high fetch priority after measurement confirms it is the critical asset.

```html
<img
  src="/images/studio-960.webp"
  srcset="
    /images/studio-480.webp 480w,
    /images/studio-960.webp 960w,
    /images/studio-1440.webp 1440w
  "
  sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 33vw"
  width="1440"
  height="960"
  alt="Designer reviewing a printed brand identity"
  decoding="async"
  loading="lazy"
/>
```

The `sizes` attribute should describe the image's expected CSS width. If it says `100vw` while the card is only one-third of the viewport, the browser may select a larger candidate than needed.

```html
<picture>
  <source
    media="(max-width: 600px)"
    srcset="/images/installation-portrait.webp"
    type="image/webp"
  />
  <source
    media="(min-width: 601px)"
    srcset="/images/installation-wide.avif"
    type="image/avif"
  />
  <img
    src="/images/installation-wide.jpg"
    width="1600"
    height="1000"
    alt="Sculptural installation in a bright gallery"
  />
</picture>
```

Use `picture` when art direction changes, not merely to create many sources without a clear delivery strategy. Always provide a usable fallback and meaningful alternative text.

```css
/* Stable dimensions reserve space while the image is downloading. */
.project-thumbnail {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: #e9e7e2;
}
```

```html
<img
  class="project-thumbnail"
  src="/images/identity-640.webp"
  width="640"
  height="480"
  loading="lazy"
  alt="Close-up of the identity system's printed color palette"
/>
```

### 7. Treat video and 3D as optional layers

**Mental model:** The visual effect should not prevent the page's core content from arriving. Full-screen video and WebGL scenes can consume bandwidth, memory, battery, and GPU time before a user has decided to engage.

For decorative video, use a poster, avoid audio, and respect reduced-motion preferences. Mobile browsers may restrict autoplay; the design must remain complete when playback does not begin.

```html
<video
  class="hero-video"
  autoplay
  muted
  loop
  playsinline
  poster="/images/hero-poster.webp"
  preload="none"
  aria-hidden="true"
>
  <source src="/media/hero-loop.webm" type="video/webm" />
  <source src="/media/hero-loop.mp4" type="video/mp4" />
</video>
```

`preload="none"` expresses that the video is not required immediately. Browser behavior can vary, so verify network requests on target devices.

```css
.hero-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (prefers-reduced-motion: reduce) {
  .hero-video {
    display: none;
  }
}
```

Provide a static visual that carries the same brand meaning rather than leaving a blank hero.

```html
<div class="hero-media">
  <img
    class="hero-poster"
    src="/images/hero-poster.webp"
    width="1600"
    height="1000"
    alt=""
  />
  <video class="hero-video" muted autoplay loop playsinline aria-hidden="true">
    <source src="/media/hero-loop.mp4" type="video/mp4" />
  </video>
</div>
```

For Three.js or other WebGL content, cap pixel ratio and provide a fallback. Rendering at device pixel ratio 3 can mean roughly nine times as many pixels as DPR 1, which can be costly for fill-rate-heavy scenes.

```js
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "low-power"
});

const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(pixelRatio);
renderer.setSize(width, height, false);
```

```js
function updateRendererSize(renderer, camera, width, height) {
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
```

Stop rendering when the scene is offscreen or when motion is not needed. An always-running animation loop can drain battery even when the canvas is below the fold.

```js
let frameId = 0;
let isVisible = true;

function renderFrame() {
  if (!isVisible) return;
  frameId = requestAnimationFrame(renderFrame);
  renderer.render(scene, camera);
}

const visibilityObserver = new IntersectionObserver(([entry]) => {
  isVisible = entry.isIntersecting;
  cancelAnimationFrame(frameId);
  if (isVisible) renderFrame();
});

visibilityObserver.observe(canvas);
```

### 8. Load non-critical code only when it is needed

**Mental model:** Initial JavaScript is a cost paid before the interface can become fully interactive. Split by route and feature, not only by source file.

```js
// The editor code is downloaded only when a user opens the editor.
async function openVisualEditor() {
  const { mountEditor } = await import("./visual-editor.js");
  mountEditor(document.querySelector("[data-editor-root]"));
}
```

Use dynamic imports for expensive features such as maps, charts, editors, and complex animation libraries. Ensure the loading state is accessible and the import failure does not trap the user.

```js
async function loadChart(container, data) {
  container.setAttribute("aria-busy", "true");

  try {
    const { renderChart } = await import("./charting.js");
    renderChart(container, data);
  } catch (error) {
    container.textContent = "The chart could not be loaded. The data table remains available.";
    console.error("Chart module failed to load", error);
  } finally {
    container.removeAttribute("aria-busy");
  }
}
```

Do not defer every script indiscriminately. The code required for the first interaction should be available when the user needs it, and third-party scripts should be evaluated for necessity and consent.

```html
<script type="module" src="/assets/main.js"></script>
<script defer src="/assets/analytics-consented.js"></script>
```

```js
// Keep optional integrations behind an explicit user action or consent decision.
function enableMapAfterConsent(consentGranted) {
  if (!consentGranted) return;

  return import("./map-widget.js").then(({ mountMap }) => {
    mountMap(document.querySelector("[data-map]"));
  });
}
```

### 9. Make scroll work cheap

**Mental model:** Scroll should not trigger a cascade of style recalculations, heavy DOM queries, and repeated event handlers. Prefer observers and CSS where they express the behavior cleanly.

```js
// Passive listeners tell the browser this handler will not cancel scrolling.
window.addEventListener(
  "scroll",
  () => {
    scheduleScrollUpdate();
  },
  { passive: true }
);
```

Throttle visual work to one update per animation frame rather than running it for every scroll event.

```js
let scrollFrame = 0;

function scheduleScrollUpdate() {
  if (scrollFrame) return;

  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateScrollProgress();
  });
}
```

```js
function updateScrollProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

  document.documentElement.style.setProperty(
    "--page-progress",
    String(Math.min(1, Math.max(0, progress)))
  );
}
```

```css
/* A transform-based indicator avoids changing the layout of page content. */
.reading-progress {
  position: fixed;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  transform: scaleX(var(--page-progress, 0));
  transform-origin: left;
  background: currentColor;
  pointer-events: none;
}
```

For reveal-on-scroll effects, `IntersectionObserver` avoids continuous manual geometry checks.

```js
const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  },
  { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
);

document.querySelectorAll("[data-reveal]").forEach((element) => {
  revealObserver.observe(element);
});
```

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(0.6rem);
  transition: opacity 220ms ease-out, transform 220ms ease-out;
}

[data-reveal].is-visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

### 10. Prevent layout shifts

**Mental model:** A stable page gives the browser enough information to reserve the space that content will occupy. Late-loading media, injected banners, and font swaps can move buttons while a user is trying to tap them.

```html
<img
  src="/images/case-study.webp"
  width="1200"
  height="900"
  alt="Mobile case study displayed on a phone"
/>
```

```css
.case-study-media {
  aspect-ratio: 4 / 3;
  overflow: clip;
}
```

Reserve space for embeds and asynchronous modules. Do not insert a banner above the current reading position without considering the resulting movement.

```css
.ad-slot,
.embed-slot {
  min-height: 16rem;
  contain: layout;
}
```

```js
function mountRecommendation(target, content) {
  // The reserved region prevents the surrounding article from jumping on insertion.
  target.replaceChildren(content);
}
```

Use font loading intentionally. A fallback font with different metrics can change line wrapping; metric-compatible fallback stacks and carefully configured font-display behavior can reduce visible shifts.

```css
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans.woff2") format("woff2");
  font-weight: 400 700;
  font-display: swap;
}

body {
  font-family: "Studio Sans", Arial, sans-serif;
}
```

```css
/* If a local fallback is metric-compatible, the headline is less likely to reflow. */
@font-face {
  font-family: "Studio Sans Fallback";
  src: local("Arial");
  size-adjust: 98%;
  ascent-override: 92%;
  descent-override: 24%;
  line-gap-override: 0%;
}
```

### 11. Respect memory, battery, and thermal limits

**Mental model:** Performance is sustained behavior, not a single benchmark. An animation that runs smoothly for ten seconds but overheats a phone during a long portfolio scroll is not a successful mobile experience.

Release resources when they are no longer needed. Remove event listeners, disconnect observers, cancel animation frames, and dispose GPU resources. Avoid retaining large DOM trees or image buffers after a route transition.

```js
function createTicker(callback) {
  let frameId = 0;
  let active = true;

  function tick(time) {
    if (!active) return;
    callback(time);
    frameId = requestAnimationFrame(tick);
  }

  frameId = requestAnimationFrame(tick);

  return () => {
    active = false;
    cancelAnimationFrame(frameId);
  };
}
```

```js
function disposeScene({ renderer, geometries, materials, textures }) {
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
  renderer.dispose();
}
```

```js
function attachResizeHandler(onResize) {
  window.addEventListener("resize", onResize, { passive: true });

  return () => {
    window.removeEventListener("resize", onResize);
  };
}
```

Avoid unnecessary high-frequency state updates. A pointer move handler that updates application state hundreds of times per second can trigger component re-renders across a tree. Keep ephemeral pointer coordinates local to the interaction and publish only the state needed by the UI.

```js
let pointerFrame = 0;
let latestPointer = { x: 0, y: 0 };

function onPointerMove(event) {
  latestPointer = { x: event.clientX, y: event.clientY };

  if (pointerFrame) return;
  pointerFrame = requestAnimationFrame(() => {
    pointerFrame = 0;
    updateCustomCursor(latestPointer);
  });
}
```

### 12. Design for constrained networks

**Mental model:** Users should receive the meaningful page before optional polish. Network speed, latency, packet loss, and data limits are separate constraints.

Prioritize HTML, critical CSS, the likely LCP image, and the code needed for the first meaningful interaction. Avoid making the first render wait on analytics, chat widgets, video, or a large animation bundle.

```html
<link rel="preload" as="image" href="/images/hero-mobile.webp" fetchpriority="high" />
<link rel="preload" href="/fonts/studio-sans.woff2" as="font" type="font/woff2" crossorigin />
```

Only preload resources that are genuinely critical. Excessive preloads compete with each other and can delay the resource that matters most.

```html
<img
  src="/images/hero-mobile.webp"
  width="900"
  height="1200"
  alt="Abstract sculptural artwork used as the studio homepage hero"
  fetchpriority="high"
/>
```

Offer responsive media and avoid downloading a desktop background on a small viewport when a purpose-built mobile asset can carry the design more efficiently.

```css
.hero {
  background-image: url("/images/hero-mobile.webp");
  background-position: center;
  background-size: cover;
}

@media (min-width: 48rem) {
  .hero {
    background-image: url("/images/hero-desktop.webp");
  }
}
```

A CSS background does not provide the same semantic alternative text as an image element. Use it for decoration; use `img` when the image communicates content.

## Reusable Patterns

### Pattern 1: Critical-first hero

**What it solves:** Gets the main visual and headline ready without forcing users to wait for video, 3D, or a large animation bundle.

**Use it when:** A creative agency, portfolio, or product homepage has a media-heavy hero.

```html
<section class="hero" aria-labelledby="hero-title">
  <img
    class="hero__image"
    src="/images/hero-mobile.webp"
    srcset="/images/hero-mobile.webp 900w, /images/hero-wide.webp 1800w"
    sizes="100vw"
    width="1800"
    height="1200"
    fetchpriority="high"
    decoding="async"
    alt=""
  />
  <div class="hero__content">
    <p class="eyebrow">Independent digital studio</p>
    <h1 id="hero-title">Digital work with a physical presence.</h1>
    <a class="hero__cta" href="/work/">Explore selected work</a>
  </div>
  <button class="hero__motion-toggle" type="button" hidden>
    Play motion
  </button>
</section>
```

```css
.hero {
  position: relative;
  isolation: isolate;
  min-height: 38rem;
  display: grid;
  align-items: end;
  padding: clamp(1.25rem, 5vw, 5rem);
  overflow: clip;
  color: white;
  background: #12121b;
}

.hero__image {
  position: absolute;
  z-index: -2;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 35%;
}

.hero::after {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  background: linear-gradient(0deg, rgb(0 0 0 / 0.72), transparent 72%);
}

.hero__content {
  max-width: 46rem;
}

.hero h1 {
  max-width: 12ch;
  font-size: clamp(2.75rem, 10vw, 6rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.hero__cta {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  padding-inline: 1.1rem;
  border-radius: 999px;
  color: #101018;
  background: #fff;
  font-weight: 700;
}
```

```js
// Motion is an enhancement; the poster and message remain complete without it.
async function enhanceHeroWithMotion(hero) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (navigator.connection?.saveData) return;

  const { mountHeroMotion } = await import("./hero-motion.js");
  mountHeroMotion(hero);
}
```

**Review points:** The hero image is not lazy-loaded; its dimensions are declared; the main message is HTML; optional motion is loaded after a lightweight decision; reduced-motion and data-saving preferences are respected.

### Pattern 2: Responsive image card

**What it solves:** Delivers a fitting image candidate and reserves space for a portfolio grid.

**Use it when:** Project cards are visible in a long mobile case-study index.

```html
<article class="work-card">
  <a href="/work/kinetic-identity/" class="work-card__link">
    <div class="work-card__media">
      <img
        src="/images/kinetic-640.webp"
        srcset="
          /images/kinetic-320.webp 320w,
          /images/kinetic-640.webp 640w,
          /images/kinetic-960.webp 960w
        "
        sizes="(max-width: 40rem) calc(100vw - 2rem), (max-width: 70rem) 50vw, 33vw"
        width="960"
        height="720"
        loading="lazy"
        decoding="async"
        alt="Kinetic identity graphics applied to a gallery wall"
      />
    </div>
    <h2>Kinetic identity</h2>
    <p>Art direction · Digital experience</p>
  </a>
</article>
```

```css
.work-card__media {
  aspect-ratio: 4 / 3;
  overflow: clip;
  background: #ece9e4;
}

.work-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .work-card__link:hover img {
    transform: scale(1.035);
  }
}

@media (prefers-reduced-motion: reduce) {
  .work-card__media img {
    transition: none;
  }
}
```

```js
// Do not eagerly decode every below-the-fold image during page startup.
document.querySelectorAll(".work-card img[loading='lazy']").forEach((image) => {
  image.addEventListener("load", () => {
    image.classList.add("is-loaded");
  }, { once: true });
});
```

**Review points:** `sizes` matches the card layout, dimensions reserve space, lazy loading is limited to non-critical images, and hover motion does not become a required mobile interaction.

### Pattern 3: Frame-budgeted scroll effects

**What it solves:** Prevents repeated scroll events from triggering duplicate layout work.

**Use it when:** A page has a reading-progress bar or lightweight scroll-linked decoration.

```js
export function installReadingProgress(progressElement) {
  let frame = 0;

  function update() {
    frame = 0;
    const root = document.documentElement;
    const range = root.scrollHeight - window.innerHeight;
    const value = range > 0 ? window.scrollY / range : 0;

    progressElement.style.transform = `scaleX(${Math.max(0, Math.min(1, value))})`;
  }

  function onScroll() {
    if (frame) return;
    frame = requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  update();

  return () => {
    window.removeEventListener("scroll", onScroll);
    cancelAnimationFrame(frame);
  };
}
```

```css
.reading-progress {
  position: fixed;
  z-index: 100;
  inset: 0 auto auto 0;
  width: 100%;
  height: 2px;
  transform: scaleX(0);
  transform-origin: left center;
  background: #7667ff;
  pointer-events: none;
}
```

**Review points:** At most one update is queued per frame; the listener is passive; cleanup is returned; the animated property is a transform.

### Pattern 4: Visibility-aware animation

**What it solves:** Stops decorative animation work when the animated element is outside the viewport.

**Use it when:** A portfolio has a particle canvas, 3D object, or animated diagram in a long page.

```js
export function createVisibilityLoop(element, render) {
  let visible = false;
  let frame = 0;
  let disposed = false;

  function tick(time) {
    if (disposed || !visible) return;
    render(time);
    frame = requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(frame);

    if (visible && !disposed) {
      frame = requestAnimationFrame(tick);
    }
  });

  observer.observe(element);

  return () => {
    disposed = true;
    visible = false;
    cancelAnimationFrame(frame);
    observer.disconnect();
  };
}
```

```js
const stopArtworkLoop = createVisibilityLoop(
  document.querySelector(".generative-art"),
  (time) => drawGenerativeArtwork(time)
);
```

```js
// Call this when the route unmounts or the artwork is removed.
window.addEventListener("pagehide", stopArtworkLoop, { once: true });
```

**Review points:** The loop runs only while visible, a single animation frame is scheduled at a time, and cleanup cancels both the frame and observer.

### Pattern 5: Progressive feature loading

**What it solves:** Keeps the initial route light while preserving access to a costly feature.

**Use it when:** Charts, maps, editors, filters, or WebGL tools are secondary to the first screen.

```html
<section class="insights" aria-labelledby="insights-title">
  <h2 id="insights-title">Campaign performance</h2>
  <p>The summary is available immediately. Load the interactive chart for deeper analysis.</p>
  <button type="button" data-load-chart>Load interactive chart</button>
  <div class="chart-slot" data-chart-slot aria-live="polite"></div>
  <table>
    <caption>Campaign summary</caption>
    <thead><tr><th scope="col">Campaign</th><th scope="col">Visits</th></tr></thead>
    <tbody><tr><th scope="row">Spring launch</th><td>18,420</td></tr></tbody>
  </table>
</section>
```

```js
const loadButton = document.querySelector("[data-load-chart]");
const chartSlot = document.querySelector("[data-chart-slot]");

loadButton.addEventListener("click", async () => {
  loadButton.disabled = true;
  chartSlot.textContent = "Loading interactive chart…";

  try {
    const { mountCampaignChart } = await import("./campaign-chart.js");
    await mountCampaignChart(chartSlot);
    loadButton.hidden = true;
  } catch (error) {
    chartSlot.textContent = "The interactive chart is unavailable. Use the summary table above.";
    loadButton.disabled = false;
    console.error("Campaign chart import failed", error);
  }
});
```

```css
.chart-slot {
  min-height: 18rem;
  contain: layout;
}

.chart-slot:empty {
  min-height: 0;
}
```

**Review points:** The summary works without JavaScript, loading follows user intent, the button exposes a loading state, and failures leave a usable alternative.

## Common Mistakes

| Mistake | Why it hurts | Better approach |
|---|---|---|
| Lazy-loading the main hero image | The likely LCP resource may be discovered late and delay the largest contentful paint. | Eager-load the likely LCP image; consider `fetchpriority="high"` only after confirming it is the critical resource. |
| Loading every image at full desktop resolution | Transfer, decode, and memory costs rise on small screens. | Generate responsive candidates and provide accurate `sizes` values. |
| Using a single Lighthouse score as proof | A lab run cannot represent all devices, networks, and real user journeys. | Combine repeatable lab traces with field metrics where available. |
| Adding `will-change` to every card | Promoted layers can consume memory and add compositing overhead. | Apply hints narrowly and temporarily to elements that need them. |
| Animating `top`, `left`, `width`, or `height` continuously | Layout may be recalculated on every frame. | Prefer `transform` and `opacity` when they preserve the intended visual result. |
| Running a perpetual animation loop below the fold | GPU and CPU work continues while users cannot see the scene. | Pause loops when hidden and resume only when needed. |
| Updating the DOM once per data item | Repeated mutations can cause excessive rendering and layout work. | Build a fragment or data model first, then commit a compact update. |
| Alternating geometry reads and style writes | Forced synchronous layout can stall the main thread. | Measure first, then write in a separate phase. |
| Doing large filtering work inside an input handler | Keystrokes and taps wait behind computation. | Debounce appropriate work, chunk it, or move CPU-heavy tasks into a worker. |
| Importing every feature on initial load | Unused charts, maps, editors, and effects delay the first interaction. | Split by route or feature and load optional modules on demand. |
| Adding third-party widgets without auditing them | External scripts can add network requests, main-thread work, and privacy obligations. | Remove unnecessary vendors, delay non-critical integrations, and load after consent when required. |
| Preloading every font and image | Critical resources compete for limited bandwidth and connection slots. | Preload only resources needed for the initial viewport and verify the waterfall. |
| Using `loading="lazy"` on every image | The browser may defer the primary visual and worsen LCP. | Reserve lazy loading for below-the-fold media. |
| Omitting image dimensions | Content can shift when the image's intrinsic size becomes known. | Supply `width` and `height` or a stable aspect-ratio container. |
| Inserting a banner above the current content | Visible content moves unexpectedly and can cause accidental taps. | Reserve the region or place new content without shifting the reading position. |
| Ignoring font metric changes | A fallback-to-web-font swap can alter line wraps and layout. | Tune fallback metrics and verify real text at mobile widths. |
| Treating a CSS background as semantic content | Assistive technology cannot infer meaningful information from the background. | Use an `img` with suitable alternative text for informative imagery. |
| Assuming autoplay video always starts | Mobile browser policy, user settings, and data preferences may prevent playback. | Use a poster and ensure the static hero still communicates the message. |
| Rendering WebGL at full device pixel ratio | High-DPR screens can multiply pixel work dramatically. | Cap pixel ratio based on visual quality and target hardware. |
| Never disposing WebGL resources | GPU memory can accumulate across route changes or repeated mounts. | Dispose geometries, materials, textures, and renderer resources during teardown. |
| Running scroll logic on every event without a frame guard | Event bursts can enqueue redundant work. | Coalesce updates with `requestAnimationFrame` or use an observer. |
| Using a non-passive scroll listener when cancellation is unnecessary | The browser may need to wait to determine whether scrolling will be prevented. | Use `{ passive: true }` for listeners that never call `preventDefault()`. |
| Recreating observers on every interaction | Unnecessary observers and callbacks add overhead and complicate cleanup. | Reuse observers for a group of elements and disconnect them when the feature ends. |
| Measuring only on a high-end phone | CPU, GPU, and memory constraints are hidden. | Include representative mid-range devices and constrained network profiles. |
| Optimizing bytes while ignoring interaction latency | A small page can still feel frozen during synchronous JavaScript work. | Inspect long tasks and measure responsiveness around real interactions. |
| Removing all motion without considering design intent | The page may lose hierarchy and personality unnecessarily. | Reduce expensive effects first and preserve lightweight, purposeful transitions. |
| Using a worker for trivial work | Worker startup and message serialization can cost more than the computation. | Move work to a worker only when profiling shows meaningful main-thread pressure. |
| Chunking work but still forcing layout in every chunk | Yielding does not fix expensive layout and paint operations. | Separate data processing from rendering and batch DOM updates. |
| Keeping large event closures alive after route changes | Detached DOM and captured data can remain reachable. | Remove listeners and release references during teardown. |
| Testing only with a warm cache | First-time visitors pay for resources that the warm cache hides. | Test cold and warm navigation separately. |
| Treating a synthetic score as the user experience itself | Scores summarize selected conditions, not the full design or all devices. | Pair metrics with real-device interaction tests and visual review. |

## Mental Models

1. **Budget before polish:** Set measurable limits before adding effects that consume bandwidth, CPU, GPU, or memory.
2. **Measure the bottleneck:** Use traces and resource timing to find the expensive part instead of guessing.
3. **Main thread is a queue:** Long synchronous tasks delay input, rendering, and other work that users notice.
4. **Read, calculate, write:** Group layout reads and style mutations to reduce forced synchronous layout.
5. **Motion should be cheap:** Prefer transforms and opacity when they communicate the same visual change.
6. **Media has a real size:** Deliver the image, video, or canvas resolution the viewport and device can reasonably use.
7. **Optional means optional:** A secondary chart or animation should not block the core message or first interaction.
8. **Hidden work is still work:** Pause offscreen animation and clean up resources when features are no longer active.
9. **Stable layout builds trust:** Reserve media and embed space so controls do not move while users are tapping.
10. **Field data closes the loop:** Re-test after implementation and validate with real-world measurements when possible.

## Quick Reference

| Need | Recommended technique | Watch out for |
|---|---|---|
| Define targets | Document LCP, INP, CLS and payload budgets | Do not treat targets as universal guarantees |
| Diagnose slow startup | Inspect navigation timing and network waterfall | Timing numbers alone do not explain root cause |
| Find long tasks | Use Performance panel and Long Tasks API | API support and visibility vary |
| Keep input responsive | Split large work into chunks | Each chunk must remain small enough to yield |
| Process large datasets | Consider a Web Worker | Workers cannot access the DOM |
| Batch DOM insertion | Use `DocumentFragment` and one commit | Do not overcomplicate tiny updates |
| Prevent layout thrashing | Read geometry before style writes | Geometry reads may still trigger layout |
| Animate position | Prefer `transform` | Verify the design does not need reflow |
| Fade elements | Animate `opacity` | Avoid stacking excessive overlapping layers |
| Hint compositor work | Apply `will-change` selectively | Too many layers increase memory cost |
| Deliver card images | Use `srcset` and `sizes` | Make `sizes` match rendered CSS width |
| Reserve image space | Set `width`/`height` or `aspect-ratio` | Match the intended crop ratio |
| Defer lower media | Use `loading="lazy"` below the fold | Do not lazy-load the likely LCP image |
| Prioritize hero image | Consider `fetchpriority="high"` | Confirm it is truly critical |
| Change art direction | Use `<picture>` and media conditions | Keep a reliable fallback |
| Deliver decorative video | Use poster and muted inline playback | Autoplay can be blocked |
| Reduce video startup | Use `preload="none"` for optional video | Verify actual browser network behavior |
| Reduce 3D fill rate | Cap renderer pixel ratio | Recheck visual sharpness on high-DPR screens |
| Pause offscreen scenes | Use `IntersectionObserver` | Disconnect the observer at teardown |
| Split optional features | Use dynamic `import()` | Handle loading and failure states |
| Improve scroll handlers | Use passive listeners and rAF coalescing | Do not perform expensive DOM work each frame |
| Reveal sections | Use `IntersectionObserver` | Respect reduced-motion preferences |
| Avoid layout shifts | Reserve space for embeds and banners | A fixed minimum may waste space if oversized |
| Manage font swap | Tune fallback metrics and `font-display` | Test actual headline wrapping |
| Clean up animation | Cancel frames and remove listeners | Cleanup must run on route unmount |
| Release WebGL memory | Dispose GPU resources | Dispose shared resources only when no longer used |
| Test weak networks | Use throttling and cold cache | Include latency, not only bandwidth |
| Validate real users | Monitor field Web Vitals where appropriate | Respect consent and privacy requirements |
| Preserve accessibility | Keep content and controls usable without effects | Motion must not carry essential information alone |
| Keep fallback useful | Provide text, poster, or data table | Avoid a blank region when enhancement fails |
| Compare changes | Repeat the same test profile | A single run can be noisy |
| Choose image format | Use modern formats with fallbacks where needed | Verify quality and browser support |
| Limit third parties | Load only necessary integrations | Consent and vendor code can affect startup |
| Avoid unnecessary worker use | Profile first | Startup and serialization have cost |
| Reduce pointer event work | Coalesce visual updates to one frame | Do not delay essential input state |
| Audit route changes | Inspect memory and detached nodes | Repeated mount/unmount often exposes leaks |

## Build Challenge

### Project: Mobile-first creative portfolio performance pass

Build a responsive portfolio homepage for a fictional digital studio called **Northstar Assembly**. The page should have a high-impact hero, a six-project grid, one optional interactive data visualization, and a decorative animated canvas or 3D scene. The finished site must keep its core content usable when optional effects are unavailable.

**Requirements**

1. Create a semantic hero with a real heading, one-sentence positioning statement, and a clear primary action.
2. Use a responsive hero image with suitable mobile and desktop candidates, explicit dimensions, and a meaningful `sizes` value.
3. Do not lazy-load the hero image if it is the likely LCP element; make the choice explicit in a code comment.
4. Build six project cards with responsive images, fixed aspect ratios, `width` and `height`, and lazy loading for below-the-fold media.
5. Make the project grid responsive with CSS Grid rather than measuring each card in JavaScript.
6. Add one reveal-on-scroll effect using `IntersectionObserver`; ensure the content is visible when reduced motion is requested.
7. Add a reading-progress indicator or similarly small scroll effect, coalesced through `requestAnimationFrame`.
8. Add one optional chart or interactive feature that is loaded only after a user action.
9. Provide an accessible fallback for the chart, such as a data table that remains available before and after module failure.
10. Add a decorative video or WebGL scene only as progressive enhancement, with a static poster or image fallback.
11. If using WebGL, cap the renderer pixel ratio and pause rendering when the canvas is not visible.
12. Add cleanup for animation frames, event listeners, and observers when the page feature is removed.
13. Declare stable image and embed dimensions to prevent unexpected layout shifts.
14. Use a small, deliberate font-loading strategy; preload only a font needed for initial content.
15. Document a performance budget for LCP, INP, CLS, initial JavaScript, and critical images.
16. Test the page at a narrow viewport around 360–390 CSS pixels and at a wider tablet/desktop viewport.
17. Run one cold-cache test and one warm-cache test under a constrained network profile.
18. Capture a performance trace and identify at least one long task or rendering bottleneck before optimizing.
19. Make one evidence-based improvement and compare the same test profile before and after.
20. Confirm that the primary content and navigation remain usable with JavaScript disabled or optional modules blocked wherever practical.
21. Verify the experience with keyboard navigation and a screen reader-friendly content structure.
22. Check that touch interaction does not depend on hover-only states.
23. Confirm that no essential content is conveyed only through motion or a background image.
24. Write a short review note explaining which bottleneck was found, what changed, and which measurement improved.

**Expected output**

- A working responsive portfolio page.
- A reusable performance helper module for scroll scheduling and feature cleanup.
- Responsive image markup for hero and project cards.
- A progressive enhancement module for the optional chart or motion feature.
- A short test report with device/network conditions, baseline measurements, changes, and follow-up measurements.

**Success criteria**

- The hero message and primary action render without waiting for optional effects.
- Images reserve their layout space and select appropriately sized candidates.
- No decorative animation continues indefinitely while offscreen.
- The initial route does not download optional feature code until it is needed.
- The implementation avoids obvious forced-layout loops and repeated per-item DOM commits.
- The page remains understandable with reduced motion enabled.
- The report explains the measured bottleneck rather than claiming success from visual intuition alone.
- A reviewer can reproduce the test conditions and understand the trade-offs.

### Senior review checklist

- Is the chosen LCP element obvious and prioritized correctly?
- Are the biggest image and script costs measured rather than assumed?
- Do all scroll and animation loops have a clear stop condition?
- Are event listeners, observers, and GPU resources cleaned up?
- Is the first meaningful interaction independent of optional enhancements?
- Does the page stay stable while fonts, images, and modules load?
- Are fallback experiences designed rather than accidental?
- Were tests repeated on representative mobile conditions?
- Are any optimizations more complex than the problem they solve?
- Does the implementation preserve the intended visual quality within the measured budget?


## Diagnostic Recipes

### Recipe 1: Report resource cost without leaking query strings

**Intent:** Use a local diagnostic in development to identify oversized resources while keeping output readable.

```js
export function summarizeResources() {
  return performance.getEntriesByType("resource").map((resource) => {
    const url = new URL(resource.name);

    return {
      path: url.pathname,
      kind: resource.initiatorType,
      durationMs: Math.round(resource.duration),
      transferBytes: resource.transferSize || 0,
      decodedBodyBytes: resource.decodedBodySize || 0
    };
  }).sort((a, b) => b.transferBytes - a.transferBytes);
}
```

```js
console.table(summarizeResources().slice(0, 20));
```

Cross-origin resources may expose limited timing details unless the server sends suitable timing headers. A zero transfer size does not necessarily mean the resource cost nothing; it may be cached or restricted by timing policy.

### Recipe 2: Mark a user-visible interaction

**Intent:** Place performance marks around a meaningful action, such as opening a mobile menu or applying a project filter.

```js
export async function applyProjectFilter(filterButton, updateProjects) {
  performance.mark("project-filter-start");

  try {
    await updateProjects();
  } finally {
    performance.mark("project-filter-end");
    performance.measure(
      "project-filter-update",
      "project-filter-start",
      "project-filter-end"
    );
    filterButton.removeAttribute("aria-busy");
  }
}
```

```js
const latestMeasure = performance
  .getEntriesByName("project-filter-update", "measure")
  .at(-1);

if (latestMeasure) {
  console.info(`Filter update: ${latestMeasure.duration.toFixed(1)} ms`);
}
```

The measured duration is useful for comparing implementations, but it is not the same as INP. Input delay, processing, and presentation delay all contribute to the user's perceived interaction.

### Recipe 3: Check support before enhancing

**Intent:** Keep unsupported browser features from breaking the base page.

```js
export function supportsOptionalEnhancement() {
  return (
    "IntersectionObserver" in window &&
    "requestAnimationFrame" in window &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
```

```js
if (supportsOptionalEnhancement()) {
  import("./ambient-motion.js").then(({ mountAmbientMotion }) => {
    mountAmbientMotion(document.querySelector("[data-ambient-motion]"));
  });
}
```

Feature detection should answer whether the required capability exists. Avoid browser-name checks when a capability check is available.

### Recipe 4: Keep loading state stable

**Intent:** Avoid content jumps while an optional module is being loaded.

```css
[data-feature-panel] {
  min-height: 12rem;
  border-radius: 1rem;
  background: color-mix(in srgb, currentColor 5%, transparent);
}

[data-feature-panel][aria-busy="true"] {
  cursor: progress;
}
```

```js
async function mountOptionalFeature(panel, importer) {
  panel.setAttribute("aria-busy", "true");

  try {
    const feature = await importer();
    await feature.mount(panel);
  } catch {
    panel.textContent = "This interactive feature is unavailable right now.";
  } finally {
    panel.removeAttribute("aria-busy");
  }
}
```

The minimum height should reflect the real design footprint, not an arbitrary large spacer that pushes the rest of the page far below the fold.

### Recipe 5: Prefer data-only work in a worker

**Intent:** Keep DOM updates on the main thread but move CPU-heavy sorting off it.

```js
// ranking-worker.js
self.addEventListener("message", ({ data }) => {
  const ranked = [...data.projects].sort((a, b) => b.score - a.score);
  self.postMessage(ranked.map(({ id, title, score }) => ({ id, title, score })));
});
```

```js
// portfolio-ranking.js
const rankingWorker = new Worker(
  new URL("./ranking-worker.js", import.meta.url),
  { type: "module" }
);

export function rankPortfolioProjects(projects) {
  return new Promise((resolve, reject) => {
    rankingWorker.onmessage = ({ data }) => resolve(data);
    rankingWorker.onerror = reject;
    rankingWorker.postMessage({ projects });
  });
}
```

For very large payloads, serialization and copying can become a cost. Measure before introducing worker complexity, and terminate a dedicated worker when the feature is permanently disposed.

### Recipe 6: Dispose a dedicated worker

**Intent:** Ensure a feature that is no longer mounted does not keep background work alive.

```js
export function createRankingService() {
  const worker = new Worker(
    new URL("./ranking-worker.js", import.meta.url),
    { type: "module" }
  );

  return {
    rank(projects) {
      return new Promise((resolve, reject) => {
        worker.onmessage = ({ data }) => resolve(data);
        worker.onerror = reject;
        worker.postMessage({ projects });
      });
    },
    dispose() {
      worker.terminate();
    }
  };
}
```

A shared worker service needs reference-aware ownership; one component should not terminate work another active component still needs.

### Recipe 7: Audit image candidate selection

**Intent:** Confirm the browser selects the expected image for a specific rendered width.

```js
export function inspectImage(image) {
  const rect = image.getBoundingClientRect();

  return {
    currentSource: image.currentSrc,
    renderedWidth: Math.round(rect.width),
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    complete: image.complete
  };
}
```

```js
document.querySelectorAll("img").forEach((image) => {
  console.log(inspectImage(image));
});
```

The selected candidate depends on `srcset`, `sizes`, device pixel ratio, and browser decisions. Do not force a tiny candidate simply to reduce bytes if it becomes visibly blurry.

### Recipe 8: Use content visibility for long pages

**Intent:** Let the browser skip rendering work for distant sections when the page has many independent content blocks.

```css
.case-study-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 42rem;
}
```

```css
/* Keep interactive content and sticky elements under test before applying containment broadly. */
.case-study-section--interactive {
  content-visibility: visible;
}
```

`content-visibility` can help long documents, but intrinsic size estimates influence scroll geometry. Test anchor navigation, focus movement, and sections with sticky descendants before applying it across the whole site.

### Recipe 9: Make a costly shadow cheaper

**Intent:** Reduce a large, blurred shadow that repaints across a large mobile surface.

```css
/* Broad, high-blur shadows can be expensive on many overlapping cards. */
.project-card {
  box-shadow: 0 1.5rem 4rem rgb(0 0 0 / 0.22);
}
```

```css
/* A restrained shadow often keeps the same hierarchy with less painted area. */
.project-card {
  box-shadow: 0 0.5rem 1.25rem rgb(0 0 0 / 0.12);
}
```

This is a visual trade-off, not a guaranteed rendering optimization in every browser. Compare paint flashing and frame performance on the target device.

### Recipe 10: Respect save-data signals carefully

**Intent:** Avoid automatically loading optional media when the browser exposes a data-saving preference.

```js
export function shouldLoadAmbientMedia() {
  const connection = navigator.connection;

  return !connection?.saveData;
}
```

```js
if (shouldLoadAmbientMedia()) {
  import("./ambient-video.js").then(({ mountAmbientVideo }) => {
    mountAmbientVideo(document.querySelector("[data-ambient-video]"));
  });
}
```

The Network Information API is not available everywhere. The core content must remain complete when the signal is absent or unavailable.

### Recipe 11: Use a bounded event handler

**Intent:** Avoid repeating expensive work when a user taps a control repeatedly during module loading.

```js
export function createSingleFlightAction(button, action) {
  let pending = false;

  return async function runAction() {
    if (pending) return;

    pending = true;
    button.disabled = true;

    try {
      await action();
    } finally {
      pending = false;
      button.disabled = false;
    }
  };
}
```

```js
const openFilters = document.querySelector("[data-open-filters]");
openFilters.addEventListener(
  "click",
  createSingleFlightAction(openFilters, async () => {
    const { mountFilters } = await import("./filters.js");
    await mountFilters(document.querySelector("[data-filter-panel]"));
  })
);
```

A disabled state prevents duplicate work and also communicates that the action is in progress. Always restore the control after a failure.

### Recipe 12: Verify reduced-motion behavior

**Intent:** Ensure reduced motion removes optional movement without hiding content.

```js
const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");

function applyMotionPreference() {
  document.documentElement.classList.toggle(
    "reduce-motion",
    motionPreference.matches
  );
}

applyMotionPreference();
motionPreference.addEventListener("change", applyMotionPreference);
```

```css
.reduce-motion .ambient-orbit,
.reduce-motion .floating-decoration {
  animation: none !important;
  transition: none !important;
}
```

Use a project-owned class for optional effects and avoid broad rules that accidentally disable focus indicators or state transitions needed for comprehension.

### Recipe 13: Avoid duplicate initialization

**Intent:** Prevent event listeners and animation loops from multiplying if a component mounts more than once.

```js
export function mountFilterPanel(panel) {
  if (panel.dataset.initialized === "true") return () => {};

  panel.dataset.initialized = "true";

  const onChange = () => {
    panel.dispatchEvent(new CustomEvent("filters:change", {
      bubbles: true,
      detail: { selected: panel.querySelectorAll("input:checked").length }
    }));
  };

  panel.addEventListener("change", onChange);

  return () => {
    panel.removeEventListener("change", onChange);
    delete panel.dataset.initialized;
  };
}
```

Explicit lifecycle ownership is more reliable than hoping a framework or navigation layer will clean up manually attached handlers.

### Recipe 14: Compare before and after under identical conditions

**Intent:** Make the performance result reproducible rather than relying on memory.

```js
export const testRecord = {
  route: "/work/",
  viewport: "390x844 CSS px",
  device: "representative mid-range Android",
  network: "constrained 4G profile",
  cache: "cold",
  runs: 5,
  notes: "Record median values and keep the same interaction sequence."
};
```

```js
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return null;

  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
```

A median reduces the influence of one unusually noisy run. Preserve raw runs as well, because variance can itself reveal a fragile implementation.

### Recipe 15: Make the static fallback visually intentional

**Intent:** Keep the hero art direction coherent when video or WebGL is unavailable.

```html
<div class="artwork-frame" data-ambient-motion>
  <img
    class="artwork-frame__fallback"
    src="/images/northstar-still.webp"
    width="1200"
    height="900"
    alt="Abstract folded metallic form on a deep blue field"
  />
</div>
```

```css
.artwork-frame {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: clip;
  border-radius: 1.25rem;
  background: #101522;
}

.artwork-frame__fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

```js
async function enhanceArtwork(frame) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    const { mountArtwork } = await import("./northstar-artwork.js");
    await mountArtwork(frame);
  } catch (error) {
    // The existing image is the designed fallback, so failure is not a broken layout.
    console.warn("Artwork enhancement skipped", error);
  }
}
```

A fallback should be part of the design system, not a generic gray rectangle that appears only when something fails.

## Performance Review Workflow

### Step 1: Write down the scenario

Record the route, viewport, browser, device class, network profile, cache state, and exact interaction. “The homepage is slow” is too broad to reproduce. “On a 390-pixel viewport with a cold cache, opening the work filter takes 450 ms after the hero finishes loading” is actionable.

### Step 2: Identify the user's first meaningful task

For a studio portfolio, that may be seeing the headline, opening a project, or using the mobile menu. For a commerce page, it may be viewing a product and adding it to the cart. Optimize the route around the task that matters, not a decorative animation that runs before it.

### Step 3: Capture a baseline

Measure LCP, INP where field data is available, CLS, total transfer, initial JavaScript, and interaction duration. Repeat the test. Save a trace and note which resources are critical. Keep the same device and test conditions for the comparison.

### Step 4: Choose one dominant bottleneck

Do not change image compression, JavaScript splitting, animation properties, and font loading in one untracked pass. Select the largest supported cause, make a focused change, and measure again. Multiple simultaneous changes make it harder to know what actually helped.

### Step 5: Verify quality and fallback behavior

Performance improvements can damage image quality, remove meaningful motion, or make controls harder to understand. Inspect the page at its actual mobile size, enable reduced motion, block optional scripts, and test the keyboard path. A faster but incomplete page is not a successful result.

### Step 6: Document the trade-off

Write down what changed, which measurement improved, which metric stayed the same, and any visual compromise. Future design work should be able to preserve the budget without reverse-engineering why a seemingly small effect was omitted.

## Field Notes for Creative Websites

- **Portfolio galleries:** Prioritize the first visible project images; lazy-load the rest and use a crop ratio that matches the design.
- **Agency landing pages:** Keep the hero message in HTML and make large animation layers optional.
- **Restaurant and hospitality sites:** Compress food photography carefully, because image quality influences trust; deliver the right crop and resolution rather than applying extreme compression blindly.
- **Product launches:** Use a static poster and defer long video or 3D scenes until the core message is present.
- **Editorial sites:** Reserve ad and embed slots, avoid shifting the reading position, and keep scroll-linked decoration lightweight.
- **Dashboard experiences:** Split large charting libraries and retain a table or summary that works without the chart.
- **Interactive portfolios:** Pause WebGL when hidden and clean up resources when navigating between projects.
- **Mobile navigation:** Keep the menu response immediate; do not wait for a decorative transition library to load before exposing navigation choices.

## Additional Implementation Patterns

### Budget resource bytes in a build report

```js
const assetBudget = { js: 180 * 1024, css: 70 * 1024, images: 500 * 1024 };
function exceedsBudget(asset) {
  return asset.bytes > (assetBudget[asset.type] ?? Infinity);
}
```

### Use a small timeout only for non-critical analytics

```js
function loadAnalyticsAfterIdle() {
  const load = () => import("./analytics.js");
  if ("requestIdleCallback" in window) {
    requestIdleCallback(load, { timeout: 2000 });
  } else {
    setTimeout(load, 1200);
  }
}
```

### Avoid starting a second animation loop

```js
function createSingleLoop(draw) {
  let frame = 0;
  let running = false;
  function tick(time) {
    if (!running) return;
    draw(time);
    frame = requestAnimationFrame(tick);
  }
  return {
    start() {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    }
  };
}
```

### Decode a near-viewport image before a transition

```js
async function prepareImage(image) {
  if (typeof image.decode === "function") {
    try { await image.decode(); } catch { /* Keep the existing fallback. */ }
  }
}
```

### Keep decorative content out of accessibility output

```html
<div class="grain-overlay" aria-hidden="true"></div>
<canvas class="ambient-canvas" aria-hidden="true"></canvas>
```

### Use a low-cost hover effect only where hover exists

```css
@media (hover: hover) and (pointer: fine) {
  .work-card:hover .work-card__title {
    text-decoration-thickness: 0.12em;
  }
}
```

### Avoid costly filters on a large moving surface

```css
/* Keep blur local to a small ornament instead of the entire hero. */
.hero-orbit__glow {
  filter: blur(1.25rem);
  opacity: 0.45;
}
```

### Guard against a zero-sized canvas

```js
function resizeCanvas(canvas, renderer, camera, width, height) {
  if (width <= 0 || height <= 0) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
```

### Limit repeated status announcements

```js
function announceOnce(status, message) {
  if (status.dataset.announced === "true") return;
  status.textContent = message;
  status.dataset.announced = "true";
}
```

### Remove a stale loading state on cancellation

```js
function cancelFeature(panel, controller) {
  controller.abort();
  panel.removeAttribute("aria-busy");
}
```

### Abort a fetch when a feature closes

```js
async function loadProjectDetails(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}
```

### Use a bounded image placeholder

```css
.project-image-placeholder {
  aspect-ratio: 3 / 2;
  background: linear-gradient(110deg, #e8e5e0 20%, #f5f3ef 38%, #e8e5e0 58%);
}
```

### Avoid animating every property

```css
/* Explicit properties avoid accidental animation of layout-related values. */
.nav-panel {
  transition: opacity 180ms ease, transform 180ms ease;
}
```

### Schedule a non-urgent cleanup after interaction

```js
function scheduleCleanup(cleanup) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(cleanup, { timeout: 1500 });
  } else {
    setTimeout(cleanup, 250);
  }
}
```

### Track interaction duration without changing production behavior

```js
function measureAction(name, action) {
  const start = performance.now();
  const result = action();
  return Promise.resolve(result).finally(() => {
    console.debug(`${name}: ${(performance.now() - start).toFixed(1)}ms`);
  });
}
```

### Use one observer for a set of lazy features

```js
const featureObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.dispatchEvent(new CustomEvent("feature:visible"));
    observer.unobserve(entry.target);
  }
});
```

### Do not block the hero on font readiness

```js
document.fonts.ready.then(() => {
  document.documentElement.classList.add("fonts-ready");
});
```

### Use a timeout to avoid indefinite skeleton UI

```js
function revealFallbackAfter(panel, delay = 2500) {
  const id = setTimeout(() => {
    panel.classList.add("fallback-visible");
  }, delay);
  return () => clearTimeout(id);
}
```

### Limit a canvas backing store

```js
function setCanvasResolution(canvas, cssWidth, cssHeight, ratio = 1.5) {
  const scale = Math.min(window.devicePixelRatio || 1, ratio);
  canvas.width = Math.round(cssWidth * scale);
  canvas.height = Math.round(cssHeight * scale);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  return scale;
}
```

### Coalesce resize work

```js
function onResizeFrame(callback) {
  let frame = 0;
  return () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      callback();
    });
  };
}
```


### Implementation note 1: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision1(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 2: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision2(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 3: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision3(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 4: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision4(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 5: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision5(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 6: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision6(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 7: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision7(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.

### Implementation note 8: make a performance choice explicit

This example demonstrates a reviewable implementation choice. Keep the decision close to the code so another developer can tell whether the behavior is deliberate or accidental.

```js
export function performanceDecision8(element, enabled) {
  if (!element) return;
  element.dataset.performanceMode = enabled ? "enhanced" : "baseline";
  element.classList.toggle("is-enhanced", enabled);
}
```

```css
[data-performance-mode="baseline"] .optional-decoration {
  display: none;
}

[data-performance-mode="enhanced"] .optional-decoration {
  opacity: 1;
  transform: translate3d(0, 0, 0);
}
```

The baseline state should retain all essential information and controls. The enhanced state may add polish, but it should not become the only path to understanding or completing the page.
