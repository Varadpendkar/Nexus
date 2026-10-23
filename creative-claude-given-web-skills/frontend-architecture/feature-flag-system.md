# SKILL: feature-flag-system
**Layer:** 22 — Frontend Architecture
**Goal:** Introduce controlled feature rollout and kill switches with typed evaluation, safe defaults, observability, and a clear removal lifecycle.

---

## Why This Matters (Senior Perspective)
Feature flags can reduce deployment risk, but a careless flag system creates hidden branches that nobody understands. A flag may be enabled for a user before its required API is deployed, a missing remote configuration may accidentally enable an unfinished checkout, or two flags may combine into an untested state. Stale flags accumulate until every component contains old experiments and nobody can confidently remove a branch. In a client project, this creates confusing behavior that is hard to reproduce and impossible to explain from the UI alone.

Senior engineers treat flags as operational controls with owners, intended audiences, fallback behavior, and expiry plans. They distinguish release flags, experiment assignments, permission checks, and operational kill switches because these serve different purposes. A feature flag is not authorization: the server must still enforce permissions. Evaluation should be deterministic where experiments require it, observable without logging sensitive values, and safe when the flag service is unavailable. The application must define whether a flag defaults off or on based on the risk of the feature, not convenience.

For creative websites, flags are useful for progressive rollouts of a redesigned hero, a new gallery, a heavier 3D experience, or a new booking flow. They can help compare experiences and quickly disable a costly interaction on mobile. But a flag should not be used as an excuse to ship incomplete code indefinitely. A mature workflow records the owner, purpose, rollout plan, kill-switch behavior, and removal condition, then deletes the flag and obsolete branch when the rollout ends.

---

## Core Concepts

### 1. Classify flag purpose

Release, experiment, operational, and permission controls have different semantics.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about classify flag purpose, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 2. Choose safe defaults

Unavailable configuration must not accidentally expose a risky feature.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about choose safe defaults, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 3. Evaluate flags at a stable boundary

Avoid scattering remote SDK calls throughout low-level components.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about evaluate flags at a stable boundary, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 4. Keep authorization server-side

A client flag controls presentation, never permission to access data.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about keep authorization server-side, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 5. Make experiment assignment deterministic

Stable assignment prevents users bouncing between variants unexpectedly.

Keep the abstraction proportional to the problem. A wrapper that merely renames a function can add indirection without adding policy. A useful abstraction centralizes a decision, enforces an invariant, or makes a dependency replaceable in tests. Remove abstractions that do none of these.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about make experiment assignment deterministic, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 6. Plan for configuration outage

Cached values and defaults should have documented behavior.

Make observability intentional. Include enough stable context to understand what happened, but exclude credentials, personal data, and large payloads. Prefer structured event names and request identifiers over ad hoc logs that are impossible to correlate across browser and server.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about plan for configuration outage, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 7. Instrument exposure correctly

Record when a user actually sees a variant, not merely when code evaluates a flag.

Accessibility and performance are architectural concerns because they affect every consumer. Preserve native semantics, keyboard behavior, predictable focus, and meaningful loading states. Avoid importing a heavy optional module into the initial route when a dynamic boundary can defer it.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about instrument exposure correctly, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 8. Control combinatorial states

Limit interacting flags and test supported combinations.

Use tests to protect the public behavior rather than the internal arrangement. A test that asserts private filenames or exact component nesting makes refactoring expensive. A test that verifies the visible result, request contract, fallback, or permission outcome gives maintainers room to improve internals.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about control combinatorial states, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 9. Protect flag configuration

Restrict who can change production rollout and kill-switch values.

Start by identifying the failure boundary: what changes, who owns it, and which consumers must remain unaffected. This question is more useful than asking where a file should live or whether a component is sufficiently reusable. A boundary should make dependencies visible and reduce the number of places a maintainer must inspect.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about protect flag configuration, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 10. Roll out gradually

Use internal, percentage, and audience-based stages with rollback criteria.

Prefer explicit contracts over hidden conventions. A teammate should be able to understand valid inputs, outputs, failure states, and ownership by reading the module boundary. When the contract depends on undocumented import order or a global mutable singleton, the architecture is brittle even if the current screen looks correct.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about roll out gradually, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 11. Assign owners and expiry dates

Every temporary flag needs a removal decision.

Compare the naive approach with the production approach. The naive version optimizes the first implementation and leaves edge cases to each caller. The production version makes the edge case part of the contract, so every consumer gets consistent behavior and tests can assert it once.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about assign owners and expiry dates, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

### 12. Remove dead branches

Delete the flag, tests, and obsolete implementation after rollout ends.

Check the boundary under failure, not only on the happy path. Consider missing configuration, stale data, a slow network, repeated interaction, route changes, malformed input, and a component being mounted or removed quickly. A design that cannot explain these states is not complete.

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Wrong approach:** Let each consumer make its own decision about remove dead branches, creating inconsistent behavior.
**Correct approach:** Put the decision at the narrowest stable boundary, document the contract, and test the observable result.
**Gotcha:** A locally correct implementation can still fail when configuration is missing, a request is repeated, a route changes, or a dependent feature is loaded independently.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Safe-default release flag

**What it does:** Establishes a repeatable boundary for safe-default release flag so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 2: Percentage rollout

**What it does:** Establishes a repeatable boundary for percentage rollout so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 3: Operational kill switch

**What it does:** Establishes a repeatable boundary for operational kill switch so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 4: Deterministic experiment assignment

**What it does:** Establishes a repeatable boundary for deterministic experiment assignment so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 5: Flag owner and expiry registry

**What it does:** Establishes a repeatable boundary for flag owner and expiry registry so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

### Pattern 6: Flag retirement workflow

**What it does:** Establishes a repeatable boundary for flag retirement workflow so behavior is consistent and independently testable.
**When to use it:** Use this pattern when multiple routes or contributors need the same guarantee, or when a failure could affect unrelated parts of the application.
**Implementation:**

```ts
type FlagName = "newProjectGallery" | "revisedContactForm";

type FlagConfig = Record<FlagName, boolean>;

const safeDefaults: FlagConfig = {
  newProjectGallery: false,
  revisedContactForm: false,
};

export function isEnabled(
  flags: Partial<FlagConfig> | undefined,
  name: FlagName,
): boolean {
  // Missing remote configuration falls back to the explicit safe default.
  return flags?.[name] ?? safeDefaults[name];
}
```

**Operational note:** Include the failure path in tests and make ownership explicit; do not treat this pattern as a substitute for server-side enforcement where authorization or secrets are involved.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Flag treated as permission | UI control mistaken for security | Enforce authorization on the server for every protected action |
| Missing config enables feature | Unsafe default chosen | Define per-flag safe defaults explicitly |
| Flag never removed | No lifecycle owner | Attach owner and expiry date and track retirement |
| Remote SDK called in every component | Evaluation is scattered | Resolve a typed flag snapshot at a stable boundary |
| Experiment assignment changes per render | Assignment is nondeterministic | Use stable user or session bucketing |
| Flag exposure counted on evaluation | Exposure does not equal view | Record exposure when the variant is actually rendered |
| Many flags combine unchecked | State space grows exponentially | Limit interactions and test supported combinations |
| Kill switch depends on redeploy | Operational purpose missed | Use a controlled runtime config path with audited access |
| Flag service outage crashes app | No fallback defined | Use cached values or explicit safe defaults |
| Secret config exposed in browser | Flag payload contains privileged values | Only ship non-sensitive client-evaluable configuration |
| No rollout stop criteria | Success is subjective | Define error, latency, and conversion guardrails before rollout |
| Flag names are ambiguous | Purpose is undocumented | Use domain-specific names and record owner and intent |
| Old branch remains after rollout | Cleanup omitted | Delete flag, obsolete branch, and stale tests in the same retirement task |
| Client flag used to hide admin route | Route hiding mistaken for access control | Verify role and resource permission on the server |

---

## Mental Models

1. **A flag is a temporary branch:** it needs an owner and an end condition.
2. **Defaults are decisions:** missing config must have predictable behavior.
3. **Visibility is not authorization:** server policy remains authoritative.
4. **Exposure is not evaluation:** measure the experience users actually receive.
5. **Rollout is controlled risk:** define stop conditions before increasing traffic.
6. **Delete the branch:** flag retirement includes code and tests, not only dashboard cleanup.

---

## Quick Reference

| Decision | Recommended default | Review question |
|---|---|---|
| Flag category | Document purpose | Release, experiment, or kill switch? |
| Default | Risk-based explicit value | What if service is down? |
| Evaluation | Typed central snapshot | Is evaluation scattered? |
| Authorization | Server enforcement | Can direct API call bypass UI? |
| Experiment | Stable bucketing | Does assignment remain consistent? |
| Exposure | Record actual view | Did user see the variant? |
| Rollout | Stages and guardrails | When should rollout stop? |
| Kill switch | Audited runtime control | Can risk be disabled quickly? |
| Config outage | Cache/default policy | Is behavior deterministic? |
| Combinations | Limit and test states | Which flags interact? |
| Ownership | Owner plus expiry | Who removes this? |
| Secrets | Never in client flags | Is payload public-safe? |
| Retirement | Delete branch and tests | Is old code gone? |
| Telemetry | Error and latency metrics | Can variant harm be seen? |
| Permissions | Separate access policy | Does server authorize? |

---

## Advanced Operational Notes

### Flag taxonomy and lifecycle

Release flags guard unfinished work during deployment; experiment flags assign users to variants; operational flags disable a risky subsystem; permission checks decide whether an action is allowed. Mixing these purposes makes defaults and telemetry ambiguous. Record a short description, owner, creation date, expiry date, and removal condition for every temporary flag. A permanent configuration setting may belong in ordinary configuration rather than a feature flag. Taxonomy is useful only if the team acts on it during reviews and cleanup.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Safe defaults under outages

The flag service may be unavailable, slow, or return partial configuration. Define defaults in application code and decide whether a cached last-known value is acceptable. For risky features such as a new payment flow, defaulting off may be safest; for a harmless visual improvement, defaulting on might be acceptable. The decision should be per flag and documented. Do not let a missing property coerce to truthy or use an untyped string comparison that silently changes behavior.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Rollout guardrails

Rollout should move through explicit stages: internal users, a small percentage, a broader audience, then general availability. Before each stage, inspect error rate, latency, completion rate, and support feedback. Define stop thresholds before launch so a team does not rationalize bad metrics after the fact. A kill switch must be accessible to authorized operators and have an observable effect. Test the switch before the feature becomes business-critical; a control that has never been exercised is not a reliable control.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Experiments and assignment

Experiment assignment should be stable for the intended unit, usually a user or session, and should avoid exposing sensitive identity information. Ensure a user does not jump between variants on each page load. Record assignment separately from exposure, because an assigned user may never visit the feature. Avoid changing multiple unrelated UI variables in one experiment unless the analysis is designed for it. Follow applicable privacy and consent requirements for analytics.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Flag combinations and test strategy

With ten independent boolean flags, there are 1,024 theoretical combinations. Testing all combinations is often impractical, so limit interactions, define supported combinations, and use pairwise or risk-based coverage where appropriate. Prefer one flag per meaningful rollout decision rather than a maze of flags controlling tiny internal branches. Include tests for the default state, enabled state, disabled state, and service failure. Document dependencies when a new UI requires a server capability that must deploy first.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Security and access control

A feature flag payload delivered to the browser is public to that browser user. Never put credentials, internal-only data, or secret operational details in client-evaluated flag configuration. Restrict who can change production flags, audit changes, and separate user-facing rollout permissions from deployment permissions. Most importantly, a disabled client flag must not be the only thing preventing access to a protected endpoint. The server must verify identity, permission, and resource ownership for every protected operation.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Flag observability

Record flag evaluations carefully and record exposure only when the user actually sees the variant. Include a flag key, variant, release, and non-sensitive correlation context. Avoid sending raw user identifiers to analytics unless there is a clear, compliant need. When a rollout causes regressions, compare the affected cohort with the control and correlate changes with server metrics. Logging every evaluation can produce noise and cost; instrument the events that answer operational and product questions.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.

### Retirement as normal engineering work

A flag is not finished when it reaches 100 percent. The team must choose the winning behavior, remove the obsolete branch, update tests, remove dashboard configuration, and delete stale documentation. Leaving flags indefinitely multiplies test states and makes code paths difficult to reason about. Use an expiry report or CI inventory to identify stale flags. If a flag must remain permanently as an operational kill switch, document why it is different from a temporary release flag and test its failure behavior.

**Review exercise:** Explain which module owns this decision, which observable behavior proves it works, and what failure test would catch a regression. Keep the rule enforceable where possible rather than relying only on documentation.


### Operational ownership and auditability

A production flag is an operational control, so its changes should be attributable and reversible. Record who changed a value, when it changed, what environment was affected, and why the change was made. Restrict editing permissions to the people who need them and make the kill-switch path usable during an incident without requiring a new frontend deployment. At the same time, do not make the entire application depend on a remote flag service being healthy; cached configuration and explicit defaults should keep the rest of the product usable. Run a tabletop exercise: simulate the new gallery causing memory pressure on mobile, disable the flag, and verify that new sessions stop loading it while existing sessions degrade safely. Define whether an in-flight interaction completes or is interrupted. The answer depends on the feature, but it must be intentional. Document these behaviors so support and on-call engineers can use the control confidently.

### Flag evaluation and server-rendered applications

In server-rendered applications, flag evaluation can differ between server and browser if the two environments use different assignments or defaults. That mismatch can cause hydration warnings, visual flashes, or a user briefly seeing a feature that is disabled after hydration. Resolve the initial flag snapshot consistently for the request where appropriate, serialize only public-safe values, and keep the client from immediately replacing the snapshot with a contradictory value. Never serialize secrets or private targeting rules merely to simplify hydration. For static pages, decide whether the flag is build-time, request-time, or client-time; each choice has different freshness and caching implications. Test a first visit, a returning visit, a flag-service outage, and a user whose assignment changes during rollout. Make the expected result explicit for each case.

---

## Build Challenge

### Build: Production-ready Feature Flag System for a multi-route creative SaaS

Build a small but realistic application slice that demonstrates the skill in a production-like environment. Include a clear README describing assumptions, architecture decisions, commands, and known limitations. Do not submit only a diagram or isolated snippet; the result must run and must demonstrate at least one recoverable failure.

### Requirements

1. Implement a typed flag registry with purpose and owner metadata.
2. Define safe defaults for missing configuration.
3. Support one staged rollout and a kill switch.
4. Keep server authorization independent from client flag values.
5. Use deterministic assignment for an experiment variant.
6. Record exposure only when the variant is rendered.
7. Test service outage and malformed configuration.
8. Limit and document interacting flags.
9. Add telemetry guardrails for errors and latency.
10. Restrict production flag editing in the deployment plan.
11. Add expiry metadata to every temporary flag.
12. Retire one flag completely, including obsolete tests and branches.

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

Review stale flags during each release and assign an explicit cleanup owner before rollout begins.

Track removal in the sprint plan and verify it in code review.
