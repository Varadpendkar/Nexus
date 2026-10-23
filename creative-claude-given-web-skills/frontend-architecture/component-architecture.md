# SKILL: component-architecture
**Layer:** 22 — Frontend Architecture
**Goal:** Build component boundaries that keep UI responsibilities, state ownership, accessibility, styling, and business rules understandable and testable.

---

## Why This Matters (Senior Perspective)
Poor component architecture usually fails gradually. A card starts with markup and styling, then absorbs data fetching, analytics, permissions, modal state, formatting, and three unrelated variants. Soon every consumer depends on the same hidden assumptions. A change to a product card breaks a dashboard table, a button behaves differently depending on its parent, or a creative interaction becomes impossible to test because animation, network calls, and business logic are fused into one component. In production, this causes regressions, inconsistent accessible behavior, and slow feature delivery rather than one dramatic crash.

Senior developers define components by responsibility and change boundary, not by line count or a rule that every repeated element deserves abstraction. They distinguish composition from configuration, local state from shared state, presentational UI from data orchestration, and a stable public API from internal implementation. They accept a little duplication when it prevents an abstraction from becoming a dumping ground. They also design for keyboard interaction, empty/loading/error states, and predictable responsive behavior from the start, rather than bolting them on after a visual review.

For creative and freelance work, component architecture must preserve visual craft without sacrificing reliability. A hero section may have a bespoke WebGL canvas, while its CTA, form field, modal, and project card use stable shared contracts. Reusable components should expose intentional props, forward refs only when needed, avoid leaking internal styling choices, and remain usable when motion or JavaScript enhancement is unavailable. The goal is not maximum reuse; it is clear ownership and safe change.

---

## Core Concepts

### 1. Define a component contract

Props should describe what consumers can control without exposing implementation details.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about define a component contract, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 2. Separate container and view responsibilities

Data orchestration belongs above focused rendering components when it improves testability.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about separate container and view responsibilities, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 3. Use composition before boolean explosion

Slots and child composition often scale better than many interacting flags.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about use composition before boolean explosion, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 4. Assign state to the narrowest owner

Lift state only when multiple components truly coordinate around it.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about assign state to the narrowest owner, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 5. Keep business rules out of visual primitives

Buttons and cards should not own billing or authorization policy.

Keep the abstraction proportional to the problem. A wrapper that merely renames a function can add indirection without adding policy. A useful abstraction centralizes a decision, enforces an invariant, or makes a dependency replaceable in tests. Remove abstractions that do none of these.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about keep business rules out of visual primitives, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 6. Model loading, empty, success, and failure states

A component contract includes its states, not just its happy-path markup.

Make observability intentional. Include enough stable context to understand what happened, but exclude credentials, personal data, and large payloads. Prefer structured event names and request identifiers over ad hoc logs that are impossible to correlate across browser and server.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about model loading, empty, success, and failure states, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 7. Preserve semantic HTML

Use native buttons, links, forms, headings, and landmarks before custom roles.

Accessibility and performance are architectural concerns because they affect every consumer. Preserve native semantics, keyboard behavior, predictable focus, and meaningful loading states. Avoid importing a heavy optional module into the initial route when a dynamic boundary can defer it.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about preserve semantic html, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 8. Make controlled and uncontrolled APIs clear

Do not mix ownership models unpredictably in one component.

Use tests to protect the public behavior rather than the internal arrangement. A test that asserts private filenames or exact component nesting makes refactoring expensive. A test that verifies the visible result, request contract, fallback, or permission outcome gives maintainers room to improve internals.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about make controlled and uncontrolled apis clear, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 9. Treat variants as a finite design API

Use documented variant names instead of arbitrary style strings.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about treat variants as a finite design api, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 10. Stabilize identity in lists

Keys represent stable item identity, not array position when items can move.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about stabilize identity in lists, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 11. Keep effects reversible

Subscriptions, observers, and timers must be cleaned up on unmount.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about keep effects reversible, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 12. Test behavior at the public boundary

Assert accessible outcomes and user-visible contracts, not private implementation details.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Wrong approach:** Let each consumer make its own decision about test behavior at the public boundary, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Composition over boolean props

**What it does:** Establishes a repeatable boundary for composition over boolean props so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 2: Controlled input contract

**What it does:** Establishes a repeatable boundary for controlled input contract so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 3: Container plus focused view

**What it does:** Establishes a repeatable boundary for container plus focused view so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 4: Accessible primitive wrapper

**What it does:** Establishes a repeatable boundary for accessible primitive wrapper so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 5: State lifted to shared owner

**What it does:** Establishes a repeatable boundary for state lifted to shared owner so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 6: Render-state completeness

**What it does:** Establishes a repeatable boundary for render-state completeness so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```tsx
type ProjectCardProps = {
  title: string;
  description: string;
  href: string;
  status?: "draft" | "published";
};

export function ProjectCard({
  title,
  description,
  href,
  status = "published",
}: ProjectCardProps) {
  return (
    <article className="project-card">
      <h2><a href={href}>{title}</a></h2>
      <p>{description}</p>
      <p className="project-card__status">
        Status: {status === "published" ? "Published" : "Draft"}
      </p>
    </article>
  );
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Boolean prop explosion | Variants have overlapping combinations | Replace related booleans with a finite variant or composition |
| Component fetches unrelated data | Responsibilities grew organically | Move orchestration to a route or feature hook |
| Index used as unstable key | List identity is ignored | Use a stable database or domain identifier |
| Clickable div used as button | Native semantics were skipped | Use button or link and preserve keyboard behavior |
| Shared component knows billing rules | Business policy leaked into UI primitive | Pass a derived permission or action callback from the feature |
| State duplicated in parent and child | Ownership is unclear | Choose one source of truth and derive the other value |
| Effect mirrors props into state | Derived state was mistaken for independent state | Compute from props or use a deliberate reset key |
| One component supports every page | Abstraction optimized for reuse count | Split by stable responsibility and keep composition simple |
| Missing empty and error states | Only success path was designed | Model all states in the component contract |
| Style prop accepts arbitrary strings | Public API is unbounded | Use documented variants and design tokens |
| Effect listener never cleaned up | Lifecycle behavior was overlooked | Return cleanup that removes the exact listener |
| Test asserts internal class tree | Implementation is coupled to test | Assert accessible roles and user-visible behavior |
| Ref forwarded without need | API surface grows unnecessarily | Expose a ref only when consumers need focus or measurement |
| ARIA role duplicates native element | Custom semantics were added blindly | Prefer native element semantics and add ARIA only when required |

---

## Mental Models

1. **A component is a contract:** props and states define what consumers can rely on.
2. **Composition beats configuration sprawl:** combine focused parts instead of encoding every combination.
3. **State has an owner:** duplicated state creates competing truths.
4. **Semantics are behavior:** native HTML brings keyboard and assistive-technology contracts.
5. **Reuse is not the goal:** stable change boundaries are the goal.
6. **Failures are states:** loading, empty, and error behavior belong in the design.

---

## Quick Reference

| Decision | Recommended default | Review question |
|---|---|---|
| Primitive UI | Native semantic element | Does keyboard behavior work? |
| Variant API | Finite named variants | Can combinations be invalid? |
| Shared state | Single clear owner | Are there competing truths? |
| Data fetching | Feature/route boundary | Can view be tested alone? |
| List rendering | Stable item key | Can order change? |
| Forms | Explicit validation states | Are errors announced? |
| Modal | Focus management | Can keyboard users escape? |
| Effects | Cleanup subscriptions | What happens on unmount? |
| Composition | Slots/children | Is prop count growing? |
| Loading | Skeleton or status | Is layout stable? |
| Empty | Helpful next action | Is empty valid or failure? |
| Error | Recoverable message | What can user do? |
| Tests | Public behavior | Is test tied to internals? |
| Refs | Only when needed | What consumer requires it? |
| Responsive UI | Container-aware layout | Does it work in narrow parent? |

---

## Advanced Operational Notes

### Designing a stable public API

A component API should make valid states easy to express and invalid states difficult to represent. Prefer a finite union of named variants over arbitrary strings, and make mutually exclusive modes explicit in types when practical. Do not expose every internal CSS decision as a prop; this turns the component into a styling escape hatch that no longer preserves the design system. Document whether a component owns its value, receives a controlled value, or supports both. The API should also explain which callbacks fire and whether they represent user intent, validation, or completion.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Composition and slots

Composition works well when consumers need to arrange stable parts in different ways. A dialog can own focus trapping and escape behavior while callers supply a title, body, and actions. A card can expose a link target and a content slot rather than a dozen props for every possible badge. Keep composition bounded: a component that exposes twenty slots may simply be pushing all complexity to consumers. Choose the smallest set of extension points that matches real use cases and test the default and composed forms.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### State placement and derived values

State should live at the lowest level that needs to coordinate the behavior. If only one input cares about whether it is expanded, keep that state local. If a filter bar and result list must agree on a selected category, lift the selection to their nearest common owner or use a domain store with a clear reason. Avoid storing values that can be derived from other state because duplicate representations drift. Effects are for synchronization with external systems, not for keeping two pieces of React state artificially aligned.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Accessible interaction contracts

A reusable component should preserve keyboard and assistive-technology behavior across every variant. Native buttons support keyboard activation; links communicate navigation; form labels associate names with controls. If a custom menu, dialog, or combobox is necessary, document its focus movement, escape behavior, active descendant model, and announcement behavior. Add visible `:focus-visible` styling and test without a mouse. Do not add ARIA attributes to compensate for incorrect native semantics; the role and state must match the actual interaction.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Rendering and performance

Performance problems often come from unclear ownership rather than a missing memoization hook. First keep state local, pass stable data shapes, and avoid rebuilding large derived collections on every render. Use `React.memo`, `useMemo`, or `useCallback` only when profiling or a known identity-sensitive boundary justifies them. Memoization is not a correctness mechanism and can make code harder to read. For large lists, consider virtualization and stable keys. For heavy creative modules, use route-level loading boundaries rather than mounting every interaction at startup.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Testing the component contract

Test what a user can observe: a button invokes the intended callback, validation appears and is associated with the field, a dialog can be dismissed by keyboard, and a loading state communicates progress. Avoid asserting the exact hook call count or private state variable. Test at least one edge state and one keyboard path for interactive components. When a component wraps a native control, preserve its expected browser behavior rather than mocking away the part that makes it accessible. Component tests complement, but do not replace, end-to-end tests of the full user journey.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Design-system governance

Reusable components need a clear contribution path: owner, supported variants, visual examples, accessibility expectations, and a deprecation policy. A shared button should not silently change its meaning when a feature team adds a one-off prop. If a new requirement does not fit the existing contract, compare composition, a new variant, and a separate component before extending the API. Keep migration examples for breaking changes. In freelance work, this governance reduces the chance that a client's next developer must reverse engineer a one-off component library.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Failure and state completeness

A component's contract includes more than its ideal screenshot. A data panel may be loading, empty, stale, partially available, unauthorized, or failed. Decide which states belong to the component and which belong to the route. Make state transitions predictable and prevent an old response from overwriting a newer one. Keep error copy actionable and avoid displaying raw exceptions. When an interaction is unavailable, explain why and preserve the rest of the page rather than leaving an inert control that looks active.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.


### Refactoring without breaking consumers

When a shared component has accumulated too many responsibilities, do not rewrite every consumer at once. First document its existing public behavior and identify the smallest stable contract. Introduce a focused component or composition point, migrate one consumer, and run the visual and behavioral checks before moving the next consumer. If the old API must remain temporarily, mark it deprecated and explain the replacement rather than silently changing semantics. This matters when multiple pages share the same component: a refactor that improves one page but breaks focus handling or responsive layout elsewhere is not an improvement. Use representative stories or tests for default, variant, loading, empty, and error states. Confirm that analytics callbacks still fire once, forms still submit once, and keyboard navigation remains predictable. Remove the compatibility layer only after all consumers have migrated. The safest refactor is one whose intermediate states still build and whose regression can be traced to a small change set.

### Visual regression and responsive contracts

For a component library used across many routes, a behavior test may pass while the component visually clips content at a narrow viewport or changes its spacing unexpectedly. Keep a small set of visual fixtures for high-value components and compare meaningful states at representative widths. Avoid snapshotting every pixel of every route because noisy snapshots become ignored. Instead, cover the states where layout changes: long labels, missing images, validation messages, focus rings, loading indicators, and translated text. Pair visual checks with semantic assertions so a screenshot cannot hide a broken accessible name. When a component changes, review whether the new behavior is an intentional contract change or a regression for existing consumers.

---

## Build Challenge

### Build: Production-ready Component Architecture for a multi-route creative SaaS

Build a small but realistic application slice that demonstrates the skill in a production-like environment. Include a clear README describing assumptions, architecture decisions, commands, and known limitations. Do not submit only a diagram or isolated snippet; the result must run and must demonstrate at least one recoverable failure.

### Requirements

1. Build a semantic reusable card and form control with documented props.
2. Use composition for one complex variant instead of many booleans.
3. Implement loading, empty, success, and error states.
4. Ensure keyboard operation and visible focus.
5. Use stable keys for reorderable data.
6. Keep domain policy outside shared visual primitives.
7. Clean up at least one subscription or event listener.
8. Write behavior-oriented tests for the public contract.
9. Support a narrow viewport without overflow.
10. Demonstrate a component failure without crashing the entire page.
11. Document controlled versus uncontrolled state ownership.
12. Audit unnecessary props and remove one abstraction that adds no value.

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
