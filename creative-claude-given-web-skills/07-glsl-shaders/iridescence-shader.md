# SKILL: iridescence-shader

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Create convincing iridescent materials in GLSL by combining view-dependent color shifts, Fresnel response, layered gradients, and controlled procedural variation.

## Why This Matters (Senior Perspective)

Iridescence gives a surface the shifting, angle-dependent color associated with soap bubbles, oil films, coated glass, pearls, and anodized metal. In a portfolio or product experience, it can make a hero object feel crafted and premium without requiring a large texture set. A shader can generate the color response from the camera and surface orientation, so the effect adapts as the viewer moves rather than behaving like a static rainbow painted onto the model.

The difference between a polished material and a distracting rainbow is control. A useful iridescence shader has a restrained palette, a predictable response to viewing angle, stable lighting, and parameters that can be art-directed. A simple sine wave can create a stylized approximation, but it is not a physically accurate thin-film simulation. Make that distinction explicit: use a procedural model for graphic and interactive work, and use a physically based material or a validated thin-film model when optical accuracy matters.

Production quality also means integrating the shader into the scene rather than tuning it in isolation. Normals must be in the same coordinate space as the view direction, color management must be consistent, and the material should behave sensibly under motion and changing aspect ratios. Keep a neutral base mode, expose a few meaningful controls, and test against different geometries and lighting setups. This makes the effect reusable across product renders, WebGL portfolio scenes, and interactive brand experiences.

## Core Concepts

### 1. Iridescence is view-dependent color

Iridescent color changes with the angle between the surface normal and the direction toward the camera. The effect is commonly strongest or most visible near grazing angles, though the exact response depends on the material and physical mechanism. A stylized shader can use the dot product between the normal and view direction as a control signal.

```glsl
float NdotV = clamp(dot(normalize(normal), normalize(viewDirection)), 0.0, 1.0);
float grazing = 1.0 - NdotV;
```

`NdotV` is near 1 when the camera looks straight at the surface and closer to 0 near the edge. `grazing` reverses that relationship so it can drive a stronger edge response.

**Gotcha:** The normal and view direction must be expressed in the same coordinate space. A world-space normal dotted with a view-space direction can produce unstable or nonsensical results.

### 2. Fresnel describes edge response

The Fresnel effect describes how reflection changes with viewing angle. A common real-time approximation is Schlick's formula:

\[
F = F_0 + (1-F_0)(1-\cos\theta)^5
\]

Here, \(F_0\) is the reflectance at normal incidence, and \(\cos\theta\) is approximated by the clamped normal-view dot product. Fresnel is useful as a mask for iridescent color, a rim highlight, or a blend between a base material and a reflective-looking layer.

```glsl
float fresnelSchlick(float NdotV, float F0) {
  float oneMinusNdotV = 1.0 - clamp(NdotV, 0.0, 1.0);
  return F0 + (1.0 - F0) * pow(oneMinusNdotV, 5.0);
}
```

This approximation is useful for stylized real-time effects. It does not by itself model the interference physics of a thin film.

### 3. A color cycle can approximate interference hues

A compact artistic approximation uses phase-shifted sine waves to produce smooth RGB variation. The phase is driven by viewing angle, a user-controlled frequency, and optionally a small spatial variation.

```glsl
vec3 spectralColor(float phase) {
  return 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
}
```

The offsets are approximately one third of a full cycle apart, which creates a continuous rainbow-like palette. This is a design tool rather than a physical wavelength simulation. Adjust saturation and brightness after generating the color so the result remains legible.

### 4. Surface normals determine the response

A sphere, plane, and rounded product model have different normal fields. A sphere naturally provides a broad range of view angles, while a flat plane may show little variation unless its normals or lighting change. Correctly transformed normals are essential when using custom vertex and fragment shaders.

```glsl
// Vertex shader: transform the normal into view space.
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = viewPosition.xyz;
  vViewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewPosition;
}
```

In the fragment shader, `normalize(-vViewPosition)` points from the surface toward the camera in view space. Pair it with `vViewNormal`, not a world-space vector.

### 5. Blend the effect with a base material

A practical iridescence shader rarely needs to replace every pixel with a rainbow. Blend the generated color with a base color using a Fresnel mask and a strength parameter. This keeps the effect controllable and makes it easier to create subtle coated surfaces.

```glsl
float mask = fresnel * uIridescenceStrength;
vec3 finalColor = mix(uBaseColor, iridescentColor, clamp(mask, 0.0, 1.0));
```

For a polished surface, a small amount of iridescence can be more convincing than full-strength color. The base material should remain recognizable at normal viewing angles.

### 6. Lighting and iridescence are separate signals

Procedural hue variation does not automatically provide believable illumination. A shader can calculate a color pattern and still look flat if it ignores direct light, environment reflection, or a diffuse/specular response. Conversely, adding strong lighting can wash out a carefully tuned hue pattern.

For a stylized shader, use the iridescent color as a layer over a simple diffuse term and add a restrained specular or Fresnel highlight. For physically based rendering, consider an established material implementation and environment lighting instead of rebuilding the entire lighting model from scratch.

### 7. Use time only when motion adds meaning

Iridescence often looks convincing with camera motion alone. Continuous animation of the color phase can make the surface feel like a moving gradient rather than a coating. Prefer view-dependent change as the primary behavior and add time-based drift only when the art direction calls for it.

```glsl
float phase = grazing * uFrequency + uPhase;
```

If `uPhase` is animated, keep its range and speed deliberate. It is often enough to animate a small offset during a transition, then stop.

### 8. Color space and tone mapping change the final look

Shader colors are not automatically immune to renderer color management. The chosen output color space, tone mapping, and the interpretation of uniforms can change how bright or saturated the material appears. Test the effect in the actual scene with the same renderer settings used by the final page.

Do not tune the rainbow against a screenshot from a different color pipeline and assume the result will match. Treat color management as part of the material specification.

## Integration Patterns

### Pattern 1: Minimal view-dependent iridescence

**Use when:** You need a simple, controllable shader for a sphere or rounded object.

This pattern passes the normal and position in view space. The fragment shader computes the view direction, derives a grazing-angle phase, generates a procedural color, and blends it with the base color.

```js
import * as THREE from 'three';

const vertexShader = `
  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = viewPosition.xyz;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = `
  uniform vec3 uBaseColor;
  uniform float uIridescenceStrength;
  uniform float uFrequency;
  uniform float uPhase;

  varying vec3 vViewNormal;
  varying vec3 vViewPosition;

  vec3 spectralColor(float phase) {
    return 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
  }

  void main() {
    vec3 normal = normalize(vViewNormal);
    vec3 viewDirection = normalize(-vViewPosition);
    float NdotV = clamp(dot(normal, viewDirection), 0.0, 1.0);
    float grazing = 1.0 - NdotV;

    float phase = grazing * uFrequency + uPhase;
    vec3 iridescent = spectralColor(phase);
    float fresnel = pow(grazing, 3.0);
    float blendAmount = clamp(fresnel * uIridescenceStrength, 0.0, 1.0);
    vec3 color = mix(uBaseColor, iridescent, blendAmount);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    uBaseColor: { value: new THREE.Color('#152238') },
    uIridescenceStrength: { value: 0.9 },
    uFrequency: { value: 10.0 },
    uPhase: { value: 0.0 }
  },
  vertexShader,
  fragmentShader
});

const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), material);
scene.add(mesh);
```

This is an intentionally stylized model. It does not calculate actual thin-film interference or environment reflections. Add a proper lighting model or use a physically based material if the object must respond realistically to lights.

### Pattern 2: Fresnel-weighted iridescence with a soft mask

**Use when:** You want the hue shift to appear primarily at grazing angles while preserving the object's base color.

Schlick Fresnel gives you a tunable response that can be reused for rims, reflections, and material blending. The code below uses a scalar \(F_0\) for simplicity; real materials can require wavelength-dependent reflectance and more complete optical treatment.

```glsl
uniform vec3 uBaseColor;
uniform float uF0;
uniform float uIridescenceStrength;
uniform float uFrequency;
uniform float uPhase;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

float fresnelSchlick(float NdotV, float F0) {
  return F0 + (1.0 - F0) * pow(1.0 - clamp(NdotV, 0.0, 1.0), 5.0);
}

vec3 spectralColor(float phase) {
  return 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
}

void main() {
  vec3 normal = normalize(vViewNormal);
  vec3 viewDirection = normalize(-vViewPosition);
  float NdotV = clamp(dot(normal, viewDirection), 0.0, 1.0);
  float fresnel = fresnelSchlick(NdotV, uF0);

  vec3 rainbow = spectralColor((1.0 - NdotV) * uFrequency + uPhase);
  float amount = clamp(fresnel * uIridescenceStrength, 0.0, 1.0);
  gl_FragColor = vec4(mix(uBaseColor, rainbow, amount), 1.0);
}
```

Choose a modest `uF0` and test the effect on both front-facing and grazing surfaces. Since this shader uses a simple color blend rather than a complete reflectance model, do not interpret `uF0` as a fully calibrated physical measurement.

### Pattern 3: Add subtle spatial variation

**Use when:** A perfectly smooth color band looks too synthetic and the art direction calls for a slightly organic surface.

Use a stable, low-frequency procedural term to perturb the phase. Avoid high-frequency noise that flickers or looks like compression artifacts. This example uses object-space position passed from the vertex shader; it stays attached to the surface as the camera moves.

```glsl
uniform float uFrequency;
uniform float uVariation;
uniform float uPhase;
varying vec3 vObjectPosition;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 normal = normalize(vViewNormal);
  vec3 viewDirection = normalize(-vViewPosition);
  float NdotV = clamp(dot(normal, viewDirection), 0.0, 1.0);

  float spatial = hash3(floor(vObjectPosition * 8.0)) - 0.5;
  float phase = (1.0 - NdotV) * uFrequency + uPhase + spatial * uVariation;
  vec3 rainbow = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));

  gl_FragColor = vec4(rainbow, 1.0);
}
```

This hash is deliberately simple and may look blocky. For a smoother result, use coherent noise, a texture, or a thin-film implementation that suits the project. Remember to add the matching vertex-shader varying for `vObjectPosition`.

### Pattern 4: Animate a controlled phase with Three.js

**Use when:** A material should gently shift during a hero transition or respond to scroll progress.

Change the uniform value on the existing material. Avoid rebuilding the material every frame. A phase that changes slowly is usually more elegant than a rapidly cycling rainbow.

```js
const clock = new THREE.Clock();

function render() {
  const elapsed = clock.getElapsedTime();
  material.uniforms.uPhase.value = elapsed * 0.12;
  renderer.render(scene, camera);
}
```

This is a minimal animation example; integrate it into the application's existing render loop rather than creating a second loop. If the renderer is demand-driven, request a render only when the phase changes. For scroll-based control, map a normalized progress value to a small phase range instead of tying the shader to raw scroll pixels.

### Pattern 5: Blend a base texture with iridescence

**Use when:** The surface needs to retain its original color or fine detail.

The base texture can carry albedo detail while the shader adds a view-dependent color layer. This simple pattern is useful for art-directed surfaces, but it does not replace a full physically based material with roughness, metalness, environment reflections, and energy-conserving lighting.

```glsl
uniform sampler2D uBaseMap;
uniform float uIridescenceStrength;
uniform float uFrequency;
uniform float uPhase;
varying vec2 vUv;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  vec4 base = texture2D(uBaseMap, vUv);
  vec3 normal = normalize(vViewNormal);
  vec3 viewDirection = normalize(-vViewPosition);
  float grazing = 1.0 - clamp(dot(normal, viewDirection), 0.0, 1.0);

  float phase = grazing * uFrequency + uPhase;
  vec3 rainbow = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
  float mask = pow(grazing, 2.5) * uIridescenceStrength;
  vec3 finalColor = mix(base.rgb, rainbow, clamp(mask, 0.0, 1.0));

  gl_FragColor = vec4(finalColor, base.a);
}
```

For a transparent base map, ensure the material's transparency and blending configuration matches the shader output. If using a color-managed texture, verify the texture color-space annotation and output pipeline.

### Pattern 6: Scroll-controlled iridescence

**Use when:** A product hero should evolve as the user scrolls through a story.

Keep scroll handling in JavaScript and pass a normalized value into a uniform. This separates interaction logic from shader math and allows the effect to be scrubbed, reversed, or disabled for reduced motion.

```js
function setScrollProgress(progress, material) {
  const normalizedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  material.uniforms.uPhase.value = normalizedProgress * 1.4;
  material.uniforms.uIridescenceStrength.value = 0.25 + normalizedProgress * 0.55;
}
```

Use your preferred scroll observer or animation library to calculate `progress`; avoid querying layout repeatedly inside a render loop. Keep the range intentionally small so the material remains art-directed throughout the scroll.

## Advanced Patterns

### 1. Multi-band iridescence

**Use when:** One smooth hue cycle feels too simple and the surface should have two restrained color bands.

Combine two phases with different frequencies and blend the second band at a lower strength. Too many bands can look like a striped texture rather than angle-dependent color.

```glsl
vec3 spectralColor(float phase) {
  return 0.5 + 0.5 * cos(phase + vec3(0.0, 2.094, 4.188));
}

vec3 multiBandColor(float grazing, float frequency, float phase) {
  vec3 broadBand = spectralColor(grazing * frequency + phase);
  vec3 fineBand = spectralColor(grazing * frequency * 1.7 + phase + 0.8);
  return mix(broadBand, fineBand, 0.22);
}
```

Use this helper in the fragment shader after computing `grazing`. Keep the secondary blend restrained and expose one overall intensity control rather than a large set of arbitrary knobs.

### 2. Iridescence with a lighting term

**Use when:** A stylized shader looks flat and needs a simple response to a key light.

This pattern adds a basic diffuse term and a small specular highlight. It is a teaching model, not a replacement for Three.js's physically based lighting pipeline. Use view-space vectors consistently and keep the specular contribution independent from the color-cycle phase.

```glsl
uniform vec3 uBaseColor;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uIridescenceStrength;
uniform float uFrequency;
varying vec3 vViewNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vViewNormal);
  vec3 viewDirection = normalize(-vViewPosition);
  vec3 lightDirection = normalize(uLightDirection);

  float NdotL = max(dot(normal, lightDirection), 0.0);
  float NdotV = clamp(dot(normal, viewDirection), 0.0, 1.0);
  float grazing = 1.0 - NdotV;

  vec3 rainbow = 0.5 + 0.5 * cos(grazing * uFrequency + vec3(0.0, 2.094, 4.188));
  float diffuse = 0.25 + 0.75 * NdotL;
  float specular = pow(max(dot(reflect(-lightDirection, normal), viewDirection), 0.0), 48.0);

  vec3 coated = mix(uBaseColor, rainbow, clamp(grazing * uIridescenceStrength, 0.0, 1.0));
  vec3 lit = coated * uLightColor * diffuse + uLightColor * specular * 0.25;
  gl_FragColor = vec4(lit, 1.0);
}
```

The light direction must be expressed in view space to match the varying vectors. If your application needs multiple lights, shadows, environment reflections, or physically based response, prefer a standard material with an iridescence-capable implementation instead of extending this teaching shader indefinitely.

### 3. Palette-limited iridescence

**Use when:** A brand needs the shifting surface effect but cannot use a full rainbow.

Instead of three phase-shifted sine waves, map the phase to a curated palette. The following helper blends among three colors. It avoids the obvious rainbow spectrum and gives designers explicit control over the brand direction.

```glsl
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

vec3 paletteColor(float phase) {
  float t = fract(phase / 6.2831853);
  if (t < 0.5) {
    return mix(uColorA, uColorB, smoothstep(0.0, 0.5, t));
  }
  return mix(uColorB, uColorC, smoothstep(0.5, 1.0, t));
}
```

Use a continuous palette and check that the endpoints do not create a visible seam when `fract` wraps. A smooth cyclic palette should return to the starting color at the end of the cycle.

### 4. Reduce banding and control color contrast

**Use when:** Smooth gradients show visible bands, especially on low-bit-depth displays or after tone mapping.

Banding may come from output precision, color transforms, or an overly steep color function. First reduce contrast and inspect the renderer pipeline. A very small, stable dither can hide banding, but animated noise can flicker and should not be used as a blanket fix.

```glsl
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 addSubtleDither(vec3 color, vec2 screenUv, float amount) {
  float noise = hash(screenUv) - 0.5;
  return clamp(color + noise * amount, 0.0, 1.0);
}
```

Use screen-space coordinates for a stable display-space dither, or object-space coordinates if the noise should travel with the surface. Keep `amount` extremely small and test on actual target devices.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Mixing normals and view vectors from different spaces | The dot product has no meaningful geometric interpretation | Transform both to view space or both to world space |
| Treating a cosine rainbow as physical thin-film optics | The effect can look stylized but will not match real optical behavior | Label it as procedural, or use a validated thin-film model |
| Making every surface fully rainbow-colored | The object loses material identity and visual hierarchy | Blend with a base color using a restrained mask |
| Animating hue continuously without a reason | The material looks like a moving gradient rather than a coating | Let camera angle drive most of the effect |
| Using a flat plane and expecting spherical edge response | A plane has a nearly constant normal field | Use curved geometry, custom normals, or a different mask |
| Ignoring color management | Hue and brightness differ between test and production scenes | Tune with the final renderer output settings |
| Adding noise at high frequency | The surface shimmers or looks damaged | Use low-frequency variation or a stable noise texture |
| Recreating the material on each frame | Causes allocations and possible shader recompilation | Update uniforms on the existing material |
| Using an unbounded phase or strength | Controls become difficult to art-direct and may clip colors | Clamp or normalize inputs in JavaScript |
| Extending a toy shader into a full renderer | Lighting, shadows, reflections, and energy handling become fragile | Use a standard physically based material where appropriate |

### Wrong vs. right: coordinate spaces

**Wrong:** Dot a view-space normal with a world-space camera direction.

```glsl
float angle = dot(vViewNormal, uWorldViewDirection);
```

**Right:** Keep both vectors in view space.

```glsl
vec3 normal = normalize(vViewNormal);
vec3 viewDirection = normalize(-vViewPosition);
float angle = clamp(dot(normal, viewDirection), 0.0, 1.0);
```

### Wrong vs. right: uncontrolled rainbow

**Wrong:** Replace the base color everywhere with a bright spectral color.

```glsl
vec3 finalColor = spectralColor(phase);
```

**Right:** Use the hue cycle as a controlled layer.

```glsl
float amount = clamp(fresnel * uIridescenceStrength, 0.0, 1.0);
vec3 finalColor = mix(uBaseColor, spectralColor(phase), amount);
```

## Performance and Production Checklist

1. Prefer one or two simple color calculations before adding noise or extra samples.
2. Normalize normals and view directions before dot products.
3. Keep coordinate spaces explicit in variable names and comments.
4. Use a small, documented set of uniforms with bounded ranges.
5. Avoid per-frame material reconstruction; mutate uniforms instead.
6. Use camera motion as the primary source of view-dependent change.
7. Test the material on multiple shapes, including rounded and flat surfaces.
8. Tune colors under the final renderer color-space and tone-mapping configuration.
9. Provide a neutral or reduced-effect mode for low-powered devices.
10. Dispose of geometry and material resources when the component is removed.
11. If physical accuracy matters, use a suitable PBR implementation or validated thin-film model.
12. Check the shader on mobile hardware rather than relying only on desktop preview.

## Mental Models

1. **Angle drives the hue:** Iridescence is most convincing when color responds to viewing geometry.
2. **Fresnel is a mask:** It controls where the effect becomes prominent; it is not the whole material.
3. **Normals need a coordinate contract:** Every vector in a dot product must share a space.
4. **A procedural rainbow is an artistic approximation:** It is not automatically a thin-film simulation.
5. **Base color anchors identity:** The iridescent layer should support the object, not erase it.
6. **Lighting is a separate system:** Color variation and illumination solve different problems.
7. **Subtlety improves realism:** A restrained hue shift often looks more premium than full saturation.

## Quick Reference

| Goal | Technique | Main controls |
|---|---|---|
| Angle-based color shift | Map `1.0 - dot(N, V)` to phase | `uFrequency`, `uPhase` |
| Edge/rim emphasis | Fresnel or a grazing-angle power | `uF0`, strength |
| Rainbow palette | Phase-shifted cosine | Frequency, phase |
| Brand-limited hues | Blend curated palette colors | `uColorA`, `uColorB`, `uColorC` |
| Organic variation | Perturb phase with low-frequency noise | `uVariation` |
| Gentle animation | Update phase uniform | `uPhase` |
| Preserve surface detail | Blend over a base texture | `uBaseMap`, strength |
| Improve shading | Add a simple diffuse/specular term or use PBR | Light direction, roughness |
| Reduce banding | Tone down contrast and add subtle dither if needed | Dither amount |

## Build Challenge

Create an **Iridescent Product Showcase** for a portfolio: one polished object should shift color as the camera or pointer moves, while a small control panel lets visitors tune the material.

### Requirements

1. Create a Three.js scene with at least one rounded object and one contrasting shape.
2. Implement a view-dependent iridescence shader with normals and view direction in the same coordinate space.
3. Expose controls for base color, strength, frequency, and phase.
4. Add a neutral material mode so the object remains readable without iridescence.
5. Add optional, restrained phase animation that can be disabled.
6. Include a curated palette option in addition to the rainbow mode.
7. Test the shader under at least two lighting or background conditions.
8. Add a reduced-motion mode and avoid unnecessary animation when the showcase is not visible.
9. Document that the procedural cosine palette is a stylized approximation rather than physical thin-film simulation.
10. Verify performance and appearance on a mobile device.

### Success criteria

- Color changes follow the viewing angle instead of appearing randomly animated.
- No obvious edge flicker or coordinate-space artifacts appear.
- Base material identity remains visible at low and medium strengths.
- The palette is adjustable without rebuilding the shader material.
- The showcase remains visually coherent with animation disabled.
- The README explains the effect model, controls, limitations, and performance decisions.

### Suggested implementation sequence

1. Render a neutral object with correct normals.
2. Compute view direction and visualize the grazing-angle mask as grayscale.
3. Add the spectral color function and tune its frequency.
4. Blend it with a base color using a Fresnel-style mask.
5. Add palette controls and optional phase animation.
6. Test different geometries and renderer color settings.
7. Add cleanup, reduced-motion behavior, and documentation.
