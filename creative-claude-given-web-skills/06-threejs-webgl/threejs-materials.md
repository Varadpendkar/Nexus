# SKILL: threejs-materials

**Layer:** 06 — Three.js / WebGL

**Goal:** Build convincing, art-directed Three.js materials by understanding how surface properties, lighting, color management, and shader inputs combine to create a coherent visual result.

## Why This Matters (Senior Perspective)

Materials are not decorative labels applied after a scene is built. They are the visual contract between geometry, light, and the camera. A rough ceramic object, a polished chrome sculpture, a translucent glass panel, and a matte typographic plane can share the same geometry yet communicate completely different stories because their materials respond to illumination differently. In a portfolio or freelance deliverable, a technically correct scene can still feel cheap when every object uses the same glossy plastic, colors are chosen without a lighting plan, or roughness is used as a substitute for understanding the surface.

Senior creative developers design material systems, not isolated swatches. They decide which surfaces should dominate, which should recede, where contrast belongs, and how materials remain legible across desktop and mobile displays. They also understand the limits of the physical approximation: `MeshStandardMaterial` and `MeshPhysicalMaterial` are powerful, but they are not a guarantee of realism. A physically plausible material in a poorly lit scene can look flat; a stylized material with disciplined lighting and restrained effects can look intentional and premium.

Materials also have a performance cost. Transparency, transmission, layered clearcoat, high-resolution maps, and many distinct material instances can increase overdraw, texture memory, shader complexity, and draw calls. A senior implementation balances the art direction against the GPU budget. The goal is not to use the most advanced material available. The goal is to use the simplest material model that achieves the intended visual result, then validate it in the actual scene, camera, viewport sizes, and devices that matter.

## Core Concepts

### 1. Choose the material model from the surface, not from habit

**Mental model:** a material is a response model. It describes how a surface interacts with incoming light, not simply what color it should be.

For most modern Three.js scenes, start with `MeshStandardMaterial`. It uses a physically based rendering (PBR) workflow with `roughness` and `metalness`, and is suitable for most opaque surfaces. Use `MeshPhysicalMaterial` when you specifically need extra physical effects such as clearcoat, transmission, sheen, iridescence, or specular control. Use `MeshBasicMaterial` when the object should ignore lighting, such as a flat UI marker or a deliberately unlit graphic.

```js
import * as THREE from 'three';

const paintedMetal = new THREE.MeshStandardMaterial({
  color: '#b8c5d8',
  metalness: 0.72,
  roughness: 0.28,
});

const coatedObject = new THREE.MeshPhysicalMaterial({
  color: '#d8e2ef',
  metalness: 0.08,
  roughness: 0.24,
  clearcoat: 0.8,
  clearcoatRoughness: 0.18,
});

const unlitGraphic = new THREE.MeshBasicMaterial({
  color: '#ff4f87',
});
```

The important decision is the intended response:
- **Standard:** default choice for most surfaces.
- **Physical:** use when a specific additional lobe or optical effect matters.
- **Basic:** use when lighting response is explicitly unwanted.

Naive approach:

```js
// Wrong: making every object "premium" by adding every available effect.
const material = new THREE.MeshPhysicalMaterial({
  color: '#ffffff',
  metalness: 1,
  roughness: 0,
  clearcoat: 1,
  transmission: 1,
  iridescence: 1,
});
```

Why it fails: these values compete for attention, some combinations do not represent the intended surface, and the scene may become noisy or expensive. Define the surface in plain language first—“brushed aluminum,” “soft rubber,” “glazed ceramic”—then map only the relevant properties.

### 2. Understand roughness before chasing reflections

**Mental model:** roughness controls how sharply a surface distributes reflected light. It is not a simple “shine amount” slider.

A low roughness value produces narrow, crisp highlights. A high roughness value spreads reflections over a larger area and softens them. Roughness only becomes visible when there is something meaningful to reflect: a bright area light, an environment map, or a clear lighting setup. Lowering roughness in an empty or dark scene often disappoints because the material has little information to reflect.

```js
const polished = new THREE.MeshStandardMaterial({
  color: '#c6d0dd',
  metalness: 0.85,
  roughness: 0.12,
});

const satin = new THREE.MeshStandardMaterial({
  color: '#c6d0dd',
  metalness: 0.45,
  roughness: 0.42,
});

const matte = new THREE.MeshStandardMaterial({
  color: '#c6d0dd',
  metalness: 0,
  roughness: 0.88,
});
```

Keep color and lighting stable while tuning roughness. If you change color, environment intensity, and roughness at the same time, you lose the ability to identify which change improved the result.

A useful tuning procedure:

1. Add a clear key light or environment reflection.
2. Choose the intended base color.
3. Set metalness based on whether the surface is a conductor or non-metal.
4. Adjust roughness until highlights have the correct width.
5. Recheck at the final camera distance; tiny roughness differences may vanish on small screens.

### 3. Metalness is a material category, not a realism dial

**Mental model:** in a metalness workflow, metalness distinguishes dielectric materials from metallic conductors. It should not be used indiscriminately to make an object look more expensive.

Typical non-metals—wood, plastic, skin, stone, ceramic, paper, rubber—usually have `metalness: 0`. Metals such as aluminum, copper, gold, and steel use values near `1`, with texture maps introducing local variation where needed. Intermediate values can be useful for art direction, but a uniform value of `0.5` is not a universal recipe for “semi-metal.”

```js
const rubber = new THREE.MeshStandardMaterial({
  color: '#20252b',
  metalness: 0,
  roughness: 0.82,
});

const brass = new THREE.MeshStandardMaterial({
  color: '#c99a43',
  metalness: 1,
  roughness: 0.3,
});
```

Metallic surfaces depend heavily on reflected environment information. If a metal looks black or lifeless, do not immediately increase its base color. Check the environment and lighting first. Metals reflect their surroundings strongly; with no useful surroundings, they have little to show.

### 4. Color management affects whether your palette survives rendering

**Mental model:** the color you author is not necessarily the color the display shows. Color-space conversion and tone mapping are part of the rendering pipeline.

Use modern Three.js color management and configure the renderer intentionally. For typical web output, `SRGBColorSpace` is the expected output color space. Avoid manually gamma-correcting material colors in shader code unless you understand the complete pipeline; duplicate conversion produces washed-out or incorrect results.

```js
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

The renderer's tone mapping influences highlights and perceived saturation. A palette that looks balanced in a flat CSS mockup may shift when placed in a lit 3D scene. Validate colors in the actual render, especially saturated accent colors and near-black surfaces.

For texture maps, color textures such as base color and emissive maps generally need the correct color-space annotation. Non-color data maps such as roughness, metalness, normal, and ambient-occlusion maps should not be treated as sRGB color data.

```js
const textureLoader = new THREE.TextureLoader();

const albedo = textureLoader.load('/textures/paint-basecolor.jpg');
albedo.colorSpace = THREE.SRGBColorSpace;

const roughnessMap = textureLoader.load('/textures/paint-roughness.jpg');
// Data maps store numeric values; do not mark them as sRGB colors.
roughnessMap.colorSpace = THREE.NoColorSpace;
```

### 5. Lighting and material are a coupled system

**Mental model:** material properties describe the surface; lighting supplies the information the surface reflects. You cannot tune either one well in isolation.

A glossy black object can show beautiful gradients under a large soft light and look like a black hole in a dim scene. A white matte object can look sculptural with a clear key light and fill, or completely flat with uniform illumination. Before replacing the material, inspect the light sources, environment, exposure, and camera angle.

```js
const scene = new THREE.Scene();
scene.background = new THREE.Color('#0b0d12');

const key = new THREE.DirectionalLight('#fff1dc', 3.2);
key.position.set(4, 6, 5);
scene.add(key);

const fill = new THREE.PointLight('#8da9ff', 18, 18);
fill.position.set(-4, 1, 2);
scene.add(fill);

const rim = new THREE.DirectionalLight('#ff4f87', 2.2);
rim.position.set(-3, 2, -4);
scene.add(rim);
```

The values above are starting points, not universal physical units for every scene. Adjust them according to renderer settings, scene scale, and whether you use an environment map. Avoid compensating for weak lighting by making every material emissive; emissive surfaces often lose the depth that makes the object feel three-dimensional.

### 6. Texture maps add surface information, but each map has a job

**Mental model:** a texture map is data sampled across a surface. Its meaning depends on the material property to which it is connected.

Common maps:
- **Color / albedo:** the base surface color; should not bake in lighting or shadows.
- **Roughness:** local variation in reflection spread.
- **Metalness:** local conductor classification or art-directed metalness variation.
- **Normal:** perturbs the shading normal without changing the silhouette.
- **Bump:** perturbs apparent surface height using a grayscale texture.
- **AO:** approximates local occlusion in creases; can become muddy if overused.
- **Emissive:** adds self-illumination appearance, but does not automatically light nearby objects.

```js
const loader = new THREE.TextureLoader();

const baseColor = loader.load('/textures/concrete-basecolor.jpg');
baseColor.colorSpace = THREE.SRGBColorSpace;

const normal = loader.load('/textures/concrete-normal.jpg');
const roughness = loader.load('/textures/concrete-roughness.jpg');

const concrete = new THREE.MeshStandardMaterial({
  map: baseColor,
  normalMap: normal,
  roughnessMap: roughness,
  roughness: 0.92,
  metalness: 0,
  normalScale: new THREE.Vector2(0.45, 0.45),
});
```

A normal map does not add geometry. It can suggest small pores or grooves under light, but the silhouette remains unchanged. If the viewer can see the edge of a deep crack or a raised ridge against the background, you may need actual geometry or displacement rather than a stronger normal map.

### 7. Use shared material tokens to create visual consistency

**Mental model:** a coherent scene behaves like a design system. A small set of named material tokens is easier to tune than dozens of unrelated values.

Instead of scattering color and roughness literals throughout components, define a material palette around roles: `surface`, `surfaceRaised`, `accentMetal`, `glass`, `glow`. The names describe intent, so a design revision can change the whole system in one place.

```js
import * as THREE from 'three';

export const materials = {
  surface: new THREE.MeshStandardMaterial({
    color: '#171b24',
    metalness: 0.12,
    roughness: 0.78,
  }),
  surfaceRaised: new THREE.MeshStandardMaterial({
    color: '#252c39',
    metalness: 0.18,
    roughness: 0.52,
  }),
  accentMetal: new THREE.MeshStandardMaterial({
    color: '#a6c8ff',
    metalness: 0.88,
    roughness: 0.24,
  }),
  glow: new THREE.MeshBasicMaterial({
    color: '#ff4f87',
  }),
};
```

Use shared instances when objects should have identical material settings. Do not mutate a shared material for one object if all objects using it should not change. Clone it when creating a genuine variant.

```js
const heroVariant = materials.surfaceRaised.clone();
heroVariant.color.set('#3b2b4f');
```

This is the difference between a reusable system and a collection of one-off tweaks.

### 8. Treat transparency as a rendering problem, not just an opacity value

**Mental model:** transparent objects need ordering and blending decisions. Setting `transparent: true` changes how the renderer blends the surface, and overlapping transparent objects can produce artifacts because sorting is not perfect for every shape.

```js
const tintedPanel = new THREE.MeshPhysicalMaterial({
  color: '#b7d8ff',
  metalness: 0,
  roughness: 0.16,
  transparent: true,
  opacity: 0.38,
  side: THREE.DoubleSide,
});
```

Use `transparent: true` when the material must blend with what is behind it. For cutout shapes such as leaves, perforated labels, or grunge masks, `alphaTest` can be more appropriate because it discards pixels below a threshold instead of blending them.

```js
const cutout = new THREE.MeshStandardMaterial({
  map: leafTexture,
  transparent: false,
  alphaTest: 0.45,
  side: THREE.DoubleSide,
});
```

Do not enable `DoubleSide` by default. It may be needed for thin sheets, but it can increase shading work and conceal incorrect geometry normals. Prefer correct geometry and explicit surface intent.

### 9. Physical extras should be chosen for a visible reason

`MeshPhysicalMaterial` extends the standard PBR material. Its additional controls can be valuable, but each should solve a specific visual requirement.

```js
const premiumCoating = new THREE.MeshPhysicalMaterial({
  color: '#cbd8ed',
  metalness: 0.72,
  roughness: 0.26,
  clearcoat: 0.85,
  clearcoatRoughness: 0.12,
});

const softFabric = new THREE.MeshPhysicalMaterial({
  color: '#c8b8d9',
  metalness: 0,
  roughness: 0.9,
  sheen: 0.35,
  sheenColor: '#e6d8ff',
});
```

- **Clearcoat** suggests a secondary glossy coating, useful for lacquer or automotive paint.
- **Transmission** is intended for transmissive, glass-like surfaces and depends on scene setup.
- **Sheen** helps suggest fabric-like grazing reflections.
- **Iridescence** can create angle-dependent color effects.
- **Thickness** matters for transmission effects.
- **IOR** influences optical behavior where supported by the material configuration.

Do not add a feature simply because it exists. If the effect cannot be seen at the final size or harms performance, remove it.

### 10. Material lifecycle and GPU resources need explicit ownership

Textures and materials may allocate GPU resources. If a component creates them dynamically, it should also own their disposal when they are no longer needed. Three.js does not automatically free every GPU resource simply because a JavaScript variable goes out of scope.

```js
const material = new THREE.MeshStandardMaterial({
  color: '#a6c8ff',
  roughness: 0.4,
});

const texture = new THREE.TextureLoader().load('/textures/detail.jpg');
material.map = texture;

// On teardown, dispose only resources this component owns.
function disposeMaterialResources() {
  material.dispose();
  texture.dispose();
}
```

Avoid disposing a shared material while other meshes still use it. Ownership is the key question: if one component created the resource exclusively for itself, it should release it; if the resource is shared, its lifetime belongs to the shared owner.

## Integration Patterns

### Pattern 1: Art-directed material palette

**Use when:** a portfolio scene needs a small, consistent family of materials that can be tuned globally.

```js
import * as THREE from 'three';

export function createPortfolioMaterials() {
  const palette = {
    base: new THREE.MeshStandardMaterial({
      color: '#151922',
      metalness: 0.08,
      roughness: 0.82,
    }),
    raised: new THREE.MeshStandardMaterial({
      color: '#252d3b',
      metalness: 0.2,
      roughness: 0.48,
    }),
    chromeAccent: new THREE.MeshStandardMaterial({
      color: '#b8d4ff',
      metalness: 1,
      roughness: 0.22,
    }),
    pinkGlow: new THREE.MeshBasicMaterial({
      color: '#ff4f87',
    }),
  };

  return {
    ...palette,
    dispose() {
      // Centralized cleanup keeps resource ownership explicit.
      Object.values(palette).forEach((material) => material.dispose());
    },
  };
}
```

Keep the palette small enough that every material has a role. Four deliberate materials often produce a stronger hierarchy than twenty competing finishes.

### Pattern 2: Texture loader with correct color-space semantics

**Use when:** a material uses external PBR textures and must preserve color accuracy.

```js
import * as THREE from 'three';

export function loadSurfaceTextures(basePath) {
  const loader = new THREE.TextureLoader();

  const colorMap = loader.load(`${basePath}/basecolor.jpg`);
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const roughnessMap = loader.load(`${basePath}/roughness.jpg`);
  roughnessMap.colorSpace = THREE.NoColorSpace;

  const normalMap = loader.load(`${basePath}/normal.jpg`);
  normalMap.colorSpace = THREE.NoColorSpace;

  return {
    colorMap,
    roughnessMap,
    normalMap,
    dispose() {
      // Textures are separately allocated GPU resources.
      colorMap.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
    },
  };
}
```

This pattern assumes the files exist and that their channel conventions match the material properties. Confirm texture orientation, UV layout, and normal-map convention if the surface looks inverted or seams appear.

### Pattern 3: Material variants without shared-state surprises

**Use when:** a set of objects share a base material but one selected object needs a unique state.

```js
const baseMaterial = new THREE.MeshStandardMaterial({
  color: '#252d3b',
  roughness: 0.6,
  metalness: 0.12,
});

function createSelectedMaterial() {
  const selected = baseMaterial.clone();
  selected.color.set('#ff4f87');
  selected.emissive.set('#26000d');
  selected.emissiveIntensity = 0.7;
  return selected;
}
```

Do not edit `baseMaterial.color` to highlight one object if every mesh using it should remain unchanged. Clone only when you need independent state; cloning every material unnecessarily can increase memory and make global tuning harder.

### Pattern 4: Glass-like panel with restrained transparency

**Use when:** a hero panel should feel like translucent acrylic or tinted glass.

```js
const glassPanel = new THREE.MeshPhysicalMaterial({
  color: '#a8caff',
  metalness: 0,
  roughness: 0.12,
  transparent: true,
  opacity: 0.42,
  clearcoat: 0.9,
  clearcoatRoughness: 0.08,
  side: THREE.DoubleSide,
});
```

Use this as a starting point, not a promise of physically correct glass. For convincing real glass, evaluate `transmission`, `thickness`, the environment, and the scene's background. Transparent layers can sort incorrectly, so avoid stacking many large transparent planes. A subtle tinted panel with a readable edge often works better for interface-adjacent 3D art than an elaborate glass effect that hides content.

### Pattern 5: Emissive accent without flattening the whole object

**Use when:** a small element should glow visually while its main surface still responds to light.

```js
const housingMaterial = new THREE.MeshStandardMaterial({
  color: '#1d2430',
  metalness: 0.35,
  roughness: 0.42,
  emissive: '#ff2f79',
  emissiveIntensity: 0.18,
});

const indicatorMaterial = new THREE.MeshBasicMaterial({
  color: '#ff4f87',
});
```

Keep the housing's emissive intensity low and put the bright unlit material on a small indicator. Emissive appearance alone does not automatically illuminate neighboring objects; use actual lights or a post-processing bloom pass if light spill is part of the design.

### Pattern 6: Debug a material by isolating variables

**Use when:** the surface looks wrong and it is unclear whether the cause is the texture, light, material values, or renderer configuration.

```js
function inspectMaterial(material) {
  const original = {
    color: material.color?.clone(),
    roughness: material.roughness,
    metalness: material.metalness,
    map: material.map,
    normalMap: material.normalMap,
    roughnessMap: material.roughnessMap,
  };

  // Temporarily neutralize inputs so the base response can be judged.
  material.map = null;
  material.normalMap = null;
  material.roughnessMap = null;
  if (material.color) material.color.set('#b8c2d4');
  if ('roughness' in material) material.roughness = 0.45;
  if ('metalness' in material) material.metalness = 0.15;
  material.needsUpdate = true;

  return () => {
    material.color?.copy(original.color);
    material.roughness = original.roughness;
    material.metalness = original.metalness;
    material.map = original.map;
    material.normalMap = original.normalMap;
    material.roughnessMap = original.roughnessMap;
    material.needsUpdate = true;
  };
}
```

Use the returned restore function after inspection. This example deliberately focuses on a common standard/physical material subset; do not use it as a generic snapshot utility for every possible material property.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Making every surface highly metallic | Metallic reflections are mistaken for quality | Use `metalness: 0` for most non-metals and reserve high values for metallic surfaces |
| Setting roughness to zero everywhere | Sharp highlights look impressive in a single screenshot | Use roughness to describe the surface and test under the final lighting |
| Tuning materials in a dark or empty scene | The environment provides too little reflected information | Add a deliberate key/fill/rim setup or a useful environment map before tuning |
| Using `MeshPhysicalMaterial` for every object | More properties appear to mean more realism | Start with `MeshStandardMaterial`; upgrade only for a specific optical effect |
| Treating base color as the final displayed color | Color management and tone mapping are ignored | Configure output color space and tone mapping, then judge in the rendered scene |
| Marking normal or roughness maps as sRGB | All images are treated like color photographs | Use sRGB for color textures and no color space for data textures |
| Baking shadows into an albedo texture | The texture looks convincing in one light setup | Keep base color free of lighting information so it works under changing lights |
| Using alpha blending for every cutout | Transparency seems like the universal solution | Use `alphaTest` for hard cutouts and blending only when partial transparency is needed |
| Enabling `DoubleSide` by default | It hides back-face and normal issues | Use it only for genuinely thin or two-sided surfaces |
| Mutating a shared material for one mesh | Material instances are shared by reference | Clone for independent variants or use a uniform shared state |
| Forgetting to dispose textures and materials | GPU allocations are invisible to JavaScript memory inspection | Assign ownership and dispose exclusively owned resources during teardown |
| Expecting emissive materials to light nearby objects | “Glowing” appearance is confused with emitted scene illumination | Add lights or bloom separately when actual spill is required |
| Overusing ambient occlusion | Dark creases are mistaken for depth | Keep AO subtle and verify it does not muddy broad surfaces |
| Using high-resolution maps for tiny objects | Texture detail is judged at 100% zoom | Match texture resolution to projected screen size and viewing distance |

## Mental Models

1. **Material is a response model:** it defines how a surface reacts to light, not just its color.
2. **Roughness is highlight spread:** lower values sharpen reflections; higher values broaden them.
3. **Metalness is a category:** it describes metallic behavior, not a generic realism slider.
4. **Lighting is half the material:** a surface cannot reflect information that the scene does not provide.
5. **Maps have semantics:** color maps and numeric data maps require different color-space treatment.
6. **Design tokens scale:** named, shared material roles make global art direction easier to maintain.
7. **Resources have owners:** dispose a texture or material only when its owning system is finished with it.

## Quick Reference

| Need | Recommended starting point | Watch out for |
|---|---|---|
| General opaque surface | `MeshStandardMaterial` | Tune it under representative lighting |
| Extra clear coating | `MeshPhysicalMaterial` + `clearcoat` | Do not add it if the highlight is not visible |
| Metal | `metalness: 1`, roughness adjusted to finish | Requires useful environment reflections |
| Non-metal | `metalness: 0` | Color alone does not establish realism |
| Soft matte finish | `roughness: 0.75–0.95` | Very high roughness can flatten contrast |
| Polished finish | `roughness: 0.1–0.3` | Can become visually noisy under harsh lights |
| Color texture | `map` + `texture.colorSpace = THREE.SRGBColorSpace` | Do not bake in shadows |
| Normal map | `normalMap` | It does not change silhouette |
| Roughness map | `roughnessMap` | Treat as data, not sRGB color |
| Hard cutout | `alphaTest` | Choose threshold to suit the texture |
| Glass-like appearance | `MeshPhysicalMaterial` | Transparency sorting and environment matter |
| Glow appearance | `emissive` or `MeshBasicMaterial` | Emissive does not automatically light neighbors |
| Independent selected state | `material.clone()` | Dispose the clone when no longer used |
| Shared palette | Named material tokens | Do not mutate a shared token for a one-off effect |
| Cleanup | `material.dispose()` and `texture.dispose()` | Never dispose resources still used elsewhere |

## Build Challenge

### Build a premium material study for a creative-developer portfolio

Create a single Three.js scene that presents a small family of materials as a deliberate art-directed collection rather than a generic showroom.

**Requirements**

1. Create at least five objects using distinct surface roles: matte polymer, satin ceramic, brushed metal, polished metal, and tinted translucent acrylic.
2. Use a shared material palette module with named tokens; clone only materials that need independent state.
3. Add a key light and at least one fill or rim light. Tune the light setup before finalizing roughness and metalness.
4. Use a color-management configuration with an intentional output color space and tone-mapping choice.
5. Add one small emissive indicator, but keep the main object surfaces readable and dimensional.
6. If using textures, set color-space annotations correctly and include at least one non-color data map.
7. Add a simple interaction that changes one object's selected material state without unexpectedly changing every object that shares the base material.
8. Implement teardown that disposes resources created by the scene and does not dispose shared resources prematurely.
9. Test the composition at desktop and mobile viewport sizes; keep the material differences visible at the smaller size.
10. Capture a screenshot and write a short note explaining why each material uses its chosen roughness, metalness, and any physical extras.

**Expected output / definition of done**

- The scene contains five clearly distinguishable surfaces under a consistent lighting setup.
- Metal objects show useful environmental highlights instead of appearing uniformly black.
- Non-metal objects do not look metallic merely because their roughness is low.
- The translucent panel remains visually intentional and does not obscure the entire composition.
- Selecting one object changes only that object's state.
- No console warnings or obvious resource leaks occur during repeated mount/unmount cycles.
- The material system can be retuned from one palette module without hunting through unrelated component files.

**Focused-session plan**

- 15 minutes: establish the renderer, camera, and lighting.
- 25 minutes: build the palette and tune the five surface roles.
- 20 minutes: implement the selected state and cleanup.
- 15 minutes: test desktop/mobile framing and document the decisions.

## Senior Review Checklist

Before calling the scene finished, ask:

- Can I explain the physical or stylistic purpose of every non-default material property?
- Does the material still read correctly when the camera moves or the object rotates?
- Are reflections supported by the environment, or am I using color to fake them?
- Is every texture assigned to the correct property and color space?
- Are transparent surfaces necessary, and can their sorting artifacts be avoided?
- Are shared material instances treated as shared state?
- Are all exclusively owned GPU resources disposed at the correct lifecycle boundary?
- Does the material hierarchy support the composition instead of competing with it?

If you cannot explain a property choice, remove it temporarily. A simpler material that reads clearly is better than a complex material whose purpose is unclear.
