# SKILL: fluid-spacing

## Layer
01 — CSS Foundation

## Goal
Design fluid spacing systems that scale smoothly across viewport sizes while preserving rhythm, hierarchy, readability, and intentional layout constraints. Use `clamp()`, `min()`, `max()`, CSS custom properties, and a small set of deliberate spacing relationships to replace brittle piles of breakpoint overrides.

## Why This Matters (Senior Perspective)
Spacing is not just decoration. It determines grouping, scanning order, perceived density, and how a page responds to different screens and content lengths. A weak system usually grows as unrelated values—`17px` here, `31px` there, then another media query to patch a tablet layout. A strong system expresses a small number of relationships: compact gaps stay compact, section spacing grows more generously, and content remains bounded even on ultrawide displays.

Senior-level spacing work is not “make everything bigger on desktop.” It means choosing which dimensions should scale, which should remain stable, which should be bounded, and which should respond to the content rather than the viewport. The result should remain coherent at narrow widths, zoomed text, unusual viewport dimensions, and with real content rather than only the happy-path mockup.

---

## Core Concepts

### 1. Fixed, fluid, and bounded spacing

**Gotcha:** Do not infer that a spacing value must scale just because the viewport changes. If the visual relationship should remain constant, a fixed token is often more predictable.

**Fixed spacing** stays the same at all viewport sizes. It is appropriate for tiny icon gaps, border offsets, and values whose visual role does not change much.

```css
.icon-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
```

**Fluid spacing** changes continuously with an input such as viewport width. It is useful when a layout benefits from gradual expansion rather than abrupt breakpoint jumps.

```css
.section {
  padding-block: 2rem 4rem;
}
@media (min-width: 60rem) {
  .section {
    padding-block: 3rem 6rem;
  }
}
```

The media-query version above is valid, but the change happens in steps. A fluid equivalent can be smoother:

```css
.section {
  padding-block: clamp(2rem, 1rem + 3vw, 5rem);
}
```

**Bounded fluid spacing** has a minimum, a preferred fluid value, and a maximum. It is usually the safest default for design-system spacing because it avoids both cramped small screens and absurdly large gaps on wide screens.

```css
.page-section {
  padding-block: clamp(2.5rem, 1.5rem + 4vw, 5.5rem);
}
```

Choose fixed spacing when consistency matters more than scaling, fluid spacing when continuous change is useful, and bounded fluid spacing when the value should grow but must remain within a deliberate range.

### 2. Understand `clamp()`, `min()`, and `max()`

`clamp(MIN, PREFERRED, MAX)` returns the preferred value constrained between the minimum and maximum. It does not mean “use the middle value at every width”; the preferred expression can itself be viewport-relative.

```css
.hero {
  padding-block: clamp(3rem, 2rem + 5vw, 7rem);
}
```

`min()` returns the smallest of its arguments. It is useful for capping a dimension or choosing the tighter constraint.

```css
.article {
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
}
```

`max()` returns the largest of its arguments. It can preserve a minimum gutter even when another expression becomes small.

```css
.page {
  padding-inline: max(1rem, 4vw);
}
```

You can combine these functions, but prefer readable expressions that communicate the intended constraint. A deeply nested calculation may be mathematically valid and still be difficult to maintain.

**Gotcha:** CSS math functions require compatible types and valid syntax. When subtracting a length from a percentage, make the expression explicit: `width: min(100% - 2rem, 72rem);` is valid modern CSS math syntax, while unsupported or malformed calculations may invalidate the declaration. Test in your browser support target.

### 3. The preferred value: a base plus a fluid slope

**Gotcha:** A preferred expression can be mathematically smooth but visually wrong. Compare it against the surrounding type scale and the actual composition at several widths.

A common fluid formula has a stable base and a viewport-relative contribution:

```css
padding-inline: clamp(1rem, 0.5rem + 2vw, 3rem);
```

The base prevents the value from collapsing toward zero. The `vw` term introduces continuous growth. The clamp limits the final result.

Avoid blindly using `5vw` for every spacing token. A slope that feels right for a hero section may be excessive for a card gap. The appropriate slope depends on the spacing role and the intended viewport range.

### 4. Choose a scale before assigning values

**Gotcha:** A scale is a guide, not a reason to force unrelated relationships into the same token. Keep deliberate exceptions when the design meaning is genuinely different.

A spacing scale gives the interface a recognizable rhythm. A simple scale can use a base unit and multiples:

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
```

The scale need not be mathematically perfect. It needs to be small enough to remember and broad enough to express real hierarchy. Missing values should not automatically trigger a new token; first ask whether an existing token can serve the role.

A practical system usually distinguishes at least:
- **Micro spacing:** icon offsets, compact inline gaps, and small control internals.
- **Component spacing:** button padding, card padding, field groups, and list gaps.
- **Section spacing:** distance between major page regions.
- **Layout gutters:** the breathing room between content and the viewport edge.
- **Content width constraints:** the maximum measure or width that keeps a layout readable.

### 5. Separate spacing roles from raw values

Prefer names that explain why a value exists rather than where it happens to be used.

```css
:root {
  --space-inline-compact: 0.5rem;
  --space-component: 1.25rem;
  --space-section: clamp(3rem, 2rem + 4vw, 6rem);
  --page-gutter: clamp(1rem, 4vw, 3rem);
  --content-max: 72rem;
}
```

Avoid a token inventory where every component gets a unique value such as `--pricing-card-padding`, `--about-card-padding`, and `--contact-card-padding` even when they express the same role. Component-specific tokens are useful when a component has a real contract, but should often reference shared primitives.

```css
.card {
  padding: var(--card-padding, var(--space-component));
}
```

**Gotcha:** Custom-property fallbacks are used when the referenced custom property is missing or invalid at computed-value time; they are not a general-purpose error recovery system for every malformed declaration. Keep the token definitions valid and inspect computed styles during debugging.

### 6. Use logical properties for writing-mode resilience

Spacing systems should normally use logical properties such as `padding-inline`, `margin-block`, `inset-inline`, and `gap` where appropriate. They describe layout relationships rather than hard-coding left/right or top/bottom.

```css
.page-shell {
  padding-inline: var(--page-gutter);
}

.section + .section {
  margin-block-start: var(--space-section);
}
```

This makes the system more adaptable to right-to-left interfaces and vertical writing modes. Logical properties do not automatically solve every internationalization issue, but they reduce assumptions about physical direction.

### 7. Fluid page gutters

**Gotcha:** A `width: min(100%, 78rem)` child inside a padded parent already has a smaller available containing block. Confirm the box model before adding another width subtraction.

A page gutter often needs a comfortable minimum, some growth on medium screens, and a cap on large screens.

```css
:root {
  --page-gutter: clamp(1rem, 4vw, 3.5rem);
}

.site-shell {
  padding-inline: var(--page-gutter);
}
```

If the content also needs a maximum width, center the content separately:

```css
.content-shell {
  width: min(100%, 78rem);
  margin-inline: auto;
  padding-inline: var(--page-gutter);
}
```

Be careful not to apply the gutter twice. If the outer shell already provides inline padding, child content containers usually should not add another full page gutter unless the design intentionally nests spacing.

### 8. Fluid section spacing

**Gotcha:** If every section uses the largest spacing token, hierarchy disappears. Reserve generous rhythm for major transitions and use a compact role for supporting sections.

Section spacing communicates hierarchy. A hero may need a larger block padding than a compact FAQ group, and repeated content sections should usually share a predictable rhythm.

```css
:root {
  --section-space-sm: clamp(2rem, 1.5rem + 2vw, 3.5rem);
  --section-space-lg: clamp(3.5rem, 2rem + 5vw, 7rem);
}

.section {
  padding-block: var(--section-space-sm);
}

.section--feature {
  padding-block: var(--section-space-lg);
}
```

Do not make every section independently fluid. Create a small number of semantic spacing roles and let page composition use those roles consistently.

### 9. Component padding and internal rhythm

Component padding should account for content density and component behavior. A card containing a short title and one sentence may not need the same padding as a feature panel containing a heading, paragraph, and action.

```css
.card {
  padding: clamp(1rem, 0.75rem + 1vw, 1.75rem);
  display: grid;
  gap: 1rem;
}
```

For controls, ensure the spacing does not compromise target size or text wrapping:

```css
.button {
  padding-block: 0.75em;
  padding-inline: 1.1em;
}
```

Using `em` for control padding can make the padding scale with the control's own font size. This may be desirable for size variants, but test how it behaves when text zoom or inherited typography changes.

### 10. Use `gap` before margin-based spacing hacks

For layout systems using Flexbox or Grid, `gap` expresses the distance between items directly:

```css
.feature-list {
  display: grid;
  gap: clamp(1rem, 0.75rem + 1vw, 2rem);
}
```

This often avoids margin-collapsing surprises and last-child cleanup rules. Margins remain useful for relationships outside a layout container, but do not layer `gap`, child margins, and parent padding without a clear reason.

**Gotcha:** `gap` applies between layout items, not around the outside edge of the container. Add container padding separately when the layout needs an outer gutter.

### 11. Spacing and content density

**Gotcha:** Do not let a compact density setting shrink keyboard focus separation or usable control areas below the interface's accessibility requirements.

Dense interfaces often need tighter spacing than editorial or marketing pages. A data table, settings panel, and long-form article should not necessarily share identical density tokens.

```css
:root {
  --density-compact: 0.75rem;
  --density-comfortable: 1.25rem;
  --density-relaxed: 2rem;
}

[data-density="compact"] .panel {
  gap: var(--density-compact);
}

[data-density="comfortable"] .panel {
  gap: var(--density-comfortable);
}
```

Use density modes deliberately. Do not rely on arbitrary scaling of every token, because some dimensions—such as minimum touch target spacing or focus indicator offsets—may need independent constraints.

### 12. Responsive spacing is not simply viewport spacing

A viewport-relative value responds to the viewport, not to the component's actual available space. A card inside a narrow sidebar on a wide desktop may still receive a large `vw`-based padding. Where component width matters more than viewport width, consider container queries or container query units if your browser support target allows them.

```css
.card-region {
  container-type: inline-size;
}

.card {
  padding: clamp(1rem, 4cqi, 2rem);
}
```

Container query units are powerful but can be less familiar to maintainers. Use them when the component genuinely needs to adapt to its container, and keep a sensible minimum and maximum.

### 13. Avoid the “magic number” trap

A one-off value is not automatically bad. The problem is a value that has no stated role, repeats inconsistently, or exists to patch a symptom without understanding the layout.

Before adding a new value, ask:
1. Is this a shared spacing role?
2. Is it a deliberate exception?
3. Does it solve the real constraint, or hide another issue?
4. Should it be fixed, fluid, or bounded?
5. Does it remain useful at zoom and narrow widths?

Document meaningful exceptions in the component rather than building a giant global scale for every rare pixel adjustment.

### 14. Accessibility, zoom, and user settings

**Gotcha:** A design that only passes at default zoom is not finished. Recheck wrapping, overflow, and focus visibility after zooming and enlarging text.

Use relative units for spacing that should follow text size, and test layouts at browser zoom levels and with increased text size. A fluid system must not squeeze text or controls when the user enlarges content.

- Do not set fixed heights on text-containing cards merely to preserve visual alignment.
- Let content wrap naturally; prefer `min-height` only when it supports a real layout requirement.
- Preserve visible focus indicators and sufficient separation between interactive controls.
- Test at narrow widths and at 200% zoom.
- Check that text enlargement does not create clipped content or horizontal page scrolling.

**Gotcha:** `vw` values can behave unexpectedly with browser zoom and viewport changes. Never assume a mathematically smooth value guarantees accessible behavior; test the rendered layout with real content and user settings.

### 15. Spacing for forms and error messages

Form spacing should make labels, controls, helper text, and errors easy to associate. The error message should be close enough to its control to preserve the relationship but not so close that the group feels cramped.

```css
.field {
  display: grid;
  gap: 0.4rem;
}

.form {
  display: grid;
  gap: clamp(1rem, 0.75rem + 0.8vw, 1.5rem);
}

.field__error {
  margin-block-start: 0.1rem;
}
```

Do not rely on color alone for errors, and do not hide error text by setting fixed heights. Use semantic form markup and associate instructions or error messages with the relevant input when implementing the complete interface.

### 16. Spacing in navigation and action groups

Navigation spacing must adapt to labels of different lengths, translated strings, and wrapping. A row of fixed-width items often breaks before the overall page looks obviously too narrow.

```css
.primary-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem clamp(0.75rem, 1.5vw, 1.5rem);
}
```

Use padding to create comfortable click areas and `gap` to separate sibling controls. Avoid using large margins on every item when the container can express the relationship directly.

```html
<nav aria-label="Primary">
  <a href="/">Home</a>
  <a href="/work">Work</a>
  <a href="/about">About</a>
</nav>
```

```css
.primary-nav a {
  display: inline-flex;
  align-items: center;
  min-block-size: 2.75rem;
  padding-inline: 0.75rem;
}
```

**Gotcha:** A visually balanced navigation bar can still have cramped interactive targets. Evaluate the clickable area, not just the text gap.

### 17. Fluid spacing in editorial layouts

Long-form content benefits from consistent paragraph rhythm, clear section transitions, and a comfortable line length. Keep typography and spacing related, but do not assume one token can solve both.

```css
.article {
  width: min(100%, 68ch);
  margin-inline: auto;
  padding-inline: var(--page-gutter);
}

.article > * + * {
  margin-block-start: 1em;
}

.article h2 {
  margin-block-start: clamp(2.5rem, 1.5rem + 3vw, 4rem);
}
```

The `ch` unit is a useful approximation for line length, not a universal measurement of readability. Inspect the actual font, language, and content. Headings may need stronger separation than consecutive paragraphs.

### 18. Spacing for cards and responsive grids

**Gotcha:** `minmax()` protects the grid track, but long unbreakable content can still force overflow. Test real labels and consider `min-width: 0` or appropriate text wrapping where needed.

Card layouts should define both the outer grid gap and the internal card rhythm. Avoid compensating for a poor grid with random card margins.

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: clamp(1rem, 0.8rem + 1.5vw, 2rem);
}

.card {
  padding: clamp(1rem, 0.75rem + 1vw, 1.75rem);
  display: grid;
  align-content: start;
  gap: 0.75rem;
}
```

This separates grid-to-grid spacing from content inside each card. Test with long titles, missing images, and uneven descriptions rather than only identical placeholder content.

### 19. Avoid cumulative spacing errors

Spacing often becomes excessive because several layers each add their own padding: page shell, section, grid, card, and child content. Map the hierarchy and assign each layer a responsibility.

A useful responsibility split:
- Page shell: viewport gutters.
- Section: separation between major regions.
- Layout container: distance between siblings.
- Component: internal padding.
- Text block: local typographic rhythm.

If two adjacent layers both express the same spacing relationship, consider whether one is redundant.

### 20. Design tokens, themes, and component contracts

Expose tokens for meaningful design decisions rather than every CSS declaration. Components should consume tokens; themes may redefine tokens without requiring component rewrites.

```css
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  --space-section: clamp(3rem, 2rem + 4vw, 6rem);
  --space-page-gutter: clamp(1rem, 4vw, 3rem);
  --space-card-padding: clamp(1rem, 0.8rem + 0.8vw, 1.75rem);
}

.card {
  padding: var(--space-card-padding);
}
```

A component token should express a contract, not merely duplicate a primitive. If a card's padding is expected to be configurable, reference a component-level custom property that falls back to the shared system.

### 21. Deriving fluid values instead of guessing

A fluid expression can be derived from two desired points: a minimum value at a narrow viewport and a maximum value at a wider viewport. A simple linear interpolation has the form:

\[
y = mx + b
\]

where `x` is viewport width and `y` is the spacing value. In CSS, the slope is often expressed through `vw`, and the base term provides the offset.

For example, suppose a spacing value should grow from `24px` at `360px` viewport width to `56px` at `1280px` viewport width. The change is `32px` over `920px`, so the slope is approximately `0.0348px` per viewport pixel, or `3.48vw`. The intercept is approximately `11.5px`.

```css
.example {
  padding-block: clamp(1.5rem, 0.72rem + 3.48vw, 3.5rem);
}
```

The exact result depends on root font size and rounding. Validate at the endpoints and at intermediate widths. The purpose of the calculation is to establish a sensible starting point, not to avoid visual testing.

**Gotcha:** `vw` is based on the viewport width, while `rem` is based on the root font size. Mixing units is valid, but the result changes with user font settings in ways that should be tested rather than assumed.

### 22. Fluid spacing and reduced motion

Spacing changes caused by responsive layout should generally be immediate CSS recalculations, not animated continuously. Avoid animating padding or margin on scroll simply because the layout uses fluid values. If a UI does animate layout-related properties, check for motion sensitivity and performance impact.

```css
.panel {
  padding: clamp(1rem, 0.75rem + 1vw, 2rem);
}

@media (prefers-reduced-motion: reduce) {
  .panel,
  .panel * {
    scroll-behavior: auto;
  }
}
```

The example illustrates a reduced-motion override for scrolling behavior, not a requirement to disable every transition on every descendant. Prefer targeted rules that match the actual motion design.

### 23. Spacing and focus states

Focus indicators must remain visible when spacing changes. Avoid clipping a focus ring with `overflow: hidden`, and ensure neighboring controls have enough separation that their indicators do not visually merge.

```css
.action {
  margin: 0.125rem;
}

.action:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

A focus outline is drawn outside the border box. If the surrounding container clips overflow, the indicator can be cut off. Fix the clipping or adjust the component boundary rather than simply removing the outline.

### 24. Testing and debugging fluid spacing

A reliable review checks the system as a set of constraints rather than at only one desktop width.

1. Inspect the smallest supported viewport.
2. Inspect the largest supported viewport.
3. Test one or more widths between the endpoints.
4. Test 200% zoom and larger text.
5. Use long labels and translated or expanded content.
6. Check for horizontal overflow and clipped focus indicators.
7. Inspect computed values when a token appears not to apply.
8. Confirm that nested containers do not double the page gutter.
9. Check whether the fluid value is based on viewport width or component width.
10. Verify the value remains within the intended minimum and maximum.

A small browser console helper can help inspect viewport and root sizing while debugging:

```js
console.table({
  innerWidth: window.innerWidth,
  rootFontSize: getComputedStyle(document.documentElement).fontSize,
  devicePixelRatio: window.devicePixelRatio
});
```

Use browser developer tools to inspect the computed padding, margins, and gap values at each test width. Avoid debugging by repeatedly adding overrides without identifying which rule wins.

### 25. When not to use fluid spacing

Fluid spacing is not a badge of sophistication. Do not use it for every dimension.

Prefer fixed or token-based spacing when:
- A tiny gap needs to remain optically stable.
- A control has a strict component contract.
- The value is tied to a known icon or border alignment.
- A layout change should happen at a meaningful breakpoint rather than gradually.
- The component adapts to its container, not the viewport.
- The calculated value would be harder to understand than a simple token.

The objective is a consistent system, not maximal use of CSS math functions.

---

## Reusable Patterns

### Pattern 1 — A compact spacing token scale

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
```

Use this for repeated, stable relationships. Resist inventing a new token for every one-off gap.

### Pattern 2 — Bounded fluid section padding

```css
.section {
  padding-block: clamp(2.5rem, 1.5rem + 4vw, 5.5rem);
}
```

Use when section breathing room should grow smoothly but never exceed a deliberate maximum.

### Pattern 3 — Fluid page gutters and centered content

```css
.page-shell {
  padding-inline: clamp(1rem, 4vw, 3rem);
}

.content {
  width: min(100%, 76rem);
  margin-inline: auto;
}
```

Keep the responsibility for outer gutters clear so nested elements do not double-pad the page.

### Pattern 4 — Responsive grid with independent inner padding

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
  gap: clamp(1rem, 0.75rem + 1.25vw, 2rem);
}

.card {
  padding: clamp(1rem, 0.75rem + 0.8vw, 1.75rem);
}
```

The grid gap controls distance between cards; card padding controls internal content space.

### Pattern 5 — Component-relative spacing with container units

```css
.card-region {
  container-type: inline-size;
}

.card {
  padding: clamp(1rem, 3cqi, 2rem);
}
```

Use when card padding should track its actual container. Provide a sensible fallback if your supported browser matrix requires one.

### Pattern 6 — Density variants

```css
.panel {
  display: grid;
  gap: var(--panel-gap, 1rem);
}

.panel[data-density="compact"] {
  --panel-gap: 0.625rem;
}

.panel[data-density="comfortable"] {
  --panel-gap: 1.25rem;
}
```

Prefer explicit variants over applying one blind multiplier to every spacing token.

### Pattern 7 — Form field rhythm

```css
.form {
  display: grid;
  gap: clamp(1rem, 0.75rem + 0.8vw, 1.5rem);
}

.field {
  display: grid;
  gap: 0.4rem;
}

.field__hint,
.field__error {
  margin: 0;
}
```

Keep labels, hints, and errors visually associated with the right control. Ensure errors are not hidden by fixed heights.

### Pattern 8 — Editorial content rhythm

```css
.article {
  width: min(100%, 68ch);
  margin-inline: auto;
  padding-inline: var(--page-gutter, 1rem);
}

.article > * + * {
  margin-block-start: 1em;
}

.article h2 {
  margin-block-start: clamp(2.5rem, 1.5rem + 3vw, 4rem);
}
```

Separate the readable measure from page gutters and use stronger rhythm around headings than around consecutive paragraphs.

### Pattern 9 — Control padding that follows text size

```css
.button {
  padding-block: 0.7em;
  padding-inline: 1.1em;
  min-block-size: 2.75rem;
}
```

Use `em` when the padding should scale with the control's typography. Keep a minimum block size where the control contract requires it.

### Pattern 10 — Fluid spacing with an explicit preferred expression

```css
:root {
  --space-card: clamp(1rem, 0.75rem + 0.8vw, 1.75rem);
  --space-section: clamp(3rem, 2rem + 4vw, 6rem);
}
```

Name the role and keep the expression readable. Do not reuse a section-scale slope for every component.

### Pattern 11 — Focus-safe spacing

```css
.action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-group a:focus-visible,
.action-group button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Allow the focus ring to render outside the control. Check that ancestors do not clip it.

### Pattern 12 — Debug the active spacing rule

```js
const element = document.querySelector(".card");
if (element) {
  const styles = getComputedStyle(element);
  console.table({
    paddingBlockStart: styles.paddingBlockStart,
    paddingInlineStart: styles.paddingInlineStart,
    rowGap: styles.rowGap,
    columnGap: styles.columnGap,
    marginBlockStart: styles.marginBlockStart
  });
}
```

Use this to verify computed values before changing CSS. It reports computed styles; it does not tell you which design decision was correct.

---

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Using `vw` for every spacing value | Tiny gaps become too large on wide screens, while narrow screens can become cramped. | Use fixed tokens for stable micro-spacing and bounded fluid values for dimensions that should scale. |
| Omitting a minimum from fluid spacing | The value can become uncomfortably small on narrow screens. | Use `clamp()` or another explicit constraint when a minimum is part of the design contract. |
| Omitting a maximum from fluid spacing | Spacing can grow excessively on ultrawide displays. | Bound the value with `clamp()` or constrain the overall content width. |
| Using only breakpoints for every spacing change | Layout rhythm jumps abruptly between viewport ranges. | Use fluid interpolation when continuous change better matches the design intent. |
| Using fluid spacing where a breakpoint is semantically needed | A gradual change can produce awkward intermediate layouts. | Use a breakpoint when the layout mode or hierarchy changes discretely. |
| Creating a unique token for every component | The system becomes hard to remember and inconsistently applied. | Start with shared semantic roles and add component tokens only for real contracts. |
| Using generic tokens with no role names | Developers cannot tell whether a value is for gutters, component padding, or section rhythm. | Name tokens by purpose and document exceptions. |
| Applying page gutters twice | Nested wrappers waste horizontal space and can squeeze content. | Assign outer gutter responsibility to one layer and inspect nested containers. |
| Confusing `gap` with container padding | Items are separated but the layout still touches the container edge. | Use `gap` for sibling separation and padding for the outer boundary. |
| Combining gap, child margins, and parent padding without a model | Spacing compounds unpredictably and is difficult to tune. | Give each layout layer one clear spacing responsibility. |
| Using `margin-top` for every sibling | Last-child cleanup and margin-collapsing behavior can complicate layouts. | Prefer `gap` inside Flexbox/Grid; use margins for deliberate external relationships. |
| Assuming viewport width equals component width | Components in sidebars may receive oversized spacing on a wide viewport. | Use container queries when the component should respond to its own available width. |
| Applying `cqi` without a query container | The value may not respond to the container you intended. | Establish the appropriate containment context and test the component in its real parent. |
| Overusing deeply nested CSS math | The expression becomes difficult to audit and maintain. | Extract meaningful tokens and use the simplest formula that satisfies the constraint. |
| Deriving fluid values but never testing intermediate widths | Endpoints can look good while the middle feels unbalanced. | Test endpoints and representative widths between them. |
| Using `em` without considering typography changes | Padding changes with the element's font size, which may be unintended. | Choose `em` for type-relative control spacing and `rem` or tokens for stable system spacing. |
| Setting fixed heights to preserve card alignment | Longer content or enlarged text can overflow or clip. | Let content determine height; use grid alignment and `min-height` only when justified. |
| Treating `ch` as a universal readability guarantee | Glyph widths and language differences change actual line length. | Use `ch` as a starting point and inspect the real font and content. |
| Forgetting logical properties | Physical left/right assumptions make RTL adaptation harder. | Prefer `padding-inline`, `margin-block`, and other logical properties. |
| Removing focus outlines to avoid spacing collisions | Keyboard users lose a visible indication of focus. | Preserve `:focus-visible`, adjust spacing or clipping, and test with keyboard navigation. |
| Clipping focus indicators with `overflow: hidden` | Outlines can be cut off at the component boundary. | Remove unnecessary clipping or change the focus-ring and container design. |
| Ignoring 200% zoom | Fluid values may combine badly with text enlargement or reflow. | Test zoom, larger text, and narrow widths with real content. |
| Making errors fit inside a fixed-height form field | Validation messages can be clipped or overlap other controls. | Let field height grow and associate errors semantically with inputs. |
| Using one density scale for every context | Dense data interfaces and relaxed editorial layouts have different needs. | Define intentional density modes and keep accessibility-critical dimensions independent. |
| Assuming `clamp()` automatically makes a design accessible | Bounds may still be wrong, text may clip, and target spacing may be insufficient. | Treat bounds as design choices and verify the rendered experience. |
| Animating padding on scroll without a clear reason | Layout recalculation can be distracting or expensive. | Keep responsive spacing declarative and animate only purposeful interactions. |
| Adding one-off overrides before inspecting computed styles | The cascade accumulates patches without fixing the root cause. | Inspect computed values, token definitions, and ancestor spacing first. |
| Using a huge spacing token list to encode every exception | The design system becomes a catalogue of accidental values. | Keep a compact scale and document true exceptions locally. |
| Ignoring content length and localization | Translated labels or longer titles can break fixed spacing assumptions. | Test with long content, wrapping, and representative translations. |
| Treating all dimensions as viewport-driven | Some components depend on their parent, content, or interaction state. | Choose the input that matches the design constraint: viewport, container, text size, or fixed role. |

---

## Mental Models

1. **Spacing is hierarchy made visible.** Larger separation implies a stronger grouping boundary; smaller separation implies related content.
2. **Every spacing value needs a job.** It should express a role, not merely reproduce a screenshot at one width.
3. **Fluidity needs boundaries.** A minimum protects compact layouts; a maximum protects expansive layouts.
4. **The viewport is only one input.** Text size, content length, container width, language, and user settings also affect the right spacing.
5. **One layer, one responsibility.** Shells own gutters, sections own major separation, layout containers own sibling gaps, and components own internal padding.
6. **A token is a shared decision.** If two values mean the same thing, they should usually share a token; if they mean different things, do not force them together just to reduce token count.
7. **Readable formulas beat clever formulas.** A future maintainer should understand the intended bounds without reverse-engineering the math.
8. **Responsive correctness is continuous.** A layout that works at two endpoints can still fail between them.
9. **Content is the stress test.** Long headings, validation messages, translated labels, and enlarged text expose weak spacing systems.
10. **Accessibility is part of the spacing contract.** Focus visibility, target size, reflow, and zoom behavior must survive the system.
11. **Exceptions are allowed; unexplained exceptions are expensive.** A deliberate fixed offset can be better than forcing everything into a fluid formula.
12. **Computed styles tell you what happened, not what should happen.** Debug the cascade, then evaluate the design intention separately.

---

## Quick Reference

| Need | Starting point | Watch for |
|---|---|---|
| Stable tiny gap | `gap: 0.5rem` | Do not add viewport scaling without a reason. |
| Bounded fluid padding | `padding: clamp(1rem, 0.75rem + 1vw, 2rem)` | Test minimum, maximum, and intermediate widths. |
| Responsive page gutter | `padding-inline: clamp(1rem, 4vw, 3rem)` | Avoid applying the gutter twice. |
| Centered max-width content | `width: min(100%, 72rem); margin-inline: auto` | Keep outer gutter responsibility clear. |
| Fluid section rhythm | `padding-block: clamp(3rem, 2rem + 4vw, 6rem)` | Do not make every section independently unique. |
| Grid sibling spacing | `gap: clamp(1rem, 0.8rem + 1vw, 2rem)` | Gap does not create outer padding. |
| Type-relative control padding | `padding-inline: 1em` | Check font-size variants and zoom. |
| Component-width response | `padding: clamp(1rem, 3cqi, 2rem)` | Ensure a query container exists. |
| Compact/comfortable density | Semantic density custom property | Keep target size and focus spacing accessible. |
| Debug computed gap | `getComputedStyle(element).gap` | Inspect the rule and token behind the computed result. |

### Decision checklist

- [ ] Does this dimension actually need to change continuously?
- [ ] Is the preferred value readable and explainable?
- [ ] Are the minimum and maximum intentional?
- [ ] Is the input viewport width, container width, text size, or a stable token?
- [ ] Does one layer already own this spacing responsibility?
- [ ] Are logical properties appropriate?
- [ ] Does the layout survive long content and localization?
- [ ] Have narrow, intermediate, and wide widths been tested?
- [ ] Has 200% zoom been tested?
- [ ] Are focus rings visible and unclipped?
- [ ] Are component and page gutters being applied only where intended?
- [ ] Can a maintainer reuse a semantic token instead of adding a magic number?

---

## Build Challenge

### Challenge: Create a fluid spacing system for a responsive product page

Build a small product or service landing page with a header, hero, feature grid, testimonial, pricing section, and footer. The objective is not to make every value fluid; it is to build a coherent system that uses fluid spacing where it helps and stable tokens where they are better.

#### Requirements

1. Define a compact base spacing scale with at least seven tokens.
2. Define semantic tokens for page gutter, component padding, and section spacing.
3. Use `clamp()` for at least three distinct spacing roles.
4. Use `min()` to constrain the main content width.
5. Use logical properties for page gutters and major block spacing.
6. Use `gap` for sibling spacing in at least two Grid or Flexbox layouts.
7. Keep outer page gutters separate from inner card padding.
8. Create at least two section hierarchy levels with visibly different rhythm.
9. Build a responsive card grid that does not overflow at narrow widths.
10. Make card padding and grid gap independent tokens or expressions.
11. Include a form with labels, helper text, and an error state that can grow naturally.
12. Include an action group that wraps when labels no longer fit.
13. Preserve visible `:focus-visible` indicators with enough surrounding space.
14. Ensure no ancestor unintentionally clips focus rings.
15. Use at least one fixed spacing value and explain why it should remain stable.
16. Use at least one component-relative spacing rule or explain why viewport-based spacing is sufficient.
17. Test the design at a narrow phone width, a mid-size viewport, and a wide desktop viewport.
18. Test at 200% browser zoom and check for horizontal overflow.
19. Test a long heading, a long button label, and expanded helper/error text.
20. Verify the page does not double-apply horizontal gutters.
21. Inspect computed styles for one unexpected gap or padding value.
22. Explain one case where you deliberately avoided fluid spacing.
23. Keep CSS tokens centralized and avoid creating a unique global token for every component.
24. Document the intended minimum and maximum for every bounded fluid expression.
25. Make the page remain usable when content wraps or a translated label is longer than the original.
26. Ensure controls have comfortable interactive areas without relying on visual text gaps alone.
27. Use semantic HTML and meaningful accessible names.
28. Do not use fixed heights to force text-containing cards into alignment.
29. Include a short README explaining token roles and the division of spacing responsibility.
30. Demonstrate that intermediate widths look intentional, not merely the endpoints.

#### Deliverables

- A working responsive page.
- A centralized spacing-token stylesheet.
- A short test matrix recording viewport, zoom, content stress case, and outcome.
- A brief explanation of which values are fixed, fluid, or bounded and why.

#### Evaluation rubric

- **System coherence (25%)** — tokens have clear roles and repeated relationships use the same values.
- **Responsive behavior (20%)** — layout works at narrow, intermediate, and wide widths.
- **Constraint quality (15%)** — fluid expressions have intentional minimums and maximums.
- **Content resilience (15%)** — long text, forms, and localization do not clip or overlap.
- **Accessibility (15%)** — zoom, reflow, focus visibility, and interactive spacing are tested.
- **Maintainability (10%)** — CSS math and token naming are readable and easy to adjust.

A successful implementation should not merely use `clamp()` often. It should demonstrate that every spacing rule has a clear role, every fluid value has defensible bounds, and the layout remains coherent when viewport dimensions and content change.
