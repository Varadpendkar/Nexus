# SKILL: glsl-raymarching
**Layer:** 06 — Three.js / WebGL
**Goal:** Build and optimize signed-distance-field raymarching shaders that render controllable 3D forms, lighting, shadows, and motion inside creative web experiences.

---

## Why This Matters (Senior Perspective)

Raymarching gives a creative developer a way to render forms that are awkward or expensive to model as conventional meshes: smooth unions, liquid-like transitions, procedural sculptures, impossible architecture, abstract hero objects, and infinitely detailed mathematical surfaces. Instead of sending a mesh made of triangles to the GPU, the fragment shader asks a mathematical scene description how far a point is from the nearest surface, then advances a ray through space until it reaches that surface. The result can feel bespoke and art-directed because the geometry itself is described by functions and parameters.

The senior-level difference is not simply writing a sphere-distance function. It is understanding the relationship between distance-field correctness, camera rays, step size, surface normals, lighting, and the fragment budget. A shader that looks convincing on one desktop can shimmer, leak through surfaces, or collapse into a hot laptop when the camera moves or the viewport grows. Incorrect distance estimates can make a ray step over thin features; excessive iteration counts waste GPU time; normals computed with an unstable epsilon produce noisy highlights; and a full-screen shader can silently become the most expensive part of a portfolio page.

For portfolio and freelance work, raymarching is best treated as a deliberately bounded visual effect. Use it for one signature hero, a contained shader panel, or a background motif with a graceful fallback—not automatically for every object. Define a performance budget, expose a small number of art-direction uniforms, and build a deterministic fallback. That makes the effect deliverable to a client rather than a fragile demo that only works on the developer's machine.

---

## Core Concepts

### 1. What Raymarching Actually Does

A rasterized mesh tells the GPU which triangles cover each pixel. A raymarching shader typically draws a full-screen triangle or plane, reconstructs a ray for each fragment, and evaluates a scene function along that ray. The function returns an estimate of the distance to the nearest surface. The shader advances by that distance and repeats until it reaches a surface closely enough or exceeds a maximum travel distance.

Think of walking through fog with a measuring stick that tells you how far the nearest wall is. If the measurement is a safe lower bound, you can advance by that amount without crossing the wall. A signed distance function (SDF) is positive outside a shape, zero on the surface, and negative inside it. A true SDF gives exact distance to the nearest point; many practical scene functions are only distance estimators, so their safe step size matters.

```glsl
// A sphere SDF returns signed distance from a point to the sphere surface.
float sdSphere(vec3 point, float radius) {
    // Subtracting radius moves the zero level-set onto the sphere surface.
    return length(point) - radius;
}

float sceneDistance(vec3 point) {
    // Keep the scene function independent from camera and lighting logic.
    return sdSphere(point, 1.0);
}
```

A minimal marcher repeatedly evaluates `sceneDistance`. The hit threshold is not a universal constant: it depends on scene scale, camera distance, precision, and visual requirements. A threshold that is too large creates a visibly inflated surface; one that is too small may never be reached due to floating-point precision.

```glsl
const int MAX_STEPS = 96;
const float MAX_DISTANCE = 40.0;
const float SURFACE_EPSILON = 0.001;

float marchRay(vec3 rayOrigin, vec3 rayDirection) {
    float travel = 0.0;
    for (int stepIndex = 0; stepIndex < MAX_STEPS; stepIndex++) {
        vec3 samplePoint = rayOrigin + rayDirection * travel;
        float distanceToScene = sceneDistance(samplePoint);

        // A near-zero distance means the ray has reached the implicit surface.
        if (distanceToScene < SURFACE_EPSILON) return travel;
        // Far-away fragments should stop spending work on an empty scene.
        if (travel > MAX_DISTANCE) break;

        // A conservative SDF step avoids skipping over the surface.
        travel += max(distanceToScene, SURFACE_EPSILON * 0.5);
    }
    return -1.0;
}
```

**Naive approach:** Increment the ray by a fixed amount such as `travel += 0.1`. It may work for a sphere at one scale but can tunnel through thin surfaces or require thousands of steps to cross empty space.

**Correct approach:** Use a trustworthy distance estimator, bounded iterations, a surface threshold, and a maximum travel distance. Keep the scene function mathematically testable outside the march loop.

**Gotcha:** A function that looks like an SDF is not necessarily a safe SDF after arbitrary domain warping, repetition, or scaling. Those operations may require distance correction.

### 2. Coordinate Spaces and Ray Construction

Every fragment needs a ray origin and direction expressed in the same coordinate space as the scene function. Many introductory shaders use camera-relative coordinates and a fixed camera at the origin. For a more flexible Three.js integration, inverse projection and inverse view matrices can reconstruct a world-space ray. Mixing world-space camera rays with object-space SDFs produces offsets, strange scaling, and camera motion that appears disconnected from the object.

For a simple shader-only camera, normalize screen coordinates to account for aspect ratio. Without aspect correction, a sphere becomes an ellipse on non-square screens. Field of view controls how wide the ray fan is; it is not the same as scaling the object. A camera ray is a normalized direction so that `travel` remains a meaningful distance.

```glsl
vec3 makeCameraRay(vec2 fragmentUv, vec2 resolution, float verticalFovRadians) {
    // Center coordinates around the optical axis and preserve pixel aspect ratio.
    vec2 screen = (fragmentUv * resolution - 0.5 * resolution) / resolution.y;
    float focalLength = 1.0 / tan(verticalFovRadians * 0.5);
    return normalize(vec3(screen, -focalLength));
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec3 rayOrigin = vec3(0.0, 0.0, 4.0);
    vec3 rayDirection = makeCameraRay(uv, uResolution, radians(45.0));
    float hitDistance = marchRay(rayOrigin, rayDirection);
    // Use hitDistance to choose shaded surface color or background color.
}
```

The formula above is a compact camera model, not a replacement for a full perspective matrix in every pipeline. In Three.js, the camera can be moved, rotated, and resized, so either pass consistent camera uniforms or reconstruct rays using the inverse projection and view matrices. Decide explicitly whether the SDF scene lives in world space or in a local shader space.

**Naive approach:** Use `gl_FragCoord.xy / uResolution` as if UV coordinates were already centered and aspect-corrected.

**Correct approach:** Center the screen, divide by the correct dimension, normalize the ray, and keep the ray and SDF coordinate spaces consistent.

**Gotcha:** WebGL render targets, CSS pixel sizes, drawing-buffer sizes, and device pixel ratio can differ. Pass the dimensions corresponding to the shader's actual fragment coordinates.

### 3. Signed Distance Functions for Primitive Shapes

An SDF is a scalar function whose zero contour defines a surface. The sign tells whether a point is outside or inside, while the magnitude estimates distance to the surface. The simplest useful primitives are spheres, boxes, rounded boxes, tori, and capsules. Each primitive becomes a composable building block, like a function in a small geometry language.

A box SDF combines the distance outside the box with the maximum signed distance inside it. A capsule measures distance to the closest point on a line segment and subtracts a radius. These formulations let a shader describe a product-like sculpture without uploading vertices. Keep primitive functions small and named; scene functions should express composition rather than repeat equations.

```glsl
float sdBox(vec3 point, vec3 halfSize) {
    vec3 q = abs(point) - halfSize;
    // Outside distance comes from the positive components; inside uses the largest negative component.
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdRoundedBox(vec3 point, vec3 halfSize, float radius) {
    // Shrink the base box, then expand its surface by the rounding radius.
    return sdBox(point, halfSize - radius) - radius;
}

float sdCapsule(vec3 point, vec3 segmentStart, vec3 segmentEnd, float radius) {
    vec3 segment = segmentEnd - segmentStart;
    float segmentLengthSquared = dot(segment, segment);
    float alongSegment = clamp(dot(point - segmentStart, segment) / segmentLengthSquared, 0.0, 1.0);
    return length(point - (segmentStart + alongSegment * segment)) - radius;
}
```

**Naive approach:** Approximate a box by combining three independent plane distances with `min`. That produces the wrong corner distances and can create unsafe marching steps.

**Correct approach:** Use the established SDF formula and validate primitives visually at multiple scales and from grazing angles.

**Gotcha:** The capsule formula divides by segment length squared. If the endpoints are identical, guard against a zero-length segment or use a sphere SDF instead.

### 4. Boolean Composition: Union, Intersection, and Subtraction

SDF composition behaves like constructive solid geometry. `min(a, b)` creates a union, `max(a, b)` creates an intersection, and `max(a, -b)` subtracts shape B from shape A. This is powerful because a scene can be assembled from independent functions without generating a mesh. The composition function should remain readable enough that the artist can reason about which object controls a given region.

```glsl
float sdTorus(vec3 point, vec2 radii) {
    vec2 q = vec2(length(point.xz) - radii.x, point.y);
    return length(q) - radii.y;
}

float sceneDistance(vec3 point) {
    float body = sdRoundedBox(point, vec3(0.85, 0.55, 0.45), 0.12);
    vec3 ringPoint = point - vec3(0.0, 0.25, 0.0);
    float ring = sdTorus(ringPoint, vec2(0.62, 0.09));

    // min selects the nearest surface and creates a union of the two forms.
    float joinedBody = min(body, ring);
    float cutout = sdSphere(point - vec3(0.0, 0.0, 0.5), 0.28);
    // Negating the cutout distance turns its inside into a subtraction boundary.
    return max(joinedBody, -cutout);
}
```

Hard booleans create sharp transitions. This can be desirable for machined or architectural forms, but smooth blends often read better for organic hero objects. Do not smooth every union by default: smoothing changes the shape, can close gaps, and affects how materials should be assigned.

**Naive approach:** Nest a long chain of `min` and `max` expressions without naming intermediate forms. It becomes hard to debug and impossible to art-direct safely.

**Correct approach:** Name the body, attachments, and cutters separately; then compose them in a scene function with comments describing the intended relationship.

**Gotcha:** The simplest boolean composition may preserve a useful distance bound, but later smooth operations and nonuniform transforms need additional care.

### 5. Smooth Minimum and Organic Blending

A smooth minimum replaces the hard seam between two SDFs with a rounded blend. The blend radius controls how broadly the objects merge. This is a core technique for liquid chrome, soft industrial product forms, and abstract portfolio sculptures. The parameter should be exposed as a uniform so art direction can adjust it without recompiling shader source.

```glsl
float smoothMin(float distanceA, float distanceB, float blendRadius) {
    // Clamp the blend weight so distant surfaces retain the ordinary minimum behavior.
    float blend = max(blendRadius - abs(distanceA - distanceB), 0.0) / blendRadius;
    return min(distanceA, distanceB) - blend * blend * blendRadius * 0.25;
}

float sceneDistance(vec3 point) {
    float centralOrb = sdSphere(point, 0.7);
    float satelliteOrb = sdSphere(point - vec3(0.7, 0.15, 0.0), 0.42);
    return smoothMin(centralOrb, satelliteOrb, uBlendRadius);
}
```

The exact smooth-min variant matters: polynomial smooth-min, exponential smooth-min, and other formulations have different profiles and distance properties. Avoid passing zero as the blend radius because division by zero is undefined. Clamp the uniform to a small positive value on the CPU and in shader logic.

**Naive approach:** Use a huge blend radius to hide bad object placement. The result may lose the identity of each form and produce a swollen silhouette.

**Correct approach:** Place primitives intentionally, use the smallest blend radius that achieves the desired seam, and inspect silhouette changes as well as highlights.

**Gotcha:** The returned value is not always an exact signed distance in the blended region. Conservative stepping may be needed for more complicated compositions.

### 6. Domain Transforms: Move, Rotate, and Scale the SDF

A common trick is to transform the sample point before evaluating the shape. Moving a shape is accomplished by subtracting its position from the point. Rotation applies the inverse rotation to the point. This is conceptually different from transforming a mesh: the shader transforms the query coordinates, then evaluates a fixed shape in its own local space.

```glsl
mat3 rotationY(float angle) {
    float cosine = cos(angle);
    float sine = sin(angle);
    return mat3(
        cosine, 0.0, -sine,
        0.0,    1.0,  0.0,
        sine,   0.0,  cosine
    );
}

float rotatedBoxDistance(vec3 worldPoint, float rotationAngle) {
    // Apply the inverse object rotation to the query so the box remains defined in local coordinates.
    vec3 localPoint = rotationY(-rotationAngle) * worldPoint;
    return sdBox(localPoint, vec3(0.6, 0.35, 0.25));
}

float scaledSphereDistance(vec3 point, float uniformScale) {
    // For uniform scaling, scale the returned distance as well as the input coordinates.
    return (length(point / uniformScale) - 1.0) * uniformScale;
}
```

For uniform scale, multiplying the distance by the scale restores the correct world-space distance. Nonuniform scaling is more difficult because a sphere becomes an ellipsoid and the transformed distance is no longer exact under a simple scalar correction. A common conservative approximation uses the smallest scale component, but it may overestimate work and change apparent thickness. Prefer analytic formulas for special shapes when accuracy is important.

**Naive approach:** Rotate the distance value instead of rotating the sample point. A scalar distance has no orientation to rotate.

**Correct approach:** Transform coordinates into the shape's local space, evaluate the local SDF, and correct the distance for scale where required.

**Gotcha:** GLSL matrix constructor values are column-major. Test rotation direction and matrix layout rather than assuming the rows are written in the intuitive order.

### 7. The March Loop: Epsilon, Step Limits, and Safety

The marcher is the main cost center. Each iteration evaluates the entire scene function, and each scene function may itself evaluate many primitives, smooth blends, repetitions, and deformations. The practical budget is therefore not just “number of steps”; it is steps multiplied by scene complexity and number of rendered fragments.

Use separate controls for maximum steps, maximum distance, and surface epsilon. Maximum steps bound worst-case work. Maximum distance prevents wasting iterations on background rays. Epsilon controls the hit threshold. A debug mode that displays iteration count helps distinguish a costly scene from an incorrect camera or SDF.

```glsl
struct MarchResult {
    float distance;
    float stepsUsed;
};

MarchResult marchScene(vec3 rayOrigin, vec3 rayDirection) {
    float travel = 0.0;
    float stepsUsed = 0.0;

    for (int stepIndex = 0; stepIndex < 128; stepIndex++) {
        vec3 samplePoint = rayOrigin + rayDirection * travel;
        float distanceToScene = sceneDistance(samplePoint);
        stepsUsed = float(stepIndex + 1);

        if (distanceToScene < uSurfaceEpsilon) {
            return MarchResult(travel, stepsUsed);
        }
        if (travel > uMaxDistance) break;

        // Clamp only the minimum advance to avoid stalls near floating-point noise.
        travel += max(distanceToScene * uStepSafety, uSurfaceEpsilon * 0.5);
    }

    return MarchResult(-1.0, stepsUsed);
}
```

The safety factor is useful when the scene function is a distance estimator rather than a mathematically exact SDF. A value below one takes smaller steps and can reduce missed surfaces, at the cost of more iterations. It is not a magic fix for invalid distance fields.

**Naive approach:** Raise the maximum loop count whenever a surface is missing. That can hide a broken SDF and destroy mobile performance.

**Correct approach:** Visualize distance and step count, verify the estimator, then tune epsilon and safety factor within a measured budget.

**Gotcha:** On some mobile GPUs, dynamic loop behavior and divergent branches can be expensive. A fixed upper loop bound with early exits is often easier to reason about across WebGL implementations.

### 8. Surface Normals from the Distance Field

Lighting requires a normal. For an implicit surface, the normal points along the gradient of the distance function. A practical approximation samples the SDF slightly to either side of the hit point along each axis, then normalizes the differences. This is called a finite-difference normal. The epsilon used for normal estimation is separate from the hit epsilon: it should be large enough to survive floating-point noise but small enough to capture local curvature.

```glsl
vec3 estimateNormal(vec3 surfacePoint) {
    // Four tetrahedral samples reduce scene evaluations compared with six axis samples.
    const float normalEpsilon = 0.0015;
    vec2 offsets = vec2(1.0, -1.0);
    return normalize(
        offsets.xyy * sceneDistance(surfacePoint + offsets.xyy * normalEpsilon) +
        offsets.yyx * sceneDistance(surfacePoint + offsets.yyx * normalEpsilon) +
        offsets.yxy * sceneDistance(surfacePoint + offsets.yxy * normalEpsilon) +
        offsets.xxx * sceneDistance(surfacePoint + offsets.xxx * normalEpsilon)
    );
}
```

Normals are expensive because every normal calculation evaluates the scene function several more times. If the scene contains many primitives, the normal may cost as much as multiple additional march steps. Use a consistent normal epsilon, and inspect the normal as RGB before debugging the lighting model.

**Naive approach:** Return `normalize(surfacePoint)` for every hit. That only works for a sphere centered at the origin and fails for boxes, unions, and deformed forms.

**Correct approach:** Estimate the gradient from nearby SDF samples or use an analytic normal for a primitive when it is practical and reliable.

**Gotcha:** Too-small normal epsilon causes noisy, sparkling specular highlights; too-large epsilon smooths corners and can make small features disappear.

### 9. Lighting: Diffuse, Specular, and Fresnel

A hit point and normal are not a finished image. The shader still needs a lighting model. Start with a directional key light, a diffuse term, a specular term, and a low ambient contribution. A Fresnel-like rim can help a sculptural form separate from a dark background, but should not be used to conceal poor composition or an unreadable silhouette.

```glsl
vec3 shadeSurface(vec3 point, vec3 normal, vec3 rayDirection) {
    vec3 lightDirection = normalize(vec3(-0.45, 0.8, 0.55));
    vec3 viewDirection = normalize(-rayDirection);
    vec3 halfDirection = normalize(lightDirection + viewDirection);

    float diffuse = max(dot(normal, lightDirection), 0.0);
    // Blinn-Phong is a simple art-direction baseline, not a physically based BRDF.
    float specular = pow(max(dot(normal, halfDirection), 0.0), 48.0);
    float fresnel = pow(1.0 - max(dot(normal, viewDirection), 0.0), 3.0);

    vec3 baseColor = vec3(0.12, 0.45, 0.72);
    vec3 ambientColor = vec3(0.025, 0.035, 0.06);
    vec3 keyColor = vec3(1.0, 0.82, 0.62);
    vec3 rimColor = vec3(0.12, 0.45, 1.0);

    return ambientColor + baseColor * diffuse * keyColor +
           vec3(0.85) * specular + rimColor * fresnel * 0.55;
}
```

This is a deliberately small model for learning and stylized art direction. For physically based integration, match the renderer's color space, exposure, and tone mapping. Keep lighting parameters in uniforms so designers can adjust intensity and color without rewriting the shader. A black background with a saturated rim can be visually striking, but verify the form at thumbnail size.

**Naive approach:** Add more lights and brighter colors until the form looks interesting. That can flatten the shape and clip highlights.

**Correct approach:** Establish readable diffuse form first, then add controlled specular and rim contributions with a clear hierarchy.

**Gotcha:** Shader colors are not automatically equivalent to CSS hex colors. Color-space conversion and tone mapping can shift the perceived result.

### 10. Shadows and Ambient Occlusion

Soft shadows can be approximated by marching from the surface toward a light and tracking how close the ray gets to another surface. Ambient occlusion (AO) samples the SDF at increasing offsets along the normal and estimates how much nearby geometry blocks the surrounding space. Both techniques add extra scene evaluations and can dominate the fragment cost.

```glsl
float softShadow(vec3 point, vec3 lightDirection, float minimumDistance, float maximumDistance) {
    float visibility = 1.0;
    float travel = minimumDistance;

    for (int shadowStep = 0; shadowStep < 32; shadowStep++) {
        float sceneGap = sceneDistance(point + lightDirection * travel);
        if (sceneGap < 0.001) return 0.0;

        // Small gaps indicate an occluder close to the shadow ray, so reduce visibility.
        visibility = min(visibility, 12.0 * sceneGap / travel);
        travel += clamp(sceneGap, 0.02, 0.25);
        if (travel >= maximumDistance) break;
    }

    return clamp(visibility, 0.0, 1.0);
}

float ambientOcclusion(vec3 point, vec3 normal) {
    float occlusion = 0.0;
    float weight = 1.0;
    for (int sampleIndex = 1; sampleIndex <= 5; sampleIndex++) {
        float sampleDistance = 0.035 * float(sampleIndex);
        float sceneGap = sceneDistance(point + normal * sampleDistance);
        occlusion += (sampleDistance - sceneGap) * weight;
        weight *= 0.62;
    }
    return clamp(1.0 - occlusion * 1.8, 0.0, 1.0);
}
```

These functions are approximations and their constants need tuning for scene scale. Do not turn them on at full quality before the base marcher is correct. On mobile, a lower-resolution shadow or AO pass, fewer samples, or no dynamic shadows may be the right design decision.

**Naive approach:** Calculate full soft shadows and AO for every fragment while still debugging the silhouette.

**Correct approach:** Add expensive secondary effects one at a time, measure GPU time, and expose quality tiers.

**Gotcha:** The shadow origin must be offset away from the surface along the normal to avoid self-shadowing acne. The offset should be proportional to scene scale.

### 11. Domain Repetition and Procedural Detail

Domain repetition makes a shape repeat through space by folding a coordinate into a repeating cell. It can create rows of pillars, sci-fi panels, abstract architecture, and repeating product-like details without instantiating geometry. Repetition is not free: every repeated element still contributes to the distance-field evaluation, and the repeated domain can create hard boundaries if not handled intentionally.

```glsl
vec3 repeatCell(vec3 point, vec3 cellSize) {
    // Fold space into the nearest cell; the scene function then evaluates one reusable object.
    return mod(point + 0.5 * cellSize, cellSize) - 0.5 * cellSize;
}

float repeatedPillars(vec3 point) {
    vec3 cellPoint = repeatCell(point, vec3(1.4, 2.8, 1.4));
    // The repetition domain is bounded by the ray's maximum travel and camera framing.
    return sdRoundedBox(cellPoint, vec3(0.16, 1.2, 0.16), 0.05);
}
```

Infinite repetition can make it difficult to understand which cell is being hit, and repeated geometry may appear to extend forever. Limit the ray distance, add a bounding region, or use a finite repetition count when the composition needs a defined edge. If you animate repetition, avoid abrupt changes to cell size that make the scene pop.

**Naive approach:** Repeat every primitive across all space and rely on the camera to hide it.

**Correct approach:** Bound the visible region, design the repetition period around the composition, and debug cell coordinates visually.

**Gotcha:** `mod` behavior for negative values can surprise you; use a centered folding formula and test negative coordinates.

### 12. Time-Based Deformation and Animation

A procedural shader should normally be a pure function of position and explicit uniforms such as time. That makes it deterministic, reproducible, and easier to debug. Use elapsed time to animate parameters or deform coordinates, not to accumulate hidden state inside the shader. If the effect is synchronized with scroll, pass normalized scroll progress rather than relying on frame count.

```glsl
float animatedSceneDistance(vec3 point) {
    // Low-amplitude deformation preserves the identity of the base SDF.
    vec3 warpedPoint = point;
    warpedPoint.y += sin(point.x * 2.2 + uTime * 0.7) * 0.045;
    warpedPoint.z += sin(point.y * 1.8 - uTime * 0.5) * 0.035;
    return sdSphere(warpedPoint, 0.82);
}
```

The above coordinate warp is visually useful but not distance-preserving. Its returned value is an estimator, so a safety factor may be needed. Large deformation amplitudes can break the silhouette and make the marcher take unsafe steps. Start with low amplitude, inspect the iteration heatmap, and only then increase complexity.

**Naive approach:** Increment an angle by a fixed amount every frame in JavaScript, causing animation speed to depend on refresh rate.

**Correct approach:** Use elapsed seconds or normalized progress as a uniform, and keep shader output deterministic for a given input.

**Gotcha:** A `uTime` value that grows indefinitely can lose precision in floating-point shader arithmetic. Wrap or reduce time for periodic motion when appropriate.

### 13. Three.js Shader Integration and Uniform Ownership

A raymarching shader can be used with a full-screen plane, a custom `ShaderMaterial`, or a raw WebGL pipeline. In Three.js, the simplest setup is a plane in front of a camera with a fragment shader that evaluates the implicit scene. The plane is only a carrier for the fragment shader; its geometry does not define the raymarched object. Keep uniforms in one JavaScript object and update values rather than replacing the entire uniform map each frame.

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const uniforms = {
  uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
  uTime: { value: 0 },
  uBlendRadius: { value: 0.25 },
  uSurfaceEpsilon: { value: 0.001 },
  uMaxDistance: { value: 30.0 },
  uStepSafety: { value: 0.8 }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    precision highp float;
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uBlendRadius;
    uniform float uSurfaceEpsilon;
    uniform float uMaxDistance;
    uniform float uStepSafety;
    void main() {
      // This fragment shader is the integration point for the SDF and march functions above.
      vec2 uv = gl_FragCoord.xy / uResolution;
      vec2 centered = (uv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
      vec3 rayOrigin = vec3(0.0, 0.0, 3.2);
      vec3 rayDirection = normalize(vec3(centered, -1.4));
      // Replace this illustrative background with the complete march/shade pipeline in production.
      float vignette = smoothstep(1.1, 0.15, length(centered));
      gl_FragColor = vec4(vec3(0.012, 0.018, 0.03) * vignette, 1.0);
    }
  `
});

const fullScreenPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(fullScreenPlane);
const clock = new THREE.Clock();

function resizeRenderer() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.uResolution.value.set(renderer.domElement.width, renderer.domElement.height);
}
window.addEventListener('resize', resizeRenderer);
function animate() {
  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
```

The example demonstrates uniform ownership and a full-screen carrier; the fragment shader intentionally marks where the complete scene functions are inserted rather than pretending the abbreviated shader already raymarches. For a complete application, put shader source in dedicated files or template strings, add lifecycle cleanup, and ensure the resolution uniform matches the drawing buffer. Avoid recreating `ShaderMaterial` on every React render because that recompiles or resets GPU state.

**Naive approach:** Allocate new uniform objects every frame or assume `window.innerWidth` always equals the drawing-buffer width.

**Correct approach:** Keep uniform objects stable, update their `.value`, and synchronize resolution with the renderer's actual dimensions.

**Gotcha:** GLSL compile errors often report line numbers inside concatenated shader source. Keep shader sections organized and inspect the final compiled source when debugging.

### 14. Performance, Debug Views, and Quality Tiers

Raymarching performance is driven by screen coverage, number of steps, SDF complexity, normal samples, shadow/AO samples, and precision. A fullscreen effect at 2× device pixel ratio can shade four times as many pixels as at 1×. A 100-step marcher that also calculates six normal samples and 32 shadow samples can be far more expensive than the headline loop count suggests.

Build debug outputs early. Useful modes include normal RGB, raw distance, iteration count, hit/miss, and surface epsilon. A step heatmap can show where rays are exhausting the budget. These views separate mathematical bugs from lighting and color-management issues. Add a low/medium/high quality selector that changes resolution scale, max steps, and secondary effects coherently.

```glsl
vec3 stepHeatmap(float stepCount, float maxSteps) {
    float normalizedSteps = clamp(stepCount / maxSteps, 0.0, 1.0);
    // Green means cheap rays; red means the shader is approaching its iteration budget.
    return mix(vec3(0.05, 0.8, 0.25), vec3(1.0, 0.08, 0.02), normalizedSteps);
}

vec3 debugOutput(vec3 normal, float stepsUsed, float maxSteps, float hitDistance) {
    if (uDebugMode == 1) return normal * 0.5 + 0.5;
    if (uDebugMode == 2) return stepHeatmap(stepsUsed, maxSteps);
    if (uDebugMode == 3) return hitDistance < 0.0 ? vec3(0.9, 0.0, 0.7) : vec3(0.0, 0.65, 1.0);
    return vec3(0.0);
}
```

Do not rely on FPS alone as the performance measure. FPS can stay high while the effect causes battery drain, device heating, or frame-time spikes during interaction. Use browser GPU profiling where available, test on representative hardware, and measure the actual page with the rest of the experience enabled.

**Naive approach:** Optimize only after the complete visual effect is finished.

**Correct approach:** Establish a budget early, keep debug modes in development builds, and add visual complexity only when measurements justify it.

**Gotcha:** `highp` fragment precision is not equally available or equally performant on every old mobile implementation. Test precision requirements and provide a simpler fallback when necessary.

### 15. Full Real-World Use Case: Raymarched Portfolio Hero

A premium portfolio hero might feature a smooth metallic sculpture floating beside a headline. The effect should be art-directed but not block the content or prevent a visitor from reaching projects. Keep the shader canvas behind the text, limit the object to a controlled region, use a restrained palette, and let reduced-motion preferences disable continuous deformation. The main layout should still work when WebGL fails or the device is underpowered.

The engineering plan is incremental: first render a primitive with correct camera rays; next add composition; then normals and lighting; then subtle deformation; finally add a quality tier and fallback. Capture a reference frame so visual changes can be compared during iteration. A deterministic shader makes screenshots and bug reports reproducible.

```js
function chooseRaymarchQuality({ width, height, reducedMotion, saveData }) {
  // Quality decisions should reflect both available pixels and user preference, not just device branding.
  if (reducedMotion || saveData || width < 480) {
    return { pixelRatio: 1, maxSteps: 56, shadows: false, ambientOcclusion: false };
  }
  if (width < 1024 || height < 700) {
    return { pixelRatio: 1.25, maxSteps: 80, shadows: false, ambientOcclusion: true };
  }
  return { pixelRatio: 1.5, maxSteps: 112, shadows: true, ambientOcclusion: true };
}

const mediaPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const connectionPreference = navigator.connection?.saveData === true;
const quality = chooseRaymarchQuality({
  width: window.innerWidth,
  height: window.innerHeight,
  reducedMotion: mediaPreference.matches,
  saveData: connectionPreference
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
```

A real implementation should also check WebGL availability, handle context loss, stop rendering when the hero is offscreen, and provide a static image or CSS background fallback. The page's heading and primary CTA must remain accessible independently of the canvas. Treat the shader as a layer in a web product, not as the whole product.

**Naive approach:** Make the shader full-screen, high-resolution, always animated, and essential to understanding the page.

**Correct approach:** Bound the effect, provide a content-first fallback, respect reduced motion, and test the hero on an average phone before shipping.

**Gotcha:** The `navigator.connection` API is not supported everywhere; optional chaining prevents crashes but does not replace a broader quality strategy.

---

## Raymarching Patterns for Creative Web Work

### Pattern 1: Debug-First SDF Development

**What it does:** Separates shape correctness from lighting and post-processing by giving the shader explicit debug outputs.

**When to use it:** Use whenever a new primitive, boolean, transform, or deformation is introduced; do not wait until the final render looks wrong.

```glsl
vec3 renderDebugSurface(vec3 point, vec3 normal, float travel, float stepsUsed) {
    if (uDebugMode == 1) return normal * 0.5 + 0.5;
    if (uDebugMode == 2) return vec3(fract(travel * 0.1), fract(travel * 0.03), 0.15);
    if (uDebugMode == 3) return vec3(stepsUsed / float(MAX_STEPS), 0.0, 1.0 - stepsUsed / float(MAX_STEPS));
    return shadeSurface(point, normal, vec3(0.0, 0.0, -1.0));
}
```

Keep debug branches available during development, but allow production builds to compile out unused views if shader complexity becomes a concern. If the normal view is noisy, do not attempt to repair it with bloom or tone mapping.

### Pattern 2: Bounding-Volume Early Exit

**What it does:** Limits expensive SDF evaluation to a region that can contain the visible object.

**When to use it:** Use when a scene has several procedural elements but occupies a small known region of the hero composition.

```glsl
float sceneDistance(vec3 point) {
    float boundingDistance = sdSphere(point - uSceneCenter, uSceneRadius);
    // A conservative bound can reject points far outside the expensive scene before evaluating details.
    if (boundingDistance > 1.0) return boundingDistance;

    float mainObject = sdRoundedBox(point - uObjectOffset, vec3(0.7, 0.5, 0.4), 0.12);
    float decorativeRing = sdTorus(point - uRingOffset, vec2(0.58, 0.07));
    return min(mainObject, decorativeRing);
}
```

The bound must actually enclose all detailed geometry. An undersized bound causes surfaces to vanish or produces unsafe jumps; test it from every camera angle before using it as an optimization.

### Pattern 3: Art-Directed Uniform Controls

**What it does:** Exposes a small set of parameters that can be tuned from JavaScript without recompiling shader source.

**When to use it:** Use for client handoff, design review, and portfolio variations where the same geometry should support multiple moods.

```js
const sculptureUniforms = {
  uTime: { value: 0 },
  uBlendRadius: { value: 0.22 },
  uSurfaceColor: { value: new THREE.Color('#168bff') },
  uRimStrength: { value: 0.45 },
  uDetailAmplitude: { value: 0.025 }
};

function applySculpturePreset(preset) {
  // Presets change art direction without generating a new material instance.
  sculptureUniforms.uBlendRadius.value = THREE.MathUtils.clamp(preset.blendRadius, 0.02, 0.7);
  sculptureUniforms.uRimStrength.value = THREE.MathUtils.clamp(preset.rimStrength, 0.0, 1.0);
  sculptureUniforms.uDetailAmplitude.value = THREE.MathUtils.clamp(preset.detailAmplitude, 0.0, 0.08);
  sculptureUniforms.uSurfaceColor.value.set(preset.surfaceColor);
}
```

Clamp values at the boundary where they enter the shader. A control panel that permits zero blend radius or extreme deformation can produce undefined math or destroy the visual result.

### Pattern 4: Quality Tiers by Cost, Not Device Labels

**What it does:** Changes expensive rendering features as a coherent package rather than independently scattering device checks throughout the code.

**When to use it:** Use when the shader appears above the fold and must perform on a range of phones and laptops.

```js
const raymarchPresets = {
  low: { pixelRatio: 1, maxSteps: 48, normalSamples: 4, shadows: false, aoSamples: 0 },
  medium: { pixelRatio: 1.25, maxSteps: 80, normalSamples: 4, shadows: false, aoSamples: 4 },
  high: { pixelRatio: 1.5, maxSteps: 112, normalSamples: 4, shadows: true, aoSamples: 5 }
};

function applyQualityPreset(renderer, uniforms, preset) {
  // A single preset keeps shader and drawing-buffer costs aligned.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatio));
  uniforms.uMaxSteps.value = preset.maxSteps;
  uniforms.uEnableShadows.value = preset.shadows ? 1 : 0;
  uniforms.uAoSamples.value = preset.aoSamples;
}
```

Do not infer performance from user-agent strings alone. Start with a safe preset, measure frame time, and allow a user or runtime signal to reduce quality if necessary.

### Pattern 5: Reduced-Motion Deterministic Sculpture

**What it does:** Preserves the final visual composition while stopping continuous motion when the user requests reduced motion.

**When to use it:** Use for animated shader heroes, particularly when motion is decorative rather than necessary for comprehension.

```js
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let animationFrame = 0;
let elapsedSeconds = 0;
let previousTimestamp = 0;

function renderFrame(timestamp) {
  const deltaSeconds = previousTimestamp === 0 ? 0 : (timestamp - previousTimestamp) / 1000;
  previousTimestamp = timestamp;
  if (!motionQuery.matches) elapsedSeconds += Math.min(deltaSeconds, 0.05);
  uniforms.uTime.value = elapsedSeconds;
  renderer.render(scene, camera);
  if (!motionQuery.matches) animationFrame = requestAnimationFrame(renderFrame);
}

function syncMotionPreference() {
  cancelAnimationFrame(animationFrame);
  previousTimestamp = 0;
  if (motionQuery.matches) {
    uniforms.uTime.value = 0;
    renderer.render(scene, camera); // A static frame remains visually complete.
  } else {
    animationFrame = requestAnimationFrame(renderFrame);
  }
}
motionQuery.addEventListener('change', syncMotionPreference);
syncMotionPreference();
```

If your application already has a central render loop, integrate the preference there instead of creating a second loop. Remove the media-query listener and cancel pending frames when the component unmounts.

### Pattern 6: Deterministic Scroll-Driven Parameter Mapping

**What it does:** Maps normalized scroll progress to shader parameters without making the shader depend on frame count.

**When to use it:** Use for a case-study chapter where the sculpture gradually changes shape as the reader moves through a narrative.

```js
function updateSculptureFromProgress(progress) {
  const normalizedProgress = THREE.MathUtils.clamp(progress, 0, 1);
  // Scroll position is a stable input, so users can reverse direction without animation drift.
  uniforms.uBlendRadius.value = THREE.MathUtils.lerp(0.12, 0.48, normalizedProgress);
  uniforms.uDetailAmplitude.value = THREE.MathUtils.lerp(0.01, 0.035, normalizedProgress);
  uniforms.uRimStrength.value = THREE.MathUtils.lerp(0.25, 0.65, normalizedProgress);
}
```

Keep scroll listeners passive and avoid updating React state for every pixel when direct uniform updates are sufficient. When scroll progress is animated with a smoothing system, make sure the final value still tracks the intended section state.

### Pattern 7: WebGL Failure Fallback

**What it does:** Keeps the page's primary content usable when WebGL is unavailable or context creation fails.

**When to use it:** Use on public-facing sites where the shader is decorative but the heading, CTA, and navigation must always remain accessible.

```js
function canCreateWebGLContext() {
  const canvas = document.createElement('canvas');
  // Context creation can fail on restricted or exhausted devices; do not assume support from browser name.
  return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
}

function mountHeroEffect() {
  if (!canCreateWebGLContext()) {
    document.documentElement.classList.add('shader-fallback');
    return null;
  }
  return createRaymarchRenderer();
}
```

A real renderer can still fail after context creation, so listen for `webglcontextlost` and show the fallback if it occurs. The fallback should be designed, not a blank black rectangle.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Advancing by a fixed ray step | Treats the implicit scene like evenly spaced geometry | Advance by a conservative distance estimate and visualize misses |
| Mixing object and world coordinates | Camera and SDF use different spaces | Document the scene coordinate space and transform the ray or query consistently |
| Forgetting aspect correction | Screen-space coordinates assume square pixels | Normalize centered coordinates by the drawing-buffer height |
| Using an invalid distance estimator | Domain transforms alter distance scale | Correct uniform scaling and use conservative safety factors after warps |
| Dividing by zero in smooth minimum | A UI allows a zero blend radius | Clamp blend radius to a positive minimum on the CPU and shader side |
| Raising max steps before debugging | More work hides the underlying mathematical issue | Render step heatmaps and verify the SDF before increasing the budget |
| Using radial normals for every shape | Sphere-specific shortcut is mistaken for a general rule | Estimate the SDF gradient or use a primitive-specific analytic normal |
| Reusing hit epsilon for normal epsilon | Surface detection and gradient estimation need different scales | Tune the two epsilons independently using normal visualization |
| Adding shadows before the base image works | Expensive effects obscure the root cause | Validate hit distance, normals, and diffuse lighting before secondary effects |
| Ignoring shader color management | GLSL output is assumed to match CSS hex values | Test renderer tone mapping and color-space conversion explicitly |
| Using full device pixel ratio everywhere | High-DPI screens multiply fragment count | Cap pixel ratio and measure at target viewport sizes |
| Recreating ShaderMaterial on every render | Component lifecycle and shader compilation are misunderstood | Keep material and uniform references stable across updates |
| Forgetting context loss | GPU resources can be revoked under memory pressure | Listen for context loss and restore or switch to a fallback |
| Running animation under reduced motion | Decorative motion is treated as mandatory | Respect the media preference and render a complete static frame |
| Repeating geometry across infinite space | Procedural repetition is easier than bounded composition | Use bounding volumes, finite cells, or a maximum ray distance |
| Shipping debug modes to visitors | Development tools were never separated from production controls | Gate debug uniforms behind development configuration |
| Optimizing FPS alone | Average FPS hides heat and frame-time spikes | Profile GPU cost and test sustained behavior on representative hardware |
| Leaving canvas content as the only hero message | Visual experimentation overtakes product usability | Keep semantic HTML heading and CTA outside the shader canvas |

---

## Mental Models

1. **Distance is a safe step:** A correct distance bound tells the ray how far it can advance without crossing a surface.
2. **The scene is a function:** Geometry is evaluated mathematically at query points rather than stored only as triangles.
3. **Coordinates define meaning:** Every ray, transform, and SDF must agree on the space in which values are measured.
4. **Normals are gradients:** The lighting direction depends on how the distance field changes around the hit point.
5. **Pixels multiply cost:** Doubling drawing-buffer width and height can quadruple fragment work.
6. **Debug the pipeline in order:** Validate rays, hits, normals, base lighting, then shadows and post effects.
7. **A shader is a product feature:** It needs accessibility, fallback behavior, performance budgets, and lifecycle management—not just a striking screenshot.

---

## Quick Reference

| Property / Situation | Value / Answer | Notes |
|---|---|---|
| Sphere SDF | `length(point) - radius` | Positive outside, zero on surface, negative inside |
| Box SDF | `length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0)` | `q = abs(point) - halfSize` |
| Union | `min(distanceA, distanceB)` | Nearest surface of either shape |
| Intersection | `max(distanceA, distanceB)` | Shared interior region |
| Subtraction | `max(distanceA, -distanceB)` | Removes B from A |
| Smooth union | Polynomial or exponential smooth-min | Changes shape and distance properties |
| Surface hit | `distanceToScene < epsilon` | Epsilon depends on scene scale and precision |
| Ray miss | Travel exceeds maximum distance or step budget | Return a clear miss sentinel |
| Normal | Gradient of the SDF | Finite difference is simple but costs extra evaluations |
| Debug normal | `normal * 0.5 + 0.5` | Maps -1..1 to visible RGB |
| Typical starting max steps | 64–128 | Measure actual scene cost; not a universal recommendation |
| Pixel ratio | Start capped around 1–1.5 for costly fullscreen effects | Raise only when profiling supports it |
| Mobile fallback | Lower resolution, fewer steps, no shadows/AO, static image option | Preserve page content and CTA |
| Uniform updates | Mutate stable `.value` fields | Avoid per-frame material recreation |
| Motion preference | `prefers-reduced-motion: reduce` | Provide a stable final frame |
| Main profiler question | Which stage multiplies the cost? | Fragments × steps × SDF complexity × secondary samples |

---

## Build Challenge

### Build: An Art-Directed Raymarched Sculpture for a Portfolio Hero

Create a full-screen or contained hero visual featuring a smooth union of a rounded box, sphere, and torus, rendered through a GLSL raymarcher and integrated into a Three.js page. The result should look intentional at desktop size and remain usable on a mobile device.

### Requirements

1. Implement and visually validate sphere, box, and torus SDF functions independently before composing them.
2. Build a scene function that combines at least three primitives with one smooth union and one subtraction.
3. Implement centered, aspect-correct camera rays and explicitly document the coordinate space used by the scene.
4. Add a bounded march loop with maximum steps, maximum distance, surface epsilon, and a configurable safety factor.
5. Implement finite-difference surface normals and provide a normal-visualization debug mode.
6. Add diffuse, specular, and Fresnel-style rim lighting with at least three art-direction uniforms.
7. Add optional soft shadows or ambient occlusion behind a quality flag; the effect must be disabled in the low-quality preset.
8. Add a step-count heatmap and a hit/miss debug view so a missing surface can be diagnosed without guessing.
9. Update uniforms without recreating the material or allocating new objects inside the animation loop.
10. Resize the renderer and resolution uniform correctly; test a non-square viewport and a high-DPI viewport.
11. Respect `prefers-reduced-motion` by producing a stable static frame with no continuous animation loop.
12. Provide at least two quality presets that adjust pixel ratio, step budget, and secondary effects as a group.
13. Handle WebGL unavailability or context loss with a visually acceptable fallback and keep the page heading and CTA accessible in HTML.
14. Test an intentionally broken SDF, such as a negative or incorrect distance estimate, and use debug output to identify the symptom before fixing it.
15. Record a before/after performance comparison showing the effect of lowering pixel ratio or disabling secondary effects.

### Expected Output

A reusable raymarched hero component with a polished sculpture, readable silhouette, stable lighting, adjustable parameters, development debug views, and a graceful fallback. The shader should be reproducible for a given set of uniforms and should not depend on frame rate for its motion.

### Definition of Done

- [ ] All three primitive SDFs render correctly from multiple camera angles.
- [ ] Boolean operations and smooth blending produce the intended silhouette.
- [ ] Ray misses stop at a defined maximum distance instead of consuming unbounded work.
- [ ] Normal and step-count debug views are useful enough to diagnose an injected failure.
- [ ] The material and uniform objects remain stable during animation.
- [ ] Resize behavior is correct on wide, square, and narrow screens.
- [ ] Reduced-motion mode displays a complete still image and does not run an unnecessary continuous loop.
- [ ] Low-quality mode disables expensive secondary effects and measurably reduces work.
- [ ] The fallback preserves the heading, navigation, and primary CTA.
- [ ] The implementation includes a short note explaining its SDF assumptions, quality limits, and known visual trade-offs.
