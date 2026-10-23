# SKILL: design-token-architecture

**Layer:** 21 --- Design Systems

**Goal:** Create a typed, traceable token architecture that separates
primitive values, semantic intent, and component contracts across themes
and outputs.

------------------------------------------------------------------------

## Why This Matters (Senior Perspective)

Token systems fail in ways that are expensive to repair: a brand refresh
leaves hard-coded colours in old screens, spacing values drift across
cards, and dark mode makes a chart label unreadable because its colour
was chosen independently of its surface. The root cause is not a
shortage of CSS variables. It is a lack of hierarchy, naming rules,
validation, and ownership. A senior developer models tokens as a
dependency graph and public API, not as a bag of constants. Primitive
values describe available palette and scale values; semantic tokens
express product intent; component tokens expose only the small set of
stable customisation points that consumers genuinely need. In freelance
and portfolio work, this separation makes a rebrand, a new theme, or a
responsive redesign a controlled change rather than a hunt through
dozens of files. Token output must be reproducible, accessibility
pairings must be testable, and deprecation must be planned before
consumers break.

------------------------------------------------------------------------

## Core Concepts

### 1. Primitive, semantic, and component layers

Raw values are ingredients; semantic aliases explain intent; component
tokens are narrow public contracts. Do not make every component consume
raw palette values.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const tokens = { primitive: { blue600: '#2457d6' }, semantic: { actionPrimary: '{primitive.blue600}' }, component: { buttonPrimaryBg: '{semantic.actionPrimary}' } };
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

### 2. Names are a public API

Consistent names support search, autocomplete, design-tool mapping, and
migration. Name roles such as text-primary rather than an incidental
visual value such as dark-grey.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { --color-action-primary: #2457d6; --color-text-on-action: #fff; --space-control-inline: 1rem; }
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

### 3. Alias graphs and cycle detection

References reduce duplication but require validation. A cycle or missing
alias should fail the build instead of yielding an empty CSS value.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function resolve(name, registry, stack = []) { if (stack.includes(name)) throw Error(`Cycle: ${[...stack, name].join(' -> ')}`); const v = registry[name]; if (v === undefined) throw Error(`Unknown token: ${name}`); const m = typeof v === 'string' && v.match(/^\{(.+)\}$/); return m ? resolve(m[1], registry, [...stack, name]) : v; }
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

### 4. Scale design

Spacing, type, radius, elevation, and motion scales should have
deliberate steps. Exceptions are fine when justified by optical or
interaction needs; arbitrary values everywhere destroy rhythm.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { --space-1: .25rem; --space-2: .5rem; --space-3: .75rem; --space-4: 1rem; --space-6: 1.5rem; --space-8: 2rem; }
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

### 5. Semantic colour roles

Define foreground, surface, border, action, feedback, and focus roles
separately. Test each intended foreground/background pairing instead of
assuming a colour is accessible everywhere.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { --color-text-primary: #171b26; --color-surface-canvas: #fff; --color-border-subtle: #d7dce5; --color-focus-ring: #2457d6; }
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

### 6. Typography as structured tokens

A type role includes size, line height, weight, family, and sometimes
tracking. Fluid ranges should be tested at narrow widths and browser
zoom.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { --type-body-size: clamp(1rem, .96rem + .2vw, 1.125rem); --type-body-line: 1.55; --type-display-size: clamp(2.5rem, 5vw, 4.5rem); }
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

### 7. Motion tokens and reduced motion

Motion tokens express feedback, emphasis, and transition character. A
central reduced-motion override prevents each component from inventing
its own accessibility exception.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { --motion-feedback: 120ms; --motion-panel: 220ms; --motion-ease-standard: cubic-bezier(.2,.7,.2,1); }
@media (prefers-reduced-motion: reduce) { :root { --motion-feedback: 0ms; --motion-panel: 0ms; } }
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

### 8. Canonical source and generated outputs

Choose one source that generates CSS, TypeScript, JSON, and
tool-specific exports. Manually editing generated output creates drift
and makes releases non-reproducible.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// package script: "tokens:build": "style-dictionary build --config style-dictionary.config.json"
// CI regenerates output and fails if generated files are stale.
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

### 9. Type and schema validation

Types prevent a duration from being consumed as a colour. Validate
names, required metadata, allowed value syntax, and references before
output generation.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
type Token = { type: 'color' | 'dimension' | 'duration'; value: string; description: string };
function validate(token: Token) { if (!token.description.trim()) throw Error('Description required'); if (token.type === 'color' && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(token.value)) throw Error('Invalid hex colour'); }
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

### 10. Deprecation and migration

Token removal affects all consumers. Mark the old name, name the
replacement, define the removal release, and search usage before
deleting it.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
/** @deprecated Use color.action.primary; remove in the next major token release. */
export const legacyBrandBlue = '#2457d6';
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

### 11. Platform transforms

Shared meaning can have different output units. Keep semantic identity
stable while transforming web rem values, native dimensions, or
design-tool formats at the boundary.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const token = { name: 'space.control', semanticValue: 16 };
const webOutput = '1rem'; const nativeOutput = token.semanticValue;
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

### 12. Contrast contracts

Record intended text/surface pairings and thresholds. Automated checks
help catch regressions, but focus visibility, state differentiation, and
non-text contrast still need review.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const pairs = [{ name: 'body-on-canvas', fg: '#171b26', bg: '#ffffff', min: 4.5 }];
// Run a WCAG contrast calculation for every registered pair during CI.
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

### 13. Runtime inspection

Clear CSS variable names make DevTools useful for tracing a rendered
value back to the system. Debug the computed output as well as the token
source.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const styles = getComputedStyle(document.documentElement);
console.table(['--color-text-primary', '--color-surface-canvas', '--space-4'].map(token => ({ token, value: styles.getPropertyValue(token).trim() })));
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

### 14. Integrated token rollout

Migrate a representative page before converting the entire application.
Include forms, overlays, charts, dark surfaces, and long responsive
headings to reveal missing roles early.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
/* Before */ .legacy-card { padding: 23px; border-color: #d5dbe4; }
/* After */ .project-card { padding: var(--space-6); border-color: var(--color-border-subtle); }
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
| Naming colours by hue | Palette details leak into application logic | Expose semantic aliases such as --color-action-primary. |
| Component token for every declaration | The registry becomes ungovernable | Create component tokens only for supported customization contracts. |
| Alias cycle | Reference resolution cannot terminate | Run depth-first cycle detection before output generation. |
| Manual edits to generated CSS | Canonical data and output diverge | Regenerate outputs in CI and fail on a non-empty diff. |
| Silent semantic change | Consumers change appearance unexpectedly | Version semantic changes and publish migration notes. |
| One neutral for every surface | Surface hierarchy disappears | Define canvas, raised, overlay, and sunken roles. |
| No contrast pair tests | Readable combinations are assumed | Run WCAG contrast checks on registered foreground/background pairs. |
| Fixed display sizes | Headlines overflow on small screens | Use tested clamp() ranges and validate zoom/reflow. |
| Unlimited spacing values | Visual rhythm becomes inconsistent | Adopt a bounded scale and document exceptions. |
| Immediate alias deletion | Consumers break without warning | Keep deprecated aliases for the planned migration window. |
| Ambiguous token abbreviations | Intent cannot be inferred | Use consistent role, component, and state names. |
| Mixed units without transform policy | Values are hard to compare across platforms | Normalize units in target-specific output transforms. |
| Stale token documentation | Designers keep selecting retired values | Generate reference pages from the canonical registry. |
| Missing ownership metadata | No team owns cleanup or changes | Require owner, description, type, and lifecycle status. |

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

### Build: Production-ready Design Token Architecture Workbench

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

### Field note 1: Reviewing primitive, semantic, and component layers

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Primitive, semantic, and component layers</h1><p>Raw values are ingredients; semantic aliases explain intent; component tokens are narrow public contracts. Do not make e</p></section></main>;
}
```

### Field note 2: Reviewing names are a public api

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Names are a public API</h1><p>Consistent names support search, autocomplete, design-tool mapping, and migration. Name roles such as text-primary rathe</p></section></main>;
}
```

### Field note 3: Reviewing alias graphs and cycle detection

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Alias graphs and cycle detection</h1><p>References reduce duplication but require validation. A cycle or missing alias should fail the build instead of yielding</p></section></main>;
}
```

### Field note 4: Reviewing scale design

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Scale design</h1><p>Spacing, type, radius, elevation, and motion scales should have deliberate steps. Exceptions are fine when justified by </p></section></main>;
}
```

### Field note 5: Reviewing semantic colour roles

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Semantic colour roles</h1><p>Define foreground, surface, border, action, feedback, and focus roles separately. Test each intended foreground/backgrou</p></section></main>;
}
```

### Field note 6: Reviewing typography as structured tokens

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Typography as structured tokens</h1><p>A type role includes size, line height, weight, family, and sometimes tracking. Fluid ranges should be tested at narrow </p></section></main>;
}
```

### Field note 7: Reviewing motion tokens and reduced motion

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Motion tokens and reduced motion</h1><p>Motion tokens express feedback, emphasis, and transition character. A central reduced-motion override prevents each comp</p></section></main>;
}
```

### Field note 8: Reviewing canonical source and generated outputs

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Canonical source and generated outputs</h1><p>Choose one source that generates CSS, TypeScript, JSON, and tool-specific exports. Manually editing generated output cre</p></section></main>;
}
```

### Field note 9: Reviewing type and schema validation

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Type and schema validation</h1><p>Types prevent a duration from being consumed as a colour. Validate names, required metadata, allowed value syntax, and r</p></section></main>;
}
```

### Field note 10: Reviewing deprecation and migration

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Deprecation and migration</h1><p>Token removal affects all consumers. Mark the old name, name the replacement, define the removal release, and search usa</p></section></main>;
}
```

### Field note 11: Reviewing platform transforms

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Platform transforms</h1><p>Shared meaning can have different output units. Keep semantic identity stable while transforming web rem values, native </p></section></main>;
}
```

### Field note 12: Reviewing contrast contracts

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Contrast contracts</h1><p>Record intended text/surface pairings and thresholds. Automated checks help catch regressions, but focus visibility, sta</p></section></main>;
}
```

### Field note 13: Reviewing runtime inspection

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Runtime inspection</h1><p>Clear CSS variable names make DevTools useful for tracing a rendered value back to the system. Debug the computed output</p></section></main>;
}
```

### Field note 14: Reviewing integrated token rollout

When reviewing this part of `design-token-architecture`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Integrated token rollout</h1><p>Migrate a representative page before converting the entire application. Include forms, overlays, charts, dark surfaces, </p></section></main>;
}
```
