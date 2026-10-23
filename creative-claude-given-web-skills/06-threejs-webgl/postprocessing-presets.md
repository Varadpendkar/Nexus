# SKILL: postprocessing-presets

**Layer:** 06 — Three.js / WebGL

**Goal:** Design, configure, and optimize reusable Three.js post-processing presets that add cinematic visual polish without sacrificing readability, responsiveness, or frame rate.

## Why This Matters (Senior Perspective)

Post-processing is the final image treatment applied after a scene has been rendered. It can unify a visual direction, add restrained glow to emissive details, shape contrast, introduce depth cues, and give a portfolio scene a more intentional finish. It can also make a scene worse very quickly: excessive bloom erases silhouettes, heavy vignette muddies the corners, color grading crushes shadow detail, and screen-space effects can consume more GPU time than the scene itself.

A senior creative developer treats effects as part of the art direction rather than a checklist of fashionable filters. Each effect should have a purpose, a measurable visual contribution, and a fallback for lower-powered devices. The right baseline is often no post-processing at all; add effects only after the materials, lighting, camera, and composition are already working. A strong scene with restrained effects usually looks more expensive than a weak scene hidden behind glow and distortion.

The implementation details depend on the rendering stack. Three.js offers `EffectComposer` and pass classes, while React Three Fiber projects commonly use `@react-three/postprocessing`, which provides declarative effect components backed by the `postprocessing` ecosystem. These APIs are related but not interchangeable in every detail. Pick one approach for a given scene, follow its current package documentation, and avoid mixing two independent composers without a specific reason.

## Core Concepts

### 1. The render pipeline has stages

A typical post-processing pipeline renders the scene to a texture, then passes that image through one or more screen-space effects before presenting the final result. Order matters: effects do not generally commute. Bloom before tone mapping can behave differently from bloom after it; color grading before a vignette produces a different result from grading afterward.

Mental model: the scene is the photograph; post-processing is the darkroom. It can shape a good image, but it cannot repair every problem in the scene.

A typical Three.js pipeline:

```js
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 5);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(
  new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.55, // Keep the glow restrained so highlights retain their shape.
    0.35,
    0.88
  )
);

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
animate();
```

This is a pipeline illustration, not a complete production bootstrap: a real app also needs resize handling, lifecycle cleanup, output color-space/tone-mapping decisions, and a strategy for disposing composer resources.

### 2. Bloom should be earned by bright source values

Bloom spreads bright pixels into neighboring pixels. It works best when the scene contains a small number of intentionally bright highlights, emissive accents, or specular reflections. If the whole scene is equally bright, bloom becomes a fog rather than a highlight treatment.

**Wrong:** increasing bloom intensity until the object looks “more 3D.”

**Better:** create a lighting and material hierarchy first, then add just enough bloom to make the brightest accents bleed softly.

```jsx
import { EffectComposer, Bloom } from '@react-three/postprocessing';

function PolishedScene() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      <mesh>
        <torusKnotGeometry args={[0.8, 0.2, 120, 16]} />
        <meshStandardMaterial
          color="#7c5cff"
          emissive="#3b1b8a"
          emissiveIntensity={0.35}
          metalness={0.45}
          roughness={0.25}
        />
      </mesh>
      <EffectComposer>
        <Bloom
          intensity={0.55}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.2}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
```

The precise appearance depends on color management, tone mapping, exposure, and library versions. Tune against the real scene, not a generic numeric recipe.

### 3. Vignette and color grading are composition tools

A vignette darkens image edges and can guide attention toward a central subject. Too much vignette looks like a lens defect or makes interface content harder to read. Color grading shifts the overall mood, but should not make brand colors, skin tones, or important labels unreliable.

For a portfolio hero, keep the center and the object silhouette clear. If a vignette is used behind overlaid HTML, remember that the DOM overlay is not necessarily part of the same post-processing pipeline. Use CSS gradients for the HTML layer when needed instead of assuming a WebGL effect will darken DOM elements.

```jsx
import { EffectComposer, Vignette } from '@react-three/postprocessing';

function GentleVignette() {
  return (
    <EffectComposer>
      <Vignette
        offset={0.25}
        darkness={0.28}
      />
    </EffectComposer>
  );
}
```

Use an effect component supported by the installed package version. If a prop or effect name differs in your installed release, consult that release's API rather than guessing.

### 4. Depth of field is expensive and can undermine clarity

Depth of field blurs regions outside a focus range to imitate a camera lens. It can create an editorial product-photography feel, but it is often unnecessary for small interactive objects or scenes containing UI-adjacent detail. Blur should reinforce a clear focal plane, not conceal weak modeling or lighting.

Before adding depth of field, ask:
- Is the focal subject obvious without it?
- Does the blur make the intended object harder to understand?
- Does the effect remain acceptable on a small display?
- Is the extra GPU cost justified by the visual result?

Use stronger depth-of-field treatments for controlled, non-interactive product shots than for scenes where users need to inspect several objects.

### 5. Chromatic aberration and distortion should be deliberate accents

Chromatic aberration offsets color channels near edges; distortion bends the image. Both can suggest a stylized lens or experimental digital aesthetic, but they are easy to overuse. Continuous strong distortion may cause discomfort, reduce text-adjacent clarity, and make the scene feel dated.

A restrained effect can be suitable for a short transition or an art-directed background. Avoid using it as a permanent overlay on every interactive scene. Never distort essential DOM text through a WebGL effect and assume the effect applies to the whole page—it only affects pixels in its rendering pipeline.

### 6. Anti-aliasing and pixel ratio are separate quality controls

Anti-aliasing reduces jagged edges. Pixel ratio determines the number of render pixels per CSS pixel and can have a much larger performance impact than expected. Post-processing often adds full-screen passes, so high pixel ratio multiplied by several effects can be expensive on mobile GPUs.

Start with a capped pixel ratio and the smallest effect stack that achieves the design. Test with a real device or browser performance profiler. Do not blindly combine high DPR, multisample anti-aliasing, bloom, depth of field, and multiple blur passes.

### 7. Effect order is a design decision

A composer processes effects in sequence. A pipeline might apply bloom, then color grading, then vignette, but the ideal order depends on the desired look and the effect implementation. An effect that modifies luminance can change how later bloom behaves; a vignette applied last may darken glow near the frame edges.

Write down the desired image transformation and test one effect at a time. If an effect is added only because it is available, remove it and compare the scene. A simple pipeline is easier to debug and more likely to perform consistently.

### 8. Color management must be consistent

Three.js rendering uses color-space and tone-mapping settings, and post-processing libraries have their own expectations about intermediate buffers and output transforms. Incorrectly configured output can look washed out, too dark, or inconsistent between the canvas and exported images. Avoid copying renderer settings from unrelated examples without checking the installed Three.js and post-processing versions.

With React Three Fiber, start with a standard `Canvas` setup and the matching `@react-three/postprocessing` integration. In raw Three.js, ensure the composer pipeline and renderer output settings are configured consistently. Validate the result on the target browsers.

## Integration Patterns

### Pattern 1: Restrained portfolio bloom

**Use when:** an emissive object or a few bright accents need a soft cinematic halo.

```jsx
import { EffectComposer, Bloom } from '@react-three/postprocessing';

export function BloomPreset() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.18}
        mipmapBlur
      />
    </EffectComposer>
  );
}
```

Pair this with an intentionally bright emissive accent, not a uniformly glowing scene. `multisampling` support and exact props depend on the installed version; verify against the version in your lockfile.

### Pattern 2: Soft vignette for a focused hero

**Use when:** the frame edges should recede subtly behind a central subject.

```jsx
import { EffectComposer, Vignette } from '@react-three/postprocessing';

export function FocusPreset() {
  return (
    <EffectComposer>
      <Vignette offset={0.3} darkness={0.22} />
    </EffectComposer>
  );
}
```

If the hero includes HTML headings over the canvas, use a CSS overlay gradient to manage contrast behind the text. A WebGL vignette does not affect DOM content outside the canvas.

### Pattern 3: Preset selection by quality level

**Use when:** desktop and mobile need different effect budgets.

```jsx
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';

export function SceneEffects({ quality = 'high' }) {
  if (quality === 'low') return null;

  return (
    <EffectComposer multisampling={quality === 'high' ? 4 : 0}>
      <Bloom
        intensity={quality === 'high' ? 0.5 : 0.3}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.18}
        mipmapBlur
      />
      {quality === 'high' && (
        <Vignette offset={0.3} darkness={0.2} />
      )}
    </EffectComposer>
  );
}
```

This is a small policy layer: low quality removes post-processing, medium keeps one modest effect, and high permits a second effect. Confirm that the installed library accepts these props and benchmark each preset on actual target hardware.

### Pattern 4: Respect reduced motion and visual sensitivity

**Use when:** post-processing is combined with animated camera moves, distortion, or flickering glow.

```jsx
import { useEffect, useState } from 'react';

export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);

    return () => query.removeEventListener?.('change', update);
  }, []);

  return reduced;
}
```

Use the hook to reduce or disable motion-heavy effects, not to hide essential content. For static effects such as a mild vignette, reduced-motion preference may not require removal; make the decision based on actual movement and visual intensity.

### Pattern 5: Raw Three.js composer with resize and cleanup

**Use when:** the project uses Three.js directly rather than React Three Fiber.

```js
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export function createPostprocessedScene(container, scene, camera) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.45,
    0.3,
    0.9
  );
  composer.addPass(bloom);

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  let frameId = 0;
  let active = true;

  function render() {
    if (!active) return;
    frameId = requestAnimationFrame(render);
    composer.render();
  }
  render();

  return () => {
    active = false;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    composer.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
```

This pattern assumes the supplied scene and camera are owned elsewhere. It owns and disposes the renderer and composer it creates, and observes the actual container instead of assuming the viewport is the scene size. If additional passes allocate their own resources, follow their disposal requirements too.

### Pattern 6: Compare before and after

**Use when:** deciding whether an effect improves the design.

Make the effect stack switchable with a simple state flag. Compare screenshots at the same viewport and exposure. Evaluate silhouette clarity, highlight detail, color accuracy, and performance rather than judging only by visual drama.

```jsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';

export function EffectComparison() {
  const [effectsEnabled, setEffectsEnabled] = useState(true);

  return (
    <section>
      <button onClick={() => setEffectsEnabled((value) => !value)}>
        {effectsEnabled ? 'Disable effects' : 'Enable effects'}
      </button>
      <div style={{ height: 420 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 42 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 5, 3]} intensity={2} />
          <mesh>
            <torusKnotGeometry args={[0.8, 0.2, 120, 16]} />
            <meshStandardMaterial
              color="#7c5cff"
              emissive="#2a155e"
              emissiveIntensity={0.45}
              roughness={0.25}
              metalness={0.4}
            />
          </mesh>
          {effectsEnabled && <BloomPreset />}
        </Canvas>
      </div>
    </section>
  );
}
```

The comparison control is useful during development. In a final interface, avoid exposing technical toggles unless they serve a real user purpose.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Bloom washes out the object | Too many pixels exceed the luminance threshold | Reduce intensity, increase threshold, and improve highlight hierarchy |
| Effects are added before lighting is tuned | Post-processing is used to hide scene problems | Establish materials, lights, and composition first |
| Too many full-screen effects run at once | Each effect looks useful in isolation | Add one at a time and measure the combined cost |
| HTML text does not receive the vignette | The effect only processes the WebGL output | Use CSS gradients for DOM overlay contrast |
| Mobile performance collapses | High DPR multiplies the cost of blur and other screen-space passes | Cap DPR and use a lower quality preset |
| Scene looks washed out or too dark | Output color management is inconsistent | Align renderer, composer, tone mapping, and output transforms |
| Effects appear in an unexpected order | Pass ordering was not considered | Add effects incrementally and inspect the pipeline sequence |
| Depth of field hides important details | Blur is treated as decoration | Keep focus intentional or remove the effect |
| Chromatic aberration is permanently strong | A stylistic accent became the default | Restrict it to a specific art-directed moment or lower it substantially |
| Composer is never resized | Viewport size is assumed to equal container size | Resize renderer and composer together and update camera projection |
| Raw Three.js animation loop survives unmount | The frame loop has no cleanup | Cancel the animation frame and disconnect observers |
| Resources are disposed inconsistently | Ownership is unclear | Dispose only resources the component or function owns |
| Library props copied from a different version fail | APIs evolve between package releases | Check installed package documentation and lockfile versions |

## Mental Models

1. **Effects are image-space transformations:** they process rendered pixels, not the underlying geometry.
2. **Art direction comes first:** effects should enhance an already coherent scene.
3. **Bloom needs highlights:** without a luminance hierarchy, glow becomes haze.
4. **Order changes the image:** the same effects in a different sequence can produce a different result.
5. **Every pass costs pixels:** resolution and full-screen effects multiply GPU work.
6. **The canvas has a boundary:** WebGL post-processing does not automatically affect DOM overlays.
7. **A preset is a budget:** each quality tier defines an intentional visual/performance tradeoff.

## Quick Reference

| Goal | Technique |
|---|---|
| Soft glow | Bloom with controlled threshold and intensity |
| Focus attention | Subtle vignette |
| Editorial lens look | Restrained depth of field |
| Stylized lens artifact | Very subtle chromatic aberration or distortion |
| Lower-end device support | Remove expensive passes and cap DPR |
| Consistent visual mood | Tune materials, lights, and color management before grading |
| React Three Fiber integration | `@react-three/postprocessing` effect components |
| Raw Three.js integration | `EffectComposer` plus `RenderPass` and effect passes |
| Responsive raw composer | `ResizeObserver`, `composer.setSize`, camera aspect update |
| Cleanup | Cancel RAF, disconnect observers, dispose owned renderer/composer |
| Accessibility | Reduce motion-heavy effects when requested and preserve DOM readability |
| Evaluate an effect | Compare on/off at the same viewport and quality settings |

## Build Challenge

### Project: Three-Tier Cinematic Effects Preset

Build a small product hero with a switchable post-processing stack and three quality levels.

**Requirements**

1. Create a 3D hero object with intentional materials and lighting before adding any effects.
2. Add a restrained bloom preset that only noticeably affects the brightest accents.
3. Add a subtle vignette for high quality, and ensure it does not obscure the subject silhouette.
4. Implement `low`, `medium`, and `high` quality modes. Low uses no composer effects, medium uses one restrained effect, and high uses bloom plus vignette.
5. Cap device pixel ratio and verify that the mobile preset does not render at unnecessarily high resolution.
6. Provide a development-only effects on/off comparison.
7. Test the scene with effects disabled to confirm that the base materials and lighting still look intentional.
8. Check the DOM heading and CTA contrast independently of the WebGL post-processing.
9. Respect `prefers-reduced-motion` for any animated distortion or camera effects.
10. If using raw Three.js, handle container resizing and clean up the animation frame, observer, composer, and renderer.
11. Verify effect names and props against the installed library version instead of relying on copied examples.
12. Record the visual difference and performance tradeoff for each quality level.

**Definition of done**

- The scene looks coherent with post-processing turned off.
- Bloom preserves silhouette and highlight detail.
- Quality levels provide clear, intentional performance budgets.
- The composition remains readable on mobile.
- DOM content is not assumed to be affected by canvas-only effects.
- Resources and animation loops are cleaned up correctly.
- Every effect has a visual purpose and can be justified in the final design.
