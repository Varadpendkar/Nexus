# SKILL: glsl-math-toolkit

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Build a reusable GLSL math toolkit for procedural graphics by mastering vector operations, interpolation, coordinate transforms, distance fields, periodic functions, and numerically stable shader patterns.

## Why This Matters (Senior Perspective)

Shader work becomes easier to reason about when common math is treated as a toolkit rather than a pile of unexplained formulas. Dot products, interpolation, smooth thresholds, coordinate transforms, and distance functions appear in almost every effect: UV distortion, procedural patterns, lighting, particles, transitions, and raymarching. Knowing what each operation means lets you design an effect intentionally instead of tweaking constants until it looks acceptable.

The senior-level distinction is choosing the right math for the visual problem. A hard threshold is appropriate for a crisp mask; `smoothstep` is better for a soft transition; a signed distance field is useful when the boundary itself matters; and a coordinate transform is often cleaner than adding special cases to an equation. The same result can be produced by several formulas, but they differ in readability, stability, performance, and how easily they can be controlled by uniforms.

This skill focuses on practical GLSL ES patterns for WebGL and Three.js. The examples use familiar GLSL 1.00 conventions such as `varying`, `texture2D`, and `gl_FragColor`; adapt the syntax when using GLSL 3 or a renderer configuration that requires explicit inputs and outputs. Treat code snippets as building blocks: test the math in isolation, visualize intermediate values as colors, and only then combine them into a larger material.

## Core Concepts

### 1. Scalar and vector operations

GLSL provides scalar types such as `float` and vector types such as `vec2`, `vec3`, and `vec4`. Most vector operations work component-wise, which makes concise shader code possible. For example, adding a `vec3` to another `vec3` adds each corresponding component.

```glsl
vec3 a = vec3(0.2, 0.4, 0.8);
vec3 b = vec3(0.1, 0.3, 0.2);

vec3 sum = a + b;
vec3 product = a * b; // component-wise multiplication
```

Component-wise multiplication is not a dot product. Use `dot(a, b)` when you need a scalar measure of alignment or projection-related information.

### 2. Dot product measures alignment

The dot product is one of the most useful shader operations. For normalized vectors, it approaches 1 when directions align, 0 when they are perpendicular, and -1 when they point in opposite directions. It is widely used for lighting, Fresnel masks, directional patterns, and projections.

```glsl
float alignment = dot(normalize(normal), normalize(direction));
float frontFacing = max(alignment, 0.0);
```

Clamp the result when the following calculation expects a range such as 0–1. Do not normalize vectors blindly if their magnitude carries meaningful information; normalize when the operation is intended to compare directions.

### 3. Length and distance

`length(v)` measures a vector's magnitude. `distance(a, b)` is equivalent to `length(a - b)` and measures the separation between two points. These functions are the foundation of radial gradients, circular masks, distance fields, and particle influence zones.

```glsl
vec2 centeredUv = vUv - 0.5;
float radius = length(centeredUv);
float distanceToPointer = distance(vUv, uPointer);
```

UV-space distances are normalized but not necessarily circular in screen space. If width and height differ, correct one axis by the displayed aspect ratio before measuring a distance that should look circular.

### 4. Interpolation with `mix`

`mix(a, b, t)` linearly interpolates between `a` and `b`. At `t = 0`, the result is `a`; at `t = 1`, it is `b`; values between them blend the two. The parameter is not automatically clamped.

```glsl
float value = mix(0.2, 0.9, progress);
vec3 color = mix(colorA, colorB, clamp(progress, 0.0, 1.0));
```

Use `mix` for color blending, transitions, procedural gradients, and combining a base material with an effect layer. If extrapolation is not desired, clamp the interpolation parameter explicitly.

### 5. `step` creates a hard threshold

`step(edge, x)` returns 0 when `x` is below `edge` and 1 when `x` is at or above it. This is useful for binary masks, grid lines, and crisp cutouts.

```glsl
float mask = step(0.5, vUv.x);
```

A hard threshold can alias when its boundary moves or becomes very thin. If the visual requires a crisp edge, use appropriate anti-aliasing or derivative-based smoothing where supported. If the edge should be soft, use `smoothstep`.

### 6. `smoothstep` creates a soft threshold

`smoothstep(edge0, edge1, x)` transitions smoothly from 0 to 1 between two edges. It is useful for vignettes, radial fades, hover masks, and procedural shape boundaries.

```glsl
float softMask = smoothstep(0.2, 0.8, value);
float softCircle = 1.0 - smoothstep(radius, radius + feather, distanceToCenter);
```

The first edge should be less than the second edge. Reversed or equal edges are undefined by GLSL and can produce unstable results. Clamp or normalize inputs if the effect's parameters can become invalid.

### 7. Remapping values

A remap converts a value from one range to another. The standard formula is `(value - inMin) / (inMax - inMin)`, then scaling into the output range. Guard against a zero-width input range.

```glsl
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  float denominator = max(inMax - inMin, 0.00001);
  float t = clamp((value - inMin) / denominator, 0.0, 1.0);
  return mix(outMin, outMax, t);
}
```

Use remapping when a noise value, distance, or angle must drive a parameter with a more useful range. A named helper is easier to review than repeating a long expression in several places.

### 8. Coordinate transforms

Many shader effects become simpler when the coordinate origin is moved to the center or a point of interest. Translation subtracts an origin; scaling changes the coordinate range; rotation changes orientation. Apply transforms in a deliberate order because they are generally not interchangeable.

```glsl
vec2 centered = vUv - 0.5;
float angle = 0.4;
mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
vec2 rotated = rotation * centered;
vec2 transformedUv = rotated + 0.5;
```

GLSL matrices are column-major, and constructor ordering can be surprising if you are used to row-major notation. Test with a simple line or grid before applying transforms to an image.

### 9. Periodic functions and phase

`sin` and `cos` are useful for repeating motion and patterns. Their input is measured in radians. A phase offset shifts the pattern, while frequency controls how quickly it repeats as the input coordinate changes.

```glsl
float wave = 0.5 + 0.5 * sin(vUv.x * uFrequency + uTime);
```

Keep frequency and time units conceptually separate. A high frequency can create detail that is smaller than a pixel, causing aliasing or flicker. Use lower frequencies, filtering, or a precomputed texture when necessary.

### 10. Numerical stability and epsilon

Shaders often divide values, normalize vectors, or use square roots. A zero-length vector or zero denominator can cause undefined or unstable output. A small epsilon can protect a denominator, but it should be chosen according to the scale of the problem rather than inserted everywhere without thought.

```glsl
float safeDivide(float numerator, float denominator) {
  return numerator / max(abs(denominator), 0.00001);
}

vec2 safeNormalize(vec2 value) {
  return value * inversesqrt(max(dot(value, value), 0.000001));
}
```

The `safeNormalize` example returns a zero vector for a zero input and avoids division by zero. For a nonzero vector, it behaves like normalization. Avoid adding an arbitrary epsilon to every formula; understand which inputs can actually become invalid.

### 11. Signed distance functions

A signed distance function (SDF) returns a distance-like value whose sign indicates whether a point is inside or outside a shape. For a circle centered at the origin, `length(p) - radius` is negative inside, zero at the boundary, and positive outside.

```glsl
float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}
```

SDFs are useful for procedural shapes, outlines, glows, and masks. A true distance field is especially valuable because the same value can produce a fill, border, shadow, or soft edge with different thresholds.

### 12. Derivatives for edge smoothing

On supported GLSL ES versions, `fwidth(x)` estimates how much a value changes across neighboring fragments. It can help anti-alias procedural boundaries at different resolutions.

```glsl
float d = sdCircle(centeredUv, 0.25);
float aa = fwidth(d);
float fill = 1.0 - smoothstep(-aa, aa, d);
```

Derivative functions require the relevant GLSL extension or shader version. They may be unavailable in older WebGL 1 configurations unless the extension is enabled. Provide a fallback using a fixed feather width if your target environment does not support derivatives.

## Reusable Math Patterns

### Pattern 1: A safe remap helper

**Use when:** A normalized input must drive a parameter over a custom range.

```glsl
float remapClamped(
  float value,
  float inputMin,
  float inputMax,
  float outputMin,
  float outputMax
) {
  float width = max(inputMax - inputMin, 0.00001);
  float t = clamp((value - inputMin) / width, 0.0, 1.0);
  return mix(outputMin, outputMax, t);
}
```

Use this for distance falloff, scroll progress, hue phase, and animation controls. If reverse mapping is required, define it explicitly instead of relying on `inputMax < inputMin`, which this helper does not support.

### Pattern 2: Aspect-correct radial coordinates

**Use when:** A circle, ripple, vignette, or lens should appear circular on a non-square surface.

```glsl
vec2 toAspectSpace(vec2 uv, float aspect) {
  vec2 p = uv - 0.5;
  p.x *= aspect;
  return p;
}
```

Use the displayed width divided by height for `aspect`. If your UVs have already been cropped or transformed, make sure the aspect corresponds to the actual displayed mapping rather than the original file dimensions.

### Pattern 3: Soft radial mask

**Use when:** You need a smooth circle, spotlight, or radial reveal.

```glsl
float radialMask(vec2 uv, vec2 center, float radius, float feather) {
  float d = distance(uv, center);
  float safeFeather = max(feather, 0.0001);
  return 1.0 - smoothstep(radius, radius + safeFeather, d);
}
```

This mask is 1 inside the radius and fades to 0 outside it. For a screen-space circle, transform UVs to aspect-correct coordinates before calculating the distance.

### Pattern 4: Rotation around an arbitrary point

**Use when:** You want to rotate UVs around the center of an image or a custom pivot.

```glsl
vec2 rotateAround(vec2 point, vec2 pivot, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  mat2 rotation = mat2(c, -s, s, c);
  return rotation * (point - pivot) + pivot;
}
```

The order is important: translate the pivot to the origin, rotate, then translate back. For texture sampling, clamp or mask the resulting UVs if rotated coordinates leave the original image bounds.

### Pattern 5: Smooth pulse and eased progress

**Use when:** A value should rise and fall smoothly or follow a transition.

```glsl
float smoothPulse(float x, float start, float peak, float end) {
  float rise = smoothstep(start, peak, x);
  float fall = 1.0 - smoothstep(peak, end, x);
  return rise * fall;
}
```

Ensure `start < peak < end`. This pattern is useful for a glow, a short-lived highlight, or an effect triggered by normalized time. If the input can be outside the intended interval, clamp it before passing it into the helper.

### Pattern 6: SDF fill and outline

**Use when:** A procedural shape needs a fill and a crisp, resolution-aware border.

```glsl
float sdCircle(vec2 p, float radius) {
  return length(p) - radius;
}

void circleLayers(vec2 p, float radius, float outlineWidth,
                  out float fill, out float outline) {
  float d = sdCircle(p, radius);
  float aa = max(fwidth(d), 0.0001);
  fill = 1.0 - smoothstep(-aa, aa, d);
  float outer = 1.0 - smoothstep(outlineWidth - aa, outlineWidth + aa, abs(d));
  outline = outer * fill;
}
```

This example relies on derivatives. For environments without derivative support, pass a small fixed anti-alias width appropriate to the render resolution. Check the outline formula against the desired inside/outside convention and adjust it for thick borders.

## Advanced Patterns

### 1. Visualize a scalar field before using it

**Use when:** A math expression is difficult to debug or tune.

Map the scalar into grayscale before combining it with color or lighting. This makes the range and shape of the field obvious.

```glsl
float value = clamp(yourScalarValue, 0.0, 1.0);
gl_FragColor = vec4(vec3(value), 1.0);
```

Replace `yourScalarValue` with the expression being tested. Inspect the result at several parameter values. Once the field is correct, restore the final color logic. This simple diagnostic technique often saves more time than changing multiple constants at once.

### 2. Derivative-aware procedural lines

**Use when:** A grid or thin line pattern must remain stable across different resolutions.

```glsl
float gridLine(float coordinate, float lineWidth) {
  float cell = abs(fract(coordinate) - 0.5);
  float aa = max(fwidth(coordinate), 0.0001);
  return 1.0 - smoothstep(lineWidth, lineWidth + aa, cell);
}
```

This is a starting point for a repeating grid. Scale the coordinate by the desired number of cells before calling it. Very dense patterns can still alias; derivative smoothing helps but does not eliminate every sampling problem.

### 3. Domain warping with a bounded offset

**Use when:** A procedural pattern should feel organic without creating extreme coordinate changes.

```glsl
vec2 warpUv(vec2 uv, float time, float strength) {
  vec2 wave = vec2(
    sin(uv.y * 8.0 + time),
    cos(uv.x * 7.0 - time * 0.8)
  );
  return uv + wave * clamp(strength, 0.0, 0.05);
}
```

Bound the warp strength so the effect remains stable. If the coordinates are used for texture sampling, clamp or fade at the boundaries. Domain warping is a general-purpose technique for noise, water, heat distortion, and abstract backgrounds.

### 4. Combine masks without accidental over-brightening

**Use when:** Two effects should both influence a region, but their sum should not exceed the intended range.

```glsl
float unionMask(float a, float b) {
  return max(clamp(a, 0.0, 1.0), clamp(b, 0.0, 1.0));
}

float intersectionMask(float a, float b) {
  return clamp(a, 0.0, 1.0) * clamp(b, 0.0, 1.0);
}
```

Use `max` for a simple union and multiplication for a simple intersection. These are not the only possible mask-combination rules; choose the operation that matches the visual meaning. Adding masks is also valid when additive energy is intended, but clamp the result if it feeds a normalized blend.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Confusing component-wise multiplication with dot product | Produces a vector where a scalar alignment is needed | Use `dot(a, b)` for alignment |
| Forgetting `mix` can extrapolate | Values outside 0–1 may create unexpected output | Clamp the factor when blending should be bounded |
| Using equal or reversed `smoothstep` edges | The result is undefined or unstable | Ensure `edge0 < edge1` |
| Measuring circular effects directly in stretched UVs | Circles become ellipses | Apply aspect correction before distance calculations |
| Dividing by a value that can be zero | Creates NaNs or unstable output | Guard the denominator with a meaningful epsilon |
| Normalizing a zero vector | Direction is undefined | Check magnitude or use a safe normalization helper |
| Using very high procedural frequency | Produces aliasing and flicker | Lower frequency, smooth with derivatives, or use a filtered texture |
| Applying SDF math without checking sign convention | Fill and outline appear inverted | Visualize the distance field in grayscale |
| Mixing coordinate spaces | Lighting and masks shift unpredictably | Name and document world-, view-, object-, and UV-space values |
| Tweaking many constants at once | Makes cause and effect difficult to identify | Visualize one intermediate field at a time |

## Performance and Production Checklist

1. Use built-in vector operations instead of expanding equivalent scalar math unnecessarily.
2. Keep helper functions small and name them after their mathematical purpose.
3. Clamp user-controlled values at the application boundary.
4. Use aspect-correct coordinates for radial effects on non-square surfaces.
5. Guard divisions and normalizations only where invalid inputs are possible.
6. Avoid very high-frequency trigonometric patterns on large screen areas.
7. Use derivative-based anti-aliasing only when supported by the shader version and target devices.
8. Visualize intermediate values as grayscale before integrating a complex effect.
9. Keep coordinate spaces explicit and consistent.
10. Profile multi-sample or multi-octave patterns on mobile hardware.
11. Document expected input ranges for reusable helpers.
12. Verify the final result in the actual Three.js renderer and color pipeline.

## Mental Models

1. **Vectors are structured data:** Component-wise operations and dot products solve different problems.
2. **Interpolation is a controlled blend:** `mix` does not clamp its factor for you.
3. **Thresholds shape boundaries:** Use `step` for hard edges and `smoothstep` for eased transitions.
4. **Coordinates define the math:** Transform to the space where the desired shape is easiest to express.
5. **Distance fields encode shape:** One signed value can drive fill, outline, glow, and shadow.
6. **Epsilon is a guard, not magic:** Choose it based on the scale and failure mode.
7. **Debugging starts with visualization:** A grayscale field often reveals the problem before color does.

## Quick Reference

| Need | GLSL tool | Typical use |
|---|---|---|
| Alignment | `dot(a, b)` | Lighting, Fresnel, direction masks |
| Magnitude | `length(v)` | Radial effects, distance fields |
| Separation | `distance(a, b)` | Pointer influence, circles |
| Blend | `mix(a, b, t)` | Color and material transitions |
| Hard threshold | `step(edge, x)` | Binary masks and cutouts |
| Soft threshold | `smoothstep(a, b, x)` | Feathered edges and fades |
| Range conversion | Custom `remap` | Mapping noise or progress |
| Rotation | `mat2(c, -s, s, c)` | UV transforms |
| Periodic pattern | `sin`, `cos`, `fract` | Waves and repeating bands |
| Safe denominator | `max(abs(x), epsilon)` | Stable division |
| Shape boundary | Signed distance function | Procedural shapes and outlines |
| Edge anti-aliasing | `fwidth` | Resolution-aware masks |

## Build Challenge

Create a reusable **GLSL Math Playground** with interactive controls that let a viewer explore core shader operations.

### Requirements

1. Render a full-screen plane or a simple Three.js mesh using a custom fragment shader.
2. Add selectable demonstrations for dot product, radial distance, interpolation, smooth threshold, UV rotation, periodic waves, and an SDF circle.
3. Show each demonstration as a grayscale field before applying color.
4. Expose controls for frequency, radius, feather width, rotation angle, and interpolation progress where relevant.
5. Keep all controls bounded and prevent invalid `smoothstep` ranges or zero denominators.
6. Include aspect correction for radial patterns.
7. Add a small code panel or documentation section explaining the active formula and its inputs.
8. Provide a reduced-motion option for time-based patterns.
9. Test the playground on at least two viewport aspect ratios and one mobile device.
10. Document any use of derivatives and provide a fallback for unsupported targets.

### Success criteria

- Each math operation has an obvious, interpretable visual result.
- Changing a control updates uniforms without rebuilding the material.
- Radial shapes remain proportionate across viewport sizes.
- No visible instability occurs at zero values or boundary conditions.
- The playground explains the formula rather than only showing a visual trick.
- The result can serve as a reference for future shader projects.

### Suggested implementation sequence

1. Create the basic shader plane and confirm UV orientation.
2. Add one operation at a time and visualize its output in grayscale.
3. Build bounded uniforms and reusable helper functions.
4. Add aspect correction and safe edge handling.
5. Add derivative-aware smoothing with a fallback.
6. Create controls and connect them to uniform updates.
7. Test edge cases, different aspect ratios, and mobile performance.
8. Write short explanations for each demo and package the playground.
