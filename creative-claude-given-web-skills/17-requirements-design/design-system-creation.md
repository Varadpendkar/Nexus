# SKILL: design-system-creation
**Layer:** 17 — Requirements & Design
**Goal:** Create a governed, accessible design system with primitive, semantic, and component tokens that keeps visual decisions consistent while allowing product-specific evolution.

---

## Why This Matters (Senior Perspective)

Requirements and design process is where delivery risk is either reduced cheaply or pushed into implementation, where it becomes expensive. A polished screen can still solve the wrong problem; a well-estimated sprint can still deliver a feature nobody needs. This skill treats evidence, decisions, and verification as a connected system rather than paperwork performed before “real work” starts.

For creative web and freelance work, unclear expectations are especially costly: clients often describe a visual solution before the audience, content, operating constraints, or success measure is clear. The senior approach is to make assumptions visible, test risky choices early, record decisions, and translate the agreed outcome into artifacts that design, engineering, QA, and the client can all inspect.

## Core Concepts

### 1. Token hierarchy: primitive to semantic to component

Primitive tokens are raw values, semantic tokens express intent, and component tokens apply intent to a specific UI part. This separation lets a theme change without rewriting every button and keeps component exceptions explicit rather than scattering hex values across files.

**Working pattern**

```text
:root {
  /* Primitive: raw palette and spacing values */
  --blue-700: #174ea6;
  --space-4: 1rem;
  /* Semantic: meaning remains stable across themes */
  --color-action-primary: var(--blue-700);
  --space-control-inline: var(--space-4);
  /* Component: implementation-specific application */
  --button-primary-bg: var(--color-action-primary);
  --button-padding-inline: var(--space-control-inline);
}
/* Change semantic intent centrally; avoid hard-coded color in each component. */
```

**Gotcha:** Do not let component tokens become a second uncontrolled palette. Promote a value to semantic only when its meaning is reusable.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 2. Color system and semantic states

Define roles such as surface, text, border, action, focus, success, warning, and danger. Check contrast for actual foreground/background pairs and states, not just individual swatches. Include dark mode or alternate themes as mappings to semantic tokens rather than duplicated component styles.

**Working pattern**

```text
:root {
  --color-text-primary: #172033;
  --color-surface-page: #ffffff;
  --color-border-subtle: #c8cfda;
  --color-focus-ring: #174ea6;
  --color-status-danger: #a61b1b;
}
/* Validate contrast for every used pair; a named token alone is not proof of compliance. */
```

**Gotcha:** Color meanings need sufficient non-color cues: an error should include text or an icon, not only a red border.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 3. Spacing and sizing scales

A spacing scale reduces arbitrary gaps and creates rhythm. Define a small primitive scale, then semantic aliases for page gutters, section spacing, control padding, and content gaps. Use fluid values only where a real responsive rule exists; do not make every dimension fluid just because clamp() is available.

**Working pattern**

```text
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --layout-page-gutter: clamp(1rem, 4vw, 3.5rem);
  --layout-section-gap: clamp(3rem, 7vw, 7rem);
}
/* Semantic aliases express layout intent and are easier to tune across pages. */
```

**Gotcha:** A scale is a constraint that improves coherence, not a rule that every spacing must be a multiple when content requires otherwise.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 4. Typography roles and fluid type

Define font families, weights, line heights, letter spacing, and type roles such as display, heading, body, label, and caption. Keep body readability stable and use fluid scaling for display roles only when the layout benefits. Provide fallback stacks and account for font loading shifts.

**Working pattern**

```text
@font-face {
  font-family: "Studio Sans";
  src: url("/fonts/studio-sans.woff2") format("woff2");
  font-display: swap; /* Keep text visible while the custom font loads. */
}
:root {
  --font-body: "Studio Sans", system-ui, sans-serif;
  --text-body-size: 1rem;
  --text-body-line-height: 1.6;
  --text-display-size: clamp(2.75rem, 7vw, 6rem);
}
.project-title { font: 700 var(--text-display-size)/0.98 var(--font-body); }
```

**Gotcha:** If fallback font metrics differ substantially, headings can reflow after load; test with the actual font and realistic content.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 5. Component tokens and variants

Component tokens should express meaningful variants—primary, secondary, destructive, compact—not one-off values for each page. Keep component API and visual token naming aligned. If every instance needs a unique override, investigate whether the component model is wrong or the design has a legitimate new variant.

**Working pattern**

```text
:root {
  --button-primary-bg: var(--color-action-primary);
  --button-primary-text: var(--color-on-action);
  --button-radius: 999px;
  --button-height: 2.75rem;
}
.button { min-height: var(--button-height); border-radius: var(--button-radius); }
.button--primary { background: var(--button-primary-bg); color: var(--button-primary-text); }
/* Named variants make intended differences discoverable and reviewable. */
```

**Gotcha:** Avoid names like --button-blue-2; they describe a value, not the role or contract.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 6. Design tokens as a source of truth

Keep tokens in a structured source that can generate CSS, design-tool variables, and documentation. Define naming, aliases, deprecation, and validation rules. Do not maintain independent hand-edited values in design files and code without a synchronization process.

**Working pattern**

```text
tokens = {
    "color": {
        "primitive": {"blue-700": "#174ea6"},
        "semantic": {"action-primary": "{color.primitive.blue-700}"},
    },
    "spacing": {"primitive": {"4": "1rem"}},
}
# In production, validate references and generate platform outputs from this source.
```

**Gotcha:** A token file with broken aliases may pass visual review until a theme or build pipeline consumes it.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 7. Accessibility built into components

Specify keyboard interaction, focus visibility, accessible names, state announcements, contrast, target size, and reduced-motion behavior as part of the component contract. Native elements are usually the safest baseline; custom controls must deliberately recreate expected semantics and interaction.

**Working pattern**

```text
<button class="button button--primary" type="button">
  Request a project consultation
</button>
/* Preserve a visible focus indicator for keyboard users. */
.button:focus-visible {
  outline: 3px solid var(--color-focus-ring);
  outline-offset: 3px;
}
/* A semantic button already supplies keyboard activation and role. */
```

**Gotcha:** Removing outlines without a replacement can make the component unusable for keyboard navigation.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 8. Responsive and density decisions

Document which tokens change with viewport, density, or context. A compact control may be appropriate in a dense data tool but not on a touch-first landing page. Use responsive semantic aliases and test components at content extremes, zoom, and narrow widths.

**Working pattern**

```text
:root { --control-height: 2.75rem; }
@media (pointer: coarse) {
  :root { --control-height: 3rem; }
}
.form-control { min-height: var(--control-height); }
/* Adapt to input capability rather than assuming viewport width equals touch. */
```

**Gotcha:** A breakpoint is not a device detector. Hybrid laptops and zoomed windows can violate simple desktop/mobile assumptions.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 9. Theming and brand expression

Separate brand identity from functional meaning. A theme can change decorative surfaces, typography, and accent colors while keeping semantic success, warning, and danger roles understandable. Test contrast and focus indicators in every supported theme.

**Working pattern**

```text
[data-theme="dark"] {
  --color-text-primary: #f3f5fa;
  --color-surface-page: #101522;
  --color-border-subtle: #3a4356;
  --color-action-primary: #8db7ff;
}
/* Components consume semantic tokens, so theme changes do not require rewrites. */
```

**Gotcha:** Do not assume inverting every color produces a usable dark theme; images, elevation, and status colors need deliberate treatment.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 10. Governance, contribution, and versioning

A design system is a product with users: designers, engineers, QA, and content authors. Define ownership, proposal workflow, contribution criteria, release notes, and deprecation windows. Breaking changes should be visible and migration guidance should exist before removal.

**Working pattern**

```text
component_change = {
    "proposal": "Add a quiet button variant",
    "reason": "Secondary actions compete visually with primary actions",
    "evidence": "Reviewed in checkout and enquiry flows",
    "impact": "New token mapping and documentation example",
    "migration": "Existing secondary variant remains supported until next major release",
}
# Record the decision so consumers understand why a variant exists.
```

**Gotcha:** Unannounced token renames can break multiple product surfaces even if the design change looks minor.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 11. Documentation and examples

Document intent, allowed variants, anatomy, states, accessibility, responsive behavior, and examples of misuse. Show real use cases rather than a wall of swatches. Documentation should answer how to choose a component and when not to use it.

**Working pattern**

```text
component_docs = {
    "component": "Button",
    "use_for": "An action that changes state or submits a task",
    "do_not_use_for": "Navigation to another URL; use an anchor",
    "states": ["default", "hover", "focus", "disabled", "loading"],
    "a11y": "Accessible name, keyboard focus, announced loading status",
}
# Keep documentation adjacent to the implementation and versioned with it.
```

**Gotcha:** A screenshot-only component catalog cannot explain semantics, API contracts, or edge cases.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 12. Testing tokens and visual regression

Test token compilation, required semantic aliases, contrast-sensitive pairs, and component visual states. Visual regression tests catch unintended changes, but snapshots need stable data, fonts, and viewport settings. Review diffs rather than blindly updating every snapshot after a token change.

**Working pattern**

```text
// Example CI assertion for a required semantic token in generated CSS.
const requiredTokens = [
  "--color-text-primary",
  "--color-surface-page",
  "--color-focus-ring",
];
// The build should fail if a required public token disappears unexpectedly.
```

**Gotcha:** A snapshot update can conceal a real regression if reviewers accept every changed image without checking the cause.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 13. Integrating the system into a portfolio build

For a creative studio site, define primitives, semantic roles, and component tokens before styling the project grid, case-study layouts, and enquiry forms. Keep motion tokens separate from structural tokens and include reduced-motion alternatives. Measure whether the system makes new pages faster to build without flattening brand expression.

**Working pattern**

```text
:root {
  --motion-duration-fast: 140ms;
  --motion-duration-standard: 240ms;
  --motion-ease-enter: cubic-bezier(.2, .7, .2, 1);
}
@media (prefers-reduced-motion: reduce) {
  :root { --motion-duration-fast: 0ms; --motion-duration-standard: 0ms; }
}
/* Motion has its own semantic system; users can request less of it. */
```

**Gotcha:** A system should constrain repeated decisions while leaving room for a deliberate one-off hero or editorial moment.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### Field Guide: Field guide: govern a design system as a product

#### Field note 1: Choose names that survive redesigns

Token names should express purpose rather than the current visual value. “Action-primary” can map to a different hue in a high-contrast theme; “blue-700” cannot communicate that intent on its own. Keep primitive names descriptive and semantic aliases stable. Avoid naming a semantic role after one component if it is used across several components.

**Applied example and review check**

Use a naming convention consistently across design tools, CSS, and documentation. Document whether tokens use kebab-case, slash-separated paths, or another convention and how aliases are represented. Consistency matters more than any single naming style.

#### Field note 2: Define component boundaries

A component belongs in the shared system when it represents repeated behavior or a stable design contract. Avoid abstracting every visual grouping into a configurable component with dozens of props. Too many variants create a hidden combinatorial system that is hard to test. Prefer a small API that covers real recurring needs and compose simpler pieces for unique editorial layouts.

**Applied example and review check**

A button variant may represent a meaningful priority level. A prop for every page-specific margin usually belongs in layout composition, not the button’s public API. Review whether a proposed variant changes behavior, semantics, or a repeated visual contract.

#### Field note 3: Validate accessibility in context

The shared system can provide good defaults, but consumers can still misuse components. Test color pairs, keyboard behavior, accessible names, status announcements, and focus visibility in real layouts. Document limitations such as when a link should be used instead of a button. Include reduced-motion behavior for motion-bearing components and ensure disabled states remain understandable.

**Applied example and review check**

Do not claim that a token or component is “WCAG compliant” without evaluating the actual implementation and context. Conformance applies to the rendered experience and relevant success criteria, not to a color name or library label.

#### Field note 4: Plan versioning and migrations

Treat public tokens and component props as APIs. Before renaming or removing them, search usage, announce the change, provide a replacement, and state the migration window. Keep release notes that explain why the change happened. If a breaking change is necessary, provide a clear upgrade path and test consumers before release.

**Applied example and review check**

A design system may be consumed by several applications with different release schedules. Avoid assuming every consumer can upgrade at once. Compatibility aliases can provide time to migrate, but should have an owner and planned removal date.

#### Field note 5: Measure system health

Track adoption, duplicate patterns, override frequency, accessibility defects, contribution lead time, and the time needed to implement a new page. A system that has many tokens but is difficult to use is not healthy. Review feedback from designers and engineers and remove unnecessary complexity when the evidence supports it.

**Applied example and review check**

Do not optimize only for reuse count. A high reuse rate can still produce a poor experience if the shared component is wrong for the context. The goal is reliable consistency and faster, safer decisions—not uniformity at any cost.

### Operational Review Notes

#### Review note 1: Token migration validation

Before changing token values or names, identify consumers and run the generated build or token validation suite. Test themes, focus states, disabled controls, error messages, and responsive variants. A token change may look harmless in one button but affect dozens of surfaces. Record expected visual changes and review unexpected diffs separately. Where a token is public, give consumers a migration path and do not delete the old alias until the agreed deprecation condition is met.

#### Review note 2: Prevent component variant explosion

A component with many independent Boolean props can create dozens of combinations, many of which have never been designed or tested. Prefer named variants with explicit supported combinations. If a component needs to handle fundamentally different semantics, split it rather than forcing a universal component to cover every case. Document extension points and keep page-specific composition outside the shared core when it does not represent a repeated contract.

#### Review note 3: Test the design system as shipped

Review the built output, not only the source tokens. Confirm fonts and assets load, aliases resolve, CSS is included, and consumers can import the documented entry points. Test the system in a real page with realistic content and keyboard interaction. Keep a small reference page that exercises every public component state so regressions are visible before the library is released.

#### Review note 4: Measure exceptions

Track repeated overrides and one-off component forks. A growing number of exceptions can mean the shared system is missing a real variant, but it can also mean consumers are using a component outside its intended role. Review the reason for each repeated exception before adding a token. The goal is to remove accidental divergence without turning the design system into a configuration language that nobody can understand.

## Relevant Patterns

The following patterns are reusable workflows. Each is designed for a real trigger and includes a practical implementation sketch.

### Pattern 1: Three-tier token mapping

**What it does:** Three-tier token mapping in a repeatable form.

**When to use it:** Use when a brand refresh must propagate without editing every component.

```python
tokens = {"primitive": {"blue-700": "#174ea6"}, "semantic": {"action-primary": "{primitive.blue-700}"}, "component": {"button-primary-bg": "{semantic.action-primary}"}}
# Validate references and avoid direct component-to-primitive coupling.
```

Do not promote every isolated value to a global token.

### Pattern 2: Semantic theme switch

**What it does:** Semantic theme switch in a repeatable form.

**When to use it:** Use when adding dark mode or a second brand theme.

```python
[data-theme="dark"] { --color-text-primary: #f3f5fa; --color-surface-page: #101522; }
/* Components consume semantic names, not theme-specific literals. */
```

Contrast must be checked for actual combinations in each theme.

### Pattern 3: Accessible component contract

**What it does:** Accessible component contract in a repeatable form.

**When to use it:** Use when publishing a reusable button, form field, dialog, or navigation component.

```python
component_contract = {"semantics": "native element where possible", "keyboard": "expected activation and focus", "states": ["focus", "disabled", "loading", "error"], "contrast": "validated pairs"}
# Document behavior as part of the component API.
```

A component library cannot guarantee accessibility if consumers can bypass its semantics.

### Pattern 4: Token deprecation path

**What it does:** Token deprecation path in a repeatable form.

**When to use it:** Use when renaming or replacing a public token.

```python
deprecation = {"old": "--color-brand-blue", "replacement": "--color-action-primary", "release_note": "Migration guide included", "removal": "After announced support window"}
# Provide a compatibility period when downstream consumers need migration time.
```

Immediate removal turns a design improvement into a breaking build.

### Pattern 5: Visual regression discipline

**What it does:** Visual regression discipline in a repeatable form.

**When to use it:** Use when shared tokens affect many pages.

```python
checks = ["stable viewport", "loaded fonts", "representative content", "focus and error states"]
# Review screenshot diffs before updating baselines.
```

Do not approve every changed snapshot without identifying the cause.

### Pattern 6: System contribution review

**What it does:** System contribution review in a repeatable form.

**When to use it:** Use when a proposed variant is requested by one page.

```python
proposal = {"need": "Quiet action for secondary CTA", "reuse": "Two flows", "alternatives": "Existing link or secondary button", "decision": "Add variant only if behavior and semantics differ meaningfully"}
# Prefer a documented reusable pattern over one-off overrides.
```

A single local exception does not automatically justify a permanent system token.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Components use raw hex values | Local literals bypass central intent and theme mapping. | Route component styling through semantic tokens and reserve primitives for token definitions. |
| No token hierarchy | Every change becomes a global search-and-replace. | Separate primitive, semantic, and component token layers. |
| Semantic names encode appearance | A name like blue-button breaks when the theme changes. | Name tokens by role, such as action-primary or text-muted. |
| No contrast validation | Palette swatches look fine but pairings fail. | Test actual foreground/background pairs for text, focus, and states. |
| Too many primitives | A sprawling scale becomes arbitrary again. | Use a compact scale and document justified exceptions. |
| Component tokens duplicate system | Every component defines a new color vocabulary. | Alias component tokens to semantic roles and add only genuine component needs. |
| Dark mode by inversion | Inverted colors damage contrast, imagery, and elevation. | Map semantic tokens per theme and test every state. |
| Accessibility omitted from API | Consumers create inaccessible custom behavior. | Document native semantics, keyboard contract, focus, names, and status announcements. |
| No deprecation policy | Renames break consumers without warning. | Version public tokens and provide a migration window. |
| Snapshots updated blindly | Real visual regressions are accepted. | Review diffs with stable fonts, content, and viewport before updating baselines. |
| One-off request becomes global token | Local need bloats the shared API. | Require evidence of repeated use or a meaningful reusable variant. |
| Documentation only shows appearance | Developers do not know when or how to use a component. | Document purpose, non-use cases, states, accessibility, and examples. |
| Design and code values drift | Independent edits create inconsistent UI. | Use a source of truth and a tested token export pipeline. |
| Responsive token ignores input type | Viewport width is mistaken for touch capability. | Use capability-aware rules where relevant and test hybrid devices. |
| No owner for governance | Contributions conflict and releases are unpredictable. | Assign maintainers and a review/release process. |
| Motion ignores reduced-motion | Animations can cause discomfort or block comprehension. | Define motion tokens and meaningful reduced-motion alternatives. |
| Token deletion breaks production | Unused tokens may still be consumed downstream. | Search consumers, announce deprecation, and validate generated outputs before removal. |

### Before → After: make the decision testable

**Before**

```text
Requirement: Make the website engaging and easy to use.
```

**After**

```text
Requirement: A prospective client can find a case study matching a service, identify the studio role and outcome, and reach an enquiry form using keyboard or pointer. If no projects match, the interface explains how to clear filters. Verify with a task-based prototype test and keyboard audit.
```

The revised statement identifies a user, a task, evidence needed, a failure state, and verification. It still leaves implementation choices open until the team has enough evidence.

## Mental Models

1. **Primitive is not meaning** — Raw values belong beneath stable semantic roles.
2. **Tokens are an API** — Names, deprecations, and releases affect downstream consumers.
3. **Accessibility is component behavior** — Semantics and keyboard contracts are not a theme option.
4. **Consistency is purposeful repetition** — Reuse patterns where behavior repeats; do not flatten meaningful brand moments.
5. **A theme is a mapping** — Semantic roles change values; components should not know theme-specific hex codes.
6. **Visual diffs need judgment** — Snapshot tooling finds change, not whether the change is correct.
7. **Governance protects velocity** — Ownership and contribution rules prevent a library of conflicting exceptions.

## Quick Reference Table

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Primitive token | Raw value | Do not reference everywhere directly |
| Semantic token | Meaning/role | Stable across themes |
| Component token | Component application | Alias semantic tokens |
| Color roles | Text, surface, action, border, status | Check actual contrast pairs |
| Spacing scale | Small set of repeatable values | Allow justified exceptions |
| Typography role | Size, weight, line height, family | Test font loading shifts |
| Focus ring | Visible keyboard indicator | Never remove without replacement |
| Theme mapping | Semantic values per theme | Do not simply invert colors |
| Reduced motion | Motion alternative for preference | Keep meaning and access |
| Token source | Structured single source | Validate aliases and exports |
| Versioning | Deprecation and migration window | Public tokens are API |
| Visual regression | Stable snapshots and reviewed diffs | Do not auto-approve all changes |
| Component docs | Use, non-use, states, accessibility | Examples need realistic content |
| Governance | Owner and contribution process | Avoid conflicting variants |
| Responsive tokens | Context-aware aliases | Viewport is not input capability |
| Component variant | Meaningful reusable behavior | Avoid one-off global tokens |

## Build Challenge

### Build: Design System Creation for a Creative Studio Portfolio

Create a decision-ready artifact set for a fictional creative studio redesign. The work must connect audience evidence to a tested user journey and a release boundary. The goal is not to produce documentation for its own sake; the output should let a small team begin design and implementation without guessing about the core outcome or failure behavior.

**Requirements**

1. Define primitive, semantic, and component token layers.
2. Create color tokens for text, surface, border, action, focus, and status.
3. Define spacing and sizing scales with semantic aliases.
4. Create typography roles with line height and fallback strategy.
5. Build button, form field, card, and status components with meaningful variants.
6. Document keyboard behavior, focus, error, disabled, and loading states.
7. Provide a second theme using semantic token mapping.
8. Define reduced-motion behavior for animated components.
9. Create contribution, ownership, and deprecation rules.
10. Add documentation for use cases and when not to use components.
11. Specify token validation and visual regression review.
12. Demonstrate the system across project index, case study, and enquiry screens.

**Expected output / definition of success**

- A reviewable design system creation artifact set tied to the studio’s stated business outcome.
- At least one traceable path from evidence or assumption to requirement, design decision, and verification.
- Failure, empty, accessibility, privacy, and operational cases represented where relevant.
- A decision log that identifies owner, rationale, exclusions, and unresolved risks.
- A teammate can explain what is included, what is deferred, how success is checked, and who owns the next decision without asking the author to interpret the artifact.

**Suggested focused-session plan**

1. 15 minutes — define audience, outcome, constraints, and source evidence.
2. 25 minutes — create the main artifact and map the critical path.
3. 20 minutes — add error states, acceptance criteria, and dependencies.
4. 15 minutes — review with another role and identify ambiguous language.
5. 10 minutes — revise, assign owners, and record the baseline.

**Definition of done**

The artifact is internally consistent, specific to the portfolio project, testable, accessible by design, and explicit about failure recovery. All Must-have items have acceptance criteria. Open questions are owned rather than hidden. No unsupported claim is presented as a confirmed fact.
