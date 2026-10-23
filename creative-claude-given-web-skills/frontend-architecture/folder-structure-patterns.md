# SKILL: folder-structure-patterns
**Layer:** 22 — Frontend Architecture
**Goal:** Design a frontend repository structure that makes feature ownership, dependency direction, discoverability, testing, and safe change boundaries explicit as the product grows.

---

## Why This Matters (Senior Perspective)
Frontend repositories often begin with a tidy handful of pages and then collapse into a maze of generic components, utility files, duplicated API calls, and imports that cross every feature boundary. A common production failure is a developer changing a shared formatter to fix one screen and unintentionally changing billing, onboarding, and reporting. Another is a route that imports a large feature barrel and pulls editor-only code into the initial bundle. In a freelance handoff, unclear ownership turns a small change into archaeology: the client asks for a new pricing section and the next developer cannot tell whether the source of truth lives in a page, a hook, a store, or a utility.

Senior engineers do not treat folder names as decoration or assume one universal structure fits every application. They organize around the way the product changes, make dependency direction visible, and keep shared code shared only when it is genuinely shared. They consider team size, route count, build tooling, testing boundaries, server/client boundaries, and how likely a feature is to be removed. A tiny marketing site may need a simple `pages`, `components`, and `lib` layout; a multi-team SaaS product usually benefits from feature ownership and explicit shared layers. The structure should reduce the cost of the next change, not satisfy an aesthetic preference.

Creative websites add specific pressure: Three.js scenes, animation timelines, large media assets, CMS data, and route-specific interactions can all leak into unrelated pages. A sound structure lets a portfolio hero own its scene and cleanup while keeping typography tokens and accessible buttons reusable. It also makes performance budgets, security review, and client delivery easier because the team can identify which files own a route, a feature, or a cross-cutting concern.

---

## Core Concepts

### 1. Choose a structure from change frequency

Group files around the parts of the product that change together; do not optimize only for file type.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about choose a structure from change frequency, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 2. Separate routes from feature ownership

A route composes features but should not become the only place their logic can live.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about separate routes from feature ownership, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 3. Define shared code deliberately

Promote a module to shared only when multiple consumers need the same stable contract.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about define shared code deliberately, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 4. Control dependency direction

Features may depend on shared primitives; shared primitives must not import a feature.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about control dependency direction, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 5. Use public module entry points carefully

Barrels simplify imports but can hide cycles and accidentally widen bundle reach.

Keep the abstraction proportional to the problem. A wrapper that merely renames a function can add indirection without adding policy. A useful abstraction centralizes a decision, enforces an invariant, or makes a dependency replaceable in tests. Remove abstractions that do none of these.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about use public module entry points carefully, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 6. Keep tests near behavior

Co-located tests help maintainers discover the contract that must remain stable.

Make observability intentional. Include enough stable context to understand what happened, but exclude credentials, personal data, and large payloads. Prefer structured event names and request identifiers over ad hoc logs that are impossible to correlate across browser and server.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about keep tests near behavior, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 7. Separate assets by ownership

Route-specific heavy media should remain local to the feature that loads it.

Accessibility and performance are architectural concerns because they affect every consumer. Preserve native semantics, keyboard behavior, predictable focus, and meaningful loading states. Avoid importing a heavy optional module into the initial route when a dynamic boundary can defer it.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about separate assets by ownership, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 8. Model server and client boundaries

Server-only secrets and data access must not enter browser modules.

Use tests to protect the public behavior rather than the internal arrangement. A test that asserts private filenames or exact component nesting makes refactoring expensive. A test that verifies the visible result, request contract, fallback, or permission outcome gives maintainers room to improve internals.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about model server and client boundaries, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 9. Avoid circular dependencies

Cycles make initialization order fragile and create confusing build behavior.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about avoid circular dependencies, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 10. Scale by product domains

Feature folders work when ownership maps to user-facing capabilities.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about scale by product domains, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 11. Make configuration explicit

Environment parsing belongs in one validated module, not scattered throughout components.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about make configuration explicit, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 12. Plan migrations incrementally

Move one domain at a time and preserve compatibility while imports are relocated.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Wrong approach:** Let each consumer make its own decision about plan migrations incrementally, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Feature-first ownership

**What it does:** Establishes a repeatable boundary for feature-first ownership so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 2: Layered dependency direction

**What it does:** Establishes a repeatable boundary for layered dependency direction so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 3: Route composition shell

**What it does:** Establishes a repeatable boundary for route composition shell so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 4: Public entry-point exports

**What it does:** Establishes a repeatable boundary for public entry-point exports so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 5: Co-located test boundary

**What it does:** Establishes a repeatable boundary for co-located test boundary so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 6: Incremental domain migration

**What it does:** Establishes a repeatable boundary for incremental domain migration so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```text
src/
  app/                    # Route composition only
  features/
    projects/
      api/
      components/
      hooks/
      model/
      pages/
      tests/
      index.ts             # Deliberate public surface
  shared/
    api/
    components/
    config/
    lib/
    styles/
  server/                  # Never imported by browser entry points
```

```ts
// features/projects/index.ts
// Export the stable feature contract; keep internals private.
export { ProjectListPage } from "./pages/ProjectListPage";
export type { ProjectSummary } from "./model/project";
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Generic utils dumping ground | No ownership rule exists | Move each function to the domain that owns its semantics |
| Feature imports another feature internals | Public boundaries are undefined | Export a small stable API and update consumers |
| Circular barrel imports | Barrels hide dependency edges | Import leaf modules and run cycle detection |
| Every file grouped by type | Navigation follows implementation detail | Group cohesive feature behavior together |
| One giant routes file | Routes own all business logic | Extract domain logic into feature modules |
| Shared folder contains one-off code | Sharing is assumed too early | Keep single-consumer code beside its feature |
| Server secret imported by client | Runtime boundary is unclear | Split server-only modules and enforce build checks |
| Tests far from behavior | Ownership is hard to discover | Co-locate focused tests or map them clearly |
| Assets all in global folder | Feature ownership is lost | Keep large route-specific assets with the feature |
| Deep relative imports | Internal structure leaks | Use configured aliases for public boundaries |
| No environment validation | Invalid config fails late | Parse required environment variables at startup |
| Migration changes every import at once | Refactor scope is too broad | Move one domain and keep compatibility exports |
| No code ownership | Reviews are unassigned | Add CODEOWNERS for high-risk domains |
| Bundle entry imports all features | Barrel export pulls code eagerly | Use route-level dynamic imports and inspect bundle output |

---

## Mental Models

1. **Structure follows change:** files that change together should be easy to find together.
2. **Imports are architecture:** dependency edges reveal whether boundaries are real.
3. **Shared means shared contract:** a folder name does not make code reusable.
4. **Routes compose domains:** a page should not own every domain rule it displays.
5. **Boundaries reduce search cost:** a maintainer should know where to look first.
6. **Migration is a sequence:** safe architecture evolves through small reversible moves.

---

## Quick Reference

| Decision | Recommended default | Review question |
|---|---|---|
| Small brochure site | Simple route and shared folders | Is this complexity justified? |
| Growing product | Feature-first modules | Who owns this capability? |
| Shared utility | Promote after real reuse | Is the contract stable? |
| Public imports | Explicit exports | Can internals remain private? |
| Heavy feature | Dynamic import at route boundary | Does initial bundle need it? |
| Server-only code | Separate server module | Can it reach browser entry? |
| Tests | Co-located or clearly mapped | Can owner find them? |
| Assets | Feature-local when specific | Who changes this asset? |
| Cycles | Detect in CI | Does dependency direction hold? |
| Environment | Validate at startup | Does invalid config fail early? |
| Migration | One domain at a time | Can this be rolled back? |
| Ownership | CODEOWNERS for risk areas | Who reviews changes? |
| Aliases | Stable public paths | Are deep imports leaking internals? |
| Route design | Compose feature pages | Is business logic misplaced? |
| Bundle check | Inspect production output | Did a barrel pull extra code? |

---

## Advanced Operational Notes

### Repository boundaries in practice

When deciding whether a module belongs in a feature or shared layer, trace who changes it and why. A formatter that only represents project dates belongs near the project domain until another domain needs the same semantics. If two domains use the same primitive but interpret its meaning differently, share the low-level primitive and keep domain-specific policy local. This prevents a shared folder from becoming a second, undocumented application layer. Review imports in both directions and reject a design where shared UI imports a feature page or a route imports another feature's private implementation. A folder tree is only a visible promise; enforce important promises with lint rules, package boundaries, or code review checks.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Monorepo and package boundaries

A monorepo can make refactoring easier because code and consumers evolve together, but it can also make accidental coupling effortless. Treat each package's exports as a public API and keep internal paths private. Use workspace dependency declarations rather than relative imports that cross package roots. If a design system is published separately, version its contract and document compatibility expectations. Avoid creating a package for every small helper: packages add build, test, version, and ownership overhead. Create them when independent ownership, reuse, release cadence, or runtime constraints justify the boundary.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Route-level performance ownership

Routes should own the decision to load optional features. A portfolio detail route may import its content immediately but defer a large model viewer until the user reaches the relevant section or requests the interactive view. Keep the loading fallback in the route so the user sees stable layout and useful text before the optional code arrives. Measure the production bundle rather than assuming a dynamic import succeeded. A barrel that re-exports every feature can accidentally defeat code splitting when the route imports from the barrel. Confirm the result using the bundler's analyzer and a network trace.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Migration and code review

A structural refactor should be behavior-preserving and reviewable. Move one feature at a time, retain a temporary compatibility export when it reduces churn, and remove that export once consumers migrate. Keep the diff focused on moves and import changes; mixing a redesign with a directory migration makes regressions harder to attribute. Add an automated cycle check if circular imports have caused real incidents. During review, ask whether the new structure makes the next likely change easier to locate, whether ownership is clearer, and whether any module has gained an unexplained dependency.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Naming and discoverability

Names should reflect product language and responsibility rather than implementation fashion. `projects`, `billing`, and `account-settings` help a contributor navigate a product domain; `misc`, `helpers2`, and `new-components` communicate no stable ownership. Avoid a folder taxonomy so deep that every file requires a map to find. A useful structure is shallow enough to scan, but explicit enough to distinguish route composition, domain logic, reusable UI, and infrastructure. Document unusual choices in a short architecture note, not a giant tree diagram that becomes stale.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Environment and configuration safety

Centralize environment parsing and distinguish public configuration from server-only values. Validate required variables at startup so an invalid deployment fails with a specific error instead of breaking a route minutes later. Never rely on a naming convention alone to prove a secret is safe; inspect what the bundler exposes to client code. Use separate configuration schemas for browser and server modules. In a multi-environment freelance delivery, document which values are required, which may be absent locally, and which must be supplied by the hosting platform.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Testing ownership boundaries

Tests should live close enough to the feature that a maintainer can find them without guessing. The exact location is less important than consistent discovery and execution. Feature tests should verify behavior at the feature boundary; shared primitive tests should verify the primitive contract rather than reproduce every product flow. Avoid tests that only assert file layout or private import paths. For integration coverage, choose a small number of representative routes and assert that feature composition, permissions, and error states still work after structural changes.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Architecture drift signals

Watch for signals that the current structure is no longer serving the product: imports from one feature's private folders into another, generic utility files with unrelated functions, route components containing long business workflows, or shared modules requiring feature-specific conditions. Do not respond by creating layers automatically. First identify the repeated decision and its owner, then move only the stable part into a shared contract. Architecture should change when the cost of the current structure becomes visible, not because a diagram says a project needs more folders.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.


---

## Build Challenge

### Build: Production-ready Folder Structure Patterns for a multi-route creative SaaS

Build a small but realistic application slice that demonstrates the skill in a production-like environment. Include a clear README describing assumptions, architecture decisions, commands, and known limitations. Do not submit only a diagram or isolated snippet; the result must run and must demonstrate at least one recoverable failure.

### Requirements

1. Create at least three product features with clear ownership.
2. Define a shared layer with documented import direction.
3. Keep route files focused on composition.
4. Add feature-local tests for core behavior.
5. Add one public entry point per feature.
6. Prevent or detect circular imports in a check or documented CI step.
7. Place a heavy optional module behind a dynamic import.
8. Validate required environment configuration at startup.
9. Document server-only modules and prevent browser imports.
10. Include a migration note showing how one feature can move safely.
11. Add an example of a forbidden cross-feature import.
12. Show a production bundle or dependency graph inspection step.

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
