# SKILL: safe-area-insets

**Layer:** 08 — Responsive Mobile

**Goal:** Build edge-to-edge mobile layouts that respect device cutouts, rounded corners, home indicators, and browser safe areas without clipping essential content or wasting screen space.

## Why This Matters (Senior Perspective)

Modern mobile screens are not always simple rectangles. A page can extend behind a notch, a camera cutout, a rounded display corner, a dynamic island, or the home-indicator region. Browser controls can also expand and collapse as users scroll, and installed web apps may expose a different amount of usable screen area than the same page in a browser tab. If a fixed header, bottom action bar, toast, or floating button ignores those conditions, the interface may technically render while important content sits under hardware or system UI.

Senior implementation starts with the viewport and the product's interaction model, not with a magic padding value copied from another device. CSS environment variables such as `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` allow the browser to expose relevant inset values. The viewport meta tag controls whether the page can use the display area edge-to-edge; without the appropriate configuration, the expected safe-area behavior may not occur. These details should be verified in the actual browser and display mode the product supports.

The goal is not to keep all content away from every screen edge. Background colors, artwork, and decorative surfaces can often extend to the edge, while controls and readable content remain inside the safe area. That distinction produces intentional full-bleed design instead of either clipped controls or oversized blank bands. For creative portfolios, mobile commerce, and agency landing pages, safe-area handling is part of the visual system: the design should feel native to the device while remaining robust across orientation changes, browser chrome, and different inset dimensions.

## Core Concepts

### 1. Understand safe-area environment variables

**Mental model:** The safe area is a device- and display-mode-dependent inset, not a fixed universal number. CSS can query the browser-provided inset values and combine them with the spacing system.

The primary environment variables are:

- `safe-area-inset-top`
- `safe-area-inset-right`
- `safe-area-inset-bottom`
- `safe-area-inset-left`

Use `env()` to read them. A fallback can be provided as the second argument, but remember that a fallback is used when the environment variable is unavailable, not when a supported variable evaluates to zero.

```css
.page-shell {
  padding-top: env(safe-area-inset-top, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
}
```

A common layout wants a minimum design gutter plus any safe-area inset. Use `max()` when the design gutter should be at least a chosen value, or `calc()` when the inset should be added to the design gutter.

```css
.page-content {
  padding-inline: max(1.25rem, env(safe-area-inset-left, 0px))
                  max(1.25rem, env(safe-area-inset-right, 0px));
}
```

The previous example illustrates the intent but uses two-value `padding-inline` syntax incorrectly for separate left/right safe-area calculations in some code-review contexts. For reliable control, use explicit properties:

```css
.page-content {
  padding-left: max(1.25rem, env(safe-area-inset-left, 0px));
  padding-right: max(1.25rem, env(safe-area-inset-right, 0px));
}
```

If the design requires a standard gutter plus the full inset, use addition rather than the larger of the two:

```css
.page-content--additive-gutter {
  padding-left: calc(1.25rem + env(safe-area-inset-left, 0px));
  padding-right: calc(1.25rem + env(safe-area-inset-right, 0px));
}
```

Choose one policy consistently. `max()` prevents the total gutter from becoming smaller than the design minimum; `calc()` adds the safe area to that minimum. The correct choice depends on whether the design system defines the inset as part of the gutter or as extra space beyond it.

### 2. Configure the viewport for edge-to-edge layouts

**Mental model:** CSS cannot compensate for a viewport configuration that prevents the intended edge-to-edge layout. The viewport declaration is part of the safe-area implementation.

A common starting point is:

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

`viewport-fit=cover` allows the page viewport to extend into the full display area on supporting mobile browsers. Once the page can occupy those regions, use safe-area variables to keep important content out of unsafe areas.

```html
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, viewport-fit=cover"
  />
  <meta name="theme-color" content="#10121a" />
  <title>Northstar Assembly</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
```

Do not assume the same inset values will appear in every environment. Test a normal browser tab, an installed web app where relevant, and both portrait and landscape orientations on supported devices.

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}
```

The custom properties make the layout rules easier to audit. They are aliases for the browser's values, not hard-coded measurements.

### 3. Separate edge-to-edge backgrounds from inset content

**Mental model:** Let the visual surface reach the screen edge while keeping controls and text within the safe region. Applying safe-area padding to the entire page indiscriminately can create unnecessary bands and break full-bleed art direction.

```html
<section class="full-bleed-hero">
  <img src="/images/hero-mobile.webp" alt="" width="900" height="1200" />
  <div class="full-bleed-hero__content">
    <p class="eyebrow">Digital studio</p>
    <h1>Make the screen feel like a place.</h1>
    <a href="/work/">View selected work</a>
  </div>
</section>
```

```css
.full-bleed-hero {
  position: relative;
  min-height: 100svh;
  overflow: clip;
  background: #10121a;
}

.full-bleed-hero > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.full-bleed-hero__content {
  position: relative;
  padding-top: calc(2rem + var(--safe-top));
  padding-right: calc(1.25rem + var(--safe-right));
  padding-bottom: calc(2rem + var(--safe-bottom));
  padding-left: calc(1.25rem + var(--safe-left));
  color: white;
}
```

Use separate layers for backgrounds and content when a surface must reach the edge. Avoid adding safe-area padding to an element that is intentionally meant to cover the entire display unless its child content also needs that protection.

```css
.site-header {
  position: absolute;
  inset: 0 0 auto;
  padding: calc(1rem + var(--safe-top))
           calc(1.25rem + var(--safe-left));
  color: white;
}
```

For asymmetric devices and landscape orientation, explicit left and right insets may differ. Avoid assuming that only the top and bottom can be unsafe.

### 4. Handle fixed bottom controls and home-indicator space

**Mental model:** A fixed bottom bar must reserve room for the system gesture area and still provide a usable touch target. The background may extend to the bottom edge while the controls sit above the inset.

```html
<nav class="bottom-action-bar" aria-label="Primary actions">
  <a href="/work/">Work</a>
  <a href="/about/">About</a>
  <a class="bottom-action-bar__cta" href="/contact/">Start a project</a>
</nav>
```

```css
.bottom-action-bar {
  position: fixed;
  z-index: 100;
  inset: auto 0 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
  padding-left: calc(1rem + var(--safe-left));
  padding-right: calc(1rem + var(--safe-right));
  background: rgb(16 18 26 / 0.94);
  backdrop-filter: blur(16px);
}
```

The bottom padding includes both the design's normal breathing room and the safe-area inset. If the bottom bar is fixed, page content may need extra bottom padding so the final content is not obscured by the bar.

```css
main {
  padding-bottom: calc(5rem + var(--safe-bottom));
}
```

The reserved value should reflect the actual bar height and spacing. Avoid guessing a huge padding value that makes the final section feel disconnected from the footer.

```css
.bottom-action-bar a {
  display: inline-flex;
  min-height: 2.75rem;
  align-items: center;
  justify-content: center;
  padding-inline: 0.9rem;
  border-radius: 999px;
}
```

A fixed action bar should be tested with browser chrome visible, after scrolling, and in landscape. The visual viewport can change as browser controls collapse or expand.

### 5. Account for safe areas in sticky and fixed headers

**Mental model:** A fixed header is positioned relative to the viewport, so it needs deliberate top inset treatment. A sticky header remains in document flow until it sticks, which can produce different behavior and often requires less special positioning.

```css
.fixed-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  padding-top: var(--safe-top);
  padding-left: calc(1rem + var(--safe-left));
  padding-right: calc(1rem + var(--safe-right));
  min-height: calc(4rem + var(--safe-top));
}
```

For a sticky header, apply the safe-area offset to the top position or internal padding according to whether the header background should cover the unsafe region.

```css
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 50;
  padding-top: var(--safe-top);
  padding-inline: 1rem;
  background: #10121a;
}
```

Test anchor navigation. A heading can end up hidden behind a sticky header even when safe-area padding is correct.

```css
[id] {
  scroll-margin-top: calc(5rem + var(--safe-top));
}
```

Do not apply a global `scroll-margin-top` without checking elements that should not be anchor targets. A utility class may be more appropriate for a long editorial or case-study page.

### 6. Support landscape orientation and side insets

**Mental model:** In landscape, the device's left and right edges can become the limiting safe area. A layout that only handles `safe-area-inset-top` and `safe-area-inset-bottom` may still clip side controls.

```css
.landscape-shell {
  padding-inline:
    calc(1rem + var(--safe-left))
    calc(1rem + var(--safe-right));
}
```

A media query can adapt composition, but the safe-area values should remain dynamic rather than being replaced by guessed landscape-specific numbers.

```css
@media (orientation: landscape) and (max-height: 30rem) {
  .hero {
    min-height: 100svh;
  }

  .hero__content {
    max-width: 42rem;
    padding-top: calc(1rem + var(--safe-top));
    padding-bottom: calc(1rem + var(--safe-bottom));
  }
}
```

For a horizontal game-like interface or media player, protect the primary controls at both sides and test the actual device orientation. Side insets can differ across devices and orientations.

```css
.media-controls {
  position: absolute;
  inset: auto calc(1rem + var(--safe-right)) calc(1rem + var(--safe-bottom))
         calc(1rem + var(--safe-left));
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}
```

### 7. Use `min()`, `max()`, and `clamp()` deliberately

**Mental model:** Safe-area values should compose with the spacing system rather than replacing it. CSS math functions help express the policy clearly.

Use `max()` when the safe inset is part of the total gutter and the design has a minimum. Use `calc()` when the safe inset should be added to the minimum. Use `clamp()` for responsive spacing ranges, but ensure the safe-area component is still included.

```css
.hero-content {
  padding-inline: max(1rem, var(--safe-left))
                  max(1rem, var(--safe-right));
}
```

```css
.hero-content {
  padding-left: max(1rem, var(--safe-left));
  padding-right: max(1rem, var(--safe-right));
}
```

```css
.hero-content--responsive {
  padding-left: calc(clamp(1rem, 4vw, 3rem) + var(--safe-left));
  padding-right: calc(clamp(1rem, 4vw, 3rem) + var(--safe-right));
}
```

Prefer explicit left and right declarations when they use different insets. This makes the intended mapping obvious in code review.

```css
.safe-inset {
  padding-top: max(1rem, var(--safe-top));
  padding-right: max(1rem, var(--safe-right));
  padding-bottom: max(1rem, var(--safe-bottom));
  padding-left: max(1rem, var(--safe-left));
}
```

Do not assume `env()` always returns a non-zero value. A zero inset is a valid outcome, and your ordinary spacing system must still provide adequate room.

### 8. Combine safe areas with dynamic viewport units

**Mental model:** Safe-area insets and viewport units solve different problems. Safe-area variables protect content from display obstructions; `svh`, `lvh`, and `dvh` describe viewport height behavior as browser UI changes.

```css
.fullscreen-panel {
  min-height: 100svh;
  padding-top: calc(1.5rem + var(--safe-top));
  padding-bottom: calc(1.5rem + var(--safe-bottom));
}
```

`100svh` is based on the small viewport; `100lvh` is based on the large viewport; `100dvh` tracks the dynamic viewport. Select the unit based on the interaction, then separately apply safe-area padding.

```css
.fullscreen-tool {
  height: 100dvh;
  box-sizing: border-box;
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
}
```

For a hero that should not jump as browser chrome moves, `svh` may be more stable. For an app-like panel that must fit the currently visible viewport, `dvh` may be more suitable. Test on target browsers because browser chrome behavior differs.

```css
html,
body {
  min-height: 100%;
}

.app-shell {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
```

Do not add safe-area insets to viewport height itself unless the design explicitly needs to calculate the content region. Usually, the inset should be applied to padding inside the full-height surface.

### 9. Make overlays and dialogs safe-area aware

**Mental model:** A modal or sheet needs a usable close button, scrollable content, and visible actions even when the viewport is short or cutouts occupy the edges.

```css
.dialog-panel {
  width: min(100%, 42rem);
  max-height: calc(100dvh - var(--safe-top) - var(--safe-bottom) - 2rem);
  overflow: auto;
  padding: 1.25rem;
  padding-top: calc(1.25rem + var(--safe-top));
  padding-bottom: calc(1.25rem + var(--safe-bottom));
  border-radius: 1.25rem;
}
```

Do not add safe-area padding twice if the dialog is already placed inside a parent that applies it. Choose a clear owner for the inset so the final spacing does not become unexpectedly large.

```css
.dialog-backdrop {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding:
    calc(1rem + var(--safe-top))
    calc(1rem + var(--safe-right))
    calc(1rem + var(--safe-bottom))
    calc(1rem + var(--safe-left));
  background: rgb(0 0 0 / 0.62);
}
```

For a bottom sheet, the sheet background can reach the bottom edge while the inner content clears the home-indicator area.

```css
.bottom-sheet {
  position: fixed;
  inset: auto 0 0;
  max-height: calc(100dvh - var(--safe-top));
  overflow: auto;
  padding: 1rem 1rem calc(1rem + var(--safe-bottom));
  border-radius: 1.5rem 1.5rem 0 0;
  background: #fff;
  color: #151515;
}
```

If a keyboard opens, the visible viewport may shrink. Do not assume `100dvh` alone solves every keyboard and focus issue; test form fields and scroll behavior on actual devices.

### 10. Validate with visual debugging and device tests

**Mental model:** Safe-area CSS is only correct when the target environment supplies the expected viewport and inset values. Verify layout on physical devices and use temporary visual guides to see the boundaries.

```css
/* Development-only overlay: remove before production. */
.safe-area-debug {
  outline: 2px dashed #f04;
  background:
    linear-gradient(to bottom, rgb(255 0 0 / 0.12), transparent 4rem);
}
```

```html
<div class="safe-area-debug">
  <p>Temporary safe-area diagnostic content</p>
</div>
```

Use device emulation to catch obvious issues, then confirm on hardware. Emulation may not reproduce the exact installed-app mode, system gesture region, keyboard, or browser chrome behavior.

```js
function reportSafeAreaSupport() {
  const style = getComputedStyle(document.documentElement);

  return {
    top: style.getPropertyValue("--safe-top"),
    right: style.getPropertyValue("--safe-right"),
    bottom: style.getPropertyValue("--safe-bottom"),
    left: style.getPropertyValue("--safe-left")
  };
}
```

The computed custom property may preserve the `env()` expression depending on how it is defined and reported. A visible test layout is often more informative than logging the value alone.

```css
.safe-area-debug::before {
  content: "safe area test";
  position: fixed;
  inset: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
  border: 1px dashed magenta;
  pointer-events: none;
  z-index: 9999;
}
```

## Reusable Patterns

### Pattern 1: Edge-to-edge hero with protected content

**What it solves:** Allows a full-bleed hero background to occupy the full display while keeping the title and action clear of cutouts and gesture areas.

**Use it when:** A studio homepage, campaign landing page, or portfolio uses a full-screen first section.

```html
<section class="edge-hero" aria-labelledby="edge-hero-title">
  <img class="edge-hero__art" src="/images/edge-hero.webp" alt="" width="1600" height="1200" />
  <div class="edge-hero__content">
    <p class="eyebrow">Northstar Assembly</p>
    <h1 id="edge-hero-title">A clearer signal for ambitious brands.</h1>
    <a href="/work/" class="button">See selected work</a>
  </div>
</section>
```

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
}

.edge-hero {
  position: relative;
  isolation: isolate;
  min-height: 100svh;
  display: grid;
  align-items: end;
  overflow: clip;
  color: #fff;
  background: #10121a;
}

.edge-hero__art {
  position: absolute;
  z-index: -2;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edge-hero::after {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  background: linear-gradient(0deg, rgb(0 0 0 / 0.76), transparent 75%);
}

.edge-hero__content {
  max-width: 50rem;
  padding:
    calc(2rem + var(--safe-top))
    calc(1.25rem + var(--safe-right))
    calc(2rem + var(--safe-bottom))
    calc(1.25rem + var(--safe-left));
}

.edge-hero h1 {
  max-width: 12ch;
  font-size: clamp(2.75rem, 10vw, 6rem);
  line-height: 0.96;
  letter-spacing: -0.055em;
}
```

**Review points:** The art reaches the screen edges, the content respects all four inset variables, and the section uses a viewport-height strategy that is distinct from the safe-area policy.

### Pattern 2: Fixed mobile action bar

**What it solves:** Keeps primary actions accessible while preserving room for the home indicator and the page content underneath.

**Use it when:** A mobile product page has a persistent “Book,” “Buy,” or “Contact” action.

```html
<main class="product-content">
  <h1>Field Notes Speaker</h1>
  <p>Portable sound designed for small spaces.</p>
  <section class="product-details">
    <h2>Details</h2>
    <p>Battery, materials, dimensions, and support information.</p>
  </section>
</main>

<div class="purchase-bar">
  <span class="purchase-bar__price">₹8,499</span>
  <a class="purchase-bar__button" href="/checkout/">Continue</a>
</div>
```

```css
.product-content {
  padding: 1.25rem;
  padding-bottom: calc(6rem + var(--safe-bottom));
}

.purchase-bar {
  position: fixed;
  z-index: 100;
  inset: auto 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem calc(0.75rem + var(--safe-bottom));
  padding-left: calc(1rem + var(--safe-left));
  padding-right: calc(1rem + var(--safe-right));
  border-top: 1px solid rgb(255 255 255 / 0.12);
  background: rgb(17 18 25 / 0.96);
  color: white;
}

.purchase-bar__button {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-inline: 1.25rem;
  border-radius: 999px;
  background: #d9ff72;
  color: #171717;
  font-weight: 700;
}
```

**Review points:** The bar's inner content is inset, the bar background extends to the bottom edge, and the main content reserves room for the fixed control.

### Pattern 3: Safe bottom sheet

**What it solves:** Keeps a bottom sheet's last action visible above the home indicator while allowing long content to scroll.

**Use it when:** Mobile filters, booking details, or project metadata open from the bottom.

```html
<section class="filter-sheet" role="dialog" aria-modal="true" aria-labelledby="filter-title">
  <header class="filter-sheet__header">
    <h2 id="filter-title">Filter projects</h2>
    <button type="button" aria-label="Close filters">×</button>
  </header>
  <div class="filter-sheet__body">
    <label><input type="checkbox" /> Branding</label>
    <label><input type="checkbox" /> Digital product</label>
    <label><input type="checkbox" /> Motion design</label>
  </div>
  <footer class="filter-sheet__footer">
    <button type="button">Apply filters</button>
  </footer>
</section>
```

```css
.filter-sheet {
  position: fixed;
  inset: auto 0 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - var(--safe-top));
  padding-bottom: var(--safe-bottom);
  border-radius: 1.5rem 1.5rem 0 0;
  background: #fff;
  color: #161616;
}

.filter-sheet__header,
.filter-sheet__footer {
  flex: none;
  padding: 1rem;
}

.filter-sheet__body {
  overflow: auto;
  min-height: 0;
  padding: 0 1rem 1rem;
}

.filter-sheet__footer {
  border-top: 1px solid #ddd;
}
```

**Review points:** The sheet has a bounded height, a scrollable content region, and a footer that remains visible. Production dialogs also need focus management, a close behavior, and correct focus restoration.

### Pattern 4: Landscape media controls

**What it solves:** Protects controls near the left and right edges when a full-screen visual enters landscape orientation.

**Use it when:** A media viewer, immersive artwork, or interactive installation uses the entire display.

```html
<div class="media-viewer">
  <img src="/images/installation-wide.webp" alt="Immersive installation with suspended light forms" />
  <div class="media-viewer__controls">
    <button type="button">Previous</button>
    <button type="button">Pause</button>
    <button type="button">Next</button>
  </div>
</div>
```

```css
.media-viewer {
  position: fixed;
  inset: 0;
  overflow: clip;
  background: #080a10;
}

.media-viewer > img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.media-viewer__controls {
  position: absolute;
  inset:
    auto calc(1rem + var(--safe-right))
    calc(1rem + var(--safe-bottom))
    calc(1rem + var(--safe-left));
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.media-viewer__controls button {
  min-width: 2.75rem;
  min-height: 2.75rem;
}
```

**Review points:** Both side insets are included, controls have generous touch targets, and the image does not hide the controls.

### Pattern 5: Reusable safe-area utility layer

**What it solves:** Makes the spacing policy consistent across headers, footers, dialogs, and full-bleed sections.

**Use it when:** Multiple components need safe-area behavior and the project needs a clear design-system contract.

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --content-gutter: clamp(1rem, 4vw, 2.5rem);
}

.safe-content {
  padding-top: calc(var(--content-gutter) + var(--safe-top));
  padding-right: calc(var(--content-gutter) + var(--safe-right));
  padding-bottom: calc(var(--content-gutter) + var(--safe-bottom));
  padding-left: calc(var(--content-gutter) + var(--safe-left));
}

.safe-content--minimum-gutter {
  padding-top: max(var(--content-gutter), var(--safe-top));
  padding-right: max(var(--content-gutter), var(--safe-right));
  padding-bottom: max(var(--content-gutter), var(--safe-bottom));
  padding-left: max(var(--content-gutter), var(--safe-left));
}
```

**Review points:** The two utility variants encode different policies. Document which one the design system expects so teams do not mix additive and minimum-gutter behavior by accident.

## Common Mistakes

| Mistake | Why it hurts | Better approach |
|---|---|---|
| Forgetting `viewport-fit=cover` when edge-to-edge behavior is intended | The viewport may not extend into the regions the design expects to handle. | Add the appropriate viewport declaration and test the target browser/display mode. |
| Hard-coding a notch height | Insets vary by device, orientation, and browser context. | Use the corresponding `env(safe-area-inset-*)` variable. |
| Applying only top and bottom insets | Landscape controls can collide with side cutouts or rounded corners. | Include left and right insets where edge content can appear. |
| Padding the entire page indiscriminately | Full-bleed backgrounds acquire unwanted bands and lose the intended composition. | Separate edge-to-edge visual layers from inset content layers. |
| Using only the safe-area inset as the gutter | On devices with zero inset, content may sit too close to the edge. | Combine the inset with a minimum design gutter using `max()` or `calc()`. |
| Adding the inset twice | Nested containers can accumulate excessive spacing. | Assign one clear component ownership of each inset. |
| Forgetting the fixed bar's content overlap | The final paragraph or button may sit behind the bar. | Reserve matching bottom space in the page content. |
| Extending the background but not the content padding | Controls may sit under the home indicator even though the surface looks correct. | Apply bottom inset padding to the inner control region. |
| Using `100vh` as the only full-screen strategy | Browser chrome can make the section taller or shorter than the visible area. | Choose `svh`, `lvh`, or `dvh` according to the interaction and test on devices. |
| Treating viewport units and safe areas as interchangeable | A full-height section can still put content beneath system UI. | Use viewport units for sizing and safe-area insets for content protection. |
| Forgetting landscape testing | A portrait layout may fail when side insets become relevant. | Test both orientations and short landscape viewports. |
| Ignoring anchor targets behind sticky headers | Users navigate to headings that remain obscured. | Apply deliberate `scroll-margin-top` to relevant anchor targets. |
| Giving a bottom sheet no maximum height | Its actions can fall outside the visible viewport when content is long. | Bound the sheet and let the body scroll independently. |
| Putting safe-area padding on both dialog and backdrop | Insets compound and make the modal too narrow or too short. | Decide whether the backdrop or the panel owns edge protection. |
| Assuming a keyboard is solved by `100dvh` | Virtual keyboards and visual viewport behavior vary by browser and input mode. | Test focus, scrolling, and bottom actions on physical devices. |
| Making debug outlines permanent | Diagnostic colors and borders ship into the product. | Keep debug utilities in development-only styles or remove them before release. |
| Using a single device emulator as final proof | Emulation may not reproduce app mode, gesture area, or browser chrome. | Validate the actual supported browser and installed-app mode on hardware. |
| Assuming environment variables are non-zero | Zero is valid when no inset is required. | Keep standard layout spacing independent of safe-area values. |
| Using logical properties without checking mapping | `padding-inline` maps to writing-mode directions, not explicit left/right values. | Use physical left/right properties where separate physical inset values are required, or carefully map logical values. |
| Placing a button flush to a rounded corner | The control can be hard to reach or visually clipped. | Use safe-area-aware gutters and preserve adequate target size. |
| Making the background stop at the safe area | The page can show a visible strip that clashes with the full-bleed design. | Extend the background surface to the edge and inset only its content. |
| Forgetting the top inset in an overlay | A close button may be hidden under the status area or cutout. | Add top inset space to the overlay's content or panel. |
| Using fixed pixel values for every spacing case | One value rarely fits narrow portrait and short landscape layouts. | Combine a responsive spacing token with dynamic inset values. |
| Assuming safe-area values can be read as ordinary constants in JavaScript | CSS environment values are not directly exposed as JavaScript properties. | Apply them in CSS or expose them through computed styles for diagnostics. |
| Applying `overflow: hidden` to the wrong ancestor | Menus and sheets can be clipped by a container that was meant to contain artwork. | Keep clipping on decorative layers and inspect stacking/overflow ancestors. |
| Ignoring fixed header overlap on small screens | Large titles can begin behind a persistent header. | Add scroll offsets and reserve the correct content space. |
| Applying inset padding to a full-screen canvas without resizing its drawing area | Controls may be safe while the canvas composition becomes distorted. | Separate canvas sizing from the safe content overlay and recalculate aspect ratio on resize. |
| Using `max()` where the design needs additive spacing | The total gutter may be smaller than the intended design value plus inset. | Use `calc(gutter + inset)` when the inset must be extra space. |
| Using `calc()` where the design needs only a minimum | Large insets and gutters can create excessive blank space. | Use `max(gutter, inset)` when either value should satisfy the same minimum requirement. |
| Testing only in portrait browser tabs | Installed app mode or landscape may expose different edge conditions. | Include browser tab, installed mode where supported, portrait, and landscape in the test matrix. |

## Mental Models

1. **Inset is dynamic:** Device and browser context determine safe-area values; avoid device-specific constants.
2. **Surface can bleed:** Backgrounds may reach the edge while controls and text remain inset.
3. **One owner per inset:** Assign safe-area padding to one clear component layer to avoid doubled spacing.
4. **Gutter policy matters:** `max()` enforces a minimum; `calc()` adds the inset to the design gutter.
5. **Height and safety differ:** Viewport units size the surface; safe-area variables protect content.
6. **Landscape changes the edges:** Left and right insets can matter as much as top and bottom.
7. **Fixed controls need page clearance:** Persistent bars must not hide the content behind them.
8. **Test the actual mode:** Browser tabs, installed apps, orientation, and keyboards can behave differently.
9. **Fallbacks remain valid:** A zero inset is normal; the layout still needs ordinary spacing.
10. **Debug visually:** A test overlay often reveals overlap more clearly than inspecting a value alone.

## Quick Reference

| Need | Recommended technique | Watch out for |
|---|---|---|
| Enable edge-to-edge layout | `viewport-fit=cover` | Verify the supported browser context |
| Read top inset | `env(safe-area-inset-top, 0px)` | Do not hard-code a device height |
| Read bottom inset | `env(safe-area-inset-bottom, 0px)` | Fixed bars need inner padding |
| Read left inset | `env(safe-area-inset-left, 0px)` | Important in landscape |
| Read right inset | `env(safe-area-inset-right, 0px)` | Important in landscape |
| Reuse inset values | Define `--safe-*` custom properties | Keep aliases centralized |
| Keep minimum gutter | `max(var(--gutter), var(--safe-left))` | This does not add the two values |
| Add inset to gutter | `calc(var(--gutter) + var(--safe-left))` | Can create larger total spacing |
| Full-bleed background | Absolute background layer with inset content | Do not inset the whole visual surface |
| Fixed bottom CTA | Add `var(--safe-bottom)` to inner padding | Reserve page clearance |
| Sticky header | Apply inset according to header surface design | Check anchor navigation |
| Fixed header | Include top inset in positioning/padding | Avoid adding it twice |
| Landscape controls | Include left and right inset variables | Test short landscape viewports |
| Full-screen hero | Choose `svh`, `lvh`, or `dvh` intentionally | Viewport sizing is not safe-area protection |
| Bottom sheet | Bound max-height and scroll body | Keep footer action reachable |
| Modal dialog | Protect close control and content | Do not double-apply inset padding |
| Scroll to heading | Use `scroll-margin-top` on target headings | Avoid hiding content under sticky UI |
| Reserve fixed bar space | Add matching bottom padding to content | Keep the value aligned with actual bar height |
| Debug insets | Temporary outlines and overlays | Remove diagnostics from production |
| Verify computed style | Inspect custom properties in DevTools | CSS environment values are not direct JS globals |
| Support zero inset | Retain ordinary spacing tokens | Zero is a valid device value |
| Handle virtual keyboard | Test focused fields and scroll behavior | `dvh` is not a universal keyboard fix |
| Prevent clipping | Check ancestor `overflow` and stacking contexts | Avoid clipping interactive overlays |
| Protect canvas controls | Separate safe overlay from canvas geometry | Recalculate drawing dimensions on resize |
| Support installed mode | Test home-screen/PWA display mode | Browser chrome may differ |
| Support orientation changes | Reflow layout while retaining dynamic insets | Do not replace insets with guessed media-query constants |
| Keep tap targets usable | Maintain adequate control size and spacing | Safe placement alone does not guarantee usability |
| Avoid duplicate padding | Define component ownership | Nested inset utilities can compound |
| Preserve content hierarchy | Keep title and CTA within safe content region | Background art can still bleed to edges |
| Handle fixed nav overlap | Account for bar height and inset | Last page section must remain reachable |
| Use logical CSS | Map logical axes intentionally | Physical inset variables remain left/right/top/bottom |
| Validate on hardware | Test target device and browser | Emulation is only an initial check |

## Build Challenge

### Project: Edge-aware mobile studio landing page

Build a responsive landing page for a fictional creative studio called **Northstar Assembly**. The design uses a full-bleed visual hero, a compact mobile header, a fixed contact action, and a bottom-sheet project filter. All essential controls must remain usable around screen cutouts and gesture areas.

**Requirements**

1. Include the viewport meta tag with `width=device-width`, `initial-scale=1`, and `viewport-fit=cover`.
2. Define `--safe-top`, `--safe-right`, `--safe-bottom`, and `--safe-left` once at the root.
3. Build a full-bleed hero whose background artwork reaches the screen edges.
4. Keep the hero heading and primary action inside a safe content layer.
5. Use a responsive spacing token combined with safe-area insets rather than hard-coded device-specific numbers.
6. Implement a fixed mobile contact bar that extends its background to the bottom edge.
7. Add safe-area padding to the contact bar's inner controls.
8. Reserve enough bottom space in the main content so the fixed bar never covers the final section.
9. Create a bottom-sheet filter with a bounded maximum height and a separately scrollable body.
10. Keep the bottom-sheet footer action above the home-indicator region.
11. Include a close control that remains visible beneath the top safe-area inset.
12. Add a landscape media-viewer variant whose controls respect left and right insets.
13. Use `svh`, `lvh`, or `dvh` only after choosing which viewport behavior the section needs.
14. Add anchor navigation to at least two case-study sections and ensure sticky headers do not cover their headings.
15. Include a development-only safe-area debug overlay.
16. Test the page at narrow portrait dimensions and short landscape dimensions.
17. Test a browser tab and an installed web-app display mode if the project supports one.
18. Test a focused form field and the virtual keyboard on at least one physical mobile device.
19. Verify that ordinary spacing remains appropriate when inset variables evaluate to zero.
20. Confirm that no inset is accidentally applied twice by nested layout components.
21. Keep decorative backgrounds full-bleed while preserving readable text contrast and safe controls.
22. Document which components own top, bottom, and side inset padding.
23. Capture screenshots in portrait and landscape, noting any differences in browser UI.
24. Write a short review note explaining how the layout distinguishes viewport sizing from safe-area protection.

**Expected output**

- A responsive landing page with a full-bleed hero.
- A centralized safe-area utility layer.
- A fixed bottom action bar and a safe bottom sheet.
- A landscape-ready media overlay.
- A small test report with screenshots and notes from target-device checks.

**Success criteria**

- No essential text or control is clipped by cutouts, rounded corners, or the home-indicator region.
- Background surfaces can reach the screen edges without pulling content into unsafe areas.
- Fixed controls do not obscure the last section of the page.
- Bottom sheets remain scrollable and keep their primary action reachable.
- The layout does not depend on hard-coded notch dimensions.
- Portrait and landscape layouts remain intentional.
- The implementation clearly documents the difference between `env(safe-area-inset-*)` and viewport height units.
- Debugging styles are absent from the production build.

### Senior review checklist

- Does the viewport configuration match the intended edge-to-edge behavior?
- Are all four safe-area variables considered where relevant?
- Is the distinction between background bleed and content padding clear?
- Does every fixed component have an explicit inset owner?
- Can the user reach the last item beneath fixed navigation?
- Does the modal remain usable with long content and a virtual keyboard?
- Are landscape controls protected on both sides?
- Does the page behave sensibly when inset values are zero?
- Were the actual target browser and display mode tested?
- Is the spacing policy consistent: minimum gutter or additive gutter?

## Additional Implementation Patterns

### Safe header with a full-bleed background

```html
<header class="app-header">
  <div class="app-header__inner">
    <a href="/" class="brand">Northstar</a>
    <button type="button" aria-label="Open navigation">Menu</button>
  </div>
</header>
``` 

```css
.app-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  padding-top: var(--safe-top);
  background: rgb(16 18 26 / 0.92);
}

.app-header__inner {
  min-height: 3.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-inline: calc(1rem + var(--safe-left)) calc(1rem + var(--safe-right));
}
```

### Footer surface that reaches the edge

```css
.app-footer {
  padding:
    2rem
    calc(1.25rem + var(--safe-right))
    calc(2rem + var(--safe-bottom))
    calc(1.25rem + var(--safe-left));
  background: #10121a;
  color: #fff;
}
```

### Inset-aware toast

```css
.toast-region {
  position: fixed;
  z-index: 500;
  inset:
    calc(1rem + var(--safe-top))
    calc(1rem + var(--safe-right))
    auto
    calc(1rem + var(--safe-left));
  display: flex;
  justify-content: center;
  pointer-events: none;
}

.toast {
  max-width: 32rem;
  padding: 0.9rem 1rem;
  border-radius: 0.75rem;
  pointer-events: auto;
}
```

### Inset-aware floating support button

```css
.support-button {
  position: fixed;
  z-index: 80;
  right: calc(1rem + var(--safe-right));
  bottom: calc(1rem + var(--safe-bottom));
  min-width: 3rem;
  min-height: 3rem;
  border-radius: 50%;
}
```

### Use a CSS variable to simplify repeated calculations

```css
:root {
  --page-gutter: clamp(1rem, 4vw, 2.5rem);
}

.inset-container {
  padding-inline-start: calc(var(--page-gutter) + var(--safe-left));
  padding-inline-end: calc(var(--page-gutter) + var(--safe-right));
}
```

### Keep the header and page scroll offset aligned

```css
:root {
  --header-content-height: 4rem;
  --header-total-height: calc(var(--header-content-height) + var(--safe-top));
}

.case-study-heading {
  scroll-margin-top: calc(var(--header-total-height) + 1rem);
}
```

### Use safe areas with a full-screen dialog

```css
.fullscreen-dialog {
  position: fixed;
  inset: 0;
  overflow: auto;
  box-sizing: border-box;
  padding:
    calc(1rem + var(--safe-top))
    calc(1rem + var(--safe-right))
    calc(1rem + var(--safe-bottom))
    calc(1rem + var(--safe-left));
  background: #fff;
  color: #151515;
}
```

### Create a visual boundary for QA

```css
html.debug-safe-areas::after {
  content: "";
  position: fixed;
  z-index: 99999;
  inset: var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left);
  outline: 2px dashed #f0f;
  pointer-events: none;
}
```

### Switch debug mode without editing stylesheets

```js
function setSafeAreaDebug(enabled) {
  document.documentElement.classList.toggle("debug-safe-areas", enabled);
}
```

### Handle orientation change with normal layout rules

```js
const orientationQuery = matchMedia("(orientation: landscape)");

function updateOrientationClass() {
  document.documentElement.classList.toggle("is-landscape", orientationQuery.matches);
}

updateOrientationClass();
orientationQuery.addEventListener("change", updateOrientationClass);
```

### Ensure a sheet body can shrink inside flex layout

```css
.sheet {
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - var(--safe-top));
}

.sheet__body {
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

### Protect a close button in a modal

```css
.dialog-close {
  position: sticky;
  top: var(--safe-top);
  margin-left: auto;
  z-index: 1;
  min-width: 2.75rem;
  min-height: 2.75rem;
}
```

### Keep a full-bleed image separate from controls

```css
.viewer-art {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.viewer-toolbar {
  position: absolute;
  inset:
    calc(0.75rem + var(--safe-top))
    calc(0.75rem + var(--safe-right))
    auto
    calc(0.75rem + var(--safe-left));
}
```

### Avoid inset padding in both parent and child

```css
/* The shell owns safe-area padding; children use normal component spacing. */
.app-shell {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
}

.app-shell__content {
  padding: 1rem;
}
```

### Reserve space for a bottom navigation row

```css
:root {
  --bottom-nav-height: 4rem;
}

.page-with-bottom-nav {
  padding-bottom: calc(var(--bottom-nav-height) + var(--safe-bottom) + 1rem);
}
```

