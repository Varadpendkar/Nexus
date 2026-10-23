# SKILL: threejs-textures

**Layer:** 06 — Three.js / WebGL  
**Goal:** Apply and manage textures in Three.js with correct UV mapping, color-space handling, filtering, and memory-aware loading so surfaces look intentional across desktop and mobile.

## Why This Matters (Senior Perspective)

Textures often determine whether a 3D scene feels authored or generic. They provide color variation, fine surface detail, labels, decals, roughness breakup, normal detail, and environmental context. But a texture is not simply an image placed on an object: it is sampled through UV coordinates, interpreted in a color space, filtered according to screen size, and uploaded into GPU memory. A texture can be visually beautiful and still be wrong because it is too large, has incorrect color-space metadata, uses a poor UV layout, or is loaded without a lifecycle plan.

A common junior mistake is treating every map as a color image and setting them all the same way. Color maps represent visible color and should generally use the sRGB color space; data maps such as roughness, metalness, ambient occlusion, and normal maps are numeric information and should remain in a linear data space. Confusing these changes the result in ways that can be hard to diagnose: colors become washed out or too dark, roughness behaves unexpectedly, and normal details appear incorrect. Another mistake is assuming a texture’s file size is its GPU cost. Once uploaded, an uncompressed RGBA texture can consume much more memory than its compressed download size, and mipmaps increase that allocation further.

Senior texture work begins with a visual requirement: what detail must be visible, at what distance, and on which devices? Use a map only when it adds information that geometry or material parameters cannot supply more efficiently. Plan UVs, choose appropriate resolution, configure color space and filtering, reuse shared textures, and dispose resources when their owner is finished. This is especially important in portfolio scenes, where a few large, detailed objects can quietly consume the memory budget before animation or post-processing is even considered.

## Core Concepts

### 1. A texture is sampled through UV coordinates

A texture is a 2D image, while a 3D surface needs a rule for which image coordinate belongs to each surface point. UV coordinates provide that mapping: `u` typically runs horizontally and `v` vertically. UVs are attributes on the geometry, so a texture can look stretched or rotated even when the image itself is correct.

```js
import * as THREE from 'three';

const geometry = new THREE.BoxGeometry(2, 2, 2);
const texture = new THREE.TextureLoader().load('/textures/panel-color.jpg');

texture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 0.65,
});

const panel = new THREE.Mesh(geometry, material);
scene.add(panel);
```

Built-in geometries usually include UVs, but a custom `BufferGeometry` must provide them if it uses texture maps. Inspect the UV layout in a modeling tool or use a UV checker image before debugging texture settings. A texture that appears stretched may need a better UV unwrap rather than a different material.

### 2. Color maps and data maps use different color spaces

Color textures store colors intended to be viewed, such as albedo/base color. They should generally be marked as sRGB so Three.js can convert them correctly into its linear working space. Data textures store values rather than displayed colors; normal, roughness, metalness, and ambient-occlusion maps should not be marked as sRGB.

```js
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

const colorMap = loader.load('/textures/ceramic-basecolor.jpg');
colorMap.colorSpace = THREE.SRGBColorSpace;

const roughnessMap = loader.load('/textures/ceramic-roughness.jpg');
// Data maps remain in the default linear/no-color-space configuration.

const normalMap = loader.load('/textures/ceramic-normal.jpg');

const material = new THREE.MeshStandardMaterial({
  map: colorMap,
  roughnessMap,
  normalMap,
  roughness: 0.8,
});
```

Do not set every texture to `THREE.SRGBColorSpace` as a blanket rule. The map’s semantic meaning determines its color-space configuration. If a normal map is interpreted as color, the sampled vector values are transformed incorrectly and lighting can look distorted.

### 3. Material maps represent different physical properties

A physically based material can combine multiple maps, each controlling a different property:

- `map`: base color / albedo.
- `roughnessMap`: local surface roughness; white generally means rougher and black smoother.
- `metalnessMap`: local metalness.
- `normalMap`: small-scale surface orientation detail without changing the silhouette.
- `aoMap`: baked ambient occlusion, often requiring a second UV channel in common workflows.
- `emissiveMap`: spatial variation in emitted light/color.
- `alphaMap`: opacity variation, subject to material transparency/alpha settings.
- `bumpMap`: height-derived shading detail, distinct from a tangent-space normal map.

```js
const material = new THREE.MeshStandardMaterial({
  map: colorMap,
  roughnessMap,
  metalnessMap,
  normalMap,
  aoMap,
  aoMapIntensity: 0.8,
  metalness: 0.15,
  roughness: 0.7,
});
```

A map does not replace the scalar property in every situation; scalar values and map values work together according to the material’s shader. Check the official API for the exact semantics of the Three.js version used by your project, particularly for UV channels and advanced material features.

### 4. Texture resolution and mipmaps

Texture resolution should be chosen based on the size of the object on screen and the smallest details that must remain readable. Large textures consume GPU memory even when the downloaded file is small. Mipmaps store progressively smaller versions of a texture and improve sampling when the object is far away or occupies fewer pixels.

A useful rough estimate for an uncompressed RGBA8 texture is:

\[
\text{memory} \approx \text{width} \times \text{height} \times 4
\]

A 2048 × 2048 texture therefore needs about 16 MiB for its base level alone; a full mip chain raises the total by roughly one third. Exact GPU allocation depends on format, driver, and hardware. Compressed texture formats can reduce memory and bandwidth when the asset pipeline and target devices support them.

```js
const texture = new THREE.TextureLoader().load('/textures/hero-basecolor.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

// Let the renderer use mipmaps for a texture that will be seen at many distances.
texture.generateMipmaps = true;
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
```

Do not force mipmap settings without checking the texture type and renderer support. For ordinary color textures, defaults are usually sensible. Non-power-of-two textures and modern WebGL capabilities have specific constraints; use Three.js defaults unless you have a measured reason to override them.

### 5. Wrapping, repetition, and offset

Texture wrapping controls what happens when UV coordinates leave the 0–1 range. `ClampToEdgeWrapping` stretches the edge texels, `RepeatWrapping` tiles the image, and `MirroredRepeatWrapping` alternates its direction. Repeating is useful for brick, fabric, floor, and procedural surface patterns, but the image must tile cleanly or seams will appear.

```js
const floorTexture = new THREE.TextureLoader().load('/textures/concrete-tile.jpg');
floorTexture.colorSpace = THREE.SRGBColorSpace;

floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(4, 3);

// Configure transforms before the first render where possible.
floorTexture.offset.set(0.1, 0);
floorTexture.rotation = 0;
floorTexture.center.set(0.5, 0.5);
floorTexture.needsUpdate = true;
```

Repeat values multiply the UV tiling; they do not increase the source resolution. If the texture repeats too often, the pattern may become visually noisy or reveal obvious repetition. For close-up surfaces, use seamless assets and vary roughness, scale, or placement to reduce the tiled look.

### 6. Filtering and anisotropy

Texture filtering determines how texels are combined when sampling. Nearest filtering preserves hard pixel boundaries; linear filtering smooths samples; mipmapped filters select prefiltered texture levels at smaller screen sizes. Anisotropic filtering improves the appearance of textures viewed at grazing angles, such as a floor receding toward the horizon.

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const texture = new THREE.TextureLoader().load('/textures/studio-floor.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
texture.anisotropy = Math.min(
  renderer.capabilities.getMaxAnisotropy(),
  8
);
```

Anisotropy has a cost, so do not automatically set every texture to the hardware maximum. Use it where the viewing angle makes the improvement visible. A capped renderer pixel ratio also helps avoid multiplying the cost of every full-screen effect on high-density displays.

### 7. Normal maps add shading detail, not silhouette

A normal map stores directions that perturb the surface normal used for lighting. It can make a low-poly surface appear to contain fine grooves or pores, but it does not alter the mesh’s actual shape or collision silhouette. A normal map must match the model’s UVs and tangent basis; incompatible conventions can create inverted or inconsistent lighting.

```js
const normalMap = new THREE.TextureLoader().load('/textures/brushed-metal-normal.jpg');

const material = new THREE.MeshStandardMaterial({
  color: '#b8bec9',
  metalness: 0.72,
  roughness: 0.36,
  normalMap,
  normalScale: new THREE.Vector2(0.45, 0.45),
});
```

Start with a restrained `normalScale`. Strong normal detail on polished metal can make highlights chaotic and distract from the object’s shape. If a groove must change the silhouette or cast a real shadow, use geometry or a suitable displacement workflow instead.

### 8. Load asynchronously and handle failures

Texture loading is asynchronous. A production scene should have a predictable loading state and an error path. `TextureLoader.load()` returns a texture immediately, but its image may not be ready yet. Use the callbacks or a loading manager to coordinate scene readiness.

```js
const manager = new THREE.LoadingManager();

manager.onLoad = () => {
  console.info('All scene textures have finished loading.');
};

manager.onError = (url) => {
  console.error(`Failed to load texture: ${url}`);
};

const loader = new THREE.TextureLoader(manager);

const texture = loader.load(
  '/textures/hero-basecolor.jpg',
  () => {
    // Texture has loaded; update UI state if the hero was waiting for it.
  },
  undefined,
  (error) => {
    console.error('Texture loading failed.', error);
  }
);
texture.colorSpace = THREE.SRGBColorSpace;
```

Do not let a missing decorative texture block the entire page indefinitely. Decide which assets are essential and provide a fallback material or color for non-critical detail. In React, avoid creating duplicate loaders and textures on every render; load through a stable asset layer or a cache.

### 9. Texture ownership and disposal

Textures occupy GPU resources and have their own lifecycle. Removing a mesh or disposing its material does not necessarily dispose a texture shared by another material. Decide whether the component owns the texture or an asset manager owns it. Only the owner should dispose it when all consumers are finished.

```js
function disposeOwnedMaterial(material) {
  const materials = Array.isArray(material) ? material : [material];

  for (const item of materials) {
    if (!item) continue;

    // Dispose texture properties only if this component owns those textures.
    for (const value of Object.values(item)) {
      if (value && value.isTexture) value.dispose();
    }

    item.dispose();
  }
}
```

This example is intentionally ownership-dependent: indiscriminately disposing every texture property can break other meshes if those textures are shared. In a shared asset system, track ownership or reference counts and dispose resources at the asset-manager boundary.

## Advanced Patterns

### Pattern 1: Centralized texture loader with semantic configuration

Use a small helper so color maps and data maps cannot be accidentally configured the same way. Keep semantic decisions close to loading rather than scattering them across materials.

```js
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function loadColorTexture(url) {
  const texture = loader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function loadDataTexture(url) {
  // Roughness, normal, metalness, and AO maps contain data, not display colors.
  return loader.load(url);
}

const baseColor = loadColorTexture('/textures/shell-basecolor.jpg');
const roughness = loadDataTexture('/textures/shell-roughness.jpg');
const normal = loadDataTexture('/textures/shell-normal.jpg');

const shellMaterial = new THREE.MeshStandardMaterial({
  map: baseColor,
  roughnessMap: roughness,
  normalMap: normal,
  metalness: 0.18,
  roughness: 0.6,
});
```

If your app needs load progress and error reporting, wrap this behind a loader service that uses a shared `LoadingManager`. Keep the map semantic explicit in names such as `baseColor`, `normal`, and `roughness`, not generic names such as `texture1`.

### Pattern 2: Seamless tiled surface

Use this for floors, walls, and repeating material panels. The surface must have valid UVs and the source image must tile without a visible edge discontinuity.

```js
import * as THREE from 'three';

export function createTiledFloor() {
  const texture = new THREE.TextureLoader().load('/textures/stone-seamless.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);

  const geometry = new THREE.PlaneGeometry(20, 20);
  geometry.rotateX(-Math.PI / 2);

  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.9,
    metalness: 0,
  });

  const floor = new THREE.Mesh(geometry, material);
  floor.receiveShadow = true;

  return { floor, texture, material };
}
```

If repetition becomes obvious, do not immediately increase texture resolution. Try reducing the contrast of the tile, changing repeat scale, blending a second low-frequency variation, or using a procedural shader for large surfaces. Repetition is an art-direction issue as much as a resolution issue.

### Pattern 3: Texture transform for a controlled decal-like treatment

For simple planar graphics, a texture transform can position and scale an image over existing UVs. For complex decals on curved objects, use a proper decal projection or separate geometry rather than fighting the UV layout.

```js
const labelTexture = new THREE.TextureLoader().load('/textures/product-label.png');
labelTexture.colorSpace = THREE.SRGBColorSpace;
labelTexture.wrapS = THREE.ClampToEdgeWrapping;
labelTexture.wrapT = THREE.ClampToEdgeWrapping;
labelTexture.repeat.set(0.45, 0.3);
labelTexture.offset.set(0.28, 0.35);

const labelMaterial = new THREE.MeshBasicMaterial({
  map: labelTexture,
  transparent: true,
  depthWrite: false,
});
```

This works only when the target geometry’s UV layout matches the desired placement. `depthWrite: false` can help with transparent overlays, but may introduce sorting artifacts; use it deliberately and test the camera angles that matter. A dedicated plane with known UVs is often more predictable for a UI label.

### Pattern 4: Reuse maps across related materials

Use shared textures when multiple objects use the same surface asset. Reuse reduces duplicate downloads and can reduce memory pressure. The objects can still have different scalar roughness, color tint, or normal strength where the material supports those differences.

```js
const sharedBaseColor = new THREE.TextureLoader().load('/textures/fabric-basecolor.jpg');
sharedBaseColor.colorSpace = THREE.SRGBColorSpace;

const sharedRoughness = new THREE.TextureLoader().load('/textures/fabric-roughness.jpg');

const seatMaterial = new THREE.MeshStandardMaterial({
  map: sharedBaseColor,
  roughnessMap: sharedRoughness,
  roughness: 0.82,
});

const panelMaterial = new THREE.MeshStandardMaterial({
  map: sharedBaseColor,
  roughnessMap: sharedRoughness,
  color: '#ded8d0',
  roughness: 0.9,
});
```

Treat shared textures as shared resources. A component should not dispose them merely because its own mesh was removed. If you need different wrapping or transforms, remember that those settings belong to the texture object; clone the texture when independent transforms are needed, while accounting for its lifecycle.

### Pattern 5: Responsive texture quality policy

Use a quality policy for texture resolution and anisotropy based on measured constraints. The example below selects among pre-generated assets, which is usually safer than trying to downsample a loaded GPU texture at runtime.

```js
function chooseTextureAsset({ compact, lowMemory }) {
  if (lowMemory) return '/textures/hero-basecolor-512.jpg';
  if (compact) return '/textures/hero-basecolor-1024.jpg';
  return '/textures/hero-basecolor-2048.jpg';
}

function loadHeroTexture({ compact, lowMemory }) {
  const texture = new THREE.TextureLoader().load(
    chooseTextureAsset({ compact, lowMemory })
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
```

The `compact` and `lowMemory` flags should come from your app’s real responsive/performance policy. Viewport width alone is not a reliable measure of GPU capability. Use asset variants created during the build pipeline, and validate that the lower-resolution version still preserves the required visual detail.

### Pattern 6: Texture debugging material

When a surface looks wrong, isolate the map before changing several material properties at once. A debug material can reveal UV distortion or whether the texture is actually being sampled.

```js
const uvDebugMaterial = new THREE.MeshBasicMaterial({
  map: new THREE.TextureLoader().load('/textures/uv-checker.png'),
  side: THREE.DoubleSide,
});

// Temporarily swap the material to inspect the UV layout.
const previousMaterial = mesh.material;
mesh.material = uvDebugMaterial;

// Restore after inspection and dispose only the debug resources you own.
function restoreMaterial() {
  mesh.material = previousMaterial;
  uvDebugMaterial.map?.dispose();
  uvDebugMaterial.dispose();
}
```

A checker that stretches dramatically indicates a UV or geometry problem, not necessarily a filtering problem. A flat or missing texture can indicate a failed URL, missing UVs, incorrect material assignment, or an unhandled loading error. Debug one variable at a time.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Marking every map as sRGB | Maps are treated as interchangeable images | Use sRGB for color maps; keep numeric data maps in linear/no-color-space configuration |
| Using a huge texture on a small object | Download size is mistaken for GPU cost | Choose resolution based on projected size and memory budget |
| Assuming a normal map changes silhouette | Surface detail looks like geometry | Use geometry when silhouette or real displacement must change |
| Stretching a texture across custom geometry | UVs are missing or poorly authored | Inspect UVs with a checker and correct the mapping |
| Obvious tile repetition | A seamless image is repeated too often | Adjust scale, contrast, or add controlled variation |
| Loading textures on every component render | Resource creation is placed in render logic | Cache textures or load them through a stable asset manager |
| Disposing shared textures from a child component | Ownership is unclear | Dispose only resources owned by that component |
| Setting anisotropy to maximum everywhere | Quality is optimized without measuring cost | Cap anisotropy and prioritize grazing-angle surfaces |
| Ignoring mipmaps | Texture looks noisy or shimmers at distance | Use appropriate mipmapped filtering for ordinary image textures |
| Treating alpha as free | Transparent pixels still require sampling and sorting | Use opaque assets when possible; manage alpha/depth settings intentionally |
| Fixing color issues by changing material color | The real issue is color-space interpretation | Verify map semantics and color-space configuration first |
| Assuming successful download means successful render | UVs, material maps, and texture readiness are separate concerns | Verify map assignment, UVs, loading callbacks, and renderer state |

## Mental Models

1. **UVs are the address system:** they tell each surface point where to sample the image.
2. **Color is not data:** base color represents visible color; roughness and normal maps encode numeric properties.
3. **GPU memory is not download size:** decoded texture allocation and mipmaps matter after the asset reaches the device.
4. **Maps do not change silhouettes:** normal maps alter shading; geometry defines the actual outline.
5. **Every texture needs an owner:** shared assets must outlive every consumer that uses them.
6. **Debug in isolation:** inspect UVs and maps before tuning the entire material stack.
7. **Use detail where it survives projection:** a map should earn its memory cost by improving the rendered result.

## Quick Reference

| Goal | Setting / technique | Important note |
|---|---|---|
| Correct base color | `texture.colorSpace = THREE.SRGBColorSpace` | Use for color/albedo maps |
| Configure data map | Leave default linear/no-color-space behavior | Normal, roughness, metalness, AO maps are data |
| Repeat a texture | `wrapS` / `wrapT = THREE.RepeatWrapping` | Source should tile seamlessly |
| Reduce distant shimmer | Mipmapped minification filtering | Defaults are usually appropriate |
| Improve oblique floor detail | Capped `texture.anisotropy` | Use only where visible |
| Add fine surface relief | `normalMap` | Does not change silhouette |
| Inspect UV mapping | Checker texture + basic material | Distortion usually means UV issues |
| Reduce GPU allocation | Lower-resolution asset variants | Plan for mipmaps and decoded memory |
| Reuse assets | Shared texture references | Define lifecycle ownership |
| Release texture | `texture.dispose()` | Only when no consumers remain |

## Build Challenge

### Build a “Material Atlas” product showcase

Create a Three.js portfolio section featuring one hero object and three smaller samples that demonstrate distinct surface qualities: matte ceramic, brushed metal, and textured polymer. The section should communicate material differences through maps and lighting rather than relying only on color changes.

1. Create or use a hero mesh with usable UV coordinates. Add a UV-checker debug mode that can be toggled during development.
2. Load a base-color map and mark it as sRGB. Add at least one data map such as roughness or normal, keeping its color-space configuration appropriate to the map’s meaning.
3. Configure texture repetition and filtering intentionally for one tiled surface; verify that seams are not obvious.
4. Share a texture between two materials where it makes sense, and document who owns and disposes it.
5. Add asynchronous loading feedback and a fallback material for a non-critical texture failure.
6. Prepare at least two resolutions for the hero’s primary color texture and select between them through a simple quality policy.
7. Inspect the showcase at desktop and mobile viewport sizes. Reduce unnecessary texture detail if it does not survive screen projection.
8. Add a cleanup path that disposes only resources owned by the showcase.

**Expected output / definition of done**

- A working material showcase with visibly distinct surface responses under consistent lighting.
- Correct color-space handling for color maps versus data maps.
- No obvious UV stretching or tile seams at the intended camera angles.
- A repeatable loading and failure state.
- A documented texture ownership policy that prevents accidental disposal of shared assets.
- A short README note explaining texture resolution choices and the quality/performance trade-offs.
