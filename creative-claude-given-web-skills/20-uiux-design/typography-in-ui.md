# SKILL: typography-in-ui

**Layer:** 43 — UI/UX Design

**Goal:** Design and implement a coherent, responsive, accessible typography system for interfaces, using type roles, hierarchy, readable measure, line-height, fluid scaling, font loading, multilingual resilience, and implementation tokens that survive real product content.

---

## Why This Matters (Senior Perspective)

Typography is not the final layer of polish applied after the layout is finished. In an interface, typography is the layout. The width of a heading determines where the next line begins; the line-height of body copy affects the height of every card; the weight of a button label changes its visual emphasis; and the shape of numerals can influence how quickly someone compares prices or metrics. A type system that looks refined in a design file can become fragile when a real product introduces longer names, translated labels, validation messages, dense tables, or a narrower viewport.

Beginners often select a fashionable display font, a readable body font, and a few arbitrary sizes. They may use 48px for a hero, 24px for a section heading, and 16px for everything else without defining how those values relate. This can work in a single screenshot, but it rarely scales across a product. Senior designers define a typographic system: roles, a deliberate scale, line-height rules, measure constraints, weight conventions, responsive behavior, and rules for exceptions. They ask whether a heading's job is to attract, orient, summarize, or label; whether a number needs tabular alignment; whether a caption is actually necessary; and whether the text remains understandable at zoom and in translated content.

Typography also communicates personality and trust. A portfolio for a motion designer may use expressive display type, oversized scale, and unusual line breaks. A finance dashboard usually needs rapid scanning, stable numeric alignment, and restrained emphasis. A healthcare form needs clear labels, readable instructions, and errors that are easy to locate. A product can be visually distinctive without sacrificing comprehension, but expressive choices must be concentrated where they help the experience rather than distributed indiscriminately across every component.

Production failures are often subtle. A heading wraps into an orphaned word at one breakpoint. A custom font loads late and shifts the entire page. A numeric dashboard column jitters because each digit has a different width. A muted caption becomes unreadable on a low-quality display. A button label clips in another language. A form label is too small to scan. A developer uses `font-weight: 600` even though the font file only contains 400 and 700, so the browser synthesizes a weight that looks wrong. A type scale uses fixed sizes that overwhelm mobile screens. These are not merely aesthetic defects: they create friction, slow scanning, weaken accessibility, and increase maintenance costs.

For freelance and agency work, typography is also a handoff problem. A client may provide a brand font without specifying weights, licensing, fallback behavior, or how it should be used in a dense UI. A designer must translate brand expression into operational rules. The system needs a clear type ramp, named roles, font stacks, loading strategy, and examples of how the roles behave in headings, body copy, forms, navigation, tables, empty states, and responsive layouts. If the developer has to guess which of six similar gray labels should be 13px or 14px, the design system is not finished.

This skill focuses on decisions that can be explained and tested. You will learn to choose typefaces for their job, establish hierarchy, manage line length and vertical rhythm, use fluid typography responsibly, preserve accessibility, and debug rendering problems in the browser. The aim is not to make every interface look the same. It is to give each interface a typographic voice that remains readable, purposeful, and robust when the idealized mockup meets real content.

---

## Core Concepts

### 1. Design type roles before choosing arbitrary sizes

A type role describes what text does in the interface: display heading, page title, section heading, body, supporting text, label, button, metadata, or numeric value. Roles create consistency because the same kind of information receives a similar treatment across the product. They also prevent the type system from becoming a long list of one-off sizes.

Start by inventorying the content hierarchy. A marketing page may need a display role, while a settings screen may not. A dashboard may need a compact table role and a numeric metric role. Do not create a token just because one element looks slightly different; create a role when it represents a repeatable purpose.

```css
:root {
  --type-display-size: clamp(2.75rem, 6vw, 5.5rem);
  --type-page-title-size: clamp(2rem, 4vw, 3.5rem);
  --type-section-title-size: clamp(1.5rem, 2.5vw, 2.25rem);
  --type-body-size: 1rem;
  --type-support-size: 0.875rem;
  --type-label-size: 0.875rem;
}
```

These tokens are starting points, not universal values. A dense enterprise application may use a smaller display scale than a portfolio. The key is that each role has a reason to exist and an intended context. Document the role's purpose, size, weight, line-height, and allowed width.

### 2. Establish a deliberate type scale

A type scale is a set of related sizes that creates hierarchy without arbitrary jumps. Common approaches include modular scales, geometric ratios, and a hand-tuned scale based on actual interface roles. A ratio can help generate a coherent family, but it should not override usability. A scale that produces an enormous gap between body text and a page title may look elegant in a specimen sheet but create awkward interface hierarchy.

Choose a base size, define the roles the product needs, and test them on representative screens. A small scale may be sufficient for a utility app; a content platform may need more variation. The scale should make differences intentional: headings need to stand apart from body copy, while adjacent levels should remain clearly related.

```css
:root {
  --type-12: 0.75rem;
  --type-14: 0.875rem;
  --type-16: 1rem;
  --type-18: 1.125rem;
  --type-20: 1.25rem;
  --type-24: 1.5rem;
  --type-32: 2rem;
  --type-40: 2.5rem;
  --type-56: 3.5rem;
}
```

Use rem-based values for most interface type so browser zoom and user font preferences can influence the result. Do not interpret “never use pixels” as a reason to avoid all fixed pixel values in design discussions; the important implementation goal is scalable behavior. CSS pixel values can be appropriate for borders and some optical details, while text roles should generally use relative units and tested fluid rules.

### 3. Pair typefaces by role and contrast

Typeface pairing should be purposeful, not a contest to find two unusual fonts. One family may handle body text and UI labels while another provides display personality. Pairing can use contrast in construction, width, or character, but too many unrelated families create noise and increase loading cost. A single well-chosen family with several useful weights may be stronger than two families that compete.

Evaluate typefaces in actual product content. Check lowercase shapes, numerals, punctuation, bold text, italics if needed, and the way the font behaves at small sizes. A display face that looks distinctive at 72px may become difficult to read in a navigation item. A body face should have a useful range of weights, a reliable character set, and legible forms at normal UI sizes.

```css
:root {
  --font-display: "Manrope", "Avenir Next", sans-serif;
  --font-body: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  font-family: var(--font-body);
}

h1,
h2,
.display-heading {
  font-family: var(--font-display);
}
```

Do not load a second family merely because the heading looks plain. First test weight, size, line-height, letter spacing, and width. A typeface pair should have distinct jobs and enough shared character to feel like one system.

### 4. Choose readable line-height by role

Line-height controls the vertical space occupied by text lines. Large display headings often need a tighter line-height because the glyphs are large and the heading is short. Body copy usually needs more vertical room so readers can track lines. Dense labels and compact table cells may use a tighter value, but compression should not make text feel crowded or reduce clarity.

Use unitless line-height values for most text roles. A unitless value scales with the computed font size, which helps when the size changes responsively. Avoid assigning a fixed pixel line-height to a role that uses fluid font sizing unless you have a specific reason and have tested the full range.

```css
:root {
  --leading-display: 0.98;
  --leading-heading: 1.12;
  --leading-body: 1.55;
  --leading-compact: 1.35;
}

.display-heading {
  font-size: var(--type-display-size);
  line-height: var(--leading-display);
}

.article-copy {
  font-size: var(--type-body-size);
  line-height: var(--leading-body);
}
```

Inspect headings with multiple lines, not only one-line examples. A tight line-height that looks impressive on one line can cause descenders and accents to feel cramped in a two-line title. For body text, test paragraph blocks and lists at the actual measure.

### 5. Control measure: line length matters

Measure is the width of a text block, often expressed as characters per line. Long lines make it harder to return to the next line; very short lines create excessive wrapping and interrupt the flow. A common starting point for comfortable body copy is roughly 45–75 characters per line, but the appropriate measure depends on font, language, content, and context. Short UI labels and table cells have different constraints from long-form reading.

Constrain content width rather than relying on font size alone. A hero heading may have a narrower maximum width to create deliberate line breaks. Article copy may use a readable measure while the surrounding layout remains wide. A dashboard can use wider text blocks for concise labels but should avoid turning a dense table into a paragraph-width column.

```css
.prose {
  max-inline-size: 68ch;
  font-size: 1rem;
  line-height: 1.6;
}

.hero-title {
  max-inline-size: 13ch;
  font-size: clamp(2.75rem, 7vw, 6rem);
  line-height: 0.98;
}
```

`ch` is based on the width of the “0” glyph in the current font, so it is a useful approximation rather than an exact character count. Test the result with real words and responsive widths. Avoid forcing line breaks in content unless the break is part of the intentional art direction and remains robust under localization.

### 6. Use fluid typography with boundaries

Fluid typography lets text scale between a minimum and maximum based on viewport or container size. CSS `clamp()` is useful because it combines a lower bound, a preferred fluid expression, and an upper bound. This can avoid abrupt jumps at breakpoints, especially for hero headings and major section titles.

Fluid does not mean every type role should scale continuously. Body text often benefits from a stable readable base size, while display roles can adapt more visibly. The minimum must remain readable, and the maximum must not create a heading so large that it dominates the page or wraps awkwardly. Test zoom and narrow screens as well as the target desktop viewport.

```css
.page-title {
  font-size: clamp(2rem, 1.3rem + 3.2vw, 3.75rem);
  line-height: 1.05;
}

.section-title {
  font-size: clamp(1.5rem, 1.15rem + 1.5vw, 2.25rem);
  line-height: 1.15;
}

body {
  font-size: 1rem;
  line-height: 1.55;
}
```

Do not use `vw` alone for text because it can become too small on narrow viewports and too large on wide screens. A `clamp()` expression should have meaningful limits and be tested at intermediate widths, not just at the endpoints.

### 7. Make hierarchy work beyond size

Type hierarchy can be expressed through size, weight, color, spacing, line-height, case, and position. Size is a strong signal, but overusing it creates a loud interface. A label can be differentiated from a value through weight and spacing; metadata can be quieter without becoming unreadable; a section heading can use position and whitespace to establish structure.

Use a limited set of weights and hierarchy signals. If every heading is bold, uppercase, colored, and letter-spaced, the hierarchy becomes exhausting. If every label is gray and tiny, it becomes difficult to scan. Ask what the user should notice first, second, and third, then use typography to reinforce that order.

```css
.metric-label {
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.metric-value {
  color: var(--text-primary);
  font-size: clamp(1.75rem, 2.5vw, 2.5rem);
  font-weight: 650;
  line-height: 1.05;
  font-variant-numeric: tabular-nums;
}
```

If a screen feels flat, do not immediately add more colors or fonts. Try clarifying the content roles, changing the measure, adjusting the weight, and introducing more deliberate spacing around headings.

### 8. Treat font weight as a real design variable

Font weights affect emphasis, density, and perceived size. A semibold label may improve scanning; an extra-bold heading may overpower the rest of the interface. Weight values should reflect what the font file actually supports. If only regular and bold files are loaded, requesting 500 or 600 may cause synthetic rendering or map to an available face in ways that vary by browser.

When using a variable font, declare the supported weight range. When using static files, register each actual weight with `@font-face`. Then use the intended weights consistently. Avoid using weight changes as the only indication of hierarchy because some fonts have subtle differences between adjacent weights.

```css
@font-face {
  font-family: "Interface Sans";
  src: url("/fonts/interface-sans-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

body {
  font-family: "Interface Sans", system-ui, sans-serif;
  font-weight: 400;
}

strong,
.emphasis {
  font-weight: 650;
}
```

If the font is static, do not declare a variable range that the file does not contain. Check network requests and computed styles in DevTools to confirm that the correct file and weight are being used.

### 9. Use letter spacing with restraint

Letter spacing changes the spacing between characters. Small positive tracking can help uppercase labels, while large display text may use slightly negative tracking to tighten the word shape. Body copy generally needs little or no tracking adjustment. Excessive letter spacing harms word recognition, especially at small sizes, and can make a polished interface feel artificial.

Letter spacing is font-dependent. A condensed display face may need different treatment from a wide geometric sans. Always test the actual words, including punctuation and accented characters. Avoid forcing uppercase and wide tracking onto long labels or instructions.

```css
.eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.display-heading {
  letter-spacing: -0.035em;
}
```

Do not apply negative tracking globally. It may improve one headline while causing body text, small labels, and fallback fonts to collide visually. Keep optical adjustments local to the roles that benefit from them.

### 10. Build a robust font-loading strategy

Custom fonts can improve brand expression, but they introduce network requests and rendering decisions. If the font is slow, the browser may show a fallback and later swap to the custom font, shifting line breaks and page geometry. `font-display: swap` prioritizes visible text, while `font-display: optional` may avoid a late swap in some circumstances but can mean the custom face is not used on a slow connection. The right strategy depends on the product and performance budget.

Use modern, appropriately subsetted font files where licensing permits. Load only the families, styles, and weights the interface uses. Preload a critical font only when it is truly needed for above-the-fold content; over-preloading wastes bandwidth. Provide a system fallback with similar metrics when possible, and inspect the page before and after the custom font loads.

```css
@font-face {
  font-family: "Northstar Sans";
  src: url("/fonts/northstar-sans-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

body {
  font-family: "Northstar Sans", "Segoe UI", system-ui, sans-serif;
}
```

Use DevTools Network and Performance panels to inspect font requests and layout shifts. If the fallback differs substantially, consider a better metric-compatible fallback or supported font metric overrides such as `size-adjust`, `ascent-override`, and `descent-override`, after testing browser support.

### 11. Use tabular numerals for aligned data

Numbers are content, not decoration. In tables, prices, percentages, timers, and metric cards, proportional numerals can make columns appear to jump because each digit has a different width. Tabular numerals give digits equal widths, improving comparison and alignment. This is particularly valuable in dashboards and financial interfaces.

Apply numeric features selectively. A paragraph containing numbers may benefit from normal proportional numerals, while a table column should usually align values. Confirm that the chosen font supports the feature and that currency symbols, minus signs, decimal separators, and localized formats remain readable.

```css
.data-table__number,
.metric-value,
.price {
  font-variant-numeric: tabular-nums lining-nums;
  text-align: end;
}

.data-table__number {
  white-space: nowrap;
}
```

Do not rely on spaces to align digits in text. Use table layout, grid, or flex alignment and the font's numeric features. Test large values and locale-specific formatting because grouping separators and decimal marks change the visual width.

### 12. Respect semantic HTML and reading order

Visual typography should reinforce the document's semantic structure rather than replace it. Use a meaningful heading hierarchy, paragraphs for prose, lists for groups, labels for form controls, and buttons or links for actions. A heading should not be chosen solely because its default browser size looks right. Style the correct element with CSS rather than using a heading tag for visual appearance.

A coherent heading outline helps screen-reader users navigate long pages and helps teams maintain content structure. The heading levels should represent hierarchy, not merely the desired font size. Use landmarks such as `header`, `nav`, `main`, and `footer` where appropriate, and ensure the visual reading order matches the DOM order.

```html
<main>
  <header class="page-header">
    <p class="eyebrow">Account</p>
    <h1>Notification preferences</h1>
    <p class="page-intro">Choose which updates you want to receive.</p>
  </header>

  <section aria-labelledby="billing-heading">
    <h2 id="billing-heading">Billing updates</h2>
    <p>Receive messages about invoices and payment status.</p>
  </section>
</main>
```

Do not create a heading structure with only `div` elements and visual classes. Semantic markup improves navigation, content interpretation, and maintainability. The styling can still be highly art-directed.

### 13. Make typography accessible under zoom and user preferences

Readable typography must survive browser zoom, text resizing, and changes to default font settings. Avoid fixed-height containers that clip text. Use relative units for type and line-height, allow content to reflow, and test at 200% zoom. WCAG guidance includes requirements related to resizing text and reflow; a responsive design should not require horizontal scrolling for ordinary text content at common zoom levels, except for content whose two-dimensional layout is essential.

Do not disable user scaling on mobile. Do not assume that a 14px label is acceptable simply because it matches a design file. Readability depends on context, contrast, weight, language, and device. Essential controls should remain visible and usable when text wraps or grows.

```css
.form-field__hint {
  font-size: 0.875rem;
  line-height: 1.5;
  max-inline-size: 60ch;
}

.form-field__label {
  display: block;
  margin-block-end: 0.4rem;
  font-size: 1rem;
  line-height: 1.4;
}

.form-field__control {
  inline-size: 100%;
  min-block-size: 2.75rem;
  font: inherit;
}
```

Test with browser zoom, text-only enlargement where available, and narrow viewports. Check that modal actions, table headers, navigation, and form errors do not overlap or disappear. Accessibility is not achieved by font size alone, but type sizing is a foundational part of it.

### 14. Handle localization and long content gracefully

Typography must work with content that is longer than the designer's sample. German compound words, French punctuation, Arabic text, CJK characters, and user-generated names can all change line breaks and width. A layout that depends on an English heading fitting on one line may fail after localization. Avoid fixed heights for text containers and give controls enough room for expanded labels.

Use logical properties and flexible sizing. Allow headings to wrap naturally unless a controlled line break is a deliberate and validated design choice. If truncation is necessary, preserve access to the full value and do not truncate essential instructions or error explanations.

```css
.card-title {
  max-inline-size: 100%;
  overflow-wrap: anywhere;
  line-height: 1.2;
}

.action-button {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  white-space: normal;
  text-align: center;
}
```

Use `overflow-wrap: anywhere` selectively because it can break long identifiers or URLs in ways that are not ideal for all content. For ordinary prose, natural wrapping is usually better. Test right-to-left layouts, translated labels, and mixed-script content when the product supports them.

### 15. Use truncation only when it protects a real layout constraint

Ellipsis can help in dense tables or compact navigation, but truncation removes information. A title shortened to “Subscription configur…” may be tolerable in a card if the full title is available elsewhere; a truncated payment failure explanation is not. Decide what information can safely be abbreviated, where the full content remains accessible, and how the user can discover it.

CSS line clamping is useful for preview content, but it is not a replacement for content design. Ensure the full text is available through a detail view or another accessible mechanism. Do not hide meaningful text in a way that makes it inaccessible to keyboard or assistive-technology users.

```css
.project-card__summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}
```

Test clamped content with keyboard and screen-reader navigation. Do not use a hover-only tooltip as the sole way to reveal essential information; touch users and keyboard users need an equivalent path.

### 16. Make typography work in dense data interfaces

Tables and dashboards require fast scanning more than expressive typography. Use a stable body face, clear column labels, tabular numerals, restrained weight changes, and enough line-height for rows to remain distinguishable. Avoid making every number bold or every label uppercase. If the screen is dense, improve information architecture and spacing before shrinking type to fit everything.

Differentiate primary values from supporting metadata through a consistent hierarchy. Align numeric content to the end of the cell where that aids comparison. Keep interactive row actions legible and focusable. Use `font-variant-numeric` when supported by the chosen typeface and test locale-sensitive values.

```css
.data-table {
  inline-size: 100%;
  border-collapse: collapse;
  font-size: 0.9375rem;
}

.data-table th {
  text-align: start;
  font-size: 0.8125rem;
  font-weight: 700;
  line-height: 1.35;
}

.data-table td {
  line-height: 1.45;
  padding-block: 0.85rem;
}

.data-table .numeric {
  text-align: end;
  font-variant-numeric: tabular-nums;
}
```

If a table becomes unreadable at a narrow viewport, do not automatically reduce all type sizes. Consider a responsive alternative, prioritized columns, horizontal scrolling with clear affordances, or a card-based presentation that preserves the data relationships.

### 17. Use variable fonts intentionally

Variable fonts can contain a range of weights, widths, optical sizes, and other axes in one file. They can reduce file duplication and allow fine tuning, but the presence of an axis does not mean every value should be used. Optical size may improve rendering at different text sizes; weight animation may add personality to a hero, but it can also create distracting motion or change layout metrics.

Prefer standard CSS properties such as `font-weight`, `font-stretch`, and `font-optical-sizing` when they expose the desired axis. Use `font-variation-settings` for axes that are not otherwise available, and keep it local. Test the supported range and browser behavior before animating or assigning nonstandard values.

```css
@font-face {
  font-family: "Variable Display";
  src: url("/fonts/variable-display.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 900;
}

.hero-title {
  font-family: "Variable Display", sans-serif;
  font-weight: 720;
  font-optical-sizing: auto;
}
```

Do not declare a weight range unless the font file supports it. A variable font can still be large, poorly subsetted, or unsuitable for small UI text. Measure loading cost and inspect actual glyph coverage before adopting it.

### 18. Avoid typography that depends on color alone

A type system often uses color to establish secondary hierarchy, but color should not be the only way to identify meaning. A muted error label may become unreadable, and a colored inline link may be indistinguishable from body text to some users. Links in prose should have a clear visual affordance, and error or success messages should use explicit words and appropriate semantics.

Use underlining, weight, placement, icons, or labels where appropriate. Ensure text contrast meets the relevant requirements. The right treatment depends on context: a link in navigation may be identified by position and behavior, while an inline link in a paragraph often benefits from an underline.

```css
.prose a {
  color: var(--color-link);
  text-decoration-line: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.16em;
}

.field-error {
  color: var(--color-danger-text);
  font-weight: 600;
}
```

Do not rely on a color change alone for hover or link identification in body text. Keep focus styling visible and ensure the link's purpose is understandable from its text or context.

### 19. Keep typography tokens aligned with spacing tokens

Typography and spacing are coupled. A line-height change alters component height; a font-size change changes wrapping; a heading role often needs a matching margin rule. If spacing is defined without regard to type roles, headings can feel detached or body copy can become cramped. Define vertical rhythm around text roles and let content determine height.

Prefer flow-based spacing and component padding over fixed heights. A heading followed by a paragraph should have a deliberate relationship, while separate sections need stronger separation. Avoid stacking unrelated margins on every child, which can create unpredictable gaps when content is inserted or removed.

```css
.prose-flow > * + * {
  margin-block-start: 1em;
}

.prose-flow > h2 {
  margin-block-start: 2em;
  margin-block-end: 0.55em;
}

.prose-flow > p {
  margin-block-end: 0;
  max-inline-size: 68ch;
}
```

Use a spacing system that relates to the typography scale, but do not force all gaps to be multiples of a single value when optical adjustment is needed. Test long content and component composition, not only isolated text blocks.

### 20. Debug typography in the rendered browser

A type specimen and a design file cannot reproduce every runtime condition. The browser resolves font availability, fallback selection, font loading, variable axes, inherited styles, zoom, and platform rendering. When typography looks wrong, inspect the computed font family, font weight, line-height, letter spacing, width, and actual loaded font resource.

Use DevTools to check whether the intended font file loaded, whether a CSS rule was overridden, and whether a container is clipping or constraining the text. Compare screenshots before and after font load if layout shifts occur. Test on more than one browser or operating system when the product audience requires it.

```css
/* Temporary diagnostic utility: remove after inspecting the layout. */
.debug-type * {
  outline: 1px solid rgb(220 60 60 / 28%);
}

.debug-type p,
.debug-type li {
  max-inline-size: 68ch;
}
```

Debug in a sequence: reproduce, inspect computed styles, confirm the font resource, measure the container, test the relevant viewport and zoom, then adjust the token or component rule. Avoid adding a one-off negative margin before identifying the cause.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Semantic typography tokens

**What it does:** Names type styles by role so components share a consistent hierarchy.

**When to use it:** Use it in product interfaces, design systems, portfolios, and client sites with repeated text roles.

```css
:root {
  --font-ui: "Inter", system-ui, sans-serif;
  --size-body: 1rem;
  --size-label: 0.875rem;
  --size-title: clamp(2rem, 1.3rem + 3vw, 3.75rem);
  --leading-body: 1.55;
  --leading-title: 1.05;
}

body {
  font-family: var(--font-ui);
  font-size: var(--size-body);
  line-height: var(--leading-body);
}

h1 {
  font-size: var(--size-title);
  line-height: var(--leading-title);
}
```

Document the role's use and constraints. A token system should reduce decisions at the point of component authoring rather than simply rename arbitrary values.

### Pattern 2: Fluid display scale with fixed readable body text

**What it does:** Lets large headings adapt to viewport size while keeping paragraph text stable and readable.

**When to use it:** Use it for landing pages, portfolio heroes, editorial headers, and marketing sections.

```css
.hero-title {
  max-inline-size: 12ch;
  font-size: clamp(2.75rem, 1.6rem + 5vw, 6.25rem);
  line-height: 0.98;
}

.hero-copy {
  max-inline-size: 58ch;
  font-size: 1.0625rem;
  line-height: 1.6;
}
```

Test intermediate widths and text zoom. A fluid heading can still wrap badly if the max width is too narrow or the font has very wide glyphs.

### Pattern 3: Stable numeric alignment

**What it does:** Uses tabular numerals and alignment rules to make values easier to compare.

**When to use it:** Use it in financial dashboards, pricing pages, scorecards, tables, counters, and time displays.

```css
.metric-value,
.numeric-cell {
  font-variant-numeric: tabular-nums lining-nums;
  text-align: end;
}
```

Test real values such as negative amounts, large currency figures, percentages, and locale-specific separators. Typography should preserve the meaning of the data rather than merely make the column look neat.

### Pattern 4: Font loading with fallback resilience

**What it does:** Makes text visible immediately while a custom font loads and provides a robust fallback stack.

**When to use it:** Use it whenever a site relies on self-hosted or remote fonts, especially on content-heavy pages.

```css
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

body {
  font-family: "Studio Sans", "Segoe UI", system-ui, sans-serif;
}
```

Use only the weights and character subsets that the interface needs. Inspect layout shift and test the page on a throttled connection rather than assuming font loading is instant.

### Pattern 5: Responsive content measure

**What it does:** Keeps text blocks at a comfortable width without forcing the entire page into a narrow layout.

**When to use it:** Use it for article copy, onboarding instructions, product descriptions, and explanatory sections.

```css
.reading-content {
  inline-size: min(100% - 2rem, 68ch);
  margin-inline: auto;
  line-height: 1.6;
}
```

Validate the measure with actual text and localized content. The `ch` unit is an approximation; font metrics and word lengths still affect readability.

### Pattern 6: Accessible links in prose

**What it does:** Makes links distinguishable without relying only on color.

**When to use it:** Use it for inline links in paragraphs, help content, legal text, and long-form product documentation.

```css
.prose a {
  text-decoration: underline;
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.16em;
}

.prose a:focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 3px;
}
```

Check contrast, hover, and keyboard focus. An inline link should remain identifiable when the page is printed or viewed by someone who cannot distinguish the link color from body text.

### Pattern 7: Type-safe form fields

**What it does:** Aligns labels, controls, hints, and errors into a predictable hierarchy.

**When to use it:** Use it for account settings, checkout, onboarding, search forms, and any task-critical form.

```html
<div class="form-field">
  <label for="workspace-name">Workspace name</label>
  <input id="workspace-name" name="workspace-name" aria-describedby="workspace-name-hint" />
  <p id="workspace-name-hint">Use a name your team will recognize.</p>
</div>
```

The label should remain associated with the input, and hint/error text should be connected programmatically when it provides necessary instructions. Style the hierarchy without shrinking supporting text until it becomes difficult to read.

### Pattern 8: Robust wrapping for dynamic labels

**What it does:** Allows long labels and translated content to wrap instead of clipping or overflowing.

**When to use it:** Use it for buttons, cards, navigation, user names, and responsive layouts that must support localization.

```css
.action-button {
  min-block-size: 2.75rem;
  padding: 0.75rem 1rem;
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.25;
}
```

Use aggressive word breaking selectively. For ordinary text, natural wrapping is preferable; for long identifiers or URLs, choose a rule that preserves readability and meaning.

### Pattern 9: Reduced visual noise in dense dashboards

**What it does:** Uses a small number of type roles, stable weights, and numeric alignment to support scanning.

**When to use it:** Use it for analytics dashboards, operational tools, admin panels, and data-heavy applications.

```css
.dashboard {
  --dashboard-body: 0.9375rem;
  --dashboard-label: 0.8125rem;
  --dashboard-metric: clamp(1.75rem, 2vw, 2.5rem);
}

.dashboard {
  font-size: var(--dashboard-body);
}

.dashboard .metric-label {
  font-size: var(--dashboard-label);
}

.dashboard .metric-value {
  font-size: var(--dashboard-metric);
  font-variant-numeric: tabular-nums;
}
```

Do not solve density by shrinking every role. First remove redundant information, improve column design, and create a responsive presentation for narrow screens.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Choosing a display font before defining roles | Visual novelty is prioritized over system needs | Inventory content roles and choose a family that supports the actual UI sizes and weights |
| Using arbitrary sizes on every component | A single screenshot is optimized without a scale | Define a compact type ramp and map repeated content roles to tokens |
| Using one line-height for every role | A global reset seems simpler | Set role-specific unitless line-height values and test multi-line headings and paragraphs |
| Setting body copy too wide | Desktop space is treated as a reason to stretch text | Constrain prose with a tested measure such as `68ch` and validate real paragraphs |
| Making all headings oversized | Hierarchy is mistaken for maximum scale | Reserve display sizing for high-level moments and use a balanced role scale below it |
| Using weight as the only hierarchy signal | Size and spacing changes feel more expensive | Combine size, weight, line-height, position, and whitespace intentionally |
| Loading too many font files | Every style variation is treated as necessary | Audit actual usage and load only required families, styles, and weights |
| Declaring a variable weight range for a static font | The CSS declaration is copied from another project | Register each real static file separately and confirm the loaded weight in DevTools |
| Using `vw` alone for font size | Fluid scaling appears simpler than breakpoints | Use `clamp()` with tested minimum and maximum bounds |
| Applying negative letter spacing globally | A display headline looks tighter | Scope tracking adjustments to the display role and inspect fallback fonts |
| Using fixed-height text containers | Mockup dimensions are copied literally | Let text containers grow and use min-height only when a minimum is genuinely needed |
| Ignoring font loading shifts | The custom font looks correct after the page settles | Test slow connections and choose a metric-compatible fallback or font metric overrides |
| Aligning numbers with spaces | Text layout is used instead of layout primitives | Use table/grid alignment and `font-variant-numeric: tabular-nums` |
| Using heading tags only for their size | Browser defaults are confused with semantics | Use the correct heading level and style it with CSS |
| Making captions too faint or too small | Supporting content is considered unimportant | Preserve readable contrast and a practical minimum size for essential supporting text |
| Relying on color alone for inline links | The brand color is assumed to be obvious | Add underline or another clear affordance and keep focus visible |
| Forcing manual line breaks in headings | One viewport is treated as the only target | Prefer max-width and fluid sizing; keep deliberate breaks only when tested across content variants |
| Truncating essential instructions | Compact cards are prioritized over comprehension | Truncate only preview content and provide an accessible route to the complete text |
| Ignoring localization | English content fits the chosen dimensions | Test longer translated strings, right-to-left layouts, and mixed scripts |
| Shrinking type to solve a dense dashboard | Information architecture is left unchanged | Remove redundancy, reflow content, and prioritize columns before reducing type size |
| Removing focus outlines for visual consistency | Browser focus styles are seen as unbranded | Implement and test a deliberate `:focus-visible` indicator |
| Assuming a typeface has every glyph | The designer tests only basic Latin letters | Check glyph coverage and fallback behavior for symbols, accents, currencies, and supported languages |
| Animating variable-font weight everywhere | Motion is confused with refinement | Restrict axis animation to purposeful moments and respect reduced-motion preferences |
| Using tooltips as the only source for truncated text | Hover behavior is convenient on desktop | Provide full text in an accessible detail view or persistent description |
| Fixing wrapping with random negative margins | The symptom is patched without diagnosis | Inspect font metrics, container width, weight, and line-height before changing spacing |

---

## Mental Models

1. **Typography is layout** — Every change to font metrics can alter wrapping, component height, alignment, and the rhythm of the whole screen.
2. **Roles before values** — Define what text does before choosing the exact size, weight, or family.
3. **Hierarchy is a relationship** — A heading becomes prominent in relation to nearby text, spacing, color, and position, not from size alone.
4. **Measure controls reading effort** — Comfortable line length helps users return to the next line and maintain their place.
5. **Fluid needs boundaries** — Responsive type should adapt without becoming too small on narrow screens or oversized on wide ones.
6. **Real content is the test** — A type system is not robust until it handles long names, errors, numbers, and localization.
7. **Font loading is part of UX** — Fallback choice and loading strategy affect readability and layout stability before the custom face appears.
8. **Numerals have behavior** — Tabular figures and deliberate alignment make quantitative information easier to compare.
9. **Semantic structure outlives styling** — Correct headings, labels, lists, and landmarks keep meaning intact when the visual treatment changes.
10. **Exceptions need a reason** — One-off type styles are acceptable when they solve a real problem and are documented, not when they avoid system decisions.

---

## Quick Reference

| Need | Recommended approach | Validate |
|---|---|---|
| Start a type system | Inventory roles, then define a compact scale | Check all roles on representative screens |
| Choose body type | Prioritize legibility, glyph coverage, and useful weights | Test actual paragraphs at normal UI sizes |
| Set line-height | Use unitless, role-specific values | Inspect multi-line headings, paragraphs, and labels |
| Control prose width | Start around `60–70ch` and adjust to the font | Test with real content and translated strings |
| Scale hero headings | Use `clamp()` with clear minimum and maximum values | Check intermediate widths and zoom |
| Align financial data | Use tabular numerals and end alignment | Test negatives, large values, and locale formats |
| Load custom fonts | Use appropriate WOFF2 files and a resilient fallback stack | Inspect Network and Performance panels |
| Use variable fonts | Declare only supported axes and ranges | Confirm real files, weights, and browser rendering |
| Style links in prose | Use underline or another visible non-color cue | Test contrast and keyboard focus |
| Build forms | Use real labels, readable hints, and connected errors | Test keyboard, screen reader, and zoom |
| Support localization | Allow wrapping and avoid fixed text heights | Test long labels, RTL, and mixed scripts |
| Handle overflow | Truncate only nonessential preview content | Ensure the full value remains available accessibly |
| Improve dense tables | Simplify roles and align numerals before shrinking type | Test narrow screens and realistic data |
| Debug a font issue | Inspect computed styles and loaded font resources | Reproduce at the failing viewport and zoom level |
| Review accessibility | Test text resizing, contrast, semantics, and focus | Run automated checks plus manual review |

---

## Build Challenge

### Project: Design the typography system for a SaaS analytics dashboard and marketing page

Build a responsive typography system for **Northstar**, a subscription analytics product used by small businesses. The same brand needs a marketing landing page and an authenticated dashboard. The landing page should feel confident and editorial; the dashboard should feel efficient and calm. Both should share a typographic identity without forcing the same scale onto every context.

The dashboard includes recurring revenue, trial conversion, churn, payment failures, a customer table, filters, a form, and explanatory help text. The marketing page includes a hero headline, product explanation, feature sections, testimonials, and a call to action. Test the system against realistic content rather than only short placeholder copy.

### Requirements

1. **Define the roles.** Create roles for display, page title, section heading, body, supporting copy, label, button, metadata, and numeric data. Explain which roles are shared and which are context-specific.
2. **Choose the font stack.** Select a primary UI family and, if useful, a display family. Explain the reason for each choice and provide sensible fallbacks.
3. **Build a type scale.** Use rem-based values for core roles and define a coherent relationship between adjacent levels.
4. **Add fluid behavior.** Use `clamp()` for appropriate display and heading roles, with tested minimum and maximum values.
5. **Set line-height and measure.** Establish role-specific line-height values and constrain long-form copy to a comfortable reading width.
6. **Implement semantic HTML.** Use appropriate `header`, `nav`, `main`, `section`, `article`, `h1`–`h3`, `p`, `ul`, `li`, `label`, `input`, `button`, and `table` elements where they fit the content.
7. **Create numeric styles.** Use tabular numerals for financial metrics, percentages, and table values. Align values consistently.
8. **Build a form state.** Include a label, hint, invalid state, and clear error message. Associate text with controls programmatically.
9. **Test font loading.** Register the actual font files, select a loading strategy, and inspect behavior on a throttled connection.
10. **Test responsive content.** Validate the layout at narrow, medium, and wide viewports, plus 200% browser zoom. Ensure text does not clip or overlap.
11. **Test long content.** Include a long project name, a large currency value, a negative percentage, a long translated button label, and a multi-line heading.
12. **Check interaction affordances.** Links must be distinguishable beyond color alone, and keyboard focus must remain visible with `:focus-visible`.
13. **Audit accessibility.** Review heading order, label associations, contrast, text resizing, focus, and screen-reader reading order.
14. **Inspect the browser.** Use DevTools to confirm computed font family, weight, line-height, font loading, container width, and wrapping behavior.
15. **Document the handoff.** Explain each type token, its intended use, and how a developer should introduce a new role without creating unnecessary exceptions.

### Failure condition

The challenge fails if the page clips text at 200% zoom, the font swap causes a disruptive layout shift, numeric columns visibly jitter, an error message is communicated only by color, a keyboard focus indicator is absent, or a translated label breaks the layout. It also fails if developers must guess which font role to use or if the marketing and dashboard experiences look unrelated because the system has no shared typographic logic.

### Definition of Done / Success Criteria

- [ ] Every repeated text role has a documented token with size, weight, line-height, and usage guidance.
- [ ] The type scale establishes a clear hierarchy without excessive one-off styles.
- [ ] Fluid heading sizes remain useful at intermediate widths and browser zoom.
- [ ] Body copy uses a tested measure and readable line-height.
- [ ] Numeric data uses stable alignment and tabular numerals where appropriate.
- [ ] Custom font loading has a fallback strategy and has been tested under a slow connection.
- [ ] Semantic headings, labels, landmarks, lists, and tables match the content structure.
- [ ] Links and keyboard focus remain visible without depending on color alone.
- [ ] Text does not clip or overlap under 200% zoom or realistic long content.
- [ ] A developer can use the documented tokens to build a new component without inventing a type style.
- [ ] Browser DevTools has been used to verify font files and computed typography.
- [ ] The system works for both the marketing page and dashboard while respecting their different reading contexts.

---

## Production Debugging Checklist

When typography looks wrong in production, use a repeatable sequence instead of applying random CSS overrides.

1. Reproduce the issue with the same browser, viewport, zoom, content, and theme.
2. Inspect computed `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `max-inline-size`, and overflow behavior in DevTools.
3. Confirm the intended font file loaded in the Network panel and check whether the requested weight exists.
4. Compare the fallback rendering with the final font rendering to identify layout shift or changed wrapping.
5. Check parent layout constraints, fixed heights, grid tracks, flex shrink behavior, and clipping before changing the type token.
6. Test a longer string and a narrower viewport to see whether the issue is a content constraint rather than a single glyph problem.
7. Verify browser zoom, keyboard focus, and semantic reading order after the fix.
8. Add a regression case to the component's test content or visual review checklist so the same failure is not reintroduced.

### Topic-specific gotchas

- **Gotcha:** A declared `font-weight: 600` does not guarantee a real semibold face is available; the browser may synthesize or substitute a weight.
- **Gotcha:** `clamp()` prevents extreme values only when the chosen minimum and maximum are appropriate; it does not automatically create good line breaks.
- **Gotcha:** A fallback font with different metrics can shift a heading even when the final custom font looks correct.
- **Gotcha:** `font-variant-numeric: tabular-nums` only helps if the selected font supports the feature and the data is laid out with suitable alignment.
- **Gotcha:** A fixed-height component may appear correct with short English copy but clip text after localization or zoom.
- **Gotcha:** `ch` is based on the width of the zero glyph, so it approximates measure rather than guaranteeing an exact number of characters.

### Browser support and tooling notes

Core CSS typography features such as relative font units, `clamp()`, `font-weight`, `line-height`, `font-variant-numeric`, and `:focus-visible` are supported in current evergreen browsers, but test the actual browser matrix for the product. Variable font support and individual font axes depend on the file and browser. Use DevTools computed styles and Network panels to diagnose loading and cascade problems; use an accessibility inspector to catch structural issues, then manually test zoom, keyboard navigation, long content, and assistive-technology reading order. Automated tools can flag some problems but cannot determine whether the typography communicates the right hierarchy or feels appropriate for the product.