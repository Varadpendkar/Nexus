# SKILL: viewport-units-mobile

**Layer:** 08 — Responsive Mobile

**Goal:** Build viewport-aware mobile layouts that adapt to browser chrome, dynamic visible height, orientation, and device safe areas without clipping content or creating scroll traps.

## Why This Matters (Senior Perspective)

A mobile viewport is not one permanently stable rectangle. The layout viewport, visual viewport, browser chrome, system UI, and software keyboard can each affect what a person can actually see. The address bar and bottom toolbar may expand or retract as the page scrolls. The keyboard can obscure the lower part of a form. A layout that assumes `100vh` always equals the currently visible area may put a close button under browser chrome, push the primary action below an inaccessible edge, or cut off content when a heading wraps.

A senior developer chooses viewport units according to the design contract instead of applying one unit everywhere. `svh` refers to the small viewport, `lvh` to the large viewport, and `dvh` to the dynamic viewport. They represent different constraints, not competing spellings. Use a small viewport when the first-screen composition must fit while browser UI is expanded; use dynamic height when an overlay should follow the currently available viewport; use normal document flow when content needs to grow. Keep a legacy fallback and let CSS own ordinary layout rather than introducing JavaScript measurements without a demonstrated need.

Viewport sizing also interacts with safe-area insets, fixed positioning, sticky headers, text zoom, orientation, and keyboard behavior. A portfolio hero can be expressive without trapping its headline inside a rigid artboard. A mobile drawer can cover the intended region while keeping its close control visible. A booking form can remain usable when the keyboard appears. Treat viewport sizing as a constraint system, test real devices, and preserve a natural route to every piece of content.

## Core Concepts

### 1. Understand the viewport unit families

**Mental model:** The unit expresses which viewport measurement should control the layout. `vh` is the legacy unit; `svh`, `lvh`, and `dvh` distinguish the small, large, and dynamic viewport heights.

- `svh` is useful when the section should fit with retractable browser UI expanded.
- `lvh` describes the largest viewport when browser UI is retracted.
- `dvh` tracks the dynamic viewport as browser controls change.
- `vh` is not a guarantee of the currently visible height in every mobile state.

Use a fallback first, then override it with a supported unit. Prefer `min-height` for content that can grow. A fixed `height` can become a clipping boundary when text wraps or validation messages appear.

```css
.mobile-hero {
  min-height: 100vh;  /* Keep a usable fallback for older engines. */
  min-height: 100svh; /* Fit the conservative viewport when browser UI is expanded. */
}
```

```css
.mobile-drawer {
  height: 100vh;
  height: 100dvh; /* Track changing browser chrome for a full-screen surface. */
  overflow-y: auto;
}
```

```css
.immersive-canvas {
  min-height: 100lvh; /* Use the large viewport only when that larger canvas is intentional. */
}
```

```css
@supports (height: 100dvh) {
  .modal-stage { height: 100dvh; }
}
```

```css
.story-section {
  min-height: 100svh;
  height: auto; /* Content may expand beyond the initial viewport. */
  padding-block: 3rem;
}
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 2. Choose units from the interaction contract

**Mental model:** A hero, a dialog, and an article make different promises. Choose the viewport reference based on what must remain visible and what may scroll.

A hero often needs a conservative minimum height, while a full-screen overlay should track the visible area. An article, settings page, or form usually belongs in normal document flow. A design may still use a viewport minimum for rhythm, but it should not lock a long page into a single screen. Ask what should happen when the headline becomes two lines, the user enlarges text, or the device rotates before deciding between `height` and `min-height`.

```css
.portfolio-hero {
  min-height: 100svh;
  display: grid;
  align-content: center;
  gap: clamp(1.5rem, 4vh, 3rem);
}
```

```css
.contact-page {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
}
.contact-page main { flex: 1; }
```

```css
.dialog-card {
  max-height: calc(100dvh - 2rem);
  overflow-y: auto; /* Scroll the bounded surface instead of clipping its content. */
}
```

```css
.hero-actions {
  display: flex;
  flex-wrap: wrap; /* Actions can move to another row instead of overflowing. */
  gap: .75rem;
}
```

```css
.campaign-intro {
  min-height: 100svh;
  padding: max(2rem, env(safe-area-inset-top, 0px)) 1.25rem 2rem;
}
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 3. Distinguish layout viewport and visual viewport

**Mental model:** CSS layout uses a layout viewport, while the visual viewport describes the region currently visible to the user. Pinch zoom and the software keyboard can affect the visible region in ways that ordinary layout measurements do not fully express.

CSS units are sufficient for most page layout. The Visual Viewport API is appropriate for a specialized floating accessory that must follow the visible area or a zoom-aware canvas. Do not use it as the default tool for a hero or ordinary section. If you subscribe to viewport events, batch the work and remove listeners when the component is destroyed.

```js
function getVisibleViewport() {
  const viewport = window.visualViewport;
  if (!viewport) {
    return { width: window.innerWidth, height: window.innerHeight, offsetTop: 0, offsetLeft: 0 };
  }
  return {
    width: viewport.width,
    height: viewport.height,
    offsetTop: viewport.offsetTop,
    offsetLeft: viewport.offsetLeft
  };
}
```

```js
function scheduleViewportUpdate(update) {
  let frame = 0;
  return () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };
}
```

```js
function observeVisualViewport(update) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  const schedule = scheduleViewportUpdate(update);
  viewport.addEventListener("resize", schedule);
  viewport.addEventListener("scroll", schedule);
  return () => {
    viewport.removeEventListener("resize", schedule);
    viewport.removeEventListener("scroll", schedule);
  };
}
```

```js
function visibleHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}
```

```js
function bottomObstruction() {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  return Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
}
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 4. Treat the software keyboard as a separate constraint

**Mental model:** The keyboard is an input-related obstruction, not simply a smaller phone. Forms should remain scrollable, focused fields should remain reachable, and submit controls should not depend on a rigid viewport-sized card.

Keep long forms in normal flow. Use `scroll-margin-block` to account for sticky headers, and let the page scroll when the keyboard appears. Only implement a keyboard-aware floating control when the product truly requires one and the target browser behavior has been tested. Do not disable pinch zoom or rely on one universal `innerHeight` behavior.

```css
.contact-form input,
.contact-form textarea,
.contact-form select {
  scroll-margin-block: 6rem; /* Leave room for a sticky header when the field receives focus. */
}
```

```css
.contact-form-shell {
  min-height: 100svh;
  height: auto; /* Validation messages and enlarged text can increase content height. */
  display: flex;
  flex-direction: column;
}
```

```js
function revealFocusedField(field) {
  requestAnimationFrame(() => {
    field.scrollIntoView({ block: "nearest", behavior: "auto" });
  });
}
```

```css
.contact-submit-row {
  position: sticky;
  bottom: 0;
  padding: 1rem 0 max(1rem, env(safe-area-inset-bottom, 0px));
  background: white;
}
```

```js
function observeFormFocus(form, onChange) {
  form.addEventListener("focusin", event => onChange(event.target));
  form.addEventListener("focusout", () => onChange(null));
}
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 5. Combine viewport sizing with safe-area insets

**Mental model:** Viewport units describe size; safe-area insets describe edges where important content may be obscured. Correct height does not guarantee safe placement.

For edge-to-edge layouts, opt into `viewport-fit=cover` only when the design intentionally extends to the device edges. Pad the content at relevant edges with `env(safe-area-inset-*)` and provide fallback values. Apply the inset where the control actually touches the edge; nested padding can otherwise count the same inset twice.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.full-bleed {
  min-height: 100vh;
  min-height: 100dvh;
  padding:
    max(1rem, env(safe-area-inset-top, 0px))
    max(1rem, env(safe-area-inset-right, 0px))
    max(1rem, env(safe-area-inset-bottom, 0px))
    max(1rem, env(safe-area-inset-left, 0px));
}
```

```css
.fixed-action {
  position: fixed;
  inset-inline: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
```

```css
.bottom-toolbar {
  padding-bottom: calc(.75rem + env(safe-area-inset-bottom, 0px));
}
```

```css
.top-overlay {
  position: fixed;
  inset: 0 0 auto;
  padding-top: max(1rem, env(safe-area-inset-top, 0px));
}
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 6. Handle orientation and short viewports

**Mental model:** Width and height trade places in landscape, and a short viewport may be more constrained vertically than a narrow portrait viewport. Do not use height as a proxy for a device brand.

Centered hero content can become unusable when the device rotates. Use a short-height media query to align content toward the top and allow the document to scroll. Never hide a primary action just to preserve a screenshot composition. The goal is to preserve reachability and legibility, not to keep a portrait crop unchanged.

```css
.hero {
  min-height: 100svh;
  display: grid;
  align-content: center;
  padding: 2rem 1.25rem;
}
```

```css
@media (orientation: landscape) and (max-height: 32rem) {
  .hero { min-height: auto; align-content: start; padding-block: 1rem; }
}
```

```css
@media (max-height: 28rem) {
  .hero__eyebrow { margin-bottom: .5rem; }
  .hero__title { font-size: clamp(2rem, 6vw, 3.5rem); }
}
```

```js
function recordOrientation() {
  document.documentElement.dataset.orientation =
    window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}
window.addEventListener("orientationchange", () => requestAnimationFrame(recordOrientation));
```

```css
.hero__actions {
  position: static; /* Keep the action in flow when vertical space is limited. */
  margin-top: 1.5rem;
}
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 7. Understand fixed, sticky, and absolute positioning

**Mental model:** Positioning determines which coordinate system controls an element. `fixed` follows a viewport-like containing block, `sticky` remains in document flow until its threshold, and `absolute` follows a positioned ancestor.

Fixed controls need safe-area offsets and content clearance. Sticky controls often work better when they should remain attached to a section while preserving their occupied space. Transforms, filters, and containment on ancestors can establish a containing block for fixed descendants; a fixed button that moves with a section may be responding to its ancestor, not to viewport units.

```css
.section-toolbar { position: sticky; top: 0; z-index: 10; }
```

```css
.support-button {
  position: fixed;
  inset-inline-end: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
}
```

```css
.overlay { position: fixed; inset: 0; height: 100vh; height: 100dvh; }
.overlay__content { max-height: 100%; overflow-y: auto; }
```

```css
.hero__badge {
  position: absolute;
  inset-inline-end: 1rem;
  inset-block-start: 1rem;
}
```

```css
[id] { scroll-margin-top: 5rem; }
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 8. Prevent overflow without clipping content

**Mental model:** Viewport sizing should establish a minimum canvas, not a cage. Content can grow; internal scrolling belongs to bounded surfaces that genuinely need it.

Avoid fixed viewport heights on unpredictable copy, translated labels, forms, and dynamic validation. Let the page scroll normally. For an overlay, constrain the panel and make the body scroll rather than clipping it. In flex layouts, a scrollable child often needs `min-height: 0` so it can shrink inside its parent.

```css
.feature-section {
  min-height: 100svh;
  height: auto;
  padding-block: clamp(2rem, 8vh, 6rem);
}
```

```css
.page-layout, .page-layout__content { min-width: 0; }
```

```css
.hero__copy { overflow-wrap: anywhere; }
```

```css
.drawer__body { min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
```

```css
.drawer {
  display: flex;
  flex-direction: column;
  max-height: 100dvh;
}
.drawer__body { flex: 1; min-height: 0; overflow: auto; }
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 9. Use progressive enhancement and fallbacks

**Mental model:** The baseline layout should work without advanced viewport features. New units improve geometry; they should not be the only reason content remains usable.

Declare a fallback first and override it with a modern unit. A feature query can clarify support boundaries, but ordinary layout usually does not need a JavaScript support flag. Introduce JavaScript only if application behavior—not just one CSS declaration—must change based on support.

```css
.mobile-stage { min-height: 100vh; }
@supports (height: 100svh) {
  .mobile-stage { min-height: 100svh; }
}
```

```css
@supports (height: 100dvh) {
  .modal-stage { height: 100dvh; }
}
```

```css
@supports not (height: 100dvh) {
  .modal-stage { height: 100vh; }
}
```

```js
const supportsDynamicViewport = CSS.supports("height: 100dvh");
document.documentElement.dataset.dynamicViewport = String(supportsDynamicViewport);
```

```css
html[data-dynamic-viewport="true"] .dynamic-panel { height: 100dvh; }
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

### 10. Measure only when CSS is insufficient

**Mental model:** CSS owns declarative layout; JavaScript should measure only behavior that CSS cannot express. Repeated layout reads and writes during resize can cause jank.

For a specialized accessory, batch visual viewport updates with `requestAnimationFrame`, avoid polling, and remove listeners when the component is destroyed. Do not rewrite a CSS height variable on every scroll when `100dvh` already expresses the requirement. If measurement is necessary, read geometry first, then apply styles in one scheduled pass.

```js
function createViewportUpdater(update) {
  let frame = 0;
  return () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => { frame = 0; update(); });
  };
}
```

```js
function subscribeToVisualViewport(update) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  const schedule = createViewportUpdater(update);
  viewport.addEventListener("resize", schedule);
  viewport.addEventListener("scroll", schedule);
  return () => {
    viewport.removeEventListener("resize", schedule);
    viewport.removeEventListener("scroll", schedule);
  };
}
```

```js
function measurePanel(panel) {
  const available = window.visualViewport?.height ?? window.innerHeight;
  const current = panel.getBoundingClientRect().height;
  panel.style.setProperty("--available-height", `${available}px`);
  panel.dataset.needsCompactLayout = String(current > available);
}
```

```css
.custom-keyboard-panel {
  max-height: var(--available-height, 100dvh);
  overflow-y: auto;
}
```

```js
const stopTracking = subscribeToVisualViewport(() => measurePanel(document.querySelector(".custom-keyboard-panel")));
// Call stopTracking() when the component is removed or its route is left.
```

**Gotchas to verify:** Check the exact device/browser state, including expanded browser chrome, short landscape, text zoom, and focused form fields. If a declaration is unsupported, the fallback must still produce a usable layout. If JavaScript measures the viewport, verify its coordinate system and clean up its listeners.

## Reusable Patterns

### Pattern 1: Stable mobile hero

Use this for a creative portfolio hero whose first-screen composition should fit the small viewport, while its content can still expand.

```html
<section class="studio-hero">
  <p class="studio-hero__eyebrow">Independent digital studio</p>
  <h1>Digital experiences built to move people.</h1>
  <p class="studio-hero__summary">Strategy, design, and engineering for ambitious teams.</p>
  <div class="studio-hero__actions"><a href="/work">Explore selected work</a><a href="/contact">Start a project</a></div>
</section>
```

```css
.studio-hero {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 1rem;
  padding: max(2rem, env(safe-area-inset-top, 0px)) max(1.25rem, env(safe-area-inset-right, 0px)) max(2rem, env(safe-area-inset-bottom, 0px)) max(1.25rem, env(safe-area-inset-left, 0px));
}
.studio-hero h1 {
  max-width: 12ch;
  font-size: clamp(2.5rem, 11vw, 6rem);
  line-height: .98;
  text-wrap: balance;
}
.studio-hero__actions { display: flex; flex-wrap: wrap; gap: .75rem; }
.studio-hero__actions a { min-height: 44px; display: inline-flex; align-items: center; padding: .75rem 1rem; }
@media (max-height: 30rem) { .studio-hero { align-content: start; } }
```

### Pattern 2: Dynamic-height modal content

Use this for a full-screen menu or filter panel that must respond to changing browser chrome.

```html
<dialog class="mobile-dialog" aria-labelledby="filter-heading">
  <header><h2 id="filter-heading">Refine project search</h2><button type="button" data-dialog-close>Close</button></header>
  <div class="mobile-dialog__body"><p>Choose a service, budget, and timeline.</p></div>
</dialog>
```

```css
.mobile-dialog {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: max(1rem, env(safe-area-inset-top, 0px)) 1.25rem max(1rem, env(safe-area-inset-bottom, 0px));
  border: 0;
  background: #10121a;
  color: white;
}
.mobile-dialog__body { max-height: calc(100dvh - 8rem); overflow-y: auto; overscroll-behavior: contain; }
```

```js
const dialog = document.querySelector(".mobile-dialog");
document.querySelector("[data-dialog-close]").addEventListener("click", () => dialog.close());
function openFilterDialog(opener) {
  dialog.showModal();
  dialog.querySelector("button").focus();
  dialog.addEventListener("close", () => opener.focus(), { once: true });
}
```

Use a native dialog for a modal interaction where possible. A custom `role="dialog"` overlay is not complete unless it also manages focus, background interaction, Escape, and focus restoration.

### Pattern 3: Keyboard-aware floating action

Use only when a floating action must stay visible above the software keyboard and ordinary CSS does not meet the target behavior.

```html
<button class="keyboard-action" type="button">Send request</button>
```

```css
.keyboard-action {
  position: fixed;
  inset-inline: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom, 0px) + var(--keyboard-obstruction, 0px));
  min-height: 48px;
}
```

```js
function installKeyboardAwareAction(button) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  let frame = 0;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const obstruction = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      button.style.setProperty("--keyboard-obstruction", `${obstruction}px`);
    });
  };
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  return () => {
    cancelAnimationFrame(frame);
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
    button.style.removeProperty("--keyboard-obstruction");
  };
}
```

Test on physical Safari and Chrome. Keyboard events and visual viewport changes are not identical across every browser configuration.

### Pattern 4: Scrollable full-screen drawer

Use this when a menu or filter drawer can contain more content than fits in landscape.

```html
<aside class="viewport-drawer" aria-label="Project filters">
  <header class="viewport-drawer__header"><h2>Filter projects</h2><button type="button">Close filters</button></header>
  <div class="viewport-drawer__body"><p>Choose disciplines to explore.</p></div>
  <footer class="viewport-drawer__footer"><button type="button">Apply filters</button></footer>
</aside>
```

```css
.viewport-drawer {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.viewport-drawer__header, .viewport-drawer__footer { flex: none; padding: 1rem; }
.viewport-drawer__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 1rem; }
```

The close and apply controls stay outside the scrolling body while the long list can scroll. Connect this layout to a real open/close interaction and use modal semantics only when modal behavior is implemented.

### Pattern 5: Short-landscape hero

Use this for phones rotated sideways and other contexts with limited vertical space.

```css
.campaign-hero {
  min-height: 100svh;
  display: grid;
  align-content: center;
  padding: 2rem;
}
@media (orientation: landscape) and (max-height: 32rem) {
  .campaign-hero { min-height: auto; align-content: start; padding-block: 1rem; }
  .campaign-hero h1 { font-size: clamp(2rem, 6vw, 3.5rem); }
}
```

The goal is not to preserve a perfect screenshot crop. Keep the title, action, and required context reachable without forcing users to zoom out.

## Common Mistakes

| Mistake | Why it fails | Better fix |
|---|---|---|

| Treating `100vh` as visible height | Expanded browser chrome can cover content. | Use `svh` or `dvh` based on the intended behavior and retain a fallback. |

| Replacing every `vh` with `dvh` | Dynamic resizing may cause unnecessary reflow in stable editorial layouts. | Choose a unit based on the design contract. |

| Using fixed `height` on long content | Wrapped text and validation messages can be clipped. | Prefer `min-height` and normal document flow. |

| Using `100lvh` for a critical CTA | The largest viewport may exceed the currently visible area. | Use a conservative small viewport or allow scrolling. |

| Omitting fallback declarations | Older engines may ignore modern units. | Declare a legacy value first, then the modern override. |

| Applying safe-area padding to the wrong ancestor | Controls can still overlap unsafe edges or become doubly inset. | Apply insets at the edge-owning component and audit nesting. |

| Ignoring `viewport-fit=cover` implications | Full-bleed content may collide with cutouts. | Opt in intentionally and pad critical content with safe-area variables. |

| Locking a form to viewport height | The keyboard and validation content can outgrow the box. | Keep forms scrollable and let their container grow. |

| Using only `innerHeight` for keyboard handling | It does not describe all visible viewport changes consistently. | Use the Visual Viewport API only for proven special cases. |

| Leaving viewport listeners attached | Route changes can accumulate listeners and stale closures. | Return a cleanup function and call it during teardown. |

| Updating on every resize event | Bursts of events can create layout jitter. | Coalesce work with `requestAnimationFrame`. |

| Reading layout after every style write | Forced synchronous layout can harm responsiveness. | Batch measurements before applying styles. |

| Hiding document overflow to fix a drawer | Users may lose access to page content. | Constrain scrolling to the bounded panel that needs it. |

| Forgetting `min-height: 0` in a flex drawer | The scrollable child may refuse to shrink. | Set `min-height: 0` on the intended scrolling child. |

| Using a fixed footer without content clearance | The last field or link can sit underneath it. | Reserve bottom space and include the safe-area inset. |

| Centering all hero content in landscape | A short viewport can push actions off-screen. | Use a short-height rule and align content toward the start. |

| Treating orientation as a device type | Foldables and resizable windows invalidate the assumption. | Respond to available dimensions instead of handset labels. |

| Applying visual viewport offsets twice | Floating controls drift from the visible region. | Define the coordinate system and apply each offset once. |

| Smooth-scrolling every focused field | Repeated focus can create disorienting movement. | Use immediate or reduced-motion-aware focus scrolling. |

| Disabling pinch zoom | It harms accessibility and hides layout weaknesses. | Support zoom and allow content to grow and scroll. |

| Using a fixed pixel height for every phone | Small devices and landscape can be clipped. | Combine viewport constraints with flexible content. |

| Using `overflow:hidden` to conceal defects | Text and focus rings may disappear. | Fix sizing and wrapping before clipping. |

| Assuming safe-area values are always nonzero | One-device testing can hide fallback defects. | Supply `env(..., 0px)` fallbacks and test multiple devices. |

| Measuring every normal hero with JavaScript | It adds complexity without a real benefit. | Use CSS viewport units for declarative layout. |

| Skipping rotation tests | Cached dimensions may leave a panel incorrectly sized. | Re-measure after layout settles and test repeated rotations. |

| Sizing a canvas but not its controls | The canvas changes size while actions remain clipped. | Use a consistent viewport model for interactive controls. |

| Putting fixed controls under a transformed ancestor | The ancestor may become the containing block. | Move the control to a suitable root or remove the unintended trigger. |

| Allowing long URLs to widen the page | Horizontal scrolling damages the layout. | Apply `overflow-wrap: anywhere` to long content. |

| Assuming keyboard changes always emit resize | Browser behavior differs. | Keep forms scrollable and validate target browsers. |

| Testing only in desktop emulation | Browser chrome and keyboard details may be absent. | Verify on physical iOS and Android devices. |

## Mental Models

1. **Small viewport is conservative:** `svh` is useful when first-screen content must fit with browser UI expanded.
2. **Large viewport is aspirational:** `lvh` describes the largest viewport, not necessarily the currently visible region.
3. **Dynamic viewport follows chrome:** `dvh` changes as retractable browser UI changes.
4. **Minimum height permits growth:** `min-height` sets a floor without trapping content.
5. **Visual viewport is specialized:** Use its API when a component must track the currently visible region.
6. **Keyboard is an obstruction:** Focused fields and actions must remain reachable.
7. **Safe area is separate from height:** Correct dimensions still need inset-aware placement.
8. **Short landscape changes priorities:** Reachability matters more than preserving a portrait composition.
9. **CSS owns normal layout:** JavaScript measurements are for behavior CSS cannot express.
10. **Overflow needs an owner:** Let the document or a bounded panel scroll intentionally.

## Quick Reference

| Requirement | Prefer | Notes |
|---|---|---|
| Legacy fallback | `100vh` first | Older browsers can ignore newer declarations. |
| Conservative hero | `100svh` | Useful with browser chrome expanded. |
| Largest canvas | `100lvh` | May exceed currently visible space. |
| Dynamic full-screen panel | `100dvh` | Tracks browser UI changes. |
| Content-heavy section | `min-height` | Allows content to grow. |
| Rigid `height` | Use sparingly | Can clip wrapped copy and validation. |
| Edge-to-edge layout | `viewport-fit=cover` with safe padding | Opt in intentionally. |
| Top inset | `env(safe-area-inset-top, 0px)` | Protects content near cutouts. |
| Bottom inset | `env(safe-area-inset-bottom, 0px)` | Protects home-indicator region. |
| Horizontal inset | Left/right safe-area variables | Important in landscape. |
| Fixed bottom action | `bottom: calc(... + env(...))` | Reserve content space behind it. |
| Long panel | `max-height` plus `overflow-y:auto` | Keep content reachable. |
| Flex drawer body | `min-height:0; overflow:auto` | Allows the child to shrink. |
| Focused field | `scroll-margin-block` | Keeps field clear of sticky UI. |
| Keyboard-aware accessory | Visual Viewport API | Use only when CSS is insufficient. |
| Resize burst | `requestAnimationFrame` | Coalesces updates. |
| Event subscription | Cleanup function | Prevents leaks after route changes. |
| Short landscape | Height media query | Adapt to actual available height. |
| Article or form | Normal document flow | Usually the safest default. |
| Fixed overlay | `position:fixed; inset:0` | Give inner content a scroll path. |
| Scroll boundary | `overscroll-behavior:contain` | Reduces scroll chaining. |
| Text zoom | Flexible sizing and `min-height` | Never disable zoom to preserve layout. |
| Long words | `overflow-wrap:anywhere` | Avoids horizontal overflow. |
| Transformed ancestor | Inspect fixed containing block | Transforms can alter fixed positioning. |
| Feature support | `@supports (height: 100dvh)` | Keep fallback declarations intact. |
| Device validation | Physical iOS and Android hardware | Browser chrome differs. |
| Hero alignment | Center plus short-height override | Protects actions in landscape. |
| Visual viewport fallback | `window.innerHeight` | Approximation, not a universal keyboard detector. |
| CSS versus JS | CSS first | Measure only for specialized behavior. |
| Fixed bottom bar | Safe-area padding and page clearance | Avoids covering content. |
| Orientation change | Re-measure after layout settles | Avoid stale dimensions. |
| Modal surface | Dynamic height plus internal scrolling | Do not clip required controls. |
| Layout diagnostic | `getBoundingClientRect()` | Batch reads before writes. |
| Touch target | Practical minimum around 44 CSS px | Keep primary controls reachable. |
| Reduced motion | Respect `prefers-reduced-motion` | Avoid unnecessary animated scrolling. |
| Viewport meta | `width=device-width, initial-scale=1` | Do not disable zoom. |
| Overflow test | Check `scrollWidth` against `clientWidth` | Identify horizontal spill. |

## Build Challenge

Build a **mobile-first campaign page for a creative studio** with a viewport-aware hero, a full-screen menu or filter drawer, and a contact form. It should feel intentional on a small portrait phone and remain usable when rotated into landscape.

### Requirements

1. Create a semantic hero with a meaningful headline, summary, and two real destination actions.
2. Use `min-height: 100vh` as a fallback and a suitable modern viewport unit afterward.
3. Explain why you chose `svh`, `lvh`, or `dvh` for each viewport-sized surface.
4. Let the hero grow when its headline or actions wrap.
5. Add a short-landscape layout rule based on available height.
6. Include a fixed or sticky control only when it provides a clear benefit.
7. Account for safe-area insets when a control touches a screen edge.
8. Make a full-screen drawer's long content scrollable.
9. Keep the close control reachable when the drawer content is long.
10. Keep the contact form in normal flow and allow validation messages to expand it.
11. Keep focused inputs visible when the software keyboard opens.
12. Do not disable user zoom.
13. Prevent long labels and URLs from causing horizontal page overflow.
14. Use `min-height: 0` where a flex child must scroll inside a bounded panel.
15. Use the Visual Viewport API only when a demonstrated interaction requires it.
16. Batch viewport event updates and remove listeners during teardown.
17. Add `env()` fallbacks for safe-area values.
18. Test at 320 CSS pixels and at 200% text zoom.
19. Test portrait and landscape with browser chrome expanded and collapsed.
20. Test keyboard behavior on a physical device or clearly record it as unverified.
21. Test on at least one iOS and one Android browser if available.
22. Confirm the last action and final form field remain reachable.
23. Document browser-specific behavior rather than claiming universal support.
24. Include a README recording unit choices, fallbacks, device matrix, and unresolved risks.

### Expected output

A working responsive page with semantic HTML, CSS, and only the JavaScript required for specialized viewport interactions. Include a concise test report listing viewport dimensions, browser/device, orientation, keyboard state, and observed clipping or scroll behavior.

### Success criteria

- The hero works with browser controls expanded and retracted.
- Content grows instead of clipping when copy wraps or text is enlarged.
- Each viewport unit matches a documented interaction requirement.
- Safe-area padding protects edge-attached controls.
- The drawer remains scrollable in short landscape.
- The form stays usable with the software keyboard.
- JavaScript measurements, if present, are batched and cleaned up.
- Zoom remains available and the layout tolerates it.
- There is no unintended horizontal overflow.
- Testing claims match the devices and conditions actually checked.

## Senior Review Notes

When reviewing viewport code, ask why each height constraint exists. A blanket `height: 100vh` often means the screenshot was treated as the specification. Ask what happens when the title wraps, a CTA becomes two lines, browser chrome expands, the keyboard appears, or the device rotates. The goal is not to eliminate viewport units; it is to use them with an explicit understanding of their limits.

A strong implementation keeps the content model simple. The document scrolls for ordinary page content. A bounded overlay scrolls internally when it must remain within the visible area. Safe-area insets protect controls near screen edges. Modern units improve geometry while fallbacks preserve basic usability. JavaScript is introduced only when a specific interaction needs information CSS cannot express, and every subscription has a cleanup path.

For a polished portfolio, do not make the first viewport a rigid artboard. Keep the headline expressive, but let it wrap. Keep the CTA prominent, but allow it to move below the fold if the available space is genuinely small. In short landscape, choose legibility over a forced cinematic crop. The page should feel designed for the device, not squeezed into a desktop screenshot.

## Additional Focused Patterns

These small patterns are useful during review and debugging. Use only the patterns that solve a real requirement; do not add JavaScript measurements merely because an API exists.

### Normalize a viewport-dependent panel's height

```css
.panel {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
```

### Keep a child scrollable inside a flex column

```css
.panel__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
```

### Respect a reduced-motion preference

```css
@media (prefers-reduced-motion: reduce) {
  .viewport-panel { scroll-behavior: auto; transition: none; animation: none; }
}
```

### Keep an anchor target clear of a sticky header

```css
[id] { scroll-margin-block-start: 5rem; }
```

### Prevent long text from widening the viewport

```css
.rich-copy { min-width: 0; overflow-wrap: anywhere; }
```

### Check for horizontal overflow during debugging

```js
function hasHorizontalOverflow(element = document.documentElement) {
  return element.scrollWidth > element.clientWidth;
}
```

### Feature-detect a modern viewport unit

```js
const supportsSmallViewport = CSS.supports("height: 100svh");
```

### Use a safe-area fallback

```css
.edge-control { padding-bottom: calc(.75rem + env(safe-area-inset-bottom, 0px)); }
```

### Use a content-driven compact landscape rule

```css
@media (max-height: 30rem) {
  .hero { align-content: start; min-height: auto; }
}
```

### Remove a temporary measured custom property

```js
function clearMeasuredHeight(element) {
  element.style.removeProperty("--available-height");
}
```

### Schedule a single visual viewport update

```js
function scheduleFrame(callback) {
  let frame = 0;
  return () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(callback);
  };
}
```

### Restore an event subscription cleanly

```js
function listenToViewport(callback) {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener("resize", callback);
  return () => viewport.removeEventListener("resize", callback);
}
```

### Keep fixed action clear of the home indicator

```css
.fixed-action { bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
```

### Let hero actions wrap

```css
.hero-actions { display: flex; flex-wrap: wrap; gap: .75rem; }
```

### Make a dialog body scroll independently

```css
.dialog-body { max-height: calc(100dvh - 8rem); overflow-y: auto; }
```

### Avoid a rigid form height

```css
.form-shell { min-height: 100svh; height: auto; }
```

### Measure layout before applying styles

```js
function measureThenWrite(element) {
  const measuredHeight = element.getBoundingClientRect().height;
  element.style.setProperty("--measured-height", `${measuredHeight}px`);
}
```

### Use a viewport-safe full bleed section

```css
.full-bleed {
  min-height: 100vh;
  min-height: 100svh;
  padding-inline: max(1rem, env(safe-area-inset-left, 0px)) max(1rem, env(safe-area-inset-right, 0px));
}
```

### Allow a long heading to wrap

```css
.hero-title { max-width: 14ch; overflow-wrap: anywhere; text-wrap: balance; }
```

### Make the page reserve space for a fixed footer

```css
.page-content { padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px)); }
```
