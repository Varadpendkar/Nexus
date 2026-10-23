# Canvas Particle System — Production Skill Guide

> **Purpose:** Design, implement, profile, and maintain robust particle systems for creative websites, data-rich interfaces, ambient backgrounds, interactive hero sections, and lightweight simulations using the Canvas 2D API.
>
> **Use this skill when:** a scene contains many independently moving marks—dots, sparks, stars, dust, confetti, bubbles, trails, or nodes—and DOM elements or individual SVG elements would create excessive layout, style, or rendering overhead.
>
> **Do not use this skill as a default:** for a small number of meaningful interactive objects, semantic DOM or SVG may be easier to inspect, expose to assistive technology, and maintain. Canvas is a pixel surface; it does not automatically provide accessible object semantics.

## Operating principles

A production particle system is not simply a loop that draws circles. It is a small simulation with a lifecycle, state model, coordinate system, time model, rendering pipeline, input model, and resource budget. The most reliable implementations separate those responsibilities so the simulation can be tested independently from drawing and the drawing can be tuned without changing the simulation rules.

The implementation in this guide follows these principles:

- **Bound the work.** Set a particle budget, cap elapsed time, avoid allocating objects in the hot loop, and stop when the scene is not useful.
- **Use time, not frame count.** Motion should be measured in seconds and remain plausible across different refresh rates.
- **Separate simulation from rendering.** Update state first; then draw a coherent frame from that state.
- **Treat resize and visibility as lifecycle events.** Recompute dimensions, handle device-pixel ratio changes, and suspend work when the page is hidden.
- **Make interaction optional.** Pointer effects should enhance a scene without being required to understand the page or operate its controls.
- **Design reduced-motion behavior up front.** A still composition, a lower-motion mode, or a user-controlled pause is a valid designed state, not an afterthought.
- **Measure before optimizing.** Profile particle count, draw calls, blur, compositing, and allocation pressure separately.

### 1. Mental model: a particle is state, not a DOM node

A particle is a compact record of the values needed to simulate and render one moving mark. A typical record includes position, velocity, size, opacity, lifetime, and possibly a hue or type. The Canvas API does not retain these particles for you: the application owns the data and redraws the current state onto the canvas.

This distinction matters. Updating a DOM node may trigger style recalculation or layout depending on what changes. Canvas drawing does not create a DOM node for each mark, but it does consume CPU/GPU time to execute drawing commands and rasterize the result. Canvas avoids DOM overhead; it does not make rendering free.

Use a plain object while learning and while the particle count is modest. Consider typed arrays or object pools only when profiling identifies allocation or memory pressure. Prematurely compressing state can make code hard to understand without producing a measurable improvement.

```js
function createParticle(width, height, random = Math.random) {
  const angle = random() * Math.PI * 2;
  const speed = 12 + random() * 28; // CSS pixels per second
  return {
    x: random() * width,
    y: random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: 0.8 + random() * 2.2,
    alpha: 0.25 + random() * 0.65,
    age: 0,
    lifetime: 8 + random() * 18,
  };
}
```

A particle's state should have a clear unit. Positions and radii are normally expressed in CSS pixels, velocities in CSS pixels per second, age in seconds, and alpha in the range from zero to one. Mixing units is a common source of subtle bugs. If velocity is expressed per frame but elapsed time is expressed in seconds, motion changes with refresh rate.

### 2. Mental model: simulation and rendering are separate phases

The simulation phase advances particle state: position, velocity, age, forces, collision rules, and lifecycle transitions. The render phase clears or composites the canvas and draws each particle. Keeping these phases separate makes it possible to test the physics without a browser and to change rendering style without changing the movement model.

For a small system, one `requestAnimationFrame` callback can call both functions. The separation is conceptual, not a requirement to create separate animation loops. Never create one animation loop per particle. A single scheduler coordinates the entire scene, makes the work predictable, and supports pause/resume behavior.

```js
function updateParticles(particles, dt, width, height) {
  for (const particle of particles) {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    wrapParticle(particle, width, height);
  }
}

function drawParticles(ctx, particles) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const particle of particles) {
    ctx.globalAlpha = particle.alpha;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
```

The example assumes that canvas dimensions and the context transform have already been configured so the coordinates used by the simulation match the intended drawing coordinates. The complete lifecycle example later in the guide provides setup, resize, scheduling, and teardown.

### 3. Mental model: frame time is a budget

Every frame has a deadline. At 60 Hz, a frame interval is about 16.7 milliseconds; at 120 Hz, it is about 8.3 milliseconds. Your particle system shares that budget with browser rendering, JavaScript from the rest of the page, image decoding, layout, and other animations. A system that uses 12 milliseconds at 60 Hz may visibly stutter at 120 Hz or when the browser is under load.

Do not use the nominal refresh rate as a guarantee. `requestAnimationFrame` is aligned with the browser's rendering cycle when the page is eligible to render, but callbacks may be delayed. Use the timestamp supplied to the callback, clamp extreme elapsed time, and decide how the simulation should behave after a long pause.

```js
const MAX_DT = 1 / 30; // Avoid a giant simulation jump after a pause.

function getDeltaSeconds(now, previous) {
  if (previous == null) return 0;
  const raw = (now - previous) / 1000;
  return Math.min(Math.max(raw, 0), MAX_DT);
}
```

A capped delta prevents a tab returning from suspension from moving every particle across the entire screen in one update. For deterministic simulations, a fixed-step accumulator can be appropriate; for ambient decorative effects, a clamped variable step is often simpler. Choose based on the effect, not by habit.

### 4. Mental model: density is a design parameter

Particle count should be chosen according to canvas area, visual density, particle size, overlap, and rendering cost—not simply a hard-coded number that looked good on one laptop. A hero area that is four times larger may need a larger count to preserve the same density, but increasing count linearly with area can also quadruple the rendering work. Use a cap and tune the density deliberately.

A practical approach is to derive a target from area and clamp it. Keep the minimum and maximum values configurable so art direction can override the automatic estimate. For responsive designs, density can be lower on small screens or constrained devices while preserving the visual character of the scene.

```js
function chooseParticleCount(width, height, options = {}) {
  const {
    perMillionPixels = 90,
    min = 24,
    max = 220,
  } = options;
  const area = Math.max(0, width) * Math.max(0, height);
  return Math.round(Math.max(min, Math.min(max, area / 1_000_000 * perMillionPixels)));
}
```

This is a starting heuristic, not a universal optimum. Large soft particles, shadows, blending, and connection lines cost more than small opaque circles. Profile the actual effect on target devices and adjust the maximum based on measured frame time.

### 5. Mental model: Canvas is a bitmap, not an accessible scene graph

Screen readers cannot infer that a painted circle represents a meaningful status, button, chart point, or navigation target. If particles are purely decorative, keep the canvas out of the accessibility tree with `aria-hidden="true"` and ensure that the page's meaningful content remains available in HTML. If the canvas represents data or interactive entities, provide an accessible DOM representation, a concise summary, keyboard-operable controls, and an alternative way to inspect important values.

A canvas element may include fallback content between its tags, but relying on fallback content alone is not enough for a complex interactive visualization. Pair the canvas with semantic content and controls. Pointer interaction should not be the only path to functionality; keyboard input and touch input should have equivalent, meaningful behavior where interaction is required.

```html
<section class="particle-hero" aria-labelledby="hero-title">
  <canvas class="particle-hero__canvas" aria-hidden="true"></canvas>
  <div class="particle-hero__content">
    <h1 id="hero-title">Explore the signal</h1>
    <p>The animated background is decorative; this content remains readable without it.</p>
    <figure class="ambient-hero__caption">
      <figcaption>Slow motion, optional by design.</figcaption>
    </figure>
    <a href="/explore">Explore projects</a>
  </div>
</section>
```

### 6. Architecture: define the system boundary

Before coding, decide what owns the canvas, what owns the simulation, and what should trigger its lifecycle. A small component may keep everything in one module. A larger experience may separate `ParticleSystem`, `ParticleRenderer`, `PointerField`, and a React/Vue/Svelte adapter. Do not add abstraction layers solely to make the folder structure look sophisticated; add them when they isolate a real responsibility or simplify testing.

A useful boundary exposes a narrow public API such as `start()`, `stop()`, `resize(width, height)`, `setReducedMotion(enabled)`, and `destroy()`. Internal arrays, timing state, and rendering details should not leak into page-level code. A lifecycle API also makes it easier to prevent duplicate loops when a component mounts more than once or a route transition replaces the scene.

```js
class ParticleSystem {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = options;
    this.running = false;
    this.frameId = null;
    this.particles = [];
    this.previousTime = null;
    this.destroyed = false;
  }

  start() { /* create one loop, if eligible */ }
  stop() { /* cancel the pending frame */ }
  resize(width, height) { /* update dimensions and policy */ }
  destroy() { /* stop and release all owned resources */ }
}
```

The stub is an interface sketch, not a complete implementation. Methods must be idempotent where practical: calling `stop()` twice should not throw, and calling `start()` twice should not create two concurrent loops. `destroy()` should make later starts impossible or explicitly document a reusable lifecycle.

### 7. Coordinate spaces and high-DPI rendering

A canvas has a CSS display size and a backing bitmap size. These are not the same thing. If a canvas is displayed at 800 by 400 CSS pixels on a device with a device-pixel ratio of 2, its backing bitmap should normally be 1600 by 800 pixels for crisp rendering. Simulation positions should usually stay in CSS-pixel units; the context transform scales those positions to the backing bitmap.

Changing `canvas.width` or `canvas.height` clears the bitmap and resets context state, including transforms. Therefore, every resize routine must reapply the transform and any required context settings after changing dimensions. Avoid assigning dimensions on every frame: resizing resets the drawing state and forces reallocation or clearing work.

```js
function configureCanvas(canvas, ctx, cssWidth, cssHeight, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: cssWidth, height: cssHeight, dpr };
}
```

A device-pixel-ratio cap is a quality/performance trade-off. It is not universally correct to cap at 2; the right value depends on the art direction, screen size, memory budget, and target devices. If the canvas fills a large 4K display, an uncapped ratio can create a very large backing bitmap. Measure memory and visual quality before choosing the cap.

### 8. Resize lifecycle: observe the actual container

Window `resize` is not the only way a component's size changes. A side panel may open, a grid may reflow, a font may load, or a parent may change size without a viewport resize. `ResizeObserver` can observe the container that defines the canvas size. Use the observed content box as the source of truth and guard against zero-size dimensions during initial layout or hidden states.

When the canvas changes size, decide what should happen to existing particles. Options include preserving normalized positions, preserving CSS-pixel positions and wrapping them, rebuilding the population, or resetting the composition. For a hero background, normalized positions often preserve the overall distribution. For a physics simulation, resizing may need to preserve actual positions and then apply boundary rules.

```js
const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0];
  if (!entry) return;
  const { width, height } = entry.contentRect;
  if (width <= 0 || height <= 0) return;
  system.resize(width, height);
});
resizeObserver.observe(container);

// During component teardown:
// resizeObserver.disconnect();
```

Do not read layout repeatedly inside the animation loop. Read dimensions at lifecycle boundaries and store them. Mixing frequent layout reads with style writes can cause forced synchronous layout in surrounding DOM code, even though drawing itself happens through Canvas.

### 9. Time-based motion and integration

For simple constant velocity, Euler integration is sufficient: `x += vx * dt`. For acceleration, update velocity first and then position. This is easy to understand and usually adequate for decorative particle effects. For more demanding simulations with springs, collisions, or stable constraints, consider fixed time steps and a carefully chosen integration method. Do not imply that a more advanced integrator automatically makes a visual effect better; it may be unnecessary complexity for a drifting background.

Use consistent units. If `vx` is CSS pixels per second and `dt` is seconds, position is in CSS pixels. If you define acceleration in CSS pixels per second squared, velocity changes by `ax * dt`. A common bug is to add acceleration directly to position or to forget the time factor, making behavior dependent on frame rate.

```js
function integrate(p, dt) {
  p.vx += p.ax * dt;
  p.vy += p.ay * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
}
```

For decorative scenes, add a maximum speed if forces can accumulate indefinitely. Clamp extreme values after numerical anomalies, and ensure that invalid numbers do not poison the entire render loop. A `NaN` coordinate may silently cause a particle to disappear while the rest of the system continues, so instrumentation should detect invalid state during development.

### 10. Lifecycle and particle recycling

Particles commonly have a lifetime or boundary condition. When a particle expires, either remove it, replace it, or recycle it. Splicing an array while iterating forward can skip the next particle because later indices shift. A reverse loop, a write-index compaction pass, or a pool avoids that bug. For a fixed-count ambient field, recycling expired particles often keeps population and memory usage stable.

A pool is useful when particles are frequently created and destroyed, such as sparks on pointer movement or bursts of confetti. It is not mandatory for every scene. If the population is small and spawning is rare, simple allocation may be clearer and fast enough. Optimize allocation patterns based on profiling, not a blanket belief that object allocation is always the bottleneck.

```js
function updateAndRecycle(particles, dt, width, height, spawn) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.age >= p.lifetime || isOutside(p, width, height)) {
      particles[i] = spawn(width, height);
    }
  }
}

function isOutside(p, width, height) {
  const margin = p.radius * 2;
  return p.x < -margin || p.x > width + margin || p.y < -margin || p.y > height + margin;
}
```

Replacement must not accidentally change array length or leave stale references. If particle count is intentionally variable, use a removal strategy that preserves iteration correctness. If the scene must be deterministic, use a seeded random source and define exactly when replacement particles are spawned.

### 11. Boundary behaviors: wrap, bounce, fade, and respawn

Boundary behavior strongly affects the visual character of a scene. Wrapping is seamless for drifting stars but can make particles pop if they are visible at the edge. Bouncing is useful for bounded simulations but can look mechanical for ambient dust. Fading near the boundary hides discontinuities. Respawning at a chosen edge creates directional flow, such as rain or windblown sparks.

Pick one explicit policy per particle type. Avoid scattered checks that implement slightly different edge behavior in different functions. Keep boundary logic in a helper so it can be unit tested and changed independently of rendering.

```js
function wrapParticle(p, width, height) {
  if (p.x < 0) p.x += width;
  else if (p.x >= width) p.x -= width;
  if (p.y < 0) p.y += height;
  else if (p.y >= height) p.y -= height;
}

function bounceParticle(p, width, height) {
  if (p.x < p.radius || p.x > width - p.radius) p.vx *= -1;
  if (p.y < p.radius || p.y > height - p.radius) p.vy *= -1;
  p.x = Math.max(p.radius, Math.min(width - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(height - p.radius, p.y));
}
```

The simple wrap helper assumes the particle does not travel more than one full dimension in a single update. If high velocities or a large `dt` can cross multiple dimensions, use modulo-safe wrapping. Bounce logic should also consider the case where the canvas is smaller than the particle diameter; clamp dimensions or switch to a no-motion policy for very small containers.

### 12. Forces and interaction fields

Forces can be implemented as velocity changes, direct steering, or target attraction. For ambient interaction, a pointer can repel particles within a radius. Calculate squared distance first and take a square root only for particles inside the influence radius. This avoids unnecessary square roots for most particles and keeps the interaction model easy to reason about.

Use a falloff function so the force fades smoothly to zero at the influence boundary. Abrupt force changes can make particles jitter when crossing the radius. Add a maximum force and a damping term if particles gain too much speed or continue oscillating around the pointer.

```js
function applyRepulsion(p, pointer, dt) {
  if (!pointer.active) return;
  const dx = p.x - pointer.x;
  const dy = p.y - pointer.y;
  const d2 = dx * dx + dy * dy;
  const radius = pointer.radius;
  if (d2 <= 0.0001 || d2 >= radius * radius) return;
  const distance = Math.sqrt(d2);
  const falloff = 1 - distance / radius;
  const force = Math.min(pointer.strength * falloff, 180);
  p.vx += (dx / distance) * force * dt;
  p.vy += (dy / distance) * force * dt;
}
```

Pointer coordinates must be translated into the canvas's CSS-pixel coordinate system. `clientX` and `clientY` are viewport coordinates; subtract the canvas bounding rectangle's `left` and `top`. If the canvas has CSS transforms, borders, or nontrivial scaling, confirm that the coordinate mapping matches the simulation space. Touch and pen input can use Pointer Events, which unify mouse, touch, and stylus input for many use cases.

### 13. Pointer lifecycle and touch behavior

Listen on the canvas or its interaction wrapper, not globally on `window`, unless the effect truly needs the entire viewport. Track pointer movement, enter, leave, and cancellation. Clear active pointer state on `pointerleave`, `pointercancel`, and when the page becomes hidden. Do not call `preventDefault()` indiscriminately: it may block scrolling, text selection, or other native behavior. If a gesture intentionally consumes touch input, set an appropriate `touch-action` value on the specific interaction surface and explain the interaction to users.

```js
const pointer = { x: 0, y: 0, active: false };

function onPointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
  pointer.active = true;
}
function onPointerLeave() { pointer.active = false; }

canvas.addEventListener('pointermove', onPointerMove, { passive: true });
canvas.addEventListener('pointerleave', onPointerLeave);
canvas.addEventListener('pointercancel', onPointerLeave);

// Cleanup must remove these same function references.
```

Avoid creating new handler functions on every render in a framework component. Store stable handlers and remove them during teardown. For touch devices, a pointer may remain at its last location or generate different event sequences depending on the interaction. Reset state on cancellation and test actual hardware, not only desktop emulation.

### 14. Rendering strategy: one path, many marks

Canvas rendering performance depends on both the number of particles and the number and type of drawing operations. For repeated circles with the same fill style, build one path and fill once when doing so preserves the intended appearance. However, particles with distinct alpha, blend modes, gradients, or shadows may need separate draws or grouped batches. Batching is not always correct when transparency order affects the result.

```js
function drawUniformDots(ctx, particles) {
  ctx.beginPath();
  for (const p of particles) {
    ctx.moveTo(p.x + p.radius, p.y);
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  }
  ctx.fillStyle = '#b8c8ff';
  ctx.fill();
}
```

The `moveTo` before each `arc` prevents the current path from connecting the end of one arc to the start of the next. This technique works for same-style marks. If each particle has different opacity, color, or compositing behavior, batch by compatible style or use a different strategy. Do not assume a single path is always faster; profile in the browsers and devices you support.

### 15. Trails, fading, and compositing

A traditional particle canvas clears the full drawing area before each frame. Trails can be created by drawing a translucent rectangle over the previous frame rather than fully clearing it. This creates persistence, but alpha compositing accumulates and can produce an unintended wash or darkening. The correct fill alpha depends on frame rate and the desired decay time.

Use `globalCompositeOperation` deliberately and restore the default after specialized drawing. Blend modes can produce compelling light effects, but their appearance may vary with background color and overlapping particles. Keep a normal-compositing fallback when the effect must remain legible. Do not leave `globalAlpha`, transforms, shadows, or composite operations changed for subsequent draws.

```js
function drawTrailFade(ctx, width, height, fadeAlpha) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = fadeAlpha;
  ctx.fillStyle = '#050711';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
```

This fade helper assumes an opaque dark background. For transparent canvases layered over arbitrary page content, a solid fill would destroy transparency and visually cover the content. Use a clear operation or a carefully chosen compositing strategy when transparency is required. The page's CSS background and the canvas's alpha channel should be treated as separate design decisions.

### 16. Deterministic randomness and seeded scenes

Randomness gives particle scenes variety, but uncontrolled randomness makes bugs hard to reproduce and visual regression tests noisy. Inject a random function into particle creation rather than calling `Math.random()` everywhere. A seeded pseudo-random generator allows a bug report to specify a seed and allows screenshot tests to reproduce the same initial scene.

A seed does not automatically make an entire simulation deterministic. The sequence of random calls, spawn order, timing model, input events, and floating-point behavior must also be stable enough for the test. If the scene is purely decorative, exact cross-browser pixel equality may be unrealistic; test invariants and broad visual characteristics instead.

```js
function mulberry32(seed) {
  return function random() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20261017);
const sample = createParticle(800, 500, random);
```

For test fixtures, keep seeds explicit and avoid sharing one mutable random stream across unrelated systems unless sequence coupling is intended. Otherwise, adding one random value to a color calculation may unexpectedly alter every later particle's position.

### 17. Accessibility and reduced motion

Decorative particles should not compete with the content they decorate. Keep contrast, flicker, motion amplitude, and visual density conservative. Do not use rapid flashing to communicate state. If movement is nonessential, respect `prefers-reduced-motion: reduce` and provide a stable visual alternative. Reduced motion may mean no loop at all, a static seeded frame, a much lower update frequency, or a low-motion mode; choose the least surprising behavior for the design.

CSS can set an initial visual policy, but JavaScript must also observe the preference if it controls whether an animation loop runs. Listen for preference changes so the system responds if the user changes operating-system settings while the page is open. If the scene has a user-facing pause control, make it a real semantic button with an accessible name and visible focus styling.

```js
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function onMotionPreferenceChange(event) {
  if (event.matches) {
    system.stop();
    system.renderStaticFrame();
  } else {
    system.start();
  }
}

motionQuery.addEventListener('change', onMotionPreferenceChange);
// Remove the listener in the component's teardown path.
```

The example assumes the system provides `renderStaticFrame()`, which should draw one stable state without scheduling another frame. If the target environment requires support for older event APIs, feature-detect `addEventListener` and use the legacy media-query listener only where necessary. Do not add both listeners without guarding against duplicate notifications.

### 18. Visibility, pause, and resource cleanup

Animation should stop when it has no useful work to perform. A hidden tab generally does not need a continuously running simulation; an offscreen hero may not need to animate either. Use `visibilitychange` to suspend work when the document becomes hidden. For long pages, `IntersectionObserver` can indicate whether a canvas is near the viewport. When the scene becomes active again, reset the previous timestamp so the first resumed frame does not integrate an enormous delta.

Every listener, observer, and pending animation frame must have an owner and cleanup path. A detached canvas with a still-running loop can keep references alive and waste work. If the system uses an `AbortController` for listeners, make sure all handlers share the correct signal and that teardown aborts it. `destroy()` should be safe to call after partial initialization.

```js
let frameId = null;
let running = false;
let previousTime = null;

function frame(now) {
  if (!running) return;
  const dt = getDeltaSeconds(now, previousTime);
  previousTime = now;
  updateParticles(particles, dt, width, height);
  drawParticles(ctx, particles);
  frameId = requestAnimationFrame(frame);
}

function start() {
  if (running) return;
  running = true;
  previousTime = null;
  frameId = requestAnimationFrame(frame);
}
function stop() {
  running = false;
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  previousTime = null;
}
```

This loop illustrates the scheduler lifecycle but is not a full component by itself. The final complete example combines it with canvas setup, resize handling, reduced motion, visibility, and teardown. If multiple independent features need animation, consider a shared scheduler rather than many unrelated loops; do not create a scheduler abstraction unless it genuinely simplifies ownership and pause behavior.

### 19. Performance profiling and adaptive quality

Start with a baseline and measure under representative conditions. Track frame duration, particle count, number of draw calls, backing bitmap size, and the cost of optional effects such as shadows, blur, connection lines, and blend modes. The browser Performance panel can reveal long tasks and expensive scripting; frame diagnostics can help distinguish JavaScript cost from rasterization and compositing. Test a low-end mobile device or a throttled profile, not only a desktop development machine.

Optimization options include reducing particle count, capping device pixel ratio, batching same-style drawing, removing expensive shadows, simplifying per-particle math, avoiding per-frame allocations, and skipping work while offscreen. Use adaptive quality carefully: a system that changes density every frame can visibly oscillate. Prefer a small number of quality tiers with hysteresis, and make the fallback aesthetically intentional.

```js
function chooseQuality(frameMs, currentQuality) {
  // Hysteresis avoids switching at a single noisy threshold.
  if (frameMs > 22 && currentQuality === 'high') return 'medium';
  if (frameMs > 28 && currentQuality === 'medium') return 'low';
  if (frameMs < 13 && currentQuality === 'low') return 'medium';
  if (frameMs < 11 && currentQuality === 'medium') return 'high';
  return currentQuality;
}
```

The thresholds are illustrative, not universal. Use rolling averages or percentiles rather than one noisy frame when making quality decisions. Frame time is influenced by the rest of the page, so an adaptive system should not assume every slow frame was caused by particles. Log transitions during development and make quality changes infrequent enough to avoid visual instability.

### 20. Browser compatibility and progressive enhancement

Canvas 2D and `requestAnimationFrame` are widely available in modern browsers, but capabilities and performance vary. `ResizeObserver`, `IntersectionObserver`, media-query change listeners, and OffscreenCanvas have different support histories and execution constraints. Feature-detect optional capabilities and keep the core scene functional without them. Do not use user-agent sniffing as the first choice for capability decisions.

A canvas should enhance the page, not be the only way to access important content. If canvas initialization fails, if JavaScript is disabled, or if the user requests reduced motion, preserve the underlying semantic HTML and provide a stable CSS background or poster state. For browser-specific rendering differences, prefer tolerance-based visual tests rather than expecting identical pixels across all graphics stacks.

```js
function canUseCanvas2D(canvas) {
  if (!canvas || typeof canvas.getContext !== 'function') return false;
  try {
    return Boolean(canvas.getContext('2d'));
  } catch {
    return false;
  }
}
```

Feature detection should not swallow every error silently. In development, report initialization failures through a diagnostic hook or console warning; in production, fail gracefully and leave the fallback visible. If the canvas is essential to a data view, provide an alternate accessible representation rather than treating fallback as optional decoration.

### 21. Testing strategy

Test the pure functions first: particle creation, boundary handling, delta clamping, coordinate mapping, lifecycle transitions, and deterministic random generation. Then test the browser integration: mounting, resizing, reduced motion, page visibility, pointer cancellation, and cleanup. Finally, test the composition visually at representative viewport sizes and pixel ratios.

Avoid asserting exact pixel output for a complex animated scene unless the rendering environment is controlled. Better tests include invariants such as finite positions, bounded particle count, no duplicate loops, no frames after stop, correct cleanup of observers, and stable count after recycling. A seeded initial state can improve screenshot repeatability, but time, fonts, browser rasterization, and device pixel ratio still need control.

```js
function assertFiniteParticle(p) {
  return Number.isFinite(p.x) && Number.isFinite(p.y) &&
    Number.isFinite(p.vx) && Number.isFinite(p.vy) &&
    Number.isFinite(p.radius) && p.radius >= 0;
}

for (const particle of particles) {
  if (!assertFiniteParticle(particle)) {
    throw new Error('Particle state contains invalid numeric values');
  }
}
```

During development, run the assertions at a lower frequency or only in debug builds so validation does not itself dominate the hot loop. Test on real touch hardware when pointer interaction matters. Check keyboard operation, reduced motion, screen-reader reading order, and whether decorative movement distracts from the primary task.

### 22. Debugging playbook

When particles disappear, first check canvas dimensions, context acquisition, alpha, fill style, transforms, and whether coordinates are in CSS pixels or backing-store pixels. When particles move too quickly, inspect velocity units and delta time. When the page stutters, record a performance profile and isolate the effect by reducing count and disabling shadows, blur, blending, and connection lines one at a time.

When resizing makes the scene blurry, confirm the backing bitmap is scaled by the current device pixel ratio and that the transform is reapplied after assigning canvas dimensions. When pointer effects are offset, compare `clientX/clientY` to `getBoundingClientRect()` and confirm the canvas is not being scaled unexpectedly by CSS. When the animation continues after navigation, inspect the ownership of the pending frame, event listeners, observers, and framework unmount cleanup.

A useful debugging mode draws a small crosshair at the pointer location, displays particle count and frame time, outlines the canvas bounds, and colors particles by state (for example, lifetime or velocity). Keep these overlays behind a development flag. Diagnostics should expose the state of the system without changing the simulation behavior being diagnosed.

```js
function drawDebugOverlay(ctx, { width, height, pointer, particleCount, frameMs }) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#ffcc66';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, Math.max(0, width - 1), Math.max(0, height - 1));
  if (pointer?.active) {
    ctx.beginPath();
    ctx.moveTo(pointer.x - 6, pointer.y);
    ctx.lineTo(pointer.x + 6, pointer.y);
    ctx.moveTo(pointer.x, pointer.y - 6);
    ctx.lineTo(pointer.x, pointer.y + 6);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffcc66';
  ctx.font = '12px ui-monospace, monospace';
  ctx.fillText(`particles: ${particleCount} | frame: ${frameMs.toFixed(1)}ms`, 8, 18);
  ctx.restore();
}
```

Only invoke this helper in development builds; overlay text should not become part of the shipped visual composition or cover important content.

### 23. Production-ready complete example

The following example is intentionally self-contained. It includes context setup, high-DPI resizing, a single animation loop, reduced-motion handling, visibility suspension, a resize observer, and cleanup. The canvas is decorative and the meaningful page content remains HTML. The code uses a bounded particle count and a clamped time step. It avoids a loop per particle and resets the previous timestamp after pauses.

```html
<section class="ambient-hero" aria-labelledby="ambient-title">
  <canvas class="ambient-hero__canvas" aria-hidden="true"></canvas>
  <div class="ambient-hero__content">
    <p class="eyebrow">Creative systems</p>
    <h1 id="ambient-title">A quiet field of motion</h1>
    <p>Readable content stays independent of the decorative particle layer.</p>
    <a href="/work">View the work</a>
  </div>
</section>
```

```css
.ambient-hero {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  min-height: 28rem;
  background: #080b14;
  color: #f5f7ff;
}
.ambient-hero__canvas {
  position: absolute;
  inset: 0;
  z-index: -1;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.ambient-hero__content {
  position: relative;
  max-width: 68rem;
  margin-inline: auto;
  padding: clamp(3rem, 10vw, 8rem) 1.25rem;
}
.ambient-hero a:focus-visible {
  outline: 3px solid #b9c8ff;
  outline-offset: 4px;
}
@media (prefers-reduced-motion: reduce) {
  .ambient-hero__canvas { visibility: hidden; }
}
```

```js
function mountParticleHero(container) {
  const canvas = container.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return () => {};

  const random = Math.random;
  const state = {
    width: 0, height: 0, dpr: 1,
    particles: [], frameId: null, running: false,
    previousTime: null, destroyed: false,
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const MAX_DT = 1 / 30;

  function createParticle() {
    const angle = random() * Math.PI * 2;
    const speed = 5 + random() * 18;
    return {
      x: random() * state.width,
      y: random() * state.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 0.7 + random() * 1.8,
      alpha: 0.2 + random() * 0.55,
    };
  }

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(0, rect.width);
    const height = Math.max(0, rect.height);
    if (!width || !height) return;

    const oldWidth = state.width;
    const oldHeight = state.height;
    state.width = width;
    state.height = height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * state.dpr);
    canvas.height = Math.round(height * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

    if (oldWidth && oldHeight && state.particles.length) {
      const sx = width / oldWidth;
      const sy = height / oldHeight;
      for (const p of state.particles) {
        p.x *= sx;
        p.y *= sy;
      }
    } else {
      const count = Math.max(24, Math.min(160, Math.round(width * height / 9000)));
      state.particles = Array.from({ length: count }, createParticle);
    }
    draw();
  }

  function update(dt) {
    for (const p of state.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < -p.radius) p.x = state.width + p.radius;
      if (p.x > state.width + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = state.height + p.radius;
      if (p.y > state.height + p.radius) p.y = -p.radius;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.fillStyle = '#c6d2ff';
    for (const p of state.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!state.running || state.destroyed) return;
    const rawDt = state.previousTime == null ? 0 : (now - state.previousTime) / 1000;
    const dt = Math.min(Math.max(rawDt, 0), MAX_DT);
    state.previousTime = now;
    update(dt);
    draw();
    state.frameId = requestAnimationFrame(frame);
  }

  function start() {
    if (state.destroyed || state.running || reducedMotion.matches || document.hidden) return;
    state.running = true;
    state.previousTime = null;
    state.frameId = requestAnimationFrame(frame);
  }

  function stop() {
    state.running = false;
    if (state.frameId !== null) cancelAnimationFrame(state.frameId);
    state.frameId = null;
    state.previousTime = null;
  }

  function onMotionChange() {
    if (reducedMotion.matches) {
      stop();
      draw();
    } else {
      start();
    }
  }
  function onVisibilityChange() {
    if (document.hidden) stop();
    else start();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  reducedMotion.addEventListener('change', onMotionChange);
  document.addEventListener('visibilitychange', onVisibilityChange);
  resize();
  start();

  return function destroy() {
    if (state.destroyed) return;
    state.destroyed = true;
    stop();
    observer.disconnect();
    reducedMotion.removeEventListener('change', onMotionChange);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    ctx.clearRect(0, 0, state.width, state.height);
  };
}

const hero = document.querySelector('.ambient-hero');
const destroyParticleHero = hero ? mountParticleHero(hero) : () => {};
// Call destroyParticleHero() when the owning page/component is removed.
```

This example uses `ResizeObserver` and modern media-query event listeners. If older browsers are in scope, feature-detect those APIs and supply the appropriate fallback. The example is a foundation, not a promise that the same particle count or quality will suit every device. Tune it using measurements from the actual hero layout and target hardware.

## Named implementation patterns

### Pattern 1 — Bounded Ambient Field

**What it does:** Maintains a fixed, capped population of low-energy particles for a quiet background. **When to use it:** Use for hero sections, dashboard backdrops, or subtle decorative texture where the particles should never overwhelm content.

```js
function makeAmbientField(width, height, count, create) {
  const safeCount = Math.max(0, Math.min(count, 220));
  return Array.from({ length: safeCount }, () => create(width, height));
}
```

Keep the cap close to the system boundary and expose a configuration option for art direction. Use a stable fallback frame for reduced motion and stop the loop when the section is hidden.

### Pattern 2 — Edge-Spawned Stream

**What it does:** Creates particles at a selected edge and moves them in a dominant direction. **When to use it:** Use for rain, wind, data flow, or sparks moving across a viewport. Spawn direction and speed should be explicit rather than random in every dimension.

```js
function spawnFromLeft(height, random = Math.random) {
  return {
    x: -2,
    y: random() * height,
    vx: 40 + random() * 80,
    vy: (random() - 0.5) * 12,
    radius: 1 + random() * 2,
    alpha: 0.25 + random() * 0.5,
  };
}
```

Pair this with a lifecycle rule that respawns a particle only after it exits the right edge. If the stream direction changes responsively, update the policy intentionally rather than mutating random fields in several places.

### Pattern 3 — Pointer Repulsion Field

**What it does:** Pushes particles away from a pointer within a finite radius. **When to use it:** Use for optional playful feedback in a hero or portfolio background, provided it does not interfere with scrolling or primary controls.

```js
function repel(p, pointer, dt, radius = 120) {
  const dx = p.x - pointer.x;
  const dy = p.y - pointer.y;
  const d2 = dx * dx + dy * dy;
  if (!pointer.active || d2 < 0.01 || d2 >= radius * radius) return;
  const d = Math.sqrt(d2);
  const strength = 90 * (1 - d / radius);
  p.vx += dx / d * strength * dt;
  p.vy += dy / d * strength * dt;
}
```

Use a bounded force and optional damping. Make the effect nonessential and ensure pointer state resets on leave and cancellation.

### Pattern 4 — Burst and Recycle

**What it does:** Emits a bounded burst of particles and reuses them when their lifetimes expire. **When to use it:** Use for small celebratory moments, button feedback, or transitions. Avoid continuous bursts on every pointer event, which can create an unbounded workload.

```js
function createBurst(originX, originY, count, random = Math.random) {
  return Array.from({ length: Math.min(count, 100) }, () => {
    const angle = random() * Math.PI * 2;
    const speed = 30 + random() * 120;
    return { x: originX, y: originY,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      age: 0, lifetime: 0.5 + random() * 1.2 };
  });
}
```

Respect reduced motion and keep burst lifetime short. If the action communicates success, also communicate success through semantic text or an accessible status message; particles alone are not an accessible notification.

### Pattern 5 — Distance-Based Connection Network

**What it does:** Draws lines between nearby particles to create a network or constellation. **When to use it:** Use for low-density network motifs where relationships are decorative or the underlying data model is separately available.

```js
function drawConnections(ctx, particles, maxDistance) {
  const maxD2 = maxDistance * maxDistance;
  ctx.beginPath();
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < maxD2) {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      }
    }
  }
  ctx.strokeStyle = 'rgba(170,190,255,0.16)';
  ctx.lineWidth = 0.6;
  ctx.stroke();
}
```

This simple algorithm is O(n²); it is appropriate only for modest populations. For larger networks, use spatial partitioning such as a uniform grid or spatial hash to reduce candidate pairs. Do not run this pattern with a high particle cap without profiling.

### Pattern 6 — Trail Persistence

**What it does:** Leaves a fading trail behind moving particles by overlaying a translucent fill instead of clearing completely. **When to use it:** Use for luminous strokes, motion traces, or data-flow effects when the canvas background is controlled.

```js
function fadePreviousFrame(ctx, width, height, alpha = 0.12) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = Math.max(0, Math.min(alpha, 1));
  ctx.fillStyle = '#050711';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
```

Use only when the background fill is intentional. For transparent overlays, fading with an opaque color may obscure page content. Tune the alpha at multiple refresh rates and preserve a clear fallback.

### Pattern 7 — Adaptive Quality Tiers

**What it does:** Selects among a few predefined particle budgets based on measured frame time. **When to use it:** Use when a scene needs to run across a broad device range and a lower-density fallback still looks designed.

```js
const QUALITY = {
  high: { count: 180, connections: true },
  medium: { count: 100, connections: false },
  low: { count: 48, connections: false },
};

function qualityForDevice(isSmallScreen, reducedMotion) {
  if (reducedMotion) return { count: 0, animate: false };
  return isSmallScreen ? QUALITY.low : QUALITY.medium;
}
```

Prefer an initial quality choice based on user preferences and device constraints, then adapt only if measurements justify it. Do not infer device power from screen width alone; treat viewport size as one signal rather than a benchmark.

## Mistakes and fixes

| Mistake | Why it hurts | Unique fix |
|---|---|---|
| A | Advancing by fixed amounts per frame | Multiply velocity by elapsed seconds and document units. |
| B | Trusting an uncapped delta after a hidden tab | Clamp delta and reset the timestamp when resuming. |
| C | Creating one animation loop per particle | Use one system-level scheduler for all particles. |
| D | Setting canvas width and height every frame | Resize only when the measured display dimensions change. |
| E | Forgetting context transform after resize | Reapply the DPR transform immediately after bitmap resizing. |
| F | Mixing bitmap pixels and CSS pixels | Keep simulation coordinates in CSS pixels and scale the context. |
| G | Removing particles with forward-loop splicing | Iterate backward or compact the array with a write index. |
| H | Letting particle count grow without a ceiling | Enforce a configurable maximum at every spawn boundary. |
| I | Recomputing layout on each animation frame | Cache container dimensions and update them from resize events. |
| J | Leaving pointer state active after cancellation | Clear interaction state on leave, cancel, visibility change, and teardown. |
| K | Calling preventDefault for every pointer event | Preserve native scrolling unless the interaction explicitly requires capture. |
| L | Drawing each connection for both pair orders | Iterate only pairs where the second index is greater than the first. |
| M | Applying shadows to every tiny particle | Remove or batch shadows unless profiling and art direction justify them. |
| N | Treating Canvas as accessible by itself | Keep meaningful content and controls in semantic HTML with an accessible alternative. |
| O | Ignoring reduced-motion preferences | Render a stable frame or disable the animation loop when reduction is requested. |
| P | Failing to stop on component unmount | Cancel the pending frame and disconnect observers/listeners in destroy. |
| Q | Reusing globalAlpha without resetting it | Save/restore context state or explicitly restore alpha after drawing. |
| R | Making randomness impossible to reproduce | Inject a seeded random function into particle creation during tests. |
| S | Assuming one path is always faster | Benchmark batching against individual draws for the actual style mix. |
| T | Increasing DPR without a memory budget | Cap DPR for large surfaces and validate visual quality on target screens. |
| U | Using a quadratic network on thousands of nodes | Add spatial partitioning or lower the network population before drawing edges. |
| V | Testing only on a desktop mouse | Verify touch, pen, cancellation, and actual mobile scrolling behavior. |
| W | Hiding initialization errors in production and development alike | Log diagnostics in development and preserve a graceful visual fallback in production. |
| X | Letting alpha trails cover a transparent page | Use a transparent-safe strategy or intentionally define an opaque background. |
| Y | Switching quality on every noisy frame | Use rolling metrics, hysteresis, and a small number of quality tiers. |
| Z | Leaving a canvas blank when context creation fails | Keep HTML content visible and expose an alternate representation when the canvas is meaningful. |

## Mental models to keep

1. **A particle is a record of state.** It is not a DOM element and it does not draw itself.
2. **A frame is a deadline.** Every optional effect competes for finite time before the next paint.
3. **Coordinates have units.** CSS pixels, backing-store pixels, seconds, and pixels-per-second must not be mixed casually.
4. **The scheduler owns time.** One loop advances the whole simulation and gives pause/resume a single control point.
5. **Density is art direction plus budget.** A pleasing scene is not the scene with the highest count.
6. **Canvas is a bitmap, not a semantic tree.** Meaningful information must have a non-canvas path.
7. **Lifecycle is part of correctness.** Resize, visibility, reduced motion, unmount, and context failure are normal states.
8. **Randomness should be injectable.** Reproducibility makes debugging and testing practical.
9. **Optimization is a measured decision.** Remove the measured bottleneck instead of applying folklore.
10. **Fallbacks are designed states.** A static scene should still look intentional when animation is unavailable or unwanted.

## Gotchas checklist

- **Gotcha 1 — Context reset:** assigning `canvas.width` or `canvas.height` clears the canvas and resets context state, even when assigning the same value. Avoid redundant dimension writes and reconfigure transforms after a real resize.
- **Gotcha 2 — Device-pixel ratio changes:** moving a window between displays can change `devicePixelRatio` without the container dimensions changing. Recheck DPR on relevant resize/display lifecycle events.
- **Gotcha 3 — First-frame delta:** initialize the previous timestamp to `null`; the first frame should normally use `dt = 0` rather than a value derived from page load time.
- **Gotcha 4 — Hidden component dimensions:** `ResizeObserver` can report a zero-size box while an element is hidden. Do not create a zero-sized simulation or divide by zero.
- **Gotcha 5 — Pointer coordinate transforms:** CSS scale/rotation can make bounding-rectangle subtraction insufficient for transformed coordinate systems. Avoid unnecessary transforms on the canvas or explicitly invert the transform.
- **Gotcha 6 — Transparency order:** batching particles with different alpha or blend modes can change the visual result because compositing is order-dependent.
- **Gotcha 7 — Accessibility of effects:** a pause button needs a visible focus state and a label that describes its current action, such as “Pause animation” or “Resume animation.”
- **Gotcha 8 — Cleanup identity:** event listeners are removed by matching the same function reference and capture options used when registering them.

## Quick reference

| Need | Recommended approach | Watch out for |
|---|---|---|
| Stable motion | `requestAnimationFrame` timestamp and `dt` | Frame-count-dependent movement |
| Responsive bitmap | `ResizeObserver` and DPR transform | Context reset on dimension assignment |
| Fixed population | Bounded array and recycle policy | Unbounded spawn paths |
| Mouse/touch input | Pointer Events and local coordinates | Scroll blocking and stale pointer state |
| Low-motion mode | `matchMedia('(prefers-reduced-motion: reduce)')` | Stopping loop but leaving distracting trails |
| Hidden page | `visibilitychange` pause/resume | Large delta on resume |
| Many identical dots | Batched path when appearance is compatible | Alpha and compositing order changes |
| Network edges | Distance threshold and spatial partitioning at scale | O(n²) pair checks |
| Deterministic test | Injected seeded PRNG | Random call order changing the scene |
| Cleanup | Cancel frame, disconnect observers, remove listeners | Detached canvas with active loop |
| Performance issue | Profile and isolate optional effects | Optimizing a component that is not the bottleneck |
| Canvas failure | Semantic HTML and stable fallback | Important information existing only as pixels |

## Build challenge: Interactive Particle Field

Build a responsive particle field for a creative developer portfolio hero. The effect should look polished but remain secondary to the page content. Use Canvas 2D, not one DOM element per particle. The system must work without pointer interaction and must preserve its content if the canvas fails or animation is reduced.

### Requirements

1. Create a semantic hero section with a meaningful heading, descriptive paragraph, and a normal link or button in HTML.
2. Add one decorative canvas with `aria-hidden="true"`; do not put essential text into the bitmap.
3. Acquire the `2d` context safely and leave a usable fallback if it is unavailable.
4. Set backing bitmap dimensions using CSS size and a capped device-pixel ratio.
5. Reapply the context transform after every actual canvas resize.
6. Observe the canvas container with `ResizeObserver` or a documented fallback.
7. Maintain a bounded particle population with a configurable maximum count.
8. Use a single `requestAnimationFrame` loop for the complete scene.
9. Advance motion using elapsed seconds and clamp large delta values.
10. Separate update, render, spawn/recycle, and resize responsibilities into named functions.
11. Include at least one boundary policy and test it at very small container sizes.
12. Support pointer repulsion or attraction with correct local coordinate mapping.
13. Clear pointer state on leave and cancellation; do not block native scrolling unnecessarily.
14. Respect `prefers-reduced-motion` and provide a stable static state.
15. Stop the loop when the document is hidden and resume without a time jump.
16. Cancel the pending frame and remove every listener and observer during teardown.
17. Include a development diagnostic for particle count, frame duration, and invalid numeric state.
18. Profile at multiple particle counts and select a default that meets the performance target.
19. Test desktop mouse and mobile touch behavior, including pointer cancellation.
20. Document browser assumptions and any fallback behavior.

### Definition of done

- [ ] At least 5,500 words of implementation notes are not required for the app itself; the deliverable is the working feature and its concise engineering notes.
- [ ] Canvas bitmap dimensions match CSS dimensions multiplied by the chosen DPR cap, and the transform is reapplied after resize.
- [ ] Particle positions and velocities remain finite through at least five minutes of normal interaction.
- [ ] Particle count never exceeds the configured maximum, including repeated pointer movement and resize events.
- [ ] Motion speed remains visually consistent at 60 Hz and 120 Hz when tested under comparable conditions.
- [ ] A hidden tab pauses the loop; returning to the tab does not create a giant jump.
- [ ] Reduced-motion mode does not run a continuous animation loop and leaves a stable, intentional composition.
- [ ] Teardown leaves no pending animation frame, observer, or event listener owned by the feature.
- [ ] Pointer interactions remain correctly positioned after scrolling and resizing.
- [ ] Keyboard users can reach and operate every meaningful page control without interacting with decorative particles.
- [ ] The hero remains understandable when JavaScript or Canvas 2D is unavailable.
- [ ] A performance profile records the chosen default particle count, device, browser, and approximate frame-time result.

## Final production checklist

Before shipping, confirm that the scene has a clear visual purpose and does not obscure text, buttons, or forms. Confirm that the simulation units are explicit, the time step is bounded, and the population has a ceiling. Confirm that resize, hidden-page, reduced-motion, pointer cancellation, and teardown are all treated as normal lifecycle states. Confirm that every optional effect has a reason to exist and that the measured frame budget remains healthy on a representative mobile device.

The central engineering principle is restraint: a particle system should add atmosphere, feedback, or explanatory value without becoming the main event by accident. A small number of well-behaved particles with a robust lifecycle is more production-ready than a spectacular effect that drains battery, blocks scrolling, ignores reduced motion, or leaves a hidden loop running after navigation.
