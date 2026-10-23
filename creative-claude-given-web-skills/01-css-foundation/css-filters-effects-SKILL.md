# SKILL: css-filters-effects

## Layer
**Layer 01 — CSS Foundation**

## Goal
Build a reliable, accessible, performant visual-effects system using CSS filters, blend modes, shadows, gradients, masks, opacity, and compositing. Choose effects intentionally, understand how they combine, avoid accidental stacking contexts and unreadable content, and ship effects that degrade gracefully.

## When to Use This Skill
Use this skill when implementing:
- Image treatments such as grayscale, saturation, warmth, blur, contrast, or duotone-like effects.
- Hover and focus treatments that need more than a simple color change.
- Surface depth using shadows, inset shadows, and layered lighting.
- Decorative gradients, overlays, masks, and blend modes.
- Image cards, editorial covers, product tiles, hero art, badges, and visual states.
- A design system that needs consistent effect tokens and predictable combinations.

Do not reach for effects to compensate for poor layout, weak typography, or insufficient contrast. An effect should clarify hierarchy, create atmosphere, or communicate state—not make the interface harder to use.

## Why This Matters (Senior Perspective)
Visual effects are easy to add and surprisingly easy to misuse. A single `filter`, `opacity`, `transform`, `mix-blend-mode`, or `isolation` declaration can change rendering, text clarity, hit-testing expectations, stacking behavior, and compositing cost. The senior-level task is not knowing that `blur()` exists; it is knowing which element should own the effect, how the effect interacts with descendants, whether it creates a stacking context, how it behaves on keyboard focus, and how to keep the interface understandable when an effect is unsupported or expensive.

A robust effects system separates **content**, **surface**, and **decoration**. Content remains readable and semantically meaningful. Surfaces define the visual plane. Decoration can be layered behind or around content without changing the content itself. This separation makes effects easier to tune, test, disable, and reuse.

The strongest implementation is often the smallest one: one subtle shadow, one restrained overlay, or one state transition. Effects should have a purpose, a bounded scope, and a fallback.

## Core Concepts

### 1. `filter` Changes the Rendered Appearance of an Element
The `filter` property applies graphical effects to the element’s rendered output. Common functions include:
- `blur()`
- `brightness()`
- `contrast()`
- `grayscale()`
- `hue-rotate()`
- `invert()`
- `opacity()`
- `saturate()`
- `sepia()`
- `drop-shadow()`

```css
.product-image {
  filter: saturate(0.92) contrast(1.03);
}
```

A filter does not alter the source pixels or the underlying content data. It changes how the element is painted. Effects are applied in the order written, so `brightness() contrast()` may not look identical to `contrast() brightness()`.

**Gotcha:** Applying `filter` to a container affects its descendants as part of the rendered result. If you need the image to become grayscale while the title stays in full color, put the filter on the image—not the whole card.

### 2. Filter Order Is Meaningful
Filter functions form an ordered pipeline. A good default is to keep the list short and adjust one function at a time.

```css
.photo--editorial {
  filter: grayscale(1) contrast(1.12) brightness(0.94);
}
```

The sequence matters because each operation receives the output of the previous operation. Record the intended order in a component class rather than assembling long filter strings across unrelated selectors.

### 3. `blur()` and Its Practical Limits
`blur(6px)` softens detail. It can be used for background atmosphere, decorative glow, or a deliberate disabled visual—but it should not obscure information users need to read.

```css
.hero__glow {
  filter: blur(28px);
  opacity: 0.55;
}
```

Large blur radii can require substantial painting work, especially when a large element moves or animates. Blur may also visually extend beyond the element’s original bounds, so provide space around decorative layers and check clipping.

**Gotcha:** Blurring the entire modal or card makes the text blurry too. Blur a dedicated background layer and keep foreground content separate.

### 4. Brightness, Contrast, Saturation, and Grayscale
These are best used as controlled image treatments, not as arbitrary “make it pop” sliders.

```css
.thumbnail {
  filter: saturate(0.85);
}

.thumbnail:hover {
  filter: saturate(1);
}
```

- `brightness(1)` is the neutral value; values below 1 darken and above 1 brighten.
- `contrast(1)` is neutral; higher values increase contrast.
- `saturate(1)` is neutral; higher values increase saturation.
- `grayscale(1)` removes chroma; intermediate values partially desaturate.
- `sepia(1)` applies a warm brown treatment.
- `hue-rotate(20deg)` shifts hues around the color wheel; it is not a substitute for choosing an accessible brand color.

These operations can alter perceived contrast. Test the final image and text combination rather than assuming the original contrast remains valid.

### 5. `opacity` Versus `filter: opacity()`
The `opacity` property and `filter: opacity()` can produce similar visible transparency, but their implementation and composition implications are not identical in every context. Prefer the `opacity` property for ordinary element transparency because it communicates intent clearly and is easier to animate and inspect.

```css
.scrim {
  opacity: 0.6;
}
```

Opacity on an ancestor makes all of its descendants appear translucent together. If text must remain fully opaque over a translucent surface, use a background color with alpha rather than opacity on the parent.

```css
.dialog {
  background: rgb(20 24 32 / 92%);
}
```

**Gotcha:** `opacity: 0` does not remove an element from keyboard navigation or the accessibility tree. Use the appropriate hidden/inert/state mechanism for the actual interaction requirement.

### 6. `drop-shadow()` Versus `box-shadow`
`box-shadow` follows the box rectangle; `filter: drop-shadow()` follows the alpha shape of the rendered image. This distinction is useful for transparent PNGs, SVG icons, and cut-out artwork.

```css
.icon-art {
  filter: drop-shadow(0 8px 12px rgb(0 0 0 / 22%));
}

.card {
  box-shadow: 0 12px 32px rgb(15 23 42 / 12%);
}
```

Use `box-shadow` for component surfaces and `drop-shadow()` for irregular silhouettes. A `drop-shadow()` is a filter and may create a stacking context. Avoid applying it to a large wrapper when only one icon needs a shape-following shadow.

### 7. Shadows Need a Depth Model
A shadow should explain a relationship to the surrounding surface. Avoid using one huge dark shadow for every component.

A useful system defines a small number of elevations:
- `shadow-1`: subtle separation for controls or cards.
- `shadow-2`: raised interactive surfaces.
- `shadow-3`: floating menus or dialogs.

```css
:root {
  --shadow-1: 0 1px 3px rgb(15 23 42 / 10%);
  --shadow-2: 0 8px 20px rgb(15 23 42 / 12%);
  --shadow-3: 0 18px 48px rgb(15 23 42 / 18%);
}
```

For dark themes, pure black shadows may disappear. Combine subtle shadows with border or surface-value differences rather than simply increasing blur.

**Gotcha:** A shadow is not a focus indicator. Keyboard focus must have a visible, sufficiently distinct treatment that works on the actual background.

### 8. Layered Shadows
Multiple shadows can communicate both contact and ambient light. The first listed shadow paints above later shadows.

```css
.panel {
  box-shadow:
    0 1px 2px rgb(15 23 42 / 8%),
    0 10px 24px rgb(15 23 42 / 10%);
}
```

Use two or three intentional layers, not a pile of arbitrary values. The tight shadow gives contact; the broader shadow suggests ambient separation.

### 9. Inset Shadows
An inset shadow creates an inner edge or recessed surface. It can help distinguish an input well or pressed region, but it should not make the control look disabled.

```css
.search-input {
  box-shadow: inset 0 1px 3px rgb(15 23 42 / 12%);
}
```

Pair inset shadows with border, fill, and focus styling. Never rely on an inset shadow alone to communicate a required state.

### 10. Gradients Are Images
Linear, radial, and conic gradients can provide backgrounds, lighting, overlays, and visual emphasis without requiring a separate image file.

```css
.hero {
  background:
    linear-gradient(110deg, rgb(8 12 20 / 82%), rgb(8 12 20 / 12%)),
    url("/images/hero.webp") center / cover;
}
```

Keep text readable over the brightest and darkest portions of the gradient. If a gradient sits behind important content, test at narrow widths and with the real image—not only with a placeholder.

### 11. Gradient Overlay Layering
An overlay can improve text readability on top of imagery. Prefer a pseudo-element or explicit decoration layer when the overlay should not change the opacity of content.

```css
.media-card {
  position: relative;
  isolation: isolate;
}

.media-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    to top,
    rgb(0 0 0 / 72%),
    rgb(0 0 0 / 0%) 68%
  );
}
```

Here, `isolation: isolate` establishes a local stacking context. If the pseudo-element sits behind the card’s content, verify that the parent establishes the intended stacking and that no other positioned child escapes the intended order.

### 12. `mix-blend-mode`
`mix-blend-mode` controls how an element’s colors blend with the backdrop. Modes such as `multiply`, `screen`, `overlay`, `soft-light`, and `difference` can create sophisticated visual effects.

```css
.tint {
  background: #ef5da8;
  mix-blend-mode: multiply;
}
```

Blending depends on the backdrop, so the same element can look different on different surfaces. It is best for decorative effects where variation is acceptable. It is a poor choice for essential text, icons, or status indicators unless all backgrounds are controlled and thoroughly tested.

**Gotcha:** Blend modes can cause unexpected interactions with ancestors and siblings. Use `isolation: isolate` when a blend should be constrained to a component, and test the real page composition.

### 13. `background-blend-mode`
This property blends an element’s background layers with one another. It is different from `mix-blend-mode`, which blends the element with the backdrop behind the element.

```css
.artwork {
  background-image:
    linear-gradient(rgb(26 32 44 / 25%), rgb(26 32 44 / 25%)),
    url("/images/artwork.webp");
  background-color: #315b82;
  background-blend-mode: multiply;
}
```

Use `background-blend-mode` when the effect belongs to the background stack itself. Use `mix-blend-mode` when the rendered element should interact with the surrounding backdrop.

### 14. `isolation`
`isolation: isolate` creates a new stacking context and can limit the backdrop used for blending within that isolated group.

```css
.art-card {
  isolation: isolate;
}
```

It is a containment tool, not a universal fix for every `z-index` problem. Introduce it when you understand which layers should blend together. A stacking context also affects how descendants are ordered relative to elements outside it.

### 15. Masks and `mask-image`
CSS masks control which parts of an element are visible, using alpha or luminance information from a mask source. A gradient mask can softly fade an image at an edge.

```css
.fade-edge {
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 12%,
    black 88%,
    transparent
  );
  mask-image: linear-gradient(
    to right,
    transparent,
    black 12%,
    black 88%,
    transparent
  );
}
```

For compatibility-sensitive projects, test target browsers and include the prefixed form where your support matrix requires it. A mask can hide content visually without changing its semantic meaning, so do not mask essential text or controls in a way that makes them hard to perceive.

### 16. `clip-path` Is Not the Same as a Mask
`clip-path` defines a clipping region; masks provide per-pixel visibility. Use `clip-path` for clear geometric cuts such as angled cards or circles, and masks for soft fades or alpha-driven artwork.

```css
.feature-image {
  clip-path: polygon(0 0, 100% 0, 100% 82%, 0 100%);
}
```

**Gotcha:** Clipping can cut off focus outlines and shadows. Do not clip the interactive element itself if its keyboard focus indicator needs to extend beyond the clipped region; put clipping on a decorative child instead.

### 17. `backdrop-filter`
`backdrop-filter` applies effects to the area behind an element, commonly for translucent glass-like surfaces.

```css
.glass-panel {
  background: rgb(255 255 255 / 68%);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid rgb(255 255 255 / 36%);
}
```

The background must allow the backdrop to show through for the effect to be visible. A nearly opaque fill can make the blur imperceptible. Backdrop effects may be expensive over large or frequently changing areas; constrain their size and test on lower-powered devices.

**Gotcha:** Glassmorphism is not an accessibility strategy. The surface still needs sufficient contrast against every plausible backdrop.

### 18. Pseudo-Elements as Decoration Layers
Use `::before` and `::after` for visual layers that do not need independent semantics or interaction. Keep real content in the DOM and keep decoration out of the reading order.

```css
.glow-card {
  position: relative;
  isolation: isolate;
}

.glow-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(120deg, #6ee7f9, #a78bfa, #f472b6);
  opacity: 0.55;
  filter: blur(14px);
}
```

Avoid making pseudo-elements interactive. If a visual affordance needs a click target, use a semantic control.

### 19. Transition Effects, Not Everything
Transitions can smooth changes in visual state, but broad `transition: all` declarations can animate unintended properties and make later maintenance difficult.

```css
.media-card__image {
  transition: filter 180ms ease, transform 180ms ease;
}

.media-card:hover .media-card__image {
  filter: saturate(1.08);
  transform: scale(1.025);
}
```

Animate only the properties needed for the effect. Test whether the animation adds meaning; if it merely delays feedback, shorten or remove it.

### 20. Respect Reduced Motion
Filters and shadows themselves are not motion, but effects are often combined with transforms, animated gradients, or animated blur. Honor the user’s reduced-motion preference when the effect creates motion or spatial change.

```css
@media (prefers-reduced-motion: reduce) {
  .media-card__image {
    transition: none;
  }

  .animated-glow {
    animation: none;
  }
}
```

Do not assume all users who request reduced motion need every static effect removed. Remove or simplify motion that can be disorienting; preserve essential state communication.

### 21. Focus, Hover, and Touch
Hover-only visual treatments should never be the only way to discover important information. Provide equivalent information in the default state, on focus, or through an explicit control.

```css
.media-card:is(:hover, :focus-within) .media-card__image {
  filter: saturate(1.08);
}

.media-card a:focus-visible {
  outline: 3px solid #1d4ed8;
  outline-offset: 4px;
}
```

The `:focus-visible` outline must remain visible above shadows, overlays, masks, and clipping. Test with keyboard navigation and a high-contrast display setting where possible.

### 22. Color Contrast After Effects
A filter, translucent overlay, gradient, blend mode, or backdrop blur may change the perceived color behind text. Check contrast after the full effect stack is applied. Do not assume that a text color that worked on the original image still works on the treated image.

For text over imagery, robust options include:
- A solid or sufficiently opaque surface behind text.
- A tested gradient overlay.
- A dedicated text panel.
- A crop and image choice that preserve predictable contrast.

Do not encode status solely through a color filter. Pair color with text, iconography, shape, or another understandable cue.

### 23. Filters Can Create Stacking Contexts
A non-`none` `filter` creates a stacking context and can affect containing-block behavior for positioned descendants. Similar visual properties, including transforms and opacity values below `1`, can also create stacking contexts.

If a tooltip inside a filtered card appears behind a neighboring card, inspect the ancestor stacking contexts before increasing `z-index` indefinitely. The child cannot out-rank a sibling stacking context from outside its parent context.

**Gotcha:** A very large `z-index` is not a universal escape hatch. Move the overlay to a suitable higher-level layer or remove the unintended context if the design permits.

### 24. Performance: Static Versus Animated Effects
Static filters and shadows can be reasonable, but large blurred layers, backdrop filters, and continuously animated effects may increase painting or compositing work. Performance depends on browser, device, element size, and what is changing.

Practical rules:
- Keep decorative blur regions small.
- Avoid animating huge `filter: blur()` regions unless profiling proves it acceptable.
- Prefer transform and opacity for simple movement/fades when suitable.
- Do not add `will-change` speculatively.
- Test on a representative low-powered device.
- Use browser performance tools to confirm the actual bottleneck.

**Gotcha:** `will-change` is not a magic performance switch. It can consume resources and create new compositing or stacking behavior. Add it only for a measured, short-lived need.

### 25. Effect Tokens and Design-System Consistency
Centralize repeatable effects in custom properties. Tokens keep component styles consistent and allow themes to adjust effects without rewriting every component.

```css
:root {
  --effect-shadow-card:
    0 1px 2px rgb(15 23 42 / 8%),
    0 10px 24px rgb(15 23 42 / 10%);
  --effect-shadow-floating:
    0 16px 44px rgb(15 23 42 / 18%);
  --effect-image-muted: grayscale(0.15) saturate(0.9);
  --effect-overlay-strong:
    linear-gradient(to top, rgb(0 0 0 / 76%), transparent 72%);
}
```

Name tokens by purpose, not by an arbitrary implementation value. `--effect-shadow-floating` describes intent better than `--shadow-18px`.

### 26. Theme-Aware Effects
Effects often need theme-specific tuning. A shadow that looks subtle on a white surface may disappear on a dark surface; a bright glow that works on dark mode may overpower light mode.

```css
:root {
  color-scheme: light;
  --surface-shadow: 0 8px 24px rgb(20 30 50 / 12%);
  --surface-border: rgb(20 30 50 / 12%);
}

[data-theme="dark"] {
  color-scheme: dark;
  --surface-shadow: 0 8px 24px rgb(0 0 0 / 30%);
  --surface-border: rgb(255 255 255 / 14%);
}
```

Use a border or surface contrast in addition to shadow when needed. Do not assume a dark theme is just a light theme with black shadows.

### 27. SVG and Filter Effects
SVG has its own filter primitives and can define effects such as blur, drop shadow, color matrix, and compositing. Prefer CSS filters for straightforward effects; use SVG filters when the design needs more precise control and the team can maintain the SVG definitions.

Keep filter definitions scoped and understandable. Complex SVG filters can be expensive, so profile them and test browser support. Use meaningful accessible names for informative SVG images, and mark purely decorative SVG as decorative.

### 28. Fallbacks and Progressive Enhancement
Build the component so the content remains understandable without a decorative effect. A card should still be readable if a blur, blend mode, or mask is unsupported.

```css
.hero-panel {
  background: #182234;
  color: #fff;
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .hero-panel {
    background: rgb(24 34 52 / 76%);
    -webkit-backdrop-filter: blur(12px);
    backdrop-filter: blur(12px);
  }
}
```

The fallback should be a designed state, not an accidental broken state. If the effect is essential to understanding a state, use a more robust visual signal.

### 29. Debugging an Effect Stack
Debug effects systematically:
1. Identify the element that owns the effect.
2. Disable one effect at a time.
3. Check the computed styles and pseudo-elements.
4. Inspect ancestor stacking contexts and clipping.
5. Verify the actual background behind blend/backdrop effects.
6. Check whether the filter affects descendants.
7. Test keyboard focus and text contrast.
8. Profile performance only after identifying a reproducible slow interaction.

Example browser-console diagnostic:

```js
const element = document.querySelector(".media-card__image");
const styles = getComputedStyle(element);

console.table({
  filter: styles.filter,
  opacity: styles.opacity,
  mixBlendMode: styles.mixBlendMode,
  boxShadow: styles.boxShadow,
  position: styles.position,
  zIndex: styles.zIndex
});
```

The console output is a starting point, not a complete explanation of painting order. Inspect ancestors and pseudo-elements too.

### 30. Choosing the Right Effect
Use this decision guide:
- Need a rectangular surface elevation? Use `box-shadow`.
- Need a shadow following transparent artwork? Use `filter: drop-shadow()`.
- Need to recolor or soften an image? Use `filter`.
- Need to blend a background layer with another background layer? Use `background-blend-mode`.
- Need an element to blend with the page backdrop? Use `mix-blend-mode`.
- Need a soft fade at an image edge? Use `mask-image`.
- Need a hard geometric crop? Use `clip-path`.
- Need to blur content behind a translucent panel? Use `backdrop-filter` with a solid fallback.
- Need readable text over imagery? Use a tested overlay or dedicated text surface.
- Need a clear keyboard state? Use a visible focus indicator, not just a shadow or glow.

## Reusable Patterns

### Pattern 1 — Image Desaturation That Restores on Interaction
```css
.image-tile__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(0.7) saturate(0.8);
  transition: filter 180ms ease;
}

.image-tile:is(:hover, :focus-within) .image-tile__image {
  filter: grayscale(0) saturate(1);
}

@media (prefers-reduced-motion: reduce) {
  .image-tile__image {
    transition: none;
  }
}
```
Use only when the default muted appearance does not hide important information. The interaction should remain usable on touch screens.

### Pattern 2 — Readable Image Card Overlay
```css
.image-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1rem;
  color: white;
  background: #172033;
}

.image-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.image-card::after {
  content: "";
  position: absolute;
  inset: 30% 0 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgb(0 0 0 / 78%));
}

.image-card__content {
  position: absolute;
  z-index: 1;
  inset-inline: 1rem;
  bottom: 1rem;
}
```
Test the gradient against the actual crop at mobile and desktop sizes. Keep text and links in semantic HTML.

### Pattern 3 — Transparent Artwork Shadow
```css
.brand-mark {
  filter: drop-shadow(0 6px 10px rgb(0 0 0 / 18%));
}
```
Use this for transparent artwork whose silhouette should define the shadow. Use `box-shadow` for the containing surface instead.

### Pattern 4 — Restrained Glass Surface
```css
.glass-surface {
  color: #111827;
  background: rgb(255 255 255 / 92%);
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 1rem;
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-surface {
    background: rgb(255 255 255 / 70%);
    -webkit-backdrop-filter: blur(14px) saturate(1.15);
    backdrop-filter: blur(14px) saturate(1.15);
  }
}
```
The opaque fallback preserves readability. Validate contrast against varied content behind the panel.

### Pattern 5 — Soft Decorative Glow
```css
.glow-surface {
  position: relative;
  isolation: isolate;
  background: #111827;
  border-radius: 1.25rem;
}

.glow-surface::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  border-radius: inherit;
  background: linear-gradient(120deg, #22d3ee, #818cf8, #f472b6);
  filter: blur(16px);
  opacity: 0.45;
  pointer-events: none;
}
```
Keep the glow decorative and bounded. If it is too large, reduce its size or opacity before adding more blur.

### Pattern 6 — Reusable Elevation Tokens
```css
:root {
  --shadow-card:
    0 1px 2px rgb(15 23 42 / 8%),
    0 8px 24px rgb(15 23 42 / 9%);
  --shadow-popover:
    0 12px 28px rgb(15 23 42 / 16%),
    0 2px 6px rgb(15 23 42 / 8%);
}

.card {
  box-shadow: var(--shadow-card);
}

.popover {
  box-shadow: var(--shadow-popover);
}
```
Use the tokens consistently and tune them for both light and dark themes.

### Pattern 7 — Duotone-Like Background Treatment
```css
.duotone-art {
  background-color: #244a76;
  background-image:
    linear-gradient(rgb(30 80 120 / 48%), rgb(30 80 120 / 48%)),
    url("/images/portrait.webp");
  background-blend-mode: color, normal;
  background-position: center;
  background-size: cover;
}
```
Blend-mode behavior varies with the image and backdrop. For an exact brand duotone, a preprocessed asset or SVG filter may be more predictable than a complex CSS blend stack.

### Pattern 8 — Masked Image Fade
```css
.edge-fade {
  -webkit-mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 70%,
    transparent 100%
  );
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    black 70%,
    transparent 100%
  );
}
```
Use for decorative imagery or visual transitions. Do not mask text, buttons, or essential content.

### Pattern 9 — Focus-Safe Card Interaction
```css
.effect-card {
  border: 1px solid #cbd5e1;
  border-radius: 1rem;
  transition: box-shadow 160ms ease, border-color 160ms ease;
}

.effect-card:hover {
  box-shadow: 0 10px 28px rgb(15 23 42 / 12%);
}

.effect-card a:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .effect-card {
    transition: none;
  }
}
```
The focus outline is independent from the elevation shadow. Avoid clipping the outline with `overflow: hidden`.

### Pattern 10 — Dark Overlay With Stable Contrast
```css
.feature-hero {
  position: relative;
  color: white;
  background: #101827 url("/images/feature.webp") center / cover no-repeat;
  isolation: isolate;
}

.feature-hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(
    90deg,
    rgb(0 0 0 / 78%) 0%,
    rgb(0 0 0 / 48%) 58%,
    rgb(0 0 0 / 18%) 100%
  );
}
```
Verify at all responsive crops. If the text moves over a bright part of the image on a small screen, use a different mobile gradient or a solid content panel.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Applying `filter` to the entire card | Text, icons, and controls are affected with the image | Apply the filter to the specific visual layer |
| Using huge blur radii everywhere | Can look muddy and increase rendering cost | Reduce the blurred area and use restrained opacity |
| Using a shadow as the only focus indicator | Focus may be too subtle or indistinguishable from elevation | Add a dedicated `:focus-visible` outline |
| Writing `transition: all` | Unintended properties animate as the component evolves | List only the properties that should transition |
| Using a blend mode for essential text | The result changes with the backdrop | Put text on a predictable surface |
| Assuming `z-index: 999999` solves everything | Stacking contexts constrain descendant ordering | Inspect ancestors and move the overlay to the correct layer |
| Applying `opacity` to a parent to fade only its background | All descendant content becomes translucent | Use an alpha background or separate overlay layer |
| Assuming `opacity: 0` hides an element accessibly | It may remain focusable and exposed to assistive technology | Use the correct hidden, inert, or state mechanism |
| Using backdrop blur with an opaque fill | The backdrop effect is not visible | Tune the alpha channel and provide a fallback |
| Using glass styling without contrast checks | Text contrast depends on the background behind the panel | Test contrast against real backdrops and provide a stronger fill |
| Forgetting a dark-theme shadow token | Shadows may disappear on dark surfaces | Pair shadow with border and surface-value separation |
| Using `drop-shadow()` for a rectangular card | It follows alpha pixels and is less appropriate for normal elevation | Use `box-shadow` for the box surface |
| Using `box-shadow` for transparent artwork | Shadow follows the element’s box, not the visible silhouette | Use `filter: drop-shadow()` |
| Animating a large blur without profiling | Paint work can become expensive | Profile and constrain the effect area |
| Adding `will-change` to every card | Wastes resources and can alter compositing behavior | Add it only after profiling a specific bottleneck |
| Masking text to make it decorative | Essential content becomes harder to read | Mask decorative media, not important text or controls |
| Clipping the interactive element | Focus rings and shadows may be cut off | Clip a decorative child and leave focusable content unclipped |
| Assuming filters preserve contrast | Color treatment can change luminance and saturation | Re-test the final rendered combination |
| Using only color to signal status | Some users may not perceive the color distinction | Add labels, icons, or other cues |
| Ignoring touch interaction | Hover-only effects may not run on touch devices | Keep content available by default and use explicit controls when needed |
| Forgetting reduced-motion preferences | Motion may be uncomfortable or distracting | Use `prefers-reduced-motion` for animated effects |
| Creating a pseudo-element without `content` | The decoration does not render | Set `content: ""` for decorative pseudo-elements |
| Setting a negative `z-index` without understanding the parent | Decoration may fall behind the page or disappear | Establish a deliberate local stacking context and verify layering |
| Using the same effect on every component | The UI loses depth hierarchy | Define a small elevation and effect scale |
| Relying on a gradient over every image | Some crops remain unreadable | Use image-specific positioning or a solid text surface |
| Assuming every filter is equally supported or cheap | Browser and device behavior differs | Check target support and test representative devices |
| Treating `isolation: isolate` as a universal fix | It changes stacking behavior and may introduce new constraints | Add it only when you need a local compositing group |
| Forgetting pointer behavior on overlays | Decorative layers can intercept clicks | Use `pointer-events: none` for non-interactive decoration |
| Building a complex effect before validating the base UI | Debugging becomes difficult because many variables interact | Start with a stable surface, then add one effect at a time |
| Leaving effects undocumented in a shared system | Teams produce inconsistent variants | Name tokens by intent and document allowed usage |

## Mental Models

1. **The layer model:** content, surface, and decoration are separate responsibilities. Put each effect on the layer whose pixels it should change.
2. **The pipeline model:** filter functions run in sequence. Reordering the functions can change the result.
3. **The backdrop model:** blend modes and backdrop filters depend on what is behind the element, so their output is context-sensitive.
4. **The stacking-context model:** descendants are ordered inside their ancestor context. A huge child `z-index` cannot jump outside that context.
5. **The depth model:** shadows should express elevation and contact, not act as a generic decoration or a replacement for focus.
6. **The contrast model:** contrast must be checked after overlays, filters, masks, and image crops are applied.
7. **The performance budget model:** the larger and more frequently changing the affected pixels, the more carefully expensive effects should be profiled.
8. **The progressive-enhancement model:** the component must remain understandable when a decorative effect is missing.
9. **The motion model:** an interaction should feel responsive; reduce nonessential motion when the user requests reduced motion.
10. **The token model:** a small set of purpose-named effect tokens is more maintainable than one-off values scattered through the codebase.
11. **The geometry model:** `box-shadow` follows the box; `drop-shadow()` follows visible alpha; `clip-path` defines a hard region; masks provide graded visibility.
12. **The ownership model:** if the effect should change only an image, the image owns the effect—not the parent that also contains text and controls.

## Quick Reference

| Need | Prefer | Watch Out For |
|---|---|---|
| Rectangular elevation | `box-shadow` | Does not replace focus styling |
| Shadow around transparent art | `filter: drop-shadow()` | Filter stacking-context behavior |
| Image color treatment | `filter` | Contrast and descendant scope |
| Background layer interaction | `background-blend-mode` | Depends on layer order |
| Element blending with backdrop | `mix-blend-mode` | Context-sensitive output |
| Blur behind a translucent panel | `backdrop-filter` | Cost, fallback, and contrast |
| Soft edge fade | `mask-image` | Browser support and hidden content |
| Geometric crop | `clip-path` | Focus ring and shadow clipping |
| Readable text over a photo | Gradient overlay or solid surface | Recheck every crop |
| Decorative halo | Pseudo-element plus gradient/blur | Contain the layer and avoid hit-test issues |
| Keyboard focus | `:focus-visible` outline | Keep it distinct and unclipped |
| Dark-theme depth | Theme-specific shadow and border tokens | Shadow alone may disappear |
| Lower motion | `prefers-reduced-motion` | Preserve clear state feedback |
| Performance issue | Browser profiler and smaller effect area | Do not guess or add `will-change` blindly |

## Build Challenge — Editorial Effects Card System

Build a responsive collection of editorial cards that uses filters, overlays, shadows, and accessible interaction states. Treat this as a production component, not a one-off visual demo.

### Requirements
1. Use semantic HTML with a list of cards and meaningful headings.
2. Each card includes an image with appropriate alternative text when informative.
3. Decorative images use empty alternative text when they add no unique information.
4. Create a stable base surface and border before adding shadows.
5. Define at least three purpose-named shadow tokens.
6. Define at least two image-treatment tokens.
7. Apply a restrained default image treatment to one card type.
8. Restore the image treatment on hover.
9. Provide an equivalent keyboard-focus state using `:focus-within` or a targeted focus selector.
10. Add a visible `:focus-visible` outline with sufficient offset.
11. Ensure the focus outline is not clipped by `overflow`.
12. Add a gradient overlay behind text on at least one image card.
13. Verify the text contrast at narrow and wide viewport crops.
14. Keep content above decorative pseudo-elements using deliberate stacking.
15. Use `isolation: isolate` only where it solves a defined compositing requirement.
16. Include one `drop-shadow()` example for transparent artwork or an SVG mark.
17. Include one `box-shadow` example for a rectangular surface.
18. Include a layered shadow with a clear contact and ambient role.
19. Include a theme-aware shadow or border token.
20. Include a decorative blur/glow layer that does not intercept pointer input.
21. Do not apply a filter to a parent that contains text or controls unless that is intentional.
22. Avoid using blend modes for essential text or status labels.
23. If using `backdrop-filter`, provide a readable fallback with `@supports`.
24. Respect `prefers-reduced-motion` for transitions or animations.
25. Animate only properties that need animation; do not use `transition: all`.
26. Keep large blur regions bounded and avoid unnecessary full-screen blur.
27. Test the cards using keyboard navigation only.
28. Test at a narrow mobile width and a wide desktop width.
29. Inspect computed styles and stacking contexts when an effect appears in the wrong order.
30. Test the interface with effects disabled or unsupported and confirm the content remains understandable.
31. Check that status or selection is not conveyed through color alone.
32. Verify text remains readable over all selected images and crops.
33. Confirm the card does not depend on hover for access to essential information.
34. Document the intent of each effect token.
35. Record at least three deliberate trade-offs: visual fidelity versus cost, overlay strength versus image visibility, and shadow subtlety versus surface separation.

### Acceptance Checklist
- [ ] The visual hierarchy is understandable without excessive effects.
- [ ] Text and controls remain sharp and readable.
- [ ] Image filters affect only intended elements.
- [ ] Shadows communicate depth consistently.
- [ ] Decorative layers do not block interactions.
- [ ] Keyboard focus is obvious and not clipped.
- [ ] Motion preferences are respected.
- [ ] Fallbacks preserve meaning and usability.
- [ ] Effects are centralized where they are reusable.
- [ ] The component has been tested at multiple viewport sizes.
- [ ] The code contains no unexplained giant `z-index` values.
- [ ] Performance decisions are based on profiling rather than assumptions.

## Final Rule
**Every effect must have an owner, a purpose, a fallback, and a test.** If an effect makes the interface less readable, less accessible, harder to debug, or noticeably slower, simplify it before adding another effect.
