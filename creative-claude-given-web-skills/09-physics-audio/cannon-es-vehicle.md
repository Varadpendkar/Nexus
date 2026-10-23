---
name: cannon-es-vehicle
layer: layer-09-physics-audio
description: Design a stable, controllable vehicle simulation with cannon-es, including wheel suspension, drivetrain forces, collision handling, input mapping, fixed-step updates, accessible controls, performance budgets, and reliable teardown.
---

# cannon-es-vehicle

## Goal

Build a browser-based vehicle interaction with cannon-es that is understandable, controllable, stable under variable frame rates, and maintainable as part of a larger web experience. This skill focuses on the physics model and the application architecture around it: rigid bodies, wheel contact, suspension, steering, braking, drivetrain behavior, input state, rendering synchronization, collision feedback, responsive lifecycle management, and accessibility.

The goal is not to recreate a complete commercial racing simulator. It is to construct a reliable vehicle prototype whose motion communicates weight, traction, steering, and contact with the environment without becoming unpredictable or expensive to run. A good implementation has a clear physics contract, repeatable tests, and a graceful fallback when 3D physics is unavailable or should be reduced.

## Why This Matters

A vehicle is a tightly coupled physical system. Steering changes the direction of travel, wheel contact influences traction, braking redistributes forces, suspension responds to terrain, and the chassis reacts to all of these forces. A demo can appear convincing for a few seconds while hiding serious defects: wheels may spin without applying useful force, the chassis may jitter because of unstable contact, the vehicle may flip under small inputs, or simulation behavior may change drastically on a slower device.

cannon-es provides a rigid-body physics world and a vehicle helper that can support raycast-wheel behavior. It does not automatically create a complete vehicle game. The developer must choose coordinate conventions, configure wheel connection points, apply engine and brake forces, update steering, synchronize visual transforms, and control how time advances. Treating these responsibilities as an integrated system is what separates a reliable prototype from a fragile code sample.

This matters in web interfaces because physics competes with rendering, input processing, DOM work, and other scripts on the main thread. A vehicle that works only on a high-end desktop is not production-ready. A vehicle that requires precise pointer steering but offers no keyboard alternative excludes users. A vehicle whose animation loop continues after route navigation leaks work. A vehicle that resets only its position but not its velocities can appear to reset and immediately launch itself off the track.

The core engineering principle is to separate **simulation state**, **visual representation**, **control intent**, and **application state**. The physics world owns rigid-body transforms and velocities. The renderer displays those transforms. The input layer turns keyboard, pointer, or gamepad input into normalized control intent. The application owns the current mode, instructions, score, reset behavior, and accessible status. These layers communicate through a narrow interface rather than reaching into one another's internals.

Use cannon-es when the interaction needs 3D rigid-body behavior and vehicle-like contact. For a purely decorative car animation, a CSS transform or authored animation may be simpler. For a sophisticated production racing simulator, evaluate whether a specialized vehicle model or engine is more appropriate before committing to a general-purpose rigid-body library.

## When to Use This Skill

Use this skill for:

- a small 3D driving demo embedded in a product page;
- a vehicle configurator with a controllable test area;
- a learning experience about steering, traction, or suspension;
- a simple arcade vehicle on a bounded track;
- a driving interaction used to explore a 3D scene;
- a physics prototype that needs believable chassis response;
- a small number of vehicles with predictable performance constraints.

Reconsider this approach when the scene needs highly realistic tire friction, deformable tires, advanced drivetrain simulation, a large traffic world, sophisticated multiplayer synchronization, or hundreds of active rigid bodies. A raycast vehicle helper is a useful starting point, not a substitute for a dedicated tire model or a full game engine.

## Core Concepts

### 1. World and Gravity

The physics world owns bodies, constraints, broadphase collision detection, contact materials, gravity, and stepping. Gravity is expressed in world units per second squared. If the chosen world uses meters, a familiar starting gravity magnitude is near 9.8 along the vertical axis, but the most important requirement is consistency: body dimensions, gravity, forces, and speeds must use a coherent scale.

Do not casually change the up axis after building the vehicle. Many vehicle examples assume Y is up, while rendering libraries and asset coordinate systems may use different conventions. Choose a convention, document it, and convert imported model coordinates at the boundary rather than scattering axis swaps through the code.

### 2. Rigid Bodies and Mass Distribution

The chassis is usually a dynamic rigid body with a box-like collision shape or a compound collision shape. Mass and center of mass influence how it accelerates, pitches, rolls, and responds to contact. A visually large car can use a simplified collision body, but the shape must approximate the important physical envelope. If the collision box is much wider or taller than the visible model, the car may appear to hit invisible obstacles.

Mass alone does not determine handling. Shape dimensions, center of mass, inertia, suspension, friction, and applied forces all affect behavior. Start with a conservative chassis and tune one variable at a time. If the vehicle tips too easily, inspect center of mass and force application points before arbitrarily increasing mass.

### 3. Raycast Vehicle Model

A raycast vehicle approximates wheels by casting rays from wheel connection points toward the ground and applying forces to the chassis. It avoids simulating each tire as a fully separate rigid body with complex joints. This is efficient and practical for small web simulations, but it has limitations: the wheel is not a full deformable tire, sidewall behavior is simplified, and the feel depends heavily on suspension and friction tuning.

The vehicle helper commonly exposes wheel configuration and operations for engine force, braking, and steering. Verify the installed cannon-es version's API and examples. Do not mix code written for a different fork or older package without checking method names and argument semantics.

### 4. Wheel Connection Points

Each wheel connection point is defined relative to the chassis body. Left/right and front/rear positions must be consistent with the chosen coordinate system. A common failure is to copy connection-point values from an example whose chassis length, height, or up-axis differs from the current model. The result may be wheels floating away from the body or intersecting the chassis.

Begin with four symmetric connection points. Confirm the front pair is actually at the front, the rear pair at the rear, and the left/right offsets match the visible track width. Inspect the scene with debug helpers before adjusting suspension or tire force values.

### 5. Suspension Rest Length, Stiffness, and Damping

Suspension determines how the chassis responds to wheel contact and uneven terrain. Rest length describes the neutral extension; stiffness resists displacement; damping reduces oscillation. Too little damping can create bouncing that persists long after landing. Too much damping can make the suspension feel rigid or prevent it from responding naturally.

Tune the suspension with the vehicle stationary on a flat plane first. Then test a small drop, a low bump, and a turn. Do not tune on a complicated obstacle course at the beginning because several failure sources become difficult to distinguish.

### 6. Steering

Steering changes the orientation of the front wheel directions in a raycast model. The input value should be normalized, usually in the range from -1 to 1, and mapped to a maximum steering angle. Avoid allowing a keyboard key to set steering once and leave it there after key release. Maintain explicit input state and recompute the control values every update.

At higher speeds, full steering can create unstable or arcade-like behavior. A simple prototype can reduce maximum steering angle as speed rises. This is not a universal physical law; it is a practical handling aid for a compact interaction. Document it as a design choice rather than hiding it in a magic multiplier.

### 7. Engine Force and Drivetrain

Engine force applies propulsion through selected wheels. Applying force to all four wheels produces a different feel from rear-wheel or front-wheel drive. The exact distribution should be deliberate. A common bug is to apply the same force every frame without accounting for whether the input is held, whether the vehicle is moving backward, or whether braking is active.

Use normalized throttle input and map it to a defined force range. Separate throttle from braking. If the vehicle is moving forward and the user presses reverse, decide whether the first response is braking before reverse torque is applied. For an arcade prototype, this can be a simple state rule rather than a detailed gearbox.

### 8. Braking

Brake force should be applied to the intended wheels and should have a clear maximum. Applying brake force without a coherent sign convention can accelerate a wheel or create inconsistent behavior. Test braking while moving forward, while reversing, and while stationary.

A handbrake can apply stronger braking to the rear wheels, but it should not be silently coupled to ordinary braking unless the design calls for that behavior. Brake input should have a predictable priority over throttle, and UI controls should make that priority clear.

### 9. Tire Friction and Grip

Wheel friction settings influence how strongly the wheel resists lateral and longitudinal slip in the vehicle helper. These parameters are often misunderstood as a single “grip” slider. Real tire behavior depends on load, speed, slip angle, surface, and tire construction. A simplified web prototype uses approximations, so tune by repeatable scenarios instead of claiming exact realism.

Use separate test cases for straight-line acceleration, steady turning, braking, and uneven ground. If the vehicle slides too much, first check the wheel configuration, contact surface, and speed; increasing friction indefinitely can hide other errors and create abrupt or unstable behavior.

### 10. Fixed-Step Simulation

Rigid-body physics benefits from controlled timestep updates. If the world advances using highly variable deltas, behavior may change across devices or produce instability after a long frame. Use a fixed-step accumulator or a well-tested stepping pattern that passes elapsed time while limiting catch-up work.

The renderer can run at display refresh rate while the physics advances at a fixed interval. Interpolation between the previous and current physics transforms can make motion appear smoother, but it adds complexity and must not change the authoritative physics state. Avoid an unbounded catch-up loop: after a slow frame, attempting to simulate every missed step can freeze the browser further.

### 11. Collision Shapes and Contact Materials

Collision shapes should be simpler than visual meshes. Use boxes, spheres, cylinders, or other supported primitive shapes where they approximate the interaction well. Complex triangle meshes can be more expensive and may have contact limitations depending on whether they are static or dynamic. A track surface should have collision geometry that is stable and appropriately scaled.

Contact materials can tune friction and restitution between material pairs. Do not assume the visual material's roughness or color affects physics. Rendering materials and physics contact materials are different systems. Name and configure them separately.

### 12. Rendering Synchronization

The physics body and visible model are separate objects. After each physics step, copy the body's position and quaternion to the model. Avoid applying a second independent animation transform that fights the physics transform. If the visual model's origin differs from the collision body's center, use a child transform or an explicit offset instead of corrupting the physics coordinates.

For smooth rendering, keep previous and current transforms if interpolation is needed. If no interpolation is used, a fixed-step simulation with a modest frame rate may still look acceptable for a compact demo. The right approach depends on the target device and visual demands.

### 13. Control State and Input Normalization

Keyboard, pointer, and gamepad inputs should produce one normalized control object, for example `{ throttle, brake, steer, handbrake }`. The physics update consumes that object. This makes controls testable and prevents keyboard-specific logic from spreading into wheel force code.

Track key-down and key-up explicitly. Clear held keys on window blur and on component teardown so a throttle key cannot remain stuck when the browser loses focus. Do not bind keyboard shortcuts that interfere with text fields or browser navigation without a clear interaction scope.

### 14. Reset and State Restoration

A reset is more than moving the chassis back to its spawn position. It should reset linear and angular velocity, orientation, forces, torques, wheel steering, brake force, engine force, control state, camera state if applicable, and application state such as elapsed time or score. If a vehicle is resting on a slope, decide whether reset places it at a known transform and lets gravity settle it, or uses a short stabilization period.

Store the spawn transform as immutable configuration. Do not attempt to infer it from the body's current transform after the user has driven away.

### 15. Camera Follow and View Framing

A camera that follows a vehicle can make a small scene easier to understand, but it must not become a second source of motion sickness. Smooth camera follow can interpolate position and target, while keeping a stable horizon and avoiding sudden snaps. If the camera follows every small physics jitter, the entire scene appears unstable.

Separate camera behavior from vehicle physics. Use a bounded follow offset, a modest smoothing factor, and a clear reset path. Respect reduced-motion preferences by using a more static camera or disabling camera shake.

### 16. Lifecycle and Resource Ownership

The world, renderer, input listeners, animation frame, resize observer, visibility listener, debug helpers, and audio or collision effects all need an owner. A route transition should stop simulation and rendering. A component should not leave a key listener on `window` after it unmounts.

Use a single `destroy()` method that is idempotent. It should cancel scheduled frames, remove listeners, disconnect observers, clear physics event handlers, and release references to world objects. If setup can fail partway through, use guarded initialization so partially created resources can still be disposed.

### 17. Accessibility and Non-Driving Alternatives

A vehicle interaction is often pointer- or keyboard-driven, but the rest of the page must remain usable without the 3D scene. Provide native controls for steering, throttle, braking, pause, and reset where these actions are important. If keyboard controls are supported, show the key bindings and ensure they do not hijack input while a user is typing in a form field.

Respect `prefers-reduced-motion`. This can mean disabling camera shake, reducing acceleration effects, using a stationary camera, or offering a non-interactive preview. It should not remove essential information or make the page impossible to use. A status region can announce state changes such as “Simulation paused” or “Vehicle reset,” but should not announce every physics step.

### 18. Debugging and Observability

A debug mode can render collision shapes, wheel rays, suspension lines, contact points, chassis axes, and wheel connection points. These overlays are often more valuable than changing random physics values. Keep debug drawing behind a development flag and avoid shipping expensive helpers when not needed.

Track basic metrics such as physics step duration, active body count, frame duration, and dropped/capped steps. For a small vehicle demo, simple counters and browser performance tools may be enough. Instrumentation should answer a specific question; do not build an elaborate telemetry system before identifying the bottleneck.

## Mental Models

1. **The vehicle is a coupled system.** Steering, grip, suspension, braking, and mass distribution interact. Tune in controlled stages rather than changing many values at once.
2. **The physics body is the source of truth for motion.** The visible model follows the body; it should not independently decide where the vehicle is.
3. **Control input is intent, not force.** The input layer reports normalized wishes. The vehicle controller translates those wishes into forces, braking, and steering.
4. **A fixed timestep is a stability contract.** The simulation should not depend on whether a display frame arrived after 8 ms or 40 ms.
5. **A raycast wheel is an approximation.** It can be effective and fast, but it does not behave like a fully simulated deformable tire.
6. **Collision geometry is a gameplay tool.** It should match the useful interaction envelope, not the exact polygon count of the rendered model.
7. **Reset means restoring the whole state.** Transform, velocity, wheel controls, camera, and application state must return together.
8. **The camera is not the car.** Camera smoothing should improve readability without feeding visual jitter back into vehicle control.
9. **Performance requires bounded work.** Limit catch-up steps, active objects, debug overlays, and collision side effects.
10. **Accessibility is a control pathway.** A 3D scene may be expressive, but essential actions also need semantic, understandable controls.
11. **Setup and teardown are paired operations.** Every listener, frame, observer, and engine subscription must have an inverse.
12. **A convincing prototype is repeatable.** The same input sequence should produce broadly comparable behavior under controlled timing and starting conditions.

## Recommended Architecture

Keep the simulation logic separate from rendering and input. A compact project can use modules or plain functions rather than a large class hierarchy, but each concern should have one clear owner.

- **World factory:** creates the physics world, gravity, track bodies, contact materials, and vehicle.
- **Vehicle controller:** maps normalized throttle, brake, steering, and handbrake inputs to wheel operations.
- **Input adapter:** listens for keyboard/pointer/gamepad input and produces normalized control state.
- **Renderer synchronizer:** copies body transforms to visual objects and optionally interpolates between physics states.
- **Camera controller:** follows the vehicle independently of the physics body.
- **Lifecycle owner:** manages animation frames, visibility, resizing, event subscriptions, and destruction.
- **Accessibility layer:** exposes semantic controls, visible instructions, pause/reset actions, and reduced-motion behavior.
- **Debug adapter:** displays collision shapes, wheel rays, and metrics only when enabled.

The architecture should expose a small API such as `start()`, `pause()`, `resume()`, `reset()`, `setControls()`, `resize()`, and `destroy()`. Avoid giving unrelated components direct access to mutable wheel objects or engine internals. A narrow API makes it easier to test the controller without rendering a full 3D scene.

## Implementation Pattern: Vehicle Setup Skeleton

The following example illustrates the main pieces of a cannon-es raycast vehicle. It is a starting point, not a complete game-ready vehicle. Verify the API against the installed cannon-es version, and pair it with a renderer such as Three.js that synchronizes visual transforms.

```js
import * as CANNON from "cannon-es";

export function createVehiclePhysics() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
  });

  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;
  world.defaultContactMaterial.friction = 0.4;

  const groundMaterial = new CANNON.Material("ground");
  const tireMaterial = new CANNON.Material("tire");
  world.addContactMaterial(new CANNON.ContactMaterial(
    groundMaterial,
    tireMaterial,
    { friction: 0.8, restitution: 0.0 }
  ));

  const ground = new CANNON.Body({
    mass: 0,
    material: groundMaterial,
    shape: new CANNON.Plane(),
  });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(ground);

  const chassisShape = new CANNON.Box(new CANNON.Vec3(0.9, 0.35, 1.8));
  const chassisBody = new CANNON.Body({
    mass: 800,
    material: tireMaterial,
    linearDamping: 0.02,
    angularDamping: 0.35,
    allowSleep: false,
  });
  chassisBody.addShape(chassisShape);
  chassisBody.position.set(0, 1.2, 0);
  world.addBody(chassisBody);

  const vehicle = new CANNON.RaycastVehicle({
    chassisBody,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });

  const wheelOptions = {
    radius: 0.38,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 30,
    suspensionRestLength: 0.32,
    frictionSlip: 4,
    dampingRelaxation: 2.3,
    dampingCompression: 4.4,
    maxSuspensionForce: 100000,
    rollInfluence: 0.01,
    axleLocal: new CANNON.Vec3(-1, 0, 0),
    maxSuspensionTravel: 0.25,
    customSlidingRotationalSpeed: -30,
    useCustomSlidingRotationalSpeed: true,
  };

  const wheelPositions = [
    new CANNON.Vec3(-0.78, 0, 1.25),
    new CANNON.Vec3(0.78, 0, 1.25),
    new CANNON.Vec3(-0.78, 0, -1.25),
    new CANNON.Vec3(0.78, 0, -1.25),
  ];

  for (const position of wheelPositions) {
    vehicle.addWheel({
      ...wheelOptions,
      chassisConnectionPointLocal: position,
    });
  }

  vehicle.addToWorld(world);

  return { world, ground, chassisBody, vehicle };
}
```

The numeric values are starting points, not universal constants. Chassis mass, wheelbase, track width, radius, suspension values, and friction all need to match the scale and desired feel. Validate wheel order and axis assumptions before connecting controls. If the imported model faces another direction, rotate the visual model or adapt the axis mapping consistently rather than patching steering signs in multiple places.

## Pattern 1 — Normalized Control State

**Use when:** input can come from keyboard, pointer buttons, gamepad, or touch controls.

Keep control state as a small normalized object. Input handlers update the intent; the vehicle controller consumes it during the simulation update. This avoids applying forces directly inside DOM event callbacks, where input timing can differ from the physics timestep.

```js
const controls = {
  throttle: 0,
  brake: 0,
  steer: 0,
  handbrake: 0,
};

function clampUnit(value) {
  return Math.max(-1, Math.min(1, value));
}

function setControls(next) {
  controls.throttle = clampUnit(next.throttle ?? 0);
  controls.brake = Math.max(0, Math.min(1, next.brake ?? 0));
  controls.steer = clampUnit(next.steer ?? 0);
  controls.handbrake = Math.max(0, Math.min(1, next.handbrake ?? 0));
}
```

**Design rules:** clamp all external input; distinguish reverse intent from brake intent; clear held controls on blur; and ensure pause forces all controls to neutral. Do not let UI event callbacks mutate the physics world in uncontrolled ways.

**Validation:** test key repeat, simultaneous steering and throttle, focus loss while accelerating, and pause while a key is held.

## Pattern 2 — Fixed-Step Accumulator With a Catch-Up Limit

**Use when:** the browser render loop and physics timestep need to remain stable under variable frame times.

Use an accumulator to collect elapsed time and advance the world in fixed increments. Limit the number of steps in one render frame so a slow frame does not trigger an endless catch-up spiral. When the limit is reached, drop excess accumulated time or reset it according to the simulation's product requirements.

```js
const FIXED_STEP = 1 / 60;
const MAX_STEPS_PER_FRAME = 4;
let accumulator = 0;
let lastTime = 0;

function tick(timeMs) {
  const now = timeMs / 1000;
  if (lastTime === 0) lastTime = now;

  const elapsed = Math.min(now - lastTime, 0.1);
  lastTime = now;
  accumulator += elapsed;

  let steps = 0;
  while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
    applyVehicleControls();
    world.step(FIXED_STEP);
    accumulator -= FIXED_STEP;
    steps += 1;
  }

  if (steps === MAX_STEPS_PER_FRAME) {
    accumulator = Math.min(accumulator, FIXED_STEP);
  }

  syncVisuals();
  frameId = requestAnimationFrame(tick);
}
```

**Design rules:** use one stepping owner; reset `lastTime` when resuming from a hidden tab; and profile the chosen step size. If interpolation is used, compute a blend from the remaining accumulator but do not overwrite the authoritative body state with interpolated values.

**Validation:** throttle the CPU, switch tabs, return to the page, and verify that the car does not teleport or accelerate because the simulation attempted to catch up.

## Pattern 3 — Apply Steering and Engine Force Consistently

**Use when:** normalized input needs to become wheel operations.

Separate the mapping from input to vehicle mechanics. Steering commonly applies to the front wheels, while engine force may apply to rear wheels or all wheels. Braking should have a clear priority over throttle.

```js
function applyVehicleControls(vehicle, controls, tuning) {
  const frontWheels = [0, 1];
  const rearWheels = [2, 3];

  const steering = controls.steer * tuning.maxSteering;
  for (const wheelIndex of frontWheels) {
    vehicle.setSteeringValue(steering, wheelIndex);
  }

  const engineForce = controls.brake > 0
    ? 0
    : -controls.throttle * tuning.maxEngineForce;

  for (const wheelIndex of rearWheels) {
    vehicle.applyEngineForce(engineForce, wheelIndex);
  }

  const brakeForce = controls.brake * tuning.maxBrakeForce;
  for (let wheelIndex = 0; wheelIndex < 4; wheelIndex += 1) {
    vehicle.setBrake(brakeForce, wheelIndex);
  }
}
```

**Design rules:** wheel index order must match the actual added wheel order; sign conventions must be validated with a slow test; and tuning values should live in one configuration object. Do not assume that negative engine force is correct for every axis configuration without testing.

**Validation:** verify forward motion, steering left and right, braking, reverse intent, and neutral input on a flat surface before adding terrain.

## Pattern 4 — Keyboard Input With Safe Release

**Use when:** users drive using keyboard controls.

Use `keydown` and `keyup` to update a key-state map. Avoid repeating force application from the event itself. Clear the map on blur and during teardown. Ignore events originating from text inputs, textareas, select controls, or editable content.

```js
function installKeyboardControls(target, onChange) {
  const keys = new Set();
  const editable = (element) =>
    element instanceof HTMLElement &&
    (element.isContentEditable ||
     ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));

  const update = () => onChange({
    throttle: Number(keys.has("ArrowUp") || keys.has("KeyW")),
    brake: Number(keys.has("ArrowDown") || keys.has("KeyS")),
    steer: Number(keys.has("ArrowRight") || keys.has("KeyD")) -
           Number(keys.has("ArrowLeft") || keys.has("KeyA")),
    handbrake: Number(keys.has("Space")),
  });

  const down = (event) => {
    if (editable(event.target)) return;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
    keys.add(event.code);
    update();
  };

  const up = (event) => {
    keys.delete(event.code);
    update();
  };

  const clear = () => {
    keys.clear();
    update();
  };

  target.addEventListener("keydown", down);
  target.addEventListener("keyup", up);
  window.addEventListener("blur", clear);

  return () => {
    target.removeEventListener("keydown", down);
    target.removeEventListener("keyup", up);
    window.removeEventListener("blur", clear);
    clear();
  };
}
```

**Design rules:** show the bindings visibly; scope listeners to the active experience where possible; avoid preventing browser defaults for unrelated keys; and clear controls on pause. The keyboard should not become a hidden requirement—provide visible controls or an alternative interaction when driving is essential.

**Validation:** hold throttle, switch tabs, return, and confirm that throttle is no longer active. Focus a text field and verify that normal typing works.

## Pattern 5 — Visual Transform Synchronization

**Use when:** a rendering library displays the chassis and wheels.

Copy the physics transform after each completed physics update. Keep the visual model's origin aligned with the chassis body, or use a parent/child offset for the imported model. A vehicle helper can update wheel world transforms; read those transforms to position and rotate wheel meshes.

```js
function syncVehicleVisuals(vehicle, chassisBody, chassisMesh, wheelMeshes) {
  chassisMesh.position.set(
    chassisBody.position.x,
    chassisBody.position.y,
    chassisBody.position.z
  );

  chassisMesh.quaternion.set(
    chassisBody.quaternion.x,
    chassisBody.quaternion.y,
    chassisBody.quaternion.z,
    chassisBody.quaternion.w
  );

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    vehicle.updateWheelTransform(i);
    const transform = vehicle.wheelInfos[i].worldTransform;
    wheelMeshes[i].position.copy(transform.position);
    wheelMeshes[i].quaternion.copy(transform.quaternion);
  }
}
```

**Design rules:** do not animate the chassis mesh independently; do not forget wheel transforms; and account for visual asset offsets. If the visual model is rotated to match the physics axes, keep the correction on a child object so the chassis body's transform remains meaningful.

**Validation:** compare debug collision shapes with the rendered model, steer in place, drive over a small bump, and confirm that all wheels remain visually attached.

## Pattern 6 — Reset the Entire Vehicle State

**Use when:** the user can restart a drive, recover from a flip, or replay a tutorial.

Store a spawn transform and reset body velocities and forces along with wheel controls. Clear the control state, camera smoothing state, timers, collision feedback queues, and any application-side progress that belongs to the current run.

```js
function resetVehicle({ chassisBody, vehicle, spawn, setControls, camera }) {
  chassisBody.position.copy(spawn.position);
  chassisBody.quaternion.copy(spawn.quaternion);
  chassisBody.velocity.set(0, 0, 0);
  chassisBody.angularVelocity.set(0, 0, 0);
  chassisBody.force.set(0, 0, 0);
  chassisBody.torque.set(0, 0, 0);
  chassisBody.wakeUp();

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    vehicle.setSteeringValue(0, i);
    vehicle.setBrake(0, i);
    vehicle.applyEngineForce(0, i);
  }

  setControls({ throttle: 0, brake: 0, steer: 0, handbrake: 0 });
  camera?.reset?.();
}
```

**Design rules:** save spawn transforms as immutable configuration; clear held keys; and make reset available through a native button. Do not merely set the car's position while leaving it rotating or carrying engine force.

**Validation:** flip the car, hold throttle, reset, and verify that it remains at the spawn transform without residual motion.

## Pattern 7 — Pause and Visibility Lifecycle

**Use when:** the simulation is part of a page or route that may become hidden.

Pause physics and rendering when the document is hidden or the scene is no longer useful. On resume, reset the time baseline so the next frame does not interpret the hidden interval as elapsed simulation time. Pause should also neutralize input.

```js
function bindVisibilityLifecycle({ pause, resume, clearControls }) {
  const onVisibility = () => {
    if (document.hidden) {
      clearControls();
      pause();
    } else {
      resume();
    }
  };

  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    clearControls();
  };
}
```

**Design rules:** make pause/resume idempotent; do not schedule duplicate animation frames on repeated resume calls; and decide whether an off-screen but visible scene should pause using `IntersectionObserver`. A paused simulation must not continue applying controls from a stale input state.

**Validation:** switch tabs, minimize the browser, navigate away and back, and verify that only one loop is active after resume.

## Pattern 8 — Collision Feedback Without Event Spam

**Use when:** vehicle collisions trigger a visual flash, sound, vibration, or status message.

Collision events can happen repeatedly during sustained contact. Keep the handler small, identify relevant pairs, apply a cooldown or impact threshold, and enqueue a compact event for the render or UI layer. Do not spawn a large particle effect from every contact callback.

```js
function createImpactHandler({ cooldownMs = 180, minSpeed = 2, onImpact }) {
  let lastImpactAt = -Infinity;

  return (event) => {
    const now = performance.now();
    if (now - lastImpactAt < cooldownMs) return;

    const pair = event.contact;
    if (!pair) return;

    const relativeSpeed = Math.hypot(
      pair.bi.velocity.x - pair.bj.velocity.x,
      pair.bi.velocity.y - pair.bj.velocity.y,
      pair.bi.velocity.z - pair.bj.velocity.z
    );

    if (relativeSpeed < minSpeed) return;
    lastImpactAt = now;
    onImpact({ relativeSpeed, time: now });
  };
}
```

**Design rules:** confirm the exact collision event payload for the installed cannon-es version; contact equations and body-pair events vary by API. The code is a pattern for thresholding, not a promise that every version emits the same payload. Prefer collision events documented by the installed version and test with a controlled impact.

**Validation:** gently touch a wall, hit it at higher speed, and remain in contact. Confirm that only meaningful impacts produce feedback.

## Pattern 9 — Debug Overlay for Wheel Geometry

**Use when:** the vehicle is unstable, wheels float, or steering appears reversed.

Draw the chassis collision shape, wheel connection points, suspension direction, raycast endpoints, and vehicle forward axis. Debug geometry turns vague tuning into observable diagnosis. Keep it behind a development flag and ensure it is disposed with the scene.

**Design rules:** use distinct visual conventions for body axes, wheel rays, contact points, and ground normals; do not rely on the rendered car model alone; and verify wheel ordering before adjusting friction or engine force. If the wheels are on the wrong side or point in the wrong direction, no amount of tuning will solve the underlying coordinate error.

**Validation:** enable the overlay on flat ground, inspect all four wheels, and verify front/rear and left/right placement. Then test a ramp and confirm that wheel rays intersect the track as expected.

## Pattern 10 — Graceful Fallback and Reduced Motion

**Use when:** the vehicle is an enhancement to a web page rather than the only way to access important content.

Provide a static vehicle view, descriptive text, and ordinary controls for the rest of the page. Reduced-motion mode can disable camera shake, reduce follow movement, use a stationary camera, or replace free driving with a short, user-triggered demonstration. Do not remove the user's ability to read instructions or complete the surrounding task.

**Design rules:** keep fallback content in the document; do not wait for a runtime exception to reveal the only description; and keep controls understandable when physics is paused. If the 3D scene is purely decorative, mark it as such and avoid presenting inert controls that appear functional.

**Validation:** test reduced motion, unsupported WebGL/rendering contexts if applicable, and an initialization failure. The page should still explain the vehicle interaction and provide the essential information.

## Pattern 11 — Tuning Through a Repeatable Test Track

**Use when:** changing suspension, grip, steering, or mass properties.

Create a compact test track with a flat launch area, a gentle turn, a braking zone, a small bump, and a safe reset area. Run the same control sequence after each tuning change. Record the configuration and the observed result. This is more reliable than changing several parameters after an uncontrolled drive.

A simple test matrix can include: launch from rest, steady throttle, full brake from a fixed speed, constant-radius turn, low-speed reverse, ramp traversal, and reset after rollover. Keep the test environment deterministic and avoid random obstacles during early tuning.

**Validation:** change one parameter at a time, compare results, and retain the previous known-good configuration. If a change improves one test but makes another substantially worse, identify the trade-off rather than labeling the change globally better.

## Pattern 12 — Camera Follow Without Motion Sickness

**Use when:** the scene uses a camera that tracks the vehicle.

Use a damped follow target and a predictable offset. Avoid large camera swings or repeated shake on minor contacts. Keep camera update logic separate from physics stepping so it can be adjusted without changing vehicle dynamics.

A low-motion setting can reduce smoothing lag, remove shake, and keep the horizon stable. If the user can switch between camera modes, announce the current mode in the UI and ensure the switch does not reset the vehicle unexpectedly.

**Validation:** drive in a straight line, make a sharp turn, collide gently, reset, and enable reduced motion. The camera should remain readable and should not hide the path ahead.

## Pattern 13 — Bounded Simulation and Object Budget

**Use when:** the vehicle scene includes obstacles, debris, particles, or multiple rigid bodies.

Set a budget for dynamic bodies and collision effects. Static track geometry is usually preferable to many small dynamic pieces when the track itself does not need to move. Remove temporary debris after a defined lifetime and avoid creating a new rigid body for every decorative sparkle.

If the prototype supports multiple vehicles, test worst-case interactions rather than only the single-vehicle path. Keep broadphase and collision filtering appropriate to the world size, and profile before adding complex optimization.

**Validation:** run the scene for several minutes, repeat collisions, and inspect active body count and frame time. Resource use should not climb indefinitely.

## Pattern 14 — Gamepad and Touch Controls Through the Same API

**Use when:** the interaction may be used on a laptop, mobile device, or gamepad.

Map every device to the same normalized control state. Keyboard and gamepad adapters should not know the details of wheel indexes or force values. Touch controls should provide explicit throttle, brake, and steering surfaces with visible pressed states and adequate target sizes.

Use a dead zone for analog stick input and clamp all values. Release touch controls on `pointercancel` and `pointerup`; clear all input on pause. Do not require a gamepad for a core interaction, and do not assume touch users can hover to discover controls.

**Validation:** compare input ranges across devices, test pointer cancellation, and confirm that switching devices does not leave an old input active.

## Integration With a Rendering Library

A common arrangement uses cannon-es for physics and a separate 3D renderer for models, lights, and camera. The physics world remains authoritative. After stepping the world, synchronize the chassis mesh and wheel meshes. The rendering scene should not independently animate the same vehicle transform.

```js
function stepAndRender(deltaSeconds) {
  accumulator += Math.min(deltaSeconds, 0.1);

  let steps = 0;
  while (accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
    applyVehicleControls(vehicle, controls, tuning);
    world.step(FIXED_STEP);
    accumulator -= FIXED_STEP;
    steps += 1;
  }

  syncVehicleVisuals(vehicle, chassisBody, chassisMesh, wheelMeshes);
  renderer.render(scene, camera);
}
```

If using an imported model, place it inside a group that can carry a fixed orientation correction or visual offset. Keep the group aligned with the chassis body. If the model's origin is at the front axle while the collision body is centered, add a child offset rather than moving the physics body to match an inconvenient asset origin.

### Rendering Synchronization Checklist

- The chassis mesh follows the body position and quaternion.
- Wheel transforms are refreshed from the vehicle helper after physics updates.
- Visual asset orientation corrections are isolated from the physics coordinate system.
- Physics stepping has exactly one owner.
- The camera reads the current vehicle transform but does not mutate it.
- The render loop is canceled during teardown.
- The physics world is not stepped after destruction.
- Debug helpers are disabled or removed in production.
- Resize updates camera aspect and renderer dimensions without changing physics scale accidentally.
- Interpolation, if used, affects only the rendered transform, not the authoritative body state.

## Semantic HTML Requirements

The 3D canvas should be surrounded by real interface structure. Depending on the product, use at least five of these meaningful elements and relationships:

1. `<section>` for a named driving experience.
2. `<h2>` or a properly nested heading for the experience title.
3. `<p>` for control instructions and limitations.
4. `<canvas>` with useful fallback text if a canvas renderer is used.
5. `<button type="button">` for start, pause, resume, reset, and camera-mode controls.
6. `<fieldset>` and `<legend>` to group related driving controls where appropriate.
7. `<label>` for settings such as steering sensitivity or camera mode.
8. `<input type="range">` for a user-adjustable value with a visible label and current value.
9. `<output>` to display the current value of a range control.
10. `<p role="status" aria-live="polite">` for concise pause/reset/error status.
11. `<ul>` and `<li>` for a visible list of controls or objectives.
12. `<details>` and `<summary>` for optional advanced tuning instructions.

Use semantics because they express meaning, not to reach a numeric target. Native buttons are preferable to clickable generic containers. If the scene is decorative, it may be hidden from assistive technology; if it is interactive, provide a clear name, instructions, and alternative controls.

## Accessibility Checklist

1. Provide visible instructions for all keyboard controls.
2. Keep a visible focus indicator on every interactive control.
3. Make pause and reset available through native buttons.
4. Ensure users can complete essential surrounding tasks without driving.
5. Respect `prefers-reduced-motion`, especially for camera shake and rapid camera movement.
6. Do not use color alone to indicate brake, throttle, selected mode, or collision state.
7. Provide labels for range inputs and display their current values.
8. Do not hijack keyboard input while a user is typing in a form field.
9. Clear held keys when the window loses focus or the simulation pauses.
10. Support pointer cancellation and touch release paths.
11. Use a polite status region for meaningful state changes only.
12. Avoid announcing every frame, wheel contact, or collision equation to assistive technology.
13. Preserve browser zoom and do not globally disable touch gestures.
14. Make touch controls large enough to activate without precision.
15. Avoid sudden camera jumps; provide a reduced-motion or stationary-camera option.
16. Ensure focus order follows the visual and task order.
17. Make error and fallback states understandable in text.
18. Test keyboard-only operation and at least one screen-reader path.

## Performance Notes

1. **Use a fixed timestep with a catch-up cap.** Never allow a slow frame to trigger an unbounded number of physics steps.
2. **Keep the body count bounded.** Static track geometry is usually cheaper and more stable than many dynamic pieces.
3. **Use simple collision shapes.** Do not use detailed render meshes as collision geometry unless the interaction truly requires them.
4. **Tune solver and broadphase settings based on measurement.** Do not change them blindly to fix a geometry or coordinate error.
5. **Avoid work in hot event callbacks.** Collision handlers should classify and enqueue effects rather than create complex visual scenes.
6. **Pause when hidden.** Reset the time baseline on resume and neutralize controls.
7. **Keep rendering and physics separate.** Avoid triggering a framework render for every physics body update.
8. **Limit debug overlays.** Ray and contact visualizations can be useful during development but should be off by default in production.
9. **Cap particle and sound effects.** One impact should not create unbounded effects.
10. **Profile low-powered devices.** Desktop frame rate is not a sufficient performance guarantee.
11. **Avoid rebuilding the entire world on resize.** Update renderer and camera dimensions while preserving vehicle state.
12. **Use collision filtering deliberately.** Unnecessary body pairs increase collision work.
13. **Keep camera work modest.** Expensive postprocessing can cost more than the physics scene itself.
14. **Avoid duplicated animation loops.** Repeated resume calls must not schedule multiple loops.
15. **Release references on teardown.** A stopped loop can still leak memory if closures retain a large scene graph.

## Common Mistakes and Failure Modes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Copying wheel settings from a different coordinate convention | Wheels may point sideways or sit at incorrect offsets | Document axes and inspect debug wheel rays |
| Mixing cannon-es versions or forks | APIs and event payloads may differ | Verify the installed package and consult its matching examples |
| Applying forces directly inside keyboard events | Control behavior becomes dependent on event timing | Store normalized intent and consume it during physics updates |
| Leaving a key active after focus loss | Vehicle continues accelerating or steering unexpectedly | Clear key state on blur, pause, and teardown |
| Stepping physics with arbitrary frame deltas | Vehicle behavior varies with device performance | Use a fixed timestep and bounded accumulator |
| Allowing unlimited catch-up steps | A slow frame can create a freeze spiral | Cap steps and discard excess accumulated time deliberately |
| Setting only the chassis position during reset | Residual velocity or torque moves the vehicle immediately | Reset transform, velocities, forces, torque, and wheel state |
| Animating the visual model independently | Rendered car drifts away from collision body | Synchronize visuals from physics transforms |
| Ignoring wheel transforms | Wheels appear detached or do not steer | Update wheel world transforms and copy them to meshes |
| Using complex visual meshes as collision shapes | Collision becomes expensive and hard to stabilize | Use simplified primitives or carefully selected static geometry |
| Increasing friction to solve every handling issue | Hides axis, contact, or suspension problems | Diagnose geometry and tune one variable at a time |
| Applying engine force to the wrong wheel indexes | Vehicle accelerates unpredictably or appears to have no drive | Define wheel order and verify it with a slow test |
| Forgetting the sign convention for engine force | Vehicle moves backward when forward is requested | Test force direction on flat ground before adding controls |
| Applying brake force to every wheel without a design | Braking feel may be abrupt or inconsistent | Separate service brake, handbrake, and reverse behavior |
| Using an unstable camera follow | Camera jitter amplifies small chassis movement | Smooth camera independently and stabilize the horizon |
| Updating the camera from stale transforms | Camera lags or snaps unpredictably | Update after the physics step and use one clear target |
| Creating new collision effects for every contact callback | Sustained contact causes effect spam | Use thresholds, cooldowns, and bounded queues |
| Leaving resize and visibility listeners installed | Memory leaks and duplicate behavior after remounts | Retain handler references and remove them in `destroy()` |
| Scheduling a new animation loop on every resume | Multiple physics/render loops compete | Track running state and make resume idempotent |
| Treating reduced motion as a page-wide disable switch | Important content or actions may disappear | Offer a low-motion mode that preserves control and information |
| Providing keyboard controls without visible instructions | Users cannot discover how to drive | Display bindings and offer semantic control buttons |
| Preventing all arrow-key defaults across the page | Forms and unrelated interface behavior break | Scope input to the active experience and ignore editable targets |
| Forgetting touch `pointercancel` | A throttle or steering control can remain active | Handle all pointer termination paths |
| Resetting the camera but not the vehicle, or vice versa | Scene state feels inconsistent after restart | Define reset as a coordinated domain operation |
| Running physics while the route is hidden | Wastes CPU and may create a large time jump | Pause on visibility change and reset timing on resume |
| Shipping debug helpers enabled | Extra drawing and clutter reduce performance and polish | Gate debug visualization behind a development flag |
| Assuming a raycast vehicle is physically exact | Product claims exceed the model's capability | Describe it as a simplified vehicle approximation |
| Rebuilding all bodies on each resize | Vehicle state is lost and allocation churn increases | Resize renderer/camera and preserve the physics world |
| Omitting a fallback for the scene | The page becomes useless if initialization fails | Keep explanatory content and essential controls in HTML |
| Announcing every collision to screen readers | Status becomes noisy and unusable | Announce only meaningful product-level outcomes |

## Gotchas

- **Axis order is not cosmetic.** The vehicle helper's right, up, and forward axis indices must match the body's coordinate system. A mismatch can create confusing behavior even if the visual model looks correctly rotated.
- **Wheel order is an implicit contract.** The index used for steering, engine force, and braking must match the order in which wheels were added.
- **Raycast wheels are an approximation.** Do not expect full tire deformation, exact slip curves, or physically complete suspension behavior.
- **Visual and collision origins may differ.** Use a visual child offset instead of shifting the physics body to compensate for an imported asset.
- **Event payloads are version-specific.** Confirm collision event names and data structures against the installed cannon-es version.
- **Large frame gaps are normal in browsers.** Tab visibility, throttling, and CPU contention must be part of the timing design.
- **A stationary reset may still need a settling frame.** Place the vehicle clear of ground overlap and avoid a spawn transform that starts inside a collider.
- **Friction values are not universally portable.** A value tuned for one world scale, chassis, and terrain may feel wrong in another.
- **Camera shake can dominate perceived motion.** Small chassis jitter becomes much more noticeable when the camera copies it exactly.
- **Touch controls need termination handling.** Pointer cancellation, lost focus, and route changes must release throttle and steering.
- **A paused simulation should neutralize controls.** Otherwise it may resume with stale input and move immediately.
- **Reset should clear transient effects.** Pending particles, collision sounds, status messages, and camera offsets can make a reset appear incomplete.

## Quick Reference

| Need | Technique | Watch for |
|---|---|---|
| Create a world | `new CANNON.World()` | Coordinate convention and gravity |
| Create a static floor | Body with `mass: 0` and plane/shape | Plane orientation and contact geometry |
| Create a chassis | Dynamic body with simple collision shape | Mass distribution and center of mass |
| Add vehicle behavior | `CANNON.RaycastVehicle` | API version and axis indexes |
| Configure wheels | `addWheel()` with connection points | Wheel order and left/right offsets |
| Steer front wheels | `setSteeringValue()` | Steering sign and maximum angle |
| Apply propulsion | `applyEngineForce()` | Correct wheel indexes and force sign |
| Apply braking | `setBrake()` | Brake priority and intended wheel set |
| Advance simulation | Fixed-step `world.step()` | Catch-up cap and one stepping owner |
| Synchronize chassis | Copy position and quaternion | Visual origin offset |
| Synchronize wheels | Update wheel transform, copy to mesh | Wheel transform freshness |
| Tune suspension | Rest length, stiffness, damping | Bounce versus rigidity |
| Tune grip | Wheel friction/slip settings | Avoid masking geometry defects |
| Configure surface response | Contact materials | Visual materials do not control physics |
| Handle keyboard input | Key-state map | Clear on blur and pause |
| Handle touch input | Pointer events and normalized controls | `pointercancel` and target size |
| Reset vehicle | Restore full state snapshot | Residual velocities, forces, and controls |
| Follow vehicle | Separate camera controller | Jitter, snapping, reduced motion |
| Debug wheel placement | Draw axes, rays, and contact points | Disable debug drawing in production |
| Pause hidden scene | Visibility lifecycle | Reset time baseline on resume |
| Dispose scene | Cancel frame, remove listeners, clear handlers | Idempotent cleanup |
| Preserve accessibility | Native controls and status region | Do not make driving the only route |
| Test handling | Repeatable track scenarios | Change one tuning variable at a time |

## Testing Strategy

### Unit Tests

Test control normalization, key mapping, wheel-index configuration, reset state, and catch-up-step limits as isolated functions. The vehicle controller should accept a control object and tuning configuration, making it possible to verify expected wheel calls without rendering a scene. Inject time into the accumulator where practical so tests do not rely on real browser timing.

### Physics Integration Tests

Create a known flat world and a vehicle with explicit initial transforms. Test that throttle produces movement in the expected direction, steering changes heading under motion, braking reduces speed, and reset returns the chassis to its spawn state. Use tolerances and behavioral assertions rather than demanding exact positions after an arbitrary number of frames.

Test the vehicle on a simple track before introducing complex collision geometry. If the vehicle fails on flat ground, do not add ramps or obstacles until the basic axes, wheel positions, force signs, and timestep are correct.

### Browser Integration Tests

Mount the scene, start it, pause it, resume it, resize it, and destroy it. Verify that only one animation loop runs. Switch tabs while accelerating and confirm that the controls are neutralized and the simulation resumes without a large time jump. If the app uses route navigation, confirm that leaving the route disposes of listeners and physics resources.

### Accessibility Tests

Use only the keyboard to pause, reset, and operate available controls. Verify that the user can type in form fields without the driving controls intercepting keys. Enable reduced motion and confirm that the camera and visual effects change without hiding instructions or actions. Inspect focus order, labels, target sizes, and status announcements.

### Suggested Assertions

- The vehicle begins at a known spawn transform.
- Throttle moves the vehicle in the intended direction under the documented axis convention.
- Neutral input does not continue adding engine force.
- Braking reduces speed in a controlled flat-ground test.
- Steering values are clamped to the configured range.
- A hidden tab does not accumulate unlimited physics steps.
- Reset clears velocity, angular velocity, force, torque, steering, braking, and input state.
- The chassis mesh and physics body remain aligned within a reasonable tolerance.
- Wheel meshes match their latest world transforms.
- Repeated resume calls do not create duplicate loops.
- Destroy cancels future animation frames and removes event listeners.
- Keyboard and touch controls release correctly after focus loss or pointer cancellation.
- Reduced-motion mode preserves essential information and actions.
- Dynamic body and collision-effect budgets remain bounded.

## Build Challenge: Arcade Vehicle Test Track

Build a compact vehicle playground using cannon-es and a 3D renderer. The challenge should demonstrate control, stable simulation, visual synchronization, and reliable lifecycle management rather than only a vehicle model moving across a plane.

### Required Deliverables

1. Create a world factory that sets gravity, broadphase behavior, track collision geometry, and contact materials.
2. Build a chassis body and a four-wheel raycast vehicle with documented axis conventions and wheel order.
3. Configure suspension, steering, friction, and engine force through a centralized tuning object.
4. Implement a fixed-step accumulator with a maximum catch-up step count.
5. Normalize keyboard and optional touch/gamepad input into one shared control object.
6. Synchronize the chassis and all wheel meshes from physics transforms.
7. Add a simple test track with a flat launch zone, a turn, a braking area, and one low obstacle.
8. Implement a complete reset that restores the chassis, wheel controls, input state, and camera state.
9. Add pause/resume behavior for page visibility and a reduced-motion camera option.
10. Provide semantic controls, visible instructions, an accessible status region, and a graceful fallback if the interactive scene cannot initialize.

### Quality Requirements

- Wheel indexes are documented and tested.
- Engine-force signs are verified on a flat surface.
- Collision shapes are simpler than visual meshes.
- The physics update has exactly one owner.
- The renderer never independently animates the chassis transform.
- Catch-up work is bounded.
- The animation loop cannot be duplicated by repeated resume calls.
- All listeners, observers, and scheduled frames are removed on teardown.
- Keyboard controls do not interfere with editable fields.
- Touch controls handle pointer cancellation and release.
- Reduced motion changes camera behavior without removing important content.
- Reset clears transient effects and application-side state.
- The test track makes handling changes repeatable.
- Performance is checked on a representative lower-powered device.
- Documentation distinguishes simplified raycast-wheel behavior from a full tire simulation.

### Evaluation Rubric

| Area | Strong result | Warning sign |
|---|---|---|
| Coordinate system | Axes and wheel order are explicit | Steering or engine direction is patched with unexplained sign flips |
| Vehicle behavior | Predictable acceleration, braking, and turning | Car flips or slides for unexplained reasons |
| Suspension | Stable settling with controlled bounce | Persistent oscillation or wheels floating |
| Timing | Fixed timestep and bounded catch-up | Behavior changes sharply after a slow frame |
| Rendering | Chassis and wheels match physics | Mesh drifts or wheels detach visually |
| Controls | Normalized, discoverable, and cleared safely | Stuck throttle or browser shortcuts hijacked |
| Reset | Full state restoration | Vehicle resumes moving after reset |
| Lifecycle | Idempotent pause/resume/destroy | Duplicate loops or stale listeners |
| Accessibility | Semantic controls and reduced-motion path | Driving is the only way to access important information |
| Performance | Bounded objects and measured costs | Frame time degrades during repeated collisions |

## Definition of Done

- [ ] The physics world uses a documented coordinate system and gravity direction.
- [ ] The chassis collision shape and visual model have a known alignment.
- [ ] Wheel positions, order, and axis indexes are documented.
- [ ] Steering, propulsion, and braking work on a simple flat test surface.
- [ ] Suspension settles without persistent oscillation under normal conditions.
- [ ] The physics world advances through one fixed-step update path.
- [ ] Catch-up work is capped after a slow frame.
- [ ] Keyboard, pointer, and optional gamepad input share a normalized control model.
- [ ] Held controls clear on blur, pause, pointer cancellation, and teardown.
- [ ] Chassis and wheel visuals synchronize from physics transforms.
- [ ] Reset restores transforms, velocities, forces, wheel controls, camera, and application state.
- [ ] The camera is decoupled from vehicle dynamics and has a low-motion option.
- [ ] Collision feedback is thresholded and bounded.
- [ ] Hidden scenes pause or reduce work and resume with a fresh time baseline.
- [ ] Native controls expose pause, reset, and any essential vehicle actions.
- [ ] Keyboard focus, labels, instructions, and status announcements have been reviewed.
- [ ] Reduced-motion behavior preserves content and task access.
- [ ] Debug overlays are off by default in production.
- [ ] Teardown cancels frames and removes listeners, observers, and physics event handlers.
- [ ] `destroy()` and repeated pause/resume operations are safe.
- [ ] Tests cover control mapping, stepping, reset, rendering sync, and lifecycle.
- [ ] Performance is checked on a representative target device.
- [ ] The project documents the limitations of the simplified raycast vehicle model.

## Final Review Checklist

Before shipping, answer these questions:

- Can the vehicle's coordinate system and wheel order be explained without inspecting arbitrary sign flips?
- Does the same controlled test sequence produce broadly similar behavior after repeated runs?
- Are the simulation and render loops clearly separated?
- Is the physics update stable when the browser drops frames or changes visibility?
- Can the user recover from a rollover or stuck state without reloading the page?
- Does every input method release its controls reliably?
- Are collision effects useful and bounded rather than noisy?
- Can users pause and reset with keyboard-accessible native controls?
- Does reduced motion reduce unnecessary camera movement without hiding essential information?
- Can the scene be mounted, resumed, paused, reset, and destroyed repeatedly without duplicate work?
- Have wheel geometry and collision shapes been inspected with debug visualization?
- Is the implementation honestly described as a simplified vehicle model rather than a complete tire simulation?

If any answer is no, continue testing before shipping. A convincing vehicle interaction is not defined by a single successful drive; it is defined by repeatable handling, clear controls, stable timing, accessible alternatives, and predictable lifecycle behavior.
