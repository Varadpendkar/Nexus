# SKILL: storybook-design-system

**Layer:** 21 --- Design Systems

**Goal:** Use Storybook as an executable component contract with
deterministic stories, interaction tests, accessibility review, visual
regression, and release checks.

------------------------------------------------------------------------

## Why This Matters (Senior Perspective)

Storybook fails when it only shows a happy-path screenshot. A button may
look right but fail when disabled, focused by keyboard, or rendered with
a long label. A dialog story can hide focus bugs if it never opens
through a real interaction. Senior teams treat stories as reproducible
examples of the public contract: they cover meaningful variants, edge
cases, loading and error states, keyboard flows, and responsive
constraints. Automated accessibility and screenshot checks are signals,
not proof of a complete experience. Deterministic fixtures and CI builds
keep the catalogue trustworthy. In studio and freelance work, this gives
clients and teammates a concrete review surface without requiring them
to boot the full application.

------------------------------------------------------------------------

## Core Concepts

### 1. Stories as reproducible fixtures

A story declares a stable component state without requiring a live
account, route, or backend.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ActionButton } from './ActionButton';
const meta = { component: ActionButton, args: { children: 'Save changes', variant: 'primary' } } satisfies Meta<typeof ActionButton>;
export default meta; type Story = StoryObj<typeof meta>;
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 2. Args and controls

Controls should expose valid public options, not internal implementation
details or contradictory combinations.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
export const Destructive = { args: { children: 'Delete project', variant: 'danger' } } satisfies Story;
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 3. State matrix

Cover default, disabled, loading, long content, error, keyboard focus,
and responsive placement rather than making many cosmetic duplicates.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
export const Disabled = { args: { children: 'Save changes', disabled: true } };
export const LongLabel = { args: { children: 'Save and publish all project changes' } };
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 4. Interaction tests

Use a play function to click, type, and assert the visible result. Test
the user journey rather than mutating component internals.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
import { expect, userEvent, within } from '@storybook/test';
export const QuantityFlow = { play: async ({ canvasElement }) => { const canvas = within(canvasElement); await userEvent.click(canvas.getByRole('button', { name: 'Increase quantity' })); await expect(canvas.getByText('2 items')).toBeVisible(); } };
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 5. Accessibility checks

Automated checks catch some missing names and contrast issues but cannot
prove complete keyboard or screen-reader behaviour.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Run automated accessibility checks, then manually test keyboard order, focus restoration, and error announcements.
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 6. Visual regression stability

Snapshots are useful only when fonts, data, viewport, animation, and
time are deterministic. Review diffs instead of blindly accepting them.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Use fixed fixtures, fixed viewport, stable date values, and disabled or frozen animations.
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 7. Decorators and providers

Provide minimal context such as theme, locale, or router without booting
the full application for every story.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const withDarkTheme = Story => <div data-theme="dark"><Story /></div>;
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 8. Responsive viewports

Test widths where layout changes, including long text and zoom/reflow.
Container size may matter more than viewport width.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
export const Narrow = { decorators: [Story => <div style={{ maxWidth: 280 }}><Story /></div>] };
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 9. Mock network and time

Live requests create flaky stories and can expose private data. Use
fixed fixtures or request mocks.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const projectFixture = { name: 'Atlas redesign', status: 'In review', updatedAt: '2026-10-01T10:00:00Z' };
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 10. Documentation blocks

Explain intended use, required props, accessibility expectations, and
alternatives. Keep snippets aligned with the public API.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Include a usage note explaining when navigation should use a link rather than an action button.
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 11. Organization and naming

Use component family and intent-based state names; ambiguous Example2
stories slow review.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Button / Primary; Button / Destructive; Dialog / Confirmation; Field / Invalid
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 12. CI release gates

Run type checks, tests, and a production Storybook build in CI to catch
missing imports and environment assumptions.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Pipeline: install -> lint -> typecheck -> test -> build-storybook
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 13. Performance and isolation

Avoid importing the whole application into every story. Keep expensive
demos separate so iteration remains fast.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Import a focused component entry point rather than a barrel that loads unrelated features.
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

### 14. Integrated review set

Build a field and dialog story set including invalid data, loading,
focus, narrow viewport, and a deterministic interaction.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
export const InvalidEmail = { args: { label: 'Work email', value: 'not-an-email', error: 'Enter a valid email address' } };
```

**Why this works:** the implementation expresses the decision at the
correct boundary and uses names that communicate intent. Keep the
example near the source that owns it and add a test for the invariant
that would be expensive to rediscover after a regression.

**Naive approach:** copy values or markup into each consumer and repair
inconsistencies by hand. A later update lands in some places but not
others, leaving visual or behavioural drift.

**Correct approach:** route consumers through the shared contract,
document exceptions, and verify the generated or rendered output. If a
special case cannot be expressed cleanly, review the abstraction before
adding another unexplained flag.

**Gotcha:** locally correct examples can fail at integration
boundaries---for example, missing references, portals outside a theme
root, narrow containers, or stories that depend on live data. Test the
boundary that matters to this skill, not only the isolated snippet.

------------------------------------------------------------------------

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Semantic contract

**What it does:** Separates the public meaning from implementation
detail.

**When to use it:** Use when multiple consumers need consistent
behaviour but should not depend on internal markup.

``` tsx
const contract = { name: 'action-primary', purpose: 'Primary action', keyboard: 'native button behaviour' };
```

**Trade-off:** Keep the pattern only while it removes real complexity.
Avoid applying it where a smaller local implementation is clearer.

### Pattern 2: Validation gate

**What it does:** Rejects missing, invalid, or unsupported inputs before
they ship.

**When to use it:** Use in CI or a build step whenever source data
controls generated output.

``` tsx
if (!requiredValue) throw new Error('Required contract value is missing');
```

**Trade-off:** Keep the pattern only while it removes real complexity.
Avoid applying it where a smaller local implementation is clearer.

### Pattern 3: Accessible state example

**What it does:** Makes interaction state visible and testable.

**When to use it:** Use for toggles, async actions, dialogs, and
controls with selection state.

``` tsx
<button type="button" aria-pressed={selected} onClick={toggle}>Select item</button>
```

**Trade-off:** Keep the pattern only while it removes real complexity.
Avoid applying it where a smaller local implementation is clearer.

### Pattern 4: Responsive fixture

**What it does:** Tests a component inside a realistic constrained
container.

**When to use it:** Use for cards, toolbars, panels, and long content
that can wrap.

``` tsx
<section className="preview-frame"><YourComponent /></section>
/* .preview-frame { max-width: 20rem; } */
```

**Trade-off:** Keep the pattern only while it removes real complexity.
Avoid applying it where a smaller local implementation is clearer.

### Pattern 5: Migration bridge

**What it does:** Allows consumers to move from an old public name to a
replacement safely.

**When to use it:** Use for renamed tokens, props, stories, and
documentation URLs.

``` tsx
/** @deprecated Use the documented replacement before the next major release. */
```

**Trade-off:** Keep the pattern only while it removes real complexity.
Avoid applying it where a smaller local implementation is clearer.

### Pattern 6: CI quality gate

**What it does:** Makes the important contract repeatable instead of
dependent on memory.

**When to use it:** Use before publishing a component package or system
update.

``` tsx
// CI: lint -> typecheck -> tests -> accessibility review -> production build
```

**Trade-off:** Keep the pattern only while it removes real complexity.
Avoid applying it where a smaller local implementation is clearer.

------------------------------------------------------------------------

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Only default story | Edge cases remain invisible | Add loading, disabled, error, long-content, and keyboard stories. |
| Live API in story | Preview becomes flaky and may expose data | Use deterministic fixtures or request mocks. |
| Random snapshot data | Visual diffs are noisy | Seed generated data and freeze time-dependent values. |
| Automated accessibility treated as proof | Keyboard defects escape review | Pair automated scans with manual keyboard and screen-reader checks. |
| Full app decorator | Stories become slow and coupled | Provide only the minimal required provider. |
| Interaction test queries CSS class | Test depends on implementation detail | Query by role, label, and visible outcome. |
| Controls expose internal props | Unsupported details look public | Expose only documented public args. |
| No narrow viewport | Clipping ships unnoticed | Add constrained-width stories for responsive components. |
| Blind snapshot acceptance | Regressions become new baselines | Review each diff against an intentional design change. |
| Ambiguous story names | Reviewers cannot locate a state | Name stories by component family and intent. |
| Stale documentation snippet | Consumers copy invalid props | Compile examples and update them with API changes. |
| Animations run during snapshots | Captures differ between runs | Freeze or disable motion in visual-test configuration. |
| No CI Storybook build | Local setup hides missing assets | Require a clean production Storybook build in CI. |
| Large app barrel imported | Preview startup and rebuilds slow down | Use focused imports and isolate heavyweight demos. |

### Before → After

``` tsx
// Before: values or decisions drift independently across consumers.
function LegacyControl() {
  return <button style={{ background: '#2457d6', padding: '16px' }}>Continue</button>;
}

// After: a named public primitive owns the contract.
function ContinueAction() {
  return <ActionButton variant="primary">Continue</ActionButton>;
}
```

------------------------------------------------------------------------

## Mental Models

1.  **Meaning before value** --- define the promise before choosing
    implementation.
2.  **One source, many outputs** --- generated artifacts must be
    reproducible.
3.  **Public APIs are contracts** --- changes need migration thinking.
4.  **Accessibility is behaviour** --- keyboard and focus are part of
    the feature.
5.  **Test boundaries, not only demos** --- failures live at integration
    edges.
6.  **Exceptions need reasons** --- documented exceptions beat silent
    drift.
7.  **Make drift detectable** --- checks and ownership catch decay
    early.

------------------------------------------------------------------------

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Public name | Documented stable API | Use consistent vocabulary |
| Source of truth | Canonical registry or package | Avoid manual duplicate copies |
| Default state | Primary supported usage | Keep the example realistic |
| Variant | Named supported option | Avoid contradictory flags |
| Accessibility | Keyboard, name, focus, state | Test manually and automatically |
| Responsive case | Narrow container and long text | Check clipping and reflow |
| Error state | Invalid or failed operation | Show safe recovery path |
| Fallback | Supported baseline behaviour | Feature-detect modern APIs |
| Test strategy | Observable contract assertions | Avoid private implementation coupling |
| Documentation | Intent and alternatives | Explain when not to use |
| Versioning | Compatible or breaking change | Include migration path |
| Ownership | Named maintainer | Provide a correction route |
| Browser support | Minimum supported versions | Check Safari, Firefox, Chromium |
| Debugging | DevTools and console | Inspect rendered output |
| Definition of done | Verifiable acceptance checks | Run from a clean checkout |

## Build Challenge

### Build: Production-ready Storybook Design System Workbench

Build a runnable, reviewable implementation that demonstrates the skill
in a realistic product context. Do not stop at a static happy-path
screenshot.

1.  Establish a canonical source for the decisions owned by this skill.
2.  Use semantic HTML and realistic names for the visible interface.
3.  Include at least three representative variants or states.
4.  Include a narrow viewport case and a long-content case.
5.  Make keyboard navigation and visible focus work without a mouse.
6.  Include an error, unsupported-value, or invalid-configuration path.
7.  Provide a safe fallback when browser capability or persistence is
    unavailable.
8.  Add automated checks for the most important contract.
9.  Add a manual checklist for behaviour automation cannot prove.
10. Document when to use the pattern and when a simpler alternative is
    better.
11. Demonstrate a future change without editing every consumer.
12. Run the production build from a clean install and resolve meaningful
    warnings.

**Failure injection:** deliberately remove a required token, prop,
fixture, or description, or provide an unsupported state. The build or
test suite must fail clearly, or the interface must degrade to a
documented safe default. A silent blank value or broken keyboard path is
a failed challenge.

**Expected output:** a working example, representative states, tests, a
short usage guide, and documented trade-offs.

### Definition of done

-   [ ] Public names and states are documented.
-   [ ] Primary workflow works with keyboard and pointer input.
-   [ ] Narrow and long-content cases remain usable.
-   [ ] The injected failure is detected or safely handled.
-   [ ] Automated checks pass from a clean checkout.
-   [ ] Examples use the public API and realistic content.
-   [ ] Accessibility and browser support limits are stated.
-   [ ] A teammate can extend the work without copying implementation.

------------------------------------------------------------------------

## Browser support and compatibility

Treat modern browser features as progressive enhancements when the
project supports embedded webviews or older enterprise browsers. Verify
each feature against the actual support matrix rather than assuming a
current desktop browser represents all users. CSS custom properties,
container queries, `color-scheme`, and `:focus-visible` have broad
modern support, but the oldest supported Safari, Firefox, Chromium, and
embedded browser versions may differ. Use `@supports` for CSS
capabilities and preserve a useful baseline when an enhancement is
unavailable.

``` css
.component-preview { display: block; }
@supports (container-type: inline-size) {
  .component-preview { container-type: inline-size; }
  @container (max-width: 20rem) { .component-preview__details { display: block; } }
}
```

## Debugging sequence

1.  Reproduce the failure using a minimal representative consumer.
2.  Confirm the public API, token, theme, story data, or documentation
    source actually supplied.
3.  Inspect computed styles and DOM semantics in browser DevTools.
4.  Check console errors, failed assets, and build warnings.
5.  Test narrow and wide viewports and realistic content lengths.
6.  Run keyboard-only checks and inspect focus order.
7.  Verify the production build, not only the development server.
8.  Add a regression test for the exact failure mode.

``` js
function inspectSystemState(element, variables = []) {
  if (!(element instanceof Element)) throw new TypeError('Pass a rendered Element');
  const styles = getComputedStyle(element);
  console.table({ tag: element.tagName.toLowerCase(), role: element.getAttribute('role') || '(native)', tabIndex: element.tabIndex, width: element.getBoundingClientRect().width });
  const root = getComputedStyle(document.documentElement);
  console.table(variables.map(token => ({ token, value: root.getPropertyValue(token).trim() })));
}
```

## Gotchas

**Gotcha:** a source value can be correct while a generated output fails
because a transform expects another type or unit.

**Gotcha:** a visually correct component can remain inaccessible if
focus restoration, error announcements, or keyboard state is missing.

**Gotcha:** a theme applied to one DOM subtree may not reach an iframe,
portal, or third-party widget.

**Gotcha:** a story can work locally and fail in CI because it relies on
environment variables, network responses, font timing, or case-sensitive
paths.

## Success criteria

-   The source of truth is clear and duplicated decisions are
    intentional.
-   Public contracts are documented with realistic examples and
    alternatives.
-   Failure scenarios are tested and produce clear errors or safe
    fallbacks.
-   Keyboard, focus, semantic HTML, and relevant WCAG expectations are
    reviewed.
-   Browser and responsive constraints are explicit.
-   Changes can be released with a documented migration path.

## Advanced review notes

### Field note 1: Reviewing stories as reproducible fixtures

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Stories as reproducible fixtures</h1><p>A story declares a stable component state without requiring a live account, route, or backend.</p></section></main>;
}
```

### Field note 2: Reviewing args and controls

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Args and controls</h1><p>Controls should expose valid public options, not internal implementation details or contradictory combinations.</p></section></main>;
}
```

### Field note 3: Reviewing state matrix

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">State matrix</h1><p>Cover default, disabled, loading, long content, error, keyboard focus, and responsive placement rather than making many </p></section></main>;
}
```

### Field note 4: Reviewing interaction tests

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Interaction tests</h1><p>Use a play function to click, type, and assert the visible result. Test the user journey rather than mutating component </p></section></main>;
}
```

### Field note 5: Reviewing accessibility checks

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Accessibility checks</h1><p>Automated checks catch some missing names and contrast issues but cannot prove complete keyboard or screen-reader behavi</p></section></main>;
}
```

### Field note 6: Reviewing visual regression stability

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Visual regression stability</h1><p>Snapshots are useful only when fonts, data, viewport, animation, and time are deterministic. Review diffs instead of bli</p></section></main>;
}
```

### Field note 7: Reviewing decorators and providers

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Decorators and providers</h1><p>Provide minimal context such as theme, locale, or router without booting the full application for every story.</p></section></main>;
}
```

### Field note 8: Reviewing responsive viewports

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Responsive viewports</h1><p>Test widths where layout changes, including long text and zoom/reflow. Container size may matter more than viewport widt</p></section></main>;
}
```

### Field note 9: Reviewing mock network and time

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Mock network and time</h1><p>Live requests create flaky stories and can expose private data. Use fixed fixtures or request mocks.</p></section></main>;
}
```

### Field note 10: Reviewing documentation blocks

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Documentation blocks</h1><p>Explain intended use, required props, accessibility expectations, and alternatives. Keep snippets aligned with the publi</p></section></main>;
}
```

### Field note 11: Reviewing organization and naming

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Organization and naming</h1><p>Use component family and intent-based state names; ambiguous Example2 stories slow review.</p></section></main>;
}
```

### Field note 12: Reviewing ci release gates

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">CI release gates</h1><p>Run type checks, tests, and a production Storybook build in CI to catch missing imports and environment assumptions.</p></section></main>;
}
```

### Field note 13: Reviewing performance and isolation

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Performance and isolation</h1><p>Avoid importing the whole application into every story. Keep expensive demos separate so iteration remains fast.</p></section></main>;
}
```

### Field note 14: Reviewing integrated review set

When reviewing this part of `storybook-design-system`, ask whether the
example expresses a stable rule or only happens to work for the current
screenshot. Trace the decision from its source to the rendered result
and identify who owns future changes. If the same decision is repeated
in several places, determine whether the duplication is intentional,
generated, or accidental before refactoring it.

A useful review includes a normal case, a boundary case, and a failure
case. The normal case proves the intended path; the boundary case
exposes assumptions about width, state, missing content, or platform
support; the failure case proves invalid input cannot silently produce a
misleading result. Record expected outcomes before changing the
implementation so a test measures behaviour rather than confirming a
preferred code shape.

For a client handoff, include the reason for the decision in the
relevant component or system page. Do not make a maintainer infer the
rule from a clever selector or dense conditional. If the decision is
temporary, name the owner and condition for removing it. If it is
permanent, add it to the shared contract and protect it with a check.

``` tsx
export function ReviewCase() {
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Integrated review set</h1><p>Build a field and dialog story set including invalid data, loading, focus, narrow viewport, and a deterministic interact</p></section></main>;
}
```
