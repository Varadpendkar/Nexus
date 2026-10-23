# SKILL: glsl-raymarching

**Layer:** 07 — GLSL & Shader Programming

**Goal:** Build, debug, and optimize real-time raymarching shaders in GLSL, including signed distance functions (SDFs), camera rays, surface normals, lighting, shadows, reflections, and practical integration into Three.js.

## Why This Matters (Senior Perspective)

Raymarching lets a fragment shader render shapes described by mathematical distance functions rather than meshes. It is especially useful for procedural scenes, abstract hero backgrounds, product-like renders, impossible geometry, and animated forms that would be cumbersome to model conventionally. Because the scene is evaluated per pixel, the artist can combine geometry, repetition, deformation, and lighting in a compact shader.

The trade-off is cost and numerical sensitivity. A raymarcher may evaluate dozens or hundreds of distance samples for every pixel. Small mistakes in the distance estimator, camera basis, step size, normal calculation, or maximum distance can cause holes, flicker, banding, or severe performance drops. A good implementation begins with conservative, understandable functions and a debug view before adding visual complexity.

Treat raymarching as a controlled numerical process, not a magic loop. The distance function answers how far a point is from a surface (or estimates that distance); the march advances along a ray; a hit test decides when the ray is close enough; and the normal and lighting stages turn the hit point into a visible surface. Each stage should be independently testable.

## Core Concepts

### 1. The raymarching loop

A camera ray begins at origin `ro` and travels in normalized direction `rd`. At each step, evaluate the scene distance at the current point, then advance by that distance. For a reliable signed distance function, this step does not cross the nearest surface.

```glsl
const int MAX_STEPS = 100;
const float MAX_DIST = 80.0;
const float SURF_DIST = 0.001;

float raymarch(vec3 ro, vec3 rd) {
    float travel = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        vec3 p = ro + rd * travel;
        float d = sceneSDF(p);

        if (d < SURF_DIST) {
            return travel;
        }

        travel += d;

        if (travel > MAX_DIST) {
            break;
        }
    }

    return -1.0;
}
```

`sceneSDF` is the scene's distance function, defined in a later section. A negative return value means no hit within the permitted distance. In GLSL ES, loop bounds are often best kept compile-time constant for broad compatibility. Do not use an unconstrained loop: the shader must have a known upper bound.

The code assumes `sceneSDF` returns a safe distance estimate for the raymarching step. Some deformed or combined distance estimators are not exact SDFs, so they may require a conservative step factor such as `travel += d * 0.8`. Smaller steps reduce missed surfaces but increase the number of evaluations.

### 2. Signed distance functions

A signed distance function (SDF) returns a distance to a shape's surface. Conventionally, values are positive outside, approximately zero on the surface, and negative inside. For simple primitives, the distance is exact; for more complex or deformed scenes, the function may be an approximation.

A sphere SDF is the essential starting point:

```glsl
float sdSphere(vec3 p, float radius) {
    return length(p) - radius;
}
```

A box SDF supports axis-aligned rectangular solids:

```glsl
float sdBox(vec3 p, vec3 halfSize) {
    vec3 q = abs(p) - halfSize;
    return length(max(q, 0.0))
         + min(max(q.x, max(q.y, q.z)), 0.0);
}
```

The `halfSize` parameter is half the full width, height, and depth. The formula measures distance to the outside corners when outside the box, and returns a negative value inside.

A torus SDF is useful for rings:

```glsl
float sdTorus(vec3 p, vec2 radii) {
    vec2 q = vec2(length(p.xz) - radii.x, p.y);
    return length(q) - radii.y;
}
```

Here `radii.x` is the major radius from the center to the tube center, and `radii.y` is the tube radius.

### 3. Combining shapes

The simplest union takes the minimum of two distance values. Intersection and subtraction can be formed with maximum operations and sign changes.

```glsl
float opUnion(float a, float b) {
    return min(a, b);
}

float opIntersection(float a, float b) {
    return max(a, b);
}

float opSubtraction(float a, float b) {
    return max(a, -b);
}
```

Example scene:

```glsl
float sceneSDF(vec3 p) {
    float sphere = sdSphere(p - vec3(-0.65, 0.0, 0.0), 0.7);
    float box = sdBox(p - vec3(0.55, 0.0, 0.0), vec3(0.55));
    return opUnion(sphere, box);
}
```

These hard operations create crisp edges. Smooth unions blend the transition, but their distance values and gradient behavior need to be understood; they are not interchangeable with `min` in every calculation. When composing scenes, keep coordinate transforms and material IDs in mind: the nearest distance alone does not identify which material should color the hit.

### 4. Camera rays and coordinate spaces

For a fullscreen fragment shader, use normalized screen coordinates and build a camera ray. The camera origin is `ro`; the ray direction is `rd`. A simple camera looks toward a target point:

```glsl
vec3 cameraRay(vec2 uv, vec3 ro, vec3 target, float focalLength) {
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);

    return normalize(uv.x * right + uv.y * up + focalLength * forward);
}
```

Before calling this function, center the coordinates and correct for aspect ratio:

```glsl
vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
```

This keeps the vertical scale stable when the viewport changes. `focalLength` controls field of view in this simplified model: larger values make the view narrower. If the camera direction is nearly parallel to the chosen world-up vector, the cross product can become close to zero. For arbitrary camera orientations, use a camera basis derived from a stable up vector or pass the basis from JavaScript.

### 5. Surface normals

An SDF normal can be approximated by finite differences: sample the distance field a small amount along each axis and estimate the gradient.

```glsl
vec3 estimateNormal(vec3 p) {
    const float e = 0.001;
    vec2 h = vec2(e, 0.0);

    return normalize(vec3(
        sceneSDF(p + vec3(h.x, h.y, h.y)) -
        sceneSDF(p - vec3(h.x, h.y, h.y)),
        sceneSDF(p + vec3(h.y, h.x, h.y)) -
        sceneSDF(p - vec3(h.y, h.x, h.y)),
        sceneSDF(p + vec3(h.y, h.y, h.x)) -
        sceneSDF(p - vec3(h.y, h.y, h.x))
    ));
}
```

The central-difference approach takes six scene evaluations per normal. That cost matters when the scene SDF is already expensive. The epsilon should be large enough to avoid floating-point noise but small enough to capture local curvature. A tetrahedral normal estimator can reduce the number of samples, but begin with the clearer central-difference version when correctness is the priority.

### 6. Diffuse lighting and ambient fill

Lambertian diffuse lighting is based on the dot product between the surface normal and light direction. Clamp the result so back-facing light does not contribute negative brightness.

```glsl
float diffuse = max(dot(normal, normalize(lightPos - hitPoint)), 0.0);
vec3 color = baseColor * (0.12 + 0.88 * diffuse);
```

The constant term is an artistic ambient fill, not physically based global illumination. Without fill, surfaces facing away from the light become black, which may hide the shape. More advanced scenes can add specular highlights, ambient occlusion, soft shadows, or environment reflections, but each effect increases cost and complexity.

### 7. Misses, clipping, and hit thresholds

A ray can miss all geometry, or it can reach `MAX_DIST` without finding a hit. Give misses an intentional background color. Do not treat the `-1.0` miss sentinel as a surface distance.

The hit threshold is measured in scene-space units. A value that is too large makes silhouettes look inflated and can cause detached details to merge. A value that is too small can produce extra iterations and unstable hits, especially at far distances. Tune `SURF_DIST` relative to the scene scale and inspect silhouette edges at the final output resolution.

## Reusable Patterns

### Pattern 1 — Minimal sphere raymarcher

This complete fragment shader renders a lit sphere on a dark background. It uses Shadertoy-style uniforms so it can be adapted to Three.js by declaring and updating the same uniforms.

```glsl
uniform vec3 iResolution;
uniform float iTime;

const int MAX_STEPS = 96;
const float MAX_DIST = 50.0;
const float SURF_DIST = 0.001;

float sdSphere(vec3 p, float radius) {
    return length(p) - radius;
}

float sceneSDF(vec3 p) {
    vec3 spherePosition = vec3(0.0, 0.0, 0.0);
    return sdSphere(p - spherePosition, 1.0);
}

float raymarch(vec3 ro, vec3 rd) {
    float travel = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        float d = sceneSDF(ro + rd * travel);

        if (d < SURF_DIST) return travel;

        travel += d;
        if (travel > MAX_DIST) break;
    }

    return -1.0;
}

vec3 estimateNormal(vec3 p) {
    const float e = 0.001;
    return normalize(vec3(
        sceneSDF(p + vec3(e, 0.0, 0.0)) - sceneSDF(p - vec3(e, 0.0, 0.0)),
        sceneSDF(p + vec3(0.0, e, 0.0)) - sceneSDF(p - vec3(0.0, e, 0.0)),
        sceneSDF(p + vec3(0.0, 0.0, e)) - sceneSDF(p - vec3(0.0, 0.0, e))
    ));
}

vec3 cameraRay(vec2 uv) {
    vec3 ro = vec3(0.0, 0.0, 4.0);
    vec3 target = vec3(0.0);
    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
    vec3 up = cross(right, forward);
    return normalize(uv.x * right + uv.y * up + 1.5 * forward);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 ro = vec3(0.0, 0.0, 4.0);
    vec3 rd = cameraRay(uv);

    float travel = raymarch(ro, rd);
    vec3 color = vec3(0.015, 0.02, 0.04);

    if (travel > 0.0) {
        vec3 p = ro + rd * travel;
        vec3 normal = estimateNormal(p);
        vec3 lightDir = normalize(vec3(-0.6, 0.8, 0.7));
        float diffuse = max(dot(normal, lightDir), 0.0);
        float specular = pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), 32.0);
        color = vec3(0.12, 0.45, 0.9) * (0.12 + 0.8 * diffuse)
              + vec3(1.0) * 0.35 * specular;
    }

    fragColor = vec4(color, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
```

The camera ray uses the centered, aspect-corrected coordinate system. The `travel > 0.0` test is safe here because the camera begins outside the sphere; if your scene can hit at zero distance, use an explicit hit flag or a negative miss sentinel consistently.

### Pattern 2 — Animated repeated objects

Space repetition makes a small distance function behave like a tiled scene. The modulo operation folds points into a repeating cell.

```glsl
vec3 repeatCell(vec3 p, vec3 period) {
    return mod(p + 0.5 * period, period) - 0.5 * period;
}

float repeatedScene(vec3 p) {
    vec3 q = repeatCell(p, vec3(2.4, 2.4, 2.4));
    float sphere = sdSphere(q, 0.65);

    // A small time-dependent offset changes the arrangement smoothly.
    vec3 shifted = q - vec3(0.0, 0.25 * sin(iTime), 0.0);
    float box = sdBox(shifted, vec3(0.35));

    return min(sphere, box);
}
```

The repetition is infinite in mathematical space, so the raymarcher's `MAX_DIST` bounds how much of it is visible. A repeated scene can produce discontinuities at cell boundaries if the geometry or animation is not periodic. Use periods larger than the shape's dimensions when separate objects are desired.

### Pattern 3 — Soft shadow raymarch

A simple soft-shadow approximation marches toward the light and tracks how close the ray gets to an occluder. This is not a physically exact shadow calculation, but it often gives procedural scenes depth.

```glsl
float softShadow(vec3 ro, vec3 rd, float minT, float maxT) {
    float result = 1.0;
    float t = minT;

    for (int i = 0; i < 48; i++) {
        float h = sceneSDF(ro + rd * t);

        if (h < 0.001) return 0.0;

        result = min(result, 10.0 * h / max(t, 0.001));
        t += clamp(h, 0.02, 0.25);

        if (t >= maxT) break;
    }

    return clamp(result, 0.0, 1.0);
}
```

Call this from a hit point offset along the normal, with `rd` pointing toward the light. The origin offset reduces self-shadowing (shadow acne). The loop adds work per shaded hit, so use fewer steps or disable soft shadows on lower-power devices.

### Pattern 4 — Ambient occlusion from the distance field

A lightweight SDF ambient-occlusion approximation samples the distance field at increasing distances along the normal. If nearby geometry is closer than expected, reduce the occlusion value.

```glsl
float ambientOcclusion(vec3 p, vec3 normal) {
    float occ = 0.0;
    float weight = 1.0;

    for (int i = 1; i <= 5; i++) {
        float h = 0.06 * float(i);
        float d = sceneSDF(p + normal * h);
        occ += (h - d) * weight;
        weight *= 0.55;
    }

    return clamp(1.0 - 1.4 * occ, 0.0, 1.0);
}
```

This is an artistic approximation, not a substitute for true global illumination. Tune sample spacing and strength to the scale of the scene. Strong AO can make cavities muddy and can amplify inaccuracies in the distance field.

### Pattern 5 — Debug the number of march steps

Visualizing step count helps identify expensive regions and missed surfaces.

```glsl
float raymarchDebug(vec3 ro, vec3 rd, out float stepRatio) {
    float travel = 0.0;
    stepRatio = 0.0;

    for (int i = 0; i < MAX_STEPS; i++) {
        float d = sceneSDF(ro + rd * travel);
        stepRatio = float(i + 1) / float(MAX_STEPS);

        if (d < SURF_DIST) return travel;
        travel += d;
        if (travel > MAX_DIST) break;
    }

    return -1.0;
}
```

Use `stepRatio` to color pixels, for example `vec3(stepRatio, 0.2, 1.0 - stepRatio)`. Keep debug outputs behind a uniform or temporary shader variant so they do not remain in the production rendering path.

## Advanced Patterns

### Transform the object instead of the SDF

To rotate or translate an object, transform the query point before evaluating its SDF. Translation is a subtraction from the point; rotation uses the inverse transform so the object appears to move in the desired direction.

```glsl
mat2 rotate2D(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
}

float animatedSphere(vec3 p) {
    vec3 q = p;
    q.xz = rotate2D(0.35 * iTime) * q.xz;
    q.y -= 0.2 * sin(iTime * 1.4);
    return sdSphere(q, 0.8);
}
```

A sphere is rotationally symmetric, so rotating it has no visible effect; use the same transform with a box, torus, or composed scene to see the result. For non-uniform scaling, distance values generally need a conservative correction. Uniform scaling is easier: scale the query point and scale the resulting distance back by the same uniform factor.

### Smooth union

A smooth union rounds the transition between two objects. The blend radius controls how broad the join becomes.

```glsl
float smoothUnion(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}
```

Use a positive `k` that is appropriate to the scene scale. If `k` is zero or extremely small, the division becomes unstable; guard or constrain it when the value can be user-controlled. Smooth unions can alter the apparent shape and material boundaries, so treat the blend as part of the design rather than a free visual upgrade.

### Reflections and secondary rays

A mirror-like reflection launches a second ray from the hit point in the reflected view direction. At minimum, offset the origin along the surface normal and limit the bounce count.

```glsl
vec3 reflectedDirection = reflect(rd, normal);
vec3 reflectedOrigin = hitPoint + normal * (SURF_DIST * 4.0);
```

The reflected ray needs its own bounded march. Multiple bounces multiply the work, and recursive functions are not a safe assumption in GLSL ES. Implement a small fixed number of bounces with an explicit loop, or begin with a single reflection blended into the base surface color. For polished results, account for roughness and avoid treating every reflection as perfectly sharp.

### Distance estimators are not always exact SDFs

A true SDF gives a reliable distance to the nearest surface. Fractals, domain warps, and some procedural formulas often provide only a distance estimator. Advancing by the full estimate can overshoot a surface. Use a conservative step factor, tune the hit threshold, and inspect artifacts at grazing angles. Do not assume every function named `map`, `dist`, or `sceneSDF` is mathematically exact.

### Three.js integration notes

A fullscreen raymarcher is usually easiest to run in a `ShaderMaterial` on a clip-space quad. Provide uniforms such as `iResolution`, `iTime`, and camera parameters explicitly. If using `gl_FragCoord`, keep the resolution uniform synchronized with the drawing buffer. If using a mesh's `vUv`, remember that the coordinate system differs from Shadertoy's pixel coordinates.

For a GLSL 1-style `ShaderMaterial`, the fragment entry point can call `mainImage(gl_FragColor, gl_FragCoord.xy)`. For GLSL 3, use a declared output variable and configure the material's GLSL version consistently. Do not mix GLSL 1 texture calls and GLSL 3 output conventions.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Marching by a fixed tiny step | Wastes iterations and can miss distant geometry under a low step limit | Advance by the scene's distance estimate |
| Advancing by an unsafe distance estimator | The ray can step through a surface | Use a conservative multiplier and test grazing angles |
| Using an enormous `MAX_STEPS` everywhere | Fragment cost can become excessive | Start with a bounded budget and visualize step count |
| Forgetting `MAX_DIST` | Rays may waste work in empty space | Stop when travel exceeds the useful scene range |
| Using a hit threshold unrelated to scene scale | Surfaces look inflated or produce unstable hits | Tune `SURF_DIST` relative to object size and target resolution |
| Computing normals with a huge epsilon | Small details disappear | Use a scale-aware finite-difference epsilon |
| Computing normals with an extremely tiny epsilon | Floating-point noise dominates | Increase epsilon until normals are stable |
| Using an unstable camera up vector | Camera basis can collapse | Choose a stable basis or pass camera vectors from JavaScript |
| Ignoring aspect ratio | Circles become ellipses and scene proportions distort | Center coordinates and divide by the appropriate resolution dimension |
| Using an unbounded loop | Compilation or runtime behavior may be unreliable | Use fixed upper bounds for WebGL compatibility |
| Adding shadows and AO before the base march works | Makes debugging and profiling harder | Validate geometry, normals, and diffuse light first |
| Treating `-1.0` miss as a valid distance | Produces incorrect hit shading | Use a consistent miss sentinel or explicit hit flag |
| Forgetting shader version conventions | The shader may fail to compile | Keep entry-point output and texture functions consistent |
| Running full-resolution raymarching on mobile without profiling | High fragment count magnifies every distance evaluation | Cap pixel ratio or render to a smaller target |

## Performance and Production Checklist

- [ ] Start with one primitive and a single diffuse light.
- [ ] Use a fixed maximum loop bound and a deliberate maximum travel distance.
- [ ] Ensure every scene function returns a safe distance estimate.
- [ ] Tune `SURF_DIST` relative to the scale of the scene.
- [ ] Keep the camera basis normalized and stable.
- [ ] Correct coordinates for aspect ratio.
- [ ] Visualize step counts before adding costly effects.
- [ ] Add shadows, AO, reflections, and secondary rays one at a time.
- [ ] Keep repeated distance-field calculations out of redundant branches where possible.
- [ ] Consider a reduced-resolution render target for expensive effects.
- [ ] Test on the weakest target device, not only a desktop GPU.
- [ ] Verify shader compile logs in every target browser.
- [ ] Keep GLSL version, texture calls, and fragment output conventions consistent.
- [ ] Update time and resolution uniforms from the host application.
- [ ] Remove debug modes or gate them behind explicit uniforms.
- [ ] Dispose of owned materials, geometries, render targets, and textures during cleanup.

## Mental Models

1. **The SDF is the scene:** The raymarcher only knows the distance function you give it; missing or incorrect geometry in the function cannot be fixed by lighting.
2. **Distance controls progress:** A safe distance estimate determines how far the ray can advance without crossing a surface.
3. **Every pixel pays the bill:** Marching, normal estimation, shadows, and AO all add fragment work, so debug and profile them separately.
4. **Normals are gradients:** They describe how the distance field changes around the hit point; finite differences approximate that change.
5. **Coordinate spaces are part of the algorithm:** Camera rays, object transforms, aspect correction, and resolution must agree.
6. **Approximation needs margin:** Non-exact distance estimators and finite precision require conservative steps and carefully chosen thresholds.
7. **Build from a known-good baseline:** Prove the ray, hit, normal, and basic light stages before layering on visual effects.

## Quick Reference

| Task | Core idea |
|---|---|
| Sphere | `length(p) - radius` |
| Box | Distance to the outside plus a negative interior term |
| Union | `min(a, b)` |
| Intersection | `max(a, b)` |
| Subtraction | `max(a, -b)` |
| Smooth union | Polynomial blend with a positive smoothing radius |
| Ray point | `ro + rd * travel` |
| Hit test | `d < SURF_DIST` |
| Stop condition | `travel > MAX_DIST` |
| Normal | Finite differences of `sceneSDF` |
| Diffuse | `max(dot(normal, lightDir), 0.0)` |
| Reflection direction | `reflect(rd, normal)` |
| Aspect-corrected screen coordinates | `(fragCoord - 0.5 * iResolution.xy) / iResolution.y` |
| Debug cost | Visualize iteration count or normalized step ratio |

## Build Challenge

### Project: Procedural SDF Showcase

Build a responsive fullscreen raymarching scene with three SDF primitives, one animated transform, and a minimal lighting model.

**Requirements**

1. Implement sphere, box, and torus distance functions.
2. Combine at least two shapes with union or subtraction.
3. Build a camera ray from aspect-corrected screen coordinates.
4. Implement a bounded raymarch loop with both a step limit and a maximum travel distance.
5. Estimate surface normals and add diffuse lighting.
6. Add a debug mode that visualizes the number of steps taken.
7. Add one optional effect—soft shadows, ambient occlusion, or a single reflection—behind a uniform.
8. Integrate the shader into Three.js and update time and resolution uniforms correctly.
9. Test at desktop and mobile viewport sizes; cap pixel ratio if necessary.
10. Document any distance-estimator approximation and the reason for the selected thresholds.

**Success criteria**

- The base scene renders without holes, runaway loops, or compile errors.
- The camera framing remains proportional when the viewport changes.
- Normals produce stable lighting without obvious flicker.
- The debug mode identifies expensive regions of the image.
- Optional effects can be disabled independently.
- The scene maintains acceptable performance on the weakest target device.
