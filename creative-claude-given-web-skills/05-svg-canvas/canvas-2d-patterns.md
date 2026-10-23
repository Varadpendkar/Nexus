# Canvas 2D Patterns — Production Skill Guide

## Why This Matters

The Canvas 2D API gives a browser a mutable pixel surface and a drawing context. It is a good fit for generative illustrations, data-driven visuals, particle fields, image processing, custom charts, drawing tools, game-like scenes, and effects that change many pixels or shapes on every frame. Canvas is not a magic performance upgrade over the DOM or SVG. It trades an inspectable element tree for a bitmap-oriented drawing model, and it places more responsibility on the application: state, hit testing, resizing, redraw scheduling, accessibility, text alternatives, and lifecycle management become explicit engineering concerns.

A canvas that looks correct in a static screenshot can still be broken in production. It may appear blurry on a Retina display, stretch when its CSS dimensions change, erase itself when a component re-renders, leak animation frames after navigation, render a thousand shadows at 60 frames per second, or become unusable to keyboard and screen-reader users. It may also draw a scene using stale dimensions because the backing bitmap and displayed rectangle disagree. These problems are rarely solved by adding more drawing commands. They are solved by choosing a clear rendering model, keeping state authoritative, separating update and draw work, measuring cost, and designing a fallback for the visual information that pixels alone cannot expose.

This guide treats Canvas 2D as a small rendering system rather than a sequence of ad hoc calls. It provides reusable patterns for coordinate systems, high-DPI scaling, animation, scene organization, paths, compositing, image handling, text, input, performance, accessibility, testing, and browser compatibility. The aim is not simply to make a canvas draw; it is to make the drawing deterministic, maintainable, responsive, and safe to ship.

## Scope and Non-Goals

This skill covers the Canvas 2D context, canvas sizing, coordinate transforms, high-DPI rendering, paths, state isolation, drawing helpers, image loading, text layout, compositing, clipping, animation loops, input mapping, resize handling, dirty-region rendering, caching, worker boundaries, debugging, accessibility, and production validation.

It does not attempt to replace a full game engine, WebGL/WebGPU, SVG authoring, or a charting library. Prefer semantic HTML for ordinary interface controls and text. Prefer SVG when individual vector elements need DOM semantics, independent styling, or scalable path animation. Prefer CSS for straightforward layout and transitions. Consider WebGL or WebGPU when the scene requires shader-based effects or very large numbers of GPU-oriented primitives. Canvas is strongest when a scene is naturally drawn as a unified surface and its rendering workload is easier to manage as pixels than as thousands of DOM nodes.

## The Canvas Mental Model

Canvas has two sizes: the CSS display size and the bitmap backing-store size. Drawing commands operate in the bitmap's coordinate system, modified by the current transformation matrix. CSS determines how the bitmap is displayed on the page. If the bitmap is 300 by 150 pixels but CSS stretches it to 600 by 300 CSS pixels, the browser scales the existing pixels rather than creating new detail. On high-density displays, the backing store often needs more pixels than the CSS rectangle to avoid blur.

The context also has mutable state. Fill and stroke styles, alpha, transforms, clipping regions, compositing modes, line properties, shadows, and text settings can persist between calls. Every drawing helper should therefore have a clear contract: which state it reads, which state it changes, and whether it restores that state. The safest general pattern is to use `save()` and `restore()` around isolated transformations or styles, while avoiding unnecessary state churn in extremely hot loops after profiling proves it matters.

Finally, canvas does not retain a semantic scene graph for you. After drawing a circle, the browser does not know it is a button, what label it should expose, or which object should receive a pointer event. Your application must keep the model, render the model, and map interaction back to that model. Treat the canvas as a projection of state—not as the source of truth.

## Core Concepts

### 1. Choose Canvas Only When Its Rendering Model Fits

```html
<section aria-labelledby="plot-heading">
  <h2 id="plot-heading">Monthly activity</h2>
  <canvas id="activity-plot" role="img" aria-label="Monthly activity trend; equivalent values follow in the table">
    Monthly activity trend. See the data table below for exact values.
  </canvas>
  <table><caption>Monthly activity values</caption><thead><tr><th scope="col">Month</th><th scope="col">Count</th></tr></thead><tbody><tr><th scope="row">January</th><td>42</td></tr></tbody></table>
</section>
```


Canvas is useful when a visual contains many primitives that change together, when per-frame drawing is central, or when pixels are the natural output. It is not automatically the best choice for a hero illustration containing a handful of paths, an icon, a text heading, and a button. SVG and HTML provide useful structure, browser-managed hit testing, and more direct accessibility hooks. Rebuilding those capabilities manually in canvas can make a simple task needlessly expensive.

Before choosing canvas, write down the actual workload: approximate number of objects, update frequency, interaction needs, text requirements, expected viewport size, and accessibility expectations. A static map with a few hundred points may be better as SVG or a tiled image. A particle field with thousands of moving dots may suit canvas. A chart that needs keyboard navigation, labels, tooltips, and exportable data may use canvas for plotting but keep its legend, controls, and data table in semantic HTML.

Do not decide based on a benchmark that compares unrelated examples. Measure a representative scene on target devices. A canvas with one enormous blur can be slower than a modest DOM scene, while a canvas with many simple fills may outperform thousands of independently styled nodes. The right decision follows the workload and product requirements, not a rule that one technology is always faster.

**Decision checklist:**

- Is the scene naturally drawn as one surface?
- Will many objects update frequently?
- Can semantics and controls live in accessible HTML around the canvas?
- Is hit testing simple enough to implement correctly?
- Can the team own resizing, rendering, and cleanup logic?
- Is the expected device range known and testable?

If several answers are no, start with HTML or SVG and introduce canvas only where its strengths matter.

### 2. Keep CSS Size and Bitmap Size Separate

The `width` and `height` attributes define the canvas bitmap dimensions. CSS `width` and `height` define the displayed rectangle. They should be coordinated deliberately. If only CSS dimensions change, the browser stretches the old bitmap. If only the attributes change, the displayed size may change due to the canvas element's intrinsic dimensions. If attributes are reassigned, the bitmap is cleared and context state returns to defaults, so sizing is also a lifecycle operation.

A reliable component stores logical width and height in CSS pixels, calculates a backing-store scale, and sets the bitmap dimensions to the logical dimensions multiplied by that scale. The drawing code can then continue to use logical coordinates. Avoid sprinkling physical-pixel calculations through every drawing function; centralize the transform during resize.

```js
function configureCanvas(canvas, ctx, cssWidth, cssHeight, dpr = window.devicePixelRatio || 1) {
  const scale = Math.max(1, dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * scale);
  canvas.height = Math.round(cssHeight * scale);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  return { width: cssWidth, height: cssHeight, scale };
}
```

This pattern assumes the caller owns the canvas's CSS size and is not also applying an independent CSS transform. If CSS transforms are part of the design, pointer mapping must account for the transformed client rectangle, and the backing-store scale must still be based on the intended logical size. Do not use `ctx.scale()` repeatedly during every resize without resetting the transform; repeated calls multiply the scale and cause drawing coordinates to drift. Prefer `setTransform()` when establishing the canonical logical coordinate system.

### 3. Treat Device Pixel Ratio as a Budget

```js
function chooseRenderScale(devicePixelRatio, maxScale = 2) {
  const dpr = Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1;
  return Math.min(Math.max(dpr, 1), maxScale);
}
console.table([{ dpr: window.devicePixelRatio || 1, selectedScale: chooseRenderScale(window.devicePixelRatio || 1) }]);
```


A device pixel ratio (DPR) of 2 means a logical 500 by 300 CSS-pixel canvas may use a 1000 by 600 bitmap. That is four times as many pixels, not two times as many. At DPR 3, the pixel count can be nine times larger. This improves sharpness but increases memory use, clearing cost, fill work, and the size of intermediate effects.

DPR is not a command to use the maximum value at all costs. On large decorative backgrounds, a capped DPR can be a sensible quality-performance tradeoff. For example, a dense animated scene may use `Math.min(devicePixelRatio, 2)` while static typography or a small chart uses the full DPR. Choose caps based on visual testing and measurements, not guesswork. Make the cap configurable if the same renderer serves both high-detail and low-power modes.

The DPR may change when a window moves between displays, browser zoom changes, or display settings change. A `ResizeObserver` reports element size changes, but it does not guarantee that every DPR change will be represented as a size change. If crispness is essential, compare the current DPR during a controlled resize or use a resolution media query strategy and reconfigure when it changes. Always avoid allocating an enormous backing store for a canvas that is mostly offscreen or larger than the product needs.

**Production rule:** expose the selected DPR and logical dimensions in debug diagnostics. If the image looks blurry, verify the bitmap dimensions first. If memory or rendering time spikes, inspect the pixel count before optimizing individual draw calls.

### 4. Define a Canonical Coordinate System

A useful renderer separates logical scene coordinates from the canvas's backing pixels. The scene may use CSS-pixel units, normalized coordinates from zero to one, world coordinates for a zoomable map, or a local coordinate system for an object. Pick one primary system and define conversions at the boundary. A canvas drawing helper should not sometimes expect device pixels, sometimes CSS pixels, and sometimes percentages without making that contract explicit.

For a responsive scene, one common approach is to use logical CSS pixels and redraw after resize. Another is to define a fixed design coordinate system and apply a transform to fit it inside the canvas. The first gives elements a stable apparent size; the second preserves a composition's proportions. A chart may prefer a logical plot area with margins; a game-like world may need world coordinates and a camera transform.

```js
function fitDesignSpace(ctx, designWidth, designHeight, viewWidth, viewHeight) {
  const scale = Math.min(viewWidth / designWidth, viewHeight / designHeight);
  const offsetX = (viewWidth - designWidth * scale) / 2;
  const offsetY = (viewHeight - designHeight * scale) / 2;
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  return { scale, offsetX, offsetY };
}
```

This preserves the design's aspect ratio and letterboxes unused space. If cropping is preferred, use the maximum scale instead and document which edges may be clipped. Coordinate transforms are cumulative mutable state, so establish them at the start of a frame or inside a saved state. Do not combine a fitting transform with DPR scaling accidentally: a common sequence is to set the backing store, apply DPR as the base transform, then compose the design-space transform in a deliberate order.

### 5. Isolate Mutable Context State

The Canvas 2D context is stateful. A helper that sets `globalAlpha = 0.3` can accidentally make every later shape translucent if it fails to restore the previous value. A helper that clips to a rounded rectangle can hide all subsequent drawing if the clip is not contained in a saved/restored state. Transform leakage is especially hard to spot because the later drawing commands remain valid but appear at unexpected coordinates.

Use `ctx.save()` before local changes and `ctx.restore()` afterward. Keep the scope narrow, so reviewers can see exactly which state is protected. A useful pattern is to make each object renderer responsible for its own state and have it restore before returning. Avoid assuming `restore()` resets to a global default; it restores the most recent saved state. A mismatched save/restore pair can be as dangerous as no isolation at all.

```js
function drawFadedMarker(ctx, x, y, radius, alpha) {
  ctx.save();
  try {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  } finally {
    ctx.restore();
  }
}
```

The `try/finally` is useful when helper logic may throw; in a very hot loop, measure whether this overhead matters before adding complexity. The key is a clear state contract. For performance-sensitive renderers, it may be better to set known state once per batch, but that optimization should be explicit and tested. Never rely on incidental state left by a previous object.

### 6. Use Paths as Explicit Geometry

A path is a sequence of subpaths created by commands such as `moveTo`, `lineTo`, `arc`, `quadraticCurveTo`, `bezierCurveTo`, and `closePath`. Calling `beginPath()` before constructing a new independent shape avoids unintentionally appending to the current path. `fill()` and `stroke()` act on the current path; they do not automatically start a new one. A forgotten `beginPath()` is a common reason shapes unexpectedly connect or a stroke repeats older geometry.

Keep geometry creation separate from styling where possible. A function that constructs a path can be reused with multiple fill colors, stroke widths, or clipping operations. For repeated static geometry, `Path2D` can make the intent clearer and may allow the browser to reuse path data. It is not guaranteed to be faster in every engine or workload, so profile before treating it as an optimization.

```js
const roundedDiamond = new Path2D();
roundedDiamond.moveTo(40, 0);
roundedDiamond.lineTo(80, 40);
roundedDiamond.lineTo(40, 80);
roundedDiamond.lineTo(0, 40);
roundedDiamond.closePath();

function drawDiamond(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.fill(roundedDiamond);
  ctx.restore();
}
```

Remember that a path is geometric, not semantic. If a drawn diamond represents a selectable option, its label and keyboard-accessible interaction need to exist elsewhere in the interface. For complex path-based hit testing, use `isPointInPath()` with coordinates transformed into the correct space, or implement geometric hit regions that match the interaction design.

### 7. Build a Small Scene Model

A canvas project becomes hard to maintain when data, input, animation, and drawing all live in one large function. Keep a model that describes what should exist, a renderer that projects that model into pixels, and an update function that changes the model over time. The model can be plain objects, typed arrays, or domain-specific data structures. Choose the simplest structure that meets the scale and debugging requirements.

For example, a chart model might store series, values, scales, hover state, and selection. A particle model might store position, velocity, radius, and life. The draw function should read the model without silently changing business state. The update function should not issue drawing commands. This separation makes it possible to redraw after resize, export a static frame, run deterministic tests, or change rendering style without rewriting input handling.

A useful top-level structure is:

```js
const scene = {
  width: 0,
  height: 0,
  objects: [],
  pointer: { x: 0, y: 0, inside: false },
  dirty: true,
};

function updateScene(scene, deltaSeconds) {
  // Update model state only.
}

function renderScene(ctx, scene) {
  // Draw the current model only.
}
```

Do not over-engineer a miniature entity-component-system for a simple chart. The point is to establish boundaries, not to create an abstraction framework. Introduce a scene graph, object classes, spatial index, or typed-array representation only when it solves a demonstrated problem. Keep object identity stable where interaction refers to objects, and keep data separate from temporary rendering caches.

### 8. Make Redraw Scheduling Intentional

A canvas does not need to redraw continuously just because it can. A static illustration should draw when its data, dimensions, or style changes. A live animation should use `requestAnimationFrame()` and schedule the next frame only while work is required. A dashboard that updates once per second should not burn CPU repainting at 60 frames per second between updates.

Use a clear invalidation model: state changes mark the scene dirty; one scheduled render consumes that dirty flag. This coalesces multiple changes in the same event cycle into a single draw. For continuous animation, a frame loop can update and render on each frame. For mostly static scenes, a `requestRender()` helper can schedule a single frame and skip duplicates.

```js
let frameId = null;
let dirty = true;

function requestRender() {
  dirty = true;
  if (frameId !== null) return;
  frameId = requestAnimationFrame(() => {
    frameId = null;
    if (!dirty) return;
    dirty = false;
    render();
  });
}
```

This pattern is appropriate for invalidation-driven drawing. Do not combine it blindly with a continuous loop that already schedules every frame; choose one scheduling strategy or define how they interact. Cancel pending frames during teardown. If the page becomes hidden, consider pausing continuous animation or reducing its cadence. If rendering depends on elapsed time, calculate it from timestamps rather than assuming every frame arrives at exactly 16.67 milliseconds.

### 9. Use Delta Time, Not Frame Counts

An animation that moves an object by two pixels per frame runs at different speeds on displays with different refresh rates and on devices that miss frames. Instead, express motion in units per second and multiply by elapsed time. If velocity is 120 CSS pixels per second, a frame with a delta of 0.016 seconds advances approximately 1.92 pixels. This makes the intended speed independent of nominal frame rate.

Browsers can pause or throttle frames when a tab is hidden or a device is under load. When the page resumes, the time delta may be very large. For simulations, clamp the delta or use a fixed-step accumulator so one delayed frame does not move an object through a wall or explode a particle simulation. For visual transitions, using absolute elapsed time from a start timestamp can be simpler and more deterministic than accumulating tiny deltas indefinitely.

```js
let previousTime = null;

function frame(now) {
  if (previousTime === null) previousTime = now;
  const rawDelta = (now - previousTime) / 1000;
  const delta = Math.min(rawDelta, 0.05);
  previousTime = now;
  updateScene(scene, delta);
  renderScene(ctx, scene);
  frameId = requestAnimationFrame(frame);
}
```

The 50-millisecond clamp is an example, not a universal constant. A physics simulation may use a fixed step and multiple catch-up updates. A decorative float animation may not need simulation at all; it can compute its position from time and an easing function. Decide what time model the visual needs, then test on a throttled device and after switching tabs.

### 10. Clear the Surface Correctly

A common full-frame pattern is to clear the entire backing store before drawing. If the context has a transform that maps logical coordinates to backing pixels, `clearRect(0, 0, canvas.width, canvas.height)` may clear the wrong area because those arguments are transformed. Either temporarily reset the transform to identity for a full-bitmap clear, or clear the logical viewport using its logical dimensions under the known transform. Make the approach consistent.

`clearRect()` makes pixels transparent; it does not paint the background color. If the canvas needs an opaque background, fill a rectangle with the intended color after clearing, or use the `alpha: false` context option when the surface is guaranteed to be opaque and transparency is unnecessary. The latter can sometimes help browser optimizations, but it changes behavior: clearing may reveal an opaque default background rather than transparency, so only use it when the design allows it.

```js
function clearLogicalCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

function paintBackground(ctx, width, height, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
```

If old pixels remain, inspect whether you are clearing the full intended region, whether transforms are active, and whether the draw loop is actually running. If the whole canvas turns black or opaque unexpectedly, inspect the context alpha option and compositing state. A full clear and redraw is often the simplest correct approach; partial redraw should be added only when profiling demonstrates that drawing the whole scene is too expensive.

### 11. Resize from the Element, Not Just the Window

A canvas can change size when a sidebar opens, a grid column changes, a parent container animates, or a font loads—not only when the window resizes. `ResizeObserver` is usually a better fit for observing the canvas container or the canvas itself. Use its reported content dimensions as the logical viewport, then reconfigure the bitmap and redraw. Avoid reading layout repeatedly in the render loop; measure on resize and store the result.

Resizing the bitmap clears it and resets context state. Your resize handler must therefore restore the DPR transform and any other base configuration. Treat resize as a full renderer reconfiguration, not as a cosmetic CSS update. If the canvas is sized from its own intrinsic dimensions, be careful to avoid feedback loops where changing the bitmap changes the measured layout size. A stable parent container with CSS-defined dimensions is often simpler.

```js
const observer = new ResizeObserver((entries) => {
  const entry = entries[0];
  if (!entry) return;
  const { width, height } = entry.contentRect;
  configureCanvas(canvas, ctx, width, height);
  scene.width = width;
  scene.height = height;
  requestRender();
});
observer.observe(canvas.parentElement);
```

The sample assumes a nonzero content box and that `configureCanvas()` owns the canvas's dimensions. In a real component, guard against zero width or height during hidden layout states, disconnect the observer on teardown, and handle DPR changes where sharpness matters. Do not resize the backing bitmap every frame; that clears the surface and reallocates pixel storage, which can create visible flicker and significant work.

### 12. Map Pointer Coordinates Through the Display Rectangle

Pointer events report client coordinates, while drawing code usually uses logical canvas coordinates. A simple mapping subtracts the canvas's bounding rectangle origin and scales the result by the ratio between logical dimensions and the rectangle dimensions. Do not assume `offsetX` is always appropriate: nested elements, CSS transforms, and event retargeting can make it misleading. Use a deliberate mapping function and test it with borders, scaling, and high-DPI backing stores.

```js
function pointerToCanvas(event, canvas, logicalWidth, logicalHeight) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    x: (event.clientX - rect.left) * (logicalWidth / rect.width),
    y: (event.clientY - rect.top) * (logicalHeight / rect.height),
  };
}
```

This works when the canvas's displayed rectangle is axis-aligned and the logical scene maps uniformly to that rectangle. If the canvas is rotated or skewed with CSS, bounding-rectangle scaling alone is insufficient; you need the inverse transform or should avoid applying such transforms to an interactive canvas. If the renderer letterboxes a design coordinate system, also invert that fit transform and reject points outside the design's active region.

Prefer Pointer Events for a unified mouse, pen, and touch input model. Use pointer capture for drags that should continue when the pointer leaves the canvas, and handle `pointercancel` as well as `pointerup`. Do not rely exclusively on hover because touch devices do not have a persistent hover state. The coordinate conversion is a boundary function: keep it separate from hit testing and business actions.

### 13. Hit-Test Against the Model

```js
function hitTestCircle(point, circle) {
  const dx = point.x - circle.x;
  const dy = point.y - circle.y;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

function findTopmostHit(point, objects) {
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    if (objects[i].hitTest(point)) return objects[i];
  }
  return null;
}
```


Canvas does not automatically dispatch events to the shapes you drew. You must decide which object is under a pointer and what action should occur. For simple scenes, test circles by distance, rectangles by bounds, and ordered shapes from front to back. For complex paths, `isPointInPath()` and `isPointInStroke()` can help, but their coordinate assumptions must match the current transform and the geometry used for rendering.

Hit regions should reflect the product's interaction rules, not only the visible pixels. A thin line may need a larger invisible target. A chart's hover region may be the whole data point column rather than the tiny marker. Overlapping shapes need an explicit z-order rule so the result is deterministic. If the scene contains many objects, a spatial index or coarse grid can reduce the number of candidates tested per pointer event.

Keep keyboard interaction separate from pointer hit testing. If an object is selectable, provide a corresponding focusable HTML control, keyboard navigation model, or accessible list. A canvas can be focusable, but that alone does not expose its individual drawn objects to assistive technology. For a chart, for example, a nearby table or keyboard-driven data-point navigation is often more useful than attempting to make pixels announce themselves.

### 14. Use Compositing Deliberately

```js
function drawGlow(ctx, drawShape) {
  ctx.save();
  try {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.18;
    ctx.shadowColor = "#60a5fa";
    ctx.shadowBlur = 18;
    drawShape(ctx);
  } finally {
    ctx.restore();
  }
}
```


The `globalCompositeOperation` property controls how new pixels combine with existing pixels. The default `source-over` is the expected painter's order: later drawing appears over earlier drawing. Modes such as `multiply`, `screen`, `lighter`, `destination-out`, and `source-in` enable effects including glows, cutouts, erasing, and layered textures. These modes operate on pixels and alpha, so the result depends on drawing order and existing surface contents.

Use `save()` and `restore()` around non-default composite modes so one effect does not change subsequent objects. `destination-out` can erase pixels from earlier drawing, which is useful for an eraser tool or cutout effect, but it can also accidentally erase an entire scene if the source shape or alpha is larger than intended. Blend modes may differ in visual nuance across color spaces and browser implementations; test the actual effect, especially when brand colors or contrast are important.

A useful named pattern is **glow accumulation**: draw a soft, low-opacity shape with `lighter`, then draw the crisp source shape with `source-over`. This can create a luminous impression, but multiple overlapping glows can wash out the scene and increase overdraw. Another pattern is **eraser pass**: draw the scene, then use `destination-out` only within a deliberately bounded path. Restore the default compositing state immediately afterward. Treat composite modes as part of an effect's contract, not as ambient global settings.

### 15. Clip Before Expensive Drawing

`clip()` restricts future drawing to the intersection of the current clipping region and the new path. It is useful for circular image crops, chart plot areas, viewport windows, and reveal effects. Because the clipping region is part of context state, it cannot be directly undone except by restoring a previously saved state. Always create a save/restore boundary around clipping operations.

Clipping does not necessarily mean the browser avoids all work outside the clip; the implementation and drawing operation matter. It is primarily a correctness tool and may help constrain rasterization in some cases, but do not assume it makes an expensive blur cheap. If the goal is to reduce work, also reduce the actual geometry, pixel area, or number of objects drawn.

```js
function drawCircularImage(ctx, image, x, y, diameter) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + diameter / 2, y + diameter / 2, diameter / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, x, y, diameter, diameter);
  ctx.restore();
}
```

The image should be loaded and decoded before this helper runs. For a reusable clip, make sure the clip path is recreated after each `beginPath()` and that the draw operation uses the intended coordinate space. A frequent bug is calling `clip()` on a path that unintentionally contains geometry from a previous object, causing a much larger or irregular region to remain visible.

### 16. Load and Decode Images Before Drawing

`drawImage()` requires a usable image source. If the image has not loaded, has failed, or has not been decoded, drawing may be skipped or produce unexpected timing behavior. Preload images used by a scene, listen for load/error outcomes, and use `HTMLImageElement.decode()` where supported and useful to reduce the chance of a decode pause during an animation. Provide a fallback when an image fails instead of leaving a blank area with no explanation.

CORS is a separate concern from display. An image can sometimes be drawn but taint the canvas, preventing pixel reads, exports, or `toBlob()` operations. If the product requires sampling or exporting, the image server must permit the relevant cross-origin access and the image must be requested with the correct `crossOrigin` mode before setting `src`. Setting `crossOrigin` after loading starts is too late. Do not promise that any public image URL can be safely sampled or exported.

```js
async function loadImage(url, { crossOrigin = 'anonymous' } = {}) {
  const image = new Image();
  if (crossOrigin) image.crossOrigin = crossOrigin;
  image.src = url;
  await image.decode();
  return image;
}
```

In production, catch decode failures, validate the URL and allowed source, and show a clear placeholder. For repeated use, cache decoded images instead of constructing new image objects for every frame. Avoid resizing the same image repeatedly with poor quality settings if a pre-scaled variant can be generated once. Use `imageSmoothingEnabled` and `imageSmoothingQuality` intentionally, but verify results on target browsers because quality settings are hints rather than a guarantee of identical pixels.

### 17. Treat Text as Layout, Not Just `fillText()`

```js
function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
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
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight, maxWidth));
  return lines.length;
}
```


Canvas text uses the context's font, alignment, baseline, direction, and letter-spacing-related capabilities where supported. Text may be clipped if you assume that the requested font has loaded or that the baseline aligns with the top of the text. Measure with `measureText()` when wrapping or aligning labels. For precise chart labels, account for ascent and descent metrics where available, but include fallbacks because metric support and font behavior can vary.

Canvas does not provide HTML-style automatic line wrapping. You need to break text into lines, decide how to handle long words, calculate line heights, and define truncation behavior. A reusable text layout helper should accept a maximum width, font configuration, line-height, and overflow strategy. Avoid measuring every string repeatedly in a hot frame; cache metrics when text and font settings are stable. Invalidate those caches when the font or relevant text changes.

Web fonts can load after the first draw. If the canvas draws with a fallback font and never redraws, the text may remain visually inconsistent with the rest of the interface. Listen for font readiness where appropriate and request a redraw after the intended font becomes available. For content that matters to users, do not make the canvas the only place where text exists. Put essential labels and values in semantic HTML or provide a synchronized accessible representation.

### 18. Choose Full Redraw or Dirty Regions by Measurement

```js
function unionBounds(a, b) {
  const left = Math.min(a.x, b.x);
  const top = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x: left, y: top, width: right - left, height: bottom - top };
}
```


A full clear and redraw is easy to reason about: every frame starts from a known state, z-order is consistent, and old pixels cannot remain accidentally. It is often the best starting point. Dirty-region rendering redraws only the parts of the canvas that changed, but it introduces complexity: the old and new bounds must be cleared, intersecting objects may need to be redrawn, shadows and filters expand bounds, and overlapping order must remain correct.

For a small interactive chart, full redraw may be fast enough. For a large drawing application or a scene with many static layers and a few moving objects, dirty regions can help. Before implementing them, measure frame time and identify whether draw cost is actually the bottleneck. A slow animation may instead be caused by image decoding, layout work, expensive shadows, too many pixels, or a scheduling bug.

If using dirty regions, store each object's previous bounds, calculate the union of old and new bounds, clear that region, and redraw every object that intersects it in the correct order. Add padding for stroke widths, shadows, antialiasing, and any blur radius. Do not just clear the moving object's old rectangle and draw its new rectangle if another object overlaps either region; that can erase pixels that should still exist. Keep a debug mode that outlines dirty rectangles so correctness can be inspected visually.

### 19. Cache Stable Work, but Avoid Stale Caches

```js
function makeCacheKey({ width, height, dpr, theme, dataVersion }) {
  return [width, height, dpr, theme, dataVersion].join(":");
}

function getOrCreateCache(cache, key, create) {
  if (!cache.has(key)) cache.set(key, create());
  return cache.get(key);
}
```


Offscreen canvases and pre-rendered layers can cache expensive static drawing. Examples include a background grid, a complex static illustration, a repeated texture, or a set of labels that changes infrequently. A cache is worthwhile when the cost of building it is amortized over many frames. If the cached image changes every frame or is used only once, cache management can cost more than direct drawing.

Define explicit cache invalidation keys: dimensions, DPR, theme, data version, font version, or any input that changes pixels. A resize usually invalidates a size-dependent cache. A dark-mode switch may invalidate a color-dependent cache. A loaded font can invalidate text layout. Without clear invalidation, cached visuals can remain stale while the model changes correctly.

For repeated sprites, an atlas or pre-rendered offscreen surface can reduce repeated path construction and style changes. Keep memory limits in mind: a large offscreen bitmap consumes memory proportional to pixel count and DPR squared. Release references when the cache is no longer needed. For a static canvas, consider rendering once and then drawing the result as an image into another scene, but remember that image sources can carry CORS restrictions if they originated outside the page's origin.

## Six Named Production Patterns

### Pattern A — Hi-DPI Logical Surface

```js
function setupLogicalSurface(canvas, ctx, width, height, dpr = Math.min(window.devicePixelRatio || 1, 2)) {
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
```


**Use when:** a canvas must remain crisp across normal and high-density displays while drawing code uses CSS-pixel coordinates.

**Implementation:** measure the logical display size, calculate a chosen DPR, set `canvas.width` and `canvas.height` to the scaled bitmap dimensions, and establish the logical transform with `setTransform(dpr, 0, 0, dpr, 0, 0)`. Store logical width and height in the scene. Reconfigure and redraw after a meaningful size or DPR change. Never multiply coordinates by DPR inside every draw helper if the context transform already handles it.

**Failure signals:** blurred text, doubled scaling after repeated resize, a canvas whose bitmap is far larger than its visible area, or pointer positions that are offset on Retina displays. Verify the bitmap dimensions, context transform, CSS rectangle, and pointer mapping separately.

### Pattern B — Invalidation-Driven Render

```js
let pendingRender = 0;
function invalidate() {
  if (pendingRender) return;
  pendingRender = requestAnimationFrame(() => {
    pendingRender = 0;
    renderScene(ctx, scene);
  });
}
```


**Use when:** the scene is mostly static and only needs to redraw after input, data, theme, or size changes.

**Implementation:** mark the scene dirty when relevant state changes, schedule at most one `requestAnimationFrame`, draw the current model, and clear the dirty flag. If another change occurs before the frame, the same scheduled render handles it. Cancel the pending frame when the component is destroyed.

**Failure signals:** unnecessary CPU use while idle, missed updates because a dirty flag was cleared too early, or multiple render callbacks scheduled for the same event burst. Add counters for requested and completed frames while debugging.

### Pattern C — Continuous Delta-Time Loop

```js
let rafId = 0;
let lastFrameTime = 0;
function tick(now) {
  const dt = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0;
  lastFrameTime = now;
  updateScene(scene, dt);
  renderScene(ctx, scene);
  rafId = requestAnimationFrame(tick);
}
function stopLoop() { cancelAnimationFrame(rafId); rafId = 0; }
```


**Use when:** objects move or an effect evolves continuously.

**Implementation:** receive the timestamp from `requestAnimationFrame`, calculate elapsed seconds, clamp or otherwise handle long pauses, update model state, render, then schedule the next frame. Pause when the document is hidden if the product does not need background progression. Keep the loop start/stop controls explicit.

**Failure signals:** motion speed changes with refresh rate, objects jump after returning to a tab, animation loops continue after navigation, or multiple loops run at once. Track the frame ID and loop state; use one owner for scheduling.

### Pattern D — Layered Static and Dynamic Surfaces

```js
const backgroundLayer = document.createElement("canvas");
const backgroundCtx = backgroundLayer.getContext("2d");
function rebuildBackground(width, height) {
  backgroundLayer.width = width;
  backgroundLayer.height = height;
  drawStaticGrid(backgroundCtx, width, height);
}
function drawFrame(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(backgroundLayer, 0, 0);
  drawDynamicMarkers(ctx);
}
```


**Use when:** a scene has a stable background and a small dynamic foreground, such as a chart grid behind a cursor or a map background behind moving markers.

**Implementation:** render the stable layer to a cached canvas or separate canvas surface. Redraw the dynamic layer independently. Align both surfaces using the same logical dimensions and DPR policy. Keep pointer interaction attached to a deliberate overlay or shared container, not arbitrarily to every layer.

**Failure signals:** seams between layers, mismatched sharpness, stale backgrounds after resize or theme changes, and incorrect stacking order. Ensure all layers share the same logical viewport and invalidate together when a shared input changes.

### Pattern E — Pointer-to-Model Interaction

```js
canvas.addEventListener("pointerdown", (event) => {
  const point = pointerToCanvas(event, canvas, scene.width, scene.height);
  if (!point) return;
  scene.selected = findTopmostHit(point, scene.objects);
  canvas.setPointerCapture(event.pointerId);
  requestRender();
});
```


**Use when:** users hover, select, drag, or draw on objects.

**Implementation:** convert the pointer from client coordinates into logical scene coordinates; update the pointer model; perform hit testing against stable object identities; then trigger a state update and redraw. For drags, use pointer capture and handle cancellation. Keep keyboard interaction and accessible alternatives in parallel with pointer handling.

**Failure signals:** offset clicks at high DPR, drag ending outside the canvas, hover-only features failing on touch, and inaccessible objects. Test with browser zoom, container resize, touch emulation, and keyboard-only navigation.

### Pattern F — Cached Geometry and Image Assets

```js
const spriteCache = new Map();
async function getSprite(url) {
  if (!spriteCache.has(url)) {
    spriteCache.set(url, loadImage(url).catch((error) => {
      spriteCache.delete(url);
      throw error;
    }));
  }
  return spriteCache.get(url);
}
```


**Use when:** stable shapes, text metrics, or images are reused across frames.

**Implementation:** create reusable `Path2D` objects, decode images before use, cache text measurements when fonts are stable, or pre-render expensive static layers. Attach invalidation rules to every cache. Track memory use when cached surfaces are large.

**Failure signals:** cache invalidation bugs, stale font rendering, increased memory after navigation, or no measurable performance improvement. Compare a representative workload before and after caching; remove caches that do not provide a meaningful benefit.

## Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Setting CSS size without resizing the bitmap | The browser stretches existing pixels | Coordinate CSS dimensions and backing-store dimensions |
| Multiplying every coordinate by DPR and scaling the context too | DPR is applied twice | Pick one logical-coordinate strategy and centralize it |
| Calling `scale()` on every resize | Transforms accumulate | Re-establish the base transform with `setTransform()` |
| Forgetting `beginPath()` | New geometry may join an earlier path | Begin independent paths explicitly |
| Forgetting `save()`/`restore()` around clips | Later drawing remains clipped | Isolate every clipping operation in a state scope |
| Changing `globalAlpha` without restoring it | Later shapes inherit transparency | Save and restore or set a documented state for each batch |
| Clearing logical dimensions under an unknown transform | Old pixels remain or the wrong area clears | Use a known transform and clear the intended coordinate space |
| Resizing the bitmap in every frame | The canvas clears and reallocates repeatedly | Resize only when dimensions or resolution policy changes |
| Drawing images before they are ready | Frames may be blank or janky | Preload and decode; handle load failures |
| Setting `crossOrigin` after `src` | The request may already have started | Set CORS mode before assigning the source |
| Assuming a drawn object receives DOM events | Canvas has no per-shape DOM target | Implement hit testing and an accessible interaction model |
| Using `offsetX` as a universal coordinate mapping | Transforms and event targets can change assumptions | Map from `clientX/clientY` through the bounding rectangle |
| Updating by a fixed number of pixels per frame | Speed varies by refresh rate | Use delta time or absolute elapsed time |
| Ignoring `pointercancel` | Drag state can become stuck | Handle pointer down, move, up, and cancel paths |
| Redrawing continuously for static data | Wastes CPU and battery | Use invalidation-driven rendering |
| Implementing dirty rectangles before profiling | Complexity adds bugs without proven benefit | Start with full redraw and measure first |
| Caching without invalidation rules | Pixels become stale | Define cache keys and invalidation triggers |
| Using huge DPR surfaces without a budget | Memory and fill cost grow quadratically | Cap DPR where appropriate and inspect pixel counts |
| Treating canvas text as accessible content | Screen readers may not expose drawn labels | Provide semantic HTML alternatives and a data table where useful |
| Relying on visual hover alone | Touch and keyboard users miss functionality | Provide focus, keyboard, and touch equivalents |
| Ignoring font loading | Text metrics and layout can change later | Redraw after required fonts become available |
| Adding shadows to every object | Large raster effects can dominate frame time | Reduce shadow count, area, blur, or cache stable effects |
| Assuming every browser produces identical pixels | Antialiasing and features vary | Test supported engines and avoid brittle pixel equality |
| Failing to cancel animation on teardown | Work continues after the view is gone | Cancel frame IDs and disconnect observers/listeners |
| Reusing a mutable context across unrelated renderers | Hidden state leaks between systems | Give each renderer a clear context-state contract |
| Letting a canvas be the only source of key information | The information may be unavailable without pixels | Pair it with structured text or controls |
| Ignoring zero-size layouts | Division by zero or giant coordinate values | Guard dimensions before configuring or mapping input |
| Applying CSS rotation to an interactive canvas without inverse mapping | Pointer coordinates no longer match the scene | Avoid transformed interaction surfaces or invert the transform |
| Using one cache for every theme and size | Different render conditions share wrong pixels | Include dimensions, DPR, theme, and data version in cache keys |
| Benchmarking only on a powerful desktop | Mobile bottlenecks remain hidden | Profile target devices and representative scene sizes |

## Accessibility Requirements

```html
<style>
  .canvas-control:focus-visible, canvas:focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 3px;
  }
</style>
<form aria-label="Chart navigation">
  <label for="point-index">Data point index</label>
  <input id="point-index" type="number" min="0" value="0" />
  <button class="canvas-control" type="button">Move to previous data point</button>
  <button class="canvas-control" type="button">Move to next data point</button>
</form>
```


Canvas is a visual surface, not a complete semantic interface. Put meaningful content, controls, status, and instructions in HTML whenever possible. A canvas element can contain fallback content for browsers that do not support it, but that fallback does not automatically provide a useful equivalent to assistive technology in every modern browser. If the drawn scene communicates data, provide that data in a table, list, summary, or other structured representation. If it contains interactive objects, create a keyboard-accessible interaction model and expose the selected item, current value, and available actions in semantic controls.

Do not communicate state using color alone. Pair color with labels, shape, pattern, text, or another cue. Ensure text and important visual marks have adequate contrast against the background. A canvas chart should not depend on tiny low-contrast labels that cannot be zoomed or selected. If a drawing tool supports complex gestures, provide alternatives for essential actions where practical, such as keyboard commands or accessible buttons for changing tools and committing a selection.

For nonessential motion, a CSS preference can switch the presentation to a static state; the JavaScript renderer should also consult the same preference when it owns continuous updates.

```css
@media (prefers-reduced-motion: reduce) {
  .canvas-motion-status { animation: none; transition: none; }
}
```

For decorative canvases, mark them as decorative only when they convey no essential information and have no interaction. If the canvas is meaningful, provide a concise accessible name and nearby explanation, but do not mistake an accessible name for a full representation of the scene. Focus should generally remain on actual controls rather than the canvas surface unless the canvas itself implements a coherent keyboard interaction pattern. If the canvas is focusable, visible focus styling must be provided outside or around the surface.

Motion requires special care. Respect `prefers-reduced-motion` for nonessential continuous movement, parallax, and animated particle fields. A reduced-motion mode can render a static representative frame, reduce speed and amplitude, or disable movement while retaining the information conveyed by the scene. Do not make content disappear when animation is disabled. Provide pause controls for long-running, user-visible animation when the experience requires them, and avoid flashing patterns that may trigger photosensitive reactions.

**Accessibility acceptance checklist:**

- Essential data is available as semantic text or a structured alternative.
- Interactive objects can be operated without a pointer.
- Focus is visible and not trapped in the canvas.
- State is not conveyed by color alone.
- Reduced-motion preferences are respected.
- Touch targets and drag interactions have usable alternatives where practical.
- Errors, loading, and empty states are announced through suitable HTML status regions.
- Decorative canvases do not add redundant noise to the accessibility tree.

## Performance and Memory

Canvas performance is governed by several interacting costs: backing-store pixel count, amount of geometry, overdraw, text measurement, image decoding, shadows and filters, compositing, readback operations, and frame scheduling. Optimize the dominant cost, not the most obvious-looking code. Start with a representative performance recording and inspect frame duration, scripting, raster work, and long tasks. Add lightweight counters for draw calls, objects visited, dirty area, cache hits, and frame time when a custom renderer is complex enough to justify them.

A larger backing bitmap costs more memory and work. Pixel count is width multiplied by height multiplied by the square of DPR. If a canvas is 1600 by 900 CSS pixels at DPR 2, its bitmap contains 5.76 million pixels. An RGBA buffer alone is roughly four bytes per pixel before browser-side overhead and intermediate surfaces, so several layers or cached surfaces can consume substantial memory. Reduce the drawing surface, cap DPR, or use tiled/layered rendering when the visual requirements allow it.

Avoid expensive effects on every object in a large scene. Shadows, large blurs, complex clipping, and repeated compositing can be more costly than basic fills and strokes. Pre-render stable effects if that measurably reduces work. Batch drawing by style when z-order allows it, but never reorder objects in a way that changes the intended composition. Use typed arrays for large numeric particle sets only when object overhead or iteration cost is proven to matter; typed arrays make code less expressive and should not be a premature default.

Be cautious with `getImageData()`, `putImageData()`, and repeated canvas readback. Pixel reads may force synchronization between rendering and CPU memory, which can be costly. If the application must read pixels, consider creating a context with `willReadFrequently: true` when that usage pattern is known at context creation. This is a hint, not a universal performance switch. A read-heavy image editor and a draw-heavy animation may need different context options.

Keep lifecycle costs under control. Stop animation when it is not needed, disconnect observers, remove event listeners, release references to large offscreen canvases, and avoid creating a new canvas or image for each frame. If the renderer is offscreen or worker-based, account for message transfer costs and fallback paths. A worker can improve responsiveness by moving rendering work off the main thread, but it does not eliminate pixel cost or guarantee a faster total render.

## Browser Compatibility and Progressive Enhancement

Canvas 2D is broadly available in modern browsers, but individual methods, context attributes, text metrics, smoothing behavior, blend modes, and worker-related capabilities vary by engine and version. Verify every feature that is central to the product against the actual browser support policy. Prefer feature detection to user-agent sniffing. For optional APIs, test whether the method exists and provide a simpler rendering path when it does not.

`OffscreenCanvas` and transferring a canvas to a worker can be valuable, but they should be treated as progressive enhancements rather than assumptions. A worker may not be available in every environment, and DOM measurement, accessibility, and input still typically remain on the main thread. Keep a main-thread renderer available when the product must support browsers without the worker path. If the fallback is slower, reduce visual complexity or frame cadence rather than failing entirely.

Text rendering and antialiasing are not guaranteed to match pixel-for-pixel across Chrome, Firefox, and Safari. Do not make fragile visual tests depend on exact raster equality unless the test environment is pinned and the pixel tolerance is intentional. Test at representative DPR values, zoom levels, and viewport sizes. Verify image export and pixel-read operations under cross-origin conditions. When using newer context options or APIs, check support and behavior rather than assuming that a silent unsupported option changes nothing.

Progressive enhancement means the user still gets the essential content when the canvas cannot render or animation is disabled. A data visualization should have a text summary or table. A decorative background can disappear without breaking the page. A drawing application should explain that an advanced feature is unavailable and retain essential non-canvas controls where possible. Browser compatibility is a product decision: document supported environments, test the core experience, and provide a fallback proportionate to the importance of the canvas.

## Debugging Playbook

### Symptom: The Canvas Looks Blurry

Check the CSS rectangle, `canvas.width` and `canvas.height`, DPR, and current transform. Confirm that the backing bitmap has enough pixels for the displayed size. Verify that a resize handler has not reset the bitmap without restoring the transform. Inspect browser zoom and any CSS scaling. If only text is blurry, check the font, fractional coordinates, and whether the bitmap is being resampled by CSS.

### Symptom: Everything Is Offset or Too Large

Inspect the transform matrix and look for repeated calls to `scale()` or nested translations that were not restored. Confirm whether drawing helpers use logical coordinates or backing pixels. Add a debug crosshair at the origin and draw a rectangle around the logical viewport. If pointer input is offset, compare client coordinates, the bounding rectangle, logical dimensions, and any fit/letterbox transform.

### Symptom: Shapes Disappear or Old Pixels Remain

Check whether the render function runs, whether the canvas is cleared in the right coordinate space, and whether alpha/compositing state has leaked. Inspect clipping regions and filter/shadow bounds. Confirm that a full clear has not been replaced with a too-small dirty rectangle. Add a solid background fill temporarily to distinguish transparency from missing drawing.

### Symptom: The Animation Runs Too Fast or Jumps

Check whether motion is based on per-frame increments instead of elapsed time. Confirm that only one animation loop is active and that the timestamp is initialized correctly. Clamp large deltas or use a fixed-step simulation after tab suspension. Inspect whether a React or other UI lifecycle repeatedly starts a new loop without cancelling the previous one.

### Symptom: Pointer Input Does Not Match the Artwork

Verify coordinate conversion using `getBoundingClientRect()`. Check borders, CSS transforms, zoom, fit-to-design transforms, and letterboxing. Make sure the hit test and drawing geometry use the same coordinate system. For complex paths, test with a visible debug point and a temporary hit-region overlay. Handle pointer capture and cancellation during drags.

### Symptom: Performance Degrades as the Scene Grows

Profile before changing architecture. Inspect backing-store area, DPR, draw-call count, object iteration, shadows, image decode, pixel readback, and continuous redraw when idle. Temporarily disable one expensive effect at a time. Measure on a lower-powered device. If the bottleneck is stable geometry, consider caching; if it is pixel count, reduce surface resolution; if it is input hit testing, add a spatial index; if it is unnecessary frames, switch to invalidation-driven rendering.

### Symptom: Export or Pixel Reads Fail

Check whether a cross-origin image tainted the canvas. Verify the source server's CORS headers and that `crossOrigin` was set before the request. Confirm that the code is using a supported export API and handling asynchronous failures. A canvas that can display an image is not necessarily allowed to read or export its pixels.

## Testing Strategy

A separate focus treatment should also be verified in the browser's keyboard-navigation state, not only by inspecting the stylesheet. The following small example gives the canvas host an explicit visible focus ring when the application makes the surface keyboard-focusable.

```css
.chart-surface:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 4px;
}
``` 


```js
function debugCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const report = {
    cssWidth: rect.width, cssHeight: rect.height,
    bitmapWidth: canvas.width, bitmapHeight: canvas.height,
    dpr: window.devicePixelRatio || 1,
    transform: ctx.getTransform().toJSON?.() ?? "Transform inspection unavailable",
  };
  console.table([report]);
  return report;
}
```


Test rendering logic at three levels. Unit tests should cover pure geometry functions, scale calculations, pointer mapping, hit testing, and animation updates with controlled timestamps. Integration tests should verify that the canvas is configured correctly after resize, that assets load and fail gracefully, and that event listeners and animation frames are cleaned up. Visual regression tests should capture representative scenes at defined viewport sizes and DPR values, using a reasonable pixel tolerance for cross-engine differences.

A deterministic renderer is easier to test. Allow tests to inject dimensions, time, random seeds, and model state rather than relying on global randomness or the real clock. If a scene uses randomness for particles, seed the generator in tests. Keep rendering pure where practical so the same model produces the same output under the same rendering configuration. If exact pixels are not stable across engines, test key visual properties and geometry separately instead of demanding identical screenshots.

Test at least: a narrow viewport, a wide viewport, high-DPI scaling, a zero-size or hidden initial layout, browser zoom, missing image assets, failed font loading, pointer cancellation, keyboard navigation, reduced-motion mode, tab suspension and resume, component unmount, and a scene with enough objects to expose performance issues. For data visualizations, test empty, loading, error, and extreme-value states. For drawing tools, test long drags outside the canvas and device-pixel alignment. For export tools, test both same-origin and cross-origin assets.

## Mental Models

1. **Canvas is a projection.** The model is authoritative; pixels are a rendered snapshot.
2. **Two sizes, one scene.** CSS size describes presentation; bitmap size describes available pixels.
3. **DPR is squared in pixel cost.** Doubling the resolution in each axis means four times as many pixels.
4. **Context state is ambient state.** Every helper must declare what it changes and restore or re-establish it.
5. **Transforms are coordinate contracts.** Input, geometry, clipping, and clearing must agree about the active space.
6. **A frame is a transaction.** Update model state, establish render state, draw the scene, then schedule the next frame only if needed.
7. **Pixels have no semantics.** Accessibility and interaction must be represented intentionally outside the bitmap.
8. **Full redraw is the correctness baseline.** Optimize to partial redraw only after measurement.
9. **Caches are derived data.** Every cache needs a key, an invalidation rule, and a memory budget.
10. **Performance follows the workload.** Count pixels, effects, objects, and frames before rewriting the renderer.

## Quick Reference

| Need | Recommended starting point | Watch out for |
|---|---|---|
| Crisp rendering | DPR-scaled backing store plus logical transform | Double scaling and excess pixel cost |
| Responsive layout | `ResizeObserver` and one resize configuration function | Bitmap resize resets state |
| Static scene | Invalidation-driven render | Missed dirty invalidation |
| Continuous motion | `requestAnimationFrame` plus elapsed time | Multiple loops and large deltas |
| Shape geometry | `beginPath()` or reusable `Path2D` | Stale paths and state leakage |
| Image rendering | Preload and decode before drawing | CORS taint and failed assets |
| Pointer interaction | Client-to-logical coordinate conversion | CSS transforms and letterboxing |
| Complex scenes | Model/update/render separation | Over-abstraction before scale requires it |
| Performance | Profile representative workloads | Optimizing code that is not the bottleneck |
| Accessible chart | Canvas plot plus semantic data table | Color-only information and inaccessible labels |

## Build Challenge: Responsive Interactive Canvas Dashboard

Build a responsive canvas dashboard that plots a time series and overlays an interactive cursor. The canvas should remain crisp on high-DPI displays, resize with its container, and expose its essential data and controls through semantic HTML. The implementation should demonstrate a clear model, render function, resize lifecycle, pointer mapping, accessible fallback, and performance-conscious redraw strategy.

### Functional Requirements

1. Render at least two data series with distinguishable line styles and a visible legend in HTML.
2. Use a logical coordinate system independent of backing-store pixels.
3. Configure the backing store using a deliberate DPR policy and document the chosen cap, if any.
4. Reconfigure after container resize without multiplying transforms.
5. Use a predictable margin and plot-area calculation.
6. Draw grid lines, axes, tick labels, and data points or a continuous line.
7. Handle empty, loading, and error states without displaying a misleading blank chart.
8. Map pointer position to the logical scene coordinates.
9. Show a cursor or tooltip for the nearest data point when pointer interaction is supported.
10. Handle pointer leave and cancellation without leaving stale hover state.
11. Provide keyboard-accessible controls to move through or select data points.
12. Provide a semantic HTML table or equivalent structured summary of the displayed values.
13. Ensure color is not the only distinction between series.
14. Respect reduced-motion preferences for any animated cursor or transition.
15. Avoid a continuous render loop when data and interaction state are unchanged.
16. Cancel pending animation frames and disconnect observers when the component is removed.
17. Include a debug option that reports dimensions, DPR, and frame counts.
18. Test a narrow viewport, a high-DPI viewport, and a missing/empty data set.

### Definition of Done

- The chart remains sharp at DPR 1 and DPR 2 without changing logical layout dimensions.
- Resizing does not stretch old pixels, multiply the transform, or leave stale chart geometry.
- Pointer hover aligns with the plotted point after resize and browser zoom changes.
- Keyboard users can access the essential data and actions without using a pointer.
- The HTML data representation stays synchronized with the rendered series.
- No animation frame continues after teardown, and no resize observer remains attached.
- The renderer avoids idle continuous redraws when the chart is static.
- Failed or empty data produces an understandable message and a stable layout.
- The performance recording shows no repeated layout measurement inside the draw loop.
- The code documents the coordinate system, state ownership, cache rules, and DPR policy.

## Review Checklist

Before shipping a Canvas 2D feature, ask:

- Is canvas the appropriate rendering surface for this workload?
- Are logical and backing-store dimensions explicit?
- Is DPR capped or otherwise chosen based on a quality-performance requirement?
- Is the transform reset intentionally after resize?
- Does each drawing helper have a clear context-state contract?
- Are paths started and clipping scopes restored correctly?
- Is update logic separate from draw logic?
- Is redraw scheduled only as often as needed?
- Is animation time-based rather than frame-count-based?
- Are pointer coordinates mapped through the actual display rectangle?
- Are hit regions and z-order rules deterministic?
- Are images decoded before drawing and CORS requirements understood?
- Are caches invalidated when their inputs change?
- Are pixel readback and large effects measured rather than assumed cheap?
- Are animation frames, observers, and listeners cleaned up?
- Does essential information remain available without pixels or motion?
- Has the feature been tested across the browser/device policy the product supports?

## Final Principle

### Gotchas to Check Before Shipping

1. **Gotcha — DPR change:** moving the browser between displays can require a new backing-store scale even if the CSS size is unchanged.
2. **Gotcha — font readiness:** a canvas may retain fallback-font pixels until the next explicit render.
3. **Gotcha — zero-size parent:** hidden tabs, dialogs, and collapsed panels can report zero dimensions; defer configuration until the surface becomes measurable.
4. **Gotcha — CORS taint:** a visible image can still block pixel reads and export.
5. **Gotcha — pointer cancellation:** operating-system gestures can cancel a drag before `pointerup`.
6. **Gotcha — context loss and recovery:** where the environment exposes context-loss events, define whether the scene can be reconstructed from model state.

```js
function attachCanvasLifecycle(canvas, render) {
  const onContextLost = (event) => {
    event.preventDefault();
    console.warn("Canvas context lost; rendering will resume from model state when restored.");
  };
  const onContextRestored = () => render();
  canvas.addEventListener("contextlost", onContextLost);
  canvas.addEventListener("contextrestored", onContextRestored);
  return () => {
    canvas.removeEventListener("contextlost", onContextLost);
    canvas.removeEventListener("contextrestored", onContextRestored);
  };
}
```


A production Canvas 2D feature is not complete when the first frame looks right. It is complete when the same rendering model remains correct after resize, zoom, input, missing assets, tab suspension, theme changes, reduced-motion preferences, and teardown—and when performance and accessibility have been designed rather than added as afterthoughts. Start with the simplest correct renderer, make coordinate and state ownership explicit, profile representative workloads, and introduce caching or partial redraw only when the evidence justifies the complexity.
