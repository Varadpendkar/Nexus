# SKILL: css-variables-system

## Layer
01 — CSS Foundation

## Goal
Build a maintainable CSS custom-property system for design tokens, themes, component contracts, and runtime-adjustable visual behavior. Use variables to centralize meaningful decisions, reduce duplication, and let components adapt without turning the stylesheet into a maze of aliases and overrides.

## Why This Matters (Senior Perspective)
CSS custom properties are more than a way to avoid repeating hex colors. They create an interface between design decisions and implementation. A well-designed token system lets a team change a theme, tune spacing, adapt component variants, and reason about visual consistency without editing dozens of unrelated selectors.

The senior-level skill is not knowing that `var()` exists. It is choosing the right abstraction boundary: which values are global primitives, which values express semantic intent, which values belong to a component, and which should remain ordinary declarations. Too few tokens create inconsistency; too many tokens create a brittle naming system that nobody can navigate. Good custom-property architecture balances reuse, clarity, cascade behavior, and the cost of future change.

---

## Core Concepts

### 1. Custom properties are runtime CSS values

A custom property begins with `--` and is read using `var()`:

```css
:root {
  --brand: #5b4bdb;
  --space-card: 1.5rem;
}

.card {
  background: var(--surface);
  padding: var(--space-card);
}
```

Unlike preprocessor variables, CSS custom properties exist in the browser's cascade and can change by selector, inheritance, media query, container context, or JavaScript. The browser resolves them as part of CSS computation, so they can participate in live theme changes.

**Gotcha:** A custom property is not automatically a design token. `--temp: 17px` is technically valid, but a useful token should express a stable decision or a documented component contract.

### 2. Understand the three naming layers

**Gotcha:** Do not create a semantic alias for a primitive that has only one consumer and no meaningful semantic role; unnecessary layers make token tracing harder.

A practical token system often has three layers:

1. **Primitive tokens** — raw values such as a palette step or base spacing value.
2. **Semantic tokens** — values named by purpose, such as `--text-primary` or `--surface-raised`.
3. **Component tokens** — values exposed by a component, such as `--button-bg` or `--card-padding`.

```css
:root {
  /* Primitive */
  --purple-600: #5b4bdb;
  --gray-950: #14131a;
  --space-4: 1rem;

  /* Semantic */
  --color-action: var(--purple-600);
  --color-text: var(--gray-950);
  --space-component: var(--space-4);
}

.button {
  /* Component contract */
  --button-background: var(--color-action);
  background: var(--button-background);
}
```

Not every project needs all three layers. A small site can use a compact set of semantic variables. A large product with multiple brands or themes benefits from a more explicit token pipeline.

### 3. Use semantic names for intent

**Gotcha:** A semantic name should remain truthful across every theme. Avoid naming a token `--text-on-dark` if it is also used on light surfaces.

A semantic token describes what a value means, not merely what it looks like.

Prefer:

```css
:root {
  --text-primary: #191820;
  --text-muted: #5f5d6b;
  --surface-page: #ffffff;
  --surface-panel: #f5f4f8;
  --border-subtle: #dedce5;
  --action-primary: #4f46e5;
}
```

Avoid encoding current appearance into the semantic name when that appearance may change:

```css
/* Less flexible for themes */
:root {
  --white-text: #191820;
  --light-gray-background: #f5f4f8;
}
```

A name such as `--text-primary` can map to a light value in one theme and a light-colored value in another. The name stays stable while the mapping changes.

### 4. Define global tokens at a deliberate scope

**Gotcha:** A token placed on `:root` cannot automatically know which component variant needs a different value. Prefer local overrides when ownership is local.

`:root` is a common place for global tokens because root custom properties inherit throughout the document.

```css
:root {
  --radius-card: 1rem;
  --shadow-card: 0 0.75rem 2rem rgb(0 0 0 / 0.08);
  --content-max: 76rem;
}
```

Use narrower scopes when a value only matters within a component or region. Putting every variable in `:root` can make the global namespace noisy and obscure ownership.

```css
.product-card {
  --card-gap: 0.75rem;
  display: grid;
  gap: var(--card-gap);
}
```

A scoped property can be overridden locally without inventing a globally unique name for every tiny implementation detail.

### 5. Inheritance is a feature—and a source of surprises

Custom properties inherit by default. A child normally receives the computed value inherited from its ancestor unless another declaration overrides it.

```css
:root {
  --accent: royalblue;
}

.panel {
  --accent: tomato;
}

.panel a {
  color: var(--accent);
}
```

The link inside `.panel` uses the locally overridden accent. This makes scoped themes and component variants possible.

**Gotcha:** Custom properties are resolved according to the cascade and inheritance rules at the element where they are used. A variable defined on a sibling does not become available to another sibling merely because both share a parent.

### 6. The cascade still decides which value wins

**Gotcha:** A custom property declared in a later rule may still lose to a more specific selector or a different cascade layer. Check the complete cascade rather than source order alone.

Custom properties obey selector specificity, source order, cascade layers, importance, and inheritance. They do not bypass the cascade.

```css
:root {
  --surface: white;
}

.theme-dark {
  --surface: #17171c;
}

.card {
  background: var(--surface);
}
```

The nearest applicable inherited value is often what makes this pattern work. When a token seems incorrect, inspect the element's computed custom property and the rule that supplied it rather than assuming `var()` is broken.

### 7. Fallbacks in `var()`

**Gotcha:** A fallback should be a deliberate default, not a way to hide a missing required token that should have been caught during development.

The second argument to `var()` is a fallback used when the referenced custom property is missing or invalid at computed-value time.

```css
.card {
  padding: var(--card-padding, 1rem);
}
```

Fallbacks are helpful for optional component customization and gradual adoption of tokens. They are not a substitute for defining the system correctly.

```css
.component {
  color: var(--text-primary, #222);
}
```

**Gotcha:** A fallback does not mean “use this whenever the token has an unexpected but valid value.” If `--card-padding: red` is defined, the custom property exists; the consuming declaration may become invalid because `red` is not a valid padding value. The fallback does not necessarily rescue that declaration.

### 8. Fallbacks can contain comma-separated values

The fallback portion can contain more than one token, including commas, as long as the syntax is understood as part of the fallback.

```css
.card {
  box-shadow: var(
    --card-shadow,
    0 0.5rem 1.5rem rgb(0 0 0 / 0.12)
  );
}
```

Do not assume the first comma inside a color function or shadow ends the fallback; `var()` syntax allows a fallback token sequence after its first separator.

### 9. Use component tokens as public customization points

A component token is a deliberate hook for changing a component without editing its internal selector structure.

```css
.button {
  --_button-bg: var(--button-bg, var(--action-primary));
  --_button-text: var(--button-text, white);

  background: var(--_button-bg);
  color: var(--_button-text);
  border: 0;
  border-radius: var(--button-radius, 0.6rem);
  padding: 0.75em 1.1em;
}
```

Here `--button-bg` is the public customization point, while `--_button-bg` is a private implementation alias by naming convention. The underscore is only a convention; CSS does not enforce privacy.

**Gotcha:** Do not expose a public custom property for every internal declaration. Keep public component variables limited to values consumers are expected to customize.

### 10. Build theme maps with stable semantic tokens

**Gotcha:** If a theme scope is nested inside another theme scope, verify which declaration wins for each semantic token; nested scopes can intentionally or accidentally inherit a mixed palette.

Themes should redefine semantic tokens, not require components to know which theme is active.

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --surface-page: #ffffff;
  --surface-panel: #f6f5f9;
  --text-primary: #1c1b22;
  --text-secondary: #5d5a68;
  --border-subtle: #dedbe5;
  --action-primary: #4f46e5;
}

[data-theme="dark"] {
  color-scheme: dark;
  --surface-page: #15151a;
  --surface-panel: #202027;
  --text-primary: #f5f4fa;
  --text-secondary: #c2bfce;
  --border-subtle: #3c3a46;
  --action-primary: #a9a0ff;
}

body {
  background: var(--surface-page);
  color: var(--text-primary);
}
```

The component CSS remains unchanged when the theme changes. This separation keeps theme logic from leaking into every component selector.

### 11. Respect system theme preferences

**Gotcha:** If the app writes `data-theme="light"` by default, the `:root:not([data-theme])` system-preference rule will no longer match. Represent automatic mode distinctly from an explicit light selection.

A site can follow the user's system preference until the product exposes a manual override.

```css
:root {
  color-scheme: light;
  --surface-page: #fff;
  --text-primary: #1b1a20;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --surface-page: #17171c;
    --text-primary: #f5f4fa;
  }
}
```

This example allows an explicit `data-theme` attribute to take precedence over automatic system preference. Keep the selector and theme-state contract consistent with how the application sets its theme.

### 12. Register typed custom properties with `@property`

**Gotcha:** Setting `inherits: false` can surprise a component that expected descendants to receive the registered value. Choose inheritance behavior based on the intended component contract.

The `@property` at-rule can register a custom property with a syntax, inheritance behavior, and initial value.

```css
@property --progress {
  syntax: "<number>";
  inherits: false;
  initial-value: 0;
}

.progress-indicator {
  --progress: 0.65;
  transform: scaleX(var(--progress));
  transform-origin: left;
}
```

Registration can enable type checking, defined initial values, and interpolation behavior for supported properties. It is useful for certain animation and component cases, but most ordinary design tokens do not need registration.

**Gotcha:** The `initial-value` for a registered property must satisfy the registered syntax and registration requirements. Verify browser support and test behavior before relying on registration as a compatibility-critical feature.

### 13. Animate custom properties carefully

**Gotcha:** A registered property can interpolate correctly and still create an unpleasant interaction. Test the animation at real interaction speed and under reduced-motion preferences.

Unregistered custom properties generally behave as discrete values during animation rather than interpolating like a typed number or color. Registered properties can interpolate according to their declared syntax when supported.

```css
@property --tilt {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.card {
  --tilt: 0deg;
  transform: rotate(var(--tilt));
  transition: --tilt 180ms ease;
}

.card:hover {
  --tilt: 2deg;
}
```

Use this only when the effect improves feedback. Do not animate every token, and account for reduced-motion preferences where the animation is meaningful motion.

### 14. Custom properties are not compile-time constants

Because custom properties are resolved in the browser, they can use values that depend on the cascade and runtime context.

```css
.component {
  --component-space: clamp(1rem, 2vw, 2rem);
  padding: var(--component-space);
}
```

This flexibility is a major difference from preprocessor variables, which are substituted during build time. A Sass variable cannot automatically change because an element receives a different theme attribute at runtime; a CSS custom property can.

### 15. Custom properties do not automatically make every value themeable

**Gotcha:** Search for hard-coded colors in pseudo-elements and SVG styling too; auditing only the main component rule can miss theme leaks.

Only declarations that consume a token respond to its changes. A hard-coded color remains hard-coded even if the rest of the page uses semantic variables.

```css
.card {
  color: var(--text-primary);
  border-color: var(--border-subtle);
  /* This shadow is still fixed unless it also uses a token. */
  box-shadow: 0 0.5rem 1rem rgb(0 0 0 / 0.1);
}
```

Audit all theme-sensitive properties: backgrounds, text, borders, icons, shadows, overlays, focus rings, and states. Some values should intentionally remain constant; the important part is to make the decision explicit.

### 16. Keep token dependencies shallow

**Gotcha:** A refactor that changes a primitive can affect many semantic consumers at once. Treat high-fan-out tokens as shared API and review their impact before changing them.

A few layers of aliases can clarify intent, but long chains make debugging difficult.

```css
:root {
  --purple-600: #5b4bdb;
  --action-primary: var(--purple-600);
  --button-bg: var(--action-primary);
  --primary-cta-background: var(--button-bg);
}
```

This chain may be justified in a layered design system, but it can be needless indirection in a small application. Use the minimum number of layers that gives you meaningful flexibility.

**Gotcha:** Circular custom-property references make the participating properties invalid at computed-value time. Avoid cycles such as `--a: var(--b); --b: var(--a);`; they do not behave like variables that resolve themselves later.

### 17. Use cascade layers to clarify ownership

Cascade layers can separate reset rules, tokens, components, utilities, and overrides.

```css
@layer reset, tokens, base, components, utilities;

@layer tokens {
  :root {
    --surface-page: white;
    --text-primary: #202027;
  }
}

@layer components {
  .card {
    background: var(--surface-page);
    color: var(--text-primary);
  }
}
```

Layers are useful for organizing CSS precedence, but they do not remove the need to understand the cascade. The ordering of layers matters, and important declarations have special layer-order behavior.

### 18. Theme components by changing tokens, not duplicating selectors

Avoid separate component definitions for every theme:

```css
/* Avoid scaling this pattern across a large system */
.theme-dark .card { background: #222; color: white; }
.theme-light .card { background: white; color: #222; }
```

Instead, define the token mapping at the theme boundary and let the component consume it:

```css
.card {
  background: var(--surface-panel);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}
```

This keeps theme-specific knowledge in one place and reduces selector growth.

### 19. Distinguish design tokens from state variables

A design token describes a reusable design decision. A state variable may represent a component's transient state or a runtime measurement.

```css
.dialog {
  --dialog-surface: var(--surface-panel);
  background: var(--dialog-surface);
}
```

It is possible to update a custom property from JavaScript, but avoid using CSS variables as an unstructured replacement for application state. Use them to bridge state into styling when that boundary is useful.

### 20. Updating CSS custom properties from JavaScript

**Gotcha:** When a temporary inline token is no longer needed, remove it with `style.removeProperty()` so inherited theme values can take effect again.

JavaScript can set a custom property on an element or the root:

```js
document.documentElement.style.setProperty("--accent", "#0f766e");
```

A component-specific value can be scoped to the component:

```js
const card = document.querySelector(".card");
if (card) {
  card.style.setProperty("--card-accent", "#0f766e");
}
```

Prefer setting a theme attribute or a well-defined token when changing a whole theme, rather than writing dozens of inline values. Use inline custom properties for genuinely dynamic values, such as a user-controlled hue or a chart's per-item color.

**Gotcha:** Inline styles generally outrank ordinary author stylesheet declarations for the same property. If JavaScript sets a token inline, a theme class may not override it as expected until the inline value is removed or updated.

### 21. Keep runtime values safe and validated

**Gotcha:** CSS syntax validation does not sanitize every downstream use case. Never use a CSS value check as a substitute for validating the meaning and range of user-controlled data.

If a custom property is populated from user input or external data, validate the input and constrain the property to an intended use. Do not assume a CSS variable is safe merely because it is not inserted into HTML markup.

```js
function setAccentColor(element, color) {
  if (!(element instanceof HTMLElement)) return;
  if (typeof color !== "string") return;

  // Use a stricter color parser or allow-list in production.
  if (!CSS.supports("color", color)) return;

  element.style.setProperty("--user-accent", color);
}
```

The `CSS.supports()` check can confirm that a string is accepted as a color value, but it is not a complete product policy. Use an allow-list when the product requires specific brand colors or constrained values.

### 22. `var()` can be used only where the value grammar allows it

Custom properties can represent a value fragment, but the consuming declaration still needs a valid grammar after substitution.

```css
:root {
  --border-width: 1px;
  --border-style: solid;
  --border-color: #dedbe5;
}

.card {
  border: var(--border-width) var(--border-style) var(--border-color);
}
```

A token that contains a value valid for `color` may be invalid for `padding`. Keep token naming and usage clear enough that type mismatches are unlikely.

### 23. Custom properties and shorthand declarations

**Gotcha:** A shorthand may reset other longhands as part of its normal behavior. When tokens are used in shorthands, check for unintended resets as well as invalid substitutions.

Shorthands can make token usage compact, but a malformed token in a shorthand can invalidate the entire declaration.

```css
.card {
  border: var(--card-border, 1px solid #dedbe5);
  padding: var(--card-padding, 1rem 1.25rem);
}
```

When debugging, split a complicated shorthand into longhands temporarily to identify which substituted value is invalid. Avoid building a single token that tries to encode unrelated pieces of a component's appearance.

### 24. `initial`, `inherit`, and `unset` are not interchangeable

**Gotcha:** CSS-wide keywords have special cascade meaning; do not quote them as ordinary text values or treat them as literal token strings.

These CSS-wide keywords have different effects. `inherit` explicitly uses the parent value, `initial` uses the property's initial value, and `unset` behaves as inherit for inherited properties and initial for non-inherited properties. For custom properties, their use can affect whether a value is inherited or falls back to the property's initial behavior.

```css
.region {
  --accent: teal;
}

.region__child {
  --accent: inherit;
}
```

Use these keywords deliberately. A custom property that is set to an unexpected CSS-wide keyword can change how a subtree receives a token.

### 25. Debug custom properties systematically

When a component renders the wrong color or spacing, use this order:

1. Inspect the consuming declaration.
2. Inspect the computed custom property on that same element.
3. Find the winning declaration and its selector or layer.
4. Check whether a closer ancestor overrides the inherited value.
5. Confirm that the token is valid for the consuming property's grammar.
6. Check whether inline styles or `!important` affect the result.
7. Look for cycles and long alias chains.
8. Verify that the intended theme attribute is actually present.

A short console helper can reveal the resolved value:

```js
const element = document.querySelector(".card");
if (element) {
  const styles = getComputedStyle(element);
  console.log("surface:", styles.getPropertyValue("--surface-panel").trim());
  console.log("background:", styles.backgroundColor);
}
```

The computed custom-property value may retain whitespace, so trimming it can make logs easier to read. Developer tools remain the best place to inspect the winning declaration.

### 26. Establish naming and ownership conventions

Choose a consistent naming scheme and document it briefly. A team might use `--color-*` for colors, `--space-*` for spacing, `--radius-*` for radii, and `--component-*` for component-specific hooks.

```css
:root {
  --color-text-primary: #1c1b22;
  --color-surface-page: #fff;
  --space-4: 1rem;
  --radius-2: 0.5rem;
}

.button {
  --button-background: var(--color-action-primary);
}
```

Do not mix `--primaryText`, `--text-primary`, and `--txtMain` without a clear migration reason. Naming consistency reduces the time required to search and understand styles.

### 27. Keep tokens discoverable and testable

**Gotcha:** A token file that is technically centralized but undocumented can still become a bottleneck. Keep names searchable and ownership clear enough that a developer can find the source quickly.

A token inventory should make it clear which values are primitives, which are semantic mappings, which are component hooks, and which themes redefine them. For larger systems, consider documenting tokens in a table or generating reference pages from a single source of truth.

Useful checks include:
- Search for hard-coded theme-sensitive values in component styles.
- Find references to undefined custom properties.
- Look for duplicate semantic tokens that represent the same decision.
- Verify light and dark themes for text, borders, icons, and focus indicators.
- Test component tokens at all supported variants.
- Ensure token names are stable enough to serve as a documented interface.

### 28. Theme changes and accessibility

Color tokens must preserve contrast and interaction cues across themes. A theme is not complete just because the page background and body text change.

```css
.button:focus-visible {
  outline: 3px solid var(--focus-ring, currentColor);
  outline-offset: 3px;
}
```

Check focus rings, disabled states, validation errors, selected states, and hover feedback. Avoid color-only communication, and ensure the token values maintain sufficient contrast in every supported theme.

**Gotcha:** A `currentColor` focus ring inherits the current text color. That can be too subtle or blend into the background in some component states; use an explicit semantic focus token when a consistent contrast target is required.

### 29. Support component variants without selector explosions

Use data attributes, modifier classes, or a clear component API to map variants to token values.

```css
.button {
  background: var(--button-bg, var(--action-primary));
  color: var(--button-fg, white);
}

.button[data-variant="secondary"] {
  --button-bg: var(--surface-panel);
  --button-fg: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.button[data-variant="danger"] {
  --button-bg: var(--action-danger);
  --button-fg: white;
}
```

This keeps the shared component structure stable. Avoid using arbitrary attribute values as a hidden API without documenting supported variants.

### 30. Decide when a variable is not worth it

A custom property adds indirection. For a value used once and unlikely to change, a direct declaration may be clearer.

```css
.icon {
  inline-size: 1.25rem;
  block-size: 1.25rem;
}
```

A token becomes valuable when it names a shared decision, supports a theme or variant, provides a customization contract, or allows a runtime value to affect CSS. The goal is maintainability, not the maximum possible count of `--` names.

---

## Reusable Patterns

### Pattern 1 — Primitive and semantic tokens

```css
:root {
  --indigo-600: #4f46e5;
  --gray-950: #181820;
  --gray-100: #f4f3f8;

  --color-action-primary: var(--indigo-600);
  --color-text-primary: var(--gray-950);
  --color-surface-panel: var(--gray-100);
}
```

Use this when multiple components should share a consistent mapping and a theme may redefine the semantic layer.

### Pattern 2 — Light and dark theme mapping

```css
:root,
[data-theme="light"] {
  color-scheme: light;
  --surface-page: #fff;
  --surface-panel: #f5f4f8;
  --text-primary: #1d1c24;
  --border-subtle: #dfdce6;
}

[data-theme="dark"] {
  color-scheme: dark;
  --surface-page: #15151a;
  --surface-panel: #222129;
  --text-primary: #f5f4fa;
  --border-subtle: #3d3a47;
}

body {
  background: var(--surface-page);
  color: var(--text-primary);
}
```

Components consume semantic values and do not need separate theme-specific selectors.

### Pattern 3 — Follow system theme unless explicitly overridden

```css
:root {
  color-scheme: light;
  --surface-page: #fff;
  --text-primary: #1d1c24;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    color-scheme: dark;
    --surface-page: #15151a;
    --text-primary: #f5f4fa;
  }
}
```

Use a documented contract for the manual override attribute. Verify the application removes or sets it consistently.

### Pattern 4 — Public component customization token

```css
.card {
  --_card-surface: var(--card-surface, var(--surface-panel));
  --_card-padding: var(--card-padding, 1.25rem);

  background: var(--_card-surface);
  padding: var(--_card-padding);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card, 1rem);
}
```

The public variables are intentional extension points. The private aliases keep internal implementation names distinct by convention.

### Pattern 5 — Component variants through token mapping

```css
.badge {
  background: var(--badge-bg, var(--surface-panel));
  color: var(--badge-fg, var(--text-primary));
}

.badge[data-tone="success"] {
  --badge-bg: #dcfce7;
  --badge-fg: #166534;
}

.badge[data-tone="warning"] {
  --badge-bg: #fef3c7;
  --badge-fg: #92400e;
}
```

Use explicit supported variants and audit their contrast in every theme. In a full system, map tone colors to semantic tokens too.

### Pattern 6 — Typed animated property

```css
@property --rotation {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.tile {
  --rotation: 0deg;
  transform: rotate(var(--rotation));
  transition: --rotation 200ms ease;
}

.tile:hover {
  --rotation: 2deg;
}
```

Use only when typed interpolation adds value and browser support is acceptable. Include a reduced-motion strategy for motion that may be distracting.

### Pattern 7 — JavaScript updates one dynamic token

```js
function setProgress(element, fraction) {
  if (!(element instanceof HTMLElement)) return;
  if (!Number.isFinite(fraction)) return;

  const safeFraction = Math.min(1, Math.max(0, fraction));
  element.style.setProperty("--progress", String(safeFraction));
}
```

This is suitable for a runtime measurement or visual progress value. Keep application state as the source of truth and update CSS through a deliberate boundary.

### Pattern 8 — Focus ring token

```css
:root {
  --focus-ring: #4f46e5;
}

[data-theme="dark"] {
  --focus-ring: #b8b1ff;
}

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

Validate the ring against adjacent surfaces in each theme. Avoid selectors that accidentally include elements that should not be keyboard-focusable.

### Pattern 9 — Layered stylesheet ownership

```css
@layer reset, tokens, base, components, utilities;

@layer tokens {
  :root {
    --surface-page: #fff;
    --text-primary: #202027;
  }
}

@layer components {
  .panel {
    background: var(--surface-page);
    color: var(--text-primary);
  }
}
```

Use layers to clarify where tokens and component rules live. Agree on layer order and understand how important declarations interact with it.

### Pattern 10 — Safe custom-property input

```js
function setUserColor(element, candidate) {
  if (!(element instanceof HTMLElement)) return;
  if (typeof candidate !== "string") return;
  if (!CSS.supports("color", candidate)) return;

  element.style.setProperty("--user-color", candidate);
}
```

This is a basic syntax gate, not a full allow-list or security policy. Restrict accepted values further if the product requires it.

### Pattern 11 — Inspect the computed token

```js
function inspectToken(element, name) {
  if (!(element instanceof Element)) return null;

  const styles = getComputedStyle(element);
  return {
    token: styles.getPropertyValue(name).trim(),
    color: styles.color,
    background: styles.backgroundColor
  };
}
```

Use this during debugging to compare the token value and the final rendered property. Inspect the winning declaration in developer tools to identify the source.

### Pattern 12 — Scoped local theme

```css
.preview {
  --surface-page: #fff;
  --surface-panel: #f5f4f8;
  --text-primary: #1c1b22;
}

.preview[data-theme="dark"] {
  --surface-page: #15151a;
  --surface-panel: #222129;
  --text-primary: #f5f4fa;
}

.preview__card {
  background: var(--surface-panel);
  color: var(--text-primary);
}
```

A local theme scope can power previews, embedded widgets, or themeable regions without changing the entire document.

---

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Using custom properties only for colors | Spacing, radii, shadows, typography, and component contracts remain duplicated. | Tokenize repeated decisions where central control has clear value. |
| Turning every declaration into a variable | Adds indirection without improving reuse or flexibility. | Create variables for shared, semantic, themeable, or runtime-driven values. |
| Naming tokens after current appearance | A token such as `--white` becomes misleading when reused in a dark theme. | Use stable semantic names like `--surface-page` and `--text-primary`. |
| Putting every property in `:root` | Global namespace becomes noisy and component ownership is unclear. | Scope implementation details to the smallest useful component or region. |
| Confusing primitive and semantic tokens | Components become tied to palette choices and theme changes require broad edits. | Map primitive values to semantic intent, then let components consume semantic tokens. |
| Creating long alias chains | Debugging requires following many indirections and changes become hard to reason about. | Keep token layers shallow and purposeful. |
| Creating circular references | Participating custom properties become invalid at computed-value time. | Audit dependencies and avoid cycles. |
| Assuming variables bypass the cascade | Specificity, source order, layers, and inheritance still determine the winning value. | Inspect the computed custom property and its winning declaration. |
| Defining a token on a sibling and expecting it to apply | Sibling elements do not inherit custom properties from one another. | Define it on a shared ancestor or the target element. |
| Assuming a fallback catches every invalid value | A present but type-incompatible value can invalidate the consuming declaration without using the fallback. | Validate token contracts and use fallbacks mainly for missing optional values. |
| Using fallback values instead of defining required tokens | Required system values silently drift and errors are harder to find. | Define required tokens centrally; use fallbacks for intentional optional hooks. |
| Exposing every internal component value | Consumers depend on details that should be free to change. | Publish only supported customization points. |
| Treating underscore-prefixed variables as truly private | CSS does not enforce privacy by naming convention. | Document the convention and avoid exposing private names as public API. |
| Duplicating every component for each theme | Selector count and maintenance cost grow with themes. | Change semantic token mappings at the theme boundary. |
| Forgetting theme-sensitive shadows or focus rings | The page background changes but some elements become invisible or inconsistent. | Audit surfaces, borders, shadows, icons, states, and focus indicators. |
| Ignoring `color-scheme` | Native controls and browser-rendered UI may not match the selected theme. | Set `color-scheme` intentionally and test native form controls. |
| Assuming system preference should always win | A user's explicit theme selection may be overridden by the OS preference. | Define a precedence contract between manual and automatic theme modes. |
| Registering every custom property with `@property` | Adds complexity and can constrain inheritance or syntax unnecessarily. | Register only properties that benefit from typing, initial values, or interpolation. |
| Expecting unregistered custom properties to interpolate smoothly | They generally animate discretely rather than by the intended numeric or color interpolation. | Register an appropriate syntax when supported, or animate the consuming property. |
| Setting custom properties from unvalidated input | Unexpected values may break styling or violate product constraints. | Validate syntax and enforce an allow-list or range where appropriate. |
| Assuming `CSS.supports()` is a complete policy check | It verifies CSS support, not whether a value is permitted by the product. | Combine syntax validation with product-level validation. |
| Using a color token as padding | The substituted value does not satisfy the consuming property's grammar. | Name and use tokens according to their value type and intended contract. |
| Packing too many unrelated values into one shorthand token | A single invalid fragment can invalidate the whole shorthand and obscure intent. | Use separate tokens for independent decisions and debug with longhands. |
| Setting variables inline and expecting theme CSS to override them | Inline declarations can outrank normal stylesheet declarations. | Remove or update inline values, or set theme state through the intended root or scope attribute. |
| Forgetting focus contrast in dark mode | A focus indicator may blend into the surface even when it looked clear in light mode. | Audit `:focus-visible` in every theme and state. |
| Using `!important` to patch token precedence | Creates brittle cascade behavior and hides ownership problems. | Fix scope, layer order, selector design, or token mapping. |
| Mixing naming conventions | Search and maintenance become slower and similar concepts fragment. | Adopt a small consistent prefix and casing convention. |
| Hard-coding theme values in one component | The component stops responding to semantic token updates. | Replace theme-sensitive literals with the appropriate semantic token. |
| Using a custom property as a substitute for all application state | Styling becomes coupled to unstructured state and synchronization becomes fragile. | Keep application state in the application layer and bridge only needed values into CSS. |
| Never testing tokens across variants | A token may work for the default component but fail in danger, disabled, or selected states. | Test every supported variant and state in each theme. |

---

## Mental Models

1. **A custom property is a runtime contract.** It can participate in the cascade and change without rebuilding the stylesheet.
2. **Primitives describe values; semantics describe intent.** The semantic layer is what keeps components stable when palettes change.
3. **Scope is ownership.** A global token belongs globally; a component implementation detail usually belongs locally.
4. **Inheritance flows through ancestors, not across siblings.** Place tokens where all intended consumers can inherit them.
5. **Fallbacks are safety nets, not validation.** They do not make a present but incompatible value valid.
6. **The cascade still rules.** Custom properties do not bypass specificity, source order, layers, or inline styles.
7. **A component token is an API.** Expose only values consumers should reasonably customize.
8. **Themes should change mappings, not component logic.** Components should consume semantic tokens without asking which theme is active.
9. **Indirection has a cost.** Add a token layer only when it improves clarity, reuse, theming, or runtime control.
10. **CSS validity and product validity differ.** A syntactically valid color may still violate brand or contrast requirements.
11. **A token system is a graph.** Long chains and cycles make that graph harder to understand and debug.
12. **Test the rendered state, not just the token file.** A valid token can still produce poor contrast, broken layout, or a hidden focus ring.

---

## Quick Reference

| Need | Pattern | Important detail |
|---|---|---|
| Global semantic value | `:root { --text-primary: #222; }` | Use names based on purpose. |
| Local override | `.panel { --accent: teal; }` | Descendants inherit; siblings do not. |
| Fallback | `var(--card-gap, 1rem)` | Does not validate an incompatible present value. |
| Light/dark theme | `[data-theme="dark"] { --surface-page: #15151a; }` | Components should consume semantic tokens. |
| Component customization | `padding: var(--card-padding, 1rem)` | Document the public contract. |
| Typed interpolation | `@property --progress { syntax: "<number>"; ... }` | Check syntax, initial value, and browser support. |
| JS dynamic value | `el.style.setProperty("--progress", value)` | Validate and constrain the value. |
| Computed token debug | `getComputedStyle(el).getPropertyValue("--token")` | Inspect the winning declaration as well. |
| Focus ring token | `outline: 3px solid var(--focus-ring)` | Verify contrast in every theme. |
| CSS ownership | `@layer tokens, components, utilities` | Layer order affects cascade precedence. |

### Token architecture checklist

- [ ] Are primitive, semantic, and component token roles distinguishable?
- [ ] Do semantic names express purpose rather than current appearance?
- [ ] Are global tokens limited to decisions that need global scope?
- [ ] Do descendants inherit values from the intended ancestor?
- [ ] Are token dependency chains shallow and acyclic?
- [ ] Are fallbacks reserved for intentional optional values?
- [ ] Are public component variables documented?
- [ ] Do themes override semantic mappings instead of duplicating components?
- [ ] Does manual theme choice have clear precedence over system preference?
- [ ] Are backgrounds, text, borders, icons, shadows, and states covered?
- [ ] Are focus indicators visible and unclipped?
- [ ] Are runtime values validated and constrained?
- [ ] Have all component variants been checked in every supported theme?
- [ ] Can a maintainer find the token source quickly in developer tools?

---

## Build Challenge

### Challenge: Build a themeable component library using CSS custom properties

Create a small page containing a header, navigation, card grid, buttons, badges, form fields, and a modal or preview panel. Implement a token architecture that supports light and dark themes, local theme previews, and component variants without duplicating entire component stylesheets.

#### Requirements

1. Define at least eight primitive tokens across colors, spacing, radii, and shadows.
2. Define at least ten semantic tokens named by purpose.
3. Create component-level customization hooks for at least three components.
4. Document which custom properties are public extension points and which are private implementation aliases.
5. Use semantic tokens in component rules instead of hard-coding theme-sensitive values.
6. Implement light and dark theme mappings using a stable attribute contract.
7. Support automatic system preference when no manual theme choice is active.
8. Ensure an explicit manual theme choice overrides the automatic preference.
9. Set `color-scheme` appropriately for native controls in each theme.
10. Create a local theme scope that changes a preview panel without changing the whole page.
11. Build at least three component variants by mapping token values.
12. Use a fallback for at least one intentionally optional component customization hook.
13. Demonstrate that a fallback does not replace validation for an incompatible present value.
14. Keep token dependency chains shallow and free of circular references.
15. Organize tokens and components using a documented naming convention.
16. Use cascade layers or explain a deliberate alternative for CSS ownership.
17. Implement a visible `:focus-visible` ring using a semantic token.
18. Verify focus contrast against both light and dark surfaces.
19. Include at least one dynamic numeric CSS variable updated from JavaScript.
20. Validate the runtime value before applying it to the element.
21. Use `CSS.supports()` only as syntax validation, not as the entire product policy.
22. Include a debug helper that reports a token's computed value.
23. Demonstrate how to trace a token to its winning declaration in developer tools.
24. Audit hard-coded theme-sensitive colors in component styles.
25. Test text, surfaces, borders, shadows, icons, disabled states, and error states.
26. Test all component variants in both themes.
27. Avoid using `!important` to solve token ownership problems.
28. Explain one value that deliberately remains a direct declaration instead of a token.
29. Include a short token reference table with name, role, scope, and intended consumers.
30. Provide a README describing theme precedence, public component contracts, and debugging steps.

#### Deliverables

- A working themeable component page.
- A centralized token stylesheet with clear layers.
- Light and dark theme mappings plus a local preview theme.
- A small JavaScript module for theme selection or dynamic values.
- A token reference table and a test matrix covering themes, variants, focus, and runtime updates.

#### Evaluation rubric

- **Architecture and naming (25%)** — token layers and scopes are clear, consistent, and maintainable.
- **Theme behavior (20%)** — manual and automatic theme modes behave predictably.
- **Component contracts (15%)** — public customization points are deliberate and documented.
- **Cascade and debugging (15%)** — the implementation can be inspected and diagnosed without override hacks.
- **Accessibility (15%)** — contrast, focus indicators, and native control appearance are checked in both themes.
- **Runtime safety and quality (10%)** — dynamic values are validated and behavior is documented.

A successful solution should make theme and component changes through a small number of intentional token mappings. It should not merely replace every literal with a variable; it should make the design system easier to understand, test, and evolve.
