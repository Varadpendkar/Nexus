# SKILL: r3f-patterns

**Layer:** 06 — Three.js / WebGL

**Goal:** Compose maintainable React Three Fiber scenes using reusable scene components, state-driven interactions, controlled animation, and deliberate performance boundaries.

## Why This Matters (Senior Perspective)

React Three Fiber becomes powerful when the scene is treated as a system of cooperating components rather than one large JSX block. A portfolio hero may begin with a single mesh, but soon needs lighting rigs, reusable materials, selectable objects, camera behavior, loading states, responsive composition, and motion that responds to pointer or scroll input. If all of those concerns are mixed together, even small visual changes can cause regressions elsewhere.

The most common failure is confusing declarative composition with permission to create arbitrary work on every render. React components should describe the scene and respond to meaningful changes. High-frequency values such as rotation, position, spring interpolation, and pointer targets should usually live in refs or a dedicated animation system. Stable geometries and materials should not be repeatedly reconstructed without reason, and shared resources need a clear ownership strategy.

Senior creative developers establish patterns early: separate scene content from lighting, isolate interactive objects, use groups for coordinated transforms, keep DOM content semantic, and expose a small number of intentional props instead of passing every internal detail everywhere. Good patterns do not make the scene abstract for abstraction's sake; they make visual iteration faster, performance easier to reason about, and future additions safer.

## Core Concepts

### 1. Compose scenes from visual responsibilities

A scene component should have one recognizable responsibility: lighting, a product assembly, a background field, an interactive object, or a camera rig. This keeps the top-level composition readable.

```jsx
function StudioScene() {
  return (
    <>
      <StudioLighting />
      <Backdrop />
      <HeroObject />
      <AccentObjects />
    </>
  );
}

function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      <pointLight position={[-3, 1, -2]} intensity={0.9} color="#7c5cff" />
    </>
  );
}

function HeroObject() {
  return (
    <mesh>
      <torusKnotGeometry args={[0.8, 0.22, 120, 16]} />
      <meshStandardMaterial color="#9b8cff" metalness={0.45} roughness={0.24} />
    </mesh>
  );
}

function Backdrop() {
  return (
    <mesh position={[0, 0, -2.5]} scale={[8, 5, 1]}>
      <planeGeometry />
      <meshBasicMaterial color="#11131b" />
    </mesh>
  );
}

function AccentObjects() {
  return (
    <>
      <mesh position={[-1.5, 0.7, -0.7]} scale={0.16}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#70e1d1" />
      </mesh>
      <mesh position={[1.6, -0.8, -0.5]} scale={0.12}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffbd69" />
      </mesh>
    </>
  );
}
```

Keep component boundaries aligned with things a designer might ask to change independently. Avoid creating a component for every JSX line when the separation provides no meaningful reuse or clarity.

### 2. Use groups to define transform spaces

A `group` creates a local coordinate space. Use it when several objects should move together, when a product contains multiple parts, or when a scene element needs a single parent transform.

```jsx
function ProductModel() {
  return (
    <group rotation={[0, -0.25, 0]} position={[0, -0.1, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.12, 64]} />
        <meshStandardMaterial color="#242631" metalness={0.8} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[0.45, 0.04, 16, 80]} />
        <meshStandardMaterial color="#b7bac5" metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <sphereGeometry args={[0.08, 24, 24]} />
        <meshStandardMaterial emissive="#70e1d1" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}
```

The children retain local positions while the parent handles the shared orientation. This is more predictable than manually updating every child transform whenever the assembly rotates.

### 3. Share configuration, but do not accidentally share mutable state

A small configuration object can make color and motion tuning consistent across a scene. Keep configuration immutable and pass only the values each component needs.

```jsx
const visualTheme = {
  violet: '#7c5cff',
  mint: '#70e1d1',
  ink: '#11131b',
  metalness: 0.42,
  roughness: 0.28
};

function ThemeOrb({ color = visualTheme.violet, speed = 0.35 }) {
  const ref = useRef(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * speed;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.7, 40, 40]} />
      <meshStandardMaterial
        color={color}
        metalness={visualTheme.metalness}
        roughness={visualTheme.roughness}
      />
    </mesh>
  );
}
```

Do not mutate a global theme object during interactions. A shared configuration is a source of defaults, not a hidden global state store.

### 4. Distinguish React state from transient interaction state

Use React state for a discrete selection, active mode, or UI label. Use refs for pointer coordinates, animation targets, and other values that change many times per second. This prevents high-frequency events from forcing unnecessary React renders.

```jsx
import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';

function InteractiveOrb() {
  const meshRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const [selected, setSelected] = useState(false);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target = targetRef.current;
    const blend = 1 - Math.exp(-7 * delta);

    mesh.rotation.x += (target.y * 0.25 - mesh.rotation.x) * blend;
    mesh.rotation.y += (target.x * 0.35 - mesh.rotation.y) * blend;
    mesh.scale.setScalar(
      mesh.scale.x + ((selected ? 1.15 : 1) - mesh.scale.x) * blend
    );
  });

  return (
    <mesh
      ref={meshRef}
      onPointerMove={(event) => {
        // Pointer values become targets; the frame loop smooths the actual transform.
        targetRef.current.x = event.pointer.x;
        targetRef.current.y = event.pointer.y;
      }}
      onClick={(event) => {
        event.stopPropagation();
        setSelected((value) => !value);
      }}
    >
      <icosahedronGeometry args={[0.75, 2]} />
      <meshStandardMaterial
        color={selected ? visualTheme.mint : visualTheme.violet}
        metalness={0.4}
        roughness={0.25}
      />
    </mesh>
  );
}
```

Pointer events can arrive irregularly; easing in `useFrame` avoids a hard, jittery snap. If you only need a one-time color change, state alone is enough—do not introduce refs without a reason.

### 5. Treat shared geometry and material as resources with ownership

R3F can manage many declarative objects, but sharing resources across objects requires understanding who owns them. A single geometry or material can be reused for many meshes when created and managed intentionally. Avoid disposing a shared resource while another mesh still uses it.

For simple repeated primitives, declarative geometry is clear and often adequate. For large repeated sets, consider shared resources, instancing, or an asset loader's cache. Resource sharing should be explicit and documented.

```jsx
import { useMemo } from 'react';
import * as THREE from 'three';

function SharedShape({ positions }) {
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(0.25, 1), []);

  return (
    <>
      {positions.map(([x, y, z], index) => (
        <mesh key={index} geometry={geometry} position={[x, y, z]}>
          <meshStandardMaterial color={index % 2 ? '#70e1d1' : '#7c5cff'} />
        </mesh>
      ))}
    </>
  );
}
```

This demonstrates geometry reuse. In a larger component, define clearly whether the component owns the geometry and disposes it, or whether a parent/application-level cache owns it. Do not attach the same disposable resource to multiple owners with conflicting cleanup assumptions.

### 6. Build reusable objects with small, meaningful APIs

A reusable visual component should expose the controls that are genuinely useful to its consumers: color, scale, speed, position, and perhaps an interaction callback. Keep internal animation and material details private unless a use case needs them.

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

export function FloatingOrb({
  color = '#7c5cff',
  scale = 1,
  speed = 0.3,
  position = [0, 0, 0],
  onSelect
}) {
  const ref = useRef(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * speed;
    ref.current.position.y = position[1] +
      Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.08;
  });

  return (
    <mesh
      ref={ref}
      position={position}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect?.();
      }}
    >
      <sphereGeometry args={[0.6, 40, 40]} />
      <meshStandardMaterial color={color} roughness={0.28} metalness={0.4} />
    </mesh>
  );
}
```

Avoid a component API with dozens of flags such as `enableGlow`, `doExtraSpin`, `superSmooth`, and `maybeBounce`. When options become numerous, use named variants or compose behaviors as separate components.

### 7. Keep scene events from leaking through unintended objects

R3F pointer events can propagate through intersected objects and bubbling ancestors. Stop propagation when an interaction belongs to a specific mesh. Use a background handler for deselection only when the scene's interaction model makes that behavior clear.

```jsx
function SelectableScene() {
  const [selected, setSelected] = useState(false);

  return (
    <group onPointerMissed={() => setSelected(false)}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          setSelected(true);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={selected ? '#ffbd69' : '#7c5cff'} />
      </mesh>
    </group>
  );
}
```

For a scene with multiple selectable objects, store a selected identifier rather than a separate boolean for each object. That makes selection mutually exclusive and easier to synchronize with a DOM details panel.

### 8. Keep scene state synchronized with the DOM intentionally

A 3D interaction may update a normal React component outside the canvas, such as a product title or description. Lift the discrete state to a common React parent and pass callbacks or values into scene components. Do not query DOM nodes from inside the scene to update content manually.

```jsx
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';

const items = {
  graphite: { title: 'Graphite Edition', color: '#343844' },
  violet: { title: 'Violet Edition', color: '#7c5cff' }
};

export function ProductChooser() {
  const [active, setActive] = useState('graphite');
  const item = items[active];

  return (
    <section>
      <div className="product-copy">
        <p>Selected finish</p>
        <h2>{item.title}</h2>
        <button onClick={() => setActive(active === 'graphite' ? 'violet' : 'graphite')}>
          Change finish
        </button>
      </div>
      <div className="product-canvas">
        <Canvas camera={{ position: [0, 0, 4], fov: 42 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={2} />
          <mesh>
            <sphereGeometry args={[0.8, 48, 48]} />
            <meshStandardMaterial color={item.color} metalness={0.4} roughness={0.25} />
          </mesh>
        </Canvas>
      </div>
    </section>
  );
}
```

The UI and scene are two views of the same state. This is easier to test than maintaining separate, loosely synchronized state inside and outside the canvas.

## Integration Patterns

### Pattern 1: A scene composition with explicit layers

**Use when:** a portfolio scene includes a background, hero object, accents, and a lighting rig.

```jsx
function PortfolioScene() {
  return (
    <>
      <SceneLighting />
      <SceneBackdrop />
      <AccentField />
      <HeroAssembly />
    </>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      <pointLight position={[-3, 1, -2]} intensity={0.8} color="#7c5cff" />
    </>
  );
}

function SceneBackdrop() {
  return (
    <mesh position={[0, 0, -3]}>
      <planeGeometry args={[14, 9]} />
      <meshBasicMaterial color="#101116" />
    </mesh>
  );
}

function HeroAssembly() {
  return (
    <group rotation={[0.1, -0.3, 0]}>
      <mesh>
        <torusKnotGeometry args={[0.75, 0.2, 120, 16]} />
        <meshStandardMaterial color="#9b8cff" metalness={0.5} roughness={0.23} />
      </mesh>
      <mesh position={[1.15, -0.8, -0.2]} scale={0.18}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#70e1d1" />
      </mesh>
    </group>
  );
}
```

The composition reads like a visual plan. A designer can replace the backdrop or hero assembly without editing the lighting implementation.

### Pattern 2: A reusable animated object with a clean API

**Use when:** the same visual object appears across multiple scenes with different colors or speeds.

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function AnimatedRing({ color = '#70e1d1', speed = 0.3, position = [0, 0, 0] }) {
  const ref = useRef(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += speed * delta;
  });

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[0.55, 0.08, 20, 96]} />
      <meshStandardMaterial color={color} metalness={0.55} roughness={0.22} />
    </mesh>
  );
}

function RingComposition() {
  return (
    <group>
      <AnimatedRing position={[-0.8, 0.2, 0]} color="#7c5cff" speed={0.2} />
      <AnimatedRing position={[0.75, -0.3, -0.5]} color="#70e1d1" speed={-0.32} />
      <AnimatedRing position={[0, 0.8, -1]} color="#ffbd69" speed={0.12} />
    </group>
  );
}
```

Negative speed is a valid, explicit way to rotate in the opposite direction. If many thousands of similar objects are needed, this component-per-object approach is not the right optimization boundary; evaluate instancing.

### Pattern 3: One selected object drives the scene and details panel

**Use when:** a project gallery or product configurator needs one selected item and a DOM information panel.

```jsx
import { Canvas } from '@react-three/fiber';
import { useState } from 'react';

const projects = [
  { id: 'kinetic', title: 'Kinetic Objects', color: '#7c5cff' },
  { id: 'soft-form', title: 'Soft Form', color: '#70e1d1' },
  { id: 'amber-study', title: 'Amber Study', color: '#ffbd69' }
];

function ProjectMesh({ project, active, onSelect }) {
  return (
    <mesh
      position={[projects.findIndex((item) => item.id === project.id) * 1.5 - 1.5, 0, 0]}
      scale={active ? 1.12 : 1}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(project.id);
      }}
    >
      <icosahedronGeometry args={[0.48, 2]} />
      <meshStandardMaterial color={project.color} roughness={0.3} metalness={0.3} />
    </mesh>
  );
}

export function ProjectSelector() {
  const [selectedId, setSelectedId] = useState(projects[0].id);
  const selected = projects.find((project) => project.id === selectedId);

  return (
    <section>
      <div aria-live="polite">
        <h2>{selected.title}</h2>
        <p>Selected project: {selected.id}</p>
      </div>
      <div style={{ height: 420 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 42 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={1.8} />
          {projects.map((project) => (
            <ProjectMesh
              key={project.id}
              project={project}
              active={project.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </Canvas>
      </div>
    </section>
  );
}
```

For a large list, precompute positions instead of calling `findIndex` during each component render. This example favors readability and shows the state flow.

### Pattern 4: Pointer target with frame-loop smoothing

**Use when:** an object should subtly follow pointer movement without snapping.

```jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function PointerResponsiveObject() {
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!ref.current) return;
    const blend = 1 - Math.exp(-6 * delta);
    ref.current.rotation.y += (target.current.x * 0.3 - ref.current.rotation.y) * blend;
    ref.current.rotation.x += (target.current.y * 0.2 - ref.current.rotation.x) * blend;
  });

  return (
    <mesh
      ref={ref}
      onPointerMove={(event) => {
        target.current.x = event.pointer.x;
        target.current.y = event.pointer.y;
      }}
    >
      <torusKnotGeometry args={[0.7, 0.2, 100, 14]} />
      <meshStandardMaterial color="#9b8cff" roughness={0.25} metalness={0.45} />
    </mesh>
  );
}
```

This uses normalized R3F pointer coordinates rather than raw screen pixels. Keep the rotation range subtle; extreme pointer mapping can make a polished hero feel unstable or difficult to read.

### Pattern 5: Reusable material presets

**Use when:** a site needs a coherent visual language across several meshes.

```jsx
const materials = {
  porcelain: { color: '#e9e7e2', roughness: 0.32, metalness: 0.04 },
  anodizedViolet: { color: '#7c5cff', roughness: 0.24, metalness: 0.58 },
  softMint: { color: '#70e1d1', roughness: 0.38, metalness: 0.18 }
};

function Finish({ type = 'anodizedViolet' }) {
  const finish = materials[type] ?? materials.anodizedViolet;

  return <meshStandardMaterial {...finish} />;
}
```

Use named presets to keep tuning intentional. For physical materials requiring clearcoat, transmission, or other specialized behavior, create a separate preset rather than adding many unrelated conditional props to one component.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| One giant scene component | Composition grows organically without boundaries | Split by visual responsibility and independent design changes |
| A component for every tiny JSX fragment | Abstraction is mistaken for maintainability | Extract components when they clarify ownership, reuse, or behavior |
| React state updated every frame | State is used as a frame clock | Use refs and `useFrame` for continuous transforms |
| Every object owns duplicate geometry | Reuse was not considered | Share resources where useful or use instancing for large repeated sets |
| Shared resource is disposed too early | Ownership and lifetime are unclear | Document whether the resource is component-owned or shared |
| Every component receives many flags | Reuse API is too broad | Use a small prop API, named variants, or composition |
| Pointer events trigger parent handlers | Event propagation is not considered | Stop propagation where interaction ownership is explicit |
| DOM panel and scene disagree | Duplicate state is maintained in two places | Lift discrete state to a common React parent |
| Hover is the only interaction cue | Desktop pointer behavior is assumed universal | Provide visible focusable DOM controls when an action matters |
| Pointer movement causes jitter | Transforms snap directly to event coordinates | Store targets in refs and smooth them in `useFrame` |
| Thousands of meshes are rendered individually | A small prototype grew without profiling | Consider `InstancedMesh` or R3F instancing patterns |
| Shared theme is mutated globally | Configuration is treated as a state store | Keep defaults immutable and make state explicit |
| Scene-specific details leak into shared primitives | Components are reused without a clear contract | Keep primitives generic and compose scene-specific behavior outside them |

## Mental Models

1. **Composition mirrors design intent:** component boundaries should match independently adjustable visual responsibilities.
2. **Groups create coordinate spaces:** move an assembly through its parent rather than updating every child.
3. **State is for decisions:** selection and modes belong in React state; frame-rate motion belongs in refs.
4. **Resources have owners:** shared geometry and materials need a clear lifetime and disposal policy.
5. **Events have boundaries:** stop propagation when a specific object owns the interaction.
6. **One source of truth:** let scene and DOM reflect the same discrete state instead of synchronizing two copies.
7. **Abstraction should pay rent:** create a component when it improves reuse, clarity, ownership, or testing.

## Quick Reference

| Need | Pattern |
|---|---|
| Separate lighting and visual content | `SceneLighting` + `SceneContent` components |
| Move several meshes together | `<group>` |
| Reuse an animated primitive | Small prop-driven component |
| Smooth pointer-driven motion | Ref-held target + `useFrame` interpolation |
| Update a details panel from a mesh click | Lift selected ID into a common parent |
| Keep colors consistent | Immutable theme/material presets |
| Avoid per-frame React renders | Mutate a referenced Three.js object |
| Share expensive resources | Explicitly managed shared geometry/material |
| Handle overlapping pointer events | `event.stopPropagation()` |
| Scale repeated geometry to large counts | Instancing rather than one component per object |
| Expose variants | Named presets or a small variant prop |
| Keep essential text accessible | Semantic DOM outside the canvas |

## Build Challenge

### Project: Interactive 3D Project Selector

Create a portfolio project selector with three 3D objects and a matching DOM details panel.

**Requirements**

1. Compose the scene from separate lighting, object, and interaction components.
2. Create a reusable `ProjectMesh` that receives `project`, `active`, and `onSelect` props.
3. Store the selected project ID in one parent React state variable.
4. Use the same selected ID to update both the active object's appearance and the DOM title/description.
5. Add subtle pointer-follow motion to the active object using a ref and `useFrame`.
6. Use a shared visual theme or named material presets.
7. Keep each mesh's event behavior intentional and prevent clicks from bubbling into unrelated scene handlers.
8. Ensure keyboard users can select projects through real DOM buttons, not only canvas clicks.
9. Give the canvas a responsive container height and test at desktop and mobile widths.
10. Profile the scene before optimizing; if you increase the object count substantially, investigate instancing.
11. Confirm the scene has no unnecessary per-frame React state updates and no duplicated selection state.

**Definition of done**

- Selecting an object updates the 3D highlight and the matching DOM details.
- The scene is split into meaningful, reusable components.
- Pointer motion is smooth rather than jumpy.
- Shared configuration is not mutated as hidden global state.
- All essential selection actions are available through accessible DOM controls.
- The code remains easy to tune without rewriting the entire scene.
