# SKILL: react-animation-hooks
**Layer:** 12 — React Deep Dive
**Goal:** Coordinate animation lifecycles with React state and effects while respecting reduced motion, interruption, and cleanup.

---

## Why This Matters (Senior Perspective)

In production, react animation hooks failures rarely appear as a neat isolated bug. They emerge at boundaries: a component rerenders after a parent update, a request finishes after the user has changed the query, an overlay loses keyboard focus, or a WebGL scene updates at frame rate while React is asked to reconcile every frame. The visible symptom may be a flicker, stale content, duplicated network traffic, a frozen interaction, a hydration warning, or a client report that the interface feels unreliable. These failures are costly because they often pass a quick happy-path demo and surface only under real navigation, slow networks, Strict Mode, mobile hardware, or assistive technology.

A beginner tends to respond to symptoms by adding another state variable, memoizing everything, suppressing a lint warning, or moving code until the warning disappears. A senior engineer first identifies the ownership model: what is source state, what is derived, what external system is being synchronized, which identity controls reuse, and what lifecycle must be cleaned up. They then reproduce the failure, inspect React DevTools and browser behavior, write a narrow regression test, and choose the smallest design that makes the invariant obvious. Optimization is evidence-led; correctness and comprehensible contracts come first.

This matters especially for creative portfolio sites, interactive product showcases, and freelance client work. A custom case-study page may combine animated sections, search, dialogs, remote content, and a 3D product viewer. If react animation hooks is treated casually, the result may look polished in a desktop recording yet break when the visitor navigates with a keyboard, uses a phone, opens a second overlay, or has a reduced-motion preference. A robust implementation makes the experience resilient under interruption and keeps the next developer able to change it without fear.

---

## Core Concepts

### 1. Declarative versus imperative animation

The useful mental model for **declarative versus imperative animation** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function DeclarativeVersusImperativeAnimationPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Declarative versus imperative animation</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For declarative versus imperative animation, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement declarative versus imperative animation by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Object and function identity can change even when their contents look equivalent.

### 2. Animation lifecycle state

The useful mental model for **animation lifecycle state** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function AnimationLifecycleStatePanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Animation lifecycle state</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For animation lifecycle state, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement animation lifecycle state by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** An effect cleanup runs before a changed effect is set up again, not only at final unmount.

### 3. useEffect and useLayoutEffect timing

The useful mental model for **useeffect and uselayouteffect timing** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function UseeffectAndUselayouteffectTimingPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">useEffect and useLayoutEffect timing</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For useeffect and uselayouteffect timing, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement useeffect and uselayouteffect timing by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Strict Mode development checks can expose non-idempotent setup and missing cleanup.

### 4. requestAnimationFrame loops

The useful mental model for **requestanimationframe loops** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function RequestanimationframeLoopsPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">requestAnimationFrame loops</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For requestanimationframe loops, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement requestanimationframe loops by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A stale closure can preserve an earlier value even though the screen now shows a newer one.

### 5. Web Animations API integration

The useful mental model for **web animations api integration** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function WebAnimationsApiIntegrationPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Web Animations API integration</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For web animations api integration, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement web animations api integration by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A ref mutation does not schedule a render, which is useful for imperative state but wrong for visible UI state.

### 6. IntersectionObserver triggers

The useful mental model for **intersectionobserver triggers** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function IntersectionobserverTriggersPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">IntersectionObserver triggers</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For intersectionobserver triggers, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement intersectionobserver triggers by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** React may render a component more than once, so render-time code must not mutate external systems.

### 7. Cleanup and interruption

The useful mental model for **cleanup and interruption** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function CleanupAndInterruptionPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Cleanup and interruption</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For cleanup and interruption, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement cleanup and interruption by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Object and function identity can change even when their contents look equivalent.

### 8. Reduced-motion preferences

The useful mental model for **reduced-motion preferences** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function ReducedMotionPreferencesPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Reduced-motion preferences</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For reduced-motion preferences, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement reduced-motion preferences by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** An effect cleanup runs before a changed effect is set up again, not only at final unmount.

### 9. Avoiding layout thrashing

The useful mental model for **avoiding layout thrashing** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function AvoidingLayoutThrashingPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Avoiding layout thrashing</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For avoiding layout thrashing, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement avoiding layout thrashing by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Strict Mode development checks can expose non-idempotent setup and missing cleanup.

### 10. Presence and exit animation

The useful mental model for **presence and exit animation** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function PresenceAndExitAnimationPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Presence and exit animation</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For presence and exit animation, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement presence and exit animation by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A stale closure can preserve an earlier value even though the screen now shows a newer one.

### 11. SSR and hydration safety

The useful mental model for **ssr and hydration safety** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function SsrAndHydrationSafetyPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">SSR and hydration safety</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For ssr and hydration safety, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement ssr and hydration safety by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A ref mutation does not schedule a render, which is useful for imperative state but wrong for visible UI state.

### 12. Integrated scroll-aware feature reveal

The useful mental model for **integrated scroll-aware feature reveal** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useEffect, useState } from "react";

export function IntegratedScrollAwareFeatureRevealPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Integrated scroll-aware feature reveal</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For integrated scroll-aware feature reveal, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement integrated scroll-aware feature reveal by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** React may render a component more than once, so render-time code must not mutate external systems.

---

### Advanced implementation drills

**Focused implementation example 1: Respect reduced motion.** Honor system preferences before starting decorative motion.

```jsx
animation.pause();
```

**Focused implementation example 2: Cancel animation frame.** Animation work must stop when its owner unmounts.

```jsx
animation.cancel();
```

**Focused implementation example 3: Restart on target change.** Tie animation lifetime to the target and configuration that define it.

```jsx
if (reduceMotion) return;
```

**Focused implementation example 4: Respect reduced motion.** Honor system preferences before starting decorative motion.

```jsx
animation.pause();
```

**Focused implementation example 5: Cancel animation frame.** Animation work must stop when its owner unmounts.

```jsx
animation.cancel();
```

**Focused implementation example 6: Restart on target change.** Tie animation lifetime to the target and configuration that define it.

```jsx
if (reduceMotion) return;
```

**Focused implementation example 7: Respect reduced motion.** Honor system preferences before starting decorative motion.

```jsx
animation.pause();
```

**Focused implementation example 8: Cancel animation frame.** Animation work must stop when its owner unmounts.

```jsx
animation.cancel();
```

**Focused implementation example 9: Restart on target change.** Tie animation lifetime to the target and configuration that define it.

```jsx
if (reduceMotion) return;
```

**Focused implementation example 10: Respect reduced motion.** Honor system preferences before starting decorative motion.

```jsx
animation.pause();
```

**Focused implementation example 11: Cancel animation frame.** Animation work must stop when its owner unmounts.

```jsx
animation.cancel();
```

**Focused implementation example 12: Restart on target change.** Tie animation lifetime to the target and configuration that define it.

```jsx
if (reduceMotion) return;
```


## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Narrow ownership boundary

**What it does:** Keep state next to the smallest subtree that needs to coordinate around it.

**When to use it:** Use this when implementing react animation hooks in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useEffect, useState } from "react";

export function DeclarativeVersusImperativeAnimationPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Declarative versus imperative animation</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 2: Explicit lifecycle cleanup

**What it does:** Pair every subscription, timer, observer, or imperative resource with teardown.

**When to use it:** Use this when implementing react animation hooks in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useEffect, useState } from "react";

export function AnimationLifecycleStatePanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Animation lifecycle state</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 3: Stable contract, not blanket memoization

**What it does:** Stabilize identity only where a measured consumer benefits from it.

**When to use it:** Use this when implementing react animation hooks in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useEffect, useState } from "react";

export function UseeffectAndUselayouteffectTimingPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">useEffect and useLayoutEffect timing</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 4: Failure-first state machine

**What it does:** Represent loading, success, empty, and error states as distinct UI outcomes.

**When to use it:** Use this when implementing react animation hooks in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useEffect, useState } from "react";

export function RequestanimationframeLoopsPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">requestAnimationFrame loops</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 5: Accessible interaction path

**What it does:** Make keyboard, focus, and assistive-technology behavior part of the component contract.

**When to use it:** Use this when implementing react animation hooks in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useEffect, useState } from "react";

export function WebAnimationsApiIntegrationPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">Web Animations API integration</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
    </section>
  );
}
```

Keep the boundary small and observable. Do not use this pattern to hide a missing data contract or to optimize a path that profiling has not shown to be expensive; test the interruption and cleanup path as well as the happy path.

### Pattern 6: Measured integration boundary

**What it does:** Use profiling, tests, and instrumentation to validate the real bottleneck.

**When to use it:** Use this when implementing react animation hooks in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useEffect, useState } from "react";

export function IntersectionobserverTriggersPanel() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    // Keep synchronization tied to the values that actually define the work.
    if (!query.trim()) {
      setStatus("idle");
      return;
    }
    setStatus("ready");
  }, [query]);

  return (
    <section aria-labelledby="panel-title">
      <h2 id="panel-title">IntersectionObserver triggers</h2>
      <label htmlFor="panel-query">Search records</label>
      <input id="panel-query" value={query} onChange={event => setQuery(event.target.value)} />
      <p role="status">Status: {status}</p>
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

**Code check 1: Cancel stale animation.** Cancel the previous animation before a new lifecycle owns the element.

```jsx
return () => animation.cancel();
```

**Code check 2: Reduced-motion branch.** Offer a real reduced-motion path.

```jsx
const shouldAnimate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

**Code check 3: Animate transform.** Prefer compositor-friendly transforms for simple movement.

```jsx
node.animate([{ transform: "translateY(12px)" }, { transform: "translateY(0)" }], { duration: 240, fill: "both" });
```

**Code check 4: Avoid state per frame.** Keep frame-frequency values outside React state unless UI must display them.

```jsx
useFrameValue.current = progress;
```

**Code check 5: Respect interruption.** Treat a new interaction as ownership of the next animation.

```jsx
if (activeAnimation.current) activeAnimation.current.cancel();
```


### Focused verification snippets

**Verification snippet 1: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 1: make the contract explicit before integrating the feature.
const invariant1 = Boolean(featureEnabled) && resource != null;
if (!invariant1) return null;
```

**Verification snippet 2: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 2: make the contract explicit before integrating the feature.
const invariant2 = Boolean(featureEnabled) && resource != null;
if (!invariant2) return null;
```

**Verification snippet 3: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 3: make the contract explicit before integrating the feature.
const invariant3 = Boolean(featureEnabled) && resource != null;
if (!invariant3) return null;
```

**Verification snippet 4: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 4: make the contract explicit before integrating the feature.
const invariant4 = Boolean(featureEnabled) && resource != null;
if (!invariant4) return null;
```

**Verification snippet 5: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 5: make the contract explicit before integrating the feature.
const invariant5 = Boolean(featureEnabled) && resource != null;
if (!invariant5) return null;
```

**Verification snippet 6: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 6: make the contract explicit before integrating the feature.
const invariant6 = Boolean(featureEnabled) && resource != null;
if (!invariant6) return null;
```

**Verification snippet 7: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 7: make the contract explicit before integrating the feature.
const invariant7 = Boolean(featureEnabled) && resource != null;
if (!invariant7) return null;
```

**Verification snippet 8: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 8: make the contract explicit before integrating the feature.
const invariant8 = Boolean(featureEnabled) && resource != null;
if (!invariant8) return null;
```

**Verification snippet 9: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 9: make the contract explicit before integrating the feature.
const invariant9 = Boolean(featureEnabled) && resource != null;
if (!invariant9) return null;
```

**Verification snippet 10: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 10: make the contract explicit before integrating the feature.
const invariant10 = Boolean(featureEnabled) && resource != null;
if (!invariant10) return null;
```

**Verification snippet 11: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 11: make the contract explicit before integrating the feature.
const invariant11 = Boolean(featureEnabled) && resource != null;
if (!invariant11) return null;
```

**Verification snippet 12: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 12: make the contract explicit before integrating the feature.
const invariant12 = Boolean(featureEnabled) && resource != null;
if (!invariant12) return null;
```

**Verification snippet 13: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 13: make the contract explicit before integrating the feature.
const invariant13 = Boolean(featureEnabled) && resource != null;
if (!invariant13) return null;
```

**Verification snippet 14: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 14: make the contract explicit before integrating the feature.
const invariant14 = Boolean(featureEnabled) && resource != null;
if (!invariant14) return null;
```

**Verification snippet 15: animation hooks invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 15: make the contract explicit before integrating the feature.
const invariant15 = Boolean(featureEnabled) && resource != null;
if (!invariant15) return null;
```

## Build Challenge
### Build: Interruptible Motion Showcase

Build this focused deliverable as a realistic component for a creative portfolio or client-facing product site. Keep the challenge specific to **react-animation-hooks**; do not substitute generic React hygiene for the actual skill being demonstrated.

### Requirements
1. Animate a case-study panel when it enters the active state.
2. Respect prefers-reduced-motion before starting decorative motion.
3. Cancel animations when the component unmounts or the target changes.
4. Handle rapid open-close-open transitions without stale callbacks.
5. Keep animation frame updates out of high-frequency React state.
6. Provide a no-animation path that preserves the same final state.
7. Test cleanup under Strict Mode.
8. Ensure motion does not hide essential content or controls.
9. Use a documented easing and duration token rather than arbitrary values.
10. Test interruption halfway through an animation.
11. Record how the implementation behaves when a tab is backgrounded.
12. Explain which state is authoritative: React state or animation progress.

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
