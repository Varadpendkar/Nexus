# SKILL: perspective-3d-css

## Layer
**Layer 01 — CSS Foundation**

## Goal
Create convincing, responsive three-dimensional interface effects with CSS by understanding perspective, transform matrices, transform origins, depth ordering, 3D rendering contexts, flattening, backface visibility, and motion accessibility. Use 3D transforms to communicate hierarchy and interaction without making interfaces confusing, slow, or uncomfortable.

## Why This Matters (Senior Perspective)

CSS 3D is not a separate graphics engine; it is a set of transforms and rendering rules layered onto ordinary HTML elements. A few carefully chosen transforms can create depth, tilt, card flips, layered scenes, and subtle interaction feedback. But a design that looks plausible in one browser can fail when its transform context is flattened, its perspective is applied to the wrong element, its back face appears unexpectedly, or its motion becomes uncomfortable on a touch device.

Senior engineers distinguish visual depth from actual layout. Transforms change how an element is painted, but they do not normally change the space it occupies in document flow. Perspective changes the visual projection of transformed descendants; it does not create physical depth or solve layout sizing. A reliable 3D effect starts with a clear scene hierarchy: an outer element establishes perspective, an inner element preserves a 3D context, and individual faces or layers receive transforms that express their roles.

Use 3D as a communication tool. A slight tilt can make a card feel interactive; a flip can reveal a second side when the interaction is clearly signposted. Avoid adding motion merely to demonstrate technical capability. Depth should reinforce content, and every effect should remain readable, operable, and respectful of reduced-motion preferences.

---

## Core Concepts

### 1. 2D transforms versus 3D transforms

CSS transforms can translate, rotate, scale, and skew elements. The 2D forms operate in the plane; 3D forms add a z-axis or rotation around the x- and y-axes.

```css
.tile {
  transform: translateX(1rem) rotate(4deg);
}

.tile--tilted {
  transform: perspective(800px) rotateY(12deg);
}
```

A transform affects the element's rendered position and shape, but it does not normally cause surrounding layout to reflow around the transformed geometry. Transformed elements can also establish containing blocks and stacking contexts.

**Gotcha:** A transformed element may visually overlap its neighbor while still reserving its original layout space. Fix the layout separately rather than trying to use a transform as a spacing system.

### 2. Perspective creates depth cues

Perspective makes objects farther along the z-axis appear smaller relative to objects closer to the viewer. CSS perspective is expressed as a length; smaller values create a stronger perspective effect, while larger values look flatter.

```css
.scene {
  perspective: 900px;
}

.card {
  transform: rotateY(18deg);
}
```

The `perspective` property on a parent affects its transformed descendants. It establishes a shared viewing relationship for those descendants. By contrast, the `perspective()` transform function applies perspective within an individual element's transform list.

**Gotcha:** Perspective is not a distance-to-move value. A card with `perspective: 200px` can look dramatically distorted; a much larger value may look subtle. Tune it against the size of the object and the intended angle.

### 3. Parent perspective versus `perspective()` in `transform`

These forms are related but not identical.

```css
.scene {
  perspective: 900px;
}

.scene__object {
  transform: rotateY(18deg);
}
```

Compared with:

```css
.scene__object {
  transform: perspective(900px) rotateY(18deg);
}
```

The property applies a perspective projection to transformed descendants within the shared scene. The function is one transform operation in the element's transform list, so its order relative to other transform functions matters.

Use the property when multiple elements should share one viewing perspective. Use the function when the effect is intentionally local and the transform-list order is understood.

### 4. Transform functions are order-sensitive

Transform functions are not an unordered bag of effects. Their order affects the resulting coordinate system and rendered result.

```css
.object-a {
  transform: translateZ(40px) rotateY(25deg);
}

.object-b {
  transform: rotateY(25deg) translateZ(40px);
}
```

These can produce different visual results because a translation and a rotation compose in a particular order. If an object should rotate around a hinge and then move in the scene, decide the intended coordinate relationship before rearranging functions.

**Gotcha:** If changing the order makes a card move in an unexpected direction, do not compensate with random offsets. Reduce the transform list to one operation at a time and rebuild the effect deliberately.

### 5. `translateZ()` positions an element in depth

`translateZ()` moves an element along the z-axis relative to its transform coordinate system.

```css
.layer--front {
  transform: translateZ(24px);
}

.layer--back {
  transform: translateZ(-24px);
}
```

Depth only becomes visually meaningful when the element is in a suitable 3D rendering context and the viewing perspective makes the displacement visible. The z-axis does not change normal document flow.

### 6. `rotateX()` and `rotateY()` create tilt

`rotateX()` rotates around the horizontal axis of the element's coordinate system; `rotateY()` rotates around its vertical axis in the common horizontal writing mode. The result depends on the element's transform origin and perspective.

```css
.product-card {
  transform: rotateX(5deg) rotateY(-8deg);
}
```

Small angles are often enough for interface feedback. Large rotations can distort text and reduce readability, particularly when the content itself is the main subject.

### 7. `rotateZ()` and `rotate3d()`

`rotateZ()` is effectively a rotation in the plane around the z-axis. `rotate3d(x, y, z, angle)` specifies a rotation axis vector and an angle.

```css
.badge {
  transform: rotateZ(-4deg);
}

.scene-object {
  transform: rotate3d(1, 1, 0, 12deg);
}
```

Use `rotate3d()` when the axis itself is meaningful and the team can maintain the transform. For simple effects, `rotateX()` and `rotateY()` are often easier to read.

### 8. `transform-style: preserve-3d`

By default, transformed descendants are not necessarily rendered as a shared 3D scene. `transform-style: preserve-3d` allows an element's children to remain positioned in the same 3D space rather than being flattened into its plane.

```css
.card-inner {
  transform-style: preserve-3d;
}
```

This is a key part of layered scenes and card flips. It is not inherited: each relevant intermediate element in the 3D hierarchy may need its own declaration.

**Gotcha:** Adding `preserve-3d` only to the outermost scene may not be enough. Inspect each ancestor between the scene and the 3D faces.

### 9. Flattening and grouping properties

Certain grouping properties can force a transformed element's descendants to be rendered as a flattened group, even when `transform-style: preserve-3d` is specified. Examples can include non-visible overflow values, opacity below `1`, filters, clipping or masking, and some paint-containment or isolation configurations, depending on the exact property and specification behavior.

This is a subtle area: not every property on every element necessarily flattens the same context. When depth disappears, inspect the full ancestor chain and test by temporarily removing grouping properties one at a time.

**Gotcha:** Do not assume that `preserve-3d` overrides every other rendering rule. A parent used for clipping, opacity, or filtering may change how descendants are composited.

### 10. `transform-origin` defines the hinge

The transform origin determines the point around which rotation and scaling occur. The default is the center of the element.

```css
.flip-card__inner {
  transform-origin: center;
}

.flip-card--door .flip-card__inner {
  transform-origin: left center;
}
```

A centered flip and a door-like hinge can use the same rotation with different origins. Use a meaningful origin instead of compensating for a wrong origin with extra translations.

### 11. `transform-origin` can include depth

The third component of `transform-origin` can position the origin along the z-axis.

```css
.layered-card {
  transform-origin: center center -1rem;
}
```

This is useful for specialized pivot effects, but it can be hard to reason about. Start with the default center and add a z-origin only when the visual model needs it.

### 12. `backface-visibility`

When an element rotates away from the viewer, its back face can otherwise be visible. `backface-visibility: hidden` hides the back side when it faces away.

```css
.flip-card__face {
  backface-visibility: hidden;
}
```

For a two-sided flip card, both faces usually need appropriate orientation and backface handling. The front face starts at zero rotation; the back face is rotated by 180 degrees so it faces outward after the inner card flips.

**Gotcha:** Hiding the back face alone does not build a complete flip card. The two faces need a shared 3D context, positioning, correct rotation, and a state that actually changes the inner card's transform.

### 13. A reliable flip-card hierarchy

A common structure uses a perspective scene, an inner rotating object, and two absolutely positioned faces.

```html
<div class="flip-scene">
  <div class="flip-card">
    <section class="flip-card__face flip-card__front">
      Front content
    </section>
    <section class="flip-card__face flip-card__back">
      Back content
    </section>
  </div>
</div>
```

```css
.flip-scene {
  perspective: 900px;
}

.flip-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 500ms ease;
}

.flip-card__face {
  backface-visibility: hidden;
}

.flip-card__front {
  position: relative;
}

.flip-card__back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}
```

A production implementation must define the card's dimensions, a trigger, focus behavior, and how the inactive face is exposed to assistive technology. CSS alone does not provide a complete interaction or semantic state model.

### 14. Transforms do not create layout dimensions

A card rotated in 3D may extend beyond its original layout box, but its transformed projection does not make Grid or Flexbox allocate additional room around the new shape.

Use padding, layout gaps, a wrapper, or intentional overflow space to prevent transformed content from colliding with neighbors. Avoid relying on the visual bounding shape to define the layout.

### 15. `translateZ()` is not a universal z-index replacement

Within a 3D rendering context, depth influences how transformed objects are projected and can affect their visual ordering. Outside that context, ordinary stacking and painting rules still matter. `z-index` and `translateZ()` express different things.

Use `z-index` for the conventional stacking order of positioned or grid/flex items where applicable. Use `translateZ()` when an object genuinely belongs at a depth in a 3D scene.

**Gotcha:** A large positive `translateZ()` does not guarantee that an element will appear above every unrelated element on the page. Stacking contexts, clipping, and scene boundaries still apply.

### 16. `perspective-origin` controls the vanishing point

`perspective-origin` changes the viewer's apparent position relative to the scene, controlling where the perspective projection seems to converge.

```css
.scene {
  perspective: 900px;
  perspective-origin: 50% 35%;
}
```

The default is centered. Small shifts can make a scene feel as if it is viewed from slightly above, below, or from one side. Large offsets can make the projection look skewed.

### 17. `transform-box` and transform reference boxes

Some transform calculations depend on the reference box used for the element. `transform-box` can choose a reference box such as the border box or fill box in contexts where the distinction matters, particularly for SVG elements.

For ordinary HTML cards, the default behavior is often sufficient. For SVG icons and shapes, check the reference box when a transform origin behaves unexpectedly.

### 18. `will-change` is not a default optimization

`will-change: transform` can hint that a transform is likely to change, but it may cause the browser to allocate extra resources. It should not be added to every card or every element that has a transform.

```css
.card.is-animating {
  will-change: transform;
}
```

Apply it sparingly, only when profiling or a known interaction justifies it, and remove it when the animation phase ends if practical.

**Gotcha:** A permanent `will-change` on dozens of cards can increase memory and compositing overhead. Start without it and measure the real performance problem.

### 19. Animate transforms instead of layout properties when appropriate

For a tilt or flip, animating `transform` often avoids repeated layout recalculation compared with animating geometry such as `left`, `top`, width, or height. This does not guarantee that every transform animation is free; filters, shadows, large surfaces, and compositing still have costs.

```css
.card {
  transition: transform 250ms ease;
}

.card:hover {
  transform: translateY(-4px) rotateX(2deg);
}
```

Keep motion short and purposeful. Do not use transforms to mask a poor layout or create a constant motion loop with no user benefit.

### 20. Reduced-motion support

Users may request reduced motion at the operating-system level. Honor that preference for large rotations, perspective transitions, parallax, and auto-playing 3D effects.

```css
@media (prefers-reduced-motion: reduce) {
  .card,
  .flip-card {
    transition-duration: 0.01ms;
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
  }
}
```

Depending on the effect, removing the transform transition entirely may be clearer than reducing its duration. Ensure the state change remains understandable without motion.

**Gotcha:** Reduced motion should not leave the interface in a state where content is inaccessible or where a flip is the only way to reveal essential information.

### 21. Hover is not an interaction model for every device

A tilt triggered only by `:hover` may be unavailable on touch devices and can be awkward for users who magnify content or use alternative input. Treat hover effects as enhancement, not as the only way to access information or functionality.

Use semantic buttons for actions and maintain a clear non-hover state. For purely decorative tilt, the base card should still be readable and usable without the effect.

### 22. Focus-visible and keyboard interaction

If a 3D card is interactive, it needs a semantic trigger and visible keyboard focus. Avoid attaching essential behavior to a generic `div` with hover styles only.

```css
.flip-trigger:focus-visible {
  outline: 3px solid #245fe8;
  outline-offset: 3px;
}
```

The focus indicator should remain visible during transforms and must not be clipped by an ancestor. A button can trigger the state change, while the content faces should have a clear, accessible state model.

### 23. Semantic and accessible flip-card content

If a flip reveals essential content, do not make a visual rotation the only way to reach it. A button can toggle a state, update an accessible label, and expose the relevant content in a predictable reading order. The inactive face should not remain focusable if it is visually hidden and not meant to be interacted with.

A CSS-only `:hover` or `:focus-within` flip can be useful for a demonstration, but production functionality usually benefits from an explicit state model in the application layer.

**Gotcha:** `backface-visibility: hidden` is a rendering instruction, not an accessibility instruction. It does not automatically remove the hidden face's links or controls from keyboard navigation.

### 24. Perspective can distort readable text

A card with a strong rotation can make its text narrow, slanted, or hard to read. Keep the rotation subtle, and consider animating a decorative wrapper rather than the main text-bearing surface when legibility is critical.

Do not put long-form reading content on a surface that spends meaningful time at a severe angle. Depth should be an accent rather than a barrier.

### 25. Layered depth for a product card

A product image, shadow layer, and foreground content can use small z translations to suggest separation. Keep the scene simple and avoid creating a separate 3D context for every tiny decorative element.

```css
.product-scene {
  perspective: 1000px;
}

.product-card {
  transform-style: preserve-3d;
}

.product-card__image {
  transform: translateZ(1.25rem);
}

.product-card__details {
  transform: translateZ(0.5rem);
}
```

Ensure each layer's stacking and clipping behavior is intentional. A `box-shadow` can often communicate elevation more simply than extra 3D transforms.

### 26. Parallax effects need restraint

Parallax creates an impression of depth by moving layers at different rates. CSS can create static depth layers and some scroll-driven effects, while pointer-following parallax often uses JavaScript to update transforms. Keep the movement small and avoid making content follow the pointer in a way that distracts from reading.

If using script-driven motion, throttle or schedule updates appropriately, avoid layout reads and writes in a tight loop, and provide a reduced-motion alternative. Never require parallax to reveal information.

### 27. Clipping, overflow, and 3D scenes

`overflow` and clipping can interact with 3D descendants in ways that flatten or clip parts of the scene. A parent may be needed to clip a rounded card, but that same parent can interfere with depth preservation depending on its properties and role in the scene.

A common architecture separates concerns: an outer visual wrapper handles the border radius and clipping, while an inner scene manages transforms. Validate the exact structure in target browsers instead of assuming all overflow values behave the same way.

### 28. Shadows and 3D are complementary

A subtle shadow can communicate elevation without requiring complex geometry. Combining a small transform with a restrained shadow often looks more natural than using extreme perspective.

```css
.card {
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 12%);
  transition: transform 220ms ease, box-shadow 220ms ease;
}

.card:hover {
  transform: translateY(-3px) rotateX(1deg);
  box-shadow: 0 0.9rem 2rem rgb(0 0 0 / 16%);
}
```

Shadow animation can have different rendering costs than transform animation, so profile complex or large effects. Avoid huge blurred shadows across many moving elements.

### 29. Debug a disappearing back face

When the back face disappears, check the scene hierarchy, `transform-style`, face positions, `rotateY(180deg)`, and `backface-visibility`. Confirm that the inner card actually reaches the intended rotation and that no ancestor unexpectedly flattens or clips the scene.

Temporarily remove opacity, filters, clipping, and overflow rules one by one to isolate the cause. Then restore only the properties that are required and choose a structure that preserves the intended 3D context.

### 30. Test 3D as a complete interaction

A 3D effect is not complete when it looks correct in one resting screenshot. Test the start state, transition, end state, keyboard focus, touch interaction, reduced-motion mode, zoom, content overflow, and target browsers.

Use devtools to inspect computed transforms and animation timing. When debugging matrices, reduce the transform to a single operation, verify the origin and perspective, then add one operation at a time.

**Gotcha:** A visually impressive animation can still be a poor component if the content is unreadable mid-transition, the inactive face remains focusable, or the reduced-motion state loses the intended meaning.

---

## Reusable Patterns

### Pattern 1: Subtle perspective tilt

```css
.tilt-scene {
  perspective: 1000px;
}

.tilt-card {
  transition: transform 220ms ease;
  transform: rotateX(0) rotateY(0);
}

.tilt-card:hover {
  transform: rotateX(2deg) rotateY(-3deg) translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .tilt-card {
    transition: none;
  }

  .tilt-card:hover {
    transform: none;
  }
}
```

Use for a small visual response on a decorative or non-critical card. Keep the card useful without hover.

### Pattern 2: Two-sided flip card

```css
.flip-scene {
  perspective: 900px;
}

.flip-card {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 500ms ease;
}

.flip-card.is-flipped {
  transform: rotateY(180deg);
}

.flip-card__face {
  backface-visibility: hidden;
}

.flip-card__front {
  position: relative;
}

.flip-card__back {
  position: absolute;
  inset: 0;
  transform: rotateY(180deg);
}
```

The application must manage `.is-flipped` through an accessible trigger and ensure inactive-face content is not improperly focusable. Define a stable card height or aspect ratio appropriate to the content.

### Pattern 3: Door hinge rotation

```css
.door-scene {
  perspective: 1000px;
}

.door {
  transform-origin: left center;
  transition: transform 400ms ease;
}

.door.is-open {
  transform: rotateY(-65deg);
}
```

Use when a hinge-like metaphor genuinely helps. Check overlap, clipping, and whether the content remains visible after opening.

### Pattern 4: Layered product scene

```css
.product-scene {
  perspective: 1100px;
}

.product-card {
  transform-style: preserve-3d;
}

.product-card__image {
  transform: translateZ(1rem);
}

.product-card__badge {
  transform: translateZ(1.75rem);
}
```

Use sparingly for a product presentation. Keep text layers readable and ensure the 3D depth does not interfere with focus or pointer targeting.

### Pattern 5: Perspective-origin adjustment

```css
.scene {
  perspective: 900px;
  perspective-origin: 50% 35%;
}
```

Use to tune the viewer's apparent position. Change one axis at a time and keep the origin near the scene unless a dramatic perspective is intentional.

### Pattern 6: Shared 3D context

```css
.scene {
  perspective: 900px;
}

.scene__object {
  transform-style: preserve-3d;
}

.scene__layer {
  position: relative;
}

.scene__layer--front {
  transform: translateZ(1rem);
}

.scene__layer--back {
  transform: translateZ(-1rem);
}
```

Use for multiple layers that should share depth. Check intermediate ancestors for properties that flatten or clip the scene.

### Pattern 7: Accessible flip trigger styling

```html
<button class="flip-trigger" type="button" aria-pressed="false">
  Show details
</button>
```

```css
.flip-trigger:focus-visible {
  outline: 3px solid var(--focus-ring, #245fe8);
  outline-offset: 3px;
}
```

The application should update the state and label or accessible name consistently. Keep the revealed content available in a predictable reading order.

### Pattern 8: Reduced-motion fallback

```css
.depth-card {
  transition: transform 350ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .depth-card {
    transition: none;
    transform: none;
  }
}
```

Use when the depth motion is decorative. For an interaction whose state must be communicated, provide a non-motion state change such as a label, border, or content update.

### Pattern 9: Transform origin as a pivot

```css
.pivot-card {
  transform-origin: 50% 100%;
  transition: transform 300ms ease;
}

.pivot-card:hover {
  transform: rotateX(4deg);
}
```

Use when the effect should feel anchored to a base edge. Avoid compensating for a bad pivot with repeated arbitrary translations.

### Pattern 10: Clip shell around a 3D scene

```css
.card-shell {
  border-radius: 1rem;
  overflow: hidden;
}

.card-shell__scene {
  perspective: 1000px;
}

.card-shell__inner {
  transform-style: preserve-3d;
}
```

This separation can help organize clipping and 3D responsibilities, but clipping behavior must be verified for the specific hierarchy and browser. If depth unexpectedly disappears, test a version without the clipping wrapper to isolate the interaction.

### Pattern 11: Transform-only entrance accent

```css
.reveal-card {
  opacity: 1;
  transform: translateY(0) rotateX(0);
  animation: reveal-card 450ms ease both;
}

@keyframes reveal-card {
  from {
    opacity: 0;
    transform: translateY(0.75rem) rotateX(4deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal-card {
    animation: none;
  }
}
```

Use only when the entrance animation adds clarity rather than delay. Avoid animating large groups of content simultaneously.

### Pattern 12: Debug a transform incrementally

```css
.debug-object {
  transform: translateZ(0);
}

/* Add one transform at a time while inspecting the result. */
.debug-object.is-rotated {
  transform: rotateY(10deg);
}
```

Use a simplified transform to isolate whether the issue comes from perspective, transform order, origin, flattening, or clipping. Remove the debug state before release.

---

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Treating transforms as layout | Transformed elements keep their normal flow footprint | Fix spacing and sizing with layout properties |
| Using an extremely small perspective value | Produces exaggerated distortion | Tune perspective relative to object size and angle |
| Confusing the perspective property with the function | They apply perspective at different levels and transform composition differs | Use parent perspective for a shared scene and the function for an intentional local transform |
| Rearranging transform functions randomly | Transform order changes the coordinate relationship | Add one transform at a time and verify the intended coordinate system |
| Adding `preserve-3d` only to the outer scene | Intermediate elements may flatten descendants | Inspect and configure the relevant 3D hierarchy |
| Assuming `preserve-3d` overrides all grouping properties | Clipping, opacity, filters, and other grouping behavior can flatten or alter the scene | Test ancestor properties one by one |
| Forgetting `backface-visibility: hidden` | The reverse side of a face can show through during rotation | Apply appropriate backface handling to both faces |
| Rotating the back face without rotating the inner card | The card may not reveal the intended face | Use a shared rotating inner element and a correctly oriented back face |
| Using `z-index` as a depth coordinate | Stacking contexts and 3D depth are different mechanisms | Use `z-index` for stacking and `translateZ()` for scene depth |
| Assuming a large `translateZ()` wins across the page | Scene boundaries, stacking contexts, and clipping still apply | Keep depth relationships within a defined scene |
| Forgetting transform origin | Rotation pivots around an unexpected point | Choose a meaningful `transform-origin` |
| Compensating for a wrong origin with many offsets | Creates brittle transforms | Fix the pivot first, then add necessary movement |
| Using severe tilt on text-heavy content | Text becomes distorted and harder to read | Keep angles subtle or transform a decorative wrapper |
| Making hover the only trigger | Touch and alternative input users may not receive the effect | Preserve a useful base state and use semantic controls for actions |
| Hiding essential content on the reverse face only | The content may be unavailable or awkward for keyboard and screen-reader users | Provide a clear accessible state model and predictable content order |
| Assuming backface visibility removes hidden controls from tab order | It affects rendering, not keyboard focus | Manage inactive-face focusability in the interaction layer |
| Forgetting reduced motion | Rotations and parallax can cause discomfort | Respect `prefers-reduced-motion` and preserve meaning without motion |
| Setting `will-change` on every card | Can consume extra memory and compositing resources | Use only when justified by profiling or a specific interaction |
| Assuming every transform animation is free | Large layers, shadows, filters, and compositing still cost resources | Profile the actual scene on target devices |
| Animating layout geometry for a simple tilt | Can trigger layout work unnecessarily | Prefer transform for visual movement where appropriate |
| Using a permanent high-frequency parallax loop | Distracts users and consumes resources | Keep movement restrained and event-driven, with a reduced-motion alternative |
| Clipping the scene without testing | The 3D object may be cut off or flattened | Separate clipping and scene responsibilities and validate the hierarchy |
| Assuming shadows and depth are interchangeable | A shadow can communicate elevation more simply and clearly | Use the simplest visual technique that achieves the intent |
| Ignoring mobile pointer behavior | Hover states may be sticky or unavailable | Test touch behavior and avoid hover-only functionality |
| Using generic `div` elements as interactive flip controls | Native keyboard and accessibility behavior is missing | Use a semantic button or other appropriate control |
| Omitting focus styling | Keyboard users cannot reliably identify the active control | Use visible `:focus-visible` styling |
| Letting a focus outline be clipped | Focus may be hard to see at scene edges | Inspect ancestor overflow and outline offsets |
| Applying `perspective-origin` without a goal | The scene can look skewed or unintentionally off-center | Adjust one axis at a time and verify the visual model |
| Forgetting SVG transform reference boxes | SVG origins can behave differently than expected | Inspect `transform-box` and the element's reference box |
| Using 3D for every card | The interface becomes visually noisy | Reserve depth for meaningful hierarchy or feedback |
| Relying on a screenshot for validation | The animation, focus state, and end state may still fail | Test all interaction states and input methods |
| Adding random transforms to fix overlap | It hides the real layout problem | Use Grid/Flexbox for layout and transforms for visual effects |
| Leaving debug transforms in production | Temporary rules create unexplained behavior | Remove debug states and document intentional transforms |
| Ignoring browser differences | Perspective, flattening, and compositing can vary | Test the supported browser matrix |
| Using an animated flip without an accessible trigger | Users may not discover the action or understand state | Provide a labelled button and communicate the current state |
| Allowing both faces' links to remain focusable while one is hidden | Keyboard focus can enter visually hidden content | Manage hidden-face interaction state explicitly |
| Forgetting the initial state | A flip can start in the wrong orientation or expose the wrong face | Define front and back transforms explicitly |
| Making the animation too slow | The interface feels blocked while the user waits | Keep transitions purposeful and reasonably brief |
| Using 3D motion to reveal required information with no alternative | Reduced-motion users may lose access to content | Keep content accessible without relying on animation |
| Overusing opacity to hide the inactive face | Opacity can interact with compositing and flattening | Prefer correct face orientation and backface handling, then verify the scene |
| Treating a transform as a security or visibility boundary | Transforms are presentation, not access control | Control actual content state and authorization in the application |

---

## Mental Models

1. **A 3D scene has a hierarchy.** Perspective belongs to a viewing context, while transformed children define objects and layers.
2. **Transforms paint; layout allocates space.** A visual projection does not automatically change the surrounding layout.
3. **Perspective controls the camera-like projection.** Smaller values exaggerate depth; larger values flatten the effect.
4. **Transform order matters.** Coordinate operations compose in sequence, so one reordered function can change the entire motion.
5. **Depth and stacking are related but not identical.** `translateZ()` belongs to a 3D scene; `z-index` controls stacking relationships in CSS contexts.
6. **Preserving 3D is a chain, not a magic flag.** Intermediate ancestors and grouping properties can change how depth is rendered.
7. **A flip card is a structure plus a state model.** Perspective, faces, rotation, backface handling, and accessible interaction all matter.
8. **The transform origin is the hinge.** Choose the pivot that matches the physical metaphor.
9. **Visual hiding is not semantic hiding.** Backface rendering does not manage keyboard focus or assistive-technology exposure.
10. **Motion is optional; information is not.** Essential content must remain understandable when motion is reduced or unavailable.
11. **Native controls beat hover-only tricks.** Use semantic buttons for actions and retain a clear default state.
12. **Depth should clarify hierarchy.** If a 3D effect competes with the content, simplify or remove it.
13. **Performance must be measured.** Transforms are often efficient, but not automatically free.
14. **Clipping and perspective must be tested together.** The element that rounds a card can alter how its scene is painted.
15. **Debug from simple to complex.** Verify perspective, origin, and one transform before restoring the full effect.
16. **A stable fallback is part of the design.** The interface should remain useful when the animation or 3D styling is absent.
17. **The browser's rendering rules are part of the implementation.** Test the hierarchy, not just the individual CSS declaration.
18. **The best effect is the smallest one that communicates intent.** Use 3D as an accent rather than an end in itself.

---

## Quick Reference

| Need | Starting point |
|---|---|
| Establish a shared perspective | `perspective: 900px` on a scene parent |
| Shift the apparent viewing point | `perspective-origin: 50% 35%` |
| Preserve a shared child depth context | `transform-style: preserve-3d` |
| Move an element along the z-axis | `translateZ(1rem)` |
| Tilt around horizontal or vertical axes | `rotateX(3deg)` / `rotateY(5deg)` |
| Set a rotation hinge | `transform-origin: left center` |
| Hide a face when turned away | `backface-visibility: hidden` |
| Flip the inner card | `transform: rotateY(180deg)` |
| Show keyboard focus | `:focus-visible` |
| Respect reduced-motion preference | `@media (prefers-reduced-motion: reduce)` |
| Avoid unnecessary optimization hints | Add `will-change` only when justified |
| Debug a missing depth effect | Inspect ancestors, `preserve-3d`, clipping, opacity, filters, and transform order |
| Prevent layout collisions | Use layout spacing and wrappers, not transforms alone |
| Keep the scene readable | Reduce angles and keep content available without motion |

### Minimal 3D scene

```html
<div class="scene">
  <div class="object">Depth</div>
</div>
```

```css
.scene {
  perspective: 900px;
}

.object {
  transform: rotateY(12deg);
  transform-style: preserve-3d;
}
```

This is a starting point, not a complete interactive component. Add a semantic structure, dimensions, state handling, focus treatment, and reduced-motion behavior where the effect requires them.

---

## Build Challenge

### Project: Accessible product card with a 3D detail reveal

Build a product or portfolio card that has a restrained perspective effect and a second state that reveals additional details. The effect must remain understandable and operable without hover or motion.

#### Requirements

1. Use semantic HTML for the card's content and actions.
2. Establish a clear scene wrapper and inner transform element.
3. Define perspective on the intended parent or explain why the perspective function is appropriate.
4. Keep the default state readable and useful.
5. Use a restrained tilt angle.
6. Explain how perspective strength affects the visual result.
7. Define `transform-origin` deliberately.
8. Use `transform-style: preserve-3d` only where the hierarchy needs it.
9. Check every intermediate ancestor for flattening behavior.
10. Define the front face's initial orientation.
11. Define the back face's orientation if implementing a flip.
12. Apply `backface-visibility` appropriately to the faces.
13. Give the card a stable size or a content-driven sizing strategy.
14. Ensure transforms do not create layout collisions.
15. Use Grid or Flexbox for layout relationships rather than transforms.
16. Use a semantic button for the reveal action.
17. Provide a meaningful accessible label or state description.
18. Ensure the inactive face's controls cannot receive inappropriate keyboard focus.
19. Preserve logical DOM reading order.
20. Use `:focus-visible` to style the interactive trigger.
21. Ensure focus styling is not clipped by an ancestor.
22. Respect `prefers-reduced-motion`.
23. Keep the content understandable when the transition is removed.
24. Avoid making hover the only way to reveal essential content.
25. Test the card with mouse, keyboard, and touch input.
26. Test long titles and descriptions.
27. Test narrow viewport widths and enlarged zoom.
28. Check that the transformed object does not unexpectedly cover adjacent controls.
29. Check clipping and rounded corners with the full 3D hierarchy.
30. Verify the back face does not appear mirrored or show through the front face.
31. Check that the card's state remains correct after repeated toggles.
32. Avoid adding `will-change` without a measured reason.
33. Profile if the effect is used across a large grid of cards.
34. Keep shadows restrained and avoid expensive decorative effects without purpose.
35. Test the effect in the supported browser matrix.
36. Verify that the non-3D fallback remains functional.
37. Document any browser-specific behavior found during testing.
38. Remove temporary debug transforms and outlines.
39. Explain the difference between visual depth and `z-index`.
40. Explain one flattening issue you tested and how you isolated it.
41. Explain why the effect improves the interface rather than merely decorating it.
42. Verify that the component is usable when reduced motion is enabled.
43. Ensure the action is discoverable in the initial state.
44. Keep animation duration short enough not to block use.
45. Confirm that text remains readable during and after the transition.
46. Check whether a simpler 2D transform or shadow would achieve the same goal.
47. Document the intended trigger, state, and end state.
48. Confirm that hidden visual faces do not expose hidden interactive content.
49. Verify the layout remains stable while the transform changes.
50. Record the browsers, input methods, and accessibility settings used for final testing.

### Acceptance checklist

- [ ] The effect has a clear visual purpose.
- [ ] Perspective, transform origin, and transform order are intentional.
- [ ] The 3D hierarchy preserves depth where required.
- [ ] Both faces render correctly in the flip state.
- [ ] Essential content is available without hover or motion.
- [ ] Keyboard focus and inactive-face focus behavior are correct.
- [ ] Reduced-motion preferences are respected.
- [ ] The layout remains stable despite transformed geometry.
- [ ] The card works on touch devices and narrow viewports.
- [ ] The effect has been tested in supported browsers and has a usable fallback.

### Suggested review questions

1. Which element establishes the perspective and why?
2. Which element rotates, and which elements are the faces?
3. What does `transform-style: preserve-3d` do in this hierarchy?
4. Which ancestor properties could flatten or clip the scene?
5. How did you choose the transform origin?
6. What is the difference between `translateZ()` and `z-index` here?
7. How is the flip triggered with a keyboard?
8. How is the inactive face prevented from receiving inappropriate focus?
9. What changes under reduced-motion settings?
10. Would a 2D transform or shadow provide the same benefit with less complexity?

---

## Final Principles

- Design the 3D hierarchy before tuning the animation.
- Use perspective to create a coherent scene, not as a random visual filter.
- Keep transforms separate from layout responsibilities.
- Treat transform order and origin as intentional geometry.
- Inspect every ancestor when depth unexpectedly flattens or clips.
- Use `backface-visibility` as a rendering rule, not as accessibility management.
- Provide semantic triggers and predictable states for interactive effects.
- Respect reduced motion and keep essential content available without animation.
- Use `will-change` sparingly and profile real performance problems.
- Prefer restrained depth that clarifies content over dramatic motion that competes with it.
