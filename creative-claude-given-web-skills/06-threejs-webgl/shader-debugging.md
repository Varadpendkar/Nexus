# SKILL: shader-debugging

**Layer:** 06 — Three.js / WebGL

**Goal:** Diagnose shader failures systematically across compilation, linking, coordinate spaces, uniforms, precision, GPU execution, and rendering performance instead of guessing at GLSL until the scene appears to work.

---

## Why This Matters (Senior Perspective)

Shader bugs are unusually expensive because the visible symptom is often far removed from the cause. A black mesh may mean a compile error, a failed program link, a missing uniform update, a normal transformed in the wrong space, a camera ray pointing away from the scene, a fragment shader that outputs transparent black, or a valid shader that is simply outside the camera frustum. A noisy or flickering result may be precision loss, unstable derivatives, a bad depth comparison, a non-normalized direction, or a value becoming `NaN`. The screen does not tell you which category is responsible. If you change lighting, camera position, material settings, and shader math at the same time, you destroy the evidence needed to isolate the failure.

A senior creative developer treats the GPU pipeline as a sequence of contracts. Source must compile; shader stages must link; attributes and uniforms must have the expected names and types; vertex outputs must match fragment inputs; coordinate spaces must be explicit; values must remain in a useful numeric range; and the final output must obey the renderer's color, depth, and blending expectations. Debugging follows that sequence from the earliest failure to the latest. The goal is not to memorize every WebGL error. It is to build a repeatable method that narrows the search space with one controlled experiment at a time.

This matters directly in portfolio and freelance work. A custom shader may look perfect on a developer's desktop and turn black on a mobile GPU, fail only after a route transition, compile in one browser but not another, or silently lose a uniform after a refactor. A client sees a broken hero, not an interesting compiler issue. Reliable shader debugging means you can keep the visual direction while reducing GPU cost, preserve a graceful fallback, and explain what you tested. The practices below apply to raw GLSL, `ShaderMaterial`, `RawShaderMaterial`, React Three Fiber, raymarching, post-processing, and custom vertex deformation. Examples use Three.js-style APIs and GLSL ES conventions; check the version and shader path used by your project before copying built-in declarations.

## Core Concepts

### 1. Debug the Pipeline in Order

Think of rendering as a chain of gates. If an early gate fails, debugging a later gate is wasted effort. Work from source and program setup toward the final pixel: compilation, linking, inputs, transforms, rasterization, fragment calculations, and output state.

```text
GLSL source
  ↓ compile vertex + fragment stages
Program link
  ↓ bind attributes and uniforms
Vertex processing
  ↓ clip space and rasterization
Fragment processing
  ↓ depth / stencil / blending
Framebuffer pixel
```

Start with the earliest concrete evidence. If compilation fails, do not tune lighting. If the program links but the mesh is invisible, temporarily output a constant color. If constant color works, the pipeline is alive and the bug is in your shader calculations or data.

```js
// A minimal Three.js diagnostic material.
const diagnosticMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    void main() {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
    }
  `
});
```

The constant magenta output deliberately ignores UVs and lighting. If it renders, geometry, camera, program setup, and basic fragment output are probably functioning. If it does not, inspect the renderer console, scene visibility, material assignment, clipping, and render target before investigating complex math.

**Naive approach:** Change the shader, camera, material, and light until something looks right.

**Correct approach:** Establish a known-good baseline, change one variable, and keep a record of which hypothesis each change tests.

**Gotcha:** A magenta material that works in a standalone scene does not prove your production shader has correct uniforms, varying interfaces, color management, or render-target state.

### 2. Read Compilation and Link Errors as Evidence

Shader compilation errors are not ordinary JavaScript exceptions. GLSL compilers report source locations and messages, and Three.js usually surfaces these through the browser console. A program can compile each stage independently and still fail to link because a varying's type or name differs between stages, or because stage interfaces exceed a device limit.

```js
renderer.debug.checkShaderErrors = true;
```

Use this development setting where supported by your Three.js version. Keep the browser console open and reproduce the failure after a clean reload. Read the first meaningful error, then inspect the lines around it. Later errors can be cascades caused by the first missing semicolon or malformed declaration.

```glsl
// Vertex shader
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// Fragment shader: interface must agree with the vertex stage.
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
```

In GLSL ES 1.00, `varying` is the familiar interface syntax used by many `ShaderMaterial` examples. In GLSL ES 3.00, use `in` and `out` and the appropriate version declaration. Do not mix examples from different GLSL versions without translating their interface and output conventions.

**Naive approach:** Treat every compiler message as an independent error and rewrite the entire shader.

**Correct approach:** Fix the first error, recompile, and repeat. Confirm that vertex and fragment interfaces match exactly.

**Gotcha:** Three.js may inject built-in declarations into `ShaderMaterial`; `RawShaderMaterial` expects more of the shader setup to be supplied by you. The same snippet can fail when moved between them.

### 3. Separate JavaScript Errors from GPU Errors

A shader can be perfectly valid while the JavaScript that supplies it is wrong. A misspelled uniform key, a uniform object replaced after material creation, or a callback that never runs can leave the GPU with stale values. Conversely, a valid JavaScript object does not prove the GPU program accepted the shader.

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uTint: { value: new THREE.Color('#4f7cff') }
  },
  vertexShader,
  fragmentShader
});

function animate(elapsedSeconds) {
  material.uniforms.uTime.value = elapsedSeconds;
  renderer.render(scene, camera);
}
```

Inspect the browser console for JavaScript exceptions first. Then inspect the material's uniform object in DevTools and verify that the render loop updates the same material instance that is attached to the mesh.

```js
// Wrong: replaces the whole uniform record and may break expected ownership.
material.uniforms.uTime = elapsedSeconds;

// Correct: update the record's value.
material.uniforms.uTime.value = elapsedSeconds;
```

**Gotcha:** Uniform locations can be optimized out when a uniform is unused in the compiled shader. A missing active uniform is not automatically a rendering failure; verify that the shader actually references it.

### 4. Use a Minimal Reproduction Instead of Debugging the Whole App

A complex creative site contains routing, scroll animation, asset loading, post-processing, CSS overlays, responsive layout, and multiple render loops. Any of those can obscure a shader issue. A minimal reproduction removes everything not needed to reproduce the symptom.

```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 20);
camera.position.z = 3;

const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(0.05, 0.3, 0.9, 1.0);
    }
  `
});
scene.add(new THREE.Mesh(geometry, material));
```

Use a simple plane, a single camera, no post-processing, and one material. Once the failure disappears, reintroduce features one at a time: original geometry, uniforms, textures, render target, post-processing, then app integration.

**Naive approach:** Debug the production scene with every effect enabled because that is where the bug happens.

**Correct approach:** Preserve the failing shader and the smallest scene that reproduces it. That becomes a fast regression test.

**Gotcha:** A bug caused by depth state, premultiplied alpha, or a post-processing target may disappear in a minimal scene. Record the removed state so you can add it back deliberately.

### 5. Verify Attribute and Varying Interfaces

Attributes describe per-vertex input; varyings carry interpolated data from vertex to fragment processing. A mismatch can produce a link failure or misleading output. The geometry must actually provide the attributes your shader expects.

```js
console.log(Object.keys(mesh.geometry.attributes));
console.log('position count:', mesh.geometry.attributes.position?.count);
console.log('uv count:', mesh.geometry.attributes.uv?.count);
```

```glsl
// Vertex stage
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

With `ShaderMaterial`, Three.js supplies common attributes and built-ins according to its shader conventions; do not redeclare them casually. With `RawShaderMaterial`, you own more declarations. Match `varying`/`in` names and types between stages and make sure custom geometry contains the requested attributes.

**Naive approach:** Assume every geometry has UVs, tangents, colors, and custom attributes.

**Correct approach:** Inspect geometry attributes and add only what the shader consumes.

**Gotcha:** A `PlaneGeometry` normally has UVs, but custom or procedurally generated `BufferGeometry` may not. Reading a missing attribute can fail compilation or produce undefined assumptions depending on how it is bound.

### 6. Debug Uniforms with Deliberate Sentinel Values

Uniform bugs often look like bad shader math. A value may never update, use the wrong units, be outside the expected range, or be a `Color` where the shader expects a scalar. Send known sentinel values and render them directly before applying them to a complex formula.

```glsl
uniform float uProgress;
varying vec2 vUv;
void main() {
  gl_FragColor = vec4(uProgress, vUv.x, vUv.y, 1.0);
}
```

If `uProgress` is intended to move from zero to one, this output makes its value visible as red. If red remains fixed, investigate the JavaScript update path before changing the shader's easing function.

```js
const uniforms = {
  uProgress: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) }
};

function setProgress(progress) {
  uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1);
}
```

Use values with obvious visual effects: `0`, `0.5`, and `1`; unit vectors along axes; a pure red/green/blue color; or a resolution that matches the drawing buffer. Keep production units explicit in variable names where helpful, such as `uTimeSeconds` and `uResolutionPixels`.

**Gotcha:** Uniforms are shared state if multiple meshes reference the same material. Updating one shared uniform affects every mesh using that material.

### 7. Visualize Coordinate Spaces Explicitly

Most spatial shader errors are coordinate-space errors disguised as artistic problems. A position can be in object, world, view, clip, or screen space. A normal is a direction, not a position, and should not be transformed with a translation. Before adjusting constants, render the coordinates as colors or show the axes.

```glsl
varying vec3 vViewPosition;
void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}
```

```glsl
varying vec3 vViewPosition;
void main() {
  vec3 debugColor = fract(abs(vViewPosition) * 0.25);
  gl_FragColor = vec4(debugColor, 1.0);
}
```

The second shader does not provide a physically meaningful material; it makes spatial changes visible. If the pattern moves with the camera, the values are in view space. If it remains attached to the object, you may be visualizing object-space values. Confirm the intended behavior before building lighting, triplanar mapping, or raymarching on top.

**Naive approach:** Add arbitrary offsets until the texture or light appears aligned.

**Correct approach:** Name the space in the variable (`vWorldPosition`, `vViewNormal`) and transform at a clear boundary.

**Gotcha:** `modelViewMatrix` transforms object positions into view space. It does not provide world position; use `modelMatrix` for object-to-world transformation when that is the intended space.

### 8. Catch NaN, Infinity, and Exploding Values

A shader may compile and still produce invalid numbers. Division by zero, normalizing a zero vector, taking `sqrt` of a negative value, or feeding extreme values into an exponential can create `NaN` or infinity. The output may become black, white, flickering, or driver-dependent.

```glsl
float safeDivide(float numerator, float denominator) {
  float safeDenominator = abs(denominator) < 0.0001
    ? (denominator < 0.0 ? -0.0001 : 0.0001)
    : denominator;
  return numerator / safeDenominator;
}

vec3 safeNormalize(vec3 value) {
  float magnitudeSquared = dot(value, value);
  return magnitudeSquared > 0.000001
    ? value * inversesqrt(magnitudeSquared)
    : vec3(0.0, 1.0, 0.0);
}
```

These guards make edge cases explicit. They are not a license to hide bad input: choose fallback values appropriate to the effect and track why the denominator or vector could be invalid.

```glsl
// Diagnostic: map a bounded scalar into grayscale.
float diagnosticValue = clamp(abs(uValue), 0.0, 1.0);
gl_FragColor = vec4(vec3(diagnosticValue), 1.0);
```

If the diagnostic output is unexpectedly saturated, inspect intermediate values one operation at a time. For complex expressions, temporarily output `abs(value)`, `sign(value)`, or a clamped range. Avoid relying on `isnan`/`isinf` in code paths where GLSL version or device support is uncertain.

**Gotcha:** Clamping the final color can conceal invalid intermediate math. Debug the earliest value that becomes nonsensical, not just the final output.

### 9. Check Precision and Mobile GPU Differences

Precision qualifiers influence the range and accuracy of floating-point values, particularly in fragment shaders on mobile hardware. A shader that looks stable on a desktop GPU may show banding, unstable comparisons, or noisy raymarching on a mobile device. Large world coordinates and tiny epsilon values are a common bad combination.

```glsl
precision highp float;

uniform float uTime;
varying vec2 vUv;
void main() {
  float wave = 0.5 + 0.5 * sin(uTime + vUv.x * 6.28318);
  gl_FragColor = vec4(vec3(wave), 1.0);
}
```

For fragment-heavy procedural effects, test `highp` availability and actual behavior on target devices rather than assuming desktop parity. Where `highp` is not reliable or unavailable in a target WebGL path, choose a lower-cost representation, reduce coordinate magnitude, or provide a fallback. Normalize the working space around the effect when possible.

**Naive approach:** Increase epsilon or change precision randomly until artifacts disappear.

**Correct approach:** Identify the unstable operation, constrain the input range, then choose precision and tolerances based on the scene scale.

**Gotcha:** More precision can cost performance on some devices. Benchmark the complete shader on representative hardware; precision is a correctness and performance decision together.

### 10. Debug Texture Sampling and Color Space

A sampled texture may be black or washed out because the texture is not loaded, UVs are missing, the sampler uniform is wrong, the image is interpreted in the wrong color space, or the material's output handling differs from a built-in material. Test the sample directly before mixing it with lighting.

```js
const texture = new THREE.TextureLoader().load('/textures/atelier-albedo.jpg');
texture.colorSpace = THREE.SRGBColorSpace;

const material = new THREE.ShaderMaterial({
  uniforms: { uMap: { value: texture } },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uMap;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(uMap, vUv);
    }
  `
});
```

The example shows the core sampling path for a GLSL ES 1.00-style `ShaderMaterial`; adapt sampling syntax and output conversion for your renderer and GLSL version. Keep albedo/base-color images in sRGB color space, while data maps such as roughness, metallic, normal, and masks generally use a non-color data interpretation. Check the actual network request and image dimensions when sampling appears empty.

**Gotcha:** A custom shader does not automatically reproduce every color-management and tone-mapping step of a standard material. A sampled texture may be valid yet look different because output conversion and tone mapping are not equivalent.

### 11. Inspect Depth, Transparency, and Face Culling

A shader can output the expected color and still not appear because another surface wins the depth test, alpha is zero, blending removes the result, or back-face culling hides the geometry. Diagnose render state separately from shader math.

```js
material.transparent = false;
material.depthTest = true;
material.depthWrite = true;
material.side = THREE.DoubleSide;
```

Temporarily use opaque output and double-sided rendering to test whether transparency or face orientation is involved. Then restore the correct production state. `DoubleSide` is a diagnostic, not a universal fix: it may hide incorrect normals or winding and can increase fragment work.

```glsl
void main() {
  gl_FragColor = vec4(1.0, 0.2, 0.05, 1.0); // fully opaque test
}
```

**Naive approach:** Set `depthTest = false` and `DoubleSide` permanently because the object becomes visible.

**Correct approach:** Determine whether the cause is depth ordering, transparent sorting, face winding, or alpha, then restore the intended state.

**Gotcha:** Transparent objects are generally sorted at the object level, not perfectly per pixel. Intersecting transparent surfaces can remain visually incorrect even when the shader is valid.

### 12. Understand Renderer and GPU Limits

Not every shader failure is a source-code bug. A shader may exceed instruction, varying, texture-unit, or uniform limits; a render target may use an unsupported format; or a post-processing pass may allocate more memory than a mobile GPU can sustain. Query capabilities and design within a realistic budget.

```js
console.table({
  maxTextures: renderer.capabilities.maxTextures,
  maxVertexTextures: renderer.capabilities.maxVertexTextures,
  maxAttributes: renderer.capabilities.maxAttributes,
  maxSamples: renderer.capabilities.maxSamples,
  isWebGL2: renderer.capabilities.isWebGL2
});
```

Use capability data to inform a fallback strategy, not to assume every device with a given label behaves identically. Keep shader variants small, reduce texture lookups, and test the actual render target format and multisampling path. If the error only occurs on one device family, capture the exact browser, OS, GPU, and renderer settings.

**Gotcha:** Capability checks cannot predict every driver bug or thermal throttling issue. A successful feature check is not a substitute for device testing.

### 13. Use Debug Output Modes Instead of Guessing

A diagnostic shader should answer one question. Useful modes include constant color, UV visualization, normal visualization, depth, one uniform channel, one intermediate scalar, and a step-count heat map for raymarching. Keep the modes switchable so they can be reused during future iterations.

```glsl
uniform int uDebugMode;
varying vec2 vUv;

void main() {
  vec3 color = vec3(0.0);
  if (uDebugMode == 0) {
    color = vec3(0.05, 0.3, 0.9);
  } else if (uDebugMode == 1) {
    color = vec3(vUv, 0.0);
  } else if (uDebugMode == 2) {
    color = vec3(vUv.x, 0.0, 1.0 - vUv.x);
  }
  gl_FragColor = vec4(color, 1.0);
}
```

Keep debug branches simple and remove or compile them out for the final shader if they increase instruction count or complicate production logic. A debug mode is most useful when it can be enabled without changing the geometry, camera, or animation setup.

**Gotcha:** Some uniforms may be optimized out in a particular shader variant. Confirm that the selected mode is compiled and that JavaScript updates the expected material instance.

### 14. Profile GPU Cost Separately from JavaScript Cost

A smooth JavaScript frame rate does not guarantee a cheap shader. Fragment-heavy effects can be GPU-bound even when CPU work is low. Conversely, expensive scene traversal or many draw calls can dominate while the shader is simple. Measure before optimizing.

```js
renderer.info.reset();
renderer.render(scene, camera);

console.log({
  calls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  points: renderer.info.render.points,
  geometries: renderer.info.memory.geometries,
  textures: renderer.info.memory.textures
});
```

`renderer.info` is useful for draw-call and memory clues, but it does not directly measure GPU execution time. Use browser performance tools and GPU timing extensions where supported, while recognizing that extension availability varies. Compare at fixed viewport sizes, consistent device pixel ratios, and repeatable camera states.

**Naive approach:** Reduce shader quality because the page feels slow.

**Correct approach:** Separate CPU frame work, draw-call count, fragment cost, render-target bandwidth, and GPU timing before selecting an optimization.

**Gotcha:** GPU timing queries may be asynchronous and can stall or mislead if polled incorrectly. Avoid turning measurement itself into a performance problem.

### 15. Full Real-World Use Case: Debug a Procedural Portfolio Hero

Imagine a portfolio hero that combines a custom shader, animated uniforms, a high-resolution render target, and post-processing. It works on a desktop but becomes black on a phone after scrolling. The correct response is not to remove effects at random. Build a repeatable investigation that identifies whether the failure is compilation, state, precision, memory, or performance.

```js
const diagnostics = {
  shaderCompiles: false,
  uniformsAdvance: false,
  textureLoaded: false,
  postProcessingEnabled: false
};

function reportDiagnostics() {
  console.table(diagnostics);
}

// Update these flags only after checking each condition explicitly.
// Keep this instrumentation in development builds, not the production bundle.
```

A practical sequence is:
1. Disable post-processing and render a constant opaque color.
2. Verify the shader compiles and the mesh is in view.
3. Enable UV output, then texture sampling, then one uniform at a time.
4. Confirm time and scroll uniforms update the material that is actually rendered.
5. Test at device pixel ratios of 1 and the intended production value.
6. Restore post-processing one pass at a time while checking render-target dimensions and memory.
7. Test on the target mobile browser and preserve a static or lower-cost fallback.

This sequence converts “black on mobile” into a list of testable hypotheses. Document the final cause and the regression test so a later visual polish pass does not reintroduce the failure.

**Gotcha:** If the issue appears only after scrolling, check lifecycle cleanup and duplicate animation loops as well as shader math. A stale render target or an unmounted component can make a correct shader appear broken.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Constant-Color Baseline

**What it does:** Proves that a shader program can render a visible fragment before complex calculations are restored.

**When to use it:** The mesh is black, invisible, or showing unexpected colors and you do not yet know whether the fault is source code or render state.

```glsl
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}
```

If the baseline fails, inspect the console, material assignment, camera, clipping, depth, and renderer. Do not continue debugging lighting until the baseline is visible. Adapt the output syntax for GLSL ES 3.00 when using that shader path.

### Pattern 2: Uniform Probe

**What it does:** Turns a numeric uniform into a visible color channel so data flow can be verified.

**When to use it:** Animation, scroll progress, pointer input, or a GUI control appears to have no effect.

```glsl
uniform float uProgress;
void main() {
  float value = clamp(uProgress, 0.0, 1.0);
  gl_FragColor = vec4(value, 0.0, 1.0 - value, 1.0);
}
```

A value of zero should appear blue and a value of one should appear red. If the color is static, inspect the JavaScript update loop and material identity before changing interpolation math.

### Pattern 3: Coordinate Heat Map

**What it does:** Makes a coordinate-space value visible as a repeatable color pattern.

**When to use it:** Procedural patterns slide unexpectedly, lighting appears detached, or a texture mapping changes when the camera moves.

```glsl
varying vec3 vWorldPosition;
void main() {
  vec3 color = fract(abs(vWorldPosition) * 0.2);
  gl_FragColor = vec4(color, 1.0);
}
```

Only use this if the vertex shader truly provides world-space position. If the variable contains view-space or object-space coordinates, rename it and interpret the pattern accordingly.

### Pattern 4: One-Feature-at-a-Time Reintroduction

**What it does:** Finds the smallest feature that causes a known-good shader to fail.

**When to use it:** A production material combines textures, lighting, noise, multiple uniforms, and post-processing.

```js
const debugStages = [
  'constant-color',
  'uv-visualization',
  'uniform-probe',
  'texture-sample',
  'lighting',
  'post-processing'
];

// Enable one stage, verify it, then advance to the next.
console.table(debugStages.map((stage, index) => ({ index, stage })));
```

Treat each stage as a test with a visible expected result. If a stage fails, do not add more complexity; isolate and fix it first.

### Pattern 5: Safe Numeric Boundary

**What it does:** Prevents common invalid inputs from contaminating the rest of a shader calculation.

**When to use it:** A procedural shader contains normalization, division, square roots, or values that can approach zero.

```glsl
float safeLength(vec3 value) {
  return sqrt(max(dot(value, value), 0.000001));
}

vec3 safeDirection(vec3 value) {
  return value / safeLength(value);
}
```

This is appropriate when a defined fallback direction is acceptable. It does not replace fixing an invalid domain or proving that the chosen minimum does not distort the effect.

### Pattern 6: Device-Targeted Shader Fallback

**What it does:** Selects a lower-cost rendering path when the intended shader or effect is unsupported or too expensive.

**When to use it:** A portfolio hero must remain usable on mobile, low-power GPUs, or browsers with reduced WebGL capability.

```js
const isWebGL2 = renderer.capabilities.isWebGL2;
const useHighCostEffect = isWebGL2 && window.matchMedia('(min-width: 900px)').matches;

material.uniforms.uQuality.value = useHighCostEffect ? 1.0 : 0.5;
```

This is a simple policy example, not a universal device detector. Validate real frame cost and offer a reduced-motion or static alternative where appropriate; screen width alone does not identify GPU power.

### Pattern 7: Regression Capture

**What it does:** Preserves the smallest known failure and the conditions needed to reproduce it.

**When to use it:** A shader issue is intermittent, browser-specific, or repeatedly returns after refactors.

```js
const shaderBugReport = {
  browser: navigator.userAgent,
  viewport: `${window.innerWidth}x${window.innerHeight}`,
  pixelRatio: window.devicePixelRatio,
  shaderVariant: 'portfolio-hero-v3',
  expected: 'animated blue-to-violet field',
  actual: 'black output after scroll'
};

console.table(shaderBugReport);
```

Capture the exact shader source, uniform values, renderer settings, and reproduction steps alongside the report. Avoid including private user data or unnecessary telemetry in production logs.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Rewriting the entire shader after one compile error | The developer treats the log as noise instead of a first-failure clue | Fix the earliest compiler error and recompile before touching later lines |
| Debugging lighting before confirming visible output | Lighting is the most obvious part of a material, so it receives attention first | Render a constant opaque color and verify the geometry/camera path |
| Mixing GLSL ES 1.00 and 3.00 syntax | Examples from different shader versions are copied together | Align version declaration, stage interfaces, texture calls, and fragment output syntax |
| Updating `material.uniforms.uTime` instead of `.value` | Uniform records are mistaken for scalar values | Mutate `material.uniforms.uTime.value` on the rendered material instance |
| Assuming every geometry provides UVs | Built-in geometries often hide attribute assumptions | Inspect `geometry.attributes` and generate the required buffer attribute explicitly |
| Assuming `ShaderMaterial` and `RawShaderMaterial` inject the same declarations | Their ownership contracts differ | Check the material class and supply only the declarations required by that path |
| Treating all coordinates as world space | Variable names do not encode transform history | Name values by space and transform positions/directions at explicit boundaries |
| Normalizing a zero vector | Degenerate input is not considered in the math | Guard the magnitude or define a meaningful fallback direction |
| Dividing by a value that can reach zero | The valid domain of the formula is undocumented | Clamp or branch around the denominator and inspect the upstream value |
| Fixing mobile artifacts by changing epsilon randomly | Precision, coordinate scale, and tolerance are conflated | Reduce coordinate magnitude, test precision, and choose epsilon for the scene scale |
| Sampling an unloaded or wrong texture | The shader path is debugged before the network and sampler path | Confirm the request, texture object, UVs, and direct sample output |
| Treating albedo and data maps as the same color space | Every texture is assumed to be a display-color image | Use sRGB interpretation for color images and linear data interpretation for masks/roughness/normal data |
| Disabling depth testing as a permanent fix | Visibility is confused with correct render ordering | Diagnose depth, alpha, winding, and sorting separately, then restore intended state |
| Using `DoubleSide` to hide bad normals | Face visibility is mistaken for correct geometry | Check winding and normals; keep double-sided rendering only when the design requires it |
| Assuming `renderer.info` gives GPU milliseconds | Draw-call counters are mistaken for GPU timing | Use supported GPU timing tools and compare controlled test conditions |
| Assuming WebGL2 guarantees a shader will run fast | API capability is confused with actual performance | Benchmark on representative hardware and select a tested quality tier |
| Leaving debug branches in the shipping shader without measurement | Development conveniences accumulate without cost review | Remove unused modes or measure the impact before shipping them |
| Recreating materials every React render | Component rerenders are confused with GPU resource updates | Keep material identity stable and update uniform values through the established lifecycle |
| Forgetting cleanup for animation loops and GPU resources | The scene is treated as a static object instead of a lifecycle-managed system | Stop loops, remove listeners, dispose owned resources, and verify remount behavior |

### Before → After: Uniform Update

**Before — replacing the uniform record:**

```js
material.uniforms.uTime = clock.getElapsedTime();
```

**After — updating the value expected by Three.js:**

```js
material.uniforms.uTime.value = clock.getElapsedTime();
```

The corrected form preserves the uniform record that Three.js uses to upload the value. If the shader still does not animate, confirm that `uTime` is referenced in the active shader and that the rendered mesh uses this material.

## Mental Models

1. **Debug the earliest broken gate** — Compilation must succeed before lighting math is worth investigating.
2. **A shader is a data pipeline** — Trace inputs, transforms, intermediate values, and output in order.
3. **One experiment, one hypothesis** — A change that tests three causes gives you almost no diagnostic certainty.
4. **Spaces are types** — Object-space position and world-space position may both be `vec3`, but they are not interchangeable.
5. **Uniforms are a contract** — JavaScript and GLSL must agree on names, types, units, update timing, and ownership.
6. **Make invisible values visible** — A temporary color channel often explains a bug faster than another paragraph of reasoning.
7. **Clamp only with intent** — A guard can stabilize a valid edge case or conceal a broken input; know which one it is.
8. **Desktop success is not device coverage** — Precision, memory, thermal behavior, and driver differences require real target testing.
9. **Render state is part of the shader experience** — Depth, alpha, culling, tone mapping, and color conversion can change the final pixel.
10. **A minimal repro is an asset** — Preserve the smallest test that proves the failure and prevents regression.

## Quick Reference

| Property / Situation | Value / Answer | Notes |
|---|---|---|
| Mesh renders black | Output constant opaque magenta | Separates shader math from basic visibility |
| Shader compile failure | Read the first compiler error | Later messages may be cascading errors |
| Program link failure | Compare vertex/fragment interface names and types | Check version syntax and resource limits |
| Uniform never changes | Update `material.uniforms.name.value` | Confirm active shader use and material identity |
| UV output looks blank | Inspect `geometry.attributes.uv` | Custom geometry may not provide UVs |
| Texture appears black | Verify load, sampler, UV, and direct sample output | Then inspect color-space/output handling |
| Pattern moves with camera | Inspect coordinate space | View-space values move with the camera |
| Lighting seems detached | Visualize positions and normals | Check normal transform and coordinate consistency |
| Shader flickers near zero | Guard divisions and degenerate vectors | Inspect intermediate numeric ranges |
| Mobile banding/noise | Test precision and coordinate magnitude | Avoid arbitrarily shrinking epsilon values |
| Geometry disappears from one side | Test `DoubleSide` diagnostically | Also inspect winding and culling state |
| Object appears behind another | Inspect depth test/write and draw order | Do not disable depth globally without understanding the scene |
| Alpha looks wrong | Output opaque alpha temporarily | Then check blending and premultiplication expectations |
| Effect fails only with postprocessing | Disable passes, then restore one at a time | Verify render-target dimensions and formats |
| App slows after route change | Inspect animation-loop and listener cleanup | Duplicate render loops can masquerade as shader cost |
| Need to inspect renderer capacity | `renderer.capabilities` | Capability is not a performance benchmark |
| Need draw-call count | `renderer.info.render.calls` | Does not measure GPU time directly |
| Need texture memory clue | `renderer.info.memory.textures` | Counts resources; does not expose exact byte cost |
| Need a stable bug report | Capture source, uniforms, device, viewport, and reproduction steps | Keep reports privacy-conscious |
| Need a low-cost mobile mode | Reduce steps, passes, resolution, and texture samples | Measure each tradeoff on real hardware |
| Need to verify coordinate values | Output `fract(abs(value) * scale)` as RGB | Use only for temporary diagnostics |

## Build Challenge

### Build: The Shader Failure Lab

Create a small Three.js debugging playground that can deliberately switch between a known-good shader and several controlled failures. The goal is to prove that you can diagnose shader issues by evidence rather than guesswork, then turn the debugging process into a reusable development tool for future creative projects.

**Requirements**

1. Create a scene with one plane, one camera, and one `ShaderMaterial` using a stable material instance.
2. Add a constant-color baseline that renders even when all optional calculations are disabled.
3. Add a UV debug mode that displays the horizontal and vertical UV coordinates as color.
4. Add a uniform-probe mode that maps a `uProgress` value from blue at zero to red at one.
5. Drive `uProgress` from a controlled animation and provide a pause/reset control.
6. Add a texture-sample mode and visibly report whether the texture has loaded.
7. Add a coordinate visualization mode whose label states whether the value is object, world, or view space.
8. Add a numeric debug mode for one intermediate scalar, with deliberate clamping for display only.
9. Provide a way to disable post-processing or other optional effects without deleting their setup code.
10. Add a failure-injection menu for at least four cases: stale uniform, missing UV assumption, invalid denominator, and incorrect coordinate transform.
11. For each injected failure, display the expected symptom and the first diagnostic test to perform.
12. Record basic renderer counters and viewport/device-pixel-ratio information in a development-only diagnostics panel.
13. Test at device pixel ratio 1 and at the normal display pixel ratio; compare the result and GPU cost.
14. Add a low-cost fallback mode that reduces optional shader work while preserving a readable visual result.
15. Confirm that unmounting or resetting the lab stops animation work and disposes resources owned by the lab.

**Expected output / definition of success**

- The baseline mode reliably renders a solid color before other features are enabled.
- Each debug mode answers one clear question and has an obvious expected output.
- Every injected failure can be reproduced, diagnosed, fixed, and verified without random changes to unrelated code.
- Uniform values and their units are documented; coordinate spaces are named explicitly.
- The app distinguishes compile/link errors, JavaScript update failures, invalid math, and render-state problems.
- The diagnostics panel reports useful information without claiming that draw-call counters equal GPU milliseconds.
- A reduced-cost mode works on a lower-power device and does not depend only on user-agent strings.
- Cleanup is verified by mounting, unmounting, and remounting the lab without duplicate loops or growing resource counts.
- The README contains a short incident report for each injected failure: symptom, hypothesis, test, root cause, fix, and regression check.

**Suggested time plan**

- 20 minutes: build the minimal scene and constant-color baseline.
- 30 minutes: add UV, uniform, texture, and coordinate debug modes.
- 30 minutes: implement failure injection and the diagnosis guide.
- 25 minutes: add renderer diagnostics and low-cost mode.
- 20 minutes: test lifecycle cleanup, mobile behavior, and write the incident reports.

**Stretch goals**

- Add a raymarching shader with a step-count heat map and a normal visualization mode.
- Capture a reproducible debug bundle containing the shader source, non-sensitive uniform values, viewport, and renderer capability summary.
- Add a side-by-side comparison between the original shader and the reduced-cost fallback.
- Add a visual checklist that prevents the production build from shipping with debug output enabled.
