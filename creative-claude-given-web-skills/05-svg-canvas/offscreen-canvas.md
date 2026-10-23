# OffscreenCanvas — Production Skill Guide

> **Purpose:** Design, implement, debug, and ship responsive Canvas workloads using `OffscreenCanvas`, worker messaging, and explicit rendering lifecycles.
>
> **Use this skill when:** a Canvas 2D or WebGL scene has enough simulation, rasterization, image processing, or repeated drawing work to compete with main-thread interaction, and profiling shows that moving work off the main thread is likely to improve responsiveness.
>
> **Do not use this skill by default:** `OffscreenCanvas` introduces lifecycle, message protocol, fallback, and debugging complexity. A small chart, icon, or low-cost canvas usually belongs on the main thread until measurements demonstrate a problem.

## Operating principles

Offscreen rendering is an architecture decision, not a magic performance switch. It changes where drawing work runs, but it does not make an expensive algorithm cheaper, remove GPU contention, guarantee zero-copy transfer for every resource, or solve unbounded rendering loops. The quality of an implementation depends on clear ownership, bounded messages, correct resize semantics, robust failure handling, and a fallback that preserves the user-facing result.

- **Measure before moving work.** Record main-thread long tasks, frame time, input latency, and rendering cost before introducing a worker.
- **Give each canvas one owner.** A transferred HTML canvas should not also be rendered through its original main-thread context.
- **Treat messages as a protocol.** Define message types, validation, dimensions, versioning, and error handling rather than sending ambiguous objects.
- **Bound every workload.** Cap pixel ratio, image dimensions, queued updates, and simulation steps. A worker can still consume all available CPU.
- **Make resize explicit.** CSS size, backing-store size, and device-pixel ratio are separate values; communicate the intended dimensions to the renderer.
- **Plan a fallback.** Feature detection must happen before transferring the canvas, because transfer is a one-way ownership change for that HTML canvas instance.
- **Respect the page lifecycle.** Pause or reduce work when hidden, clean up listeners, and terminate workers when the component is permanently removed.
- **Keep the main thread responsive.** The worker should own heavy computation and drawing, while the main thread owns DOM semantics, controls, layout, and accessible status messages.

### 1. Mental model: a worker is a separate execution context

A Web Worker runs JavaScript in a separate global context. It cannot directly manipulate the document or query DOM nodes. It can perform computation, receive structured-cloneable data, and send messages to the main thread. `OffscreenCanvas` makes a canvas rendering surface available in that worker context. This allows drawing commands to be issued without requiring each frame's JavaScript work to execute on the main thread.

The distinction is important: moving a loop to a worker does not mean the work disappears. CPU time is still consumed, memory is still allocated, and graphics resources are still used. The benefit is isolation from many main-thread tasks such as event handling, DOM updates, style calculation, and layout. If the worker saturates the CPU or creates too many messages, overall responsiveness can still suffer.

Start with a clear ownership diagram: the DOM component measures its visible box and handles controls; the worker owns scene state and canvas drawing; messages carry only necessary state changes; the main thread updates accessible HTML outside the canvas. This makes the design easier to test and easier to fall back from.

```js
// Main-thread ownership: DOM, controls, layout, and worker lifecycle.
const canvas = document.querySelector('#visualization');
const status = document.querySelector('#render-status');
const startButton = document.querySelector('#start-render');

// Worker ownership: scene state, simulation, and drawing commands.
// The worker cannot query `status` or `startButton` from the DOM.
```

### 2. Decide whether OffscreenCanvas is warranted

Use a worker when profiling indicates the main thread is spending meaningful time on canvas drawing or the computation that prepares each frame. Examples include dense particle systems, large procedural scenes, repeated image processing, large data visualizations, and interactive visualizations that need to remain responsive while doing nontrivial calculations.

Avoid adding a worker solely because the API exists. A worker adds a separate file or module entry point, message serialization, resize coordination, failure states, and a more complex development workflow. If the scene takes only a fraction of a millisecond per frame, moving it may not improve the user experience and may even make it worse due to communication overhead.

Benchmark realistic devices and scenes. A high-end desktop can hide problems that appear on a mid-range mobile device. Measure the cost of the main-thread version, the worker version, and the complete user interaction path. Include startup time, transfer time, resize events, and teardown, not only steady-state frames.

```js
// Record coarse timings around the work you suspect is expensive.
const startedAt = performance.now();
renderScene(ctx, scene);
const renderMs = performance.now() - startedAt;
if (renderMs > 8) {
  console.warn('Canvas render exceeded the 8 ms budget:', renderMs);
}
```

An 8 ms warning is a diagnostic threshold, not a universal pass/fail rule. At 60 Hz a frame budget is about 16.7 ms, and other browser work also needs time. At 120 Hz the budget is about 8.3 ms. Use the actual target refresh rate and a trace rather than treating a single number as proof.

### 3. Feature detection and the irreversible transfer boundary

Check support before calling `transferControlToOffscreen()`. That method transfers control of the HTML canvas to an `OffscreenCanvas`; the original canvas should not then be initialized with `getContext()` on the main thread. If worker construction fails after transfer, the safest recovery is often to replace the HTML canvas element with a fresh one and initialize the fallback on the replacement. Design this boundary before coding.

Feature detection is not identical to browser detection. Test the API you intend to use, and separately handle worker module support, context support, and any optional capabilities. Avoid brittle user-agent checks; browser versions change, embedded browsers vary, and feature availability can depend on execution context.

```js
function canUseOffscreenCanvas() {
  return typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function' &&
    typeof Worker !== 'undefined';
}

if (canUseOffscreenCanvas()) {
  // Attempt worker rendering only after checking the complete path.
} else {
  // Keep a main-thread Canvas 2D renderer available.
}
```

If the canvas is transferred and the worker later fails, do not assume the original element can be reclaimed for ordinary main-thread rendering. Replace it, preserve its relevant attributes and dimensions, and attach the fallback renderer to the new element. This ownership rule is one of the most important design constraints in the entire skill.

### 4. Transfer the canvas exactly once

The main thread obtains an `OffscreenCanvas` by calling `transferControlToOffscreen()` and passes it to the worker using the transfer list. A transfer list is not optional decoration: it tells the structured-clone machinery to transfer ownership of transferable resources rather than trying to clone them as ordinary data. The canvas should be transferred once for the lifetime of that DOM canvas element.

Avoid sending the same canvas through multiple initialization messages or trying to use it from both contexts. Keep a small initialization state machine: `created`, `transferring`, `ready`, `failed`, `disposed`. It becomes easier to prevent duplicate initialization and to decide what to do after a worker error.

```js
const canvas = document.querySelector('#visualization');
const worker = new Worker(new URL('./renderer.worker.js', import.meta.url), {
  type: 'module',
});
const offscreen = canvas.transferControlToOffscreen();
worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
```

This example assumes a bundler that supports `new URL(..., import.meta.url)`. In a plain static project, use a worker URL that your deployment serves correctly. Verify that the worker script has the expected MIME type and that Content Security Policy allows it. Do not create the worker from a blob URL unless you have a clear reason and have checked your security policy.

### 5. Initialize the rendering context inside the worker

The worker receives the transferred surface and asks it for a rendering context. Treat context acquisition as fallible. The returned value may be `null` if the requested context cannot be created. Keep initialization errors visible to the main thread through a typed error message, and avoid beginning an animation loop before a valid context and dimensions are established.

The worker should validate the message type and the presence of a canvas before storing the reference. A malformed message should not crash an otherwise healthy worker or create an unbounded error loop. For a small application, a narrow protocol with a few message types is easier to reason about than a generic message bus.

```js
// renderer.worker.js
let canvas = null;
let ctx = null;
let width = 0;
let height = 0;

self.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || typeof message.type !== 'string') return;

  if (message.type === 'init') {
    canvas = message.canvas;
    if (!canvas || typeof canvas.getContext !== 'function') {
      self.postMessage({ type: 'error', code: 'INVALID_CANVAS' });
      return;
    }
    ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      self.postMessage({ type: 'error', code: 'CONTEXT_UNAVAILABLE' });
      return;
    }
    self.postMessage({ type: 'ready' });
  }
});
```

Keep initialization separate from frame rendering. If initialization fails, stop there and let the main thread choose a fallback. Do not keep scheduling frames with a null context or silently display a blank region. A visible status message is useful during development; in production, it can be a discreet accessible status or a static alternative.

### 6. Define a versioned message protocol

Messages are the interface between the DOM component and renderer. Name each message with a stable `type`, keep payloads small, and validate values at the boundary. For example, `init`, `resize`, `pointer`, `set-scene`, `pause`, `resume`, and `dispose` describe intent. A protocol helps the worker reject invalid data and makes future changes easier to test.

Use structured-cloneable values. Functions, DOM nodes, and many class instances cannot be sent as ordinary message data. For frequent updates, avoid sending huge arrays every frame; send compact deltas, transferable typed arrays, or immutable configuration that the worker can retain. If a message can arrive after disposal, the worker should ignore it rather than recreate resources unexpectedly.

```js
const PROTOCOL_VERSION = 1;
function sendWorkerMessage(worker, type, payload = {}) {
  worker.postMessage({ version: PROTOCOL_VERSION, type, ...payload });
}

function isSupportedMessage(message) {
  return Boolean(message) &&
    message.version === PROTOCOL_VERSION &&
    typeof message.type === 'string';
}
```

A protocol version is particularly useful when the main thread and worker bundle can be cached or deployed independently. Most bundlers keep them together, but service workers, stale tabs, and long-lived sessions can still create mismatches. If versioning feels excessive for a tiny prototype, at least define a consistent message shape and validate it centrally.

### 7. Separate CSS size from backing-store size

A canvas has a CSS layout size and a backing-store pixel size. CSS determines how large the canvas appears in the page; `canvas.width` and `canvas.height` determine the number of pixels available for drawing. On high-density displays, a backing store equal to the CSS dimensions can look blurry. A common approach is to multiply the CSS dimensions by a capped device-pixel ratio and scale the context so drawing coordinates remain in CSS pixels.

With OffscreenCanvas, the worker usually receives explicit dimensions from the main thread. `OffscreenCanvas` does not automatically know the DOM element's CSS box, because the worker does not own the DOM layout. Use `ResizeObserver` on the main thread to observe the component, then send measured CSS dimensions and the desired pixel ratio to the worker.

```js
const resizeObserver = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  sendWorkerMessage(worker, 'resize', {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
    dpr: Math.min(window.devicePixelRatio || 1, 2),
  });
});
resizeObserver.observe(canvas);
```

Avoid reading `getBoundingClientRect()` in a tight loop. Measure on resize or when a layout change is known. If the visual is inside a hidden tab or a collapsed panel, it may report zero dimensions; treat that as a paused or pending state instead of allocating a zero-sized simulation and drawing indefinitely.

### 8. Resize safely in the worker

When the worker receives a resize message, validate the dimensions, cap the pixel ratio, update the backing store, and restore any context state that resetting the dimensions invalidates. Setting `canvas.width` or `canvas.height` resets the bitmap and context state, so transforms, styles, clipping, and other settings may need to be re-established. Do not blindly assign the same dimensions on every update; unnecessary resets clear the canvas and can create flicker.

Keep the resize operation idempotent. A message that repeats the current dimensions should not rebuild expensive caches or reset the scene unless that is intentional. Use CSS-pixel dimensions for layout and world coordinates; use device-pixel ratio only for the backing store. This keeps pointer positions and scene geometry independent of display density.

```js
function resizeSurface(nextWidth, nextHeight, nextDpr) {
  const safeWidth = Math.max(1, Math.floor(nextWidth));
  const safeHeight = Math.max(1, Math.floor(nextHeight));
  const dpr = Math.min(Math.max(nextDpr || 1, 1), 2);
  const pixelWidth = Math.round(safeWidth * dpr);
  const pixelHeight = Math.round(safeHeight * dpr);

  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
  width = safeWidth;
  height = safeHeight;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
```

A pixel-ratio cap is a product decision, not a universal constant. Dense canvases can consume substantial memory because the backing store scales with area: doubling both width and height means four times as many pixels. For a decorative hero background, a capped ratio may be indistinguishable to most users while substantially reducing memory and fill cost.

### 9. Use a bounded animation loop

The worker can use `requestAnimationFrame` for frame scheduling in environments that support it in the worker context, but do not assume that every browser/version exposes identical behavior. Feature-detect the method in the worker and provide a controlled fallback strategy where required. A timer fallback is not equivalent to vsync and should be used carefully; if a fallback is necessary, cap the update rate and ensure it stops when paused.

Use elapsed time in seconds rather than incrementing positions by a fixed amount per frame. Cap large deltas after a background pause to prevent objects from teleporting. Separate update and render functions so physics can be tested without a real canvas and the renderer can be optimized independently.

```js
let rafId = 0;
let previousTime = 0;
let running = false;

function frame(now) {
  if (!running) return;
  const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
  previousTime = now;
  updateScene(dt);
  drawScene(ctx);
  rafId = self.requestAnimationFrame(frame);
}

function start() {
  if (running || typeof self.requestAnimationFrame !== 'function') return;
  running = true;
  previousTime = 0;
  rafId = self.requestAnimationFrame(frame);
}
```

The loop needs an explicit stop path. `cancelAnimationFrame(rafId)` prevents the next scheduled callback; a `running` flag prevents rescheduling from a callback already executing. Clear both consistently. Do not keep a hidden loop alive because the canvas is merely offscreen; page visibility and component visibility are lifecycle signals that should be considered.

### 10. Handle pause, resume, and disposal as separate states

Pause means the renderer remains initialized but should not perform ongoing work. Resume means it can schedule frames again. Dispose means it releases resources and stops accepting new work. These states should not be conflated. A user pausing a visualization should not force a full worker restart, while removing a component should not leave a paused worker consuming memory indefinitely.

A useful lifecycle is `initializing → ready → running ↔ paused → disposed`, with a separate `failed` state. Guard every transition. A repeated pause should be harmless; resume after disposal should do nothing; and a late pointer message after disposal should be ignored. The main thread should also remove event listeners and disconnect observers when disposing the component.

```js
function stop() {
  running = false;
  if (rafId) self.cancelAnimationFrame(rafId);
  rafId = 0;
  previousTime = 0;
}

function dispose() {
  stop();
  ctx = null;
  canvas = null;
  scene = null;
  self.postMessage({ type: 'disposed' });
  self.close();
}
```

Calling `self.close()` ends the worker's global execution context. Use it only when disposal is permanent. For a temporary pause, retain the worker and its scene state if that is appropriate. Cleanup is part of correctness, not merely a memory optimization: leaked workers can keep CPU work alive, preserve references, and make navigation or hot reload unpredictable.

### 11. Control message traffic

A worker is not automatically faster if the main thread sends every pointer event and the worker echoes every frame. Message dispatch and data cloning have costs. For high-frequency input, coalesce pointer updates so only the latest position is sent per animation frame, or use a shared state mechanism only when its complexity is justified and security/isolation requirements are met.

Do not send DOM objects, entire application stores, or large JSON structures when the worker needs only a few numbers. Prefer messages like `{ type: 'pointer', x, y, active }`. Validate finite numeric values and clamp them to the canvas bounds if that matches the interaction model. If the worker sends telemetry, rate-limit it; a per-frame debug message can flood the main thread and erase the benefit of offloading.

```js
let pendingPointer = null;
let pointerFlushScheduled = false;

function queuePointer(x, y, active) {
  pendingPointer = { x, y, active };
  if (pointerFlushScheduled) return;
  pointerFlushScheduled = true;
  requestAnimationFrame(() => {
    pointerFlushScheduled = false;
    if (pendingPointer && worker) {
      sendWorkerMessage(worker, 'pointer', pendingPointer);
      pendingPointer = null;
    }
  });
}
```

The main thread's `requestAnimationFrame` here only coalesces input; the worker still owns rendering. If the pointer leaves the component, send an inactive state. If the visual does not need pointer input while paused, stop forwarding it. These small protocol decisions help prevent stale interaction state and unnecessary work.

### 12. Choose transferable data intentionally

Structured cloning is convenient for small messages, but copying large buffers repeatedly can be expensive. Transferable `ArrayBuffer` objects can move ownership between contexts without copying their underlying storage in the same way as ordinary cloned data. After transfer, the sender's buffer is detached and should not be treated as usable. This ownership transfer must be reflected in the code's state model.

Use transferables for large one-way payloads such as precomputed vertex arrays, image-processing buffers, or generated data that the sender no longer needs. If both contexts need the same mutable data, a transfer is not the right abstraction by itself. Shared memory requires a more complex design and, in browsers, may depend on cross-origin isolation headers. Never assume shared-memory features are available without checking deployment requirements.

```js
const samples = new Float32Array(200_000);
fillSamples(samples);
worker.postMessage({ type: 'samples', buffer: samples.buffer }, [samples.buffer]);
// `samples.buffer` has been transferred; don't read it as though it remained owned here.
```

For recurring updates, consider double buffering: the worker consumes one buffer while the main thread prepares another, then ownership swaps. The design needs a clear acknowledgement protocol so neither side writes into a buffer currently being read. For many UI scenes, sending a compact configuration is simpler and more reliable than building a custom buffer pipeline.

### 13. Use ImageBitmap and image resources deliberately

`ImageBitmap` can be useful when transferring decoded image content to a worker or when an image resource is reused for drawing. Its exact benefits depend on browser implementation and how the image was created. Close disposable `ImageBitmap` resources when they are no longer needed. If an image is decoded or generated in the worker, handle load failures and avoid redrawing the entire image source on every frame when it is static.

For image-heavy scenes, distinguish image decoding cost, transfer cost, texture upload cost, and per-frame drawing cost. A worker can move decoding and drawing logic, but large image dimensions still consume memory and graphics bandwidth. Downsample images to the actual display need, reuse assets, and avoid repeatedly creating new bitmaps for unchanged content.

```js
async function loadBitmap(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
  const blob = await response.blob();
  return createImageBitmap(blob);
}

// When a bitmap is permanently discarded:
bitmap.close();
```

The example assumes the URL is permitted by the page's network and security policy. For cross-origin images, verify CORS behavior and server headers. Do not treat a successful fetch of one image as proof that every asset origin is configured correctly.

### 14. Errors and fallback recovery

Worker failures can arise from construction errors, script loading, syntax errors, runtime exceptions, context acquisition failures, invalid messages, and resource exhaustion. Handle both `error` and `messageerror` events on the worker. Send structured error codes from expected failure paths; reserve generic error events for unexpected failures. Avoid exposing raw internal stack traces to end users, but preserve enough diagnostics in development to find the cause.

Because canvas transfer is a one-way ownership boundary, fallback recovery should be planned before initialization. If transfer has already happened, create a replacement HTML canvas and configure the main-thread renderer on that element. Preserve semantic relationships, classes, styles, dimensions, and any accessible label. Do not remove the only meaningful visual content without replacing it with a static or simplified alternative.

```js
function replaceTransferredCanvas(oldCanvas) {
  const replacement = document.createElement('canvas');
  replacement.className = oldCanvas.className;
  replacement.setAttribute('aria-label', oldCanvas.getAttribute('aria-label') || 'Visualization');
  replacement.width = oldCanvas.width;
  replacement.height = oldCanvas.height;
  oldCanvas.replaceWith(replacement);
  return replacement;
}
```

A replacement should be treated as a new resource with a new lifecycle. Reattach any necessary observers and event listeners to the new element. Avoid retry loops that continuously spawn workers after the same failure; record the failure state and use the fallback until a deliberate retry is triggered.

### 15. Accessibility belongs to the DOM wrapper

A canvas bitmap does not expose its internal shapes as semantic elements to screen readers. OffscreenCanvas does not change that limitation. The main thread should provide meaningful DOM content around the canvas: a descriptive label, a short explanation, a textual summary or table for data, and controls with native semantics. Use `<figure>` and `<figcaption>` when the visual is a figure; use `<section>` with a heading when it is a distinct content region; use a `<button>` for an actual action.

```html
<section aria-labelledby="viz-heading">
  <h2 id="viz-heading">Network activity</h2>
  <p id="viz-description">The visualization shows relative traffic volume over time.</p>
  <canvas id="visualization" role="img" aria-label="Network activity visualization"
          aria-describedby="viz-description"></canvas>
  <p id="render-status" role="status" aria-live="polite">Visualization ready.</p>
  <button id="pause-render" type="button">Pause animation</button>
  <details>
    <summary>Read the data in text form</summary>
    <table><caption>Network activity summary</caption>
      <thead><tr><th scope="col">Period</th><th scope="col">Activity</th></tr></thead>
      <tbody><tr><th scope="row">Morning</th><td>Moderate</td></tr></tbody>
    </table>
  </details>
</section>
```

Do not use `role="img"` if the canvas itself is an interactive control surface whose individual objects need independent keyboard access. In that case, provide a semantic DOM interaction model alongside the canvas or use SVG/DOM for the interactive elements. Keep focus indicators visible with `:focus-visible`, support keyboard activation, and ensure the pause control has a clear label that changes when the state changes. Accessibility is a product requirement, not an optional polish pass.

### 16. Reduced motion and user control

A worker loop can continue moving even when the user prefers reduced motion unless the application explicitly tells it to stop or switch modes. Read `prefers-reduced-motion` on the main thread, choose a reduced-motion mode, and communicate that choice to the worker. A reduced mode might render a static frame, lower particle velocity, remove parallax, or update only in response to user input. The appropriate choice depends on whether motion is informational or decorative.

The media query is a preference signal, not a substitute for a visible pause control when continuous animation is substantial. Keep the user's explicit pause state separate from the system preference so that the UI can explain why motion is reduced and still respect a deliberate pause. When the preference changes while the page is open, update the worker rather than checking only at startup.

```js
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function applyMotionPreference() {
  sendWorkerMessage(worker, 'motion-mode', {
    reduced: motionQuery.matches,
  });
}
motionQuery.addEventListener('change', applyMotionPreference);
applyMotionPreference();
```

Remove the media-query listener during component teardown. The worker should interpret the message predictably: if `reduced` is true, stop continuous movement or render the defined low-motion state. Avoid a reduced mode that still animates almost as aggressively as the normal mode. Test this behavior with the operating-system preference enabled, not only by inspecting the CSS.

### 17. Security, CSP, and deployment constraints

Workers are affected by deployment configuration. A worker script must be served from an allowed location, and Content Security Policy may restrict worker sources. Module workers also rely on the server delivering modules with appropriate MIME types. Relative URLs can behave differently after bundling, route changes, or deployment under a subpath. Test the production build at its real base path rather than relying only on the development server.

If the worker fetches assets, those requests are subject to origin rules and server policy. Do not insert untrusted strings into HTML to display worker errors. Validate messages even when they originate from your own code, because stale bundles, unexpected events, and bugs can still produce malformed payloads. Avoid embedding secrets in worker source; worker scripts are client-side code and can be inspected by users.

Cross-origin isolation may be required for particular shared-memory approaches. Enabling it can affect third-party resources and embedded content, so do not introduce `SharedArrayBuffer` as a casual optimization. Start with ordinary messages and transferables, and only adopt shared memory when profiling shows a need and the hosting environment can support the required headers consistently.

```js
// Keep deployment policy explicit instead of silently depending on shared memory.
const sharedMemoryAvailable = typeof SharedArrayBuffer !== 'undefined';
if (!sharedMemoryAvailable) {
  console.info('Using the message-based renderer protocol.');
}
```

### 18. Debugging across two execution contexts

A worker has its own console, call stack, and lifecycle. Open browser DevTools, locate the worker in the Sources or Threads panel (the label varies by browser), and inspect its script and runtime errors. Add clear message logs during development, but avoid logging every frame. Include a message type, sequence number, and relevant dimensions in diagnostic records so that ordering problems can be reconstructed.

When the canvas is blank, check the pipeline in order: was the worker created; did the init message arrive; was the canvas transferred; did context acquisition succeed; did a resize message set non-zero dimensions; did the worker schedule a frame; did drawing occur; and is the DOM canvas visible and sized correctly? This sequence prevents random changes to draw code when the actual problem is initialization or CSS.

```js
function debugState(label, state) {
  if (!import.meta.env?.DEV) return;
  console.debug(`[renderer] ${label}`, {
    lifecycle: state.lifecycle,
    width: state.width,
    height: state.height,
    running: state.running,
  });
}
```

The `import.meta.env.DEV` expression is a Vite convention, not a browser standard. Replace it with your bundler's development flag or a build-time constant. In a plain browser script, use a project-defined debug flag. Keep diagnostic output behind a development guard and remove sensitive data from logs.

### 19. Performance budgets and profiling

Measure startup, steady-state frame cost, main-thread long tasks, worker CPU time where available, message frequency, memory, and input responsiveness. `OffscreenCanvas` is useful if it reduces contention on the main thread, but it may not improve frame rate when the bottleneck is GPU fill rate, too many alpha layers, large blur operations, oversized backing stores, or a scene that redraws more pixels than necessary.

Use a realistic pixel budget. Canvas backing-store memory grows with width × height × bytes per pixel, and the actual memory cost may be larger due to browser/GPU allocation and intermediate surfaces. Reduce device-pixel ratio for large decorative surfaces, cap dimensions, cache static layers, and avoid full-surface clearing when a smaller dirty region is appropriate. Be cautious with transparent layers, shadows, and filters that increase fill cost.

The compositor may still need to composite the canvas into the page, and GPU work can contend with CSS transforms, video, and other canvases. `will-change` does not optimize Canvas drawing itself; it is a CSS hint and should be used sparingly on DOM elements when profiling supports it. Do not apply `will-change` indiscriminately to every visual container. Measure with the Performance panel and rendering diagnostics rather than inferring performance from a smooth desktop preview.

```js
function summarizeFrameTimes(frameTimes) {
  const sorted = [...frameTimes].sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
  return { p50: percentile(0.50), p95: percentile(0.95), p99: percentile(0.99) };
}
```

### 20. Browser support and graceful degradation

`OffscreenCanvas` support and details have varied across browser families and versions, especially for different contexts and worker capabilities. Check current compatibility data for the exact features you use, including worker rendering, context type, `requestAnimationFrame` in workers, and any transferables. Test current Chrome/Edge, Firefox, Safari, and mobile Safari versions relevant to your audience. Avoid a blanket statement that “Canvas is supported” as proof that every OffscreenCanvas path is supported.

Use capability detection at runtime and keep the fallback functional. `@supports` can help with CSS features but does not detect JavaScript APIs; use `typeof` checks and guarded initialization for those. Keep the static alternative useful when scripting is unavailable or the worker fails. A main-thread Canvas 2D implementation is often the simplest fallback, but a static image or data table may be better when the scene is decorative or informational.

```js
const supportsTransfer = typeof HTMLCanvasElement !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype;
const supportsWorker = typeof Worker !== 'undefined';
const supportsOffscreenRAF = typeof self.requestAnimationFrame === 'function';
```

These checks are necessary but not sufficient. A feature can exist and still fail in a particular context due to resource limits, security policy, or implementation bugs. Treat context acquisition and worker initialization as runtime operations that can fail, and exercise fallback paths in tests rather than assuming the happy path is enough.

### 21. Testing strategy

Test the pure scene model independently from the worker. Test message validation with missing fields, unknown message types, invalid dimensions, and out-of-order lifecycle messages. Test the renderer in a real browser because canvas pixels, worker scheduling, transfer behavior, and graphics performance cannot be fully validated by a simple unit test. Add an integration test for worker startup and a deliberate failure test for the fallback path.

Visual regression tests can capture representative frames, but account for antialiasing and device-pixel differences across platforms. Prefer stable seeds for procedural scenes, deterministic time inputs, and a test mode that renders a known frame without continuous animation. Test the page with reduced motion, keyboard-only operation, screen reader descriptions, and the worker unavailable. Performance tests should use target hardware and a repeatable scene configuration.

```js
function updateParticle(particle, dt, bounds) {
  const next = { ...particle, x: particle.x + particle.vx * dt,
    y: particle.y + particle.vy * dt };
  return {
    ...next,
    x: Math.max(0, Math.min(bounds.width, next.x)),
    y: Math.max(0, Math.min(bounds.height, next.y)),
  };
}
// A pure update function like this can be tested without a canvas or worker.
```

Do not rely exclusively on screenshot tests. A screenshot can look correct while the worker leaks, ignores pause, fails on resize, or prevents keyboard access. Verify lifecycle behavior, error recovery, accessibility, and performance separately.

### 22. Production implementation: main-thread controller

The following controller demonstrates the main architectural pieces: capability detection, worker construction, one-time transfer, resize observation, input coalescing, lifecycle messages, fallback handling, and cleanup. Adapt the DOM selectors and scene-specific messages to your application. The example assumes a bundler that understands module worker URLs; use your build system's documented form if it differs.

```js
const canvasSelector = '#visualization';
const host = document.querySelector('#visualization-host');
const status = document.querySelector('#render-status');
const pauseButton = document.querySelector('#pause-render');
let canvas = document.querySelector(canvasSelector);
let worker = null;
let resizeObserver = null;
let disposed = false;
let paused = false;
let motionQuery = null;

function setStatus(message) {
  if (status) status.textContent = message;
}

function canTransferCanvas() {
  return typeof Worker !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';
}

function post(type, payload = {}) {
  if (!worker || disposed) return;
  worker.postMessage({ version: 1, type, ...payload });
}

function createReplacementCanvas(previous) {
  const next = document.createElement('canvas');
  next.className = previous.className;
  next.id = previous.id;
  next.setAttribute('aria-label', previous.getAttribute('aria-label') || 'Interactive visualization');
  next.setAttribute('aria-describedby', previous.getAttribute('aria-describedby') || 'viz-description');
  previous.replaceWith(next);
  return next;
}

function startFallback() {
  if (disposed) return;
  if (worker) worker.terminate();
  worker = null;
  // If the canvas was transferred, replace it before acquiring a main-thread context.
  canvas = createReplacementCanvas(canvas);
  initializeMainThreadRenderer(canvas);
  setStatus('Using the compatibility renderer.');
}

function initializeWorkerRenderer() {
  if (!canTransferCanvas()) {
    initializeMainThreadRenderer(canvas);
    setStatus('Using the compatibility renderer.');
    return;
  }

  try {
    worker = new Worker(new URL('./renderer.worker.js', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (event) => {
      const message = event.data;
      if (!message || typeof message.type !== 'string') return;
      if (message.type === 'ready') setStatus('Visualization ready.');
      if (message.type === 'error') startFallback();
    });
    worker.addEventListener('error', startFallback, { once: true });
    worker.addEventListener('messageerror', startFallback, { once: true });
    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage({ version: 1, type: 'init', canvas: offscreen }, [offscreen]);
  } catch (error) {
    console.error('Unable to initialize worker renderer:', error);
    startFallback();
  }
}

function observeSize() {
  resizeObserver = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    post('resize', { width, height, dpr: Math.min(window.devicePixelRatio || 1, 2) });
  });
  resizeObserver.observe(canvas);
}

function handlePause() {
  paused = !paused;
  post(paused ? 'pause' : 'resume');
  pauseButton.textContent = paused ? 'Resume animation' : 'Pause animation';
  setStatus(paused ? 'Animation paused.' : 'Animation running.');
}

function teardown() {
  if (disposed) return;
  disposed = true;
  if (resizeObserver) resizeObserver.disconnect();
  if (motionQuery) motionQuery.removeEventListener('change', applyMotionPreference);
  if (pauseButton) pauseButton.removeEventListener('click', handlePause);
  if (worker) {
    worker.postMessage({ version: 1, type: 'dispose' });
    worker.terminate();
    worker = null;
  }
  destroyMainThreadRenderer();
}

function applyMotionPreference() {
  post('motion-mode', { reduced: Boolean(motionQuery && motionQuery.matches) });
}

if (host && canvas) {
  initializeWorkerRenderer();
  if (worker) observeSize();
  pauseButton?.addEventListener('click', handlePause);
  motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  motionQuery.addEventListener('change', applyMotionPreference);
  applyMotionPreference();
}
```

This controller intentionally names application-specific fallback functions rather than pretending they are browser APIs. Implement `initializeMainThreadRenderer` and `destroyMainThreadRenderer` for your actual scene. In production, ensure fallback initialization is idempotent, avoid invoking it twice from both an error event and a message event, and disconnect or reattach the resize observer when the canvas is replaced. A robust implementation should guard fallback transitions with a single `fallbackStarted` flag.

### 23. Production implementation: worker renderer

The worker below shows the structure for initialization, resize, pause/resume, reduced motion, disposal, and a bounded animation loop. The scene drawing functions are deliberately simple so the lifecycle can be understood. Replace them with your application model and test them independently. Keep the worker protocol aligned with the main-thread controller.

```js
let canvas = null;
let ctx = null;
let cssWidth = 1;
let cssHeight = 1;
let dpr = 1;
let rafId = 0;
let running = false;
let disposed = false;
let reducedMotion = false;
let lastTime = 0;
let phase = 0;

function send(type, payload = {}) {
  self.postMessage({ version: 1, type, ...payload });
}

function stopLoop() {
  running = false;
  if (rafId) self.cancelAnimationFrame(rafId);
  rafId = 0;
  lastTime = 0;
}

function resize(width, height, pixelRatio) {
  if (!ctx || !canvas) return;
  const nextWidth = Math.max(1, Math.floor(Number(width) || 1));
  const nextHeight = Math.max(1, Math.floor(Number(height) || 1));
  const nextDpr = Math.min(Math.max(Number(pixelRatio) || 1, 1), 2);
  cssWidth = nextWidth;
  cssHeight = nextHeight;
  dpr = nextDpr;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw(0);
}

function draw(dt) {
  if (!ctx) return;
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  if (!reducedMotion) phase += dt;
  ctx.beginPath();
  ctx.arc(cssWidth / 2, cssHeight / 2, 18 + Math.sin(phase * 2) * 4, 0, Math.PI * 2);
  ctx.fillStyle = '#5b8cff';
  ctx.fill();
}

function frame(now) {
  if (!running || disposed) return;
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0;
  lastTime = now;
  draw(dt);
  if (running && typeof self.requestAnimationFrame === 'function') {
    rafId = self.requestAnimationFrame(frame);
  } else {
    stopLoop();
  }
}

function startLoop() {
  if (running || disposed || typeof self.requestAnimationFrame !== 'function') return;
  running = true;
  lastTime = 0;
  rafId = self.requestAnimationFrame(frame);
}

self.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || message.version !== 1 || typeof message.type !== 'string' || disposed) return;
  switch (message.type) {
    case 'init': {
      canvas = message.canvas;
      ctx = canvas && canvas.getContext('2d');
      if (!ctx) {
        send('error', { code: 'CONTEXT_UNAVAILABLE' });
        return;
      }
      resize(canvas.width || 1, canvas.height || 1, 1);
      send('ready');
      startLoop();
      break;
    }
    case 'resize':
      resize(message.width, message.height, message.dpr);
      break;
    case 'pause':
      stopLoop();
      break;
    case 'resume':
      startLoop();
      break;
    case 'motion-mode':
      reducedMotion = Boolean(message.reduced);
      if (reducedMotion) draw(0);
      else startLoop();
      break;
    case 'dispose':
      stopLoop();
      disposed = true;
      ctx = null;
      canvas = null;
      send('disposed');
      self.close();
      break;
    default:
      send('error', { code: 'UNKNOWN_MESSAGE' });
  }
});
```

The illustrative worker must be adapted before production use. In particular, the `init` path should establish CSS dimensions via an explicit initial-size message instead of inferring them from a transferred backing store; the main thread should send a resize message immediately after initialization or after the `ready` acknowledgement. The main-thread controller should also ensure resize messages are not lost before initialization completes. A small pending-size state on the main thread is a reliable way to do this.

## Named implementation patterns

### Pattern 1 — Worker-first with main-thread fallback

**What it does:** Attempts worker rendering when the necessary capabilities exist and falls back to a compatible main-thread renderer if startup fails. It isolates the advanced path while preserving a usable visual for users on unsupported browsers or constrained environments.

**When to use it:** Use this for product-facing creative visuals, dashboards, and canvas-based hero sections where a blank area is unacceptable. The fallback can be a simpler Canvas 2D implementation, a static image, or a semantic data representation.

```js
let fallbackStarted = false;
function activateFallback(reason) {
  if (fallbackStarted) return;
  fallbackStarted = true;
  console.warn('Worker renderer unavailable:', reason);
  if (worker) worker.terminate();
  worker = null;
  canvas = replaceTransferredCanvasIfNeeded(canvas);
  initializeMainThreadRenderer(canvas);
}
```

Keep fallback activation idempotent. Worker errors can arrive through more than one event path; a single transition guard prevents duplicate initialization. If the canvas was not transferred, you may not need replacement, but tracking that fact explicitly is safer than guessing based on a later error.

### Pattern 2 — ResizeObserver-driven dimensions

**What it does:** Measures the component's actual content box and sends the resulting dimensions to the worker only when the box changes. It decouples drawing geometry from assumptions about the viewport and supports resizable panels and responsive layouts.

**When to use it:** Use it whenever the canvas can resize due to responsive CSS, grid changes, sidebars, dialogs, container changes, or dynamic content. It is preferable to polling dimensions on every frame.

```js
let lastSize = '';
const observer = new ResizeObserver(([entry]) => {
  const width = Math.round(entry.contentRect.width);
  const height = Math.round(entry.contentRect.height);
  const key = `${width}x${height}`;
  if (key === lastSize) return;
  lastSize = key;
  post('resize', { width, height, dpr: Math.min(devicePixelRatio || 1, 2) });
});
observer.observe(canvas);
```

If dimensions are zero, choose an explicit policy: pause rendering until visible, or render a small placeholder state. Avoid repeatedly resetting the backing store to zero and one pixel as a hidden panel opens and closes. Remember to disconnect the observer on disposal and reattach it if the canvas element is replaced during fallback.

### Pattern 3 — Latest-value input coalescing

**What it does:** Stores the latest pointer or slider value and sends at most one update per main-thread animation frame. This prevents an event burst from creating a queue of stale input messages that the worker processes after the user has already moved on.

**When to use it:** Use it for pointer-driven lighting, particle repulsion, drawing cursors, interactive charts, or any control that emits more updates than the renderer can use. It is especially useful on high-refresh-rate touch devices.

```js
let latestInput = null;
let flushPending = false;
function updateInput(value) {
  latestInput = value;
  if (flushPending) return;
  flushPending = true;
  requestAnimationFrame(() => {
    flushPending = false;
    if (latestInput) post('input', latestInput);
    latestInput = null;
  });
}
```

Send the final inactive pointer state when the pointer leaves the surface. If the input is discrete, such as a button press, do not coalesce away important transitions. Coalescing is best for continuous values where the newest state supersedes intermediate states.

### Pattern 4 — Transferable buffer pipeline

**What it does:** Moves a large typed-array payload to the worker without repeatedly cloning its contents. The sender gives up ownership of the transferred buffer, so the message protocol must define when a buffer can be reused or returned.

**When to use it:** Use it for large precomputed point clouds, generated geometry, image data, or simulation snapshots where measurement shows cloning overhead is material. Avoid it for tiny configuration messages.

```js
function sendSamples(worker, samples) {
  const buffer = samples.buffer;
  worker.postMessage({ type: 'samples', buffer }, [buffer]);
  // Do not use `samples` after its buffer is transferred.
}
```

A production buffer pipeline needs explicit ownership and acknowledgement. If the sender needs continuous access, consider a two-buffer protocol or worker-generated data. Shared memory can be useful in specialized cases but introduces synchronization and deployment requirements; do not adopt it without evidence.

### Pattern 5 — Static-frame mode for reduced motion

**What it does:** Replaces continuous animation with a single representative frame or a low-motion state. The worker receives the preference and stops its loop while retaining enough state to redraw when needed.

**When to use it:** Use it for decorative particle fields, background visualizations, animated diagrams, and other scenes whose continuous movement is not essential to comprehension. Keep the data or message meaning available through semantic text.

```js
function setReducedMotion(reduced) {
  post('motion-mode', { reduced });
  if (reduced) post('pause');
  else if (!paused) post('resume');
}
```

Keep user pause state separate from system preference. A reduced-motion change should not unexpectedly resume an animation the user deliberately paused. Test the interaction of both states, including when the preference changes while the page is open.

### Pattern 6 — Render-on-demand worker

**What it does:** Draws only after an input, resize, data update, or explicit refresh instead of continuously scheduling frames. It can substantially reduce idle work for charts, diagrams, and editors that are usually static.

**When to use it:** Use it for static dashboards, maps with infrequent changes, diagram editors, and visual reports. A continuously animated particle scene is a different workload and may still need a bounded animation loop.

```js
let dirty = true;
function markDirty() { dirty = true; }
function renderIfDirty() {
  if (!dirty || !ctx) return;
  dirty = false;
  drawScene(ctx, scene);
}
self.addEventListener('message', (event) => {
  if (event.data?.type === 'data-update') {
    scene = event.data.scene;
    markDirty();
    renderIfDirty();
  }
});
```

In a render-on-demand system, mark the scene dirty for every state change that affects pixels. If a drawing operation depends on time, it is not truly static and should request another frame intentionally. Avoid combining a dirty flag with an unconditional loop that never checks it; that defeats the point of the pattern.

### Pattern 7 — Lifecycle state machine

**What it does:** Centralizes allowed transitions between initialization, readiness, running, paused, failed, and disposed states. It prevents duplicate initialization, accidental resume after disposal, and cleanup paths that leave a worker active.

**When to use it:** Use it for reusable UI components, route-level visualizations, dialog content, and any visual that can mount and unmount repeatedly. It is especially valuable when worker failure and fallback behavior need to be tested.

```js
const allowed = {
  initializing: ['ready', 'failed', 'disposed'],
  ready: ['running', 'paused', 'failed', 'disposed'],
  running: ['paused', 'failed', 'disposed'],
  paused: ['running', 'failed', 'disposed'],
  failed: ['disposed'],
  disposed: [],
};
function transition(state, next) {
  if (!allowed[state]?.includes(next)) throw new Error(`Invalid transition: ${state} -> ${next}`);
  return next;
}
```

Do not overbuild a state machine for a one-off static canvas. The pattern pays off when lifecycle paths are numerous or asynchronous. Even without a formal state machine, write down the states and transitions and make them explicit in code.

### Pattern 8 — Deterministic visual test mode

**What it does:** Uses a seeded scene, explicit dimensions, and fixed time inputs to produce a stable frame for regression tests. It separates correctness of the scene model from scheduling variability and platform-specific timing.

**When to use it:** Use it for generative graphics, visualizations with random placement, charts, and scenes where screenshot tests are valuable. Keep normal runtime behavior separate from test mode so production does not accidentally freeze time or expose test controls.

```js
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
const random = createRandom(42);
const scene = createScene({ width: 640, height: 360, random });
drawScene(ctx, scene, { time: 1.25 });
```

Stable randomness makes regressions easier to diagnose, but pixel-perfect screenshots may still differ across engines due to text rendering, antialiasing, and GPU implementation. Combine visual snapshots with tests for lifecycle, dimensions, state, and accessibility.

## Mistakes and fixes

| ID | Mistake | Why it fails | Unique fix |
|---|---|---|---|
| A | Calling `getContext()` before transfer | The canvas is already bound to a main-thread context | Transfer before any context acquisition on the HTML canvas |
| B | Transferring the same canvas twice | Ownership has already moved | Track transfer state and initialize only once |
| C | Using the old canvas after worker failure | The original surface may not be available for normal main-thread rendering | Replace the transferred element before starting fallback rendering |
| D | Assuming worker support from Canvas support | API support differs by context and browser | Feature-detect transfer and worker capabilities separately |
| E | Sending DOM nodes to the worker | DOM nodes are not structured-cloneable worker messages | Send primitive data and stable identifiers only |
| F | Sending the entire app state each frame | Cloning and message traffic become unnecessary overhead | Send compact deltas or transferable buffers |
| G | Forgetting the transfer list | A transferable resource may not be transferred as intended | Include the OffscreenCanvas in the `postMessage` transfer list |
| H | Treating CSS size as backing-store size | High-density displays can look blurry | Multiply backing dimensions by a capped pixel ratio |
| I | Resetting canvas dimensions every frame | Resizing clears pixels and resets context state | Update backing dimensions only when the target size changes |
| J | Forgetting to restore transforms after resize | Drawing uses the wrong coordinate mapping | Reapply `setTransform` and renderer state after backing-store changes |
| K | Animating by fixed pixels per frame | Motion speed changes with refresh rate | Use elapsed time in seconds and cap large deltas |
| L | Never stopping the worker loop | Hidden or removed components continue consuming CPU | Implement pause, cancel, and dispose paths with explicit states |
| M | Posting every pointer event | The worker may process stale queued input | Coalesce continuous input to the latest value per frame |
| N | Logging every frame | Diagnostics create more main-thread work and noisy output | Log lifecycle transitions and sampled performance summaries |
| O | Ignoring `messageerror` | Deserialization failures become silent dead ends | Handle worker `error` and `messageerror` events explicitly |
| P | Using raw user-visible error traces | Internal implementation details leak into the UI | Present a calm fallback message and retain details in development logs |
| Q | Treating reduced motion as CSS-only | Worker animation continues independently | Send a reduced-motion state message and stop or simplify the loop |
| R | Omitting semantic alternatives | Canvas pixels are inaccessible as individual objects | Pair the visual with headings, text summaries, and native controls |
| S | Trusting an `aria-label` to expose chart data | A label does not describe every data point | Provide a text summary or accessible table for meaningful data |
| T | Assuming `requestAnimationFrame` exists in every worker | Support varies by environment | Feature-detect it and define a bounded fallback or static mode |
| U | Ignoring worker URL and CSP deployment | The worker may work locally but fail in production | Verify production URL, MIME type, and worker-src policy |
| V | Using shared memory without isolation checks | Required cross-origin isolation may be absent | Prefer messages and transferables until shared memory is justified |
| W | Reusing a transferred buffer | Ownership has moved and the sender's buffer is detached | Define buffer ownership and acknowledgement before transfer |
| X | Forgetting to close unused ImageBitmap resources | Decoded graphics resources may remain allocated | Call `close()` when the bitmap is no longer needed |
| Y | Building fallback without lifecycle guards | Multiple failure events may initialize it repeatedly | Use a single idempotent fallback transition guard |
| Z | Testing only on a desktop browser | Mobile memory and timing behavior can differ materially | Test representative Safari, Firefox, Chromium, and mobile devices |
| AA | Measuring only average frame rate | Long stalls and input delay remain hidden | Inspect frame-time distribution, long tasks, and interaction traces |
| AB | Assuming worker equals GPU acceleration | CPU and GPU bottlenecks still exist | Profile algorithm cost, fill rate, compositing, and pixel area separately |
| AC | Sending resize before worker readiness with no queue | Initial dimensions can be lost | Store the latest dimensions and replay after the `ready` message |
| AD | Leaving observers attached to a replaced canvas | The fallback element receives no resize updates | Disconnect old observers and attach a new observer to the replacement |
| AE | Resuming after explicit user pause | Preference updates override user intent | Keep user pause and reduced-motion preference as separate state values |
| AF | Using a timer fallback without a rate limit | Timer callbacks can run too frequently and waste CPU | Cap fallback cadence and stop it on pause or disposal |

## Debugging playbook

### Blank canvas

1. Confirm the worker script loaded and the `init` message was received.
2. Confirm `transferControlToOffscreen()` succeeded and the canvas was transferred once.
3. Check that `getContext('2d')` returned a valid context.
4. Confirm a non-zero resize message reached the worker after initialization.
5. Verify the worker scheduled a frame or executed a render-on-demand pass.
6. Inspect the DOM canvas's CSS dimensions, stacking order, opacity, and clipping.
7. Draw a known solid rectangle before debugging the full scene.

### Blurry output

Check CSS dimensions, backing-store dimensions, and device-pixel ratio separately. Verify that the worker applies `setTransform(dpr, 0, 0, dpr, 0, 0)` after resizing. Ensure drawing coordinates are expressed in CSS pixels rather than multiplying them by DPR a second time. Test fractional dimensions and browser zoom, because rounding can create small discrepancies at boundaries.

### Input feels delayed

Measure event-to-message latency, message volume, worker processing time, and main-thread long tasks. Coalesce pointer moves and avoid sending full scene state. Confirm the worker isn't running expensive per-frame logging or rebuilding geometry. If the worker is busy with a long synchronous computation, it cannot process incoming messages until that computation yields; split large jobs into chunks or redesign the algorithm.

### Memory grows over time

Check whether new workers are created without terminating old ones, whether each resize rebuilds caches, whether ImageBitmap objects are closed, and whether buffers are retained in both contexts. A worker can hold memory even when it is paused. Use browser memory tools and repeat a mount/unmount cycle to see whether the baseline returns.

### Fallback fails

Confirm that the old transferred canvas is replaced and that the new element receives the same sizing rules and accessibility attributes. Verify observers and event listeners are attached to the replacement. Make fallback activation idempotent, and test the failure path deliberately rather than relying on a real production failure to reveal the bug.

## Mental models

1. **A worker is a second execution context, not a second browser UI.** It can compute and draw, but it cannot directly operate DOM controls.
2. **Transfer is ownership, not duplication.** Once a resource is transferred, the sender must treat it as no longer locally usable in the same way.
3. **The message protocol is an API.** Version it, validate it, keep it narrow, and test invalid inputs.
4. **CSS size and pixel size are different coordinate systems.** Layout dimensions describe the visible box; backing dimensions describe the raster surface.
5. **Off-main-thread work is still work.** CPU, memory, fill rate, and GPU resources remain finite.
6. **The lifecycle is part of the renderer.** Initialization, pause, resume, failure, fallback, and disposal are rendering concerns, not incidental plumbing.
7. **Latest state often matters more than every intermediate event.** Coalesce continuous input, but preserve discrete actions.
8. **Accessibility lives in the surrounding interface.** Canvas is a visual output surface; meaningful content needs DOM semantics and text alternatives.
9. **Fallbacks are architecture, not an emergency patch.** Plan for unsupported APIs and runtime failures before transferring the canvas.
10. **Measure the complete path.** Startup, messages, resize, interaction latency, and cleanup all affect the experience.

## Quick reference

| Need | Preferred approach | Watch out for |
|---|---|---|
| Heavy canvas work | Worker plus OffscreenCanvas | Verify real main-thread contention first |
| Responsive dimensions | ResizeObserver on main thread | Send CSS size and capped DPR separately |
| Frequent pointer input | Latest-value coalescing | Do not drop discrete actions |
| Large data payload | Transferable ArrayBuffer | Sender loses ownership after transfer |
| Static visualization | Render on demand | Mark dirty after every visual state change |
| Reduced motion | Worker-controlled static/low-motion mode | Keep explicit user pause separate |
| Worker error | Replace canvas and initialize fallback | Avoid duplicate fallback initialization |
| Production debugging | Worker DevTools and typed diagnostics | Never log every frame in production |
| Accessible chart | DOM summary and data table | `aria-label` alone does not expose individual values |
| Browser compatibility | Runtime feature detection | Test context and scheduling support separately |

## Gotchas to remember

- `transferControlToOffscreen()` is not a reversible convenience method; replacement is often the clean fallback boundary.
- A context reset occurs when backing dimensions change, so reapply transforms and drawing state after resize.
- A worker can start successfully and still fail later because of memory pressure, context loss, or invalid input.
- `requestAnimationFrame` availability and behavior must be checked in the actual worker context and target browsers.
- Worker messages are asynchronous; the main thread and worker can observe state changes at different times.
- Device-pixel ratio affects pixel count quadratically through width and height; cap it for large surfaces.
- A worker cannot query DOM layout; send dimensions and relevant input from the main thread.
- A transferred `ArrayBuffer` is detached from the sender; do not retain stale references as though they remain valid.
- `ImageBitmap.close()` is useful when the resource is no longer needed; don't keep creating bitmaps on every frame.
- A successful development build does not prove that worker paths, MIME types, and CSP work in production.

## Build challenge: responsive offscreen visualization

Build a responsive visualization component that renders a moving network of points in a worker where supported and offers a meaningful fallback. Use this challenge to verify the skill end to end rather than collecting isolated snippets.

1. Create a semantic `<section>` with a heading, a descriptive paragraph, a canvas, a status region, and a native pause button.
2. Implement feature detection for `Worker` and `transferControlToOffscreen` before attempting transfer.
3. Create a module worker using a URL strategy supported by your bundler and production deployment.
4. Transfer the HTML canvas exactly once and pass the OffscreenCanvas through the transfer list.
5. Validate worker messages with a protocol version and explicit message types.
6. Acquire the 2D context in the worker and report context failure to the main thread.
7. Use ResizeObserver to measure the CSS content box and send dimensions to the worker.
8. Apply a capped device-pixel ratio and restore context transforms after backing-store changes.
9. Implement an animation loop with elapsed-time updates and a maximum delta cap.
10. Add a pause/resume lifecycle that does not create duplicate animation loops.
11. Coalesce pointer movement messages so the worker receives the latest useful state.
12. Implement a reduced-motion mode that stops continuous movement or renders a static composition.
13. Handle worker `error` and `messageerror` events with an idempotent fallback path.
14. Replace the transferred canvas before initializing a main-thread fallback renderer.
15. Add an accessible text summary or table that conveys the important information without relying on pixels.
16. Ensure keyboard users can operate the pause control and see a `:focus-visible` indicator.
17. Add a disposal path that disconnects ResizeObserver and media-query listeners and terminates the worker.
18. Test the component when hidden, resized, paused, resumed, and removed from the DOM.
19. Profile main-thread long tasks, worker workload, frame-time variation, and memory on a target mobile device.
20. Test current Chromium, Firefox, Safari, and a mobile browser, including the fallback path.
21. Verify that the production worker URL, MIME type, and Content Security Policy are correct.
22. Add deterministic test mode with seeded randomness and explicit dimensions for repeatable visual checks.

### Definition of done

- The component displays a useful visualization in the supported worker path and a meaningful alternative in the fallback path.
- No HTML canvas has a main-thread context acquired before transfer; transfer happens at most once per canvas element.
- Resize updates are correct at different CSS sizes and device-pixel ratios, without unnecessary backing-store resets.
- Animation speed is time-based, bounded after pauses, and does not create duplicate requestAnimationFrame loops.
- Pause, resume, reduced motion, error recovery, and disposal work through explicit lifecycle states.
- Continuous input is coalesced, messages are validated, and the worker does not emit per-frame debug noise.
- Keyboard operation, visible focus, screen-reader context, and text alternatives are present and tested.
- The fallback path works when the API is unavailable and when worker startup fails after transfer.
- Browser and production deployment checks cover worker loading, CSP, and context availability.
- Performance evidence shows whether offloading improves responsiveness on the target device; optimization claims are supported by traces rather than intuition.

## Final decision checklist

Before shipping, answer these questions with evidence: Is the main thread actually the bottleneck? Does the worker own all canvas drawing after transfer? Is the message protocol narrow and validated? Are dimensions and pixel ratio explicit? Does the animation stop when it should? Is the fallback usable and tested? Can a user understand the visualization without perceiving its pixels? Have target browsers and production headers been checked? Does a performance trace demonstrate the intended improvement? If any answer is unknown, treat it as an unfinished requirement rather than assuming the happy path is enough.
