# SKILL: effect-recipe-finder
**Layer:** 11 — Reverse Engineering
**Goal:** Identify the implementation techniques behind a visual effect, verify the evidence in browser tools, and turn the findings into a maintainable, responsive recipe rather than a brittle imitation.

---

## Why This Matters (Senior Perspective)

A polished website can make a small implementation detail look like a large technical mystery. A title may appear to reveal itself through a mask, a product image may drift with pointer movement, or a background may look like a shader when it is actually a few layered gradients. If you choose the wrong implementation, you pay for it everywhere: the effect breaks at a narrow viewport, consumes too much GPU time, becomes inaccessible when motion is reduced, or requires a library that the project does not need. A freelance client does not care that the reference looked convincing on your laptop; they care that the delivered page behaves correctly on their phone, survives real content, and can be changed without fear.

A senior developer treats visual matching as a hypothesis-testing problem. First, describe what can be observed without naming the technique. Then list plausible mechanisms, find evidence that distinguishes them, and test the smallest implementation that can explain the result. A beginner often sees a smooth animation and immediately reaches for GSAP, or sees a textured background and immediately reaches for WebGL. Those choices may work, but they are guesses. A senior asks what property changes, what triggers it, whether the pixels are DOM content or a rendered asset, whether the effect depends on scroll position, and what the browser's performance tools show. The aim is not to reproduce the original source code; it is to find a sound implementation that reproduces the visible behavior under the constraints of your own project.

This skill is especially useful when building award-caliber portfolio work, case-study pages, product launches, and experimental landing pages. You may need to reverse engineer a cursor-following image, a scroll-linked reveal, a liquid-looking transition, or a typography treatment from a live reference. Your output should be an effect recipe: evidence, likely technique, confidence level, minimal code, responsive fallback, accessibility behavior, and a way to validate it. That recipe is reusable across projects and explainable to clients. It also prevents expensive overengineering: CSS should remain CSS when it can do the job, SVG should handle vector geometry when appropriate, Canvas should be chosen for many independently animated pixels, and WebGL should be reserved for cases that genuinely need a GPU-rendered scene.

---

## Core Concepts

### 1. Separate the visible effect from the implementation hypothesis

The visual effect is the evidence; the technique is only a hypothesis. Write down what changes over time, what stays fixed, and what input appears to trigger the change before choosing an API. For example, “the heading becomes visible from left to right as it enters the viewport” is an observation. “It uses a CSS mask and IntersectionObserver” is a hypothesis that still needs testing.

```html
<section class="campaign-intro" aria-labelledby="campaign-title">
  <p class="campaign-intro__eyebrow">Field notes / 2026</p>
  <h1 class="campaign-intro__title" id="campaign-title">
    Objects for slower living
  </h1>
</section>
```

```css
.campaign-intro__title {
  max-width: 12ch;
  clip-path: inset(0 100% 0 0);
  animation: title-reveal 900ms cubic-bezier(.22, 1, .36, 1) both;
}

@keyframes title-reveal {
  to { clip-path: inset(0 0 0 0); }
}
```

The code demonstrates one plausible recipe, not proof that the reference uses it. Keep a record of the observation, hypothesis, test, and result. That record makes the reasoning auditable and helps you switch technique when evidence contradicts the first guess.

**Naive approach:** “This looks like a mask, so I will copy a mask animation.”

**Correct approach:** Describe the direction, timing, trigger, clipping boundary, and whether the letters themselves move. Then compare a clip-path, an overflow wrapper, and a mask using the same content.

**Gotcha:** A clip-path can hide content visually while leaving it in the accessibility tree, which is often desirable for a reveal. Do not use `display: none` as an animation starting state if the content must animate into view.

### 2. Build an evidence ledger before opening a library

A compact evidence ledger keeps observations separate from assumptions. Record the trigger, geometry, timing, affected properties, viewport behavior, reduced-motion behavior, and confidence. This prevents a plausible story from becoming a false fact.

```js
const effectEvidence = {
  name: "hero title reveal",
  observation: "title becomes visible from left to right",
  trigger: "appears shortly after initial paint",
  measuredDurationMs: 900,
  likelyProperties: ["clip-path"],
  alternatives: ["overflow wrapper with translateX"],
  confidence: "medium",
  nextTest: "disable animation and inspect computed styles"
};

console.table(effectEvidence);
```

The ledger is useful even when you are working alone. It creates a decision trail and makes it easier to explain why a solution uses CSS rather than a timeline library.

**Naive approach:** Put guesses directly into code comments as if they were confirmed facts.

**Correct approach:** Label findings as observed, inferred, or unverified, then update the record after a browser test.

**Gotcha:** A live website may ship different markup or styles by route, viewport, consent state, or experiment bucket. Evidence applies to the state you inspected, not necessarily every state of the site.

### 3. Identify the rendering surface: DOM, SVG, Canvas, or WebGL

The rendering surface narrows the search. DOM text and boxes are easy to inspect and accessible; SVG is suited to vector paths and masks; Canvas paints pixels into a bitmap; WebGL renders through a GPU pipeline. A visually complex effect does not automatically imply a complex surface.

```html
<figure class="artwork-card">
  <svg class="artwork-card__mark" viewBox="0 0 120 120" role="img"
       aria-labelledby="artwork-title">
    <title id="artwork-title">A looping line motif</title>
    <path d="M12 60 C12 12 108 12 108 60 S12 108 12 60"
          fill="none" stroke="currentColor" stroke-width="2" />
  </svg>
  <figcaption>Line study No. 04</figcaption>
</figure>
```

```css
.artwork-card__mark {
  width: min(30vw, 7.5rem);
  overflow: visible;
}

.artwork-card__mark path {
  stroke-dasharray: 360;
  stroke-dashoffset: 360;
  animation: draw-line 1.4s ease-out forwards;
}

@keyframes draw-line {
  to { stroke-dashoffset: 0; }
}
```

If the visible line has a stable vector path and clean scaling, SVG is a strong candidate. If hundreds of particles move independently, Canvas or WebGL may be more appropriate. If the effect is mostly typography and layout, keep it in the DOM.

**Naive approach:** Rebuild a simple gradient as a shader because the reference looks futuristic.

**Correct approach:** Choose the least complex rendering surface that satisfies fidelity, responsiveness, accessibility, and performance.

**Gotcha:** A Canvas drawing does not expose its painted text and shapes as semantic DOM content. Provide meaningful surrounding HTML and a fallback when the visual conveys information.

### 4. Use DevTools to inspect the actual change

Inspect a stable state, then compare it with the animated state. Computed styles, DOM mutations, event listeners, and performance traces can distinguish a transform animation from a changing layout or a canvas render loop. Use the browser's animation controls to slow or pause motion where supported.

```js
const titleElement = document.querySelector(".campaign-intro__title");

if (titleElement) {
  const computed = getComputedStyle(titleElement);

  console.table({
    display: computed.display,
    opacity: computed.opacity,
    transform: computed.transform,
    clipPath: computed.clipPath,
    animationName: computed.animationName,
    animationDuration: computed.animationDuration
  });
}
```

Run this in the reference page's DevTools console after selecting the correct element. If the target is inside an iframe or shadow root, the query must be adapted to that browsing context.

**Naive approach:** Inspect only the final screenshot and infer all animation details from it.

**Correct approach:** Inspect the initial state, intermediate frames, final state, and the computed properties that differ.

**Gotcha:** Computed styles show resolved values at the moment of inspection. A transition may already have completed, so pause or replay it before drawing conclusions.

### 5. Distinguish trigger, timeline, and animated property

Every effect has at least three separate questions: what starts it, how progress is measured, and what property changes. A hover effect may be CSS-triggered; a scroll reveal may use IntersectionObserver to toggle a class; a scroll-scrubbed sequence may map scroll progress to a timeline.

```js
const revealSections = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    entry.target.classList.add("is-revealed");
    observer.unobserve(entry.target);
  }
}, {
  threshold: 0.18,
  rootMargin: "0px 0px -8% 0px"
});

revealSections.forEach((section) => revealObserver.observe(section));
```

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(1.25rem);
  transition: opacity 700ms ease, transform 700ms cubic-bezier(.22, 1, .36, 1);
}

[data-reveal].is-revealed {
  opacity: 1;
  transform: translateY(0);
}
```

The observer is a trigger, not an animation engine. CSS owns the transition. Keeping those responsibilities separate makes the behavior easier to test and replace.

**Naive approach:** Add a scroll event listener that recalculates every element's position on every event.

**Correct approach:** Use IntersectionObserver for enter/leave detection; use a scroll-linked timeline or a carefully throttled animation frame loop only when continuous progress is truly required.

**Gotcha:** If JavaScript fails before adding the class, content styled permanently invisible will disappear. Prefer a progressive-enhancement strategy that keeps content visible by default and activates the hidden initial state only when enhancement is ready.

### 6. Measure motion instead of describing it vaguely

“Smooth,” “fast,” and “subtle” are not actionable specifications. Estimate duration, delay, distance, easing, stagger interval, and whether the animation is reversible. Browser recording or frame-by-frame inspection can reveal whether motion is constant, eased, spring-like, or tied to input velocity.

```css
:root {
  --motion-enter: 720ms;
  --ease-out-expressive: cubic-bezier(.16, 1, .3, 1);
  --distance-enter: 1.1rem;
}

.project-caption {
  opacity: 0;
  transform: translateY(var(--distance-enter));
  transition:
    opacity var(--motion-enter) var(--ease-out-expressive),
    transform var(--motion-enter) var(--ease-out-expressive);
}

.project-card:is(:hover, :focus-within) .project-caption {
  opacity: 1;
  transform: translateY(0);
}
```

A motion token lets the recipe stay coherent across multiple elements. When a client asks for “slower,” you can tune one variable rather than hunt through unrelated declarations.

**Naive approach:** Apply arbitrary durations to each element until one screenshot looks close.

**Correct approach:** Measure a small set of motion parameters and reuse named tokens, then validate the result at normal speed and on a touch device.

**Gotcha:** Hover is not a reliable primary trigger on touch screens. Important content must remain available through focus, tap, or the default layout.

### 7. Recognize masks, clipping, and overflow reveals

A reveal can come from clipping the element, clipping a parent, moving the content behind an overflow boundary, or animating a mask image. These approaches can look similar in a screenshot but behave differently when content wraps or scales.

```html
<figure class="feature-visual">
  <div class="feature-visual__window">
    <img
      class="feature-visual__image"
      src="/images/ceramic-vessel.webp"
      alt="Hand-thrown ceramic vessel on a stone plinth"
      width="1200"
      height="1500"
    />
  </div>
  <figcaption>Material study — clay and light</figcaption>
</figure>
```

```css
.feature-visual__window {
  overflow: clip;
  border-radius: 1.25rem;
}

.feature-visual__image {
  display: block;
  width: 100%;
  height: auto;
  transform: scale(1.08);
  transition: transform 900ms cubic-bezier(.2, .8, .2, 1);
}

.feature-visual:hover .feature-visual__image {
  transform: scale(1);
}
```

An overflow window is often the simplest choice for image crops and scale reveals. Use clip-path when the clipping geometry itself is part of the design; use mask-image when opacity gradients or image-defined transparency are required.

**Naive approach:** Animate `width` or `height` to reveal an image, forcing repeated layout.

**Correct approach:** Keep the image dimensions stable and animate a clipping boundary or transform when that matches the intended behavior.

**Gotcha:** `overflow: clip` and `overflow: hidden` differ in scrolling-container behavior. If content must be programmatically scrolled, test the chosen overflow value rather than assuming they are interchangeable.

### 8. Tell CSS transforms from layout changes

Transforms generally change visual placement without changing surrounding layout; properties such as width, height, margin, and top can trigger layout work. This is a useful first distinction when investigating an effect that stutters or pushes nearby content around.

```css
/* Avoid layout churn for a decorative hover lift. */
.project-card__media {
  transform: translateY(0) scale(1);
  transition: transform 320ms cubic-bezier(.2, .8, .2, 1);
}

.project-card:hover .project-card__media {
  transform: translateY(-0.35rem) scale(1.015);
}
```

```css
/* A genuine layout change should use layout intentionally. */
.project-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: clamp(1rem, 2.5vw, 2.5rem);
}

.project-card--featured {
  grid-column: span 8;
}

.project-card:not(.project-card--featured) {
  grid-column: span 4;
}

@media (max-width: 48rem) {
  .project-card--featured,
  .project-card:not(.project-card--featured) {
    grid-column: 1 / -1;
  }
}
```

Use layout properties when the layout is meant to change. Use transforms for visual movement that should not affect neighboring geometry. Performance is a measured outcome, not a blanket rule that every transform is free.

**Naive approach:** Animate `margin-left` for a purely decorative slide.

**Correct approach:** Use `transform: translateX()` if surrounding content should remain in place; keep real reflow changes in layout.

**Gotcha:** Transforms can create stacking contexts and containing blocks. A transformed ancestor may change how a fixed-position descendant behaves, so inspect the full ancestor chain when a supposedly fixed overlay moves unexpectedly.

### 9. Detect whether motion is scroll-linked or merely scroll-triggered

A scroll-triggered reveal begins when an element crosses a threshold and then runs on its own timeline. A scroll-linked effect continuously tracks scroll progress. The distinction matters: the first can use IntersectionObserver and CSS transitions; the second may need CSS scroll-driven animations or a timeline library.

```css
@supports (animation-timeline: view()) {
  .case-study-image {
    animation: image-enter linear both;
    animation-timeline: view();
    animation-range: entry 0% entry 85%;
  }

  @keyframes image-enter {
    from {
      opacity: 0.35;
      transform: translateY(4rem) scale(.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}
```

This is a progressive enhancement, not a universal replacement for JavaScript. Use feature detection and provide a readable default when scroll-driven animation support is absent.

**Naive approach:** Add a large animation library for every element that appears during scrolling.

**Correct approach:** Use a simple observer for one-time entrance effects, CSS scroll-driven animations where supported, and a timeline library when choreography or cross-browser control justifies it.

**Gotcha:** Scroll-driven animation support and behavior vary across browsers. Always test the fallback path and avoid making the content's visibility depend on a feature that may not exist.

### 10. Investigate pointer-following and cursor-reactive effects

Pointer-reactive visuals can be driven by CSS custom properties, pointer events, or a library's motion values. Determine whether the effect follows raw pointer coordinates, a smoothed target, or velocity. Use normalized coordinates so the effect scales with the component rather than assuming a fixed viewport.

```html
<article class="interactive-project" data-pointer-card>
  <img
    class="interactive-project__image"
    src="/images/kinetic-chair.webp"
    alt="Sculptural chair photographed in a bright studio"
    width="1200"
    height="900"
  />
  <h2 class="interactive-project__title">Kinetic form</h2>
</article>
```

```js
const pointerCard = document.querySelector("[data-pointer-card]");

if (pointerCard) {
  pointerCard.addEventListener("pointermove", (event) => {
    const bounds = pointerCard.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width;
    const normalizedY = (event.clientY - bounds.top) / bounds.height;

    pointerCard.style.setProperty("--pointer-x", normalizedX.toFixed(3));
    pointerCard.style.setProperty("--pointer-y", normalizedY.toFixed(3));
  });

  pointerCard.addEventListener("pointerleave", () => {
    pointerCard.style.setProperty("--pointer-x", "0.5");
    pointerCard.style.setProperty("--pointer-y", "0.5");
  });
}
```

```css
.interactive-project__image {
  transform:
    translate3d(
      calc((var(--pointer-x, .5) - .5) * -1rem),
      calc((var(--pointer-y, .5) - .5) * -1rem),
      0
    );
  transition: transform 180ms ease-out;
}
```

This direct version is appropriate for a subtle card reaction. If the reference has inertia, clamp movement and interpolate toward the target in `requestAnimationFrame`; do not create an unbounded animation loop for a simple hover.

**Naive approach:** Use `mousemove` on `window` and apply the pointer position to every card.

**Correct approach:** Listen on the intended component, normalize against its bounds, and stop or reset the effect when the pointer leaves.

**Gotcha:** A pointer may be a pen or touch input. Check `event.pointerType` if the effect should respond only to a mouse, and ensure the content does not require hover to be understood.

### 11. Determine when Canvas or WebGL is justified

Choose Canvas when you need to paint many 2D particles or trails without creating a DOM node for each item. Choose WebGL when the effect requires a shader, 3D geometry, or GPU-driven compositing that cannot be expressed well with simpler tools. Before selecting either, estimate pixel count, update frequency, device-pixel ratio, and fallback requirements.

```html
<figure class="particle-art">
  <canvas class="particle-art__canvas" aria-hidden="true"></canvas>
  <figcaption>
    A generative field of drifting points
  </figcaption>
</figure>
```

```js
const particleCanvas = document.querySelector(".particle-art__canvas");
const particleContext = particleCanvas?.getContext("2d");

function resizeParticleCanvas() {
  if (!particleCanvas || !particleContext) return;

  const bounds = particleCanvas.getBoundingClientRect();
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  particleCanvas.width = Math.round(bounds.width * pixelRatio);
  particleCanvas.height = Math.round(bounds.height * pixelRatio);
  particleContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

if (particleCanvas && particleContext) {
  resizeParticleCanvas();
  window.addEventListener("resize", resizeParticleCanvas, { passive: true });
}
```

A canvas has no inherent semantic representation, so its surrounding HTML must explain its purpose if it carries meaning. Cap device-pixel ratio on high-density screens when memory or fill rate becomes a concern.

**Naive approach:** Use WebGL for a static decorative background that can be expressed with CSS gradients.

**Correct approach:** Start with CSS, escalate to SVG for vector operations, Canvas for dense 2D drawing, and WebGL for shader or 3D requirements.

**Gotcha:** A full-viewport canvas at device-pixel ratio 3 has nine times the pixel area of a ratio-1 canvas. That can turn a harmless effect into a fill-rate bottleneck on mobile.

### 12. Evaluate motion safety, accessibility, and fallback behavior

A visual recipe is incomplete until it defines what happens when motion is reduced, JavaScript is unavailable, the asset fails, or the user navigates by keyboard. Decorative movement should not block access to content or communicate essential state only through motion.

```css
@media (prefers-reduced-motion: reduce) {
  .campaign-intro__title,
  .project-card__media,
  .case-study-image,
  .interactive-project__image {
    animation: none !important;
    transition-duration: 0.01ms !important;
    transform: none;
  }

  [data-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

```html
<figure class="project-card__figure">
  <img
    src="/images/kinetic-chair.webp"
    alt="Sculptural chair with a curved wooden frame"
    width="1200"
    height="900"
  />
  <figcaption>
    <a href="/work/kinetic-form/">View the Kinetic Form project</a>
  </figcaption>
</figure>
```

Use reduced-motion styles that remove nonessential movement without hiding content. For meaningful animations, preserve state changes in text or other perceivable cues.

**Naive approach:** Turn off every animation but leave elements at their hidden starting styles.

**Correct approach:** Make the no-motion state complete and visible, then layer motion on as an enhancement.

**Gotcha:** A global `animation: none` rule does not necessarily reset opacity or transforms assigned by ordinary styles. Explicitly restore the visible end state for components that otherwise begin hidden.

### 13. Validate the effect across viewport and input modes

An effect recipe must survive more than the reference viewport. Resize the browser, test touch behavior, check keyboard focus, change text length, and inspect a reduced-motion setting. Responsive changes may alter clipping geometry, pointer range, or scroll timing.

```css
.project-feature {
  --feature-gutter: clamp(1rem, 5vw, 5rem);
  padding-inline: var(--feature-gutter);
}

.project-feature__media {
  aspect-ratio: 5 / 4;
  overflow: hidden;
}

.project-feature__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 42rem) {
  .project-feature__media {
    aspect-ratio: 4 / 5;
  }
}
```

The goal is not to preserve identical pixel coordinates at every width. Preserve the design's intent: hierarchy, readable content, useful crop, and an interaction that still makes sense.

**Naive approach:** Use hard-coded pixel distances copied from a desktop screen recording.

**Correct approach:** Express motion distances relative to the component or viewport where appropriate, and define an explicit mobile behavior.

**Gotcha:** A `clip-path` or pointer calculation can be mathematically correct yet visually wrong when the component's aspect ratio changes. Re-check the geometry after responsive styles apply.

### 14. Turn findings into a reproducible effect recipe

The final concept is integration: turn the observations into a compact implementation brief another developer can reproduce. Include the trigger, animated properties, timing, responsive behavior, accessibility fallback, confidence, and validation steps. The recipe should describe the effect without pretending to know the reference site's private source.

```js
const recipe = {
  name: "case-study image reveal",
  evidence: {
    trigger: "image enters viewport",
    visibleChange: "image translates upward and fades in",
    estimatedDurationMs: 760,
    estimatedEasing: "strong ease-out",
    renderingSurface: "DOM image"
  },
  implementation: {
    trigger: "IntersectionObserver",
    animation: "CSS transform and opacity",
    fallback: "image visible before JavaScript enhancement",
    reducedMotion: "show image without movement"
  },
  validation: [
    "reload with cache disabled",
    "test at 390px and 1440px widths",
    "enable reduced motion",
    "tab through adjacent links",
    "inspect layout shifts and frame time"
  ]
};

console.log(JSON.stringify(recipe, null, 2));
```

This is the difference between copying a screenshot and creating a reliable implementation. The recipe is a small technical artifact: it preserves the evidence and makes future tuning cheaper.

**Naive approach:** Deliver only a code snippet with no explanation of assumptions or limitations.

**Correct approach:** Deliver the working effect plus its trigger, parameters, fallback, evidence, and validation checklist.

**Gotcha:** Confidence is not binary. If you cannot inspect the source or reproduce an intermediate state, label the technique as inferred and keep the implementation replaceable.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Hypothesis matrix for competing implementations

**What it does:** Compares plausible techniques against observable behavior before committing to one.

**When to use it:** Use this when a reference could plausibly be implemented with CSS, SVG, a timeline library, or a shader and the screenshot alone is ambiguous.

```js
const candidateTechniques = [
  {
    technique: "CSS clip-path",
    supports: "simple geometric reveal",
    cost: "low",
    test: "inspect clip-path during playback"
  },
  {
    technique: "overflow wrapper",
    supports: "translated or scaled content reveal",
    cost: "low",
    test: "inspect parent overflow and child transform"
  },
  {
    technique: "SVG mask",
    supports: "vector-shaped or gradient-alpha reveal",
    cost: "medium",
    test: "inspect SVG defs and mask references"
  }
];

console.table(candidateTechniques);
```

Choose the simplest technique that explains all observed states. Do not treat the table as a scoring system unless you define weights for fidelity, complexity, accessibility, and runtime cost.

### Pattern 2: Progressive enhancement for scroll reveals

**What it does:** Keeps content visible by default and adds a hidden initial state only after the reveal behavior is initialized.

**When to use it:** Use this for editorial pages where content must remain available if JavaScript fails or an observer cannot be created.

```css
[data-reveal] {
  opacity: 1;
  transform: none;
}

.motion-ready [data-reveal] {
  opacity: 0;
  transform: translateY(1rem);
}

.motion-ready [data-reveal].is-revealed {
  opacity: 1;
  transform: translateY(0);
}
```

```js
if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("motion-ready");

  const contentObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    contentObserver.observe(element);
  });
}
```

If a strict content-first experience is more important than animation, leave the default visible state and omit the hidden enhancement entirely. Avoid flash-of-hidden-content on slow devices.

### Pattern 3: One animation-frame loop for many pointer targets

**What it does:** Coalesces frequent pointer events into one visual update per frame.

**When to use it:** Use this when several cards react to pointer movement or the effect needs smoothing; do not use it for a single static hover transition.

```js
const reactiveCards = [...document.querySelectorAll("[data-reactive-card]")];
let pendingPointer = null;
let animationFrameId = 0;

function renderPointerPosition() {
  animationFrameId = 0;
  if (!pendingPointer) return;

  for (const card of reactiveCards) {
    const bounds = card.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (pendingPointer.x - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (pendingPointer.y - bounds.top) / bounds.height));

    card.style.setProperty("--pointer-x", x.toFixed(3));
    card.style.setProperty("--pointer-y", y.toFixed(3));
  }

  pendingPointer = null;
}

window.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  pendingPointer = { x: event.clientX, y: event.clientY };

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(renderPointerPosition);
  }
}, { passive: true });

window.addEventListener("blur", () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = 0;
  pendingPointer = null;
});
```

This pattern still measures each card's bounds during rendering. For a large grid, cache bounds and refresh them through ResizeObserver or a deliberate layout update to avoid repeated geometry reads.

### Pattern 4: CSS custom properties as the handoff between input and styling

**What it does:** Keeps pointer math in JavaScript while letting CSS own the visual response.

**When to use it:** Use this for a magnetic button, radial highlight, or parallax card where input values should not be tangled with styling logic.

```html
<a class="magnetic-link" href="/contact/" data-magnetic-link>
  <span class="magnetic-link__label">Start a project</span>
</a>
```

```js
const magneticLink = document.querySelector("[data-magnetic-link]");

if (magneticLink) {
  magneticLink.addEventListener("pointermove", (event) => {
    const bounds = magneticLink.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left - bounds.width / 2;
    const offsetY = event.clientY - bounds.top - bounds.height / 2;

    magneticLink.style.setProperty("--magnetic-x", `${offsetX * 0.12}px`);
    magneticLink.style.setProperty("--magnetic-y", `${offsetY * 0.12}px`);
  });

  magneticLink.addEventListener("pointerleave", () => {
    magneticLink.style.setProperty("--magnetic-x", "0px");
    magneticLink.style.setProperty("--magnetic-y", "0px");
  });
}
```

```css
.magnetic-link {
  display: inline-flex;
  padding: 1rem 1.5rem;
  transform: translate3d(var(--magnetic-x, 0), var(--magnetic-y, 0), 0);
  transition: transform 220ms cubic-bezier(.2, .8, .2, 1);
}

@media (prefers-reduced-motion: reduce) {
  .magnetic-link { transform: none; transition: none; }
}
```

Keep the movement subtle and ensure the hit target remains predictable. Avoid magnetic movement on critical navigation when it could make the control feel like it is escaping the pointer.

### Pattern 5: Measure the rendering cost before escalating complexity

**What it does:** Uses a browser performance recording to decide whether the bottleneck is scripting, layout, paint, or compositing.

**When to use it:** Use this when the effect drops frames on mobile or when a reference has many animated elements.

```js
// Capture a short diagnostic window around a repeatable interaction.
performance.mark("effect-test-start");

// Perform the same scroll or hover interaction now, then run:
performance.mark("effect-test-end");
performance.measure(
  "effect-test-window",
  "effect-test-start",
  "effect-test-end"
);

const testMeasure = performance.getEntriesByName("effect-test-window").at(-1);
console.log(`Interaction window: ${testMeasure?.duration.toFixed(1)}ms`);
```

This snippet measures elapsed time between marks; it does not identify the frame bottleneck by itself. Use the Performance panel's frame track and rendering diagnostics to inspect long tasks, forced layout, paint area, and dropped frames.

### Pattern 6: Reduced-motion mode as a first-class recipe state

**What it does:** Defines an intentional no-motion version instead of merely deleting animation declarations.

**When to use it:** Use this for every effect recipe that animates content, follows a pointer, or uses a large visual transition.

```css
.project-card__media {
  transform: scale(1.04);
  transition: transform 650ms cubic-bezier(.2, .8, .2, 1);
}

.project-card:hover .project-card__media,
.project-card:focus-within .project-card__media {
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .project-card__media {
    transform: none;
    transition: none;
  }
}
```

Do not make hover the only way to reveal essential labels or links. The reduced-motion state should preserve the same information and navigation opportunities.

### Pattern 7: Store the recipe as structured project documentation

**What it does:** Makes the effect reusable by recording the evidence, implementation decision, tuning parameters, and validation criteria in a consistent object.

**When to use it:** Use this when several people are implementing a reference-driven page or when a project contains many distinct interaction recipes.

```json
{
  "name": "portfolio-project-card-reveal",
  "observation": "image scales down as the pointer leaves the card",
  "confidence": "high",
  "trigger": "pointer hover and keyboard focus",
  "surface": "DOM image",
  "implementation": {
    "input": "CSS hover/focus-within",
    "properties": ["transform"],
    "durationMs": 520,
    "easing": "cubic-bezier(.2,.8,.2,1)"
  },
  "fallbacks": {
    "touch": "static crop with visible project link",
    "reducedMotion": "no scale transition"
  },
  "checks": [
    "keyboard focus visible",
    "mobile layout readable",
    "no layout shift",
    "reduced motion supported"
  ]
}
```

A JSON recipe is useful for documentation and review, not necessarily for driving runtime behavior. Avoid building a configuration engine unless the project actually needs one.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Naming a technique before describing the observed behavior | Familiar tools bias the investigation toward a favorite solution | Write a one-sentence observation and two alternative hypotheses before implementation |
| Assuming every scroll reveal needs GSAP | Timeline libraries are visible in creative-dev examples and can feel like the default | Use IntersectionObserver for one-time visibility triggers and add a timeline only for real choreography |
| Treating a screenshot as evidence of timing | A screenshot captures one frame, not the trigger or duration | Record a screen capture and inspect at normal speed plus slowed playback |
| Animating width for a simple image reveal | Width feels intuitive because the visible area changes | Use a clipping wrapper or clip-path when layout dimensions should remain stable |
| Leaving content hidden until JavaScript runs | The animation's start state was copied without its enhancement assumptions | Keep content visible by default and activate hidden states only after initialization |
| Applying hover-only behavior to important controls | Desktop mouse interaction was the only test input | Add `:focus-within` behavior and preserve useful default content for touch |
| Using viewport coordinates for a component-local effect | The first prototype is written against `window` rather than the target element | Normalize pointer coordinates against `getBoundingClientRect()` for the component |
| Creating one DOM node per particle | DOM is familiar and easy to inspect | Move dense decorative particle rendering to Canvas after measuring DOM and paint costs |
| Choosing WebGL for a CSS-sized visual | The screenshot looks complex, so the implementation is assumed to be complex | Prototype with CSS gradients and transforms before introducing a GPU scene |
| Ignoring device-pixel ratio on Canvas | Canvas dimensions are set only from CSS width and height | Scale the backing store by a capped `devicePixelRatio` and reset the transform on resize |
| Forgetting to cancel or stop animation work | The effect works while the page is visible, so lifecycle cost is overlooked | Stop loops when the component is inactive and cancel pending animation frames during teardown |
| Measuring layout repeatedly inside pointer handlers | Pointer events arrive more often than the display refresh rate | Coalesce work with `requestAnimationFrame` and cache geometry when appropriate |
| Assuming transforms are always free | Transform animations often avoid layout, but can still incur paint or compositing costs | Inspect the Performance panel and avoid unnecessary large layers or huge textures |
| Hiding text with `display: none` during a reveal | It seems like a simple way to create an invisible starting state | Use opacity, transform, or clipping when content must remain available and animatable |
| Ignoring reduced-motion preferences | Motion is treated as decoration rather than a user setting | Provide a reduced-motion state that removes nonessential movement while keeping content visible |
| Copying desktop pixel distances to mobile | The reference was inspected at one viewport | Use relative values, responsive tokens, and explicit small-screen behavior |
| Claiming the original site uses a technique without evidence | A plausible implementation is confused with a verified implementation | Mark the technique as inferred and document what would confirm or falsify it |

**Before → after: avoid a permanently hidden reveal.**

```css
/* Before: a failed observer can leave the heading invisible. */
[data-reveal] {
  opacity: 0;
  transform: translateY(1.5rem);
}
```

```css
/* After: content is visible unless motion enhancement is active. */
[data-reveal] {
  opacity: 1;
  transform: none;
}

.motion-ready [data-reveal] {
  opacity: 0;
  transform: translateY(1.5rem);
}

.motion-ready [data-reveal].is-revealed {
  opacity: 1;
  transform: translateY(0);
}
```

The second version still requires the initialization logic to add `motion-ready` only when the reveal system is ready. The important change is that failure does not make the page unreadable.

---

## Mental Models

1. **Observation before implementation** — describe the pixels and behavior before naming the API.
2. **A hypothesis must be falsifiable** — know which browser observation would prove your first guess wrong.
3. **Trigger is not timeline** — detecting entry, calculating progress, and changing pixels are separate responsibilities.
4. **Use the smallest rendering surface that fits** — DOM first for content, SVG for vectors, Canvas for dense 2D, WebGL for shader/3D needs.
5. **Performance is a trace, not a superstition** — measure scripting, layout, paint, and compositing instead of declaring a property “fast.”
6. **Fallbacks are part of the effect** — a recipe is incomplete until no-JavaScript, touch, narrow viewport, and reduced-motion states are defined.
7. **Confidence belongs in the notes** — an inferred implementation is acceptable when it is clearly labeled and easy to replace.

---

## Quick Reference

| Situation | First technique to test | Evidence to inspect | Common alternative |
|---|---|---|---|
| One-time element reveal | IntersectionObserver + CSS | Trigger point and class changes | CSS view timeline |
| Continuous scroll progress | CSS scroll-driven animation | Progress tracks scroll position | GSAP ScrollTrigger |
| Image crop reveal | Overflow wrapper or clip-path | Parent overflow and child transform | CSS mask |
| Vector line draw | SVG stroke dash animation | SVG path and dash values | Canvas path drawing |
| Text reveal by word | DOM spans + timeline | DOM splitting and stagger timing | CSS animation for small sets |
| Pointer-reactive card | CSS variables + pointer events | Local pointer normalization | Motion library values |
| Magnetic link | Small bounded transform | Pointer offset and reset behavior | Static hover transform |
| Large particle field | Canvas | Particle count and frame cost | WebGL point rendering |
| Distorted image | WebGL shader or displacement map | Texture, shader, render loop | SVG filter for simpler distortion |
| Gradient glow | CSS radial gradients | Computed backgrounds and blend modes | SVG filter |
| Page transition | Shared timeline or router transition | Route lifecycle and overlay state | CSS View Transitions API |
| Hover caption | `:hover` + `:focus-within` | Keyboard focus and touch fallback | Always-visible caption on mobile |
| Motion-sensitive interface | Reduced-motion media query | OS preference and visible final state | User-controlled motion toggle |
| Canvas blurry on retina | Capped device-pixel ratio | Backing-store and CSS dimensions | SVG if content is vector |
| Janky effect | Performance recording | Long tasks, layout, paint, frame track | Simplify layers and reduce work |
| Unknown original technique | Evidence ledger and hypothesis matrix | Initial, intermediate, and final states | Build the simplest equivalent |

---

## Build Challenge

### Build: Reference-to-Recipe Effect Lab

Build a small portfolio page that reproduces three reference-style effects: an image crop reveal, a scroll-triggered heading reveal, and a pointer-reactive project card. The goal is not to guess the source site's exact implementation. The goal is to create a defensible recipe that explains the visible behavior and survives real browsing conditions.

**Requirements**

1. Create a semantic page with a `main`, at least two `section` elements, a heading hierarchy, a `figure`, `figcaption`, and meaningful image alternative text.
2. Choose three reference effects and write an evidence ledger for each with observation, trigger, likely properties, two alternative techniques, and confidence.
3. Implement the image reveal using a clipping or overflow strategy without animating the image's layout width.
4. Implement the heading reveal using IntersectionObserver and CSS transitions, keeping content visible if the enhancement does not initialize.
5. Implement a pointer-reactive card using component-local normalized coordinates and CSS custom properties.
6. Make the pointer effect reset when the pointer leaves and ensure the card still works with keyboard focus.
7. Add a `prefers-reduced-motion: reduce` mode that preserves content and removes nonessential movement.
8. Test the page at widths of approximately 390px, 768px, and 1440px, then correct crop and spacing problems.
9. Use DevTools to inspect computed styles and identify which properties change during each effect.
10. Record a short Performance-panel capture for the pointer effect and note whether scripting, layout, paint, or compositing appears to dominate.
11. Introduce one deliberate failure: disable JavaScript, then confirm that the page content remains readable and links remain usable.
12. Introduce a second failure: enable reduced motion and confirm that no element remains stuck in a hidden start state.
13. Create a `recipes/effect-recipes.json` file containing the evidence, implementation choice, timing values, fallback, and validation checks for all three effects.
14. Document one decision where you rejected a more complex technique because a simpler one satisfied the observed behavior.
15. Include a short README section that separates verified findings from assumptions about the reference.

**Expected output**

- A working responsive page with three effects.
- An evidence ledger and a structured JSON recipe.
- A concise DevTools/performance note.
- A README that records assumptions, trade-offs, and fallback behavior.

**Definition of done / Success criteria**

- [ ] Each effect has an observation that is distinct from its implementation hypothesis.
- [ ] All three effects work at desktop and narrow mobile widths.
- [ ] The page remains readable and navigable with JavaScript disabled.
- [ ] Reduced-motion mode does not leave content hidden or controls difficult to use.
- [ ] Pointer coordinates are relative to the card, not the viewport.
- [ ] No effect depends on hover alone to reveal essential information.
- [ ] DevTools evidence confirms the properties the recipe says are animated.
- [ ] The performance note identifies at least one measured behavior rather than making an unsupported claim.
- [ ] The recipe labels uncertain findings as inferred.
- [ ] A reviewer can reproduce the effect decisions from the written recipe without needing your memory.
