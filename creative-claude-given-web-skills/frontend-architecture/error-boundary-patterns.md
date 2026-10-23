# SKILL: error-boundary-patterns
**Layer:** 22 — Frontend Architecture
**Goal:** Contain recoverable UI failures at deliberate boundaries, provide safe recovery paths, and preserve diagnostics without hiding defects.

---

## Why This Matters (Senior Perspective)
A single render-time exception in a large React tree can replace an entire route with a blank page if no boundary catches it. At the other extreme, placing one boundary around every tiny element can fragment recovery and hide systemic failures behind dozens of generic fallbacks. Production incidents often appear when a third-party chart receives malformed data, a lazy-loaded route fails to download, or a browser-only animation library is evaluated during server rendering. Users need a clear recovery path, while developers need enough diagnostic context to reproduce the failure.

Senior engineers distinguish render errors from rejected promises, event-handler errors, server errors, and network failures because React error boundaries do not catch all of them. They choose boundaries around meaningful failure domains: route, independently loaded feature, or optional visualization. A boundary should reset when the user navigates to a new route or explicitly retries, but it should not loop endlessly when the underlying defect remains. Diagnostics should include a correlation identifier and safe component context without exposing access tokens, personal data, or raw server payloads.

Creative interfaces need graceful degradation particularly when WebGL, a third-party embed, or a motion-heavy module fails. The page’s essential content and navigation should remain available even if a decorative 3D scene cannot initialize. A well-designed fallback is part of the product: it communicates what happened, preserves user input where safe, offers retry or navigation, and respects reduced-motion and accessibility requirements. Error boundaries do not replace monitoring or ordinary async error handling; they complement both.

---

## Core Concepts

### 1. Know what a boundary catches

Render lifecycle failures differ from async and event-handler failures.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about know what a boundary catches, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 2. Place boundaries around failure domains

Contain optional widgets and routes without fragmenting every tiny component.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about place boundaries around failure domains, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 3. Design a useful fallback

Offer safe explanation, retry when valid, and a path back to stable content.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about design a useful fallback, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 4. Reset boundaries deliberately

A new route or retry should clear stale error state without causing retry loops.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about reset boundaries deliberately, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 5. Handle lazy-load failures

Dynamic imports can fail because of network outages or stale deployment assets.

Keep the abstraction proportional to the problem. A wrapper that merely renames a function can add indirection without adding policy. A useful abstraction centralizes a decision, enforces an invariant, or makes a dependency replaceable in tests. Remove abstractions that do none of these.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about handle lazy-load failures, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 6. Keep server and client error paths distinct

Server rendering and client rendering have different failure and disclosure risks.

Make observability intentional. Include enough stable context to understand what happened, but exclude credentials, personal data, and large payloads. Prefer structured event names and request identifiers over ad hoc logs that are impossible to correlate across browser and server.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about keep server and client error paths distinct, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 7. Protect diagnostics

Send stack details to trusted monitoring, not directly to public users.

Accessibility and performance are architectural concerns because they affect every consumer. Preserve native semantics, keyboard behavior, predictable focus, and meaningful loading states. Avoid importing a heavy optional module into the initial route when a dynamic boundary can defer it.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about protect diagnostics, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 8. Preserve essential content

A failed decorative canvas should not remove the page's main message.

Use tests to protect the public behavior rather than the internal arrangement. A test that asserts private filenames or exact component nesting makes refactoring expensive. A test that verifies the visible result, request contract, fallback, or permission outcome gives maintainers room to improve internals.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about preserve essential content, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 9. Avoid fallback crashes

Fallback UI must be simpler and less dependent than the component that failed.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about avoid fallback crashes, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 10. Combine boundaries with async states

Promises and fetch failures need explicit rejection handling.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about combine boundaries with async states, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 11. Test failure scenarios

Force a child to throw and verify containment, logging, and recovery.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about test failure scenarios, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 12. Use monitoring to find repeated failures

Track rates and release context rather than relying on user reports alone.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Wrong approach:** Let each consumer make its own decision about use monitoring to find repeated failures, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Route-level containment

**What it does:** Establishes a repeatable boundary for route-level containment so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 2: Optional-widget boundary

**What it does:** Establishes a repeatable boundary for optional-widget boundary so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 3: Lazy-import recovery

**What it does:** Establishes a repeatable boundary for lazy-import recovery so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 4: Retry with reset key

**What it does:** Establishes a repeatable boundary for retry with reset key so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 5: Sanitized monitoring hook

**What it does:** Establishes a repeatable boundary for sanitized monitoring hook so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 6: Essential-content fallback

**What it does:** Establishes a repeatable boundary for essential-content fallback so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
import React from "react";

type BoundaryState = { failed: boolean };

export class FeatureErrorBoundary extends React.Component<
  React.PropsWithChildren,
  BoundaryState
> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send sanitized diagnostics to trusted monitoring in production.
    console.error("Feature render failed", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.failed) {
      return (
        <section role="alert" aria-labelledby="feature-error-title">
          <h2 id="feature-error-title">This section is unavailable</h2>
          <p>The rest of the page is still available.</p>
          <button onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Boundary expected to catch click errors | Coverage assumptions are wrong | Handle event-handler failures explicitly in the event flow |
| One global fallback for every error | Failure domains were not mapped | Place boundaries around route and optional feature boundaries |
| Retry just clears state | Underlying failed condition remains | Reload the failed module or retry the operation with bounded attempts |
| Fallback imports same broken widget | Fallback has same dependency | Keep fallback markup simple and dependency-light |
| Raw stack shown to users | Developer diagnostics confused with UX | Show a safe message and send stack to monitoring |
| Network failure treated as render error | Async path is separate | Model loading and request errors in component state |
| Boundary never resets after navigation | Error state persists across route changes | Key or reset the boundary from route identity |
| Retry loop has no cap | Recovery policy is absent | Use bounded retries with backoff for transient operations |
| Decorative canvas failure blanks page | Optional content owns too much tree | Isolate canvas and retain essential HTML content |
| Logging every render failure duplicates events | Instrumentation lacks deduplication | Attach a stable error fingerprint and rate limit repeated reports |
| Fallback lacks keyboard focus context | Recovery UX was not designed | Move focus to the alert or heading when appropriate |
| Boundary swallows error silently | No telemetry path exists | Record sanitized error and route metadata |
| Lazy chunk failure has no recovery | Deployment cache mismatch ignored | Offer reload and coordinate cache/version strategy |

---

## Mental Models

1. **Contain by failure domain:** isolate what can fail independently.
2. **A boundary is not a try/catch for everything:** async and event errors need their own handling.
3. **Fallbacks are product UI:** recovery should be clear and accessible.
4. **Optional effects stay optional:** a broken canvas must not erase essential content.
5. **Diagnostics are for operators:** user messages and internal details serve different audiences.
6. **Reset is a policy:** retries must change the conditions that caused failure.

---

## Quick Reference

| Decision | Recommended default | Review question |
|---|---|---|
| Route failure | Route-level boundary | Can other routes still work? |
| Optional widget | Local boundary | Does main content survive? |
| Async request | Explicit state handling | Is rejection caught? |
| Event handler | Try/catch or action state | Can click error escape? |
| Lazy import | Retry/reload strategy | Could deployment be stale? |
| Fallback | Simple semantic UI | Can fallback also crash? |
| Reset | Route key or reset API | Will navigation clear it? |
| Telemetry | Sanitized fingerprint | Can support correlate incidents? |
| PII | Redact payloads | Are secrets excluded? |
| Retry | Bounded policy | Can loop repeat forever? |
| Focus | Accessible announcement | Does focus reach recovery? |
| SSR | Separate server handling | Could secret details leak? |
| Decorative media | Optional boundary | Is essential HTML preserved? |
| Testing | Forced throw case | Is containment verified? |
| Monitoring | Track rate by release | Can regressions be detected? |

---

## Advanced Operational Notes

### Boundary placement as a product decision

Choose a boundary where the product can meaningfully continue after a failure. A route boundary can preserve global navigation while replacing the failed page; a local boundary can isolate an optional chart while leaving the surrounding dashboard usable. Too few boundaries let unrelated features fail together. Too many boundaries produce inconsistent fallbacks and make telemetry noisy. Write down the intended blast radius for important boundaries and verify it with a forced exception.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Render errors versus asynchronous errors

React error boundaries catch errors thrown during rendering and relevant lifecycle work in descendants, but they do not automatically catch every rejected promise, event-handler exception, or server failure. Fetch requests need explicit pending, success, and failure states. Event handlers should handle expected errors near the action that caused them. This distinction prevents a false sense of safety where a boundary exists but the most likely production failure still becomes an unhandled rejection.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Recovery that changes conditions

A retry button is only useful if it changes something about the failed operation. Clearing a boundary's state and immediately rendering the same broken child can produce a loop. For a transient network issue, retry the request with a bounded policy. For a stale JavaScript chunk after deployment, a reload may be appropriate. For malformed data, retrying the same payload will not help; show a stable fallback and capture diagnostics. Recovery should match the failure category.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Lazy loading and deployment mismatch

Dynamic imports can fail when a user has an old HTML shell but the deployment has removed the corresponding chunk. A lazy-load error should not permanently trap the route behind a dead fallback. Consider a controlled reload action, version-aware cache policy, and protection against repeatedly reloading the same failed build. Test this scenario by simulating a rejected import or missing asset. Do not automatically reload forever, because the same mismatch can persist.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Safe diagnostics and privacy

Component stacks and error messages can be useful internally but may include implementation details. Send them to a trusted monitoring service with route, release, and correlation metadata while excluding tokens, form values, and personal data. In the fallback, show a concise explanation and a safe next step. If the user can report the problem, include a reference identifier that support can use to find the event. Never make the user-facing fallback dependent on the monitoring service being available.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Accessibility of fallback states

A fallback is a state change and must be discoverable. Use semantic headings and an appropriate alert or status role, depending on urgency. If a modal or focused control disappears after a render failure, decide where focus should go. Keep recovery actions keyboard accessible and visibly focused. Do not rely only on color or an icon to communicate failure. Test the fallback with keyboard navigation and a screen reader, especially when it replaces a large region.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### SSR and hydration boundaries

Server rendering introduces failure modes that differ from client-only rendering: browser globals may be unavailable on the server, server errors may leak details, and the server and client can disagree about initial markup. Keep browser-only integrations behind the correct client boundary and make fallback markup deterministic. An error boundary around a client widget does not fix a server exception that happens before the boundary can render. Handle server failures in the framework's server error path and keep public responses safe.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Monitoring and alerting

Track error frequency, affected releases, route, and the percentage of sessions affected. A single exception in a rarely used decorative widget may be lower priority than a smaller error rate that blocks checkout. Deduplicate identical fingerprints and alert on meaningful thresholds rather than every occurrence. Connect monitoring to a reproduction path and regression test. Error boundaries contain the blast radius; monitoring helps the team discover and fix the cause.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.


---

## Build Challenge

### Build: Production-ready Error Boundary Patterns for a multi-route creative SaaS

Build a small but realistic application slice that demonstrates the skill in a production-like environment. Include a clear README describing assumptions, architecture decisions, commands, and known limitations. Do not submit only a diagram or isolated snippet; the result must run and must demonstrate at least one recoverable failure.

### Requirements

1. Add route-level and optional-widget boundaries.
2. Build a fallback with semantic heading, alert, and recovery action.
3. Keep async request failures in explicit state rather than relying on boundaries.
4. Demonstrate a lazy-loaded feature failing to load.
5. Reset the boundary after a route change or deliberate retry.
6. Send sanitized diagnostic metadata to a mock monitoring adapter.
7. Ensure fallback UI does not depend on the failed feature.
8. Preserve essential page content when a decorative module fails.
9. Add a test that intentionally throws during render.
10. Prevent an infinite retry loop.
11. Verify keyboard and screen-reader access to the fallback.
12. Document what error boundaries do not catch.

### Required failure injection

Before calling the build complete, deliberately introduce a realistic failure: missing configuration, a malformed server response, a child render exception, a missing flag service response, or attacker-controlled input, depending on the skill. Record the expected behavior, the observed behavior, and the test or diagnostic that proves the system recovered safely.

### Definition of done

- [ ] The application builds and its documented checks run from a clean checkout.
- [ ] All mandatory architecture sections and public contracts are documented.
- [ ] At least one failure scenario is automated in a test.
- [ ] No secret or sensitive diagnostic data is exposed to the browser.
- [ ] Keyboard-accessible recovery and clear user-facing states are present.
- [ ] The implementation has no known circular dependency or unhandled critical failure.
- [ ] The README explains trade-offs, limitations, and how to extend the design.

### Debugging sequence

1. Reproduce the failure with the smallest known input or route.
2. Inspect browser DevTools console and network panel; identify the first meaningful failure rather than the last cascading error.
3. Confirm the failing boundary and whether it owns the behavior.
4. Check response status, configuration, imports, and runtime state relevant to this skill.
5. Add a regression test before changing the implementation.
6. Apply the narrowest fix and rerun the failure test plus the adjacent happy path.
7. Verify production build behavior and a keyboard-only pass.

### Browser, framework, and deployment notes

Examples assume a modern TypeScript frontend and React where component lifecycle examples are needed. Confirm exact framework and bundler behavior against the project version. Browser support for APIs such as `AbortController`, CSP directives, and dynamic imports varies by environment and policy; check current browser support and test Safari, Firefox, and Chromium targets relevant to the product. Never assume a development server's behavior proves the production bundle is safe.

### Final review checklist

- [ ] Does the design have one clear owner for each responsibility?
- [ ] Are error and edge states modeled explicitly?
- [ ] Are dependencies and trust boundaries visible?
- [ ] Can the behavior be tested without private implementation knowledge?
- [ ] Are performance, accessibility, and security implications documented?
- [ ] Are all examples syntactically realistic and free of hardcoded secrets?
