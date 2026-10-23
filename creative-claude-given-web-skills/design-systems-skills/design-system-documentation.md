# SKILL: design-system-documentation

**Layer:** 21 --- Design Systems

**Goal:** Write maintainable system documentation that explains
component intent, token usage, accessibility contracts, examples,
governance, and migrations.

------------------------------------------------------------------------

## Why This Matters (Senior Perspective)

Documentation fails when it explains appearance but not selection. Teams
use destructive buttons for harmless actions, choose dialogs for long
forms, or copy stale snippets that no longer compile. In distributed
teams, ambiguity creates competing design systems even when everyone
imports the same package. Senior documentation is part of the public
API: it states when to use a component, when not to use it, shows
working examples, documents accessibility and responsive constraints,
and explains migration. Generated reference data helps prevent drift,
while human guidance is still needed for decisions that cannot be
inferred from props. For freelance handoff, this makes the client able
to maintain and extend the system without relying on the original
author.

------------------------------------------------------------------------

## Core Concepts

### 1. Audience and information architecture

Organize around user tasks and component families, not just repository
folders. Designers, developers, and maintainers need connected but
distinct paths.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<nav aria-label="Design system"><ul><li><a href="#foundations">Foundations</a></li><li><a href="#components">Components</a></li><li><a href="#patterns">Patterns</a></li><li><a href="#governance">Governance</a></li></ul></nav>
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

### 2. Selection guidance

State when to use a component, when to avoid it, and what alternative
fits nearby cases.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
## Button vs link
- Use a button to perform an in-place action.
- Use a link to navigate to a destination.
- Do not use a button with a fake href to represent navigation.
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

### 3. Runnable snippets

Include imports, required props, accessible labels, and realistic
content so examples can be copied and tested.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
import { ActionButton } from '@studio/ui';
export function SaveAction() { return <ActionButton type="submit" variant="primary">Save changes</ActionButton>; }
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

### 4. Token reference

Document meaning, intended use, allowed pairings, and deprecation---not
just raw colour values.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
| Token | Meaning | Use |
|---|---|---|
| `--color-text-primary` | Main content text | Approved surfaces |
| `--color-focus-ring` | Keyboard focus indicator | Focusable controls and links |
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

### 5. Accessibility contracts

Describe keyboard operation, accessible naming, focus movement, status
announcements, and relevant WCAG expectations as observable behaviours.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
### Dialog checklist
- Has an accessible name.
- Moves focus appropriately when opened.
- Keeps focus within the modal while open.
- Escape closes when dismissal is allowed.
- Returns focus to the opener.
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

### 6. Do and don't examples

Contrast plausible misuse with correct use and explain the user or
maintenance consequence.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Avoid a link with no destination that only looks like a button.
// Prefer <a href="/billing">View billing</a> for navigation.
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

### 7. Version and changelog

Explain affected versions, replacement API, and migration steps for
breaking changes.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
## Deprecated: `tone="alert"`
Use `tone="danger"`. The old value remains supported until the announced major release.
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

### 8. Ownership and contribution

Every page needs a maintenance owner and a way to report inaccuracies.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<section id="governance" aria-labelledby="owner-title"><h2 id="owner-title">Ownership</h2><p>Maintainer: UI Platform. Report inaccuracies using the documentation issue template.</p></section>
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

### 9. Search and aliases

Index common terms users actually search for, including synonyms and
task phrases.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const aliases = { dialog: ['modal', 'confirmation', 'overlay'], field: ['input', 'validation', 'form control'] };
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

### 10. Realistic content

Use realistic labels and long strings so examples expose overflow and
localization problems.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<article className="profile-card"><h2>Alexandra de la Cruz-Mendoza</h2><p>Senior Product Designer, International Payments</p></article>
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

### 11. Documentation tests

Treat examples and links as code: build the site, validate links, and
type-check examples where practical.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// CI can run docs build, link checks, example type checks, and accessibility smoke tests.
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

### 12. Governance lifecycle

Define proposal, review, accepted, deprecated, and removed states so
experimental patterns do not become permanent by accident.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
type ProposalStatus = 'draft' | 'review' | 'accepted' | 'deprecated' | 'removed';
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

### 13. Localization and RTL

Explain zoom, reflow, translated labels, writing direction, and
accessible names. Translated text often exceeds the length of English
examples.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<button type="button" aria-label="Close dialog">×</button>
/* Localize visible labels and accessible names together. */
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

### 14. Integrated documentation page

A complete page combines intent, examples, variants, accessibility,
responsive behaviour, related components, ownership, and migration
notes.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<main><header><h1>Text field</h1><p>Collect a single line of user input with a persistent label.</p></header><section><h2>When to use</h2><p>Use for short values such as email or project name.</p></section></main>
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
| Appearance only is documented | Consumers cannot choose the right component | Add use/avoid guidance and link the nearest alternative. |
| Snippet omits imports | Copied code fails immediately | Include package imports and all required props. |
| Accessibility claim is vague | Keyboard and focus expectations remain unknown | Document observable naming, focus, and announcement behaviour. |
| Stale prop remains in snippet | Users copy removed APIs | Compile examples and update docs with each API change. |
| Token list contains only hex values | Meaning and constraints are missing | Document semantic role, approved surfaces, and lifecycle status. |
| No owner is named | Corrections have no accountable maintainer | Assign a team or role and provide a feedback route. |
| Navigation mirrors source folders | Task-based discovery is difficult | Organize by foundations, components, patterns, and workflows. |
| Placeholder copy hides overflow | Long labels and translations break layouts | Include realistic and worst-case content. |
| No breaking-change migration | Consumers guess at replacements | State affected versions, replacement API, and removal timeline. |
| Search indexes official names only | Common synonyms return no results | Index aliases such as modal/dialog and input/field. |
| Do/don’t lacks rationale | Rules feel arbitrary | Explain the user or maintenance cost of misuse. |
| Docs build is not tested | Broken links and imports ship unnoticed | Add link checking and a clean production docs build. |
| RTL and localization omitted | Direction and translated labels break layouts | Document logical properties and translated accessible names. |
| No governance lifecycle | Experiments become permanent accidentally | Define draft, review, accepted, deprecated, and removed states. |

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

### Build: Production-ready Design System Documentation Workbench

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

### Field note 1: Reviewing audience and information architecture

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Audience and information architecture</h1><p>Organize around user tasks and component families, not just repository folders. Designers, developers, and maintainers n</p></section></main>;
}
```

### Field note 2: Reviewing selection guidance

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Selection guidance</h1><p>State when to use a component, when to avoid it, and what alternative fits nearby cases.</p></section></main>;
}
```

### Field note 3: Reviewing runnable snippets

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Runnable snippets</h1><p>Include imports, required props, accessible labels, and realistic content so examples can be copied and tested.</p></section></main>;
}
```

### Field note 4: Reviewing token reference

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Token reference</h1><p>Document meaning, intended use, allowed pairings, and deprecation—not just raw colour values.</p></section></main>;
}
```

### Field note 5: Reviewing accessibility contracts

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Accessibility contracts</h1><p>Describe keyboard operation, accessible naming, focus movement, status announcements, and relevant WCAG expectations as </p></section></main>;
}
```

### Field note 6: Reviewing do and don't examples

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Do and don't examples</h1><p>Contrast plausible misuse with correct use and explain the user or maintenance consequence.</p></section></main>;
}
```

### Field note 7: Reviewing version and changelog

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Version and changelog</h1><p>Explain affected versions, replacement API, and migration steps for breaking changes.</p></section></main>;
}
```

### Field note 8: Reviewing ownership and contribution

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Ownership and contribution</h1><p>Every page needs a maintenance owner and a way to report inaccuracies.</p></section></main>;
}
```

### Field note 9: Reviewing search and aliases

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Search and aliases</h1><p>Index common terms users actually search for, including synonyms and task phrases.</p></section></main>;
}
```

### Field note 10: Reviewing realistic content

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Realistic content</h1><p>Use realistic labels and long strings so examples expose overflow and localization problems.</p></section></main>;
}
```

### Field note 11: Reviewing documentation tests

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Documentation tests</h1><p>Treat examples and links as code: build the site, validate links, and type-check examples where practical.</p></section></main>;
}
```

### Field note 12: Reviewing governance lifecycle

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Governance lifecycle</h1><p>Define proposal, review, accepted, deprecated, and removed states so experimental patterns do not become permanent by ac</p></section></main>;
}
```

### Field note 13: Reviewing localization and rtl

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Localization and RTL</h1><p>Explain zoom, reflow, translated labels, writing direction, and accessible names. Translated text often exceeds the leng</p></section></main>;
}
```

### Field note 14: Reviewing integrated documentation page

When reviewing this part of `design-system-documentation`, ask whether
the example expresses a stable rule or only happens to work for the
current screenshot. Trace the decision from its source to the rendered
result and identify who owns future changes. If the same decision is
repeated in several places, determine whether the duplication is
intentional, generated, or accidental before refactoring it.

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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Integrated documentation page</h1><p>A complete page combines intent, examples, variants, accessibility, responsive behaviour, related components, ownership,</p></section></main>;
}
```
