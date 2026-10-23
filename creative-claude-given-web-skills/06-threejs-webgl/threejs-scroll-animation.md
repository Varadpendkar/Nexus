# SKILL: threejs-scroll-animation

**Layer:** 06 — Three.js / WebGL

**Goal:** Build scroll-driven Three.js experiences that synchronize camera movement, object transforms, and scene storytelling with page scroll in a smooth, responsive, and accessible way.

## Why This Matters (Senior Perspective)

Scroll-driven 3D is powerful because it connects a spatial scene to the reader's progress through a page. A product can rotate as its materials are introduced, a portfolio object can travel through a sequence of project chapters, or a technical story can move the camera through a 3D environment. When the mapping between scroll and motion is deliberate, the experience feels authored. When it is improvised, it feels disconnected: the camera jumps, the animation runs at different speeds on different devices, the page scroll fights the scene, and mobile users may be trapped inside a long interaction.

The central mistake is treating scroll as a stream of animation commands. Scroll position is an input value, not a frame clock. A robust design maps a known scroll interval to a normalized progress value, then derives camera and object transforms from that progress. This makes the animation deterministic: the same scroll position produces the same scene state, even when a user scrolls quickly, resizes the browser, reloads halfway down the page, or uses browser history. If you need cinematic smoothing, apply it as a separate presentation layer rather than letting smoothing become the only source of truth.

Senior implementations also treat the page and the WebGL renderer as one experience. DOM sections provide semantic content and natural scroll behavior; the canvas supplies the spatial visuals. Resize handling, renderer pixel ratio, reduced-motion preferences, scroll restoration, touch behavior, and cleanup all matter. A beautiful desktop demo is not complete if it burns battery on a phone, blocks reading, or makes the actual project information inaccessible to screen readers.

## Core Concepts

### 1. Scroll progress is normalized state

Choose a start and end point for the section that drives the scene. Convert the current scroll position into a value from `0` to `1`, clamp it, and derive animation values from it. Do not add a fixed rotation on every scroll event; that makes the result dependent on event frequency and scroll history.

```js
function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function getSectionProgress(section, scrollY = window.scrollY) {
  const rect = section.getBoundingClientRect();
  const sectionTop = rect.top + scrollY;
  const scrollableDistance = Math.max(1, section.offsetHeight - window.innerHeight);

  // The same scroll position should always map to the same progress value.
  return clamp01((scrollY - sectionTop) / scrollableDistance);
}
```

This version maps progress from when the section's top reaches the top of the viewport through the point where the section's bottom reaches the viewport bottom. For other narratives, define a different start/end contract—for example, start when the section enters the viewport and finish when its center leaves. The mapping should be explicit, not hidden inside scattered constants.

### 2. Derive transforms from progress

A reliable animation is a function of progress: `state = f(progress)`. This makes it seekable and easier to debug. A naïve pattern such as `mesh.rotation.y += delta` in a scroll callback accumulates changes and cannot reliably represent a particular scroll position.

```js
const startRotation = -0.6;
const endRotation = Math.PI * 2;
const startY = 1.2;
const endY = -1.2;

function applyScrollProgress(progress, mesh) {
  const t = clamp01(progress);

  // Direct interpolation keeps the scene deterministic when scrolling jumps.
  mesh.rotation.y = startRotation + (endRotation - startRotation) * t;
  mesh.position.y = startY + (endY - startY) * t;
}
```

Use linear interpolation for simple ranges and easing functions for intentional pacing. If a sequence has several chapters, define keyframes and interpolate between them rather than stacking unrelated scroll handlers.

### 3. Scroll events are not animation frames

Scroll events can fire at high frequency and may be coalesced by the browser. They should update a target progress value; the render loop should read the latest state and render. Do not assume that each scroll event corresponds to a display frame.

```js
let targetProgress = 0;

function onScroll() {
  targetProgress = getSectionProgress(section);
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

function animate() {
  requestAnimationFrame(animate);

  // Render from the latest scroll state rather than rendering once per event.
  applyScrollProgress(targetProgress, model);
  renderer.render(scene, camera);
}
animate();
```

For a production implementation, use one shared animation loop, remove listeners during cleanup, and avoid creating new vectors or materials in the scroll callback. If the scene is static between scroll updates, an invalidation-based render strategy can save power, but only if all animated and interactive inputs are accounted for.

### 4. Pinning and sticky layout are different concerns

CSS `position: sticky` can keep a canvas or visual stage in view while the user scrolls through semantic content. The document still owns the scroll position. This is often easier to maintain than manually moving the canvas with JavaScript.

```css
.story {
  position: relative;
}

.story__stage {
  position: sticky;
  top: 0;
  height: 100svh;
  overflow: clip;
}

.story__chapter {
  min-height: 100svh;
  display: grid;
  align-content: center;
  padding: clamp(1.5rem, 6vw, 7rem);
}
```

A sticky element sticks within its containing block, so the story container must span the entire narrative. Ancestor overflow, transforms, and containment can affect sticky behavior. Test the actual layout rather than assuming `height: 100vh` and sticky positioning work in every browser and mobile viewport.

### 5. Separate semantic content from the canvas

The canvas should not be the only place where the story's meaning exists. Put titles, descriptions, controls, and project links in the DOM. The 3D scene can react to the active chapter, while screen readers and users with WebGL disabled still have access to the content.

```html
<section class="story" id="product-story">
  <div class="story__stage" aria-hidden="true">
    <canvas id="story-canvas"></canvas>
  </div>

  <article class="story__chapter" data-chapter="0">
    <p>Chapter 01</p>
    <h2>Designed to move</h2>
    <p>A form study exploring balance and motion.</p>
  </article>

  <article class="story__chapter" data-chapter="1">
    <p>Chapter 02</p>
    <h2>Material and light</h2>
    <p>Surface details change as the story advances.</p>
  </article>
</section>
```

If the canvas is purely decorative, `aria-hidden="true"` is appropriate. If it exposes meaningful controls, provide accessible DOM equivalents and do not hide the only available interaction.

### 6. Keyframes make multi-chapter motion manageable

Represent a scene sequence as data. Each keyframe defines the state at a progress point. Interpolate between neighboring keyframes. This is easier to extend than a large chain of `if` statements.

```js
const keyframes = [
  { at: 0, position: [0, 0, 0], rotationY: 0, scale: 1 },
  { at: 0.35, position: [1.4, 0.2, -0.5], rotationY: Math.PI * 0.5, scale: 1.15 },
  { at: 0.7, position: [-1, -0.2, 0.3], rotationY: Math.PI, scale: 0.9 },
  { at: 1, position: [0, 0, 0], rotationY: Math.PI * 2, scale: 1 },
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleKeyframes(progress, frames) {
  const p = clamp01(progress);

  if (p <= frames[0].at) return { ...frames[0] };
  if (p >= frames[frames.length - 1].at) return { ...frames[frames.length - 1] };

  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i];
    const b = frames[i + 1];

    if (p >= a.at && p <= b.at) {
      const localT = (p - a.at) / (b.at - a.at);

      return {
        at: p,
        position: a.position.map((value, axis) => lerp(value, b.position[axis], localT)),
        rotationY: lerp(a.rotationY, b.rotationY, localT),
        scale: lerp(a.scale, b.scale, localT),
      };
    }
  }

  return { ...frames[frames.length - 1] };
}
```

This example linearly interpolates all values. For rotation, linear angle interpolation is appropriate when you want a known number of turns; for shortest-path orientation changes, interpolate quaternions instead. Validate that keyframe `at` values are ordered and unique so the sampling function cannot divide by zero.

### 7. Smoothing is a presentation choice

Directly mapping scroll progress gives precise, seekable motion. Some experiences benefit from smoothing that reduces abrupt visual movement. Keep raw progress as the truth and smooth only the visual progress.

```js
let targetProgress = 0;
let visualProgress = 0;

function animate() {
  requestAnimationFrame(animate);

  // Exponential smoothing behaves consistently across frame rates.
  const delta = clock.getDelta();
  const smoothing = 1 - Math.exp(-8 * delta);
  visualProgress += (targetProgress - visualProgress) * smoothing;

  applyScrollProgress(visualProgress, model);
  renderer.render(scene, camera);
}
```

Smoothing introduces lag. Too much lag makes the scene feel detached from the reader's scroll position and can make scroll restoration look incorrect. Provide a reduced-motion path and consider disabling smoothing when the user requests reduced motion.

### 8. Resize and device pixel ratio affect visual stability

Scroll-driven scenes often keep the renderer visible for long sections. Resize the camera and renderer when the canvas size changes, and cap the pixel ratio to avoid rendering excessive pixels on high-density displays.

```js
function resizeRenderer() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);

  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

const resizeObserver = new ResizeObserver(resizeRenderer);
resizeObserver.observe(canvas);
resizeRenderer();
```

For a renderer whose canvas is styled to fill a parent, `setSize(width, height, false)` updates the drawing buffer without overwriting CSS dimensions. Observe the canvas's container if its size can change independently of the canvas element. Disconnect the observer when the experience is removed.

## Advanced Patterns

### Pattern 1: Sticky visual stage with chapter-driven scene state

**Use when:** A single 3D model should remain visible while multiple sections introduce its details.

```js
const chapters = [...document.querySelectorAll('[data-chapter]')];
let activeChapter = 0;

const chapterObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    const index = chapters.indexOf(entry.target);
    if (index >= 0) {
      activeChapter = index;
      updateChapterPresentation(activeChapter);
    }
  }
}, {
  root: null,
  // Bias the active section toward the viewport's central band.
  rootMargin: '-40% 0px -40% 0px',
  threshold: 0,
});

chapters.forEach((chapter) => chapterObserver.observe(chapter));

function updateChapterPresentation(index) {
  // Map semantic chapter state to scene targets in one place.
  targetProgress = index / Math.max(1, chapters.length - 1);
}
```

`IntersectionObserver` is useful for discrete chapter activation. For continuous progress within each chapter, calculate section progress separately or use a scroll timeline. Keep the observer callback lightweight and disconnect it during teardown.

### Pattern 2: Responsive keyframe sequence

**Use when:** The same story needs slightly different camera framing on narrow screens.

```js
function getSceneConfig(viewportWidth) {
  if (viewportWidth < 640) {
    return {
      cameraZ: 7.5,
      modelScale: 0.78,
      horizontalTravel: 0.35,
    };
  }

  if (viewportWidth < 1024) {
    return {
      cameraZ: 6.2,
      modelScale: 0.92,
      horizontalTravel: 0.8,
    };
  }

  return {
    cameraZ: 5.2,
    modelScale: 1,
    horizontalTravel: 1.4,
  };
}

function applyResponsiveConfig(camera, model, viewportWidth) {
  const config = getSceneConfig(viewportWidth);
  camera.position.z = config.cameraZ;
  model.scale.setScalar(config.modelScale);
  camera.updateProjectionMatrix();
}
```

Keep responsive parameters in one configuration function rather than scattering width checks across keyframes. On resize, apply the configuration and re-evaluate scroll progress so the scene remains aligned with the current chapter.

### Pattern 3: Multiple tracks from one progress value

**Use when:** Camera, model, lights, and background should change together without separate scroll handlers.

```js
function smoothstep01(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function applyNarrativeProgress(progress, state) {
  const p = clamp01(progress);

  const cameraTrack = smoothstep01(p);
  const modelTrack = clamp01((p - 0.1) / 0.7);
  const lightTrack = clamp01((p - 0.45) / 0.45);

  state.camera.position.x = lerp(-2, 2, cameraTrack);
  state.model.rotation.y = lerp(0, Math.PI * 2, modelTrack);
  state.keyLight.intensity = lerp(0.8, 2.2, lightTrack);
}
```

Different tracks can begin and end at different progress points, but all derive from the same normalized input. This creates coordinated motion and makes the entire sequence seekable. Avoid independently mutating these values in unrelated callbacks.

### Pattern 4: Reduced-motion mode

**Use when:** The story includes large camera moves, long rotations, or smoothing that may be uncomfortable.

```js
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = reducedMotionQuery.matches;

function renderStory(progress) {
  if (reducedMotion) {
    // Preserve the narrative state while avoiding continuous cinematic travel.
    applyStaticChapterState(progress, sceneState);
    return;
  }

  applyNarrativeProgress(progress, sceneState);
}

function onMotionPreferenceChange(event) {
  reducedMotion = event.matches;
  renderStory(targetProgress);
}

reducedMotionQuery.addEventListener('change', onMotionPreferenceChange);
```

A reduced-motion implementation should not simply remove all context. Preserve the information and meaningful chapter states while minimizing large movement, parallax, and continuous animation. Ensure `applyStaticChapterState` is implemented for the actual scene; it is an application-specific function, not a Three.js API.

### Pattern 5: Scroll-linked camera path with a look target

**Use when:** The camera should travel through a scene while continuing to focus on a target.

```js
const cameraPath = [
  { at: 0, position: new THREE.Vector3(0, 1.5, 7), lookAt: new THREE.Vector3(0, 0, 0) },
  { at: 0.5, position: new THREE.Vector3(3, 2, 4), lookAt: new THREE.Vector3(0.5, 0, 0) },
  { at: 1, position: new THREE.Vector3(0, 1, 3), lookAt: new THREE.Vector3(0, 0.2, 0) },
];

function applyCameraKeyframe(state, camera) {
  camera.position.copy(state.position);
  camera.lookAt(state.lookAt);
}
```

Use your keyframe sampler to interpolate the position and look target between adjacent path points. For more complex paths, use a `THREE.CatmullRomCurve3` for position and a separate curve or target interpolation for orientation. Avoid changing camera position from both scroll logic and controls at the same time unless the combination is explicitly designed.

### Pattern 6: Scroll progress without a continuous render loop

**Use when:** The scene is static between scroll, resize, and interaction updates.

```js
let renderRequested = false;

function requestSceneRender() {
  if (renderRequested) return;
  renderRequested = true;

  requestAnimationFrame(() => {
    renderRequested = false;
    applyScrollProgress(targetProgress, model);
    renderer.render(scene, camera);
  });
}

window.addEventListener('scroll', () => {
  targetProgress = getSectionProgress(section);
  requestSceneRender();
}, { passive: true });

window.addEventListener('resize', () => {
  resizeRenderer();
  targetProgress = getSectionProgress(section);
  requestSceneRender();
});
```

This is appropriate only when no other continuous animation needs frames. If materials, particles, video textures, controls, or model animations update continuously, retain a render loop while the experience is active. A render-on-demand architecture should have one clear invalidation path for every state change.

### Pattern 7: Clean lifecycle for a mounted story section

**Use when:** A scene is mounted in a single-page application or conditionally displayed page section.

```js
function mountScrollStory({ canvas, section, scene, camera, renderer, model }) {
  let targetProgress = 0;
  let frameId = 0;
  let disposed = false;

  const updateProgress = () => {
    targetProgress = getSectionProgress(section);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    updateProgress();
  };

  const animate = () => {
    if (disposed) return;
    frameId = requestAnimationFrame(animate);
    applyScrollProgress(targetProgress, model);
    renderer.render(scene, camera);
  };

  window.addEventListener('scroll', updateProgress, { passive: true });
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  updateProgress();
  resize();
  animate();

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    window.removeEventListener('scroll', updateProgress);
    observer.disconnect();
    renderer.dispose();
  };
}
```

This function assumes the caller owns the renderer and that scene resources are disposed by their respective owners. In a real application, also remove any media-query, pointer, controls, or observer listeners created elsewhere. Do not dispose shared geometry or materials here unless the mount function owns them.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Incrementing rotation inside scroll callbacks | Scroll events are treated as animation ticks | Derive transforms from normalized progress |
| Using window dimensions for a container canvas | Examples assume a full-screen renderer | Measure the canvas or its container |
| Rendering directly on every scroll event | Event frequency varies and can cause redundant work | Store target state and render through one scheduled frame |
| Smoothing too aggressively | Motion is tuned by eye without considering input lag | Keep raw progress authoritative and use modest smoothing |
| Mixing scroll animation and camera controls | Two systems write to the same transform | Define one transform owner or an explicit composition |
| Sticky stage ends too early | The containing block is too short or overflow changes sticky behavior | Make the story container span all chapters and test ancestor layout |
| Ignoring browser scroll restoration | Scene state is initialized only at the top | Calculate progress immediately on mount and after layout changes |
| Using one keyframe chain for every viewport | Composition breaks on narrow screens | Keep responsive scene parameters in one configuration |
| Leaving listeners and observers active | SPA sections unmount but callbacks remain | Return cleanup and cancel pending frames |
| Forgetting reduced-motion preferences | Cinematic movement is treated as mandatory | Offer a reduced-motion scene state |
| Recomputing all scene state in many callbacks | Each subsystem becomes a competing source of truth | Route inputs into one progress/state pipeline |
| Assuming a canvas communicates the story to assistive tech | Visual content is mistaken for semantic content | Keep titles, descriptions, and controls in the DOM |

## Mental Models

1. **Scroll is state, not time.** A progress value should identify one reproducible scene state.
2. **Derive, do not accumulate.** Compute transforms from progress instead of repeatedly adding movement.
3. **One input, many tracks.** Camera, model, light, and background can all derive from one normalized timeline.
4. **DOM tells the story; WebGL illustrates it.** Keep semantic content accessible outside the canvas.
5. **Smoothing trades precision for polish.** Use it deliberately and preserve a reduced-motion path.
6. **Layout defines the timeline.** Sticky behavior and section geometry determine when progress advances.
7. **Every mounted scene needs an exit.** Listeners, observers, animation frames, and renderer resources need an owner and cleanup path.

## Quick Reference

| Need | Recommended approach |
|---|---|
| Normalize scroll | Map section start/end to `0..1` and clamp |
| Drive transforms | Derive position, rotation, scale, and camera state from progress |
| Handle frequent scroll input | Store target progress; render in one animation loop or scheduled frame |
| Build chapter stories | Sticky visual stage + semantic DOM chapters |
| Coordinate multiple properties | Multiple tracks derived from the same progress |
| Smooth motion | Delta-time-based exponential smoothing, used sparingly |
| Support mobile framing | Central responsive configuration |
| Support reduced motion | Static or low-motion chapter states |
| Resize renderer | Measure canvas/container, update renderer and camera aspect |
| Avoid stale scroll state | Recalculate on mount, resize, and relevant layout changes |
| Save power for static scenes | Render on demand when no continuous animation is required |
| Prevent leaks | Remove listeners, disconnect observers, cancel frames, dispose owned resources |

## Build Challenge

### Build a Scroll-Driven 3D Product Story

Create a page with a sticky Three.js stage and four semantic chapters that tell a product or portfolio case-study story.

**Requirements**

1. Create a Three.js scene with a central product or abstract object and a perspective camera.
2. Build four DOM chapters with headings and descriptions; keep all meaningful text outside the canvas.
3. Map the story section's scroll range to a clamped `0..1` progress value.
4. Define keyframes for object position, rotation, and scale, and sample them deterministically.
5. Coordinate at least two other scene properties—such as camera position and key-light intensity—from the same progress value.
6. Use a sticky visual stage that remains in view for the narrative's duration.
7. Handle resize and browser restoration by recalculating progress rather than assuming the page starts at the top.
8. Add a reduced-motion path that preserves chapter information without large continuous camera moves.
9. Ensure one system owns each animated transform; do not let controls and scroll logic fight over the camera.
10. Clean up listeners, observers, and animation frames when the story component is removed.

**Definition of done**

- Scrolling to the same position always produces the same target scene state.
- Fast scrolling and page reload at a mid-page position do not leave the model in an incorrect state.
- The canvas remains aligned with the responsive layout.
- All chapter content is readable without WebGL and remains available to assistive technology.
- Reduced-motion preferences change the motion treatment without removing the story.
- The README documents the progress mapping, keyframe format, and lifecycle cleanup.

Build the deterministic progress model first. Add smoothing and cinematic polish only after the experience remains correct under fast scrolling, resizing, and reloads.
