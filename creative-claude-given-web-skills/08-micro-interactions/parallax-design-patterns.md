# SKILL: parallax-design-patterns
**Layer:** 08 — Micro-Interactions
**Goal:** Design restrained, responsive parallax depth effects that reinforce visual hierarchy without harming readability, accessibility, performance, or scroll control.

---

## Why This Matters (Senior Perspective)

Parallax creates a sense of depth by moving visual layers at different rates as the visitor scrolls or moves a pointer. Used carefully, it can make a portfolio hero feel dimensional, give a case-study image a cinematic entrance, or separate foreground typography from a background composition. It is also easy to overuse. If every layer moves independently, the page can feel unstable, text can drift away from its context, and users may struggle to track the content they came to read. On mobile, oversized layers can cause overflow, clipping, battery drain, and inconsistent motion as browser chrome changes the viewport.

A beginner often starts with a scroll listener, multiplies `scrollY` by arbitrary numbers, and applies transforms directly to many elements. A senior developer first defines the visual purpose of each layer, sets a bounded motion range, chooses the least expensive implementation, and establishes a static fallback. They check how the composition behaves at narrow widths, with reduced motion enabled, when the page is loaded halfway down, and when content changes size. They also know that a parallax effect must never become a navigation or readability problem: the headline remains legible, the foreground image does not cover controls, and the document's real layout remains stable.

For creative portfolio and client work, parallax is an accent, not the whole experience. Use it to communicate hierarchy between background atmosphere, decorative geometry, and foreground content. Prefer CSS scroll-driven animations when the target browser support and effect allow it; use `IntersectionObserver` for simple state changes, and use a carefully throttled `requestAnimationFrame` loop only when a continuous scroll-linked value is genuinely required. Keep movement subtle, avoid layout properties, respect `prefers-reduced-motion`, and ensure the page is complete when animation is disabled. The goal is depth that supports the story—not a page that fights the visitor's scroll.

---

## Core Concepts

### 1. Establish the Static Composition First

The page must look intentional before any parallax is applied. Define the layer positions, crop, stacking order, contrast, and responsive behavior in the normal layout; animation should enhance an already-good composition.

```html
<section class="hero-scene" aria-labelledby="hero-title">
  <div class="hero-scene__backdrop" aria-hidden="true"></div>
  <figure class="hero-scene__art" aria-hidden="true">
    <img src="/images/orbital-form.webp" width="1200" height="1200" alt="">
  </figure>
  <div class="hero-scene__content">
    <p class="eyebrow">Independent digital studio</p>
    <h1 id="hero-title">Ideas with a sense of depth.</h1>
    <p>Strategy, design, and interactive experiences.</p>
    <a class="button" href="#selected-work">Explore selected work</a>
  </div>
</section>
```

```css
.hero-scene {
  position: relative;
  isolation: isolate;
  min-height: min(52rem, 100svh);
  display: grid;
  align-items: center;
  overflow: clip;
  background: #080a13;
  color: #fff;
}

.hero-scene__backdrop,
.hero-scene__art {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero-scene__backdrop {
  z-index: -2;
  background:
    radial-gradient(circle at 70% 35%, rgb(77 87 210 / 35%), transparent 38%),
    linear-gradient(135deg, #080a13, #11152a);
}

.hero-scene__art {
  z-index: -1;
  inset: 8% 2% auto auto;
  width: min(58vw, 48rem);
  aspect-ratio: 1;
  margin: 0;
}

.hero-scene__art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.hero-scene__content {
  position: relative;
  z-index: 1;
  width: min(100% - 3rem, 76rem);
  margin-inline: auto;
  padding-block: 7rem;
}
```

**Naive approach:** Add transforms before deciding how the static layers should be positioned, then keep adjusting offsets until one viewport looks good.

**Correct approach:** Build the static layout, test at desktop and mobile widths, and only then add a bounded motion value.

**Gotcha:** A transformed element can create a stacking context and affect fixed-position descendants. Keep fixed navigation and dialogs outside transformed parallax wrappers where possible.

### 2. Give Each Layer a Clear Depth Role

Parallax is most convincing when each layer has a purpose and a different, restrained motion range. Background atmosphere should move least, decorative art can move a little more, and foreground text should usually remain stable or move only subtly.

```css
:root {
  --parallax-background-range: 0.04;
  --parallax-art-range: 0.12;
  --parallax-foreground-range: 0.02;
}
```

**Naive approach:** Apply the same large translation to every layer.

**Correct approach:** Define a depth hierarchy and make the background move less than the focal art. Use the smallest range that produces a perceptible effect.

**Gotcha:** Too much differential movement can make layers appear detached from one another. Depth is a relationship, not a contest over which element moves furthest.

### 3. Prefer Transform-Based Motion

Use `transform` to move visual layers without changing their layout position. Avoid animating `top`, `left`, `margin`, or height for continuous parallax.

```css
.parallax-layer {
  transform: translate3d(0, var(--parallax-y, 0px), 0);
  will-change: transform;
}
```

**Naive approach:**

```js
element.style.top = `${scrollY * 0.2}px`;
```

**Correct approach:**

```js
element.style.setProperty("--parallax-y", `${offset}px`);
```

The custom property is then consumed by a transform. For a small number of layers, this avoids layout changes on every update.

**Gotcha:** `will-change` can increase memory use and should not be applied to every element permanently. Add it only when profiling shows a benefit and remove it when the effect is inactive if needed.

### 4. Keep Scroll-Linked Motion Bounded

Parallax should have a known maximum range. Without bounds, long pages can send a layer far outside its intended composition.

```js
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getParallaxOffset(sectionRect, viewportHeight, strength = 0.08) {
  const progress = (viewportHeight - sectionRect.top) /
    (viewportHeight + sectionRect.height);
  const centeredProgress = progress - 0.5;

  return clamp(centeredProgress * sectionRect.height * strength, -80, 80);
}
```

**Naive approach:** `offset = window.scrollY * 0.4`, which grows for the entire document.

**Correct approach:** Calculate progress relative to the relevant section and clamp the result to a designed range.

**Gotcha:** `getBoundingClientRect()` returns viewport-relative geometry. Do not mix it directly with document-relative `scrollY` unless the coordinate conversion is deliberate.

### 5. Use CSS Scroll-Driven Animations When Appropriate

CSS scroll-driven animations can link animation progress to a scroll timeline without requiring a JavaScript scroll loop. They are a strong option for simple effects when your browser support policy allows them.

```html
<section class="parallax-section" aria-labelledby="parallax-heading">
  <div class="parallax-section__art" aria-hidden="true"></div>
  <div class="parallax-section__copy">
    <h2 id="parallax-heading">A slower way to look closer</h2>
    <p>Movement gives the composition depth while the copy stays anchored.</p>
  </div>
</section>
```

```css
.parallax-section {
  position: relative;
  min-height: 80vh;
  overflow: clip;
  isolation: isolate;
}

.parallax-section__art {
  position: absolute;
  inset: -8% 0;
  z-index: -1;
  background: radial-gradient(circle at 70% 40%, #4d57d2, #090b16 65%);
  transform: translateY(0);
}

@supports (animation-timeline: view()) {
  .parallax-section__art {
    animation: parallax-drift linear both;
    animation-timeline: view();
    animation-range: entry 0% exit 100%;
  }

  @keyframes parallax-drift {
    from { transform: translateY(-3%); }
    to { transform: translateY(3%); }
  }
}
```

**Naive approach:** Assume every browser supports scroll timelines and provide no fallback.

**Correct approach:** Keep the static composition valid and put the enhancement inside `@supports`.

**Gotcha:** Support for scroll-driven animation features varies by browser version. Test the exact properties you use, including `animation-timeline` and `animation-range`, rather than relying on a broad assumption.

### 6. Use IntersectionObserver for Activation, Not Continuous Progress

`IntersectionObserver` is useful for knowing whether a section is near the viewport, enabling or disabling an effect, or revealing a static state. It is not a precise continuous scroll-progress API.

```js
const activeSections = new Set();

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) activeSections.add(entry.target);
    else activeSections.delete(entry.target);
  });
}, { rootMargin: "100px 0px", threshold: 0 });
```

**Naive approach:** Try to infer exact scroll progress from the number of observer callbacks.

**Correct approach:** Use observer entries to activate a section, and use a suitable scroll timeline or animation frame calculation for continuous progress.

**Gotcha:** Observer callbacks are asynchronous and are not emitted for every scroll position. Do not use them as a replacement for a progress signal.

### 7. Batch Scroll Work with requestAnimationFrame

When a JavaScript-controlled effect is necessary, schedule at most one visual update per animation frame. Avoid reading layout and writing styles repeatedly inside the same event handler for every layer.

```js
let frameId = 0;

function scheduleParallaxUpdate() {
  if (frameId) return;
  frameId = requestAnimationFrame(() => {
    frameId = 0;
    updateParallaxLayers();
  });
}

window.addEventListener("scroll", scheduleParallaxUpdate, { passive: true });

function cleanupParallax() {
  window.removeEventListener("scroll", scheduleParallaxUpdate);
  if (frameId) cancelAnimationFrame(frameId);
}
```

**Naive approach:** Call `getBoundingClientRect()` for every element and write multiple style properties directly on every scroll event.

**Correct approach:** Coalesce events, measure the active section once per frame, calculate values in memory, then write style values.

**Gotcha:** `requestAnimationFrame` aligns work to frames; it does not make expensive work free. Reduce the number of active layers and profile on real devices.

### 8. Respect Reduced Motion at Both CSS and JavaScript Levels

A CSS override should remove movement, and JavaScript should avoid starting unnecessary animation loops. The static layout must remain complete.

```css
@media (prefers-reduced-motion: reduce) {
  .parallax-layer,
  .hero-scene__art,
  .parallax-section__art {
    animation: none !important;
    transform: none !important;
    will-change: auto;
  }
}
```

```js
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function shouldRunParallax() {
  return !motionPreference.matches;
}
```

**Naive approach:** Disable a transition in CSS but leave a JavaScript loop writing transforms continuously.

**Correct approach:** Stop the loop when reduced motion is enabled and restart only if the preference changes back and the effect is still needed.

**Gotcha:** Avoid making the non-animated layout worse to preserve the animated version's geometry. Test the static composition as a real design state.

### 9. Avoid Horizontal Overflow and Crop Failures

Parallax layers often extend beyond their container to prevent empty edges while moving. That extra size must not create horizontal scrolling or cover adjacent content.

```css
.parallax-stage {
  position: relative;
  overflow: clip;
  isolation: isolate;
}

.parallax-stage__image {
  position: absolute;
  inset: -6% -4%;
  width: 108%;
  height: 112%;
  object-fit: cover;
  max-width: none;
}
```

**Naive approach:** Make an image 140% wide and allow the overflow to escape the section.

**Correct approach:** Crop inside a dedicated stage and test at narrow widths. Keep the foreground content in normal flow.

**Gotcha:** `overflow: hidden` and `overflow: clip` differ in scrolling and formatting behavior. Choose based on your browser support requirements and whether a programmatic scroll container is needed.

### 10. Protect Text Contrast and Foreground Stability

The visual layers should not reduce the legibility of text or move essential controls away from expected positions. Use a stable content layer, a contrast overlay, and a deliberate stacking context.

```css
.hero-scene {
  isolation: isolate;
}

.hero-scene__art {
  z-index: -1;
}

.hero-scene__content {
  position: relative;
  z-index: 1;
  max-width: 42rem;
}

.hero-scene::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgb(5 7 15 / 92%), transparent 90%);
}
```

**Naive approach:** Let moving art pass behind text and assume the text will remain readable at every frame.

**Correct approach:** Test contrast at the start, middle, and end of the effect; add a controlled overlay or reposition art where necessary.

**Gotcha:** A decorative layer with a large z-index can intercept pointer input or cover focus rings. Use `pointer-events: none` for non-interactive decoration and keep interactive controls in a clear foreground layer.

### 11. Account for Mobile Viewport Changes

Mobile browser UI can change the visible viewport height as browser chrome expands or collapses. Fixed `100vh` assumptions and large moving layers may produce awkward crops.

```css
.parallax-hero {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  align-items: center;
}
```

**Naive approach:** Set a rigid `height: 100vh` and place the focal art at a fixed pixel offset.

**Correct approach:** Prefer a flexible `min-height`, use modern viewport units with a fallback, and adjust the composition at narrow breakpoints.

**Gotcha:** `svh`, `lvh`, and `dvh` represent different viewport models. Choose the one that matches your desired behavior and test actual mobile browsers; do not substitute one blindly.

### 12. Keep Pointer Parallax Optional and Low-Amplitude

Pointer-driven depth can add subtle responsiveness to a hero composition, but it must not interfere with clicks or create motion that feels detached from the cursor.

```js
function bindPointerParallax(stage, layers) {
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!finePointer.matches || reducedMotion.matches) return () => {};

  function onPointerMove(event) {
    const rect = stage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    layers.forEach(({ element, strength }) => {
      element.style.setProperty("--pointer-x", `${x * strength}px`);
      element.style.setProperty("--pointer-y", `${y * strength}px`);
    });
  }

  stage.addEventListener("pointermove", onPointerMove, { passive: true });

  return () => stage.removeEventListener("pointermove", onPointerMove);
}
```

```css
.pointer-layer {
  transform: translate3d(var(--pointer-x, 0), var(--pointer-y, 0), 0);
}
```

**Naive approach:** Apply large movement to the whole hero or listen to mouse events on touch devices.

**Correct approach:** Gate the effect to fine pointers, cap strengths to small values, and provide a cleanup function.

**Gotcha:** If pointer movement updates too many elements, it can cause visible lag. Use a frame scheduler if the measured workload is high and avoid writing values that have not changed meaningfully.

### 13. Avoid Transforming Elements That Contain Fixed UI

A transformed ancestor can establish a containing block for fixed-position descendants. This can make a “fixed” menu behave as if it were attached to the transformed layer.

```html
<header class="site-header">
  <a href="/" class="site-logo">Studio North</a>
  <nav aria-label="Main navigation">
    <a href="#work">Work</a>
    <a href="#about">About</a>
  </nav>
</header>

<main>
  <section class="parallax-stage" aria-labelledby="stage-title">
    <div class="parallax-stage__art" aria-hidden="true"></div>
    <h1 id="stage-title">Work that moves with purpose.</h1>
  </section>
</main>
```

**Naive approach:** Apply `transform` to the entire page wrapper, including a fixed header, drawer, or dialog.

**Correct approach:** Transform only decorative layers and keep global fixed UI outside transformed ancestors.

**Gotcha:** `filter`, `perspective`, and some containment properties can also affect containing-block or stacking behavior. If fixed UI stops behaving as expected, inspect all ancestors rather than only looking for `transform`.

### 14. Integrate a Full Parallax Scene with a Safe Fallback

This example combines a static layered hero, a small CSS scroll-driven enhancement, responsive composition, and reduced-motion behavior. The design remains useful even when the browser does not support scroll timelines.

```html
<section class="studio-hero" aria-labelledby="studio-hero-title">
  <div class="studio-hero__glow" aria-hidden="true"></div>
  <figure class="studio-hero__orb" aria-hidden="true">
    <img src="/images/abstract-orb.webp" width="1000" height="1000" alt="">
  </figure>
  <div class="studio-hero__content">
    <p class="eyebrow">Design / Engineering / Motion</p>
    <h1 id="studio-hero-title">Digital experiences with dimension.</h1>
    <p>We shape useful products with a strong point of view.</p>
    <a class="button" href="#work">Explore our work</a>
  </div>
</section>
```

```css
.studio-hero {
  position: relative;
  display: grid;
  align-items: center;
  min-height: min(54rem, 100svh);
  padding: clamp(4rem, 10vw, 9rem) max(1.25rem, calc((100vw - 76rem) / 2));
  isolation: isolate;
  overflow: clip;
  background: #070812;
  color: #f8f8ff;
}

.studio-hero__glow {
  position: absolute;
  inset: -10%;
  z-index: -2;
  background: radial-gradient(circle at 70% 35%, #373b91, transparent 45%);
}

.studio-hero__orb {
  position: absolute;
  inset: 5% 0 auto auto;
  z-index: -1;
  width: min(58vw, 48rem);
  aspect-ratio: 1;
  margin: 0;
  pointer-events: none;
}

.studio-hero__orb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.studio-hero__content {
  position: relative;
  z-index: 1;
  max-width: 43rem;
}

.studio-hero h1 {
  max-width: 12ch;
  font-size: clamp(3rem, 7vw, 6.5rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

@supports (animation-timeline: view()) {
  .studio-hero__orb {
    animation: orb-drift linear both;
    animation-timeline: view();
    animation-range: entry 0% exit 100%;
  }

  @keyframes orb-drift {
    from { transform: translate3d(0, -2%, 0) scale(1.02); }
    to { transform: translate3d(0, 3%, 0) scale(1); }
  }
}

@media (max-width: 48rem) {
  .studio-hero {
    min-height: 42rem;
    align-items: end;
    padding-block: 7rem 4rem;
  }

  .studio-hero__orb {
    top: 2%;
    right: -18%;
    width: 90vw;
    opacity: 0.7;
  }
}

@media (prefers-reduced-motion: reduce) {
  .studio-hero__orb {
    animation: none !important;
    transform: none !important;
  }
}
```

**Naive approach:** Make the entire hero scroll, scale, blur, and rotate while the headline moves independently.

**Correct approach:** Choose one focal layer, use a small motion range, keep the content stable, and retain a high-quality static composition.

**Gotcha:** A `view()` timeline is based on the element's visibility progression and may not map exactly to document scroll in the way a custom scroll formula does. Test the timing with the section's actual height and content.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: CSS-Only Scroll-Driven Background

**What it does:** Moves a decorative background layer through a view timeline when the browser supports scroll-driven animations.

**When to use it:** A self-contained section with a background gradient or decorative shape, where a static fallback is acceptable.

```css
.parallax-background {
  background:
    radial-gradient(circle at 70% 30%, rgb(90 100 240 / 55%), transparent 35%),
    #090a14;
}

@supports (animation-timeline: view()) {
  .parallax-background {
    animation: background-drift linear both;
    animation-timeline: view();
    animation-range: entry 0% exit 100%;
  }

  @keyframes background-drift {
    from { background-position: 50% 0%; }
    to { background-position: 50% 100%; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .parallax-background {
    animation: none;
  }
}
```

Keep the animated area small and verify that the animated property is performant on target devices. If background-position causes excessive repainting, animate a separate transform layer instead.

### Pattern 2: Bounded JavaScript Scroll Parallax

**What it does:** Calculates a small transform based on the target section's position and clamps it to a fixed range.

**When to use it:** The design needs a custom scroll relationship that cannot be expressed cleanly with a CSS timeline and JavaScript support is acceptable.

```js
export function mountBoundedParallax(section, layer, {
  strength = 0.08,
  maxOffset = 70,
} = {}) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let active = false;

  function update() {
    frame = 0;
    if (!active || media.matches) return;

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
    const rawOffset = (progress - 0.5) * rect.height * strength;
    const offset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));

    layer.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  }

  function scheduleUpdate() {
    if (frame) return;
    frame = requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (active) scheduleUpdate();
  }, { rootMargin: "100px 0px" });

  observer.observe(section);
  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  media.addEventListener?.("change", scheduleUpdate);

  return () => {
    observer.disconnect();
    window.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
    media.removeEventListener?.("change", scheduleUpdate);
    if (frame) cancelAnimationFrame(frame);
    layer.style.removeProperty("--parallax-y");
  };
}
```

```css
.parallax-art {
  transform: translate3d(0, var(--parallax-y, 0px), 0);
}
```

Use this only after confirming a CSS timeline is insufficient. The function stops applying new values while the section is outside the activation region, and its cleanup removes listeners and pending frame work.

### Pattern 3: Layered Hero with a Stable Foreground

**What it does:** Separates the moving decorative artwork from the text and calls to action.

**When to use it:** An agency or developer portfolio hero with a strong visual focal point behind or beside the headline.

```css
.hero-composition {
  position: relative;
  isolation: isolate;
  overflow: clip;
  min-height: 46rem;
}

.hero-composition__art {
  position: absolute;
  inset: 0 0 0 auto;
  width: min(60%, 48rem);
  pointer-events: none;
  transform: translate3d(0, var(--art-offset, 0px), 0);
}

.hero-composition__content {
  position: relative;
  z-index: 1;
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
  padding-block: 8rem;
}
```

Keep the content in normal flow and the art decorative. If the art contains meaningful information, do not mark it `aria-hidden`; provide appropriate text or a meaningful image alternative.

### Pattern 4: Pointer-Responsive Depth for Fine Pointers

**What it does:** Moves separate decorative layers by small amounts in response to pointer position.

**When to use it:** A desktop hero with a large static composition and no essential controls inside the moving layers.

```js
export function mountPointerDepth(stage, layers) {
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!canHover.matches || reduceMotion.matches) return () => {};

  function handleMove(event) {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    for (const layer of layers) {
      layer.element.style.setProperty("--depth-x", `${(x * layer.maxX).toFixed(1)}px`);
      layer.element.style.setProperty("--depth-y", `${(y * layer.maxY).toFixed(1)}px`);
    }
  }

  function reset() {
    for (const layer of layers) {
      layer.element.style.setProperty("--depth-x", "0px");
      layer.element.style.setProperty("--depth-y", "0px");
    }
  }

  stage.addEventListener("pointermove", handleMove, { passive: true });
  stage.addEventListener("pointerleave", reset);

  return () => {
    stage.removeEventListener("pointermove", handleMove);
    stage.removeEventListener("pointerleave", reset);
    reset();
  };
}
```

```css
.depth-layer {
  transform: translate3d(var(--depth-x, 0), var(--depth-y, 0), 0);
}
```

Use very small maximum values and keep the effect off for coarse pointers and reduced-motion users. Pointer motion should not move buttons out from under the pointer or make text difficult to read.

### Pattern 5: Mobile Static Fallback

**What it does:** Keeps the art composition but disables scroll-linked movement on small screens.

**When to use it:** The parallax effect adds little value on a narrow viewport or causes crop, battery, or performance problems.

```css
.parallax-art {
  transform: none;
}

@media (min-width: 64rem) and (prefers-reduced-motion: no-preference) {
  .parallax-art {
    transform: translate3d(0, var(--parallax-y, 0px), 0);
  }
}

@media (max-width: 63.999rem) {
  .parallax-art {
    animation: none;
    transform: none;
  }
}
```

A static mobile fallback is a valid art direction decision, not a failure to support the feature. Test the crop and contrast independently from the desktop composition.

### Pattern 6: Reduced-Motion Runtime Shutdown

**What it does:** Stops JavaScript-driven parallax when the user preference requests reduced motion and re-evaluates the state if the preference changes.

**When to use it:** A persistent application with a custom `requestAnimationFrame` loop.

```js
export function createMotionGate(start, stop) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let running = false;

  function sync() {
    if (preference.matches && running) {
      stop();
      running = false;
    } else if (!preference.matches && !running) {
      start();
      running = true;
    }
  }

  sync();
  preference.addEventListener?.("change", sync);

  return () => {
    preference.removeEventListener?.("change", sync);
    if (running) stop();
    running = false;
  };
}
```

The `start` function should not create duplicate loops when called again, and `stop` should cancel pending animation frames. Keep a static visual state available at all times.

### Pattern 7: Safe Section Activation

**What it does:** Runs expensive measurements only while a section is near the viewport.

**When to use it:** A long case-study page has multiple parallax sections but only one or two can be visible at a time.

```js
export function activateNearViewport(section, onEnter, onLeave) {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) onEnter();
    else onLeave();
  }, { rootMargin: "120px 0px", threshold: 0 });

  observer.observe(section);

  return () => observer.disconnect();
}
```

Use activation to start or pause a separate animation loop, not to infer exact scroll progress. Make sure `onLeave` is idempotent and cancels any work started by `onEnter`.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Moving every layer by the same amount | Parallax is treated as a generic scroll effect | Assign separate bounded ranges to background, focal art, and foreground |
| Using `window.scrollY * 0.4` for the entire page | The effect is tied to document distance instead of its section | Calculate local section progress and clamp the result |
| Updating styles directly on every scroll event | Event frequency is mistaken for rendering cadence | Coalesce work with `requestAnimationFrame` or use CSS scroll timelines |
| Animating `top`, `left`, or margins | Layout position is used to create visual movement | Use `transform: translate3d()` and keep layout stable |
| Leaving `will-change` on every decorative element | GPU hints are added without measuring memory cost | Add hints only where profiling shows a benefit |
| Forgetting reduced-motion behavior | The effect is judged only by visual polish | Disable motion in CSS and stop JavaScript loops when the preference is active |
| Creating a parallax effect without a static fallback | Animation is treated as required for the design to work | Build a complete static composition first |
| Allowing oversized layers to create horizontal scrolling | The art is enlarged without a clipping boundary | Use a dedicated stage with `overflow: clip` or a suitable fallback |
| Placing fixed navigation inside a transformed wrapper | The transform creates a containing block | Keep global fixed UI outside transformed ancestors |
| Using the same motion range on mobile and desktop | Only a large desktop composition was tested | Reduce or remove movement at narrow breakpoints |
| Letting moving art reduce text contrast | Contrast is checked at only one frame | Test multiple points in the motion range and add a controlled overlay |
| Using IntersectionObserver as a continuous progress source | Intersection callbacks are confused with scroll events | Use it for activation; use a scroll timeline or frame calculation for progress |
| Failing to cancel animation frames on teardown | Lifecycle cleanup is not part of the design | Cancel the pending frame and remove listeners in the returned cleanup |
| Ignoring pointer type | Mouse behavior is applied to touch devices | Gate pointer depth with `(hover: hover) and (pointer: fine)` |
| Overusing pointer parallax | Motion becomes a distraction rather than depth | Keep amplitudes small and limit the number of layers |
| Using `100vh` rigidly on mobile | Browser chrome changes the visible viewport | Prefer flexible `min-height` and test `svh`/`dvh` behavior |
| Combining transforms with fixed descendants | A child that should be viewport-fixed becomes ancestor-relative | Move fixed UI outside the transformed subtree |
| Animating `background-position` across huge surfaces without profiling | The visual effect may trigger repeated painting | Prefer a transform layer when repaint cost is high |
| Assuming scroll-driven CSS is universally supported | The fallback path is omitted | Wrap the enhancement in `@supports` and keep the static style valid |
| Moving the text and art in competing directions | No hierarchy is established between layers | Keep essential text stable and let the focal art carry most movement |

**Before → After**

```js
// Before: unbounded and not frame-coalesced.
window.addEventListener("scroll", () => {
  art.style.transform = `translateY(${window.scrollY * 0.25}px)`;
});

// After: schedule a local, bounded update and respect reduced motion.
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;

function updateArt() {
  frame = 0;
  if (motionPreference.matches) {
    art.style.transform = "none";
    return;
  }

  const rect = section.getBoundingClientRect();
  const progress = (window.innerHeight - rect.top) /
    (window.innerHeight + rect.height);
  const offset = Math.max(-60, Math.min(60, (progress - 0.5) * 120));

  art.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
}

function scheduleArtUpdate() {
  if (!frame) frame = requestAnimationFrame(updateArt);
}

window.addEventListener("scroll", scheduleArtUpdate, { passive: true });
```

In production, wrap this setup in a lifecycle-aware function that removes the listener and cancels `frame` when the section is removed.

---

## Mental Models

1. **Depth is a hierarchy** — background atmosphere moves least; focal art may move more; essential text usually stays anchored.
2. **The static composition is the product** — motion enhances it but must not be required to understand it.
3. **Local progress beats global scroll distance** — a section should respond to its own viewport relationship, not how far the page has been scrolled overall.
4. **Motion needs a budget** — bound distance, duration, active layers, and total visual complexity.
5. **Transform is a visual offset, not a layout system** — keep the document geometry stable while decorative layers move.
6. **Observer for activation, timeline for progress** — choose the API based on the kind of signal you need.
7. **A fallback is an art direction** — static mobile and reduced-motion states deserve deliberate composition.
8. **Fixed UI belongs outside moving ancestors** — do not let decorative transforms change the behavior of navigation or dialogs.
9. **Pointer movement should feel like depth, not steering** — tiny response is enough; large offsets feel disconnected.
10. **Profile, then optimize** — reduce layers and repaint-heavy effects based on measured behavior, not assumptions about the GPU.

---

## Quick Reference

| Need | Recommended approach |
|---|---|
| Simple scroll-linked effect | CSS scroll-driven animation when supported |
| Browser fallback | Keep the static composition valid |
| Custom progress formula | `requestAnimationFrame` plus bounded local progress |
| Detect near-viewport sections | `IntersectionObserver` |
| Limit motion range | Clamp calculated offsets |
| Reduce layout work | Animate `transform` and `opacity` |
| Avoid unbounded page motion | Base progress on `getBoundingClientRect()` for the section |
| Respect reduced motion | CSS media query plus JavaScript runtime gate |
| Desktop pointer depth | Gate on `(hover: hover) and (pointer: fine)` |
| Mobile design | Use a static or lower-amplitude art direction |
| Prevent horizontal overflow | Clip inside a dedicated stage |
| Preserve text contrast | Keep foreground stable and test overlays across motion |
| Protect fixed navigation | Keep it outside transformed ancestors |
| Manage expensive sections | Use an observer to activate and pause work |
| Clean up custom loops | Remove listeners and cancel pending animation frames |
| Avoid memory overhead | Use `will-change` selectively |
| Test image crop | Use `aspect-ratio`, intrinsic dimensions, and responsive positioning |
| Check scroll timeline support | Use `@supports (animation-timeline: view())` |
| Debug unexpected fixed positioning | Inspect ancestor transforms, filters, perspective, and containment |
| Debug jank | Profile repaint cost and active layers on a real mobile device |
| Accessibility baseline | Preserve readable content when motion is disabled |
| Portfolio use case | Use one focal layer to support a clear visual story |

---

## Build Challenge

### Build: Responsive Parallax Case-Study Hero

Create a case-study hero for a creative agency portfolio. The hero should have a background glow, one focal visual, a stable headline, and a clear call to action. Add a restrained scroll-linked effect and an optional pointer response for fine-pointer desktop users.

**Requirements**

1. Build the static responsive composition before adding motion.
2. Use semantic HTML and mark decorative layers as `aria-hidden="true"`.
3. Reserve image geometry using intrinsic dimensions and/or `aspect-ratio`.
4. Keep headline, supporting copy, and call-to-action in a stable foreground layer.
5. Use CSS scroll-driven animation with `@supports` where appropriate.
6. If JavaScript is required, use section-local progress, a clamped range, and `requestAnimationFrame`.
7. Use `IntersectionObserver` to activate or pause costly updates, not to infer continuous progress.
8. Respect `prefers-reduced-motion` in CSS and stop JavaScript loops.
9. Disable pointer parallax on touch/coarse-pointer devices.
10. Keep global fixed navigation and dialogs outside transformed ancestors.
11. Prevent horizontal overflow at narrow widths.
12. Test contrast at multiple points in the animation.
13. Include cleanup for observers, event listeners, and pending animation frames.
14. Test the page with scroll restoration, a deep link, and a long section.
15. Profile performance on a real mobile device or a throttled CPU.

**Acceptance criteria**

- The hero looks complete with all animation disabled.
- Motion is subtle, bounded, and clearly tied to a specific visual purpose.
- Essential text and controls remain legible and stable.
- No horizontal scrollbar appears at supported viewport widths.
- Reduced-motion mode has no continuous parallax movement.
- Touch users are not forced into pointer-driven movement.
- Fixed navigation remains fixed and usable.
- Scroll updates are coalesced and bounded.
- Event listeners, observers, and pending frames are cleaned up.
- The effect does not create noticeable layout shifts or scroll jank.
- Unsupported CSS scroll timelines leave a valid static design.

**Review questions**

1. What visual purpose does each moving layer serve?
2. Why is a bounded local progress value safer than `scrollY * factor`?
3. When should CSS scroll-driven animation be preferred over JavaScript?
4. What is the proper role of `IntersectionObserver` in a continuous effect?
5. Why does `requestAnimationFrame` not automatically guarantee good performance?
6. How can a transformed ancestor change fixed-position behavior?
7. How should reduced-motion preferences affect both CSS and JavaScript?
8. Why can parallax cause horizontal overflow on mobile?
9. How do you test text contrast across a moving background?
10. When is a static mobile fallback better than trying to preserve the same effect?
11. Why should `will-change` be used selectively?
12. How do you know whether the effect improves the story instead of distracting from it?
