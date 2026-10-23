# SKILL: uv-distortion

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Distort texture and procedural coordinates in GLSL to create controlled refraction, liquid motion, heat-haze, glitch, and transition effects without introducing unstable artifacts.

## Why This Matters (Senior Perspective)

UV coordinates determine where a shader samples a texture or evaluates a procedural pattern. Distorting those coordinates is one of the most versatile techniques in real-time visual design: a small offset can make a static image feel liquid, bend a background like glass, create heat shimmer, or produce a stylized digital glitch. The key idea is that the shader often does not move the image directly; it changes the coordinates used to look up the image.

Good UV distortion is controlled rather than random. A senior implementation distinguishes the source coordinate system from the distortion field, keeps amplitude relative to the effect's scale, and avoids high-frequency offsets that shimmer or tear the image. It also handles aspect ratio, edge behavior, texture filtering, and animation continuity. A visually impressive distortion that breaks at a different viewport size or creates hard seams at the texture boundary is not production-ready.

For creative-development work, UV distortion can become a reusable visual primitive: a liquid image reveal, an interactive glass panel, a heatwave behind a hero title, or a noisy transition between portfolio sections. Keep the distortion field separate from the source texture, expose amplitude and frequency as uniforms, and make the effect easy to disable for reduced-motion settings or low-powered devices.

## Core Concepts

### 1. UV coordinates are lookup coordinates

**Mental model:** A UV coordinate tells a shader where to sample a texture. If the shader samples at `vUv`, it uses the original mapping. If it samples at `vUv + offset`, it reads a nearby point and the image appears displaced.

```glsl
uniform sampler2D uTexture;
uniform vec2 uOffset;
varying vec2 vUv;

void main() {
  // Offset the lookup coordinate rather than changing the mesh geometry.
  vec2 distortedUv = vUv + uOffset;
  vec4 sourceColor = texture2D(uTexture, distortedUv);

  gl_FragColor = sourceColor;
}
```

**Gotcha:** The sample uses GLSL 1 syntax for `ShaderMaterial`. In GLSL 3, use `texture()` and the appropriate input/output declarations. A constant offset merely translates the lookup; a spatially varying offset is what creates bending or warping.

### 2. Distortion fields and amplitude

**Mental model:** A distortion field supplies an offset at each point. Amplitude controls how far the lookup moves; frequency controls how quickly the offset changes across the image.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
varying vec2 vUv;

void main() {
  // Two low-frequency waves produce a gentle, continuous displacement field.
  vec2 offset;
  offset.x = sin(vUv.y * uFrequency + uTime) * uAmplitude;
  offset.y = cos(vUv.x * (uFrequency * 0.8) - uTime * 0.7) * uAmplitude;

  vec4 sourceColor = texture2D(uTexture, vUv + offset);
  gl_FragColor = sourceColor;
}
```

**Gotcha:** UV offsets are measured in UV units, not pixels. An amplitude of `0.02` moves the lookup by two percent of the texture range. Start small and tune by visual scale.

### 3. Noise-driven distortion

**Mental model:** Coherent noise creates a smoother and less mechanical offset than independent random values. Sample a stable field and animate its coordinates slowly to make the image appear to flow.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform float uAmplitude;
varying vec2 vUv;

// Assume a complete valueNoise(vec2) function is included in the shader source.
void main() {
  // Use separate offsets so horizontal and vertical movement are not identical.
  float noiseX = valueNoise(vUv * 3.0 + vec2(uTime * 0.03, 0.0));
  float noiseY = valueNoise(vUv * 3.0 + vec2(7.1, -uTime * 0.025));

  vec2 offset = (vec2(noiseX, noiseY) - 0.5) * uAmplitude;
  gl_FragColor = texture2D(uTexture, vUv + offset);
}
```

**Gotcha:** The noise function must be fully defined in the shader source. A declaration alone will not compile. Large amplitudes can make features appear to tear apart, especially when the source image contains fine text or sharp edges.

### 4. Keep coordinate systems consistent

**Mental model:** UVs are usually normalized texture coordinates. Screen pixels, world positions, and UVs are different spaces. A distortion offset computed in one space must be converted before it is added to coordinates in another.

```glsl
uniform vec2 uResolution;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  // Aspect-correct X so a wave has comparable screen-space scale on wide and tall canvases.
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 centered = uv - 0.5;
  centered.x *= aspect;

  float wave = sin(centered.y * 18.0 + uTime);
  centered.x += wave * 0.008;

  // Undo the aspect correction before sampling the texture.
  centered.x /= aspect;
  gl_FragColor = texture2D(uTexture, centered + 0.5);
}
```

**Gotcha:** Aspect correction is useful for screen-space effects but may be wrong for textures attached to a non-square object. Choose whether the effect should be consistent in UV space, screen space, or world space.

### 5. Texture edges and wrapping

**Mental model:** Distortion may push lookup coordinates outside the 0–1 range. What happens then depends on the texture's wrap mode and the sampling setup.

For a photograph that should not repeat, clamp the texture edges:

```js
texture.wrapS = THREE.ClampToEdgeWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.needsUpdate = true;
```

For a deliberately repeating pattern, use repeat wrapping and configure repeat values:

```js
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(2, 2);
texture.needsUpdate = true;
```

**Gotcha:** Clamping prevents repetition but can stretch the edge color into visible bands when the distortion is strong. Alternatives include fading distortion near the edge, adding a border, or using a source image with safe margins.

### 6. Fade distortion at boundaries

**Mental model:** A mask can reduce offset near texture edges so the lookup remains in bounds and the image's perimeter stays stable.

```glsl
uniform sampler2D uTexture;
uniform float uAmplitude;
uniform float uTime;
varying vec2 vUv;

void main() {
  // Fade to zero close to the texture boundary.
  float edgeX = smoothstep(0.0, 0.08, vUv.x) *
                (1.0 - smoothstep(0.92, 1.0, vUv.x));
  float edgeY = smoothstep(0.0, 0.08, vUv.y) *
                (1.0 - smoothstep(0.92, 1.0, vUv.y));
  float edgeMask = edgeX * edgeY;

  vec2 waveOffset = vec2(
    sin(vUv.y * 20.0 + uTime),
    cos(vUv.x * 17.0 - uTime * 0.8)
  ) * uAmplitude * edgeMask;

  gl_FragColor = texture2D(uTexture, vUv + waveOffset);
}
```

**Gotcha:** This mask protects the border visually but does not guarantee all coordinates remain in bounds if amplitude is large. Clamp the offset or keep a safety margin when required.

### 7. Refraction-style offsets

**Mental model:** A refractive look can be approximated by offsetting a background or image sample according to a normal-like field. This is a screen-space visual trick, not physically accurate ray tracing.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
varying vec2 vUv;

void main() {
  // A small animated field acts as a stylized normal map.
  vec2 pseudoNormal = vec2(
    sin(vUv.y * 28.0 + uTime),
    cos(vUv.x * 25.0 - uTime * 0.8)
  );

  // Small offsets make the image feel bent without destroying legibility.
  vec2 refractedUv = vUv + pseudoNormal * uStrength;
  gl_FragColor = texture2D(uTexture, refractedUv);
}
```

**Gotcha:** True screen-space refraction requires access to a rendered scene texture or render target. A regular material cannot automatically sample arbitrary pixels behind itself. Use a render target or a suitable Three.js transmission material when actual scene refraction is required.

### 8. Chromatic aberration

**Mental model:** Chromatic aberration samples the red, green, and blue channels at slightly different coordinates. The result can suggest lens distortion or a digital glitch, but large offsets create color fringing that quickly looks cheap.

```glsl
uniform sampler2D uTexture;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec2 direction = normalize(vUv - 0.5);

  // Each color channel uses a slightly different radial lookup coordinate.
  float redChannel = texture2D(uTexture, vUv + direction * uStrength).r;
  float greenChannel = texture2D(uTexture, vUv).g;
  float blueChannel = texture2D(uTexture, vUv - direction * uStrength).b;

  gl_FragColor = vec4(redChannel, greenChannel, blueChannel, 1.0);
}
```

**Gotcha:** `normalize(vUv - 0.5)` is undefined or unstable at the exact center where the vector length is zero. Use a small guard or a different direction calculation if the center can be sampled.

Safer version:

```glsl
vec2 radialDirection = vUv - 0.5;
float radialLength = max(length(radialDirection), 0.0001);
vec2 direction = radialDirection / radialLength;
```

### 9. Scroll-driven UV distortion

**Mental model:** Scroll should usually change a uniform such as progress or strength. Keep the shader stable and let the scroll controller update a parameter, rather than rebuilding the material or recalculating the entire source texture on the CPU.

```glsl
uniform sampler2D uTexture;
uniform float uProgress;
uniform float uStrength;
varying vec2 vUv;

void main() {
  float progress = clamp(uProgress, 0.0, 1.0);

  // The effect peaks in the middle and returns to zero at both ends.
  float envelope = sin(progress * 3.14159265);
  vec2 offset = vec2(
    sin(vUv.y * 22.0 + progress * 8.0),
    cos(vUv.x * 18.0 - progress * 6.0)
  ) * uStrength * envelope;

  gl_FragColor = texture2D(uTexture, vUv + offset);
}
```

**Gotcha:** Scroll progress is not time. If the effect should continue moving while the page is stationary, use a separate time uniform. Separate controls make the behavior easier to art-direct.

### 10. Sampling cost and texture filtering

**Mental model:** Every texture lookup has a cost, and multi-channel effects may require several lookups per fragment. Texture filtering, mipmaps, and pixel ratio influence how stable the result looks at different sizes.

Practical guidelines:
- Keep the number of texture samples as low as possible.
- Use mipmaps for minified image textures where appropriate.
- Avoid extremely high-frequency UV offsets that cause unstable sampling.
- Use `texture2D` in GLSL 1 or `texture` in GLSL 3.
- Test at the actual display size and device pixel ratio.
- Prefer a small uniform-driven effect over repeatedly generating or uploading texture data on the CPU.

**Gotcha:** Increasing texture resolution does not fix aliasing caused by rapidly changing UV coordinates. Reduce distortion frequency or use smoother fields when the sampled image shimmers.

## Reusable Patterns

### Pattern 1: Liquid image hover

**What it does:** Adds gentle wave distortion while a pointer hovers over an image.

**When to use it:** Portfolio project cards, image galleries, and product thumbnails.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform float uHover;
uniform float uAmplitude;
varying vec2 vUv;

void main() {
  // Hover acts as a blend weight, so the resting state samples the original UVs.
  float strength = uAmplitude * clamp(uHover, 0.0, 1.0);

  vec2 offset = vec2(
    sin(vUv.y * 24.0 + uTime * 1.1),
    cos(vUv.x * 19.0 - uTime * 0.8)
  ) * strength;

  gl_FragColor = texture2D(uTexture, vUv + offset);
}
```

**Integration note:** Update `uHover` from pointer enter/leave handlers and animate it smoothly. Keep the hover effect small enough that project titles and recognizable imagery remain legible.

### Pattern 2: Heat-haze background

**What it does:** Uses layered, slowly moving waves to bend an image as if air above a hot surface were shimmering.

**When to use it:** Atmospheric hero sections, desert or sci-fi scenes, and abstract background panels.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
varying vec2 vUv;

void main() {
  // Layer two frequencies to avoid a single obvious repeating band.
  float waveA = sin(vUv.y * 45.0 + uTime * 2.0);
  float waveB = sin(vUv.y * 21.0 - uTime * 1.1 + vUv.x * 5.0);

  vec2 offset = vec2(waveA * 0.65 + waveB * 0.35, 0.0) * uStrength;
  gl_FragColor = texture2D(uTexture, vUv + offset);
}
```

**Trade-off:** Heat haze should distort mostly along one axis and at low amplitude. Strong two-axis distortion usually reads as liquid instead of rising hot air.

### Pattern 3: Chromatic edge glitch

**What it does:** Separates color channels radially, with strength controlled by a uniform.

**When to use it:** Short transitions, hover accents, and deliberate digital-glitch moments.

```glsl
uniform sampler2D uTexture;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec2 radial = vUv - 0.5;
  vec2 direction = radial / max(length(radial), 0.0001);

  // Keep the channel separation restrained to avoid a constant RGB outline.
  vec2 offset = direction * uStrength;
  float redChannel = texture2D(uTexture, vUv + offset).r;
  float greenChannel = texture2D(uTexture, vUv).g;
  float blueChannel = texture2D(uTexture, vUv - offset).b;

  gl_FragColor = vec4(redChannel, greenChannel, blueChannel, 1.0);
}
```

**Integration note:** Animate `uStrength` briefly during a transition and return it to zero. Persistent, strong chromatic separation often harms readability.

### Pattern 4: Scroll transition warp

**What it does:** Peaks a distortion effect at the midpoint of a normalized progress value.

**When to use it:** Between project sections, image transitions, and scroll-based storytelling.

```glsl
uniform sampler2D uTexture;
uniform float uProgress;
uniform float uStrength;
varying vec2 vUv;

void main() {
  float progress = clamp(uProgress, 0.0, 1.0);
  float envelope = sin(progress * 3.14159265);

  // The envelope is zero at both endpoints, making the transition settle cleanly.
  vec2 offset = vec2(
    sin(vUv.y * 30.0 + progress * 10.0),
    cos(vUv.x * 22.0 - progress * 8.0)
  ) * uStrength * envelope;

  gl_FragColor = texture2D(uTexture, vUv + offset);
}
```

**Integration note:** GSAP or another scroll controller should update `uProgress`. Do not instantiate a new material on every scroll update.

### Pattern 5: Edge-safe distortion

**What it does:** Reduces the distortion near the border so the original image frame stays stable.

**When to use it:** Cards, cropped images, and any texture where repeated edges would be visible.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
uniform float uStrength;
varying vec2 vUv;

void main() {
  float horizontalFade = smoothstep(0.0, 0.1, vUv.x) *
                         (1.0 - smoothstep(0.9, 1.0, vUv.x));
  float verticalFade = smoothstep(0.0, 0.1, vUv.y) *
                       (1.0 - smoothstep(0.9, 1.0, vUv.y));
  float edgeFade = horizontalFade * verticalFade;

  vec2 waveOffset = vec2(
    sin(vUv.y * 16.0 + uTime),
    cos(vUv.x * 18.0 - uTime)
  ) * uStrength * edgeFade;

  gl_FragColor = texture2D(uTexture, vUv + waveOffset);
}
```

**Trade-off:** Fading the distortion creates a stable frame but can make the edge appear less fluid. Increase the fade width if edge stretching remains visible.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Using a constant offset and expecting a wave | The image simply shifts | Use an offset that varies with UV position |
| Adding pixel coordinates directly to UVs | The offset scale is incompatible | Convert the pixel offset to normalized UV units |
| Using large distortion amplitude | Image details appear torn or unrecognizable | Start with small offsets and tune gradually |
| Using random values that change every frame | The image flickers instead of flowing | Animate coordinates through a deterministic field |
| Ignoring texture wrap mode | Edges repeat or smear unexpectedly | Choose clamp or repeat behavior deliberately |
| Assuming an image material can refract the scene behind it | The shader has no automatic access to the framebuffer behind it | Use a render target or a suitable transmission material |
| Normalizing a zero-length radial vector | The direction can be undefined at the center | Divide by `max(length(v), epsilon)` |
| Using too many texture samples | Fragment cost increases quickly | Reuse samples and keep channel effects simple |
| Rebuilding materials during scroll | Causes avoidable allocation and possible shader compilation | Update uniforms only |
| Using high-frequency offsets on detailed images | Causes shimmer and unstable sampling | Reduce frequency and use smoother distortion fields |

### Wrong vs. right: UV units

```glsl
// WRONG: pixel values can be hundreds of units, while UVs usually span 0–1.
// vec2 distortedUv = vUv + pixelOffset;

// RIGHT: convert pixel offsets to normalized texture coordinates.
// vec2 uvOffset = pixelOffset / uResolution;
// vec2 distortedUv = vUv + uvOffset;
```

### Wrong vs. right: deterministic motion

```glsl
// WRONG concept: replace the field with unrelated random values every frame.
// float offset = randomValueFromNewSeed();

// RIGHT: sample a stable field at coordinates that move smoothly over time.
// float offset = valueNoise(vUv * 3.0 + vec2(uTime * 0.03, 0.0));
```

### Wrong vs. right: center-safe radial direction

```glsl
// WRONG at the exact center: the vector has zero length.
// vec2 direction = normalize(vUv - 0.5);

// RIGHT: guard the denominator.
vec2 radial = vUv - 0.5;
vec2 direction = radial / max(length(radial), 0.0001);
```

## Mental Models

1. **UVs are lookup addresses** — changing the coordinate changes which source texel is sampled.
2. **The field controls the bend** — the distortion field supplies direction and local variation.
3. **Amplitude is measured in UV units** — tiny normalized offsets can create strong visual changes.
4. **Frequency controls spatial character** — broad fields feel fluid; high-frequency fields can shimmer.
5. **Coordinate spaces must match** — convert pixels or world values before adding them to UVs.
6. **Texture edges are part of the design** — wrapping, clamping, and edge masks determine border behavior.
7. **A refraction illusion is not ray tracing** — true scene refraction needs a source texture or a material designed for transmission.
8. **Samples cost pixels** — every additional texture lookup can matter in a full-screen effect.

## Quick Reference

| Need | Technique | Reminder |
|---|---|---|
| Basic warp | `texture2D(uTexture, vUv + offset)` | GLSL 1 syntax |
| Smooth liquid motion | Sinusoidal or coherent-noise field | Keep amplitude small |
| Noise distortion | Two offset noise samples | Include complete noise functions |
| Aspect-correct effect | Scale centered UV coordinates | Depends on target coordinate space |
| Stable image edges | Edge mask and clamp wrapping | Large offsets can still stretch edges |
| Heat haze | Mostly horizontal displacement | Keep the offset low amplitude |
| Chromatic aberration | Separate RGB lookup coordinates | Guard radial normalization at center |
| Scroll transition | Progress uniform plus envelope | Update uniform, not shader source |
| True scene refraction | Render target or transmission material | A regular texture cannot sample arbitrary background pixels |
| Reduce shimmer | Lower frequency and smoother field | More texture resolution is not always the fix |
| Better performance | Reduce texture lookups | Profile at target device pixel ratio |

## Build Challenge

### Build a liquid-distortion portfolio image transition

Create a reusable Three.js shader material that transitions between two project images with a controlled liquid warp.

**Requirements**

1. Load two textures and make their ownership and disposal behavior explicit.
2. Create uniforms for both textures, time, transition progress, distortion amplitude, and distortion frequency.
3. Implement a deterministic distortion field using smooth waves or a complete coherent-noise function.
4. Blend between the source images using normalized progress while the distortion peaks near the transition midpoint.
5. Keep the texture coordinates in a clearly documented space and account for the image aspect ratio.
6. Decide how out-of-range UVs are handled: edge fade, clamping, or repeating texture behavior.
7. Expose amplitude and frequency as tunable controls, and keep the default settings subtle enough to preserve image recognition.
8. Animate progress with GSAP or a similarly clear controller; update uniforms rather than rebuilding materials.
9. Test at mobile and desktop sizes, including high device pixel ratios. Reduce effect complexity if texture sampling becomes expensive.
10. Include a reduced-motion mode that crossfades without continuous distortion and document the trade-offs.

**Expected result:** A polished, reusable image-transition shader that makes project navigation feel intentional. The images should remain recognizable, the transition should settle cleanly at both endpoints, and the code should explain coordinate-space, texture-edge, and performance decisions.
