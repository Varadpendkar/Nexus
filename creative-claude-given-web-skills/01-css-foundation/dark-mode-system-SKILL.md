# SKILL: dark-mode-system

## Layer
**Layer 01 — CSS Foundation**

## Goal
Create a reliable dark-mode system that supports light, dark, and optionally system-selected themes without duplicating the entire stylesheet. Use semantic design tokens, correct native control rendering, accessible contrast, theme-aware assets and effects, and a predictable preference model.

## When to Use This Skill
Use this skill when:
- A product supports light and dark themes.
- Users can choose a theme or follow their operating-system preference.
- Components need consistent surfaces, borders, text, and elevation across themes.
- Native controls, charts, icons, illustrations, and shadows need theme-aware styling.
- Theme changes cause flashes, unreadable states, or inconsistent colors.
- A design system needs theme tokens that scale beyond one page.

## Why This Matters (Senior Perspective)
Dark mode is not simply a black background and white text. It changes perceived contrast, visual hierarchy, elevation cues, color relationships, image treatment, and the appearance of native controls. A system that swaps a handful of colors but ignores borders, shadows, disabled states, focus rings, charts, and embedded content will feel unfinished and can become inaccessible.

The senior-level approach is to define **semantic tokens** that describe purpose—such as `--color-surface`, `--color-text-muted`, and `--color-border`—rather than scattering raw colors throughout components. Components then consume those tokens and do not need to know whether the current theme is light or dark. Theme selection is a separate concern from token values: the browser may follow the operating system, the user may choose a preference, and the application may need to persist that choice.

A robust implementation answers four questions:
1. What theme should be active by default?
2. How does an explicit user choice override the system preference?
3. How are colors and native controls synchronized?
4. What happens if JavaScript is delayed, storage is unavailable, or a theme-specific asset fails?

The goal is not to maximize darkness. The goal is a coherent, readable, predictable interface in every supported theme.

## Core Concepts

### 1. Semantic Tokens, Not Component-Specific Color Patches
Define tokens around roles instead of encoding the visual theme into every component.

```css
:root {
  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-text: #172033;
  --color-text-muted: #526075;
  --color-border: #d7dee8;
  --color-accent: #315bd6;
}
```

Components should use `var(--color-surface)` rather than hardcoding white. Dark mode then changes the token values centrally.

**Gotcha:** Tokens named `--white-text` or `--black-card` encode one theme’s implementation. Prefer names based on function so the same component can work across themes.

### 2. Establish a Theme Contract
Choose a consistent theme selector. Common options include:
- `data-theme="light"` or `data-theme="dark"` on `<html>`.
- A class such as `.theme-dark` on the root element.
- System preference through `prefers-color-scheme`.

A root attribute is explicit and easy to inspect:

```html
<html lang="en" data-theme="light">
```

Use one contract throughout the application. Do not mix root attributes, body classes, and component-local dark classes without a clear reason.

### 3. System Preference With `prefers-color-scheme`
When the user has not explicitly selected a theme, CSS can follow the operating-system preference.

```css
:root {
  color-scheme: light;
  --color-canvas: #f8fafc;
  --color-text: #172033;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --color-canvas: #10141c;
    --color-text: #edf2fa;
  }
}
```

The exact selector depends on your theme contract. If an explicit `data-theme="dark"` is used, define its token values directly; if an explicit `data-theme="light"` exists, it should override the system’s dark preference.

**Gotcha:** A CSS media query does not automatically respect a JavaScript theme toggle unless the selector logic accounts for the explicit user choice.

### 4. Separate Preference From Appearance
There are usually three preference states:
- `light`: always use light theme.
- `dark`: always use dark theme.
- `system`: follow the operating system.

The active appearance is the result of the preference and the system setting. Keep those concepts separate in your application state.

For example, `data-theme="dark"` can represent the resolved active theme, while a separate stored preference records `system`, `light`, or `dark`. Alternatively, the root can store the preference and CSS resolves `system`; choose one model and document it.

### 5. Define Tokens for All Important Roles
A mature token set includes more than background and text:
- Canvas and raised surfaces.
- Primary, secondary, and muted text.
- Borders and separators.
- Accent, hover, active, and selected states.
- Success, warning, danger, and informational states.
- Focus ring.
- Overlay and scrim.
- Shadows and elevation.
- Input fill, placeholder, and disabled states.
- Link and visited-link colors where relevant.

```css
:root {
  --color-canvas: #f7f9fc;
  --color-surface: #ffffff;
  --color-surface-subtle: #eef2f7;
  --color-text: #172033;
  --color-text-muted: #596579;
  --color-border: #d4dce7;
  --color-focus: #2459d3;
  --color-danger: #b42318;
}
```

**Gotcha:** If only the page background changes, cards, menus, borders, and input fills can remain light and look like broken components.

### 6. Theme Values Should Be Designed, Not Mechanically Inverted
Do not simply invert every color or replace white with black. Dark surfaces often work better with a small range of dark neutral values, while text should be bright enough to read without producing harsh glare. Accent colors may need a separate dark-theme value to preserve contrast.

```css
:root {
  --color-canvas: #f7f9fc;
  --color-surface: #ffffff;
  --color-text: #172033;
  --color-accent: #244fc5;
}

[data-theme="dark"] {
  --color-canvas: #10141c;
  --color-surface: #191f2b;
  --color-text: #edf2fa;
  --color-accent: #a8bcff;
}
```

Check actual text/background pairs in both themes. The same accent hue may have very different contrast on a light versus dark surface.

### 7. Use `color-scheme` for Native Controls
The `color-scheme` property tells the browser which color schemes an element supports, influencing native form controls, scrollbars, and other user-agent-rendered UI.

```css
:root {
  color-scheme: light;
}

[data-theme="dark"] {
  color-scheme: dark;
}
```

If your theme is explicit, update this property alongside your design tokens. Otherwise a dark custom page can contain bright native inputs or menus that do not match.

### 8. Native Controls Still Need Deliberate Styling
`color-scheme` helps, but it does not guarantee every native control matches your design. Check text inputs, selects, checkboxes, radio buttons, date controls, autofill, placeholders, disabled fields, and validation messages.

```css
input,
select,
textarea {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

input::placeholder,
textarea::placeholder {
  color: var(--color-text-muted);
}
```

Do not remove native appearance unless you are prepared to recreate accessible focus, selected, disabled, and error states.

### 9. Explicit Theme Overrides
A clear theme contract makes precedence predictable.

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --color-canvas: #f8fafc;
  --color-surface: #ffffff;
  --color-text: #172033;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #10141c;
  --color-surface: #191f2b;
  --color-text: #edf2fa;
}
```

If `system` is a valid preference, decide whether it is represented as an attribute or by removing the explicit theme attribute and letting CSS media queries choose the tokens. Do not let both models compete accidentally.

### 10. A Three-State Theme Selector
A UI can expose Light, Dark, and System options. A two-state toggle is also valid if the product deliberately omits system-following behavior.

```html
<label for="theme-choice">Appearance</label>
<select id="theme-choice" name="theme">
  <option value="system">Use device setting</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
```

The selected option must reflect the stored preference, not just the current resolved appearance. If the OS is dark and the preference is `system`, the select should still show “Use device setting.”

### 11. Persisting Theme Preference
A user’s explicit preference may be stored in `localStorage`, a cookie, or a server-side profile depending on the product. Choose storage based on privacy, authentication, cross-device expectations, and rendering architecture.

Example client-side persistence:

```js
const THEME_KEY = "site-theme";
const allowedThemes = new Set(["system", "light", "dark"]);

function readThemePreference() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return allowedThemes.has(value) ? value : "system";
  } catch {
    return "system";
  }
}

function saveThemePreference(value) {
  if (!allowedThemes.has(value)) return;
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // Keep the current page functional when storage is unavailable.
  }
}
```

Treat stored values as untrusted input and validate them. Storage may be unavailable in private browsing contexts, restricted environments, or embedded webviews.

**Gotcha:** Do not make the entire application fail because reading or writing a preference throws an exception.

### 12. Avoiding a Flash of the Wrong Theme
If the theme is applied only after a large JavaScript bundle loads, users may briefly see the wrong colors. This is commonly called a flash of incorrect theme.

A common approach is a small, guarded initialization script in the document head that reads the preference and applies the root theme before the page is painted. In server-rendered applications, the server may use a cookie or profile preference to render the correct initial theme.

```html
<script>
  (() => {
    const key = "site-theme";
    let preference = "system";

    try {
      const stored = localStorage.getItem(key);
      if (["system", "light", "dark"].includes(stored)) {
        preference = stored;
      }
    } catch {}

    const systemDark = window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = preference === "system"
      ? (systemDark ? "dark" : "light")
      : preference;

    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
  })();
</script>
```

This example uses `data-theme` for the resolved theme and `data-theme-preference` for the stored preference. Ensure the CSS and application state follow the same contract.

**Gotcha:** Inline initialization scripts may be restricted by a Content Security Policy. Use a permitted nonce, hash, server-rendered attribute, or another strategy that fits the application’s security architecture.

### 13. Reacting to Operating-System Changes
When the preference is `system`, the page may need to respond if the operating-system theme changes while the page remains open.

```js
const media = window.matchMedia("(prefers-color-scheme: dark)");

function updateResolvedTheme(preference) {
  const resolved = preference === "system"
    ? (media.matches ? "dark" : "light")
    : preference;

  document.documentElement.dataset.theme = resolved;
}

media.addEventListener("change", () => {
  if (readThemePreference() === "system") {
    updateResolvedTheme("system");
  }
});
```

If your app supports older browser versions, check the support matrix for the relevant event API. Remove listeners when they are no longer needed in component-based applications.

### 14. Theme Toggle State Must Be Synchronized
The control, stored preference, root attribute, and rendered appearance must agree. Avoid updating only the icon while forgetting the underlying state or persistence.

```js
function applyThemePreference(preference) {
  if (!["system", "light", "dark"].includes(preference)) return;

  const isSystemDark = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  const resolved = preference === "system"
    ? (isSystemDark ? "dark" : "light")
    : preference;

  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;
  saveThemePreference(preference);
}
```

Keep the preference as the source of truth and derive the active appearance from it. If your framework owns application state, update framework state as well rather than mutating the DOM behind its back without a defined integration.

### 15. Accessible Theme Controls
Use a native select, radio group, or a properly implemented button group. If a button toggles between two themes, its label and state should clearly communicate what it does.

A simple button can expose the action:

```html
<button type="button" aria-label="Switch to dark theme">
  <svg aria-hidden="true" viewBox="0 0 24 24">
    <!-- Decorative icon paths -->
  </svg>
</button>
```

Update the label when the action changes. If a control represents a persistent pressed state, `aria-pressed` may be appropriate; do not use it indiscriminately for a button whose accessible name changes to describe the next action.

**Gotcha:** An icon-only sun or moon button without an accessible name does not tell screen-reader users what will happen.

### 16. Contrast in Both Themes
Evaluate contrast for body text, muted text, links, icons, borders, controls, focus indicators, and status messages in both themes. Muted text often becomes too dim in dark mode; bright accent colors can lose contrast on light surfaces.

Use WCAG contrast guidance as a practical baseline:
- Normal text generally needs at least 4.5:1 contrast.
- Large text generally needs at least 3:1 contrast.
- User-interface components and meaningful graphical objects generally need at least 3:1 contrast against adjacent colors when the criterion applies.

These are not a substitute for testing states and content in context. Thin fonts, antialiasing, opacity, and image backgrounds can affect practical readability.

### 17. Focus Indicators Across Themes
Focus styling must be visible on both light and dark backgrounds. A single fixed ring color may fail on one theme.

```css
:root {
  --color-focus: #2459d3;
}

[data-theme="dark"] {
  --color-focus: #9db7ff;
}

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

Test focus on cards, menus, dialogs, and controls adjacent to the accent color. Avoid clipping the outline with `overflow: hidden`.

### 18. Shadows, Borders, and Elevation
Shadows behave differently on dark surfaces. A black shadow may disappear, so elevation may need to use a subtle shadow plus a border or surface-value difference.

```css
:root {
  --color-border: #d6deea;
  --shadow-card: 0 8px 24px rgb(15 23 42 / 10%);
}

[data-theme="dark"] {
  --color-border: #30394a;
  --shadow-card: 0 10px 28px rgb(0 0 0 / 28%);
}
```

Avoid bright outlines around every surface. Use a consistent elevation scale and reserve stronger separation for floating surfaces.

### 19. Status Colors Need Theme-Specific Values
Success, warning, danger, and information colors often need separate light/dark values. A color that looks good on a pale surface may glow harshly or become unreadable on a dark surface.

```css
:root {
  --color-success: #18794e;
  --color-warning: #8a4b08;
  --color-danger: #b42318;
}

[data-theme="dark"] {
  --color-success: #65d6a0;
  --color-warning: #f3c969;
  --color-danger: #ff9b9b;
}
```

Pair status color with text or an icon. Never rely on a red/green distinction alone to communicate meaning.

### 20. Links and Interactive States
Links should remain identifiable in both themes. If the default text and link colors are too similar, users may not know which text is interactive.

Define tokens for default, hover, active, and visited states where the product uses visited styling. Make sure hover and focus are not the only way a link is distinguishable.

### 21. Images and Illustrations
Photos often work in both themes, but logos, diagrams, transparent illustrations, and icons may need theme-specific assets or treatments.

Options include:
- Separate light and dark logo assets.
- SVG using `currentColor` when appropriate.
- CSS custom properties in inline SVG.
- A deliberate surface behind a transparent logo.
- A `picture` or application-selected asset when the art itself changes.

Do not apply `filter: invert(1)` to every image as a blanket dark-mode solution. It can distort photographs, brand colors, skin tones, and semantic color encoding.

**Gotcha:** A transparent dark logo may disappear on a dark surface. Place it on a suitable surface or provide an appropriate light variant.

### 22. SVG and `currentColor`
For icons that should follow text color, SVG can use `currentColor`:

```html
<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="..." fill="currentColor" />
</svg>
```

This is most reliable when the SVG is inline or part of the DOM styling context. An external SVG loaded as an image may not inherit the surrounding page’s `color` in the same way. Use a deliberate asset strategy for external icons.

### 23. Charts and Data Visualization
Charts need more than a background swap. Gridlines, axes, labels, tooltips, selection colors, and series colors should be checked for both themes.

Keep the series palette distinguishable and do not encode all information through color alone. If you use a library, connect its theme options to the same semantic tokens used by the rest of the interface.

### 24. Forms, Validation, and Autofill
Input backgrounds, placeholders, autofill colors, validation messages, and native control rendering may differ between browsers. Test actual form states rather than only an empty text field.

Use visible labels, maintain readable error text, and ensure the error state is not communicated solely by a border color. Avoid aggressive autofill overrides unless they have been tested across target browsers.

### 25. Embedded Content and Third-Party Widgets
An embedded map, video, code editor, or third-party widget may not follow the site’s theme. Check whether the integration exposes a theme option. If not, provide a deliberate surrounding surface and avoid filters that distort its controls.

Do not force `filter: invert()` onto an entire embedded widget without evaluating maps, photos, icons, and text. The result may look superficially dark while making information misleading.

### 26. Theme Transitions
A global transition on every property can create a slow, distracting flash across the entire page. If you animate theme changes, limit the transition to a small set of visual properties and keep it brief—or avoid animation entirely.

```css
.theme-surface {
  transition: background-color 120ms ease, color 120ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .theme-surface {
    transition: none;
  }
}
```

Be careful with transitions on a large number of elements. Test reduced motion and avoid animating properties that trigger expensive layout work.

### 27. `light-dark()` and `color-scheme`
Modern CSS includes `light-dark(light-color, dark-color)`, which can select a color based on the element’s used color scheme.

```css
:root {
  color-scheme: light dark;
  --color-canvas: light-dark(#f8fafc, #10141c);
  --color-text: light-dark(#172033, #edf2fa);
}
```

This can be useful when the system preference should drive colors. If the application provides an explicit theme selector, make sure the selected `color-scheme` is set correctly and that support matches your target browsers. Use token overrides or a fallback for older support targets.

### 28. CSS Custom Properties and Scope
Custom properties inherit, which makes them useful for themes. Define global tokens at the root and component-specific variants at a component boundary only when there is a real need.

```css
[data-theme="dark"] .notice {
  --notice-surface: #242c3a;
  --notice-text: #f0f4fb;
}

.notice {
  color: var(--notice-text, var(--color-text));
  background: var(--notice-surface, var(--color-surface));
}
```

Avoid defining the same token at many unrelated selectors. A predictable token hierarchy makes it easier to audit which values change with the theme.

### 29. Testing and Debugging Theme Bugs
When a component looks wrong:
1. Confirm the stored preference.
2. Confirm the resolved root theme attribute.
3. Confirm `color-scheme`.
4. Inspect the computed semantic tokens.
5. Check for hardcoded colors and overly specific selectors.
6. Inspect pseudo-elements, shadows, filters, and opacity.
7. Check native control states and autofill.
8. Verify focus, hover, disabled, selected, loading, and error states.
9. Test system preference changes while the app is open.
10. Test with storage blocked or unavailable.

Example diagnostic:

```js
const root = document.documentElement;
const styles = getComputedStyle(root);

console.table({
  theme: root.dataset.theme,
  preference: root.dataset.themePreference,
  colorScheme: styles.colorScheme,
  canvas: styles.getPropertyValue("--color-canvas").trim(),
  surface: styles.getPropertyValue("--color-surface").trim(),
  text: styles.getPropertyValue("--color-text").trim()
});
```

This gives a useful starting point, but child components may override tokens locally, so inspect the actual element too.

### 30. Theme Architecture and Maintenance
For a larger application, define:
- A documented preference model.
- One root theme contract.
- Semantic color tokens.
- Component-level tokens only where justified.
- A theme-aware asset policy.
- Contrast and interaction-state checks.
- A strategy for server rendering and initialization.
- A test matrix for system preference, explicit choices, and failures.

Do not create separate full stylesheets for light and dark unless the design truly requires different structural styling. Most theme differences should be represented by token values, while layout and component behavior remain shared.

## Reusable Patterns

### Pattern 1 — Semantic Light/Dark Tokens
```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --color-canvas: #f7f9fc;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-text: #172033;
  --color-text-muted: #596579;
  --color-border: #d4dce7;
  --color-accent: #244fc5;
  --color-focus: #2459d3;
}

[data-theme="dark"] {
  color-scheme: dark;
  --color-canvas: #10141c;
  --color-surface: #191f2b;
  --color-surface-raised: #222b3a;
  --color-text: #edf2fa;
  --color-text-muted: #b1bdcf;
  --color-border: #394355;
  --color-accent: #b1c3ff;
  --color-focus: #a8bcff;
}

body {
  color: var(--color-text);
  background: var(--color-canvas);
}
```
Components use role-based tokens and do not need theme-specific selectors.

### Pattern 2 — Three-State Preference Resolution
```js
const THEMES = new Set(["system", "light", "dark"]);
const THEME_KEY = "site-theme";
const systemScheme = window.matchMedia("(prefers-color-scheme: dark)");

function getPreference() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return THEMES.has(value) ? value : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") return preference;
  return systemScheme.matches ? "dark" : "light";
}

function applyPreference(preference) {
  if (!THEMES.has(preference)) return;

  const resolved = resolveTheme(preference);
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolved;

  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Preference still applies for the current page.
  }
}
```
Keep the selected preference distinct from the resolved theme. Integrate the functions with the application’s state model and lifecycle.

### Pattern 3 — Theme-Aware Native Controls
```css
:root {
  color-scheme: light;
}

[data-theme="dark"] {
  color-scheme: dark;
}

input,
select,
textarea {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
```
Test native controls in the browsers you support, including autofill and validation states.

### Pattern 4 — Accessible Theme Selector
```html
<label for="appearance">Appearance</label>
<select id="appearance" name="appearance">
  <option value="system">System</option>
  <option value="light">Light</option>
  <option value="dark">Dark</option>
</select>
```
The control should display the preference, not just the resolved colors. Associate it with the state update and persistence behavior.

### Pattern 5 — Focus Ring That Adapts to Theme
```css
:root {
  --color-focus: #2459d3;
}

[data-theme="dark"] {
  --color-focus: #a8bcff;
}

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```
Verify the ring on all surface types and ensure it is not clipped.

### Pattern 6 — Theme-Aware Elevation
```css
:root {
  --color-border: #d4dce7;
  --shadow-card: 0 8px 24px rgb(15 23 42 / 10%);
}

[data-theme="dark"] {
  --color-border: #343e50;
  --shadow-card: 0 10px 28px rgb(0 0 0 / 28%);
}

.card {
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}
```
Use border and surface contrast as well as shadows so the component remains distinct in both themes.

### Pattern 7 — Safe Theme Initialization
```html
<script>
  (() => {
    const key = "site-theme";
    let preference = "system";

    try {
      const stored = localStorage.getItem(key);
      if (["system", "light", "dark"].includes(stored)) {
        preference = stored;
      }
    } catch {}

    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = preference === "system"
      ? (dark ? "dark" : "light")
      : preference;

    document.documentElement.dataset.themePreference = preference;
    document.documentElement.dataset.theme = resolved;
  })();
</script>
```
Place early enough to avoid a visible theme flash, and adapt it to your Content Security Policy and rendering architecture.

### Pattern 8 — Theme-Aware Status Tokens
```css
:root {
  --color-success: #18794e;
  --color-warning: #8a4b08;
  --color-danger: #b42318;
}

[data-theme="dark"] {
  --color-success: #65d6a0;
  --color-warning: #f3c969;
  --color-danger: #ff9b9b;
}
```
Pair status colors with text or iconography and verify contrast on the actual surface.

### Pattern 9 — Theme-Aware SVG Icon
```html
<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="..." fill="currentColor" />
</svg>
```
Use inline SVG when the icon should inherit the current text color. For external assets, provide a separate theme strategy.

### Pattern 10 — Targeted Theme Transition
```css
.theme-surface {
  transition: color 120ms ease, background-color 120ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .theme-surface {
    transition: none;
  }
}
```
Keep theme changes fast and restrained. If animation creates a flash or distracts users, remove it.

### Pattern 11 — System-Preference CSS Baseline
```css
:root {
  color-scheme: light dark;
  --color-canvas: #f8fafc;
  --color-text: #172033;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not([data-theme="dark"]) {
    --color-canvas: #10141c;
    --color-text: #edf2fa;
  }
}
```
This pattern is appropriate when the root attribute represents only an explicit choice. If the app sets the resolved theme on the root, use the matching contract instead.

### Pattern 12 — Component-Scoped Theme Tokens
```css
.notice {
  --notice-surface: var(--color-surface);
  --notice-text: var(--color-text);
  color: var(--notice-text);
  background: var(--notice-surface);
}

[data-theme="dark"] .notice--warning {
  --notice-surface: #342b1d;
  --notice-text: #ffdfa0;
}
```
Use local tokens for a real component variant, not to duplicate the global palette everywhere.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Replacing every white with black | Produces harsh contrast and broken surface hierarchy | Design a deliberate dark neutral scale |
| Hardcoding component colors | Components drift between themes | Use semantic tokens |
| Naming tokens by their current color | Encodes a single theme into the API | Name tokens by purpose |
| Changing only the page background | Cards, menus, borders, and inputs remain mismatched | Define a complete role-based token set |
| Ignoring `color-scheme` | Native controls may clash with the page | Set it alongside theme tokens |
| Assuming `prefers-color-scheme` handles explicit choice | The OS can override a user-selected theme | Define explicit selector precedence |
| Storing only the resolved theme | The app cannot distinguish system preference from explicit choice | Store `system`, `light`, or `dark` preference |
| Forgetting storage errors | The theme toggle can break in restricted contexts | Wrap storage access in `try/catch` |
| Trusting stored values blindly | Unexpected values can create invalid state | Validate against an allowlist |
| Applying theme after a large bundle loads | Users may see a flash of the wrong theme | Initialize early or render from server preference |
| Ignoring Content Security Policy | Inline initialization may be blocked | Use an approved nonce, hash, or server strategy |
| Updating only the toggle icon | UI and actual theme can disagree | Synchronize preference, root attribute, and state |
| Providing an unlabeled icon button | Assistive technology cannot identify the action | Add an accessible name and correct state semantics |
| Using one focus color for every surface | Focus can disappear in one theme | Use theme-aware focus tokens and test them |
| Using muted text that is too dim | Secondary content becomes difficult to read | Verify contrast for every text role |
| Reusing the same accent without checking contrast | Accent colors can fail against the opposite theme | Tune accent tokens separately |
| Assuming dark mode needs no borders | Surfaces can merge together | Use a restrained border and surface-value scale |
| Using black shadows alone in dark mode | Shadows can become invisible | Combine shadow with border or surface contrast |
| Inverting every image | Photos and brand colors become distorted | Provide theme-aware assets or controlled surfaces |
| Using `currentColor` in external SVG images expecting inheritance | External image documents may not inherit page color | Use inline SVG or explicit asset variants |
| Forgetting chart gridlines and tooltips | Data visualization remains hard to read | Theme chart components with semantic tokens |
| Styling only empty form fields | Autofill, errors, disabled, and selected states may clash | Test the full form state matrix |
| Using a filter on an entire third-party widget | Images and controls can become misleading | Use widget theme options or a surrounding surface |
| Animating every property on theme change | Creates a slow, distracting visual flash | Limit or remove theme transitions |
| Ignoring reduced-motion preference | Transitions may be uncomfortable | Disable nonessential theme animation when requested |
| Mixing root attributes and body classes | Theme precedence becomes hard to debug | Choose one root contract |
| Defining tokens repeatedly in unrelated selectors | The effective palette becomes unpredictable | Keep a documented token hierarchy |
| Using status color alone | Meaning may be lost to some users | Pair color with text, icons, or patterns |
| Forgetting visited and active link states | Interactive text becomes inconsistent | Define and test link states in both themes |
| Assuming all browsers render native controls identically | Control appearance varies across browsers | Test target browsers and retain accessible fallbacks |
| Letting system changes override explicit preference | User choice appears unreliable | Respond to OS changes only when preference is `system` |
| Failing to test the no-JavaScript or delayed-JavaScript state | Initial theme can be inconsistent | Choose a safe CSS/server baseline |
| Not testing actual surfaces | A palette can pass in isolation but fail in context | Check text, focus, controls, and overlays on real surfaces |

## Mental Models

1. **Role-token model:** components ask for a semantic role, not a literal color. The theme supplies the value.
2. **Preference-versus-resolution model:** `system`, `light`, and `dark` are preferences; the active appearance is the resolved result.
3. **Single-contract model:** one root selector and one precedence rule make theme state predictable.
4. **Surface-hierarchy model:** canvas, surface, raised surface, border, and shadow must work together to express depth.
5. **Native-control model:** CSS colors alone do not fully theme browser-rendered controls; `color-scheme` and state testing matter.
6. **Contrast-in-context model:** contrast must be checked on the actual surface, with opacity, borders, focus rings, and imagery included.
7. **Initialization model:** theme correctness includes the first paint, not only the state after JavaScript finishes.
8. **Resilient-storage model:** preference persistence is an enhancement; failure to access storage should not break the interface.
9. **Asset-intent model:** a photo, logo, diagram, and icon have different theme needs; do not treat all images alike.
10. **State-matrix model:** empty, hover, focus, active, selected, disabled, error, and loading states all need theme coverage.
11. **System-respect model:** system changes should affect the page only when the user’s preference is to follow the system.
12. **Token-economy model:** a compact, documented semantic palette is easier to audit than many isolated per-component colors.

## Quick Reference

| Need | Prefer | Watch Out For |
|---|---|---|
| Reusable colors | Semantic custom properties | Avoid color-specific token names |
| System-following theme | `prefers-color-scheme` | Explicit choices need precedence |
| Native control scheme | `color-scheme` | Still test actual control states |
| Three-state selection | `system`, `light`, `dark` preference | Store preference separately from resolution |
| Prevent initial flash | Early guarded initialization or server rendering | CSP and storage failures |
| Focus visibility | Theme-aware `:focus-visible` token | Check all surfaces and clipping |
| Dark surface depth | Border + surface values + subtle shadow | Black shadows alone may disappear |
| Theme-specific logos | Separate assets or controlled surfaces | Avoid blanket inversion |
| SVG that follows text | Inline SVG with `currentColor` | External image SVG may not inherit |
| Charts | Theme tokens for axes, grids, labels, and series | Do not rely on color alone |
| Theme transition | Short targeted color/background transition | Honor reduced motion |
| Debugging | Inspect preference, root attribute, and computed tokens | Child-level overrides may differ |

## Build Challenge — Production-Ready Theme System

Implement light, dark, and system themes for a small dashboard with navigation, cards, a form, a status banner, a chart placeholder, and a table.

### Requirements
1. Define one root-level theme contract.
2. Document whether `data-theme` stores the preference or the resolved theme.
3. Represent `system`, `light`, and `dark` preferences distinctly.
4. Define semantic tokens for canvas, surface, raised surface, text, muted text, border, accent, focus, overlay, and status colors.
5. Create a deliberately designed light palette.
6. Create a deliberately designed dark palette.
7. Avoid mechanically inverting all colors.
8. Set `color-scheme` correctly for the active theme.
9. Theme text inputs, selects, textareas, placeholders, and disabled controls.
10. Test native controls in at least two target browsers.
11. Implement an accessible theme selector or toggle.
12. Ensure the control’s accessible name describes its purpose or next action.
13. Synchronize the preference, UI state, root attribute, and persistence.
14. Validate persisted values against an allowlist.
15. Handle storage exceptions without breaking the current page.
16. Apply the correct theme before first paint where the architecture allows.
17. Document the strategy for Content Security Policy restrictions.
18. Follow operating-system changes only when preference is `system`.
19. Use a theme-aware focus ring and verify it against all surfaces.
20. Check contrast for normal and large text in both themes.
21. Check meaningful component boundaries and graphical objects.
22. Provide theme-aware shadow and border tokens.
23. Provide separate values for status colors where needed.
24. Ensure status is not communicated by color alone.
25. Verify link, hover, active, visited, and disabled states.
26. Provide a strategy for logos, SVG icons, and illustrations.
27. Do not apply blanket inversion to photographs or complex widgets.
28. Theme chart labels, gridlines, tooltips, and series where applicable.
29. Keep theme transitions short or remove them.
30. Respect `prefers-reduced-motion`.
31. Test empty, loading, error, selected, and disabled states.
32. Test theme switching while the page remains open.
33. Test with storage unavailable or blocked.
34. Inspect computed styles for the root and at least two child components.
35. Record screenshots of each theme and the system-following state.
36. Document the token naming and override policy.
37. Verify the page remains readable if a theme-specific asset fails to load.
38. Check keyboard navigation and visible focus in both themes.
39. List the browsers and operating-system preference combinations tested.
40. Explain at least three trade-offs involving contrast, surface hierarchy, and theme initialization.

### Acceptance Checklist
- [ ] Light, dark, and system preferences are distinguishable.
- [ ] The selected preference and resolved appearance remain synchronized.
- [ ] Native controls match the active color scheme.
- [ ] All semantic tokens are used consistently.
- [ ] Contrast and focus are verified in both themes.
- [ ] Images, logos, SVGs, charts, and status colors have a deliberate strategy.
- [ ] Storage and initialization failures do not break usability.
- [ ] Operating-system changes respect explicit user choice.
- [ ] Reduced-motion preferences are honored.
- [ ] Theme states have been tested across browsers and interaction states.

## Final Rule
**Treat theme as a system of semantic roles and explicit preferences—not as a global color inversion.** If the user’s choice, the first paint, native controls, and component states do not agree, the theme system is incomplete.
