# SKILL: threejs-geometry

**Layer:** 06 — Three.js / WebGL  
**Goal:** Design, generate, optimize, and compose Three.js geometry that communicates a clear visual idea while respecting GPU memory, draw-call budgets, and animation requirements.

## Why This Matters (Senior Perspective)

Geometry is the actual shape of a 3D scene, but senior creative developers do not treat it as “pick a primitive and make it big.” They choose the smallest and most appropriate representation that can produce the intended silhouette, surface detail, motion, and interaction. A portfolio hero may need a clean silhouette at a distance, a product configurator may need accurate bevels and openings, and a field of hundreds of decorative objects may need one shared geometry rather than hundreds of independently rebuilt meshes. The right representation makes the visual work easier; the wrong one creates complexity that materials, lighting, and post-processing cannot rescue.

The common failure is adding polygons until a model looks better in one screenshot, then discovering that it is slow on mobile, difficult to animate, or expensive to update. Another is confusing geometry detail with perceived detail: a surface can often look rich through lighting, roughness, normal maps, or shader effects without adding more vertices. Conversely, a hero object with a poor silhouette cannot be fixed by a high-resolution texture. Treat geometry as a budget: spend vertices where the outline or deformation needs them, reuse data wherever possible, and profile the real scene rather than guessing.

For freelance and award-level creative work, geometry is also a communication tool. A custom shape can become the identity of an interaction; a carefully beveled object can make a product feel tangible; a procedural field can support scroll choreography without downloading a huge model. The senior habit is to decide what the camera will reveal, what needs to move, and what the user can inspect before choosing a geometry strategy.

## Core Concepts

### 1. Geometry is a collection of GPU attributes

A `BufferGeometry` is not a magical solid. It is a set of typed arrays describing vertex attributes such as positions, normals, UVs, and optional colors, plus an optional index that lets triangles share vertices. The GPU renders triangles. Your job is to provide coherent vertex data and enough information for shading and texturing.

A position is usually three numbers `(x, y, z)` per vertex. A normal is another three numbers that describes the surface direction used by lighting. UV coordinates map surface points to a 2D texture. An index buffer says which vertices form each triangle. This mental model matters because changing positions can alter shape, but changing normals changes how light responds, and changing UVs changes texture placement.

```js
import * as THREE from 'three';

const positions = new Float32Array([
  -1, -1, 0,
   1, -1, 0,
   1,  1, 0,
  -1,  1, 0,
]);

const uvs = new Float32Array([
  0, 0,
  1, 0,
  1, 1,
  0, 1,
]);

// Two triangles share the same four vertices, reducing duplicate vertex data.
const indices = [0, 1, 2, 0, 2, 3];

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
geometry.setIndex(indices);
geometry.computeVertexNormals();

const mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ color: '#c8a6ff', side: THREE.DoubleSide })
);
scene.add(mesh);
```

Use `computeVertexNormals()` when your topology should shade smoothly across shared vertices. It averages adjacent face normals at shared vertices; that is useful for smooth surfaces, but it can soften edges that should remain crisp. For flat shading, use a material with `flatShading: true` or duplicate vertices per face when you need independent normals or UV seams.

### 2. Choose primitives by silhouette and purpose

Built-in geometries are not just convenient placeholders; they encode common topology and UV layouts. Choose them based on the object’s visible silhouette and the kind of deformation you need.

- `BoxGeometry`: architectural blocks, cards, cubes, hard-surface layouts.
- `SphereGeometry`: planets, bubbles, organic placeholders, radial motion.
- `TorusGeometry`: rings, orbital motifs, UI accents.
- `CylinderGeometry` / `ConeGeometry`: columns, caps, funnels, stylized hardware.
- `PlaneGeometry`: floors, backdrops, cards, shader surfaces.
- `RingGeometry`: flat rings and radial UI.
- `IcosahedronGeometry`: faceted low-poly forms and stylized rocks.
- `TorusKnotGeometry`: decorative procedural forms; use sparingly because its busy silhouette can compete with typography.

```js
const heroGroup = new THREE.Group();

const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.15, 2),
  new THREE.MeshStandardMaterial({
    color: '#8a5cff',
    roughness: 0.32,
    metalness: 0.28,
    flatShading: false,
  })
);

const orbit = new THREE.Mesh(
  new THREE.TorusGeometry(1.75, 0.018, 8, 120),
  new THREE.MeshBasicMaterial({ color: '#f1d6ff' })
);
orbit.rotation.x = Math.PI * 0.42;

heroGroup.add(core, orbit);
scene.add(heroGroup);
```

The primitive’s constructor segments are a quality/performance control. A sphere with 128 horizontal segments may be wasted if it occupies 40 pixels. A close-up reflective product may need more subdivisions to preserve a smooth highlight. Tune subdivisions based on camera distance and motion, not on habit.

### 3. Vertex sharing, indices, and hard edges

Indexed geometry reuses vertex records across triangles. This usually reduces memory and can improve vertex processing, but one shared vertex can only store one normal and one UV coordinate. At a hard edge or UV seam, a logical point may need multiple vertex records so each side can have its own normal or UV.

Naive approach: use one shared vertex at every corner, compute smooth normals, and expect a cube to look like a manufactured object. The result often has rounded-looking shading because each corner averages normals from adjacent faces.

Correct approach: use `BoxGeometry` with flat shading for a simple cube, or create separate vertices per face when custom face colors, sharp normals, or unique UVs are required.

```js
const hardSurface = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 1.6, 1.6),
  new THREE.MeshStandardMaterial({
    color: '#d7dce8',
    roughness: 0.42,
    metalness: 0.18,
    flatShading: true,
  })
);
scene.add(hardSurface);
```

For a smooth organic object, shared vertices and averaged normals are often desirable. For bevels, use actual bevel geometry or a bevel-capable modeling workflow rather than hoping normal averaging will create a physical edge. Shading cannot change the silhouette.

### 4. Segment counts are a screen-space decision

Geometry density should be based on the object’s projected size, the curvature of the silhouette, the camera distance, and whether the object moves. More segments reduce visible faceting, but they increase vertex processing, memory, and sometimes upload or deformation cost.

A practical rule: increase segments until the silhouette and specular highlights look clean at the largest expected on-screen size, then stop. A reflective surface can reveal faceting earlier than a matte one because highlights exaggerate changes in surface normals.

```js
function createQualitySphere(detail = 'high') {
  const segments = {
    low: [16, 12],
    medium: [32, 24],
    high: [48, 32],
  }[detail] ?? [32, 24];

  return new THREE.SphereGeometry(1, segments[0], segments[1]);
}

const sphere = new THREE.Mesh(
  createQualitySphere(window.innerWidth < 700 ? 'medium' : 'high'),
  new THREE.MeshStandardMaterial({ color: '#70d6ff', roughness: 0.25 })
);
scene.add(sphere);
```

Do not rebuild geometry on every resize just because the viewport changed. Often the same mesh can be scaled or the camera adjusted. If you do switch geometry quality, dispose of the old geometry after replacing it, and avoid rebuilding during continuous resize events without debouncing.

### 5. Geometry transforms versus editing vertices

A mesh has an object transform (position, rotation, scale) and geometry-local vertex data. Prefer object transforms for whole-object movement and scaling. Edit vertex positions when you need deformation: waves, morph-like motion, custom profiles, or procedural shape generation.

```js
const geometry = new THREE.PlaneGeometry(6, 3, 80, 40);
const position = geometry.getAttribute('position');
const original = position.array.slice();

for (let i = 0; i < position.count; i++) {
  const x = original[i * 3];
  const y = original[i * 3 + 1];

  // The surface remains a stable grid; only its local height is deformed.
  position.array[i * 3 + 2] = Math.sin(x * 1.4) * Math.cos(y * 1.8) * 0.18;
}

position.needsUpdate = true;
geometry.computeVertexNormals();
```

For repeated animation, keep the original positions in a separate typed array and derive each frame from those originals. Do not add a wave offset to the already-deformed value every frame; that accumulates drift and makes the shape unstable. If deformation is large, update normals deliberately because stale normals cause lighting to look detached from the surface.

### 6. Bounding volumes and culling

Three.js uses bounding spheres and boxes for frustum culling and some spatial queries. If you mutate vertex positions outside the geometry’s original bounds, recompute the bounds so the renderer does not incorrectly cull the object. The cost of computing bounds is usually small compared with debugging an object that vanishes at certain camera angles.

```js
const geometry = new THREE.SphereGeometry(1, 32, 24);
const position = geometry.getAttribute('position');

for (let i = 0; i < position.count; i++) {
  const x = position.getX(i);
  const y = position.getY(i);
  const z = position.getZ(i);
  const factor = 1 + 0.12 * Math.sin(x * 7 + y * 4 + z * 5);
  position.setXYZ(i, x * factor, y * factor, z * factor);
}

position.needsUpdate = true;
geometry.computeVertexNormals();
geometry.computeBoundingSphere();
geometry.computeBoundingBox();
```

When vertex animation changes bounds every frame, recomputing bounds every frame can become costly. For predictable deformation, set a conservative bound once; for a small decorative object that never leaves view, consider `frustumCulled = false` only after measuring and understanding the trade-off.

### 7. Dispose geometry when its lifetime ends

GPU resources are not freed merely because a mesh is removed from a scene. Geometry and material resources should be disposed when they are no longer needed, especially in route transitions, interactive product variants, and repeated scene mounts.

```js
function disposeMesh(mesh) {
  // Remove scene ownership first so it is no longer rendered.
  mesh.parent?.remove(mesh);

  mesh.geometry?.dispose();

  const materials = Array.isArray(mesh.material)
    ? mesh.material
    : [mesh.material];

  for (const material of materials) {
    material?.dispose();
  }
}
```

Do not dispose a shared geometry while other meshes still use it. A senior scene keeps a clear ownership rule: either the component owns a resource and disposes it, or a shared asset manager owns it and disposes it only after all consumers are done. Textures are separate GPU resources and need their own lifecycle.

## Advanced Patterns

### Pattern 1: Geometry factory with explicit quality tiers

Use this when a hero object needs desktop and mobile quality settings, or when a component is reused across multiple pages. Centralizing segment choices avoids inconsistent tuning and makes profiling easier.

```js
import * as THREE from 'three';

const QUALITY = {
  low: { radial: 16, vertical: 12 },
  medium: { radial: 32, vertical: 24 },
  high: { radial: 64, vertical: 48 },
};

export function createOrbGeometry(level = 'medium') {
  const { radial, vertical } = QUALITY[level] ?? QUALITY.medium;
  return new THREE.SphereGeometry(1, radial, vertical);
}

export function createOrb(level = 'medium') {
  const geometry = createOrbGeometry(level);
  const material = new THREE.MeshPhysicalMaterial({
    color: '#b59aff',
    roughness: 0.28,
    metalness: 0.12,
    clearcoat: 0.7,
  });

  return new THREE.Mesh(geometry, material);
}
```

Why it works: the factory makes quality a named decision, not a scattered magic number. It also gives you a single place to compare silhouette quality and resource cost. In a production app, pass the quality tier from a device/performance policy rather than checking user-agent strings in every component.

### Pattern 2: Stable procedural deformation

Use this for liquid-like panels, terrain, abstract portfolio surfaces, or subtle animated meshes. The key is to calculate every frame from immutable base positions, then mark the attribute dirty once.

```js
import * as THREE from 'three';

export function createWaveSurface() {
  const geometry = new THREE.PlaneGeometry(8, 4, 100, 60);
  const position = geometry.getAttribute('position');
  const base = position.array.slice();

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: '#5c65ff',
      roughness: 0.55,
      metalness: 0.08,
      side: THREE.DoubleSide,
    })
  );

  function update(timeSeconds) {
    const array = position.array;

    for (let i = 0; i < position.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];

      array[i * 3] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] =
        Math.sin(x * 1.3 + timeSeconds * 0.8) * 0.14 +
        Math.cos(y * 1.7 - timeSeconds * 0.55) * 0.1;
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    // The surface stays inside a known envelope, so a conservative bound is sufficient.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 5);
  }

  return { mesh, update };
}
```

The deformation is stable because it never uses the previous frame’s output as the next frame’s input. `computeVertexNormals()` is straightforward but can be expensive on dense geometry; for high-frequency deformation, reduce subdivisions, update less often, or use a shader when CPU-side vertex writes become a bottleneck.

### Pattern 3: Parametric surface from a function

Use a parametric surface when a shape can be described by two parameters, such as a ripple sheet, a curved ribbon, or a custom organic panel. You define a mapping from `(u, v)` to `(x, y, z)` and sample it into a grid.

```js
import * as THREE from 'three';

export function createParametricGrid(uSegments = 80, vSegments = 40) {
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let v = 0; v <= vSegments; v++) {
    for (let u = 0; u <= uSegments; u++) {
      const fu = u / uSegments;
      const fv = v / vSegments;

      const x = (fu - 0.5) * 6;
      const y = (fv - 0.5) * 3;
      // Parameter space maps to a gently curved physical surface.
      const z = Math.sin(fu * Math.PI * 2) * 0.35 +
                Math.cos(fv * Math.PI * 2) * 0.15;

      positions.push(x, y, z);
      uvs.push(fu, fv);
    }
  }

  for (let v = 0; v < vSegments; v++) {
    for (let u = 0; u < uSegments; u++) {
      const a = v * (uSegments + 1) + u;
      const b = a + 1;
      const c = a + (uSegments + 1);
      const d = c + 1;

      // Consistent winding keeps the front faces oriented together.
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
```

If the surface appears invisible from one side, check triangle winding and material side before assuming the geometry failed. Winding determines front-face orientation. A double-sided material can help diagnose the issue, but do not use it as a substitute for understanding normals and triangle order.

### Pattern 4: Instanced geometry for repeated objects

Use this when the scene contains many identical shapes with different transforms, such as stars, particles, tiles, orbiting markers, or a product wall. One `InstancedMesh` can render many copies of the same geometry/material with far fewer draw calls than one mesh per object.

```js
import * as THREE from 'three';

export function createInstancedField(count = 500) {
  const geometry = new THREE.IcosahedronGeometry(0.08, 1);
  const material = new THREE.MeshStandardMaterial({
    color: '#9e8bff',
    roughness: 0.48,
    metalness: 0.12,
  });

  const field = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    dummy.position.set(
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 5
    );
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    const scale = 0.5 + Math.random() * 1.8;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    field.setMatrixAt(i, dummy.matrix);
  }

  field.instanceMatrix.needsUpdate = true;
  field.computeBoundingSphere();

  return field;
}
```

The trade-off is that all instances share the same geometry and material configuration, though per-instance colors and transforms are supported. If each object needs a unique material, animation logic, or independent lifecycle, instancing may not be the right abstraction. Use a seeded random generator if you need a reproducible art direction across reloads.

### Pattern 5: Merge static geometry to reduce draw calls

Use merged geometry for static architectural details or a cluster of objects that never move independently. Merging can reduce draw calls, but it sacrifices per-object transforms and independent visibility. In modern Three.js projects, use a supported geometry-merging utility such as `mergeGeometries` from the examples utilities, and ensure geometries have compatible attributes and material grouping.

```js
// Assumes mergeGeometries is imported from three/addons/utils/BufferGeometryUtils.js
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const pieces = [
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.BoxGeometry(0.5, 2, 0.5),
];

pieces[1].translate(1.2, 0, 0);

// Merge only when the pieces share a material and will move as one unit.
const merged = mergeGeometries(pieces, false);
if (!merged) {
  throw new Error('Geometry attributes are incompatible; normalize them before merging.');
}

const structure = new THREE.Mesh(
  merged,
  new THREE.MeshStandardMaterial({ color: '#c5c9d6', roughness: 0.7 })
);
scene.add(structure);
pieces.forEach((geometry) => geometry.dispose());
```

Do not merge objects that need separate hover states, independent animation, or frequent visibility changes. A single mesh can reduce draw calls while making interaction and culling less flexible.

### Pattern 6: Geometry LOD based on projected importance

Use levels of detail when a scene has many objects at different distances. A lower-resolution silhouette is often enough for distant objects, while a close hero object needs more subdivisions. Three.js provides `LOD`, but test the thresholds from the actual camera and scene scale.

```js
import * as THREE from 'three';

const lod = new THREE.LOD();

lod.addLevel(
  new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: '#a88cff', flatShading: true })
  ),
  0
);

lod.addLevel(
  new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 2),
    new THREE.MeshStandardMaterial({ color: '#a88cff', flatShading: false })
  ),
  8
);

lod.addLevel(
  new THREE.Mesh(
    new THREE.IcosahedronGeometry(1, 4),
    new THREE.MeshStandardMaterial({ color: '#a88cff', flatShading: false })
  ),
  20
);

scene.add(lod);
```

LOD is not automatically faster in every scene. It adds management complexity and can create visible popping if thresholds are poorly chosen. Use smooth transitions or hysteresis when popping is distracting, and prioritize LOD for scenes where geometry cost is a measured bottleneck.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Adding subdivisions without checking the camera | Detail feels like an easy quality upgrade | Tune to the largest projected size and silhouette |
| Expecting normals to change the silhouette | Lighting makes surfaces look rounded or sharp | Use actual geometry when the outline must change |
| Using smooth normals on a hard-surface object | Shared vertices average adjacent face normals | Use flat shading or split vertices at hard edges |
| Updating positions but not normals | Lighting still uses stale surface directions | Recompute normals or calculate them in a shader |
| Mutating already-mutated positions each frame | Deformation accumulates and drifts | Derive each frame from a saved base array |
| Forgetting bounds after deformation | Frustum culling uses stale bounds | Recompute bounds or set a conservative envelope |
| Rebuilding geometry on every resize | Resize is mistaken for a shape change | Resize renderer/camera first; rebuild only if needed |
| Disposing shared geometry too early | Resource ownership is unclear | Define who owns shared resources and when they are released |
| Creating one mesh per repeated decoration | Each mesh can add draw-call overhead | Use `InstancedMesh` or merge static compatible geometry |
| Merging interactive objects | Per-object behavior is lost | Merge only static objects that behave as one unit |
| Using `DoubleSide` to hide incorrect winding | It makes both sides render without fixing topology | Correct triangle indices and normals |
| Random procedural placement changes every refresh | Unseeded randomness makes art direction unstable | Use a seeded PRNG for repeatable layouts |

## Mental Models

1. **Triangles are the truth:** the renderer sees vertices, attributes, and triangles—not the object you imagined.
2. **Silhouette first:** if the outline is wrong, more texture or post-processing will not fix it.
3. **Normals shape light, not shape:** normals influence shading; positions define the actual surface.
4. **Screen-space budget:** add detail only when it survives projection into visible pixels.
5. **Immutable base, derived frame:** procedural animation should be computed from stable source data.
6. **Resource ownership:** removing a mesh is not the same as releasing its GPU resources.
7. **Reuse beats duplication:** shared geometry and instancing often outperform piles of equivalent meshes.

## Quick Reference

| Need | Recommended approach | Watch out for |
|---|---|---|
| Standard object | Built-in `BufferGeometry` subclass | Segment counts can be excessive |
| Custom shape | `BufferGeometry` with position/normal/UV attributes | Attribute lengths and triangle winding |
| Sharp edges | Flat shading or split vertices | Smooth normal averaging |
| Smooth organic surface | Shared vertices and computed normals | Normal recomputation cost |
| Procedural wave | Save base positions and derive each frame | Accumulating offsets |
| Many repeated objects | `InstancedMesh` | Shared material/geometry constraints |
| Static repeated structure | Merge compatible geometries | Loss of per-object interaction |
| Distant objects | `LOD` or lower segment counts | Popping and extra complexity |
| Deformed mesh disappears | Recompute or expand bounds | Stale bounding volumes |
| Remove a scene object | Remove and dispose owned resources | Shared resources must remain alive |

## Build Challenge

### Build a procedural “Orbit Sculpture” hero object

Create a Three.js hero visual for a creative developer portfolio: a custom curved surface surrounded by a ring of instanced low-poly elements. The geometry must be deliberate, reproducible, and efficient rather than a collection of arbitrary primitives.

1. Create a `BufferGeometry` parametric surface with at least 60 segments in one direction and 30 in the other. Use a function to produce a curved, wave-like profile.
2. Add a material with a deliberate shading choice. Verify whether smooth normals or flat shading best supports the art direction.
3. Create at least 300 small repeated elements with `InstancedMesh`; give each a reproducible position, rotation, and scale using a seeded random function.
4. Animate the surface from a stable base-position array. The animation must not accumulate drift across frames.
5. Update normals at an intentional frequency and establish safe bounds for the deformation.
6. Add a lower-detail representation or a quality tier for narrow screens. Do not rebuild geometry on every resize event.
7. Provide a cleanup function that removes the scene objects and disposes resources owned by the sculpture.
8. Keep the scene composition legible beside a large headline; the geometry should support the typography rather than compete with it.

**Expected output / definition of done**

- A working hero sculpture with a clearly readable silhouette and subtle procedural movement.
- At least 300 repeated elements rendered with instancing rather than hundreds of independent meshes.
- Stable motion over a one-minute run, with no deformation drift.
- No disappearance during camera movement due to stale bounds.
- Geometry density is justified by visible quality, not arbitrary high segment counts.
- A short note in the project README explaining the geometry choices, performance trade-offs, and resource ownership.
