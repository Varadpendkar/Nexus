# SKILL: clip-path-animation
**Layer:** 13 — Advanced Animation
**Goal:** Reveal and transform interface regions with clip-path while preserving readable content, compositing efficiency, and fallbacks.

---

## Why This Matters (Senior Perspective)

Clip Path Animation is where a visually polished interaction either feels intentional or exposes implementation shortcuts. In production, a weak implementation can lose input during a drag, leave a panel half-visible after navigation, consume frames on a low-powered phone, or strand keyboard focus in content that has visually disappeared. Those are not cosmetic defects: they affect task completion, accessibility, and client confidence. A portfolio interaction is judged while a person scrolls, resizes, interrupts it, and uses a trackpad or touchscreen—not only in the designer’s ideal recording.

A junior often starts by choosing an animation value and adjusting it until one happy-path demo looks right. A senior starts with the state model, rendering cost, interruption policy, and a measurable definition of completion. The right question is not “Can this move?” but “What happens if the target changes halfway through, the tab sleeps, reduced motion is enabled, or the component unmounts?” That framing prevents timing hacks and makes the behavior testable.

For creative portfolio and client work, clip path animation should support the story rather than compete with it. A project reveal must keep titles readable; a navigation transition must not delay access to the destination; a gesture must still work on touch devices; and the fallback must preserve the content when animation is unsupported or disabled. Treat motion as part of the interface contract, document the trade-offs, and test the real component at mobile sizes before polishing the curve.

---

## Core Concepts

### 1. Basic inset and polygon

Treat basic inset and polygon as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing basic inset and polygon in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Basic inset and polygon can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 2. Coordinate systems

Treat coordinate systems as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing coordinate systems in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Coordinate systems can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 3. Circle reveals

Treat circle reveals as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing circle reveals in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Circle reveals can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 4. Polygon point matching

Treat polygon point matching as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing polygon point matching in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Polygon point matching can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 5. Shape interpolation

Treat shape interpolation as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing shape interpolation in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Shape interpolation can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 6. Clipping versus masking

Treat clipping versus masking as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing clipping versus masking in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Clipping versus masking can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 7. Overflow interactions

Treat overflow interactions as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing overflow interactions in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Overflow interactions can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 8. Compositing cost

Treat compositing cost as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing compositing cost in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Compositing cost can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 9. Fallback strategy

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Animate only the decorative layer.**

```js
visualLayer.style.willChange = 'clip-path';
// Remove this hint in the animation's finish handler.

```

**Implementation detail — Preserve the image fallback.**

```js
imageElement.classList.add('is-ready');
// The image remains visible when the clip-path animation is unsupported.

```

**Implementation detail — Coordinate the clipping origin.**

```js
const revealFromLeft = { clipPath: 'inset(0 100% 0 0)' };
const revealFully = { clipPath: 'inset(0 0 0 0)' };
```

**Implementation detail — Do not clip focus rings.**

```js
interactiveLink.style.position = 'relative';
// Keep the focusable link outside the clipped artwork wrapper.

```

**Implementation detail — Remove promotion after motion.**

```js
animation.finished.finally(() => {
  visualLayer.style.willChange = 'auto';
});
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: fallback strategy under real interaction

The advanced version of **Fallback strategy** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **animate a simple inset shape**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const revealKeyframes = [
  { clipPath: 'inset(0 100% 0 0)' },
  { clipPath: 'inset(0 0 0 0)' },
];
imageElement.animate(revealKeyframes, { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
```

Use **keep the interactive wrapper stable** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
revealWrapper.style.overflow = 'hidden';
revealImage.style.pointerEvents = 'none';
// Put links and controls outside the clipped visual so hit testing stays predictable.

```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function renderRevealPreference() {
  revealWrapper.classList.toggle('reveal-disabled', reducedMotionQuery.matches);
}
reducedMotionQuery.addEventListener('change', renderRevealPreference);
renderRevealPreference();
```

#### Verification and failure analysis

Test **fallback strategy** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat fallback strategy as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing fallback strategy in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Fallback strategy can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 10. Focus and hit testing

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Animate only the decorative layer.**

```js
visualLayer.style.willChange = 'clip-path';
// Remove this hint in the animation's finish handler.

```

**Implementation detail — Preserve the image fallback.**

```js
imageElement.classList.add('is-ready');
// The image remains visible when the clip-path animation is unsupported.

```

**Implementation detail — Coordinate the clipping origin.**

```js
const revealFromLeft = { clipPath: 'inset(0 100% 0 0)' };
const revealFully = { clipPath: 'inset(0 0 0 0)' };
```

**Implementation detail — Do not clip focus rings.**

```js
interactiveLink.style.position = 'relative';
// Keep the focusable link outside the clipped artwork wrapper.

```

**Implementation detail — Remove promotion after motion.**

```js
animation.finished.finally(() => {
  visualLayer.style.willChange = 'auto';
});
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: focus and hit testing under real interaction

The advanced version of **Focus and hit testing** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **keep the interactive wrapper stable**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
revealWrapper.style.overflow = 'hidden';
revealImage.style.pointerEvents = 'none';
// Put links and controls outside the clipped visual so hit testing stays predictable.

```

Use **provide a no-motion state** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function renderRevealPreference() {
  revealWrapper.classList.toggle('reveal-disabled', reducedMotionQuery.matches);
}
reducedMotionQuery.addEventListener('change', renderRevealPreference);
renderRevealPreference();
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const revealKeyframes = [
  { clipPath: 'inset(0 100% 0 0)' },
  { clipPath: 'inset(0 0 0 0)' },
];
imageElement.animate(revealKeyframes, { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
```

#### Verification and failure analysis

Test **focus and hit testing** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat focus and hit testing as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing focus and hit testing in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Focus and hit testing can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 11. Reduced motion

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Animate only the decorative layer.**

```js
visualLayer.style.willChange = 'clip-path';
// Remove this hint in the animation's finish handler.

```

**Implementation detail — Preserve the image fallback.**

```js
imageElement.classList.add('is-ready');
// The image remains visible when the clip-path animation is unsupported.

```

**Implementation detail — Coordinate the clipping origin.**

```js
const revealFromLeft = { clipPath: 'inset(0 100% 0 0)' };
const revealFully = { clipPath: 'inset(0 0 0 0)' };
```

**Implementation detail — Do not clip focus rings.**

```js
interactiveLink.style.position = 'relative';
// Keep the focusable link outside the clipped artwork wrapper.

```

**Implementation detail — Remove promotion after motion.**

```js
animation.finished.finally(() => {
  visualLayer.style.willChange = 'auto';
});
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: reduced motion under real interaction

The advanced version of **Reduced motion** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **provide a no-motion state**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function renderRevealPreference() {
  revealWrapper.classList.toggle('reveal-disabled', reducedMotionQuery.matches);
}
reducedMotionQuery.addEventListener('change', renderRevealPreference);
renderRevealPreference();
```

Use **animate a simple inset shape** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const revealKeyframes = [
  { clipPath: 'inset(0 100% 0 0)' },
  { clipPath: 'inset(0 0 0 0)' },
];
imageElement.animate(revealKeyframes, { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
revealWrapper.style.overflow = 'hidden';
revealImage.style.pointerEvents = 'none';
// Put links and controls outside the clipped visual so hit testing stays predictable.

```

#### Verification and failure analysis

Test **reduced motion** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat reduced motion as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing reduced motion in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Reduced motion can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 12. Editorial image reveal

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Animate only the decorative layer.**

```js
visualLayer.style.willChange = 'clip-path';
// Remove this hint in the animation's finish handler.

```

**Implementation detail — Preserve the image fallback.**

```js
imageElement.classList.add('is-ready');
// The image remains visible when the clip-path animation is unsupported.

```

**Implementation detail — Coordinate the clipping origin.**

```js
const revealFromLeft = { clipPath: 'inset(0 100% 0 0)' };
const revealFully = { clipPath: 'inset(0 0 0 0)' };
```

**Implementation detail — Do not clip focus rings.**

```js
interactiveLink.style.position = 'relative';
// Keep the focusable link outside the clipped artwork wrapper.

```

**Implementation detail — Remove promotion after motion.**

```js
animation.finished.finally(() => {
  visualLayer.style.willChange = 'auto';
});
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: editorial image reveal under real interaction

The advanced version of **Editorial image reveal** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **animate a simple inset shape**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const revealKeyframes = [
  { clipPath: 'inset(0 100% 0 0)' },
  { clipPath: 'inset(0 0 0 0)' },
];
imageElement.animate(revealKeyframes, { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both' });
```

Use **keep the interactive wrapper stable** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
revealWrapper.style.overflow = 'hidden';
revealImage.style.pointerEvents = 'none';
// Put links and controls outside the clipped visual so hit testing stays predictable.

```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function renderRevealPreference() {
  revealWrapper.classList.toggle('reveal-disabled', reducedMotionQuery.matches);
}
reducedMotionQuery.addEventListener('change', renderRevealPreference);
renderRevealPreference();
```

#### Verification and failure analysis

Test **editorial image reveal** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat editorial image reveal as an explicit design and engineering decision rather than a decorative afterthought.

```css
.editorial-image {
  clip-path: inset(0 100% 0 0);
  animation: reveal-image 700ms cubic-bezier(.16, 1, .3, 1) both;
}
@keyframes reveal-image { to { clip-path: inset(0); } }
```

This pattern is useful when implementing editorial image reveal in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Editorial image reveal can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Small reusable primitive

**What it does:** Applies basic inset and polygon to a reusable component with a defined failure path.

**When to use it:** Use this when a clip path animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function ClipPathAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 2: Interruptible interaction

**What it does:** Applies coordinate systems to a reusable component with a defined failure path.

**When to use it:** Use this when a clip path animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function ClipPathAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 3: Responsive adaptation

**What it does:** Applies circle reveals to a reusable component with a defined failure path.

**When to use it:** Use this when a clip path animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function ClipPathAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 4: Accessible fallback

**What it does:** Applies polygon point matching to a reusable component with a defined failure path.

**When to use it:** Use this when a clip path animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function ClipPathAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 5: Lifecycle-safe integration

**What it does:** Applies shape interpolation to a reusable component with a defined failure path.

**When to use it:** Use this when a clip path animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function ClipPathAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 6: Production profiling

**What it does:** Applies clipping versus masking to a reusable component with a defined failure path.

**When to use it:** Use this when a clip path animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function ClipPathAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Animating the wrong property | The implementation follows the easiest property rather than the rendering pipeline. | Prefer transform or opacity when they express the same visual change; profile unavoidable layout changes. |
| Ignoring interruption | The first demo never changes target mid-flight. | Retarget the active controller and preserve the current rendered value. |
| No reduced-motion path | Motion is treated as decoration outside the accessibility contract. | Read prefers-reduced-motion and switch to an immediate or low-travel state. |
| Missing teardown | The component lifecycle is not connected to the animation loop. | Cancel frame ids, observers, subscriptions, and active controls during cleanup. |
| Assuming a fixed frame rate | Updates are calculated per frame instead of from elapsed time. | Use the animation timestamp and cap unusually large time steps. |
| Unstable list identity | Rendered items are keyed by array position despite insertions and removals. | Use stable domain IDs so exiting and entering elements remain associated with the right item. |
| Animation owns business state | Completion callbacks are the only source of truth for whether content is open. | Update application state first and use animation as a presentation of that state. |
| No touch testing | The interaction is tuned with a mouse only. | Test touch-action, pointer capture, cancellation, and target sizes on a real mobile viewport. |
| Unbounded overshoot | A decorative effect can cross clipping or viewport boundaries. | Clamp presentation values or constrain the animated region to a safe visual range. |
| Focus hidden by visual exit | Opacity reaches zero while focus remains inside the departing subtree. | Move focus to a valid destination before making the exiting subtree inert or unmounted. |
| Duplicate animation loops | A new loop starts without cancelling the previous one. | Keep one owned requestAnimationFrame id and cancel it before replacing the loop. |
| Stale async completion | An old animation callback updates a newer state transition. | Associate each run with an incrementing token and ignore completion from stale tokens. |
| No browser fallback | The design depends on an API or property without an alternate state. | Use feature detection and preserve the final content state when the effect is unavailable. |
| Unmeasured performance | The animation looks smooth on a developer machine but drops frames on mobile. | Record a representative interaction in DevTools Performance and inspect long frames and paint work. |
| Timing without hierarchy | Every child moves at once, making the page feel noisy. | Stagger by reading order and reserve the strongest movement for the primary content. |
| Testing only the happy path | No test covers cancellation, resize, rapid toggling, or reduced motion. | Add deterministic tests for each transition edge and manually verify one real device. |

### Before / After

```css
/* Before: layout work is repeated on every animation frame. */
.feature-panel { transition: width 300ms ease; }
/* After: when visual intent allows it, animate the compositor-friendly transform. */
.feature-panel { transition: transform 300ms ease; }
```

---

## Mental Models

1. **State first** — animation should reflect a real UI state, not replace it.
2. **Motion has ownership** — one controller or timeline should own a given animated value at a time.
3. **Interruptions are normal** — users click again, resize, navigate, and change their minds.
4. **Pixels cost time** — profile layout, paint, and compositing instead of guessing from appearance.
5. **Reduced motion is a design mode** — preserve meaning while changing the delivery.
6. **Completion is a contract** — define when an animation is done and what must happen afterward.
7. **Test the edges** — rapid toggles and background-tab resumes expose the real implementation.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Frame loop | `requestAnimationFrame(callback)` | Use timestamp; cancel on cleanup. |
| Reduced motion | `prefers-reduced-motion: reduce` | Apply to CSS and JavaScript motion. |
| GPU-friendly default | `transform, opacity` | Still verify compositing and layer memory. |
| Pointer tracking | `Pointer Events` | Handle pointercancel and capture. |
| Stable list keys | `Domain identifier` | Do not key animated lists by index. |
| Frame profiling | `DevTools Performance` | Inspect long frames and paint events. |
| Lifecycle | `cleanup / cancel` | Disconnect observers and listeners. |
| Target update | `retarget current controller` | Avoid resetting visible position. |
| Visibility pause | `document.visibilityState` | Resume without huge time deltas. |
| Fallback | `feature detection + final state` | Content must remain usable. |
| Keyboard input | `focus-visible + key handling` | Do not make pointer the only path. |
| Focus management | `move focus before removal` | Visual disappearance is not DOM removal. |
| State machine | `explicit transition map` | Reject invalid events. |
| Testing | `fake clock or controlled progress` | Avoid flaky arbitrary sleeps. |
| CSS timing | `named custom properties` | Use semantic tokens. |
| Animation cleanup | `cancelAnimationFrame` | Prevent orphaned loops. |
| Resize | `ResizeObserver when element-based` | Debounce expensive measurement. |
| Scroll progress | `normalized 0–1 value` | Guard zero-length ranges. |
| Exit completion | `completion event with token` | Ignore stale completion. |
| Large lists | `virtualize or limit active effects` | Avoid animating hundreds of nodes. |
| Touch behavior | `touch-action` | Choose browser gesture ownership. |
| Semantics | `button / nav / article` | Preserve meaningful document structure. |

---

## Build Challenge

### Build: Clip Path Animation — Interactive Portfolio Feature

Build a small portfolio interaction that demonstrates clip path animation under normal use, interruption, mobile constraints, and reduced-motion preferences. The goal is a stable component with a clear visual hierarchy and a testable lifecycle—not a motion-only prototype.

**Requirements**

1. Create a semantic HTML structure for the clip path animation feature.
2. Implement the primary basic inset and polygon behavior using a named state or controller.
3. Add at least two distinct states and explicit transition rules.
4. Handle interruption while motion is in progress without a visible jump.
5. Provide a prefers-reduced-motion path that preserves the final state.
6. Ensure keyboard users can reach and operate the control.
7. Clean up event listeners, observers, and animation loops on teardown.
8. Test the component at 375px, 768px, and 1280px viewport widths.
9. Profile a representative interaction in DevTools Performance and record any long frames.
10. Add a regression test for rapid toggling or cancellation.
11. Demonstrate one failure mode and explain the exact fix in the README.
12. Document the API, state transitions, and known browser fallback.

**Expected output / Definition of Done**

- The interaction reaches the correct final state after normal use, interruption, and rapid repeated input.
- No console errors, orphaned animation frames, or duplicate event handlers remain after unmount.
- Keyboard operation and reduced-motion behavior are verified, not merely described.
- DevTools evidence identifies the main rendering cost and records one optimization or why none was needed.
- The component is responsive and all visible content remains available without animation.
- A reviewer can run the feature locally using the documented steps.

**Suggested focused-session plan:** 15 minutes for state and markup, 25 minutes for core motion, 15 minutes for cancellation and accessibility, 15 minutes for responsive testing, and 10 minutes for profiling and notes.

**Definition of success:** The feature is deterministic, accessible, measurable, and visually coherent on desktop and mobile. A skipped or reduced animation never blocks the underlying task.
