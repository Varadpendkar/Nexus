---
name: cursor-trail-effects
layer: layer-08-micro-interactions
filename: cursor_trail_effects.md
description: Build expressive pointer trails with bounded rendering, lifecycle-safe animation, and accessible fallbacks.
---

# Cursor Trail Effects

## Why This Matters

A cursor trail turns pointer movement into a visual gesture. A portfolio can leave a short chain of fading dots, a music page can draw a soft ribbon, and an interactive art piece can scatter particles behind the pointer. The same effect can also overwhelm the interface: hundreds of DOM nodes, unbounded particle arrays, continuous animation loops, and high-contrast trails can compete with content and drain battery.

A production-quality trail is not simply a loop that creates circles. It is a bounded visual system with a clear lifetime, a predictable update cost, and a fallback for devices and users who do not benefit from motion. The pointer remains the real input; the trail is decorative and must never intercept clicks, selection, dragging, or keyboard interaction.

This skill focuses on:
- Sampling pointer movement without doing unnecessary work for every event.
- Keeping particle count and lifetime bounded.
- Rendering with DOM transforms or Canvas according to the effect's complexity.
- Stopping animation when particles have expired or the page is hidden.
- Respecting reduced-motion preferences and coarse-pointer devices.
- Avoiding leaks during navigation, component teardown, and repeated mounting.
- Debugging trails that stutter, leave artifacts, or accumulate resources.

## Core Concepts

### 1. A Trail Is a Time-Bounded Data Set

Each particle needs enough information to describe its current visual state and its remaining life. A minimal particle might store position, age, lifetime, and size. A richer effect may also store velocity, opacity, rotation, or hue.

```js
const particle = {
  x: 120,
  y: 240,
  age: 0,
  lifetime: 420,
  size: 8,
};
```

**Why:** Explicit lifetime data makes the effect predictable. When a particle expires, remove or recycle it. Without a lifetime, the trail can grow indefinitely or leave old marks behind.

Prefer a small, fixed set of fields over loosely structured objects that accumulate unused properties. The data model should match the effect, not every effect you might build later.

### 2. Bound the Number of Particles

A trail should have a maximum particle count. If the pointer moves quickly, new particles can be emitted faster than old ones expire. A hard cap prevents memory use and drawing cost from growing without limit.

```js
const MAX_PARTICLES = 80;

function addParticle(particles, particle) {
  particles.push(particle);

  if (particles.length > MAX_PARTICLES) {
    particles.splice(0, particles.length - MAX_PARTICLES);
  }
}
```

**Why:** A visual effect that is cheap for a slow pointer may become expensive during fast movement, on a high-refresh-rate display, or with multiple simultaneous pointers.

For higher-volume effects, use a reusable object pool or ring buffer to avoid frequent allocation. Start with the simplest bounded approach and optimize only when profiling shows a problem.

### 3. Emit by Distance, Not Just by Event Count

Pointer events do not arrive at perfectly regular intervals. Emitting one particle for every event can produce dense clusters in one area and gaps in another. Use a minimum distance between emitted particles.

```js
function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

if (distance(lastSpawn, pointer) >= spawnDistance) {
  emit(pointer.x, pointer.y);
  lastSpawn = { x: pointer.x, y: pointer.y };
}
```

**Why:** Distance-based emission makes trail density depend on spatial movement instead of event timing. It is more consistent when frame rate or event frequency changes.

If the pointer jumps a large distance between events, consider interpolating several spawn points along the segment. Cap the number of interpolated points so a single event cannot create an excessive burst.

### 4. Use Time-Based Motion

Do not assume every frame lasts exactly 16.67 milliseconds. Displays can run at 60, 90, 120, or more hertz, and a tab can pause or skip frames. Compute age and movement from elapsed time.

```js
function updateParticle(particle, deltaMs) {
  particle.age += deltaMs;
  particle.x += particle.vx * deltaMs;
  particle.y += particle.vy * deltaMs;
}
```

**Why:** Time-based updates behave more consistently across refresh rates. If movement is measured in pixels per second, convert the elapsed time from milliseconds to seconds before applying velocity.

Clamp large delta values after tab suspension. Otherwise, a single resumed frame can move particles far outside the intended region or create invalid visual states.

### 5. Render Only While Work Exists

A particle animation does not need to run forever. Schedule the next animation frame only while there are particles to update or another visual change is pending.

```js
let frameId = 0;

function scheduleFrame() {
  if (!frameId) {
    frameId = requestAnimationFrame(render);
  }
}
```

**Why:** A permanent render loop wastes CPU and battery while the pointer is still. A dormant effect should have no pending animation frame.

Remember to set `frameId` back to zero at the beginning of the callback. If it stays truthy, later pointer events may never schedule another frame.

### 6. Choose DOM or Canvas Intentionally

DOM particles are easy to style individually and are appropriate for a small trail with a handful of elements. Canvas is better when the effect needs many particles, blending, or per-pixel drawing.

- **DOM:** easier to inspect, animate with CSS, and make individual shapes.
- **Canvas 2D:** efficient for dense particle fields and custom drawing, but requires manual drawing and resizing.
- **WebGL:** useful for very large or shader-driven effects, but excessive for a few fading dots.

**Why:** The rendering model determines complexity. A simple DOM trail is often more maintainable than a custom renderer; a large particle system can become expensive if each particle is a separate DOM node.

Do not choose Canvas merely because it sounds faster. Measure the actual effect on representative devices.

### 7. Make the Trail Non-Interactive

Decorative trail elements must not become hit-test targets.

```css
.cursor-trail,
.cursor-trail * {
  pointer-events: none;
}
```

**Why:** Particles can overlap links, form fields, and drag targets. If they intercept input, the user may click the wrong element or be unable to select text.

Use `aria-hidden="true"` for a purely decorative container. Do not put interactive controls inside it.

### 8. Gate the Effect by Input Capability

A cursor trail generally belongs on hover-capable fine pointers. Touch users do not continuously move a visible cursor, and showing a trail after taps can be distracting.

```css
@media (hover: none), (pointer: coarse) {
  .cursor-trail {
    display: none;
  }
}
```

In JavaScript, also ignore touch pointer events:

```js
function onPointerMove(event) {
  if (event.pointerType === "touch") return;
  // Store the latest pointer position.
}
```

**Why:** Capability queries work better than guessing from operating-system names. Hybrid devices may have a trackpad and touchscreen; test the experience on both.

### 9. Reduced Motion Should Change the Effect, Not Break the Page

A trail is decorative, so a reduced-motion preference can disable it entirely or replace it with a single immediate indicator. Do not make important instructions or interaction states available only through moving particles.

```js
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
```

**Why:** Trails produce repeated movement across the visual field. Removing the trail is a reasonable response because the core interface does not depend on it.

If the preference can change while the page is open, listen for the media query's `change` event and stop any active animation immediately.

### 10. Handle Page Visibility and Lifecycle

When a tab becomes hidden, pause drawing and reset the previous timestamp. On teardown, remove event listeners, cancel pending animation frames, and clear any retained particles.

```js
document.addEventListener("visibilitychange", () => {
  if (document.hidden && frameId) {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
});
```

**Why:** Background tabs do not need a decorative effect. Pausing also avoids a huge elapsed-time jump when the page becomes visible again.

Treat setup and teardown as a pair. Repeatedly mounting the same effect without cleanup can cause duplicate trails and duplicated event listeners.

### 11. Use Alpha and Lifetime Deliberately

A common particle fade is based on the fraction of its lifetime that remains.

```js
const progress = particle.age / particle.lifetime;
const opacity = Math.max(0, 1 - progress);
```

**Why:** Opacity should reach zero when the particle expires, and the particle should then be removed. Keep the calculation clamped because floating-point values and large time steps can exceed expected bounds.

A non-linear easing curve can make the trail fade more naturally, but keep it simple. Multiple easing calculations, color changes, rotation, blur, and scaling all add cost.

### 12. Keep Coordinates Consistent

For a fixed overlay, use `event.clientX` and `event.clientY`. For a Canvas that covers the viewport, translate viewport coordinates into canvas-local coordinates using its bounding rectangle.

```js
const rect = canvas.getBoundingClientRect();
const x = event.clientX - rect.left;
const y = event.clientY - rect.top;
```

**Why:** Canvas coordinates are local to its drawing surface. Using viewport coordinates directly can offset the trail if the canvas does not begin at `(0, 0)`.

If the canvas is scaled for high-DPI rendering, convert CSS pixels to backing-store pixels using the device-pixel ratio. Keep pointer events and drawing coordinates in the same logical coordinate system.

## Patterns

### Pattern 1: Small DOM Trail with Recycled Elements

**Use when:** A portfolio needs a short sequence of dots, with no more than a few dozen particles visible at once.

Instead of creating a new element for every pointer event, pre-create a pool of elements and reuse them. This keeps the DOM size stable and avoids repeated node creation.

```html
<div class="cursor-trail" aria-hidden="true"></div>
```

```css
.cursor-trail {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 900;
}

.cursor-trail__dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  transform: translate3d(-50%, -50%, 0) scale(1);
  will-change: transform, opacity;
}
```

```js
function mountDomTrail({
  root = document.querySelector(".cursor-trail"),
  count = 24,
  lifetime = 420,
  spawnDistance = 12,
} = {}) {
  if (!root) return () => {};

  const pool = Array.from({ length: count }, () => {
    const node = document.createElement("span");
    node.className = "cursor-trail__dot";
    root.appendChild(node);
    return {
      node,
      active: false,
      x: 0,
      y: 0,
      age: 0,
    };
  });

  let nextIndex = 0;
  let lastSpawn = null;
  let pointer = null;
  let previousTime = 0;
  let frameId = 0;
  let destroyed = false;

  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  );
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function emit(x, y) {
    const item = pool[nextIndex];
    nextIndex = (nextIndex + 1) % pool.length;

    item.active = true;
    item.x = x;
    item.y = y;
    item.age = 0;
    item.node.style.opacity = "1";
    item.node.style.transform =
      `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(1)`;
  }

  function onMove(event) {
    if (!finePointer.matches || reducedMotion.matches) return;
    if (event.pointerType === "touch") return;

    pointer = { x: event.clientX, y: event.clientY };

    if (!lastSpawn) {
      emit(pointer.x, pointer.y);
      lastSpawn = pointer;
    } else if (
      Math.hypot(pointer.x - lastSpawn.x, pointer.y - lastSpawn.y)
      >= spawnDistance
    ) {
      emit(pointer.x, pointer.y);
      lastSpawn = pointer;
    }

    if (!frameId) {
      previousTime = performance.now();
      frameId = requestAnimationFrame(render);
    }
  }

  function render(now) {
    frameId = 0;
    if (destroyed || document.hidden || reducedMotion.matches) return;

    const delta = Math.min(now - previousTime, 50);
    previousTime = now;
    let hasActive = false;

    for (const item of pool) {
      if (!item.active) continue;

      item.age += delta;
      const progress = Math.min(1, item.age / lifetime);
      const opacity = 1 - progress;
      const scale = 1 - progress * 0.65;

      item.node.style.opacity = String(opacity);
      item.node.style.transform =
        `translate3d(${item.x}px, ${item.y}px, 0) ` +
        `translate(-50%, -50%) scale(${scale})`;

      if (item.age >= lifetime) {
        item.active = false;
        item.node.style.opacity = "0";
      } else {
        hasActive = true;
      }
    }

    if (hasActive) frameId = requestAnimationFrame(render);
  }

  function onVisibilityChange() {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      previousTime = 0;
    } else if (!document.hidden && pool.some((item) => item.active)) {
      previousTime = performance.now();
      if (!frameId) frameId = requestAnimationFrame(render);
    }
  }

  function onMotionChange() {
    if (reducedMotion.matches) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      for (const item of pool) {
        item.active = false;
        item.node.style.opacity = "0";
      }
    }
  }

  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotion.addEventListener?.("change", onMotionChange);

  if (!finePointer.matches || reducedMotion.matches) {
    root.hidden = true;
  }

  return () => {
    destroyed = true;
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.removeEventListener?.("change", onMotionChange);
    if (frameId) cancelAnimationFrame(frameId);
    for (const item of pool) item.node.remove();
  };
}

const unmountTrail = mountDomTrail();
```

**Implementation notes:**
- The pool size is fixed, so the maximum number of elements is known.
- `nextIndex` cycles through the pool. If the pointer moves rapidly, the oldest visible particle is reused rather than allowing the trail to grow without limit.
- The render loop only schedules another frame while at least one particle remains active.
- If the media query can change from coarse to fine while the page remains open, extend the implementation to update `root.hidden` on the query's `change` event.
- This is a decorative layer. Keep native cursor behavior and all real controls intact.

### Pattern 2: Interpolated Trail for Fast Pointer Movement

**Use when:** A trail needs even spacing during quick diagonal or straight-line movement.

A single pointer event may cover a long distance. Emitting only at the endpoint leaves a gap. Interpolate a bounded number of points along the segment between the last emitted location and the current pointer location.

```js
function emitAlongSegment(from, to, spacing, emit, maxPerEvent = 8) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length < spacing) return 0;

  const steps = Math.min(
    Math.floor(length / spacing),
    maxPerEvent
  );

  if (steps === 0) return 0;

  for (let i = 1; i <= steps; i += 1) {
    const ratio = (i * spacing) / length;
    emit(
      from.x + dx * ratio,
      from.y + dy * ratio
    );
  }

  return steps;
}
```

**Why:** Interpolation makes density spatially consistent, but a maximum per event is essential. Without a cap, one large coordinate jump can create thousands of particles.

For very long jumps, decide whether to emit a few points near the destination or evenly sample the entire segment. Either is valid; make the behavior intentional and test it.

### Pattern 3: Canvas Trail with Bounded Particle State

**Use when:** You want dozens or hundreds of dots, soft fades, or blended shapes without a large DOM subtree.

Canvas trades individual DOM nodes for a single drawing surface. Keep the particle array bounded and clear the canvas every frame before drawing the current state.

```html
<canvas class="trail-canvas" aria-hidden="true"></canvas>
```

```css
.trail-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 900;
}
```

```js
function mountCanvasTrail(canvas, { maxParticles = 100 } = {}) {
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let lastSpawn = null;
  let frameId = 0;
  let previousTime = 0;
  let destroyed = false;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function emit(x, y) {
    particles.push({
      x,
      y,
      age: 0,
      lifetime: 500,
      size: 5 + Math.random() * 4,
    });

    if (particles.length > maxParticles) {
      particles.splice(0, particles.length - maxParticles);
    }
  }

  function onMove(event) {
    if (event.pointerType === "touch" || reduceMotion.matches) return;

    const point = { x: event.clientX, y: event.clientY };
    if (
      !lastSpawn ||
      Math.hypot(point.x - lastSpawn.x, point.y - lastSpawn.y) >= 10
    ) {
      emit(point.x, point.y);
      lastSpawn = point;
    }

    if (!frameId) {
      previousTime = performance.now();
      frameId = requestAnimationFrame(render);
    }
  }

  function render(now) {
    frameId = 0;
    if (destroyed || document.hidden || reduceMotion.matches) return;

    const delta = Math.min(now - previousTime, 50);
    previousTime = now;
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.age += delta;
      const progress = Math.min(1, particle.age / particle.lifetime);
      const alpha = 1 - progress;
      const radius = particle.size * (1 - progress * 0.5);

      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    particles = particles.filter(
      (particle) => particle.age < particle.lifetime
    );

    if (particles.length) {
      frameId = requestAnimationFrame(render);
    }
  }

  function onVisibilityChange() {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      previousTime = 0;
    } else if (!document.hidden && particles.length && !frameId) {
      previousTime = performance.now();
      frameId = requestAnimationFrame(render);
    }
  }

  function onMotionChange() {
    if (reduceMotion.matches) {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      particles = [];
      context.clearRect(0, 0, width, height);
    }
  }

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  reduceMotion.addEventListener?.("change", onMotionChange);

  return () => {
    destroyed = true;
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    reduceMotion.removeEventListener?.("change", onMotionChange);
    if (frameId) cancelAnimationFrame(frameId);
    particles = [];
    context.clearRect(0, 0, width, height);
  };
}

const unmountCanvasTrail = mountCanvasTrail(
  document.querySelector(".trail-canvas")
);
```

**Notes:**
- This example assumes a viewport-sized Canvas and uses viewport-relative pointer coordinates.
- A device-pixel-ratio cap limits backing-store memory. Increase it only after testing sharpness and memory on target devices.
- The fill style is inherited from Canvas defaults in this minimal example; set `context.fillStyle` explicitly to match the design.
- If `canvas` may be `null`, guard before calling `mountCanvasTrail`.
- For dense effects, consider an object pool to avoid allocating and filtering arrays each frame.

### Pattern 4: Particle Motion with Velocity and Friction

**Use when:** Particles should drift, scatter, or float rather than remain exactly where they were emitted.

```js
function updateParticle(particle, deltaMs) {
  const dt = Math.min(deltaMs, 50) / 1000;

  particle.x += particle.vx * dt;
  particle.y += particle.vy * dt;

  // Exponential damping is more stable than subtracting a fixed amount per frame.
  const friction = Math.pow(0.88, dt * 60);
  particle.vx *= friction;
  particle.vy *= friction;

  particle.age += deltaMs;
}
```

```js
function createDriftingParticle(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const speed = 18 + Math.random() * 45;

  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    age: 0,
    lifetime: 650,
    size: 3 + Math.random() * 4,
  };
}
```

**Why:** Velocity creates motion beyond pointer tracking. Friction gradually reduces it, while lifetime prevents particles from drifting forever.

Use consistent units. In this example, velocity is measured in pixels per second, so `deltaMs` is converted to seconds before position changes.

### Pattern 5: React Canvas Trail with Cleanup

**Use when:** A React page needs a Canvas effect that is mounted once and disposed with the component.

```jsx
import { useEffect, useRef } from "react";

export function CursorTrailCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let frameId = 0;
    let previousTime = 0;
    let lastPoint = null;
    let particles = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let active = true;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function schedule() {
      if (!frameId && active) {
        previousTime = performance.now();
        frameId = requestAnimationFrame(render);
      }
    }

    function onMove(event) {
      if (event.pointerType === "touch" || reduceMotion.matches) return;
      const point = { x: event.clientX, y: event.clientY };

      if (
        !lastPoint ||
        Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= 12
      ) {
        particles.push({
          ...point,
          age: 0,
          lifetime: 400,
          radius: 4,
        });
        lastPoint = point;

        if (particles.length > 80) particles.shift();
        schedule();
      }
    }

    function render(now) {
      frameId = 0;
      if (!active || document.hidden || reduceMotion.matches) return;

      const delta = Math.min(now - previousTime, 50);
      previousTime = now;
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.age += delta;
        const progress = Math.min(1, particle.age / particle.lifetime);
        context.globalAlpha = 1 - progress;
        context.beginPath();
        context.arc(
          particle.x,
          particle.y,
          particle.radius * (1 - progress * 0.4),
          0,
          Math.PI * 2
        );
        context.fill();
      }

      context.globalAlpha = 1;
      particles = particles.filter((particle) => particle.age < particle.lifetime);

      if (particles.length) frameId = requestAnimationFrame(render);
    }

    function onVisibilityChange() {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else if (!document.hidden && particles.length) {
        schedule();
      }
    }

    function onMotionChange() {
      if (reduceMotion.matches) {
        if (frameId) cancelAnimationFrame(frameId);
        frameId = 0;
        particles = [];
        context.clearRect(0, 0, width, height);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    reduceMotion.addEventListener?.("change", onMotionChange);

    return () => {
      active = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reduceMotion.removeEventListener?.("change", onMotionChange);
      if (frameId) cancelAnimationFrame(frameId);
      particles = [];
      context.clearRect(0, 0, width, height);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="trail-canvas"
    />
  );
}
```

```css
.trail-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 900;
}
```

**React considerations:**
- Use refs for the Canvas and local variables inside the effect for high-frequency particle state.
- Do not call React state setters for every pointer movement or particle update.
- The cleanup returned by `useEffect` must cancel the frame and remove all listeners.
- React Strict Mode can mount, clean up, and mount effects again in development. Correct cleanup prevents duplicated listeners and trails.
- If your application supports runtime changes to pointer capability, update the effect's enabled state when the media query changes.

### Pattern 6: Pause and Resume Around Visibility Changes

**Use when:** A more complex trail needs a clear pause policy independent of its rendering implementation.

```js
function createVisibilityController(onPause, onResume) {
  let wasHidden = document.hidden;

  function onChange() {
    const isHidden = document.hidden;
    if (isHidden === wasHidden) return;

    wasHidden = isHidden;

    if (isHidden) {
      onPause();
    } else {
      onResume();
    }
  }

  document.addEventListener("visibilitychange", onChange);

  return () => {
    document.removeEventListener("visibilitychange", onChange);
  };
}
```

Use the controller to cancel frames, reset timestamps, and resume only if there is still visual work. Do not blindly resume a perpetual animation loop; the effect should resume because particles remain alive or new input arrives.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Creating an element for every pointer event | DOM size grows rapidly and garbage collection becomes noisy | Reuse a bounded pool or draw on Canvas |
| Allowing an unbounded particle array | Memory and drawing cost increase under fast movement | Set a maximum count and a clear expiration rule |
| Emitting only on event count | Spacing varies with event frequency | Emit by distance and optionally interpolate segments |
| Using frame count as particle age | Trails fade at different speeds on different refresh rates | Measure elapsed time |
| Running `requestAnimationFrame` forever | Wastes CPU when the trail is idle | Stop when no particles remain |
| Forgetting to reset `frameId` | New work may never schedule a new frame | Reset the ID at the start of each callback |
| Not clearing the Canvas | Old pixels remain as unwanted smears | Clear the drawing surface each frame unless persistence is intentional |
| Mixing viewport and Canvas-local coordinates | Trail appears offset | Convert using `getBoundingClientRect()` |
| Ignoring high-DPI displays | Canvas looks blurry or coordinate math breaks | Scale backing-store dimensions by a capped device-pixel ratio |
| Leaving particles interactive | Links and text selection become unreliable | Set `pointer-events: none` |
| Showing trails on touch devices | Creates a confusing interaction model | Gate by pointer capability and ignore touch events |
| Ignoring reduced motion | Repeated movement can be uncomfortable | Disable or simplify the trail when requested |
| Continuing while a tab is hidden | Wastes resources and causes large time deltas | Pause, reset timestamps, and resume intentionally |
| Forgetting listener cleanup | Navigation or remounts duplicate the effect | Return one cleanup function from setup |
| Allocating many objects in a hot loop | Creates avoidable garbage-collection pressure | Use bounded pools if profiling justifies it |
| Using `Math.random()` without bounds | Particle count and visual density become unpredictable | Bound both emission frequency and particle properties |
| Overusing blur and shadows | Large blurred areas can be expensive to repaint | Keep effects small and profile on target hardware |
| Treating decorative particles as content | Screen readers may encounter meaningless noise | Mark the effect `aria-hidden="true"` |
| Omitting a no-JavaScript fallback | Visual code becomes a dependency for the page | Ensure the underlying content and controls are complete without it |
| Forgetting resize behavior | Canvas dimensions no longer match the viewport | Update backing store and transform on resize |
| Updating React state for every particle | Causes unnecessary rendering work | Keep particle simulation outside React state |
| Leaving `will-change` on many nodes | Can increase compositing memory | Apply sparingly and measure |
| Ignoring pointer exit | A trail may continue to be emitted when the pointer is no longer present | Track pointer activity and stop new emissions after exit |
| Reusing a particle before resetting every field | Old age, opacity, or velocity leaks into the new particle | Reset all fields on reuse |
| Using a fixed delta with no elapsed-time check | Movement varies across refresh rates | Use the animation timestamp and clamp unusually large deltas |

## Mental Models

1. **A trail is a bounded queue of visual events.** Every particle enters, ages, and exits. The system should have a known upper limit.
2. **Input frequency is not display frequency.** Pointer events describe intent; animation frames describe when to paint.
3. **Distance controls density; time controls lifetime.** These are separate design variables and should be tuned independently.
4. **An idle trail should be idle in code.** No particles means no animation loop.
5. **The renderer is a trade-off, not a badge of sophistication.** DOM is readable for small trails; Canvas is practical for denser drawing; WebGL is for genuinely GPU-oriented needs.
6. **Decorative motion must not own interaction.** The page's real controls remain underneath and accessible.
7. **Cleanup is part of the feature.** A trail is not complete until it can stop, unmount, and start again without duplicate work.

## Quick Reference

### Useful constants

```js
const MAX_PARTICLES = 80;
const SPAWN_DISTANCE = 12; // CSS pixels
const DEFAULT_LIFETIME_MS = 450;
const MAX_FRAME_DELTA_MS = 50;
const MAX_DEVICE_PIXEL_RATIO = 2;
```

Tune these based on the art direction and target devices. Do not use the values as universal performance guarantees.

### Rendering choices

| Requirement | Recommended starting point |
|---|---|
| A few branded dots | DOM elements with a fixed pool |
| A soft ribbon or dense particle field | Canvas 2D |
| Hundreds or thousands of shader-driven particles | Consider WebGL after profiling |
| Reduced-motion preference | Disable trail or show one immediate indicator |
| Touch-first interface | No cursor trail |
| High-frequency motion | Coalesce work with `requestAnimationFrame` |
| Long-lived page or SPA | Explicit mount and cleanup functions |

### Debugging sequence

1. Confirm the trail root or Canvas exists and is not hidden unexpectedly.
2. Check `pointer-events: none` and the overlay stacking level.
3. Log pointer type and coordinates; verify the effect ignores touch.
4. Verify particle count never exceeds the configured maximum.
5. Inspect particle age and lifetime values for particles that never expire.
6. Confirm `frameId` is reset and only one frame is pending at a time.
7. Check the Canvas size, device-pixel ratio, and coordinate conversion.
8. Test at 60 Hz and a high-refresh display if available.
9. Switch tabs and return; confirm the effect resumes without a jump.
10. Toggle reduced motion and confirm active particles are cleared or simplified.
11. Navigate away and remount; check that listeners and nodes do not duplicate.
12. Profile on a lower-powered device before adding blur, glow, or more particles.

### Production checklist

- [ ] Particle count is explicitly bounded.
- [ ] Particle lifetime and opacity are time-based.
- [ ] Emission spacing is distance-based or intentionally event-based.
- [ ] Large pointer jumps cannot trigger an unbounded burst.
- [ ] The animation loop stops when no particles remain.
- [ ] Pending frames are cancelled on teardown and when hidden.
- [ ] The trail is decorative and uses `pointer-events: none`.
- [ ] The decorative layer is hidden from assistive technology.
- [ ] Touch and coarse-pointer experiences remain complete.
- [ ] Reduced-motion preference disables or simplifies the effect.
- [ ] Canvas backing-store dimensions account for device pixel ratio.
- [ ] Coordinates use a consistent viewport or local coordinate system.
- [ ] Event listeners and media-query listeners are removed on teardown.
- [ ] Repeated mounts do not create duplicate nodes or loops.
- [ ] Visual density and contrast are tested across the page.
- [ ] Performance is profiled on realistic hardware.

## Build Challenge

Create a cursor trail for a creative portfolio that contains a hero section, a project grid, and a full-screen image gallery.

### Requirements

1. Build a trail of fading dots with a fixed maximum of 40 active particles.
2. Emit particles based on pointer distance rather than every event.
3. Interpolate across large pointer jumps, with a hard cap on particles emitted per event.
4. Make particles shrink and fade using elapsed time.
5. Stop the animation loop once every particle has expired.
6. Add an optional Canvas implementation for a denser gallery mode.
7. Keep all trail visuals non-interactive and hidden from assistive technology.
8. Disable the trail for coarse pointers and touch input.
9. Disable or simplify the trail under `prefers-reduced-motion`.
10. Pause while the tab is hidden and resume without a time-step jump.
11. Provide a teardown function that removes listeners and cancels animation frames.
12. Test scrolling, viewport resizing, modal overlays, and repeated route navigation.

### Acceptance criteria

- Particle count never exceeds the defined cap.
- The trail maintains reasonable spacing during fast diagonal pointer movement.
- The animation uses elapsed time rather than frame count.
- No animation frame remains scheduled while the trail is idle.
- The cursor trail does not block clicks, selection, drag operations, or keyboard interaction.
- Reduced-motion and touch modes preserve the usability of the page.
- Hidden tabs do not continue unnecessary drawing work.
- The effect can be mounted, unmounted, and mounted again without duplicates.
- The Canvas version stays aligned with the viewport on high-DPI displays.
- Performance remains stable during quick pointer movement on a representative lower-powered device.

### Review questions

1. Why should a trail have a maximum particle count?
2. What does distance-based emission improve compared with one particle per event?
3. Why should particle lifetime use elapsed time?
4. When is a DOM pool preferable to Canvas?
5. Why should an animation loop stop when the particle collection is empty?
6. How do you prevent one large pointer jump from creating too many particles?
7. Why does a viewport-sized Canvas need device-pixel-ratio handling?
8. What should happen when the browser tab becomes hidden?
9. How should reduced-motion preferences affect a decorative trail?
10. Which cleanup tasks are required when the component unmounts?
