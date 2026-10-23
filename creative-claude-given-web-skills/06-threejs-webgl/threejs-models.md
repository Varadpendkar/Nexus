# SKILL: threejs-models

**Layer:** 06 — Three.js / WebGL  
**Goal:** Import, inspect, animate, and optimize external 3D assets in Three.js while preserving material quality, predictable loading, and reliable resource cleanup.

## Why This Matters (Senior Perspective)

External models let a creative developer deliver product detail, character, architecture, and authored art direction that would be expensive or impractical to build from primitives. But importing a file is only the start. A model arrives with a hierarchy, transforms, materials, textures, animation clips, and often assumptions about scale and coordinate systems. If you treat it as one opaque mesh, you can lose the intended material setup, animate the wrong node, leak GPU resources during route changes, or ship a file that is much heavier than the experience can afford.

A frequent junior workflow is to download a model, load it with `GLTFLoader`, and immediately add it to the scene. It may appear tiny, face the wrong direction, use incorrect color settings, or fail because an external dependency was not configured. A more expensive failure is shipping a large unoptimized asset with many materials and high-resolution textures, then attempting to fix the frame rate by reducing unrelated scene effects. Senior practice is to inspect the asset before integration: verify scale, origin, hierarchy, polygon count, material count, texture resolution, animation clips, and licensing. Then decide whether to optimize the asset offline, simplify it, or use a different representation.

For a portfolio or client site, the model should support the story and interface. The camera may only show one side of a product; a complex hidden underside may not need the same detail. A model that appears for two seconds during a scroll transition should not necessarily be loaded at initial page render. The goal is not merely to make a model visible—it is to make it load at the right time, look correct, remain responsive, and leave no resource trail when it is no longer needed.

## Core Concepts

### 1. Prefer glTF / GLB for web delivery

glTF is designed for efficient runtime delivery of 3D scenes. `.gltf` commonly references external buffers and images; `.glb` packages scene data and resources into a single binary file. GLB is often convenient for a self-contained web asset, while glTF can be useful when separate resources or pipeline tooling are desired.

Three.js uses `GLTFLoader` from its addons. Addon imports should match the installed Three.js package version.

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const loader = new GLTFLoader();

loader.load(
  '/models/product.glb',
  (gltf) => {
    // gltf.scene is the root Object3D; it may contain many nested nodes.
    scene.add(gltf.scene);
  },
  (event) => {
    if (event.total > 0) {
      const progress = event.loaded / event.total;
      console.log(`Model loading: ${Math.round(progress * 100)}%`);
    }
  },
  (error) => {
    console.error('Could not load product model.', error);
  }
);
```

Do not assume that a file extension guarantees a valid or optimized asset. Inspect the model in a viewer and validate the export before integrating it. Keep the Three.js core and addon versions aligned; mismatched package versions are a common cause of confusing runtime failures.

### 2. A glTF asset is a hierarchy, not a single mesh

`gltf.scene` is usually a root group containing nested groups, meshes, cameras, lights, or bones. The visible model may be split into several mesh nodes so parts can have different materials or animations. Use traversal to inspect the contents and find nodes by name.

```js
loader.load('/models/product.glb', (gltf) => {
  const root = gltf.scene;

  root.traverse((object) => {
    if (object.isMesh) {
      console.log({
        name: object.name,
        vertices: object.geometry.getAttribute('position')?.count,
        materialCount: Array.isArray(object.material) ? object.material.length : 1,
      });
    }
  });

  scene.add(root);
});
```

Avoid blindly flattening the hierarchy. Named nodes may be the control points for animation, interaction, or material replacement. If the model exporter gives nodes unhelpful names, improve them in the source DCC tool (such as Blender) so the web code can target semantic names rather than brittle child indices like `children[4]`.

### 3. Normalize scale and placement without destroying authored transforms

Models may arrive in centimeters, meters, or arbitrary units. A camera that expects a 2-unit object will not frame a 200-unit model correctly. Use a bounding box to inspect dimensions and center the asset when that matches the intended composition.

```js
function centerAndScaleModel(root, targetSize = 2.5) {
  const bounds = new THREE.Box3().setFromObject(root);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const largestDimension = Math.max(size.x, size.y, size.z);

  if (largestDimension === 0) {
    throw new Error('Cannot normalize a model with zero-sized bounds.');
  }

  // Scale the largest dimension to the target while preserving proportions.
  root.scale.multiplyScalar(targetSize / largestDimension);

  // Recalculate after scaling because the root transform changed.
  const scaledBounds = new THREE.Box3().setFromObject(root);
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());
  root.position.sub(scaledCenter);

  return {
    size: scaledBounds.getSize(new THREE.Vector3()),
    center: scaledCenter,
  };
}
```

This is a utility, not a universal rule. Centering is wrong for assets that must sit on a floor, align to a known pivot, or match a real-world coordinate system. For a product turntable, center around the intended rotation axis; for a character, preserve a meaningful foot-level origin. Prefer fixing scale and origin during asset preparation when possible, and use runtime normalization as a controlled fallback.

### 4. Materials and color management

glTF materials may include base color, metalness, roughness, normal maps, emissive maps, and other PBR properties. Do not replace them with a generic material unless the art direction requires it. If the model looks washed out, inspect color management, environment lighting, and exposure before randomly changing the base color.

```js
loader.load('/models/product.glb', (gltf) => {
  gltf.scene.traverse((object) => {
    if (!object.isMesh) return;

    // Preserve the imported PBR material unless a deliberate override is needed.
    object.material.side = THREE.FrontSide;
    object.castShadow = true;
    object.receiveShadow = true;
  });

  scene.add(gltf.scene);
});
```

For a targeted material override, replace only the intended node or material. Remember that a mesh may have an array of materials and geometry groups. Replacing an array with one material can change the appearance or remove per-group differences. If multiple meshes share a material, mutating it changes all consumers.

### 5. Animation clips and AnimationMixer

glTF files can contain skeletal animation, object transforms, morph targets, or multiple clips. Three.js uses `AnimationMixer` to evaluate imported animation tracks. Update the mixer with the frame delta, not an arbitrary fixed amount, so playback speed remains consistent across frame rates.

```js
const clock = new THREE.Clock();
let mixer;

loader.load('/models/character.glb', (gltf) => {
  scene.add(gltf.scene);

  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(gltf.scene);
    const idle = mixer.clipAction(gltf.animations[0]);
    idle.play();
  }
});

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  mixer?.update(delta);
  renderer.render(scene, camera);
}

animate();
```

If the clip appears not to work, inspect `gltf.animations`, track names, and target node names. The clip may animate a nested node rather than the root. Do not create a new mixer every frame. For multiple clips, retain their `AnimationAction` references and control play, stop, time scale, and cross-fades intentionally.

### 6. Model loading is asynchronous and should have a UX plan

A model can take seconds to download, decode, and upload. The page should remain usable while that happens. Provide progress when it is meaningful, a fallback state if loading fails, and a plan for whether the 3D scene is essential to the page’s message.

```js
const manager = new THREE.LoadingManager();
manager.onError = (url) => console.error(`Asset failed: ${url}`);

const loader = new GLTFLoader(manager);

function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

try {
  const gltf = await loadModel('/models/product.glb');
  scene.add(gltf.scene);
} catch (error) {
  // Render a CSS/image fallback rather than leaving a blank hero.
  console.error('Using the static fallback for the 3D hero.', error);
  showHeroFallback();
}
```

A progress percentage is only reliable when the server provides a useful total size. Some compressed or streamed assets may not report a meaningful total. Never make the entire page unusable just because a decorative model failed to load.

### 7. Optimize before runtime

Asset optimization should happen as early as possible in the pipeline. Review polygon count, material count, texture dimensions, hidden geometry, duplicated objects, and animation data. Use tools such as Blender and glTF optimization utilities to simplify and compress the model before shipping it. Meshopt and Draco are different geometry-compression approaches; KTX2/Basis Universal can help with texture delivery when configured correctly.

A smaller transfer size does not automatically mean lower runtime cost. Compression can reduce download bandwidth but still requires decode time and GPU upload. A model with hundreds of separate meshes can remain draw-call-heavy even when its file is compressed. Evaluate network, decode, GPU memory, and rendering cost separately.

### 8. Dispose model resources deliberately

Removing the model root from the scene does not release geometry, materials, or textures. But disposing every resource in a loaded model is unsafe if resources are shared with another model or retained by an asset cache. Establish ownership before cleanup.

```js
function disposeObjectTree(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;

    object.geometry?.dispose();

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (!material) continue;

      // Dispose textures only if this tree owns them and they are not shared.
      for (const value of Object.values(material)) {
        if (value?.isTexture) value.dispose();
      }

      material.dispose();
    }
  });

  root.parent?.remove(root);
}
```

This helper assumes exclusive ownership. If models share materials or textures, use an asset manager with reference counting or a single clear owner. Also stop animation actions and detach event handlers when the model leaves the scene.

## Advanced Patterns

### Pattern 1: Promise-based model loader with typed failure handling

Use a promise wrapper when loading is part of a larger setup sequence, such as waiting for a model and environment map before revealing a hero. It makes success and failure flow explicit.

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const gltfLoader = new GLTFLoader();

export function loadGLTF(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(
      url,
      (gltf) => resolve(gltf),
      undefined,
      (error) => reject(new Error(`Failed to load ${url}: ${error.message ?? error}`))
    );
  });
}

// Example usage:
try {
  const gltf = await loadGLTF('/models/hero.glb');
  scene.add(gltf.scene);
} catch (error) {
  console.error(error);
  showHeroFallback();
}
```

Avoid loading the same URL repeatedly from unrelated components. Put caching and in-flight request deduplication at the asset-service layer if the application has multiple consumers.

### Pattern 2: Semantic node lookup instead of child indices

Use stable node names to animate a product lid, change a display screen, or attach a label. Names should be established during modeling/export rather than guessed from the generated hierarchy.

```js
function findNodeByName(root, name) {
  let match = null;

  root.traverse((node) => {
    if (!match && node.name === name) match = node;
  });

  return match;
}

loader.load('/models/device.glb', (gltf) => {
  const root = gltf.scene;
  const lid = findNodeByName(root, 'Device_Lid');

  if (!lid) {
    console.warn('Expected node Device_Lid was not found.');
  } else {
    lid.rotation.x = -0.35;
  }

  scene.add(root);
});
```

For critical assets, validate required node names during development and fail loudly in tests. Silent fallback to an arbitrary child index makes future asset revisions fragile.

### Pattern 3: Fit a model to a camera without changing the model’s scale

Use camera fitting when a user selects different products in a viewer. The method derives a camera distance from model bounds and the camera field of view. This is better than repeatedly scaling the model to fit a fixed camera, which can break authored dimensions and pivots.

```js
function fitPerspectiveCamera(camera, object, padding = 1.25) {
  const bounds = new THREE.Box3().setFromObject(object);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.001);

  const verticalFov = THREE.MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(
    Math.tan(verticalFov / 2) * camera.aspect
  );
  const limitingFov = Math.min(verticalFov, horizontalFov);
  const distance = (radius / Math.sin(limitingFov / 2)) * padding;

  camera.position.copy(sphere.center).add(
    new THREE.Vector3(0, 0, distance)
  );
  camera.near = Math.max(distance / 1000, 0.01);
  camera.far = distance * 20;
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
}
```

This simplified version assumes the camera approaches along the positive Z direction. For arbitrary orbit controls, calculate the new position along the current viewing direction and update the controls’ target. Fit after the model has its intended transforms and after the camera aspect ratio is correct.

### Pattern 4: Cross-fade between animation clips

Use clip cross-fades for character idles, product mechanisms, or animated portfolio assets. Retain the mixer and actions so transitions can be controlled without recreating the animation system.

```js
function createClipController(root, clips) {
  const mixer = new THREE.AnimationMixer(root);
  const actions = new Map(
    clips.map((clip) => [clip.name, mixer.clipAction(clip)])
  );

  let activeAction = null;

  function play(name, fadeSeconds = 0.25) {
    const next = actions.get(name);
    if (!next) throw new Error(`Unknown animation clip: ${name}`);

    next.reset().play();

    if (activeAction && activeAction !== next) {
      activeAction.crossFadeTo(next, fadeSeconds, false);
    }

    activeAction = next;
  }

  return {
    mixer,
    play,
    stopAll: () => mixer.stopAllAction(),
  };
}
```

Call `controller.mixer.update(delta)` once per frame. If two clips animate the same tracks, cross-fading blends their influence; if they target unrelated nodes, the result may feel abrupt even when the API call succeeds. Test the transitions visually.

### Pattern 5: Lazy-load a model when its section approaches the viewport

Use this for long-scrolling portfolio pages where a 3D asset is not needed immediately. It can improve initial load and avoid downloading models the visitor never reaches. The page should still have a static placeholder while the model loads.

```js
const observer = new IntersectionObserver(async ([entry]) => {
  if (!entry.isIntersecting) return;

  observer.disconnect();

  try {
    const gltf = await loadGLTF('/models/case-study.glb');
    scene.add(gltf.scene);
  } catch (error) {
    showCaseStudyFallback();
  }
}, { rootMargin: '300px 0px' });

observer.observe(document.querySelector('#case-study-3d'));
```

This is a browser-side integration pattern; it assumes `loadGLTF`, `scene`, and fallback functions are available in the surrounding application. If the section can unmount while loading, guard against adding the result after unmount and dispose it if the component owns it.

### Pattern 6: Explicit model cleanup with resource ownership

Use a cleanup function when a model viewer changes assets or a route is unmounted. Keep ownership explicit so shared cache resources are not accidentally destroyed.

```js
function removeOwnedModel({ root, mixer, ownsResources = true }) {
  if (mixer) {
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
  }

  root.parent?.remove(root);

  if (!ownsResources) return;

  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();

  root.traverse((object) => {
    if (!object.isMesh) return;
    if (object.geometry) geometries.add(object.geometry);

    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of list) {
      if (!material) continue;
      materials.add(material);

      for (const value of Object.values(material)) {
        if (value?.isTexture) textures.add(value);
      }
    }
  });

  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}
```

The set collections prevent disposing the same resource multiple times when several meshes share it within the model. They do not protect resources shared with other models; use `ownsResources: false` or an asset manager when ownership is shared.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Loading a model and immediately scaling randomly | The source unit and origin are unknown | Inspect bounds and define a consistent scale/origin policy |
| Treating `gltf.scene` as one mesh | The hierarchy is hidden by the root group | Traverse the tree and preserve meaningful nodes |
| Replacing every imported material | A generic material seems easier to style | Preserve PBR materials and override only what is necessary |
| Using child indices to target parts | Names were not established during asset creation | Name important nodes semantically in the DCC tool |
| Creating a mixer every frame | Animation setup is mixed into the render loop | Create one mixer per animated root and update it with delta |
| Assuming compressed file means cheap rendering | Download size is confused with GPU and draw-call cost | Measure transfer, decode, memory, and rendering separately |
| Loading all models on first page render | Asset loading is not planned around user flow | Lazy-load below-the-fold assets with fallbacks |
| Disposing every texture in a shared model | Ownership and sharing are not tracked | Dispose only exclusively owned resources |
| Ignoring failed requests | The 3D hero has no fallback | Add loading, error, and static fallback states |
| Fitting the camera by distorting model scale | Camera framing is inconvenient | Fit the camera to bounds and preserve model transforms |
| Shipping unverified third-party assets | Visual quality is prioritized over provenance | Verify license, attribution, and usage rights before shipping |
| Optimizing only polygon count | Other bottlenecks remain hidden | Inspect materials, textures, draw calls, decode time, and GPU cost too |

## Mental Models

1. **A model is a scene graph:** the root contains named nodes, meshes, materials, and possibly animations.
2. **Import is integration, not completion:** scale, framing, materials, loading states, and cleanup still need design.
3. **Camera-visible detail earns its cost:** optimize for the intended shot and interaction, not hidden surfaces.
4. **Compression is not a performance guarantee:** transfer, decode, upload, draw calls, and shading are separate costs.
5. **Names are an API:** semantic node names make animation and interaction robust across asset revisions.
6. **One mixer, one update path:** create animation controllers once and update them with frame delta.
7. **Ownership precedes disposal:** never destroy a GPU resource while another consumer still needs it.

## Quick Reference

| Need | Recommended approach | Watch out for |
|---|---|---|
| Web-ready model format | glTF / GLB | Verify asset integrity and license |
| Load external asset | `GLTFLoader` | Addon and core versions should match |
| Inspect hierarchy | `root.traverse()` | Preserve named nodes and groups |
| Check model size | `Box3().setFromObject(root)` | Centering may conflict with authored pivots |
| Play imported clips | `AnimationMixer` + `clipAction()` | Update mixer with delta time |
| Fit viewer camera | Bounds + field of view | Respect camera aspect and orbit direction |
| Reduce initial loading | Lazy-load near viewport | Keep fallback and cancellation/unmount handling |
| Reduce download cost | Asset compression and texture optimization | Runtime GPU cost may still be high |
| Remove a model | Stop actions, detach root, dispose owned resources | Shared assets need an asset manager |
| Debug a missing model | Check URL, errors, bounds, transforms, and material | A successful request does not guarantee visible framing |

## Build Challenge

### Build a “Product Reveal” model viewer

Create a portfolio case-study section that loads a GLB product model, frames it automatically, plays an optional animation, and degrades gracefully when 3D is unavailable.

1. Load a `.glb` asset with `GLTFLoader` and show a loading state while it is pending.
2. Add an error path with a static image or CSS fallback so the section is never blank.
3. Traverse the hierarchy and log mesh names, vertex counts, and material counts in development mode.
4. Inspect the model bounds and implement a camera-fit helper. Preserve the intended model origin and proportions.
5. If animation clips exist, create one `AnimationMixer`, provide a play/pause control, and update the mixer using frame delta.
6. Keep the imported materials unless a deliberate art-direction override is required.
7. Lazy-load the model when the section is near the viewport, while preserving a useful placeholder.
8. Add cleanup that stops animation, detaches the model, and disposes only resources the viewer owns.
9. Document asset provenance, license, approximate file size, texture sizes, and any optimization performed.

**Expected output / definition of done**

- A responsive product viewer with stable framing and no unexplained scale jumps.
- Loading, success, and failure states that all preserve the page’s visual hierarchy.
- Optional animation plays at a consistent speed and can be stopped cleanly.
- No resource disposal bugs when changing or unmounting the viewer.
- A short performance note that distinguishes download size from runtime rendering cost.
