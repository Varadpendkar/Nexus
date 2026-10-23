# SKILL: perlin-simplex-noise

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Use coherent procedural noise in GLSL to create natural-looking motion, terrain, distortion, and surface detail without relying on tiled image textures.

## Why This Matters (Senior Perspective)

Pure sine waves are useful, predictable, and cheap, but they often look mechanical when used alone. Natural forms such as clouds, terrain, smoke, marble, and organic motion contain variation across space. Coherent noise provides that variation: nearby coordinates produce related values, while distant coordinates can differ substantially. Unlike independent random values, coherent noise creates smooth fields that can be sampled and animated.

Noise is not free. A common GLSL noise function may perform several hash operations, interpolation steps, and vector calculations per sample. If you call it multiple times in a full-screen fragment shader, the cost can scale with every pixel and every frame. Senior practice is to choose the simplest noise type that delivers the desired art direction, keep octave counts modest, and measure the result on target hardware. For many portfolio effects, one or two well-composed noise samples look better than a stack of expensive layers.

This skill focuses on practical procedural noise for creative development: making a plane feel like terrain, adding subtle turbulence to a reveal, animating a surface without obvious repetition, and creating masks that can be reused for color, opacity, or displacement. The code emphasizes predictable ranges, explicit coordinate scaling, and the distinction between a useful noise field and a mathematically perfect implementation.

## Core Concepts

### 1. Random values versus coherent noise

**Mental model:** Random values are unrelated from point to point. Coherent noise changes gradually as the input coordinate changes, which makes it useful for organic shapes and animation.

A simple hash maps a 2D coordinate to a pseudo-random value. It is useful for cell-based variation, but it is not itself smooth noise.

```glsl
float hash21(vec2 point) {
  // A deterministic hash: identical input coordinates return identical values.
  point = fract(point * vec2(123.34, 456.21));
  point += dot(point, point + 45.32);
  return fract(point.x * point.y);
}
```

A coherent value-noise function hashes the corners of a grid cell and interpolates between them:

```glsl
float hash21(vec2 point) {
  point = fract(point * vec2(123.34, 456.21));
  point += dot(point, point + 45.32);
  return fract(point.x * point.y);
}

float valueNoise(vec2 point) {
  // Separate the integer cell from the position inside that cell.
  vec2 cell = floor(point);
  vec2 local = fract(point);

  // Smooth interpolation avoids abrupt changes at cell boundaries.
  vec2 blend = local * local * (3.0 - 2.0 * local);

  float lowerLeft = hash21(cell);
  float lowerRight = hash21(cell + vec2(1.0, 0.0));
  float upperLeft = hash21(cell + vec2(0.0, 1.0));
  float upperRight = hash21(cell + vec2(1.0, 1.0));

  float lower = mix(lowerLeft, lowerRight, blend.x);
  float upper = mix(upperLeft, upperRight, blend.x);
  return mix(lower, upper, blend.y);
}
```

**Gotcha:** This is value noise, not canonical Perlin or simplex noise. It is useful for learning and small effects, but its grid structure may be visible at low frequencies or high contrast.

### 2. Coordinate scale controls feature size

**Mental model:** Noise frequency determines how many features fit into a coordinate range. Low frequency creates broad cloudy variation; high frequency creates smaller, busier details.

```glsl
uniform float uNoiseScale;
varying vec2 vUv;

void main() {
  // Scale UVs before sampling to control the size of the noise features.
  float noiseValue = valueNoise(vUv * uNoiseScale);

  vec3 darkColor = vec3(0.02, 0.04, 0.1);
  vec3 brightColor = vec3(0.15, 0.8, 0.65);
  vec3 color = mix(darkColor, brightColor, noiseValue);

  gl_FragColor = vec4(color, 1.0);
}
```

A larger scale usually means more frequent changes across the same surface. Keep scale separate from amplitude: scale changes feature size, while amplitude changes how strongly noise affects color or geometry.

**Gotcha:** UVs and world coordinates have different units. A noise scale tuned for a UV plane may look very different when applied to world-space positions.

### 3. Perlin-style gradient noise

**Mental model:** Gradient noise assigns pseudo-random gradients to grid corners, then blends dot products between each corner's gradient and the local offset. The result is usually smoother and less block-like than basic value noise.

The following is a compact illustrative 2D gradient-noise implementation. It uses a hash-derived direction at each corner and smooth interpolation.

```glsl
vec2 gradientAt(vec2 cell) {
  // Convert a deterministic hash into a unit direction.
  float angle = hash21(cell) * 6.2831853;
  return vec2(cos(angle), sin(angle));
}

float gradientNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);

  vec2 fromLowerLeft = local;
  vec2 fromLowerRight = local - vec2(1.0, 0.0);
  vec2 fromUpperLeft = local - vec2(0.0, 1.0);
  vec2 fromUpperRight = local - vec2(1.0, 1.0);

  float lowerLeft = dot(gradientAt(cell), fromLowerLeft);
  float lowerRight = dot(gradientAt(cell + vec2(1.0, 0.0)), fromLowerRight);
  float upperLeft = dot(gradientAt(cell + vec2(0.0, 1.0)), fromUpperLeft);
  float upperRight = dot(gradientAt(cell + vec2(1.0, 1.0)), fromUpperRight);

  // Quintic interpolation has smoother derivatives than cubic interpolation.
  vec2 blend = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);

  float lower = mix(lowerLeft, lowerRight, blend.x);
  float upper = mix(upperLeft, upperRight, blend.x);
  return mix(lower, upper, blend.y);
}
```

**Gotcha:** This compact implementation is intended as a teaching pattern, not a drop-in replacement for a carefully tested production noise library. Hash quality and directional distribution affect visible artifacts. Test it over the ranges and devices you intend to support.

### 4. Simplex noise: why it is different

**Mental model:** Simplex noise divides space into a simplex lattice (triangles in 2D, tetrahedra in 3D) instead of sampling the corners of a square or cube grid. Well-designed implementations can reduce directional grid artifacts and work efficiently in higher dimensions.

In production, use a known, reviewed GLSL implementation rather than inventing one under deadline. Keep the implementation in a reusable shader module and verify its license before shipping it.

```glsl
// Example interface for a separately included, reviewed 2D simplex implementation.
// The function body is supplied by your chosen noise module.
float snoise(vec2 point);

void main() {
  // Map the noise's documented output range into a convenient 0–1 range.
  float noiseValue = snoise(vUv * 3.0 + vec2(uTime * 0.08, 0.0));
  float normalizedNoise = clamp(noiseValue * 0.5 + 0.5, 0.0, 1.0);

  gl_FragColor = vec4(vec3(normalizedNoise), 1.0);
}
```

**Gotcha:** The declaration above only shows the intended interface; it does not implement simplex noise by itself. A shader will not link until the actual function definition is included in the source.

### 5. Fractal Brownian motion (fBm)

**Mental model:** fBm layers several noise samples at increasing frequency and decreasing amplitude. The large-scale layer sets the broad structure; smaller layers add detail.

```glsl
float fbm(vec2 point) {
  float total = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  // A small fixed octave count keeps the shader cost predictable.
  for (int octave = 0; octave < 4; octave++) {
    total += valueNoise(point * frequency) * amplitude;
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return total;
}
```

Use the result to drive a color or mask:

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  // Slow coordinate drift animates the field without changing its structure every frame.
  vec2 noiseUv = vUv * 3.0 + vec2(uTime * 0.025, uTime * 0.012);
  float cloudField = fbm(noiseUv);

  vec3 shadowColor = vec3(0.015, 0.025, 0.07);
  vec3 highlightColor = vec3(0.12, 0.65, 0.82);
  vec3 color = mix(shadowColor, highlightColor, smoothstep(0.2, 0.8, cloudField));

  gl_FragColor = vec4(color, 1.0);
}
```

**Gotcha:** Every octave adds more work. Four octaves may be acceptable on a small object, but a full-screen effect on a high-DPI display can become expensive. Begin with two or three and add detail only when it improves the result.

### 6. Domain warping

**Mental model:** Instead of using noise only as an output value, use one noise field to distort the coordinates sampled by another field. This makes flowing, marbled, or turbulent patterns that are more complex than layering noise directly.

```glsl
float domainWarpedNoise(vec2 point, float time) {
  // Two offset fields bend the coordinates in different directions.
  vec2 warp;
  warp.x = valueNoise(point + vec2(0.0, time * 0.08));
  warp.y = valueNoise(point + vec2(5.2, 1.3) - time * 0.06);

  // Small warp strength preserves broad forms while introducing organic variation.
  vec2 warpedPoint = point + (warp - 0.5) * 1.2;
  return fbm(warpedPoint);
}
```

**Gotcha:** Strong warping can fold or compress features into muddy high-frequency detail. Increase warp strength gradually, and keep the first noise fields lower-frequency than the final field.

### 7. Animate noise through coordinate movement

**Mental model:** Moving the sample coordinates makes a static noise field appear to flow. This is often more stable and easier to control than generating a new random value every frame.

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  // A slow translation produces continuous motion through a fixed field.
  vec2 movingUv = vUv * 3.0 + vec2(uTime * 0.04, -uTime * 0.02);
  float noiseValue = fbm(movingUv);

  gl_FragColor = vec4(vec3(noiseValue), 1.0);
}
```

For a surface displacement, use a similar field in the vertex shader and multiply it by a controlled amplitude.

**Gotcha:** If you use `floor()`-based cell hashing with no interpolation, coordinate movement can visibly pop from cell to cell. Use coherent interpolation for flowing effects.

### 8. Convert noise into a useful mask

**Mental model:** A raw noise value is rarely the finished effect. Remapping, clamping, and thresholding turn the field into a controllable reveal, edge, or material variation.

```glsl
uniform float uProgress;
uniform float uEdgeSoftness;
varying vec2 vUv;

void main() {
  float noiseValue = fbm(vUv * 5.0);

  // Progress shifts the threshold through the noise field.
  float revealMask = smoothstep(
    uProgress - uEdgeSoftness,
    uProgress + uEdgeSoftness,
    noiseValue
  );

  vec3 revealColor = vec3(0.05, 0.72, 0.92);
  gl_FragColor = vec4(revealColor, revealMask);
}
```

**Gotcha:** `smoothstep` edges must remain ordered. If the softness can become zero, clamp it to a small positive minimum before using it.

### 9. Use noise for vertex displacement carefully

**Mental model:** Noise can move vertices to make terrain or organic silhouettes, but the geometry must have enough vertices to represent the detail. Noise frequency and mesh resolution must be designed together.

```glsl
uniform float uTime;
uniform float uNoiseScale;
uniform float uDisplacement;
varying float vDisplacement;

void main() {
  vec3 displacedPosition = position;

  // Sample noise in local space so the pattern follows the mesh.
  float noiseValue = fbm(position.xz * uNoiseScale + vec2(uTime * 0.03, 0.0));
  float centeredNoise = noiseValue - 0.5;

  displacedPosition.y += centeredNoise * uDisplacement;
  vDisplacement = centeredNoise;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

**Gotcha:** This sample assumes the geometry uses XZ as its surface plane and that `fbm` is available in the vertex shader. Keep noise code compatible with the shader stage and ensure normals reflect the deformed surface if lighting is important.

### 10. Performance and precision

**Mental model:** Noise cost is driven by how many times it is evaluated, how many octaves are used, and how many fragments or vertices run the calculation. Reuse values when possible and avoid high-frequency detail that will not survive projection.

Practical choices:
- Use fewer octaves for broad shapes and low-powered devices.
- Prefer vertex-stage noise when the result only needs to affect vertices and the mesh resolution is adequate.
- Prefer fragment-stage noise for fine color detail that should not change geometry.
- Use a lower renderer pixel ratio for expensive full-screen effects.
- Cache shader source and update uniforms instead of rebuilding materials.
- Test on integrated GPUs and mobile devices, not only a desktop workstation.

```glsl
float fbmThreeOctaves(vec2 point) {
  float total = 0.0;

  // Three octaves provide a useful detail hierarchy with bounded cost.
  total += valueNoise(point) * 0.57;
  total += valueNoise(point * 2.0) * 0.29;
  total += valueNoise(point * 4.0) * 0.14;

  return total;
}
```

**Gotcha:** These weights are illustrative and do not guarantee a normalized output for every noise function. Check the actual range of the chosen noise implementation before mapping it to colors or thresholds.

## Reusable Patterns

### Pattern 1: Cloud-like animated field

**What it does:** Combines broad noise with slow coordinate drift to create a soft atmospheric field.

**When to use it:** Hero backgrounds, abstract environment planes, and a low-contrast backdrop behind typography.

```glsl
uniform float uTime;
uniform vec3 uDeepColor;
uniform vec3 uCloudColor;
varying vec2 vUv;

void main() {
  vec2 point = vUv * 2.8 + vec2(uTime * 0.025, uTime * 0.012);
  float cloudNoise = fbm(point);

  // Shape the noise range before color blending for art direction.
  float cloudMask = smoothstep(0.22, 0.78, cloudNoise);
  vec3 color = mix(uDeepColor, uCloudColor, cloudMask);

  gl_FragColor = vec4(color, 1.0);
}
```

**Trade-off:** Low-frequency noise feels calm and atmospheric. Additional octaves add detail but may compete with the text layered above it.

### Pattern 2: Procedural terrain displacement

**What it does:** Uses a noise field to lift and lower a subdivided plane.

**When to use it:** Stylized landscapes, abstract 3D topography, and scroll-driven terrain reveals.

```glsl
uniform float uTime;
uniform float uTerrainScale;
uniform float uTerrainHeight;
varying float vTerrainHeight;

void main() {
  vec3 displacedPosition = position;

  // Use XZ coordinates because the plane is assumed to lie on the XZ ground plane.
  float broadShape = fbm(position.xz * uTerrainScale);
  float fineShape = valueNoise(position.xz * uTerrainScale * 3.0) * 0.18;
  float terrain = broadShape + fineShape - 0.55;

  // Small time drift can animate the terrain, but keep it subtle for readability.
  terrain += sin(position.x * 0.6 + uTime * 0.2) * 0.015;
  displacedPosition.y += terrain * uTerrainHeight;

  vTerrainHeight = terrain;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

**Trade-off:** Terrain detail is limited by mesh density. If the silhouette must remain smooth at distance, consider level of detail and appropriate normal reconstruction.

### Pattern 3: Noise dissolve reveal

**What it does:** Reveals a surface by moving a threshold through a procedural noise field.

**When to use it:** Product entrances, page transitions, and stylized loading reveals.

```glsl
uniform float uProgress;
uniform float uEdgeSoftness;
uniform vec3 uRevealColor;
varying vec2 vUv;

void main() {
  float noiseValue = fbm(vUv * 4.5);

  // Pixels with noise below the threshold become visible as progress advances.
  float revealMask = smoothstep(
    noiseValue - uEdgeSoftness,
    noiseValue + uEdgeSoftness,
    uProgress
  );

  gl_FragColor = vec4(uRevealColor, revealMask);
}
```

**Integration note:** If the material uses blending, configure transparency and depth behavior in Three.js. For a solid cutout, a discard-based approach may be more appropriate, but it needs edge treatment to avoid jagged boundaries.

### Pattern 4: Domain-warped marble

**What it does:** Bends one noise field with two other fields to create fluid, marbled structures.

**When to use it:** Abstract portfolio art, shader studies, and animated backgrounds with a premium material feel.

```glsl
uniform float uTime;
uniform float uWarpStrength;
varying vec2 vUv;

void main() {
  vec2 point = vUv * 3.0;

  // Two independently offset fields create a 2D coordinate warp.
  vec2 warp = vec2(
    fbm(point + vec2(uTime * 0.025, 0.0)),
    fbm(point + vec2(4.1, 2.7) - uTime * 0.02)
  );

  vec2 warpedPoint = point + (warp - 0.5) * uWarpStrength;
  float marbleField = fbm(warpedPoint);

  // A sine transform creates flowing bands from the warped field.
  float marble = 0.5 + 0.5 * sin(warpedPoint.x * 4.0 + marbleField * 8.0);
  vec3 color = mix(vec3(0.015, 0.025, 0.07), vec3(0.2, 0.75, 0.85), marble);

  gl_FragColor = vec4(color, 1.0);
}
```

**Trade-off:** Domain warping can require several noise evaluations. Reduce octaves and warp strength before sacrificing output resolution.

### Pattern 5: Noise-driven edge glow

**What it does:** Adds irregular variation to an edge mask for a more organic dissolve or glowing boundary.

**When to use it:** Sci-fi product reveals, energy-like borders, and stylized material transitions.

```glsl
uniform float uProgress;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;
varying vec2 vUv;

void main() {
  float noiseValue = fbm(vUv * 5.0);
  float threshold = uProgress + (noiseValue - 0.5) * 0.12;

  // A narrow mask isolates the moving reveal boundary.
  float edgeDistance = abs(threshold - noiseValue);
  float edgeMask = 1.0 - smoothstep(uEdgeWidth, uEdgeWidth * 2.0, edgeDistance);

  gl_FragColor = vec4(uEdgeColor, edgeMask);
}
```

**Integration note:** This is a starting pattern; adjust the threshold and edge-distance expression to match the exact reveal convention in your material. Keep edge glow intensity restrained so it does not overpower the subject.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Treating a hash as coherent noise | Neighboring samples jump abruptly | Interpolate hashed corner values or use a reviewed gradient/simplex implementation |
| Using too many fBm octaves | Shader cost rises with little visible benefit | Start with two or three octaves and add only if needed |
| Scaling noise coordinates without considering the mesh | Feature size changes unexpectedly across objects | Decide whether sampling uses UV, local, or world coordinates |
| Using high-frequency noise on a low-resolution mesh | Displacement becomes jagged or unstable | Match noise frequency to geometry resolution |
| Animating by replacing random values every frame | Pattern flickers instead of flowing | Move sample coordinates through a stable field |
| Warping coordinates too strongly | Fine detail collapses into visual noise | Use low-frequency warp fields and modest strength |
| Assuming noise output is always 0–1 | Thresholds and color maps may be wrong | Inspect the chosen implementation's range and remap explicitly |
| Copying a simplex declaration without its function body | Shader fails to compile or link | Include a complete, licensed implementation |
| Sampling noise many times per fragment | Full-screen effects become expensive | Reuse samples, reduce octaves, and profile |
| Ignoring normals after displacement | Lighting no longer matches the new surface | Reconstruct or approximate normals for the deformed geometry |

### Wrong vs. right: random flicker

```glsl
// WRONG concept: a new unrelated random value each frame creates flicker.
// float value = hash21(floor(vUv * 100.0) + floor(uTime * 30.0));

// RIGHT: move continuously through a stable field.
float value = valueNoise(vUv * 4.0 + vec2(uTime * 0.03, 0.0));
```

### Wrong vs. right: excessive octaves

```glsl
// WRONG for a full-screen background unless profiling justifies the cost:
// for (int octave = 0; octave < 10; octave++) { ... }

// RIGHT: begin with a small, fixed number of octaves.
float value = fbmThreeOctaves(vUv * 3.0);
```

### Wrong vs. right: unexamined output range

```glsl
// WRONG: assumes an arbitrary noise function returns exactly 0–1.
float mask = smoothstep(0.7, 0.9, snoise(vUv));

// RIGHT: map a documented -1–1 noise range to 0–1 first.
float normalizedNoise = clamp(snoise(vUv) * 0.5 + 0.5, 0.0, 1.0);
float mask = smoothstep(0.7, 0.9, normalizedNoise);
```

## Mental Models

1. **Hash is not noise** — a hash creates pseudo-random values; coherent noise blends them into a continuous field.
2. **Frequency controls feature size** — larger coordinate scales create more frequent features.
3. **Amplitude controls influence** — it determines how strongly noise affects color, opacity, or displacement.
4. **fBm builds a hierarchy** — low frequencies define broad shapes; higher octaves add detail.
5. **Domain warping changes the question** — one field bends where another field is sampled.
6. **Coordinate motion beats random replacement** — animate the sample location to preserve temporal continuity.
7. **Every octave costs work** — use the fewest layers that achieve the intended look.
8. **Noise range is implementation-specific** — normalize and clamp intentionally before thresholding.

## Quick Reference

| Need | Technique | Reminder |
|---|---|---|
| Cell-to-cell variation | Hash function | Not smooth by itself |
| Smooth scalar field | Value or gradient noise | Interpolate neighboring contributions |
| Reviewed simplex noise | Reusable GLSL module | Include full implementation and check license |
| Richer organic forms | fBm | Keep octave count modest |
| Flowing motion | Offset sample coordinates with time | Avoid frame-dependent random changes |
| Marble or turbulence | Domain warping | Start with low warp strength |
| Dissolve | Noise plus moving threshold | Choose blend or cutout intentionally |
| Terrain | Vertex-stage noise displacement | Mesh density limits detail |
| Color variation | Remap noise into a mask | Verify the source function's range |
| Better performance | Reduce samples and octaves | Profile at target pixel ratio |
| Stable animation | Deterministic field plus continuous time | Keep the field stable between frames |

## Build Challenge

### Build an animated procedural-noise hero material

Create a Three.js hero visual that combines a calm noise field with one interactive or animated feature.

**Requirements**

1. Implement or import one complete coherent noise function. If using a third-party simplex implementation, retain its license and include the full source.
2. Build an fBm function with a configurable but modest octave count, starting at three or fewer for a full-screen effect.
3. Use uniforms for time, noise scale, amplitude, and at least two art-directed colors.
4. Animate by moving sample coordinates through the field rather than replacing random values every frame.
5. Add either a noise dissolve, domain warp, or vertex-displacement feature.
6. Keep coordinate spaces explicit and document whether the field is sampled in UV, local, or world space.
7. Make the effect readable behind page content; avoid high-contrast noise directly beneath body text.
8. Test on a high-DPI display and a lower-powered device. Record one change that improves performance.
9. Add a reduced-motion option that freezes or disables continuous animation while preserving a polished final state.
10. Document the noise implementation, expected output range, license if applicable, and performance trade-off.

**Expected result:** A reusable procedural-noise shader for a portfolio hero or product reveal, with smooth temporal behavior, a deliberate visual hierarchy, and tunable uniforms. It should demonstrate both technical understanding and art direction rather than using noise as decoration without purpose.
