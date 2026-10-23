# Rapier 3D Basic

## Skill Metadata

- **Layer:** `layer-09-physics-audio`
- **Skill directory:** `rapier-3d-basic`
- **Canonical file:** `rapier-3d-basic.md`
- **Primary library:** `@dimforge/rapier3d-compat`
- **Level:** Intermediate
- **Purpose:** Build reliable, deterministic-feeling 3D physics interactions for browser experiences while keeping simulation, rendering, input, accessibility, and lifecycle concerns separate.
- **Use this skill when:** A Three.js scene needs gravity, colliders, rigid bodies, impulses, joints, contact events, or physically plausible movement.
- **Do not use this skill as:** A substitute for a full vehicle dynamics model, a soft-body solver, a complete character-controller design, or a promise of bit-identical simulation across every browser and platform.

## Goal

Create a maintainable Rapier 3D integration that advances a physics world at a controlled timestep, synchronizes rigid bodies with render objects, handles user input without destabilizing the simulation, cleans up resources, and remains usable for people who do not rely on mouse input or motion alone.

The central engineering objective is not simply to make objects fall. It is to make the simulation predictable enough to debug, inexpensive enough to run in a browser, and understandable enough that visual code does not become entangled with physics state.

## Why This Matters

A 3D physics demo often starts with a ground plane, a cube, and gravity. The first version works, then real interactions introduce edge cases: a frame takes 90 milliseconds, a collider starts intersecting the floor, a model's origin does not match its collider, a click creates a body but no corresponding render object, or a scene is unmounted while the simulation continues to run.

Rapier gives web developers a performant rigid-body engine with useful collision queries and event support. The engine does not remove the need for good architecture. A robust integration establishes clear ownership of the physics world, a fixed-step update policy, a mapping between bodies and visual objects, and an explicit disposal path.

The most important distinction is between **simulation state** and **presentation state**. The rigid body owns the simulated position and rotation. A Three.js mesh displays that state. Input should ask the physics world to change state through forces, impulses, velocity, or kinematic targets; it should not quietly overwrite dynamic body transforms every render frame.

## Core Concepts

### 1. Install and initialize the compatibility package

Rapier's compatibility package is commonly used in browser bundlers because it handles the WebAssembly module integration expected by the package. Install the package through the project's package manager:

```bash
npm install @dimforge/rapier3d-compat
```

Initialization is asynchronous. Await it before creating a world or running simulation code.

```js
import * as RAPIER from "@dimforge/rapier3d-compat";

await RAPIER.init();

const gravity = { x: 0, y: -9.81, z: 0 };
const world = new RAPIER.World(gravity);
```

Keep initialization in one application-owned place. Do not call it from every mesh component or every click handler. In frameworks, initialize at a route, scene, or service boundary and provide the resulting world to consumers.

### 2. World and gravity

`RAPIER.World` is the simulation container. It owns bodies, colliders, broad-phase and narrow-phase collision structures, and solver state. Gravity is a vector and should use the same coordinate convention as the render scene.

```js
const world = new RAPIER.World({
  x: 0,
  y: -9.81,
  z: 0,
});
```

A conventional Three.js scene treats Y as up, so negative Y gravity is common. If your application uses another up axis, make that convention explicit and ensure the camera, floor, gravity, and imported assets agree.

### 3. Rigid bodies

A rigid body represents the motion of a physical object. Rapier provides body types including dynamic, fixed, and kinematic variants. Dynamic bodies respond to forces, gravity, and contacts. Fixed bodies do not move. Kinematic bodies are moved by application-defined targets and can influence dynamic bodies through contacts.

```js
const dynamicDesc = RAPIER.RigidBodyDesc.dynamic()
  .setTranslation(0, 3, 0);

const body = world.createRigidBody(dynamicDesc);
```

Use body types according to intent. A static platform should not be a dynamic body with frozen-looking behavior. A player-controlled elevator is often kinematic. A falling crate is dynamic.

### 4. Colliders

A collider defines collision shape and contact properties. It can be attached to a body or created as a standalone fixed collider. A collider is not the same thing as a rendered mesh: visual detail can be high while the collision shape remains simple.

```js
const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5)
  .setFriction(0.7)
  .setRestitution(0.15);

const collider = world.createCollider(colliderDesc, body);
```

Rapier shape constructors use half-extents for cuboids. A cuboid with half-extents `(0.5, 0.5, 0.5)` is one unit wide, tall, and deep. This is a frequent source of scale mistakes.

### 5. Dynamic, fixed, and kinematic bodies

Choose a body type before choosing movement code:

- **Dynamic:** forces and impulses affect movement; collisions and gravity are simulated.
- **Fixed:** does not move; ideal for floors, walls, and stationary props.
- **Kinematic position-based:** the application supplies a next position; Rapier computes movement in a way that can interact with dynamic bodies.
- **Kinematic velocity-based:** velocity is application-controlled while contacts are resolved by the engine.

Do not move a dynamic body by setting its translation every frame unless you are intentionally teleporting it. Teleporting bypasses the normal relationship between velocity, contacts, and the solver.

### 6. Fixed timesteps

Physics stability is improved when the simulation advances in fixed increments. Render frames are variable; a display may run at 60, 90, 120, or irregular frames per second. Use an accumulator to collect elapsed time and step physics in fixed-sized increments.

```js
const FIXED_DT = 1 / 60;
let accumulator = 0;
let previousTime = performance.now();

function frame(now) {
  const elapsed = Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  accumulator += elapsed;

  while (accumulator >= FIXED_DT) {
    world.timestep = FIXED_DT;
    world.step();
    accumulator -= FIXED_DT;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
```

The clamp limits catch-up work after a tab resumes. This is an intentional trade-off: a browser experience usually benefits from avoiding a spiral of death more than from simulating every millisecond of background time.

### 7. Body-to-mesh synchronization

Create a deliberate mapping between a Rapier body and its Three.js object. The physics world is authoritative for dynamic transforms; the render mesh copies the simulated translation and rotation after stepping.

```js
function syncMesh(mesh, body) {
  const p = body.translation();
  const q = body.rotation();

  mesh.position.set(p.x, p.y, p.z);
  mesh.quaternion.set(q.x, q.y, q.z, q.w);
}
```

For many objects, store pairs in a collection and synchronize in one pass. Avoid searching a scene graph by name each frame. Use the body's stable handle or an application-level record to find the correct render object.

### 8. Forces and impulses

A force accumulates over time and is appropriate for sustained influence. An impulse changes velocity immediately and is useful for a jump, a one-shot launch, or a punch-like interaction.

```js
body.applyImpulse({ x: 0, y: 4, z: 0 }, true);
body.applyForce({ x: 0, y: 8, z: 0 }, true);
```

The second argument requests wake-up behavior. Sleeping bodies may be skipped for performance, so wake a body when applying an action that should make it move. Prefer impulses for discrete actions and forces for continuous controls such as wind or thrust.

### 9. Velocity

Velocity is appropriate when the game design directly controls a dynamic object's speed, but it must be used carefully. Replacing all velocity every frame can suppress natural contact response and make the body feel weightless.

```js
const v = body.linvel();
body.setLinvel({ x: 3, y: v.y, z: 0 }, true);
```

Preserving the vertical component here allows gravity and jumping to continue affecting Y. The correct policy depends on the interaction: a top-down arcade object may intentionally control all components, while a grounded character needs a more nuanced controller.

### 10. Collision groups and filtering

Not every collider should interact with every other collider. Collision groups can prevent projectiles from colliding with their owner, separate trigger volumes from physical geometry, or reduce irrelevant pair checks. Establish group conventions in one module and document them. Bit-mask filtering is powerful but easy to get wrong because membership and filter masks work together.

### 11. Collision events and contact events

Collision events tell the application that colliders began or stopped intersecting. Contact-force events can provide force-related information where configured. Events are useful for sounds, score updates, particles, and gameplay triggers, but the physics callback should not become a giant application controller.

Use a Rapier event queue when configured for collision events:

```js
const eventQueue = new RAPIER.EventQueue(true);

// Mark relevant collider descriptions with active events before creation.
// Example: colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

world.step(eventQueue);

eventQueue.drainCollisionEvents((handle1, handle2, started) => {
  if (started) {
    // Resolve handles to app records and trigger a lightweight effect.
  }
});
```

Keep handle lookup efficient. Do not create large DOM trees or load assets inside a collision event. Queue a small application event and process presentation effects in the normal update path.

### 12. Sensors and triggers

A sensor detects overlap without producing ordinary physical collision response. Use sensors for pickups, checkpoints, proximity zones, and interaction volumes. A sensor still needs lifecycle management and filtering. Trigger logic should be idempotent: a pickup should not award points repeatedly because the overlap remains active for several frames.

### 13. Sleeping and wake-up behavior

Sleeping lets the engine avoid spending work on bodies that are not moving meaningfully. This is useful for piles of objects and scenes with many props. Do not disable sleeping globally without profiling evidence. When applying impulses, forces, or changing relevant properties, wake the body if the intended behavior requires motion.

### 14. Shape choice and collider simplification

Primitive colliders are usually cheaper and more stable than detailed triangle meshes. Use cuboids, balls, capsules, cylinders, and convex hulls where they approximate the gameplay shape. Detailed render geometry does not require detailed collision geometry. For static environment geometry, a triangle mesh can be appropriate, but dynamic triangle-mesh colliders are usually not the first choice.

### 15. Units and scale

Choose a world scale and keep it consistent. A useful default is roughly one world unit per meter, with gravity near 9.81 units per second squared. Extreme scale mismatches can produce awkward tuning and poor numerical behavior. Do not import a model at a scale of 0.001 and then compensate by making gravity enormous without a clear reason.

### 16. Rotation and quaternions

Rapier exposes rotation as a quaternion. Three.js meshes can accept that quaternion directly. Avoid converting through Euler angles every frame; Euler conversion adds work and can introduce order-related confusion.

```js
const rotation = body.rotation();
mesh.quaternion.set(
  rotation.x,
  rotation.y,
  rotation.z,
  rotation.w
);
```

When creating a body with an initial rotation, use the descriptor's supported rotation setter and keep the collider's local offset aligned with the visual model's origin.

### 17. Ray casting and shape queries

Ray casts support selection, line-of-sight checks, ground checks, and aiming. They are queries against physics geometry, not necessarily against the exact rendered surface. Use them when gameplay needs collision-aware results; use Three.js raycasting when the goal is selecting a visual object or UI-like mesh.

A ray query should have a finite maximum distance and an explicit filter policy. Avoid repeatedly casting dozens of rays for every object if a simpler controller or shape query is sufficient.

### 18. Joints and constraints

Joints connect bodies and constrain relative movement. They support mechanical assemblies, swinging objects, ragdoll-like structures, and simple articulated interactions. Joint setup is a separate design problem: anchor frames, axes, limits, and body mass distribution all affect behavior. Start with a two-body test before building a complex chain.

### 19. Interpolation for smooth rendering

Fixed-step physics can run at a different cadence from rendering. Interpolating between previous and current simulation transforms can reduce visible judder. Store previous and current transforms for each body and render a blend based on the remaining accumulator fraction. Do not feed interpolated values back into physics; interpolation belongs to presentation only.

### 20. Reset and deterministic replay boundaries

A reset should restore the intended initial conditions: transforms, velocities, angular velocities, sleep state, and any app-side score or trigger state. Recreating the whole world is sometimes simpler for a small scene, while a large scene may reset bodies in place. Do not promise deterministic replay across all environments unless the exact engine version, stepping policy, input sequence, and platform behavior have been validated.

## Integration Architecture

A maintainable scene divides responsibility into four layers:

1. **World service:** owns Rapier initialization, world creation, fixed-step advancement, event queue, and shutdown.
2. **Body registry:** maps physics handles to application records, render meshes, labels, and gameplay metadata.
3. **Input adapter:** translates keyboard, pointer, touch, or gamepad actions into impulses, forces, or kinematic targets.
4. **Presentation layer:** synchronizes meshes, renders particles, updates accessible status, and exposes reset/pause controls.

A useful record shape is explicit:

```js
const record = {
  body,
  collider,
  mesh,
  kind: "crate",
  active: true,
};
```

For a larger project, keep records in maps keyed by Rapier handles. When a body is removed, remove the associated collider and mesh according to ownership rules, release GPU resources when they are no longer shared, and delete all registry entries.

## Setup Pattern: One Async Bootstrap

```js
import * as RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";

export async function createPhysicsScene(container) {
  await RAPIER.init();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    55,
    container.clientWidth / container.clientHeight,
    0.1,
    200
  );
  camera.position.set(7, 6, 10);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
  const records = new Map();

  return { RAPIER, THREE, scene, camera, renderer, world, records };
}
```

This function deliberately returns owned resources rather than hiding them in module globals. A route can create one scene instance, start its loop, and dispose it when leaving the route.

## Pattern 1: Minimal Dynamic Body and Fixed Floor

Use this for the smallest complete physics scene. A fixed floor prevents the demo from becoming a pile of falling bodies outside the camera view.

```js
const floorBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0)
);
world.createCollider(
  RAPIER.ColliderDesc.cuboid(10, 0.5, 10),
  floorBody
);

const cubeBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 4, 0)
);
world.createCollider(
  RAPIER.ColliderDesc.cuboid(0.5, 0.5, 0.5),
  cubeBody
);
```

The floor top is at Y=0 because its center is -0.5 and its half-height is 0.5. Reason about collider dimensions and body translations together rather than guessing from the mesh.

## Pattern 2: Central Fixed-Step Simulation Loop

One owner advances the world. Rendering may happen each animation frame, but physics advances in bounded fixed increments.

```js
const STEP = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;
let previous = performance.now();
let accumulator = 0;
let rafId = 0;
let running = true;

function tick(now) {
  if (!running) return;

  const frameSeconds = Math.min(
    Math.max((now - previous) / 1000, 0),
    MAX_FRAME_SECONDS
  );
  previous = now;
  accumulator += frameSeconds;

  while (accumulator >= STEP) {
    world.timestep = STEP;
    world.step();
    accumulator -= STEP;
  }

  syncAllBodies();
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(tick);
}

rafId = requestAnimationFrame(tick);
```

This pattern avoids tying simulation speed directly to the display refresh rate. Add a maximum number of physics steps per rendered frame if profiling shows catch-up bursts can become expensive.

## Pattern 3: Body Registry and Mesh Synchronization

A registry makes lifecycle and per-frame updates explicit.

```js
const records = new Map();

function registerBody(body, mesh, metadata = {}) {
  const handle = body.handle;
  records.set(handle, { body, mesh, ...metadata });
  scene.add(mesh);
  return handle;
}

function syncAllBodies() {
  for (const { body, mesh } of records.values()) {
    const p = body.translation();
    const q = body.rotation();

    mesh.position.set(p.x, p.y, p.z);
    mesh.quaternion.set(q.x, q.y, q.z, q.w);
  }
}
```

For production code, ensure that each record has a unique key and that removal deletes the record before a later frame can attempt to read a removed body. If interpolation is implemented, extend the record with previous and current transforms.

## Pattern 4: Input as an Impulse, Not a Teleport

```js
function launchBody(body, direction, strength) {
  body.applyImpulse({
    x: direction.x * strength,
    y: direction.y * strength,
    z: direction.z * strength,
  }, true);
}
```

The input handler decides intent and requests a physics action. It does not assign a new mesh position. This keeps the body, collider, and rendered object in agreement and allows collisions to participate naturally.

## Pattern 5: Kinematic Platform Motion

Kinematic bodies are useful for moving platforms whose path is authored by application code.

```js
const platform = world.createRigidBody(
  RAPIER.RigidBodyDesc.kinematicPositionBased()
    .setTranslation(0, 1, 0)
);

world.createCollider(
  RAPIER.ColliderDesc.cuboid(2, 0.2, 2),
  platform
);

function movePlatformTo(x, y, z) {
  platform.setNextKinematicTranslation({ x, y, z });
}
```

Set the next target before the relevant simulation step. Do not set a kinematic target after stepping and expect it to affect the step that has already completed.

## Pattern 6: Collision Event Routing

```js
const eventQueue = new RAPIER.EventQueue(true);
const pendingEffects = [];

function stepWorld() {
  world.timestep = 1 / 60;
  world.step(eventQueue);

  eventQueue.drainCollisionEvents((h1, h2, started) => {
    if (!started) return;
    pendingEffects.push({ type: "collision-start", h1, h2 });
  });
}

function processEffects() {
  for (const effect of pendingEffects.splice(0)) {
    // Resolve app records and update sound, particles, score, or UI.
  }
}
```

The event handler stays small. The presentation system owns expensive work. If event ordering matters, define it and test it rather than relying on incidental callback order.

## Pattern 7: Sensor-Based Pickup

```js
const pickupDesc = RAPIER.ColliderDesc.ball(0.35)
  .setSensor(true)
  .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

const pickupCollider = world.createCollider(pickupDesc, fixedBody);
const collected = new Set();

function onSensorOverlap(sensorHandle, otherHandle) {
  if (collected.has(sensorHandle)) return;
  collected.add(sensorHandle);
  // Queue a pickup event; remove or disable the pickup through the world owner.
}
```

This sketch illustrates the data flow, not a complete handle-pair classification routine. In real code, identify which handle is the sensor, verify the other collider belongs to an eligible actor, and handle stop events and removal cleanly.

## Pattern 8: Ray Cast for a Ground Check

```js
const ray = new RAPIER.Ray(
  { x: position.x, y: position.y, z: position.z },
  { x: 0, y: -1, z: 0 }
);

const hit = world.castRay(ray, 1.2, true);
const grounded = hit !== null;
```

Use a query filter where required to ignore the character's own collider or irrelevant collision groups. A ray origin inside the character's own shape can otherwise create confusing results. For robust character movement, prefer a dedicated character-controller strategy when it fits the project.

## Pattern 9: Reset a Dynamic Body

```js
function resetBody(body, initial) {
  body.setTranslation(initial.position, true);
  body.setRotation(initial.rotation, true);
  body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  body.wakeUp();
}
```

Keep a snapshot of the initial state in the application record. Reset trigger state and scores separately; resetting a body alone does not reset all gameplay logic.

## Pattern 10: Responsive Renderer and Physics Independence

```js
function resize(width, height) {
  const safeHeight = Math.max(1, height);
  camera.aspect = width / safeHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(width, safeHeight, false);
}
```

Renderer resizing should not change the physics timestep, gravity, or collider scale. The viewport is presentation state. If device pixel ratio is capped for performance, treat that as a rendering quality decision rather than a physics adjustment.

## Pattern 11: Body Removal and Resource Ownership

```js
function removeRecord(handle) {
  const record = records.get(handle);
  if (!record) return;

  records.delete(handle);
  world.removeRigidBody(record.body);
  scene.remove(record.mesh);

  record.mesh.geometry?.dispose();

  const material = record.mesh.material;
  if (Array.isArray(material)) {
    for (const item of material) item.dispose();
  } else {
    material?.dispose();
  }
}
```

Only dispose geometry and material if this record owns them. Shared geometries or materials should be reference-counted or managed by a shared asset cache. Rapier removes colliders attached to a body as part of the body's lifecycle; do not also attempt to remove the same collider independently unless your ownership flow calls for it.

## Pattern 12: Pause and Resume Without Catch-Up Explosion

```js
let paused = false;

function setPaused(next) {
  paused = next;
  previous = performance.now();
  accumulator = 0;
}

function tick(now) {
  if (!running) return;

  if (!paused) {
    const elapsed = Math.min((now - previous) / 1000, 0.1);
    accumulator += elapsed;
    while (accumulator >= STEP) {
      world.timestep = STEP;
      world.step();
      accumulator -= STEP;
    }
  }

  previous = now;
  syncAllBodies();
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(tick);
}
```

Reset the clock on pause and resume so a hidden tab or long pause does not produce a burst of simulation steps. A visible pause control should also announce its state to assistive technology.

## Pattern 13: Interpolation for Visual Smoothness

Maintain previous and current simulation snapshots for each registered body. After the fixed-step loop, compute `alpha = accumulator / STEP` and blend positions and quaternions for rendering only. For quaternions, use spherical interpolation where available. Never write the blended render transform back to the Rapier body.

## Pattern 14: Debugging Collision Shapes

A physics debug renderer can show colliders, axes, and contacts while the scene runs. Treat debug geometry as a development tool: toggle it, avoid shipping verbose debug draw in production, and make sure it is disposed. If a body appears to float or pass through a surface, inspect collider dimensions and offsets before changing gravity or solver parameters.

## Pattern 15: Lightweight Collision Feedback

When a collision begins, record a small effect request with the two handles and optional intensity metadata. In the presentation phase, resolve it to a short sound, subtle screen-space response, or particle burst. Rate-limit effects and avoid triggering loud or flashing feedback for every contact in a pile.

## Pattern 16: Fixed-World Ownership in Component Frameworks

A component should not create a new global world on every render. Create the world in an effect or scene factory, store it in a stable reference, and dispose it during cleanup. Child components can register and unregister bodies through a context or service. This prevents duplicate loops and orphaned WebAssembly-backed simulation objects during hot reloads or route changes.

## Pattern 17: Separate Simulation and UI State

Keep body handles, collider state, and velocities in the physics layer. Keep selected object, visible help, score, and accessible status messages in the application layer. UI frameworks should not re-render an entire scene at 60 Hz just because one body moved; synchronize render objects directly and update UI only when meaningful state changes.

## Pattern 18: Controlled Object Spawning

Before creating a body, enforce a maximum active count and validate the requested position. Avoid spawning a new dynamic body inside another body or below the floor. Use a clear spawn function that creates the descriptor, body, collider, visual mesh, registry record, and cleanup metadata as one transaction. If any creation step fails, roll back the resources already created.

## Mental Models

### 1. The physics world is the authority

For dynamic bodies, Rapier owns simulated position, rotation, velocity, and contact response. The mesh is a view of those values. This model prevents a common bug in which the render mesh moves but the collider stays behind.

### 2. A collider is a gameplay approximation

A collider is not required to trace every visible vertex. Choose a shape that supports the intended interaction. The best collider is often the simplest shape that feels correct to the player and remains stable under contact.

### 3. Time is input data

A physics step consumes a timestep. Variable render timing should not silently alter how much simulation occurs. Treat the accumulator as a buffer that translates irregular browser time into regular simulation steps.

### 4. Input expresses intent, physics determines outcome

A click means “apply an impulse,” “move this kinematic platform,” or “request a reset.” It should not necessarily mean “put the mesh here.” The engine should resolve contact and motion after the action is requested.

### 5. Handles are identities, not presentation labels

Rapier handles identify engine objects. They are useful keys, but they are not user-facing names and should not be assumed to remain meaningful after removal. Maintain explicit application records and delete them when bodies are removed.

### 6. Events should be messages

Collision callbacks are best treated as small messages from the simulation. Route them to a presentation or gameplay queue rather than performing unrelated work directly inside the callback.

### 7. Fixed timestep does not mean unlimited catch-up

A fixed timestep improves stability, but attempting to simulate every missed second after a background pause can make the page unresponsive. Clamp elapsed time and bound catch-up work according to the product's needs.

### 8. Physics quality is a budget

Bodies, colliders, contact pairs, queries, events, and solver work all consume time. Use profiling to spend the budget on interactions users can notice. More bodies and more detailed collision shapes are not automatically better.

### 9. Ownership determines disposal

A body registry, render mesh, geometry, material, event queue, renderer, and animation frame each have a lifecycle. If ownership is ambiguous, leaks and double-disposal bugs become likely. Document which module creates and destroys each resource.

### 10. Visual smoothness and simulation correctness are separate

A fixed-step simulation can be correct while its render transform looks jittery. Interpolation can improve presentation without altering physics state. Diagnose jitter by checking step timing, synchronization, and camera motion before changing the physics parameters.

### 11. Scale is a contract

Gravity, body dimensions, movement speeds, and force magnitudes only make sense together. Pick a unit convention and tune the whole scene within it. Avoid fixing one scale error by distorting several unrelated physical constants.

### 12. Accessibility is a second control surface

The canvas may be the primary visual experience, but controls and status should also exist in semantic HTML. Keyboard controls, buttons, readable instructions, and reduced-motion options let more people operate the experience and make it easier to test.

## Gotchas

1. **Initialization is asynchronous.** Do not create a world before `await RAPIER.init()` has completed.
2. **Cuboid dimensions are half-extents.** A half-extent of `0.5` gives a full width of `1`.
3. **Dynamic transform writes are teleports.** Use forces, impulses, or velocity changes for ordinary movement.
4. **Fixed-step loops need a catch-up policy.** A tab can resume after a long pause.
5. **Events must be enabled where needed.** Configure active events on the relevant collider descriptors.
6. **Sensor overlaps are not physical contacts.** A sensor should trigger gameplay without being treated as a solid wall.
7. **A body and mesh can drift apart.** Synchronize after stepping and use a stable registry.
8. **Shared GPU resources must not be disposed twice.** Make ownership explicit.
9. **Imported model origins may not match colliders.** Align visual pivots and collision shapes intentionally.
10. **A ray can hit the querying actor.** Use filters and appropriate ray origins.
11. **Sleeping bodies may not react as expected if not awakened.** Request wake-up for actions that should restart motion.
12. **Renderer resize is not physics resize.** Do not change collider sizes just because the canvas changed.
13. **High restitution can destabilize stacks.** Tune bounce and friction with the actual object mass and scene scale.
14. **A collision callback is not a good place to create complex UI.** Queue effects and process them in a dedicated layer.
15. **A body can be removed while its app record remains.** Make removal atomic across physics and rendering.
16. **Kinematic targets are step-sensitive.** Set them before the intended world step.
17. **The visual mesh can be more detailed than the collider.** That is normal and often desirable.
18. **Do not assume deterministic results across versions and hardware.** Test the exact configuration you ship.
19. **Too many queries can be more expensive than the simulation itself.** Profile query frequency and filters.
20. **A pause button should reset the frame clock.** Otherwise resuming can trigger a catch-up burst.

## Common Mistakes and Corrections

| Mistake | Why it fails | Better approach |
|---|---|---|
| Creating the world before initialization resolves | The WASM module may not be ready | Await `RAPIER.init()` in a single bootstrap |
| Using a mesh as if it were a collider | Render geometry does not automatically participate in physics | Create and attach a Rapier collider |
| Treating cuboid values as full dimensions | Collider becomes twice the expected size | Supply half-extents |
| Applying gravity manually to each mesh | Physics and visuals diverge | Let the world apply gravity to dynamic bodies |
| Moving a dynamic body by changing mesh position | Collider remains in the old position | Apply impulses or update the body through a deliberate teleport API |
| Stepping once per render frame with variable delta | Simulation behavior depends on refresh rate | Use a fixed-step accumulator |
| Letting the accumulator grow without limit | Catch-up work can freeze the page | Clamp elapsed time and bound steps |
| Running multiple animation loops | Physics advances too quickly and CPU use rises | Give one owner one loop |
| Forgetting to synchronize quaternion | Mesh rotation differs from collision orientation | Copy the body's quaternion after stepping |
| Adding a collider with wrong half-extents | Objects float, sink, or clip | Verify body center and collider extents |
| Using a dynamic body for a stationary floor | Unnecessary simulation work and unstable setup | Use a fixed body |
| Using a fixed body for a moving platform | Platform cannot follow normal authored motion | Use a kinematic body |
| Applying continuous force for a one-shot jump | Jump height varies with frame and duration | Use a calibrated impulse |
| Overwriting all velocity components | Natural gravity or contact response is lost | Preserve components not controlled by the mechanic |
| Forgetting active collision events | Event queue never receives the expected event | Configure collider active events |
| Treating sensor overlap as a solid collision | Trigger behavior becomes confusing | Use sensor semantics and explicit overlap state |
| Leaving stale registry records | Later frames access removed bodies | Delete registry entries during removal |
| Disposing shared material per object | Other meshes lose their material | Use ownership or reference counting |
| Creating bodies inside another collider | Immediate explosive separation or tunneling | Validate spawn points or use shape queries |
| Using very detailed dynamic triangle meshes | Performance and stability may suffer | Prefer primitives or convex shapes |
| Ignoring sleeping behavior | Bodies may appear unresponsive after changes | Wake bodies when applying actions |
| Performing DOM work inside collision callbacks | Frame spikes and tangled code | Queue small events for the UI layer |
| Using Euler conversions every frame | Extra work and rotation-order confusion | Copy quaternions directly |
| Failing to reset angular velocity | Reset object keeps spinning | Reset linear and angular velocity |
| Changing physics values on resize | Responsive layout changes gameplay | Keep viewport and world parameters separate |
| Assuming event order is a gameplay contract | Edge cases become hard to reproduce | Define and test event ordering |
| Skipping cleanup on route changes | Loops, listeners, and GPU resources leak | Provide an explicit `dispose()` function |
| Promising universal determinism | Different versions and platforms can differ | State and test the supported reproducibility boundary |
| Using ray casts without filters | Self-hits and irrelevant hits occur | Filter collision groups and exclude the actor |
| Spawning unlimited bodies | CPU, memory, and solver costs grow indefinitely | Cap active objects and provide cleanup |

## Semantic HTML and Accessibility

The canvas is not a complete interface. Put meaningful controls and instructions in HTML around it. This improves keyboard access, screen-reader understanding, automated testing, and usability when WebGL is unavailable.

### Semantic HTML example

```html
<section aria-labelledby="physics-title">
  <h1 id="physics-title">3D Physics Playground</h1>
  <p id="physics-help">
    Select an object, then use the controls to apply an impulse or reset it.
  </p>

  <div class="physics-toolbar" role="group" aria-label="Physics controls">
    <button type="button" id="launch-button">Launch selected object</button>
    <button type="button" id="reset-button">Reset scene</button>
    <button type="button" id="pause-button" aria-pressed="false">
      Pause simulation
    </button>
  </div>

  <div id="physics-canvas" aria-describedby="physics-help">
    <canvas aria-label="Interactive 3D physics scene"></canvas>
  </div>

  <p id="physics-status" role="status" aria-live="polite">
    Simulation ready.
  </p>
</section>
```

### Accessibility checklist

1. Provide a visible heading and concise instructions before the canvas.
2. Use real `<button>` elements for actions rather than clickable `<div>` elements.
3. Ensure every control has a clear accessible name.
4. Support keyboard operation for launch, reset, pause, and selection.
5. Do not require precise pointer dragging for every essential action.
6. Make focus indicators visible against the page background.
7. Keep text contrast sufficient in both light and dark themes.
8. Use `role="status"` or a polite live region for meaningful state changes, not every frame.
9. Avoid announcing position updates at animation frequency; announce only user-relevant events.
10. Respect `prefers-reduced-motion` by offering pause, reduced effects, or a less intense presentation.
11. Avoid relying on color alone to identify selected, active, or colliding objects.
12. Provide a non-WebGL fallback message and working controls where practical.
13. Keep controls usable at narrow viewport widths and with touch input.
14. Ensure the page can be zoomed without clipping the controls.
15. Avoid flashing collision effects; provide a setting to reduce particles, screen shake, or intense visual feedback.
16. Preserve logical focus order when panels or dialogs open.
17. Explain keyboard shortcuts in visible help text.
18. Use captions or text labels when sound is important to understand an event.
19. Keep the canvas from trapping keyboard focus without a clear exit path.
20. Test with keyboard only, screen-reader navigation, zoom, reduced-motion preference, and touch.

### Keyboard control example

```js
const pressed = new Set();

function onKeyDown(event) {
  if (event.repeat) return;

  if (event.code === "Space") {
    event.preventDefault();
    selectedBody?.applyImpulse({ x: 0, y: 4, z: 0 }, true);
  }

  if (event.code === "KeyR") {
    resetScene();
  }

  if (event.code === "KeyP") {
    setPaused(!paused);
    pauseButton.setAttribute("aria-pressed", String(paused));
  }

  pressed.add(event.code);
}

function onKeyUp(event) {
  pressed.delete(event.code);
}

window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
```

Only prevent default behavior for shortcuts the application actually owns. Avoid global keyboard handlers that interfere with text inputs, browser navigation, or assistive technology. In a complete implementation, ignore shortcut handling when focus is inside editable controls.

## Performance Notes

1. **Prefer simple collision shapes.** A primitive collider is usually cheaper to reason about than a highly detailed mesh.
2. **Cap active body count.** Recycle objects or remove them when they leave the playable region.
3. **Use sleeping.** Static piles should not consume the same work as constantly moving bodies.
4. **Use a fixed timestep and bounded catch-up.** Stability and predictable CPU use are more important than replaying every background interval.
5. **Profile collision queries.** Ground checks and raycasts can dominate a poorly designed frame.
6. **Avoid unnecessary event generation.** Enable collision events only on colliders that need them.
7. **Keep event handlers lightweight.** Defer particles, sound creation, and DOM updates.
8. **Batch synchronization.** Iterate over registered body/mesh pairs once instead of performing scene searches.
9. **Reuse render resources.** Shared geometries and materials reduce GPU allocation, but require explicit ownership.
10. **Limit device pixel ratio.** High-resolution rendering can cost more than the physics step on mobile devices.
11. **Avoid excessive body creation.** Creation and destruction can create garbage and solver churn.
12. **Throttle visual effects.** Many simultaneous particles or shadows can become the actual bottleneck.
13. **Use collision groups.** Filter irrelevant pairs and simplify event interpretation.
14. **Keep debug visualization development-only.** It can add geometry and draw calls.
15. **Watch long tasks.** A simulation that catches up for too long can delay input and accessible status updates.
16. **Do not optimize by intuition alone.** Record frame time, step count, active body count, and query count before changing architecture.

## Testing Strategy

### Unit-level checks

- Confirm that initialization completes before world construction.
- Verify that each spawned record contains the expected body, collider, and mesh references.
- Test reset behavior for translation, rotation, linear velocity, and angular velocity.
- Test that removal deletes the body and its registry record.
- Confirm collision-event handling is idempotent for one-shot triggers.
- Verify keyboard handlers ignore editable inputs and clean up correctly.

### Integration checks

- Drop a body onto a fixed floor and confirm it settles.
- Test two bodies colliding at expected speeds and masses.
- Pause for several seconds and resume without a large catch-up burst.
- Resize the viewport and confirm physics dimensions remain unchanged.
- Spawn at the configured limit and verify the next spawn is rejected or recycled.
- Navigate away from the scene and confirm animation frames and event listeners stop.
- Test on a low-powered mobile device with the expected body count.

### Observability

In development, expose optional counters for active bodies, physics steps per render frame, elapsed step time, event count, and number of registered render objects. Keep diagnostics behind a development flag. Do not log every body's transform every frame; log transitions and sampled summaries.

## Teardown and Resource Lifecycle

A scene should have one explicit disposal entry point. It must stop the animation loop, detach global listeners, remove DOM nodes owned by the scene, dispose renderer resources, and release physics resources according to the version's API.

### Teardown requirements

1. Set a `running` flag to false before cleanup.
2. Cancel the current animation frame.
3. Remove keyboard, pointer, resize, and visibility listeners.
4. Remove or clear registered bodies and application records.
5. Dispose owned Three.js geometries, materials, textures, and renderer.
6. Remove the canvas from its container if the scene created it.
7. Drop references to the world and event queue after no callbacks can use them.
8. Clear pending application events and time accumulators.
9. Ensure cleanup is safe if called twice.
10. In component frameworks, make setup and cleanup symmetrical so development remounts do not duplicate resources.

```js
function disposeScene() {
  if (!running) return;
  running = false;

  cancelAnimationFrame(rafId);
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  window.removeEventListener("resize", onResize);

  for (const [handle, record] of records) {
    world.removeRigidBody(record.body);
    scene.remove(record.mesh);
    // Dispose only resources owned by this record.
  }
  records.clear();

  renderer.dispose();
  renderer.domElement.remove();
  accumulator = 0;
  previous = 0;
}
```

This is a lifecycle template, not a substitute for project-specific ownership decisions. If the world exposes a final free/dispose method in the version being used, invoke it after bodies and callbacks are no longer in use. Consult the installed package's API when finalizing world destruction, because lifecycle APIs can vary by release.

## Quick Reference

| Need | Preferred approach | Avoid |
|---|---|---|
| Initialize Rapier | `await RAPIER.init()` once | Initialization inside every component |
| Create world | `new RAPIER.World(gravity)` | Multiple uncoordinated worlds |
| Stationary floor | Fixed rigid body + collider | Dynamic floor |
| Falling object | Dynamic body + collider | Mesh-only gravity |
| Moving authored platform | Kinematic body target | Repositioning a dynamic mesh |
| One-time launch | `applyImpulse()` | Force applied for an arbitrary duration |
| Sustained push | `applyForce()` | Repeated teleports |
| Read position | `body.translation()` | Reading mesh position as physics truth |
| Read rotation | `body.rotation()` | Euler conversions every frame |
| Smooth physics | Fixed timestep accumulator | One variable step per render frame |
| Collision events | Active events + event queue | Assuming events are enabled by default |
| Pickup overlap | Sensor collider | Treating sensor as a solid wall |
| Ground query | Ray/shape query with filters | Unfiltered self-hitting ray |
| Reset body | Restore transform and velocities | Restoring position only |
| Remove object | Remove body, record, mesh, owned resources | Leaving stale registry data |
| Pause | Stop stepping and reset clock | Accumulating time while paused |
| Resize | Update camera and renderer | Changing world scale |
| Reduce CPU | Simple shapes, sleeping, filtering | Detailed dynamic triangle meshes everywhere |
| Accessible controls | Semantic buttons and status | Canvas-only interaction |
| Debug shape mismatch | Visualize colliders | Randomly changing gravity |
| Shared material | Central ownership/reference count | Disposing it with every mesh |
| Spawn safety | Validate positions and body count | Unlimited overlapping spawns |
| Route cleanup | Stop loop and listeners | Leaving callbacks active |
| Mobile performance | Cap DPR and body count | Assuming desktop performance transfers |
| Determinism | Define tested boundaries | Promise universal cross-platform replay |

## Definition of Done

- [ ] Rapier is initialized exactly once per owned scene service.
- [ ] World gravity and coordinate conventions are documented.
- [ ] Every dynamic object has a deliberate collider and body type.
- [ ] Collider dimensions and local offsets have been visually verified.
- [ ] Physics advances using a fixed timestep or an explicitly justified alternative.
- [ ] Elapsed time is clamped after stalls or tab suspension.
- [ ] The application has one authoritative simulation loop.
- [ ] Dynamic meshes synchronize from body translation and rotation.
- [ ] Input uses forces, impulses, velocity, or kinematic targets intentionally.
- [ ] Collision events are enabled only where needed and routed through small handlers.
- [ ] Sensors are distinguished from physical colliders.
- [ ] Reset restores both transforms and velocities.
- [ ] Removal clears physics, render, and application-registry state.
- [ ] Shared GPU resources have clear ownership.
- [ ] Keyboard controls work and do not break text inputs.
- [ ] Controls have semantic labels and visible focus states.
- [ ] Meaningful status is announced without frame-by-frame announcements.
- [ ] Reduced-motion and WebGL fallback behavior are considered.
- [ ] Performance has been measured at the expected active-body count.
- [ ] Teardown stops animation, listeners, and owned resources.
- [ ] The scene has been tested after pause/resume and route remount.
- [ ] Debug helpers can be disabled in production.
- [ ] The implementation documents what determinism guarantees it does and does not make.

## Build Challenge: Physics Interaction Lab

Build a small 3D physics playground that demonstrates a controllable dynamic object, fixed obstacles, collision feedback, and a reliable lifecycle. Meet all ten requirements:

1. **World bootstrap:** Initialize Rapier asynchronously and create a world with a documented gravity and unit scale.
2. **Mixed body types:** Include at least one fixed platform, three dynamic objects, and one kinematic moving platform.
3. **Visible mapping:** Give each simulated object a render mesh and keep body/mesh transforms synchronized through a registry.
4. **Controlled input:** Add keyboard and pointer-accessible controls that launch or nudge the selected object using impulses.
5. **Fixed-step timing:** Advance physics at a fixed timestep, clamp long frame gaps, and handle pause/resume without a catch-up burst.
6. **Collision events:** Use an event queue to trigger a lightweight effect when two relevant colliders begin contact.
7. **Sensor interaction:** Add one sensor pickup or goal zone and make its activation idempotent.
8. **Reset and limits:** Provide a reset button that restores transforms and velocities, and cap the number of spawned objects.
9. **Accessibility:** Add semantic instructions, named buttons, keyboard support, focus indicators, reduced-motion consideration, and a polite status region.
10. **Lifecycle and verification:** Implement a safe `dispose()` path, test repeated mount/unmount, and record body count and average physics-step cost during a short test.

### Suggested project structure

```text
physics-interaction-lab/
├── index.html
├── src/
│   ├── main.js
│   ├── physics/
│   │   ├── create-world.js
│   │   ├── fixed-stepper.js
│   │   ├── body-registry.js
│   │   └── collision-events.js
│   ├── input/
│   │   └── controls.js
│   ├── render/
│   │   ├── sync-bodies.js
│   │   └── effects.js
│   └── ui/
│       ├── controls.js
│       └── status.js
└── README.md
```

### Acceptance tests

- A dynamic object falls and rests on the floor without passing through it.
- Applying an impulse changes the body velocity and the mesh follows the result.
- Pausing for five seconds does not create a catch-up explosion after resuming.
- A sensor activates once for one pickup, even if overlap persists.
- Reset stops both linear and angular motion and restores the initial transform.
- Removing a spawned object removes its body and render record.
- The app remains operable without a mouse.
- Resizing the browser changes the camera framing but not collider dimensions.
- After unmounting, no animation loop or global input listener remains.
- At the target body count, physics and rendering stay within the project's measured frame budget.

## Final Engineering Principles

Rapier is most useful when it is integrated as a simulation service rather than treated as a collection of convenience calls sprinkled through rendering code. The world owns physical truth; render objects display it; input expresses intent; events communicate outcomes; and the lifecycle owns creation and destruction.

Start with a simple floor and one body. Verify scale and collider dimensions. Add fixed-step timing before adding complexity. Then introduce input, events, sensors, queries, and kinematic bodies one at a time. Keep each behavior testable, keep the UI accessible outside the canvas, and measure performance with realistic object counts. A compact, well-owned physics scene is easier to tune and more reliable than a visually impressive scene whose simulation timing and resource lifecycle are unclear.
