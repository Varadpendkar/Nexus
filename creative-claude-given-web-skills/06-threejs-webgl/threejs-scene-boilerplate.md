# SKILL: threejs-scene-boilerplate
**Layer:** 06 — Three.js & WebGL
**Goal:** Build a reliable, resize-safe, lifecycle-aware Three.js scene that renders smoothly, handles failures predictably, and can be integrated into a real creative website.

---

## Why This Matters (Senior Perspective)

A Three.js scene can look impressive in a local demo and still be unsuitable for a portfolio or client site. The common failures are structural: the canvas stretches after a viewport resize, the camera framing breaks on mobile, animation continues while the tab is hidden, pixel ratio multiplies GPU cost, and WebGL resources remain allocated after a route transition. These are not cosmetic defects. They create blurry rendering, overheating phones, dropped frames, memory growth, and bugs that appear only after navigating around a real site.

Senior creative developers treat the scene as a subsystem with a lifecycle, not as a canvas with a render loop. They define ownership of the renderer, scene, camera, animation frame, event listeners, and GPU resources. They make dimensions and pixel ratio explicit, separate setup from per-frame work, and provide a graceful fallback when WebGL is unavailable. That discipline lets the visual work remain ambitious without making the rest of the page fragile.

For freelance and portfolio work, this matters because the 3D scene is only one part of the experience. A hero scene must coexist with typography, navigation, scroll interactions, reduced-motion preferences, mobile touch input, and ordinary page content. The best implementation is not the one with the most code; it is the one that looks intentional, loads predictably, survives resizing and navigation, and has a clear failure path.

---

## Core Concepts

### 1. The scene graph is a hierarchy, not a drawing surface

A `THREE.Scene` is the root of a graph of objects. Meshes, lights, helpers, and groups are nodes in that hierarchy. A mesh combines geometry (shape data) and material (surface response). The camera determines which part of that graph is projected into the viewport. Keeping these responsibilities separate makes a scene easier to reason about: change the geometry to change shape, the material to change surface appearance, and the camera to change framing.

A minimal complete scene can run without a framework. Install Three.js in a Vite project with `npm install three`, then use this module as `src/main.js`.

```js
import * as THREE from 'three';

// The scene owns the objects that participate in rendering.
const scene = new THREE.Scene();
scene.background = new THREE.Color('#101018');

// The camera describes the viewer, not the object's position.
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
camera.position.set(0, 0, 5);
camera.lookAt(0, 0, 0);

// Geometry is reusable shape data; the material controls appearance.
const geometry = new THREE.TorusKnotGeometry(0.8, 0.24, 128, 16);
const material = new THREE.MeshStandardMaterial({
  color: '#9b8cff',
  roughness: 0.34,
  metalness: 0.25,
});
const heroObject = new THREE.Mesh(geometry, material);
scene.add(heroObject);

// A standard material needs light to reveal its shading.
scene.add(new THREE.HemisphereLight(0xdde6ff, 0x20152f, 2));
const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(800, 600);
document.body.appendChild(renderer.domElement);
renderer.render(scene, camera);
```

The sample uses a temporary fixed size to make the graph easy to see. A production scene should derive dimensions from its container and update the camera projection when those dimensions change.

**Naive approach:** put all setup, resize logic, animation, and cleanup in one giant function. It becomes difficult to identify which object owns a resource or listener.

**Better approach:** use named setup functions and keep scene state in one explicit scope. Avoid scattering renderer settings across unrelated modules.

**Gotcha:** adding an object to the scene does not automatically make it visible. It may be behind the camera, outside the frustum, fully transparent, unlit, or scaled to an unusable size.

### 2. The camera projection must match the drawing surface

A perspective camera uses field of view, aspect ratio, near plane, and far plane. Aspect ratio is the width divided by height of the drawing surface. If it remains at `1` while the canvas becomes wide, objects stretch. The projection matrix must be updated after changing camera properties.

```js
function updateCameraForSize(camera, width, height) {
  // Guard against a collapsed container during initial layout or transitions.
  if (width <= 0 || height <= 0) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
```

For an orthographic camera, the equivalent concern is the left/right/top/bottom frustum bounds rather than `aspect` alone. Choose perspective for depth and cinematic scale; choose orthographic when preserving apparent size is more important, such as a flat product diagram or isometric interface.

**Wrong:** resize the renderer but leave the camera untouched.

```js
renderer.setSize(container.clientWidth, container.clientHeight);
// The projection still uses its old aspect ratio.
```

**Right:** update both renderer dimensions and camera projection together. Treat them as one resize operation.

**Gotcha:** CSS width and height do not update the WebGL drawing buffer by themselves. Three.js renderer sizing and camera projection are separate responsibilities.

### 3. Renderer dimensions, CSS dimensions, and device pixel ratio are different

CSS determines how large the canvas appears in layout. The renderer's drawing buffer determines how many pixels the GPU draws. Device pixel ratio (DPR) can make a canvas look crisp on a high-density display, but the number of rendered pixels grows approximately with the square of DPR. DPR 3 can require about nine times as many pixels as DPR 1.

```js
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});

// Keep CSS in charge of layout; use the renderer API for its backing buffer.
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(container.clientWidth, container.clientHeight, false);
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
```

The third argument to `setSize` prevents Three.js from overwriting the canvas's CSS style. This is useful when the container's CSS is the source of truth.

**Naive approach:** set DPR to the device's full value and assume more is always better.

**Senior approach:** cap DPR, measure performance on actual mobile hardware, and consider reducing it further when the scene is decorative rather than content-critical.

**Gotcha:** a pixel-ratio cap improves fill-rate cost, but it does not reduce draw calls, vertex work, texture memory, or shader complexity.

### 4. The render loop needs time-based motion

Animating by adding a fixed amount to rotation every frame ties speed to refresh rate. A 144 Hz display would rotate the object much faster than a 60 Hz display. Use elapsed time or delta time so motion has a defined speed independent of frame rate.

```js
const clock = new THREE.Clock();

function animate() {
  const elapsedSeconds = clock.getElapsedTime();

  // Radians per second makes the intended speed independent of refresh rate.
  heroObject.rotation.y = elapsedSeconds * 0.35;
  heroObject.rotation.x = Math.sin(elapsedSeconds * 0.45) * 0.12;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
```

For state that integrates velocity (for example, a moving object), use delta time and clamp unusually large values after a background-tab pause. For a simple looping hero, elapsed time often produces cleaner, drift-free motion.

**Wrong:** `object.rotation.y += 0.01` on every frame.

**Right:** `object.rotation.y += angularSpeed * deltaSeconds`, or compute rotation from elapsed time.

**Gotcha:** `requestAnimationFrame` is one-shot. Each frame must schedule the next one, and the returned frame ID should be retained so the loop can be cancelled.

### 5. Resize is a lifecycle event, not a one-time setup detail

A creative site may resize because of window changes, browser chrome, a sidebar opening, a grid reflow, or a parent component changing width without the window changing. `window.resize` only observes the viewport. `ResizeObserver` observes the actual element that owns the canvas, which is usually the correct target for embedded scenes.

```js
const sceneContainer = document.querySelector('[data-three-container]');

const resizeObserver = new ResizeObserver((entries) => {
  const entry = entries[0];
  if (!entry) return;

  const { width, height } = entry.contentRect;
  if (width <= 0 || height <= 0) return;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

resizeObserver.observe(sceneContainer);
```

In a full implementation, keep the observer reference and call `disconnect()` during teardown. Do not create a new observer on every resize callback.

**Gotcha:** a container may briefly report zero dimensions while a route transition or hidden tab is in progress. Skip invalid sizes and apply the next valid measurement.

### 6. Separate setup, update, and teardown

Setup allocates resources and registers listeners. Update changes values that vary over time. Teardown stops updates, removes listeners, detaches DOM, and disposes GPU resources. This separation is the difference between a demo and a reusable scene module.

```js
function createHeroScene(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  container.appendChild(renderer.domElement);

  const geometry = new THREE.IcosahedronGeometry(0.9, 2);
  const material = new THREE.MeshStandardMaterial({ color: '#a78bfa', roughness: 0.3 });
  const heroMesh = new THREE.Mesh(geometry, material);
  scene.add(heroMesh);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x302044, 2));

  let frameId = 0;
  let disposed = false;
  const clock = new THREE.Clock();

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderFrame() {
    if (disposed) return;
    heroMesh.rotation.y = clock.getElapsedTime() * 0.25;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(renderFrame);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  renderFrame();

  return function disposeHeroScene() {
    // Mark disposed first so a queued callback cannot restart the loop.
    disposed = true;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
```

**Gotcha:** `renderer.dispose()` does not dispose every geometry, material, texture, or render target you created. Explicitly release resources you own, including textures and post-processing passes when applicable.

### 7. GPU resources need explicit ownership

WebGL resources are not ordinary JavaScript objects. Geometry buffers, textures, shader programs, and render targets may occupy GPU memory. Garbage collection of the JavaScript wrapper is not a reliable substitute for calling Three.js disposal methods.

```js
function disposeMeshResources(mesh) {
  // Geometry buffers are independent from the mesh object.
  mesh.geometry?.dispose();

  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const material of materials) {
    if (!material) continue;

    // A material may reference multiple GPU textures.
    for (const value of Object.values(material)) {
      if (value && value.isTexture) value.dispose();
    }
    material.dispose();
  }
}
```

Only dispose resources that this scene owns. If two meshes share a texture or geometry, disposing it while the other mesh is still active will break the remaining scene. A shared asset cache should own shared resources and release them when its final consumer is gone.

**Gotcha:** removing a mesh with `scene.remove(mesh)` only detaches it from the scene graph. It does not free its GPU allocations.

### 8. Visibility and pause policy save battery

A decorative hero often has no reason to render while the browser tab is hidden. The Page Visibility API can pause the loop and reset timing when the page becomes visible again. This reduces wasted work and prevents a large delta-time jump from producing a sudden motion spike.

```js
let isPageVisible = !document.hidden;
let frameId = 0;

function handleVisibilityChange() {
  isPageVisible = !document.hidden;

  if (isPageVisible) {
    // Resume through the normal frame scheduler; don't start duplicate loops.
    if (!frameId) frameId = requestAnimationFrame(renderFrame);
  } else {
    cancelAnimationFrame(frameId);
    frameId = 0;
  }
}

document.addEventListener('visibilitychange', handleVisibilityChange);
```

Integrate this policy with the main render loop rather than adding a second independent scheduler. If a scene is also paused by reduced-motion settings or an offscreen observer, centralize the reasons for pausing so one event cannot accidentally resume a scene that another event intended to keep stopped.

### 9. WebGL failure must have a designed fallback

WebGL may be unavailable, blocked, or fail during context creation. A premium portfolio should not leave an empty rectangle or a permanent loading label. Provide meaningful HTML content behind or alongside the canvas, and treat 3D as enhancement rather than the only way to understand the page.

```js
function createRendererOrFallback(container) {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    return renderer;
  } catch (error) {
    console.error('Unable to initialize the 3D hero:', error);
    container.dataset.renderState = 'fallback';
    container.setAttribute('aria-label', 'Decorative 3D artwork unavailable');
    return null;
  }
}
```

The surrounding HTML should still include the hero heading, project description, and primary call to action. Do not hide core content inside the WebGL canvas.

**Gotcha:** renderer creation succeeding does not guarantee the context will remain available. For long-running applications, listen for `webglcontextlost` and `webglcontextrestored`, and decide whether to rebuild or show a fallback.

### 10. Alpha, clear color, and compositing are intentional choices

A transparent canvas is useful when 3D objects float over a CSS gradient, video, or image. An opaque canvas can be cheaper and simpler when the scene owns its entire background. The renderer's alpha setting, clear color alpha, and CSS stacking must agree.

```js
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});

// Let the page background show through pixels where the scene draws nothing.
renderer.setClearColor(0x000000, 0);
renderer.domElement.style.display = 'block';
```

```css
.hero-visual {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none; /* Decorative canvas must not block hero links. */
}

.hero-visual canvas {
  width: 100%;
  height: 100%;
  display: block;
}
```

**Naive approach:** place the canvas above every interactive element and discover later that buttons cannot be clicked.

**Better approach:** use a deliberate stacking order. Set `pointer-events: none` for decorative scenes; enable pointer input only when the scene has meaningful interactions.

### 11. Color management and output settings affect the final look

Three.js uses color management to interpret material colors and textures. If the output color space or tone mapping differs from what the scene expects, colors can look washed out, too dark, or unlike the design mockup. Set renderer output behavior explicitly when consistency matters, and validate the result with real assets rather than relying on a single primitive.

```js
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Tone mapping is a creative choice; use it consistently across the scene.
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
```

Do not blindly copy renderer settings from a random demo. Match the settings to the lighting, texture color spaces, and target look. Color textures such as albedo maps commonly need sRGB interpretation; data textures such as normal and roughness maps should not be treated as color images.

**Gotcha:** color-management behavior can change across Three.js releases. Keep the version pinned and review migration notes when upgrading.

### 12. Accessibility and motion preferences belong in the scene architecture

A 3D hero is often decorative, but the page around it is still an interface. Keyboard users must reach the same links and controls, screen readers need meaningful text in HTML, and touch users should not be expected to hover. If motion is intense or continuous, respect `prefers-reduced-motion` and provide a static composition or lower-motion mode.

```js
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let shouldAnimate = !reducedMotionQuery.matches;

function handleMotionPreference(event) {
  shouldAnimate = !event.matches;
}

reducedMotionQuery.addEventListener('change', handleMotionPreference);
```

Use this preference in the one render scheduler: render a static frame when reduced motion is enabled, and avoid scheduling continuous animation unless the user explicitly requests it. Keep `removeEventListener` in teardown.

```css
.hero-link:focus-visible {
  outline: 3px solid #c4b5fd;
  outline-offset: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .hero-link {
    animation: none;
    transition: none;
  }
}
```

**Gotcha:** reduced motion is not the same as disabling all visual feedback. Keep focus states and essential state changes visible without large movement.

### 13. Container sizing and CSS layout must be stable

A canvas needs a parent with a meaningful size. An absolutely positioned canvas inside a parent with no height can render at zero height. Use semantic page structure and define the visual container's dimensions in CSS. Avoid using the canvas as the layout's only content.

```html
<main class="portfolio-hero">
  <section class="hero-copy" aria-labelledby="hero-title">
    <p class="eyebrow">Creative engineering</p>
    <h1 id="hero-title">Interfaces with another dimension.</h1>
    <p>Interactive web experiences built with code, motion, and 3D.</p>
    <a class="hero-link" href="/work">Explore selected work</a>
  </section>
  <figure class="hero-visual" data-three-container aria-hidden="true">
    <figcaption class="sr-only">Decorative 3D artwork.</figcaption>
  </figure>
</main>
```

```css
.portfolio-hero {
  position: relative;
  isolation: isolate;
  min-height: min(90svh, 900px);
  display: grid;
  align-items: center;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 42rem;
  padding: clamp(1.5rem, 6vw, 6rem);
}

.hero-visual {
  position: absolute;
  inset: 0;
  z-index: 0;
  margin: 0;
  min-height: 20rem;
}
```

The example uses semantic `main`, `section`, `figure`, `figcaption`, heading, paragraph, and anchor elements. The canvas itself is hidden from assistive technology because the content is decorative and duplicated by accessible HTML.

### 14. Debugging should measure the scene, not guess

When a scene is blank or slow, isolate the pipeline: confirm the container has dimensions, verify the renderer canvas is attached, inspect the camera, render a basic mesh, then add material and lighting complexity. Use browser DevTools for console errors and layout dimensions. Use `renderer.info` to inspect draw calls, geometries, textures, and triangles.

```js
function logSceneDiagnostics({ container, camera, renderer }) {
  const rect = container.getBoundingClientRect();

  console.table({
    containerWidth: rect.width,
    containerHeight: rect.height,
    cameraAspect: camera.aspect,
    canvasWidth: renderer.domElement.width,
    canvasHeight: renderer.domElement.height,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  });
}
```

Call the helper after initial layout and during targeted debugging, not every frame. For frame timing, use the Performance panel and test on a throttled CPU or a real mid-range phone. A high desktop frame rate does not prove that the scene is inexpensive.

**Gotcha:** `renderer.info` counts renderer-managed resources and draw calls, but it is not a complete GPU profiler. Use it as a signal, then validate with browser performance tools and physical devices.

---

## Integration Patterns

### Pattern 1 — Responsive hero scene module

**What it does:** packages renderer setup, resize handling, animation, and cleanup behind one function.  
**When to use it:** a portfolio hero or client landing page where the 3D canvas belongs to one known container.

```js
import * as THREE from 'three';

export function mountPortfolioHero(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 4.5);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const heroGeometry = new THREE.TorusKnotGeometry(0.72, 0.2, 120, 16);
  const heroMaterial = new THREE.MeshPhysicalMaterial({
    color: '#9c8cff',
    roughness: 0.25,
    metalness: 0.15,
    clearcoat: 0.7,
  });
  const heroMesh = new THREE.Mesh(heroGeometry, heroMaterial);
  scene.add(heroMesh);
  scene.add(new THREE.HemisphereLight(0xe5e7ff, 0x24162f, 2));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);

  const clock = new THREE.Clock();
  let frameId = 0;
  let disposed = false;

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width < 1 || height < 1) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function tick() {
    if (disposed) return;
    const elapsed = clock.getElapsedTime();
    heroMesh.rotation.y = elapsed * 0.24;
    heroMesh.rotation.x = Math.sin(elapsed * 0.4) * 0.08;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(tick);
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  tick();

  return () => {
    disposed = true;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    heroGeometry.dispose();
    heroMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
```

### Pattern 2 — Pause when offscreen or hidden

**What it does:** stops unnecessary rendering when a scene cannot be seen.  
**When to use it:** long landing pages with a 3D section far below the fold, especially on mobile.

```js
export function createVisibilityController(container, start, stop) {
  let isVisible = false;
  let isPageVisible = !document.hidden;

  function synchronize() {
    // A scene may run only when both the section and browser tab are visible.
    if (isVisible && isPageVisible) start();
    else stop();
  }

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    isVisible = Boolean(entry?.isIntersecting);
    synchronize();
  }, { threshold: 0.05 });

  function onVisibilityChange() {
    isPageVisible = !document.hidden;
    synchronize();
  }

  intersectionObserver.observe(container);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    stop();
  };
}
```

The `start` callback must be idempotent: calling it twice should not create two animation loops. The `stop` callback should cancel the existing frame and clear its frame ID.

### Pattern 3 — Reduced-motion static mode

**What it does:** renders a single composed frame for users who request reduced motion.  
**When to use it:** hero scenes with continuous rotation, floating objects, or scroll-linked camera movement.

```js
export function attachMotionPreference({ renderStatic, startAnimation, stopAnimation }) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');

  function applyPreference() {
    if (query.matches) {
      stopAnimation();
      renderStatic();
    } else {
      startAnimation();
    }
  }

  query.addEventListener('change', applyPreference);
  applyPreference();

  return () => {
    query.removeEventListener('change', applyPreference);
    stopAnimation();
  };
}
```

This pattern keeps preference handling outside the mesh's update logic. Integrate it with the scene's visibility controller so reduced-motion mode cannot be accidentally overridden by an intersection event.

### Pattern 4 — Graceful WebGL fallback

**What it does:** preserves the page's purpose when renderer initialization fails.  
**When to use it:** every public-facing site where the 3D scene is decorative or supplementary.

```js
export function mountOptionalThreeScene(container, mountScene) {
  try {
    return mountScene(container);
  } catch (error) {
    console.error('3D enhancement failed; retaining HTML content.', error);
    container.dataset.sceneStatus = 'unavailable';

    const fallback = document.createElement('p');
    fallback.className = 'scene-fallback';
    fallback.textContent = 'Interactive artwork is unavailable on this device.';
    container.appendChild(fallback);

    return () => fallback.remove();
  }
}
```

Do not replace essential HTML with the fallback message. The heading, project links, and explanatory text should exist independently of WebGL.

### Pattern 5 — Scroll-linked scene without per-frame React state

**What it does:** maps scroll progress to a camera or object transform while keeping updates out of a React render cycle.  
**When to use it:** a scrollytelling portfolio section with a camera move or object reveal.

```js
export function connectScrollProgress(section, updateScene) {
  let latestProgress = 0;
  let scheduledFrame = 0;

  function measureProgress() {
    const bounds = section.getBoundingClientRect();
    const travel = bounds.height - window.innerHeight;
    latestProgress = travel <= 0
      ? 0
      : Math.max(0, Math.min(1, -bounds.top / travel));

    if (!scheduledFrame) {
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = 0;
        // Update Three.js objects directly; don't trigger UI renders per scroll tick.
        updateScene(latestProgress);
      });
    }
  }

  window.addEventListener('scroll', measureProgress, { passive: true });
  window.addEventListener('resize', measureProgress);
  measureProgress();

  return () => {
    window.removeEventListener('scroll', measureProgress);
    window.removeEventListener('resize', measureProgress);
    cancelAnimationFrame(scheduledFrame);
  };
}
```

For complex sequencing, use GSAP ScrollTrigger or another well-tested scroll system rather than creating competing scroll loops. Clamp progress and handle sections shorter than the viewport.

### Pattern 6 — Route-safe teardown

**What it does:** guarantees that a single-page-app route unmount releases its scene resources.  
**When to use it:** React, Next.js, or any client-side router where components mount and unmount without a full page reload.

```jsx
import { useEffect, useRef } from 'react';
import { mountPortfolioHero } from './mountPortfolioHero.js';

export function ThreeHero() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const disposeScene = mountPortfolioHero(container);

    // React calls this cleanup before re-running the effect and on unmount.
    return () => disposeScene();
  }, []);

  return (
    <figure
      ref={containerRef}
      className="three-hero"
      aria-hidden="true"
    />
  );
}
```

In React Strict Mode during development, effects may be set up, cleaned up, and set up again to expose lifecycle bugs. A correct disposer must make repeated mount/unmount cycles safe. Do not suppress the behavior; fix duplicate listeners and leaked resources.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| Updating renderer size but not camera aspect | Renderer and camera are treated as one automatic system | Update `camera.aspect` and call `camera.updateProjectionMatrix()` in the same resize handler |
| Animating by a fixed per-frame increment | Desktop testing hides refresh-rate dependence | Use elapsed seconds or delta time to express speed in time units |
| Using full device pixel ratio everywhere | High-DPI displays look crisp, so cost is overlooked | Cap DPR and test at 1.25–1.75 on mid-range mobile devices |
| Calling `scene.remove()` and assuming memory is freed | Scene graph removal looks like object destruction | Dispose owned geometries, materials, textures, render targets, and passes |
| Creating a new RAF loop after every visibility event | Start/stop responsibilities are not centralized | Store one frame ID and make `start()` idempotent |
| Leaving observers attached after route changes | Demo code never unmounts | Return one disposer that disconnects observers and removes listeners |
| Sizing from `window.innerWidth` only | The canvas may live inside a column or modal | Observe the actual scene container with `ResizeObserver` |
| Rendering when width or height is zero | Hidden tabs and route transitions can collapse layout | Ignore invalid sizes and resize on the next valid observer notification |
| Putting all content inside the canvas | The visual prototype becomes the whole page architecture | Keep headings, links, and core information in semantic HTML |
| Letting a decorative canvas intercept clicks | Canvas stacking order is not considered | Apply `pointer-events: none` unless the scene needs interaction |
| Using standard materials with no light | Material response is mistaken for a color setting | Add deliberate lights or choose an unlit material for a specific look |
| Ignoring context loss | GPU resources can be reclaimed by the browser or driver | Listen for context loss and present a fallback or rebuild path |
| Logging diagnostics every frame | Debug instrumentation adds noise and overhead | Call a diagnostics helper on demand or at coarse intervals |
| Sharing disposable resources without ownership rules | Multiple meshes reference the same geometry or texture | Put shared assets under a cache/owner and dispose only after the final consumer |
| Rebuilding the renderer on every resize | Resize is mistaken for a full scene reset | Reuse renderer and camera; update dimensions and projection only |
| Treating reduced motion as a CSS-only concern | Three.js motion is driven by JavaScript | Gate the render scheduler and show a static frame when requested |

---

## Mental Models

1. **Scene graph = ownership tree** — parent-child structure describes transforms and grouping; it does not automatically dispose resources.
2. **Camera projection = lens math** — renderer size and camera projection must be updated together or the scene's framing lies.
3. **DPR is a GPU budget multiplier** — doubling DPR roughly quadruples pixel work, so sharper is not free.
4. **RAF is a scheduled job** — retain its ID, schedule one successor, and cancel it during pause or teardown.
5. **Setup allocates; teardown releases** — every observer, listener, animation loop, geometry, material, and texture needs a clear owner.
6. **HTML is the content; WebGL is the enhancement** — a failed 3D renderer should not erase the page's meaning or conversion path.
7. **Visibility is a state machine** — viewport visibility, tab visibility, reduced motion, and user pause must agree before continuous rendering runs.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|-------------------|-------------|-------|
| Install | `npm install three` | Pin versions in the lockfile for reproducible output |
| Perspective camera | `new THREE.PerspectiveCamera(fov, aspect, near, far)` | `aspect = width / height` |
| Projection update | `camera.updateProjectionMatrix()` | Required after changing aspect or frustum values |
| Renderer creation | `new THREE.WebGLRenderer({ antialias: true })` | Antialiasing has a cost; validate on mobile |
| Transparent canvas | `{ alpha: true }` and clear alpha `0` | Useful over CSS backgrounds |
| Opaque canvas | `{ alpha: false }` | Suitable when the scene owns the background |
| Pixel ratio | `Math.min(devicePixelRatio, 1.5)` | Tune based on scene complexity and device tests |
| Renderer sizing | `renderer.setSize(width, height, false)` | `false` leaves CSS sizing to the container |
| Container resize | `ResizeObserver` | More reliable than viewport resize alone |
| Animation scheduling | `requestAnimationFrame()` | Store ID; cancel on pause/unmount |
| Time-based rotation | `elapsedSeconds * radiansPerSecond` | Stable across refresh rates |
| Delta-time movement | `velocity * deltaSeconds` | Clamp delta after pauses |
| Stop RAF | `cancelAnimationFrame(frameId)` | Also clear stored ID to prevent duplicate starts |
| Geometry cleanup | `geometry.dispose()` | Required when no longer used |
| Material cleanup | `material.dispose()` | Does not dispose every referenced texture automatically |
| Texture cleanup | `texture.dispose()` | Only when the scene owns it |
| Renderer cleanup | `renderer.dispose()` | Pair with explicit resource cleanup |
| Draw-call diagnostics | `renderer.info.render.calls` | Watch draw calls as scene complexity grows |
| Triangle diagnostics | `renderer.info.render.triangles` | A useful signal, not a full GPU profile |
| Hidden tab | `document.hidden` | Pause decorative continuous rendering |
| Offscreen section | `IntersectionObserver` | Avoid rendering far below the fold |
| Reduced motion | `matchMedia('(prefers-reduced-motion: reduce)')` | Static frame or restrained motion |
| Decorative canvas | `pointer-events: none` | Keeps underlying links clickable |
| Fallback | HTML content outside canvas | Preserve the page's core message and CTA |
| Browser support | Feature-detect renderer creation | Test Safari, Firefox, and Chromium-based browsers |
| WebGL context loss | `webglcontextlost` / `webglcontextrestored` | Decide whether to rebuild or fall back |
| Production test | Real phone + DevTools Performance panel | Desktop FPS alone is insufficient |

---

## Build Challenge

### Build a responsive 3D portfolio hero with lifecycle controls

Build a portfolio hero containing an animated torus knot or icosahedron, accessible HTML copy, a primary CTA, and a background that remains attractive if WebGL fails.

#### Requirements

1. Create a Vite project and install Three.js with a pinned dependency version.
2. Build a semantic hero using `main`, `section`, `h1`, paragraphs, an anchor, and a dedicated figure/container for the canvas.
3. Create a scene, perspective camera, renderer, mesh, geometry, material, and at least two lights.
4. Make the canvas fill its parent without taking over the page's layout dimensions.
5. Use `ResizeObserver` to update renderer size and camera aspect when the container changes size.
6. Cap pixel ratio and document why the chosen cap is appropriate for this decorative scene.
7. Animate using elapsed time or delta time; do not use a fixed rotation increment per frame.
8. Store the animation frame ID and implement pause/resume without creating duplicate loops.
9. Pause continuous rendering when the browser tab is hidden or the hero is not visible.
10. Respect `prefers-reduced-motion` by rendering a static frame or a restrained alternative.
11. Provide a WebGL initialization fallback while keeping the headline and CTA usable.
12. Implement one teardown function that cancels RAF, disconnects observers, removes event listeners, disposes owned GPU resources, and removes the canvas.
13. Add a diagnostic helper that logs container dimensions, camera aspect, draw calls, triangles, geometry count, and texture count.
14. Test at desktop width, narrow mobile width, and a high-DPR viewport; confirm the object is not stretched or unnecessarily expensive.
15. Use keyboard navigation to verify the CTA remains reachable and has a visible `:focus-visible` outline.
16. Test browser support in at least two browser engines where available, such as Chromium and Safari or Firefox.
17. Deliberately break renderer initialization or simulate a missing WebGL context and verify the HTML fallback still communicates the page's purpose.
18. Mount and unmount the scene at least five times in development and verify there are no duplicate loops, listeners, or steadily increasing resource counts.
19. Use DevTools Performance recording to check for long main-thread tasks and frame drops during animation.
20. Write a short README section explaining scene ownership, resize behavior, fallback behavior, and how to tune DPR.

### Definition of done

- [ ] The canvas tracks its container's width and height without distortion.
- [ ] The camera projection updates after every valid resize.
- [ ] Rotation speed remains consistent across different refresh rates.
- [ ] The render loop can pause and resume without multiplying active loops.
- [ ] The page remains understandable and navigable when WebGL is unavailable.
- [ ] Reduced-motion preference prevents unnecessary continuous motion.
- [ ] Teardown removes listeners and observers and disposes resources owned by the scene.
- [ ] Repeated mount/unmount cycles do not leave extra canvases behind.
- [ ] Mobile rendering remains visually acceptable with a capped pixel ratio.
- [ ] Diagnostics show plausible draw-call, triangle, geometry, and texture counts.
- [ ] The CTA is keyboard accessible and has a visible focus indicator.
- [ ] The README explains the important lifecycle decisions rather than merely listing commands.

### Failure scenario to debug

After navigating away from the hero and returning to it five times, the page becomes progressively slower. Use DevTools and the diagnostics helper to identify whether multiple RAF loops, stale observers, duplicated canvases, or undisposed GPU resources are accumulating. Fix the ownership problem instead of lowering visual quality to hide it.

---

## Production Notes

### Error handling and operational boundaries

A creative scene should fail locally, not take down the rest of the page. Catch renderer initialization errors at the scene boundary, log enough context to diagnose the issue, and preserve the HTML experience. Avoid swallowing every error silently; a fallback is for users, while a useful console message is for developers. If a model or texture is added later, handle its loading error separately and keep the scene's loading state finite.

```js
function reportSceneFailure(error, container) {
  // Keep diagnostic detail in developer tools while exposing a calm user-facing state.
  console.error('[portfolio-hero] Scene failed to initialize', {
    message: error instanceof Error ? error.message : String(error),
    width: container.clientWidth,
    height: container.clientHeight,
  });

  container.dataset.sceneStatus = 'fallback';
}
```

### Security considerations

Three.js itself does not make arbitrary asset URLs safe. If a client-controlled CMS supplies model or texture URLs, validate allowed origins and file types on the server, enforce sensible size limits, and avoid passing untrusted strings into HTML with `innerHTML`. Prefer fixed asset manifests or an allowlist for portfolio scenes. Treat third-party GLTF files as untrusted input: keep dependencies updated, limit asset complexity, and do not assume a model is harmless because it is visual data.

### Browser and compatibility checks

Modern Three.js targets WebGL-capable browsers, but GPU drivers and device capabilities vary. Test on Safari as well as Chromium where possible, and include Firefox in the validation matrix when it is part of the audience. Feature detection is more useful than guessing from user-agent strings. Newer renderer features or APIs may have different support, so consult the Three.js version's documentation and release notes before relying on them.

### Performance budget

Set a practical target before polishing: one renderer for a hero, a modest number of draw calls, bounded DPR, compressed models and textures when assets are introduced, and no unnecessary continuous render loop while hidden. Profile before optimizing. If the scene is decorative, it should never make text input, navigation, scrolling, or the primary CTA feel sluggish.

The goal is a scene that can be maintained. Keep Three.js version upgrades deliberate, review API changes, and rerun the resize, reduced-motion, context-failure, and mount/unmount tests after upgrades.
