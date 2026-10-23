---
name: scroll-driven-css
layer: 03-animation-motion
description: Native CSS scroll-driven animations using scroll and view timelines, with progressive enhancement and accessible fallbacks.
---

# Scroll-Driven CSS

## Why This Matters

Scroll-driven animation ties visual progress to a scroll position instead of to elapsed time. That makes it useful for a reading-progress indicator, a section reveal, a small image parallax effect, or an element whose visual state should correspond to how far it has moved through a scroll container. Unlike a normal time-based animation, the motion does not need to finish after a fixed number of milliseconds: it advances as the user scrolls.

Production failures tend to happen when scroll animation is treated as a guaranteed browser feature or as a substitute for content structure. A progress bar may remain at zero in a browser that does not support scroll timelines. A section may be invisible because its initial opacity depends on an unsupported animation. A nested scroll container may control the timeline when the author expected the page scroll. A reveal can behave differently when content is taller than the viewport, when a user zooms text, or when the browser restores a scroll position. A parallax effect can cause discomfort if it ignores reduced-motion preferences. A fallback can also accidentally animate layout properties and create jank.

This skill focuses on native CSS scroll-driven animation through `animation-timeline: scroll()` and `animation-timeline: view()`, along with named timelines, timeline ranges, feature detection, accessibility, and performance. The feature is an enhancement: the content and essential state must remain usable when the browser does not support the relevant syntax. Scroll-driven CSS is best for simple relationships between scroll progress and a visual property. Use JavaScript, an observer, or a dedicated animation library when the behavior needs complex orchestration, dynamic measurements, pinning, snapping, or precise cross-browser control.

## Learning Outcomes

After completing this skill, you should be able to:

- Explain the difference between a scroll progress timeline and a view progress timeline.
- Create a page reading-progress indicator that degrades gracefully.
- Animate a visible element across a named range of its passage through the viewport.
- Use named timelines and timeline ranges without confusing which scroller owns the timeline.
- Apply `@supports` as progressive enhancement and preserve readable content by default.
- Respect `prefers-reduced-motion`, keyboard focus, and semantic content order.
- Diagnose timeline attachment, range, overflow, and support problems in DevTools.
- Reduce layout and paint cost by preferring transform and opacity for visual movement.
- Test in current Chromium, Firefox, and Safari and record version-specific differences.

## Core Concepts

### 1. Scroll timelines versus view timelines

A scroll progress timeline represents progress through a scroll container’s scrollable range. A view progress timeline represents an element’s progress through a scrollport as it enters and leaves view. These concepts are related but answer different questions.

Use a scroll timeline for a page-level progress bar or a visual effect that should track the overall scroll position. Use a view timeline when the animation belongs to an element’s own passage through the viewport, such as a card revealing as it enters the reading area.

```css
/* Progress through the document's scroll range. */
.reading-progress {
  transform-origin: left center;
  animation: progress-fill auto linear both;
  animation-timeline: scroll(root block);
}

@keyframes progress-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* Progress through an element's passage through the scrollport. */
.article-section {
  animation: section-reveal auto linear both;
  animation-timeline: view(block);
}

@keyframes section-reveal {
  from { opacity: 0.25; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

A scroll timeline is not a timer. Its progress follows scroll position, so the animation can move forward or backward as the user scrolls. A view timeline is associated with an element and a scroll container. The visible portion and the selected range affect when its progress begins and ends.

**Gotcha:** `animation-timeline` does not replace a duration in every context by magic. Scroll-driven animations commonly use an `auto` duration because the timeline defines progress, but verify the exact syntax and support in the browser versions you target.

### 2. Scroll containers and timeline ownership

The root document is a common scroll source, but any element with its own scrollable overflow can establish a scroll container. A timeline attached to the wrong scroller can appear frozen or advance at unexpected times. When working with nested panes, decide explicitly which scrollport should control the animation.

```css
.reader {
  height: 70vh;
  overflow-y: auto;
  scroll-timeline-name: --reader-scroll;
  scroll-timeline-axis: block;
}

.reader-progress {
  animation: progress-fill auto linear both;
  animation-timeline: --reader-scroll;
}
```

This named timeline follows `.reader` rather than the document. The reader needs actual overflow content for the scroll progress to change. If its content fits entirely, there may be no scroll range and the animation may not visibly advance.

Use `scroll(root block)` for the root scroller when that is the intended source. Use a named timeline when the scroller is a specific component or nested panel. Check `overflow`, height constraints, and the actual scroll position in DevTools before changing easing or keyframes.

### 3. Axis selection and writing modes

Scroll timelines can follow an axis. `block` and `inline` refer to the logical writing-mode axes; `y` and `x` refer to physical axes. Logical axes are often more robust for international layouts because the block direction can change with writing mode.

```css
.reader {
  scroll-timeline-name: --reader-block;
  scroll-timeline-axis: block;
}

.reader-progress {
  animation: progress-fill auto linear both;
  animation-timeline: --reader-block;
}
```

Choose the axis based on the interaction. A vertical reading progress indicator generally follows the block axis. A horizontally scrolling product rail may follow the inline axis. Do not assume that `x` and `inline` are equivalent in every writing mode.

**Gotcha:** A horizontal scroll animation may not work if the intended container does not actually overflow horizontally. Verify `scrollWidth > clientWidth` or inspect the scroll container visually before debugging the timeline itself.

### 4. Animation duration, fill mode, and scroll progress

For time-based CSS animations, duration maps time to progress. For scroll-driven animations, the timeline maps scroll position to progress. The animation may use `animation-duration: auto`, and the scroll timeline determines how the active interval maps onto the available scroll range. Fill behavior still matters because the animation may be outside its active range at the top or bottom of the timeline.

```css
.reading-progress {
  transform: scaleX(0);
  transform-origin: left center;
  animation-name: progress-fill;
  animation-duration: auto;
  animation-timing-function: linear;
  animation-fill-mode: both;
  animation-timeline: scroll(root block);
}

@keyframes progress-fill {
  to { transform: scaleX(1); }
}
```

A progress indicator should have a stable base style. If scroll timeline support is missing, a `scaleX(0)` base value would leave it empty forever. Keep the fallback meaningful, or use `@supports` to apply the initial and animated states only when the feature is supported.

```css
.reading-progress {
  transform: scaleX(1);
}

@supports (animation-timeline: scroll()) {
  .reading-progress {
    transform: scaleX(0);
    animation: progress-fill auto linear both;
    animation-timeline: scroll(root block);
  }
}
```

The fallback here deliberately shows a filled bar if the feature is unsupported; a product could instead omit the progress bar entirely or use JavaScript to calculate progress. Choose a fallback that does not misrepresent state. A bar that always appears complete may be worse than no bar, so in a real product it is often better to hide the decorative progress indicator in unsupported browsers.

### 5. Timeline ranges for view animations

A view timeline can expose named ranges that describe parts of an element’s journey through the scrollport. Timeline range controls let you choose when the animation starts and ends instead of using the entire passage through view. This is useful for a short entrance that should complete while the element is readable.

```css
.article-card {
  animation: card-enter auto linear both;
  animation-timeline: view(block);
  animation-range: entry 0% entry 100%;
}

@keyframes card-enter {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

The exact range should be chosen for the element size and the viewport. A tall section can spend a long time crossing the viewport, so animating across the entire view range may make the effect feel slow. A small card may cross quickly and need a narrower range. Test with long and short content rather than using the same range for every component.

**Gotcha:** An element that is taller than the scrollport can behave differently from a short card because the entry and exit geometry differs. Check timeline range behavior with large text, zoom, and responsive layouts.

### 6. Named view timelines

Named timelines help a descendant animate according to an ancestor’s view progress. This can be useful when the animated visual is nested inside a semantic section and you want the section’s visibility to control the child.

```css
.feature-section {
  view-timeline-name: --feature-view;
  view-timeline-axis: block;
}

.feature-section__artwork {
  animation: artwork-enter auto linear both;
  animation-timeline: --feature-view;
  animation-range: entry 10% cover 35%;
}

@keyframes artwork-enter {
  from { opacity: 0; transform: translateY(1.25rem) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
```

The named timeline is declared on the element whose view progress matters. The descendant uses that name to bind its animation. Timeline names must be unique enough within the relevant scope to avoid accidental coupling, and the declaration must be reachable according to the timeline lookup rules.

Keep the semantic content available even if the animation does not run. If the animated child contains meaningful text, do not rely on its entry animation to make it readable.

### 7. Timeline scoping and nested components

In a component-based application, a nested element can accidentally resolve a different timeline than the author expects, particularly when several scroll containers and named timelines are present. Scope timelines deliberately and keep the relationship between scroller, subject, and animated descendant easy to understand.

```css
.story-scroller {
  overflow-y: auto;
  scroll-timeline-name: --story-scroll;
  scroll-timeline-axis: block;
}

.story-progress {
  animation: progress-fill auto linear both;
  animation-timeline: --story-scroll;
}

.story-card {
  view-timeline-name: --story-card-view;
  view-timeline-axis: block;
}

.story-card__media {
  animation: media-enter auto linear both;
  animation-timeline: --story-card-view;
  animation-range: entry 0% cover 30%;
}

@keyframes media-enter {
  from { opacity: 0.5; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
```

Use component naming that communicates the source and consumer. Document which element owns each timeline. Avoid reusing a generic name such as `--scroll` across several unrelated nested scrollers if it makes debugging ambiguous.

### 8. Scroll progress indicator

A reading progress bar is a classic scroll-driven CSS use case. It should be decorative, unobtrusive, and independent of the document’s layout. A fixed bar with a transform origin can scale along the inline axis as the root scroll progresses.

```html
<div class="reading-progress" aria-hidden="true"></div>
<main>
  <article>
    <h1>How the system works</h1>
    <p>Article content begins here…</p>
  </article>
</main>
```

```css
.reading-progress {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: 100;
  width: 100%;
  height: 3px;
  background: #2563eb;
  transform: scaleX(1);
  transform-origin: left center;
}

@supports (animation-timeline: scroll()) {
  .reading-progress {
    transform: scaleX(0);
    animation: progress-fill auto linear both;
    animation-timeline: scroll(root block);
  }
}
```

A progress bar should not cover focus indicators or obscure content. It is usually decorative, so `aria-hidden="true"` is appropriate. If the progress is important to task completion, expose a semantic progress value separately rather than expecting screen-reader users to infer it from a thin animated line.

### 9. Viewport reveals without JavaScript

For simple reveal effects, a view timeline can connect opacity and transform to an element’s passage through the viewport. This can remove JavaScript scroll listeners from a small enhancement. The fallback must leave the content visible.

```css
.story-card {
  opacity: 1;
  transform: none;
}

@supports (animation-timeline: view()) {
  .story-card {
    animation: story-reveal auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 45%;
  }
}

@keyframes story-reveal {
  from { opacity: 0.2; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

The visible base state is intentional. In unsupported browsers, the card appears normally. In supported browsers, the optional animation enhances the entry. Do not put essential text or controls behind an unsupported animation. Also test content restored at a mid-page scroll position: users may land directly on a section without seeing the intended entry sequence.

**Gotcha:** A reveal that begins at low opacity can make text harder to read while the user is trying to scan. Use restrained changes and avoid animating every paragraph on long-form pages.

### 10. Parallax and depth effects

Scroll-linked parallax can create a sense of depth by moving a decorative layer at a different rate from the surrounding content. Native scroll-driven CSS can express some simple effects, but parallax should be subtle and never make text or controls drift away from their logical positions.

```css
.hero {
  position: relative;
  overflow: clip;
}

.hero__background {
  position: absolute;
  inset: -8%;
  background: linear-gradient(135deg, #0f172a, #334155);
  transform: translateY(0);
}

@supports (animation-timeline: scroll()) {
  .hero__background {
    animation: hero-drift auto linear both;
    animation-timeline: scroll(root block);
    animation-range: 0% 35%;
  }
}

@keyframes hero-drift {
  from { transform: translateY(-2%); }
  to { transform: translateY(2%); }
}
```

The example uses a deliberately small travel distance. Keep the background separate from content so the visual effect does not interfere with reading or keyboard focus. Avoid excessive motion, large zooms, or conflicting transforms on the same element.

### 11. Reduced motion and still-state behavior

Scroll-driven animation can be especially noticeable because it responds directly to user movement. Respect `prefers-reduced-motion` and preserve a clear static state. For many interfaces, disabling the scroll animation entirely is appropriate; for others, a very small opacity change may be acceptable.

```css
@media (prefers-reduced-motion: reduce) {
  .story-card,
  .feature-section__artwork,
  .hero__background {
    animation: none !important;
    opacity: 1;
    transform: none;
  }

  .reading-progress {
    animation: none !important;
    transform: scaleX(1);
  }
}
```

Whether the progress bar should remain filled, disappear, or use a nonanimated alternative depends on the product. Avoid presenting a misleading progress value. If the bar’s purpose is to indicate actual reading progress, an unsupported or reduced-motion fallback that always appears complete may be misleading; in that case, hide the bar or use a tested alternative.

Accessibility also includes keyboard focus, semantic document order, and sufficient contrast. Do not make an element focusable only after it scrolls into view. The content should exist in a sensible reading order and remain accessible regardless of whether the timeline is active.

### 12. Performance and rendering cost

Scroll-driven animations can reduce the need for JavaScript scroll handlers, but they are not automatically free. The browser still has to render the animated properties, and expensive effects can cause paint work or jank. Prefer `transform` and `opacity` for routine visual movement, and avoid animating layout-affecting properties unless a measured requirement justifies it.

```css
/* Prefer transform for a visual shift. */
@keyframes media-enter {
  from { opacity: 0; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}

.media-frame {
  animation: media-enter auto linear both;
  animation-timeline: view(block);
  animation-range: entry 0% entry 40%;
}
```

Use DevTools Performance recordings, paint flashing, and layer visualization to inspect the real cost. Large images, blur filters, complex clipping, and too many independently animated layers can still cause jank. Do not add `will-change` broadly. Use it only after profiling and remove it when it is no longer helpful.

### 13. Feature detection and progressive enhancement

Scroll-driven CSS support differs by browser version. Use `@supports` to isolate the enhancement, and keep the base state readable and usable. Do not set `opacity: 0` in the base rule and expect every browser to support the timeline.

```css
.feature-card {
  opacity: 1;
  transform: none;
}

@supports (animation-timeline: view()) {
  .feature-card {
    animation: card-reveal auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 40%;
  }
}

@keyframes card-reveal {
  from { opacity: 0.15; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

Feature detection checks whether the browser understands the tested syntax, not whether every detail behaves exactly as you expect in every layout. Validate with current compatibility data on Can I Use and run real browser tests. Include current Chromium, Firefox, and Safari in the test matrix, especially if the site depends on scroll-linked motion as a prominent design feature.

**Gotcha:** A parser may accept a declaration while the animation behaves differently because the timeline is attached to a different scroller or has no scroll range. `@supports` is only one part of validation.

### 14. Choosing CSS, JavaScript, or a motion library

Native scroll-driven CSS is a good fit when one scroll position maps directly to one or more visual properties. It is less suitable when the animation requires complex sequencing, dynamic measurement, pinning, snapping, cross-component coordination, or fallback logic that is difficult to maintain in CSS.

```js
const supportsViewTimeline = CSS.supports("animation-timeline: view()");

if (!supportsViewTimeline) {
  console.info("Scroll-driven CSS enhancement unavailable; using visible static content.");
}
```

Use JavaScript only when it adds necessary behavior. If a simple CSS timeline works, it avoids manually listening to scroll events and synchronizing animation frames. If the project already uses GSAP ScrollTrigger for pinned sections and coordinated timelines, avoid duplicating the same motion in native CSS unless the boundary is clear.

When JavaScript is necessary, prefer passive scroll listeners for observation and `requestAnimationFrame` for batching visual updates. Avoid reading layout values and writing styles repeatedly inside the same scroll handler, which can cause forced synchronous layout and jank.

## Six Named Patterns

### Pattern 1 — Root reading-progress bar

**What it does:** Scales a fixed thin bar according to progress through the root document’s scroll range.

**When to use:** Long articles, case studies, or documentation pages where a subtle visual cue helps readers understand their position.

```css
.reading-progress {
  position: fixed;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  transform: scaleX(1);
  transform-origin: left center;
  background: #2563eb;
}

@supports (animation-timeline: scroll()) {
  .reading-progress {
    transform: scaleX(0);
    animation: progress-fill auto linear both;
    animation-timeline: scroll(root block);
  }
}

@keyframes progress-fill {
  to { transform: scaleX(1); }
}
```

Choose a truthful fallback. If the bar is meant to show real reading progress, consider hiding it when unsupported instead of showing a permanently full bar.

### Pattern 2 — Viewport entry reveal

**What it does:** Reveals an element as it enters the viewport using opacity and a small translation.

**When to use:** A few nonessential visual elements in a portfolio or editorial page, when the default state remains fully visible without support.

```css
.editorial-card {
  opacity: 1;
  transform: none;
}

@supports (animation-timeline: view()) {
  .editorial-card {
    animation: editorial-reveal auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 40%;
  }
}

@keyframes editorial-reveal {
  from { opacity: 0.25; transform: translateY(0.75rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

Avoid animating all text blocks in a long article. Motion should support hierarchy rather than obstruct reading.

### Pattern 3 — Named timeline for a nested reader

**What it does:** Connects a progress indicator to a particular scrollable panel rather than the page.

**When to use:** Documentation panes, side-by-side editors, or a scrollable product detail panel.

```css
.reader-pane {
  max-height: 70vh;
  overflow-y: auto;
  scroll-timeline-name: --reader-timeline;
  scroll-timeline-axis: block;
}

.reader-pane__progress {
  transform-origin: left center;
  animation: progress-fill auto linear both;
  animation-timeline: --reader-timeline;
}

@keyframes progress-fill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

The pane must actually overflow. If the content is shorter than the available height, the progress timeline has no meaningful scroll range.

### Pattern 4 — Subtle hero parallax

**What it does:** Moves a decorative background a small distance as the root page scrolls.

**When to use:** A nonessential hero background that can move without affecting content position, legibility, or focus.

```css
.hero {
  position: relative;
  overflow: clip;
}

.hero__background {
  position: absolute;
  inset: -5%;
  transform: translateY(0);
}

@supports (animation-timeline: scroll()) {
  .hero__background {
    animation: hero-parallax auto linear both;
    animation-timeline: scroll(root block);
    animation-range: 0% 30%;
  }
}

@keyframes hero-parallax {
  from { transform: translateY(-1.5%); }
  to { transform: translateY(1.5%); }
}

@media (prefers-reduced-motion: reduce) {
  .hero__background { animation: none; transform: none; }
}
```

Keep the distance restrained and provide a still background when reduced motion is enabled.

### Pattern 5 — Scroll-linked media emphasis

**What it does:** Slightly changes the opacity or scale of decorative media during a chosen view-timeline range.

**When to use:** A visual image or illustration whose emphasis should follow the section currently being read.

```css
.case-study__media {
  transform: scale(1);
  opacity: 1;
}

@supports (animation-timeline: view()) {
  .case-study__media {
    animation: media-emphasis auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% cover 35%;
  }
}

@keyframes media-emphasis {
  from { opacity: 0.75; transform: scale(0.985); }
  to { opacity: 1; transform: scale(1); }
}
```

Do not apply the effect to text or controls whose position and readability must remain predictable.

### Pattern 6 — Progressive enhancement with static fallback

**What it does:** Keeps the element fully visible by default and applies a scroll-driven effect only where the browser supports the necessary timeline syntax.

**When to use:** Any scroll-driven enhancement on a production page, especially where unsupported browsers are part of the audience.

```css
.feature-illustration {
  opacity: 1;
  transform: none;
}

@supports (animation-timeline: view()) {
  .feature-illustration {
    animation: illustration-reveal auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 35%;
  }
}

@keyframes illustration-reveal {
  from { opacity: 0.2; transform: translateY(1rem); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .feature-illustration {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

The fallback is a product decision: the visual should not be hidden merely because the animation feature is missing.

## Semantic Example: Article Progress and Section Enhancement

This example uses semantic document structure and treats scroll animation as optional. The progress bar is decorative, and the article remains readable in unsupported browsers.

```html
<div class="reading-progress" aria-hidden="true"></div>
<main class="article-layout">
  <article>
    <header>
      <h1>Designing interfaces that respond to people</h1>
      <p class="article-summary">A practical guide to interaction feedback and motion.</p>
    </header>

    <section class="article-section" aria-labelledby="section-one">
      <h2 id="section-one">Start with the state</h2>
      <p>Interfaces should remain understandable before decorative motion is added.</p>
    </section>

    <section class="article-section" aria-labelledby="section-two">
      <h2 id="section-two">Add motion with intent</h2>
      <p>Use scroll-driven effects only when scroll position explains the visual change.</p>
    </section>
  </article>
</main>
```

```css
.reading-progress {
  position: fixed;
  inset: 0 auto auto 0;
  z-index: 100;
  width: 100%;
  height: 3px;
  background: #2563eb;
  transform: scaleX(1);
  transform-origin: left center;
}

.article-layout {
  max-width: 72rem;
  margin-inline: auto;
  padding: clamp(1rem, 4vw, 4rem);
}

.article-section {
  margin-block: 3rem;
  opacity: 1;
  transform: none;
}

.article-section:focus-visible,
a:focus-visible,
button:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}

@supports (animation-timeline: scroll()) {
  .reading-progress {
    transform: scaleX(0);
    animation: progress-fill auto linear both;
    animation-timeline: scroll(root block);
  }
}

@supports (animation-timeline: view()) {
  .article-section {
    animation: section-reveal auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 35%;
  }
}

@keyframes progress-fill {
  to { transform: scaleX(1); }
}

@keyframes section-reveal {
  from { opacity: 0.35; transform: translateY(0.75rem); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .reading-progress,
  .article-section {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
}
```

For a real article, verify that the progress bar fallback is truthful. If scroll timelines are unavailable and there is no JavaScript fallback, remove the bar rather than showing a value that implies the article is complete. Also test scroll restoration: a browser can restore the page at a position where sections are already visible, so the page must not require the user to scroll past the top for content to appear.

## Optional JavaScript Fallback

Use a JavaScript fallback only when a true progress value is important enough to justify the extra behavior. A simple scale update can be implemented with `requestAnimationFrame`, but it must avoid excessive layout reads and clean up event listeners. For complex scroll-linked animation, consider a library designed for the project rather than adding ad hoc handlers.

```js
const progressBar = document.querySelector(".reading-progress");
const supportsScrollTimeline = CSS.supports("animation-timeline: scroll()");

if (progressBar && !supportsScrollTimeline) {
  let frameRequested = false;

  function updateProgress() {
    frameRequested = false;

    const scrollableHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    const progress = scrollableHeight > 0
      ? window.scrollY / scrollableHeight
      : 0;

    progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  }

  function requestProgressUpdate() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(updateProgress);
  }

  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate);
  updateProgress();
}
```

If this script belongs to a component that can unmount, remove its listeners during cleanup. Test when content loads dynamically because the scrollable height may change after images, fonts, or fetched content arrive. The code only updates the decorative visual; it must not be the source of truth for the page’s content or state.

## Debugging Workflow

1. Confirm the CSS file loaded and the element has the expected class.
2. Check whether the browser supports the tested `animation-timeline` syntax with `CSS.supports()` or `@supports`.
3. Inspect the computed `animation-name`, `animation-timeline`, `animation-range`, `animation-duration`, and `animation-fill-mode`.
4. Identify the intended scroll container: root, nested element, or named timeline owner.
5. Confirm that the chosen container actually scrolls and has a nonzero scroll range.
6. Check whether the target element is the subject of a view timeline or a descendant using a named view timeline.
7. Verify the axis and writing mode; compare `block`/`inline` with `x`/`y`.
8. Temporarily remove clipping, filters, and other visual effects to isolate rendering issues.
9. Check that base opacity and transform values keep the content visible when animation is unavailable.
10. Emulate reduced motion and ensure every meaningful content item remains visible.
11. Test keyboard focus before, during, and after scrolling.
12. Record a Performance trace and inspect long frames, paint, layout, and layer activity.
13. Test current Chromium, Firefox, and Safari with realistic content and scroll restoration.
14. Test a tall section, a short card, a nested scroller, and a page with no overflow.

Use this helper to collect the element’s resolved animation state and dimensions:

```js
function inspectScrollAnimation(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return null;
  }

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const report = {
    selector,
    animationName: style.animationName,
    animationTimeline: style.animationTimeline,
    animationRange: style.animationRange,
    animationDuration: style.animationDuration,
    animationFillMode: style.animationFillMode,
    opacity: style.opacity,
    transform: style.transform,
    width: rect.width,
    height: rect.height,
    supportsScrollTimeline: CSS.supports("animation-timeline: scroll()"),
    supportsViewTimeline: CSS.supports("animation-timeline: view()")
  };

  console.table(report);
  return report;
}

inspectScrollAnimation(".article-section");
```

Computed style inspection is a diagnostic starting point, not proof that a timeline is progressing correctly. Check the actual scroll position and timeline owner. Use browser DevTools’ Animations and Performance panels where available, and compare the behavior with the enhancement disabled.

## Mistakes and Fixes

| Mistake | Why it fails | Specific fix |
|---|---|---|
| Hiding content in the base state | Unsupported browsers can leave it invisible. | Keep the base opacity at one and apply the effect inside `@supports`. |
| Using a scroll timeline on a non-scrollable container | There is no meaningful progress to map. | Confirm that the container has overflow and a scroll range. |
| Binding to the root instead of a nested pane | The animation tracks the wrong scroll source. | Use a named timeline on the intended scroller. |
| Choosing the wrong axis | Progress may follow an unrelated direction. | Use the correct logical or physical axis for the layout. |
| Treating view progress like document progress | The animation begins and ends at unexpected positions. | Select a view timeline for an element’s passage through the scrollport. |
| Using the full view range for every element | Tall and short elements move at different perceived speeds. | Tune `animation-range` against realistic element sizes. |
| Forgetting `animation-duration: auto` for a scroll timeline | A time-based duration may not express the intended mapping. | Use the documented scroll-driven timeline syntax and test the result. |
| Assuming `@supports` proves runtime behavior | Syntax support does not prove the correct scroller or range. | Test real scroll geometry and the timeline owner. |
| Applying parallax to text and controls | Content drifts and can become harder to read or focus. | Limit parallax to a separate decorative layer. |
| Ignoring reduced motion | Scroll-linked movement can be uncomfortable. | Disable nonessential movement in a reduced-motion media query. |
| Animating `top` or `height` on scroll | Frequent layout can cause jank. | Prefer transform and opacity for visual effects. |
| Adding `will-change` everywhere | Too many layers consume memory and can worsen performance. | Profile first and add it narrowly only if useful. |
| Assuming a progress bar is semantic progress | A decorative line does not expose a numeric value. | Use an accessible progress representation if the value matters. |
| Leaving a full-bar fallback for real progress | It falsely implies the user is at the end. | Hide it or provide a tested JavaScript fallback. |
| Forgetting scroll restoration | Content may be loaded at a mid-page position. | Keep content visible by default and test restored scroll positions. |
| Ignoring dynamically loaded content | Scroll range changes after the timeline is first evaluated. | Test after images, fonts, and fetched content change document height. |
| Reusing generic timeline names | Nested components may become hard to debug. | Use clear, component-specific names and document ownership. |
| Testing only Chromium | Feature support and behavior vary across browsers. | Test current Chromium, Firefox, and Safari. |
| Using scroll listeners unnecessarily | JavaScript adds synchronization and cleanup complexity. | Prefer native CSS for simple scroll-to-visual mappings. |
| Failing to clean up JavaScript fallback listeners | Unmounted components can retain work and stale references. | Remove listeners and observers in component cleanup. |

## Mental Models

1. **Scroll progress is a position, not elapsed time.** Moving the page changes animation progress; waiting without scrolling does not necessarily advance it.
2. **Every timeline has an owner.** Decide which scroll container controls the effect and make that relationship explicit.
3. **A view timeline describes a subject’s journey through a scrollport.** It is not the same as the whole document’s scroll percentage.
4. **The static state is the fallback contract.** Content must remain visible and understandable if the feature is unsupported or disabled.
5. **Feature detection checks syntax, not design quality.** A supported declaration can still bind to the wrong scroller or use a poor range.
6. **Scroll-linked motion should clarify reading, not compete with it.** Animate a small number of visual elements and keep text stable.
7. **Transform and opacity are defaults, not guarantees.** Measure real paint and compositing cost on target devices.
8. **Accessibility must survive stillness.** Reduced motion should preserve content, state, and keyboard operation.
9. **The timeline range is part of the design.** A correct keyframe sequence can still feel wrong if its active range is poorly chosen.
10. **A progress indicator must be truthful.** If the browser cannot calculate real progress, do not display a misleading completion state.
11. **Native CSS is strongest for direct mappings.** Complex choreography, pinning, snapping, and dynamic measurements may require a dedicated tool.
12. **Test geometry, not just syntax.** Tall sections, nested scrollers, zoom, and dynamic content can change the effect substantially.

## Browser Support and Compatibility

Scroll-driven animation support has evolved across browser versions. Core CSS animation syntax is mature, but `animation-timeline`, named scroll timelines, view timelines, and `animation-range` have version-specific support and behavior. Verify the current compatibility matrix on Can I Use and test the minimum browser versions in your project.

Use `@supports` for optional enhancement:

```css
.section {
  opacity: 1;
  transform: none;
}

@supports (animation-timeline: view()) {
  .section {
    animation: section-reveal auto linear both;
    animation-timeline: view(block);
    animation-range: entry 0% entry 40%;
  }
}
```

Do not use a base state of `opacity: 0` for content that must be available across browsers. A fallback that keeps content static is generally safer than requiring JavaScript to make it visible.

Compatibility checklist:

- Chromium: verify root and named scroll timelines, view ranges, and performance under scroll.
- Firefox: verify the specific timeline features supported by the project’s minimum version.
- Safari on macOS and iOS: test viewport behavior, nested scrollers, touch scrolling, and reduced motion.
- Feature detection: check the exact syntax you use, not a loosely related property.
- Nested containers: verify that the intended element owns the scroll timeline.
- Long content: test tall sections and variable content lengths.
- Zoom and localization: confirm the range still makes sense when text wraps differently.
- Scroll restoration: ensure no content stays hidden when the browser restores a prior position.
- Unsupported browser: confirm the page remains fully readable and operable.

## Build Challenge — Scroll-Responsive Editorial Page

Build an editorial case-study page with a reading-progress bar, three section reveals, one decorative parallax layer, and one nested scrollable reader. The default experience must be readable and functional without scroll-driven animation support.

### Requirements

1. Create a `scroll-motion.css` file with clearly named keyframes and timeline rules.
2. Implement a root reading-progress indicator using `scroll(root block)`.
3. Make the progress indicator decorative with appropriate accessibility treatment, or provide a separate semantic progress value if it represents task progress.
4. Implement at least three view-timeline section reveals using `animation-timeline: view()` or named view timelines.
5. Keep each section fully visible in the base stylesheet.
6. Add `@supports` guards around optional scroll-driven animation declarations.
7. Implement one named scroll timeline for a nested scroll container.
8. Verify the nested container actually overflows and its timeline advances.
9. Add one subtle decorative parallax effect that does not move text or controls.
10. Add a `prefers-reduced-motion: reduce` override that removes nonessential movement.
11. Include at least two `:focus-visible` rules and test them during scroll.
12. Use semantic HTML such as `main`, `article`, `section`, headings, and buttons where appropriate.
13. Write an `inspectScrollAnimation()` helper that logs timeline-related computed values.
14. Prefer transform and opacity; document and measure any exception.
15. Test current Chromium, Firefox, and Safari.
16. Test a section taller than the viewport and a compact card.
17. Test browser scroll restoration at a mid-page position.
18. Simulate a browser without timeline support and verify the static fallback.
19. Add dynamic content or an image that changes document height and confirm the experience remains correct.
20. Record a DevTools Performance trace while scrolling and inspect layout, paint, and layer behavior.

### Required failure scenarios

- Remove the `@supports` block and set the animated element’s base opacity to zero. Demonstrate the unsupported-browser failure, then restore a visible base state.
- Attach a progress animation to the wrong scroll container. Diagnose the mismatch and bind it to the correct named timeline.
- Test a nested scroller with no overflow. Confirm that the timeline has no meaningful progress and document the fallback.
- Enable reduced motion and verify that no essential content disappears.
- Restore the page at a mid-document scroll position and confirm that all sections are readable immediately.
- Add an expensive blur or animate a layout property, profile the result, and replace it with a cheaper visual technique where appropriate.

### Definition of Done

- [ ] Every section remains visible without scroll-driven CSS support.
- [ ] Timeline owners and axes are documented.
- [ ] The reading progress behavior is truthful in both supported and unsupported browsers.
- [ ] The nested reader has a real scroll range and its timeline behaves as expected.
- [ ] View ranges work for both short and tall content.
- [ ] Reduced-motion mode removes nonessential movement without breaking navigation.
- [ ] Keyboard focus remains visible during scroll.
- [ ] Chromium, Firefox, and Safari checks are recorded.
- [ ] The debug helper reports useful values and handles missing elements.
- [ ] The performance trace has been reviewed for jank, layout, paint, and layer cost.
- [ ] Dynamic content and scroll restoration have been tested.
- [ ] No essential information depends on the animation running.

## Quick Reference

| Situation | Recommended approach | Watch out for |
|---|---|---|
| Page reading progress | `scroll(root block)` | Misleading fallback state |
| Nested panel progress | Named scroll timeline | Container may not overflow |
| Section enters viewport | `view(block)` | Tall elements need tuned ranges |
| Descendant follows a section | Named view timeline | Timeline ownership and scope |
| Horizontal rail | Inline or horizontal axis | Actual horizontal overflow |
| Simple visual reveal | `@supports` plus visible base styles | Hidden content in unsupported browsers |
| Decorative parallax | Separate background layer | Motion discomfort and text drift |
| Reduced-motion preference | Disable or simplify scroll-linked effects | Forgetting static visibility |
| Timeline seems frozen | Inspect scroller and scroll range | Wrong container or no overflow |
| Animation range feels slow | Tune `animation-range` | One range does not fit every element |
| Janky scrolling | Performance trace and paint diagnostics | Filters, layout properties, large layers |
| Progress must be accurate | Semantic progress or tested JS fallback | Decorative bar is not semantic data |
| Browser support varies | Check Can I Use and target versions | Assuming every engine behaves alike |
| Dynamic content loads | Re-test document and container height | Scroll range can change |
| Scroll restoration | Visible base state | Reveal may not replay from the top |
| Focused control in moving region | Stable layout and `:focus-visible` | Clipped or obscured focus indicator |
| Complex pinning or snapping | Consider GSAP ScrollTrigger | Reimplementing orchestration poorly |
| Simple scroll-to-style mapping | Native CSS timeline | Unnecessary JavaScript listeners |
| JavaScript fallback | `requestAnimationFrame` and cleanup | Forced layout and leaked listeners |
| Optional syntax | Exact `@supports` guard | Syntax support is not full behavior proof |

## Delivery Notes

Scroll-driven CSS works best when the relationship between scroll position and visual state is simple, obvious, and optional. Keep the base document readable, choose the correct scroll container, tune the timeline range to real content, and avoid making essential information dependent on an animation.

Before shipping, test with reduced motion, keyboard navigation, dynamic content, scroll restoration, nested scrolling, and a slower device. Use browser DevTools to inspect the computed timeline properties and performance traces. Validate current Chromium, Firefox, and Safari support rather than relying on a single browser. If the effect does not clarify progress or hierarchy, remove it.
