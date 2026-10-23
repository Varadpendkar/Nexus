---
# SKILL: shader-reader
**Layer:** 11 — Reverse Engineering
**Goal:** Inspect a shader-based visual effect, separate its inputs, coordinate spaces, math, and rendering pipeline, then document a safe, testable recipe for recreating the effect.

---

## Why This Matters (Senior Perspective)

A shader can make a small amount of geometry feel atmospheric, fluid, tactile, or otherworldly. But a convincing visual is not just a fragment of GLSL: it is the combination of coordinate systems, uniforms, geometry, texture data, color space, render state, and the JavaScript code that feeds the GPU. When reverse-engineering a shader demo, the main challenge is to distinguish the visible result from the implementation choices that produced it. A moving gradient may be noise, layered sine waves, a texture lookup, or a post-processing pass. A distorted image may use UV displacement, vertex deformation, a normal map, or a combination of them.

Senior creative developers avoid guessing based on appearance alone. They first record observable behavior, then inspect available source and runtime controls, and finally test hypotheses one at a time. They identify whether the effect is vertex-driven or fragment-driven, which coordinates are used, how time enters the calculation, which uniforms control its parameters, and what assumptions are made about resolution and input media. They also distinguish a real finding from an inference: if the original shader is minified or inaccessible, the correct output is a well-supported implementation hypothesis, not a claim that the author's code has been recovered.

This skill provides a repeatable method for reading shader demos and turning the understanding into an implementation recipe. The aim is not to copy complex shader code without context. It is to build a compact model of the rendering pipeline, identify the smallest set of calculations responsible for the look, and recreate the effect with explicit controls, predictable resizing, appropriate color handling, and a fallback for devices that cannot run the preferred path. That approach produces code that can be tuned and maintained inside a real portfolio or client project.

---

## Core Concepts

### 1. Start with the observable effect and the rendering pipeline

Before opening the shader source, describe what changes over time and what stays fixed. Does the geometry deform? Does the image warp? Does color shift? Does a cursor influence the surface? Is the effect fullscreen or attached to one mesh? Then map the effect to the likely pipeline: vertex shader, fragment shader, texture input, post-processing pass, or multiple stages.

```text
Observation:
- A still image appears to ripple when the pointer moves.
- The image boundary does not change shape.
- Distortion is strongest near the pointer and fades with distance.

Hypotheses:
- The mesh may remain flat while the fragment shader offsets UV coordinates.
- A pointer uniform probably supplies the interaction location.
- A radial falloff likely reduces displacement away from the pointer.

Tests:
1. Move the pointer while watching the geometry wireframe, if available.
2. Freeze time and move only the pointer.
3. Disable the pointer uniform or set displacement strength to zero.
4. Inspect whether the source samples a texture at modified UV coordinates.
```

A fixed boundary does not prove that the geometry is unchanged, but it gives a testable hypothesis. A good reverse-engineering note records what is observed and which experiment would distinguish competing explanations.

**Naive approach:** Decide that the effect uses a particular noise function because it looks organic.

**Correct approach:** List the visible behaviors and inspect the stages that could produce them.

**Gotcha:** Post-processing can make an otherwise simple scene look complex. Do not assume every visual effect belongs inside the material shader on the object.

### 2. Distinguish vertex and fragment shaders

A vertex shader processes geometry vertices and typically determines clip-space position. A fragment shader computes the color of rasterized fragments. Vertex deformation changes the silhouette only when the mesh has enough vertices; fragment distortion can change sampled color without changing the underlying geometry boundary.

```glsl
// Vertex shader: move the surface itself.
uniform float uTime;
uniform float uAmplitude;

void main() {
  vec3 displacedPosition = position;
  displacedPosition.z += sin(position.x * 3.0 + uTime) * uAmplitude;

  gl_Position = projectionMatrix
              * modelViewMatrix
              * vec4(displacedPosition, 1.0);
}
```

```glsl
// Fragment shader: change the color sampled at a UV coordinate.
uniform sampler2D uTexture;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 warpedUv = vUv;
  warpedUv.x += sin(vUv.y * 12.0 + uTime) * 0.015;

  gl_FragColor = texture2D(uTexture, warpedUv);
}
```

These are conceptual WebGL 1-style snippets. The exact syntax depends on the rendering framework and shader version. In WebGL 2 or modern Three.js shader paths, `in`, `out`, and explicit output declarations may replace legacy syntax.

**Naive approach:** Put all calculations into the fragment shader because it has access to every pixel.

**Correct approach:** Choose the stage based on what must change: geometry position, material color, or the final composited image.

**Gotcha:** Vertex displacement can look faceted or uneven when the mesh lacks enough subdivisions. Fragment UV warping can stretch or sample outside the texture bounds.

### 3. Read coordinate spaces explicitly

Shader code often contains several coordinate spaces: object/local coordinates, world coordinates, view coordinates, clip coordinates, UV coordinates, and screen coordinates. Similar-looking vectors can represent entirely different units. A displacement of `0.1` in local space is not equivalent to a displacement of `0.1` in UV space or clip space.

```glsl
varying vec2 vUv;
varying vec3 vLocalPosition;

void main() {
  vUv = uv;
  vLocalPosition = position;

  gl_Position = projectionMatrix
              * modelViewMatrix
              * vec4(position, 1.0);
}
```

```glsl
varying vec2 vUv;
varying vec3 vLocalPosition;

void main() {
  float bands = sin(vLocalPosition.x * 4.0);
  vec3 color = mix(vec3(0.05, 0.08, 0.12), vec3(0.2, 0.8, 0.7), bands * 0.5 + 0.5);
  gl_FragColor = vec4(color, 1.0);
}
```

This example passes local position from the vertex stage to the fragment stage. If the mesh is rotated or scaled, local coordinates retain their relationship to the object; world-space coordinates would instead express the effect relative to the scene.

**Naive approach:** Copy a coordinate expression without identifying the space it uses.

**Correct approach:** Trace where each varying or uniform originates and state its coordinate space and units.

**Gotcha:** UV coordinates commonly span 0–1, but they may be tiled, flipped, or outside that range. Screen-space coordinates depend on viewport resolution and pixel ratio.

### 4. Understand UV coordinates and texture sampling

A texture sampler uses UV coordinates to fetch color data. Altering UV coordinates is a common way to create ripples, heat haze, liquid distortions, and image transitions without deforming the mesh. The important question is not just how the UV is modified, but whether the modified coordinate remains inside the valid sampling area and how the texture wraps at its edges.

```glsl
uniform sampler2D uTexture;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  float waveX = sin(uv.y * 18.0 + uTime * 1.4);
  float waveY = cos(uv.x * 13.0 - uTime);

  uv.x += waveX * 0.008;
  uv.y += waveY * 0.006;

  vec4 sampledColor = texture2D(uTexture, uv);
  gl_FragColor = sampledColor;
}
```

The displacement values are deliberately small because UV space is normalized. Larger offsets can visibly stretch the image or reveal edge artifacts. Texture wrapping mode determines whether out-of-range coordinates repeat, clamp, or mirror, so inspect sampler settings as part of the effect.

**Naive approach:** Increase displacement until the distortion is obvious.

**Correct approach:** Tune frequency and amplitude independently, inspect the image edges, and confirm the texture's wrap mode.

**Gotcha:** A UV displacement that works on a square image can distort differently on a wide banner if the calculation ignores aspect ratio.

### 5. Read uniforms as the control surface

Uniforms are values shared by shader invocations during a draw call. They often carry time, pointer position, resolution, strength, color, progress, or texture references. Treat them as the public controls of the shader. When reverse-engineering, make a table of each uniform's source, expected range, update frequency, and visible effect.

```js
const shaderUniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uPointer: { value: new THREE.Vector2(0.5, 0.5) },
  uStrength: { value: 0.018 },
  uTexture: { value: loadedTexture }
};

// Inside the render loop:
shaderUniforms.uTime.value = elapsedSeconds;
shaderUniforms.uResolution.value.set(
  renderer.domElement.width,
  renderer.domElement.height
);
```

A uniform updated every frame has a different cost and lifecycle from one set only during initialization. Texture uniforms also have loading and color-space considerations. Document whether resolution means CSS pixels, drawing-buffer pixels, or normalized dimensions; ambiguous resolution values are a frequent source of inconsistent effects.

**Naive approach:** Change multiple uniforms simultaneously until the shader looks closer.

**Correct approach:** Expose controls and change one parameter at a time to establish cause and effect.

**Gotcha:** In high-DPI rendering, `canvas.clientWidth` and the drawing buffer width may differ. Use the coordinate system expected by the shader.

### 6. Understand time and animation deterministically

A shader's time uniform may be elapsed seconds, frame count, normalized progress, or a wrapped periodic value. The choice changes whether the effect is frame-rate independent, deterministic, and easy to scrub. Using frame count as time makes motion speed depend on rendering performance; elapsed seconds gives a consistent rate across devices.

```js
const clock = new THREE.Clock();

function renderFrame() {
  requestAnimationFrame(renderFrame);

  // Elapsed seconds, not the number of rendered frames.
  shaderMaterial.uniforms.uTime.value = clock.getElapsedTime();

  renderer.render(scene, camera);
}

renderFrame();
```

For reproducible captures, use a fixed time value or explicit progress rather than a continuously running clock. For scroll-driven visuals, normalized progress is often easier to reason about than elapsed time because the user can move backward and forward through the effect.

**Naive approach:** Increment `uTime` by `0.016` per frame and assume every display refreshes at 60 Hz.

**Correct approach:** Use elapsed time or an explicit progress value, then test behavior under dropped frames and different refresh rates.

**Gotcha:** Very large time values can reduce numerical precision or create unexpectedly fast phase values. If an effect is periodic, consider wrapping time deliberately when mathematically safe.

### 7. Read noise and periodic functions as different tools

Sine and cosine create regular, repeating patterns. Noise functions create less periodic variation and can help produce clouds, terrain, liquid, grain, or organic displacement. The visual difference comes from both the function and the way it is combined with coordinates, scale, and time. A sine wave is not automatically cheap or appropriate, and noise is not automatically organic.

```glsl
float waveField(vec2 uv, float time) {
  float broadWave = sin(uv.x * 5.0 + time);
  float fineWave = sin(uv.y * 17.0 - time * 1.3);
  return broadWave * 0.65 + fineWave * 0.35;
}

void main() {
  float field = waveField(vUv, uTime);
  vec3 darkTone = vec3(0.025, 0.035, 0.08);
  vec3 brightTone = vec3(0.1, 0.75, 0.68);
  vec3 color = mix(darkTone, brightTone, smoothstep(-0.8, 0.8, field));
  gl_FragColor = vec4(color, 1.0);
}
```

When reading noise-based code, find the noise function definition or imported library, then trace its input scale and octave count. Layered noise may create detail but increases arithmetic cost. A good recreation begins with one field and adds complexity only when it explains an observed visual feature.

**Naive approach:** Add several noise octaves to make the shader look sophisticated.

**Correct approach:** Identify the spatial scale and temporal behavior of the field, then use the least expensive function that achieves the target look.

**Gotcha:** Noise implementations vary in quality, periodicity, and cost. A function name alone is not enough to assess its behavior.

### 8. Read color math and interpolation

Shader color is usually represented numerically, not as a design token. `mix(a, b, t)` interpolates between values, while `smoothstep(edge0, edge1, x)` creates a smooth transition. The parameter `t` is not automatically clamped when using `mix`, so the range of the driving field matters. Also identify whether values are linear-light or display-encoded sRGB.

```glsl
float reveal = smoothstep(0.2, 0.8, vUv.x);
vec3 deepBlue = vec3(0.025, 0.06, 0.18);
vec3 vividTeal = vec3(0.05, 0.85, 0.72);

vec3 color = mix(deepBlue, vividTeal, reveal);
gl_FragColor = vec4(color, 1.0);
```

This produces a horizontal color transition. If the original demo uses a gradient texture, a palette uniform, or color-space conversions, those are part of the implementation recipe. Do not judge a color mismatch solely by comparing raw GLSL numbers.

**Naive approach:** Copy RGB constants and assume they will look identical in every rendering pipeline.

**Correct approach:** Inspect output color space, texture color space, tone mapping, and whether the shader's values are intended to be linear.

**Gotcha:** Applying gamma conversion twice or not at all can wash out or darken the result. Modern rendering frameworks may manage some color conversions for you, so follow the framework's conventions.

### 9. Trace pointer input from screen space into shader space

Interactive shaders often use a pointer uniform to influence distortion, lighting, or reveal position. Browser pointer coordinates are usually measured from the top-left of the viewport, while UV coordinates commonly use a bottom-left origin depending on the mapping. The conversion must match the shader's coordinate convention and canvas position.

```js
const canvasBounds = renderer.domElement.getBoundingClientRect();
const pointerUniform = shaderMaterial.uniforms.uPointer;

function updatePointer(event) {
  const bounds = renderer.domElement.getBoundingClientRect();

  const normalizedX = (event.clientX - bounds.left) / bounds.width;
  const normalizedY = 1 - (event.clientY - bounds.top) / bounds.height;

  pointerUniform.value.set(normalizedX, normalizedY);
}

renderer.domElement.addEventListener("pointermove", updatePointer);
```

The y-axis is flipped so the pointer uses a bottom-left origin. The calculation uses the canvas bounds rather than the whole viewport because the canvas may be positioned inside a page section. Add guards for zero-sized bounds and clean up the listener when the canvas is removed.

**Naive approach:** Normalize pointer coordinates against `window.innerWidth` and `window.innerHeight` for every canvas.

**Correct approach:** Normalize against the actual interactive element and document the origin convention.

**Gotcha:** CSS transforms, device pixel ratio, and shader resolution can introduce additional coordinate conversions. Make the coordinate spaces explicit rather than mixing CSS pixels and drawing-buffer pixels.

### 10. Distinguish resolution, aspect ratio, and device pixel ratio

A shader may need the physical drawing-buffer size, the CSS size, or a normalized coordinate system. These are different. `devicePixelRatio` affects the number of rendered pixels and therefore GPU cost, while aspect ratio affects how circular or directional effects appear on a non-square canvas.

```js
function resizeRenderer(renderer, camera, uniforms) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (width === 0 || height === 0) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  uniforms.uResolution.value.set(
    renderer.domElement.width,
    renderer.domElement.height
  );
}
```

If the renderer is configured with a pixel ratio, its drawing buffer can be larger than its CSS box. Decide what the shader needs and keep that convention consistent. For a radial effect, aspect-correct coordinates may be needed so a circle does not become an ellipse on a wide screen.

**Naive approach:** Set resolution once at startup and never update it.

**Correct approach:** Update camera and shader dimensions on resize, and use the correct pixel unit for each calculation.

**Gotcha:** Unbounded pixel ratio can multiply fragment workload on high-density screens. A quality cap can preserve visual sharpness while protecting frame rate.

### 11. Recognize masks, thresholds, and distance fields

A shader may use a scalar field to control opacity, reveal an image, draw an outline, or form a radial transition. `step()` creates a hard threshold; `smoothstep()` creates a softened boundary; a signed distance field can encode distance to a shape's edge. Identifying the field helps you understand whether the effect is a mask, a color gradient, or a geometric boundary.

```glsl
float distanceFromCenter = distance(vUv, vec2(0.5));
float mask = 1.0 - smoothstep(uRadius, uRadius + uSoftness, distanceFromCenter);

vec3 backgroundColor = vec3(0.025, 0.035, 0.055);
vec3 foregroundColor = vec3(0.9, 0.95, 1.0);
vec3 color = mix(backgroundColor, foregroundColor, mask);

gl_FragColor = vec4(color, 1.0);
```

The mask is controlled by radius and softness uniforms. To reconstruct a radial reveal, determine whether the original mask is centered in UV space, screen space, or an interaction point. Then inspect whether it affects color, alpha, or texture coordinates.

**Naive approach:** Treat every black-and-white shader as a texture.

**Correct approach:** Trace the scalar field, its threshold, and the downstream operation it controls.

**Gotcha:** UV distance is not aspect-correct by default. A circular mask in normalized UVs can appear elliptical when the surface is not square.

### 12. Identify the rendering framework and shader version

Shader syntax depends on the API and framework. Raw WebGL, Three.js `ShaderMaterial`, Three.js `RawShaderMaterial`, WebGL 2, and WebGPU shader paths have different conventions. A demo may also use a bundler or shader loader that transforms imports. Identify the framework before transplanting code.

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix
                  * modelViewMatrix
                  * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      float glow = 0.5 + 0.5 * sin(vUv.x * 8.0 + uTime);
      gl_FragColor = vec4(vec3(0.08, 0.3, 0.8) * glow, 1.0);
    }
  `
});
```

This is a Three.js `ShaderMaterial`-style example. Built-in attributes and uniforms are available according to the material type and framework version. `RawShaderMaterial` has different expectations, and WebGL 2 syntax may require explicit version and output declarations.

**Naive approach:** Paste shader source from one framework into another and treat compile errors as small syntax issues.

**Correct approach:** Confirm API, shader language version, injected declarations, varying conventions, and texture binding before porting.

**Gotcha:** Shader compilation errors may be reported separately from JavaScript errors. Capture the shader info log and inspect the exact source submitted to the GPU.

### 13. Separate a material shader from a post-processing shader

A material shader runs as part of drawing an object or surface. A post-processing pass typically samples a rendered image and applies an effect to the frame or a buffer. Fullscreen chromatic aberration, bloom-like effects, screen-space distortion, and color grading may be implemented after the scene renders rather than in the mesh material.

```js
// Conceptual pipeline:
// scene geometry -> scene render target -> fullscreen post-processing pass -> canvas
const renderPipeline = {
  scenePass: "renders geometry and materials",
  effectPass: "samples the scene texture and applies a screen-space effect",
  outputPass: "handles final output and color-space conversion"
};

console.table(renderPipeline);
```

When the source is available, search for render targets, effect composers, fullscreen quads, render passes, and texture inputs. When it is not, test whether the effect affects every object consistently or only one material. That can help distinguish a screen-space effect from a local material effect, although it is not definitive proof.

**Naive approach:** Rebuild a fullscreen effect separately on every mesh.

**Correct approach:** Identify whether the visual belongs to a material, a scene-wide pass, or the final output stage.

**Gotcha:** Post-processing adds render passes and memory bandwidth. It can be expensive on mobile, particularly at high resolutions.

### 14. Treat performance as part of the shader's design

Shader cost depends on resolution, number of fragments, arithmetic, texture fetches, branching, precision, and the number of passes. A fullscreen shader executes across many pixels; an expensive calculation there can cost more than the same calculation on a small object. A visually subtle effect may not justify multiple noise octaves or repeated texture samples.

```js
function chooseShaderQuality(viewportWidth, viewportHeight, devicePixelRatio) {
  const pixelCount = viewportWidth * viewportHeight;
  const estimatedPhysicalPixels = pixelCount * devicePixelRatio * devicePixelRatio;

  if (estimatedPhysicalPixels > 5_000_000) {
    return { pixelRatioCap: 1.25, quality: "low" };
  }

  if (estimatedPhysicalPixels > 2_500_000) {
    return { pixelRatioCap: 1.5, quality: "medium" };
  }

  return { pixelRatioCap: 2, quality: "high" };
}
```

This is a heuristic example, not a universal device benchmark. Actual quality decisions should be informed by representative devices and performance traces. Use quality tiers to reduce resolution, samples, or secondary effects before removing the core visual idea.

**Naive approach:** Optimize by reducing every number without checking what creates the look.

**Correct approach:** Identify the dominant cost, measure frame time, and lower the least visually important workload first.

**Gotcha:** Fragment shader cost scales with rendered pixels, so high device pixel ratios can be more expensive than the CSS dimensions suggest.

### 15. Validate a shader hypothesis with controlled experiments

A reliable reading process changes one input at a time. Freeze time, set displacement to zero, remove the texture, replace noise with a constant, or display UV coordinates as RGB. Each experiment isolates a part of the pipeline. If multiple inputs change simultaneously, the result may look different without revealing why.

```glsl
// Debug view: visualize UV coordinates as color.
void main() {
  gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
}
```

A UV debug view should show a smooth red/green gradient if the varying is wired correctly. Other useful debug views include normals, local position, depth, mask values, and texture coordinates after distortion. Keep debug modes easy to toggle and remove them from production builds when no longer needed.

**Naive approach:** Keep changing shader code until the output looks close.

**Correct approach:** Form one hypothesis, isolate one variable, inspect the output, and record the result.

**Gotcha:** Debug visualizations can change output color space or bypass the original pipeline. Compare them for structural clues, not final color accuracy.

### 16. Document what is observed, inferred, and unknown

When reading a public demo, you may not have the full source, asset pipeline, or original development context. Separate direct evidence from plausible explanation. A good note should say what you saw, what code supports the conclusion, and what experiment would confirm an unresolved detail.

```js
const shaderReadingReport = {
  observed: [
    "The image ripples around the pointer.",
    "The canvas boundary remains rectangular."
  ],
  confirmedFromSource: [
    "A pointer uniform is updated from pointermove.",
    "The fragment shader samples a texture at modified UV coordinates."
  ],
  inferred: [
    "A radial falloff probably limits the affected region."
  ],
  unknown: [
    "Whether the original uses a custom noise function in another pass."
  ],
  nextTests: [
    "Set displacement strength to zero.",
    "Visualize the modified UV coordinates.",
    "Inspect render targets and post-processing setup."
  ]
};

console.table(shaderReadingReport);
```

Use this discipline in portfolio work and client handoffs. It prevents a speculative implementation detail from becoming a false technical claim and gives the next developer a clear path to verify the result.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Shader-reading worksheet

**What it does:** Turns a visual reference into a structured investigation.

**When to use it:** Use it when the source is large, minified, partially inaccessible, or split across framework and shader files.

```js
const shaderWorksheet = {
  effectSummary: "localized image distortion around pointer",
  renderStage: "fragment shader or post-processing pass — verify",
  geometry: "flat image plane suspected",
  coordinates: {
    pointer: "normalized canvas coordinates, y origin to verify",
    texture: "UV coordinates"
  },
  uniforms: [
    { name: "uTime", source: "animation clock", range: "elapsed seconds" },
    { name: "uPointer", source: "pointer event", range: "0..1 per axis" },
    { name: "uStrength", source: "configuration", range: "small positive scalar" }
  ],
  dependencies: ["WebGL", "rendering framework — identify exact version"],
  unknowns: ["texture wrap mode", "reduced-motion fallback"],
  experiments: [
    "freeze time",
    "set strength to zero",
    "visualize UV coordinates",
    "test at a different aspect ratio"
  ]
};

console.log(JSON.stringify(shaderWorksheet, null, 2));
```

Replace the sample observations with evidence from the demo. Keep unknown fields until the source or experiments answer them; do not treat the template as a finding.

### Pattern 2: Debug shader inputs with uniform controls

**What it does:** Makes important shader parameters easy to inspect and tune.

**When to use it:** Use it while rebuilding a material or comparing the effect against a reference.

```js
const shaderControls = {
  uTime: { value: 0 },
  uStrength: { value: 0.012 },
  uFrequency: { value: 14.0 },
  uPointer: { value: new THREE.Vector2(0.5, 0.5) }
};

function updateShaderParameters({
  elapsedSeconds,
  displacementStrength,
  waveFrequency,
  pointerX,
  pointerY
}) {
  shaderControls.uTime.value = elapsedSeconds;
  shaderControls.uStrength.value = displacementStrength;
  shaderControls.uFrequency.value = waveFrequency;
  shaderControls.uPointer.value.set(pointerX, pointerY);
}
```

Keep controls independent when possible. This lets you establish whether the visual depends primarily on amplitude, frequency, pointer location, or time. Clamp interactive values to ranges that preserve the intended visual and avoid unstable results.

### Pattern 3: UV distortion with aspect correction

**What it does:** Applies a radial or directional distortion without allowing a wide surface to skew the distance calculation.

**When to use it:** Use it for pointer ripples, radial reveals, and lens-like effects on image planes.

```glsl
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;
uniform float uStrength;
varying vec2 vUv;

void main() {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 centeredUv = (vUv - uPointer) * aspect;
  float radius = length(centeredUv);

  float falloff = 1.0 - smoothstep(0.0, 0.45, radius);
  vec2 direction = normalize(centeredUv + vec2(0.0001));
  vec2 warpedUv = vUv + direction * sin(radius * 24.0 - uTime * 3.0)
                          * uStrength * falloff;

  vec4 color = texture2D(uTexture, warpedUv);
  gl_FragColor = color;
}
```

This example illustrates the calculation order, not a complete material: `uTexture` must be declared and bound, and resolution units must match the convention used by the shader. The small epsilon reduces division-by-zero risk near the pointer, but the visual should still be tested at the exact center and at canvas edges.

### Pattern 4: Progressive enhancement for a WebGL hero

**What it does:** Keeps a meaningful static presentation available if WebGL cannot be initialized or if the user requests reduced motion.

**When to use it:** Use it for portfolio hero backgrounds and decorative shader canvases that are not the only source of content.

```js
const heroCanvas = document.querySelector(".hero-shader-canvas");
const heroFallback = document.querySelector(".hero-shader-fallback");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function enableShaderHero() {
  if (!heroCanvas || reducedMotionQuery.matches) {
    if (heroCanvas) heroCanvas.hidden = true;
    if (heroFallback) heroFallback.hidden = false;
    return;
  }

  try {
    const gl = heroCanvas.getContext("webgl2") ||
               heroCanvas.getContext("webgl");

    if (!gl) throw new Error("WebGL is unavailable");

    heroCanvas.hidden = false;
    if (heroFallback) heroFallback.hidden = true;
    // Initialize the renderer and shader only after capability checks.
  } catch (error) {
    heroCanvas.hidden = true;
    if (heroFallback) heroFallback.hidden = false;
    console.warn("Shader hero fallback activated:", error.message);
  }
}

enableShaderHero();
reducedMotionQuery.addEventListener("change", enableShaderHero);
```

A production version should also dispose of renderer resources when switching modes, avoid creating duplicate render loops, and ensure that the fallback contains the same essential message or visual information.

### Pattern 5: Freeze and step through time for deterministic comparison

**What it does:** Makes a shader effect reproducible while tuning parameters or comparing screenshots.

**When to use it:** Use it when the effect has continuous motion and a screenshot comparison otherwise depends on timing.

```js
const shaderClockState = {
  elapsedSeconds: 0,
  playing: false,
  speed: 1
};

function advanceShaderClock(deltaSeconds, uniforms) {
  if (!shaderClockState.playing) return;

  shaderClockState.elapsedSeconds += deltaSeconds * shaderClockState.speed;
  uniforms.uTime.value = shaderClockState.elapsedSeconds;
}

function setShaderTime(seconds, uniforms) {
  shaderClockState.elapsedSeconds = Math.max(0, seconds);
  uniforms.uTime.value = shaderClockState.elapsedSeconds;
}
```

Call `advanceShaderClock()` from the render loop with measured delta time. For a screenshot test, pause playback and call `setShaderTime()` with a fixed value. This avoids comparing two different phases of an animated field and mistakenly attributing the difference to a code change.

### Pattern 6: Resource and render-loop cleanup

**What it does:** Prevents the recreated effect from retaining GPU resources or creating multiple animation loops after reinitialization.

**When to use it:** Use it when the shader belongs to a route, modal, component, or dynamically created scene.

```js
function mountShaderScene({ renderer, scene, camera, material, geometry }) {
  let animationFrameId = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function renderFrame() {
    if (disposed) return;

    material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(renderFrame);
  }

  animationFrameId = requestAnimationFrame(renderFrame);

  return function disposeShaderScene() {
    disposed = true;
    cancelAnimationFrame(animationFrameId);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
  };
}
```

Dispose only resources owned by this scene. If geometry, materials, or textures are shared with another scene, track ownership before releasing them. A single cleanup function makes the lifecycle explicit and easier to test.

### Pattern 7: Controlled comparison and evidence log

**What it does:** Keeps the investigation grounded in reproducible observations.

**When to use it:** Use it when several plausible shader techniques could produce the same visual.

```js
const experimentLog = [
  {
    change: "set uStrength to zero",
    observation: "image distortion disappears",
    conclusion: "uStrength controls displacement amplitude",
    confidence: "high"
  },
  {
    change: "freeze uTime",
    observation: "ripple stops moving but pointer response remains",
    conclusion: "time and pointer are separate inputs",
    confidence: "high"
  },
  {
    change: "resize canvas to a wide aspect ratio",
    observation: "radial field becomes elliptical",
    conclusion: "distance calculation may not be aspect-correct",
    confidence: "medium"
  }
];

console.table(experimentLog);
```

Use the log to decide what to inspect next. Confidence should reflect the quality of the test, not how plausible the explanation sounds. Replace these illustrative observations with results from your own experiments.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Guessing the algorithm from appearance | Several different shader techniques can create similar images | Describe the visible behavior first, then isolate inputs with debug views |
| Confusing vertex and fragment effects | Both can look like distortion in a still frame | Inspect silhouette changes, geometry density, UV sampling, and shader stage |
| Mixing coordinate spaces | Local, UV, clip, and screen coordinates use different units | Trace each variable's origin and document its coordinate system |
| Ignoring texture wrapping | UV distortion samples outside the nominal image range | Inspect wrap modes and test the image boundary |
| Treating time as frame count | The effect was tested on one refresh rate | Use elapsed seconds or normalized progress and test frame drops |
| Updating several uniforms at once | Tuning becomes guesswork | Change one parameter at a time and record the visible result |
| Ignoring color management | Identical numeric values render differently in different pipelines | Inspect texture color space, tone mapping, and output conversion |
| Copying a shader across frameworks | Syntax and built-in declarations differ | Identify WebGL version, material type, and injected attributes/uniforms |
| Forgetting high-DPI cost | CSS dimensions hide physical pixel count | Cap pixel ratio and measure on representative devices |
| Assuming a fullscreen effect is a material | The effect may run after the scene render | Inspect render targets, composer passes, and fullscreen quads |
| Omitting resize updates | Uniforms and camera use stale dimensions | Recalculate resolution and geometry-dependent values on resize |
| Ignoring reduced motion | The original demo was designed as an experiment | Keep static content visible and disable nonessential animation |
| Leaking GPU resources | The demo only initializes once | Cancel loops and dispose owned geometry, materials, textures, and renderer |
| Overbuilding before testing | Multiple noise layers obscure the source of a mismatch | Reconstruct a minimal version and add complexity incrementally |
| Reporting inference as fact | The source is unavailable or ambiguous | Label observations, confirmed source details, inferences, and unknowns separately |

**Before → after: make the debugging claim testable.**

```text
Before:
"The effect uses a noise shader and is expensive."

After:
"Observed: the image bends near the pointer and settles when the pointer stops.
Confirmed: the fragment shader offsets UVs using a pointer uniform.
Unknown: whether the offset field includes noise in another pass.
Next test: replace the offset with zero and compare GPU frame time at the same canvas size."
```

---

## Mental Models

1. **Appearance is evidence, not source code** — similar visuals can come from different rendering techniques.
2. **Coordinate spaces are units** — every vector should have a known space and convention.
3. **Uniforms are the control panel** — trace where each value comes from and what it changes.
4. **Time must have a meaning** — elapsed seconds, frame count, and normalized progress are not interchangeable.
5. **Resolution is workload** — fragment cost grows with rendered pixels and pass count.
6. **Debug views isolate causes** — inspect UVs, masks, normals, and inputs before tuning final color.
7. **A recipe includes the fallback** — the effect is not production-ready if content disappears when WebGL fails.

---

## Quick Reference

| Observation | Inspect | Likely explanation | Validation |
|---|---|---|---|
| Surface silhouette changes | Vertex shader and geometry density | Vertex displacement | Toggle displacement and inspect wireframe |
| Image bends but boundary remains fixed | UV values and texture sampling | Fragment UV distortion | Visualize warped UVs |
| Effect follows pointer | Pointer event and uniform update | Interactive shader field | Freeze time and move pointer |
| Organic moving field | Noise function and time input | Animated noise or layered functions | Freeze time and simplify field |
| Circular reveal looks oval | Aspect ratio and distance math | Uncorrected UV distance | Test square and wide canvases |
| Whole scene changes color | Render targets and passes | Post-processing | Disable effect pass |
| Shader looks washed out | Color space and tone mapping | Color conversion mismatch | Compare raw and managed output |
| Effect stutters on mobile | Resolution, sample count, passes | GPU workload too high | Cap pixel ratio and profile |
| Works only at startup size | Resolution uniform and cached measurements | Missing resize path | Resize after load |
| Shader stops after remount | Animation loop and resource lifecycle | Cleanup/reinitialization issue | Mount and dispose repeatedly |
| Black output | Compile log, uniforms, texture readiness | Compile or binding failure | Use a constant-color fragment shader |
| Texture appears upside down | UV orientation and loader convention | Coordinate orientation mismatch | Display UV gradient and inspect loader settings |
| Pointer response is offset | Canvas bounds and origin convention | Screen-to-UV conversion mismatch | Log normalized coordinates |
| Effect differs across framework versions | Shader syntax and injected declarations | API/version mismatch | Inspect exact submitted shader source |

---

## Build Challenge

### Build: Reverse-Engineer and Recreate a Shader Effect

Choose a shader-based demo that is available for inspection. Recreate one visible effect as a small, controlled scene and produce a short technical report. The aim is a reliable implementation, not a claim to have recovered inaccessible source.

**Requirements**

1. Record the demo URL, date, browser, viewport size, and the visual state inspected.
2. Describe the effect using observable language before proposing an implementation.
3. Identify whether the effect appears to operate on geometry, material fragments, or a post-processing pass.
4. List shader uniforms, their source values, expected ranges, and update frequency.
5. Identify coordinate spaces for positions, UVs, pointer coordinates, and resolution.
6. Create at least one debug mode for UVs, masks, normals, or a scalar field.
7. Change one parameter at a time and log the observed result.
8. Implement a minimal recreation with a clear render loop and resize handling.
9. Validate the effect at square and wide aspect ratios.
10. Test a fixed time value so two screenshots can be compared deterministically.
11. Add a static fallback for WebGL failure and reduced-motion preferences.
12. Cap pixel ratio or offer a lower-cost quality mode for constrained devices.
13. Implement cleanup for the animation loop and owned GPU resources.
14. Separate observed facts, source-confirmed findings, inferences, and unknowns.
15. Write `shader-recipe.md` with setup, shader stage, uniforms, coordinate conventions, performance notes, and validation steps.

**Expected output**

- A small working shader scene with one recreated effect.
- A `shader-recipe.md` report that explains the evidence and implementation.
- A debug view or switch that isolates a key input.
- A resize test and deterministic comparison capture.
- A fallback and cleanup path.

**Definition of done / Success criteria**

- [ ] The report describes visible behavior without assuming an algorithm.
- [ ] The rendering stage is identified or explicitly marked as an inference.
- [ ] Each uniform has a documented source and meaning.
- [ ] Coordinate spaces and resolution units are consistent.
- [ ] At least one controlled experiment confirms a key hypothesis.
- [ ] The effect remains understandable at two aspect ratios.
- [ ] The output can be reproduced at a fixed time value.
- [ ] WebGL failure and reduced motion leave useful content visible.
- [ ] GPU resources and animation frames are released on teardown.
- [ ] A future developer can tune the effect using the recipe without starting the investigation over.
