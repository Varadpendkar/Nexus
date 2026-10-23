# SKILL: gesture-design-patterns

**Layer:** 28 --- Interaction Design

**Goal:** Design touch, pointer, and motion-based gestures that are
discoverable, accessible, predictable, and resilient across devices and
input methods.

## Why This Matters (Senior Perspective)

Gestures can make an interface feel direct and expressive. Swiping
between cards, dragging a layer, pinching a canvas, or pulling down to
refresh can reduce the distance between intention and result. But
gestures also hide functionality: unlike a visible button, a swipe
affordance may not be obvious, and a precise multi-finger gesture may be
impossible for some users. A gesture is successful only when people can
discover it, perform it comfortably, understand its result, and recover
when the interaction does not go as expected.

A beginner may add gestures because they look modern or because a mobile
application uses them. A senior designer asks what the gesture
contributes, whether it conflicts with browser behavior, whether a
visible alternative exists, and how it works with keyboard,
screen-reader, switch, stylus, and pointer input. Gestures should
complement a clear interface rather than become secret shortcuts for
essential actions. When an action is destructive, such as deleting a
card through a swipe, the gesture needs a forgiving threshold, clear
preview, and a recovery route. When a gesture manipulates content, users
need immediate feedback about what is being moved and what will happen
if they release.

For creative web experiences, gestures can be central to the interaction
model: moving objects on a canvas, rotating a 3D scene, scrubbing a
timeline, or browsing a gallery. These experiences still need robust
pointer handling, cancellation, touch-action rules, reduced-motion
considerations, and responsive hit areas. A drag must not accidentally
scroll the page; a swipe must not hijack ordinary navigation; a pinch
gesture must not trap users in a zoomed state. Treat gesture design as a
complete interaction system: intent, feedback, completion, cancellation,
accessibility alternatives, and testing on real devices.

## Core Concepts

### 1. Choose Gestures for a Clear Task Benefit

Use a gesture when it makes a common action more direct, natural, or
efficient. Do not add gestures solely for novelty. A visible control
should remain available for important actions, especially when the
gesture is difficult to discover or execute.

``` html
<div class="gallery-controls">
  <button type="button" id="previous">Previous image</button>
  <button type="button" id="next">Next image</button>
</div>
<div class="gallery" aria-label="Project gallery">
  <img src="/images/project-01.webp" alt="Project cover">
</div>
```

``` css
.gallery-controls { display: flex; gap: .75rem; }
.gallery-controls button { min-height: 2.75rem; padding-inline: 1rem; }
```

The buttons provide a clear alternative to swiping. A gesture may
enhance the gallery, but it should not be the only way to navigate.

**Naive/Wrong:** Add swipe-only navigation because it looks clean to
remove all controls.

**Correct:** Use gestures as an additional input method and retain a
discoverable control for the same task.

**Gotcha:** Some users cannot perform a swipe reliably, and some devices
interpret the same movement as browser navigation. Essential actions
need alternatives.

### 2. Use Pointer Events for Unified Input

Pointer Events provide a common model for mouse, touch, and pen input.
They allow a gesture implementation to share logic rather than
separately handling mouse and touch event families. Track the pointer
identifier, and only process movement from the pointer that began the
interaction.

``` html
<div class="drag-surface">
  <button class="drag-handle" type="button">Drag card</button>
</div>
```

``` js
const handle = document.querySelector(".drag-handle");
let activePointerId = null;
let startX = 0;

handle.addEventListener("pointerdown", (event) => {
  activePointerId = event.pointerId;
  startX = event.clientX;
  handle.setPointerCapture(event.pointerId);
});

handle.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointerId) return;
  const deltaX = event.clientX - startX;
  handle.style.setProperty("--drag-x", `${deltaX}px`);
});

function endPointer(event) {
  if (event.pointerId !== activePointerId) return;
  activePointerId = null;
}
handle.addEventListener("pointerup", endPointer);
handle.addEventListener("pointercancel", endPointer);
```

**Naive/Wrong:** Implement mouse events only, then discover that touch
and pen input behave differently.

**Correct:** Use Pointer Events for unified input and handle
cancellation as part of the interaction lifecycle.

**Gotcha:** Pointer capture keeps events routed to the active element,
but it does not automatically decide whether a gesture should commit or
cancel. Your application still needs that state logic.

### 3. Define Gesture States Explicitly

A gesture should have a lifecycle: idle, started, moving, committed, or
cancelled. Explicit states prevent ambiguous outcomes when a pointer
leaves the target, a browser interrupts the interaction, or the user
releases before crossing a threshold.

``` js
const gesture = {
  state: "idle",
  startX: 0,
  currentX: 0
};

function beginGesture(x) {
  gesture.state = "started";
  gesture.startX = x;
  gesture.currentX = x;
}

function moveGesture(x) {
  if (gesture.state !== "started" && gesture.state !== "moving") return;
  gesture.currentX = x;
  gesture.state = "moving";
}

function finishGesture() {
  if (gesture.state === "moving" &&
      Math.abs(gesture.currentX - gesture.startX) > 80) {
    gesture.state = "committed";
  } else {
    gesture.state = "cancelled";
  }
}
```

**Naive/Wrong:** Use a single boolean such as `isDragging` for every
phase and infer success from pointer release alone.

**Correct:** Model the lifecycle and define what happens on completion,
cancellation, and interruption.

**Gotcha:** A pointer-up event does not always mean the user intended to
commit. The final decision should consider distance, direction, velocity
when relevant, and the interaction's meaning.

### 4. Set Thresholds and Direction Intentionally

A swipe threshold prevents tiny accidental movements from triggering an
action. Directional intent matters too: a vertical scroll should not
accidentally become a horizontal card swipe. Thresholds should be tuned
with actual devices and users, not chosen only by visual preference.

``` js
function classifySwipe(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const threshold = 64;

  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.25) {
    return "none";
  }
  return dx < 0 ? "left" : "right";
}
```

``` css
.swipe-card { touch-action: pan-y; }
```

**Naive/Wrong:** Trigger an action on any pointer movement, including a
few pixels of jitter.

**Correct:** Define a minimum travel distance and distinguish intended
direction from incidental movement.

**Gotcha:** A fixed threshold may feel different on small phones, large
tablets, and high-density screens. Test physical movement and
interaction timing on representative devices.

### 5. Coordinate with Native Scrolling

Touch gestures share space with browser scrolling, zooming, and
navigation. The CSS `touch-action` property communicates which native
gestures the browser may handle. Use the narrowest restriction that
supports the interaction; do not disable browser behavior across the
whole page to make a custom gesture easier.

``` css
/* Horizontal carousel that still permits vertical page scrolling. */
.carousel-track { touch-action: pan-y; }

/* A drawing canvas that intentionally owns direct manipulation. */
.drawing-canvas { touch-action: none; }
```

**Naive/Wrong:** Set `touch-action: none` on the body to prevent the
browser from interrupting every custom gesture.

**Correct:** Scope touch-action rules to the specific interaction
surface and preserve normal page scrolling wherever possible.

**Gotcha:** `touch-action` is considered at the start of the gesture.
Changing it after the pointer is already moving does not reliably change
the current gesture's behavior.

### 6. Provide Immediate Visual Feedback

During a gesture, the interface should communicate what is happening. A
dragged object should follow the pointer, a swipeable card should move
with the finger, and a reorder operation should show where the item will
land. Feedback reduces uncertainty and helps users correct their
movement before release.

``` css
.draggable-card {
  transform: translateX(var(--drag-x, 0));
  transition: box-shadow 160ms ease;
}
.draggable-card[data-dragging="true"] {
  box-shadow: 0 1rem 2.5rem #0005;
  cursor: grabbing;
}
```

``` js
function setDragging(element, active) {
  element.dataset.dragging = String(active);
}
```

**Naive/Wrong:** Wait until the pointer is released to show the result,
leaving users unsure whether the gesture registered.

**Correct:** Reflect movement and destination continuously, then show a
clear committed or cancelled result.

**Gotcha:** Excessive motion or a large visual lag can make direct
manipulation feel disconnected. Keep the dragged element responsive and
respect reduced-motion preferences for nonessential effects.

### 7. Make Drag-and-Drop Forgiving

Drag-and-drop should have a clear handle or target, enough hit area, and
a useful drop indicator. It should not require pixel-perfect placement.
For sortable lists, show the insertion point and provide a non-drag
alternative such as "Move up" and "Move down" controls when reordering
is important.

``` html
<li class="sortable-item">
  <button type="button" aria-label="Move project up">↑</button>
  <span>Brand exploration</span>
  <button type="button" aria-label="Move project down">↓</button>
</li>
```

``` css
.sortable-item { display: flex; align-items: center; gap: .75rem; padding: .75rem; }
.sortable-item button { min-width: 2.75rem; min-height: 2.75rem; }
```

**Naive/Wrong:** Make the entire row draggable, with no visible
indication of the drop target or alternative input.

**Correct:** Use a clear drag affordance, forgiving targets, a preview,
and equivalent controls for keyboard and touch users.

**Gotcha:** Native HTML drag-and-drop behavior can vary between mouse
and touch environments. For touch-first sorting, use a tested
pointer-based solution or a library designed for the required
interaction.

### 8. Design Swipe Actions with Recovery

Swiping a card to reveal actions can save space, but hidden actions must
remain discoverable and must not be triggered accidentally. Destructive
actions need confirmation or an undo route. A partially revealed action
should communicate whether it is a preview or a committed operation.

``` html
<article class="message-row">
  <div class="message-content">
    <h3>Design review</h3>
    <p>Feedback is ready to review.</p>
  </div>
  <button type="button" class="archive-action">Archive</button>
</article>
```

``` css
.message-row { display: flex; align-items: center; gap: 1rem; }
.archive-action { min-height: 2.75rem; padding-inline: 1rem; }
```

**Naive/Wrong:** Delete an item immediately when a small swipe crosses
the screen edge.

**Correct:** Reveal a clearly labeled action, use a deliberate commit
threshold, and provide undo for reversible operations.

**Gotcha:** Swiping can conflict with screen-reader gestures and
operating-system navigation. Always provide a visible action or menu
alternative.

### 9. Treat Pinch and Zoom as High-Precision Interactions

Pinch gestures are useful for maps, images, and creative canvases, but
they can be difficult to perform accurately and may conflict with
browser zoom. Provide buttons or keyboard controls for zoom in, zoom
out, and reset. Keep the content navigable when zoomed and avoid
trapping users at a scale they cannot reverse.

``` html
<div class="zoom-controls" aria-label="Canvas zoom controls">
  <button type="button" aria-label="Zoom out">−</button>
  <output aria-live="polite">100%</output>
  <button type="button" aria-label="Zoom in">+</button>
  <button type="button">Reset zoom</button>
</div>
```

``` js
let zoom = 1;
function setZoom(nextZoom) {
  zoom = Math.min(3, Math.max(0.5, nextZoom));
  document.querySelector("output").textContent = `${Math.round(zoom * 100)}%`;
}
```

**Naive/Wrong:** Support pinch-to-zoom only and provide no reset or
alternate controls.

**Correct:** Offer explicit zoom controls, a visible current scale, and
a reliable way to restore the default view.

**Gotcha:** Do not disable browser zoom globally. Browser zoom is an
important accessibility feature and should not be overridden for
cosmetic reasons.

### 10. Avoid Gesture Conflicts

A surface may support multiple possible gestures: horizontal swiping,
vertical scrolling, dragging, and tapping. Conflicts arise when the
system cannot tell which action the user intended. Design a clear
priority model and use movement direction, distance, pointer type, and a
deliberate activation area where necessary.

``` js
function chooseIntent(dx, dy, threshold = 12) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return "pending";
  if (Math.abs(dx) > Math.abs(dy) * 1.3) return "horizontal";
  if (Math.abs(dy) > Math.abs(dx) * 1.3) return "vertical";
  return "ambiguous";
}
```

**Naive/Wrong:** Let every event handler react independently to the same
movement.

**Correct:** Resolve intent once and route the gesture to one
interaction owner.

**Gotcha:** The user's initial movement may be ambiguous. Wait for
enough movement to classify intent rather than committing on the first
pixel.

### 11. Support Keyboard and Assistive Alternatives

A gesture-only interface excludes users who cannot perform the required
movement, users operating with a keyboard, and some assistive-technology
users. For any essential gesture action, provide an equivalent control
that can be activated without the gesture. For a sortable list, this
could be move-up/down buttons; for a carousel, previous/next buttons;
for a canvas, zoom controls and keyboard movement.

``` html
<div class="carousel-actions">
  <button type="button" aria-label="Previous slide">Previous</button>
  <button type="button" aria-label="Next slide">Next</button>
</div>
```

``` css
.carousel-actions button {
  min-height: 2.75rem;
  padding: .6rem 1rem;
}
.carousel-actions button:focus-visible {
  outline: 3px solid #b6a9ff;
  outline-offset: 3px;
}
```

**Naive/Wrong:** Assume that because the gesture works on a touchscreen,
the interaction is accessible.

**Correct:** Provide equivalent actions and ensure they are labeled,
keyboard-operable, and discoverable.

**Gotcha:** A visible alternative should provide equivalent
functionality, not merely an explanation that the gesture exists.

### 12. Handle Cancellation, Interruption, and Pointer Capture

Gestures can be interrupted by browser scrolling, operating-system
gestures, app switching, or pointer cancellation. Clean up active state
on `pointercancel` and `lostpointercapture`, and return the interface to
a coherent state. A cancelled gesture should not accidentally trigger
the final action.

``` js
const surface = document.querySelector(".drag-surface");
let activeId = null;

function resetGesture() {
  activeId = null;
  surface.removeAttribute("data-dragging");
}

surface.addEventListener("pointerdown", (event) => {
  activeId = event.pointerId;
  surface.setPointerCapture(event.pointerId);
  surface.dataset.dragging = "true";
});

surface.addEventListener("pointerup", (event) => {
  if (event.pointerId !== activeId) return;
  resetGesture();
});
surface.addEventListener("pointercancel", resetGesture);
surface.addEventListener("lostpointercapture", resetGesture);
```

**Naive/Wrong:** Clean up only on `pointerup`, leaving the interface
stuck in a dragging state after cancellation.

**Correct:** Handle all end-of-gesture paths and separate cancellation
from successful completion.

**Gotcha:** Pointer capture may be released implicitly. A lost capture
event should not leave the interface believing the gesture is still
active.

## Named Patterns

### Pattern 1: Swipe with Visible Controls

**What it does:** Adds swipe navigation while preserving explicit
controls for the same action.

**When to use it:** Image galleries, carousels, and horizontally
navigable content.

``` html
<div class="gallery-nav">
  <button type="button" aria-label="Previous image">Previous</button>
  <button type="button" aria-label="Next image">Next</button>
</div>
```

Nuance: preserve vertical scrolling and avoid capturing gestures that
begin outside the carousel.

### Pattern 2: Drag Handle with Drop Preview

**What it does:** Makes an item movable and communicates where it will
land.

**When to use it:** Reordering cards, layers, tasks, and creative
objects.

``` html
<div class="sortable-row">
  <button type="button" aria-label="Drag item">⠿</button>
  <span>Portfolio card</span>
</div>
```

Nuance: provide a non-drag alternative for essential reordering and make
the drop target forgiving.

### Pattern 3: Reveal-and-Confirm Swipe

**What it does:** Reveals an action after a swipe, then requires a clear
commitment before execution.

**When to use it:** Archive, pin, or other compact actions on list rows.

``` html
<div class="row-actions">
  <button type="button">Archive</button>
  <button type="button">More actions</button>
</div>
```

Nuance: destructive actions need undo or confirmation, and visible
controls should remain available.

### Pattern 4: Pinch with Explicit Zoom Controls

**What it does:** Supports direct zoom while providing buttons and a
reset route.

**When to use it:** Canvas editors, image viewers, diagrams, and maps.

``` html
<div class="zoom">
  <button type="button" aria-label="Zoom out">−</button>
  <output>100%</output>
  <button type="button" aria-label="Zoom in">+</button>
  <button type="button">Reset</button>
</div>
```

Nuance: keep the current scale visible and never disable browser zoom as
a shortcut.

### Pattern 5: Direction-Locked Carousel

**What it does:** Classifies movement before deciding whether the user
intends a horizontal swipe or vertical scroll.

**When to use it:** Carousels embedded in vertically scrolling pages.

``` js
function isHorizontalSwipe(dx, dy) {
  return Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.3;
}
```

Nuance: delay classification until movement is meaningful, and preserve
normal vertical scrolling.

### Pattern 6: Keyboard-Equivalent Reordering

**What it does:** Provides explicit controls for users who cannot or do
not want to drag an item.

**When to use it:** Sortable lists, layer stacks, playlists, and
priority queues.

``` html
<div>
  <span>Featured project</span>
  <button type="button" aria-label="Move Featured project up">Move up</button>
  <button type="button" aria-label="Move Featured project down">Move down</button>
</div>
```

Nuance: announce reorder results where appropriate and keep focus on the
item that moved.

## Common Mistakes

  -----------------------------------------------------------------------
  Mistake                 Why It Happens          Fix
  ----------------------- ----------------------- -----------------------
  Gesture-only navigation Controls are removed to Keep visible
                          achieve a minimal look  previous/next or
                                                  equivalent controls

  No cancellation path    Implementation focuses  Handle `pointercancel`
                          only on successful      and lost pointer
                          completion              capture

  Tiny movement triggers  Thresholds are not      Use a tested distance
  action                  defined                 and direction threshold

  Vertical scroll becomes Gesture intent is       Wait for meaningful
  horizontal swipe        classified too early    movement and lock
                                                  direction

  `touch-action: none` on Browser scrolling is    Scope touch-action to
  the page                treated as an obstacle  the specific
                                                  interaction surface

  Dragging has no preview Feedback is deferred    Show the dragged item
                          until release           and drop destination
                                                  during movement

  Destructive swipe       Hidden action is        Use a deliberate commit
  executes immediately    treated like a direct   threshold and provide
                          button                  undo

  No keyboard alternative Gesture success is      Add equivalent
                          mistaken for            keyboard-operable
                          accessibility           controls

  Pinch zoom has no reset Only the main gesture   Add zoom in/out and
                          is considered           reset controls

  Pointer capture never   Cleanup handles only    Reset state on up,
  releases                pointer-up              cancel, and lost
                                                  capture

  Multiple handlers claim Input intent has no     Classify gesture intent
  the same gesture        single owner            and route it once

  Small targets are       Visual compactness      Increase hit areas and
  difficult to hit        outweighs touch         test with real devices
                          ergonomics              

  Swipe actions are       Hidden controls have no Add a visible menu or
  undiscoverable          visual cue              subtle action
                                                  affordance

  Gesture conflicts with  Platform behavior was   Test browser edge
  browser navigation      not tested              gestures and avoid
                                                  hijacking them

  Drag operation loses    Cancellation is treated Restore the item to its
  the item on cancel      as success              original position on
                                                  cancellation

  Motion is excessive     Animation is used for   Keep direct
                          decoration              manipulation responsive
                                                  and reduce nonessential
                                                  motion

  Gestures are tested     Touch and pen input are Test touch, mouse, pen,
  only with a mouse       assumed to match        keyboard, and assistive
                                                  alternatives

  Reorder result is not   The data changes but    Keep focus on the moved
  communicated            focus and feedback do   item and announce the
                          not                     result when useful
  -----------------------------------------------------------------------

## Mental Models

1.  **Gesture is a contract:** Users need to discover the gesture,
    perform it, understand the result, and recover from mistakes.
2.  **One gesture, one owner:** Resolve input intent before allowing
    multiple controls to react.
3.  **Direct manipulation needs direct feedback:** The object should
    respond while the user is acting, not only afterward.
4.  **Cancellation is a first-class state:** Interrupted movement should
    restore a coherent interface and must not commit accidentally.
5.  **Gestures are enhancements, not secret requirements:** Essential
    actions need visible alternatives.
6.  **Native behavior is part of the design:** Scrolling, browser zoom,
    and platform navigation must be respected.
7.  **Thresholds express intent:** Distance and direction help separate
    deliberate movement from incidental jitter.
8.  **Recovery creates confidence:** Undo and reset routes make
    experimentation safer.
9.  **Accessibility is functional equivalence:** An alternative must
    accomplish the same task, not merely describe the gesture.
10. **Test physical reality:** A gesture that works with a mouse in a
    desktop simulation may fail on a real touch device.

## Quick Reference

  -----------------------------------------------------------------------
  Situation               Recommended pattern     Important detail
  ----------------------- ----------------------- -----------------------
  Gallery navigation      Swipe with visible      Keep previous/next
                          controls                buttons

  Reordering cards        Drag handle with drop   Provide move-up/down
                          preview                 alternatives

  Compact list actions    Reveal-and-confirm      Include visible action
                          swipe                   menu and undo

  Canvas or image zoom    Pinch with explicit     Provide zoom in, zoom
                          controls                out, reset

  Horizontal carousel     Direction-locked        Preserve vertical
                          carousel                scrolling

  Essential sorting       Keyboard-equivalent     Preserve focus and
                          reordering              communicate result

  Pointer-based movement  Pointer Events          Handle up, cancel, and
                          lifecycle               lost capture

  Touch canvas            Scoped `touch-action`   Do not disable native
                                                  gestures globally

  Destructive swipe       Confirmed action or     Never commit from
                          undo                    incidental movement

  Motion-heavy            Reduced-motion-aware    Keep direct
  interaction             feedback                manipulation responsive

  Multiple gesture        Intent classification   Resolve direction
  candidates                                      before action

  Device compatibility    Cross-input testing     Test touch, mouse, pen,
                                                  and keyboard
  -----------------------------------------------------------------------

## Build Challenge: Create an Accessible Gesture Gallery

Build a responsive project gallery that supports touch swiping and
pointer interaction while retaining clear controls for every essential
action.

### Requirements

1.  Create a gallery with a visible current item and a meaningful
    accessible name.
2.  Provide previous and next buttons that work without gestures.
3.  Support horizontal swipe using Pointer Events or a well-tested
    equivalent.
4.  Preserve vertical page scrolling when the user begins a vertical
    gesture.
5.  Use a clear threshold so small pointer movement does not change the
    slide.
6.  Resolve horizontal versus vertical intent before committing
    navigation.
7.  Provide immediate visual feedback during the gesture.
8.  Handle pointer-up, pointer-cancel, and lost pointer capture.
9.  Ensure a cancelled gesture leaves the current slide unchanged.
10. Keep navigation controls keyboard-operable with visible focus
    styles.
11. Announce the current slide when appropriate without excessively
    interrupting screen readers.
12. Avoid disabling browser zoom or global page gestures.
13. Respect reduced-motion preferences for nonessential slide
    transitions.
14. Test at narrow mobile, tablet, and desktop widths.
15. Test with touch, mouse, keyboard, and at least one screen-reader
    workflow.
16. Include an empty or failed-content state with a clear recovery
    action.
17. Keep hit areas large enough for touch interaction.
18. Document the gesture threshold and why it was selected.

### Failure scenarios to test

-   A short accidental movement advances the gallery.
-   A user tries to scroll vertically but changes the slide instead.
-   A pointer is cancelled and the gallery remains stuck in a dragging
    state.
-   A keyboard user cannot reach the previous/next controls.
-   A screen-reader user cannot determine which slide is current.
-   A browser edge swipe unexpectedly leaves the page.
-   The gallery animation is uncomfortable when reduced motion is
    enabled.
-   An image fails to load and the user has no way to retry or move on.

### Definition of Done / Success Criteria

-   [ ] Users can navigate with gestures and visible buttons.
-   [ ] Small movement does not trigger accidental navigation.
-   [ ] Vertical scrolling remains natural.
-   [ ] Gesture state resets after cancellation or pointer capture loss.
-   [ ] The current slide is visually clear and accessible.
-   [ ] Controls work with keyboard and touch.
-   [ ] Hit targets are usable on mobile devices.
-   [ ] Motion respects the user's reduced-motion preference.
-   [ ] Failure states provide useful recovery.
-   [ ] The gallery works across the tested viewport sizes and input
    methods.
-   [ ] No essential action depends on an undiscoverable gesture.
-   [ ] The interaction has been tested on a real touch device.

## Final Review Checklist

Before shipping a gesture, ask: What task benefit does the gesture
provide? Can users discover it? Is there an equivalent visible control?
How is intent distinguished from incidental movement? Does the gesture
interfere with scrolling, browser navigation, or zoom? What feedback
appears while it is happening? What happens on cancellation? Can the
user undo or reset the result? Does it work with keyboard and assistive
technology? Has it been tested on real devices?

A well-designed gesture feels direct because its rules are consistent
and its result is visible. Keep the interaction forgiving, preserve
native behaviors, and make sure the user never has to rely on a hidden
movement to complete an essential task.
