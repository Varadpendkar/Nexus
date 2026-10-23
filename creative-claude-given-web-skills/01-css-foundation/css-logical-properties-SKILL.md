# SKILL: css-logical-properties

## Layer
01 — CSS Foundation

## Goal
Use CSS logical properties to create layouts and components that adapt naturally to left-to-right, right-to-left, and vertical writing modes without duplicating styles for each direction.

## Why This Matters (Senior Perspective)

Logical properties make layout rules describe meaning rather than physical screen coordinates. A margin at the “start” of a line is more adaptable than a margin on the “left,” because the start edge changes with writing direction. A block-start border describes the beginning of a block flow, not a hard-coded top edge. This distinction matters for internationalized interfaces, reusable design systems, accessible reading experiences, and components that must survive changes in writing mode.

The senior-level goal is not to mechanically replace every `left` with `inline-start`. It is to understand the layout axis, decide whether a rule is semantic or intentionally physical, and define a consistent convention across components. Logical properties reduce duplicated RTL overrides, but they do not automatically fix directional icons, text alignment assumptions, transforms, shadows, background positions, or application logic.

A good logical-property system makes the default stylesheet more correct, makes localization less expensive, and gives future developers fewer special cases to remember.

## Core Concepts

### 1. Physical coordinates versus logical flow

Physical properties refer to fixed physical edges: `top`, `right`, `bottom`, and `left`. Logical properties refer to edges of the inline and block axes: `inline-start`, `inline-end`, `block-start`, and `block-end`.

```css
/* Physical */
.card {
  margin-left: 1rem;
  padding-top: 1rem;
}

/* Logical */
.card {
  margin-inline-start: 1rem;
  padding-block-start: 1rem;
}
```

For a typical horizontal writing mode, the inline axis follows the line of text and the block axis follows the stacking of lines. In `horizontal-tb`, block-start is the top edge. Inline-start is left in LTR and right in RTL.

**Gotcha:** “Logical” does not always mean “left/right but flipped.” In vertical writing modes, inline and block axes can map to physical top/bottom and left/right differently.

### 2. The inline axis

The inline axis follows the progression of content within a line. In horizontal writing modes it is usually horizontal; in vertical writing modes it is vertical.

Common inline-axis properties include:

- `margin-inline-start` and `margin-inline-end`
- `padding-inline-start` and `padding-inline-end`
- `border-inline-start` and `border-inline-end`
- `inset-inline-start` and `inset-inline-end`
- `inline-size` and `min-inline-size` / `max-inline-size`
- `text-align: start` and `text-align: end`

Use inline properties for spacing and alignment that should follow the reading direction.

### 3. The block axis

The block axis is the direction in which block-level content is laid out. In common horizontal writing, blocks stack vertically; in vertical writing modes, they stack horizontally.

Common block-axis properties include:

- `margin-block-start` and `margin-block-end`
- `padding-block-start` and `padding-block-end`
- `border-block-start` and `border-block-end`
- `inset-block-start` and `inset-block-end`
- `block-size` and `min-block-size` / `max-block-size`

Use block properties for spacing before or after a section, top/bottom-like borders in horizontal writing, and size constraints along the block axis.

### 4. Mapping depends on `writing-mode` and `direction`

The mapping from logical edges to physical edges depends on writing mode and text direction.

```css
.example {
  writing-mode: horizontal-tb;
  direction: ltr;
  margin-inline-start: 1rem; /* left in this mode */
}

.example-rtl {
  direction: rtl;
  margin-inline-start: 1rem; /* right in horizontal RTL */
}
```

`writing-mode` controls the orientation of lines and the block flow. `direction` sets the inline base direction for text and inline layout. Avoid assuming that changing `direction` is a universal way to mirror a whole interface; use semantic directionality and explicit component rules where needed.

**Gotcha:** Do not set `direction: rtl` on the whole page merely to mirror the UI. The document's language and writing direction should be correct, and components such as code samples, phone numbers, and mixed-direction content may need special handling.

### 5. One-value and two-value logical shorthands

`margin-inline` and `padding-inline` can set both inline edges or each edge separately.

```css
.card {
  margin-inline: auto;
  padding-inline: 1.25rem;
  padding-block: 1rem 1.5rem;
}
```

With two values, the first applies to the start edge and the second to the end edge for the relevant axis. Logical shorthands make component intent easier to read and reduce duplicate declarations.

### 6. Logical border properties

Use logical border properties when a border belongs to a semantic edge.

```css
blockquote {
  border-inline-start: 0.25rem solid var(--color-accent);
  padding-inline-start: 1rem;
}
```

This is a common internationalization pattern: the visual marker follows the start edge of the text in LTR and RTL. For section separators, `border-block-end` may be more meaningful than `border-bottom`.

**Gotcha:** A physical border may be correct for an element whose design is intentionally tied to the viewport or a physical object. Do not convert properties without understanding the design requirement.

### 7. Logical sizing: `inline-size` and `block-size`

`width` and `height` specify physical dimensions. `inline-size` and `block-size` specify dimensions along the logical axes.

```css
.avatar {
  inline-size: 3rem;
  block-size: 3rem;
  border-radius: 50%;
}
```

For a square avatar, logical sizing is harmless and keeps the rule axis-aware. For a horizontal progress bar whose width intentionally represents progress, physical `width` may be the clearer property. For a text panel whose size follows the line axis, `inline-size` communicates intent.

Use `min-inline-size`, `max-inline-size`, `min-block-size`, and `max-block-size` when the constraints should follow writing mode.

### 8. `min-width: 0` and logical minimum sizing

Flex and grid children can have automatic minimum sizes that prevent them from shrinking as expected. In logical layouts, `min-inline-size: 0` can express the same intent along the inline axis.

```css
.layout__main {
  min-inline-size: 0;
}
```

This is especially useful for long URLs, tables, code, and nested grids. It does not itself guarantee that content will wrap; choose wrapping and overflow behavior separately.

**Gotcha:** Replacing `min-width: 0` with `min-inline-size: 0` is correct only if the intended constraint follows the inline axis. In a component deliberately designed around physical width, keep the physical property.

### 9. Logical positioning and insets

`inset-inline-start`, `inset-inline-end`, `inset-block-start`, and `inset-block-end` position an absolutely or fixed-positioned element relative to its containing block's logical edges.

```css
.notification {
  position: fixed;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
}
```

The notification remains at the block-start and inline-end edges as direction changes. Make sure the containing block, positioning context, and expected reading direction are intentional.

### 10. Logical centering and auto margins

Logical auto margins can center a component along the inline axis:

```css
.container {
  inline-size: min(100% - 2rem, 72rem);
  margin-inline: auto;
}
```

This pattern is a practical default for centered page containers. It avoids separate left/right auto margins and reads as “center along the line axis.”

### 11. Text alignment: `start` and `end`

`text-align: start` and `text-align: end` align text according to the inline direction. They are generally better than `left` and `right` for text whose alignment should follow language direction.

```css
.price {
  text-align: end;
}
```

Do not automatically use `start` for every element. A logo, chart axis, or numeric dashboard column may have a deliberate physical alignment requirement. For tabular data, consider whether numeric values should align consistently for comparison.

**Gotcha:** `text-align: start` follows the inline direction; it does not mean “always left.” Test it with actual RTL content.

### 12. Logical floats and clear

`float: inline-start` and `float: inline-end` describe float placement in the logical inline direction.

```css
.article__illustration {
  float: inline-start;
  margin-inline-end: 1rem;
  margin-block-end: 0.5rem;
}
```

This can be useful for editorial layouts that allow text to wrap around an illustration. Modern application layouts usually use flexbox or grid instead of floats, but logical float values can help when text wrapping is the desired behavior.

### 13. Logical overflow properties

`overflow-inline` and `overflow-block` express overflow behavior along logical axes.

```css
.code-panel {
  overflow-inline: auto;
  max-inline-size: 100%;
}
```

Support and behavior should be checked against the project's browser matrix. For common horizontal code scrolling, `overflow-x: auto` may still be more immediately recognizable and explicit. Prefer logical overflow when the component genuinely needs axis-relative behavior and target browsers support it.

### 14. Logical border radius

Logical corner properties map corners according to writing mode and direction, for example `border-start-start-radius` and `border-end-end-radius`.

```css
.speech-bubble {
  border-start-start-radius: 1rem;
  border-start-end-radius: 1rem;
  border-end-start-radius: 0.25rem;
  border-end-end-radius: 1rem;
}
```

These properties can be useful when a shape's corner treatment is attached to the start or end of a message. If the shape is intentionally tied to a physical corner, physical radius properties are appropriate.

**Gotcha:** Do not assume `border-top-left-radius` always means the “start-start” corner. In RTL or vertical writing modes, the logical corner may map elsewhere.

### 15. Logical scroll margins and padding

Scroll snapping and scroll-into-view spacing can use logical properties:

```css
.anchor-target {
  scroll-margin-block-start: var(--header-size, 5rem);
}

.horizontal-scroller > * {
  scroll-snap-align: start;
  scroll-margin-inline: 0.5rem;
}
```

Logical scroll margins are useful when anchored headings need room for a sticky header or when a carousel follows inline progression. Test the actual scroll axis and snap behavior on the supported browsers.

### 16. Logical properties for sticky headers and anchors

A sticky header often uses `inset-block-start: 0` rather than `top: 0` when the intended edge is the beginning of block flow. Anchor targets can use `scroll-margin-block-start` to avoid being hidden behind the header.

```css
.site-header {
  position: sticky;
  inset-block-start: 0;
}

main :where(h2, h3, [id]) {
  scroll-margin-block-start: calc(var(--header-size) + 1rem);
}
```

Scope anchor styles carefully; applying them to every element with an ID may be too broad if IDs also identify widgets or controls.

### 17. Logical properties and flexbox

Flexbox has main and cross axes, which are determined by `flex-direction` and writing mode. Logical properties do not automatically mean “main axis” or “cross axis”; inline and block are different concepts.

```css
.toolbar {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  padding-inline: 1rem;
}
```

For `flex-direction: row`, the main axis follows the inline axis in typical writing modes. For `column`, the main axis follows the block axis. Use `gap` for inter-item spacing rather than margins that assume a physical direction.

**Gotcha:** `margin-inline-end` is not a universal replacement for “space after the previous flex item.” When layout direction changes, `gap` is often the more robust expression of spacing between items.

### 18. Logical properties and grid

Grid placement and track sizing can be written in logical terms when the intended dimension follows an axis. `inline-size` and `block-size` can be useful for components that should adapt to writing mode, while grid's column and row concepts remain grid-track concepts rather than direct synonyms for inline and block in every writing mode.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}
```

Use grid for two-dimensional layout and logical padding/margins for component internals. Do not try to translate every grid column into an inline property mechanically.

### 19. Logical properties in RTL interfaces

A right-to-left interface should not be treated as an LTR interface with every element mirrored. Some elements should follow text direction; others should preserve their conventional visual orientation. Logical spacing and borders are good candidates for automatic adaptation, while media controls, code editors, maps, charts, and certain icons may need explicit decisions.

```css
.breadcrumb__separator {
  margin-inline: 0.5rem;
}

/* Directional icon treatment is a separate design decision */
```

Prefer setting the correct `lang` and `dir` on the document or relevant content region. For mixed-direction snippets, use the appropriate HTML directionality features rather than relying on CSS alone.

### 20. Vertical writing modes

Vertical writing modes are a useful test of whether a component truly uses logical properties.

```css
.vertical-label {
  writing-mode: vertical-rl;
  inline-size: auto;
  block-size: 8rem;
  padding-inline: 0.5rem;
  padding-block: 1rem;
}
```

You do not need to design every interface for vertical writing, but understanding the mapping prevents inaccurate assumptions. Components intended for multilingual publishing, specialized editorial content, or reusable international design systems should be tested when relevant.

### 21. Logical properties and internationalized components

Build components around meaning: “space before the heading,” “border at the text start,” “badge at the inline end,” and “maximum reading width.” Avoid names and rules that encode English-centric geometry unless the visual requirement is genuinely physical.

```css
.field__hint {
  margin-block-start: 0.375rem;
}

.field__required-mark {
  margin-inline-start: 0.25em;
}
```

The markup must also be internationalization-ready: use correct language metadata, allow text expansion, avoid fixed heights that clip translated content, and test long labels. Logical CSS is one part of localization, not a complete localization strategy.

### 22. Physical properties that should remain physical

Logical properties are not always the best choice. Use physical coordinates when the visual behavior is explicitly tied to a physical edge, a horizontal media axis, or an implementation whose contract is physical.

Examples include:
- A horizontal slider whose progress is measured from a physical left-to-right coordinate by a third-party API.
- A shadow whose light source is intentionally on the physical left.
- A background image positioned at a specific physical corner in a branded composition.
- A transform that encodes a specific physical rotation.
- A chart axis with a fixed physical arrangement.
- A component that documents a fixed physical dimension for integration with a hardware viewport.

**Gotcha:** Logical properties express writing-flow semantics, not universal mirroring. Review icons, animations, transforms, shadows, background positions, and data visualizations separately.

### 23. Fallback strategy and compatibility

Most commonly used logical margin, padding, border, sizing, and inset properties are supported in modern browsers, but the precise support target should be checked for less common properties and values.

If a project requires older browsers, use a deliberate fallback order:

```css
.card {
  margin-left: 1rem;          /* fallback for older target */
  margin-inline-start: 1rem;  /* modern logical behavior */
}
```

This fallback is appropriate only when the physical fallback matches the intended LTR behavior and the modern declaration is supported by the target. In older RTL environments, the fallback may not adapt correctly; a carefully scoped legacy override may still be needed.

### 24. Avoid duplicate declarations that fight

Mixing physical and logical declarations in the same rule can be valid as a fallback, but unplanned duplication creates confusing overrides.

```css
/* Intentional fallback order */
.notice {
  padding-left: 1rem;
  padding-inline-start: 1rem;
}
```

Document why both declarations exist and keep the fallback before the modern declaration. Do not later append a conflicting `padding-left` in a component override without understanding that it can defeat the logical result in some situations.

### 25. Logical properties and design tokens

Design tokens should encode semantic intent where possible.

```css
:root {
  --space-inline-gutter: 1.25rem;
  --space-block-section: 3rem;
  --border-inline-accent: 0.25rem;
}

.page-shell {
  padding-inline: var(--space-inline-gutter);
}

.section {
  padding-block: var(--space-block-section);
}
```

Avoid overfitting tokens to physical edges unless the design system truly needs them. A token named `--left-padding` becomes ambiguous in RTL; `--space-inline-start` describes intent more reliably.

### 26. Logical properties and component APIs

Component variants should describe design intent rather than expose every possible physical edge.

```css
.callout {
  border-inline-start: 0.25rem solid var(--callout-accent);
  padding-inline: 1rem;
}

.callout--centered {
  text-align: center;
}
```

Prefer a small, documented API. If a consumer must override `margin-left`, `padding-right`, and `border-left` to customize the component, the original API may be too physical or too tightly coupled to the layout.

### 27. Logical properties in responsive design

Responsive behavior often changes available space, not the semantic direction of content. Use logical sizing and spacing with container constraints, fluid values, and content-driven layout.

```css
.page-shell {
  inline-size: min(100% - 2rem, 75rem);
  margin-inline: auto;
}

.hero {
  padding-block: clamp(2rem, 6vi, 6rem);
  padding-inline: clamp(1rem, 4vi, 3rem);
}
```

The `vi` unit follows the viewport's inline axis; `vw` is a physical viewport-width unit. Select units based on whether the design should follow writing mode or physical viewport width, and confirm browser support.

### 28. Logical properties and scroll direction

Carousels, tab strips, and horizontal scrollers need a clear decision about whether “next” follows inline progression or a product-defined physical direction. `scroll-snap-align: start` and logical scroll margins can help, but keyboard navigation and previous/next controls still need coherent behavior.

Do not assume that changing `direction` alone fixes scroll position, arrow keys, animation direction, or icon orientation. Test touch, keyboard, mouse, and RTL content.

### 29. Testing directionality

A meaningful directionality test includes more than changing a root CSS property. Render actual translated strings and test:
- LTR and RTL text.
- Long labels and expanded button text.
- Numbers, currency, dates, URLs, and code.
- Mixed-direction paragraphs.
- Directional icons and previous/next controls.
- Popovers, menus, notifications, and positioned badges.
- Focus order and keyboard behavior.
- Scroll snapping and anchor navigation.
- Responsive widths and text wrapping.

**Gotcha:** A page can appear mirrored correctly with placeholder text while real Arabic or Hebrew content reveals punctuation, number, and mixed-direction issues.

### 30. Debugging logical-property bugs

When a logical edge appears on the wrong side, inspect the computed `writing-mode` and `direction`, not just the CSS declaration.

Debugging sequence:
1. Inspect the element's computed `writing-mode`.
2. Inspect computed `direction` and the nearest relevant `dir` attribute.
3. Confirm whether the desired edge is inline or block.
4. Inspect computed logical and physical declarations and the cascade.
5. Check whether a later physical declaration overrides the intended logical property.
6. Test the same component in LTR and RTL.
7. Test vertical writing only when it is in scope.
8. Confirm the containing block for positioned elements.

**Gotcha:** If a logical declaration appears correct but the visual edge is unexpected, the problem may be the element's writing context rather than the property itself.

## Reusable Patterns

### Pattern 1 — Centered responsive page shell

```css
.page-shell {
  inline-size: min(100% - 2rem, 76rem);
  margin-inline: auto;
}
```

Use for a centered content wrapper. The inline size follows the line axis and the margins center the shell along that axis.

### Pattern 2 — Section rhythm

```css
.section {
  padding-block: clamp(2rem, 5vi, 5rem);
}

.section__title {
  margin-block-end: 1rem;
}
```

Use block-axis spacing to describe vertical rhythm in horizontal writing and adapt correctly in other writing modes.

### Pattern 3 — RTL-safe accent border

```css
.callout {
  border-inline-start: 0.25rem solid var(--color-accent);
  padding-inline-start: 1rem;
}
```

Use when the accent belongs at the start of the reading flow, such as a quotation, tip, or important note.

### Pattern 4 — Positioned status badge

```css
.avatar {
  position: relative;
}

.avatar__status {
  position: absolute;
  inset-block-end: 0;
  inset-inline-end: 0;
  inline-size: 0.75rem;
  block-size: 0.75rem;
  border-radius: 50%;
}
```

The badge stays at block-end and inline-end. Confirm that this matches the product's meaning in both LTR and RTL.

### Pattern 5 — Form hint and error spacing

```css
.field__hint,
.field__error {
  margin-block-start: 0.375rem;
}

.field__required {
  margin-inline-start: 0.25em;
}
```

Use block spacing for content below the control and inline spacing for a mark that follows the label text. Ensure the mark and error are semantically meaningful.

### Pattern 6 — Sticky header and anchor offset

```css
:root {
  --header-size: 4.5rem;
}

.site-header {
  position: sticky;
  inset-block-start: 0;
}

.article :where(h2, h3, [id]) {
  scroll-margin-block-start: calc(var(--header-size) + 1rem);
}
```

Scope anchor offsets to content headings or known targets. Do not blindly apply to all IDs if the page uses IDs for non-scroll targets.

### Pattern 7 — Logical card sizing

```css
.card {
  inline-size: 100%;
  min-inline-size: 0;
  padding-inline: 1rem;
  padding-block: 1.25rem;
}
```

Use for a card that should fill its available inline space without causing nested layout overflow. Add overflow and wrapping rules separately for long content.

### Pattern 8 — Logical editorial image float

```css
.article__image {
  float: inline-start;
  max-inline-size: min(45%, 18rem);
  margin-inline-end: 1rem;
  margin-block-end: 0.75rem;
}
```

Use only when text should wrap around the image. For general application layout, prefer grid or flexbox.

### Pattern 9 — Inline scroller

```css
.tab-strip {
  display: flex;
  gap: 0.5rem;
  overflow-inline: auto;
  padding-inline: 1rem;
  scroll-padding-inline: 1rem;
}

.tab-strip > * {
  flex: 0 0 auto;
  scroll-snap-align: start;
}
```

Confirm support for logical overflow properties in the target browsers. If necessary, use the physical axis property that matches the component's explicitly horizontal contract.

### Pattern 10 — Logical text marker

```css
blockquote {
  border-inline-start: 0.25rem solid var(--color-quote);
  padding-inline-start: 1rem;
  margin-inline: 0;
}
```

This keeps the quote marker aligned with the reading start edge and avoids separate RTL styles for the same semantic effect.

### Pattern 11 — Physical property retained intentionally

```css
.brand-artwork {
  background-position: left 1rem bottom 1rem;
}
```

This can be appropriate when a branded composition is intentionally anchored to the physical bottom-left. Add a comment explaining that the placement is not expected to mirror with text direction.

### Pattern 12 — Logical token naming

```css
:root {
  --page-gutter-inline: clamp(1rem, 4vi, 3rem);
  --section-space-block: clamp(2rem, 6vb, 5rem);
}

.page-shell {
  padding-inline: var(--page-gutter-inline);
}

.section {
  padding-block: var(--section-space-block);
}
```

Use names that encode the axis and role. Check whether `vi` and `vb` match the product's browser support target and desired viewport behavior.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Replacing every `left` with `inline-start` | Some designs are intentionally physical | Decide whether the rule follows writing flow or a physical coordinate |
| Assuming inline-start always means left | RTL and vertical writing can change the mapping | Test actual writing mode and direction |
| Assuming block-start always means top | Vertical writing modes can change the mapping | Use the writing context to determine the edge |
| Changing only `direction` to mirror a whole UI | Icons, code, charts, scroll behavior, and layout logic may need separate decisions | Set correct document direction and review each component |
| Using physical `left` and `right` for semantic spacing | Creates RTL overrides and duplicate rules | Use logical margins, padding, borders, and insets |
| Using logical properties without understanding flex axes | Inline/block axes are not synonyms for main/cross axes | Determine writing mode and `flex-direction` separately |
| Replacing every `margin` with a logical property | Can obscure an intentionally physical requirement | Convert properties based on semantic intent |
| Using `margin-inline-end` for spacing between flex items | Can leave inconsistent edge spacing and direction assumptions | Prefer `gap` for inter-item spacing |
| Forgetting that `text-align: start` can be right-aligned | Misreads start as a physical left edge | Test LTR and RTL content |
| Treating logical sizing as always better | A physical width may be part of an integration contract | Use `inline-size` when the constraint follows the inline axis |
| Forgetting `min-inline-size: 0` in a nested layout | Long content can force grid or flex tracks wider than intended | Set logical minimum sizing where shrinking is intended |
| Using logical insets without checking containing block | Positioned elements may anchor to an unexpected box | Verify positioning context and inset mapping |
| Mixing physical and logical declarations accidentally | Later declarations may override the intended result | Keep fallbacks ordered and document why both exist |
| Adding an RTL override after logical properties without need | Reintroduces duplicate styles | Remove redundant overrides after testing |
| Assuming logical properties fix directional icons | Icon artwork may encode direction independently | Define icon mirroring rules explicitly |
| Mirroring every icon in RTL | Many icons are non-directional or should stay physically oriented | Mirror only icons whose meaning depends on direction |
| Using `border-inline-start` for a physically fixed brand stripe | Changes placement when direction changes | Keep the physical border and document the intent |
| Treating `overflow-inline` as universally supported | Less common logical overflow support can differ | Check the target matrix and provide a fallback |
| Using `scroll-margin-block-start` on every ID | Some IDs are not anchor targets | Scope to headings and actual scroll targets |
| Assuming `scroll-snap-align: start` fixes all RTL scrolling | Controls and scroll behavior still require testing | Test browser behavior and interaction methods |
| Using fixed heights for translated labels | Text expansion can clip content | Prefer content-driven sizing and logical minimum sizes |
| Naming tokens `--left-space` when the value is semantic | The name is misleading in RTL | Name tokens by axis and purpose |
| Designing only with English placeholder text | Directionality and expansion issues stay hidden | Test actual localized strings and mixed-direction content |
| Ignoring `lang` and `dir` metadata | CSS cannot replace correct document semantics | Set language and direction on the correct content region |
| Using CSS alone for mixed-direction content | Bidirectional text can reorder punctuation and numbers unexpectedly | Use correct HTML directionality markup and test real content |
| Using `vi` or `vb` without considering support and design intent | Viewport logical units may not match a physical-width design | Choose units based on desired axis and browser target |
| Confusing grid columns with inline axis in every writing mode | Grid tracks and writing axes are related but not identical concepts | Use grid for layout and logical properties for semantic component edges |
| Keeping both `min-width` and `min-inline-size` without a reason | Creates unclear or conflicting constraints | Use a documented fallback or one canonical property |
| Using a logical corner radius without testing the shape | Corner mapping may not match the intended bubble or badge | Test LTR, RTL, and relevant writing modes |
| Forgetting that `float: inline-start` is for text wrapping | Floats can complicate application layout | Prefer grid/flex unless text wrap is intended |
| Using logical properties as a complete localization solution | Content, icons, formatting, and interaction also need localization | Treat logical CSS as one part of an internationalization plan |
| Failing to inspect computed `writing-mode` | The declaration may be correct for a different context | Debug writing mode and direction before changing CSS |
| Overriding logical properties with physical properties in a later rule | The later physical rule can defeat intended behavior | Inspect the cascade and remove conflicting declarations |
| Assuming `direction: rtl` automatically changes DOM or keyboard order | Visual flow and semantic/navigation order are different concerns | Keep DOM order meaningful and test keyboard interaction |
| Using `text-align: end` for numeric data without review | It may reduce scanability in a comparison table | Choose alignment based on data-reading conventions |
| Using logical sizing for a fixed physical media viewport | Changes behavior in non-horizontal writing modes | Keep physical sizing where the contract is physical |
| Applying `margin-inline: auto` to an element without a constrained inline size | Auto margins may not visibly center it | Set an appropriate inline-size or max-inline-size |
| Treating logical borders as decoration only | The border may be an important state cue | Preserve contrast and non-color state communication |
| Ignoring text wrapping when switching to logical sizing | Long strings can still overflow | Add `overflow-wrap`, `min-inline-size`, or scroll behavior as appropriate |
| Using logical properties but retaining redundant directional selectors | The stylesheet stays more complex than needed | Remove legacy overrides after compatibility testing |
| Testing only by toggling the root direction | Nested LTR snippets and localized components may differ | Test component-level directionality and mixed content |
| Assuming a visual RTL screenshot proves accessibility | Focus, reading order, and control behavior may still be wrong | Run keyboard and assistive-technology checks |
| Failing to document an intentional physical property | Future developers may “fix” it incorrectly | Add a brief comment explaining the physical design contract |
| Applying logical properties inconsistently across a design system | Components need special overrides and become hard to compose | Establish naming and usage conventions |
| Using logical properties where the feature support target is unknown | Unexpected fallback gaps can occur | Check support and test the actual browser matrix |
| Treating `inline-size` as a synonym for `width` in every mode | The axis can change with writing mode | Choose the property that expresses the intended dimension |
| Treating `block-size` as a synonym for `height` in every mode | The block axis can be physical horizontal | Use it only when the constraint follows block flow |
| Using physical `top` for a sticky edge that means block-start | The behavior is less adaptable to writing mode | Use `inset-block-start` when the semantic edge is intended |
| Using logical scroll properties without testing the actual scroll axis | Snap and anchor offsets can be misapplied | Test with real interaction in supported browsers |
| Assuming logical property fallbacks automatically support old RTL browsers | The physical fallback may still point to the wrong edge | Add a narrowly scoped legacy fallback if required |
| Using the wrong axis token for spacing | A block rhythm token may be applied to inline spacing | Name tokens by axis and role and review usage |
| Ignoring browser support for corner, float, or overflow logical variants | Less common properties may not match the support of basic margin/padding | Verify each feature used, not just “logical properties” generally |
| Replacing physical values in a chart or map without checking visual meaning | Axis placement and geographic orientation may be intentional | Keep data visualization conventions explicit |
| Assuming CSS can reverse application behavior | CSS does not automatically reverse click logic or next/previous semantics | Align UI layout, labels, DOM, and application behavior deliberately |
| Using logical spacing on a directional icon without a mirroring plan | Spacing can adapt while the artwork remains misleading | Treat icon orientation as a separate design-system decision |

## Mental Models

1. **Logical properties describe flow, not screen coordinates.** Think in terms of reading and block progression.
2. **Inline is the line axis; block is the stacking axis.** Their physical mapping depends on writing mode.
3. **Direction and writing mode are different inputs.** `direction` influences inline progression; `writing-mode` changes axis orientation.
4. **A logical property is a semantic promise.** Use it when the design should adapt with the writing context.
5. **Physical properties are still valid.** Keep them when the visual contract is intentionally physical.
6. **`gap` expresses space between layout items.** It often replaces directional margins in flex and grid.
7. **RTL is localization, not mirroring.** Some geometry follows text; other visuals and behaviors require product decisions.
8. **Logical CSS reduces overrides, not all localization work.** Language, content, icons, formatting, and interaction still matter.
9. **Writing context is inherited and inspectable.** Debug `writing-mode` and `direction` before changing declarations.
10. **Axis-aware sizing is not automatically axis-agnostic design.** Use `inline-size` only when the intended size follows the inline axis.
11. **Fallbacks must be intentional.** Legacy physical declarations may not support RTL by themselves.
12. **Component tokens should encode meaning.** `--space-inline-start` survives localization better than `--left-padding`.
13. **Responsive and logical are complementary.** Responsive rules address available space; logical rules address flow semantics.
14. **A direction-sensitive shape needs explicit review.** Borders and corner radii may adapt, while icons and artwork may not.
15. **Test real content, not just a flipped screenshot.** Mixed-direction strings and expanded labels expose hidden assumptions.
16. **Semantic HTML remains the foundation.** CSS can adapt layout but cannot repair incorrect language, direction, or reading order.

## Quick Reference

| Intent | Logical property | Typical physical mapping in horizontal writing |
|---|---|---|
| Start-side margin | `margin-inline-start` | Left in LTR, right in RTL |
| End-side margin | `margin-inline-end` | Right in LTR, left in RTL |
| Space before a block | `margin-block-start` | Top |
| Space after a block | `margin-block-end` | Bottom |
| Inline padding | `padding-inline` | Left/right |
| Block padding | `padding-block` | Top/bottom |
| Start border | `border-inline-start` | Left in LTR, right in RTL |
| Block-end border | `border-block-end` | Bottom |
| Logical position at inline end | `inset-inline-end` | Right in LTR, left in RTL |
| Logical position at block start | `inset-block-start` | Top |
| Size along inline axis | `inline-size` | Width |
| Size along block axis | `block-size` | Height |
| Minimum inline size | `min-inline-size` | `min-width` |
| Maximum block size | `max-block-size` | `max-height` |
| Align text with inline start | `text-align: start` | Left in LTR, right in RTL |
| Align text with inline end | `text-align: end` | Right in LTR, left in RTL |
| Inline-axis float | `float: inline-start` | Left in LTR, right in RTL |
| Sticky at block start | `inset-block-start: 0` | `top: 0` in horizontal writing |
| Anchor offset along block axis | `scroll-margin-block-start` | Top scroll margin |
| Logical corner | `border-start-start-radius` | Depends on writing mode and direction |

## Build Challenge

Build an **internationalization-ready component page** containing a centered page shell, navigation, a callout, a form field, a status badge, and a responsive card grid. It must work in LTR and RTL and document any intentionally physical behavior.

### Requirements

1. Create a centered page shell with `inline-size` and `margin-inline`.
2. Use logical inline padding for the page gutter.
3. Use logical block padding for section rhythm.
4. Use `margin-block-start` or `margin-block-end` for vertical content spacing.
5. Create a callout with `border-inline-start`.
6. Ensure the callout's text padding follows the same logical edge as the border.
7. Use `text-align: start` for a paragraph that follows the reading direction.
8. Include one deliberate physical alignment and explain why it should not mirror.
9. Position a status badge with logical insets.
10. Give the badge logical inline and block sizes if its dimensions are flow-relative.
11. Use `min-inline-size: 0` on a grid/flex child that must be allowed to shrink.
12. Make a form hint sit below its control with block-axis spacing.
13. Place a required marker with inline-axis spacing.
14. Keep a visible `:focus-visible` indicator on each interactive control.
15. Test the page with `dir="ltr"` and `dir="rtl"`.
16. Use actual RTL text for at least one test, not only a CSS direction toggle.
17. Test a long translated label that expands beyond the English version.
18. Check mixed-direction text containing numbers or a URL.
19. Verify that `lang` and `dir` are set on the correct document or content region.
20. Test whether any icon should mirror and document the decision.
21. Test previous/next controls and ensure their labels match behavior.
22. Use `gap` for spacing between flex or grid items where appropriate.
23. Keep physical width/height where a component contract is intentionally physical.
24. Use logical sizing where the size should follow the inline or block axis.
25. Verify that fixed heights do not clip translated text.
26. Test the callout, badge, and navigation in both directions.
27. Test the responsive layout at narrow and wide viewports.
28. Check sticky header and anchor offsets if the page includes anchored sections.
29. Verify that scroll behavior remains understandable in RTL.
30. Check the target browser matrix for less common logical properties used.
31. Provide a fallback if the target includes browsers without a used logical feature.
32. Keep physical fallback declarations before modern logical declarations when using that fallback strategy.
33. Document every duplicate physical/logical declaration pair.
34. Remove redundant RTL overrides after confirming the logical declarations work.
35. Name spacing tokens by axis and purpose rather than left/right.
36. Ensure semantic states do not rely on color alone.
37. Confirm focus order remains meaningful in both directions.
38. Test a nested LTR code sample inside RTL content.
39. Inspect computed `writing-mode` and `direction` when a logical edge appears wrong.
40. Verify that no physical override unintentionally defeats a logical declaration.
41. Confirm the design does not depend on changing `direction` to fix application logic.
42. Add a short note explaining the difference between inline/block axes and flex main/cross axes.
43. Ask another developer to review the physical-versus-logical decisions.
44. Ensure the resulting stylesheet has fewer direction-specific overrides than a physical-only version.
45. Verify the component is still understandable without knowledge of the original LTR design.

### Definition of done

- [ ] The page renders correctly in LTR and RTL.
- [ ] Logical properties are used where the design follows writing flow.
- [ ] Physical properties remain only where the design contract is genuinely physical.
- [ ] Text expansion does not clip content.
- [ ] Focus indicators and interaction order remain usable.
- [ ] Directional icons and controls have an explicit behavior decision.
- [ ] Fallbacks and browser support are documented.
- [ ] No redundant direction-specific rules remain without justification.
