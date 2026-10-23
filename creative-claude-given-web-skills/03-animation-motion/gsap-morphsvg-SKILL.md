# GSAP MorphSVG — Shape Morphing That Preserves Meaning

> **Skill file:** `gsap-morphsvg/SKILL.md`
> **Layer:** 03 — Animation & Motion
> **Scope:** SVG path morphing, shape compatibility, icon transitions, responsive SVGs, accessibility, cleanup, and debugging.
> **Use this skill when:** an SVG shape must transition into another shape while preserving visual continuity.
> **Do not use this skill when:** a simple opacity/transform transition is clearer or the target is not vector artwork.

## Why This Matters

SVG morphing can make a state change feel continuous: a menu icon can become a close icon, a compact symbol can expand into a more expressive mark, or a diagram can show a relationship changing over time. But SVG paths are not interchangeable strings. Their geometry, point order, segment structure, winding, and coordinate systems affect whether a morph looks smooth or twists through an unexpected shape.

MorphSVG helps interpolate compatible SVG shapes, but the production responsibility remains yours: choose meaningful start and end states, preserve accessible names, account for reduced motion, and clean up animations when the component unmounts. A morph should communicate a state change, not make the user guess what the icon means. Keep the static SVG useful if JavaScript or the plugin fails.

Common failures include a path that collapses into a knot, an icon that looks correct only at one size, an animation that updates `d` every frame without a performance check, or an interactive control whose accessible name never changes when its meaning changes. Treat the SVG’s visual geometry and the control’s semantic state as related but separate concerns.

### 1. Understand Path Morphing

An SVG path’s `d` attribute describes commands and coordinates. Two paths can represent similar silhouettes while using very different command structures. MorphSVG calculates a compatible interpolation between shapes, but the visual result still depends on the source geometry and configuration.

```js
import gsap from "gsap";
import MorphSVGPlugin from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

const path = document.querySelector("[data-morph-path]");
const destination = document.querySelector("[data-morph-target]");

if (path && destination) {
  gsap.to(path, {
    duration: 0.45,
    ease: "power2.inOut",
    morphSVG: destination
  });
}
```

This example assumes both paths are available in the same document and the installed plugin supports the shown import. Confirm the current GSAP MorphSVG documentation for the project’s version and distribution method. A shape can be valid SVG yet still produce a poor-looking morph; inspect the in-between frames, not only the start and end.

**Gotcha:** A valid final path does not guarantee a good intermediate shape. Always inspect the motion at slow playback speed and at the actual display size.

### 2. Register the Plugin and Verify the Build

Import MorphSVG from the installed GSAP package and register it with GSAP. Keep plugin versions aligned with the main GSAP package and verify the production build, not only a development preview.

```js
import gsap from "gsap";
import MorphSVGPlugin from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);
```

If the project uses a CDN rather than a bundler, use the official distribution instructions for that environment. Do not mix arbitrary versions of GSAP core and plugin files. If the plugin is unavailable, the page should still show a meaningful static SVG or use a simpler opacity/transform fallback.

Register plugins once in a shared animation setup where practical. Avoid repeated setup during component renders. Confirm the import resolves and that the animation is not silently skipped due to a missing target or a malformed selector.

### 3. Design the Start and End Shapes

Begin with the intended visual states. Keep the silhouette simple, with a clear center of mass and predictable alignment. When designing two shapes specifically to morph, use a similar coordinate system and comparable proportions. Avoid unnecessary tiny path segments, sharp changes in winding, and wildly different point distributions.

```html
<svg viewBox="0 0 48 48" role="img" aria-labelledby="shape-title">
  <title id="shape-title">Shape transition example</title>
  <path data-morph-path d="M8 24 C8 15 15 8 24 8 S40 15 40 24 S33 40 24 40 S8 33 8 24 Z" />
  <path data-morph-target d="M12 12 L36 12 L36 36 L12 36 Z" hidden />
</svg>
```

This markup illustrates two path targets, not a finished accessible control. For production, keep the target geometry in a suitable hidden SVG definition or a separate path source according to the plugin’s supported syntax. The `hidden` attribute on an SVG path may not be the best way to preserve a morph target in every browser; verify how the plugin measures targets and choose a compatible source representation.

Do not use a complex illustration as the first morph exercise. Start with simple geometric shapes and build complexity only after the coordinate systems and endpoint shapes are stable.

### 4. Use `morphSVG` with a Target Path

The `morphSVG` tween property can point to another path or path data, depending on the supported API. Prefer an explicit destination element when the project maintains both shapes in SVG. This makes the intended endpoints easy to inspect in the Elements panel.

```js
const path = document.querySelector("[data-morph-path]");
const target = document.querySelector("[data-morph-target]");

if (path && target) {
  gsap.to(path, {
    morphSVG: target,
    duration: 0.5,
    ease: "power2.inOut"
  });
}
```

Do not mutate `d` manually on every frame. Let the plugin interpolate the path and manage its geometry. If the target path is not in the rendered document or cannot be measured by the plugin, use a supported path-data configuration or another official pattern for the installed version.

Name the destination state in application logic, such as `isOpen`, `isSelected`, or `isExpanded`. Do not infer business state by parsing the current path data; the path is a visual output, not the source of truth.

### 5. Use `shapeIndex` and Other Options Deliberately

MorphSVG provides options to influence how points are aligned and how the interpolation is distributed. The exact option syntax and support should be checked against the installed plugin version. `shapeIndex` can help choose the correspondence between shapes, while options such as `type` and `origin` may influence how the morph is interpreted.

```js
gsap.to(path, {
  morphSVG: {
    shape: target,
    shapeIndex: "auto"
  },
  duration: 0.5,
  ease: "power2.inOut"
});
```

Treat options as tools for fixing a visible geometry problem, not as settings to copy blindly. Change one option at a time and inspect the midpoint. If the path twists, try adjusting the shape correspondence or redesigning the endpoints before adding more complex configuration.

Keep the plugin’s documented option names and accepted values exact. If an option is unavailable in the installed version, remove it rather than relying on a silent fallback.

### 6. Animate a Menu Icon into a Close Icon

A menu-to-close morph is a useful small interaction, but three horizontal lines and two diagonal lines do not necessarily share a natural point mapping. The path design should be built for morphing, or a simpler line-transform animation may be more robust.

```html
<button type="button" aria-expanded="false" aria-controls="site-navigation" data-menu-toggle>
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path data-menu-path d="M3 6 H21 M3 12 H21 M3 18 H21" />
  </svg>
  <span class="visually-hidden">Open navigation</span>
</button>
```

A multi-subpath icon may not be an ideal target for every morph strategy. For a menu icon, consider separate line elements animated with rotation and scale instead of morphing a single path. If using MorphSVG, create and test a path representation designed to interpolate smoothly.

When the menu opens, update `aria-expanded`, make the navigation available, and change the control’s accessible name if the label is action-oriented (“Open navigation” / “Close navigation”). Keep the button one keyboard stop and preserve `:focus-visible` styling. The SVG itself is decorative inside the named button, so `aria-hidden="true"` is appropriate in this example.

### 7. Coordinate Multiple SVG Elements

A single icon can use multiple paths, circles, and groups. Animate the parts with a coordinated GSAP timeline when a complete morph would be difficult to maintain. This often provides better control over individual line rotation, opacity, and scale.

```js
const timeline = gsap.timeline({ paused: true });

timeline
  .to("[data-line-top]", {
    rotation: 45,
    transformOrigin: "50% 50%",
    duration: 0.2,
    ease: "power2.out"
  }, 0)
  .to("[data-line-bottom]", {
    rotation: -45,
    transformOrigin: "50% 50%",
    duration: 0.2,
    ease: "power2.out"
  }, 0)
  .to("[data-line-middle]", {
    autoAlpha: 0,
    duration: 0.12,
    ease: "none"
  }, 0);

timeline.play();
```

The line animation is an alternative, not a MorphSVG requirement. Use SVG transform origins intentionally and verify the result in Safari, Firefox, and Chromium. If a path rotates around an unexpected point, inspect its SVG coordinate system and the transform-origin behavior rather than adding arbitrary offsets.

For multi-part icons, keep the semantic state in one boolean or application-state field. Drive the whole timeline from that state so repeated clicks do not create conflicting animations.

### 8. Preserve SVG Coordinate Systems and ViewBoxes

An SVG `viewBox` defines the internal coordinate system. If the source and destination use different coordinate systems, convert or normalize the shapes before attempting a morph. Keep the SVG responsive through CSS dimensions and the viewBox rather than rewriting path coordinates for every viewport size.

```css
.icon-frame {
  inline-size: 3rem;
  block-size: 3rem;
  display: inline-grid;
  place-items: center;
}

.icon-frame svg {
  inline-size: 100%;
  block-size: 100%;
  display: block;
  overflow: visible;
}
```

Check `preserveAspectRatio`, intrinsic sizing, and any parent transforms. A path can appear stretched because the SVG itself is being stretched, not because MorphSVG interpolates incorrectly. Prefer a stable viewBox and a CSS box that preserves the intended aspect ratio.

If the design intentionally changes aspect ratio, test whether `scale`-like visual changes are acceptable. Avoid distorting an important logo or pictogram if the silhouette carries brand meaning.

### 9. Use Morphing for Data and Illustration States

Morphing can help communicate changes in a diagram, progress indicator, or simple illustration. Keep the transformation semantically meaningful: the user should understand why one shape becomes another. For a data visualization, preserve labels and the underlying data relationship; do not use a visually dramatic morph that implies a value change that did not occur.

```js
function setShapeState(path, target, nextState) {
  if (!path || !target) return;

  path.dataset.state = nextState;
  gsap.to(path, {
    morphSVG: target,
    duration: 0.45,
    ease: "power2.inOut"
  });
}
```

This helper is a minimal illustration. In a real component, store `nextState` in the application model, cancel or replace any active tween, and ensure the final path is consistent with the selected state. If the morph is interrupted, the next transition must start from the current visual state or explicitly reset to a known state.

Keep important labels outside the animated path and available to assistive technology. A shape alone should not be the only way to convey success, warning, error, or progress.

### 10. Handle Repeated Input and Interruption

Interactive controls can be activated repeatedly before the previous animation completes. Decide whether the animation should reverse, be replaced, or complete before the next state change. Do not create a new timeline on every click without controlling the previous one.

```js
let morphTween = null;
let isExpanded = false;

function toggleShape(path, target) {
  if (!path || !target) return;

  isExpanded = !isExpanded;
  morphTween?.kill();

  morphTween = gsap.to(path, {
    morphSVG: isExpanded ? target : path.dataset.collapsedPath,
    duration: 0.35,
    ease: "power2.inOut",
    overwrite: "auto"
  });
}
```

The sample shows the interruption decision but the return path must be stored in a supported form for the installed plugin. Avoid relying on a `data-*` value that was never populated. For robust code, keep explicit references to both endpoint paths or their path data and choose the destination based on application state.

Killing a tween does not automatically restore the original shape. It only stops that tween. The next animation should start from a known current or target state and update semantic state at the same time.

### 11. Make the Control Accessible

An animated SVG inside a button is usually decorative when the button already has a clear accessible name. Use a native `<button>` and keep the SVG out of the accessibility tree with `aria-hidden="true"` when appropriate. For an SVG that conveys standalone information, use an accessible title or a nearby text description.

```html
<button type="button" aria-pressed="false" data-shape-toggle>
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path data-toggle-path d="M5 16 H27" />
  </svg>
  <span>Show alternate view</span>
</button>
```

Use `aria-pressed` for a toggle button whose pressed state remains meaningful, or `aria-expanded` when the control expands/collapses a region. Do not choose attributes based only on the animation’s visual state. Keep the control label stable when that is the expected toggle pattern; use action-oriented labels only when the interface convention calls for them.

Style `:focus-visible` clearly and preserve adequate hit area. Do not make an SVG path the only click target with no keyboard support. Test with keyboard navigation and a screen reader, including the state announcement when the control is activated.

### 12. Respect Reduced Motion

A morph can be visually intense because every point of the shape moves. Respect the `prefers-reduced-motion` preference by replacing the morph with an immediate state change or a brief opacity transition that does not create disorienting movement.

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function animateMorph(path, target) {
  if (reduceMotion.matches) {
    // Use the final state immediately in the application's state model.
    path.setAttribute("d", target.getAttribute("d"));
    return null;
  }

  return gsap.to(path, {
    morphSVG: target,
    duration: 0.45,
    ease: "power2.inOut"
  });
}
```

Copying the `d` attribute is only suitable when the target is a compatible path and that immediate change represents the intended final state. For more complex SVGs, switch a state class or render the correct target shape instead. If the preference changes while the component is active, handle the media-query change and stop any ongoing motion safely.

The default visual state must remain meaningful without animation. Do not hide a control until the morph finishes, and do not use motion as the only cue that a state changed.

### 13. Clean Up Component Lifecycles

In a framework, scope animation setup to the component and revert or kill it during teardown. Do not keep references to detached SVG nodes after a route transition. In vanilla JavaScript, remove event listeners and clear active tweens when the component is destroyed.

```js
const button = document.querySelector("[data-shape-toggle]");
const path = document.querySelector("[data-toggle-path]");
let tween;

function onToggle() {
  if (!path) return;

  tween?.kill();
  tween = gsap.to(path, {
    rotation: "+=180",
    transformOrigin: "50% 50%",
    duration: 0.35,
    ease: "power2.inOut"
  });
}

button?.addEventListener("click", onToggle);

function destroy() {
  button?.removeEventListener("click", onToggle);
  tween?.kill();
  tween = null;
}
```

This example uses a transform alternative to morphing, but demonstrates explicit listener and tween cleanup. A production implementation should use the official framework integration where appropriate. Avoid direct DOM manipulation of SVG nodes owned by React or Vue unless the integration is designed for it.

### 14. Debug Path Geometry Systematically

When a morph twists, first inspect the source and destination shapes. Check whether the SVG paths are valid, whether both endpoints are in the expected coordinate space, and whether the point correspondence is sensible. Then inspect the actual rendered size and any ancestor transforms. Only after those checks should you tune `shapeIndex` or other plugin options.

```js
function inspectSvgPath(path) {
  if (!path) {
    console.warn("Missing SVG path");
    return null;
  }

  const box = path.getBBox();
  const style = getComputedStyle(path);
  const result = {
    dLength: path.getAttribute("d")?.length ?? 0,
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.round(box.width),
    height: Math.round(box.height),
    fill: style.fill,
    stroke: style.stroke,
    transform: style.transform
  };

  console.table([result]);
  return result;
}
```

Use the helper manually in development. In DevTools, inspect the Elements panel for the path’s `d` attribute, computed fill/stroke, viewBox, and ancestor transforms. Slow the animation down and observe the midpoint. Use the Performance panel if the frame rate is poor; inspect paint, layout, and long tasks instead of guessing.

### 15. Performance and Browser Validation

MorphSVG updates vector path geometry during the animation. A simple icon is usually inexpensive, while many complex paths with thousands of segments can create CPU and paint costs. Prefer fewer, simpler paths for repeated UI elements. Do not animate a complex illustration on every scroll frame unless profiling supports it.

Use transforms and opacity for accompanying movement when possible, but remember that morphing the `d` attribute itself is the core effect and can require SVG paint work. `will-change` is not a general fix for path morphing. It may create layers without removing the cost of calculating new path geometry.

Test in supported Safari, Firefox, and Chromium versions. Use the GSAP documentation for plugin support and caniuse for related platform features. `@supports` can check CSS features but cannot confirm that the JavaScript plugin imported successfully. Keep a static SVG fallback and make sure a missing plugin does not leave the interface in a broken state.

### 16. Production Patterns

### Pattern 1 — Simple Shape Morph

**What it does:** Transitions one path toward a target path.
**When to use:** A small illustration or icon with deliberately compatible endpoints.
**Implementation:**

```js
const state = { active: false };

function setActive(path, target) {
  if (!path || !target) return;
  state.active = !state.active;

  gsap.to(path, {
    morphSVG: state.active ? target : path.dataset.originalPath,
    duration: 0.4,
    ease: "power2.inOut"
  });
}
```

Store `data-original-path` only if the application populates it with a valid path string. For production, explicit references to both endpoints are often easier to audit than hidden path data.

### Pattern 2 — Icon State with Native Button

**What it does:** Connects an SVG visual state to a semantic button state.
**When to use:** A toggle control whose icon changes with the application state.
**Implementation:**

```js
button.addEventListener("click", () => {
  const next = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(next));
  animateIconToState(next);
});
```

The `animateIconToState` function should use known endpoint shapes and an interruption policy. Keep the accessible name meaningful and preserve keyboard focus styling.

### Pattern 3 — Menu Icon Alternative with Line Transforms

**What it does:** Animates lines into a close symbol without path interpolation.
**When to use:** A menu icon whose path geometry is awkward to morph.
**Implementation:**

```js
const tl = gsap.timeline({ paused: true });
tl.to("[data-line-top]", { rotation: 45, transformOrigin: "50% 50%", duration: 0.2 }, 0);
tl.to("[data-line-bottom]", { rotation: -45, transformOrigin: "50% 50%", duration: 0.2 }, 0);
tl.to("[data-line-middle]", { autoAlpha: 0, duration: 0.12 }, 0);
```

Check the SVG transform origin in target browsers. Keep the actual menu open/closed state in application logic rather than deriving it from the timeline’s progress.

### Pattern 4 — Reduced-Motion Immediate State

**What it does:** Shows the destination shape without interpolating every point.
**When to use:** The user prefers reduced motion or the morph is decorative.
**Implementation:**

```js
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  renderFinalShape(active);
} else {
  animateMorph(active);
}
```

`renderFinalShape` should update the actual component state and use a valid endpoint. It should not depend on an animation callback to make the control usable.

### Pattern 5 — Repeated Activation Policy

**What it does:** Stops a prior tween before starting a new state transition.
**When to use:** A user can toggle the icon repeatedly during the morph.
**Implementation:**

```js
let currentTween;

function replaceMorph(path, target) {
  currentTween?.kill();
  currentTween = gsap.to(path, {
    morphSVG: target,
    duration: 0.3,
    ease: "power2.out",
    overwrite: "auto"
  });
  return currentTween;
}
```

Capture the next target from application state, not from the tween’s current progress. Killing a tween does not undo the previous state change.

### Pattern 6 — Debug Geometry

**What it does:** Reports the path’s bounding box and relevant computed styles.
**When to use:** The morph looks offset, clipped, or unexpectedly stretched.
**Implementation:**

```js
function reportPath(path) {
  if (!path) return;
  const rect = path.getBBox();
  console.table([{
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    d: path.getAttribute("d")
  }]);
}
```

Use this only during development and avoid logging every frame. Compare both endpoints and inspect the SVG viewBox.

### Pattern 7 — Component Cleanup

**What it does:** Stops animation and removes event listeners when a component leaves the page.
**When to use:** Single-page applications or dynamically mounted controls.
**Implementation:**

```js
function cleanup() {
  activeTween?.kill();
  button?.removeEventListener("click", onClick);
  activeTween = null;
}
```

If the framework owns the DOM, use its lifecycle and the official GSAP integration. Cleanup should be safe to call more than once.

### Pattern 8 — Static Fallback

**What it does:** Keeps the final icon available if motion is disabled or plugin setup fails.
**When to use:** Any user-facing icon state change.
**Implementation:**

```js
function updateIcon(active) {
  button.setAttribute("aria-pressed", String(active));
  if (reduceMotion.matches || !MorphSVGPlugin) {
    renderFinalShape(active);
    return;
  }
  animateMorph(active);
}
```

Do not reference a plugin variable that can throw during module loading; in a real build, handle optional plugin loading at the import/build boundary. The fallback must work independently of a successful morph tween.

### 17. Mistakes and Corrective Actions

| Mistake | Why it fails | Corrective action |
|---|---|---|
| Assuming all SVG paths are compatible | Point correspondence can twist the shape | Simplify endpoints and tune documented shape options |
| Capturing a path that is not measurable | The plugin may not resolve target geometry | Use a supported path-data or visible target strategy |
| Using an unrelated viewBox | Coordinates and proportions may not align | Normalize coordinate systems and preserve aspect ratio |
| Animating too many complex paths | SVG geometry and paint work can become expensive | Reduce path complexity and profile the animation |
| Using morphing for a three-line menu icon by default | The endpoints may have poor point mapping | Use coordinated line transforms when clearer |
| Forgetting the control’s accessible state | Visual state and announced state diverge | Update `aria-expanded` or `aria-pressed` appropriately |
| Making the SVG the only accessible label | The control may have no clear name | Use a native button with a stable accessible name |
| Ignoring reduced motion | The shape movement may be uncomfortable | Render the final state without spatial morphing |
| Killing a tween and assuming state reverted | The visual/app state may remain changed | Choose the next endpoint from application state |
| Registering plugin repeatedly during render | Setup becomes difficult to reason about | Register once at a stable module boundary |
| Using arbitrary `shapeIndex` values | The interpolation can become less natural | Tune documented values against slow-motion playback |
| Animating a hidden target without testing | Geometry may not be available | Use a documented path-data strategy or measurable target |
| Directly mutating framework-owned SVG | Reconciliation can overwrite or duplicate state | Update application state and animate after render |
| Leaving a tween on a detached node | Stale animation can leak into route changes | Kill/revert animation during teardown |
| Adding `will-change` as a universal fix | Layer memory rises without solving path calculations | Profile first and optimize target complexity |
| Ignoring SVG transform origins | Line or shape rotation appears offset | Inspect viewBox, transform origin, and ancestors |
| Using animation as the only status cue | Meaning is lost when motion is disabled | Keep text/state labels and semantics |
| Failing to test actual viewport sizes | Responsive SVG may distort | Test viewBox and CSS sizing at breakpoints |
| Using `@supports` to detect GSAP | CSS feature detection cannot validate JS plugin loading | Handle import/setup failure in JavaScript |
| Skipping browser validation | SVG transforms can differ in rendering | Test supported Safari, Firefox, and Chromium |
| Creating a new timeline for every click | Conflicting tweens produce erratic motion | Store and replace or reverse the active animation |
| Forgetting focus styles | Keyboard users may lose their place | Preserve visible `:focus-visible` styles |
| Using decorative animation on a critical alert | The state change may be delayed or missed | Update content immediately and keep motion secondary |
| Assuming the midpoint will look good | Endpoints can hide a bad interpolation | Inspect the animation at slow playback speed |

### 18. Mental Models

1. **The path is geometry, not state.** Keep the application’s state in a boolean, enum, or data model.
2. **Endpoints determine the quality ceiling.** A well-designed pair of shapes is easier to animate than a pair of unrelated paths.
3. **The midpoint is the real test.** Inspect the in-between shape, not only the endpoints.
4. **Coordinate systems matter.** ViewBox and ancestor transforms affect the perceived geometry.
5. **Motion should clarify a change.** The user must still understand the control without animation.
6. **A tween is temporary.** Cleanup and a known final shape matter more than the animation’s last frame.
7. **Semantic state and visual state are separate.** Update both from the same application action.
8. **Simple SVGs are faster to reason about.** Reduce path complexity before optimizing blindly.
9. **Interruption is a normal input.** Repeated clicks need a deliberate policy.
10. **Reduced motion changes the route, not the destination.** The final state remains correct.
11. **Plugin support is a build concern.** Register and load the plugin intentionally.
12. **Fallbacks are part of the design.** A static icon should remain meaningful if GSAP fails.
13. **A native button beats a clickable path.** Keyboard and accessibility semantics come first.
14. **Measure before tuning.** Use DevTools to separate geometry problems from performance problems.

### 19. Build Challenge: Create a Morphing View Toggle

Build a control that toggles between a compact icon and an expanded icon using MorphSVG when motion is allowed, with a static state change as the reduced-motion fallback.

1. Use a native `<button>` with a visible label or stable accessible name.
2. Use inline SVG with a stable `viewBox` and simple path geometry.
3. Import and register MorphSVG using the installed GSAP package version.
4. Keep the initial SVG meaningful before JavaScript runs.
5. Store the selected state in application logic rather than parsing the current `d` attribute.
6. Define both endpoint shapes explicitly and test their compatibility.
7. Capture and inspect the path’s bounding box and coordinate system.
8. Use a named easing curve such as `power2.inOut`.
9. Keep the duration short enough for a control-state change.
10. Respect `prefers-reduced-motion` by rendering the target state immediately.
11. Update `aria-pressed` or `aria-expanded` according to the control’s actual semantics.
12. Preserve visible `:focus-visible` styling and a comfortable hit area.
13. Define a repeated-activation policy for an in-progress tween.
14. Kill or revert the active animation when the component unmounts.
15. Remove custom event listeners during teardown.
16. Test missing targets and plugin import failures.
17. Test an SVG with an alternate viewBox and verify the fallback remains stable.
18. Inspect the morph midpoint at slow playback speed.
19. Use DevTools Elements and computed styles to diagnose unexpected transforms.
20. Record a Performance trace and inspect paint work for complex paths.
21. Test in supported Safari, Firefox, and Chromium versions.
22. Confirm the control remains understandable with animation disabled.

### Test matrix

| Scenario | Expected result |
|---|---|
| JavaScript disabled | Static icon and label remain meaningful |
| MorphSVG unavailable | Control updates to the final shape without a fatal error |
| Reduced motion enabled | State changes immediately without morph interpolation |
| Rapid repeated clicks | Final icon and semantic state agree |
| Missing target path | No uncaught error; fallback remains usable |
| Keyboard-only use | Button is reachable and visibly focused |
| Screen reader use | Control has a clear name and state |
| Small viewport | SVG keeps its intended aspect ratio |
| Component unmount | No active tween or listener remains |
| Slow playback | Intermediate geometry remains legible |
| Performance profile | No avoidable excessive path complexity or severe jank |
| Browser matrix | SVG renders correctly in supported engines |

## Definition of Done

- [ ] Both endpoint shapes are intentional and visually compatible.
- [ ] The plugin import and options match the installed GSAP version.
- [ ] The SVG viewBox and CSS sizing preserve the intended geometry.
- [ ] The application state—not the path string—controls the target shape.
- [ ] Repeated activation cannot create uncontrolled overlapping tweens.
- [ ] Reduced motion updates the state without unnecessary shape movement.
- [ ] The native control has a meaningful accessible name and state.
- [ ] Keyboard focus and `:focus-visible` styles remain clear.
- [ ] Component teardown stops animations and removes custom listeners.
- [ ] A static fallback remains usable if the plugin or JavaScript fails.
- [ ] DevTools checks confirm the expected geometry, computed styles, and performance.
- [ ] Supported Safari, Firefox, and Chromium versions have been tested.

## Quick Reference

| Need | Use | Caution |
|---|---|---|
| Register plugin | `gsap.registerPlugin(MorphSVGPlugin)` | Match core and plugin versions |
| Morph to another path | `morphSVG: target` | Inspect midpoint geometry |
| Configure a morph | Documented `morphSVG` options | Verify option names for installed version |
| Adjust point correspondence | `shapeIndex` when supported | Tune based on visual evidence |
| Coordinate multiple parts | GSAP timeline | Keep application state separate |
| Animate a menu icon | Often line transforms | A single multi-subpath morph may twist |
| Keep SVG responsive | Stable `viewBox` and CSS sizing | Check `preserveAspectRatio` |
| Inspect path bounds | `getBBox()` | Target must be measurable |
| Inspect computed style | `getComputedStyle()` | Check ancestors and transforms |
| Inspect DOM | DevTools Elements panel | Confirm actual `d` values |
| Diagnose jank | Performance panel | Inspect paint and long tasks |
| Inspect compositing | Layers panel | Do not promote every SVG layer |
| Respect reduced motion | `prefers-reduced-motion` | Render the correct final shape |
| Preserve focus | `:focus-visible` | Avoid clipping the indicator |
| Set toggle semantics | `aria-pressed` / `aria-expanded` | Choose based on behavior |
| Stop a tween | `tween.kill()` | This does not undo app state |
| Remove a listener | `removeEventListener()` | Use the same function reference |
| Test CSS feature support | `@supports` | It does not test plugin availability |
| Check browser coverage | Safari, Firefox, Chromium, caniuse | Test actual product targets |
| Preserve fallback | Static SVG endpoint | Do not hide the only useful icon |
| Tune timing | Named ease and short duration | Avoid unexplained numeric easing |

## Final Operating Rule

Use MorphSVG when a meaningful vector shape change benefits from continuity. Design the endpoints, verify their coordinate systems, inspect the midpoint, and keep the semantic state independent from the path animation. Respect reduced motion, clean up every tween, and ensure the control still communicates its state without the morph.


## Field Notes: SVG Structure and Shape Preparation

A path is not a drawing instruction that can be compared by visual similarity alone. The `d` attribute may include move, line, cubic Bézier, quadratic Bézier, arc, and close-path commands. Two paths can describe the same visible outline while using different command sequences. MorphSVG can normalize and interpolate many shapes, but it cannot make every arbitrary pair of paths look intentional.

Prepare shapes in the illustration tool or codebase with the transition in mind. Keep the number of segments reasonable and avoid tiny points that do not contribute to the silhouette. If a morph repeatedly twists, inspect the path winding, start point, and point correspondence. Try a documented shape-index configuration, but redesign the endpoints if the mapping remains confusing. A complicated plugin configuration cannot always rescue two shapes that were never designed to transition.

Use a stable SVG `viewBox`. If one shape comes from a different illustration or coordinate system, normalize it before building the animation. Check whether the path is transformed by its own `transform` attribute or by a parent group. A shape that seems to drift may be following a different coordinate frame rather than interpolating incorrectly.

When possible, keep source and destination geometry in a clearly named SVG definition or in explicit data that is reviewed alongside the component. Avoid scattering opaque path strings across unrelated event handlers. Name the states in application logic—such as `open`, `closed`, `selected`, or `idle`—and map each state to a known shape.

## Field Notes: State, Interruption, and Reverse Transitions

An animation can be interrupted by a second click, a route change, a reduced-motion preference change, or a component unmount. Decide how each event should behave. A toggle might reverse an active timeline, kill the current tween and animate toward the latest state, or finish before accepting another request. Each is valid in a different interface; uncontrolled overlapping tweens are not.

Store the actual state separately from the tween. For example, `isOpen` should determine whether the icon represents an open or closed menu. The tween’s progress is transient visual information and should not decide whether the navigation region is open. Update `aria-expanded` from the same state that controls the region. If animation is disabled, the exact same state update should still produce the correct icon and content.

Killing a tween does not undo the state change that caused it. If the previous animation moved halfway toward a target, the next transition must intentionally start from the current rendered path or reset to a known endpoint before continuing. Test rapid sequences such as open-close-open and confirm the last requested state wins.

## Field Notes: SVG Accessibility and Semantics

An SVG can be decorative or informative. If an icon is inside a native button that already has a clear accessible name, the SVG is often decorative and can use `aria-hidden="true"`. If the SVG communicates information by itself, provide a meaningful accessible title or an adjacent text alternative. Do not use a path’s shape as the only indication of success, failure, warning, or progress.

Use `<button>` for button actions and `<a>` for navigation. A clickable `<path>` is not a keyboard-accessible control by itself. The control should have a visible `:focus-visible` indicator, an accessible name, and an appropriate state attribute when it is a toggle or expandable control. Do not add focusability to every path or group; that creates a confusing keyboard model.

Respect `prefers-reduced-motion`. For a user who requests reduced motion, render the final path directly or use a minimal opacity change if it is useful. Do not make the destination state available only in an animation callback. If the media preference changes while a morph is running, stop the motion and render the current application state immediately.

## Field Notes: Debugging Order

Use a repeatable diagnostic sequence rather than changing random plugin options:

1. Confirm the source and target nodes exist and the selector returns the intended element.
2. Inspect the source and target `d` attributes and their parent SVG `viewBox` values.
3. Check `getBBox()` for both paths and compare their proportions.
4. Inspect computed transforms, `transform-origin`, fill, stroke, and ancestor transforms.
5. Slow the animation and inspect the midpoint.
6. Try a documented shape correspondence option only after confirming the endpoints.
7. Test reduced-motion and missing-plugin paths.
8. Verify that the application state and accessible state update together.
9. Check whether rapid interaction leaves a tween targeting detached nodes.
10. Record a Performance trace if the animation stutters and inspect paint work.

A small helper that reports path geometry can make the first steps faster. Keep it out of hot animation loops and remove or gate verbose diagnostics in production.

```js
function compareSvgPaths(source, target) {
  if (!source || !target) {
    console.warn("Morph source or target is missing");
    return null;
  }

  const sourceBox = source.getBBox();
  const targetBox = target.getBBox();
  const rows = [
    {
      role: "source",
      dLength: source.getAttribute("d")?.length ?? 0,
      x: sourceBox.x,
      y: sourceBox.y,
      width: sourceBox.width,
      height: sourceBox.height,
      transform: getComputedStyle(source).transform
    },
    {
      role: "target",
      dLength: target.getAttribute("d")?.length ?? 0,
      x: targetBox.x,
      y: targetBox.y,
      width: targetBox.width,
      height: targetBox.height,
      transform: getComputedStyle(target).transform
    }
  ];

  console.table(rows);
  return rows;
}
```

## Field Notes: Browser and Performance Strategy

MorphSVG’s core work is interpolating path geometry. Unlike a simple opacity tween, changing an SVG path can require the browser to repaint the vector shape. A small icon with a few segments is usually manageable; a complex illustration with many paths and frequent updates may become expensive. Reduce the number of animated shapes, simplify the geometry, and avoid running elaborate morphs continuously while scrolling unless a performance trace shows the design is viable.

Do not assume `will-change: transform` will optimize a morph that primarily changes the `d` attribute. A compositor layer may help a surrounding transform, but it does not eliminate path interpolation or SVG paint costs. Profile in DevTools Performance and inspect the Layers panel only when it helps explain observed behavior. Check frame rate and long tasks on representative devices, not only a powerful desktop.

Verify current Safari, Firefox, and Chromium versions in the product’s support matrix. The official GSAP documentation is the source for MorphSVG API details. caniuse and `@supports` help with browser platform features, but neither proves that a JavaScript plugin was imported or registered. Keep a meaningful static SVG fallback so a plugin loading failure never leaves a blank or unusable control.


**Gotcha:** A hidden SVG target can have unusable geometry depending on how it is hidden and how the plugin resolves it. If a morph fails only when the target is hidden, use a documented path-data source or another measurable target strategy instead of assuming every hidden node can be measured.

**Gotcha:** The visual icon and the interactive state can drift apart when a tween is killed or interrupted. Update the application state first, choose the correct endpoint from that state, and make the reduced-motion path use the same endpoint.

**Gotcha:** A path morph can repaint every frame even when the SVG appears small. If a complex illustration stutters, reduce path complexity and the number of simultaneous morphs before adding compositor hints.
