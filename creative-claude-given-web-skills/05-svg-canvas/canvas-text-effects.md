# Canvas Text Effects — Production Skill Guide

> **Purpose:** Design, implement, debug, and optimize expressive typography rendered with the Canvas 2D API: kinetic headlines, neon treatments, text masks, particle typography, type distortion, layered shadows, and responsive editorial visuals.
>
> **Use this skill when:** text must behave as part of a visual composition rather than as ordinary page content—for example, a hero title that reveals an image, a decorative wordmark with trails, a responsive kinetic heading, or a canvas-based visualizer whose lettering changes with data.
>
> **Do not use this skill as the default for page copy.** Canvas text is pixels, not semantic text. It cannot be selected, searched, copied, translated, indexed, or announced by assistive technology in the same way as real HTML text. Keep meaningful text in the DOM and use Canvas as a decorative rendering layer unless the experience has a deliberate accessible alternative.

## Why this matters in production

Canvas typography fails in ways that ordinary CSS typography does not. A title can be visually clipped because `measureText()` reports advance width rather than the complete painted bounds; a font can silently render in a fallback face because the canvas drew before `document.fonts.ready`; a responsive canvas can blur because its backing bitmap was not scaled for device-pixel ratio; and a glow that looks inexpensive on a laptop can tank frame time on a phone because a large shadow is rasterized for every glyph on every frame. Text may also disappear in screenshots or export because a custom font was not loaded, become unreadable at small sizes, or drift away from the HTML layout because the drawing and DOM use different font metrics.

These are not cosmetic edge cases. They affect brand accuracy, readability, animation stability, performance, and the ability to use a page. A production-quality text effect starts with font readiness, explicit coordinate systems, measured bounds, a restrained rendering budget, and a semantic HTML fallback. The effect should remain an enhancement: if Canvas is unavailable, motion is reduced, or the browser is under load, the visitor should still understand the page.

## Operating principles

- **HTML owns meaning; Canvas owns decoration.** Expose the real headline and supporting copy in the DOM. Hide duplicate decorative rendering from assistive technology.
- **Wait for fonts before measuring.** A measurement made with fallback metrics is not a reliable layout measurement.
- **Measure the painted result, not just the advance width.** Glyph overhangs, italic faces, accents, and shadows can extend beyond the nominal text width.
- **Use one coordinate contract.** Store layout in CSS pixels, scale the backing bitmap for device-pixel ratio, and avoid mixing physical pixels with CSS pixels.
- **Separate layout, animation state, and drawing.** Text layout should not be recalculated needlessly every frame.
- **Budget expensive effects.** Shadows, blur, multiple text passes, and per-pixel distortion multiply the cost of rendering text.
- **Respect reduced motion.** A static, intentional composition is a complete design state.
- **Profile real devices.** Text rasterization, font complexity, DPR, and compositing costs vary across devices and browsers.

### 1. Mental model: Canvas text is a rasterized drawing operation

`fillText()` and `strokeText()` draw glyphs into the current bitmap. Unlike a DOM text node, the resulting pixels have no independent semantic identity and do not automatically reflow when the canvas changes size. The application must decide the font, baseline, alignment, fill, stroke, transform, clipping, and redraw policy. This is useful for effects that require precise layering, but it means that wrapping, accessibility, and responsive layout are application responsibilities.

Use Canvas text for visual treatments that are difficult or costly to express as a collection of DOM elements. Keep actual copy in HTML, including the heading hierarchy. If the decorative canvas contains the same words as a real heading, mark it as decorative with `aria-hidden="true"` and ensure the HTML version remains available at every breakpoint. Do not use `aria-label` on a canvas as a substitute for a complete accessible experience when the visual itself contains controls or information.

```html
<section class="hero" aria-labelledby="hero-title">
  <h1 id="hero-title">Make the invisible visible.</h1>
  <canvas class="hero__type-art" aria-hidden="true"></canvas>
</section>
```

```css
.hero { position: relative; isolation: isolate; }
.hero h1 { position: relative; z-index: 1; max-width: 12ch; }
.hero__type-art {
  position: absolute; inset: 0; z-index: 0;
  width: 100%; height: 100%; pointer-events: none;
}
```

The example keeps the semantic heading available even if the canvas fails. In some art-directed layouts the canvas may visually sit over the DOM heading; in that case, choose contrast and opacity so the real heading remains readable, or provide a static DOM treatment instead. Never assume that the text painted into a bitmap will be exposed to screen readers.

### 2. Mental model: there are three sizes, not one

Canvas typography involves CSS layout size, backing bitmap size, and the glyph's painted bounds. The CSS size determines how much space the element occupies. The backing bitmap size determines raster resolution. The painted bounds describe where glyph pixels actually appear around the baseline. These values are related, but not interchangeable.

If a canvas is 900 CSS pixels wide and the device-pixel ratio is 2, the backing bitmap should usually be about 1800 pixels wide. Draw in CSS-pixel coordinates by scaling the context once after resizing. Do not then multiply every `fillText` coordinate by the DPR as well, or the text will be positioned twice as far. Also do not assume a string's measured advance width includes every visible pixel: italic letters can overhang, accents can rise above the em box, and strokes or shadows can extend outward.

```js
function resizeCanvas(canvas, ctx, width, height) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width, height, dpr };
}
```

This helper establishes a CSS-pixel drawing space after each resize. The DPR cap is a performance policy, not a universal truth: raise or lower it based on visual requirements and measured cost. Reapply the transform after changing the canvas dimensions because assigning `canvas.width` or `canvas.height` clears the bitmap and resets context state.

### 3. Font loading and stable measurement

A canvas can draw before a web font has finished loading. In that case, `measureText()` measures the available fallback font and `fillText()` may paint fallback glyphs. Once the intended font loads, the same string can have a different width, different line breaks, different baseline extents, and different visual rhythm. If the canvas layout was calculated earlier, the title may appear clipped or misaligned even though the font request eventually succeeds.

Use the Font Loading API before measuring or painting. `document.fonts.load()` can request a particular font shorthand; `document.fonts.ready` resolves when the document's font loading and layout operations have settled. Handle failures explicitly: a failed font should lead to a documented fallback font stack, not a blank hero or an unhandled rejected promise. For dynamic user-provided font choices, validate the family name and remeasure after a new face becomes available.

```js
async function waitForFont(font) {
  try {
    await document.fonts.load(font);
    await document.fonts.ready;
    return document.fonts.check(font);
  } catch (error) {
    console.warn('Font loading failed; using fallback metrics.', error);
    return false;
  }
}

async function prepareHeadline(ctx, text, font) {
  const loaded = await waitForFont(font);
  ctx.font = loaded ? font : '700 64px system-ui, sans-serif';
  return ctx.measureText(text);
}
```

`document.fonts.check()` is useful as a guard, but it is not a guarantee that every requested face or glyph is ideal for every string. A font can load successfully while lacking a particular character, causing per-glyph fallback. Test punctuation, accented letters, non-Latin scripts, emoji, and variable-font axes used by the design. Font loading is a layout dependency: if the effect is visible immediately, render a stable fallback first and replace it when the desired font is ready.

### 4. Text metrics, baselines, and clipping

The Canvas text API aligns text around a baseline, not around the top-left corner of a bounding box. `textBaseline` controls which vertical reference is used; `textAlign` controls horizontal alignment. The default baseline is `alphabetic`, which is often appropriate for typography but is not the same as vertically centering the visible glyph pixels. `TextMetrics` can expose `actualBoundingBoxLeft`, `actualBoundingBoxRight`, `actualBoundingBoxAscent`, and `actualBoundingBoxDescent` in modern browsers. These values are more useful for visible bounds than advance width alone.

When you draw outlines, shadows, or blur, expand the drawing region further. A stroke extends around the glyph edge; a shadow adds offset and blur radius; a glow may need several times the blur value as padding. If the effect is clipped, first compare the measured bounds with the canvas region and the extra effect padding. Avoid hard-coded vertical offsets tied to one font: ascent, descent, and line-gap characteristics differ between typefaces and even between weights.

```js
function measureTextBounds(ctx, text) {
  const m = ctx.measureText(text);
  const left = m.actualBoundingBoxLeft ?? 0;
  const right = m.actualBoundingBoxRight ?? m.width;
  const ascent = m.actualBoundingBoxAscent ?? 0;
  const descent = m.actualBoundingBoxDescent ?? 0;
  return {
    advance: m.width,
    x: -left,
    y: -ascent,
    width: left + right,
    height: ascent + descent,
  };
}
```

The fallback values above are conservative, not exact substitutes for missing actual bounds. For browsers without the full metrics you may need a known font-size-based padding or a DOM measurement fallback. When the design uses stroked text or large blur, make the canvas region larger than the nominal text box and clip intentionally rather than accidentally.

### 5. Responsive type layout and wrapping

Canvas does not automatically wrap text. You must define line breaks, maximum line width, line height, alignment, and a strategy for changing font size when the available width changes. The simplest robust approach is to measure candidate lines and wrap words before drawing. For display typography, it is often better to use an art-directed line-break plan at known layout ranges than to mechanically fit every word into one line. Do not split words or grapheme clusters without an explicit language-aware policy.

A responsive effect should listen to the canvas container's dimensions, not only the global window. A `ResizeObserver` can catch changes caused by a sidebar, grid reflow, or font-size adjustment. Debounce or schedule the expensive layout step so repeated resize notifications do not trigger repeated text wrapping in one frame. Store the result as layout state and redraw from it.

```js
function wrapWords(ctx, text, maxWidth) {
  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
```

This simple word wrapper is appropriate for English-like whitespace-delimited text. It does not implement Unicode line breaking, hyphenation, bidi layout, or grapheme-safe segmentation for all languages. For multilingual product copy, use HTML for the semantic text and consider using Canvas only for an art-directed decorative duplicate with known line breaks. Always test the longest localized string, not just the English source string.

### 6. Context state and transform discipline

Canvas context state is sticky. Properties such as `font`, `textAlign`, `textBaseline`, `globalAlpha`, `globalCompositeOperation`, `shadowBlur`, `shadowOffsetX`, `shadowOffsetY`, line styles, and transforms persist between calls until changed. A helper that draws a glow may accidentally leave `shadowBlur` enabled for a later label. A clipping path also remains active until the context is restored from a saved state. These leaks create bugs that appear far away from the code that introduced them.

Wrap isolated rendering passes in `save()` and `restore()`, and use `setTransform()` when you need a known transform instead of repeatedly multiplying scale values. Remember that `save()` and `restore()` protect drawing state but do not preserve the bitmap contents. Avoid unbalanced calls: every `save()` needs a matching `restore()` even when a helper throws. In complex renderers, give each pass ownership of the state it changes and make that contract explicit in comments or function names.

```js
function drawTextPass(ctx, draw) {
  ctx.save();
  try {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = 0;
    draw(ctx);
  } finally {
    ctx.restore();
  }
}
```

Use a `finally` block when the drawing function may fail. It prevents a thrown error from leaving the context in a surprising state for subsequent passes. Keep state setup close to the draw call; do not rely on whichever function happened to run first in a frame.

### 7. Fill, stroke, and layered text rendering

`fillText()` paints the glyph interiors, while `strokeText()` paints their outlines. Combining them can create outlined display type, but order matters: a thick stroke drawn after a fill can cover the fill near the edges, while a fill drawn after the stroke can conceal part of the outline. Use `lineJoin` and `lineWidth` deliberately, and avoid extremely thick strokes on small text because counters can close and glyph shapes become ambiguous.

Layering multiple passes is a reliable way to create a visual hierarchy: a broad low-opacity shadow, a restrained colored glow, a crisp edge, and a readable fill. However, every pass is more drawing work and may require more rasterization. Keep the sharp readable pass last when the effect is intended to be decorative. If the final result must remain legible at small sizes, reduce the outline and glow before shrinking the glyphs. Do not use the same effect recipe for all fonts: a high-contrast serif and a heavy geometric sans have different counters and edge density.

```js
function drawOutlinedTitle(ctx, text, x, y) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#111827';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(text, x, y);
  ctx.restore();
}
```

This is a compact baseline example. In production, include font setup and bounds padding in the surrounding layout, and keep colors configurable so the effect can adapt to the site's theme and contrast requirements.

### 8. Shadow and glow cost model

Canvas shadows are convenient, but a large `shadowBlur` on complex text can be expensive. A glow that is redrawn at 60 frames per second can repeatedly rasterize the same glyph geometry, and multiple glowing passes multiply the work. Do not assume that a single property is always hardware accelerated. Performance depends on browser implementation, canvas size, device-pixel ratio, font complexity, and how the browser composites the layer.

If the text itself is static while only its glow intensity changes, cache the expensive base text or glow in an offscreen canvas and animate a cheap property or composite. If the glow must pulse, consider a small number of pre-rendered layers or a limited set of alpha values rather than recalculating an elaborate effect every frame. A blur is not free just because the source consists of text. Benchmark at the actual canvas resolution and with the actual font.

```js
function renderGlowCache(text, font, width, height, dpr = 1) {
  const cache = document.createElement('canvas');
  cache.width = Math.ceil(width * dpr);
  cache.height = Math.ceil(height * dpr);
  const c = cache.getContext('2d');
  c.scale(dpr, dpr);
  c.font = font;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.shadowColor = 'rgba(56, 189, 248, 0.8)';
  c.shadowBlur = 18;
  c.fillStyle = '#e0f2fe';
  c.fillText(text, width / 2, height / 2);
  return cache;
}
```

This cache is valid only for the exact text, font, dimensions, DPR, shadow settings, and rendering style used to create it. If any of those inputs changes, rebuild the cache. Include enough padding around the glyphs so the shadow is not clipped. Do not create a new cache every frame; that merely moves the expensive work into allocations and bitmap uploads.

### 9. Offscreen rendering and cache invalidation

An offscreen canvas is useful when a text layer is expensive to render but changes infrequently. Render a static title, noise texture, or glow once, then draw the cached bitmap into the visible canvas. The cache needs a clear invalidation key. Text content, font family, weight, size, letter spacing strategy, color, stroke width, shadow values, line breaks, canvas size, and device-pixel ratio can all affect the output. If any input changes, the cache must be refreshed.

For a component, represent cache inputs as a small immutable configuration object and compare the fields that actually influence pixels. Avoid invalidating the cache because an unrelated pointer coordinate changed. Conversely, do not keep a stale cache after the font loads: a cache drawn with fallback glyphs is not repaired by the font becoming available. Wait for font readiness, then rebuild.

```js
function makeCacheKey(config) {
  return [
    config.text, config.font, config.width, config.height, config.dpr,
    config.fill, config.stroke, config.lineWidth,
    config.shadowColor, config.shadowBlur,
  ].join('|');
}
```

A joined string key is easy to inspect, but use a structured comparison or stable serialization if values can contain delimiters. Include all values that influence raster output, and avoid storing user-sensitive text unnecessarily in long-lived caches. Cache memory is also a budget: large DPR-scaled bitmaps can consume significant memory, so release references when a scene unmounts or changes substantially.

### 10. Animation timing and stable motion

Text effects often animate a baseline, scale, rotation, hue, reveal amount, or shadow. Drive animation with `requestAnimationFrame` and elapsed time, not by adding a fixed number on each callback. A fixed per-frame increment makes the effect run faster on a 120 Hz display than on a 60 Hz display. Clamp unusually large time deltas after a tab has been suspended so the title does not jump across the screen when the user returns.

Use a single scheduler for a scene, and stop it when the scene is offscreen, hidden, or reduced-motion mode is active. Separate the animation state from the rendering function so the same state can be drawn at any time, including a deterministic screenshot. If a title's animation is purely decorative, it should not compete with navigation or other essential controls.

```js
function startPulse(render, prefersReducedMotion) {
  if (prefersReducedMotion) {
    render(0);
    return () => {};
  }
  let frame = 0;
  let last = 0;
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    render(dt, now / 1000);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
```

The example illustrates scheduling; a production implementation should also handle document visibility, component teardown, and dynamic preference changes. The returned cleanup function must be called when the component is removed. Avoid starting another loop every time a resize or pointer event fires.

### 11. Per-character effects and letter spacing

Canvas does not provide a universal `letter-spacing` property equivalent to CSS on all target browsers. For per-character animation, measure each character or grapheme and draw it at an accumulated x-position. Do not iterate JavaScript string indices blindly when Unicode text is possible: surrogate pairs and combining marks can represent a single user-perceived character. `Intl.Segmenter` can split text into grapheme clusters where supported; a fallback should be documented if the experience must support older browsers.

Per-character drawing offers fine control over wave motion, staggered reveal, color shifts, and rotation, but it changes shaping behavior. Complex scripts rely on shaping and ligatures; drawing each grapheme separately can break joining, kerning, bidirectional ordering, and contextual glyph forms. Use this technique for deliberately constrained display text, such as a short Latin wordmark, not as a generic replacement for browser text layout.

```js
function splitGraphemes(text) {
  if (typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text), item => item.segment);
  }
  return Array.from(text); // Code-point fallback, not full grapheme segmentation.
}

function drawTrackedText(ctx, text, startX, y, tracking) {
  let x = startX;
  for (const grapheme of splitGraphemes(text)) {
    ctx.fillText(grapheme, x, y);
    x += ctx.measureText(grapheme).width + tracking;
  }
  return x - startX;
}
```

The fallback does not preserve every combined grapheme, and the per-character method does not reproduce full shaping. Document those limitations and prefer the DOM when text can be localized or may contain complex writing systems.

### 12. Clipping text with images, gradients, and patterns

Canvas clipping can create text-shaped image reveals, but the text must first be converted into a clipping path through the supported text-path workflow or represented by a mask image. Canvas 2D does not expose a direct `clipText()` method. A common strategy is to draw a background image to an offscreen canvas, draw text into an alpha mask, and use compositing such as `destination-in` to retain only the image pixels where the mask is opaque. The exact compositing order matters: drawing the mask after the image with the wrong operation can erase the entire layer.

For simple effects, a gradient fill applied to text is easier: create a `CanvasGradient`, set it as `fillStyle`, and call `fillText()`. For complex image masks, isolate the operation in an offscreen canvas, clear it before reuse, and make the alpha semantics explicit. Keep a normal DOM heading over or near the effect so the words remain meaningful.

```js
function drawImageThroughText(ctx, image, text, font, width, height) {
  const layer = document.createElement('canvas');
  layer.width = width;
  layer.height = height;
  const layerCtx = layer.getContext('2d');
  if (!layerCtx) return;
  layerCtx.drawImage(image, 0, 0, width, height);
  layerCtx.globalCompositeOperation = 'destination-in';
  layerCtx.font = font;
  layerCtx.textAlign = 'center';
  layerCtx.textBaseline = 'middle';
  layerCtx.fillStyle = '#fff';
  layerCtx.fillText(text, width / 2, height / 2);
  ctx.drawImage(layer, 0, 0);
}
```

The mask operation retains destination pixels where the source has alpha. Here, the text is the source and the image is the destination. Confirm the intended compositing direction with a tiny test layer before applying it to a full-screen bitmap. This example omits DPR and padding for clarity; production code must include both.

### 13. Blend modes and compositing

`globalCompositeOperation` changes how new pixels combine with existing pixels. Modes such as `screen`, `lighter`, `multiply`, and `source-atop` can create neon, color overlays, and text-image interactions. The visual outcome depends on draw order and alpha. A blend mode that looks bright on a black background may become muddy on a light surface, and additive blending can saturate quickly when multiple layers overlap.

Keep blend-mode passes isolated with `save()` and `restore()`. Use a predictable background when evaluating a compositing recipe, then test it against the real page theme. Prefer a crisp readable text pass over a complex blended treatment if the effect becomes difficult to read. Avoid assuming all modes have identical performance or visual behavior across browsers and color-management paths.

```js
function drawScreenBlend(ctx, drawBase, drawAccent) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  drawBase(ctx);
  ctx.globalCompositeOperation = 'screen';
  drawAccent(ctx);
  ctx.restore();
}
```

Blend modes are visual tools, not substitutes for contrast testing. If the title crosses a variable background image, test the worst-case region and add a stable backing layer or alternate foreground color when necessary.

### 14. Noise, distortion, and pixel sampling

Distortion can be produced by moving glyph positions, using a displacement map in a separate rendering pipeline, or manipulating pixel data. The most expensive approach is often reading or writing the full canvas pixel buffer every frame. `getImageData()` can force synchronization between rendering and CPU-visible pixels, which may be slow, especially for a large DPR-scaled canvas. Use pixel sampling only when the effect genuinely needs per-pixel information and keep the working area as small as practical.

For a glitch effect, prefer a bounded number of slices or scanline offsets over random full-frame pixel noise. Seed randomness when reproducible output is useful for testing. Avoid flicker that can be uncomfortable or trigger motion sensitivity; never make essential instructions unreadable during a glitch. A deterministic reduced-motion state should show a still, non-distorted title.

```js
function drawGlitchSlices(ctx, source, width, height, seedOffsets) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  for (const slice of seedOffsets) {
    const h = Math.max(1, slice.height);
    ctx.drawImage(source, 0, slice.y, width, h,
      slice.offsetX, slice.y, width, h);
  }
}
```

The source should be a cached, already-rendered text layer. Keep the number of slices bounded, clamp source rectangles to valid dimensions, and avoid generating a fresh unbounded list of slices every frame. This produces a controlled glitch rather than a full pixel-processing pipeline.

### 15. Accessibility, reduced motion, and semantic fallback

The DOM should provide the actual heading, description, and any interactive controls. Mark a purely decorative canvas `aria-hidden="true"`, set `pointer-events: none` when it should not intercept input, and avoid placing essential instructions exclusively inside the bitmap. If the canvas conveys data, provide an equivalent text summary or accessible table. If it is interactive, provide keyboard operation and semantic controls rather than relying on pointer coordinates alone.

Reduced-motion support should change the experience, not merely slow the same animation. A static title, a single fade-in, or a user-controlled play state may be appropriate. Listen for preference changes and stop scheduling frames when the reduced-motion state is active. Also avoid high-frequency flashes, rapid contrast inversion, or glitch bursts that create unnecessary visual stress.

```js
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function renderForMotionPreference() {
  if (motionQuery.matches) {
    stopAnimation();
    drawStaticHeadline();
  } else {
    startAnimation();
  }
}
motionQuery.addEventListener?.('change', renderForMotionPreference);
renderForMotionPreference();
```

In a component or application, remove the event listener and cancel animation during teardown. For older environments, feature-detect the event-listener method and use the supported legacy alternative only if that browser is part of the support policy. Do not let reduced motion be overridden by an animation loop that another event handler starts later.

### 16. Performance budgets and profiling

Treat canvas text rendering as a pipeline with separate costs: font measurement, line layout, glyph rasterization, blur and shadows, compositing, bitmap uploads, and frame scheduling. Measure each category separately where possible. Avoid calling `measureText()` for unchanged text on every frame. Cache line breaks and metrics after font loading. Use a lower DPR on low-power devices when the visual quality remains acceptable. Reduce the number of glow passes before attempting complicated micro-optimizations.

Set a target frame budget: at 60 Hz a frame is about 16.7 ms, but your canvas must share that budget with the rest of the page. Profile with browser performance tools on the target device, not only on a desktop development machine. Track dropped frames, CPU use, memory growth, and whether animation continues offscreen. A title that is decorative should be paused when it is not visible and should not consume a background loop while the tab is hidden.

```js
const metrics = { frames: 0, totalMs: 0, maxMs: 0 };
function timedDraw(draw) {
  const start = performance.now();
  draw();
  const elapsed = performance.now() - start;
  metrics.frames += 1;
  metrics.totalMs += elapsed;
  metrics.maxMs = Math.max(metrics.maxMs, elapsed);
}
function reportDrawCost() {
  return {
    averageMs: metrics.frames ? metrics.totalMs / metrics.frames : 0,
    maxMs: metrics.maxMs,
    frames: metrics.frames,
  };
}
```

This small measurement helper does not capture compositing cost after the JavaScript call returns, nor does it provide a statistically robust benchmark by itself. Use it as a local signal alongside the browser performance timeline. Reset counters between scenarios and compare equivalent text, font, DPR, and effect settings.

### 17. Lifecycle, visibility, and cleanup

Canvas text effects often outlive the page state that created them unless teardown is explicit. Resize observers, media-query listeners, font-loading callbacks, pointer listeners, and animation frames all need a lifecycle. If a component mounts twice in development or is removed during navigation, stale loops can continue drawing into a detached canvas. A resize callback may also recreate an expensive cache repeatedly if its observer is not disconnected.

Keep references to scheduled frame IDs and observers. When the canvas is no longer visible, suspend work. When it is removed, cancel the frame, disconnect observers, remove listeners, and release cached canvases or image references. A page visibility change is not the same as a component unmount: the scene may resume later, so keep a clear state machine for running, paused, and disposed states.

```js
function installVisibilityPause(onPause, onResume) {
  const handler = () => {
    if (document.hidden) onPause();
    else onResume();
  };
  document.addEventListener('visibilitychange', handler);
  handler();
  return () => document.removeEventListener('visibilitychange', handler);
}
```

Use a single lifecycle owner so resize, visibility, and motion preference changes do not fight each other. For example, a scene should run only when it is mounted, visible, and allowed by the motion policy. Treat that condition as a single derived state rather than independently starting and stopping the loop from many event handlers.

### 18. Testing strategy and deterministic rendering

A canvas effect should be testable without relying entirely on subjective visual inspection. Unit-test pure functions such as wrapping, cache-key generation, easing curves, and coordinate mapping. Integration-test font readiness, resize behavior, reduced-motion state, cleanup, and the semantic DOM fallback. For screenshot tests, use a known font environment, wait for fonts to load, disable nondeterministic animation or freeze time, and capture a defined viewport and DPR.

Do not compare antialiased text pixels too strictly across unrelated operating systems and browsers: rasterization differs. Use tolerance-based screenshot comparisons or test structural invariants such as clipping bounds, canvas dimensions, and presence of the HTML heading. Include long strings, narrow widths, missing fonts, high DPR, hidden-tab resume, and a reduced-motion preference in the test matrix.

```js
function fitFontSize(ctx, text, maxWidth, initialSize, family, weight = 700) {
  let size = initialSize;
  while (size > 12) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 1;
  }
  return size;
}
```

Pure helpers are easier to test when they receive their inputs explicitly and do not read global layout state. This fit helper is suitable for a constrained single line; a real layout must also consider painted bounds, line wrapping, minimum readable size, and whether the text should switch to an HTML layout instead.

### 19. Browser compatibility and graceful degradation

Canvas 2D text, gradients, strokes, and basic compositing are broadly supported in modern browsers, but details vary. Text metrics fields have not always been equally available; font loading behavior depends on the font and document lifecycle; variable fonts and color emoji can rasterize differently; and visual results can differ because of operating-system text rasterization. Some CSS-like text properties are not available as direct Canvas 2D properties, so do not assume `letter-spacing`, `font-kerning`, or all font variation controls work identically in every browser.

Feature-detect APIs that are optional for the design. Use a fallback for missing `actualBoundingBox*` metrics, do not rely on `Intl.Segmenter` without a fallback if older browsers matter, and provide a real HTML heading in all cases. Avoid unsupported properties silently becoming no-ops: keep the essential effect independent of optional enhancements and verify on current Chromium, Firefox, and Safari versions in the project's browser support matrix.

```js
function getTextMetrics(ctx, text) {
  const m = ctx.measureText(text);
  return {
    width: m.width,
    ascent: Number.isFinite(m.actualBoundingBoxAscent)
      ? m.actualBoundingBoxAscent : parseFloat(ctx.font) * 0.8,
    descent: Number.isFinite(m.actualBoundingBoxDescent)
      ? m.actualBoundingBoxDescent : parseFloat(ctx.font) * 0.25,
  };
}
```

The fallback is approximate and should be tuned against the chosen font stack. It is not a replacement for proper metrics on all scripts. Test actual browser versions and devices that matter to your audience rather than treating a feature table as a substitute for visual QA.

### 20. Debugging playbook: diagnose by symptom

Start with a minimal text pass: solid fill, no shadow, no stroke, no transform, and a known font. Confirm the canvas backing size and CSS size, then confirm that the intended font is loaded and that `ctx.font` is set before `measureText()`. Add one effect at a time. If text is clipped, inspect the painted bounds and padding. If text is blurry, inspect DPR and scaling. If the text is misplaced, inspect baseline, alignment, transforms, and whether coordinates are CSS pixels or backing pixels.

For a glow that disappears, check draw order, shadow color alpha, shadow blur, canvas clipping, and whether later drawing clears or covers the layer. For unexpected color, inspect `globalCompositeOperation`, global alpha, fill style, and any filters or blending used by surrounding passes. For an effect that degrades over time, check whether a new animation loop, observer, cache canvas, or event listener is created on every resize or state update. Reproduce with one line of text and one pass before debugging a complex multi-layer scene.

```js
function debugText(ctx, text, x, baselineY) {
  const m = ctx.measureText(text);
  ctx.save();
  ctx.strokeStyle = 'magenta';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, baselineY - (m.actualBoundingBoxAscent || 0),
    m.width, (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0));
  ctx.fillStyle = 'white';
  ctx.fillText(text, x, baselineY);
  ctx.restore();
}
```

The debug rectangle is a diagnostic approximation because advance width and actual left/right bounds are not always identical. Use it to reveal baseline and clipping problems, then remove the overlay from production. Keep a debug mode that can disable glow and distortion independently; it makes future regressions much easier to isolate.

## 21. Pattern catalog

Each named pattern below states what it does, when to use it, and includes a focused implementation. These patterns are building blocks, not effects to stack indiscriminately. Pick the smallest number of passes that achieves the design, and keep a readable semantic heading in HTML.

### Pattern 1 — Crisp outline with readable fill

**What it does:** Creates a stable outlined headline with a sharp interior fill. **When to use it:** Editorial titles, dark hero art, or text over a busy image when the outline adds separation without replacing contrast.

```js
function patternOutline(ctx, text, x, y) {
  ctx.save();
  ctx.font = '800 72px system-ui, sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111827';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#f9fafb';
  ctx.fillText(text, x, y);
  ctx.restore();
}
```

Keep the stroke narrow relative to the font size. If counters close at small widths, reduce line width or switch to a CSS treatment.

### Pattern 2 — Neon glow with crisp foreground

**What it does:** Draws a soft luminous pass and then a sharp foreground pass. **When to use it:** A short decorative wordmark or a dark, controlled hero scene where a glow reinforces the visual hierarchy.

```js
function patternNeon(ctx, text, x, y) {
  ctx.save();
  ctx.font = '700 68px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 22;
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f0f9ff';
  ctx.fillText(text, x, y);
  ctx.restore();
}
```

Use a bounded blur and test the composition on mobile. A glow that occupies more pixels than the letters may become muddy and expensive.

### Pattern 3 — Gradient headline

**What it does:** Applies a horizontal or vertical gradient to the glyph fill. **When to use it:** A branded display title whose color progression remains readable against the surrounding background.

```js
function patternGradient(ctx, text, x, y, width) {
  ctx.save();
  const gradient = ctx.createLinearGradient(x - width / 2, y, x + width / 2, y);
  gradient.addColorStop(0, '#a78bfa');
  gradient.addColorStop(0.55, '#38bdf8');
  gradient.addColorStop(1, '#34d399');
  ctx.fillStyle = gradient;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.restore();
}
```

Compute gradient endpoints from the actual layout bounds, not a stale viewport width. Check contrast at every color stop and against every background region the text crosses.

### Pattern 4 — Animated baseline wave

**What it does:** Offsets a constrained display word along a smooth wave. **When to use it:** Short decorative lettering, a music visualizer title, or an ambient hero element where gentle motion is appropriate.

```js
function patternWave(ctx, letters, x, y, time) {
  let cursor = x;
  ctx.save();
  for (let i = 0; i < letters.length; i += 1) {
    const char = letters[i];
    const dy = Math.sin(time * 1.8 + i * 0.45) * 5;
    ctx.fillText(char, cursor, y + dy);
    cursor += ctx.measureText(char).width + 1;
  }
  ctx.restore();
}
```

This simple pattern assumes a constrained script and does not preserve full complex-script shaping. Prefer a single word or grapheme-aware layout and provide a static state for reduced motion.

### Pattern 5 — Image revealed through text

**What it does:** Uses the text alpha as a mask over an image layer. **When to use it:** Art-directed hero imagery or a poster-like composition with short, large lettering.

```js
function patternImageMask(layerCtx, image, text, font, width, height) {
  layerCtx.clearRect(0, 0, width, height);
  layerCtx.drawImage(image, 0, 0, width, height);
  layerCtx.globalCompositeOperation = 'destination-in';
  layerCtx.font = font;
  layerCtx.textAlign = 'center';
  layerCtx.textBaseline = 'middle';
  layerCtx.fillStyle = '#fff';
  layerCtx.fillText(text, width / 2, height / 2);
  layerCtx.globalCompositeOperation = 'source-over';
}
```

Use an offscreen layer and validate the alpha direction. Include a fallback heading because the image-shaped text is not semantic content.

### Pattern 6 — Controlled glitch slices

**What it does:** Repositions a small set of horizontal slices from a cached text bitmap. **When to use it:** Brief accent moments in a title treatment, not continuous high-frequency flicker or essential instructional copy.

```js
function patternGlitch(ctx, cache, width, height, slices) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(cache, 0, 0, width, height);
  for (const s of slices) {
    ctx.drawImage(cache, 0, s.y, width, s.h, s.dx, s.y, width, s.h);
  }
}
```

Clamp slice values, limit their count, and make the still state the default when reduced motion is enabled. Reuse a cached source rather than rasterizing the text again for each slice.

### Pattern 7 — Soft shadow with separate sharp pass

**What it does:** Builds depth using a subtle shadow pass beneath a clean foreground. **When to use it:** Text over a visually noisy image where modest separation is needed without a large neon glow.

```js
function patternSoftShadow(ctx, text, x, y) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillText(text, x, y);
  ctx.restore();
}
```

A shadow improves separation but does not guarantee contrast. Test the lightest and darkest parts of the background, and consider a stable backing surface when contrast cannot be guaranteed.

### Pattern 8 — Cached static title with animated accent

**What it does:** Renders the expensive base title once and updates only a small accent layer. **When to use it:** A title whose glyph shape is static while a light sweep, underline, or accent color moves.

```js
function drawAccentFrame(ctx, titleCache, width, height, x) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(titleCache, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(x - 30, 0, x + 30, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
```

The cache and accent layer need matching dimensions and alpha. Invalidate the title cache after font, content, or layout changes, but not on every accent frame.

## 22. Mistakes and fixes

| Mistake | Observable symptom | Unique fix |
|---|---|---|
| A. Measuring before the web font loads | Layout jumps when the intended face appears | Await the required font load, then recompute metrics and cached layers. |
| B. Treating `measureText().width` as painted bounds | Italic edges or accents are clipped | Include actual bounding-box metrics and extra effect padding. |
| C. Scaling coordinates and the context by DPR | Text appears too large or displaced | Choose CSS-pixel coordinates and apply the DPR transform exactly once. |
| D. Forgetting resize resets context state | Font and shadow settings unexpectedly revert | Reapply the complete context configuration after assigning bitmap dimensions. |
| E. Leaving a shadow enabled | Later labels glow unintentionally | Isolate each draw pass with `save()` and `restore()`. |
| F. Using fixed frame increments | Animation speed differs across displays | Compute movement from elapsed time in seconds. |
| G. Running the loop while hidden | Battery drain and unnecessary CPU use | Suspend scheduling on page visibility changes and resume deliberately. |
| H. Drawing decorative words only in Canvas | Screen readers miss the headline | Keep semantic copy in HTML and mark only the decorative canvas hidden. |
| I. Splitting every UTF-16 code unit | Emoji and combined letters break apart | Segment graphemes or constrain per-character effects to supported text. |
| J. Assuming word wrapping is built in | Long titles run beyond the canvas | Measure and wrap lines explicitly or keep copy in DOM layout. |
| K. Using blur as the only contrast treatment | Text disappears on bright regions | Add a stable backing treatment or change the foreground color. |
| L. Rebuilding a glow cache every frame | High CPU use and memory churn | Cache by the full rendering configuration and rebuild only on invalidation. |
| M. Calling `getImageData()` on the full scene repeatedly | Frame time spikes | Limit pixel reads to small regions or replace them with geometric effects. |
| N. Forgetting mask compositing direction | Image layer becomes fully transparent | Test source/destination alpha semantics on a small isolated canvas. |
| O. Using unbounded glitch slices | Visual noise overwhelms content | Clamp slice count and dimensions and use deterministic parameters. |
| P. Ignoring localized text length | Text overflows in another language | Test longest localized strings and prefer DOM wrapping for general copy. |
| Q. Reusing a cache after font changes | Old glyph shapes remain visible | Include font identity and dimensions in the cache invalidation key. |
| R. Setting only CSS canvas dimensions | Text looks soft on high-DPI displays | Scale the backing bitmap and transform the context for the selected DPR. |
| S. Allowing overlapping animation loops | Flicker and duplicated rendering work | Give one lifecycle owner responsibility for starting and stopping the scheduler. |
| T. Animating while reduced motion is requested | Decorative motion ignores user preference | Render a still composition and gate all animation entry points on the preference. |
| U. Depending on a nonstandard text property | Letter spacing silently differs by browser | Feature-detect optional capabilities and use a documented tracked-text fallback. |
| V. Drawing a thick stroke on small type | Counters close and characters become ambiguous | Reduce line width relative to the font size or remove the stroke at small breakpoints. |
| W. Ignoring color emoji and glyph fallback | Different systems show different text widths | Test the actual glyph set and reserve layout space for fallback differences. |
| X. Creating observers without cleanup | Repeated mounts accumulate callbacks | Disconnect observers and remove listeners in the component teardown path. |
| Y. Caching a clipped shadow | Glow is cut off at the canvas edge | Expand the offscreen bounds by measured shadow and blur padding. |
| Z. Comparing screenshots pixel-for-pixel across OSes | Flaky visual regression tests | Use tolerance-based comparisons and assert layout invariants separately. |

## 23. Gotchas worth remembering

- **Gotcha:** A font may be loaded but still lack a glyph. The browser can fall back for only that character, changing its width and baseline. Test the real copy, not only the alphabet.
- **Gotcha:** `canvas.width = canvas.width` clears the bitmap and resets drawing state. Reconfigure the context immediately after resizing.
- **Gotcha:** A shadow can be clipped even when the glyph itself fits. Allocate extra bounds for offset and blur; do not assume the browser expands the canvas for you.
- **Gotcha:** `destination-in` retains destination pixels where the source alpha exists. If the source and destination are reversed, the image-mask result can become empty.
- **Gotcha:** The HTML heading and decorative canvas can drift when they use different font stacks, line breaks, or width rules. Share layout inputs where possible and test after fonts load.
- **Gotcha:** `Intl.Segmenter` supports grapheme segmentation in modern browsers, but per-grapheme drawing still does not reproduce all shaping and bidi behavior.
- **Gotcha:** DPR is a rendering-quality choice with a memory and fill-rate cost. Cap it intentionally and profile on mobile devices.
- **Gotcha:** Reduced-motion logic can be defeated if a pointer or resize callback starts an animation unconditionally. Centralize the decision to run.

## 24. Mental models for implementation decisions

1. **The DOM is the source of meaning.** Canvas can decorate a heading, but the semantic heading remains the source of truth for assistive technology, search, selection, and localization.
2. **A canvas is a bitmap with a drawing API.** It will not automatically reflow, preserve glyph objects, or update after a font changes; the application must do those jobs.
3. **Metrics are not pixels.** Advance width is useful for cursor movement, while painted bounds are needed for clipping and effect padding.
4. **Font loading is part of layout.** The intended font must be available before measurements and caches are considered final.
5. **Every visual pass spends budget.** Glow, stroke, shadow, clipping, and compositing are additive costs; remove a pass before micro-optimizing a loop.
6. **A cache is a promise about inputs.** It is correct only while every value that affects the pixels remains unchanged.
7. **One scheduler owns time.** A scene should have one animation lifecycle, not one loop per layer or event handler.
8. **Responsive means re-layout, not only scale.** A canvas may need new line breaks and font sizes when its container changes.
9. **Accessibility is a parallel implementation.** Meaningful copy and controls belong in semantic HTML, not in an after-the-fact canvas label.
10. **Reduced motion is a complete design state.** The still composition should look intentional, readable, and branded.
11. **Determinism makes debugging possible.** Freeze time and random inputs when reproducing a visual regression.
12. **Profile the target device.** A desktop frame rate does not prove a mobile glow effect is affordable.

## 25. Quick reference

| Need | Preferred approach | Watch for | Verification |
|---|---|---|---|
| Wait for custom font | Font Loading API and `document.fonts.ready` | Fallback glyphs during early draw | Compare metrics before and after font readiness |
| Fit one-line title | Measure text and bound font-size search | Painted bounds and minimum readable size | Test longest string at narrow width |
| Wrap multiple lines | Explicit measured word wrapping | Language-specific line-breaking rules | Check line widths against container bounds |
| Align vertical text | Set `textBaseline` deliberately | Baseline is not the visual top edge | Draw a baseline guide in debug mode |
| Prevent clipped glow | Expand offscreen bounds | Shadow offset and blur extent | Test at every edge and DPR |
| Add outline | `strokeText()` then `fillText()` | Thick strokes close counters | Inspect smallest breakpoint |
| Add gradient | `createLinearGradient()` as fill style | Gradient bounds and contrast | Test color stops over the real background |
| Add neon effect | Glow pass plus crisp pass | Rasterization and blur cost | Profile with actual font and DPR |
| Reveal image through text | Offscreen alpha compositing | Source/destination order | Test a small sample before full canvas |
| Animate a title | One `requestAnimationFrame` loop | Delta-time spikes and cleanup | Compare motion at 60 Hz and 120 Hz |
| Support reduced motion | Still state and centralized gate | Another handler restarting motion | Test preference at mount and after change |
| Track letters | Grapheme-aware segmentation | Shaping and bidi limitations | Test accents, emoji, and localized strings |
| Create a glitch | Cached bitmap and bounded slices | Excessive flicker or unbounded work | Verify deterministic still mode |
| Improve sharpness | DPR-scaled backing bitmap | Memory and fill-rate cost | Inspect on high-DPI mobile device |
| Reduce repeated work | Cache metrics and static layers | Stale cache after font changes | Change each cache input individually |
| Diagnose blurry text | Check CSS size, bitmap size, transform | Double-scaling | Log width, height, and DPR values |
| Diagnose unexpected glow | Inspect state and compositing order | Leaked shadow or alpha | Disable one pass at a time |
| Keep copy accessible | Semantic HTML heading | Canvas-only content | Inspect accessibility tree with canvas hidden |
| Test visual output | Stable font and frozen animation | OS rasterization differences | Use tolerant snapshots plus layout assertions |
| Avoid hidden work | Pause when hidden or offscreen | Duplicate observers and loops | Confirm frame count stops when hidden |

## 26. Build challenge: responsive kinetic headline system

Build a reusable component called **KineticHeadline**. It should render a semantic HTML heading and a decorative Canvas layer that supports an outlined title, a gradient title, and a restrained animated accent. It must remain readable and correctly laid out when the font loads late, when the container resizes, when the text is long, and when reduced motion is enabled. The challenge is intentionally about lifecycle and failure handling as much as the visual effect.

### Requirements

1. Create a semantic `<h1>` or `<h2>` whose text is the authoritative copy.
2. Mark the decorative canvas `aria-hidden="true"` and ensure it does not intercept pointer input.
3. Wait for the chosen web font before calculating final metrics and caches.
4. Provide a documented fallback font and render a usable initial state while the custom font loads.
5. Size the backing bitmap using a deliberate DPR policy while drawing in CSS-pixel coordinates.
6. Reapply all required context state after resizing the bitmap.
7. Measure text and include painted-bound padding so accents and shadows are not clipped.
8. Support a short title and a title at least twice as long without drawing outside the container.
9. Implement at least two visual patterns from the pattern catalog.
10. Keep static text rendering separate from animated state updates.
11. Use one animation scheduler and clamp large elapsed-time values.
12. Stop or simplify animation when `prefers-reduced-motion: reduce` is active.
13. Pause unnecessary work while the document is hidden.
14. Observe the component container and recompute layout when its width changes.
15. Invalidate caches when text, font, size, DPR, or effect configuration changes.
16. Include a debug mode that draws baselines and approximate bounds.
17. Handle a failed font load without blanking the heading or throwing an unhandled error.
18. Verify contrast against the lightest and darkest background regions used by the page.
19. Include a teardown function that cancels animation and disconnects observers and listeners.
20. Test keyboard and screen-reader access to the actual heading with the canvas disabled.
21. Test a high-DPI viewport and a narrow mobile viewport.
22. Test non-ASCII text and explicitly document any limitations in per-character effects.
23. Record a performance profile with glow enabled and disabled on a representative target device.
24. Demonstrate that no animation loop or observer remains after the component is removed.

### Suggested architecture

Keep the component split into small responsibilities: `loadFont()`, `measureLayout()`, `resizeBackingStore()`, `renderStaticLayer()`, `drawFrame()`, `startLoop()`, `stopLoop()`, `applyMotionPreference()`, and `dispose()`. Use a configuration object for the text, font, color palette, effect choice, maximum width, and DPR cap. Avoid coupling the animation loop to framework render cycles; a state change should update the configuration and invalidate only the affected work.

```js
function createKineticHeadlineController({ canvas, container, text, font }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  let disposed = false;
  let frameId = 0;
  let layout = null;

  function drawStatic() {
    if (disposed || !layout) return;
    ctx.clearRect(0, 0, layout.width, layout.height);
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText(text, layout.width / 2, layout.height / 2);
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  }

  async function init() {
    try { await document.fonts.load(font); }
    catch (error) { console.warn('Using fallback font.', error); }
    if (disposed) return;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(rect.width * dpr);
    canvas.height = Math.ceil(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout = { width: rect.width, height: rect.height, dpr };
    drawStatic();
  }

  function dispose() {
    disposed = true;
    stop();
  }

  return { init, drawStatic, stop, dispose };
}
```

This is a starting skeleton, not the complete challenge solution: it intentionally omits the `ResizeObserver`, preference listener, animation state, cache invalidation, robust fallback metrics, and listener cleanup. Complete those responsibilities before treating the component as production-ready. In particular, ensure the font shorthand remains valid, fallback font selection is explicit, and all observers and event listeners are disconnected in `dispose()`.

### Definition of done

- [ ] The HTML heading communicates the exact title when the canvas is hidden or unsupported.
- [ ] The custom font is used when available, and a stable fallback remains when it fails.
- [ ] No title glyph, stroke, or shadow is accidentally clipped at the supported breakpoints.
- [ ] The effect stays aligned after container resizing and device-pixel-ratio changes.
- [ ] The design remains legible with the glow disabled and at the narrowest supported width.
- [ ] Reduced-motion mode shows a deliberate static composition and schedules no decorative frames.
- [ ] Hidden-tab behavior does not cause a large time jump on resume.
- [ ] The effect does not create a new animation loop during resize or preference changes.
- [ ] Cache invalidation occurs for all pixel-affecting inputs and not for unrelated state.
- [ ] A failed-font test, long-string test, and high-DPI test pass.
- [ ] Screen-reader testing finds one meaningful heading rather than duplicate canvas text.
- [ ] A representative mobile performance profile is recorded and expensive passes have a documented budget.
- [ ] Teardown cancels frames, disconnects observers, removes listeners, and releases cache references.
- [ ] Debug overlays can reveal baseline, bounds, and clipping problems without changing production output.
- [ ] The implementation documents any script-shaping or older-browser limitations.

## Final implementation checklist

Before shipping, inspect the font lifecycle, coordinate system, visible glyph bounds, and cache invalidation path. Verify that the context state is fully configured for each independent pass. Test the longest string, a missing font, high DPR, a narrow container, a hidden tab, and reduced-motion mode. Check the semantic heading with the canvas disabled. Profile the effect on a representative mobile device and remove any effect pass that does not earn its cost.

Canvas text effects are most successful when the typography remains readable and the engineering remains invisible. Use the Canvas API for the parts that genuinely need pixel-level art direction; use HTML and CSS for meaning, responsive text flow, and robust accessibility. A small, stable effect that survives real content and real devices is better than a spectacular effect that only works in one screenshot.
