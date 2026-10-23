# SVG Animation Patterns — Production Skill Guide

## Why This Matters

SVG animation is often the first motion a visitor sees on a creative portfolio: a logo draws itself, an illustration assembles as the page loads, or a progress arc communicates a process. It is also a place where subtle implementation mistakes become highly visible. A path can remain invisible because `stroke-dashoffset` is larger than its actual length; a mark can draw in the wrong direction because its path data begins at an unexpected point; an SVG can scale beautifully at one size and become distorted when a different `viewBox` is used; or an entrance animation can replay on every scroll because its observer never disconnects. A complex logo can also create a burst of main-thread work precisely when the page is trying to become interactive.

The aim of this skill is to help you build SVG motion that is intentional, measurable, accessible, responsive, and maintainable. The techniques apply to line-drawing reveals, animated icons, path-based indicators, logo sequences, route illustrations, and small explanatory diagrams. They are useful for Awwwards-style portfolios, agency sites, product interfaces, and client work where motion must feel polished without making the interface fragile.

A production implementation has to answer more than “does it animate?” It must decide which animation technology fits the requirement, establish a stable final state, respect reduced-motion preferences, preserve meaning when scripts fail, avoid unnecessary work, and define how the animation behaves when a component is removed or revisited. It should also be debuggable by another developer who did not create the original SVG.

## Core Concepts

### 1. Choose the correct animation layer

SVG animation can be driven by CSS, SMIL, or JavaScript libraries such as GSAP. The right choice depends on the property being animated, the need for sequencing, and the complexity of interaction. CSS is usually the simplest option for a repeating stroke reveal or a hover state. SMIL can express timing and interpolation directly in SVG markup, but project support policies and browser requirements should be checked. JavaScript is appropriate when animation depends on application state, scroll progress, user input, or coordination across many elements.

```html
<svg viewBox="0 0 240 80" role="img" aria-labelledby="layer-title layer-desc">
  <title id="layer-title">Three animation layers</title>
  <desc id="layer-desc">A path, a circle, and a label illustrate different animation targets.</desc>
  <path id="route" d="M12 40 H228" fill="none" stroke="currentColor" stroke-width="3" />
  <circle id="marker" cx="12" cy="40" r="7" fill="tomato" />
</svg>
<script>
const route = document.querySelector('#route');
const length = route.getTotalLength();
route.style.strokeDasharray = String(length);
route.style.strokeDashoffset = String(length);
route.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
  duration: 1200, easing: 'ease-out', fill: 'forwards'
});
</script>
```

### 2. Understand path length and dash geometry

The classic line-drawing effect works by painting a dash whose length matches the path, then offsetting that dash so the visible stroke begins outside the path. `getTotalLength()` is the reliable way to obtain a path's measured length after the SVG has been parsed. A hard-coded dash value may appear correct for one icon and fail when the path changes, is scaled, or is replaced by a designer. Store the measured value in a CSS custom property only when you need to reuse it, and refresh it if the underlying geometry changes.

```html
const path = document.querySelector('.draw-path');
function preparePath(element) {
  const length = element.getTotalLength();
  element.style.strokeDasharray = `${length} ${length}`;
  element.style.strokeDashoffset = `${length}`;
  return length;
}
const length = preparePath(path);
path.animate(
  [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
  { duration: 900, easing: 'cubic-bezier(.22,.8,.25,1)', fill: 'forwards' }
);
```

### 3. Design SVG coordinate systems deliberately

SVG viewBox coordinates are not CSS pixels. The viewBox defines a user-space rectangle, while the rendered width and height determine how that rectangle is mapped to the viewport. A path's measured length is expressed in user units. That distinction matters when a logo is rendered at 48 pixels on a button and at 600 pixels in a hero. `preserveAspectRatio` controls how the viewBox fits; `none` can distort geometry and should be intentional. For responsive illustrations, define the viewBox and let CSS size the outer SVG.

```html
<svg class="brand-mark" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet"
     role="img" aria-labelledby="brand-title">
  <title id="brand-title">Northstar brand mark</title>
  <path class="brand-mark__stroke" d="M20 95 L80 25 L140 95 L200 25 L260 95 L300 45"
        fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
</svg>
<style>
.brand-mark { display: block; inline-size: min(100%, 32rem); block-size: auto; }
.brand-mark__stroke { vector-effect: non-scaling-stroke; }
</style>
```

### 4. Separate static artwork from animated state

Keep the stable illustration understandable without animation. The SVG should contain meaningful geometry and accessible naming; animation should progressively enhance it. Avoid constructing the entire icon only after JavaScript executes, because a failed script then produces an empty visual. A useful structure uses a stable path class, a small animation controller, and explicit states such as idle, playing, completed, and cancelled. This makes re-entry, route changes, and reduced-motion behavior much easier to reason about.

```html
<svg class="check-icon" viewBox="0 0 48 48" role="img" aria-labelledby="check-title">
  <title id="check-title">Completed</title>
  <circle class="check-icon__ring" cx="24" cy="24" r="20" />
  <path class="check-icon__tick" d="M13 25 L21 32 L36 16" />
</svg>
<style>
.check-icon__ring, .check-icon__tick {
  fill: none; stroke: currentColor; stroke-width: 3;
  stroke-linecap: round; stroke-linejoin: round;
}
</style>
```

### 5. Use CSS for simple, declarative reveals

CSS animations are appropriate when timing is local to the SVG and no external timeline is required. A class can trigger the reveal, while keyframes animate `stroke-dashoffset` or opacity. Prefer class changes over assigning many inline styles from event handlers. Define easing and duration with named tokens so a brand can tune motion consistently. Do not assume that animating every SVG attribute through CSS works identically in all engines: CSS properties and presentation attributes are related but not interchangeable for every attribute.

```html
.is-ready .draw-path {
  animation: path-reveal 1.1s cubic-bezier(.2,.75,.25,1) both;
}
@keyframes path-reveal {
  from { stroke-dashoffset: var(--path-length, 500); }
  to   { stroke-dashoffset: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .is-ready .draw-path { animation: none; stroke-dashoffset: 0; }
}
```

### 6. Use SMIL when the animation belongs to the SVG

SMIL elements such as `animate`, `animateTransform`, and `animateMotion` can keep a self-contained graphic portable. They are expressive for declarative timing and path-based motion, especially when the graphic is embedded as an SVG asset. They are less convenient when the application must pause, reverse, scrub, or coordinate with unrelated DOM components. Validate support for the browsers and embedding mode that matter to the product. If a content security policy or sanitization pipeline strips animation elements, use an alternative strategy.

```html
<svg viewBox="0 0 160 60" role="img" aria-labelledby="smil-title">
  <title id="smil-title">A dot moves across a line</title>
  <path d="M10 30 H150" stroke="currentColor" stroke-width="2" />
  <circle r="6" cy="30" fill="royalblue">
    <animate attributeName="cx" values="10;150;10" dur="3s" repeatCount="indefinite" />
  </circle>
</svg>
```

### 7. Build a robust JavaScript controller

A controller should measure geometry once per stable shape, apply a known initial state, and expose play or reset operations. Avoid starting an animation from multiple sources at once, such as a CSS class and a JavaScript `animate()` call on the same property. If a component is mounted repeatedly, clean up listeners and cancel running Web Animations. For GSAP, scope selectors to the component and revert the context during teardown. The controller should tolerate a missing SVG or path instead of throwing a fatal error on an optional decorative element.

```html
function createPathReveal(root) {
  const path = root?.querySelector('path[data-draw]');
  if (!path) return { play() {}, reset() {}, destroy() {} };
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length} ${length}`;
  path.style.strokeDashoffset = `${length}`;
  let animation;
  return {
    play() {
      animation?.cancel();
      animation = path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: 850, easing: 'ease-out', fill: 'forwards' }
      );
    },
    reset() { animation?.cancel(); path.style.strokeDashoffset = `${length}`; },
    destroy() { animation?.cancel(); animation = undefined; }
  };
}
```

### 8. Sequence multiple paths intentionally

A multi-path logo can reveal in order, in parallel, or in groups. The sequencing should reflect how the viewer reads the mark rather than the order in which path elements happen to appear in the file. Store a delay or sequence index in data attributes, or use a timeline when the sequence is editorially important. Keep the number of simultaneous animations small for complex SVGs. A sequence should also have a clear end state, so rerendering the component does not restart the animation accidentally.

```html
const paths = [...document.querySelectorAll('[data-sequence]')];
paths.sort((a, b) => Number(a.dataset.sequence) - Number(b.dataset.sequence));
paths.forEach((path, index) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length} ${length}`;
  path.style.strokeDashoffset = `${length}`;
  path.animate(
    [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
    { duration: 650, delay: index * 140, easing: 'ease-out', fill: 'forwards' }
  );
});
```

### 9. Animate transforms without changing geometry

When a marker travels, a group rotates, or an icon nudges, transform-based animation usually avoids repeated layout work because SVG geometry stays unchanged. SVG transform origins can be surprising: they may be resolved in the SVG coordinate system, and browser behavior around transform-box matters. Set `transform-box` and `transform-origin` explicitly when rotating around the visual center. For path-following motion, prefer a real motion-path solution or a library timeline rather than repeatedly approximating coordinates by hand.

```html
.orbiting-mark {
  transform-box: fill-box;
  transform-origin: center;
  animation: orbit-turn 4s linear infinite;
}
@keyframes orbit-turn {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .orbiting-mark { animation: none; }
}
```

### 10. Trigger animation with visibility and lifecycle

A logo reveal should not necessarily play before the element is visible. IntersectionObserver can trigger a one-shot animation and then disconnect. Observe the actual element rather than polling scroll position. Decide whether an element that scrolls out of view and back should replay; most logos and explanatory illustrations should animate once, while interactive demos may replay on explicit user request. If the element is removed from the document, disconnect the observer and cancel animations to avoid retaining references.

```html
const target = document.querySelector('[data-reveal-on-view]');
if (target && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      target.classList.add('is-ready');
      observer.unobserve(target);
      observer.disconnect();
    }
  }, { threshold: 0.25 });
  observer.observe(target);
} else {
  target?.classList.add('is-ready');
}
```

### 11. Respect reduced motion and user control

A path drawing can be decorative, but a long looping reveal can become distracting or uncomfortable. Honor `prefers-reduced-motion` in CSS and check the same preference in JavaScript before creating motion-heavy sequences. For animation that repeats or runs for a long time, provide a pause or stop control when required by accessibility guidance. Reduced motion should preserve the meaning of the graphic: show the completed path immediately rather than leaving the stroke invisible. Do not use animation as the only way to communicate status.

```html
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function revealOrShow(path) {
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length} ${length}`;
  if (reduceMotion.matches) {
    path.style.strokeDashoffset = '0';
    return;
  }
  path.style.strokeDashoffset = `${length}`;
  path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
    duration: 900, easing: 'ease-out', fill: 'forwards'
  });
}
```

### 12. Debug rendering, timing, and cleanup

SVG animation bugs often come from geometry rather than timing: a zero-length path, `display:none` measurement, a dash pattern that does not match the path, a CSS rule overriding the animated value, or a viewBox mismatch. Use browser DevTools to inspect the computed `stroke-dasharray`, `stroke-dashoffset`, opacity, transform, and animation state. Test in Chromium, Firefox, and Safari if they are in scope, and include an actual touch device when the animation is tied to pointer interactions. A small diagnostic helper can report path lengths and current style values in one table.

```html
function inspectDrawPaths(root = document) {
  const rows = [...root.querySelectorAll('path[data-draw]')].map((path) => {
    const style = getComputedStyle(path);
    return {
      selector: path.id || path.className.baseVal || '(unnamed path)',
      length: path.getTotalLength(),
      dasharray: style.strokeDasharray,
      dashoffset: style.strokeDashoffset,
      stroke: style.stroke,
      visibility: style.visibility,
      display: style.display
    };
  });
  console.table(rows);
  return rows;
}
```

### 13. Ship animation as a resilient enhancement

Production-ready animation includes a stable final state, an accessible SVG title or decorative hiding, reduced-motion behavior, responsive geometry, and cleanup. Keep SVG markup compact and remove editor metadata when it adds no runtime value. Avoid dozens of filters, masks, and simultaneously animated paths in a small icon. For a critical brand mark, make sure the static asset remains useful when JavaScript is blocked, delayed, or disabled. Treat performance and compatibility checks as part of the feature rather than as post-launch polish.

```html
<svg class="status-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
  <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" />
  <path data-draw d="M13 24 L21 32 L36 15" fill="none" stroke="currentColor"
        stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
</svg>
<script>
const mark = document.querySelector('.status-mark');
const controller = createPathReveal(mark);
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) controller.play();
else mark.querySelector('[data-draw]')?.style.setProperty('stroke-dashoffset', '0');
</script>
```

## Named Patterns

Use these as reusable recipes, not as a reason to animate every graphic. Each pattern states what it does, when it is appropriate, and a working implementation shape. Adapt selectors and visual details to the actual SVG rather than copying example IDs into multiple instances on the same page.

### Pattern: Single path draw reveal

**What it does:** Draw a single stroke from its start to its end.

**When to use it:**  signatures, outline icons, route maps, and progress illustrations when the line's direction is meaningful.

```js
const path = document.querySelector('.signature path');
const length = path.getTotalLength();
path.style.strokeDasharray = `${length} ${length}`;
path.style.strokeDashoffset = `${length}`;
path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
  duration: 1400, easing: 'cubic-bezier(.22,.75,.25,1)', fill: 'forwards'
});
```

### Pattern: Staggered logo construction

**What it does:** Reveal several strokes in a deliberate reading order.

**When to use it:**  marks built from distinct strokes where sequencing adds clarity; do not blindly stagger hundreds of decorative paths.

```js
const paths = [...document.querySelectorAll('.logo [data-order]')]
  .sort((a, b) => +a.dataset.order - +b.dataset.order);
paths.forEach((path, i) => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = `${length} ${length}`;
  path.style.strokeDashoffset = `${length}`;
  path.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
    duration: 500, delay: i * 100, easing: 'ease-out', fill: 'forwards'
  });
});
```

### Pattern: Scroll-triggered one-shot reveal

**What it does:** Start when an illustration enters the viewport and stop observing after the first reveal.

**When to use it:**  editorial diagrams and case-study visuals, with an immediate static fallback when IntersectionObserver is unavailable.

```js
const illustration = document.querySelector('.case-study-illustration');
if (illustration && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      illustration.classList.add('is-visible');
      io.disconnect();
    }
  }, { threshold: 0.2 });
  io.observe(illustration);
} else illustration?.classList.add('is-visible');
```

### Pattern: Interactive icon state transition

**What it does:** Transition between meaningful icon states such as menu and close. Use when the control state changes; ensure the button label and accessible state update at the same time as the artwork..

**When to use it:** Transition between meaningful icon states such as menu and close. Use when the control state changes; ensure the button label and accessible state update at the same time as the artwork.

```js
const button = document.querySelector('[aria-controls="site-menu"]');
button?.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  button.classList.toggle('is-open', !expanded);
});
```

### Pattern: Motion along a path

**What it does:** Move a marker along a route while keeping the route geometry fixed.

**When to use it:**  maps, process diagrams, and explanatory sequences; make sure the marker position communicates information rather than decoration alone.

```js
const route = document.querySelector('#route-path');
const marker = document.querySelector('#route-marker');
const length = route.getTotalLength();
const start = performance.now();
function frame(now) {
  const progress = Math.min((now - start) / 1800, 1);
  const point = route.getPointAtLength(progress * length);
  marker.setAttribute('cx', point.x);
  marker.setAttribute('cy', point.y);
  if (progress < 1) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

### Pattern: Progress ring

**What it does:** Animate a circular indicator by setting dash length and offset.

**When to use it:**  bounded progress or completion feedback, not as a substitute for a textual status value.

```js
const ring = document.querySelector('.progress-ring circle');
const radius = Number(ring.getAttribute('r'));
const circumference = 2 * Math.PI * radius;
ring.style.strokeDasharray = `${circumference}`;
function setProgress(value) {
  const clamped = Math.max(0, Math.min(100, value));
  ring.style.strokeDashoffset = `${circumference * (1 - clamped / 100)}`;
}
```

## Implementation Workflow

### 1. Inspect the source SVG before adding motion

Open the SVG as text and identify its `viewBox`, path count, groups, fills, strokes, clipping paths, masks, and transforms. Decide whether every path must animate or whether a simpler silhouette communicates the same idea. Exported artwork often contains dozens of tiny segments, duplicate paths, hidden layers, and transforms nested several levels deep. These are not automatically wrong, but they make sequencing and debugging harder. Rename important paths with stable classes or data attributes, and avoid selecting paths by fragile positional selectors such as `path:nth-child(7)`.

### 2. Establish the static final state

Before introducing animation, make the SVG look correct with all strokes visible. Confirm the correct stroke width, line cap, line join, fill rule, and aspect ratio. Use `role="img"` with a title for meaningful standalone artwork, or `aria-hidden="true"` and `focusable="false"` for purely decorative SVGs. If the graphic communicates a status or value, provide equivalent text in the surrounding interface. The user must not need to wait for motion to understand the page.

### 3. Pick the smallest suitable animation system

Choose CSS for simple local state transitions and short reveals. Choose SMIL for self-contained SVG assets when its capabilities fit the target environment. Choose the Web Animations API for a modest amount of JavaScript-driven control and cancellation. Choose GSAP when you need timelines, complex sequencing, scroll scrubbing, or coordination between SVG and HTML. Avoid running multiple systems against the same property. If CSS and JavaScript both write `stroke-dashoffset`, the final result can depend on cascade and fill behavior rather than your intended sequence.

### 4. Measure geometry and apply the initial state

For path drawing, call `getTotalLength()` and set a dash pattern whose visible segment covers the full path. Apply the hidden initial state before starting the animation, otherwise the user may see a flash of the fully drawn path. Measurement requires a rendered, measurable SVG path. A path inside `display:none` may report unexpected dimensions; defer measurement until it becomes measurable or temporarily use a safe off-screen measurement strategy. Do not read geometry repeatedly in every animation frame when a single measurement will do.

### 5. Define the lifecycle

Decide whether the animation runs on mount, when it enters the viewport, on hover, on click, or in response to an application event. Define whether it runs once or can replay. Keep references to observers and animation instances so they can be cancelled or disconnected. In component frameworks, create the animation after the DOM node exists and clean it up on unmount. Avoid global selectors that can accidentally animate another instance of the same component.

### 6. Test edge cases before visual polish

Test an SVG with a zero-length or missing path, an animation interrupted midway, a user with reduced motion enabled, a slow device, a narrow viewport, a browser with different SVG transform behavior, and a page where the component is mounted more than once. Check whether the final state remains correct if JavaScript fails. Then tune timing, easing, stagger, and sequencing. Motion should not be polished on top of an unstable base.

## Accessibility and Inclusive Motion

- Give meaningful SVG images an accessible name using `<title>` and `aria-labelledby`, or an appropriate `aria-label` when that is simpler.
- Mark decorative graphics `aria-hidden="true"`; do not create noisy screen-reader output for every flourish in a page.
- Prefer native `<button>` elements for controls that start, stop, or replay an animation. A clickable `<svg>` alone is not a keyboard-operable control.
- Keep the control's accessible label and `aria-expanded` or other state attributes synchronized with its visible icon state.
- Support `:focus-visible` on the control that owns the animation. The SVG itself usually should not become a tab stop unless it is an actual interactive graphic.
- Respect `prefers-reduced-motion`. For a path reveal, the most useful reduced-motion alternative is often the completed, static stroke rather than a hidden path.
- Do not use color, motion, or an animated icon as the only signal for success, failure, progress, or navigation state.
- Avoid rapid flashing and continuous movement that distracts from reading. If motion runs automatically for a long duration, assess whether a pause or stop mechanism is required.
- Test at 200% zoom and with keyboard-only navigation. Check contrast for strokes against the actual background, including dark mode.
- If an animated diagram conveys relationships, provide a text explanation or a static fallback that preserves those relationships.

Example accessible control:

```html
<button class="menu-toggle" type="button" aria-controls="site-menu" aria-expanded="false">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path class="menu-line menu-line--top" d="M3 6 H21" />
    <path class="menu-line menu-line--middle" d="M3 12 H21" />
    <path class="menu-line menu-line--bottom" d="M3 18 H21" />
  </svg>
  <span class="visually-hidden">Open menu</span>
</button>
```

```css
.menu-toggle { min-inline-size: 44px; min-block-size: 44px; }
.menu-toggle:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
.menu-line { transition: transform 180ms ease, opacity 180ms ease; }
@media (prefers-reduced-motion: reduce) {
  .menu-line { transition: none; }
}
```

## Performance and Rendering

SVG is resolution-independent, but it is not free. A logo with hundreds of paths, masks, filters, and animated properties can create expensive paint and compositing work. Profile the actual page rather than assuming vector means lightweight. Animate the smallest necessary set of properties, prefer `transform` and `opacity` for motion where they fit the visual requirement, and remember that SVG stroke properties may still trigger paint. `stroke-dashoffset` is the right technique for a line-drawing reveal, but it should not be assumed to be compositor-only.

Avoid creating a new animation object on every pointer movement. For continuous motion, keep a single animation loop or use a timeline and update values efficiently. Do not write layout or geometry-affecting properties and then immediately read layout again in the same loop. Measure paths once and cache their lengths until the geometry changes. If the SVG is responsive but its path data is static, resizing the rendered SVG generally does not require recalculating the path length in user units; if you alter the path or replace the artwork, measure again.

Use `will-change` sparingly. It is not a universal performance switch, and applying it to every path can increase memory use. Prefer removing inactive observers and cancelling abandoned animations. In DevTools, inspect the Performance panel for long tasks, layout and paint activity, and dropped frames. The Rendering panel can help visualize paint flashing and compositing layers. Compare with animation disabled to determine whether motion is actually responsible for the slowdown.

A practical performance budget should be based on the target device. For a simple icon, a single path or a few paths and a short animation are usually enough. For a large hero illustration, test the real asset on mid-range mobile hardware. If the effect requires hundreds of independently animated pieces, consider simplifying the SVG, grouping paths, using a canvas for particle-like motion, or reducing the number of simultaneously active elements.

## Browser Support and Compatibility Notes

SVG, CSS animations, `getTotalLength()`, `requestAnimationFrame`, and IntersectionObserver are widely supported in current evergreen browsers, but the exact behavior still depends on the property, embedding context, and version. Test the browser support matrix that matches the project instead of relying on a blanket statement that “SVG is supported.” In particular, validate CSS animation of SVG properties, transform origin behavior, SMIL use in the target browsers, and the way SVG is embedded (inline markup, `<img>`, CSS background, or external `<object>`).

Inline SVG gives the page direct access to its paths and makes CSS classes and JavaScript selectors straightforward. SVG referenced through `<img src="...">` is isolated from the parent document's DOM and cannot be targeted internally with ordinary page selectors. If the graphic must react to application state, inline the markup, use a component that renders SVG, or expose the interaction through a supported external mechanism. Content sanitizers and content management systems may strip script or animation elements from uploaded SVG files; never assume untrusted SVG markup can safely run arbitrary code.

Check `@supports` only when it can meaningfully gate a CSS feature. It does not replace testing the full animation behavior. Use feature detection for APIs such as `IntersectionObserver`, and provide a static reveal if the API is absent. For browser compatibility research, consult current MDN documentation and Can I Use for the specific property or API. Re-test Safari and Firefox if the effect depends on SVG transform origins or unusual path geometry. Also test touch devices: hover-only triggers are not an adequate interaction model for a mobile interface.

## Debugging Playbook

1. Confirm the SVG is in the DOM and has a non-zero bounding box.
2. Inspect `viewBox`, width, height, `preserveAspectRatio`, and any ancestor transforms.
3. Select the exact path and call `getTotalLength()` in the console.
4. Inspect computed `stroke`, `stroke-width`, `stroke-dasharray`, and `stroke-dashoffset`.
5. Temporarily set `stroke-dashoffset: 0`; if the path still does not appear, the problem is not the animation timing.
6. Disable CSS animations and transitions to find cascade conflicts.
7. Check whether the SVG is embedded through `<img>` rather than inline markup.
8. Confirm the element is not `display:none` at measurement time.
9. Check whether a class is being added twice or an animation is being cancelled by another event.
10. Enable reduced motion and confirm the static final state remains visible.
11. Test resize, route changes, component remount, and repeated activation.
12. Use DevTools Performance recording to distinguish JavaScript cost from SVG paint cost.

Diagnostic helper:

```js
function diagnoseSvg(root = document) {
  const rows = [...root.querySelectorAll('svg path')].map((path, index) => {
    const style = getComputedStyle(path);
    let length = 0;
    try { length = path.getTotalLength(); } catch (error) { /* non-path or detached path */ }
    return {
      index,
      id: path.id || '',
      className: path.getAttribute('class') || '',
      length: Math.round(length * 100) / 100,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
      dasharray: style.strokeDasharray,
      dashoffset: style.strokeDashoffset,
      opacity: style.opacity,
      display: style.display
    };
  });
  console.table(rows);
  return rows;
}
```

## Common Mistakes and Specific Fixes

| Mistake | Why it fails | Specific fix |
|---|---|---|
| A. Hard-coded dash length | A revised path may be longer than the assumed number. | Measure each path with `getTotalLength()` and derive the dash values from the result. |
| B. Measuring while hidden | A non-rendered SVG can yield unusable geometry measurements. | Defer measurement until visible or measure in a controlled, renderable state. |
| C. Path appears instantly | The initial hidden state was applied after the animation started. | Set dash array and offset synchronously before calling `animate()`. |
| D. Path never appears | The stroke is missing, transparent, clipped, or offset remains too large. | Temporarily set offset to zero and inspect computed stroke and clipping. |
| E. CSS and JS both animate the same property | Competing effects produce confusing final values. | Assign one animation owner per property and remove the duplicate rule. |
| F. Logo order feels random | DOM order is being mistaken for visual reading order. | Add explicit `data-order` metadata and sort by intended sequence. |
| G. Animation restarts on every scroll | The observer remains active or re-entry is not guarded. | Unobserve or disconnect after the first successful trigger. |
| H. Multiple component instances animate together | A global selector selects every matching path. | Scope queries to the component root or use unique component refs. |
| I. Reduced-motion users see an empty icon | The fallback preserves the hidden initial state. | Render the completed stroke when reduced motion is requested. |
| J. A button works only with a mouse | A non-semantic SVG was used as the control. | Wrap the icon in a native button and support keyboard activation. |
| K. Animation leaks after unmount | A running animation or observer retains the element. | Cancel the animation and disconnect the observer during cleanup. |
| L. SVG looks stretched | The viewBox and rendered aspect ratio conflict. | Use a deliberate `preserveAspectRatio` value and responsive CSS sizing. |
| M. Transform rotates around a strange point | SVG transform origin is implicit or inconsistent. | Set `transform-box` and `transform-origin` explicitly and test target browsers. |
| N. Mobile scroll feels slow | Too many paths animate and repaint at once. | Reduce concurrent paths, shorten the sequence, and profile on a real mobile device. |
| O. External SVG cannot be styled | `<img>` isolates the asset's internal DOM. | Inline the SVG or render it through a component when internal control is required. |
| P. Animation loses state after rerender | The code assumes a previous animation object still exists. | Store the active animation in the component lifecycle and reinitialize on a new node. |

## Mental Models

1. **A path reveal is geometry plus timing.** The path length defines the geometry; dash offset defines how much of the stroke is hidden; the animation defines how that value changes over time.
2. **SVG coordinates are not screen pixels.** Think in viewBox units first, then understand how the viewport maps them to rendered dimensions.
3. **The static state is the product; motion is an enhancement.** The graphic must remain understandable if animation is disabled, delayed, or unsupported.
4. **Every animated property needs one owner.** Choose CSS, SMIL, Web Animations, or a timeline library for a particular property instead of layering multiple competing systems.
5. **A trigger implies a lifecycle.** If an observer or event starts motion, decide how it stops, whether it can replay, and how it is cleaned up.
6. **A11y is behavior, not decoration.** Naming, keyboard access, reduced motion, and equivalent status text are part of the interaction contract.
7. **Vector does not mean free.** Many paths, filters, and changing stroke properties can cost paint time even when the artwork is resolution-independent.
8. **Measure once, update intentionally.** Cache path length while geometry is stable; remeasure only when the actual path geometry changes.
9. **Animation should explain hierarchy.** Stagger and direction should guide attention, not merely add activity.
10. **Fallbacks should preserve meaning.** The fallback is not an apology; it is the stable representation of the same information.

## Quick Reference

| Situation | Recommended approach | Key check |
|---|---|---|
| Draw a signature | `getTotalLength()` + dash offset | Is path direction correct? |
| Reveal a small icon | CSS class and keyframes | Is the final state visible without motion? |
| Animate a self-contained SVG file | SMIL, if supported by target context | Does the asset render correctly in all required browsers? |
| Coordinate several paths | Explicit sequence metadata or timeline | Is the reading order intentional? |
| Animate on scroll | IntersectionObserver for one-shot triggers | Does the observer disconnect? |
| Follow a route | `getPointAtLength()` or motion-path tooling | Are coordinates in the same SVG user space? |
| Show progress | Dash circumference and offset | Is there a textual value too? |
| Change menu icon state | Native button plus CSS classes | Are `aria-expanded` and label synchronized? |
| Reduce motion | Media query and JS preference check | Is the completed state still shown? |
| Debug invisible stroke | DevTools computed styles and offset zero test | Is the stroke visible without animation? |
| Fix duplicate animation | Single property owner | Are CSS and JS fighting each other? |
| Support external SVG | Inline or component-rendered SVG | Does the page need internal path access? |
| Improve mobile performance | Reduce concurrent animated paths | Has it been profiled on a real device? |
| Prevent lifecycle leaks | Cancel animation and disconnect observer | Does cleanup run on unmount? |

## Build Challenge: Animated Brand Mark with Failure Handling

Build a small animated brand mark for a creative portfolio. It must draw itself on first entry into the viewport, provide a meaningful static state, and behave correctly when animation is unavailable or unwanted. The challenge is not complete if the happy path works but the mark breaks under remounts, reduced motion, or multiple instances.

### Requirements

1. Create an inline SVG with a deliberate `viewBox`, at least three named paths, and responsive sizing.
2. Give meaningful artwork an accessible title through `<title>` and `aria-labelledby`; mark purely decorative duplicates as `aria-hidden="true"`.
3. Use `getTotalLength()` for every path that uses a dash reveal; do not hard-code path lengths.
4. Define the visual sequence with explicit metadata rather than relying on incidental DOM order.
5. Trigger the reveal with IntersectionObserver and use a static fallback when the API is unavailable.
6. Ensure the completed SVG is visible when `prefers-reduced-motion: reduce` is active.
7. Add a replay button using native button semantics, a visible `:focus-visible` outline, and a minimum practical touch target.
8. Prevent two animations from controlling the same path property at once.
9. Cancel running animations and disconnect observers during teardown or component unmount.
10. Test two instances on the same page and prove that activating one does not animate the other.
11. Introduce a failure scenario where one expected path is missing; the controller must fail gracefully without breaking the page.
12. Introduce a failure scenario where the SVG begins hidden; measurement must occur only when geometry can be measured reliably.
13. Inspect computed styles in DevTools and record path length, dash array, dash offset, and visibility for each path.
14. Test at narrow and wide viewport sizes, keyboard-only navigation, reduced motion, and at least Chromium, Firefox, and Safari when available.
15. Record performance observations and remove unnecessary filters, repeated geometry reads, and abandoned listeners.

### Definition of Done

- [ ] The mark has a correct static appearance before any animation starts.
- [ ] Every animated path is measured dynamically and reaches a visible final state.
- [ ] Sequence order is deliberate and repeatable.
- [ ] Reduced-motion mode skips movement but preserves the completed graphic.
- [ ] Keyboard users can operate replay and can see focus clearly.
- [ ] Missing-path and hidden-element cases do not throw uncaught errors.
- [ ] Multiple instances operate independently.
- [ ] Cleanup cancels active animations and disconnects observers.
- [ ] No competing CSS and JavaScript animation writes the same property.
- [ ] Browser and responsive checks are documented.
- [ ] DevTools diagnostics show expected path geometry and computed styles.
- [ ] The visual result adds clarity without delaying meaningful content or causing visible jank.

## Further Production Notes

### Naming and component boundaries

Use class names that describe the role of the geometry: `.brand-mark__outline`, `.brand-mark__accent`, or `.progress-ring__track`. Avoid naming paths after their visual order alone if that order may change during a design revision. When using a component framework, make each SVG instance self-contained and pass state through props or a controller. A reusable icon should not query the whole document for `.draw-path`; it should operate on the root node passed to it. If the same SVG is rendered multiple times, ensure IDs used by `aria-labelledby`, masks, gradients, and clip paths remain unique.

### Fill, stroke, and path direction

Line drawing is best suited to open strokes. Closed shapes can be animated too, but a long perimeter may reveal in a direction that does not match how the viewer expects the object to form. Some paths have multiple subpaths within a single `d` attribute; their dash behavior may create jumps between subpaths. If the desired effect is to reveal separate pieces independently, split them into separate path elements when practical. Keep `stroke-linecap: round` and `stroke-linejoin: round` as deliberate visual choices, not universal defaults. They can soften a technical diagram or distort a sharp logo if used without design review.

### CSS cascade and presentation attributes

SVG presentation attributes such as `stroke`, `fill`, and `stroke-width` are convenient defaults. CSS declarations can override them, and animation effects add another layer of precedence. When a property refuses to animate, inspect the computed value and identify the winning declaration. Avoid `!important` as a quick fix because it can mask the underlying cascade conflict. Use a component-specific class and a clear state class instead. If a custom property supplies a path length, make sure its fallback is safe and understand that CSS cannot call `getTotalLength()` itself; JavaScript must set measured values when geometry is dynamic.

### Motion design choices

Choose duration in relation to path complexity and the role of the graphic. A small status icon may need only a few hundred milliseconds; a signature can justify a longer reveal if it does not block the primary headline. Use easing to control perceived acceleration. Linear timing can be appropriate for a continuously rotating indicator, while a reveal that should settle naturally often benefits from an ease-out curve. Stagger is a hierarchy tool: start with the most important stroke, then support it with secondary details. If every path begins and ends at different times without a clear reason, the mark may feel accidental.

### Interaction and interruption

Animations should be interruptible when the interface state changes. If a menu closes while its icon is morphing, a new state should replace the old state rather than queueing stale animations. Cancel the active Web Animation before starting a new one. For CSS, remove or change the state class so the browser can transition from the current value. For GSAP, keep the timeline scoped to the component and kill or revert it during cleanup. Avoid using an animation completion callback as the only source of application truth; the application state should determine whether the menu is open, whether a step is complete, or whether progress has changed.

### Security and content hygiene

Treat third-party SVG files as untrusted content. Do not inject arbitrary SVG strings into the DOM without a suitable sanitization policy. SVG can contain external references and other active features depending on how it is used. If an uploaded SVG is accepted from a user, sanitize it server-side with a maintained SVG-aware sanitizer and restrict unsupported elements and attributes. Keep inline SVG markup under source control for application-owned assets. If a content platform strips `<script>` or SMIL animation elements, use the platform's approved asset workflow rather than trying to bypass its security controls.

### Final review checklist

Before shipping, review the actual implementation rather than only the code sample. Does the mark look correct without motion? Does the animation start at the right time? Can a user understand the page if it never plays? Does reduced motion work on the real target browser? Are selectors scoped? Are observers disconnected? Can the user replay without causing overlapping animations? Is the asset accessible in the surrounding interface? Has the page been profiled on a representative mobile device? Are all IDs unique when multiple components render? Can a teammate change the path data without also rewriting a magic number? If these questions have clear answers, the animation is ready to become part of the production design system.

## Path measurement details

`getTotalLength()` returns a user-agent-computed distance along the path. The value is useful for dash patterns and sampling, but it is not a guarantee that every browser's numerical approximation is bit-for-bit identical. Avoid tests that expect a particular floating-point value for a complex path. Instead, assert that the length is finite and positive, and visually test the reveal. `getPointAtLength()` is useful for moving a marker, but the marker and path must share a coordinate system. If the marker is nested in a differently transformed group, convert coordinates deliberately rather than assuming the values can be copied directly.


## Responsive layout and viewBox

Keep the `viewBox` close to the artwork bounds, including intentional breathing room for strokes. A stroke can extend beyond its path geometry, and clipping may occur when the viewBox is too tight. Use `vector-effect: non-scaling-stroke` only when the design requires a constant stroke thickness across scales; it changes the relationship between geometry and visual weight. For most logos, scaling the stroke with the mark is expected. Verify the small-size version because narrow gaps and delicate strokes may collapse even when the SVG remains mathematically crisp.


## Visibility and first paint

A reveal can flash if the path is initially visible and JavaScript only hides it after the first frame. If the animation is essential to the art direction, define a safe initial class in markup or CSS and then remove it when the controller is ready. But do not hide critical content indefinitely while waiting for JavaScript. Use a progressive enhancement contract: the no-script state is the finished graphic; the enhanced state may begin hidden only when the script successfully initializes. This reduces the chance of an empty logo during hydration or a network failure.


## Component framework integration

In React, Vue, or another framework, create the controller only after the SVG node is mounted. Keep a ref to the root element, not a global selector. Cleanup should cancel animation instances and disconnect observers. If a dependency changes the artwork, remeasure the new paths and cancel the old controller. Avoid mutating framework-managed DOM in ways that conflict with a render update; direct style changes are reasonable for animation internals, but application state should still be represented in the framework's state model. Test strict or development modes that intentionally mount and clean up effects more than once.


## Choosing between Web Animations API and GSAP

The Web Animations API is a good fit for a focused reveal when native browser animation controls are sufficient. It returns an animation object that can be paused, reversed, cancelled, or observed for completion. GSAP is often more convenient for timelines, labels, stagger, ScrollTrigger integration, and coordinated motion across SVG and HTML. The cost is another dependency and a need to manage scope and cleanup. Choose based on the requirements of the feature rather than personal preference. Do not add a timeline library to animate one decorative stroke if CSS can do it reliably.


## Visual QA and design review

Review the animation at the actual rendered sizes and against the actual background colors. A path that looks elegant on a white design canvas may be too thin against a textured dark hero. Check the stroke at 1x and 2x device pixel ratios, and inspect the endpoint where the line cap appears. Ask whether the animation reveals the intended shape or merely makes the visitor wait. If the mark contains a wordmark, ensure the icon and typography finish in a balanced rhythm. Capture a short recording for review if timing feedback is hard to describe in a static screenshot.


## Testing strategy

Separate logic tests from visual tests. Unit tests can verify that missing paths return a safe controller, that lengths are finite, that a replay cancels an existing animation, and that reduced-motion preference bypasses motion. Browser tests should verify the actual SVG appears and reaches its final state. Visual regression tests are useful for catching path changes or accidental clipping, but animation timing can make screenshots flaky. Pause animations or assert the final state before capturing. Include a test where the observer never fires and make sure the static content remains available.


## Operational maintenance

Designers may replace path data after the skill is implemented. Make the controller resilient to new path lengths and avoid magic numbers hidden in CSS. Document which paths are animated and what their order means. If an asset is regenerated, include a short review checklist for ID uniqueness, viewBox, accessible title, path count, and static appearance. Keep the animation implementation small enough that a future maintainer can trace each state. When a browser bug appears, reduce the reproduction to a single inline SVG and one animated property before adding workarounds to the whole component.

## Reference Snippets

### Safe reduced-motion-aware initializer

```js
function initializeDrawReveal(root) {
  const paths = [...(root?.querySelectorAll('[data-draw]') ?? [])];
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = [];
  for (const path of paths) {
    let length;
    try { length = path.getTotalLength(); } catch { continue; }
    if (!Number.isFinite(length) || length <= 0) continue;
    path.style.strokeDasharray = `${length} ${length}`;
    if (media.matches) {
      path.style.strokeDashoffset = '0';
      continue;
    }
    path.style.strokeDashoffset = `${length}`;
    animations.push(path.animate(
      [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
      { duration: 750, easing: 'ease-out', fill: 'forwards' }
    ));
  }
  return {
    replay() {
      if (media.matches) return;
      for (const animation of animations) animation.cancel();
      animations.length = 0;
      for (const path of paths) {
        const length = path.getTotalLength();
        path.style.strokeDashoffset = `${length}`;
        animations.push(path.animate(
          [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
          { duration: 750, easing: 'ease-out', fill: 'forwards' }
        ));
      }
    },
    destroy() { for (const animation of animations) animation.cancel(); }
  };
}
```

### CSS-only decorative reveal with a static default

```html
<svg class="route-art" viewBox="0 0 300 100" aria-hidden="true" focusable="false">
  <path class="route-art__line" d="M8 80 C65 10 120 100 170 40 S250 10 292 20" />
</svg>
```

```css
.route-art__line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
}
.route-art.is-animated .route-art__line {
  stroke-dasharray: 500;
  stroke-dashoffset: 500;
  animation: route-line-in 1.2s ease-out forwards;
}
@keyframes route-line-in { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .route-art.is-animated .route-art__line {
    animation: none;
    stroke-dashoffset: 0;
  }
}
```

The CSS-only sample uses a rough dash value because it is illustrative; for a production asset whose path may change, set the measured length through JavaScript. If the asset should be visible without JavaScript, keep the static default visible and only apply the hidden starting state when the animation is initialized successfully.

### Feature detection for a viewport trigger

```js
function observeOnce(element, onVisible) {
  if (!element) return () => {};
  if (!('IntersectionObserver' in window)) {
    onVisible();
    return () => {};
  }
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      observer.disconnect();
      onVisible();
    }
  }, { threshold: 0.15 });
  observer.observe(element);
  return () => observer.disconnect();
}
```

### Keyboard-visible controls

```css
button.svg-replay {
  min-inline-size: 44px;
  min-block-size: 44px;
  display: inline-grid;
  place-items: center;
}
button.svg-replay:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  button.svg-replay { transition: none; }
}
```

## Final Principles

Treat every SVG animation as a component with geometry, state, timing, accessibility, and lifecycle. Start from an SVG that is correct while static. Measure real paths instead of guessing. Choose one animation owner per property. Make sequencing intentional and scope every selector. Keep the final state visible when motion is reduced or unavailable. Test real browser behavior, especially transforms and embedding context. Profile complex artwork and remove work that does not improve comprehension. Include a failure case in the build challenge and prove the component recovers gracefully. That is the difference between a visual demo and a reliable production pattern.

## Topic-Specific Gotchas

**Gotcha:** `getTotalLength()` measures the SVG path in its own user coordinate system. Do not multiply it by the rendered CSS width unless you are explicitly converting between coordinate systems; doing so can make the dash much too long.

**Gotcha:** An SVG referenced by `<img>` does not expose its internal path elements to the parent document's `querySelector()`. If the paths must be animated from the page, render inline SVG or use a component that owns the SVG markup.

**Gotcha:** `stroke-dashoffset: 0` does not guarantee a visible path. The path can still have `stroke: none`, zero opacity, a zero-width stroke, or be clipped outside the viewBox. Inspect all of those before changing duration or easing.

**Gotcha:** A reduced-motion media query that disables the animation but leaves the starting dash offset intact creates an invisible graphic. Always define the reduced-motion end state explicitly.

**Gotcha:** A path can be measured correctly and still reveal in an unexpected direction. `getTotalLength()` reports length, not the semantic direction in which a designer intended the stroke to be drawn. Inspect path data or reverse/re-author the path when direction matters.

## Semantic Page Integration Example

The animated SVG usually lives inside a larger semantic page. Keep the surrounding structure meaningful and let the graphic enhance the content rather than replace it.

```html
<main>
  <section aria-labelledby="process-heading">
    <h2 id="process-heading">How the process works</h2>
    <figure>
      <svg viewBox="0 0 300 80" role="img" aria-labelledby="process-art-title">
        <title id="process-art-title">Three stages connected by a line</title>
        <path data-draw d="M20 40 H280" fill="none" stroke="currentColor" stroke-width="3" />
        <circle cx="20" cy="40" r="7" fill="currentColor" />
        <circle cx="150" cy="40" r="7" fill="currentColor" />
        <circle cx="280" cy="40" r="7" fill="currentColor" />
      </svg>
      <figcaption>Plan, build, and review in three clear stages.</figcaption>
    </figure>
    <button class="svg-replay" type="button">Replay illustration</button>
  </section>
</main>
```

The heading provides a navigable section name, the SVG title names the visual, the caption gives context, and the button offers a real interaction. For a purely decorative line that repeats information already stated in the text, set `aria-hidden="true"` instead of adding a redundant accessible name. The exact semantic choice depends on whether the artwork contributes information that is not otherwise available.
