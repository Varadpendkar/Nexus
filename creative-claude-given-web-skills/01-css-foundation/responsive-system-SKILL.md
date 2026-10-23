# SKILL: responsive-system

## Layer
**Layer 01 — CSS Foundation**

## Goal
Design responsive interfaces as a coherent system rather than a collection of device-specific patches. Build layouts that adapt to available space, content length, input capabilities, and user preferences using fluid sizing, intrinsic layout, media queries, container queries, responsive assets, and deliberate testing.

## When to Use This Skill
Use this skill when:
- A page must work from narrow phones through wide desktop screens.
- Components appear in different widths depending on their parent layout.
- Navigation, grids, cards, forms, and typography need to adapt to available space.
- A design breaks between the exact viewport widths used in a mockup.
- You need a repeatable breakpoint and responsive-testing strategy.
- You need to account for reduced motion, zoom, orientation, and touch input.

## Why This Matters (Senior Perspective)
Responsive design is not the task of shrinking a desktop mockup. It is the discipline of preserving meaning, hierarchy, readability, and operability as the available space and interaction context change.

Senior implementation starts from the content and its constraints. The question is not “What does this look like on an iPhone?” but “At what point does this layout stop serving the content, and what should the layout do then?” That leads to fewer arbitrary breakpoints, fewer brittle overrides, and components that can be reused in pages the original designer did not anticipate.

A robust responsive system combines:
- **Intrinsic layout:** let Grid and Flexbox distribute space based on content and available room.
- **Fluid values:** interpolate between sensible minimums and maximums.
- **Media queries:** respond to viewport conditions or user preferences.
- **Container queries:** respond to the space a component actually receives.
- **Responsive media:** choose suitable image sources and crops.
- **Resilient content:** allow text to wrap, controls to remain usable, and layout to tolerate longer translations.
- **Verification:** test intermediate widths, zoom, keyboard access, and real content—not only ideal screenshots.

The result should feel designed at every size, not merely technically unbroken.

## Core Concepts

### 1. Mobile-First Is a Cascade Strategy
Mobile-first CSS starts with the simplest narrow-layout baseline and adds enhancements as more space becomes available. It is not a rule that every design must look like a phone first; it is a strategy for keeping the baseline understandable and avoiding unnecessary overrides.

```css
.page-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 48rem) {
  .page-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 72rem) {
  .page-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

**Gotcha:** A mobile-first stylesheet can still be poorly designed if it has too many overrides or if the baseline content order is wrong. Keep the document order meaningful before adding visual rearrangement.

### 2. Responsive Design Is Content-Driven
A breakpoint should mark a point where the current composition becomes less useful—not a point copied from a device catalog.

Look for observable failure signals:
- Headings wrap into awkward fragments.
- Navigation items collide or wrap unexpectedly.
- Cards become too narrow for their content.
- Form controls are cramped.
- Long words or URLs overflow.
- A sidebar leaves the main column unusably small.
- Empty space becomes disproportionate.
- Touch targets crowd together.

Add a breakpoint where a meaningful layout change fixes the problem. Do not add one simply because a popular phone has a particular CSS width.

### 3. The Viewport Is Not the Component
Viewport media queries answer questions about the viewport, such as its width or user preferences. They do not know whether a reusable card is placed in a narrow sidebar, a modal, or a wide main column.

Use viewport queries for page-level changes such as global navigation, page columns, or large composition changes. Use container queries for component-level changes when the same component may appear in different widths.

### 4. Fluid Values With `clamp()`
`clamp(minimum, preferred, maximum)` allows a value to scale between bounds. It is useful for font sizes, spacing, widths, and some layout dimensions.

```css
.page-title {
  font-size: clamp(2rem, 1.2rem + 3vw, 4.5rem);
}

.page-section {
  padding-block: clamp(2rem, 1.2rem + 3vw, 5rem);
}
```

The minimum protects small screens, the preferred value creates fluid growth, and the maximum prevents uncontrolled scaling. Check the interpolation at the narrowest and widest supported widths.

**Gotcha:** `clamp()` does not make a layout responsive by itself. A fluid font size can still overflow if the text container has a fixed width or if long words cannot wrap.

### 5. Intrinsic Sizing Before Breakpoint Patches
Use intrinsic CSS tools so layout can respond to content naturally:
- `minmax()`
- `min-content`
- `max-content`
- `fit-content()`
- `min()`, `max()`, and `clamp()`
- Flexbox wrapping
- Grid auto-placement

```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1.25rem;
}
```

This lets the grid choose a number of columns based on the available width and a reasonable minimum card size. A media query may still be needed when the composition itself changes, but do not add breakpoints to solve a problem intrinsic sizing already handles.

### 6. `auto-fit` Versus `auto-fill`
Both create repeated tracks, but they differ when there are fewer items than the number of possible tracks:
- `auto-fit` collapses empty tracks so occupied tracks can expand.
- `auto-fill` preserves the empty tracks, maintaining the track pattern.

Use `auto-fit` when cards should expand to use the available space. Use `auto-fill` when preserving the implied grid rhythm is useful.

**Gotcha:** `repeat(auto-fit, minmax(16rem, 1fr))` can overflow when the container is narrower than the minimum track. Consider `minmax(min(100%, 16rem), 1fr)` for narrow containers.

### 7. Flexible Columns Need `minmax(0, 1fr)`
Grid items often have an automatic minimum size based on their contents. A long code snippet, URL, or unbreakable title can force a track wider than intended.

```css
.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
  gap: 1.5rem;
}
```

Use `minmax(0, 1fr)` when a track must be allowed to shrink below its content’s min-content size. Then decide how the content itself should wrap or scroll.

### 8. Flexbox Wrapping and Minimum Width
Flex items do not always shrink as far as expected because their automatic minimum size can preserve content width. `min-width: 0` is often useful for a child that must shrink inside a flex row.

```css
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.toolbar__main {
  flex: 1 1 18rem;
  min-width: 0;
}
```

Use `flex-wrap` when items may move to another line. Do not use `white-space: nowrap` on every control just to make a toolbar appear aligned.

### 9. Breakpoints as Named Design Decisions
Use a small, documented breakpoint scale for page-level composition. Names should describe the design decision rather than a specific device.

```css
:root {
  --bp-layout-wide: 72rem;
}

/* Narrow baseline */
.page-layout {
  display: grid;
  grid-template-columns: 1fr;
}

/* Main content and sidebar can coexist */
@media (min-width: 72rem) {
  .page-layout {
    grid-template-columns: minmax(0, 1fr) 18rem;
  }
}
```

CSS custom properties cannot be used as media-query conditions in ordinary `@media` syntax, so custom-property breakpoint tokens are useful as documentation or in build tooling, but the numeric condition is typically written directly unless your tooling transforms tokens.

**Gotcha:** Do not imply that `@media (min-width: var(--bp-layout-wide))` is universally valid CSS. Use a preprocessor/design-token build step if you want breakpoint variables.

### 10. Breakpoint Ranges and Overlap
Mobile-first minimum-width queries are often easier to reason about than a large set of overlapping ranges. If you do need a bounded range, use modern range syntax only when it fits your browser support target.

```css
@media (width >= 48rem) and (width < 72rem) {
  .sidebar {
    display: none;
  }
}
```

For broad compatibility, traditional `min-width` and `max-width` queries may be appropriate. Be careful with inclusive boundaries and overlapping rules, especially when several declarations change at the same width.

### 11. Container Queries for Reusable Components
A container query lets a component respond to the size of an ancestor container.

```css
.product-region {
  container-type: inline-size;
}

.product-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@container (min-width: 34rem) {
  .product-card {
    grid-template-columns: 9rem minmax(0, 1fr);
    align-items: center;
  }
}
```

The ancestor establishes a query container. The component changes when the container reaches the threshold, regardless of the overall viewport width.

**Gotcha:** Container queries need a suitable query container ancestor. If the rule never activates, check the container’s `container-type`, name, and actual content-box width.

### 12. Named Containers and Nested Layouts
When several ancestors can be containers, name the one the component should respond to.

```css
.product-region {
  container: product-region / inline-size;
}

@container product-region (min-width: 34rem) {
  .product-card__details {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 1rem;
  }
}
```

Naming containers makes complex layouts easier to reason about. Avoid creating containers everywhere without a clear component contract.

### 13. Container Units
Container query units such as `cqi` and `cqb` can size content relative to a query container’s inline or block size.

```css
.promo-title {
  font-size: clamp(1.25rem, 5cqi, 2.5rem);
}
```

These units are useful for component-local fluid scaling, but the container context must be intentional. Use `clamp()` to prevent extremes and verify the unit against the intended container axis.

### 14. Responsive Typography
Typography should scale within bounds while maintaining readable line lengths and hierarchy.

```css
:root {
  --type-body: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --type-heading: clamp(2rem, 1.2rem + 3vw, 4.25rem);
}

body {
  font-size: var(--type-body);
}

h1 {
  font-size: var(--type-heading);
  line-height: 1.05;
  text-wrap: balance;
}
```

Do not set body text so small that users need to zoom just to read it. Keep line length bounded with a readable measure, and verify headings with realistic content.

### 15. Responsive Spacing
Spacing can be fluid, but the system should preserve rhythm. Use a few scales rather than unrelated viewport formulas throughout the stylesheet.

```css
.section {
  padding-block: clamp(2rem, 4vw, 5rem);
  padding-inline: clamp(1rem, 3vw, 2.5rem);
}
```

For repeated components, prefer spacing tokens and reserve fluid formulas for places where scaling materially improves composition.

### 16. Responsive Images With `srcset` and `sizes`
The browser can select an appropriate image candidate when `srcset` and `sizes` describe the available sources and rendered width.

```html
<img
  src="/images/article-800.jpg"
  srcset="/images/article-400.jpg 400w,
          /images/article-800.jpg 800w,
          /images/article-1400.jpg 1400w"
  sizes="(min-width: 72rem) 50vw, 100vw"
  alt="A researcher examining a sample under a microscope"
  width="1400"
  height="900"
/>
```

The `sizes` attribute describes the image’s expected rendered width, not the file size. Incorrect `sizes` values can cause the browser to download a source that is too large or too small.

### 17. Art Direction With `picture`
Use `<picture>` when different viewport conditions require different crops or art direction, not merely different resolutions of the same composition.

```html
<picture>
  <source
    media="(min-width: 60rem)"
    srcset="/images/campaign-wide.webp"
  />
  <img
    src="/images/campaign-portrait.webp"
    alt="A cyclist riding along a coastal road"
    width="900"
    height="1100"
  />
</picture>
```

Keep the fallback image meaningful. If the crop changes the informational content, make sure the alternative text still accurately describes what is conveyed.

### 18. Aspect Ratios and Cropping
`aspect-ratio` gives media a predictable box while loading. `object-fit: cover` fills the box and crops overflow; `object-position` controls the crop focus.

```css
.card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  object-position: center 35%;
}
```

Check crop focal points at each layout size. A subject near an edge may disappear when a wide image is placed in a tall mobile card.

### 19. Safe Areas and Edge-to-Edge Layouts
On devices with display cutouts or home indicators, environment variables can help pad content away from unsafe edges.

```css
.page-shell {
  padding-inline:
    max(1rem, env(safe-area-inset-left))
    max(1rem, env(safe-area-inset-right));
}
```

For a viewport-filling interface, consider the appropriate viewport units (`svh`, `lvh`, or `dvh`) based on whether the layout should follow the small, large, or dynamic viewport height. Test mobile browser chrome behavior instead of assuming `100vh` always matches the visible area.

### 20. Orientation Is Not Device Identity
An orientation media query can be useful for a composition that genuinely depends on the viewport’s aspect orientation, but orientation alone does not tell you the device type or physical posture.

Use it sparingly. Most layouts should adapt to available width and height through intrinsic sizing rather than switching entirely between portrait and landscape modes.

### 21. Input Capabilities and Hover
Media features such as `hover`, `pointer`, `any-hover`, and `any-pointer` can help tailor interaction details to input capabilities.

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    box-shadow: var(--shadow-card-hover);
  }
}
```

Do not hide information or actions behind hover. A touch device may have no hover, and a hybrid device may support more than one pointer type.

### 22. Zoom, Text Enlargement, and Reflow
A responsive page should tolerate browser zoom and enlarged text. Fixed heights, fixed-width content panels, and absolute positioning around text often fail when text grows.

Test the interface at high zoom and with increased text size where possible. At narrow effective widths, content should reflow without requiring two-dimensional scrolling except where it is genuinely necessary, such as a wide data table or canvas.

**Gotcha:** A layout that fits at 320 CSS pixels without zoom may still fail when zoom increases because the effective viewport becomes narrower. Test the reflow behavior rather than only the device’s physical resolution.

### 23. Long Content and Localization
Responsive layouts must survive long names, translated labels, user-generated content, and unexpected strings.

```css
.card__title,
.card__description {
  min-width: 0;
  overflow-wrap: anywhere;
}

.card__title {
  text-wrap: balance;
}
```

Use `overflow-wrap: anywhere` selectively; it can break long URLs but may also create unattractive line breaks in normal prose. For labels and buttons, allow wrapping or give the layout enough room instead of truncating critical meaning.

### 24. Navigation Patterns
Navigation should preserve access to destinations without forcing every link into a single cramped row.

Possible strategies include:
- Wrapping a secondary navigation row.
- Moving secondary links into a disclosed menu.
- Using a compact menu button that opens a keyboard-accessible panel.
- Keeping primary actions visible while moving less-used actions.
- Using a scrollable tab row only when its scrollability is discoverable.

Do not hide links purely because a viewport crosses an arbitrary width. The collapsed menu needs an accessible name, state, keyboard behavior, and focus management appropriate to its implementation.

### 25. Responsive Forms
Forms should retain clear labels, readable help text, and usable controls. A two-column form can become a single column when its fields no longer have enough room.

```css
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 40rem) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.form-field {
  min-width: 0;
}
```

Use actual `<label>` elements and do not rely on placeholders as the only field labels. Error messages should wrap and remain associated with the corresponding control.

### 26. Responsive Tables and Dense Data
Data tables may legitimately need two-dimensional scrolling, but the scroll region must be clear and keyboard-accessible. Do not blindly turn every table into stacked cards if row/column relationships are important.

```css
.table-scroll {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.table-scroll:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```

If the scroll wrapper needs keyboard focus to be operable in your supported browser set, give it an appropriate `tabindex` and accessible label. Consider a caption and proper header associations in the table.

### 27. Responsive Motion and Transitions
A responsive redesign may change not only dimensions but also motion. Avoid making a large-screen hover animation the only indication of interactivity. Reduce nonessential motion when requested.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

A broad reset like this is sometimes used as a project-level policy, but it may interfere with intentional state feedback. Prefer a targeted policy when possible and verify that transitions are not required to understand a state change.

### 28. Dark Mode and User Preferences
Responsive systems should account for user preferences in addition to width. `prefers-color-scheme`, `prefers-reduced-motion`, and `prefers-contrast` can influence presentation when the product supports them.

Do not infer every preference from device type. Keep the content structure stable and adjust color, motion, and contrast as needed. If a site provides an explicit theme control, make its state persistent according to the product’s requirements and expose the selected state accessibly.

### 29. Responsive Debugging
When a layout fails at a particular width:
1. Reproduce the width where the failure starts.
2. Inspect the element’s computed width and its parent’s available space.
3. Identify min-content constraints, fixed dimensions, and non-wrapping content.
4. Check grid track definitions and flex item minimum sizes.
5. Inspect the cascade and media-query boundaries.
6. Confirm the correct container is being queried.
7. Check image intrinsic dimensions and `sizes` behavior.
8. Test with longer content and enlarged text.
9. Verify focus, hover, and touch behavior.
10. Change the smallest rule that fixes the underlying constraint.

**Gotcha:** Adding another breakpoint may hide the symptom while leaving the content constraint unresolved. Find out why the layout cannot shrink or wrap before introducing a new threshold.

### 30. Responsive Testing Is a Matrix, Not a Screenshot
Test across a representative set of widths, content lengths, input methods, and preferences. Exact device emulation is useful, but it cannot replace real-device testing for browser chrome, performance, touch behavior, and font rendering.

A practical matrix includes:
- Narrow phone width.
- Typical phone width.
- Large phone or small tablet width.
- Tablet portrait and landscape.
- Desktop at the breakpoint boundaries.
- Wide desktop.
- Keyboard-only operation.
- Hover-capable and touch input.
- Zoom and text enlargement.
- Reduced motion.
- Light and dark themes if supported.
- Long labels and empty/error/loading states.

## Reusable Patterns

### Pattern 1 — Intrinsic Auto-Fitting Card Grid
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr));
  gap: clamp(1rem, 2vw, 1.5rem);
}
```
Use when cards should flow naturally without a fixed number of columns at every breakpoint.

### Pattern 2 — Mobile-First Page With Sidebar
```css
.page-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;
}

@media (min-width: 72rem) {
  .page-layout {
    grid-template-columns: minmax(0, 1fr) 18rem;
    align-items: start;
  }
}
```
Only introduce the sidebar when the main content still has enough room to be readable.

### Pattern 3 — Component-Local Container Query
```css
.widget-region {
  container: widget / inline-size;
}

.widget {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@container widget (min-width: 32rem) {
  .widget {
    grid-template-columns: 8rem minmax(0, 1fr);
  }
}
```
This component adapts to its parent rather than the entire viewport.

### Pattern 4 — Fluid Type and Spacing Tokens
```css
:root {
  --space-section: clamp(2.5rem, 5vw, 5.5rem);
  --space-gutter: clamp(1rem, 3vw, 2.5rem);
  --type-display: clamp(2.5rem, 1.4rem + 4vw, 5rem);
}

.section {
  padding-block: var(--space-section);
  padding-inline: var(--space-gutter);
}

.display-title {
  font-size: var(--type-display);
  line-height: 1.02;
  text-wrap: balance;
}
```
Use a few shared tokens to keep scaling consistent across the page.

### Pattern 5 — Responsive Media With Explicit Dimensions
```html
<img
  src="/media/story-900.webp"
  srcset="/media/story-450.webp 450w,
          /media/story-900.webp 900w,
          /media/story-1500.webp 1500w"
  sizes="(min-width: 70rem) 55vw, 100vw"
  width="1500"
  height="1000"
  alt="A chef plating a meal in a restaurant kitchen"
/>
```
Explicit dimensions reserve layout space. Tune `sizes` to the actual layout rather than guessing based on image file width.

### Pattern 6 — Art-Directed Hero
```html
<picture class="hero-media">
  <source media="(min-width: 64rem)" srcset="/media/hero-wide.webp" />
  <img src="/media/hero-tall.webp" alt="A hiker looking across a mountain valley" />
</picture>
```
Use different crops only when the composition needs to change. Keep the fallback meaningful.

### Pattern 7 — Accessible Responsive Navigation Baseline
```html
<nav aria-label="Primary">
  <ul class="primary-nav">
    <li><a href="/work">Work</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```
Start with a semantic, useful navigation structure. If the design collapses it into a menu, implement the menu button and disclosure behavior explicitly rather than hiding links without an accessible replacement.

### Pattern 8 — Two-Column Form That Reflows
```css
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 42rem) {
  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
```
Make each field a semantic unit with a visible label, help text, and associated error message.

### Pattern 9 — Safe-Area-Aware Edge Padding
```css
.app-shell {
  padding-inline:
    max(1rem, env(safe-area-inset-left))
    max(1rem, env(safe-area-inset-right));
  padding-block-end: max(1rem, env(safe-area-inset-bottom));
}
```
Use for edge-to-edge interfaces and test on devices where safe-area insets are nonzero.

### Pattern 10 — Scrollable Data Region
```css
.data-region {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
}

.data-region:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```
Preserve table semantics and provide a clear caption or label. Do not turn scrolling into an invisible gesture-only requirement.

### Pattern 11 — Hover Enhancement Without Hover Dependence
```css
.card {
  border: 1px solid #d1d5db;
  transition: box-shadow 160ms ease;
}

@media (hover: hover) and (pointer: fine) {
  .card:hover {
    box-shadow: 0 10px 28px rgb(15 23 42 / 12%);
  }
}

.card a:focus-visible {
  outline: 3px solid #2563eb;
  outline-offset: 3px;
}
```
The content remains available without hover, and keyboard users receive a distinct focus state.

### Pattern 12 — Reduced-Motion Enhancement
```css
.motion-card {
  transition: transform 180ms ease, box-shadow 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .motion-card {
    transition: none;
  }
}
```
Use a targeted motion policy that removes nonessential animation without obscuring important feedback.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Designing only for named devices | Breaks between the chosen device widths | Add breakpoints when content needs them |
| Treating responsive as desktop plus phone | Ignores intermediate widths and changing contexts | Test the whole supported range |
| Adding breakpoints before checking intrinsic sizing | Creates brittle overrides | Try Grid, Flexbox, wrapping, and min/max sizing first |
| Using fixed widths for flexible cards | Causes overflow in narrow containers | Use `minmax()`, percentages, and bounded fluid values |
| Forgetting `min-width: 0` in a grid/flex child | Long content can force overflow | Allow the item to shrink and choose a wrapping strategy |
| Using `auto-fit` with a rigid minimum | The grid may overflow a smaller parent | Use `minmax(min(100%, ...), 1fr)` where appropriate |
| Using viewport media queries for every component | A component may be narrow inside a wide viewport | Use container queries for component-local adaptation |
| Forgetting the container ancestor | Container rules never activate | Set `container-type` or `container` on the intended ancestor |
| Treating container width as viewport width | Thresholds fire at the wrong time | Inspect the actual query container’s content-box width |
| Assuming CSS custom properties work in `@media` conditions | Ordinary media conditions do not universally accept `var()` | Use literal conditions or a build-time token transform |
| Making every value fluid | The interface can become too large or too small | Bound important values with `clamp()` |
| Setting an unbounded fluid heading | Headlines overwhelm wide layouts | Set minimum and maximum values |
| Using fixed heights around variable text | Content clips at zoom or localization | Prefer intrinsic height and flexible padding |
| Relying on placeholder-only form labels | Labels disappear when users type | Use visible semantic labels |
| Hiding actions behind hover | Touch and keyboard users may miss them | Keep essential actions available and support focus |
| Using orientation as a device detector | Orientation does not identify device type | Respond to the actual constraint |
| Ignoring image `sizes` | The browser may download unnecessarily large assets | Describe the rendered slot width accurately |
| Using `srcset` without enough source sizes | Image choice may be suboptimal | Supply appropriate candidates and realistic `sizes` |
| Changing image crop without checking subject placement | The important subject can be cropped out | Tune `object-position` or use art direction |
| Forgetting intrinsic image dimensions | Layout can shift while images load | Set `width` and `height` or reserve aspect ratio |
| Using `100vh` blindly on mobile | Browser chrome can make the visible area differ | Consider `svh`, `lvh`, or `dvh` for the intended behavior |
| Ignoring safe-area insets | Content can sit under cutouts or system UI | Use safe-area environment variables when needed |
| Hiding overflow without a plan | Content becomes inaccessible or silently clipped | Identify what should wrap, scroll, or be removed |
| Turning every table into cards | Data relationships may become harder to compare | Preserve table semantics when relationships matter |
| Testing only ideal content | Real names and translations break layout | Test long, empty, error, and loading states |
| Ignoring zoom and text enlargement | Text may overlap or require two-axis scrolling | Use reflow-friendly dimensions and test zoom |
| Using a large `z-index` to fix responsive overlap | It may not escape a stacking context | Inspect layout and stacking context ownership |
| Applying broad reduced-motion resets without review | Essential feedback can be affected | Prefer targeted, tested motion rules |
| Using tiny breakpoints that overlap unpredictably | Cascade outcomes become difficult to reason about | Document ranges and test exact boundaries |
| Treating one screenshot as proof | It misses keyboard, touch, zoom, and real-device behavior | Use a representative test matrix |
| Making visual order differ from reading order casually | Keyboard and screen-reader sequence may become confusing | Preserve meaningful DOM order |
| Forgetting focus styles in collapsed navigation | Keyboard users lose their place | Provide visible `:focus-visible` treatment |
| Assuming dark mode and light mode need identical assets | Crops and contrast may differ by theme | Test each supported theme and state |
| Failing to check browser support | New features may be ignored or differ in target browsers | Define a support matrix and progressive fallbacks |

## Mental Models

1. **Content-pressure model:** the breakpoint belongs where the content stops fitting well, not where a device specification says it should.
2. **Intrinsic-first model:** ask the layout engine to solve ordinary space distribution before adding a conditional override.
3. **Viewport-versus-container model:** viewport queries control page composition; container queries control component adaptation.
4. **Bounded-fluid model:** fluid values should grow within meaningful minimum and maximum limits.
5. **Minimum-size model:** Grid and Flexbox can preserve min-content widths unless you explicitly allow items and tracks to shrink.
6. **Image-slot model:** `sizes` describes the rendered slot, while `srcset` provides candidate resources.
7. **Reflow model:** zoom and longer content effectively reduce available space; a robust layout adapts without losing meaning.
8. **Input-capability model:** hover and pointer media features describe interaction capability, not a device brand or form factor.
9. **Semantic-order model:** visual rearrangement should not make keyboard or reading order incoherent.
10. **Boundary-testing model:** many responsive bugs occur just before and after a breakpoint, not at the center of a device preset.
11. **Preference model:** width is only one axis; motion, contrast, color scheme, zoom, and input also matter.
12. **Graceful-degradation model:** unsupported enhancement should leave a useful baseline, not an empty or unreadable component.

## Quick Reference

| Problem | First Tool to Try | Add a Query When |
|---|---|---|
| Cards need to fit variable widths | Grid `auto-fit` and `minmax()` | The composition itself must change |
| A flex row overflows | Wrapping and `min-width: 0` | A distinct layout mode is needed |
| Heading is too large on phones | Bounded `clamp()` | Typography hierarchy changes by context |
| Same card appears in different parent widths | Container query | Component layout needs a threshold |
| Sidebar squeezes content | Intrinsic columns and a sensible max width | Main/sidebar composition should change |
| Image is too heavy | `srcset` and accurate `sizes` | Art direction requires different crops |
| Hero subject disappears | `object-position` or `<picture>` | The composition must be different |
| Content sits under a device edge | Safe-area insets | Edge-to-edge layout is used |
| Mobile viewport height jumps | Appropriate viewport units | Layout genuinely depends on visible height |
| Navigation no longer fits | Content-driven disclosure pattern | The links cannot remain readable in one row |
| Table is too wide | Accessible horizontal scroll region | A carefully designed alternative representation is appropriate |
| Hover effect is unavailable | Default visible content and focus styles | Input capability changes the enhancement |
| Layout breaks at zoom | Reflow-friendly sizing and wrapping | A real composition change is required |
| Breakpoint seems arbitrary | Reproduce the failure width | A documented composition transition is justified |

## Build Challenge — Responsive Product Dashboard

Build a responsive product dashboard with a navigation region, summary cards, a chart/data region, a filter form, and a table of recent activity. The same components should work in a narrow phone viewport, a tablet-width panel, and a wide desktop layout.

### Requirements
1. Use semantic landmarks for header, navigation, main content, and complementary content where appropriate.
2. Keep DOM order meaningful for keyboard and assistive-technology users.
3. Start with a usable narrow-screen baseline.
4. Use CSS Grid for the major page composition.
5. Use Flexbox for a wrapping toolbar or compact action row.
6. Use `minmax(0, 1fr)` where flexible tracks must be allowed to shrink.
7. Use `min-width: 0` on children that otherwise force overflow.
8. Create an intrinsic card grid using `auto-fit` or `auto-fill`.
9. Explain why you selected `auto-fit` or `auto-fill`.
10. Add one page-level breakpoint based on a real content constraint.
11. Document the purpose of each breakpoint.
12. Use a container query for at least one reusable dashboard widget.
13. Give the query container a deliberate name or a clear component contract.
14. Verify the container query at widths just below and above its threshold.
15. Use bounded fluid typography for the page title.
16. Use a shared spacing token or bounded fluid section spacing.
17. Keep line lengths reasonable for descriptions and long values.
18. Ensure long identifiers or URLs cannot force the page wider than its container.
19. Use an image with responsive candidates where relevant.
20. Provide a realistic `sizes` value for the image slot.
21. Set intrinsic image dimensions or reserve an aspect ratio.
22. Use art direction only if a different crop materially improves the composition.
23. Make the filter form reflow to one column when needed.
24. Use visible labels and associate error messages with their fields.
25. Preserve table semantics and provide a scroll strategy for narrow widths.
26. Make any scroll region discoverable and operable by keyboard where needed.
27. Provide visible `:focus-visible` styles for links, buttons, and relevant regions.
28. Do not rely on hover to expose essential information or actions.
29. Respect reduced-motion preferences for nonessential transitions.
30. Test light and dark themes if both are supported.
31. Test narrow, intermediate, and wide widths, including breakpoint boundaries.
32. Test long labels, empty data, loading state, and error state.
33. Test zoom or text enlargement and check for clipped content.
34. Check touch target spacing and keyboard navigation.
35. Inspect computed styles to explain one responsive bug and its root cause.
36. Record at least three screenshots at distinct widths.
37. Explain why each breakpoint exists and what content constraint it resolves.
38. Confirm no unintended horizontal page scrolling occurs.
39. Verify the page remains understandable when responsive images or optional visual enhancements fail.
40. Write a brief test report listing the widths, input methods, preferences, and edge cases checked.

### Acceptance Checklist
- [ ] Layout changes are driven by content constraints.
- [ ] Intrinsic sizing handles ordinary variation without excessive breakpoints.
- [ ] Container queries are used for component-local behavior where appropriate.
- [ ] Text and controls remain usable at narrow widths and zoom.
- [ ] Images select appropriate sources and preserve intended crops.
- [ ] Forms, navigation, and tables remain operable.
- [ ] Focus is visible and reading order remains coherent.
- [ ] Reduced-motion and theme behavior are intentional.
- [ ] Breakpoint boundaries have been tested.
- [ ] The test report records real failure cases and their fixes.

## Final Rule
**Make the content resilient first, then add the smallest set of responsive rules that meaningfully improves the composition.** A responsive system should adapt to available space and user needs—not to a list of device names.
