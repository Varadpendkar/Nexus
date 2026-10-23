# SKILL: fluid-typography
**Layer:** 01 — CSS Foundation  
**Goal:** Design resilient type systems that scale smoothly across available space while preserving readability, hierarchy, accessibility, and predictable component behavior.

---

## Why This Matters (Senior Perspective)

Fluid typography is not the same as making every font size grow with the viewport. A robust type system balances three forces: a readable minimum, a useful range of growth, and a sensible maximum. It also respects the font's actual metrics, the length and meaning of the content, the width of its container, and the user's preferences.

A weak implementation starts with a screenshot, picks a small size for mobile and a large size for desktop, then adds breakpoints until the screenshot looks close. That can work for one viewport and fail between breakpoints, at browser zoom, with a longer translated heading, or inside a narrow card. A strong implementation defines a typographic role, chooses its limits, derives a fluid rule, and tests the rule across realistic conditions.

The core CSS tool is `clamp()`, commonly combined with viewport-relative or container-relative units. But `clamp()` is only the final expression of a design decision. The real skill is choosing the minimum, preferred growth rate, and maximum deliberately.

A senior engineer should be able to answer these questions:

- What role does this text play in the hierarchy?
- What is the smallest acceptable size, and why?
- What should cause the text to grow: viewport width, component width, or neither?
- Where should growth stop?
- Does the chosen font have unusually wide or narrow metrics?
- Does the line length remain comfortable as the size changes?
- Does the layout survive 200% zoom, enlarged text, and long localized content?
- Can another developer understand and tune the scale without reverse-engineering magic numbers?

Fluid type is a design system concern. The best implementation is repeatable, explainable, accessible, and easy to validate.

---

## 1. Core mental model: a bounded continuous scale

A fluid font size is usually a function of available width. Instead of switching abruptly between fixed sizes, it grows continuously inside a defined range.

A common rule is:

```css
.hero-title {
  font-size: clamp(2rem, 1.25rem + 2.5vw, 4rem);
}
```

Read this as:

1. Never use a font size below `2rem`.
2. Prefer a size that combines a base size and a viewport-relative term.
3. Never grow beyond `4rem`.

The browser evaluates the preferred expression, then clamps it to the minimum and maximum. The result changes smoothly while the preferred expression is inside the allowed interval.

**Gotcha:** `clamp()` does not guarantee a good size. It only enforces the bounds you provide. A minimum that is too small, a maximum that is too large, or a growth rate that is too steep remains a design bug.

Think of a fluid type rule as a small contract:

- **Lower bound:** the smallest acceptable rendering.
- **Preferred rule:** how the size should respond to space.
- **Upper bound:** the largest acceptable rendering.
- **Context:** the content, font, line length, and component in which the rule is used.

The context matters because the same mathematical size can work for a short display word and fail for a long heading. A heading that says “Design systems” is not a sufficient test for one that says “Building accessible interfaces for international teams.”

---

## 2. Understand the units before combining them

Fluid type depends on understanding what each unit measures.

### `rem`

`rem` is relative to the root element's font size. It is usually a strong choice for minimum and maximum bounds because it respects the root sizing model and scales with user settings in common browser configurations.

```css
.title {
  font-size: clamp(2rem, 1rem + 3vw, 4rem);
}
```

Using `rem` for the bounds makes the scale easier to tune and gives users a more meaningful relationship between the design's size and their preferred text scale.

### `em`

`em` is relative to the current element's computed font size in many font-related properties, while the precise reference depends on the property. It can be useful for component-relative details, but nested `em` values can compound.

```css
.card-title {
  font-size: 1.25em;
}
```

**Gotcha:** A nested component using `em` may become larger than expected because its parent already enlarged the font. Inspect the computed size rather than assuming the authored number is absolute.

### `vw` and `vi`

`vw` is one percent of the viewport width. `vi` is one percent of the viewport's inline size, which follows the writing mode. `vw` is widely recognized and works for many viewport-based type scales; `vi` can express a more logical relationship where supported by the project's browser targets.

```css
.display-title {
  font-size: clamp(2.5rem, 1.5rem + 3vi, 5rem);
}
```

Viewport units respond to the viewport, not to the component. A title inside a sidebar may grow because the browser window is wide even though the sidebar remains narrow.

### Container query units

`cqi` is one percent of a query container's inline size. It can be useful when a component should scale according to its own available width.

```css
.card {
  container-type: inline-size;
}

.card__title {
  font-size: clamp(1.125rem, 0.9rem + 2cqi, 2rem);
}
```

Container query units need an appropriate query container ancestor. Without one, container-unit behavior may fall back to the relevant small viewport dimension according to CSS rules, which may not match the intended component behavior.

**Gotcha:** Do not add `cqi` because it looks modern. Establish the container intentionally and verify that the measured container is the one whose size should drive the typography.

### Percentages

Percentages are not a universal substitute for fluid font sizing. Their reference behavior varies by property, and using percentages for font size can make the cascade harder to reason about. Prefer an explicit typographic scale using `rem`, `clamp()`, and a carefully chosen relative term.

### Pixels

Pixels can be appropriate for borders, optical details, and some tightly controlled contexts. A fixed pixel font size is usually a poor default for a scalable text system because it does not communicate the same relationship to root text sizing as `rem`.

---

## 3. The mathematics of `clamp()`

The CSS function is:

```css
font-size: clamp(MINIMUM, PREFERRED, MAXIMUM);
```

The browser chooses the preferred value, constrained by the lower and upper bounds. If the preferred expression is smaller than the minimum, the minimum wins. If it is larger than the maximum, the maximum wins.

For a simple linear fluid expression:

\[
s(w) = a + bw
\]

where:

- \(s\) is the computed size,
- \(w\) is the viewport width expressed in the unit used by the CSS expression,
- \(a\) is the base size,
- \(b\) is the growth coefficient.

In CSS, the expression often looks like:

```css
font-size: clamp(1.5rem, 1rem + 1.5vw, 3rem);
```

The base and viewport term contribute to the preferred size. The `clamp()` bounds determine where the scale stops shrinking or growing.

A useful practical design method is to choose two target widths and two target sizes, then solve for the line between them. This creates a preferred expression that passes through those two points.

Suppose the intended size is:

- `24px` at a viewport width of `360px`
- `40px` at a viewport width of `1280px`

The change in size is `16px` across `920px` of viewport width. The slope is approximately `0.01739` pixels of font-size change per pixel of viewport width. Since `1vw` equals one percent of viewport width, the viewport coefficient is approximately `1.739vw`. The intercept is about `17.74px`.

This rough calculation suggests a preferred expression near:

```css
font-size: clamp(1.5rem, 1.11rem + 1.74vw, 2.5rem);
```

The exact values should be adjusted for the root font size, the chosen typeface, line wrapping, and the desired design. The math provides a starting point, not an automatic design decision.

**Gotcha:** Do not solve the equation in pixels and then blindly convert every number to `rem` without checking the root font-size assumption. The conversion changes the relationship if the assumed root size differs.

### A practical derivation workflow

1. Choose a minimum viewport width relevant to the design.
2. Choose a maximum viewport width where fluid growth should end.
3. Pick a minimum type size that remains readable.
4. Pick a maximum size that preserves the hierarchy and composition.
5. Calculate the preferred linear expression.
6. Put the expression inside `clamp()`.
7. Test widths between the two design points, not only the endpoints.
8. Test zoom, root-size changes, long content, and alternate fonts.
9. Adjust the bounds or slope when the real layout contradicts the equation.

---

## 4. Design semantic type roles before writing the scale

A design system needs roles, not a random collection of viewport formulas. Typical roles include:

- `body`: long-form reading text.
- `small`: secondary information that must remain legible.
- `label`: form labels and compact UI labels.
- `caption`: supporting details, timestamps, and metadata.
- `h6` through `h2`: section hierarchy.
- `h1`: primary page heading.
- `display`: prominent campaign or landing-page typography.
- `eyebrow`: short introductory label above a heading.
- `lead`: introductory paragraph with slightly stronger emphasis.
- `code`: technical or monospaced content.

Not every role needs to be fluid. Body text may remain stable while display headings scale. A compact button label may use a fixed `rem` value because its context is already constrained. The point is to choose intentionally.

A scale can be stored as custom properties:

```css
:root {
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: clamp(1.125rem, 1.05rem + 0.3vw, 1.375rem);
  --font-size-xl: clamp(1.375rem, 1.15rem + 0.9vw, 1.875rem);
  --font-size-2xl: clamp(1.75rem, 1.35rem + 1.6vw, 2.75rem);
  --font-size-display: clamp(2.25rem, 1.4rem + 3.4vw, 4.75rem);
}
```

This is an example scale, not a universal prescription. A product dashboard, editorial site, portfolio, and marketing page may need different roles and ranges.

**Gotcha:** Token names should describe a role or scale step, not a viewport. Avoid names such as `--font-size-mobile` and `--font-size-desktop` when the value is intended to vary continuously.

### Keep semantic HTML semantic

Use headings based on document structure, not only on the desired visual size. A page title can use an `h1` with a display class; a small-looking section heading may still be an `h2` if that is the correct document level.

```html
<main>
  <article>
    <h1 class="type-display">How we built the design system</h1>
    <p class="type-lead">A practical account of the decisions behind the interface.</p>
    <section aria-labelledby="typography-title">
      <h2 id="typography-title" class="type-heading">Typography decisions</h2>
      <p class="type-body">The text hierarchy is designed for reading and navigation.</p>
    </section>
  </article>
</main>
```

The class controls presentation; the element communicates structure. Do not choose an `h4` merely because its default browser size looks right.

---

## 5. A robust token system

A good typography system separates the scale from the component-specific styling. Use root-level tokens for common roles, then compose those tokens into components.

```css
:root {
  --font-body: Inter, system-ui, sans-serif;
  --font-display: Inter, system-ui, sans-serif;

  --type-body: 1rem;
  --type-small: 0.875rem;
  --type-label: 0.875rem;
  --type-caption: 0.75rem;

  --type-h3: clamp(1.5rem, 1.25rem + 1vw, 2.25rem);
  --type-h2: clamp(1.875rem, 1.4rem + 1.8vw, 3rem);
  --type-h1: clamp(2.25rem, 1.45rem + 3vw, 4.5rem);

  --line-body: 1.6;
  --line-heading: 1.1;
  --line-display: 1.02;

  --measure-reading: 68ch;
}
```

Then define role classes:

```css
.type-body {
  font-family: var(--font-body);
  font-size: var(--type-body);
  line-height: var(--line-body);
}

.type-heading {
  font-family: var(--font-display);
  font-size: var(--type-h2);
  line-height: var(--line-heading);
  font-weight: 700;
  text-wrap: balance;
}

.type-display {
  font-family: var(--font-display);
  font-size: var(--type-h1);
  line-height: var(--line-display);
  letter-spacing: -0.035em;
  text-wrap: balance;
}
```

**Gotcha:** `ch` is based on the width of the `0` glyph in the current font, not a guaranteed number of characters. It is a useful measure token, but it is not a precise character counter.

A token system should have a small number of meaningful steps. Too many nearly identical tokens create choice without creating useful consistency. Too few can make the hierarchy feel flat. The correct scale comes from the product's content and visual needs.

---

## 6. Fluid type and line height

Font size and line height are coupled. As a font grows, the line-height strategy determines whether lines remain compact, airy, or cramped.

For body text, a unitless line height is often the most flexible choice:

```css
.body-copy {
  font-size: var(--type-body);
  line-height: 1.6;
}
```

The unitless value is a multiplier of the element's computed font size and is inherited as a number, allowing descendants to calculate line height against their own font size. By contrast, a length-valued line height can be inherited as a fixed length and may be unsuitable for descendants with different font sizes.

For display headings, a tighter unitless value may suit large type:

```css
.display-title {
  font-size: clamp(2.25rem, 1.5rem + 3vw, 5rem);
  line-height: 1.02;
}
```

A heading that wraps to two lines needs enough leading to prevent collisions between tall ascenders and descenders. Font metrics differ, so test with the actual font, not only a generic fallback.

**Gotcha:** A `line-height` of `1` can look elegant in a short heading and collide visually when a heading wraps into several lines or uses a font with tall accents. Check multi-line cases.

### Line height as a role decision

- Long-form body copy often benefits from a more generous line height.
- Compact labels can use tighter leading if the font and size remain legible.
- Large display text can use tight leading, but not at the expense of overlap.
- Buttons need enough vertical room for the text and focus indicator.
- Dense tables need readable rows without wasting excessive vertical space.
- Superscripts, badges, and inline icons may need separate alignment treatment.

Avoid setting line height globally to a single pixel value for every text role. A unitless scale gives components a more predictable relationship between size and leading.

---

## 7. Fluid typography and line length

A larger font changes how many words fit on a line. If the text container also grows, the result may be comfortable; if the container becomes too wide, the text may become tiring to read. Fluid typography should therefore be paired with a measure strategy.

```css
.article-copy {
  max-width: 68ch;
  font-size: var(--type-body);
  line-height: 1.65;
}
```

The `ch` unit offers a practical starting point for text measure, but the ideal line length varies with typeface, language, font size, and content. Treat `68ch` as a tunable token rather than a universal rule.

Display headings need a different measure:

```css
.hero-title {
  max-width: 14ch;
  font-size: clamp(2.5rem, 1.4rem + 3.4vw, 5rem);
  line-height: 1.02;
  text-wrap: balance;
}
```

A short maximum measure can create intentional line breaks, but a very narrow measure may create awkward one-word lines. Test multiple real headings and translations.

**Gotcha:** `text-wrap: balance` can improve the visual balance of short blocks, especially headings, but it does not replace content-aware testing and should not be relied on to make every arbitrary paragraph wrap perfectly.

### Text measure and responsive layout

A responsive page should not make every text block as wide as the viewport. Use a content container, readable measure, and intentional full-width exceptions.

```css
.prose {
  width: min(100% - 2rem, 72ch);
  margin-inline: auto;
}

.prose > h1,
.prose > h2,
.prose > p,
.prose > ul {
  max-width: 68ch;
}
```

A long article, a dashboard metric, and a hero title have different reading tasks. Give each an appropriate measure rather than applying one global width to every element.

---

## 8. Choosing viewport-driven versus container-driven type

Use viewport-driven fluid type when the design role is genuinely tied to the overall page canvas, such as a main hero heading or page-level display scale.

Use container-driven type when a component should adapt to the width of the space it occupies, such as a card heading inside a grid, a reusable promotional tile, or a component placed in both a sidebar and a full-width section.

### Viewport-driven example

```css
.page-title {
  font-size: clamp(2rem, 1.2rem + 3vw, 4.5rem);
}
```

This scales with the viewport. It may be appropriate for a page title that has more room as the overall canvas grows.

### Container-driven example

```css
.promo-card {
  container-type: inline-size;
}

.promo-card__title {
  font-size: clamp(1.25rem, 1rem + 2.2cqi, 2.25rem);
}
```

This scales with the inline size of the query container. The card can be narrow inside a wide viewport and still use a size suitable for its own width.

**Gotcha:** Container units are not a substitute for setting a container's actual layout. Make sure the container has a meaningful width and that the child is not inadvertently influencing the width in a way that creates unexpected intrinsic sizing.

A component should not need to know whether it appears in a sidebar or main column. Its styles should respond to the dimensions it actually receives, while its parent determines the layout.

---

## 9. Font metrics, optical sizing, and variable fonts

The same nominal font size can look dramatically different across typefaces. A font's x-height, cap height, ascenders, descenders, width, and weight distribution influence perceived size and line wrapping.

When replacing a font, re-test:

- heading line breaks,
- button widths,
- card heights,
- navigation density,
- paragraph measure,
- baseline alignment,
- fallback behavior before the font loads.

Variable fonts may expose axes such as weight (`wght`), width (`wdth`), optical size (`opsz`), and slant (`slnt`). Not every font supports every axis. The `font-variation-settings` property can control low-level axes, while higher-level properties such as `font-weight` and `font-stretch` are often preferable when they express the intent.

```css
.display-title {
  font-family: "Example Variable", system-ui, sans-serif;
  font-weight: 650;
  font-optical-sizing: auto;
}
```

Optical sizing can adjust details for the rendered size when the font supports it. Check the font's documentation and actual browser rendering before assuming that the axis exists.

**Gotcha:** Do not use `font-variation-settings: "wght" 650` as a default replacement for `font-weight: 650`. Prefer the high-level property unless you need a specific axis that has no suitable high-level equivalent.

### Avoid synthetic weight surprises

If only a regular font file is loaded but the CSS asks for a heavy weight, the browser may synthesize bolding or choose a fallback. The result can alter width and line wrapping. Load the intended font weights or variable font range, and test the fallback path.

### Font loading and layout shifts

A web font can change glyph widths after it loads, causing headings to reflow and page content to shift. Use appropriate font-display behavior, choose compatible fallbacks where possible, and consider font metric overrides such as `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` when the project requires carefully tuned fallback metrics and browser support allows it.

Do not add metric overrides without measurement. Incorrect overrides can cause clipping or new layout shifts.

---

## 10. Fluid letter spacing and text rendering

Letter spacing changes the perceived density of text. Large display fonts may benefit from slightly tighter tracking, while small uppercase labels may need additional tracking. Use role-based values and test the real typeface.

```css
.display-title {
  letter-spacing: -0.03em;
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Relative units make the spacing respond to the font size, but the correct value depends on the font. A negative tracking value that looks good for one display face can cause letters to collide in another.

**Gotcha:** Avoid applying aggressive negative `letter-spacing` to all headings. It can reduce legibility, especially at small sizes, for scripts with different shaping behavior, or with fonts that already have tight spacing.

Text rendering is largely controlled by the browser and operating system. Avoid browser-specific font smoothing hacks as a substitute for good font selection and weight choices. Validate actual target environments when pixel-level typography matters.

### Wrapping controls

Useful tools include:

- `text-wrap: balance` for balancing lines in suitable short blocks.
- `text-wrap: pretty` where supported and appropriate for improved paragraph wrapping.
- `overflow-wrap: anywhere` for long unbroken strings that must not overflow.
- `word-break` for specific language-aware breaking behavior.
- `hyphens: auto` when language metadata and hyphenation support make it appropriate.
- `white-space` for intentional wrapping or non-wrapping behavior.

Do not apply `white-space: nowrap` to long headings as a quick fix for line wrapping. It can create horizontal overflow and fail at zoom or localization.

---

## 11. Accessibility: zoom, text enlargement, and user preferences

Typography must remain usable when the viewport is narrow, the user zooms, text is enlarged, or the browser's default font size changes. The goal is not to preserve a screenshot; it is to preserve meaning, readability, and access to controls.

### Do not make small text smaller to fit

If a label wraps, first consider whether the component can grow, the layout can adapt, or the content can be shortened meaningfully. Reducing the font size below a legible minimum often hides the symptom rather than solving the layout.

### Test browser zoom and text scaling

At 200% browser zoom, the effective layout viewport becomes narrower. A fluid type rule using `vw` can change in a way that differs from a user who increases the root font size. Test both conditions. Also test browser text-only zoom where available, since it can expose fixed-height controls and containers.

### Keep controls large enough for their text

Buttons, form fields, tabs, and navigation items need padding that adapts to the text. Fixed heights can clip text when font size changes.

```css
.button {
  min-height: 2.75rem;
  padding-block: 0.65em;
  padding-inline: 1em;
  font: inherit;
  line-height: 1.2;
}
```

Use `min-height` rather than a rigid height when the control may need to grow for wrapped text or enlarged fonts.

### Preserve focus visibility

A fluid type change can cause navigation labels to wrap or move controls, but keyboard focus must remain visible and understandable. Use a visible `:focus-visible` style and ensure no overflow container clips the outline.

```css
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

**Gotcha:** Do not remove focus outlines simply because the default ring appears visually inconsistent with a design. Replace it with a visible, high-contrast focus treatment and test it against the actual backgrounds.

### Contrast is not a font-size fix

Text contrast should meet the relevant accessibility requirements for its size and weight. Making text slightly larger does not excuse poor contrast in ordinary UI text. Check the contrast of text tokens across light, dark, hover, disabled, and overlay states.

### Reduced motion

Typography itself is not necessarily motion, but animated scaling, text reveal effects, and transitions that resize large text can affect comfort. If the design animates type size or layout, respect `prefers-reduced-motion` and keep the static state readable.

---

## 12. Common fluid type patterns

### Pattern A: fixed body size, fluid headings

**What it does:** Keeps long-form reading text stable while allowing headings to respond to available space.

**When to use it:** Editorial sites, documentation, product pages, and interfaces with predictable body text requirements.

```css
:root {
  --body-size: 1rem;
  --heading-size-1: clamp(2.25rem, 1.5rem + 2.8vw, 4.5rem);
  --heading-size-2: clamp(1.75rem, 1.35rem + 1.5vw, 3rem);
}

body {
  font-size: var(--body-size);
  line-height: 1.6;
}

h1 {
  font-size: var(--heading-size-1);
  line-height: 1.05;
}

h2 {
  font-size: var(--heading-size-2);
  line-height: 1.12;
}
```

### Pattern B: a full type ramp

**What it does:** Defines a coherent series of fluid type roles rather than independent one-off formulas.

**When to use it:** A design system with several heading levels and a consistent visual hierarchy.

```css
:root {
  --step--1: clamp(0.875rem, 0.84rem + 0.15vw, 1rem);
  --step-0: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --step-1: clamp(1.25rem, 1.12rem + 0.55vw, 1.625rem);
  --step-2: clamp(1.5rem, 1.25rem + 1vw, 2.125rem);
  --step-3: clamp(1.875rem, 1.45rem + 1.7vw, 3rem);
  --step-4: clamp(2.25rem, 1.5rem + 3vw, 4.5rem);
}
```

Use the ramp as a set of named design decisions. If two adjacent steps become nearly indistinguishable in real content, revise the scale rather than adding more arbitrary steps.

### Pattern C: a component-local heading

**What it does:** Makes a reusable component's heading respond to the width of the component.

**When to use it:** Cards, callouts, dashboard panels, and reusable modules used in multiple layout contexts.

```css
.feature-card {
  container-type: inline-size;
}

.feature-card__title {
  font-size: clamp(1.125rem, 0.95rem + 2.2cqi, 2rem);
  line-height: 1.15;
}
```

### Pattern D: fluid type with a maximum measure

**What it does:** Lets a heading grow while preventing it from spreading across an excessively wide line.

**When to use it:** Hero sections and page titles where the display scale should grow with the page but the text should retain a designed shape.

```css
.hero__title {
  max-width: 13ch;
  font-size: clamp(2.5rem, 1.5rem + 3.5vw, 5rem);
  line-height: 1.02;
  text-wrap: balance;
}
```

### Pattern E: typography that adapts without a breakpoint

**What it does:** Uses `clamp()` to create a continuous size range without a media-query jump.

**When to use it:** When a single linear progression looks appropriate between the minimum and maximum widths.

```css
.section-title {
  font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.5rem);
}
```

Do not use fluid interpolation when the design actually needs a structural change, such as switching alignment, changing the order of content, or hiding a secondary decoration. Use a media or container query for that structural behavior.

### Pattern F: fluid scale with an explicit fallback

For older or constrained browser support requirements, provide a sensible fixed declaration before the enhanced declaration:

```css
.page-title {
  font-size: 2rem;
  font-size: clamp(2rem, 1.2rem + 3vw, 4.5rem);
}
```

The fallback is only useful if the supported browser population actually needs it. Confirm the project's browser support policy before adding fallback declarations everywhere.

### Pattern G: local line-height and measure tokens

**What it does:** Makes font size, leading, and reading measure coordinated but independently tunable.

**When to use it:** Content-heavy applications where readability matters more than matching a single marketing screenshot.

```css
:root {
  --reading-size: 1rem;
  --reading-leading: 1.65;
  --reading-measure: 68ch;
}

.prose {
  max-width: var(--reading-measure);
  font-size: var(--reading-size);
  line-height: var(--reading-leading);
}
```

### Pattern H: role-based display and utility classes

**What it does:** Keeps semantic elements independent from visual type roles.

**When to use it:** Large products with shared components, CMS content, or a design system that supports multiple themes.

```css
.type-display {
  font-size: var(--type-display);
  line-height: var(--line-display);
}

.type-body {
  font-size: var(--type-body);
  line-height: var(--line-body);
}

.type-caption {
  font-size: var(--type-caption);
  line-height: 1.4;
}
```

Use utility classes carefully. They should make the design system easier to apply, not replace a clear component API or semantic document structure.

---

## 13. Fluid typography with media queries: when it still makes sense

Fluid interpolation handles gradual changes. Media queries handle discontinuities or different design modes.

Use a media query when the intended type role changes qualitatively at a breakpoint, such as:

- a compact mobile navigation needs a different label treatment;
- a title should align differently in a narrow composition;
- a display heading changes from centered to left-aligned;
- a component's structure changes, not merely its size;
- a specific typeface or decorative treatment is only appropriate at larger sizes.

```css
.hero__title {
  font-size: clamp(2.25rem, 1.5rem + 3vw, 4.75rem);
  max-width: 14ch;
}

@media (max-width: 38rem) {
  .hero__title {
    max-width: 12ch;
    text-wrap: pretty;
  }
}
```

The example uses a query to change the design constraint, not to duplicate the entire font-size formula at a new width.

**Gotcha:** Avoid stacking many media queries that repeatedly override the same `font-size`. It becomes difficult to understand the scale and creates fragile cascade behavior. Prefer one fluid token unless the design genuinely has distinct modes.

---

## 14. Common mistakes and how to fix them

| Mistake | Why it fails | Better approach |
|---|---|---|
| Using `vw` alone for all headings | Text can become too small on narrow screens and too large on wide screens | Bound the size with `clamp()` |
| Choosing arbitrary minimums | The smallest size may be illegible or break hierarchy | Set a role-specific minimum and test it |
| Choosing arbitrary maximums | Large headings can dominate the page or wrap awkwardly | Set the maximum based on content and composition |
| Using the same formula for every role | Body, labels, headings, and display text have different needs | Define semantic type roles |
| Scaling body text aggressively | Reading density and line wrapping can become unstable | Keep body text stable unless the product needs a fluid body scale |
| Assuming viewport equals component width | Cards and sidebars can be narrow inside a wide viewport | Use container queries or a fluid component layout |
| Using container units without a container | The size may respond to an unintended reference | Establish and test a query container |
| Using `em` tokens without checking nesting | Nested font-size values can compound | Use root-level `rem` tokens for global scales |
| Converting pixel calculations blindly | Root font-size assumptions may change the intended curve | Validate the converted expression in the browser |
| Testing only minimum and maximum widths | The middle of the curve can still be wrong | Test intermediate widths and real breakpoints |
| Testing only short headings | Long copy can produce unexpected wrapping | Use representative long and translated content |
| Ignoring font metrics | A replacement font changes width and line breaks | Re-test after font changes |
| Using aggressive negative tracking | Letters can collide or become difficult to read | Tune tracking per typeface and role |
| Setting all line heights in pixels | Different sizes may inherit unsuitable leading | Prefer unitless line height for most roles |
| Giving headings unlimited measure | Large screens can create very long lines | Use `max-width` or a content container |
| Applying `nowrap` to solve layout | Long text may overflow at zoom or on small screens | Allow wrapping and fix the layout constraints |
| Reducing font size to fix a crowded card | It treats the symptom and harms legibility | Let the card grow, wrap, or change layout |
| Using heading tags for visual size | The document outline becomes misleading | Preserve semantic heading order and style with classes |
| Using only one font weight file | Synthetic weights can change appearance and width | Load appropriate weights or a variable font |
| Ignoring font-loading shifts | Text can reflow after the web font loads | Tune fallback metrics and test loading states |
| Assuming `ch` equals characters | Glyph widths vary by font and language | Treat `ch` as a measure estimate |
| Assuming `text-wrap: balance` solves everything | It cannot guarantee ideal wrapping for all content | Test actual text and define a sensible measure |
| Removing focus outlines | Keyboard users lose a visible position indicator | Use a clear `:focus-visible` style |
| Fixing contrast by increasing font size | Ordinary text still needs sufficient contrast | Verify contrast separately |
| Hardcoding button heights | Enlarged text may clip | Use min-height and content-driven padding |
| Adding many overlapping media queries | Cascade behavior becomes difficult to reason about | Centralize the scale and use queries only for real mode changes |
| Forgetting localization | Translated strings may be much longer | Test long translations and avoid fixed-height text regions |
| Ignoring browser zoom | Layout may collapse even if viewport screenshots pass | Test zoom and text enlargement |
| Treating a sample scale as universal | Different products and fonts need different relationships | Tune tokens against the real content and brand |
| Animating text size without a reduced-motion plan | Motion may be uncomfortable or distracting | Keep a readable static state and respect reduced-motion preferences |

---

## 15. Debugging workflow

When a heading looks wrong, do not change the formula at random. Find the cause.

### Step 1: Inspect the computed font size

Use browser DevTools to inspect the element's computed `font-size`, `line-height`, `font-family`, `font-weight`, `letter-spacing`, and `max-width`. Verify which declaration wins and whether a media or container query is active.

### Step 2: Check the actual width

Inspect the element's content box and its parent. A text block may be too wide because its container lacks a maximum width, or too narrow because a grid track cannot shrink. The font formula may be correct while the layout constraint is wrong.

### Step 3: Confirm the reference for the fluid unit

If the preferred expression uses `vw`, confirm that viewport size is the desired input. If it uses `cqi`, confirm the correct ancestor is a query container. A mismatched reference is a common cause of unexpected sizing.

### Step 4: Test the bounds

Resize to narrow, middle, and wide widths. Determine whether the minimum, preferred expression, or maximum currently controls the size. If the size is stuck at a bound for nearly the entire range, the chosen slope or limits may not be useful.

### Step 5: Test content extremes

Use a short heading, a long heading, a translated heading, a long URL, and text with accents or unusual glyphs. If only one case fails, the issue may be wrapping, measure, font metrics, or overflow rather than the fluid scale.

### Step 6: Inspect layout shifts and clipping

Check whether the heading changes after web fonts load, whether its line box clips glyphs, and whether a fixed-height parent truncates the content.

### Step 7: Apply one change at a time

Change the minimum, slope, maximum, measure, or line height separately. Record what changed. This keeps the debugging process causal rather than turning it into trial-and-error styling.

A small inspection script can help collect geometry:

```js
const element = document.querySelector(".hero__title");

if (element) {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  console.table({
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    letterSpacing: style.letterSpacing,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  });
}
```

**Gotcha:** A computed `font-size` alone cannot tell you whether the heading is visually successful. Inspect its line breaks, available width, font metrics, and context too.

---

## 16. Testing matrix

Test the type system as a behavior system, not just a static screenshot.

| Test case | What to inspect |
|---|---|
| Small viewport | Minimum sizes, wrapping, control fit, horizontal overflow |
| Intermediate viewport | Smooth interpolation and balanced hierarchy |
| Wide viewport | Maximum sizes, measure, excessive line length |
| Narrow component in wide viewport | Whether component type responds to its own width |
| 200% browser zoom | Reflow, clipped controls, heading overflow |
| Increased root font size | Whether `rem`-based bounds scale appropriately |
| Long translated copy | Wrapping, card growth, buttons, navigation |
| Font not loaded yet | Fallback metrics and layout shift |
| Font loaded | Final line breaks and weight appearance |
| Keyboard navigation | Visible `:focus-visible` ring and predictable focus |
| Dark and light themes | Contrast and legibility across surfaces |
| Reduced-motion preference | Animated type does not obscure or destabilize reading |
| Right-to-left content | Logical alignment and script shaping |
| Empty or short content | Unintended stretching or odd alignment |
| Very long unbroken text | Overflow policy and wrapping |
| High-density interface | Captions and labels remain legible |

Automated visual regression tests are useful, but they should not replace keyboard, zoom, localization, and semantic checks.

---

## 17. Reusable review checklist

Before approving a fluid type implementation, ask:

- [ ] Does each type rule map to a clear typographic role?
- [ ] Is the minimum size deliberate and readable?
- [ ] Is the maximum size appropriate for the composition?
- [ ] Is the preferred expression derived or otherwise justified?
- [ ] Does the selected unit respond to the intended reference size?
- [ ] Does the scale behave well between endpoints?
- [ ] Are line height and measure considered alongside font size?
- [ ] Is the real typeface loaded and tested?
- [ ] Does long or translated content remain usable?
- [ ] Does the layout survive zoom and text enlargement?
- [ ] Are buttons and form controls allowed to grow with their content?
- [ ] Is focus visible with `:focus-visible`?
- [ ] Are semantic HTML elements used correctly?
- [ ] Are contrast and reduced-motion behavior considered?
- [ ] Are media queries used for genuine design-mode changes rather than unnecessary size overrides?
- [ ] Can another developer understand and tune the tokens?

---

## 18. Mental models

### 1. A fluid size is a bounded contract

The minimum defines the lower guarantee, the preferred expression defines the growth behavior, and the maximum defines the upper guarantee. A fluid value is only as good as those three decisions.

### 2. The viewport is an input, not the design goal

Viewport units provide a signal. They do not automatically describe the space available to a component or the amount of text a user must read.

### 3. Typography is a system of roles

A type scale works when the relationships between body, labels, headings, and display text remain coherent. A collection of unrelated formulas is harder to maintain.

### 4. Size and measure are a pair

Increasing font size changes line wrapping. A readable type system controls both the size and the width of text blocks.

### 5. Font metrics are part of layout

A font is not a skin that can be swapped without consequences. Its glyph widths and vertical metrics affect every container that holds text.

### 6. Smooth scaling does not replace responsive composition

A continuous font-size change is useful for gradual variation. A structural change still needs a media or container query when the composition itself should change.

### 7. The user's environment is a supported condition

Zoom, text enlargement, font loading, localization, and input method are not edge cases to ignore. They are part of the environments the interface should handle.

### 8. Inspect before tuning

The computed size, line box, content width, and active rule tell you more than repeated guesses. Diagnose the input and the constraint before editing the formula.

### 9. Tokens should encode intent

A variable named `--type-display` communicates a role. A variable named `--size-37` communicates a number without explaining why it exists.

### 10. Readability wins over screenshot fidelity

A title that wraps differently but remains clear and accessible is better than a title forced into a single line that clips at zoom or fails for translated content.

---

## 19. Build challenge: implement a fluid type system

Build a small responsive editorial landing page and document your decisions. The challenge is complete only when the type system behaves correctly across the listed conditions.

### Required deliverables

1. Create a page with a semantic `main`, a page-level `h1`, at least three `h2` sections, body paragraphs, a metadata label, a call-to-action button, and a footer.
2. Define a root token system for font families, body text, small text, labels, captions, at least three heading levels, display type, and line-height roles.
3. Use `clamp()` for at least three typographic roles.
4. Keep the body text readable without forcing it to scale aggressively with viewport width.
5. Derive at least one preferred fluid expression from two target width-and-size pairs, and document the assumptions.
6. Use a maximum text measure for the long-form copy.
7. Give the hero heading a deliberate maximum measure and test it with at least three different strings.
8. Compare a viewport-driven title with a container-driven card title.
9. Establish a valid query container for the container-driven example.
10. Demonstrate that a card can be placed in both a narrow sidebar and a wide main column without using viewport width as the only input.
11. Choose line-height values for body copy and display headings and explain why they differ.
12. Tune letter spacing for at least one display role and one label role.
13. Load or select a real font family and test a system fallback.
14. Verify that heading widths and line breaks do not become unacceptable after the web font loads.
15. Keep heading elements in a meaningful semantic order.
16. Ensure buttons and form controls use content-driven height rather than a brittle fixed height.
17. Add visible `:focus-visible` styles for keyboard-interactive controls.
18. Test at a narrow viewport, an intermediate viewport, and a wide viewport.
19. Test at 200% browser zoom and record any layout adjustments required.
20. Test increased root font size or an equivalent text-enlargement condition.
21. Test one long translated heading and one long paragraph.
22. Test a long unbroken URL or identifier and choose an explicit overflow policy.
23. Check text contrast in the default and alternate theme if the page supports themes.
24. If the page animates typography, support `prefers-reduced-motion`; otherwise document that no type-size animation is used.
25. Inspect the computed styles and record the final font size, line height, and content width for the hero heading at three viewport widths.
26. Explain when a media query would be preferable to a continuous fluid formula in this page.
27. Include screenshots or notes for the narrow, intermediate, and wide test cases.
28. Provide a short review note describing what changed after testing with long content.
29. Confirm that no horizontal page overflow is introduced by the typography.
30. Write a final explanation of the lower bound, preferred expression, upper bound, measure, and line-height decisions for the main title.

### Suggested content to test

Use realistic copy rather than repeated placeholder text:

- Short title: “Design with care”
- Long title: “Building accessible interfaces for teams around the world”
- Body paragraph: a paragraph with varied word lengths, punctuation, and at least one long link
- Label: “UPDATED OCTOBER 2026”
- CTA: “Explore the complete guide”
- Card title: “A practical system for consistent product typography”

Include content with accents or non-English text if the product supports localization. If you have a real product, use representative copy from that product.

### Definition of done

The challenge is done when:

- The typography remains legible and the hierarchy remains clear at every tested width.
- The fluid scale does not rely on a single screenshot or a large pile of duplicate overrides.
- The card title responds to the component width when that is the intended behavior.
- The long title wraps without clipping or horizontal page overflow.
- Body copy remains comfortable to read.
- Browser zoom and text enlargement do not make controls unusable.
- Focus indicators remain visible.
- Semantic structure remains meaningful without styling.
- The implementation's design choices can be explained and reproduced by another developer.

---

## 20. Quick reference

### The base formula

```css
.selector {
  font-size: clamp(MINIMUM, PREFERRED, MAXIMUM);
}
```

### A viewport-driven heading

```css
.page-heading {
  font-size: clamp(2rem, 1.25rem + 2.5vw, 4rem);
  line-height: 1.08;
  max-width: 16ch;
}
```

### A component-driven heading

```css
.card {
  container-type: inline-size;
}

.card__heading {
  font-size: clamp(1.125rem, 0.95rem + 2cqi, 2rem);
  line-height: 1.15;
}
```

### A reading column

```css
.reading-content {
  max-width: 68ch;
  font-size: 1rem;
  line-height: 1.65;
}
```

### Accessible controls

```css
.control {
  min-height: 2.75rem;
  padding: 0.65em 1em;
  font: inherit;
  line-height: 1.2;
}

.control:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

### Remember

- Bound fluid sizes with `clamp()`.
- Choose type roles before formulas.
- Use viewport units only when viewport size is the right input.
- Use container units only with a deliberate query container.
- Pair font size with line height and text measure.
- Test actual fonts, long content, zoom, and localization.
- Keep semantic HTML and keyboard focus intact.
- Use media queries for structural changes, not to patch every small size difference.
- Inspect computed styles before guessing.
