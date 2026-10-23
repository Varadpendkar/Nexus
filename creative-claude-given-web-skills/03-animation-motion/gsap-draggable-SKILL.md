# GSAP Draggable — Production Skill

## Why This Matters

Dragging is deceptively difficult to ship well. A demo can move a card with a pointer in ten lines, yet production interactions fail when a user drags on a touchscreen and the page scrolls instead, when a nested button accidentally starts a drag, when responsive layout changes invalidate the bounds, when keyboard users cannot perform the same action, or when a component unmounts while a pointer interaction is active. Poorly constrained dragging can send an object off-screen, stale instances can keep event listeners alive, and careless animation can make the interface feel slippery or unpredictable.

GSAP Draggable provides a mature interaction layer for mouse, touch, and pointer-driven dragging. This skill teaches how to integrate it with semantic HTML, define constraints, communicate state accessibly, measure performance, and clean up instances correctly. The goal is not merely to make an element move; it is to make movement intentional, testable, reversible, and usable across input methods.

> **Scope note:** GSAP Draggable is a GSAP plugin. Register it explicitly. InertiaPlugin is a separate, separately licensed GSAP plugin; do not assume it is available just because Draggable is installed. Verify your package and license before using inertia features.

### 1. Mental Models

1. **The draggable is an interaction controller, not your data model.** It manages pointer interaction and visual movement. Your application remains responsible for the meaning of the final position or selected value.
2. **Constraints are part of the interaction contract.** Bounds, snapping, and allowed axes define where a user is permitted to take an object, not just where it looks best.
3. **Visual position and semantic state are separate.** A card may be translated 120 pixels, but the application may need to store a lane ID, a percentage, a date, or a normalized coordinate instead.
4. **Pointer ownership must be explicit.** Decide whether a gesture means drag, click, page scroll, text selection, or activation of a nested control.
5. **Every pointer interaction needs a non-pointer equivalent.** Keyboard controls, buttons, menus, and form inputs should provide the same meaningful outcome.
6. **Bounds are measured facts, not constants.** Responsive containers, font loading, content changes, and viewport resizing can change the valid movement area.
7. **Cleanup is correctness.** A draggable instance owns listeners and state; kill it when its element or owning component goes away.
8. **Motion should preserve intent.** Resistance, snapping, and inertia should help users understand the result rather than make the control feel unpredictable.

### 2. Setup and Registration

Install GSAP through your package manager and register the plugin once in the module that creates the interaction. In bundler environments, import paths should match the installed GSAP package and build setup.

```js
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

const instances = Draggable.create(".drag-handle", {
  type: "x,y",
  bounds: ".drag-stage"
});

console.log("Created draggable instances:", instances.length);
```

`Draggable.create()` returns an array of Draggable instances, even when the selector matches one element. Keep the returned instance when you need to inspect it, update it, or destroy it later. In production code, prefer a stable element reference over a broad selector if the component lifecycle is explicit.

**Gotcha:** A plugin import can succeed in development but fail in a different build target if the bundler or package version differs. Confirm the installed GSAP version, import path, and plugin registration in the actual production build.

### 3. Choose the Correct Draggable Type

The `type` option determines which transform or scroll axis is controlled. `"x,y"` allows two-dimensional movement; `"x"` restricts horizontal movement; `"y"` restricts vertical movement. `"rotation"` supports rotation-style interaction. `"scroll"` can be used for scroll-oriented dragging where supported by the plugin's API and target setup. Choose the smallest interaction model that matches the task.

```js
const [card] = Draggable.create(cardElement, {
  type: "x",
  bounds: stageElement,
  edgeResistance: 0.85,
  onDrag() {
    console.log("Horizontal position:", this.x);
  }
});
```

For most UI cards and handles, transform-based `x` and `y` movement is preferable to repeatedly changing `top` and `left`. Transforms avoid the common layout recalculation associated with positioning changes and usually keep the motion smoother. Do not animate layout properties unless the layout semantics require it and profiling shows the tradeoff is acceptable.

### 4. Use Semantic Markup

Use elements that communicate their purpose. A draggable card can be an `<article>` within a labelled region; an interactive handle can be a `<button>`; a reorderable list should be a `<ul>` with `<li>` items. Avoid using generic containers for every structural element.

```html
<section class="drag-board" aria-labelledby="board-title">
  <h2 id="board-title">Arrange priorities</h2>
  <p id="drag-help">Drag a card, or use the move buttons to reorder it.</p>
  <ul class="priority-list" id="priority-list">
    <li class="priority-card" data-id="research">
      <button class="drag-handle" type="button" aria-label="Drag Research card" aria-describedby="drag-help">⠿</button>
      <span>Research</span>
      <button class="move-up" type="button" aria-label="Move Research up">Move up</button>
      <button class="move-down" type="button" aria-label="Move Research down">Move down</button>
    </li>
    <li class="priority-card" data-id="prototype">
      <button class="drag-handle" type="button" aria-label="Drag Prototype card" aria-describedby="drag-help">⠿</button>
      <span>Prototype</span>
      <button class="move-up" type="button" aria-label="Move Prototype up">Move up</button>
      <button class="move-down" type="button" aria-label="Move Prototype down">Move down</button>
    </li>
  </ul>
  <p class="sr-only" id="drag-status" role="status" aria-live="polite"></p>
</section>
```

A native button is a better handle than a styled `<span>` because it is keyboard focusable and exposes a control role. However, keyboard focus alone does not create keyboard dragging; add explicit actions that reorder the item or change its value. Keep the item label separate from the handle's accessible name.

### 5. Build a Safe Drag Stage

A stage establishes a clear coordinate system and visible bounds. Avoid mixing unrelated positioned ancestors, transforms, and overflow rules without understanding which box Draggable is measuring.

```css
.drag-stage {
  position: relative;
  min-height: 24rem;
  overflow: clip;
  border: 1px solid #cbd5e1;
  border-radius: 1rem;
  background: #f8fafc;
  isolation: isolate;
}

.drag-card {
  position: absolute;
  inset: 1rem auto auto 1rem;
  width: min(18rem, calc(100% - 2rem));
  touch-action: none;
  user-select: none;
  cursor: grab;
}

.drag-card:active {
  cursor: grabbing;
}

.drag-handle {
  cursor: grab;
  touch-action: none;
}

.drag-handle:focus-visible,
.move-up:focus-visible,
.move-down:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

`touch-action: none` tells the browser not to perform its default touch gestures on that element. Apply it narrowly to the drag surface or handle, not to the whole page. For vertical drag interactions that should preserve horizontal page gestures, investigate the appropriate directional `touch-action` value and test on real touch devices.

**Gotcha:** If the draggable element is also the only way to scroll a page, `touch-action: none` can make the page feel trapped. Restrict the gesture surface and preserve a clear way to scroll and reach controls.

### 6. Constrain Movement with Bounds

Use `bounds` to limit the element to a container, element, or supported bounds object. Element bounds are generally safer than hard-coded pixel limits because they can follow layout. Ensure the dragged element's size is included in the expected behavior and test edges with different viewport sizes.

```js
const stage = document.querySelector(".drag-stage");
const card = document.querySelector(".drag-card");

const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  onDrag() {
    if (this.hitTest(stage, "100%")) {
      console.log("Card intersects the stage boundary");
    }
  }
});

console.log("Bounds source:", stage.getBoundingClientRect());
```

Use the plugin's documented bounds behavior rather than calculating a new maximum on every pointer event. If a custom coordinate model is required, measure at lifecycle boundaries such as initialization, resize, or content change. For responsive changes, refresh or recreate the interaction after the new layout has settled.

### 7. Distinguish `edgeResistance` from `dragResistance`

`dragResistance` slows the element's response across the whole drag; `edgeResistance` controls resistance as it approaches a configured boundary. These settings are not interchangeable. Start with no resistance unless the interaction benefits from it, then tune values with real devices and user testing.

```js
const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  dragResistance: 0.05,
  edgeResistance: 0.8,
  onDrag() {
    // Inspect this.x and this.y during a real drag.
  }
});
```

Resistance values are normalized configuration values, not durations or easing curves. Document why a value exists. If the task requires exact placement, such as arranging a diagram, resistance may make the control feel imprecise; if it is a playful bounded object, modest edge resistance may communicate the limit.

### 8. Use Snapping for Discrete Destinations

Snapping maps a free position to a set of meaningful destinations. Use it for a timeline, board, slider-like control, or grid. Avoid snapping every movement to arbitrary pixel intervals when the product's data model is discrete.

```js
const gridSize = 80;

const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  liveSnap: {
    x: value => Math.round(value / gridSize) * gridSize,
    y: value => Math.round(value / gridSize) * gridSize
  },
  onDragEnd() {
    console.log("Snapped position:", this.x, this.y);
  }
});
```

Use `liveSnap` when the element should align during movement. Use a release-time snap configuration when the visual should move freely and settle at release. Confirm the exact supported snap configuration for the installed GSAP version. If the snap function rounds beyond bounds, clamp or derive the snap points from the available area so a destination cannot push the object outside the stage.

**Gotcha:** A snap function based on a fixed grid can produce an invalid last column or row when the stage width is not a multiple of the grid size. Derive valid destinations from measured bounds, not only from a grid constant.

### 9. Add Callbacks Without Doing Heavy Work

Callbacks expose lifecycle moments such as press, drag, release, drag end, click, and—in a configuration that uses inertia—throw updates and completion. Use them to update small pieces of state or record analytics, not to rebuild the entire DOM on every pointer movement.

```js
const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  onPress() {
    card.classList.add("is-dragging");
  },
  onDrag() {
    card.dataset.x = String(Math.round(this.x));
    card.dataset.y = String(Math.round(this.y));
  },
  onRelease() {
    card.classList.remove("is-dragging");
  },
  onDragEnd() {
    console.log("Drag ended at", this.x, this.y);
  }
});
```

Callbacks are often invoked with the Draggable instance as `this`; arrow functions do not create their own `this`, but avoid relying on `this` if your codebase's linting or TypeScript settings make the callback contract unclear. Prefer the documented callback parameters and instance API for your installed version.

Keep `onDrag` cheap. Avoid synchronous network requests, large state updates, repeated DOM queries, expensive geometry reads, and full list re-renders. If you must persist a final position, do so on release or drag end and debounce any expensive follow-up work.

### 10. Prevent Accidental Drags from Nested Controls

A card may contain links, buttons, text inputs, or selection controls. Do not make every click target initiate dragging. Draggable provides configuration options such as `trigger` and `clickableTest` to shape the gesture area; use the official API for the exact installed version.

```js
const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  trigger: card.querySelector(".drag-handle"),
  clickableTest(element) {
    return Boolean(element.closest("button, a, input, textarea, select, label"));
  }
});
```

A dedicated handle creates a predictable interaction. If the entire card must be draggable, test nested interactive elements carefully and ensure the user can activate links and buttons without moving the card. Do not stop propagation globally as a first resort; it can break legitimate parent behavior and event delegation.

### 11. Provide Keyboard Alternatives

Pointer dragging alone is not an accessible interaction. For a reorderable list, provide Move up and Move down buttons, keyboard shortcuts with visible instructions, or another non-dragging mechanism that changes the same underlying order. Announce successful changes using a live region and preserve focus on the item that moved.

```js
const list = document.querySelector("#priority-list");
const status = document.querySelector("#drag-status");

list.addEventListener("click", event => {
  const button = event.target.closest(".move-up, .move-down");
  if (!button) return;

  const item = button.closest("li");
  if (!item) return;

  if (button.classList.contains("move-up") && item.previousElementSibling) {
    list.insertBefore(item, item.previousElementSibling);
  } else if (button.classList.contains("move-down") && item.nextElementSibling) {
    list.insertBefore(item.nextElementSibling, item);
  } else {
    return;
  }

  status.textContent = `${item.querySelector("span").textContent} moved.`;
  item.querySelector(button.classList.contains("move-up") ? ".move-up" : ".move-down").focus();
});
```

Accessibility is not complete merely because the handle has `tabindex="0"`. A focusable element needs an understandable role, name, instructions, and keyboard behavior. For sortable lists, use clear buttons with disabled states at the first and last positions. Ensure focus remains predictable after a reorder, and test with keyboard-only navigation and a screen reader.

### 12. Map Visual Movement to Application State

The Draggable instance reports visual coordinates. Your application may need normalized values or domain values. For a freeform canvas, convert coordinates relative to the stage; for a board, store a destination column and item order rather than raw pixels.

```js
function normalizedPosition(element, stage) {
  const itemRect = element.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  const maxX = Math.max(1, stageRect.width - itemRect.width);
  const maxY = Math.max(1, stageRect.height - itemRect.height);

  return {
    x: Math.min(1, Math.max(0, (itemRect.left - stageRect.left) / maxX)),
    y: Math.min(1, Math.max(0, (itemRect.top - stageRect.top) / maxY))
  };
}

const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  onDragEnd() {
    const position = normalizedPosition(card, stage);
    console.log("Persist normalized position:", position);
  }
});
```

Be careful with transformed ancestors and scrolling: `getBoundingClientRect()` returns viewport-relative geometry, while Draggable's `x` and `y` are transform-related values. Do not assume these coordinate spaces are interchangeable. Test the conversion after scrolling, resizing, and changing the stage's dimensions.

### 13. Inertia Is Optional and Requires the Right Plugin

Inertia can make a drag continue after release and settle at a destination. It can improve a freeform or carousel-like experience, but it can also reduce precision, create motion sensitivity issues, and make the final result harder to predict. GSAP's InertiaPlugin is separate and subject to its licensing terms; do not ship code that references it unless the project has access to it.

```js
// Only use this configuration if InertiaPlugin is available and licensed.
import { InertiaPlugin } from "gsap/InertiaPlugin";

gsap.registerPlugin(Draggable, InertiaPlugin);

const [drag] = Draggable.create(card, {
  type: "x",
  bounds: stage,
  inertia: true,
  snap: {
    x: value => Math.round(value / 120) * 120
  },
  onThrowComplete() {
    console.log("Inertial movement completed");
  }
});
```

Verify the current plugin documentation and license before using this example. Without InertiaPlugin, remove the `inertia` option and throw-specific callbacks. Never imply that a missing licensed plugin can be fixed by adding a random npm package or by registering a placeholder.

### 14. Respect Reduced Motion Preferences

Dragging itself may be a direct manipulation rather than decorative animation, so do not automatically disable every drag when reduced motion is enabled. Instead, reduce or remove inertia, overshoot, and settling animations; preserve immediate user control and provide a non-dragging alternative.

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function createDrag() {
  return Draggable.create(card, {
    type: "x,y",
    bounds: stage,
    dragResistance: 0,
    edgeResistance: reduceMotion.matches ? 1 : 0.8
  })[0];
}

let drag = createDrag();

reduceMotion.addEventListener("change", () => {
  drag?.kill();
  drag = createDrag();
});
```

Use the media preference as one input to the motion policy, not as a substitute for user testing. Accessibility includes clear focus indicators, meaningful labels, alternatives to dragging, stable focus, sufficient target size, and understandable status messages. Test both preference states and verify that a change in preference does not create duplicate instances.

### 15. Handle Responsive Bounds and Resize

The container may resize because of viewport changes, sidebars, content updates, or font loading. Recalculate or recreate bounds when the layout changes, and avoid rebuilding the plugin on every animation frame. A `ResizeObserver` can identify meaningful element-size changes; disconnect it during cleanup.

```js
const stageObserver = new ResizeObserver(() => {
  // Refresh geometry only after the layout change is meaningful.
  drag?.applyBounds(stage);
});

stageObserver.observe(stage);

function destroyDrag() {
  stageObserver.disconnect();
  drag?.kill();
}
```

Confirm `applyBounds()` availability and behavior in the installed GSAP version. If your version does not support it, kill and recreate the instance using the updated element bounds. Debounce or schedule work when a resize causes many notifications, and do not read geometry in a tight loop.

**Gotcha:** Recreating a draggable during an active pointer gesture can feel like a jump or leave the interaction in a confusing state. Prefer applying updated bounds when supported, or defer recreation until the gesture has ended.

### 16. Clean Up Instances Reliably

A Draggable instance can retain event listeners and references. Kill it when its owning UI is removed, when a route changes, or when a framework component unmounts. If you created several instances, keep and clean up all of them.

```js
const draggables = Draggable.create(".drag-card", {
  type: "x,y",
  bounds: stage
});

function destroyAllDraggables() {
  draggables.forEach(instance => instance.kill());
}
```

In React, create the instance in an effect after the element exists and return a cleanup function. Be careful with development Strict Mode, which can mount, clean up, and mount effects again to reveal lifecycle bugs. Use refs instead of querying the entire document, and avoid constructing Draggable during render.

```jsx
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

export function DragCard() {
  const cardRef = useRef(null);
  const stageRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current || !stageRef.current) return;
    const [instance] = Draggable.create(cardRef.current, {
      type: "x,y",
      bounds: stageRef.current
    });
    return () => instance.kill();
  }, []);

  return (
    <section ref={stageRef} className="drag-stage" aria-label="Drag area">
      <article ref={cardRef} className="drag-card">
        <h3>Draggable card</h3>
        <p>Use the provided move controls for keyboard access.</p>
      </article>
    </section>
  );
}
```

This snippet illustrates lifecycle ownership, but a production React component must also include keyboard alternatives, visible instructions, and appropriate touch behavior. For React apps that use GSAP broadly, consider the GSAP React integration (`useGSAP`) and follow its current cleanup guidance.

### 17. Use a Stable Cleanup Pattern in Plain JavaScript

Keep setup and teardown close together. Avoid global one-off setup that cannot be reversed when a component is removed or a page is replaced.

```js
function mountDraggable(element, bounds) {
  const [instance] = Draggable.create(element, {
    type: "x,y",
    bounds,
    onPress() {
      element.classList.add("is-dragging");
    },
    onRelease() {
      element.classList.remove("is-dragging");
    }
  });

  return () => {
    element.classList.remove("is-dragging");
    instance.kill();
  };
}

const card = document.querySelector(".drag-card");
const stage = document.querySelector(".drag-stage");
const unmount = mountDraggable(card, stage);

// Call unmount() when this UI is removed.
```

A cleanup function should be idempotent when practical: calling it twice should not crash or create new side effects. If the app can replace the target element, make sure the old instance is killed before a new one is created.

### 18. Debug with Measured Geometry

When dragging jumps, escapes bounds, or stops responding, inspect the element, its ancestors, computed styles, transform state, and instance properties. Confirm that the selector resolves to the intended element and that the bounds element is in the expected coordinate context.

```js
function inspectDraggable(instance, element, bounds) {
  const report = {
    target: element,
    bounds: bounds?.getBoundingClientRect(),
    rect: element.getBoundingClientRect(),
    transform: getComputedStyle(element).transform,
    x: instance.x,
    y: instance.y,
    isPressed: instance.isPressed,
    isDragging: instance.isDragging
  };

  console.table(report);
  return report;
}

inspectDraggable(drag, card, stage);
```

Debug sequence:
1. Confirm the target and bounds references are non-null.
2. Confirm Draggable is registered and the plugin version is the one you expect.
3. Inspect `getBoundingClientRect()` for the target and stage.
4. Inspect computed `transform`, `touch-action`, `overflow`, and `position`.
5. Reproduce with mouse, touch, and keyboard alternatives.
6. Temporarily remove custom transforms on ancestors to isolate coordinate issues.
7. Check the console for duplicate setup, missing plugin imports, and stale references.
8. Profile the interaction for layout reads, heavy callbacks, dropped frames, and unnecessary rendering.

Use DevTools' Elements panel to inspect computed styles, Event Listeners to identify unexpected handlers, and Performance recordings to find long tasks and dropped frames. Test Safari, Firefox, and Chromium-based browsers; verify support for CSS features such as `overflow: clip` and provide a fallback if your browser-support policy requires one. Check current browser support information and caniuse before relying on newer CSS behavior.

### 19. Performance and Motion Quality

A drag callback can run many times per second. Keep it lightweight, prefer transforms, avoid reading layout after writing styles in the same repeated callback, and do not add `will-change` pre-emptively to every card. The browser may promote transformed elements to compositor layers, but too many layers consume memory and can make performance worse.

```js
const [drag] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  onPress() {
    card.style.willChange = "transform";
  },
  onRelease() {
    card.style.willChange = "auto";
  }
});
```

Use `will-change` only when profiling shows it helps, and remove it when the interaction ends. Avoid updating React state for every pixel unless the UI truly needs that data at frame rate. Persist final coordinates at release, and use `requestAnimationFrame` to coalesce non-GSAP visual updates when needed. Measure performance on a representative low-powered device rather than relying only on a desktop development machine.

**Gotcha:** Draggable coordinates are tied to the element's transform state. If another animation system also writes the same transform, the two systems can overwrite each other. Assign one owner to the transform or coordinate the animations through GSAP.

### 20. Testing Matrix

Test the behavior as a complete interaction, not only as a happy-path demo.

```js
const testCases = [
  "mouse drag from handle",
  "touch drag without page lockup",
  "nested button click remains a click",
  "keyboard move up and down",
  "resize while item is at each boundary",
  "reduced-motion preference",
  "component unmount and remount",
  "screen reader status announcement"
];

console.table(testCases.map(name => ({ test: name, owner: "QA" })));
```

Include small and large viewports, long labels, zoomed pages, touch devices, and browser-specific behavior. Check that a drag cannot make important content unreachable, that the control remains visible, and that the final state is saved correctly. Test accidental clicks, fast movement, slow movement, cancellation, and pointer release outside the original target.

**Gotcha:** A selector that matches multiple cards creates multiple instances. If the UI later removes only some cards, track instances per element and kill the removed ones rather than assuming a single instance owns the whole list.

## Named Patterns

### Pattern: Handle-Only Dragging

**What it does:** Limits drag initiation to a dedicated handle while leaving other card controls clickable.

**When to use it:** Cards that contain links, inputs, menus, or action buttons.

```js
const [instance] = Draggable.create(card, {
  type: "x,y",
  bounds: stage,
  trigger: card.querySelector(".drag-handle")
});
```

### Pattern: Bounded Freeform Canvas

**What it does:** Lets an item move freely within a stage.

**When to use it:** Diagram editors, visual planning boards, and spatial tools.

```js
const [instance] = Draggable.create(node, {
  type: "x,y",
  bounds: canvasStage,
  edgeResistance: 0.9
});
```

### Pattern: Axis-Locked Slider

**What it does:** Restricts movement to one axis.

**When to use it:** Horizontal timelines, carousel cards, or handles whose meaning is one-dimensional.

```js
const [instance] = Draggable.create(handle, {
  type: "x",
  bounds: track,
  onDragEnd() {
    updateValueFromPosition(this.x);
  }
});
```

### Pattern: Grid Snap

**What it does:** Aligns the item with discrete grid destinations.

**When to use it:** Layout editors and board-like interfaces.

```js
const grid = 64;
const [instance] = Draggable.create(node, {
  type: "x,y",
  bounds: stage,
  liveSnap: {
    x: value => Math.round(value / grid) * grid,
    y: value => Math.round(value / grid) * grid
  }
});
```

### Pattern: Accessible Reordering

**What it does:** Pairs drag-and-drop with explicit move controls and status announcements.

**When to use it:** Priority lists, task boards, and sortable collections.

```js
moveUpButton.addEventListener("click", () => {
  const item = moveUpButton.closest("li");
  if (item?.previousElementSibling) {
    list.insertBefore(item, item.previousElementSibling);
    status.textContent = `${item.textContent.trim()} moved up`;
  }
});
```

### Pattern: Normalized Position Persistence

**What it does:** Stores coordinates relative to the available stage size.

**When to use it:** Freeform boards that need to reopen at a similar position on different screen sizes.

```js
function normalize(value, maximum) {
  return maximum <= 0 ? 0 : Math.min(1, Math.max(0, value / maximum));
}

const position = {
  x: normalize(drag.x, stage.clientWidth - card.offsetWidth),
  y: normalize(drag.y, stage.clientHeight - card.offsetHeight)
};
```

### Pattern: Resize-Aware Bounds

**What it does:** Updates constraints when the stage changes size.

**When to use it:** Responsive dashboards, side panels, or resizable editors.

```js
const observer = new ResizeObserver(() => {
  drag.applyBounds(stage);
});

// In teardown:
observer.disconnect();
```

Verify the method is available in the installed version; otherwise recreate the instance after the active drag has ended.

### Pattern: Reduced-Motion Drag Policy

**What it does:** Keeps direct manipulation but removes optional inertia and exaggerated settling.

**When to use it:** Interfaces that support motion preferences.

```js
const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const inertiaEnabled = !prefersReducedMotion.matches && hasLicensedInertiaPlugin;
```

### Pattern: Lifecycle-Owned Instance

**What it does:** Creates a draggable instance with the UI and kills it during teardown.

**When to use it:** Single-page apps, modals, tabs, and framework components.

```js
function setup(element, bounds) {
  const [instance] = Draggable.create(element, { type: "x,y", bounds });
  return () => instance.kill();
}
```

**Gotcha:** `onClick` and `onDragEnd` represent different outcomes. Do not persist a reorder or trigger a destructive action merely because the pointer was released; validate the intended drop or movement before committing application state.

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Dragging the entire card | Nested controls accidentally start movement | Use a dedicated `trigger` handle |
| No keyboard alternative | Some users cannot perform the core action | Add move buttons or another equivalent control |
| Hard-coded bounds | Layout changes make limits wrong | Use element bounds and refresh after resize |
| Using `top` and `left` in every drag callback | Can trigger repeated layout work | Prefer transform-based `x` and `y` |
| Treating `dragResistance` as edge resistance | The entire interaction becomes unexpectedly slow | Tune `dragResistance` and `edgeResistance` separately |
| Snapping to impossible coordinates | Last grid cell can exceed the stage | Derive valid snap points from measured bounds |
| Applying `touch-action: none` globally | Page scrolling and gestures become frustrating | Restrict it to the handle or drag surface |
| Saving only pixel coordinates | Position may not transfer to another viewport | Store normalized coordinates or domain state |
| Recreating on every resize event | Causes unnecessary work and visual jumps | Refresh bounds or debounce recreation |
| Forgetting `kill()` | Stale listeners and references can persist | Own and destroy every instance |
| Creating instances during React render | Render may repeat and refs may not exist | Create inside an effect or supported GSAP hook |
| Assuming inertia is included | Build fails or feature is unavailable | Confirm licensed InertiaPlugin access |
| Heavy `onDrag` callback | Frames drop during movement | Keep callbacks cheap and defer expensive work |
| Missing live-region updates | Reordering result is unclear to assistive tech | Announce meaningful state changes |
| No focus restoration after reorder | Keyboard users lose their place | Keep focus on the moved item or its control |
| Mixing viewport and transform coordinates | Persisted position drifts | Convert coordinate spaces explicitly |
| Unclear cursor and handle affordance | Users do not discover the interaction | Use a visible handle, grab cursor, and instructions |
| Ignoring touch and Safari testing | Gesture behavior varies across devices | Test real touch devices and target browsers |
| Keeping `will-change` permanently | Excessive compositor layers use memory | Apply during interaction only when profiling justifies it |
| No boundary tests | Item can become inaccessible at an edge | Test each edge and responsive size |
| Duplicate initialization | Multiple instances compete for movement | Guard setup and clean up before recreation |
| Inertia with reduced motion | Optional motion continues against preference | Disable inertia and exaggerated settling |
| Stopping all event propagation | Parent interactions and delegation break | Use trigger and clickable-target configuration |
| Ignoring long labels and zoom | Controls overflow or become unreachable | Test zoom, reflow, and content extremes |
| Assuming a focusable handle is enough | Focus does not provide drag operation | Implement explicit keyboard actions |

## Quick Reference

| Need | Starting point | Notes |
|---|---|---|
| Register plugin | `gsap.registerPlugin(Draggable)` | Register once per module/application setup |
| Create instance | `Draggable.create(target, options)` | Returns an array of instances |
| Horizontal drag | `type: "x"` | Transform-based movement |
| Vertical drag | `type: "y"` | Verify touch and page-scroll behavior |
| Two-axis drag | `type: "x,y"` | Add bounds for constrained areas |
| Rotation interaction | `type: "rotation"` | Provide clear visual and keyboard alternatives |
| Restrict to container | `bounds: element` | Revisit after layout changes |
| Dedicated handle | `trigger: handle` | Prevent nested controls from dragging |
| Live grid alignment | `liveSnap: { x, y }` | Ensure snap destinations fit within bounds |
| General resistance | `dragResistance` | Slows response through the drag |
| Edge resistance | `edgeResistance` | Changes feel near the bounds |
| Drag start | `onPress` | Keep work lightweight |
| During drag | `onDrag` | Avoid expensive reads/writes |
| Drag completed | `onDragEnd` | Good point to persist final state |
| Remove instance | `instance.kill()` | Required during teardown |
| Inertia | `inertia: true` | Requires separately licensed InertiaPlugin |
| Focus visibility | `:focus-visible` | Must remain clearly visible |
| Motion preference | `prefers-reduced-motion` | Reduce optional inertia and flourish |
| Debug geometry | `getBoundingClientRect()` | Compare target and stage |
| Inspect state | `console.table()` | Log compact, useful diagnostic values |

**Gotcha:** A visible focus ring can be clipped by `overflow: hidden` or `overflow: clip` on the stage. Inspect focus at every edge and reserve space or place the focus treatment on an unclipped wrapper when needed.

## Browser Support and Compatibility

GSAP Draggable supports common mouse and touch interaction patterns across modern browsers, but the full experience also depends on the CSS and JavaScript around it. Test Safari, Firefox, and Chromium-based browsers. Check browser support and caniuse for newer CSS properties such as `overflow: clip`, `ResizeObserver`, and media-query event listeners. Use `@supports` where a CSS feature needs a fallback, and keep core dragging usable when decorative styles are unavailable.

```css
.drag-stage {
  overflow: hidden;
}

@supports (overflow: clip) {
  .drag-stage {
    overflow: clip;
  }
}
```

The fallback above is intentionally conservative: validate that clipping does not hide focus rings or important controls. Avoid relying on a single browser's pointer behavior. Touch devices, high zoom, keyboard navigation, and screen readers are part of the support matrix, not optional extras.

## Build Challenge: Accessible Priority Board

Build a responsive priority board where users can reorder three or more items by dragging and by keyboard-accessible controls.

1. Use a semantic `<section>`, heading, `<ul>`, `<li>`, and native `<button>` elements.
2. Register GSAP Draggable explicitly and create one instance per intended draggable handle or card.
3. Constrain dragging to the board or implement a clear drop-target model.
4. Use a dedicated drag handle so nested buttons do not accidentally start a drag.
5. Provide Move up and Move down buttons that update the same underlying order as dragging.
6. Announce successful reorder operations through a polite live region.
7. Keep keyboard focus on the moved item or its relevant control after an operation.
8. Show clear `:focus-visible` outlines and sufficient target sizes.
9. Apply `touch-action` only to the intended gesture surface and verify page scrolling still works.
10. Respect `prefers-reduced-motion` by disabling optional inertia and exaggerated settling.
11. Recalculate or refresh bounds when the board changes size.
12. Kill every Draggable instance and disconnect observers during teardown.
13. Persist a stable order using item IDs rather than pixel coordinates.
14. Test mouse, touch, keyboard-only use, screen-reader announcements, zoom, and a narrow viewport.
15. Include a failure test where the board resizes while an item is at the edge; confirm it remains reachable and does not jump outside the bounds.
16. Include a failure test where a nested action button is clicked; confirm it activates without dragging the card.
17. Profile repeated drags and ensure callbacks do not cause obvious jank or unnecessary layout work.
18. Verify the implementation in Safari, Firefox, and Chromium-based browsers, documenting any fallback behavior.

## Definition of Done

- [ ] Draggable is registered and the exact instances are retained.
- [ ] Movement is constrained to valid bounds and remains correct after resize.
- [ ] Nested controls remain clickable and drag initiation is predictable.
- [ ] Keyboard users can reorder items without dragging.
- [ ] Screen readers receive useful status announcements after reorder.
- [ ] Focus indicators remain visible and focus is not lost after updates.
- [ ] Reduced-motion preferences remove optional inertia or flourish.
- [ ] All instances and observers are cleaned up on teardown.
- [ ] The board works with mouse, touch, keyboard, zoom, and narrow screens.
- [ ] The resize-at-edge and nested-button failure tests pass.
- [ ] DevTools checks show no duplicate handlers or persistent stale instances.
- [ ] Performance remains acceptable on a representative lower-powered device.

## Further Debugging Checklist

- Inspect target and bounds references in DevTools.
- Check `getComputedStyle(element).transform`, `touch-action`, `overflow`, and `position`.
- Confirm the instance is not being created twice by a repeated mount or event handler.
- Compare geometry before and after resizing and scrolling.
- Verify plugin registration and whether InertiaPlugin is actually available.
- Confirm a drag handle is not covered by another element or blocked by `pointer-events`.
- Use the Performance panel to inspect jank, layout, paint, and long tasks.
- Check keyboard alternatives, accessible names, live announcements, and focus order.
- Re-test with `prefers-reduced-motion: reduce`.
- Reproduce in Safari, Firefox, and Chromium rather than assuming one browser represents all users.



## Coordinate Ownership and Drop Semantics

A draggable element can have a valid visual position without having a valid product destination. A Kanban card, for example, should not be considered moved to another column merely because its bounding box overlaps that column. Define a drop contract: which destinations are valid, how the user receives feedback, what happens when a drop is rejected, and when the application commits the change.

```js
function resolveDropTarget(card, targets) {
  const matches = targets.filter(target => {
    return card.hitTest
      ? card.hitTest(target, "50%")
      : false;
  });

  return matches[0] ?? null;
}

function commitDrop(cardId, targetId) {
  if (!targetId) {
    console.info("No valid drop target; preserve prior state.");
    return false;
  }

  // Update the application's domain state, then render from that state.
  console.log("Move item", cardId, "to target", targetId);
  return true;
}
```

Treat the example as a starting point: `hitTest` belongs to a Draggable instance, so in a real implementation call it on the instance that owns the card, not on an arbitrary DOM element. For overlapping targets, define a deterministic priority rule instead of relying on whichever element happens to appear first in a selector result. Provide a clear invalid-drop response and restore the previous valid position if the destination is rejected.

## Safe Initialization and Reinitialization

Initialization should be deliberate. Avoid wiring the same target from multiple routes, modal open handlers, and component effects without a clear owner. Before creating a replacement instance, remove the old instance and reset any transient classes or inline styles that your own code added.

```js
const activeDrags = new WeakMap();

function initializeDrag(element, bounds) {
  activeDrags.get(element)?.kill();

  const [instance] = Draggable.create(element, {
    type: "x,y",
    bounds,
    onPress() {
      element.classList.add("is-dragging");
    },
    onRelease() {
      element.classList.remove("is-dragging");
    }
  });

  activeDrags.set(element, instance);

  return () => {
    instance.kill();
    element.classList.remove("is-dragging");
    if (activeDrags.get(element) === instance) {
      activeDrags.delete(element);
    }
  };
}
```

A `WeakMap` does not replace cleanup; it simply associates an instance with an element without making the element key itself permanently reachable through the map. Keep the returned teardown function and call it when the owning UI is removed. When using framework effects, follow the framework's lifecycle rather than attaching a second independent initialization path.

## Dragging, Selection, and Text Editing

Direct manipulation can conflict with selecting text or editing content. Decide which parts of the interface should initiate a drag and which should remain ordinary content. A dedicated handle is usually the clearest choice for cards that include selectable text. If the product genuinely requires dragging from most of the card, make text editing and selection deliberate modes and test them with keyboard and touch input.

```css
.priority-card {
  user-select: text;
}

.priority-card .drag-handle {
  user-select: none;
  touch-action: none;
  cursor: grab;
}

.priority-card.is-dragging {
  user-select: none;
}
```

Apply transient classes only while the gesture is active, and remove them on cancellation as well as normal release. Check the browser's behavior when a pointer leaves the viewport or the user interrupts the gesture. Do not disable text selection across an entire page merely to make a drag demo look tidy.

## Final Principle

A good draggable interaction makes the result clear, the limits predictable, and the alternative controls equally capable. Keep the interaction lightweight, connect its outcome to application state, measure bounds rather than guessing, and clean up every instance when its UI is gone.
