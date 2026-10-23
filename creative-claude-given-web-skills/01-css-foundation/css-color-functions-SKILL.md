# SKILL: css-color-functions

## Layer
01 — CSS Foundation

## Goal
Use modern CSS color functions to build consistent, accessible, themeable color systems with predictable interpolation, transparency, and perceptual color adjustments.

## Why This Matters (Senior Perspective)

Color in a production interface is more than a list of hex values. A robust system must preserve contrast, support light and dark themes, express interaction states, handle transparency correctly, and remain maintainable as the design grows. Modern CSS color functions let you derive variants from a small set of tokens, choose a color space deliberately, and avoid manually maintaining dozens of nearly identical values.

The senior-level skill is knowing which tool fits which job. `rgb()` is useful for direct RGB channels; `hsl()` can be intuitive for hue-based adjustments; `color-mix()` can blend colors; `oklch()` is often useful for perceptually oriented palettes; and `color-contrast()` support and behavior must be checked carefully before relying on it in production. A mathematically valid color is not necessarily accessible, and a visually plausible palette is not a complete design system.

Treat color as a system with semantic tokens, tested contrast, clear state behavior, and a fallback strategy. Avoid turning color functions into opaque one-line tricks that only the original author can maintain.

## Core Concepts

### 1. CSS colors are values in color spaces

A color value is interpreted in a color space, which defines how its components map to a visible color. Traditional CSS colors include named colors, hexadecimal notation, and RGB/HSL functions. Modern CSS also supports wider-gamut and perceptually oriented spaces such as Lab, LCH, Oklab, and OKLCH.

```css
:root {
  --brand-hex: #3457d5;
  --brand-rgb: rgb(52 87 213);
  --brand-hsl: hsl(229 65% 52%);
  --brand-oklch: oklch(0.52 0.19 268);
}
```

These values are examples of syntax and intent, not guaranteed exact conversions. In a real system, use a color conversion tool or design token source to ensure values correspond as intended.

**Gotcha:** The same numeric components in different color spaces do not represent the same color. `hsl(50 60% 50%)` and `oklch(50% 0.6 50)` are not interchangeable.

### 2. Hexadecimal and RGB channels

Hex values are compact and widely supported. `rgb()` expresses red, green, and blue channels and can use modern space-separated syntax.

```css
.card {
  color: rgb(20 24 32);
  background: #ffffff;
}
```

RGB is useful when a design system already stores channel values or when a direct channel representation is required. It is not inherently more accessible or perceptually uniform than other spaces.

### 3. Alpha transparency

Transparency can be expressed with an alpha channel:

```css
.overlay {
  background: rgb(0 0 0 / 0.55);
}

.soft-highlight {
  background: hsl(220 80% 60% / 18%);
}
```

The alpha value controls compositing with whatever is behind the element. The resulting visible color depends on the background and stacking context, so a translucent color token cannot be assumed to have a single contrast ratio everywhere.

**Gotcha:** Testing a translucent foreground or background against a single flat color may not represent the final result when it overlays images, gradients, or changing surfaces.

### 4. HSL for intuitive hue adjustments

HSL separates hue, saturation, and lightness. It can be useful for simple hue-based variants and legacy design systems.

```css
:root {
  --brand-h: 225;
  --brand-s: 70%;
  --brand-l: 52%;
  --brand: hsl(var(--brand-h) var(--brand-s) var(--brand-l));
}
```

However, equal changes in HSL lightness do not necessarily produce equal perceived brightness changes across hues. HSL is convenient, but it is not perceptually uniform.

### 5. HWB color function

HWB describes hue, whiteness, and blackness. It can be intuitive for choosing a hue and adding white or black.

```css
.example {
  color: hwb(220 10% 15%);
}
```

HWB may suit workflows that think in terms of tinting and shading. It is not a universal replacement for HSL or OKLCH; choose the representation that matches the design task and target support.

### 6. Lab and LCH

`lab()` represents lightness and opponent color axes; `lch()` represents lightness, chroma, and hue in a cylindrical form. These spaces can describe colors outside the sRGB gamut.

```css
:root {
  --accent-lch: lch(55% 65 285);
}
```

LCH makes hue and chroma adjustments more direct than RGB, but values may map outside a device's gamut. Browsers may gamut-map the result, and the displayed color can differ across displays.

### 7. Oklab and OKLCH

Oklab and OKLCH are designed to provide more perceptually consistent relationships than older RGB/HSL models for many practical tasks. OKLCH uses lightness, chroma, and hue.

```css
:root {
  --brand: oklch(0.55 0.18 265);
  --brand-soft: oklch(0.92 0.04 265);
}
```

Use OKLCH when you want to adjust perceived lightness or chroma while keeping a hue direction broadly consistent. Still inspect the rendered palette: equal numeric changes are not a guarantee of equal perceived differences in every context.

**Gotcha:** Chroma values that look reasonable numerically can exceed the sRGB gamut, especially at high lightness or certain hues. Check actual rendering and provide fallbacks when required.

### 8. Choosing a color space intentionally

Use the representation that makes the transformation understandable:
- Hex or RGB for straightforward stored values and broad compatibility.
- HSL/HWB for simple hue-oriented editing.
- Lab/LCH or Oklab/OKLCH for perceptually oriented palette work.
- `color-mix()` for explicit blending.
- Relative color syntax for deriving a color from another color's channels.

Avoid switching spaces in the middle of a token pipeline without documenting why. Conversions can affect gamut, hue, and the meaning of channel adjustments.

### 9. `color-mix()`

`color-mix()` blends two colors in a specified interpolation space.

```css
.button {
  background: color-mix(in oklab, var(--brand) 85%, white);
}
```

The interpolation space matters. Mixing in sRGB can produce a different result from mixing in Oklab or OKLCH. Choose the space based on the intended result, not simply because one syntax looks modern.

```css
:root {
  --brand: oklch(0.55 0.18 265);
  --brand-tint: color-mix(in oklch, var(--brand) 88%, white);
  --brand-shade: color-mix(in oklch, var(--brand) 80%, black);
}
```

**Gotcha:** Mixing a color with white or black does not guarantee an accessible text/background pairing. Always test the final contrast in context.

### 10. Percentages in `color-mix()`

Percentages determine the contribution of each color. When one percentage is omitted, the other can determine the remainder; when percentages sum to a value other than 100%, CSS normalizes the contributions according to the function's rules.

```css
.example-a {
  color: color-mix(in srgb, navy 70%, white);
}

.example-b {
  color: color-mix(in oklab, navy 35%, gold 65%);
}
```

Make percentages explicit in shared tokens when clarity matters. Do not expect a “70% of color A” blend to preserve a particular contrast ratio.

### 11. Relative color syntax

Relative color syntax derives a new color from an existing color and exposes its channels in the target color space.

```css
:root {
  --brand: oklch(0.55 0.18 265);
  --brand-muted: oklch(from var(--brand) calc(l + 0.2) calc(c * 0.7) h);
}
```

This can reduce duplication when variants should be derived from a base token. Check browser support for the exact syntax and ensure the expressions stay within a sensible range. Relative color syntax is a tool for deriving values, not a replacement for testing the result.

**Gotcha:** A relative color expression that adjusts lightness can produce values outside the intended range or outside the target gamut. Inspect and constrain the result when needed.

### 12. Channel access and calculations

Relative syntax allows channel references such as `r`, `g`, `b`, `h`, `s`, `l`, `c`, and `alpha` depending on the target color space and function. Use only the channel names valid for that function.

```css
.example {
  color: rgb(from var(--brand-rgb) r g b / 0.8);
}
```

Do not assume that a channel name from one color space is meaningful in another. Keep calculations small and named; a large expression can be harder to maintain than a separate semantic token.

### 13. Transparency with `color-mix()` and relative colors

Color mixing and alpha manipulation can be combined, but alpha changes should be tested against all surfaces where the token appears.

```css
:root {
  --overlay: color-mix(in srgb, black 55%, transparent);
}
```

A transparent blend is useful for overlays, but compositing is context-dependent. If the result needs to meet a contrast requirement, define an opaque or surface-specific alternative for text and essential controls.

### 14. `color()` and wider-gamut color

The `color()` function can specify colors in named color spaces, including `display-p3` where supported.

```css
.hero-art {
  color: color(display-p3 0.2 0.4 0.9);
}
```

Wider-gamut values can use colors that sRGB cannot represent. Not every display supports the full gamut, and fallback behavior should be considered. Do not introduce wide-gamut colors solely because they are available; verify that the intended brand or art direction benefits from them.

### 15. Gamut mapping and fallback declarations

A color can be valid CSS while being outside the display's gamut. The browser may map it to a reproducible output. This can change saturation or appearance.

```css
.brand-panel {
  background: #3558d4; /* broad fallback */
  background: oklch(0.55 0.18 265);
}
```

A fallback declaration should be placed before the enhanced declaration. Test the fallback and the modern value, not only the browser you use most often.

**Gotcha:** A fallback hex value that is merely “close enough” can create a noticeable theme inconsistency. Verify the visual relationship, especially for brand colors and state colors.

### 16. Relative colors versus custom properties

Relative color syntax is good for derived variations, while custom properties are good for naming semantic intent. Combine them where it improves maintainability.

```css
:root {
  --color-brand: oklch(0.55 0.18 265);
  --color-brand-hover: oklch(from var(--color-brand) calc(l - 0.06) c h);
}
```

For complex systems, explicitly named tokens such as `--button-primary-hover` may be easier to audit than deriving every state inline. A token should communicate the role of the color, not only its mathematical origin.

### 17. Semantic tokens and palette tokens

Palette tokens represent raw color values; semantic tokens represent a role in the interface.

```css
:root {
  --palette-blue-700: oklch(0.45 0.16 265);
  --palette-blue-100: oklch(0.94 0.03 265);

  --color-action: var(--palette-blue-700);
  --color-surface-subtle: var(--palette-blue-100);
}
```

Components should generally consume semantic tokens such as `--color-text`, `--color-surface`, `--color-border`, and `--color-danger`. This lets themes change roles without rewriting component rules.

### 18. Light and dark themes

Dark themes should not simply invert every color. Large dark surfaces often need a restrained range of surface values, and bright accents may need different lightness or chroma to remain comfortable and readable.

```css
:root {
  color-scheme: light;
  --color-text: oklch(0.22 0.02 260);
  --color-surface: oklch(0.99 0.005 260);
  --color-border: oklch(0.86 0.01 260);
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-text: oklch(0.92 0.01 260);
  --color-surface: oklch(0.20 0.015 260);
  --color-border: oklch(0.38 0.015 260);
}
```

These are illustrative tokens, not a complete contrast-validated palette. Test every semantic pairing in both themes, including disabled, hover, focus, selected, and error states.

### 19. Contrast is a property of a pairing

Accessibility contrast is evaluated between foreground and background colors, not by judging a color in isolation. Transparency, images, gradients, and layered surfaces affect the final visible pairing.

Use an established contrast checker and the applicable WCAG criteria for the product. For typical text, WCAG 2.2 AA generally requires 4.5:1 for normal text and 3:1 for large text. User-interface components and graphical objects have separate non-text contrast requirements where applicable.

**Gotcha:** A brand accent can look vivid and still fail as small text on a white background. Use a separate text-on-brand token or a darker shade if needed.

### 20. `color-contrast()` and support awareness

CSS has proposed and evolving color-related functions; support varies by feature and browser version. Do not assume `color-contrast()` is available in the project's target browsers or that it automatically guarantees a complete accessible theme.

If the feature is not supported in the required environment, choose contrast-tested tokens at build/design time or use a tested application-side tool. Avoid making a production interface depend on an unsupported function without a fallback.

**Gotcha:** Browser support for `color-mix()` does not imply support for every newer color function. Check each function separately.

### 21. Interaction states as semantic colors

Use semantic tokens for hover, active, focus, selected, disabled, and invalid states.

```css
:root {
  --color-action: #2449c6;
  --color-action-hover: #1b389d;
  --color-focus: #7a3cff;
  --color-danger: #b42318;
}
```

A derived color function can generate variants, but named semantic tokens make intent visible and allow accessibility adjustments. Do not rely on a hue shift alone to communicate state.

### 22. Color interpolation in gradients and transitions

Gradients and animated color transitions interpolate colors. The chosen color space can change whether the middle of the gradient appears muddy, bright, or perceptually smooth.

```css
.hero {
  background: linear-gradient(
    120deg in oklab,
    var(--color-brand),
    var(--color-accent)
  );
}
```

Check the syntax and browser support for the target. Test gradients on real displays and against text overlays; a smooth gradient is not automatically a legible background.

### 23. `currentColor`

`currentColor` uses the element's computed `color` value for other color properties.

```css
.icon {
  color: var(--color-action);
  border-color: currentColor;
}
```

It is useful for icons, borders, and SVG strokes that should follow text color. Avoid using it when the related visual must remain independent of text color, such as a warning icon that requires its own semantic state color.

### 24. `color-scheme`

The `color-scheme` property informs the browser which color schemes an element supports and can affect built-in controls, scrollbars, and other browser-rendered UI.

```css
:root {
  color-scheme: light dark;
}

[data-theme="light"] {
  color-scheme: light;
}

[data-theme="dark"] {
  color-scheme: dark;
}
```

Only declare schemes the page actually supports. Pair it with explicit design tokens and test native controls in each theme; `color-scheme` does not automatically theme every custom component.

### 25. System colors

System color keywords can match platform colors in contexts where that is appropriate.

```css
.native-like-control {
  color: CanvasText;
  background: Canvas;
  border-color: ButtonBorder;
}
```

These can help preserve platform conventions, especially in high-contrast or forced-color contexts. Do not assume that system colors are equivalent to your brand palette.

### 26. Forced colors and user preferences

Users may enable forced-colors modes or other display preferences. Essential controls and states should remain perceivable when the browser or operating system overrides colors.

```css
@media (forced-colors: active) {
  .custom-control {
    border: 1px solid ButtonText;
  }
}
```

Avoid disabling forced-color adjustments unless there is a compelling, tested reason. Test focus indicators, selected states, and meaningful borders under forced colors.

**Gotcha:** A background image or gradient that carries the only state cue may disappear in forced-colors mode. Keep essential meaning in text, structure, and robust borders.

### 27. Theme tokens should not encode only raw math

A token such as `--color-brand-lighter-12` explains a transformation but may not explain the role. A token like `--color-button-primary-hover` communicates intent, while the value can still be derived using color functions.

```css
:root {
  --color-button-primary: var(--color-brand);
  --color-button-primary-hover:
    color-mix(in oklab, var(--color-brand) 88%, black);
}
```

Keep derivation close to the token definition and validate each result. If a mathematically generated value is unsuitable for a particular context, override that semantic token rather than forcing the formula.

### 28. Color functions and custom property type errors

Custom properties store token streams until substituted. A value can be syntactically accepted at definition time but become invalid when used in a property or function.

```css
:root {
  --brand: oklch(0.55 0.18 265);
}

.button {
  background: color-mix(in oklab, var(--brand), white);
}
```

Keep custom property names and types consistent. Avoid reusing a token name for both a full color and a raw channel unless that convention is explicit. Test fallback behavior for undefined or invalid values.

### 29. Testing colors across surfaces

A token may pass contrast on one surface and fail on another. Build a pairing matrix that includes text on base surfaces, muted text, borders, icons, links, focus indicators, selected controls, error states, and overlays.

Do not rely only on automated checks: screenshots and real-browser rendering help catch gamut differences, alpha compositing, and theme-specific visual problems.

### 30. Debugging color functions

When a color looks wrong:
1. Confirm the declaration is valid and not overridden.
2. Inspect the computed color value in DevTools.
3. Check the interpolation or target color space.
4. Check alpha and the actual background behind the element.
5. Determine whether the color is outside the target gamut.
6. Compare the fallback declaration and enhanced declaration.
7. Check semantic token resolution in the active theme.
8. Run contrast checks on the final foreground/background pair.
9. Test forced-colors and high-contrast behavior where relevant.
10. Confirm the browser supports the exact function and syntax.

**Gotcha:** A declaration can parse correctly and still produce an unexpected visible result because of gamut mapping, compositing, or the wrong semantic token.

## Reusable Patterns

### Pattern 1 — Palette plus semantic tokens

```css
:root {
  --palette-ink: oklch(0.22 0.02 260);
  --palette-paper: oklch(0.99 0.005 260);
  --palette-blue: oklch(0.48 0.17 265);
  --palette-red: oklch(0.52 0.18 25);

  --color-text: var(--palette-ink);
  --color-surface: var(--palette-paper);
  --color-action: var(--palette-blue);
  --color-danger: var(--palette-red);
}
```

Use palette tokens for the source colors and semantic tokens for the roles components consume. Validate every foreground/background pairing before production.

### Pattern 2 — Modern color with fallback

```css
.button {
  background: #2449c6;
  background: oklch(0.48 0.17 265);
}
```

The first declaration provides a broad fallback; the later declaration enhances modern browsers. Ensure the fallback has the same semantic role and similar visual behavior.

### Pattern 3 — Derived hover token

```css
:root {
  --color-action: oklch(0.48 0.17 265);
  --color-action-hover:
    color-mix(in oklab, var(--color-action) 88%, black);
}
```

Use derivation for consistency, then inspect and contrast-test the result. Do not assume the formula yields the right value for every color or background.

### Pattern 4 — Soft surface tint

```css
:root {
  --color-info: oklch(0.55 0.14 245);
  --color-info-surface:
    color-mix(in oklch, var(--color-info) 12%, white);
}
```

This is useful for subtle callout backgrounds. Use a separate semantic text token and verify that small text remains legible.

### Pattern 5 — Theme-aware semantic tokens

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --color-text: oklch(0.22 0.02 260);
  --color-surface: oklch(0.99 0.005 260);
  --color-border: oklch(0.84 0.01 260);
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-text: oklch(0.92 0.01 260);
  --color-surface: oklch(0.20 0.015 260);
  --color-border: oklch(0.38 0.015 260);
}
```

This pattern separates component styles from theme values. The example values must still be checked for the actual design's contrast and appearance.

### Pattern 6 — Focus token independent of brand color

```css
:root {
  --color-focus: oklch(0.58 0.22 300);
}

:where(button, a, input, select, textarea):focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

A dedicated focus token avoids assuming that the brand color will be visible on every surface. Test it in all themes and do not remove the outline without a visible replacement.

### Pattern 7 — Alpha overlay with surface-specific text

```css
.modal-backdrop {
  background: rgb(0 0 0 / 0.6);
}

.modal {
  color: var(--color-text);
  background: var(--color-surface);
}
```

Keep overlay transparency separate from the modal's semantic foreground and background tokens. Contrast-test the actual rendered modal, not just the backdrop value.

### Pattern 8 — Current-color icon

```css
.icon {
  color: var(--color-action);
}

.icon svg {
  stroke: currentColor;
}
```

Use when icon strokes should track the surrounding text or action color. Give status icons their own semantic token if they need to remain distinct from surrounding text.

### Pattern 9 — Gradient with explicit interpolation space

```css
.hero {
  background: linear-gradient(
    110deg in oklab,
    var(--color-brand),
    var(--color-accent)
  );
}
```

Specify the interpolation space when a perceptual gradient is intended. Confirm browser support and test all text overlays and contrast points across the gradient.

### Pattern 10 — Forced-colors support

```css
@media (forced-colors: active) {
  .selected-item {
    border: 2px solid Highlight;
  }

  .selected-item:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 2px;
  }
}
```

Preserve selection and focus information with system colors and visible borders. Test in the actual forced-colors environment instead of assuming the declarations behave as intended.

### Pattern 11 — Explicit high-contrast text on a brand surface

```css
.button--primary {
  color: var(--color-on-action);
  background: var(--color-action);
}
```

Use a separately validated `--color-on-action` token instead of assuming white or black always passes contrast. If the brand color changes, the pairing should be rechecked.

### Pattern 12 — Color tokens for validation states

```css
:root {
  --color-danger-text: oklch(0.42 0.17 25);
  --color-danger-border: oklch(0.54 0.18 25);
  --color-danger-surface: oklch(0.96 0.025 25);
}

.field[aria-invalid="true"] {
  border-color: var(--color-danger-border);
}

.field__error {
  color: var(--color-danger-text);
  background: var(--color-danger-surface);
}
```

Use distinct tokens when text, border, and surface need different contrast behavior. Pair color with explanatory text and an accessible error association.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Treating all color spaces as equivalent | Components have different meanings and perceptual behavior | Choose a space based on the transformation and intent |
| Assuming HSL lightness is perceptually uniform | Equal lightness changes can look different across hues | Consider OKLCH or Oklab and inspect the result |
| Using OKLCH without checking gamut | Some values may be outside the target display gamut | Test rendering and provide a fallback |
| Treating `color-mix()` as an accessibility tool | Mixing does not guarantee contrast | Test final foreground/background pairs |
| Assuming a translucent token has one contrast ratio | Its visible result depends on the background | Test the composited result on every relevant surface |
| Mixing in an unspecified or unsuitable color space | The midpoint may look muddy or shift hue unexpectedly | Choose the interpolation space explicitly where needed |
| Deriving every semantic color mathematically | Some roles need intentionally different values | Use semantic tokens and override unsuitable derived values |
| Naming tokens only by shade math | The role is unclear to component authors | Name semantic roles such as action-hover or danger-text |
| Using the same color token for text and background | A value that works in one role may fail in another | Define foreground/background pairing tokens |
| Assuming white text always works on a brand color | Contrast depends on the actual color | Validate `--color-on-action` for the chosen action color |
| Assuming black text always works on a light tint | Tint and opacity can change contrast | Test the rendered pairing |
| Relying on color alone for state | Users may miss state information | Add text, shape, iconography, or another non-color cue |
| Using the brand color as every focus indicator | It may disappear on brand-colored controls or surfaces | Define a dedicated focus token and test all contexts |
| Removing outlines during a reset | Keyboard users lose location feedback | Keep a visible `:focus-visible` treatment |
| Forgetting dark-theme hover and active states | A light-theme variant may be too bright or too low-contrast in dark mode | Validate each interaction state in every theme |
| Inverting all light-theme colors to create dark mode | Perceived hierarchy and contrast can break | Design semantic dark-theme tokens intentionally |
| Assuming `color-scheme` themes custom components | It mainly informs browser-rendered UI and related defaults | Use explicit semantic tokens for custom components |
| Declaring `color-scheme: dark` without a complete dark theme | Native controls may change while custom UI stays light | Set it only when the full theme is supported |
| Assuming all modern color functions share the same support | Support varies by function and syntax | Check each function against the browser matrix |
| Using `color-contrast()` without checking support | Production behavior may be missing in target browsers | Precompute tested tokens or provide a reliable fallback |
| Omitting a fallback for a critical brand color | Older browsers may show a different or missing style | Add and validate a broadly supported fallback |
| Adding a fallback that is visually unrelated | Theme consistency and brand hierarchy can break | Compare fallback and enhanced output |
| Using raw channel tokens inconsistently | A token may be mistaken for a full color value | Document whether tokens store channels or complete colors |
| Writing very complex relative-color expressions inline | The transformation becomes hard to audit | Create named derived tokens and keep formulas small |
| Letting relative lightness values exceed sensible ranges | The result may be visually unusable or outside gamut | Constrain calculations and test actual outputs |
| Using `currentColor` for a state icon that must be independent | The icon may inherit the wrong semantic color | Give the status icon a dedicated token |
| Ignoring gradient contrast along the full path | Text may be readable at one point and unreadable elsewhere | Test overlay text at the weakest-contrast region |
| Using a gradient without checking interpolation behavior | Color transitions can change unexpectedly between spaces | Choose an interpolation space and inspect screenshots |
| Assuming an alpha overlay is a fixed shade | Background imagery changes the resulting color | Test representative images and surfaces |
| Forgetting forced-colors mode | Important distinctions can disappear | Use system colors and robust borders where appropriate |
| Disabling forced-color adjustments casually | User-selected high-contrast settings may be undermined | Avoid disabling adjustments unless rigorously justified |
| Using a gradient or image as the only state cue | The cue may disappear or be overridden | Preserve semantic text, borders, and structure |
| Validating contrast only in one theme | Dark and light surfaces produce different results | Build a theme-by-theme pairing matrix |
| Validating a color token without its actual background | Contrast is a relationship, not a property of one value | Test the final rendered pair |
| Forgetting borders and icons in contrast review | Non-text UI indicators can be important to understanding controls | Review applicable non-text contrast requirements |
| Treating color conversion output as a design decision | Mathematically converted values may not look right in context | Inspect palette harmony and hierarchy |
| Using a wide-gamut color without a fallback strategy | Older or narrower-gamut contexts may render differently | Add fallback values and test supported displays |
| Assuming all devices display wide-gamut colors identically | Display capabilities vary | Verify target hardware and use robust fallbacks |
| Overusing color-mix for every token | The palette becomes opaque and difficult to review | Derive only where the formula communicates useful consistency |
| Failing to document the chosen interpolation space | Future edits can alter the visual result | Specify the space and explain the design intent |
| Using `transparent` without understanding its color semantics | Transparent values can blend differently than expected | Test compositing and use explicit colors where necessary |
| Allowing invalid custom properties to silently break declarations | The browser may discard the affected declaration | Inspect computed values and provide valid fallbacks |
| Reusing one custom property for a color and a channel | Substitution may create invalid syntax | Use distinct, consistently typed token names |
| Assuming a color function's successful parse means visual success | Gamut mapping and compositing still affect output | Inspect rendered colors and test context |
| Using an accent tint as small text without checking contrast | Tints often lack enough contrast | Use a separate, stronger text color token |
| Relying on hover color alone to indicate interaction | Touch and keyboard users may not receive equivalent cues | Add focus, active, and other clear state treatments |
| Creating disabled colors with opacity only | Compositing may cause unpredictable contrast | Test final appearance and preserve disabled-state clarity |
| Using a single danger token for text, border, and surface | One shade may not work for all three roles | Create role-specific semantic danger tokens |
| Forgetting that native controls follow color-scheme settings | Controls can look inconsistent with custom tokens | Test forms in light, dark, and forced-color modes |
| Putting fallback after the modern declaration | Older support behavior may be less reliable or clear | Put the fallback first and enhanced value after it |
| Testing only in one browser | Color-space support and rendering can differ | Test the defined browser and device matrix |
| Using color names that hide semantic intent | Components become coupled to a palette hue | Expose semantic tokens to components |
| Hard-coding colors in component styles | Themes require widespread edits | Centralize colors in custom properties |
| Changing the brand hue to fix contrast without checking identity | Brand consistency can be lost | Adjust semantic role colors or foreground pairing intentionally |
| Ignoring alpha in computed styles | A semi-transparent color is not the final displayed color | Inspect the composite against its actual backdrop |
| Assuming a color-mix percentage is a contrast percentage | Blend proportion is unrelated to contrast ratio | Calculate and test actual contrast |
| Forgetting to test error messages with their background | A readable error color may fail on a tinted surface | Validate the entire error presentation |
| Using CSS color functions without documenting browser targets | Future maintainers cannot know the compatibility contract | Document target support and fallback behavior |

## Mental Models

1. **Color is a relationship.** Accessibility depends on foreground/background pairs, not isolated hex values.
2. **A color space is a working model.** Choose it because it makes the desired operation meaningful.
3. **HSL is intuitive, not perceptually uniform.** Equal numeric changes do not always look equally large.
4. **OKLCH is a useful palette tool, not an accessibility guarantee.** Gamut and contrast still require review.
5. **Color mixing is interpolation.** The selected color space affects the visual path between endpoints.
6. **Transparency is context-dependent.** The background determines the final visible result.
7. **Palette tokens and semantic tokens have different jobs.** One stores color sources; the other communicates interface roles.
8. **Derived tokens need review.** A consistent formula can still produce a poor hover or text color.
9. **Fallbacks are part of the design.** Older browsers and narrower gamuts should remain usable.
10. **Dark mode is a separate visual hierarchy.** It should be designed and tested, not mechanically inverted.
11. **`currentColor` shares an existing color decision.** Use it only when shared color is the intended behavior.
12. **`color-scheme` informs native UI.** It does not replace custom component theming.
13. **Color is not the only state channel.** Text, shape, position, and icons can reinforce meaning.
14. **A valid declaration can still be wrong visually.** Computed values, compositing, and gamut affect the final output.
15. **Support is feature-specific.** Check the exact color function rather than assuming every modern syntax ships together.
16. **A semantic token is an API.** Its name should help consumers choose the correct role.
17. **Contrast testing must cover the weakest point.** Gradients and overlays can vary across a single component.
18. **Accessibility is a release criterion.** Contrast, focus, and forced-colors behavior belong in acceptance tests.

## Quick Reference

| Task | Example | Notes |
|---|---|---|
| RGB channels | `rgb(20 24 32)` | Broadly supported |
| Alpha channel | `rgb(0 0 0 / 0.5)` | Final appearance depends on backdrop |
| HSL | `hsl(220 70% 50%)` | Intuitive but not perceptually uniform |
| HWB | `hwb(220 10% 15%)` | Hue, whiteness, blackness |
| Lab | `lab(60% 20 30)` | Perceptual-style axes |
| LCH | `lch(60% 45 250)` | Lightness, chroma, hue |
| Oklab | `oklab(0.6 0.02 -0.1)` | Perceptually oriented |
| OKLCH | `oklch(0.55 0.18 265)` | Useful for palette derivation |
| Blend colors | `color-mix(in oklab, blue 80%, white)` | Interpolation space matters |
| Relative color | `oklch(from var(--brand) calc(l + 0.1) c h)` | Check support and range |
| Wide gamut | `color(display-p3 0.2 0.4 0.9)` | Provide fallback where needed |
| Reuse current text color | `border-color: currentColor` | Shares computed `color` |
| Browser UI theme | `color-scheme: light dark` | Test native controls |
| Forced colors | `@media (forced-colors: active)` | Preserve important cues |
| Text contrast | foreground/background pairing | WCAG requirements depend on text size and role |
| Semantic token | `--color-danger-text` | Communicates role rather than hue |
| Fallback | hex before OKLCH declaration | Test both values |

## Build Challenge

Build a **semantic color system** for a small product dashboard with light and dark themes, primary actions, text, surfaces, borders, status messages, focus indicators, and a gradient hero. Use modern color functions where they add value and keep a tested fallback.

### Requirements

1. Define raw palette tokens separately from semantic tokens.
2. Define semantic tokens for text, surface, border, action, focus, success, warning, and danger.
3. Use at least one modern color space such as OKLCH.
4. Document why the chosen color space fits the palette task.
5. Provide a fallback for every critical modern color value that needs one for the target browser matrix.
6. Put fallback declarations before enhanced declarations.
7. Use `color-mix()` for at least one derived token.
8. Specify the interpolation space for the blend.
9. Explain why the blend does not guarantee contrast.
10. Use relative color syntax for a derived value only if target browser support permits it.
11. Name derived values by semantic role where practical.
12. Create light and dark theme token sets.
13. Do not create dark mode by mechanically inverting all colors.
14. Set `color-scheme` only for themes the page actually supports.
15. Test native controls in both themes.
16. Define a dedicated `--color-focus` token.
17. Preserve a visible `:focus-visible` indicator on interactive controls.
18. Define an explicit text color for primary-action backgrounds.
19. Test the text/action pairing with a contrast checker.
20. Check normal text and large text against the applicable WCAG criteria.
21. Review important non-text component indicators where applicable.
22. Test status text, icons, borders, and backgrounds together.
23. Never rely on color alone for error, warning, selection, or success.
24. Test translucent overlays against multiple representative backdrops.
25. Test text over the entire gradient, not just at one point.
26. Specify gradient interpolation space if perceptual interpolation is intended.
27. Include a `currentColor` example where shared color is the intended behavior.
28. Give status icons separate semantic colors if they should not inherit text color.
29. Add a forced-colors rule for at least one important selected or focused state.
30. Do not disable forced-color adjustments without a tested reason.
31. Check whether any token is outside the intended gamut.
32. Compare fallback and enhanced rendering in target browsers.
33. Inspect computed values in DevTools when a token looks wrong.
34. Verify custom property names and types are consistent.
35. Test missing or invalid token fallback behavior.
36. Validate every semantic foreground/background pairing in light theme.
37. Validate every semantic foreground/background pairing in dark theme.
38. Review disabled, hover, active, selected, invalid, and focus states.
39. Document any color function whose support is not guaranteed by the target matrix.
40. Use named tokens instead of hard-coding component colors throughout the stylesheet.
41. Ask another developer to identify the intended semantic role of each exposed token.
42. Confirm the final palette remains visually coherent, not merely numerically valid.
43. Test at least two browser engines or the project's defined compatibility targets.
44. Include a short release checklist for contrast and theme review.
45. Refactor any color expression that is too complex to audit.

### Definition of done

- [ ] Palette and semantic tokens are clearly separated.
- [ ] Every essential text and control pairing has been contrast-checked.
- [ ] Light and dark themes are intentionally designed.
- [ ] Focus, status, and selection cues do not depend on color alone.
- [ ] Fallbacks and feature support are documented.
- [ ] Transparent colors are tested against real surfaces.
- [ ] Gradients remain legible across their full area.
- [ ] Forced-colors behavior preserves essential information.
- [ ] Components consume semantic tokens rather than scattered raw colors.
- [ ] The color system is understandable and maintainable by another developer.
