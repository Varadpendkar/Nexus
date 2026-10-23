---
name: liquid-button
layer: layer-08-micro-interactions
filename: liquid_button.md
description: Build tactile liquid-style buttons with robust interaction states, accessible semantics, and restrained motion.
---

# Liquid Button

## Why This Matters

A liquid button gives a familiar control a soft, elastic response. Its surface may bulge toward the pointer, wobble after a press, or appear to flow between two shapes. Used carefully, the effect adds tactile character to a call to action, media control, or playful portfolio interface.

The effect is also easy to overbuild. A button that changes shape too aggressively can make its hit area feel unpredictable, obscure its label, or distract from the task. A complex SVG filter can blur text, trigger expensive repainting, or behave differently across browsers. The visual effect must remain secondary to the control's real job.

A production-ready liquid button has four properties:
- The underlying control is a semantic button or link with a clear accessible name.
- The visual deformation never makes the interactive target difficult to find or activate.
- The animation is bounded, interruptible, and compatible with reduced-motion preferences.
- The effect degrades gracefully when filters, SVG features, or JavaScript are unavailable.

This skill covers CSS shape transitions, SVG filters, pointer-driven deformation, press feedback, focus states, touch fallbacks, performance constraints, and reusable component patterns.

## Core Concepts

### 1. Separate the Control from Its Decoration

The semantic element should remain the actual interaction target. A decorative span or pseudo-element can render the liquid surface, but it must not replace the button's accessible label or activation behavior.

```html
<button class="liquid-button" type="button">
  <span class="liquid-button__surface" aria-hidden="true"></span>
  <span class="liquid-button__label">Explore work</span>
</button>
```

```css
.liquid-button {
  position: relative;
  isolation: isolate;
  border: 0;
  padding: 0.9rem 1.4rem;
  border-radius: 999px;
  font: inherit;
  cursor: pointer;
}
```

**Why:** Decorative animation should never be responsible for making the control accessible. The button must still work if the animation is disabled or fails to load.

### 2. Use a Stable Hit Area

The visible silhouette may deform, but the actual button box should remain large enough and stable enough to activate. Avoid changing the element's dimensions in response to pointer movement.

```css
.liquid-button {
  min-width: 8rem;
  min-height: 2.75rem;
  display: inline-grid;
  place-items: center;
}
```

**Why:** A moving target is frustrating and can be difficult for users with motor impairments. Keep the hit area stable; animate an inner surface instead.

### 3. Prefer Transform and Shape Changes Before Heavy Filters

A simple liquid impression can come from a slightly elastic scale, a border-radius transition, or a clipped inner shape. SVG displacement filters can create more organic movement but require more care.

```css
.liquid-button__surface {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  z-index: -1;
  transition:
    border-radius 240ms ease,
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.liquid-button:hover .liquid-button__surface {
  border-radius: 42% 58% 54% 46% / 48% 42% 58% 52%;
  transform: scale(1.03);
}
```

**Why:** Many high-quality interactions do not need a filter. Start with inexpensive primitives, then add distortion only if it clearly improves the result.

### 4. Keep Text Sharp and Readable

Apply deformation to the surface behind the label, not to the text itself. Large blur or displacement filters applied to the whole button can make text appear smeared.

```css
.liquid-button__label {
  position: relative;
  z-index: 1;
  color: white;
  font-weight: 600;
}
```

**Why:** The button's label is the primary content. A liquid effect should not reduce its legibility during or after the animation.

### 5. Model Press Feedback as a Short State

A press response should feel immediate. Use `:active` for a lightweight visual reaction, and keep any JavaScript-driven spring or ripple bounded.

```css
.liquid-button:active .liquid-button__surface {
  transform: scale(0.96);
}
```

**Why:** A press should not wait for a pointer-up event or a long animation timeline. If the user presses and releases quickly, the state should still feel responsive.

### 6. Treat Hover, Focus, Active, and Disabled as Different States

A liquid button may have multiple states, but they should not all use the same visual treatment. Hover can change the silhouette; focus needs a clear visible indicator; active can compress the surface; disabled must communicate unavailability without pretending to be interactive.

```css
.liquid-button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}

.liquid-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
```

**Why:** A decorative effect cannot substitute for state communication. Keyboard focus should remain visible even if the surface is animated or clipped.

### 7. Respect Reduced Motion

A user who requests reduced motion should not have to tolerate an elastic wobble to activate a button. Keep the control visually complete and remove or simplify nonessential motion.

```css
@media (prefers-reduced-motion: reduce) {
  .liquid-button__surface {
    transition: none;
  }

  .liquid-button:active .liquid-button__surface {
    transform: none;
  }
}
```

**Why:** The animation is decoration, not meaning. The button's label, state, and action must remain identical when motion is reduced.

### 8. Use Pointer Coordinates Carefully

If the shape responds to pointer position, convert coordinates relative to the button's bounding box. Do not mix viewport coordinates with local coordinates.

```js
function getLocalPointer(event, element) {
  const rect = element.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}
```

**Why:** Normalized coordinates between zero and one are independent of button size. They also make it easier to clamp movement and reuse the effect across different dimensions.

### 9. Clamp Deformation

Never allow pointer-driven offsets to grow without a limit. Normalize the pointer position and map it to a small range.

```js
const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const offsetX = clamp((local.x - 0.5) * 8, -4, 4);
const offsetY = clamp((local.y - 0.5) * 8, -4, 4);
```

**Why:** A pointer can move rapidly, the element can resize, and events can arrive after a layout change. Clamping prevents extreme jumps and preserves a predictable hit area.

### 10. Avoid Unbounded Pointer Event Work

Pointer events can arrive more frequently than the display paints. Store the latest pointer position, then update the visual state in `requestAnimationFrame`.

```js
let frameId = 0;
let latestPoint = null;

function onPointerMove(event) {
  latestPoint = { x: event.clientX, y: event.clientY };

  if (!frameId) {
    frameId = requestAnimationFrame(render);
  }
}

function render() {
  frameId = 0;
  if (!latestPoint) return;

  // Read the latest point and update the decorative surface.
}
```

**Why:** Coalescing updates prevents unnecessary style writes and ensures the effect follows the display's paint cadence. Keep layout reads grouped before style writes to avoid forced synchronous layout.

### 11. SVG Displacement Filters Need a Safe Fallback

An SVG filter can distort a surface using a noise map and a displacement scale. It can look organic, but filter cost depends on the affected area and browser implementation.

**Why:** Large filter regions can increase rendering cost, and filter support or output can vary across browsers. Keep the filtered region small, test on actual target devices, and provide a CSS-only version that still looks intentional.

Use displacement on a decorative shape, not on the entire interactive element or its label. Do not assume that a filter automatically produces a high-quality effect; tune it against the design and measure performance.

### 12. Keep the Effect Compatible with Touch

Touch devices do not have a persistent hover cursor. Use press feedback and a stable surface rather than relying on pointer-following deformation.

```css
@media (hover: none), (pointer: coarse) {
  .liquid-button:hover .liquid-button__surface {
    transform: none;
    border-radius: inherit;
  }
}
```

**Why:** A button should feel responsive when tapped, but it should not remain in a simulated hover state after a tap. The default state must be complete and recognizable.

## Patterns

### Pattern 1: CSS-Only Elastic Surface

**Use when:** You want a subtle liquid silhouette without JavaScript or SVG filters.

```html
<button class="liquid-button" type="button">
  <span class="liquid-button__surface" aria-hidden="true"></span>
  <span class="liquid-button__label">Get started</span>
</button>
```

```css
.liquid-button {
  position: relative;
  isolation: isolate;
  display: inline-grid;
  place-items: center;
  min-height: 2.9rem;
  padding: 0.85rem 1.5rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: white;
  font: inherit;
  font-weight: 650;
  cursor: pointer;
}

.liquid-button__surface {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: #5b43e8;
  transition:
    border-radius 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.liquid-button:hover .liquid-button__surface {
  border-radius: 43% 57% 49% 51% / 52% 42% 58% 48%;
  transform: scale(1.035);
}

.liquid-button:active .liquid-button__surface {
  transform: scale(0.96);
}

.liquid-button:focus-visible {
  outline: 3px solid #5b43e8;
  outline-offset: 5px;
}

.liquid-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (hover: none), (pointer: coarse) {
  .liquid-button:hover .liquid-button__surface {
    border-radius: inherit;
    transform: none;
  }

  .liquid-button:active .liquid-button__surface {
    transform: scale(0.97);
  }
}

@media (prefers-reduced-motion: reduce) {
  .liquid-button__surface {
    transition: none;
  }

  .liquid-button:active .liquid-button__surface {
    transform: none;
  }
}
```

**Why it works:** Border-radius transitions suggest a soft shape change without distorting the label. The effect has no JavaScript lifecycle, so it is simple to maintain and resilient to component unmounting.

### Pattern 2: Pointer-Responsive Surface

**Use when:** A desktop button should lean slightly toward the pointer while keeping the hit area stable.

```html
<button class="liquid-button liquid-button--magnetic" type="button">
  <span class="liquid-button__surface" aria-hidden="true"></span>
  <span class="liquid-button__label">Explore</span>
</button>
```

```css
.liquid-button--magnetic {
  --liquid-x: 0px;
  --liquid-y: 0px;
}

.liquid-button--magnetic .liquid-button__surface {
  transform:
    translate3d(var(--liquid-x), var(--liquid-y), 0)
    scale(1);
}

.liquid-button--magnetic:hover .liquid-button__surface {
  transform:
    translate3d(var(--liquid-x), var(--liquid-y), 0)
    scale(1.03);
}

@media (prefers-reduced-motion: reduce) {
  .liquid-button--magnetic .liquid-button__surface {
    transform: none;
  }
}
```

```js
function mountLiquidButton(button, { maxOffset = 4 } = {}) {
  const surface = button.querySelector(".liquid-button__surface");
  if (!surface) return () => {};

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let frameId = 0;
  let point = null;
  let destroyed = false;

  function render() {
    frameId = 0;
    if (destroyed || !point) return;

    const rect = button.getBoundingClientRect();
    const nx = (point.x - rect.left) / rect.width - 0.5;
    const ny = (point.y - rect.top) / rect.height - 0.5;

    const x = Math.max(-maxOffset, Math.min(maxOffset, nx * maxOffset * 2));
    const y = Math.max(-maxOffset, Math.min(maxOffset, ny * maxOffset * 2));

    button.style.setProperty("--liquid-x", `${x}px`);
    button.style.setProperty("--liquid-y", `${y}px`);
  }

  function onMove(event) {
    if (!finePointer.matches || reduceMotion.matches) return;
    point = { x: event.clientX, y: event.clientY };
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  function reset() {
    point = null;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    button.style.setProperty("--liquid-x", "0px");
    button.style.setProperty("--liquid-y", "0px");
  }

  function onMotionChange() {
    if (reduceMotion.matches) reset();
  }

  button.addEventListener("pointermove", onMove, { passive: true });
  button.addEventListener("pointerleave", reset);
  reduceMotion.addEventListener?.("change", onMotionChange);

  return () => {
    destroyed = true;
    button.removeEventListener("pointermove", onMove);
    button.removeEventListener("pointerleave", reset);
    reduceMotion.removeEventListener?.("change", onMotionChange);
    reset();
  };
}

const button = document.querySelector(".liquid-button--magnetic");
if (button) {
  const unmountLiquidButton = mountLiquidButton(button);
}
```

**Implementation notes:**
- The effect changes only custom properties on the button, while the decorative surface consumes them.
- The hit target's dimensions do not move.
- The pointer state is reset on exit and when reduced motion becomes active.
- This pattern intentionally keeps offsets small. Larger values make the button feel detached from its actual target.
- For multiple buttons, call the mount function for each element and retain every cleanup function for page teardown.

### Pattern 3: SVG Goo Filter

**Use when:** A design needs a more organic, connected liquid silhouette and the target browser set has been tested.

An SVG filter can merge nearby shapes and soften their edges. Keep the filter on a decorative wrapper or surface, and avoid applying it to text.

```html
<svg class="liquid-filter-defs" aria-hidden="true" focusable="false">
  <filter id="liquid-goo">
    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
    <feColorMatrix
      in="blur"
      mode="matrix"
      values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 18 -7"
      result="goo"
    />
    <feComposite in="SourceGraphic" in2="goo" operator="atop" />
  </filter>
</svg>

<button class="liquid-button liquid-button--goo" type="button">
  <span class="liquid-button__goo" aria-hidden="true">
    <span></span>
    <span></span>
  </span>
  <span class="liquid-button__label">Make something</span>
</button>
```

```css
.liquid-filter-defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

.liquid-button--goo {
  position: relative;
  isolation: isolate;
  border: 0;
  padding: 1rem 1.6rem;
  border-radius: 999px;
  background: transparent;
  color: white;
  font: inherit;
  cursor: pointer;
}

.liquid-button__goo {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  border-radius: inherit;
  background: #5b43e8;
}

.liquid-button__goo span {
  position: absolute;
  width: 55%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #5b43e8;
  filter: url("#liquid-goo");
  transition: transform 280ms ease;
}

.liquid-button__goo span:first-child {
  left: -15%;
  top: 25%;
}

.liquid-button__goo span:last-child {
  right: -15%;
  top: -25%;
}

.liquid-button--goo:hover .liquid-button__goo span:first-child {
  transform: translate(30%, -15%) scale(1.25);
}

.liquid-button--goo:hover .liquid-button__goo span:last-child {
  transform: translate(-25%, 20%) scale(1.3);
}

@media (prefers-reduced-motion: reduce) {
  .liquid-button__goo span {
    transition: none;
  }
}
```

**Caution:** SVG filter behavior can vary by browser and filter region. Test clipping and text contrast, and retain a normal solid surface as the fallback. Do not add multiple large blur filters without profiling.

### Pattern 4: Press Squash and Release

**Use when:** The button should feel soft and responsive when pressed, without a persistent pointer-following effect.

```css
.liquid-button__surface {
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.liquid-button:active .liquid-button__surface {
  transform: scale(0.95, 0.9);
}

.liquid-button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .liquid-button__surface {
    transition: none;
  }

  .liquid-button:active .liquid-button__surface {
    transform: none;
  }
}
```

**Why:** A short compression gives a tactile response without making the control drift away from the pointer. The actual button dimensions remain stable.

Do not require a pointer event to create the press state. Native `:active` also works for keyboard activation in supporting browsers, and the button remains functional without JavaScript.

### Pattern 5: React Component with CSS-Only Liquid Motion

**Use when:** A reusable React button needs a liquid visual treatment but does not require per-frame pointer simulation.

```jsx
export function LiquidButton({
  children,
  type = "button",
  disabled = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`liquid-button ${className}`.trim()}
    >
      <span className="liquid-button__surface" aria-hidden="true" />
      <span className="liquid-button__label">{children}</span>
    </button>
  );
}
```

Usage:

```jsx
<LiquidButton onClick={() => console.log("Action activated")}>
  Explore work
</LiquidButton>
```

The component preserves native button behavior and passes through a real callback. In production, avoid logging-only handlers; connect the button to the actual application action. If the control navigates, render an anchor rather than simulating navigation in a button.

### Pattern 6: Disabled and Busy States

**Use when:** The button performs an asynchronous action and must communicate that it is unavailable while processing.

```jsx
export function SubmitLiquidButton({ loading, children, ...props }) {
  return (
    <button
      {...props}
      type={props.type ?? "submit"}
      disabled={loading || props.disabled}
      aria-busy={loading ? "true" : undefined}
      className={`liquid-button ${props.className ?? ""}`.trim()}
    >
      <span className="liquid-button__surface" aria-hidden="true" />
      <span className="liquid-button__label">
        {loading ? "Processing…" : children}
      </span>
    </button>
  );
}
```

```css
.liquid-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.liquid-button:disabled .liquid-button__surface {
  animation: none;
  transform: none;
}
```

**Why:** A busy state should prevent duplicate submission when that is the intended behavior, and it should communicate status in text. A decorative liquid animation is not a substitute for a real loading indicator or status message.

If the loading text changes the button width, reserve a stable width or use a carefully designed inline status so the surrounding layout does not jump.

### Pattern 7: Reusable Reduced-Motion Policy

**Use when:** A design system needs a consistent rule for every liquid button.

```css
.liquid-button__surface {
  transition:
    transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-radius 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .liquid-button__surface,
  .liquid-button__goo span {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}
```

Keep the default shape and colors attractive without motion. Reduced motion should remove the deformation, not reduce contrast, hide labels, or change the control's functionality.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Deforming the whole button and label | Text can blur or move unexpectedly | Animate an inner decorative surface |
| Moving the hit target with pointer position | Makes activation feel unreliable | Keep the semantic button box stable |
| Applying a large SVG filter to the whole control | Can blur text and increase paint cost | Filter only a small decorative layer |
| Letting pointer offsets grow without bounds | Causes jumps and unpredictable motion | Normalize and clamp local coordinates |
| Running work on every pointer event | Can produce excess style writes | Coalesce updates with `requestAnimationFrame` |
| Ignoring reduced motion | Forces decorative movement on users who requested less | Remove or simplify motion |
| Relying on hover for touch feedback | Touch has no stable hover state | Use native active feedback and a complete default state |
| Removing focus indicators | Keyboard users lose their position | Design a clear `:focus-visible` outline |
| Using a `div` as the control | Loses native button behavior and semantics | Use a real button or link |
| Creating perpetual animation loops | Wastes resources while idle | Schedule only while work is active |
| Forgetting to cancel frames | Updates can continue after teardown | Cancel pending frames and remove listeners |
| Reusing particles without resetting state | Old values leak into new animations | Reset all particle fields on reuse |
| Ignoring disabled state | The button still appears interactive | Provide distinct disabled styling and behavior |
| Using color alone to indicate state | State can be difficult to perceive | Combine shape, contrast, and text or focus cues |
| Failing to test filters on target browsers | Effects may clip or render differently | Keep a CSS fallback and test real devices |

## Mental Models

1. **The control is real; the liquid is decoration.** Native semantics and activation behavior must survive if every animation is removed.
2. **Keep the target stable and the surface expressive.** Visual deformation belongs on an inner layer, not on the hit area.
3. **Prefer the least expensive convincing effect.** Border-radius and transform changes often provide enough character without SVG displacement.
4. **Pointer data is input, not paint.** Store the latest point and apply visual updates at the frame cadence.
5. **Every animation needs an exit condition.** A one-shot interaction should stop when it finishes; a pointer-following effect should become idle when the pointer leaves.
6. **Reduced motion preserves meaning.** Remove nonessential deformation while retaining labels, contrast, and interaction.
7. **Fallbacks are part of the design.** The button should still look intentional and work when advanced filters or JavaScript are unavailable.

## Quick Reference

### State checklist

| State | Expected behavior |
|---|---|
| Default | Stable shape, readable label, clear affordance |
| Hover | Subtle shape or surface response on fine-pointer devices |
| Focus | Visible focus indicator, no reliance on hover |
| Active | Immediate press feedback |
| Disabled | Non-interactive, clearly muted |
| Busy | Duplicate activation handled intentionally and status communicated |
| Reduced motion | No unnecessary deformation or continuous animation |
| Touch | Complete default appearance and reliable tap response |

### Useful CSS

```css
.liquid-button {
  position: relative;
  isolation: isolate;
  display: inline-grid;
  place-items: center;
  min-height: 2.75rem;
  padding: 0.85rem 1.4rem;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: white;
  font: inherit;
}

.liquid-button__surface {
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: #5b43e8;
  transition: transform 220ms ease, border-radius 220ms ease;
}

.liquid-button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .liquid-button__surface {
    transition: none;
    transform: none;
  }
}
```

### Debugging sequence

1. Verify that the actual control is a `<button>` or `<a>`.
2. Confirm the decorative surface is behind the label and cannot intercept input.
3. Check the stable hit box while the surface deforms.
4. Test keyboard focus, active, disabled, and busy states.
5. Toggle reduced motion and confirm the effect stops immediately.
6. Test touch input and ensure hover styles do not persist unexpectedly.
7. Inspect SVG filter clipping and compare against the CSS-only fallback.
8. Profile pointer-driven effects with the browser performance tools.
9. Verify event listeners and animation frames are cleaned up on unmount.
10. Check text contrast at every animated shape state.

### Production checklist

- [ ] Semantic button or anchor is used appropriately.
- [ ] Accessible name remains visible and unchanged by decoration.
- [ ] Hit area remains stable during deformation.
- [ ] Focus indicator is visible and not clipped.
- [ ] Disabled and busy states are represented correctly.
- [ ] Reduced-motion mode removes nonessential movement.
- [ ] Touch users receive a complete interaction without hover.
- [ ] Pointer coordinates are normalized and clamped.
- [ ] Pointer updates are coalesced when needed.
- [ ] Animation frames and listeners are cleaned up.
- [ ] SVG filters have a tested fallback.
- [ ] Effects are profiled on representative devices.

## Build Challenge

Create a liquid CTA for a creative studio landing page. The button should have a soft elastic surface, a responsive press state, and an optional pointer-directed deformation on desktop.

### Requirements

1. Use a semantic button for an action and an anchor for navigation.
2. Render the liquid surface separately from the text label.
3. Keep the interactive hit area stable.
4. Use a CSS-only effect as the baseline.
5. Add pointer-directed movement only for fine-pointer devices.
6. Clamp pointer offsets to a small range.
7. Coalesce pointer updates with `requestAnimationFrame`.
8. Provide visible keyboard focus, active, disabled, and busy states.
9. Disable or simplify motion under `prefers-reduced-motion`.
10. Include a fallback when SVG filters are unsupported or too expensive.
11. Remove listeners and pending animation frames during teardown.
12. Test keyboard, touch, reduced motion, and at least two browser engines.

### Acceptance criteria

- The control remains operable when animation is disabled.
- The label remains sharp and readable through every state.
- The button's hit area does not chase the pointer.
- Pointer movement cannot create extreme offsets.
- The effect does not run continuously while idle.
- Reduced-motion mode removes nonessential deformation.
- Touch users can activate the control without hover.
- Focus and disabled states are obvious.
- Cleanup prevents duplicate listeners after remounting.
- The CSS-only fallback still looks intentional.

### Review questions

1. Why should the liquid surface be separate from the button label?
2. Why must the hit area remain stable?
3. When is a CSS-only shape transition preferable to an SVG filter?
4. How do you normalize and clamp pointer coordinates?
5. Why should pointer updates be coalesced with `requestAnimationFrame`?
6. How should the effect behave under reduced-motion preferences?
7. What should happen to the effect on touch-first devices?
8. Which lifecycle tasks are required when a component unmounts?
9. How do disabled and busy states differ?
10. How would you verify that a liquid effect is performant on a low-powered device?
