# SKILL: threejs-instancing

**Layer:** 06 — Three.js / WebGL

**Goal:** Use `THREE.InstancedMesh` to render large numbers of repeated objects with fewer draw calls while preserving per-instance transforms, identity, and interaction.

## Why This Matters (Senior Perspective)

A scene with hundreds of visually similar objects can become CPU-bound even when each object is simple. Rendering one mesh per object often creates a large number of draw calls, and the CPU must repeatedly prepare and submit that work to the GPU. `THREE.InstancedMesh` lets many objects share one geometry and one material while storing a different transform for each instance. The result can dramatically reduce draw-call overhead for repeated objects such as portfolio tiles, product arrays, particles, vegetation, stars, architectural details, or data visualizations.

Instancing is not a magic switch that makes every scene fast. Instances in a single `InstancedMesh` share geometry and material, and per-instance variation requires deliberate mechanisms such as instance colors or shader customization. You also need to maintain a reliable mapping between instance indices and application data. If a list is reordered without updating that mapping, a user can click one visible object and open a different record. Large instance counts can still be expensive because of fragment shading, shadows, transparency, overdraw, or oversized bounds.

Senior-level use begins with profiling and a clear ownership model. Decide which objects truly share geometry and material, how instance transforms will be updated, whether raycasting is required, how bounds are maintained, and when the batch should be split into spatial or material groups. Optimize the bottleneck you measured rather than instancing everything by default.

## Core Concepts

### 1. One geometry, one material, many transforms

Think of an `InstancedMesh` as a batch of repeated copies. Each instance has a transform matrix, but all instances use the mesh's shared geometry and material. This is ideal when the visual shape is repeated and only position, rotation, scale, or instance color varies.

```js
import * as THREE from 'three';

const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const material = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  roughness: 0.55,
  metalness: 0.1,
});

const count = 500;
const instances = new THREE.InstancedMesh(geometry, material, count);
const dummy = new THREE.Object3D();

for (let i = 0; i < count; i += 1) {
  dummy.position.set(
    (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * 12,
    (Math.random() - 0.5) * 30
  );
  dummy.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );

  const scale = 0.35 + Math.random() * 0.8;
  dummy.scale.setScalar(scale);
  dummy.updateMatrix();

  // Store the per-instance transform in the GPU-backed instance matrix attribute.
  instances.setMatrixAt(i, dummy.matrix);
}

instances.instanceMatrix.needsUpdate = true;
scene.add(instances);
```

The draw-call reduction is most useful when the instances share the same material and geometry. A batch with multiple materials or incompatible render states may need separate meshes or a more advanced material design.

### 2. The instance matrix is local to the batch

Each instance matrix describes the instance relative to the `InstancedMesh` object's transform. Moving the batch moves every instance. Moving a single instance requires updating that instance's matrix, not assigning a new `position` to a child mesh.

```js
const index = 12;
const nextTransform = new THREE.Object3D();

instances.getMatrixAt(index, nextTransform.matrix);
nextTransform.matrix.decompose(
  nextTransform.position,
  nextTransform.quaternion,
  nextTransform.scale
);

nextTransform.position.y += 1.5;
nextTransform.updateMatrix();
instances.setMatrixAt(index, nextTransform.matrix);
instances.instanceMatrix.needsUpdate = true;
```

For repeated edits, keep a reusable `Object3D` or compose matrices directly. Avoid allocating a new helper object on every animation frame. Remember that the matrix is relative to the instanced mesh; if you calculate a world-space transform, convert it to the batch's local space first.

### 3. Instance color is a variation channel

An instanced mesh can store a color per instance. This allows one shared material to display a different tint for each copy without creating a material for every object.

```js
const colors = [
  new THREE.Color('#8b5cf6'),
  new THREE.Color('#22d3ee'),
  new THREE.Color('#f59e0b'),
];

for (let i = 0; i < count; i += 1) {
  instances.setColorAt(i, colors[i % colors.length]);
}

if (instances.instanceColor) {
  instances.instanceColor.needsUpdate = true;
}
```

Keep the material's base color neutral or white if you want instance colors to read clearly; the final appearance combines material and instance color. Creating a separate material for every instance defeats much of the batching benefit and increases resource management complexity.

### 4. Dynamic updates require explicit GPU synchronization

After calling `setMatrixAt()` or `setColorAt()`, mark the corresponding attribute as needing an upload. If transforms change frequently, set the usage hint before the first render to communicate the expected update pattern.

```js
const movingInstances = new THREE.InstancedMesh(geometry, material, count);

// Set usage before the attribute is first used by the renderer.
movingInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

function moveInstance(index, position) {
  dummy.position.copy(position);
  dummy.updateMatrix();

  movingInstances.setMatrixAt(index, dummy.matrix);
  movingInstances.instanceMatrix.needsUpdate = true;
}
```

Calling `needsUpdate` signals that data changed; it does not make the update free. Uploading a large matrix buffer every frame can still cost time. For a large animated field, update only when needed, consider shader-driven motion for highly regular animation, and benchmark the actual scene.

### 5. Instance indices are storage slots, not permanent identities

Raycasting an `InstancedMesh` can return `intersection.instanceId`. This is the index into the current instance batch. It should not be treated as a durable project ID, database key, or identity that survives sorting and compaction.

```js
const recordsByInstance = [
  { id: 'case-study-aurora', title: 'Aurora' },
  { id: 'case-study-orbit', title: 'Orbit' },
  { id: 'case-study-form', title: 'Form' },
];

function onInstanceHit(intersection) {
  const index = intersection.instanceId;
  if (index === undefined) return;

  const record = recordsByInstance[index];
  if (!record) return;

  openCaseStudy(record.id);
}
```

If you remove or reorder instances, update the data array and every related selection, color, animation, and transform mapping atomically. When stable identity matters, use an explicit ID-to-slot map and keep it synchronized with the batch.

### 6. Bounds and culling are part of correctness

Three.js uses bounding volumes for frustum culling and raycast acceleration. When instance transforms change substantially after the initial bounds are computed, recompute the bounding box or sphere as appropriate. Otherwise a batch may disappear at the edge of the camera view or fail to be considered where expected.

```js
// Recalculate after a large batch transform update or when instances are moved
// beyond the previous extent; do not do this unnecessarily every frame.
instances.computeBoundingBox();
instances.computeBoundingSphere();
```

For a scene with continuously moving instances, updating bounds every frame can become another cost. Consider splitting instances into spatial batches so each batch has a tighter bound, or use a predictable envelope when the movement range is known.

### 7. Instance transforms are not child objects

An `InstancedMesh` does not create a separate scene-graph `Mesh` for every instance. You cannot attach independent event listeners, children, or arbitrary per-instance material objects to each copy. Use instance attributes, custom shader attributes, lookup tables, or separate meshes for the small subset that needs unique behavior.

This is a useful design boundary: instance repeated visual content; keep semantic state in application data. If one object needs a unique articulated hierarchy, unique geometry, or complex independent animation, it may belong outside the instanced batch.

## Advanced Patterns

### Pattern 1: Deterministic grid with stable record mapping

**Use when:** Building a portfolio wall, product catalog, or visual index where each instance corresponds to a known item.

```js
const projects = [
  { id: 'aurora', title: 'Aurora', color: '#8b5cf6' },
  { id: 'orbit', title: 'Orbit', color: '#22d3ee' },
  { id: 'form', title: 'Form', color: '#f59e0b' },
  { id: 'signal', title: 'Signal', color: '#34d399' },
];

const cardGeometry = new THREE.BoxGeometry(1.2, 1.6, 0.12);
const cardMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
const cards = new THREE.InstancedMesh(
  cardGeometry,
  cardMaterial,
  projects.length
);
cards.instanceMatrix.setUsage(THREE.StaticDrawUsage);

const cardTransform = new THREE.Object3D();
const idToIndex = new Map();

projects.forEach((project, index) => {
  const column = index % 2;
  const row = Math.floor(index / 2);

  cardTransform.position.set(column * 1.7 - 0.85, 1.2 - row * 2, 0);
  cardTransform.rotation.y = column === 0 ? 0.08 : -0.08;
  cardTransform.updateMatrix();

  cards.setMatrixAt(index, cardTransform.matrix);
  cards.setColorAt(index, new THREE.Color(project.color));
  idToIndex.set(project.id, index);
});

cards.instanceMatrix.needsUpdate = true;
if (cards.instanceColor) cards.instanceColor.needsUpdate = true;
scene.add(cards);

function selectCardIntersection(hit) {
  if (hit.object !== cards || hit.instanceId === undefined) return;
  const project = projects[hit.instanceId];
  if (project) openProjectPanel(project);
}
```

Keep `projects[index]` and the instance slot aligned. If the list is filtered or sorted, rebuild the batch or maintain an explicit slot map rather than assuming previous indices still apply.

### Pattern 2: Hover highlighting without per-instance materials

**Use when:** A large set of instances needs hover feedback.

Store the original per-instance color, then temporarily replace the hovered instance's color. Restore the previous instance when hover changes.

```js
const baseColors = projects.map((project) => new THREE.Color(project.color));
const hoverColor = new THREE.Color('#ffffff');
let hoveredIndex = -1;

function setHoveredInstance(nextIndex) {
  if (hoveredIndex === nextIndex) return;

  if (hoveredIndex >= 0 && baseColors[hoveredIndex]) {
    cards.setColorAt(hoveredIndex, baseColors[hoveredIndex]);
  }

  hoveredIndex = nextIndex;

  if (hoveredIndex >= 0) {
    cards.setColorAt(hoveredIndex, hoverColor);
  }

  if (cards.instanceColor) cards.instanceColor.needsUpdate = true;
}
```

This assumes each instance's original tint is represented by `baseColors`. If hover should preserve the project's color, use a calculated highlight color or a separate highlight layer. For extremely large numbers of frequent changes, benchmark attribute updates and consider shader-based hover state.

### Pattern 3: Animate a selected instance

**Use when:** One repeated object needs a small lift, scale pulse, or rotation while the rest remain in one batch.

```js
const originalMatrices = [];
const transform = new THREE.Object3D();

for (let i = 0; i < cards.count; i += 1) {
  const matrix = new THREE.Matrix4();
  cards.getMatrixAt(i, matrix);
  originalMatrices.push(matrix.clone());
}

function setInstanceLift(index, lift) {
  if (index < 0 || index >= cards.count) return;

  originalMatrices[index].decompose(
    transform.position,
    transform.quaternion,
    transform.scale
  );

  // Apply the lift in the batch's local coordinate system.
  transform.position.y += lift;
  transform.updateMatrix();
  cards.setMatrixAt(index, transform.matrix);
  cards.instanceMatrix.needsUpdate = true;
}
```

Always derive each animation from the stored base transform instead of repeatedly adding to the current matrix. Repeated incremental edits can accumulate drift. For continuous motion, calculate the target transform from a stable base matrix and current animation time.

### Pattern 4: Spatial batching for large worlds

**Use when:** A single batch covers a huge area and becomes difficult to cull efficiently.

Split instances into batches by region, room, or grid cell. Each batch can then be culled independently and have a tighter bounding volume. This can increase draw calls slightly but reduce invisible geometry processing and improve interaction locality.

```js
function cellKey(x, z, cellSize) {
  const cellX = Math.floor(x / cellSize);
  const cellZ = Math.floor(z / cellSize);
  return `${cellX}:${cellZ}`;
}

function groupRecordsByCell(records, cellSize) {
  const cells = new Map();

  for (const record of records) {
    const key = cellKey(record.position.x, record.position.z, cellSize);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(record);
  }

  return cells;
}
```

Build one instanced batch per cell and preserve a per-cell slot map. Choose cell size based on camera scale, object density, and profiling—not an arbitrary universal number. Avoid one enormous batch when only a tiny portion of the world is visible at any time.

### Pattern 5: Raycast an instanced batch and resolve the record

**Use when:** Users need to click one instance in a large repeated field.

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function pointerToNDC(event, canvas) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickInstance(event, canvas, camera, instancedMesh, records) {
  pointerToNDC(event, canvas);
  raycaster.setFromCamera(pointer, camera);

  const hit = raycaster.intersectObject(instancedMesh, false)[0];
  if (!hit || hit.instanceId === undefined) return null;

  return records[hit.instanceId] ?? null;
}
```

For very dense scenes, do not assume GPU draw-call efficiency automatically makes CPU raycasting cheap. Restrict candidates, use spatial batches, and profile pointer-driven picking under realistic instance counts.

### Pattern 6: Shader-driven variation for highly regular motion

**Use when:** Thousands of instances follow the same procedural motion, such as a wave, pulse, or slow oscillation.

CPU-updating every matrix can create a large upload workload. When motion can be described by a formula, a custom shader can derive the offset from per-instance data and time. This is an advanced route: it requires modifying the material shader carefully and preserving compatibility with the Three.js version and render pipeline.

Conceptual vertex-shader logic:

```glsl
// Conceptual GLSL: integrate with the material's instance transform pipeline.
// `instanceSeed` and `uTime` must be declared and wired as shader inputs.
float wave = sin(uTime * 0.8 + instanceSeed * 6.2831);
transformed.y += wave * 0.15;
```

Do not paste this snippet into a standalone Three.js material and expect it to run by itself. It illustrates the calculation only; a working implementation must inject or implement the relevant shader declarations and ensure the displacement occurs in the correct coordinate space. Prefer ordinary matrix updates for modest counts or irregular per-instance animation.

### Pattern 7: Safe disposal and batch replacement

**Use when:** Switching catalog data, unloading a scene section, or rebuilding a batch after filtering.

```js
function disposeInstancedBatch(batch, { disposeGeometry = false, disposeMaterial = false } = {}) {
  batch.removeFromParent();

  // Dispose only resources this batch owns; shared resources may be used elsewhere.
  if (disposeGeometry) batch.geometry.dispose();

  if (disposeMaterial) {
    const materials = Array.isArray(batch.material)
      ? batch.material
      : [batch.material];

    materials.forEach((material) => material.dispose());
  }
}
```

An instanced mesh owns its instance attributes, but its geometry and material may be shared. Make ownership explicit before disposal. Disposing a shared material can break other objects that still use it.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Instancing objects with unrelated geometry or materials | Draw-call reduction is mistaken for a universal optimization | Batch only compatible repeated geometry/material combinations |
| Forgetting `instanceMatrix.needsUpdate` | CPU-side data changes are not automatically uploaded as expected | Mark changed attributes for update |
| Forgetting `instanceColor.needsUpdate` | Instance tint changes appear not to work | Mark the color attribute dirty after edits |
| Treating `instanceId` as a permanent ID | The index looks like a unique identifier | Map the current slot to a stable application ID |
| Creating one material per instance | Object-oriented patterns are applied without considering batching | Use instance colors or custom shader data |
| Updating every matrix every frame | Simple CPU animation is extended to thousands of instances | Update only changed instances or move regular animation to shaders |
| Ignoring bounds after large moves | The original bounding volume no longer covers the batch | Recompute bounds or partition instances spatially |
| Using one huge batch across a large world | Fewer draw calls are prioritized over culling | Split into spatially coherent batches |
| Mutating current matrices incrementally | Small errors accumulate across frames | Animate from stored base transforms |
| Disposing shared geometry or material | Batch lifecycle is confused with resource ownership | Track ownership and dispose only resources the batch owns |
| Assuming instancing removes all rendering costs | GPU fill rate, shadows, and overdraw remain | Profile CPU and GPU bottlenecks separately |
| Losing the data mapping after sorting | Instance order and record order diverge | Rebuild mapping atomically with transforms and colors |

## Mental Models

1. **Instancing trades scene-graph objects for data.** The repeated copies live in per-instance attributes rather than independent meshes.
2. **Batch by shared render state.** Geometry and material compatibility determine what can share a batch.
3. **An index is a slot, not an identity.** Keep stable application IDs separate from instance indices.
4. **Fewer draw calls are not automatically faster.** Culling, overdraw, shadows, and buffer updates still matter.
5. **Animate from a stable base.** Recompute transforms from known starting data instead of accumulating changes.
6. **Bounds affect visibility.** A stale bounding volume can cause incorrect culling and picking.
7. **Ownership governs disposal.** Shared resources must outlive every batch that uses them.

## Quick Reference

| Need | Recommended approach |
|---|---|
| Render many repeated objects | `THREE.InstancedMesh(geometry, material, count)` |
| Set a transform | `setMatrixAt(index, matrix)` |
| Read a transform | `getMatrixAt(index, matrix)` |
| Set instance tint | `setColorAt(index, color)` |
| Upload matrix changes | `instanceMatrix.needsUpdate = true` |
| Upload color changes | `instanceColor.needsUpdate = true` |
| Frequent matrix updates | Set `instanceMatrix.setUsage(THREE.DynamicDrawUsage)` before first render |
| Identify a raycast hit | `intersection.instanceId` |
| Preserve stable identity | Map instance slot to an application record ID |
| Refresh culling bounds | `computeBoundingBox()` and `computeBoundingSphere()` |
| Improve large-world culling | Split batches by spatial region |
| Animate regular large-scale motion | Consider shader-driven motion after profiling |
| Remove a batch | `removeFromParent()` and dispose only owned resources |

## Build Challenge

### Build an Interactive Instanced Portfolio Wall

Create a 3D wall containing at least 300 repeated portfolio cards. The wall should feel interactive while keeping the scene manageable and maintaining correct project identity.

**Requirements**

1. Create an `InstancedMesh` using shared card geometry and material.
2. Generate deterministic positions so the wall layout is reproducible between reloads.
3. Assign a different instance color based on each project's metadata.
4. Maintain a stable mapping from instance slot to project ID.
5. Raycast the instanced mesh and display the correct project title when a card is selected.
6. Highlight the hovered instance without creating per-instance materials.
7. Animate a selected card from its stored base transform without cumulative drift.
8. Split the wall into spatial batches if the scene spans enough space for culling to matter.
9. Update instance attributes and bounds correctly when transforms change.
10. Implement cleanup that removes the batch and disposes only resources owned by the wall.

**Definition of done**

- At least 300 cards render using a small number of instanced batches rather than 300 independent meshes.
- Selecting a visible card always opens the record associated with that instance.
- Hover feedback restores the original color when the pointer leaves.
- Repeated selection and animation do not cause transform drift.
- The implementation explains its batching strategy and identifies the trade-off between draw calls and spatial culling.
- The project includes a short profiling note comparing the instanced approach with a naïve one-mesh-per-card version.

Aim to complete the core wall in one focused session. First establish correct batching and data mapping; add elaborate shaders only after the interaction and performance model is sound.
