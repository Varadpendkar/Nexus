# SKILL: gesture-animation
**Layer:** 13 — Advanced Animation
**Goal:** Map pointer and touch input to continuous visual feedback, then hand off cleanly to a settled state.

---

## Why This Matters (Senior Perspective)

Gesture Animation is where a visually polished interaction either feels intentional or exposes implementation shortcuts. In production, a weak implementation can lose input during a drag, leave a panel half-visible after navigation, consume frames on a low-powered phone, or strand keyboard focus in content that has visually disappeared. Those are not cosmetic defects: they affect task completion, accessibility, and client confidence. A portfolio interaction is judged while a person scrolls, resizes, interrupts it, and uses a trackpad or touchscreen—not only in the designer’s ideal recording.

A junior often starts by choosing an animation value and adjusting it until one happy-path demo looks right. A senior starts with the state model, rendering cost, interruption policy, and a measurable definition of completion. The right question is not “Can this move?” but “What happens if the target changes halfway through, the tab sleeps, reduced motion is enabled, or the component unmounts?” That framing prevents timing hacks and makes the behavior testable.

For creative portfolio and client work, gesture animation should support the story rather than compete with it. A project reveal must keep titles readable; a navigation transition must not delay access to the destination; a gesture must still work on touch devices; and the fallback must preserve the content when animation is unsupported or disabled. Treat motion as part of the interface contract, document the trade-offs, and test the real component at mobile sizes before polishing the curve.

---

## Core Concepts

### 1. Pointer capture

Use pointerdown to establish ownership of the gesture.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing pointer capture in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Pointer capture can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 2. Coordinate spaces

Normalize client coordinates against the element or viewport coordinate space.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing coordinate spaces in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Coordinate spaces can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 3. Drag thresholds

Ignore tiny movement until a deliberate drag threshold is crossed.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing drag thresholds in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Drag thresholds can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 4. Velocity estimation

Estimate velocity from recent samples rather than the entire drag.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing velocity estimation in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Velocity estimation can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 5. Rubber-band resistance

Apply resistance near bounds to communicate a limit without losing control.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing rubber-band resistance in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Rubber-band resistance can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 6. Snap points

Choose snap destinations by projected position and release velocity.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing snap points in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Snap points can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 7. Gesture cancellation

Cancel cleanly when pointercancel or a competing gesture occurs.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing gesture cancellation in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Gesture cancellation can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 8. Touch-action policy

Set touch-action intentionally so the browser and component do not fight.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing touch-action policy in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Touch-action policy can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 9. Nested gestures

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Ignore non-primary mouse buttons.**

```js
if (event.pointerType === 'mouse' && event.button !== 0) return;
```

**Implementation detail — Keep coordinates local to the element.**

```js
const bounds = dragElement.getBoundingClientRect();
const localX = event.clientX - bounds.left;
```

**Implementation detail — Prevent accidental text selection.**

```js
dragElement.classList.add('is-dragging');
dragElement.setAttribute('aria-grabbed', 'true');
```

**Implementation detail — Support cancellation as release.**

```js
dragElement.addEventListener('pointercancel', finishPointer);
dragElement.addEventListener('lostpointercapture', finishPointer);
```

**Implementation detail — Provide keyboard movement.**

```js
if (event.key === 'ArrowRight') setPosition(position + keyboardStep);
if (event.key === 'ArrowLeft') setPosition(position - keyboardStep);
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: nested gestures under real interaction

The advanced version of **Nested gestures** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **capture one active pointer**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
function beginDrag(event) {
  if (activePointerId !== null) return; // Ignore competing pointers for this single-pointer control.
  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture(event.pointerId);
  lastClientX = event.clientX;
}
```

Use **project release velocity** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const elapsedMs = Math.max(1, event.timeStamp - previousSampleTime);
const velocityX = (event.clientX - previousClientX) / elapsedMs;
const projectedX = currentX + velocityX * 180;
const destination = projectedX > dismissThreshold ? panelWidth : 0;
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
function finishPointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  dragElement.classList.remove('is-dragging');
  // pointercancel and lostpointercapture must use this same cleanup path.
}
```

#### Verification and failure analysis

Test **nested gestures** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Define which nested component owns a drag before adding listeners.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing nested gestures in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Nested gestures can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 10. Keyboard parity

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Ignore non-primary mouse buttons.**

```js
if (event.pointerType === 'mouse' && event.button !== 0) return;
```

**Implementation detail — Keep coordinates local to the element.**

```js
const bounds = dragElement.getBoundingClientRect();
const localX = event.clientX - bounds.left;
```

**Implementation detail — Prevent accidental text selection.**

```js
dragElement.classList.add('is-dragging');
dragElement.setAttribute('aria-grabbed', 'true');
```

**Implementation detail — Support cancellation as release.**

```js
dragElement.addEventListener('pointercancel', finishPointer);
dragElement.addEventListener('lostpointercapture', finishPointer);
```

**Implementation detail — Provide keyboard movement.**

```js
if (event.key === 'ArrowRight') setPosition(position + keyboardStep);
if (event.key === 'ArrowLeft') setPosition(position - keyboardStep);
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: keyboard parity under real interaction

The advanced version of **Keyboard parity** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **project release velocity**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
const elapsedMs = Math.max(1, event.timeStamp - previousSampleTime);
const velocityX = (event.clientX - previousClientX) / elapsedMs;
const projectedX = currentX + velocityX * 180;
const destination = projectedX > dismissThreshold ? panelWidth : 0;
```

Use **clear pointer state on every exit** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
function finishPointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  dragElement.classList.remove('is-dragging');
  // pointercancel and lostpointercapture must use this same cleanup path.
}
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
function beginDrag(event) {
  if (activePointerId !== null) return; // Ignore competing pointers for this single-pointer control.
  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture(event.pointerId);
  lastClientX = event.clientX;
}
```

#### Verification and failure analysis

Test **keyboard parity** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Provide keyboard movement and activation for non-pointer users.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing keyboard parity in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Keyboard parity can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 11. Pointer capture cleanup

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Ignore non-primary mouse buttons.**

```js
if (event.pointerType === 'mouse' && event.button !== 0) return;
```

**Implementation detail — Keep coordinates local to the element.**

```js
const bounds = dragElement.getBoundingClientRect();
const localX = event.clientX - bounds.left;
```

**Implementation detail — Prevent accidental text selection.**

```js
dragElement.classList.add('is-dragging');
dragElement.setAttribute('aria-grabbed', 'true');
```

**Implementation detail — Support cancellation as release.**

```js
dragElement.addEventListener('pointercancel', finishPointer);
dragElement.addEventListener('lostpointercapture', finishPointer);
```

**Implementation detail — Provide keyboard movement.**

```js
if (event.key === 'ArrowRight') setPosition(position + keyboardStep);
if (event.key === 'ArrowLeft') setPosition(position - keyboardStep);
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: pointer capture cleanup under real interaction

The advanced version of **Pointer capture cleanup** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **clear pointer state on every exit**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
function finishPointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  dragElement.classList.remove('is-dragging');
  // pointercancel and lostpointercapture must use this same cleanup path.
}
```

Use **capture one active pointer** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
function beginDrag(event) {
  if (activePointerId !== null) return; // Ignore competing pointers for this single-pointer control.
  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture(event.pointerId);
  lastClientX = event.clientX;
}
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
const elapsedMs = Math.max(1, event.timeStamp - previousSampleTime);
const velocityX = (event.clientX - previousClientX) / elapsedMs;
const projectedX = currentX + velocityX * 180;
const destination = projectedX > dismissThreshold ? panelWidth : 0;
```

#### Verification and failure analysis

Test **pointer capture cleanup** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Release pointer capture and remove listeners when interaction ends.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing pointer capture cleanup in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Pointer capture cleanup can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

### 12. Production draggable panel

#### CODE DEPTH PASS — focused implementation examples

**Implementation detail — Ignore non-primary mouse buttons.**

```js
if (event.pointerType === 'mouse' && event.button !== 0) return;
```

**Implementation detail — Keep coordinates local to the element.**

```js
const bounds = dragElement.getBoundingClientRect();
const localX = event.clientX - bounds.left;
```

**Implementation detail — Prevent accidental text selection.**

```js
dragElement.classList.add('is-dragging');
dragElement.setAttribute('aria-grabbed', 'true');
```

**Implementation detail — Support cancellation as release.**

```js
dragElement.addEventListener('pointercancel', finishPointer);
dragElement.addEventListener('lostpointercapture', finishPointer);
```

**Implementation detail — Provide keyboard movement.**

```js
if (event.key === 'ArrowRight') setPosition(position + keyboardStep);
if (event.key === 'ArrowLeft') setPosition(position - keyboardStep);
```



#### EXPANSION PASS 2 — advanced production treatment

#### Production reasoning: production draggable panel under real interaction

The advanced version of **Production draggable panel** is not just a visual trick. It is a contract between user intent, the animation engine, and the rest of the interface. Start by identifying the authoritative state and the observable output: which value is allowed to change, who owns the timeline, and what event declares the work complete? If those answers are vague, interruptions create split-brain behavior: the UI looks finished while application state still describes the previous phase. Name the state explicitly and make every completion callback prove that it still belongs to the current run.

A reliable implementation also distinguishes a desired destination from the current rendered value. Input events may arrive faster than the display can paint, a browser tab can be throttled, and a component can be removed while an animation is pending. Treat frame callbacks as temporary work, not durable application state. Clamp elapsed time where numerical updates are involved, cancel superseded work, and make cleanup idempotent so it is safe to call from pointer cancellation, route changes, and component teardown.

The following implementation fragment demonstrates **capture one active pointer**. It is intentionally small enough to adapt, but its naming exposes the important ownership boundary. In a production component, place the state beside the component that owns the visual and connect the cleanup path to its lifecycle. Avoid hiding state changes inside a decorative callback when those changes affect whether a dialog is open, a link is available, or an item has actually been dismissed.

```js
function beginDrag(event) {
  if (activePointerId !== null) return; // Ignore competing pointers for this single-pointer control.
  activePointerId = event.pointerId;
  event.currentTarget.setPointerCapture(event.pointerId);
  lastClientX = event.clientX;
}
```

Use **project release velocity** as a second guardrail. A useful review question is: what happens when the same event fires twice, arrives late, or conflicts with a new user action? Correctness should not depend on the animation library happening to resolve callbacks in a convenient order. Keep the current run identifier, current pointer identifier, or current target close to the state that owns it. That makes races observable and gives tests a deterministic condition to assert.

```js
const elapsedMs = Math.max(1, event.timeStamp - previousSampleTime);
const velocityX = (event.clientX - previousClientX) / elapsedMs;
const projectedX = currentX + velocityX * 180;
const destination = projectedX > dismissThreshold ? panelWidth : 0;
```

Finally, include an explicit path for users who request less motion and for environments that cannot perform the preferred effect. Reduced motion should preserve the semantic result rather than merely shorten an elaborate movement. If the effect communicates progress, expose progress in text or another accessible signal; if it is decorative, render the finished state immediately. Listen for preference changes when the experience is long-lived, and ensure the non-animated state is correct before any animation starts.

```js
function finishPointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  dragElement.classList.remove('is-dragging');
  // pointercancel and lostpointercapture must use this same cleanup path.
}
```

#### Verification and failure analysis

Test **production draggable panel** with a deliberately adversarial sequence, not only a clean first render. Start the interaction, reverse it before the first transition completes, resize the viewport, switch to reduced motion, and unmount or navigate away during the effect. Verify that no stale callback changes the new state, no event listener remains attached, and the interface is usable with a keyboard. For visual work, inspect the slowest supported device and a throttled frame rate; a curve that looks elegant at 120 Hz may expose timing assumptions at 30 Hz.

Prefer a small number of observable invariants over snapshotting every intermediate frame. Examples include: the semantic state matches the final visual state; only one animation run owns the element; cleanup can run more than once without throwing; reduced motion reaches the same destination; and input remains responsive while motion is in flight. These invariants survive implementation changes better than assertions about a particular millisecond or pixel value. Where timing must be asserted, use a tolerance and wait for the animation's actual completion signal.

For portfolio work, this is the difference between an effect that looks impressive in a screen recording and an interaction that survives a real visitor. Keep the animation subordinate to reading order, focus order, and the task the visitor came to complete. Measure frame cost before introducing elaborate staging, and remove any effect that adds latency without improving orientation, hierarchy, or feedback. The implementation is complete only when the motion, semantic state, fallback, and cleanup all agree.



Combine drag, release velocity, snap selection, and reduced motion in one panel.

```js
const drag = { active: false, startX: 0, x: 0 };
handle.addEventListener("pointerdown", event => {
  drag.active = true;
  drag.startX = event.clientX - drag.x;
  handle.setPointerCapture(event.pointerId); // Keep receiving movement outside the handle.
});
```

This pattern is useful when implementing production draggable panel in an interface that may be interrupted or resized. Keep the state and rendered result connected; do not let an animation callback become the only place where the application state is updated.

**Naive approach:** Tune a single hard-coded value against one desktop recording and assume the same behavior holds for every device.

**Correct approach:** Name the state being animated, define bounds and cancellation behavior, then verify the motion at a slow frame rate and with the relevant input modality.

**Gotcha:** Production draggable panel can behave differently under interruption, reduced motion, or a large elapsed frame interval; test that boundary explicitly rather than relying on the ideal first run.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Small reusable primitive

**What it does:** Applies pointer capture to a reusable component with a defined failure path.

**When to use it:** Use this when a gesture animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function GestureAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 2: Interruptible interaction

**What it does:** Applies coordinate spaces to a reusable component with a defined failure path.

**When to use it:** Use this when a gesture animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function GestureAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 3: Responsive adaptation

**What it does:** Applies drag thresholds to a reusable component with a defined failure path.

**When to use it:** Use this when a gesture animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function GestureAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 4: Accessible fallback

**What it does:** Applies velocity estimation to a reusable component with a defined failure path.

**When to use it:** Use this when a gesture animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function GestureAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 5: Lifecycle-safe integration

**What it does:** Applies rubber-band resistance to a reusable component with a defined failure path.

**When to use it:** Use this when a gesture animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function GestureAnimationPattern({ current, target, reducedMotion = false }) {
  // Keep the final state deterministic when motion is disabled.
  if (reducedMotion) return target;
  return current + (target - current) * 0.18;
}
```

Keep the primitive narrow and test the caller’s ownership of state. Do not use it as a universal animation engine when the interaction requires physics, a timeline, or exact completion callbacks.

### Pattern 6: Production profiling

**What it does:** Applies snap points to a reusable component with a defined failure path.

**When to use it:** Use this when a gesture animation interaction is reused across multiple pages or can be interrupted by user input, route changes, or viewport updates.

```js
function GestureAnimationPattern({ current, target, reducedMotion = false }) {
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

### Build: Gesture Animation — Interactive Portfolio Feature

Build a small portfolio interaction that demonstrates gesture animation under normal use, interruption, mobile constraints, and reduced-motion preferences. The goal is a stable component with a clear visual hierarchy and a testable lifecycle—not a motion-only prototype.

**Requirements**

1. Create a semantic HTML structure for the gesture animation feature.
2. Implement the primary pointer capture behavior using a named state or controller.
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
