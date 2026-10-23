# SKILL: grid-mastery

**Layer:** 01 — CSS Foundation  
**Path:** `layer-01-css-foundation/grid-mastery/SKILL.md`  
**Status:** Quality-gate candidate; validate before acceptance  
**Primary domain:** CSS Grid layout, track sizing, placement, intrinsic sizing, responsive behavior, and production debugging

---

## Goal

Build a reliable mental model for CSS Grid so you can design two-dimensional layouts that remain understandable under changing content, viewport sizes, writing modes, and component requirements.

This skill focuses on the Grid layout algorithm and the decisions that make a layout robust: defining explicit and implicit tracks, understanding the difference between `auto`, `min-content`, `max-content`, `minmax()`, and `fr`, placing items with lines and areas, handling gaps and alignment, and debugging unexpected overflow or track growth.

Grid is not a decorative shortcut for placing cards in columns. It is a constraint system. You define tracks and placement rules; the browser resolves intrinsic contributions, available space, min/max constraints, and alignment. When those constraints conflict, the browser still produces a layout, but the result may not match your mental picture.

## Why This Matters (Senior Perspective)

Grid failures often appear only after a real content change: a product title becomes long, a translated label expands, a sidebar is removed, a card gains a badge, or a dashboard is viewed at a narrow width. A layout that looked correct with placeholder text can suddenly push the page wider than the viewport, compress a chart to zero, or create a large empty region because a track was sized with the wrong minimum.

A senior engineer treats Grid as an explicit contract between content and available space. The contract should state which dimensions are fixed, which are flexible, which are allowed to shrink below intrinsic content sizes, and how extra items should flow. That makes layout behavior predictable and easier to review.

Grid is especially valuable for dashboards, editorial layouts, product catalogs, application shells, image galleries, pricing comparisons, and forms with aligned labels and controls. It can express rows and columns together, while Flexbox is usually simpler when the primary task is arranging items along one axis. Choosing Grid when the design is fundamentally two-dimensional avoids brittle margins, repeated width calculations, and DOM structures that exist only to force alignment.

A production Grid system also has accessibility consequences. CSS visual placement does not change the reading order in the DOM. A grid can make a page look ordered while keyboard focus and screen-reader reading order follow a different sequence. Robust layouts preserve meaningful source order, provide visible `:focus-visible` styles, and never rely on visual reordering to communicate relationships.

---

## Core Concepts

### 1. Grid Container, Grid Items, and the Formatting Context

A grid container is an element whose computed `display` is `grid` or `inline-grid`. Its in-flow children become grid items. The container establishes a grid formatting context, so the browser lays out those items according to grid tracks and placement rules rather than normal block flow alone.

```html
<main class="catalog">
  <header class="catalog__header">
    <h1>Field Notes</h1>
    <p>Tools for the everyday explorer.</p>
  </header>
  <nav class="catalog__filters" aria-label="Catalog filters">
    <button type="button">All</button>
    <button type="button">Journals</button>
  </nav>
  <section class="catalog__products" aria-label="Products">
    <article class="product-card"><h2>Trail Journal</h2></article>
    <article class="product-card"><h2>Weatherproof Notebook</h2></article>
  </section>
</main>
```

```css
.catalog {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 18rem);
  grid-template-areas:
    "header header"
    "products filters";
  gap: 1.5rem;
}
.catalog__header { grid-area: header; }
.catalog__filters { grid-area: filters; }
.catalog__products { grid-area: products; }
```

The example is intentionally semantic: `main`, `header`, `nav`, `section`, `article`, headings, and buttons communicate structure independently of the layout. Do not add wrappers solely because Grid can position wrappers. A wrapper is justified when it represents a component boundary or owns a meaningful layout responsibility.

Grid items are the direct children of the grid container, not every descendant. If the product cards are inside `.catalog__products`, the outer grid places `.catalog__products` as one item. A second grid can be created inside it for the cards. This is nested Grid, not one giant grid spanning arbitrary descendants.

**Gotcha:** Anonymous text directly inside a grid container can become an anonymous grid item. Such items cannot be targeted with a selector or assigned explicit placement, so avoid stray text nodes when predictable placement matters.

Grid affects only the container's direct layout children. A child may itself be a grid container, flex container, or normal block container. Choose the layout model at each component boundary instead of expecting an ancestor's Grid to position all descendants.

### 2. Explicit Tracks, Implicit Tracks, and Track Definitions

Explicit tracks are created by `grid-template-columns`, `grid-template-rows`, or named template areas. If auto-placement needs more tracks than the explicit grid defines, the browser creates implicit tracks. Their sizing is controlled by `grid-auto-columns` and `grid-auto-rows`.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: auto auto;
  grid-auto-rows: minmax(12rem, auto);
  gap: 1rem;
}
```

The explicit grid above defines three columns and two auto-sized rows. If the gallery contains seven items, the seventh item creates another implicit row. The implicit row uses `minmax(12rem, auto)`, so it has a 12rem minimum but may grow to accommodate content.

Do not confuse a grid line with a grid track. A line is a boundary; a track is the space between adjacent lines. Three columns require four column lines. This distinction matters when writing line-based placement such as `grid-column: 2 / 4`, which spans the tracks between lines 2 and 4.

Explicit track definitions are part of the component's public layout contract. A fixed track can be useful for a known control rail, but fixed dimensions are dangerous when content can expand. A flexible track can absorb free space, but `1fr` has intrinsic minimum behavior that can surprise you. A `minmax()` track makes the minimum and maximum intent visible.

**Gotcha:** Implicit tracks are not automatically flexible just because explicit tracks use `1fr`. Their behavior comes from `grid-auto-columns` and `grid-auto-rows`, plus the items placed into them.

### 3. The `fr` Unit and Free-Space Distribution

The `fr` unit represents a fraction of the leftover space in the grid container after non-flexible sizing requirements and gaps have been accounted for. It is not a percentage and does not mean “this track is always this proportion of the entire container.”

```css
.dashboard {
  display: grid;
  grid-template-columns: 16rem 2fr 1fr;
  gap: 1rem;
}
```

When there is positive free space, the flexible tracks divide it in a 2:1 ratio after the fixed sidebar and gaps are considered. But track sizing includes minimum constraints. A track declared as `1fr` behaves as if it has an automatic minimum in many contexts, so a long unbreakable child may prevent the track from shrinking as far as expected.

For card layouts that must fit the available width, use an explicit zero minimum when appropriate:

```css
.dashboard__main,
.dashboard__insights {
  min-width: 0;
}
.dashboard {
  grid-template-columns: 16rem minmax(0, 2fr) minmax(0, 1fr);
}
```

`minmax(0, 1fr)` says that the track may shrink to zero rather than being held open by its min-content contribution. It does not magically make all child content fit. Text may still need wrapping, images need sizing rules, and embedded charts may need a width strategy.

Use `fr` when the design needs proportional distribution of remaining space. Use percentages when a relationship to the container's size is truly the requirement. Use fixed lengths only for dimensions that have a stable reason to remain fixed.

**Gotcha:** Two `1fr` tracks are not guaranteed to appear equal if their minimum sizing constraints differ. If equal columns are the requirement, `repeat(2, minmax(0, 1fr))` is often more reliable than `repeat(2, 1fr)` for content-heavy cards.

### 4. Intrinsic Sizing: `min-content`, `max-content`, and `auto`

Intrinsic sizing lets content participate in deciding track sizes. `min-content` is approximately the smallest size a box can take without avoidable overflow, often based on its longest unbreakable segment. `max-content` is the size needed to lay content out without soft wrapping. `auto` depends on the track-sizing algorithm and can expand to accommodate content and alignment.

```css
.article-layout {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 1rem;
}
.article-layout__label {
  white-space: nowrap;
}
.article-layout__body {
  min-width: 0;
  overflow-wrap: anywhere;
}
```

Intrinsic sizing is powerful for labels, tables, badges, and content-aware layouts, but it must be used deliberately. A `max-content` column can widen the page if a label or URL is very long. A `min-content` track can compress a heading until it wraps at every opportunity. `auto` does not mean “take the remaining space” in every situation; use `fr` for explicit free-space distribution.

For resilient content, combine track sizing with content rules. Use `overflow-wrap: anywhere` for untrusted long tokens when breaking them is acceptable. Use `min-width: 0` on grid items whose content must be allowed to shrink. Use `max-width: 100%` for media that must not exceed its containing block.

**Gotcha:** `min-content` and `max-content` are sizing keywords, not universal replacements for `min-width` or `max-width`. They participate in track sizing; the properties constrain an element's own box.

### 5. `minmax()` as a Layout Contract

`minmax(min, max)` defines a track's lower and upper sizing bounds. The minimum can prevent a track from becoming unusably small; the maximum can let it expand without allowing unlimited growth. A flexible maximum such as `1fr` can distribute available space.

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(14rem, 1fr));
  gap: 1.25rem;
}
```

This declaration expresses three columns, each with a 14rem minimum and a flexible maximum. It is appropriate only when the container is wide enough for three minimum tracks plus gaps. If the container becomes narrower, the minimums can cause overflow rather than automatically reducing the column count. That is why responsive track generation commonly uses `auto-fit` or a media/container query.

A more adaptive pattern is:

```css
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: clamp(0.75rem, 2vw, 1.5rem);
}
```

The nested `min()` prevents the minimum track size from exceeding the available container width on very narrow screens. `auto-fit` then creates as many tracks as fit and collapses empty tracks where applicable.

Do not use `minmax()` just because it looks advanced. Start with the desired minimum behavior and maximum behavior in plain language, then encode those constraints. Test with the narrowest supported container and the longest realistic content.

### 6. Repeat Functions: `repeat()`, `auto-fill`, and `auto-fit`

`repeat()` avoids duplicating track definitions. Numeric repetition creates a known number of tracks; `auto-fill` and `auto-fit` let the browser determine how many repetitions fit into the available space.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
  gap: 1rem;
}
```

`auto-fit` collapses empty repeated tracks after placement, allowing existing cards to expand into the space. `auto-fill` preserves empty tracks, which can leave unused track-sized space when there are fewer items than available columns. Neither choice is universally superior; it depends on whether empty slots should reserve the grid's rhythm.

Use `auto-fit` for many card galleries where a small number of cards should stretch to use the row. Use `auto-fill` when preserving the potential column rhythm matters, such as a catalog where future items may fill visible slots. Test both with one item, exactly enough items for one row, and one item more than a full row.

**Gotcha:** `auto-fit` does not guarantee one column on every small viewport. If the minimum track size is wider than the container and is not constrained with `min()`, overflow is still possible.

### 7. Placement by Lines, Spans, and Named Areas

Grid items can be placed using line numbers, named lines, spans, or named areas. Line-based placement is precise and useful for application shells. Named areas make a page-level composition readable when regions have stable semantic names.

```css
.app-shell {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "topbar topbar"
    "sidebar content"
    "footer footer";
  min-height: 100vh;
  gap: 1rem;
}
.app-shell__topbar { grid-area: topbar; }
.app-shell__sidebar { grid-area: sidebar; }
.app-shell__content { grid-area: content; }
.app-shell__footer { grid-area: footer; }
```

Named areas are especially clear when a layout has a small number of meaningful regions. Each row in `grid-template-areas` must contain the same number of cells, and an area's cells must form one rectangle. Use a period (`.`) for an empty cell.

Line placement supports `grid-column: 1 / 3`, `grid-row: 2 / span 2`, and named lines such as `[main-start]`. Named lines are valuable in reusable complex templates, but excessive line naming can become more difficult to scan than areas. Choose the least complicated placement system that describes the design.

Visual placement should not be used to scramble the reading sequence. Keep DOM order meaningful for keyboard navigation and screen readers. CSS placement changes the visual position, not the source order. If a layout looks logical only after items have been visually reordered, revisit the markup and the interaction flow.

### 8. Auto-Placement and Dense Packing

When an item has no explicit placement for one or both axes, the auto-placement algorithm positions it in the grid. `grid-auto-flow: row` fills across rows by default; `column` fills down columns. `dense` asks the browser to backfill earlier holes when later items fit.

```css
.mosaic {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: 8rem;
  grid-auto-flow: row;
  gap: 0.75rem;
}
.mosaic__feature { grid-column: span 2; grid-row: span 2; }
.mosaic__wide { grid-column: span 2; }
```

Auto-placement is excellent for galleries and repeated content where the exact position of every card is not meaningful. It is less appropriate when the visual order communicates a sequence, ranking, or workflow. `grid-auto-flow: dense` can place a later item into an earlier visual hole, causing the visual order to differ from the DOM order.

That difference matters for keyboard focus, screen-reader navigation, and users who zoom or use assistive technology. Use dense packing only when the items are independent and a reordered visual arrangement does not alter meaning. Never use it to hide a content-order problem.

For dashboards, explicit placement can make important panels stable while auto-placement handles secondary widgets. Document which panels are intentionally positioned and which may flow into implicit tracks.

### 9. Alignment: Container Alignment Versus Item Alignment

Grid has several alignment properties with distinct scopes. `justify-items` and `align-items` align items inside their grid areas. `justify-content` and `align-content` distribute the grid tracks within the container when there is extra space. `justify-self` and `align-self` override alignment for one item. The `place-*` shorthands combine corresponding axes.

```css
.form-grid {
  display: grid;
  grid-template-columns: 10rem minmax(0, 1fr);
  align-items: center;
  column-gap: 1rem;
  row-gap: 1.25rem;
}
.form-grid__control {
  justify-self: stretch;
  min-width: 0;
}
```

Alignment does not replace track sizing. `justify-content: space-between` can distribute tracks in a container with extra space, but it will not repair a track that has expanded due to intrinsic content. Similarly, `align-items: center` may center controls vertically, but it does not make a long label fit into a narrow column.

For most application layouts, `stretch` is the useful default for items that should fill their grid areas. Use `start`, `center`, or `end` when the content should preserve its intrinsic size. Use `baseline` when typographic alignment is the goal and the participating items have meaningful baselines.

**Gotcha:** `align-content` and `justify-content` align the grid as a whole, not the contents of each card. If a button inside a card is misaligned, inspect item alignment and the card's internal layout first.

### 10. Grid Gaps, Box Sizing, and Available Space

`gap`, `row-gap`, and `column-gap` create gutters between tracks. Gaps are part of the layout calculation, so they reduce the space available to tracks. They are not margins attached to each child and do not create extra space around the outside edges of the grid.

```css
.metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem 1.5rem;
}
```

The two-value `gap` shorthand sets row gap first and column gap second. Track widths plus column gaps must fit the container. Three tracks at `1fr` with two gaps do not receive the entire container width independently; the browser accounts for those gaps before distributing flexible space.

`box-sizing: border-box` is useful as a global sizing convention because declared widths include padding and borders. It does not mean gaps are included in a child width; gaps belong to the grid container's track layout. Avoid adding negative margins to compensate for misunderstood gap behavior.

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

When calculating a fixed multi-column layout manually, count the tracks and the gaps between them. Prefer `repeat()` with flexible tracks instead of fragile `calc()` arithmetic unless the design has a real fixed-width requirement.

### 11. Nested Grids and Subgrid

A nested grid creates a separate grid formatting context inside a grid item. It is the normal way to build a card grid inside a page shell. `subgrid` lets a nested grid use the track sizing of its parent on a selected axis, which can align internal elements across sibling cards or sections.

```css
.pricing {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.pricing-card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}
```

In a standard nested grid, each card's internal rows are sized independently. If one card has a two-line title and another has a one-line title, their feature lists may begin at different vertical positions. A subgrid can share row tracks when the markup and parent track structure support that relationship.

```css
.pricing {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: auto auto auto;
  gap: 1rem;
}
.pricing-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
}
```

Subgrid support is broadly available in current evergreen browsers, but verify the actual browser support policy for the product. Provide a sensible nested-grid fallback if the application must support older browsers. Do not introduce subgrid only to avoid a small amount of harmless variation; it is most useful when shared alignment is a real design requirement.

### 12. Grid Sizing, Overflow, and Min-Size Constraints

One of the most common Grid bugs is a flexible track that refuses to shrink. Grid items often have an automatic minimum size based on their contents. A long URL, wide table, chart canvas, or nested flex row can therefore force the track beyond the available width.

```css
.page {
  display: grid;
  grid-template-columns: 18rem minmax(0, 1fr);
  gap: 1.5rem;
}
.page__main {
  min-width: 0;
}
.page__main img,
.page__main video,
.page__main canvas {
  max-width: 100%;
}
```

`min-width: 0` is often the crucial declaration on a grid item that should be allowed to shrink. `minmax(0, 1fr)` is often the crucial track definition. They solve related but different constraints: one changes the track's minimum, and the other changes the item's own minimum size behavior.

Do not immediately apply `overflow: hidden` to the entire page. That can conceal content, clip focus rings, hide menus, and make debugging harder. Identify the element whose intrinsic width is causing the problem, then choose whether to wrap, scroll, constrain, or intentionally clip that content.

**Gotcha:** A nested flex container can be the source of a Grid overflow. Inspect the full ancestor chain and check both grid tracks and nested children instead of assuming the outer grid is solely responsible.

### 13. Responsive Grid as a Container-Aware System

A responsive grid should respond to the space available to the component, not merely to familiar device labels. A card grid inside a narrow sidebar has different needs from the same grid across a full desktop page. `auto-fit`, `minmax()`, `min()`, and container queries can create component-level behavior without a long list of viewport breakpoints.

```css
.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: clamp(0.75rem, 1.5vw, 1.5rem);
}
```

This grid can adapt as its containing block changes. When a layout requires a structural change—for example, filters move above the results instead of beside them—a media query or container query can change the template areas or columns.

```css
.results-layout {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  gap: 1.5rem;
}
@container results-panel (max-width: 42rem) {
  .results-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

A container query requires an ancestor that establishes the relevant query container, for example `container-type: inline-size`. Name the container when several nested containers could otherwise make the query target ambiguous.

```css
.results-panel {
  container: results-panel / inline-size;
}
```

Do not use a container query as a substitute for correct intrinsic sizing. First make the tracks and children shrink and wrap correctly; then add a structural switch at the width where the composition genuinely needs to change.

### 14. Grid Debugging and Browser Inspection

Grid debugging starts by asking what the browser actually created. Use the Grid overlay in DevTools to display track boundaries, line numbers, named areas, gaps, and item placement. Inspect computed values rather than relying only on the source stylesheet: a later rule, media query, cascade layer, or inherited custom property may change the final declaration.

A useful debugging sequence is:

1. Select the grid container in DevTools and enable its Grid overlay.
2. Read the computed `display`, `grid-template-columns`, `grid-template-rows`, `grid-auto-flow`, `grid-auto-columns`, and `grid-auto-rows`.
3. Check whether the unexpected track is explicit or implicit.
4. Inspect the item that appears too wide, especially its `min-width`, `width`, `white-space`, and intrinsic content.
5. Temporarily change `1fr` to `minmax(0, 1fr)` and test whether the overflow disappears.
6. Compare `scrollWidth` with `clientWidth` on the container and likely descendants.
7. Test the same component with realistic long text, missing images, and a narrow containing block.

```js
const grid = document.querySelector(".results-layout");
const styles = getComputedStyle(grid);

console.table({
  display: styles.display,
  columns: styles.gridTemplateColumns,
  rows: styles.gridTemplateRows,
  autoFlow: styles.gridAutoFlow,
  autoColumns: styles.gridAutoColumns,
  autoRows: styles.gridAutoRows,
  clientWidth: grid.clientWidth,
  scrollWidth: grid.scrollWidth
});
```

Use this helper only after the component exists in the page. If the selector returns `null`, inspect the selector and timing before reading computed styles. Remove temporary debug scripts from production bundles or keep them behind an explicit development-only path.

```js
const gridItems = [...document.querySelectorAll(".results-layout > *")];

console.table(gridItems.map((item, index) => {
  const styles = getComputedStyle(item);
  const rect = item.getBoundingClientRect();

  return {
    index,
    tag: item.tagName.toLowerCase(),
    column: styles.gridColumn,
    row: styles.gridRow,
    minWidth: styles.minWidth,
    width: Math.round(rect.width),
    scrollWidth: item.scrollWidth
  };
}));
```

### 15. Writing Modes, Source Order, and Accessibility

Grid placement properties use logical axes: columns generally correspond to the inline axis and rows to the block axis, but the physical direction depends on the writing mode and direction. Do not assume that “start” always means left or that a line number always maps to a physical left-to-right direction.

Keep DOM order aligned with the natural reading and interaction sequence. `grid-template-areas`, explicit line placement, and dense packing can create a visual sequence different from source order. Screen readers and keyboard navigation generally follow the DOM and interaction semantics rather than the visual grid coordinates.

```css
.toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}
.toolbar button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Use semantic elements such as `main`, `section`, `nav`, `article`, `form`, `label`, and `button` when they match the content. Use `aria-label` only when a visible label or semantic context does not already provide an accessible name. Grid is a visual layout tool, not a replacement for semantic HTML.

Test keyboard navigation at every responsive layout. Make sure focus does not appear to jump backward across the page because CSS visually rearranged controls. Confirm that focus rings are not clipped by overflow rules, and preserve sufficient spacing for touch targets where controls are dense.

### 16. Grid and Dynamic Content: Realistic Stress Tests

The most useful Grid test data is designed to challenge assumptions. Use one card, two cards, one more card than a full row, a title that is a long unbroken string, a translated label, a missing image, and a card with a validation message. A layout that works only with ideal placeholder content is not production-ready.

```html
<section class="card-grid" aria-labelledby="related-heading">
  <h2 id="related-heading">Related resources</h2>
  <article class="resource-card">
    <h3>CSS Grid: A Comprehensive Field Guide for Complex Interfaces</h3>
    <p>Longer copy helps reveal intrinsic sizing assumptions.</p>
    <a href="/grid-guide">Read the guide</a>
  </article>
  <article class="resource-card">
    <h3>API</h3>
    <p>Short content should not collapse the component.</p>
    <a href="/api">Explore API</a>
  </article>
</section>
```

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
}
.resource-card {
  min-width: 0;
  display: grid;
  align-content: start;
  gap: 0.75rem;
}
.resource-card h3 {
  overflow-wrap: anywhere;
}
.resource-card img {
  display: block;
  width: 100%;
  height: auto;
}
```

A good stress test checks both dimensions. Horizontal overflow is obvious, but vertical overflow can also occur when rows are fixed and content is larger than expected. Prefer content-driven rows for variable-height content unless the design explicitly needs a fixed visual rhythm and has a safe overflow strategy.

---

## Reusable Patterns

### Pattern 1 — Adaptive Card Grid

**What it does:** Creates as many equal-width cards as fit, while keeping each card above a practical minimum width.

**When to use it:** Use it for product cards, related articles, team profiles, resource libraries, or any repeated collection where the exact number of columns should follow the available container width.

```css
.adaptive-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: clamp(0.75rem, 2vw, 1.5rem);
}
.adaptive-cards > article {
  min-width: 0;
}
```

The inner `min(100%, 17rem)` protects a narrow container from a minimum track wider than the available space. `auto-fit` allows the existing cards to occupy the available row width. Use `auto-fill` instead if preserving empty track slots is part of the intended visual rhythm.

Do not use a fixed `grid-template-columns: repeat(4, 1fr)` for a reusable component unless its container contract guarantees the necessary width. Test the same component in a page, a sidebar, and a modal.

### Pattern 2 — Application Shell with a Shrinkable Main Region

**What it does:** Creates a stable navigation rail and a flexible content region without allowing the main region's min-content width to force page overflow.

**When to use it:** Use it for dashboards, admin panels, mail clients, project-management interfaces, and other app shells with a persistent navigation region.

```css
.app-shell {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  min-height: 100vh;
  gap: 1rem;
}
.app-shell__main {
  min-width: 0;
}
@media (max-width: 48rem) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

The `minmax(0, 1fr)` track lets the main region shrink; `min-width: 0` gives the grid item permission to shrink below its automatic minimum. The media query changes the composition when a side-by-side shell no longer works comfortably.

If the sidebar becomes a drawer on mobile, ensure the interaction exposes and hides it accessibly. CSS Grid does not implement the drawer's keyboard behavior, focus management, or accessible naming.

### Pattern 3 — Named-Area Editorial Layout

**What it does:** Expresses a page composition with named regions so the template can be read as a map of the design.

**When to use it:** Use it for article pages, marketing pages, documentation layouts, and content pages with stable header, main, aside, and footer regions.

```css
.editorial {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 20rem);
  grid-template-areas:
    "header header"
    "main aside"
    "footer footer";
  gap: 1.5rem;
}
.editorial__header { grid-area: header; }
.editorial__main { grid-area: main; min-width: 0; }
.editorial__aside { grid-area: aside; }
.editorial__footer { grid-area: footer; }

@media (max-width: 52rem) {
  .editorial {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "header"
      "main"
      "aside"
      "footer";
  }
}
```

The area map documents intent directly. Keep the DOM in a meaningful reading order even when the desktop layout places an aside next to the main content. Avoid templates with disconnected shapes or mismatched row widths; the browser requires each named area to form a rectangle.

### Pattern 4 — Dashboard Track System

**What it does:** Uses flexible tracks and explicit spans to create a stable dashboard composition while allowing data panels to grow with their content.

**When to use it:** Use it for analytics dashboards, admin overview pages, reporting tools, and monitoring screens with cards of different importance.

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: minmax(8rem, auto);
  gap: 1rem;
}
.dashboard-grid__primary {
  grid-column: span 8;
}
.dashboard-grid__secondary {
  grid-column: span 4;
}
.dashboard-grid__wide {
  grid-column: 1 / -1;
}
@media (max-width: 50rem) {
  .dashboard-grid > * {
    grid-column: 1 / -1;
  }
}
```

A twelve-column system supports consistent spans without requiring twelve separate fixed widths. The `minmax(0, 1fr)` track definition reduces intrinsic minimum surprises. Use `grid-column: 1 / -1` for a panel that should span the full explicit grid width.

Charts and tables often have their own intrinsic sizing behavior. Give them a constrained wrapper, allow the grid item to shrink, and provide intentional internal scrolling when the data genuinely needs a wide viewport. Do not simply hide overflow and make data unreachable.

### Pattern 5 — Aligned Pricing Cards with Subgrid

**What it does:** Aligns repeated internal card rows—such as titles, feature lists, and actions—so sibling cards share row sizing where subgrid is supported.

**When to use it:** Use it for pricing tiers, comparison cards, feature matrices, or repeated cards whose corresponding content needs aligned baselines.

```css
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
.pricing-card {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  gap: 1rem;
  min-width: 0;
}
.pricing-card__action {
  align-self: end;
}
```

The parent must provide the rows that the subgrid spans; the example assumes each card spans three parent row tracks and that the markup maps to those rows. In a real implementation, inspect the resulting grid overlay and verify that the shared rows correspond to the intended child structure.

If the card markup does not naturally map to shared tracks, use an ordinary nested grid with `grid-template-rows: auto 1fr auto`. That alternative is simpler and often sufficient, although it does not synchronize row sizes across cards.

### Pattern 6 — Form Layout with Stable Labels and Flexible Controls

**What it does:** Aligns labels and fields in two columns while allowing controls to consume the remaining width and shrink without pushing the form outside its container.

**When to use it:** Use it for desktop forms with a consistent label column, settings pages, search filters, and configuration panels. Switch to a single column when the component becomes narrow.

```css
.settings-form {
  display: grid;
  grid-template-columns: minmax(8rem, 12rem) minmax(0, 1fr);
  gap: 1rem 1.25rem;
  align-items: start;
}
.settings-form label {
  padding-block: 0.5rem;
}
.settings-form input,
.settings-form select,
.settings-form textarea {
  width: 100%;
  min-width: 0;
}
.settings-form :focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
@media (max-width: 40rem) {
  .settings-form {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Use a real `<label>` associated with each input, and keep validation messages connected through appropriate markup and `aria-describedby` when needed. The grid only aligns the controls; it does not supply form semantics or validation behavior.

### Pattern 7 — Content-First Gallery with Intentional Spans

**What it does:** Lets ordinary gallery items auto-place while selected feature images span multiple tracks or rows.

**When to use it:** Use it for editorial image galleries, portfolio thumbnails, media libraries, and visual collections where a few items need greater emphasis.

```css
.media-gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(7rem, 14rem);
  grid-auto-flow: row;
  gap: 0.75rem;
}
.media-gallery__feature {
  grid-column: span 2;
  grid-row: span 2;
}
.media-gallery img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
@media (max-width: 42rem) {
  .media-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .media-gallery__feature {
    grid-column: span 2;
  }
}
```

Set meaningful `alt` text for informative images and empty `alt=""` for purely decorative images. `object-fit: cover` crops image content; do not use it for diagrams or text-heavy images where cropping removes information. Test source order against the visual mosaic before shipping.

### Pattern 8 — Safe Wide Data Region

**What it does:** Allows a table or chart to preserve its useful internal width while containing horizontal scrolling to a clearly identified region.

**When to use it:** Use it for dense data tables, timeline visualizations, code-like matrices, or charts whose information cannot be meaningfully compressed into a narrow column.

```css
.report-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}
.report-layout__data {
  min-width: 0;
}
.report-layout__scroll-region {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}
.report-layout table {
  min-width: 42rem;
  border-collapse: collapse;
}
```

Give the scroll region a clear accessible name when it is a meaningful interaction region, and ensure keyboard users can reach its contents. Do not make the entire page horizontally scroll when only one table requires more width. For critical data, provide a responsive alternative or summary where appropriate.

---

## Common Mistakes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Using `1fr` and expecting a track to shrink below all content | Flexible sizing still interacts with intrinsic minimum contributions from items | Change the track to `minmax(0, 1fr)` and set `min-width: 0` on the relevant grid item |
| Defining three fixed minimum columns on a narrow component | Minimum track sizes are constraints, not suggestions that disappear when the viewport shrinks | Use `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))` for a self-adapting card grid |
| Assuming `auto` always means “fill the remaining space” | `auto` participates in intrinsic sizing and alignment rules rather than directly expressing a fraction | Use `minmax(0, 1fr)` when the track should consume remaining space and be allowed to shrink |
| Using `grid-template-areas` with rows of different cell counts | Every area-map row must describe the same number of grid cells | Rewrite each area-map row to the same number of whitespace-separated tokens and use `.` for empty cells |
| Giving a named area a non-rectangular shape | Grid named areas must occupy one rectangle | Redraw the template so each named region forms a rectangle, or switch to line-based placement |
| Applying `grid-auto-flow: dense` to a numbered workflow | Dense packing can move later DOM items into earlier visual holes | Remove `dense` and preserve normal auto-placement for meaningful sequences |
| Fixing horizontal overflow with `overflow: hidden` on the page | Clipping hides the symptom without identifying the element that exceeds the container | Compare `scrollWidth` and `clientWidth`, then fix the offending track or descendant's minimum width |
| Placing every child explicitly even when the collection is repeated | Explicit coordinates couple content count to a hand-authored layout | Use auto-placement for ordinary items and reserve explicit spans for exceptional panels |
| Expecting `gap` to add space outside the grid | Gaps are gutters between tracks, not outer padding | Add `padding` to the grid container when the outside edge needs breathing room |
| Using `justify-content` to repair a too-wide card | Container-level track distribution does not override a track's intrinsic minimum size | Inspect track sizing and apply a suitable `minmax()` minimum before changing alignment |
| Visually reordering buttons with placement alone | CSS visual order does not rewrite DOM or keyboard navigation order | Reorder the markup to match the interaction sequence, then use Grid for spatial alignment |
| Assuming nested grids share row heights automatically | A nested grid has its own independent track-sizing context | Use `subgrid` when sibling alignment is required, or design a local `auto 1fr auto` card grid |
| Forgetting implicit track sizing | Extra items create tracks whose sizes come from `grid-auto-rows` or `grid-auto-columns` | Set the relevant `grid-auto-*` property and test with more items than the explicit template can hold |
| Using `max-content` for user-controlled text without a limit | No-wrap intrinsic width can be larger than the available container | Use a shrinkable track and add `overflow-wrap: anywhere` where breaking long tokens is acceptable |
| Giving charts and canvases an unconstrained intrinsic width | Replaced elements or embedded content may retain a large preferred size | Constrain the wrapper with `min-width: 0` and set media to `max-width: 100%` |
| Using fixed row heights for variable article copy | Content can exceed a fixed track's available space | Prefer `grid-auto-rows: minmax(0, auto)` or content-driven rows unless the design has a tested clipping/scrolling rule |
| Treating line numbers as permanent item identifiers | Inserted tracks and template changes can shift the meaning of numeric lines | Use named areas for stable page regions or named lines for complex reusable templates |
| Using `auto-fit` without testing a single remaining item | Empty tracks collapse, so a lone item can stretch farther than the design expects | Add a `max-width` and centering rule to the item if single-item expansion is undesirable |
| Setting `width: 100%` but leaving a form control's minimum unconstrained | The control's minimum sizing can still conflict with the grid track | Apply `min-width: 0` to the control and verify its border-box sizing |
| Adding a container query without establishing a query container | The rule may query a different ancestor or fail to match the intended component context | Add `container-type: inline-size` or a named `container` declaration to the intended ancestor |
| Relying on visual Grid order to imply semantic grouping | Visual adjacency does not create document relationships or accessible names | Use meaningful headings, lists, labels, and DOM nesting that represent the relationship |
| Applying `object-fit: cover` to informative diagrams | Cropping can remove labels and details that convey essential information | Use `object-fit: contain` or intrinsic height for diagrams and provide useful alternative text |
| Hiding overflow around a focused control | The focus outline can be clipped at the scroll or grid boundary | Remove unnecessary clipping or add internal space and verify `:focus-visible` outlines in keyboard tests |
| Using percentage tracks plus gaps without accounting for total width | Percentages can sum to the full container before the additional gutters are considered | Prefer fractional tracks with `gap`, or explicitly subtract gutters when a percentage design is required |

### Before → After: Fixing a Grid That Refuses to Shrink

**Before — fragile**

```css
.workspace {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 24px;
}
.workspace__content {
  /* A wide table or long token can force the second track wider. */
}
```

**After — explicit shrink behavior**

```css
.workspace {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 1.5rem;
}
.workspace__content {
  min-width: 0;
}
.workspace__table-region {
  max-width: 100%;
  overflow-x: auto;
}
```

The fix separates two concerns. The track is allowed to shrink below its automatic minimum, and the grid item is allowed to become narrower than its content's min-content width. The table gets its own intentional scroll region instead of forcing the entire page to overflow.

---

## Mental Models

1. **A grid line is a boundary; a track is the space between boundaries.** Count lines when placing items and count tracks when reasoning about available space.
2. **`fr` divides leftover space, not the entire container.** Gaps and non-flexible sizing requirements are resolved before flexible space is distributed.
3. **Intrinsic minimums are constraints, not bugs.** When a track refuses to shrink, ask which content contribution is imposing the minimum.
4. **`minmax(0, 1fr)` is a permission statement.** It permits the track to become narrower than its content's natural minimum; children still need sensible wrapping or scrolling behavior.
5. **Explicit placement is for meaningful exceptions; auto-placement is for collections.** The more items depend on hand-authored coordinates, the more fragile the layout becomes when content changes.
6. **A nested grid owns its own tracks unless it deliberately uses `subgrid`.** Similar markup does not automatically create shared row alignment.
7. **Visual order is not reading order.** Preserve source order for semantics and keyboard navigation even when Grid creates a complex visual composition.
8. **Gaps belong to the grid's track calculation.** They are not outer margins and should not be subtracted twice in manual width arithmetic.
9. **Responsive design starts with the component's available space.** Use intrinsic track sizing for ordinary adaptation and queries for genuine structural changes.
10. **Debug the created grid, not the intended grid.** DevTools overlays and computed styles reveal the tracks the browser actually resolved.
11. **A layout is only proven by hostile content.** Long labels, missing images, localized copy, and unusual item counts expose hidden sizing assumptions.
12. **Contain overflow at the correct boundary.** A wide table may need a scroll region; the whole application shell usually does not.
13. **Semantic structure is independent of spatial placement.** Grid aligns boxes, while HTML expresses meaning and relationships.
14. **Choose the simplest model that explains the layout.** A named-area template is easier to maintain than dozens of unexplained line numbers when the page has stable regions.

---

## Quick Reference

| Situation / property | Recommended starting point | Notes |
|---|---|---|
| Equal content-heavy columns | `repeat(3, minmax(0, 1fr))` | Reduces automatic minimum sizing surprises |
| Adaptive card collection | `repeat(auto-fit, minmax(min(100%, 17rem), 1fr))` | Tests well inside narrow component containers |
| Stable sidebar + fluid content | `15rem minmax(0, 1fr)` | Also set `min-width: 0` on the main grid item |
| Extra rows from auto-placement | `grid-auto-rows: minmax(10rem, auto)` | Controls implicit row sizing |
| Extra columns from auto-placement | `grid-auto-columns: minmax(12rem, 1fr)` | Controls implicit column sizing |
| Two-dimensional page regions | `grid-template-areas` | Every area must be rectangular and rows must have equal cell counts |
| Item spans to the end | `grid-column: 1 / -1` | Uses the final explicit grid line |
| Item spans two tracks | `grid-column: span 2` | Useful for dashboards and mosaics |
| Space between tracks | `gap: 1rem` | Does not create outer padding |
| Different row and column gutters | `gap: 1rem 1.5rem` | First value is row gap, second is column gap |
| Allow a grid item to shrink | `min-width: 0` | Particularly useful for nested flex, charts, tables, and long text |
| Align items within their areas | `align-items`, `justify-items` | Container-to-item alignment, not track sizing |
| Align one item | `align-self`, `justify-self` | Overrides container item alignment for that item |
| Distribute tracks in extra space | `align-content`, `justify-content` | Does not solve intrinsic overflow |
| Preserve potential empty columns | `auto-fill` | Empty repeated tracks remain part of the layout |
| Collapse empty repeated columns | `auto-fit` | Remaining items can expand into the space |
| Share nested row tracks | `subgrid` | Confirm the parent tracks and child structure match |
| Long unbroken text | `overflow-wrap: anywhere` | Use when breaking tokens is acceptable |
| Wide table inside a card | `min-width: 0` + an intentional `overflow-x: auto` region | Avoid page-wide horizontal scrolling |
| Responsive composition switch | `@media` or `@container` | Use when the layout structure genuinely changes |
| Inspect resolved tracks | DevTools Grid overlay and computed styles | Verify explicit vs implicit tracks and actual line placement |

---

## DevTools and Debugging Checklist

Use this sequence when a grid is visually wrong:

1. Confirm the intended grid container is the element with `display: grid` or `inline-grid`.
2. Enable the Grid overlay and show line numbers and track sizes.
3. Inspect computed `grid-template-columns` and `grid-template-rows`; do not rely on a shorthand's source text alone.
4. Check `grid-auto-flow`, `grid-auto-rows`, and `grid-auto-columns` if items appear in unexpected places.
5. Select the widest grid item and inspect its `min-width`, `width`, `white-space`, and child dimensions.
6. Check whether a nested flexbox, image, canvas, iframe, or table is imposing a large intrinsic size.
7. Compare `scrollWidth` and `clientWidth` on the container and descendants to find the element creating overflow.
8. Temporarily replace `1fr` with `minmax(0, 1fr)` to test whether an automatic minimum is responsible.
9. Check whether the grid has more items than explicit tracks and is creating implicit tracks.
10. Test with long content, an empty collection, a single item, and one item beyond a complete row.
11. Test keyboard navigation after any visual reordering, and inspect focus rings near overflow boundaries.
12. Remove temporary outlines and debug scripts after confirming the actual root cause.

A compact helper can make the first pass repeatable:

```js
function inspectGrid(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element matched selector: ${selector}`);
    return;
  }

  const styles = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  console.table({
    display: styles.display,
    gridTemplateColumns: styles.gridTemplateColumns,
    gridTemplateRows: styles.gridTemplateRows,
    gridAutoFlow: styles.gridAutoFlow,
    gridAutoColumns: styles.gridAutoColumns,
    gridAutoRows: styles.gridAutoRows,
    width: Math.round(rect.width),
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    horizontalOverflow: element.scrollWidth > element.clientWidth
  });
}

inspectGrid(".dashboard-grid");
```

The helper reports facts, not a diagnosis. If `horizontalOverflow` is true, inspect descendants and their computed widths before deciding whether to wrap, constrain, scroll, or clip the content. Avoid treating `overflow: hidden` as the default repair.

---

## Build Challenge — Production Analytics Workspace

Build an analytics workspace that includes a navigation rail, a page header, summary cards, a primary chart, a secondary insight panel, and a wide data table. The challenge is not merely to make the desktop screenshot look correct. The layout must remain stable as the content and container width change.

### Requirements

1. Create a semantic page structure using `main`, `header`, `nav`, `section`, `article`, and `button` where each element's meaning fits.
2. Define a desktop app shell with a navigation rail and a main content track using `minmax(0, 1fr)` for the flexible region.
3. Build a summary-card collection with `repeat()` and `minmax()` so the number of columns follows the available width.
4. Ensure the card grid works when it is placed inside a narrow parent, not just when it spans the entire viewport.
5. Create a dashboard track system that allows the primary chart to span more columns than the secondary insight panel.
6. Define `grid-auto-rows` intentionally and demonstrate what happens when one extra widget creates an implicit row.
7. Use named template areas for the page-level composition, then change the template at a narrow breakpoint without changing DOM order.
8. Add a table with enough columns to exceed the content region and contain its horizontal scrolling in a named wrapper.
9. Test a long, unbroken title and decide whether to wrap it with `overflow-wrap`, scroll it, or constrain it; document the choice.
10. Test the page with one summary card, two cards, a full row of cards, and one card beyond a full row.
11. Demonstrate the difference between `auto-fit` and `auto-fill` with a small collection, and explain which behavior you chose.
12. Use `:focus-visible` styling for interactive controls and verify focus rings remain visible around the navigation and table scroll region.
13. Verify the DOM reading order and keyboard order at desktop and mobile widths; do not rely on dense packing to communicate sequence.
14. Use DevTools Grid overlays to inspect the explicit tracks, implicit tracks, gaps, and named areas.
15. Write a debugging note that identifies the exact element responsible if `scrollWidth` exceeds `clientWidth`.
16. Test a nested flex row inside a grid item and fix any automatic minimum sizing issue without hiding page overflow.
17. If using container queries, define the query container explicitly and explain why the component needs a structural change at that width.
18. Test long localized labels and a validation message in a form-like panel to ensure the label track and control track still fit.
19. Confirm informative images have appropriate `alt` text and decorative images use empty `alt` attributes.
20. Include a reduced-motion-safe interaction if the page uses animation, and respect `prefers-reduced-motion`; do not add motion solely to satisfy the requirement.
21. Explain when you would use Grid rather than Flexbox for at least three regions in the workspace.
22. Document the behavior of `minmax(0, 1fr)` and `min-width: 0` in your own words with a before/after reproduction.
23. Add a short browser-support note for any use of `subgrid` and provide a fallback if the product's supported browser matrix requires it.
24. Confirm no content is clipped by an ancestor's `overflow` rule and that any intentional scroll region is reachable by keyboard.

### Definition of done

- [ ] The page has no accidental horizontal overflow at the minimum supported viewport and at intermediate container widths.
- [ ] The summary cards adapt without a long list of device-specific breakpoints.
- [ ] The main chart and insight panel use intentional track spans and collapse sensibly at narrow widths.
- [ ] Extra widgets use the declared implicit-track sizing rather than unpredictable defaults.
- [ ] The wide table scrolls inside its own region and does not widen the whole application shell.
- [ ] DOM order, screen-reader reading order, and keyboard focus order remain coherent at every layout size.
- [ ] Focus indicators are visible and not clipped by the grid or scroll-region boundaries.
- [ ] The DevTools overlay confirms the expected explicit and implicit tracks.
- [ ] A long title, long token, empty state, missing image, and one-item collection have all been tested.
- [ ] The debugging note names the cause of any reproduced overflow and explains why the selected fix works.
- [ ] The implementation uses semantic HTML and avoids meaningless wrapper chains.
- [ ] Every responsive change has a reason tied to available space or content, not an arbitrary device label.

### Failure investigation: the main panel still overflows

Reproduce the failure with a long table cell and a nested flex row containing a non-wrapping button group. Inspect the computed width of the main grid track and the `min-width` of the direct grid item. Then inspect the nested flex children for `white-space: nowrap`, fixed widths, or intrinsic-size constraints.

Do not apply `overflow-x: hidden` to `body` as the first response. First test `minmax(0, 1fr)` on the flexible track and `min-width: 0` on the main grid item. If the table legitimately needs more width, keep that width inside its scroll wrapper. If a button label can wrap, allow it to wrap; if it cannot, define a deliberate local scrolling or stacking strategy.

After the fix, compare `scrollWidth` and `clientWidth` again, inspect the Grid overlay, and test keyboard navigation through the scroll region. The finished layout should have an explicit explanation for every remaining overflow boundary.

---

## Final Review Checklist

Before treating this skill as complete, verify:

- [ ] Track definitions describe the intended minimum and maximum behavior.
- [ ] Every `fr` track has been tested with realistic intrinsic content.
- [ ] Explicit and implicit tracks are understood and intentionally sized.
- [ ] Auto-placement is used for collections and explicit placement for meaningful exceptions.
- [ ] Named areas are rectangular and each template row has the same number of cells.
- [ ] `auto-fit` and `auto-fill` are selected based on the desired empty-track behavior.
- [ ] Grid gaps are accounted for without unnecessary width arithmetic.
- [ ] Nested grids and subgrid are chosen according to the actual alignment requirement.
- [ ] Overflow is diagnosed at the responsible track or child instead of hidden at page level.
- [ ] Responsive behavior is tested at the component's actual container widths.
- [ ] Semantic HTML, accessible names, keyboard order, and `:focus-visible` states are preserved.
- [ ] DevTools overlays and computed styles have been used to verify the resolved layout.
- [ ] The build challenge's definition-of-done checks pass on realistic content.


## Field note: fr tracks are resolved after non-flexible sizing

A useful way to reason about `fr` is to imagine that the browser first accounts for track requirements that do not simply divide free space, then distributes the remaining positive free space among flexible tracks. Gaps also consume space. This is why adding a wider fixed sidebar or a larger gap changes the available width for every flexible track.

When a layout unexpectedly wraps, record the container's content-box width, the number and size of gaps, and the computed track sizes from DevTools. Avoid mental arithmetic based on the viewport width alone: container padding, borders, scrollbars, and nested parent constraints may all reduce the usable inline size.

```css
.two-panel {
  display: grid;
  grid-template-columns: 17rem minmax(0, 1fr);
  gap: 1.25rem;
}
.two-panel__body {
  min-width: 0;
}
```

Review prompt: if the sidebar grows by 4rem, which track should lose space? If the answer is not obvious from the template, simplify the track definitions or document the constraint.


## Field note: automatic minimum sizes are often the hidden constraint

When a flexible track seems to ignore the available width, inspect its items before changing the container width. A grid item can have an automatic minimum based on min-content. A child with `white-space: nowrap`, a wide intrinsic image, or a nested flex container can contribute a minimum larger than the region the design expects.

The correct fix depends on the content. `min-width: 0` lets the grid item shrink; `overflow-wrap: anywhere` allows long tokens to break; `max-width: 100%` constrains media; and `overflow-x: auto` can contain genuinely wide data. These are not interchangeable fixes.

```css
.report-main {
  min-width: 0;
}
.report-main .long-reference {
  overflow-wrap: anywhere;
}
.report-main img {
  max-width: 100%;
  height: auto;
}
```

Review prompt: identify the first ancestor whose rendered width exceeds its containing block. Fix the earliest incorrect constraint instead of clipping a higher ancestor.


## Field note: use named areas to communicate intent

Named areas are especially useful for page-scale composition because the template resembles a small map. A reviewer can understand the intended relationship between a header, main region, aside, and footer without mentally translating numeric line numbers.

Keep the template readable. Each row needs the same number of cells, and every named area must be rectangular. A dot represents an intentionally empty cell. When a layout is highly irregular or items span many lines, named lines or explicit placement may be clearer than a large area map.

```css
.page-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  grid-template-areas:
    "heading heading"
    "content related"
    "footer footer";
  gap: 1.5rem;
}
```

Review prompt: can a teammate infer the visual composition from the template alone? If not, choose clearer area names or a simpler grid.


## Field note: auto-fit and auto-fill encode different empty-space policies

Both keywords calculate how many repeated tracks can fit, but they differ when some repeated tracks have no items. `auto-fit` collapses empty repeated tracks, allowing occupied tracks to expand. `auto-fill` preserves the empty tracks and can leave visible reserved slots.

For a card list, `auto-fit` is often a natural default because a lone card can use the available space. For a carefully aligned catalog where each potential slot should keep its width, `auto-fill` may be more suitable. A single screenshot with many cards will not reveal the distinction; test a collection with one or two items.

```css
.collection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}
```

Review prompt: what should happen when only one result is returned? If it should not become very wide, give the card a maximum width and use a deliberate alignment rule.


## Field note: grid placement must respect source order

CSS Grid can visually place an item almost anywhere in the grid, but it does not rewrite the DOM. This makes it possible to create a polished desktop composition while accidentally confusing keyboard users or screen-reader users. Dense auto-placement is especially risky because later content can occupy earlier visual holes.

Use source order that makes sense when styles are absent or the layout collapses to one column. Treat visual placement as presentation. If the visual layout communicates a sequence, ranking, or step-by-step process, keep that sequence intact in the DOM.

```css
.workflow {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
@media (max-width: 44rem) {
  .workflow {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Review prompt: use only the keyboard to move through every control at wide and narrow sizes. Does focus follow the visual story closely enough that a user can predict the next control?


## Field note: subgrid is an alignment tool, not a default

Subgrid lets a nested grid participate in its parent's track sizing along an axis. It is valuable when repeated child elements must align across sibling components, such as pricing-card headings, features, and action rows. It is not required merely because components contain grids inside grids.

Before adopting it, verify that the child spans the intended parent tracks and that the markup maps to those tracks. If each card needs only its own header, flexible body, and footer, an ordinary nested grid with `grid-template-rows: auto 1fr auto` is often simpler.

```css
.card {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
}
```

Review prompt: is the alignment requirement across sibling cards or only inside each card? Use subgrid for the former and a local grid for the latter.


## Field note: implicit tracks should be designed

Implicit tracks appear when auto-placement needs more tracks than the explicit template supplies. Their sizes are not a mystery; they are controlled by `grid-auto-rows` and `grid-auto-columns`, with content and sizing rules still affecting the final result.

This matters in dashboards, galleries, and feeds where the item count is not fixed. A template with three explicit columns can create a fourth row when there are more cards than fit. Decide whether those rows should be content-sized, have a minimum height, or follow a fixed visual rhythm.

```css
.activity-feed {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-rows: minmax(9rem, auto);
  gap: 1rem;
}
```

Review prompt: add five more items than the expected sample. Do the new rows have the same intended sizing and spacing as the original rows?


## Field note: alignment cannot repair sizing

Alignment properties affect how items or tracks use space after track sizing. They do not replace a correct track definition. If a card is too wide because its min-content size exceeds the container, changing `justify-content` may move the problem without solving it.

First make the track constraints correct. Then use `justify-items`, `align-items`, `justify-self`, and `align-self` for item alignment, or `justify-content` and `align-content` for the grid as a whole. This separation makes the stylesheet easier to reason about.

```css
.card-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 1rem;
}
.card-row > article {
  min-width: 0;
}
```

Review prompt: describe whether the problem is a track width, an item width, or extra space distribution before selecting an alignment property.


## Field note: gaps are not outer padding

A grid gap is a gutter between adjacent tracks. It does not add a gutter before the first track or after the last track. If the component needs space between its content and its border, use padding on the container.

Do not combine percentage tracks, gaps, and extra child margins without calculating the total. Percentages can already use the available container width, and the gaps then add additional requirements. Fractional tracks are often easier to maintain for layouts with consistent gutters.

```css
.panel-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}
```

Review prompt: sketch the outer edge, tracks, and gutters. If the total width exceeds the container, identify whether the excess comes from tracks, padding, borders, or a child minimum.


## Field note: container queries need a named owner

Container queries make reusable Grid components respond to their own available inline size. The component's ancestor must establish a query container. A named container is useful when nested components might otherwise make the query target ambiguous.

Use a query when the layout needs a structural change, such as moving filters above results or turning a two-column form into one column. Do not use it to compensate for a track that could have been fluid from the start.

```css
.results-panel {
  container: results / inline-size;
}
.results-layout {
  display: grid;
  grid-template-columns: 14rem minmax(0, 1fr);
  gap: 1rem;
}
@container results (max-width: 40rem) {
  .results-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Review prompt: name the exact component whose width triggers the change. If the answer is “the device,” consider whether a container query would better match the reusable component contract.


## Field note: test layout at the component boundary

A component can be wide in a full-page demo and narrow when reused in a modal, sidebar, split pane, or nested settings panel. Testing only viewport breakpoints misses these conditions. Test the component in its actual parent constraints and verify that it still fits when the parent changes width without a viewport resize.

Container-based adaptation and intrinsic track sizing work together. Use flexible tracks for continuous adaptation and queries when the composition must switch. Avoid creating breakpoint rules for every small width fluctuation.

```css
.widget-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 1rem;
}
```

Review prompt: resize the parent element itself in DevTools. Does the component adapt even when the viewport remains unchanged?


## Field note: accessible focus is part of layout validation

A grid can position controls near edges, within scroll containers, or inside clipped cards. Focus outlines can be cut off by `overflow: hidden`, and a dense visual layout can make keyboard movement feel unpredictable. Test focus appearance after changing tracks and overflow behavior, not only after adding the controls.

Prefer `:focus-visible` for a clear keyboard focus indicator without forcing the same ring for every pointer interaction. Do not remove outlines without a replacement. For scrollable data regions, ensure keyboard users can reach the content and understand the region's purpose.

```css
.grid-action:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Review prompt: tab through the page and inspect every focused item at the narrowest supported width. Does any ancestor clip the ring or obscure the focused control?


## Field note: browser tools show resolved tracks

The computed value of a grid template often exposes pixel-resolved track sizes rather than the authored token sequence. That is useful: the resolved sizes show what the browser actually allocated. The Grid overlay then connects those sizes to line positions and gaps.

Use both the overlay and computed styles. The overlay answers “where are the tracks?” Computed styles answer “which declarations resolved into this result?” The Elements panel can reveal a later rule or a media query that changed the template. `getComputedStyle()` and `getBoundingClientRect()` are useful for targeted scripts, but they do not replace visual inspection of the grid.

```js
const node = document.querySelector(".card-grid");
if (node) {
  const css = getComputedStyle(node);
  console.log("columns:", css.gridTemplateColumns);
  console.log("rows:", css.gridTemplateRows);
  console.log("overflow:", node.scrollWidth - node.clientWidth);
}
```

Review prompt: write down the observed track sizes before changing the CSS. This creates a reproducible baseline and avoids guessing which declaration is responsible.


## Field note: wide content needs a local policy

Some content should shrink or wrap; other content, such as a dense table, should remain wide enough to preserve its columns. The correct Grid solution does not force both cases into the same behavior. Make the main track shrinkable, then give the wide content a local policy.

For text, wrapping may be acceptable. For images, constrain their maximum width. For a table, a scrollable wrapper may preserve the data relationships better than crushing columns into unreadable widths. For a chart, check whether the chart library responds to container resizing.

```css
.grid-main {
  min-width: 0;
}
.grid-main__table-scroll {
  max-width: 100%;
  overflow-x: auto;
}
.grid-main__table-scroll table {
  min-width: 40rem;
}
```

Review prompt: identify the content's usability requirement before selecting wrapping, scaling, scrolling, or clipping.


## Field note: test implicit sizing with realistic item counts

A collection with exactly three cards may never create an implicit track if the template defines three columns and one row. Add a fourth, fifth, and tenth item to see how auto-placement and implicit row sizing behave. The same test reveals whether spans leave holes and whether dense packing changes the visual order.

For data-driven interfaces, item count is part of the input space. Empty states, a single result, and a very large result set should all be intentional. Use explicit empty-state markup rather than relying on the absence of grid items to communicate why no content appears.

```css
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  grid-auto-rows: minmax(8rem, auto);
  gap: 1rem;
}
```

Review prompt: list the item counts that could change the layout algorithm, then include each in the component's visual regression cases.


## Field note: writing direction affects physical assumptions

Grid's axes are logical. In right-to-left contexts and vertical writing modes, the physical direction associated with inline and block axes can differ from the assumptions made in a left-to-right horizontal layout. Logical alignment values such as `start` and `end` are often easier to maintain than physical `left` and `right` assumptions.

Avoid naming classes according to a physical position when the component is meant to support multiple writing directions. Test RTL if the product supports it, and verify that source order and keyboard navigation still make sense.

```css
.toolbar-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  justify-items: stretch;
  gap: 0.75rem;
}
```

Review prompt: check whether the layout depends on a physical left/right placement that should instead follow the writing direction.


## Field note: images have intrinsic dimensions

Images and other replaced elements have intrinsic dimensions and aspect ratios. A grid track can be flexible while an image still renders at a size that causes overflow if its own sizing is unconstrained. A card image usually needs a defined display behavior that matches the design.

For images that should preserve their whole content, use intrinsic height and `max-width: 100%`. For a fixed-ratio thumbnail, set a deliberate container size and `object-fit: cover` only if cropping is acceptable. Informative images need useful alternative text; decorative images should use empty `alt` text.

```css
.card-media {
  min-width: 0;
}
.card-media img {
  display: block;
  max-width: 100%;
  height: auto;
}
```

Review prompt: decide whether cropping changes the meaning of the image. Do not apply the same `object-fit` rule to every media type without considering content.


## Field note: grid and flexbox are complementary

Grid is strongest when the layout needs coordinated tracks in two dimensions or shared alignment across rows and columns. Flexbox is strongest when items are arranged along one primary axis and distribute space within that line. A grid item can contain a flex row, and a flex item can contain a grid; choosing one does not prohibit the other.

A dashboard page can use Grid for the page shell and panel placement, while a card uses Flexbox for a button row. A form can use Grid for label/control columns while an inline control group uses Flexbox. Avoid forcing a one-dimensional row into a complex grid simply because the page already uses Grid.

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}
.dashboard__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
```

Review prompt: state the primary axis or two-dimensional relationship that justifies each layout primitive.


## Field note: CSS visual tests need semantic assertions too

Screenshot comparison can catch a misaligned card or unexpected track, but it cannot prove that a screen reader reads the page in a sensible order. Grid changes can alter visual order while leaving the DOM unchanged. Include keyboard and semantic checks alongside visual regression testing.

Check that headings describe their sections, labels are connected to form fields, buttons have accessible names, and focus indicators remain visible. If a panel is scrollable, ensure the interaction is usable with a keyboard and does not trap focus unexpectedly.

```html
<section class="report-panel" aria-labelledby="report-title">
  <h2 id="report-title">Quarterly report</h2>
  <div class="report-panel__scroll">
    <table>
      <caption>Revenue by month</caption>
      <thead><tr><th scope="col">Month</th><th scope="col">Revenue</th></tr></thead>
      <tbody><tr><th scope="row">January</th><td>$12,000</td></tr></tbody>
    </table>
  </div>
</section>
```

Review prompt: what would a user hear if the visual styles were disabled? The document should remain understandable even without the grid composition.


## Track sizing drill: distinguish a track minimum from an item minimum

Create a two-column shell with a sidebar and a content panel. Give the content panel a long unbroken string and a nested flex row. First reproduce the overflow using `1fr`; then test `minmax(0, 1fr)`, `min-width: 0`, and `overflow-wrap: anywhere` independently. Record which change affects the track, which affects the item, and which affects the text.


## Placement drill: map explicit and implicit lines

Create a three-column grid with five cards. Assign one card `grid-column: span 2` and another `grid-row: span 2`. Enable the Grid overlay and identify which lines belong to the explicit grid and where implicit rows are added. Change `grid-auto-rows` and observe the effect on the extra row.


## Auto-repeat drill: compare sparse collections

Use the same card markup with `auto-fill` and `auto-fit`. Test one, two, and six items at a width that can hold four minimum tracks. Explain whether empty tracks remain and whether the occupied cards expand. Keep the CSS change isolated so the difference is attributable to the repeat keyword.


## Alignment drill: separate item alignment from track distribution

Create a grid container wider than its content. Set `justify-items: start`, then `justify-content: space-between`, then `justify-self: end` on one item. Observe the different scope of each property. Restore a simple rule after the experiment and document the actual requirement.


## Area-map drill: validate rectangular regions

Write a template with header, main, aside, and footer areas. Intentionally create one invalid non-rectangular area, then inspect the browser result and console. Correct the map with equal row lengths and rectangular areas. Use dots for empty cells rather than leaving a row structurally inconsistent.


## Intrinsic content drill: test realistic extremes

Test a short label, a long translated label, a URL, a missing image, and a table with wide cells. For each, choose wrapping, scaling, local scrolling, or a size constraint. Do not apply one global overflow rule to every case.


## Subgrid drill: align repeated cards

Build three pricing cards with different title and feature lengths. First use independent nested grids and note the misalignment. Then prototype a parent grid with shared row tracks and a subgrid child. Verify that the child spans the intended parent rows; if the structure is awkward, revert to a local grid.


## Container query drill: resize the component, not the viewport

Put the card grid inside a resizable panel. Establish a named inline-size query container and switch the composition at a width tied to the component's needs. Resize the panel without resizing the browser. Verify the query is attached to the correct ancestor.


## Accessibility drill: visual versus DOM order

Create a grid with a visually rearranged set of links. Tab through the page and compare focus order with the visual order. Remove any arrangement that makes the next focus target confusing. Add `:focus-visible` styles and check for clipping near overflow boundaries.


## DevTools drill: prove the cause before applying a fix

Reproduce horizontal overflow, then collect computed grid-template columns, auto-track sizes, the widest child's bounding box, `clientWidth`, and `scrollWidth`. Apply one change at a time. Record which computed value changed and why the result confirms the root cause.
