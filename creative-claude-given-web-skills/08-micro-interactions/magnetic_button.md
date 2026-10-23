---
name: magnetic-button
layer: layer-08-micro-interactions
description: Build accessible, performant magnetic buttons that subtly follow pointer movement without compromising usability, touch input, or reduced-motion preferences.
---

# Magnetic Button

## Why This Matters

A magnetic button creates a small sense of physical attraction: as a pointer approaches, the button shifts toward it, and often its label or icon moves slightly farther. Used with restraint, this interaction gives a creative website a tactile, responsive quality. It can make a primary call to action feel intentional, support a polished portfolio or product page, and reinforce the sense that the interface is responding to the visitor rather than merely waiting for a click.

The effect is easy to overdo. A large displacement can make a button feel unstable, pull it away from its intended target, or cause nearby elements to collide. A pointer-only implementation can also fail on touch devices, keyboard navigation, or users who prefer reduced motion. A production-quality magnetic button is therefore not just a cursor-following transform. It is a small interaction system with clear activation boundaries, bounded movement, a stable layout, predictable reset behavior, accessible semantics, and lifecycle cleanup.

Use this skill when building:
- A hero-section primary CTA on a portfolio or agency site.
- A compact “View project” or “Explore” button in a creative case study.
- A carefully restrained navigation CTA in an editorial or product landing page.
- A button whose visual feedback should feel tactile without changing its click target.
- A reusable interaction primitive in a component library.

Do not use it for every control. Ordinary form buttons, dense data tables, small icon-only controls, and interfaces requiring precise target stability are usually better served by a clear hover, focus, or pressed state.

## Core Concepts

### 1. Separate the Hit Target from the Visual Motion

The button's layout box is its hit target. The transform is only a visual treatment. Keep the button in normal document flow and apply a small transform rather than changing `top`, `left`, margins, or layout dimensions.

Why: layout-affecting properties can trigger reflow and make neighboring elements move. A transform is generally composited more efficiently and preserves the intended layout geometry.

```html
<button class="magnetic-button" type="button">
  <span class="magnetic-button__label">Explore work</span>
</button>
```

```css
.magnetic-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.9rem 1.35rem;
  border: 0;
  border-radius: 999px;
  background: #171717;
  color: #fff;
  font: inherit;
  cursor: pointer;
  transform: translate3d(var(--magnetic-x, 0px), var(--magnetic-y, 0px), 0);
  transition: transform 180ms cubic-bezier(.2, .75, .25, 1);
  will-change: transform;
}
```

The transform should be driven by CSS custom properties so the JavaScript only calculates the movement and CSS owns the visual composition.

### 2. Measure the Pointer Relative to the Button

`PointerEvent.clientX` and `clientY` are viewport coordinates. `getBoundingClientRect()` returns the button's viewport-relative rectangle. Subtract the rectangle's center to get a local pointer offset.

```js
function getPointerOffset(event, element) {
  const rect = element.getBoundingClientRect();

  return {
    x: event.clientX - (rect.left + rect.width / 2),
    y: event.clientY - (rect.top + rect.height / 2),
  };
}
```

Why: using page coordinates with a viewport-relative rectangle mixes coordinate spaces and breaks when the page scrolls. Center-relative coordinates are intuitive: positive `x` means the pointer is right of the center; negative `y` means it is above the center.

Measure on pointer movement or on entry, not in an unrelated global loop. If the page layout changes significantly during an active interaction, recalculate the rectangle before the next movement.

### 3. Normalize and Clamp the Force

Raw pointer distance should not be applied directly. A pointer may be far from the button, and a large raw offset would cause an extreme jump. Convert the offset into a bounded amount of movement.

```js
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateMagneticTranslation(offset, strength = 0.18, maxMove = 12) {
  return {
    x: clamp(offset.x * strength, -maxMove, maxMove),
    y: clamp(offset.y * strength, -maxMove, maxMove),
  };
}
```

The `strength` is a fraction of the pointer's offset, while `maxMove` is a hard pixel limit. A strength of `0.18` means the button follows 18% of the offset until it reaches the cap. A maximum of roughly 6–14 pixels is a useful starting range for a standard CTA; use smaller values for compact controls.

Why: a hard cap guarantees that the button cannot drift too far from its designed position. It also makes the effect tunable across different button sizes.

### 4. Use a Clear Activation Boundary

The magnetic response should start only when the pointer is interacting with the button, or within a deliberate proximity region around it. The simplest robust behavior uses `pointerenter`, `pointermove`, and `pointerleave`.

For a true proximity field, use a wrapper whose dimensions define the activation region while the button remains the moving child. This avoids attaching a global pointer listener to the entire document and accidentally affecting unrelated controls.

```html
<div class="magnetic-zone">
  <button class="magnetic-button" type="button">Let's talk</button>
</div>
```

```css
.magnetic-zone {
  display: inline-grid;
  place-items: center;
  padding: 18px;
}
```

Why: explicit activation boundaries make the effect predictable, easier to debug, and less likely to interfere with adjacent UI. The zone also gives the button space to move without overlapping neighboring content.

### 5. Return to Rest Reliably

When the pointer leaves the activation area, the button must return to its exact rest position. Reset both axes to zero. Do not leave the final pointer offset applied or assume a later hover will overwrite it.

```js
function resetMagneticButton(button) {
  button.style.setProperty("--magnetic-x", "0px");
  button.style.setProperty("--magnetic-y", "0px");
}
```

Why: a reliable reset prevents cumulative drift and keeps the next interaction independent of the previous one. The rest position should always be the layout position, not a remembered pointer position.

### 6. Use Pointer Events, Not Mouse-Only Events

Pointer events support mouse, pen, and touch input through one event model. The magnetic effect itself should normally run only for fine pointers that can hover. Touch screens do not have a persistent hover position and should retain ordinary button behavior.

```js
const canHoverPrecisely = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;
```

Why: checking the input capability avoids a confusing “sticky hover” interaction on touch devices. Do not infer input type only from screen width; a large touchscreen and a small laptop can have different pointer capabilities.

### 7. Respect Reduced Motion

Users who request reduced motion should not receive a motion-heavy pointer effect. Disable the magnetic displacement or make it effectively static while preserving ordinary hover, focus, and pressed styles.

```js
const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

if (reducedMotion.matches) {
  // Keep the button static; semantic and color feedback still work.
}
```

Why: the interaction is decorative, not required to complete the task. Removing it must never remove the button's meaning, visibility, or functionality.

### 8. Keep the Interaction Accessible

Use a real `<button>` for an action and an `<a>` for navigation. Do not use a `div` with a click handler as a substitute for native semantics. The element must remain keyboard reachable, have a visible focus indicator, and preserve adequate contrast and target size.

The transform should not be the only feedback. Keyboard users should receive a clear `:focus-visible` state, and the button must activate with standard keyboard behavior. Never move the button on keyboard focus in a way that makes focus tracking feel unstable.

```css
.magnetic-button:focus-visible {
  outline: 3px solid #6ea8fe;
  outline-offset: 4px;
}
```

### 9. Keep Motion Smooth Without Hiding Bugs

CSS transitions are enough for many magnetic buttons. If the pointer updates arrive rapidly, the browser can interpolate between the latest custom-property values. Avoid creating a new animation timeline on every pointer event.

For a more elastic response, use a requestAnimationFrame loop only if the interaction actually needs it. Store the latest target coordinates and update at most once per frame. Do not add a frame loop simply because animation is involved.

### 10. Clean Up Listeners and Media Queries

A reusable component must remove the event listeners it adds. In a framework, cleanup must run when the component unmounts. If the reduced-motion preference can change while the page is open, subscribe to the media query and remove that listener too.

Why: dangling listeners can keep detached DOM nodes reachable, cause duplicate callbacks after remounting, and make development hot reload appear to “double” the effect.

## Named Patterns

### Pattern 1: Minimal Magnetic CTA

Use a restrained translation on the button itself. This is the safest default and works well for one or two high-priority CTAs.

```html
<button class="magnetic-button" type="button">
  <span>View projects <span aria-hidden="true">↗</span></span>
</button>

<script>
  const button = document.querySelector(".magnetic-button");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  function reset() {
    button.style.setProperty("--magnetic-x", "0px");
    button.style.setProperty("--magnetic-y", "0px");
  }

  function move(event) {
    if (motionQuery.matches || !pointerQuery.matches) return;

    const rect = button.getBoundingClientRect();
    const offsetX = event.clientX - (rect.left + rect.width / 2);
    const offsetY = event.clientY - (rect.top + rect.height / 2);
    const strength = 0.16;
    const maxMove = 10;

    const x = Math.max(-maxMove, Math.min(maxMove, offsetX * strength));
    const y = Math.max(-maxMove, Math.min(maxMove, offsetY * strength));

    button.style.setProperty("--magnetic-x", `${x}px`);
    button.style.setProperty("--magnetic-y", `${y}px`);
  }

  button.addEventListener("pointermove", move);
  button.addEventListener("pointerleave", reset);
  button.addEventListener("pointercancel", reset);

  motionQuery.addEventListener?.("change", reset);
</script>
```

```css
.magnetic-button {
  --magnetic-x: 0px;
  --magnetic-y: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.85rem 1.25rem;
  border: 0;
  border-radius: 999px;
  background: #171717;
  color: white;
  font: inherit;
  cursor: pointer;
  transform: translate3d(var(--magnetic-x), var(--magnetic-y), 0);
  transition: transform 220ms cubic-bezier(.2, .8, .2, 1), background-color 160ms ease;
}

.magnetic-button:hover {
  background: #303030;
}

.magnetic-button:focus-visible {
  outline: 3px solid #7aa7ff;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .magnetic-button {
    transition: none;
    transform: none;
  }
}
```

Why this pattern works:
- The displacement is bounded.
- The reset is explicit.
- The native button keeps keyboard and assistive-technology behavior.
- CSS owns color and transform presentation.
- The reduced-motion CSS rule provides a static fallback even before JavaScript runs.

For production code, prefer the reusable controller pattern below when there are multiple buttons or a framework lifecycle.

### Pattern 2: Magnetic Button with Inner Label Parallax

Move the outer button a little and its inner label a little more. The relative motion creates a subtle depth cue without requiring 3D transforms.

```html
<button class="magnetic-button magnetic-button--parallax" type="button">
  <span class="magnetic-button__label">Discover more</span>
</button>
```

```css
.magnetic-button--parallax {
  --magnetic-x: 0px;
  --magnetic-y: 0px;
  --label-x: 0px;
  --label-y: 0px;
  transform: translate3d(var(--magnetic-x), var(--magnetic-y), 0);
}

.magnetic-button__label {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  transform: translate3d(var(--label-x), var(--label-y), 0);
  transition: transform 220ms cubic-bezier(.2, .8, .2, 1);
  pointer-events: none;
}
```

```js
function updateParallaxButton(button, event) {
  const rect = button.getBoundingClientRect();
  const x = event.clientX - (rect.left + rect.width / 2);
  const y = event.clientY - (rect.top + rect.height / 2);

  const buttonX = Math.max(-8, Math.min(8, x * 0.14));
  const buttonY = Math.max(-8, Math.min(8, y * 0.14));
  const labelX = Math.max(-4, Math.min(4, x * 0.08));
  const labelY = Math.max(-4, Math.min(4, y * 0.08));

  button.style.setProperty("--magnetic-x", `${buttonX}px`);
  button.style.setProperty("--magnetic-y", `${buttonY}px`);
  button.style.setProperty("--label-x", `${labelX}px`);
  button.style.setProperty("--label-y", `${labelY}px`);
}

function resetParallaxButton(button) {
  for (const property of ["--magnetic-x", "--magnetic-y", "--label-x", "--label-y"]) {
    button.style.setProperty(property, "0px");
  }
}
```

Why: two layers moving at different strengths can suggest depth. Keep the inner movement smaller than the outer movement; reversing that relationship can feel disconnected or make the label look like it is sliding inside a stationary control.

Implementation note: wire `pointermove` to `updateParallaxButton` and `pointerleave`/`pointercancel` to `resetParallaxButton`. Do not add `pointer-events: none` to the whole button—only the decorative label can ignore pointer targeting when that does not interfere with nested interactive content.

### Pattern 3: Proximity Zone with a Stable Hit Target

For a more “magnetic” feeling, let the pointer enter a padded zone around the button. The wrapper is the sensor; the button is the moving visual element.

```html
<div class="magnetic-zone">
  <a class="magnetic-link" href="#work">
    <span class="magnetic-link__label">Selected work ↗</span>
  </a>
</div>
```

```css
.magnetic-zone {
  display: inline-grid;
  place-items: center;
  padding: 20px;
}

.magnetic-link {
  --magnetic-x: 0px;
  --magnetic-y: 0px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;
  background: #f3f0e8;
  color: #171717;
  text-decoration: none;
  transform: translate3d(var(--magnetic-x), var(--magnetic-y), 0);
  transition: transform 200ms cubic-bezier(.2, .8, .2, 1);
}
```

```js
const zone = document.querySelector(".magnetic-zone");
const link = zone.querySelector(".magnetic-link");

zone.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;

  const rect = link.getBoundingClientRect();
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);

  link.style.setProperty("--magnetic-x", `${Math.max(-10, Math.min(10, dx * 0.12))}px`);
  link.style.setProperty("--magnetic-y", `${Math.max(-10, Math.min(10, dy * 0.12))}px`);
});

function resetLink() {
  link.style.setProperty("--magnetic-x", "0px");
  link.style.setProperty("--magnetic-y", "0px");
}

zone.addEventListener("pointerleave", resetLink);
zone.addEventListener("pointercancel", resetLink);
```

Why: the padded zone gives the control room to move while the pointer remains inside the sensor. It is useful in hero sections with generous whitespace. The link remains a real link, so navigation semantics are preserved.

Important: the zone should not overlap another control's effective hit area. If the effect makes the pointer cross into a neighboring interactive element, reduce the zone padding or disable the proximity version.

### Pattern 4: Reusable Controller for Multiple Buttons

Use one controller function for a list of elements. This keeps the math consistent and returns a cleanup function for single-page applications or framework effects.

```js
function attachMagneticButton(button, options = {}) {
  const {
    strength = 0.16,
    maxMove = 10,
    disabled = false,
  } = options;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  function reset() {
    button.style.setProperty("--magnetic-x", "0px");
    button.style.setProperty("--magnetic-y", "0px");
  }

  function onMove(event) {
    if (disabled || motionQuery.matches || !pointerQuery.matches) {
      reset();
      return;
    }

    // Touch has no stable hover position; preserve normal tap behavior.
    if (event.pointerType === "touch") return;

    const rect = button.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);

    const x = Math.max(-maxMove, Math.min(maxMove, dx * strength));
    const y = Math.max(-maxMove, Math.min(maxMove, dy * strength));

    button.style.setProperty("--magnetic-x", `${x}px`);
    button.style.setProperty("--magnetic-y", `${y}px`);
  }

  button.addEventListener("pointermove", onMove);
  button.addEventListener("pointerleave", reset);
  button.addEventListener("pointercancel", reset);
  motionQuery.addEventListener?.("change", reset);

  // Return cleanup so component unmounts cannot leave listeners behind.
  return function cleanup() {
    button.removeEventListener("pointermove", onMove);
    button.removeEventListener("pointerleave", reset);
    button.removeEventListener("pointercancel", reset);
    motionQuery.removeEventListener?.("change", reset);
    reset();
  };
}

const cleanups = [...document.querySelectorAll("[data-magnetic]")].map((button) =>
  attachMagneticButton(button, {
    strength: Number(button.dataset.magneticStrength || 0.16),
    maxMove: Number(button.dataset.magneticMax || 10),
  })
);

// If this module owns a page-level lifecycle, call each cleanup when leaving it.
function cleanupMagneticButtons() {
  cleanups.forEach((cleanup) => cleanup());
}
```

```html
<a href="#contact" data-magnetic data-magnetic-strength="0.16" data-magnetic-max="10">
  Contact
</a>
```

```css
[data-magnetic] {
  --magnetic-x: 0px;
  --magnetic-y: 0px;
  transform: translate3d(var(--magnetic-x), var(--magnetic-y), 0);
  transition: transform 200ms cubic-bezier(.2, .8, .2, 1);
}

@media (prefers-reduced-motion: reduce) {
  [data-magnetic] {
    transform: none;
    transition: none;
  }
}
```

Why: the controller isolates event handling, supports per-element tuning, and gives the owner an explicit cleanup path. Avoid running the initialization script multiple times without first cleaning up the previous controller.

### Pattern 5: React Hook with Effect Cleanup

In React, attach listeners inside an effect and clean them up when the element changes or unmounts. Avoid writing directly to a ref during render and avoid a global selector when a ref already identifies the button.

```jsx
import { useEffect, useRef } from "react";

export function MagneticButton({ children, strength = 0.16, maxMove = 10, ...props }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

    const reset = () => {
      button.style.setProperty("--magnetic-x", "0px");
      button.style.setProperty("--magnetic-y", "0px");
    };

    const onMove = (event) => {
      if (motionQuery.matches || !pointerQuery.matches || event.pointerType === "touch") {
        reset();
        return;
      }

      const rect = button.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-maxMove, Math.min(maxMove, dx * strength));
      const y = Math.max(-maxMove, Math.min(maxMove, dy * strength));

      button.style.setProperty("--magnetic-x", `${x}px`);
      button.style.setProperty("--magnetic-y", `${y}px`);
    };

    button.addEventListener("pointermove", onMove);
    button.addEventListener("pointerleave", reset);
    button.addEventListener("pointercancel", reset);
    motionQuery.addEventListener?.("change", reset);

    return () => {
      button.removeEventListener("pointermove", onMove);
      button.removeEventListener("pointerleave", reset);
      button.removeEventListener("pointercancel", reset);
      motionQuery.removeEventListener?.("change", reset);
      reset();
    };
  }, [strength, maxMove]);

  return (
    <button ref={buttonRef} className="magnetic-button" type="button" {...props}>
      <span className="magnetic-button__content">{children}</span>
    </button>
  );
}
```

```css
.magnetic-button {
  --magnetic-x: 0px;
  --magnetic-y: 0px;
  transform: translate3d(var(--magnetic-x), var(--magnetic-y), 0);
  transition: transform 200ms cubic-bezier(.2, .8, .2, 1);
}

.magnetic-button__content {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
```

Why: the effect belongs to the mounted DOM element, so an effect is the correct place to attach listeners. The cleanup prevents stale listeners after props change or the component unmounts. If the component needs to support both links and buttons, expose separate semantic components rather than rendering an anchor with button semantics.

React note: in a server-rendered app, `useEffect` runs only on the client. Do not read `window` during module initialization. The effect above reads browser APIs only after mounting.

### Pattern 6: GSAP-Enhanced Magnetic Response

Use an animation library only when the project already uses it or when controlled easing is a design requirement. Avoid creating a new tween for every pointer event without overwriting or reusing it.

```js
import gsap from "gsap";

function attachGsapMagnetic(button, strength = 0.16, maxMove = 10) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function onMove(event) {
    if (motionQuery.matches || event.pointerType === "touch") return;

    const rect = button.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);

    gsap.to(button, {
      x: Math.max(-maxMove, Math.min(maxMove, dx * strength)),
      y: Math.max(-maxMove, Math.min(maxMove, dy * strength)),
      duration: 0.35,
      ease: "power3.out",
      overwrite: "auto",
    });
  }

  function reset() {
    gsap.to(button, {
      x: 0,
      y: 0,
      duration: motionQuery.matches ? 0 : 0.5,
      ease: "elastic.out(1, 0.45)",
      overwrite: "auto",
    });
  }

  button.addEventListener("pointermove", onMove);
  button.addEventListener("pointerleave", reset);
  button.addEventListener("pointercancel", reset);

  return () => {
    button.removeEventListener("pointermove", onMove);
    button.removeEventListener("pointerleave", reset);
    button.removeEventListener("pointercancel", reset);
    gsap.killTweensOf(button);
    gsap.set(button, { x: 0, y: 0 });
  };
}
```

Why: GSAP can provide a controlled elastic return and overwrite conflicting tweens. `overwrite: "auto"` prevents a growing pile of competing tweens. If reduced motion is enabled, use no-duration resets and disable the pointer response entirely.

Caution: GSAP's `x` and `y` properties also use transforms. Do not combine them casually with CSS `transform` rules that also set rotation, scale, or translation on the same element. Put the magnetic motion on a dedicated wrapper if other transforms are required.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Applying raw pointer offset directly | The button can jump dozens or hundreds of pixels. | Multiply by a modest strength and clamp to a small maximum. |
| Updating `left`, `top`, margin, or padding | Layout can reflow on every pointer event. | Use `transform` or CSS custom properties. |
| Using `pageX` with `getBoundingClientRect()` | The values are in different coordinate spaces, especially after scrolling. | Use `clientX`/`clientY` with the viewport rectangle. |
| Forgetting to reset on leave | The control may remain displaced after the pointer exits. | Reset both axes on `pointerleave` and `pointercancel`. |
| Making every button magnetic | The interface becomes noisy and hard to scan. | Reserve the effect for a few high-value controls. |
| Using the effect on touch devices | Touch has no stable hover state and may leave a sticky visual state. | Gate on fine hover pointers and ignore touch pointer movement. |
| Ignoring reduced motion | A decorative effect runs for users who asked for less motion. | Disable translation and animation when reduced motion is requested. |
| Removing focus outlines | Keyboard users lose a reliable location indicator. | Style `:focus-visible` with a high-contrast outline. |
| Using a clickable `div` | Native keyboard and assistive-technology behavior is lost. | Use `<button>` for actions and `<a>` for navigation. |
| Measuring the rectangle in a global animation loop | Repeated layout reads waste work when nothing changes. | Measure only during relevant pointer events; cache only when safe. |
| Creating new GSAP tweens without overwrite | Competing tweens can produce lag or unpredictable motion. | Use overwrite, a reusable tween, or plain CSS. |
| Forgetting listener cleanup | Remounts can duplicate handlers and retain detached elements. | Return a cleanup function or remove listeners in the framework effect. |
| Transforming a nested interactive element | The visual movement can complicate pointer targeting and focus. | Keep the moving layer simple and avoid nested controls. |
| Setting `will-change` everywhere | Persistent compositor layers can consume memory. | Apply it only to a small number of active elements and profile first. |
| Using large displacement on a small target | The control feels slippery and can overlap adjacent content. | Keep movement proportional to target size and test at real viewport sizes. |
| Overriding the same transform from multiple systems | CSS hover scale, magnetic translate, and animation-library transforms may conflict. | Separate transforms across wrapper and inner content layers. |
| Assuming `pointerleave` always covers every lifecycle | A removed element or route change may never receive the expected exit event. | Reset during cleanup and on `pointercancel`. |
| Forgetting that `transform` affects stacking | A transformed element can create a stacking context and affect z-order. | Test overlays, menus, and neighboring positioned elements. |

## Mental Models

1. **The button is the anchor; the transform is the illusion.** The element's intended layout position never changes. Only the rendered presentation moves.
2. **Magnetism is bounded influence, not cursor chasing.** The button should respond to the pointer without trying to reach it.
3. **The rest state is a contract.** Every interaction must return to `x = 0` and `y = 0`; there is no accumulated position.
4. **Pointer capability matters more than viewport width.** Detect hover and fine-pointer support instead of assuming desktop from a breakpoint.
5. **Motion is decoration, not functionality.** Disabling it must leave the control understandable, focusable, and usable.
6. **The smallest effect that communicates intent is usually best.** If the user notices the mechanics more than the CTA, reduce the strength.
7. **A reusable interaction needs a lifecycle.** Initialization without cleanup is incomplete, especially in component-based apps and route transitions.

## Quick Reference

### Suggested Starting Values

| Parameter | Starting value | Tuning guidance |
|---|---:|---|
| Strength | `0.12–0.18` | Lower values feel more restrained. |
| Maximum translation | `6–12px` | Keep compact buttons toward the lower end. |
| CSS return duration | `180–240ms` | Shorter feels crisp; longer feels softer. |
| Easing | `cubic-bezier(.2, .8, .2, 1)` | Smooth deceleration without excessive bounce. |
| Activation area padding | `12–20px` | Use only when neighboring hit targets remain separate. |
| Inner label movement | `2–4px` | Keep it subtler than the outer button. |
| Minimum target height | `44–48px` | Use a comfortable interactive target, especially on touch. |

### Event Checklist

- `pointermove`: calculate bounded movement.
- `pointerleave`: return to the rest position.
- `pointercancel`: return to the rest position.
- Reduced-motion preference change: reset and disable movement.
- Component unmount: remove all listeners and reset styles.
- Touch pointer: do not apply hover magnetism.

### CSS Checklist

- Use `transform: translate3d(...)` or a dedicated animation layer.
- Keep layout dimensions and spacing stable.
- Preserve `:focus-visible`.
- Keep hover and active feedback separate from the magnetic translation.
- Provide a reduced-motion override.
- Avoid applying `will-change` to every control without profiling.

### Debugging Checklist

1. Confirm `pointermove` fires on the intended sensor.
2. Log the rectangle and center to verify coordinate space.
3. Confirm the offset signs: right is positive `x`, down is positive `y`.
4. Verify the clamp prevents movement beyond the configured cap.
5. Test pointer leave, cancellation, route changes, and unmount.
6. Test with reduced motion enabled in the operating system or browser.
7. Test keyboard-only navigation and visible focus.
8. Test at a narrow viewport and with a touch-capable device.
9. Inspect whether another CSS rule or animation library is overwriting `transform`.
10. Check adjacent controls for overlap or accidental pointer transfer.

### Browser and Compatibility Notes

Pointer Events, CSS transforms, custom properties, and `matchMedia` are supported in modern evergreen browsers. Optional chaining on `MediaQueryList` event methods helps tolerate environments where the newer listener API is unavailable, but if legacy browser support is a project requirement, provide a `addListener`/`removeListener` fallback. Test the exact support matrix used by the product rather than adding compatibility branches without a requirement.

Do not assume that the visual transform changes the element's layout box. It changes rendering and hit testing in ways that can matter around overlapping controls. Test the final effect with real text wrapping, responsive layouts, zoom, and browser accessibility tools.

## Build Challenge: Magnetic CTA for a Creative Portfolio

Build a reusable magnetic CTA for a portfolio homepage with the following requirements:

1. Use a semantic `<a>` if it navigates to a work section, or a `<button>` if it triggers an action.
2. Move the outer control by at most 10 pixels on each axis.
3. Use a strength between `0.12` and `0.18`.
4. Add a small inner-label parallax of at most 4 pixels.
5. Keep the control's layout dimensions fixed while it moves.
6. Ignore touch pointer movement and enable magnetism only for fine hover pointers.
7. Disable the magnetic effect under `prefers-reduced-motion: reduce`.
8. Provide a visible, high-contrast `:focus-visible` style.
9. Reset movement on pointer leave, pointer cancellation, and component cleanup.
10. Implement the interaction as a reusable function or component with a cleanup path.
11. Test it at mobile, tablet, and desktop widths.
12. Verify that the effect does not collide with adjacent links or buttons.
13. Confirm that the control remains usable when JavaScript is disabled: it should still render as a normal link or button with its core styling.
14. Include a short README note explaining the strength, maximum displacement, and accessibility fallback.

### Acceptance Criteria

- [ ] The button never moves beyond the configured maximum.
- [ ] The button returns to its exact rest position after pointer leave.
- [ ] Scrolling does not cause coordinate drift.
- [ ] No layout reflow is triggered by the movement.
- [ ] Touch users receive normal button behavior.
- [ ] Reduced-motion users receive no magnetic movement.
- [ ] Keyboard focus remains visible and stable.
- [ ] The element retains native button or link semantics.
- [ ] Reinitialization does not duplicate event listeners.
- [ ] Cleanup removes listeners and resets visual state.
- [ ] The effect is subtle enough that the control remains easy to target.
- [ ] Neighboring interactive elements remain independently clickable.

### Review Questions

1. Why are `clientX` and `getBoundingClientRect()` a compatible coordinate pair?
2. What is the difference between `strength` and `maxMove`?
3. Why should the button use a transform instead of changing its margins?
4. What problems can arise if a transformed button overlaps a neighboring link?
5. Why is a fine-pointer media query more reliable than a desktop-width breakpoint?
6. What should happen when reduced motion is enabled while the page is already open?
7. Why is listener cleanup part of the interaction's correctness?
8. When would a plain CSS hover state be a better choice than magnetism?

## Production Review Checklist

Before shipping, inspect the effect under realistic conditions rather than only in an isolated demo.

- **Design intent:** Is the interaction reserved for an element that deserves emphasis?
- **Motion range:** Does the displacement remain subtle at the far edge of the activation area?
- **Input support:** Does the control behave normally with touch, pen, mouse, keyboard, and assistive technology?
- **Accessibility:** Is focus visible, is contrast sufficient, and is reduced motion respected?
- **Layout:** Does movement avoid collisions and unexpected stacking-context behavior?
- **Performance:** Are pointer handlers lightweight, and are layout reads limited to what is needed?
- **Lifecycle:** Are listeners removed when the element is detached or the route changes?
- **Maintainability:** Are the strength and maximum displacement explicit configuration values?
- **Fallback:** Does the button remain fully usable if JavaScript fails?
- **Testing:** Has the interaction been checked at different zoom levels and viewport sizes?

A magnetic button is successful when it feels like a quiet response to the visitor's presence. If it draws attention away from the content, makes the target difficult to hit, or needs excessive code to justify its presence, simplify it.
