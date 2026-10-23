# SKILL: threejs-lighting

**Layer:** 06 — Three.js / WebGL

**Goal:** Design readable, cinematic real-time lighting in Three.js by controlling light direction, softness, color, environment reflections, exposure, and performance as one intentional system.

## Why This Matters (Senior Perspective)

Lighting is the difference between a scene that merely contains 3D objects and a scene that communicates depth, hierarchy, and mood. A model can have excellent geometry and carefully authored materials yet appear flat because every surface receives similar illumination. Conversely, simple geometry can feel expensive when highlights reveal its form, shadows anchor it in space, and the brightest region guides the viewer toward the intended focal point. For creative-development portfolios, lighting is not a finishing filter: it is part of the composition.

Senior developers light for the camera and the user experience, not just for a pleasing still image. They ask what the visitor should notice first, which objects should recede, whether the scene remains legible during scroll or pointer interaction, and how the lighting behaves on a phone with limited GPU headroom. They tune lights with materials already in the scene, because a light that makes a white ceramic object beautiful may blow out a polished metal object or turn a dark object into a featureless silhouette. They also separate lighting responsibilities: key light shapes the subject, fill light controls contrast, rim light separates the silhouette, and environment lighting supplies broad reflected information.

Lighting has a budget. Real-time shadows can require extra rendering work; many shadow-casting lights can be expensive or unsupported as expected; high-intensity lights can clip under tone mapping; and a scene with too many competing colors can feel noisy. The goal is not to add more lights until every surface is bright. It is to use a small, purposeful setup, test it under the final renderer and camera, and preserve enough contrast for the design to remain clear.

## Core Concepts

### 1. Think in lighting roles before adding lights

**Mental model:** each light should have a job. If two lights do the same job, one may be unnecessary.

A practical starting point is a three-point-inspired setup:
- **Key:** the main directional source that establishes form and shadow direction.
- **Fill:** a weaker source that lifts the dark side without erasing the key's direction.
- **Rim:** a back or side light that separates the subject from the background.

Three.js does not require a literal studio rig. This is a compositional framework. A hero object may need one key and an environment map; a stylized floating sculpture may use a warm key and cool rim; a product scene may use large area-like highlights represented by environment reflections.

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0d12');

const key = new THREE.DirectionalLight('#fff0dc', 3.0);
key.position.set(4, 6, 5);
scene.add(key);

const fill = new THREE.PointLight('#8da9ff', 14, 18);
fill.position.set(-4, 1, 2);
scene.add(fill);

const rim = new THREE.DirectionalLight('#ff4f87', 2.0);
rim.position.set(-3, 3, -4);
scene.add(rim);
```

The intensities are starting values, not universal constants. The scene scale, tone mapping, material roughness, environment, and Three.js version affect the result. Tune with the actual subject in view.

Naive approach:

```js
// Wrong: add lights until every pixel looks bright.
scene.add(new THREE.AmbientLight('#ffffff', 2));
scene.add(new THREE.PointLight('#ffffff', 100));
scene.add(new THREE.PointLight('#ffffff', 100));
```

Why it fails: light direction and contrast disappear, highlights may clip, and all materials start to look similar. A better approach is to set the key first, then add only enough fill to preserve useful detail.

### 2. Understand the light types and their intended use

**Mental model:** light type determines how illumination is distributed through space; it is not just a different constructor name.

- `AmbientLight` adds broad illumination without a direction and does not create directional shadows. Use sparingly as a simple fill.
- `HemisphereLight` provides a sky/ground-style gradient and can gently lift a scene.
- `DirectionalLight` behaves like a distant source with parallel rays, useful for sunlight-like direction and shadow casting.
- `PointLight` emits from a position in all directions, useful for local bulbs or accents.
- `SpotLight` emits a cone, useful for a focused pool of light.
- Environment lighting contributes broad image-based illumination and reflections; it is especially important for reflective materials.

```js
const hemi = new THREE.HemisphereLight('#b9d8ff', '#17121f', 0.7);
scene.add(hemi);

const spot = new THREE.SpotLight('#ffffff', 45, 20, Math.PI / 7, 0.35, 1.5);
spot.position.set(2, 5, 4);
spot.target.position.set(0, 0, 0);
scene.add(spot, spot.target);
```

Use the smallest number of light types that express the scene. A point light near a glossy object may create an overly tiny, sharp highlight; environment reflections or broad soft-looking sources can be more convincing for product surfaces.

### 3. Direction matters more than raw intensity

**Mental model:** a light's position determines which planes and contours receive illumination. Intensity controls the amount, but direction determines the shape.

Place the key light off-axis rather than directly above the camera if you want form to read. Move it to observe how highlights travel over the geometry. A light near the camera can flatten a subject because front-facing surfaces are illuminated evenly; a side light often reveals curvature and texture.

```js
const key = new THREE.DirectionalLight('#ffffff', 3.0);

// The light direction is from its position toward its target.
key.position.set(5, 4, 3);
key.target.position.set(0, 0, 0);
scene.add(key, key.target);
```

For `DirectionalLight` and `SpotLight`, remember that direction is determined by the light and its target. Moving the target is often more useful than repeatedly changing intensity. For a complex scene, create a small helper or debug marker so the light rig is understandable during iteration.

### 4. Contrast is a design decision

**Mental model:** shadows are not a failure to illuminate the scene. They provide shape, grounding, and hierarchy.

If the fill is too strong, the shadow side loses its identity and the scene feels flat. If the fill is too weak, important details disappear. Aim for controlled contrast rather than uniform brightness. Use the key light to establish the direction, then adjust fill until the dark side contains enough information to read at the intended display size.

A useful sequence:
1. Temporarily remove fill and rim lights.
2. Tune the key until the object has a clear shape and shadow.
3. Add fill at a lower visual contribution than the key.
4. Add rim only if the subject needs separation from its background.
5. Inspect dark surfaces and bright highlights together.

Avoid using `AmbientLight` to solve every dark region. A hemisphere light or a carefully placed fill often maintains more visual direction.

### 5. Shadows need deliberate quality and scope

**Mental model:** a shadow map is a rendering approximation with resolution and bias trade-offs, not an unlimited source of realism.

Enable shadow mapping at the renderer, then enable casting and receiving on only the objects that need it.

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const key = new THREE.DirectionalLight('#ffffff', 3);
key.position.set(4, 7, 4);
key.castShadow = true;
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: '#171b24', roughness: 0.9 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const object = new THREE.Mesh(
  new THREE.TorusKnotGeometry(0.8, 0.24, 128, 16),
  new THREE.MeshStandardMaterial({ color: '#a6c8ff', roughness: 0.32, metalness: 0.5 })
);
object.castShadow = true;
object.position.y = 1;
scene.add(object);
```

Shadow quality depends on the shadow camera frustum, map resolution, bias, normal bias, and scene scale. Avoid simply increasing every shadow map to a huge size. First make the shadow camera cover only the relevant region; wasted shadow-map area lowers effective resolution.

### 6. Environment lighting is essential for reflective materials

**Mental model:** a metal surface mostly tells you about its surroundings. A dark, empty environment gives it little useful information to reflect.

Direct lights can create highlights, but image-based lighting often gives materials the broad, complex reflections that make metal, coated paint, and glass-like surfaces feel convincing. In modern Three.js workflows, use an environment map and ensure it is prepared appropriately for physically based materials. A common approach is to load an HDR environment and process it with `PMREMGenerator`; a simpler project can use a prebuilt environment from a supported helper or asset pipeline.

Conceptual setup using an already prepared environment texture:

```js
const envLoader = new THREE.TextureLoader();
const environment = envLoader.load('/textures/studio-environment.jpg');

// For production PBR, prefer an environment processed for Three.js's
// physically based lighting pipeline, especially for HDR environments.
environment.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = environment;
```

This is a minimal example, not a substitute for HDR processing in every project. For HDR sources, use the current Three.js environment workflow and verify the result against the version you install. Do not assume a low-dynamic-range image provides the same highlight range as an HDR environment.

Keep the environment's visual role separate from the scene background when necessary. `scene.environment` supplies reflections/illumination to materials; `scene.background` controls what the camera sees behind objects. They can use related but different assets.

### 7. Color temperature and hue establish mood

**Mental model:** lighting color affects both the object's apparent color and the emotional temperature of the scene.

Warm key plus cool fill can create a clear visual separation; a neutral key with one restrained accent color can feel editorial; several saturated lights may look energetic but can also contaminate the material palette. Keep the color story simple enough that the subject remains recognizable.

```js
const warmKey = new THREE.DirectionalLight('#ffe0b5', 3.0);
warmKey.position.set(4, 5, 4);
scene.add(warmKey);

const coolRim = new THREE.DirectionalLight('#719cff', 1.8);
coolRim.position.set(-4, 2, -3);
scene.add(coolRim);
```

When colors become muddy, first reduce the number of competing hues. Do not compensate by making every material more saturated. The material should still read as the intended material under the lighting.

### 8. Renderer exposure and tone mapping belong to the lighting workflow

**Mental model:** lighting values do not have a final appearance until they pass through the renderer's output and tone-mapping configuration.

```js
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

Tone mapping compresses bright values into the display range. This affects highlight roll-off, saturation, and perceived contrast. When a highlight looks blown out, do not immediately lower every light; inspect exposure and tone mapping as well. Conversely, if everything looks dull, check whether exposure is too low or the light setup lacks directional contrast.

Choose the renderer configuration deliberately and keep it consistent between development screenshots and the deployed site. A scene tuned with one tone mapper may look substantially different with another.

### 9. Animated lights should serve a visual purpose

**Mental model:** animation should reveal form or communicate state, not create movement for its own sake.

A slowly moving key can add life to a hero object, but rapidly changing colors and positions often make a portfolio scene feel like a demo rather than a designed experience. Prefer subtle motion with a predictable range and provide a reduced-motion or static alternative when motion is nonessential.

```js
const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  // A slow arc changes highlights gradually without distracting from content.
  key.position.x = 4 + Math.sin(elapsed * 0.25) * 0.8;
  key.position.z = 4 + Math.cos(elapsed * 0.25) * 0.8;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
```

For a production application, use a single animation loop and centralize updates rather than creating one independent loop per light or component. Stop the loop when the scene is unmounted, and respect the site's motion preference.

### 10. Light count and shadow count affect performance

**Mental model:** a light is not free. Depending on the material and renderer path, additional lights can increase shader work; shadow-casting lights also require shadow-map rendering.

Start with a small rig and measure on the weakest target device. Use environment lighting to support reflective surfaces where appropriate, and avoid making every light cast shadows. A scene with one well-placed shadow-casting key and a couple of non-shadow fill lights can often look better and run faster than a dozen shadow-casting point lights.

```js
key.castShadow = true;
fill.castShadow = false;
rim.castShadow = false;
```

Use browser performance tools and GPU profiling where available. Watch frame time, not only average frames per second, because occasional long frames can make scroll-driven interactions feel stuttery.

## Integration Patterns

### Pattern 1: Reusable three-point-inspired rig

**Use when:** a portfolio hero needs reliable subject separation and controlled contrast.

```js
import * as THREE from 'three';

export function createHeroLighting(scene) {
  const key = new THREE.DirectionalLight('#fff0dc', 3.0);
  key.position.set(4, 6, 5);
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);

  const fill = new THREE.PointLight('#8da9ff', 12, 20);
  fill.position.set(-4, 1, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight('#ff4f87', 1.7);
  rim.position.set(-3, 3, -4);
  rim.target.position.set(0, 0, 0);
  scene.add(rim, rim.target);

  return {
    key,
    fill,
    rim,
    dispose() {
      scene.remove(key, fill, rim, key.target, rim.target);
    },
  };
}
```

Tune the key first. The fill should preserve detail without erasing the key's direction, and the rim should only be strong enough to separate the silhouette.

### Pattern 2: Performance-conscious shadow setup

**Use when:** the hero object needs a grounded contact shadow without turning the entire scene into a shadow-map benchmark.

```js
export function configureShadows(renderer, keyLight, caster, receiver) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);

  // Tight bounds improve effective shadow-map resolution.
  keyLight.shadow.camera.left = -4;
  keyLight.shadow.camera.right = 4;
  keyLight.shadow.camera.top = 4;
  keyLight.shadow.camera.bottom = -4;

  caster.castShadow = true;
  receiver.receiveShadow = true;
}
```

This function expects `THREE` to be imported in the file where it is used. Adjust bounds and map size to the real scene. On mobile, consider reducing shadow resolution or using a baked/soft contact shadow if the moving shadow is not essential.

### Pattern 3: HDR environment for reflective materials

**Use when:** polished or metallic objects look black, flat, or overly dependent on a single point light.

```js
import * as THREE from 'three';

export async function setEnvironment(renderer, scene, hdrUrl) {
  const loader = new THREE.TextureLoader();
  const envTexture = await loader.loadAsync(hdrUrl);

  envTexture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = envTexture;

  return () => {
    scene.environment = null;
    envTexture.dispose();
  };
}
```

This illustrates the lifecycle and mapping idea for a supported equirectangular environment texture. For HDR files, use the current `RGBELoader` workflow and PMREM processing appropriate to your Three.js version rather than assuming `TextureLoader` decodes every HDR format. The cleanup callback owns the loaded texture and should not run while other scenes still share it.

### Pattern 4: Spotlight pool for an editorial scene

**Use when:** one object or region should receive a focused pool of light while the rest of the scene remains quieter.

```js
const spotlight = new THREE.SpotLight(
  '#ffe5c2',
  38,
  18,
  Math.PI / 8,
  0.45,
  1.2
);
spotlight.position.set(1, 6, 3);
spotlight.target.position.set(0, 0, 0);
scene.add(spotlight, spotlight.target);
```

Aim the target at the visual focal point. Keep the cone edge and falloff subtle unless the scene intentionally references theatrical lighting. Use a shadow map only if the spotlight's shadow contributes meaningfully to the composition.

### Pattern 5: Slow light orbit with lifecycle-safe animation

**Use when:** reflections should evolve gently across a hero object.

```js
export function createLightOrbit(light, center, radius = 4, speed = 0.2) {
  let frameId = 0;
  const clock = new THREE.Clock();
  let active = true;

  function tick() {
    if (!active) return;

    const t = clock.getElapsedTime() * speed;
    light.position.set(
      center.x + Math.cos(t) * radius,
      center.y + 2,
      center.z + Math.sin(t) * radius
    );

    frameId = requestAnimationFrame(tick);
  }

  tick();

  return () => {
    active = false;
    cancelAnimationFrame(frameId);
  };
}
```

This helper assumes `THREE` is imported in the module. In a real application, prefer a shared animation loop if the scene already has one. The important part is that the motion has a defined stop function and does not continue after teardown.

### Pattern 6: Debug the light rig visually

**Use when:** lights are hard to reason about because their positions and targets are invisible.

```js
const keyHelper = new THREE.DirectionalLightHelper(key, 1, '#ffcc66');
scene.add(keyHelper);

const targetHelper = new THREE.AxesHelper(0.35);
targetHelper.position.copy(key.target.position);
scene.add(targetHelper);

// Remove these helpers from production builds.
function removeLightingDebug() {
  scene.remove(keyHelper, targetHelper);
  keyHelper.dispose?.();
  targetHelper.geometry.dispose();
  targetHelper.material.dispose();
}
```

Helpers are development tools, not visual effects. Guard them behind a debug flag and ensure the cleanup matches the resources created. For spotlights, a `SpotLightHelper` can make the cone direction and target easier to inspect.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Adding lights until everything is bright | Brightness is mistaken for readability | Establish key direction and use fill only to recover necessary detail |
| Using strong ambient light as a universal fix | It is easy to add and hides dark areas | Use a weaker hemisphere or directional fill that preserves form |
| Tuning lights without final materials | Materials react differently to the same light | Tune with the real hero materials and camera |
| Making every light cast shadows | Shadows appear to improve realism | Limit shadow casting to lights that materially improve the scene |
| Using huge shadow maps before framing them | Resolution seems like the obvious quality fix | Tighten shadow camera bounds, then adjust resolution |
| Expecting metal to look good without environment information | Metal reflects surroundings rather than behaving like a diffuse colored surface | Provide an appropriate environment map and useful highlight shapes |
| Confusing scene background with environment lighting | Both are described as an environment | Configure `scene.background` and `scene.environment` for their separate roles |
| Using many saturated light colors | Each light looks attractive in isolation | Limit the color story and protect the material palette |
| Fixing clipped highlights by lowering every light | Renderer exposure is overlooked | Check tone mapping and exposure before retuning the whole rig |
| Animating lights too quickly | Motion is used to create spectacle | Use slow, purposeful movement and a reduced-motion fallback |
| Leaving animation loops running after teardown | Lifecycle cleanup is postponed | Store and cancel animation frame IDs or use a shared render loop |
| Over-lighting the subject from the camera axis | The front becomes uniformly bright | Move the key off-axis to reveal form |
| Using a spotlight without aiming its target | The light points somewhere unexpected | Set and add `spotlight.target` deliberately |
| Ignoring mobile frame time | Desktop hardware hides expensive shadows and lights | Test on a constrained device and reduce shadow/light complexity |

## Mental Models

1. **Every light has a job:** key shapes, fill controls contrast, rim separates, and environment supplies broad reflections.
2. **Direction shapes form:** move a light before raising its intensity.
3. **Shadows are information:** they ground objects and establish spatial hierarchy.
4. **Metal needs surroundings:** reflected environment detail is central to a convincing metallic surface.
5. **Exposure is part of lighting:** the renderer's tone mapping changes the final appearance.
6. **Shadow maps are a budget:** frame the shadow camera tightly and cast shadows selectively.
7. **Animation needs ownership:** moving lights must stop when the scene stops.

## Quick Reference

| Goal | Start with | Check |
|---|---|---|
| Shape the hero object | One off-axis `DirectionalLight` | Does the key reveal form and create useful shadow direction? |
| Lift dark-side detail | Low-intensity fill or `HemisphereLight` | Does the scene still have contrast? |
| Separate silhouette | Side/back `DirectionalLight` | Does it outline the subject without creating a neon halo? |
| Create a focused pool | `SpotLight` with a deliberate target | Is the cone pointed at the intended focal point? |
| Improve metallic reflections | `scene.environment` with a suitable environment texture | Are useful highlights visible on the actual material? |
| Enable shadows | `renderer.shadowMap.enabled = true` | Are caster and receiver flags set only where needed? |
| Improve shadow detail | Tight shadow camera bounds | Is the relevant region using the available map resolution? |
| Control highlight roll-off | `toneMapping` and `toneMappingExposure` | Are bright areas clipped or dull? |
| Add a warm/cool split | Warm key, restrained cool fill/rim | Are material colors still recognizable? |
| Animate light position | Shared animation loop or cancellable helper | Does motion stop during teardown and respect reduced motion? |
| Debug a light | `DirectionalLightHelper` / `SpotLightHelper` | Are helpers removed from production? |
| Improve mobile performance | Fewer shadow casters and simpler rig | Is frame time stable on a constrained device? |

## Build Challenge

### Light a cinematic portfolio hero

Create a Three.js hero scene containing one central sculptural object, a dark or neutral background, and a small supporting platform. The scene should feel art-directed rather than like a default 3D demo.

**Requirements**

1. Add one key light, one fill light, and one rim light; give each a clearly stated purpose.
2. Use at least one rough non-metal and one reflective metallic material so the rig is tested against different surface responses.
3. Enable shadows only for the light and objects that need them; frame the shadow camera tightly.
4. Add an environment map if the metallic object needs richer reflections, and keep the environment lighting distinct from the visible background when useful.
5. Configure output color space, tone mapping, and exposure intentionally.
6. Add a restrained color contrast, such as warm key plus cool rim, without making every surface saturated.
7. Animate one light slowly or leave the scene static; if animated, provide cleanup and a reduced-motion alternative.
8. Include a debug toggle that displays light helpers during development and removes them for production.
9. Test the scene at desktop and mobile viewport sizes, and check that the focal object remains readable.
10. Write a short lighting note explaining the role, direction, color, and intensity of each light.

**Expected output / definition of done**

- The hero object has visible form, readable highlights, and intentional shadow direction.
- The fill light preserves some dark-side information without flattening the object.
- The rim light separates the subject only where needed.
- Reflective materials show useful environment detail rather than appearing uniformly black.
- Shadows are grounded and not dominated by obvious acne, detached edges, or excessive blur.
- The scene maintains a clear visual hierarchy at mobile sizes.
- Debug helpers and animation resources are removed or stopped during teardown.
- Performance remains acceptable without adding unnecessary shadow-casting lights.

**Focused-session plan**

- 15 minutes: block in the subject, camera, and key light.
- 15 minutes: add fill/rim and tune contrast.
- 15 minutes: configure shadows and environment reflections.
- 10 minutes: set tone mapping and color balance.
- 15 minutes: test mobile framing, cleanup, and document the lighting decisions.

## Senior Review Checklist

Before shipping, ask:

- Does each light have a distinct role?
- Does the key reveal shape, or does it merely brighten the front?
- Is the fill preserving detail while keeping contrast?
- Is the rim helping the silhouette, or creating distracting colored edges?
- Do metallic materials have enough environment information?
- Are shadow maps scoped to the relevant part of the scene?
- Does the final renderer configuration match the environment in which the scene was tuned?
- Does any animated light stop cleanly when the scene is no longer visible?
- Have I tested the setup with the actual materials, camera, and mobile viewport?

If the scene looks flat, remove lights and rebuild the hierarchy instead of adding more. A small rig with clear intent is easier to art-direct, debug, and ship.
