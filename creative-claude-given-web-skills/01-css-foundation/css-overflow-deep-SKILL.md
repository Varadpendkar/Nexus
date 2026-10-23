# SKILL: css-overflow-deep

## Layer
Layer 01 — CSS Foundation

## Goal
Build reliable intuition for CSS overflow: how content escapes or clips its box, how scroll containers are created, how overflow interacts with flex and grid sizing, how to manage two-axis behavior, and how to debug clipping without hiding important content or breaking accessibility.

## Why This Matters (Senior Perspective)
Overflow is not merely a way to hide an ugly edge. It is part of layout architecture. A single `overflow: hidden` can clip a dropdown, turn a wrapper into a scroll container, change sticky-position behavior, establish a formatting context, cut off focus rings, or make a page impossible to use at a narrow viewport. Senior engineers treat overflow as a contract: what content may exceed a box, where that excess goes, whether it remains reachable, and which ancestor owns scrolling.

Use this skill when:
- A card, image, code sample, table, menu, tooltip, or animation is being clipped.
- A flex or grid child refuses to shrink and causes horizontal scrolling.
- A sticky header stops sticking after a wrapper receives `overflow`.
- A nested panel scrolls while the document also scrolls.
- Keyboard focus outlines or anchored popovers disappear at container edges.
- A component needs a deliberate horizontal scroller without creating accidental page overflow.

---

## 1. The Overflow Model

Overflow describes what happens when an element's contents exceed the space available in its box. The main property is `overflow`, with axis-specific variants `overflow-x` and `overflow-y`.

```css
.panel {
  overflow: auto;
}
```

The important question is not simply “should this be hidden?” Ask four questions:

1. **What can exceed the box?** Text, replaced content, descendants, positioned elements, or transformed visuals?
2. **Which axis can exceed it?** Inline/horizontal, block/vertical, or both?
3. **What should happen to the excess?** Visible, clipped, scrollable, or automatically scrolled?
4. **Who owns reachability?** The page, this panel, or another explicit scroll region?

Overflow decisions should follow the component's content contract, not visual guesswork.

### Core values

| Value | Behavior | Typical use |
|---|---|---|
| `visible` | Content can paint outside the box; this is the initial value | Ordinary content that should not be clipped |
| `hidden` | Excess is clipped; programmatic scrolling can still occur | Deliberately clipped media or a controlled clipping wrapper |
| `clip` | Excess is clipped and the element is not a scroll container | Strict clipping when scrolling is not wanted |
| `scroll` | A scroll container is created; scrollbars are generally provided even if not needed | Fixed viewport areas where a persistent scrollbar is part of the UI |
| `auto` | A scroll container is created when overflow requires it | Most practical scrollable panels |

`overflow: hidden` and `overflow: clip` are not interchangeable. `hidden` creates a scroll container (even if users do not see a scrollbar), while `clip` does not. `clip` also does not establish a new formatting context by itself. If you need both clipping and a new block formatting context, consider `display: flow-root` alongside `overflow: clip`.

**Gotcha:** A hidden scrollbar does not mean content is not scrollable. `overflow: hidden` can still be scrolled programmatically and can affect APIs and layout behavior that depend on scroll containers.

## 2. Overflow Is About the Box, Not Just the Child

The visible result can be affected by several layers:
- The element's content box and padding box.
- Its descendants' normal-flow dimensions.
- Absolutely positioned descendants.
- Transforms and visual effects that extend paint outside normal layout bounds.
- Ancestors that clip descendant painting.
- Scrollport dimensions and scrollbar allocation.

A child may be correctly sized but still be clipped by a distant ancestor. Conversely, a child may visually extend beyond its layout box due to `transform: scale()` or shadows without changing the layout dimensions.

```css
.avatar-frame {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  overflow: clip;
}

.avatar-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Here the frame intentionally defines a clipping boundary. The same rule would be inappropriate for a card containing a focusable button whose focus ring extends beyond the frame.

**Gotcha:** The element visibly nearest the clipped content is not necessarily the element responsible. Inspect every ancestor up to the viewport.

## 3. Choosing `hidden`, `clip`, `auto`, and `scroll`

Use the value that expresses the desired behavior:

```css
/* Content should remain visible outside the box. */
.notice {
  overflow: visible;
}

/* Crop decorative media; no scrolling contract. */
.hero-media {
  overflow: clip;
}

/* Scroll a panel only when it needs to. */
.log-output {
  overflow: auto;
}

/* A fixed viewport where scrollbar presence is intentional. */
.terminal-viewport {
  overflow: scroll;
}
```

Prefer `auto` for user-facing scroll areas unless the design specifically requires a persistent scrollbar. Prefer `clip` when the intent is purely to prevent paint from escaping. Use `hidden` when a hidden scroll container is genuinely useful or when compatibility constraints require it.

Do not add `overflow: hidden` as a generic “fix.” It can conceal symptoms while introducing a new bug.

### Decision guide

- **Should excess content be visible?** Keep `visible`.
- **Should excess be cropped and unreachable?** Consider `clip`, but ensure no meaningful content or focus indicator is lost.
- **Should users reach the excess?** Use `auto` or, when required, `scroll`.
- **Should an ancestor stop a decorative visual from painting outside?** Clip the smallest possible wrapper.
- **Should the page scroll rather than a nested component?** Avoid creating unnecessary nested scroll containers.

**Gotcha:** Clipping content that contains text, controls, or focusable descendants can make part of the interface inaccessible even if the screenshot looks clean.

## 4. Axis-Specific Overflow

You can control each axis separately:

```css
.code-sample {
  overflow-x: auto;
  overflow-y: hidden;
}
```

This is useful for a single-line code sample or a horizontally scrollable table. But the computed behavior of one axis can be affected by the value of the other axis. In particular, `visible` may compute to `auto` when the opposite axis is neither `visible` nor `clip`; `clip` may compute to `hidden` when the opposite axis is neither `visible` nor `clip`. Check computed styles when behavior seems surprising.

For a horizontal scroller, a robust baseline is:

```css
.horizontal-scroller {
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
```

Do not assume that setting one axis to `visible` guarantees visible painting if the other axis is scrollable. Test the computed values in browser DevTools.

**Gotcha:** `overflow-x: hidden; overflow-y: visible` does not necessarily behave like “hide only horizontal overflow, freely show vertical overflow.” The axis values have computed-value interactions.

## 5. Scroll Containers and Scrollports

A scroll container is an element whose overflow establishes a mechanism for scrolling. Its scrollport is the region through which its content is viewed. The scrollport is not the same as the full scrollable content size.

```css
.sidebar {
  block-size: 100%;
  overflow-y: auto;
}
```

The element needs a meaningful constraint for overflow to occur. If its block size simply expands to fit all content, there may be nothing to scroll.

For viewport-bound panels, establish the layout and the constraint intentionally:

```css
.app {
  min-block-size: 100dvh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.app__main {
  min-block-size: 0;
  overflow: auto;
}
```

This creates a header plus a main region that can shrink within the available app height and scroll internally. The `minmax(0, 1fr)` and `min-block-size: 0` are important in many grid/flex arrangements because the default automatic minimum size can otherwise let content force the track wider or taller than intended.

**Gotcha:** `overflow: auto` alone does not guarantee a scrollable panel. The panel must have a constrained size in the relevant axis, and its ancestors must permit it to shrink.

## 6. The Flexbox Minimum-Size Trap

A frequent cause of overflow is a flex item refusing to shrink below its min-content size. Consider:

```css
.row {
  display: flex;
  gap: 1rem;
}

.row__content {
  flex: 1;
}
```

If `.row__content` contains a long unbroken URL or a wide table, it may push the row beyond its container. Flex items commonly have an automatic minimum size that prevents shrinking below a content-based minimum.

Fix the intended shrink boundary:

```css
.row__content {
  flex: 1;
  min-inline-size: 0;
}
```

For a vertical flex layout whose child should scroll:

```css
.column {
  display: flex;
  flex-direction: column;
  block-size: 100dvh;
}

.column__body {
  flex: 1;
  min-block-size: 0;
  overflow: auto;
}
```

Use `min-inline-size: 0` for inline-axis shrinkage and `min-block-size: 0` for block-axis shrinkage. Prefer logical properties where writing modes may vary.

**Gotcha:** Adding `overflow: hidden` to the flex child may appear to solve the width problem, but it can clip content and change scroll behavior. First identify which item is refusing to shrink.

## 7. The Grid Minimum-Track Trap

Grid tracks sized with `1fr` can still honor automatic minimum sizing. A content-heavy child may force a track to expand beyond the intended available space.

Problematic:

```css
.workspace {
  display: grid;
  grid-template-columns: 16rem 1fr;
}

.workspace__main {
  overflow: auto;
}
```

A more resilient pattern:

```css
.workspace {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
}

.workspace__main {
  min-inline-size: 0;
  min-block-size: 0;
  overflow: auto;
}
```

For a grid row that must contain a scrollable body, `grid-template-rows: auto minmax(0, 1fr)` often expresses the intended constraint more clearly than `auto 1fr`.

Remember: `minmax(0, 1fr)` changes the track's minimum to zero; it does not automatically make every descendant shrink. Apply minimum-size overrides at the relevant item boundary.

**Gotcha:** If a grid overflows, inspect the track definition and the grid item's minimum size before reaching for `overflow-x: hidden` on the whole page.

## 8. Long Text, URLs, and Intrinsic Sizing

Unbreakable content can force ancestors wider than the viewport. Choose wrapping rules based on the content type.

```css
.prose {
  overflow-wrap: anywhere;
}

.code {
  overflow-x: auto;
  white-space: pre;
}
```

- `overflow-wrap: anywhere` allows otherwise unbreakable strings to wrap and can reduce min-content contributions.
- `word-break: break-word` is legacy/non-standard behavior in some contexts; prefer current `overflow-wrap` rules for ordinary prose.
- `white-space: nowrap` prevents wrapping and often requires a deliberate scroller or truncation strategy.
- `text-overflow: ellipsis` only creates the expected single-line truncation when paired with constraints such as `overflow: hidden`, `white-space: nowrap`, and a limited inline size.

For a one-line label:

```css
.file-name {
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

Truncation should not be the only way users can discover important data. Consider an accessible full-name reveal, copy action, or responsive layout.

**Gotcha:** `text-overflow: ellipsis` does not itself cause overflow or set a width. It only controls how already-clipped inline content is indicated.

## 9. Images, Video, and Decorative Media

Media often needs clipping at a component boundary, but keep the crop intentional.

```css
.card__media {
  aspect-ratio: 16 / 9;
  overflow: clip;
}

.card__media img,
.card__media video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Use `object-fit: cover` for crop-to-fill and `contain` when the entire asset must remain visible. For a decorative image that scales on hover, clip only the media wrapper rather than the whole card:

```css
.card__media {
  overflow: clip;
}

.card__media img {
  transition: transform 220ms ease;
}

.card:hover .card__media img {
  transform: scale(1.04);
}

.card:focus-within .card__media img {
  transform: scale(1.02);
}

@media (prefers-reduced-motion: reduce) {
  .card__media img {
    transition: none;
  }
}
```

This prevents a transform from painting outside the media frame while keeping the card's controls and focus rings outside that clipping context.

**Gotcha:** A transform changes painting, not the normal-flow size. A scaled image can overlap neighbors unless a wrapper intentionally manages the visual boundary.

## 10. Overflow and Positioned Descendants

Menus, tooltips, date pickers, and popovers frequently need to paint outside their trigger's box. An ancestor with `overflow: hidden`, `clip`, `auto`, or `scroll` may clip them regardless of `z-index`.

```css
.card {
  overflow: hidden;
}

.card__menu {
  position: absolute;
  z-index: 1000;
}
```

The high `z-index` does not escape an ancestor's clipping boundary. Better strategies include:
- Move the overlay outside the clipping ancestor in the DOM when appropriate.
- Use a portal pattern in application frameworks.
- Use the browser's Popover API or a suitable top-layer mechanism when its behavior fits the product.
- Separate media clipping from content and overlay containers.
- Keep clipping local to decorative content.

A common structural pattern is:

```html
<article class="card">
  <div class="card__media">
    <img src="cover.jpg" alt="" />
  </div>
  <div class="card__content">
    <h2>Report</h2>
    <button type="button">More actions</button>
  </div>
</article>
```

```css
.card__media {
  overflow: clip;
}

.card__content {
  overflow: visible;
}
```

**Gotcha:** `z-index` controls stacking order within the relevant stacking contexts; it does not cancel clipping.

## 11. Overflow and Sticky Positioning

Sticky elements are positioned relative to a scroll container and the relevant scrolling ancestor. Introducing overflow on a wrapper can change which ancestor participates in scrolling, even when that wrapper never visibly scrolls.

```css
.page-shell {
  overflow: hidden;
}

.site-header {
  position: sticky;
  top: 0;
}
```

If the header stops sticking, inspect all ancestors for `overflow` and verify which element actually scrolls. Do not assume that `overflow: hidden` is harmless because the document remains the visible scroller.

Safer strategies:
- Put the sticky element outside a clipping wrapper.
- Clip only the specific decorative child that needs cropping.
- If a panel should be the scroll region, make that ownership explicit and place sticky elements inside it deliberately.
- Test at the actual viewport size and with realistic content.

**Gotcha:** A wrapper can alter sticky behavior without showing a scrollbar. Debug the scrolling ancestor chain, not just the page's scrollbar.

## 12. Scrollbars, Layout Shifts, and Gutter

Scrollbar width can affect available inline space and cause layout shifts when content begins overflowing. Modern CSS provides `scrollbar-gutter` to reserve space where supported.

```css
.document-panel {
  overflow: auto;
  scrollbar-gutter: stable;
}
```

`scrollbar-gutter: stable` can reserve a gutter for classic scrollbars and reduce content movement as overflow appears. Overlay scrollbars may not consume layout space, so the visible effect varies by operating system and browser.

Avoid styling scrollbars as the only indication that content is scrollable. Users need discoverable affordances, keyboard access, and adequate contrast. If custom scrollbar styling is used, preserve usability and test in multiple browsers.

**Gotcha:** A layout that looks aligned on a system with overlay scrollbars may shift on a system with classic scrollbars. Test both when the alignment is important.

## 13. Scroll Chaining and Touch Interaction

When a nested scroll region reaches its boundary, scrolling may propagate to an ancestor. This is called scroll chaining. `overscroll-behavior` can control that behavior.

```css
.chat-history {
  overflow-y: auto;
  overscroll-behavior-y: contain;
}
```

Use `contain` to prevent scroll chaining at the boundary of a component when that matches the interaction. `none` is stronger and can also suppress browser overscroll affordances. Do not disable expected page scrolling casually.

For touch interactions:
- Ensure the region has a visible and usable scroll affordance.
- Avoid trapping users in nested scroll areas.
- Check that horizontal scrollers do not interfere with vertical page scrolling.
- Test on touch devices and with trackpads, not only a mouse wheel.

**Gotcha:** Preventing scroll chaining can make a nested panel feel like a dead end if users do not realize it is independently scrollable.

## 14. Horizontal Scrollers and Scroll Snap

Horizontal scrollers work well for tab rows, media rails, and wide data where preserving content width is preferable to destructive wrapping.

```css
.media-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(15rem, 80%);
  gap: 1rem;
  overflow-x: auto;
  padding: 0.25rem 0 1rem;
  scroll-snap-type: x proximity;
}

.media-rail > * {
  scroll-snap-align: start;
}
```

Use `proximity` when gentle alignment is useful without forcing every movement into a snap point. `mandatory` can feel restrictive, especially when items are large or the scrollport is small. Ensure the last item can be reached and focus does not disappear at clipped edges.

```css
.media-rail {
  scroll-padding-inline: 1rem;
}
```

Use scroll padding to make snapped content align with comfortable inset spacing. Avoid using scroll snap as a substitute for a good responsive layout.

**Gotcha:** A scroller can technically work but still hide the fact that more items exist. Use partial next-item visibility, arrows, labels, or another clear affordance where appropriate.

## 15. Tables and Wide Data

Tables should preserve meaningful relationships between headers and cells. When the data is genuinely two-dimensional, horizontal scrolling can be preferable to crushing every column.

```html
<div class="table-scroll" role="region" aria-label="Monthly sales table" tabindex="0">
  <table>
    <caption>Monthly sales by region</caption>
    <thead>
      <tr><th scope="col">Region</th><th scope="col">January</th><th scope="col">February</th><th scope="col">March</th></tr>
    </thead>
    <tbody>
      <tr><th scope="row">North</th><td>120</td><td>132</td><td>145</td></tr>
    </tbody>
  </table>
</div>
```

```css
.table-scroll {
  max-inline-size: 100%;
  overflow-x: auto;
}

.table-scroll table {
  min-inline-size: 42rem;
  border-collapse: collapse;
}
```

Only add `tabindex="0"` when the region needs to be keyboard-focusable in the target browser/support context; provide an accessible name so its purpose is clear. Do not put `role="grid"` on a normal data table unless you are implementing the interaction model that role requires.

For mobile, decide whether to scroll, reformat as cards, or expose a reduced set of columns with a way to reach the complete data. The correct answer depends on the data's comparison task.

**Gotcha:** Making a table fit by hiding columns can remove essential information. A labelled scroller preserves the full data model when horizontal comparison matters.

## 16. Focus Rings and Keyboard Reachability

Clipping can cut off outlines, shadows, and focus indicators. A focusable element may technically receive focus while the visual indicator is partly or entirely invisible.

```css
.action-list {
  display: flex;
  gap: 0.75rem;
  padding: 0.25rem;
  overflow-x: auto;
}

.action-list a:focus-visible,
.action-list button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}
```

The padding provides room for outlines, but it cannot fix every clipping ancestor. Inspect the full ancestor chain. If the focus indicator still clips, move the clipping boundary, add appropriate internal spacing, or use a different visual treatment that remains visible.

Ensure keyboard users can scroll a focused item into view. Do not rely on hover to reveal controls that are otherwise unreachable.

**Gotcha:** Removing `outline` because it gets clipped solves the screenshot, not the accessibility problem. Fix the clipping geometry or choose a visible focus treatment.

## 17. Programmatic Scrolling

Scroll containers expose useful properties and methods such as `scrollTop`, `scrollLeft`, `scrollHeight`, `scrollWidth`, `clientHeight`, and `clientWidth`.

```js
const panel = document.querySelector(".log-output");

if (panel) {
  const isScrollable = panel.scrollHeight > panel.clientHeight;
  if (isScrollable) {
    panel.scrollTo({
      top: panel.scrollHeight,
      behavior: "smooth",
    });
  }
}
```

For chat and log views, auto-scrolling to the bottom can be helpful only when the user is already near the bottom. If they have scrolled upward to read older content, new messages should not repeatedly steal their scroll position.

A practical near-bottom check:

```js
function isNearBottom(element, tolerance = 48) {
  return element.scrollHeight - element.clientHeight - element.scrollTop <= tolerance;
}
```

Respect reduced motion for scripted smooth scrolling when motion could be distracting. Also avoid forcing focus to a scroll container just to make it move.

**Gotcha:** Automatically scrolling on every content update can take control away from users who are reading earlier content.

## 18. `hidden`, `display: none`, and Content Visibility Are Different

Do not conflate overflow clipping with hiding an element. `display: none` removes the element from layout and generally from the accessibility tree; `visibility: hidden` preserves layout space but hides rendering and typically makes descendants non-interactive; overflow clipping only affects painting/reachability beyond a boundary and does not remove the content itself.

`content-visibility: auto` is a rendering optimization for off-screen content, not a generic overflow fix. It may interact with containment and intrinsic-size calculations, so use it only with a clear performance goal and test layout behavior.

**Gotcha:** If content must be available to assistive technology and keyboard users, visual clipping is not an appropriate substitute for a deliberate disclosure or hiding pattern.

## 19. Logical Properties and Writing Modes

Prefer logical dimensions for reusable components:

```css
.panel {
  max-inline-size: 100%;
  max-block-size: 32rem;
  overflow-inline: auto;
  overflow-block: auto;
}
```

`overflow-inline` and `overflow-block` are logical-axis properties in modern CSS, but support and usage may differ across target environments. For broad compatibility, `overflow-x` and `overflow-y` remain widely understood. Always test in the writing modes the component supports.

Logical sizing properties such as `min-inline-size: 0` and `min-block-size: 0` are particularly useful in internationalized layouts because they express the intended axis rather than assuming horizontal writing.

**Gotcha:** Logical inline and block axes do not always correspond to physical horizontal and vertical axes.

## 20. Responsive Overflow Strategy

At a small viewport, a component should not create accidental page-level horizontal scrolling. Find the actual oversized element rather than hiding overflow on `body`.

```css
.page {
  min-inline-size: 0;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

@media (min-width: 48rem) {
  .content-grid {
    grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
  }
}
```

A sensible process:
1. Reproduce at the narrow viewport.
2. Identify the element extending beyond the viewport.
3. Check intrinsic widths, fixed widths, `white-space`, images, tables, and flex/grid minimum sizes.
4. Decide whether content should wrap, shrink, scroll, truncate, or reflow.
5. Fix the smallest responsible component.
6. Retest keyboard access and zoom.

Avoid global `overflow-x: hidden` as a routine patch. It can conceal content and make debugging harder.

**Gotcha:** The page may stop showing a horizontal scrollbar while a control or text is still cut off. A scrollbar disappearing is not proof that the layout is correct.

## 21. Debugging Overflow Systematically

Use this workflow instead of random CSS changes.

### Step 1: Find the overflowing box
In DevTools, inspect the viewport and likely containers. Compare `scrollWidth` to `clientWidth`, and `scrollHeight` to `clientHeight`.

```js
const elements = [...document.querySelectorAll("body *")];
const offenders = elements.filter((el) => {
  const rect = el.getBoundingClientRect();
  return rect.right > document.documentElement.clientWidth + 1 ||
         rect.left < -1;
});
console.table(offenders.map((el) => ({
  tag: el.tagName,
  className: typeof el.className === "string" ? el.className : "",
  left: Math.round(el.getBoundingClientRect().left),
  right: Math.round(el.getBoundingClientRect().right),
  width: Math.round(el.getBoundingClientRect().width),
  scrollWidth: el.scrollWidth,
  clientWidth: el.clientWidth,
})));
```

This is a diagnostic aid, not a perfect detector: transforms, fixed positioning, shadows, and intentional off-canvas UI can produce expected results.

### Step 2: Walk up the ancestor chain
Check computed `overflow-x` and `overflow-y`, dimensions, padding, borders, transforms, and positioning. Look for the first ancestor that clips the descendant or creates an unexpected scroll container.

### Step 3: Check intrinsic sizing
For flex and grid, inspect `min-width`/`min-inline-size`, `min-height`/`min-block-size`, `min-content` contributions, fixed track sizes, and `white-space`.

### Step 4: Verify the design intent
Choose among wrap, shrink, scroll, clip, or reflow. Do not pick `hidden` just because it makes the overflow indicator disappear.

### Step 5: Test access paths
Use keyboard navigation, visible focus, browser zoom, narrow viewport, touch scrolling, and screen-reader-friendly labels where needed.

**Gotcha:** The first overflowing descendant and the element whose overflow must be changed may be different. Diagnose the constraint and clipping ancestor separately.

## 22. Reusable Patterns

### Pattern A — A constrained application panel

```css
.app-shell {
  block-size: 100dvh;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.app-shell__content {
  min-block-size: 0;
  overflow: auto;
}
```

Use when the application header stays fixed in the shell and the content region owns scrolling. If the page should grow naturally instead, do not force a fixed-height shell.

### Pattern B — A resilient two-column workspace

```css
.workspace {
  display: grid;
  grid-template-columns: 16rem minmax(0, 1fr);
  min-inline-size: 0;
}

.workspace__main {
  min-inline-size: 0;
  min-block-size: 0;
  overflow: auto;
}
```

Use for dashboards, editors, and administration screens. Add a responsive breakpoint to stack or collapse the sidebar.

### Pattern C — A safe horizontal media rail

```css
.media-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(14rem, 75%);
  gap: 1rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x proximity;
  padding: 0.25rem 0.25rem 1rem;
}

.media-rail > * {
  scroll-snap-align: start;
}
```

Keep the scroller keyboard-accessible when needed and make additional content discoverable.

### Pattern D — A cropped image with unclipped actions

```css
.card__media {
  overflow: clip;
  aspect-ratio: 16 / 9;
}

.card__content {
  overflow: visible;
}
```

Use separate wrappers so decorative media can crop without clipping buttons, menus, or focus outlines.

### Pattern E — A robust wide table

```css
.table-scroll {
  max-inline-size: 100%;
  overflow-x: auto;
}

.table-scroll table {
  min-inline-size: 40rem;
}
```

Give the region a useful accessible name when it is keyboard-focusable. Preserve table headers and relationships.

### Pattern F — A truncating file name

```css
.file-row {
  display: flex;
  gap: 0.5rem;
}

.file-row__name {
  flex: 1;
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

Provide a way to discover or copy the full name when it carries meaningful information.

### Pattern G — A bounded log view

```css
.log-panel {
  max-block-size: 24rem;
  overflow: auto;
  overscroll-behavior: contain;
}
```

Use only when the bounded panel improves the task. Do not trap keyboard or touch users in a nested scroll region.

### Pattern H — Focus-safe scrollable actions

```css
.action-rail {
  display: flex;
  gap: 0.75rem;
  padding: 0.4rem;
  overflow-x: auto;
}

.action-rail :focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 2px;
}
```

Verify that the outline is not clipped by a higher ancestor and that the focused control can scroll into view.

### Pattern I — Intentional clipping for decorative shapes

```css
.artwork-frame {
  overflow: clip;
  border-radius: 1.5rem;
}

.artwork-frame__shape {
  transform: translate(10%, -8%) scale(1.1);
}
```

Clip only the artwork layer, not nearby content or interactive controls.

### Pattern J — Stable scrollbar geometry

```css
.results-panel {
  overflow: auto;
  scrollbar-gutter: stable;
}
```

Use when classic scrollbar appearance would otherwise shift aligned content. Confirm behavior in the target browsers and operating systems.

### Pattern K — Wrapping prose with long tokens

```css
.article-body {
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
```

Use for user-generated text, identifiers, and URLs when line wrapping is acceptable. Preserve preformatted code in its own deliberate scroller.

### Pattern L — Scroll-aware chat updates

```js
const shouldFollow = isNearBottom(chatPanel);
appendMessage(message);
if (shouldFollow) {
  chatPanel.scrollTo({ top: chatPanel.scrollHeight, behavior: "auto" });
}
```

Capture the near-bottom state before inserting content. Do not force follow mode after a user intentionally scrolls upward.

## 23. Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Adding `overflow: hidden` to `body` to hide horizontal scroll | Conceals the actual offender and can clip controls | Find the oversized element and correct its sizing or wrapping |
| Using `hidden` when you mean no-scroll clipping | Creates a scroll container and can affect sticky behavior | Consider `overflow: clip` |
| Assuming `clip` and `hidden` are equivalent | They differ in scroll-container behavior | Choose based on whether scrolling should exist |
| Giving a scroller no constrained size | Content simply expands instead of overflowing | Constrain its relevant size and let ancestors shrink |
| Forgetting `min-inline-size: 0` in flex layouts | Min-content sizing can force overflow | Put the shrink permission on the responsible flex item |
| Using `1fr` where the grid track needs a zero minimum | Automatic minimum sizing can expand the track | Use `minmax(0, 1fr)` |
| Setting `z-index: 999999` on a clipped dropdown | Stacking order does not escape overflow clipping | Move the overlay outside the clipping ancestor or use a top-layer approach |
| Clipping an entire card to crop its image | Buttons and focus rings may be cut off | Clip only the media wrapper |
| Expecting `text-overflow` to set the width | It only controls the clipping indicator | Set a width or flex constraint and required white-space/overflow rules |
| Using `white-space: nowrap` on arbitrary user text | A long token can force page-level overflow | Use wrapping or a labelled horizontal scroller |
| Removing focus outlines to fix clipping | Keyboard focus becomes difficult to see | Change the clipping boundary or focus style |
| Using a nested scroller without an affordance | Users may not discover more content | Add clear visual cues and keyboard support |
| Applying `overscroll-behavior: none` everywhere | Can suppress expected browser behavior | Apply it only to a deliberate interaction boundary |
| Using scroll snap with `mandatory` indiscriminately | Can make intermediate content hard to reach | Prefer `proximity` unless mandatory snapping is truly useful |
| Auto-scrolling every new chat message | Steals control from users reading history | Follow only when already near the bottom |
| Relying on a scrollbar's visual presence | Overlay scrollbars may disappear | Provide other cues and test interaction |
| Assuming `overflow-y: visible` remains visible beside `overflow-x: auto` | Axis computed values interact | Inspect computed styles and test |
| Forgetting transformed paint | Visual bounds can extend beyond layout bounds | Clip the intentional visual wrapper or adjust the transform |
| Making all table columns tiny to avoid scrolling | Destroys readable comparison | Use a responsive table strategy or labelled scroller |
| Fixing a sticky header by changing random `z-index` values | The real issue may be its scroll ancestor | Inspect overflow ancestors and scrolling ownership |
| Using overflow to hide content that should be disclosed | Clipped information may become unreachable | Implement a deliberate disclosure, responsive reflow, or accessible reveal |
| Treating `content-visibility` as an overflow fix | It addresses rendering performance, not overflow intent | Diagnose sizing and clipping separately |
| Setting only `max-width: 100%` on every descendant | Does not resolve all intrinsic sizing constraints | Find the exact flex/grid item and its minimum-size rule |
| Forgetting bottom padding around focus rings in a rail | Focus outline may be clipped at edges | Add internal space and verify ancestor clipping |
| Assuming `overflow: auto` always creates visible scrollbars | Platform scrollbar policies differ | Test on classic and overlay scrollbar environments |
| Making a log panel too short | Reading and selection become awkward | Pick a task-appropriate bound and test realistic content |
| Using a clipping wrapper around an entire page section | Unrelated descendants may be affected | Scope clipping to the smallest responsible wrapper |
| Ignoring browser zoom | Overflow may appear at 200% even if desktop looks fine | Test reflow and zoom as part of acceptance |
| Testing only with a mouse | Keyboard and touch reachability may fail | Test keyboard, touch, trackpad, and assistive labels |
| Mistaking intended horizontal scrolling for a bug | Important tabular or code content may be destroyed by wrapping | Make scrolling explicit and discoverable |

## 24. Mental Models

1. **Overflow is a content contract.** Decide whether excess content is visible, clipped, or reachable.
2. **Clipping is inherited through the ancestor chain.** A distant ancestor can cut off a descendant regardless of its `z-index`.
3. **Layout size and paint size differ.** Transforms and shadows affect visual painting without necessarily changing normal-flow dimensions.
4. **Scroll needs a boundary.** A scroll container needs constrained space in the axis that should scroll.
5. **Intrinsic sizing is often the real culprit.** Flex and grid children can resist shrinking because of their content-based minimum size.
6. **`hidden` is not the same as `clip`.** One establishes a scroll container; the other is intended for clipping without scrolling.
7. **Scroll ownership should be deliberate.** Decide whether the document or a component owns scrolling.
8. **Focus is content too.** Focus indicators must remain visible even when the component has tight edges.
9. **A disappearing scrollbar proves very little.** Content may still be clipped or unreachable.
10. **Fix the smallest responsible boundary.** Local corrections are safer than global overflow suppression.
11. **A high `z-index` cannot defeat clipping.** Stacking and clipping are different mechanisms.
12. **Responsive behavior is a choice among wrap, shrink, scroll, truncate, and reflow.** Pick the behavior that preserves the task.

## 25. Quick Reference

| Goal | Starting point | Verify |
|---|---|---|
| Normal content can paint beyond the box | `overflow: visible` | No ancestor clips it |
| Crop decorative visuals without scrolling | `overflow: clip` | No important content or focus ring is clipped |
| Scroll when needed | `overflow: auto` | A size constraint exists |
| Always provide a scroll mechanism | `overflow: scroll` | Persistent scrollbar behavior is desired |
| Hide excess but retain programmatic scrolling | `overflow: hidden` | Hidden scroll-container effects are acceptable |
| Fix flex child horizontal overflow | `min-inline-size: 0` | Correct child is allowed to shrink |
| Fix grid track expansion | `minmax(0, 1fr)` | Grid item constraints also make sense |
| Keep code on one line | `white-space: pre; overflow-x: auto` | Scroller is discoverable and usable |
| Wrap long prose/URLs | `overflow-wrap: anywhere` | Code/preformatted regions remain intentional |
| Ellipsis a single-line label | `overflow: hidden; white-space: nowrap; text-overflow: ellipsis` | Full text remains discoverable if important |
| Keep a menu outside clipping | Move it outside the clipping ancestor or use top layer | Keyboard and pointer behavior still works |
| Keep sticky behavior predictable | Audit overflow ancestors | Intended element owns scrolling |
| Reduce scrollbar layout shift | `scrollbar-gutter: stable` | Test classic and overlay scrollbar systems |
| Stop scroll chaining in a nested panel | `overscroll-behavior: contain` | No trapped or confusing interaction |
| Make a horizontal rail feel intentional | `overflow-x: auto` plus clear cues | Last item and focused controls are reachable |
| Diagnose viewport overflow | Compare `scrollWidth`/`clientWidth`; inspect bounds | No important content is hidden |

## 26. Build Challenge — Overflow Lab

Build a responsive admin workspace with a header, sidebar, main content, wide table, horizontal media rail, long file names, a log panel, and a dropdown menu. The challenge is complete only when the layout has an explicit overflow strategy for every component.

### Requirements

1. Use semantic `header`, `nav`, `main`, `section`, `article`, and `table` elements where appropriate.
2. Keep the document itself free of accidental horizontal overflow at a 320 CSS-pixel viewport.
3. Do not use global `overflow-x: hidden` to mask defects.
4. Build the workspace with CSS Grid.
5. Use `minmax(0, 1fr)` for the main track where content could otherwise expand it.
6. Add `min-inline-size: 0` to the relevant grid item.
7. Give the main content a deliberate scroll strategy.
8. Ensure the sidebar does not unexpectedly become a second scroll container.
9. Use a constrained log panel with `overflow: auto`.
10. Make the log panel's purpose clear to sighted users.
11. Prevent long prose and URLs from forcing the viewport wider.
12. Preserve preformatted code in a horizontally scrollable code region.
13. Add a wide table that can be horizontally scrolled on small screens.
14. Preserve table captions and header relationships.
15. Give a keyboard-focusable table region an accessible name.
16. Create a horizontal media rail with a visible indication that more items exist.
17. Ensure the rail's final item is reachable.
18. Use scroll snap only if it improves the interaction.
19. Clip only the media image area, not the whole interactive card.
20. Add an interactive dropdown that is not clipped by a media wrapper.
21. Verify that a high `z-index` is not being used as a fake fix for clipping.
22. Provide visible `:focus-visible` styles for links and buttons.
23. Verify focus outlines are not clipped at scroll-region edges.
24. Test keyboard-only navigation.
25. Test at 320px, 375px, 768px, 1024px, and a wide desktop viewport.
26. Test browser zoom at 200%.
27. Test with content long enough to trigger both horizontal and vertical overflow.
28. Test with keyboard, trackpad, and touch-style scrolling where possible.
29. Verify the chosen overflow values in computed styles.
30. Confirm that every scroll container has a meaningful size constraint.
31. Confirm the intended sticky header still behaves correctly after overflow rules are added.
32. Test with classic scrollbars if available.
33. Test with overlay scrollbars if available.
34. Check that truncation does not hide essential file names without a reveal path.
35. Ensure chat/log updates do not repeatedly yank the scroll position away from the user.
36. Add a short comment explaining why each non-default overflow value exists.
37. Remove any overflow rule that has no documented design reason.
38. Verify that transformed media does not overlap adjacent content.
39. Confirm the page remains usable with reduced motion enabled.
40. Document the final overflow ownership map: document, main panel, log panel, table scroller, and media rail.

### Acceptance checklist

- [ ] No accidental page-level horizontal overflow at narrow widths.
- [ ] Every deliberate scroller is constrained, labelled where needed, and reachable.
- [ ] No important content is silently clipped.
- [ ] Dropdowns and overlays are not trapped by unrelated clipping ancestors.
- [ ] Sticky behavior is tested against the actual scrolling ancestor.
- [ ] Focus indicators remain visible.
- [ ] Wide data remains available and understandable.
- [ ] The implementation uses the smallest responsible clipping boundary.
- [ ] Overflow rules are justified by a content or interaction requirement.
- [ ] Keyboard, zoom, and narrow viewport checks pass.

## 27. Final Engineering Checklist

Before shipping any overflow-related change, answer:

- What exact content exceeds the box?
- Is the overflow horizontal, vertical, or both?
- Should the content wrap, shrink, scroll, clip, truncate, or reflow?
- Which element owns the scroll interaction?
- Does the relevant element have a meaningful size constraint?
- Is flex/grid automatic minimum sizing involved?
- Could an ancestor clip menus, tooltips, focus rings, or transformed visuals?
- Could the rule change sticky positioning?
- Can keyboard users reach and see all controls?
- Is the full content still available when a label is truncated?
- Does the page work at narrow widths and high zoom?
- Does the solution behave consistently with the supported browser and scrollbar modes?
- Is the overflow rule placed on the smallest appropriate wrapper?
- Can the rule be explained in one sentence as part of the component contract?

A strong overflow fix is not the one that makes the scrollbar disappear. It is the one that preserves layout intent, content reachability, predictable scrolling, and accessible interaction.
