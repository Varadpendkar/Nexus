# SKILL: hardware-css

## Layer
01 — CSS Foundation

## Goal
Understand how CSS properties affect browser rendering and compositing, then choose techniques that produce smooth, predictable interfaces without cargo-culting `transform: translateZ(0)`, `will-change`, or GPU-related hacks. Learn to reason about layout, paint, compositing, frame budgets, and the real costs of visual effects.

## Why This Matters (Senior Perspective)
“Hardware-accelerated CSS” is often described as if a particular property automatically sends work to the GPU and makes the page fast. That is an oversimplification. Browser engines decide how to process style, layout, paint, rasterization, and compositing based on the element, effect, browser, device, and current conditions. A transform may be composited efficiently in one situation, while a large blur, excessive layers, or frequent layout changes can still be expensive.

Senior-level performance work begins with measurement and a rendering model, not with a list of magic properties. The goal is to minimize unnecessary work, preserve visual quality, respect accessibility settings, and verify improvements on representative devices. A fast animation is one that meets the frame budget consistently, not one that merely contains a GPU-related CSS declaration.

---

## Core Concepts

### 1. The browser rendering pipeline

A simplified rendering pipeline includes style calculation, layout, paint, rasterization, and compositing. These phases are related but are not a single mandatory sequence for every change.

- **Style:** determine which CSS rules apply and compute styles.
- **Layout:** determine element geometry and relationships.
- **Paint:** record drawing operations for text, borders, backgrounds, shadows, and other visual content.
- **Rasterization:** turn drawing operations into pixels, often in tiles.
- **Compositing:** combine rendered layers into the final image.

A change to `width` can require layout and paint. A background color change often requires paint, though implementation details vary. A transform or opacity animation may be handled at the compositing stage when the browser can promote and composite the affected content efficiently.

**Gotcha:** Do not treat the pipeline as a universal property-to-phase lookup table. Browser engines can optimize, invalidate, or combine work differently. Use DevTools traces to confirm what happens for the actual page.

### 2. Layout-triggering properties

Properties that change geometry often cause layout work. Examples include `width`, `height`, `margin`, `padding`, `top`, `left`, and some font-related changes. The exact consequences depend on layout context and whether the browser can reuse previous calculations.

```css
/* Often requires geometry updates during animation */
.drawer {
  left: 0;
  transition: left 220ms ease;
}
```

A drawer animated through `left` may repeatedly change layout. A transform-based approach often avoids changing the layout position on every animation frame:

```css
.drawer {
  transform: translateX(-100%);
  transition: transform 220ms ease;
}

.drawer[data-open="true"] {
  transform: translateX(0);
}
```

This is not a rule that transforms are always faster. The drawer still has to be painted, rasterized, and composited, and a very large or complex drawer can remain expensive.

### 3. Paint-heavy properties

Large shadows, filters, gradients, border radii on complex surfaces, masks, and large translucent regions can increase paint or rasterization cost. These properties are not inherently wrong; they need to be sized and used with care.

```css
.panel {
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 0.16);
}
```

A shadow on a small card is usually not a meaningful performance problem. Hundreds of large, blurred, animated cards can be a different story. Evaluate the number of affected pixels, how frequently the effect changes, and how much content must be repainted.

### 4. Compositing is not a free performance upgrade

Compositing allows the browser to combine independently rendered surfaces. Separate layers can make some animations efficient, but they consume memory and management overhead. Promoting every element can increase GPU memory use and create worse performance.

**Gotcha:** “More layers” does not mean “more speed.” Layer promotion is a trade-off, and the browser may decide not to keep an element on its own layer.

### 5. Animate `transform` and `opacity` when appropriate

`transform` and `opacity` are good first candidates for smooth transitions because they can often be animated without repeatedly recalculating layout. They are not the only possible performant properties, and actual performance still depends on the effect and browser.

```css
.toast {
  opacity: 0;
  transform: translateY(0.75rem);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.toast[data-visible="true"] {
  opacity: 1;
  transform: translateY(0);
}
```

This pattern animates the visual entrance while leaving document flow unchanged. Ensure that hidden content is also handled correctly for focus and accessibility; opacity alone does not remove an element from keyboard navigation or the accessibility tree.

### 6. Understand transform side effects

A non-`none` transform can create a stacking context and a containing block for positioned descendants. That means changing a layout animation from `left` to `transform` may affect descendant positioning and stacking behavior.

```css
.modal-shell {
  transform: translateY(0);
}
```

Even an identity-looking transform can have effects beyond moving pixels. Do not add transforms to arbitrary wrappers without checking fixed-position descendants, stacking, and containing-block behavior.

**Gotcha:** A descendant with `position: fixed` can be positioned relative to a transformed ancestor instead of the viewport. If a fixed tooltip or dialog behaves strangely after adding a transform, inspect its containing block.

### 7. `will-change` is a hint, not a command

`will-change` tells the browser that a property is likely to change, giving it a chance to prepare. It does not guarantee a separate GPU layer or a faster result.

```css
.card {
  will-change: transform;
}
```

Leaving `will-change` on many elements indefinitely can consume resources and make rendering worse. Prefer applying it shortly before a known interaction and removing it when the work is complete, when practical.

```css
.card.is-animating {
  will-change: transform;
}
```

**Gotcha:** Do not add `will-change` to every clickable element preemptively. Measure first, and use it only when a demonstrated issue benefits from the hint.

### 8. The `translateZ(0)` myth

A common legacy trick is:

```css
.element {
  transform: translateZ(0);
}
```

This has sometimes been used to encourage compositing, but it is not a universal optimization and can create stacking contexts, containing blocks, and extra layer memory costs. Modern browsers already make promotion decisions based on their own heuristics.

Use a transform because it expresses the intended visual motion, not as an unexplained incantation. Remove old promotion hacks during performance audits and compare traces before and after.

### 9. Frame budgets and refresh rates

A frame budget is the time available to produce a frame before the next display refresh. At 60 Hz, a refresh interval is about 16.67 ms; at 120 Hz, it is about 8.33 ms. The browser must fit main-thread work, raster work, and other scheduling costs into the practical budget.

A page that looks smooth on a 60 Hz desktop may stutter on a high-refresh display or slower mobile device. Also, a 16.67 ms interval is not a promise that the application can spend all of it doing JavaScript; the browser and operating system need time too.

### 10. Main-thread work versus compositor work

JavaScript that runs for too long can block input handling and rendering. Even a composited animation can feel unresponsive if the main thread is busy with long tasks, style recalculation, or expensive application logic.

Use browser performance tools to distinguish:
- Long JavaScript tasks.
- Repeated style recalculation.
- Layout work.
- Paint and raster activity.
- Dropped or delayed frames.
- Expensive event handlers or observers.

**Gotcha:** A compositor-friendly CSS animation does not make the rest of the application non-blocking. Profile main-thread work and animation smoothness as separate, related questions.

### 11. Large blur filters

Blur filters can be expensive because they may require sampling and processing many pixels, often across an area larger than the element's visible box. The cost grows with the affected surface, blur radius, animation frequency, and number of overlapping effects.

```css
.glass-panel {
  backdrop-filter: blur(16px);
}
```

A small static blur may be acceptable. A full-screen animated blur over a moving background can be much more expensive, especially on lower-powered devices. Use the smallest effect that achieves the design, reduce the affected area, and test on target devices.

### 12. `backdrop-filter` and translucent surfaces

`backdrop-filter` processes content behind an element, so its cost depends on both the filtered region and the background content that must be considered. It can also complicate stacking and visual debugging.

```css
.navbar {
  background: rgb(20 20 28 / 0.72);
  backdrop-filter: blur(12px);
}
```

Provide a usable fallback if the effect is unsupported or too expensive for the product's support matrix:

```css
.navbar {
  background: rgb(20 20 28 / 0.94);
}

@supports (backdrop-filter: blur(1px)) {
  .navbar {
    background: rgb(20 20 28 / 0.72);
    backdrop-filter: blur(12px);
  }
}
```

**Gotcha:** A visually transparent element may still require expensive backdrop processing. Transparency is not equivalent to low rendering cost.

### 13. Large shadows and glow effects

A large blur radius can expand the painted area beyond the element's box. Multiple shadows and glow layers can amplify rasterization work.

```css
.hero-card {
  box-shadow:
    0 1rem 2rem rgb(0 0 0 / 0.14),
    0 0 4rem rgb(99 102 241 / 0.12);
}
```

Prefer a restrained shadow system with a few levels. Avoid animating the blur radius or spread of a huge shadow every frame unless the effect has been measured and is important enough to justify the cost.

### 14. Filters versus pre-rendered assets

A CSS filter can be convenient for small visual adjustments, such as grayscale or brightness. But applying complex filters to large image regions can be expensive. If an effect is static and complex, a pre-rendered asset may be more efficient, though it increases asset-management cost and can reduce flexibility.

```css
.avatar--muted {
  filter: grayscale(1);
}
```

Choose based on dynamic behavior, image sizes, caching, visual quality, and maintainability—not on a blanket claim that CSS or images are always faster.

### 15. `contain` and layout isolation

The `contain` property can tell the browser that an element's layout, paint, or size effects are constrained in specific ways. This can reduce the scope of some calculations, but containment changes layout behavior and can affect clipping, sizing, and containing blocks.

```css
.widget {
  contain: layout paint;
}
```

Use containment when the component's behavior fits the containment contract. Do not add `contain: strict` as a generic performance switch; strict containment includes size containment and can cause content sizing problems if dimensions are not deliberately defined.

**Gotcha:** `contain: paint` can clip descendants that visually extend outside the element. Check popovers, focus rings, shadows, and menus before applying paint containment.

### 16. `content-visibility` for large off-screen regions

`content-visibility: auto` can let the browser skip rendering work for content it determines is not currently needed for display. It is useful for long pages with many independent sections.

```css
.article-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 32rem;
}
```

`contain-intrinsic-size` provides a placeholder size so skipped content does not collapse the page's scroll geometry unexpectedly. The chosen size should approximate real content and be tested with varying section lengths.

**Gotcha:** `content-visibility` can affect when descendants are rendered and how measurements behave. Do not rely on an off-screen section's exact layout measurements before it has been rendered.

### 17. Avoid forced synchronous layout

Reading geometry after changing styles can force the browser to flush pending layout work. Repeating write-read-write-read sequences inside a loop can cause layout thrashing.

```js
// Avoid alternating writes and geometry reads in a loop.
items.forEach((item) => {
  item.style.width = "200px";
  console.log(item.offsetWidth);
});
```

Batch writes, then read measurements when needed. If the goal is animation, prefer CSS transitions or the Web Animations API for appropriate cases, and use `requestAnimationFrame` carefully when coordinating reads and writes.

### 18. Batch DOM reads and writes

A simple discipline is to collect measurements first and then apply changes, rather than alternating between them for each item.

```js
const widths = items.map((item) => item.getBoundingClientRect().width);

items.forEach((item, index) => {
  item.style.setProperty("--measured-width", `${widths[index]}px`);
});
```

This is a conceptual example; actual code should ensure no style writes occur before the measurements in the same batch. Use a scheduler or `requestAnimationFrame` for coordinated visual updates when appropriate, and profile before building elaborate abstractions.

### 19. Avoid animating layout properties by default

Animating `height`, `width`, `top`, or `left` may require repeated layout. Sometimes it is the right choice—such as a carefully implemented disclosure whose content must push surrounding content—but a transform-based visual motion may be cheaper if the layout semantics permit it.

```css
.drawer {
  transition: transform 220ms ease;
}
```

For an accordion, do not blindly replace height animation with `scaleY()` if that squashes text or leaves the surrounding layout unchanged. Choose the approach based on content flow, accessibility, and perceived motion.

### 20. Use `requestAnimationFrame` with a clear purpose

`requestAnimationFrame` schedules work before a future repaint, but it does not automatically make expensive work fast. A heavy callback can still miss frames.

```js
let frameId = 0;

function scheduleVisualUpdate(update) {
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(() => {
    update();
  });
}
```

This pattern can coalesce multiple requests into one scheduled update. It is not a replacement for avoiding unnecessary work or for using CSS animations when they are sufficient.

### 21. Scroll handlers and visual updates

Scroll events can fire frequently. Avoid performing expensive DOM reads, layout writes, or large calculations directly in a handler on every event.

```js
let ticking = false;

window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    ticking = false;
    // Perform a small, measured visual update.
  });
}, { passive: true });
```

Use `IntersectionObserver` for visibility-based work where it fits, and CSS scroll-driven animations only when browser support and behavior meet the product's needs. A passive listener helps with certain scrolling optimizations but does not make its callback cheap.

### 22. Prefer `IntersectionObserver` for visibility triggers

If an effect should begin when a section approaches the viewport, an observer is often preferable to repeatedly calculating every element's position on scroll.

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, { rootMargin: "0px 0px 120px 0px" });

document.querySelectorAll("[data-reveal]").forEach((element) => {
  observer.observe(element);
});
```

For production, disconnect the observer when its owner is destroyed and ensure the content remains available when JavaScript is disabled or the animation is skipped. Avoid making important content permanently invisible if the observer fails.

### 23. Reduced motion is part of performance-quality work

Some users prefer reduced motion. Keep meaningful state changes understandable without motion and disable or shorten nonessential animation.

```css
.animated-card {
  transition: transform 220ms ease, opacity 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .animated-card {
    transition: none;
  }
}
```

Do not use reduced motion as a reason to hide information or remove state feedback. If motion communicates spatial relationships, provide a less animated alternative that preserves context.

### 24. Respect keyboard focus and visual overflow

Performance changes must not clip focus rings, menus, or tooltips. Transforms, containment, overflow, and stacking contexts can all change how descendants are drawn.

```css
.action:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

If a wrapper needs `overflow: hidden` for a visual effect, consider whether interactive descendants should live outside that clipping container or whether the effect can be implemented on a pseudo-element.

**Gotcha:** Removing an outline because it overlaps a shadow fixes the screenshot, not the accessibility problem. Preserve a visible keyboard focus indicator and adjust the component geometry or effect.

### 25. Measure with browser DevTools

Use the Performance panel to record a real interaction, not just inspect CSS in isolation. Look for long tasks, repeated layout, paint activity, raster work, and dropped frames. Use paint flashing or layer inspection features when available in your browser to understand which regions update.

A useful experiment has:
1. A reproducible interaction.
2. A baseline recording.
3. One isolated change.
4. A second recording under similar conditions.
5. Tests on representative device classes.
6. A visual and functional regression check.

Do not infer a performance win solely from fewer CSS declarations or a layer appearing in the compositor view.

### 26. Use real devices and representative content

Device hardware, browser versions, refresh rates, pixel density, and thermal state can change performance. A large effect on a desktop may be fine while it struggles on a low-end phone.

Test with realistic content counts and dimensions. A single card does not reveal the cost of a grid containing 100 cards. A short page does not reveal long-page scrolling behavior.

### 27. Avoid over-promoting layers

Each composited layer can require memory for backing surfaces, tiles, and metadata. Large high-DPI surfaces can consume substantial memory. Excessive layer promotion may increase upload and management costs.

Avoid assigning `will-change` or transforms to every list item without evidence. Start with the smallest change that addresses a measured bottleneck.

### 28. Use `opacity` thoughtfully

Opacity animations can often be composited, but translucent overlapping content may require blending and can interact with filters and backdrop effects. Also, opacity does not change hit testing, focusability, or semantic visibility by itself.

```css
.tooltip {
  opacity: 0;
  pointer-events: none;
}

.tooltip[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}
```

This still does not handle keyboard access or accessibility semantics completely. A production tooltip or popover needs an appropriate interaction model and should not expose invisible focusable descendants.

### 29. Avoid `display: none` as an animation mechanism

`display` does not interpolate as a normal continuous property. For entry and exit effects, manage the visible state and interaction semantics separately from the visual transition.

For dialogs, menus, and popovers, use the platform's semantic behavior when possible and avoid leaving hidden interactive content in the tab order. CSS opacity or transforms alone do not establish correct accessibility behavior.

### 30. A practical performance decision tree

When an animation stutters:

1. Reproduce it and record a baseline.
2. Check for long JavaScript tasks.
3. Check whether layout repeats on each frame.
4. Check paint and raster activity.
5. Reduce the area and complexity of blur, shadow, filter, and transparency effects.
6. Test transform/opacity if they preserve the intended layout behavior.
7. Inspect layer count and memory symptoms before adding promotion hints.
8. Test on the slowest supported device.
9. Check reduced motion and keyboard interaction.
10. Keep the change only if the trace and user experience improve.

**Gotcha:** A micro-optimization can make one trace look better while increasing memory use, changing stacking behavior, or harming a different device. Evaluate the full interaction and its regressions.

---

## Reusable Patterns

### Pattern 1 — Transform-based drawer motion

```css
.drawer {
  transform: translateX(-100%);
  transition: transform 220ms ease;
}

.drawer[data-open="true"] {
  transform: translateX(0);
}

@media (prefers-reduced-motion: reduce) {
  .drawer {
    transition: none;
  }
}
```

Use when the drawer can move visually without needing to change surrounding document flow during each frame. Ensure the closed drawer is also handled correctly for focus and accessibility.

### Pattern 2 — Fade and lift for a toast

```css
.toast {
  opacity: 0;
  transform: translateY(0.75rem);
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast[data-visible="true"] {
  opacity: 1;
  transform: translateY(0);
}
```

Use for small entrance/exit effects. Manage whether the toast is announced, focusable, and interactive independently of opacity.

### Pattern 3 — Temporary `will-change` hint

```css
.card.is-animating {
  will-change: transform;
}
```

Only use after measurement identifies a benefit. Remove the class after the animation lifecycle rather than applying the hint to every card indefinitely.

### Pattern 4 — Backdrop blur with fallback

```css
.glass {
  background: rgb(24 24 32 / 0.94);
}

@supports (backdrop-filter: blur(1px)) {
  .glass {
    background: rgb(24 24 32 / 0.72);
    backdrop-filter: blur(12px);
  }
}
```

Keep the fallback visually usable. Measure the effect over the real background and on the lowest-powered supported devices.

### Pattern 5 — Static visual effects kept restrained

```css
.card {
  box-shadow: 0 0.75rem 1.75rem rgb(0 0 0 / 0.12);
  transition: transform 160ms ease;
}

.card:hover {
  transform: translateY(-2px);
}
```

A restrained static shadow plus a small transform can be more appropriate than animating a large blur radius. Verify the effect does not create unwanted stacking or focus clipping.

### Pattern 6 — Contained widget

```css
.widget {
  contain: layout;
}
```

Use containment only when the widget's layout behavior is sufficiently independent. Test popovers, overflow, intrinsic sizing, and descendants that position themselves relative to ancestors.

### Pattern 7 — Skip rendering for distant article sections

```css
.article-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 30rem;
}
```

Useful for long pages with independent sections. Tune the intrinsic size to reduce scroll jumps and avoid relying on exact measurements before content is rendered.

### Pattern 8 — Batched measurement and update

```js
const sizes = elements.map((element) => {
  return element.getBoundingClientRect();
});

elements.forEach((element, index) => {
  element.style.setProperty("--measured-inline-size", `${sizes[index].width}px`);
});
```

Collect reads before writes to reduce layout thrashing. Ensure other code does not interleave style mutations during the measurement batch.

### Pattern 9 — Coalesce visual updates

```js
let frameId = 0;

function requestUpdate(callback) {
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(callback);
}
```

Useful when multiple events request the same visual update. Keep the callback small and avoid using this wrapper to hide expensive work.

### Pattern 10 — Reveal on intersection

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll("[data-reveal]").forEach((element) => {
  observer.observe(element);
});
```

Use for optional decorative reveals, not to make essential content unavailable until an observer runs. Provide a sensible non-animated default.

### Pattern 11 — Reduced-motion override

```css
.reveal {
  opacity: 0;
  transform: translateY(1rem);
  transition: opacity 200ms ease, transform 200ms ease;
}

.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal.is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

This avoids leaving content hidden when motion is reduced. Keep semantic availability independent from the decorative animation.

### Pattern 12 — Performance measurement note

```text
Interaction:
Baseline device/browser:
Observed dropped frames or long tasks:
Layout activity:
Paint/raster activity:
Layer count or memory concerns:
Single change tested:
Result after change:
Visual/accessibility regressions checked:
Decision:
```

Record evidence rather than claiming that a property is “GPU accelerated” without a trace.

---

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Assuming `transform` always uses the GPU | Browser behavior depends on implementation, element complexity, and context. | Use transforms when they fit the visual behavior, then profile the result. |
| Assuming `opacity` is always free | Blending and overlapping effects can still be costly, and hidden content remains interactive unless managed. | Measure complex transparency and handle semantics separately. |
| Adding `translateZ(0)` everywhere | Can create stacking contexts, containing blocks, and extra memory use. | Remove unexplained promotion hacks and compare performance traces. |
| Applying `will-change` globally | Excessive hints can consume memory and hurt performance. | Apply temporarily to a small set of measured elements. |
| Animating `left` or `top` without checking layout | Repeated geometry updates may cause jank. | Consider transform-based motion when it preserves the intended flow. |
| Replacing every height animation with `scaleY()` | Text can squash and surrounding layout may not move correctly. | Choose based on layout semantics and visual requirements. |
| Using large animated blur filters | Large affected regions require expensive sampling and raster work. | Reduce radius and region or use a simpler visual effect. |
| Applying `backdrop-filter` to huge surfaces | Processing depends on the backdrop region and underlying content. | Constrain the area, provide a fallback, and test on target devices. |
| Animating huge shadow blur radii | Large painted areas can be expensive on each frame. | Keep shadows restrained and animate transform/opacity when appropriate. |
| Promoting every card to its own layer | Increases memory and layer-management overhead. | Promote only when measurements demonstrate a benefit. |
| Treating a compositor animation as a fix for main-thread jank | Long tasks can still delay input and other rendering work. | Profile main-thread activity and animation smoothness separately. |
| Reading geometry after each style write | Forces repeated synchronous layout and can cause layout thrashing. | Batch reads, then writes. |
| Assuming `requestAnimationFrame` makes code fast | A heavy callback still misses frame deadlines. | Keep callbacks small and profile the work they schedule. |
| Doing expensive work directly in scroll handlers | Frequent events can trigger repeated layout or long tasks. | Coalesce updates, use observers when suitable, and minimize callback work. |
| Using `passive: true` as a performance cure-all | It helps with certain event handling paths but does not reduce callback cost. | Keep the handler light and choose the right event strategy. |
| Hiding content until an observer fires | Essential content may remain hidden if JavaScript fails or motion is skipped. | Make content visible by default or provide a robust no-JS state. |
| Applying containment without understanding side effects | Can affect sizing, clipping, containing blocks, and descendant painting. | Use the narrowest containment that matches the component contract. |
| Using `contain: paint` around focusable controls | Focus rings and menus may be clipped. | Move interactive overflow outside the clipped region or change the visual design. |
| Using `content-visibility` without intrinsic sizing | Skipped sections may distort scroll geometry or cause jumps. | Set and test `contain-intrinsic-size` where appropriate. |
| Measuring an off-screen skipped section as if fully rendered | Measurements may not represent the final rendered content. | Wait until rendering is needed or use a robust sizing strategy. |
| Forgetting reduced-motion preferences | Motion may be distracting or uncomfortable for some users. | Provide a `prefers-reduced-motion` strategy that preserves meaning. |
| Removing focus outlines to fix visual overlap | Keyboard users lose a visible focus location. | Preserve `:focus-visible` and fix clipping or spacing. |
| Assuming opacity hides an element from keyboard navigation | Opacity affects visual rendering, not semantic or focus behavior by itself. | Manage focusability, visibility, and accessibility semantics separately. |
| Using `display: none` as a smoothly animatable property | `display` does not behave like a normal continuous property. | Separate interaction state from the properties used for visual transitions. |
| Ignoring stacking-context side effects | Transforms and opacity can change layering relationships. | Inspect stacking contexts and z-index behavior after visual changes. |
| Benchmarking only on a powerful desktop | Lower-powered devices and high-refresh displays may expose missed frames. | Test representative device classes and refresh rates. |
| Judging performance from source code alone | A short CSS rule can still produce expensive raster work. | Use repeatable recordings and compare traces. |
| Making several optimizations at once | You cannot identify which change helped or caused regressions. | Change one variable per experiment. |
| Keeping an optimization that harms memory or accessibility | A local trace improvement can make the full experience worse. | Evaluate frame stability, memory, interaction, and regressions together. |
| Assuming a smaller CSS file means faster rendering | Download size and rendering cost are different concerns. | Measure the actual bottleneck before optimizing. |

---

## Mental Models

1. **CSS performance is measured, not inferred from property names.** A property is a hypothesis about cost, not proof of a speedup.
2. **Layout, paint, rasterization, and compositing are different kinds of work.** Identify which phase is expensive before changing code.
3. **A frame has a deadline.** The practical budget shrinks on high-refresh displays and must be shared with browser and application work.
4. **Compositing trades work for memory.** More independent layers can help animation but increase resource use.
5. **A hint is not a guarantee.** `will-change` and transform hacks do not force a universally optimal pipeline.
6. **Visual state and semantic state are separate.** Opacity and transforms do not automatically change focusability or accessibility.
7. **The affected pixel area matters.** Large filters and translucent backdrops can be expensive even when the CSS is short.
8. **Read/write ordering matters.** Interleaving geometry reads and style writes can force synchronous layout.
9. **Optimization must preserve the layout contract.** A transform is not a good replacement if surrounding content must move naturally.
10. **Test the weakest supported device.** A smooth desktop interaction can still fail in a constrained environment.
11. **Every optimization has a regression surface.** Check stacking, containing blocks, clipping, memory, focus, and reduced motion.
12. **A trace beats a slogan.** Keep a change when reproducible evidence and the user experience improve.

---

## Quick Reference

| Problem | First thing to inspect | Potential direction |
|---|---|---|
| Drawer stutters while moving | Repeated layout in Performance trace | Try transform-based motion if flow semantics allow it. |
| Fade looks smooth but input lags | Long main-thread tasks | Reduce or schedule expensive JavaScript work. |
| Full-screen glass effect is slow | Paint/raster and backdrop region | Reduce area/blur and provide a simpler fallback. |
| Many cards cause memory pressure | Layer count and promoted surfaces | Remove blanket `will-change` and unnecessary transforms. |
| Scroll animation triggers layout | Geometry reads and writes in scroll handler | Coalesce updates or use an observer when suitable. |
| Long page loads/rendering slowly | Repeated off-screen content work | Consider `content-visibility: auto` with intrinsic sizing. |
| Focus ring disappears | Overflow, containment, stacking context | Preserve focus outline and revise clipping boundaries. |
| Animation fails with reduced motion | Motion preference styles | Provide an immediate, understandable state. |
| Transform changes fixed child position | New containing block | Move the fixed child outside the transformed ancestor if needed. |
| A performance “fix” made things worse | Before/after trace and memory | Revert and isolate the change; test one variable at a time. |

### Performance audit checklist

- [ ] Reproduce the interaction consistently.
- [ ] Record a baseline before changing CSS.
- [ ] Identify long tasks, layout, paint, raster, and frame delays.
- [ ] Try one change at a time.
- [ ] Prefer transform/opacity only when they preserve intended behavior.
- [ ] Avoid blanket `will-change` and unexplained `translateZ(0)`.
- [ ] Limit large blur, backdrop, and shadow effects.
- [ ] Inspect layer count and memory overhead.
- [ ] Batch DOM reads and writes.
- [ ] Keep scroll handlers short and deliberate.
- [ ] Test on representative low-powered devices.
- [ ] Verify keyboard focus and overflow after transforms or containment.
- [ ] Test with `prefers-reduced-motion: reduce`.
- [ ] Confirm the result improves the experience, not just one metric.

---

## Build Challenge

### Challenge: Optimize a motion-heavy dashboard without visual or accessibility regressions

Build a dashboard with a collapsible navigation drawer, animated toast, card grid, modal, sticky translucent header, and a long scrollable activity feed. First implement a working baseline, then profile and improve the slowest interactions using evidence.

#### Requirements

1. Implement the drawer with an accessible open/closed state.
2. Animate the drawer without causing unnecessary repeated layout work where possible.
3. Create a toast that uses a restrained entrance and exit effect.
4. Ensure hidden toast content does not remain unexpectedly focusable.
5. Add a card hover interaction without blanket layer promotion.
6. Add a translucent header with a solid fallback for unsupported backdrop filters.
7. Compare a restrained shadow against a large glow and record the cost difference.
8. Include a modal with correct focus handling and a reliable dismissal path.
9. Ensure transforms do not accidentally break fixed-position descendants.
10. Add a long activity feed with enough items to reveal scaling problems.
11. Consider `content-visibility: auto` for independent off-screen sections.
12. Choose and test a suitable `contain-intrinsic-size` placeholder if using content visibility.
13. Include at least one example of `will-change` and document why it is or is not retained.
14. Remove any unexplained `translateZ(0)` hacks.
15. Record a baseline performance trace for a reproducible interaction.
16. Identify whether the bottleneck is JavaScript, layout, paint, rasterization, or compositing.
17. Make one optimization at a time and compare traces.
18. Test the interaction on a representative lower-powered device or constrained profile.
19. Check for forced synchronous layout and batch geometry reads before style writes.
20. Use a small, justified `requestAnimationFrame` or observer pattern if it solves an identified problem.
21. Keep scroll callbacks lightweight.
22. Support `prefers-reduced-motion: reduce`.
23. Preserve visible `:focus-visible` indicators.
24. Verify focus rings, menus, and tooltips are not clipped by overflow or paint containment.
25. Test keyboard navigation and hidden-state behavior, not only pointer interaction.
26. Check for unexpected stacking-context or containing-block changes.
27. Record the trade-off between layer count, memory, and smoothness.
28. Include a before/after table with device, interaction, observed issue, change, and result.
29. Explain at least two tempting optimizations you rejected and why.
30. Include a short performance note stating what the evidence supports and what remains uncertain.

#### Deliverables

- A working dashboard with the stated interactions.
- A baseline and post-optimization performance record.
- A concise CSS and JavaScript explanation for each retained optimization.
- An accessibility regression checklist.
- A short summary of remaining bottlenecks and future investigation.

#### Evaluation rubric

- **Measurement quality (25%)** — baseline and follow-up tests are repeatable and focused.
- **Rendering diagnosis (20%)** — the identified bottleneck matches the evidence.
- **Optimization quality (20%)** — changes reduce unnecessary work without adding unjustified complexity.
- **Accessibility and behavior (20%)** — focus, reduced motion, semantic states, and clipping remain correct.
- **Maintainability (15%)** — code explains its intent and avoids unexplained performance folklore.

A successful solution does not maximize the number of transforms or compositor layers. It identifies the actual bottleneck, improves the measured interaction, and preserves the behavior users rely on.
