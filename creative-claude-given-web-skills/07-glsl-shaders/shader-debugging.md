# SKILL: shader-debugging

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Diagnose and resolve GLSL shader compilation failures, incorrect rendering, coordinate and precision issues, GPU performance bottlenecks, and integration bugs in WebGL and Three.js shader workflows.

## Why This Matters (Senior Perspective)

Shader debugging is different from ordinary JavaScript debugging. GLSL executes on the GPU, and a problem may appear as a compile failure, a black screen, a flat color, flickering geometry, incorrect UVs, unstable edges, or a frame rate drop. The visible symptom often occurs far from the line that caused it. A reliable workflow isolates one stage at a time instead of changing many variables until the effect looks right.

The highest-leverage habit is to reduce the shader to a known-good baseline. First verify that the material renders a constant color. Then verify coordinates, uniforms, textures, and calculations one at a time. This makes the failure boundary clear: a broken render pipeline requires a different fix from a mathematically incorrect distance field or a texture with the wrong color-space interpretation.

Production shader debugging also includes resource and performance discipline. A shader that compiles on a desktop can be too expensive on a mobile GPU, and a visual artifact may be caused by mismatched render-target dimensions, precision limits, or incorrect assumptions about coordinate spaces. Debug with repeatable tests, inspect compiler logs, and keep diagnostic modes available while developing.

## Core Concepts

### 1. Separate compilation errors from rendering errors

A compilation error means the shader source could not be compiled or linked. Common causes include undeclared uniforms, mismatched types, missing semicolons, invalid GLSL-version syntax, and inconsistent vertex/fragment interfaces.

A rendering error means the shader compiles but produces the wrong result. Typical causes include incorrect coordinate normalization, an uninitialized or stale uniform, an unexpected texture orientation, a division by zero, or a broken lighting calculation.

Use this decision sequence:

1. Does the material compile and link?
2. Does the geometry render with a constant color?
3. Do coordinates produce the expected gradient?
4. Do uniforms change when JavaScript updates them?
5. Do textures sample correctly?
6. Does the original calculation work when reintroduced in small pieces?

Do not debug a complex procedural effect until the minimal material renders successfully.

### 2. Read compiler logs carefully

Three.js exposes shader diagnostics through the browser console and WebGL program diagnostics. Errors may refer to generated shader source, because Three.js can inject built-in declarations and prefixes. The reported line number may therefore not match the line number in the fragment string you wrote.

Use the first meaningful error as the starting point. Later errors can be cascading failures caused by one missing declaration or delimiter. Check the surrounding lines, not only the exact reported line.

```js
renderer.debug.checkShaderErrors = true;

renderer.debug.onShaderError = (
  gl,
  program,
  vertexShader,
  fragmentShader
) => {
  console.error("Program log:", gl.getProgramInfoLog(program));
  console.error("Vertex shader log:", gl.getShaderInfoLog(vertexShader));
  console.error("Fragment shader log:", gl.getShaderInfoLog(fragmentShader));
};
```

This callback can be useful during development. Verify the API against the Three.js version in your project, and remove noisy custom logging if it obscures other diagnostics. Never assume a shader is valid merely because JavaScript did not throw an exception.

### 3. Use a constant-color baseline

Start with the simplest possible fragment shader. If this does not render as expected, the issue is likely in material setup, geometry, camera, render loop, or shader compilation—not in the procedural math.

```glsl
void main() {
    gl_FragColor = vec4(0.1, 0.7, 0.9, 1.0);
}
```

This example uses GLSL 1-style output conventions. For GLSL 3, declare an explicit output variable and write to that variable instead. Keep the vertex shader and fragment shader consistent with the selected GLSL version.

Once the constant color works, restore one feature at a time. Avoid introducing uniforms, texture sampling, lighting, and animation simultaneously; doing so makes the cause of a failure difficult to isolate.

### 4. Visualize coordinates directly

When UVs, aspect ratio, or coordinate transforms are suspect, render the coordinates as color. This helps reveal flipped axes, stretched values, and unexpected ranges.

For a mesh shader with a `vUv` varying:

```glsl
varying vec2 vUv;

void main() {
    gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
}
```

For a fullscreen shader using pixel coordinates:

```glsl
uniform vec3 iResolution;

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
}
```

The two examples use different coordinate sources. `vUv` comes from the mesh's UV attributes; `gl_FragCoord` is in drawing-buffer pixel coordinates. Do not swap them without considering the effect's coordinate contract.

### 5. Verify uniform declarations, types, and updates

A uniform's GLSL declaration must match the JavaScript value type and the uniform name used in the material. A typo may compile differently depending on the shader and can leave a value unused or undefined from the effect's perspective.

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uTint: { value: new THREE.Color("#32a8ff") }
  },
  vertexShader,
  fragmentShader
});

// Update values; do not recreate the material every frame.
material.uniforms.uTime.value = elapsedSeconds;
material.uniforms.uResolution.value.set(width, height);
material.uniforms.uTint.value.set("#ff8844");
```

In GLSL, declare the corresponding types:

```glsl
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uTint;
```

If a uniform appears stuck, verify that the animation loop runs, that the code updates the same material instance being rendered, and that the shader actually uses the uniform. Check units as well: seconds and milliseconds, CSS pixels and drawing-buffer pixels, or normalized values and byte-range values are frequent sources of subtle bugs.

### 6. Check coordinate spaces and resolution

WebGL shaders commonly use several coordinate spaces:

- **UV coordinates:** usually normalized mesh texture coordinates.
- **Fragment coordinates:** drawing-buffer pixel coordinates.
- **Clip space:** the position space used for rasterization.
- **View space:** coordinates relative to the camera.
- **World space:** coordinates relative to the scene.

A shader may compile while using the wrong space. For example, dividing `gl_FragCoord.xy` by CSS dimensions can be incorrect when the renderer uses a higher device pixel ratio. Use the actual drawing-buffer or render-target dimensions for pixel-coordinate math.

```js
const size = new THREE.Vector2();

function syncResolution(renderer, material) {
  renderer.getDrawingBufferSize(size);
  material.uniforms.uResolution.value.copy(size);
}
```

Call the synchronization function after resizing the renderer or changing its pixel ratio. If rendering into a `WebGLRenderTarget`, use that target's dimensions instead of the canvas dimensions.

### 7. Check precision and numerical stability

Fragment shaders often use `highp`, `mediump`, and `lowp` precision qualifiers. Precision support and cost can differ by device and shader stage. Large world coordinates, repeated trigonometric operations, nearly zero denominators, and very small distance thresholds can expose precision problems.

Useful safeguards include:

- Avoid dividing by values that can reach zero.
- Clamp inverse-trigonometric inputs to their valid range.
- Use a suitable epsilon for comparisons and finite differences.
- Keep calculations near a useful coordinate origin when possible.
- Avoid relying on tiny differences between very large floating-point values.
- Test on the lowest-capability device you intend to support.

Do not indiscriminately replace every value with `highp`; inspect the actual failure and choose precision appropriate to the algorithm and target devices.

### 8. Debug texture sampling and color

A texture can load successfully but still appear wrong because of its UVs, orientation, filtering, wrapping, color space, or sampler binding. Temporarily output the sampled texture directly:

```glsl
uniform sampler2D uMap;
varying vec2 vUv;

void main() {
    gl_FragColor = texture2D(uMap, vUv);
}
```

This is GLSL 1-style syntax. For GLSL 3, use the matching `texture()` call and explicit output declaration.

Check the following:

- Is the texture assigned to the uniform actually used by the rendered material?
- Are UVs present and in the expected range?
- Does the texture need repeat wrapping or clamping?
- Is the image a color texture or numerical data such as a normal map or mask?
- Is the texture color space set appropriately?
- Does the shader expect a vertically flipped source?

Set color space based on the texture's meaning, not simply on its file extension. Color images commonly use sRGB encoding; numerical data textures generally should not be treated as sRGB color.

## Reusable Patterns

### Pattern 1 — Diagnostic material

Use this minimal material to check whether the renderer, camera, geometry, and shader pipeline are working before restoring a complicated fragment shader.

```js
const diagnosticMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(0.1, 0.7, 0.9, 1.0);
    }
  `
});
```

Apply it to the same geometry that fails. If it renders correctly, the issue is likely in the original shader or its uniforms. If it does not, verify the mesh is in the scene, the camera sees it, the render loop runs, and the material is actually assigned.

For GLSL 3, update the output syntax and material configuration together.

### Pattern 2 — Uniform heartbeat

A moving color makes it easy to verify that the animation loop updates the uniform and that the intended material instance is on screen.

```glsl
uniform float uTime;

void main() {
    float pulse = 0.5 + 0.5 * sin(uTime * 2.0);
    gl_FragColor = vec4(pulse, 0.2, 1.0 - pulse, 1.0);
}
```

JavaScript update:

```js
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

animate();
```

If the color stays fixed, check that `animate()` is called, that the uniform name is correct, and that the displayed mesh uses this exact material. The uniform should be updated in place rather than by recreating the material on every frame.

### Pattern 3 — UV and aspect-ratio debug view

Use this to check whether coordinates span the expected range and whether the shader's resolution contract is correct.

```glsl
uniform vec2 uResolution;

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    gl_FragColor = vec4(uv.x, uv.y, 0.0, 1.0);
}
```

For a fullscreen plane, update the uniform from the drawing buffer:

```js
const drawingBufferSize = new THREE.Vector2();

function updateSize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.getDrawingBufferSize(drawingBufferSize);
  material.uniforms.uResolution.value.copy(drawingBufferSize);
}

window.addEventListener("resize", updateSize);
updateSize();
```

Use this debug view to identify stretched gradients, unexpected axis orientation, or a resolution value that does not change after resize. Remove the event listener during cleanup.

### Pattern 4 — Binary-search the shader logic

When a long shader produces an incorrect image, isolate the failing calculation by replacing half of the logic with a known value, then repeat on the failing half. This is faster than changing unrelated expressions.

A practical sequence:

1. Keep declarations and return a constant color.
2. Add coordinate calculation and visualize it.
3. Add one uniform and visualize its value.
4. Add one texture sample and output it directly.
5. Restore the core math without lighting.
6. Add lighting, shadows, or post-processing last.

For procedural math, replace intermediate values with visible encodings. For example, map a normalized scalar to grayscale:

```glsl
float debugValue = clamp(myScalar, 0.0, 1.0);
gl_FragColor = vec4(vec3(debugValue), 1.0);
```

This pattern is especially useful for noise, signed distance fields, masks, and raymarching step counts.

### Pattern 5 — Safe division and clamping

Shader math often fails visually when inputs approach invalid values. Guard denominators and clamp inputs before using functions with restricted domains.

```glsl
float safeDivide(float numerator, float denominator) {
    float signValue = denominator < 0.0 ? -1.0 : 1.0;
    float safeDenominator = signValue * max(abs(denominator), 0.0001);
    return numerator / safeDenominator;
}

float safeAcos(float x) {
    return acos(clamp(x, -1.0, 1.0));
}
```

Choose epsilon values based on the scale and precision of the calculation. These helpers prevent some numerical failures but do not make an ill-conditioned algorithm correct; debug the input range as well.

### Pattern 6 — Track raymarching cost

For a raymarching shader, output the number of iterations or a normalized step count rather than the final shaded color. This reveals whether the loop budget is too high, the distance estimator is inefficient, or some screen regions are unusually expensive.

```glsl
float march(vec3 ro, vec3 rd, out float stepsUsed) {
    float travel = 0.0;
    stepsUsed = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        float d = sceneSDF(ro + rd * travel);
        stepsUsed = float(i + 1);

        if (d < SURF_DIST) return travel;
        travel += d;

        if (travel > MAX_DIST) break;
    }

    return -1.0;
}
```

Map `stepsUsed / float(MAX_STEPS)` to a debug color. Keep the maximum loop bound fixed for broad GLSL ES compatibility. Use the result to tune the distance estimator and scene bounds before adding expensive shadows or ambient occlusion.

## Advanced Patterns

### Use `onBeforeCompile` diagnostics selectively

When modifying built-in Three.js materials, `onBeforeCompile` can inject shader changes. Debugging becomes harder if the final shader differs substantially from the source material, so keep the patch small and inspect the compiled source when possible. Record the Three.js version and the injection points relied on; built-in shader chunks can change between releases.

For a fully custom `ShaderMaterial`, keep the source explicit instead of layering unnecessary string replacements onto it. A small, readable shader contract is easier to debug than a chain of fragile replacements.

### Distinguish GPU cost from JavaScript cost

A low frame rate does not automatically mean the GLSL is slow. Separate the likely causes:

- **CPU or JavaScript:** too many objects, excessive allocations, repeated material creation, expensive event handlers, or heavy application logic.
- **GPU fragment cost:** expensive per-pixel loops, many texture reads, raymarching, large screen-space effects, or high device pixel ratio.
- **GPU vertex cost:** very dense geometry or expensive vertex calculations.
- **Synchronization or upload cost:** frequent texture changes, readbacks, or resource updates.

Profile with browser developer tools and renderer statistics where appropriate. Reduce one variable at a time—such as pixel ratio, render-target resolution, or number of shader iterations—and compare results on the same device and scene.

### Use reduced-resolution rendering for expensive effects

Some fullscreen effects are visually acceptable at a lower resolution. Render the effect into a smaller `WebGLRenderTarget`, then upscale it. This can reduce fragment work significantly, but it may soften edges or introduce aliasing. Use appropriate filtering and consider a small amount of edge-aware treatment only if needed.

Keep the render-target dimensions synchronized with the canvas and dispose of targets when no longer needed. Do not render at a reduced size blindly: measure the performance gain and inspect the visual quality at the actual display size.

### Add diagnostic modes without polluting production code

A debug uniform can select between the final image and a visualization:

```glsl
uniform int uDebugMode;

void main() {
    if (uDebugMode == 1) {
        // Replace with the coordinate, normal, or iteration view under test.
        gl_FragColor = vec4(vec3(gl_FragCoord.x / 1000.0), 1.0);
        return;
    }

    // Normal production shading follows.
    gl_FragColor = vec4(0.05, 0.08, 0.12, 1.0);
}
```

Keep diagnostic values meaningful and normalized. For production builds, either retain a useful debug switch or remove unused branches after testing. Do not leave arbitrary scaling constants in the final debug view; derive them from a uniform when the target resolution varies.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Changing many shader expressions at once | The cause of the fix or regression becomes unclear | Change one variable or stage at a time |
| Ignoring the first compiler error | Later errors may be cascading symptoms | Fix the earliest meaningful diagnostic first |
| Assuming a black screen means the GLSL math is wrong | Camera, geometry, material, or render-loop setup may be broken | Test with a constant-color diagnostic material |
| Mixing GLSL 1 and GLSL 3 syntax | Entry points, outputs, and texture functions differ | Choose one version and use matching conventions |
| Using CSS dimensions for `gl_FragCoord` math | Pixel coordinates may use drawing-buffer dimensions | Synchronize from the actual buffer or render target |
| Updating a different material instance | The visible shader never receives the new uniform | Confirm the rendered mesh references the updated material |
| Recreating materials every frame | Causes allocation overhead and resource churn | Update existing uniform values |
| Treating every texture as sRGB | Numerical data gets transformed incorrectly | Set color space based on texture content |
| Using arbitrary tiny epsilons | Precision errors or unstable comparisons remain | Choose scale-aware tolerances and test target devices |
| Optimizing before measuring | May increase complexity without improving performance | Profile and change one cost factor at a time |
| Leaving global event listeners after unmount | Repeated mounts can leak listeners | Remove listeners and dispose owned resources |
| Keeping debug calculations in every production path | Can add overhead and complicate maintenance | Gate diagnostic work or remove it after validation |

## Performance and Production Checklist

- [ ] Confirm the shader compiles and links before investigating its visual output.
- [ ] Test a constant-color fragment shader on the same geometry and camera.
- [ ] Check browser console and shader compiler logs for the earliest meaningful error.
- [ ] Verify GLSL version, output declarations, varying names, and texture function syntax.
- [ ] Visualize UVs, fragment coordinates, normals, or intermediate scalar values.
- [ ] Confirm every uniform name, type, unit, and update path.
- [ ] Use drawing-buffer or render-target dimensions for pixel-coordinate calculations.
- [ ] Check texture binding, orientation, wrapping, filtering, and color space.
- [ ] Guard divisions and function inputs that can become invalid.
- [ ] Test on high-DPI and lower-capability devices.
- [ ] Measure GPU cost separately from JavaScript and scene-management cost.
- [ ] Reduce pixel ratio or render-target resolution only after measuring the trade-off.
- [ ] Avoid allocating materials, vectors, arrays, or textures in the frame loop unnecessarily.
- [ ] Remove diagnostic listeners and dispose of resources owned by the effect.
- [ ] Retest the final build in every target browser after changing shader versions or material setup.

## Mental Models

1. **Reduce before repairing:** Make the smallest version render before debugging the full effect.
2. **Find the failure boundary:** Compilation, pipeline setup, coordinate mapping, uniform updates, texture sampling, and shader math are different classes of problems.
3. **Visualize invisible values:** Render UVs, normals, distances, and iteration counts as colors to inspect intermediate state.
4. **A coordinate has a space and a unit:** UVs, fragment pixels, view coordinates, and world coordinates cannot be substituted casually.
5. **Uniforms are a contract:** Names, types, units, and update timing must agree between JavaScript and GLSL.
6. **Measure before optimizing:** Lower the resolution or iteration count in a controlled test to determine whether the GPU workload is the bottleneck.
7. **Debugging is part of shader design:** A shader is easier to maintain when it can expose useful intermediate values and has a known-good baseline.

## Quick Reference

| Symptom | First check |
|---|---|
| Shader compilation failure | First compiler error, declarations, types, GLSL version |
| Black screen | Constant-color material, camera, geometry, render loop |
| Flat or frozen animation | Uniform update loop and material instance |
| Stretched procedural pattern | Aspect ratio and resolution units |
| Flipped or distorted texture | UV range, orientation, wrapping, color space |
| Flickering edges | Precision, epsilon, depth, unstable math |
| Raymarching artifacts | Distance estimator, hit threshold, max steps, normal epsilon |
| Poor frame rate | Pixel ratio, fragment loop cost, texture reads, CPU/GPU profiling |
| Works on desktop only | Precision assumptions, GLSL features, GPU cost, target-browser support |
| Errors after unmount/remount | Event listeners and resource cleanup |

## Build Challenge

### Project: Shader Diagnostics Workbench

Build a small Three.js page that lets you switch between a constant-color baseline, coordinate visualization, uniform heartbeat, texture preview, and the final procedural shader.

**Requirements**

1. Provide a reliable constant-color diagnostic mode.
2. Add a coordinate view for either `vUv` or `gl_FragCoord`.
3. Add a time-uniform view that proves animation updates correctly.
4. Add a texture preview mode if the shader uses textures.
5. For raymarching shaders, include an iteration-count visualization.
6. Display useful shader compile diagnostics in development.
7. Keep GLSL version and syntax consistent.
8. Synchronize resolution uniforms with the actual drawing buffer or render target.
9. Include a performance test that compares at least two pixel ratios or render resolutions.
10. Remove event listeners and dispose of resources owned by the workbench when it is destroyed.

**Success criteria**

- Each diagnostic mode isolates a specific stage of the shader pipeline.
- A broken uniform or coordinate mapping can be identified without rewriting the full shader.
- Compile errors are surfaced with enough context to investigate.
- Performance comparisons use the same scene and device conditions.
- The final shader works at multiple viewport sizes and on the intended target devices.
