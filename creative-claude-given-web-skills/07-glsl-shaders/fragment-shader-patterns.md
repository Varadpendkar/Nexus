# SKILL: fragment-shader-patterns

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Create readable, performant fragment shaders for procedural color, masks, gradients, lighting accents, and surface effects that integrate cleanly with Three.js.

## Why This Matters (Senior Perspective)

A fragment shader determines the color of fragments produced when geometry is rasterized. It is the main place to create rich visual treatments without adding more geometry: gradients, procedural patterns, animated noise, dissolve transitions, holographic overlays, scan lines, and stylized surface details. For creative developers, this is often the difference between a basic 3D object and a carefully art-directed portfolio visual.

Fragment shaders can also become expensive quickly. Unlike a vertex shader, which typically runs once per vertex, a fragment shader may run for many screen pixels and can be invoked multiple times for overlapping surfaces, anti-aliasing, and high-resolution displays. A visually tiny operation repeated across a full-screen quad may cost more than a complex calculation on a modest mesh. Senior shader work therefore starts with the output resolution, the number of passes, the complexity of per-pixel math, and whether the effect needs to be animated at all.

A reliable fragment shader has clear inputs, predictable ranges, and deliberate blending. It avoids accidental color-space surprises, hard aliasing, and unnecessary branches. It also exposes useful parameters as uniforms so designers can tune an effect without editing GLSL. The patterns below focus on building blocks you can reuse for hero visuals, product showcases, transitions, and WebGL portfolio experiments.

## Core Concepts

### 1. Fragment shader inputs and output

**Mental model:** A fragment shader receives interpolated values from the vertex stage and computes the output color for a fragment. In a basic Three.js GLSL 1 `ShaderMaterial`, the output is commonly written to `gl_FragColor`.

```glsl
// Fragment shader for a simple opaque material.
uniform vec3 uColor;

void main() {
  // Output RGBA: the final 1.0 alpha makes this fragment opaque.
  gl_FragColor = vec4(uColor, 1.0);
}
```

A matching Three.js setup:

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    // Uniforms are set from JavaScript and shared by this draw call.
    uColor: { value: new THREE.Color('#168aad') }
  },
  vertexShader: `
    void main() {
      // Keep the usual object and camera transforms.
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    void main() {
      gl_FragColor = vec4(uColor, 1.0);
    }
  `
});
```

**Gotcha:** GLSL version matters. In GLSL 3, use an explicit output variable such as `out vec4 outColor;` instead of `gl_FragColor`. Do not mix the two conventions.

### 2. Varyings are interpolated across a triangle

**Mental model:** Values passed from the vertex shader are interpolated across the triangle's surface. This makes UV coordinates useful for gradients and textures, while a varying height or mask can carry deformation information into the fragment stage.

```glsl
// Vertex shader
varying vec2 vUv;

void main() {
  // Pass mesh UV coordinates through to the fragment stage.
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// Fragment shader
varying vec2 vUv;

void main() {
  // UV.x creates a left-to-right gradient across the surface.
  vec3 leftColor = vec3(0.04, 0.08, 0.18);
  vec3 rightColor = vec3(0.1, 0.8, 0.75);
  vec3 color = mix(leftColor, rightColor, vUv.x);

  gl_FragColor = vec4(color, 1.0);
}
```

**Gotcha:** UV coordinates are not guaranteed to be normalized or seamless for every custom geometry. Inspect the geometry's UV layout before relying on a pattern that spans the whole object.

### 3. `mix`, `step`, and `smoothstep`

**Mental model:** These functions are the basic tools for controlling transitions. `mix(a, b, t)` interpolates between values, `step(edge, x)` creates a hard threshold, and `smoothstep(edge0, edge1, x)` creates a smooth transition.

```glsl
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uTransition;

void main() {
  // Clamp external progress to avoid extrapolating beyond the intended colors.
  float progress = clamp(uTransition, 0.0, 1.0);
  vec3 color = mix(uColorA, uColorB, progress);

  gl_FragColor = vec4(color, 1.0);
}
```

A soft mask:

```glsl
varying vec2 vUv;

void main() {
  // A smooth threshold avoids a harsh edge in the gradient.
  float mask = smoothstep(0.2, 0.8, vUv.y);
  vec3 color = mix(vec3(0.02, 0.03, 0.08), vec3(0.2, 0.8, 1.0), mask);

  gl_FragColor = vec4(color, 1.0);
}
```

**Gotcha:** `smoothstep` expects the first edge to be less than the second. Reversed or equal edges are undefined by GLSL specifications and can behave inconsistently.

### 4. UV coordinates and aspect ratio

**Mental model:** UVs are commonly normalized to a 0–1 range, but the shape of the rendered surface may not be square. A circle drawn directly in UV space can appear elliptical if the underlying viewport or plane has a different aspect ratio.

For a screen-space effect, correct one axis using the viewport aspect ratio:

```glsl
uniform vec2 uResolution;
varying vec2 vUv;

void main() {
  vec2 centeredUv = vUv - 0.5;

  // Scale X so a unit distance has comparable screen-space size on both axes.
  centeredUv.x *= uResolution.x / uResolution.y;

  float radius = length(centeredUv);
  float circle = 1.0 - smoothstep(0.28, 0.30, radius);

  gl_FragColor = vec4(vec3(circle), 1.0);
}
```

Update `uResolution` when the renderer size changes:

```js
function updateResolution() {
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;

  // Keep the shader's coordinate correction in sync with the drawing area.
  material.uniforms.uResolution.value.set(width, height);
}

window.addEventListener('resize', updateResolution);
updateResolution();
```

**Gotcha:** For a material on an arbitrary 3D object, `uResolution` may not represent the object's projected dimensions. Decide whether the effect is object-space, UV-space, or screen-space before applying aspect correction.

### 5. Derivative-based anti-aliasing

**Mental model:** Hard procedural edges can shimmer or look jagged because a pixel covers a finite area. GLSL derivatives such as `fwidth()` estimate how quickly a value changes across a fragment and can soften the edge based on pixel footprint.

```glsl
varying vec2 vUv;

void main() {
  float radius = length(vUv - 0.5);
  float edgeDistance = radius - 0.25;

  // fwidth adapts the transition width to the edge's screen-space change.
  float edgeWidth = fwidth(edgeDistance);
  float circleMask = 1.0 - smoothstep(-edgeWidth, edgeWidth, edgeDistance);

  gl_FragColor = vec4(vec3(circleMask), 1.0);
}
```

This is useful for procedural circles, lines, grid cells, and thresholded noise.

**Gotcha:** Derivatives are not available in every legacy WebGL configuration without the appropriate support, and derivative behavior is most meaningful for fragment-stage expressions. Test on the actual target devices and shader configuration.

### 6. Procedural stripes and grids

**Mental model:** The `fract()` function repeats a coordinate by discarding its integer part. Combined with `step` or `smoothstep`, it creates repeating lines and cells without a texture.

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  // Repeating coordinates create a regular grid.
  vec2 gridUv = vUv * 18.0;
  vec2 cell = abs(fract(gridUv) - 0.5);

  // fwidth-based line widths help keep the grid readable at different scales.
  vec2 lineWidth = fwidth(gridUv) * 1.2;
  float verticalLine = 1.0 - smoothstep(lineWidth.x, lineWidth.x + 0.025, cell.x);
  float horizontalLine = 1.0 - smoothstep(lineWidth.y, lineWidth.y + 0.025, cell.y);
  float grid = max(verticalLine, horizontalLine);

  // A restrained pulse keeps the pattern alive without changing its topology.
  float pulse = 0.85 + 0.15 * sin(uTime * 0.8);
  vec3 backgroundColor = vec3(0.015, 0.025, 0.06);
  vec3 lineColor = vec3(0.1, 0.65, 0.9) * pulse;

  gl_FragColor = vec4(mix(backgroundColor, lineColor, grid), 1.0);
}
```

**Gotcha:** Excessively dense grids can alias and compete with foreground content. Tune frequency to the object's projected size, and reduce line contrast before increasing complexity.

### 7. Alpha and transparency

**Mental model:** Alpha is not a magic switch. The shader output alpha, material transparency settings, depth writing, and render order all affect how a transparent object appears.

```js
const overlayMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  uniforms: {
    uOpacity: { value: 0.65 },
    uColor: { value: new THREE.Color('#38bdf8') }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    uniform vec3 uColor;
    varying vec2 vUv;

    void main() {
      // Fade at the vertical edges so the overlay blends into the scene.
      float edgeFade = smoothstep(0.0, 0.12, vUv.y) *
                       (1.0 - smoothstep(0.88, 1.0, vUv.y));
      gl_FragColor = vec4(uColor, uOpacity * edgeFade);
    }
  `
});
```

**Gotcha:** `transparent: true` is needed for conventional transparent blending. `depthWrite: false` often helps overlays avoid blocking later transparent objects, but it is not a universal fix. Transparent sorting and intersecting surfaces may still require scene-specific handling.

### 8. Color values and color management

**Mental model:** Shader arithmetic operates on numeric color values, while a Three.js scene may use a working color space and an output color space. If colors look washed out or unexpectedly dark, check the renderer's color management and the shader's output conversion path.

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });

// Set an explicit output color space for predictable renderer output.
renderer.outputColorSpace = THREE.SRGBColorSpace;
```

A simple shader output:

```glsl
uniform vec3 uColor;

void main() {
  // This emits the supplied numeric color; output conversion depends on the material and renderer setup.
  gl_FragColor = vec4(uColor, 1.0);
}
```

**Gotcha:** Do not blindly apply gamma correction twice. Three.js behavior depends on material type, renderer configuration, and GLSL version. Verify the current Three.js documentation for the output conversion approach appropriate to your shader.

### 9. Time-driven procedural effects

**Mental model:** Keep animation controls in uniforms. The shader should calculate the current visual state from time, not accumulate state per pixel from one frame to the next.

```glsl
uniform float uTime;
varying vec2 vUv;

void main() {
  // Offset the repeating pattern with elapsed time.
  float movingStripe = sin((vUv.x * 24.0) + uTime * 1.8);
  float stripeMask = smoothstep(0.15, 0.35, movingStripe);

  vec3 darkColor = vec3(0.015, 0.025, 0.06);
  vec3 brightColor = vec3(0.15, 0.75, 0.9);
  vec3 color = mix(darkColor, brightColor, stripeMask);

  gl_FragColor = vec4(color, 1.0);
}
```

```js
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Use elapsed seconds so motion is not tied to the refresh rate.
  material.uniforms.uTime.value = clock.getElapsedTime();

  renderer.render(scene, camera);
}

animate();
```

**Gotcha:** A full-screen procedural shader can be expensive at high device pixel ratios. Consider limiting pixel ratio, simplifying math, or disabling motion when the effect is not visible.

### 10. Keep the shader's responsibilities focused

**Mental model:** Fragment shaders are excellent for per-pixel color and masks, while vertex shaders handle vertex positions. Keep geometry deformation in the vertex stage and visual surface treatment in the fragment stage unless there is a specific reason to combine responsibilities.

A clean split:

```glsl
// Vertex shader: geometry and varying setup.
varying vec2 vUv;
varying float vHeight;

void main() {
  vec3 displacedPosition = position;
  displacedPosition.z += sin(position.x * 2.0) * 0.08;

  vUv = uv;
  vHeight = displacedPosition.z;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

```glsl
// Fragment shader: color treatment based on interpolated values.
varying vec2 vUv;
varying float vHeight;

void main() {
  float heightMask = smoothstep(-0.1, 0.1, vHeight);
  vec3 baseColor = mix(vec3(0.02, 0.05, 0.12), vec3(0.1, 0.75, 0.9), heightMask);

  // A subtle UV contribution adds depth without changing the mesh topology.
  float uvGlow = smoothstep(0.75, 1.0, vUv.y) * 0.12;
  gl_FragColor = vec4(baseColor + uvGlow, 1.0);
}
```

**Gotcha:** Varyings are interpolated, so nonlinear functions of a varying may not match evaluating the same function at each vertex. That is often desirable for smooth masks, but important when reproducing exact geometric values.

## Reusable Patterns

### Pattern 1: Art-directed two-color gradient

**What it does:** Blends between two chosen colors using UV coordinates and a controllable curve.

**When to use it:** Product materials, background planes, and simple hero surfaces.

```glsl
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uGradientPower;
varying vec2 vUv;

void main() {
  // Power changes the balance of the gradient while keeping the inputs tunable.
  float gradientPosition = pow(clamp(vUv.y, 0.0, 1.0), max(uGradientPower, 0.001));
  vec3 color = mix(uColorA, uColorB, gradientPosition);

  gl_FragColor = vec4(color, 1.0);
}
```

**Integration note:** Use `THREE.Color` for uniform colors and update `uGradientPower` when tuning the look. If you need a radial or diagonal gradient, change the scalar mask rather than duplicating the color logic.

### Pattern 2: Soft radial glow

**What it does:** Produces a glow-like falloff around a center point.

**When to use it:** Ambient hero backdrops, cursor halos, and accent lights on a plane.

```glsl
uniform vec2 uCenter;
uniform vec2 uResolution;
uniform vec3 uGlowColor;
uniform float uIntensity;
varying vec2 vUv;

void main() {
  vec2 centeredUv = vUv - uCenter;

  // Correct X for the viewport aspect ratio so the glow is visually circular.
  centeredUv.x *= uResolution.x / max(uResolution.y, 1.0);

  float radius = length(centeredUv);
  float glow = exp(-radius * radius * 18.0) * uIntensity;

  vec3 color = uGlowColor * glow;
  gl_FragColor = vec4(color, clamp(glow, 0.0, 1.0));
}
```

**Integration note:** If this is a transparent overlay, configure the material's `transparent` and depth settings intentionally. The shader's alpha alone does not configure Three.js blending.

### Pattern 3: Dissolve mask

**What it does:** Reveals or hides a surface according to a procedural threshold.

**When to use it:** Product reveals, section transitions, and stylized object entrances.

```glsl
uniform float uProgress;
uniform float uEdgeWidth;
varying vec2 vUv;

float hash21(vec2 point) {
  // A compact deterministic hash provides a cheap, repeatable pattern.
  point = fract(point * vec2(123.34, 456.21));
  point += dot(point, point + 45.32);
  return fract(point.x * point.y);
}

void main() {
  float noiseValue = hash21(floor(vUv * 90.0));
  float progress = clamp(uProgress, 0.0, 1.0);

  // The threshold moves through the noise values as progress advances.
  float reveal = smoothstep(progress - uEdgeWidth, progress + uEdgeWidth, noiseValue);

  // Alpha fades out the unrevealed portion; material must support transparency.
  gl_FragColor = vec4(vec3(0.08, 0.7, 0.9), 1.0 - reveal);
}
```

**Integration note:** For a true cutout, consider discard or alpha testing instead of blending every pixel. Blending can cause sorting artifacts; a hard discard may need anti-aliased edges to avoid jagged silhouettes.

### Pattern 4: Animated scan lines

**What it does:** Adds subtle moving horizontal lines over a base color.

**When to use it:** Holographic interfaces, sci-fi panels, and restrained HUD-inspired details.

```glsl
uniform float uTime;
uniform float uLineFrequency;
uniform float uLineStrength;
uniform vec3 uBaseColor;
uniform vec3 uLineColor;
varying vec2 vUv;

void main() {
  float scanCoordinate = vUv.y * uLineFrequency + uTime * 0.35;

  // A smooth periodic pulse creates lines without a texture lookup.
  float scan = pow(0.5 + 0.5 * sin(scanCoordinate * 6.2831853), 12.0);
  vec3 color = mix(uBaseColor, uLineColor, scan * uLineStrength);

  gl_FragColor = vec4(color, 1.0);
}
```

**Integration note:** Keep the contrast low when text or product details sit on top. Dense, high-contrast lines can alias or produce distracting moiré patterns.

### Pattern 5: Procedural grid with anti-aliased edges

**What it does:** Draws a repeating grid with line widths adapted to screen-space derivatives.

**When to use it:** Technical backgrounds, wireframe-like surfaces, and abstract interface visuals.

```glsl
uniform float uGridScale;
uniform vec3 uBackgroundColor;
uniform vec3 uGridColor;
varying vec2 vUv;

void main() {
  vec2 gridUv = vUv * uGridScale;
  vec2 cellDistance = abs(fract(gridUv) - 0.5);

  // Derivatives keep the grid from collapsing into unstable subpixel lines.
  vec2 width = max(fwidth(gridUv), vec2(0.0001));
  float lineX = 1.0 - smoothstep(width.x, width.x * 1.8, cellDistance.x);
  float lineY = 1.0 - smoothstep(width.y, width.y * 1.8, cellDistance.y);
  float gridMask = max(lineX, lineY);

  vec3 color = mix(uBackgroundColor, uGridColor, gridMask);
  gl_FragColor = vec4(color, 1.0);
}
```

**Integration note:** The line mask is a starting point, not a universal grid implementation. Tune line width and scale with the target surface's projected size.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Mixing GLSL 1 and GLSL 3 output conventions | Shader compilation fails or output is not written correctly | Use `gl_FragColor` for GLSL 1 or a declared output for GLSL 3 |
| Using `smoothstep` with equal or reversed edges | Results are undefined or inconsistent | Ensure `edge0 < edge1` |
| Ignoring aspect ratio for screen-space circles | Circles become ellipses | Correct the relevant coordinate axis using resolution |
| Returning alpha below 1 without enabling transparency | Three.js may still render the object as opaque | Configure `transparent: true` and suitable depth behavior |
| Setting `depthWrite: false` on every material | Can cause incorrect depth interactions | Use it selectively for transparent overlays |
| Adding high-frequency procedural lines | Aliasing and moiré dominate the visual | Use derivatives, lower frequency, or reduce contrast |
| Applying gamma correction without checking renderer behavior | Colors may become too bright or too dark | Verify the current output color-space pipeline |
| Doing heavy math in a full-screen shader | Pixel cost grows with output resolution and pixel ratio | Profile and simplify high-frequency per-pixel work |
| Recreating material or shader source for each animation update | Causes avoidable allocations or recompilation | Update uniforms instead |
| Assuming all UVs span 0–1 across a mesh | Custom or imported geometry may use different UV layouts | Inspect or generate UVs deliberately |

### Wrong vs. right: hard edges

```glsl
// WRONG for a smooth procedural edge: the abrupt threshold can alias.
float mask = step(0.5, vUv.x);

// RIGHT when a softened edge is desired.
float mask = smoothstep(0.48, 0.52, vUv.x);
```

### Wrong vs. right: uniform updates

```js
// WRONG: rebuilding the material every frame is unnecessary.
function animate() {
  material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });
  renderer.render(scene, camera);
}

// RIGHT: keep the material and update its inputs.
function animate() {
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
```

### Wrong vs. right: screen-space circles

```glsl
// WRONG: this can look elliptical when the viewport is not square.
vec2 centeredUv = vUv - 0.5;
float radius = length(centeredUv);

// RIGHT: correct X using the actual drawing area's aspect ratio.
vec2 centeredUv = vUv - 0.5;
centeredUv.x *= uResolution.x / max(uResolution.y, 1.0);
float radius = length(centeredUv);
```

## Mental Models

1. **One output per fragment** — the fragment shader decides a pixel's color contribution, not the mesh's topology.
2. **UVs are coordinates, not pixels** — use resolution or derivatives when the visual depends on screen-space size.
3. **Masks are reusable controls** — one scalar can drive color, opacity, edge glow, or a transition.
4. **Soft edges need a pixel footprint** — derivatives help procedural boundaries remain stable.
5. **Transparency is a pipeline decision** — output alpha, material flags, depth writing, and draw order work together.
6. **Uniforms are art-direction knobs** — expose meaningful controls instead of hard-coding every visual choice.
7. **Pixels are a budget** — full-screen fragment work can cost more than vertex work on a small mesh.
8. **Color output has a contract** — verify Three.js color management instead of guessing at gamma fixes.

## Quick Reference

| Need | Technique | Reminder |
|---|---|---|
| Solid shader color | `vec4(uColor, 1.0)` | Match the shader output convention to GLSL version |
| Gradient | `mix(colorA, colorB, mask)` | Clamp the mask if input may exceed 0–1 |
| Smooth threshold | `smoothstep(edge0, edge1, value)` | Use increasing edges |
| Hard threshold | `step(edge, value)` | Can alias at sharp edges |
| Screen-space circle | Center UVs and correct aspect ratio | Use current drawing-buffer or viewport dimensions consistently |
| Anti-aliased procedural edge | `fwidth()` plus `smoothstep()` | Test target WebGL support |
| Repeating pattern | `fract(uv * scale)` | High frequency may alias |
| Transparent overlay | `transparent: true`, often `depthWrite: false` | Validate sorting and occlusion |
| Animated effect | Time uniform | Update uniforms, not shader source |
| Dissolve | Noise plus progress threshold | Consider discard/alpha test for cutouts |
| Color mismatch | Check output color space | Avoid double gamma correction |
| Performance tuning | Reduce pixel cost and pixel ratio | Profile on target devices |

## Build Challenge

### Build a shader-driven product reveal

Create a reusable Three.js material that reveals a product model with a procedural dissolve and a subtle animated scan-line treatment.

**Requirements**

1. Use a `ShaderMaterial` with explicit uniforms for progress, time, edge width, base color, and accent color.
2. Pass UV coordinates from the vertex shader to the fragment shader.
3. Create a deterministic procedural mask from UV coordinates; the same UV should produce the same mask value each frame.
4. Animate `uProgress` from 0 to 1 using GSAP or a simple time-based controller without rebuilding the material.
5. Add a narrow accent edge around the dissolve boundary so the reveal reads clearly.
6. Keep scan lines subtle and configurable; avoid a high-contrast effect that harms product readability.
7. Handle transparency deliberately. Document whether the effect uses blending, discard, or a different cutout approach and explain the trade-off.
8. Verify the shader output and color management in the current Three.js version.
9. Test at a high device pixel ratio and reduce unnecessary fragment work if frame rate suffers.
10. Include a reduced-motion fallback that presents the final product state without continuous animation.

**Expected result:** A polished, reusable shader reveal that can be applied to a portfolio product showcase. Its progress and colors should be tunable through uniforms, its edge should remain visually clean, and the implementation should explain its transparency and performance choices.
