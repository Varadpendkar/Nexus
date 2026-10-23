# Shadow System — Production Skill

> **Path:** `layer-02-typography-design/shadow-system/shadow-system.md`  
> **Layer:** 02 — Typography & Design System  
> **Purpose:** Build a coherent elevation language with layered box shadows, surface relationships, colored shadows, restrained glow effects, reusable tokens, and accessible interaction feedback.  
> **Use this skill:** When defining component elevation and depth. Create the shadow scale and surface rules centrally before applying shadows to cards, menus, dialogs, buttons, or decorative effects.

---

## Why This Matters

A shadow system is not a collection of attractive `box-shadow` declarations. It is a visual language for communicating relationships between surfaces: what sits on the page, what is raised above it, what temporarily overlays other content, and which elements are interactive. When every component invents its own blur, spread, and opacity, the interface becomes visually noisy. When shadows are too faint, clipped, or used as the only boundary cue, users may not understand the component hierarchy at all.

A reliable system combines **surface contrast**, **border treatment**, **elevation tokens**, and **context-specific shadow recipes**. It defines a small set of predictable levels, then allows carefully documented exceptions for special effects such as colored shadows and glows. It also explains where a shadow should not be used: flat surfaces, high-contrast modes, reduced visual effects, or components whose hierarchy is already clear from layout and borders.

The aim is not to make every card float. Depth should support the content hierarchy and interaction model. A menu that overlays the page may need a stronger shadow than a card that simply groups related information. A button may use a subtle pressed state rather than a large drop shadow. A dark interface may rely more on surface-color steps and borders because a black shadow on a near-black background is barely visible.

This skill establishes a reusable elevation vocabulary, shows how to inspect and debug rendered shadows, and gives a practical process for validating shadows across themes, browsers, and accessibility settings.

---

## Scope and Non-Goals

This skill covers:

- Shadow tokens and an elevation scale.
- Layered `box-shadow` construction.
- Surface hierarchy and shadow restraint.
- Colored shadows and glow effects.
- Inset shadows for controls and pressed surfaces.
- Hover, active, focus, and selected states.
- Light and dark theme adjustments.
- Clipping, stacking contexts, and overflow debugging.
- Performance considerations for animated shadows.
- Accessibility, forced colors, and reduced-motion preferences.
- Component patterns for cards, menus, dialogs, buttons, and focus rings.

This skill does not claim that a shadow proves a component is elevated in the document stacking order. CSS painting, stacking contexts, transforms, and `z-index` are separate concerns. Nor does a visually attractive shadow guarantee accessibility. Important boundaries and states must remain understandable when shadows are absent.

---

## Deliverable

A finished shadow system should provide:

1. A documented elevation scale with a small number of levels.
2. Central CSS custom properties for shadow recipes.
3. Clear rules for when to use a shadow, border, surface step, or combination.
4. Separate treatment for interactive feedback and static elevation.
5. Light and dark theme behavior.
6. A policy for colored shadows and decorative glows.
7. A plan for forced-colors and high-contrast modes.
8. A performance strategy for animated or frequently updated components.
9. A repeatable DevTools debugging procedure.
10. A review checklist that confirms the interface still works when shadows are removed.

---

## 1. Think in Elevation Roles Before Writing Shadow Values

Start by identifying the surface relationships in the product. A card inside a page, a sticky toolbar, a dropdown menu, and a modal dialog do not need the same shadow. A useful scale describes roles rather than a random sequence of increasing blur values.

Common roles include:

- **Level 0 — Flat:** No shadow; hierarchy comes from layout, surface color, or border.
- **Level 1 — Subtle separation:** A barely raised card or grouped surface.
- **Level 2 — Interactive lift:** A component that lifts slightly on hover or focus.
- **Level 3 — Floating surface:** A dropdown, tooltip, or popover above nearby content.
- **Level 4 — Overlay:** A dialog or major overlay that must separate from the page.
- **Special — Focus or glow:** A semantic interaction cue, not a generic elevation level.
- **Inset — Pressed or recessed:** An internal edge that suggests a well, field, or pressed surface.

Do not assign a level based only on the size of the blur. Consider the component's visual role, surrounding surface, border contrast, and how often it appears. If most cards use Level 1, using Level 3 on one card should communicate a meaningful difference.

```css
:root {
  --shadow-none: none;
  --shadow-1: 0 1px 2px rgb(15 23 42 / 8%);
  --shadow-2: 0 3px 8px rgb(15 23 42 / 10%);
  --shadow-3: 0 8px 20px rgb(15 23 42 / 12%);
  --shadow-4: 0 16px 40px rgb(15 23 42 / 16%);
  --shadow-inset: inset 0 1px 2px rgb(15 23 42 / 10%);
}
```

These are starting values, not universal standards. Tune them to the interface's density, surface colors, and visual direction. The role names should remain stable even if the actual values change.

---

## 2. Understand the `box-shadow` Components

The basic syntax is:

```css
box-shadow: offset-x offset-y blur-radius spread-radius color;
```

The first two lengths position the shadow. The blur radius softens it, the spread radius expands or contracts its shape, and the color controls its tone and transparency. The `inset` keyword places the shadow inside the element rather than outside it. Multiple shadows are comma-separated and paint in a defined order.

```css
.card {
  box-shadow:
    0 1px 2px rgb(15 23 42 / 8%),
    0 6px 18px rgb(15 23 42 / 5%);
}
```

The first layer creates a compact contact edge; the second creates a softer, broader shadow. Layering can produce more natural results than a single very large blur, but additional layers should have a purpose. More layers do not automatically create better depth.

### Practical interpretation

- **Offset X:** Horizontal displacement. Often zero for a neutral elevation system.
- **Offset Y:** Vertical displacement. Usually grows as an object appears higher above the surface.
- **Blur radius:** Softness. Large blur spreads the shadow over a wider area.
- **Spread radius:** Changes the shadow's footprint before blur. Negative spread can tighten a shadow around a component.
- **Color and alpha:** Control darkness or hue. Excess opacity often makes the result look dirty.
- **Inset:** Creates an inner edge and should be used sparingly.

A shadow does not change the element's layout dimensions. It may visually extend beyond its box, and ancestor overflow can clip it. Do not add padding or margins to compensate until you understand whether the problem is clipping or the intended visual spacing.

---

## 3. Build a Small, Layered Shadow Scale

Use a small scale that maps to stable component roles. Each level should have a visible and documented purpose. A token system is easier to maintain than a collection of values that differ by one pixel without a clear reason.

```css
:root {
  --shadow-color: 220 35% 12%;

  --shadow-1:
    0 1px 2px hsl(var(--shadow-color) / 0.08),
    0 1px 1px hsl(var(--shadow-color) / 0.04);

  --shadow-2:
    0 2px 4px hsl(var(--shadow-color) / 0.08),
    0 4px 10px hsl(var(--shadow-color) / 0.06);

  --shadow-3:
    0 5px 12px hsl(var(--shadow-color) / 0.10),
    0 12px 26px hsl(var(--shadow-color) / 0.08);

  --shadow-4:
    0 10px 24px hsl(var(--shadow-color) / 0.12),
    0 24px 48px hsl(var(--shadow-color) / 0.10);
}
```

The `shadow-color` custom property is an HSL triplet intended for use by `hsl()`. Keep the token format consistent; do not switch between full color values and channel triplets without documenting the difference.

### Scale review

1. Compare all levels on the same surface.
2. Compare each level on both canvas and raised surfaces.
3. Confirm that adjacent levels are meaningfully different.
4. Check the shadow at common device pixel ratios.
5. Verify that the shadow does not make the component appear disabled or muddy.
6. Check whether a border can communicate the boundary more reliably.
7. Remove levels that no component needs.

A four-level scale is often enough. A product with complex overlays may need a separate overlay token, but it rarely needs a dozen arbitrary shadow levels.

---

## 4. Treat Borders and Surface Colors as Part of Elevation

Shadow is only one depth cue. Surface color, border contrast, spacing, and overlap all influence the way a component reads. In many interfaces, a subtle border is more reliable than a shadow for defining a card boundary.

```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-1);
}
```

Do not use both a heavy border and a heavy shadow by default. They may compete and make the component look outlined and detached at the same time. A thin border plus a soft shadow often works well for light themes; a dark theme may need a visible surface step and border with a restrained shadow.

### Choose the right cue

- Use **spacing** when groups need separation without visual framing.
- Use **surface contrast** when a region should feel distinct but not floating.
- Use **border** when the boundary must remain clear in flat or high-contrast rendering.
- Use **shadow** when the component needs a sense of depth or overlap.
- Use **z-index and stacking rules** when the actual paint order must change.
- Use **focus outline** for keyboard focus; do not substitute a drop shadow for a reliable focus indicator.

---

## 5. Map Elevation to Component Roles

Do not attach elevation tokens arbitrarily. Give each component a documented default and state behavior.

```css
.card {
  box-shadow: var(--shadow-1);
}

.card--interactive:hover {
  box-shadow: var(--shadow-2);
}

.popover {
  box-shadow: var(--shadow-3);
}

.dialog {
  box-shadow: var(--shadow-4);
}
```

The example maps roles to tokens. It does not create the correct document stacking order by itself. A popover may still require positioning, a suitable stacking context, and an appropriate `z-index`; a dialog may be implemented with the native `<dialog>` element or a well-tested dialog component.

### Role mapping questions

- Does the component sit in the page flow or overlay content?
- Is its elevation static or a feedback state?
- Should the component still read clearly if the shadow disappears?
- Does the shadow collide with nearby elements?
- Is the component nested inside an overflow-clipped container?
- Does it create a new stacking context because of transforms, opacity, filters, or other properties?
- Is the component a modal overlay that also needs a backdrop and focus management?

Keep static elevation separate from hover lift. This allows the interaction state to change without unexpectedly changing the component's baseline hierarchy.

---

## 6. Use Layered Shadows With Intent

Layering can produce a compact contact shadow and a broad ambient shadow. The small layer anchors the object; the larger, lighter layer provides a sense of distance. This is useful for cards, popovers, and dialogs, but not every element needs multiple layers.

```css
.surface-floating {
  box-shadow:
    0 2px 4px rgb(15 23 42 / 8%),
    0 8px 18px rgb(15 23 42 / 8%),
    0 24px 40px rgb(15 23 42 / 5%);
}
```

Each layer should contribute something distinguishable. If removing one layer makes no perceptible difference, simplify the recipe. Large shadow stacks can be expensive to repaint when animated, so keep complex stacks static whenever possible.

### Layering process

1. Start with one compact shadow.
2. Add a broad ambient layer at lower opacity.
3. Check the edge at 100% zoom and at the actual UI size.
4. Reduce opacity before increasing blur.
5. Compare the result on every theme surface.
6. Check overlap with adjacent components.
7. Keep the recipe in a token instead of duplicating it.

---

## 7. Build Dark-Theme Elevation Differently

On dark backgrounds, a conventional black shadow can nearly disappear. Dark themes often communicate elevation through surface color changes, borders, and carefully tuned shadows rather than shadow alone.

```css
:root,
[data-theme="light"] {
  --shadow-color: 220 35% 12%;
  --shadow-card: 0 4px 16px hsl(var(--shadow-color) / 0.10);
  --surface-raised: #ffffff;
  --surface-border: #d8dee8;
}

[data-theme="dark"] {
  --shadow-color: 225 60% 2%;
  --shadow-card: 0 8px 24px hsl(var(--shadow-color) / 0.42);
  --surface-raised: #1a2538;
  --surface-border: #334155;
}
```

These values are illustrative. The dark theme's `--surface-raised` and `--surface-border` may communicate more elevation than the shadow itself. Avoid adding bright borders to every card merely to make depth visible; use the smallest combination that gives the interface a clear hierarchy.

### Dark-theme checks

- Compare canvas, surface, and raised surface side by side.
- Check shadows over the actual canvas rather than a checkerboard.
- Ensure text contrast remains strong on raised surfaces.
- Verify that the shadow does not become a large black halo.
- Test focused and hovered states separately.
- Check OLED-like near-black backgrounds and low-brightness displays where relevant.

---

## 8. Colored Shadows: Tie Hue to the Object

A colored shadow can reinforce a brand accent or make a selected object feel luminous. It can also quickly look muddy, neon, or decorative without meaning. Use colored shadows sparingly and tie them to a specific component role.

```css
.button-brand {
  background: #4f46e5;
  color: #fff;
  box-shadow:
    0 4px 10px rgb(79 70 229 / 20%),
    0 10px 24px rgb(79 70 229 / 14%);
}
```

The shadow color should relate to the component's own color, but it need not be an exact copy. Lower alpha and a wider second layer often produce a restrained result. Test the effect against adjacent surfaces and avoid relying on colored shadows to indicate selected, valid, or focused state.

### Colored-shadow rules

- Reserve colored shadows for a few high-priority components.
- Keep the default elevation scale neutral.
- Do not use red or green glow as the only error/success signal.
- Avoid intense glow around every card or icon.
- Test both light and dark themes.
- Preserve a clear border or focus indicator if the glow is removed.
- Ensure the shadow does not obscure neighboring text or controls.

---

## 9. Glow Effects Are Not Focus Indicators

Glow can be a decorative effect, a brand treatment, or an interaction accent. A keyboard focus indicator has a more important job: it must identify the focused control clearly and consistently. A blurred colored halo may fail to identify the exact boundary, especially on a similar-colored background.

```css
.button {
  box-shadow: var(--shadow-1);
}

.button:focus-visible {
  outline: 3px solid var(--color-focus-ring, #005fcc);
  outline-offset: 3px;
  box-shadow: var(--shadow-1);
}
```

The focus outline is separate from the decorative shadow. Do not remove the outline because a button already has a glow on hover. Hover is not available to every input method, and focus needs to remain clear for keyboard users.

For a branded focus treatment, use a clear outline plus a restrained outer halo if testing shows that the result remains distinct. Inspect the effect against nearby colors and verify that the outline is not clipped by ancestor overflow.

---

## 10. Hover, Active, and Pressed States

Interaction shadows should communicate a modest state change, not make the element jump unpredictably. A hover lift may increase shadow and translate the component slightly, but motion and shadow should be consistent with the product's interaction language.

```css
.card-interactive {
  box-shadow: var(--shadow-1);
  transform: translateY(0);
  transition:
    box-shadow 180ms ease,
    transform 180ms ease;
}

.card-interactive:hover {
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
}

.card-interactive:active {
  box-shadow: var(--shadow-1);
  transform: translateY(0);
}

.card-interactive:focus-visible {
  outline: 3px solid var(--color-focus-ring, #005fcc);
  outline-offset: 3px;
}
```

Do not apply hover lift to every element by default. It can make a dense interface feel unstable and can create accidental motion on touch devices. Use a clear interactive affordance, and avoid making a non-interactive card appear clickable.

```css
@media (prefers-reduced-motion: reduce) {
  .card-interactive {
    transition: none;
  }

  .card-interactive:hover,
  .card-interactive:active {
    transform: none;
  }
}
```

Reduced-motion support is relevant because elevation effects often pair shadow changes with movement. Keep the state understandable even when motion is removed.

---

## 11. Inset Shadows and Recessed Surfaces

Inset shadows can suggest a field, well, pressed button, or recessed area. They should not make a control look disabled or imply a state that does not exist.

```css
.input {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #cbd5e1);
  box-shadow: inset 0 1px 2px rgb(15 23 42 / 8%);
}

.button:active {
  box-shadow: inset 0 2px 4px rgb(15 23 42 / 14%);
}
```

The border still defines the control boundary. Do not depend on the inset shadow to make the field visible, because high-contrast settings may remove or replace shadows. Keep form labels and error messages independent of decorative depth.

Use inset shadows sparingly in dark themes; a dark inset edge on a dark field may disappear. A subtle surface-color difference or border can communicate the boundary more reliably.

---

## 12. Shadow Tokens and Design-System Contracts

Treat shadows as design tokens with stable names. A token should represent a reusable role, not a one-off aesthetic preference.

```css
:root {
  --elevation-flat: none;
  --elevation-card: 0 2px 8px rgb(15 23 42 / 7%);
  --elevation-card-hover:
    0 3px 8px rgb(15 23 42 / 8%),
    0 10px 20px rgb(15 23 42 / 7%);
  --elevation-popover:
    0 8px 20px rgb(15 23 42 / 12%),
    0 18px 36px rgb(15 23 42 / 8%);
  --elevation-dialog:
    0 18px 48px rgb(15 23 42 / 18%);
  --elevation-inset: inset 0 1px 2px rgb(15 23 42 / 10%);
}
```

Document which components use each token. If a component repeatedly needs a special shadow, ask whether it has a stable semantic role or whether the component's boundary should instead use a border or surface color.

Avoid naming tokens by a transient visual impression such as `--shadow-pretty` or `--shadow-fancy`. A role name such as `--elevation-popover` tells future contributors why the token exists.

---

## 13. Accessibility and Non-Shadow Fallbacks

Shadows are not a reliable sole source of meaning. They may be hard to perceive, be overridden, or disappear in forced-colors mode. Important boundaries should use borders or surface contrast; keyboard focus should use a visible focus indicator; selection and errors should use text or other cues.

```css
.panel {
  border: 1px solid var(--color-border, #cbd5e1);
  box-shadow: var(--elevation-card, none);
}

.panel:focus-within {
  border-color: var(--color-focus-ring, #005fcc);
}

.panel :where(a, button, input, select, textarea):focus-visible {
  outline: 3px solid var(--color-focus-ring, #005fcc);
  outline-offset: 3px;
}

@media (forced-colors: active) {
  .panel {
    border: 1px solid CanvasText;
    box-shadow: none;
  }

  .panel :where(a, button, input, select, textarea):focus-visible {
    outline: 2px solid Highlight;
  }
}
```

`focus-within` can help indicate that a region contains focus, but it does not replace a clear indicator on the focused control itself. Use `aria-label`, `aria-describedby`, and other ARIA attributes to convey semantics when necessary, not to compensate for a visual style problem. Native HTML semantics should remain the foundation.

### Accessibility review

- Can a user identify the component boundary if the shadow is removed?
- Is keyboard focus visible without relying on hover?
- Does the focus ring contrast against the component and nearby surfaces?
- Are controls still identifiable in forced-colors mode?
- Are selected, error, and success states communicated beyond hue or glow?
- Does reduced-motion mode preserve the meaning of the interaction?
- Are semantic HTML elements used for their intended behavior?
- Are accessible names and descriptions provided for controls that need them?

---

## 14. Shadows, Overflow, and Stacking Contexts

A shadow can be clipped by an ancestor with `overflow: hidden`, `overflow: clip`, or another clipping behavior. It can also appear behind another component because of stacking contexts and paint order. These are separate problems and should be debugged separately.

```css
.card-grid {
  /* Avoid clipping card shadows unless clipping is intentional. */
  overflow: visible;
}

.card-media {
  overflow: hidden;
  border-radius: 1rem;
}

.card-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

A common layout needs rounded image corners while allowing the card's shadow to remain visible. Put clipping on the media wrapper rather than the outer card when the structure allows it.

### Debugging sequence

1. Select the element whose shadow is clipped or hidden.
2. Inspect `box-shadow` in DevTools and confirm the declaration is active.
3. Walk up the ancestor tree and inspect `overflow`, `clip-path`, `contain`, and border radius.
4. Toggle likely clipping declarations individually.
5. Inspect transforms, opacity, filters, isolation, and positioned elements that may create stacking contexts.
6. Check the relevant `z-index` values within their own stacking contexts.
7. Verify that the issue is not simply a shadow color too close to the background.
8. Fix the owning layout or stacking rule rather than adding a larger shadow as a workaround.

Do not raise `z-index` blindly. A child cannot escape the stacking context of its ancestor merely by using a very large integer.

---

## 15. Performance: Animate the Smallest Useful Change

Changing `box-shadow` can trigger paint work. On a small component this may be acceptable, but animating a large blurred shadow across many cards can become expensive. Avoid continuously animating large shadow stacks or applying heavy filters to full-screen layers without profiling.

```css
.tile {
  box-shadow: var(--elevation-card);
  transition: box-shadow 160ms ease;
}

.tile:hover {
  box-shadow: var(--elevation-card-hover);
}
```

This small transition is often adequate for a limited number of elements. If performance is poor, first inspect the actual page with browser performance tools. Do not assume `will-change: box-shadow` is a universal fix; it can increase resource usage and may not move the work off the paint path.

For a pronounced lift, consider a modest transform with a stable shadow, or a pseudo-element that changes opacity if profiling shows that it helps in the target browser. Test the exact approach on representative hardware and page density.

```css
.tile {
  position: relative;
  isolation: isolate;
  box-shadow: var(--elevation-card);
}

.tile::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--elevation-card-hover);
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms ease;
  z-index: -1;
}

.tile:hover::after {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .tile::after {
    transition: none;
  }
}
```

This pattern is not automatically faster in every browser. It can also introduce stacking or clipping issues. Use it only after measuring and checking the rendered result.

---

## 16. Use `getComputedStyle()` to Inspect Shadow Values

When a shadow does not look as expected, inspect the resolved value instead of guessing which stylesheet is responsible.

```js
function inspectShadow(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return null;
  }

  const style = getComputedStyle(element);
  const result = {
    selector,
    boxShadow: style.boxShadow,
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    outline: style.outline,
    overflow: style.overflow,
    position: style.position,
    zIndex: style.zIndex,
    transform: style.transform
  };

  console.table(result);
  return result;
}

inspectShadow(".card");
```

The computed value shows the resolved shadow declaration, but it cannot by itself tell you whether an ancestor clips the shadow or whether another stacking context paints above it. Use the result as the beginning of the investigation.

### DevTools checklist

- Check the active `box-shadow` rule and crossed-out declarations.
- Check inherited custom properties and theme selectors.
- Inspect `overflow` on ancestors.
- Inspect `z-index` and stacking-context creators.
- Compare the shadow against the actual background color.
- Toggle the shadow off to determine whether the boundary is still clear.
- Record the final decision in the token or component documentation.

---

## 17. Before → After: Replace Ad Hoc Shadows

### Before

```css
.card { box-shadow: 0 10px 30px #0003; }
.menu { box-shadow: 0 4px 18px #0004; }
.dialog { box-shadow: 0 18px 44px #0005; }
.button:hover { box-shadow: 0 8px 25px #4f46e5aa; }
```

Problems: unrelated values are hard-coded in components, the menu and dialog hierarchy is undocumented, and the button's colored shadow is excessively opaque.

### After

```css
:root {
  --elevation-card: 0 2px 8px rgb(15 23 42 / 8%);
  --elevation-popover:
    0 4px 12px rgb(15 23 42 / 10%),
    0 14px 28px rgb(15 23 42 / 8%);
  --elevation-dialog: 0 18px 44px rgb(15 23 42 / 16%);
  --shadow-brand: 0 6px 18px rgb(79 70 229 / 18%);
}

.card { box-shadow: var(--elevation-card); }
.menu { box-shadow: var(--elevation-popover); }
.dialog { box-shadow: var(--elevation-dialog); }
.button-brand { box-shadow: var(--shadow-brand); }

.button-brand:focus-visible {
  outline: 3px solid var(--color-focus-ring, #005fcc);
  outline-offset: 3px;
}
```

The after version defines roles and keeps the brand effect restrained. Confirm that the shadow tokens remain visually distinct and that the focus ring is visible independently of the glow.

---

## 18. Pattern Library

### Pattern 1 — Flat Surface With Border

**What it does:** Defines a panel boundary without depending on elevation.

**When to use it:** Dense interfaces, tables, settings panels, or high-contrast contexts.

```css
.panel-flat {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: none;
}
```

**Trade-off:** Less depth, but a clear boundary that survives shadow removal.

### Pattern 2 — Subtle Card Elevation

**What it does:** Adds a restrained contact shadow to a card.

**When to use it:** Content cards that sit above a page canvas but do not overlay other content.

```css
.card {
  border: 1px solid var(--color-border);
  box-shadow: var(--elevation-card);
}
```

**Trade-off:** Can be visually lost on similar surfaces; use a border or surface step as needed.

### Pattern 3 — Interactive Lift

**What it does:** Gives a clickable card a small hover elevation change.

**When to use it:** Clearly interactive cards, tiles, or selectable options.

```css
.card-link {
  box-shadow: var(--elevation-card);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.card-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--elevation-card-hover);
}

.card-link:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}
```

**Trade-off:** Avoid on non-interactive surfaces and remove movement when reduced motion is requested.

### Pattern 4 — Floating Popover

**What it does:** Gives an overlay enough depth to separate from surrounding content.

**When to use it:** Menus, popovers, autocomplete panels, and non-modal floating UI.

```css
.popover {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--elevation-popover);
}
```

**Trade-off:** Shadow does not manage focus, positioning, dismissal, or stacking order.

### Pattern 5 — Dialog Elevation

**What it does:** Creates a distinct surface for a dialog or major overlay.

**When to use it:** Modal or prominent dialog surfaces.

```css
dialog {
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--elevation-dialog);
}

dialog::backdrop {
  background: rgb(8 12 20 / 55%);
}
```

**Trade-off:** The backdrop and dialog need their own contrast checks; the shadow does not replace dialog semantics or focus management.

### Pattern 6 — Restrained Brand Shadow

**What it does:** Connects a high-priority action to the brand color without overwhelming the UI.

**When to use it:** One or two key actions, not every component.

```css
.button-brand {
  box-shadow: 0 6px 18px rgb(79 70 229 / 18%);
}
```

**Trade-off:** A brand glow may be hard to see on some surfaces and must not substitute for focus.

### Pattern 7 — Inset Field

**What it does:** Adds a subtle recessed edge to an input.

**When to use it:** Only when it fits the overall form visual language.

```css
input,
textarea,
select {
  border: 1px solid var(--color-border);
  box-shadow: inset 0 1px 2px rgb(15 23 42 / 8%);
}
```

**Trade-off:** Keep the border visible and test forced-colors mode.

### Pattern 8 — Forced-Colors Fallback

**What it does:** Removes decorative shadow dependence and restores a clear system-colored boundary.

**When to use it:** Components whose visual hierarchy includes custom shadows.

```css
@media (forced-colors: active) {
  .elevated-surface {
    box-shadow: none;
    border: 1px solid CanvasText;
  }

  .elevated-surface :focus-visible {
    outline: 2px solid Highlight;
  }
}
```

**Trade-off:** The interface may look flatter, but its boundaries and focus states remain understandable.

---

## 19. Common Mistakes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Giving every card a unique shadow | Each component is styled independently without shared elevation roles. | Replace repeated values with a small documented scale and map each card type to one token. |
| Using one enormous blur | Blur is used to create all perceived depth. | Build a compact contact layer and a lower-opacity ambient layer, then compare the result at real component size. |
| Using too much opacity | The designer increases darkness because the shadow is hard to see on one surface. | Test against the actual background and reduce alpha before increasing blur or spread. |
| Treating shadow as a border | The component boundary is expected to remain clear from blur alone. | Add a semantic border token or surface contrast when the boundary matters. |
| Using shadow to indicate keyboard focus | The hover/glow treatment is reused for all interaction states. | Add a distinct `:focus-visible` outline with sufficient offset and contrast. |
| Making every card lift on hover | Animation is applied as a default decoration. | Restrict lift to clearly interactive elements and keep static cards visually stable. |
| Ignoring dark-theme surfaces | A light-theme black shadow is reused unchanged. | Reevaluate raised surface, border, and shadow together in dark mode. |
| Using a colored glow everywhere | Brand color is mistaken for a universal elevation color. | Reserve colored shadows for a small set of meaningful actions and keep neutral elevation tokens. |
| Animating many large shadow stacks | Shadow transitions are added to a dense grid without profiling. | Profile the page, reduce animated layers, and consider a measured opacity-based treatment if appropriate. |
| Adding `will-change` without evidence | A performance hint is assumed to be a universal optimization. | Measure first; remove `will-change` unless profiling demonstrates a benefit. |
| Fixing clipping by increasing `z-index` | The real cause is an ancestor's overflow or stacking context. | Inspect ancestors, overflow, and stacking-context creators before changing the paint order. |
| Assuming `z-index` controls shadow strength | Visual depth and document paint order are conflated. | Debug shadow appearance separately from stacking and positioning. |
| Clipping the outer card to round its image | One wrapper is used for both image clipping and card elevation. | Put `overflow: hidden` on an inner media wrapper when the outer shadow needs to remain visible. |
| Using inset shadows as the only input boundary | Recessed styling is expected to work in every display mode. | Keep a visible border and test forced-colors rendering. |
| Forgetting reduced motion | Hover lift and shadow transitions are added without a preference check. | Add `prefers-reduced-motion` handling and ensure state remains clear without movement. |
| Making focus rings too close to the element | The ring is treated as decoration rather than a focus indicator. | Use sufficient `outline-offset` and test against nearby content and clipping. |
| Relying on shadow to distinguish a dialog | The dialog and page surfaces are too similar. | Add a distinct surface, border, and backdrop; implement dialog semantics and focus management. |
| Applying `filter: drop-shadow()` everywhere | A filter is chosen without considering the shape or paint cost. | Use `box-shadow` for box-like surfaces; use `drop-shadow()` when the alpha silhouette itself matters and test performance. |
| Stacking many colored shadows | Glow is layered until it dominates the interface. | Limit the effect to one or two purposeful layers with restrained alpha. |
| Failing to test shadows on actual content | The shadow is reviewed only on a blank demo surface. | Inspect the component on the real canvas, raised surfaces, images, and adjacent UI. |
| Assuming computed shadow explains clipping | The computed value is correct, so the issue is considered solved. | Inspect ancestor overflow and stacking contexts in DevTools. |
| Removing borders because shadows look polished | Visual styling is prioritized over boundary clarity. | Keep borders where they help identify controls or survive shadow removal. |
| Using the same shadow for menu and dialog | Elevation levels have no documented semantic meaning. | Map overlays to distinct tokens and verify their hierarchy in the actual page. |
| Forgetting forced-colors mode | The design is evaluated only with author colors enabled. | Test `forced-colors: active` and restore boundaries using system colors where appropriate. |

---

## 20. Quick Reference

| Situation / Property | Starting Point | Notes |
|---|---|---|
| Flat panel | `box-shadow: none` | Use spacing, border, or surface contrast instead. |
| Subtle card | `var(--elevation-card)` | A small contact shadow is usually enough. |
| Floating menu | `var(--elevation-popover)` | Also handle positioning and stacking order. |
| Dialog | `var(--elevation-dialog)` | Shadow does not replace backdrop or focus management. |
| Interactive lift | `translateY(-2px)` + hover token | Only for components that are genuinely interactive. |
| Pressed state | Smaller shadow or inset edge | Keep the state understandable without depth alone. |
| Colored shadow | Low-alpha brand hue | Reserve for a small number of priority elements. |
| Focus indicator | `:focus-visible` outline | Must remain distinct from hover and glow. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` | Remove movement and nonessential transitions. |
| Forced colors | `@media (forced-colors: active)` | Restore boundaries and focus with system colors. |
| Shadow clipping | Inspect ancestor `overflow` | Do not begin by increasing `z-index`. |
| Hidden behind another element | Inspect stacking contexts | A child cannot escape its ancestor's stacking context. |
| Layered shadow | Contact + ambient layers | Each layer should contribute a visible purpose. |
| Dark theme | Surface step + border + shadow | Black shadow alone may disappear. |
| Inset effect | `inset 0 1px 2px ...` | Keep a visible border for controls. |
| Shadow debugging | `getComputedStyle()` | Computed values do not reveal all ancestor clipping. |
| Performance issue | Browser performance tools | Profile before adding optimization hints. |
| SVG silhouette shadow | `filter: drop-shadow()` | Useful when the alpha shape, not the box, defines the shadow. |
| Card image clipping | Inner media wrapper | Let the outer card shadow remain unclipped. |
| Dialog backdrop | `dialog::backdrop` | Check the composite against the page and dialog. |
| Elevation tokens | Named CSS custom properties | Map roles to components in one place. |

---

## 21. Specific Build Requirements

1. Inventory all surface roles and overlays before defining shadow values.
2. Create a small elevation scale with named semantic roles.
3. Separate static elevation tokens from hover and pressed-state feedback.
4. Define shadow tokens centrally as CSS custom properties.
5. Use surface colors and borders alongside shadows where boundaries matter.
6. Test every elevation level on the actual canvas and raised surfaces.
7. Create deliberate light- and dark-theme shadow behavior.
8. Reserve colored shadows and glows for documented special roles.
9. Give every interactive component a clear `:focus-visible` treatment independent of shadow.
10. Check that important component boundaries remain visible when shadows are removed.
11. Add reduced-motion behavior for movement and transitions associated with elevation.
12. Test forced-colors mode and restore boundaries with system colors where appropriate.
13. Inspect ancestor overflow and stacking contexts when a shadow is clipped or hidden.
14. Profile shadow-heavy animations before attempting optimization.
15. Avoid `will-change` unless profiling justifies it.
16. Document which component roles use each elevation token.
17. Check card, popover, dialog, input, and button patterns in real layouts.
18. Remove duplicate one-off shadow values that do not represent a distinct role.

### Build challenge: the popover shadow is clipped

**Scenario:** A dropdown menu uses the correct `--elevation-popover` token, and `getComputedStyle()` reports the expected shadow. However, the shadow disappears along the right and bottom edges. Raising the menu's `z-index` does not fix the problem.

**Your task:** Find the ancestor that clips the shadow, determine whether the menu also sits inside a stacking context, and restructure the layout so the overlay paints correctly without breaking the component's rounded image or panel corners.

**Required evidence:**

- The computed `box-shadow` value for the popover.
- The ancestor whose overflow or clipping behavior caused the problem.
- A brief explanation of the relevant stacking context.
- A corrected DOM/CSS structure or overlay strategy.
- A keyboard focus check using `:focus-visible`.
- A forced-colors check showing that the popover boundary remains visible without the shadow.
- A reduced-motion check if the popover animates into view.

---

## 22. Mental Models

1. **Elevation is a role, not a blur radius.** Choose the semantic level first, then tune the values.
2. **A shadow suggests depth; it does not change stacking order.** Paint order must be debugged separately.
3. **A border and a shadow solve different problems.** The border defines a boundary; the shadow suggests separation from a surface.
4. **A small contact layer anchors the object.** A broad ambient layer adds distance when needed.
5. **More layers do not automatically mean more realism.** Every layer should contribute a visible purpose.
6. **Dark-mode elevation is a relationship between surfaces.** Black shadows often need help from borders and surface steps.
7. **Colored shadow is an accent, not a default.** Use it where it reinforces a clear visual role.
8. **Glow and focus are not synonyms.** Focus must remain obvious to keyboard users and independent of hover.
9. **A shadow is optional decoration; a clear control boundary is not.** The interface should still make sense without shadows.
10. **Computed styles explain declarations, not the whole rendering context.** Ancestor clipping and stacking still matter.
11. **Animation cost depends on the page and browser.** Profile before adding optimization hints.
12. **Reduced motion should preserve meaning.** Remove movement, not the information conveyed by the state.
13. **A high `z-index` cannot escape a parent stacking context.** Fix the context or move the overlay.
14. **The best shadow is often the least noticeable one that still works.** If the effect dominates content, reduce it.
15. **Token consistency beats per-component novelty.** Add an exception only when the component has a real distinct role.

---

## 23. Gotchas

> **Gotcha 1 — Shadows do not affect layout.** They can extend visually outside an element but do not reserve space; nearby content can overlap them.

> **Gotcha 2 — Overflow can clip a perfectly valid shadow.** Inspect ancestors before changing blur or `z-index`.

> **Gotcha 3 — A shadow cannot substitute for focus.** Use a clear `:focus-visible` outline that is independent of decorative glow.

> **Gotcha 4 — Dark surfaces may swallow dark shadows.** A border and raised surface can communicate hierarchy more effectively than a stronger black blur.

> **Gotcha 5 — `will-change` is not free.** It may increase memory or compositing costs and should be added only when profiling supports it.

> **Gotcha 6 — Forced-colors can remove the effect you designed around.** Boundaries and focus must remain clear without the shadow.

> **Gotcha 7 — `filter: drop-shadow()` follows the rendered alpha shape.** It is not interchangeable with `box-shadow` for every component.

> **Gotcha 8 — A hover lift can imply clickability.** Do not animate static cards in a way that misleads users about interaction.

---

## 24. Definition of Done

- [ ] Every elevation level has a documented role and at least one intended component use.
- [ ] Reusable shadows are defined as central CSS custom properties.
- [ ] Static elevation is separate from hover, active, and pressed feedback.
- [ ] Card, popover, dialog, and form-control surfaces have been reviewed in context.
- [ ] The shadow scale has been compared on canvas and raised surfaces in each supported theme.
- [ ] Borders or surface contrast preserve important boundaries if shadows are removed.
- [ ] Keyboard focus is visible through `:focus-visible` and does not depend on glow.
- [ ] Reduced-motion behavior removes nonessential movement without losing state clarity.
- [ ] Forced-colors mode preserves component boundaries and focus.
- [ ] The popover clipping challenge has been debugged through ancestor overflow and stacking contexts.
- [ ] Shadow-heavy transitions have been profiled before optimization hints are added.
- [ ] Colored shadows are limited to documented use cases.
- [ ] No shadow token is duplicated under multiple unexplained names.
- [ ] A future contributor can choose an elevation token by component role.

---

## Appendix A — Semantic HTML Specimen

```html
<main class="page-shell">
  <header class="page-header">
    <h1>Elevation specimen</h1>
    <p>Compare flat, raised, and overlay surfaces.</p>
  </header>

  <section class="surface-grid" aria-label="Surface examples">
    <article class="surface-card">
      <h2>Card surface</h2>
      <p>A subtle shadow supports grouping without dominating content.</p>
      <a href="#details">Read details</a>
    </article>

    <article class="surface-card surface-card--interactive">
      <h2>Interactive card</h2>
      <p>Hover lift is reserved for a genuinely clickable surface.</p>
      <button type="button">Open example</button>
    </article>

    <aside class="surface-note">
      <h2>Review note</h2>
      <p>Check boundaries with shadows disabled.</p>
    </aside>
  </section>

  <section id="details" aria-labelledby="details-title">
    <h2 id="details-title">Control example</h2>
    <form>
      <label for="search-query">Search</label>
      <input id="search-query" name="q" type="search">
      <button type="submit">Search</button>
    </form>
  </section>

  <dialog aria-labelledby="dialog-title">
    <h2 id="dialog-title">Overlay surface</h2>
    <p>A dialog needs correct semantics and focus management in addition to elevation.</p>
    <button type="button">Close</button>
  </dialog>
</main>
```

---

## Appendix B — Shadow Token Starter Sheet

```css
:root {
  --elevation-flat: none;

  --elevation-card:
    0 1px 2px rgb(15 23 42 / 8%),
    0 4px 12px rgb(15 23 42 / 5%);

  --elevation-card-hover:
    0 3px 8px rgb(15 23 42 / 8%),
    0 10px 22px rgb(15 23 42 / 7%);

  --elevation-popover:
    0 4px 12px rgb(15 23 42 / 10%),
    0 16px 32px rgb(15 23 42 / 9%);

  --elevation-dialog:
    0 16px 42px rgb(15 23 42 / 16%);

  --elevation-inset:
    inset 0 1px 2px rgb(15 23 42 / 9%);

  --shadow-brand:
    0 5px 16px rgb(79 70 229 / 18%);

  --color-focus-ring: #005fcc;
}

[data-theme="dark"] {
  --elevation-card:
    0 3px 12px rgb(0 0 0 / 24%);

  --elevation-card-hover:
    0 6px 20px rgb(0 0 0 / 32%);

  --elevation-popover:
    0 8px 24px rgb(0 0 0 / 38%);

  --elevation-dialog:
    0 18px 48px rgb(0 0 0 / 48%);
}

.elevated-surface {
  box-shadow: var(--elevation-card);
  border: 1px solid var(--color-border, #cbd5e1);
}

.elevated-surface:focus-within {
  border-color: var(--color-focus-ring);
}

.elevated-surface :where(a, button, input, select, textarea):focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .elevated-surface {
    transition: none;
  }
}

@media (forced-colors: active) {
  .elevated-surface {
    box-shadow: none;
    border: 1px solid CanvasText;
  }

  .elevated-surface :focus-visible {
    outline: 2px solid Highlight;
  }
}
```

Use this sheet as a starting point, not a final universal scale. Review its appearance in the target product, verify contrast and focus behavior, and profile animated states on representative devices.

---

## Appendix C — Handoff Notes

The handoff should identify the approved elevation tokens, their intended component roles, the surface and border tokens used alongside them, and any special colored-shadow exceptions. Include notes about dark theme, forced-colors behavior, reduced motion, and the expected overlay/stacking strategy.

When a shadow looks wrong, debug it in this order: confirm the computed declaration, inspect ancestor clipping, inspect stacking contexts and paint order, compare against the actual surface color, then evaluate whether the token itself needs adjustment. Do not start by adding blur, opacity, or `z-index` without evidence.

The system is ready when elevation is consistent, interaction feedback is clear, decorative effects are restrained, and components remain understandable when shadows are absent.
