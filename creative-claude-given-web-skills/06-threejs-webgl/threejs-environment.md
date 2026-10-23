# SKILL: threejs-environment

**Layer:** 06 — Three.js / WebGL

**Goal:** Build convincing Three.js environments with deliberate backgrounds, lighting, fog, reflections, and spatial composition while keeping scenes performant and art-directed.

## Why This Matters (Senior Perspective)

A 3D object rarely feels finished when it floats in an empty world. The environment gives it context: a studio backdrop makes a product feel premium, atmospheric fog creates depth, a floor anchors the subject, and an environment map gives reflective materials something believable to reflect. In creative web work, environmental decisions often separate a scene that merely renders from one that feels designed.

Environment work is not the same as adding more objects. A common beginner approach is to add a floor, many lights, a large HDR image, fog, and a background gradient all at once. The result can become visually noisy and expensive, while reflective materials still look wrong because their environment is missing or their lighting is inconsistent. Senior developers decide what the viewer should notice first, then build only the cues that support that hierarchy.

Three.js environments combine separate systems: scene background, lighting, fog, physical-material reflections, environment maps, and geometry such as floors or walls. These systems have different purposes. A background image does not automatically illuminate the scene; fog does not reproduce every physical atmospheric effect; and a floor that resembles a studio surface does not automatically behave like a mirror. Knowing these distinctions helps you choose the right technique instead of layering effects blindly.

## Core Concepts

### 1. Separate the visible background from environmental illumination

`scene.background` determines what appears behind geometry. It can be a color, texture, or environment texture. A background alone does not necessarily provide the reflections or illumination expected by metallic materials.

```js
import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color('#101116');
```

For a textured backdrop:

```js
const loader = new THREE.TextureLoader();

loader.load('/textures/studio-backdrop.jpg', (texture) => {
  // The image frames the scene; it is not a substitute for a light rig.
  scene.background = texture;
});
```

Use a solid color or gradient for clean product scenes. Use a photograph only when its perspective, brightness, and palette agree with the 3D subject. If the image needs to illuminate reflective materials, add an environment map or suitable lighting too.

### 2. Environment maps make reflective materials legible

Metallic and glossy materials need something to reflect. A metal sphere in a featureless black scene may look nearly black because metal reflects its surroundings rather than producing much diffuse color. Environment maps provide surrounding radiance for reflections and image-based lighting.

A typical Three.js workflow loads an HDR texture and uses `PMREMGenerator` to create a prefiltered environment suitable for roughness-aware reflections:

```js
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const rgbeLoader = new RGBELoader();

rgbeLoader.load('/textures/studio-small.hdr', (hdrTexture) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const environment = pmrem.fromEquirectangular(hdrTexture).texture;
  scene.environment = environment;

  // The generated environment is now used by the scene.
  hdrTexture.dispose();
  pmrem.dispose();
});
```

Production code should also handle load failures, component unmounting, and disposal of the generated environment texture when it is no longer used. Do not dispose `environment` while the scene still relies on it.

For React Three Fiber, Drei's `Environment` component is often more convenient. Confirm the API against the installed version.

### 3. Use physically based materials with a coherent environment

`MeshStandardMaterial` and `MeshPhysicalMaterial` respond to light and environment information. Roughness controls how broadly reflections spread; metalness influences the balance between dielectric and metallic behavior.

```js
const material = new THREE.MeshStandardMaterial({
  color: '#b7bac5',
  metalness: 0.82,
  roughness: 0.28
});
```

Setting `metalness: 1` does not automatically make a material look expensive. Without meaningful reflections, a highly metallic object may appear dark or flat. Begin with moderate values, add a useful environment, then tune roughness and light placement together.

### 4. Studio floors and backdrops establish scale

A floor gives the viewer a visual anchor and can create contact shadows. A curved cyclorama—a floor that smoothly bends into the background—avoids a sharp horizon line and is common in product photography.

```js
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({
    color: '#171922',
    roughness: 0.82,
    metalness: 0.02
  })
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.1;
scene.add(floor);
```

Position the floor relative to the subject and camera. If it intersects the object, appears too far below it, or creates a distracting horizon, the composition will feel wrong. A backdrop can be better than a physical floor when the floor's extent is not part of the visual story.

### 5. Fog adds depth, but it is not a lighting substitute

Three.js supports linear fog and exponential fog. Fog blends distant objects toward a specified color, helping separate depth layers. It can reduce contrast if its color does not match the background.

```js
scene.fog = new THREE.Fog('#101116', 8, 22);
```

Or use exponential fog:

```js
scene.fog = new THREE.FogExp2('#101116', 0.035);
```

Match fog and background colors to avoid a visible color band. Tune near/far distances to the scale of your scene; copied values can make the subject disappear.

### 6. Light rigs communicate material and shape

A studio setup often uses a key light, a softer fill, and a rim or back light. These roles create a hierarchy that helps the viewer read the form.

```jsx
function StudioRig() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={2.2} />
      <pointLight position={[-3, 1.5, -2]} intensity={1.1} color="#7c5cff" />
      <pointLight position={[2, -0.5, 2]} intensity={0.5} color="#70e1d1" />
    </>
  );
}
```

Use the key to describe the main form, fill to prevent unwanted darkness, and rim light to separate the silhouette. Too many equally strong lights flatten the shape. Soft shadows require an appropriate shadow technique and a performance budget.

### 7. Reflection, shadow, and background are different visual signals

- **Environment reflection:** tells the viewer what surrounds a reflective object.
- **Cast/contact shadow:** tells the viewer how an object relates to a surface and light source.
- **Background:** provides framing and visual context.
- **Fog:** reduces contrast with distance and supports spatial depth.

Do not use a fake mirror reflection when a soft contact shadow would solve the problem. Do not enable shadow maps just to make a glossy floor look reflective.

### 8. Choose environmental cues for the target experience

A static product hero may benefit from a compact HDR environment and a restrained floor. An abstract portfolio object may look better with a solid background, a few colored lights, and no physical floor. An architectural walkthrough needs different cues from an isolated product shot.

- **Product showcase:** readable silhouette, controlled reflections, clear ground contact.
- **Abstract hero:** intentional negative space, restrained palette, minimal clutter.
- **Immersive environment:** consistent spatial scale, depth cues, and a performance plan.
- **Interactive gallery:** clear focus, predictable camera composition, and no distracting background motion.

## Integration Patterns

### Pattern 1: Minimal studio environment

**Use when:** a product or hero object needs a grounded presentation without a large external asset.

```jsx
function StudioEnvironment() {
  return (
    <>
      <color attach="background" args={['#101116']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 3]} intensity={2.1} />
      <pointLight position={[-3, 1, -2]} intensity={0.8} color="#7c5cff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#171922" roughness={0.86} />
      </mesh>
    </>
  );
}
```

This creates a backdrop and ground plane. It does not create soft contact shadows automatically; those require an appropriate shadow configuration.

### Pattern 2: HDR environment in React Three Fiber

**Use when:** polished or metallic materials need believable surrounding reflections.

```jsx
import { Environment } from '@react-three/drei';

function ReflectiveProductScene() {
  return (
    <>
      <Environment preset="studio" />
      <mesh>
        <torusKnotGeometry args={[0.8, 0.22, 120, 16]} />
        <meshStandardMaterial
          color="#c4c7d0"
          metalness={0.78}
          roughness={0.24}
        />
      </mesh>
    </>
  );
}
```

Environment presets and loading behavior depend on the installed Drei version and network availability. For production, consider hosting an optimized environment asset locally and providing a fallback if loading fails.

### Pattern 3: Solid background with environment lighting

**Use when:** the art direction calls for a clean backdrop while the object still needs rich reflections.

```jsx
import { Environment } from '@react-three/drei';

function CleanReflectiveHero() {
  return (
    <>
      <color attach="background" args={['#0d0e12']} />
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.2} />
      <mesh>
        <sphereGeometry args={[0.8, 48, 48]} />
        <meshStandardMaterial
          color="#b7bac5"
          metalness={0.86}
          roughness={0.2}
        />
      </mesh>
    </>
  );
}
```

The environment contributes lighting and reflections while the solid color remains the visible backdrop. Verify `Environment` props against your installed version.

### Pattern 4: Depth layers with matching fog

**Use when:** a scene has foreground, middle-distance, and background elements.

```jsx
function AtmosphericScene() {
  return (
    <>
      <color attach="background" args={['#10131c']} />
      <fog attach="fog" args={['#10131c', 7, 20]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[3, 5, 4]} intensity={1.7} />

      <mesh position={[0, 0, 0]}>
        <icosahedronGeometry args={[0.7, 2]} />
        <meshStandardMaterial color="#7c5cff" roughness={0.3} />
      </mesh>
      <mesh position={[-2, 0.3, -5]} scale={0.65}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial color="#70e1d1" roughness={0.45} />
      </mesh>
      <mesh position={[2, -0.4, -9]} scale={0.55}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color="#ffbd69" roughness={0.5} />
      </mesh>
    </>
  );
}
```

Keep fog and background colors aligned so distant objects fade naturally. Fog distance is measured in world units, so tune it to the scene rather than copying these values unchanged.

### Pattern 5: Ground a hero object with a shadow

**Use when:** the subject needs to feel attached to a floor instead of floating.

```jsx
function GroundedHero() {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.75, 48, 48]} />
        <meshStandardMaterial color="#9b8cff" roughness={0.28} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.9, 0]}
        receiveShadow
      >
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#171922" roughness={0.9} />
      </mesh>
    </>
  );
}
```

This only works if shadow maps are enabled in the renderer or `Canvas` configuration. Shadow maps cost GPU time and should be tested on mobile. For a simple hero, a soft transparent shadow texture may be cheaper and easier to art-direct.

### Pattern 6: Responsive environment quality

**Use when:** one scene needs different environment budgets on desktop and mobile.

```jsx
function EnvironmentQuality({ quality = 'high' }) {
  const showAccentLight = quality !== 'low';
  const floorSize = quality === 'high' ? 30 : 16;

  return (
    <>
      <color attach="background" args={['#101116']} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[4, 5, 3]} intensity={2} />
      {showAccentLight && (
        <pointLight position={[-3, 1, -2]} intensity={0.7} color="#7c5cff" />
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]}>
        <planeGeometry args={[floorSize, floorSize]} />
        <meshStandardMaterial color="#171922" roughness={0.86} />
      </mesh>
    </>
  );
}
```

For complex scenes, quality should also control shadows, environment resolution, post-processing, and object count. Viewport width is not a reliable measure of GPU capability, so profile on actual target devices.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Metallic object looks black | Metal has little diffuse response and no useful environment | Add an environment map and tune roughness and lighting |
| Background appears but reflections are empty | Background and environment illumination are different systems | Set environment lighting independently of the visible background |
| Too many lights flatten the object | Lights have no distinct roles | Establish key, fill, and rim roles with intentional intensities |
| Floor looks like a mirror | Roughness is too low or reflections dominate | Raise roughness or use a non-reflective floor material |
| Object appears to float | No contact shadow or ground reference | Add a floor, shadow, or art-directed shadow texture |
| Fog creates a visible color band | Fog color differs from background | Match colors and tune fog distances to scene scale |
| HDR asset increases load time | Environment file is too large | Optimize the asset, host it appropriately, and add a loading fallback |
| PMREM resources leak | Generated textures or generator are never disposed | Define ownership and dispose resources when no longer used |
| Shadow maps hurt mobile performance | Large maps and multiple shadow-casting lights are expensive | Limit casters, reduce map size, or use a baked/fake shadow |
| Background image fights the object | Perspective, contrast, or palette is inconsistent | Simplify the backdrop or adjust image and camera together |
| Same environment is used for every scene | Presets are chosen by convenience | Match environment to the scene's actual purpose |
| Quality depends only on viewport width | Screen size is treated as a performance measurement | Profile real devices and use sensible quality defaults |

## Mental Models

1. **Background is framing:** it controls what the camera sees behind geometry.
2. **Environment is what materials see:** reflective objects need meaningful surroundings, not just a flat color.
3. **Light reveals form:** use key, fill, and rim roles rather than adding lights without purpose.
4. **A floor anchors scale:** ground contact and shadows help viewers judge where an object sits.
5. **Fog is a depth cue:** match it to the background and scale it to the world.
6. **Reflections, shadows, and backdrops differ:** choose the tool that solves the actual visual problem.
7. **Environment detail has a budget:** HDR resolution, shadows, lights, and geometry compete for frame time.

## Quick Reference

| Goal | Technique |
|---|---|
| Solid backdrop | `scene.background = new THREE.Color(...)` or R3F `<color attach="background" />` |
| Image backdrop | `TextureLoader` and `scene.background` |
| Reflective metal | HDR environment plus tuned roughness |
| R3F environment | Drei `<Environment />` |
| Prefilter HDR environment | `PMREMGenerator` in raw Three.js workflows |
| Studio floor | Large plane with a deliberate material |
| Seamless studio look | Curved cyclorama or controlled camera framing |
| Atmospheric separation | `Fog` or `FogExp2` with matching background color |
| Ground contact | Shadow map or optimized shadow texture |
| Better material readability | Key/fill/rim light hierarchy |
| Mobile optimization | Reduce shadows, environment resolution, and unnecessary lights |
| Avoid leaks | Dispose only owned textures, generators, and renderer resources |

## Build Challenge

### Project: Premium Studio Environment for a 3D Portfolio Object

Build a polished studio scene for one product-like object, with an environment that supports its material and silhouette.

**Requirements**

1. Start with a solid background and one hero object; confirm camera framing before adding environmental detail.
2. Add a floor plane that grounds the object without cutting through it.
3. Establish a key light and one restrained fill or rim light with a clear purpose.
4. Use a physically based material and tune roughness/metalness under the chosen lighting.
5. Add an HDR/Drei environment only if reflections materially improve the object.
6. Keep visible background independent from environment lighting when the design calls for a solid backdrop.
7. Add fog only if the scene has meaningful depth layers; match its color to the background.
8. If using shadows, enable them intentionally, limit casters, and measure performance cost.
9. Create a lower-cost mobile mode that reduces expensive environmental features.
10. Handle asynchronous environment loading and cleanup according to the library's ownership rules.
11. Test desktop and portrait mobile sizes, checking silhouette, floor placement, and negative space.
12. Capture a before/after comparison and remove any feature that adds cost without improving composition.

**Definition of done**

- The object has a clear silhouette and convincing material response.
- Background, environment lighting, floor, and shadows serve distinct purposes.
- Fog is subtle and color-matched, or omitted when it adds no value.
- The scene remains visually intentional without unnecessary effects.
- Mobile quality avoids expensive features that do not materially improve the result.
- Asset loading and resource cleanup are deliberate.
