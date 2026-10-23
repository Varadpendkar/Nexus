# SKILL: threejs-raycasting

**Layer:** 06 — Three.js / WebGL

**Goal:** Master raycasting to build precise, performant pointer interactions, object selection, hover states, and spatial interactions in Three.js scenes.

## Why This Matters (Senior Perspective)

A 3D scene can look exceptional and still feel inert. Raycasting connects a user's pointer or touch position to objects in a scene, enabling product hotspots, portfolio project selection, interactive installations, configurators, and direct manipulation. It is the bridge between a rendered pixel and the 3D object that produced it. Without a deliberate interaction model, users experience missed clicks, flickering hover states, selections that change unpredictably, or interfaces that work only at one viewport size.

The naive approach casts a ray through every object on every pointer event, changes materials directly, and assumes the first intersection is always the intended target. That can become expensive in large scenes and fragile when meshes overlap, models contain many child meshes, or the camera moves. Senior implementation starts by defining the interaction contract: which objects are interactive, whether selection is single or multiple, what occludes a target, how hover differs from selection, and what feedback is visible to keyboard and touch users. The raycast is only one part of that contract.

In creative development, interaction should feel intentional rather than merely technically functional. A portfolio object might lift slightly on hover, reveal a label, and open a project panel on click. A product viewer might expose hotspots without allowing hidden surfaces to steal clicks. A scene with hundreds of decorative meshes should remain responsive because only a small, explicit set of objects participates in hit testing. This skill focuses on predictable behavior, clean state transitions, and performance that holds up when a polished prototype becomes a real experience.

## Core Concepts

### 1. The ray is a query, not a visual effect

A ray is a mathematical half-line defined by an origin and direction. Three.js derives it from a camera and normalized device coordinates (NDC), where the center of the viewport is `(0, 0)` and the edges span approximately `-1` to `1`. The raycaster intersects eligible objects and returns intersections ordered from nearest to farthest.

The key mental model is: **screen position → NDC → camera ray → ordered intersections → interaction policy**. Keep those steps distinct. A correct ray can still produce the wrong interaction if your policy chooses the wrong hit.

```js
import * as THREE from 'three';

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

function updatePointerFromEvent(event, canvas) {
  const rect = canvas.getBoundingClientRect();

  // Convert CSS pixels into the coordinate system used by the camera ray.
  pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function getIntersections(camera, interactiveObjects) {
  raycaster.setFromCamera(pointerNDC, camera);

  // Three.js sorts hits by distance, so the first one is the nearest hit.
  return raycaster.intersectObjects(interactiveObjects, true);
}
```

Do not use `window.innerWidth` and `window.innerHeight` when the canvas occupies only part of the page. The canvas rectangle is the relevant coordinate space. Using the full window shifts the ray whenever the renderer is inside a container, page section, or split-screen layout.

### 2. Interactive roots and recursive child meshes

Loaded GLTF models commonly contain nested groups and many meshes. Treating every mesh as a separate application-level target creates duplicate state and makes selection logic hard to maintain. Prefer a semantic root such as `projectCard`, `productModel`, or `hotspotGroup`; map a child intersection back to its registered root.

```js
const interactiveRoots = [];
const rootByObject = new WeakMap();

function registerInteractiveRoot(root, metadata = {}) {
  interactiveRoots.push(root);

  // Every descendant hit should resolve to one semantic interaction target.
  root.traverse((object) => {
    rootByObject.set(object, {
      root,
      metadata,
    });
  });
}

function resolveInteractiveTarget(hit) {
  let current = hit.object;

  while (current) {
    const registered = rootByObject.get(current);
    if (registered) return registered;
    current = current.parent;
  }

  return null;
}
```

`WeakMap` is useful because it does not keep otherwise-unreferenced objects alive by itself. If roots are removed from the scene, also remove them from the `interactiveRoots` array and clear application references to their metadata.

A simpler option is to raycast only a curated array of target meshes. Use that when each target is a single mesh or when child-level behavior is genuinely required. For complex imported models, semantic roots usually make the application easier to reason about.

### 3. Hover, focus, and selection are separate states

Hover is temporary pointer feedback. Focus is the current keyboard interaction target. Selection is a persistent application choice. Combining these states into one `isActive` flag leads to bugs: a pointer leaving an object may accidentally clear a keyboard selection, or a selected object may lose its visual treatment when the cursor moves away.

Model the states explicitly and derive the visual result from them.

```js
const interactionState = {
  hovered: null,
  focused: null,
  selected: null,
};

function getVisualState(target) {
  if (interactionState.selected === target) return 'selected';
  if (interactionState.hovered === target) return 'hovered';
  if (interactionState.focused === target) return 'focused';
  return 'idle';
}
```

The priority shown here is a product decision, not a Three.js rule. You may choose to emphasize keyboard focus above hover or show a distinct selected-plus-hovered state. The important part is that transitions are explicit and testable.

### 4. Raycast layers and occlusion policy

Three.js object layers can filter which objects a raycaster considers. Use layers to keep decorative particles, background meshes, helper geometry, or non-interactive objects out of hit testing. Layers do not automatically define semantic priority, however: they are a filter, not a complete selection policy.

```js
const INTERACTION_LAYER = 2;

function enableInteractionLayer(root) {
  root.traverse((object) => {
    if (object.isMesh) object.layers.enable(INTERACTION_LAYER);
  });
}

raycaster.layers.set(INTERACTION_LAYER);
```

If a ray should pass through decorative elements, exclude those elements from the candidate array or interaction layer. If an opaque foreground object should block a target behind it, include an occlusion test or raycast the relevant occluders as well. Do not silently skip the nearest hit unless “click through” behavior is an intentional feature.

### 5. Intersection details are useful product data

An intersection can include the hit object, world-space point, distance, face, face index, UV coordinates, and instance identifier when applicable. These details support more than click selection: UVs can identify a point on a textured surface, the world point can anchor a tooltip, and a face normal can orient a decal or marker.

```js
function describeHit(hit) {
  return {
    objectName: hit.object.name || '(unnamed object)',
    distance: hit.distance,
    worldPoint: hit.point.clone(),
    uv: hit.uv ? hit.uv.clone() : null,
    faceNormal: hit.face?.normal
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : null,
  };
}
```

Face normals are initially expressed in the geometry's local space. Transform them into world space before using them to orient a world-space effect. UVs are not guaranteed for every geometry, and a hit may not provide a face normal for every object type.

### 6. Pointer events should update state; the render loop should render it

Avoid mixing ray queries, DOM changes, material creation, and scene updates into one large event callback. Pointer events should update pointer coordinates or interaction state; a central update loop can perform hit testing at a controlled rate and apply the resulting state. This is particularly helpful when the camera moves independently of the pointer.

```js
let pointerDirty = true;

canvas.addEventListener('pointermove', (event) => {
  updatePointerFromEvent(event, canvas);
  pointerDirty = true;
});

function updateInteractions() {
  if (!pointerDirty) return;

  pointerDirty = false;
  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(interactiveRoots, true);

  // Resolve the first eligible semantic target in the interaction policy.
  const nextTarget = hits.length
    ? resolveInteractiveTarget(hits[0])?.root ?? null
    : null;

  setHoveredTarget(nextTarget);
}
```

If the camera or target objects move while the pointer remains still, the old pointer ray may now intersect a different object. Mark hit testing dirty when camera transforms, animated target transforms, or relevant visibility changes occur. For continuous drag interactions, use a deliberate per-frame policy rather than assuming pointer events alone are sufficient.

## Advanced Interaction Patterns

### Pattern 1: Stable hover with enter/leave transitions

**Use when:** Interactive objects should react once when the pointer enters or leaves, instead of repeatedly applying effects every frame.

Keep one current hovered target. Only run transition logic when the target changes. This prevents repeated material assignments, audio triggers, or UI updates.

```js
let hoveredTarget = null;

function setHoveredTarget(nextTarget) {
  if (hoveredTarget === nextTarget) return;

  const previousTarget = hoveredTarget;
  hoveredTarget = nextTarget;

  if (previousTarget) onHoverLeave(previousTarget);
  if (hoveredTarget) onHoverEnter(hoveredTarget);
}

function onHoverEnter(target) {
  target.userData.hovered = true;
  target.dispatchEvent({ type: 'interaction-hover-enter' });
}

function onHoverLeave(target) {
  target.userData.hovered = false;
  target.dispatchEvent({ type: 'interaction-hover-leave' });
}
```

The callbacks should alter a controlled visual property or application state, not repeatedly clone materials. If multiple visual systems react to hover, dispatching a semantic event keeps raycasting separate from presentation.

### Pattern 2: Click selection with pointer capture discipline

**Use when:** A click selects an object, but dragging the camera or orbit controls should not accidentally trigger selection.

A browser emits `pointerdown` and `pointerup` during both clicks and drags. Store the initial position and only select when movement stays under a threshold. The threshold is measured in CSS pixels, not device pixels.

```js
let pointerDownPosition = null;
const CLICK_DRAG_THRESHOLD = 6;

canvas.addEventListener('pointerdown', (event) => {
  pointerDownPosition = {
    x: event.clientX,
    y: event.clientY,
    pointerId: event.pointerId,
  };
});

canvas.addEventListener('pointerup', (event) => {
  if (!pointerDownPosition) return;
  if (pointerDownPosition.pointerId !== event.pointerId) return;

  const dx = event.clientX - pointerDownPosition.x;
  const dy = event.clientY - pointerDownPosition.y;
  const moved = Math.hypot(dx, dy);

  pointerDownPosition = null;

  // Ignore a camera drag so it does not become an accidental object selection.
  if (moved > CLICK_DRAG_THRESHOLD) return;

  updatePointerFromEvent(event, canvas);
  raycaster.setFromCamera(pointerNDC, camera);

  const hits = raycaster.intersectObjects(interactiveRoots, true);
  const target = hits.length
    ? resolveInteractiveTarget(hits[0])?.root ?? null
    : null;

  selectTarget(target);
});
```

If the application uses `OrbitControls`, decide whether selection occurs on `pointerup`, whether controls should be disabled while manipulating an object, and how touch gestures are interpreted. Do not rely on a click event alone when camera controls may consume the same pointer sequence.

### Pattern 3: World-space tooltip anchored to the hit point

**Use when:** A label should follow the exact point on a model or surface that the user points at.

A DOM tooltip can be positioned by projecting the world-space intersection into normalized device coordinates, then mapping that point to the canvas's CSS rectangle. This preserves alignment when the canvas is embedded in a layout.

```js
const projectedPoint = new THREE.Vector3();

function worldPointToCanvasPixels(worldPoint, camera, canvas) {
  projectedPoint.copy(worldPoint).project(camera);

  const rect = canvas.getBoundingClientRect();
  return {
    x: rect.left + (projectedPoint.x + 1) * 0.5 * rect.width,
    y: rect.top + (1 - projectedPoint.y) * 0.5 * rect.height,
  };
}

function positionTooltip(tooltipElement, hit) {
  const point = worldPointToCanvasPixels(hit.point, camera, canvas);
  tooltipElement.style.transform =
    `translate(${point.x}px, ${point.y}px) translate(-50%, -100%)`;
}
```

This code assumes the tooltip is positioned relative to the viewport (for example, `position: fixed`). If it is positioned inside a container, subtract that container's rectangle instead. Hide the tooltip when the pointer leaves the target, when the target is occluded, or when its projected point lies outside the visible canvas.

### Pattern 4: Raycast only on demand, with camera-aware invalidation

**Use when:** A scene has many targets and does not need hit testing on every animation frame.

```js
let interactionDirty = true;

function invalidateInteractions() {
  interactionDirty = true;
}

canvas.addEventListener('pointermove', (event) => {
  updatePointerFromEvent(event, canvas);
  invalidateInteractions();
});

function onCameraChanged() {
  // A stationary pointer can intersect a different object after camera motion.
  invalidateInteractions();
}

function updateInteractionFrame() {
  if (!interactionDirty) return;
  interactionDirty = false;

  raycaster.setFromCamera(pointerNDC, camera);
  const hits = raycaster.intersectObjects(interactiveRoots, true);
  const target = hits.length
    ? resolveInteractiveTarget(hits[0])?.root ?? null
    : null;

  setHoveredTarget(target);
}
```

Call `onCameraChanged()` from the camera-control change event and invalidate after relevant object transforms. If objects animate continuously and can move beneath a stationary pointer, use a frame-based query while those objects are moving or mark the interaction dirty whenever their transforms change.

### Pattern 5: Instanced-mesh selection

**Use when:** You render many repeated objects with `THREE.InstancedMesh`, such as particles, product tiles, or a field of portfolio objects.

A raycast against an instanced mesh returns `instanceId`. The instance identifier must be mapped to application data. It is not the same as a child mesh reference.

```js
const instanceData = [
  { id: 'project-aurora', title: 'Aurora' },
  { id: 'project-orbit', title: 'Orbit' },
  { id: 'project-form', title: 'Form' },
];

function handleInstancedHit(hit) {
  if (hit.instanceId === undefined) return;

  const item = instanceData[hit.instanceId];
  if (!item) return;

  selectProject(item.id);
}
```

If instances are reordered, removed, or compacted, update the data mapping in the same operation. Otherwise the geometry can display one project while the hit result selects another. Use `instanceId` for data lookup, not as a permanent business identifier.

### Pattern 6: Surface hotspot with world-space feedback

**Use when:** A product or architectural model needs a marker attached to the point that was hit.

```js
const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.035, 12, 12),
  new THREE.MeshBasicMaterial({ color: 0xff6b4a })
);
marker.visible = false;
scene.add(marker);

const worldNormal = new THREE.Vector3();

function placeMarker(hit) {
  marker.position.copy(hit.point);

  if (hit.face?.normal) {
    worldNormal
      .copy(hit.face.normal)
      .transformDirection(hit.object.matrixWorld);

    // Offset the marker slightly to avoid z-fighting with the surface.
    marker.position.addScaledVector(worldNormal, 0.012);
  }

  marker.visible = true;
}
```

For a marker that must stay attached while the model animates, store the hit's local-space position and transform it with the target each frame, or parent a marker to a stable surface node. A one-time world-space placement will not follow later object movement.

### Pattern 7: Keyboard-accessible object selection

**Use when:** Important 3D targets are also meaningful controls, rather than purely decorative details.

Raycasting alone is not accessible. Provide a DOM control or semantic list that mirrors the selectable scene objects. Keyboard focus and DOM activation should update the same application selection state as pointer selection.

```html
<nav aria-label="Choose a project">
  <button type="button" data-project="aurora">Aurora</button>
  <button type="button" data-project="orbit">Orbit</button>
  <button type="button" data-project="form">Form</button>
</nav>
```

```js
document.querySelectorAll('[data-project]').forEach((button) => {
  button.addEventListener('click', () => {
    selectProject(button.dataset.project);
  });
});
```

Keep the DOM and 3D scene synchronized from one source of truth. Do not make a canvas the only way to discover or activate a key action. For touch devices, provide clear tap targets and avoid relying on hover to reveal essential information.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Computing NDC from the full window | A tutorial assumes a full-screen canvas | Use `canvas.getBoundingClientRect()` and canvas-relative coordinates |
| Raycasting every scene object | It is convenient during prototyping | Maintain a curated interactive-object list or interaction layer |
| Assuming `hits[0]` is always the intended target | Intersections are distance-sorted, but application semantics may differ | Resolve semantic roots and define occlusion/click-through policy |
| Using one boolean for hover and selection | State appears simple at first | Track hover, focus, and selection separately |
| Replacing materials on every pointer move | Event logic mixes state and presentation | Apply transitions only when the target changes; reuse materials |
| Ignoring camera movement | The pointer may not emit new events while the view changes | Invalidate hit testing on control changes or moving targets |
| Selecting after a drag | Pointer down/up also happen during drags | Compare movement against a CSS-pixel threshold |
| Using instance index as a permanent ID | Instanced mesh slots are storage positions | Maintain and update an explicit instance-to-data mapping |
| Leaving stale objects in target arrays | Removed scene objects remain candidates | Unregister roots when disposing or replacing models |
| Forgetting touch and keyboard users | Hover-first prototypes hide core functionality | Provide tap-friendly feedback and equivalent DOM controls |
| Creating a tooltip from raw pointer coordinates | Pointer position may not match the actual surface hit | Project the intersection's world point when surface anchoring is required |
| Mutating geometry or material for every target without ownership rules | Shared resources may affect multiple meshes | Decide whether resources are shared or cloned and dispose owned resources carefully |

## Mental Models

1. **A raycast is a query.** It reports geometry intersections; your application decides what those hits mean.
2. **The nearest hit is not always the correct action.** Occlusion and target priority are product rules.
3. **Semantic roots beat mesh-level state.** Treat a complex model as one interaction target unless child-level behavior is intentional.
4. **Hover is ephemeral; selection persists.** Keep transient feedback separate from application state.
5. **Coordinates have a coordinate system.** Convert from the canvas rectangle, not an assumed full-screen viewport.
6. **Interaction needs invalidation.** Camera and object movement can change hits even when the pointer is stationary.
7. **Accessibility belongs beside the canvas.** Important actions need keyboard and touch equivalents, not just a ray.

## Quick Reference

| Need | Recommended approach |
|---|---|
| Convert pointer to ray | Canvas-relative NDC + `raycaster.setFromCamera()` |
| Find interactive hits | `intersectObjects(interactiveRoots, true)` |
| Resolve GLTF child to target | Walk ancestors or use a `WeakMap` registry |
| Filter raycast candidates | Curated arrays and/or object layers |
| Prevent hover flicker | Compare next target with current target |
| Distinguish click from drag | Record pointer-down position and apply a movement threshold |
| Anchor a tooltip | Project `hit.point` through the camera |
| Select an instance | Use `hit.instanceId` to retrieve application data |
| Place a surface marker | Use `hit.point` and transformed face normal |
| Support keyboard access | Mirror scene targets with semantic DOM controls |
| Keep interactions responsive | Query on demand and invalidate on pointer/camera/object changes |
| Clean up removed targets | Unregister references and dispose only resources you own |

## Build Challenge

### Build a 3D Portfolio Explorer

Create a small Three.js portfolio scene with three floating project cards or 3D objects. The user must be able to hover, select, and explore each project without accidental clicks or flickering.

**Requirements**

1. Create a scene with a perspective camera, renderer, and three named interactive objects.
2. Convert pointer coordinates using the canvas bounding rectangle so the scene works inside a page section, not only full-screen.
3. Register semantic interaction roots and resolve intersections from child meshes to their parent target.
4. Add a stable hover transition that runs only when the hovered target changes.
5. Add click selection and ignore pointer gestures that move farther than a six-pixel drag threshold.
6. Display a DOM tooltip or panel with the selected project's title and description.
7. Make the same projects selectable from a keyboard-accessible list of HTML buttons.
8. Add a decorative object that is excluded from hit testing, and explain why it should not intercept clicks.
9. Ensure camera movement invalidates hit testing even when the pointer remains still.
10. Clean up event listeners and unregister interaction roots when the scene is destroyed.

**Definition of done**

- Hover feedback changes once on enter and once on leave, without repeated material creation.
- Clicking a project selects the correct semantic object; dragging the camera does not select it.
- The scene works when the canvas is not aligned to the top-left of the browser window.
- Keyboard users can select every project without interacting with the canvas.
- The implementation clearly separates ray queries, interaction state, and visual presentation.
- The README explains the occlusion policy and how to add a fourth project.

Aim to finish the core implementation in one focused session. Prioritize predictable interaction and clear state ownership before adding elaborate animation.
