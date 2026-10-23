# SKILL: css-typography-rendering

## Layer
Layer 01 — CSS Foundation

## Goal
Develop precise control over typographic hierarchy, readable line lengths, fluid type scales, font loading, variable fonts, line breaking, text rendering, internationalization, and responsive typography. Build typography systems that remain legible, expressive, accessible, and stable across devices and languages.

## Why This Matters (Senior Perspective)
Typography is a layout system, not a finishing touch. Font metrics affect line wrapping, component height, alignment, page length, and perceived quality. A type scale that looks good in a static desktop screenshot can fail at 200% zoom, with a long translation, or when the preferred web font loads late. Senior engineers design type systems around content, constraints, and reading tasks—not isolated font sizes.

Use this skill when:
- Headings wrap awkwardly or collide with adjacent content.
- Body copy is too wide, too dense, or difficult to scan.
- Text shifts when a web font loads.
- A design needs a consistent type scale across components.
- Font weights, optical sizes, or variable font axes are being used.
- Content includes long words, URLs, multiple scripts, or localization.
- Type must remain usable at narrow widths and increased zoom.

---

## Core Concepts

### 1. Typography Is Geometry
A font defines glyph shapes, advance widths, ascenders, descenders, kerning, and line metrics. Those metrics influence where text wraps and how much vertical space it consumes. A font change can therefore alter the geometry of a whole page.

Treat font selection as a layout dependency. When replacing a font, retest line breaks, button widths, navigation, card heights, and above-the-fold content.

**Gotcha:** Two fonts set to the same `font-size` can have visibly different apparent sizes and line wrapping because their metrics and glyph proportions differ.

### 2. Typeface, Font, Weight, and Style
A typeface is the design family; a font is a specific face or file/instance. CSS selects family, style, weight, stretch, and potentially variable axes.

```css
body {
  font-family: Inter, "Helvetica Neue", Arial, sans-serif;
  font-weight: 400;
}

h1 {
  font-family: "Source Serif 4", Georgia, serif;
  font-weight: 650;
}
```

Use a fallback stack that remains acceptable if the preferred face fails. Avoid treating the final generic family as optional.

### 3. The Type Scale
A type scale assigns repeatable sizes to roles rather than choosing a new arbitrary size for every element. It makes hierarchy consistent and supports future changes.

```css
:root {
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  --font-size-3xl: 3rem;
}
```

A scale can be modular, custom, or fluid. The exact ratio matters less than coherent roles and real-content testing. A 1.2 ratio may create gentle hierarchy; a larger ratio creates more contrast but can cause display headings to dominate narrow layouts.

**Gotcha:** A scale is a starting point, not a guarantee. If a role is hard to read or repeatedly needs overrides, revisit the scale instead of adding endless exceptions.

### 4. `rem`, `em`, and User Preferences
`rem` is relative to the root element's font size; `em` is relative to the relevant element's font size (with context-dependent behavior for different properties). `px` is a CSS pixel, not necessarily a physical screen pixel.

For most interface type scales, `rem` makes global scaling more predictable:

```css
body {
  font-size: 1rem;
}

.card-title {
  font-size: 1.25rem;
}
```

Use `em` when the relationship should be local, such as icon dimensions or padding that should scale with a component's text. Avoid resetting the root font size to a fixed pixel value merely to make calculations convenient.

**Gotcha:** Do not assume that setting `html { font-size: 62.5%; }` is required for accessible sizing. Clear `rem` values work without changing the user's expected root-size relationship.

### 5. Line Height and Vertical Rhythm
`line-height` determines the line box height. Unitless values are usually the most reusable because they scale with the element's font size.

```css
body {
  line-height: 1.6;
}

h1,
h2,
h3 {
  line-height: 1.1;
}
```

Body copy often benefits from a line-height around 1.45–1.7, while large headings may use tighter leading. These are starting ranges, not universal laws. Dense data labels, scripts with taller marks, and narrow columns may need different values.

Avoid fixed pixel line heights on text that can resize. A fixed line height can cause overlap or clipping when the font size changes or a fallback font has different metrics.

**Gotcha:** `line-height: 1` may clip accents or diacritics in some fonts and scripts, especially when a line contains mixed scripts.

### 6. Measure and Readable Line Length
A line that is too long makes it harder to track the next line; a line that is too short creates excessive line breaks. For long-form text, `ch` is a useful approximate measure, but it is based on the advance width of the `0` glyph and is not a perfect character count.

```css
.article-copy {
  max-inline-size: 68ch;
}
```

For many Latin-script reading contexts, a rough target around 55–75 characters per line is a reasonable starting point. Dense technical documentation, large type, and other scripts may need different measures. Apply measure constraints to text blocks, not blindly to every layout container.

**Gotcha:** `width: 65ch` does not mean every line contains exactly 65 characters. Glyph widths vary substantially.

### 7. Fluid Typography with `clamp()`
`clamp(minimum, preferred, maximum)` defines a value that grows or shrinks within bounds.

```css
.hero-title {
  font-size: clamp(2.25rem, 1.2rem + 4vw, 5rem);
}
```

The middle term should be chosen to grow at a useful rate between realistic viewport sizes. Keep a sensible minimum and maximum, and check the result at 320px, tablet widths, desktop, and zoomed layouts.

Fluid type is especially useful for display headings and responsive section titles. Body copy often needs less dramatic scaling because readability and user preferences matter more than filling a viewport.

**Gotcha:** A fluid value can still become too small at a narrow viewport or too large on a wide display if its bounds are poorly chosen. `clamp()` is a constraint, not a design decision.

### 8. Viewport Units and Zoom
`vw` can be useful in a fluid expression, but pure viewport-based font sizing can ignore the user's expected text scaling behavior and may produce poor results. Pair viewport units with relative units and explicit bounds.

```css
.page-title {
  font-size: clamp(2rem, 1.4rem + 2.8vw, 4rem);
}
```

Test at 200% browser zoom and with text-only zoom where the browser supports it. Confirm that headings wrap rather than overlap, navigation remains reachable, and buttons do not clip labels.

**Gotcha:** A layout that scales beautifully when the browser window changes can still fail when the user zooms in, because zoom changes the effective CSS viewport and available space.

### 9. Font Weight and Variable Fonts
Traditional font files often provide discrete weights. Variable fonts can expose a continuous range through axes such as `wght`, `wdth`, `opsz`, and custom axes.

```css
.heading {
  font-weight: 650;
}

.condensed-label {
  font-stretch: 90%;
}
```

Use CSS properties such as `font-weight`, `font-stretch`, and `font-style` where possible. Use `font-variation-settings` for axes that lack a higher-level CSS property or when low-level control is required.

```css
.variable-heading {
  font-variation-settings: "wght" 650, "opsz" 48;
}
```

Do not set low-level axis values without understanding the font's supported axis ranges. When a higher-level property exists, it generally composes better with user-agent behavior and accessibility expectations.

**Gotcha:** `font-variation-settings: "wght" 650` can override or conflict with the higher-level `font-weight` choice. Prefer `font-weight: 650` unless direct axis control is necessary.

### 10. Optical Sizing
Some variable fonts support an optical-size (`opsz`) axis, adjusting shapes for different text sizes. Optical sizing may be enabled automatically with `font-optical-sizing: auto` when supported by the font.

```css
body {
  font-optical-sizing: auto;
}
```

A display size and a small caption can benefit from different optical adjustments. Test real rendering rather than assuming the feature always improves a particular face.

### 11. Font Loading and Layout Stability
Web fonts may load after the initial page render. If fallback and final fonts have different metrics, text can reflow and move other elements. Choose fallback stacks carefully and consider `font-display` behavior.

```css
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

`font-display: swap` displays fallback text quickly and swaps to the web font when available. Other values offer different trade-offs. Use `preload` only for fonts that are genuinely critical to the first render; excessive preloads compete with more important resources.

Where appropriate, use metric-adjustment descriptors such as `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` to reduce differences between fallback and final fonts. Verify support and tune with actual font metrics.

**Gotcha:** Preloading every font weight is not a performance strategy. It can consume bandwidth and delay more important assets.

### 12. Fallbacks and `@font-face`
Declare font files with accurate descriptors and ensure the requested weights map to files or variable ranges that actually exist.

```css
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

If the file only contains weight 400 but CSS requests 700, the browser may synthesize a weight or select another available face. This can look different across platforms. Validate with DevTools and test when fonts fail to load.

For production, subset fonts only when the build pipeline and supported language set make it safe. A Latin-only subset will fail for users whose names or content require other glyphs.

### 13. Letter Spacing and Word Spacing
`letter-spacing` modifies spacing between characters; `word-spacing` adjusts spaces between words. These properties are useful for small typographic refinements, but they should not be used to force text into a fixed box.

```css
.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

Large positive letter spacing can harm readability in paragraphs. Negative tracking may suit display headings but can cause letters to collide or make words harder to distinguish. Test the font, language, and size together.

**Gotcha:** Wide letter spacing on uppercase text can look polished in a short label but becomes tiring when applied to long passages.

### 14. Text Transform and Content Integrity
`text-transform` changes visual presentation, not the underlying text content. It is appropriate for styling labels, but avoid using it to compensate for inconsistent content data. Some languages have context-sensitive casing rules, and uppercase can expand or alter characters.

```css
.eyebrow {
  text-transform: uppercase;
}
```

Do not assume CSS uppercase means the same number of characters or identical glyph shapes. Preserve correct source content and let language-aware casing behavior operate where supported.

### 15. Line Breaking and Wrapping
`overflow-wrap`, `word-break`, `hyphens`, and `white-space` control different aspects of text wrapping.

```css
.user-content {
  overflow-wrap: anywhere;
  hyphens: auto;
}
```

- `overflow-wrap: anywhere` allows emergency breaks in otherwise unbreakable strings.
- `word-break: normal` follows language-appropriate default rules.
- `hyphens: auto` can enable dictionary-based hyphenation when language metadata and browser support are available.
- `white-space` controls preservation of whitespace and whether wrapping is permitted.

Set the document's `lang` attribute accurately so assistive technology and language-aware text behavior can work correctly.

**Gotcha:** `hyphens: auto` is not a guarantee. It depends on language metadata, browser behavior, and available dictionaries.

### 16. Balanced Headings and Editorial Wrapping
`text-wrap` offers modern text-wrapping controls such as `balance` and `pretty` where supported. They can improve headings and editorial copy, but they should be progressive enhancements.

```css
h1,
h2 {
  text-wrap: balance;
}

.article-copy {
  text-wrap: pretty;
}
```

Balanced wrapping attempts to distribute lines more evenly; `pretty` may improve paragraph breaks in supporting browsers. Do not manually insert `<br>` elements into every heading just to reproduce one viewport screenshot. If a break is editorially meaningful, explicit markup can still be appropriate.

**Gotcha:** A balanced heading can wrap differently after localization or font loading. Test realistic content and retain a good fallback when the property is unsupported.

### 17. Hyphenation and Long Identifiers
For prose, hyphenation can improve line length in supported languages. For identifiers, code, product IDs, or URLs, automatic hyphenation may be misleading. Use different rules for different content roles.

```css
.article {
  hyphens: auto;
}

.identifier {
  overflow-wrap: anywhere;
  hyphens: manual;
}
```

Check whether breaking a token changes its meaning or makes copying confusing. For long IDs, a copy button or separate wrapping strategy may be better than a visually broken identifier.

### 18. Font Smoothing and Rendering
Properties such as `-webkit-font-smoothing` and `-moz-osx-font-smoothing` are non-standard rendering hints. They do not reliably improve text across platforms and can make text appear lighter or less legible.

Prefer choosing a suitable font, weight, size, and contrast. Do not globally apply non-standard smoothing rules as a universal polish step. Browser, operating system, display density, and rasterization settings all influence text rendering.

**Gotcha:** Text that appears slightly heavier on one operating system may be correct for that platform. Avoid “fixing” it with a global rule that degrades readability elsewhere.

### 19. Contrast, Weight, and Small Text
Typography cannot compensate for insufficient contrast. Small, light text on a low-contrast background is difficult to read even when the font is aesthetically pleasing.

Choose text colors that meet the applicable contrast requirements for the text size and role. Do not use font weight alone as a contrast fix. Test actual foreground/background combinations in every theme, including disabled, placeholder, and metadata states.

### 20. Semantic Hierarchy and HTML
Use heading elements to express document structure, not just to obtain a visual size. A page should have a logical heading hierarchy, and text styling should be handled with CSS.

```html
<main>
  <article>
    <h1>Annual report</h1>
    <section aria-labelledby="revenue-heading">
      <h2 id="revenue-heading">Revenue</h2>
      <p>Revenue increased during the reporting period.</p>
    </section>
  </article>
</main>
```

A heading's visual size does not determine its semantic level. Avoid selecting `<h4>` solely because its browser default size matches a design. Use CSS classes for visual variants.

### 21. Responsive Type Tokens
Centralize role-based values in custom properties:

```css
:root {
  --type-body: 1rem;
  --type-caption: 0.875rem;
  --type-title: clamp(1.75rem, 1.25rem + 2vw, 3rem);
  --leading-body: 1.6;
  --leading-heading: 1.12;
  --measure-prose: 68ch;
}

body {
  font-size: var(--type-body);
  line-height: var(--leading-body);
}

.prose {
  max-inline-size: var(--measure-prose);
}
```

Tokens make design changes coherent, but do not force every component to use a single line-height or size. Roles should be named by intent—body, caption, display, heading—rather than by arbitrary values alone.

### 22. Localization and Script Coverage
Text expansion is normal. A translated label may be substantially longer than the original. Some scripts require taller line boxes, different fallback fonts, or different word-breaking behavior.

Test:
- Long translated navigation labels.
- Names with accents and non-Latin glyphs.
- Right-to-left text where supported.
- Mixed-direction content such as URLs inside RTL paragraphs.
- Font fallback for every supported script.
- Buttons and cards with expanded text.
- Line-height around combining marks and diacritics.

Use `lang` and, when needed, `dir` attributes on the document or content region. Avoid fixed heights for text-bearing controls unless the content and overflow behavior are deliberately managed.

**Gotcha:** A layout tested only with English copy is not localization-ready. Longer labels can break a type system even when the font sizes are technically correct.

### 23. Variable Font Axes and Safe Usage
A variable font can expose axes beyond weight, including width, slant, italic, optical size, and custom design axes. Prefer standardized CSS properties for standard axes. Use `font-variation-settings` when a specific low-level axis is needed.

```css
.condensed-heading {
  font-stretch: 85%;
}

.italic-heading {
  font-style: italic;
}
```

Do not assume every font supports every axis or range. Inspect the font metadata and test fallbacks; a fallback face will not necessarily reproduce the same width or weight.

### 24. `font-size-adjust`
`font-size-adjust` can help preserve a chosen aspect of apparent size when fallback fonts are used, depending on the descriptor and browser support. It is not a replacement for a good fallback stack or real layout testing.

Use it when consistency across fallback faces is a real requirement and verify the result with the exact font families in the stack. Treat it as a targeted tool rather than a default rule on every page.

### 25. Text Selection, Copying, and Generated Content
Typography and visual styling should not make text difficult to select or copy. Avoid using generated content as the only source of meaningful words, labels, or instructions. CSS-generated punctuation or decorative markers are often fine, but important content belongs in the document.

Use `user-select: none` sparingly; applying it to large text areas can interfere with legitimate selection. Ensure ellipsized text can be discovered or copied when it carries essential information.

### 26. Debugging Typography
When a text block looks wrong, debug in this order:

1. Confirm the actual font rendered in DevTools.
2. Check computed font size, weight, line height, letter spacing, and text wrapping.
3. Check the containing block's inline size and padding.
4. Inspect font loading failures and network requests.
5. Compare fallback and final font metrics.
6. Test long content and supported languages.
7. Test at narrow widths and 200% zoom.
8. Verify semantic heading structure and contrast.
9. Remove one-off overrides that conflict with the token system.
10. Retest the page after fonts and content finish loading.

```js
const sample = document.querySelector(".article-copy");
if (sample) {
  const style = getComputedStyle(sample);
  console.table({
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    width: `${sample.getBoundingClientRect().width}px`,
    scrollWidth: sample.scrollWidth,
    clientWidth: sample.clientWidth,
  });
}
```

**Gotcha:** A screenshot captured before the web font loads may not represent the final layout. Test both the initial fallback state and the settled rendering.

---

## Reusable Patterns

### Pattern A — A readable body and measure

```css
.prose {
  max-inline-size: 68ch;
  font-size: 1rem;
  line-height: 1.65;
  overflow-wrap: anywhere;
}
```

Use for long-form text, then tune measure and leading against real content and scripts.

### Pattern B — A bounded fluid display scale

```css
:root {
  --type-display: clamp(2.25rem, 1.25rem + 4vw, 5rem);
  --type-heading: clamp(1.75rem, 1.3rem + 2vw, 3rem);
  --type-body: 1rem;
}

.hero-title {
  font-size: var(--type-display);
  line-height: 1.05;
  text-wrap: balance;
}
```

Keep body text stable unless the product has a reason to scale it fluidly.

### Pattern C — Semantic typography roles

```css
.type-display { font-size: var(--type-display); }
.type-heading { font-size: var(--type-heading); }
.type-body { font-size: var(--type-body); }
.type-caption { font-size: 0.875rem; }
```

Apply these classes to semantically appropriate HTML rather than choosing HTML tags by appearance.

### Pattern D — A resilient variable font declaration

```css
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: "Studio Sans", Arial, sans-serif;
  font-weight: 400;
  font-optical-sizing: auto;
}
```

Confirm the font file really supports the declared weight range and include a fallback stack.

### Pattern E — A stable fallback strategy

```css
@font-face {
  font-family: "Studio Sans Fallback";
  src: local("Arial");
  size-adjust: 98%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

This is a tuning pattern, not a copy-paste universal recipe. Measure the real font pair and test browser support before shipping metric overrides.

### Pattern F — Long text and identifiers

```css
.prose {
  overflow-wrap: anywhere;
}

.identifier {
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
```

Use only where breaking is acceptable; preserve code formatting and copy semantics.

### Pattern G — One-line truncation with a full-text path

```css
.file-name {
  min-inline-size: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
```

Provide a way to inspect or copy the full value if it matters to the task.

### Pattern H — Accessible focus styles for typographic controls

```css
a:focus-visible,
button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

Test focus visibility against actual component edges and themes.

### Pattern I — Localized content container

```css
.localized-copy {
  max-inline-size: 70ch;
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.localized-copy :lang(ar) {
  line-height: 1.8;
}
```

The values are examples. Tune per script, font, and content rather than assuming one metric fits all languages.

### Pattern J — Headings that wrap without brittle manual breaks

```css
.page-title {
  max-inline-size: 18ch;
  font-size: clamp(2rem, 1.4rem + 3vw, 4.5rem);
  line-height: 1.08;
  text-wrap: balance;
}
```

Test the heading with long translations and fallback fonts. Add a manual line break only when the editorial intent justifies it.

### Pattern K — Consistent numeric alignment

```css
.metric-value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

Use tabular numerals for rapidly changing numeric columns where stable digit widths help scanning. Check font support and avoid applying it indiscriminately to prose.

### Pattern L — Reduced motion for animated text

```css
.animated-heading {
  animation: reveal 500ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .animated-heading {
    animation: none;
  }
}
```

Motion should not be required to understand the heading. Avoid text effects that reduce contrast or cause flashing.

---

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Choosing font sizes independently for every component | Hierarchy becomes inconsistent | Define role-based type tokens |
| Using a fixed pixel root font size | Can interfere with expected user scaling | Use relative units and preserve user preferences |
| Using `line-height` in fixed pixels for body text | Text can overlap or clip when resized | Prefer unitless line height |
| Setting `line-height: 1` everywhere | Accents and tall glyphs may clip | Tune leading by role and script |
| Setting paragraph width in arbitrary pixels | Readability changes with font and viewport | Use a readable measure such as `ch` as a starting point |
| Assuming `65ch` equals 65 characters | Glyph widths differ | Validate actual line length in the chosen font |
| Using pure `vw` for all font sizes | Text may be too small or large and may scale poorly | Use bounded `clamp()` with relative units |
| Forgetting zoom tests | Layout can overlap or clip at 200% | Test zoom and narrow viewports |
| Preloading every font file | Competes with critical resources | Preload only genuinely critical font assets |
| Declaring a variable weight range the file does not support | Browser may synthesize or substitute weights | Verify font metadata and actual rendering |
| Using low-level variation settings unnecessarily | May conflict with higher-level properties | Prefer `font-weight`, `font-stretch`, and `font-style` |
| Applying wide tracking to body paragraphs | Reduces reading comfort | Reserve tracking for short labels or intentional display styles |
| Using `text-transform` to fix source-data casing | Presentation masks content issues | Normalize content correctly and style intentionally |
| Assuming `hyphens: auto` works in every language | Needs language metadata and browser dictionaries | Set `lang` and test the target scripts |
| Applying `overflow-wrap: anywhere` to all code | Can make code harder to read and copy | Give code a deliberate scroll or wrap strategy |
| Inserting `<br>` for every responsive heading | Creates brittle line breaks | Use width constraints and balanced wrapping |
| Styling `<h3>` as a heading because it looks right | Breaks semantic outline | Choose heading level by structure, then style it |
| Using non-standard font smoothing globally | Can reduce legibility on some platforms | Tune font, weight, size, and contrast first |
| Ignoring fallback font metrics | Late font loading shifts layout | Tune fallback stacks and measure layout shifts |
| Using a Latin-only subset for multilingual content | Glyphs may fall back unexpectedly or disappear | Subset only for a known supported language set |
| Setting fixed heights on translated buttons | Expanded text may clip | Let controls grow or define an accessible overflow strategy |
| Using ellipsis without a full-text path | Essential information becomes inaccessible | Provide reveal, copy, or another way to access the value |
| Using low-contrast light text for a premium look | Small text becomes difficult to read | Validate contrast for each theme and state |
| Assuming all variable fonts support optical sizing | Unsupported axes have no intended effect | Inspect font capabilities and test |
| Setting `font-size-adjust` without testing the font pair | Apparent size can become worse | Use it only when measured fallback inconsistency justifies it |
| Applying `user-select: none` to large regions | Prevents legitimate copying | Restrict it to small UI affordances when necessary |
| Testing only English content | Localization may break line wrapping and controls | Test long translations, scripts, and RTL content |
| Assuming equal CSS size means equal visual size | Typeface metrics differ | Compare rendered results, not only computed values |
| Letting caption text become tiny on mobile | Metadata becomes hard to read | Preserve practical minimums and allow reflow |
| Making headings so tight they collide | Glyph metrics and fallback fonts vary | Use safe leading and test real fonts |
| Treating `text-wrap: balance` as universal | Support and wrapping can vary | Use progressive enhancement and test fallback |
| Ignoring font loading errors | Browser silently uses a fallback | Check network, file format, CORS, and font declarations |
| Using a generic font stack with no generic family | Failure may produce unexpected rendering | End with an appropriate generic family |
| Assuming a local font exists everywhere | User devices vary | Provide web font or robust fallback |
| Applying tabular numerals to all prose | May reduce typographic fit | Use them for numeric data where alignment helps |
| Animating every text entrance | Can distract or affect motion-sensitive users | Keep motion restrained and honor reduced motion |
| Treating color as the only typographic hierarchy signal | Users may miss the distinction | Combine size, weight, spacing, and semantic structure |

---

## Mental Models

1. **Typography is geometry.** Font metrics determine wrapping, height, alignment, and downstream layout.
2. **Tokens encode roles, not arbitrary numbers.** A system should explain why a value exists.
3. **Readable measure is a constraint.** The container should serve the reading task, not the other way around.
4. **Line height is a relationship.** Unitless leading scales with type size and is generally safer for reusable text.
5. **Fluid type needs bounds.** Viewport scaling is useful only inside a readable minimum and maximum.
6. **Fallback fonts are part of the design.** The page must remain usable before the web font loads or if it fails.
7. **Semantics and appearance are separate.** HTML expresses structure; CSS expresses visual hierarchy.
8. **Text is variable content.** Localization, names, URLs, and user-generated strings are normal, not edge cases.
9. **The font file is a dependency.** Weight ranges and glyph coverage must match the CSS and language requirements.
10. **Clarity beats ornamental precision.** Tracking, tiny captions, and extreme weights should never undermine reading.
11. **Test the settled page and the loading state.** Font swaps can change geometry.
12. **Responsive typography is content-aware.** Different roles and scripts may need different rules.
13. **Accessibility includes resizing.** Type must survive zoom, reflow, and user preferences.
14. **A fallback path is a product feature.** Full text must remain discoverable when visual truncation is used.

---

## Quick Reference

| Need | Starting point | Check |
|---|---|---|
| Reusable body type | `font-size: 1rem; line-height: 1.6` | Test actual font and content |
| Readable article width | `max-inline-size: 65–70ch` | Confirm measure with the selected font |
| Fluid display title | `clamp(min, preferred, max)` | Test 320px, desktop, and zoom |
| Responsive heading wraps | `text-wrap: balance` | Progressive enhancement and localization |
| Variable font weight | `font-weight: 100–900` when supported | Confirm the file's axis range |
| Optical sizing | `font-optical-sizing: auto` | Verify the font supports it |
| Font swap behavior | `font-display: swap` | Check layout shift and fallback |
| Long URLs in prose | `overflow-wrap: anywhere` | Keep code strategy separate |
| Automatic hyphenation | `hyphens: auto` | Set `lang` and test browser support |
| Stable numeric columns | `font-variant-numeric: tabular-nums` | Confirm font feature support |
| One-line ellipsis | `overflow: hidden; white-space: nowrap; text-overflow: ellipsis` | Full text must remain available |
| Focusable links/buttons | `:focus-visible` outline | Verify contrast and clipping |
| Multilingual page | Accurate `lang` and `dir` | Test script coverage and expanded copy |
| Fallback metric tuning | `size-adjust` and metric overrides | Measure the real font pair |
| Respect motion preferences | `prefers-reduced-motion` | Motion is nonessential |
| Correct heading semantics | Logical `h1`–`h6` structure | Don't choose tags by default size |

---

## Build Challenge — Typography System Lab

Build a responsive editorial dashboard with a page title, summary cards, article body, numeric metrics, localized navigation, a variable font, and a long identifier. Use role-based tokens rather than isolated sizes.

### Requirements

1. Use semantic HTML with a logical heading hierarchy.
2. Define a body font stack with an appropriate generic fallback.
3. Define role-based custom properties for body, caption, heading, and display type.
4. Define line-height tokens for body text and headings.
5. Use relative units for the core type scale.
6. Create a bounded fluid display heading with `clamp()`.
7. Ensure body copy does not grow excessively with viewport width.
8. Apply a readable measure to the article body.
9. Test the article with short and long paragraphs.
10. Use a variable font only if the selected file supports the declared axes.
11. Declare `@font-face` descriptors that match the actual file.
12. Choose an intentional `font-display` strategy.
13. Verify the fallback state before the web font loads.
14. Check layout stability after the font loads.
15. Preload only a genuinely critical font if performance measurements justify it.
16. Ensure long URLs do not create page-level horizontal overflow.
17. Give code samples their own deliberate wrapping or scrolling behavior.
18. Use `text-wrap: balance` as a progressive enhancement for headings where supported.
19. Confirm headings remain readable without `text-wrap: balance`.
20. Avoid manual line breaks that only work at one viewport width.
21. Use tabular numerals for aligned changing metrics when the font supports them.
22. Keep caption text legible on narrow screens.
23. Provide sufficient contrast for text in every theme/state used.
24. Add visible `:focus-visible` styling to links and buttons.
25. Test at 320px, 375px, 768px, 1024px, and a wide desktop viewport.
26. Test browser zoom at 200%.
27. Test text resizing where the browser supports it.
28. Test a long translated navigation label.
29. Test accented and non-Latin glyphs required by the product.
30. Test right-to-left content if the product supports RTL.
31. Verify `lang` and `dir` metadata.
32. Ensure buttons and cards grow when text expands.
33. Verify line boxes do not clip accents or diacritics.
34. Check the rendered font in DevTools rather than trusting the CSS declaration.
35. Confirm no unnecessary low-level font variation settings override standard properties.
36. Avoid global non-standard font smoothing as a default polish rule.
37. Make truncated identifiers discoverable or copyable in full.
38. Ensure text remains selectable where users may need to copy it.
39. Honor `prefers-reduced-motion` for animated text.
40. Document why each typography token exists and which content role uses it.

### Acceptance checklist

- [ ] Typography has named, role-based tokens.
- [ ] Text remains readable at narrow widths and 200% zoom.
- [ ] Font loading and fallback rendering are both tested.
- [ ] Line length and leading fit the actual reading task.
- [ ] Long strings and localized labels do not break the layout.
- [ ] Semantic headings reflect structure rather than visual size.
- [ ] Contrast and focus states remain visible.
- [ ] The font file's real capabilities match the CSS declarations.
- [ ] Important truncated text remains discoverable.
- [ ] Reduced-motion preferences are respected.

## Final Engineering Checklist

Before shipping a typography system, ask:

- Does each type token represent a clear content role?
- Is the font stack robust when the preferred font fails?
- Have the actual font files, weights, axes, and glyph coverage been verified?
- Is line-height appropriate for the font, size, and supported scripts?
- Is the reading measure appropriate for the content?
- Does fluid type remain bounded and readable?
- Does the page work at 200% zoom and narrow widths?
- Can translated text expand without clipping?
- Are semantic headings independent of visual styling?
- Are contrast, focus visibility, and text selection preserved?
- Does truncation provide a route to the full value?
- Have both the fallback and loaded-font states been tested?
- Are non-standard rendering tweaks genuinely necessary?
- Can the team explain each token and exception?

A strong typography system is not merely attractive at one viewport. It remains legible, stable, and structurally clear as fonts, content, languages, and user settings change.
