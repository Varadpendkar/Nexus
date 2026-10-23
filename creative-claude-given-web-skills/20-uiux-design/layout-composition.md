# SKILL: layout-composition
**Layer:** 43 — UI/UX Design
**Goal:** Compose responsive pages and interface regions using grids, alignment, scale, whitespace, and content-aware structure so the visual story remains clear across screen sizes.

---

## Why This Matters (Senior Perspective)

Layout composition decides how content competes, relates, and flows. A layout is not simply a set of boxes arranged on a screen: it is a reading path, a priority system, and a contract between content and available space. In production, weak composition shows up as a hero whose headline collides with its image, cards that become unreadable at tablet widths, dashboards that force horizontal scrolling, and mobile pages where the call to action appears after a huge decorative block. Those failures often survive a desktop-only review and surface only after real content, translation, browser zoom, or a client's last-minute copy change.

A beginner commonly starts with a screenshot in mind and reaches for fixed widths, absolute positioning, and arbitrary margins until the page resembles the reference. A senior designer or frontend engineer starts with content relationships and constraints: which elements belong together, what needs more visual weight, what can wrap, what must remain adjacent, and at what width the current composition stops working. They choose layout primitives according to the relationship—Grid for two-dimensional placement, Flexbox for a one-dimensional flow, normal document flow for content, and positioning only for genuine overlays. They test the layout at intermediate widths, with long text, and with the browser zoomed, because responsive quality is about preserving meaning, not merely avoiding overflow.

For portfolio and freelance work, composition is often the difference between a page that looks like a template and one that feels art-directed. A strong case study can pair a concise narrative with a product image, use a deliberate rhythm between full-width visuals and narrow text, and guide a client from problem to outcome without turning every section into the same card grid. AI product interfaces also need careful composition: a recommendation, evidence, confidence or limitations, and the next action must be arranged so users can understand the answer without overlooking its caveats. Mastering composition gives you a repeatable way to build expressive layouts that remain practical, accessible, and robust when the design meets real content.

---

## Core Concepts

### 1. Compose Around Content Relationships

A layout should express the relationship between its pieces before it expresses visual style. Start by grouping content into meaningful regions: page introduction, primary content, supporting detail, and next action. Use semantic HTML to communicate the structure, then choose CSS layout rules that support that structure.

```html
<main class="case-study">
  <header class="case-study__intro">
    <p class="case-study__eyebrow">Selected work · AI product</p>
    <h1>Making health-plan comparisons easier to understand</h1>
    <p class="case-study__summary">
      A recommendation experience that brings costs, coverage, and trade-offs into one clear view.
    </p>
  </header>

  <figure class="case-study__hero">
    <img src="/images/health-plan-comparison.webp"
         alt="Comparison interface showing plan costs and coverage details">
    <figcaption>Plan details are grouped so people can compare the trade-offs.</figcaption>
  </figure>

  <section class="case-study__outcome" aria-labelledby="outcome-title">
    <h2 id="outcome-title">The outcome</h2>
    <p>People can scan the recommendation first and inspect supporting details when needed.</p>
  </section>
</main>
```

```css
.case-study {
  width: min(100% - 3rem, 76rem);
  margin-inline: auto;
}

.case-study__intro {
  max-width: 52rem;
  padding-block: clamp(3rem, 8vw, 7rem) 2rem;
}

.case-study__intro h1 {
  max-width: 15ch;
  margin: 0;
  font-size: clamp(2.6rem, 6vw, 5.4rem);
  line-height: 0.99;
  letter-spacing: -0.05em;
}

.case-study__summary {
  max-width: 42rem;
  margin-block: 1.5rem 0;
  color: #526173;
  font-size: 1.15rem;
  line-height: 1.7;
}

.case-study__hero {
  margin: 0;
}

.case-study__hero img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1.25rem;
}

.case-study__hero figcaption {
  margin-top: 0.75rem;
  color: #526173;
  font-size: 0.875rem;
}
```

The markup describes an introduction, a meaningful image, and a result section. The CSS creates a narrow text measure and a wider visual region without forcing every section into the same width.

**Naive approach:** Place every section inside a generic wrapper and adjust each margin until the screenshot looks close.

**Correct approach:** Identify the content groups and their relationships first, then give each region a clear width, spacing rule, and semantic role.

**Gotcha:** An image that is purely decorative should use an empty `alt` attribute (`alt=""`). A meaningful image needs alternative text that communicates its relevant information, not its file name.

### 2. Use Grid for Two-Dimensional Relationships

CSS Grid is suited to layouts where rows and columns work together, such as project galleries, dashboards, and feature arrangements. Use flexible tracks and `minmax(0, 1fr)` when content should share available space without intrinsic minimum sizes forcing columns wider than intended.

```html
<section class="work-section" aria-labelledby="work-heading">
  <header class="work-section__header">
    <p>Selected projects</p>
    <h2 id="work-heading">Work built around real user needs</h2>
  </header>
  <div class="work-grid">
    <article class="work-card">
      <p>AI product</p>
      <h3>Health-plan comparison</h3>
      <p>Making coverage and cost trade-offs easier to inspect.</p>
    </article>
    <article class="work-card">
      <p>Analytics</p>
      <h3>Inventory insights</h3>
      <p>Helping operators find stock risks and take action.</p>
    </article>
    <article class="work-card">
      <p>Web experience</p>
      <h3>Studio portfolio</h3>
      <p>Presenting services and project outcomes with clarity.</p>
    </article>
  </div>
</section>
```

```css
.work-section {
  width: min(100% - 3rem, 76rem);
  margin-inline: auto;
  padding-block: 5rem;
}

.work-section__header {
  max-width: 44rem;
  margin-bottom: 2.5rem;
}

.work-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(1rem, 2.5vw, 1.75rem);
}

.work-card {
  min-width: 0;
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  overflow-wrap: anywhere;
}

@media (max-width: 56rem) {
  .work-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 38rem) {
  .work-grid {
    grid-template-columns: 1fr;
  }
}
```

`minmax(0, 1fr)` allows each track to shrink below the automatic minimum size imposed by long content. The breakpoints change the number of columns when three or two cards no longer have enough room to read comfortably.

**Naive approach:** Use `grid-template-columns: repeat(3, 1fr)` and assume every child can shrink naturally.

**Correct approach:** Use `minmax(0, 1fr)` for flexible content tracks and test long headings, URLs, and labels.

**Gotcha:** `min-width: 0` on a grid or flex child is often necessary when its contents have a large intrinsic width. Without it, a long token or embedded chart can overflow even when the parent appears flexible.

### 3. Use Flexbox for One-Dimensional Flow

Flexbox is designed for arranging items along one axis: a row of navigation links, a button group, metadata, or an action bar. It can wrap when space is limited, which is usually safer than squeezing everything into one line.

```html
<nav class="project-navigation" aria-label="Project navigation">
  <a class="project-navigation__brand" href="/">Northstar Studio</a>
  <ul class="project-navigation__links">
    <li><a href="#work">Work</a></li>
    <li><a href="#approach">Approach</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>
```

```css
.project-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem clamp(1rem, 4vw, 3rem);
}

.project-navigation__brand {
  flex: 0 0 auto;
  color: #142033;
  font-weight: 850;
  text-decoration: none;
}

.project-navigation__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.project-navigation__links a {
  color: #344256;
  text-underline-offset: 0.2em;
}

.project-navigation a:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 4px;
}

@media (max-width: 38rem) {
  .project-navigation {
    align-items: flex-start;
    flex-direction: column;
  }

  .project-navigation__links {
    justify-content: flex-start;
  }
}
```

The links wrap naturally, and the small-screen rule changes the navigation into a vertical composition rather than forcing the brand and links to collide.

**Naive approach:** Use absolute positioning to place the logo and navigation at opposite ends.

**Correct approach:** Use Flexbox when elements need to share a row, align, and wrap as available space changes.

**Gotcha:** `justify-content: space-between` distributes remaining space; it does not create a stable gap. If items wrap, check the new row alignment and use `gap` for predictable spacing.

### 4. Establish a Container and a Content Measure

A container controls how wide a region can become; a content measure controls how long a line of text should be. They solve different problems. A full-width page can still use a narrow reading column, while imagery and grids can use a wider container.

```html
<main class="article-page">
  <article class="article-content">
    <header>
      <p class="article-content__eyebrow">Engineering notes</p>
      <h1>Designing a layout that survives real content</h1>
    </header>
    <p>Readable line length helps readers keep their place as they move from one line to the next.</p>
    <p>Use a separate width for text and visual content instead of forcing both into one measure.</p>
  </article>
</main>
```

```css
.article-page {
  padding-inline: clamp(1rem, 4vw, 3rem);
}

.article-content {
  max-width: 44rem;
  margin-inline: auto;
  padding-block: clamp(3rem, 8vw, 6rem);
}

.article-content p {
  max-width: 68ch;
  color: #344256;
  font-size: 1.0625rem;
  line-height: 1.75;
}

.article-content h1 {
  max-width: 16ch;
  font-size: clamp(2.5rem, 6vw, 4.8rem);
  line-height: 1;
  letter-spacing: -0.045em;
}
```

A character-based measure such as `ch` gives a useful starting point for text width, but it is not an exact count of readable characters for every font.

**Naive approach:** Let paragraphs span the entire viewport because there is no overflow.

**Correct approach:** Set a maximum container width and a separate text measure so long lines do not become exhausting to read.

**Gotcha:** `width: 100%` plus horizontal padding can overflow if the default content-box sizing is not considered. A global `box-sizing: border-box` reset makes component sizing easier to reason about.

### 5. Use Fluid Sizing Instead of a Collection of Fixed Values

Fluid sizing lets type, gaps, and padding respond gradually to viewport width. `clamp(min, preferred, max)` provides guardrails so values grow with the screen without becoming too small or excessive.

```css
:root {
  --page-gutter: clamp(1rem, 4vw, 3rem);
  --section-space: clamp(3rem, 8vw, 7rem);
  --layout-gap: clamp(1.25rem, 3vw, 2.5rem);
}

.page-shell {
  width: min(100% - (2 * var(--page-gutter)), 80rem);
  margin-inline: auto;
}

.content-section {
  padding-block: var(--section-space);
}

.content-section__title {
  max-width: 16ch;
  margin: 0 0 1.5rem;
  font-size: clamp(2rem, 4.5vw, 3.75rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}
```

```html
<main class="page-shell">
  <section class="content-section">
    <p>Product design and engineering</p>
    <h1 class="content-section__title">Interfaces that make complicated work feel simple</h1>
  </section>
</main>
```

The minimum and maximum values prevent fluid sizing from drifting into extremes. Use media queries for structural changes, not for every minor type adjustment.

**Naive approach:** Add separate breakpoints for every font size and every section padding value.

**Correct approach:** Use fluid values for continuous changes and reserve breakpoints for changes in layout behavior.

**Gotcha:** A `clamp()` expression still needs testing with browser zoom, long translations, and accessibility text-size settings. A preferred value is not a guarantee that every string fits.

### 6. Use Whitespace to Separate Levels of Information

Whitespace is part of the composition. Small gaps connect labels to content; larger gaps distinguish sections; generous outer space can give a hero or feature story room to breathe. A spacing scale makes these relationships repeatable.

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
}

.feature-card {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-6);
}

.feature-card__title,
.feature-card__description {
  margin: 0;
}

.feature-card__description {
  color: #526173;
  line-height: 1.65;
}

.feature-section {
  padding-block: var(--space-16);
}
```

```html
<section class="feature-section" aria-labelledby="feature-title">
  <h2 id="feature-title">A clearer path from insight to action</h2>
  <article class="feature-card">
    <p>Step 01</p>
    <h3 class="feature-card__title">Understand the result</h3>
    <p class="feature-card__description">Keep the main recommendation close to the evidence that supports it.</p>
  </article>
</section>
```

**Naive approach:** Apply `margin-bottom: 24px` to every element, regardless of whether the next item belongs to the same group.

**Correct approach:** Use smaller spacing within a component and larger spacing between components or sections.

**Gotcha:** Margin collapsing can make vertical margins behave differently than expected in normal block flow. Grid or Flexbox `gap` is often more predictable for spacing between direct children.

### 7. Align the Composition With a Consistent Grid

An underlying grid helps sections feel related even when their internal layouts differ. You do not need to draw visible columns on the page; the grid is a shared set of alignment edges and proportions.

```html
<section class="editorial-feature">
  <p class="editorial-feature__label">Field notes</p>
  <h2 class="editorial-feature__title">The details are where trust is built</h2>
  <figure class="editorial-feature__image">
    <img src="/images/interface-detail.webp"
         alt="Close view of a product interface with clearly grouped information">
  </figure>
  <p class="editorial-feature__body">
    A consistent grid makes the headline, image, and explanation feel like one considered story.
  </p>
</section>
```

```css
.editorial-feature {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.25rem;
  width: min(100% - 3rem, 76rem);
  margin-inline: auto;
  padding-block: 5rem;
}

.editorial-feature__label {
  grid-column: 1 / 4;
  margin: 0;
}

.editorial-feature__title {
  grid-column: 4 / 12;
  max-width: 15ch;
  margin: 0;
  font-size: clamp(2rem, 4.5vw, 4rem);
  line-height: 1.05;
}

.editorial-feature__image {
  grid-column: 2 / 12;
  margin: 1.5rem 0 0;
}

.editorial-feature__image img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1rem;
}

.editorial-feature__body {
  grid-column: 7 / 12;
  margin: 0;
  color: #526173;
  line-height: 1.7;
}

@media (max-width: 44rem) {
  .editorial-feature {
    grid-template-columns: 1fr;
  }

  .editorial-feature__label,
  .editorial-feature__title,
  .editorial-feature__image,
  .editorial-feature__body {
    grid-column: 1;
  }
}
```

The desktop composition uses different column spans to create a deliberate editorial rhythm. On mobile, the regions stack into a simple reading sequence.

**Naive approach:** Center each section independently and hope the page looks cohesive.

**Correct approach:** Reuse a shared container and a few alignment edges, then vary column spans to create visual interest.

**Gotcha:** A twelve-column grid is not automatically better than a simpler two-column layout. Choose the smallest grid that gives you useful control; complexity without a compositional reason adds maintenance cost.

### 8. Control Image Proportion and Crop Deliberately

Images have intrinsic dimensions and focal points. A composition should reserve space for the image, use an intentional aspect ratio where appropriate, and choose between natural sizing and cropping based on the content.

```html
<figure class="project-visual">
  <img src="/images/analytics-dashboard.webp"
       alt="Analytics dashboard showing inventory levels and risk indicators">
  <figcaption>Inventory risk summarized for daily operations.</figcaption>
</figure>
```

```css
.project-visual {
  margin: 0;
}

.project-visual img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  object-position: center;
  border-radius: 1rem;
  background: #e8edf2;
}

.project-visual figcaption {
  margin-top: 0.75rem;
  color: #526173;
  font-size: 0.875rem;
  line-height: 1.5;
}
```

For screenshots that contain small interface text, use `object-fit: contain` or allow the image to retain its natural ratio if cropping would hide important information.

**Naive approach:** Force every image into a fixed height and accept whatever gets cropped.

**Correct approach:** Decide whether the image is illustrative or informational. Crop decorative imagery; preserve details that users need to inspect.

**Gotcha:** `object-fit: cover` can cut off a person's face, a chart legend, or a UI control. Test the actual asset and adjust `object-position` or the aspect ratio per image role.

### 9. Prevent Intrinsic Sizing From Breaking the Layout

Browsers use intrinsic sizes to avoid shrinking content below its natural minimum. This is usually helpful, but long URLs, unbroken identifiers, tables, charts, and embedded media can force a grid or flex item wider than its track.

```html
<section class="insight-layout" aria-labelledby="insight-title">
  <article class="insight-main">
    <h2 id="insight-title">Recommendation details</h2>
    <p class="insight-id">Source reference: POLICY-RECOMMENDATION-2026-VERY-LONG-IDENTIFIER</p>
  </article>
  <aside class="insight-summary" aria-label="Recommendation summary">
    <h3>Summary</h3>
    <p>Review coverage limits before selecting a plan.</p>
  </aside>
</section>
```

```css
.insight-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(14rem, 0.8fr);
  gap: 1.5rem;
}

.insight-main,
.insight-summary {
  min-width: 0;
}

.insight-id {
  overflow-wrap: anywhere;
}

.insight-summary {
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: #f4f6f8;
}

@media (max-width: 46rem) {
  .insight-layout {
    grid-template-columns: 1fr;
  }
}
```

**Naive approach:** Add `overflow: hidden` to the entire page when a long identifier causes horizontal scrolling.

**Correct approach:** Find the element with the excessive intrinsic width, set `min-width: 0` where appropriate, and choose a wrapping or scrolling strategy for that specific content type.

**Gotcha:** Do not indiscriminately apply `overflow-wrap: anywhere` to all text. It is useful for long tokens, but ordinary prose should still wrap naturally for readability.

### 10. Design Breakpoints Around Failure, Not Device Labels

A breakpoint should be added when the current composition stops working: columns become cramped, navigation wraps awkwardly, or a heading collides with a visual. Device categories are only rough references; the layout itself should determine the breakpoint.

```css
.service-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(17rem, 0.7fr);
  align-items: start;
  gap: clamp(1.5rem, 4vw, 4rem);
}

.service-layout__main,
.service-layout__aside {
  min-width: 0;
}

@media (max-width: 50rem) {
  .service-layout {
    grid-template-columns: 1fr;
  }

  .service-layout__aside {
    max-width: 42rem;
  }
}
```

```html
<section class="service-layout" aria-labelledby="service-layout-title">
  <article class="service-layout__main">
    <h2 id="service-layout-title">A process built around your goals</h2>
    <p>Discovery, design, and implementation are planned as one connected workflow.</p>
  </article>
  <aside class="service-layout__aside">
    <h3>Typical deliverables</h3>
    <ul>
      <li>Content and page structure</li>
      <li>Responsive component system</li>
      <li>Implementation handoff</li>
    </ul>
  </aside>
</section>
```

**Naive approach:** Use only `@media (max-width: 768px)` because it is a familiar tablet breakpoint.

**Correct approach:** Resize the browser gradually and set a breakpoint where the current content relationship stops being clear.

**Gotcha:** Test the range between your named breakpoints. Many responsive bugs appear at intermediate widths, not at the common phone and desktop sizes.

### 11. Keep Visual Order and Reading Order Aligned

CSS can rearrange the visual presentation, but assistive technology and keyboard navigation generally follow the document order. Avoid layouts that make the eye move one way while focus moves another. Put content in a meaningful DOM sequence first, then use Grid and Flexbox to adapt its presentation.

```html
<section class="feature-story" aria-labelledby="feature-story-title">
  <div class="feature-story__copy">
    <p>Product thinking</p>
    <h2 id="feature-story-title">Start with the decision the user needs to make</h2>
    <p>Present the key information before optional detail and decorative context.</p>
    <a href="/approach">Read our approach</a>
  </div>
  <figure class="feature-story__visual">
    <img src="/images/decision-flow.webp"
         alt="Diagram showing a decision, supporting evidence, and next step">
  </figure>
</section>
```

```css
.feature-story {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: center;
  gap: 3rem;
}

.feature-story__copy {
  grid-column: 1;
  grid-row: 1;
}

.feature-story__visual {
  grid-column: 2;
  grid-row: 1;
  margin: 0;
}

.feature-story__visual img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1rem;
}

@media (max-width: 46rem) {
  .feature-story {
    grid-template-columns: 1fr;
  }

  .feature-story__copy,
  .feature-story__visual {
    grid-column: 1;
    grid-row: auto;
  }
}
```

**Naive approach:** Use `order` or explicit grid placement to put content in a visual sequence unrelated to its DOM order.

**Correct approach:** Make the DOM sequence understandable on its own and use CSS to change columns without changing the intended reading path.

**Gotcha:** Do not use positive `tabindex` values to patch an order problem. Fix the document structure and keep the natural keyboard sequence.

### 12. Handle Sticky and Fixed Regions Without Hiding Content

Sticky navigation and fixed action bars can help users keep context, but they reduce the visible viewport and can cover headings, focused controls, or anchor targets. Reserve space and account for the persistent region.

```html
<header class="site-header">
  <a href="/" class="site-header__brand">Northstar Studio</a>
  <nav aria-label="Main navigation">
    <a href="#work">Work</a>
    <a href="#contact">Contact</a>
  </nav>
</header>

<main>
  <section id="work" class="page-section">
    <h1>Selected work</h1>
    <p>Projects that make complex products easier to use.</p>
  </section>
  <section id="contact" class="page-section">
    <h2>Start a conversation</h2>
  </section>
</main>
```

```css
:root {
  --header-height: 4.5rem;
}

html {
  scroll-padding-top: calc(var(--header-height) + 1rem);
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
  padding-inline: clamp(1rem, 4vw, 3rem);
  border-bottom: 1px solid #d6dde6;
  background: rgb(255 255 255 / 94%);
  backdrop-filter: blur(12px);
}

.site-header nav {
  display: flex;
  gap: 1rem;
}

.site-header a {
  color: #142033;
  text-underline-offset: 0.2em;
}

.site-header a:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 3px;
}

.page-section {
  min-height: 60vh;
  padding: clamp(3rem, 8vw, 7rem) 1.5rem;
  scroll-margin-top: calc(var(--header-height) + 1rem);
}
```

**Naive approach:** Add `position: fixed` to the header without accounting for the content it covers.

**Correct approach:** Prefer sticky positioning when it fits the page flow, define a header-height token, and offset scroll targets so headings remain visible.

**Gotcha:** `backdrop-filter` support and performance can vary. The header must remain readable if the blur effect is unavailable, and a sticky element can be constrained by its scrolling ancestor.

### 13. Compose Dense Data Without Making It Feel Chaotic

Dashboards need a different density from marketing pages, but density should still be organized. Group related metrics, establish a clear scan order, align numbers, and provide a narrow-screen strategy for data that cannot sensibly wrap.

```html
<section class="metrics-panel" aria-labelledby="metrics-title">
  <header class="metrics-panel__header">
    <div>
      <p>Weekly overview</p>
      <h2 id="metrics-title">Product activity</h2>
    </div>
    <a href="/analytics">View analytics</a>
  </header>
  <dl class="metrics-grid">
    <div class="metric">
      <dt>Active users</dt>
      <dd>12,480</dd>
    </div>
    <div class="metric">
      <dt>Task completion</dt>
      <dd>84.6%</dd>
    </div>
    <div class="metric">
      <dt>Median response</dt>
      <dd>1.8 s</dd>
    </div>
  </dl>
</section>
```

```css
.metrics-panel {
  padding: clamp(1rem, 3vw, 2rem);
  border: 1px solid #d6dde6;
  border-radius: 1rem;
  background: #fff;
}

.metrics-panel__header {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metrics-panel__header h2,
.metrics-panel__header p {
  margin: 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.metric {
  min-width: 0;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #f4f6f8;
}

.metric dt {
  color: #526173;
  font-size: 0.875rem;
}

.metric dd {
  margin: 0.5rem 0 0;
  color: #142033;
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

@media (max-width: 42rem) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
```

**Naive approach:** Use the same spacious, oversized card treatment for every metric, table, and control in a dashboard.

**Correct approach:** Use clear grouping, compact but legible spacing, aligned numeric values, and responsive reflow based on how the data will be compared.

**Gotcha:** If users must compare rows and columns, turning every table row into an unrelated card can destroy relationships. Preserve table semantics or provide an intentional mobile alternative.

### 14. Integrate the Principles Into a Real Case-Study Page

A production layout combines hierarchy, container widths, grids, image handling, responsive breakpoints, and semantic order. The final design should tell a story: context, problem, approach, evidence, and outcome. It should not be a sequence of visually identical sections.

```html
<main class="project-story">
  <header class="project-story__hero">
    <p class="project-story__eyebrow">Case study · AI-MEDPAY</p>
    <h1>Helping people compare health coverage with more confidence</h1>
    <p class="project-story__summary">
      A product experience that organizes plan details, explains trade-offs, and supports a clearer next step.
    </p>
    <a class="project-story__action" href="#outcomes">Explore the outcome</a>
  </header>

  <figure class="project-story__cover">
    <img src="/images/medpay-overview.webp"
         alt="Health-plan comparison interface with plan summaries and coverage details">
    <figcaption>Recommendation, cost, and coverage information in one comparison view.</figcaption>
  </figure>

  <section class="project-story__section" aria-labelledby="problem-title">
    <div class="project-story__section-label">
      <p>01 / The problem</p>
    </div>
    <div class="project-story__section-body">
      <h2 id="problem-title">Complex details made comparison difficult</h2>
      <p>People needed to understand the main trade-offs without losing access to supporting information.</p>
    </div>
  </section>

  <section class="project-story__section project-story__section--visual" aria-labelledby="approach-title">
    <div class="project-story__section-label">
      <p>02 / The approach</p>
    </div>
    <div class="project-story__section-body">
      <h2 id="approach-title">Put the recommendation in context</h2>
      <p>Related details stay close to the recommendation, while secondary information remains available for deeper review.</p>
      <ul>
        <li>Clear grouping of plan details</li>
        <li>Consistent comparison structure</li>
        <li>Visible caveats and next steps</li>
      </ul>
    </div>
  </section>

  <section id="outcomes" class="project-story__outcome" aria-labelledby="outcome-title">
    <p>03 / The outcome</p>
    <h2 id="outcome-title">A more understandable path to a decision</h2>
    <p>The layout supports scanning first and detailed evaluation second.</p>
  </section>
</main>
```

```css
.project-story {
  --story-gutter: clamp(1rem, 4vw, 3rem);
  --story-space: clamp(3rem, 8vw, 7rem);
  width: min(100% - (2 * var(--story-gutter)), 80rem);
  margin-inline: auto;
}

.project-story__hero {
  max-width: 56rem;
  padding-block: var(--story-space) 3rem;
}

.project-story__eyebrow,
.project-story__section-label p,
.project-story__outcome > p:first-child {
  color: #526173;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.project-story__hero h1 {
  max-width: 14ch;
  margin: 0;
  font-size: clamp(2.7rem, 6.5vw, 5.8rem);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.project-story__summary {
  max-width: 42rem;
  margin-block: 1.5rem;
  color: #526173;
  font-size: 1.15rem;
  line-height: 1.7;
}

.project-story__action {
  display: inline-flex;
  align-items: center;
  min-height: 3rem;
  padding: 0.85rem 1.2rem;
  border-radius: 0.6rem;
  background: #173f70;
  color: #fff;
  font-weight: 750;
  text-decoration: none;
}

.project-story__action:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 4px;
}

.project-story__cover {
  margin: 0 0 var(--story-space);
}

.project-story__cover img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1.25rem;
  background: #e8edf2;
}

.project-story__cover figcaption {
  margin-top: 0.75rem;
  color: #526173;
  font-size: 0.875rem;
}

.project-story__section {
  display: grid;
  grid-template-columns: minmax(10rem, 0.7fr) minmax(0, 1.3fr);
  gap: clamp(1.5rem, 5vw, 5rem);
  padding-block: 2.5rem;
  border-top: 1px solid #d6dde6;
}

.project-story__section-label p {
  margin: 0;
}

.project-story__section-body {
  max-width: 48rem;
}

.project-story__section-body h2,
.project-story__outcome h2 {
  max-width: 18ch;
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.project-story__section-body p,
.project-story__section-body li,
.project-story__outcome > p:last-child {
  color: #526173;
  line-height: 1.7;
}

.project-story__outcome {
  margin-block: var(--story-space);
  padding: clamp(1.5rem, 5vw, 4rem);
  border-radius: 1.25rem;
  background: #f4f6f8;
}

@media (max-width: 46rem) {
  .project-story__section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
```

The case study uses a wide image for visual evidence, a constrained hero for readable text, repeated section alignment, and one distinct outcome region. Replace the sample image path with a real asset and test its crop and alternative text.

**Naive approach:** Turn every section into a centered heading followed by three cards because that is easy to implement.

**Correct approach:** Give each section a composition that matches its content role while reusing shared containers, spacing tokens, and alignment edges.

**Gotcha:** Do not invent metrics or outcomes for a portfolio case study. The visual composition should help readers understand verified work, not make unsupported claims look authoritative.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Responsive Project Grid

**What it does:** Creates a project gallery that moves from three columns to two and then one without forcing cards to fixed widths.

**When to use it:** Use it when a portfolio contains multiple comparable projects and card titles or descriptions vary in length.

```html
<section class="portfolio-work" aria-labelledby="portfolio-work-title">
  <header class="portfolio-work__intro">
    <p>Selected work</p>
    <h2 id="portfolio-work-title">A few problems worth solving</h2>
  </header>
  <div class="portfolio-work__grid">
    <article class="portfolio-work__card">
      <h3>Health-plan comparison</h3>
      <p>Organizing complex options around the decision people need to make.</p>
    </article>
    <article class="portfolio-work__card">
      <h3>Inventory insights</h3>
      <p>Helping teams recognize stock risk before it becomes a disruption.</p>
    </article>
    <article class="portfolio-work__card">
      <h3>Studio website</h3>
      <p>Presenting expertise and outcomes in a clear, credible way.</p>
    </article>
  </div>
</section>
```

```css
.portfolio-work {
  width: min(100% - 3rem, 76rem);
  margin-inline: auto;
  padding-block: clamp(3rem, 7vw, 6rem);
}

.portfolio-work__intro {
  max-width: 44rem;
  margin-bottom: 2rem;
}

.portfolio-work__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.portfolio-work__card {
  min-width: 0;
  padding: 1.5rem;
  border: 1px solid #d6dde6;
  border-radius: 1rem;
}

.portfolio-work__card h3 {
  margin-top: 0;
}

.portfolio-work__card p {
  color: #526173;
  line-height: 1.65;
}

@media (max-width: 54rem) {
  .portfolio-work__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 36rem) {
  .portfolio-work__grid {
    grid-template-columns: 1fr;
  }
}
```

Do not force identical card heights just to make a screenshot perfectly even; allow content to breathe unless alignment is necessary for a shared action row.

### Pattern 2: Editorial Split Section

**What it does:** Pairs a text narrative with an image while preserving a clear reading order on small screens.

**When to use it:** Use it for a case-study section where the image provides evidence for the adjacent explanation.

```html
<section class="editorial-split">
  <div class="editorial-split__copy">
    <p>Design decision</p>
    <h2>Show the important answer before the supporting detail</h2>
    <p>People should be able to scan the main result and then inspect the evidence that matters to them.</p>
  </div>
  <figure class="editorial-split__media">
    <img src="/images/recommendation-panel.webp"
         alt="Recommendation panel with the supporting evidence listed below it">
  </figure>
</section>
```

```css
.editorial-split {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: clamp(2rem, 6vw, 5rem);
  padding-block: clamp(3rem, 8vw, 6rem);
}

.editorial-split__copy {
  max-width: 38rem;
}

.editorial-split__copy h2 {
  max-width: 16ch;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 1.05;
}

.editorial-split__media {
  min-width: 0;
  margin: 0;
}

.editorial-split__media img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1rem;
}

@media (max-width: 48rem) {
  .editorial-split {
    grid-template-columns: 1fr;
  }
}
```

The sample asset path must be replaced with a real image. For an informative screenshot, avoid a crop that hides relevant labels or controls.

### Pattern 3: Narrow Reading Column With Wide Media

**What it does:** Keeps paragraphs readable while allowing figures to use more of the available page width.

**When to use it:** Use it for long-form articles, tutorials, and technical case studies that mix text with large screenshots.

```html
<article class="long-read">
  <header class="long-read__header">
    <p>Engineering notes</p>
    <h1>How layout decisions affect product clarity</h1>
  </header>
  <div class="long-read__body">
    <p>Readable text measures help people maintain their place as they scan and read.</p>
  </div>
  <figure class="long-read__figure">
    <img src="/images/layout-comparison.webp"
         alt="Two interface layouts compared side by side">
    <figcaption>The comparison uses the same content with different grouping.</figcaption>
  </figure>
  <div class="long-read__body">
    <p>Use a wider visual region when the image itself contains useful information.</p>
  </div>
</article>
```

```css
.long-read {
  padding-inline: 1.5rem;
}

.long-read__header,
.long-read__body {
  max-width: 44rem;
  margin-inline: auto;
}

.long-read__header {
  padding-block: 4rem 2rem;
}

.long-read__body {
  color: #344256;
  font-size: 1.0625rem;
  line-height: 1.8;
}

.long-read__figure {
  width: min(100%, 76rem);
  margin: 3rem auto;
}

.long-read__figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1rem;
}

.long-read__figure figcaption {
  max-width: 44rem;
  margin: 0.75rem auto 0;
  color: #526173;
  font-size: 0.875rem;
}
```

Keep the figure in the correct reading position in the document. Do not use absolute positioning to make it appear between paragraphs if it is not there in the semantic order.

### Pattern 4: Responsive Sidebar That Becomes a Summary Block

**What it does:** Keeps secondary information adjacent to the main content on wide screens and moves it into the reading flow on narrow screens.

**When to use it:** Use it for case-study metadata, product summaries, filters, or a dashboard panel that is helpful but not the primary task.

```html
<section class="detail-layout">
  <article class="detail-layout__main">
    <h2>Recommendation details</h2>
    <p>The main explanation stays in the widest column.</p>
  </article>
  <aside class="detail-layout__summary" aria-labelledby="detail-summary-title">
    <h3 id="detail-summary-title">At a glance</h3>
    <ul>
      <li>Three plans compared</li>
      <li>Costs shown annually</li>
      <li>Coverage limits available</li>
    </ul>
  </aside>
</section>
```

```css
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(15rem, 0.8fr);
  align-items: start;
  gap: 2rem;
}

.detail-layout__main,
.detail-layout__summary {
  min-width: 0;
}

.detail-layout__summary {
  padding: 1.25rem;
  border-radius: 0.9rem;
  background: #f4f6f8;
}

@media (max-width: 48rem) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
```

If the sidebar contains a control needed before the main task can begin, reconsider whether it belongs after the main content in the DOM or should appear earlier.

### Pattern 5: Dashboard Metric Cluster

**What it does:** Groups related metrics into a consistent grid and keeps numbers aligned for rapid comparison.

**When to use it:** Use it for overview screens where users need to scan a small set of key indicators before exploring detail.

```html
<section class="metric-cluster" aria-labelledby="metric-cluster-title">
  <h2 id="metric-cluster-title">Service health</h2>
  <dl class="metric-cluster__grid">
    <div><dt>Requests today</dt><dd>18,420</dd></div>
    <div><dt>Success rate</dt><dd>99.4%</dd></div>
    <div><dt>Median latency</dt><dd>240 ms</dd></div>
  </dl>
</section>
```

```css
.metric-cluster__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 0;
}

.metric-cluster__grid > div {
  min-width: 0;
  padding: 1.25rem;
  border: 1px solid #d6dde6;
  border-radius: 0.75rem;
}

.metric-cluster dt {
  color: #526173;
  font-size: 0.875rem;
}

.metric-cluster dd {
  margin: 0.5rem 0 0;
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

@media (max-width: 42rem) {
  .metric-cluster__grid {
    grid-template-columns: 1fr;
  }
}
```

Do not put every possible metric in the first row. Choose the few that support the immediate decision and move supporting measures into a deeper view.

### Pattern 6: Sticky Header With Safe Anchor Scrolling

**What it does:** Keeps navigation available while ensuring in-page links do not hide their destination behind the header.

**When to use it:** Use it on long portfolio pages or documentation pages with several sections and a compact sticky header.

```html
<header class="sticky-navigation">
  <a href="/" class="sticky-navigation__brand">Northstar Studio</a>
  <nav aria-label="Main navigation">
    <a href="#process">Process</a>
    <a href="#work">Work</a>
  </nav>
</header>
<main>
  <section id="process" class="navigation-section">
    <h1>Our process</h1>
  </section>
  <section id="work" class="navigation-section">
    <h2>Selected work</h2>
  </section>
</main>
```

```css
:root {
  --sticky-navigation-height: 4.25rem;
}

html {
  scroll-padding-top: calc(var(--sticky-navigation-height) + 1rem);
}

.sticky-navigation {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--sticky-navigation-height);
  padding-inline: 1.5rem;
  border-bottom: 1px solid #d6dde6;
  background: #fff;
}

.sticky-navigation nav {
  display: flex;
  gap: 1rem;
}

.sticky-navigation a {
  color: #142033;
}

.sticky-navigation a:focus-visible {
  outline: 3px solid #e3a008;
  outline-offset: 3px;
}

.navigation-section {
  min-height: 70vh;
  padding: 4rem 1.5rem;
  scroll-margin-top: calc(var(--sticky-navigation-height) + 1rem);
}
```

If the header height changes at a breakpoint, update the token at the same breakpoint. Verify keyboard focus and anchor destinations with the actual browser, not only a static screenshot.

### Pattern 7: Content-Resilient Layout Debugging

**What it does:** Provides a repeatable way to identify the element causing overflow instead of hiding the symptom.

**When to use it:** Use it when a page scrolls horizontally, a card stretches unexpectedly, or a grid breaks after real content is loaded.

```html
<section class="debug-layout" aria-labelledby="debug-layout-title">
  <article class="debug-layout__main">
    <h2 id="debug-layout-title">Long source identifier</h2>
    <p>POLICY-SOURCE-REFERENCE-THAT-IS-LONGER-THAN-THE-CARD-WIDTH</p>
  </article>
  <aside class="debug-layout__aside">
    <h3>Review note</h3>
    <p>Supporting details remain within their own column.</p>
  </aside>
</section>
```

```css
.debug-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 0.65fr);
  gap: 1.25rem;
}

.debug-layout__main,
.debug-layout__aside {
  min-width: 0;
}

.debug-layout__main p {
  overflow-wrap: anywhere;
}

.debug-layout__aside {
  padding: 1rem;
  background: #f4f6f8;
  border-radius: 0.75rem;
}

@media (max-width: 44rem) {
  .debug-layout {
    grid-template-columns: 1fr;
  }
}
```

For a live debugging pass, inspect the overflowing element in DevTools, compare its `scrollWidth` with `clientWidth`, and temporarily outline grid items. Remove diagnostic styles before shipping; do not leave `overflow-x: hidden` on the body as a substitute for finding the source.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Setting fixed widths on every section | The developer is matching one screenshot instead of describing flexible constraints | Use `width: min(100% - gutter, max-width)` for page containers |
| Using Grid for every alignment problem | Grid seems like a universal layout tool | Use Flexbox for a single axis and Grid when rows and columns jointly matter |
| Using Flexbox for a complex two-dimensional gallery | One-axis layout becomes difficult to coordinate across rows | Use `display: grid` with explicit responsive tracks |
| Omitting `minmax(0, 1fr)` in flexible content grids | The automatic minimum size is mistaken for a bug in the parent | Use `minmax(0, 1fr)` and test long intrinsic content |
| Forgetting `min-width: 0` on nested flex or grid items | Child content retains a larger intrinsic minimum | Set `min-width: 0` on the item that must shrink |
| Letting paragraphs span the full viewport | No overflow is confused with good readability | Set a text measure such as `max-width: 65ch` |
| Using arbitrary margins for every component | Spacing is decided locally without a shared rhythm | Define spacing tokens and apply them to recurring relationships |
| Adding breakpoints based only on device labels | Familiar device widths are used without checking the content | Resize until the current composition fails, then set a breakpoint |
| Making every section the same card grid | Reuse is confused with repeating the same composition | Vary composition by content role while keeping tokens and alignment consistent |
| Cropping informative screenshots with `object-fit: cover` | All images are treated as decorative art | Use `contain` or natural ratio when details must remain visible |
| Using absolute positioning for the main layout | Fixed coordinates seem faster to tune | Use normal flow, Grid, or Flexbox for the primary structure |
| Reordering content visually without checking DOM order | The screenshot is optimized independently of keyboard navigation | Keep semantic order meaningful and use CSS only for responsive arrangement |
| Adding sticky navigation without anchor offsets | The header is treated as an overlay without considering scroll targets | Use `scroll-padding-top` and `scroll-margin-top` based on header height |
| Hiding horizontal overflow at the page level | The symptom disappears in the screenshot | Inspect overflowing descendants and fix the owning grid track or content |
| Giving all dashboard cards marketing-page spacing | The same density is applied to different user tasks | Group related metrics and use compact but readable spacing |
| Forcing equal card heights with clipped content | A tidy row is prioritized over content access | Let cards grow naturally or align actions without clipping text |
| Using fixed hero heights | Content length and viewport height are assumed constant | Prefer content-driven height and responsive padding |
| Forgetting browser zoom and text enlargement | Layout is tested only at default scale | Test zoom and larger text while checking for clipped content |
| Assuming `100vw` always fits inside a page | Scrollbars and parent padding are ignored | Prefer `width: 100%` for in-flow content unless viewport width is specifically required |
| Ignoring the intermediate widths | Only common mobile and desktop screenshots are checked | Test narrow, medium, and wide viewports and resize continuously |
| Making a sidebar appear before content only with CSS | Visual order is mistaken for semantic order | Choose a logical DOM sequence and ensure focus follows it |
| Using `height` when `min-height` is intended | A reference image's proportions are copied literally | Use content-driven sizing and `min-height` only when a minimum is meaningful |
| Overusing twelve-column grids | Grid complexity is mistaken for sophistication | Use the simplest track system that supports the intended alignment |
| Leaving debug outlines or overflow rules in production | Temporary troubleshooting styles are forgotten | Remove diagnostics and verify the actual layout after the fix |

### Before → After: Hide the symptom versus fix the composition

**Before:**

```css
/* Hides the visible symptom but leaves the actual cause in place. */
body {
  overflow-x: hidden;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
```

**After:**

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.project-card {
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 52rem) {
  .project-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 36rem) {
  .project-grid {
    grid-template-columns: 1fr;
  }
}
```

The after version addresses track sizing and content variation directly. It still needs testing with real content, images, tables, and embedded components.

---

## Mental Models

1. **Content chooses the layout** — choose the layout primitive after you understand what must stay together, align, wrap, or compare.
2. **Grid is a map; Flexbox is a line** — use Grid for two-dimensional relationships and Flexbox for one-axis alignment and flow.
3. **A breakpoint marks a failure point** — change the composition when content no longer fits, not just because a device category changed.
4. **The DOM is the reading contract** — visual rearrangement must not make keyboard or screen-reader order confusing.
5. **Whitespace is grouping information** — small gaps connect, larger gaps separate, and section space creates rhythm.
6. **Intrinsic size is real content pushing back** — long labels, charts, and URLs can demand more room than a track appears to offer.
7. **Hide nothing until you know why it overflows** — find the element and constraint that cause the issue before suppressing scrolling.
8. **Responsive design is recomposition** — preserve meaning while changing the arrangement to suit the available space.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Page container | `width: min(100% - 3rem, 76rem)` | Leaves gutters while capping line and grid width |
| Narrow text measure | `max-width: 60–70ch` | A starting point; inspect actual font and copy |
| Flexible Grid track | `minmax(0, 1fr)` | Prevents intrinsic minimum size from forcing the track wider |
| Grid gallery | `repeat(3, minmax(0, 1fr))` | Add breakpoints when cards become cramped |
| One-axis alignment | `display: flex` | Navigation, action rows, metadata |
| Two-dimensional composition | `display: grid` | Dashboards, galleries, editorial layouts |
| Flex item should shrink | `min-width: 0` | Useful for nested flex/grid content |
| Responsive gutters | `clamp(1rem, 4vw, 3rem)` | Fluid padding with limits |
| Fluid heading | `clamp(2.5rem, 6vw, 5rem)` | Still check line breaks and zoom |
| Grid spacing | `gap` | Avoids many unrelated child margins |
| Intrinsic image | `width: 100%; height: auto` | Preserves original aspect ratio |
| Decorative image crop | `aspect-ratio` + `object-fit: cover` | Verify the focal point is not lost |
| Informative screenshot | Natural ratio or `object-fit: contain` | Keep labels and controls visible |
| Content that must wrap | `overflow-wrap: anywhere` | Apply selectively to long tokens |
| Responsive breakpoint | When content composition fails | Do not rely only on device categories |
| Sticky header anchors | `scroll-padding-top` / `scroll-margin-top` | Keep targets visible below the header |
| Accessible focus | `:focus-visible` | Test keyboard navigation |
| Mobile layout order | Logical DOM sequence | CSS visual order should not contradict it |
| Dense dashboard | Clear grouping + aligned numbers | Preserve comparison relationships |
| Debug horizontal overflow | Inspect `scrollWidth` and `clientWidth` | Identify the descendant that exceeds its container |
| Temporary debug outline | `outline: 1px solid magenta` | Use only during diagnosis, then remove |
| Browser inspection | DevTools layout pane and computed styles | Confirm the actual track and overflow owner |
| Fixed page height | Usually avoid for content sections | Prefer natural height or meaningful `min-height` |
| Page-level overflow hiding | Avoid as a first fix | It may conceal controls and content |
| Case-study rhythm | Alternate text, visual evidence, and outcome regions | Avoid repeating the same card composition in every section |

---

## Build Challenge

### Build: A Responsive Creative-Developer Case Study

Create a portfolio case-study page for an AI product or analytics project. The page should guide a prospective client through context, problem, design approach, and outcome. Focus on composition rather than decorative effects.

1. Define the audience and the main question they need answered when they open the case study.
2. Write a page-level headline that describes the project's outcome or purpose.
3. Use semantic `main`, `header`, `section`, `figure`, `figcaption`, `article`, and heading elements where they represent the content.
4. Establish a centered page container with responsive gutters and a maximum width.
5. Keep the hero text measure narrower than the full visual container.
6. Build one editorial split section using Grid or Flexbox based on the actual relationship between the text and image.
7. Add a project gallery with at least three cards using `repeat()` and `minmax(0, 1fr)`.
8. Use a shared spacing scale for component gaps and section spacing.
9. Use `clamp()` for at least the page gutters, section padding, and main heading size.
10. Define breakpoints based on where the composition becomes cramped, not just on named devices.
11. At narrow widths, recompose columns into a logical single-column reading sequence.
12. Add an informative screenshot and choose an aspect ratio that preserves the details readers need.
13. Test a decorative image with `object-fit: cover` and an informative screenshot with a non-cropping strategy.
14. Add a long project title and a long source identifier to verify that intrinsic sizing does not break the layout.
15. Make flexible grid and flex children shrink correctly with `min-width: 0` where needed.
16. Add a secondary summary region that becomes a stacked block on narrow screens.
17. If you use sticky navigation, ensure anchor targets and keyboard focus are not hidden behind it.
18. Add visible `:focus-visible` styles for all links and controls.
19. Test the page at a narrow mobile width, an intermediate tablet width, and a wide desktop width.
20. Increase browser zoom and verify that content does not clip or force unnecessary horizontal scrolling.
21. Use DevTools to inspect any unexpected overflow; identify the exact element and constraint before fixing it.
22. Temporarily add outlines to grid children to inspect alignment, then remove the diagnostic styles.
23. Replace at least one repeated card-grid section with a different composition that better fits the content's role.
24. Ask a person unfamiliar with the project to scan the first screen and describe the story they expect the page to tell.
25. Verify that the document order still makes sense with CSS disabled or when read linearly.
26. Do not invent project results, metrics, or user research claims; label illustrative content honestly.
27. Document the breakpoint decisions and the content failure that justified each one.

### Definition of Done

- [ ] The page has a clear story and a logical content sequence.
- [ ] The main container has consistent gutters and a sensible maximum width.
- [ ] Text measure and visual width are treated as separate design decisions.
- [ ] Grid is used for two-dimensional placement and Flexbox for one-axis flow where appropriate.
- [ ] The gallery adapts without forcing fixed card widths.
- [ ] Fluid sizing improves the layout without making text excessively large or small.
- [ ] Long titles and identifiers do not create unexplained horizontal overflow.
- [ ] Informative images retain the details required to understand them.
- [ ] Breakpoints are justified by real composition failures.
- [ ] Mobile reading order is clear and matches the semantic structure.
- [ ] Sticky navigation, if present, does not cover anchor targets or focused controls.
- [ ] Keyboard focus is visible.
- [ ] Browser zoom and intermediate viewport widths have been tested.
- [ ] DevTools was used to diagnose layout behavior rather than hiding symptoms.
- [ ] At least one section uses a composition chosen specifically for its content role.
- [ ] All temporary debugging styles have been removed.
- [ ] Project claims and outcome statements are grounded in real work.

The challenge is complete when the layout communicates the project story clearly across realistic viewport sizes and content variations—not merely when the desktop screenshot looks balanced.
