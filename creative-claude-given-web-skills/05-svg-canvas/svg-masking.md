# SVG Masking — Production Skill Guide

## Why This Matters

SVG masking is the difference between a deliberate art-directed reveal and a brittle clipping hack. In production interfaces, masks are used to reveal a portrait through an irregular editorial shape, feather the edge of a hero image, place a moving gradient inside a wordmark, transition between project thumbnails, or build a responsive illustration whose silhouette stays stable as its content changes. A mask can also quietly make important content disappear: a white mask rendered against the wrong background may reveal nothing, an `id` collision can cause a component to use another component's mask, a filter region can crop the very blur that gives the edge its softness, and a luminance mask can behave differently from an alpha mask when colors or opacity are changed.

The failure modes are unusually visual and therefore easy to misdiagnose. A mask that looks correct in a standalone SVG may fail when inlined twice in a component tree. A mask may work in Chromium but expose a Safari issue involving SVG references, transforms, or filter bounds. A mask that looks like a harmless decorative effect can hide keyboard focus, cut off a tooltip, or make a chart's data unreadable in high-contrast mode. Raster fallbacks may blur at high device-pixel ratios, while an overcomplicated vector mask can force expensive rasterization during scroll or animation. If a mask is applied to the wrong element, debugging its geometry alone will not help; the actual issue may be the reference URL, the coordinate system, or the element's stacking and compositing context.

This guide treats masking as a system: choose the correct primitive, define coordinates intentionally, understand alpha and luminance, build reusable mask geometry, test the mask at real viewport sizes, and give the design a safe reduced-motion and no-mask fallback. The goal is not to apply masks everywhere. The goal is to use them when they provide a meaningful visual result, keep their behavior predictable, and preserve the content if the effect fails.

## Scope and Non-Goals

This skill covers SVG `<mask>`, alpha and luminance semantics, `maskUnits`, `maskContentUnits`, `mask-type`, coordinate systems, reusable mask definitions, CSS `mask-image` relationships, filters used with masks, responsive and animated masks, accessibility, performance, browser testing, and debugging. It assumes basic SVG paths, gradients, viewBox, and CSS selectors.

This is not a full guide to SVG clipping paths, SVG filters, or animation timing. A `<clipPath>` is often the better choice for a hard binary boundary; SVG filters deserve a dedicated treatment when blur, displacement, turbulence, or compositing is the main effect. Use the right primitive instead of forcing every shape problem through a mask.

## Core Concepts

### 1. Masking Is a Per-Pixel Visibility Field

A mask does not normally change the geometry of the element it masks. It changes how much of that element contributes to the rendered result at each pixel. This distinction matters when an image remains interactive across a region that is visually transparent, when a filter extends beyond the apparent edge, or when hit testing does not match the designer's expectation. Think of the mask as a visibility field that is sampled during compositing, not as a path that physically cuts the element into a new shape.

A simple SVG mask uses a white region to reveal and a black region to conceal when luminance semantics are active. Intermediate gray values produce partial visibility. Under alpha semantics, opacity is the key variable: opaque pixels reveal, transparent pixels hide, and partial alpha gives partial visibility. This is why changing a mask's fill from black to white may affect one mask but not another depending on the selected mask type and browser behavior.

```html
<svg viewBox="0 0 600 320" role="img" aria-labelledby="masked-title">
  <title id="masked-title">Landscape revealed through a soft oval</title>
  <defs>
    <mask id="landscape-mask" maskUnits="objectBoundingBox" mask-type="luminance">
      <rect width="1" height="1" fill="black" />
      <ellipse cx="0.5" cy="0.5" rx="0.42" ry="0.38" fill="white" />
    </mask>
  </defs>
  <image href="landscape.jpg" width="600" height="320"
         preserveAspectRatio="xMidYMid slice" mask="url(#landscape-mask)" />
</svg>
```

In real projects, choose coordinate units deliberately; the example emphasizes the visibility model, not a universal coordinate setup. `objectBoundingBox` values are normalized against the target's bounding box, so values like `1` represent the full box rather than one SVG user unit.

**Gotcha:** A mask can make a region visually transparent without removing it from the DOM or guaranteeing that pointer hit-testing follows the visible pixels. Do not use visual masking as a substitute for disabling an interaction or defining a true interaction boundary.

### 2. Alpha Masks and Luminance Masks Are Different Contracts

An alpha mask uses the opacity channel of the mask content. A luminance mask uses the perceived brightness of its color, combined with alpha. For luminance masks, white generally reveals, black conceals, and gray partially reveals. For alpha masks, opaque black can reveal just as strongly as opaque white because the alpha value—not the hue—is the signal. Confusing these models causes the classic “everything disappeared” bug when the author assumes black means transparent under alpha semantics.

Prefer an explicit `mask-type` declaration where supported and test it in target browsers. The CSS `mask-type` property and SVG mask attributes have had differing support details over time, so a production implementation should not assume a single declaration is enough for every browser engine. If the design only needs a hard silhouette, a clip path may be simpler and more interoperable.

```html
<svg viewBox="0 0 400 240" aria-hidden="true">
  <defs>
    <mask id="alpha-reveal" mask-type="alpha">
      <!-- Opaque black still reveals in an alpha mask. -->
      <rect width="400" height="240" fill="black" />
      <circle cx="200" cy="120" r="90" fill="white" fill-opacity="0.45" />
    </mask>
    <mask id="luminance-reveal" mask-type="luminance">
      <rect width="400" height="240" fill="black" />
      <circle cx="200" cy="120" r="90" fill="white" fill-opacity="0.45" />
    </mask>
  </defs>
  <rect width="400" height="240" fill="#d7d7d7" mask="url(#alpha-reveal)" />
</svg>
```

The example defines both contracts but applies one. To diagnose a mask, temporarily render its source content directly, inspect computed values, and confirm whether the intended channel is alpha or luminance. A mask that is technically valid but semantically misunderstood can be harder to spot than a syntax error.

### 3. `maskUnits` Defines the Mask Region's Coordinate System

`maskUnits` controls the coordinate system used for the mask region—the area that bounds the effect. The common values are `objectBoundingBox` and `userSpaceOnUse`. With `objectBoundingBox`, coordinates are normalized to the target bounding box. With `userSpaceOnUse`, coordinates are expressed in the current SVG user coordinate system. The region matters because content outside it is clipped from the mask calculation, even if the mask's shapes extend farther.

The default mask region historically surprises authors because it is not necessarily the whole target, and soft effects can be cut off at the edge. When using a blur, feather, or moving mask, enlarge the region enough to include the full effect. Do not automatically use huge bounds: overly large offscreen areas can increase raster work, especially when the mask is animated or applied to a large element.

```html
<svg viewBox="0 0 800 400">
  <defs>
    <mask id="soft-window" maskUnits="userSpaceOnUse"
          x="-40" y="-40" width="880" height="480">
      <rect x="0" y="0" width="800" height="400" fill="black" />
      <ellipse cx="400" cy="200" rx="260" ry="130" fill="white" />
    </mask>
  </defs>
  <image href="portrait.jpg" width="800" height="400"
         preserveAspectRatio="xMidYMid slice" mask="url(#soft-window)" />
</svg>
```

Use `userSpaceOnUse` when the mask should align to the SVG's coordinate grid or when predictable absolute geometry is important. Use `objectBoundingBox` when the mask should scale with the target's bounding box. Verify the region against the actual target element, not only the outer `<svg>` viewport.

**Gotcha:** Enlarging the SVG viewBox does not automatically enlarge the mask region. The mask has its own coordinate settings and bounds.

### 4. `maskContentUnits` Controls the Mask's Children

`maskContentUnits` is separate from `maskUnits`. It defines the coordinate system for shapes inside the mask. It can be `userSpaceOnUse` or `objectBoundingBox`. It is possible to have a region expressed in user space while the mask's child geometry uses normalized object-bounding-box coordinates, or vice versa. This can be useful, but mixed coordinate systems increase cognitive load and should be documented.

When an SVG scales, an object-bounding-box mask can stretch relative to the masked target. A user-space mask can preserve relationships to the SVG's drawing coordinates. Neither is universally better. The correct choice depends on whether the reveal should be attached to the target's proportions or to the illustration's composition.

```html
<svg viewBox="0 0 500 300" role="img" aria-label="Card image with circular reveal">
  <defs>
    <mask id="card-reveal" maskUnits="objectBoundingBox"
          maskContentUnits="objectBoundingBox" mask-type="luminance">
      <rect x="0" y="0" width="1" height="1" fill="black" />
      <circle cx="0.5" cy="0.5" r="0.42" fill="white" />
    </mask>
  </defs>
  <image href="card.jpg" width="500" height="300"
         preserveAspectRatio="xMidYMid slice" mask="url(#card-reveal)" />
</svg>
```

For normalized mask content, use fractional coordinates and keep them inside the expected range unless intentional overflow is part of the effect. For user-space content, relate the shapes to the SVG viewBox and remember transforms on the target can affect the relationship.

### 5. Unique IDs Are Required for Reliable Reuse

SVG mask references use fragment identifiers such as `mask="url(#hero-mask)"`. IDs must be unique in the relevant document. In component-driven applications, a component may render several times with the same hard-coded ID. The browser can then resolve the reference to an unexpected definition, often producing a bug that appears only when multiple cards or modals are on the page.

Create IDs per component instance, or centralize reusable definitions at a level that guarantees uniqueness. Frameworks such as React provide `useId()` for stable, unique identifiers within the rendered tree; other frameworks have equivalent mechanisms or can accept a generated ID prop. Avoid random IDs generated during render if they can cause server/client hydration mismatches.

```jsx
import { useId } from "react";

function MaskedThumbnail({ src, alt }) {
  const reactId = useId();
  const maskId = `thumbnail-mask-${reactId.replace(/:/g, "")}`;

  return (
    <svg viewBox="0 0 320 200" role="img" aria-label={alt}>
      <defs>
        <mask id={maskId} mask-type="luminance">
          <rect width="320" height="200" fill="black" />
          <path d="M0 25 Q160 -20 320 25 V175 Q160 220 0 175Z" fill="white" />
        </mask>
      </defs>
      <image href={src} width="320" height="200"
             preserveAspectRatio="xMidYMid slice" mask={`url(#${maskId})`} />
    </svg>
  );
}
```

The exact ID formatting may be adapted to your framework and SVG usage. The essential contract is that each instance's reference matches its own definition. Test a page with at least three instances, including conditional mounts and unmounts.

**Gotcha:** A mask may work perfectly in a single isolated story and fail in a real page because a second component instance reused its ID.

### 6. Masks Versus Clip Paths

A clip path defines a geometric region with a hard boundary. A mask defines a per-pixel visibility field and can express gradients, partial opacity, texture, and feathering. If the edge should be binary—visible or not visible—prefer `<clipPath>` when it meets the design. Clip paths often have a simpler rendering model and can be easier to debug. Masks are appropriate when the edge itself carries information, such as a gradient fade or an irregular transparency transition.

Do not use a mask merely because a design tool exported one. Simplifying a binary mask into a clip path may reduce rendering cost and improve predictability. Conversely, replacing a feathered mask with a clip path will destroy the intended edge treatment. Match the primitive to the required visual semantics.

```html
<svg viewBox="0 0 360 220" aria-hidden="true">
  <defs>
    <clipPath id="hard-blob">
      <path d="M25 110 C25 20 130 10 180 45 C240 5 335 55 335 120 C335 195 230 210 180 175 C100 220 25 180 25 110Z" />
    </clipPath>
    <mask id="soft-blob" mask-type="luminance">
      <rect width="360" height="220" fill="black" />
      <path d="M25 110 C25 20 130 10 180 45 C240 5 335 55 335 120 C335 195 230 210 180 175 C100 220 25 180 25 110Z" fill="white" />
      <ellipse cx="180" cy="110" rx="130" ry="75" fill="white" fill-opacity="0.25" />
    </mask>
  </defs>
  <image href="photo.jpg" width="360" height="220" clip-path="url(#hard-blob)" />
</svg>
```

The clip path above illustrates a hard silhouette. The mask variant would be selected for the soft, partially transparent treatment. Avoid maintaining both variants unless the product genuinely needs both.

### 7. Gradients Make Masks Useful for Soft Reveals

A gradient inside a mask maps a continuous transition into visibility. This is a common way to fade an image into a background, create a vignette, or reveal a section as a wipe moves across it. For a luminance mask, white represents full reveal and black represents concealment; the gradient's stop colors define the transition. For an alpha mask, use the alpha of stops deliberately, and do not assume black is hidden if it remains opaque.

A gradient mask is often more robust than a large blurred shape when a simple linear or radial transition is enough. It has fewer moving parts, and its geometry can be animated without a blur filter. However, if the background is not a solid color, fading to transparency is usually safer than fading toward a guessed background color. A gradient that fades to the page's current background color will show a seam when the theme changes or when the image overlaps another surface.

```html
<svg viewBox="0 0 900 360" role="img" aria-label="Landscape fading at its right edge">
  <defs>
    <linearGradient id="edge-fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="white" />
      <stop offset="0.72" stop-color="white" />
      <stop offset="1" stop-color="black" />
    </linearGradient>
    <mask id="edge-fade-mask" mask-type="luminance">
      <rect width="900" height="360" fill="url(#edge-fade)" />
    </mask>
  </defs>
  <image href="wide-landscape.jpg" width="900" height="360"
         preserveAspectRatio="xMidYMid slice" mask="url(#edge-fade-mask)" />
</svg>
```

Use a gradient stop layout that matches the intended crop. If the mask should remain centered on a face or object, account for responsive image cropping rather than assuming the image content and mask always share the same focal point.

### 8. Feathered Edges and Filter Bounds

A Gaussian blur can soften a mask's shape, but blur expands visible influence beyond the original geometry. If the filter region is too small, the blur will be clipped and create an unexpected hard edge. If it is too large, the effect can be expensive. The best starting point is to define a reasonable filter region and inspect the full rendered effect at its largest size.

For many designs, a gradient offers a simpler and more predictable feather than a blur. Use blur when the transition must follow an irregular edge or when the art direction explicitly calls for a diffused silhouette. Avoid stacking multiple blur filters onto a large image mask without measuring the cost.

```html
<svg viewBox="0 0 640 360" aria-hidden="true">
  <defs>
    <filter id="feather" x="-15%" y="-15%" width="130%" height="130%">
      <feGaussianBlur stdDeviation="8" />
    </filter>
    <mask id="feathered-shape" mask-type="luminance"
           x="-15%" y="-15%" width="130%" height="130%">
      <rect width="640" height="360" fill="black" />
      <path d="M70 190 C70 60 220 25 320 110 C420 15 570 80 570 190 C570 310 400 330 320 250 C220 330 70 290 70 190Z"
            fill="white" filter="url(#feather)" />
    </mask>
  </defs>
  <image href="portrait.jpg" width="640" height="360"
         preserveAspectRatio="xMidYMid slice" mask="url(#feathered-shape)" />
</svg>
```

**Gotcha:** A blur that is clipped by either the filter region or the mask region can look like a geometry problem. Inspect both regions before rewriting the path.

### 9. Coordinate Systems and Transform Order

Masks are evaluated in relation to their target, their own region, their child content, and any transforms applied in the SVG tree. If the target is scaled or translated, the apparent alignment depends on the selected coordinate systems. A transform on a group containing both the target and mask reference may behave differently from a transform applied only to the target. Keep geometry in one understandable coordinate system wherever possible.

When the mask seems displaced, reduce the problem: draw the target outline, render the mask content without applying it, remove transforms, then restore transforms one by one. This is more reliable than adjusting coordinates until the result looks correct at a single viewport. Remember that an SVG `viewBox` maps user units to the rendered viewport; a CSS width change does not mean one user unit equals one CSS pixel.

```html
<svg viewBox="0 0 400 260" aria-hidden="true">
  <defs>
    <mask id="coordinate-window" maskUnits="userSpaceOnUse">
      <rect width="400" height="260" fill="black" />
      <circle cx="200" cy="130" r="90" fill="white" />
    </mask>
  </defs>
  <g transform="translate(10 0)">
    <image href="portrait.jpg" x="0" y="0" width="400" height="260"
           preserveAspectRatio="xMidYMid slice" mask="url(#coordinate-window)" />
  </g>
</svg>
```

The example intentionally moves the target group while the mask's geometry remains in SVG user space. If that is not the intended relationship, put the target and mask-related geometry under a shared transformed group or change the coordinate strategy. The goal is to encode the intended relationship, not rely on accidental alignment.

### 10. Responsive Masks Must Follow the Actual Content

Responsive masking fails when a mask is designed for one aspect ratio but the target is cropped differently at smaller sizes. A centered circle can be mathematically centered and still hide the subject's face because `preserveAspectRatio="xMidYMid slice"` crops the image before the reveal is perceived. The mask needs to be evaluated against the displayed crop, not the source image dimensions alone.

Use normalized coordinates for masks that should scale with the target. Use media queries or container queries when the art direction should change, such as a broad horizontal reveal on desktop and a taller oval on mobile. If a focal point is configurable, expose it as a prop or CSS custom property rather than burying a one-off offset inside a path.

```css
.media-frame {
  --mask-focus-x: 50%;
  --mask-focus-y: 50%;
  overflow: hidden;
}

.media-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--mask-focus-x) var(--mask-focus-y);
}

@media (max-width: 42rem) {
  .media-frame {
    --mask-focus-x: 58%;
    --mask-focus-y: 42%;
  }
}
```

This CSS controls image focal position; a corresponding SVG mask should use matching responsive logic. Test at intermediate widths as well as the named breakpoint. A mask that works at 390px and 1440px can still fail at 820px if the subject crop changes continuously while the mask changes discretely.

### 11. CSS Masks and SVG Masks Are Related but Not Interchangeable

CSS `mask-image` can use image sources, gradients, and supported SVG sources. SVG's `mask` attribute references an SVG `<mask>` definition. These systems share concepts but have different syntax, sizing, positioning, and browser support details. A CSS mask may be the easiest choice for a gradient fade on a normal HTML element, while an SVG mask is appropriate when the mask geometry belongs naturally to the SVG illustration or needs SVG primitives.

Do not copy declarations between the two APIs without checking their semantics. CSS `mask-size`, `mask-position`, and `mask-repeat` control CSS mask layers; SVG `maskUnits` and `maskContentUnits` control SVG mask coordinates. Vendor-prefixed properties may be required for some WebKit-era support targets, but test actual supported browsers rather than blindly adding prefixes. If the design can be achieved with a CSS gradient mask, that may be more maintainable than embedding a large SVG definition.

```css
.hero-image {
  -webkit-mask-image: linear-gradient(to right, #000 0%, #000 70%, transparent 100%);
  mask-image: linear-gradient(to right, #000 0%, #000 70%, transparent 100%);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}
```

The exact CSS mask support and prefixed behavior should be checked against the project's browser matrix. Keep a non-masked fallback when the mask is decorative and content must remain visible.

### 12. Animating Mask Geometry Safely

Mask animation can create wipe reveals, spotlight effects, and transitions between images. The key decision is what property changes and how often it changes. Animating a gradient stop, mask position, or complex path may trigger expensive painting or rasterization. A transform on a small, isolated mask element can be more efficient in some compositions, but performance is browser- and scene-dependent; do not assume all SVG transforms are GPU-accelerated.

For interaction-driven effects, prefer a small number of well-defined states and avoid updating a large path on every pointer event if a simpler transform can express the same motion. Keep animation decorative when possible, stop it when the element is offscreen, and honor reduced-motion preferences. A transition should not be the only way to discover important content.

```css
.mask-reveal {
  transform-box: fill-box;
  transform-origin: center;
  transform: scaleX(0.02);
  transition: transform 650ms cubic-bezier(.2, .75, .25, 1);
}

.mask-reveal[data-visible="true"] {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: reduce) {
  .mask-reveal {
    transition: none;
    transform: none;
  }
}
```

This example animates a reveal element rather than assuming arbitrary mask path interpolation is cheap or universally supported. Ensure the initial state does not hide essential content from users who have scripting disabled or whose animation never runs.

**Gotcha:** A mask reveal that depends on a JavaScript class being added after hydration can leave the content hidden if the script fails. Design the no-script state first, then add the animated state progressively.

### 13. Accessible Semantics and Non-Visual Fallbacks

A mask is a visual presentation technique, not an accessible name. If an SVG communicates meaningful content, provide an appropriate accessible name or text alternative. If the SVG is purely decorative, remove it from the accessibility tree with `aria-hidden="true"` and ensure it contains no focusable controls. For HTML images, use meaningful `alt` text where the image itself carries content. Do not rely on masked text or an animated reveal to convey instructions that are unavailable in the DOM.

Keyboard focus must remain visible. If a masked card contains a link or button, test the focus outline at every edge of the mask. A focus ring can be clipped by `overflow: hidden`, a clip path, or the visible mask treatment. Provide a visible focus indicator outside the masked image layer, or place the focusable element in a wrapper whose outline is not clipped. Avoid using a mask to hide controls or make disabled-looking content appear interactive.

```html
<a class="project-card" href="/work/identity-system">
  <span class="project-card__media" aria-hidden="true">
    <img src="identity.jpg" alt="" />
  </span>
  <span class="project-card__title">Identity system</span>
</a>
```

```css
.project-card {
  display: block;
  border-radius: 1rem;
  outline-offset: 5px;
}

.project-card:focus-visible {
  outline: 3px solid currentColor;
}

.project-card__media {
  display: block;
  overflow: hidden;
  border-radius: inherit;
}
```

Here the visual image is decorative because the linked title names the destination. If the image communicates unique information not expressed by the title, use a meaningful text alternative instead. Test keyboard-only use and screen-reader output, not just a visual screenshot.

### 14. Performance: Pixel Area, Filters, and Repaint Cost

Mask performance depends on the masked pixel area, mask complexity, filter chains, animation frequency, overlap, device pixel ratio, and browser engine. A small masked icon is rarely a concern. A full-viewport image with a large blurred mask animating continuously can be costly on mobile, particularly when several layers overlap. Avoid unnecessary animated noise, oversized filter bounds, and large numbers of independently animated masked elements.

Measure rather than guessing. Use browser performance tooling to record scrolling and interaction, inspect paint flashing and layer boundaries, and test on a mid-range mobile device. A smooth desktop preview does not prove that a masked hero is affordable on a phone. `will-change` is not a universal fix; it can consume memory and should be used only when profiling demonstrates a benefit. If the effect is static, consider pre-rendering an asset when doing so preserves quality, responsiveness, and maintainability.

```css
/* Keep the static state cheap; enable motion only when needed. */
.hero-mask-art {
  opacity: 1;
  animation: none;
}

.hero-mask-art[data-animate="true"] {
  animation: reveal-drift 8s ease-in-out infinite alternate;
}

@keyframes reveal-drift {
  from { transform: translateX(-1.5%); }
  to   { transform: translateX(1.5%); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-mask-art[data-animate="true"] {
    animation: none;
  }
}
```

This pattern keeps the static presentation as the default. Only opt into the animation when it is appropriate, and remove the animation when the component is not relevant or the user has requested reduced motion.

### 15. Progressive Enhancement and Fallback Design

Masking should improve a usable interface, not be a prerequisite for it. The fallback depends on the content. For a decorative hero image, a normal rectangular crop may be acceptable. For a product image, the product should remain visible even if the mask fails. For an illustration that carries essential meaning, provide equivalent semantic text or a fallback asset. Avoid setting the only image to `opacity: 0` until a mask is supported or a JavaScript check has succeeded.

Feature detection is useful only when it changes the implementation safely. CSS `@supports` can test selected CSS mask declarations, but support for one declaration does not guarantee every SVG mask behavior is identical. Test the exact effect in target browsers. If the fallback is more than a simple visual degradation, use an explicit component state or a pre-rendered alternative rather than relying on a broad feature test.

```css
.artwork {
  border-radius: 1rem;
  overflow: hidden;
}

@supports (mask-image: linear-gradient(#000, transparent)) or
          (-webkit-mask-image: linear-gradient(#000, transparent)) {
  .artwork--feathered {
    -webkit-mask-image: linear-gradient(to bottom, #000 75%, transparent 100%);
    mask-image: linear-gradient(to bottom, #000 75%, transparent 100%);
  }
}
```

The unmasked version remains readable and useful. Do not use `@supports` as a substitute for visual regression testing, particularly for complex SVG filters and masks.

## Six Named Production Patterns

### Pattern 1 — Gradient Edge Fade

**What it does:** Gradually hides one edge of an image so it blends into a neighboring region without a visible rectangular boundary.

**When to use it:** Editorial hero images, split layouts, background photography, and image-to-color transitions where the receiving background is known or the mask fades to transparency.

**Implementation:** A CSS gradient mask is often the simplest route for a standard HTML image. Use SVG when the target and mask are already part of one illustration. Check the crop at each breakpoint and avoid fading to a hard-coded background color when themes or content can change.

```css
.edge-fade {
  -webkit-mask-image: linear-gradient(90deg, #000 0 68%, transparent 100%);
  mask-image: linear-gradient(90deg, #000 0 68%, transparent 100%);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}
```

### Pattern 2 — Soft Spotlight Reveal

**What it does:** Reveals a circular or oval area while keeping the surrounding image partially or fully concealed.

**When to use it:** Art-directed portraits, visual storytelling, product callouts, and spotlight effects where a feathered boundary is meaningful.

**Implementation:** Use a radial gradient or blurred shape in the mask. Keep the reveal center configurable if it must follow a subject. Avoid animating a large blur at high frequency without profiling.

```html
<svg viewBox="0 0 600 360" aria-hidden="true">
  <defs>
    <radialGradient id="spotlight-gradient">
      <stop offset="0" stop-color="white" />
      <stop offset="0.62" stop-color="white" />
      <stop offset="1" stop-color="black" />
    </radialGradient>
    <mask id="spotlight-mask" mask-type="luminance">
      <rect width="600" height="360" fill="url(#spotlight-gradient)" />
    </mask>
  </defs>
  <image href="detail.jpg" width="600" height="360"
         preserveAspectRatio="xMidYMid slice" mask="url(#spotlight-mask)" />
</svg>
```

### Pattern 3 — Shape-Driven Editorial Crop

**What it does:** Reveals an image through a bespoke organic silhouette that supports the brand's visual language.

**When to use it:** Portfolio project cards, campaign pages, editorial landing pages, and illustration-led sections where the shape is a deliberate design asset.

**Implementation:** Reuse one carefully constructed path when a hard edge is sufficient; use a mask only if transparency or feathering is needed. Normalize the shape where practical, and give each instance a unique mask ID.

```html
<svg viewBox="0 0 520 340" role="img" aria-label="Abstract sculpture in an organic crop">
  <defs>
    <mask id="sculpture-mask" mask-type="luminance">
      <rect width="520" height="340" fill="black" />
      <path d="M30 170 C20 70 140 15 245 65 C340 0 485 65 490 170 C500 280 365 330 260 275 C145 340 35 270 30 170Z" fill="white" />
    </mask>
  </defs>
  <image href="sculpture.jpg" width="520" height="340"
         preserveAspectRatio="xMidYMid slice" mask="url(#sculpture-mask)" />
</svg>
```

### Pattern 4 — Text as a Mask Window

**What it does:** Uses letterforms as the reveal region so imagery appears inside large display text.

**When to use it:** Decorative hero typography, campaign headers, and poster-like art direction. It is not appropriate when the masked visual is the only accessible rendering of the text.

**Implementation:** Keep the actual text as real DOM text for semantics and responsive wrapping. Use an SVG text mask only for the visual layer, or use a duplicate decorative SVG marked `aria-hidden="true"`. Match the font and text metrics carefully; fallback fonts can alter the mask geometry.

```html
<svg viewBox="0 0 1000 260" aria-hidden="true">
  <defs>
    <mask id="type-window" mask-type="luminance">
      <rect width="1000" height="260" fill="black" />
      <text x="24" y="190" font-size="170" font-weight="800"
            font-family="Arial, sans-serif" fill="white">FORM / FIELD</text>
    </mask>
  </defs>
  <image href="texture.jpg" width="1000" height="260"
         preserveAspectRatio="xMidYMid slice" mask="url(#type-window)" />
</svg>
```

### Pattern 5 — Animated Wipe Reveal

**What it does:** Reveals an image or section from one side to another during a transition.

**When to use it:** Page transitions, gallery changes, and scroll-triggered decorative entrances where the content remains available without motion.

**Implementation:** Prefer animating a simple mask rectangle or an isolated reveal layer rather than morphing a complex path on every frame. Provide a stable visible state, stop offscreen motion, and disable transitions for reduced-motion preferences.

```css
.wipe-layer {
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 700ms cubic-bezier(.22, .8, .22, 1);
}

.wipe-layer.is-active {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: reduce) {
  .wipe-layer { transition: none; transform: none; }
}
```

### Pattern 6 — Multi-Layer Depth Mask

**What it does:** Combines two or more mask regions to create a layered reveal, such as a foreground silhouette over a background fade.

**When to use it:** Illustration-rich hero compositions and campaign artwork where one simple mask cannot express the intended depth relationship.

**Implementation:** Separate layers by purpose, keep IDs explicit, and profile the combined result. Use a small number of masks rather than building a large chain of overlapping filtered masks. If the result can be precomposed into a static asset without losing responsive behavior, compare that option.

```html
<svg viewBox="0 0 720 420" aria-hidden="true">
  <defs>
    <linearGradient id="back-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="white" />
      <stop offset="1" stop-color="black" />
    </linearGradient>
    <mask id="background-mask" mask-type="luminance">
      <rect width="720" height="420" fill="url(#back-fade)" />
    </mask>
    <mask id="foreground-mask" mask-type="luminance">
      <rect width="720" height="420" fill="black" />
      <path d="M0 300 Q180 210 350 310 T720 280 V420 H0Z" fill="white" />
    </mask>
  </defs>
  <image href="sky.jpg" width="720" height="420" mask="url(#background-mask)" />
  <image href="foreground.jpg" width="720" height="420"
         preserveAspectRatio="xMidYMid slice" mask="url(#foreground-mask)" />
</svg>
```

## Common Mistakes and Unique Fixes

| Mistake | Why it happens | Fix |
|---|---|---|
| A luminance mask renders fully hidden | The mask's visible shapes are black or too dark | Render the mask source alone and set intended reveal regions to white or lighter gray |
| An alpha mask reveals opaque black | Alpha, not color brightness, controls visibility | Make concealed areas transparent and set the mask type explicitly |
| Blur has a hard cutoff | The filter region clips the blur halo | Expand the filter bounds modestly and verify the mask region separately |
| Mask disappears on a page with many cards | Duplicate IDs resolve to the wrong definition | Generate stable unique IDs per component instance and test repeated rendering |
| Reveal is offset after scaling | Mask and target use different coordinate assumptions | Choose `userSpaceOnUse` or `objectBoundingBox` deliberately and simplify transforms |
| Feathering creates a seam at one edge | Mask region is too tight for the transition | Extend the mask region to include the full gradient or blurred boundary |
| Image subject is hidden on mobile | Image crop changes but reveal focus does not | Coordinate `object-position` and mask geometry at responsive breakpoints |
| CSS mask works in one browser only | CSS and SVG mask support differs by engine | Test the exact target matrix and ship a readable unmasked fallback |
| Gradient fade shows a colored stripe | Mask fades to a guessed background color | Fade to transparency or use a background that is guaranteed to match |
| Animation leaves content invisible | The initial hidden state depends on script success | Make visible content the default and opt into the reveal after initialization |
| Focus ring is clipped | Wrapper overflow or shape clips the outline | Draw focus on an outer wrapper or provide an unclipped focus indicator |
| Masked button is hard to click | Visual visibility is mistaken for hit-test geometry | Define a clear interaction box and use a clip path or DOM layout for hit targets |
| Performance drops during scrolling | Large masked surfaces repaint or rasterize repeatedly | Reduce affected pixel area, simplify effects, and profile on a mobile device |
| Filter output is clipped unexpectedly | Filter and mask regions have different bounds | Inspect both regions and expand only the one causing the cutoff |
| Mask geometry looks distorted | Normalized values are mixed with user-space units | Document the coordinate contract and use one coordinate system where practical |
| High-DPI edges look soft | Raster content or large blur is scaled beyond its source resolution | Use vector geometry where possible and compare at actual device-pixel ratios |

## Mental Models

1. **A mask is a visibility field.** It controls contribution to the final pixel; it does not automatically redefine layout or interaction geometry.
2. **Alpha and luminance are separate contracts.** Opaque black can be visible under alpha semantics and hidden under luminance semantics.
3. **The region and the content have different coordinate choices.** `maskUnits` and `maskContentUnits` solve separate problems.
4. **A mask is a reference graph.** The element, its `url(#id)`, the definition, its child shapes, gradients, and filters must all resolve correctly.
5. **The target's crop is part of the visual equation.** A mask cannot be judged independently of `object-fit`, `preserveAspectRatio`, and focal position.
6. **A soft edge has a cost.** Blur, transparency, and large composited surfaces may require more raster work than a hard clip.
7. **The fallback is part of the design.** The experience must remain comprehensible if the mask or animation is unavailable.
8. **Visual invisibility is not semantic invisibility.** Hidden pixels can still correspond to accessible content or interactive geometry.
9. **The simplest primitive usually wins.** Use a clip path for a hard edge, a gradient for a simple fade, and a complex mask only when the design requires it.
10. **Measure the real composition.** A mask's cost and behavior depend on the full scene, not just the SVG definition in isolation.

## Debugging Playbook

1. **Confirm the reference.** Inspect the target's `mask` attribute or CSS `mask-image`. Confirm the fragment ID exists exactly once and the URL points to the intended definition.
2. **Render the mask source directly.** Temporarily remove the mask reference and show its shapes over a neutral background. This separates path geometry from compositing semantics.
3. **Check alpha versus luminance.** Explicitly test a white shape, a black shape, and a partially transparent shape. Confirm which channel controls the effect.
4. **Outline the target.** Add a temporary stroke or a visible rectangle so you know the target's actual bounds.
5. **Remove transforms.** Temporarily remove group and target transforms. Restore them one by one after alignment is understood.
6. **Inspect the mask region.** Temporarily color the mask background and expand its bounds enough to see whether the content is clipped.
7. **Inspect filters separately.** Disable blur and other filter primitives, then re-enable them individually. Check filter region bounds as well as mask bounds.
8. **Test multiple instances.** Render several copies on one page and inspect generated IDs. Include a conditional component mount if using a framework.
9. **Test responsive crops.** Check small, medium, and large viewports, plus an intermediate width. Confirm the subject focal point remains visible.
10. **Test browser engines.** Use the actual supported Chromium, Firefox, and Safari versions. Do not treat one desktop browser as a universal proxy.
11. **Test accessibility.** Tab through links and controls, inspect focus indicators, and check the accessibility tree for duplicate or missing names.
12. **Profile the scene.** Record scrolling and animation with browser performance tools; use paint flashing where available to locate repainting.

### Browser and Compatibility Strategy

SVG masks are broadly supported in modern browsers, but exact details can differ for CSS masking, prefixed CSS properties, reference resolution, nested SVG, filter interactions, and rendering edge cases. Treat the target browser matrix as a project requirement. For a creative portfolio, test current Safari on macOS and iOS as well as Chromium and Firefox. If older embedded webviews or enterprise browsers are in scope, validate those explicitly instead of assuming support from desktop results.

Use CSS `@supports` for CSS-level enhancement when appropriate, but do not interpret a passing feature query as proof that a complex effect is identical across engines. Keep a useful baseline rendering. A hard crop, border radius, or unmasked image is often a perfectly acceptable fallback for decorative treatment. If the exact shape is essential to product comprehension, provide an alternate asset or semantic description.

### Accessibility Checklist

- The masked visual has an appropriate text alternative if it conveys meaningful information.
- Decorative SVGs are hidden from the accessibility tree and contain no focusable descendants.
- Real text is not available only as pixels inside a masked image.
- Focus indicators remain visible around interactive cards and controls.
- Pointer hit areas are intentional and do not rely on transparent pixels behaving as removed geometry.
- Reduced-motion preferences disable or simplify decorative mask animation.
- Contrast and legibility remain acceptable in forced-colors or high-contrast contexts.
- Content remains available if the mask is unsupported or the script that starts an animation fails.
- The mask does not conceal a validation error, warning, or required action.
- Screen-reader output is checked for duplicate labels when semantic HTML and decorative SVG are combined.

### Performance Checklist

- Use clip paths instead of masks when only a hard geometric boundary is required.
- Prefer gradients over blur when they can create the desired feathering.
- Keep filter and mask bounds close to the actual effect, with enough room to avoid clipping.
- Avoid animating a full-screen blurred mask continuously without profiling.
- Reduce the number of overlapping masked surfaces in the same viewport.
- Stop or pause nonessential animation when content is offscreen.
- Compare the result on a mid-range mobile device and at a high device-pixel ratio.
- Use `will-change` only after measurement demonstrates a benefit.
- Consider a static pre-rendered asset for a complex nonresponsive effect.
- Keep SVG definitions compact and avoid repeating large path data unnecessarily.

## Quick Reference

| Need | Recommended approach | Key check |
|---|---|---|
| Hard silhouette | `<clipPath>` | Confirm edge should be binary |
| Soft transparency edge | SVG or CSS mask | Choose alpha or luminance intentionally |
| Simple horizontal fade | CSS linear-gradient mask | Fade to transparency if background varies |
| Circular spotlight | Radial gradient mask | Keep focal point aligned with crop |
| Feathered organic edge | Mask with blur | Check filter and mask bounds |
| Repeated card component | Unique mask ID per instance | Render several instances simultaneously |
| Mask follows target proportions | `objectBoundingBox` coordinates | Test non-square aspect ratios |
| Mask aligns to illustration grid | `userSpaceOnUse` | Verify transforms and viewBox mapping |
| Animated reveal | Simple transform or small geometry change | Respect reduced motion and profile repaint cost |
| Text image treatment | SVG text mask plus real DOM text | Preserve semantic text and fallback fonts |
| Safari CSS mask issue | Targeted CSS fallback and testing | Verify exact browser versions and prefixes |
| Hidden area remains clickable | Explicit hit-target design | Do not equate transparency with removed geometry |
| Blur halo clipped | Expand the correct bounds | Inspect filter region and mask region independently |
| Theme-aware fade | Fade to transparency | Avoid hard-coded surface colors |
| Decorative mask fails | Baseline image or shape | Keep core content visible without the effect |

## Build Challenge — Responsive Masked Case-Study Card

Build a responsive case-study card for a creative portfolio. The image uses an organic mask and a subtle reveal transition, but the card must remain understandable and interactive without the mask. Include a real heading and link, meaningful image alternative text when the image conveys unique information, and a reduced-motion state. The challenge is not complete when the screenshot looks attractive: it must survive realistic failure cases.

### Requirements

1. Create an SVG image region with a `viewBox` that scales cleanly from narrow mobile width to desktop width.
2. Use a custom organic path for the visible shape; choose a clip path or mask based on whether the edge needs partial transparency.
3. Declare the mask type explicitly where applicable and explain why alpha or luminance is correct for the chosen effect.
4. Choose `maskUnits` and `maskContentUnits` intentionally and document the coordinate system in a short code comment.
5. Generate a unique mask ID for each card instance and render at least three cards on the same page.
6. Add a gradient fade or subtle feather without clipping the edge at the maximum card size.
7. Ensure the image crop keeps the subject visible at 360px, 768px, 1024px, and 1440px viewport widths.
8. Add a reveal interaction that does not make the card's title or link unavailable before animation completes.
9. Respect `prefers-reduced-motion: reduce` and provide a fully visible, nonanimated state.
10. Make keyboard focus visible even when the media wrapper clips its contents.
11. Include a useful fallback if CSS masking or the SVG mask fails in a target browser.
12. Test the card in Chromium, Firefox, and Safari or document which engines are unavailable for testing.
13. Use browser performance tooling to record the reveal and scroll interaction, then reduce unnecessary paint work if a bottleneck appears.
14. Simulate a broken mask reference by changing the ID, identify the failure, and restore the correct reference.
15. Simulate an overly small filter region or mask region, capture the clipped edge, and fix the bounds without making them arbitrarily huge.
16. Verify the accessibility tree, image alternative text, link name, keyboard navigation, and focus indicator.
17. Record screenshots at desktop and mobile sizes, including the reduced-motion state.
18. Add a short README note describing the chosen mask primitive, browser assumptions, fallback behavior, and performance trade-offs.

### Definition of Done

- All three card instances use their own correct mask reference and no duplicate IDs exist.
- The subject remains visible at every required viewport width without awkward cropping.
- The mask edge is intentional and does not reveal an unintended rectangular cutoff.
- The card title and link are usable without waiting for the reveal animation.
- Reduced-motion mode presents the content immediately without decorative movement.
- Keyboard focus is clearly visible and is not clipped by the media wrapper.
- The page remains readable when the mask enhancement is disabled.
- The broken-reference test was reproduced, diagnosed, and fixed.
- The clipped-region test was reproduced and fixed with reasonable bounds.
- Browser testing and known compatibility limitations are documented honestly.
- Performance was inspected during both scroll and reveal interaction.
- The README explains why the chosen mask is preferable to a simpler clip path or gradient.

## Final Engineering Rules

Treat masks as a compositing feature with explicit semantics, not as mysterious SVG decoration. Start with the simplest primitive that satisfies the art direction. Keep IDs unique, coordinate systems documented, filter bounds controlled, and the default state visible. Test the rendered crop and the interaction area together. Verify the effect in the browsers that matter to the project, and do not claim compatibility based on one successful screenshot. Finally, preserve meaning and usability when the effect is reduced, unavailable, or expensive. That is the standard for production-ready SVG masking.
