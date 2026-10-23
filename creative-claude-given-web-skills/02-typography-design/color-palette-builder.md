# Color Palette Builder — Production Skill

> **Path:** `layer-02-typography-design/color-palette-builder/color-palette-builder.md`  
> **Layer:** 02 — Typography & Design System  
> **Purpose:** Build a coherent, accessible color system from a small set of design decisions: hue relationships, HSL/HWB or perceptual color exploration, semantic tokens, dark-mode surfaces, interaction states, and contrast validation.  
> **Use this skill:** At the start of every project, before styling components. Define the palette and semantic tokens in `:root` so components consume consistent roles instead of scattered hex values.

---

## Why This Matters

A color palette is not a bag of attractive swatches. It is a system that explains which colors carry meaning, which colors establish hierarchy, which colors are surfaces, and which colors communicate interaction or status. Without that system, a project accumulates unrelated hex values, dark-mode overrides become inconsistent, and accessible contrast is discovered too late.

The goal is not to select a single accent and then guess the rest. A useful palette separates **brand colors**, **neutral surfaces**, **text roles**, **borders**, **interactive states**, and **semantic status colors**. It defines how those roles change across themes and how the interface behaves when colors are unavailable, overridden, or viewed in a high-contrast environment.

This skill describes a practical workflow for creating color tokens, building light and dark themes, evaluating contrast, using HSL and other color spaces thoughtfully, and testing real components. Color-space values are tools for exploration, not guarantees of accessibility or perceptual consistency. A hue that looks balanced in a color picker can still fail contrast, become muddy in dark mode, or lose meaning for users with color-vision deficiencies.

Use this skill before individual components are styled. Component authors should consume the system's semantic tokens rather than inventing new colors for each card, button, chart, or message.

---

## Scope and Non-Goals

This skill covers:

- Defining neutral, brand, accent, and semantic status palettes.
- Building named color scales and semantic tokens.
- Exploring colors with HSL, HWB, RGB, hex, and perceptual color spaces.
- Creating light and dark themes with consistent roles.
- Establishing accessible text, border, icon, and focus colors.
- Designing hover, active, disabled, selected, and focus states.
- Using CSS custom properties as the palette API.
- Testing contrast and non-color cues.
- Handling forced colors, high contrast, transparency, gradients, and chart colors.
- Debugging computed colors in DevTools.

This skill does not prescribe a single brand hue, require a specific design language, or guarantee that any palette is accessible merely because it uses a particular formula. Contrast must be tested against the actual rendered background. Brand expression is important, but it does not override readability or interaction clarity.

---

## Deliverable

A finished palette should include:

1. A neutral scale for backgrounds, surfaces, text, borders, and overlays.
2. A documented brand palette and accent role.
3. Semantic tokens for success, warning, danger, and informational states.
4. A consistent token naming convention.
5. Light and dark theme mappings when both themes are supported.
6. Focus, hover, active, disabled, selected, and visited-state decisions where relevant.
7. Contrast test results for real text and important UI boundaries.
8. Non-color cues for status, errors, selection, and charts.
9. A fallback strategy for forced-colors or high-contrast settings.
10. A short record of token decisions and known limitations.

---

## 1. Start With Roles, Not Individual Hex Values

Before choosing exact colors, list the roles the interface needs. This prevents a common failure mode: every component receives a color chosen in isolation, and the same semantic role appears differently across the product.

Start with these role groups:

- **Canvas:** The page's broadest background.
- **Surface:** Cards, menus, panels, dialogs, and elevated regions.
- **Text:** Primary, secondary, muted, inverse, and link text.
- **Border:** Subtle separators, strong boundaries, and interactive outlines.
- **Brand:** The core identity color and its usable variants.
- **Accent:** A limited supporting color for emphasis.
- **Status:** Success, warning, danger, and information.
- **Interaction:** Hover, active, selected, focus, and disabled states.
- **Overlay:** Scrims, shadows, and translucent layers.
- **Data visualization:** Categorical and sequential colors for charts.

The roles can share the same raw color when that is appropriate, but the components should reference semantic names. For example, a brand blue may also be the primary action color in light mode, while dark mode uses a lighter brand tint for readable text and focus outlines.

```css
:root {
  --color-canvas: #ffffff;
  --color-surface: #f7f8fa;
  --color-surface-raised: #ffffff;

  --color-text: #1a1d24;
  --color-text-muted: #5a6270;
  --color-border: #d8dde5;

  --color-brand: #2457d6;
  --color-accent: #8b5cf6;

  --color-success: #16794a;
  --color-warning: #8a5200;
  --color-danger: #b42318;
  --color-info: #155eef;
}
```

These values are examples, not an approved accessible palette. Test each role against its real background and adjust based on the product's visual and accessibility requirements.

---

## 2. Choose a Neutral Scale First

Neutrals occupy most of many interfaces. Their relationships determine whether content feels crisp, soft, dense, warm, or clinical. If the neutral system is weak, a strong brand color cannot rescue the overall hierarchy.

Build a small scale rather than inventing a unique gray for every component. A scale might include `0`, `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, and `950`, but the exact steps depend on the design. Name raw scales separately from semantic roles.

```css
:root {
  --neutral-0: #ffffff;
  --neutral-50: #f8fafc;
  --neutral-100: #f1f5f9;
  --neutral-200: #e2e8f0;
  --neutral-300: #cbd5e1;
  --neutral-400: #94a3b8;
  --neutral-500: #64748b;
  --neutral-600: #475569;
  --neutral-700: #334155;
  --neutral-800: #1e293b;
  --neutral-900: #0f172a;
  --neutral-950: #020617;
}
```

A neutral scale should be evaluated as a set. Some scales are cool and blue-biased; others are warm, green-biased, or close to neutral gray. Keep the temperature intentional so that surfaces, borders, and text do not look like they came from unrelated systems.

### Neutral scale review

- Place the swatches side by side and inspect the progression.
- Check text against every surface role it will use.
- Avoid using a middle gray for every secondary role by habit.
- Keep border colors visible enough to identify controls and boundaries.
- Test the scale in both bright and dim environments.
- Verify that dark-mode surfaces differ enough to establish hierarchy without relying only on shadows.

---

## 3. Understand HSL Without Treating It as a Perceptual Guarantee

HSL represents hue, saturation, and lightness. It is useful for expressing a family of colors with a shared hue, such as a set of brand tints and shades. However, equal changes in HSL lightness do not necessarily produce equal perceived brightness, and colors with the same lightness percentage can have very different luminance and contrast.

```css
:root {
  --brand-hue: 222;
  --brand-saturation: 72%;

  --brand-100: hsl(var(--brand-hue) var(--brand-saturation) 94%);
  --brand-300: hsl(var(--brand-hue) var(--brand-saturation) 78%);
  --brand-500: hsl(var(--brand-hue) var(--brand-saturation) 52%);
  --brand-700: hsl(var(--brand-hue) var(--brand-saturation) 36%);
  --brand-900: hsl(var(--brand-hue) var(--brand-saturation) 20%);
}
```

This syntax uses modern space-separated HSL notation. Confirm the project's browser support requirements and use a compatible syntax if older environments must be supported.

HSL is a useful editing model, not an accessibility test. Always calculate or measure contrast using the actual rendered colors. A saturated yellow and a saturated blue at the same HSL lightness will not have the same perceived brightness.

### Better palette exploration

1. Choose a core brand hue from the brand brief or visual direction.
2. Create several candidate tints and shades.
3. Compare them against the neutral scale, not in isolation.
4. Check the actual foreground/background pairings.
5. Adjust the hue or saturation if the shade becomes muddy or too vivid.
6. Validate on real UI components and representative content.
7. Record which values are approved tokens and which remain exploratory.

---

## 4. Know When to Use Other Color Spaces

RGB and hex are practical for implementation. HSL is easy for hue-based adjustments. HWB can be convenient for thinking about whiteness and blackness. OKLCH and related perceptual spaces can be useful for constructing more perceptually even ramps. No color space removes the need for visual review or contrast testing.

```css
:root {
  --accent-exploration: oklch(0.68 0.16 285);
}
```

Treat this as a candidate color, not a universal recommendation. The exact appearance depends on the chosen values, gamut, browser support, and display. Wider-gamut colors may be clipped or mapped differently on different devices.

When using modern color functions, verify the target browsers and provide a fallback where necessary:

```css
.button-primary {
  background-color: #2457d6;
  background-color: oklch(0.49 0.19 263);
  color: #ffffff;
}
```

The second declaration will be used where supported. This is safe only if both declarations have been reviewed for the same role and the fallback still provides adequate contrast. Do not assume that an OKLCH value is accessible just because its lightness appears reasonable.

---

## 5. Separate Raw Scales From Semantic Tokens

Raw scale tokens describe available colors; semantic tokens describe what a color means in the interface. This separation lets a theme change the mapping without forcing component authors to learn the underlying palette.

```css
:root {
  /* Raw values */
  --blue-600: #2457d6;
  --blue-700: #1d46ad;
  --gray-50: #f8fafc;
  --gray-900: #0f172a;

  /* Semantic roles */
  --color-canvas: var(--gray-50);
  --color-surface: #ffffff;
  --color-text: var(--gray-900);
  --color-action: var(--blue-600);
  --color-action-hover: var(--blue-700);
}
```

Avoid names such as `--light-blue` or `--dark-gray` as the only API for components. Those names describe appearance, not intent. A semantic token like `--color-text-muted` is easier to remap for a theme or a component context.

### Naming guidance

Prefer a consistent scheme such as:

- `--color-canvas`
- `--color-surface`
- `--color-surface-raised`
- `--color-text`
- `--color-text-muted`
- `--color-border`
- `--color-border-strong`
- `--color-action`
- `--color-action-hover`
- `--color-focus-ring`
- `--color-status-success`
- `--color-status-warning`
- `--color-status-danger`
- `--color-status-info`

A token is not useful just because it exists. Remove unused tokens, document context-specific exceptions, and avoid proliferating nearly identical semantic names.

---

## 6. Build a Light Theme With Explicit Contrast Roles

A light theme commonly uses a light canvas, white or near-white surfaces, dark text, and darker versions of brand colors for text or action boundaries. The important part is not the convention; it is that each pairing is intentional and tested.

```css
:root,
[data-theme="light"] {
  color-scheme: light;

  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;

  --color-text: #172033;
  --color-text-muted: #4b5565;
  --color-text-inverse: #ffffff;

  --color-border: #cbd5e1;
  --color-border-strong: #64748b;

  --color-action: #2457d6;
  --color-action-hover: #1d46ad;
  --color-action-text: #ffffff;
  --color-focus-ring: #005fcc;
}
```

Do not assume that `--color-text-muted` is readable on every surface because it looks dark enough on the canvas. If cards, badges, input fields, and overlays use different backgrounds, test each meaningful pairing.

The `color-scheme` property helps browser-provided controls adapt to the theme. It does not recolor your custom components automatically.

---

## 7. Build a Dark Theme From Surface Relationships

A dark theme is not simply the light theme with every color inverted. Pure black backgrounds and bright saturated accents can create harsh contrast; using multiple neutral surface levels can establish hierarchy without making every panel glow.

```css
[data-theme="dark"] {
  color-scheme: dark;

  --color-canvas: #0b1020;
  --color-surface: #121a2b;
  --color-surface-raised: #1a2539;

  --color-text: #f1f5f9;
  --color-text-muted: #c0cad8;
  --color-text-inverse: #111827;

  --color-border: #334155;
  --color-border-strong: #64748b;

  --color-action: #8ab4ff;
  --color-action-hover: #b0ccff;
  --color-action-text: #101827;
  --color-focus-ring: #a7c7ff;
}
```

These are example values and must be tested. A dark theme often needs a lighter action color for text or focus, while a filled action button may use a different background and foreground pair. Do not reuse a single brand token for every action context without checking contrast.

### Dark-theme review

- Compare canvas, surface, and raised surface together.
- Ensure muted text remains readable rather than becoming decorative gray.
- Avoid pure white body text everywhere if a softer neutral improves comfort without reducing contrast.
- Check borders around form fields and interactive controls.
- Review brand and status colors against all dark surfaces.
- Confirm shadows are not the only way to distinguish elevation.
- Test screenshots on both bright and dim displays.

---

## 8. Map Themes With Semantic Tokens

The component should ask for a role, not a theme-specific color. A button uses `--color-action`; the theme determines the value. This prevents a component stylesheet from collecting separate hex values for light and dark mode.

```css
.button-primary {
  color: var(--color-action-text);
  background: var(--color-action);
  border: 1px solid transparent;
}

.button-primary:hover {
  background: var(--color-action-hover);
}

.card {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

If a component needs a truly different semantic role in a theme, define a token for that role rather than adding ad hoc overrides to the component. Theme mappings belong in a central location.

```css
[data-theme="dark"] {
  --color-action: #8ab4ff;
  --color-action-hover: #b0ccff;
  --color-action-text: #101827;
}
```

Keep theme selectors consistent. If the application uses `data-theme`, do not introduce a second unrelated `.dark-mode` convention unless there is a clear migration plan.

---

## 9. Define Interaction States Deliberately

Every interactive component should have a visible default state and clear hover, active, focus, disabled, and selected states as appropriate. Do not rely on a subtle color shift alone when the state is important. Use shape, text, icon, border, or other cues as well.

```css
.button-primary {
  color: var(--color-action-text);
  background: var(--color-action);
  border: 2px solid transparent;
}

.button-primary:hover {
  background: var(--color-action-hover);
}

.button-primary:active {
  transform: translateY(1px);
}

.button-primary:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}

.button-primary:disabled,
.button-primary[aria-disabled="true"] {
  opacity: 0.55;
  cursor: not-allowed;
}
```

Opacity can reduce the contrast of text and icons inside a disabled control. Test the rendered result rather than assuming a disabled control is exempt from all usability expectations. Native `disabled` and `aria-disabled` have different interaction semantics; use the appropriate one for the component.

### State matrix

| State | Visual question | Accessibility check |
|---|---|---|
| Default | Is the component recognizable? | Text and boundaries are clear. |
| Hover | Does the interaction affordance change? | Not the only way to access functionality. |
| Active | Is activation feedback apparent? | No essential information conveyed by motion alone. |
| Focus | Can keyboard users identify location? | `:focus-visible` ring is clear and not clipped. |
| Disabled | Is the state clear? | Disabled semantics and contrast are reviewed. |
| Selected | Is selection persistent and obvious? | State is exposed programmatically where needed. |
| Error | Is the problem specific and visible? | Text/icon or message accompanies color. |
| Success | Is confirmation understandable? | Meaning is not conveyed by green alone. |

---

## 10. Validate Contrast With Real Pairings

Contrast is a relationship between foreground and background colors, not a property of a swatch by itself. A brand color can be suitable for a large filled button with white text and unsuitable for small text on a white background. A muted text color can pass on one surface and fail on another.

For WCAG 2.x AA, the commonly used minimum contrast ratios are 4.5:1 for normal text and 3:1 for large text, with separate requirements for non-text UI components and graphical objects where applicable. The definition of large text depends on size and weight. Verify the current conformance criteria relevant to your target rather than relying on visual intuition.

### Contrast workflow

1. List every meaningful foreground/background pairing.
2. Include body text, labels, links, placeholders where they convey information, icons, and status messages.
3. Include both light and dark themes.
4. Include hover, active, disabled, selected, and error states.
5. Test gradients and transparent overlays at the least favorable point.
6. Test component boundaries and focus indicators against adjacent colors.
7. Fix failures by adjusting one or both colors, then recheck all usages.
8. Record the result and the tool used.

Do not use a single “accessible palette” generator result as proof that every combination passes. A palette generator may evaluate only the selected pair, not the entire component or theme.

---

## 11. Do Not Use Color as the Only Signal

A red border can signal an error, but the user also needs an understandable message. A green icon can signal success, but the icon and text should communicate what happened. Selected items should have a marker, shape, or other visible cue in addition to color when appropriate.

```html
<form>
  <div class="field">
    <label for="email">Email address</label>
    <input
      id="email"
      name="email"
      type="email"
      aria-describedby="email-error"
      aria-invalid="true"
    >
    <p id="email-error" class="field-error">
      Enter a valid email address.
    </p>
  </div>
</form>
```

```css
.field input[aria-invalid="true"] {
  border: 2px solid var(--color-status-danger);
}

.field-error {
  color: var(--color-status-danger);
  font-weight: 600;
}
```

The message and semantic attributes help convey the problem beyond color. Make sure `aria-describedby` references an existing, relevant message and that the error is updated when the input becomes valid.

For charts, combine color with direct labels, shapes, line styles, or patterns. Do not expect users to distinguish several categories based only on red, green, blue, and yellow.

---

## 12. Color, Transparency, and Overlays

Transparency changes the final rendered color by blending it with what lies underneath. Therefore, the color value alone cannot prove contrast when the background can vary. A translucent label over a photo must be tested against every relevant crop or placed on a stable backing surface.

```css
.image-overlay {
  background: rgb(8 12 20 / 72%);
  color: #fff;
}
```

The percentage is an example. Adjust it after checking the worst-case image region and all responsive crops. Do not assume a semi-transparent black overlay always provides enough contrast.

For modal dialogs, use a scrim that separates the dialog from the page but does not obscure the dialog's own text or controls. Verify the overlay against the underlying page and make sure the dialog has a clear surface token of its own.

Avoid stacking multiple transparencies without measuring the final result. Two layers that appear separately acceptable can combine into a muddy surface or reduce text contrast.

---

## 13. Forced Colors and High-Contrast Modes

Users may override page colors to make content more legible. Do not disable those preferences for decorative fidelity. Avoid relying on background colors alone to communicate status, and ensure borders and focus indicators remain visible when system colors replace author colors.

```css
.control {
  border: 1px solid var(--color-border-strong);
}

.control:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}

@media (forced-colors: active) {
  .control {
    border: 1px solid ButtonText;
  }

  .control:focus-visible {
    outline-color: Highlight;
  }

  .decorative-glow {
    box-shadow: none;
  }
}
```

System color keywords such as `ButtonText` and `Highlight` allow the user agent to select colors appropriate to the forced-colors environment. Test the actual browser and operating-system combination. Do not add `forced-color-adjust: none` unless preserving the original colors is necessary and the component remains accessible.

---

## 14. Build Color Tokens for Data Visualization

Chart palettes need more than attractive colors. The categories must remain distinguishable across the chart's backgrounds, in small marks, and for users who have color-vision deficiencies. The palette should be tested in the actual visualization rather than as a row of swatches.

```css
:root {
  --chart-series-1: #2457d6;
  --chart-series-2: #b54708;
  --chart-series-3: #087e8b;
  --chart-series-4: #8b5cf6;
  --chart-series-5: #b42318;
}
```

These example colors are not guaranteed to be distinguishable in every context. Use labels, markers, line styles, or direct annotations to supplement color. If the chart contains many categories, consider grouping, filtering, or a different visualization instead of adding dozens of similar hues.

For sequential data, choose a scale with a clear progression from low to high values. For diverging data, define a meaningful midpoint and two distinct directions. Do not use a rainbow scale for continuous data without a strong reason; perceptual jumps can mislead users about the size of differences.

---

## 15. Debug Color Problems in DevTools

When a color appears wrong, inspect the computed result and the layers that affect it. The final color may be caused by an inherited custom property, a more specific selector, a transparency layer, a blend mode, a filter, or a theme selector that did not match.

### Debug sequence

1. Select the affected element in DevTools.
2. Inspect the computed `color`, `background-color`, `border-color`, `outline-color`, and `opacity`.
3. Check which CSS rule sets each property and whether a custom property resolves as expected.
4. Inspect ancestor backgrounds if transparency or blending is involved.
5. Confirm the active theme attribute or class.
6. Disable overlays, filters, and blend modes one at a time.
7. Compare the rendered color with the contrast requirement for its role.
8. Test hover, focus, disabled, and selected states.
9. Verify forced-colors behavior where applicable.
10. Check the same component on a different surface and in the other theme.

```js
function inspectColorTokens(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return;
  }

  const style = getComputedStyle(element);
  const report = {
    selector,
    color: style.color,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    outlineColor: style.outlineColor,
    opacity: style.opacity,
    boxShadow: style.boxShadow,
    filter: style.filter,
    colorScheme: style.colorScheme
  };

  console.table(report);
  return report;
}

inspectColorTokens(".button-primary");
```

`getComputedStyle()` reports resolved CSS values, but it does not calculate the final contrast of a complex transparent stack. Inspect the visible composite and use a contrast checker on the effective foreground and background.

---

## 16. Before → After: Replace Scattered Colors With Roles

### Before

```css
.card { background: #fff; color: #202124; border-color: #ddd; }
.primary-button { background: #2457d6; color: white; }
.notice { color: #b42318; }
.dark .card { background: #111; color: #eee; border-color: #333; }
```

Problems: the palette is scattered, theme behavior is coupled to a `.dark` selector, and status, text, and surface roles have no documented contract.

### After

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --color-surface: #fff;
  --color-text: #202124;
  --color-border: #d5dae2;
  --color-action: #2457d6;
  --color-action-text: #fff;
  --color-status-danger: #b42318;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-surface: #151b28;
  --color-text: #f1f5f9;
  --color-border: #3b4658;
  --color-action: #8ab4ff;
  --color-action-text: #101827;
  --color-status-danger: #ff8a80;
}

.card {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.primary-button {
  color: var(--color-action-text);
  background: var(--color-action);
}

.notice {
  color: var(--color-status-danger);
}
```

The after version makes roles explicit and gives each theme a central mapping. It is still necessary to test contrast for every actual pairing, including the button's text and the danger notice on each surface.

---

## 17. Pattern Library

### Pattern 1 — Semantic Token Foundation

**What it does:** Separates the raw palette from component-facing roles.

**When to use it:** Every project that needs consistent surfaces, text, borders, actions, and status colors.

```css
:root {
  --blue-600: #2457d6;
  --gray-50: #f8fafc;
  --gray-900: #0f172a;

  --color-canvas: var(--gray-50);
  --color-text: var(--gray-900);
  --color-action: var(--blue-600);
}
```

**Trade-off:** Requires a small amount of naming discipline, but reduces ad hoc component colors.

### Pattern 2 — Theme Mapping

**What it does:** Keeps component styles stable while themes remap semantic variables.

**When to use it:** Products that support light and dark modes or user-selectable themes.

```css
[data-theme="light"] {
  --color-surface: #fff;
  --color-text: #172033;
}

[data-theme="dark"] {
  --color-surface: #121a2b;
  --color-text: #f1f5f9;
}
```

**Trade-off:** Every theme must be tested against the same component states and real backgrounds.

### Pattern 3 — Accessible Action Pair

**What it does:** Defines the button background and its foreground as a pair rather than assuming white always works.

**When to use it:** Primary actions, filled links, and branded controls.

```css
.button-primary {
  background: var(--color-action);
  color: var(--color-action-text);
}
```

**Trade-off:** Different themes may require different action foregrounds or action shades.

### Pattern 4 — Focus Ring Token

**What it does:** Gives keyboard focus a consistent, theme-aware visual token.

**When to use it:** All interactive controls and custom widgets.

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}
```

**Trade-off:** Verify the ring against adjacent colors and ensure it is not clipped by containers.

### Pattern 5 — Status With More Than Color

**What it does:** Combines a semantic status color with a text label and appropriate semantics.

**When to use it:** Validation, alerts, success messages, warnings, and system status.

```html
<p class="status status--error" role="alert">
  <strong>Error:</strong> Check the required fields and try again.
</p>
```

**Trade-off:** Use live-region semantics thoughtfully; do not make every static status an interruptive alert.

### Pattern 6 — Forced-Colors Adaptation

**What it does:** Restores visible borders and focus indicators when the user agent overrides author colors.

**When to use it:** Interfaces with custom surfaces, outlines, or color-dependent control boundaries.

```css
@media (forced-colors: active) {
  .custom-control {
    border: 1px solid ButtonText;
  }

  .custom-control:focus-visible {
    outline: 3px solid Highlight;
  }
}
```

**Trade-off:** Test real forced-colors mode; do not assume a simulated CSS color alone reproduces it.

### Pattern 7 — Non-Color Chart Encoding

**What it does:** Adds labels, shapes, or line styles so a data series is not identified by color alone.

**When to use it:** Dashboards, analytical charts, and multi-series comparisons.

```css
.series-a { stroke: var(--chart-series-1); stroke-dasharray: none; }
.series-b { stroke: var(--chart-series-2); stroke-dasharray: 6 3; }
```

**Trade-off:** Extra encodings should remain consistent and not clutter the chart.

### Pattern 8 — Surface and Border Pairing

**What it does:** Establishes a predictable boundary between surfaces using a semantic border token.

**When to use it:** Cards, inputs, panels, and dialog surfaces where elevation alone is insufficient.

```css
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

**Trade-off:** A border may need a stronger token for controls or high-contrast contexts.

---

## 18. Common Mistakes

| Mistake | Why it happens | Specific fix |
|---|---|---|
| Choosing colors only as isolated swatches | A palette looks coherent in a picker but not in real context. | Test the colors together on real components and against the intended surfaces. |
| Using raw hex values in every component | The fastest local solution becomes the long-term API. | Move recurring roles into semantic CSS custom properties and update component styles to consume them. |
| Naming every token by appearance only | Appearance names do not communicate the intended role. | Keep raw scale names separate and expose semantic names such as `--color-text-muted`. |
| Assuming equal HSL lightness means equal brightness | HSL is treated as perceptually uniform. | Compare actual rendered pairings and calculate contrast rather than relying on percentages. |
| Assuming OKLCH guarantees accessibility | A perceptual color space is mistaken for a contrast standard. | Test the final foreground/background pair and add fallbacks for unsupported color functions. |
| Inverting all light colors for dark mode | Dark mode is approached as a mechanical inversion. | Design canvas, surface, text, border, and action roles intentionally for the dark theme. |
| Reusing one brand color for all actions | Brand consistency is interpreted as identical values everywhere. | Define separate semantic tokens for filled actions, action text, hover, and focus. |
| Testing text only against the page canvas | Cards and overlays use different backgrounds. | Audit every meaningful text/background pairing in the component library. |
| Making muted text too faint | Muted is interpreted as decorative rather than secondary content. | Adjust the muted token until it passes for its actual size and background. |
| Communicating error only with red | Color is used as the sole status cue. | Add an explanatory message, icon or label, and programmatic invalid state where appropriate. |
| Using transparency without checking the composite | The source color is evaluated without the underlying layer. | Test the final rendered foreground and background across all relevant image crops. |
| Forgetting forced-colors mode | Custom colors are reviewed only in normal themes. | Add and test a `forced-colors: active` adaptation for important boundaries and focus. |
| Removing focus outlines | Default browser focus is considered visually inconvenient. | Use a visible `:focus-visible` ring with a semantic focus token. |
| Assuming disabled opacity is harmless | Reduced opacity also affects text and icon contrast. | Inspect the rendered disabled state and preserve clear disabled semantics. |
| Making charts rely on hue alone | Series colors look distinct on the designer's screen. | Add labels, marker shapes, line styles, or direct annotations. |
| Using a rainbow scale for continuous data | More colors are assumed to communicate more precision. | Use a sequential or diverging scale aligned with the data meaning. |
| Creating a new token for every component | Tokenization is confused with naming every local exception. | Reuse semantic roles and create new tokens only when a genuinely distinct role exists. |
| Leaving hover and active states undefined | Only the default state is included in the visual spec. | Add a state matrix and review hover, active, focus, disabled, and selected states. |
| Failing to test dark status colors | Light-theme status values are reused unchanged. | Define theme-specific status mappings and test each on the actual surface. |
| Assuming `color-scheme` themes custom CSS | Browser form controls and custom components are conflated. | Style custom components with tokens and use `color-scheme` only for browser-provided controls. |
| Ignoring links within body text | Link color is chosen for brand appearance only. | Test link contrast and provide a non-color cue such as underline. |
| Setting a focus ring that is clipped | The component sits inside an overflow-clipped container. | Inspect ancestor overflow and provide sufficient outline space or a suitable alternative. |
| Treating a contrast tool as a full audit | One successful pair is mistaken for complete component accessibility. | Test all text, boundaries, states, themes, transparency composites, and non-color cues. |

---

## 19. Quick Reference

| Situation / property | Starting point | Notes |
|---|---|---|
| Raw palette values | `--blue-600`, `--neutral-900` | Describes scale values, not component meaning. |
| Semantic surface | `--color-surface` | Theme maps it to the appropriate raw value. |
| Primary text | `--color-text` | Test on every surface where it appears. |
| Secondary text | `--color-text-muted` | Must remain readable; muted does not mean invisible. |
| Action background | `--color-action` | Pair with an explicit action text token. |
| Action foreground | `--color-action-text` | Do not assume white or black always passes. |
| Focus ring | `--color-focus-ring` | Test against adjacent backgrounds and clipping. |
| Status color | `--color-status-danger` | Pair color with a label or message. |
| Light theme | `[data-theme="light"]` | Use one documented theme convention. |
| Dark theme | `[data-theme="dark"]` | Re-evaluate surfaces, text, borders, and status roles. |
| HSL exploration | `hsl(h s l)` | Useful for hue families; not perceptually uniform. |
| Perceptual exploration | `oklch(l c h)` | Validate browser support, gamut, and contrast. |
| Transparent overlay | `rgb(0 0 0 / 70%)` | Measure the final composite over real images. |
| Keyboard focus | `:focus-visible` | Keep a clear, unclipped ring. |
| High contrast | `@media (forced-colors: active)` | Use system colors where appropriate. |
| Button state | `:hover`, `:active`, `:disabled` | Review every meaningful state. |
| Error state | `aria-invalid` + message | Do not rely on red alone. |
| Chart series | Color + shape/label | Ensure series remain distinguishable without hue alone. |
| Contrast ratio | Foreground/background pair | Test actual rendered values. |
| Debugging | `getComputedStyle()` | Follow inheritance, variables, opacity, and overlays. |
| Surface boundaries | `--color-border` | Use stronger boundaries where controls need them. |
| Native controls | `color-scheme` | Helps browser UI; does not style custom components. |
| Token growth | Semantic roles | Avoid one token per component unless the role is genuinely unique. |

---

## 20. Specific Build Requirements

1. Inventory the roles needed by the interface before choosing final colors.
2. Create a neutral scale and review its temperature and progression.
3. Define brand and accent colors with documented usage roles.
4. Separate raw palette values from semantic component tokens.
5. Establish one consistent CSS custom-property naming scheme.
6. Create theme mappings for all required themes before styling individual components.
7. Define surface, text, border, action, focus, and status roles in each theme.
8. Validate all meaningful text/background pairings against the applicable contrast requirements.
9. Test component boundaries and focus indicators against adjacent colors.
10. Review hover, active, focus, selected, disabled, success, warning, and error states.
11. Ensure errors and status messages are not communicated by color alone.
12. Test transparency and gradients over the actual backgrounds they will overlay.
13. Add a forced-colors strategy for important boundaries and focus states.
14. Check chart colors with labels, marker shapes, or line styles.
15. Inspect computed colors in DevTools and trace unexpected values to their source.
16. Test the palette in real components, not only as a swatch sheet.
17. Document any exception that uses a component-specific color.
18. Remove unused tokens and duplicate values before handoff.

### Build challenge: dark-mode error text fails on a raised surface

**Scenario:** An error message uses the same red token in both themes. It looks acceptable on the dark page canvas but becomes difficult to read on a raised dark card. The input border is also the only signal that the field is invalid.

**Your task:** Inspect the actual computed foreground and surface colors, define a semantic danger token suitable for the dark theme, and add an explanatory message and appropriate invalid-state semantics. Test the message on every surface where it appears, verify the input boundary, and confirm that forced-colors mode still communicates the error.

**Required evidence:**

- A list of the actual foreground/background pairings tested.
- The updated light and dark token mappings.
- The computed styles for the error text and input border.
- A check showing the error is conveyed through text or another non-color cue.
- A forced-colors test or documented browser test result.
- A review of the disabled and focus states so the new token does not create a regression.

---

## 21. Mental Models

1. **A color has no accessibility status in isolation.** The relationship between foreground and background determines contrast.
2. **Semantic tokens describe meaning; raw tokens describe palette positions.** Keep those responsibilities separate.
3. **Dark mode is a designed theme, not an inversion filter.** Rebuild surface and text relationships intentionally.
4. **A color space is an editing model, not a guarantee of good perception.** Inspect actual colors and test contrast.
5. **A brand color can serve different roles through different values.** Do not force one hex value into every state.
6. **Transparency changes the color users see.** Evaluate the composite, not just the source value.
7. **Color is one cue among several.** Status, selection, and chart meaning should survive without hue recognition.
8. **Focus is a semantic state with a visual contract.** A focus ring must remain visible and unclipped.
9. **A theme is a mapping of roles.** Components should not need to know which theme is active to select a surface or text color.
10. **Contrast testing is a matrix, not a single score.** Audit all real pairings, themes, and states.
11. **The fallback is part of the palette.** Forced-colors and unsupported color functions need a readable result.
12. **Tokens should reduce decisions, not multiply them.** Add a token only when it represents a stable role.
13. **Visual polish does not excuse unreadable muted text.** Secondary content is still content.
14. **The computed value may not be the final visible color.** Opacity, blending, overlays, and ancestor backgrounds can change the result.
15. **A palette is not complete until it has been used.** Test the tokens on real forms, buttons, cards, alerts, and charts.

---

## 22. Gotchas

> **Gotcha 1 — HSL lightness is not luminance.** Two colors with the same HSL lightness can have very different perceived brightness and contrast.

> **Gotcha 2 — Dark mode needs its own contrast review.** A color that works on a white surface may fail on a tinted dark surface, and the reverse can also happen.

> **Gotcha 3 — Transparent colors are context-dependent.** The same overlay produces different results over different images and surfaces.

> **Gotcha 4 — `color-scheme` is not a custom theme engine.** It can affect browser-provided controls but will not automatically remap your component styles.

> **Gotcha 5 — Disabled opacity can make content too faint.** Inspect the final rendered state instead of assuming that reduced opacity is always acceptable.

> **Gotcha 6 — Forced-colors mode may replace your palette.** Do not rely on decorative fills or shadows to distinguish controls.

> **Gotcha 7 — A contrast pass for one button does not validate the system.** The same token may appear on other backgrounds and in other states.

> **Gotcha 8 — A vivid chart palette may still be ambiguous.** Add labels, marker differences, and line styles where categories must be distinguished.

---

## 23. Definition of Done

- [ ] The palette roles are documented before component styling.
- [ ] Neutral, brand, accent, and status scales have clear intended uses.
- [ ] Raw color values are separated from semantic tokens.
- [ ] Light and dark themes map the same semantic roles consistently.
- [ ] Text, controls, icons, borders, and focus indicators have been tested on real surfaces.
- [ ] Hover, active, focus, disabled, selected, and error states have been reviewed.
- [ ] Status and chart meaning do not rely on color alone.
- [ ] Transparency and gradient composites have been checked in context.
- [ ] Forced-colors behavior has been tested or explicitly documented.
- [ ] Computed values have been inspected in DevTools for representative components.
- [ ] The dark-mode error-text challenge has been solved without introducing a new contrast failure.
- [ ] No component contains unexplained duplicate or hard-coded color values.
- [ ] The fallback theme and native control behavior remain coherent.
- [ ] Unused tokens and exploratory colors have been removed.
- [ ] A future contributor can understand which token to use for each role.

---

## Appendix A — Minimal Palette Specimen

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Color token specimen</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body data-theme="light">
  <header>
    <nav aria-label="Main navigation">
      <a href="#tokens">Tokens</a>
      <a href="#form-demo">Form example</a>
    </nav>
  </header>

  <main id="tokens">
    <section aria-labelledby="palette-title">
      <h1 id="palette-title">Color system</h1>
      <p>Semantic roles keep components consistent across themes.</p>

      <div class="swatch-grid">
        <article class="swatch swatch--surface">
          <h2>Surface</h2>
          <p>Panel and card background</p>
        </article>
        <article class="swatch swatch--action">
          <h2>Action</h2>
          <p>Primary action color</p>
        </article>
        <article class="swatch swatch--danger">
          <h2>Danger</h2>
          <p>Error and destructive action role</p>
        </article>
      </div>
    </section>

    <section id="form-demo" aria-labelledby="form-title">
      <h2 id="form-title">Form example</h2>
      <form>
        <label for="demo-email">Email address</label>
        <input id="demo-email" type="email" aria-describedby="demo-help">
        <p id="demo-help">Use an address you can access.</p>
        <button type="submit">Continue</button>
      </form>
    </section>
  </main>
</body>
</html>
```

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #172033;
  --color-text-muted: #4b5565;
  --color-border: #cbd5e1;
  --color-action: #2457d6;
  --color-action-text: #ffffff;
  --color-status-danger: #b42318;
  --color-focus-ring: #005fcc;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #0b1020;
  --color-surface: #121a2b;
  --color-text: #f1f5f9;
  --color-text-muted: #c0cad8;
  --color-border: #334155;
  --color-action: #8ab4ff;
  --color-action-text: #101827;
  --color-status-danger: #ff8a80;
  --color-focus-ring: #a7c7ff;
}

body {
  margin: 0;
  padding: 1.5rem;
  color: var(--color-text);
  background: var(--color-canvas);
  font-family: system-ui, sans-serif;
}

.swatch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 14rem), 1fr));
  gap: 1rem;
}

.swatch {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.swatch--surface {
  color: var(--color-text);
  background: var(--color-surface);
}

.swatch--action {
  color: var(--color-action-text);
  background: var(--color-action);
}

.swatch--danger {
  color: var(--color-status-danger);
  background: var(--color-surface);
}

button,
input {
  font: inherit;
}

button {
  color: var(--color-action-text);
  background: var(--color-action);
  border: 1px solid transparent;
  padding: 0.65rem 1rem;
}

:where(a, button, input, select, textarea):focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}
```

The example values are starting points only. Run a contrast audit for each pairing before adopting them as production tokens.

---

## Appendix B — Handoff Notes

Provide the next contributor with:

- The approved raw palette scales.
- The semantic token dictionary and what each role means.
- The theme selector convention and supported themes.
- Contrast test results for real text and UI pairings.
- Focus, hover, active, disabled, selected, and error-state decisions.
- Forced-colors and high-contrast test notes.
- The non-color cues used for status and chart data.
- Any modern color-function fallback strategy.
- Known exceptions and the reason each exists.

A color system is ready when contributors can select a token by meaning, themes remain coherent, important pairings have been tested, and the interface communicates information even when color perception or author colors differ.
