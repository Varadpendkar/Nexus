# SKILL: vertex-shader-patterns

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Build reliable, performant vertex shaders that transform geometry in meaningful ways while preserving correct normals, predictable animation, and integration with Three.js.

## Why This Matters (Senior Perspective)

A vertex shader runs once for every vertex processed by the GPU. It is where geometry gets positioned, displaced, and prepared for rasterization. That makes it a powerful place to create waves, ripples, terrain, organic motion, procedural silhouettes, and scroll-reactive 3D effects. It also makes mistakes expensive: a calculation repeated across hundreds of thousands of vertices can become a frame-time problem, and a position change that ignores normals can make lighting look broken even when the silhouette looks correct.

Senior shader work starts by understanding the pipeline rather than copying a visual trick. A vertex position commonly moves through object space, world space, view space, and clip space. A shader must respect that coordinate-space contract, and it must account for how its geometry is sampled. Moving only the vertices already present in a low-resolution mesh cannot create smooth detail that the mesh does not contain. Similarly, displacing positions without updating normals can make specular highlights appear to slide or flicker unnaturally.

For creative development, vertex-shader fluency lets you make portfolio pieces feel authored instead of template-driven: a hero object that breathes, a terrain surface that responds to pointer position, a product reveal that bends into place, or a particle-like field built from actual mesh vertices. The aim is not maximal complexity. It is a small set of predictable patterns, clear coordinate-space choices, and a performance budget that survives real devices.

## Core Concepts

### 1. The vertex pipeline and `gl_Position`

**Mental model:** Each vertex shader invocation receives attributes for one vertex. It computes that vertex's final clip-space position, which the GPU uses to decide where the vertex appears on screen. `gl_Position` is mandatory for a conventional vertex shader.

The usual transform chain is:

`local/object space → world space → view/camera space → clip space`

In a Three.js `ShaderMaterial`, the built-in matrices are provided by Three.js. Keep the final transform in the expected order unless you deliberately need a different coordinate space.

```glsl
// Three.js supplies these matrices for ShaderMaterial.
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;

void main() {
  // Move from object space into camera/view space.
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);

  // Project the view-space point into clip space.
  gl_Position = projectionMatrix * viewPosition;
}
```

A shorter equivalent is:

```glsl
void main() {
  // The model-view matrix combines object-to-world and world-to-view transforms.
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Gotcha:** `position` is normally an object-space attribute. Writing `gl_Position = vec4(position, 1.0)` bypasses the camera and object transforms, so the mesh will not behave like an ordinary Three.js object.

### 2. Coordinate spaces are contracts

**Mental model:** A number has no useful geometric meaning without knowing its coordinate space. A displacement of `0.2` along local Y follows the object's local orientation; a displacement along world Y stays aligned to the scene's vertical axis.

Use object-space displacement for effects that should travel with the mesh, such as local wobble or a product object bending in its own frame. Use world-space calculations when the effect must align across multiple objects, such as a shared water level or a global wind direction.

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

void main() {
  vec3 displacedPosition = position;

  // Local-space wave: the object carries this pattern when it rotates.
  displacedPosition.y += sin(position.x * uFrequency + uTime) * uAmplitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

To calculate a world-space position, transform the vertex first:

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);

  // World-space wave: its phase is based on scene coordinates.
  worldPosition.y += sin(worldPosition.x * uFrequency + uTime) * uAmplitude;

  // Convert the modified world-space position into clip space.
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
```

**Gotcha:** Do not transform a position into world space and then multiply it by `modelViewMatrix`; that applies the model transform a second time. Keep track of each variable's space in its name or comments.

### 3. Uniforms, attributes, and varyings

**Mental model:** Attributes vary per vertex, uniforms are shared inputs for a draw call, and varyings carry interpolated data from the vertex stage to the fragment stage.

- **Attributes** commonly include `position`, `normal`, `uv`, `color`, and custom per-vertex data.
- **Uniforms** commonly include elapsed time, amplitude, pointer coordinates, or a texture.
- **Varyings** send values such as UV coordinates or a procedural mask to the fragment shader.

```glsl
// Vertex shader
uniform float uTime;
attribute vec3 position;
attribute vec2 uv;
varying vec2 vUv;
varying float vHeight;

void main() {
  vec3 displacedPosition = position;

  // One shared time value drives all vertices consistently.
  displacedPosition.y += sin(position.x * 2.0 + uTime) * 0.12;

  // Pass interpolated information to the fragment shader.
  vUv = uv;
  vHeight = displacedPosition.y;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

```glsl
// Fragment shader
varying vec2 vUv;
varying float vHeight;

void main() {
  // Height becomes a simple vertical color gradient.
  vec3 lowColor = vec3(0.02, 0.12, 0.22);
  vec3 highColor = vec3(0.2, 0.85, 0.9);
  float heightMask = smoothstep(-0.2, 0.2, vHeight);

  gl_FragColor = vec4(mix(lowColor, highColor, heightMask), 1.0);
}
```

**Gotcha:** The varying declaration must match between shader stages. On modern GLSL versions, the syntax changes to `in` and `out`; do not mix GLSL 1 syntax with GLSL 3 syntax in one shader program.

### 4. Geometry resolution determines displacement quality

**Mental model:** A vertex shader moves existing vertices; it does not add vertices. The mesh's topology is the sampling grid for the effect.

A plane with one segment in each direction has too few vertices to represent a detailed wave. Increase subdivisions only as far as the visible result requires.

```js
import * as THREE from 'three';

// 160 × 160 subdivisions gives the vertex shader enough samples for a smooth hero wave.
const geometry = new THREE.PlaneGeometry(8, 8, 160, 160);
geometry.rotateX(-Math.PI / 2);

const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: 0.18 },
    uFrequency: { value: 1.6 }
  },
  vertexShader,
  fragmentShader,
  side: THREE.DoubleSide
});

const waterSurface = new THREE.Mesh(geometry, material);
scene.add(waterSurface);
```

**Gotcha:** A high segment count increases vertex processing and memory use. If the effect is distant or subtle, use fewer segments. For extremely dense surfaces, consider level of detail, instancing where appropriate, or a texture-based approach instead.

### 5. Time-based motion should be frame-rate independent

**Mental model:** A uniform should represent elapsed time, not the number of rendered frames. Frame-count animation runs faster on high-refresh displays and changes speed when performance drops.

Update a time uniform with the clock's elapsed time:

```js
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // Elapsed seconds keep the shader's phase independent of frame rate.
  material.uniforms.uTime.value = clock.getElapsedTime();

  renderer.render(scene, camera);
}

animate();
```

Then use time in the shader:

```glsl
uniform float uTime;

void main() {
  vec3 displacedPosition = position;

  // Frequency controls spatial repetition; time controls progression.
  displacedPosition.y += sin(position.x * 1.8 + uTime * 0.7) * 0.15;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

**Gotcha:** Avoid multiplying elapsed time by a very large value over long sessions if the effect does not need it. For periodic motion, use a moderate time scale and stable trigonometric expressions.

### 6. Displacement and normals must agree

**Mental model:** The normal tells the lighting calculation which direction a surface faces. When you deform a surface, the original normal may no longer describe its new slope.

For a quick silhouette-only effect, unchanged normals may be acceptable. For a glossy material or strong directional lighting, incorrect normals are immediately visible. You can estimate a wave normal analytically or compute normals from derivatives in the shader, depending on the surface and rendering approach.

For a simple wave \(y = A\sin(kx + t)\), the slope along X is \(dy/dx = Ak\cos(kx+t)\). A normal can be approximated from that slope:

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
varying vec3 vWaveNormal;

void main() {
  float phase = position.x * uFrequency + uTime;
  float waveHeight = sin(phase) * uAmplitude;

  vec3 displacedPosition = position;
  displacedPosition.y += waveHeight;

  // For a wave that varies only along X, the tangent is (1, slope, 0).
  float slope = uAmplitude * uFrequency * cos(phase);
  vWaveNormal = normalize(vec3(-slope, 1.0, 0.0));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

This normal is in the local coordinate system. Transform it correctly for lighting if you use it beyond a simple local-space demonstration.

**Gotcha:** This approximation only matches the specified wave direction. For multi-directional displacement, derive the partial derivatives for both axes or use a compatible normal-reconstruction method.

### 7. Use smooth masks to localize deformation

**Mental model:** A mask is a scalar from zero to one that controls how strongly a vertex responds. It lets you bend only the top of an object, ripple near a point, or reveal geometry from a chosen region.

A smooth transition is usually more natural than a hard threshold:

```glsl
uniform float uTime;
uniform float uBend;
varying float vBendMask;

void main() {
  vec3 displacedPosition = position;

  // Vertices near the top receive more bend; the base remains anchored.
  float bendMask = smoothstep(0.0, 1.0, position.y);
  displacedPosition.x += sin(uTime + position.y * 2.0) * uBend * bendMask;

  vBendMask = bendMask;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

**Gotcha:** The mask's input must match the coordinate space and geometry scale. If the model is resized or its pivot changes, a mask based on raw local Y may need adjustment.

### 8. Preserve the Three.js material contract

**Mental model:** `ShaderMaterial` exposes Three.js uniforms and attributes such as `modelViewMatrix`, `projectionMatrix`, and `position`. `RawShaderMaterial` gives you less automatic setup and requires more declarations to be explicit.

Start with `ShaderMaterial` unless you specifically need the raw shader interface. Keep uniform names consistent between JavaScript and GLSL.

```js
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: 0.1 }
  },
  vertexShader: `
    uniform float uTime;
    uniform float uAmplitude;

    void main() {
      vec3 displacedPosition = position;
      displacedPosition.y += sin(position.x * 2.0 + uTime) * uAmplitude;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
    }
  `,
  fragmentShader: `
    void main() {
      gl_FragColor = vec4(0.04, 0.55, 0.72, 1.0);
    }
  `
});
```

**Gotcha:** If you use `RawShaderMaterial`, explicitly declare every attribute, uniform, and matrix you depend on, and verify the GLSL version. A shader that compiles under `ShaderMaterial` may fail under `RawShaderMaterial`.

### 9. Avoid unnecessary work per vertex

**Mental model:** Every operation in `main()` may run for every vertex. Keep reusable inputs in uniforms, avoid redundant transforms, and use simple expressions when they produce the same visual result.

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

void main() {
  vec3 displacedPosition = position;

  // Calculate the phase once and reuse it.
  float phase = position.x * uFrequency + uTime;
  float wave = sin(phase);

  displacedPosition.y += wave * uAmplitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

This is clearer than repeating the same expression in multiple places. It may also reduce redundant arithmetic, though compilers can optimize repeated expressions automatically.

**Gotcha:** Do not sacrifice clarity to micro-optimize a tiny shader. Profile first, and remember that vertex count, fragment cost, overdraw, and GPU bandwidth can matter more than one arithmetic operation.

### 10. Animate around meaningful pivots

**Mental model:** Rotation and deformation happen relative to an origin. If the origin is in the wrong place, a correct transform can still look wrong.

For a custom mesh, reposition the geometry so its base sits at local Y = 0 when you want it to bend from the ground:

```js
const geometry = new THREE.CylinderGeometry(0.15, 0.4, 2, 24, 48);

// Move the geometry so its base is at y = 0 while the mesh origin stays at the base.
geometry.translate(0, 1, 0);

const plantStem = new THREE.Mesh(geometry, material);
scene.add(plantStem);
```

Now a mask based on local Y can leave the base still and allow the top to move.

**Gotcha:** `geometry.translate()` changes vertex coordinates, while `mesh.position` changes the object's transform. Choose intentionally; do not use both to compensate for an unknown pivot.

## Reusable Patterns

### Pattern 1: A reusable sinusoidal surface

**What it does:** Adds a clean traveling wave to a sufficiently subdivided surface.

**When to use it:** Water-like hero sections, abstract backgrounds, animated product platforms, and subtle motion behind typography.

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uSpeed;

void main() {
  vec3 displacedPosition = position;

  // A traveling wave shifts phase over time rather than changing amplitude randomly.
  float phase = position.x * uFrequency + uTime * uSpeed;
  displacedPosition.y += sin(phase) * uAmplitude;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

JavaScript setup:

```js
const waveMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uAmplitude: { value: 0.16 },
    uFrequency: { value: 1.4 },
    uSpeed: { value: 0.8 }
  },
  vertexShader: waveVertexShader,
  fragmentShader: waveFragmentShader,
  side: THREE.DoubleSide
});

// Update uTime from a THREE.Clock in the render loop.
```

**Trade-off:** A single-axis wave is inexpensive and readable, but can look repetitive. Add a second wave with a different direction and lower amplitude if the visual needs more complexity.

### Pattern 2: Two-axis organic surface

**What it does:** Combines two low-amplitude waves traveling in different directions.

**When to use it:** Abstract terrain, organic blobs based on planes, and stylized water where perfect periodic repetition should be less obvious.

```glsl
uniform float uTime;
uniform float uAmplitude;
uniform float uFrequency;

void main() {
  vec3 displacedPosition = position;

  // Different directions and speeds reduce the obviousness of a single repeating wave.
  float waveA = sin(position.x * uFrequency + uTime * 0.8);
  float waveB = cos(position.y * (uFrequency * 0.75) - uTime * 0.55);

  displacedPosition.z += (waveA + waveB) * uAmplitude * 0.5;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

**Trade-off:** Combining waves adds visual richness, but the surface normal becomes more complicated. For shiny materials, derive a normal that matches both wave components.

### Pattern 3: Pointer-proximity ripple

**What it does:** Displaces vertices based on their distance from a point in the surface's local coordinate space.

**When to use it:** Interactive landing-page surfaces, pointer-reactive grids, and subtle cursor feedback.

```glsl
uniform float uTime;
uniform vec2 uPointer;
uniform float uRippleStrength;
uniform float uRippleRadius;
uniform float uRippleSpeed;

void main() {
  vec3 displacedPosition = position;

  // Measure distance in the same local plane as uPointer.
  float distanceToPointer = distance(position.xy, uPointer);

  // The envelope keeps the ripple local; the sine moves outward through the radius.
  float envelope = 1.0 - smoothstep(0.0, uRippleRadius, distanceToPointer);
  float ripplePhase = distanceToPointer * 12.0 - uTime * uRippleSpeed;
  float ripple = sin(ripplePhase) * envelope;

  displacedPosition.z += ripple * uRippleStrength;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

JavaScript should update `uPointer` in the same local coordinate system. If the pointer starts in screen coordinates, convert it to a ray-plane intersection or another well-defined surface coordinate before passing it to the shader.

**Gotcha:** Do not pass raw pixel coordinates to a shader comparing them with geometry coordinates. That mixes coordinate spaces and makes the effect scale-dependent.

### Pattern 4: Scroll-controlled deformation

**What it does:** Uses a normalized progress uniform to control a reveal or bend without coupling the shader to a scroll API.

**When to use it:** Scroll storytelling, product reveals, and page transitions coordinated by GSAP or a custom scroll controller.

```glsl
uniform float uProgress;
uniform float uBendAmount;

void main() {
  vec3 displacedPosition = position;

  // Clamp progress so overscroll cannot create unintended extreme deformation.
  float progress = clamp(uProgress, 0.0, 1.0);
  float bendMask = smoothstep(-0.5, 0.5, position.y);

  // Deformation eases in as the section enters its active scroll range.
  displacedPosition.x += sin(progress * 3.14159265) * uBendAmount * bendMask;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
```

```js
// Example update from a GSAP ScrollTrigger callback or onUpdate handler.
function setRevealProgress(progress) {
  material.uniforms.uProgress.value = THREE.MathUtils.clamp(progress, 0, 1);
}
```

**Trade-off:** Keep scroll progress as a simple uniform. Avoid rebuilding the shader or geometry on every scroll event.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Assigning `gl_Position = vec4(position, 1.0)` in a normal Three.js scene | Bypasses model-view and projection transforms | Use `projectionMatrix * modelViewMatrix * vec4(position, 1.0)` |
| Displacing a low-resolution plane | There are not enough vertices to represent smooth detail | Increase subdivisions based on visible needs, then profile |
| Using raw pointer pixels with local-space positions | Distances and units are incompatible | Convert pointer input to the same coordinate space first |
| Animating with frame count | Motion speed depends on frame rate | Update an elapsed-time uniform |
| Moving vertices but ignoring normals on a glossy surface | Lighting no longer matches the deformed geometry | Derive or reconstruct appropriate normals |
| Applying `modelMatrix` and then `modelViewMatrix` to the same point | Applies the model transform twice | Track the space of every intermediate variable |
| Repeating uniform declarations inconsistently | Shader compile errors or mismatched inputs | Keep JS and GLSL uniform names and types identical |
| Using a hard `if` threshold for a soft bend | Produces a visible crease or abrupt transition | Use `smoothstep` for a continuous mask |
| Updating geometry positions on the CPU every frame for a shader-only effect | Adds CPU work and can require buffer updates | Prefer a vertex shader when the deformation is visual only |
| Using an extreme amplitude without checking bounds | Geometry may clip through nearby objects or camera planes | Tune amplitude relative to mesh scale and camera framing |

### Wrong vs. right: transform chain

```glsl
// WRONG: this is not in camera clip space.
gl_Position = vec4(position, 1.0);

// RIGHT: use the expected Three.js transform chain.
gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
```

### Wrong vs. right: time source

```js
// WRONG: speed depends on how many frames happen to render.
material.uniforms.uTime.value += 0.016;

// RIGHT: elapsed time is measured in seconds.
material.uniforms.uTime.value = clock.getElapsedTime();
```

### Wrong vs. right: pointer space

```glsl
// WRONG: pointerPixels is measured in screen pixels, while position.xy is local geometry space.
// float distanceToPointer = distance(position.xy, pointerPixels);

// RIGHT: pass a pointer coordinate converted into the surface's local plane.
// float distanceToPointer = distance(position.xy, uPointer);
```

## Mental Models

1. **One invocation per vertex** — `main()` runs for each processed vertex, so the mesh resolution is part of the effect.
2. **Space is part of the type** — local, world, view, and clip coordinates may all be `vec3` or `vec4`, but they are not interchangeable.
3. **Uniforms are shared controls** — use them for time, amplitude, pointer position, and progress.
4. **Varyings are interpolated messages** — they carry per-vertex information to the fragment stage.
5. **Silhouette and lighting are separate** — a good displaced outline does not guarantee correct surface normals.
6. **Time is continuous** — drive animation from elapsed seconds, not frame counts.
7. **Resolution is a budget** — more vertices improve displacement detail but cost processing and memory.
8. **Pivots define behavior** — geometry origin and coordinate-space choice determine how deformation feels.

## Quick Reference

| Need | Technique | Reminder |
|---|---|---|
| Basic vertex transform | `projectionMatrix * modelViewMatrix * vec4(position, 1.0)` | Standard Three.js `ShaderMaterial` path |
| Local wave | Modify `position` before projection | Pattern rotates with the mesh |
| World-aligned wave | Transform to world space first | Do not apply model transform twice |
| Animate over time | `uTime` uniform from `THREE.Clock` | Use seconds |
| Localize deformation | `smoothstep` mask | Choose a stable coordinate and range |
| Pass data to fragment shader | `varying` in GLSL 1 | Match declarations across stages |
| Smooth surface deformation | Subdivided geometry | Tune against device performance |
| Interactive ripple | Distance to converted pointer coordinate | Pointer and vertex must share space |
| Scroll reveal | `uProgress` uniform | Clamp to 0–1 |
| Better lighting after deformation | Analytic or reconstructed normal | Especially important for glossy surfaces |
| Material integration | `THREE.ShaderMaterial` | Prefer it unless raw shader control is required |

## Build Challenge

### Build a pointer-reactive shader surface for a creative portfolio

Create an interactive surface that sits behind the hero content of a portfolio page. The surface should respond to pointer movement and a scroll-driven progress value while remaining smooth on a typical laptop.

**Requirements**

1. Create a subdivided `PlaneGeometry` with enough vertices for smooth deformation, but do not choose an unnecessarily extreme segment count.
2. Write a vertex shader that combines two low-amplitude waves with a pointer-proximity ripple.
3. Keep coordinate spaces explicit. Convert pointer input into the surface's local plane or clearly document a world-space alternative.
4. Drive motion with a `uTime` uniform updated from `THREE.Clock`.
5. Add a `uProgress` uniform that eases the wave amplitude or bend as the hero section scrolls.
6. Pass UV coordinates and at least one useful deformation value to the fragment shader.
7. Use a restrained color treatment that makes the deformation readable without competing with the page's primary text.
8. Test the surface at desktop and mobile viewport sizes. Reduce geometry density or amplitude on lower-powered devices if needed.
9. Check that the effect does not visibly clip through nearby objects and that the animation remains stable when the tab loses focus and resumes.
10. Document the chosen coordinate space, geometry resolution, and one performance trade-off in the project README.

**Expected result:** A reusable Three.js shader surface with smooth motion, pointer interaction, scroll control, and a clear explanation of its performance choices. The effect should enhance the portfolio rather than distract from the content, and its uniforms should be easy to tune without editing the shader source.
