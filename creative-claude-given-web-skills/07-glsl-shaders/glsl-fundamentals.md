# SKILL: glsl-fundamentals
**Layer:** 07 — GLSL Shaders
**Goal:** Build, debug, and integrate reliable GLSL shaders by understanding the GPU rendering pipeline, shader stages, data types, coordinate spaces, uniforms, attributes, and precision/performance trade-offs.

---

## Why This Matters (Senior Perspective)

A shader can be mathematically valid and still render incorrectly because its coordinate space, precision, interpolation, or data contract does not match the rest of the rendering pipeline. Without a solid mental model, developers tend to copy shader snippets until something looks right, then discover that the effect breaks when the camera moves, the canvas resizes, the material is reused, or the scene runs on a mobile GPU. These are not exotic edge cases: they are routine production problems in Three.js experiences.

Senior creative developers treat a shader as a small GPU program with an explicit input/output contract. They know which values are per-vertex, which are per-fragment, which values should be uniforms, and which calculations can be shared or moved to the CPU. They build the simplest shader that produces the intended visual result, validate it in isolation, and only then layer on noise, lighting, distortion, or post-processing. That discipline is what separates an interactive portfolio that feels polished from one that looks impressive only on the developer's machine.

For freelance and portfolio work, GLSL fundamentals unlock custom hero backgrounds, animated gradients, procedural surfaces, image transitions, product reveals, and branded visual systems that cannot be achieved cleanly with stock CSS alone. The commercial consequence of weak fundamentals is wasted debugging time, fragile demos, and effects that tank frame rate on real devices. The goal is not to memorize every GLSL function; it is to understand the data moving through the GPU and make deliberate rendering decisions.

---

## Core Concepts

### 1. The GPU Rendering Pipeline

The GPU processes geometry through stages. A vertex shader runs for each vertex and usually transforms its position. The rasterizer turns triangles into fragments, and the fragment shader computes the output color for each covered fragment. The fragment shader does not run once per triangle; a full-screen effect may execute millions of times per frame.

Mental model: the vertex shader prepares geometry; the fragment shader paints the pixels produced by that geometry. Expensive work in a fragment shader can be multiplied by the number of screen pixels, so complexity matters.

A conceptual pipeline:

```text
CPU / JavaScript
  ├─ uploads geometry, textures, uniforms
  └─ issues draw call
       ↓
Vertex shader (per vertex)
       ↓
Primitive assembly + clipping
       ↓
Rasterization + interpolation
       ↓
Fragment shader (per covered fragment)
       ↓
Depth / blending / framebuffer
```

A minimal WebGL 2 shader pair:

```glsl
// vertex.glsl
#version 300 es
in vec3 position;

void main() {
    // Clip-space coordinates determine where this vertex appears on screen.
    gl_Position = vec4(position, 1.0);
}
```

```glsl
// fragment.glsl
#version 300 es
precision highp float;
out vec4 fragmentColor;

void main() {
    // A constant output is useful for proving the pipeline works before adding complexity.
    fragmentColor = vec4(0.08, 0.72, 0.62, 1.0);
}
```

The pair above assumes geometry already uses clip-space coordinates. A Three.js mesh normally supplies model-space positions and uses camera matrices, so a production vertex shader must transform them rather than passing them straight through.

### 2. GLSL Types and Constructors

GLSL has scalar types such as `float`, `int`, `uint`, and `bool`, plus vector types (`vec2`, `vec3`, `vec4`) and matrix types (`mat2`, `mat3`, `mat4`). Constructors make conversions and composition explicit. Unlike JavaScript, GLSL does not silently treat every number as interchangeable with every other type.

Use vectors to keep related values together. A `vec3` is commonly used for positions, directions, and RGB colors; a `vec4` often represents homogeneous positions or RGBA colors.

```glsl
precision highp float;

void main() {
    float roughness = 0.42;
    vec2 uv = vec2(0.25, 0.75);
    vec3 accentColor = vec3(0.10, 0.62, 0.90);
    vec4 surfaceColor = vec4(accentColor, 1.0);

    // Vector arithmetic operates component-wise, which is useful for color and UV math.
    vec3 brighterColor = surfaceColor.rgb * 1.15;
}
```

Naive code can fail because the types do not match:

```glsl
// Wrong: vec3 and float are different types; intent is ambiguous to the compiler.
// vec3 color = 1.0;

// Right: explicitly broadcast the scalar to all three color channels.
vec3 color = vec3(1.0);
```

Constructor forms worth recognizing:

```glsl
vec2 uv = vec2(0.5, 0.25);
vec3 rgb = vec3(uv, 0.8);
vec4 rgba = vec4(rgb, 1.0);
mat2 rotationBasis = mat2(0.0, -1.0, 1.0, 0.0);
```

Gotcha: matrix constructors are column-major. A matrix written as a list of values may not look like a row-by-row table. Test transforms with known basis vectors rather than relying on visual intuition.

### 3. Attributes, Varyings, and Uniforms

Shader data has different update frequencies. Attributes are attached to vertices, uniforms are shared by a draw call, and varyings carry values from the vertex shader to the fragment shader through interpolation.

- **Attribute / `in`:** different values for different vertices, such as position, normal, UV, or custom per-vertex data.
- **Uniform:** one value shared across a draw call, such as elapsed time, a tint, or a texture.
- **Varying / vertex output:** a value computed at vertices and interpolated across the triangle for fragment shading.

This frequency distinction is a design tool. A time value should not be stored as a per-vertex attribute. A unique color baked into every vertex should not be uploaded as a single uniform.

```glsl
// vertex.glsl — WebGL 2 syntax
#version 300 es
in vec3 position;
in vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;

void main() {
    // Pass UVs to the fragment stage; interpolation gives each fragment a local UV.
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// fragment.glsl — WebGL 2 syntax
#version 300 es
precision highp float;

in vec2 vUv;
uniform float uTime;
uniform vec3 uAccent;
out vec4 fragmentColor;

void main() {
    // Time is uniform because all fragments in this draw call share the same clock.
    float pulse = 0.5 + 0.5 * sin(uTime + vUv.x * 6.28318);
    vec3 color = mix(vec3(0.02, 0.03, 0.08), uAccent, pulse);
    fragmentColor = vec4(color, 1.0);
}
```

The `#version 300 es` syntax is shown for clarity. Three.js `ShaderMaterial` typically supplies built-in attributes and uniforms for the chosen material configuration; `RawShaderMaterial` gives more direct control and requires you to provide more of the shader interface yourself. Do not paste WebGL 2 syntax into a WebGL 1 context without adapting `in`/`out`, texture functions, and fragment output declarations.

### 4. Coordinate Spaces

Many shader bugs are coordinate-space bugs. A point can be expressed in model/local space, world space, view/camera space, clip space, normalized device coordinates, or UV space. Each space answers a different question.

- **Local/model space:** relative to an object's origin.
- **World space:** relative to the scene.
- **View space:** relative to the camera.
- **Clip space:** homogeneous coordinates used for clipping and perspective division.
- **NDC:** post-divide coordinates, usually spanning `-1` to `1` on visible axes.
- **UV space:** texture coordinates, typically spanning `0` to `1`.

For an ordinary Three.js mesh, the usual position transform is:

```glsl
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

The multiplication order matters. GLSL matrix/vector multiplication is not commutative, and Three.js expects this conventional order for its matrices.

Wrong/right comparison:

```glsl
// Wrong for a standard Three.js mesh: ignores object and camera transforms.
// gl_Position = vec4(position, 1.0);

// Right: moves local-space vertices through view space into clip space.
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

A UV coordinate is not a world position. Use UVs for image mapping and screen-like patterns; use world-space positions for effects that should remain anchored in the environment as objects move. If an effect should follow the object's surface, local coordinates can be more stable than world coordinates.

### 5. Interpolation and Fragment Inputs

Varying values are generally interpolated across the triangle. If three vertices have different UVs, the GPU calculates a UV for each fragment covered by that triangle. This is why a texture can map smoothly across a mesh without JavaScript computing a value for every pixel.

Interpolation is not always a simple average in screen space: perspective-correct interpolation is applied by default for ordinary varyings. That is important for textures on perspective-projected geometry.

```glsl
// vertex.glsl
out vec2 vUv;

void main() {
    // The rasterizer interpolates this value between vertices for each fragment.
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

```glsl
// fragment.glsl
in vec2 vUv;
uniform sampler2D uTexture;
out vec4 fragmentColor;

void main() {
    // Each fragment receives the interpolated UV at its location on the surface.
    fragmentColor = texture(uTexture, vUv);
}
```

Gotcha: interpolation can smear data that is meant to be categorical, such as an integer material ID. For such values, use appropriate flat interpolation where supported (`flat` qualifiers in GLSL ES 3.00) or encode the data differently. Do not expect a triangle's three different IDs to remain discrete under smooth interpolation.

### 6. Uniform Updates and Time

Uniforms are the bridge between the JavaScript animation loop and the shader. A common pattern is to create a uniform once and update its value each frame. Do not rebuild the material every frame; doing so can trigger avoidable allocations, shader recompilation, and GPU resource churn.

Three.js example using `ShaderMaterial`:

```js
import * as THREE from 'three';

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAccent: { value: new THREE.Color('#49d6c8') }
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      // UVs are passed once per vertex and interpolated by the GPU.
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uAccent;
    varying vec2 vUv;

    void main() {
      // A low-cost animated pulse makes the material visibly respond to time.
      float pulse = 0.5 + 0.5 * sin(uTime * 1.2 + vUv.x * 6.28318);
      vec3 color = mix(vec3(0.015, 0.025, 0.07), uAccent, pulse);
      gl_FragColor = vec4(color, 1.0);
    }
  `
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Update the existing uniform; keep the compiled material stable.
  material.uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();
```

This snippet assumes `renderer`, `scene`, `camera`, and a mesh using `material` have already been created. It uses Three.js's common `ShaderMaterial` GLSL 1-style interface. Do not mix it with a `#version 300 es` shader without adapting the material and shader syntax.

Prefer elapsed time for continuous animation, not frame count. A frame counter advances at different speeds on 30 Hz and 120 Hz displays. For pause/resume or very long-running experiences, consider whether elapsed time should be absolute, accumulated, or reset when the page becomes hidden.

### 7. Precision and Mobile GPUs

GLSL ES supports precision qualifiers such as `lowp`, `mediump`, and `highp`. Precision affects numerical range and accuracy, and availability differs by shader stage and hardware. Fragment `highp` is supported on modern devices, but older WebGL 1 hardware may have limitations. Use a precision declaration that matches the required math and your compatibility target.

```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
```

Use lower precision only when it is safe and measured. It may reduce cost on some hardware, but a premature downgrade can cause banding, unstable noise, or visible coordinate artifacts.

For example, high-frequency procedural noise or calculations that subtract two large nearby values can be sensitive to precision. A simple flat tint may not need the same precision budget as a world-space displacement effect.

### 8. Shader Compilation and Debugging

Shader compilers are strict, and errors often surface only when the material is first rendered. A blank object is not enough information to diagnose the cause. Separate syntax errors, missing uniforms, incorrect coordinate transforms, invalid UVs, and accidental transparent output.

Debug with the simplest output possible, then add one feature at a time:

```glsl
// Debug step 1: prove the fragment shader executes.
gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
```

```glsl
// Debug step 2: prove UVs arrive and vary over the surface.
gl_FragColor = vec4(vUv, 0.0, 1.0);
```

```glsl
// Debug step 3: prove the sampled texture and UV orientation are correct.
gl_FragColor = texture2D(uTexture, vUv);
```

In a WebGL 2 shader, replace `gl_FragColor` with a declared output and `texture2D` with `texture`. The snippets above use the `ShaderMaterial` GLSL 1-style interface.

A reliable debugging sequence:
1. Render a constant color.
2. Visualize UVs.
3. Visualize normals or positions if the effect uses them.
4. Add one uniform and confirm it changes.
5. Add the formula in small steps.
6. Inspect browser console messages and the WebGL shader compile/link logs.
7. Test on a second device or GPU before declaring the effect production-ready.

### 9. Color Spaces and Output

Color is data, but displayed color depends on the renderer's color-management pipeline. A color sampled from a texture may be encoded in sRGB, while shader calculations often need linear-light values. Three.js manages many color-space conversions for built-in materials and textures, but custom shader output must be understood in the context of the renderer and material configuration.

Do not assume that writing a hex color's normalized RGB channels always produces the same apparent result as a CSS hex color. A linear/sRGB mismatch can make colors look washed out or unexpectedly dark.

Practical rules:
- Use `THREE.Color` for JavaScript color uniforms instead of manually splitting hex values without understanding the conversion.
- Mark color textures with the appropriate `texture.colorSpace` value in Three.js.
- Know whether the custom shader is expected to output linear values or encoded display values in your chosen Three.js version and material path.
- Avoid applying an extra sRGB conversion if Three.js already performs it for the material/output path.

Color management APIs have evolved across Three.js releases. Confirm the version-specific behavior before adding manual conversion functions.

### 10. Performance: Work Per Vertex vs Work Per Fragment

The cost of a shader depends on the work performed and how many times it runs. A calculation in a vertex shader executes once per vertex; a calculation in a fragment shader executes for every covered fragment. However, moving work to the vertex shader can reduce visual quality when the value needs fine per-pixel detail.

A useful decision process:
- Is the value naturally attached to a vertex? Compute it in the vertex stage.
- Does it need crisp per-pixel detail, texture sampling, or screen-space accuracy? It likely belongs in the fragment stage.
- Can a constant be calculated on the CPU and passed as a uniform? Do that if it reduces repeated GPU work without causing excessive CPU overhead.
- Is the mesh extremely dense? Vertex work may no longer be cheap.
- Does the effect cover the entire screen? Fragment complexity can dominate.

Naive pattern:

```glsl
// Naive: repeated expensive calculations in every fragment, even though the value is constant.
float pulse = sin(uTime * 1.7);
```

For a single `sin` call, the cost is usually trivial. But the principle matters for expensive functions and repeated expressions. If the value is constant for the draw call, calculate it on the CPU and pass it as a uniform when that is measurably beneficial:

```js
// Compute shared values once per frame instead of repeating more elaborate CPU-independent setup.
material.uniforms.uPulse.value = Math.sin(elapsedSeconds * 1.7);
```

Do not optimize by instinct alone. Profile frame time, GPU load, overdraw, resolution, and device behavior. One `sin` is rarely the bottleneck; dozens of texture samples and layered noise over a full-screen quad often are.

---

## Reusable GLSL Patterns

### Pattern 1: UV Diagnostic Material

**What it does:** Converts UV coordinates into visible colors so you can inspect mapping, orientation, and texture seams.

**When to use it:** While creating custom materials, debugging imported models, or checking a client's product mesh before building a sophisticated shader.

```js
import * as THREE from 'three';

const uvDiagnosticMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    varying vec2 vUv;

    void main() {
      // Preserve the mesh's existing UV layout for direct inspection.
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;

    void main() {
      // Red and green channels reveal horizontal and vertical UV coordinates.
      gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
    }
  `
});

// Apply to a mesh with UVs to inspect whether the mapping matches expectations.
const diagnosticMesh = new THREE.Mesh(
  new THREE.SphereGeometry(1, 48, 32),
  uvDiagnosticMaterial
);
scene.add(diagnosticMesh);
```

On a sphere, the UV seam and pole distortion are expected consequences of the parameterization. The diagnostic material exposes them; it does not repair them.

### Pattern 2: Uniform-Driven Brand Tint

**What it does:** Lets JavaScript update a brand accent without recompiling the shader.

**When to use it:** Interactive portfolio hero objects, theme switching, product configurators, and client sites where colors change in response to UI controls.

```js
import * as THREE from 'three';

const brandMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uBaseColor: { value: new THREE.Color('#10172b') },
    uAccentColor: { value: new THREE.Color('#53f2d0') },
    uMixAmount: { value: 0.35 }
  },
  vertexShader: `
    varying vec3 vLocalPosition;

    void main() {
      // Local position keeps the gradient attached to the object as it moves.
      vLocalPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 uBaseColor;
    uniform vec3 uAccentColor;
    uniform float uMixAmount;
    varying vec3 vLocalPosition;

    void main() {
      // Normalize the object's local height into a stable gradient control.
      float heightMask = smoothstep(-0.7, 0.7, vLocalPosition.y);
      vec3 gradientColor = mix(uBaseColor, uAccentColor, heightMask);
      vec3 finalColor = mix(uBaseColor, gradientColor, clamp(uMixAmount, 0.0, 1.0));
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
});

// Later, update the existing uniform in response to a UI event.
brandMaterial.uniforms.uAccentColor.value.set('#ff8c66');
```

This gradient depends on the geometry's local coordinate range. For objects with different scales or origins, expose bounds as uniforms or normalize the position in a deliberate coordinate space.

### Pattern 3: Time-Based Animated Gradient

**What it does:** Creates a lightweight, continuously animated surface color using UVs and time.

**When to use it:** Atmospheric hero objects, abstract backgrounds, loading visuals, and branded visual accents that need motion without a texture asset.

```js
import * as THREE from 'three';

const animatedGradientMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color('#070b20') },
    uColorB: { value: new THREE.Color('#6c4dff') },
    uColorC: { value: new THREE.Color('#36e4c5') }
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      // UV interpolation gives every fragment a stable location on the surface.
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    uniform vec3 uColorC;
    varying vec2 vUv;

    void main() {
      // A small time offset animates the gradient without moving the mesh vertices.
      float wave = 0.5 + 0.5 * sin(vUv.x * 5.0 + uTime * 0.35);
      float heightMask = smoothstep(0.0, 1.0, vUv.y);
      vec3 lowerGradient = mix(uColorA, uColorB, wave);
      vec3 finalColor = mix(lowerGradient, uColorC, heightMask * 0.65);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
});

const gradientClock = new THREE.Clock();

function animateGradient() {
  requestAnimationFrame(animateGradient);
  animatedGradientMaterial.uniforms.uTime.value = gradientClock.getElapsedTime();
  renderer.render(scene, camera);
}
```

Use one animation loop for the entire scene in a real project; do not create a separate `requestAnimationFrame` loop for every material. The snippet isolates the uniform update pattern.

### Pattern 4: Safe Shader Development Switch

**What it does:** Lets a project toggle between a diagnostic material and a production material without changing geometry or rebuilding the scene.

**When to use it:** While developing shader-heavy portfolio scenes, and when a client needs a reliable fallback for debugging or lower-capability devices.

```js
const diagnosticMode = new URLSearchParams(window.location.search).has('shaderDebug');

const displayMesh = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1, 4),
  diagnosticMode ? uvDiagnosticMaterial : brandMaterial
);

// A query flag makes debugging repeatable without adding a permanent UI control.
scene.add(displayMesh);
```

For production, do not expose sensitive debug information. A public diagnostic toggle is usually harmless for visual output, but debug modes should not reveal private app state or internal data.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| Passing local positions directly to `gl_Position` | The coordinate-space pipeline is misunderstood | Apply the model-view and projection transforms for standard Three.js geometry |
| Using a uniform for per-vertex data | Uniforms seem simpler to wire up | Use attributes for data that varies per vertex, then pass needed values through varyings |
| Recreating a material every frame | Updating a uniform is confused with changing shader source | Create the material once and update `.uniforms.name.value` |
| Mixing GLSL 1 and GLSL ES 3.00 syntax | Snippets from different examples are combined | Keep version directives, qualifiers, texture calls, and fragment outputs consistent |
| Ignoring UVs on imported models | Geometry is assumed to have a valid texture layout | Inspect UVs with a diagnostic material and verify the asset pipeline |
| Using `mediump` for precision-sensitive noise | Mobile optimization is applied without testing | Start with adequate precision, then test and profile lower precision |
| Assuming a constant color will match CSS exactly | Color-space handling is overlooked | Follow the Three.js color-management path and avoid double conversion |
| Doing expensive work in a full-screen fragment shader | Pixel count is underestimated | Reduce texture samples, noise octaves, overdraw, or render resolution where appropriate |
| Treating shader compilation failures as visual bugs | Compiler output is ignored | Read compile/link logs and reduce the shader to a constant-color output |
| Animating with frame count | Development hardware hides timing dependence | Pass elapsed time or delta time from the JavaScript loop |
| Forgetting transparent-material settings | Alpha output is assumed to enable transparency automatically | Configure `transparent`, blending, and depth behavior intentionally |
| Reusing one shader on incompatible geometry | Required UVs, normals, or attributes are absent | Document material inputs and validate geometry before applying the material |

### Wrong → Right: Stable uniform updates

```js
// Wrong: rebuilding the material repeatedly creates unnecessary GPU and CPU work.
function updateSceneBad(elapsedSeconds) {
  mesh.material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: elapsedSeconds } },
    vertexShader,
    fragmentShader
  });
}

// Right: preserve the compiled material and update only the changing value.
function updateSceneGood(elapsedSeconds) {
  mesh.material.uniforms.uTime.value = elapsedSeconds;
}
```

### Wrong → Right: Consistent shader syntax

```glsl
// Wrong: this combines WebGL 2 declarations with a WebGL 1 output convention.
// #version 300 es
// out vec4 fragmentColor;
// void main() { gl_FragColor = vec4(1.0); }

// Right for GLSL ES 3.00: declare and write to the output variable.
#version 300 es
precision highp float;
out vec4 fragmentColor;

void main() {
    fragmentColor = vec4(1.0);
}
```

---

## Mental Models

1. **Vertex = geometry, fragment = pixels** — choose the shader stage based on where the data is naturally needed.
2. **Attributes vary, uniforms are shared** — data frequency should determine how it enters the shader.
3. **Every value lives in a coordinate space** — identify that space before comparing or combining positions.
4. **Varyings are interpolated data** — the fragment stage receives values derived from the vertices, not a direct JavaScript callback per pixel.
5. **Uniform updates are not shader recompiles** — keep material programs stable and change their inputs.
6. **Pixel cost multiplies quickly** — expensive fragment work becomes costly when applied across large screen areas.
7. **Debug from constant color outward** — validate the pipeline before adding math, textures, and animation.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|-------------------|-------------|-------|
| Vertex input | `in vec3 position` | GLSL ES 3.00 syntax; GLSL 1 commonly uses `attribute` |
| Fragment input | `in vec2 vUv` | Must match a vertex-stage output |
| Shared changing value | `uniform float uTime` | Update from JavaScript each frame |
| UV coordinates | `vec2` in the `0.0–1.0` range | Range can differ when wrapping or custom mapping is used |
| RGB color | `vec3` | RGBA output normally uses `vec4` |
| Homogeneous position | `vec4(position, 1.0)` | `w = 1` represents a point in common transform conventions |
| Standard Three.js transform | `projectionMatrix * modelViewMatrix * vec4(position, 1.0)` | Standard `ShaderMaterial` built-in matrices |
| Texture sample, GLSL 1 style | `texture2D(uTexture, vUv)` | Common in Three.js ShaderMaterial GLSL 1 examples |
| Texture sample, GLSL ES 3.00 | `texture(uTexture, vUv)` | Use with matching GLSL version |
| Fragment output, GLSL 1 style | `gl_FragColor = vec4(...)` | Not valid in GLSL ES 3.00 |
| Fragment output, GLSL ES 3.00 | `out vec4 fragmentColor;` | Write to declared output |
| High precision | `precision highp float;` | Use appropriate precision and compatibility checks |
| Time source | `THREE.Clock` or app-managed elapsed time | Avoid frame-count animation |
| UV diagnostic | `vec4(vUv, 0.0, 1.0)` | Reveals mapping and orientation |
| First debug output | Constant magenta or another obvious color | Confirms the fragment stage is executing |
| Shared shader data | Uniform | Avoid duplicating constants as per-vertex attributes |
| Per-vertex shader data | Attribute | Geometry must supply the attribute |
| Smooth surface data | Varying | Rasterizer interpolates it across primitives |
| Performance investigation | Profile first | Fragment complexity, resolution, overdraw, and texture bandwidth often matter |

---

## Build Challenge

### Build a Shader Debug Playground for a Creative Portfolio

Create a small Three.js page that displays a rotating 3D object and lets you inspect the shader pipeline before switching to a polished animated gradient.

#### Requirements

1. Create a Three.js scene with a perspective camera, renderer, and an icosphere or sphere geometry.
2. Add a diagnostic shader that outputs UV coordinates as red and green channels.
3. Add a production shader with two configurable brand colors and a `uTime` uniform.
4. Animate the production shader through one `requestAnimationFrame` loop, updating the existing material uniform rather than rebuilding the material.
5. Add a simple UI toggle to switch between UV diagnostics and the animated gradient.
6. Add a color input or button that changes the accent color through a uniform update.
7. Handle canvas resizing by updating renderer dimensions and the camera projection matrix.
8. Include a visible debug label showing which shader mode is active.
9. Test the page at desktop and mobile widths; inspect whether the UV layout and effect remain readable.
10. Verify the browser console and shader compilation logs are clean.

#### Expected Output / Success Criteria

- The 3D object renders with correct camera and model transforms.
- UV mode shows a smooth red/green gradient and makes the UV layout visible.
- Production mode displays a time-animated gradient with user-controlled colors.
- Switching modes does not recreate the scene or start extra animation loops.
- Resizing does not stretch the canvas or break the camera framing.
- The effect remains usable on a mobile viewport, and the code clearly separates shader inputs from shader logic.

**Stretch goal:** Add a query-string debug flag such as `?shaderDebug=1` that opens the page in UV diagnostic mode. Keep the fallback and diagnostic behavior intentional rather than hiding failures behind a black screen.
