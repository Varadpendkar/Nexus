---
# SKILL: mobile-first-strategy
**Layer:** Layer 08 — Responsive Mobile
**Goal:** Design and implement resilient mobile-first interfaces by establishing the smallest practical layout as the default, then progressively enhancing it for wider viewports and richer input capabilities.

---

## Why This Matters (Senior Perspective)

A mobile-first strategy is a constraint-first design method, not a habit of writing a small-screen media query before a large-screen one. The smallest viewport exposes the hardest product decisions early: which content is essential, how navigation remains discoverable, whether actions fit within a thumb's reach, and how a page behaves when text wraps or the keyboard opens. If those decisions are postponed until the end, desktop assumptions tend to leak into the mobile layout: fixed-width cards overflow, hero copy becomes a wall of text, controls become too small, and important actions disappear below decorative content. The result is not merely an unattractive phone screenshot. It can be a failed lead form, a checkout that cannot be completed one-handed, or a portfolio case study that a client abandons before seeing the work.

Senior developers work from content priorities and constraints rather than device labels. They ask what the page must communicate, what can be stacked, what can be hidden without losing meaning, and which layout changes are justified by available space. They use intrinsic sizing, flexible grids, readable line lengths, and a small number of evidence-based breakpoints. They test the narrow default with real content before adding enhancements. A beginner often copies a familiar breakpoint such as `768px`, then patches each overflow with smaller font sizes or hidden elements. A senior instead finds the element whose sizing assumption is wrong and fixes the rule that caused the failure.

For creative studios and freelance work, mobile is often the first impression from a social link, search result, QR code, or client message. A carefully art-directed desktop landing page is not finished if its project gallery, pricing, booking form, or navigation fails on a phone. A mobile-first system also makes later tablet and desktop layouts easier to reason about: the base stylesheet expresses the essential composition, while wider breakpoints introduce columns, expanded navigation, and more generous spacing only when the content can support them. This reduces patchwork CSS and makes future content updates less risky.

---

## Core Concepts

### 1. Start With Content and Constraints, Not Device Names

A mobile-first page begins with the smallest useful information hierarchy. The goal is not to remove content until it fits; it is to decide what must be visible, what can flow naturally, and what can be progressively enhanced. Semantic HTML should describe the content independently of its presentation so that the same document can rearrange without duplicating information.

**Naive approach — design the desktop canvas first and shrink everything later:**

```html
<!-- This content order forces a phone user through decoration before the main offer. -->
<header class="studio-hero">
  <div class="hero-artwork" aria-hidden="true"></div>
  <div class="hero-copy">
    <p class="eyebrow">Independent digital studio</p>
    <h1>Digital experiences for ambitious teams</h1>
    <p>Strategy, design, and engineering in one focused partnership.</p>
    <a class="button" href="/contact">Discuss a project</a>
  </div>
</header>
```

**Correct approach — put the message and primary action first in the source order:**

```html
<header class="studio-hero">
  <div class="studio-hero__content">
    <p class="eyebrow">Independent digital studio</p>
    <h1>Digital experiences for ambitious teams</h1>
    <p>Strategy, design, and engineering in one focused partnership.</p>
    <a class="button" href="/contact">Discuss a project</a>
  </div>
  <figure class="studio-hero__visual" aria-label="Abstract studio artwork">
    <img src="/images/studio-orbit.webp" alt="Sculptural chrome forms against a deep blue background">
  </figure>
</header>
```

The corrected markup keeps the action early in the reading order. CSS can position the artwork beside the copy on wide screens without making the mobile experience depend on visual order alone.

```css
.studio-hero {
  display: grid;
  gap: 2rem;
  padding: clamp(1.25rem, 5vw, 5rem);
}

.studio-hero__content {
  max-width: 42rem;
  align-self: center;
}

.studio-hero__visual {
  margin: 0;
  min-width: 0; /* Grid items otherwise may preserve an oversized min-content width. */
}

.studio-hero__visual img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1.25rem;
}

@media (min-width: 58rem) {
  .studio-hero {
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.9fr);
    align-items: center;
  }
}
```

**Gotcha:** CSS `order` and grid placement can change visual order without changing keyboard or screen-reader order. Avoid creating a confusing sequence where the visual next step differs from the DOM order.

### 2. Use the Viewport Meta Tag Correctly

Mobile browsers need a viewport declaration so the layout viewport maps to the device's CSS viewport rather than a legacy wide virtual canvas. Without it, media queries and text sizing can behave as though the page were a desktop page scaled down.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#10111a">
    <title>Northstar Studio — Digital craft</title>
    <link rel="stylesheet" href="/styles/site.css">
  </head>
  <body>
    <main id="main-content">
      <h1>Digital craft for real-world momentum</h1>
      <p>Strategy, identity, and responsive web experiences.</p>
    </main>
  </body>
</html>
```

The viewport width is the device's CSS-pixel width; it is not necessarily the physical pixel count. `initial-scale=1` sets the initial zoom without disabling user zoom.

**Wrong:**

```html
<!-- Disabling zoom creates an accessibility barrier for users who need magnification. -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
```

**Right:**

```html
<!-- Preserve browser zoom so users can enlarge content when needed. -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Gotcha:** Do not set `maximum-scale=1` or `user-scalable=no` as a visual-polish shortcut. Users must be able to zoom, and browsers may ignore restrictive values in some circumstances anyway.

### 3. Make the Base Styles the Mobile Layout

Mobile-first CSS places the simplest layout in the unqualified rules. Media queries add capabilities as the viewport grows. This makes the default useful on narrow screens and keeps the cascade from becoming a collection of corrective overrides.

```css
.project-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.project-card {
  min-width: 0;
  overflow: clip;
  border-radius: 1rem;
  background: #171923;
}

.project-card__media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.project-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (min-width: 42rem) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 70rem) {
  .project-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2rem;
  }
}
```

The one-column base is not a temporary fallback; it is a complete layout. Tablet and desktop rules enhance the composition only when the cards have enough room.

**Naive approach:**

```css
/* Fixed desktop columns overflow on narrow screens before later patches run. */
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, 360px);
}
```

**Correct approach:**

```css
/* Intrinsic flexible tracks can shrink to the available container width. */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 1.25rem;
}
```

**Gotcha:** `minmax(0, 1fr)` is often safer than `1fr` alone when grid children contain long URLs, unbroken strings, or wide media. The zero minimum allows the track to shrink below its min-content size.

### 4. Choose Breakpoints Where the Content Needs Them

A breakpoint is a content threshold, not a label for a particular device. Use the narrowest width at which a layout begins to feel cramped, and change the composition at that point. Common values such as `40rem`, `48rem`, or `64rem` are starting points, not universal rules.

```css
.site-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.site-header__brand {
  flex: 1 1 10rem;
}

.site-header__links {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  width: 100%;
}

@media (min-width: 50rem) {
  .site-header {
    flex-wrap: nowrap;
    gap: 2rem;
  }

  .site-header__links {
    display: flex;
    justify-content: flex-end;
    width: auto;
    margin-left: auto;
  }
}
```

The breakpoint reflects the moment when the brand and links can share a row comfortably. If the brand name or navigation labels change, test the threshold again.

**Wrong:** Add a breakpoint at every device width found in a device list, even when the content already works.

**Right:** Resize the viewport slowly, identify the first point where the composition fails, then introduce the smallest number of breakpoints that resolves the failure.

**Gotcha:** Browser zoom and user font settings can change how much content fits at a given CSS viewport. A breakpoint that looks perfect at one zoom level can still expose a cramped header at another.

### 5. Build Fluid Type and Spacing Without Losing Limits

Fluid values reduce abrupt jumps between breakpoints, but every fluid rule needs sensible minimum and maximum values. `clamp(minimum, preferred, maximum)` lets the preferred value respond to viewport width while preserving usable bounds.

```css
:root {
  --page-gutter: clamp(1rem, 4vw, 4rem);
  --section-space: clamp(3rem, 8vw, 8rem);
  --headline-size: clamp(2.25rem, 8vw, 6.5rem);
}

.page-section {
  padding-inline: var(--page-gutter);
  padding-block: var(--section-space);
}

.page-section h1 {
  max-width: 12ch;
  font-size: var(--headline-size);
  line-height: 0.98;
  letter-spacing: -0.045em;
  text-wrap: balance;
}
```

The minimum keeps small screens readable; the maximum prevents a huge monitor from creating oversized typography. `max-width` in character units limits the headline measure rather than tying it to a device width.

**Naive approach:**

```css
/* A raw viewport unit can make type too tiny on narrow screens and huge on wide ones. */
.page-title {
  font-size: 8vw;
}
```

**Correct approach:**

```css
/* The clamp limits remain readable at both ends of the viewport range. */
.page-title {
  font-size: clamp(2.25rem, 6vw + 0.5rem, 5.75rem);
}
```

**Gotcha:** `vw` responds to the viewport, not to the available width of a nested component. If the title sits inside a narrow sidebar, container queries or a bounded type scale may be more appropriate.

### 6. Prevent Horizontal Overflow at Its Source

Horizontal scrolling is often a symptom of a minimum-size assumption: a fixed-width child, a long token, an image with intrinsic dimensions, or a grid track that cannot shrink. Hiding overflow on `body` can conceal the bug while cutting off interactive content.

```css
.case-study-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}

.case-study-layout > * {
  min-width: 0;
}

.case-study__image {
  display: block;
  width: 100%;
  height: auto;
}

.case-study__url {
  overflow-wrap: anywhere;
}

@media (min-width: 64rem) {
  .case-study-layout {
    grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 0.8fr);
  }
}
```

This fixes the sizing chain rather than suppressing visible overflow. `overflow-wrap: anywhere` is useful for long URLs and identifiers that must remain readable.

**Wrong:**

```css
/* This can hide a menu, focus ring, or form control that extends beyond the viewport. */
body {
  overflow-x: hidden;
}
```

**Right:**

```css
/* Constrain the actual layout and let media scale with its container. */
main {
  width: 100%;
  min-width: 0;
}

main img,
main video,
main canvas {
  max-width: 100%;
}
```

**Gotcha:** A deliberate horizontal carousel is not the same as accidental page overflow. Scope scrolling to the gallery and give it visible affordances rather than disabling horizontal movement globally.

### 7. Design Touch Targets and Spacing for Real Fingers

A mobile layout must be operable without precise pointer control. Small icon-only controls packed together can cause wrong taps, especially in navigation, image galleries, and close buttons. WCAG 2.2 includes a 24-by-24 CSS-pixel minimum target-size criterion with exceptions; a 44-by-44 CSS-pixel target is a useful practical design goal for common touch actions.

```html
<nav class="project-actions" aria-label="Project actions">
  <a class="project-actions__link" href="/work/identity">View identity project</a>
  <button class="project-actions__save" type="button" aria-label="Save identity project">
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"></path>
    </svg>
  </button>
</nav>
```

```css
.project-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.project-actions__link,
.project-actions__save {
  min-height: 2.75rem;
}

.project-actions__save {
  display: inline-grid;
  place-items: center;
  width: 2.75rem;
  flex: 0 0 2.75rem;
  border: 0;
  border-radius: 50%;
  background: #282b3a;
  color: white;
  cursor: pointer;
}

.project-actions__save svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}

.project-actions__save:focus-visible {
  outline: 3px solid #8ab4ff;
  outline-offset: 3px;
}
```

**Gotcha:** Do not rely on hover to reveal an essential action. Touchscreens may not have hover, and hybrid devices may have both touch and a pointer. Keep core actions visible or make them discoverable through an explicit control.

### 8. Make Forms Work With the On-Screen Keyboard

The virtual keyboard changes the visible area and can obscure submit buttons, validation messages, and focused fields. Forms should use native input types, labels, autocomplete hints, and normal document flow rather than fixed-position panels that assume the viewport never changes.

```html
<section class="contact-panel" aria-labelledby="contact-heading">
  <h2 id="contact-heading">Tell us about your project</h2>
  <form action="/contact" method="post">
    <label for="contact-email">Work email</label>
    <input id="contact-email" name="email" type="email" autocomplete="email" required>

    <label for="project-budget">Estimated budget</label>
    <select id="project-budget" name="budget" required>
      <option value="">Choose a range</option>
      <option value="5k-10k">$5,000–$10,000</option>
      <option value="10k-25k">$10,000–$25,000</option>
      <option value="25k-plus">$25,000+</option>
    </select>

    <button type="submit">Send project details</button>
  </form>
</section>
```

```css
.contact-panel {
  width: min(100% - 2rem, 42rem);
  margin-inline: auto;
  padding-block: 2rem;
}

.contact-panel form {
  display: grid;
  gap: 0.75rem;
}

.contact-panel input,
.contact-panel select,
.contact-panel button {
  width: 100%;
  min-height: 2.75rem;
  font: inherit;
}

.contact-panel input,
.contact-panel select {
  padding: 0.65rem 0.75rem;
}

.contact-panel button {
  margin-top: 0.75rem;
}
```

The form stays in normal flow, so the browser can scroll the focused field into view. On the server, validate all submitted data; HTML validation improves the client experience but is not a security boundary.

**Gotcha:** `100vh` can describe a larger viewport than the currently visible area in mobile browsers with collapsing browser chrome. Do not pin a form's only submit button to the bottom of a fixed-height panel without testing keyboard-open states.

### 9. Use Images and Media That Adapt to the Container

Large hero images and portfolio renders are common causes of slow mobile pages. Responsive image selection lets the browser download a suitable asset rather than always receiving the largest desktop file. CSS should constrain the display size, while `srcset` and `sizes` communicate available source variants.

```html
<figure class="work-card__media">
  <img
    src="/images/atlas-brand-960.webp"
    srcset="/images/atlas-brand-480.webp 480w,
            /images/atlas-brand-960.webp 960w,
            /images/atlas-brand-1440.webp 1440w"
    sizes="(min-width: 70rem) 30vw, (min-width: 42rem) 45vw, 100vw"
    width="1440"
    height="1080"
    alt="Atlas outdoor brand identity displayed on packaging and a trail map"
    loading="lazy"
    decoding="async">
</figure>
```

```css
.work-card__media {
  margin: 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #202331;
}

.work-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Explicit dimensions help the browser reserve layout space before the image loads. Lazy-load below-the-fold images, but do not automatically lazy-load the primary above-the-fold LCP image; doing so can delay the most important visual.

**Gotcha:** The `sizes` attribute must describe the image's rendered CSS width, not merely the file's pixel width. Incorrect `sizes` values can make the browser choose a source that is too large or too small.

### 10. Keep Navigation Useful at Narrow Widths

A navigation pattern should preserve access to the site's important destinations without squeezing desktop links into a tiny row. A compact menu is appropriate when the links cannot fit, but the menu trigger needs an accessible name, state, and reliable keyboard behavior.

```html
<header class="site-header">
  <a class="site-header__brand" href="/" aria-label="Northstar Studio home">Northstar</a>
  <button class="site-header__menu-button" type="button"
          aria-expanded="false" aria-controls="primary-navigation">
    <span class="site-header__menu-label">Menu</span>
  </button>
  <nav id="primary-navigation" class="site-header__navigation" aria-label="Primary">
    <a href="/work">Work</a>
    <a href="/studio">Studio</a>
    <a href="/journal">Journal</a>
    <a href="/contact">Contact</a>
  </nav>
</header>
```

```css
.site-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem var(--page-gutter, 1rem);
}

.site-header__brand {
  margin-right: auto;
  font-weight: 750;
}

.site-header__menu-button {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding-inline: 1rem;
}

.site-header__navigation {
  display: grid;
  gap: 0.25rem;
  width: 100%;
}

@media (min-width: 52rem) {
  .site-header__menu-button {
    display: none;
  }

  .site-header__navigation {
    display: flex;
    width: auto;
    margin-left: auto;
    gap: 1.25rem;
  }
}
```

This is the structural and styling foundation only. A real collapsed menu also needs JavaScript to toggle `hidden` or a state class, update `aria-expanded`, close on Escape, and define focus behavior. Do not ship a button that visually says “Menu” but does nothing.

**Gotcha:** CSS alone can hide links but cannot provide a complete interactive menu state. If JavaScript fails, decide whether the navigation should remain available by default or provide a progressive-enhancement strategy.

### 11. Prefer Intrinsic Layout Over Device-Specific Widths

`min()`, `max()`, `clamp()`, flexible tracks, and content-based widths let components respond to available space rather than a list of assumed devices. This is particularly valuable for reusable cards embedded in different pages.

```css
.content-shell {
  width: min(100% - 2rem, 78rem);
  margin-inline: auto;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: clamp(1rem, 2.5vw, 2rem);
}

.service-card {
  min-width: 0;
  padding: clamp(1rem, 2.5vw, 2rem);
  border: 1px solid #343746;
  border-radius: 1.25rem;
}

.service-card h3 {
  overflow-wrap: anywhere;
}
```

**Wrong:** `width: 375px` on every card because the designer preview was 375 pixels wide.

**Right:** Constrain the overall reading width and let the grid calculate columns from available room.

```css
/* This component can live in a narrow sidebar or a wide page without a device query. */
.quote-card {
  width: 100%;
  max-width: 34rem;
  margin-inline: auto;
  padding: clamp(1rem, 3vw, 2rem);
}
```

**Gotcha:** `auto-fit` collapses empty tracks; `auto-fill` keeps them. Use `auto-fit` when existing cards should stretch to use the row, and `auto-fill` when maintaining the track rhythm is intentional.

### 12. Support Reduced Motion and Input Differences

Mobile-first does not mean touch-only. A responsive interface may run on a touchscreen laptop, a phone with a keyboard, or a desktop with a trackpad. Use feature queries such as `hover` and `pointer` for optional interaction enhancements, and respect the user's reduced-motion preference.

```css
.project-card__image {
  transition: transform 220ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .project-card:hover .project-card__image {
    transform: scale(1.035);
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card__image {
    transition: none;
  }

  .scroll-reveal {
    animation: none;
    transform: none;
  }
}
```

```css
/* The link remains understandable without hover or motion. */
.project-card__link {
  display: block;
  color: inherit;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.2em;
}

.project-card__link:focus-visible {
  outline: 3px solid #8ab4ff;
  outline-offset: 4px;
}
```

**Gotcha:** `hover: none` and `pointer: coarse` describe a primary input capability, not a guarantee about every connected device. Keep essential functionality available to all input types.

### 13. Use Container Queries for Components That Travel

Viewport breakpoints answer, “How wide is the browser?” Container queries answer, “How much space does this component actually have?” They are useful for reusable pricing cards, media objects, and case-study modules that may appear in a full-width section or a narrow sidebar.

```css
.feature-list {
  container-type: inline-size;
}

.feature-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

@container (min-width: 34rem) {
  .feature-card {
    grid-template-columns: minmax(8rem, 0.7fr) minmax(0, 1.3fr);
    align-items: center;
  }
}
```

```html
<section class="feature-list" aria-label="Studio services">
  <article class="feature-card">
    <img src="/images/strategy-workshop.webp"
         width="800" height="600"
         alt="Design team arranging research notes on a wall">
    <div>
      <h3>Strategy and direction</h3>
      <p>Turn business goals into a focused digital experience.</p>
    </div>
  </article>
</section>
```

**Gotcha:** A container query needs a query container established on an ancestor. The queried element cannot generally use its own size as the container for its own styles. Test component behavior in its actual parent layout.

### 14. Verify the Narrow Layout With Real Content

Responsive behavior is a property of the content, font metrics, layout rules, and viewport together. Test long headings, translated labels, missing images, validation errors, and user zoom—not only the ideal sample copy. A 320 CSS-pixel viewport remains a useful stress test even when most current devices are wider.

```html
<article class="case-study-card">
  <figure class="case-study-card__media">
    <img src="/images/field-notes.webp"
         width="1200" height="900"
         alt="Field Notes editorial website shown on a laptop and mobile phone">
  </figure>
  <div class="case-study-card__body">
    <p class="case-study-card__category">Editorial platform</p>
    <h3>Field Notes: a multilingual publication system for distributed teams</h3>
    <p>Designing a flexible reading experience for long-form stories and translated editions.</p>
    <a href="/work/field-notes">Read the case study</a>
  </div>
</article>
```

```css
.case-study-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.case-study-card__media {
  margin: 0;
  min-width: 0;
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.case-study-card__media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.case-study-card__body {
  min-width: 0;
}

.case-study-card__body h3 {
  max-width: 22ch;
  overflow-wrap: anywhere;
}

@media (min-width: 48rem) {
  .case-study-card {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: center;
    gap: 2rem;
  }
}
```

**Gotcha:** A layout that fits at 390px with short demo copy may fail at 320px when the title wraps to five lines. Always test the longest realistic content, not only the shortest card.

---

## Relevant Patterns

### Pattern 1: Content-First Portfolio Grid

**What it does:** Starts as a single-column project list, then adds columns when card width supports useful image detail and readable descriptions.

**When to use it:** Portfolio homepages, agency work indexes, editorial collections, or any repeated card set whose count and content may change.

```html
<section class="selected-work" aria-labelledby="selected-work-title">
  <div class="selected-work__intro">
    <p class="eyebrow">Selected projects</p>
    <h2 id="selected-work-title">Work built around a clear point of view</h2>
  </div>
  <div class="selected-work__grid">
    <article class="work-card">
      <a href="/work/atlas" class="work-card__link">
        <img src="/images/atlas-work.webp" width="1200" height="900"
             alt="Atlas brand identity applied to outdoor equipment">
        <h3>Atlas Outdoor</h3>
        <p>Identity system and commerce experience</p>
      </a>
    </article>
    <article class="work-card">
      <a href="/work/monograph" class="work-card__link">
        <img src="/images/monograph-work.webp" width="1200" height="900"
             alt="Monograph editorial layout with oversized typography">
        <h3>Monograph</h3>
        <p>Digital publication and reading system</p>
      </a>
    </article>
  </div>
</section>
```

```css
.selected-work {
  padding: var(--section-space, 4rem) var(--page-gutter, 1rem);
}

.selected-work__intro {
  max-width: 44rem;
  margin-bottom: 2rem;
}

.selected-work__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
}

.work-card,
.work-card__link {
  min-width: 0;
}

.work-card__link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.work-card img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 1rem;
}

@media (min-width: 44rem) {
  .selected-work__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
  }
}

@media (min-width: 76rem) {
  .selected-work__grid {
    gap: 2.5rem;
  }
}
```

**Gotcha:** A grid breakpoint should be tested against the actual card minimum width. Do not force three columns merely because the screen is “desktop”; a narrow browser window on a laptop can still need two columns.

### Pattern 2: Progressive Enhancement for Navigation

**What it does:** Keeps navigation links available in the document and adds a collapsed menu interaction only when the narrow layout requires it.

**When to use it:** Small studio sites with a handful of top-level links. For large information architectures, consider a dedicated navigation design rather than forcing every destination into a small-screen drawer.

```html
<header class="site-header" data-navigation>
  <a href="/" class="site-header__brand">Northstar Studio</a>
  <button class="site-header__toggle" type="button"
          aria-controls="site-navigation" aria-expanded="false">
    <span class="site-header__toggle-label">Open menu</span>
  </button>
  <nav id="site-navigation" class="site-navigation" aria-label="Main navigation">
    <a href="/work">Work</a>
    <a href="/studio">Studio</a>
    <a href="/journal">Journal</a>
    <a href="/contact">Contact</a>
  </nav>
</header>
```

```css
.site-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.site-header__toggle {
  min-width: 2.75rem;
  min-height: 2.75rem;
  margin-left: auto;
}

.site-navigation {
  display: grid;
  gap: 0.5rem;
  width: 100%;
}

.site-navigation a {
  padding-block: 0.65rem;
}

@media (min-width: 52rem) {
  .site-header__toggle {
    display: none;
  }

  .site-navigation {
    display: flex;
    width: auto;
    margin-left: auto;
    gap: 1.25rem;
  }
}
```

```js
const navigationRoot = document.querySelector("[data-navigation]");

if (navigationRoot) {
  const menuButton = navigationRoot.querySelector(".site-header__toggle");
  const navigation = navigationRoot.querySelector("#site-navigation");
  const menuLabel = menuButton.querySelector(".site-header__toggle-label");

  function setMenuOpen(isOpen) {
    // Synchronize the accessible state and visible label so assistive technology receives the same state as sighted users.
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuLabel.textContent = isOpen ? "Close menu" : "Open menu";
    navigation.hidden = !isOpen;
  }

  // Start closed only after the enhancement is available; without JS, the links remain in the page.
  setMenuOpen(false);

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    setMenuOpen(!isOpen);
  });

  navigation.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
}
```

**Gotcha:** If CSS hides the navigation at a breakpoint while JavaScript leaves `hidden` set, resizing from mobile to desktop can keep the desktop navigation invisible. Reset state on breakpoint changes or use a menu implementation that deliberately handles viewport transitions.

### Pattern 3: Responsive Contact Form With Validation Feedback

**What it does:** Uses one-column fields by default and introduces a two-column grouping only where labels and inputs remain comfortable. Error messages are associated with the affected field.

**When to use it:** Project enquiry forms, booking requests, newsletter preferences, or lead-generation pages.

```html
<form class="project-form" action="/contact" method="post">
  <div class="project-form__field">
    <label for="project-name">Your name</label>
    <input id="project-name" name="name" autocomplete="name" required>
  </div>
  <div class="project-form__field">
    <label for="project-email">Email address</label>
    <input id="project-email" name="email" type="email"
           autocomplete="email" aria-describedby="project-email-help" required>
    <p id="project-email-help" class="field-help">We will use this to reply to your enquiry.</p>
  </div>
  <div class="project-form__field project-form__field--wide">
    <label for="project-brief">What are you building?</label>
    <textarea id="project-brief" name="brief" rows="5" required></textarea>
  </div>
  <button type="submit">Send enquiry</button>
</form>
```

```css
.project-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
}

.project-form__field {
  display: grid;
  align-content: start;
  gap: 0.5rem;
  min-width: 0;
}

.project-form input,
.project-form textarea {
  width: 100%;
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid #777b8d;
  border-radius: 0.5rem;
  font: inherit;
}

.project-form button {
  min-height: 2.75rem;
  justify-self: start;
  padding-inline: 1.25rem;
}

@media (min-width: 48rem) {
  .project-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .project-form__field--wide,
  .project-form > button {
    grid-column: 1 / -1;
  }
}
```

**Gotcha:** Never communicate a form error only by changing a border color. Provide text, associate it with the field, and move focus or announce the summary when validation blocks submission.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Starting with a fixed three-column grid | Desktop composition is treated as the source of truth. | Make the base grid one column and add columns only when the content can support them. |
| Adding `overflow-x: hidden` to `body` | The developer hides symptoms instead of finding the oversized child. | Inspect the document width, then fix fixed widths, min-content tracks, long tokens, or unscaled media. |
| Using `width: 100vw` for every section | The viewport width is confused with the containing block width. | Use `width: 100%` inside the page shell; reserve `100vw` for intentional viewport-wide elements. |
| Disabling zoom in the viewport meta tag | A fixed screenshot is prioritized over user magnification. | Remove `maximum-scale=1` and `user-scalable=no`; preserve browser zoom. |
| Picking breakpoints from a device list | Device categories seem more predictable than content behavior. | Resize the layout and add a breakpoint at the first real content failure. |
| Using `font-size: 8vw` without bounds | Fluid typography is mistaken for unrestricted scaling. | Wrap the preferred value in `clamp()` with tested minimum and maximum sizes. |
| Hiding core actions on touch | The interface assumes hover exists. | Keep primary actions visible and use hover only as an optional enhancement. |
| Making icon buttons too small | Visual compactness is valued over touch accuracy. | Give important controls a practical 44px target and maintain spacing between neighboring targets. |
| Positioning a submit button at fixed viewport bottom | The browser viewport is assumed to be stable when the keyboard opens. | Keep the form in normal flow and test the focused-field and keyboard-open states. |
| Lazy-loading the hero image | `loading="lazy"` is applied indiscriminately. | Prioritize the main above-the-fold/LCP image and lazy-load offscreen media. |
| Omitting intrinsic image dimensions | Layout space is not reserved while assets load. | Include accurate `width` and `height`, or reserve space with a known `aspect-ratio`. |
| Using CSS visual order to contradict DOM order | The design mockup is followed without considering reading order. | Keep meaningful source order aligned with keyboard and screen-reader sequence. |
| Assuming `min-width: 0` is unnecessary | Grid and flex min-content sizing is invisible until content overflows. | Apply `min-width: 0` to shrinkable grid/flex children that contain long or wide content. |
| Testing only the default copy | Real titles, translations, and validation messages are longer. | Include longest realistic strings, empty states, errors, and 320px viewport checks in the test pass. |
| Treating tablet as one fixed device size | The design is mapped to device names instead of available space. | Use fluid tracks and content-driven thresholds; test both narrow and wide browser windows. |
| Forgetting the JavaScript state of a collapsed menu | CSS hides links, but state does not respond to resize or keyboard input. | Synchronize `aria-expanded`, visibility, Escape behavior, focus return, and breakpoint transitions. |

---

## Mental Models

1. **Smallest useful composition:** Start with the narrowest viewport and keep the complete primary task usable before adding visual complexity.
2. **Breakpoints are content decisions:** A media query belongs where content stops fitting comfortably, not where a device category begins.
3. **Enhance, do not repair:** Base CSS should be a complete layout; wider rules add columns and breathing room instead of undoing desktop assumptions.
4. **Overflow is evidence:** A horizontal scrollbar usually reveals a sizing constraint, not a need to hide the scrollbar.
5. **Input is plural:** Touch, mouse, keyboard, zoom, and assistive technology can coexist; essential actions must not depend on one modality.
6. **Viewport is not container:** Viewport units describe the browser window; percentages and container queries describe local layout constraints.
7. **Real content is a test instrument:** Long copy, missing assets, and errors reveal responsive weaknesses faster than polished placeholder-length content.

---

## Quick Reference

| Situation | Recommended starting point | Why / notes |
|---|---|---|
| Viewport setup | `width=device-width, initial-scale=1` | Maps the layout viewport to the device CSS viewport while preserving zoom. |
| Mobile base layout | One column | Avoids forcing desktop density onto a narrow screen. |
| Two-column breakpoint | Content-driven `min-width` query | Introduce columns when cards and text have enough room. |
| Flexible grid track | `minmax(0, 1fr)` | Allows tracks to shrink below min-content size. |
| Repeated card grid | `repeat(auto-fit, minmax(min(100%, 17rem), 1fr))` | Adapts columns to container width. |
| Fluid headline | `clamp(2.25rem, 6vw, 5.75rem)` | Bounded scaling avoids extreme sizes. |
| Page gutter | `clamp(1rem, 4vw, 4rem)` | Adds space gradually while retaining minimum and maximum values. |
| Centered content shell | `width: min(100% - 2rem, 78rem)` | Gives narrow screens a gutter and wide screens a readable maximum. |
| Shrinkable grid child | `min-width: 0` | Prevents long content from forcing a track wider than the container. |
| Long URLs | `overflow-wrap: anywhere` | Allows a long unbroken token to wrap. |
| Responsive image | `width: 100%; height: auto` | Keeps image dimensions tied to available width. |
| Cropped media tile | `aspect-ratio` plus `object-fit: cover` | Reserves consistent media shape without distortion. |
| Image source choice | `srcset` and accurate `sizes` | Lets the browser choose a suitable image resource. |
| Below-the-fold images | `loading="lazy"` | Avoids downloading offscreen assets too early. |
| Main hero image | Usually eager loading; consider `fetchpriority="high"` where justified | Do not delay the likely LCP asset with lazy loading. |
| Touch target | Practical target around 44 × 44 CSS px | Easier to operate than tiny icon controls. |
| Keyboard focus | `:focus-visible` | Keeps keyboard focus visually apparent. |
| Hover enhancement | `@media (hover: hover) and (pointer: fine)` | Avoids making touch interaction depend on hover. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | Respects the user's system motion preference. |
| Component-specific layout | `container-type: inline-size` and `@container` | Responds to component width rather than browser width. |
| Avoiding viewport clipping | Normal flow and tested `min-height` | Better than fixed-height panels that fail when the keyboard opens. |
| Responsive media | `img, video, canvas { max-width: 100%; }` | Prevents common media from exceeding the content box. |
| CSS-only menu | Not sufficient for interactive state | A real toggle needs state, accessible labeling, and keyboard behavior. |
| Mobile overflow test | 320 CSS px plus zoom and long content | Exposes fragile fixed widths and unbreakable strings. |
| Desktop validation | Test narrow desktop windows too | A desktop device can have a small viewport due to split-screen or zoom. |
| Source order | Meaningful DOM order first | Visual repositioning must not create a confusing reading sequence. |

---

## Build Challenge

### The “Northstar Studio” Mobile-First Portfolio Landing Page

Build a responsive homepage for a fictional independent creative studio. It must be a complete narrow-screen experience before any desktop enhancements are added.

**Requirements**

1. Create a semantic document with a viewport meta tag, a skip link, a `header`, a labeled `nav`, a `main`, at least two `section` elements, and a `footer`.
2. Build a hero section with a clear headline, supporting copy, one primary action, and an art-directed image; keep the headline and action before decorative content in the DOM.
3. Make the project grid one column by default, two columns at a content-driven breakpoint, and three columns only when each card retains a useful minimum width.
4. Use at least three fluid tokens with `clamp()` for page gutters, section spacing, and headline size; explain why each has its particular minimum and maximum.
5. Use responsive images with `srcset`, `sizes`, accurate intrinsic dimensions, meaningful alt text, and lazy loading only for below-the-fold images.
6. Add a contact form with labels, native input types, autocomplete values, required-field feedback, and a submit button that remains reachable while the on-screen keyboard is open.
7. Make every essential action available without hover, add visible `:focus-visible` styling, and verify that zoom is not disabled.
8. Use `minmax(0, 1fr)` or equivalent shrink-safe tracks and solve any long-title or long-URL overflow without globally hiding horizontal overflow.
9. Implement a small-screen navigation toggle with synchronized `aria-expanded`, a meaningful label, Escape handling, and a resize strategy that restores desktop navigation correctly.
10. Test the page at 320px, 375px, 768px, 1024px, and 1440px, plus 200% browser zoom, long project titles, a missing image, and a form validation error.

**Expected output / definition of success**

- At 320 CSS px, no unintended page-level horizontal scrolling occurs and every primary action is reachable.
- At 375px, the hero copy remains readable, the image scales without distortion, and project cards use one column.
- At the tablet and desktop widths, columns appear only when content has enough room; cards do not become narrower than their tested minimum.
- Keyboard-only users can reach all navigation links, form controls, and actions, with a visible focus indicator and a predictable reading order.
- The page remains usable at 200% zoom, with no disabled browser magnification or clipped primary content.
- The browser chooses an appropriate responsive image source and reserves image space before loading.
- The navigation toggle accurately reports its state, closes with Escape, and does not leave desktop links hidden after resizing.
- The form's labels, help text, and validation feedback remain associated with their controls.
- A test log records the viewport sizes, observed failures, root causes, and exact CSS or markup changes used to resolve them.

**Suggested focused-session plan:** 15 minutes for semantic structure and content hierarchy; 25 minutes for mobile base styles; 20 minutes for fluid sizing and breakpoints; 20 minutes for navigation and form behavior; 20 minutes for image loading, keyboard checks, zoom, and viewport testing.

**Definition of Done:** The page passes the listed viewport and keyboard checks without a global overflow mask, fixed desktop-width assumptions, hover-only actions, or disabled zoom. Every fix addresses the underlying sizing or interaction rule rather than hiding the symptom.
