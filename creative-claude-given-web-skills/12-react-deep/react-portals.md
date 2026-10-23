# SKILL: react-portals
**Layer:** 12 — React Deep Dive
**Goal:** Render overlays outside clipping and stacking contexts while preserving React ownership, focus, event propagation, and cleanup.

---

## Why This Matters (Senior Perspective)

In production, react portals failures rarely appear as a neat isolated bug. They emerge at boundaries: a component rerenders after a parent update, a request finishes after the user has changed the query, an overlay loses keyboard focus, or a WebGL scene updates at frame rate while React is asked to reconcile every frame. The visible symptom may be a flicker, stale content, duplicated network traffic, a frozen interaction, a hydration warning, or a client report that the interface feels unreliable. These failures are costly because they often pass a quick happy-path demo and surface only under real navigation, slow networks, Strict Mode, mobile hardware, or assistive technology.

A beginner tends to respond to symptoms by adding another state variable, memoizing everything, suppressing a lint warning, or moving code until the warning disappears. A senior engineer first identifies the ownership model: what is source state, what is derived, what external system is being synchronized, which identity controls reuse, and what lifecycle must be cleaned up. They then reproduce the failure, inspect React DevTools and browser behavior, write a narrow regression test, and choose the smallest design that makes the invariant obvious. Optimization is evidence-led; correctness and comprehensible contracts come first.

This matters especially for creative portfolio sites, interactive product showcases, and freelance client work. A custom case-study page may combine animated sections, search, dialogs, remote content, and a 3D product viewer. If react portals is treated casually, the result may look polished in a desktop recording yet break when the visitor navigates with a keyboard, uses a phone, opens a second overlay, or has a reduced-motion preference. A robust implementation makes the experience resilient under interruption and keeps the next developer able to change it without fear.

---

## Core Concepts

### 1. Portal rendering model

The useful mental model for **portal rendering model** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function PortalRenderingModelExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Portal rendering model</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For portal rendering model, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement portal rendering model by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Object and function identity can change even when their contents look equivalent.

### 2. Choosing a portal root

The useful mental model for **choosing a portal root** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ChoosingAPortalRootExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Choosing a portal root</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For choosing a portal root, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement choosing a portal root by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** An effect cleanup runs before a changed effect is set up again, not only at final unmount.

### 3. Stacking contexts and clipping

The useful mental model for **stacking contexts and clipping** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function StackingContextsAndClippingExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Stacking contexts and clipping</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For stacking contexts and clipping, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement stacking contexts and clipping by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Strict Mode development checks can expose non-idempotent setup and missing cleanup.

### 4. React event propagation

The useful mental model for **react event propagation** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ReactEventPropagationExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">React event propagation</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For react event propagation, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement react event propagation by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A stale closure can preserve an earlier value even though the screen now shows a newer one.

### 5. Focus entry and restoration

The useful mental model for **focus entry and restoration** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function FocusEntryAndRestorationExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Focus entry and restoration</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For focus entry and restoration, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement focus entry and restoration by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A ref mutation does not schedule a render, which is useful for imperative state but wrong for visible UI state.

### 6. Escape and outside-click behavior

The useful mental model for **escape and outside-click behavior** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function EscapeAndOutsideClickBehaviorExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Escape and outside-click behavior</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For escape and outside-click behavior, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement escape and outside-click behavior by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** React may render a component more than once, so render-time code must not mutate external systems.

### 7. Scroll locking

The useful mental model for **scroll locking** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ScrollLockingExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Scroll locking</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For scroll locking, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement scroll locking by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Object and function identity can change even when their contents look equivalent.

### 8. Nested overlays

The useful mental model for **nested overlays** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function NestedOverlaysExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Nested overlays</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For nested overlays, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement nested overlays by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** An effect cleanup runs before a changed effect is set up again, not only at final unmount.

### 9. SSR-safe portal mounting

The useful mental model for **ssr-safe portal mounting** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function SsrSafePortalMountingExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">SSR-safe portal mounting</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For ssr-safe portal mounting, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement ssr-safe portal mounting by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Strict Mode development checks can expose non-idempotent setup and missing cleanup.

### 10. Unmount and detached roots

The useful mental model for **unmount and detached roots** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function UnmountAndDetachedRootsExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Unmount and detached roots</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For unmount and detached roots, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement unmount and detached roots by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A stale closure can preserve an earlier value even though the screen now shows a newer one.

### 11. Accessibility semantics

The useful mental model for **accessibility semantics** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function AccessibilitySemanticsExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Accessibility semantics</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For accessibility semantics, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement accessibility semantics by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A ref mutation does not schedule a render, which is useful for imperative state but wrong for visible UI state.

### 12. Integrated modal and toast system

The useful mental model for **integrated modal and toast system** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function IntegratedModalAndToastSystemExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Integrated modal and toast system</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For integrated modal and toast system, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement integrated modal and toast system by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** React may render a component more than once, so render-time code must not mutate external systems.

---

### Advanced implementation drills

**Focused implementation example 1: Portal target.** Treat the portal mount point as an explicit application contract.

```jsx
return createPortal(<div role="dialog" aria-modal="true">{children}</div>, root);
```

**Focused implementation example 2: Escape handling.** Register global keyboard behavior only while the overlay is active.

```jsx
dialogRef.current?.focus();
```

**Focused implementation example 3: Restore focus.** Preserve the user's place in the interaction flow.

```jsx
triggerRef.current?.focus();
```

**Focused implementation example 4: Portal target.** Treat the portal mount point as an explicit application contract.

```jsx
return createPortal(<div role="dialog" aria-modal="true">{children}</div>, root);
```

**Focused implementation example 5: Escape handling.** Register global keyboard behavior only while the overlay is active.

```jsx
dialogRef.current?.focus();
```

**Focused implementation example 6: Restore focus.** Preserve the user's place in the interaction flow.

```jsx
triggerRef.current?.focus();
```

**Focused implementation example 7: Portal target.** Treat the portal mount point as an explicit application contract.

```jsx
return createPortal(<div role="dialog" aria-modal="true">{children}</div>, root);
```

**Focused implementation example 8: Escape handling.** Register global keyboard behavior only while the overlay is active.

```jsx
dialogRef.current?.focus();
```

**Focused implementation example 9: Restore focus.** Preserve the user's place in the interaction flow.

```jsx
triggerRef.current?.focus();
```

**Focused implementation example 10: Portal target.** Treat the portal mount point as an explicit application contract.

```jsx
return createPortal(<div role="dialog" aria-modal="true">{children}</div>, root);
```

**Focused implementation example 11: Escape handling.** Register global keyboard behavior only while the overlay is active.

```jsx
dialogRef.current?.focus();
```

**Focused implementation example 12: Restore focus.** Preserve the user's place in the interaction flow.

```jsx
triggerRef.current?.focus();
```


## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Narrow ownership boundary

**What it does:** Keep state next to the smallest subtree that needs to coordinate around it.

**When to use it:** Use this when implementing react portals in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function PortalRenderingModelExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Portal rendering model</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 2: Explicit lifecycle cleanup

**What it does:** Pair every subscription, timer, observer, or imperative resource with teardown.

**When to use it:** Use this when implementing react portals in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function ChoosingAPortalRootExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Choosing a portal root</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 3: Stable contract, not blanket memoization

**What it does:** Stabilize identity only where a measured consumer benefits from it.

**When to use it:** Use this when implementing react portals in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function StackingContextsAndClippingExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Stacking contexts and clipping</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 4: Failure-first state machine

**What it does:** Represent loading, success, empty, and error states as distinct UI outcomes.

**When to use it:** Use this when implementing react portals in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function ReactEventPropagationExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">React event propagation</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 5: Accessible interaction path

**What it does:** Make keyboard, focus, and assistive-technology behavior part of the component contract.

**When to use it:** Use this when implementing react portals in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function FocusEntryAndRestorationExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Focus entry and restoration</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 6: Measured integration boundary

**What it does:** Use profiling, tests, and instrumentation to validate the real bottleneck.

**When to use it:** Use this when implementing react portals in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function EscapeAndOutsideClickBehaviorExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Escape and outside-click behavior</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Calling a hook conditionally | The author thinks hooks belong to a branch rather than a stable component call sequence. | Move the hook to the component top level and conditionally use its result. |
| Storing a value that can be derived | Duplicated state appears easier to read but creates synchronization work. | Compute the value during render or memoize only if measurement justifies it. |
| Using an effect for a user event | Effects are mistaken for a general-purpose place to run code. | Perform event-caused work in the event handler and reserve effects for synchronization. |
| Omitting a real dependency | The closure captures an older value and appears correct only on the first render. | Declare all reactive dependencies and restructure the effect to express its true inputs. |
| Suppressing exhaustive-deps without analysis | A lint warning is treated as noise instead of a design signal. | Restructure dependencies, use a functional update, or move stable constants outside the component. |
| Mutating state in place | The reference stays the same and React may not observe the intended change. | Create a new object or array for each state transition. |
| Using array index as a changing list key | Reconciliation associates state with positions rather than item identity. | Use a stable domain identifier for each list item. |
| Memoizing every callback | Memoization adds complexity without necessarily avoiding meaningful work. | Profile first and memoize only when identity affects a measured child or dependency. |
| Putting high-frequency values in React state | Frame or pointer updates trigger expensive reconciliation at excessive frequency. | Store imperative frame data in refs or an external store and publish only meaningful changes. |
| Starting a subscription without cleanup | The code assumes the component will remain mounted forever. | Return a cleanup function that removes the exact listener or subscription. |
| Ignoring request races | A slower earlier request can overwrite a newer result. | Abort obsolete work or guard commits with a request identity. |
| Treating loading as the only non-success state | Empty results and failures become indistinguishable to users. | Model idle, loading, success, empty, and error outcomes explicitly. |
| Breaking keyboard operation | The component was tested only with pointer interaction. | Use semantic controls and test Tab, Shift+Tab, Enter, Space, and Escape where relevant. |
| Assuming client-only browser APIs during SSR | Module evaluation or initial render references unavailable globals. | Access browser APIs in effects and keep initial server/client output consistent. |
| Ignoring Strict Mode cleanup signals | Development-only duplicate setup is mistaken for a framework defect. | Make setup idempotent and verify cleanup fully reverses acquired resources. |
| Creating unstable provider values | Fresh object identities fan out rerenders to every context consumer. | Split contexts or memoize the provider value when it reduces measured work. |

**Before → After:** avoid mutating shared state or suppressing lifecycle warnings; make the state transition and resource lifetime explicit.

```jsx
// Before: mutates an existing collection and keeps the same identity.
items.push(newItem);
setItems(items);

// After: publish a new collection so React can observe the transition.
setItems(currentItems => [...currentItems, newItem]);
```

---

## Mental Models

1. **Render is a calculation** — Rendering describes the UI; it should not start external work or mutate shared resources.
2. **State is a snapshot** — An event handler sees the state snapshot from the render that created it.
3. **Effects synchronize** — An effect connects React to an external system and must define setup and teardown.
4. **Identity is observable** — References, keys, and dependency values influence reuse and rerender behavior.
5. **Locality reduces blast radius** — Keep state and subscriptions close to the components that truly own them.
6. **Measure before optimizing** — A profiler trace is stronger evidence than a hunch about rerender count.
7. **Interruption is normal** — Requests, animations, and overlays must remain correct when users change direction.

---

## Quick Reference

| Situation | Preferred approach | Verification note |
|---|---|---|
| Visible UI value changes | useState or useReducer | Assert the new UI after the interaction. |
| Value derived from props/state | Compute during render | Avoid a redundant synchronization effect. |
| External subscription | Effect with exact cleanup | Unmount and confirm no callback remains. |
| Previous state determines next | Functional state updater | Test rapid repeated events. |
| Expensive derived calculation | Profile, then consider useMemo | Compare before and after profiling. |
| Stable imperative handle | useRef | Confirm ref mutation does not need to update UI. |
| Long dynamic list | Stable item keys and virtualization when measured | Test insertion, deletion, and reorder. |
| Async request becomes obsolete | AbortController or request identity | Resolve requests out of order in a test. |
| Cross-tree dependency | Context with a scoped provider | Check consumer update fan-out. |
| High-frequency animation | Mutable frame value and useFrame/RAF | Measure frame time on target hardware. |
| Overlay or dialog | Portal plus focus and dismissal contract | Keyboard-test entry, Escape, and restoration. |
| Server/client boundary | Serializable props and explicit client entry | Build and inspect hydration behavior. |
| Production error | Explicit error state and useful telemetry | Avoid exposing sensitive internal details. |
| Reduced motion | Honor prefers-reduced-motion or user setting | Verify motion is reduced, not merely shortened. |

---


### Additional topic-specific code checks

**Code check 1: Backdrop boundary.** Close only when the backdrop itself is activated.

```jsx
function onBackdropClick(event) { if (event.target === event.currentTarget) onClose(); }
```

**Code check 2: Dialog label.** Give a dialog a programmatic name.

```jsx
<section role="dialog" aria-modal="true" aria-labelledby="dialog-title">
```

**Code check 3: Focus first control.** Move focus into the active dialog when it opens.

```jsx
useEffect(() => { if (open) firstControlRef.current?.focus(); }, [open]);
```

**Code check 4: Body scroll lock.** Restore any global style modified by an overlay.

```jsx
useEffect(() => { if (!open) return; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, [open]);
```

**Code check 5: Portal fallback.** A missing portal target should have a deliberate fallback.

```jsx
if (!overlayRoot) return <InlineNotice />;
```


### Focused verification snippets

**Verification snippet 1: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 1: make the contract explicit before integrating the feature.
const invariant1 = Boolean(featureEnabled) && resource != null;
if (!invariant1) return null;
```

**Verification snippet 2: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 2: make the contract explicit before integrating the feature.
const invariant2 = Boolean(featureEnabled) && resource != null;
if (!invariant2) return null;
```

**Verification snippet 3: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 3: make the contract explicit before integrating the feature.
const invariant3 = Boolean(featureEnabled) && resource != null;
if (!invariant3) return null;
```

**Verification snippet 4: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 4: make the contract explicit before integrating the feature.
const invariant4 = Boolean(featureEnabled) && resource != null;
if (!invariant4) return null;
```

**Verification snippet 5: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 5: make the contract explicit before integrating the feature.
const invariant5 = Boolean(featureEnabled) && resource != null;
if (!invariant5) return null;
```

**Verification snippet 6: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 6: make the contract explicit before integrating the feature.
const invariant6 = Boolean(featureEnabled) && resource != null;
if (!invariant6) return null;
```

**Verification snippet 7: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 7: make the contract explicit before integrating the feature.
const invariant7 = Boolean(featureEnabled) && resource != null;
if (!invariant7) return null;
```

**Verification snippet 8: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 8: make the contract explicit before integrating the feature.
const invariant8 = Boolean(featureEnabled) && resource != null;
if (!invariant8) return null;
```

**Verification snippet 9: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 9: make the contract explicit before integrating the feature.
const invariant9 = Boolean(featureEnabled) && resource != null;
if (!invariant9) return null;
```

**Verification snippet 10: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 10: make the contract explicit before integrating the feature.
const invariant10 = Boolean(featureEnabled) && resource != null;
if (!invariant10) return null;
```

**Verification snippet 11: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 11: make the contract explicit before integrating the feature.
const invariant11 = Boolean(featureEnabled) && resource != null;
if (!invariant11) return null;
```

**Verification snippet 12: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 12: make the contract explicit before integrating the feature.
const invariant12 = Boolean(featureEnabled) && resource != null;
if (!invariant12) return null;
```

**Verification snippet 13: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 13: make the contract explicit before integrating the feature.
const invariant13 = Boolean(featureEnabled) && resource != null;
if (!invariant13) return null;
```

**Verification snippet 14: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 14: make the contract explicit before integrating the feature.
const invariant14 = Boolean(featureEnabled) && resource != null;
if (!invariant14) return null;
```

**Verification snippet 15: portals invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 15: make the contract explicit before integrating the feature.
const invariant15 = Boolean(featureEnabled) && resource != null;
if (!invariant15) return null;
```

## Build Challenge
### Build: Accessible Overlay System

Build this focused deliverable as a realistic component for a creative portfolio or client-facing product site. Keep the challenge specific to **react-portals**; do not substitute generic React hygiene for the actual skill being demonstrated.

### Requirements
1. Create a stable overlay root and render a dialog through a portal.
2. Keep React state ownership in the component that opens the overlay.
3. Move focus into the dialog when it opens and restore it when it closes.
4. Close the dialog with Escape while it is active.
5. Prevent background interaction while the modal is open.
6. Keep the dialog labelled and expose its modal semantics.
7. Test repeated open-close cycles for leaked listeners.
8. Verify clicks inside the dialog do not trigger backdrop dismissal.
9. Define a policy for nested overlays and stacking order.
10. Provide an inline fallback if the portal target is missing.
11. Test keyboard-only operation and focus order.
12. Document how portal DOM placement differs from React event ownership.

### Failure scenarios to test
- Exercise the primary skill-specific edge case under rapid interaction or changed inputs.
- Remove or fail one required dependency and verify the feature recovers without a blank screen.
- Unmount or navigate away during active work; verify there are no stale updates, leaked resources, or broken focus behavior.

### Definition of done
- [ ] The skill-specific behavior works in a realistic portfolio/client feature.
- [ ] At least one focused test covers the most important edge case.
- [ ] Cleanup, failure, and interruption behavior are demonstrated where relevant.
- [ ] The public component or hook API is documented with its ownership contract.
- [ ] Accessibility and responsive behavior are checked wherever the feature is user-facing.
- [ ] Lint, tests, and build results are recorded truthfully.
- [ ] The failure scenario is reproducible and the recovery behavior is explained.

### Expected output
A working feature, focused tests, a short implementation note, and evidence that the topic-specific edge case was exercised. Success means the implementation demonstrates **{name}** directly rather than merely passing a generic component checklist.
