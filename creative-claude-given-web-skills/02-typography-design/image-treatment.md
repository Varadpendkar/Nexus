# Image Treatment — Production Skill Guide

## Why This Matters

Images often occupy more visual space than any other element in a product interface. Their crop, ratio, focal point, color treatment, loading behavior, and relationship to surrounding text can change the meaning of a page. A technically valid image can still fail if the subject is cropped away, the crop changes unpredictably between breakpoints, a portrait becomes distorted, or a background image carries information that assistive technology cannot access.

This skill establishes a dependable image-treatment system for websites and application interfaces. It covers image selection, crop strategy, responsive sizing, `object-fit`, `object-position`, aspect ratios, overlays, filters, art direction, accessibility, performance, lazy loading, responsive image sources, and debugging. Examples use semantic HTML and CSS, with JavaScript only where it adds a concrete benefit. The goal is not to decorate every image with effects; it is to preserve meaning and visual consistency across real content and screen sizes.

## Outcomes

After working through this guide, you should be able to:

- Choose between inline content images, CSS background images, and decorative image layers.
- Control crop behavior without distorting the source.
- Define responsive image ratios and focal points for different layouts.
- Apply overlays, filters, and color treatments without damaging readability.
- Write useful `alt` text and avoid redundant or misleading descriptions.
- Use `srcset`, `sizes`, modern formats, lazy loading, and explicit dimensions appropriately.
- Diagnose broken images, unexpected crops, layout shifts, and blurry output with DevTools.
- Establish an image system with documented tokens, patterns, and acceptance criteria.

## 1. Classify the image by purpose

Before styling an image, determine why it exists. A content image conveys information, a functional image may act as a control, and a decorative image adds atmosphere without adding meaning. The correct HTML and accessibility treatment depend on that purpose. Do not start by choosing a filter or border radius; start by asking what the user needs to understand.

Use `<img>` for meaningful content and use CSS backgrounds for purely decorative imagery that does not need alternative text. If the image is a link or part of a control, the surrounding interactive element needs an accessible name. If the image is the only content of a link, its alternative text should describe the destination or action, not merely the pixels.

```html
<figure class="article-figure">
  <img src="/images/solar-panels.jpg"
       alt="Solar panels arranged across a rooftop"
       width="1200" height="800">
  <figcaption>Rooftop solar installation at midday.</figcaption>
</figure>
```

## 2. Choose `object-fit` from the content constraint

`object-fit` controls how a replaced element such as `<img>` fits its content into the element's box. `cover` fills the box and crops overflow; `contain` preserves the full image and may leave empty space; `fill` can distort the source; `none` preserves intrinsic sizing; and `scale-down` chooses between `none` and `contain`. For most editorial cards and avatars, `cover` is appropriate. For diagrams, product specifications, and images where every edge matters, `contain` is usually safer.

Do not apply `cover` automatically to every image. A portrait can lose a face, a chart can lose axis labels, and a product image can crop away the feature being compared. Select fit behavior based on the information that must remain visible.

```css
.card-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.diagram-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

## 3. Use `object-position` to preserve the focal point

When `cover` crops an image, `object-position` determines which part remains visible. The default center position is not always appropriate. A face near the top, a product placed to the left, or a landscape with a distinctive skyline may need a different focal point.

Use per-image focal-point metadata when a reusable component displays varied content. Avoid global rules such as `object-position: top` for all portraits unless the content is genuinely consistent. The crop should respond to the image, not force every image to pretend it has the same composition.

```css
.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 35%;
}

.media--product img {
  object-position: 50% 50%;
}
```

## 4. Define aspect ratios explicitly

An aspect ratio controls the shape of the image container. Stable ratios make card grids, galleries, and editorial layouts feel intentional and reduce layout shift when paired with known image dimensions. Common ratios include 1:1 for avatars, 4:3 for general content, 3:2 for photography, and 16:9 for video previews, but content should determine the choice.

Use the CSS `aspect-ratio` property where a fixed ratio is useful. Do not force a ratio onto every image if the content needs its natural height. For images with variable intrinsic dimensions, ensure the container behavior is documented and test the result with long and short subjects.

```css
.media-frame {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--image-radius, 0.75rem);
}

.media-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

## 5. Separate the image frame from the image asset

A reliable component separates frame geometry from the image itself. The frame defines the ratio, radius, overflow, and placement. The image defines the source, intrinsic dimensions, and crop. This separation makes it easier to swap assets and to support different frame shapes without duplicating the source file.

Use `overflow: hidden` when a frame intentionally clips its image to a rounded rectangle or other shape. Remember that overflow can also clip focus outlines, badges, and overlays if they are placed inside the same element. Keep interactive controls outside the clipped media frame or give them a separate layer with appropriate space.

```html
<article class="story-card">
  <div class="story-card__media">
    <img src="/images/forest-trail.webp"
         alt="A narrow trail winding through a green forest"
         width="1200" height="900">
  </div>
  <div class="story-card__body">
    <h2>Walking the forest trail</h2>
    <p>A short guide to a quiet route.</p>
  </div>
</article>
```

## 6. Use responsive sources instead of scaling one giant file

CSS resizing changes the displayed dimensions, but it does not automatically reduce the downloaded file. `srcset` and `sizes` let the browser choose an appropriate source for the viewport and device pixel ratio. This can reduce transfer size while preserving sharpness. Use width descriptors when source files have different intrinsic widths, and ensure `sizes` describes the actual layout width.

Do not put several URLs in `srcset` without understanding the descriptors. Do not assume that the browser will always choose the smallest file; it balances viewport size, pixel density, and other browser heuristics. Test network requests on representative devices and viewport widths.

```html
<img
  src="/images/city-800.webp"
  srcset="/images/city-400.webp 400w,
          /images/city-800.webp 800w,
          /images/city-1400.webp 1400w"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px"
  width="1400" height="933"
  alt="Buildings lining a busy city street">
```

## 7. Choose formats based on the image and pipeline

Modern formats such as WebP and AVIF can reduce file size for photographic images, while JPEG remains broadly supported and PNG can be useful for lossless transparency or pixel-sensitive assets. SVG is suitable for vector artwork and logos when the source is trusted and responsive vector behavior is desired. The correct format depends on browser support, visual quality, encoding settings, transparency, and delivery infrastructure.

Do not convert everything to one format without checking the result. Inspect artifacts around text, hair, edges, and gradients. A smaller file that visibly damages a product detail is not a successful optimization. Keep original masters and make generated variants reproducible.

```html
<picture>
  <source type="image/avif" srcset="/images/mountain.avif">
  <source type="image/webp" srcset="/images/mountain.webp">
  <img src="/images/mountain.jpg"
       width="1200" height="800"
       alt="A mountain ridge above a layer of clouds">
</picture>
```

## 8. Write alternative text based on context

Alternative text should communicate the relevant information, not mechanically describe every visible detail. The same image may need different `alt` text depending on the surrounding content. If the adjacent caption already fully conveys the relevant point, the image may be decorative in that context. If the image is a chart, the alternative text should summarize the key message and the page should provide detailed data or a text equivalent.

Avoid phrases such as “image of” unless the fact that it is an image matters. Avoid keyword stuffing, file names, and vague values such as “photo.” Use `alt=""` for decorative images so assistive technology can skip them. Do not omit the `alt` attribute on ordinary content images; omission can cause some screen readers to announce a filename.

```html
<img src="/images/team-workshop.jpg"
     alt="Three designers reviewing wireframes on a wall"
     width="1000" height="667">

<img src="/images/soft-paper-texture.webp" alt="" aria-hidden="true">
```

## 9. Decide between `<img>` and CSS background

Use `<img>` when the image is content, should have alternative text, or benefits from responsive source selection and intrinsic dimensions. Use a CSS background when the image is purely decorative and needs to sit behind text or other elements. A background image does not have an `alt` attribute, so meaningful content should not be hidden in it.

Background images can be useful for hero art direction and layered effects, but they can also be harder to inspect in accessibility tools and less straightforward to optimize per device. If a background carries essential information, move it into semantic content or provide an equivalent explanation.

```css
.hero {
  background-image:
    linear-gradient(90deg, rgb(0 0 0 / 68%), rgb(0 0 0 / 0%)),
    url("/images/hero-landscape.webp");
  background-size: cover;
  background-position: center;
}
```

## 10. Add overlays for contrast, not as a substitute for good imagery

An overlay can improve text contrast over an image, but it should be designed around the actual content and crop. A gradient that is strong on the left may help a left-aligned title but fail when the title wraps on a narrow screen. Test contrast at the brightest and busiest parts of the image, not just in a screenshot where the text happens to be legible.

Use a separate pseudo-element or overlay layer so the text remains unaffected. Avoid applying opacity to the entire parent because it fades the title and controls along with the background. If the image is too busy, choose a better crop or move the text into a solid surface rather than stacking increasingly heavy effects.

```css
.hero {
  position: relative;
  isolation: isolate;
  color: white;
  background: #1b1b1b url("/images/hero.webp") center / cover no-repeat;
}

.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(90deg, rgb(0 0 0 / 72%), rgb(0 0 0 / 12%));
}
```

## 11. Use filters sparingly and predictably

CSS filters such as `grayscale()`, `saturate()`, `contrast()`, and `brightness()` can create a coherent image treatment, but they alter visual meaning and may reduce clarity. A grayscale treatment may be appropriate for a historical archive or disabled state; it is usually a poor way to communicate availability by itself. A filter can also affect image details differently across sources.

Prefer generating a consistent set of optimized image variants when the same treatment is used everywhere. Use CSS filters for reversible, interface-level effects such as a hover state. Keep a visible focus state and do not make essential distinctions depend solely on saturation or brightness.

```css
.gallery-image {
  filter: saturate(0.92) contrast(1.02);
  transition: filter 180ms ease;
}

.gallery-link:hover .gallery-image {
  filter: saturate(1.08) contrast(1.02);
}

@media (prefers-reduced-motion: reduce) {
  .gallery-image { transition: none; }
}
```

## 12. Use hover treatments without hiding content

Hover treatments can signal that an image card is interactive, but the card must remain understandable without hover. Touch devices do not have a reliable hover state, and keyboard users need a visible focus state. If a title or action only appears when a pointer hovers, make sure it is also available on focus and on touch layouts.

Use hover and focus styles together. Do not make the only indication of interactivity a subtle zoom or a color shift. Avoid excessive scaling that crops the subject or causes adjacent content to move.

```css
.gallery-link:hover .gallery-image,
.gallery-link:focus-visible .gallery-image {
  transform: scale(1.03);
}

.gallery-link:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .gallery-image { transition: none; transform: none; }
}
```

## 13. Art-direct responsive crops with `<picture>`

Responsive image selection is not always just a smaller version of the same image. Art direction can use different compositions for mobile and desktop, especially when the focal subject would otherwise be lost in a narrow crop. Use `<picture>` with media conditions when the best image changes, not merely its resolution.

Keep the meaning consistent across sources. If the desktop version includes an important person or product that is absent from the mobile version, the alternative text and surrounding context must still be truthful. Validate all source combinations; a broken mobile-specific source can be invisible during desktop testing.

```html
<picture>
  <source media="(max-width: 600px)" srcset="/images/portrait-mobile.webp">
  <source media="(min-width: 601px)" srcset="/images/portrait-wide.webp">
  <img src="/images/portrait-wide.webp"
       width="1600" height="900"
       alt="A chef plating a meal in a restaurant kitchen">
</picture>
```

## 14. Reserve dimensions to prevent layout shift

Images that load without known dimensions can push text and controls down after the page has rendered. Provide `width` and `height` attributes for intrinsic dimensions or reserve a container using `aspect-ratio`. This lets the browser calculate space before the image bytes arrive.

Do not confuse the image's source dimensions with its CSS display size. The attributes establish the intrinsic ratio; CSS can still make the image responsive. For lazy-loaded images below the fold, dimension stability is especially important because loading may occur after the user has begun scrolling.

```css
.article-image {
  width: 100%;
  height: auto;
  display: block;
}

.product-frame {
  aspect-ratio: 1 / 1;
  background: var(--surface-muted);
}
```

## 15. Load images according to their importance

Use lazy loading for images that are likely below the initial viewport. Do not lazy-load every image by default: the main hero or likely Largest Contentful Paint image may need to start loading immediately. `loading="lazy"` is a browser hint, not a promise of a specific load time. Use `fetchpriority="high"` sparingly for a genuinely critical image, and validate the effect in performance tools.

Avoid loading several large hero variants before the browser chooses one. Responsive sources should let the browser select the appropriate resource. Test the real network waterfall and page metrics rather than adding priority hints to every image.

```html
<img src="/images/hero-wide.webp"
     width="1600" height="900"
     alt="Aerial view of a coastal city"
     fetchpriority="high">

<img src="/images/related-story.webp"
     width="800" height="533"
     alt="A small boat near a rocky shore"
     loading="lazy">
```

## 16. Build a consistent radius and edge treatment

Image corner radii should align with the component system. A card, avatar, thumbnail, and full-bleed hero may use different radius tokens because they serve different visual roles. Do not randomly assign rounded corners to every image; a radius should communicate component structure, not act as a universal decoration.

Use the frame to clip the image when the radius belongs to the whole media region. If badges or controls extend beyond the image, keep them in a sibling layer or account for the clipping explicitly. Test image edges against the surrounding surface in light and dark themes.

```css
:root {
  --image-radius-sm: 0.375rem;
  --image-radius-md: 0.75rem;
  --image-radius-lg: 1.25rem;
}

.media-frame--card { border-radius: var(--image-radius-md); overflow: hidden; }
.media-frame--avatar { border-radius: 50%; overflow: hidden; }
.media-frame--hero { border-radius: 0; }
```

## 17. Make image backgrounds and empty states intentional

A background color behind an image helps when transparent assets load or when the image contains empty areas under `contain`. Use a neutral surface that suits the image family, and avoid a flash of unrelated color while the asset loads. Empty states should not rely on a random stock image that adds visual noise but no useful explanation.

If an image is transparent, inspect it on both light and dark surfaces. A white product render may disappear on a white background; a dark logo may vanish on a dark surface. The frame treatment should be tested with the actual asset, not only with a placeholder.

```css
.product-image-frame {
  display: grid;
  place-items: center;
  background: var(--surface-subtle);
  aspect-ratio: 1 / 1;
}

.product-image-frame img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
```

## 18. Treat image effects as design tokens

Define reusable tokens for ratio, radius, overlay strength, and transition duration. Avoid page-specific filter values spreading through stylesheets without a common rationale. Tokens make it easier to tune the visual language and maintain contrast across the product.

Keep tokens semantic where possible. `--image-radius-card` is easier to understand than `--radius-12` when the token belongs specifically to media components. Do not create a token for every one-off exception; keep the system small and document when a custom value is justified.

```css
:root {
  --image-ratio-card: 4 / 3;
  --image-radius-card: 0.75rem;
  --image-overlay-strong: rgb(0 0 0 / 64%);
  --image-transition-fast: 160ms;
}
```

## 19. Debug broken crops and image loading

When an image appears wrong, inspect both the element and its container. Check the source URL, natural dimensions, rendered dimensions, `object-fit`, `object-position`, aspect ratio, overflow, and whether a `<picture>` source is selected. A wrong crop may come from a container height inherited from a grid, not from the image rule itself.

Use DevTools Network to check status codes and response type. In the Console, look for CORS, CSP, mixed-content, and decoding errors. Use the Elements panel to toggle CSS properties one at a time. The `naturalWidth` and `naturalHeight` properties help distinguish a missing or not-yet-decoded asset from a layout problem.

```js
function inspectImage(img) {
  const style = getComputedStyle(img);
  console.table({
    src: img.currentSrc || img.src,
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    renderedWidth: style.width,
    renderedHeight: style.height,
    objectFit: style.objectFit,
    objectPosition: style.objectPosition,
    aspectRatio: style.aspectRatio
  });
}
```

## 20. Handle image failure with a designed fallback

A broken image should not leave an empty rectangle that looks like a layout bug. Decide whether the fallback is a neutral placeholder, a branded illustration, a visible error label, or a retry action. For informative images, a fallback should preserve the surrounding explanation. For avatars, initials may be acceptable if the user's identity is already represented in accessible text.

Do not replace every failure with a generic image that misrepresents the content. A fallback must not imply a product exists, a person is present, or a status is successful when the source failed. Keep dimensions stable so fallback behavior does not cause layout shift.

```html
<div class="avatar-frame">
  <img src="/people/42.webp" alt="" width="96" height="96">
  <span class="avatar-fallback" aria-hidden="true">AR</span>
</div>
```

## 21. Test image treatments with real content

Use a representative content matrix: close-up portrait, landscape, transparent product render, chart or diagram, very wide hero, small thumbnail, and image with a subject near the edge. A single stock photo cannot validate a reusable component. Test the hardest images because they reveal crop assumptions quickly.

Check at mobile, tablet, and desktop widths; at 200% zoom; with slow network; and with image loading blocked. Confirm that the layout remains useful if an image fails. Include high-contrast and reduced-motion checks when overlays or transitions are part of the treatment.

```js
const imageCases = [
  { kind: "portrait", focalPoint: "top-center", fit: "cover" },
  { kind: "diagram", focalPoint: "center", fit: "contain" },
  { kind: "transparent-product", focalPoint: "center", fit: "contain" },
  { kind: "wide-hero", focalPoint: "left-center", fit: "cover" }
];
console.table(imageCases);
```

## 22. Define the system's completion criteria

A mature image treatment system is complete when its defaults are documented, the crop behavior is predictable, and accessibility and performance requirements are part of the component contract. It is not complete merely because a few screenshots look polished. The component should handle varied source dimensions, slow loading, responsive layouts, and keyboard navigation without surprising users.

Use checkable criteria during code review. When a behavior is not defined, record it as a system gap. When a documented behavior fails in the browser, record it as an implementation defect and capture a reproducible example.

```js
const imageSystemChecks = {
  altTextReviewed: true,
  dimensionsReserved: true,
  focalPointDocumented: true,
  responsiveSourcesTested: true,
  reducedMotionHandled: true,
  keyboardFocusVisible: true,
  loadingFallbackDesigned: true
};
console.table(Object.entries(imageSystemChecks).map(([check, pass]) => ({ check, pass })));
```


## Named Implementation Patterns

### Pattern 1 — Responsive content image

What it does: Lets the browser select a suitable source for the layout and device pixel density.

When to use it: Use for editorial images and cards that are meaningful content and need sharp output at multiple widths.

```html
<img
  src="/images/field-800.webp"
  srcset="/images/field-400.webp 400w, /images/field-800.webp 800w, /images/field-1200.webp 1200w"
  sizes="(max-width: 640px) 100vw, 50vw"
  width="1200" height="800"
  alt="A field of flowers beside a wooden fence">
```

### Pattern 2 — Stable cover crop

What it does: Fills a fixed-ratio frame without stretching the source.

When to use it: Use for cards, gallery tiles, and thumbnails where a consistent grid matters more than showing every edge.

```html
<div class="media-frame">
  <img src="/images/cabin.webp" alt="A cabin beside a lake" width="1200" height="800">
</div>
<style>
.media-frame { aspect-ratio: 4 / 3; overflow: hidden; }
.media-frame img { width: 100%; height: 100%; object-fit: cover; }
</style>
```

### Pattern 3 — Focal point per asset

What it does: Keeps the important subject visible as the container changes shape.

When to use it: Use when a content-management system stores a focal point or when a curated hero crop must preserve a face or product.

```html
<img class="hero-subject" src="/images/portrait.webp" alt="Portrait of a musician">
<style>
.hero-subject { width: 100%; height: 100%; object-fit: cover; object-position: 50% 28%; }
</style>
```

### Pattern 4 — Content-safe overlay

What it does: Adds contrast behind text while keeping text opacity unaffected.

When to use it: Use for image-backed hero titles after checking contrast across responsive crops.

```html
<section class="hero">
  <div class="hero__content">
    <h1>Explore the coast</h1>
    <p>Routes, places, and local stories.</p>
  </div>
</section>
<style>
.hero { color: white; background: #222 url("/images/coast.webp") center/cover; position: relative; isolation: isolate; }
.hero::before { content: ""; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgb(0 0 0 / 70%), transparent); }
</style>
```

### Pattern 5 — Art-directed mobile crop

What it does: Selects a composition that fits the mobile viewport instead of relying only on a desktop crop.

When to use it: Use when a portrait or hero's subject would be lost at narrow widths.

```html
<picture>
  <source media="(max-width: 600px)" srcset="/images/hero-mobile.webp">
  <img src="/images/hero-desktop.webp" width="1600" height="900" alt="A cyclist crossing a mountain pass">
</picture>
```

### Pattern 6 — Decorative atmosphere image

What it does: Adds visual texture without inserting irrelevant content into the accessibility tree.

When to use it: Use for nonessential background texture, soft gradients, and decorative shapes.

```html
<div class="texture" aria-hidden="true"></div>
<style>
.texture { background: url("/images/paper-texture.webp") center/cover; pointer-events: none; }
</style>
```

### Pattern 7 — Lazy-loaded related content

What it does: Defers offscreen image work while reserving layout space.

When to use it: Use for below-the-fold cards and galleries, not the primary hero image.

```html
<img src="/images/related.webp" width="800" height="533"
     loading="lazy" alt="A small sailboat in a harbor">
```

### Pattern 8 — Reduced-motion hover effect

What it does: Provides a restrained interactive cue without requiring motion for understanding.

When to use it: Use on linked cards when the hover treatment is mirrored for keyboard focus.

```html
<a class="image-card" href="/stories/coast">
  <img src="/images/coast.webp" alt="">
  <span>Read the coast story</span>
</a>
<style>
.image-card img { transition: transform 180ms ease; }
.image-card:hover img, .image-card:focus-visible img { transform: scale(1.025); }
.image-card:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) { .image-card img { transition: none; } .image-card:hover img, .image-card:focus-visible img { transform: none; } }
</style>
```

### Pattern 9 — Explicit image fallback

What it does: Keeps a meaningful layout when the image source fails.

When to use it: Use for avatars, product thumbnails, and content cards where a blank box would be confusing.

```html
<img src="/images/profile.webp" alt="Profile photo of Alex Rivera"
     width="96" height="96"
     onerror="this.hidden=true; this.nextElementSibling.hidden=false">
<span hidden role="status">Profile photo unavailable</span>
```



## Mental Models

1. **The crop belongs to the frame; the focal point belongs to the content.**
2. **Use `cover` when filling the frame matters and `contain` when the whole asset matters.**
3. **Responsive CSS size does not guarantee a responsive download.**
4. **Image dimensions are part of layout stability, not merely metadata.**
5. **Alternative text depends on purpose and context, not on how much detail the pixels contain.**
6. **A background image cannot replace meaningful semantic content.**
7. **An overlay should improve contrast without reducing the opacity of the text itself.**
8. **Hover is an enhancement, not the only way to reveal essential information.**
9. **Lazy loading is for likely offscreen assets, not every image by default.**
10. **Focal-point metadata is more reliable than one global object-position rule.**
11. **Debug the container and selected source before changing the image asset.**
12. **An image fallback must preserve meaning and avoid implying a false state.**


## Quick Reference

| Situation | Recommended default | Notes |
|---|---|---|
| Editorial photo | img + useful alt | Meaningful content belongs in semantic HTML. |
| Decorative texture | CSS background or alt="" | Keep irrelevant detail out of the accessibility tree. |
| Fill a card | object-fit: cover | Check crop and focal point. |
| Show entire diagram | object-fit: contain | Avoid cutting off labels or edges. |
| Responsive crop | object-position | Use per-image focal point when needed. |
| Consistent tile | aspect-ratio: 4 / 3 | Choose ratio based on content. |
| Responsive resolution | srcset + sizes | Match sizes to actual layout width. |
| Art direction | picture + media source | Use alternate composition when needed. |
| Avoid layout shift | width + height | Or reserve an aspect-ratio frame. |
| Offscreen gallery | loading="lazy" | Do not use blindly for hero/LCP image. |
| Critical hero | consider fetchpriority="high" | Only for the truly critical asset. |
| Text over image | overlay layer or pseudo-element | Check contrast across crop variants. |
| Interactive image card | hover + focus-visible | Essential content must also work on touch. |
| Reduced motion | @media (prefers-reduced-motion: reduce) | Disable nonessential image transitions. |
| Round image corners | clip at frame | Ensure overlays and focus outlines are not clipped. |
| Transparent product | neutral surface + contain | Check light and dark backgrounds. |
| Broken image | designed fallback | Reserve dimensions to avoid layout jump. |
| Blurry output | inspect currentSrc and naturalWidth | Check pixel density and source selection. |
| Unexpected crop | inspect object-fit and parent size | The parent may be controlling the height. |
| Failed network asset | Network panel + Console | Check URL, CSP, CORS, and response type. |


## Common Mistakes and Specific Fixes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Using `cover` for every image | A single crop rule can remove faces, product details, or diagram labels. | Choose fit from the information that must remain visible; use `contain` for full diagrams and documented crops for photos. |
| Omitting width and height | The browser cannot reserve intrinsic space before the image arrives. | Add intrinsic dimensions or an aspect-ratio frame, then keep the image responsive with CSS. |
| Writing alt text as a filename | Filenames describe storage rather than the content relevant to the user. | Write a concise contextual description or use an empty alt for decorative imagery. |
| Using a background for essential content | CSS backgrounds do not provide an `alt` attribute and can be skipped by assistive technology. | Use an `<img>` with alternative text or provide an equivalent text explanation. |
| Applying opacity to the entire hero | The title and buttons become translucent along with the image. | Place the overlay on a pseudo-element or dedicated layer behind content. |
| Using one focal point for all assets | Subjects appear in different positions and get cropped unpredictably. | Store per-image focal metadata or use curated `object-position` variants. |
| Lazy-loading the main hero by default | The largest above-the-fold image may start too late and hurt perceived loading. | Prioritize only the true critical image and verify the network waterfall. |
| Assuming CSS scaling saves bandwidth | The browser may still download a large original source. | Use `srcset`, `sizes`, and generated responsive variants. |
| Relying on hover-only captions | Touch and keyboard users may never see the caption or action. | Mirror essential reveals on `:focus-visible` and make content available without hover. |
| Using filters to encode state alone | The state may be unclear to users who cannot distinguish the color or brightness change. | Pair filters with text, shape, or another explicit state cue. |
| Applying border radius directly without frame logic | Badges and overlays may be clipped by the same rounded container. | Separate the media frame from overlays and controls; inspect overflow behavior. |
| Ignoring transparent asset backgrounds | A white product or dark logo can disappear on the current surface. | Test the asset on intended light and dark backgrounds and choose a suitable frame surface. |
| Shipping one desktop crop to every viewport | A narrow viewport may remove the focal subject or text-safe area. | Use `<picture>` art direction when the composition needs to change, not just the resolution. |
| Replacing a failed image with misleading stock art | The fallback implies content that was never loaded. | Use a neutral placeholder, explicit failure state, or truthful initials fallback. |
| Fixing a crop with random margins | The underlying parent height, ratio, or object-position problem remains. | Inspect computed styles, natural dimensions, and container geometry before patching. |
| Using high priority for every image | Competing priorities can reduce the value of the browser's loading strategy. | Reserve `fetchpriority="high"` for the image most important to the initial render. |
| Ignoring reduced motion on image zoom | The hover transition may be uncomfortable and is not needed to understand the link. | Disable nonessential transitions and transforms in a reduced-motion media query. |
| Testing only with a single stock image | Easy centered subjects hide edge cases in a reusable crop component. | Test portraits, edge-aligned subjects, transparent products, diagrams, and very wide images. |


## Build Requirements

1. Classify every image as meaningful content, functional content, or decoration.
2. Use semantic `<img>` markup for meaningful images and provide context-appropriate alternative text.
3. Use `alt=""` for purely decorative images rather than omitting the attribute.
4. Document when CSS backgrounds are permitted and forbid them for unrepresented essential content.
5. Define image aspect-ratio tokens for cards, avatars, galleries, and heroes where appropriate.
6. Use `object-fit` based on content constraints rather than a universal default.
7. Provide a documented focal-point mechanism for images whose subjects vary in placement.
8. Separate media frame geometry from image source and overlays.
9. Use responsive source variants and verify `srcset` and `sizes` against real layout widths.
10. Use art direction when the best composition changes between mobile and desktop.
11. Provide width and height attributes or reserve layout space to prevent layout shift.
12. Lazy-load likely offscreen images and avoid blindly lazy-loading the primary hero.
13. Use overlays that preserve text opacity and validate contrast at all relevant crops.
14. Mirror interactive hover treatment with keyboard focus treatment.
15. Respect `prefers-reduced-motion` for nonessential image transitions and zoom.
16. Define a consistent radius and background surface treatment for transparent assets.
17. Design a truthful fallback for broken or unavailable images.
18. Inspect `currentSrc`, natural dimensions, object-fit, object-position, and parent geometry in DevTools.
19. Test with portraits, diagrams, edge-aligned subjects, transparent products, and wide heroes.
20. Review the Network panel and production performance metrics before declaring image optimization complete.


## Topic-Specific Gotchas

> **Gotcha — object-fit needs a constrained box.** If the image has `height: auto` and no fixed frame height, `cover` may not create the crop you expected. Check the containing frame's dimensions.

> **Gotcha — source dimensions and CSS dimensions differ.** HTML width and height attributes establish intrinsic ratio; CSS can resize the rendered box. Do not remove them just because the CSS width is fluid.

> **Gotcha — a pseudo-element overlay needs a stacking plan.** Use positioning and `isolation` or a clear z-index structure so the overlay sits behind text without disappearing behind the section background.

> **Gotcha — lazy loading is a hint.** The browser chooses when to fetch a lazy image. Do not rely on it as a precise scheduling mechanism or use it for every image.

> **Gotcha — alt text can become redundant.** If a caption and nearby copy already state the relevant information, consider whether the image is decorative in that context.

> **Gotcha — object-position percentages are not crop coordinates.** The percentage aligns a point in the image with a point in the container; it is not a simple pixel offset. Test the result at several frame ratios.


## Before → After: Repairing an unpredictable card image

### Before

This implementation stretches the image into a fixed rectangle, omits alternative text, and leaves the browser without intrinsic dimensions.

```html
<div class="card">
  <img src="/images/person.jpg">
</div>
<style>
.card img { width: 100%; height: 220px; }
</style>
```

### After

The repaired version reserves a stable ratio, preserves image geometry, provides meaningful alternative text, and makes the crop intentional.

```html
<article class="card">
  <div class="card__media">
    <img src="/images/person.jpg" width="1200" height="900"
         alt="A gardener inspecting young tomato plants">
  </div>
  <h2>Growing tomatoes</h2>
</article>
<style>
.card__media { aspect-ratio: 4 / 3; overflow: hidden; }
.card__media img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 35%; }
</style>
```

## Accessibility review procedure

1. Ask whether the image conveys information, supports an action, or is purely decorative.
2. Confirm that content images have concise, contextual `alt` text and decorative images use `alt=""`.
3. Check whether visible captions already communicate the same information; avoid redundant announcements.
4. If the image is the only content of a link, make its alternative text describe the link's purpose or destination.
5. For charts and complex diagrams, provide a nearby textual summary or data equivalent rather than expecting one short alt string to carry every detail.
6. Test interactive image cards with keyboard navigation. Their focus indicator must be visible and their action must be clear without hover.
7. Check overlay contrast at the brightest part of the crop and across all responsive art-direction sources.
8. Test browser zoom and text enlargement to ensure titles and controls do not overlap the image.
9. Verify that loading or error states are communicated truthfully and are not indicated only by color.
10. Respect reduced-motion preferences for zoom and pan transitions.

## DevTools debugging walkthrough

Use this sequence when an image is blurry, cropped incorrectly, missing, or causing layout shift.

1. Select the image element in DevTools and check the `currentSrc` property to identify the resource the browser actually chose.
2. Check `complete`, `naturalWidth`, and `naturalHeight`. A zero natural width often indicates a failed load or a resource that has not decoded.
3. Inspect computed `width`, `height`, `object-fit`, `object-position`, and `aspect-ratio`.
4. Inspect the parent frame's dimensions, `overflow`, grid track sizing, and flex constraints.
5. Toggle `object-fit` and `object-position` in the Styles pane to determine whether the crop or the container is responsible.
6. Open Network and check the image response status, content type, transferred bytes, and any blocked request.
7. Check Console for CSP, CORS, mixed-content, and decoding errors.
8. Compare a mobile viewport and desktop viewport, particularly when `<picture>` uses media-specific sources.
9. Inspect the Performance panel for layout shifts and confirm that dimensions are reserved before image decoding.
10. Record the root cause and a minimal reproduction instead of leaving an unexplained offset override.

```js
function debugImage(img) {
  const style = getComputedStyle(img);
  const parent = img.parentElement;
  const parentStyle = getComputedStyle(parent);
  console.table({
    currentSrc: img.currentSrc,
    complete: img.complete,
    naturalWidth: img.naturalWidth,
    naturalHeight: img.naturalHeight,
    renderedWidth: style.width,
    renderedHeight: style.height,
    objectFit: style.objectFit,
    objectPosition: style.objectPosition,
    parentWidth: parentStyle.width,
    parentHeight: parentStyle.height,
    parentOverflow: parentStyle.overflow
  });
}
```

## Definition of done / Success criteria

- [ ] Every image is classified as content, functional, or decorative.
- [ ] Alternative text reflects purpose and context; decorative images use an empty alt attribute.
- [ ] Crop behavior and focal points are documented for reusable components.
- [ ] Aspect ratio and dimensions prevent unexpected layout shifts.
- [ ] Responsive sources are selected and tested at representative widths.
- [ ] Hero loading priority and below-the-fold lazy loading are intentional.
- [ ] Overlays preserve text opacity and maintain readable contrast.
- [ ] Hover effects have a keyboard-focus equivalent and do not hide essential content.
- [ ] Reduced-motion preferences are respected.
- [ ] Broken-image fallbacks preserve meaning and layout.
- [ ] DevTools inspection confirms the selected source, dimensions, and crop.
- [ ] Performance and network behavior have been checked on a realistic connection.

## Final operating principle

Image treatment is successful when the image keeps its meaning, crop, and performance characteristics across real layouts. Start with purpose, preserve the subject, reserve the space, and then apply visual effects. A smaller file, dramatic overlay, or elegant crop is not an improvement if it hides important information or makes the interface harder to use.


## Applied Build Lab — Build a responsive image component

### Scenario

A content dashboard uses one fixed-height image rule for editorial cards, product previews, portraits, and charts. Portraits lose faces on mobile, diagrams lose their labels, and the page shifts while images load. Some cards reveal titles only on hover. Consolidate the treatment without forcing every image into the same crop.

### Phase 1: Build a content matrix

Select at least six representative assets: a centered portrait, an edge-aligned portrait, a wide landscape, a transparent product render, a chart or diagram, and a narrow mobile composition. Record the required ratio, fit mode, focal point, alt-text purpose, and loading priority for each.

```js
const contentMatrix = [
  { kind: "portrait", ratio: "4 / 5", fit: "cover", focal: "50% 25%" },
  { kind: "landscape", ratio: "16 / 9", fit: "cover", focal: "50% 50%" },
  { kind: "diagram", ratio: "4 / 3", fit: "contain", focal: "center" },
  { kind: "product", ratio: "1 / 1", fit: "contain", focal: "center" },
  { kind: "mobile-hero", ratio: "3 / 4", fit: "cover", focal: "center" },
  { kind: "thumbnail", ratio: "1 / 1", fit: "cover", focal: "50% 35%" }
];
console.table(contentMatrix);
```

### Phase 2: Create frame variants

Use one base frame and named variants for the actual content needs. Avoid adding arbitrary per-page height declarations. A ratio token should make the layout stable; `object-fit` should control how the image fills that frame.

```css
.media-frame { overflow: hidden; background: var(--surface-muted); }
.media-frame--card { aspect-ratio: 4 / 3; }
.media-frame--portrait { aspect-ratio: 4 / 5; }
.media-frame--square { aspect-ratio: 1 / 1; }
.media-frame--hero { aspect-ratio: 16 / 9; }

.media-frame img { display: block; width: 100%; height: 100%; }
.media-frame--cover img { object-fit: cover; }
.media-frame--contain img { object-fit: contain; }
```

### Phase 3: Add focal point metadata

For assets whose subject varies, store a focal point as content metadata or map the asset to a documented component variant. Do not let content editors enter arbitrary CSS without validation. A percentage pair is often sufficient, but review it across more than one frame ratio.

```js
const focalPoints = {
  portraitA: "50% 22%",
  productB: "50% 50%",
  landscapeC: "62% 45%"
};

function applyFocalPoint(img, key) {
  const focalPoint = focalPoints[key];
  if (focalPoint) img.style.objectPosition = focalPoint;
}
```

### Phase 4: Add responsive source selection

Generate width variants from the original asset in a reproducible build pipeline. Use `sizes` that match the actual card width in each layout. If the mobile crop is compositionally different, use `<picture>` art direction rather than trying to solve it with resolution descriptors alone.

### Phase 5: Audit accessibility

Review each image in its real content context. A portrait that identifies the subject may need a name or relevant description; an image beside a caption that already states the full information may be decorative. Make sure interactive cards expose their title and action without requiring hover. Confirm that icon overlays or badges do not obscure important image content.

### Phase 6: Check performance

Use DevTools Network to compare transferred bytes and selected sources at mobile and desktop widths. Confirm that the hero image is not unintentionally lazy-loaded and that offscreen cards do not all compete for immediate download. Inspect layout shifts and verify that width, height, or aspect ratio reserves space before image decoding.

### Failure case to debug

A mobile card shows only the sky above a person's head, even though the desktop card looks correct. Do not immediately change the source image. Inspect the selected `currentSrc`, the frame ratio, and `object-position`. If the same source is being used, a focal point around `50% 25%` may preserve the face in the tall frame. If the desktop composition places the subject far to the side, a mobile-specific crop in `<picture>` may be necessary. Validate both sources with alt text that remains accurate, and check the title overlay contrast on each crop.

```css
.card__media { aspect-ratio: 4 / 3; overflow: hidden; }
.card__media img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 25%; }
@media (max-width: 600px) {
  .card__media { aspect-ratio: 3 / 4; }
}
```

## Pull-request review checklist

- Does the image have a clear purpose and correct semantic treatment?
- Is the alternative text useful in context and free of redundant wording?
- Is the frame ratio appropriate for the content type?
- Is `object-fit` chosen to preserve the required information?
- Is a focal point documented for off-center subjects?
- Would a different mobile composition improve the result?
- Do `srcset` and `sizes` match the actual responsive layout?
- Are width and height reserved to avoid layout shift?
- Is lazy loading applied only where appropriate?
- Is text over imagery readable at every crop?
- Are hover effects available to keyboard and touch users?
- Does the component honor reduced-motion preferences?
- Is the fallback truthful and dimensionally stable?
- Have Network, Console, and computed styles been inspected?


## Advanced Operational Notes

### Editorial photography

Editorial images should support the story and preserve the intended subject. Avoid over-processing that changes skin tones or makes documentary content look misleading. Use captions for contextual details that do not fit naturally into alternative text. If an image has a credit or licensing requirement, preserve it as content metadata and render it where readers can find it.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Product photography

Product imagery often benefits from `contain` on a neutral surface because the whole silhouette and details matter. Keep the display scale consistent across comparison cards, but do not stretch the product to fill empty space. Check transparent edges on light and dark backgrounds, and make sure the fallback does not imply a different model or finish.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Portrait galleries

Portrait grids need careful focal-point handling because faces are rarely centered in every source. Consider a portrait-specific ratio and a top-biased focal point, but test edge cases such as hats, tall hairstyles, and group portraits. If the person is identified in nearby text, decide whether the image alt is redundant or adds relevant context.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Charts and diagrams

Charts, schematics, and instructional diagrams should not be cropped to match a photo grid. Prefer `contain` and provide a textual explanation or data table when the image carries complex information. Verify labels remain legible at mobile sizes; if they do not, provide a larger view or an alternative representation.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Hero imagery

Hero sections combine image, title, call to action, and sometimes navigation. Establish a text-safe area in the composition, then validate the overlay on all breakpoints. Avoid assuming the same gradient works on every crop. If text becomes hard to read, use a solid panel or change the image rather than continually darkening it.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Transparent PNG and SVG assets

Transparent assets have no built-in surface, so the page's background becomes part of their visual treatment. Test them on the intended surface and verify the transparent canvas does not contain accidental whitespace. Treat SVG as active document content when sourcing it from elsewhere; use trusted assets and a reviewed pipeline.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Responsive delivery

Responsive image delivery works best when source generation and component layout are planned together. The `sizes` value should describe the image's rendered slot, not simply repeat `100vw` everywhere. Validate currentSrc at representative viewport widths and inspect transfer size to catch a configuration that always selects the largest file.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

### Visual regression testing

Keep a small set of difficult images in screenshot tests: an edge-aligned face, a transparent object, a chart, a wide hero, and a narrow crop. Compare screenshots at consistent browser zoom and device-pixel ratio. Use human review for subjective focal-point and color decisions, and automated checks for missing dimensions, invalid alt attributes, and failed requests.

```css
/* Keep image behavior explicit and easy to inspect. */
.image-treatment-example { object-fit: cover; object-position: center; }
.image-treatment-example:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
```

