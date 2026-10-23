# SKILL: threejs-mobile

**Layer:** 06 — Three.js / WebGL

**Goal:** Ship Three.js experiences that remain responsive, readable, battery-conscious, and interaction-safe across mobile devices, touch input, high-density screens, and constrained GPUs.

## Why This Matters (Senior Perspective)

A desktop 3D scene is not automatically a mobile-ready experience. Phones have less sustained GPU headroom, tighter thermal limits, smaller screens, more varied aspect ratios, touch instead of hover, and browsers whose visible viewport can change as browser chrome appears or disappears. A scene that looks smooth for ten seconds on a laptop can stutter or overheat a phone after a minute. A model that fits a wide monitor can become a tiny speck on a portrait screen, while controls designed around hover may expose no useful information at all.

The wrong response is to shrink every value with a media query and hope for the best. Mobile performance depends on several budgets at once: geometry, texture memory, pixel count, draw calls, shadows, post-processing, JavaScript work, and the time spent rendering when the scene is not visible. A high device pixel ratio can multiply the number of rendered pixels dramatically. A physically plausible lighting setup with large shadow maps and several full-screen effects may be more expensive than the model itself. A senior developer measures the scene, establishes quality tiers, and degrades expensive effects deliberately instead of sacrificing the entire visual design.

Mobile-ready creative work also respects the device's interaction model and physical context. Touch has no dependable hover, tap targets need space, gestures can conflict with page scrolling, and motion preferences still matter. The semantic content should remain available outside the canvas, loading should have a useful fallback, and the experience should pause or reduce work when hidden. This skill gives you a practical way to create a compelling 3D experience without treating mobile as an afterthought.

## Core Concepts

### 1. Pixel ratio is a rendering budget

A renderer configured with the device's full pixel ratio may draw several times more pixels than a CSS-sized canvas suggests. Pixel count grows approximately with the square of the pixel ratio: moving from `1` to `3` can mean around nine times as many pixels. This affects fragment shading, anti-aliasing, and full-screen post-processing.

```js
function configureRendererForDevice(renderer, canvas) {
  const pixelRatio = window.devicePixelRatio || 1;

  // A cap protects fill-rate on high-density devices while preserving crispness.
  renderer.setPixelRatio(Math.min(pixelRatio, 1.75));

  const rect = canvas.getBoundingClientRect();
  renderer.setSize(
    Math.max(1, rect.width),
    Math.max(1, rect.height),
    false
  );
}
```

A cap is a starting point, not a universal optimum. Test at `1`, `1.5`, and `2` on representative devices and compare frame time, heat, and visual quality. If the scene is mostly flat UI with fine text, a higher pixel ratio may matter; if it is a large shaded object with heavy post-processing, a lower ratio may be the better trade-off.

### 2. Quality tiers should be explicit

Do not scatter device-specific conditions across scene setup, materials, and animation code. Create one quality profile that defines the main costs. Base the initial tier on conservative heuristics, then use profiling or user settings to refine it. User-agent detection is brittle and should not be the only decision mechanism.

```js
function getQualityProfile({ width, pixelRatio, memoryGB, cores }) {
  const constrained =
    width < 420 ||
    pixelRatio > 2.5 ||
    (memoryGB && memoryGB <= 4) ||
    (cores && cores <= 4);

  if (constrained) {
    return {
      pixelRatio: 1.25,
      shadows: false,
      postProcessing: false,
      particleCount: 120,
      antialias: false,
    };
  }

  return {
    pixelRatio: Math.min(pixelRatio || 1, 1.75),
    shadows: true,
    postProcessing: true,
    particleCount: 500,
    antialias: true,
  };
}

const profile = getQualityProfile({
  width: window.innerWidth,
  pixelRatio: window.devicePixelRatio,
  memoryGB: navigator.deviceMemory,
  cores: navigator.hardwareConcurrency,
});
```

`navigator.deviceMemory` is not available in every browser and may be rounded or omitted for privacy. `hardwareConcurrency` is also only a rough signal. Supply sensible defaults and allow an explicit low/medium/high override when the experience warrants it.

### 3. Mobile layout needs its own composition

A desktop camera framing often assumes width is available for negative space and horizontal movement. On portrait screens, a model may be clipped, hidden behind text, or placed too far away. Keep responsive scene composition separate from DOM layout rules.

```js
function applySceneComposition(camera, model, width, height) {
  const aspect = width / Math.max(1, height);

  if (aspect < 0.75) {
    // Portrait composition brings the subject closer and centers the visual weight.
    camera.position.set(0, 0.35, 6.5);
    model.position.set(0, -0.15, 0);
    model.scale.setScalar(0.82);
  } else {
    camera.position.set(2.2, 0.6, 5.5);
    model.position.set(0.35, 0, 0);
    model.scale.setScalar(1);
  }

  camera.aspect = aspect;
  camera.updateProjectionMatrix();
}
```

The values depend on your model's scale and camera field of view. The principle is to art-direct a portrait composition rather than simply squeeze the desktop scene into a narrower viewport.

### 4. Touch interactions must be explicit

A touch device does not have a reliable hover state. If a project title or control appears only when a pointer hovers over a model, it is effectively hidden for many users. Use tap to select, a visible selected state, and an accessible DOM list for important actions.

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function setPointerFromTouch(event, canvas) {
  const touch = event.changedTouches[0];
  const rect = canvas.getBoundingClientRect();

  pointer.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
}

canvas.addEventListener('pointerup', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;

  // Pointer Events provide one path for mouse, pen, and touch.
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(interactiveObjects, true)[0];
  if (hit) selectInteractiveTarget(hit);
});
```

Prefer Pointer Events over separate mouse and touch implementations unless you need touch-specific gesture details. Decide whether the canvas is intended to capture gestures or let the page scroll; `touch-action` is part of that contract. Avoid `touch-action: none` across a large page unless the 3D interaction genuinely needs full gesture control.

### 5. Shadows and post-processing are optional quality costs

Real-time shadows and full-screen effects can be expensive on mobile GPUs. The right design is not necessarily “no shadows”; it is to preserve the effect that contributes most to the composition. A baked contact shadow, a soft transparent shadow plane, or carefully chosen lighting may provide enough depth at a fraction of the cost.

```js
function applyQualityProfile(renderer, scene, profile) {
  renderer.setPixelRatio(profile.pixelRatio);
  renderer.shadowMap.enabled = profile.shadows;

  scene.traverse((object) => {
    if (object.isLight && 'castShadow' in object) {
      object.castShadow = profile.shadows;
    }
  });
}
```

This toggles the shadow map and light flags, but it does not automatically dispose or reconfigure a post-processing composer. If you use an `EffectComposer`, create or select a profile-specific pass stack and resize it correctly. Do not keep expensive passes active merely because their output is hidden behind another layer.

### 6. Pause work when the experience is not visible

A 3D scene can keep consuming battery while its section is below the fold or the browser tab is hidden. Use page visibility and intersection state to decide whether continuous rendering is necessary. Avoid starting multiple animation loops when a component becomes visible more than once.

```js
let frameId = 0;
let running = false;

function frame() {
  if (!running) return;

  frameId = requestAnimationFrame(frame);
  updateScene();
  renderer.render(scene, camera);
}

function startRendering() {
  if (running) return;
  running = true;
  frameId = requestAnimationFrame(frame);
}

function stopRendering() {
  running = false;
  cancelAnimationFrame(frameId);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopRendering();
  else startRendering();
});
```

For a page with multiple 3D sections, combine page visibility with an `IntersectionObserver` so off-screen scenes can pause. On resume, reset or clamp large time deltas so an animation does not jump forward after a long pause.

### 7. Use memory-aware asset delivery

Mobile readiness begins before the model reaches the GPU. Large GLB files, oversized textures, and multiple duplicate materials increase download time and memory pressure. Use compressed geometry and textures where supported, choose texture resolution based on how large the asset appears on screen, and load noncritical assets only when needed.

```js
const textureLoader = new THREE.TextureLoader();

function loadTexture(url, { maxAnisotropy = 4 } = {}) {
  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        // Anisotropy improves oblique detail but should be kept within device limits.
        texture.anisotropy = Math.min(
          maxAnisotropy,
          renderer.capabilities.getMaxAnisotropy()
        );
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}
```

Anisotropy is only one part of texture cost; texture dimensions and formats usually matter much more. Use KTX2/Basis textures where your asset pipeline supports them, and ensure the loader/transcoder configuration is correct. Provide a lightweight fallback if the main asset fails to load.

### 8. Resize around dynamic mobile viewports

Mobile browser chrome can change the visible viewport while the page scrolls. `100vh` may not behave as designers expect on every browser version. Prefer modern viewport units such as `100svh` or `100dvh` where appropriate, and observe the actual container size for renderer dimensions.

```css
.scene-shell {
  min-height: 100svh;
}

.scene-shell__canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

```js
const resizeObserver = new ResizeObserver(() => {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

resizeObserver.observe(canvas);
```

Use `100dvh` when the design should track the currently visible viewport and `100svh` when stable small-viewport sizing is preferable. Avoid forcing a full-screen canvas on pages where normal reading and scrolling should remain in control.

## Advanced Patterns

### Pattern 1: Centralized mobile quality profiles

**Use when:** One experience needs different rendering costs across phones, tablets, and desktop computers.

```js
const QUALITY_PROFILES = {
  low: {
    pixelRatio: 1,
    shadows: false,
    particleCount: 80,
    antialias: false,
  },
  medium: {
    pixelRatio: 1.35,
    shadows: false,
    particleCount: 220,
    antialias: true,
  },
  high: {
    pixelRatio: 1.75,
    shadows: true,
    particleCount: 600,
    antialias: true,
  },
};

function applyProfile(renderer, scene, profile) {
  renderer.setPixelRatio(profile.pixelRatio);
  renderer.shadowMap.enabled = profile.shadows;

  scene.traverse((object) => {
    if (object.isLight && 'castShadow' in object) {
      object.castShadow = profile.shadows;
    }
  });

  return profile;
}
```

Choose the initial profile conservatively and consider a visible quality setting for experiences where users may prefer visual fidelity over battery life. Keep profile application centralized so every expensive subsystem responds consistently.

### Pattern 2: Pause rendering when off-screen

**Use when:** A hero scene or product viewer sits inside a longer page.

```js
let visible = false;
let pageVisible = !document.hidden;
let frameId = 0;

function shouldRender() {
  return visible && pageVisible;
}

function tick() {
  if (!shouldRender()) {
    frameId = 0;
    return;
  }

  updateScene();
  renderer.render(scene, camera);
  frameId = requestAnimationFrame(tick);
}

function ensureFrame() {
  if (shouldRender() && frameId === 0) {
    frameId = requestAnimationFrame(tick);
  }
}

const visibilityObserver = new IntersectionObserver(([entry]) => {
  visible = entry.isIntersecting;
  ensureFrame();
});

visibilityObserver.observe(canvas);

document.addEventListener('visibilitychange', () => {
  pageVisible = !document.hidden;
  ensureFrame();
});
```

In production, the lifecycle must also cancel a pending frame when visibility becomes false and handle cleanup. This pattern shows the scheduling contract: render only when both the page and the scene are visible. Do not let separate observers start independent loops.

### Pattern 3: Adaptive pixel ratio based on measured frame time

**Use when:** A scene varies in cost as effects or model complexity change, and you want a cautious quality adjustment.

```js
let currentPixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
let slowFrames = 0;
let fastFrames = 0;

function observeFrameTime(frameMs, renderer) {
  if (frameMs > 22) {
    slowFrames += 1;
    fastFrames = 0;
  } else if (frameMs < 14) {
    fastFrames += 1;
    slowFrames = 0;
  } else {
    slowFrames = 0;
    fastFrames = 0;
  }

  // Require sustained evidence before changing quality to avoid visible oscillation.
  if (slowFrames >= 30 && currentPixelRatio > 1) {
    currentPixelRatio = Math.max(1, currentPixelRatio - 0.15);
    renderer.setPixelRatio(currentPixelRatio);
    slowFrames = 0;
  } else if (fastFrames >= 180 && currentPixelRatio < 1.75) {
    currentPixelRatio = Math.min(1.75, currentPixelRatio + 0.1);
    renderer.setPixelRatio(currentPixelRatio);
    fastFrames = 0;
  }
}
```

Feed this function a measured frame duration from your single animation loop. This is a basic heuristic, not a substitute for device testing: CPU stalls, asset loading, and browser scheduling can also affect frame time. Add hysteresis and a maximum quality cap so the renderer does not visibly oscillate.

### Pattern 4: Touch-friendly object picking

**Use when:** Users tap 3D cards or products on a phone.

```js
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pickFromPointer(event, canvas, camera, targets) {
  const rect = canvas.getBoundingClientRect();
  ndc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(targets, true);
  return hits[0] ?? null;
}

canvas.addEventListener('pointerup', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;

  const hit = pickFromPointer(event, canvas, camera, interactiveTargets);
  if (hit) activateTarget(hit);
});
```

For touch, make hit targets forgiving where appropriate, but do not enlarge them so much that overlapping objects become impossible to select predictably. If the canvas supports drag gestures, distinguish taps from drags with a movement threshold and define how gestures interact with page scrolling.

### Pattern 5: Reduced motion and low-power mode

**Use when:** The scene includes continuous rotation, parallax, or camera movement.

```js
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionPreference.matches;

function updateSceneMotion(deltaTime) {
  if (reducedMotion) {
    // Keep a stable representative pose instead of continuous motion.
    model.rotation.set(0, 0.15, 0);
    return;
  }

  model.rotation.y += deltaTime * 0.12;
}

motionPreference.addEventListener('change', (event) => {
  reducedMotion = event.matches;
});
```

The example is a minimal policy; a complete implementation also removes unnecessary render-loop work when the scene is static. Reduced motion and low power are related but not identical: do not infer a user's motion preference from device class, and do not assume every mobile user wants a static scene.

### Pattern 6: Lightweight fallback for WebGL or asset failure

**Use when:** The 3D scene is part of a landing page and must not leave a blank hero when rendering fails.

```js
function showSceneFallback(container, message = 'Explore the project below.') {
  container.classList.add('scene-shell--fallback');

  const status = document.createElement('p');
  status.className = 'scene-shell__status';
  status.textContent = message;
  status.setAttribute('role', 'status');

  container.append(status);
}

function createRendererOrFallback(container) {
  try {
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });

    return renderer;
  } catch (error) {
    showSceneFallback(container);
    return null;
  }
}
```

Do not swallow failures silently. Log diagnostics in development, preserve semantic content, and make sure the fallback does not duplicate itself if initialization is retried. `powerPreference` is a hint, not a guarantee that a browser will select a particular GPU.

### Pattern 7: Mobile asset and scene checklist

**Use when:** Preparing a production build or reviewing a creative portfolio experience.

```js
const mobileReadiness = {
  cappedPixelRatio: true,
  qualityProfiles: true,
  compressedGeometry: true,
  appropriatelySizedTextures: true,
  touchSelection: true,
  keyboardAlternative: true,
  reducedMotion: true,
  offscreenPause: true,
  resizeObserver: true,
  fallbackUI: true,
};

const missingRequirements = Object.entries(mobileReadiness)
  .filter(([, implemented]) => !implemented)
  .map(([requirement]) => requirement);

if (missingRequirements.length) {
  console.warn('Mobile readiness gaps:', missingRequirements);
}
```

This checklist is deliberately explicit. Replace the hard-coded values with real build checks or a documented QA checklist in your project. It is not a runtime capability detector; it is a way to make omissions visible during review.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using the full device pixel ratio everywhere | High-density displays look sharper by default | Cap pixel ratio and test frame time on representative devices |
| Treating mobile as a smaller desktop | Layout and camera framing are not reconsidered | Create a dedicated portrait composition |
| Relying on hover for essential information | Desktop interaction is copied unchanged | Use tap selection and visible selected states |
| Enabling every shadow and post-processing pass | Effects are tuned on a powerful development machine | Make expensive features part of explicit quality profiles |
| Rendering while off-screen | The animation loop never checks visibility | Combine page visibility and intersection state |
| Assuming device memory APIs always exist | Browser support and privacy behavior vary | Treat hints as optional and provide defaults |
| Setting `touch-action: none` globally | Gesture handling is tested only on the canvas | Apply it narrowly and preserve normal page scrolling |
| Loading desktop-sized textures on phones | Asset pipeline is not screen-aware | Compress and right-size textures; load noncritical assets lazily |
| Using `100vh` without testing mobile browser chrome | Visible viewport changes on scroll | Use appropriate modern viewport units and observe container size |
| Letting quality adaptation oscillate | One slow frame triggers an immediate downgrade | Use sustained thresholds, hysteresis, and quality caps |
| Pausing without resetting time deltas | Animations jump after a long hidden period | Clamp/reset elapsed time on resume |
| Failing silently when WebGL initialization fails | The scene is treated as mandatory | Provide a semantic fallback and development diagnostics |

## Mental Models

1. **Pixels cost time.** Pixel ratio, full-screen effects, and shadows compete for GPU budget.
2. **Mobile needs art direction.** Reframe the subject for portrait screens instead of merely shrinking it.
3. **Touch is not hover.** Essential actions must be visible and tap-accessible.
4. **Quality is a policy.** Central profiles are easier to test than scattered device checks.
5. **Visibility controls power.** Hidden scenes should not keep rendering without a reason.
6. **Fallbacks are part of the design.** A failed WebGL scene should still leave a useful page.
7. **Measure on real devices.** Heuristics guide initial choices; profiling and testing validate them.

## Quick Reference

| Need | Recommended approach |
|---|---|
| Limit pixel cost | `renderer.setPixelRatio(Math.min(devicePixelRatio, cap))` |
| Choose rendering quality | Central low/medium/high profiles |
| Reframe portrait scene | Dedicated camera and model composition |
| Support touch | Pointer Events, tap selection, clear selected state |
| Reduce shadow cost | Disable shadow maps in lower tiers |
| Pause off-screen work | `IntersectionObserver` + Page Visibility API |
| Reduce GPU work | Right-sized/compressed textures and geometry |
| Handle dynamic mobile viewport | `svh`/`dvh` plus `ResizeObserver` |
| Adapt to slow frames | Sustained frame-time thresholds and hysteresis |
| Respect reduced motion | Static or low-motion scene state |
| Handle WebGL failure | DOM fallback with useful content |
| Prevent battery drain | Avoid unnecessary continuous rendering |
| Validate readiness | Test real phones, thermal behavior, touch, resize, and fallback |

## Build Challenge

### Build a Mobile-Ready 3D Portfolio Hero

Create a Three.js hero scene featuring one central 3D object, interactive project hotspots, and a semantic project list.

**Requirements**

1. Establish low and high quality profiles that control pixel ratio, shadows, and particle count.
2. Create separate desktop and portrait camera/model compositions.
3. Support touch selection with Pointer Events and do not rely on hover for important content.
4. Add a keyboard-accessible DOM list that selects the same projects as the 3D scene.
5. Pause continuous rendering when the canvas is off-screen or the browser tab is hidden.
6. Resume rendering without a large time-delta jump.
7. Respect `prefers-reduced-motion` with a useful low-motion state.
8. Use compressed or appropriately sized assets and provide a fallback for renderer or model loading failure.
9. Observe the canvas container for size changes and cap device pixel ratio.
10. Test the experience in portrait and landscape, with touch, keyboard, reduced motion, and WebGL failure simulation.

**Definition of done**

- The scene remains legible and composed on a narrow portrait viewport.
- Touch users can discover and select all key projects without hover.
- Low quality mode removes the most expensive effects while preserving the visual hierarchy.
- The renderer pauses when the scene is not visible and does not create duplicate animation loops.
- The page remains useful if WebGL initialization or asset loading fails.
- A short QA note records tested devices, quality profiles, and known trade-offs.

Build the quality policy and responsive composition before adding more effects. A restrained scene that remains smooth and useful on a phone is stronger work than a desktop-only spectacle.
