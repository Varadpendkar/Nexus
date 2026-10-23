---
name: awwwards-dissect
layer: 11 — Reverse Engineering
description: A repeatable, evidence-led workflow for analyzing award-level websites and turning observed design and interaction into a realistic reconstruction plan.
---

# SKILL: awwwards-dissect
**Layer:** 11 — Reverse Engineering  
**Goal:** Systematically inspect an award-caliber website, identify the design and implementation techniques responsible for its impact, and produce a testable reconstruction plan without guessing at hidden source code.

---

## Why This Matters (Senior Perspective)

A visually impressive site is the result of many systems working together: art direction, layout, typography, content hierarchy, motion timing, interaction states, rendering performance, responsive behavior, and implementation constraints. Copying only the visible surface usually produces a shallow imitation. A hero may look simple in a screenshot while relying on a pinned scroll sequence, a custom easing curve, responsive image crops, a WebGL displacement layer, or carefully coordinated typography. If the implementation technique is misidentified, the recreation becomes expensive to maintain and fragile across viewport sizes.

Senior developers treat a reference as evidence, not as a specification. They separate what can be observed from what is inferred, test hypotheses with browser tools, and record confidence levels. They do not assume that every effect requires a large library or that a site using a 3D-looking visual necessarily uses WebGL. CSS transforms, SVG filters, canvas, video, and pre-rendered media can produce similar outcomes. The objective is to find the simplest implementation that reproduces the behavior and quality that matter.

In creative-web and freelance work, this process improves estimates, protects scope, and makes client conversations concrete. A useful dissection can identify the signature moments, explain which are feasible with CSS or GSAP, flag likely WebGL and asset-production work, and establish a staged build plan. It also helps avoid copying protected assets or proprietary source: analyze the behavior and design principles, then create original assets and implementation.

---

## Core Concepts

### 1. Separate Observation, Hypothesis, and Verification

**Mental model:** An observation is something directly visible; a hypothesis is a possible explanation; verification is evidence that increases or decreases confidence. Mixing these categories leads to false certainty.

Start by writing neutral observations. “The headline stays in place while the image changes” is observable. “It uses GSAP ScrollTrigger pinning” is a hypothesis. Verify by checking scroll behavior, loaded scripts, DOM structure, computed styles, and performance traces. A production site may use a custom scroll controller or CSS sticky positioning instead.

```text
Observation: The product render remains stationary for about one viewport.
Hypothesis A: position: sticky with a tall parent section.
Hypothesis B: ScrollTrigger pin with a scrubbed timeline.
Hypothesis C: A fixed canvas whose scene state changes with scroll.
Verification: Inspect computed position, DOM changes, script assets, and scroll trace.
Confidence: Medium until at least two independent clues agree.
```

A hypothesis should explain more than one clue. If a pinned section has a spacer element and a GSAP ScrollTrigger instance, the evidence is stronger than merely seeing a stationary image.

**Gotcha:** Minified bundles may contain library names without proving that a particular library powers the observed effect. A site can load GSAP for one small interaction while another effect is implemented in CSS.

**Before / after**

Before: “This website definitely uses WebGL because the object looks 3D.”

After: “The object has parallax and specular highlights. I will check canvas/WebGL contexts, network assets, and layer behavior before selecting a rendering approach.”

### 2. Read the Page as a Sequence, Not a Screenshot

**Mental model:** A website is a state machine driven by viewport, scroll position, pointer, keyboard, network state, and user input. A screenshot captures only one state.

Inspect the first viewport, each major scroll transition, hover/focus states, menu open and closed states, loading states, and the end of the page. Record what triggers each transition and what changes: position, opacity, clipping, scale, content, cursor, or navigation state. Include reduced-motion and narrow viewport behavior where possible.

```js
// Record repeatable observations instead of relying on memory.
const referenceNotes = {
  viewport: { width: 1440, height: 900 },
  initialState: "headline overlaps the product image",
  trigger: "scroll past the first 60% of the hero",
  properties: ["transform", "clip-path", "opacity"],
  exitState: "product image exits upward; next section becomes visible",
  reducedMotionChecked: false
};

console.table(referenceNotes);
```

**Gotcha:** Scroll animations can depend on viewport height. Comparing a 900px-tall desktop viewport with a short laptop window can make the same animation appear to have different timing. Record viewport dimensions with every observation.

**Before / after**

Before: Capture one screenshot and begin coding.

After: Build a state inventory with trigger, start state, end state, duration or scroll range, and responsive variation.

### 3. Identify Layout Architecture Before Styling Details

**Mental model:** Composition is constrained by the page’s layout system. Find the container, grid, alignment rules, and content flow before measuring individual margins.

Use DevTools to inspect semantic landmarks, grid overlays, computed `display`, `grid-template-columns`, `gap`, `max-width`, and logical padding. Look for repeated alignment edges across sections. A site may use a 12-column grid, but do not assume that simply because the layout resembles one; infer the system from repeated evidence.

```css
/* A reconstruction token system makes measured relationships reusable. */
:root {
  --page-gutter: clamp(1.25rem, 4vw, 5rem);
  --content-max: 88rem;
  --grid-gap: clamp(1rem, 2vw, 2rem);
}

.page-shell {
  width: min(calc(100% - 2 * var(--page-gutter)), var(--content-max));
  margin-inline: auto;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: var(--grid-gap);
}
```

**Gotcha:** A visual alignment may be caused by an image’s internal whitespace rather than a CSS grid line. Inspect the image bounds and asset crop before “fixing” the CSS.

### 4. Build a Technique Vocabulary

Use specific names when recording an effect. This makes the notes searchable and gives the implementation plan a meaningful starting point.

| Observable behavior | Candidate technique | Evidence to seek |
|---|---|---|
| Image reveals along a moving edge | `clip-path` reveal | Computed `clip-path`, animated inset/polygon |
| Headline enters word by word | GSAP SplitText or custom splitting | DOM spans, GSAP bundle, staggered transforms |
| Section stays fixed during scroll | ScrollTrigger pin or CSS `position: sticky` | Computed position, spacer, scroll trace |
| Animation progress follows scroll | ScrollTrigger `scrub` or custom progress mapping | Progress tied continuously to scroll |
| Multiple cards enter in sequence | Stagger choreography | Per-item delay or timeline stagger |
| Pointer follows with lag | Lerp / damped interpolation | RequestAnimationFrame loop and eased coordinates |
| Cursor attracts toward a control | Magnetic interaction | Pointer-dependent transform and bounds |
| Background drifts slower than content | Parallax | Different scroll-to-transform ratios |
| Shape changes into another shape | SVG morph or shader deformation | Path interpolation or vertex displacement |
| Image ripples or warps | WebGL displacement map or SVG filter | Canvas context, displacement texture, filter graph |
| Layered artwork has depth | CSS 3D transform or WebGL camera | Perspective transforms or canvas renderer |
| Content swaps without full navigation | View transition or route transition | View Transition API, router hooks, animated overlays |
| Image scales inside a fixed frame | Overflow clipping plus transform | Parent overflow and child transform |
| Text follows a curved path | SVG text path or transformed glyphs | `<textPath>` or per-character positioning |

Do not use the vocabulary as a guessing game. Treat each entry as a candidate, then confirm it.

### 5. Inspect with Browser DevTools

A repeatable inspection pass should use several panels because each reveals a different part of the implementation.

1. **Elements:** inspect semantic structure, class names, inline styles, pseudo-elements, and DOM changes during interaction.
2. **Computed styles:** confirm the final values for `position`, `transform`, `opacity`, `clip-path`, `filter`, `overflow`, and stacking.
3. **Network:** filter by JS, CSS, images, fonts, video, and textures. Check transfer size, cache behavior, and whether large assets load lazily.
4. **Performance:** record a scroll or interaction. Look for long tasks, repeated layout, expensive paint, dropped frames, and scripting spikes.
5. **Layers / Rendering tools:** inspect compositing layers and paint flashing where available. A promoted layer is evidence of compositing, not proof that the entire animation is free.
6. **Sources and profiler:** search loaded bundles for recognizable library symbols when allowed, use source maps if available, and profile expensive callbacks. Do not treat a bundle match as conclusive proof of a specific effect.
7. **Coverage:** identify large unused CSS or JavaScript only as a lead; coverage changes with the states you exercise.

```js
// Run in DevTools Console to capture the current element's computed evidence.
// Replace the selector with a real element selector from the inspected page.
const heroHeading = document.querySelector(".hero__title");

if (heroHeading) {
  const styles = getComputedStyle(heroHeading);
  console.table({
    position: styles.position,
    transform: styles.transform,
    opacity: styles.opacity,
    clipPath: styles.clipPath,
    filter: styles.filter,
    willChange: styles.willChange,
    fontFamily: styles.fontFamily,
    lineHeight: styles.lineHeight
  });
}
```

```js
// Observe DOM mutations while opening a menu or starting an interaction.
// Stop the observer when the evidence-gathering pass is complete.
const mutationObserver = new MutationObserver((records) => {
  for (const record of records) {
    console.log(record.type, record.target, record.attributeName);
  }
});

mutationObserver.observe(document.body, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ["class", "style", "aria-expanded", "hidden"]
});

// In DevTools, run mutationObserver.disconnect() after the inspection.
```

**Gotcha:** Console inspection is not a substitute for accessibility inspection. Keyboard focus, accessible names, and reduced-motion behavior may not be visible in a pointer-only pass.

### 6. Infer Motion Timing and Easing

Motion is a relationship between trigger, duration, easing, distance, and sequencing. A similar final position with the wrong easing can feel noticeably different. Record whether progress is time-based or scroll-based, whether elements move together, and whether the animation has overshoot or spring-like settling.

```js
// A local reconstruction can use a named easing curve instead of guessing
// separate arbitrary durations for each element.
const motionSpec = {
  reveal: { duration: 0.8, ease: "power3.out" },
  supportingCopy: { duration: 0.55, ease: "power2.out", delay: 0.16 },
  imageExit: { duration: 1.1, ease: "power2.inOut" },
  scrollLinked: true
};
```

For GSAP, use a timeline when multiple properties must remain coordinated. Use `scrub` only when animation progress should track scroll position. Use a timed entrance when the motion should complete independently of scroll.

```js
// Example reconstruction: coordinate a heading reveal and image scale.
gsap.timeline({
  defaults: { ease: "power3.out" }
})
  .from(".case-study__eyebrow", {
    y: 18,
    opacity: 0,
    duration: 0.45
  })
  .from(".case-study__title", {
    yPercent: 105,
    opacity: 0,
    duration: 0.85
  }, "-=0.2")
  .from(".case-study__visual", {
    scale: 1.08,
    opacity: 0,
    duration: 1
  }, "-=0.55");
```

**Gotcha:** `yPercent` is relative to the target element’s own height. If the target’s font wraps differently on mobile, the perceived travel distance changes. Test at the actual responsive text layout.

### 7. Distinguish CSS, SVG, Canvas, and WebGL

Choose the smallest tool that can reproduce the observed behavior within performance and quality constraints.

- **CSS transforms and clipping:** best for common reveals, simple parallax, hover states, and layered compositions.
- **SVG:** useful for vector artwork, path-based masks, filter effects, and modest path animation.
- **Canvas 2D:** suitable for many particles, drawing, and pixel-level effects without a DOM node per particle.
- **WebGL / Three.js:** useful for 3D scenes, shader-based distortion, large numbers of GPU-rendered objects, and camera-driven effects.
- **Video or pre-rendered media:** sometimes the correct choice for a highly art-directed sequence with no meaningful interaction.

```js
// A quick capability probe helps identify the available rendering context.
// It does not prove that the reference uses this technique.
const probeCanvas = document.createElement("canvas");
const webglContext =
  probeCanvas.getContext("webgl2") ||
  probeCanvas.getContext("webgl");

console.log({
  webglAvailable: Boolean(webglContext),
  userAgent: navigator.userAgent,
  devicePixelRatio: window.devicePixelRatio
});
```

**Gotcha:** A successful WebGL context probe only says the browser can create one. It does not identify the reference site's renderer. Confirm the actual DOM and network evidence.

### 8. Record Responsive and Accessibility Differences

A desktop interaction may be simplified, replaced, or removed on mobile. Check menu behavior, touch input, hover-only controls, scroll pin duration, image crop, and text wrapping at multiple widths. Test `prefers-reduced-motion`, keyboard access, focus visibility, and semantic landmarks.

```css
/* Keep a meaningful static state when the visitor requests reduced motion. */
@media (prefers-reduced-motion: reduce) {
  .reveal,
  .parallax-layer,
  .magnetic-control {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms;
    scroll-behavior: auto;
    transform: none;
  }
}
```

```js
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function configureMotion() {
  if (reducedMotionQuery.matches) {
    // Preserve readable content; remove nonessential motion instead of hiding it.
    gsap.set(".hero__title, .hero__visual", { clearProps: "transform,opacity" });
  } else {
    // Only initialize the full timeline when motion is permitted.
    initializeHeroTimeline();
  }
}

reducedMotionQuery.addEventListener("change", configureMotion);
configureMotion();
```

**Gotcha:** A reduced-motion CSS override may not cancel a running JavaScript timeline. The animation system needs an explicit reduced-motion path and a cleanup strategy.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1 — Reference Evidence Ledger

**What it does:** Stores each visible behavior with its evidence, confidence, and unresolved questions.  
**When to use it:** Before estimating or implementing a reference-heavy portfolio or client landing page.

```js
const evidenceLedger = [
  {
    region: "hero",
    behavior: "headline reveals from below a clipping frame",
    candidate: "overflow-hidden wrapper + translateY",
    evidence: ["computed overflow is hidden", "heading transform changes on load"],
    confidence: "high",
    unresolved: ["whether the timeline is GSAP or CSS"]
  },
  {
    region: "feature section",
    behavior: "product image stays in view while copy changes",
    candidate: "sticky media column",
    evidence: ["media column computed position is sticky"],
    confidence: "medium",
    unresolved: ["whether copy changes are route state or scroll state"]
  }
];

const unresolvedItems = evidenceLedger.filter(
  (item) => item.confidence !== "high" || item.unresolved.length > 0
);

console.table(unresolvedItems);
```

Keep the ledger honest: do not upgrade confidence merely because an implementation is convenient.

### Pattern 2 — Interaction State Matrix

**What it does:** Makes state coverage explicit and prevents a recreation that only works on the happy path.  
**When to use it:** For navigation, hover cards, cursor effects, scroll scenes, and modal transitions.

```js
const interactionMatrix = [
  { component: "primary-navigation", input: "keyboard", state: "focused", expected: "visible focus ring" },
  { component: "primary-navigation", input: "pointer", state: "menu-open", expected: "submenu remains reachable" },
  { component: "project-card", input: "touch", state: "activated", expected: "project link navigates" },
  { component: "hero-scene", input: "reduced-motion", state: "static", expected: "content remains complete" },
  { component: "contact-form", input: "network", state: "failed", expected: "recoverable error message" }
];

console.table(interactionMatrix);
```

### Pattern 3 — Performance Budget Before Recreation

**What it does:** Sets constraints before adding expensive effects.  
**When to use it:** When the reference uses full-screen media, canvas, WebGL, large images, or complex scroll scenes.

```js
const reconstructionBudget = {
  targetFrameRate: 60,
  targetLcpSeconds: 2.5,
  maxHeroImageBytes: 450_000,
  allowContinuousAnimationWhenIdle: false,
  webglRequiredOnlyIf: [
    "CSS/SVG cannot reproduce the visible deformation",
    "the interaction depends on real 3D camera movement",
    "the visual payoff justifies GPU and fallback complexity"
  ]
};

console.table({
  ...reconstructionBudget,
  webglRequiredOnlyIf: reconstructionBudget.webglRequiredOnlyIf.join("; ")
});
```

These are project targets, not universal industry guarantees. Set them according to the device range and actual content.

### Pattern 4 — Reconstruction Spike

**What it does:** Builds one isolated proof of the hardest effect before the full page.  
**When to use it:** When a client reference includes displacement, a pinned scroll sequence, a complex cursor, or morphing geometry.

```html
<section class="prototype" aria-labelledby="prototype-title">
  <h2 id="prototype-title">Motion prototype</h2>
  <div class="prototype__frame">
    <img
      class="prototype__image"
      src="/assets/ceramic-vessel.webp"
      alt="Sculptural ceramic vessel on a neutral background"
    />
  </div>
</section>
```

```css
.prototype__frame {
  overflow: clip;
  aspect-ratio: 4 / 3;
  background: #e9e4dc;
}

.prototype__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.04);
  transition: transform 700ms cubic-bezier(.22, 1, .36, 1);
}

.prototype__frame:hover .prototype__image {
  transform: scale(1);
}
```

Start with the simplest plausible technique. Escalate to GSAP, SVG, canvas, or WebGL only when the prototype demonstrates a specific limitation.

---

## Common Mistakes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Declaring a library based on visual style | Several techniques can produce similar pixels | Record at least two independent evidence sources before naming the implementation |
| Inspecting only the hero screenshot | Static images hide state changes and responsive behavior | Capture a state inventory for load, scroll, hover, focus, menu, and mobile |
| Copying arbitrary pixel values | A screenshot gives no information about the underlying constraint | Measure repeated edges and encode a responsive grid, container, and spacing tokens |
| Assuming every pinned scene uses ScrollTrigger | Sticky positioning can produce the same visible result | Inspect computed `position`, parent height, DOM spacers, and scroll-linked changes |
| Treating a loaded library as proof | Bundles often support unrelated components | Connect the library evidence to the specific element and timeline behavior |
| Ignoring image crop and internal whitespace | Asset composition can masquerade as layout spacing | Inspect source dimensions and visible alpha/blank margins before changing layout |
| Measuring motion on only one viewport | Viewport size changes scroll distance and wrapping | Repeat the trace at desktop, tablet, and mobile dimensions |
| Rebuilding every detail before proving the hard effect | Uncertainty is hidden until late in the schedule | Create a focused prototype for the highest-risk interaction first |
| Adding WebGL for a simple reveal | Technology is chosen for prestige rather than fit | Benchmark a CSS/SVG version first and document what it cannot reproduce |
| Leaving reduced motion until the end | Motion becomes embedded in component structure | Include a reduced-motion state in the first interaction matrix |
| Using only pointer testing | Hover states can conceal keyboard failures | Test Tab, Shift+Tab, Enter, Space, Escape, and visible focus states |
| Ignoring network and asset weight | A faithful effect can still ship too slowly | Record asset sizes, format, lazy-loading behavior, and transfer timing |
| Confusing compositing with free animation | A layer can still consume fill rate or trigger expensive scripting | Profile the interaction and inspect dropped frames on a representative device |
| Treating the first hypothesis as fact | Confirmation bias makes later evidence easy to misread | Keep alternatives and unresolved questions in the ledger until verified |
| Copying proprietary assets or source | Visual analysis is confused with permission to reuse | Recreate the technique with original assets and respect licensing and site terms |

---

## Mental Models

1. **Evidence before implementation** — visible behavior is a fact; the technique behind it is a hypothesis until verified.
2. **A page is a state machine** — load, scroll, pointer, keyboard, network, and viewport can all change the output.
3. **Find the constraint, not the pixel** — repeated alignment usually reveals a layout rule worth reproducing.
4. **One clue is not proof** — combine DOM, computed styles, network, and runtime behavior before committing.
5. **Use the least complex sufficient tool** — CSS before a timeline, a timeline before a renderer, unless evidence demands otherwise.
6. **Prototype uncertainty early** — the riskiest interaction should be tested before polishing low-risk details.
7. **Quality includes failure states** — mobile, reduced motion, keyboard input, and slow loading are part of the design.
8. **Reconstruction is not source recovery** — reproduce the observed experience, not imagined hidden code.

---

## Quick Reference

| Situation | First inspection | Likely candidates | Verification |
|---|---|---|---|
| Text reveals from a mask | Elements + computed `overflow` and `transform` | CSS clip, GSAP SplitText, wrapper translation | Watch DOM and computed transforms during load |
| Scroll-pinned product scene | Computed position + scroll recording | `position: sticky`, ScrollTrigger pin, fixed canvas | Inspect parent height, spacer nodes, scroll-linked progress |
| Image ripples on pointer | Network + canvas/SVG inspection | SVG displacement, WebGL displacement map | Check filter graph, WebGL context, texture assets |
| Cursor trails with lag | Sources + Performance profiler | `requestAnimationFrame`, lerp, spring/damping | Inspect event listeners and frame cost |
| Shapes morph | SVG DOM + shader assets | SVG path morph, vertex shader | Compare path data or inspect shader/program setup |
| Repeated cards animate in order | DOM + timeline evidence | stagger, IntersectionObserver, scroll timeline | Test re-entry and reduced motion |
| Page feels slow | Network + Performance | oversized media, long tasks, layout thrash | Record trace and identify the dominant cost |
| Desktop looks excellent but mobile fails | Responsive mode + touch simulation | breakpoint changes, touch-specific states | Test real content width, keyboard, and touch input |

---

## Build Challenge

### Build a Reference Dissection Dossier for a Creative Portfolio Landing Page

Choose one publicly accessible portfolio or studio landing page you have permission to inspect. Do not copy its proprietary source or download assets for reuse. Produce an evidence-led dossier and a small original reconstruction of one signature interaction.

**Requirements**

1. Record the tested URL, date, browser, viewport dimensions, and device pixel ratio.
2. Capture at least six meaningful states: initial load, mid-scroll, section transition, hover, keyboard focus, and mobile layout.
3. Write at least eight technique hypotheses using specific vocabulary such as `clip-path reveal`, `ScrollTrigger pin`, `scrub`, `stagger`, `custom ease`, `lerp`, `parallax`, `SVG morph`, `WebGL displacement`, or `sticky positioning`.
4. For each hypothesis, list an observation, at least one alternative explanation, evidence gathered, confidence, and the next verification step.
5. Use DevTools Elements, computed styles, Network, Performance, and Sources or profiler in the investigation. Record what each panel contributed.
6. Build a semantic HTML/CSS reconstruction of one section using original text and licensed or self-created media.
7. If motion is needed, include an explicit reduced-motion path and keyboard-operable controls.
8. Measure the heaviest relevant assets and record one performance observation from a trace.
9. Include a risk list with at least three implementation uncertainties and the test that would resolve each.
10. Deliver a reconstruction plan with component boundaries, technique choices, libraries (if any), asset needs, responsive behavior, and effort estimates.

**Expected output**

- `reference-dossier.md` containing the evidence ledger, state matrix, technique vocabulary, DevTools findings, confidence ratings, and risk list.
- A working local prototype of the selected section.
- A short validation note with desktop/mobile behavior, reduced-motion behavior, keyboard checks, and performance observations.

**Definition of Done / Success Criteria**

The dossier distinguishes observed facts from inferred implementation; contains at least eight named techniques and at least five DevTools inspection findings; includes a reproducible reconstruction plan; and the prototype works at a desktop and narrow viewport without hiding essential content. A second developer should be able to understand the evidence and begin implementation without needing the original analyst to explain undocumented assumptions.

**Estimated effort:** 3–5 focused hours for the dossier and a modest CSS/GSAP prototype; longer if the selected reference requires original 3D assets or shader work.
