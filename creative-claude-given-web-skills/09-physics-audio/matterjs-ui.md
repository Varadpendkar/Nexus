---
name: matterjs-ui
layer: layer-09-physics-audio
description: Build reliable, accessible, performant 2D physics interactions for interfaces using Matter.js, with deterministic lifecycle management, pointer interaction, collision-driven feedback, and graceful non-physics fallbacks.
---

# matterjs-ui

## Goal

Build production-quality 2D interface interactions with Matter.js without allowing the simulation to compromise usability, accessibility, responsiveness, or application lifecycle. This skill covers the full path from defining a physics scene to integrating it with semantic interface controls, coordinating the simulation with browser rendering, tuning the solver, and cleaning up every resource.

The target is not simply to make objects fall or bounce. The target is to make physical behavior communicate hierarchy, affordance, state, or delight while preserving a usable interface when motion is reduced, the canvas is unavailable, the browser is under load, or a visitor cannot use a pointer.

## Why This Matters

Physics can make a digital interface feel tangible. Cards that settle into a pile, tags that gently repel one another, playful objects that respond to dragging, or particles that react to a completed task can create memorable feedback. Yet physics introduces a second system of state into an interface: the application has its own data and layout state, while the engine has bodies, constraints, velocities, collisions, and time steps. If these systems are not deliberately connected, they drift apart.

A robust implementation makes a clear distinction between **application truth** and **simulation presentation**. The application decides what a card means, whether a task is complete, whether a control is enabled, and what should be announced to assistive technology. Matter.js decides how a body moves within a bounded visual scene. The physics layer may suggest visual feedback, but it must not become the only place where essential state exists.

This distinction matters for several reasons:

- **Reliability:** a scene must be created once, updated predictably, and fully destroyed when its component unmounts or its route changes.
- **Performance:** a physics engine can consume CPU even when the visible effect is small. Simulation work should be bounded and paused when it cannot add value.
- **Accessibility:** a canvas is not a complete replacement for HTML controls. Keyboard access, reduced-motion behavior, visible focus, and status announcements must remain available.
- **Responsive design:** world coordinates and viewport pixels are not interchangeable. Resizing requires an explicit policy for boundaries, body placement, and scale.
- **Maintainability:** physics tuning is easier when body creation, collision handling, rendering, input, and cleanup are separate responsibilities.
- **Trust:** a decorative effect should never make a button appear to have moved away from its actual hit target or make a user lose access to a control.

Use Matter.js when 2D rigid-body behavior is a genuine part of the interaction. Do not use it merely because an animation needs easing, a card needs to slide into place, or a small hover effect needs a bounce. CSS transitions, the Web Animations API, or a small requestAnimationFrame loop are often more appropriate for deterministic interface motion.

## When to Use This Skill

Use this skill for:

- draggable chips, tokens, cards, or stickers in a contained 2D play area;
- gravity-based piles, stacks, or settling layouts;
- collision-reactive decorative objects;
- spring-like arrangements built with constraints;
- physics-backed onboarding or product storytelling;
- playful empty states and completion moments;
- small simulations where users can manipulate visible objects;
- prototyping a physical interaction that may later become a production component.

Avoid or reconsider Matter.js when the page contains hundreds or thousands of active bodies, when the interaction must be pixel-perfect at every frame, when the layout is primarily text, when the scene must be fully three-dimensional, or when the physics effect has no clear purpose beyond visual noise.

## Core Concepts

### 1. Engine, World, and Bodies

`Engine` owns the simulation update process and solver settings. `World` is the collection that contains bodies and constraints. A `Body` represents a simulated object with position, angle, velocity, mass-related properties, collision filters, and material-like behavior such as restitution and friction. A body is not automatically a DOM element. The application must decide how a body maps to something visible.

Treat the world as a small, explicit coordinate space. Keep the world model independent from React state, Vue state, or another UI framework's render cycle. Frequent physics updates should not trigger a full application component render for every body on every frame.

### 2. Runner and Time

A runner advances the engine repeatedly. For simple examples, Matter's `Runner` can own that loop. In a custom-rendered canvas, a `requestAnimationFrame` loop may render the latest state while a runner or fixed-step update advances physics. Do not accidentally run both an independent runner and a second engine-update loop unless that double stepping is intentional.

Physics should be based on elapsed simulation time rather than the assumption that every display frame arrives at exactly the same interval. Background tabs, low-power devices, and busy main threads can produce irregular frame intervals. Define how the simulation responds after a long pause: clamp large elapsed deltas, pause while hidden, or reset the timing baseline when the page becomes visible again.

### 3. Bodies Are Not Layout Elements

A body has a physical center and shape. A DOM box has CSS dimensions, margins, transforms, and a layout position. Those coordinate systems must be mapped deliberately. If a rendered card is 160 by 90 CSS pixels, its Matter body should generally use corresponding dimensions in the scene's coordinate system. If the scene is scaled, both pointer conversion and drawing must use the same transform.

Do not let normal document flow and a physics engine independently position the same element. Choose one owner for each visual coordinate. If Matter owns the card's movement, the DOM representation should be positioned from the body's current transform. If CSS layout owns the card, Matter may be better used only to drive secondary decorative objects.

### 4. Static Boundaries

Walls and floors are typically static bodies. A body with `isStatic: true` does not respond to forces in the same way as a dynamic body, making it appropriate for containment. For a responsive scene, boundary geometry must be updated when the viewport or container changes. A common mistake is to resize the canvas while leaving the old invisible walls at their previous dimensions.

Use walls with enough thickness to avoid bodies tunneling through them during large time steps. Keep boundaries slightly outside the visible canvas when the visual design requires the objects to stop precisely at the edge. Avoid creating many overlapping boundary bodies without a reason; unnecessary contacts add solver work.

### 5. Collision Detection and Filtering

Collision events can support sound, particle bursts, score updates, or visual emphasis. Collision callbacks are also a common source of accidental duplicate work. A single physical contact may produce repeated collision-active notifications across frames. If an effect should happen once per impact, compare collision state or use a carefully designed impact threshold rather than firing a large effect every time a pair remains in contact.

Collision filters let the scene express which categories can interact. Use categories and masks to prevent decorative particles from colliding with interface objects or to allow a draggable object to pass through a sensor. Prefer explicit collision rules over scattered conditional checks in many event handlers.

### 6. Constraints

Constraints connect bodies or anchor bodies to points and can approximate springs, ropes, or joints. They are useful for elastic arrangements, linked objects, and constrained dragging. Constraint stiffness and damping affect the apparent behavior, but a high stiffness value does not guarantee perfect rigidity under every solver configuration. Test at the actual body sizes and speeds used by the interface.

Use constraints sparingly. A dense network of constraints can become expensive and difficult to tune. If the desired behavior is a simple one-time transition, a CSS animation is usually easier to reason about than a physical constraint.

### 7. Density, Mass, Friction, and Restitution

Density contributes to mass for a body with a given area. Friction controls resistance at contacts, and restitution controls bounciness. These values interact with shape, speed, solver iterations, and collision geometry. There is no universally correct “realistic” setting for a user interface. The useful target is readable, stable behavior.

Start with conservative values. A highly elastic body can appear chaotic when it collides with several objects in a small area. Excessive friction can make draggable objects feel sticky. Very low friction can produce endless sliding. Tune one variable at a time and observe a repeatable test scene.

### 8. Pointer Interaction

A pointer constraint allows a user to drag a body. Pointer coordinates must be converted into world coordinates, particularly if the canvas is offset, scaled, or rendered at a high device-pixel ratio. Bind input to the canvas or interaction surface rather than globally intercepting every pointer event on the page.

A robust drag interaction must consider pointer capture, pointer cancellation, touch scrolling, focus behavior, and the case where a user begins dragging one object and releases outside the canvas. Avoid disabling browser gestures for the whole page just to make one local canvas draggable. Set `touch-action` only on the specific surface where the gesture semantics justify it.

### 9. Rendering Separation

Matter.js does not require you to use its renderer. A custom canvas renderer gives control over drawing, pixel ratio, styling, and effects. A DOM renderer can be appropriate for a small number of semantic objects, but it must avoid causing excessive layout and paint work. In either case, keep simulation updates separate from application state updates.

A useful architecture has distinct modules or functions for: creating the engine, creating bodies, building boundaries, rendering, handling input, handling collisions, responding to resize, and disposing resources. Separation makes it possible to test or replace the rendering layer without rewriting the physics rules.

### 10. Coordinate Systems and Device Pixel Ratio

CSS pixels describe layout dimensions. Canvas backing-store pixels describe the bitmap resolution. If a canvas is 800 CSS pixels wide and its device pixel ratio is 2, a crisp backing store may be 1600 pixels wide. That does not mean the physics world must also be doubled. Keep world coordinates in CSS-pixel-like units unless the design specifically requires another scale, then scale the drawing context.

When the canvas is scaled, apply the inverse transformation to pointer positions. A frequent bug is rendering a body at one scale while hit testing uses another. Validate pointer interaction near all four corners, not just the center.

### 11. Collision Events Are Side Effects

A collision callback is not a place to directly mutate unrelated UI state repeatedly. It should identify the event, apply thresholds, and enqueue a small side effect. For example, the callback may set a body pair's impact intensity and the render loop may consume it to draw a flash. If the event updates React state, debounce or aggregate it and make sure the event cannot produce a render storm.

For game-like interfaces, distinguish collision start, collision active, and collision end. Use the event that matches the intended effect. A “thud” sound should usually correspond to a new impact, not every frame during contact.

### 12. Determinism and Testability

Physics simulations can vary with frame timing, engine version, solver settings, and the order of operations. Avoid writing tests that assert an exact body coordinate after an arbitrary number of real-time frames. Prefer invariants and tolerances: a body remains inside the bounds, a drag updates its position, a static wall stays fixed, or a reset restores a known initial state.

For repeatable visual checks, use a fixed scene, known initial velocities, a controlled timestep, and bounded random seeds. If random placement is part of the design, make randomness injectable so tests can choose a deterministic sequence.

### 13. Lifecycle and Resource Ownership

Every event listener, runner, animation frame, observer, and engine event subscription needs a clear owner and cleanup path. In a component framework, effects may run more than once during development, and routes may mount and unmount quickly. The cleanup must be idempotent: calling it twice should not throw or leave stale state behind.

Keep the engine instance in a ref or component-owned object rather than recreating it during every render. A cleanup function should stop the runner, cancel the frame loop if one exists, remove event listeners, clear Matter events, detach input helpers, and clear references to bodies and canvas resources.

### 14. Accessibility Is Part of the Interaction Model

A canvas does not provide semantic controls by itself. If users need to select, move, remove, or reset objects, provide a semantic HTML route to the same actions. Keyboard users should not be required to simulate a pointer gesture. Offer buttons such as “Move selected object left,” “Drop object,” “Reset scene,” or an accessible list of objects with ordinary actions.

Respect `prefers-reduced-motion`. Reduced motion may mean disabling free-running gravity, reducing bounce, using a static composition, or replacing the scene with a simple state transition. It should not mean hiding information or removing the only route to a task. Communicate meaningful outcomes with text or status announcements rather than relying only on collision sounds or motion.

## Mental Models

1. **The engine is a model, not the interface.** Matter.js describes simulated state. HTML and application state remain responsible for meaning, labels, permissions, and accessible actions.
2. **One coordinate, one owner.** A visual object's position should have one authoritative owner. Do not let CSS layout and physics independently fight over the same transform.
3. **Time is an input.** The simulation's behavior depends on how updates are scheduled. Backgrounding, dropped frames, and tab visibility must be considered part of the system.
4. **Events are edges, not continuous truth.** A collision-start event describes a transition. A collision-active event describes continued contact. Choose carefully to avoid repeated effects.
5. **Every effect has a budget.** Bodies, contacts, particles, sound, DOM updates, and drawing all consume resources. Define a maximum scene size and a degradation strategy.
6. **Accessibility is a parallel control plane.** The canvas can be the expressive surface, but semantic controls and status text are a second route to the same underlying actions.
7. **Cleanup is the inverse of setup.** For every resource created, list the exact operation that releases it. If setup has no corresponding teardown, the component is not complete.
8. **Realism is not the objective.** A useful interface interaction is stable, legible, and forgiving. Physical plausibility is subordinate to clarity and user control.

## Recommended Architecture

Use a small controller object or module to own the simulation. Keep framework state for durable application facts and use refs or plain objects for high-frequency physics values. The controller should expose a narrow API such as `start`, `pause`, `resize`, `reset`, `addBody`, `removeBody`, and `destroy`. Avoid leaking the engine internals to unrelated UI components.

Suggested responsibilities:

- **Scene factory:** creates engine, world, initial bodies, boundaries, and constraints.
- **Renderer:** draws the current body state and handles device-pixel-ratio scaling.
- **Input adapter:** converts pointer events to world coordinates and manages drag constraints.
- **Collision adapter:** translates physics events into small, deduplicated UI effects.
- **Accessibility layer:** provides semantic controls, labels, status announcements, and reduced-motion behavior.
- **Lifecycle owner:** installs listeners and observers, starts work when appropriate, and tears everything down.

For a very small effect, these responsibilities may be functions in one file rather than separate classes. The separation is conceptual: each concern should have a clear entry point and cleanup path.

## Implementation Pattern: Minimal Custom Canvas Scene

The following example shows the shape of a small, self-contained Matter.js scene. It uses a custom renderer so the simulation and visual treatment remain separate. Adapt imports to the bundler and Matter.js version used by the project.

```js
import Matter from "matter-js";

const {
  Engine,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
  Mouse,
  MouseConstraint,
} = Matter;

export function createPhysicsScene(canvas, {
  width,
  height,
  onImpact = () => {},
} = {}) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  const engine = Engine.create({
    enableSleeping: true,
    gravity: { x: 0, y: 1, scale: 0.001 },
  });

  engine.positionIterations = 6;
  engine.velocityIterations = 4;
  engine.constraintIterations = 2;

  const runner = Runner.create();
  let disposed = false;
  let sceneWidth = width;
  let sceneHeight = height;
  let frameId = 0;
  let lastImpactAt = 0;

  const wallThickness = 80;
  const bodies = [
    Bodies.rectangle(sceneWidth * 0.35, 70, 90, 50, {
      chamfer: { radius: 8 },
      restitution: 0.35,
      friction: 0.7,
      label: "card-a",
    }),
    Bodies.circle(sceneWidth * 0.62, 35, 28, {
      restitution: 0.55,
      friction: 0.4,
      label: "token-b",
    }),
  ];

  const floor = Bodies.rectangle(
    sceneWidth / 2,
    sceneHeight + wallThickness / 2,
    sceneWidth + wallThickness * 2,
    wallThickness,
    { isStatic: true, label: "floor" }
  );

  const leftWall = Bodies.rectangle(
    -wallThickness / 2,
    sceneHeight / 2,
    wallThickness,
    sceneHeight * 2,
    { isStatic: true, label: "left-wall" }
  );

  const rightWall = Bodies.rectangle(
    sceneWidth + wallThickness / 2,
    sceneHeight / 2,
    wallThickness,
    sceneHeight * 2,
    { isStatic: true, label: "right-wall" }
  );

  Composite.add(engine.world, [...bodies, floor, leftWall, rightWall]);

  const mouse = Mouse.create(canvas);
  const mouseConstraint = MouseConstraint.create(engine, {
    mouse,
    constraint: {
      stiffness: 0.18,
      damping: 0.12,
      render: { visible: false },
    },
  });
  Composite.add(engine.world, mouseConstraint);

  function resize(nextWidth, nextHeight, pixelRatio = 1) {
    if (disposed) return;
    sceneWidth = Math.max(1, nextWidth);
    sceneHeight = Math.max(1, nextHeight);
    canvas.width = Math.round(sceneWidth * pixelRatio);
    canvas.height = Math.round(sceneHeight * pixelRatio);
    canvas.style.width = `${sceneWidth}px`;
    canvas.style.height = `${sceneHeight}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    Body.setPosition(floor, {
      x: sceneWidth / 2,
      y: sceneHeight + wallThickness / 2,
    });
    Body.setVertices(floor, Bodies.rectangle(
      sceneWidth / 2,
      sceneHeight + wallThickness / 2,
      sceneWidth + wallThickness * 2,
      wallThickness,
      { isStatic: true }
    ).vertices);
    Body.setPosition(leftWall, {
      x: -wallThickness / 2,
      y: sceneHeight / 2,
    });
    Body.setPosition(rightWall, {
      x: sceneWidth + wallThickness / 2,
      y: sceneHeight / 2,
    });
  }

  function render() {
    if (disposed) return;
    context.clearRect(0, 0, sceneWidth, sceneHeight);

    for (const body of Composite.allBodies(engine.world)) {
      if (body.isStatic || body === mouseConstraint.body) {
        // Static walls are intentionally not drawn in this example.
        if (body.label.endsWith("wall") || body.label === "floor") continue;
      }

      const vertices = body.vertices;
      context.beginPath();
      context.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i += 1) {
        context.lineTo(vertices[i].x, vertices[i].y);
      }
      context.closePath();
      context.fillStyle = body.label === "token-b" ? "#f59e0b" : "#2563eb";
      context.fill();
    }

    frameId = requestAnimationFrame(render);
  }

  Events.on(engine, "collisionStart", (event) => {
    const now = performance.now();
    if (now - lastImpactAt < 80) return;
    lastImpactAt = now;

    const meaningfulPair = event.pairs.find(({ bodyA, bodyB }) =>
      !bodyA.isSensor && !bodyB.isSensor
    );
    if (meaningfulPair) {
      onImpact({
        labelA: meaningfulPair.bodyA.label,
        labelB: meaningfulPair.bodyB.label,
      });
    }
  });

  Runner.run(runner, engine);
  render();
  resize(sceneWidth, sceneHeight);

  function destroy() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    Runner.stop(runner);
    Events.off(engine, "collisionStart");
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    Mouse.clearSourceEvents(mouse);
  }

  return {
    engine,
    resize,
    destroy,
    pause() {
      Runner.stop(runner);
    },
    resume() {
      if (!disposed) Runner.run(runner, engine);
    },
    reset() {
      for (const body of bodies) {
        Body.setVelocity(body, { x: 0, y: 0 });
        Body.setAngularVelocity(body, 0);
        Body.setPosition(body, {
          x: body.label === "card-a" ? sceneWidth * 0.35 : sceneWidth * 0.62,
          y: body.label === "card-a" ? 70 : 35,
        });
        Body.setAngle(body, 0);
      }
    },
  };
}
```

This is an architectural teaching example, not a universal drop-in library. In a production implementation, test the exact Matter.js version, verify wall geometry after resizing, handle pointer scale conversion, and decide whether the runner or a custom fixed-step loop owns updates. If a helper body is replaced during resize, make sure the replacement is added to the world and the old body is removed; do not mutate a body's vertices in a way that violates the version's expected internal geometry invariants. The important lesson is to make each lifecycle and coordinate decision explicit.

## Pattern 1 — Scene Factory With Idempotent Disposal

**Use when:** a component owns a physics scene and may mount/unmount more than once.

The factory should create all scene resources in one place and return a small public API. Its `destroy()` method must be safe if called twice. Store every event handler in a named variable so the exact handler can be removed later. Avoid anonymous callbacks if cleanup will require identifying them.

```js
function createScene(canvas) {
  const engine = Matter.Engine.create();
  const runner = Matter.Runner.create();
  let destroyed = false;

  const onCollisionStart = (event) => {
    // Convert collision into a small application event.
    queueImpact(event.pairs);
  };

  Matter.Events.on(engine, "collisionStart", onCollisionStart);

  return {
    engine,
    start() {
      if (!destroyed) Matter.Runner.run(runner, engine);
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      Matter.Events.off(engine, "collisionStart", onCollisionStart);
      Matter.Runner.stop(runner);
      Matter.Composite.clear(engine.world, false);
      Matter.Engine.clear(engine);
    },
  };
}
```

**Design rules:** create the engine once per scene owner; do not construct it inside a render function; retain references to handlers; stop the runner before clearing the world; and make disposal safe after partial initialization. If initialization can throw halfway through, wrap setup in a guarded block that disposes the resources already created before rethrowing the error.

**Validation:** mount the component, unmount it, mount it again, and confirm that only one simulation runs. Repeat the sequence in development mode, where framework effects may be intentionally invoked more than once.

## Pattern 2 — Responsive Bounds Without Rebuilding the Whole World

**Use when:** the canvas container changes size due to responsive layout, a sidebar opening, or a window resize.

Observe the container rather than assuming `window.innerWidth` equals the scene width. A `ResizeObserver` can report the actual content box. Keep the world in CSS-pixel-like units and update only the dimensions and boundary geometry that changed. Avoid rebuilding all bodies on every resize, because doing so discards velocity, selection, and any user-created state.

```js
function observeSceneSize(container, scene) {
  let lastWidth = 0;
  let lastHeight = 0;

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    const { width, height } = entry.contentRect;
    if (width <= 0 || height <= 0) return;

    if (Math.abs(width - lastWidth) < 1 &&
        Math.abs(height - lastHeight) < 1) return;

    lastWidth = width;
    lastHeight = height;
    scene.resize(width, height, Math.min(window.devicePixelRatio || 1, 2));
  });

  observer.observe(container);
  return () => observer.disconnect();
}
```

**Design rules:** debounce only if profiling shows resize churn; ignore zero-size observations; cap device-pixel ratio on memory-constrained devices; and define what happens when a body is outside the new bounds. You may clamp positions, preserve them and let gravity settle them, or reset the scene after a major layout change. Choose deliberately.

**Validation:** test narrow and wide layouts, container changes without a window resize, a hidden-to-visible transition, and a device-pixel ratio change where supported.

## Pattern 3 — Pointer Dragging With Correct Coordinate Conversion

**Use when:** users can pick up and move objects within a canvas.

Matter's mouse helpers are convenient when the canvas coordinate system matches the event coordinate system. If the canvas is CSS-scaled, offset, or transformed, calculate local coordinates using its bounding rectangle and apply the inverse scene scale. Avoid using `pageX` directly as a world coordinate.

```js
function pointerToLocal(event, canvas, worldWidth, worldHeight) {
  const rect = canvas.getBoundingClientRect();
  const xRatio = (event.clientX - rect.left) / rect.width;
  const yRatio = (event.clientY - rect.top) / rect.height;

  return {
    x: xRatio * worldWidth,
    y: yRatio * worldHeight,
  };
}
```

**Design rules:** handle `pointercancel`; avoid trapping the pointer beyond the component's lifetime; make touch scrolling behavior local and explicit; and give users a non-drag action when dragging is not accessible. A pointer can be lost when the browser takes over a gesture or the tab changes. The interaction should recover to a valid state instead of leaving an object attached to an invisible pointer.

**Validation:** drag from the center and edges, drag after zooming the page, drag on a touch device, release outside the canvas, and cancel the pointer interaction.

## Pattern 4 — Collision Feedback With Thresholds and Deduplication

**Use when:** collisions create a small flash, sound, vibration, or status effect.

A collision can be visually noisy when many bodies settle together. Use a minimum intensity threshold and a short cooldown, and avoid performing expensive work directly inside the physics event callback. If a collision should produce audio, respect browser autoplay restrictions and provide a mute control.

```js
const impactQueue = [];
let lastFeedbackTime = 0;

function onCollisionStart(event) {
  const now = performance.now();
  if (now - lastFeedbackTime < 100) return;

  const pair = event.pairs.find((item) =>
    !item.bodyA.isSensor && !item.bodyB.isSensor
  );
  if (!pair) return;

  const speed = Math.hypot(
    pair.bodyA.velocity.x - pair.bodyB.velocity.x,
    pair.bodyA.velocity.y - pair.bodyB.velocity.y
  );
  if (speed < 1.8) return;

  lastFeedbackTime = now;
  impactQueue.push({ speed, time: now });
}
```

**Design rules:** use relative velocity or a more appropriate impact measure for the desired behavior; cap queued effects; and expire stale feedback before rendering it. A cooldown alone can suppress two legitimate impacts that happen close together, so tune it to the interaction and consider per-body-pair throttling when needed.

**Validation:** drop a body from a low height, drop it from a high height, let several objects settle, and verify that only meaningful impacts trigger effects.

## Pattern 5 — Semantic DOM Controls for Canvas Actions

**Use when:** the physics scene contains actions that matter, such as selecting, resetting, moving, or removing an object.

Keep the canvas for expressive motion and provide HTML controls for core actions. A selected object can be moved using buttons or arrow keys. The UI can also offer a list of objects with accessible names and explicit remove buttons. The DOM and physics state should share a stable object identifier, not rely on an array index that changes after deletion.

```html
<section aria-labelledby="physics-title">
  <h2 id="physics-title">Arrange the cards</h2>
  <p id="physics-help">Select a card, then use the move controls.</p>
  <canvas id="physics-canvas" aria-describedby="physics-help">
    The interactive card scene is unavailable. Use the controls below.
  </canvas>
  <div role="group" aria-label="Selected card movement">
    <button type="button" id="move-left">Move left</button>
    <button type="button" id="move-right">Move right</button>
    <button type="button" id="drop-card">Drop card</button>
    <button type="button" id="reset-scene">Reset scene</button>
  </div>
  <p id="physics-status" role="status" aria-live="polite"></p>
</section>
```

**Design rules:** use native buttons, maintain visible focus, explain the controls, and announce meaningful state changes without announcing every physics frame. If the canvas is decorative only, mark it appropriately and do not imply that users can interact with it.

**Validation:** complete the task using only the keyboard, with a screen reader, with pointer input, and with reduced motion enabled.

## Pattern 6 — Reduced-Motion and Visibility-Aware Simulation

**Use when:** the effect includes continuous movement, bouncing, or a scene that can run while off-screen.

Respect the user's motion preference and avoid running a full simulation when the scene is hidden or irrelevant. Reduced motion may switch the scene to a static arrangement, disable automatic gravity, lower restitution, or require a user-triggered “Play animation” action. The alternative must preserve information and task completion.

```js
function configureMotionPreference(scene, mediaQuery) {
  const apply = () => {
    if (mediaQuery.matches) {
      scene.pause();
      scene.setReducedMotion?.(true);
    } else {
      scene.setReducedMotion?.(false);
      scene.resume();
    }
  };

  mediaQuery.addEventListener("change", apply);
  apply();

  return () => mediaQuery.removeEventListener("change", apply);
}

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const stopListening = configureMotionPreference(scene, motionQuery);
```

**Design rules:** a reduced-motion mode should be stable, not a simulation that keeps moving invisibly. Pause on `visibilitychange` where appropriate, but distinguish document visibility from whether the component is in the viewport. Do not assume every motion-sensitive user wants all movement removed; use a sensible low-motion default and provide a user-controlled option for substantial effects.

**Validation:** toggle the operating-system preference while the page is open, switch tabs, scroll the scene off-screen, and verify that the scene resumes correctly when appropriate.

## Pattern 7 — Bounded Object Creation and Pooling

**Use when:** the interaction creates bodies over time, such as a stream of tokens or particles.

Set a maximum active-body count. When the limit is reached, remove or recycle the oldest low-priority object instead of allowing the world to grow indefinitely. Pooling is useful for frequently reused lightweight effects, but pooled bodies must be reset completely: position, angle, velocity, angular velocity, sleeping state, collision filters, and any per-body metadata.

```js
function addToken(scene, tokenOptions, maxBodies = 80) {
  const active = Matter.Composite.allBodies(scene.engine.world)
    .filter((body) => body.label.startsWith("token-"));

  if (active.length >= maxBodies) {
    const oldest = active[0];
    Matter.Composite.remove(scene.engine.world, oldest);
  }

  const token = Matter.Bodies.circle(
    tokenOptions.x,
    tokenOptions.y,
    tokenOptions.radius ?? 12,
    { label: `token-${tokenOptions.id}`, restitution: 0.25 }
  );

  Matter.Composite.add(scene.engine.world, token);
  return token;
}
```

**Design rules:** count only relevant bodies, exclude boundaries and helper bodies, and ensure removed bodies are also removed from application collections. If using a pool, use stable IDs and reset all mutable state. Do not pool until profiling indicates object churn is a real problem; premature pooling can create harder-to-debug state leaks.

**Validation:** create and remove objects repeatedly, inspect active body count, and verify that performance remains stable after several minutes.

## Pattern 8 — Collision Categories and Sensors

**Use when:** some objects should detect overlaps without physically pushing one another, or groups should collide only with selected categories.

Sensors detect collisions without generating ordinary physical response. Collision categories and masks express the rules of the world. This is clearer than attaching many labels and branching on them in a global callback.

```js
const CATEGORY_OBJECT = 0x0001;
const CATEGORY_TARGET = 0x0002;
const CATEGORY_DECORATION = 0x0004;

const draggable = Matter.Bodies.rectangle(100, 100, 60, 40, {
  collisionFilter: {
    category: CATEGORY_OBJECT,
    mask: CATEGORY_TARGET,
  },
});

const target = Matter.Bodies.circle(260, 150, 38, {
  isStatic: true,
  isSensor: true,
  collisionFilter: {
    category: CATEGORY_TARGET,
    mask: CATEGORY_OBJECT,
  },
});

const decoration = Matter.Bodies.circle(40, 40, 8, {
  collisionFilter: {
    category: CATEGORY_DECORATION,
    mask: 0,
  },
});
```

**Design rules:** document category bits centrally, remember that masks must permit the pair to interact, and decide whether sensor overlap should be treated as a one-time transition or a continuous condition. Do not use sensors as a substitute for keyboard-accessible target selection.

**Validation:** test every intended collision pair and every pair that should not collide. A simple matrix in a test or design note can prevent a later category change from silently breaking interactions.

## Pattern 9 — Stable Reset and Replay

**Use when:** the scene is part of a tutorial, configurator, or repeatable interaction.

Reset should restore a known state rather than only moving bodies back to their initial coordinates. Reset velocity, angular velocity, angle, force, torque, sleeping state, selection, queued feedback, and any application-side score or progress. If the scene has dynamically created bodies, define whether reset removes them or returns them to a baseline pool.

```js
function resetBody(body, initial) {
  Matter.Sleeping.set(body, false);
  Matter.Body.setPosition(body, initial.position);
  Matter.Body.setAngle(body, initial.angle ?? 0);
  Matter.Body.setVelocity(body, { x: 0, y: 0 });
  Matter.Body.setAngularVelocity(body, 0);
  Matter.Body.setStatic(body, Boolean(initial.isStatic));
}
```

**Design rules:** keep initial state in a data structure keyed by stable ID; do not infer original state from current body properties; and reset the application model and physics model together. If random placement is used, preserve the original seed or initial coordinates for deterministic replay.

**Validation:** perform several interactions, reset, and compare body positions, labels, available controls, and status text with the initial scene.

## Pattern 10 — Progressive Enhancement and Fallback

**Use when:** the scene is a visual enhancement around an otherwise useful interface.

A physics interaction should not be a single point of failure. If canvas context creation fails, JavaScript is disabled, or reduced-motion mode disables the simulation, provide a static arrangement and the same core controls. Do not hide the only meaningful content inside a canvas bitmap.

```js
function canUsePhysics(canvas) {
  return Boolean(
    canvas &&
    typeof canvas.getContext === "function" &&
    canvas.getContext("2d")
  );
}

function initializeOrFallback(canvas, fallbackElement, createScene) {
  if (!canUsePhysics(canvas)) {
    fallbackElement.hidden = false;
    canvas.hidden = true;
    return () => {};
  }

  fallbackElement.hidden = true;
  canvas.hidden = false;

  const scene = createScene(canvas);
  return () => scene.destroy();
}
```

**Design rules:** fallback content should be part of the original HTML, not created only after a failure; keep status messages useful; and ensure the fallback does not duplicate controls in the accessibility tree. The fallback should preserve the task, not merely display an error.

**Validation:** force the initializer to fail in a test, run with reduced motion, and inspect the page with JavaScript disabled if that is within the product's support target.

## Integration With React or Another UI Framework

The framework should own the lifetime of the scene, while Matter owns the simulation. In React, a `useEffect` can create the scene after the canvas is mounted and return a cleanup function. A `useRef` can hold the controller so event handlers can access it without triggering a component render. Do not put the engine object in state unless the interface genuinely needs to render in response to its identity.

```jsx
import { useEffect, useRef, useState } from "react";

export function PhysicsCardPlayground() {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const [status, setStatus] = useState("Scene ready");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const scene = createPhysicsScene(canvas, {
      width: canvas.clientWidth || 640,
      height: canvas.clientHeight || 360,
      onImpact: () => setStatus("Objects collided"),
    });

    sceneRef.current = scene;

    const onVisibilityChange = () => {
      if (document.hidden) scene.pause();
      else scene.resume();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      scene.destroy();
      if (sceneRef.current === scene) sceneRef.current = null;
    };
  }, []);

  return (
    <section aria-labelledby="playground-title">
      <h2 id="playground-title">Physics playground</h2>
      <p id="playground-help">Drag an object, or use the controls below.</p>
      <canvas
        ref={canvasRef}
        aria-describedby="playground-help"
        aria-label="Interactive physics scene"
        style={{ display: "block", width: "100%", height: 360 }}
      />
      <div role="group" aria-label="Scene controls">
        <button type="button" onClick={() => sceneRef.current?.reset()}>
          Reset scene
        </button>
        <button type="button" onClick={() => sceneRef.current?.pause()}>
          Pause motion
        </button>
        <button type="button" onClick={() => sceneRef.current?.resume()}>
          Resume motion
        </button>
      </div>
      <p role="status" aria-live="polite">{status}</p>
    </section>
  );
}
```

The example demonstrates lifecycle ownership and semantic controls. For production, add `ResizeObserver`, a reduced-motion subscription, an accessible way to select a body, and a clear policy for announcing events. If collision events can fire frequently, aggregate status updates instead of calling `setStatus` on every contact.

### Framework Integration Checklist

- Create the scene only after the canvas exists.
- Keep the controller in a ref or component-owned instance.
- Return cleanup from the same effect that performs setup.
- Avoid stale closures by using stable callbacks or a mutable callback ref.
- Ensure development remounts do not leave duplicate runners.
- Keep high-frequency body positions out of global application state.
- Use semantic state for selected object, completion, and user intent.
- Test route changes, conditional rendering, and repeated mounts.
- If server-side rendering is used, import or initialize browser-only APIs only in the client environment.
- Never treat a canvas label as a substitute for a keyboard-operable control model.

## Semantic HTML Requirements

Use real HTML semantics around the canvas. A production physics component commonly needs at least five relevant semantic elements or relationships:

1. `<section>` to group the interactive scene when it forms a named region.
2. `<h2>` or another correctly nested heading to give the region a meaningful title.
3. `<p>` to explain instructions or limitations in plain language.
4. `<canvas>` with fallback text and an appropriate accessible name or description.
5. `<button type="button">` for reset, pause, select, move, or remove actions.
6. `<div role="group" aria-label="...">` when a set of related controls benefits from a group name.
7. `<p role="status" aria-live="polite">` for concise, non-urgent state changes.
8. `<ul>` and `<li>` if a list of objects is available as an alternate selection surface.
9. `<label>` with a form control when the user configures a value such as gravity, bounce, or object count.
10. `<output>` when showing the current value of a range input or numeric setting.

Do not use semantic elements merely to satisfy a count. Choose elements according to their actual meaning. Avoid clickable `<div>` elements when a native button is appropriate. A physics canvas should never be the only way to perform an essential action.

## Accessibility Checklist

1. Provide a keyboard-operable alternative for every essential drag-only action.
2. Make all buttons and other controls reachable with Tab and operable with Enter or Space.
3. Keep a clearly visible focus indicator; do not remove the outline without a replacement.
4. Respect `prefers-reduced-motion` and make the low-motion mode preserve task access.
5. Do not communicate state only through color, movement, sound, or vibration.
6. Use a concise live region for meaningful events, not for every frame or collision.
7. Give the scene a meaningful name and a short description of the available actions.
8. Ensure the canvas has fallback text and a useful non-canvas alternative when content matters.
9. Avoid unexpected focus movement when a body collides or changes position.
10. Provide a way to pause or stop continuous motion when it could distract or interfere.
11. Keep hit targets large enough for touch and avoid controls that move away from the pointer.
12. Do not block browser zoom or pinch gestures globally to support a local physics interaction.
13. Ensure contrast for drawn objects and any visual selection indicator.
14. Make errors and unsupported states understandable without relying on animation.
15. If a sound is generated from impact, provide mute or volume control and do not autoplay audio without a user gesture.
16. If object order or selection changes, expose the same information in the DOM.
17. Do not announce raw technical events such as “collisionStart fired”; announce the user-relevant outcome.
18. Test keyboard-only use and at least one screen-reader workflow, not just automated accessibility scans.

## Performance Notes

1. **Set a body budget.** Define a maximum active count appropriate to the scene. For a small interface effect, dozens of bodies may be enough; do not assume hundreds are free.
2. **Use sleeping where appropriate.** Sleeping can reduce work for bodies that have settled, but test whether frequent small forces or constraints prevent sleeping.
3. **Tune solver iterations empirically.** More iterations may improve stability but increase CPU cost. Start with conservative values and increase only when a reproducible defect requires it.
4. **Avoid full framework renders per frame.** Render to canvas or update a narrowly scoped transform rather than setting global component state for every body position.
5. **Cap device-pixel ratio.** Very high backing-store dimensions increase memory and drawing cost. A cap such as 2 is often a reasonable starting point, but validate on target devices.
6. **Pause off-screen or hidden scenes.** Use visibility state and, where useful, `IntersectionObserver`. Resume with a fresh timing baseline to avoid a giant time jump.
7. **Limit collision side effects.** Aggregate or throttle audio, haptics, DOM updates, and particle effects.
8. **Avoid unbounded object creation.** Remove stale bodies and associated metadata; pool only after profiling.
9. **Keep drawing simple.** Avoid expensive shadows, filters, and complex paths for every body on every frame.
10. **Avoid repeated world scans in hot callbacks.** Cache references to important bodies instead of calling `Composite.allBodies` repeatedly inside every event callback.
11. **Use stable geometry.** Recreating all bodies on each resize can create garbage and reset state. Update only boundaries and necessary positions.
12. **Measure on low-power hardware.** Desktop development performance can hide mobile bottlenecks. Test the target browser, screen size, and device class.
13. **Avoid accidental double stepping.** A Runner and a custom update loop must not both advance the same engine unintentionally.
14. **Keep physics and visual effects budgets separate.** A small body count can still become expensive if each collision creates dozens of particles or DOM nodes.
15. **Instrument before optimizing.** Track active bodies, frame rate, frame time, and time spent in rendering before introducing complex optimizations.

## Common Mistakes and Failure Modes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Creating an engine during every component render | Repeated engines and runners accumulate and produce duplicate motion | Create once in a lifecycle effect or scene factory |
| Forgetting to stop the runner | Simulation continues after the UI is gone | Stop the runner in an idempotent destroy method |
| Clearing the world but leaving event handlers | Closures and callbacks can retain references or fire unexpectedly | Remove named event handlers before clearing the engine |
| Using anonymous event callbacks that cannot be removed precisely | Cleanup may remove the wrong callback or none at all | Store each callback reference |
| Resizing only the canvas bitmap | Bodies collide with invisible old walls | Update the world bounds and rendering dimensions together |
| Treating device pixels as physics units | Bodies and pointer coordinates become misaligned on high-DPI screens | Keep a clear world scale and transform rendering and input consistently |
| Mapping `pageX` directly to world X | Offset, scroll, and scale create incorrect dragging | Convert from `clientX` and `getBoundingClientRect()` to local coordinates |
| Running both Runner and custom stepping | The engine advances too quickly and becomes unstable | Pick one update owner |
| Updating React state on every collision-active event | UI rerenders and status announcements become noisy | Use collision-start, thresholds, throttling, or an event queue |
| Triggering sound on every contact frame | A resting body can repeatedly produce sound | Detect new impacts and apply an intensity threshold |
| Allowing body count to grow forever | Performance degrades over time | Set a maximum and remove or recycle stale bodies |
| Using physics for a simple hover animation | Adds unnecessary runtime and tuning complexity | Prefer CSS transitions or Web Animations API |
| Making canvas the only control surface | Keyboard and screen-reader users cannot complete the task | Provide semantic controls and an alternate object list |
| Ignoring reduced motion | Continuous movement can cause discomfort or distraction | Offer a low-motion/static mode and a way to pause |
| Rebuilding all bodies on resize | User-created state and velocities disappear | Update boundaries and clamp only what is necessary |
| Resetting position but not velocity | Objects immediately move away from the reset state | Reset position, angle, linear/angular velocity, forces, and app state |
| Using one global collision category without a plan | Unrelated objects interact and callbacks become conditional soup | Define category constants and a collision matrix |
| Assuming a physics library makes the UI responsive | Simulation code can still block the main thread | Bound work, profile, pause hidden scenes, and simplify effects |
| Omitting pointer cancellation | A drag can remain stuck after browser gesture takeover | Handle pointer cancellation and release paths |
| Hiding fallback content until initialization fails | Content may be unavailable before the failure is detected | Include a usable fallback in the initial document |
| Removing focus outlines for visual polish | Keyboard users lose orientation | Style a visible focus indicator that matches the design |
| Using random initial positions in tests | Bugs become difficult to reproduce | Inject a seeded random source or explicit initial state |
| Applying forces directly from every pointer move without limits | The interaction can feel jittery or produce extreme velocities | Use a pointer constraint or clamp input-derived impulses |
| Ignoring route transitions and hot reload | Stale canvases and loops remain active | Treat scene destruction as part of route/component ownership |

## Gotchas

- **Matter's helper APIs can be version-sensitive.** Check the installed version's documentation before depending on details of runner, mouse, body geometry, or cleanup behavior. Do not assume an example copied from another version is drop-in compatible.
- **The canvas's CSS size and backing-store size are different.** Set both intentionally, then apply a context transform; do not scale both the world and drawing coordinates by the device pixel ratio.
- **A static body can still need repositioning.** Resizing the canvas does not update the physics world. Rebuild or update boundary geometry through supported body APIs.
- **Collision callbacks can fire more often than the product effect should.** Distinguish new impacts from continued contact and apply a threshold.
- **Touch interaction may conflict with page scrolling.** Limit `touch-action` changes to the interaction surface and provide another way to perform the action.
- **Reduced motion is a live preference.** The setting can change while the page is open; subscribe to changes and remove the listener.
- **Background tabs distort elapsed time.** Pause or clamp large time deltas and reset timing assumptions when returning to the page.
- **A visual body may not match its DOM hit target.** If both DOM and canvas objects are interactive, ensure their positions, sizes, and focus behavior remain consistent.
- **Sleeping is not a universal optimization.** Forces, constraints, and frequent interactions can keep bodies awake; verify actual frame-time improvements.
- **Reset is a domain operation.** Reset the UI's selected object, progress, and queued feedback as well as the physics transform.
- **A sensor overlap is not the same as a physical collision.** It can notify the application without pushing bodies apart.
- **Canvas accessibility depends on what the canvas represents.** A decorative background can be hidden from assistive technology; an interactive scene needs an accessible name and parallel controls.

## Quick Reference

| Need | Recommended technique | Watch for |
|---|---|---|
| Create a simulation | `Engine.create()` | One engine per scene owner |
| Start the built-in update loop | `Runner.create()` and `Runner.run()` | Do not also advance the engine elsewhere |
| Add bodies | `Bodies.rectangle`, `Bodies.circle`, or `Bodies.fromVertices` | Match geometry to visual dimensions |
| Add objects to the world | `Composite.add()` | Track dynamically added objects for reset and removal |
| Remove a body | `Composite.remove()` | Remove application-side references too |
| Create fixed boundaries | Static bodies | Update them on resize |
| Tune bounce | `restitution` | Excessive bounce can look chaotic |
| Tune contact resistance | `friction` and related settings | Tune by feel, not assumptions about real-world units |
| Drag a body | `MouseConstraint` or a custom pointer adapter | Coordinate conversion and pointer cancellation |
| React to new impact | `collisionStart` | Deduplicate effects and apply a threshold |
| Detect overlap only | `isSensor: true` | Sensors do not provide ordinary physical response |
| Restrict collisions | `collisionFilter.category` and `mask` | Verify both sides of the intended interaction |
| Improve stable resting scenes | `enableSleeping` | Test with constraints and small continuous forces |
| Resize the canvas | Update CSS size and backing store | Recompute bounds and drawing transform |
| Support high-DPI screens | Cap and apply device-pixel ratio | Do not scale physics units unintentionally |
| Reduce background work | Pause runner when hidden/off-screen | Resume without a giant time jump |
| Support reduced motion | Static/low-motion mode | Preserve access to all actions |
| Reset a body | Reset position, angle, velocities, and forces | Also reset selection and application state |
| Dispose a scene | Stop runner, remove handlers, clear engine | Cleanup must be safe twice |
| Test physics behavior | Assert invariants with tolerances | Avoid exact coordinates tied to frame timing |

## Testing Strategy

Test the simulation at three levels.

### Unit-Level Invariants

Test the small pieces that do not require a full browser: coordinate conversion, collision category rules, reset-state mapping, object-count limits, and impact-threshold decisions. Inject time and randomness where needed. A coordinate-conversion test should cover a non-zero canvas offset and a CSS-scaled canvas rather than only an origin-aligned canvas.

### Browser Integration

Mount the component in a real browser. Verify that the canvas draws, the pointer can select and drag a body, resize updates bounds, and teardown stops future animation frames. Test a rapid mount/unmount cycle and confirm that event listeners are not duplicated. If using React Strict Mode, include its development behavior in the test plan.

### Accessibility and Product QA

Complete the core task without a pointer. Test focus order, focus visibility, labels, status messages, reduced motion, and zoom. Inspect the fallback state and verify that the page remains useful if the canvas cannot initialize. Automated accessibility tools help find structural issues, but they do not prove that a drag-based interaction has a keyboard alternative.

### Suggested Assertions

- Every dynamic body remains inside the expected bounds after settling, within a reasonable tolerance.
- Reset returns all tracked bodies to their configured initial state.
- Destroy can be called twice without throwing.
- No animation frame is scheduled after destroy.
- Resizing changes wall locations without silently duplicating walls.
- A low-speed resting contact does not repeatedly trigger impact feedback.
- The maximum active-body budget is respected.
- Keyboard controls can perform the same essential action as pointer dragging.
- Reduced-motion mode does not remove task information or controls.
- Hidden scenes do not continue consuming unnecessary simulation work.

## Build Challenge: Accessible Physics Card Playground

Build a small interface in which users can arrange a set of cards in a bounded physics area. The exercise is intentionally more demanding than a simple falling-bodies demo because it requires the physics system to coexist with a real interface.

### Required Deliverables

1. Create a scene factory that owns the engine, world, boundaries, runner, input adapter, and event handlers.
2. Render at least six draggable objects with distinguishable shapes or visual labels.
3. Add floor and side boundaries that update when the scene container changes size.
4. Support pointer dragging with correct local-coordinate conversion and pointer cancellation handling.
5. Provide semantic HTML controls to select, move, drop, and reset an object without a pointer.
6. Add a collision feedback effect that is triggered only by meaningful impacts and is throttled or deduplicated.
7. Implement a reduced-motion mode that provides a stable alternative while preserving every essential action.
8. Pause or reduce work when the page is hidden, and resume safely when it becomes visible again.
9. Enforce a maximum active-body count and remove all associated application metadata when an object is deleted.
10. Add a `destroy()` method that stops all loops, removes all listeners, detaches input, and can safely be called twice.

### Quality Requirements

- The interface uses a heading, descriptive text, canvas fallback content, native buttons, a named control group, and a status region.
- Keyboard focus is visible and follows a predictable order.
- The user can zoom the page and still interact with the scene.
- The scene remains useful on a narrow viewport and on a high-DPI screen.
- Physics state does not trigger a full framework render every frame.
- Reset restores transforms, velocities, selection, status, and any queued effects.
- Tests cover coordinate conversion, resize, reset, body limits, and teardown.
- The implementation documents the Matter.js version and any version-specific API assumptions.
- Performance is measured on a representative lower-powered device.
- The README explains why physics was selected over CSS animation and identifies the non-physics fallback.

### Evaluation Rubric

| Area | Strong result | Warning sign |
|---|---|---|
| Physics behavior | Stable, bounded, and intentionally tuned | Uncontrolled bounce or bodies escaping bounds |
| Architecture | Clear factory and controller API | Engine creation mixed into rendering code |
| Input | Correct on offset/scaled canvases | Pointer works only at the canvas origin |
| Lifecycle | Idempotent teardown, no duplicate loops | Motion continues after unmount |
| Accessibility | Keyboard route and clear announcements | Dragging is the only way to act |
| Motion preference | Reduced-motion alternative preserves tasks | Preference is ignored or content disappears |
| Performance | Bounded body count and measured frame cost | Unbounded creation or state updates every frame |
| Testing | Invariants and lifecycle are repeatable | Tests rely on arbitrary exact frame coordinates |
| Responsive behavior | Bounds and drawing stay aligned | Invisible walls or mismatched hit testing |
| Product value | Physics clarifies or enriches the task | Motion is decorative noise that obstructs work |

## Definition of Done

The skill is complete when all of the following are true:

- [ ] The engine and runner have one clear owner.
- [ ] The scene has explicit world bounds and a tested resize strategy.
- [ ] Bodies map consistently to their visual representation.
- [ ] Pointer coordinates are correct for offset and scaled canvases.
- [ ] Collision feedback is thresholded and does not spam effects.
- [ ] Dynamic objects have a maximum count and a removal policy.
- [ ] Reset restores physics and application state.
- [ ] Semantic HTML controls expose every essential action.
- [ ] Keyboard operation, focus visibility, and screen-reader labels have been checked.
- [ ] Reduced-motion behavior is implemented and tested.
- [ ] Hidden/off-screen behavior avoids unnecessary work.
- [ ] All listeners, observers, runners, and animation frames are cleaned up.
- [ ] Calling `destroy()` twice is safe.
- [ ] Tests cover resize, coordinate conversion, reset, body limits, and teardown.
- [ ] The implementation has been profiled on a representative target device.
- [ ] A non-physics fallback preserves the core task.
- [ ] Version-specific API assumptions are documented.
- [ ] Physics is demonstrably a better fit than a simpler animation technique.

## Final Review Checklist

Before shipping, ask:

- Does the physical behavior make the interaction clearer, more satisfying, or more understandable?
- Can a user finish the same task without dragging?
- Does the simulation stop when it has no value to add?
- Is every object count, event side effect, and rendering cost bounded?
- Can a developer explain which system owns each coordinate and state value?
- Can the scene be mounted, resized, paused, resumed, reset, and destroyed repeatedly without leaking resources?
- Does the experience remain understandable without color, sound, continuous motion, or canvas rendering?
- Have actual device behavior and browser timing been tested instead of inferred from a desktop preview?

If any answer is no, keep the implementation in development. A polished physics interaction is not merely one that looks good in a happy-path demo; it is one that remains stable, accessible, and maintainable under real user behavior.
