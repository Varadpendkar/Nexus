---
name: resize-observer
description: Production-grade ResizeObserver patterns for element-level size changes, responsive canvases, component layout adaptation, and coordinated refreshes without resize-event storms.
---

# Resize Observer — Production Skill

## Why This Matters

Element dimensions change for reasons that `window.resize` cannot see: a sidebar opens, a grid column is resized, a font finishes loading, a parent changes its layout, a tab becomes visible, or a container receives new content. Code that listens only to the viewport often leaves charts blurry, canvases stretched, virtualized panels incorrectly measured, and layout-dependent animation systems out of sync. The opposite failure is just as common: a `ResizeObserver` callback writes layout-affecting styles immediately, causing repeated measurements and a browser warning about undelivered notifications. Production code needs a clear measurement/write boundary, stable ownership of observers, and explicit cleanup.

This skill treats `ResizeObserver` as an element-measurement signal, not as a general-purpose animation loop. It explains box semantics, observer lifecycle, batching, feedback-loop avoidance, canvas backing stores, component integration, testing, and browser diagnostics. The goal is predictable layout adaptation when an element changes size for any reason—not merely when the browser window changes.

## When to Use This Skill

Use these patterns for responsive canvas and WebGL surfaces, charts, embedded editors, split panes, component-level breakpoints, masonry and grid recalculation, text measurement, and coordinating a third-party layout engine after a container changes. Use `window.resize` when the actual viewport is the only relevant source. Use `IntersectionObserver` for visibility, `MutationObserver` for DOM-tree or attribute mutations, and `matchMedia` for CSS media-query state. Do not substitute `ResizeObserver` for those APIs merely because they all have callbacks.

## Core Contract

A `ResizeObserver` reports box-size changes for observed elements. The browser controls when delivery happens and can batch multiple targets into a single callback. The callback should read the supplied observation data, normalize it, compare it with the last applied size, and schedule writes in a controlled phase. It should not assume one callback equals one user action, one frame, or one viewport resize.

The examples use modern JavaScript and browser APIs. Production code should still provide a sensible static layout when JavaScript is unavailable, avoid assuming all browsers expose every newer convenience field, and test in the actual browsers supported by the product.

---

## 1. Understand What Is Being Measured

A resize observer observes an element's box, not the whole page and not its descendants individually. An observed element can change size because its own CSS, its parent, its content, intrinsic sizing, font metrics, grid tracks, or other layout constraints change. That makes it useful for component-level responsiveness: the component reacts to the space it actually receives.

The most important choice is which box you mean. `content-box` excludes padding and borders; `border-box` includes them. `device-pixel-content-box`, where supported, reports content-box dimensions in device pixels and can help keep canvas backing stores sharp. These are not interchangeable. If the canvas CSS width is 400 CSS pixels and its device-pixel ratio is 2, a sharp backing store may need to be 800 pixels wide.

```js
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    console.log(`${entry.target.tagName}: ${width} × ${height} CSS px`);
  }
});
observer.observe(document.querySelector('.chart'), { box: 'content-box' });
```

Choose the box based on the quantity the downstream system needs. A canvas renderer often needs content-box dimensions; a component that aligns its border to an external edge may care about border-box. Avoid silently mixing `getBoundingClientRect()` measurements with `contentRect` values: the former is a visual border-box rectangle and may include transforms, while the latter describes the observed content box in CSS pixels.

**Gotcha:** `contentRect` remains widely useful, but it is not a substitute for understanding writing modes and newer box-size arrays. A vertical writing mode can make physical width and height differ from logical inline and block sizes.

## 2. Pick the Correct Box and Coordinate System

The `observe()` options object selects which box change should trigger delivery. The common values are `content-box`, `border-box`, and `device-pixel-content-box`. The default is content-box. Do not assume that asking to observe one box changes the shape of every property on the entry; inspect the relevant property and provide a compatibility fallback when needed.

For logical layout, `inlineSize` and `blockSize` are often more meaningful than physical width and height. A horizontal writing mode usually maps inline size to width and block size to height, but vertical writing modes change that relationship. `contentBoxSize` and `borderBoxSize` are arrays because an element may have multiple fragments. Many ordinary components have one fragment, but robust code should not treat the array shape as a guaranteed single object in every environment.

```js
function getFirstBoxSize(boxes) {
  if (!boxes) return null;
  // Modern browsers expose an array-like sequence; tolerate older object-shaped implementations.
  const first = Array.isArray(boxes) ? boxes[0] : boxes;
  if (!first) return null;
  return { inlineSize: first.inlineSize, blockSize: first.blockSize };
}

const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const logical = getFirstBoxSize(entry.contentBoxSize);
    if (logical) {
      console.log(logical.inlineSize, logical.blockSize);
    } else {
      console.log(entry.contentRect.width, entry.contentRect.height);
    }
  }
});
```

Keep units explicit in variable names (`widthCssPx`, `widthDevicePx`, `inlineSizeCssPx`). This prevents bugs where a canvas backing store is accidentally set to a CSS-pixel width, or a CSS dimension is multiplied by device-pixel ratio twice. In component code, normalize observations into one internal structure before notifying consumers.

## 3. Build a Stable Observer Lifecycle

An observer is an owned resource. Create it when the relevant component or controller starts, observe the target after it exists, unobserve a target when only that target is removed, and disconnect the observer when its owner is disposed. Recreating observers on every render or every state change increases overhead and makes stale callbacks more likely.

One observer can watch multiple targets, and its callback receives entries for all targets whose observed box changed. A component should normally keep the observer instance stable and maintain a clear map from target elements to per-target state. Avoid capturing stale component values in a callback; either update a stable reference or route entries to a controller that owns the latest state.

```js
function observeElementSize(element, onSize) {
  if (!element || typeof ResizeObserver === 'undefined') {
    return () => {};
  }

  let lastWidth = -1;
  let lastHeight = -1;
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.target !== element) continue;
      const { width, height } = entry.contentRect;
      if (width === lastWidth && height === lastHeight) continue;
      lastWidth = width;
      lastHeight = height;
      onSize({ width, height });
    }
  });
  observer.observe(element);
  return () => observer.disconnect();
}
```

The returned cleanup function is deliberate: it makes ownership explicit and is easy to call from a framework effect, a custom element's `disconnectedCallback`, or a controller's `destroy()` method. Cleanup must be safe to call more than once. Do not rely on garbage collection to stop an observer from delivering callbacks.

## 4. Separate Measurement From Layout Writes

The callback is delivered during the browser's rendering update process. If it writes a style that changes the size being observed, the browser may need another layout pass and another observation. A feedback cycle can create a warning or a loop. The robust default is to measure in the observer callback, compare with the previous value, and schedule a bounded write in `requestAnimationFrame` or another deliberate phase.

Scheduling a write does not automatically make a feedback loop impossible. If the write keeps changing the observed element's size on every delivery, the loop remains logically present; it is merely spread across frames. The real fix is to make the size transformation converge, observe a different element, or avoid writing the same property that drives the measurement.

```js
function createSizeController(element, applySize) {
  let frame = 0;
  let pending = null;
  let lastKey = '';
  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((item) => item.target === element);
    if (!entry) return;
    const { width, height } = entry.contentRect;
    const key = `${width}:${height}`;
    if (key === lastKey) return;
    lastKey = key;
    pending = { width, height };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (pending) applySize(pending);
      pending = null;
    });
  });
  observer.observe(element);
  return () => {
    observer.disconnect();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    pending = null;
  };
}
```

This coalesces many deliveries into one application per frame. Keep `applySize` idempotent and do not write dimensions that fight CSS sizing. If the goal is merely to choose a compact or wide layout, CSS container queries may be simpler and more robust than observing the element in JavaScript.

## 5. Understand Delivery, Batching, and Timing

A callback may include several entries. Never assume `entries[0]` is the only target unless the observer is explicitly restricted to one target. The callback can also run after a target changes several times in one rendering update, with the browser delivering the latest observation for that update. Treat the callback as a batch of measurements, not an event log.

The browser decides when delivery happens relative to style calculation and layout. This is why measuring in the callback is usually cheaper than calling `getBoundingClientRect()` repeatedly for every target, and why writing layout-affecting values directly can cause extra work. Use the data on each `ResizeObserverEntry` wherever possible instead of forcing synchronous layout to measure the same element again.

```js
const sizes = new Map();
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    sizes.set(entry.target, { width, height });
  }
  // One notification after the full batch has been recorded.
  scheduleConsumerUpdate();
});
```

If a downstream system needs a consistent view of multiple elements, collect all entry data first, then schedule one consumer update. This avoids partially applying a batch while later entries are still waiting to be processed. When order matters, define it explicitly rather than depending on entry order.

## 6. Avoid Feedback Loops and Non-Converging Layout

The classic failure is observing a box and then changing that same box's width or height based on the reported width or height. For example, a callback adds 10 pixels when the measured width is less than a threshold; that causes the element to become wider; the next callback removes 10 pixels; the cycle repeats. The browser can emit a ResizeObserver loop warning when it cannot deliver all notifications in the current rendering cycle.

First determine whether the observer is measuring the correct element. Often, observe a stable container and size a child within it, rather than observing and writing the same element. Second, use a stable breakpoint with hysteresis when the state toggles near a boundary. Third, write only when the desired output differs from the current output. Fourth, keep CSS as the source of truth for ordinary layout where possible.

```js
const COMPACT_ENTER = 460;
const COMPACT_EXIT = 480;
let compact = false;

const observer = new ResizeObserver(([entry]) => {
  const width = entry.contentRect.width;
  if (!compact && width < COMPACT_ENTER) compact = true;
  else if (compact && width > COMPACT_EXIT) compact = false;
  entry.target.dataset.layout = compact ? 'compact' : 'wide';
});
```

Hysteresis prevents rapid switching when a measurement hovers around one threshold. In a real implementation, avoid changing the measured container's own dimensions through the selected state; use a descendant or CSS custom property where appropriate. The code above is a simple illustration of threshold stability, not a reason to bypass CSS container queries.

**Gotcha:** Moving the write to `requestAnimationFrame` can hide a warning while preserving an infinite multi-frame oscillation. Always check convergence, not merely whether the console warning disappears.

## 7. Resize Can Mean More Than the Viewport Changed

An element can resize when a font loads, a sibling appears, a grid track changes, a panel is expanded, a user changes browser zoom, a scrollbar appears, or a parent applies a new class. A `window.resize` listener does not reliably cover these component-level changes. That is the main reason `ResizeObserver` is a better fit for charts and embedded visualizations than a global resize handler.

Avoid adding separate global listeners for every chart. Observe the chart's actual container and let the observer tell the chart when its allocated space changes. This supports dashboards where panels can be collapsed or dragged, responsive split panes, and nested layouts. Keep the observed target stable if possible; replacing the element should trigger a deliberate unobserve/observe lifecycle.

```js
function connectChart(chart, container) {
  const observer = new ResizeObserver((entries) => {
    const entry = entries.find((item) => item.target === container);
    if (!entry) return;
    chart.resize({
      width: Math.round(entry.contentRect.width),
      height: Math.round(entry.contentRect.height),
    });
  });
  observer.observe(container);
  return () => observer.disconnect();
}
```

Check the chart library's API before calling its resize method. Some libraries schedule their own updates or require a refresh after layout stabilizes. If so, coalesce calls and avoid calling refresh from both the observer and another resize handler for the same target.

## 8. Keep Canvas CSS Size and Backing Store Size Separate

A canvas has a CSS display size and a pixel backing store. Setting only CSS width and height scales the existing bitmap and can blur drawing. Setting only `canvas.width` or `canvas.height` changes the drawing buffer and can also reset context state. A responsive canvas should observe its content box, set the CSS layout through CSS, update the backing store based on device-pixel ratio, and then redraw.

Use `devicePixelContentBoxSize` when supported and appropriate. Otherwise, multiply the CSS content size by `window.devicePixelRatio`. Device-pixel ratio can change when a window moves between displays or browser zoom changes, so a robust system may also need to re-evaluate it when relevant. Avoid rounding the CSS size and then multiplying if that loses fractional precision unnecessarily.

```js
function resizeCanvas(canvas, context, cssWidth, cssHeight, dpr = window.devicePixelRatio || 1) {
  const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
  const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  redrawScene(context, cssWidth, cssHeight);
}

const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  resizeCanvas(canvas, context, width, height);
});
observer.observe(canvas);
```

Changing the canvas backing store resets drawing state, which is why the transform is set again after a dimension change. The drawing routine should use CSS-pixel coordinates if the context transform scales those coordinates to device pixels. For WebGL, update the drawing buffer and viewport consistently, and avoid repeated reallocations when the rounded backing size has not changed.

## 9. Design for Hidden, Detached, and Zero-Sized Elements

An element can be zero-sized while hidden, not yet laid out, or temporarily placed in a collapsed panel. Zero is a valid measurement, not necessarily an error. Do not initialize expensive rendering work with invalid dimensions or divide by zero. When a hidden panel becomes visible, the observer should eventually report its new size; code should be ready to resume rendering then.

A target must be connected and have layout before its size can be useful. In component frameworks, the observer should be attached after the element ref exists. During teardown, cancel pending frames and disconnect the observer. If the target is replaced, do not keep observing the old node accidentally.

```js
function isRenderableSize({ width, height }) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

const observer = new ResizeObserver(([entry]) => {
  const size = { width: entry.contentRect.width, height: entry.contentRect.height };
  if (!isRenderableSize(size)) {
    pauseRenderer();
    return;
  }
  resumeRenderer(size);
});
```

Pausing a renderer at zero size can save work, but do not destroy state unless the product requires it. A chart may preserve zoom and selection while hidden, then redraw when visible. Use visibility signals and size signals for separate concerns: size alone does not tell you whether an element is meaningfully visible in the viewport.

## 10. Use CSS Container Queries When They Fit Better

If the only response to an element's width is a styling choice—such as switching a card from a horizontal to vertical layout—CSS container queries are usually preferable. They avoid JavaScript measurement, reduce state duplication, and adapt before script callbacks have a chance to run. `ResizeObserver` is better when the size must be sent to a rendering engine, used for a numerical calculation, or integrated with a library that does not use CSS layout.

```css
.card-shell {
  container-type: inline-size;
}

.card-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1rem;
}

@container (max-width: 28rem) {
  .card-content {
    grid-template-columns: 1fr;
  }
}
```

Avoid duplicating the same breakpoint in CSS and JavaScript unless the two systems genuinely need to agree. If they must agree, define a shared token or document why the values are coupled. JavaScript can still observe the container to update a chart while CSS container queries handle card presentation.

## 11. Integrate With Frameworks Without Observer Churn

In a component framework, create the observer in the lifecycle mechanism that owns the DOM node. The observer should not be recreated on every render. Use a ref for the target, keep callbacks current without needlessly rebuilding the observer, and disconnect on cleanup. Strict development modes may mount, clean up, and remount effects to expose lifecycle bugs, so setup and cleanup must be symmetrical.

The general lifecycle is: resolve the element, construct the observer, begin observing, publish normalized size changes, then disconnect on unmount or target replacement. If a size update changes framework state, deduplicate equal values to prevent redundant renders. Do not call a synchronous state update for every fractional fluctuation if the downstream component only needs integer pixels or a breakpoint bucket.

```jsx
function useElementSize(ref) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      setSize((previous) => previous.width === width && previous.height === height
        ? previous
        : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
```

This is an illustrative hook. In production, consider the initial measurement, the stability of the `ref` object, server rendering, missing API support, box selection, and whether consumers need exact or rounded dimensions. A shared hook library may benefit from a common observer per element rather than one observer per component, but that architecture should be justified by actual scale and ownership requirements.

## 12. Test, Profile, and Debug the Observer Path

Resize behavior is difficult to test by relying only on manual browser resizing. Exercise parent-driven changes, content changes, font loading, hidden-to-visible transitions, zero dimensions, target removal, repeated resize bursts, and high device-pixel ratio. In unit tests, mock `ResizeObserver` so the test can deliver deterministic entries. In browser tests, change the actual container style and wait for the layout/observer cycle to settle.

Use DevTools Performance recordings to inspect repeated layout, style recalculation, and long tasks. Watch the console for `ResizeObserver loop completed with undelivered notifications` or related warnings. Such a warning is evidence that a resize delivery could not fully settle in the current rendering cycle; it is not a message to silence without investigating the write path. Use the Elements panel to identify which ancestor controls the target's dimensions, and inspect computed styles when a component oscillates around a breakpoint.

```js
// Minimal injectable adapter makes the observer behavior testable.
export function observeSize(element, onSize, Observer = globalThis.ResizeObserver) {
  if (!element || !Observer) return () => {};
  const observer = new Observer((entries) => {
    for (const entry of entries) {
      if (entry.target === element) {
        onSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    }
  });
  observer.observe(element);
  return () => observer.disconnect();
}
```

The adapter makes the observer constructor injectable, which allows a unit test to trigger callbacks explicitly. Still include a browser-level test because a mock cannot reproduce the browser's actual delivery timing or layout feedback behavior. Measure callback count and downstream render count separately; a low callback count does not guarantee that each callback is cheap.

---

## 13. Normalize every entry at the boundary

Keep raw browser entry details out of the rest of the application. Convert the relevant box into a stable object with explicit units, finite-number checks, and a documented rounding policy. This makes canvas, chart, and component consumers simpler and means a future browser compatibility change is handled in one place. Do not normalize away information the consumer needs: if fractional CSS pixels matter, preserve them until the rendering boundary.

```js
function normalizeContentBox(entry) {
  const width = entry.contentRect.width;
  const height = entry.contentRect.height;
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
  return { widthCssPx: width, heightCssPx: height };
}
```

## 14. Deduplicate by the consumer's real resolution

Browser layout can produce fractional values. If a canvas backing store rounds dimensions to integer device pixels, a downstream redraw may not be necessary for every fractional CSS-pixel change. If a typography algorithm depends on fractional width, rounding too early can change line wrapping. Deduplication must match what the consumer applies, not an arbitrary global rule.

```js
function sameAppliedSize(a, b) {
  return Math.round(a.widthCssPx) === Math.round(b.widthCssPx) &&
    Math.round(a.heightCssPx) === Math.round(b.heightCssPx);
}
```

## 15. Observe a stable wrapper when writing a child

A layout feedback cycle is more likely when the same node is both measured and resized by the callback. A wrapper whose size is controlled by surrounding layout gives a stable input; the child can then be resized or redrawn from that input. The wrapper must genuinely be independent of the callback's output, otherwise the cycle still exists through an ancestor.

```js
const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  renderSurfaceWithin(child, width, height);
});
observer.observe(stableWrapper);
```

## 16. Coalesce bursts before expensive work

A dashboard can resize several panels in one layout pass. Repainting each chart synchronously for every entry wastes work and may create visible intermediate states. Collect the latest size for each target, then schedule one update. Coalescing is appropriate when only the newest dimensions matter; it is not appropriate when every intermediate measurement represents a business event, which is uncommon for layout size.

```js
let frame = 0;
const pending = new Map();
function queueSize(target, size) {
  pending.set(target, size);
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    for (const [element, latest] of pending) applySize(element, latest);
    pending.clear();
  });
}
```

## 17. Keep observer ownership explicit

Observer cleanup belongs to the code that owns the observed target. If a controller attaches the observer, the controller should expose a destroy method or return a cleanup function. This prevents detached nodes from retaining callbacks and makes tests able to assert that resources are released. Shared observers need reference counting or explicit subscription removal; a shared observer without ownership rules becomes a leak-prone global registry.

```js
function makeController(target, callback) {
  const observer = new ResizeObserver(callback);
  observer.observe(target);
  return { destroy() { observer.disconnect(); } };
}
```

## 18. Treat zero as a state, not an exception

A zero-width or zero-height target can be legitimate when a panel is collapsed or hidden. Rendering code should pause or defer initialization rather than create a zero-sized buffer, divide by zero, or permanently mark the component as initialized. When a nonzero observation arrives, resume the renderer using the latest dimensions. Preserve application state across the hidden period if the user expects it.

```js
function handleSize(size) {
  if (size.widthCssPx <= 0 || size.heightCssPx <= 0) { pauseDrawing(); return; }
  resumeDrawing(size);
}
```

## 19. Choose CSS or JavaScript for the right responsibility

Use CSS for presentation rules that can be expressed as container queries or intrinsic layout. Use `ResizeObserver` when a numerical dimension must drive a canvas buffer, third-party chart, geometry calculation, or imperative engine. Duplicating CSS breakpoints in JavaScript creates two sources of truth and makes maintenance harder. When both CSS and JavaScript need the size, document the contract between them.

```js
// CSS owns card layout; JavaScript only resizes the drawing surface.
const observer = new ResizeObserver(([entry]) => {
  chart.setViewport(entry.contentRect.width, entry.contentRect.height);
});
```

## 20. Separate visibility from dimensions

An element can have nonzero dimensions while offscreen, and can be onscreen while temporarily measuring zero during transitions. If the goal is to stop animation when content is not visible, use an appropriate visibility signal in addition to size observation. A size observer answers 'what are the dimensions?' rather than 'should this work be running?'. Keeping those questions separate avoids surprising pauses and wasted background work.

```js
function updateRenderPolicy({ visible, width, height }) {
  if (!visible || width <= 0 || height <= 0) pauseRenderer();
  else resumeRenderer({ width, height });
}
```

## 21. Account for device-pixel ratio changes

A canvas may keep the same CSS size while its ideal backing store changes because the browser zoom or display scale changes. If crisp rendering matters, treat CSS dimensions and device-pixel dimensions as separate values. Prefer `devicePixelContentBoxSize` when supported, and keep a fallback path that recomputes from the current device-pixel ratio. Avoid applying the ratio twice.

```js
const cssWidth = entry.contentRect.width;
const dpr = window.devicePixelRatio || 1;
const backingWidth = Math.max(1, Math.round(cssWidth * dpr));
```

## 22. Avoid synchronous remeasurement inside callbacks

The observer entry already contains measurements for the delivery. Calling `getBoundingClientRect()` on many nodes inside the callback can force extra layout and turn a cheap batch into expensive synchronous work. Read the entry fields first and collect all required data before performing writes. If a different measurement is genuinely required, explain why and profile the cost.

```js
const measurements = entries.map((entry) => ({
  target: entry.target, width: entry.contentRect.width, height: entry.contentRect.height
}));
consumeMeasurements(measurements);
```

## 23. Design for unsupported environments

A fallback should preserve usability without pretending it provides identical element-level measurement. If `ResizeObserver` is missing, a chart may use a window resize listener as a best-effort fallback and refresh when its parent is explicitly changed. CSS should still provide the layout. Keep the feature check at the boundary and test the fallback so the application does not fail with a ReferenceError during initialization.

```js
function observeWithFallback(element, callback) {
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(callback);
    observer.observe(element);
    return () => observer.disconnect();
  }
  const fallback = () => callback([{ target: element, contentRect: element.getBoundingClientRect() }]);
  window.addEventListener('resize', fallback);
  fallback();
  return () => window.removeEventListener('resize', fallback);
}
```

## 24. Keep callback work bounded

Resize callbacks are part of rendering work. Avoid network requests, large data transformations, repeated DOM construction, or expensive chart reinitialization in the callback. Translate the observation into a small state update or a scheduled render request. If a third-party library requires a full rebuild, debounce or coalesce that rebuild and confirm that the library is not already scheduling its own resize work.

```js
const observer = new ResizeObserver(([entry]) => {
  const size = normalizeContentBox(entry);
  if (size) queueRendererResize(size);
});
```

## 25. Test lifecycle edges deliberately

The most useful tests are not only the happy path. Verify cleanup after unmount, replacement of the target node, hidden-to-visible changes, zero size, rapid consecutive changes, and an observer implementation that does not exist. Use an injectable constructor or a fake observer in unit tests, then run browser tests to cover actual layout delivery and feedback warnings.

```js
const stop = observeSize(element, onSize, FakeResizeObserver);
expect(FakeResizeObserver.lastObserved).toBe(element);
stop();
expect(FakeResizeObserver.instance.disconnected).toBe(true);
```

## Implementation Patterns

### Pattern 1: Stable element measurement

**What it does:** Use when a component needs its own allocated content size, independent of viewport changes.

**When to use it:** Use when a component needs its own allocated content size, independent of viewport changes. The observer is created once, normalized values are deduplicated, and cleanup is explicit.

```js
function observeContentSize(element, onChange) {
  if (!element || !('ResizeObserver' in window)) return () => {};
  let previous = '';
  const observer = new ResizeObserver(([entry]) => {
    const size = { width: entry.contentRect.width, height: entry.contentRect.height };
    const key = `${size.width}:${size.height}`;
    if (key === previous) return;
    previous = key;
    onChange(size);
  });
  observer.observe(element);
  return () => observer.disconnect();
}
```
### Pattern 2: Frame-coalesced dashboard refresh

**What it does:** Use when multiple chart panels can resize during the same layout update.

**When to use it:** Use when multiple chart panels can resize during the same layout update. Keep the latest measurement per element and perform at most one expensive consumer update per animation frame.

```js
const pending = new Map();
let raf = 0;
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) pending.set(entry.target, entry.contentRect);
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    for (const [target, rect] of pending) refreshPanel(target, rect.width, rect.height);
    pending.clear();
  });
});
function dispose() { observer.disconnect(); if (raf) cancelAnimationFrame(raf); pending.clear(); }
```
### Pattern 3: High-DPI canvas

**What it does:** Use when a canvas must remain sharp on high-density screens.

**When to use it:** Use when a canvas must remain sharp on high-density screens. CSS controls layout; the observer updates the backing store and reapplies context transforms before drawing.

```js
const observer = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(width * dpr));
  const h = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(ctx, width, height);
});
observer.observe(canvas);
```
### Pattern 4: Component-level breakpoint state

**What it does:** Use when a JavaScript component needs a discrete mode because its available container space changes.

**When to use it:** Use when a JavaScript component needs a discrete mode because its available container space changes. Prefer CSS container queries for visual styling alone; keep thresholds stable and avoid resizing the measured element in response.

```js
let mode = 'wide';
const observer = new ResizeObserver(([entry]) => {
  const width = entry.contentRect.width;
  const next = mode === 'wide' && width < 440 ? 'compact' :
    mode === 'compact' && width > 472 ? 'wide' : mode;
  if (next !== mode) { mode = next; updateWidgetMode(mode); }
});
observer.observe(shell);
```
### Pattern 5: Third-party chart integration

**What it does:** Use when a charting library exposes a resize method and the chart container can change without the window changing.

**When to use it:** Use when a charting library exposes a resize method and the chart container can change without the window changing. Check the library's own scheduling behavior and call its resize API only when applied dimensions actually differ.

```js
let last = '';
const observer = new ResizeObserver(([entry]) => {
  const width = Math.round(entry.contentRect.width);
  const height = Math.round(entry.contentRect.height);
  const key = `${width}x${height}`;
  if (key === last || width < 1 || height < 1) return;
  last = key;
  chart.resize({ width, height });
});
observer.observe(chartHost);
```
### Pattern 6: Multi-target registry

**What it does:** Use when one controller owns several related elements and needs a single observation pipeline.

**When to use it:** Use when one controller owns several related elements and needs a single observation pipeline. Store per-target state in a map, update the entire batch, then notify consumers once. Remove registry entries when targets are removed.

```js
const state = new Map();
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) state.set(entry.target, {
    width: entry.contentRect.width, height: entry.contentRect.height
  });
  publishSizeSnapshot(state);
});
function add(target) { observer.observe(target); }
function remove(target) { observer.unobserve(target); state.delete(target); }
```
### Pattern 7: Safe framework hook

**What it does:** Use when a component framework owns the element reference and needs reactive dimensions.

**When to use it:** Use when a component framework owns the element reference and needs reactive dimensions. Create the observer in the effect/lifecycle hook, deduplicate state, and disconnect during cleanup. Account for server rendering and unsupported browsers.

```js
function useMeasuredSize(ref) {
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  React.useEffect(() => {
    const node = ref.current;
    if (!node || !window.ResizeObserver) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: Math.round(entry.contentRect.width), height: Math.round(entry.contentRect.height) };
      setSize((old) => old.width === next.width && old.height === next.height ? old : next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
```
### Pattern 8: Visibility plus size policy

**What it does:** Use when a renderer should pause while hidden or zero-sized.

**When to use it:** Use when a renderer should pause while hidden or zero-sized. Keep viewport visibility and box dimensions as separate inputs; one observer should not pretend to answer both questions.

```js
function applyRenderPolicy({ visible, width, height }) {
  if (!visible || width <= 0 || height <= 0) { renderer.pause(); return; }
  renderer.resize(width, height);
  renderer.resume();
}
```

## Mistake Catalog

| ID | Mistake | Why it fails | Fix |
|---|---|---|---|
| A | Listening only to `window.resize` | Parent or sibling layout changes are missed. | Observe the element whose allocation matters. |
| B | Observing and writing the same width | Can create a non-converging feedback cycle. | Observe a stable wrapper and write to a child. |
| C | Recreating the observer on each render | Adds churn and stale callbacks. | Keep the observer stable for the target lifecycle. |
| D | Never disconnecting | Retains callbacks and target references. | Return and call an explicit cleanup function. |
| E | Assuming one entry per callback | Multiple targets can be delivered together. | Iterate all entries and batch state updates. |
| F | Assuming `entries[0]` is always the target of interest | Entry order is not a target-selection contract. | Match `entry.target` or use a dedicated observer. |
| G | Mixing CSS and device pixels | Produces blurry or oversized canvases. | Track CSS dimensions and backing dimensions separately. |
| H | Multiplying by device-pixel ratio twice | Backing store becomes too large. | Label units and apply DPR exactly once. |
| I | Treating zero dimensions as invalid forever | Hidden panels may never resume correctly. | Pause at zero and resume on a later nonzero size. |
| J | Calling `getBoundingClientRect()` for every entry | Can trigger unnecessary layout work. | Use the measurement already supplied by the entry. |
| K | Performing a full chart rebuild for each delivery | Wastes work during resize bursts. | Coalesce updates and use the library's resize API. |
| L | Using JavaScript for purely visual breakpoints | Duplicates CSS layout rules. | Prefer CSS container queries when they meet the need. |
| M | Assuming width means inline size | Fails in vertical writing modes. | Use logical box sizes where layout semantics require them. |
| N | Rounding all measurements immediately | Loses useful fractional precision. | Round only at the consumer boundary that requires it. |
| O | Ignoring a loop warning | Can mask unstable layout logic. | Trace the observed node and every write that affects its size. |
| P | Adding RAF but not checking convergence | An oscillation can continue across frames. | Make the transform idempotent or remove the feedback dependency. |
| Q | Doing network work in the callback | Rendering work becomes unpredictable. | Schedule or trigger async work outside the measurement callback. |
| R | Forgetting to cancel a pending RAF | A disposed component can update after teardown. | Cancel the frame and clear pending measurements in cleanup. |
| S | Assuming the API always exists | Older or constrained environments can throw. | Feature-detect and provide a usable fallback. |
| T | Using size as a visibility signal | Offscreen elements can still have dimensions. | Combine size with a separate visibility policy when needed. |
| U | Updating framework state for identical values | Causes redundant renders. | Compare normalized values before publishing state. |
| V | Observing a node that later gets replaced | The observer stays attached to the old node. | Rebind observation when the target reference changes. |
| W | Ignoring browser delivery timing | Writes can trigger extra layout passes. | Collect measurements first and schedule bounded writes. |
| X | Testing only with mocked entries | Mocks cannot reproduce browser layout feedback. | Add browser-level tests that change actual container dimensions. |

## Mental Models

1. **Observe allocation, not intention.** The browser reports the box it laid out; it does not infer the design decision you wanted.
2. **Measure once, normalize once.** Convert browser entry data into a stable internal shape at the edge of the system.
3. **A callback is a batch.** Process all entries before publishing a coherent downstream update.
4. **Every observer has an owner.** The owner creates, rebinds, and disconnects it.
5. **A scheduled loop can still be a loop.** Moving a write to another frame does not make an unstable size relationship converge.
6. **CSS owns presentation.** Use JavaScript size observation for numerical or imperative work that CSS cannot do by itself.
7. **Zero is information.** It often means a panel is collapsed or not yet laid out, not that the measurement API failed.
8. **Units are part of the type.** CSS pixels and device pixels must not share an ambiguous variable name.
9. **Visibility and size are different facts.** An offscreen element can have a nonzero box.
10. **Cleanup is behavior.** A component is not correct if it works while mounted but continues to run after disposal.

## Accessibility and Semantic Markup

Resize-driven code should adapt presentation without hiding information or changing the user's reading order unexpectedly. Prefer semantic elements such as `main`, `section`, `article`, `aside`, `nav`, `header`, `footer`, `figure`, `figcaption`, `button`, `form`, `label`, `fieldset`, `legend`, `table`, `caption`, `thead`, `tbody`, `th`, `td`, `ul`, `ol`, and `li` according to the content. Do not create generic nested wrappers when an existing semantic element expresses the relationship. A chart container should have an accessible name and an adjacent textual summary or data table when the chart conveys important information.

```html
<section aria-labelledby="revenue-heading">
  <h2 id="revenue-heading">Revenue by month</h2>
  <p id="revenue-summary">Revenue rises through the second quarter and falls in August.</p>
  <div class="chart-shell" role="img" aria-label="Revenue by month chart" aria-describedby="revenue-summary">
    <canvas aria-hidden="true"></canvas>
  </div>
  <table>
    <caption>Monthly revenue values</caption>
    <thead><tr><th scope="col">Month</th><th scope="col">Revenue</th></tr></thead>
    <tbody><tr><th scope="row">January</th><td>$12,000</td></tr></tbody>
  </table>
</section>
```

Do not move keyboard focus in response to a size change. Do not announce every pixel measurement to assistive technology. If resizing changes available controls or content structure, preserve keyboard order, visible focus, and labels. Interactive controls must remain reachable with keyboard navigation and have visible `:focus-visible` styling. Test zoom at 200% and 400%, narrow viewports, increased text size, and screen-reader access. The visual layout can adapt, but the information hierarchy must remain understandable.

```css
.chart-shell:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

.chart-shell {
  min-width: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
}
```

## Performance and Browser Support

Use one observer for related targets when that simplifies ownership and batching. Avoid creating observers in hot render paths, expensive synchronous work in callbacks, and unnecessary state updates. For large dashboards, profile the cost of downstream chart refreshes and track both observer callback count and consumer work. Use the Performance panel to inspect layout recalculation, forced synchronous layout, long tasks, and repeated rendering. Use the Elements panel to inspect the observed box, computed dimensions, and ancestors that constrain it. DevTools console warnings about undelivered resize notifications are clues to investigate, not messages to suppress.

`ResizeObserver` is supported in modern evergreen browsers, but applications with older browser requirements should feature-detect the API and define a fallback behavior. A `window.resize` fallback cannot detect all element-level changes; document that limitation and provide an explicit refresh path for parent-driven changes. Test Chromium, Firefox, and WebKit if those engines are part of the support matrix. For canvas sharpness, test high-DPI displays and browser zoom. For writing modes or fragmented elements, test the logical box-size handling rather than assuming a single horizontal fragment.

## Quick Reference

| Need | Preferred approach | Notes |
|---|---|---|
| Measure allocated content area | `entry.contentRect` | CSS-pixel width and height. |
| Include padding and border | `borderBoxSize` / box option | Confirm support and semantics. |
| Preserve logical dimensions | `contentBoxSize` | Use inline/block sizes where relevant. |
| Sharp canvas backing store | Device-pixel size or DPR fallback | Do not multiply DPR twice. |
| Multiple targets | One observer plus target map | Process the entire entry batch. |
| Prevent duplicate refresh | Normalize and deduplicate | Match the consumer's applied resolution. |
| Expensive redraw | RAF coalescing | Keep latest measurement per target. |
| Avoid resize feedback | Stable wrapper and idempotent writes | RAF alone does not guarantee convergence. |
| Element-level breakpoints | CSS container queries first | JS only if behavior needs JS state. |
| Hidden or collapsed panel | Pause at zero; resume later | Keep visibility as a separate signal. |
| Framework integration | Lifecycle hook plus cleanup | Rebind if target node changes. |
| Unsupported API | Feature detection and fallback | Be honest about fallback limitations. |
| Debug a loop warning | Trace observed node and writes | Check ancestors and computed dimensions. |
| Test rapid changes | Deliver bursts in unit and browser tests | Assert final size and cleanup. |

## Production Build Challenge: Responsive Analytics Panel

Build a responsive analytics panel that contains a chart canvas, a textual summary, and a data table. The container may be resized by viewport changes, a collapsible sidebar, a draggable split pane, a font change, and a tab becoming visible. The implementation must remain correct when the container is zero-sized, rapidly resized, unmounted, or used in an environment without `ResizeObserver`.

### Requirements

1. Create semantic markup with a named section, heading, chart description, canvas, and accessible table.
2. Keep the panel's CSS layout usable before JavaScript starts.
3. Observe the panel's content box rather than relying solely on `window.resize`.
4. Normalize the observation into explicit CSS-pixel width and height values.
5. Process all entries in a callback instead of assuming one entry.
6. Deduplicate values at the resolution used by the chart renderer.
7. Coalesce expensive chart updates to at most one update per animation frame.
8. Keep CSS layout dimensions separate from canvas backing-store dimensions.
9. Account for device-pixel ratio when sizing the canvas buffer.
10. Reapply canvas transforms after a backing-store dimension change.
11. Pause drawing when either measured dimension is zero or invalid.
12. Resume drawing when a valid size returns without losing chart state.
13. Ensure the callback does not write a new size to the same observed box in a way that oscillates.
14. Provide explicit cleanup that disconnects the observer and cancels pending frames.
15. Handle a replaced target node by unobserving the old target and observing the new one.
16. Feature-detect `ResizeObserver` and document the fallback's limitations.
17. Use CSS container queries for presentation-only breakpoints where possible.
18. Preserve keyboard focus, visible `:focus-visible` styling, labels, and reading order.
19. Add a unit test using an injected fake observer to verify batching and cleanup.
20. Add a browser test that resizes the actual container without changing the viewport.
21. Add a failure test for a hidden-to-visible transition and a zero-sized container.
22. Add a failure test for repeated resize oscillation and verify the layout converges.
23. Record callback count and chart-refresh count during a rapid resize burst.
24. Verify behavior at 200% zoom and on a high-DPI display.
25. Inspect the Performance panel and console for repeated layout, long tasks, and resize-loop warnings.

### Definition of Done

- [ ] The panel updates when its own container changes size even if the viewport is unchanged.
- [ ] Multiple entries are handled and downstream work is coalesced.
- [ ] Canvas rendering remains sharp without applying device-pixel ratio twice.
- [ ] Zero-sized targets do not produce invalid drawing or permanently disable the panel.
- [ ] Cleanup prevents callbacks or frames from running after disposal.
- [ ] The feedback-loop test converges and produces no recurring resize warning.
- [ ] The unsupported-browser path remains usable and has a documented limitation.
- [ ] Keyboard users and assistive-technology users can understand the chart's purpose and access the underlying data.
- [ ] Browser tests pass in each engine included in the product's support matrix.
- [ ] DevTools profiling shows no avoidable resize storm or repeated full chart rebuild.

## Gotchas Checklist

- **Gotcha:** A `ResizeObserver` callback is not a record of every intermediate dimension. If you need the latest state, coalesce; if you need a history, create an explicit application-level log.
- **Gotcha:** `contentRect` measures content-box CSS pixels, while `getBoundingClientRect()` measures a transformed visual rectangle. Choose intentionally.
- **Gotcha:** Setting `canvas.width` or `canvas.height` resets its drawing state. Restore transforms and context settings after changing the backing store.
- **Gotcha:** A `requestAnimationFrame` wrapper can move an oscillation across frames without fixing it. Check whether the size relationship converges.
- **Gotcha:** A nonzero box does not prove an element is visible to the user. Combine independent visibility and size signals when rendering policy requires both.
- **Gotcha:** A `window.resize` fallback is not equivalent to `ResizeObserver`. Parent and content changes may happen without viewport resizing.
- **Gotcha:** Logical `inlineSize` and `blockSize` are not always physical width and height in vertical writing modes.
- **Gotcha:** A callback that refreshes several expensive charts synchronously can still cause a long task even if the observer itself is efficient.

## Final Engineering Checklist

Before shipping, verify ownership, cleanup, target replacement, measurement units, deduplication, zero-size handling, coalescing, canvas pixel ratio, CSS-vs-JavaScript responsibility, browser fallback, accessibility, and actual browser tests. The safest implementation is not the one with the most abstractions; it is the one whose measurement source, write destination, lifecycle, and convergence properties are easy to explain and test.

## 13. Handle Fragmented Layout and Logical Dimensions

Some elements may be fragmented across columns or pages, and modern size properties can expose a sequence of box sizes. Many applications intentionally support only a single fragment; if that is the case, make the assumption explicit and avoid silently reading a property that might be absent. For writing-mode-aware components, use logical inline and block sizes where appropriate. A chart usually expects physical width and height, while a writing-mode-aware text layout tool may need inline and block sizes.

```js
function readLogicalContentSize(entry) {
  const value = entry.contentBoxSize;
  const first = value && (Array.isArray(value) ? value[0] : value);
  if (first) return { inlineSize: first.inlineSize, blockSize: first.blockSize };
  return { inlineSize: entry.contentRect.width, blockSize: entry.contentRect.height };
}
```

If fragmented content matters to the product, define whether dimensions should be aggregated, treated as separate fragments, or rejected as unsupported. Do not sum fragment sizes without understanding how the consumer uses them; total inline extent and physical bounding rectangle are different concepts.

## 14. Coordinate Resize With Other Layout Engines

A component can depend on multiple layout systems: CSS layout, a chart library, a virtualizer, a map, and an animation engine. Define one owner for each refresh operation. If both a chart wrapper and a global layout manager refresh the chart for the same change, duplicate work can occur. Prefer a small adapter that accepts normalized dimensions and decides whether to refresh, rather than letting every observer callback call into third-party APIs directly.

```js
function createLayoutAdapter(engine) {
  let previous = '';
  return function apply(width, height) {
    if (width <= 0 || height <= 0) return;
    const key = `${Math.round(width)}x${Math.round(height)}`;
    if (key === previous) return;
    previous = key;
    engine.resize(width, height);
  };
}
```

The adapter centralizes deduplication and makes it easier to instrument refresh count. If an engine already observes its host element internally, do not add a second observer without a clear reason. Read the library documentation and verify which system is responsible for scheduling layout.
