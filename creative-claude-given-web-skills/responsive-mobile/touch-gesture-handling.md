# SKILL: touch-gesture-handling

**Layer:** 08 — Responsive Mobile

**Goal:** Build reliable, accessible touch interactions that respect browser gesture behavior, pointer input, scrolling, and device differences without turning a mobile interface into a fragile collection of event handlers.

## Why This Matters (Senior Perspective)

Touch interactions sit at the boundary between an interface's intent and the browser's control of the screen. A user may be scrolling a page, dragging a carousel, zooming a map, selecting text, or using a screen reader's touch exploration. A handler that assumes every `touchstart` means “begin my custom gesture” can steal scrolling, trap a user in an interaction, or behave differently on iOS Safari, Android Chrome, a trackpad, and a hybrid laptop. The visible bug often looks small—a carousel refuses to scroll vertically, a drawer keeps following the finger, or a swipe fires twice—but the underlying cause is usually an incorrect ownership model for input.

Senior implementation starts by deciding which gestures the product actually needs, which axis or region owns them, how the browser should retain native behavior, and what happens when the gesture is cancelled. Pointer Events usually provide a unified input model for mouse, pen, and touch. CSS `touch-action` communicates gesture intent before the browser begins handling a gesture; JavaScript then tracks a small, explicit state machine rather than trying to undo a browser decision after the fact. This separation makes behavior predictable and keeps event handlers short enough to audit.

For creative web work, the quality of a gesture is part of the visual design. A portfolio carousel, draggable project card, full-screen case-study gallery, or mobile navigation drawer should feel deliberate rather than “almost native.” Gesture code must still preserve keyboard operation, visible focus, reduced-motion preferences, and a non-gesture path for essential actions. A polished swipe that cannot be operated without swiping is incomplete. Reliable touch work is therefore not about adding more listeners; it is about assigning responsibility clearly, preserving native browser behavior, and testing cancellation and edge cases as first-class paths.

## Core Concepts

### 1. Pointer Events as the default input model

**Mental model:** A pointer is an input stream with an identity and a lifecycle. The same lifecycle can represent a finger, mouse, or stylus, so most custom interactions should use Pointer Events instead of duplicating mouse and touch implementations.

`pointerdown` begins a possible interaction, `pointermove` updates it, and `pointerup` ends it. `pointercancel` means the browser or platform has taken over or interrupted the sequence. Treat cancellation as a normal state transition, not an exceptional crash. For single-pointer interactions, store the `pointerId` and ignore unrelated pointers. For gestures that require two fingers, explicitly track the allowed pointers rather than accidentally mixing their coordinates.

```js
const surface = document.querySelector("[data-drag-surface]");
let activePointerId = null;
let startX = 0;
let startY = 0;

surface.addEventListener("pointerdown", (event) => {
  // Only primary-button input starts this single-pointer drag.
  if (!event.isPrimary || event.button !== 0) return;

  activePointerId = event.pointerId;
  startX = event.clientX;
  startY = event.clientY;
  surface.setPointerCapture(event.pointerId);
});

surface.addEventListener("pointermove", (event) => {
  // Ignore motion from a second finger or another device.
  if (event.pointerId !== activePointerId) return;

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;
  surface.style.setProperty("--drag-x", `${deltaX}px`);
  surface.style.setProperty("--drag-y", `${deltaY}px`);
});

function finishPointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
  surface.style.removeProperty("--drag-x");
  surface.style.removeProperty("--drag-y");
}

surface.addEventListener("pointerup", finishPointer);
surface.addEventListener("pointercancel", finishPointer);
```

The example intentionally clears state on both completion and cancellation. A finger can leave the viewport, the browser can begin a native scroll, or an operating-system gesture can interrupt the interaction. If only `pointerup` is handled, a stale active pointer can make the next touch appear to belong to the previous gesture.

Use `event.pointerType` when behavior genuinely differs by input type, such as making a pen interaction pressure-sensitive or avoiding hover-only affordances on touch. Do not branch on pointer type merely to recreate three parallel event systems.

```js
surface.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") {
    surface.dataset.input = "touch";
  } else if (event.pointerType === "pen") {
    surface.dataset.input = "pen";
  } else {
    surface.dataset.input = "mouse";
  }
});
```

The `isPrimary` property is useful for deciding whether an input is the primary pointer of its type, but it is not a complete multi-touch policy. A pinch interaction still needs a pointer map and explicit pair selection.

```js
const pointers = new Map();

surface.addEventListener("pointerdown", (event) => {
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
});

surface.addEventListener("pointermove", (event) => {
  if (!pointers.has(event.pointerId)) return;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  // The gesture recognizer can now calculate distances from known pointers.
});

function removePointer(event) {
  pointers.delete(event.pointerId);
}

surface.addEventListener("pointerup", removePointer);
surface.addEventListener("pointercancel", removePointer);
```

**Gotcha:** Pointer Events unify input APIs, not the behavior of every operating system. Browser gesture policy, pointer capture support, and hardware still need real-device validation.

### 2. `touch-action` declares browser-versus-component ownership

**Mental model:** The browser needs to know which gestures it may handle before the gesture is underway. CSS `touch-action` is a declaration of permitted native gestures; it is not a JavaScript switch that can be changed halfway through a touch to reclaim the current gesture.

For a horizontal carousel embedded in a vertically scrolling page, `touch-action: pan-y` allows the browser to keep vertical page panning while the component can recognize horizontal movement. For a custom drawing surface that owns all panning, `touch-action: none` may be appropriate—but only if disabling native panning and zooming is genuinely necessary and an accessible alternative exists.

```css
/* Vertical page scroll remains native while the carousel handles horizontal drags. */
.project-carousel {
  touch-action: pan-y;
}

/* Only use this for a dedicated canvas-like surface that must own pointer movement. */
.signature-pad {
  touch-action: none;
}

/* A normal button should retain the browser's standard touch behavior. */
.project-card__open {
  touch-action: manipulation;
}
```

Avoid applying `touch-action: none` to `body`, a whole page, or broad content regions to “fix” a gesture conflict. It can disable expected panning and zooming and make the interface unusable for people who depend on browser zoom. Keep gesture restrictions scoped to the smallest region that needs them.

```css
/* Incorrect: disables native gestures across the entire experience. */
/* body { touch-action: none; } */

/* Better: scope the custom gesture to its interaction surface. */
.image-cropper__viewport {
  touch-action: none;
  overflow: hidden;
}
```

`touch-action` values are intersected through the relevant element ancestry when the gesture begins. A child declaration cannot always override a restrictive ancestor. This is why debugging only the element under the finger may miss the rule that actually controls the interaction.

```css
/* A restrictive ancestor can constrain descendants' gesture options. */
.gallery-shell {
  touch-action: pan-x;
}

.gallery-shell__thumbnail {
  /* This cannot restore vertical panning if the ancestor has already disallowed it. */
  touch-action: pan-y;
}
```

Choose the value based on the intended interaction:

```css
/* The browser may handle horizontal and vertical panning. */
.native-scroll-region {
  touch-action: auto;
}

/* The browser may handle vertical panning, but not horizontal panning. */
.horizontal-swipe-region {
  touch-action: pan-y;
}

/* The browser may handle horizontal panning, but not vertical panning. */
.vertical-swipe-region {
  touch-action: pan-x;
}

/* The browser may handle panning and pinch zoom, but not double-tap zoom. */
.tap-focused-control {
  touch-action: manipulation;
}
```

**Gotcha:** Changing `touch-action` in `pointerdown` is too late for the current pointer sequence. Put the policy in CSS before interaction starts.

### 3. Gesture recognition needs thresholds and intent

**Mental model:** A pointer movement is not automatically a swipe. It becomes a recognized gesture only after distance, direction, and timing rules distinguish deliberate intent from finger jitter or ordinary scrolling.

A useful recognizer starts with a coordinate and records the latest coordinate. It waits until movement exceeds a small threshold, then classifies the dominant axis. A horizontal carousel should not commit to a horizontal swipe just because the first event moved one pixel sideways. Use a clear threshold, a direction lock, and a cancellation path. Tune thresholds with real-device testing; CSS pixels are not physical millimeters, but they are a practical basis for browser-coordinate gesture logic.

```js
function createSwipeRecognizer({ threshold = 12, dominance = 1.2 } = {}) {
  let startX = 0;
  let startY = 0;
  let axis = null;

  return {
    start(x, y) {
      startX = x;
      startY = y;
      axis = null;
    },
    move(x, y) {
      const deltaX = x - startX;
      const deltaY = y - startY;

      if (!axis && Math.hypot(deltaX, deltaY) >= threshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY) * dominance) axis = "x";
        else if (Math.abs(deltaY) > Math.abs(deltaX) * dominance) axis = "y";
        else axis = "undecided";
      }

      return { deltaX, deltaY, axis };
    },
    reset() {
      axis = null;
    }
  };
}
```

Do not make the first tiny movement decisive. Human fingers are imprecise, and a person who starts a vertical scroll may drift sideways. Direction locking reduces accidental carousel activation.

```js
const recognizer = createSwipeRecognizer({ threshold: 10, dominance: 1.25 });

surface.addEventListener("pointerdown", (event) => {
  recognizer.start(event.clientX, event.clientY);
});

surface.addEventListener("pointermove", (event) => {
  const result = recognizer.move(event.clientX, event.clientY);
  if (result.axis === "x") {
    surface.dataset.gesture = "horizontal";
  } else if (result.axis === "y") {
    surface.dataset.gesture = "vertical";
  }
});

surface.addEventListener("pointerup", () => {
  delete surface.dataset.gesture;
  recognizer.reset();
});
```

A swipe often also needs a velocity rule. A short, fast flick may be intentional even if it does not travel as far as a slow drag. Track timestamps with each sample, calculate velocity only after intent has been classified, and clamp the result so one anomalous event cannot fling content several screens away.

```js
function horizontalVelocity(start, end) {
  const elapsed = Math.max(1, end.time - start.time);
  return (end.x - start.x) / elapsed;
}

const startSample = { x: 240, time: 1000 };
const endSample = { x: 185, time: 1080 };
const velocity = horizontalVelocity(startSample, endSample);
const isFlick = Math.abs(velocity) > 0.45;
```

**Gotcha:** `pointermove` events may be coalesced, delayed, or delivered at different rates. Use elapsed time and stable thresholds rather than assuming every move represents the same distance or duration.

### 4. Pointer capture and lifecycle cleanup

**Mental model:** Once a component owns a drag, it should continue receiving that pointer's events even if the finger moves outside the component. Pointer capture provides that continuity; lifecycle cleanup prevents the component from remaining in a half-active state.

```js
const draggable = document.querySelector("[data-draggable]");
let draggingPointer = null;

draggable.addEventListener("pointerdown", (event) => {
  if (draggingPointer !== null) return;
  draggingPointer = event.pointerId;
  draggable.setPointerCapture(event.pointerId);
  draggable.classList.add("is-dragging");
});

draggable.addEventListener("pointerup", (event) => {
  if (event.pointerId !== draggingPointer) return;
  draggingPointer = null;
  draggable.classList.remove("is-dragging");
});

draggable.addEventListener("pointercancel", (event) => {
  if (event.pointerId !== draggingPointer) return;
  draggingPointer = null;
  draggable.classList.remove("is-dragging");
});
```

Pointer capture changes where events are delivered, not whether the browser is allowed to handle the gesture. If the browser takes over a native pan, the component can still receive `pointercancel`. Treat it as a normal end-of-interaction signal.

```js
draggable.addEventListener("lostpointercapture", () => {
  // Clear visual state if capture ends unexpectedly.
  draggingPointer = null;
  draggable.classList.remove("is-dragging");
});
```

A complete interaction has a defined cleanup function. Reuse it for `pointerup`, `pointercancel`, `lostpointercapture`, and component teardown when appropriate.

```js
function clearDragState(element) {
  element.classList.remove("is-dragging");
  element.style.removeProperty("--drag-offset-x");
  element.style.removeProperty("--drag-offset-y");
}

draggable.addEventListener("pointerup", () => clearDragState(draggable));
draggable.addEventListener("pointercancel", () => clearDragState(draggable));
draggable.addEventListener("lostpointercapture", () => clearDragState(draggable));
```

**Gotcha:** Do not call `setPointerCapture` blindly for an invalid or already-ended pointer. Capture is useful after a valid `pointerdown`, and its lifecycle should be paired with cleanup.

### 5. Passive listeners, cancellation, and scrolling performance

**Mental model:** Browser scrolling is latency-sensitive. A touch listener that might call `preventDefault()` can force the browser to wait before scrolling, so the listener's cancellation contract matters.

Pointer Events with a suitable `touch-action` policy often remove the need to cancel touch events manually. If legacy code uses `touchstart` or `touchmove`, mark the listener passive when it never calls `preventDefault()`. A passive listener promises not to cancel the default action; calling `preventDefault()` from it has no effect and can produce a warning.

```js
window.addEventListener("touchstart", (event) => {
  // Analytics-only observation does not need to block native scrolling.
  recordTouchStart(event.changedTouches.length);
}, { passive: true });
```

If a legacy gesture genuinely needs to cancel a default action, the listener must be non-passive and the cancellation must be narrowly justified. Do not use this as a blanket workaround for a missing `touch-action` declaration.

```js
legacySurface.addEventListener("touchmove", (event) => {
  if (!legacySurface.classList.contains("drawing")) return;
  // Cancellation is limited to the active drawing mode.
  event.preventDefault();
}, { passive: false });
```

Never block every touch event globally. It can prevent scrolling, interfere with browser zoom, and degrade accessibility. Prefer Pointer Events and CSS gesture policy for new code.

```js
// Incorrect: global cancellation breaks native interaction across the page.
// document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });

// Better: a local listener is used only when a legacy surface needs cancellation.
legacySurface.addEventListener("touchmove", handleLegacyDrawingMove, { passive: false });
```

**Gotcha:** A listener's passive setting does not tell the browser what gesture the component wants. `touch-action` and event cancellation solve related but different problems.

### 6. Accessibility: gestures must not be the only path

**Mental model:** A gesture is an input shortcut, not a hidden prerequisite for using a feature. Essential actions need an equivalent control that can be activated by keyboard, switch access, voice control, and assistive technology.

A carousel may support swipe navigation, but it should also expose Previous and Next buttons. A draggable card should have a keyboard-operable way to reorder or move it. A dismissible panel should have a visible close button. Do not rely on a screen reader user discovering a gesture that has no semantic control.

```html
<section class="case-study-carousel" aria-label="Featured projects">
  <button type="button" class="carousel-control" data-previous>
    Previous project
  </button>

  <div class="carousel-viewport" data-swipe-surface>
    <article class="project-slide" aria-current="true">
      <h2>Spatial Portfolio</h2>
      <p>A motion-led case study for an interactive studio.</p>
    </article>
  </div>

  <button type="button" class="carousel-control" data-next>
    Next project
  </button>
  <p class="sr-only" aria-live="polite" data-carousel-status></p>
</section>
```

```css
.carousel-control {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1rem;
}

/* Keep focus visible; touch users do not need to lose keyboard affordances. */
.carousel-control:focus-visible {
  outline: 3px solid #78a9ff;
  outline-offset: 3px;
}
```

Use native buttons for actions rather than clickable `div` elements. A button already supports keyboard activation and has semantics that assistive technology understands.

```js
const previousButton = document.querySelector("[data-previous]");
const nextButton = document.querySelector("[data-next]");

previousButton.addEventListener("click", showPreviousSlide);
nextButton.addEventListener("click", showNextSlide);

// Pointer gestures and buttons call the same navigation functions.
```

For dragging, provide an alternative such as Move Up / Move Down controls or a menu action. WCAG's pointer-gesture and dragging-movement requirements make equivalent simple-pointer alternatives important for many interfaces.

```html
<div class="sortable-project" data-project-id="research-site">
  <span class="sortable-project__title">Research site redesign</span>
  <button type="button" data-move-up aria-label="Move Research site redesign up">Move up</button>
  <button type="button" data-move-down aria-label="Move Research site redesign down">Move down</button>
</div>
```

**Gotcha:** `aria-label` does not make a non-interactive element keyboard-operable. Use the correct native element and ensure the alternative action actually changes the same state as the gesture.

### 7. Click, tap, and gesture are different stages

**Mental model:** A tap is a short interaction that did not cross the drag threshold. A swipe is a movement that crossed the threshold and satisfied the gesture's direction or velocity rules. Do not let one physical interaction trigger both actions.

Avoid attaching navigation to `pointerdown` if the same element also supports dragging. The user may press to start a swipe and accidentally navigate before the gesture has been classified. Start tracking on `pointerdown`, then decide at completion whether it was a tap or a swipe.

```js
const card = document.querySelector("[data-project-card]");
let pressStart = null;
let didMove = false;

card.addEventListener("pointerdown", (event) => {
  pressStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
  didMove = false;
});

card.addEventListener("pointermove", (event) => {
  if (!pressStart || event.pointerId !== pressStart.id) return;
  if (Math.hypot(event.clientX - pressStart.x, event.clientY - pressStart.y) > 10) {
    didMove = true;
  }
});

card.addEventListener("pointerup", (event) => {
  if (!pressStart || event.pointerId !== pressStart.id) return;
  if (!didMove) openProjectDetails();
  pressStart = null;
});

card.addEventListener("pointercancel", () => {
  pressStart = null;
  didMove = false;
});
```

Prefer an actual link for navigation when the card's primary action is to open a URL. Custom gesture code should enhance that link, not remove normal click behavior.

```html
<a class="project-card" href="/work/spatial-portfolio">
  <img src="/images/spatial-portfolio.webp" alt="">
  <h2>Spatial Portfolio</h2>
  <p>Explore the case study</p>
</a>
```

**Gotcha:** Do not synthesize a second click after a touch interaction unless there is a demonstrated compatibility requirement. Modern Pointer Events and native controls already provide click behavior; extra synthetic clicks can duplicate purchases, navigation, or analytics.

### 8. Multi-touch and gesture scope

**Mental model:** A multi-touch gesture is a relationship between two or more pointers, not a series of unrelated single-pointer moves. Track each pointer by ID and define what happens when one finger leaves before the others.

A pinch recognizer needs an initial distance between two pointers and a current distance. The ratio between those distances can update scale. Clamp scale to meaningful bounds and ensure the component has a keyboard-accessible zoom control if zooming is important.

```js
function distanceBetween(first, second) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function getPointerPair(pointerMap) {
  const points = [...pointerMap.values()];
  if (points.length < 2) return null;
  return [points[0], points[1]];
}

const initialPair = [{ x: 100, y: 120 }, { x: 220, y: 120 }];
const initialDistance = distanceBetween(...initialPair);
const currentPair = [{ x: 90, y: 120 }, { x: 240, y: 120 }];
const currentDistance = distanceBetween(...currentPair);
const scaleRatio = currentDistance / initialDistance;
```

For an image viewer, `touch-action: none` may be appropriate inside a dedicated zoom canvas if the product truly needs custom pinch and pan. For ordinary content, preserve browser zoom. Do not implement a custom pinch gesture on every page element.

```css
.image-viewer__stage {
  touch-action: none;
  overflow: hidden;
  position: relative;
}

.image-viewer__image {
  transform: translate(var(--pan-x, 0px), var(--pan-y, 0px))
    scale(var(--zoom, 1));
  transform-origin: center;
}
```

```js
function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

const nextZoom = clamp(1.4, 1, 4);
imageViewer.style.setProperty("--zoom", String(nextZoom));
```

**Gotcha:** Do not assume exactly two pointers will remain active throughout a pinch. When one pointer ends or is cancelled, reset or deliberately transition the recognizer.

### 9. Motion, feedback, and state consistency

**Mental model:** Gesture feedback should follow a single source of truth. The pointer coordinates describe input; component state describes the interaction; rendering reflects that state. Avoid mixing direct DOM transforms with framework state that also controls the same property.

Use transforms for drag feedback because they usually avoid layout recalculation. Keep the visual offset in CSS custom properties or component state, and commit the semantic change only when the gesture completes. If the user cancels, restore the prior state instead of leaving the element halfway moved.

```css
.draggable-tile {
  transform: translate3d(var(--drag-x, 0px), var(--drag-y, 0px), 0);
  transition: transform 160ms ease-out;
}

.draggable-tile.is-dragging {
  transition: none;
  cursor: grabbing;
  z-index: 1;
}
```

```js
function renderDragOffset(element, deltaX, deltaY) {
  element.style.setProperty("--drag-x", `${deltaX}px`);
  element.style.setProperty("--drag-y", `${deltaY}px`);
}

function resetDragOffset(element) {
  element.style.setProperty("--drag-x", "0px");
  element.style.setProperty("--drag-y", "0px");
}
```

Respect reduced motion. A gesture should remain functional when decorative movement is removed; do not make the motion itself the only indication that a state changed.

```css
@media (prefers-reduced-motion: reduce) {
  .draggable-tile {
    transition-duration: 0.01ms;
    scroll-behavior: auto;
  }
}
```

A release animation should not hide the final position or make the component feel detached from the finger. Keep release easing short, and avoid expensive blur, giant box shadows, and layout-changing properties on every pointer move.

```css
.draggable-tile.is-dragging {
  will-change: transform;
  box-shadow: 0 12px 28px rgb(0 0 0 / 18%);
}

.draggable-tile:not(.is-dragging) {
  will-change: auto;
}
```

**Gotcha:** Do not leave `will-change` permanently enabled on every card in a long page. It can consume memory and create unnecessary compositing layers.

### 10. Test the interaction as a state machine

**Mental model:** A gesture is a finite sequence of states: idle, tracking, recognized, committed, or cancelled. Tests should exercise transitions, not merely confirm that a handler ran.

A swipe component needs explicit outcomes for pointerdown, movement below threshold, horizontal movement, vertical movement, pointerup, pointercancel, and a second pointer. Define those outcomes before adding animation. This avoids accidental coupling between CSS classes and event timing.

```js
const GestureState = Object.freeze({
  IDLE: "idle",
  TRACKING: "tracking",
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
  CANCELLED: "cancelled"
});

let gestureState = GestureState.IDLE;

function beginGesture() {
  gestureState = GestureState.TRACKING;
}

function classifyGesture(axis) {
  if (gestureState !== GestureState.TRACKING) return;
  if (axis === "x") gestureState = GestureState.HORIZONTAL;
  if (axis === "y") gestureState = GestureState.VERTICAL;
}

function cancelGesture() {
  gestureState = GestureState.CANCELLED;
}

function resetGesture() {
  gestureState = GestureState.IDLE;
}
```

Test with real devices in addition to emulation. Browser developer tools can approximate viewport dimensions and touch input, but they do not perfectly reproduce platform gesture arbitration, browser chrome, hardware latency, or operating-system edge gestures.

```js
// A small pure function is easy to test without a browser.
function isHorizontalSwipe(deltaX, deltaY, threshold = 12) {
  return Math.abs(deltaX) >= threshold &&
    Math.abs(deltaX) > Math.abs(deltaY) * 1.2;
}

console.assert(isHorizontalSwipe(-80, 12) === true);
console.assert(isHorizontalSwipe(4, 1) === false);
console.assert(isHorizontalSwipe(8, 40) === false);
```

**Gotcha:** A test that dispatches synthetic events proves your handler's logic, not that the browser will allow the gesture to reach it under real touch-action and scrolling conditions.

## Reusable Patterns

### Pattern 1: Horizontal carousel swipe with native vertical scrolling

**What it does:** Detects left/right swipes within a carousel while allowing the surrounding page to scroll vertically. It also exposes Previous and Next buttons so the carousel does not require a gesture.

**When to use it:** Project galleries, testimonials, featured work rails, and image sequences on a mobile portfolio.

```html
<section class="work-carousel" aria-label="Featured work">
  <div class="work-carousel__toolbar">
    <button type="button" data-carousel-previous>Previous</button>
    <button type="button" data-carousel-next>Next</button>
  </div>
  <div class="work-carousel__viewport" data-carousel-viewport>
    <div class="work-carousel__track" data-carousel-track>
      <article class="work-carousel__slide"><h2>Spatial Portfolio</h2></article>
      <article class="work-carousel__slide"><h2>Commerce Reimagined</h2></article>
      <article class="work-carousel__slide"><h2>Studio Experiments</h2></article>
    </div>
  </div>
  <p class="sr-only" aria-live="polite" data-carousel-announcement></p>
</section>
```

```css
.work-carousel__viewport {
  overflow: hidden;
  touch-action: pan-y;
}

.work-carousel__track {
  display: flex;
  transition: transform 220ms cubic-bezier(.2, .8, .2, 1);
  will-change: transform;
}

.work-carousel__slide {
  flex: 0 0 100%;
  min-width: 0;
  padding: 2rem;
}

.work-carousel__viewport.is-dragging .work-carousel__track {
  transition: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
```

```js
const viewport = document.querySelector("[data-carousel-viewport]");
const track = document.querySelector("[data-carousel-track]");
const slides = [...track.children];
const announcement = document.querySelector("[data-carousel-announcement]");
let currentIndex = 0;
let pointerStart = null;
let horizontalIntent = false;
let dragOffset = 0;

function renderCarousel() {
  track.style.transform = `translate3d(${-currentIndex * 100}%, 0, 0)`;
  announcement.textContent = `Project ${currentIndex + 1} of ${slides.length}: ${
    slides[currentIndex].querySelector("h2").textContent
  }`;
}

function moveCarousel(step) {
  currentIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + step));
  dragOffset = 0;
  renderCarousel();
}

viewport.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  horizontalIntent = false;
  dragOffset = 0;
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", (event) => {
  if (!pointerStart || event.pointerId !== pointerStart.id) return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;

  if (!horizontalIntent && Math.abs(deltaX) > 12 &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
    horizontalIntent = true;
    viewport.classList.add("is-dragging");
  }

  if (horizontalIntent) {
    dragOffset = deltaX;
    track.style.transform =
      `translate3d(calc(${-currentIndex * 100}% + ${dragOffset}px), 0, 0)`;
  }
});

function finishCarouselPointer(event, cancelled = false) {
  if (!pointerStart || event.pointerId !== pointerStart.id) return;

  if (!cancelled && horizontalIntent) {
    if (dragOffset < -45) moveCarousel(1);
    else if (dragOffset > 45) moveCarousel(-1);
    else renderCarousel();
  } else {
    renderCarousel();
  }

  pointerStart = null;
  horizontalIntent = false;
  dragOffset = 0;
  viewport.classList.remove("is-dragging");
}

viewport.addEventListener("pointerup", (event) => finishCarouselPointer(event));
viewport.addEventListener("pointercancel", (event) => finishCarouselPointer(event, true));
document.querySelector("[data-carousel-previous]").addEventListener("click", () => moveCarousel(-1));
document.querySelector("[data-carousel-next]").addEventListener("click", () => moveCarousel(1));
renderCarousel();
```

The example is intentionally bounded at the first and last slide. A production carousel may loop, but looping must update announcements and focus behavior consistently. If each slide contains interactive controls, consider whether off-screen slides should be removed from keyboard navigation and the accessibility tree. Do not hide the currently focused control without moving focus deliberately.

### Pattern 2: Drag-to-dismiss card with a non-drag alternative

**What it does:** Allows a user to drag a dismissible notification horizontally. A Close button provides the same action without dragging.

**When to use it:** Toast-like cards, removable filters, and lightweight panels where dismissal is reversible or low risk. Do not use swipe-to-dismiss as the only route to an important or irreversible action.

```html
<article class="notice-card" data-notice>
  <div class="notice-card__content">
    <strong>Draft saved</strong>
    <p>Your portfolio changes are stored locally.</p>
  </div>
  <button type="button" data-notice-close aria-label="Dismiss Draft saved notice">Close</button>
</article>
```

```css
.notice-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  touch-action: pan-y;
  transform: translateX(var(--notice-drag-x, 0px));
}

.notice-card.is-dragging {
  transition: none;
}

.notice-card.is-dismissed {
  opacity: 0;
  pointer-events: none;
  transition: opacity 160ms ease, transform 160ms ease;
  transform: translateX(-110%);
}
```

```js
const notice = document.querySelector("[data-notice]");
const closeNotice = notice.querySelector("[data-notice-close]");
let noticePointer = null;
let noticeDeltaX = 0;
let noticeDeltaY = 0;
let noticeHorizontal = false;

function dismissNotice() {
  notice.classList.add("is-dismissed");
  notice.setAttribute("aria-hidden", "true");
}

notice.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0 || event.target.closest("button")) return;
  noticePointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  noticeDeltaX = 0;
  noticeDeltaY = 0;
  noticeHorizontal = false;
  notice.setPointerCapture(event.pointerId);
});

notice.addEventListener("pointermove", (event) => {
  if (!noticePointer || event.pointerId !== noticePointer.id) return;
  noticeDeltaX = event.clientX - noticePointer.x;
  noticeDeltaY = event.clientY - noticePointer.y;

  if (!noticeHorizontal && Math.abs(noticeDeltaX) > 10 &&
      Math.abs(noticeDeltaX) > Math.abs(noticeDeltaY) * 1.25) {
    noticeHorizontal = true;
    notice.classList.add("is-dragging");
  }

  if (noticeHorizontal) {
    notice.style.setProperty("--notice-drag-x", `${Math.min(160, Math.max(-160, noticeDeltaX))}px`);
  }
});

function endNoticeDrag(event, cancelled = false) {
  if (!noticePointer || event.pointerId !== noticePointer.id) return;

  if (!cancelled && noticeHorizontal && Math.abs(noticeDeltaX) > 110) {
    dismissNotice();
  } else {
    notice.style.setProperty("--notice-drag-x", "0px");
  }

  noticePointer = null;
  noticeHorizontal = false;
  notice.classList.remove("is-dragging");
}

notice.addEventListener("pointerup", (event) => endNoticeDrag(event));
notice.addEventListener("pointercancel", (event) => endNoticeDrag(event, true));
closeNotice.addEventListener("click", dismissNotice);
```

The threshold should be tuned to the card width and tested on actual devices. If the card is narrow, a 110-pixel threshold may be too difficult; if it is wide, a smaller threshold can cause accidental dismissal. A production version should also provide a way to undo dismissal when the notice carries meaningful information.

### Pattern 3: Pointer-driven horizontal scrubber

**What it does:** Maps pointer movement to a bounded numeric value. It uses a native range input as the semantic and keyboard-accessible control, while optional pointer styling can improve the visual experience.

**When to use it:** Audio previews, timeline scrubbing, before/after comparisons, and interactive art controls.

```html
<label class="scrubber">
  <span>Case study progress</span>
  <input type="range" min="0" max="100" value="35" data-scrubber>
  <output data-scrubber-value>35%</output>
</label>
```

```css
.scrubber {
  display: grid;
  gap: 0.75rem;
}

.scrubber input {
  width: 100%;
  min-height: 44px;
  accent-color: #5b8cff;
  touch-action: pan-y;
}
```

```js
const scrubber = document.querySelector("[data-scrubber]");
const scrubberValue = document.querySelector("[data-scrubber-value]");

function updateScrubber() {
  scrubberValue.value = `${scrubber.value}%`;
  scrubberValue.textContent = `${scrubber.value}%`;
}

scrubber.addEventListener("input", updateScrubber);
updateScrubber();
```

The native input already handles touch, keyboard, focus, and assistive technology. Do not replace it with a custom `div` unless the product has a compelling visual requirement and the team is prepared to implement all expected range semantics and interactions. This pattern demonstrates an important senior choice: use custom gesture code only where it adds meaningful behavior beyond what the platform already supplies.

### Pattern 4: Long-press action menu with cancellation

**What it does:** Opens a contextual action menu after a deliberate press-and-hold, while allowing a normal tap to keep working. Movement beyond a threshold cancels the long press.

**When to use it:** Optional contextual actions on a canvas or media item. Do not hide critical commands behind long press; provide a visible menu button too.

```html
<div class="media-item" data-media-item>
  <img src="/images/brand-study.webp" alt="Abstract blue brand study">
  <button type="button" data-media-menu>More actions</button>
  <div hidden data-context-menu>
    <button type="button" data-save-study>Save study</button>
    <button type="button" data-copy-link>Copy link</button>
  </div>
</div>
```

```css
.media-item {
  position: relative;
}

[data-context-menu] {
  position: absolute;
  inset: auto 0 0;
  z-index: 2;
  padding: 0.75rem;
  background: #171923;
  border-radius: 0.75rem;
}
```

```js
const mediaItem = document.querySelector("[data-media-item]");
const menuButton = mediaItem.querySelector("[data-media-menu]");
const contextMenu = mediaItem.querySelector("[data-context-menu]");
let longPressTimer = null;
let longPressStart = null;
let longPressTriggered = false;

function cancelLongPress() {
  clearTimeout(longPressTimer);
  longPressTimer = null;
  longPressStart = null;
}

function openContextMenu() {
  contextMenu.hidden = false;
  longPressTriggered = true;
}

mediaItem.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  longPressStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
  longPressTriggered = false;
  longPressTimer = setTimeout(openContextMenu, 550);
});

mediaItem.addEventListener("pointermove", (event) => {
  if (!longPressStart || event.pointerId !== longPressStart.id) return;
  if (Math.hypot(event.clientX - longPressStart.x, event.clientY - longPressStart.y) > 9) {
    cancelLongPress();
  }
});

mediaItem.addEventListener("pointerup", cancelLongPress);
mediaItem.addEventListener("pointercancel", cancelLongPress);
mediaItem.addEventListener("contextmenu", (event) => {
  // Preserve the browser's context menu unless this component has an intentional replacement.
  if (contextMenu.hidden) return;
  event.preventDefault();
});
menuButton.addEventListener("click", () => {
  contextMenu.hidden = !contextMenu.hidden;
});
```

This pattern uses a timer, so the timer must be cleared on every end path. A production implementation should handle component removal, keyboard activation, focus placement inside the menu, Escape to close, and returning focus to the invoking control. Do not prevent the platform's context menu by default.

### Pattern 5: Two-pointer pinch zoom for a dedicated image stage

**What it does:** Tracks two active pointers and derives a scale ratio. This is a starting point for a dedicated viewer, not a reason to disable browser zoom across ordinary content.

**When to use it:** Large artwork, maps, diagrams, and product imagery that explicitly needs in-component zoom.

```html
<div class="zoom-stage" data-zoom-stage aria-label="Zoomable artwork">
  <img class="zoom-stage__image" data-zoom-image src="/images/installation-art.webp" alt="Large installation artwork">
</div>
<div class="zoom-controls">
  <button type="button" data-zoom-out>Zoom out</button>
  <button type="button" data-zoom-in>Zoom in</button>
  <button type="button" data-zoom-reset>Reset zoom</button>
</div>
```

```css
.zoom-stage {
  overflow: hidden;
  position: relative;
  touch-action: none;
  min-height: 20rem;
}

.zoom-stage__image {
  display: block;
  width: 100%;
  transform: translate3d(var(--zoom-x, 0px), var(--zoom-y, 0px), 0)
    scale(var(--zoom-scale, 1));
  transform-origin: center;
}

.zoom-controls button {
  min-height: 44px;
  min-width: 44px;
}
```

```js
const zoomStage = document.querySelector("[data-zoom-stage]");
const zoomImage = document.querySelector("[data-zoom-image]");
const activePointers = new Map();
let pinchStartDistance = null;
let pinchStartScale = 1;
let zoomScale = 1;

function pointDistance(points) {
  return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
}

function activePair() {
  const points = [...activePointers.values()];
  return points.length >= 2 ? points.slice(0, 2) : null;
}

function applyZoom(scale) {
  zoomScale = Math.min(4, Math.max(1, scale));
  zoomImage.style.setProperty("--zoom-scale", String(zoomScale));
}

zoomStage.addEventListener("pointerdown", (event) => {
  if (!event.isPrimary && activePointers.size === 0) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  zoomStage.setPointerCapture(event.pointerId);

  const pair = activePair();
  if (pair) {
    pinchStartDistance = pointDistance(pair);
    pinchStartScale = zoomScale;
  }
});

zoomStage.addEventListener("pointermove", (event) => {
  if (!activePointers.has(event.pointerId)) return;
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  const pair = activePair();
  if (!pair || !pinchStartDistance) return;
  applyZoom(pinchStartScale * pointDistance(pair) / pinchStartDistance);
});

function endZoomPointer(event) {
  activePointers.delete(event.pointerId);
  pinchStartDistance = null;
  const pair = activePair();
  if (pair) {
    pinchStartDistance = pointDistance(pair);
    pinchStartScale = zoomScale;
  }
}

zoomStage.addEventListener("pointerup", endZoomPointer);
zoomStage.addEventListener("pointercancel", endZoomPointer);
document.querySelector("[data-zoom-in]").addEventListener("click", () => applyZoom(zoomScale + 0.25));
document.querySelector("[data-zoom-out]").addEventListener("click", () => applyZoom(zoomScale - 0.25));
document.querySelector("[data-zoom-reset]").addEventListener("click", () => applyZoom(1));
applyZoom(1);
```

The sample illustrates pointer bookkeeping and scale bounds. A production zoom viewer should also calculate the focal point so the image stays under the fingers, constrain panning to the image bounds, reset safely on lost capture, and announce or expose the current zoom level. If pinch handling becomes complex, use a well-tested interaction library rather than shipping an incomplete gesture engine.


### Additional implementation checks

The following small patterns make gesture code easier to validate in production. They are intentionally independent so each can be copied into a focused utility or test.

```js
function isPrimaryActivation(event) {
  return event.isPrimary && event.button === 0;
}
```

```js
function movementExceeded(startX, startY, currentX, currentY, threshold = 10) {
  return Math.hypot(currentX - startX, currentY - startY) >= threshold;
}
```

```js
function dominantAxis(deltaX, deltaY, ratio = 1.2) {
  if (Math.abs(deltaX) > Math.abs(deltaY) * ratio) return "horizontal";
  if (Math.abs(deltaY) > Math.abs(deltaX) * ratio) return "vertical";
  return "undecided";
}
```

```js
function clampToRange(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
```

```js
function swipeDirection(deltaX) {
  if (deltaX < 0) return "next";
  if (deltaX > 0) return "previous";
  return "none";
}
```

```js
function shouldCommitSwipe(deltaX, deltaY, threshold = 45, ratio = 1.2) {
  return Math.abs(deltaX) >= threshold &&
    Math.abs(deltaX) > Math.abs(deltaY) * ratio;
}
```

```js
function safeElapsedMilliseconds(startTime, endTime) {
  // A minimum avoids division by zero when two events share a timestamp.
  return Math.max(1, endTime - startTime);
}
```

```js
function normalizePointerSample(event) {
  return {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    time: event.timeStamp,
    type: event.pointerType
  };
}
```

```js
function removePointerAndReturnCount(pointerMap, pointerId) {
  pointerMap.delete(pointerId);
  return pointerMap.size;
}
```

```js
function hasInteractiveAncestor(target, root) {
  return Boolean(target.closest("a, button, input, select, textarea, [contenteditable='true']")) &&
    root.contains(target);
}
```

These helpers are not a substitute for a coherent recognizer. They isolate decisions that are otherwise easy to duplicate inconsistently across handlers. Test the functions with expected boundary values before wiring them into a component.

## Common Mistakes

| Mistake | Why it fails | Better fix |
|---|---|---|
| Listening only for `touchend` or `pointerup` | Cancellation can leave the component stuck in its active state. | Handle `pointercancel` and `lostpointercapture` with the same cleanup path. |
| Applying `touch-action: none` to the whole page | It can disable expected scrolling and zooming. | Scope gesture restrictions to the smallest surface that truly owns the interaction. |
| Calling `preventDefault()` in every touch listener | It blocks native gestures and may delay scrolling. | Prefer Pointer Events plus a deliberate `touch-action` policy; cancel only a narrowly defined legacy interaction. |
| Changing `touch-action` after `pointerdown` | The current gesture policy is already determined by the browser. | Declare the correct policy in CSS before the user starts touching the surface. |
| Treating every pointer move as a swipe | Tiny finger jitter becomes navigation or dismissal. | Use a movement threshold, axis dominance, and a clear commit rule. |
| Classifying direction on the first event | The user may intend to scroll vertically but drift sideways initially. | Wait until total movement crosses a threshold, then lock the dominant axis. |
| Forgetting pointer identity | A second finger can overwrite the first finger's drag state. | Track `pointerId` and ignore pointers that do not belong to the active interaction. |
| Using only `pointerup` cleanup | Interrupted gestures can leave stale classes and coordinates. | Centralize cleanup and invoke it for completion, cancellation, and capture loss. |
| Capturing every pointer without checking the target | Buttons inside a draggable card can unexpectedly start dragging. | Exclude interactive descendants and decide which regions initiate the gesture. |
| Making swipe the only carousel control | Keyboard and switch users may not have an equivalent operation. | Add visible Previous and Next buttons that call the same navigation functions. |
| Replacing native range inputs with a `div` | Keyboard semantics, focus, and assistive-technology behavior disappear. | Style a native `input[type="range"]` unless custom semantics are truly necessary. |
| Triggering navigation on `pointerdown` | A swipe may navigate before the component knows whether it was a drag. | Delay activation until `pointerup` and commit only when the movement stayed below threshold. |
| Synthesizing clicks after touch | A native click may also fire, causing duplicate actions. | Use native controls and Pointer Events; add compatibility code only for a proven browser issue. |
| Keeping `will-change` on every item | Many compositing layers can increase memory usage. | Apply `will-change` only during the active drag and remove it afterward. |
| Assuming desktop emulation proves touch behavior | Emulation cannot fully reproduce native gesture arbitration and device latency. | Validate on physical iOS and Android devices and include browser-specific checks. |
| Opening a long-press menu without focus management | Keyboard and screen-reader users may lose track of the active control. | Provide a visible menu button, move focus into the menu, support Escape, and restore focus on close. |
| Ignoring multi-touch pointer removal | A pinch can keep using stale coordinates after one finger leaves. | Recalculate the active pair when a pointer ends or is cancelled. |
| Using a giant swipe threshold for every component | The same threshold may be too difficult for a small card and too easy for a wide gallery. | Tune thresholds to component size, movement direction, and observed real-device behavior. |
| Animating layout properties on every move | Repeated layout recalculation can make dragging lag. | Update transforms or CSS custom properties that drive transforms, then commit layout state at the end. |
| Preventing the native context menu automatically | The user may lose expected platform actions such as text or image options. | Keep the native context menu unless the product has a deliberate, accessible replacement. |

## Mental Models

1. **Pointer lifecycle:** Every interaction begins, updates, and ends; cancellation is an ordinary end path.
2. **Gesture ownership:** CSS declares which native gestures remain available before JavaScript interprets movement.
3. **Intent threshold:** Movement becomes a gesture only after it passes a meaningful distance and direction test.
4. **Axis lock:** A component should commit to one movement axis rather than fighting the user's scroll intent.
5. **Input equivalence:** Swipe is a shortcut; every essential action still needs a simple alternative.
6. **Single source of truth:** Pointer coordinates describe input, state describes intent, and rendering reflects state.
7. **Native first:** Preserve browser behavior unless a clearly scoped product requirement justifies replacing it.

## Quick Reference

| Need | Recommended approach | Watch out for |
|---|---|---|
| Unified touch, mouse, and pen input | Pointer Events | Platform gesture behavior still varies. |
| Keep vertical page scrolling in a horizontal carousel | `touch-action: pan-y` | Ancestor restrictions can constrain descendants. |
| Dedicated custom drawing surface | `touch-action: none` on the surface | Preserve accessible alternatives and browser zoom elsewhere. |
| Avoid drag jitter | Distance threshold plus axis dominance | Tune using actual device testing. |
| Continue tracking outside the element | `setPointerCapture(pointerId)` | Clean up on capture loss and cancellation. |
| Know which pointer is active | Store `pointerId` | Do not let a second pointer overwrite single-drag state. |
| Handle browser takeover | `pointercancel` | Reset visuals and internal state. |
| Observe touch without blocking scroll | Passive listener | Do not call `preventDefault()` in it. |
| Legacy gesture must cancel native behavior | Narrow non-passive listener | Explain and test why cancellation is required. |
| Swipe carousel navigation | Pointer tracking plus buttons | Buttons must invoke the same state updates. |
| Distinguish tap from swipe | Decide at pointerup | Do not navigate immediately on pointerdown. |
| Pinch zoom | Track two pointers and distance ratio | Reset when either pointer ends. |
| Dismiss by dragging | Threshold plus visible Close button | Avoid accidental irreversible actions. |
| Long-press action menu | Timer plus movement cancellation | Preserve native context menu where possible. |
| Smooth drag feedback | Transform or transform-backed CSS variables | Avoid layout work on each move. |
| Reduce drag rendering overhead | Temporarily set `will-change` | Remove it after the gesture. |
| Support keyboard users | Native buttons and range controls | Custom `div` controls require full semantics. |
| Announce carousel changes | `aria-live="polite"` status | Avoid announcing every pointermove. |
| Respect reduced motion | `prefers-reduced-motion` media query | Functionality must not depend on animation. |
| Test gesture classification | Unit-test pure threshold logic | Synthetic tests do not prove browser arbitration. |
| Test actual platform behavior | Physical iOS and Android devices | Include portrait, landscape, and browser chrome states. |
| Prevent duplicate activation | Avoid synthetic clicks | Native click behavior may already occur. |
| Keep nested controls usable | Exclude buttons, links, and inputs from drag start | Test event propagation with real content. |
| Constrain scale values | Clamp zoom ratio | Also constrain pan to image bounds. |
| Support dragging alternatives | Move Up / Move Down controls | The alternative must produce the same result. |
| Keep touch targets usable | Aim for at least 44 CSS px where practical | Account for spacing between adjacent controls. |
| Avoid blocking text selection | Limit custom gestures to dedicated surfaces | Do not disable selection globally. |
| Clean up on component removal | Abort listeners or run teardown cleanup | Detached elements can retain timers and references. |
| Track velocity | Use timestamped samples | Clamp extreme values and handle near-zero elapsed time. |
| Decide when to use a library | Use one for complex pinch/pan physics | A partial custom recognizer can be less reliable than a mature solution. |

## Build Challenge

Build a **touch-ready portfolio project gallery** that supports horizontal swipe navigation, normal vertical page scrolling, keyboard navigation, and clear state announcements. The gallery should feel at home on a creative agency portfolio but must remain usable without touch.

### Requirements

1. Create a gallery containing at least four named project slides with a title and a short description.
2. Use Pointer Events for gesture tracking; do not create separate mouse and touch implementations.
3. Set a scoped `touch-action` policy so vertical page scrolling remains native while horizontal swipes are recognized.
4. Track the active `pointerId` and ignore unrelated pointers during a single-finger swipe.
5. Add a minimum movement threshold before recognizing a swipe.
6. Add axis dominance so a vertical scroll is not mistaken for horizontal navigation.
7. Handle `pointerup`, `pointercancel`, and `lostpointercapture` without leaving stale drag state.
8. Provide visible Previous and Next buttons that call the same navigation functions as the swipe recognizer.
9. Disable or bound navigation at the first and last slide; do not let the active index become invalid.
10. Announce slide changes through a polite live region without announcing every pointer movement.
11. Ensure all buttons have visible focus styles and usable touch target dimensions.
12. Respect `prefers-reduced-motion` by reducing or removing decorative transition effects.
13. Avoid global `preventDefault()` calls and do not apply `touch-action: none` to the document body.
14. Keep rendering efficient by using transforms for temporary drag feedback rather than changing layout properties on every move.
15. Add a clear empty or error state if the gallery has no slides.
16. Test a short tap, a slow horizontal drag, a fast flick, a vertical scroll that starts over the gallery, a cancelled pointer, and a second pointer.
17. Test the interface at narrow portrait and wide landscape viewports.
18. Verify on at least one physical iOS device and one physical Android device, or clearly document which physical-device checks could not be performed.
19. Confirm the gallery still works with keyboard-only input and without using swipe gestures.
20. Document the gesture threshold, axis dominance ratio, and why those values were selected.

### Expected output

A self-contained gallery component with semantic HTML, scoped CSS, and JavaScript that can be copied into a portfolio project. Include a short README note describing the gesture policy, keyboard alternative, cancellation behavior, and device test results.

### Success criteria

- A horizontal swipe changes exactly one slide when it passes the recognition threshold.
- A vertical page scroll that begins on the gallery continues scrolling the page naturally.
- A cancelled gesture restores the gallery to a stable state.
- Previous and Next buttons always work and keep the live announcement in sync.
- No essential operation requires a swipe, long press, or multi-touch gesture.
- The component has no global scroll lock, no duplicate click activation, and no stuck dragging class after interruption.
- Reduced-motion preferences are respected without removing feedback about which slide is active.
- The implementation has been exercised with keyboard input and on real touch hardware, with limitations recorded honestly.
