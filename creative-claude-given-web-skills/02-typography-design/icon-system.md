# Icon System — Production Skill Guide

## Why This Matters

An icon system is a small visual language with a surprisingly large surface area. Icons appear in navigation, form controls, status messages, tables, empty states, toolbars, charts, and mobile actions. A set can look consistent in a design file yet become noisy in production when different packages use different stroke widths, view boxes, optical sizes, baseline behavior, and accessibility conventions. The job of this skill is to create a dependable system: every icon has a clear meaning, a predictable rendering contract, a documented accessibility role, and a safe implementation path.

This guide treats icons as interface components rather than decoration pasted into markup. It covers how to choose an asset strategy, normalize geometry, set size and color tokens, name actions accessibly, support interaction states, handle RTL layouts, and debug rendering differences. Examples use HTML, CSS, SVG, and JavaScript where useful. Adapt framework syntax to the component system in use; the underlying constraints remain the same.

### Learning outcomes

By the end, you should be able to:

- Choose between inline SVG, a maintained icon library, an SVG sprite, and an image asset.
- Build a small, consistent icon API with size, tone, and state variants.
- Distinguish decorative icons from meaningful images and icon-only controls.
- Preserve accessible names, keyboard interaction, visible focus, and reduced-motion preferences.
- Diagnose clipping, blurry rendering, inconsistent visual weight, and baseline alignment.
- Avoid unsafe or brittle approaches such as arbitrary icon fonts, untrusted SVG injection, and Unicode glyphs used as interface icons.
- Review a library against concrete acceptance criteria rather than personal taste alone.

## 1. Establish the icon contract

An icon contract defines what the component accepts and what callers can rely on. Decide early whether icons are decorative by default, whether accessible names belong to the surrounding control, which sizes are supported, and how color is inherited. A predictable contract prevents each page from inventing its own rules.

For most interfaces, a reusable icon should expose a small set of props: a stable icon identifier, size token, optional visual tone, and optional class hook. The surrounding button or link owns the action and accessible name. Avoid an API that lets every caller set arbitrary width, height, stroke, fill, and ARIA attributes independently unless there is a real use case for that flexibility.

```html
<button class="icon-button" type="button" aria-label="Open settings">
  <svg class="icon icon--md" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
    <path d="m19 13.5 1.2 1-1.5 2.6-1.5-.5a7 7 0 0 1-1.7 1l-.3 1.6h-3l-.3-1.6a7 7 0 0 1-1.7-1l-1.5.5-1.5-2.6 1.2-1a7 7 0 0 1 0-2l-1.2-1 1.5-2.6 1.5.5a7 7 0 0 1 1.7-1l.3-1.6h3l.3 1.6a7 7 0 0 1 1.7 1l1.5-.5 1.5 2.6-1.2 1a7 7 0 0 1 0 2Z" />
  </svg>
</button>
```

## 2. Choose the asset strategy deliberately

There is no single best source format for every project. Inline SVG gives direct styling and excellent control but can increase repeated markup if the same path is copied many times. A library provides consistent naming and reviewed assets, but can introduce bundle cost or constrain customization. A sprite can deduplicate repeated symbols, while external image files are simple for fixed illustrations but less flexible for inherited color.

Make the decision from actual requirements: rendering control, accessibility, bundle strategy, content security policy, caching, and how often the icon changes. Do not pick an approach solely because a demo is easy to paste.

```html
<!-- Inline SVG: easy to style with currentColor -->
<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M5 12h14M13 6l6 6-6 6" />
</svg>

<!-- SVG sprite: shared symbol, local instance -->
<svg class="icon" aria-hidden="true" focusable="false">
  <use href="#icon-arrow-right"></use>
</svg>
```

## 3. Normalize view boxes and drawing bounds

The `viewBox` is the coordinate system of an SVG, not a promise that the visible shape fills the box. Two icons with identical CSS dimensions can look different because one path uses most of its view box and another has generous internal whitespace. Normalize assets to a shared coordinate system where practical, then make optical corrections only when visual inspection justifies them.

Do not crop paths blindly to their tight bounds. Intentional breathing room may be part of the design language, and strokes can extend beyond geometric path bounds. A 24-by-24 view box is common, not mandatory. The rule is consistency within a family and documented exceptions.

```svg
<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
  <path d="M4 12h15M13 6l6 6-6 6"
        fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

## 4. Define a size scale

A size scale is more reliable than allowing arbitrary pixel values. Common tokens might be `xs`, `sm`, `md`, `lg`, and `xl`, mapped to a limited set of dimensions. The right values depend on the typeface, density, and component library. The key is to document the relationship between icon size and surrounding text or control size.

Keep icon dimensions separate from the hit area. A 16-pixel glyph can sit inside a 40-pixel icon button. Increasing the glyph to 40 pixels is not the correct way to create a larger touch target. Use layout and padding for the target, and test the target on touch devices.

```css
:root {
  --icon-size-xs: 0.75rem;
  --icon-size-sm: 1rem;
  --icon-size-md: 1.25rem;
  --icon-size-lg: 1.5rem;
  --icon-size-xl: 2rem;
}

.icon { width: var(--icon-size-md); height: var(--icon-size-md); }
.icon--sm { width: var(--icon-size-sm); height: var(--icon-size-sm); }
.icon--lg { width: var(--icon-size-lg); height: var(--icon-size-lg); }
```

## 5. Make color inherit intentionally

For monochrome interface icons, `currentColor` is usually the most flexible choice. It allows the surrounding component to determine icon color in normal, hover, active, disabled, and high-contrast states. Explicit fills are appropriate for multicolor illustrations or icons whose internal color relationships are essential, but they should be deliberate.

A common failure is setting `fill: currentColor` globally on every SVG. Stroke-based icons may become filled blobs or show unexpected interiors. Set the relevant drawing properties at the icon-family level and avoid broad rules that assume every SVG uses the same construction.

```css
.icon--stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon--filled {
  fill: currentColor;
  stroke: none;
}
```

## 6. Choose a consistent stroke and visual weight

Stroke width changes perceived weight even when the icon dimensions are identical. A thin icon beside a bold text label can feel weak; a heavy icon next to a delicate typeface can feel crowded. Pick a stroke family and test it at the actual sizes used in the interface, especially at 16 and 20 pixels.

Stroke consistency does not mean every path must have exactly the same numerical width. Optical corrections may be needed for diagonals, small circles, and dense shapes. Record intentional differences so they do not look like accidental mismatches during future updates.

```css
.icon--outline {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.75;
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

## 7. Separate decorative icons from meaningful imagery

An icon beside visible text is often decorative because the text already communicates the same information. In that case, hide the SVG from assistive technology with `aria-hidden="true"`. If an icon alone communicates information, it needs an accessible name or equivalent text. The name should describe meaning or purpose, not appearance.

Avoid duplicate announcements such as a button named “Search” containing an SVG that is also announced as “magnifying glass.” The user needs the control purpose, not two competing labels. For a standalone informative graphic, an SVG `<title>` may help, but the surrounding interface context still determines the best accessible name.

```html
<button type="button" aria-label="Search">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="10.5" cy="10.5" r="6.5"></circle>
    <path d="m15.5 15.5 5 5"></path>
  </svg>
</button>
```

## 8. Treat icon-only controls as controls, not pictures

An icon-only button must have a meaningful accessible name, a visible focus state, a usable hit area, and ordinary button semantics. Use a `<button>` for an action and an `<a>` for navigation. Do not make a generic `<span>` clickable simply because it contains an icon; that bypasses keyboard and assistive-technology behavior unless you rebuild it correctly.

The label should state the action: “Close dialog,” “Delete draft,” or “Show password.” “X icon” and “trash can” describe shapes, not outcomes. If the icon changes the action, update the label at the same time.

```html
<button class="icon-button" type="button" aria-label="Close dialog">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6 6 12 12M18 6 6 18"></path>
  </svg>
</button>
```

## 9. Keep icon geometry optically aligned

Mathematical centering and optical centering are not always the same. A directional arrow may appear off-center because its visual mass points to one side. A search icon may need slight correction due to the handle. Before adding transforms, inspect the view box and path bounds, then compare the asset beside text at its real rendered size.

Prefer correcting the source asset or a documented icon-specific adjustment over applying arbitrary offsets to all icons. Use flex or grid for alignment; avoid relying on whitespace in SVG markup or text characters to position the icon.

```css
.inline-action {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.inline-action .icon {
  flex: 0 0 auto;
  display: block;
}
```

## 10. Use stable names and avoid ambiguous symbols

The icon registry should use names that describe a recognizable concept or action: `arrow-left`, `calendar`, `download`, `visibility`, `warning`, and `external-link`. Avoid overloaded names such as `next`, `thing`, or `status-icon` when their meaning changes by page. The same icon name should not refer to different shapes in separate modules.

Names are part of the developer-facing API. If a design changes from a “heart” to a “bookmark,” update the identifier and usages rather than preserving a misleading alias forever. If backward compatibility requires an alias, document its deprecation and plan removal.

```js
export const iconNames = [
  "arrow-left",
  "calendar",
  "download",
  "external-link",
  "search",
  "settings",
  "warning"
];
```

## 11. Choose a rendering architecture

Use the simplest architecture that satisfies the product. A small static site may be well served by inline SVG. A large application may use a reviewed icon package or a typed registry. An SVG sprite can be effective when many repeated icons share a document. An image file may be right for a branded, multicolor logo.

Consider whether icons need inherited color, per-instance styling, caching, server rendering, tree-shaking, or strict content security policy support. Avoid loading a whole library when the build cannot tree-shake it and only a handful of icons are used. Verify the actual output bundle instead of assuming the package’s marketing claims describe your application.

```js
const iconRegistry = {
  search: "/assets/icons/search.svg",
  settings: "/assets/icons/settings.svg",
  warning: "/assets/icons/warning.svg"
};

function getIconAsset(name) {
  if (!Object.hasOwn(iconRegistry, name)) {
    throw new Error(`Unknown icon: ${name}`);
  }
  return iconRegistry[name];
}
```

## 12. Build state variants as a system

Icons often communicate state: selected, expanded, loading, success, warning, error, or disabled. Use a limited, documented state vocabulary and make sure the visual change does not depend on color alone. A success icon should be accompanied by text or another clear cue when the state is important.

For controls that toggle, the accessible state belongs on the control. For example, an expandable navigation button can use `aria-expanded`; the SVG itself generally does not need to announce “expanded.” Keep the icon’s visual state synchronized with the actual application state rather than using CSS as a substitute for state management.

```html
<button type="button" aria-expanded="false" aria-controls="filters-panel">
  <span>Filters</span>
  <svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
    <path d="m6 9 6 6 6-6"></path>
  </svg>
</button>
```

## 13. Support right-to-left interfaces

Some icons are directional and should mirror in RTL layouts; others are universal and should not. Back/forward arrows, reply arrows, and directional navigation often depend on reading direction. Search, settings, calendar, and most status icons generally retain their orientation. Do not mirror every SVG with a global `scaleX(-1)` rule.

Prefer logical CSS properties and an explicit directional icon mapping. If a glyph must flip, apply the transformation only to the appropriate category. Validate the result in a real RTL page with both the icon and its text, not in isolation.

```css
[dir="rtl"] .icon--directional {
  transform: scaleX(-1);
}

.icon--universal {
  transform: none;
}
```

## 14. Avoid icon fonts for precision-critical UI

Icon fonts can be compact in some setups, but they rely on font loading, code-point mapping, and font rendering behavior. Private-use Unicode code points are difficult to inspect and can produce missing-glyph boxes when the font fails. Font glyphs also make per-icon geometry and accessible naming less transparent than SVG.

If an existing product has a well-maintained icon font, migration may not be necessary. For new systems, prefer an explicit asset registry or SVG-based source unless there is a clear operational reason to choose a font. Never substitute emoji or arbitrary Unicode symbols for UI icons whose appearance must be stable across platforms.

```css
/* Prefer an explicit SVG asset over a private-use glyph mapping. */
.icon-font-fallback {
  font-family: "ProductIcons", sans-serif;
  /* Legacy-only: document the code-point map and font-load behavior. */
}
```

## 15. Keep SVG content safe

SVG is a powerful document format, not merely a harmless image string. Avoid injecting untrusted SVG markup with `innerHTML`. Use trusted, reviewed assets and a build-time sanitization process when SVGs come from external sources. Do not assume that an `.svg` file is safe simply because it has an image extension.

If icons are supplied by users or a third party, render a known safe rasterized representation or sanitize according to a maintained policy. Avoid embedding scripts, event handlers, external references, and unexpected data URLs. Security review should be part of the asset pipeline, not a last-minute production patch.

```js
// Safer: choose a trusted, pre-reviewed asset by registry key.
const iconUrl = getIconAsset("warning");
const image = document.createElement("img");
image.src = iconUrl;
image.alt = "";
```

## 16. Make animation purposeful and restrained

An icon animation should communicate a state change or provide feedback, not distract from the task. A rotating spinner can indicate a pending operation; a chevron can rotate when a panel opens. Do not animate decorative icons continuously without a meaningful reason. Ensure the state still makes sense when motion is reduced or disabled.

Use `prefers-reduced-motion` to remove nonessential transitions and animations. If a spinner indicates an ongoing task, the surrounding interface should also expose the status in text or with appropriate live-region behavior. Avoid relying on motion alone to communicate completion or failure.

```css
.icon--rotating {
  animation: icon-rotate 1s linear infinite;
}

@keyframes icon-rotate {
  to { transform: rotate(1turn); }
}

@media (prefers-reduced-motion: reduce) {
  .icon--rotating {
    animation: none;
  }
}
```

## 17. Optimize rendering and bundle cost

Do not optimize by intuition alone. Inspect the compiled output, network requests, duplicate assets, and actual bundle composition. Repeated inline SVG can be perfectly reasonable for a small icon set, while a sprite can help in repeated-use scenarios. External SVG files may be cacheable but can have styling and cross-origin constraints.

Avoid runtime fetching for icons that are critical to the first render unless the loading behavior is designed. Missing icons create confusing blank controls. If lazy loading is appropriate for a large illustration, provide dimensions and a sensible fallback to prevent layout shift. For common controls, include the icon in the initial component bundle or use a predictable asset cache.

```js
console.table([
  { strategy: "inline SVG", styling: "high control", repeatedMarkup: "higher" },
  { strategy: "sprite", styling: "moderate", repeatedMarkup: "low" },
  { strategy: "external SVG", styling: "limited", caching: "strong" },
  { strategy: "icon font", styling: "glyph-based", fontDependency: "yes" }
]);
```

## 18. Test icons at real sizes and contexts

An icon that looks perfect at 48 pixels may become muddy at 16 pixels. Review icons in the smallest supported size, on high-density displays, next to text, inside buttons, in disabled states, and against both light and dark surfaces. Test browser zoom and text scaling because controls should remain understandable when users enlarge content.

Use visual regression screenshots for a representative set of icons and variants. Automated tests can catch missing names, invalid registry keys, absent labels on icon-only buttons, and broken asset URLs. They cannot fully replace human review of visual weight and optical alignment.

```js
function auditIconButtons(root = document) {
  const unlabeled = [...root.querySelectorAll("button")]
    .filter((button) => button.querySelector("svg, img")
      && !button.textContent.trim()
      && !button.getAttribute("aria-label")
      && !button.getAttribute("aria-labelledby"));
  console.table(unlabeled.map((button) => ({
    html: button.outerHTML.slice(0, 120),
    issue: "Icon-only button has no accessible name"
  })));
}
```

## 19. Use a reviewable icon inventory

A registry makes coverage and consistency visible. Include the identifier, source, intended meaning, directionality, default treatment, accessibility notes, and deprecated aliases. This prevents duplicate icons and inconsistent meanings from spreading across product teams.

The inventory should be maintained alongside the assets. If a new icon is proposed, reviewers should ask whether an existing symbol already communicates the same concept, whether the icon has been tested at target sizes, and whether the name is stable enough for an API. Document exceptions rather than allowing them to silently become precedent.

```js
const iconMetadata = {
  "external-link": {
    source: "approved-library",
    meaning: "Opens a destination outside the current context",
    directional: false,
    defaultRole: "decorative when adjacent to link text"
  },
  "arrow-left": {
    source: "product-custom",
    meaning: "Navigate to the previous location",
    directional: true,
    defaultRole: "decorative when the control has a text label"
  }
};
```

## 20. Debug the browser output, not the source alone

When an icon looks wrong, inspect the rendered element and computed styles. Confirm the SVG `viewBox`, rendered width and height, `stroke-width`, `fill`, `stroke`, inherited `color`, transforms, overflow clipping, and CSS specificity. Check whether a global selector overrides the icon family. Look for a parent with `line-height`, `align-items`, `overflow: hidden`, or a transform that changes alignment.

Use DevTools to toggle suspicious declarations one at a time. Compare the same asset in a minimal test page and in its actual component. If the asset is blurry, check whether it is a raster image scaled away from its native dimensions or whether a transform is causing subpixel placement. Do not compensate for an unknown cause with a random margin.

```js
function inspectIcon(element) {
  const style = getComputedStyle(element);
  const result = {
    width: style.width,
    height: style.height,
    color: style.color,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    lineHeight: style.lineHeight,
    transform: style.transform,
    overflow: style.overflow
  };
  console.table(result);
  return result;
}
```

## 21. Document component usage and exceptions

A good icon system is teachable. Document the allowed size tokens, naming rules, accessible naming examples, directional behavior, loading behavior, and how to request a new asset. Include examples of correct icon-only controls and explain when a visible text label is preferable.

Avoid a catalogue that lists names but never explains usage. A developer should be able to answer “which icon should I use here?” and “how do I make this control accessible?” without reverse-engineering the SVG source. Keep guidance close to the component API and update it when tokens or asset sources change.

```html
<aside aria-labelledby="icon-guidance-title">
  <h2 id="icon-guidance-title">Icon usage</h2>
  <p>Use approved names and size tokens. Label icon-only controls by action.</p>
  <a href="/design-system/icons">Open the icon catalogue</a>
</aside>
```

## 22. Define completion with observable criteria

An icon system is complete when its behavior can be checked, not when the catalogue merely looks finished. Review a representative sample across size, tone, state, direction, and background. Check that the public API is predictable, asset sources are known, and controls remain accessible without a mouse.

Use a checklist during review and record failures as actionable issues. If the system does not define a behavior, that is a documentation gap. If a behavior is documented but inconsistent in the rendered UI, that is an implementation defect.

```js
const iconReview = {
  knownRegistry: true,
  consistentSizeTokens: true,
  iconOnlyControlsNamed: true,
  keyboardFocusVisible: true,
  rtlReviewed: true,
  reducedMotionReviewed: true,
  svgSourcesTrusted: true
};
console.table(Object.entries(iconReview).map(([check, pass]) => ({ check, pass })));
```


## Named Implementation Patterns

### Pattern 1 — Icon-only action button

What it does: Provides a compact action while keeping the control's purpose available to assistive technology.

When to use it: Use for familiar, space-constrained actions such as close, search, or overflow when the meaning is clear from context. Prefer visible text when the action is unfamiliar or destructive.

```html
<button class="icon-button" type="button" aria-label="Close panel">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
</button>
<style>
.icon-button { min-width: 44px; min-height: 44px; display: inline-grid; place-items: center; }
.icon-button:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
</style>
```

### Pattern 2 — Icon beside a text label

What it does: Adds a visual cue without duplicating the spoken label.

When to use it: Use for navigation items, buttons, and compact metadata when the icon reinforces rather than replaces the words.

```html
<a class="nav-link" href="/reports">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5" /></svg>
  <span>Reports</span>
</a>
<style>
.nav-link { display: inline-flex; align-items: center; gap: .5rem; }
.nav-link:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
</style>
```

### Pattern 3 — Status icon with text

What it does: Pairs a recognizable symbol with an explicit state label.

When to use it: Use for success, warning, error, and pending states where color or shape alone is not sufficient.

```html
<p class="status status--error" role="status">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6m0 4h.01" /></svg>
  <span>Payment could not be processed.</span>
</p>
```

### Pattern 4 — Expandable control

What it does: Keeps the chevron, expanded state, and controlled region synchronized.

When to use it: Use for disclosures, filters, and expandable navigation groups. The button carries `aria-expanded`; the decorative icon does not need to announce the same state.

```html
<button type="button" aria-expanded="false" aria-controls="details">
  Details
  <svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
</button>
<section id="details" hidden><p>Additional details.</p></section>
```

### Pattern 5 — Direction-aware navigation icon

What it does: Mirrors only icons whose meaning depends on reading direction.

When to use it: Use for previous/next or back/forward affordances in applications that support RTL languages. Keep universal symbols unchanged.

```html
<svg class="icon icon--directional" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>
<style>
[dir="rtl"] .icon--directional { transform: scaleX(-1); }
</style>
```

### Pattern 6 — SVG sprite symbol

What it does: Reuses one reviewed symbol definition at multiple locations.

When to use it: Use when the same icon repeats across a page and the project's build, browser support, and CSP setup permit sprites.

```html
<svg aria-hidden="true" class="icon" focusable="false">
  <use href="#icon-download"></use>
</svg>
<!-- Put the trusted symbol definitions in a sprite loaded by the application. -->
```

### Pattern 7 — Loading indicator

What it does: Communicates ongoing work without making animation the only status cue.

When to use it: Use for operations that take long enough for a pending state to matter. Respect reduced-motion preferences and provide nearby status text.

```html
<span class="loading-state" role="status">
  <svg class="icon icon--spinner" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>
  <span>Saving changes…</span>
</span>
<style>
.icon--spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(1turn); } }
@media (prefers-reduced-motion: reduce) { .icon--spinner { animation: none; } }
</style>
```

### Pattern 8 — Theme-aware monochrome icon

What it does: Inherits the foreground color from the surrounding component, reducing duplicate color declarations.

When to use it: Use for single-color interface glyphs that should adapt to hover, disabled, dark, or high-contrast themes.

```html
<button class="toolbar-action" type="button" aria-label="Download file">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 20h16" /></svg>
</button>
<style>
.toolbar-action { color: var(--text-color); }
.icon { fill: none; stroke: currentColor; stroke-width: 1.8; }
</style>
```

### Pattern 9 — Safe registry lookup

What it does: Prevents arbitrary user strings from becoming asset paths and surfaces missing icon names early.

When to use it: Use when application data chooses among a fixed set of approved icons. Validate at the component boundary and provide an intentional fallback.

```html
const iconPaths = {
  search: "/assets/icons/search.svg",
  calendar: "/assets/icons/calendar.svg",
  warning: "/assets/icons/warning.svg"
};
function resolveIcon(name) {
  return Object.hasOwn(iconPaths, name) ? iconPaths[name] : iconPaths.warning;
}
```



## Mental Models

1. **An icon is a component contract, not an isolated vector file.**
2. **Visible text should normally carry the meaning; a nearby icon reinforces it.**
3. **The surrounding button or link owns the action name and interactive state.**
4. **A shared viewBox makes assets easier to compare but does not guarantee equal optical size.**
5. **Size the glyph and the hit target independently.**
6. **Use currentColor for monochrome assets when inherited color is part of the design contract.**
7. **Mirror directional symbols intentionally; do not flip the entire icon catalogue.**
8. **Review at the smallest real size before polishing large previews.**
9. **Use a finite registry so names, assets, and usage can be audited.**
10. **Motion should communicate a state change and must respect reduced-motion preferences.**
11. **Debug computed output before adding corrective offsets.**
12. **Security controls belong in the asset pipeline, not in individual page code.**


## Quick Reference

| Situation | Recommended default | Notes |
|---|---|---|
| Icon beside visible text | aria-hidden="true" | Avoid duplicate accessible names. |
| Icon-only action | aria-label on button | Name the action, not the shape. |
| Navigation destination | <a href> | Use link semantics, not a clickable span. |
| Action | <button type="button"> | Preserves keyboard behavior. |
| Monochrome SVG | stroke/fill: currentColor | Only when it matches the asset family. |
| Outline icon | fill: none; stroke: currentColor | Avoid accidental filled silhouettes. |
| Filled icon | fill: currentColor; stroke: none | Use for a consistent filled family. |
| Small glyph | 16–20 CSS px | Validate at actual density and context. |
| Touch target | about 44 × 44 CSS px | Target is larger than the glyph. |
| SVG coordinate system | viewBox="0 0 24 24" | Common token, not a universal requirement. |
| RTL directional glyph | scoped scaleX(-1) | Mirror only direction-sensitive symbols. |
| Universal glyph | no transform | Calendar, search, settings usually stay oriented. |
| Loading | status text + indicator | Motion alone is not enough. |
| Reduced motion | @media (prefers-reduced-motion: reduce) | Remove nonessential animation. |
| Focus treatment | :focus-visible | Keep keyboard focus obvious. |
| Asset trust | approved / sanitized SVG | Never inject untrusted SVG markup. |
| Missing registry key | explicit fallback | Avoid silent blank controls. |
| Visual clipping | inspect overflow and viewBox | Check ancestors and strokes. |
| Blurry icon | check raster scaling and transforms | Prefer vector assets for interface glyphs. |
| Bundle size | inspect built output | Do not infer from source package size. |


## Common Mistakes and Specific Fixes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Using an unlabeled icon-only button | Keyboard and screen-reader users cannot determine the action. | Add an action-focused `aria-label` or visible text; verify the computed accessible name. |
| Giving a decorative SVG its own spoken label | The same meaning is announced twice or the shape competes with the control label. | Set `aria-hidden="true"` on the decorative SVG and keep the name on the button or link. |
| Using a clickable span as a button | Native keyboard, focus, and activation semantics are missing. | Replace it with `<button>` for actions or `<a href>` for navigation. |
| Setting fill globally on every SVG | Stroke icons can turn into solid or malformed shapes. | Define `.icon--stroke` and `.icon--filled` families and inspect computed `fill`. |
| Changing icon size to enlarge the touch target | The glyph becomes visually oversized while the interactive area may still be too small. | Set a minimum button box and center the glyph with grid or flex. |
| Using emoji for critical interface state | Appearance and baseline vary across operating systems and fonts. | Use an approved vector asset and pair important states with text. |
| Applying RTL flipping to all icons | Universal symbols such as search and calendar become visually incorrect. | Tag directional assets and scope transforms to that class. |
| Assuming a common viewBox guarantees equal visual weight | Path bounds and whitespace make some icons look much smaller. | Compare rendered samples and adjust the source or documented optical correction. |
| Relying on color alone for status | Users with color-vision differences may miss the meaning. | Pair the icon with text or another non-color cue. |
| Injecting SVG from an untrusted string | SVG markup may contain unsafe content or unexpected references. | Use a trusted registry or a maintained sanitization pipeline; never assign untrusted SVG to `innerHTML`. |
| Loading critical icons asynchronously with no fallback | Controls may appear blank during network delay or fail completely. | Bundle critical icons or use a deterministic fallback and reserve dimensions. |
| Using arbitrary pixel values everywhere | The library drifts into inconsistent sizes and alignment. | Define size tokens and document rare exceptions. |
| Hiding keyboard focus for visual cleanliness | Keyboard users lose track of their position. | Keep a strong `:focus-visible` indicator and test with Tab and Shift+Tab. |
| Animating an icon continuously without meaning | Motion distracts and can affect people sensitive to animation. | Animate only purposeful state changes and respect `prefers-reduced-motion`. |
| Assuming a package is tree-shaken | Unused icons may remain in the production bundle. | Inspect the build output and network panel; import only approved named assets. |
| Using private-use icon-font code points without documentation | Glyphs are hard to inspect and can fail when the font does not load. | Prefer explicit SVG identifiers or maintain a documented mapping and font-load fallback. |
| Correcting misalignment with random margin values | The local patch hides a viewBox, line-height, or parent-layout problem. | Inspect bounds, computed styles, flex alignment, and overflow before applying an optical adjustment. |
| Treating `title` as a substitute for button labeling | Browser and assistive-technology behavior can vary and may not name the control reliably. | Put the accessible name on the interactive element; use SVG title only when the graphic itself needs a name. |


## Build Requirements

1. Create a finite icon registry with stable, documented names.
2. Document the asset source and license for every third-party icon family.
3. Normalize viewBox conventions where practical and record exceptions.
4. Provide at least four size tokens and define their CSS dimensions.
5. Separate glyph size from the control's hit target.
6. Define outline and filled families rather than applying one global SVG rule.
7. Use currentColor only for assets designed to inherit monochrome color.
8. Provide an accessible naming rule for decorative and informative icons.
9. Use native button and link semantics for interactive controls.
10. Preserve a visible keyboard focus indicator on icon-only controls.
11. Pair important status icons with text or another non-color cue.
12. Define which icons mirror in RTL and which never mirror.
13. Respect prefers-reduced-motion for nonessential animation.
14. Keep untrusted SVG strings out of innerHTML and sanitize third-party assets.
15. Audit missing registry keys and provide a deliberate fallback.
16. Inspect production bundle and network output for duplicate or unnecessary assets.
17. Test icons at their smallest size, in dark and light themes, and at zoom.
18. Use DevTools to inspect viewBox, dimensions, stroke, fill, transforms, and overflow.
19. Review icon-only accessible names using browser accessibility tools.
20. Maintain a review process for new icons, aliases, and deprecated assets.


## Topic-Specific Gotchas

> **Gotcha — viewBox is not visible bounds.** A 24×24 coordinate space can contain a much smaller shape. Inspect the path bounds and actual rendered size before increasing every instance.

> **Gotcha — currentColor does not normalize path style.** An asset with hard-coded fill or stroke may ignore inherited color. Remove or map hard-coded paint values in the asset pipeline when safe.

> **Gotcha — SVG symbols can inherit surprising styles.** A `<use>` instance may inherit properties differently from copied inline markup. Test sprite symbols in the actual browser and stylesheet context.

> **Gotcha — stroke edges may clip.** A stroke extends beyond the path's centerline. Leave sufficient room inside the viewBox or the outer edge can be clipped.

> **Gotcha — title is not a control label.** A tooltip or SVG title is not a robust substitute for an accessible name on the button or link.

> **Gotcha — reduced motion does not describe loading state.** Stopping a spinner should not make the operation seem complete. Keep status text and a truthful pending state.


## Before → After: Repairing a brittle icon button

### Before

This example has no accessible name, uses a generic clickable element, and relies on a Unicode glyph whose appearance differs by platform.

```html
<span class="close" onclick="closePanel()">×</span>
```

### After

The repaired version uses native button semantics, a stable SVG asset, a meaningful action name, a visible focus indicator, and a target that is larger than the glyph.

```html
<button class="icon-button" type="button" aria-label="Close panel" onclick="closePanel()">
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
</button>
<style>
.icon-button { min-width: 44px; min-height: 44px; display: inline-grid; place-items: center; }
.icon-button:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
.icon { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; }
</style>
```

## Accessibility review procedure

1. Navigate the whole page with `Tab` and `Shift+Tab`. Confirm that every icon-only action is reachable in the expected order.
2. Activate buttons with `Enter` and `Space`; activate links with `Enter`. Do not require pointer-only interaction.
3. Inspect the accessible name of each icon-only control in the browser accessibility pane. Confirm that the name describes the action.
4. Check that decorative SVGs are ignored by the accessibility tree and that informative icons have an equivalent text description when necessary.
5. Test at 200% zoom and with enlarged text. Confirm that icons do not overlap labels or disappear behind clipped containers.
6. Test high-contrast or forced-colors behavior where supported. Confirm that icons relying on `currentColor` remain visible.
7. Test a reduced-motion preference. Confirm that nonessential animation stops while the underlying state remains understandable.
8. Check focus rings against adjacent surfaces. `:focus-visible` must not be clipped by a parent with `overflow: hidden`.
9. Inspect buttons with a screen reader. Avoid duplicate announcements from both the SVG and the control label.
10. Confirm that error, warning, and success states are not distinguished by color alone.

## DevTools inspection walkthrough

When a glyph appears too light, clipped, blurry, or vertically misaligned, use a repeatable sequence rather than stacking CSS overrides.

1. Select the rendered SVG in DevTools Elements.
2. Read its `viewBox`, width, and height attributes. Confirm the viewBox matches the intended asset family.
3. Open Computed Styles and inspect `width`, `height`, `color`, `fill`, `stroke`, `stroke-width`, `transform`, and `display`.
4. Inspect the path-level styles. A path with a hard-coded paint value may ignore the icon wrapper's `currentColor`.
5. Select the parent button and inspect `line-height`, `align-items`, `justify-content`, `padding`, and `overflow`.
6. Toggle suspected declarations off one at a time. If the icon suddenly improves, identify the winning selector and correct its scope.
7. Compare the same asset in a minimal test page. If the issue only occurs in the full component, investigate inherited styles and container geometry.
8. Check the Network panel for missing asset requests and the Console for load or CSP errors.
9. Inspect the production bundle when icons appear duplicated. Source imports alone do not prove the final bundle is optimized.
10. Record the root cause and the minimal fix so that the same failure does not recur in another component.

```js
function debugIcon(element) {
  const svg = element.matches("svg") ? element : element.querySelector("svg");
  if (!svg) return console.warn("No SVG icon found");
  const style = getComputedStyle(svg);
  const parentStyle = getComputedStyle(svg.parentElement);
  console.table({
    viewBox: svg.getAttribute("viewBox"),
    width: style.width,
    height: style.height,
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    transform: style.transform,
    parentLineHeight: parentStyle.lineHeight,
    parentOverflow: parentStyle.overflow
  });
}
```

## Definition of done / Success criteria

- [ ] Every icon used in production maps to an approved, named asset.
- [ ] Size, paint style, and directionality are documented and consistent.
- [ ] Every icon-only button or link has an accessible name that describes its purpose.
- [ ] Decorative icons are hidden from assistive technology when adjacent text already conveys the same meaning.
- [ ] Keyboard focus is visible and not clipped.
- [ ] Status information is not communicated through color or animation alone.
- [ ] RTL behavior is tested and only directional symbols are mirrored.
- [ ] Reduced-motion preferences are respected.
- [ ] SVG sources are trusted or sanitized; untrusted markup is never injected directly.
- [ ] Small-size, zoom, dark-theme, and high-contrast checks have been completed.
- [ ] DevTools inspection has confirmed that geometry and paint styles are correct.
- [ ] Production output has been inspected for missing assets and unnecessary bundle cost.

## Final operating principle

A mature icon system is small enough to learn, explicit enough to audit, and consistent enough that developers do not need to solve the same geometry or accessibility question on every page. Make the defaults safe, keep exceptions visible, and validate the browser output. When a symbol cannot be understood without a tooltip, reconsider whether the interface needs a visible label instead.


## Applied Build Lab — Create a compact icon system

### Scenario

A dashboard has accumulated icons from three sources. The navigation uses thin line icons, the data table uses heavier filled symbols, and action buttons use Unicode characters. Some controls have no accessible name. The product is about to add a dark theme and RTL localization. The task is to consolidate the system without redesigning every screen.

### Phase 1: Inventory and classify

Create an inventory of all visible icons and record where each one appears. Group duplicates by meaning, not merely by file name. Record the action or concept, the current source, whether the icon is decorative, whether it is directional, the required states, and the smallest rendered size. Mark unclear symbols for product or design review rather than guessing their meaning.

```js
const inventoryExample = [
  { name: "search", usage: "toolbar", decorative: true, directional: false, minSize: 20 },
  { name: "arrow-left", usage: "back link", decorative: true, directional: true, minSize: 16 },
  { name: "warning", usage: "validation", decorative: true, directional: false, minSize: 16 },
  { name: "close", usage: "dialog button", decorative: true, directional: false, minSize: 16 }
];
console.table(inventoryExample);
```

### Phase 2: Normalize the asset family

Choose a primary viewBox convention and a default stroke treatment. Inspect assets in a grid at their smallest target size. Reject or correct assets with accidental clipping, inconsistent joins, or large undocumented whitespace. Preserve intentional optical differences where a mechanical normalization would make the icon worse.

Keep a source file or canonical asset for each symbol. Avoid editing generated build output by hand. If the original comes from a third-party library, record its version and license so future upgrades can be reviewed.

### Phase 3: Implement tokens and primitives

Create tokens for dimensions, stroke, and focus treatment. Keep icon geometry separate from button geometry. Define component variants narrowly; if an icon can be arbitrary size, arbitrary color, arbitrary rotation, and arbitrary stroke, callers will create inconsistent combinations.

```css
:root {
  --icon-size-sm: 1rem;
  --icon-size-md: 1.25rem;
  --icon-size-lg: 1.5rem;
  --icon-stroke: 1.8;
  --icon-focus-width: 3px;
}

.icon {
  display: block;
  width: var(--icon-size-md);
  height: var(--icon-size-md);
  flex: 0 0 auto;
}

.icon--stroke {
  fill: none;
  stroke: currentColor;
  stroke-width: var(--icon-stroke);
  stroke-linecap: round;
  stroke-linejoin: round;
}
```

### Phase 4: Fix accessible semantics

Walk every usage and classify it as decorative or informative. Decorative SVGs should not add duplicate speech. Icon-only buttons require an accessible name on the interactive element. Links should have destination semantics, and buttons should perform actions. If an icon communicates a state, ensure the state is also conveyed through a label or equivalent text where necessary.

```html
<form role="search" aria-label="Search records">
  <label for="record-query">Search records</label>
  <input id="record-query" name="q" type="search">
  <button type="submit">
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m14.5 14.5 5 5" /></svg>
    <span>Search</span>
  </button>
</form>
```

### Phase 5: Validate themes and directionality

Test light and dark themes, focus, hover, active, disabled, and status variants. Use `currentColor` for monochrome icons only when that is the intended design. In RTL, test navigation and reply arrows separately from universal symbols. Do not infer directionality from the icon's shape alone; record it in metadata.

### Phase 6: Measure bundle and runtime behavior

Build the application in production mode. Inspect the final bundle and Network panel. Count repeated copies of inline SVG, duplicate library modules, external asset requests, and any font file that exists only for icons. Test slow network behavior for icons that are loaded externally. Use an explicit fallback if a missing asset would otherwise leave a blank action.

### Phase 7: Create a regression sample

Choose a representative test set: one 16-pixel icon, one 24-pixel icon, one filled icon, one directional icon, one icon-only button, one status icon, one loading icon, and one icon in dark mode. Keep screenshot comparisons and accessibility assertions for this set. A small, representative suite catches common regressions faster than a huge collection of uncurated snapshots.

### Failure case to debug

A chevron looks correct in the icon catalogue but appears clipped in the accordion. The first attempted fix adds `margin-right: 3px`, which fixes one layout and breaks another. Instead, inspect the SVG stroke near the viewBox edge, the parent's `overflow`, the button's line-height, and any inherited transform. Temporarily remove overflow clipping in DevTools. If the stroke is cut off at the SVG boundary, add appropriate internal room or adjust the source asset; if the clipping comes from the parent, change the component's clipping rule only when the layout requires it. Test both expanded and collapsed states, plus keyboard focus, because the focus outline may be clipped by the same ancestor.

```css
/* Avoid a universal offset patch. Diagnose geometry first. */
.accordion-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.accordion-trigger .icon {
  flex: 0 0 auto;
  overflow: visible;
}

.accordion-trigger:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

## Review checklist for pull requests

- Does the icon name describe the concept and match the registry?
- Is the chosen asset already available, or is a duplicate being introduced?
- Does the icon use the correct filled or outline family?
- Is the visual weight acceptable at 16–20 CSS pixels?
- Does the icon inherit color as intended in dark and high-contrast themes?
- Is the SVG decorative, informative, or interactive, and is its accessible name correct?
- Does the component retain native button or link semantics?
- Is the focus indicator visible, including around clipped containers?
- Does the icon mirror in RTL only if its meaning is directional?
- Is any animation purposeful and compatible with reduced motion?
- Are SVG sources trusted and safe for the rendering method?
- Have computed styles, network behavior, and production bundle output been inspected?


## Advanced Operational Notes

### Reviewing a third-party icon library

Evaluate a library against maintenance activity, license compatibility, tree-shaking behavior, naming consistency, stroke and fill variants, accessibility examples, and asset source quality. Do not adopt it solely because its catalogue is large. A small approved subset may be enough. Pin versions and review major updates visually because upstream changes can alter path geometry or names. Check whether imports pull a full font or stylesheet into the bundle, and confirm whether SVG components emit stable markup in server-rendered environments.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Icons in dense data tables

Table icons often appear at 14–16 CSS pixels and compete with numbers, sort indicators, and row actions. Use a restricted set of states and avoid icon-only status columns when a text label or tooltip is necessary to understand the data. Ensure a sorting icon does not become the only indication of sort order; the control should expose its state and the column header should remain understandable. Test row hover and keyboard focus separately because hover-only actions can be invisible to keyboard users.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Icons in forms and validation

Form icons should reinforce the field's state, not replace a text error. Place an error message near the input, associate it with `aria-describedby`, and use a consistent icon only as a supplementary cue. A required field should not be identified only by a star icon unless the requirement is also explained in text. Check the error layout at zoom and narrow widths so the icon does not overlap the input value or label.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Icons in navigation and breadcrumbs

Navigation icons need a stable meaning across pages. Avoid showing a house icon for multiple unrelated destinations or using the same directional glyph to mean both browser history and in-page hierarchy without context. Breadcrumb separators are usually decorative and should not be announced as meaningful content. Ensure the current page is identified with text and appropriate current-page semantics, not solely by a changed icon color.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Icons and forced-colors mode

Some themes and operating-system settings override colors to improve contrast. Inline SVG paths that use `currentColor` often adapt more naturally than assets with hard-coded colors, but always test the actual browser output. Avoid removing outlines or relying on subtle opacity differences for disabled or selected states. In forced-colors contexts, consider whether `forced-color-adjust` is necessary; do not use it to opt out of user preferences without a specific reason.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Icon animation and state truth

An animated icon must reflect the actual application state. Do not start a spinner before an operation begins or leave it spinning after the request has failed. If the operation can be cancelled, expose that control and make the pending state clear. For toggles, update the underlying state first and derive the visual icon from that state rather than animating a symbol optimistically without rollback behavior.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Asset naming and versioning

Use stable names and avoid encoding presentation into names when presentation is a variant. `search` is generally more durable than `blue-search-20px`. If two visually distinct versions have different meanings, name the distinction semantically; if they differ only by weight, expose a documented style variant. Record upstream source and version so a library update can be reviewed and rolled back if a path changes unexpectedly.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Testing across browsers

SVG rendering differs subtly with stroke joins, fractional dimensions, transforms, and inherited properties. Test the supported browser matrix at realistic device-pixel ratios. A one-pixel discrepancy may be a rendering characteristic rather than a source defect, so compare screenshots at matching zoom and scale before editing paths. Check the browser console and network errors when an external sprite or SVG fails only in one environment.

```css
/* Keep implementation intent explicit and inspectable. */
.icon-system-note { color: currentColor; }
.icon-system-note:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

