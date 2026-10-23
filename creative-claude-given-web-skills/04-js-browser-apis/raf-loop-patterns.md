---
name: raf-loop-patterns
description: Build reliable requestAnimationFrame loops for browser animation, Canvas, custom rendering engines, and coordinated motion systems.
---

# RAF Loop Patterns

## Purpose

A production-grade animation loop is a small runtime system, not merely a callback that changes a number. It owns time, scheduling, simulation steps, rendering cadence, visibility transitions, lifecycle cleanup, and communication with the rest of the application. This skill teaches how to design that system so it remains correct across high-refresh-rate displays, slow devices, background tabs, route changes, reduced-motion preferences, and multiple animated components.

Use these patterns for Canvas renderers, custom WebGL or Three.js integrations, physics-like UI effects, procedural graphics, data visualizations, and any animation system that needs an explicit clock. Prefer CSS transitions or keyframes for simple declarative UI motion. Prefer the Web Animations API when a browser-managed timeline is enough. A JavaScript frame loop is justified when each frame depends on current state, simulation, input, measurements, or a renderer that must be driven continuously.

## Why This Matters

Poorly designed loops create production failures that are easy to miss on a developer laptop: movement runs twice as fast on a 120 Hz screen as on a 60 Hz screen; a tab returns from sleep and an object teleports across the scene; an animation keeps consuming CPU after a modal closes; a route transition leaves duplicate loops running; a renderer drops frames because expensive simulation is coupled directly to every repaint; or a canvas keeps animating when the user has requested reduced motion. These failures affect battery life, accessibility, correctness, and perceived quality.

A robust loop makes time explicit, separates simulation from drawing, schedules at most one pending frame per loop, and has a defined policy for hidden documents, stale timestamps, errors, and disposal. It also provides observable points for debugging rather than relying on visual guesswork.

## Operating Principles

1. **The browser owns the repaint schedule.** `requestAnimationFrame` (rAF) asks the browser to invoke a callback before a future repaint. It is not a promise of a fixed frame rate, and it can be throttled or suspended when the page is hidden.
2. **Time is an input, not an assumption.** Use the callback timestamp or a monotonic clock, and derive elapsed time instead of assuming each callback represents 16.67 milliseconds.
3. **Simulation and rendering are different jobs.** State updates determine what should happen; rendering reflects the current state. Keeping them separate makes fixed-step simulation, interpolation, profiling, and tests easier.
4. **A loop has an owner.** The component, scene, or application that starts a loop must also stop and dispose of it. Ownership should be visible in the API.
5. **One loop means one outstanding frame request.** Multiple callbacks scheduling one another accidentally create duplicate loops and steadily increasing work.
6. **Hidden time needs an explicit policy.** Decide whether time pauses, catches up, or is clamped when a document becomes hidden. For most UI motion, pause and reset the clock.
7. **Accessibility is part of scheduling.** Reduced-motion preferences, keyboard operation, readable status, and non-animated fallbacks must be considered at design time.
8. **Performance is a budget.** Every frame competes with input, layout, paint, compositing, and other scripts. Measure expensive work and degrade deliberately when the budget is exceeded.

### 1. Understand the rAF Contract

`requestAnimationFrame(callback)` registers a callback for a future rendering opportunity and returns an identifier that can be passed to `cancelAnimationFrame`. The callback receives a timestamp in milliseconds. In a window context, timestamps for callbacks in the same frame are aligned to the same frame time. The callback is normally one-shot: a continuing loop must request the next frame itself.

Do not treat rAF as a timer with a guaranteed interval. A 60 Hz display may provide a callback about every 16.7 ms; a 120 Hz display may provide callbacks about every 8.3 ms; a busy main thread may miss opportunities; and a hidden page may be throttled or paused. The callback timestamp is preferable to counting frames because it allows movement to be expressed in units per second.

```js
let frameId = null;
let running = false;

function frame(timestamp) {
  if (!running) return;
  update(timestamp);
  render();
  frameId = requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  frameId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
}
```

This example is intentionally small. A real loop should define how it handles the first timestamp, long gaps, visibility, errors, and disposal. It should also ensure that `update` and `render` do not mutate unrelated DOM or trigger expensive layout reads.

**Gotcha:** cancelling a frame request does not interrupt a callback that is already executing. The `running` guard is still needed so the current callback cannot schedule another frame after shutdown.

### 2. Use Delta Time Correctly

Delta time (`dt`) is elapsed time between frames. If an object moves at 180 pixels per second, update its position using `velocity * dtSeconds`, not a fixed number of pixels per callback. Normalize milliseconds to seconds once at the boundary and keep units explicit throughout the simulation.

```js
const SPEED_PX_PER_SECOND = 180;
let previousTimestamp = null;
let x = 0;

function frame(timestamp) {
  if (previousTimestamp === null) previousTimestamp = timestamp;
  const dtSeconds = (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;

  x += SPEED_PX_PER_SECOND * dtSeconds;
  drawAt(x);
  requestAnimationFrame(frame);
}
```

The first callback should usually establish a baseline rather than simulating from zero to an arbitrary page-load timestamp. Reset the baseline whenever the loop resumes after a pause. Without that reset, the first resumed frame may contain a very large delta.

Delta time fixes refresh-rate-dependent motion, but it does not make all numerical simulation stable. Large deltas can destabilize collision detection, spring systems, particle interactions, and numerical integration. Clamp elapsed time for simple visual effects, or use a fixed-step accumulator for simulations that need predictable update steps.

**Gotcha:** use a single unit convention. Mixing seconds and milliseconds can make a velocity appear to be 1,000 times too large or too small. Name variables with units when ambiguity is possible, such as `dtSeconds` and `speedPxPerSecond`.

### 3. Establish a Frame-Time Policy

A loop needs a declared policy for irregular frames. There are three common options:

- **Unbounded elapsed time:** appropriate for simple elapsed-time displays where catching up is the desired behavior.
- **Clamped elapsed time:** appropriate for decorative motion where a long stall should not cause a giant jump.
- **Fixed-step simulation:** appropriate for collision-heavy or deterministic simulation where update increments should remain stable.

Clamping does not restore time that was discarded. It intentionally trades perfect catch-up for visual stability. Choose the maximum delta based on the behavior, not because one number is universally correct. Decorative UI motion may clamp to around 50 ms; a simulation may use a smaller fixed step and cap the number of steps processed per rendered frame.

```js
const MAX_DT_SECONDS = 0.05;
let previousTimestamp = null;

function tick(timestamp) {
  const rawDt = previousTimestamp === null
    ? 0
    : (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;
  const dt = Math.min(Math.max(rawDt, 0), MAX_DT_SECONDS);
  update(dt);
  render();
  frameId = requestAnimationFrame(tick);
}
```

The lower bound protects against unexpected negative values in defensive code, although a monotonic rAF timestamp should not normally move backwards. Record the unclamped delta in diagnostics if you need to detect long stalls. Do not silently hide recurring performance problems by clamping without measuring them.

### 4. Separate Update, Render, and Scheduling

The scheduler decides when the next callback runs. The update function changes application state. The render function writes the state to the canvas, WebGL context, or DOM. These responsibilities should not be entangled. Separation makes it possible to test update logic without a browser, render on demand, skip drawing when nothing changed, and profile simulation separately from rendering.

```js
function update(dtSeconds) {
  player.position.x += player.velocity.x * dtSeconds;
  player.position.y += player.velocity.y * dtSeconds;
  world.resolveCollisions();
}

function render(alpha = 1) {
  renderer.clear();
  renderer.drawWorld(world, alpha);
  renderer.drawHud(hudState);
}

function onFrame(timestamp) {
  const dt = clock.readDelta(timestamp);
  update(dt);
  render();
  scheduleNextFrame();
}
```

Keep DOM reads out of the hot update path when possible. Read dimensions and computed styles at controlled points, cache values, and write visual properties together. A loop that alternates layout reads and writes can force synchronous layout repeatedly. For DOM movement, prefer transform and opacity where they suit the effect; do not assume every transform is free, and confirm actual compositing behavior in browser tooling.

A render-on-demand system can schedule a frame only after state changes. A continuous loop is appropriate for continuously changing scenes, but it is wasteful for a static illustration. Make continuous versus demand rendering an explicit choice.

### 5. Prevent Duplicate Loops

A common failure is calling `start()` repeatedly while each call creates another self-scheduling callback. The page may still look correct at first, but CPU usage, particle speed, and draw calls multiply. Make start idempotent: if the loop is already running, do nothing. Store the frame identifier and cancel it on stop. If the implementation uses a class, keep the state on the instance instead of in shared module variables unless the module intentionally owns a single global ticker.

```js
class RafLoop {
  #frameId = null;
  #running = false;
  #boundFrame;

  constructor(onFrame) {
    this.onFrame = onFrame;
    this.#boundFrame = (time) => this.#frame(time);
  }

  start() {
    if (this.#running) return;
    this.#running = true;
    this.#frameId = requestAnimationFrame(this.#boundFrame);
  }

  stop() {
    this.#running = false;
    if (this.#frameId !== null) cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }

  #frame(time) {
    if (!this.#running) return;
    this.onFrame(time);
    if (this.#running) this.#frameId = requestAnimationFrame(this.#boundFrame);
  }
}
```

In frameworks, connect start and stop to lifecycle ownership. In React, for example, an effect cleanup should stop the loop; callbacks that change on every render should be stored carefully so the loop does not restart on every render unless that is intentional. In custom elements, stop on disconnection and restart only when connected state and user preferences allow it.

**Gotcha:** the frame ID is an opaque request handle, not a boolean. Do not assume `0` can never be returned; use `null` as the “no pending request” sentinel.

### 6. Pause on Document Visibility Changes

Browsers usually throttle or suspend rAF callbacks in hidden tabs. If the app calculates a delta from the last visible timestamp, returning to the tab can cause a huge update. Listen for `visibilitychange`, stop scheduling while hidden, and reset the clock when visible. Whether the simulation should continue in real time is a product decision; a decorative animation generally should pause, while an elapsed-time counter may derive its displayed value from an absolute start time instead.

```js
function onVisibilityChange() {
  if (document.hidden) {
    loop.pause();
  } else {
    loop.resetClock();
    loop.resume();
  }
}

document.addEventListener('visibilitychange', onVisibilityChange);

function dispose() {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  loop.stop();
}
```

Make visibility handling part of the loop abstraction or its explicit owner; avoid having every child module register its own document listener unless each has a separate lifecycle and policy. If the loop should not run when the user navigates away, also connect it to the component or route lifecycle. Page visibility is not the same as whether an element is inside the viewport; use an `IntersectionObserver` when the latter is the actual requirement.

**Gotcha:** `document.hidden` can be false while the window is occluded or the device is in a power-saving state. Visibility is a useful signal, not a guarantee that frames will be delivered at a particular rate.

### 7. Choose Variable or Fixed-Step Updates

Variable-step updates use the observed delta directly. They are simple and often adequate for UI effects. Fixed-step updates process simulation in constant increments, while rendering can occur at the browser's cadence. A fixed-step accumulator preserves leftover time and caps the amount of catch-up work per rendered frame.

```js
const STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 5;
let accumulator = 0;
let previous = null;
let currentState = createState();
let previousState = cloneState(currentState);

function frame(timestamp) {
  const elapsed = previous === null ? 0 : Math.min((timestamp - previous) / 1000, 0.1);
  previous = timestamp;
  accumulator += elapsed;
  let steps = 0;

  while (accumulator >= STEP && steps < MAX_STEPS_PER_FRAME) {
    previousState = cloneState(currentState);
    simulate(currentState, STEP);
    accumulator -= STEP;
    steps += 1;
  }

  const alpha = accumulator / STEP;
  renderInterpolated(previousState, currentState, alpha);
  frameId = requestAnimationFrame(frame);
}
```

Interpolation can reduce visible stepping by drawing between the previous and current simulation states. It is not appropriate for every state variable: discrete state changes, collision events, and UI labels often should not be interpolated. When the step cap is reached, decide whether to drop excess accumulated time, preserve it for later, or slow simulation. Preserving unlimited backlog can produce a “spiral of death” in which the app spends all its time catching up.

### 8. Design a Global Ticker When Many Modules Animate

A site with several independently animated modules can either use one loop per module or one shared ticker. A shared ticker reduces scheduling overhead and provides a common timestamp, ordering, visibility policy, and debug surface. It also introduces coupling: a slow subscriber can delay all others. Use a global ticker when modules genuinely share an application lifetime and frame clock; use independent loops when ownership and cadence differ materially.

A ticker should support subscribe/unsubscribe, snapshot subscribers before iterating if callbacks may mutate the set, and define how errors are handled. Do not allow a single subscriber exception to silently kill all future frames. Decide whether exceptions are reported and the faulty subscriber removed, or rethrown after scheduling; document the behavior.

```js
class Ticker {
  subscribers = new Set();
  frameId = null;
  running = false;
  lastTime = null;

  subscribe(callback) {
    this.subscribers.add(callback);
    this.start();
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) this.stop();
    };
  }

  start() {
    if (this.running || this.subscribers.size === 0) return;
    this.running = true;
    this.frameId = requestAnimationFrame(this.tick);
  }

  tick = (time) => {
    if (!this.running) return;
    const dt = this.lastTime === null ? 0 : Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    for (const callback of [...this.subscribers]) callback({ time, dt });
    if (this.running && this.subscribers.size > 0) {
      this.frameId = requestAnimationFrame(this.tick);
    } else {
      this.stop();
    }
  };

  stop() {
    this.running = false;
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.lastTime = null;
  }
}
```

This example illustrates the interface, not a complete hardened library: production code should add visibility handling, subscriber error isolation, diagnostics, and clear disposal semantics. If a subscriber schedules work that takes 20 ms, the shared ticker still misses its deadline. A shared ticker centralizes scheduling but cannot make expensive work cheap.

### 9. Respect Reduced Motion and Provide a Static State

Read the `prefers-reduced-motion` media query and decide what the product should do when it matches. For a decorative background, stop continuous motion or render a static representative frame. For a functional visualization, retain the information while reducing movement, avoiding camera sweeps, flashing, parallax, and large spatial transitions. Do not make essential meaning available only through motion.

```js
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');

function applyMotionPreference() {
  if (motionPreference.matches) {
    loop.stop();
    renderStaticState();
  } else {
    loop.start();
  }
}

motionPreference.addEventListener('change', applyMotionPreference);
applyMotionPreference();

function dispose() {
  motionPreference.removeEventListener('change', applyMotionPreference);
  loop.stop();
}
```

For broad compatibility, consider the older `addListener` and `removeListener` methods only when supporting older browser versions that lack `addEventListener` on `MediaQueryList`; keep compatibility code isolated and based on the project's support matrix. Provide accessible controls for users to pause, stop, or hide moving content when required by the content and duration. A button that pauses an animation should be a real `<button>` with a clear accessible name and state, not a clickable generic element.

**Gotcha:** reduced motion is a live preference. Do not check it once at page load and assume it can never change. Also ensure the static state is visually complete; simply stopping at an arbitrary halfway frame can leave content confusing or partially hidden.

### 10. Coordinate With Layout and Canvas Resizing

A loop often renders to a canvas whose CSS size differs from its backing-store size. Set the backing store using the element's measured CSS dimensions multiplied by the effective device pixel ratio, then scale drawing coordinates or apply a context transform. Re-check dimensions when the element changes size, not only when the window resizes. `ResizeObserver` is normally the appropriate tool for element-level changes.

```js
function resizeCanvas(canvas, context, cssWidth, cssHeight) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}
```

Cap the pixel ratio when memory and fill-rate matter. A 2× width and 2× height means four times as many backing pixels, so a high-density screen can multiply drawing cost substantially. If the canvas is frequently resized, avoid assigning the backing-store dimensions unnecessarily because setting `canvas.width` or `canvas.height` clears the canvas and resets context state.

Use semantic HTML around the canvas. A `<canvas>` is not a replacement for textual labels, controls, or important data. Give the canvas an accessible name or fallback content where appropriate, provide equivalent information outside the drawing surface, and ensure keyboard users can operate associated controls. Do not put all meaningful information only into pixels that a screen reader cannot inspect.

### 11. Manage Lifecycle and Cleanup

Every listener, observer, subscription, timeout, and frame request has a lifetime. The owner that creates it should dispose of it. Cleanup is not a minor optimization: stale callbacks can mutate removed nodes, retain large scenes in memory, duplicate event handling after navigation, and throw errors when an element is no longer available.

```js
function createAnimatedWidget(root) {
  let disposed = false;
  let frameId = null;
  let lastTime = null;

  function frame(time) {
    if (disposed) return;
    const dt = lastTime === null ? 0 : Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    updateWidget(dt);
    renderWidget(root);
    if (!disposed) frameId = requestAnimationFrame(frame);
  }

  frameId = requestAnimationFrame(frame);

  return function dispose() {
    disposed = true;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    lastTime = null;
  };
}
```

A real widget should also remove listeners and observers created by `updateWidget` or `renderWidget`; the example keeps the focus on the loop handle. If a renderer owns GPU resources, dispose of buffers, textures, geometries, materials, and context-bound resources according to the rendering library's API. Stopping rAF does not automatically release resources held by the scene.

Prefer a single `dispose()` path that is safe to call more than once. Idempotent cleanup is valuable because a route can unmount while an explicit close handler is also running. Use `AbortController` for groups of event listeners where supported and useful, but do not assume aborting listeners cancels rAF; frame requests still need their own cancellation path.

### 12. Instrument and Debug the Loop

When animation stutters, identify whether the cause is JavaScript execution, layout, paint, GPU work, memory pressure, or contention with other tasks. The callback interval is not the same as the time spent executing your callback. Record both elapsed time between callbacks and execution duration. Use browser DevTools Performance recordings to inspect long tasks, dropped frames, style recalculation, layout, paint, and compositing. Use the FPS meter or frame timeline where available, and test on a throttled CPU and a real low-powered device.

```js
const diagnostics = { lastTime: null, frameMs: 0, callbackMs: 0, longFrames: 0 };

function measuredFrame(timestamp) {
  const startedAt = performance.now();
  if (diagnostics.lastTime !== null) {
    diagnostics.frameMs = timestamp - diagnostics.lastTime;
    if (diagnostics.frameMs > 50) diagnostics.longFrames += 1;
  }
  diagnostics.lastTime = timestamp;
  updateFromTimestamp(timestamp);
  renderCurrentState();
  diagnostics.callbackMs = performance.now() - startedAt;
}
```

Use `performance.now()` for measuring callback execution duration because it is monotonic and designed for high-resolution timing. Keep diagnostic collection cheap; logging every frame can itself create a performance problem. Sample or aggregate metrics and expose them in a debug overlay only when enabled. Measure before adding micro-optimizations such as object pooling or aggressive caching.

Browser DevTools workflows:

- In the Performance panel, record a short repeatable interaction and inspect the main-thread flame chart.
- Check for long tasks and scripting blocks that exceed the frame budget.
- Look for forced reflow or layout events following DOM measurement calls.
- Inspect paint and compositing tracks to determine whether an animation repaints a large region.
- Enable CPU throttling to expose timing assumptions hidden by a fast machine.
- Use the Rendering panel's frame-rate or paint diagnostics when available.
- Check memory snapshots after repeated mount/unmount cycles for retained scenes or detached DOM nodes.
- Test the page in a background tab, then return to it and verify that state does not jump.

**Gotcha:** `console.log()` inside every frame can distort the very performance issue being investigated. Collect counters and inspect them periodically instead.

### 13. Define Failure and Error Behavior

A callback can throw, a renderer can lose its context, a canvas can be removed, or an imported module can be disposed while a callback is pending. Decide whether an error stops the loop, pauses the affected subscriber, or reports a recoverable fault. Do not accidentally leave `running = true` after a fatal render error, because the user may see a frozen surface while the loop keeps consuming resources.

A `try/finally` block can guarantee scheduling decisions are made consistently, but blindly scheduling in `finally` after every fatal error can create an infinite error loop. A safe policy is to mark the loop stopped for an uncaught fatal error, cancel future work, report the error through an application-level logger, and allow an explicit restart only after recovery.

```js
function frame(timestamp) {
  if (!running) return;
  try {
    update(timestamp);
    render();
  } catch (error) {
    running = false;
    frameId = null;
    reportAnimationError(error);
    return;
  }

  if (running) frameId = requestAnimationFrame(frame);
}
```

For a shared ticker, one subscriber error may be isolated so the remaining subscribers continue, but the policy must be deliberate. Never silently swallow errors without telemetry or a debugging hook. If a WebGL context is lost, pause rendering and restore or recreate resources when the context becomes available again.

### 14. Choose the Right Abstraction

Not every animation needs a loop. A CSS transition is usually the simplest option for a known change between two styles. CSS keyframes suit repeating or multi-stage effects that can be described declaratively. The Web Animations API is useful when a browser-managed timeline needs programmatic control. rAF is appropriate when the next state is computed each frame or when a rendering engine needs an explicit update/draw cadence.

A useful rule is to choose the least powerful abstraction that satisfies the behavior. More JavaScript means more lifecycle code, timing edge cases, accessibility decisions, and performance responsibility. If a CSS transition solves the problem cleanly, do not add a JavaScript loop merely because it offers more control. If an effect needs physics, input sampling, canvas drawing, or a common clock across modules, an explicit loop may be justified.

### 15. Browser Compatibility and Progressive Enhancement

`requestAnimationFrame` is widely supported in modern browsers, but the whole animation system can still vary because of background throttling, device pixel ratio, refresh rate, reduced-motion support, WebGL availability, and lifecycle behavior. Use the project's actual browser support matrix rather than adding legacy fallbacks without a requirement. If supporting obsolete browsers is mandatory, isolate any prefixed API fallback in a small adapter and test it; do not spread vendor-specific calls across the codebase.

The page should remain useful if animation is unavailable or disabled. Render meaningful initial content before starting motion. Avoid using a loop as the only way to reveal essential information. For a data visualization, include a table or textual summary where practical. For controls, use native HTML elements, labels, visible focus indicators, and keyboard-compatible behavior.

If using `:focus-visible` for related controls, preserve a visible focus treatment rather than removing outlines without a replacement. A pause button should have clear focus styling and an accessible label. If state is communicated through text, use a concise status message where appropriate; avoid announcing every animation frame to assistive technology because that would overwhelm users.

### 16. Performance Budgets and Graceful Degradation

At 60 Hz, a new frame opportunity arrives roughly every 16.7 ms; at 120 Hz, roughly every 8.3 ms. Your animation does not own the entire budget. Input, browser work, rendering, and other scripts also need time. A callback that averages 10 ms may appear acceptable on a 60 Hz device but fail to keep up on a 120 Hz device. Budget based on the target experience and verify with profiling rather than assuming a fixed frame rate.

Practical controls include:

- Skip drawing when state has not changed.
- Reduce particle count or detail based on measured performance, not only user-agent sniffing.
- Avoid allocations in the hot path when profiling proves garbage collection is a problem.
- Batch canvas drawing operations where it improves measured results.
- Keep expensive calculations out of the callback and move suitable work to a Web Worker.
- Use a frame cap for simulations that do not need to update faster than a chosen rate, while allowing rendering to remain smooth when appropriate.
- Stop work when no subscribers remain or the animated region is no longer relevant.
- Avoid forcing layout by alternating DOM writes and reads.
- Limit backing-store pixel ratio for expensive canvases.
- Respect reduced motion and provide a low-motion or static alternative.

Do not use a fixed 30 FPS cap as a universal optimization. It may save power for some decorative effects but can make interactive motion feel sluggish. Choose cadence based on user experience, device constraints, and actual measurements. A scheduler that skips frames should still calculate time correctly so motion does not become refresh-rate-dependent.

### 17. Test Timing Without Relying on Your Eyes

Visual inspection alone is insufficient for timing logic. Make update functions deterministic where possible by passing time or delta as an argument. Test that movement over one simulated second is approximately the same regardless of whether the simulated frames are 30, 60, or 120 Hz. Test long gaps, zero delta, pause/resume, repeated start calls, stop during a callback, and disposal while a frame is pending.

```js
function advancePosition(position, speed, dtSeconds) {
  return position + speed * dtSeconds;
}

// Same one-second duration represented at different callback rates.
function simulateFrames(frameCount, speed = 100) {
  let position = 0;
  const dt = 1 / frameCount;
  for (let i = 0; i < frameCount; i += 1) {
    position = advancePosition(position, speed, dt);
  }
  return position;
}

console.assert(Math.abs(simulateFrames(30) - 100) < 0.001);
console.assert(Math.abs(simulateFrames(60) - 100) < 0.001);
console.assert(Math.abs(simulateFrames(120) - 100) < 0.001);
```

For browser-level tests, use a controllable fake scheduler or stub `requestAnimationFrame` and `cancelAnimationFrame`. Keep tests isolated so a pending callback from one test cannot run in the next. Test the user-facing outcome too: pause controls, focus visibility, reduced-motion behavior, hidden-tab resume, and cleanup after navigation.

## Mental Models

1. **A frame request is a reservation, not a metronome.** The browser chooses when the callback runs; your code must tolerate irregular intervals.
2. **Delta time is the distance travelled by the clock.** Express rates per second and multiply by elapsed seconds.
3. **The first frame establishes a baseline.** Without a baseline, the first delta has no meaningful previous frame to compare against.
4. **A hidden tab is a discontinuity.** Reset or deliberately reconcile time when the page becomes visible again.
5. **One owner means one cleanup path.** The code that starts the loop must know how to stop it and release its resources.
6. **Simulation is truth; rendering is a view.** Separating them allows fixed-step updates, interpolation, and deterministic tests.
7. **A shared ticker centralizes policy, not performance.** It can reduce duplicate scheduling but cannot rescue a slow subscriber.
8. **A clamp is a product decision.** It trades elapsed-time accuracy for visual stability after stalls.
9. **No change means no required draw.** Demand rendering can save CPU and battery when state is static.
10. **Accessibility belongs in the clock policy.** Reduced motion and pause controls determine whether the loop should run at all.

## Patterns

### Pattern 1 — Idempotent Start/Stop

**What it does:** Prevents multiple `start()` calls from creating multiple callback chains and provides a reliable stop operation.

**When to use it:** Every reusable loop, animated component, scene controller, or module with an explicit lifecycle.

```js
function createLoop(draw) {
  let running = false;
  let frameId = null;
  const tick = (time) => {
    if (!running) return;
    draw(time);
    if (running) frameId = requestAnimationFrame(tick);
  };
  return {
    start() {
      if (running) return;
      running = true;
      frameId = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    }
  };
}
```

### Pattern 2 — Delta-Time Motion

**What it does:** Makes movement depend on elapsed time instead of the number of callbacks.

**When to use it:** Continuous position, rotation, opacity, progress, or particle movement where refresh-rate independence matters.

```js
let last = null;
let x = 0;
function tick(time) {
  const dt = last === null ? 0 : (time - last) / 1000;
  last = time;
  x += 120 * dt; // 120 CSS pixels per second
  renderX(x);
  requestAnimationFrame(tick);
}
```

### Pattern 3 — Clamped Decorative Motion

**What it does:** Prevents long stalls from producing a sudden large movement.

**When to use it:** Background effects, decorative elements, and interactions where visual continuity matters more than exact catch-up time.

```js
const MAX_DT = 0.05;
let last = null;
function tick(time) {
  const raw = last === null ? 0 : (time - last) / 1000;
  last = time;
  update(Math.min(raw, MAX_DT));
  render();
  requestAnimationFrame(tick);
}
```

### Pattern 4 — Visibility-Aware Pause

**What it does:** Stops background work when the document is hidden and resets timing before resuming.

**When to use it:** Canvas scenes, decorative animations, simulation loops, and dashboards that do not need hidden-tab catch-up.

```js
function handleVisibility() {
  if (document.hidden) {
    loop.stop();
  } else {
    loop.resetClock?.();
    loop.start();
  }
}
document.addEventListener('visibilitychange', handleVisibility);
```

### Pattern 5 — Fixed-Step Accumulator

**What it does:** Advances simulation in consistent increments and renders with an interpolation factor.

**When to use it:** Collision-heavy scenes, custom physics, replayable simulation, or systems where stable update steps are more important than simplicity.

```js
accumulator += Math.min(dt, 0.1);
let steps = 0;
while (accumulator >= STEP && steps < MAX_STEPS) {
  previous = copy(state);
  simulate(state, STEP);
  accumulator -= STEP;
  steps += 1;
}
render(interpolate(previous, state, accumulator / STEP));
```

### Pattern 6 — Shared Ticker Subscription

**What it does:** Gives multiple modules one clock and a common scheduling/visibility policy.

**When to use it:** Multi-module pages where canvas scenes, custom cursors, and visual effects need coordinated timing and have related lifetimes.

```js
const unsubscribe = ticker.subscribe(({ time, dt }) => {
  updateModule(time, dt);
});
// On module disposal:
unsubscribe();
```

### Pattern 7 — Demand Rendering

**What it does:** Schedules a render only when state becomes dirty instead of running continuously.

**When to use it:** Static diagrams, infrequently changing visualizations, editors, and canvas-based UI that only changes in response to user actions.

```js
let frameId = null;
function invalidate() {
  if (frameId !== null) return;
  frameId = requestAnimationFrame(() => {
    frameId = null;
    render();
  });
}
```

### Pattern 8 — Reduced-Motion Gate

**What it does:** Selects a static or low-motion representation when the user requests reduced motion.

**When to use it:** Decorative scenes, parallax, animated backgrounds, auto-running visuals, and motion-heavy transitions.

```js
const query = matchMedia('(prefers-reduced-motion: reduce)');
function syncMotion() {
  if (query.matches) {
    loop.stop();
    renderStaticState();
  } else {
    loop.start();
  }
}
query.addEventListener('change', syncMotion);
syncMotion();
```

## Mistakes and Fixes

| ID | Mistake | Why it fails | Fix |
| --- | --- | --- | --- |
| A | Moving a fixed number of pixels per callback | Motion speed changes with refresh rate and dropped frames | Multiply a per-second rate by elapsed seconds |
| B | Treating rAF as a fixed 16 ms timer | Displays and scheduling intervals vary | Use the callback timestamp and test multiple refresh rates |
| C | Ignoring the first timestamp | Initial delta may be meaningless or huge | Initialize the previous timestamp on the first callback |
| D | Allowing unbounded deltas after a stall | Objects can jump or numerical simulation can destabilize | Clamp visual deltas or use a bounded fixed-step accumulator |
| E | Starting a loop without checking state | Repeated starts create duplicate callback chains | Make `start()` idempotent with a running flag |
| F | Cancelling a frame but leaving running true | A current callback can schedule another frame | Clear running state before cancellation |
| G | Using `0` as the only no-frame sentinel | Request IDs are opaque values | Use `null` to represent no pending frame |
| H | Never pausing on hidden documents | Wasted work and a large resume delta | Listen to `visibilitychange` and reset the clock on resume |
| I | Registering listeners without cleanup | Navigation and remounts accumulate handlers | Remove listeners in the owner's `dispose()` path |
| J | Combining simulation and drawing in one function | Logic becomes difficult to test and profile | Split update, render, and scheduling responsibilities |
| K | Doing layout reads after every DOM write | Forced synchronous layout can cause jank | Batch reads and writes and cache stable measurements |
| L | Logging every frame | Logging overhead can distort timing | Aggregate metrics and sample them outside the hot path |
| M | Assuming a shared ticker guarantees smoothness | One slow subscriber can delay every subscriber | Profile subscribers and isolate expensive work |
| N | Swallowing callback errors silently | Failures become invisible and may repeat indefinitely | Stop or isolate the faulty loop and report the error |
| O | Stopping at an arbitrary frame for reduced motion | The static state may be incomplete or misleading | Render a deliberate static representation |
| P | Ignoring canvas backing-store scale | Graphics blur or consume excessive memory | Size backing pixels using a measured and capped DPR |
| Q | Resizing the canvas every frame | Backing-store resets clear content and waste work | Resize only when observed dimensions actually change |
| R | Keeping GPU objects after stopping | GPU memory remains allocated after the loop ends | Dispose renderer-owned resources using the library API |
| S | Using rAF for a simple style transition | Adds lifecycle and timing complexity unnecessarily | Prefer CSS transitions or Web Animations when sufficient |
| T | Testing only on a fast 60 Hz display | Timing assumptions remain hidden | Test at multiple simulated rates and with CPU throttling |

## Quick Reference

| Need | Recommended approach | Important detail |
| --- | --- | --- |
| Start a loop | `requestAnimationFrame(tick)` | Schedule only one pending frame |
| Stop a loop | `cancelAnimationFrame(frameId)` | Also set the running state to false |
| Measure elapsed time | Callback timestamp | Convert milliseconds to seconds explicitly |
| Move at a stable rate | `velocity * dtSeconds` | Keep velocity units clear |
| Handle first frame | `lastTime === null` check | Start with zero elapsed time |
| Avoid huge jumps | Clamp `dt` | Choose a clamp based on desired behavior |
| Simulate fixed steps | Accumulator loop | Cap catch-up steps per rendered frame |
| Pause hidden tabs | `visibilitychange` | Reset clock before resuming |
| Respect motion settings | `matchMedia` reduced-motion query | Update behavior when preference changes |
| Render only on change | Dirty flag + one pending frame | Clear the frame handle before rendering |
| Coordinate modules | Shared ticker | Unsubscribe every module during disposal |
| Measure callback cost | `performance.now()` | Do not confuse callback duration with frame interval |
| Inspect jank | DevTools Performance panel | Look for long tasks, layout, paint, and dropped frames |
| Resize canvas | `ResizeObserver` + DPR scaling | Avoid repeated backing-store resets |
| Preserve accessibility | Native controls and text equivalents | Do not communicate important data only through pixels |
| Avoid hidden CPU usage | Stop when inactive or unsubscribed | Verify mount/unmount cycles in tests |

## Build Challenge: Production-Ready Animation Controller

Build a reusable animation controller for a Canvas-based particle field. It should be suitable for a production landing page and should remain predictable when users switch tabs, resize the viewport, change motion preferences, or navigate away.

1. Create a `RafLoop` or equivalent abstraction with explicit `start()`, `stop()`, `resetClock()`, and `dispose()` methods.
2. Ensure repeated calls to `start()` never create more than one pending frame request.
3. Drive particle movement using delta time expressed in seconds, with named constants that document velocity units.
4. Establish a zero-delta baseline on the first callback after start or resume.
5. Clamp decorative motion after long stalls and record a diagnostic counter for clamped frames.
6. Pause the loop when `document.hidden` becomes true and resume with a reset clock when the document becomes visible.
7. Respect `prefers-reduced-motion: reduce` by rendering a meaningful static state and not running a continuous decorative loop.
8. Use `ResizeObserver` to measure the canvas container and update backing-store dimensions only when the size changes; cap device pixel ratio to a documented maximum.
9. Provide a real keyboard-operable `<button>` that lets the user pause and resume the effect, with an accessible name and a visible `:focus-visible` treatment.
10. Provide meaningful text outside the canvas explaining the visual or its purpose; do not rely on canvas pixels as the only information channel.
11. Implement idempotent disposal that cancels the frame request and removes all event listeners and observers.
12. Add diagnostics for frame interval, callback execution duration, and count of frames exceeding the chosen threshold, without logging every frame.
13. Test that 30 Hz, 60 Hz, and 120 Hz simulated callbacks move a particle approximately the same distance over one simulated second.
14. Test pause/resume after a simulated 5-second gap and verify that the particle does not teleport when resumed.
15. Test repeated start/stop cycles and repeated mounting/unmounting to verify there are no duplicate callbacks or retained listeners.
16. Include a failure/edge-case test in which `render()` throws once; verify the documented error policy prevents an infinite error loop and surfaces the failure to diagnostics.
17. Test the reduced-motion preference both on initial load and when the preference changes while the page is open.
18. Test zero-sized containers, very large device pixel ratios, and a canvas removed from the DOM during a pending frame.
19. Record a short DevTools Performance trace with CPU throttling enabled and identify the largest frame-time contributor.
20. Document which behaviors are deliberately paused, clamped, or skipped and why those trade-offs fit a decorative particle field.

### Definition of Done / Success Criteria

- [ ] The controller is idempotent: one active controller has at most one pending rAF request.
- [ ] Motion speed is consistent across 30 Hz, 60 Hz, and 120 Hz simulated frame schedules within a stated tolerance.
- [ ] A long stall and hidden-tab resume do not produce a visible position jump.
- [ ] The loop stops when paused, disposed, hidden, or gated by reduced-motion preference.
- [ ] The static state remains meaningful and visually complete when motion is reduced.
- [ ] Keyboard users can pause and resume using a semantic button with a visible focus indicator.
- [ ] The canvas has a useful textual equivalent or explanation outside the drawing surface.
- [ ] Resize handling updates the backing store only when required and caps DPR to prevent runaway pixel counts.
- [ ] Cleanup removes the frame request, event listeners, and resize observer; repeated cleanup is safe.
- [ ] The injected render-error test does not create an endless callback chain and the error is observable.
- [ ] DevTools evidence identifies measured bottlenecks rather than relying on guesses.
- [ ] The code includes a short support note for the browsers and rendering contexts it expects.

## Implementation Checklist

Before merging a loop into a production application, confirm the following:

- [ ] The animation genuinely needs JavaScript-driven per-frame logic.
- [ ] The callback timestamp is used as the time source, and units are explicit.
- [ ] The first frame and resume frame cannot produce a huge delta.
- [ ] A long frame has a defined policy: clamp, fixed-step, or intentional catch-up.
- [ ] Start and stop operations are idempotent.
- [ ] A single owner controls lifecycle and cleanup.
- [ ] Hidden-tab and reduced-motion behavior are deliberate and tested.
- [ ] Rendering can be profiled independently from simulation.
- [ ] DOM measurement and mutation are not interleaved in a layout-thrashing pattern.
- [ ] Canvas scale and device pixel ratio are managed without unnecessary resets.
- [ ] Error handling cannot silently schedule endless failing callbacks.
- [ ] Keyboard and assistive-technology users have equivalent controls and information.
- [ ] The loop is tested under throttled CPU conditions and repeated lifecycle transitions.

## Additional Gotchas

**Gotcha:** rAF is aligned to repaint, not to an exact wall-clock interval. Do not use callback count as elapsed time for timers, deadlines, or financial/real-time measurements.

**Gotcha:** a browser can suspend a background page for much longer than your clamp threshold. Decide whether a simulation pauses or reconciles against an absolute timestamp; do not let an accidental implementation choice determine the product behavior.

**Gotcha:** `cancelAnimationFrame()` only cancels the identified pending request. If the callback already ran and scheduled a new request, cancel the new handle too or make the running guard prevent rescheduling.

**Gotcha:** `canvas.width = ...` resets the drawing context state, including transforms and styles. Reapply required context state after a real backing-store resize.

**Gotcha:** a high device pixel ratio has a quadratic effect on backing-store pixels. Doubling DPR in both dimensions can mean four times the pixel workload.

**Gotcha:** an animation that looks smooth in a short recording can still leak after repeated route transitions. Test lifecycle loops, not only a single page load.

**Gotcha:** reduced motion does not necessarily mean “remove all information.” Replace motion with a useful stable representation and keep controls available.

**Gotcha:** a single global ticker can create cross-module failures if one subscriber blocks or throws. Add subscriber-level timing and a documented error policy.

## Review Questions

1. Why does multiplying velocity by delta time make movement independent of refresh rate?
2. Why should the first callback normally use a zero delta?
3. When is clamping delta time a better product choice than catching up?
4. What is the spiral-of-death problem in fixed-step simulation?
5. Why is a `running` flag needed even when a frame identifier is stored?
6. How should a loop respond when the document becomes hidden and then visible again?
7. What are the benefits and risks of a shared ticker?
8. Why should render-on-demand be considered for mostly static scenes?
9. What does `prefers-reduced-motion` change about scheduling and rendering?
10. How can DevTools distinguish expensive JavaScript from layout, paint, or GPU work?
11. Why does canvas backing-store scale matter for both sharpness and performance?
12. What tests prove that cleanup is correct after repeated mount/unmount cycles?

## Further Design Guidance

Keep the loop API small. An abstraction with `start`, `stop`, `resetClock`, `invalidate`, and `dispose` is often easier to reason about than a general-purpose scheduler with many loosely related flags. Add a feature only when a real consumer needs it. If multiple animation modules share a clock, specify callback ordering and whether subscribers may unsubscribe during iteration. If deterministic simulation is required, keep random seeds, input events, and simulation steps explicit so a bug can be replayed.

For event-driven interfaces, schedule visual work after state changes rather than performing all drawing inside input handlers. This lets multiple input events coalesce into one frame and avoids repeated work before the next repaint. For drag interactions, capture pointer state in the input layer, update a model, and let the next frame render the model. Do not assume a pointer event arrives exactly once per frame or that the input event rate equals the display refresh rate.

When using an animation controller inside a component framework, avoid creating a new controller on every render. Create it at the correct lifecycle boundary, retain stable references, and dispose it when the owner is removed. If configuration changes, update the controller through an explicit method or recreate it deliberately. Avoid stale closures by ensuring the callback reads current state through a supported pattern rather than capturing outdated values.

Do not let the animation loop become a second application state system. It should consume application state or own a clearly scoped simulation state, then publish meaningful events at a reasonable frequency. It should not emit an accessibility live-region update every frame. For progress or status, announce meaningful milestones instead of animation ticks.

## Reference Summary

A reliable rAF system is based on five practical decisions: what owns it, how time is measured, how stalls are handled, when work should pause, and how it is verified. Use callback timestamps and seconds-based deltas for variable-step motion. Use a fixed-step accumulator when simulation stability demands it. Keep a single pending request, pause when appropriate, reset timing after discontinuities, and dispose every associated resource. Prefer declarative browser animation for simple effects, and use a JavaScript loop when dynamic state or a rendering engine truly requires it.
