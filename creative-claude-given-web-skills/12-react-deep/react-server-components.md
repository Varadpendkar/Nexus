# SKILL: react-server-components
**Layer:** 12 — React Deep Dive
**Goal:** Separate server-only data work from interactive client behavior while managing serialization, boundaries, caching, and security.

---

## Why This Matters (Senior Perspective)

In production, react server components failures rarely appear as a neat isolated bug. They emerge at boundaries: a component rerenders after a parent update, a request finishes after the user has changed the query, an overlay loses keyboard focus, or a WebGL scene updates at frame rate while React is asked to reconcile every frame. The visible symptom may be a flicker, stale content, duplicated network traffic, a frozen interaction, a hydration warning, or a client report that the interface feels unreliable. These failures are costly because they often pass a quick happy-path demo and surface only under real navigation, slow networks, Strict Mode, mobile hardware, or assistive technology.

A beginner tends to respond to symptoms by adding another state variable, memoizing everything, suppressing a lint warning, or moving code until the warning disappears. A senior engineer first identifies the ownership model: what is source state, what is derived, what external system is being synchronized, which identity controls reuse, and what lifecycle must be cleaned up. They then reproduce the failure, inspect React DevTools and browser behavior, write a narrow regression test, and choose the smallest design that makes the invariant obvious. Optimization is evidence-led; correctness and comprehensible contracts come first.

This matters especially for creative portfolio sites, interactive product showcases, and freelance client work. A custom case-study page may combine animated sections, search, dialogs, remote content, and a 3D product viewer. If react server components is treated casually, the result may look polished in a desktop recording yet break when the visitor navigates with a keyboard, uses a phone, opens a second overlay, or has a reduced-motion preference. A robust implementation makes the experience resilient under interruption and keeps the next developer able to change it without fear.

---

## Core Concepts

### 1. Server and client component boundaries

The useful mental model for **server and client component boundaries** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ServerAndClientComponentBoundariesExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Server and client component boundaries</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For server and client component boundaries, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement server and client component boundaries by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Object and function identity can change even when their contents look equivalent.

### 2. The client directive

The useful mental model for **the client directive** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function TheClientDirectiveExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">The client directive</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For the client directive, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement the client directive by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** An effect cleanup runs before a changed effect is set up again, not only at final unmount.

### 3. Server-only modules

The useful mental model for **server-only modules** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ServerOnlyModulesExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Server-only modules</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For server-only modules, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement server-only modules by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Strict Mode development checks can expose non-idempotent setup and missing cleanup.

### 4. Serializable props

The useful mental model for **serializable props** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function SerializablePropsExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Serializable props</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For serializable props, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement serializable props by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A stale closure can preserve an earlier value even though the screen now shows a newer one.

### 5. Data fetching on the server

The useful mental model for **data fetching on the server** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function DataFetchingOnTheServerExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Data fetching on the server</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For data fetching on the server, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement data fetching on the server by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A ref mutation does not schedule a render, which is useful for imperative state but wrong for visible UI state.

### 6. Streaming and Suspense

The useful mental model for **streaming and suspense** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function StreamingAndSuspenseExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Streaming and Suspense</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For streaming and suspense, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement streaming and suspense by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** React may render a component more than once, so render-time code must not mutate external systems.

### 7. Server actions and mutation boundaries

The useful mental model for **server actions and mutation boundaries** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ServerActionsAndMutationBoundariesExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Server actions and mutation boundaries</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For server actions and mutation boundaries, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement server actions and mutation boundaries by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Object and function identity can change even when their contents look equivalent.

### 8. Caching and revalidation

The useful mental model for **caching and revalidation** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function CachingAndRevalidationExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Caching and revalidation</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For caching and revalidation, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement caching and revalidation by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** An effect cleanup runs before a changed effect is set up again, not only at final unmount.

### 9. Secrets and authorization

The useful mental model for **secrets and authorization** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function SecretsAndAuthorizationExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Secrets and authorization</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For secrets and authorization, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement secrets and authorization by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** Strict Mode development checks can expose non-idempotent setup and missing cleanup.

### 10. Hydration mismatch prevention

The useful mental model for **hydration mismatch prevention** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function HydrationMismatchPreventionExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Hydration mismatch prevention</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For hydration mismatch prevention, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement hydration mismatch prevention by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A stale closure can preserve an earlier value even though the screen now shows a newer one.

### 11. Error boundaries and failure UX

The useful mental model for **error boundaries and failure ux** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function ErrorBoundariesAndFailureUxExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Error boundaries and failure UX</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For error boundaries and failure ux, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement error boundaries and failure ux by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** A ref mutation does not schedule a render, which is useful for imperative state but wrong for visible UI state.

### 12. Integrated secure product page

The useful mental model for **integrated secure product page** is to make ownership and timing explicit. React can render more than once, and render must remain a pure description of UI; side effects belong at a deliberate boundary. Decide which values are inputs, which are derived, and which external resources must be started or stopped. This distinction prevents accidental coupling between visual state and browser, network, or scene state.

A realistic component should expose semantic structure and a narrow interaction contract. The following example demonstrates the principle in a small, testable shape; adapt names and state transitions to the actual feature rather than copying it blindly.

```jsx
import { useState } from "react";

export function IntegratedSecureProductPageExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Integrated secure product page</h2>
      <p>Keep the component contract explicit so callers can predict its behavior.</p>
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && <article><p>State, lifecycle, and accessibility remain observable.</p></article>}
    </section>
  );
}
```

Read the example from the caller's perspective: the component makes its visible state explicit, gives interactive controls meaningful labels, and keeps the state transition close to the event that causes it. For integrated secure product page, the same discipline means checking dependencies, identity, cleanup, and failure behavior instead of relying on a happy-path render.

**Naive approach:** implement integrated secure product page by adding ad hoc state or an effect without documenting the invariant. This can appear correct initially but becomes fragile when props change, a request is interrupted, or the component unmounts.

**Correct approach:** define the invariant first, place ownership at the narrowest valid boundary, and verify the behavior after rerenders, unmounts, and rapid user input. Prefer a derived value over duplicated state; prefer explicit cleanup over hoping the browser or framework will infer intent.

**Gotcha:** React may render a component more than once, so render-time code must not mutate external systems.

---

### Advanced implementation drills

**Focused implementation example 1: Server-only data access.** Keep secrets and server-only dependencies on the server.

```jsx
const record = await repository.findById(params.id);
```

**Focused implementation example 2: Client boundary.** Mark interactive entry points deliberately.

```jsx
return <ClientControls projectId={project.id} />;
```

**Focused implementation example 3: Serializable props.** Pass the smallest serializable data shape across the boundary.

```jsx
export const dynamic = 'force-dynamic';
```

**Focused implementation example 4: Server-only data access.** Keep secrets and server-only dependencies on the server.

```jsx
const record = await repository.findById(params.id);
```

**Focused implementation example 5: Client boundary.** Mark interactive entry points deliberately.

```jsx
return <ClientControls projectId={project.id} />;
```

**Focused implementation example 6: Serializable props.** Pass the smallest serializable data shape across the boundary.

```jsx
export const dynamic = 'force-dynamic';
```

**Focused implementation example 7: Server-only data access.** Keep secrets and server-only dependencies on the server.

```jsx
const record = await repository.findById(params.id);
```

**Focused implementation example 8: Client boundary.** Mark interactive entry points deliberately.

```jsx
return <ClientControls projectId={project.id} />;
```

**Focused implementation example 9: Serializable props.** Pass the smallest serializable data shape across the boundary.

```jsx
export const dynamic = 'force-dynamic';
```

**Focused implementation example 10: Server-only data access.** Keep secrets and server-only dependencies on the server.

```jsx
const record = await repository.findById(params.id);
```

**Focused implementation example 11: Client boundary.** Mark interactive entry points deliberately.

```jsx
return <ClientControls projectId={project.id} />;
```

**Focused implementation example 12: Serializable props.** Pass the smallest serializable data shape across the boundary.

```jsx
export const dynamic = 'force-dynamic';
```


## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Narrow ownership boundary

**What it does:** Keep state next to the smallest subtree that needs to coordinate around it.

**When to use it:** Use this when implementing react server components in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function ServerAndClientComponentBoundariesExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Server and client component boundaries</h2>
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

**When to use it:** Use this when implementing react server components in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function TheClientDirectiveExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">The client directive</h2>
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

**When to use it:** Use this when implementing react server components in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function ServerOnlyModulesExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Server-only modules</h2>
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

**When to use it:** Use this when implementing react server components in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function SerializablePropsExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Serializable props</h2>
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

**When to use it:** Use this when implementing react server components in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function DataFetchingOnTheServerExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Data fetching on the server</h2>
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

**When to use it:** Use this when implementing react server components in a page where the component can rerender, unmount, receive new props, or be interrupted by user input.

```jsx
import { useState } from "react";

export function StreamingAndSuspenseExample() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="example-heading">
      <h2 id="example-heading">Streaming and Suspense</h2>
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

**Code check 1: Keep secret on server.** Never serialize private credentials into client props.

```jsx
const token = process.env.PRIVATE_API_TOKEN;\nconst result = await fetchPrivateData(token);
```

**Code check 2: Minimal client props.** Pass only data required for client interaction.

```jsx
<SaveButton projectId={project.id} initialSaved={project.saved} />
```

**Code check 3: Server error boundary.** Convert internal failures into a safe user-facing state.

```jsx
try { return await loadProject(id); } catch { return { status: "unavailable" }; }
```

**Code check 4: Client-only browser API.** Browser globals belong in client-side execution.

```jsx
useEffect(() => { setWidth(window.innerWidth); }, []);
```

**Code check 5: Cache per user.** Do not accidentally share personalized server output across users.

```jsx
// Include authorization context in the cache policy for user-specific results.
```


### Focused verification snippets

**Verification snippet 1: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 1: make the contract explicit before integrating the feature.
const invariant1 = Boolean(featureEnabled) && resource != null;
if (!invariant1) return null;
```

**Verification snippet 2: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 2: make the contract explicit before integrating the feature.
const invariant2 = Boolean(featureEnabled) && resource != null;
if (!invariant2) return null;
```

**Verification snippet 3: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 3: make the contract explicit before integrating the feature.
const invariant3 = Boolean(featureEnabled) && resource != null;
if (!invariant3) return null;
```

**Verification snippet 4: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 4: make the contract explicit before integrating the feature.
const invariant4 = Boolean(featureEnabled) && resource != null;
if (!invariant4) return null;
```

**Verification snippet 5: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 5: make the contract explicit before integrating the feature.
const invariant5 = Boolean(featureEnabled) && resource != null;
if (!invariant5) return null;
```

**Verification snippet 6: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 6: make the contract explicit before integrating the feature.
const invariant6 = Boolean(featureEnabled) && resource != null;
if (!invariant6) return null;
```

**Verification snippet 7: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 7: make the contract explicit before integrating the feature.
const invariant7 = Boolean(featureEnabled) && resource != null;
if (!invariant7) return null;
```

**Verification snippet 8: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 8: make the contract explicit before integrating the feature.
const invariant8 = Boolean(featureEnabled) && resource != null;
if (!invariant8) return null;
```

**Verification snippet 9: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 9: make the contract explicit before integrating the feature.
const invariant9 = Boolean(featureEnabled) && resource != null;
if (!invariant9) return null;
```

**Verification snippet 10: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 10: make the contract explicit before integrating the feature.
const invariant10 = Boolean(featureEnabled) && resource != null;
if (!invariant10) return null;
```

**Verification snippet 11: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 11: make the contract explicit before integrating the feature.
const invariant11 = Boolean(featureEnabled) && resource != null;
if (!invariant11) return null;
```

**Verification snippet 12: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 12: make the contract explicit before integrating the feature.
const invariant12 = Boolean(featureEnabled) && resource != null;
if (!invariant12) return null;
```

**Verification snippet 13: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 13: make the contract explicit before integrating the feature.
const invariant13 = Boolean(featureEnabled) && resource != null;
if (!invariant13) return null;
```

**Verification snippet 14: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 14: make the contract explicit before integrating the feature.
const invariant14 = Boolean(featureEnabled) && resource != null;
if (!invariant14) return null;
```

**Verification snippet 15: server components invariant.** Keep this check small enough to run independently and use it to verify the skill's main ownership or lifecycle rule.

```jsx
// Verification 15: make the contract explicit before integrating the feature.
const invariant15 = Boolean(featureEnabled) && resource != null;
if (!invariant15) return null;
```

## Build Challenge
### Build: Server and Client Boundary Review

Build this focused deliverable as a realistic component for a creative portfolio or client-facing product site. Keep the challenge specific to **react-server-components**; do not substitute generic React hygiene for the actual skill being demonstrated.

### Requirements
1. Fetch private project data in a server-only module.
2. Pass only the minimum serializable fields to client components.
3. Mark interactive client entry points explicitly.
4. Keep secrets and privileged database clients out of client bundles.
5. Add a loading boundary for asynchronous server content where supported.
6. Test that a client component receives serializable props.
7. Handle server errors without exposing stack traces or credentials.
8. Document which modules may import server-only dependencies.
9. Keep event handlers and browser APIs on the client side.
10. Verify the route's initial output and subsequent interactive behavior.
11. Review caching and revalidation behavior for user-specific data.
12. Explain why moving a component across the boundary changes its execution environment.

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
