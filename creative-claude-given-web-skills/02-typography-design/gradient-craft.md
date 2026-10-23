# Gradient Craft

> A production-oriented skill for designing, implementing, debugging, and validating gradients as part of a coherent interface visual system.

## Why This Matters

A gradient is a controlled transition between colors, but in an interface it also communicates depth, emphasis, movement, atmosphere, and hierarchy. A well-built gradient can direct attention toward a call to action, add dimensionality to a hero, or make a chart series easier to distinguish. A poorly chosen gradient can reduce text contrast, create muddy color transitions, band on certain displays, distract from content, or make a design feel visually inconsistent.

Gradient craft is not about adding color everywhere. It is about choosing the correct gradient type, stops, direction, scale, and contrast for a specific purpose. The strongest systems define reusable gradient tokens, keep text and controls readable over gradient surfaces, and use fallbacks for older browsers or contexts where gradients are unavailable.

This skill covers linear, radial, conic, and layered gradients; transparent color overlays; gradient text; borders and masks; design tokens; responsive behavior; accessibility; browser rendering; and practical debugging. It also explains when a solid color is better than a gradient.

## Operating Principles

- Give every gradient a clear role: background atmosphere, surface depth, data encoding, emphasis, or decoration.
- Define color stops intentionally instead of relying on browser defaults.
- Validate text contrast at every point where text overlaps the gradient.
- Prefer a small, named gradient system over many unrelated declarations.
- Use transparent overlays when an image needs tonal control, not to hide a poor source image.
- Keep gradients behind content and controls in the stacking order.
- Test at multiple viewport sizes and on representative displays.
- Respect `prefers-reduced-motion` when gradients animate.
- Keep a solid-color fallback for critical surfaces.
- Inspect the rendered result in DevTools when a gradient looks different from its source declaration.

## Core Concepts

### 1. Understand Linear Gradients

A linear gradient interpolates between color stops along a line. The direction may be specified as an angle or a keyword direction. In CSS, `0deg` points upward and angles increase clockwise, so `90deg` points right. This convention can surprise designers who expect zero degrees to point right.

```css
.hero {
  background: linear-gradient(
    135deg,
    #111827 0%,
    #312e81 52%,
    #6d28d9 100%
  );
}
```

Use an angle when the direction is part of the visual composition. Use keywords such as `to bottom right` when the intended direction matters more than the exact angle. Test the gradient after the container's aspect ratio changes: the gradient line's geometry depends on the box size, so the visible color distribution may shift across layouts.

### 2. Define Color Stops With Intent

A color stop defines where a color appears along the gradient line. Stops do not need to be evenly spaced. Moving a stop closer to the start can create a longer transition from the first color, while placing two stops near each other can create a sharper band.

```css
.button-primary {
  background: linear-gradient(
    110deg,
    #155eef 0%,
    #315efb 38%,
    #7c3aed 100%
  );
}
```

Avoid adding extra stops simply to make a gradient appear more complex. Each stop should improve the transition, preserve a brand relationship, or solve a visual issue. When colors look muddy, first inspect their hue and lightness relationships before adding more intermediate colors.

### 3. Choose a Gradient Type for the Job

Linear gradients work well for directional emphasis and broad surfaces. Radial gradients create a center or focal glow. Conic gradients transition around a central point and can support rings, gauges, and decorative color wheels. Multiple gradients can be layered, but each layer should have a defined purpose.

```css
.visual {
  background:
    radial-gradient(circle at 20% 15%, rgb(124 58 237 / 28%), transparent 42%),
    linear-gradient(135deg, #101323, #202b4a);
}
```

Start with one layer. Add another only if it solves a specific compositional problem. Complex stacks are harder to tune responsively and may create unexpected color mixtures where layers overlap.

### 4. Use Radial Gradients to Create a Focal Area

A radial gradient radiates outward from a center point. Its size, shape, and position control where the highlight appears and how quickly it fades. A radial glow is useful behind a product illustration or hero headline when it adds focus without competing with content.

```css
.hero-art {
  background:
    radial-gradient(
      ellipse at 72% 30%,
      rgb(96 165 250 / 34%) 0%,
      rgb(96 165 250 / 0%) 55%
    ),
    #0b1020;
}
```

Prefer a subtle glow when the hero contains important text. Place the focal point away from the text if the glow would reduce contrast. Inspect the design at narrow widths because a fixed percentage position may place the brightest region behind a heading on mobile.

### 5. Use Conic Gradients for Circular Data and Accents

A conic gradient transitions around a center point. It can create decorative rings, color wheels, or progress-like visuals. For meaningful data, ensure the visualization has a semantic label and a non-color cue where needed. A decorative conic gradient should not be the only source of information.

```css
.color-wheel {
  width: 12rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(
    #ef4444,
    #f59e0b,
    #84cc16,
    #06b6d4,
    #6366f1,
    #ef4444
  );
}
```

A gradient ring can be made by layering a solid inner circle above the conic gradient or by using a mask where support and complexity are appropriate. Keep the implementation understandable and provide a textual equivalent if the visual conveys information.

### 6. Build a Named Gradient Token System

Tokens make a gradient reusable and easier to maintain. Name them by purpose rather than by the colors alone. A semantic name such as `--gradient-hero` can change as the brand evolves without requiring every consumer to be edited.

```css
:root {
  --gradient-hero: linear-gradient(135deg, #111827, #3730a3 55%, #7c3aed);
  --gradient-accent: linear-gradient(100deg, #0ea5e9, #6366f1);
  --gradient-warm: linear-gradient(120deg, #fb7185, #f97316);
  --gradient-overlay: linear-gradient(180deg, transparent, rgb(0 0 0 / 72%));
}

.hero {
  background: var(--gradient-hero);
}
```

Keep the token list small enough to understand. If two tokens look nearly identical and serve the same role, consolidate them. If they look similar but are used for different semantic purposes, document the difference.

### 7. Use Layered Gradients Without Losing Control

Multiple background layers are painted in order: the first listed background image is closest to the user. This means the top layer may obscure or tint lower layers. Use explicit sizing and positioning when a layer is intended to sit in a specific region.

```css
.dashboard-header {
  background:
    radial-gradient(circle at 90% 10%, rgb(59 130 246 / 22%), transparent 35%),
    radial-gradient(circle at 15% 100%, rgb(168 85 247 / 18%), transparent 45%),
    linear-gradient(135deg, #111827, #172554);
  background-repeat: no-repeat;
}
```

Layered gradients are useful for subtle depth, but they can become noisy. Start by setting every layer to a low opacity. Temporarily remove layers one at a time in DevTools to understand their contribution. Avoid stacking many glows just because the CSS syntax allows it.

### 8. Create Image Overlays for Readable Text

A gradient overlay can improve readability when text sits over an image. It should preserve the image's subject and add enough contrast where text appears. A top-to-bottom overlay may be appropriate for a caption near the bottom; a side-to-side overlay may work for text aligned to one edge.

```css
.image-hero {
  background:
    linear-gradient(90deg, rgb(3 7 18 / 88%), rgb(3 7 18 / 8%) 82%),
    url("/images/mountain.jpg") center / cover no-repeat;
  color: white;
}
```

Do not assume a gradient overlay guarantees readable text. Image content can vary from one crop to another. Test actual assets, use a sufficiently strong surface behind text if necessary, and measure contrast over the brightest and darkest areas where text may land.

### 9. Use Transparent Stops Correctly

Transparent color stops affect the result differently depending on how the transparent color is specified. Using `transparent` can mean transparent black, which may cause unexpected dark or gray fringes during interpolation. When fading a color out, use the same color with zero alpha.

```css
.glow {
  background: radial-gradient(
    circle,
    rgb(59 130 246 / 55%) 0%,
    rgb(59 130 246 / 0%) 70%
  );
}
```

The modern color syntax `rgb(59 130 246 / 0%)` makes the intended hue explicit. If a fade looks muddy, inspect the transparent endpoint and test against the actual background color.

### 10. Make Gradient Text Accessible and Robust

Gradient text can be expressive for short headings, but it can fail when background clipping is unsupported or when colors do not provide enough contrast. Always define a readable solid color before applying the gradient effect.

```css
.gradient-heading {
  color: #7c3aed;
  background: linear-gradient(90deg, #38bdf8, #a78bfa, #fb7185);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

This pattern needs visual testing in target browsers and accessibility review. If the gradient becomes transparent and the background clipping fails, the fallback color may not behave as expected in every browser because of `-webkit-text-fill-color`. For critical text, prefer a normal text color or use a carefully tested fallback strategy. Do not apply gradient text to long paragraphs or small labels where legibility is already demanding.

### 11. Build Gradient Borders With a Clear Fallback

A gradient border can be created with layered backgrounds and transparent borders, or with a pseudo-element. Layered backgrounds are compact but require careful use of `background-clip`. Pseudo-elements provide more control when the border needs special effects.

```css
.gradient-border {
  border: 1px solid transparent;
  border-radius: 1rem;
  background:
    linear-gradient(#111827, #111827) padding-box,
    linear-gradient(120deg, #38bdf8, #8b5cf6, #fb7185) border-box;
}
```

This approach keeps the inner surface opaque while the outer border displays the gradient. Confirm that the inner fill and outer border align at all corner sizes. For simpler interfaces, a solid border may be more readable and easier to maintain.

### 12. Use Masks for More Advanced Effects

CSS masks can reveal or hide parts of an element based on an alpha or luminance mask. A gradient mask can fade an image, edge, or decorative layer. Masks can be powerful but add complexity and may need a fallback for older or less capable browsers.

```css
.fade-edge {
  -webkit-mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 65%, transparent 100%);
}
```

Use masks for decorative content that can safely degrade. Do not mask essential text, controls, or required information. Test the actual target browsers and include a fallback state that leaves the content readable if masking is unavailable.

### 13. Control Gradient Direction Across Responsive Layouts

A diagonal gradient can look balanced on a wide desktop panel and awkward on a tall mobile panel. Responsive changes can switch the direction or reposition a radial focal point. Make the change only when the composition truly changes.

```css
.hero {
  background: linear-gradient(110deg, #111827, #3730a3);
}

@media (max-width: 42rem) {
  .hero {
    background: linear-gradient(180deg, #111827, #3730a3);
  }
}
```

Avoid changing direction at every breakpoint. Use a few meaningful layout states and inspect intermediate widths. If the gradient is purely decorative, it should not become a distraction when the content reflows.

### 14. Avoid Gradients That Harm Contrast

Text contrast must be checked against the actual background behind each character. A gradient that begins dark and ends light may support white text on one side and fail on the other. A single contrast measurement taken at one point is not sufficient when the background varies.

```css
.hero-title {
  color: white;
  text-shadow: 0 1px 2px rgb(0 0 0 / 55%);
}
```

A shadow can help slightly, but it is not a substitute for a suitable background. Use a stronger overlay or a solid text surface if needed. For essential controls, keep their foreground and background relationship stable and validate hover, disabled, and focus states too.

### 15. Use Gradients in Data Visualization Carefully

Gradients can be used in charts, progress indicators, or area fills, but do not use them to imply values that the data does not contain. If the gradient represents a continuous quantity, document the mapping. If it is purely decorative, keep the actual data labels and legend clear.

```css
.progress-track {
  height: 0.625rem;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.progress-fill {
  width: 68%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0ea5e9, #6366f1);
}
```

The progress value must also be exposed semantically when it represents meaningful progress, for example through an appropriately labeled progress element or `role="progressbar"` with current and maximum values. Do not rely on the gradient color alone to communicate completion.

### 16. Prevent Banding and Muddy Transitions

Banding appears as visible steps between colors instead of a smooth transition. It can depend on color choice, display characteristics, image compression, and rendering. Very subtle gradients over large areas are especially likely to reveal banding on some displays. A carefully chosen intermediate stop or a subtle texture may help, but first test whether the gradient is needed at all.

```css
.large-background {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    #1e1b4b 48%,
    #312e81 100%
  );
}
```

Do not add a noisy overlay blindly. Texture can reduce the clean quality of the design and may increase asset or rendering complexity. Compare on representative displays and inspect the actual output rather than assuming all users will see the same transition.

### 17. Animate Gradients With Restraint

Animating `background-position`, background size, or layered colors can create movement, but large gradient animations may be distracting and can be expensive depending on the effect. Use motion to communicate a meaningful state, not as continuous decoration by default.

```css
.animated-surface {
  background: linear-gradient(110deg, #1d4ed8, #7c3aed, #db2777);
  background-size: 200% 200%;
  animation: gradient-drift 8s ease-in-out infinite alternate;
}

@keyframes gradient-drift {
  from { background-position: 0% 50%; }
  to { background-position: 100% 50%; }
}

@media (prefers-reduced-motion: reduce) {
  .animated-surface {
    animation: none;
    background-position: 50% 50%;
  }
}
```

Avoid moving gradients behind long text or constantly animating high-contrast colors. Honor `prefers-reduced-motion` and provide a stable state that still looks intentional.

### 18. Understand the Rendering and Performance Trade-Offs

A simple static gradient is usually inexpensive and avoids downloading an image asset. Complex stacks, large animated gradients, filters, masks, and blend modes can increase rendering work. Performance depends on the browser, device, layer count, animation properties, and page complexity.

```css
.static-ambient {
  background:
    radial-gradient(circle at 80% 20%, rgb(99 102 241 / 18%), transparent 38%),
    #0f172a;
}
```

Use browser performance tools to inspect long frames and repaint behavior if the gradient animates. Do not assume `will-change` is a performance cure. Prefer static gradients for most interface surfaces, and keep motion subtle and purposeful.

### 19. Keep Background Layers Behind Content

Pseudo-elements are useful when the gradient should be independently positioned. Ensure that the decorative layer does not cover links, buttons, or text. Use a predictable stacking context and avoid arbitrary `z-index` values scattered across the page.

```css
.hero {
  position: relative;
  isolation: isolate;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(circle at 80% 20%, rgb(99 102 241 / 25%), transparent 40%);
}
```

The exact stacking strategy depends on the surrounding layout. Inspect it in DevTools when a pseudo-element appears above content or disappears behind another surface. `pointer-events: none` prevents a decorative layer from intercepting pointer interaction, but it does not solve every stacking issue.

### 20. Debug Gradients in DevTools

When a gradient does not appear as expected, inspect the computed `background-image`, `background-color`, size, position, and stacking context. A later shorthand may reset a previously declared layer. A background image can also cover the fallback color while rendering transparently in parts.

```js
function inspectBackground(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`No element found: ${selector}`);
    return;
  }

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  console.table({
    backgroundImage: style.backgroundImage,
    backgroundColor: style.backgroundColor,
    backgroundSize: style.backgroundSize,
    backgroundPosition: style.backgroundPosition,
    backgroundRepeat: style.backgroundRepeat,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    opacity: style.opacity,
    position: style.position,
    zIndex: style.zIndex
  });
}

inspectBackground(".hero");
```

Debug sequence:
1. Select the element that should display the gradient.
2. Inspect computed `background-image` and `background-color`.
3. Disable layers one by one in the Styles panel.
4. Check whether a shorthand declaration resets earlier values.
5. Inspect the element's dimensions and background positioning.
6. Check pseudo-elements and stacking contexts.
7. Test the gradient against the real content and asset crop.
8. Recheck contrast and reduced-motion behavior after the fix.

### 21. Provide Solid Fallbacks for Critical UI

A gradient is a visual enhancement. The core interface should remain usable if the gradient fails, is unsupported, or is overridden by a user stylesheet. Declare a solid background first, then the gradient.

```css
.callout {
  background-color: #1d4ed8;
  background-image: linear-gradient(110deg, #1d4ed8, #6d28d9);
  color: white;
}
```

If the gradient is not available, the solid color remains. The fallback should have enough contrast for the content. For critical status indicators, use a text label or icon in addition to color and do not make the meaning depend on the gradient's exact hue.

### 22. Respect Themes and User Preferences

A gradient token may need a different value in dark mode, light mode, or a high-contrast theme. Keep the role stable even if the color stops change. If the design uses system color-scheme preferences, verify that the text contrast and decorative intensity remain appropriate.

```css
:root {
  --gradient-panel: linear-gradient(135deg, #eef2ff, #dbeafe);
  --panel-text: #172554;
}

@media (prefers-color-scheme: dark) {
  :root {
    --gradient-panel: linear-gradient(135deg, #111827, #1e1b4b);
    --panel-text: #f8fafc;
  }
}

.panel {
  color: var(--panel-text);
  background: var(--gradient-panel);
}
```

Do not assume that switching the gradient colors automatically solves contrast. Test every theme with real content, focus indicators, disabled states, and any image overlays.

### 23. Avoid Gradient Overuse

When every card, button, badge, border, and background has a gradient, the visual hierarchy collapses. Reserve gradients for the few places where they help focus, explain a state, or support the brand. Use solid surfaces for routine content and controls when they are clearer.

```css
.page {
  background: #f8fafc;
}

.feature-card {
  background: var(--gradient-accent);
  color: white;
}

.standard-card {
  background: white;
  border: 1px solid #e2e8f0;
}
```

A strong system usually combines gradients with flat surfaces. If the design feels noisy, remove layers before adding more. Check whether the gradient is helping the content or simply competing for attention.

### 24. Validate the Full Component, Not Just the Swatch

A gradient swatch does not show how the effect behaves behind actual text, icons, images, or controls. Review the full component in its page context, at multiple widths and states. Include semantic HTML and accessible labels when the gradient is used in a control or data visualization.

```html
<main>
  <section class="hero" aria-labelledby="hero-title">
    <header>
      <p>Product update</p>
      <h1 id="hero-title">A clearer way to work</h1>
    </header>
    <p>Bring the important details into one focused workspace.</p>
    <a class="hero__action" href="/learn-more">Learn more</a>
  </section>
</main>
```

The gradient should support the heading and action, not make them harder to find. Check the focus state of the link, text contrast over the brightest and darkest regions, and the mobile crop.

## Named Patterns

### Pattern 1: Directional Hero Gradient

**What it does:** Creates a controlled directional transition behind a hero section.

**When to use it:** Landing pages and product introductions where the gradient supports the visual hierarchy.

```css
.hero {
  background: linear-gradient(135deg, #111827 0%, #312e81 58%, #6d28d9 100%);
  color: white;
}
```

### Pattern 2: Ambient Radial Glow

**What it does:** Places a soft glow behind a focal visual.

**When to use it:** Product illustrations, dashboard headers, and restrained atmospheric backgrounds.

```css
.ambient {
  background:
    radial-gradient(circle at 75% 20%, rgb(96 165 250 / 25%), transparent 42%),
    #0f172a;
}
```

### Pattern 3: Image Readability Overlay

**What it does:** Adds a dark gradient behind overlaid text while retaining the image.

**When to use it:** Editorial cards and image heroes with text aligned to one side or bottom edge.

```css
.image-panel {
  background:
    linear-gradient(to top, rgb(0 0 0 / 82%), transparent 68%),
    url("/images/editorial.jpg") center / cover no-repeat;
  color: white;
}
```

### Pattern 4: Gradient Border Surface

**What it does:** Uses two background layers to create a gradient border.

**When to use it:** Featured cards or focused surfaces that need a colorful outline without a separate image asset.

```css
.gradient-outline {
  border: 1px solid transparent;
  border-radius: 1rem;
  background:
    linear-gradient(#fff, #fff) padding-box,
    linear-gradient(110deg, #0ea5e9, #8b5cf6) border-box;
}
```

### Pattern 5: Progress Fill

**What it does:** Adds subtle directional color to a progress fill.

**When to use it:** A progress indicator where the numeric value is also exposed accessibly.

```css
.progress-fill {
  width: 68%;
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9, #6366f1);
  border-radius: inherit;
}
```

### Pattern 6: Gradient Text Accent

**What it does:** Applies a gradient to a short heading or emphasized phrase.

**When to use it:** Decorative display typography after fallback and contrast testing.

```css
.gradient-text {
  color: #7c3aed;
  background: linear-gradient(90deg, #38bdf8, #a78bfa);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Pattern 7: Responsive Gradient Direction

**What it does:** Changes a wide diagonal transition into a vertical transition on narrow screens.

**When to use it:** Hero compositions whose content order changes substantially on mobile.

```css
.hero {
  background: linear-gradient(110deg, #111827, #3730a3);
}

@media (max-width: 42rem) {
  .hero {
    background: linear-gradient(180deg, #111827, #3730a3);
  }
}
```

### Pattern 8: Reduced-Motion Gradient

**What it does:** Keeps an animated gradient from moving when the user requests reduced motion.

**When to use it:** A rare animated decorative surface where movement is not essential to understanding the interface.

```css
.motion-gradient {
  background: linear-gradient(110deg, #1d4ed8, #7c3aed, #db2777);
  background-size: 200% 200%;
  animation: drift 8s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .motion-gradient {
    animation: none;
  }
}
```

### Pattern 9: Solid Fallback Plus Gradient

**What it does:** Keeps the surface readable if the gradient is not rendered.

**When to use it:** Buttons, callouts, and other important interface surfaces.

```css
.callout {
  background-color: #1d4ed8;
  background-image: linear-gradient(110deg, #1d4ed8, #6d28d9);
  color: white;
}
```

## Before → After

### Before: Decorative Complexity Without Contrast Control

```css
.hero {
  background:
    radial-gradient(circle at 15% 10%, #a855f7, transparent),
    linear-gradient(135deg, #111827, #e879f9);
}

.hero h1 {
  color: white;
}

.hero a {
  outline: none;
}
```

Problems:
- The radial gradient has no deliberate size or opacity.
- The light endpoint can make white text difficult to read.
- The link removes focus styling without replacement.
- The gradient has no solid fallback or responsive review.

### After: Controlled Layers, Contrast, and Focus

```css
.hero {
  background-color: #111827;
  background-image:
    radial-gradient(circle at 18% 12%, rgb(124 58 237 / 22%), transparent 42%),
    linear-gradient(135deg, #111827, #312e81 68%, #4338ca);
  color: white;
}

.hero a:focus-visible {
  outline: 3px solid #f8fafc;
  outline-offset: 4px;
}
```

The revised version uses a fallback, restrained glow, intentional stops, and a visible keyboard focus indicator. It still needs contrast testing against the actual text positions and target devices.

## Common Mistakes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Adding gradients to every surface | A gradient is treated as a universal polish effect | Reserve gradients for clear hierarchy or atmosphere; use flat surfaces for routine content |
| Assuming `0deg` points right | CSS angle conventions differ from some design tools | Remember `0deg` points upward and `90deg` points right; verify with a small test swatch |
| Using too many stops | Extra colors are added to fix a transition without diagnosing the palette | Start with two or three stops and add only when the transition has a clear purpose |
| Using `transparent` for a colored fade | The transparent endpoint may interpolate as transparent black | Use the same hue with zero alpha, such as `rgb(59 130 246 / 0%)` |
| Ignoring text contrast | The gradient is judged without real text overlay | Test contrast at the lightest and darkest text regions or add a stable text surface |
| Relying on a text shadow alone | A shadow is mistaken for a reliable contrast solution | Adjust the background or overlay and measure contrast before adding a subtle shadow |
| Creating muddy layered glows | Several semi-transparent colors mix over a dark background | Disable layers one by one in DevTools and reduce the stack to purposeful layers |
| Using an image overlay that hides the subject | The overlay is tuned for text but not the crop | Reposition the gradient and test real assets at responsive aspect ratios |
| Using gradient text for small labels | The decorative effect is prioritized over readability | Reserve gradient text for short display text and use a solid fallback color |
| Forgetting a solid fallback | The gradient is the only background declaration | Set `background-color` before `background-image` and ensure the fallback has adequate contrast |
| Animating a gradient continuously | Motion is added for novelty rather than communication | Prefer static gradients; if animation is needed, keep it restrained and honor `prefers-reduced-motion` |
| Assuming all browsers render experimental features | A local preview is mistaken for universal support | Check target browser support and provide a fallback |
| Letting decorative layers block clicks | A pseudo-element is placed above interactive content | Use a deliberate stacking context and `pointer-events: none` on decorative layers |
| Using a gradient as the only data cue | Color is mistaken for an accessible data label | Add labels, values, patterns, or semantics that communicate the data independently |
| Masking essential content | A fade effect is applied to a full content region | Use masks only for decorative content or preserve a fully readable fallback |
| Adding `will-change` without evidence | It is assumed to improve every animation | Profile the actual interaction and only use performance hints when justified |
| Ignoring mobile composition | A desktop gradient is copied to a narrow screen | Reposition focal points or change direction at meaningful breakpoints |
| Overlooking reduced motion | Animation is reviewed only by users who tolerate motion | Add a `prefers-reduced-motion` rule and test the stable state |
| Using gradient colors that clash | Stops are chosen independently without checking hue and lightness | Test the palette as a complete transition and remove stops that muddy the result |
| Skipping computed-style inspection | The authored declaration is assumed to be active | Inspect `background-image`, shorthand resets, dimensions, and stacking in DevTools |

## Accessibility and Semantics Checklist

- Use semantic HTML such as `main`, `section`, `header`, `nav`, `article`, `aside`, `figure`, and `footer` to structure content.
- Use actual `button`, `a`, `input`, and `form` elements for their intended behaviors.
- Every `input` needs an associated `label`.
- Use `aria-label` only when a suitable visible label is absent or insufficient.
- Use `aria-describedby` to connect a control with relevant help or error text.
- Do not use `role` attributes that repeat native semantics without a reason.
- Do not rely on hue alone to communicate a state or chart value.
- Check text contrast at every location where text overlaps a gradient.
- Keep focus visible with `:focus-visible`.
- Ensure decorative pseudo-elements do not intercept pointer events or obscure content.
- Use useful `alt` text for meaningful images and empty `alt=""` for purely decorative images.
- Do not mask or fade required text until it becomes unreadable.
- Respect `prefers-reduced-motion` for animated gradients.
- Test with keyboard navigation, screen readers, zoom, and high-contrast settings.
- Avoid unnecessary `tabindex` values that create confusing keyboard order.

```css
.action:focus-visible {
  outline: 3px solid #f8fafc;
  outline-offset: 3px;
  box-shadow: 0 0 0 5px rgb(15 23 42 / 75%);
}
```

```css
.animated-background {
  animation: hue-drift 12s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .animated-background {
    animation: none;
    background-position: 50% 50%;
  }
}
```

## Build Requirements

1. Define at least four semantic gradient tokens.
2. Include one linear gradient with intentional stops and direction.
3. Include one radial gradient with a deliberate focal point.
4. Include one layered gradient and document the purpose of each layer.
5. Include a gradient overlay for image text, tested against real imagery.
6. Provide a solid-color fallback for every critical gradient surface.
7. Verify contrast for text and controls over gradient backgrounds.
8. Add `:focus-visible` styling for interactive elements.
9. Add `prefers-reduced-motion` handling if any gradient is animated.
10. Test at narrow, medium, and wide viewports.
11. Inspect computed background styles in DevTools.
12. Include one gradient-border or gradient-text pattern with a fallback.
13. Ensure decorative layers do not intercept pointer input.
14. Add semantic labels if the gradient represents progress or data.
15. Document when a flat color is preferable to a gradient.
16. Test a theme variant if the product supports light and dark modes.
17. Include a debugging helper that reports computed styles.
18. Verify all meaningful images have appropriate `alt` text.

## Build Challenge: The Hero That Fails on Mobile

A landing page hero looks polished on desktop. White text is readable over a dark left side, and a radial glow creates depth behind an illustration. On mobile, the content stacks vertically and the brightest part of the glow moves behind the heading. A button loses contrast, and the decorative pseudo-element occasionally intercepts taps.

Your task is to repair the composition and behavior rather than removing the gradient entirely.

Acceptance conditions:
- Preserve the hero's visual hierarchy on desktop.
- Reposition or simplify the gradient on narrow screens.
- Ensure the heading, body text, and action meet contrast requirements.
- Keep decorative layers from intercepting pointer input.
- Keep keyboard focus visible.
- Honor `prefers-reduced-motion` if the hero is animated.
- Provide a solid background fallback.
- Inspect computed `background-image`, `background-position`, and pseudo-element stacking in DevTools.
- Test at narrow, medium, and wide widths.

Starter markup:

```html
<main>
  <section class="hero" aria-labelledby="hero-heading">
    <div class="hero__content">
      <p class="hero__eyebrow">Introducing</p>
      <h1 id="hero-heading">A calmer workspace</h1>
      <p>Bring your most important work into focus.</p>
      <a class="hero__action" href="/features">Explore features</a>
    </div>
    <div class="hero__art" aria-hidden="true"></div>
  </section>
</main>
```

```css
.hero {
  position: relative;
  isolation: isolate;
  color: white;
  background-color: #111827;
  background-image:
    radial-gradient(circle at 78% 20%, rgb(147 51 234 / 35%), transparent 40%),
    linear-gradient(120deg, #111827, #312e81);
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(circle at 85% 20%, rgb(59 130 246 / 15%), transparent 35%);
}

.hero__action:focus-visible {
  outline: 3px solid white;
  outline-offset: 4px;
}

@media (max-width: 42rem) {
  .hero {
    background-image:
      radial-gradient(circle at 90% 90%, rgb(147 51 234 / 16%), transparent 35%),
      linear-gradient(180deg, #111827, #1e1b4b);
  }
}
```

The code is a starting point, not a final guarantee of contrast. Validate the actual rendered text positions and inspect whether any other pseudo-element or overlay is above the action. A decorative layer should be `pointer-events: none`; stacking context and `z-index` still need to be checked in the actual page.

## Debugging Workflow

1. Reproduce the exact viewport and state.
2. Select the element that should display the gradient.
3. Inspect computed `background-image`, `background-color`, `background-size`, and `background-position`.
4. Check whether a shorthand `background` declaration resets previous layers.
5. Toggle one gradient layer at a time in DevTools.
6. Inspect the element's dimensions and responsive layout.
7. Inspect pseudo-elements, stacking contexts, and `pointer-events`.
8. Test contrast against real content and image crops.
9. Check focus, hover, disabled, and reduced-motion states.
10. Record the root cause and avoid adding another layer unless it solves the problem.

```js
function inspectGradient(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return;
  }

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  console.table({
    backgroundImage: style.backgroundImage,
    backgroundColor: style.backgroundColor,
    backgroundSize: style.backgroundSize,
    backgroundPosition: style.backgroundPosition,
    backgroundBlendMode: style.backgroundBlendMode,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    position: style.position,
    zIndex: style.zIndex,
    opacity: style.opacity
  });
}

inspectGradient(".hero");
```

Use this helper only for diagnosis. It cannot measure contrast or determine whether the gradient is visually appropriate. Combine computed-style inspection with manual review, contrast measurement, and keyboard testing.

## Mental Models

1. **A gradient has a job.** It should establish direction, depth, focus, or a meaningful data mapping.
2. **Stops are composition controls.** Their positions determine where transitions occur, not only which colors are present.
3. **The container changes the result.** A gradient can look different when the element's aspect ratio changes.
4. **Transparent endpoints have color behavior.** Use a transparent version of the intended hue when fading that color out.
5. **Layer order matters.** The first listed background image is painted above later background layers.
6. **Contrast must be checked where text lives.** A gradient's average color is not enough.
7. **A fallback protects the interface.** The core content should work without the decorative effect.
8. **Motion should be optional.** Reduced-motion preferences need a stable and attractive alternative.
9. **Decorative layers should not block interaction.** Stacking and pointer behavior are separate concerns.
10. **Simple often looks more intentional.** A few purposeful layers usually outperform a stack of unrelated glows.
11. **Computed styles reveal the active result.** Source declarations alone do not show the complete cascade.
12. **Data needs more than color.** Meaningful gradient visualization requires labels or another accessible cue.

## Quick Reference

| Situation | Recommended approach | Notes |
|---|---|---|
| Directional hero | `linear-gradient()` | Test angle and responsive composition |
| Soft focal glow | `radial-gradient()` | Position away from important text |
| Circular color ring | `conic-gradient()` | Add labels if it represents data |
| Image text overlay | Layered linear gradient and image | Test real crops and contrast |
| Fade a blue glow | Blue with zero alpha | Avoid unintended transparent-black interpolation |
| Reusable system | Semantic custom properties | Keep token count small |
| Gradient border | Layered backgrounds with `padding-box` and `border-box` | Check inner fill and corners |
| Gradient text | Background clipping with solid fallback | Use sparingly for short display text |
| Image fade | CSS mask | Provide fallback and avoid essential content |
| Animated gradient | Restrained keyframes | Honor `prefers-reduced-motion` |
| Important button | Solid fallback then gradient | Ensure contrast and focus visibility |
| Progress indicator | Gradient fill plus semantic value | Do not rely on color alone |
| Muddy transition | Reduce layers and inspect stops | Check hue/lightness relationships |
| Unexpected direction | Check CSS angle convention | `0deg` points upward |
| Mobile contrast failure | Change focal point or direction | Test intermediate widths |
| Layer intercepts clicks | `pointer-events: none` on decoration | Verify stacking context |
| Theme variant | Semantic token override | Recheck contrast in each theme |
| Browser rendering issue | Inspect computed background and dimensions | Test target browsers |
| Banding | Test colors and displays; consider subtle texture only if useful | Do not add noise blindly |
| Debugging | `getComputedStyle()` and DevTools | Inspect layers, position, and cascade |

## Gotcha Callouts

> **Gotcha 1 — CSS gradient angles may surprise you.** `0deg` points upward; `90deg` points right. Verify the direction with a test swatch.

> **Gotcha 2 — `transparent` can produce a muddy fade.** Use the intended hue with zero alpha when fading a colored glow out.

> **Gotcha 3 — A gradient overlay does not guarantee readable text.** The actual image crop and the location of each glyph matter. Test the real asset and add a stable surface when needed.

> **Gotcha 4 — The first background layer is on top.** If a glow hides another layer, inspect declaration order before changing colors.

> **Gotcha 5 — `z-index` is not the only stacking rule.** A decorative pseudo-element can cover controls depending on stacking contexts. Inspect the actual painted order and set `pointer-events: none` when appropriate.

> **Gotcha 6 — Gradient text needs a fallback.** Background clipping and transparent text fill must be tested in target browsers; do not apply the effect to essential small text without validation.

> **Gotcha 7 — Animation is not automatically harmless.** Moving color fields can distract or trigger discomfort. Respect `prefers-reduced-motion` and make the static version look complete.

> **Gotcha 8 — More layers do not always create more depth.** Multiple glows often mix into muddy color and make the page feel noisy. Remove layers before adding new ones.

## Definition of Done

- [ ] Gradients have clear roles and are represented by a small set of semantic tokens.
- [ ] Each gradient has intentional type, direction, stop positions, and layer order.
- [ ] Critical surfaces include solid-color fallbacks.
- [ ] Text and controls remain readable across every part of a gradient.
- [ ] Real image crops have been tested with overlays.
- [ ] Decorative layers do not intercept pointer input or cover controls.
- [ ] Keyboard focus remains visible with `:focus-visible`.
- [ ] Animated gradients honor `prefers-reduced-motion`.
- [ ] The design has been reviewed at narrow, medium, and wide widths.
- [ ] Meaningful data has labels or semantics beyond color.
- [ ] Computed background styles and stacking have been inspected in DevTools.
- [ ] Theme variants preserve contrast and visual hierarchy.
- [ ] The build challenge passes on desktop and mobile.
- [ ] A flat color is used where a gradient adds noise rather than value.


## Supplemental Implementation Notes

### Gradient Token Governance

Treat gradient tokens as design-system assets, not as arbitrary snippets copied between components. A token should have a name, a purpose, and known consumers. Avoid naming every token after its current hex colors because color stops may change during a rebrand. Prefer role-based names and document whether a gradient is decorative, interactive, or data-bearing.

```css
:root {
  --gradient-brand-hero: linear-gradient(135deg, #111827, #312e81 58%, #6d28d9);
  --gradient-brand-action: linear-gradient(100deg, #0ea5e9, #6366f1);
  --gradient-overlay-bottom: linear-gradient(to top, rgb(0 0 0 / 82%), transparent 68%);
  --gradient-ambient-blue: radial-gradient(circle at 75% 20%, rgb(96 165 250 / 25%), transparent 42%);
}
```

During review, ask whether a new token represents a distinct role or duplicates an existing one. If several components use almost the same transition for the same purpose, consolidate it. If two gradients look similar but carry different meanings, keep their names distinct so future edits do not accidentally change a critical state.

### Background Layer Order

Multiple background images are written in a comma-separated list. The first image is painted closest to the viewer, followed by later layers, with `background-color` beneath the background images. This means that a top gradient may tint or obscure the layers below it. Explicitly document each layer's role when a stack grows beyond two layers.

```css
.ambient-panel {
  background-color: #0f172a;
  background-image:
    radial-gradient(circle at 85% 15%, rgb(59 130 246 / 22%), transparent 38%),
    radial-gradient(circle at 10% 95%, rgb(168 85 247 / 16%), transparent 44%),
    linear-gradient(135deg, #0f172a, #1e1b4b);
}
```

If the result looks too saturated, remove the top layer temporarily and compare. Do not try to fix a layer-order problem by repeatedly changing all the colors. A small debugging change often reveals which layer owns the visual issue.

### Gradient and Blend Modes

Blend modes can combine background layers in ways that are difficult to predict from the source colors alone. They can create richness, but they also make contrast and theme behavior harder to reason about. Use blend modes only when the effect is intentional and has been tested against all relevant backgrounds.

```css
.blended-art {
  background-color: #111827;
  background-image:
    radial-gradient(circle at 30% 25%, #a78bfa, transparent 42%),
    linear-gradient(120deg, #0ea5e9, #312e81);
  background-blend-mode: screen, normal;
}
```

Blend modes may change the visual result substantially between light and dark backgrounds. Inspect the computed `background-blend-mode` in DevTools and test the actual output. If the same effect can be achieved with a simple alpha color, prefer the simpler implementation.

### Gradient and Image Cropping

A gradient over a background image is sensitive to `background-position`, `background-size`, and the aspect ratio of the container. The image crop can move the important subject under a different part of the overlay. Test actual content at multiple widths, not just a placeholder.

```css
.editorial-hero {
  background-color: #111827;
  background-image:
    linear-gradient(90deg, rgb(3 7 18 / 86%), rgb(3 7 18 / 5%) 82%),
    url("/images/editorial.jpg");
  background-position: center, 62% center;
  background-size: cover, cover;
  background-repeat: no-repeat;
}
```

The order of the `background-position` and `background-size` values corresponds to the order of the background layers. When a crop is wrong, inspect each layer's position rather than changing the overlay stops blindly.

### Contrast Review Procedure

A gradient has a range of colors, so contrast must be checked where the text actually appears. If a heading spans from a dark region into a bright region, a single contrast sample can hide a failure. Use a contrast-checking workflow that samples the relevant local background or place the text on a solid surface.

1. Identify all text and controls that overlap the gradient.
2. Inspect the lightest and darkest regions under each text block.
3. Check contrast for normal, hover, disabled, and focus states.
4. Test the real image crop if the gradient overlays a photograph.
5. Add a stronger overlay or solid backing if the contrast varies too much.
6. Recheck at mobile widths, where the focal point may shift.

```css
.hero__copy {
  max-width: 38rem;
  padding: 1.5rem;
  border-radius: 1rem;
  color: #fff;
  background: rgb(15 23 42 / 72%);
}
```

A translucent backing can stabilize contrast while preserving the visual atmosphere. Make sure the backing itself has enough contrast and does not obscure important imagery unnecessarily.

### Gradient QA Matrix

Use a matrix to avoid reviewing only the happy path:

- Light text over the darkest gradient region.
- Dark text over the lightest gradient region.
- Button foreground and background in default and focus states.
- Gradient overlay on a bright image and a dark image.
- Desktop layout with wide aspect ratio.
- Mobile layout with stacked content.
- Theme change between light and dark modes.
- Reduced-motion mode with animated effects disabled.
- High-contrast or forced-colors environment.
- Screen reader interpretation of any data-bearing visualization.
- Keyboard focus when pseudo-elements are present.
- Target browsers that may handle masks or text clipping differently.

```css
.hero__action {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding-inline: 1rem;
  border-radius: 0.625rem;
  color: #fff;
  background-color: #1d4ed8;
  background-image: linear-gradient(110deg, #1d4ed8, #6d28d9);
}

.hero__action:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 4px;
}
```

The solid background color is the fallback, while the gradient provides the enhancement. Test the actual contrast of white text against the button's colors and do not assume the same token is suitable for every action.

### Progressive Enhancement for Masks and Clipping

Masking and gradient text effects should not be prerequisites for understanding the page. Use a normal image or readable text by default, then layer on the effect when the browser supports it. Keep the fallback visible and test whether a failed enhancement leaves the content in a usable state.

```css
.decorative-fade {
  opacity: 1;
}

@supports (mask-image: linear-gradient(black, transparent)) {
  .decorative-fade {
    mask-image: linear-gradient(to bottom, black 65%, transparent);
  }
}
```

Support detection is not a replacement for testing. Verify that the property behaves as intended in the actual browser versions and ensure that the masked region is decorative rather than essential.

### Gradient and Interaction Layers

A gradient pseudo-element can create a separate stacking layer. Establish a local stacking context when it makes the intended order easier to understand, and keep the decorative layer from capturing pointer events. Avoid negative stacking values that accidentally place the layer behind the parent's background.

```css
.panel {
  position: relative;
  isolation: isolate;
  background: #0f172a;
}

.panel::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(circle at 80% 20%, rgb(99 102 241 / 24%), transparent 40%);
}
```

This pattern must be tested in context because stacking contexts can be created by other properties, including transforms and opacity. If the gradient disappears, inspect the ancestor tree and computed stacking behavior before increasing `z-index` at random.

### Performance Profiling

A static gradient often avoids a large image download, but animated gradient effects can cause frequent repaints. Use the browser's Performance panel to measure real behavior rather than assuming the CSS is cheap or expensive. Profile on a representative device and include the rest of the page's visual effects in the test.

```js
const target = document.querySelector(".animated-background");
if (target) {
  const style = getComputedStyle(target);
  console.table({
    animationName: style.animationName,
    animationDuration: style.animationDuration,
    backgroundSize: style.backgroundSize,
    willChange: style.willChange
  });
}
```

This helper reports configuration, not actual frame cost. Use performance recordings to determine whether an animation causes dropped frames. Remove unnecessary motion before reaching for compositor hints, and avoid setting `will-change` on many large surfaces.

### Review Questions

1. What is the gradient's job in this component?
2. Could a solid color communicate the same thing more clearly?
3. Are the stops ordered and positioned intentionally?
4. Does the angle produce the intended visual direction?
5. Does each background layer have a specific purpose?
6. Is the gradient legible behind the actual content?
7. Does the mobile crop move the focal point behind text?
8. Is the gradient token named by role?
9. Does a fallback preserve the component if the effect fails?
10. Does an animated effect respect `prefers-reduced-motion`?
11. Can a pseudo-element intercept input or obscure a focus ring?
12. Has the computed style been inspected in DevTools?

### Failure Triage Examples

**Symptom: gradient looks reversed.** Verify the CSS angle convention and the order of color stops. Create a small isolated test before changing every token.

**Symptom: text is readable on desktop but not mobile.** The content and focal point may have moved relative to each other. Change the mobile direction or stop position, or add a stable text backing.

**Symptom: a glow turns gray at its edge.** Check whether the endpoint uses `transparent` instead of the intended hue with zero alpha.

**Symptom: one gradient layer vanishes.** Inspect the comma-separated background declaration and check whether a later shorthand reset removed the earlier layer.

**Symptom: a button cannot be clicked.** Inspect pseudo-elements, stacking contexts, and pointer events. A decorative layer may be covering the control.

**Symptom: gradient text disappears in a browser.** Check background clipping and transparent text fill, then confirm the solid fallback works in that browser.

```js
function inspectGradientStack(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const style = getComputedStyle(el);
  const before = getComputedStyle(el, "::before");
  const after = getComputedStyle(el, "::after");

  console.table({
    backgroundImage: style.backgroundImage,
    backgroundColor: style.backgroundColor,
    blendMode: style.backgroundBlendMode,
    beforeContent: before.content,
    beforeBackground: before.backgroundImage,
    beforePointerEvents: before.pointerEvents,
    afterContent: after.content,
    afterBackground: after.backgroundImage,
    afterPointerEvents: after.pointerEvents
  });
}

inspectGradientStack(".hero");
```

This inspection helper makes pseudo-element layers easier to identify, but it does not establish the complete paint order. Combine it with the DevTools element panel and a live click/focus test.

### Final Implementation Review

Review the gradient in context after the tokens are integrated. Compare the same components before and after the change, at several widths and with real content. Remove decorative layers that do not improve hierarchy. Test keyboard focus and screen reader behavior separately from screenshot review.

If a gradient represents a data value, make sure the value is exposed in text or native semantics. If it is decorative, it should not produce an unnecessary announcement. For images, provide useful `alt` text when the image contributes information; use empty alt text when the image is purely decorative and the surrounding text already carries the meaning.

```html
<header class="site-header">
  <nav aria-label="Primary navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>
<main>
  <section class="hero" aria-labelledby="hero-heading">
    <h1 id="hero-heading">Build with focus</h1>
    <p>Bring useful information into one clear view.</p>
    <a class="hero__action" href="/start">Get started</a>
  </section>
  <aside aria-label="Implementation notes">
    <p>Review contrast, keyboard focus, and responsive behavior.</p>
  </aside>
</main>
```

Use semantic elements because they represent the content's role. A gradient is visual styling and should not determine whether a component uses a link, button, section, or navigation landmark.
