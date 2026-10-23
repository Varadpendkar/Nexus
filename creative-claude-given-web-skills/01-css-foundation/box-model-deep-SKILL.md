# SKILL: box-model-deep
**Layer:** 01 — CSS Foundation
**Goal:** Master the browser’s box-sizing and flow-layout rules so you can predict, debug, and deliberately control the dimensions and spacing of real interfaces.

---

## Why This Matters (Senior Perspective)

A page can look “almost right” while its geometry is quietly unstable: a card is a few pixels wider than its grid track, a button wraps at one breakpoint, a hero pushes the page sideways, or two vertical margins combine in a way nobody expected. These are not random CSS mysteries. They are consequences of the browser’s layout rules. If you only adjust numbers until the screenshot looks correct, you accumulate compensating hacks that break as soon as copy changes, a font loads, or the viewport narrows.

Senior developers build a mental model of the box the browser is laying out. They distinguish the content box from the padding and border, know when percentages resolve against a containing block, understand why normal-flow margins sometimes collapse, and can recognize when a new block formatting context changes float and margin behavior. They use DevTools to verify computed geometry instead of guessing. The result is not merely cleaner CSS: it is a layout system that stays predictable when real content arrives.

For creative development, geometry is part of the visual design. An editorial portfolio may rely on tight typographic rhythm, oversized project cards, overlapping artwork, and responsive negative space. A freelance client site may need long headings, translated copy, validation messages, and CMS images to fit without overflow. Understanding the box model lets you make those compositions intentional rather than fragile—and makes debugging much faster when a client reports that “the mobile version is broken.”

---

## Core Concepts

### 1. The four layers of a CSS box

The mental model is a stack from the inside out: **content → padding → border → margin**. Content holds text or media; padding creates interior breathing room; border draws the edge; margin creates exterior separation from neighboring boxes. Backgrounds generally paint through the padding area and up to the border edge, while margins remain transparent.

```html
<article class="project-card">
  <p class="project-card__eyebrow">Selected work · 2026</p>
  <h2 class="project-card__title">Intelligence, made tangible.</h2>
</article>
```

```css
.project-card {
  width: 320px;                 /* Under content-box, this is content width only */
  padding: 24px;                /* Adds 48px to the rendered border-box width */
  border: 1px solid #34343b;    /* Adds another 2px to rendered width */
  margin: 0 0 32px;             /* Space outside the border; not part of the box width */
  background: #15151a;
  color: #f4f1ec;
}
```

With the default `content-box`, the outer border-box width is `320 + 24 + 24 + 1 + 1 = 370px`. The margin is outside that measurement. This distinction explains why an element set to `width: 100%` can overflow its parent after padding or borders are added.

**Naive approach:** keep increasing or decreasing `width` until the card visually fits.

**Correct approach:** decide whether the declared width should describe the content or the whole visible box, then choose `box-sizing` accordingly.

```css
/* Fragile when several components add their own padding and borders. */
.legacy-panel {
  width: 100%;
  padding: 24px;
  border: 1px solid #34343b;
}

/* Predictable: the declared width includes padding and border. */
.panel {
  box-sizing: border-box;
  width: 100%;
  padding: 24px;
  border: 1px solid #34343b;
}
```

**Gotcha:** margins do not become part of `box-sizing: border-box`. A `width: 100%` element can still exceed its parent if it also has horizontal margins.

### 2. `content-box` versus `border-box`

The `box-sizing` property controls what the `width` and `height` values measure. `content-box` is the initial CSS behavior: the declared dimensions describe the content area. `border-box` includes content, padding, and border in the declared dimensions. Most modern interface work is easier when components use `border-box`, because a 320px card remains 320px wide even after you add internal spacing.

```css
/* Demonstration: compare these two elements side by side. */
.measurement-demo__content-box {
  box-sizing: content-box;
  width: 240px;
  padding: 20px;
  border: 4px solid #e879f9;
}

.measurement-demo__border-box {
  box-sizing: border-box;
  width: 240px;
  padding: 20px;
  border: 4px solid #67e8f9;
}
```

The first element's outer width is 288px. The second element's outer width is 240px, leaving 192px for content (`240 - 40 - 8`). This is not a visual trick; it is a different width calculation.

A reliable project-wide baseline is:

```css
/* Apply predictable sizing to every element, including pseudo-elements. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Form controls otherwise may have browser-specific sizing details. */
input,
button,
textarea,
select {
  font: inherit;
}
```

A scoped alternative is useful when integrating third-party widgets whose assumptions you do not control:

```css
.client-site {
  box-sizing: border-box;
}

.client-site *,
.client-site *::before,
.client-site *::after {
  box-sizing: inherit; /* Descendants inherit the local sizing contract */
}
```

**Gotcha:** changing `box-sizing` does not change the element's content; it changes how the declared dimensions are allocated. With a fixed `height`, adding padding under `border-box` can reduce the available content height and cause text to overflow if the content cannot fit.

### 3. Width algorithms and the containing block

CSS width is not always a simple number copied to the screen. Percentages generally resolve against a containing block, and the containing block is often established by the nearest block-level ancestor’s content box. A child at `width: 100%` means “fill the relevant containing block,” not “fill the viewport” and not “include my margins.”

```html
<section class="project-grid">
  <article class="project-tile">
    <h2>Predictive systems</h2>
    <p>Research translated into a useful interface.</p>
  </article>
</section>
```

```css
.project-grid {
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
}

.project-tile {
  width: 100%;                 /* Tracks the grid wrapper's content width */
  padding: 1.5rem;
  border: 1px solid #34343b;
}
```

The `min()` expression keeps a 1rem gutter on each side while limiting the wrapper to 72rem. It is a common, robust container pattern for portfolios.

Avoid using `width: 100vw` for ordinary page sections when the viewport unit includes the scrollbar width in the browser environment; it can create horizontal overflow. Prefer `width: 100%` or a container wrapper unless you explicitly need viewport-sized geometry.

```css
/* Risky for a normal page section: may be wider than the layout area. */
.full-bleed-risky {
  width: 100vw;
}

/* Better for normal content that should fill its parent. */
.section-content {
  width: 100%;
}

/* Use viewport width only when the design genuinely requires viewport geometry. */
.full-bleed {
  width: 100vw;
  margin-inline: calc(50% - 50vw);
}
```

**Gotcha:** the full-bleed pattern assumes the element is inside a centered content context and should break out to viewport edges. Check it on pages with scrollbars, nested scrolling regions, or unusual writing directions. Do not use it as a default container strategy.

### 4. `min-width`, `max-width`, and intrinsic sizing

A declared `width` is only one part of the sizing algorithm. `min-width` and `max-width` constrain the result, while intrinsic keywords such as `min-content`, `max-content`, and `fit-content` let content influence dimensions. These matter when headings, URLs, code snippets, images, and flex/grid children refuse to shrink as expected.

```css
.article-shell {
  width: min(100% - 2rem, 68rem);
  margin-inline: auto;
}

.article-title {
  max-width: 16ch;             /* Keeps the headline line length art-directed */
  font-size: clamp(2.5rem, 7vw, 6.5rem);
  line-height: 0.98;
  overflow-wrap: anywhere;     /* Emergency protection for unusually long tokens */
}

.project-image {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;                /* Preserve the image's intrinsic aspect ratio */
}
```

`min-content` is roughly the smallest size a box can take without avoidable soft wrapping; for text, long unbreakable tokens can dominate it. `max-content` is the size needed to lay content out without soft wrapping. `fit-content` balances available space and intrinsic content sizing, subject to its constraints.

```css
.intrinsic-demo__label {
  width: max-content;          /* Fits the label's unwrapped content */
  max-width: 100%;              /* But never exceeds the parent */
}

.intrinsic-demo__copy {
  width: fit-content;           /* Shrinks/grows based on content and available room */
  max-width: 42rem;
}
```

**Wrong:** assuming every child can shrink to fit simply because its parent is narrower.

```css
/* A long title can force a grid/flex item to overflow in some layouts. */
.project-card__heading {
  min-width: auto;
}

/* Explicitly permit the item to shrink below its min-content contribution. */
.project-card__heading {
  min-width: 0;
  overflow-wrap: anywhere;
}
```

`min-width: 0` is especially important on flex and grid items because their automatic minimum size can preserve a content-based minimum. Use it when the intended design allows the item to shrink; do not apply it blindly to every element.

### 5. Height, content flow, and `min-height`

In normal document flow, content usually determines an element’s height. Fixed heights can be useful for tightly controlled visual components, but they are risky for text-bearing cards because real copy is not a fixed-size asset. Prefer `min-height` when a component should have a minimum visual presence but still expand for content.

```css
/* Fragile: translated copy or a larger font can be clipped or overflow. */
.testimonial--fragile {
  height: 18rem;
  overflow: hidden;
}

/* Robust: consistent baseline height, with room for real content. */
.testimonial {
  min-height: 18rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  display: flex;
  flex-direction: column;
}

.testimonial__attribution {
  margin-block-start: auto;     /* Aligns attribution to the bottom when space allows */
}
```

If equal-height cards are required, use layout alignment instead of forcing a fixed height on every card. Grid stretches items to the row size by default, and flex layouts can align content deliberately.

```css
.testimonial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 1rem;
  align-items: stretch;
}
```

**Gotcha:** `height: 100%` only resolves as expected when the relevant containing block has a definite height. If the parent height is `auto`, a percentage height often cannot produce the result beginners expect. Use grid/flex stretching or define a real sizing context instead.

### 6. Margin collapse in normal flow

Vertical margins between block boxes in normal flow can collapse: adjacent positive margins do not necessarily add together. In the simplest case, the larger positive margin wins. A positive and negative margin combine by arithmetic; two negative margins collapse to the more negative one. Horizontal margins do not collapse in this way.

```html
<div class="article-flow">
  <h2 class="article-flow__heading">A new direction</h2>
  <p class="article-flow__paragraph">The first paragraph introduces the idea.</p>
</div>
```

```css
.article-flow__heading {
  margin-block-end: 32px;
}

.article-flow__paragraph {
  margin-block-start: 24px;
}

/* In normal block flow, the adjoining vertical margins can collapse to 32px,
   rather than producing 56px of space. */
```

Margin collapse can also occur between a parent and its first/last in-flow child when no border, padding, inline content, clearance, or formatting-context boundary separates them. This can make a child’s margin appear to move the parent.

**Naive fix:** add random `padding-top: 1px` to a parent because its child margin seems to escape.

**Correct fix:** choose an explicit layout contract. Use `display: flow-root`, grid, or flex when you need a formatting context that prevents the relevant margin collapsing.

```css
.article-flow {
  display: flow-root;            /* Contains child margins and floats in this block */
}

/* Or use a gap-based layout when the component is fundamentally a vertical stack. */
.article-stack {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;                    /* Space belongs to the relationship between items */
}

.article-stack > * {
  margin-block: 0;                /* Avoid mixing two spacing systems */
}
```

`gap` does not collapse, which makes it easier to reason about component spacing. It applies only to layout containers such as flex and grid, not to ordinary block flow.

### 7. Block formatting contexts (BFCs) and `flow-root`

A block formatting context is a layout environment with specific rules for block boxes, floats, and margins. You do not need to memorize every historical trigger, but you should recognize the practical effect: a BFC contains its internal floats, prevents certain margin-collapsing relationships, and keeps its boxes from overlapping floats outside it. `display: flow-root` is the clearest modern way to create one when that is the intended behavior.

```html
<article class="case-study-summary">
  <img class="case-study-summary__cover" src="case-study-cover.jpg" alt="Abstract interface study">
  <p>The copy should wrap beside the image, and the card should contain its float.</p>
</article>
```

```css
.case-study-summary {
  display: flow-root;            /* The card owns its float and resulting height */
  padding: 1.5rem;
  border: 1px solid #34343b;
}

.case-study-summary__cover {
  float: inline-start;
  width: min(42%, 15rem);
  margin-inline-end: 1rem;
  margin-block-end: 0.5rem;
}
```

Floats are not the default tool for modern page layout; grid and flexbox usually express component structure more clearly. This example demonstrates why a BFC matters when legacy content, editorial text wrapping, or a float-based widget is involved.

```css
/* Less explicit: relying on overflow to create containment can clip content. */
.card--unintended {
  overflow: hidden;
}

/* More explicit: containment without turning the element into a clipping viewport. */
.card {
  display: flow-root;
}
```

**Gotcha:** `overflow: hidden` can create a BFC, but it also clips visual overflow and can change scroll/sticky behavior. Do not use it merely as a clearfix when clipping is not part of the design.

### 8. Padding, margin, `gap`, and the spacing contract

All four can create visible space, but they express different relationships. Padding belongs inside a component’s boundary. Margin belongs to an element’s outside edge and can collapse in block flow. `gap` belongs to the layout relationship between children. A consistent spacing contract prevents “spacing soup,” where multiple mechanisms fight each other.

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
}

.project-list {
  display: grid;
  gap: var(--space-6);           /* Repeated spacing is owned by the parent */
}

.project-card {
  padding: var(--space-6);       /* Internal breathing room is owned by the card */
  margin: 0;                     /* Prevents an additional, hidden spacing layer */
}
```

Use margin for a one-off relationship when it communicates the design clearly; use `gap` for repeated sibling spacing in a layout; use padding to protect content from a component edge. This is not a rigid law, but a useful default.

**Before:**

```css
.project-card {
  margin-bottom: 24px;
  padding: 24px;
}

.project-card h2 {
  margin-top: 18px;
  margin-bottom: 12px;
}

.project-card p {
  margin-top: 14px;
}
```

**After:**

```css
.project-card {
  padding: 1.5rem;
}

.project-card__content {
  display: grid;
  gap: 0.75rem;
}

.project-card__content > * {
  margin: 0;                     /* One component, one predictable spacing system */
}
```

The “after” pattern makes spacing visible in one place. It is especially useful for reusable portfolio cards and CMS-driven content where text elements may appear or disappear.

### 9. Overflow and visual versus layout dimensions

Overflow is what happens when content extends beyond an element’s overflow area. `visible` allows it to paint outside; `hidden` clips it; `clip` clips without creating a scroll container; `auto` provides scrolling when needed; `scroll` requests scrolling behavior even when the content fits (browser UI varies). Overflow choices affect more than appearance: they can influence scroll containers, sticky positioning, and focus visibility.

```css
.project-artwork {
  position: relative;
  overflow: clip;                /* The image reveal is intentionally bounded */
  border-radius: 1.25rem;
}

.project-artwork img {
  display: block;                /* Removes the inline-image baseline gap */
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  transition: transform 600ms cubic-bezier(.2, .7, .2, 1);
}

.project-artwork:hover img {
  transform: scale(1.04);        /* The parent clips only the decorative zoom */
}
```

Do not put `overflow: hidden` on a large ancestor just to hide a single decorative edge. It may clip dropdowns, shadows, focus rings, or sticky descendants. Apply clipping to the smallest element that actually owns the visual boundary.

```css
/* Risky: a page shell can clip menus, focus rings, and sticky elements. */
.page-shell--fragile {
  overflow: hidden;
}

/* Better: isolate the crop to the media region. */
.project-media {
  overflow: clip;
  border-radius: 1rem;
}
```

**Gotcha:** `overflow-x: hidden` and `overflow-y: visible` do not always behave independently as people expect; when one axis is non-visible, the other axis may compute differently. For decorative clipping, `overflow: clip` can be more appropriate where supported, but test the actual browser support and behavior required by the project.

### 10. Inline formatting, replaced elements, and baseline gaps

Text and inline elements participate in line boxes. Images are replaced elements and, by default, inline images align to the text baseline. That leaves a small descender gap below the image, which often surprises developers building media cards. `display: block` removes the inline baseline relationship for images that should fill a container.

```css
.media-frame img {
  display: block;                /* No baseline gap beneath a standalone image */
  width: 100%;
  height: auto;
}
```

For a row of icons or small inline images aligned with text, inline behavior may be correct. For a full-width portfolio thumbnail, block behavior is generally the intended choice.

```css
.inline-tool-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  vertical-align: -0.12em;       /* Align the icon optically with the type */
}
```

**Gotcha:** `vertical-align` applies to inline-level and table-cell boxes, not as a general-purpose way to vertically center arbitrary block elements. Use flex or grid for component alignment.

### 11. `aspect-ratio`, replaced content, and media sizing

Images and video have intrinsic dimensions, but creative layouts often need a stable frame before the asset loads. `aspect-ratio` establishes a preferred width-to-height relationship. `object-fit: cover` fills the frame by cropping; `contain` preserves the entire asset and may leave empty space. The right choice depends on whether the image is decorative artwork or content that must be fully visible.

```html
<figure class="project-preview">
  <img
    src="project-dashboard.jpg"
    alt="A dashboard showing forecast trends and model confidence"
    width="1600"
    height="1200"
  >
</figure>
```

```css
.project-preview {
  margin: 0;
  aspect-ratio: 4 / 3;           /* Stable card geometry while the image loads */
  overflow: clip;
  background: #202027;
}

.project-preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;             /* Crop to preserve the art-directed frame */
}
```

Providing intrinsic `width` and `height` attributes helps the browser reserve space before loading. The CSS ratio can still control the presentation. For diagrams, screenshots with meaningful text, or product images that must remain entirely visible, use `object-fit: contain` or a content-driven height instead.

### 12. Borders, outlines, and visual size

Borders are part of the box and therefore affect `content-box` sizing; outlines are painted outside the border but do not take up layout space. This makes outlines useful for focus indicators and temporary debugging, but they should not replace borders when the design needs the edge to reserve space.

```css
.debug-boxes * {
  outline: 1px solid rgb(255 0 180 / 35%); /* Reveals geometry without shifting layout */
}

.action-button {
  border: 1px solid transparent; /* Reserves edge space before hover/focus */
  border-radius: 999px;
}

.action-button:focus-visible {
  outline: 3px solid #9ce8ff;
  outline-offset: 3px;           /* Visible focus without changing layout dimensions */
}
```

**Naive:** add a 2px border only on hover and wonder why nearby elements shift.

**Correct:** reserve the border in the default state and change its color, or use an outline/box-shadow for a visual effect that should not affect layout.

### 13. Debugging actual geometry in DevTools

The rendered box is the truth. When a layout looks wrong, inspect computed styles and the box-model diagram instead of making speculative edits. Check the element’s width, padding, border, margin, `box-sizing`, containing block, min/max constraints, and overflow. Temporarily outline the layout, then remove the debugging rule before shipping.

```css
/* Enable this temporarily while locating unexpected edges. */
html.debug-layout * {
  outline: 1px solid rgb(255 0 180 / 18%);
}
```

You can also log measurements when investigating a component that overflows at a specific viewport:

```js
const projectCard = document.querySelector(".project-card");

if (projectCard) {
  const styles = getComputedStyle(projectCard);
  const bounds = projectCard.getBoundingClientRect();

  // Compare the rendered border box with computed CSS values to locate the extra width.
  console.table({
    renderedWidth: bounds.width,
    cssWidth: styles.width,
    boxSizing: styles.boxSizing,
    paddingInline: `${styles.paddingLeft} + ${styles.paddingRight}`,
    borderInline: `${styles.borderLeftWidth} + ${styles.borderRightWidth}`,
    marginInline: `${styles.marginLeft} + ${styles.marginRight}`,
    scrollWidth: projectCard.scrollWidth,
    clientWidth: projectCard.clientWidth,
  });
}
```

`getBoundingClientRect().width` reports the rendered border-box dimension, including transforms. `offsetWidth` is also a border-box-like integer measurement but does not include transforms. `scrollWidth` can reveal content that extends beyond the visible inner area. Measurements should support a hypothesis, not replace understanding of the layout rules.

### 14. Creative use case: an editorial project grid that survives real content

A portfolio grid should retain visual rhythm when one title is long, an image has a different intrinsic size, or the layout moves from two columns to one. The reliable approach is to let grid own the columns, `gap` own inter-card spacing, padding own card interiors, and media frames own their aspect ratio.

```html
<section class="work-section" aria-labelledby="work-heading">
  <div class="work-section__intro">
    <p class="eyebrow">Selected work / 2024—2026</p>
    <h2 id="work-heading">Interfaces for intelligent products.</h2>
  </div>

  <div class="work-grid">
    <article class="work-card">
      <div class="work-card__media">
        <img src="model-insights.jpg" alt="Model evaluation dashboard with confidence visualizations" width="1600" height="1200">
      </div>
      <div class="work-card__body">
        <p class="eyebrow">AI / Data product</p>
        <h3>Model Insights</h3>
        <p>A clearer way to explore model behavior and communicate uncertainty.</p>
      </div>
    </article>

    <article class="work-card">
      <div class="work-card__media">
        <img src="spatial-interface.jpg" alt="Spatial product interface with layered translucent panels" width="1600" height="1200">
      </div>
      <div class="work-card__body">
        <p class="eyebrow">Creative technology</p>
        <h3>Spatial Systems for the Next Generation of Interfaces</h3>
        <p>An experimental interface combining depth, motion, and readable information.</p>
      </div>
    </article>
  </div>
</section>
```

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

.work-section {
  width: min(100% - 2rem, 82rem);
  margin-inline: auto;
  padding-block: clamp(4rem, 10vw, 9rem);
}

.work-section__intro {
  max-width: 48rem;
  margin-block-end: clamp(2rem, 5vw, 4rem);
}

.work-section__intro h2 {
  max-width: 14ch;
  margin: 0;
  font-size: clamp(2.5rem, 6vw, 5.5rem);
  line-height: 0.98;
  letter-spacing: -0.055em;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 2.5vw, 2rem);
}

.work-card {
  min-width: 0;                  /* Long text must not force a wider grid track */
  padding: clamp(0.75rem, 1.5vw, 1.25rem);
  border: 1px solid #34343b;
  border-radius: 1.25rem;
  background: #15151a;
}

.work-card__media {
  aspect-ratio: 4 / 3;
  overflow: clip;
  border-radius: 0.75rem;
  background: #24242b;
}

.work-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 700ms cubic-bezier(.2, .7, .2, 1);
}

.work-card:hover .work-card__media img {
  transform: scale(1.035);
}

.work-card__body {
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem 0.25rem 0.25rem;
}

.work-card__body > * {
  margin: 0;
}

.work-card__body h3 {
  font-size: clamp(1.25rem, 2vw, 2rem);
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.work-card__body p:last-child {
  max-width: 48ch;
  color: #b7b5c0;
  line-height: 1.6;
}

.eyebrow {
  color: #a5a1b1;
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 42rem) {
  .work-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

The important decisions are structural, not decorative: `border-box` makes card dimensions predictable; `minmax(0, 1fr)` and `min-width: 0` let columns shrink; `gap` defines repeated separation; zeroed child margins prevent surprise collapse; `aspect-ratio` reserves media geometry; and the media wrapper owns clipping. Those decisions make the art direction more durable when the content changes.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: The universal sizing baseline

**What it does:** establishes a consistent box-sizing rule so declared component widths include padding and border.

**When to use it:** at the beginning of almost every custom site or component system. When embedding a third-party widget, scope the rule if the widget depends on its own sizing assumptions.

```css
/* A stable global baseline for an application you control. */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;                     /* Remove the browser's default page inset */
  min-width: 20rem;              /* Set a deliberate minimum only if product requirements allow */
}
```

Do not set a minimum page width casually: a site should generally remain usable on narrow screens. If a 320px minimum would cause horizontal scrolling on supported devices, remove it and solve the actual component overflow.

### Pattern 2: A centered fluid container

**What it does:** creates a readable maximum width with responsive gutters and no fixed viewport assumptions.

**When to use it:** portfolio sections, article pages, dashboards, and marketing-site content.

```css
.container {
  width: min(100% - 2rem, 76rem);
  margin-inline: auto;
}

.container--reading {
  width: min(100% - 2rem, 44rem);
  margin-inline: auto;
}

.container--wide {
  width: min(100% - 3rem, 90rem);
  margin-inline: auto;
}
```

The subtraction preserves side gutters while the `min()` cap prevents content from becoming excessively wide. Use one shared container contract rather than giving every section unrelated widths.

### Pattern 3: A stack with explicit spacing

**What it does:** places a sequence of elements at a consistent distance without relying on collapsing margins.

**When to use it:** card content, form fields, article sections, feature descriptions, and reusable UI components.

```css
.stack {
  display: flex;
  flex-direction: column;
  gap: var(--stack-gap, 1rem);
}

.stack--tight {
  --stack-gap: 0.5rem;
}

.stack--loose {
  --stack-gap: 2rem;
}

.stack > * {
  margin-block: 0;               /* Makes gap the single source of sibling spacing */
}
```

```html
<div class="stack stack--loose">
  <p class="eyebrow">Case study</p>
  <h2>Building a better way to understand data.</h2>
  <p>Explore the design decisions behind the experience.</p>
  <a href="/work/data-explorer">Read the case study</a>
</div>
```

If the children need independent margins for a specific editorial reason, do not reset them indiscriminately. The pattern works best when the stack owns vertical rhythm.

### Pattern 4: A media frame with stable geometry

**What it does:** reserves space before an image loads and makes cropping intentional.

**When to use it:** project thumbnails, product cards, hero media, client galleries, and image reveal animations.

```css
.media-frame {
  aspect-ratio: 16 / 10;
  overflow: clip;
  background: #22222a;
}

.media-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.media-frame--portrait {
  aspect-ratio: 3 / 4;
}

.media-frame--uncropped img {
  object-fit: contain;
}
```

Always provide useful `alt` text for meaningful images. Use an empty `alt=""` only when the image is purely decorative and conveys no information that the surrounding content lacks.

### Pattern 5: Float containment without accidental clipping

**What it does:** creates a BFC so a legacy/editorial float contributes to its parent’s height without hiding shadows or menus.

**When to use it:** text wrapping around a figure, legacy content from a CMS, or a component that genuinely uses floats.

```css
.editorial-figure-layout {
  display: flow-root;
}

.editorial-figure-layout__image {
  float: inline-start;
  width: min(40%, 16rem);
  margin-inline-end: 1.25rem;
  margin-block-end: 0.75rem;
  border-radius: 0.75rem;
}
```

For a modern card layout, prefer grid or flex. Use this pattern when text is supposed to flow around the image, not merely because you want two columns.

### Pattern 6: A robust two-column content layout

**What it does:** prevents long content from forcing the grid wider than its container.

**When to use it:** project detail pages with a large visual and a narrower metadata column, dashboards, and editorial layouts.

```css
.case-study-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(15rem, 0.8fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: start;
}

.case-study-layout__main,
.case-study-layout__aside {
  min-width: 0;                  /* Allows long code, URLs, and headings to shrink */
}

@media (max-width: 48rem) {
  .case-study-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

If the aside must not become narrower than 15rem, the layout needs a breakpoint before the available width becomes too small. A `minmax()` minimum is a real constraint, not a guarantee that the layout will always fit.

### Pattern 7: Debug a suspected horizontal overflow

**What it does:** identifies elements whose rendered right edge extends past the viewport.

**When to use it:** mobile bugs, unexpected horizontal scrolling, a `100vw` section, or a flex/grid child with long content. Run this in the browser console during development.

```js
const overflowingElements = [...document.querySelectorAll("body *")].filter((element) => {
  const bounds = element.getBoundingClientRect();

  // Compare visual edges to the viewport; this is a diagnostic, not an automatic fix.
  return bounds.width > 0 && (bounds.left < -1 || bounds.right > window.innerWidth + 1);
});

console.table(
  overflowingElements.map((element) => ({
    element: element.tagName.toLowerCase(),
    className: typeof element.className === "string" ? element.className : "",
    left: Math.round(element.getBoundingClientRect().left),
    right: Math.round(element.getBoundingClientRect().right),
    width: Math.round(element.getBoundingClientRect().width),
  }))
);
```

This can report intentional full-bleed artwork or transformed elements, so inspect the results before changing CSS. The right fix is usually to correct the offending width, intrinsic minimum, margin, or transform—not to hide overflow on the entire page.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|----------------|-----|
| Adding padding to a `width: 100%` element and getting horizontal overflow | Default `content-box` adds padding and border outside the declared width | Use a `border-box` baseline or calculate the content width deliberately |
| Treating margin as part of `box-sizing` | The box-model diagram makes all dimensions look related | Remember that `border-box` includes padding and border, never margin |
| Using `width: 100vw` for every full-width section | It appears to mean “fill the available page” | Use `width: 100%` for normal sections; reserve `100vw` for intentional viewport breakout |
| Expecting adjacent vertical margins to add | Margin collapse is not the same as padding or `gap` | Use a flex/grid stack with `gap` for predictable repeated spacing |
| Fixing margin collapse with random `padding: 1px` | A tiny border/padding can interrupt collapse, masking the real layout contract | Use `display: flow-root`, grid, or flex when that behavior is intended |
| Using `overflow: hidden` only to contain floats | It historically doubles as a clearfix | Prefer `display: flow-root` unless clipping is actually required |
| Applying fixed `height` to text cards | A mockup has short placeholder copy | Prefer `min-height`, content-driven sizing, and layout alignment |
| Assuming `height: 100%` always fills a parent | Percentage sizing needs a resolvable containing-block dimension | Use grid/flex stretching or define a definite parent size |
| Ignoring `min-width: auto` on flex/grid items | The child’s intrinsic content size can prevent shrinking | Set `min-width: 0` when the design allows that item to shrink |
| Forgetting `display: block` on full-width images | Inline replaced elements align to a text baseline | Use `display: block` for standalone media |
| Using margins and `gap` for the same spacing relationship | Multiple systems make the final distance hard to predict | Assign spacing ownership: parent `gap`, component padding, or deliberate one-off margin |
| Changing border width on hover | The border changes the element’s layout dimensions | Reserve border space in the default state or use outline/box-shadow |
| Clipping the whole page to hide one image edge | The visual crop is applied at the wrong ancestor | Put `overflow: clip` on the media frame that owns the crop |
| Setting `min-width: 0` everywhere without checking intent | It becomes a cargo-cult fix for layout issues | Apply it to flex/grid items that should be allowed to shrink |
| Measuring only CSS `width` in DevTools | Computed width may not communicate the rendered border box in every sizing mode | Inspect the box-model panel and compare `getBoundingClientRect()`, `clientWidth`, and `scrollWidth` |
| Using `object-fit: cover` for meaningful screenshots | The crop can hide labels or important content | Use `contain`, a different ratio, or an image treatment that preserves the full content |
| Setting a global minimum page width without a requirement | Desktop layouts are tested more often than narrow devices | Fix component overflow and test the narrowest supported viewport |

---

## Mental Models

1. **Content → padding → border → margin** — the first three make the box; margin creates outside separation.
2. **`border-box` means “the visible box gets this width”** — padding and border consume space inside the declared dimension.
3. **Percentages need a reference box** — `width: 100%` means 100% of the relevant containing block, not automatically the viewport.
4. **Normal-flow vertical margins can merge** — if exact repeated spacing matters, let flex/grid `gap` own it.
5. **A formatting context is a layout boundary** — `flow-root` can contain floats and prevent relevant margin collapsing without clipping content.
6. **Intrinsic content can resist shrinking** — inspect `min-width`, long tokens, and grid track definitions before blaming the viewport.
7. **Clip at the smallest responsible ancestor** — constrain the artwork, not the whole page, so menus, focus rings, and sticky elements remain usable.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|-------------------|--------------|-------|
| Predictable global sizing | `*, *::before, *::after { box-sizing: border-box; }` | Standard baseline for most custom sites |
| Default `box-sizing` | `content-box` | Declared width excludes padding and border |
| `border-box` width calculation | Content + padding + border = declared width | Margin remains outside |
| Width with responsive gutters | `width: min(100% - 2rem, 76rem)` | Fluid until it reaches the maximum |
| Center a block container | `margin-inline: auto` | Requires a constrained width or max-width |
| Repeated child spacing | `display: grid/flex; gap: ...` | Does not collapse |
| Contain floats | `display: flow-root` | Creates a block formatting context |
| Avoid clipping while containing floats | `display: flow-root` | Prefer over overflow hacks |
| Prevent flex/grid item overflow | `min-width: 0` | Use where the child should be allowed to shrink |
| Text card with variable copy | `min-height` rather than fixed `height` | Allows content-driven growth |
| Stable image frame | `aspect-ratio: 4 / 3` | Pair with explicit image sizing |
| Fill and crop image frame | `width: 100%; height: 100%; object-fit: cover` | Crops edges to fill |
| Show entire image | `object-fit: contain` | May leave empty space in the frame |
| Remove inline image baseline gap | `display: block` | For standalone media |
| Decorative clipping | `overflow: clip` | Test support and sticky/scroll behavior |
| Scroll only when needed | `overflow: auto` | Creates a scroll container when overflow occurs |
| Debug box edges | `outline: 1px solid ...` | Does not reserve layout space |
| Rendered border-box measurement | `getBoundingClientRect().width` | Includes transforms |
| Inner visible width | `clientWidth` | Includes padding, excludes border and vertical scrollbar |
| Total scrollable content width | `scrollWidth` | Useful for detecting internal horizontal overflow |
| Border without hover layout shift | Reserve transparent border | Change border color rather than width |
| Browser default body inset | `body { margin: 0; }` | Remove only if the design needs a flush page edge |

---

## Build Challenge

### Build: The “Selected Work” Responsive Portfolio Grid

Create a responsive, editorial-style project grid for an AI/ML engineer’s portfolio. The goal is to prove that you understand box geometry—not merely that you can make a screenshot look good.

**Requirements**

1. Create a standalone HTML file with semantic markup for a “Selected Work” section containing at least four project cards. Use realistic project titles and descriptions; one title must be deliberately long.
2. Add a global `border-box` sizing baseline, then create a centered container using `width: min(100% - 2rem, 80rem)` and `margin-inline: auto`.
3. Build a two-column CSS Grid layout with responsive `gap`. Use `minmax(0, 1fr)` tracks and `min-width: 0` on cards so long content cannot force horizontal overflow.
4. Give each card padding, a border, and a background. Verify in DevTools that its declared width includes padding and border.
5. Use a media frame with `aspect-ratio`, `overflow: clip`, and an image that fills the frame with `object-fit: cover`. Use local images or stable image URLs and meaningful alt text.
6. Make card content a flex or grid stack with `gap`; remove default child margins where needed so the spacing system is predictable.
7. Use `min-height` only where it improves the visual rhythm. Do not hard-code a card height that clips longer content.
8. Add a narrow-screen breakpoint that changes the grid to one column without horizontal scrolling.
9. Include one demonstration of margin collapse in a separate test area. Then fix it using `display: flow-root` or replace the relationship with a `gap`-based stack. Leave comments explaining why the behavior changes.
10. Add a temporary debug mode that outlines every element. Test it, then ensure it is disabled by default.
11. Test at a wide desktop viewport, tablet width, and a narrow mobile width. Include a title long enough to expose intrinsic sizing problems.
12. In DevTools, inspect one card’s computed `box-sizing`, width, padding, border, and margin. Use `getBoundingClientRect()` and `scrollWidth` to investigate any unexpected overflow.

**Expected output / definition of success**

- The grid has two balanced columns on desktop and one column on narrow screens.
- Padding and borders do not make cards exceed their grid tracks.
- Long titles wrap without creating horizontal scrolling.
- Images preserve the intended frame ratio and crop only within their media frame.
- Card spacing is consistent because one layout mechanism owns sibling spacing.
- No content is clipped by a fixed height.
- Margin collapse is demonstrated and then handled intentionally.
- The page has no accidental horizontal overflow at the tested widths.
- You can explain, without guessing, which box a width applies to, why margins collapse in the test, and why the corrected layout is stable.

**Suggested focused-session plan:** spend 10 minutes on markup and the sizing baseline, 20 minutes on the grid and card geometry, 15 minutes on intrinsic sizing and responsive behavior, and 10 minutes on DevTools verification. Do not spend the session adding animations or decorative effects; this challenge is about making the layout rules predictable first.
