---
name: custom-cursor
layer: layer-08-micro-interactions
filename: custom_cursor.md
description: Design accessible, performant custom cursor systems for expressive web experiences while preserving native pointer behavior where it matters.
---

# Custom Cursor

## Why This Matters

A custom cursor can make an interface feel art-directed: a portfolio may use a small branded dot, a gallery can reveal contextual labels, and an experimental landing page can make pointer movement part of the visual language. The effect is also unusually easy to overdo. A cursor sits between the user and every interactive element, so lag, poor contrast, incorrect click behavior, or a cursor that disappears on touch devices can make an otherwise polished page frustrating.

Treat the cursor as a presentation layer, not as a replacement for browser interaction. The browser still owns hit testing, focus, selection, drag behavior, link navigation, and keyboard access. A well-built custom cursor follows the pointer, communicates context, and gets out of the way when the platform or user preference makes it inappropriate.

This guide builds cursor treatments that are:
- **Decorative, not obstructive:** the native pointer remains available where needed, and the custom element never intercepts input.
- **Responsive to context:** hoverable links, draggable regions, and media can expose meaningful states without pretending to be controls.
- **Efficient:** pointer updates avoid unnecessary layout work and use transforms for movement.
- **Accessible:** keyboard users retain visible focus, reduced-motion preferences are respected, and touch users are not forced into a hover-only experience.
- **Robust:** the effect handles viewport boundaries, pointer exit, scrolling, route changes, and component unmounting.

The central rule is simple: never sacrifice usability to make the cursor look clever.

## Core Concepts

### 1. Separate the Visual Cursor from Input

The custom cursor should be an absolutely or fixed-positioned visual element. It should not be the thing that receives clicks. Set `pointer-events: none` so the pointer continues to interact with the real page underneath.

```css
.custom-cursor {
  position: fixed;
  inset: 0 auto auto 0;
  pointer-events: none;
  z-index: 10000;
  transform: translate3d(-50%, -50%, 0);
}
```

**Why:** A cursor element that participates in hit testing can block links, buttons, text selection, and drag targets. `pointer-events: none` makes the decorative layer transparent to pointer input.

Keep the cursor's stacking level intentional. A very high `z-index` can place it above dialogs or browser-like overlays; do not automatically assume the largest possible number is correct. Establish a small, documented overlay scale for the application.

### 2. Track the Correct Pointer Type

A mouse, pen, and touch input have different interaction models. A custom cursor generally makes sense for a fine pointer, and often only for a mouse. Touchscreens do not have a continuously visible cursor, so displaying a floating dot after a tap is usually confusing.

Use capability queries rather than assuming a desktop operating system means mouse input:

```css
@media (hover: hover) and (pointer: fine) {
  .custom-cursor {
    display: block;
  }
}

@media (hover: none), (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}
```

**Why:** Hybrid laptops and tablets can have both touch and a trackpad. CSS media features describe the current primary input capabilities more reliably than user-agent sniffing.

If the application has a compelling reason to support multiple pointer types, inspect `event.pointerType` and maintain separate behavior rather than treating every pointer event as a mouse move.

### 3. Use Pointer Events, Not a Collection of Mouse-Only Handlers

`pointermove`, `pointerenter`, `pointerleave`, and `pointerdown` are designed to unify mouse, pen, and touch input. A mouse-only `mousemove` listener can be sufficient for a narrowly defined desktop effect, but pointer events provide a better base for reusable components.

```js
window.addEventListener("pointermove", handlePointerMove, {
  passive: true,
});
```

**Why:** Pointer events create one consistent event model and expose `pointerType`. A passive move listener documents that it will not call `preventDefault()`, avoiding unnecessary scrolling-blocking concerns.

Do not use `preventDefault()` on pointer movement to control the visual cursor. The custom element is a visual follower, not a gesture recognizer.

### 4. Store Coordinates, Then Render on Animation Frames

Pointer events can fire more often than the browser paints. Updating style properties on every event may perform redundant work. Store the latest coordinates, schedule one animation frame, and render the most recent point once per frame.

```js
let pointerX = 0;
let pointerY = 0;
let frameId = 0;

function handlePointerMove(event) {
  pointerX = event.clientX;
  pointerY = event.clientY;

  if (frameId) return;

  frameId = requestAnimationFrame(() => {
    cursor.style.transform =
      `translate3d(${pointerX}px, ${pointerY}px, 0)`;
    frameId = 0;
  });
}
```

**Why:** The browser only displays a finite number of frames per second. Coalescing many input events into one paint-aligned update reduces redundant DOM writes and keeps motion smooth.

The example above uses the top-left of the cursor as the origin. If you want its center at the pointer, apply `translate(-50%, -50%)` in CSS or use a wrapper/inner-element design so the centering transform does not conflict with the movement transform.

### 5. Prefer Transform-Based Movement

Changing `left` and `top` can trigger layout work. For a cursor that moves continuously, use `transform: translate3d(...)` or `translate(...)` and let the browser optimize compositing where possible.

```css
.custom-cursor {
  position: fixed;
  left: 0;
  top: 0;
  will-change: transform;
}
```

**Why:** Transforms usually avoid changing document layout and are the standard choice for smooth decorative movement. `will-change` is a hint, not a guarantee; use it only for the element that actually animates and remove it if the effect is not continuously active.

Avoid adding `will-change: transform` to dozens of cursor trails or every element on the page. Excessive layer promotion can consume memory and hurt performance.

### 6. Define a Clear Coordinate System

`clientX` and `clientY` are viewport-relative, which pairs naturally with `position: fixed`. `pageX` and `pageY` are document-relative, which are better for document-positioned elements. Mixing the two creates cursor offsets after scrolling.

```js
// Fixed cursor: use viewport coordinates.
const x = event.clientX;
const y = event.clientY;
```

**Why:** A fixed element is positioned against the viewport, so viewport coordinates keep the cursor aligned while the document scrolls.

If a cursor is inside a transformed ancestor, the ancestor can establish a containing block for fixed descendants. Prefer rendering the cursor in a top-level overlay near `document.body`, or avoid transformed ancestors around the cursor layer.

### 7. Handle Visibility and Pointer Exit

The custom cursor should not remain stranded at the last pointer position after the pointer leaves the page. Hide it on `pointerleave` from the window and show it when a valid pointer re-enters.

```js
window.addEventListener("pointerleave", () => {
  cursor.classList.add("is-hidden");
});

window.addEventListener("pointerenter", () => {
  cursor.classList.remove("is-hidden");
});
```

**Why:** A persistent dot in the middle of a page looks like a rendering bug and can obscure content. Visibility is part of the interaction state, not merely a styling detail.

Be mindful that pointer boundary events can behave differently around iframes and embedded content. Test the actual page structure, especially if it contains video players or third-party embeds.

### 8. Keep Hover Context Semantic

A cursor can change when it is over a link, button, draggable card, or media item. Derive those states from real semantic elements or explicit data attributes instead of fragile selectors such as `div:nth-child(4)`.

```html
<a href="/work/project-one" data-cursor="View project">
  Project One
</a>
```

```js
const target = event.target.closest("[data-cursor]");
const label = target?.dataset.cursor ?? "";
```

**Why:** Context labels should follow meaning, not DOM position. Semantic anchors and buttons continue to work with keyboards, assistive technologies, and browser conventions.

A cursor label must not be the only indication that an element is interactive. Keep link styling, button affordances, and keyboard focus indicators visible.

### 9. Respect Reduced Motion and User Choice

A custom cursor often introduces lag, scale transitions, spring effects, or trails. Those are motion effects and should respond to `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  .custom-cursor,
  .custom-cursor__label {
    transition: none !important;
    animation: none !important;
  }
}
```

**Why:** Some users find delayed or continuously moving visuals distracting or uncomfortable. Removing decorative interpolation is a low-cost way to make the experience more inclusive.

For particularly expressive cursor systems, provide a site-level preference or automatically fall back to a simple dot when reduced motion is requested. Do not disable the user's ability to navigate the page.

### 10. Keep the Cursor Decorative for Keyboard Users

Keyboard users do not have a pointer to track. Do not hide focus rings because the design expects a cursor animation to communicate hover state.

```css
:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
```

**Why:** Hover and focus are different interaction states. A cursor effect that works with a mouse does not replace focus-visible styles, accessible names, or logical tab order.

When a component has a hover-only reveal, make its essential content available on focus and, where appropriate, on touch.

## Patterns

### Pattern 1: Minimal Vanilla JavaScript Cursor

**Use when:** A small marketing site or portfolio needs a branded dot that follows a mouse without a framework dependency.

This pattern creates the element, attaches listeners, coalesces pointer updates, hides on pointer exit, and cleans up correctly. The visual node is deliberately separate from page controls.

```html
<div class="custom-cursor" aria-hidden="true"></div>
```

```css
.custom-cursor {
  position: fixed;
  left: 0;
  top: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  pointer-events: none;
  z-index: 1000;
  opacity: 0;
  transform: translate3d(-100px, -100px, 0);
  transition: opacity 160ms ease, width 180ms ease, height 180ms ease;
}

.custom-cursor.is-visible {
  opacity: 1;
}

.custom-cursor.is-hidden {
  opacity: 0;
}

@media (hover: none), (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .custom-cursor {
    transition: none;
  }
}
```

```js
function createCustomCursor() {
  const cursor = document.querySelector(".custom-cursor");
  if (!cursor) return () => {};

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );

  if (!finePointer.matches) return () => {};

  let x = 0;
  let y = 0;
  let frameId = 0;
  let destroyed = false;

  function onMove(event) {
    if (event.pointerType === "touch") return;

    x = event.clientX;
    y = event.clientY;

    cursor.classList.add("is-visible");
    cursor.classList.remove("is-hidden");

    if (frameId) return;

    frameId = requestAnimationFrame(() => {
      if (!destroyed) {
        cursor.style.transform =
          `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }
      frameId = 0;
    });
  }

  function onLeave() {
    cursor.classList.remove("is-visible");
    cursor.classList.add("is-hidden");
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);
  window.addEventListener("blur", onLeave);

  return function destroyCustomCursor() {
    destroyed = true;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("blur", onLeave);
    if (frameId) cancelAnimationFrame(frameId);
  };
}

const destroyCursor = createCustomCursor();

// Call destroyCursor() when the owning page/component is removed.
```

**Implementation notes:**
- The returned cleanup function is part of the component contract. Use it when navigating between pages or tearing down the effect.
- The CSS media query hides the cursor on coarse input. The JavaScript check avoids attaching listeners when the primary pointer is not fine.
- This is a progressive enhancement. If JavaScript fails, the real page controls remain fully usable.
- For a centered dot, the example applies a second translation in the inline transform. If another transform is needed for rotation or scaling, consider a nested element to avoid competing transform declarations.

### Pattern 2: Smooth Follow Cursor with Separate Position and Scale Layers

**Use when:** The cursor should have a little inertia or a ring that expands on hover.

Do not combine all behavior into one transform string written by several handlers. Separate the element that moves from the element that scales, so each concern has a clear owner.

```html
<div class="cursor-follower" aria-hidden="true">
  <span class="cursor-follower__shape"></span>
</div>
```

```css
.cursor-follower {
  position: fixed;
  inset: 0 auto auto 0;
  width: 0;
  height: 0;
  pointer-events: none;
  z-index: 1000;
}

.cursor-follower__shape {
  position: absolute;
  left: 0;
  top: 0;
  width: 28px;
  height: 28px;
  border: 1px solid currentColor;
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(1);
  transition: transform 180ms ease, background-color 180ms ease;
}

.cursor-follower.is-hovering .cursor-follower__shape {
  transform: translate(-50%, -50%) scale(1.6);
  background: rgb(255 255 255 / 12%);
}

@media (prefers-reduced-motion: reduce) {
  .cursor-follower__shape {
    transition: none;
  }
}
```

```js
function mountFollowerCursor(root = document) {
  const follower = root.querySelector(".cursor-follower");
  if (!follower) return () => {};

  let x = 0;
  let y = 0;
  let renderedX = 0;
  let renderedY = 0;
  let frameId = 0;
  let active = true;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function onMove(event) {
    if (event.pointerType === "touch") return;
    x = event.clientX;
    y = event.clientY;

    if (reduceMotion) {
      follower.style.transform =
        `translate3d(${x}px, ${y}px, 0)`;
      return;
    }

    if (!frameId) frameId = requestAnimationFrame(render);
  }

  function render() {
    frameId = 0;
    if (!active) return;

    // Exponential easing is stable across different frame rates.
    const ease = 0.22;
    renderedX += (x - renderedX) * ease;
    renderedY += (y - renderedY) * ease;

    follower.style.transform =
      `translate3d(${renderedX}px, ${renderedY}px, 0)`;

    const stillMoving =
      Math.abs(x - renderedX) > 0.1 ||
      Math.abs(y - renderedY) > 0.1;

    if (stillMoving) frameId = requestAnimationFrame(render);
  }

  function onOver(event) {
    const target = event.target instanceof Element
      ? event.target.closest("a, button, [data-cursor-hover]")
      : null;
    follower.classList.toggle("is-hovering", Boolean(target));
  }

  function onLeave() {
    follower.classList.remove("is-hovering");
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver);
  window.addEventListener("pointerleave", onLeave);

  return () => {
    active = false;
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    window.removeEventListener("pointerleave", onLeave);
    if (frameId) cancelAnimationFrame(frameId);
  };
}

const unmountFollower = mountFollowerCursor();
```

**Why the separate layers matter:** Position and scale are independent transformations. A dedicated inner shape can scale while the outer follower tracks the pointer, preventing one update from accidentally overwriting another. The render loop stops when the target is close enough, so it does not run forever while the pointer is idle.

### Pattern 3: Context Label on Semantic Targets

**Use when:** A portfolio or image gallery wants labels such as “Open project,” “Drag,” or “Explore.”

The label is visual context, not an accessible replacement for the target's text or accessible name.

```html
<div class="context-cursor" aria-hidden="true">
  <span class="context-cursor__label"></span>
</div>

<a href="/projects/atlas" data-cursor="View project">
  Atlas project
</a>

<div class="gallery-card" data-cursor="Explore image">
  <!-- Image and visible descriptive content -->
</div>
```

```css
.context-cursor {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 1000;
  opacity: 0;
  transition: opacity 120ms ease;
}

.context-cursor.is-visible {
  opacity: 1;
}

.context-cursor__label {
  display: block;
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  color: white;
  background: #171717;
  font: 600 0.75rem/1 system-ui, sans-serif;
  white-space: nowrap;
  transform: translate(14px, 14px);
}

@media (hover: none), (pointer: coarse) {
  .context-cursor {
    display: none;
  }
}
```

```js
function mountContextCursor() {
  const cursor = document.querySelector(".context-cursor");
  const label = cursor?.querySelector(".context-cursor__label");
  if (!cursor || !label) return () => {};

  let x = 0;
  let y = 0;
  let frameId = 0;

  function onMove(event) {
    if (event.pointerType === "touch") return;
    x = event.clientX;
    y = event.clientY;

    if (!frameId) {
      frameId = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        frameId = 0;
      });
    }
  }

  function onOver(event) {
    const target = event.target instanceof Element
      ? event.target.closest("[data-cursor]")
      : null;

    const text = target?.getAttribute("data-cursor") ?? "";
    label.textContent = text;
    cursor.classList.toggle("is-visible", Boolean(text));
  }

  function onLeave() {
    cursor.classList.remove("is-visible");
  }

  document.addEventListener("pointerover", onOver);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);

  return () => {
    document.removeEventListener("pointerover", onOver);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerleave", onLeave);
    if (frameId) cancelAnimationFrame(frameId);
  };
}

const unmountContextCursor = mountContextCursor();
```

**Safety and usability notes:**
- Use `textContent`, not `innerHTML`, for data-driven labels. The label should be text, not an HTML injection surface.
- Keep the cursor label short. Long labels can cover the item itself and make the effect harder to understand.
- Use actual visible content and semantic controls for the action. A label like “Drag” does not make a static `div` draggable.
- If the effect conveys important instructions, repeat them in the interface instead of showing them only beside the pointer.

### Pattern 4: React Cursor Component with Lifecycle Cleanup

**Use when:** A React application needs one shared cursor mounted at the application shell.

Mount a single cursor at the app root rather than rendering one cursor per card. The effect subscribes once and cleans up when the component unmounts.

```jsx
import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const cursorRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const finePointer = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    );

    if (!finePointer.matches) return;

    let x = 0;
    let y = 0;
    let frameId = 0;

    function onMove(event) {
      if (event.pointerType === "touch") return;

      x = event.clientX;
      y = event.clientY;
      setVisible(true);

      if (frameId) return;

      frameId = requestAnimationFrame(() => {
        cursor.style.transform =
          `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        frameId = 0;
      });
    }

    function onLeave() {
      setVisible(false);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className={`custom-cursor ${visible ? "is-visible" : ""}`}
    />
  );
}
```

```css
.custom-cursor {
  position: fixed;
  left: 0;
  top: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
  pointer-events: none;
  z-index: 1000;
  opacity: 0;
}

.custom-cursor.is-visible {
  opacity: 1;
}
```

**React considerations:**
- Avoid storing every pointer coordinate in React state. Pointer movement can be extremely frequent, and state updates would cause repeated component renders.
- A ref and direct style update are appropriate for this high-frequency decorative effect; state is reserved for coarse changes such as visibility.
- If the app uses server-side rendering, do not read `window` during render. The example reads browser APIs inside `useEffect`.
- In a production application, listen for changes to the media query if the active pointer capability can change while the page remains open.
- Render the component once in the shared shell. Multiple instances will compete visually and attach duplicate listeners.

### Pattern 5: Explicit Hover States with Delegated Events

**Use when:** Many links and cards need cursor feedback, and the page content is dynamic.

Delegated events let one listener inspect the target instead of attaching handlers to every item. The selector should identify semantic controls first, then optionally include custom targets.

```js
function mountHoverState(cursor) {
  function onPointerOver(event) {
    if (!(event.target instanceof Element)) return;

    const target = event.target.closest(
      "a[href], button, [role='button'], [data-cursor-hover]"
    );

    cursor.classList.toggle("is-hovering", Boolean(target));
  }

  function onPointerOut(event) {
    if (!(event.target instanceof Element)) return;

    const nextTarget = event.relatedTarget instanceof Element
      ? event.relatedTarget.closest(
          "a[href], button, [role='button'], [data-cursor-hover]"
        )
      : null;

    const currentTarget = event.target.closest(
      "a[href], button, [role='button'], [data-cursor-hover]"
    );

    if (currentTarget && currentTarget !== nextTarget) {
      cursor.classList.toggle("is-hovering", Boolean(nextTarget));
    }
  }

  document.addEventListener("pointerover", onPointerOver);
  document.addEventListener("pointerout", onPointerOut);

  return () => {
    document.removeEventListener("pointerover", onPointerOver);
    document.removeEventListener("pointerout", onPointerOut);
  };
}
```

**Why delegation helps:** It reduces per-element listeners and naturally supports content inserted later. It does not remove the need for semantic markup or keyboard behavior.

**Caution:** `pointerover` and `pointerout` bubble and may fire as the pointer moves between descendants. For complex nested components, compare `relatedTarget` carefully or use `pointerenter`/`pointerleave` on a small set of stable roots.

### Pattern 6: Cursor That Falls Back for Reduced Motion

**Use when:** A design uses a spring, delayed follower, or trail and needs a reliable reduced-motion mode.

Reduced motion should simplify the effect rather than make the page less usable. A simple immediate dot—or no custom cursor at all—is preferable to a persistent easing loop.

```js
function mountMotionAwareCursor(cursor) {
  const preference = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let frameId = 0;
  let x = 0;
  let y = 0;
  let renderedX = 0;
  let renderedY = 0;
  let destroyed = false;

  function render() {
    frameId = 0;
    if (destroyed) return;

    if (preference.matches) {
      renderedX = x;
      renderedY = y;
    } else {
      const ease = 0.24;
      renderedX += (x - renderedX) * ease;
      renderedY += (y - renderedY) * ease;
    }

    cursor.style.transform =
      `translate3d(${renderedX}px, ${renderedY}px, 0)`;

    if (
      !preference.matches &&
      (Math.abs(x - renderedX) > 0.15 ||
       Math.abs(y - renderedY) > 0.15)
    ) {
      frameId = requestAnimationFrame(render);
    }
  }

  function onMove(event) {
    if (event.pointerType === "touch") return;
    x = event.clientX;
    y = event.clientY;
    if (!frameId) frameId = requestAnimationFrame(render);
  }

  function onPreferenceChange() {
    if (preference.matches && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      renderedX = x;
      renderedY = y;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  preference.addEventListener?.("change", onPreferenceChange);

  return () => {
    destroyed = true;
    window.removeEventListener("pointermove", onMove);
    preference.removeEventListener?.("change", onPreferenceChange);
    if (frameId) cancelAnimationFrame(frameId);
  };
}
```

**Compatibility note:** Modern browsers support `MediaQueryList.addEventListener`; the optional call avoids throwing in environments that lack it. If supporting older browsers, add a guarded `addListener` fallback and test the actual browser matrix.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Leaving `pointer-events` enabled | The visual layer blocks real controls or text selection | Set `pointer-events: none` on the cursor and its decorative children |
| Hiding the native cursor globally without a fallback | Keyboard, touch, embedded areas, and loading failures can leave users confused | Hide the native cursor only on the intended fine-pointer region, and preserve a fallback |
| Using `pageX` with `position: fixed` | The cursor drifts after scrolling | Pair fixed positioning with `clientX` and `clientY` |
| Updating React state for every coordinate | Creates excessive renders and can make the page stutter | Keep high-frequency coordinates in refs or local variables; update state only for discrete states |
| Running a perpetual animation loop | Wastes CPU and battery when the pointer is idle | Schedule frames only while the target is moving and stop near the destination |
| Attaching a listener to every card | Adds unnecessary setup and makes dynamic content harder | Use a delegated listener where appropriate |
| Ignoring pointer exit | Leaves a dot stranded over content | Hide on window pointer exit and window blur |
| Showing the cursor on touch | Creates an interaction model that touch users do not have | Gate the effect with hover/pointer media queries and ignore touch pointer events |
| Using `innerHTML` for cursor labels | Turns content into an injection surface | Assign labels through `textContent` |
| Making hover the only signal | Keyboard and touch users lose information | Keep semantic labels, visible affordances, and `:focus-visible` styles |
| Removing focus outlines | Makes keyboard navigation difficult to track | Design a visible focus indicator independent of the custom cursor |
| Setting an extreme `z-index` without testing overlays | Cursor can appear over modals or important system-like layers | Use a documented overlay scale and test dialogs, menus, and toasts |
| Forgetting cleanup | Duplicate listeners and animation frames survive route changes | Return a teardown function and cancel pending frames |
| Putting the cursor inside a transformed container | Fixed positioning may become relative to that ancestor | Mount it near the top-level document overlay |
| Using low-contrast cursor colors | The dot disappears against light or dark sections | Test across the whole palette and use a contrast-aware treatment |
| Treating the label as an accessible name | Screen-reader and keyboard users may not receive the same information | Keep accessible names on the real target; mark the decorative cursor `aria-hidden="true"` |
| Applying `will-change` everywhere | Consumes compositing memory | Use it sparingly and only where profiling supports it |
| Ignoring embedded frames | The cursor may vanish or not receive events while over an iframe | Test embedded media and define a fallback around frame boundaries |
| Over-animating size and shape | Cursor movement competes with the page content | Keep state changes subtle and short, with reduced-motion support |
| Assuming desktop equals mouse | Hybrid devices may primarily use touch | Use media features and pointer type, not user-agent strings |
| Using a custom cursor on every page by default | Adds complexity where it has no design value | Restrict it to surfaces where it supports the visual concept |

## Mental Models

1. **A cursor is a visual overlay, not an input device.** The browser continues to own hit testing and interaction. The custom layer observes and decorates.
2. **Pointer events are data; animation frames are presentation.** Store the latest input, then paint at the browser's pace.
3. **Coordinate systems must match.** Viewport coordinates pair with fixed positioning; document coordinates pair with document-relative positioning.
4. **Hover is not focus.** Mouse affordances and keyboard affordances are separate states that must both be designed.
5. **The simplest fallback is a feature.** If pointer capability, motion preference, or lifecycle makes the effect unsuitable, the page should still feel complete.
6. **One shared cursor beats many competing cursors.** A single app-level visual layer is easier to tune, profile, and clean up.
7. **Motion must stop when there is nothing to animate.** A decorative effect should not consume a permanent render loop while idle.

## Quick Reference

### CSS essentials

```css
.custom-cursor {
  position: fixed;
  left: 0;
  top: 0;
  pointer-events: none;
  z-index: 1000;
  will-change: transform;
}

@media (hover: none), (pointer: coarse) {
  .custom-cursor {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .custom-cursor {
    transition: none;
    animation: none;
  }
}

:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
```

### Event and property checklist

| Need | Use |
|---|---|
| Track viewport pointer position | `pointermove` with `clientX` / `clientY` |
| Avoid redundant DOM writes | `requestAnimationFrame` |
| Let real controls receive input | `pointer-events: none` |
| Support mouse, pen, and touch intentionally | `PointerEvent.pointerType` |
| Detect hover-capable fine input | `(hover: hover) and (pointer: fine)` |
| Detect reduced motion | `matchMedia("(prefers-reduced-motion: reduce)")` |
| Hide when leaving the page | `pointerleave` and `blur` |
| Provide contextual labels | Semantic targets plus `data-cursor` |
| Avoid unsafe label rendering | `textContent` |
| Avoid React render storms | Refs/local variables for coordinates |
| Prevent stale listeners | Cleanup function on teardown |

### Debugging sequence

1. Confirm the cursor element exists and is visible in the DOM.
2. Verify `pointer-events: none` is applied.
3. Check that the pointer capability media query matches the current device.
4. Log `event.clientX`, `event.clientY`, and `event.pointerType`.
5. Confirm fixed positioning is not trapped by a transformed ancestor.
6. Check for an overriding `transform`, `opacity`, `display`, or `z-index`.
7. Inspect whether the animation-frame callback is scheduled and reset correctly.
8. Confirm the cleanup function is not being called too early.
9. Test at the top, middle, and bottom of a scrolled page.
10. Test keyboard focus, touch, reduced motion, dialogs, and iframes before release.

### Production checklist

- [ ] Decorative cursor is `aria-hidden="true"`.
- [ ] Cursor and descendants use `pointer-events: none`.
- [ ] Native controls still receive clicks, drags, and text selection.
- [ ] Touch and coarse-pointer devices receive an appropriate fallback.
- [ ] Keyboard focus remains clearly visible.
- [ ] Reduced-motion preference removes unnecessary interpolation and trails.
- [ ] Pointer coordinates match the chosen positioning system.
- [ ] Pointer exit and window blur hide the effect.
- [ ] Event listeners and pending animation frames are cleaned up.
- [ ] No unnecessary React state updates occur per pointer event.
- [ ] Cursor contrast is tested over every major surface.
- [ ] Dialogs, menus, sticky headers, and embedded media are tested.
- [ ] The effect does not run a permanent loop while idle.
- [ ] The cursor is used only where it contributes to the design.

## Build Challenge

Build a custom cursor system for a creative portfolio with a hero section, project grid, and a media gallery.

### Requirements

1. Create a small dot that follows the pointer using `requestAnimationFrame`.
2. Add a ring that grows subtly when the pointer enters an anchor or button.
3. Display short context labels for selected project cards using `data-cursor`.
4. Hide the decorative cursor when the pointer leaves the viewport or the window loses focus.
5. Disable the custom treatment for coarse pointers and touch input.
6. Respect `prefers-reduced-motion` by removing easing and nonessential transitions.
7. Preserve native pointer input and all keyboard focus indicators.
8. Mount one shared cursor layer and provide explicit cleanup.
9. Use `textContent` for labels and keep the cursor `aria-hidden`.
10. Test behavior over light backgrounds, dark backgrounds, a modal dialog, and an embedded iframe.

### Acceptance criteria

- Links and buttons remain clickable and text remains selectable.
- Cursor coordinates stay aligned after scrolling.
- The cursor never remains stranded after pointer exit.
- No continuous animation loop runs while the pointer is idle.
- Keyboard users can identify focus without a mouse cursor.
- Touch users can complete all tasks without hover.
- Reduced-motion mode has no spring follower or trail.
- Labels are concise, safe to render, and supplementary to visible content.
- The implementation can be destroyed without leaving listeners or animation frames behind.

### Review questions

1. Why is `pointer-events: none` essential for a decorative cursor?
2. When should you choose `clientX` instead of `pageX`?
3. Why should pointer coordinates not normally be stored in React state?
4. What is the difference between hover feedback and keyboard focus?
5. How do pointer media queries improve behavior on hybrid devices?
6. Why is a frame loop that continues while idle a performance smell?
7. What should happen when the reduced-motion preference changes while the page is open?
8. Why should cursor labels use `textContent` rather than `innerHTML`?
9. What layout issue can a transformed ancestor create for a fixed cursor?
10. Which interactions must remain fully functional if the custom cursor fails to load?
