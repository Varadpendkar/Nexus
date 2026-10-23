# SKILL: r3f-setup

**Layer:** 06 — Three.js / WebGL

**Goal:** Build a reliable React Three Fiber foundation that connects React's component model to Three.js rendering without leaking resources, breaking responsiveness, or wasting GPU time.

## Why This Matters (Senior Perspective)

React Three Fiber (R3F) is not simply a convenient way to write Three.js JSX. It is a renderer that maps React's declarative component tree into a live Three.js scene graph. That means you gain composition, state-driven updates, and familiar React lifecycle patterns—but you also inherit the need to understand reconciliation, frame-loop behavior, resource ownership, and the difference between React state and rapidly changing 3D values.

A fragile setup often works on the developer's machine and fails in production: the canvas has no useful height, the camera framing is wrong on mobile, a development hot reload leaves confusing state behind, or an animation calls React state on every frame and causes avoidable work. A scene can also appear blank because a mesh has no material, a camera points away from the subject, or a parent container collapses to zero height. These are setup failures, not advanced graphics problems.

Senior creative developers make the rendering boundary explicit. React owns structure and infrequent UI state; Three.js objects own transforms and other frame-rate values; `useFrame` performs small per-frame mutations; and effects clean up external resources when a component truly owns them. The result is a foundation that can grow from a portfolio hero into interactive product storytelling without needing to be rewritten.

## Core Concepts

### 1. The Canvas is the renderer boundary

`Canvas` creates and manages the WebGL renderer, scene, and camera. Components inside it are R3F scene elements; ordinary DOM elements belong outside it. Use a parent with a real height, because the canvas fills its container rather than inventing a layout height.

Mental model: the DOM lays out the rectangle; `Canvas` renders a 3D world inside that rectangle.

```jsx
import { Canvas } from '@react-three/fiber';

export default function ScenePanel() {
  return (
    <section className="scene-panel">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <mesh>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#7c5cff" roughness={0.35} />
        </mesh>
      </Canvas>
    </section>
  );
}
```

```css
.scene-panel {
  width: 100%;
  height: min(72vh, 720px);
  min-height: 320px;
  overflow: hidden;
  border-radius: 1.25rem;
}
```

**Common wrong approach:** rendering `<Canvas />` inside a container whose height is `auto` and expecting the scene to create its own height. The canvas is not a normal content block with intrinsic scene dimensions.

### 2. React structure is not the same as frame-by-frame motion

Use React props and state to describe meaningful changes: selected product, active chapter, loaded status, or quality mode. Use `useFrame` for values that change continuously, such as rotation, spring-like easing, or a cursor-following target. Avoid `setState` on every frame; it makes React reconcile at animation frequency when a direct Three.js mutation is more appropriate.

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function FloatingObject() {
  const meshRef = useRef(null);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Delta-based motion stays approximately consistent across frame rates.
    mesh.rotation.y += delta * 0.35;
    mesh.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.12;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[0.85, 1]} />
      <meshStandardMaterial color="#6ee7d8" metalness={0.35} roughness={0.28} />
    </mesh>
  );
}
```

**Avoid:** `useFrame(() => setRotation(rotation + 0.01))`. React state is not the animation clock.

### 3. The scene graph is still Three.js

R3F JSX maps to Three.js objects: `<mesh>` creates a mesh, `<group>` creates a group, and geometry/material elements become properties of their parent object. Transform inheritance works as it does in Three.js. Place related objects in a group when they should move together.

```jsx
function ProductAssembly() {
  return (
    <group rotation={[0, -0.25, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.12, 64]} />
        <meshStandardMaterial color="#242631" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <torusGeometry args={[0.46, 0.045, 16, 80]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.18} />
      </mesh>
    </group>
  );
}
```

A parent group's rotation affects all children. This is useful for product assemblies, orbital layouts, and hero objects, but can be confusing if child transforms are treated as world-space coordinates.

### 4. Camera and composition are first-class setup decisions

A technically correct scene can still look wrong if the camera is poorly placed. The default perspective camera is not a design decision. Choose a position, field of view, and subject scale that suit the layout. For portfolio heroes, leave intentional negative space for typography and test portrait framing early.

```jsx
<Canvas
  camera={{
    position: [0, 0.15, 5.2],
    fov: 38,
    near: 0.1,
    far: 80
  }}
>
  <SceneContent />
</Canvas>
```

- A smaller perspective `fov` feels more compressed and often gives product imagery a calmer, less wide-angle look.
- The `near` plane should be small enough for close objects but not unnecessarily tiny.
- The `far` plane should cover the scene without being arbitrarily huge.
- If the subject is cropped, adjust camera distance, object scale, or responsive composition rather than blindly increasing every value.

### 5. Lighting and materials need a coherent baseline

`meshStandardMaterial` and `meshPhysicalMaterial` respond to lights. A mesh may render black or flat when the scene has no suitable lighting. Begin with one broad ambient contribution and one or two intentional directional or point lights, then tune material roughness and metalness together.

```jsx
function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 5, 3]} intensity={2.1} />
      <pointLight position={[-3, 1, -2]} intensity={1.2} color="#7c5cff" />
    </>
  );
}
```

Do not use many lights as a substitute for a lighting plan. More lights can increase rendering cost and create muddy highlights. For image-based reflections and polished metal, use an environment map or environment component when appropriate; metalness alone does not create attractive reflections.

### 6. Suspense and loading boundaries keep asset-heavy scenes understandable

Models and textures often load asynchronously. Place a `Suspense` boundary around content that suspends, and provide a fallback that matches the surrounding design. Keep essential page text in the DOM so the page remains useful while the 3D asset loads.

```jsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

function LoadingPlaceholder() {
  return (
    <mesh>
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshStandardMaterial color="#7c5cff" wireframe />
    </mesh>
  );
}

export default function ProductScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 42 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <Suspense fallback={<LoadingPlaceholder />}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
```

The fallback itself must be valid R3F content. Do not place a `<div>` inside `Canvas`; render DOM loading UI as a sibling or overlay outside the canvas.

### 7. Resize, device pixel ratio, and render-loop policy are deliberate choices

R3F handles canvas resizing and can adapt device pixel ratio, but you should still set sensible limits. Rendering at a device pixel ratio of 3 can mean nine times as many pixels as a ratio of 1. A capped DPR often improves mobile performance substantially.

```jsx
<Canvas
  dpr={[1, 1.75]}
  gl={{ antialias: true, alpha: true }}
  camera={{ position: [0, 0, 5], fov: 42 }}
>
  <SceneContent />
</Canvas>
```

For scenes that are mostly static, consider `frameloop="demand"` and invalidate when a meaningful change occurs. Use the default continuous loop for scenes with ongoing animation. Do not enable demand rendering while expecting a `useFrame` animation to run continuously unless something keeps invalidating frames.

### 8. Keep DOM interaction and 3D interaction in their correct layers

Navigation, buttons, headings, and accessible text belong in normal HTML. Mesh pointer events such as `onPointerOver` and `onClick` belong on R3F objects. This separation preserves normal keyboard behavior and makes the site easier to maintain.

```jsx
export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Digital objects, thoughtfully made</p>
        <h1>Make the interface feel tangible.</h1>
        <a href="#work">Explore selected work</a>
      </div>

      <div className="hero-canvas">
        <Canvas camera={{ position: [0, 0, 4.8], fov: 42 }}>
          <ambientLight intensity={0.7} />
          <InteractiveObject />
        </Canvas>
      </div>
    </section>
  );
}

function InteractiveObject() {
  return (
    <mesh
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <torusKnotGeometry args={[0.8, 0.24, 120, 16]} />
      <meshStandardMaterial color="#9b8cff" metalness={0.45} roughness={0.25} />
    </mesh>
  );
}
```

In a production component, reset cursor styles on unmount and coordinate pointer state if several objects can be hovered. Do not rely on a hover effect as the only way to communicate an action.

## Integration Patterns

### Pattern 1: Minimal reusable scene shell

**Use when:** several pages share a consistent canvas configuration.

Centralize camera defaults, DPR limits, renderer options, and suspense behavior. Keep scene-specific content in child components.

```jsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

export function SceneShell({ children, cameraPosition = [0, 0, 5], className = '' }) {
  return (
    <div className={`scene-shell ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov: 42, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#101116']} />
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  );
}
```

```css
.scene-shell {
  position: relative;
  width: 100%;
  height: 60vh;
  min-height: 320px;
  overflow: hidden;
  background: #101116;
}
```

`fallback={null}` is suitable only when a blank canvas during loading is acceptable. For a branded experience, use a real 3D fallback or an HTML overlay.

### Pattern 2: React state for discrete interaction, refs for smooth motion

**Use when:** a user selects an object or toggles a visual state, and the object also has continuous animation.

```jsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

function SelectableOrb() {
  const meshRef = useRef(null);
  const [selected, setSelected] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetScale = selected ? 1.18 : 1;
    const current = meshRef.current.scale.x;
    const next = current + (targetScale - current) * (1 - Math.exp(-8 * delta));
    meshRef.current.scale.setScalar(next);
    meshRef.current.rotation.y += delta * (selected ? 0.65 : 0.25);
  });

  return (
    <mesh
      ref={meshRef}
      onClick={(event) => {
        event.stopPropagation();
        setSelected((value) => !value);
      }}
    >
      <sphereGeometry args={[0.7, 48, 48]} />
      <meshStandardMaterial
        color={selected ? '#ffbd69' : '#7c5cff'}
        roughness={0.28}
        metalness={0.35}
      />
    </mesh>
  );
}
```

React state changes only when selection changes. The per-frame scale interpolation mutates the existing object and uses delta time to remain stable across different frame rates.

### Pattern 3: DOM overlay paired with a 3D scene

**Use when:** a hero needs real typography, navigation, calls to action, and an interactive 3D visual.

```jsx
export function PortfolioHero() {
  return (
    <section className="portfolio-hero">
      <div className="portfolio-hero__copy">
        <p className="portfolio-hero__eyebrow">Creative development / 2026</p>
        <h1>Interfaces with a sense of presence.</h1>
        <p>Design engineering for expressive digital experiences.</p>
        <a className="portfolio-hero__cta" href="#projects">View projects</a>
      </div>

      <div className="portfolio-hero__visual" aria-hidden="true">
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 4, 5]} intensity={2} />
          <FloatingObject />
        </Canvas>
      </div>
    </section>
  );
}
```

```css
.portfolio-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.9fr);
  align-items: center;
  min-height: min(86vh, 900px);
  overflow: hidden;
  background: #0d0e12;
  color: #f5f5f7;
}

.portfolio-hero__copy {
  position: relative;
  z-index: 1;
  padding: clamp(1.5rem, 6vw, 6rem);
  max-width: 48rem;
}

.portfolio-hero__copy h1 {
  max-width: 11ch;
  font-size: clamp(2.8rem, 6vw, 6.5rem);
  line-height: 0.94;
  letter-spacing: -0.065em;
}

.portfolio-hero__visual {
  min-width: 0;
  height: 100%;
  min-height: 420px;
}

@media (max-width: 700px) {
  .portfolio-hero {
    grid-template-columns: 1fr;
    min-height: 760px;
  }

  .portfolio-hero__copy {
    padding-bottom: 0;
  }

  .portfolio-hero__visual {
    min-height: 340px;
    margin-top: -1rem;
  }
}
```

The DOM remains accessible and selectable, while the canvas contributes atmosphere and depth. Mark the visual `aria-hidden` only when it is decorative and carries no unique information or required interaction.

### Pattern 4: Safe pointer interaction and cursor cleanup

**Use when:** a mesh behaves like an interactive affordance.

Avoid leaving the browser cursor in a stale state if the component unmounts while hovered.

```jsx
import { useEffect } from 'react';

function HoverableMesh() {
  useEffect(() => {
    return () => {
      // Clean up global UI state if this mesh disappears while hovered.
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <mesh
      onPointerEnter={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <sphereGeometry args={[0.7, 32, 32]} />
      <meshStandardMaterial color="#70e1d1" />
    </mesh>
  );
}
```

If multiple meshes can overlap, a shared cursor manager is more robust than letting each object independently reset the global cursor.

### Pattern 5: Render-on-demand for a mostly static scene

**Use when:** the scene changes only after user input or asset loading.

```jsx
import { Canvas, useThree } from '@react-three/fiber';

function InvalidateOnClick() {
  const invalidate = useThree((state) => state.invalidate);

  return (
    <mesh
      onClick={() => {
        invalidate();
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#7c5cff" />
    </mesh>
  );
}

export function StaticScene() {
  return (
    <Canvas frameloop="demand" camera={{ position: [0, 0, 4], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <InvalidateOnClick />
    </Canvas>
  );
}
```

This example illustrates the invalidation API, but a click that does not change anything does not need invalidation in a real app. When state changes, R3F often schedules the necessary render itself. For animations under demand mode, explicitly invalidate when animation begins and arrange for subsequent frames.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Canvas is invisible or tiny | Parent has no explicit height | Give the canvas container a responsive height and `min-height` |
| Mesh is not visible | Camera points away, object is out of frame, or material is missing | Start with a centered box, known camera position, and a basic material |
| Calling `setState` every frame | React state is mistaken for an animation loop | Mutate refs in `useFrame`; reserve state for discrete changes |
| Putting a `<div>` inside `Canvas` | DOM and R3F scene trees are mixed | Put HTML outside the canvas or use an intentional HTML integration component |
| Scene is unexpectedly dark | Physically based materials lack suitable illumination | Add intentional lighting and inspect material roughness/metalness |
| Canvas is too expensive on phones | DPR and shader effects are unrestricted | Cap DPR, simplify materials, and profile on a real device |
| Loading produces an empty experience | Async assets have no loading design | Add a `Suspense` fallback or HTML loading overlay |
| Animation stops with `frameloop="demand"` | No frames are requested after the initial render | Use continuous rendering or invalidate during the animation |
| Cursor remains stuck on pointer | Global cursor state is not cleaned up | Reset on pointer leave and component cleanup |
| Recreating geometries or materials every frame | Per-frame code allocates instead of mutating | Create scene objects declaratively and update their properties through refs |
| All text is rendered in WebGL | 3D text seems visually consistent | Keep primary headings and actions in semantic HTML unless 3D text is essential |
| Camera settings are identical at every breakpoint | Desktop composition was treated as universal | Test portrait layouts and adjust camera or object composition responsively |

## Mental Models

1. **Canvas is a viewport:** the DOM owns its size; the renderer paints inside it.
2. **React describes structure:** use component composition for scene organization and discrete state changes.
3. **Refs carry motion:** continuously changing transforms belong on existing Three.js objects, not in React state.
4. **The scene graph is hierarchical:** parent transforms affect every child beneath them.
5. **The camera is composition:** camera distance and field of view are part of visual design, not just technical settings.
6. **Every pixel costs work:** device pixel ratio, shadows, transparency, and post-processing all affect GPU time.
7. **Loading is part of UX:** a scene should remain understandable while 3D assets are unavailable.

## Quick Reference

| Need | R3F approach |
|---|---|
| Create a WebGL scene | `<Canvas>` |
| Add a mesh | `<mesh>` |
| Group related objects | `<group>` |
| Add geometry | `<boxGeometry args={[w, h, d]} />` |
| Add a PBR material | `<meshStandardMaterial />` |
| Animate continuously | `useFrame((state, delta) => {})` |
| Access a Three.js object | `useRef()` attached to an R3F element |
| Read renderer/camera state | `useThree((state) => state.camera)` |
| Handle mesh click | `onClick` on the mesh |
| Load async assets | `Suspense` boundary |
| Limit pixel density | `dpr={[1, 1.75]}` |
| Render only on changes | `frameloop="demand"` |
| Keep semantic content accessible | DOM overlay outside `Canvas` |
| Prevent layout collapse | Set explicit container height |
| Smooth a value over time | Delta-aware interpolation in `useFrame` |

## Build Challenge

### Project: Reusable 3D Portfolio Hero Foundation

Build a responsive portfolio hero with one animated 3D object, accessible DOM content, and a reusable canvas shell.

**Requirements**

1. Create a reusable `SceneShell` component with camera defaults, a capped DPR, and a loading boundary.
2. Build a `FloatingObject` that rotates slowly and moves vertically using `useFrame` and a ref.
3. Add a coherent studio lighting setup and a material with deliberate roughness and metalness.
4. Place the canvas beside a semantic HTML heading, paragraph, and CTA link.
5. Make the layout adapt from two columns on desktop to a stacked composition on mobile.
6. Add one discrete interaction, such as selecting the object to change its color or scale; do not call React state on every frame.
7. Confirm that the scene remains visible at narrow widths and that the canvas parent has a real height.
8. Check keyboard access to the CTA and ensure no essential information exists only inside the canvas.
9. Test on a mobile device or device emulator and lower DPR if frame rate is poor.
10. Remove console warnings and verify the scene after a hot reload and a full page reload.

**Definition of done**

- The hero renders consistently on desktop and mobile.
- The object animation is smooth and delta-based.
- Discrete interactions update without React state being set on every frame.
- DOM text remains readable and accessible independently of WebGL.
- Loading, resize, and cleanup behavior are intentional.
- The canvas is visually supportive rather than competing with the primary message.

## Advanced Setup Concepts

### 9. Choose the render loop from the experience, not habit

The default continuous loop is appropriate when something changes every frame: a rotating hero object, a shader with a time uniform, a physics simulation, or a camera that follows a pointer. It is wasteful for a mostly static product preview. In a static scene, `frameloop="demand"` lets R3F render when React state or a scene invalidation indicates that a new image is needed. The decision is an energy and battery decision as much as a frame-rate decision.

```jsx
import { Canvas } from '@react-three/fiber';

export function StaticProductPreview() {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 4], fov: 38 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <mesh rotation={[0.15, 0.4, 0]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#7c5cff" roughness={0.28} />
      </mesh>
    </Canvas>
  );
}
```

With demand rendering, imperative changes do not necessarily cause another frame. If a control starts an imperative animation, call the `invalidate` function from `useThree` and keep requesting frames while the animation is active. Stop invalidating when the animation ends. Do not blindly invalidate on every browser event; coalesce requests and avoid creating an accidental permanent loop.

**Gotcha:** `frameloop="demand"` does not mean “render only once forever.” R3F can schedule frames for React-driven updates, but a manually mutated Three.js object must be paired with an invalidation strategy.

### 10. Treat the camera as a responsive composition system

A perspective camera does not preserve the same visible framing when the canvas aspect ratio changes. A wide desktop viewport can show a generous gap around an object; a tall mobile viewport can crop it or leave it visually small. There is no universal camera position that produces the same composition for every aspect ratio. Choose whether the mobile experience should move the camera, scale the object, change the field of view, or simplify the composition.

```jsx
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    // A portrait composition needs a slightly wider view and a higher camera position.
    const isPortrait = size.width < size.height;
    camera.position.set(0, isPortrait ? 0.2 : 0, isPortrait ? 5.4 : 4.2);
    camera.fov = isPortrait ? 48 : 40;
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}
```

Use this inside `<Canvas>`. R3F tracks the canvas dimensions and reruns the effect when the measured size changes. For more involved art direction, keep desktop and mobile camera presets in a configuration object and tune them against real screenshots rather than adding arbitrary breakpoint values until the object happens to fit.

**Gotcha:** when changing a perspective camera's `fov`, call `updateProjectionMatrix()`. The camera's projection matrix is derived data; changing a property alone does not guarantee that the projection is recalculated.

### 11. Understand the difference between React state, refs, and Three.js state

Use React state for discrete UI decisions such as selected variant, open information panel, or whether the user has activated a mode. Use a ref for a value that changes continuously without needing React to re-render the component. The live mesh, camera, and material are Three.js objects managed by R3F. This separation avoids a React reconciliation cycle on every frame and keeps the rendering loop predictable.

```jsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

function InteractiveOrb() {
  const meshRef = useRef(null);
  const [selected, setSelected] = useState(false);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Delta-based rotation remains close to the same speed at different frame rates.
    meshRef.current.rotation.y += delta * 0.35;
  });

  return (
    <mesh
      ref={meshRef}
      scale={selected ? 1.12 : 1}
      onClick={(event) => {
        event.stopPropagation();
        setSelected((current) => !current);
      }}
    >
      <sphereGeometry args={[0.8, 48, 32]} />
      <meshStandardMaterial color={selected ? '#ffb454' : '#6f79ff'} roughness={0.25} />
    </mesh>
  );
}
```

The rotation does not need React to know every intermediate angle. Selection does need React because it changes the declarative visual state. This is the practical boundary between high-frequency motion and low-frequency application state.

**Gotcha:** a ref can be `null` before the first commit and after unmount. Guard access inside frame callbacks. Do not store a Three.js object in state merely to animate it; use a ref for the object and state for the user-facing decision.

### 12. Keep asset loading, errors, and fallbacks intentional

A model, texture, or environment map can take long enough to load that the canvas appears broken. A `Suspense` boundary lets the application display a predictable fallback while an asset is pending. It does not automatically provide a polished loading design, and it is not a substitute for handling a failed network request. Make loading, failure, and ready states visually distinct when the asset is important to the page.

```jsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useGLTF } from '@react-three/drei';

function ProductModel() {
  const { scene } = useGLTF('/models/product-shell.glb');
  return <primitive object={scene} scale={1.2} />;
}

function SceneLoadingLabel() {
  return (
    <Html center role="status" aria-live="polite">
      <span className="scene-loading-label">Loading 3D preview…</span>
    </Html>
  );
}

export function ProductCanvas() {
  return (
    <Canvas camera={{ position: [0, 0.4, 4.5], fov: 42 }}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 5, 4]} intensity={2} />
      <Suspense fallback={<SceneLoadingLabel />}>
        <ProductModel />
      </Suspense>
    </Canvas>
  );
}
```

The fallback is inside the R3F tree because Drei's `<Html>` bridges content into the DOM while positioning it relative to the 3D scene. A full-page skeleton or retry message is usually better placed outside the canvas when it needs to survive a renderer failure. For production, add an error boundary around the scene and provide a static image or product photograph as a meaningful fallback.

**Gotcha:** `Suspense` handles pending promises, not every runtime error. A malformed model, WebGL context loss, or unsupported shader can still fail after loading; use error handling at the application boundary too.

### 13. Set renderer quality budgets deliberately

A high device pixel ratio can multiply the number of pixels the GPU must shade. A device reporting DPR 3 can require roughly nine times the pixel work of DPR 1 for the same CSS-sized canvas, before accounting for shadows, overdraw, and post-processing. A beautiful hero is not successful if it makes the rest of the page stutter. Cap DPR, limit shadow map size, avoid unnecessary transparent layers, and test on the weakest realistic target device.

```jsx
<Canvas
  dpr={[1, 1.75]}
  gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
  camera={{ position: [0, 0, 4.5], fov: 42 }}
>
  {/* Keep the scene visually strong without assuming a desktop-class GPU. */}
</Canvas>
```

The DPR range allows R3F to adapt within the supplied limits. `powerPreference` is a hint, not a guarantee that the browser will choose a specific GPU. Antialiasing, alpha compositing, shadow maps, environment reflections, and post-processing should be justified by visible value. Use browser performance tooling and a real mobile device to compare frame time before and after each quality change.

**Gotcha:** lowering the canvas DPR will not fix every bottleneck. Excessive draw calls, expensive fragment shaders, large shadow maps, and CPU-heavy per-frame work can remain the limiting factor.

### 14. Use event propagation intentionally

R3F pointer events follow the scene graph and raycasting model, not ordinary DOM hit-testing alone. A click on a front mesh can also reach objects behind it unless propagation is stopped. This is useful for layered interactions but surprising when a background click closes a panel while a foreground object opens it. Design the event path explicitly, especially for draggable objects, selection states, and invisible interaction surfaces.

```jsx
function SelectableCard({ onSelect }) {
  return (
    <group onClick={() => onSelect('background-card')}>
      <mesh
        onClick={(event) => {
          // Keep this interaction from also triggering the group's selection action.
          event.stopPropagation();
          onSelect('featured-object');
        }}
      >
        <roundedBoxGeometry args={[1.2, 1.5, 0.2, 4, 0.08]} />
        <meshStandardMaterial color="#28283b" roughness={0.45} />
      </mesh>
    </group>
  );
}
```

If the example geometry is not available in your installed geometry package, replace it with `boxGeometry`; the event principle is independent of geometry. Always make essential actions reachable through ordinary DOM controls too. A 3D mesh is not automatically keyboard accessible, and relying on pointer-only selection excludes keyboard users and some touch workflows.

**Gotcha:** stopping propagation can also prevent intentional parent-level behaviors. Add a deliberate background target or explicit close control instead of relying on every click to bubble to the canvas root.

### 15. Separate DOM accessibility from 3D interaction

WebGL pixels are not a semantic document. Screen readers do not automatically discover the text painted into a canvas, and keyboard users cannot infer which mesh is clickable. Keep headings, descriptions, links, and primary actions in semantic HTML. If a 3D object represents a selectable product, mirror that choice in a button or radio group and synchronize the selected state with the scene. Use ARIA only to describe actual interaction state, not to pretend the canvas is a complete accessible interface.

```jsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';

export function AccessibleVariantPreview() {
  const [finish, setFinish] = useState('violet');

  return (
    <section aria-labelledby="finish-heading" className="variant-preview">
      <div className="variant-preview__controls">
        <h2 id="finish-heading">Choose a finish</h2>
        <p>The preview updates when you choose a finish.</p>
        <div role="group" aria-label="Available finishes">
          <button type="button" aria-pressed={finish === 'violet'} onClick={() => setFinish('violet')}>
            Violet
          </button>
          <button type="button" aria-pressed={finish === 'amber'} onClick={() => setFinish('amber')}>
            Amber
          </button>
        </div>
      </div>
      <div className="variant-preview__canvas" aria-label="Interactive 3D product preview">
        <Canvas dpr={[1, 1.5]}>
          <ambientLight intensity={0.7} />
          <mesh>
            <sphereGeometry args={[0.9, 48, 32]} />
            <meshStandardMaterial color={finish === 'violet' ? '#766bff' : '#ffb24a'} />
          </mesh>
        </Canvas>
      </div>
    </section>
  );
}
```

The controls work without needing to click the 3D object. For a production page, ensure the canvas has an accessible label where appropriate, the buttons have visible focus styles, color is not the only indicator of selection, and the page remains usable when WebGL is unavailable. Do not add `role="application"` to a canvas as a shortcut; it changes assistive-technology interaction expectations and is rarely justified for a decorative product preview.

**Gotcha:** `aria-label` on a wrapper does not expose every mesh or explain its state. Use semantic controls to expose the actual available actions.

### 16. Plan for context loss and reduced capability

Browsers can lose a WebGL context because of GPU resets, driver pressure, tab suspension, or memory limits. A robust site treats the canvas as an enhancement rather than the only place where the product story exists. Keep critical copy and navigation outside the canvas, provide a poster image or CSS fallback, and avoid creating several heavyweight WebGL contexts on one page when one shared experience will do.

```jsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';

export function ResilientScene() {
  const [sceneFailed, setSceneFailed] = useState(false);

  if (sceneFailed) {
    return (
      <figure className="scene-fallback">
        <img src="/images/product-preview.webp" alt="Product shown in violet finish" />
        <figcaption>Static preview shown because the 3D experience is unavailable.</figcaption>
      </figure>
    );
  }

  return (
    <Canvas
      fallback={<p>3D preview is not supported in this browser.</p>}
      onCreated={({ gl }) => {
        // The application can observe context loss for diagnostics and graceful degradation.
        const canvasElement = gl.domElement;
        canvasElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          setSceneFailed(true);
        }, { once: true });
      }}
    >
      <ambientLight intensity={0.7} />
      <mesh>
        <torusKnotGeometry args={[0.7, 0.22, 96, 12]} />
        <meshStandardMaterial color="#806bff" metalness={0.25} roughness={0.3} />
      </mesh>
    </Canvas>
  );
}
```

For a long-lived application, the listener above should be removed during teardown and the context-restored path should be designed explicitly; a production implementation should use an effect with a cleanup function or a dedicated error-boundary component. Do not repeatedly create replacement canvases in a tight loop after a context loss. Record the failure, show a useful fallback, and allow a deliberate retry if the product needs it.

**Gotcha:** `preventDefault()` on `webglcontextlost` is needed when you intend to allow the browser to attempt context restoration, but it does not guarantee restoration. Always preserve a non-WebGL path for essential information.

## Integration Patterns

### Pattern 1 — The semantic shell and isolated canvas

**What it does:** keeps document content, navigation, and conversion actions in HTML while the canvas owns only the 3D illustration. **When to use it:** portfolio heroes, campaign pages, and client landing pages where the visual is important but not the only communication channel.

```jsx
import { Canvas } from '@react-three/fiber';

function HeroObject() {
  return (
    <mesh rotation={[0.25, 0.4, 0]}>
      <torusKnotGeometry args={[0.8, 0.22, 128, 16]} />
      <meshStandardMaterial color="#8c7bff" metalness={0.3} roughness={0.24} />
    </mesh>
  );
}

export function CreativeHero() {
  return (
    <main className="creative-hero">
      <section className="creative-hero__copy" aria-labelledby="hero-title">
        <p className="eyebrow">Independent digital studio</p>
        <h1 id="hero-title">Digital experiences with dimension.</h1>
        <p>Brand systems, motion, and interactive product storytelling.</p>
        <a className="primary-link" href="/work">Explore selected work</a>
      </section>
      <div className="creative-hero__visual" aria-label="Abstract animated 3D sculpture">
        <Canvas dpr={[1, 1.6]} camera={{ position: [0, 0, 4], fov: 42 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={2} />
          <HeroObject />
        </Canvas>
      </div>
    </main>
  );
}
```

The content remains available if the visual is blocked, slow, or unavailable. Style the layout with CSS grid and a real canvas height; do not place the entire hero inside WebGL just to make the design feel cohesive.

### Pattern 2 — A shared quality profile

**What it does:** centralizes rendering choices so every route does not invent its own DPR, camera, and antialiasing policy. **When to use it:** multi-page portfolios, product configurators, and sites with several 3D modules.

```jsx
export const sceneQuality = {
  dpr: [1, 1.65],
  gl: { antialias: true, alpha: true, powerPreference: 'high-performance' },
  camera: { position: [0, 0.15, 4.4], fov: 42 },
};

export function SharedCanvas({ children, className = '' }) {
  return (
    <div className={`shared-canvas ${className}`}>
      <Canvas dpr={sceneQuality.dpr} gl={sceneQuality.gl} camera={sceneQuality.camera}>
        {children}
      </Canvas>
    </div>
  );
}
```

A shared profile prevents accidental quality drift. Keep exceptions explicit: a close-up configurator may need a different camera, while a tiny decorative background may need lower DPR and no shadows. A central profile is a baseline, not a reason to force every scene to look or perform identically.

### Pattern 3 — One owner for imperative resources

**What it does:** creates external Three.js resources in an effect only when needed and disposes them when the owning component unmounts. **When to use it:** custom render targets, controls, helper objects, or third-party objects not managed declaratively by R3F.

```jsx
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function CustomRing() {
  const groupRef = useRef(null);

  useEffect(() => {
    const geometry = new THREE.TorusGeometry(0.75, 0.08, 16, 96);
    const material = new THREE.MeshStandardMaterial({ color: '#7f72ff', roughness: 0.3 });
    const ring = new THREE.Mesh(geometry, material);
    groupRef.current?.add(ring);

    return () => {
      // Explicitly release GPU-backed resources created outside the declarative tree.
      groupRef.current?.remove(ring);
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return <group ref={groupRef} />;
}
```

Do not manually dispose resources that are shared with another mounted scene unless ownership is explicit. R3F owns objects it creates declaratively; manually-created resources need a clear owner and cleanup contract.

### Pattern 4 — Demand rendering for static scenes with explicit invalidation

**What it does:** allows a mostly static scene to sleep between changes, then requests frames when an interaction begins. **When to use it:** product previews, configurators with discrete controls, and decorative objects that only animate on hover.

```jsx
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

function HoverSpin() {
  const meshRef = useRef(null);
  const { invalidate } = useThree();
  const spinTarget = useRef(0);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const difference = spinTarget.current - mesh.rotation.y;
    if (Math.abs(difference) > 0.002) {
      mesh.rotation.y += difference * Math.min(1, delta * 7);
      invalidate();
    }
  });

  return (
    <mesh
      ref={meshRef}
      onPointerEnter={() => { spinTarget.current += Math.PI * 0.5; invalidate(); }}
    >
      <dodecahedronGeometry args={[0.85, 0]} />
      <meshStandardMaterial color="#927cff" roughness={0.32} />
    </mesh>
  );
}
```

This pattern is intentionally small; if the animation must continue while the pointer is stationary, confirm that invalidation schedules the next frame until the target is reached. For complex sequences, a continuous loop may be simpler and more reliable than trying to make every animation demand-driven.

### Pattern 5 — Asset boundary with a meaningful fallback

**What it does:** isolates asynchronous 3D loading and gives users a clear status while an asset is pending. **When to use it:** GLB models, remote textures, environment maps, or scenes with several independently loaded assets.

```jsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, useProgress } from '@react-three/drei';

function LoadingStatus() {
  const { progress, active } = useProgress();
  if (!active) return null;
  return <Html center role="status" aria-live="polite">Loading preview {Math.round(progress)}%</Html>;
}

export function LoadedScene({ children }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 4], fov: 42 }}>
      <ambientLight intensity={0.7} />
      <Suspense fallback={<LoadingStatus />}>{children}</Suspense>
    </Canvas>
  );
}
```

If a progress percentage is unavailable or inaccurate for a cached asset, keep the message honest: “Loading preview” is better than a false promise of exact progress. Place a static image beneath or beside the canvas so the page still communicates while loading.

### Pattern 6 — DOM-to-scene state bridge

**What it does:** makes a regular button or form control the source of truth for a 3D variant. **When to use it:** finish selectors, product configurators, and portfolio demos that must work with keyboard and touch input.

```jsx
import { useState } from 'react';
import { Canvas } from '@react-three/fiber';

export function MaterialChooser() {
  const [finish, setFinish] = useState('graphite');
  const colors = { graphite: '#454552', coral: '#ff6b62', ice: '#b9e7ff' };

  return (
    <section aria-labelledby="material-title">
      <h2 id="material-title">Material finish</h2>
      <div role="group" aria-label="Choose material finish">
        {Object.keys(colors).map((name) => (
          <button key={name} type="button" aria-pressed={finish === name} onClick={() => setFinish(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="material-chooser__scene">
        <Canvas dpr={[1, 1.5]}>
          <ambientLight intensity={0.65} />
          <directionalLight position={[3, 4, 5]} intensity={2} />
          <mesh>
            <sphereGeometry args={[0.9, 48, 32]} />
            <meshStandardMaterial color={colors[finish]} roughness={0.28} metalness={0.18} />
          </mesh>
        </Canvas>
      </div>
    </section>
  );
}
```

The button group is the accessible interaction surface. The scene is a visual response to state, not the only route to changing it. For many variants, expose a labelled select or radio group instead of rendering a large grid of buttons.

## Common Mistakes: Additional Failure Modes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Rendering the whole interface in the canvas | The visual concept is mistaken for the document structure | Keep headings, links, forms, and status messages in semantic DOM elements |
| Using an uncapped DPR | Desktop retina output is copied to phones without a budget | Start with `dpr={[1, 1.5]}` and increase only after profiling |
| Recreating a material inside every frame | Animation code mixes allocation with mutation | Create the material once and mutate a property through a ref when necessary |
| Forgetting camera projection updates | Camera properties are changed without rebuilding the projection matrix | Call `camera.updateProjectionMatrix()` after FOV or clipping-plane changes |
| Depending on pointer-only controls | The mesh is treated as if it were a native button | Provide keyboard-accessible DOM controls with visible focus states |
| Treating Suspense as error handling | Pending and failed states are conflated | Add an error boundary and a static fallback for runtime failures |
| Using demand mode with a perpetual animation | No one owns the frame scheduling contract | Use continuous mode or invalidate until the animation reaches its target |
| Manually disposing shared geometry | Resource ownership is unclear | Document whether the component owns the resource or borrows a shared cache entry |
| Adding too many canvases to one route | Each canvas is treated as a cheap image | Consolidate visuals where practical and measure GPU/context pressure |
| Trusting desktop-only testing | Desktop GPUs hide overdraw and pixel cost | Test a real mobile device and a throttled profile before release |
| Leaving loading status invisible to assistive tech | A visual spinner communicates only by pixels | Use an HTML status region with `role="status"` and concise text |
| Using color as the only selected indicator | The scene communicates selection through hue alone | Pair color with `aria-pressed`, labels, shape, or text feedback |
| Mutating objects before refs exist | Frame callbacks assume the first render has committed | Null-check refs and make setup safe during mount and unmount |
| Registering listeners without cleanup | Imperative integration bypasses React ownership | Remove event listeners in the effect cleanup using the same callback reference |
| Treating `powerPreference` as a guarantee | A renderer hint is assumed to force GPU selection | Measure actual behavior and maintain a lower-cost fallback |
| Letting a canvas collapse in CSS | Canvas is expected to establish its own layout height | Give its parent an explicit responsive height or aspect ratio |

## Quick Reference: Additional Decisions

| Situation | Recommended decision | Why |
|---|---|---|
| Static product object | Consider `frameloop="demand"` | Avoids continuous rendering when no pixels change |
| Constant rotation or shader time | Use the continuous loop | Every frame changes the output |
| Per-frame transform | Mutate a ref in `useFrame` | Avoids React re-render churn |
| User chooses a variant | React state drives material props | This is a discrete application state change |
| Portrait mobile framing | Adjust camera or composition | Aspect ratio changes the visible world |
| Expensive device pixel ratio | Cap with a DPR range | Pixel work rises approximately with DPR squared |
| Model still loading | Add a `Suspense` fallback | Prevents an unexplained blank scene |
| Model throws at runtime | Use an error boundary and fallback | Suspense is not a general error boundary |
| Custom Three.js resource | Define one owner and dispose on teardown | Prevents GPU memory leaks without destroying shared assets |
| Pointer event reaches parent | Stop propagation only when needed | Keeps layered interaction behavior explicit |
| Main CTA in a 3D scene | Move the CTA into semantic HTML | Preserves keyboard and screen-reader access |
| WebGL unavailable | Show a static image and useful copy | The page should still communicate its purpose |
| Camera FOV changes | Update projection matrix | Derived camera projection must be recalculated |
| Scene is slow on mobile | Profile draw calls, DPR, shadows, and shaders | A single quality setting rarely explains the whole bottleneck |
| Multiple scene modules | Share quality defaults, allow documented exceptions | Makes quality decisions consistent and reviewable |
| Context loss | Preserve a fallback and avoid retry loops | GPU restoration is not guaranteed |

## Browser, Device, and Debugging Checklist

- Verify the installed versions of `three`, `@react-three/fiber`, and `@react-three/drei` are compatible; R3F major versions track the React and Three.js ecosystem, so do not copy setup commands from an unrelated major version without checking package compatibility.
- Test Chrome/Chromium, Firefox, and Safari where they are in the supported browser matrix. WebGL support, shader compilation, color handling, and memory behavior can differ by GPU and browser version.
- Use React DevTools to check for repeated component renders and browser DevTools Performance to identify main-thread work, long tasks, and dropped frames.
- Use the browser's WebGL diagnostics and console messages to identify shader compilation failures, context loss, and unsupported capabilities.
- Inspect the canvas bounding box and parent layout when the scene appears blank. A zero-height canvas is a CSS problem, not a shader problem.
- Reduce DPR temporarily to determine whether the workload is pixel-bound. If the scene remains slow at DPR 1, investigate CPU work, draw calls, shadows, and shader complexity.
- Temporarily replace complex models and materials with a box and `meshStandardMaterial`. If the minimal scene renders, restore features one at a time to isolate the failure.
- Test keyboard navigation with the canvas present and with WebGL unavailable. Primary copy and actions must remain usable in both conditions.
- Confirm all imperative listeners and custom resources are released on unmount, route changes, and hot reload.
- Keep a screenshot or short recording of the intended desktop and mobile framing so visual regression is detectable after camera or asset changes.

## Build Challenge Extension: Failure Injection

After completing the main portfolio hero challenge, intentionally introduce and diagnose these failures rather than simply confirming the happy path:

1. Remove the height from the canvas parent and identify why the scene disappears.
2. Set an extreme DPR and record how frame time changes on a mobile profile.
3. Change the camera FOV without updating the projection matrix, then correct it and explain the difference.
4. Replace a loaded model path with a missing file and confirm that the user receives a useful fallback rather than a silent blank panel.
5. Trigger a nested mesh click and observe whether the parent interaction also fires; add propagation control only where required.
6. Switch to demand rendering while leaving a continuous animation active; make a deliberate choice between invalidation and continuous mode.
7. Remove the keyboard-accessible variant controls and verify which users can no longer change the preview; restore the DOM controls.
8. Simulate WebGL unavailability or context loss and confirm that the page still presents its key message and CTA.
9. Navigate away from the scene and confirm event listeners and custom GPU resources are cleaned up.
10. Test the same scene in a portrait viewport and adjust camera composition without hiding important content.

The exercise is complete when you can explain each failure from the ownership model—DOM layout, React state, scene graph, camera projection, renderer scheduling, or GPU resources—rather than randomly changing settings until the scene appears to work.
