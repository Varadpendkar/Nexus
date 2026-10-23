# SKILL: opentype-features
**Layer:** 23 — Web Typography Deep  
**Goal:** Use OpenType font capabilities deliberately to improve readability, hierarchy, and typographic character without breaking shaping, layout, or accessibility.

---

## Why This Matters (Senior Perspective)

OpenType features are easy to misuse because many are invisible until a particular font, script, or string activates them. Enabling every feature globally can introduce unwanted ligatures in code, change numeral widths in financial tables, alter small-cap proportions, or produce inconsistent results when a fallback font lacks the requested glyphs. In production interfaces, those failures show up as shifted prices, misaligned dashboards, confusing identifiers, or a brand headline that changes shape between browsers. A senior developer chooses features by purpose, checks the actual font files and glyph coverage, and verifies both intended and fallback rendering.

The goal is not to make text look ornate. It is to use the font’s designed capabilities where they improve a real task: tabular figures for aligned numeric columns, oldstyle figures for running prose, discretionary ligatures for a controlled editorial moment, or stylistic sets for a brand-specific headline. CSS requests a feature; it does not create glyphs that are absent from the loaded font. Always test the real webfont, fallback fonts, language shaping, zoom, and browser support before shipping.

A robust typographic system also distinguishes design intent from implementation mechanism. “Make the values easy to compare” is a product requirement; `font-variant-numeric: tabular-nums` is one implementation choice. “Use a distinctive alternate `a` in this hero title” is a design decision; a font-specific stylistic set may implement it. Keeping those layers separate makes the system easier to review, maintain, and adapt when the font family changes.

OpenType settings belong in the same review process as spacing tokens, color tokens, and component APIs. They can change glyph shapes, text width, line breaks, and reading clarity. A feature is production-ready only when the team can explain what it changes, where it applies, how it degrades, and how regressions will be detected.

---

## Core Concepts


### 1. OpenType features are font capabilities, not visual filters

**Mental model:** OpenType is a font technology that can store alternate glyphs, ligatures, numeral styles, language-specific substitutions, and positioning behavior. CSS does not manufacture these glyphs. It asks the active font to use capabilities that the font designer encoded. If the selected font does not contain a requested alternate, the result may look unchanged even though the declaration is valid. A fallback font can also render only part of a line, so a single word may mix shapes from different fonts.

Before adding a feature, identify the design goal in plain language: align prices, make a short editorial label feel more refined, or preserve readable identifiers. Then identify the relevant feature and verify the loaded font. This prevents ornamental CSS from being mistaken for a guaranteed design outcome. A reliable specimen includes ordinary words, punctuation, uppercase and lowercase letters, numerals, and the exact strings that appear in production.

**Before / after:** Before: a developer adds every known feature globally because “more typography features” sounds premium. After: the team records a visible purpose, scopes the feature to a component, tests the intended font, and confirms the default remains acceptable when the feature is unavailable.

**Production implementation:**

```css
.type-concept-1 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-1 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-1" aria-labelledby="concept-1-title">
  <h3 id="concept-1-title">OpenType features are font capabilities, not visual filters</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 2. Prefer high-level font-variant properties

**Mental model:** CSS provides high-level properties for common typographic choices, including numeric styles, ligatures, caps, and East Asian variants. These declarations express intent more clearly than a list of low-level OpenType tags. Prefer `font-variant-numeric: tabular-nums` when digit alignment is the goal, or `font-variant-ligatures` when the goal is to control ligature classes. This makes the code easier to audit and reduces the risk of requesting unrelated features.

Use `font-feature-settings` when a specific feature tag is needed and no suitable high-level property expresses the intent. Low-level settings are powerful but less self-documenting. They should be accompanied by a comment naming the tag and explaining the expected glyph change. Do not mix multiple layers of controls without testing precedence; high-level properties and low-level settings can interact in ways that make a design-system rule difficult to reason about.

**Before / after:** Before: `font-feature-settings: "tnum" 1, "onum" 1, "liga" 0` is copied into every paragraph. After: the price column uses `font-variant-numeric: tabular-nums`, article prose uses the intended numeral style, and only a documented special case uses a raw feature tag.

**Production implementation:**

```css
.type-concept-2 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-2 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-2" aria-labelledby="concept-2-title">
  <h3 id="concept-2-title">Prefer high-level font-variant properties</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 3. Standard, contextual, and discretionary ligatures

**Mental model:** Ligatures combine character sequences into designed glyphs. Standard and contextual ligatures are often part of ordinary text shaping and may improve rhythm. Discretionary ligatures are more decorative and can make words look unusual. Historical ligatures are relevant only in fonts and editorial contexts that support them. A ligature can be attractive in a headline but harmful in code, identifiers, search terms, or strings users must compare character by character.

Do not disable shaping broadly to fix a single glyph substitution. Preserve standard behavior unless there is a clear reason to change it, and scope discretionary behavior to a display component. Test letter pairs such as `fi`, `fl`, `ffi`, punctuation, and any programming operators present in your UI. The visual result depends on the font, size, weight, and browser, so a screenshot of one face is not a reliable universal test.

**Before / after:** Before: an all-page rule disables all ligatures, changing the texture of article text to solve an identifier issue. After: article shaping stays natural while a code sample or account identifier receives a narrow, documented ligature policy.

**Production implementation:**

```css
.type-concept-3 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-3 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-3" aria-labelledby="concept-3-title">
  <h3 id="concept-3-title">Standard, contextual, and discretionary ligatures</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 4. Tabular and proportional numerals

**Mental model:** Tabular numerals use consistent advance widths, making columns of digits easier to compare vertically. Proportional numerals use widths designed for natural text rhythm. A price table, financial dashboard, timer, or score comparison often benefits from tabular figures. An editorial paragraph usually does not need them. A font must actually provide the desired numeral design for the difference to be visible.

Apply tabular figures to the numeric value, not necessarily the entire row. Labels and units can remain proportional. Test decimal separators, currency symbols, minus signs, percentages, and mixed-length values. Tabular digits do not automatically align decimal points when the column contains arbitrary text; layout and formatting still matter. For structured financial data, combine tabular figures with a consistent numeric format and right alignment or a suitable grid column.

**Before / after:** Before: `₹9,500`, `₹12,400`, and `₹1,250` look ragged because each digit has a different advance width. After: the numeric column uses tabular figures and a consistent format, while explanatory prose retains the font’s natural proportions.

**Production implementation:**

```css
.type-concept-4 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-4 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-4" aria-labelledby="concept-4-title">
  <h3 id="concept-4-title">Tabular and proportional numerals</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 5. Lining and oldstyle numeral choices

**Mental model:** Lining numerals are designed to align near the cap height and are commonly appropriate for tables, labels, and UI data. Oldstyle numerals have ascenders and descenders that can blend into lowercase text, which may suit book-like or editorial prose. These are design choices, not a universal rule. A typeface may offer one style, both styles, or different behavior across weights.

Use the semantic context to choose a style. In a compact dashboard, lining figures are usually more predictable. In an article paragraph, oldstyle figures can create a quieter typographic texture if the typeface supports them. Never assume the feature is present just because CSS accepts the value. Compare a realistic sentence containing dates, percentages, and punctuation, and verify that headings, captions, and data cells follow a deliberate policy rather than inheriting an accidental global setting.

**Before / after:** Before: every numeral on the site is forced into oldstyle form, including chart labels and invoice totals. After: editorial prose and UI data have separate, documented numeral rules that support their different reading tasks.

**Production implementation:**

```css
.type-concept-5 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-5 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-5" aria-labelledby="concept-5-title">
  <h3 id="concept-5-title">Lining and oldstyle numeral choices</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 6. Small caps and designed glyphs

**Mental model:** True small caps are glyphs designed to sit at lowercase height while retaining appropriate stroke weight and proportions. Manually shrinking uppercase text often creates thin, undersized letters with poor spacing. Use `font-variant-caps: small-caps` when the selected font supports it, then inspect the rendered specimen. Some fonts synthesize small caps when real glyphs are unavailable; the result can be less refined, so test the actual webfont and fallback.

Small caps work well for short editorial metadata, section labels, and compact bylines. They are usually a poor choice for long paragraphs or critical instructions because the all-capital texture slows word recognition for many readers. Use normal letter spacing and case transformations deliberately. Do not put essential meaning solely in a typographic treatment; the text must remain understandable if the font substitutes ordinary glyphs.

**Before / after:** Before: `font-size: .72em; text-transform: uppercase` is used to imitate small caps, making the label look weak. After: real small caps are requested, tested in the loaded font, and kept to short labels where the treatment supports hierarchy.

**Production implementation:**

```css
.type-concept-6 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-6 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-6" aria-labelledby="concept-6-title">
  <h3 id="concept-6-title">Small caps and designed glyphs</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 7. Stylistic sets and character variants

**Mental model:** Fonts may expose stylistic sets such as `ss01` or character variants such as `cv02`. These tags are font-specific: the same tag does not guarantee the same visible alternate in two different families. One set might change a lowercase `a`, another might alter a numeral or punctuation mark. Read the font documentation when available and build a specimen that makes the difference visible.

Use a stylistic set only when the alternate has a defined design purpose, such as matching a brand’s visual voice in a hero headline. Keep it out of long-form body text unless the effect is intentional and tested. Because the CSS tag itself is opaque to most maintainers, document the expected result in a comment or design-system note. Verify every weight and style used in production; an alternate may not be present in all font files.

**Before / after:** Before: `"ss01" 1` is applied to all text without anyone knowing what it changes. After: the setting is limited to a named display component, the expected glyph change is documented, and the font update process includes a visual regression check.

**Production implementation:**

```css
.type-concept-7 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-7 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-7" aria-labelledby="concept-7-title">
  <h3 id="concept-7-title">Stylistic sets and character variants</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 8. Kerning, tracking, and feature interactions

**Mental model:** Kerning adjusts the space between particular glyph pairs; tracking adds general spacing across a run of text. They are not interchangeable. The font’s kerning tables may already handle pairs well, and manual letter spacing can visually weaken those relationships. Feature controls can also change glyph shapes and widths, so kerning should be reviewed after changing a stylistic set or numeral design.

Use the browser’s normal kerning behavior unless a measured design requirement says otherwise. For display typography, test pairs such as `AV`, `To`, `Ta`, `Wa`, and punctuation around capitals. For small labels, a little tracking can be useful, but do not treat letter spacing as a universal fix for a font that is too wide or too narrow. Confirm the result at the actual rendered size, not only in a zoomed design canvas.

**Before / after:** Before: negative tracking is added to every heading to make it feel tighter, causing letters to collide in some weights. After: the chosen font’s natural kerning is preserved, and only a specific display style receives a tested tracking token.

**Production implementation:**

```css
.type-concept-8 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-8 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-8" aria-labelledby="concept-8-title">
  <h3 id="concept-8-title">Kerning, tracking, and feature interactions</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 9. Complex scripts and language-aware shaping

**Mental model:** Complex-script shaping can involve contextual forms, mark positioning, ligatures, and language-specific substitutions. Arabic, Indic scripts, and other writing systems rely on shaping engines to position and compose glyphs correctly. Do not globally disable features such as contextual alternates or required ligatures to fix a Latin typography issue. Such a rule can break text in languages the developer did not test.

Set the correct `lang` metadata, use a font with suitable script coverage, and test real words rather than isolated code points. A fallback may be used for only one glyph in a line, so inspect mixed-font results carefully. Feature policies for Latin editorial display text should be scoped to that component. Multilingual body text should generally retain browser shaping defaults unless there is a verified language-specific requirement.

**Before / after:** Before: a global low-level feature declaration suppresses shaping behavior and Arabic letter forms appear disconnected or incorrectly positioned. After: the override is removed from multilingual text, language metadata is correct, and the special Latin treatment is scoped to a dedicated component.

**Production implementation:**

```css
.type-concept-9 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-9 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-9" aria-labelledby="concept-9-title">
  <h3 id="concept-9-title">Complex scripts and language-aware shaping</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 10. Variable font axes and optical size

**Mental model:** Variable fonts may expose axes such as weight (`wght`), width (`wdth`), slant (`slnt`), and optical size (`opsz`). These axes are not OpenType feature tags; they describe continuous design variation. Optical sizing can adapt details such as spacing and stroke contrast to the rendered size. The appearance of a stylistic feature may also differ across axes and weights, so one specimen is not enough.

Prefer `font-weight` and `font-stretch` when they express the intended axis. Use `font-variation-settings` for specific axes that need explicit control, and document the values. Avoid setting an axis globally without testing headings, paragraphs, and small labels. Some fonts provide optical sizing automatically, while others need explicit configuration. Test at real CSS sizes and check the browser’s computed styles to verify the intended font file and axis behavior.

**Before / after:** Before: a design system hardcodes an extreme width axis across the entire site to make one hero fit. After: the hero gets a component-level display style, the rest of the interface uses the font’s natural width, and responsive wrapping is solved with layout rather than distorted glyphs.

**Production implementation:**

```css
.type-concept-10 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-10 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-10" aria-labelledby="concept-10-title">
  <h3 id="concept-10-title">Variable font axes and optical size</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 11. Fallback fonts and glyph coverage

**Mental model:** A declared font stack is a preference list, not proof that every character comes from the first family. If a font lacks a glyph or a requested alternate, the browser can use a fallback for part of the string. The fallback may have different metrics, numeral styles, or glyph design. This can cause a single line to look inconsistent or a component to shift after a font loads.

Test with the preferred webfont blocked, and inspect the rendered font in browser developer tools. Choose fallback families with compatible metrics and appropriate language coverage. Do not depend on a decorative feature for essential meaning or alignment. If a fallback cannot provide the same feature, the default text should still be readable and the layout should remain usable. Font loading is a runtime condition, so fallback is part of production design, not merely a development convenience.

**Before / after:** Before: a screenshot passes because the developer’s local machine has the font installed, but production users see fallback glyphs. After: the webfont is loaded explicitly, fallback behavior is tested, and the design remains stable when the custom face is unavailable.

**Production implementation:**

```css
.type-concept-11 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-11 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-11" aria-labelledby="concept-11-title">
  <h3 id="concept-11-title">Fallback fonts and glyph coverage</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


### 12. Scoping features by component and content

**Mental model:** Feature settings should follow the reading task. An editorial headline, article body, metric card, price table, code block, and user-entered name do not have identical needs. A global rule creates accidental coupling: changing one typographic decision can alter unrelated content. Component-scoped classes and design tokens make the behavior discoverable and reviewable.

Treat feature settings as part of the component API. Name the purpose rather than the mechanism where possible, such as `.price-value` or `.editorial-kicker`. Keep user-generated text conservative because users may enter identifiers, source code, URLs, and mixed-language content. Add tests for representative strings and a fallback font. When a new feature is proposed, require a short rationale: what visual behavior changes, where it applies, what happens when unsupported, and how the team will detect regressions.

**Before / after:** Before: a global `body` declaration changes prices, article text, code snippets, and account names at once. After: the price component owns tabular numerals, the headline owns a documented alternate, and code/user input retain predictable character shapes.

**Production implementation:**

```css
.type-concept-12 {
  font-family: "Editorial Sans", "Noto Sans", Arial, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  font-variant-numeric: proportional-nums;
  max-width: 68ch;
}

/* Keep this rule scoped to the relevant content role. */
.type-concept-12 .numeric-value {
  font-variant-numeric: lining-nums tabular-nums;
}
```

```html
<section class="type-concept-12" aria-labelledby="concept-12-title">
  <h3 id="concept-12-title">Scoping features by component and content</h3>
  <p>Representative string: Office / affinity / AV / To / 2026 / 1,248.50 / AB-2048-IF.</p>
  <p class="numeric-value">₹12,400.00</p>
</section>
```

**Gotcha:** A computed CSS value proves only that the declaration was parsed. It does not prove that the font contains the feature, that the browser used the expected font, or that the visual outcome is appropriate for the content. Inspect the rendered font and compare the same specimen with the feature enabled and disabled.


**Review note:** Keep a before-and-after screenshot at the actual component size, include a fallback-font pass, and test the longest real string. Avoid judging a feature only from a large isolated glyph; typography is a system of relationships among words, lines, surrounding UI, and the user’s task.


---

## Advanced Patterns / Integration Patterns


### Pattern 1: Tabular figures in a comparison table

**What it does:** Use when users compare prices, percentages, scores, or measurements across rows. The feature improves scanning because each digit occupies a consistent advance width; it does not replace numeric formatting or column alignment.

**CSS implementation:**

```css
.price-value {
  font-variant-numeric: lining-nums tabular-nums;
  text-align: end;
  white-space: nowrap;
}
```

**Semantic markup:**

```html
<table class="plan-comparison">
  <caption>Monthly plan prices</caption>
  <thead><tr><th scope="col">Plan</th><th scope="col">Price</th></tr></thead>
  <tbody>
    <tr><th scope="row">Starter</th><td class="price-value">₹1,250.00</td></tr>
    <tr><th scope="row">Growth</th><td class="price-value">₹9,500.00</td></tr>
    <tr><th scope="row">Scale</th><td class="price-value">₹12,400.00</td></tr>
  </tbody>
</table>
```

**Integration note:** Keep this behavior local to the component that owns the reading task. Confirm the font has the intended glyphs, verify the fallback, and check the component at its smallest supported size. A feature that looks refined in a hero may reduce clarity in a compact label.

**Failure test:** Temporarily remove the preferred font from the font stack. If the content becomes confusing or the layout breaks, treat that as a defect rather than an acceptable cosmetic difference.


### Pattern 2: Oldstyle figures in editorial prose

**What it does:** Use only when the selected typeface has an oldstyle numeral design and the text is intended to read like a book or magazine. Do not use this policy for financial columns, chart axes, or dense dashboard values.

**CSS implementation:**

```css
.article-copy {
  font-family: "Source Serif 4", Georgia, serif;
  font-variant-numeric: oldstyle-nums proportional-nums;
  font-size: 1.125rem;
  line-height: 1.75;
  max-width: 68ch;
}
```

**Semantic markup:**

```html
<article class="case-study">
  <h1>Notes from the 2026 field study</h1>
  <p class="article-copy">In 2024, the studio began documenting small changes in everyday reading. By 2026, the archive contained 148 interviews and several thousand observations.</p>
</article>
```

**Integration note:** Keep this behavior local to the component that owns the reading task. Confirm the font has the intended glyphs, verify the fallback, and check the component at its smallest supported size. A feature that looks refined in a hero may reduce clarity in a compact label.

**Failure test:** Temporarily remove the preferred font from the font stack. If the content becomes confusing or the layout breaks, treat that as a defect rather than an acceptable cosmetic difference.


### Pattern 3: Scoped stylistic set for a display headline

**What it does:** Use when font documentation identifies a useful alternate and the change has been approved as part of the visual system. A tag like `ss01` is font-specific, so test the exact family, weight, and browser.

**CSS implementation:**

```css
.brand-headline {
  font-family: "Editorial Display", Georgia, serif;
  font-weight: 650;
  font-feature-settings: "ss01" 1;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

/* The alternate is intentionally limited to this display role. */
```

**Semantic markup:**

```html
<header class="project-hero">
  <p class="eyebrow">Selected work / 2026</p>
  <h1 class="brand-headline">A different way to see the familiar.</h1>
</header>
```

**Integration note:** Keep this behavior local to the component that owns the reading task. Confirm the font has the intended glyphs, verify the fallback, and check the component at its smallest supported size. A feature that looks refined in a hero may reduce clarity in a compact label.

**Failure test:** Temporarily remove the preferred font from the font stack. If the content becomes confusing or the layout breaks, treat that as a defect rather than an acceptable cosmetic difference.


### Pattern 4: Predictable identifiers and code

**What it does:** Use for code, account IDs, URLs, and user-entered identifiers where a decorative ligature can make characters harder to distinguish. Keep standard shaping where it is useful; disable only the relevant discretionary feature.

**CSS implementation:**

```css
.identifier,
.code-sample,
.user-entered-name {
  font-variant-ligatures: common-ligatures;
  font-feature-settings: "dlig" 0;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
```

**Semantic markup:**

```html
<p>Reference: <code class="identifier">office_file_ffi_2048</code></p>
<label for="account-code">Account code</label>
<input id="account-code" name="account-code" autocomplete="off" value="AB-2048-IF" />
```

**Integration note:** Keep this behavior local to the component that owns the reading task. Confirm the font has the intended glyphs, verify the fallback, and check the component at its smallest supported size. A feature that looks refined in a hero may reduce clarity in a compact label.

**Failure test:** Temporarily remove the preferred font from the font stack. If the content becomes confusing or the layout breaks, treat that as a defect rather than an acceptable cosmetic difference.


### Pattern 5: Designed small caps for metadata

**What it does:** Use for short labels such as a byline role, section marker, or compact editorial metadata. Confirm that the font has real small-cap glyphs and that the treatment remains legible at the chosen size.

**CSS implementation:**

```css
.article-kicker {
  font-variant-caps: small-caps;
  font-size: 0.875rem;
  letter-spacing: 0.06em;
  font-weight: 600;
  line-height: 1.3;
}
```

**Semantic markup:**

```html
<article>
  <p class="article-kicker">Research / Field Notes</p>
  <h2>How the collection was assembled</h2>
  <p>The project combines interviews, archival notes, and observations.</p>
</article>
```

**Integration note:** Keep this behavior local to the component that owns the reading task. Confirm the font has the intended glyphs, verify the fallback, and check the component at its smallest supported size. A feature that looks refined in a hero may reduce clarity in a compact label.

**Failure test:** Temporarily remove the preferred font from the font stack. If the content becomes confusing or the layout breaks, treat that as a defect rather than an acceptable cosmetic difference.


### Pattern 6: Feature specimen and fallback check

**What it does:** Use before shipping a custom font or changing typography tokens. A specimen makes the effect visible and makes regression checks repeatable. It should include punctuation, mixed case, numbers, and strings used in the product.

**CSS implementation:**

```css
.type-specimen {
  font-family: "Editorial Sans", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  max-width: 72ch;
}

.type-specimen code {
  font-variant-ligatures: none;
}
```

**Semantic markup:**

```html
<section class="type-specimen" aria-labelledby="specimen-title">
  <h2 id="specimen-title">Feature specimen</h2>
  <p>Affiliation: Office &amp; field — 2026, 1,248.50, 98.6%</p>
  <p>Pairs: AV / To / Ta / Wa / fi / fl / ffi</p>
  <code>const invoiceId = "AB-2048-IF";</code>
</section>
```

**Integration note:** Keep this behavior local to the component that owns the reading task. Confirm the font has the intended glyphs, verify the fallback, and check the component at its smallest supported size. A feature that looks refined in a hero may reduce clarity in a compact label.

**Failure test:** Temporarily remove the preferred font from the font stack. If the content becomes confusing or the layout breaks, treat that as a defect rather than an acceptable cosmetic difference.


---

## Common Mistakes

| Mistake | Why it happens | Unique fix |
|---|---|---|

| Global stylistic-set declaration | A raw feature tag is applied to `body`, changing unrelated text and making the rule difficult to reason about. | Move the tag to a named display class and document the exact alternate glyph it is meant to produce. |

| Tabular numerals on every paragraph | Digit widths become uniform where natural proportional rhythm would be more comfortable. | Apply tabular numerals only to the numeric values that users compare vertically. |

| Oldstyle numerals in a dashboard | Descenders and varying numeral heights weaken alignment in compact data views. | Use lining figures for the data component and reserve oldstyle figures for suitable editorial prose. |

| Discretionary ligatures in identifiers | Character sequences can visually merge and make IDs or code harder to inspect. | Disable discretionary ligatures on identifiers while leaving standard shaping available. |

| Small caps simulated with scaling | Scaled capitals often look too thin and have poor spacing compared with designed small-cap glyphs. | Use `font-variant-caps: small-caps` and inspect the actual font’s glyph support. |

| Feature tag assumed universal | OpenType tags are font-specific; a tag can produce no visible change or an unexpected one in another family. | Verify the font’s feature documentation and build a before/after specimen for each family used. |

| Shaping disabled to fix Latin text | A broad low-level override can damage contextual forms and required shaping in complex scripts. | Remove the global override and scope the Latin-specific feature to the relevant component. |

| Kerning overridden by tracking | Aggressive letter spacing disturbs carefully designed glyph pairs and can create collisions. | Restore normal kerning, then apply a modest component-specific tracking value only after visual testing. |

| Fallback glyph mismatch | A local font is installed during development but absent in production, so some characters use a different design. | Test with the webfont blocked and choose a compatible, script-aware fallback stack. |

| Feature applied to user-generated content | Names, pasted text, URLs, and source snippets can contain sequences that behave unexpectedly under decorative substitutions. | Keep user-generated text on a conservative typographic policy and apply display features only to authored content. |

| Unverified variable-font interaction | A feature is tested at one weight but changes appearance or availability at other variable-axis values. | Test every production weight/axis combination and document the supported range. |

| Feature used for essential meaning | A glyph alternate becomes the only way to distinguish two states or communicate a label. | Keep meaning in text and semantic markup; treat feature changes as decorative enhancement. |

| No loading-state specimen | The loaded webfont looks correct, but the fallback causes wrapping or alignment changes before it arrives. | Review initial fallback rendering and choose resilient widths, line heights, and fallback metrics. |

| Unscoped fix for one component | A quick selector fixes one headline but silently changes article text, form labels, and buttons. | Use a component class or design token and add a regression specimen for affected roles. |


Each fix is deliberately specific: do not replace one global rule with another global rule. Diagnose the content role, identify the exact font capability, and scope the correction to the component where the behavior is useful. After the fix, retest the original failure and at least one nearby component to catch accidental inheritance.


---

## Mental Models

1. **Intent before tag:** Describe the desired reading behavior before selecting an OpenType tag.
2. **A CSS request is not a glyph guarantee:** The active font and its coverage determine the actual result.
3. **Scope follows reading task:** A headline, numeric table, paragraph, and code field do not share identical feature needs.
4. **High-level properties express intent:** Prefer `font-variant-*` where it captures the requirement.
5. **Low-level tags need documentation:** A raw tag should explain the visible change it requests.
6. **Numeral styles are contextual:** Tabular figures help comparison; proportional figures often help prose.
7. **Shaping is infrastructure:** Do not disable complex-script behavior to fix a Latin-only issue.
8. **Fallback is part of the design:** The preferred font can be unavailable, late, or missing glyph coverage.
9. **Legibility beats ornament:** A decorative alternate must never obscure character recognition.
10. **Variable axes change the specimen:** Test the real weights, widths, and optical sizes that ship.
11. **Measure at production size:** A glyph that looks elegant at 64px may fail at 12px.
12. **Regressions need reproducible specimens:** Use real strings, known browsers, and before/after comparisons.

---

## Quick Reference

| Situation | Recommended choice | Notes |
|---|---|---|

| Prices and totals | `font-variant-numeric: tabular-nums` | Align digit widths; pair with consistent number formatting. |

| Editorial paragraph | Proportional numerals by default | Preserve natural text rhythm unless the typeface/context calls for oldstyle figures. |

| Data dashboard | Lining + tabular figures | Useful for metrics, scores, time, and comparisons. |

| Book-like prose | Oldstyle figures if supported | Test dates and percentages in a real paragraph. |

| Short metadata label | `font-variant-caps: small-caps` | Use designed glyphs; keep labels short. |

| Display-only alternate | Scoped `font-feature-settings` | Document the font-specific tag and expected visible result. |

| Ordinary ligatures | Keep normal shaping | Do not disable globally to solve one identifier issue. |

| Code and IDs | Conservative ligature policy | Prioritize character recognition. |

| Font coverage | Inspect rendered font | A fallback can appear mid-word or mid-string. |

| Variable font | Use high-level axis properties first | Test weight, width, and optical size in production. |

| Kerning | Keep font defaults initially | Adjust tracking only after checking real glyph pairs. |

| Multilingual content | Correct `lang` and fallback stack | Do not disable shaping globally. |

| Browser fallback | Test with font blocked | The page must remain usable without the preferred face. |

| Responsive headings | Allow natural wrapping | Do not force a feature or tracking value to prevent wrapping. |

| Regression specimen | Real strings + before/after | Include punctuation, numerals, mixed case, and identifiers. |


---

## Accessibility and Semantic Structure

Typography choices can support scanning, but they must not become the only carrier of meaning. Keep semantic HTML, meaningful headings, and accessible names. Do not replace text with a glyph or an image simply because the font has an attractive alternate. A screen reader generally announces the underlying text, not the designer’s intent for a stylistic set; therefore, all essential meaning must remain in the content and semantics.

Use a real heading hierarchy rather than choosing heading tags for their default size. Numeric styling should not change the spoken or underlying value. If prices or metrics are formatted visually, ensure the text content remains understandable when copied, selected, or read aloud. Keep identifiers recognizable and avoid ligatures that make similar characters difficult to distinguish. Test keyboard focus on interactive specimens and do not use a typography toggle that is inaccessible to keyboard or assistive-technology users.

```html
<main>
  <article aria-labelledby="page-title">
    <header>
      <p class="article-kicker">Design systems / Typography</p>
      <h1 id="page-title">Using font features with intent</h1>
      <p class="deck">A practical guide to shaping, numeral styles, and font fallbacks.</p>
    </header>
    <section aria-labelledby="examples-title">
      <h2 id="examples-title">Examples</h2>
      <p>Article text remains selectable and meaningful without decorative glyph substitutions.</p>
      <table>
        <caption>Example totals</caption>
        <tbody>
          <tr><th scope="row">Starter</th><td class="price-value">₹1,250.00</td></tr>
          <tr><th scope="row">Growth</th><td class="price-value">₹9,500.00</td></tr>
        </tbody>
      </table>
    </section>
  </article>
</main>
```

```css
a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.price-value {
  font-variant-numeric: lining-nums tabular-nums;
  text-align: end;
}
```

Accessibility checklist:
- Preserve semantic headings, landmarks, tables, captions, and form labels.
- Keep essential meaning in actual text, not only in a special glyph or visual style.
- Ensure IDs, code, and user-entered values remain easy to distinguish.
- Verify text selection, copy/paste, and screen-reader reading of formatted values.
- Keep focus indicators visible on any interactive specimen controls.
- Do not disable shaping behavior globally when multilingual content may appear.
- Test zoom and text-spacing overrides; avoid fixed heights that clip glyphs.
- Keep content readable when the custom font or an optional feature is unavailable.
- Use `lang` on passages whose language differs from the document language.
- Check contrast and size for all text roles, including small editorial labels.

---

## Browser Support and Debugging Workflow

OpenType rendering depends on browser shaping support, the exact font file, the feature table, and the fallback font actually used. High-level CSS properties are generally easier to maintain than raw feature tags. Do not assume that a syntactically valid declaration produces the same glyphs in Chromium, Firefox, Safari, and iOS Safari. Establish the project’s browser support matrix and test the real production font assets.

Debugging workflow:
1. Confirm the intended webfont has loaded in the Network panel and inspect the rendered font in developer tools.
2. Inspect computed `font-family`, `font-variant-numeric`, `font-variant-ligatures`, `font-variant-caps`, `font-feature-settings`, `font-weight`, and `font-variation-settings`.
3. Capture a baseline with the feature disabled, then toggle one setting at a time.
4. Use a specimen with mixed case, punctuation, numerals, identifiers, and representative language content.
5. Check each production weight and variable-font axis value.
6. Block the preferred font and inspect fallback glyph coverage and layout.
7. Resize to a narrow viewport and zoom to 200%.
8. Compare the visual result against the declared design purpose, not merely the CSS value.
9. Record the browser, font version, specimen string, expected behavior, and actual result.
10. Add a regression case whenever a font file or feature setting changes.

```js
function inspectTypography(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element matches selector: ${selector}`);
    return null;
  }

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  const report = {
    selector,
    text: element.textContent?.trim().slice(0, 100),
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontVariantNumeric: style.fontVariantNumeric,
    fontVariantLigatures: style.fontVariantLigatures,
    fontVariantCaps: style.fontVariantCaps,
    fontFeatureSettings: style.fontFeatureSettings,
    fontVariationSettings: style.fontVariationSettings,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth
  };

  console.table(report);
  return report;
}

inspectTypography(".price-value");
```

```css
/* Temporary debugging mode: make feature ownership visible in DevTools. */
.debug-typography * {
  outline: 1px dashed rgb(255 0 150 / 0.25);
}

.debug-typography .feature-display {
  font-feature-settings: "ss01" 1;
}

.debug-typography .feature-default {
  font-feature-settings: normal;
}
```

---

## Gotchas

- A feature tag may be supported by one font family and meaningless in another.
- A fallback can be used for one glyph inside a word, even when the rest uses the preferred webfont.
- A screenshot from a developer’s machine is not proof that the production font loads for users.
- Tabular numerals align digit widths, not arbitrary currency symbols, units, or every decimal column.
- Small caps created by CSS may be synthesized when real small-cap glyphs are unavailable.
- `font-feature-settings` is a low-level mechanism; prefer high-level properties for common behavior.
- A raw tag such as `ss01` has no universal visual meaning across typefaces.
- Variable-font axes can change widths and line breaks even when the feature tag stays the same.
- Decorative ligatures can reduce the recognizability of code, URLs, IDs, and user-entered text.
- Global overrides can damage complex-script shaping that was never part of the original bug.
- Font loading changes should be tested at the actual component size and with long production strings.
- Do not use a typographic alternate as the only signal for status, category, or required action.

---

## Build Challenge

Build a typography specimen page for a portfolio case-study site. Include a display headline, article paragraph, price comparison table, metric cards, code sample, and uppercase metadata labels. Test at least three real strings per component, including punctuation and mixed numerals. Then deliberately load a fallback font and confirm the layout remains understandable.

### Numbered requirements


1. Load a licensed webfont with explicit `font-display` behavior and a sensible fallback stack.

2. Use tabular figures for at least one numeric column and explain why the column needs alignment.

3. Keep proportional figures for running prose unless the design has a specific reason not to.

4. Use a high-level `font-variant-*` property when it expresses the desired behavior.

5. Use a raw OpenType feature tag only where a high-level property is insufficient.

6. Keep discretionary ligatures scoped to a display component.

7. Provide a code or identifier sample where discretionary substitutions are disabled.

8. Demonstrate small caps with designed glyphs, not manually shrunken uppercase text.

9. Document any stylistic set by its visible result and exact component scope.

10. Test fallback rendering with the custom font temporarily unavailable.

11. Include keyboard focus styles for any interactive specimen controls.

12. Use semantic headings and labels so screen-reader navigation remains meaningful.

13. Check text at 200% zoom and at a narrow mobile viewport.

14. Record browser support and provide a graceful default when a feature is ignored.

15. Debug one unexpected glyph substitution and document the root cause and fix.


### Failure scenarios to test

1. **Font missing:** Block the preferred webfont and inspect glyph fallback, line breaks, and component dimensions.
2. **Wrong numeral style:** Remove tabular figures from the price column and record the comparison problem before restoring them.
3. **Identifier substitution:** Enable discretionary ligatures in the code sample, identify any confusing sequence, and scope the correction.
4. **Stylistic set mismatch:** Switch to a fallback font and verify the page remains readable if the alternate is absent.
5. **Variable weight drift:** Test a light, regular, and bold weight where available and compare the alternate glyph.
6. **Complex-script regression:** Add a representative non-Latin sample and verify that no global override damages shaping.
7. **Responsive stress:** Test the page at a narrow viewport and 200% zoom without horizontal overflow.
8. **Keyboard review:** Navigate every control using Tab and Shift+Tab and confirm focus remains visible.
9. **Copy/paste review:** Copy the visible identifier and verify the text value remains accurate.
10. **Regression note:** Record the symptom, cause, fix, font version, browser, and specimen string.

### Definition of done

- [ ] All required components render with realistic content and a sensible fallback.
- [ ] Each feature setting has a named purpose and a documented scope.
- [ ] The page remains understandable when optional features are ignored.
- [ ] No important text is clipped at mobile width or 200% zoom.
- [ ] Keyboard focus and semantic navigation remain usable.
- [ ] Browser support and fallback behavior have been checked.
- [ ] Seeded failure scenarios are reproduced, fixed, and retested.
- [ ] A quick reference and a regression note are included.

---

## Production Review Checklist

Before shipping, verify the feature in context rather than in a specimen alone. Check the component hierarchy, the longest expected content, fallback fonts, high-density displays, and pointer and keyboard navigation. If a feature changes a visible glyph, the design review should name that glyph change and approve it at the actual size and weight. If the feature is intended to align values, compare a realistic column of values with different digit combinations, signs, decimals, and currency marks.

Do not treat font files as interchangeable assets. A new font version may change feature coverage, metrics, or the appearance of a stylistic set. Record the version and keep a small visual regression specimen in the project. For multilingual products, ensure the feature policy does not leak into scripts whose shaping behavior has different requirements. For user-generated content, default to recognizability over stylistic novelty.

A component is not production-ready if it works only with a designer’s locally installed font, only for one specimen string, or only at a single viewport width. Typography must survive content changes, platform differences, font loading, and user preferences without hiding information or breaking recognition.


### Verification snippet 41: feature regression probe

```css
/* Keep the test selector explicit so the result can be inspected independently. */
.feature-regression-41 {
  font-family: "Editorial Sans", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  max-width: 68ch;
}
```

```html
<p class="feature-regression-41">Office / affinity / 2026 / 1,248.50 / AB-2048-IF</p>
```

This probe is useful only when compared with the feature disabled and with the preferred font unavailable. Record whether the visible result matches the intended behavior; do not infer support from the computed declaration alone.


### Verification snippet 43: feature regression probe

```css
/* Keep the test selector explicit so the result can be inspected independently. */
.feature-regression-43 {
  font-family: "Editorial Sans", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  max-width: 68ch;
}
```

```html
<p class="feature-regression-43">Office / affinity / 2026 / 1,248.50 / AB-2048-IF</p>
```

This probe is useful only when compared with the feature disabled and with the preferred font unavailable. Record whether the visible result matches the intended behavior; do not infer support from the computed declaration alone.


### Verification snippet 45: feature regression probe

```css
/* Keep the test selector explicit so the result can be inspected independently. */
.feature-regression-45 {
  font-family: "Editorial Sans", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  max-width: 68ch;
}
```

```html
<p class="feature-regression-45">Office / affinity / 2026 / 1,248.50 / AB-2048-IF</p>
```

This probe is useful only when compared with the feature disabled and with the preferred font unavailable. Record whether the visible result matches the intended behavior; do not infer support from the computed declaration alone.


### Verification snippet 47: feature regression probe

```css
/* Keep the test selector explicit so the result can be inspected independently. */
.feature-regression-47 {
  font-family: "Editorial Sans", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  max-width: 68ch;
}
```

```html
<p class="feature-regression-47">Office / affinity / 2026 / 1,248.50 / AB-2048-IF</p>
```

This probe is useful only when compared with the feature disabled and with the preferred font unavailable. Record whether the visible result matches the intended behavior; do not infer support from the computed declaration alone.


### Verification snippet 49: feature regression probe

```css
/* Keep the test selector explicit so the result can be inspected independently. */
.feature-regression-49 {
  font-family: "Editorial Sans", Arial, sans-serif;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  max-width: 68ch;
}
```

```html
<p class="feature-regression-49">Office / affinity / 2026 / 1,248.50 / AB-2048-IF</p>
```

This probe is useful only when compared with the feature disabled and with the preferred font unavailable. Record whether the visible result matches the intended behavior; do not infer support from the computed declaration alone.
