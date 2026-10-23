# SKILL: theming-system-patterns

**Layer:** 21 --- Design Systems

**Goal:** Implement reliable runtime themes with semantic tokens, system
preference support, accessible controls, safe persistence, and
flash-resistant startup.

------------------------------------------------------------------------

## Why This Matters (Senior Perspective)

Theming failures are immediately visible: a dark page contains white
form controls, an overlay uses the wrong surface, or a saved preference
flashes the default palette before JavaScript runs. A theme is not a
body background toggle. It coordinates text, surfaces, borders, focus
rings, status colours, charts, native controls, overlays, and embedded
content. Senior engineers separate an explicit user choice from the
operating-system preference, apply a validated theme from one source of
truth, and test contrast in every palette. For freelance products, this
makes client branding and high-contrast modes controlled token changes
instead of a late search through component selectors.

------------------------------------------------------------------------

## Core Concepts

### 1. User choice versus system preference

A saved explicit choice should normally beat OS preference; system mode
follows `prefers-color-scheme`. Model system as its own choice.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const query = window.matchMedia('(prefers-color-scheme: dark)');
const initial = savedChoice === 'system' ? (query.matches ? 'dark' : 'light') : savedChoice;
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

### 2. Semantic theme maps

Override role tokens while components consume the same names. Avoid
separate component selectors for each theme.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { color-scheme: light; --surface-canvas: #fff; --text-primary: #171b26; }
[data-theme='dark'] { color-scheme: dark; --surface-canvas: #101522; --text-primary: #f3f5fa; }
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

### 3. Flash-resistant startup

Apply a validated preference before the first meaningful paint when
possible. Invalid storage and blocked storage must not break startup.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const allowed = ['light', 'dark', 'contrast'];
let theme = 'light'; try { const stored = localStorage.getItem('theme'); if (allowed.includes(stored)) theme = stored; } catch { /* CSS default remains usable. */ }
document.documentElement.dataset.theme = theme;
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

### 4. Accessible appearance picker

A three-way system/light/dark preference is not a boolean. Use a
labelled select or radio group and expose the selected value clearly.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<label for="appearance">Appearance</label><select id="appearance" name="appearance"><option value="system">Use device setting</option><option value="light">Light</option><option value="dark">Dark</option></select>
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

### 5. Reacting to OS changes

Subscribe to media-query changes only when the user choice is system. An
explicit preference must not be overwritten by an OS change.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function onPreferenceChange(event) { if (getThemeChoice() === 'system') applyTheme(event.matches ? 'dark' : 'light'); }
query.addEventListener('change', onPreferenceChange);
// Remove this listener when the owning app lifecycle ends.
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

### 6. Storage failure handling

Persistence is an enhancement, not a requirement for current-session
usability. Browser privacy settings can make storage throw.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function persistTheme(value) { if (!['system','light','dark'].includes(value)) throw Error('Unsupported theme'); try { localStorage.setItem('theme', value); } catch { /* Keep current session working. */ } }
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

### 7. Native controls and color-scheme

`color-scheme` informs browser-rendered controls; it does not replace
semantic component tokens or theme third-party widgets automatically.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
:root { color-scheme: light; }
[data-theme='dark'] { color-scheme: dark; }
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

### 8. Contrast and focus

Check text, disabled controls, borders, focus indicators, charts, and
status colours per theme. Dark palettes often fail on muted text and
subtle outlines.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
.field:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }
[data-theme='dark'] { --focus-ring: #a9c1ff; }
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

### 9. Theme transitions

Avoid animating every property globally. Long transitions can cause jank
and discomfort; keep optional transitions short and respect reduced
motion.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
@media (prefers-reduced-motion: no-preference) { html.theme-transitioning { transition: background-color 120ms linear, color 120ms linear; } }
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

### 10. Portals and embedded content

A modal portal or iframe may not inherit a theme applied to a nested
subtree. Define a theme boundary explicitly.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
<section data-theme="dark" aria-label="Analytics panel"><div id="chart-root"></div></section>
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

### 11. Theme registry

Keep theme IDs in a closed registry so arbitrary stored values cannot
produce unsupported attributes or broken styles.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const themes = new Set(['system', 'light', 'dark', 'contrast']);
function normalizeTheme(value) { return themes.has(value) ? value : 'system'; }
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

### 12. SSR and hydration

Server markup and client startup should agree when possible. Cookies or
an early bootstrap script can prevent a flash and hydration mismatch.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
// Server reads a theme cookie and emits <html data-theme="dark"> when available.
// Keep theme-dependent markup structurally stable before hydration.
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

### 13. Fallback and browser support

Feature-detect matchMedia and keep a valid default when an older webview
lacks a capability. Test the oldest supported Safari, Firefox, Chromium,
and embedded browser.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
const supportsPreference = typeof window.matchMedia === 'function';
const prefersDark = supportsPreference && window.matchMedia('(prefers-color-scheme: dark)').matches;
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

### 14. Integrated theme switcher

Combine early resolution, accessible selection, system updates,
persistence, semantic tokens, and a reload test. Clicking once is not
sufficient validation.

Senior practice means making this decision explicit in the shared system
rather than leaving it as tribal knowledge. Review the example as a
contract: a teammate should identify what is configurable, what remains
stable, and who owns future changes. Validate the happy path and at
least one boundary case before spreading the approach across screens.

``` tsx
function applyTheme(value) { document.documentElement.dataset.theme = value; }
function chooseTheme(value) { persistTheme(value); applyTheme(value === 'system' ? resolveSystemTheme() : value); }
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
| Only body background changes | Controls and panels keep the old palette | Map all semantic surface, text, border, focus, and status roles. |
| OS overrides explicit preference | User sees unexpected theme changes | Track system as a separate choice and subscribe conditionally. |
| Unvalidated stored theme | Unknown value produces missing styles | Validate stored IDs against a closed allowlist. |
| Theme applies after paint | Wrong palette flashes on load | Resolve from cookie or a small early bootstrap script. |
| Picker has no selected state | Current preference is unclear to assistive tech | Use a labelled native select/radio group with selection semantics. |
| Switch used for three choices | Control implies a boolean setting | Use a radio group or select for system/light/dark. |
| Only light contrast is tested | Dark muted text and focus rings disappear | Test every foreground/surface pairing in every theme. |
| Global transition on every property | Theme switch causes jank | Animate selected colour properties only and respect reduced motion. |
| Portal sits outside theme root | Dialog palette differs from page | Use a shared root theme or explicitly pass theme to portal surfaces. |
| Native controls mismatch | Browser UI retains wrong scheme | Set color-scheme and verify controls in target browsers. |
| Server/client theme disagreement | Hydration mismatch or flash appears | Share theme resolution through cookie or early initialization. |
| External theme string used directly | Unsupported IDs enter DOM attributes | Map external values to a fixed theme registry. |
| No matchMedia fallback | Older webview startup throws | Feature-detect matchMedia and keep a valid default palette. |
| No reset to system option | User cannot remove override | Expose System and clear the persisted override. |

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

### Build: Production-ready Theming System Patterns Workbench

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

### Field note 1: Reviewing user choice versus system preference

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">User choice versus system preference</h1><p>A saved explicit choice should normally beat OS preference; system mode follows `prefers-color-scheme`. Model system as </p></section></main>;
}
```

### Field note 2: Reviewing semantic theme maps

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Semantic theme maps</h1><p>Override role tokens while components consume the same names. Avoid separate component selectors for each theme.</p></section></main>;
}
```

### Field note 3: Reviewing flash-resistant startup

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Flash-resistant startup</h1><p>Apply a validated preference before the first meaningful paint when possible. Invalid storage and blocked storage must n</p></section></main>;
}
```

### Field note 4: Reviewing accessible appearance picker

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Accessible appearance picker</h1><p>A three-way system/light/dark preference is not a boolean. Use a labelled select or radio group and expose the selected </p></section></main>;
}
```

### Field note 5: Reviewing reacting to os changes

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Reacting to OS changes</h1><p>Subscribe to media-query changes only when the user choice is system. An explicit preference must not be overwritten by </p></section></main>;
}
```

### Field note 6: Reviewing storage failure handling

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Storage failure handling</h1><p>Persistence is an enhancement, not a requirement for current-session usability. Browser privacy settings can make storag</p></section></main>;
}
```

### Field note 7: Reviewing native controls and color-scheme

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Native controls and color-scheme</h1><p>`color-scheme` informs browser-rendered controls; it does not replace semantic component tokens or theme third-party wid</p></section></main>;
}
```

### Field note 8: Reviewing contrast and focus

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Contrast and focus</h1><p>Check text, disabled controls, borders, focus indicators, charts, and status colours per theme. Dark palettes often fail</p></section></main>;
}
```

### Field note 9: Reviewing theme transitions

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Theme transitions</h1><p>Avoid animating every property globally. Long transitions can cause jank and discomfort; keep optional transitions short</p></section></main>;
}
```

### Field note 10: Reviewing portals and embedded content

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Portals and embedded content</h1><p>A modal portal or iframe may not inherit a theme applied to a nested subtree. Define a theme boundary explicitly.</p></section></main>;
}
```

### Field note 11: Reviewing theme registry

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Theme registry</h1><p>Keep theme IDs in a closed registry so arbitrary stored values cannot produce unsupported attributes or broken styles.</p></section></main>;
}
```

### Field note 12: Reviewing ssr and hydration

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">SSR and hydration</h1><p>Server markup and client startup should agree when possible. Cookies or an early bootstrap script can prevent a flash an</p></section></main>;
}
```

### Field note 13: Reviewing fallback and browser support

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Fallback and browser support</h1><p>Feature-detect matchMedia and keep a valid default when an older webview lacks a capability. Test the oldest supported S</p></section></main>;
}
```

### Field note 14: Reviewing integrated theme switcher

When reviewing this part of `theming-system-patterns`, ask whether the
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
  return <main><section aria-labelledby="review-title"><h1 id="review-title">Integrated theme switcher</h1><p>Combine early resolution, accessible selection, system updates, persistence, semantic tokens, and a reload test. Clickin</p></section></main>;
}
```
