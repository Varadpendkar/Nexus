# SKILL: component-library-building

**Layer:** 21 --- Design Systems

**Goal:** Build reusable accessible UI components with stable APIs,
composition boundaries, tests, responsive behaviour, and release
discipline.

------------------------------------------------------------------------

## Why This Matters (Senior Perspective)

A component library fails when reuse means forcing every screen into one
oversized component. The result is a button with contradictory booleans,
a dialog without focus restoration, and form fields whose error
announcements differ between pages. Teams eventually copy components
locally because shared changes are too risky. Senior engineers define
the invariant behaviour first, then expose only meaningful variants and
composition points. Native semantics, keyboard behaviour, responsive
layout, and observable tests belong to the contract. Abstraction is not
automatically valuable: similar-looking cards may have different
interaction models and should not share a component merely to reduce
file count. For client work, a sound library speeds up delivery while
preserving quality across pages and future contributors.

------------------------------------------------------------------------

## Core Concepts

### 1. Boundaries and invariants

A component should own stable behaviour and leave page composition to
consumers. A button activates; a link navigates; a dialog has a name and
a close path.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
export function ActionButton({ children, variant = 'primary', ...props }) { return <button className={`button button--${variant}`} {...props}>{children}</button>; }
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

### 2. Variant APIs

Prefer named finite variants over multiple booleans that can conflict.
Types can make unsupported combinations impossible to express.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
type ButtonProps = { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean };
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

### 3. Composition over mega-components

Slots and children allow flexible content without embedding every
product-specific rule into the primitive.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function Card({ title, children, actions }) { return <article className="card"><header><h2>{title}</h2>{actions}</header><section>{children}</section></article>; }
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

### 4. Semantic HTML

Choose the native element that matches the job before adding ARIA. Form
controls need persistent labels and explicit error/help relationships.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<form><label htmlFor="work-email">Work email</label><input id="work-email" name="email" type="email" aria-describedby="email-help" /><p id="email-help">Used for account notices.</p></form>
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

### 5. State machines

Menus, dialogs, and async actions have distinct states and valid
transitions. Explicit state prevents closed-but-focus-trapped or
loading-but-submittable combinations.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
type SaveState = 'idle' | 'saving' | 'success' | 'error';
const canSave = (state: SaveState) => state === 'idle' || state === 'error';
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

### 6. Controlled versus uncontrolled fields

Choose the ownership model deliberately. Controlled inputs suit
synchronized validation; uncontrolled inputs can suit native form
submission. Do not switch modes after mount.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function SearchField({ value, onChange }) { return <label>Search<input value={value} onChange={e => onChange(e.target.value)} /></label>; }
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

### 7. Accessibility contract

Keyboard operation, focus visibility, accessible names, error messages,
and status announcements are part of a component's definition of done.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
.button:focus-visible, .text-field:focus-visible { outline: 3px solid var(--color-focus-ring); outline-offset: 2px; }
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

### 8. Container responsiveness

A component may live in a sidebar, modal, or grid cell. Respond to
available space rather than assuming the viewport breakpoint represents
the component's space.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
 .metric-card { container-type: inline-size; }
@container (max-width: 20rem) { .metric-card__details { display: block; } }
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

### 9. Styling contract

Expose variants, tokens, slots, and stable hooks. Deep internal
selectors create accidental APIs that are hard to change safely.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
 .button { background: var(--button-bg, var(--color-action-primary)); color: var(--button-fg, white); }
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

### 10. Observable tests

Test roles, labels, keyboard outcomes, and visible state changes instead
of private classes or implementation details.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
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

### 11. Dependency and bundle discipline

A small component should not pull unrelated heavy dependencies into
every consumer. Keep optional integrations separate and inspect built
output.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Declare React as a peer dependency in a React component package.
// Import the specific component entry point instead of a large feature barrel.
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

### 12. Versioning and migration

Consumers need predictable releases. Deprecate public APIs before
removal and provide a concrete replacement example.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
/** @deprecated Use `tone="warning"`; removal is scheduled for the next major release. */
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

### 13. Loading and error states

Async components should define waiting, success, empty, and failure
behaviour so each consumer does not invent a different experience.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function AsyncStatus({ status, message }) { if (status === 'loading') return <p role="status">Loading…</p>; if (status === 'error') return <p role="alert">{message}</p>; return null; }
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

### 14. Integrated library

Combine buttons, fields, cards, and dialogs with shared tokens and
tests. Integration exposes conflicts that isolated demos miss.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<section aria-labelledby="billing-title"><h2 id="billing-title">Billing details</h2><form><label htmlFor="billing-email">Email</label><input id="billing-email" type="email" required /><button type="submit">Save billing details</button></form></section>
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
| Page-level mega component | Reuse becomes conditional spaghetti | Separate page composition from stable primitives. |
| Conflicting boolean props | Invalid combinations are expressible | Model mutually exclusive variants as a discriminated union. |
| Clickable div | Native keyboard activation is absent | Use a native button for in-place actions. |
| Unnecessary ARIA role | Custom semantics conflict with HTML | Start with native elements and add only missing relationships. |
| Deep selector overrides | Internal DOM becomes an accidental API | Expose variants, tokens, slots, and stable hooks. |
| No async contract | Loading and error UX diverges | Define explicit loading, success, empty, and failure states. |
| Class-based assertions | Refactors break tests unnecessarily | Query by accessible role and name. |
| Field ownership switches | Value behaviour becomes unpredictable | Choose controlled or uncontrolled mode at initialization. |
| Heavy dependency in every primitive | Bundle cost grows for simple usage | Move optional integrations into separate entry points. |
| Dialog lacks focus tests | Keyboard focus escapes or is lost | Test initial focus, Tab cycling, Escape, and restoration. |
| Visual variants have no behaviour rules | Disabled/danger states remain ambiguous | Document semantics and interaction alongside appearance. |
| Page-breakpoint assumptions | Components fail in sidebars and modals | Use container-aware styling or a documented container contract. |
| Unannounced API break | Consumer apps fail after upgrades | Use semver, changelog entries, and migration examples. |
| Abstraction from one example | API captures accidental screen details | Compare several real consumers before freezing the contract. |

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

### Build: Production-ready Component Library Building Workbench

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

### Field note 1: Reviewing boundaries and invariants

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Boundaries and invariants</h1><p>A component should own stable behaviour and leave page composition to consumers. A button activates; a link navigates; a</p></section></main>;
}
```

### Field note 2: Reviewing variant apis

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Variant APIs</h1><p>Prefer named finite variants over multiple booleans that can conflict. Types can make unsupported combinations impossibl</p></section></main>;
}
```

### Field note 3: Reviewing composition over mega-components

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Composition over mega-components</h1><p>Slots and children allow flexible content without embedding every product-specific rule into the primitive.</p></section></main>;
}
```

### Field note 4: Reviewing semantic html

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Semantic HTML</h1><p>Choose the native element that matches the job before adding ARIA. Form controls need persistent labels and explicit err</p></section></main>;
}
```

### Field note 5: Reviewing state machines

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">State machines</h1><p>Menus, dialogs, and async actions have distinct states and valid transitions. Explicit state prevents closed-but-focus-t</p></section></main>;
}
```

### Field note 6: Reviewing controlled versus uncontrolled fields

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Controlled versus uncontrolled fields</h1><p>Choose the ownership model deliberately. Controlled inputs suit synchronized validation; uncontrolled inputs can suit na</p></section></main>;
}
```

### Field note 7: Reviewing accessibility contract

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Accessibility contract</h1><p>Keyboard operation, focus visibility, accessible names, error messages, and status announcements are part of a component</p></section></main>;
}
```

### Field note 8: Reviewing container responsiveness

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Container responsiveness</h1><p>A component may live in a sidebar, modal, or grid cell. Respond to available space rather than assuming the viewport bre</p></section></main>;
}
```

### Field note 9: Reviewing styling contract

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Styling contract</h1><p>Expose variants, tokens, slots, and stable hooks. Deep internal selectors create accidental APIs that are hard to change</p></section></main>;
}
```

### Field note 10: Reviewing observable tests

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Observable tests</h1><p>Test roles, labels, keyboard outcomes, and visible state changes instead of private classes or implementation details.</p></section></main>;
}
```

### Field note 11: Reviewing dependency and bundle discipline

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Dependency and bundle discipline</h1><p>A small component should not pull unrelated heavy dependencies into every consumer. Keep optional integrations separate </p></section></main>;
}
```

### Field note 12: Reviewing versioning and migration

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Versioning and migration</h1><p>Consumers need predictable releases. Deprecate public APIs before removal and provide a concrete replacement example.</p></section></main>;
}
```

### Field note 13: Reviewing loading and error states

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Loading and error states</h1><p>Async components should define waiting, success, empty, and failure behaviour so each consumer does not invent a differe</p></section></main>;
}
```

### Field note 14: Reviewing integrated library

When reviewing this part of `component-library-building`, ask whether
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Integrated library</h1><p>Combine buttons, fields, cards, and dialogs with shared tokens and tests. Integration exposes conflicts that isolated de</p></section></main>;
}
```
