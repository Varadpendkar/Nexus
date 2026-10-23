# SKILL: dark-ui-design

**Layer:** 43 — UI/UX Design

**Goal:** Design dark interfaces that preserve hierarchy, legibility, contrast, and emotional tone while using surfaces, typography, color, borders, and state feedback deliberately rather than simply inverting a light theme.

---

## Why This Matters (Senior Perspective)

Dark UI is not a light interface with the background changed to black. It is a separate visual environment with different perceptual trade-offs. Bright text on a dark surface can feel more intense than dark text on a light surface, saturated colors can appear to glow, subtle borders can disappear, and large areas of pure black can make layered content difficult to distinguish. A successful dark interface manages luminance, contrast, density, and visual rhythm so that people can scan information comfortably and understand which elements are interactive.

Dark themes are common in developer tools, creative applications, media products, dashboards, and products used in low-light settings. They can reduce perceived screen brightness and support a focused aesthetic, but they are not automatically more accessible, more comfortable, or more energy-efficient in every situation. Display technology, brightness settings, ambient light, text size, and user preferences all influence the experience. Some users read long text more comfortably on light backgrounds; others prefer dark surfaces. A robust product gives users a clear theme choice when that choice is relevant and persists it predictably.

The central design challenge is hierarchy. In a light interface, elevation is often communicated with shadows and differences between white and gray surfaces. In a dark interface, shadows may be difficult to perceive because the background is already dark. Surface lightness, border contrast, spacing, and restrained highlights often do more work than shadow alone. If every panel is a different shade of gray, the interface becomes noisy; if every surface is the same shade, grouping disappears. A deliberate surface scale helps communicate which regions are global, which are containers, and which are active or selected.

Color semantics also need attention. Bright accent colors can dominate dark surfaces, so a brand color that works on white may become too intense as a large fill. Text and icons need sufficient contrast in every state, including disabled, hover, focus, selected, and error states. A focus ring must remain visible against both the component and its surroundings. Error colors should be paired with text or iconography, not used as the sole signal. Design tokens make these rules repeatable across a product rather than relying on individual designers to judge each screen by eye.

Dark UI must also be tested in real browsers and displays. A Figma frame cannot reveal how browser controls, native form elements, color profiles, subpixel rendering, or actual screen brightness will affect perception. Use DevTools to inspect computed styles and responsive behavior, verify contrast, test keyboard focus, and check how theme switching interacts with stored preferences and system settings. Support for `color-scheme` can improve native form control rendering, but it does not replace explicit styling or cross-browser testing.

**Senior perspective:** treat dark mode as a semantic theme with its own surface, text, border, accent, and state tokens. Validate it in context, preserve interaction feedback, and never trade legibility for a dramatic screenshot.

---

## Core Concepts

### 1. Build a semantic dark palette

Start with semantic roles such as canvas, surface, raised surface, primary text, secondary text, border, accent, and danger. Avoid naming tokens only by raw values such as `gray-900`, because the meaning is lost when the palette changes.

```css
:root {
  color-scheme: dark;
  --color-canvas: #101114;
  --color-surface: #181a1f;
  --color-surface-raised: #20232a;
  --color-text-primary: #f2f3f5;
  --color-text-secondary: #b2b7c2;
  --color-border: #383d48;
  --color-accent: #8bb8ff;
  --color-danger: #ff8a91;
}
```

These values are a starting point, not a universal palette. Validate contrast and perception in the actual component context. Keep semantic tokens stable even if the underlying colors change.

### 2. Avoid making every surface equally dark

Dark interfaces need clear relationships between the page canvas, content surfaces, overlays, and selected areas. Small luminance differences can be difficult to perceive, especially on dim displays or at low brightness. Use a deliberate surface scale rather than choosing arbitrary grays per component.

```css
.app-shell {
  background: var(--color-canvas);
}

.content-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.popover {
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
}
```

Use elevation, border, spacing, and grouping together. Do not rely on shadow alone to separate a card from a near-black canvas.

**Gotcha:** a surface that looks distinct on a bright desktop monitor may disappear on a dim laptop screen. Check realistic brightness and ambient conditions.

### 3. Use contrast for text and controls

Contrast should be evaluated between the foreground and the immediate background. Large text, small text, icons, borders, and state indicators have different needs. Avoid assuming that a color looks bright enough simply because it is saturated.

```css
.body-copy {
  color: var(--color-text-primary);
  background: var(--color-canvas);
}

.secondary-copy {
  color: var(--color-text-secondary);
}

.input {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.input:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

Check text contrast against the exact surface it appears on, including raised cards and overlays. Do not lower secondary text contrast so far that essential descriptions become difficult to read.

### 4. Use accent colors with restraint

Bright accent colors can draw strong attention on dark backgrounds. Reserve the most intense color for primary actions, selected states, or other clearly defined roles. If everything glows, nothing has priority.

```css
.primary-action {
  color: #101114;
  background: var(--color-accent);
  border: 1px solid transparent;
}

.secondary-action {
  color: var(--color-text-primary);
  background: transparent;
  border: 1px solid var(--color-border);
}
```

Check the contrast of both text-on-button and button-against-surface. A bright blue fill may need dark text rather than white text. Use hover and active states that remain legible rather than merely shifting to a more saturated color.

### 5. Design borders that remain perceptible

Borders in dark themes often need a clearer luminance difference than designers expect. A one-pixel border can disappear at certain display settings. Use borders to define interactive boundaries, selected items, and group edges where they improve understanding.

```css
.text-field {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.text-field:hover {
  border-color: #626a79;
}

.text-field:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

Do not add borders to every element by default. Combine border contrast with spacing and grouping to keep the interface from becoming a grid of boxes.

### 6. Create elevation without depending on heavy shadows

Shadows can become nearly invisible on dark surfaces, while large blurred shadows may produce muddy halos. Elevation can also be expressed through a slightly lighter surface, a visible border, and appropriate placement in the hierarchy.

```css
.dialog {
  background: var(--color-surface-raised);
  border: 1px solid #454b58;
  box-shadow: 0 18px 48px rgb(0 0 0 / 38%);
}
```

Treat shadow as one cue among several. Test overlays against the page canvas and adjacent content, including when the user zooms or changes display brightness.

### 7. Tune typography for dark backgrounds

Bright white text on a very dark background can feel harsh, particularly in long reading sessions. A slightly softened primary text color can retain strong legibility while reducing the starkness of pure white. Secondary text still needs enough contrast to remain useful.

```css
:root {
  --color-text-primary: #f0f2f5;
  --color-text-secondary: #b7bdc8;
}

.article-copy {
  color: var(--color-text-primary);
  line-height: 1.65;
  max-width: 70ch;
}
```

Do not reduce contrast as a shortcut for making text “less harsh.” Adjust the palette and typography together, then check real content, font weight, size, and line length.

### 8. Use color semantics consistently

Color should have stable meaning across the product. If red signals destructive action in one place and neutral navigation in another, users must relearn the system. Semantic tokens for success, warning, information, and danger should be paired with labels or icons when the state matters.

```css
:root {
  --color-success: #6fd6a2;
  --color-warning: #ffd27a;
  --color-info: #8bb8ff;
  --color-danger: #ff8a91;
}

.status-error {
  color: var(--color-danger);
}
```

Validate each semantic color on all intended surfaces. Do not assume that a color that works on the canvas will also work inside a raised card or filled badge.

### 9. Make disabled states understandable

Disabled controls can become almost invisible in dark mode if their opacity is reduced too far. A disabled state should still be recognizable, and its reason may need to be explained when it blocks a user from completing a task.

```css
.button:disabled {
  color: #9298a4;
  background: #2a2d34;
  border-color: #3a3e48;
  cursor: not-allowed;
}
```

Do not use low opacity on the entire component if that also makes its label illegible. If a control is unavailable until a prerequisite is met, provide concise guidance near the control when appropriate.

### 10. Design selected and active states beyond hue

A selected item should remain identifiable for users who cannot distinguish the accent color or who view the interface in unusual display conditions. Use a combination of background, border, shape, icon, or text weight where appropriate.

```css
.navigation-link[aria-current="page"] {
  color: var(--color-text-primary);
  background: #292f3b;
  border-inline-start: 3px solid var(--color-accent);
  font-weight: 600;
}

.navigation-link:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

Use semantic current-page state in the markup. Do not make the selected state indistinguishable from hover or keyboard focus.

### 11. Style forms and native controls intentionally

Native controls may use operating-system colors that clash with the theme unless the page communicates its color scheme and the controls are styled and tested appropriately. The CSS `color-scheme` property can help browser-rendered controls use a compatible theme, but details vary by browser and platform.

```css
:root {
  color-scheme: dark;
}

input,
select,
textarea {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}
```

Keep labels visible and associated with controls. Do not rely on placeholder text as the only label. Test dropdowns, date controls, autofill, validation messages, and native picker surfaces in supported browsers.

### 12. Support theme preference and switching

A theme preference may follow the operating system, a user-selected setting, or a product default. Define precedence and persistence clearly. Avoid a flash of the wrong theme on initial load if the product can reasonably determine the saved preference before rendering.

```css
:root {
  color-scheme: light;
  --color-canvas: #ffffff;
  --color-text-primary: #17191d;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #101114;
  --color-text-primary: #f0f2f5;
}
```

This example demonstrates the token boundary, not the preference persistence logic. If the user explicitly chooses a theme, document whether that choice overrides system preference and how it survives reloads. Test server-rendered and client-rendered paths for visual flashes.

### 13. Use `prefers-color-scheme` as a system signal

When the product follows the operating-system preference, the media query can select a default theme. It should not silently override an explicit user choice if the product promises that choice will persist.

```css
:root {
  color-scheme: light;
  --color-canvas: #ffffff;
  --color-text-primary: #17191d;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --color-canvas: #101114;
    --color-text-primary: #f0f2f5;
  }
}
```

Browser support for `prefers-color-scheme` is broad in modern browsers, but older environments and embedded webviews may behave differently. Provide a usable default and test the actual supported matrix.

### 14. Design focus for dark surfaces

Focus rings can disappear when their color is too close to the surface or when they overlap a component border. Test the ring against both the component and the adjacent background. A focus indicator should be visible without relying on a glow effect.

```css
.interactive:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 3px;
}

@media (forced-colors: active) {
  .interactive:focus-visible {
    outline: 2px solid Highlight;
  }
}
```

The forced-colors example is a progressive enhancement; test it in a browser and operating system that support the mode. Avoid `outline: none` unless a fully equivalent visible focus indicator replaces it.

### 15. Handle hover and active states with sufficient contrast

Hover feedback should help users understand that an element is interactive, but the hover state should not overwhelm the surrounding hierarchy. Active feedback should be brief and should not make text unreadable.

```css
.menu-item {
  background: transparent;
  color: var(--color-text-primary);
  transition: background-color 140ms ease;
}

.menu-item:hover {
  background: #272b33;
}

.menu-item:active {
  background: #343a46;
}

.menu-item:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: -3px;
}
```

Do not make essential information available only on hover. Touch and keyboard users need equivalent ways to discover and activate controls.

### 16. Build data visualizations for dark mode

Charts need more than a dark canvas. Gridlines, axes, labels, legends, tooltips, and series colors must remain legible. Avoid a palette where multiple series become indistinguishable or saturated colors appear to glow.

```css
.chart-grid {
  stroke: #343945;
}

.chart-label {
  fill: #b7bdc8;
}

.chart-tooltip {
  color: var(--color-text-primary);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
}
```

Use direct labels, patterns, markers, or other cues when color alone cannot distinguish series. Validate charts with realistic data and color-vision considerations, not only with a polished static sample.

### 17. Keep code and long-form content readable

Developer tools and content-heavy applications often place long text on dark surfaces. Line length, line height, syntax contrast, and selection behavior all affect comfort. Avoid making every syntax token highly saturated, which can create visual noise.

```css
.code-editor {
  color: #e6e9ef;
  background: #15171c;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  line-height: 1.6;
  tab-size: 2;
}

.code-editor ::selection {
  color: #ffffff;
  background: #36537d;
}
```

Treat code syntax colors as semantic roles and check contrast for comments, strings, keywords, errors, and selections. Ensure selected text remains readable and that the editor has a clear focus state.

### 18. Design overlays and dialogs for layered surfaces

Dialogs, popovers, menus, and drawers need to stand apart from the underlying content. Use a combination of surface contrast, border, spacing, and backdrop treatment. The overlay should not obscure its own controls or make the background appear interactive when it is not.

```css
.modal-backdrop {
  background: rgb(0 0 0 / 64%);
}

.modal-panel {
  background: var(--color-surface-raised);
  border: 1px solid #454b58;
  box-shadow: 0 20px 56px rgb(0 0 0 / 42%);
}
```

A visual backdrop does not create modal semantics. In implementation, manage focus, keyboard behavior, accessible naming, and background interaction separately. Test dialogs with long content and narrow viewports.

### 19. Avoid using pure black as the only background

Pure black can be appropriate for some products, but it is not a universal default. A near-black canvas can preserve subtle surface differences and reduce the feeling that content is floating in a void. The right choice depends on the product's visual language, display context, and content.

```css
:root {
  --color-canvas: #101114;
  --color-surface: #181a1f;
  --color-surface-raised: #20232a;
}
```

These values illustrate a stepped surface system, not a prescribed palette. Test the result on more than one display and ensure the tonal differences remain intentional rather than arbitrary.

### 20. Account for images, media, and brand assets

Bright images can dominate a dark interface, while transparent assets may show unexpected halos against a dark background. Check image edges, logos, illustrations, and video controls in the actual theme. Do not automatically dim images if they contain information users need to perceive accurately.

```css
.brand-mark {
  display: block;
  max-width: 100%;
  height: auto;
}

/* Use an alternate asset only when the brand system defines one. */
```

Use theme-specific assets when approved by the brand system. If a logo includes a dark wordmark that becomes invisible, use an authorized alternate rather than applying arbitrary filters that alter brand colors.

### 21. Design empty, error, and success states for dark UI

State messages must remain readable against dark surfaces and visually distinct from one another. A red tint alone may be insufficient to communicate an error, and a success badge should not look like a clickable action unless it is interactive.

```css
.status-error {
  color: #ffb0b5;
  background: #351e24;
  border: 1px solid #74404a;
}

.status-success {
  color: #9ce4bc;
  background: #173126;
  border: 1px solid #356b50;
}
```

Pair color with a clear message and, when useful, a recognizable icon. Keep errors persistent enough to read and associate them with the affected field or task.

### 22. Preserve contrast in dense dashboards

Dashboards often contain many cards, labels, controls, and charts. If every metric uses a bright accent, the hierarchy collapses. Use a quiet surface system, consistent alignment, and a small number of accent roles.

```text
Canvas: lowest-emphasis surface
Card: one step lighter
Card border: visible but restrained
Primary metric: primary text
Context label: secondary text
Action: accent
Warning: semantic warning token
```

Check the dashboard at realistic data density. Long labels, zero values, negative values, and loading states often reveal hierarchy problems hidden by ideal mock data.

### 23. Test contrast with tools and real content

Visual judgment is necessary but not sufficient. Use a contrast checker for text and applicable non-text elements, then inspect the rendered interface. Check all states and surfaces rather than testing a token in isolation.

```text
Contrast review
- Body text on canvas
- Secondary text on cards
- Button text on accent fill
- Input boundary against surrounding surface
- Focus ring against control and page
- Error text and icon against error container
- Disabled content for practical legibility
```

Use browser DevTools to inspect computed colors and verify the element's real background. Transparent surfaces and overlays can change the final rendered color, so sample or calculate the composited result rather than judging the token alone.

### 24. Debug theme issues in the browser

A design file cannot expose all implementation issues. Inspect computed styles, cascade conflicts, browser-native controls, focus states, viewport behavior, and the initial theme selection. Check for hard-coded colors that bypass semantic tokens.

```text
DevTools checklist
1. Inspect the element's computed foreground and background.
2. Search for hard-coded color values that bypass theme tokens.
3. Test hover, active, disabled, selected, and focus-visible states.
4. Enable reduced motion and forced-colors modes where supported.
5. Change system theme and reload the page.
6. Check native inputs, autofill, select menus, and validation UI.
7. Test at narrow and intermediate viewport widths.
8. Review console warnings and accessibility scan results.
```

Automated tools can catch some contrast and semantics issues but cannot replace visual review and keyboard testing. Record the browser and operating system when a theme issue is platform-specific.

### 25. Establish a dark-theme design-system contract

A dark theme should have documented tokens, semantic roles, component state rules, and contrast expectations. Without a contract, components gradually diverge: one uses a hard-coded gray, another uses opacity, and a third has a focus ring that disappears on a raised panel.

```css
:root {
  --color-canvas: #101114;
  --color-surface: #181a1f;
  --color-surface-raised: #20232a;
  --color-text-primary: #f0f2f5;
  --color-text-secondary: #b7bdc8;
  --color-border: #383d48;
  --color-accent: #8bb8ff;
  --color-focus-ring: #9cc2ff;
}
```

Document allowed use and test representative components. A token name should express intent, and components should use semantic roles instead of inventing their own local palette.

### 26. Validate dark UI in context

Review the theme using realistic content, real component states, and the environments in which people will use it. Include long sessions or content-heavy flows where relevant. Ask whether the interface remains understandable at different brightness levels and whether important information stands out without every element being bright.

```text
Review scenarios
- First visit with system dark preference
- Explicit light/dark theme override
- Long form with validation errors
- Dense dashboard with multiple chart series
- Dialog open while keyboard focus is active
- Failed network request with retry
- Narrow viewport with navigation expanded
```

A screenshot review is useful for hierarchy, but interaction testing is needed to verify focus, persistence, state changes, and native controls.

---

## Relevant Patterns

### Pattern 1: Semantic surface ladder

**What it does:** creates a predictable tonal relationship between the canvas, content surfaces, raised elements, and overlays.

**When to use it:** dashboards, admin tools, editors, and other interfaces with multiple layers.

```css
:root {
  --color-canvas: #101114;
  --color-surface: #181a1f;
  --color-surface-raised: #20232a;
  --color-border: #383d48;
}
```

Validate the separation on real displays. Do not assume each level needs a dramatic brightness jump.

### Pattern 2: Accent budget

**What it does:** reserves the strongest color for a small set of important actions or states.

**When to use it:** interfaces where many controls compete for attention.

```text
Primary action: accent fill
Secondary action: neutral outline
Selected navigation: restrained accent marker
Warning: semantic warning token
Decorative content: neutral unless emphasis is meaningful
```

Audit screens for accent overuse. If every component is highlighted, the accent no longer establishes hierarchy.

### Pattern 3: Contrast-safe focus

**What it does:** makes keyboard focus visible against both the component and its surroundings.

**When to use it:** all interactive dark-theme components.

```css
.control:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}

@media (forced-colors: active) {
  .control:focus-visible {
    outline-color: Highlight;
  }
}
```

Test the ring on cards, menus, inputs, and filled buttons, not only on a neutral page canvas.

### Pattern 4: Theme preference precedence

**What it does:** defines how system preference and an explicit user choice interact.

**When to use it:** products with a theme toggle or system-following behavior.

```text
No saved choice -> Follow system preference
Explicit user choice -> Honor that choice
User changes preference -> Update theme and persist
Next visit -> Restore the saved choice before visible content where feasible
```

The persistence mechanism depends on the application. Avoid a flash of the wrong theme when a stable preference can be resolved early.

### Pattern 5: Dark-form state system

**What it does:** keeps labels, boundaries, focus, validation, and disabled states understandable on dark surfaces.

**When to use it:** settings screens, checkout forms, authentication, and data-entry tools.

```css
.field {
  color: var(--color-text-primary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.field:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

Use visible labels, associated errors, and clear state text. Do not let a dark theme reduce the visibility of disabled or invalid controls.

### Pattern 6: Quiet dashboard hierarchy

**What it does:** keeps dense information scannable by using neutral surfaces and reserving accent color for meaningful emphasis.

**When to use it:** analytics dashboards, admin tools, monitoring interfaces, and reporting products.

```text
Canvas -> cards -> dividers -> primary metrics -> context labels -> accent actions
```

Check hierarchy with real data, including zero values, long labels, and error states.

### Pattern 7: State colors with textual meaning

**What it does:** communicates success, warning, and failure without depending on hue alone.

**When to use it:** forms, system status, uploads, alerts, and operational dashboards.

```html
<p class="status-error">
  <strong>Upload failed.</strong>
  Check the file type and try again.
</p>
```

Use semantic markup and ensure the status is announced when appropriate. Color should reinforce the message, not replace it.

### Pattern 8: Dark-theme regression review

**What it does:** catches visual and behavioral regressions across theme changes and component states.

**When to use it:** design-system releases, major UI changes, and products supporting both light and dark themes.

```text
Check tokens -> Check representative components -> Check all states
-> Check keyboard and reduced motion -> Check real browsers
-> Record regressions -> Verify fixes
```

Keep a small but representative visual regression suite and supplement it with manual interaction checks.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Inverting a light theme mechanically | Dark mode is treated as a color swap | Rebuild semantic surface, text, border, and state relationships |
| Using pure black for every surface | Black looks dramatic in mockups | Test a stepped near-black surface system in realistic conditions |
| Making every surface almost identical | Subtle differences look elegant on one display | Add deliberate grouping cues through surface, border, and spacing |
| Using bright white for all text | Maximum brightness seems safest | Tune primary and secondary text while maintaining verified contrast |
| Making secondary text too dim | The hierarchy depends on opacity | Use a semantic secondary token that remains readable |
| Using the brand accent everywhere | Accent color is mistaken for decoration | Reserve strong accents for primary actions and meaningful states |
| Assuming saturation guarantees contrast | Bright hues appear visually prominent | Check actual foreground/background contrast |
| Relying on shadows for elevation | Light-theme conventions are reused | Combine surface steps, borders, spacing, and restrained shadows |
| Removing focus outlines | Default outlines clash with the theme | Provide a visible `:focus-visible` ring and test it on all surfaces |
| Communicating status only through color | State styling is faster to implement | Add text, iconography, and semantic status where useful |
| Making disabled controls unreadable | Opacity is applied to the entire component | Tune disabled foreground and background separately |
| Ignoring native form controls | Mockups use custom controls | Test `color-scheme`, inputs, selects, autofill, and validation in supported browsers |
| Letting system preference override an explicit choice | Theme precedence is unspecified | Define and test the preference precedence contract |
| Showing a flash of the wrong theme | Theme is applied after initial rendering | Resolve saved preference early where feasible and test reload behavior |
| Using hover-only feedback | Desktop pointer use is assumed | Provide keyboard focus and touch-compatible feedback |
| Making chart series distinguishable only by hue | Palette looks coherent on a screenshot | Add labels, markers, patterns, or other redundant cues |
| Styling an error as a clickable action | Color and shape conventions conflict | Keep state containers and interactive controls visually distinct |
| Forgetting overlays and backdrops | Only page surfaces are tokenized | Review dialogs, menus, drawers, and their focus behavior |
| Dimming images indiscriminately | Bright media disrupts the palette | Use approved theme-specific assets and preserve informational fidelity |
| Ignoring long-form reading | The page is judged from short UI labels | Test real text, line length, line height, and long sessions where relevant |
| Hard-coding component colors | Teams bypass shared tokens under time pressure | Audit the cascade and use semantic theme variables |
| Testing only one monitor | The design looks good on the designer's display | Check multiple displays and realistic brightness settings |
| Treating automated contrast scans as complete validation | Tools report a simple pass/fail | Inspect composited surfaces, focus states, and real content manually |
| Forgetting forced-colors behavior | Dark mode is assumed to cover all preferences | Test forced-colors mode and avoid overriding system affordances |
| Overusing colored badges | Color becomes the main hierarchy mechanism | Use neutral surfaces and reserve semantic color for meaningful states |
| Ignoring narrow viewports | Desktop layout dominates review | Test narrow and intermediate widths with open menus and dialogs |
| Assuming dark mode saves power universally | Display technology is generalized | Avoid energy claims without knowing the display and usage context |
| Omitting state-specific contrast checks | Tokens are tested only in their default state | Verify hover, active, selected, disabled, error, and focus combinations |
| Forgetting keyboard navigation in dialogs | The overlay appears visually correct | Test focus movement, Escape behavior, and focus restoration |
| Declaring the theme finished after screenshot review | Visual polish is mistaken for functional quality | Test real interactions, native controls, and preference persistence |

---

## Mental Models

1. **Dark mode is a semantic theme** — Roles such as canvas, surface, border, and text matter more than the raw hex values.
2. **Hierarchy is a luminance relationship** — Surface differences, spacing, borders, and text emphasis work together to establish order.
3. **Accent color is a scarce resource** — The more places that use the strongest accent, the less useful its emphasis becomes.
4. **Contrast belongs to the rendered context** — A token must be evaluated against its actual background, including transparency and overlays.
5. **Focus is part of the visual system** — Keyboard focus needs to be visible on every surface, not only in the default theme.
6. **State must survive color blindness and motion reduction** — Text, semantics, shape, and stable cues should reinforce important meaning.
7. **System preference is a default, not always the final authority** — Explicit user choices need predictable precedence.
8. **Native controls are part of the product** — Browser and operating-system behavior must be tested, not assumed from a design file.
9. **Darkness does not guarantee comfort** — Readability depends on text, display, ambient conditions, and individual preference.
10. **Tokens prevent visual drift** — Shared semantic roles make a large interface coherent as components and teams grow.
11. **A screenshot cannot prove interaction quality** — Focus, theme persistence, error states, and real controls require runtime testing.
12. **Accessibility is a design constraint, not a final audit** — Contrast, focus, and state communication should shape the palette from the beginning.

---

## Quick Reference

| Area | Check | Evidence |
|---|---|---|
| Palette | Are colors assigned semantic roles? | Token list and component mapping |
| Surfaces | Can users distinguish layers? | Canvas, cards, popovers, and dialog review |
| Text | Is every text role legible on its real surface? | Contrast checks with real content |
| Accent | Does strong color indicate meaningful priority? | Screen audit of primary actions and selected states |
| Borders | Are boundaries visible without excessive boxing? | Inputs, cards, separators, and menus |
| Focus | Is keyboard focus obvious? | `:focus-visible` check on all interactive states |
| Forms | Are labels, errors, and disabled states clear? | Browser test with real values and invalid input |
| Theme toggle | Is precedence and persistence predictable? | System change, explicit choice, reload |
| Native controls | Do browser-rendered controls match the theme? | Cross-browser input, select, autofill, and picker review |
| Charts | Are series and labels distinguishable? | Realistic chart and color-vision review |
| Overlays | Are layers and focus behavior clear? | Dialog, popover, drawer, and backdrop tests |
| Reduced motion | Does state remain clear without movement? | `prefers-reduced-motion` test |
| Forced colors | Are system accessibility preferences respected? | Forced-colors mode where supported |
| Responsive layout | Does the hierarchy survive narrow widths? | Narrow and intermediate viewport review |
| Debugging | Can hard-coded or conflicting colors be found? | DevTools computed styles and console checks |
| Governance | Are token roles and exceptions documented? | Design-system specification and review process |

---

## Build Challenge

Design a dark theme for a project analytics dashboard with navigation, metric cards, a data table, a chart, filters, a form dialog, and success/error states. The dashboard must support both a saved dark preference and following the operating-system preference. The result should be coherent, readable, and operable—not merely visually dramatic.

### Requirements

1. **Create semantic tokens.** Define canvas, surface, raised surface, primary and secondary text, border, accent, focus, success, warning, and danger roles.
2. **Create a surface ladder.** Demonstrate how the canvas, cards, popovers, and dialog are distinguished without depending on shadow alone.
3. **Define text roles.** Specify typography and contrast expectations for headings, body copy, secondary labels, table content, and chart labels.
4. **Design primary and secondary actions.** Ensure button text is readable on its fill and that hover, active, disabled, and focus states remain distinct.
5. **Implement navigation states.** Include a selected destination cue that does not rely on color alone and use semantic current-page markup.
6. **Build an accessible form dialog.** Associate labels and errors with controls, manage focus, and preserve a visible `:focus-visible` indicator.
7. **Implement theme preference precedence.** Follow the system by default, honor an explicit user choice, and document how the choice persists.
8. **Review native controls.** Test inputs, selects, autofill, validation, and browser-native surfaces in the supported browser matrix.
9. **Design chart semantics.** Make series, axes, gridlines, tooltips, and status colors readable; use cues beyond hue when needed.
10. **Create state examples.** Include loading, empty, success, warning, disabled, and error states with clear non-color signals.
11. **Respect accessibility preferences.** Check reduced motion and forced-colors behavior where supported.
12. **Test responsive layouts.** Review wide, intermediate, and narrow viewports, including open menus and dialogs.
13. **Run contrast and runtime checks.** Inspect rendered colors and focus states with tools and the actual browser rather than relying only on design tokens.
14. **Create a regression checklist.** Cover theme switching, reload, keyboard interaction, native controls, chart readability, and state feedback.
15. **Document the design-system contract.** Explain token use, component states, exceptions, and the process for proposing new semantic colors.

### Failure and edge conditions

The challenge fails if the interface uses a mechanical light-theme inversion, relies on color alone for status or selection, removes visible focus, or displays illegible secondary and disabled text. It also fails if the system preference unexpectedly overrides an explicit user choice, the theme flashes incorrectly on reload, charts become indistinguishable, or the modal looks correct but leaves keyboard focus behind the overlay.

### Definition of Done

- Semantic tokens cover all major surface, text, border, accent, focus, and status roles.
- Surfaces communicate hierarchy through intentional contrast and grouping.
- Text and control contrast are checked in their rendered contexts.
- Accent color is reserved for meaningful actions and states.
- Selected, disabled, hover, active, error, and focus states are visually distinct.
- Navigation and forms use semantic HTML and visible keyboard focus.
- Theme preference precedence and persistence are documented and tested.
- Native controls are reviewed in supported browsers.
- Chart series and statuses are not communicated by hue alone.
- Reduced-motion and forced-colors behavior preserve essential information.
- Responsive layouts remain understandable at intermediate and narrow widths.
- DevTools review catches hard-coded colors, focus issues, and runtime failures.
- A regression checklist is included with the design-system handoff.
- Known limitations and browser-specific behaviors are documented.
