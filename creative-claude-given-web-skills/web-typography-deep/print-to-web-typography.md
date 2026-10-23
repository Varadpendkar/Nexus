# Print-to-Web Typography

## Skill Metadata
- **Skill name:** `print-to-web-typography`
- **Layer:** `23-web-typography-deep`
- **Purpose:** Translate typographic knowledge from print design into responsive, accessible, browser-native interfaces without copying print constraints blindly.
- **Use when:** Adapting editorial layouts, books, magazines, reports, long-form articles, PDFs, campaign pages, and brand systems for the web.
- **Core principle:** Preserve typographic intent, not the physical limitations of the printed page.

---

## Why This Matters

Print and web typography share the same foundations—hierarchy, measure, rhythm, contrast, alignment, and consistency—but they operate under different constraints.

Print has a known physical surface. A designer can control page dimensions, paper, ink, and often the final type size. Web content is rendered across unknown viewport widths, zoom settings, operating systems, font availability, user preferences, and assistive technologies. A layout that looks elegant on a fixed page can become cramped, tiny, or brittle in a browser.

The task is not to reproduce a page pixel-for-pixel. It is to carry forward the editorial system: what should be read first, how ideas group together, how long passages remain comfortable, and how typography supports the content's tone.

A strong print-to-web conversion:
- Rebuilds hierarchy with semantic HTML, not only visual styling.
- Uses fluid measures and responsive type rather than fixed page dimensions.
- Preserves meaningful relationships between headings, paragraphs, captions, pull quotes, and notes.
- Adapts line length to the available reading space.
- Allows text to reflow at browser zoom and user-selected text sizes.
- Treats color, contrast, and font choice as accessibility decisions.
- Uses print-specific details only when they still serve the web context.
- Validates actual content, not just short placeholder copy.

## Core Concepts

### 1. Translate hierarchy into semantic structure

In print, hierarchy may be conveyed through size, weight, position, color, and whitespace. On the web, those signals should be backed by meaningful document structure.

Use headings in logical order, paragraphs for prose, lists for grouped items, `blockquote` for quotations, `figure` and `figcaption` for images with captions, and `cite` where appropriate for work titles or citations. Do not choose an HTML heading level only because its default size looks right.

```html
<article class="story">
  <header class="story__header">
    <p class="story__eyebrow">Field notes · Issue 08</p>
    <h1 class="story__title">The shape of a city</h1>
    <p class="story__dek">
      How street-level details reveal a city's larger patterns.
    </p>
    <p class="story__byline">By Maya Chen · 8 minute read</p>
  </header>

  <section aria-labelledby="street-patterns">
    <h2 id="street-patterns">Reading the street</h2>
    <p>Start with the visible details, then connect them to the wider system.</p>
  </section>
</article>
```

**Decision rule:** choose the element for its meaning first; style it to match the design system second.

### 2. Preserve editorial roles, not fixed point sizes

Print systems commonly specify type in points. CSS supports points, but screen interfaces usually work better with scalable CSS units and responsive relationships. A 12 pt print caption does not automatically map to a 12 px web caption.

Use `rem` for type sizes that should respond to the root font size, and `clamp()` when a type role should scale within reasonable bounds. Keep a clear hierarchy between title, deck, section headings, body, caption, metadata, and footnotes.

```css
:root {
  --type-caption: 0.8125rem;
  --type-body: 1rem;
  --type-deck: clamp(1.125rem, 1rem + 0.8vw, 1.375rem);
  --type-section: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem);
  --type-display: clamp(2.25rem, 1.4rem + 4vw, 4.75rem);
}

.story__title {
  font-size: var(--type-display);
  line-height: 1.05;
}

.story__dek {
  font-size: var(--type-deck);
  line-height: 1.45;
}

.story p {
  font-size: var(--type-body);
  line-height: 1.7;
}

.story figcaption,
.story .metadata {
  font-size: var(--type-caption);
  line-height: 1.5;
}
```

Do not use `vw` alone for important text. Pure viewport-based sizing can become too small on narrow screens or excessively large on wide displays.

### 3. Rebuild measure for a variable viewport

Print designers often use column width or character count to establish a comfortable measure. On the web, the reading measure must adapt to the viewport while staying bounded.

`ch` is a useful approximation for line length because it is based on the width of the “0” glyph in the active font. It is not a precise character-count guarantee, but it is practical for prose containers.

```css
.article-body {
  width: min(100% - 2rem, 68ch);
  margin-inline: auto;
}

.article-body p {
  max-width: 68ch;
}
```

The ideal measure depends on typeface, font size, language, and content. Start around 60–75 characters per line for many Latin-script reading contexts, then evaluate actual text. Do not apply the same measure blindly to every script or layout.

### 4. Use fluid layout instead of fixed page geometry

A print page has fixed dimensions; a browser viewport does not. Recreate editorial balance using grid, flexible tracks, and content constraints rather than hard-coded page coordinates.

```css
.editorial-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(2rem, 5vw, 5rem);
}

@media (min-width: 60rem) {
  .editorial-layout {
    grid-template-columns: minmax(0, 2fr) minmax(14rem, 1fr);
    align-items: start;
  }
}

.article-main,
.article-aside {
  min-width: 0;
}
```

A sidebar that works in a magazine spread may need to move below the article on a phone. Preserve the relationship between the content groups, not their original physical coordinates.

### 5. Establish rhythm with relative spacing

Print layouts often use baseline grids and measured vertical intervals. On the web, a consistent spacing scale provides rhythm without requiring every line to land on a fixed baseline.

```css
:root {
  --space-1: 0.375rem;
  --space-2: 0.75rem;
  --space-3: 1rem;
  --space-4: 1.5rem;
  --space-5: 2.25rem;
  --space-6: 3.5rem;
}

.story__header {
  margin-block-end: var(--space-6);
}

.story h2 {
  margin-block: var(--space-6) var(--space-3);
}

.story p + p {
  margin-block-start: var(--space-3);
}
```

Use a spacing scale as a starting system, but let content type determine exceptions. A caption, a long quotation, and a new chapter heading do not need identical spacing rules.

### 6. Adapt paragraph styling for screen reading

Print conventions such as first-line indents, justified text, and compact leading can work in some digital publications, but they should not be transferred automatically.

For web prose, left alignment (or the appropriate language direction) is usually a robust default. Justification can create uneven word spacing, especially in narrow columns or languages without suitable justification behavior. First-line indentation may be appropriate for continuous literary text, but paragraph spacing is often clearer for general web articles.

```css
.article-body {
  text-align: start;
  hyphens: auto;
  line-height: 1.7;
}

.article-body p {
  margin-block: 0 1.1em;
}

/* Optional literary treatment: use only when the content supports it. */
.article-body--novel p + p {
  margin-block-start: 0;
  text-indent: 1.25em;
}
```

`hyphens: auto` depends on correct language metadata and browser support. Inspect the output for the languages and browsers you support.

### 7. Preserve typographic emphasis without overdecorating

Print design may use small caps, drop caps, ornamental rules, running heads, or decorative initials. On the web, these features should be applied selectively and degrade gracefully.

```css
.story__eyebrow {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.story__dropcap::first-letter {
  float: left;
  font-size: 4.2em;
  line-height: 0.82;
  padding-inline-end: 0.08em;
  font-weight: 700;
}
```

Use letter spacing carefully: excessive tracking can impair word recognition, especially in body text. Uppercase text often benefits from modest tracking, but the value depends on the font and size. Do not use letter spacing as a substitute for selecting an appropriate typeface or weight.

### 8. Make captions, notes, and metadata genuinely readable

Small print annotations can become illegible on mobile screens. Captions and footnotes are secondary, not disposable. Keep them readable, with adequate contrast, spacing, and meaningful association to the content they describe.

```html
<figure>
  <img src="/images/urban-crossing.jpg" alt="Pedestrians crossing a wide city street">
  <figcaption>
    The crossing connects the station entrance to the market district.
  </figcaption>
</figure>
```

```css
figcaption,
.article-meta,
.footnote {
  font-size: max(0.8125rem, 0.9em);
  line-height: 1.5;
  color: var(--text-muted);
}
```

Ensure `--text-muted` still meets contrast requirements for the text size and background. Do not shrink text simply to make a complex page fit.

### 9. Choose font loading and fallback deliberately

A print artifact may assume that its selected typeface is present. A website must account for loading failures, slow networks, and font rendering differences.

```css
@font-face {
  font-family: "Editorial Serif";
  src: url("/fonts/editorial-serif.woff2") format("woff2");
  font-style: normal;
  font-weight: 400 700;
  font-display: swap;
}

.story {
  font-family: "Editorial Serif", Georgia, "Times New Roman", serif;
}
```

Use the correct `font-weight` range only if the font file is a variable font supporting that range. Otherwise declare each available file and weight accurately. Choose fallbacks with compatible proportions to reduce layout shifts. Consider font subsetting for performance, but ensure the subset covers the scripts and glyphs your content needs.

### 10. Account for font metrics and layout shifts

A replacement font can have different x-height, width, and vertical metrics, changing line breaks and page height. This is especially visible in large headlines and article pages.

```css
@font-face {
  font-family: "Editorial Fallback";
  src: local("Georgia");
  size-adjust: 98%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

.story {
  font-family: "Editorial Serif", "Editorial Fallback", Georgia, serif;
}
```

Metric overrides can reduce visual shifts but require testing. Values are examples, not universal presets. Verify support in target browsers and compare the actual fallback to the webfont. Do not optimize only one headline if it harms the rest of the page.

### 11. Respect zoom, text resizing, and reflow

A fixed print canvas may rely on absolute measurements. Web typography should remain usable when people zoom, increase default font sizes, or use a narrow viewport.

Avoid fixed heights around text and avoid clipping text to preserve a composition. Use flexible containers, relative units, and wrapping. Test at 200% zoom and at narrow widths; check that controls, headings, captions, and footnotes remain available.

```css
.story-card {
  min-height: 0;
  padding: clamp(1rem, 3vw, 2rem);
}

.story-card__title {
  overflow-wrap: anywhere;
  line-height: 1.15;
}
```

`overflow-wrap: anywhere` is useful for genuinely long unbreakable strings, but applying it indiscriminately can create awkward line breaks. Test URLs, product names, and identifiers separately.

### 12. Handle color and contrast as part of type design

Paper and ink characteristics do not translate directly to backlit displays. Subtle gray text or thin reversed type may reproduce poorly on screens, especially at small sizes.

Use sufficient contrast, avoid relying on color alone to communicate hierarchy, and test text over images or gradients at the exact positions where it appears. A font weight that looks crisp in print may appear weak at small screen sizes.

```css
:root {
  --text-primary: #202124;
  --text-secondary: #4b5057;
  --surface: #ffffff;
}

.article-body {
  color: var(--text-primary);
  background: var(--surface);
}

.article-meta {
  color: var(--text-secondary);
}
```

These colors are illustrative; check contrast for the actual font size, weight, and background.

### 13. Reconsider print-only conventions

Some print patterns have no direct web equivalent:
- Running headers and page numbers may become sticky navigation, section markers, or be omitted.
- Widow and orphan control is less predictable in reflowing content.
- Page-bound pull quotes may become inline callouts or disappear on small screens.
- Footnotes may become expandable notes or normal endnotes, but must remain discoverable and operable.
- Full-bleed images must account for viewport gutters and safe spacing.
- Multi-column print text should usually become a single reading flow on narrow screens.

Do not add a web interaction simply because a printed element existed. First identify what purpose the element served.

### 14. Test with real content and real constraints

Typography decisions cannot be validated using only a short headline and two placeholder paragraphs. Test long titles, short titles, multiple paragraph lengths, long words, captions, lists, quotations, footnotes, and translated content.

A practical test matrix includes:
- Narrow phone viewport and wide desktop viewport.
- Browser zoom at 200%.
- Increased default font size.
- Slow font loading and fallback rendering.
- Empty, long, and unusual metadata.
- Keyboard navigation and screen-reader semantics.
- Light and dark surfaces where both are supported.
- Languages and scripts the product actually serves.

## Advanced Patterns

### Pattern 1: Fluid editorial type scale

Create a bounded scale that respects the user's base font size while adding responsive movement.

```css
:root {
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: clamp(1.125rem, 1.02rem + 0.45vw, 1.375rem);
  --heading-md: clamp(1.5rem, 1.2rem + 1.2vw, 2.125rem);
  --heading-xl: clamp(2.25rem, 1.25rem + 3.8vw, 4.5rem);
}

h1 {
  font-size: var(--heading-xl);
}

h2 {
  font-size: var(--heading-md);
}

.article-body {
  font-size: var(--text-base);
}
```

**Why it works:** the minimum and maximum bounds prevent uncontrolled scaling. The values are a starting point; verify them with the chosen font and actual content.

### Pattern 2: Content-first reading column

```css
.reading-column {
  width: min(100% - 2rem, 70ch);
  margin-inline: auto;
}

.reading-column > * {
  min-width: 0;
}

.reading-column img,
.reading-column video {
  max-width: 100%;
  height: auto;
}
```

**Use when:** an editorial page needs a stable measure without fixed pixel widths. Adjust the measure for the font, language, and reading context.

### Pattern 3: Responsive sidebar that preserves reading order

```css
.article-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.5rem;
}

@media (min-width: 64rem) {
  .article-grid {
    grid-template-columns: minmax(0, 42rem) minmax(15rem, 20rem);
    justify-content: center;
    align-items: start;
  }
}
```

Keep the DOM order meaningful. Do not use CSS placement to make visual reading order conflict with keyboard or screen-reader order.

### Pattern 4: Web-safe drop cap

```css
.article-intro::first-letter {
  float: left;
  font-size: 3.8em;
  line-height: 0.85;
  margin-inline-end: 0.08em;
  font-weight: 700;
}

@media (max-width: 30rem) {
  .article-intro::first-letter {
    font-size: 3em;
  }
}
```

Use only when the first paragraph is long enough and the initial does not disrupt reading. Test different fonts, scripts, and zoom settings.

### Pattern 5: Footnotes that work on screen

```html
<p>
  This finding was reported in the original study.
  <sup><a href="#note-1" id="note-ref-1">1</a></sup>
</p>

<aside class="footnotes" aria-label="Footnotes">
  <ol>
    <li id="note-1">
      Full reference details for the original study.
      <a href="#note-ref-1" aria-label="Back to footnote reference 1">↩</a>
    </li>
  </ol>
</aside>
```

Use real links so references work with keyboard, assistive technology, and copied URLs. Ensure return links have understandable accessible names.

### Pattern 6: Print stylesheet for a web article

A print stylesheet should adapt the web document to paper rather than trying to print the screen layout unchanged.

```css
@media print {
  body {
    color: #000;
    background: #fff;
    font-size: 11pt;
  }

  .site-nav,
  .cookie-banner,
  .interactive-controls {
    display: none !important;
  }

  .article-body {
    width: auto;
    max-width: none;
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: underline;
  }

  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.85em;
    overflow-wrap: anywhere;
  }

  figure,
  blockquote,
  h2,
  h3 {
    break-inside: avoid;
  }
}
```

Avoid blindly printing every URL: long tracking URLs can clutter the page. Add URL expansion only where it improves the printed document. Check page breaks with actual content and browser print previews.

### Pattern 7: Responsive pull quote

```html
<figure class="pull-quote">
  <blockquote>
    <p>Good editorial design makes complex ideas easier to follow.</p>
  </blockquote>
  <figcaption>— Editorial principle</figcaption>
</figure>
```

```css
.pull-quote {
  margin-block: 2.5rem;
  padding-inline-start: 1.25rem;
  border-inline-start: 0.25rem solid currentColor;
  font-size: clamp(1.25rem, 1rem + 1.1vw, 1.875rem);
  line-height: 1.35;
}

@media (min-width: 60rem) {
  .pull-quote {
    max-width: 24ch;
    margin-inline-start: -3rem;
  }
}
```

The quotation should not duplicate large amounts of body text without purpose. On narrow screens, keep it in the normal flow and avoid overlap with surrounding paragraphs.

## Common Mistakes

1. **Copying point sizes directly into pixels.** A print point size and a CSS pixel size do not represent the same design context. Rebuild a scale based on screen reading.
2. **Recreating a fixed page with absolute positioning.** Content length, viewport width, zoom, and font loading vary. Use flow layout, grid, and flexible constraints.
3. **Using visual headings without semantic headings.** A large paragraph styled like a title does not create an accessible document outline.
4. **Setting body text too small to preserve a magazine-like density.** Screen reading requires comfortable text and reflow; do not shrink prose to fit a fixed composition.
5. **Using `vw` alone for font size.** The text can become too small on phones and too large on wide screens. Use bounded `clamp()` values.
6. **Overusing justified alignment.** Word spacing can become uneven, especially in narrow columns. Evaluate actual languages and browser output.
7. **Keeping desktop columns on mobile.** A two-column print spread may need to collapse to one flow. Preserve meaning and order, not page geometry.
8. **Making captions and footnotes tiny or low-contrast.** Secondary text still needs to be readable and perceivable.
9. **Applying tracking to body copy.** Excessive letter spacing can slow recognition and damage word shapes.
10. **Ignoring font fallback metrics.** A fallback can change line breaks, page height, and headline wrapping before the webfont loads.
11. **Clipping text to match the source design.** Fixed heights and hidden overflow can hide content at zoom or when text is translated.
12. **Treating a print-only feature as mandatory online.** Running heads, drop caps, and pull quotes should be retained only when they serve the web reading experience.
13. **Testing with placeholder content only.** Long headlines, footnotes, URLs, and translated strings reveal issues that short samples hide.
14. **Forgetting print output from a web page.** If users need to print or save an article, provide a deliberate print stylesheet and test page breaks.

## Mental Models

- **Transfer the hierarchy, not the coordinates.** A printed spread is a composition; a web page is a reflowing document.
- **Typography is behavior, not decoration.** It affects comprehension, scanning, focus, and accessibility.
- **Content is the stress test.** Real titles, translations, captions, and notes expose layout weaknesses.
- **Measure is a constraint, not a fixed width.** Let the reading column expand within a comfortable bound.
- **The browser is an environment, not a canvas.** Zoom, font loading, user styles, and assistive technology are part of the design context.
- **Semantics carry structure across presentations.** The same HTML can support a responsive screen layout, a reader mode, and a print stylesheet.
- **Print is another output mode.** A good web article can be adapted for paper without forcing the on-screen composition onto a page.

## Quick Reference

| Goal | Recommended approach | Watch out for |
|---|---|---|
| Preserve title hierarchy | Semantic `h1`/`h2` structure plus a responsive type scale | Choosing heading tags by default appearance |
| Set a reading measure | `width: min(100% - 2rem, 65–75ch)` as a starting point | Assuming `ch` equals an exact character count |
| Scale headings fluidly | `clamp(min, preferred, max)` | Pure `vw` sizing |
| Maintain vertical rhythm | Reusable spacing tokens with content-specific exceptions | Forcing every block onto a rigid baseline grid |
| Adapt columns | Grid with a single-column narrow-screen layout | Visual order that conflicts with DOM order |
| Keep footnotes usable | Semantic links and return references | Non-interactive superscript markers |
| Improve print output | `@media print` rules for navigation, measure, colors, and breaks | Printing the screen layout unchanged |
| Avoid layout shift | Compatible fallback fonts and tested metric overrides | Copying metric overrides without measuring |
| Support user zoom | Relative units, flexible heights, natural wrapping | Fixed heights and clipped text |
| Validate accessibility | Contrast, semantics, zoom, keyboard, and real content checks | Treating visual similarity as proof of usability |

## Build Challenge: Convert a Print Feature into a Web Article

### Scenario

You are given a print magazine feature with:
- A large display headline and deck.
- A byline and issue label.
- A narrow two-column body.
- A pull quote that overlaps the page gutter.
- Small captions and footnotes.
- A full-bleed lead image.
- Running headers and page numbers.

Build a responsive article that retains the editorial character while working on phones, tablets, desktop screens, and printed output.

### Requirements

1. Use semantic HTML for the article, header, sections, figures, captions, quotations, and footnotes.
2. Create a fluid title scale using `clamp()` with sensible minimum and maximum sizes.
3. Constrain prose to a comfortable reading measure; do not use a fixed page width.
4. Collapse the body into a single reading flow at narrow widths.
5. Keep captions and footnotes readable and sufficiently contrasted.
6. Ensure the pull quote remains in normal reading order on mobile.
7. Avoid fixed heights and clipped text.
8. Add a print stylesheet that hides unnecessary interface elements and improves page breaks.
9. Verify the page with long headlines, long URLs, missing metadata, and translated content.
10. Test zoom at 200%, keyboard navigation, and a narrow viewport.

### Suggested implementation sequence

1. Write the semantic document structure before styling.
2. Define typography roles and spacing tokens.
3. Set a bounded reading column and fluid title sizes.
4. Add the desktop editorial grid only after the narrow layout works.
5. Introduce decorative print-inspired features one at a time.
6. Add print rules and check the browser's print preview.
7. Test realistic content and document any exceptions.

### Failure scenarios to test

- A headline becomes three times longer after translation.
- The custom font fails to load.
- A footnote is referenced but its target is missing.
- The user zooms to 200%.
- The article is printed with a long URL.
- The pull quote becomes taller than the available sidebar.
- A caption wraps onto several lines on a narrow phone.
- The browser uses a fallback font with wider glyphs.

### Definition of done

The result is successful when the editorial hierarchy is recognizable, the article reads naturally at narrow and wide widths, no text is clipped, references are operable, contrast is adequate, and print output is deliberate rather than accidental.

## Final Checklist

- [ ] Semantic document structure matches the content hierarchy.
- [ ] Type roles are responsive and bounded.
- [ ] Reading measure is comfortable and tested with the selected font.
- [ ] Paragraph alignment and spacing support the intended reading mode.
- [ ] Captions, metadata, quotations, and footnotes remain readable.
- [ ] Font loading and fallback behavior have been tested.
- [ ] Zoom, text resizing, and reflow do not hide content.
- [ ] Print-specific details have been adapted or intentionally removed.
- [ ] Print stylesheet has been checked in browser print preview.
- [ ] Realistic and translated content has been tested.
