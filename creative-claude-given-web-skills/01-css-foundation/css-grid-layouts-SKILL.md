# SKILL: css-grid-layouts

## Layer
**Layer 01 — CSS Foundation**

## Goal
Build robust, responsive page and component layouts with CSS Grid by understanding tracks, intrinsic sizing, explicit and implicit grids, alignment, placement, named areas, auto-placement, and the interaction between Grid and other layout systems. Use Grid when two-dimensional relationships matter, and combine it with Flexbox and normal flow instead of forcing every layout into one tool.

## Why This Matters (Senior Perspective)

CSS Grid is more than a way to make equal columns. It is a layout model that lets you define relationships between rows and columns, describe meaningful page regions, and let content participate in sizing decisions. Senior engineers use it to express layout intent clearly: what should align, what may grow, what should remain readable, and how the layout should adapt when content or viewport dimensions change.

A grid can still fail when it is built from assumptions about fixed content, known viewport sizes, or perfectly behaved text. `1fr` does not always mean “shrink to whatever is left”; auto-placement can create unexpected tracks; implicit rows can grow; and a child with a long unbreakable string can force a track wider than expected. Strong Grid work starts with a sizing model and a content model, then adds breakpoints only when the design genuinely changes.

Grid is not a replacement for every other layout technique. Use normal flow for text, Flexbox for many one-dimensional arrangements, and Grid for relationships that need coordinated rows and columns. A mature interface often combines all three.

---

## Core Concepts

### 1. Explicit grid versus implicit grid

The explicit grid is the set of rows and columns declared by `grid-template-columns`, `grid-template-rows`, and optionally `grid-template-areas`. When items need more tracks than the explicit grid provides, Grid can create implicit tracks.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}
```

If this container has three declared columns but auto-placement needs another column, implicit tracks may appear according to the auto-placement algorithm and `grid-auto-columns`.

**Gotcha:** Unexpected extra columns are often a placement or auto-flow issue, not a browser bug. Inspect the explicit tracks, placement properties, and implicit track sizing together.

### 2. `fr` units represent a share of leftover space

The `fr` unit distributes available space after fixed sizes, gaps, and other sizing contributions are accounted for. It does not simply mean “this percentage of the container.” Intrinsic minimum sizes can affect the final result.

```css
.layout {
  display: grid;
  grid-template-columns: 16rem 1fr;
  gap: 1.5rem;
}
```

The second column receives the remaining space, subject to its sizing constraints.

**Gotcha:** A track declared as `1fr` can refuse to shrink below its min-content contribution. For robust flexible tracks, consider `minmax(0, 1fr)` when content is allowed to shrink or wrap inside the track.

### 3. `minmax()` separates minimum and maximum sizing

`minmax(min, max)` defines a track's lower and upper sizing constraints. It is central to resilient Grid patterns.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(14rem, 1fr));
  gap: 1rem;
}
```

This is appropriate only if the container can accommodate three minimum-width tracks plus gaps. Otherwise, use auto-fit, auto-fill, or a breakpoint strategy.

A common alternative is:

```css
.content-grid {
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
}
```

The zero minimum allows a flexible track to shrink below its intrinsic minimum where needed, while its content must still be handled responsibly.

### 4. `minmax(0, 1fr)` and min-content overflow

Grid items have automatic minimum-size behavior that can preserve min-content widths. This may cause code, long URLs, tables, or wide media to overflow a flexible track.

```css
.main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 1.5rem;
}

.main-content {
  min-width: 0;
}
```

Use `min-width: 0` on a grid item when its automatic minimum size is preventing it from shrinking. For writing-mode-aware code, consider `min-inline-size: 0`.

**Gotcha:** `minmax(0, 1fr)` controls the track, but it does not automatically make every descendant safe. Long words, images, tables, and nested grids may still need their own overflow or wrapping rules.

### 5. `repeat()` reduces repetitive track definitions

`repeat()` makes repeated track patterns easier to read.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
```

It can repeat a fixed count or use the `auto-fit` and `auto-fill` keywords with an appropriate track size.

### 6. `auto-fit` versus `auto-fill`

Both keywords repeat as many tracks as fit the available space, but they differ when some repeated tracks are empty. `auto-fill` preserves empty tracks in the layout calculation; `auto-fit` collapses empty repeated tracks so occupied tracks can expand.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}
```

This pattern often works well for responsive cards without a fixed number of columns.

Use `auto-fill` when preserving the potential column slots is meaningful; use `auto-fit` when the existing items should stretch to use the available space.

**Gotcha:** `auto-fit` does not magically choose a good minimum size. If the minimum is too large, you may still get fewer columns than expected or overflow in a narrow container.

### 7. `min()` can keep a repeated track from overflowing

A fixed minimum such as `16rem` can be wider than a very narrow container. Combining `min()` with the track size lets the minimum adapt to the container's available width.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}
```

This is a useful general-purpose pattern for card collections. It does not remove the need to test realistic content and container padding.

### 8. `gap` defines gutters directly

Use `gap`, `row-gap`, and `column-gap` to express spacing between tracks. This is clearer and less fragile than adding margins to every grid item.

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}
```

Grid gaps are part of the layout calculation. A row or column has to fit both its tracks and the gaps between them.

**Gotcha:** A layout that fits at exactly twelve columns without accounting for eleven gaps will overflow. Let Grid handle the math and avoid manually subtracting gap values from every track width.

### 9. `grid-template-areas` names major regions

Named areas make page-level layout readable and allow rearrangement without changing the HTML order.

```css
.page {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  gap: 1rem;
}

.page-header { grid-area: header; }
.page-sidebar { grid-area: sidebar; }
.page-main { grid-area: main; }
```

Every row in the area definition must have a compatible number of cells, and each named area must form a rectangle. Use `.` for an empty cell.

**Gotcha:** Grid visual placement does not change DOM reading order. Keep the source order logical for reading and keyboard navigation; do not use area names to create a visual order that contradicts the document's meaning.

### 10. Explicit placement with line numbers

Grid lines are numbered from the start edge of the explicit grid, with negative line numbers counting from the end edge. Items can span lines.

```css
.featured {
  grid-column: 1 / 3;
  grid-row: 1 / 3;
}
```

For a 12-column layout, line-based placement can express editorial or dashboard spans. Use it when the relationship is intentional and the grid structure is stable enough to make the line references understandable.

### 11. `span` describes a track count

Instead of naming a start and end line, an item can span a number of tracks.

```css
.featured {
  grid-column: span 2;
}
```

This is useful for card grids where an item should occupy two columns. Placement still depends on the auto-placement algorithm and the available tracks.

**Gotcha:** A span does not guarantee that an item starts at a particular column. If start position matters, specify both the intended start and span or use named areas.

### 12. Auto-placement and `grid-auto-flow`

Grid's auto-placement algorithm places items that do not have complete explicit placement. The default flow is row-oriented.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-auto-flow: row;
  gap: 1rem;
}
```

`grid-auto-flow: column` makes auto-placement proceed by columns, which can be useful for specific structures but can also create more implicit columns than expected.

`grid-auto-flow: dense` asks Grid to backfill earlier holes with later items when possible.

**Gotcha:** Dense packing can make visual order differ from source order. Avoid it when predictable visual sequence matters for reading, keyboard navigation, or content that users interpret as ordered.

### 13. Implicit track sizing

When auto-placement creates rows or columns outside the explicit grid, `grid-auto-rows` and `grid-auto-columns` control their sizing.

```css
.timeline {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-auto-rows: minmax(8rem, auto);
  gap: 1rem;
}
```

The default implicit sizing behavior may be fine, but explicit rules make generated tracks more predictable in dashboards and repeated content layouts.

### 14. `align-items` and `justify-items`

These properties align grid items inside their own grid areas. `align-items` operates along the block axis; `justify-items` operates along the inline axis in the usual horizontal writing mode.

```css
.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  justify-items: stretch;
}
```

The default `stretch` behavior is useful for many grid items. Use `start`, `center`, or `end` when the content's intrinsic size should not fill the whole area.

### 15. `align-content` and `justify-content`

These properties align the grid tracks as a group inside the grid container when there is extra space. They do not align an individual item within its cell.

```css
.grid-frame {
  display: grid;
  grid-template-columns: repeat(3, 10rem);
  justify-content: center;
  align-content: start;
  gap: 1rem;
}
```

This distinction matters: `justify-items` affects items inside their areas, while `justify-content` affects the tracks as a group.

**Gotcha:** If the grid tracks already fill the container, `justify-content: center` may appear to do nothing. Check the actual track sizes and remaining free space.

### 16. `place-items` and `place-content`

The shorthand `place-items` sets `align-items` and `justify-items`; `place-content` sets `align-content` and `justify-content`.

```css
.centered-grid {
  display: grid;
  place-items: center;
}
```

Shorthands are concise, but use the longhand properties when the two axes need different values or when clarity is more important than brevity.

### 17. `justify-self` and `align-self`

These properties override the container's item-alignment settings for one item.

```css
.card-action {
  justify-self: end;
  align-self: end;
}
```

They are useful for a button, badge, or small control that should sit at a particular edge of a grid area while sibling items use the default alignment.

### 18. Intrinsic sizing keywords

Grid track sizing can use intrinsic keywords such as `min-content`, `max-content`, and `auto`.

- `min-content` is based on the smallest size the content can take without avoidable overflow, often constrained by its longest unbreakable segment.
- `max-content` is based on the size the content would take without soft wrapping.
- `auto` participates in intrinsic sizing and can stretch depending on the grid container's alignment and available space.

```css
.label-layout {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 1rem;
}
```

Use intrinsic sizing when content should inform the layout, but verify long labels and localized text.

### 19. `fit-content()` balances content and a limit

`fit-content()` allows a track to use available space while respecting an upper limit, subject to intrinsic sizing rules.

```css
.sidebar-layout {
  display: grid;
  grid-template-columns: fit-content(18rem) minmax(0, 1fr);
  gap: 1.5rem;
}
```

This can be useful for a label or sidebar whose natural width should be preserved up to a sensible maximum. It is not a replacement for testing the longest supported content.

### 20. Subgrid shares parent track sizing

`subgrid` lets a nested grid adopt the tracks of its parent in one or both axes. This is valuable when nested card content should align across sibling cards—for example, headings, descriptions, and actions lining up even when text lengths vary.

```css
.card-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

The parent must provide the rows that the subgrid spans. Browser support is modern but should still be checked against the project's target matrix. Provide a sensible fallback when required.

**Gotcha:** `subgrid` does not mean “inherit every parent style.” It shares track sizing in the chosen axis; other properties and layout decisions still need to be authored.

### 21. Grid and Flexbox solve different problems

Grid is usually best for two-dimensional relationships. Flexbox is usually best for one-dimensional distribution along a row or column. A grid cell can contain a flex layout, and a flex item can contain a grid.

```css
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
}

.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
```

Use each system for the local problem it expresses best rather than choosing one layout system for the whole page.

### 22. Grid and normal flow work together

Grid should not become a reason to position every text fragment manually. Use Grid to organize major regions or repeated items, then let content flow naturally inside each area.

```css
.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(14rem, 20rem);
  gap: clamp(1.5rem, 4vw, 4rem);
}
```

Paragraphs, lists, headings, and inline content inside the article should usually remain in normal flow unless there is a specific reason to create another layout context.

### 23. Responsive Grid without arbitrary breakpoints

Auto-repeat patterns can adapt the number of columns based on available space.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
}
```

This often handles simple card collections without a media query. Use explicit breakpoints when the design's relationships change—for example, when a sidebar becomes a top section or a dense dashboard switches to a single-column flow.

### 24. Breakpoints should express design changes

A breakpoint is not a device label; it is a point where the current arrangement stops serving the content. Start with the content and adjust when columns become too narrow, navigation wraps awkwardly, or the reading measure becomes uncomfortable.

```css
.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 1.5rem;
}

@media (max-width: 52rem) {
  .dashboard {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

The example breakpoint is illustrative, not universal. Test actual content and container widths.

### 25. Container queries can adapt a component to its space

A reusable card or widget may live in a wide page column, a narrow sidebar, or a modal. Container queries let the component respond to its available container width instead of the viewport alone.

```css
.widget-host {
  container-type: inline-size;
}

.widget {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

@container (min-width: 34rem) {
  .widget {
    grid-template-columns: minmax(0, 1fr) 12rem;
  }
}
```

The container must establish a query container. Check browser support and consider a usable single-column baseline.

### 26. Grid item overflow and replaced elements

Images, videos, tables, and embedded content can have intrinsic dimensions that exceed their assigned grid area.

```css
.grid-content img,
.grid-content video,
.grid-content iframe {
  max-inline-size: 100%;
}

.grid-content {
  min-inline-size: 0;
}
```

For images that should fill a fixed visual box, combine an intentional aspect ratio with `object-fit`. For data tables, a dedicated horizontal scrolling wrapper may be better than forcing every column to shrink.

**Gotcha:** Setting `max-width: 100%` on an image does not solve every kind of overflow. Inspect tables, preformatted text, long URLs, and nested layout containers separately.

### 27. `aspect-ratio` can stabilize visual cards

A grid track can size itself based on its content while an image frame uses `aspect-ratio` to maintain a predictable shape.

```css
.card-media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Use the aspect ratio that suits the content. Avoid fixed heights that crop text or make cards brittle unless the design explicitly calls for a uniform crop.

### 28. Dense dashboards need a deliberate track model

A 12-column grid can be useful for dashboards and editorial layouts, but it should not become a puzzle of unexplained spans. Define a clear container, track model, gap, and a small number of named component spans.

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard-grid__main {
  grid-column: span 8;
}

.dashboard-grid__aside {
  grid-column: span 4;
}

@media (max-width: 54rem) {
  .dashboard-grid__main,
  .dashboard-grid__aside {
    grid-column: 1 / -1;
  }
}
```

Use named areas or explicit component classes to make the intent clear. Do not hardcode item placement if content is dynamic and order can change.

### 29. Grid does not fix document semantics

CSS layout controls visual presentation, not the meaning of the document. Use semantic HTML for navigation, main content, lists, forms, and tables. Do not use a grid of generic `div` elements when the content has meaningful list or table semantics.

Visual reordering with `order`, explicit grid placement, or dense packing can make the screen's apparent sequence differ from keyboard and screen-reader order. Keep the source order meaningful and test the actual interaction.

### 30. Debug the grid using browser developer tools

When a layout is wrong, turn on the browser's Grid overlay. Inspect explicit and implicit tracks, line numbers, gaps, named areas, and item placement. Then check the computed values and intrinsic sizes of the problematic children.

A practical debugging sequence:

1. Confirm the element actually has `display: grid`.
2. Inspect `grid-template-columns` and `grid-template-rows`.
3. Turn on the Grid overlay and label the lines.
4. Check whether implicit tracks have been created.
5. Inspect the grid item's min-content size and `min-width`/`min-inline-size`.
6. Temporarily outline the grid items.
7. Disable one placement rule at a time.
8. Check the longest content, not only the shortest card.
9. Test at the width where the layout first fails.
10. Remove temporary debugging styles after the issue is understood.

**Gotcha:** Avoid “fixing” an unexplained grid by adding a random width or `overflow: hidden`. Find the track or item sizing constraint that caused the failure.

---

## Reusable Patterns

### Pattern 1: Responsive card collection

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
}
```

Use for cards whose widths should respond naturally to the available space. It is compact and often avoids multiple breakpoint rules.

### Pattern 2: Sidebar plus content

```css
.content-layout {
  display: grid;
  grid-template-columns: minmax(14rem, 18rem) minmax(0, 1fr);
  gap: clamp(1.25rem, 3vw, 2.5rem);
}

@media (max-width: 50rem) {
  .content-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Use when a sidebar should sit beside content on wide layouts and move above or below it on narrow layouts. Keep the DOM order aligned with the intended reading order.

### Pattern 3: Named page regions

```css
.app-shell {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "sidebar header"
    "sidebar main";
  min-block-size: 100vh;
  gap: 1rem;
}

.app-header { grid-area: header; }
.app-sidebar { grid-area: sidebar; }
.app-main { grid-area: main; }

@media (max-width: 48rem) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "header"
      "main"
      "sidebar";
  }
}
```

Use for a shell whose regions have stable semantic roles. Verify that the mobile visual order still makes sense relative to the source order.

### Pattern 4: Twelve-column dashboard

```css
.dashboard {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

.dashboard__primary {
  grid-column: span 8;
}

.dashboard__secondary {
  grid-column: span 4;
}

.dashboard__full {
  grid-column: 1 / -1;
}

@media (max-width: 56rem) {
  .dashboard__primary,
  .dashboard__secondary {
    grid-column: 1 / -1;
  }
}
```

Use for dashboards where a small number of intentional spans help express hierarchy. Avoid turning every child into a manually positioned tile.

### Pattern 5: Equal-height cards with aligned footers

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: 1rem;
}

.card {
  display: flex;
  flex-direction: column;
  min-inline-size: 0;
}

.card__body {
  flex: 1;
}

.card__footer {
  margin-block-start: 1rem;
}
```

Use Grid for the collection and Flexbox inside each card. This often aligns actions at the bottom without forcing all card content into fixed heights.

### Pattern 6: Subgrid-aligned card content

```css
.card-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-template-rows: auto auto auto;
  gap: 1rem;
}

.card {
  display: grid;
  grid-template-rows: subgrid;
  grid-row: span 3;
}
```

Use when child headings, descriptions, and actions should line up across a row of cards. Check browser support and provide a reasonable fallback where needed.

### Pattern 7: Intrinsic label and flexible value

```css
.definition-row {
  display: grid;
  grid-template-columns: fit-content(12rem) minmax(0, 1fr);
  gap: 0.75rem 1rem;
  align-items: start;
}
```

Use for settings summaries and metadata rows where labels should stay content-sized up to a limit and values should take the remaining width. Test long localized labels.

### Pattern 8: Full-width feature item

```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
  gap: 1rem;
}

.feature-grid__featured {
  grid-column: 1 / -1;
}
```

Use when a featured card should span the entire grid. If the grid's column count changes across breakpoints, check that the feature's placement still communicates the intended hierarchy.

### Pattern 9: Wide data table wrapper

```css
.table-scroll {
  max-inline-size: 100%;
  overflow-x: auto;
}

.table-scroll table {
  min-inline-size: 44rem;
  border-collapse: collapse;
}
```

Use when preserving table relationships is more important than compressing every column. Keep horizontal overflow discoverable and test keyboard access in the surrounding interaction model.

### Pattern 10: Center a component without hardcoding its width

```css
.centered-panel {
  display: grid;
  place-items: center;
  min-block-size: 18rem;
  padding: 1.5rem;
}
```

Use when a single child should be centered in both axes. If the content can exceed the panel, ensure the container grows or scrolls rather than clipping it.

### Pattern 11: Responsive media and text

```css
.media-copy {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: clamp(1.25rem, 4vw, 3rem);
  align-items: center;
}

.media-copy img {
  display: block;
  max-inline-size: 100%;
  block-size: auto;
}

@media (max-width: 44rem) {
  .media-copy {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

Use when image and text should sit side by side on wider screens but stack at narrow widths. Preserve logical source order.

### Pattern 12: A resilient app main region

```css
.app-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 1.5rem;
  min-inline-size: 0;
}
```

Use inside a larger app shell to prevent main content from inheriting an unintended min-content width. Add columns only when the content relationships require them.

---

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Using Grid for every layout | Adds complexity to simple text flow or one-axis distribution | Use normal flow, Flexbox, and Grid for the relationships each expresses best |
| Treating `1fr` as a percentage | Flexible tracks share leftover space and remain subject to sizing constraints | Model fixed sizes, gaps, and intrinsic minimums explicitly |
| Forgetting the automatic minimum size | Long content can force a flexible track wider than intended | Use `minmax(0, 1fr)` and `min-inline-size: 0` where shrinking is intended |
| Using `repeat(3, 1fr)` for every card grid | Tracks may overflow due to intrinsic minimums and narrow containers | Prefer a tested `minmax()` strategy and responsive repeat pattern |
| Setting a fixed minimum wider than the container | A narrow viewport or embedded component can overflow | Consider `min(100%, <desired-minimum>)` inside `minmax()` |
| Confusing `auto-fit` with `auto-fill` | Empty repeated tracks behave differently | Choose based on whether empty slots should remain in the sizing model |
| Assuming `auto-fit` guarantees three columns | Available width and minimum track size determine the result | Test real container widths and content |
| Forgetting gaps in mental width calculations | Tracks plus gutters must fit the container | Let Grid calculate track sizes and avoid manually guessed widths |
| Defining malformed grid areas | Area rows must form valid rectangular named areas | Check each row's cell count and named-area geometry |
| Reordering content only visually | DOM, screen-reader, and keyboard order can contradict visual order | Keep source order logical; use placement for layout, not semantic reordering |
| Overusing numeric line placement | CSS becomes fragile and hard to understand | Use named areas or clear component span classes for stable relationships |
| Assuming `span 2` defines a start column | Span specifies a track count, not a unique starting position | Specify start and span when the exact position matters |
| Using `grid-auto-flow: column` without checking implicit tracks | Extra columns can appear unexpectedly | Inspect the auto-placement direction and implicit track sizing |
| Using `grid-auto-flow: dense` for ordered content | Later items can visually fill earlier holes and disrupt sequence | Use dense packing only for content where visual order is not meaningful |
| Forgetting `grid-auto-rows` | Implicit rows may size differently than the intended component contract | Set implicit track sizes when generated tracks need predictable behavior |
| Confusing item alignment with track alignment | `justify-items` and `justify-content` solve different problems | Decide whether the item or the grid tracks should move |
| Expecting `justify-content` to move full-width tracks | No free space may remain when tracks fill the container | Inspect track sizing and remaining space |
| Using `max-content` for long localized labels | The track can grow beyond the available container | Use `fit-content()`, `minmax()`, and wrapping rules as appropriate |
| Ignoring min-content widths | Unbreakable text can force tracks wider than expected | Handle long URLs, code, and labels explicitly |
| Assuming `subgrid` inherits all styles | It shares track sizing only in the chosen axis | Define other grid and item styles separately |
| Using subgrid without a fallback where required | Unsupported environments may lose the intended alignment | Check target browser support and define a simpler baseline |
| Replacing every Flexbox row with Grid | Adds unnecessary two-dimensional layout logic | Use Flexbox for local one-dimensional groups |
| Using fixed heights for variable text cards | Content can overflow or become clipped | Let rows size to content and use Flexbox for footer placement |
| Forgetting media intrinsic dimensions | Images, iframes, and tables can overflow tracks | Set sensible maximum inline sizes and specific overflow behavior |
| Assuming `max-width: 100%` fixes tables | Wide table content may still need a minimum width to preserve columns | Wrap tables in an intentional horizontal scroll container |
| Adding breakpoints for named devices | Device categories do not explain where the design fails | Choose breakpoints where the content or relationships stop working |
| Adding breakpoints to a simple card collection unnecessarily | More rules create maintenance cost without improving layout | Try auto-repeat and intrinsic track sizing first |
| Using viewport queries for every reusable component | A widget's available width may differ from viewport width | Consider container queries for component-level adaptation |
| Forgetting to declare a query container | Container query rules have no intended container to measure | Add `container-type` to the appropriate ancestor |
| Overusing a 12-column dashboard grid | Arbitrary spans become difficult to reason about | Define a small set of intentional spans and a clear collapse strategy |
| Omitting `min-inline-size: 0` in app shells | Main content may push the sidebar or viewport wider | Allow the flexible main region to shrink |
| Centering content in a fixed-height box without overflow handling | Large content can be clipped or awkwardly positioned | Let the box grow or define intentional scrolling |
| Treating Grid as semantic structure | Layout does not replace HTML semantics | Use appropriate landmarks, lists, tables, and headings |
| Ignoring keyboard and focus order | Visual placement can make navigation confusing | Test tab order and source order together |
| Debugging without the Grid overlay | Implicit tracks and sizing constraints are easy to miss | Inspect tracks, lines, gaps, and item placement in devtools |
| Adding `overflow: hidden` to mask a sizing bug | Hides content rather than fixing the track model | Find the min-content constraint or incorrect track definition |
| Testing only with short placeholder text | Real titles and translations expose overflow | Test worst-case content and localization |
| Assuming a desktop layout scales linearly to mobile | Some relationships should change, not merely shrink | Stack or reorganize components at content-driven breakpoints |
| Ignoring writing direction | Physical placement assumptions can fail in RTL interfaces | Prefer logical properties and test RTL where supported |
| Hardcoding `100vh` without considering mobile viewport behavior | Browser UI can affect the usable viewport | Choose an appropriate viewport sizing strategy and test mobile |
| Using too many nested grids | Makes layout harder to inspect and maintain | Create nested grids only where the sub-layout has a real two-dimensional need |
| Making all tracks equal even when content has hierarchy | Important content may be squeezed or poorly emphasized | Use intentional fixed, flexible, or intrinsic tracks where appropriate |
| Leaving debug outlines in production | Diagnostic styles become part of the shipped UI | Remove temporary rules after solving the layout issue |

---

## Mental Models

1. **Grid describes relationships, not just columns.** Its strongest value is coordinating two-dimensional structure.
2. **Tracks have sizing constraints.** Flexible fractions, gaps, and intrinsic content all participate in the final layout.
3. **Intrinsic sizing is real content sizing.** Text and media can influence a track even when the CSS looks flexible.
4. **The explicit grid is not the whole grid.** Auto-placement can create implicit rows or columns beyond the declared template.
5. **A span is a size instruction, not always a position instruction.** Specify a start line when placement must be predictable.
6. **Auto-fit collapses unused repeated tracks; auto-fill preserves them.** Choose based on the intended distribution of available space.
7. **Grid and Flexbox are partners.** Use Grid for two-dimensional structure and Flexbox for local one-dimensional arrangements.
8. **Normal flow remains the default for reading content.** Do not manually place every paragraph and heading.
9. **Visual order is not semantic order.** The DOM remains central to reading and keyboard navigation.
10. **A breakpoint is a design decision.** It should occur where content or relationships stop working.
11. **Reusable components respond to their container.** Container queries can be more relevant than viewport width for embedded widgets.
12. **The longest content is the real stress test.** Placeholder text rarely reveals intrinsic sizing failures.
13. **Track sizing and item sizing are separate layers.** Fix the correct layer instead of adding arbitrary overflow rules.
14. **Gaps are part of the geometry.** Grid computes them; design the track model with them in mind.
15. **Debug the grid that exists.** Use overlays and computed styles to see implicit tracks and sizing constraints.
16. **Semantics live in HTML, not in CSS.** A visually neat grid can still be structurally inaccessible.
17. **Progressive enhancement applies to layout features too.** Use modern features with a sensible fallback when support requirements demand it.
18. **A maintainable grid has a small vocabulary.** A few intentional track patterns are easier to reason about than many unexplained line numbers.

---

## Quick Reference

| Goal | Starting point |
|---|---|
| Create a grid container | `display: grid` |
| Define equal flexible columns | `repeat(3, minmax(0, 1fr))` |
| Make cards adapt to available width | `repeat(auto-fit, minmax(min(100%, 17rem), 1fr))` |
| Set space between tracks | `gap`, `row-gap`, `column-gap` |
| Name page regions | `grid-template-areas` and `grid-area` |
| Span multiple columns | `grid-column: span 2` |
| Fill remaining columns | `grid-column: 1 / -1` |
| Size implicit rows | `grid-auto-rows` |
| Control auto-placement direction | `grid-auto-flow` |
| Align items inside cells | `align-items`, `justify-items`, `align-self`, `justify-self` |
| Align tracks inside the container | `align-content`, `justify-content` |
| Allow a main track to shrink | `minmax(0, 1fr)` and sometimes `min-inline-size: 0` |
| Align nested tracks with parent tracks | `subgrid`, after checking support |
| Build a responsive page shell | Named areas plus a content-driven media query |
| Adapt a widget to its own width | Container query on a declared query container |
| Debug an unexpected column | Inspect explicit tracks, implicit tracks, and auto-placement |
| Debug overflow | Inspect min-content contributions, child dimensions, and track minimums |

### Minimal resilient card grid

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: 1.25rem;
}

.card-grid > * {
  min-inline-size: 0;
}
```

Use this as a starting point, not a universal recipe. Check the smallest container, the longest content, and the intended number of cards per row.

---

## Build Challenge

### Project: Responsive dashboard layout system

Build a dashboard with a sidebar, header, main content region, summary cards, a wide data table, and an optional secondary panel. It should remain understandable when the viewport shrinks and when content varies.

#### Requirements

1. Use semantic HTML landmarks for header, navigation, main content, and supporting content.
2. Keep the source order meaningful for reading and keyboard navigation.
3. Establish the main shell with `display: grid`.
4. Define a clear column model for the wide layout.
5. Use `minmax(0, 1fr)` for flexible tracks where min-content overflow would be harmful.
6. Name major regions with `grid-template-areas` if it improves clarity.
7. Ensure every named area is rectangular and every area row has a compatible cell count.
8. Define track gaps with `gap`, not item margins.
9. Build the summary-card collection with `repeat()` and `minmax()`.
10. Let the card collection adapt to available width using `auto-fit` or a deliberate breakpoint system.
11. Explain whether `auto-fit` or `auto-fill` better matches the card design.
12. Include one intentionally featured item that spans multiple tracks.
13. Make the featured item's placement predictable.
14. Use a dedicated class for dashboard spans instead of scattered unexplained line numbers.
15. Define the implicit row behavior if auto-placement creates rows outside the explicit grid.
16. Test the layout with fewer cards than the maximum potential columns.
17. Test the layout with enough cards to fill multiple rows.
18. Test a very long title or unbreakable string.
19. Ensure images and embedded media cannot unexpectedly widen a track.
20. Wrap wide data tables in a deliberate horizontal overflow region.
21. Preserve meaningful table semantics.
22. Use Flexbox inside at least one card for a one-dimensional footer or action group.
23. Keep text-heavy content in normal flow inside its grid area.
24. Add a breakpoint where the sidebar/main relationship stops working.
25. Explain why the breakpoint is content-driven rather than device-named.
26. Keep the main region usable at a narrow viewport.
27. Test the shell at an intermediate width, not just desktop and mobile.
28. Test at enlarged browser zoom.
29. Check keyboard tab order against the visual order.
30. Ensure focus indicators remain visible and are not clipped.
31. Use `:focus-visible` for appropriate keyboard-oriented focus styling.
32. Verify that CSS placement does not imply a false semantic sequence.
33. Inspect the Grid overlay and document the track model.
34. Identify whether any implicit tracks were created.
35. Explain why any use of `min-inline-size: 0` is necessary.
36. Avoid `overflow: hidden` as a substitute for understanding sizing.
37. Test a content state with long localized labels.
38. If using container queries, declare the query container and document the fallback.
39. If using `subgrid`, check target browser support and provide a fallback if required.
40. Test right-to-left layout if the product supports RTL.
41. Check that the layout does not create unnecessary horizontal page scrolling.
42. Keep the dashboard usable if a modern optional layout feature is unsupported.
43. Remove temporary outlines and debug rules.
44. Record the widths where the layout transitions and explain why.
45. Document the difference between track alignment and item alignment in the implementation.
46. Keep the CSS selectors understandable and avoid deeply nested dependencies.
47. Verify that the layout still works when cards have different amounts of text.
48. Confirm the table can be navigated on a narrow viewport without destroying its columns.
49. Explain which parts use Grid, which use Flexbox, and which remain normal flow.
50. Provide a short test note describing the most difficult overflow case and how you solved it.

### Acceptance checklist

- [ ] The page uses Grid where two-dimensional relationships matter.
- [ ] One-dimensional groups use Flexbox or normal flow where appropriate.
- [ ] Flexible tracks do not unexpectedly expand because of long content.
- [ ] Repeated cards adapt without arbitrary fixed-width assumptions.
- [ ] Major regions remain logically ordered in the DOM.
- [ ] The layout works at narrow, intermediate, and wide widths.
- [ ] Wide data remains reachable through intentional horizontal scrolling.
- [ ] The browser Grid overlay was used to inspect the actual track model.
- [ ] Keyboard focus, zoom, and RTL support have been considered.
- [ ] Optional features have a reasonable fallback when required.

### Suggested review questions

1. Why is Grid a better fit for the main shell than a single Flexbox row?
2. Where does Flexbox simplify a local layout inside the grid?
3. Which tracks use intrinsic sizing, and why?
4. What would happen if a card title contained one long unbreakable token?
5. Why did you choose `auto-fit` or `auto-fill`?
6. Did the browser create any implicit tracks?
7. How does the source order compare with the visual order at each breakpoint?
8. What is the smallest supported container width?
9. How does the table behave when the viewport becomes narrow?
10. Which layout rule was hardest to debug, and what evidence identified the root cause?

---

## Final Principles

- Use Grid to express meaningful two-dimensional relationships.
- Let track sizing reflect both available space and intrinsic content.
- Use `minmax(0, 1fr)` and `min-inline-size: 0` when flexible content must be allowed to shrink.
- Prefer `auto-fit` card patterns for fluid collections when they fit the design.
- Keep source order logical and preserve semantic HTML.
- Combine Grid, Flexbox, and normal flow rather than treating them as competitors.
- Make breakpoints respond to content failures, not device stereotypes.
- Debug with the Grid overlay before adding arbitrary widths or clipping.
- Test long content, zoom, keyboard order, and narrow containers.
- Keep the layout vocabulary small, deliberate, and documented.
