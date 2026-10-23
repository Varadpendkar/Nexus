# Variable Fonts — Production Skill

> **Path:** `layer-02-typography-design/variable-fonts/variable-fonts.md`  
> **Layer:** 02 — Typography & Design System  
> **Purpose:** Implement variable fonts deliberately: understand their axes, declare them correctly, choose the right CSS controls, animate only where useful, and verify rendering, accessibility, and performance.  
> **Use this skill:** When a design needs flexible weight or width, responsive typographic expression, compact multi-weight font delivery, or controlled type animation. For ordinary static font pairing, use `font-pairing.md` first.

---

## Why This Matters

A variable font can contain a continuous range of design variations inside one font file. Instead of shipping separate regular, medium, semibold, and bold files, a project may use one variable font that supports a range such as weight 300–800. Depending on the family, it may also expose width, optical size, slant, italic, or custom axes. This can simplify a typography system and enable subtle responsive changes or expressive motion.

Variable fonts are not automatically smaller, faster, or better than static fonts. File size depends on the family, axis design, glyph coverage, subset strategy, compression, and which static styles would otherwise be shipped. A large variable file can be heavier than a small set of static files. Some fonts expose only one axis; others have several. A CSS declaration cannot invent an axis the font does not contain.

The main engineering challenge is to use the font’s actual capabilities without turning every text element into an animation experiment. Axis values affect visual density, spacing, legibility, and line wrapping. A weight transition can alter the width of a heading; width-axis changes can reflow paragraphs; optical sizing can change detail as text scales; and unsupported axes may be ignored or rendered unexpectedly.

This skill establishes a production-safe workflow for inspecting a variable font, declaring its supported ranges, using standard properties where possible, reaching custom axes with `font-variation-settings` when necessary, and testing reduced-motion, keyboard focus, responsive behavior, and fallback states.

---

## Scope and Non-Goals

This skill covers:

- Understanding the difference between variable and static font files.
- Identifying standard and custom variation axes.
- Declaring variable-font ranges with `@font-face`.
- Using `font-weight`, `font-stretch`, `font-style`, and optical sizing appropriately.
- Using `font-variation-settings` for axes not exposed by high-level CSS properties.
- Building fluid typography without overusing animation.
- Animating axis values with CSS transitions or JavaScript when there is a meaningful purpose.
- Respecting `prefers-reduced-motion`.
- Debugging unsupported axes, synthetic styles, layout shifts, and font loading.
- Verifying the font's language coverage, licensing, and performance impact.

This skill does not replace the `font-pairing` skill, nor does it teach custom font design. It assumes you have selected a font family with a clear role and have verified that the license permits the intended use.

---

## Deliverable

A finished variable-font implementation should include:

1. A documented font file and its supported axes and ranges.
2. A correct `@font-face` declaration with accurate style and weight ranges.
3. Standard CSS properties used for standard axes wherever possible.
4. Custom axis values documented by their four-character axis tags.
5. A responsive specimen showing the selected axes at relevant sizes.
6. A reduced-motion alternative for any non-essential motion.
7. A fallback state that remains readable and usable.
8. DevTools evidence confirming the font loaded and the expected axis is active.
9. A measured comparison of file size and loading behavior against the static-font alternative, when performance is a stated reason for using variable fonts.

---

## 1. Know What a Variable Font Contains

A variable font stores one or more design axes that allow the browser to interpolate between supported instances. A static font contains a fixed design instance for a given style and weight. The exact contents depend on the font file; the file name alone does not establish which axes are available.

### Common axes

- **`wght` — Weight:** Controls the font's weight when supported. In ordinary web CSS, prefer `font-weight`.
- **`wdth` — Width:** Controls glyph width or overall width design when supported. Prefer `font-stretch` for the standard width axis.
- **`opsz` — Optical size:** Allows design details to adapt for different text sizes. Prefer `font-optical-sizing` where supported.
- **`slnt` — Slant:** Controls a slanted style in fonts that expose this axis. Prefer `font-style: oblique` with an appropriate angle range when supported.
- **`ital` — Italic:** A common registered axis for switching italic behavior, but italic support and axis behavior vary by family. Use the font's documented style range.
- **Custom axes:** A font designer may expose additional controls such as grade, roundness, contrast, serif shape, or other family-specific dimensions. These are not universal and must be documented by the font.

A variable font does not have to include every common axis. Never assume that `wght`, `wdth`, and `opsz` are all present just because the font is variable.

```css
@font-face {
  font-family: "Variable Sans";
  src: url("/fonts/variable-sans.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 800;
  font-stretch: 85% 110%;
  font-display: swap;
}

body {
  font-family: "Variable Sans", system-ui, sans-serif;
  font-weight: 400;
}

h1 {
  font-weight: 720;
}
```

The declared ranges must match the font's actual supported range. The example values are illustrative; inspect the font metadata before using them.

### Mental model

The file provides a set of permitted design changes; CSS chooses a point inside those ranges. CSS cannot make a font lighter than its minimum supported weight or wider than its maximum supported width unless the browser synthesizes or otherwise adjusts the result. If a value appears to work beyond the declared range, confirm the actual rendering rather than assuming the font contains that design.

---

## 2. Inspect the Font Before Writing CSS

Start with the font's official specimen, documentation, or metadata. Record the family name, supported axes, minimum and maximum values, style support, language coverage, and license. A downloaded file called `VariableSans-VF.woff2` is not enough evidence by itself.

### Inspection checklist

- Identify whether the file is variable or static.
- Confirm each registered axis and its range.
- Record any custom axes and the meaning of their values.
- Check whether italic is a separate file, a separate style, or an `ital` axis.
- Check the supported glyphs and language subsets.
- Verify the license for web embedding and self-hosting.
- Compare file size with the static files the project would otherwise need.
- Inspect the browser-rendered font after implementation.

If using command-line font tools, inspect metadata with a trusted font inspection utility. Tool output may vary by version, and the exact command depends on the installed package. Do not treat a guessed command or a file name as proof of axis support.

A useful implementation record:

| Field | Example value | Required evidence |
|---|---|---|
| Family | `Product Variable` | Font metadata and browser inspection |
| File | `/fonts/product-variable.woff2` | Successful network request |
| Weight range | `300 800` | Font metadata |
| Width range | `85% 110%` | Font metadata |
| Optical size | `auto` supported | Browser and font documentation |
| Italic | Separate file | Actual file and style declaration |
| Custom axis | `GRAD` | Font designer's axis documentation |
| Script coverage | Latin + required scripts | Glyph coverage and real content test |
| License | Web embedding permitted | License text or official license page |

These are examples, not a recommended font specification.

---

## 3. Declare Supported Ranges Correctly

The `@font-face` descriptors tell the browser which file corresponds to which family, style, and range. For variable fonts, a range can be declared for descriptors such as `font-weight` and `font-stretch` where supported. If the declaration incorrectly describes a static file as a range, the browser may synthesize values or select the wrong face.

```css
@font-face {
  font-family: "Product Variable";
  src: url("/fonts/product-variable-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 800;
  font-stretch: 90% 110%;
  font-display: swap;
}

:root {
  --font-ui: "Product Variable", system-ui, sans-serif;
}

body {
  font-family: var(--font-ui);
  font-weight: 400;
}

h1 {
  font-weight: 720;
}
```

Do not include `font-stretch` range unless the font supports that axis and the relevant browser support meets the project requirements. If a family has a separate italic variable file, declare it separately with `font-style: italic` and the correct ranges.

### Separate italic file example

```css
@font-face {
  font-family: "Product Variable";
  src: url("/fonts/product-variable-italic.woff2") format("woff2");
  font-style: italic;
  font-weight: 300 800;
  font-display: swap;
}

em,
blockquote {
  font-style: italic;
}
```

If the font uses an `ital` axis inside one file, consult its documentation and declare the style range accurately. Do not assume that declaring `font-style: italic` automatically makes a custom italic axis behave correctly for every family.

---

## 4. Prefer Standard CSS Properties for Standard Axes

Use the CSS property that matches the axis when one exists. This communicates intent clearly, integrates with normal typography rules, and avoids accidentally overriding axis values in unrelated declarations.

| Axis | Preferred property | Use `font-variation-settings` when |
|---|---|---|
| `wght` | `font-weight` | A low-level axis-specific adjustment is necessary and documented |
| `wdth` | `font-stretch` | The font exposes unusual width behavior not sufficiently expressed by the high-level property |
| `opsz` | `font-optical-sizing` | A specific numeric optical-size value is required |
| `slnt` | `font-style: oblique <angle>` | A custom slant value cannot be expressed through the standard property |
| `ital` | `font-style: italic` | The font requires explicit low-level axis control and has been tested |
| Custom axis | No universal property | The axis is documented and the design needs it |

```css
.variable-title {
  font-family: "Product Variable", system-ui, sans-serif;
  font-weight: 680;
  font-stretch: 96%;
  font-optical-sizing: auto;
  font-style: normal;
}
```

Support for specific values and axis behavior varies by browser and font. Test the actual target browsers and avoid making the design depend on an unsupported property.

### Avoid redundant low-level settings

This is easy to maintain:

```css
h1 {
  font-weight: 720;
}
```

This is lower-level and may be appropriate only when the project needs direct axis control:

```css
h1 {
  font-variation-settings: "wght" 720;
}
```

Do not casually combine both for the same axis. A later `font-variation-settings` declaration can override or conflict with values that the high-level property would otherwise manage. Keep the axis strategy consistent and document intentional exceptions.

---

## 5. Use `font-variation-settings` for Documented Custom Axes

The `font-variation-settings` property uses four-character axis tags and numeric values. It is a low-level control. The tag must match the font's actual axis, including capitalization, and the value must be within the supported range.

```css
.brand-wordmark {
  font-family: "Brand Variable", system-ui, sans-serif;
  font-variation-settings: "wght" 720, "GRAD" 40;
}
```

This is valid only if the font supports both `wght` and `GRAD` and those values are in range. `GRAD` is shown as an example of a possible grade axis; it is not present in every font.

### Rules for custom axes

- Use the exact four-character axis tag from font documentation.
- Record the valid minimum, default, and maximum values.
- Avoid undocumented values chosen by visual guessing alone.
- Keep the axis settings close to the component or token that needs them.
- Do not use low-level settings to replace a standard property without a clear reason.
- Test the default font and fallback behavior.
- If a custom axis is animated, test performance and motion preferences.
- Keep a sensible static state for users who disable motion.

```css
:root {
  --brand-weight: 650;
  --brand-grade: 0;
}

.brand-title {
  font-family: "Brand Variable", system-ui, sans-serif;
  font-weight: var(--brand-weight);
  font-variation-settings: "GRAD" var(--brand-grade);
}
```

The custom `GRAD` axis in this example is illustrative. If the font does not contain it, remove the declaration rather than expecting the browser to create the feature.

---

## 6. Understand Optical Sizing

Some variable fonts provide an optical-size axis that changes details to suit the intended size. Smaller optical sizes may use more open forms, stronger details, or other adjustments; larger sizes may use refinements intended for display. The actual behavior depends on the typeface.

```css
body {
  font-optical-sizing: auto;
}

.hero-title {
  font-optical-sizing: auto;
  font-size: clamp(3rem, 8vw, 7rem);
}
```

`font-optical-sizing: auto` allows the browser to use optical sizing when the font supports it. It does not create an optical-size axis in a font that lacks one.

If the design requires a fixed optical size, a low-level `opsz` setting may be appropriate after testing. Do not set a fixed optical size by habit; a fixed value can prevent the typeface from adapting as the text changes size.

```css
.caption {
  font-optical-sizing: auto;
  font-size: 0.875rem;
}

.display-title {
  font-optical-sizing: auto;
  font-size: clamp(3rem, 8vw, 7rem);
}
```

Test real punctuation, small counters, and fine strokes. Optical sizing changes can be subtle and family-specific, so the correct choice is based on visible rendering and the font's documentation.

---

## 7. Make Weight Responsive Without Animating Everything

Variable weight can help establish a hierarchy across viewports. A heading may use a moderate weight on a narrow screen and a heavier weight at a large display size. Such a change should be deliberate and tested for line wrapping.

```css
.hero-title {
  font-weight: 620;
  font-size: clamp(2.75rem, 7vw, 6.75rem);
  line-height: 0.98;
}

@media (min-width: 60rem) {
  .hero-title {
    font-weight: 740;
  }
}
```

A fluid weight range can also be expressed through a custom property when the browser and font support the desired behavior, but avoid complex formulas unless the change is visibly useful. Keep a readable minimum weight and inspect the actual glyphs against the background.

### Layout stability warning

Changing weight can change glyph widths. If a title is near a wrapping threshold, the new weight may move a word to another line. Test all breakpoint states and do not assume that a small numeric change has no layout effect.

Use `max-width`, responsive font sizes, and appropriate line-height before applying unusual negative tracking. If the heading must fit a fixed visual frame, reconsider the font, text length, or container rather than clipping text.

---

## 8. Animate Axes Only When Motion Communicates a State

A variable axis can be animated because the font supports intermediate values, but the existence of a continuous range does not mean every interaction should animate typography. Use motion when it reinforces a meaningful interaction or brand moment, not merely to demonstrate a technical capability.

Appropriate examples include a subtle heading-weight response to a deliberate hover state, a focused control that becomes slightly stronger, or a short branded transition on a title. Avoid animating body paragraphs continuously, changing weight on every scroll tick, or causing layout movement while users are reading.

```css
.interactive-title {
  font-weight: 560;
  transition: font-weight 180ms ease-out;
}

.interactive-title:hover,
.interactive-title:focus-visible {
  font-weight: 720;
}

@media (prefers-reduced-motion: reduce) {
  .interactive-title {
    transition: none;
  }
}
```

This example uses the standard `font-weight` property. It works as a variable-axis transition only if the font and browser support the requested intermediate weights. The visual result should remain understandable when the transition is removed.

### Avoid hover-only communication

If the axis change indicates a state, ensure the state is available to keyboard users and does not depend on a pointer hover. Use `:focus-visible` for keyboard focus where appropriate, and preserve visible focus indicators. Do not use typography alone to convey critical status.

---

## 9. Use JavaScript Only When CSS Is Not Enough

A CSS transition is usually preferable for a simple hover or focus response. JavaScript can be useful when a value depends on a real interaction, a measured viewport condition, or an application state. It should not be used to animate every frame of scroll by default.

If JavaScript updates a custom axis, clamp values to the documented range, avoid writing styles when the value has not changed, and ensure the behavior can be disabled for reduced-motion preferences.

```js
const title = document.querySelector("[data-variable-title]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function setTitleWeight(weight) {
  if (!title) return;

  const safeWeight = Math.max(400, Math.min(800, Number(weight)));
  title.style.fontVariationSettings = `"wght" ${safeWeight}`;
}

function handlePointerEnter() {
  if (!reduceMotion.matches) {
    setTitleWeight(740);
  }
}

function handlePointerLeave() {
  setTitleWeight(600);
}

title?.addEventListener("pointerenter", handlePointerEnter);
title?.addEventListener("pointerleave", handlePointerLeave);

reduceMotion.addEventListener("change", (event) => {
  if (event.matches) {
    setTitleWeight(600);
  }
});
```

The numeric bounds must match the actual font's weight range. If the font only supports 300–700, the example must be adjusted. Also ensure that keyboard interaction has an equivalent state if the visual change is meaningful; a pointer-only response is not a complete interaction.

### Robust JavaScript version

For a production interaction, add explicit cleanup if the component mounts and unmounts in a framework. Do not register duplicate listeners on every render. Prefer CSS when it can express the desired behavior without state synchronization.

```js
function attachVariableTitle(title, options = {}) {
  if (!title) return () => {};

  const min = options.min ?? 400;
  const max = options.max ?? 800;
  const resting = options.resting ?? 600;
  const active = options.active ?? 740;
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");

  const apply = (value) => {
    const clamped = Math.max(min, Math.min(max, value));
    title.style.fontVariationSettings = `"wght" ${clamped}`;
  };

  const activate = () => {
    if (!media.matches) apply(active);
  };

  const deactivate = () => apply(resting);

  title.addEventListener("pointerenter", activate);
  title.addEventListener("pointerleave", deactivate);
  title.addEventListener("focus", activate);
  title.addEventListener("blur", deactivate);

  const onMotionChange = () => {
    if (media.matches) deactivate();
  };

  media.addEventListener("change", onMotionChange);
  apply(resting);

  return () => {
    title.removeEventListener("pointerenter", activate);
    title.removeEventListener("pointerleave", deactivate);
    title.removeEventListener("focus", activate);
    title.removeEventListener("blur", deactivate);
    media.removeEventListener("change", onMotionChange);
  };
}
```

This helper is a teaching example. In production, ensure the focus state does not conflict with the normal focus ring, and ensure the title is actually interactive if it receives keyboard focus. Do not add `tabindex="0"` to static text only to make a decorative animation accessible; make the interaction meaningful or remove it.

---

## 10. Respect Reduced Motion and Preserve a Stable State

Motion preferences must be part of the implementation, not a final afterthought. The static state should still look intentional, and disabling motion should not remove essential feedback or make controls ambiguous.

```css
.variable-title {
  font-weight: 600;
  transition: font-weight 200ms ease;
}

.variable-title:hover,
.variable-title:focus-visible {
  font-weight: 740;
}

@media (prefers-reduced-motion: reduce) {
  .variable-title {
    transition: none;
  }

  .variable-title:hover,
  .variable-title:focus-visible {
    font-weight: 600;
  }
}
```

This version disables both the transition and the axis change for users who request reduced motion. A project may instead preserve an immediate state change with no transition, but the choice must be intentional. If a state communicates meaning, preserve that meaning without relying on animation.

Do not use `prefers-reduced-motion` as a substitute for keyboard access or a visible focus indicator. These are separate requirements.

---

## 11. Test Layout, Contrast, and Legibility Across Axis Values

A variable axis can affect more than appearance. Weight can change apparent contrast and glyph width; width changes can affect wrapping; custom axes can change counters and spacing. A useful test matrix includes the minimum, default, and maximum values that the design may use.

### Test matrix

| Test | What to inspect | Why it matters |
|---|---|---|
| Minimum supported weight | Counters, thin strokes, contrast | Text may become too fragile at small sizes. |
| Default weight | Body and UI readability | Establishes the baseline. |
| Maximum intended weight | Darkness, width, crowding | Bold text may overwhelm adjacent content. |
| Width extremes | Line breaks and overflow | Width axes can alter layout substantially. |
| Small text size | Punctuation and counters | Fine details may disappear. |
| Large display size | Shape and spacing | Optical behavior may differ from body text. |
| Long heading | Wrapping across values | Axis changes may move words to another line. |
| Fallback state | Readability and layout | Unsupported or blocked fonts still need to work. |
| Keyboard focus | Visible outline and state | Motion must not obscure focus. |
| Reduced motion | Stable non-animated state | The interface must remain usable without motion. |

Use actual content rather than “Hamburgefontsiv” alone. Include the languages, symbols, and values that the application actually displays.

---

## 12. Debug With DevTools

When an axis appears not to work, do not assume that the browser is broken. The file may not contain that axis, the declaration may be overridden, the requested value may be out of range, or the font may not have loaded.

### Debug sequence

1. Confirm the font request succeeds in the Network panel.
2. Inspect the rendered font, not just the CSS family declaration.
3. Check the actual font metadata for supported axes and ranges.
4. Inspect computed `font-weight`, `font-stretch`, `font-style`, and `font-optical-sizing`.
5. Search for `font-variation-settings` declarations that override other rules.
6. Check whether the element uses a fallback because the requested face or style is unavailable.
7. Compare the same element at two known axis values.
8. Inspect line wrapping and computed dimensions before and after the change.
9. Test with reduced motion enabled.
10. Retest at the narrowest supported viewport and with a cold cache.

```js
function inspectVariableFont(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return;
  }

  const style = getComputedStyle(element);
  const report = {
    selector,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStretch: style.fontStretch,
    fontStyle: style.fontStyle,
    opticalSizing: style.fontOpticalSizing,
    variationSettings: style.fontVariationSettings,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    width: style.width,
    height: style.height
  };

  console.table(report);
  return report;
}

inspectVariableFont(".variable-title");
```

`getComputedStyle()` shows the resolved CSS values, but it does not reliably reveal whether a specific axis is visibly affecting the font or whether every glyph came from the intended font. Confirm with browser font inspection and a controlled comparison.

### What to look for in DevTools

- **Network:** Font request status, file size, cache, duplicate requests, and initiator.
- **Rendered Fonts:** Actual font used to draw the selected text.
- **Computed:** Resolved standard properties and `font-variation-settings`.
- **Styles:** Which rule wins and whether a shorthand resets another declaration.
- **Performance:** Layout shifts and the cost of repeated style updates.
- **Responsive mode:** Wrapping and overflow at the smallest viewport.
- **Accessibility tools:** Keyboard focus, semantic labels, and reduced-motion state.
- **Console:** Failed requests, unsupported declarations, and JavaScript errors.

---

## 13. Before → After: Replace Uncontrolled Axis Settings

### Before

```css
.hero-title {
  font-family: "Variable Brand";
  font-variation-settings: "wght" 900, "wdth" 125, "opsz" 72;
  transition: all 1s;
}
```

Problems: the code assumes all three axes exist and support those values; it gives no fallback; `transition: all` may animate unrelated properties; and the implementation has no reduced-motion behavior.

### After

```css
@font-face {
  font-family: "Variable Brand";
  src: url("/fonts/variable-brand.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 800;
  font-stretch: 85% 110%;
  font-display: swap;
}

.hero-title {
  font-family: "Variable Brand", system-ui, sans-serif;
  font-weight: 680;
  font-stretch: 100%;
  font-optical-sizing: auto;
  transition: font-weight 180ms ease-out;
}

.hero-title:hover,
.hero-title:focus-visible {
  font-weight: 740;
}

.hero-title:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .hero-title {
    transition: none;
  }

  .hero-title:hover,
  .hero-title:focus-visible {
    font-weight: 680;
  }
}
```

The after version still requires verification that the font supports the declared weight and width ranges. It is safer because it uses standard properties for standard axes, limits the transition to one property, includes a fallback, and handles reduced motion.

---

## 14. Pattern Library

### Pattern 1 — Variable Weight Hierarchy

**What it does:** Uses a single variable font to create a consistent range of heading and body weights.

**When to use it:** Product interfaces and design systems where several weights are needed and the font provides a verified range.

```css
@font-face {
  font-family: "UI Variable";
  src: url("/fonts/ui-variable.woff2") format("woff2");
  font-weight: 300 800;
  font-style: normal;
  font-display: swap;
}

body { font-family: "UI Variable", system-ui, sans-serif; font-weight: 400; }
nav { font-weight: 520; }
h1, h2 { font-weight: 700; }
```

**Trade-off:** A variable file may still be larger than the static styles actually needed. Measure the payload.

### Pattern 2 — Optical Sizing by Role

**What it does:** Lets a supporting font adjust optical details as the text size changes.

**When to use it:** Families with a documented optical-size axis used for both compact UI and large editorial headings.

```css
body {
  font-optical-sizing: auto;
  font-size: 1rem;
}

.hero-title {
  font-optical-sizing: auto;
  font-size: clamp(3rem, 8vw, 7rem);
}
```

**Trade-off:** Optical sizing is font-specific. Verify that the font supports it and compare the actual rendered details.

### Pattern 3 — Controlled Hover Weight

**What it does:** Adds a brief weight response to a meaningful hover or focus state.

**When to use it:** A prominent interactive heading or link where the change improves feedback without moving nearby content excessively.

```css
.feature-link {
  font-weight: 550;
  transition: font-weight 160ms ease-out;
}

.feature-link:hover,
.feature-link:focus-visible {
  font-weight: 700;
}

@media (prefers-reduced-motion: reduce) {
  .feature-link { transition: none; }
}
```

**Trade-off:** Weight changes can alter text width. Check wrapping and preserve a visible keyboard focus ring.

### Pattern 4 — Custom Grade Axis

**What it does:** Adjusts the stroke grade while aiming to preserve glyph dimensions, if the font provides a documented grade axis.

**When to use it:** A family with a supported grade axis where a slight change in visual darkness is needed without changing the overall typographic role.

```css
.dense-label {
  font-family: "Brand Variable", system-ui, sans-serif;
  font-variation-settings: "GRAD" 20;
}
```

**Trade-off:** The `GRAD` axis is not universal. Do not ship this declaration until the font's metadata confirms it.

### Pattern 5 — Responsive Width Axis

**What it does:** Uses a supported width range to help a large display title adapt to a constrained layout.

**When to use it:** A branded hero where the chosen font includes a real width axis and the design needs controlled width variation.

```css
.hero-title {
  font-stretch: 100%;
  max-width: 12ch;
}

@media (max-width: 40rem) {
  .hero-title {
    font-stretch: 92%;
  }
}
```

**Trade-off:** Width changes can alter letterforms and wrapping. Use only a verified range and test legibility at the narrowest size.

### Pattern 6 — Static Fallback With Variable Enhancement

**What it does:** Uses a stable fallback stack while the browser loads the variable font.

**When to use it:** Public-facing sites where readability and graceful loading matter.

```css
@font-face {
  font-family: "Product Variable";
  src: url("/fonts/product-variable.woff2") format("woff2");
  font-weight: 300 800;
  font-display: swap;
}

body {
  font-family: "Product Variable", Arial, sans-serif;
}
```

**Trade-off:** The fallback may wrap differently. Test cold-cache behavior and consider metric adjustment only when supported by evidence.

### Pattern 7 — Reduced-Motion Axis Interaction

**What it does:** Provides a responsive axis state while removing non-essential transition for people who request reduced motion.

**When to use it:** Interactive headings or links whose weight change is useful but not essential.

```css
.nav-link {
  font-weight: 500;
  transition: font-weight 180ms ease;
}

.nav-link:hover,
.nav-link:focus-visible {
  font-weight: 680;
}

@media (prefers-reduced-motion: reduce) {
  .nav-link { transition: none; }
}
```

**Trade-off:** The axis state may still change immediately. If even that change is distracting, keep a single weight for reduced-motion users.

### Pattern 8 — Debuggable Axis Tokens

**What it does:** Stores custom axis values in named variables so designers can tune a limited number of states.

**When to use it:** A brand system with a documented custom axis and more than one component using it.

```css
:root {
  --display-weight: 680;
  --display-grade: 0;
}

.brand-title {
  font-weight: var(--display-weight);
  font-variation-settings: "GRAD" var(--display-grade);
}
```

**Trade-off:** Tokens do not validate the font's axis range. Document and test permitted values.

---

## 15. Common Mistakes

| Mistake | Why it happens | Specific fix |
|---|---|---|
| Assuming every variable font has every axis | “Variable” is treated as a standard feature set. | Inspect the exact font metadata and document the supported axes and ranges. |
| Declaring a static file as a variable range | A single file name is mistaken for evidence of interpolation. | Map each `@font-face` range to the actual font asset and verify its metadata. |
| Using `font-variation-settings` for weight everywhere | Low-level syntax looks more powerful than standard CSS. | Prefer `font-weight` for `wght` and use low-level controls only for a documented reason. |
| Setting out-of-range axis values | Values are copied from another font or guessed. | Use the documented min/max and confirm the rendered result. |
| Combining high-level and low-level values carelessly | Two declarations attempt to control the same axis. | Choose one control strategy per axis and test the cascade. |
| Animating `font-variation-settings` without testing | Continuous interpolation is assumed to be supported and attractive. | Test the exact browser/font pair and provide a stable reduced-motion state. |
| Using `transition: all` | It is a quick shortcut for adding motion. | Transition only the intended property and avoid unexpected layout or color changes. |
| Animating body copy on scroll | The axis range is treated as a novelty effect. | Restrict motion to meaningful interaction or remove it. |
| Ignoring reduced motion | Motion is reviewed only on the developer's own settings. | Add `@media (prefers-reduced-motion: reduce)` and test the preference in DevTools. |
| Using pointer-only animation | The interaction is designed around a mouse. | Provide an equivalent keyboard state when meaningful and retain visible focus. |
| Assuming variable files are always smaller | One file is assumed to beat every static combination. | Compare transferred bytes against the exact static styles the project would ship. |
| Ignoring language subsets | A Latin specimen is treated as full coverage. | Test all required scripts and ensure subsets contain production characters. |
| Preloading every variable font | Preloading is used without checking the critical path. | Preload only the file needed for initial content and inspect the Network waterfall. |
| Using a custom axis without documentation | The tag is discovered in a random snippet. | Confirm the four-character tag and range in the font's official documentation. |
| Forgetting the fallback | Testing always occurs with a warm cache. | Test with the custom font blocked and verify readability and layout. |
| Changing weight near a wrapping threshold | Width changes are not considered part of typography. | Test long headings at all axis values and tune width or size before adding fixed heights. |
| Assuming `getComputedStyle()` proves an axis works | Computed CSS is mistaken for rendered glyph evidence. | Compare actual rendering and inspect the rendered font in DevTools. |
| Adding `tabindex` only for animation | Static text is made focusable to trigger a decorative effect. | Make the content genuinely interactive or remove the focus-dependent animation. |
| Forgetting cleanup for JavaScript listeners | A demo helper is copied into a component lifecycle. | Return cleanup logic and register listeners once per mounted element. |
| Clamping to an invented range | Example bounds are copied unchanged. | Set bounds from the actual font metadata and test the minimum and maximum. |
| Ignoring width-axis side effects | Width is treated as purely decorative. | Check line wrapping, overflow, and glyph shape at every responsive state. |
| Using optical sizing on a font without the axis | The property is assumed to create optical behavior. | Confirm axis support and use a family that actually provides it if needed. |
| Leaving `font-display` accidental | Loading behavior is never evaluated. | Choose a strategy and test cold-cache text visibility and layout stability. |
| Treating reduced motion as the only accessibility requirement | Motion settings are considered the full interaction review. | Also check keyboard access, focus visibility, contrast, semantics, and zoom. |

---

## 16. Quick Reference

| Situation / property | Starting point | Notes |
|---|---|---|
| Weight axis | `font-weight` | Use only the font's supported range. |
| Width axis | `font-stretch` | Confirm the family has a width axis. |
| Optical size | `font-optical-sizing: auto` | Requires font support for optical sizing. |
| Slant | `font-style: oblique <angle>` | Verify the supported style range. |
| Italic | `font-style: italic` | May use a separate file or documented axis. |
| Custom axis | `font-variation-settings` | Use the exact four-character tag and range. |
| Variable `@font-face` weight | `font-weight: 300 800` | Example only; match real metadata. |
| Variable width range | `font-stretch: 85% 110%` | Declare only if supported. |
| Font loading | `font-display: swap` | Test layout shift and fallback behavior. |
| Critical font preload | `rel="preload"` | Limit to fonts required for initial rendering. |
| Simple axis interaction | CSS transition | Avoid JavaScript when CSS is enough. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | Keep a useful static state. |
| Keyboard focus | `:focus-visible` | Never let axis animation obscure the outline. |
| Computed styles | `getComputedStyle()` | Useful for CSS values, not proof of rendered glyph source. |
| Rendered font | Browser font inspector | Confirms which font drew the selected text. |
| Font request | DevTools Network | Check status, size, cache, and CORS. |
| Layout movement | Performance panel | Test cold cache and font swap. |
| Axis range | Font metadata | Do not infer from file name or another font. |
| File size | Compare transfer bytes | Variable fonts are not automatically smaller. |
| Glyph coverage | Required script specimen | Test actual production characters. |
| CSS axis tags | Four-character identifiers | Match exact spelling and case. |
| Fallback | System stack | Keep content usable when the custom font fails. |

---

## 17. Specific Build Requirements

Complete these steps in a working specimen before calling the implementation finished.

1. Choose a variable font whose license permits the intended use.
2. Record its supported axes, axis tags, and min/default/max values.
3. Verify which languages and scripts the font supports.
4. Compare the variable file size against the static files the project would otherwise use.
5. Declare `@font-face` with the correct family, style, and supported ranges.
6. Use standard CSS properties for standard axes wherever possible.
7. Use `font-variation-settings` only for documented custom or explicitly required low-level axes.
8. Define a fallback stack and test it with the custom font disabled.
9. Create a specimen with body text, headings, controls, numerals, punctuation, and long labels.
10. Test the minimum, default, and maximum intended weights.
11. Test any width or custom axis at values actually used by the design.
12. Confirm the page does not overflow at the narrowest supported viewport.
13. Check focus states and keyboard behavior for any interactive axis effect.
14. Test with `prefers-reduced-motion: reduce` enabled.
15. Inspect font requests and rendered fonts in DevTools.
16. Record whether variable-font delivery actually improves the project's performance.
17. Document any axes that are intentionally unused and why.
18. Remove experimental axis declarations that have no approved role in the design.

### Build challenge: axis support is assumed but missing

**Scenario:** A heading is supposed to become narrower on mobile. The CSS uses `font-variation-settings: "wdth" 85`, but the title looks unchanged and still wraps awkwardly. The developer proposes reducing the font size globally.

**Your task:** Confirm whether the font includes a `wdth` axis, inspect the loaded face and computed styles, and determine whether the declaration is ignored, overridden, or outside the supported range. If the font does not support width variation, choose a supported responsive strategy rather than inventing an axis. Verify that the final heading remains readable and does not clip at 320 CSS pixels.

**Required evidence:**

- The font's documented axis list and ranges.
- A DevTools screenshot or written record of computed styles and the rendered font.
- A network check confirming the correct font file loaded.
- The final responsive CSS and the reason it matches the font's actual capabilities.
- A reduced-motion test if the implementation includes animation.
- A keyboard focus check if the axis is tied to interaction.

---

## 18. Mental Models

1. **The font file defines the available design space.** CSS selects values; it does not create missing axes.
2. **Standard axes deserve standard properties.** Prefer `font-weight`, `font-stretch`, and `font-style` when they express the needed behavior.
3. **A variable font is a range, not an unlimited control.** Stay inside the documented values.
4. **Continuous interpolation does not mean motion is necessary.** Animate only when it improves interaction or communicates a useful state.
5. **Every axis can affect layout.** Weight and width changes can move words and alter component height.
6. **A fallback is part of the rendered product.** The page must work before the font arrives and when it never arrives.
7. **File count is not the same as file size.** Measure the actual files the project will transfer.
8. **The browser's computed family is not the whole truth.** Confirm which font rendered the glyphs.
9. **Custom axis tags are a contract with the font.** Use the exact tag and range from its documentation.
10. **Reduced motion must leave a complete design.** The non-animated state should be deliberate and understandable.
11. **Responsive typography is content-aware.** Test long strings at every relevant axis value.
12. **One variable file may still need separate italic or script files.** Inspect the real font package.
13. **Performance improvements require evidence.** Compare network transfer and loading behavior rather than assuming a win.
14. **A decorative effect does not justify a keyboard trap or fake control.** Keep interaction semantics honest.
15. **Debug the source of the behavior before tuning values.** Confirm file, axis, cascade, and viewport first.

---

## 19. Gotchas

> **Gotcha 1 — Axis tags are case-sensitive identifiers.** A custom axis tag copied with the wrong capitalization may not have the intended effect. Use the exact four-character tag from the font metadata.

> **Gotcha 2 — A variable file may not include italic.** Some families provide italic as a separate file or do not offer it at all. Declare and test the actual style assets.

> **Gotcha 3 — `font-variation-settings` can fight higher-level CSS.** Avoid controlling the same axis through unrelated declarations without a documented reason. Inspect the cascade.

> **Gotcha 4 — The variable font may be heavier than expected.** Compare actual compressed transfer sizes against the static combinations you would ship.

> **Gotcha 5 — A width axis can change the whole layout.** A narrower glyph design can still produce unexpected line breaks at different sizes. Test the full responsive specimen.

> **Gotcha 6 — Reduced motion does not automatically remove all axis changes.** Decide whether the reduced-motion state should be immediate or static, and implement it explicitly.

> **Gotcha 7 — `getComputedStyle()` cannot prove that the intended font drew the text.** Use the browser's rendered-font inspection and network evidence as well.

> **Gotcha 8 — A fallback may not support the custom axis.** The font may load correctly in one state and lose the effect when blocked. Keep the fallback visually acceptable without the axis.

---

## 20. Definition of Done

- [ ] The exact font file and its license have been verified.
- [ ] Supported axes, tags, and ranges are documented from reliable font metadata.
- [ ] `@font-face` declarations accurately describe the actual file and style range.
- [ ] Standard axes use standard CSS properties wherever appropriate.
- [ ] Custom axis declarations use valid documented tags and values.
- [ ] The specimen has been checked at minimum, default, and maximum intended values.
- [ ] Responsive headings and controls do not clip or overflow when axes change.
- [ ] The fallback state remains readable with the web font blocked.
- [ ] Any axis animation has a meaningful purpose and a reduced-motion alternative.
- [ ] Interactive axis changes work for keyboard users and preserve visible focus.
- [ ] The Network panel confirms the intended file loaded without unexplained duplicate requests.
- [ ] The rendered-font inspector confirms the intended family is drawing the text.
- [ ] Performance claims are supported by a measured file-size and loading comparison.
- [ ] The build challenge has been solved by verifying font capabilities, not by assuming an axis exists.
- [ ] Unused experiments and undocumented axis values have been removed.

---

## 21. Final Review Checklist

Before handing the variable-font implementation to the next design-system layer, confirm:

- **Capabilities:** Are the axes and ranges based on the actual font, not assumptions?
- **CSS intent:** Are standard properties used for standard axes?
- **Custom axes:** Are tags, ranges, and reasons documented?
- **Visual quality:** Does the font remain legible at all selected values?
- **Responsive behavior:** Does weight or width variation alter wrapping in an acceptable way?
- **Fallback:** Does the page remain coherent if the font is unavailable?
- **Motion:** Is animation restrained and disabled or adapted for reduced-motion users?
- **Keyboard access:** Are meaningful states reachable without a pointer?
- **Debug evidence:** Have computed values, rendered fonts, and network requests been inspected?
- **Performance:** Has the file-size benefit been measured rather than assumed?
- **Localization:** Have all required scripts and production characters been tested?
- **Maintenance:** Can another developer identify which axes are allowed and why?

A variable-font system is ready when it uses the real capabilities of the font, behaves predictably in supported browsers, and improves the product without introducing unnecessary motion or layout instability.

---

## Appendix A — Minimal Production Skeleton

Use this as a starting point only after checking the actual font metadata and licensing.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Variable font specimen</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header>
    <nav aria-label="Main navigation">
      <a href="#overview">Overview</a>
      <a href="#examples">Examples</a>
    </nav>
  </header>

  <main id="overview">
    <section aria-labelledby="page-title">
      <p class="eyebrow">VARIABLE TYPE / SPECIMEN</p>
      <h1 id="page-title" class="variable-title">
        A type system with room to move.
      </h1>
      <p class="intro">
        Variable axes are useful when they improve hierarchy, responsiveness,
        or interaction. They are not a requirement for every interface.
      </p>
    </section>

    <section id="examples" aria-labelledby="examples-title">
      <h2 id="examples-title">Compare the selected weights</h2>
      <p class="weight-sample weight-light">Weight 350 — light sample</p>
      <p class="weight-sample weight-regular">Weight 450 — regular sample</p>
      <p class="weight-sample weight-bold">Weight 740 — bold sample</p>
      <a class="feature-link" href="#overview">Return to overview</a>
    </section>
  </main>
</body>
</html>
```

```css
@font-face {
  font-family: "Product Variable";
  src: url("/fonts/product-variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 800;
  font-display: swap;
}

:root {
  --font-ui: "Product Variable", system-ui, sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-ui);
  font-weight: 400;
  line-height: 1.6;
}

main {
  width: min(100% - 2rem, 72rem);
  margin-inline: auto;
}

.variable-title {
  max-width: 12ch;
  font-size: clamp(2.75rem, 8vw, 7rem);
  font-weight: 680;
  line-height: 0.96;
  font-optical-sizing: auto;
}

.weight-light { font-weight: 350; }
.weight-regular { font-weight: 450; }
.weight-bold { font-weight: 740; }

.feature-link {
  font-weight: 520;
  transition: font-weight 160ms ease-out;
}

.feature-link:hover,
.feature-link:focus-visible {
  font-weight: 700;
}

a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .feature-link {
    transition: none;
  }
}
```

If the selected font does not support the displayed weight range, update the sample values. The specimen should reflect the actual file rather than a hypothetical font.

---

## Appendix B — Handoff Notes

Provide the next contributor with:

- The exact font file paths and licenses.
- The documented axis tags and supported ranges.
- The `@font-face` declarations used by the project.
- The approved values for each axis and which components may use them.
- The fallback family and its observed differences.
- A note about the file-size comparison if variable-font delivery was selected for performance.
- The reduced-motion behavior for any animated axis.
- Browser and viewport test results.
- Any known limitations around italic, custom axes, or language coverage.

Do not hand off a variable-font implementation with unknown axis support, undocumented custom values, or motion that cannot be disabled. Those are unresolved implementation decisions, not harmless details.
