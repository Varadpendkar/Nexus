# Border Radius Craft

> A production-oriented skill for designing, implementing, debugging, and validating radius systems in interface design.

## Why This Matters

Border radius is a small value with an outsized effect on the perceived character of an interface. A tight radius can make a control feel precise and compact; a broad radius can make it feel friendly, soft, or spacious. Repeating a coherent set of radii makes components feel related, while arbitrary values can make a page look assembled from unrelated kits.

Radius is also functional geometry. It changes how backgrounds, borders, outlines, images, focus rings, and clipped content meet at corners. It can expose awkward seams between nested surfaces, hide a useful focus indicator, or make a button look like a pill when its height changes. A strong radius system therefore combines visual intent with layout constraints, component semantics, responsive behavior, and accessibility.

This skill teaches a practical way to define a radius language, encode it as tokens, apply it consistently, and debug the cases where a simple `border-radius` declaration does not produce the expected result. It covers ordinary rounded corners, pills, asymmetric shapes, nested surfaces, clipping, image masks, responsive systems, and progressive enhancement for more experimental corner geometry.

## Operating Principles

- Define a small radius scale before assigning values to individual components.
- Choose radii by component role, proportions, and design intent—not by habit alone.
- Treat nested radii as related geometry, especially when a child surface sits inside a rounded parent.
- Keep focus indicators visible and sufficiently separated from clipped edges.
- Use `overflow: hidden` only when clipping is part of the intended design.
- Test at more than one size, because a fixed radius can dominate a compact component.
- Use tokens to express a system, but allow deliberate exceptions when a component needs a distinct shape.
- Validate the rendered geometry in DevTools instead of trusting source order or design-tool previews alone.

## Core Concepts

### 1. Understand the Geometry of a Rounded Corner

A CSS `border-radius` describes the curvature at a box corner. For a simple equal radius, the browser rounds the corner using a quarter ellipse whose horizontal and vertical radii are equal. The visible shape depends on the element's dimensions, border, background, clipping, and neighboring content. A radius of `12px` on a large card reads differently from `12px` on a 24px-high badge.

Use a radius as part of a component's geometry, not as a decorative afterthought. Start with a small number of values that have a clear visual role.

```css
:root {
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}

.card {
  border-radius: var(--radius-lg);
}
```

A useful initial scale often has four to six values. The exact values depend on the type scale, density, and brand character. Avoid making a token for every component before you know whether the differences are meaningful.

### 2. Build a Radius Scale With Roles

Tokens should communicate why a value exists. Naming a token `--radius-13` only records a number; naming it `--radius-control` or `--radius-panel` describes its intended role. Primitive tokens can still be useful for the underlying scale, but component-facing aliases make design decisions easier to review.

```css
:root {
  /* Primitive scale */
  --radius-1: 0.25rem;
  --radius-2: 0.5rem;
  --radius-3: 0.75rem;
  --radius-4: 1rem;
  --radius-5: 1.5rem;
  --radius-round: 999px;

  /* Semantic aliases */
  --radius-control: var(--radius-2);
  --radius-card: var(--radius-3);
  --radius-dialog: var(--radius-4);
  --radius-feature: var(--radius-5);
  --radius-pill: var(--radius-round);
}
```

The primitive layer helps maintain scale consistency. The semantic layer lets a system evolve without editing every component. If the entire product should feel less rounded, update the semantic mapping rather than hunting for dozens of literal values.

### 3. Match Radius to Component Proportions

A radius should relate to the component's size. A 16px radius on a short input can make the field feel capsule-like; a 4px radius on a large marketing panel can feel unnecessarily rigid. Compare the radius against the component height, width, and surrounding whitespace.

```css
.button {
  min-height: 2.75rem;
  padding-inline: 1rem;
  border-radius: var(--radius-control);
}

.promo-card {
  min-height: 18rem;
  padding: 2rem;
  border-radius: var(--radius-feature);
}
```

For controls, use the same radius family across inputs, buttons, and select-like surfaces unless a deliberate distinction improves recognition. For large feature panels, a larger radius may reinforce hierarchy. Test a component at its smallest and largest supported size before locking the value.

### 4. Distinguish Rounded, Fully Rounded, and Pill Shapes

A rounded rectangle has a visible straight edge between corners. A pill has ends that are fully rounded relative to its height. Setting `border-radius: 999px` is a common robust technique because the browser resolves the oversized radius against the box dimensions. It is usually more reliable than hardcoding half of one specific height.

```css
.tag {
  display: inline-flex;
  align-items: center;
  min-height: 1.75rem;
  padding-inline: 0.75rem;
  border-radius: 999px;
}

.card {
  border-radius: 1rem;
}
```

Use pills for compact labels, chips, filter tokens, and some segmented controls. Do not make every button a pill just because the style is fashionable; a pill can create a different visual voice from a square-edged product UI. Make the shape consistent across related actions.

### 5. Use Asymmetric Radii Deliberately

CSS supports separate corner values and elliptical radii. Asymmetry can create a directional cue or a distinctive brand shape, but random corner variation often looks like a mistake. Use it when it supports hierarchy, movement, or a recognizable component family.

```css
.story-card {
  border-radius: 1.25rem 1.25rem 1.25rem 0.375rem;
}

.avatar-frame {
  border-radius: 50% 50% 42% 58% / 52% 48% 55% 45%;
}
```

The first example creates a restrained cut-in corner. The second is an intentionally irregular avatar frame, but should be tested with different images and dimensions. Keep the rest of the interface comparatively quiet when a distinctive shape is used as a brand signature.

### 6. Understand the Shorthand Order

The four-value `border-radius` shorthand follows top-left, top-right, bottom-right, bottom-left order. Three values use top-left, top-right/bottom-left, bottom-right. Two values use top-left/bottom-right and top-right/bottom-left. This shorthand is compact but easy to misread in a large stylesheet.

```css
.panel {
  /* top-left, top-right, bottom-right, bottom-left */
  border-radius: 1rem 1rem 0.25rem 1rem;
}

.diagonal {
  /* top-left/bottom-right, top-right/bottom-left */
  border-radius: 1rem 0.25rem;
}
```

When the values express a distinctive pattern, consider writing each corner longhand or leaving a comment. Readability matters more than saving a few characters in design-system code.

### 7. Use Elliptical Radii With Care

A slash separates horizontal and vertical radius values. This creates elliptical corners rather than circular ones. Elliptical radii can help create soft, organic shapes, but they are less predictable when the element changes size.

```css
.feature-visual {
  border-radius: 2rem 2rem 1rem 3rem / 1.5rem 1.5rem 2.5rem 2rem;
}
```

Use elliptical values for a visual container whose proportions are known, or test them carefully in responsive layouts. For standard form controls and common cards, a simpler scale is easier to maintain. Do not introduce elliptical geometry unless it visibly improves the result.

### 8. Coordinate Nested Radii

When a child panel sits inside a parent with a background and padding, unrelated radii can create uneven gaps at the corners. A practical starting point is to make the inner radius smaller than the outer radius by roughly the inset amount, while recognizing that borders and nonuniform padding affect the final appearance.

```css
.surface {
  --surface-inset: 0.75rem;
  border-radius: 1.25rem;
  padding: var(--surface-inset);
  background: #f2f3f5;
}

.surface__content {
  border-radius: calc(1.25rem - var(--surface-inset));
  background: white;
  padding: 1rem;
}
```

This formula is a starting point, not a universal law. Inspect the corners at actual device-pixel sizes, especially when borders are present. If the child touches the parent edge, the geometry should be evaluated as one combined surface rather than two independent boxes.

### 9. Separate Radius From Clipping

`border-radius` shapes the element's border and background painting. It does not automatically mean every descendant's content is clipped to that curve in every layout situation. When an image or child background must stay within a rounded frame, `overflow: hidden` or a more specific clipping strategy may be needed.

```css
.media-card {
  border-radius: var(--radius-card);
  overflow: hidden;
}

.media-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Clipping can also cut off focus rings, shadows, menus, and decorative elements. Avoid placing a dropdown inside a clipped card if the dropdown must escape the card's bounds. Use a separate overlay layer or portal-like positioning strategy when content should float above neighboring surfaces.

### 10. Preserve Focus Indicators Around Rounded Controls

A rounded outline should follow the control's shape, but clipping ancestors can hide part or all of a focus ring. Keyboard users need a visible focus indicator that is not dependent on color alone. Prefer `:focus-visible` for keyboard-oriented focus styling and test with actual keyboard navigation.

```css
.button {
  border: 1px solid var(--border-control, #a8adb7);
  border-radius: var(--radius-control);
}

.button:focus-visible {
  outline: 3px solid #246bfd;
  outline-offset: 3px;
}
```

Do not remove the browser outline without replacing it with a clear indicator. Check contrast against both the component and surrounding background. A focus ring can be circular, but it must remain visible at each corner and should not be clipped by a parent with `overflow: hidden`.

### 11. Choose Radius by Component Role

Radius is part of a component language. Inputs, buttons, cards, menus, dialogs, badges, and avatars can share a scale while still using different semantic aliases. The goal is recognizable consistency, not identical values everywhere.

```css
:root {
  --radius-control: 0.5rem;
  --radius-card: 0.875rem;
  --radius-dialog: 1.125rem;
  --radius-badge: 999px;
  --radius-avatar: 50%;
}

input,
select,
textarea,
button {
  border-radius: var(--radius-control);
}

article.card {
  border-radius: var(--radius-card);
}

dialog {
  border-radius: var(--radius-dialog);
}
```

Map roles to tokens in a component inventory. When one component needs a special shape, document why. A deliberate exception is healthy; an undocumented exception that appears repeatedly is often a missing token.

### 12. Make Responsive Radius Intentional

Fixed radii do not always scale well between compact and wide layouts. A responsive token can shift subtly across breakpoints, or a component can use `clamp()` to adjust within a bounded range. Keep the range restrained so the interface does not change personality as the viewport grows.

```css
:root {
  --radius-feature: clamp(0.875rem, 1.2vw, 1.5rem);
}

.feature-card {
  border-radius: var(--radius-feature);
}
```

Responsive radius should not be added merely because `clamp()` is available. If a component's shape should remain stable, use a fixed token. Test at intermediate widths as well as at the exact breakpoints, since a fluid radius changes continuously.

### 13. Treat Circular Shapes as a Separate Case

A `50%` radius creates an ellipse when the element is not square and a circle when its width and height match. Use `50%` for circular avatars, icon wells, and status indicators only when the geometry is intended to be circular.

```css
.avatar {
  width: 3rem;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
}

.status-dot {
  width: 0.625rem;
  aspect-ratio: 1;
  border-radius: 50%;
}
```

A percentage radius is based on the element's dimensions, so a rectangular element may become an oval. If the avatar is expected to remain circular, ensure the sizing contract enforces a square box. Provide useful `alt` text for meaningful profile images; decorative avatars may use empty alternative text when the adjacent text already names the person.

### 14. Understand Radius, Border, and Outline Interaction

A border is part of the element's border box. An outline is drawn outside the border edge and does not occupy layout space. A shadow is another painted effect. These layers can appear to have different curvature or spacing if their widths and offsets are not coordinated.

```css
.input {
  border: 1px solid #b8bec8;
  border-radius: 0.625rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
}

.input:focus-visible {
  outline: 2px solid #1d5fe8;
  outline-offset: 2px;
}
```

Do not use a thick border as the only focus indicator if it causes layout shifts or changes the control's perceived dimensions. An outline is often more stable. If the control sits in a clipped parent, the outline may be cut off; solve the containing layout rather than shrinking the focus indicator until it is ineffective.

### 15. Use Radius in Image and Video Frames

Rounded media frames are common, but the image element itself can have its own radius. If the media fills the frame, apply clipping to a wrapper or align the image radius with the frame. A wrapper is especially useful when captions or controls should remain outside the clipped region.

```html
<figure class="media">
  <img src="/images/coast.jpg" alt="Rocky coastline beside blue water">
  <figcaption>Coastal field notes</figcaption>
</figure>
```

```css
.media {
  margin: 0;
}

.media img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-card);
}
```

For video controls, verify that the browser's native control surface remains usable. Avoid rounding an entire video wrapper with `overflow: hidden` if captions, menus, or interactive overlays need to extend beyond it.

### 16. Use Radius in Forms Without Reducing Clarity

Inputs and buttons need recognizable boundaries, readable text, and usable hit areas. Rounded geometry should not replace contrast or explicit labels. Avoid highly rounded inputs if the text area becomes visually cramped or if the radius conflicts with the overall density of the form.

```html
<form class="profile-form">
  <label for="display-name">Display name</label>
  <input id="display-name" name="display-name" autocomplete="nickname">
  <button type="submit">Save profile</button>
</form>
```

```css
.profile-form input,
.profile-form button {
  min-height: 2.75rem;
  border-radius: var(--radius-control);
}

.profile-form input {
  padding-inline: 0.875rem;
}
```

A `label` should remain associated with its control. Add `aria-describedby` when a hint or error message provides necessary context. Radius is visual styling; it is not a substitute for form semantics, keyboard operation, or error communication.

### 17. Use Organic Shapes as a Limited Accent

Organic blobs and varied corner values can make editorial, portfolio, or campaign pages feel less mechanical. They are harder to standardize because their appearance depends on the box ratio and the content inside it. Use them as controlled accents rather than the default shape for every card.

```css
.organic-art {
  border-radius: 42% 58% 63% 37% / 43% 35% 65% 57%;
  overflow: hidden;
  aspect-ratio: 1.1;
}
```

Do not assume an organic radius will look good with every image crop. Review subject placement, edge tangencies, and content contrast. If the shape is purely decorative, ensure the content remains understandable when the visual is removed or the layout changes.

### 18. Approximate Squircle-Like Shapes Carefully

A squircle is a superellipse-like shape that transitions between a square and a circle. Standard `border-radius` cannot reproduce every superellipse exactly. Experimental or newer corner-shaping features such as `corner-shape`, where available, should be treated as progressive enhancement rather than a universal baseline until support is verified for target browsers.

```css
.app-icon {
  width: 4rem;
  aspect-ratio: 1;
  border-radius: 28%;
}

/* Progressive enhancement only; verify browser support before shipping. */
@supports (corner-shape: squircle) {
  .app-icon {
    corner-shape: squircle;
    border-radius: 28%;
  }
}
```

The fallback is a rounded square, not a mathematically exact squircle. Test the feature with a current compatibility reference and actual target browsers. Never make core information or essential controls depend on an experimental corner-shaping property.

### 19. Respect Writing Direction and Logical Layout

The physical `border-top-left-radius` property refers to a physical corner, not a logical start/end corner. For a shape that should follow text direction, consider the design's intended behavior in right-to-left layouts and use logical corner properties where browser support and the desired mapping fit the project.

```css
.message-bubble {
  border-start-start-radius: 1rem;
  border-start-end-radius: 1rem;
  border-end-start-radius: 0.25rem;
  border-end-end-radius: 1rem;
}
```

Check the shape in both left-to-right and right-to-left contexts. A chat bubble whose tail-like corner should sit near the sender's start edge should be expressed in logical terms where possible, rather than manually flipping several physical declarations in separate stylesheets.

### 20. Debug the Rendered Radius in DevTools

When a corner looks wrong, inspect the computed value, the box dimensions, and the ancestors that may clip the element. The source declaration is only one part of the result: another rule may override it, a shorthand may reset a corner, or a parent may hide the visible curve.

```js
const element = document.querySelector(".card");
const styles = getComputedStyle(element);

console.table({
  borderRadius: styles.borderRadius,
  width: styles.width,
  height: styles.height,
  overflow: styles.overflow,
  boxSizing: styles.boxSizing
});
```

Debug sequence:
1. Select the actual element in DevTools.
2. Read the computed `border-radius`, not only the authored rule.
3. Check the width and height at the failing viewport.
4. Inspect the nearest ancestors for `overflow`, clipping, transforms, and stacking contexts.
5. Toggle declarations in the Styles panel to isolate the owner.
6. Test keyboard focus and content overflow after changing the geometry.

### 21. Use Radius Tokens With Themes

A theme may change a product's tone while preserving its geometry. Keep radius tokens separate from color tokens so a dark theme or high-contrast theme does not accidentally change shape. If a brand theme intentionally changes the shape language, make the change explicit in a theme layer.

```css
:root {
  --radius-control: 0.5rem;
  --radius-card: 1rem;
}

[data-theme="compact"] {
  --radius-control: 0.375rem;
  --radius-card: 0.75rem;
}

[data-theme="expressive"] {
  --radius-control: 0.75rem;
  --radius-card: 1.25rem;
}
```

Theme variants should be tested against the same component inventory. Do not let each component invent its own override. A radius theme is a system-level decision and should be reviewed with representative forms, menus, dialogs, and media frames.

### 22. Keep Radius Stable Across Interaction States

Hover, active, disabled, and focus states should not unexpectedly change the shape unless the change is part of a deliberate motion language. A radius change on hover can make the component's edge jump or create an inconsistent hit-area impression.

```css
.action {
  border-radius: var(--radius-control);
  transition: background-color 140ms ease, box-shadow 140ms ease;
}

.action:hover {
  box-shadow: 0 3px 10px rgb(0 0 0 / 12%);
}

.action:focus-visible {
  outline: 3px solid #245fdf;
  outline-offset: 3px;
}
```

Prefer state changes in color, shadow, or small transforms when the design calls for feedback. If the radius does animate, test whether the movement distracts or changes the apparent affordance. Keep keyboard focus styling clear regardless of hover styling.

### 23. Avoid Overusing `overflow: hidden`

Clipping is often added to make a child image conform to a rounded card, then later causes menus, focus rings, tooltips, or shadows to disappear. Treat clipping as a separate layout decision. Sometimes clipping only the media region is better than clipping the entire component.

```html
<article class="product-card">
  <div class="product-card__media">
    <img src="/images/item.jpg" alt="Blue ceramic mug">
  </div>
  <div class="product-card__body">
    <h2>Blue ceramic mug</h2>
    <button type="button">Add to basket</button>
  </div>
</article>
```

```css
.product-card {
  border-radius: var(--radius-card);
  background: white;
}

.product-card__media {
  overflow: hidden;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.product-card__body {
  padding: 1rem;
}
```

This structure lets the media crop without clipping the action area. It also gives you a clearer place to inspect when the image corner does not match the card.

### 24. Validate Shape With Content and Accessibility States

A shape that looks correct with placeholder content can fail with long text, translated labels, error messages, or a focus ring. Review representative content and states before declaring a component finished. Include keyboard, screen reader, zoom, and high-contrast checks as appropriate for the product.

```html
<main>
  <section aria-labelledby="account-heading">
    <h1 id="account-heading">Account settings</h1>
    <form>
      <label for="email">Email address</label>
      <input id="email" name="email" type="email" aria-describedby="email-help">
      <p id="email-help">Use an address you can access.</p>
      <button type="submit">Update account</button>
    </form>
  </section>
</main>
```

Test the component at 200% zoom and with keyboard-only navigation. Check whether `outline-offset` remains visible, whether clipped content is intentional, and whether the rounded shape reduces available space for long labels. Shape is successful only when the component still works.

## Named Patterns

### Pattern 1: Compact Control Radius

**What it does:** Uses one restrained radius for buttons, inputs, selects, and textareas.

**When to use it:** Dense dashboards, admin tools, and products where controls should feel consistent without appearing pill-shaped.

```css
:root { --radius-control: 0.5rem; }

button,
input,
select,
textarea {
  border-radius: var(--radius-control);
}
```

### Pattern 2: Card With Inset Surface

**What it does:** Relates an outer card radius to a smaller inset content radius.

**When to use it:** Panels containing a separate inner surface, summary widgets, and nested settings groups.

```css
.card {
  --inset: 0.75rem;
  padding: var(--inset);
  border-radius: 1.25rem;
}

.card__inner {
  border-radius: calc(1.25rem - var(--inset));
}
```

### Pattern 3: Pill Badge

**What it does:** Creates fully rounded ends that adapt to content height.

**When to use it:** Status labels, filter chips, category tags, and small counts.

```css
.badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding-inline: 0.625rem;
  border-radius: 999px;
}
```

### Pattern 4: Circular Avatar

**What it does:** Crops an image into a circle.

**When to use it:** Profile images and identity markers where circular framing is a product convention.

```css
.avatar {
  width: 2.75rem;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Pattern 5: Media-Only Clipping

**What it does:** Clips an image to the card's top corners without clipping the card's actions or focus indicators.

**When to use it:** Product cards, editorial tiles, and cards with buttons that must remain visible.

```css
.tile {
  border-radius: 1rem;
}

.tile__media {
  overflow: hidden;
  border-radius: 1rem 1rem 0 0;
}
```

### Pattern 6: Keyboard-Safe Focus Ring

**What it does:** Adds an offset focus outline that follows the control's rounded shape.

**When to use it:** Interactive controls in layouts where focus must remain obvious against surrounding surfaces.

```css
.control {
  border-radius: var(--radius-control);
}

.control:focus-visible {
  outline: 3px solid #245fdf;
  outline-offset: 3px;
}
```

### Pattern 7: Direction-Aware Message Bubble

**What it does:** Uses logical corners so the bubble shape can follow writing direction.

**When to use it:** Chat interfaces and conversation histories that support right-to-left languages.

```css
.message {
  border-start-start-radius: 1rem;
  border-start-end-radius: 1rem;
  border-end-start-radius: 0.25rem;
  border-end-end-radius: 1rem;
}
```

### Pattern 8: Responsive Feature Panel

**What it does:** Adjusts a large panel radius within a bounded range.

**When to use it:** Responsive landing pages where spacious panels should feel slightly more rounded on wide screens.

```css
.feature {
  border-radius: clamp(0.875rem, 1.2vw, 1.5rem);
}
```

### Pattern 9: Progressive Squircle Enhancement

**What it does:** Uses a broadly supported rounded-square fallback and applies a newer corner shape only where supported.

**When to use it:** App icons or visual brand surfaces where a superellipse-like edge is a refinement, not a functional dependency.

```css
.app-icon {
  border-radius: 28%;
}

@supports (corner-shape: squircle) {
  .app-icon {
    corner-shape: squircle;
  }
}
```

## Before → After

### Before: Unrelated Values and Accidental Clipping

```css
.card { border-radius: 17px; overflow: hidden; }
.card button { border-radius: 3px; }
.card input { border-radius: 11px; }
.card a:focus { outline: none; }
```

Problems:
- The values do not communicate a clear hierarchy.
- Clipping the whole card can cut off focus indicators and floating descendants.
- The focus rule removes the outline without replacing it.
- Controls in the same component family have unrelated corner styles.

### After: Semantic Tokens and Deliberate Clipping

```css
:root {
  --radius-control: 0.5rem;
  --radius-card: 1rem;
}

.card {
  border-radius: var(--radius-card);
}

.card__media {
  overflow: hidden;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.card button,
.card input {
  border-radius: var(--radius-control);
}

.card a:focus-visible,
.card button:focus-visible,
.card input:focus-visible {
  outline: 3px solid #245fdf;
  outline-offset: 3px;
}
```

The revised version establishes a shared scale, limits clipping to the media area, and restores a visible keyboard focus treatment. It is still necessary to test outline contrast and parent overflow in the actual layout.

## Common Mistakes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Using a different radius on every component | Values are chosen by eye without a shared scale | Define a small primitive scale and semantic aliases; audit the component inventory |
| Making every element a pill | A pill style is copied from a trend without considering component role | Reserve the pill token for tags, chips, and components whose shape benefits from fully rounded ends |
| Applying `50%` to a non-square avatar | The author assumes percentage radius always means circle | Enforce a square box with `aspect-ratio: 1` or explicit equal dimensions |
| Rounding the parent but not its image | The image is a separate painted element and may cover the parent's background edge | Apply matching radius to the image or clip a dedicated media wrapper |
| Adding `overflow: hidden` to the whole card | Clipping seems like the quickest way to fix media corners | Clip only the media region when descendants need shadows, focus rings, menus, or tooltips |
| Removing focus outlines | Default focus styling is mistaken for a visual defect | Add a high-contrast `:focus-visible` outline and test keyboard navigation |
| Using a large radius on a short control | Radius is selected without comparing it to component height | Compare radius to control proportions and test the smallest supported size |
| Writing opaque four-value shorthand | Corner order is easy to forget during maintenance | Add a comment or use longhand properties for distinctive asymmetry |
| Assuming radius clips all descendants | Border painting and descendant clipping are conflated | Test child backgrounds and images; add a clipping wrapper where needed |
| Letting radius jump on hover | State styling is added without considering geometric continuity | Keep the radius stable unless the animation is a deliberate, tested interaction |
| Using a fixed radius for every viewport | Desktop composition is the only state reviewed | Decide whether shape should be fixed or fluid; if fluid, bound it with `clamp()` |
| Using experimental corner features as a baseline | A visual enhancement is mistaken for universal browser support | Keep a fallback and gate enhancement with `@supports`; verify target-browser support |
| Forgetting RTL behavior | Physical corner properties are used for directional components | Use logical corner properties where suitable and test in an RTL document |
| Placing focusable content inside a clipped wrapper | Media clipping is applied at the highest parent level | Move clipping to a dedicated visual child and keep controls outside it |
| Relying on radius to communicate control type | Shape is treated as the only affordance | Keep labels, borders, contrast, semantics, and interaction states clear |
| Ignoring long translated labels | The component is tested only with short English text | Test localization, zoom, and content growth; avoid fixed heights that clip text |
| Mixing border and outline assumptions | The outline is expected to occupy layout space like a border | Remember outlines do not take layout space; tune `outline-offset` and ancestor overflow |
| Treating a rounded rectangle as a circle | Width and height are not constrained | Use `aspect-ratio: 1` when a true circle is required |
| Forgetting `box-sizing` and border width | The measured outer size differs from the intended dimensions | Inspect computed dimensions and use a consistent box-sizing reset |
| Using a blob shape without checking the crop | The CSS shape is tuned around one placeholder image | Test several image subjects and adjust `object-position` and shape values together |

## Accessibility and Semantics Checklist

- Use semantic elements such as `main`, `section`, `article`, `nav`, `header`, `aside`, and `footer` to structure content.
- Use a real `button` for an action and an anchor for navigation; do not use a rounded `div` as a fake control.
- Every `input` should have an associated `label`.
- Add `aria-describedby` for help or error text when the relationship is useful.
- Add `aria-label` only when a visible label is not available or is insufficient; do not use it as a substitute for visible text without reason.
- Do not add `role` attributes that duplicate native semantics.
- Keep keyboard focus visible with `:focus-visible`.
- Check focus-ring visibility at the corners and around clipped containers.
- Ensure focus is not conveyed by color alone.
- Verify screen reader names and form instructions independently of visual styling.
- Do not use `tabindex` to force a confusing tab order.
- Meaningful images need useful `alt` text; decorative images should not create redundant announcements.
- Test high zoom and increased text size so rounded controls do not crop content.
- Check `prefers-reduced-motion` if radius changes are animated as part of an interaction.

```css
/* Radius should not compromise keyboard focus. */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 3px solid #245fdf;
  outline-offset: 3px;
  border-radius: inherit;
}
```

```css
/* If an interaction animates shape, provide a reduced-motion alternative. */
.shape-control {
  transition: border-radius 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .shape-control {
    transition: none;
  }
}
```

## Build Requirements

Implement the system according to these specific requirements:

1. Create a primitive radius scale with at least five named values.
2. Add semantic aliases for controls, cards, dialogs, badges, and avatars.
3. Replace repeated literal values with tokens where the values express the same role.
4. Include one component with asymmetric radii and explain why the asymmetry is intentional.
5. Include one pill and one circular avatar, and verify each at multiple sizes.
6. Demonstrate a nested surface with an outer and inner radius.
7. Use a dedicated media wrapper where clipping is needed.
8. Add visible keyboard focus using `:focus-visible` on interactive controls.
9. Test an ancestor with `overflow: hidden` and document what it clips.
10. Add a responsive radius only when the visual intent benefits from it.
11. Include a form with semantic labels and useful help text.
12. Test the interface at narrow, medium, and wide viewport sizes.
13. Test an RTL example if the product supports right-to-left writing.
14. Include a DevTools debugging note showing computed radius and box dimensions.
15. Add a reduced-motion rule if any radius animation exists.
16. Confirm experimental shape features have a graceful fallback.
17. Test with long content and at least one translated or expanded label.
18. Document every intentional radius exception.

## Build Challenge: The Focus Ring That Disappears

A product card has rounded corners and a cropped image. The team adds `overflow: hidden` to the entire card to make the image fit. The image now looks correct, but keyboard focus on the card's action button is cut off at the edges, and a menu opened from the button cannot extend outside the card. The issue only appears when navigating with the keyboard or opening the menu.

Your task is to fix the structure rather than merely shrinking the focus ring.

Acceptance conditions:
- Keep the card's outer radius.
- Clip only the image region.
- Preserve a clearly visible focus ring.
- Allow any floating menu to escape the card's visual bounds.
- Keep the hit target and semantic button intact.
- Confirm the result at a narrow viewport and at 200% zoom.
- Inspect the computed `overflow`, `border-radius`, and `outline` values in DevTools.
- Explain why adding a larger `z-index` alone cannot fix an ancestor's clipping.

Starter markup:

```html
<article class="product-card">
  <figure class="product-card__media">
    <img src="/images/headphones.jpg" alt="Black over-ear headphones">
  </figure>
  <div class="product-card__body">
    <h2>Studio headphones</h2>
    <button type="button" aria-haspopup="menu" aria-expanded="false">
      More actions
    </button>
    <nav class="action-menu" aria-label="Product actions">
      <ul>
        <li><a href="/products/headphones/edit">Edit product</a></li>
        <li><button type="button">Archive product</button></li>
      </ul>
    </nav>
  </div>
</article>
```

A suitable first repair is to remove clipping from `.product-card`, clip `.product-card__media` only, and position the menu in an overlay layer that is not constrained by the card. Then verify menu keyboard behavior, focus management, and screen reader announcements; a visible menu is not automatically an accessible menu.

```css
.product-card {
  position: relative;
  border-radius: var(--radius-card);
  background: white;
}

.product-card__media {
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}

.product-card__media img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.product-card button:focus-visible {
  outline: 3px solid #245fdf;
  outline-offset: 3px;
}
```

## Debugging Workflow

1. **Reproduce the exact viewport.** A radius can look different when the component's height or width changes.
2. **Select the actual node.** Confirm that the selected element is the one whose corner is visibly wrong.
3. **Read computed styles.** Use the Computed panel to inspect `border-radius`, `overflow`, `box-sizing`, and dimensions.
4. **Check the cascade.** Look for a shorthand `border-radius` declaration that resets a corner longhand, or a more specific selector that overrides the token.
5. **Inspect ancestors.** A parent may clip a focus ring or child background even when the child's radius is correct.
6. **Toggle one property at a time.** Disable `overflow`, then restore it; change one corner value at a time.
7. **Use a minimal debug helper.** Log the values for the element and its ancestors.
8. **Retest interaction.** Use keyboard navigation, open menus, inspect hover/focus/disabled states, and test at zoom.
9. **Record the cause.** State whether the problem came from the value, dimensions, cascade, clipping, or content.
10. **Retest the token system.** Confirm the fix does not create a new one-off radius that conflicts with the scale.

```js
function inspectRadius(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return;
  }

  const rows = [];
  let node = element;

  while (node && node instanceof Element) {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();

    rows.push({
      element: node.tagName.toLowerCase(),
      className: typeof node.className === "string" ? node.className : "",
      radius: style.borderRadius,
      overflow: `${style.overflowX} / ${style.overflowY}`,
      outline: `${style.outlineStyle} ${style.outlineWidth}`,
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });

    node = node.parentElement;
  }

  console.table(rows);
}

inspectRadius(".product-card button");
```

Use this helper as a temporary debugging aid, not as application code. It records the target and its ancestors so the source of clipping is easier to locate. Remove or isolate diagnostic scripts after the investigation.

## Mental Models

1. **A radius is geometry, not decoration.** It changes the silhouette and the space a corner visually occupies.
2. **Tokens express relationships.** The best radius scale is a small vocabulary with roles, not a long list of unrelated numbers.
3. **Proportion changes perception.** The same numeric radius can feel subtle on a large card and extreme on a short control.
4. **A rounded parent does not guarantee rounded descendants.** Background painting, image boxes, and clipping are separate concerns.
5. **Clipping has consequences.** `overflow: hidden` can solve one visual issue while breaking focus, menus, or shadows.
6. **Focus must survive the shape.** Keyboard indicators are part of the component's geometry and need room to render.
7. **Asymmetry needs a reason.** A unique corner pattern should reinforce hierarchy, direction, or brand identity.
8. **Responsive values need bounds.** Fluid radii should have a deliberate minimum and maximum.
9. **A circle requires a square box.** Percentage radii follow box dimensions, not the designer's intention.
10. **Fallbacks protect function.** Experimental corner-shaping features should refine a component rather than determine whether it works.
11. **Inspect the rendered result.** Computed styles and ancestor inspection reveal problems that source reading can miss.
12. **Accessibility is part of visual QA.** Labels, keyboard access, screen reader output, focus visibility, and zoom belong in the same completion review.

## Quick Reference

| Situation | Recommended value or approach | Notes |
|---|---|---|
| Standard button | `var(--radius-control)` | Match related form controls |
| Text input | `var(--radius-control)` | Preserve space for text and focus |
| Card | `var(--radius-card)` | Larger than controls in many systems |
| Dialog | `var(--radius-dialog)` | Check viewport edges and scroll behavior |
| Status badge | `999px` | Works for varying label widths |
| Circular avatar | `50%` plus square dimensions | Use `aspect-ratio: 1` |
| Image crop | Radius on image or media wrapper | Avoid clipping the entire interactive card |
| Nested surface | Outer radius minus inset as a starting point | Check border widths and actual rendered corners |
| Asymmetric card | Four-value shorthand or longhands | Comment the intended corner order |
| Organic visual | Elliptical or percentage radii | Test multiple images and aspect ratios |
| Responsive feature | `clamp(min, fluid, max)` | Use only if the shape should scale |
| RTL chat bubble | Logical corner properties | Test both writing directions |
| Keyboard focus | `:focus-visible` outline with offset | Ensure ancestors do not clip it |
| Squircle-like icon | Rounded-square fallback plus progressive enhancement | Verify target browser support |
| Hidden menu | Overlay outside clipping ancestor | A higher `z-index` cannot escape clipping |
| Unexpected corner | Inspect computed `border-radius` | Check shorthand resets and specificity |
| Image with visible seam | Match wrapper and image geometry | Check `display: block` and crop |
| Rounded outline mismatch | Tune outline offset and border radius | Outline does not take layout space |
| Zoomed form | Flexible height and padding | Avoid fixed-height text clipping |
| Animated radius | Restrained transition and reduced-motion rule | Avoid unnecessary movement |

## Gotcha Callouts

> **Gotcha 1 — `border-radius` does not fix every image corner.** The image may cover the parent's rounded background. Round the image itself or clip a dedicated media wrapper.

> **Gotcha 2 — `overflow: hidden` can hide focus.** A perfect card crop is not worth an invisible keyboard indicator. Move clipping to a child where possible.

> **Gotcha 3 — Four values have a fixed order.** The order is top-left, top-right, bottom-right, bottom-left. When the pattern is unusual, use longhands or a comment.

> **Gotcha 4 — `50%` is not always a circle.** On a rectangle it produces an ellipse. Enforce square dimensions for circular avatars and indicators.

> **Gotcha 5 — A pill radius is dimension-relative.** `999px` is a convenient way to request fully rounded ends, but the component still needs sensible height and padding.

> **Gotcha 6 — A larger `z-index` does not defeat clipping.** Stacking order and overflow clipping are different mechanisms. Move the floating element outside the clipping ancestor or use an appropriate overlay strategy.

> **Gotcha 7 — New corner-shaping features need a fallback.** Do not assume a feature is supported everywhere because it works in one browser preview.

> **Gotcha 8 — Radius changes can alter perceived affordance.** Keep the shape stable across interaction states unless the movement has a clear, tested purpose.

## Definition of Done

- [ ] The project has a documented primitive radius scale and semantic aliases.
- [ ] Components use role-based tokens rather than arbitrary repeated values.
- [ ] Pills, circles, asymmetric corners, and nested surfaces have been tested at multiple sizes.
- [ ] Media clipping is isolated from controls wherever practical.
- [ ] Keyboard focus is visible, has adequate contrast, and is not clipped.
- [ ] Semantic HTML is used for navigation, forms, buttons, and content regions.
- [ ] Inputs have labels and relevant help/error descriptions.
- [ ] The UI has been checked at narrow, medium, and wide viewports.
- [ ] Long labels, zoom, and relevant localized layouts do not crop content.
- [ ] Computed styles and ancestors have been inspected for any unresolved corner issue.
- [ ] Experimental corner features have a graceful fallback and verified browser support.
- [ ] Any shape animation respects `prefers-reduced-motion`.
- [ ] Exceptions to the radius system are intentional and documented.
- [ ] The build challenge passes with the focus ring visible and the menu able to escape the card bounds.


## Supplemental Implementation Notes

### Radius Token Governance

Treat radius tokens as part of the same governance process as color, spacing, and typography tokens. A token should have an owner, a stated purpose, and a known set of consumers. During a design review, ask whether a new radius represents a real visual role or merely captures a local preference. If several components independently request the same new value, update the shared scale rather than leaving duplicate literals.

A token migration should be incremental. Introduce the tokens, map existing components to the nearest semantic role, compare screenshots, and document exceptions. Do not replace every literal radius mechanically if the values are serving different purposes. A small badge, a modal, and a large image mask may all have different constraints even if their current values happen to match.

```css
:root {
  --radius-none: 0;
  --radius-tight: 0.25rem;
  --radius-control: 0.5rem;
  --radius-card: 0.875rem;
  --radius-overlay: 1rem;
  --radius-feature: 1.5rem;
  --radius-pill: 999px;
  --radius-circle: 50%;
}
```

### Component Inventory Review

Create an inventory that lists each component, its radius token, its clipping behavior, and its focus behavior. This catches inconsistent patterns that are hard to see when reviewing a page one component at a time. Include normal, hover, active, disabled, error, and focus states where relevant.

| Component | Radius token | Clipping owner | Focus check |
|---|---|---|---|
| Primary button | control | none | outline visible |
| Text input | control | none | outline visible |
| Select trigger | control | none | outline visible |
| Card | card | media child only | descendants not clipped |
| Dialog | overlay | content-specific | focus remains inside dialog |
| Avatar | circle | avatar frame | not usually focusable |
| Badge | pill | none | if interactive, keyboard visible |
| Image tile | card | image wrapper | controls outside clip |

```js
const components = [...document.querySelectorAll("[data-radius-audit]")];

console.table(components.map((element) => {
  const style = getComputedStyle(element);
  return {
    component: element.dataset.radiusAudit,
    radius: style.borderRadius,
    overflow: style.overflow,
    outlineStyle: style.outlineStyle,
    outlineWidth: style.outlineWidth
  };
}));
```

This audit snippet expects components to opt in with a `data-radius-audit` attribute. It is useful during a manual QA pass, but it cannot determine whether a shape is aesthetically correct or whether a focus indicator has sufficient contrast. Human review remains necessary.

### Browser and Rendering Considerations

Most common `border-radius` usage is widely supported, but exact visual rendering can differ slightly because of antialiasing, device-pixel ratios, transforms, borders, and fractional layout dimensions. A half-pixel edge can look softer on one display than another. Avoid screenshot comparisons that assume every rasterized corner will be byte-identical across operating systems.

If an element is transformed, scaled, or animated, the final edge may be rasterized differently. If a radius appears blurry, inspect whether the element has a fractional transform or size. Do not add `will-change` automatically; it is not a general-purpose fix for corner quality and can increase rendering costs or alter compositing behavior.

```css
/* Keep the geometry predictable before trying rendering workarounds. */
.avatar-frame {
  width: 3rem;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

### Radius and Shadows

A shadow is not a border and does not affect layout dimensions. A shadow generally follows the rounded outline of the element, but inset shadows, child shadows, filters, and clipping can create a different visual result. A parent with `overflow: hidden` may clip a child's shadow. Avoid compensating for a clipped shadow by making it excessively large; first determine which element owns the shadow and which ancestor clips it.

```css
.elevated-card {
  border-radius: var(--radius-card);
  box-shadow: 0 8px 24px rgb(16 24 40 / 12%);
}

.elevated-card__media {
  overflow: hidden;
  border-radius: var(--radius-card) var(--radius-card) 0 0;
}
```

Inspect the shadow and radius as a pair. A broad shadow around a very tight corner may feel mismatched, while a soft large card radius can support a softer elevation. These are design judgments, so compare the component in context instead of enforcing a universal numeric ratio.

### Radius and Hit Areas

The clickable area of a button is still its rectangular box for pointer hit-testing in ordinary CSS layout, even when the visible corners are rounded. The corner pixels outside the painted curve may remain part of the element's hit area. This is usually helpful for usability. Do not reduce the button's hit target to match the visible curve unless a deliberate nonrectangular hit area is truly required and tested.

```css
.icon-button {
  width: 2.75rem;
  height: 2.75rem;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
}
```

A circular icon button still needs an accessible name, such as visible text or an `aria-label` that accurately describes the action. The shape does not tell a screen reader what the button does. Confirm the target size is usable and that the focus outline remains visible around the circle.

### Radius and Content Density

Dense interfaces often benefit from restrained radii because too much rounding creates many competing soft edges. Spacious marketing pages may use larger radii to support a more expressive visual language. Density is not a rule by itself: a compact data grid can use a moderate radius on its primary panel while keeping table cells square for alignment and scanability.

```css
.data-panel {
  border-radius: var(--radius-card);
  overflow: visible;
}

.data-panel table {
  border-collapse: separate;
  border-spacing: 0;
}

.data-panel th,
.data-panel td {
  border-radius: 0;
}
```

Do not round every table cell independently unless the design specifically calls for card-like cells. Repeated rounded corners in a grid can create visual noise and reduce the sense of aligned columns. Use radius to establish component boundaries, not to decorate every rectangle.

### Radius QA Matrix

Review at least these combinations before release:

- Small control with a large text label.
- Large card with a small inset surface.
- Image with a subject close to the edge.
- Card with a shadow and a visible keyboard focus ring.
- Dropdown or tooltip near a rounded container edge.
- Dialog near the viewport boundary.
- Circular avatar with a landscape source image.
- Pill badge with a long translated label.
- Asymmetric component in both LTR and RTL contexts when relevant.
- Component at browser zoom and increased text size.
- Component with a long error message.
- Component rendered at a fractional width.
- Component under hover, active, disabled, and focus states.
- Component using any progressive enhancement property.

```css
/* Test a long label without forcing text to be clipped by fixed height. */
.filter-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  max-width: 100%;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-pill);
  white-space: normal;
  overflow-wrap: anywhere;
}
```

### Review Questions

Ask these questions during code review:

1. Does the token name describe a role or merely preserve a number?
2. Is the radius appropriate for the component's smallest size?
3. Does the shape communicate a meaningful hierarchy or interaction family?
4. Is asymmetry intentional and documented?
5. Does any ancestor clip focus, shadow, menu, tooltip, or validation feedback?
6. Does the media wrapper own clipping rather than the whole interactive card?
7. Do keyboard focus and hover states remain clear?
8. Do long labels and error messages fit?
9. Does the design work in RTL where required?
10. Is a new CSS feature safely progressive-enhanced?
11. Can the same token be reused, or is a genuine exception necessary?
12. Has the rendered result been inspected in DevTools at the failing viewport?

### Failure Triage Examples

**Symptom: one corner is square.** Check for a later shorthand declaration such as `border-radius: 0`, a more specific selector, or a child element covering the parent corner. Inspect computed styles and the actual element dimensions.

**Symptom: the image corners are square while the card corners are rounded.** The image is painted above the card background. Apply radius to the image or clip a dedicated media wrapper.

**Symptom: the focus ring disappears on the right edge.** Inspect every ancestor for overflow clipping and verify that the outline offset has room. Increasing `z-index` does not remove overflow clipping.

**Symptom: the shape looks too round on mobile.** Compare the radius to the compact component height. Use a smaller semantic token or a bounded responsive value if the design intent calls for it.

**Symptom: the pill becomes oval or distorted.** Check whether the design actually requires a pill, whether height is constrained, and whether the child text or padding causes the control to grow.

**Symptom: two nested surfaces have a strange dark seam.** Check parent and child backgrounds, border widths, fractional dimensions, and whether both elements have independent shadows. Tune the inset radius based on the rendered geometry, not only a formula.

```js
function inspectBox(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const s = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    selector,
    radius: s.borderRadius,
    border: `${s.borderTopWidth} ${s.borderRightWidth} ${s.borderBottomWidth} ${s.borderLeftWidth}`,
    overflow: `${s.overflowX}/${s.overflowY}`,
    dimensions: `${r.width.toFixed(2)} × ${r.height.toFixed(2)}`,
    transform: s.transform
  };
}

console.table([
  inspectBox(".surface"),
  inspectBox(".surface__content")
].filter(Boolean));
```

### Additional Mental Checks

- A visual corner is the result of an element's geometry and the content painted over it.
- The radius scale should be small enough to learn and large enough to express real roles.
- A semantic token makes a future design change safer because the intended relationship is named.
- Clipping is a containment decision with interaction consequences.
- A `z-index` change cannot make a descendant paint outside an ancestor's clipping region.
- A visible outline must remain visible against both the control and the page background.
- A shape can be attractive in a screenshot and still fail at zoom, localization, or keyboard focus.
- Progressive enhancement should never make the baseline shape unusable.
- A screenshot diff is evidence, not a substitute for checking keyboard and screen reader behavior.
- A unique shape should be a deliberate part of the visual language, not a collection of unrelated exceptions.

### Final Implementation Review

Before merging a radius-system change, compare representative screenshots from the previous and new implementation. Review cards, controls, menus, dialogs, badges, avatars, and image frames in a shared context. Look for both local quality and system consistency. If the change updates a semantic token, inspect every component that consumes it so that a radius adjustment does not unexpectedly affect unrelated parts of the interface.

Run the keyboard review separately from the visual screenshot review. Move through every interactive control with Tab and Shift+Tab, verify focus visibility, open menus, and confirm focus does not become trapped or hidden. Use screen reader output to check labels and descriptions. The goal is not merely to make the corners match; it is to make the component family coherent and robust.

```html
<header class="site-header">
  <nav aria-label="Primary navigation">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/work">Work</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>
<main>
  <section aria-labelledby="radius-demo-heading">
    <h1 id="radius-demo-heading">Radius system demo</h1>
    <aside aria-label="Preview notes">
      <p>Check shape, clipping, keyboard focus, and responsive behavior.</p>
    </aside>
    <article class="demo-card">
      <figure>
        <img src="/images/preview.jpg" alt="A preview of the product interface">
        <figcaption>Representative media frame</figcaption>
      </figure>
      <form>
        <label for="demo-name">Name</label>
        <input id="demo-name" name="name" aria-describedby="demo-help">
        <p id="demo-help">This is a sample input used for visual QA.</p>
        <button type="button" aria-label="Open preview actions">Actions</button>
      </form>
    </article>
  </section>
</main>
```

This semantic example deliberately includes navigation, main content, a section, an aside, an article, a figure, a form, a label, an input, and a button. Use elements because of their meaning, not because a particular shape needs a convenient selector. Keep CSS classes focused on styling roles and keep accessible names connected to the actual control purpose.
