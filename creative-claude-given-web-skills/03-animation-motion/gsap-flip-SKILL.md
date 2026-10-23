# GSAP Flip — Animate Layout State Changes

> **Skill file:** `gsap-flip/SKILL.md`
> **Layer:** 03 — Animation & Motion
> **Scope:** FLIP-based layout transitions, state capture, DOM reordering, responsive layouts, React integration, nested elements, accessibility, and debugging.
> **Use this skill when:** an element needs to animate smoothly between two layout states, such as a card moving into a grid, a gallery item expanding, or a list reordering.
> **Do not use this skill when:** a simple transform/opacity transition is sufficient or the layout change should remain immediate.

## Why This Matters

Layout changes are often abrupt because the browser lays out elements in their new positions immediately. A card can jump from a grid into a detail region, a list item can teleport after filtering, or a selected image can suddenly change size. GSAP Flip (First, Last, Invert, Play) provides a way to animate between these states without manually calculating every intermediate coordinate.

The production failure is rarely just that the motion looks imperfect. A transition can leave stale inline styles behind, animate the wrong duplicate element, break keyboard focus, or produce a strange scale distortion because a child’s dimensions differ between the two states. A route change or React re-render can also invalidate the captured elements. The solution is to treat a Flip animation as a controlled transition between two real DOM states, not as a permanent substitute for layout.

The core sequence is straightforward: capture the initial state, make the DOM/layout change, then animate from the captured state to the final state. Keep the underlying semantic structure correct before, during, and after the animation. Use Flip to help users track continuity, not to hide information or make the page’s reading order depend on animation.

## 1. Understand First, Last, Invert, Play

FLIP stands for First, Last, Invert, Play. First: record the element’s current geometry and relevant transform state. Last: apply the real layout change and let the browser calculate the new geometry. Invert: calculate the transform needed to make the new position appear visually like the old position. Play: animate that inverse transform back to the natural final state.

GSAP Flip packages the geometry measurement and transform math. You do not need to manually calculate offsets, but you do need to control when the DOM state changes and which elements participate.

```js
import gsap from "gsap";
import Flip from "gsap/Flip";

gsap.registerPlugin(Flip);

const card = document.querySelector("[data-card='featured']");
if (card) {
  const state = Flip.getState(card);

  card.classList.toggle("is-featured");

  Flip.from(state, {
    duration: 0.55,
    ease: "power2.inOut",
    absolute: false
  });
}
```

The class should change the actual layout—grid placement, sizing, or parent assignment—rather than being a decorative flag with no geometric consequence. The exact result depends on the CSS, so build a working layout around the state change.

**Gotcha:** Capture the state before the layout change. If you call `Flip.getState()` after toggling the class, the “First” state is already lost and there is nothing meaningful to animate from.

## 2. Register Flip and Match the Installed GSAP Version

Import `Flip` from the installed GSAP package and register it with `gsap.registerPlugin(Flip)`. Keep GSAP and its plugins on compatible versions. If the project uses a package manager, check the lockfile and installed dependency tree before copying an example from a different setup.

```js
import gsap from "gsap";
import Flip from "gsap/Flip";

gsap.registerPlugin(Flip);
```

Do not confuse the plugin import path with a browser CDN script URL. In a bundler, use the module path appropriate to the installed package. If the project uses a CDN, follow the official GSAP distribution instructions for that environment. A missing plugin import can make the animation setup fail before any state transition occurs.

Register the plugin in a shared animation module when possible. Component-specific code should focus on state capture, layout mutation, and cleanup. Avoid scattering registration throughout repeated render paths.

## 3. Capture Only the Elements That Need Continuity

`Flip.getState(targets)` captures state for one or more targets. Choose a stable selector or a direct element reference that identifies the items whose visual continuity matters. Capturing the entire page can be expensive and may animate elements that should not move.

```js
const list = document.querySelector("[data-product-list]");
const cards = list?.querySelectorAll("[data-product-card]");

if (cards?.length) {
  const state = Flip.getState(cards);
  list.classList.toggle("is-compact");
  Flip.from(state, {
    duration: 0.4,
    ease: "power2.inOut",
    stagger: 0.04
  });
}
```

Use direct references when the component has a clear owner, especially when several copies of the same component appear on a page. A broad selector such as `.card` can capture cards from unrelated sections and cause cross-component motion. Scope selection to the component root.

When items are inserted or removed, consider how the animation should represent those differences. Existing elements can move between positions; new elements may need an enter animation and removed elements may need an exit animation. `Flip.from()` options such as `fade` can help with entering or leaving targets, but choose these deliberately and verify the final DOM remains correct.

## 4. Understand `Flip.from()` and the Important Options

`Flip.from(state, vars)` animates from the captured state to the current layout. Common options include `duration`, `ease`, `stagger`, `absolute`, `nested`, `prune`, `scale`, `simple`, `fade`, `targets`, and `onEnter`/`onLeave` hooks where supported by the installed version. Read the current GSAP Flip documentation for precise option semantics.

```js
const state = Flip.getState("[data-gallery-item]");
gallery.classList.toggle("is-expanded");

const animation = Flip.from(state, {
  duration: 0.6,
  ease: "power3.inOut",
  stagger: 0.035,
  absolute: false,
  scale: true
});
```

`scale: true` allows the element to animate with scale transforms to match changed dimensions; it is not always the best choice for text-heavy cards because text can visibly stretch. `absolute` can take elements out of normal flow during the transition to reduce layout interference, but it needs careful testing with parent positioning and container size. `nested` can coordinate nested elements; use it only when the parent/child geometry needs special handling.

Avoid setting every option by habit. Start with a simple `Flip.from(state, { duration, ease })`, inspect the result, then add only the options that solve a specific visual problem.

## 5. Reordering a List

For a reorder interaction, update the actual DOM order or the application state that controls it. Flip animates existing items from their prior positions to the new positions. Do not fake reordering by applying a collection of arbitrary `x` and `y` transforms that become stale after another sort or resize.

```js
const list = document.querySelector("[data-sort-list]");
const sortButton = document.querySelector("[data-sort-button]");

sortButton?.addEventListener("click", () => {
  if (!list) return;

  const state = Flip.getState(list.querySelectorAll("[data-sort-item]"));
  const items = [...list.querySelectorAll("[data-sort-item]")];

  items.reverse().forEach((item) => list.appendChild(item));

  Flip.from(state, {
    duration: 0.45,
    ease: "power2.inOut",
    stagger: 0.025
  });
});
```

The DOM order changes immediately, which is correct for semantics and keyboard navigation. Flip visually interpolates the transition. Test keyboard use and assistive technology expectations: the order of items after activation should be clear, and focus should remain on a sensible control. If the order represents ranking or priority, announce the resulting state when necessary.

For framework-managed lists, update the data model and let the framework render the new order. Do not manually append children behind React, Vue, or another renderer’s back; that can cause reconciliation errors. Capture the state immediately before the state update, then animate after the new DOM is committed using the framework’s lifecycle pattern.

## 6. Move an Element Between Containers

A classic Flip use case is moving a card from a grid into a featured panel. Capture the card’s initial state, move it into the destination container, then animate it to its new geometry.

```js
const card = document.querySelector("[data-movable-card]");
const grid = document.querySelector("[data-card-grid]");
const feature = document.querySelector("[data-feature-panel]");

function moveCard() {
  if (!card || !grid || !feature) return;

  const state = Flip.getState(card);
  const destination = card.parentElement === feature ? grid : feature;
  destination.appendChild(card);

  Flip.from(state, {
    duration: 0.55,
    ease: "power2.inOut",
    absolute: true,
    scale: true
  });
}
```

This is a simplified DOM example. In a component framework, update the data model or selected state rather than directly moving framework-owned nodes. Ensure the destination can accept the element without breaking the document’s semantic hierarchy. A visual move should not unexpectedly change heading relationships, form ownership, or keyboard order.

The `absolute` option may help when the card’s old and new containers have different layout rules, but it can also cause clipping or unexpected positioning. Inspect the relevant containing blocks and overflow settings. Try the default flow behavior first.

## 7. Animate Between Grid and Detail States

Grid-to-detail transitions are useful when a user opens a product, photo, or project card. The best result preserves the identity of the selected item while the layout changes. Use a stable item ID and avoid relying only on array index, because filtering or sorting can change indices.

```js
function showDetails(itemId) {
  const item = document.querySelector(`[data-item-id="${CSS.escape(itemId)}"]`);
  const detail = document.querySelector("[data-item-detail]");

  if (!item || !detail) return;

  const state = Flip.getState([item, detail]);
  detail.hidden = false;
  detail.dataset.activeItem = itemId;

  Flip.from(state, {
    duration: 0.5,
    ease: "power2.inOut",
    fade: true,
    absolute: false
  });
}
```

A complete implementation must also update the application state, close button, focus management, and browser history if the detail view behaves like navigation. Do not leave duplicate accessible content in both the grid and detail panel. If the detail view becomes modal, follow dialog focus and escape-key behavior rather than treating Flip as a modal implementation.

For images, reserve dimensions and preserve aspect ratio. A visual can scale smoothly while the source image changes crop, but a sudden intrinsic-size change can cause the final layout to shift. Use CSS `object-fit` and a stable container.

## 8. Coordinate Nested Elements

A parent card and its child image or title may both be captured. If both animate independently, the child can appear to move twice or distort relative to the parent. The `nested` option and the `data-flip-id` system can help coordinate complex layouts, but they are not substitutes for understanding the hierarchy.

```js
const state = Flip.getState("[data-flip-id]", { props: "borderRadius" });
container.classList.toggle("is-expanded");

Flip.from(state, {
  duration: 0.5,
  ease: "power2.inOut",
  nested: true,
  scale: true
});
```

`props` can capture additional CSS properties when the installed Flip API supports them; use it for specific properties such as `borderRadius` when a state transition should interpolate them. Avoid capturing a large list of styles without a reason. Additional property interpolation can increase complexity and may not be appropriate for every layout change.

Use `data-flip-id` when elements need identity to be matched across different DOM containers or states. IDs should be stable and unique within the transition. Duplicated IDs can make Flip match the wrong element, which is especially confusing when lists contain repeated cards.

**Gotcha:** A parent’s scale transform affects child rendering. If text becomes stretched or a child’s transform fights the parent’s transform, animate the parent’s position separately from the child’s size or use a layout design that avoids scaling text.

## 9. React Integration and State Timing

In React, Flip needs a state snapshot before the layout changes and an animation after the DOM reflects the new state. Use a controlled event handler and a framework lifecycle approach such as `useGSAP()` or `useLayoutEffect()` where appropriate. Follow the installed `@gsap/react` documentation for cleanup and context behavior.

```jsx
import { useRef, useState, useLayoutEffect } from "react";
import gsap from "gsap";
import Flip from "gsap/Flip";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(Flip, useGSAP);

function SortableCards({ initialItems }) {
  const root = useRef(null);
  const [items, setItems] = useState(initialItems);
  const pendingState = useRef(null);

  function reverseItems() {
    if (!root.current) return;
    pendingState.current = Flip.getState(
      root.current.querySelectorAll("[data-card-id]")
    );
    setItems((current) => [...current].reverse());
  }

  useLayoutEffect(() => {
    if (!pendingState.current) return;
    Flip.from(pendingState.current, {
      duration: 0.45,
      ease: "power2.inOut",
      stagger: 0.025
    });
    pendingState.current = null;
  }, [items]);

  useGSAP(() => {
    // Component-scoped GSAP setup belongs here.
  }, { scope: root });

  return (
    <section ref={root} aria-label="Sortable projects">
      <button type="button" onClick={reverseItems}>Reverse order</button>
      <ul>
        {items.map((item) => (
          <li key={item.id} data-card-id={item.id}>
            <article>
              <h3>{item.title}</h3>
              <p>{item.summary}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

This pattern illustrates state capture before the update and animation after commit. In a production component, ensure the pending state is cleared if the update is interrupted or the component unmounts. Repeated clicks during an active Flip animation need an explicit policy: finish the current animation, kill it and capture the current visual state, or queue the next state. Do not allow snapshots to accumulate indefinitely.

React Strict Mode can expose lifecycle mistakes by running setup and cleanup cycles in development. Ensure old animations are reverted or killed, and do not suppress Strict Mode merely to hide a duplicate-animation symptom. Use stable keys so React preserves element identity across reorder operations.

## 10. Accessibility and Reduced Motion

Flip should preserve the actual semantic structure while visual geometry changes. Use semantic HTML such as `<main>`, `<section>`, `<article>`, `<ul>`, `<li>`, `<button>`, and headings. Avoid using motion as the only cue that a card was selected or moved. Controls need accessible names and a visible `:focus-visible` indicator. If an item changes order, the final DOM order should reflect the new order.

Respect `prefers-reduced-motion`. For a reduced-motion preference, skip the Flip animation or use a very short, low-distance opacity change only if it remains comfortable and meaningful. The simplest option is often to perform the layout change immediately and leave the final state clear. The user should not need to wait for an animation to reach a control or understand the new state.

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function animateFlip(state) {
  if (reduceMotion.matches) {
    // Layout already changed; leave the final state without motion.
    return;
  }

  Flip.from(state, {
    duration: 0.45,
    ease: "power2.out"
  });
}
```

If the preference can change while the page is open, listen for the media query’s `change` event and remove that listener when the component is destroyed. Do not depend on hover-only interactions. Verify focus visibility after moving an element between containers, and ensure a focused element is not moved into a hidden or inert region.

**Gotcha:** Setting a duration to zero does not automatically solve focus order, hidden content, or stale inline styles. Reduced motion must preserve a usable state transition, not merely remove the timing.

## 11. Handle Rapid Repeated Interactions

Users may click a sort, filter, or expand control before the previous Flip animation completes. Decide how the interface should behave. Common choices are to interrupt and animate from the current visual state, finish the current transition before starting another, or disable the control briefly. For interactive product UI, interruption is often preferable to a queue that makes the interface feel delayed.

```js
let activeFlip = null;

function transitionLayout(state, options = {}) {
  activeFlip?.kill();
  activeFlip = Flip.from(state, {
    duration: 0.4,
    ease: "power2.out",
    ...options
  });

  activeFlip.eventCallback("onComplete", () => {
    activeFlip = null;
  });

  return activeFlip;
}
```

The caller must capture a valid state before changing layout. Killing an animation does not restore the DOM state or reverse an application-state update. The code above is a coordination pattern, not a universal interruption policy. Test rapid click sequences and ensure the final state always matches application state.

If the interaction is a toggle, use the current application state to determine the next state rather than reading a temporary transform. Inline transforms represent animation mechanics, not authoritative business state.

## 12. Use `Flip.fit()` for Targeted Fitting

`Flip.fit()` can fit one element to another element’s dimensions and position. It is useful for a targeted transition where a visual needs to match another box, but it should not be used as a replacement for responsive layout.

```js
const source = document.querySelector("[data-source-image]");
const target = document.querySelector("[data-target-frame]");

if (source && target) {
  Flip.fit(source, target, {
    scale: true,
    duration: 0.45,
    ease: "power2.inOut"
  });
}
```

Check the installed API’s exact return behavior and option support before relying on a return value. `Flip.fit()` is most useful when the target geometry is known and the element should visually fit it. If the underlying layout will change, use `Flip.getState()` and `Flip.from()` around that change instead.

Avoid fitting an element to a target that is hidden or has no measurable box. If the target is in a `display: none` subtree, its geometry may be unavailable. Make the target measurable or use a different layout transition.

## 13. Capture Extra Properties Carefully

By default, Flip focuses on geometry and transforms. Some designs also need CSS properties such as `borderRadius`, `color`, or `backgroundColor` to transition between states. The `props` option on `Flip.getState()` can capture selected properties for interpolation in supported versions.

```js
const state = Flip.getState(card, {
  props: "borderRadius,backgroundColor"
});

card.classList.toggle("is-selected");

Flip.from(state, {
  duration: 0.35,
  ease: "power2.out"
});
```

Only capture properties that need continuity. Color interpolation can be expensive when applied to many elements, and not every CSS property is equally suited to animation. Verify the computed final styles and test contrast in both states. A focus indicator should remain visible while color and geometry change.

Do not animate every property simply because it is possible. Use the browser’s CSS transition system for simple state changes when that is easier to maintain. Use Flip for geometry continuity and add property interpolation only where it materially improves the transition.

## 14. Performance, DevTools, and Browser Support

Flip measures element geometry and applies transforms to bridge the old and new states. Large collections increase measurement and animation work. Capture only the elements involved in the transition, keep state changes scoped, and avoid repeated layout reads while an animation is running. Prefer transform and opacity for visual interpolation; avoid animating `top`, `left`, `width`, and `height` as per-frame movement unless the design truly needs layout changes and profiling supports the choice.

Use DevTools to inspect computed styles, the DOM, layout shifts, and the Performance panel. Record the interaction and look for repeated layout, paint, long tasks, and dropped frames. The Layers panel can help explain memory and compositing behavior. `will-change` is not a blanket optimization; it may create extra layers and consume memory. Add it only after measurement, and remove it when the animation no longer needs the hint.

Test current Safari, Firefox, and Chromium versions according to the product’s browser matrix. Consult GSAP’s official documentation for plugin behavior and caniuse for related browser platform features. `@supports` can provide a CSS fallback for a CSS feature, but it cannot prove that the GSAP plugin loaded or that a state capture succeeded.

```js
function debugFlipTargets(root) {
  const rows = [...root.querySelectorAll("[data-flip-id], [data-card-id]")].map((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      id: el.dataset.flipId || el.dataset.cardId || "(unlabelled)",
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      transform: style.transform,
      position: style.position,
      visibility: style.visibility
    };
  });

  console.table(rows);
  return rows;
}
```

Use the helper manually during development, not on every animation frame. Confirm that the captured target list contains the intended elements and that the final geometry matches the CSS layout after the animation completes.

## 15. Keep the CSS Baseline Honest

Flip works best when CSS describes both valid layout states. The animation should interpolate between them; it should not require permanent inline transforms to keep the final layout correct. Use classes or application state to define the grid, detail, compact, and expanded states. Keep focus styles independent of decorative transforms.

```css
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1rem;
}

.project-card {
  min-width: 0;
  border-radius: 1rem;
  transform-origin: center;
}

.project-card:focus-within,
.project-card:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .project-card {
    scroll-behavior: auto;
  }
}

@supports (display: grid) {
  .project-grid {
    display: grid;
  }
}
```

The CSS example is a baseline, not a complete design system. Use a real focus design with adequate contrast. Avoid adding `transition: all`, which can animate unintended properties and make the final state hard to reason about. `scroll-behavior` is not a substitute for disabling a GSAP Flip animation; the JavaScript path must also respect the reduced-motion preference.

## 16. Patterns for Common Flip Transitions

### Pattern 1 — Grid Reorder

**What it does:** Animates existing cards to their new positions after a sort.
**When to use:** A user sorts projects, products, or a gallery while preserving item identity.
**Implementation:**

```js
function reorderCards(root, orderedIds) {
  const nodes = new Map(
    [...root.querySelectorAll("[data-card-id]")].map((node) => [node.dataset.cardId, node])
  );
  const state = Flip.getState([...nodes.values()]);

  for (const id of orderedIds) {
    const node = nodes.get(id);
    if (node) root.querySelector("[data-card-list]")?.appendChild(node);
  }

  return Flip.from(state, {
    duration: 0.42,
    ease: "power2.inOut",
    stagger: 0.025
  });
}
```

Ensure `orderedIds` comes from the actual application model and that all expected IDs exist. If some IDs are missing, leave the remaining nodes in a deliberate order and report the mismatch during development.

### Pattern 2 — Expand a Selected Card

**What it does:** Preserves the selected card’s visual identity while it grows into a detail region.
**When to use:** A portfolio, product gallery, or project browser with an in-page detail state.
**Implementation:**

```js
function expandCard(card, detailPanel) {
  const state = Flip.getState([card, detailPanel]);
  detailPanel.hidden = false;
  detailPanel.appendChild(card);

  return Flip.from(state, {
    duration: 0.5,
    ease: "power2.inOut",
    absolute: true,
    scale: true
  });
}
```

This is a layout example; a production modal or detail panel also needs focus management, close behavior, and appropriate history/state handling. Do not leave a duplicate card accessible in both places.

### Pattern 3 — Shared-Element Transition by ID

**What it does:** Matches visual identity across different containers using stable Flip IDs.
**When to use:** A card image transitions into a detail header while the layout changes.
**Implementation:**

```js
const state = Flip.getState("[data-flip-id]");
detailRoot.hidden = false;
detailRoot.dataset.active = selectedId;

Flip.from(state, {
  duration: 0.48,
  ease: "power2.inOut",
  fade: true
});
```

Ensure IDs are stable and unique across the transition. If the source and destination are separate DOM nodes, verify the matching strategy against the installed Flip version and avoid duplicate IDs.

### Pattern 4 — Compact/Expanded Layout

**What it does:** Animates between two valid CSS layout modes.
**When to use:** A dashboard or project list has compact and spacious views.
**Implementation:**

```js
function toggleDensity(root) {
  const targets = root.querySelectorAll("[data-density-item]");
  const state = Flip.getState(targets);
  root.classList.toggle("is-compact");

  return Flip.from(state, {
    duration: 0.38,
    ease: "power2.inOut",
    stagger: 0.02
  });
}
```

Make sure the class changes actual layout properties and that the compact state still meets text, touch-target, and focus requirements.

### Pattern 5 — Filter with Enter/Leave Motion

**What it does:** Animates surviving items into new positions and fades items that enter or leave the collection.
**When to use:** Filtering a small-to-medium list where continuity helps the user understand what changed.
**Implementation:**

```js
const state = Flip.getState(root.querySelectorAll("[data-filter-item]"));
applyFilterToDataModel(activeFilter);

Flip.from(state, {
  duration: 0.4,
  ease: "power2.out",
  fade: true,
  absolute: false
});
```

For a framework, `applyFilterToDataModel` must update application state and the animation must run after the new DOM commit. Avoid direct DOM mutations that conflict with framework reconciliation.

### Pattern 6 — Responsive Card Layout

**What it does:** Animates the geometry change when a responsive class or layout mode changes.
**When to use:** A user-controlled layout switch or a deliberate responsive state transition.
**Implementation:**

```js
function setLayout(root, layoutName) {
  const state = Flip.getState(root.querySelectorAll("[data-layout-card]"));
  root.dataset.layout = layoutName;

  return Flip.from(state, {
    duration: 0.35,
    ease: "power2.inOut",
    scale: false
  });
}
```

Do not animate every browser resize event. Native responsive layout should usually adapt immediately; use Flip for an intentional mode change, not for continuous resizing.

### Pattern 7 — Interruptible Toggle

**What it does:** Kills an active Flip tween before beginning a new intentional transition.
**When to use:** A control can be activated repeatedly while an animation is still running.
**Implementation:**

```js
let activeAnimation = null;

function runFlip(state) {
  activeAnimation?.kill();
  activeAnimation = Flip.from(state, {
    duration: 0.35,
    ease: "power2.out"
  });
  activeAnimation.eventCallback("onComplete", () => {
    activeAnimation = null;
  });
  return activeAnimation;
}
```

The caller must capture a fresh state before each layout mutation. Killing the tween does not undo application state or restore the old DOM order. Test rapid interactions to ensure the last requested state wins.

### Pattern 8 — Reduced-Motion Layout Change

**What it does:** Applies the final layout without a spatial animation when reduced motion is requested.
**When to use:** Any nonessential shared-element or reordering animation.
**Implementation:**

```js
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function flipIfAllowed(state) {
  if (reduceMotionQuery.matches) return null;
  return Flip.from(state, {
    duration: 0.35,
    ease: "power2.out"
  });
}
```

The DOM/state change must happen before this function is called. The final layout should be complete and understandable without animation.

## 17. Mistakes and Corrective Actions

| Mistake | Why it fails | Corrective action |
|---|---|---|
| Capturing state after the class change | The original geometry is lost | Call `Flip.getState()` before mutating layout |
| Capturing the entire document | Unrelated elements may animate and measurement cost rises | Scope targets to the component root |
| Using array indexes as identity | Sorting changes indexes and mismatches elements | Use stable item IDs and keys |
| Directly moving React-owned nodes | Framework reconciliation can break | Update the data model and animate after commit |
| Leaving old inline transforms | Future layout states inherit animation artifacts | Revert or clear animation state through the owning context |
| Animating a hidden target | Its geometry may not be measurable | Make the target measurable before capture/fit |
| Scaling text-heavy cards | Text and borders can look distorted | Try `scale: false` or animate a child visual |
| Duplicating `data-flip-id` values | Flip can match the wrong element | Ensure IDs are stable and unique |
| Forgetting reduced motion | Movement may be uncomfortable or inaccessible | Skip spatial animation and keep final layout usable |
| Hiding content until GSAP runs | Plugin failure leaves blank UI | Keep semantic content visible by default |
| Failing to handle repeated clicks | Animations overlap or state becomes stale | Define an interruption policy and recapture state |
| Assuming `kill()` reverses the state change | DOM/application state remains changed | Keep state transitions separate from tween lifecycle |
| Using `transition: all` | Unintended properties animate | Declare only the CSS properties that need transitions |
| Applying `will-change` everywhere | Extra layers increase memory pressure | Profile first and limit layer promotion |
| Animating `width` every frame | Repeated layout can cause jank | Prefer transforms or profile the necessary layout change |
| Ignoring focus after moving a card | Focus can become confusing or obscured | Preserve logical order and test keyboard navigation |
| Making a visual move change semantics accidentally | Heading relationships or form ownership can break | Keep semantic hierarchy intentional |
| Using Flip for continuous resize | Repeated state capture creates unnecessary work | Let responsive CSS handle normal viewport resizing |
| Forgetting route cleanup | Stale tweens can affect the next page | Revert component context during teardown |
| Using a fixed target selector globally | Multiple instances can animate together | Scope targets to a component root |
| Trusting a `display: none` target’s dimensions | Hidden geometry may be zero or unavailable | Reveal/measure the target or choose a different approach |
| Testing only the happy path | Interrupted or missing-target cases fail in production | Test rapid clicks, missing nodes, and teardown |
| Treating `@supports` as a plugin check | CSS feature detection cannot confirm GSAP loaded | Handle JS/plugin errors and preserve the baseline |

## 18. Mental Models

1. **First is a snapshot.** Capture before the DOM changes.
2. **Last is the real layout.** Let CSS and the application model define the destination.
3. **Invert is temporary.** The transform bridges states and should not become the permanent layout model.
4. **Play restores truth.** The final DOM and CSS must be correct after the tween finishes.
5. **Identity beats position.** Stable IDs matter more than array indexes when items move.
6. **DOM order is semantics.** Visual interpolation should not replace correct source order.
7. **A component owns its animation.** Scope selectors and clean up during teardown.
8. **Reduced motion is a different path.** Preserve the final state while removing unnecessary spatial movement.
9. **Interruption is normal.** A user can change their mind before an animation completes.
10. **Measure before optimizing.** Use DevTools rather than adding layer hints blindly.
11. **Layout changes are the input.** Flip is most useful when the before/after geometry is meaningful.
12. **Motion is optional; meaning is not.** Content and controls remain available without the animation.

## 19. Build Challenge: Create an Accessible Project Gallery

Build a project gallery with grid, compact, and selected-detail states. Users can sort, filter, and open a card. Flip should preserve visual continuity without owning application state.

1. Use semantic `<main>`, `<section>`, `<ul>`, `<li>`, `<article>`, headings, and `<button>` elements.
2. Give every project a stable ID and stable framework key.
3. Make the default grid readable before GSAP initializes.
4. Register Flip from the installed GSAP package.
5. Capture the current card geometry before changing layout or DOM order.
6. Implement a sort action that updates the data model rather than directly mutating framework-owned DOM.
7. Animate surviving cards into their new positions.
8. Add a selected-detail state with a clear close control and an accessible heading.
9. Preserve logical keyboard focus when opening and closing details.
10. Ensure that duplicated content is not exposed twice to assistive technology.
11. Use `gsap.matchMedia()` or an equivalent media-query strategy to respect `prefers-reduced-motion`.
12. Provide visible `:focus-visible` styles with sufficient contrast.
13. Define an interruption policy for rapid repeated activation.
14. Revert animations and remove listeners on unmount.
15. Add a development helper that reports target IDs and computed geometry with `console.table`.
16. Test a missing target and ensure the gallery remains usable.
17. Test a hidden detail target and confirm you do not rely on unavailable geometry.
18. Test rapid sorting, filtering, opening, and closing before animations finish.
19. Test at narrow and wide viewport sizes and with browser zoom.
20. Use DevTools Performance and Layers panels to check for repeated layout, paint, and excessive layer count.
21. Verify the result in supported Safari, Firefox, and Chromium versions.
22. Confirm the final DOM order reflects the application’s intended order even when motion is disabled.

### Test matrix

| Scenario | Expected result |
|---|---|
| JavaScript disabled | Gallery content remains readable |
| Flip plugin import fails | No blank cards or inaccessible controls |
| Reduced motion enabled | Layout changes without spatial animation |
| Rapid repeated sorting | Final order matches application state |
| Filter removes items | Remaining items are correctly ordered and accessible |
| Detail opens | Focus and heading context remain understandable |
| Detail closes | Focus returns to a sensible trigger |
| Missing selector | No fatal exception; baseline content remains usable |
| Resize across breakpoints | CSS layout remains correct without resize-driven animation loops |
| Route unmount | No stale inline transforms or active component animations |
| Keyboard-only use | Every action is reachable and visibly focused |
| Performance profile | No avoidable layout churn or severe jank |

## Definition of Done

- [ ] The initial state is captured before any layout mutation.
- [ ] The final layout is defined by CSS and application state, not by permanent animation transforms.
- [ ] Target selection is scoped to the component and item identity is stable.
- [ ] Framework-owned DOM is updated through the framework’s state model.
- [ ] `scale`, `absolute`, `nested`, and property interpolation are used only when justified.
- [ ] Rapid interactions have a clear and tested interruption policy.
- [ ] The no-JavaScript baseline remains readable and usable.
- [ ] Reduced-motion behavior removes unnecessary movement without hiding content.
- [ ] Keyboard focus, accessible names, semantic order, and `:focus-visible` are verified.
- [ ] Component cleanup reverts animations and releases custom listeners.
- [ ] DevTools inspection confirms final geometry, and Performance/Layers inspection reveals no avoidable bottleneck.
- [ ] The gallery passes missing-target, hidden-target, rapid-interaction, route-change, and browser-matrix tests.

## Quick Reference

| Need | Use | Caution |
|---|---|---|
| Capture old geometry | `Flip.getState(targets)` | Call before changing layout |
| Animate into current layout | `Flip.from(state, vars)` | Current DOM must already reflect the destination |
| Register the plugin | `gsap.registerPlugin(Flip)` | Match the installed GSAP version |
| Animate multiple items | `stagger` | Keep sequencing purposeful |
| Preserve element identity | Stable IDs / `data-flip-id` | Avoid duplicates |
| Coordinate nested targets | `nested: true` when needed | Inspect parent/child transforms |
| Avoid scaling text | `scale: false` | Geometry may need a different strategy |
| Reduce flow interference | `absolute: true` where appropriate | Check containing blocks and overflow |
| Capture extra CSS properties | `props` in `Flip.getState()` | Capture only what needs interpolation |
| Fit one element to another | `Flip.fit(source, target, vars)` | Target must have measurable geometry |
| Scope animation setup | `gsap.context()` / `useGSAP()` | Clean up on unmount |
| Respect motion preference | `prefers-reduced-motion` | Keep the final layout available |
| Debug dimensions | `getBoundingClientRect()` | Do not repeatedly measure per frame |
| Inspect computed style | `getComputedStyle()` | Compare initial and final states |
| Diagnose active layers | DevTools Layers panel | Do not force layers without evidence |
| Diagnose jank | DevTools Performance panel | Look for layout, paint, and long tasks |
| Test CSS capability | `@supports` / caniuse | Does not verify plugin loading |
| Protect keyboard focus | `:focus-visible` | Check after DOM moves |
| Handle React updates | Capture before update, animate after commit | Use stable keys and cleanup |
| Handle interruption | Kill/replace active tween by policy | Killing animation does not undo app state |

## Final Operating Rule

Use Flip when continuity between two real layout states helps users understand what changed. Capture the old geometry, update the actual layout, animate toward the new geometry, and leave the DOM and application state correct when the motion ends. Keep semantic content, focus behavior, reduced-motion support, responsive layouts, and cleanup independent from the animation itself.


## Field Notes: State capture and identity

Treat state capture as a short transaction. Identify the exact elements, capture their geometry, update the application or DOM state, and then run the transition. If unrelated asynchronous work can change layout between capture and mutation, either prevent that race or capture as close as possible to the state change. A snapshot taken before an unrelated image, font, or panel update may describe a layout that no longer exists.

For list animations, identity must survive sorting and filtering. Use stable IDs that come from the data model. Array indexes describe current position, not identity. If the item at index two changes after filtering, an index-based match can cause a transition to appear attached to the wrong card. In React, stable keys help preserve component identity, but the Flip target matching strategy still needs to be intentional.

When state changes are asynchronous, define exactly which render is the “Last” state. Capture before dispatching the update, then animate after the framework commits the destination DOM. If the update is cancelled or superseded, clear the pending snapshot and avoid animating stale state.


## Field Notes: Geometry and containing blocks

Flip uses measured geometry and transforms to create continuity. CSS containing blocks, transforms on ancestors, overflow clipping, and positioned elements can all affect how the inverted state is rendered. When a transition looks correct in one container but drifts in another, inspect the nearest positioned ancestors and any transform applied to a parent.

`absolute: true` can be useful for keeping elements from affecting layout during a transition, but it changes how the element participates in flow. Confirm that the parent retains the intended dimensions and that the element is not clipped. Avoid setting absolute positioning as a universal fix. Try a normal-flow transition first, then choose the option based on a specific geometry issue.

The final CSS layout must remain correct after the animation completes. If the page only looks correct because an inline transform is left behind, the transition has become a hidden layout dependency. Test a second state change and a resize after the first animation; those are effective ways to expose stale transforms.


## Field Notes: Framework lifecycle and cleanup

Animation setup belongs in a framework lifecycle boundary, not in the render function. The component root should scope selectors so that two instances do not animate one another. Revert the GSAP context when the component unmounts and separately remove any custom listeners, observers, or timers created outside that context.

React Strict Mode may intentionally exercise setup and cleanup more than once in development. Duplicate animation behavior is evidence to investigate, not a reason to disable the checks. Verify that a cleanup path is safe to call and that a pending state snapshot cannot outlive the component that captured it.

When a component’s props or item list changes, decide whether to recreate the animation setup, animate a new state transition, or merely refresh layout. These are different tasks. Avoid rebuilding all triggers and listeners for every minor render when a targeted transition would be enough.


## Field Notes: Accessibility and interaction state

Visual continuity should not decide application state. The selected item, sort order, expanded state, and dialog state should be represented in the application model and semantic DOM. A tween can be interrupted, disabled, or fail to initialize; the application still needs to reach the correct final state.

For dialogs, follow the appropriate dialog pattern: give the dialog an accessible name, manage focus on open and close, provide a close mechanism, and ensure focus is not left inside hidden content. Flip can animate the shared visual, but it does not supply dialog semantics. If a card is moved into a detail panel, check whether its heading level and relationship to surrounding content still make sense.

Use semantic controls rather than clickable generic containers. Preserve visible `:focus-visible` indicators, keyboard operation, and a logical reading order. If sorting changes the order of meaningful items, consider whether users need a status announcement. Test the result with reduced motion and keyboard-only navigation.


## Field Notes: Browser and performance validation

Flip’s geometry behavior should be tested in the browsers the product supports. Check Safari, Firefox, and Chromium where applicable, especially if the layout uses SVG, nested transforms, unusual overflow rules, or responsive grid behavior. GSAP plugin behavior should be checked against official documentation for the installed version; caniuse is useful for platform features, not for confirming that a JavaScript plugin has loaded.

Record the transition in DevTools Performance. Look for repeated layout, expensive paint, long tasks, and dropped frames. Inspect the Layers panel if many cards are promoted to separate layers. Avoid broad `will-change` declarations: extra layers can consume memory and can make a large gallery slower rather than faster.

Use `getBoundingClientRect()` and `getComputedStyle()` in a manually invoked debugging helper to compare target geometry and styles. Do not poll these values on every frame unless there is a profiled requirement. Keep diagnostics out of production and avoid logging every animation update.
