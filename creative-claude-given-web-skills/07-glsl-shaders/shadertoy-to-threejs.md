# SKILL: shadertoy-to-threejs

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Convert Shadertoy fragment shaders into maintainable, responsive Three.js `ShaderMaterial` implementations by mapping Shadertoy inputs, entry points, coordinates, textures, and timing to Three.js uniforms and render-loop conventions.

## Why This Matters (Senior Perspective)

Shadertoy is an excellent place to discover shader techniques, but a shader copied from a sandbox rarely works unchanged in an application. Shadertoy supplies a runtime contract: `mainImage`, `fragCoord`, `iResolution`, `iTime`, `iMouse`, and channel textures are provided by the platform. Three.js does not automatically provide that contract to a custom `ShaderMaterial`. The conversion task is therefore not merely syntax replacement; it is adapting the shader to a different host environment.

A robust conversion keeps the original visual algorithm intact while making its dependencies explicit. Separate the fragment shader's math from application inputs, define uniform types deliberately, use the correct coordinate space, and update time and pointer uniforms from the render loop. This makes the effect easier to debug, resize, reuse, and eventually ship in a portfolio or production interface.

The most common failures are small integration mismatches: pixel coordinates treated as normalized UVs, a resolution uniform that never updates, a missing texture channel, a `mainImage` function with no `main` entry point, or GLSL syntax that differs between WebGL versions. Build a repeatable conversion process rather than patching each shader by trial and error.

## Core Concepts

### 1. Shadertoy's execution contract

A typical Shadertoy fragment shader receives a pixel coordinate and writes one output color:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 color = vec3(uv, 0.5);
    fragColor = vec4(color, 1.0);
}
```

The host normally supplies values such as:

- `iResolution`: render target width, height, and sometimes pixel-depth metadata.
- `iTime`: elapsed time in seconds.
- `iTimeDelta`: elapsed time since the previous frame.
- `iFrame`: frame index.
- `iMouse`: pointer position and button-state information using Shadertoy conventions.
- `iChannel0` through `iChannel3`: input textures.
- `iDate`, `iSampleRate`, and audio uniforms: specialized inputs for particular shaders.

Not every shader uses every input. Inventory the globals and helper functions before changing code. The smallest correct port is the one that supplies only the inputs the shader actually reads.

### 2. Three.js `ShaderMaterial` has a different contract

A Three.js `ShaderMaterial` uses the standard vertex/fragment shader pipeline. Three.js provides built-in attributes and uniforms appropriate to the material and renderer, but it does not automatically define Shadertoy's `mainImage` entry point or all `i*` globals.

A standard fragment shader needs a `main()` entry point. The most direct adaptation is to preserve `mainImage` and add a small wrapper that calls it:

```glsl
uniform vec3 iResolution;
uniform float iTime;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv, 0.5, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

This snippet illustrates the mapping, but the exact output syntax depends on the GLSL version. In Three.js's default GLSL 1-style `ShaderMaterial`, `gl_FragColor` is generally the conventional output. For GLSL 3, declare an explicit output variable such as `out vec4 outColor;` and write to it instead. Do not mix the two styles.

### 3. Pixel coordinates versus normalized UV coordinates

`fragCoord` in Shadertoy represents pixel coordinates, typically measured from the bottom-left of the render target. `gl_FragCoord.xy` in a WebGL fragment shader is the natural equivalent. Both are in pixel units, not the `0.0`–`1.0` UV range.

Normalize coordinates explicitly when the original shader does so:

```glsl
vec2 uv = fragCoord / iResolution.xy;
```

For effects that should not stretch with aspect ratio, center the coordinates and scale the horizontal axis:

```glsl
vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
```

This maps the vertical span to a consistent scale while preserving circular shapes. Keep the original shader's coordinate transforms when porting; changing them can alter the look even if the code compiles.

### 4. Uniforms are the bridge between JavaScript and GLSL

A uniform is a value supplied by JavaScript and read by the shader. The declaration in GLSL must match the JavaScript value type.

| GLSL type | JavaScript value |
|---|---|
| `float` | number |
| `int` / `bool` | integer / boolean-compatible value, with renderer-specific handling |
| `vec2` | `THREE.Vector2` or compatible array |
| `vec3` | `THREE.Vector3` or compatible array |
| `vec4` | `THREE.Vector4` or compatible array |
| `sampler2D` | `THREE.Texture` |

Declare each uniform in the shader and pass the corresponding object in the material's `uniforms` map. Keep the uniform object stable and mutate its value where practical, rather than recreating the entire material every frame.

### 5. Time must be advanced by the application

Shadertoy advances `iTime` automatically. In Three.js, the application must update the uniform every frame. Use `THREE.Clock` or the timestamp passed to the animation loop.

```js
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

animate();
```

Use elapsed time for periodic or continuous animation. Use frame delta for simulations that integrate motion, so behavior is less dependent on frame rate. Avoid incrementing time by a fixed amount per frame: it makes animation speed depend on the user's device.

### 6. Resolution is not always the CSS size

Shadertoy's `iResolution` describes the shader's render resolution. In a Three.js canvas, CSS dimensions and drawing-buffer dimensions can differ because of device pixel ratio and render-target scaling. If the shader uses `gl_FragCoord`, its coordinate range follows the drawing buffer.

For a full-canvas effect, synchronize the resolution uniform with the actual drawing-buffer size:

```js
const drawingBufferSize = new THREE.Vector2();

function updateResolution() {
  renderer.getDrawingBufferSize(drawingBufferSize);
  material.uniforms.iResolution.value.set(
    drawingBufferSize.x,
    drawingBufferSize.y,
    1
  );
}
```

Call this after renderer size or pixel-ratio changes. If you deliberately render at reduced resolution for performance, use that render target's size instead. The key rule is that the resolution uniform and the coordinate system must describe the same target.

### 7. Channel textures become explicit sampler uniforms

A Shadertoy shader may sample `iChannel0` through `iChannel3`. In Three.js, load or create each texture and map it to the matching uniform. Texture orientation, color space, wrapping, filtering, and mipmaps can affect the result.

```js
const texture = new THREE.TextureLoader().load("/textures/noise.png");

const material = new THREE.ShaderMaterial({
  uniforms: {
    iChannel0: { value: texture }
  },
  vertexShader,
  fragmentShader
});
```

If the original shader uses `texture(iChannel0, uv)` in GLSL 3, preserve that form. If it uses `texture2D(iChannel0, uv)` in GLSL 1, keep the GLSL 1-compatible form. Check whether the source expects a vertically flipped image or a particular wrapping mode; do not apply a flip without verifying the original sampling convention.

## Reusable Patterns

### Pattern 1 — A minimal Shadertoy-compatible fragment wrapper

This pattern keeps the original `mainImage` algorithm and supplies a standard fragment entry point. It is useful when porting procedural shaders that do not require texture channels.

**Fragment shader (GLSL 1-style `ShaderMaterial`):**

```glsl
uniform vec3 iResolution;
uniform float iTime;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // Animate a soft circular field without changing its coordinate contract.
    vec2 centered = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float pulse = 0.5 + 0.5 * sin(iTime * 2.0);
    float radius = 0.22 + 0.04 * pulse;
    float d = length(centered);
    float glow = 1.0 - smoothstep(radius - 0.08, radius, d);

    vec3 color = mix(vec3(0.02, 0.03, 0.08),
                     vec3(0.15, 0.65, 1.0), glow);
    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

**JavaScript material setup:**

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    iTime: { value: 0 }
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader
});
```

Use this with a mesh that fills the camera view, or adapt the coordinates for a 3D surface. A fullscreen shader needs a camera and geometry configured for fullscreen coverage; a normal perspective-camera mesh may not cover the viewport.

### Pattern 2 — A complete fullscreen scene with responsive resolution

This pattern creates a simple fullscreen plane in front of an orthographic camera. It is intended for a canvas-wide procedural effect, not for shading a detailed 3D model.

```js
import * as THREE from "three";

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const fragmentShader = `
  uniform vec3 iResolution;
  uniform float iTime;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;

    float wave = 0.5 + 0.5 * sin(8.0 * length(p) - iTime * 2.0);
    vec3 color = mix(vec3(0.015, 0.02, 0.06),
                     vec3(0.2, 0.55, 0.9), wave * (1.0 - uv.y * 0.45));
    fragColor = vec4(color, 1.0);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    iTime: { value: 0 }
  },
  vertexShader: `
    void main() {
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader
});

const geometry = new THREE.PlaneGeometry(2, 2);
const quad = new THREE.Mesh(geometry, material);
scene.add(quad);

const drawingBufferSize = new THREE.Vector2();

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.getDrawingBufferSize(drawingBufferSize);
  material.uniforms.iResolution.value.set(
    drawingBufferSize.x,
    drawingBufferSize.y,
    1
  );
}

window.addEventListener("resize", resize);
resize();

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  material.uniforms.iTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}

animate();
```

The vertex shader writes clip-space positions directly, so the quad covers the viewport regardless of camera matrices. The orthographic camera is retained for a conventional scene setup, although this vertex shader does not use its projection matrices. In a real application, remove the resize listener and dispose of GPU resources when the component unmounts.

### Pattern 3 — Porting `iMouse` to a Three.js pointer uniform

Shadertoy's mouse conventions include button-state behavior and may encode click origin in the sign of a component. A basic port should not silently pretend to reproduce every one of those semantics. First port the pointer position, then add click-state behavior only if the source uses it.

```js
const pointer = new THREE.Vector2(0, 0);

const material = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    iTime: { value: 0 },
    iMouse: { value: new THREE.Vector4(0, 0, 0, 0) }
  },
  vertexShader,
  fragmentShader
});

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const xCss = event.clientX - rect.left;
  const yCssFromTop = event.clientY - rect.top;

  // Convert CSS coordinates into drawing-buffer pixels.
  const scaleX = renderer.domElement.width / rect.width;
  const scaleY = renderer.domElement.height / rect.height;
  const x = xCss * scaleX;
  const y = renderer.domElement.height - yCssFromTop * scaleY;

  material.uniforms.iMouse.value.x = x;
  material.uniforms.iMouse.value.y = y;
}

renderer.domElement.addEventListener("pointermove", onPointerMove);
```

Declare `uniform vec4 iMouse;` in the shader. The sample maps pointer position to bottom-left-origin drawing-buffer coordinates. If the source uses click origin or button-state values, store pointer-down state separately and encode the expected values according to that shader's actual assumptions.

### Pattern 4 — Mapping an image channel

A channel uniform must be declared in GLSL and assigned a `THREE.Texture` on the JavaScript side. This example is a GLSL 1-style shader:

```js
const loader = new THREE.TextureLoader();
const channel0 = await loader.loadAsync("/textures/portrait.jpg");

channel0.colorSpace = THREE.SRGBColorSpace;

const fragmentShader = `
  uniform vec3 iResolution;
  uniform float iTime;
  uniform sampler2D iChannel0;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    // The simple mapping stretches the texture to the viewport.
    // Preserve aspect ratio separately if the source requires it.
    vec4 imageColor = texture2D(iChannel0, uv);
    fragColor = vec4(imageColor.rgb, 1.0);
  }

  void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    iTime: { value: 0 },
    iChannel0: { value: channel0 }
  },
  vertexShader,
  fragmentShader
});
```

Texture loading is asynchronous. Create the material after the texture is available if the first frame must contain the image, or render a fallback until loading finishes. For color images, use the appropriate texture color space; data textures such as normal maps, masks, and noise generally should not be marked as sRGB color data.

### Pattern 5 — GLSL 3 output adaptation

Some shader ports need GLSL 3 features. In that case, configure the material for GLSL 3 and use explicit fragment outputs rather than `gl_FragColor`.

```js
const fragmentShaderGLSL3 = `
  uniform vec3 iResolution;
  uniform float iTime;

  out vec4 outColor;

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv.x, uv.y, 0.5 + 0.5 * sin(iTime), 1.0);
  }

  void main() {
    mainImage(outColor, gl_FragCoord.xy);
  }
`;

const material = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    iResolution: { value: new THREE.Vector3(1, 1, 1) },
    iTime: { value: 0 }
  },
  vertexShader: vertexShaderGLSL3,
  fragmentShader: fragmentShaderGLSL3
});
```

For GLSL 3, the matching vertex shader must also be written with the correct attribute conventions for the chosen Three.js version and material configuration. Avoid copying `#version 300 es` into the shader source when `glslVersion` is responsible for setting the version directive; follow the version's documented material conventions.

## Advanced Patterns

### Preserve a shader's aspect-ratio logic

Many Shadertoy examples normalize to `iResolution.xy`, then correct the aspect ratio in a later step. Do not replace all coordinates with UVs just because Three.js meshes have UV attributes. A port may use either:

- `gl_FragCoord.xy` for pixel-oriented algorithms.
- `vUv` for texture- or surface-oriented algorithms.
- A custom coordinate transform when matching the original effect is more important than using built-in UVs.

A fullscreen `ShaderMaterial` can use `gl_FragCoord` to match Shadertoy closely. A shader applied to a model usually uses interpolated mesh UVs or model/world-space positions, which changes the meaning of the original math. Choose the coordinate system intentionally.

### Reproduce texture-channel settings

For each `iChannelN`, inspect how the source expects the texture to behave:

- **Wrapping:** repeat, clamp, or mirrored repeat.
- **Filtering:** nearest or linear filtering.
- **Mipmaps:** relevant for minification and texture stability.
- **Color space:** color textures and numerical data textures need different handling.
- **Orientation:** the source may assume a particular origin convention.
- **Resolution:** shaders that query channel dimensions need an additional resolution uniform or a deliberate replacement.

Shadertoy also supports keyboard, audio, video, cubemap, and buffer inputs. These are not automatically equivalent to ordinary `sampler2D` uniforms. Port each input type as an explicit application feature rather than assigning an unrelated texture and hoping the shader works.

### Separate shader logic from application glue

For repeated use, keep three concerns separate:

1. **Shader algorithm:** the original color, distance, noise, and animation math.
2. **Uniform contract:** names, types, defaults, and coordinate conventions.
3. **Host integration:** renderer setup, resize handling, pointer events, loading, and cleanup.

This separation makes it possible to test the shader with static uniforms, reuse the same algorithm across scenes, and change application frameworks without rewriting the GLSL.

### React and component lifecycle

When using React or React Three Fiber, do not attach a new global resize listener on every render. Create resources in an effect or through the framework's lifecycle primitives, keep references stable, and remove listeners on cleanup. With React Three Fiber, prefer its frame callback and renderer sizing model rather than creating a second independent animation loop.

For a plain Three.js component, cleanup should include:

```js
function disposeShaderScene() {
  renderer.domElement.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("resize", resize);
  geometry.dispose();
  material.dispose();

  // Dispose textures only if this component owns them and they are not shared.
  channel0?.dispose();

  renderer.dispose();
  renderer.domElement.remove();
}
```

Only dispose of resources the component owns. Shared textures, renderers, and materials may be used elsewhere in the application.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Copying `mainImage` without a `main()` | Three.js expects a standard shader entry point | Keep `mainImage`, then call it from `main()` |
| Assuming `iTime` exists | Three.js does not advance Shadertoy uniforms | Declare it and update it every frame |
| Using CSS width for `iResolution` while sampling `gl_FragCoord` | The values can disagree on high-DPI displays | Use drawing-buffer or render-target dimensions |
| Treating `fragCoord` as UVs | Pixel values can be much larger than 1 | Normalize by the matching resolution when needed |
| Replacing pixel coordinates with `vUv` blindly | Coordinate-dependent patterns change shape and scale | Preserve the source coordinate system first |
| Mixing `gl_FragColor` with GLSL 3 outputs | Output syntax is version-dependent | Choose one GLSL version and use its matching output convention |
| Replacing `texture2D` with `texture` without checking the GLSL version | The function availability differs by GLSL version | Port the sampler calls and material version together |
| Forgetting a channel uniform | Shader compile or runtime output fails | Declare and bind each used channel |
| Updating uniforms by recreating the material | Causes unnecessary allocation and GPU work | Mutate existing uniform values |
| Ignoring texture color space | Colors may appear washed out or incorrect | Set color space based on whether the texture stores color or data |
| Leaving resize and pointer listeners attached | Repeated mounts can leak listeners | Remove listeners during cleanup |
| Porting every Shadertoy global even when unused | Adds noise and integration work | Add only the required inputs first |

## Performance and Production Checklist

Before considering the port complete:

- [ ] Identify every `i*` uniform, channel, buffer, and helper function used by the source.
- [ ] Confirm whether the shader is intended for a fullscreen pass or a 3D surface.
- [ ] Preserve the original coordinate conventions and aspect-ratio correction.
- [ ] Match the shader source to GLSL 1 or GLSL 3 output and texture syntax.
- [ ] Initialize all uniforms with correctly typed values.
- [ ] Advance `iTime` from elapsed time, not a fixed per-frame increment.
- [ ] Update `iResolution` after resize and pixel-ratio changes.
- [ ] Verify pointer coordinates use the same origin and units as the source.
- [ ] Bind every texture channel and match relevant sampling settings.
- [ ] Test on a high-DPI display and at a narrow viewport size.
- [ ] Check shader compile logs and test with a static color before debugging complex math.
- [ ] Avoid expensive loops, unnecessary texture reads, and repeated calculations inside the fragment shader.
- [ ] Cap pixel ratio where appropriate; fragment cost rises with the number of rendered pixels.
- [ ] Dispose of owned GPU resources and remove event listeners when the effect is removed.
- [ ] Verify behavior on the target browsers and devices, especially if relying on GLSL 3 features.

## Debugging Workflow

1. **Start with a static output.** Replace the fragment body with a constant color. This separates pipeline problems from algorithm problems.
2. **Confirm the entry point.** Ensure `main()` calls the retained `mainImage` function.
3. **Check compile diagnostics.** Look for undeclared Shadertoy globals, unsupported syntax, missing semicolons, and version-specific output declarations.
4. **Visualize coordinates.** Output normalized coordinates as color to verify orientation and scaling.
5. **Freeze time.** Set `iTime` to zero to isolate animation from spatial math.
6. **Add channels one at a time.** Confirm each texture is loaded and bound before restoring dependent calculations.
7. **Compare coordinate assumptions.** Check bottom-left versus top-left origin, pixel size versus UVs, and aspect-ratio corrections.
8. **Reintroduce complexity gradually.** Restore helper functions and raymarching or noise sections in small increments.

## Mental Models

1. **Host contract first:** Shadertoy supplies inputs and a calling convention; Three.js requires you to implement the missing contract.
2. **Keep the algorithm stable:** First make the source compile with minimal changes, then improve architecture only after matching its output.
3. **Coordinates are units:** Pixel coordinates, UVs, model coordinates, and normalized screen coordinates are different spaces. Convert deliberately.
4. **Uniforms are an API:** Their names, types, defaults, and units form the boundary between JavaScript and GLSL.
5. **Resolution describes the target:** It must match the buffer whose pixel coordinates the shader reads.
6. **GLSL versions are contracts too:** Output variables, texture functions, and syntax must agree with the selected version.
7. **Port behavior, not just code:** A successful conversion reproduces timing, pointer semantics, texture settings, and aspect-ratio behavior—not merely a successful compile.

## Quick Reference

| Shadertoy concept | Typical Three.js port |
|---|---|
| `mainImage(out vec4 fragColor, in vec2 fragCoord)` | Keep helper and call it from fragment `main()` |
| `fragCoord` | `gl_FragCoord.xy` for pixel coordinates |
| `iResolution` | Custom `vec3` uniform updated from drawing-buffer or target size |
| `iTime` | Custom `float` uniform updated in the animation loop |
| `iTimeDelta` | Custom `float` uniform updated from frame delta |
| `iMouse` | Custom `vec4` uniform populated from pointer events |
| `iChannel0` | Custom `sampler2D` uniform bound to a `THREE.Texture` |
| `texture(iChannel0, uv)` | GLSL 3-compatible texture sample |
| `texture2D(iChannel0, uv)` | GLSL 1-compatible texture sample |
| `gl_FragColor` | GLSL 1-style output; use explicit output variable in GLSL 3 |
| Shadertoy render size | Three.js drawing-buffer or render-target size |
| Automatic animation | Update uniforms in `requestAnimationFrame` or the framework's frame callback |

## Build Challenge

### Project: Shadertoy Effect Port Kit

Choose a Shadertoy shader that uses only fragment math, time, mouse input, and at most one 2D texture channel. Port it into a reusable Three.js component.

**Requirements**

1. Keep the original shader algorithm recognizable; document any deliberate changes.
2. Implement a `mainImage` wrapper or an equivalent clearly documented adapter.
3. Supply typed uniforms for every source input actually used.
4. Update elapsed time and drawing-buffer resolution correctly.
5. If pointer input is used, document the coordinate origin and any click-state behavior implemented.
6. If a texture channel is used, load it asynchronously and configure its color space and wrapping intentionally.
7. Make the effect responsive and test it at both a wide desktop and narrow mobile viewport.
8. Include cleanup for event listeners and GPU resources owned by the component.
9. Provide a debug mode that can display normalized coordinates or a constant color.
10. Record the original source URL and list any unsupported Shadertoy-specific inputs.

**Success criteria**

- The shader compiles without undeclared uniforms or version-mismatch errors.
- The effect maintains the intended aspect ratio after resizing.
- Animation speed does not depend on frame rate.
- High-DPI displays do not produce coordinate or pointer alignment errors.
- Texture and pointer behavior are explicitly verified rather than assumed.
- The component can be mounted and unmounted without accumulating listeners or owned GPU resources.
