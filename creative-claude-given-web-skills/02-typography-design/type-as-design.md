# Type as Design — Production Skill

> **Path:** `layer-02-typography-design/type-as-design/type-as-design.md`  
> **Layer:** 02 — Typography & Design System  
> **Purpose:** Treat typography as a primary visual material: build hierarchy with scale, composition, cropping, outline treatments, text masking, and oversized editorial forms while preserving readability and accessibility.  
> **Use this skill:** When the headline itself should carry the visual identity—portfolio heroes, campaign pages, editorial section breaks, launch pages, and expressive landing-page compositions.

---

## Why This Matters

Typography can communicate structure, tone, pace, and identity before a visitor reads the supporting copy. In a type-led layout, the headline is not merely a label placed above a hero image; its scale, line breaks, alignment, density, and relationship to the surrounding space become the composition. This can create a strong visual identity without relying on a large illustration or a pile of decorative assets.

The difficulty is that expressive typography is still content. A headline must remain readable, respond to viewport changes, work with browser zoom and text resizing, support keyboard navigation when interactive, and retain meaningful structure for assistive technology. A design that looks striking in one screenshot can fail when the title wraps differently, a translated phrase is longer, a fallback font loads, or a user increases text size.

This skill focuses on the design and implementation decisions that make typography a visual system rather than a one-off trick. It covers oversized type, text-as-image composition, outlined type, background numerals, clipping and masking, responsive line breaks, and layered type treatments. It also defines limits: decorative duplication should not be announced repeatedly by screen readers, important text should not be hidden in a background image, and clipping must never make essential content inaccessible.

---

## Scope and Non-Goals

This skill covers:

- Building a hierarchy where type is the primary visual feature.
- Designing large hero headlines with controlled line lengths and line breaks.
- Using `clamp()` and responsive containers to size display type.
- Using `text-stroke`, transparent fill, and outline treatments with fallbacks.
- Creating clipped or masked text without losing the meaningful text layer.
- Using oversized numerals and letters as background decoration.
- Layering type with images, gradients, and controlled overlap.
- Preserving semantic heading structure and accessible text.
- Testing zoom, localization, reduced motion, contrast, and fallback rendering.
- Debugging clipping, overflow, stacking, and responsive wrapping in DevTools.

This skill does not encourage turning every paragraph into a visual effect. It does not replace font selection, color-system, image-treatment, or motion-system work. Use a restrained hierarchy: one or two expressive moments can make a page memorable; applying every technique to every component usually weakens the result.

---

## Deliverable

A completed type-as-design implementation should include:

1. A clear typographic concept and hierarchy.
2. A meaningful semantic heading structure.
3. A responsive display scale with tested minimum and maximum sizes.
4. A content-aware line-break strategy rather than a screenshot-only line break.
5. A defined role for each decorative text layer.
6. A readable fallback for unsupported stroke, mask, or blend effects.
7. A strategy to avoid duplicate announcements from decorative text.
8. Verified contrast and focus visibility.
9. A test record for narrow viewports, zoom, long content, and fallback fonts.
10. A short note describing why the type treatment improves the message.

---

## 1. Begin With a Typographic Concept

Before writing CSS, describe the visual idea in one sentence. Examples: “The headline feels like a bold editorial cover,” “The title stretches across the hero like a poster,” or “The section number acts as a quiet navigational landmark.” A concept should guide the hierarchy and help you decide which effects to reject.

Define the role of each text layer:

- **Primary content:** The actual page title or key message.
- **Supporting content:** Subtitle, eyebrow, description, metadata, or call to action.
- **Decorative type:** Duplicate letters, background numerals, outline text, or oversized fragments used only as visual texture.
- **Interactive type:** Links, buttons, navigation labels, or controls whose state changes with interaction.

Decorative type should not compete with the primary message. Use differences in scale, color, opacity, weight, alignment, and spacing to establish a deliberate relationship. The display headline can be oversized, but supporting text should remain comfortable to read.

```html
<main>
  <section class="hero" aria-labelledby="hero-title">
    <p class="eyebrow">INDEPENDENT DIGITAL STUDIO</p>
    <h1 id="hero-title" class="hero-title">Ideas made visible.</h1>
    <p class="hero-copy">
      We build digital products with clarity, character, and care.
    </p>
    <a class="hero-link" href="#work">Explore selected work</a>
  </section>
</main>
```

```css
.hero {
  display: grid;
  align-content: center;
  min-height: min(90svh, 60rem);
  padding: clamp(1.25rem, 5vw, 5rem);
}

.hero-title {
  max-width: 11ch;
  margin: 0;
  font-size: clamp(3rem, 11vw, 9rem);
  line-height: 0.92;
  letter-spacing: -0.055em;
}
```

The `ch` unit is an approximate character-based measure, not a guarantee that a phrase fits exactly. Verify actual wrapping with the selected font and content.

---

## 2. Treat Scale as a Structural Tool

Oversized type works when it expresses hierarchy, not simply because the number is large. The scale should reflect the content's role and the available space. A hero title may occupy a substantial portion of the first viewport; a section title may be large enough to anchor a transition; a small label should remain subordinate.

Use a responsive scale rather than a single fixed display size. `clamp()` provides a minimum, fluid preferred value, and maximum. Keep line-height intentionally tight for large display type, then test the actual letterforms and descenders.

```css
.display-title {
  font-size: clamp(3rem, 9vw, 8.5rem);
  line-height: 0.9;
  letter-spacing: -0.045em;
  max-width: 12ch;
  overflow-wrap: normal;
}
```

Do not set the minimum so large that text overflows on narrow devices. A fluid value is not automatically responsive if its minimum or maximum is unsuitable. Test at 320 CSS pixels, at common laptop widths, and at high zoom.

### Scale by role

| Role | Typical strategy | Validation |
|---|---|---|
| Hero title | Fluid, strong contrast, limited line length | Check wrap, clipping, and first-screen balance |
| Section title | Large but subordinate to hero | Maintain consistent section rhythm |
| Editorial pull quote | Controlled width and generous line spacing | Preserve reading flow and attribution |
| Background numeral | Huge, low-contrast or masked | Ensure content remains dominant |
| Eyebrow | Small, spaced, high clarity | Avoid excessive tracking on small text |
| CTA label | Moderate, legible, interactive | Preserve target size and focus state |

These are design strategies, not fixed token values. Choose scale according to the font, language, content length, and brand.

---

## 3. Design Line Breaks for Real Content

Line breaks have a strong effect on tone. A short phrase on three lines can feel like a poster; the same phrase on one line can feel like a utility label. Control line breaks when the copy is stable, but avoid forcing brittle desktop-only wrapping into every viewport.

Prefer natural wrapping with a well-chosen max-width. Use explicit `<br>` only when the break is part of the intended message and remains reasonable across responsive sizes. For important content that may be translated, make the line structure flexible.

```html
<h1 class="hero-title">
  Make room<br class="desktop-break">
  for better ideas.
</h1>
```

```css
.desktop-break {
  display: none;
}

@media (min-width: 58rem) {
  .desktop-break {
    display: initial;
  }
}

.hero-title {
  max-width: 12ch;
  text-wrap: balance;
}
```

`text-wrap: balance` can improve short heading lines in supporting browsers, but it should not be treated as a replacement for testing. The browser may balance lines differently from the design mockup, and support may vary across target environments.

Avoid inserting non-breaking spaces everywhere to force a desired screenshot. They can prevent natural wrapping and cause overflow when text is translated or the viewport narrows.

---

## 4. Build Hierarchy Before Effects

A type-led page should remain coherent in plain text. First define heading sizes, line heights, content widths, spacing, and alignment. Only after the basic hierarchy works should you add stroke, masking, shadows, gradients, or overlap.

```css
:root {
  --type-display: clamp(3rem, 9vw, 8rem);
  --type-section: clamp(2rem, 4vw, 3.75rem);
  --type-body: 1rem;
  --measure-copy: 65ch;
}

h1,
h2,
p {
  margin-block-start: 0;
}

h1 {
  font-size: var(--type-display);
  line-height: 0.94;
}

h2 {
  font-size: var(--type-section);
  line-height: 1.05;
}

p {
  max-width: var(--measure-copy);
  line-height: 1.65;
}
```

The heading outline must make sense without decorative duplication. Use one actual `h1` for the main page title where appropriate, followed by logically nested section headings. Do not use heading tags purely because their default styles look large; style the correct semantic element instead.

---

## 5. Create Outline Text With a Readable Fallback

Outlined display type can add contrast and depth, particularly when used behind a filled title or as a repeated visual motif. The CSS `-webkit-text-stroke` property is widely used for this effect, but support and rendering can vary. Keep a meaningful readable default before applying transparent fill.

```css
.outline-title {
  color: currentColor;
  -webkit-text-stroke: 1px currentColor;
}

@supports (-webkit-text-stroke: 1px currentColor) {
  .outline-title {
    color: transparent;
    -webkit-text-stroke: 1px currentColor;
  }
}
```

Transparent fill is suitable only when the outline itself remains visible and legible. Do not make the only copy of essential text transparent if the effect may disappear in a browser, forced-colors mode, print output, or a high-contrast configuration.

### Layered outline and filled text

Use separate elements only when the decorative layer adds meaningful visual value. The decorative layer should be hidden from assistive technology if it repeats the same words.

```html
<div class="type-lockup">
  <span class="type-lockup__outline" aria-hidden="true">CREATE</span>
  <h2 class="type-lockup__fill">Create what matters.</h2>
</div>
```

```css
.type-lockup {
  position: relative;
  isolation: isolate;
}

.type-lockup__outline {
  position: absolute;
  inset-block-start: -0.2em;
  inset-inline-start: 0;
  z-index: -1;
  color: transparent;
  -webkit-text-stroke: 1px currentColor;
  font-size: clamp(4rem, 14vw, 12rem);
  line-height: 0.9;
  pointer-events: none;
}

.type-lockup__fill {
  position: relative;
  max-width: 12ch;
}
```

Check the actual contrast of the outline against every background it crosses. A one-pixel stroke may disappear at small sizes or on low-density displays. Use a decorative outline as atmosphere, not as the sole readable text layer.

---

## 6. Use Clipping and Masking Without Hiding Content

`clip-path` and CSS masks can create text compositions that appear cropped by a shape or image. The key distinction is between clipping a decorative layer and clipping essential content. Decorative layers can be clipped aggressively; meaningful text should not lose letters or become inaccessible at any supported viewport.

```css
.hero-art {
  overflow: clip;
}

.hero-art__decorative-word {
  max-width: none;
  white-space: nowrap;
  transform: translateX(-0.08em);
  clip-path: inset(0 0 0 0);
}
```

For an image-backed mask, use a decorative layer and preserve the meaningful headline separately. CSS masking support and syntax vary by technique; test the target browser set and include a fallback that keeps the content readable.

```html
<section class="hero-art" aria-labelledby="masked-title">
  <h1 id="masked-title" class="hero-art__title">Shape the future.</h1>
  <p class="hero-art__copy">A clear message stays readable even without effects.</p>
  <span class="hero-art__texture" aria-hidden="true">FUTURE</span>
</section>
```

```css
.hero-art {
  position: relative;
  isolation: isolate;
  overflow: hidden;
}

.hero-art__title {
  position: relative;
  z-index: 1;
  max-width: 10ch;
}

.hero-art__texture {
  position: absolute;
  z-index: 0;
  inset-inline-end: -0.1em;
  inset-block-end: -0.15em;
  font-size: clamp(5rem, 18vw, 18rem);
  font-weight: 800;
  line-height: 0.8;
  white-space: nowrap;
  opacity: 0.12;
  pointer-events: none;
}
```

This pattern uses oversized background text rather than an actual image mask. It is often the more robust solution when the goal is atmosphere, not a technically complex mask.

---

## 7. Use Oversized Numerals as Editorial Anchors

A large numeral can help distinguish sections, chapters, years, project numbers, or milestones. It should reinforce the information hierarchy rather than compete with the heading. Use a predictable position and a clear contrast relationship.

```html
<section class="chapter" aria-labelledby="chapter-title">
  <span class="chapter__number" aria-hidden="true">03</span>
  <div class="chapter__content">
    <p class="eyebrow">CHAPTER THREE</p>
    <h2 id="chapter-title">A system that scales.</h2>
    <p>Every section uses the same structural rules and a distinct content focus.</p>
  </div>
</section>
```

```css
.chapter {
  position: relative;
  isolation: isolate;
  min-height: 24rem;
  padding: clamp(2rem, 6vw, 5rem);
}

.chapter__number {
  position: absolute;
  z-index: -1;
  inset-block-start: 0;
  inset-inline-end: 0.05em;
  font-size: clamp(8rem, 25vw, 24rem);
  line-height: 0.75;
  font-weight: 800;
  opacity: 0.1;
  pointer-events: none;
}

.chapter__content {
  position: relative;
  max-width: 42rem;
}
```

The `aria-hidden="true"` attribute prevents a purely decorative numeral from being announced in addition to the section label. If the number carries real meaning—such as a visible step number—make it available in the semantic content instead of hiding it.

---

## 8. Layer Type With a Clear Stacking Model

Text overlap can create a compelling composition, but ad hoc `z-index` values quickly become difficult to debug. Start with a positioned parent and define which layers are behind, in front, or interactive. `isolation: isolate` can create a local stacking context for predictable compositing.

```css
.hero-composition {
  position: relative;
  isolation: isolate;
}

.hero-composition__background {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.hero-composition__decorative-type {
  position: absolute;
  z-index: 0;
  pointer-events: none;
}

.hero-composition__content {
  position: relative;
  z-index: 1;
}
```

Do not set negative `z-index` without understanding the ancestor's stacking context and background. A decorative word can disappear behind a parent background or overlap unrelated content if the parent is not isolated.

Keep interactive elements in a predictable layer. A decorative text overlay should not intercept pointer events; use `pointer-events: none` only on elements that are genuinely decorative. Do not apply it to links, buttons, or other controls.

---

## 9. Use Gradient and Image Treatments as Enhancements

Gradient-filled text can work for short display words, but the effect should never make the only meaningful text unreadable. A robust pattern starts with a solid color and then adds the gradient enhancement where supported.

```css
.gradient-title {
  color: var(--text-strong, #171717);
}

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .gradient-title {
    background: linear-gradient(100deg, #8b5cf6, #06b6d4);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
  }
}
```

This example includes a solid-color baseline. The gradient should be checked for contrast across the full glyph area, not just at one endpoint. If the gradient crosses a bright and dark region, some letters may become difficult to distinguish.

For a text-over-image composition, prefer a stable backing panel or overlay when necessary. Do not assume a fixed image will always have the same brightness after responsive cropping. If text overlays an image, test every relevant `object-position`, aspect ratio, and responsive crop.

---

## 10. Make Decorative Text Semantically Quiet

Duplicate text used only for visual texture should not be read aloud repeatedly. Use `aria-hidden="true"` on the decorative duplicate when it is safe to remove from the accessibility tree. Do not apply `aria-hidden="true"` to the only copy of meaningful content, and never hide a focusable control from assistive technology.

```html
<section class="poster" aria-labelledby="poster-title">
  <span class="poster__ghost" aria-hidden="true">LOUD</span>
  <h1 id="poster-title">Make a loud idea clear.</h1>
  <p>Visual emphasis should support the message, not replace it.</p>
</section>
```

The actual heading remains ordinary text, so it can be selected, copied, translated, and announced. The decorative duplicate is omitted from the accessibility tree.

Use meaningful `alt` text for informative images. If an image is only a background texture, CSS background imagery or an empty `alt=""` for a decorative `<img>` may be appropriate depending on the implementation. Do not use an image of text as a replacement for live text when live text can achieve the same purpose.

### Semantics checklist

- One meaningful primary page heading where appropriate.
- Logical heading levels for sections.
- Real links for navigation and real buttons for actions.
- Decorative duplicate text hidden from screen readers where appropriate.
- No essential information conveyed only by outline, opacity, or color.
- Visible focus styles on interactive elements.
- Text remains available when effects fail.

---

## 11. Accessibility: Contrast, Zoom, and Focus

Expressive type still needs to meet readable contrast and resizing expectations. Very thin outlines, low-opacity numerals, transparent fills, and gradients can make the visual treatment look subtle while reducing readability. Decorative layers may be low contrast because they are not content; the actual message must remain sufficiently clear.

Use the WCAG contrast requirements applicable to the text's size and role, and test the actual foreground/background combination. Large display text can qualify under different contrast thresholds than ordinary text, but large text is not a reason to ignore contrast.

```css
.hero-copy {
  max-width: 60ch;
  color: #333;
  background: #fff;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.6rem 0.9rem;
}

.hero-link:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 3px;
}
```

Test at 200% zoom and at 400% zoom where applicable to the target conformance and layout. Text should reflow without forcing unnecessary horizontal scrolling for ordinary content. Oversized display typography may need a smaller fluid minimum at high zoom; do not solve it by clipping the title.

Do not remove browser focus outlines merely because they interrupt the composition. Design a deliberate `:focus-visible` treatment that remains visible against both the background and any overlapping decorative layer.

---

## 12. Responsive Typography and Localization

The best type-led composition is flexible enough to handle different lengths. A short English headline may fit in three lines while another language expands substantially. Font metrics, punctuation, word length, and writing direction can all change the composition.

Use logical properties such as `margin-inline`, `inset-inline-start`, and `padding-block` for layouts that may support different writing directions. Avoid hard-coding all placement with `left` and `right` if the interface is expected to support RTL content.

```css
.hero-title {
  max-width: 11ch;
  font-size: clamp(2.5rem, 9vw, 8rem);
  line-height: 0.96;
  overflow-wrap: break-word;
}

.hero-copy {
  max-width: 62ch;
}

.hero-art__texture {
  inset-inline-end: 0;
}
```

`overflow-wrap: break-word` is a safeguard for unusually long strings, not a substitute for good content widths. Use it where unbroken content could otherwise overflow, and test it with the actual script and font.

For localization, test at least the longest known translation, a right-to-left layout if supported, and a fallback font. If a hard line break is part of the design, make sure it does not produce an awkward or misleading phrase in another language.

---

## 13. Motion and Animated Typography

Animated typography can be effective for a deliberate reveal, but it can also interfere with reading. Keep motion short, avoid infinite movement for non-essential text, and ensure the final message appears even when animation is disabled or JavaScript fails.

```css
.reveal-title {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: no-preference) {
  .js .reveal-title {
    animation: title-enter 520ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
  }
}

@keyframes title-enter {
  from {
    opacity: 0;
    transform: translateY(0.4em);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-title {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

This example keeps the default state visible and applies motion only when the page has an explicit `.js` class and the user has not requested reduced motion. If the class is added by JavaScript, do not hide essential text before the script runs.

### JavaScript reveal guard

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function revealTitle(element) {
  if (!element) return;

  if (reduceMotion.matches) {
    element.classList.add("is-visible");
    return;
  }

  element.classList.add("is-visible");
}
```

This minimal helper intentionally does not hide content or rely on a delayed callback. For a real animation, use CSS or the Web Animations API with a visible fallback, and clean up observers/listeners when components are removed. Do not create motion solely because a scroll observer can trigger it.

---

## 14. Debug With DevTools

When the composition fails, diagnose the layout before adding more offsets. A title that clips might be caused by a fixed height, a parent with `overflow: hidden`, an unexpectedly wide font, an oversized letter-spacing value, a transformed ancestor, or a stacking-context issue.

### Debug sequence

1. Inspect the title's computed `font-size`, `line-height`, `letter-spacing`, `max-width`, and `white-space`.
2. Toggle `overflow`, `clip-path`, and `mask` declarations one at a time.
3. Check the parent and ancestor boxes for fixed heights and clipping.
4. Inspect `position`, `z-index`, `isolation`, `transform`, and stacking contexts.
5. Disable decorative layers to confirm the actual text remains intact.
6. Test the same content with the fallback font.
7. Resize the viewport and test browser zoom.
8. Inspect the rendered font and computed dimensions in DevTools.
9. Verify the visible focus outline is not covered by an overlapping layer.
10. Test reduced motion and confirm the title remains visible.
11. Check the accessibility tree to confirm the decorative duplicate is hidden but the real heading remains.
12. Test keyboard navigation without a pointer.

```js
function inspectTypeComposition(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return;
  }

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  const report = {
    selector,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    whiteSpace: style.whiteSpace,
    overflow: style.overflow,
    position: style.position,
    zIndex: style.zIndex,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight
  };

  console.table(report);
  return report;
}

inspectTypeComposition(".hero-title");
```

The helper gives a useful snapshot of resolved styles and box dimensions. It cannot determine whether a visual composition is readable or semantically correct; combine it with visual, keyboard, zoom, and accessibility-tree inspection.

---

## 15. Before → After: From Screenshot-Only to Resilient Type

### Before

```css
.hero-title {
  position: absolute;
  left: -5rem;
  top: 8rem;
  width: 1400px;
  height: 220px;
  overflow: hidden;
  font-size: 180px;
  white-space: nowrap;
}
```

Problems: fixed pixel geometry, physical-direction positioning, a fixed height, clipping, and forced no-wrap behavior. The title may look right at one viewport but fail with zoom, translation, or fallback fonts.

### After

```css
.hero {
  position: relative;
  isolation: isolate;
  padding: clamp(1.25rem, 5vw, 5rem);
}

.hero-title {
  position: relative;
  max-width: 11ch;
  margin: 0;
  font-size: clamp(2.75rem, 9vw, 8rem);
  line-height: 0.94;
  letter-spacing: -0.04em;
  overflow-wrap: normal;
}

.hero-copy {
  max-width: 60ch;
}

.hero-link:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

The after version uses a fluid scale and content-aware width, avoids a fixed height, and preserves a focus style. Add decorative layers only after this semantic layout works.

---

## 16. Pattern Library

### Pattern 1 — Oversized Responsive Hero

**What it does:** Makes the headline the primary visual feature while keeping its size and width responsive.

**When to use it:** Portfolio landing pages, studio sites, launch pages, and campaigns with a short, stable headline.

```css
.hero-title {
  max-width: 10ch;
  font-size: clamp(3rem, 10vw, 9rem);
  line-height: 0.9;
  letter-spacing: -0.05em;
}
```

**Trade-off:** Very tight tracking can harm readability in some fonts. Test the selected family and real text.

### Pattern 2 — Editorial Section Number

**What it does:** Uses a huge number as a quiet background anchor behind the real section content.

**When to use it:** Long-form portfolios, editorial pages, case studies, or multi-step storytelling.

```css
.section-number {
  position: absolute;
  z-index: -1;
  inset-block-start: 0;
  inset-inline-end: 0;
  font-size: clamp(8rem, 24vw, 22rem);
  line-height: 0.8;
  opacity: 0.1;
  pointer-events: none;
}
```

**Trade-off:** Keep the numeral decorative only if it duplicates the visible section label; use `aria-hidden="true"` in that case.

### Pattern 3 — Outlined Display Word

**What it does:** Adds a stroke-only type layer as visual depth or contrast.

**When to use it:** Short hero words, poster-like section dividers, or a controlled background motif.

```css
.outline-word {
  color: transparent;
  -webkit-text-stroke: 1px currentColor;
}

@supports not (-webkit-text-stroke: 1px currentColor) {
  .outline-word {
    color: currentColor;
  }
}
```

**Trade-off:** Keep a solid readable baseline and test forced-colors and print output. The fallback should not make the only important copy disappear.

### Pattern 4 — Ghost Duplicate Typography

**What it does:** Layers a decorative duplicate behind the real heading.

**When to use it:** A deliberate brand motif where the repeated word creates depth but does not add meaning.

```html
<div class="type-lockup">
  <span aria-hidden="true" class="ghost">FORM</span>
  <h2>Form follows purpose.</h2>
</div>
```

**Trade-off:** Duplicate text must not be announced twice. Hide only the decorative copy from the accessibility tree.

### Pattern 5 — Gradient Display Text

**What it does:** Applies a gradient fill to a short display title.

**When to use it:** A limited brand accent in a hero or launch headline where the gradient remains readable.

```css
.gradient-display {
  color: #222;
}

@supports (-webkit-background-clip: text) {
  .gradient-display {
    background: linear-gradient(100deg, #7c3aed, #0891b2);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}
```

**Trade-off:** Validate contrast throughout the gradient and preserve a solid fallback.

### Pattern 6 — Responsive Editorial Break

**What it does:** Uses an intentional line break only at a breakpoint where it improves composition.

**When to use it:** Stable marketing copy with a known headline and a controlled desktop layout.

```css
.desktop-break { display: none; }

@media (min-width: 58rem) {
  .desktop-break { display: initial; }
}
```

**Trade-off:** Recheck translated content and narrow screens. Natural wrapping is safer for dynamic or user-generated text.

### Pattern 7 — Image-Backed Type With Live Text

**What it does:** Uses a decorative visual layer while keeping the actual title as ordinary HTML text.

**When to use it:** A hero where text appears visually connected to a photo or image treatment.

```css
.image-type {
  position: relative;
  isolation: isolate;
}

.image-type__title {
  position: relative;
  z-index: 1;
}

.image-type__texture {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
```

**Trade-off:** Test image crops and contrast at every breakpoint. Do not bake the only copy of a message into an image.

### Pattern 8 — Motion-Safe Title Reveal

**What it does:** Adds a restrained entrance animation while keeping the final title visible for reduced-motion users and non-animated states.

**When to use it:** A one-time hero entrance where motion supports the narrative and does not delay access to content.

```css
.title-reveal {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: no-preference) {
  .js .title-reveal {
    animation: title-reveal 450ms ease-out both;
  }
}

@media (prefers-reduced-motion: reduce) {
  .title-reveal {
    animation: none;
  }
}
```

**Trade-off:** Avoid hiding the title before the animation starts. The final content should remain available if scripts fail.

---

## 17. Common Mistakes

| Mistake | Why it happens | Specific fix |
|---|---|---|
| Using enormous type without a hierarchy | Scale is mistaken for a complete design concept. | Establish primary, supporting, and decorative roles before selecting display sizes. |
| Hard-coding a desktop headline width | The design is tuned to one screenshot. | Use a responsive max-width and test long content at narrow viewports. |
| Clipping the only real heading | `overflow: hidden` is used to preserve a visual crop. | Keep the semantic heading unclipped and place the crop on a decorative duplicate. |
| Using fixed pixel dimensions for hero text | Pixel values are easy to match to a mockup. | Use `clamp()`, content-driven height, and responsive constraints. |
| Forcing `white-space: nowrap` globally | A desired line break is treated as permanent. | Apply no-wrap only to short decorative fragments and allow the actual heading to wrap. |
| Making the only copy transparent | Outline or gradient effects are treated as required rendering. | Keep a solid-color baseline and test unsupported/forced-colors states. |
| Using text in an image instead of live text | A poster mockup is exported directly as a hero asset. | Keep meaningful text in HTML and use imagery only as decoration. |
| Announcing decorative duplicate text | Decorative layers are added without an accessibility review. | Add `aria-hidden="true"` to duplicate decorative text only. |
| Hiding meaningful content with `aria-hidden` | The attribute is applied to a whole wrapper for convenience. | Hide only the decorative node; verify the real heading remains in the accessibility tree. |
| Ignoring contrast on gradient text | The gradient is checked at only one color stop. | Evaluate contrast over every part of the actual text and use a solid fallback. |
| Letting a numeral overpower content | Decoration is scaled before content is placed. | Lower opacity, move the numeral behind the content, and test reading order. |
| Using negative `z-index` without isolation | Layering is adjusted by trial and error. | Establish a local stacking context and inspect parent backgrounds and stacking contexts. |
| Letting decorative type block clicks | An overlay is positioned over links or buttons. | Add `pointer-events: none` to the decorative layer only. |
| Removing focus outlines for aesthetics | The default outline clashes with the visual composition. | Create a deliberate `:focus-visible` outline with sufficient contrast and offset. |
| Ignoring zoom | The layout is validated only at default browser scale. | Test 200% and 400% zoom as applicable, and allow the headline to reflow. |
| Assuming line breaks translate | A break is designed around one language's phrase length. | Test long translations and make breakpoint-specific breaks optional. |
| Using physical positioning in RTL layouts | The design is authored for left-to-right content only. | Use logical properties such as `inset-inline-start` and `margin-inline`. |
| Animating every line of text | Motion capability is mistaken for useful feedback. | Animate only a small number of intentional display moments. |
| Hiding text until JavaScript runs | Animation code starts from an invisible state. | Make the default state visible and add animation only as an enhancement. |
| Testing only the intended font | The fallback state is ignored. | Block the font request and inspect wrapping, contrast, and overflow. |
| Using a fixed height around a heading | The container is sized to one expected line count. | Prefer content-driven sizing and padding; add minimum height only when necessary. |
| Treating `text-wrap: balance` as guaranteed | Browser line balancing is assumed identical everywhere. | Test supported browsers and preserve a sensible max-width and fallback. |
| Applying `pointer-events: none` to an interactive parent | A decorative rule is placed on a whole component. | Limit the rule to the decorative child and verify the CTA remains clickable. |
| Forgetting print and forced-colors modes | Effects are evaluated only on the designer's display. | Add or verify solid-color fallbacks and test alternate rendering modes. |

---

## 18. Quick Reference

| Situation / property | Starting point | Notes |
|---|---|---|
| Responsive hero size | `font-size: clamp()` | Set a usable minimum and maximum. |
| Display line-height | Around `0.9–1.05` as a starting test | Font metrics vary; verify actual clipping. |
| Display measure | `max-width: 10–12ch` | A starting point, not a universal rule. |
| Supporting copy measure | `max-width: 60–65ch` | Adjust for font and content. |
| Intentional desktop break | `<br class="desktop-break">` | Disable or alter at narrow widths. |
| Balanced heading | `text-wrap: balance` | Test support and actual line breaks. |
| Outlined type | `-webkit-text-stroke` | Keep a solid fallback for unsupported states. |
| Gradient text | `background-clip: text` | Test contrast across the full gradient. |
| Decorative duplicate | `aria-hidden="true"` | Never hide the only meaningful copy. |
| Background numeral | Absolute layer, low opacity | Keep content above it and preserve contrast. |
| Local stacking | `isolation: isolate` | Makes layer relationships easier to reason about. |
| Decorative overlay | `pointer-events: none` | Apply only to non-interactive decoration. |
| Focus style | `:focus-visible` | Must remain visible over all layers. |
| Reduced motion | `prefers-reduced-motion` | Keep the final text visible without animation. |
| Responsive placement | Logical inset properties | Supports writing-direction changes more safely. |
| Overflow debugging | `scrollWidth` and `getBoundingClientRect()` | Compare actual dimensions with the container. |
| Font debugging | DevTools rendered-font panel | Confirm the selected face and fallback. |
| Image-backed title | Live HTML heading + decorative image | Do not bake essential copy into the image. |
| Zoom validation | Browser zoom and reflow | Avoid fixed heights and clipped text. |
| Decorative alt behavior | `alt=""` or CSS background as appropriate | Informative images need meaningful alternative text. |
| Semantic structure | `main`, `section`, `h1`, `h2` | Do not select elements only for default styles. |
| Forced colors | Solid color fallback | Transparent fills may become invisible. |

---

## 19. Specific Build Requirements

1. Write a one-sentence concept for the type-led composition.
2. Label every text layer as primary, supporting, decorative, or interactive.
3. Build the page's semantic heading hierarchy before adding visual effects.
4. Establish the display scale with `clamp()` and verify the minimum and maximum.
5. Test natural wrapping with the actual production headline.
6. Add intentional line breaks only where the copy and responsive behavior justify them.
7. Keep essential text as selectable HTML rather than embedding it only in images.
8. Add outlined or gradient treatments only after a readable baseline exists.
9. Put decorative duplicate text behind the primary copy and hide it from assistive technology where appropriate.
10. Verify text contrast against all backgrounds and gradient regions.
11. Check stacking contexts and ensure decorative overlays do not block controls.
12. Preserve visible `:focus-visible` states for every interactive element.
13. Test keyboard navigation, zoom, narrow viewports, and fallback fonts.
14. Test `prefers-reduced-motion: reduce` for any animated type.
15. Check localization assumptions and RTL layout requirements.
16. Inspect computed styles, rendered fonts, and actual element dimensions in DevTools.
17. Verify the layout still works if clipping, masks, or text-stroke support is unavailable.
18. Record any browser-specific limitation and the selected fallback.

### Build challenge: the hero headline clips after localization

**Scenario:** A portfolio hero uses a large title with a decorative duplicate behind it. The English headline fits at 1440 pixels, but a longer translated title clips on a narrow device and the screen reader announces the decorative duplicate twice.

**Your task:** Identify the fixed geometry or clipping rule causing the visual failure, keep the real title available as semantic text, hide only the duplicate decorative layer, and adjust the responsive scale and content width. Test the longest available translation, the fallback font, 200% zoom, keyboard focus on the CTA, and reduced-motion mode.

**Required evidence:**

- Before/after CSS showing the source of clipping.
- A screenshot or test record at a narrow viewport.
- A record from the accessibility tree confirming only the meaningful title is announced.
- Contrast and focus-state checks.
- Confirmation that the heading remains visible when animation and decorative effects are disabled.

---

## 20. Mental Models

1. **Type is content before it is texture.** Preserve the readable message before decorating it.
2. **Scale establishes hierarchy only when relationships are clear.** Large type without supporting structure is noise.
3. **The actual heading is the source of truth.** Decorative duplicates must not replace semantic content.
4. **Clipping belongs on decoration, not essential information.** The real title must survive viewport changes and zoom.
5. **A screenshot is one state, not a responsive specification.** Test real content, long translations, and fallback fonts.
6. **Every layer needs a job.** Primary text, supporting copy, and decoration should be visually distinct.
7. **Effects are enhancements, not prerequisites for comprehension.** Solid-color text should remain readable.
8. **Stacking contexts should be designed, not guessed.** Establish the parent and layer roles before tuning `z-index`.
9. **Accessibility is part of the composition.** Contrast, focus, semantics, and reduced motion affect the design.
10. **Text should remain text.** Live HTML is more adaptable than a flattened image of words.
11. **Responsive line breaks are content decisions.** A forced break should be reviewed when the words or language change.
12. **Decorative opacity is not a contrast strategy for content.** Low opacity is appropriate only when the text is truly non-essential.
13. **The fallback is a real user experience.** Design it, inspect it, and make sure it does not clip.
14. **Motion should reveal, not delay.** Users should not need to wait for the main message to become available.
15. **Measure before adding offsets.** Computed dimensions and ancestor overflow often explain a clipping bug better than another transform.

---

## 21. Gotchas

> **Gotcha 1 — Transparent text can disappear in alternate rendering modes.** Keep a readable baseline and test forced-colors, print, and unsupported effects.

> **Gotcha 2 — Negative `z-index` is not a universal “send behind everything” command.** The parent stacking context and background determine where the layer appears.

> **Gotcha 3 — Decorative duplication can become duplicate speech.** Hide the visual duplicate from the accessibility tree, but never hide the real heading.

> **Gotcha 4 — `overflow: hidden` may conceal more than decoration.** Check all ancestors and use clipping only where the design can safely lose pixels.

> **Gotcha 5 — `text-wrap: balance` does not guarantee the same line breaks everywhere.** Keep the width flexible and validate the target browsers.

> **Gotcha 6 — Gradient contrast varies across the letters.** A single contrast check at one color stop is not enough.

> **Gotcha 7 — Zoom changes the composition.** Fixed heights and large no-wrap titles often fail when users enlarge text.

> **Gotcha 8 — A decorative overlay can block a button.** Check pointer behavior and keyboard focus independently of the visual stacking.

---

## 22. Definition of Done

- [ ] The design has a clear type-led concept and a documented hierarchy.
- [ ] The semantic heading structure is correct and meaningful.
- [ ] The main headline remains readable without decorative effects.
- [ ] The responsive type scale works at narrow and wide viewports.
- [ ] Line breaks remain reasonable for real content and known translations.
- [ ] Outlined, masked, or gradient effects have a usable fallback.
- [ ] Decorative text is not announced redundantly by assistive technology.
- [ ] Contrast, keyboard navigation, and visible focus have been checked.
- [ ] The layout works with browser zoom and a fallback font.
- [ ] Reduced-motion preferences preserve visible, understandable content.
- [ ] Decorative layers do not intercept controls or hide meaningful text.
- [ ] DevTools inspection confirms expected dimensions and stacking behavior.
- [ ] The localization clipping challenge has been solved and verified.
- [ ] No essential text exists only as pixels in an image.
- [ ] Every decorative layer has a clear purpose and can be removed without losing meaning.

---

## Appendix A — Minimal Semantic Specimen

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Type as Design</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <nav aria-label="Main navigation">
      <a href="#work">Work</a>
      <a href="#about">About</a>
    </nav>
  </header>

  <main>
    <section class="hero" aria-labelledby="hero-title">
      <span class="hero__ghost" aria-hidden="true">MAKE</span>
      <p class="eyebrow">DESIGN / ENGINEERING / CULTURE</p>
      <h1 id="hero-title" class="hero-title">Make room for better ideas.</h1>
      <p class="hero-copy">A concise message with a readable supporting line.</p>
      <a class="hero-cta" href="#work">View selected work</a>
    </section>

    <section id="work" aria-labelledby="work-title">
      <p class="eyebrow">SELECTED PROJECTS</p>
      <h2 id="work-title">Work with intention.</h2>
      <ul>
        <li><a href="#project-one">Project one</a></li>
        <li><a href="#project-two">Project two</a></li>
      </ul>
    </section>

    <aside aria-label="Design note">
      <p>Decorative typography should support the content hierarchy.</p>
    </aside>
  </main>
</body>
</html>
```

```css
:root {
  --display-size: clamp(2.75rem, 9vw, 8rem);
  --section-size: clamp(2rem, 4vw, 3.5rem);
  --measure: 62ch;
  --focus-color: #005fcc;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Editorial Sans", system-ui, sans-serif;
  line-height: 1.6;
}

.site-header {
  padding: 1rem clamp(1rem, 4vw, 3rem);
}

.site-header nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.hero {
  position: relative;
  isolation: isolate;
  display: grid;
  align-content: center;
  min-height: min(88svh, 62rem);
  padding: clamp(1.25rem, 5vw, 5rem);
  overflow: clip;
}

.hero__ghost {
  position: absolute;
  z-index: -1;
  inset-inline-end: -0.05em;
  inset-block-end: 0;
  font-size: clamp(7rem, 26vw, 24rem);
  line-height: 0.75;
  font-weight: 800;
  opacity: 0.1;
  pointer-events: none;
}

.hero-title {
  max-width: 11ch;
  margin: 0;
  font-size: var(--display-size);
  line-height: 0.94;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.hero-copy {
  max-width: var(--measure);
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  width: fit-content;
  padding: 0.6rem 0.9rem;
}

a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid var(--focus-color);
  outline-offset: 3px;
}

h2 {
  font-size: var(--section-size);
  line-height: 1.05;
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

The universal reduced-motion override is a broad safety pattern, not a mandatory design-system rule. In a production system, prefer targeted rules where possible and ensure the override does not remove essential feedback. The main point is that reduced-motion preferences must be tested deliberately.

---

## Appendix B — Handoff Notes

Hand off the following information to the next layer or implementer:

- The type-led concept and intended hierarchy.
- Which text layers are primary, supporting, decorative, or interactive.
- The display scale tokens and the tested viewport range.
- Which line breaks are intentional and where they change.
- The fallback for text-stroke, masking, gradients, and image-backed compositions.
- The semantic handling of decorative duplicates.
- Contrast and focus-state test results.
- Zoom and localization test results.
- Any stacking-context or clipping constraints.
- The reduced-motion behavior for animated type.

Do not hand off a composition that only works at one viewport, hides the only readable title, or requires a decorative effect to explain the content. The type-led design is ready when its message remains clear and semantic across real content, responsive sizes, and alternate rendering states.
