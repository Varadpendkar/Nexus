# SKILL: css-animation-performance
**Layer:** 13 — Advanced Animation
**Goal:** Choose animation properties and rendering strategies that preserve responsiveness and avoid layout, paint, and compositing bottlenecks.

---

## Why This Matters (Senior Perspective)

CSS Animation Performance is where a visually polished interaction either feels intentional or exposes implementation shortcuts. In production, a weak implementation can lose input during a drag, leave a panel half-visible after navigation, consume frames on a low-powered phone, or strand keyboard focus in content that has visually disappeared. Those are not cosmetic defects: they affect task completion, accessibility, and client confidence. A portfolio interaction is judged while a person scrolls, resizes, interrupts it, and uses a trackpad or touchscreen—not only in the designer’s ideal recording.

A junior often starts by choosing an animation value and adjusting it until one happy-path demo looks right. A senior starts with the state model, rendering cost, interruption policy, and a measurable definition of completion. The right question is not “Can this move?” but “What happens if the target changes halfway through, the tab sleeps, reduced motion is enabled, or the component unmounts?” That framing prevents timing hacks and makes the behavior testable.

For creative portfolio and client work, css animation performance should support the story rather than compete with it. A project reveal must keep titles readable; a navigation transition must not delay access to the destination; a gesture must still work on touch devices; and the fallback must preserve the content when animation is unsupported or disabled. Treat motion as part of the interface contract, document the trade-offs, and test the real component at mobile sizes before polishing the curve.

---

## Core Concepts

### 1. Rendering pipeline

Treat rendering pipeline as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing rendering pipeline in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Rendering pipeline can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 2. Transform and opacity

Treat transform and opacity as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing transform and opacity in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Transform and opacity can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 3. Layout-triggering properties

Treat layout-triggering properties as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing layout-triggering properties in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Layout-triggering properties can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 4. Paint-heavy effects

Treat paint-heavy effects as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing paint-heavy effects in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Paint-heavy effects can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 5. Layer promotion

Treat layer promotion as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing layer promotion in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Layer promotion can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 6. will-change discipline

Treat will-change discipline as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing will-change discipline in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** will-change discipline can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 7. Containment

Treat containment as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing containment in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Containment can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 8. Large-list animation

Treat large-list animation as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing large-list animation in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Large-list animation can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 9. Profiling frames

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Avoid animating layout dimensions.**

```js
element.style.transform = `scaleX(${progress})`;
// Transform changes visual size without repeatedly recalculating surrounding layout.

```

**Implementation detail — Profile a real interaction.**

```js
performance.mark('interaction-start');
runAnimation();
requestAnimationFrame(() => performance.mark('interaction-painted'));
```

**Implementation detail — Scope reduced motion narrowly.**

```js
@media (prefers-reduced-motion: reduce) {
  .decorative-parallax { animation: none; transform: none; }
}
```

**Implementation detail — Release GPU hints.**

```js
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
}, { once: true });
```

**Implementation detail — Avoid unnecessary DOM writes.**

```js
if (nextTransform !== previousTransform) {
  element.style.transform = nextTransform;
  previousTransform = nextTransform;
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: profiling frames under real interaction

The advanced version of **Profiling frames** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **prefer compositor-friendly properties**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
element.animate(
  [{ transform: 'translate3d(0, 16px, 0)', opacity: 0 }, { transform: 'translate3d(0, 0, 0)', opacity: 1 }],
  { duration: 360, easing: 'ease-out', fill: 'both' }
);
```

Use **measure rather than guess** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
performance.mark('reveal-start');
startVisualReveal();
requestAnimationFrame(() => {
  performance.mark('reveal-first-frame');
  performance.measure('reveal-to-frame', 'reveal-start', 'reveal-first-frame');
});
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
function beginMotion() { animatedElement.classList.add('is-animating'); }
function endMotion() { animatedElement.classList.remove('is-animating'); }
// CSS applies will-change only while work is imminent, not to every card forever.

```

#### Verification and failure analysis

Test **profiling frames** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat profiling frames as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing profiling frames in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Profiling frames can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 10. Memory and layers

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Avoid animating layout dimensions.**

```js
element.style.transform = `scaleX(${progress})`;
// Transform changes visual size without repeatedly recalculating surrounding layout.

```

**Implementation detail — Profile a real interaction.**

```js
performance.mark('interaction-start');
runAnimation();
requestAnimationFrame(() => performance.mark('interaction-painted'));
```

**Implementation detail — Scope reduced motion narrowly.**

```js
@media (prefers-reduced-motion: reduce) {
  .decorative-parallax { animation: none; transform: none; }
}
```

**Implementation detail — Release GPU hints.**

```js
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
}, { once: true });
```

**Implementation detail — Avoid unnecessary DOM writes.**

```js
if (nextTransform !== previousTransform) {
  element.style.transform = nextTransform;
  previousTransform = nextTransform;
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: memory and layers under real interaction

The advanced version of **Memory and layers** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **measure rather than guess**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
performance.mark('reveal-start');
startVisualReveal();
requestAnimationFrame(() => {
  performance.mark('reveal-first-frame');
  performance.measure('reveal-to-frame', 'reveal-start', 'reveal-first-frame');
});
```

Use **avoid permanent layer promotion** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
function beginMotion() { animatedElement.classList.add('is-animating'); }
function endMotion() { animatedElement.classList.remove('is-animating'); }
// CSS applies will-change only while work is imminent, not to every card forever.

```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
element.animate(
  [{ transform: 'translate3d(0, 16px, 0)', opacity: 0 }, { transform: 'translate3d(0, 0, 0)', opacity: 1 }],
  { duration: 360, easing: 'ease-out', fill: 'both' }
);
```

#### Verification and failure analysis

Test **memory and layers** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat memory and layers as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing memory and layers in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Memory and layers can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 11. Reduced motion

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Avoid animating layout dimensions.**

```js
element.style.transform = `scaleX(${progress})`;
// Transform changes visual size without repeatedly recalculating surrounding layout.

```

**Implementation detail — Profile a real interaction.**

```js
performance.mark('interaction-start');
runAnimation();
requestAnimationFrame(() => performance.mark('interaction-painted'));
```

**Implementation detail — Scope reduced motion narrowly.**

```js
@media (prefers-reduced-motion: reduce) {
  .decorative-parallax { animation: none; transform: none; }
}
```

**Implementation detail — Release GPU hints.**

```js
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
}, { once: true });
```

**Implementation detail — Avoid unnecessary DOM writes.**

```js
if (nextTransform !== previousTransform) {
  element.style.transform = nextTransform;
  previousTransform = nextTransform;
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: reduced motion under real interaction

The advanced version of **Reduced motion** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **avoid permanent layer promotion**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
function beginMotion() { animatedElement.classList.add('is-animating'); }
function endMotion() { animatedElement.classList.remove('is-animating'); }
// CSS applies will-change only while work is imminent, not to every card forever.

```

Use **prefer compositor-friendly properties** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
element.animate(
  [{ transform: 'translate3d(0, 16px, 0)', opacity: 0 }, { transform: 'translate3d(0, 0, 0)', opacity: 1 }],
  { duration: 360, easing: 'ease-out', fill: 'both' }
);
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
performance.mark('reveal-start');
startVisualReveal();
requestAnimationFrame(() => {
  performance.mark('reveal-first-frame');
  performance.measure('reveal-to-frame', 'reveal-start', 'reveal-first-frame');
});
```

#### Verification and failure analysis

Test **reduced motion** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat reduced motion as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing reduced motion in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Reduced motion can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 12. Performance audit

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Avoid animating layout dimensions.**

```js
element.style.transform = `scaleX(${progress})`;
// Transform changes visual size without repeatedly recalculating surrounding layout.

```

**Implementation detail — Profile a real interaction.**

```js
performance.mark('interaction-start');
runAnimation();
requestAnimationFrame(() => performance.mark('interaction-painted'));
```

**Implementation detail — Scope reduced motion narrowly.**

```js
@media (prefers-reduced-motion: reduce) {
  .decorative-parallax { animation: none; transform: none; }
}
```

**Implementation detail — Release GPU hints.**

```js
element.addEventListener('transitionend', () => {
  element.style.willChange = 'auto';
}, { once: true });
```

**Implementation detail — Avoid unnecessary DOM writes.**

```js
if (nextTransform !== previousTransform) {
  element.style.transform = nextTransform;
  previousTransform = nextTransform;
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: performance audit under real interaction

The advanced version of **Performance audit** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **prefer compositor-friendly properties**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
element.animate(
  [{ transform: 'translate3d(0, 16px, 0)', opacity: 0 }, { transform: 'translate3d(0, 0, 0)', opacity: 1 }],
  { duration: 360, easing: 'ease-out', fill: 'both' }
);
```

Use **measure rather than guess** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
performance.mark('reveal-start');
startVisualReveal();
requestAnimationFrame(() => {
  performance.mark('reveal-first-frame');
  performance.measure('reveal-to-frame', 'reveal-start', 'reveal-first-frame');
});
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
function beginMotion() { animatedElement.classList.add('is-animating'); }
function endMotion() { animatedElement.classList.remove('is-animating'); }
// CSS applies will-change only while work is imminent, not to every card forever.

```

#### Verification and failure analysis

Test **performance audit** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Treat performance audit as an explicit design and engineering decision rather than a decorative afterthought.

```css
.project-card {
  transition: transform 220ms ease, opacity 220ms ease;
}
.project-card:hover { transform: translateY(-4px); } /* Avoid animating width, which would trigger layout. */
```

This pattern is useful when implementing performance audit in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Performance audit can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Small reusable primitive

**What it does:** Applies rendering pipeline to a reusable component with a defined failure path.

**When to use it:** Use this when a css animation performance interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function CssAnimationPerformancePattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 2: Interruptible interaction

**What it does:** Applies transform and opacity to a reusable component with a defined failure path.

**When to use it:** Use this when a css animation performance interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function CssAnimationPerformancePattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 3: Responsive adaptation

**What it does:** Applies layout-triggering properties to a reusable component with a defined failure path.

**When to use it:** Use this when a css animation performance interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function CssAnimationPerformancePattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 4: Accessible fallback

**What it does:** Applies paint-heavy effects to a reusable component with a defined failure path.

**When to use it:** Use this when a css animation performance interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function CssAnimationPerformancePattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 5: Lifecycle-safe integration

**What it does:** Applies layer promotion to a reusable component with a defined failure path.

**When to use it:** Use this when a css animation performance interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function CssAnimationPerformancePattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 6: Production profiling

**What it does:** Applies will-change discipline to a reusable component with a defined failure path.

**When to use it:** Use this when a css animation performance interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function CssAnimationPerformancePattern({ current, target, reducedMotion = false }) {
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

### Build: CSS Animation Performance — Interactive Portfolio Feature

Build a small portfolio interaction that demonstrates css animation performance under normal use, interruption, mobile constraints, and reduced-motion preferences. The goal is a stable component with a clear visual hierarchy and a testable lifecycle—not a motion-only prototype.

**Requirements**

1. Create a semantic HTML structure for the css animation performance feature.
2. Implement the primary rendering pipeline behavior using a named state or controller.
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
