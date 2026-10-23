# SKILL: bezier-curve-craft
**Layer:** 13 — Advanced Animation
**Goal:** Design and diagnose cubic-bezier easing curves by understanding control points, velocity, and perceptual timing.

---

## Why This Matters (Senior Perspective)

Bezier Curve Craft is where a visually polished interaction either feels intentional or exposes implementation shortcuts. In production, a weak implementation can lose input during a drag, leave a panel half-visible after navigation, consume frames on a low-powered phone, or strand keyboard focus in content that has visually disappeared. Those are not cosmetic defects: they affect task completion, accessibility, and client confidence. A portfolio interaction is judged while a person scrolls, resizes, interrupts it, and uses a trackpad or touchscreen—not only in the designer’s ideal recording.

A junior often starts by choosing an animation value and adjusting it until one happy-path demo looks right. A senior starts with the state model, rendering cost, interruption policy, and a measurable definition of completion. The right question is not “Can this move?” but “What happens if the target changes halfway through, the tab sleeps, reduced motion is enabled, or the component unmounts?” That framing prevents timing hacks and makes the behavior testable.

For creative portfolio and client work, bezier curve craft should support the story rather than compete with it. A project reveal must keep titles readable; a navigation transition must not delay access to the destination; a gesture must still work on touch devices; and the fallback must preserve the content when animation is unsupported or disabled. Treat motion as part of the interface contract, document the trade-offs, and test the real component at mobile sizes before polishing the curve.

---

## Core Concepts

### 1. Cubic-bezier coordinates

The first and second points shape outgoing and incoming velocity; x coordinates must remain in the 0–1 range for CSS easing.

```css
transition-timing-function: cubic-bezier(.22, .8, .24, 1);
```

This pattern is useful when implementing cubic-bezier coordinates in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Cubic-bezier coordinates can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 2. Ease-in and acceleration

An ease-in starts slowly and gains speed, useful when an object appears to gather momentum before leaving.

```js
const exitEase = "cubic-bezier(.55, .06, .68, .19)";
```

This pattern is useful when implementing ease-in and acceleration in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Ease-in and acceleration can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 3. Ease-out and arrival

Ease-out starts quickly and decelerates, making it effective for elements arriving into view.

```js
const enterEase = "cubic-bezier(.16, 1, .3, 1)";
```

This pattern is useful when implementing ease-out and arrival in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Ease-out and arrival can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 4. Ease-in-out

Ease-in-out balances acceleration and deceleration when a transition should feel deliberate.

```js
const moveEase = "cubic-bezier(.65, 0, .35, 1)";
```

This pattern is useful when implementing ease-in-out in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Ease-in-out can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 5. Duration and distance

The same curve at different durations or distances produces a different perceived weight.

```css
transition: transform 420ms cubic-bezier(.16, 1, .3, 1);
```

This pattern is useful when implementing duration and distance in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Duration and distance can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 6. CSS and JavaScript parity

A CSS timing function and a JavaScript easing function should describe the same curve if a gesture hands off into an animation.

```css
element.animate([{ transform: "translateX(0)" }, { transform: "translateX(240px)" }], { duration: 420, easing: "cubic-bezier(.16, 1, .3, 1)" });
```

This pattern is useful when implementing css and javascript parity in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** CSS and JavaScript parity can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 7. Overshoot curves

Y control points outside 0–1 can create an overshoot without a physics engine.

```js
const overshoot = "cubic-bezier(.2, 1.35, .4, 1)";
```

This pattern is useful when implementing overshoot curves in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Overshoot curves can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 8. Curve tokens

Named easing tokens prevent inconsistent timing across a portfolio.

```css
:root { --ease-enter: cubic-bezier(.16, 1, .3, 1); --ease-exit: cubic-bezier(.7, 0, .84, 0); }
```

This pattern is useful when implementing curve tokens in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Curve tokens can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 9. Keyframe easing scope

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Keep easing tokens centralized.**

```js
:root {
  --ease-enter: cubic-bezier(.16, 1, .3, 1);
  --ease-exit: cubic-bezier(.7, 0, .84, 0);
}
```

**Implementation detail — Apply one curve to related properties.**

```js
.project-card {
  transition: opacity 420ms var(--ease-enter), transform 420ms var(--ease-enter);
}
```

**Implementation detail — Avoid accidental easing mismatch.**

```js
const durationMs = 420;
card.style.transitionDuration = `${durationMs}ms`;
card.style.transitionTimingFunction = motionCurves.enter;
```

**Implementation detail — Test the curve at the boundary.**

```js
const finalTransform = getComputedStyle(card).transform;
console.assert(finalTransform === 'none' || finalTransform.includes('matrix'));
```

**Implementation detail — Disable nonessential travel.**

```js
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: keyframe easing scope under real interaction

The advanced version of **Keyframe easing scope** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **name semantic easing tokens**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const motionCurves = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  linearProgress: 'linear',
};
```

Use **compare easing at matched durations** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const transition = `transform 480ms ${motionCurves.enter}`;
card.style.transition = transition;
card.style.transform = 'translateY(0)';
// Keep duration constant while comparing curves so the test isolates easing.

```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function applyMotionPreference() {
  document.documentElement.dataset.motion = prefersReducedMotion.matches ? 'reduced' : 'full';
}
prefersReducedMotion.addEventListener('change', applyMotionPreference);
applyMotionPreference();
```

#### Verification and failure analysis

Test **keyframe easing scope** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



CSS easing on an animation applies between keyframes differently from timing on the entire animation.

```css
@keyframes panel-enter { from { transform: translateY(1rem); } to { transform: translateY(0); } }
.panel { animation: panel-enter 360ms var(--ease-enter) both; }
```

This pattern is useful when implementing keyframe easing scope in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Keyframe easing scope can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 10. Inspecting velocity

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Keep easing tokens centralized.**

```js
:root {
  --ease-enter: cubic-bezier(.16, 1, .3, 1);
  --ease-exit: cubic-bezier(.7, 0, .84, 0);
}
```

**Implementation detail — Apply one curve to related properties.**

```js
.project-card {
  transition: opacity 420ms var(--ease-enter), transform 420ms var(--ease-enter);
}
```

**Implementation detail — Avoid accidental easing mismatch.**

```js
const durationMs = 420;
card.style.transitionDuration = `${durationMs}ms`;
card.style.transitionTimingFunction = motionCurves.enter;
```

**Implementation detail — Test the curve at the boundary.**

```js
const finalTransform = getComputedStyle(card).transform;
console.assert(finalTransform === 'none' || finalTransform.includes('matrix'));
```

**Implementation detail — Disable nonessential travel.**

```js
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: inspecting velocity under real interaction

The advanced version of **Inspecting velocity** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **compare easing at matched durations**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const transition = `transform 480ms ${motionCurves.enter}`;
card.style.transition = transition;
card.style.transform = 'translateY(0)';
// Keep duration constant while comparing curves so the test isolates easing.

```

Use **respect reduced motion** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function applyMotionPreference() {
  document.documentElement.dataset.motion = prefersReducedMotion.matches ? 'reduced' : 'full';
}
prefersReducedMotion.addEventListener('change', applyMotionPreference);
applyMotionPreference();
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const motionCurves = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  linearProgress: 'linear',
};
```

#### Verification and failure analysis

Test **inspecting velocity** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



A curve should be judged by its velocity profile as well as its visual path.

```js
// Compare identical distances and durations in a motion test harness.
const samples = [0, .25, .5, .75, 1];
```

This pattern is useful when implementing inspecting velocity in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Inspecting velocity can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 11. Reduced-motion alternatives

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Keep easing tokens centralized.**

```js
:root {
  --ease-enter: cubic-bezier(.16, 1, .3, 1);
  --ease-exit: cubic-bezier(.7, 0, .84, 0);
}
```

**Implementation detail — Apply one curve to related properties.**

```js
.project-card {
  transition: opacity 420ms var(--ease-enter), transform 420ms var(--ease-enter);
}
```

**Implementation detail — Avoid accidental easing mismatch.**

```js
const durationMs = 420;
card.style.transitionDuration = `${durationMs}ms`;
card.style.transitionTimingFunction = motionCurves.enter;
```

**Implementation detail — Test the curve at the boundary.**

```js
const finalTransform = getComputedStyle(card).transform;
console.assert(finalTransform === 'none' || finalTransform.includes('matrix'));
```

**Implementation detail — Disable nonessential travel.**

```js
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: reduced-motion alternatives under real interaction

The advanced version of **Reduced-motion alternatives** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **respect reduced motion**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function applyMotionPreference() {
  document.documentElement.dataset.motion = prefersReducedMotion.matches ? 'reduced' : 'full';
}
prefersReducedMotion.addEventListener('change', applyMotionPreference);
applyMotionPreference();
```

Use **name semantic easing tokens** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const motionCurves = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  linearProgress: 'linear',
};
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const transition = `transform 480ms ${motionCurves.enter}`;
card.style.transition = transition;
card.style.transform = 'translateY(0)';
// Keep duration constant while comparing curves so the test isolates easing.

```

#### Verification and failure analysis

Test **reduced-motion alternatives** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



When motion is reduced, keep the state change clear without insisting on the original easing curve.

```css
@media (prefers-reduced-motion: reduce) { .panel { animation-duration: 1ms; } }
```

This pattern is useful when implementing reduced-motion alternatives in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Reduced-motion alternatives can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 12. Curve system in context

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Keep easing tokens centralized.**

```js
:root {
  --ease-enter: cubic-bezier(.16, 1, .3, 1);
  --ease-exit: cubic-bezier(.7, 0, .84, 0);
}
```

**Implementation detail — Apply one curve to related properties.**

```js
.project-card {
  transition: opacity 420ms var(--ease-enter), transform 420ms var(--ease-enter);
}
```

**Implementation detail — Avoid accidental easing mismatch.**

```js
const durationMs = 420;
card.style.transitionDuration = `${durationMs}ms`;
card.style.transitionTimingFunction = motionCurves.enter;
```

**Implementation detail — Test the curve at the boundary.**

```js
const finalTransform = getComputedStyle(card).transform;
console.assert(finalTransform === 'none' || finalTransform.includes('matrix'));
```

**Implementation detail — Disable nonessential travel.**

```js
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
}
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: curve system in context under real interaction

The advanced version of **Curve system in context** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **name semantic easing tokens**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const motionCurves = {
  enter: 'cubic-bezier(0.16, 1, 0.3, 1)',
  exit: 'cubic-bezier(0.7, 0, 0.84, 0)',
  linearProgress: 'linear',
};
```

Use **compare easing at matched durations** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const transition = `transform 480ms ${motionCurves.enter}`;
card.style.transition = transition;
card.style.transform = 'translateY(0)';
// Keep duration constant while comparing curves so the test isolates easing.

```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
function applyMotionPreference() {
  document.documentElement.dataset.motion = prefersReducedMotion.matches ? 'reduced' : 'full';
}
prefersReducedMotion.addEventListener('change', applyMotionPreference);
applyMotionPreference();
```

#### Verification and failure analysis

Test **curve system in context** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



A polished interface uses a small curve vocabulary for enter, exit, emphasis, and continuous movement.

```js
const easing = { enter: "cubic-bezier(.16, 1, .3, 1)", exit: "cubic-bezier(.7, 0, .84, 0)", move: "cubic-bezier(.65, 0, .35, 1)" };
```

This pattern is useful when implementing curve system in context in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Curve system in context can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Small reusable primitive

**What it does:** Applies cubic-bezier coordinates to a reusable component with a defined failure path.

**When to use it:** Use this when a bezier curve craft interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function BezierCurveCraftPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 2: Interruptible interaction

**What it does:** Applies ease-in and acceleration to a reusable component with a defined failure path.

**When to use it:** Use this when a bezier curve craft interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function BezierCurveCraftPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 3: Responsive adaptation

**What it does:** Applies ease-out and arrival to a reusable component with a defined failure path.

**When to use it:** Use this when a bezier curve craft interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function BezierCurveCraftPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 4: Accessible fallback

**What it does:** Applies ease-in-out to a reusable component with a defined failure path.

**When to use it:** Use this when a bezier curve craft interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function BezierCurveCraftPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 5: Lifecycle-safe integration

**What it does:** Applies duration and distance to a reusable component with a defined failure path.

**When to use it:** Use this when a bezier curve craft interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function BezierCurveCraftPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 6: Production profiling

**What it does:** Applies css and javascript parity to a reusable component with a defined failure path.

**When to use it:** Use this when a bezier curve craft interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function BezierCurveCraftPattern({ current, target, reducedMotion = false }) {
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

### Build: Bezier Curve Craft — Interactive Portfolio Feature

Build a small portfolio interaction that demonstrates bezier curve craft under normal use, interruption, mobile constraints, and reduced-motion preferences. The goal is a stable component with a clear visual hierarchy and a testable lifecycle—not a motion-only prototype.

**Requirements**

1. Create a semantic HTML structure for the bezier curve craft feature.
2. Implement the primary cubic-bezier coordinates behavior using a named state or controller.
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
