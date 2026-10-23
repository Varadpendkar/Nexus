# Font Pairing — Production Skill

> **Path:** `layer-02-typography-design/font-pairing/SKILL.md`  
> **Layer:** 02 — Typography & Design System  
> **Purpose:** Select, validate, load, and maintain typeface combinations that create a clear hierarchy, readable interfaces, and a coherent visual voice without unnecessary font payload or fragile CSS.  
> **Use this skill:** At the start of a new website, product UI, portfolio, landing page, editorial page, or design-system build—before choosing the color palette and before styling individual components.

---

## Why This Matters

Typography is one of the earliest signals that a page is intentional. A heading face, body face, and interface face can make the same content feel editorial, technical, friendly, formal, or playful. Pairing fonts is therefore a system decision: it affects hierarchy, line length, navigation width, responsive wrapping, loading behavior, localization, and accessibility.

A weak pairing usually fails in one of four ways. The faces compete for attention; their shapes are too similar to create useful contrast; the text styles behave inconsistently at different sizes; or the chosen fonts are expensive to load and do not have the glyph coverage the product needs. A pairing that looks attractive in a specimen image may fail when it is used for long paragraphs, buttons, numbers, error messages, and narrow mobile screens.

The goal is not to collect attractive fonts. The goal is to establish a typographic relationship that can survive real content, real devices, and real users. Start with the job each role must perform, then choose typefaces that cooperate across those jobs.

This skill establishes a repeatable method for selecting a display or heading face, a body face, and—only when justified—an interface or data face. It includes font loading, fallback behavior, variable-font considerations, responsive tests, accessibility checks, debugging procedures, patterns, and a build challenge. It does not prescribe a universal pair: context, language, brand, content, and performance constraints decide the result.

---

## Scope and Non-Goals

This skill covers:

- Defining typographic roles before selecting typefaces.
- Comparing typefaces by structure, texture, x-height, width, weight range, and intended use.
- Creating contrast without sacrificing coherence.
- Pairing serif, sans-serif, slab, display, and monospaced families.
- Setting up font stacks, `@font-face`, loading hints, and fallbacks.
- Testing the pairing with realistic content and responsive layouts.
- Auditing legibility, focus, zoom, assistive technology, and localization.
- Documenting a small, maintainable typography system.

This skill does not replace a full type design course, a brand strategy, a localization review, or the `variable-fonts` skill. It does not assume that every project needs two typefaces. One well-chosen family with a strong weight range can be more coherent, faster, and easier to maintain than a decorative heading font plus a separate body font.

Do not use a font pairing to compensate for weak content hierarchy. A heading that is unclear in meaning will remain unclear when rendered in a more fashionable typeface.

---

## Deliverable

The finished implementation should include:

1. A short rationale describing the visual voice and audience.
2. A documented role map for display, heading, body, UI, and optional code/data text.
3. A tested primary font stack and a deliberate fallback stack.
4. Only the font files and weights actually used.
5. Responsive samples showing headings, paragraphs, controls, numbers, and long labels.
6. A keyboard and screen-reader review of representative components.
7. A loading and layout-shift check in browser DevTools.
8. A definition-of-done checklist completed against the real page.

---

## 1. Start With Roles, Not Font Names

A font pairing becomes easier when every role has a clear job. Before opening a font library, write down where the type will appear and what it must communicate.

### Role definitions

- **Display:** A large, expressive phrase used in a hero, campaign title, or editorial opening. It may tolerate more personality because it appears briefly and at generous sizes.
- **Heading:** Section and component titles. Headings must preserve hierarchy and remain readable when they wrap.
- **Body:** Paragraphs, descriptions, articles, and explanatory copy. Comfort over long reading sessions matters more than novelty.
- **UI:** Navigation, buttons, form labels, helper text, tables, and compact interface messages. Predictable spacing and clear letterforms are valuable.
- **Data or code:** Numeric-heavy tables, identifiers, snippets, and code. A monospaced face can help when character alignment is genuinely useful, but should not be added automatically.
- **Fallback:** A system stack that preserves reasonable width, language support, and readability when the preferred file is unavailable.

A role map can assign several roles to the same family. For example, a geometric sans may serve headings and UI, while a text-oriented serif handles body copy. Alternatively, a single humanist sans may serve every role with size, weight, and spacing doing most of the hierarchy work.

```css
:root {
  --font-display: "Fraunces", Georgia, serif;
  --font-heading: "Inter", "Helvetica Neue", Arial, sans-serif;
  --font-body: "Source Serif 4", Georgia, serif;
  --font-ui: "Inter", "Helvetica Neue", Arial, sans-serif;
  --font-code: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

.hero-title {
  font-family: var(--font-display);
}

h1,
h2,
h3 {
  font-family: var(--font-heading);
}

body,
.article-copy {
  font-family: var(--font-body);
}

button,
input,
select,
textarea,
nav {
  font-family: var(--font-ui);
}

code,
pre,
.data-id {
  font-family: var(--font-code);
}
```

Do not copy these sample families without checking their licenses, current availability, language coverage, and actual rendering. The code illustrates role separation, not a required aesthetic.

### Role-first decision record

Record answers to these questions before choosing a family:

- Is the page mostly long-form reading, short marketing copy, dense data, or mixed content?
- Does the brand need to feel restrained, expressive, technical, warm, institutional, or playful?
- Which role must attract attention first?
- What is the narrowest supported viewport?
- Which languages and scripts must be supported?
- Is the product likely to run on slow networks or low-powered devices?
- Does the design need a distinct code or tabular-numbers face?
- Can one family satisfy several roles without making the page visually monotonous?

If those questions have no answers, font selection is premature. Ask for the missing product context or document reasonable assumptions explicitly.

---

## 2. Build Contrast With Shape, Not Fashion

Contrast makes the roles distinguishable. Coherence makes them feel as if they belong to the same product. The useful zone is between a pairing that looks interchangeable and one that looks accidental.

### Contrast dimensions

Evaluate a candidate pair across multiple dimensions:

- **Classification:** Serif versus sans-serif can create clear contrast, but two sans-serifs can also work when their construction differs.
- **Proportion:** Condensed, wide, geometric, humanist, and text-oriented designs create different textures.
- **Stroke modulation:** Strong thick-thin contrast can feel editorial; low modulation can feel more neutral or technical.
- **Apertures:** Open or closed letterforms change how counters and small text read.
- **X-height:** A larger x-height can help a family remain legible at compact sizes, though it is not a universal quality score.
- **Width:** A narrow heading face may fit a hero but become cramped in buttons; a wide body face may create awkward line lengths.
- **Weight behavior:** The bold style of one family may appear much darker than the bold style of another.
- **Texture:** Compare a full paragraph and a heading in context, not just isolated glyphs.
- **Numerals and punctuation:** Prices, dates, slashes, dashes, apostrophes, and parentheses can expose mismatches that a specimen headline hides.

Use one or two strong contrast dimensions rather than changing everything at once. A high-contrast serif display face can pair well with a neutral sans body because their jobs are distinct. Two highly expressive faces with dramatically different proportions may compete unless the brand deliberately wants that tension.

### Practical contrast test

Render the pair using the same real text and the intended sizes. Look at the page from a normal reading distance. If both faces demand attention at once, reduce the display face's use or choose a quieter companion. If the roles feel indistinguishable, strengthen the contrast through family structure, size, weight, or spacing before adding another typeface.

```html
<main>
  <article class="type-sample">
    <p class="eyebrow">FIELD NOTES / ISSUE 04</p>
    <h1>Build a system that feels unmistakably yours.</h1>
    <p class="lead">
      A useful type system makes the important information easy to find
      and the supporting details comfortable to read.
    </p>
    <p>
      Use a full paragraph with varied punctuation, numerals, and longer
      words when judging the body face. A short slogan is not a sufficient test.
    </p>
  </article>
</main>
```

```css
.type-sample {
  max-width: 68rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 4vw, 4rem);
}

.type-sample h1 {
  max-width: 13ch;
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 7vw, 6.5rem);
  line-height: 0.98;
  letter-spacing: -0.035em;
}

.type-sample .lead {
  max-width: 58ch;
  font-family: var(--font-body);
  font-size: clamp(1.125rem, 1.8vw, 1.375rem);
  line-height: 1.55;
}
```

Avoid using letter spacing to disguise a fundamentally poor fit. Tracking can refine a chosen face, but excessive negative spacing may close counters and make words harder to parse.

---

## 3. Choose a Pair That Survives Real Content

Font selection is a content test. A pairing that looks excellent with “Design Forward” may fail with “Account verification unsuccessful” or “₹1,24,999.50.”

Use a representative specimen that includes:

- A short headline and a long headline.
- A paragraph of at least four or five lines.
- A navigation row with several labels.
- A primary and secondary button.
- Form labels, placeholders, validation messages, and helper text.
- A long URL or identifier where relevant.
- Numbers, currency, percentages, dates, and punctuation.
- Uppercase, lowercase, italics, bold text, and emphasis.
- The longest supported localized strings.
- A line containing characters such as `Il1`, `O0`, `rn`, `m`, `8`, and `&`.

Inspect how the pairing handles hierarchy and rhythm. Body copy should not look too dark next to headings. Buttons should not look like they belong to another product. Numerals should be distinguishable when users must read account IDs, amounts, or dates.

### A repeatable specimen

```html
<main class="specimen">
  <header>
    <p class="eyebrow">TYPOGRAPHY TEST / 01</p>
    <h1>Make complex information feel clear.</h1>
    <p class="standfirst">
      The right combination helps people scan, understand, and act
      without forcing every element to compete for attention.
    </p>
  </header>

  <section aria-labelledby="body-test-heading">
    <h2 id="body-test-heading">Body copy and punctuation</h2>
    <p>
      At 9:41 a.m., the account showed ₹12,450.75—an increase of 8.4%.
      Does the text remain comfortable when the line wraps? Can readers
      distinguish “Il1” from “O0”, and can they identify an en dash,
      em dash, apostrophe, and quotation mark without confusion?
    </p>
  </section>

  <form>
    <label for="email">Email address</label>
    <input id="email" name="email" type="email"
           aria-describedby="email-help">
    <p id="email-help">Use the address associated with your account.</p>
    <button type="submit">Continue securely</button>
  </form>
</main>
```

The specimen should be used as a visual test fixture, not shipped blindly into production. If the sample form is interactive, it must have a meaningful submission behavior and an appropriate error state.

---

## 4. Select Weights by Role and Optical Effect

A numeric font weight is not a guarantee that two families will look equally dark. A 600 weight in one family may appear similar to 700 in another. Compare the rendered results rather than trusting the number alone.

A practical starting map is:

| Role | Starting weight | Notes |
|---|---:|---|
| Body paragraphs | 400 | Prioritize comfortable reading and reliable rendering. |
| Secondary labels | 400–500 | Avoid making all supporting text too faint or too light. |
| Navigation | 500–600 | Test density and available space before increasing weight. |
| Section headings | 600–700 | Match contrast to hierarchy, not habit. |
| Display headings | 500–700 | Some display faces are already visually heavy at 500. |
| Emphasis | 600–700 | Use semantic emphasis as well as visual weight. |
| Code/data | 400–500 | Check numeral clarity and alignment needs. |

Do not load every weight just because the font family offers it. Define the roles that actually appear in the interface, then request only the needed static files or variable-font range.

```css
@font-face {
  font-family: "Example Sans";
  src: url("/fonts/example-sans-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Example Sans";
  src: url("/fonts/example-sans-semibold.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}

body {
  font-family: "Example Sans", Arial, sans-serif;
  font-weight: 400;
}

h1,
h2,
h3 {
  font-weight: 600;
}
```

The family name and file paths above are placeholders. Use the actual licensed font files in the project. Do not declare a file as supporting weights it does not contain; browsers may synthesize a weight and produce a result you did not inspect.

### Synthetic bold and italic

When a browser cannot find the requested face, it may synthesize bold or italic styling. That can be acceptable as a fallback, but it should not be mistaken for a designed style. If the design depends on a particular italic shape or heavy display weight, load the correct style and test the fallback explicitly.

```css
@font-face {
  font-family: "Example Serif";
  src: url("/fonts/example-serif-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Example Serif";
  src: url("/fonts/example-serif-italic.woff2") format("woff2");
  font-style: italic;
  font-weight: 400;
  font-display: swap;
}

blockquote {
  font-family: var(--font-body);
  font-style: italic;
}
```

---

## 5. Use a Deliberate Font Stack and Fallback

The fallback is part of the design. It is not an afterthought that only matters when the CDN fails. It may appear during the initial load, when a font is blocked, when a user disables web fonts, or when the current script is not covered by the primary font.

A robust stack names the preferred family first, followed by a suitable platform family and a generic category. Choose a generic category that matches the design intent: `serif`, `sans-serif`, `monospace`, `system-ui`, or another appropriate generic family.

```css
:root {
  --font-ui: "Inter", "Helvetica Neue", Arial, sans-serif;
  --font-reading: "Source Serif 4", Georgia, serif;
}

body {
  font-family: var(--font-reading);
}

button,
input,
select,
textarea {
  font: inherit;
}

code,
pre {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
```

Using `font: inherit` on controls often produces a more coherent interface because form controls otherwise may not inherit the surrounding typography consistently. Confirm the result in supported browsers and operating systems.

### Match fallback metrics when possible

Different fonts have different glyph widths, x-heights, ascent, and descent metrics. A fallback with very different metrics can cause text to reflow when the web font arrives. Where supported and justified by measurement, metric overrides such as `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` can reduce the visual jump. Do not guess the percentages: calculate or validate them against the actual primary and fallback files.

```css
@font-face {
  font-family: "Adjusted Fallback";
  src: local("Arial");
  size-adjust: 98%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}

body {
  font-family: "Product Sans", "Adjusted Fallback", sans-serif;
}
```

These values are illustrative only. Incorrect overrides can clip accents, alter line wrapping, or create more layout instability. Verify in the browser and retain a plain fallback stack if the adjusted face causes regressions.

---

## 6. Load Fonts With Performance in Mind

A pairing is not successful if it creates avoidable blocking, layout shift, or a large download. Font performance is especially important on mobile connections and for first-visit page loads.

### Practical loading rules

- Prefer WOFF2 for modern web delivery when it fits the project’s browser support.
- Subset only when the subset truly covers the languages and characters the site needs.
- Avoid loading unused weights, styles, and character sets.
- Use `font-display: swap` or another intentional strategy rather than leaving behavior accidental.
- Preload only critical fonts that are used early in the initial viewport.
- Make preload URLs match the actual `@font-face` URL and use the correct `as="font"` and `crossorigin` attributes.
- Avoid preloading every font in a pairing; excessive preloads compete with other critical resources.
- Check cache headers and the network waterfall in DevTools.
- Test with a cold cache and throttled network, not only a warm local session.

```html
<head>
  <link
    rel="preload"
    href="/fonts/product-sans-regular.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />
  <link rel="stylesheet" href="/assets/app.css" />
</head>
```

```css
@font-face {
  font-family: "Product Sans";
  src: url("/fonts/product-sans-regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}
```

The `crossorigin` attribute is commonly required for font preloads even when the font is served from the same origin, because the preload and font request need compatible request modes. Confirm actual requests in the Network panel rather than assuming the preload was reused.

### Understand `font-display`

- `swap` shows fallback text quickly and swaps to the web font when available. This improves text visibility but can change line breaks.
- `block` may briefly hide text while waiting for the font; it can make an initial blank-text period more noticeable.
- `fallback` uses a short block period and a limited swap period, depending on browser behavior.
- `optional` gives the browser more discretion and may avoid swapping in some conditions.

Choose based on the experience and validate the behavior in the browsers you support. There is no one strategy that is always right for every font and page.

---

## 7. Build a Responsive Type Scale Before Fine Tuning

A good pairing must behave at multiple sizes. A display face can look elegant at 72 pixels and become crowded at 32 pixels. A body face may be comfortable on desktop but too small or too tightly spaced on mobile.

Start with a small scale and tune it against real content. Use `rem` for scalable type sizing, `clamp()` for fluid ranges where appropriate, and line-height values that suit the family and size.

```css
:root {
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.375rem;
  --text-2xl: clamp(1.75rem, 3vw, 2.5rem);
  --text-display: clamp(2.5rem, 7vw, 6.5rem);
}

body {
  font-size: var(--text-md);
  line-height: 1.6;
}

h1 {
  font-size: var(--text-display);
  line-height: 0.98;
}

h2 {
  font-size: var(--text-2xl);
  line-height: 1.15;
}
```

These are starting points. Display headings often need a tighter line height than paragraphs, but the correct value depends on the font’s metrics, glyph shapes, and actual characters. Inspect letters with accents and descenders across multiple lines to ensure they are not clipped or visually colliding.

### Line length and measure

A readable paragraph width often falls near 45–75 characters per line for many Latin-script reading contexts, but it is not a universal rule. Use `ch` as a rough width tool, then inspect the actual rendered text. The `ch` unit is based on the width of the `0` glyph in the active font, so it is not a precise character count for every string.

```css
.article-copy {
  max-width: 68ch;
  font-family: var(--font-body);
  font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  line-height: 1.65;
  overflow-wrap: anywhere;
}

.article-copy p + p {
  margin-block-start: 1.25em;
}
```

Do not use `overflow-wrap: anywhere` as a substitute for sensible content layout everywhere. It is useful for unbreakable strings, but normal prose should wrap naturally. Use it selectively for IDs, URLs, and unusually long user-generated values.

---

## 8. Validate Hierarchy, Legibility, and Accessibility

Aesthetic preference is not enough. The chosen pairing must make the content perceivable and operable. Font choice alone does not guarantee accessibility, but poor typography can add friction to every interaction.

### Required checks

- Body text remains readable at 200% zoom and the page remains usable at 400% zoom where applicable.
- Text does not become clipped when browser text spacing or font settings are adjusted.
- Focus indicators remain visible around links, buttons, and form controls.
- Labels are actual labels, not placeholder-only instructions.
- Error messages are programmatically associated with their fields using appropriate `aria-describedby` or equivalent semantics.
- Heading order communicates a meaningful document structure to screen reader users.
- Visual hierarchy is not conveyed by font size or color alone.
- The font contains the characters needed by the product’s languages.
- Italic, bold, uppercase, and low-weight text remain legible at the sizes where they appear.
- Links remain identifiable and keyboard focus is not obscured.
- System fallback remains usable if the custom font is blocked.
- No essential information is embedded only in decorative text styling.

```css
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.field-help {
  font-size: 0.875rem;
  line-height: 1.45;
}

.field-error {
  font-size: 0.9375rem;
  font-weight: 600;
}
```

```html
<form>
  <label for="account-email">Email address</label>
  <input
    id="account-email"
    name="email"
    type="email"
    aria-describedby="email-help email-error"
    aria-invalid="true"
  />
  <p id="email-help">We will send a verification link to this address.</p>
  <p id="email-error" role="alert">Enter a valid email address.</p>
  <button type="submit">Send verification link</button>
</form>
```

The example represents an invalid state. In a real form, set `aria-invalid` and expose the error only when appropriate. Avoid announcing every keystroke as an error. Use `role="alert"` sparingly for newly introduced urgent messages; a stable helper message does not need to be an alert.

### Contrast and color

Font pairing and color contrast are related but separate decisions. A light font weight can appear less robust at small sizes even when the color contrast calculation passes. Validate text contrast against the actual background, and do not rely on a thin face over a complex image for essential content.

Use browser accessibility tools and, where appropriate, an automated contrast checker. Manually inspect the page in grayscale or with color removed to determine whether hierarchy still depends on size, weight, spacing, and semantics rather than color alone.

---

## 9. Test Localization and Content Stress Cases

Font pairing must account for the scripts and languages the product supports. A Latin-only specimen does not prove that a family covers Devanagari, Arabic, Cyrillic, CJK, or another script. Some families use fallback fonts for missing glyphs, producing unexpected changes in baseline, stroke texture, and line height.

Before finalizing the pairing:

- List the languages and scripts required by product requirements.
- Check the font’s actual character coverage and licensing.
- Test mixed-script content, including names, dates, currency, and punctuation.
- Test the longest localized navigation and button labels.
- Check diacritics and combining marks at normal and enlarged text sizes.
- Inspect line-height behavior when fallback glyphs are used.
- Avoid hard-coded widths that only fit the English version.
- Test right-to-left layout separately when the product supports it.
- Ensure the fallback font is available and readable for the required scripts.

```css
:lang(hi) {
  /* Example only: choose a font with verified Devanagari coverage. */
  font-family: "Noto Sans Devanagari", "Nirmala UI", sans-serif;
  line-height: 1.7;
}

[dir="rtl"] .page-title {
  text-align: start;
}

.button-label {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: break-word;
}
```

Do not assume that a family’s name or marketing page guarantees coverage for every required script. Verify the actual font file, glyph coverage, rendering, and license. Do not apply language-specific styles without confirming that the language tag is correct and that the fallback is appropriate.

---

## 10. Keep the Pairing Small and Documented

A small typography system is easier to tune than a list of font choices accumulated during implementation. Document why each family exists, which weights are loaded, and which roles may use it.

A role table might look like this:

| Token | Role | Family | Weight range | Allowed use |
|---|---|---|---|---|
| `--font-display` | Hero and campaign display | Display family | 500–700 | Large, short phrases |
| `--font-heading` | Page and section headings | Heading family | 600–700 | Structural headings |
| `--font-body` | Reading and descriptions | Text family | 400–600 | Paragraphs and long copy |
| `--font-ui` | Controls and navigation | UI family | 400–600 | Interface labels and actions |
| `--font-code` | Code and identifiers | Monospace family | 400–500 | Only where fixed-width glyphs help |

Do not create separate tokens for every component if the roles are the same. A token should represent a meaningful design decision, not simply repeat a selector name.

```css
:root {
  --font-display: "Fraunces", Georgia, serif;
  --font-heading: "Inter", Arial, sans-serif;
  --font-body: "Source Serif 4", Georgia, serif;
  --font-ui: var(--font-heading);
  --font-code: "SFMono-Regular", Consolas, monospace;
}

.page-title {
  font-family: var(--font-display);
}

.section-title {
  font-family: var(--font-heading);
}

.prose {
  font-family: var(--font-body);
}

.button,
.navigation-link,
.form-control {
  font-family: var(--font-ui);
}
```

If a role token has the same value as another token, that can be intentional: it documents the role boundary while keeping the visual system consistent. Avoid creating aliases that have no role-level meaning.

---

## 11. Debug Font Rendering With Browser DevTools

When a font looks wrong, inspect the browser’s actual font usage instead of changing CSS randomly.

### Debug sequence

1. Reproduce the issue with a cold cache and the narrowest affected viewport.
2. Inspect the element and note the computed `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, and `letter-spacing`.
3. Check the browser’s rendered-fonts panel, if available, to confirm which font actually drew the text.
4. Open the Network panel and filter for font requests.
5. Confirm the file request succeeded, the MIME type is appropriate, and the response is not blocked by CORS or a content security policy.
6. Check whether the requested weight and style have a matching `@font-face` declaration.
7. Compare the first paint with the loaded-font state.
8. Inspect layout shift and changed line wrapping.
9. Test the fallback stack by temporarily disabling the custom font.
10. Fix the root cause and retest the representative specimen.

A compact console helper can reveal the computed typography of the selected element:

```js
function inspectTypography(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return;
  }

  const style = getComputedStyle(element);
  const report = {
    selector,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    width: style.width,
    height: style.height
  };

  console.table(report);
  return report;
}

inspectTypography(".page-title");
```

`getComputedStyle()` reports resolved CSS values, but it does not by itself prove which font file rendered every glyph. Use the browser’s rendered-fonts inspector and Network panel as well. A declared family may be present in computed styles even if the actual font failed to load.

### DevTools checklist

- **Elements / Styles:** Find the rule that wins the cascade and whether a shorthand such as `font` resets another property.
- **Computed:** Verify the final family, weight, size, line height, and spacing.
- **Rendered Fonts:** Confirm the browser is drawing text with the expected face.
- **Network:** Check status, request initiator, transfer size, caching, and duplicate requests.
- **Performance:** Record whether the font swap contributes to layout movement.
- **Accessibility tree:** Verify headings, labels, button names, and error descriptions are exposed semantically.
- **Responsive mode:** Check line breaks and horizontal overflow at several viewport widths.
- **Console:** Look for failed resource loads, CSP violations, and CSS parsing errors.

---

## 12. Advanced Pairing Decisions and Edge Cases

The advanced step is not adding more typefaces. It is understanding the cases where a seemingly sound pairing breaks.

### Case A: The heading wraps one word too early

Possible causes include a wide display family, excessive tracking, an overly constrained max-width, or a fallback font with different metrics. Inspect the actual rendered family first. Then test the container and font size before changing the copy or using negative letter spacing.

### Case B: The bold style appears too dark

A weight number is a request, not a visual guarantee. Compare the two families at their intended sizes. Use a lighter heading weight, a stronger body weight, or a different family if the texture still feels unbalanced. Avoid compensating with opacity: it can weaken contrast and make text appear disabled.

### Case C: The page shifts when fonts load

Measure the shift, identify which text blocks change dimensions, and compare the fallback metrics. Consider a closer fallback, metric overrides, a different loading strategy, or a less width-sensitive layout. Do not add fixed heights around text to hide the movement.

### Case D: The font works in English but not in another language

Check the font’s glyph coverage and the actual text file. If a fallback supplies missing characters, compare baseline, line height, and stroke texture. A family that looks coherent in one script may not have a matching companion in another.

### Case E: The pair looks elegant but the UI feels inconsistent

Check whether headings, form controls, navigation, and table values use different default font rules. Browser controls may not inherit typography. Normalize controls deliberately and verify `font: inherit` where appropriate.

### Case F: The font file is too large

Audit whether the project loads multiple weights, italics, variable ranges, and language subsets unnecessarily. Prefer a smaller set of real styles and verify that subsetting does not remove punctuation or characters used by actual content. Do not remove glyphs based only on the English marketing copy if user-generated content can contain arbitrary characters.

### Case G: The display face is illegible at small sizes

Limit the display face to large, short text. Use the body or UI face for compact labels and dense content. A typeface can be a strong brand asset without being appropriate for every role.

### Case H: The pairing appears generic

First check hierarchy, spacing, content, and layout. A distinctive typeface cannot compensate for a page where every heading is the same size and every section has the same rhythm. If the brand still requires more character, change one family at a time and re-run the specimen.

---

## 13. Before → After: Replace Arbitrary Font Choices With a Role System

### Before

This approach mixes unrelated declarations, relies on browser defaults for controls, and has no explicit fallback or weight strategy.

```css
h1 {
  font-family: "Fancy Display";
  font-size: 70px;
  font-weight: bold;
}

p {
  font-family: "Some Sans";
  font-size: 16px;
}

button {
  font-size: 14px;
}

nav {
  font-family: Arial;
}
```

### After

The revised version makes the role map explicit, uses responsive sizing, gives controls a consistent family, and defines deliberate fallbacks.

```css
:root {
  --font-display: "Brand Display", Georgia, serif;
  --font-body: "Product Text", "Helvetica Neue", Arial, sans-serif;
  --font-ui: var(--font-body);
  --type-body: 1rem;
  --type-display: clamp(2.75rem, 7vw, 6.25rem);
}

body {
  font-family: var(--font-body);
  font-size: var(--type-body);
  line-height: 1.6;
}

h1 {
  max-width: 13ch;
  font-family: var(--font-display);
  font-size: var(--type-display);
  font-weight: 600;
  line-height: 0.98;
  letter-spacing: -0.025em;
}

p {
  max-width: 68ch;
}

button,
input,
select,
textarea,
nav {
  font-family: var(--font-ui);
}

a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

The after version is not automatically superior because it uses variables. It is superior because the roles are intentional, the fallback behavior is explicit, and the responsive and keyboard states are included in the system.

---

## 14. Pattern Library

Each pattern describes a reusable decision, not a mandatory recipe. Choose patterns based on content and constraints.

### Pattern 1 — Editorial Serif + Neutral Sans

**What it does:** Uses a serif family for reading or expressive headings and a restrained sans-serif for controls and navigation.

**When to use it:** Editorial sites, long-form articles, cultural institutions, publishing, or brands that benefit from a human, literary tone.

**Implementation:**

```css
:root {
  --font-editorial: "Source Serif 4", Georgia, serif;
  --font-interface: "Inter", Arial, sans-serif;
}

.article-title,
.article-copy {
  font-family: var(--font-editorial);
}

.site-nav,
button,
input,
select,
textarea {
  font-family: var(--font-interface);
}
```

**Trade-off:** The serif and sans must still share a coherent visual temperature. Check punctuation, numerals, and bold styles, not only the heading.

### Pattern 2 — Single-Family System With Weight Hierarchy

**What it does:** Uses one family for most or all roles, distinguishing hierarchy with size, weight, spacing, and layout.

**When to use it:** Product dashboards, admin tools, SaaS applications, or projects where consistency and performance matter more than a strongly editorial voice.

**Implementation:**

```css
:root {
  --font-system: "Inter", system-ui, sans-serif;
}

body,
button,
input,
select,
textarea,
nav {
  font-family: var(--font-system);
}

body { font-weight: 400; }
nav { font-weight: 500; }
h1, h2, h3 { font-weight: 650; }
```

**Trade-off:** One family can become monotonous if every component uses the same scale and rhythm. Create hierarchy with layout and spacing instead of adding another family reflexively.

### Pattern 3 — Display Accent With Reading-Safe Body

**What it does:** Restricts a high-personality family to large headings and uses a comfortable text face for paragraphs.

**When to use it:** Portfolio heroes, campaign landing pages, product launches, and brand storytelling where the headline is a visual focal point.

**Implementation:**

```css
.hero-heading {
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: clamp(3rem, 9vw, 8rem);
  line-height: 0.92;
}

.hero-description,
.article-copy {
  max-width: 62ch;
  font-family: var(--font-body);
  font-size: 1.125rem;
  line-height: 1.65;
}
```

**Trade-off:** Avoid using the display face for labels, cards, and small navigation. Its distinctive shapes may be less comfortable in dense UI.

### Pattern 4 — UI-First Pairing for Data-Dense Products

**What it does:** Uses a highly legible sans family for controls and a compatible monospace face only for values where character alignment or character distinction matters.

**When to use it:** Financial dashboards, analytics tools, developer products, and tables with IDs, code, or aligned numerical values.

**Implementation:**

```css
:root {
  --font-ui: "Inter", system-ui, sans-serif;
  --font-data: "SFMono-Regular", Consolas, monospace;
}

body,
button,
input,
select {
  font-family: var(--font-ui);
}

td[data-kind="identifier"],
.code-value {
  font-family: var(--font-data);
  font-variant-numeric: tabular-nums;
}
```

**Trade-off:** Monospaced text is not automatically more readable for all numbers. Test the actual data and use tabular numerals where appropriate.

### Pattern 5 — Brand Headings With System UI Fallback

**What it does:** Uses a branded face for visible headings while keeping the interface stack resilient and quick to render.

**When to use it:** Sites where the brand face is central to identity but controls must remain robust if the font request fails.

**Implementation:**

```css
:root {
  --font-brand: "Brand Display", "Iowan Old Style", Georgia, serif;
  --font-ui: system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", sans-serif;
}

h1,
h2,
.hero-title {
  font-family: var(--font-brand);
}

body,
button,
input,
select,
textarea {
  font-family: var(--font-ui);
}
```

**Trade-off:** System UI differs by operating system. Test it on the actual supported platforms, especially if precise wrapping is critical.

### Pattern 6 — Long-Form Reading Pair

**What it does:** Optimizes body text for sustained reading and uses a contrasting heading face that does not overwhelm the article.

**When to use it:** Documentation, essays, research summaries, guides, and knowledge bases.

**Implementation:**

```css
:root {
  --font-reading: "Literata", Georgia, serif;
  --font-heading: "Inter", Arial, sans-serif;
}

.prose {
  max-width: 68ch;
  font-family: var(--font-reading);
  font-size: 1.0625rem;
  line-height: 1.7;
}

.prose h1,
.prose h2,
.prose h3 {
  font-family: var(--font-heading);
  line-height: 1.2;
}
```

**Trade-off:** Long-form reading needs paragraph rhythm, sensible measure, and clear headings as much as it needs a particular family. Evaluate a full article, not only the first viewport.

### Pattern 7 — Responsive Localized UI

**What it does:** Keeps a stable role system while allowing language-specific font fallbacks and natural wrapping.

**When to use it:** Products with multiple scripts or localization requirements.

**Implementation:**

```css
:root {
  --font-ui: "Product Sans", Arial, sans-serif;
}

body,
button,
input,
select,
textarea {
  font-family: var(--font-ui);
}

:lang(ja) {
  font-family: "Noto Sans JP", "Yu Gothic", sans-serif;
}

.localized-label {
  max-width: 100%;
  white-space: normal;
  overflow-wrap: break-word;
}
```

**Trade-off:** This example uses illustrative family names. Confirm coverage and availability for every supported script. Do not assume the language-specific stack is correct without testing.

### Pattern 8 — Performance-Constrained Pair

**What it does:** Limits the number of downloaded families and weights, prioritizes the initial viewport, and uses a stable fallback.

**When to use it:** Performance-sensitive landing pages, low-bandwidth audiences, or applications with strict resource budgets.

**Implementation:**

```css
@font-face {
  font-family: "Product Sans";
  src: url("/fonts/product-sans-regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Product Sans";
  src: url("/fonts/product-sans-semibold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

body {
  font-family: "Product Sans", Arial, sans-serif;
}
```

**Trade-off:** A smaller font set is only a win if it preserves the styles and glyphs that real content needs. Check the network waterfall and language coverage.

---

## 15. Common Mistakes

| Mistake | Why it happens | Specific fix |
|---|---|---|
| Choosing fonts from a specimen headline only | Large display samples hide problems in paragraphs and controls. | Test a complete page specimen with headings, four-line paragraphs, buttons, labels, and numerals. |
| Pairing two nearly identical families | The designer compares family names rather than letterform structure. | Compare x-height, apertures, width, stroke contrast, and texture; either create clear role contrast or use one family. |
| Pairing two highly expressive display faces | Each face is selected independently for personality. | Assign the strongest face to one role and use a quieter companion for the other. |
| Loading every available weight | Font menu availability is mistaken for implementation need. | Inventory computed weights in the UI and load only used styles or a justified variable range. |
| Declaring a weight the file does not contain | The CSS value is assumed to match the actual font file. | Map each `@font-face` declaration to the real file and test computed and rendered weights. |
| Forgetting the italic file | Browser-synthesized italics are not reviewed. | Add a real italic face if the design depends on it; otherwise test the synthesized fallback. |
| Using a decorative face for body copy | Brand expression is prioritized over long-form comfort. | Limit the display face to large, short text and use a reading-oriented face for paragraphs. |
| Ignoring fallback metrics | Testing happens only after the font has loaded. | Disable web fonts, compare line breaks, and measure layout shift; tune fallback or metric overrides based on evidence. |
| Preloading every font | Preload is treated as a generic performance improvement. | Preload only critical above-the-fold fonts and verify reuse in the Network panel. |
| Using `font-display` without a deliberate choice | The default loading experience is never tested. | Compare cold-cache behavior and choose a strategy based on text visibility and layout stability. |
| Testing only desktop widths | The chosen pairing is judged in a spacious viewport. | Test narrow screens, zoom, long localized labels, and the smallest supported component widths. |
| Applying negative tracking everywhere | Tight letter spacing is used to imitate a particular brand style. | Apply tracking only to selected roles and inspect counters, punctuation, and small-size legibility. |
| Using all-caps for long labels | Uppercase is mistaken for a universal hierarchy tool. | Reserve uppercase for short labels when appropriate; use sentence case for long instructions and actions. |
| Ignoring scripts beyond Latin | The sample content does not reflect actual users. | Verify glyph coverage and test real text in every required language and script. |
| Styling controls separately by accident | Native controls may not inherit the surrounding family. | Normalize control typography with `font: inherit` or explicit UI tokens and verify each browser. |
| Fixing wrapping with fixed heights | The design is tuned to one exact string. | Let text containers grow, use max-width and responsive sizing, and test the longest realistic content. |
| Treating a computed family as proof of successful loading | Computed CSS reports declarations, not necessarily the rendered font. | Inspect rendered fonts and network requests; test with the custom font disabled. |
| Making helper text too small and faint | Secondary information is visually minimized without usability review. | Check actual contrast, size, line height, and 200% zoom; keep instructions readable. |
| Using a monospace font for every number | Alignment is assumed to require a separate family. | Test `font-variant-numeric: tabular-nums` in the body or UI family first. |
| Omitting keyboard focus styles | Typography work is reviewed only in a mouse-driven visual state. | Add `:focus-visible` styles and test navigation with keyboard only. |
| Using placeholder text as the only field label | The visual mockup appears cleaner without a label. | Use a semantic `<label>` and reserve placeholders for examples or hints. |
| Ignoring font licensing | A downloaded file is assumed to be free for every use. | Check the license for web embedding, traffic limits, self-hosting, and redistribution before shipping. |
| Subsetting without preserving punctuation | The subset is built from a limited sample. | Test actual content and include required punctuation, symbols, accented characters, and user-generated text. |
| Adding a third family to fix hierarchy | Typography roles have not been defined clearly. | Revisit size, weight, spacing, and role mapping before adding another download. |

---

## 16. Quick Reference

| Situation / property | Starting point | Notes |
|---|---|---|
| Heading and body feel too similar | Change structure or role contrast | Do not add a family until one-family hierarchy has been tested. |
| Display headline | `clamp(2.5rem, 7vw, 6.5rem)` | Tune min, fluid range, and max against real wrapping. |
| Body size | `1rem` or larger as needed | Check reading comfort, browser zoom, and content density. |
| Body line height | `1.5`–`1.75` | Adjust for the actual family and size. |
| Large heading line height | Around `0.9`–`1.15` | Inspect descenders, accents, and multi-line collisions. |
| Paragraph measure | `max-width: 60ch` to `70ch` | `ch` is a rough width aid, not a literal character counter. |
| Family role tokens | CSS custom properties | Keep tokens semantic and reusable. |
| Font file format | WOFF2 where supported | Confirm browser support requirements and licensing. |
| Font swap behavior | `font-display: swap` | Validate layout shift and fallback appearance. |
| Critical font preload | `rel="preload"` with `as="font"` | Only preload fonts required for initial rendering. |
| Weight mapping | Actual file-to-weight mapping | Avoid claiming a static file supports multiple weights. |
| Italic | Real italic face when needed | Check whether synthetic italic changes the intended voice. |
| Fallback | Similar generic category and metrics | Test with the custom file blocked. |
| UI controls | `font: inherit` or explicit token | Native control behavior varies; verify browsers. |
| Keyboard focus | `:focus-visible` | Keep the indicator clearly visible and unobscured. |
| Form help text | `aria-describedby` | Connect instructions and errors to the relevant field. |
| Font debugging | `getComputedStyle()` plus rendered-font panel | Computed family alone does not prove the file loaded. |
| Request debugging | Network panel | Inspect status, size, initiator, CORS, and cache. |
| Layout shift | Performance panel and cold-cache test | Do not hide text movement with fixed heights. |
| Localized scripts | Verified glyph coverage | Test real language content, not only Latin text. |
| Data numerals | `font-variant-numeric: tabular-nums` | Use only when alignment benefits the task. |
| Long identifiers | `overflow-wrap: anywhere` selectively | Preserve normal prose wrapping where possible. |
| Font license | Check before embedding | Verify web use and self-hosting rights. |

---

## 17. Specific Build Requirements

Build a working typography specimen page and complete each requirement. These requirements are deliberately concrete so the result can be reviewed.

1. Write a short visual-voice statement that names the audience, content type, and desired tone.
2. Define at least three typographic roles: heading, body, and UI. Add display or code only if the design needs them.
3. Document why each selected family is assigned to its role.
4. Test one-family and two-family options before deciding that two families are necessary.
5. Include a short heading and a long heading to expose wrapping problems.
6. Include at least one paragraph with punctuation, numbers, currency, and a long word.
7. Include navigation, buttons, labels, helper text, and an error state in the specimen.
8. Define semantic CSS custom properties for family roles and a small type scale.
9. Provide a deliberate fallback stack for every web font.
10. Load only the styles and weights used by the specimen.
11. Confirm that the browser renders the intended family and weight.
12. Test the page at a narrow viewport, a typical laptop viewport, and a wide desktop viewport.
13. Test browser zoom at 200% and inspect reflow at 400% where applicable.
14. Verify keyboard focus visibility for links, buttons, and form controls.
15. Associate form instructions and errors with their controls using semantic HTML and appropriate ARIA.
16. Confirm that the font license permits the intended web use.
17. Test the fallback state with the custom font disabled or blocked.
18. Inspect the Network panel for failed, duplicate, or unnecessarily large font requests.
19. Test all supported scripts or document the coverage limitation if the project does not yet have multilingual requirements.
20. Capture the final role map and the reason for each pairing choice in the project documentation.

### Build challenge: font swap breaks the hero

**Scenario:** A hero heading fits on two lines after the web font loads, but wraps to three lines during the initial fallback state. The page visibly jumps. A developer proposes a fixed height on the heading.

**Your task:** Do not accept the fixed-height workaround without evidence. Reproduce the issue using a cold cache and a throttled network. Inspect the fallback and rendered fonts, computed size and line height, container width, and font request timing. Determine whether the main cause is fallback metrics, an unnecessarily wide display face, an oversized heading, or an incorrect font declaration. Make a targeted correction, then verify that no text is clipped when the fallback remains active.

**Required evidence:**

- A short root-cause statement based on DevTools evidence.
- The relevant computed styles before and after the correction.
- A network observation confirming whether the font request succeeds.
- A responsive check at a narrow viewport.
- A keyboard and accessibility check after the typography change.
- A brief note explaining why the final fix is safer than a fixed height.

---

## 18. Mental Models

1. **A typeface is a role decision, not a decoration.** Choose it based on the content it must support.
2. **Contrast is useful only when hierarchy remains coherent.** Difference without purpose looks accidental.
3. **The body face earns trust through repeated reading.** Judge it in paragraphs, not just in a logo-like phrase.
4. **A font stack includes the failure state.** The fallback is part of the experience from the first paint.
5. **A weight number is not a visual measurement.** Compare actual rendered darkness and shape.
6. **Every additional family has a cost.** It adds download, maintenance, licensing, and consistency work.
7. **Typography is responsive even when the CSS value is fixed.** Available width changes the line breaks and rhythm.
8. **A specimen is a test fixture.** It should contain the difficult strings that real users will encounter.
9. **Computed styles are evidence, not the whole diagnosis.** Confirm rendered fonts and network behavior too.
10. **Localization is a design requirement.** Latin-script success does not prove multilingual success.
11. **Hierarchy must survive without color.** Size, weight, spacing, semantics, and placement should cooperate.
12. **A fixed height can hide the symptom while creating clipping.** Correct the metrics or layout instead.
13. **A single-family system can be distinctive.** Distinctiveness can come from scale, spacing, composition, and content.
14. **A third typeface must justify its existence.** Add it only when a clear role cannot be met by the current system.
15. **Accessibility is part of quality, not a final polish step.** Focus, zoom, labels, and reading comfort must be checked during implementation.

---

## 19. Gotchas

> **Gotcha 1 — The font is declared but not rendered.** A computed `font-family` can show the intended name while the browser uses a fallback. Check the rendered-fonts panel and the Network request.

> **Gotcha 2 — A preload can make performance worse.** Preloading several non-critical weights competes with images, stylesheets, and other important resources. Preload only what the initial viewport needs.

> **Gotcha 3 — The fallback can change your entire layout.** Similar-looking families may have different glyph widths and line metrics. Test the fallback state and consider metric overrides only after measuring.

> **Gotcha 4 — `font-weight: 600` does not guarantee a real semibold file.** If the face is missing, the browser may synthesize or choose a nearby weight. Match the declaration to the actual font asset.

> **Gotcha 5 — A font subset can silently omit valid content.** Currency symbols, punctuation, diacritics, and user-generated text may be missing even if a hero headline renders correctly. Test representative production strings.

> **Gotcha 6 — The `ch` unit is not an exact character count.** It depends on the active font’s zero glyph and does not predict every word’s width. Use it as a starting constraint and inspect real wrapping.

> **Gotcha 7 — A visually quiet font can still have poor small-size legibility.** Inspect counters, punctuation, and thin strokes at the actual rendered size and contrast.

> **Gotcha 8 — Native controls may ignore the page’s font choice.** Normalize typography deliberately and verify input, select, and button rendering in each supported browser.

---

## 20. Definition of Done

- [ ] The role map explains the purpose of each selected family and does not add a family without a clear reason.
- [ ] The pairing has been reviewed with headings, body paragraphs, navigation, controls, numerals, punctuation, and long labels.
- [ ] The body text remains comfortable at the intended size and line height.
- [ ] Font files, weights, styles, licenses, and language coverage have been checked.
- [ ] Fallback stacks are defined and the fallback state has been tested.
- [ ] The Network panel shows no unexplained font failures or redundant font downloads.
- [ ] The design has been checked at narrow, medium, and wide viewport widths.
- [ ] Text remains usable under browser zoom and does not rely on fixed heights that clip content.
- [ ] Links, buttons, inputs, and other controls have visible `:focus-visible` styles.
- [ ] Form labels, helper text, and errors are associated semantically and exposed to assistive technology.
- [ ] The computed styles and rendered-font inspection agree with the intended role mapping.
- [ ] The build challenge has been debugged with evidence rather than hidden with a brittle workaround.
- [ ] The project documentation includes the final role map, rationale, and any known limitations.

---

## 21. Final Review Checklist

Before handing the pairing to the next design-system layer, review the following:

- **Brand:** Does the typography express the intended voice without overwhelming the content?
- **Hierarchy:** Can a reader identify the page title, section headings, body, and actions quickly?
- **Coherence:** Do the chosen families share a compatible visual tone?
- **Readability:** Are body text, helper text, and controls comfortable at real sizes?
- **Responsive behavior:** Does the layout survive long headlines and narrow viewports?
- **Loading:** Is text visible during loading, and is font swapping acceptable?
- **Fallback:** Does the page remain readable if the web font cannot be loaded?
- **Coverage:** Are all required scripts, punctuation, and symbols supported?
- **Accessibility:** Are focus states, zoom, semantics, and form associations correct?
- **Maintenance:** Are font roles and loaded assets documented?
- **Performance:** Are font requests limited, cacheable, and visible in the Network panel?
- **Evidence:** Has the implementation been inspected in the actual target browsers?

A pairing is ready when it works as a system across content, states, viewports, and loading conditions—not when a single screenshot looks attractive.

---

## Appendix A — Example Implementation Skeleton

This skeleton shows how a role system can be organized in a small project. Replace illustrative family names and URLs with verified, licensed assets.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Typography specimen</title>
  <link rel="preload"
        href="/fonts/product-text-regular.woff2"
        as="font"
        type="font/woff2"
        crossorigin>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <nav aria-label="Main navigation">
      <a href="#overview">Overview</a>
      <a href="#specimen">Specimen</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>

  <main id="overview">
    <section class="hero" aria-labelledby="page-title">
      <p class="eyebrow">TYPE SYSTEM / TEST PAGE</p>
      <h1 id="page-title">Make every word earn its place.</h1>
      <p class="hero-copy">
        A pairing should give every role a clear voice while keeping the
        reading experience coherent, responsive, and dependable.
      </p>
    </section>

    <section id="specimen" aria-labelledby="specimen-title">
      <h2 id="specimen-title">Real content, real constraints</h2>
      <figure>
        <blockquote>
          “Good typography makes structure visible before the reader
          has to work to discover it.”
        </blockquote>
        <figcaption>Specimen quotation — replace with real content.</figcaption>
      </figure>
      <p>
        Amount: ₹12,450.75. Change: +8.4%. Reference: INV-00128.
        Test apostrophes, dashes, brackets, and long identifiers.
      </p>
    </section>

    <section id="contact" aria-labelledby="contact-title">
      <h2 id="contact-title">Control typography</h2>
      <form>
        <label for="name">Name</label>
        <input id="name" name="name" autocomplete="name">
        <p id="name-help">Enter the name shown on your profile.</p>
        <button type="submit">Save details</button>
      </form>
    </section>
  </main>
</body>
</html>
```

```css
@font-face {
  font-family: "Product Text";
  src: url("/fonts/product-text-regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Product Text";
  src: url("/fonts/product-text-semibold.woff2") format("woff2");
  font-weight: 600;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-display: "Brand Display", Georgia, serif;
  --font-body: "Product Text", Arial, sans-serif;
  --font-ui: var(--font-body);
  --measure: 68ch;
  --space-section: clamp(3rem, 8vw, 7rem);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: 1.6;
}

main {
  width: min(100% - 2rem, 76rem);
  margin-inline: auto;
}

.site-header,
button,
input {
  font-family: var(--font-ui);
}

.hero {
  padding-block: var(--space-section);
}

.hero h1 {
  max-width: 12ch;
  font-family: var(--font-display);
  font-size: clamp(2.75rem, 8vw, 7rem);
  font-weight: 600;
  line-height: 0.96;
  letter-spacing: -0.025em;
}

.hero-copy,
section > p {
  max-width: var(--measure);
}

section {
  padding-block: var(--space-section);
}

label {
  display: block;
  margin-block-end: 0.375rem;
}

input,
button {
  min-height: 2.75rem;
  font-size: 1rem;
}

a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

The reduced-motion rule is included as a safe project-wide baseline if the page later gains motion; this skill does not require decorative animation for font pairing. Review global reset rules carefully before using them in a production codebase.

---

## Appendix B — Review Notes for a Design Critique

When reviewing someone else’s pairing, avoid vague feedback such as “the fonts do not look right.” Identify the role and the observed behavior.

Useful critique statements include:

- “The heading and body have similar texture at this size, so the hierarchy is not clear. Test a more distinct structure or use one family with a stronger size scale.”
- “The display face is effective in the hero, but the same face is making card descriptions difficult to scan. Limit it to the title role.”
- “The body face looks comfortable on desktop, but the line length becomes too wide in the article column. Reduce the measure and test the paragraph rhythm.”
- “The font request is failing in the Network panel, so the screenshot is showing a fallback. Resolve the URL or hosting policy before adjusting the typography.”
- “The loaded face changes the hero from three lines to two. Compare fallback metrics and the container width before introducing fixed height.”
- “The semibold file is not being requested. Check the `@font-face` weight declaration and the CSS rule that requests 600.”
- “The English specimen passes, but the localized label is clipping. Test the target script and let the component wrap before reducing the font size.”
- “The button loses its visible focus indicator. Add a `:focus-visible` rule and validate keyboard navigation.”
- “The paragraph looks light against the background. Check computed weight and contrast before increasing opacity or changing the family.”
- “The page loads four weights that are not used above the fold. Remove unnecessary requests and verify the network waterfall.”

A strong critique describes the evidence, the affected role, the likely cause, and the next test. It does not assume that every visual difference is a problem or that every problem requires another font.

---

## Appendix C — Handoff Contract

The next typography and design-system work should receive:

- The selected role tokens and their rationale.
- The actual family names, asset paths, weight mappings, and license references.
- The required language and script coverage.
- The fallback strategy and known layout differences.
- The type scale and line-height decisions.
- A specimen page or screenshots at supported breakpoints.
- A short performance note covering font request count and loading behavior.
- Accessibility review results, including keyboard focus, zoom, labels, and semantic heading order.
- Any known compromises, such as a display face used only at large sizes or a fallback with slightly different wrapping.

Do not hand off a pairing with unresolved missing glyphs, unexplained font request failures, or fixed-height clipping. Record unresolved issues clearly so the next contributor does not mistake them for intentional design decisions.

---

## Appendix D — Quick Debug Reference

Use this order when typography appears inconsistent:

1. **Verify the element.** Select the exact text node or component that appears wrong.
2. **Read computed values.** Record `font-family`, `font-size`, `font-weight`, `font-style`, `line-height`, and `letter-spacing`.
3. **Check the rendered face.** Confirm the actual family in the browser’s font inspection panel.
4. **Check the request.** Verify the file path, response status, CORS policy, and cache behavior.
5. **Check the role rule.** Determine whether a component selector overrides the design token.
6. **Check the real weight.** Confirm the requested style is included in the font files and declarations.
7. **Check the content.** Test long words, punctuation, numerals, accents, and localized strings.
8. **Check the container.** Measure width, padding, grid constraints, and responsive breakpoints.
9. **Check the fallback.** Disable the custom font and observe wrapping and clipping.
10. **Check the interaction state.** Verify focus, validation, disabled, and hover states remain legible.
11. **Check zoom and reflow.** Ensure the fix is not dependent on one viewport or one zoom level.
12. **Record the cause.** Document the root cause and why the chosen fix addresses it.

A debugging session is complete only after the cause has been reproduced, the correction has been verified, and the relevant regression cases have been re-tested.
