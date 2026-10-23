# SKILL: css-container-queries-deep

## Layer
01 — CSS Foundation

## Goal
Design component-responsive interfaces with CSS container queries, container-relative units, robust fallback behavior, and clear rules for when a component should respond to its available space rather than the viewport.

## Why This Matters (Senior Perspective)

Viewport media queries answer questions about the browser window. Real interfaces are assembled from reusable components that may appear in a wide page column, a narrow sidebar, a modal, a dashboard tile, or a nested layout. The same component can have different space constraints without the viewport changing. Container queries let a component adapt to the size or style of an ancestor container, making component behavior more reusable and less dependent on page-level assumptions.

Senior-level use is not “replace every media query with a container query.” Choose the right responsive input. Use media queries for viewport-wide conditions, device preferences, and environment-level changes. Use container queries when a component's layout depends on the space allocated to it. Establish containment intentionally, avoid accidental query-container boundaries, and test nested components, intrinsic sizing, fallback behavior, and browser support.

A good container-query system is documented as part of the component contract: what container it expects, which axis it queries, which thresholds switch the layout, whether units are relative to the container, and how it behaves when the query feature is unavailable.

## Core Concepts

### 1. The difference between viewport and component responsiveness

A viewport media query responds to the viewport:

```css
@media (min-width: 60rem) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

A container query responds to a query container's dimensions:

```css
.product-card-container {
  container-type: inline-size;
}

@container (min-width: 32rem) {
  .product-card {
    display: grid;
    grid-template-columns: 8rem 1fr;
  }
}
```

Use the viewport when the whole page should change. Use the container when the component should change based on the space it actually receives.

**Gotcha:** A 1200px viewport does not guarantee that a card has 1200px available. Sidebars, gutters, nested grids, and dialogs can make its actual width much smaller.

### 2. Establishing a query container

The `container-type` property establishes a query container for size queries. `inline-size` is common when a component needs to respond to its available inline width.

```css
.card-region {
  container-type: inline-size;
}
```

The query applies to descendants, not the container element itself. This separation is important: one element establishes the query context and its children respond to it.

**Gotcha:** You cannot use a size query to style the same element based on its own size using that element as its query container. Put the query container on a wrapper and query a descendant.

### 3. `container-type: inline-size`

`inline-size` enables querying the container's inline dimension and introduces the containment behavior needed for size queries on that axis.

```css
.story-container {
  container-type: inline-size;
}
```

This is usually the most practical default for card layouts because the layout change often depends on available width. It can affect intrinsic sizing, so test how the container participates in grid and flex layouts.

### 4. `container-type: size`

`size` enables querying both inline and block dimensions, but it applies stronger size containment behavior. The container's size contribution may no longer be determined by its contents in the same way.

```css
.panel-container {
  container-type: size;
  width: 20rem;
  height: 18rem;
}
```

Use it only when both axes genuinely matter and the container's dimensions can be established safely. For ordinary card layouts, `inline-size` is generally simpler.

**Gotcha:** Using `size` without a deliberate sizing strategy can cause a container to collapse or behave unexpectedly because its content no longer determines its intrinsic size as usual.

### 5. Named containers

Named containers make a component's dependency explicit and prevent an unrelated nearer container from accidentally satisfying a query.

```css
.product-card-region {
  container: product-card / inline-size;
}

@container product-card (min-width: 34rem) {
  .product-card {
    grid-template-columns: 10rem 1fr;
  }
}
```

Names are especially useful in deeply nested applications where a component may be inside multiple query containers. Use clear, stable names that describe the contract rather than a temporary page location.

### 6. Container query syntax

A size query can use a range condition:

```css
@container (width >= 32rem) {
  .card__body {
    padding: 1.5rem;
  }
}
```

You may also see the traditional `min-width` form:

```css
@container (min-width: 32rem) {
  .card__body {
    padding: 1.5rem;
  }
}
```

Use syntax supported by the project's target browsers and keep the team's style consistent. Range syntax can make bounds explicit, while `min-width` may be more familiar.

### 7. Inline size versus physical width

`inline-size` follows the writing mode's inline axis; `width` is a physical horizontal dimension. In common horizontal writing modes they often correspond, but they are not conceptually identical.

```css
@container (inline-size >= 32rem) {
  .card__body {
    display: grid;
  }
}
```

Prefer logical dimensions for writing-mode-aware systems. If the product only supports horizontal writing modes, physical width can still be understandable, but consistency matters.

### 8. Querying the block axis

Block-axis size queries require a container that supports the relevant dimension and a layout whose block size is meaningfully established.

```css
.panel-region {
  container-type: size;
  inline-size: 24rem;
  block-size: 20rem;
}

@container (block-size >= 16rem) {
  .panel__details {
    display: block;
  }
}
```

Block-size queries are less common for ordinary content cards because content often determines height. Use them for constrained panels, media frames, or other components with known block-size behavior.

**Gotcha:** Querying a content-driven height can be conceptually circular or unreliable for the intended design. Define the sizing contract first and avoid relying on a descendant's content to create the condition that is supposed to change that content.

### 9. Container names and nearest eligible ancestor

A named query looks for an eligible ancestor with the specified container name and the required container type. A closer container of another name does not automatically replace the named target.

```css
.page-region {
  container: page-layout / inline-size;
}

.card-region {
  container: card-layout / inline-size;
}

@container page-layout (min-width: 60rem) {
  .dashboard-widget {
    --widget-gap: 1.5rem;
  }
}
```

Use names to reduce ambiguity. Avoid creating multiple same-named containers in nested scopes unless the nearest matching ancestor is intentionally the desired query target.

### 10. Container-relative units

Container query units scale values relative to a query container. Common units include `cqw`, `cqh`, `cqi`, `cqb`, `cqmin`, and `cqmax`.

```css
.card__title {
  font-size: clamp(1.1rem, 3cqi, 2rem);
}
```

`cqi` is relative to the query container's inline size and is often useful for component-level typography and spacing. Choose units that match the dimension the design intends to track.

### 11. The fallback behavior of container units

If no eligible query container exists for a container query unit, the unit falls back to the small viewport size for its corresponding axis rather than becoming zero.

```css
.widget__title {
  font-size: clamp(1rem, 2cqi, 1.75rem);
}
```

That fallback can produce a value that surprises you if the component is not inside the expected container. Establish the container contract and test the component both in its intended context and in isolated previews.

**Gotcha:** A component previewed outside its normal wrapper can still render, but its container units may be driven by viewport dimensions. Include the wrapper in storybook or component test fixtures.

### 12. Container units versus percentages

Percentages depend on the containing block and the property's sizing rules. Container units depend on the relevant query container dimension. They are not interchangeable.

```css
.card__media {
  inline-size: 100%;
}

.card__title {
  font-size: clamp(1rem, 2.4cqi, 1.8rem);
}
```

Use percentages for sizing relationships that follow the containing block. Use container units for values that should scale with the component's query container. Be explicit about which ancestor controls each value.

### 13. Combining container units with `clamp()`

`clamp()` can limit container-relative values to readable or practical bounds.

```css
.card__title {
  font-size: clamp(1.125rem, 2.8cqi, 2rem);
}

.card {
  padding: clamp(1rem, 3cqi, 2rem);
}
```

The minimum protects small layouts, the fluid term responds to available space, and the maximum prevents excessive growth. Validate the actual range across the component's expected sizes.

**Gotcha:** If the minimum and maximum are too close, the fluid term may have little visible effect. If they are too far apart, the component may become cramped at one end and oversized at the other.

### 14. Style queries

Container style queries can conditionally apply descendant styles based on supported style features or custom properties on a query container.

```css
.theme-region {
  --surface-mode: quiet;
  container-type: inline-size;
}

@container style(--surface-mode: quiet) {
  .notice {
    border-inline-start: 3px solid var(--color-accent);
  }
}
```

Style query support and the range of supported conditions vary across implementations. Use style queries only after checking the target browser matrix. For broad compatibility, explicit theme or modifier classes remain a practical alternative.

### 15. Custom properties as component configuration

Custom properties can expose a component's configuration to descendants and support clear component contracts.

```css
.card-region {
  --card-density: comfortable;
  container-type: inline-size;
}

.card {
  padding: var(--card-padding, 1rem);
}
```

A custom property by itself does not automatically change layout. Pair it with normal CSS rules, style queries where supported, or an explicit modifier class. Keep configuration values documented and avoid using custom properties as an undocumented state machine.

### 16. Container queries and media queries together

A responsive component often needs both kinds of queries:

```css
@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}

@container product-card (min-width: 34rem) {
  .card__layout {
    grid-template-columns: 9rem 1fr;
  }
}
```

Use container queries for allocated component space and media queries for environment-level features such as reduced motion, color scheme, or viewport-wide navigation changes.

**Gotcha:** Do not migrate `prefers-reduced-motion`, `hover`, `pointer`, or viewport-level decisions into container queries. They describe the user's environment, not the component's available size.

### 17. Container queries and grid

Grid is a natural partner for container queries because components often occupy different tracks in different parent layouts.

```css
.metric-region {
  container: metric / inline-size;
}

.metric {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@container metric (min-width: 28rem) {
  .metric {
    grid-template-columns: auto 1fr;
    align-items: center;
  }
}
```

The grid adapts to the width allocated to the metric region rather than guessing based on viewport breakpoints. Test the minimum width at which labels and values still fit.

### 18. Container queries and flexbox

A flex item may be constrained by sibling items, gaps, min-content sizes, and its parent. Container queries can respond to the resulting component width, but they do not eliminate intrinsic sizing issues.

```css
.toolbar-item-region {
  container-type: inline-size;
  min-inline-size: 0;
}

@container (min-width: 22rem) {
  .toolbar-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
}
```

When a flex child refuses to shrink, inspect `min-width: auto` behavior and consider `min-inline-size: 0` where appropriate. Do not use a query threshold to hide an unresolved overflow problem.

### 19. Intrinsic sizing and containment

Size containment can affect how a container contributes to its parent's intrinsic sizing. Grid and flex layouts are particularly worth testing because their sizing algorithms account for min-content and max-content contributions.

```css
.card-region {
  container-type: inline-size;
  min-inline-size: 0;
}
```

Check the container in narrow tracks, long-content states, and when sibling elements compete for space. The container should have a predictable sizing relationship with its parent.

### 20. Preventing layout shifts

A query changes layout when a threshold is crossed. That can be intentional, but abrupt changes may shift content or change reading order visually.

Use stable DOM order, sensible thresholds, and gradual values where appropriate. Keep the same semantic sequence across variants whenever possible.

**Gotcha:** CSS visual reordering does not change the document's reading order or keyboard focus order. Do not use container queries to create a visual sequence that contradicts the semantic DOM sequence.

### 21. Thresholds should come from content constraints

Choose breakpoints by testing the component's content, not by copying popular device widths. A card may need a horizontal layout at 34rem because its image, text, and action fit there; another card may need a different threshold.

Document the reason for each threshold. Test just below, at, and just above it, as well as the smallest and largest supported widths.

### 22. Container queries in reusable component libraries

A component library should document the container type and optional name expected by each component. Avoid assuming every component sits directly inside the page grid.

```css
/* Component contract: parent establishes inline-size container. */
.profile-card-region {
  container: profile-card / inline-size;
}

@container profile-card (min-width: 30rem) {
  .profile-card {
    grid-template-columns: 5rem 1fr;
  }
}
```

If a component requires a container, include the wrapper in examples, stories, and tests. Alternatively, provide a reasonable base layout that remains usable without the query enhancement.

### 23. Nested containers

Nested containers enable different levels of adaptation: a page section can respond to its allocated width while a card within it responds to its own region.

```css
.dashboard-region {
  container: dashboard / inline-size;
}

.widget-region {
  container: widget / inline-size;
}
```

Name containers according to their responsibility. Test nested instances carefully; an unqualified query may use a nearer eligible ancestor than you expected.

**Gotcha:** A component nested inside another instance of the same component can accidentally respond to the inner container if the names and structure are not designed intentionally.

### 24. Fallbacks for browsers without container query support

Base styles should be usable without container queries. Treat the query variant as progressive enhancement when the supported browser matrix requires it.

```css
.card {
  display: block;
}

@supports (container-type: inline-size) {
  .card-region {
    container-type: inline-size;
  }

  @container (min-width: 32rem) {
    .card {
      display: grid;
      grid-template-columns: 8rem 1fr;
    }
  }
}
```

The `@supports` check can help guard the enhancement, but verify support for the actual features and syntax you use. Do not make the base component unusable if the enhancement does not apply.

### 25. Avoiding duplicated CSS

A common failure mode is maintaining one complete layout for media queries and another complete layout for container queries. Instead, keep the base styles shared and change only the properties that genuinely differ at the threshold.

```css
.card {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@container (min-width: 32rem) {
  .card {
    grid-template-columns: 8rem 1fr;
  }
}
```

This reduces drift and makes responsive behavior easier to review. If many properties change together, consider a clear component variant or a more explicit layout abstraction.

### 26. Accessibility across query states

All query variants must preserve readable text, logical focus order, visible focus, sufficient target sizes, and content availability. Do not hide essential actions solely because a container is narrow.

```css
@container (max-width: 20rem) {
  .card__secondary-action {
    /* Prefer wrapping or a compact label before hiding an essential action. */
  }
}
```

Test keyboard navigation and zoom at every meaningful component width. Ensure that layout changes do not make focus jump visually or create clipped controls.

### 27. Container queries and typography

Container units can help type respond to component width, but text needs readable minimum and maximum sizes.

```css
.article-card__title {
  font-size: clamp(1.125rem, 2.5cqi, 1.75rem);
  line-height: 1.2;
}
```

Test long titles, localization, user text scaling, and narrow containers. Do not use container-relative typography when fixed responsive steps or normal wrapping better serve readability.

### 28. Container query units in spacing and geometry

Container-relative units can scale internal padding or gaps when a component has a wide range of sizes.

```css
.card {
  padding: clamp(0.875rem, 2.5cqi, 2rem);
  gap: clamp(0.75rem, 1.8cqi, 1.5rem);
}
```

Use them sparingly. A component that is too small may need a discrete layout change rather than continually shrinking every spacing value.

### 29. Debugging container queries

When a query does not apply:
1. Inspect which ancestor establishes `container-type`.
2. Confirm the query container is an ancestor of the target element.
3. Check the container's computed inline or block size.
4. Check named-container resolution and nearest eligible ancestor.
5. Confirm the threshold units and comparison.
6. Check whether containment changes intrinsic sizing.
7. Inspect the base declaration and cascade.
8. Verify browser support for the exact syntax.
9. Check container-unit fallback behavior.
10. Test the component in its real parent layout and in an isolated fixture.

**Gotcha:** A query may be valid but never match because the intended container is too narrow or because the target element is not a descendant of the container you configured.

### 30. A production container-query contract

For every responsive component, document:
- The wrapper that establishes the container.
- Whether it queries inline size, block size, or style.
- The container name, if needed.
- Thresholds and the content constraint behind them.
- Which properties change at each threshold.
- Whether container-relative units are used.
- Fallback behavior for unsupported browsers or missing wrappers.
- Accessibility and overflow checks across variants.

This turns container queries from hidden magic into a maintainable part of the component API.

## Reusable Patterns

### Pattern 1 — Responsive card wrapper

```css
.product-region {
  container: product / inline-size;
}

.product-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@container product (min-width: 34rem) {
  .product-card {
    grid-template-columns: 9rem minmax(0, 1fr);
    align-items: start;
  }
}
```

Use when the same card appears in full-width sections, sidebars, and dialogs. The wrapper provides the query context and the card responds to allocated width.

### Pattern 2 — Named dashboard widget

```css
.widget-region {
  container: widget / inline-size;
}

.widget {
  display: grid;
  gap: 0.75rem;
}

@container widget (min-width: 28rem) {
  .widget {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }
}
```

A named container avoids ambiguity in nested dashboards. Choose the threshold based on the actual label and metric lengths.

### Pattern 3 — Fluid component heading

```css
.card-region {
  container-type: inline-size;
}

.card__title {
  font-size: clamp(1.125rem, 2.7cqi, 1.875rem);
  line-height: 1.2;
}
```

Use when the heading should scale with the component, not the viewport. Check that the container wrapper exists in previews and tests.

### Pattern 4 — Container-aware padding

```css
.panel-region {
  container-type: inline-size;
}

.panel {
  padding: clamp(0.875rem, 3cqi, 2rem);
}
```

This keeps padding proportional within limits. If the panel becomes extremely narrow, use a layout variant rather than letting every dimension collapse.

### Pattern 5 — Nested named containers

```css
.dashboard-region {
  container: dashboard / inline-size;
}

.chart-region {
  container: chart / inline-size;
}

@container dashboard (min-width: 60rem) {
  .dashboard__toolbar {
    gap: 1.5rem;
  }
}

@container chart (min-width: 30rem) {
  .chart__legend {
    display: flex;
  }
}
```

Use each container for a distinct responsibility. Avoid reusing a generic name when different ancestors should drive different decisions.

### Pattern 6 — Base layout with progressive enhancement

```css
.summary-card {
  display: block;
}

@supports (container-type: inline-size) {
  .summary-region {
    container-type: inline-size;
  }

  @container (min-width: 30rem) {
    .summary-card {
      display: grid;
      grid-template-columns: 7rem minmax(0, 1fr);
    }
  }
}
```

The base layout remains usable when the enhancement is unavailable. Verify the `@supports` condition and test the actual target browser versions.

### Pattern 7 — Component layout plus environment query

```css
.card-region {
  container: card / inline-size;
}

@container card (min-width: 32rem) {
  .card__content {
    display: grid;
    grid-template-columns: 1fr auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card * {
    scroll-behavior: auto;
    transition-duration: 0s;
  }
}
```

Container conditions govern the component's shape; media conditions govern user preferences. Keep the two responsibilities separate.

### Pattern 8 — Avoiding intrinsic overflow

```css
.widget-region {
  container-type: inline-size;
  min-inline-size: 0;
}

.widget {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.widget__content {
  min-inline-size: 0;
  overflow-wrap: anywhere;
}
```

Use when a widget sits in a constrained grid or flex track. Fix intrinsic sizing and long-content behavior before adding more breakpoints.

### Pattern 9 — Threshold-driven content layout

```css
.profile-region {
  container: profile / inline-size;
}

.profile {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@container profile (min-width: 30rem) {
  .profile {
    grid-template-columns: 4.5rem minmax(0, 1fr);
  }
}
```

The threshold should reflect when the avatar, text, and actions can fit comfortably. Test long names and translated text, not only short demo content.

### Pattern 10 — Container-relative values with limits

```css
.card__body {
  padding: clamp(1rem, 2.5cqi, 1.75rem);
  gap: clamp(0.75rem, 1.5cqi, 1.25rem);
}
```

This scales internal spacing without letting it become too small or too large. Use a discrete query when the information architecture needs to change, not just the spacing.

### Pattern 11 — Accessible compact state

```css
.action-region {
  container-type: inline-size;
}

.action-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@container (max-width: 22rem) {
  .action-list {
    align-items: stretch;
    flex-direction: column;
  }
}
```

Prefer wrapping or stacking actions over hiding essential controls. Check keyboard focus, target size, and visual order in both states.

### Pattern 12 — Debug-friendly named query

```css
.card-region {
  container: card-region / inline-size;
}

@container card-region (min-width: 32rem) {
  .card__meta {
    display: flex;
    gap: 1rem;
  }
}
```

Use explicit names and keep the query near the component rules. This makes the intended container easier to identify in code review and DevTools.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Using viewport queries for every component | The same component behaves poorly in sidebars or modals | Use container queries when allocated component space drives layout |
| Assuming a wide viewport means a wide card | Parent columns and gutters constrain the card | Query the card's actual wrapper |
| Putting `container-type` on the target being queried | Size queries apply to descendants, not the container itself | Put the query container on a wrapper |
| Forgetting to establish a query container | The condition cannot find the intended size container | Add `container-type` or the `container` shorthand to the correct ancestor |
| Using `container-type: size` by default | Stronger containment can disrupt intrinsic sizing | Prefer `inline-size` unless both axes are required |
| Using size containment without explicit sizing | The container may collapse or size unexpectedly | Define a robust sizing contract and test the parent layout |
| Confusing `width` with `inline-size` | Physical and logical axes differ in some writing modes | Choose the axis intentionally and keep it consistent |
| Querying block size of content-driven content | The height may not be stable or meaningful | Use a constrained container with a known block-size strategy |
| Assuming a container query styles the container itself | The query is evaluated for descendant styles | Query descendants or restructure with a wrapper |
| Using unnamed queries in deeply nested layouts | A nearer eligible container may satisfy the query unexpectedly | Name containers by responsibility |
| Reusing container names without considering nesting | Nested instances can match a nearer same-named container | Define and test the intended nearest-ancestor behavior |
| Forgetting a named container's type requirement | The named ancestor may not be eligible for the query | Establish the correct container type on the named wrapper |
| Choosing breakpoints from device labels | Component content constraints differ from device categories | Derive thresholds from fit, wrapping, and overflow tests |
| Copying one threshold to every component | Different content has different minimum comfortable widths | Document component-specific thresholds |
| Testing only well above a threshold | Bugs often appear just before and after the switch | Test below, at, and above every threshold |
| Using container units without a container wrapper | Units can fall back to small viewport dimensions | Include the expected wrapper in all component contexts |
| Assuming `cqi` means viewport width | It is relative to the relevant query container's inline size | Verify which ancestor supplies the unit |
| Confusing percentages with container units | They resolve against different sizing contexts | Use each unit for its intended relationship |
| Letting container-relative type shrink without a minimum | Text can become too small in narrow cards | Use `clamp()` with a readable minimum |
| Letting container-relative type grow without a maximum | Headings can become oversized in broad regions | Use `clamp()` with a reasonable maximum |
| Overusing fluid units for discrete layout changes | Tiny spacing changes cannot solve an information-layout problem | Add a container query when structure needs to change |
| Using `container-type: size` without both-axis need | More containment complexity than the component requires | Prefer `inline-size` for width-driven behavior |
| Assuming style queries are supported everywhere | Support varies by feature and browser version | Check exact target support and retain a class-based alternative |
| Treating custom properties as automatic state | A variable alone does not switch layout | Use actual CSS conditions or explicit modifier classes |
| Migrating reduced-motion queries to container queries | Motion preference is environmental, not size-based | Keep preference conditions in media queries |
| Migrating pointer or hover detection to container queries | Input capabilities are not component dimensions | Use the appropriate media features |
| Duplicating complete base styles in every query | CSS drifts and becomes difficult to maintain | Share base styles and override only the changed properties |
| Hiding essential actions in narrow containers | Users may lose access to important functionality | Stack, wrap, or simplify the presentation without removing actions |
| Reordering content visually without checking semantics | Reading and focus order can diverge from the display | Preserve a coherent DOM order across variants |
| Ignoring `min-inline-size: 0` in grid/flex contexts | Intrinsic minimum sizes can cause overflow | Fix the track and item sizing contract |
| Treating a query as a fix for overflow | The underlying min-content or long-word issue remains | Correct intrinsic sizing, wrapping, and constraints |
| Ignoring long localized strings | The layout may only work for English demo content | Test realistic long strings and localization |
| Testing only with short labels | Real data may wrap or push actions out of view | Include worst-case content in fixtures |
| Forgetting focus-visible styles in alternate layouts | Keyboard focus may be clipped or visually lost | Check focus in every query state |
| Using a query threshold that causes large visual jumps | Layout changes may shift content unexpectedly | Choose stable thresholds and test the transition region |
| Relying on visual order for accessibility | CSS placement does not rewrite DOM reading order | Keep semantic and visual order aligned |
| Assuming `@supports` guarantees every syntax feature | Support can vary by specific query feature or syntax | Test exact syntax and browser versions |
| Making the base layout unusable without queries | Unsupported browsers lose essential content or controls | Keep a functional base layout |
| Testing only a standalone component | Real parent layouts alter available width | Test in cards, sidebars, dialogs, and nested grids |
| Forgetting nested query interactions | A component may respond to the wrong ancestor | Use named containers and inspect query resolution |
| Using container queries without documenting the contract | Future consumers may omit the required wrapper | Document container type, name, thresholds, and fallback |
| Assuming a query's condition is wrong before inspecting size | The actual container may simply never reach the threshold | Inspect computed container dimensions first |
| Ignoring container containment's sizing effects | Parent grid/flex sizing can change unexpectedly | Test intrinsic sizes and set explicit minimums where needed |
| Overusing container names for trivial one-off components | Names can add noise without clarifying intent | Name containers where nested context or reuse warrants it |
| Using a generic name like `main` for every container | Query intent is difficult to trace | Use responsibility-based names such as `profile-card` |
| Setting `container-type` on too high an ancestor | Descendants may respond to a broad region rather than their own allocation | Place the wrapper at the component boundary |
| Setting `container-type` too deep | Only some descendants can query it and structure becomes awkward | Put it at a stable, documented wrapper boundary |
| Assuming container queries replace media queries | Environment and viewport concerns remain | Combine query types according to responsibility |
| Not checking fallback units in isolated previews | Typography can look much larger or smaller than in the app | Include the container wrapper in stories and screenshots |
| Using block-size queries for ordinary auto-height cards | Content height is not a stable layout input | Prefer inline-size queries for width-driven card layouts |
| Allowing a narrow card to clip controls | Responsive state hides focus or actions | Wrap or stack and verify keyboard access |
| Failing to test browser zoom | Text reflow can alter the component's fit | Test zoom and text scaling at critical thresholds |
| Forgetting that thresholds use CSS lengths | Mixing assumptions about pixels and rems leads to wrong fit | Document units and test at the root font-size in use |
| Making a named query but omitting the matching container name | The condition cannot resolve the intended named ancestor | Keep the name consistent and verify in DevTools |
| Treating query names as globally unique identifiers | Names are resolved through ancestor matching, not a global registry | Understand scope and nested matching behavior |
| Failing to test a component in multiple host layouts | Hidden page assumptions survive the refactor | Add fixtures for wide, narrow, nested, and modal contexts |
| Ignoring the base style when the query does not match | The default state may be incomplete | Make base styles readable and functional |
| Overfitting thresholds to a single screenshot | Real content and viewport changes reveal failures | Test representative data and widths systematically |
| Forgetting reduced motion during transitions | A responsive component can still animate against user preference | Retain a reduced-motion media query |
| Not checking contrast after a layout switch | New background or overlay combinations may affect readability | Revalidate all visual states after the switch |
| Using `cqh` where inline-size was intended | Height-relative sizing can vary unexpectedly | Match the unit to the design's actual dependency |
| Assuming container units always refer to the nearest container of any type | Unit selection depends on an eligible query container and axis | Verify the container context and type |
| Failing to include the wrapper in documentation examples | Consumers may copy a component that lacks its required context | Show the full wrapper-plus-component pattern |
| Using a container query to make a mobile-only assumption | The same width can occur on desktop in a sidebar | Base the rule on component fit, not device identity |
| Forgetting the actual container can be narrower than its content | Intrinsic sizes can create a circular-feeling layout problem | Set constraints and test long content rather than assuming fit |
| Making every component fluid when discrete variants are clearer | Values become difficult to tune and test | Use bounded fluid values for gradual changes and queries for structural changes |

## Mental Models

1. **The component responds to its allocation.** The viewport is only one influence on the space it receives.
2. **The container is an explicit contract.** A wrapper establishes where responsive decisions are measured.
3. **Queries affect descendants.** The container provides context; its children consume that context.
4. **Use the narrowest meaningful responsive input.** Component layout belongs to container queries; environment preferences belong to media queries.
5. **Inline size is usually the practical default.** Width-driven card layouts rarely need full size containment.
6. **Containment changes sizing behavior.** A query container is not always a passive wrapper.
7. **Names reduce ambiguity.** They make the intended ancestor easier to reason about in nested layouts.
8. **Thresholds come from content fit.** A breakpoint is a constraint boundary, not a device category.
9. **Container units are contextual.** They derive from an eligible container, with fallback behavior when one is absent.
10. **Fluid values need bounds.** `clamp()` keeps component-relative sizing within useful limits.
11. **Structural changes need structural queries.** Spacing adjustments cannot fix every layout problem.
12. **Base styles are the safety net.** Query enhancements should not be the only usable presentation.
13. **Intrinsic sizing still matters.** Container queries do not remove min-content constraints or overflow.
14. **DOM order remains the semantic order.** Visual layout changes should not confuse keyboard or screen-reader navigation.
15. **Nested components need tested scope.** An unqualified query may use a nearer ancestor than expected.
16. **Feature support is specific.** Container size queries, units, and style queries should be checked separately.
17. **A responsive component has multiple states.** Accessibility and overflow need checking in every state.
18. **DevTools should confirm the model.** Inspect container dimensions and computed styles before rewriting the query.

## Quick Reference

| Need | Technique | Reminder |
|---|---|---|
| Component adapts to width | `container-type: inline-size` | Query a descendant |
| Query both axes | `container-type: size` | Plan for stronger containment |
| Give container a name | `container: card / inline-size` | Use responsibility-based names |
| Query minimum width | `@container card (min-width: 32rem)` | Threshold should come from content fit |
| Query logical inline size | `@container (inline-size >= 32rem)` | Check syntax support |
| Scale title with container | `font-size: clamp(1rem, 2.5cqi, 2rem)` | Always bound fluid type |
| Scale spacing | `padding: clamp(1rem, 3cqi, 2rem)` | Use sparingly |
| Query block size | `@container (block-size >= 16rem)` | Requires meaningful size containment |
| Avoid flex/grid overflow | `min-inline-size: 0` | Inspect intrinsic sizing |
| Preserve broad fallback | Base rules outside `@container` | Enhancement should be optional |
| Feature guard | `@supports (container-type: inline-size)` | Verify exact browser support |
| Respect reduced motion | `@media (prefers-reduced-motion: reduce)` | Environment concern, not container concern |
| Use style query | `@container style(--mode: compact)` | Check support before relying on it |
| Debug no match | Inspect wrapper size and ancestor chain | Verify target is a descendant |
| Debug nested containers | Use explicit container names | Test nested instances |
| Test thresholds | Just below, at, and above | Include long and localized content |

## Build Challenge

Build a reusable **insight card** that appears in a wide dashboard, narrow sidebar, modal dialog, and a nested widget region. It should use container queries for layout and typography, remain usable without query support, and preserve accessibility.

### Requirements

1. Define a stable wrapper for the insight card.
2. Establish `container-type: inline-size` on the wrapper.
3. Give the container a meaningful name.
4. Query a descendant rather than attempting to style the container from its own size query.
5. Provide a useful base layout before any container query.
6. Use a single-column base layout.
7. Switch to a two-column layout at a content-derived threshold.
8. Explain why the threshold was chosen.
9. Test the component in a wide dashboard column.
10. Test the component in a narrow sidebar.
11. Test the component inside a modal.
12. Test the component nested inside another query container.
13. Verify the intended named ancestor drives each query.
14. Use `minmax(0, 1fr)` where it helps prevent grid-track overflow.
15. Add `min-inline-size: 0` where required by the host grid or flex layout.
16. Test long unbroken strings and long labels.
17. Test realistic and localized content.
18. Use `clamp()` for at least one bounded fluid value.
19. Use a container-relative unit only where it improves the component.
20. Verify the wrapper is present in isolated component previews.
21. Document what happens if the wrapper is missing.
22. Keep base styles functional if container queries are unsupported.
23. Add a feature-support guard if required by the target matrix.
24. Test the actual container query syntax in each target browser.
25. Keep environment preferences in media queries.
26. Respect `prefers-reduced-motion`.
27. Keep DOM order logical across every visual layout.
28. Preserve visible keyboard focus in every query state.
29. Do not hide essential actions at narrow widths.
30. Stack or wrap actions when horizontal space is insufficient.
31. Verify target sizes and spacing in compact layouts.
32. Test browser zoom and text scaling.
33. Check color contrast in each layout and theme.
34. Test at widths just below each threshold.
35. Test at the threshold itself.
36. Test at widths just above the threshold.
37. Check whether containment affects parent grid or flex sizing.
38. Confirm that block-size queries are not used without a sizing contract.
39. Avoid unnecessary duplicated base declarations.
40. Use named containers where nested scope could be ambiguous.
41. Inspect computed container size in DevTools during debugging.
42. Confirm that container-relative units use the expected container.
43. Check unit fallback behavior in an isolated fixture.
44. Document the container type, name, threshold, and fallback.
45. Add screenshots or automated visual checks for wide, narrow, modal, and nested states.
46. Verify that content does not overflow or become clipped.
47. Confirm selection, error, and status information are not conveyed by color alone.
48. Have another developer use the component without undocumented layout assumptions.
49. Run the component through the project's browser support matrix.
50. Record known limitations and the conditions under which the component should use a media query instead.

### Definition of done

- [ ] The card responds to its allocated width, not just the viewport.
- [ ] The wrapper and query contract are documented.
- [ ] The base layout remains usable without the enhancement.
- [ ] Wide, narrow, modal, and nested contexts are tested.
- [ ] Every threshold is justified by content fit.
- [ ] Typography and spacing remain within readable bounds.
- [ ] Intrinsic sizing and overflow are verified.
- [ ] Keyboard focus and semantic order remain clear.
- [ ] Environment preferences stay in media queries.
- [ ] Browser support and fallback behavior are documented.
