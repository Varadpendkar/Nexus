# SKILL: carousel-slider-patterns

**Layer:** 15 — UI Components

**Goal:** Build accessible, responsive carousels and sliders with predictable controls, keyboard support, sensible motion, and robust behavior across touch, pointer, and assistive-technology input.

---

## Why This Matters (Senior Perspective)

Carousels and sliders are common interface components, but they are easy to build in ways that look impressive and behave badly. A carousel presents a sequence of items through a constrained viewport; a slider usually lets a user choose a value or move a handle along a range. The words overlap in product teams, so the first senior decision is to define which interaction is actually needed. A product gallery, testimonial rail, and image showcase are carousel use cases. A volume control, price range, or timeline scrubber is a value slider use case. Choosing the wrong primitive creates a confusing keyboard model, an unclear accessible name, and behavior that users cannot predict.

A carousel has more than visual states. It has a current item or page, a collection of available items, previous and next actions, optional pagination, responsive visible-item counts, and a policy for wrapping at the ends. It may also have touch gestures, drag behavior, autoplay, lazy-loaded media, and asynchronous data. Each additional feature increases the number of states that can become inconsistent. A next button can become enabled when there is no next page; a dot can announce page three while page two is visible; a drag gesture can accidentally activate a link; an autoplay timer can advance content while a keyboard user is reading it; and a hidden slide can remain in the tab order.

A value slider has a different contract. Its value must map predictably to a minimum, maximum, and step. It must expose a label and current value, support keyboard adjustments, and communicate units clearly. A custom slider that only responds to pointer dragging excludes keyboard users and may be unusable with assistive technology. When a native range input meets the design need, prefer it. Build a custom slider only when the interaction genuinely requires capabilities that native controls cannot provide, and then follow the relevant ARIA slider pattern with careful testing.

Production reliability depends on choosing a single source of truth for state. Do not let CSS transforms, pagination text, disabled buttons, and the active slide index evolve independently. Calculate the visible range from the active page and item count, then derive the controls and accessibility metadata from that state. If the collection changes after a network response, clamp the current index and handle the empty collection explicitly. If items have variable widths, calculate actual positions rather than assuming every slide has the same width. If responsive breakpoints change how many items fit, update the page model without jumping to an invalid index.

Motion should help users understand continuity, not force them to chase content. Autoplay needs a clear pause or stop mechanism, must not surprise keyboard or screen-reader users, and should stop or pause when focus enters the carousel. Respect `prefers-reduced-motion`, avoid excessive parallax, and do not make the only path to content depend on animation finishing. Dragging must have a non-drag alternative such as previous/next controls. Touch and pointer handling should not block page scrolling unnecessarily, and click suppression after a drag must be precise enough not to swallow legitimate activations.

For portfolios, marketing sites, ecommerce galleries, and dashboards, a polished carousel can make a strong visual impression. A robust implementation is more than a smooth horizontal transform: it is a coherent interaction model with visible controls, predictable focus, meaningful announcements, responsive layout, and tested edge cases. The goal is not to add every carousel feature. It is to implement the smallest behavior set that serves the content, and to prove it works when there are zero items, one item, many items, narrow screens, reduced motion, keyboard navigation, and failed media loads.

---

## Core Concepts

### 1. Distinguish a content carousel from a value slider

**Explanation:** A carousel moves through content items or pages. A value slider selects a number or position in a defined range. The correct semantic primitive follows the user's task, not the visual resemblance of a horizontal track.

**Semantic HTML example:**

```html
<section aria-label="Featured projects" class="carousel">
  <button type="button" aria-label="Previous projects">Previous</button>
  <div class="carousel__viewport">
    <article class="carousel__slide"><h3>Brand redesign</h3></article>
    <article class="carousel__slide"><h3>Commerce platform</h3></article>
  </div>
  <button type="button" aria-label="Next projects">Next</button>
</section>
<label for="volume">Volume</label>
<input id="volume" type="range" min="0" max="100" value="50" />
```

**Working CSS/JS example:**

```css
.carousel__viewport { overflow: hidden; }
.carousel__slide { flex: 0 0 100%; }
input[type="range"] { accent-color: currentColor; }
```

```js
const volume = document.querySelector("#volume");
volume.addEventListener("input", () => {
  document.querySelector("#volume-output").textContent = volume.value;
});
```

```html
<output id="volume-output" for="volume">50</output>
```

Use a native `<input type="range">` for value selection when it fits the design. Do not repurpose a content carousel as a slider role.

**Naive vs. correct:** Naive: add `role="slider"` to a carousel viewport. Correct: model content navigation and numeric value selection as different components.

**Gotcha:** Product teams often call both components “slider”; agree on the component contract before designing its API.

### 2. Model the carousel as a state machine

**Explanation:** A simple carousel can be modeled with a current page index, page count, and wrap policy. Visible slides, disabled controls, pagination, and announcements should all derive from those values. A state machine makes end behavior and collection changes explicit.

**Semantic HTML example:**

```html
<section class="carousel" aria-label="Client stories" data-wrap="false">
  <button type="button" data-prev aria-label="Previous slide">Previous</button>
  <div data-viewport>
    <article data-slide><h3>Story one</h3></article>
    <article data-slide><h3>Story two</h3></article>
  </div>
  <button type="button" data-next aria-label="Next slide">Next</button>
  <p data-status role="status" aria-live="polite"></p>
</section>
```

**Working CSS/JS example:**

```js
function nextIndex(current, count, direction, wrap = false) {
  if (count <= 0) return 0;
  const next = current + direction;
  if (wrap) return (next + count) % count;
  return Math.max(0, Math.min(count - 1, next));
}
```

```js
let current = 0;
const slides = [...document.querySelectorAll("[data-slide]")];
function move(direction) {
  current = nextIndex(current, slides.length, direction, false);
  render();
}
```

The render function should update the visible slide, control state, pagination, and status text from `current`.

**Naive vs. correct:** Naive: each button separately manipulates transforms and labels. Correct: a single state value drives every dependent output.

**Gotcha:** If a data refresh removes slides, clamp the current index before rendering to avoid an invalid active item.

### 3. Define what “one page” means

**Explanation:** A carousel that shows one slide at a time has one item per page. A responsive product rail might show three cards at desktop width and one card on mobile. The active state may represent an item index or a page index. Choose one model and document it.

**Semantic HTML example:**

```html
<section aria-label="Products" class="product-carousel">
  <button type="button" data-prev>Previous</button>
  <div class="product-carousel__viewport">
    <div class="product-carousel__track">
      <article class="product-card"><h3>Desk lamp</h3></article>
      <article class="product-card"><h3>Chair</h3></article>
      <article class="product-card"><h3>Desk</h3></article>
    </div>
  </div>
  <button type="button" data-next>Next</button>
</section>
```

**Working CSS/JS example:**

```js
function pageCount(itemCount, visibleCount) {
  return Math.max(1, Math.ceil(itemCount / Math.max(1, visibleCount)));
}
```

```js
function visibleRange(page, visibleCount, itemCount) {
  const start = page * visibleCount;
  return { start, end: Math.min(start + visibleCount, itemCount) };
}
```

Use `Math.max(1, ...)` only for display logic; separately represent an empty collection so controls can be disabled and an empty message shown.

**Naive vs. correct:** Naive: increment the index by one even when the UI advances a full page. Correct: make the navigation step match the intended page model.

**Gotcha:** A carousel that shows three cards may have a final page with only one or two cards; decide whether to align the final page to the end or allow blank space.

### 4. Use native controls and meaningful names

**Explanation:** Previous, next, pause, and pagination controls should be real buttons. Their accessible names should explain the action, and repeated controls need enough context to remain understandable. Avoid relying on icon shapes alone.

**Semantic HTML example:**

```html
<section class="carousel" aria-label="Case studies">
  <button type="button" aria-label="Previous case studies">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 4 7 12l8 8"></path></svg>
  </button>
  <button type="button" aria-label="Next case studies">
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 4 8 8-8 8"></path></svg>
  </button>
</section>
```

**Working CSS/JS example:**

```css
.carousel button:focus-visible {
  outline: 3px solid #4f7cff;
  outline-offset: 3px;
}
.carousel button:disabled { cursor: not-allowed; opacity: .45; }
```

```js
function updateControls(previous, next, index, lastIndex, wrap) {
  previous.disabled = !wrap && index === 0;
  next.disabled = !wrap && index >= lastIndex;
}
```

Native disabled buttons cannot be activated by keyboard or pointer. If controls are disabled, keep their state visually clear.

**Naive vs. correct:** Naive: use an unlabeled icon-only `div`. Correct: use a button with an accessible name and a visible focus indicator.

**Gotcha:** If a button is visually disabled but remains active in JavaScript, the user receives contradictory feedback.

### 5. Expose slide identity and position accessibly

**Explanation:** Users need to understand which item is currently visible and how it relates to the collection. A slide can use `role="group"` and a label such as “2 of 5” when appropriate. Avoid adding verbose announcements to every decorative element.

**Semantic HTML example:**

```html
<div class="carousel__slide" role="group" aria-roledescription="slide"
     aria-label="2 of 5">
  <h3>Commerce redesign</h3>
  <p>A faster checkout experience.</p>
</div>
```

**Working CSS/JS example:**

```js
function labelSlides(slides) {
  slides.forEach((slide, index) => {
    slide.setAttribute("role", "group");
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${index + 1} of ${slides.length}`);
  });
}
```

```js
function updateStatus(status, index, count) {
  status.textContent = count ? `Slide ${index + 1} of ${count}` : "No slides available";
}
```

Use a concise status region for changes initiated by the user. Do not announce every offscreen slide as if it were active.

**Naive vs. correct:** Naive: hide all position context and expect users to infer the active item. Correct: expose useful item identity and concise position information.

**Gotcha:** Avoid repeating the same “slide” label at multiple nested levels if it creates redundant screen-reader output.

### 6. Hide offscreen slides from interaction when appropriate

**Explanation:** A visually offscreen card can still contain links, buttons, or form controls in the keyboard order. If the carousel shows only one page, inactive slides should not leave focusable descendants reachable in a confusing way. Use `hidden`, `inert`, or a carefully managed visibility strategy based on the layout.

**Semantic HTML example:**

```html
<article class="carousel__slide" data-active="false" inert aria-hidden="true">
  <h3>Archived project</h3>
  <a href="/projects/archived">View project</a>
</article>
```

**Working CSS/JS example:**

```js
function setSlideActive(slide, active) {
  slide.toggleAttribute("inert", !active);
  if (active) slide.removeAttribute("aria-hidden");
  else slide.setAttribute("aria-hidden", "true");
}
```

```css
.carousel__slide[aria-hidden="true"] { pointer-events: none; }
```

Use `inert` where supported by the target browser baseline or provide a tested fallback. Do not set `aria-hidden="true"` on a subtree that still contains the active element.

**Naive vs. correct:** Naive: translate a slide out of view and assume it is no longer accessible. Correct: synchronize visibility and interactivity.

**Gotcha:** Multi-card carousels may have partially visible slides; do not mark a card inert if the user can still see and interact with it.

### 7. Calculate movement for fixed-width and variable-width slides

**Explanation:** Fixed-width slides can often be positioned using a consistent percentage or item width. Variable-width slides need measured offsets or scroll snapping. Hard-coded transforms break when fonts load, text wraps, or responsive layout changes card width.

**Semantic HTML example:**

```html
<div class="carousel__viewport">
  <div class="carousel__track">
    <article class="carousel__slide"><h3>Short card</h3></article>
    <article class="carousel__slide"><h3>A card with a longer title and more content</h3></article>
  </div>
</div>
```

**Working CSS/JS example:**

```css
.carousel__track { display: flex; gap: 1rem; }
.carousel__slide { flex: 0 0 min(80%, 22rem); }
.carousel__viewport { overflow-x: auto; scroll-snap-type: x mandatory; }
.carousel__slide { scroll-snap-align: start; }
```

```js
function scrollToSlide(viewport, slide) {
  viewport.scrollTo({ left: slide.offsetLeft, behavior: motionBehavior() });
}
function motionBehavior() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
```

Native horizontal scrolling with CSS Scroll Snap can be more robust than custom transform math for variable-width rails.

**Naive vs. correct:** Naive: move by a fixed `300px` regardless of actual card width. Correct: use measured offsets or a layout model that matches the card geometry.

**Gotcha:** `offsetLeft` is relative to the offset parent; verify the coordinate system before using it as a scroll position.

### 8. Support touch, pointer, and drag without breaking scrolling

**Explanation:** Dragging can be useful for galleries, but it should not be the only way to navigate. Pointer capture, gesture thresholds, and click suppression must be handled carefully. Horizontal dragging should not accidentally block vertical page scrolling.

**Semantic HTML example:**

```html
<section class="drag-carousel" aria-label="Photo gallery">
  <button type="button" data-prev aria-label="Previous photo">Previous</button>
  <div class="drag-carousel__viewport" tabindex="0">
    <div class="drag-carousel__track">
      <figure><img src="photo-one.jpg" alt="A modern living room"></figure>
      <figure><img src="photo-two.jpg" alt="A bright kitchen"></figure>
    </div>
  </div>
  <button type="button" data-next aria-label="Next photo">Next</button>
</section>
```

**Working CSS/JS example:**

```css
.drag-carousel__viewport { overflow-x: auto; touch-action: pan-y; cursor: grab; }
.drag-carousel__viewport:active { cursor: grabbing; }
```

```js
let startX = 0;
let dragging = false;
viewport.addEventListener("pointerdown", event => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  startX = event.clientX;
  dragging = true;
});
viewport.addEventListener("pointerup", event => {
  if (!dragging) return;
  const delta = event.clientX - startX;
  dragging = false;
  if (Math.abs(delta) > 48) move(delta < 0 ? 1 : -1);
});
viewport.addEventListener("pointercancel", () => { dragging = false; });
```

This simplified example detects a swipe; a real drag-to-scroll implementation needs pointer capture, start-position tracking, click suppression after an actual drag, and cleanup on cancellation.

**Naive vs. correct:** Naive: prevent every `touchmove` event to support dragging. Correct: preserve native vertical scrolling and provide buttons as a non-drag alternative.

**Gotcha:** Do not prevent a click on a link just because the pointer moved a few pixels; set a threshold and test taps, drags, and cancelled gestures.

### 9. Implement autoplay as an opt-in, interruptible feature

**Explanation:** Autoplay can draw attention to a carousel, but it can also interfere with reading, focus, and comprehension. Provide a visible pause control, stop or pause when focus enters the carousel, and do not restart unexpectedly after a user has paused it. Respect reduced-motion preferences.

**Semantic HTML example:**

```html
<section class="carousel" aria-label="Featured stories">
  <button type="button" data-rotation aria-pressed="false">Start slide rotation</button>
  <button type="button" data-prev>Previous</button>
  <button type="button" data-next>Next</button>
  <div data-slide>Story one</div>
</section>
```

**Working CSS/JS example:**

```js
let timer = null;
let userPaused = true;
function stopRotation() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}
function startRotation() {
  stopRotation();
  if (userPaused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  timer = setInterval(() => move(1), 6000);
}
```

```js
carousel.addEventListener("focusin", () => {
  userPaused = true;
  stopRotation();
});
rotationButton.addEventListener("click", () => {
  userPaused = !userPaused;
  rotationButton.setAttribute("aria-pressed", String(!userPaused));
  rotationButton.textContent = userPaused ? "Start slide rotation" : "Pause slide rotation";
  startRotation();
});
```

If autoplay is not essential, omit it. A static carousel with explicit controls is often a better experience.

**Naive vs. correct:** Naive: rotate forever on a timer. Correct: make rotation controllable and pause it when the user interacts.

**Gotcha:** Do not use a timer that continues while the page is hidden or after the component has been removed from the DOM.

### 10. Respect reduced-motion preferences

**Explanation:** Smooth scrolling and animated transforms can trigger discomfort for some users. Reduced motion should change the behavior, not merely reduce animation duration by an arbitrary amount. Keep the content and controls available without requiring motion.

**Semantic HTML example:**

```html
<section class="carousel" aria-label="Featured work">
  <button type="button" data-prev>Previous</button>
  <div class="carousel__viewport"><div class="carousel__track">...</div></div>
  <button type="button" data-next>Next</button>
</section>
```

**Working CSS/JS example:**

```css
.carousel__track { transition: transform 350ms ease; }
@media (prefers-reduced-motion: reduce) {
  .carousel__track { transition: none; }
}
```

```js
function motionBehavior() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}
```

For JavaScript-driven animation, check the preference at the point where motion starts and consider responding to changes while the page remains open.

**Naive vs. correct:** Naive: animate every movement for the same duration regardless of preference. Correct: disable or simplify nonessential motion and preserve direct state changes.

**Gotcha:** Reduced motion should not make controls appear unresponsive; update the active content immediately when motion is disabled.

### 11. Use native range inputs for numeric sliders

**Explanation:** Native range inputs already provide keyboard behavior, focus handling, and accessibility integration. Use them for numeric settings such as volume, price, zoom, and timeline position unless the design requires a specialized multi-handle or nonstandard interaction.

**Semantic HTML example:**

```html
<label for="price-limit">Maximum price</label>
<input id="price-limit" type="range" min="0" max="1000" step="25" value="500" />
<output id="price-limit-output" for="price-limit">500</output>
```

**Working CSS/JS example:**

```css
input[type="range"] { width: 100%; accent-color: #375dfb; }
```

```js
const range = document.getElementById("price-limit");
const output = document.getElementById("price-limit-output");
range.addEventListener("input", () => { output.value = range.value; });
range.addEventListener("change", () => {
  // Commit an expensive filter only after the user finishes adjusting.
  applyPriceFilter(Number(range.value));
});
```

Use the `input` event for live feedback and `change` for a committed update where that distinction helps performance.

**Naive vs. correct:** Naive: implement a numeric slider with pointer events only. Correct: start with `<input type="range">` and customize its appearance as needed.

**Gotcha:** The output should include units or context when a raw number is ambiguous, such as “$500” rather than “500”.

### 12. Define min, max, step, and value constraints

**Explanation:** A value slider needs a valid range and step. Clamp external values to the permitted range and ensure the step is meaningful. If the minimum and maximum are equal, a range input has no useful movement; present a fixed value instead.

**Semantic HTML example:**

```html
<label for="zoom-level">Zoom level</label>
<input id="zoom-level" type="range" min="50" max="200" step="10" value="100" />
<output id="zoom-output" for="zoom-level">100%</output>
```

**Working CSS/JS example:**

```js
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function normalizeRangeValue(value, min, max, step) {
  const clamped = clamp(Number(value), min, max);
  return min + Math.round((clamped - min) / step) * step;
}
```

```js
const min = 50, max = 200, step = 10;
const safeValue = normalizeRangeValue(187, min, max, step);
range.value = String(clamp(safeValue, min, max));
```

If the step does not divide the full range evenly, decide how the final endpoint should behave and test it. Native inputs have their own constraint rules; align application validation with them.

**Naive vs. correct:** Naive: accept arbitrary values from a URL or API and assign them directly. Correct: validate and normalize external values before rendering.

**Gotcha:** A `step` value is relative to the minimum; do not assume every integer between min and max is a valid value.

### 13. Build a custom slider only with a full interaction contract

**Explanation:** A custom slider may be needed for a two-handle range, a specialized timeline, or a rich visual control. It must expose `role="slider"`, accessible naming, minimum, maximum, and current value; support keyboard adjustment; and map pointer coordinates to a clamped value. This is substantially more work than drawing a track and handle.

**Semantic HTML example:**

```html
<div class="custom-slider">
  <label id="temperature-label">Temperature</label>
  <div role="slider" tabindex="0" aria-labelledby="temperature-label"
       aria-valuemin="0" aria-valuemax="40" aria-valuenow="22"
       aria-valuetext="22 degrees Celsius"></div>
  <output>22°C</output>
</div>
```

**Working CSS/JS example:**

```js
function valueFromPointer(clientX, rect, min, max) {
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  return min + ratio * (max - min);
}
```

```js
slider.addEventListener("keydown", event => {
  const current = Number(slider.getAttribute("aria-valuenow"));
  const step = 1;
  let next = current;
  if (event.key === "ArrowRight" || event.key === "ArrowUp") next += step;
  else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next -= step;
  else if (event.key === "Home") next = min;
  else if (event.key === "End") next = max;
  else return;
  event.preventDefault();
  setValue(clamp(next, min, max));
});
```

The example is only the keyboard core. A production custom slider also needs pointer handling, touch support, orientation, value text, focus styling, and screen-reader testing.

**Naive vs. correct:** Naive: add `role="slider"` to a styled bar and stop there. Correct: implement the full keyboard, pointer, state, and accessible-value contract—or use a native range input.

**Gotcha:** Custom sliders are difficult to test consistently across browser and screen-reader combinations; do not choose one solely for a slightly easier CSS design.

### 14. Handle empty data, resizing, and asynchronous changes

**Explanation:** A robust carousel has defined behavior when the collection is empty, shrinks, or changes while a user is interacting. It should avoid stale indexes, broken controls, and announcements that refer to items that no longer exist.

**Semantic HTML example:**

```html
<section class="carousel" aria-label="Recommended articles">
  <p data-empty>No recommendations are available.</p>
  <div data-items hidden></div>
  <button type="button" data-prev disabled>Previous</button>
  <button type="button" data-next disabled>Next</button>
</section>
```

**Working CSS/JS example:**

```js
function normalizeIndex(index, itemCount) {
  if (itemCount <= 0) return 0;
  return Math.min(Math.max(0, index), itemCount - 1);
}
```

```js
function renderCollection(items, requestedIndex) {
  const index = normalizeIndex(requestedIndex, items.length);
  empty.hidden = items.length > 0;
  viewport.hidden = items.length === 0;
  previous.disabled = items.length <= 1 || index === 0;
  next.disabled = items.length <= 1 || index === items.length - 1;
  if (items.length) renderItem(items[index], index, items.length);
}
```

When breakpoints change the visible item count, recalculate page count and clamp the active page. Preserve the user's current item where possible rather than blindly resetting to the first page.

**Naive vs. correct:** Naive: assume the item list is permanent and nonempty. Correct: render explicit empty states and normalize state after every collection update.

**Gotcha:** Resize observers can fire repeatedly; avoid render loops by observing layout without changing the observed dimension in a feedback cycle.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Single-slide carousel with previous and next controls

**What it does:** Shows one item at a time and disables controls at the ends.

**When to use it:** Featured case studies, editorial spotlights, onboarding screens, and image galleries where one item deserves the main focus.

**Complete copy-pasteable code:**

```html
<section class="simple-carousel" aria-label="Featured projects">
  <button type="button" data-prev aria-label="Previous project" disabled>Previous</button>
  <div class="simple-carousel__viewport">
    <article data-slide><h3>Brand identity</h3><p>Strategy and visual design.</p></article>
    <article data-slide hidden><h3>Commerce rebuild</h3><p>Faster product discovery.</p></article>
    <article data-slide hidden><h3>Analytics dashboard</h3><p>Clearer business decisions.</p></article>
  </div>
  <button type="button" data-next aria-label="Next project">Next</button>
  <p data-status role="status" aria-live="polite">Slide 1 of 3</p>
</section>
<script>
document.querySelectorAll(".simple-carousel").forEach(root => {
  const slides = [...root.querySelectorAll("[data-slide]")];
  const prev = root.querySelector("[data-prev]");
  const next = root.querySelector("[data-next]");
  const status = root.querySelector("[data-status]");
  let index = 0;
  function render(announce = true) {
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    prev.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    if (announce) status.textContent = `Slide ${index + 1} of ${slides.length}`;
  }
  prev.addEventListener("click", () => { index = Math.max(0, index - 1); render(); });
  next.addEventListener("click", () => { index = Math.min(slides.length - 1, index + 1); render(); });
  render(false);
});
</script>
```

**Nuance / edge case:** Add an empty-state branch if slides may be loaded dynamically or may be absent. Do not display “Slide 1 of 0”.

### Pattern 2: Multi-card rail with CSS Scroll Snap

**What it does:** Uses native horizontal scrolling to browse a row of cards with snap points.

**When to use it:** Product cards, portfolio tiles, logos, and editorial collections where users benefit from seeing part of the next card.

**Complete copy-pasteable code:**

```html
<section class="card-rail" aria-label="Recent work">
  <div class="card-rail__viewport" tabindex="0">
    <article class="card-rail__card"><h3>Project A</h3><p>Brand system.</p></article>
    <article class="card-rail__card"><h3>Project B</h3><p>Web application.</p></article>
    <article class="card-rail__card"><h3>Project C</h3><p>Data experience.</p></article>
  </div>
</section>
<style>
.card-rail__viewport { display: flex; gap: 1rem; overflow-x: auto; scroll-snap-type: x mandatory; padding: .5rem; }
.card-rail__card { flex: 0 0 min(80%, 22rem); scroll-snap-align: start; }
@media (prefers-reduced-motion: reduce) { .card-rail__viewport { scroll-behavior: auto; } }
</style>
```

**Nuance / edge case:** A native scroll rail may be preferable to a custom carousel when partial visibility is useful. Ensure the scrollbar or another clear affordance communicates that horizontal content exists.

### Pattern 3: Responsive page-based carousel

**What it does:** Advances by the number of cards visible at the current breakpoint.

**When to use it:** Product or case-study grids that show several cards on wide screens and fewer on small screens.

**Complete copy-pasteable code:**

```html
<section class="page-carousel" aria-label="Case studies">
  <button type="button" data-prev disabled>Previous</button>
  <div class="page-carousel__viewport">
    <div class="page-carousel__track">
      <article class="page-card"><h3>One</h3></article>
      <article class="page-card"><h3>Two</h3></article>
      <article class="page-card"><h3>Three</h3></article>
      <article class="page-card"><h3>Four</h3></article>
    </div>
  </div>
  <button type="button" data-next>Next</button>
</section>
<style>
.page-carousel__viewport { overflow: hidden; }
.page-carousel__track { display: flex; transition: transform 250ms ease; }
.page-card { flex: 0 0 33.333%; box-sizing: border-box; padding: 1rem; }
@media (max-width: 700px) { .page-card { flex-basis: 100%; } }
@media (prefers-reduced-motion: reduce) { .page-carousel__track { transition: none; } }
</style>
<script>
const pageRoot = document.querySelector(".page-carousel");
const track = pageRoot.querySelector(".page-carousel__track");
const cards = [...track.children];
const prev = pageRoot.querySelector("[data-prev]");
const next = pageRoot.querySelector("[data-next]");
let page = 0;
function visibleCount() { return matchMedia("(max-width: 700px)").matches ? 1 : 3; }
function render() {
  const count = visibleCount();
  const maxPage = Math.max(0, Math.ceil(cards.length / count) - 1);
  page = Math.min(page, maxPage);
  track.style.transform = `translateX(-${page * 100}%)`;
  prev.disabled = page === 0;
  next.disabled = page === maxPage;
}
prev.addEventListener("click", () => { page = Math.max(0, page - 1); render(); });
next.addEventListener("click", () => { page += 1; render(); });
new ResizeObserver(render).observe(pageRoot);
render();
</script>
```

**Nuance / edge case:** This abbreviated version assumes equal-width cards and page-aligned movement. For a production version, verify transform distance and final-page alignment when the card count is not divisible by the visible count.

### Pattern 4: Carousel with pagination buttons

**What it does:** Provides direct access to a particular slide or page, in addition to previous/next navigation.

**When to use it:** Short carousels where users benefit from jumping directly to a known item, such as a few testimonials or onboarding panels.

**Complete copy-pasteable code:**

```html
<section class="dots-carousel" aria-label="Customer stories">
  <div class="dots-carousel__slides">
    <article data-slide><h3>Customer one</h3></article>
    <article data-slide hidden><h3>Customer two</h3></article>
    <article data-slide hidden><h3>Customer three</h3></article>
  </div>
  <div class="dots-carousel__pagination" aria-label="Choose a story"></div>
</section>
<script>
const dotsRoot = document.querySelector(".dots-carousel");
const dotSlides = [...dotsRoot.querySelectorAll("[data-slide]")];
const pagination = dotsRoot.querySelector(".dots-carousel__pagination");
dotSlides.forEach((slide, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = String(index + 1);
  button.setAttribute("aria-label", `Show story ${index + 1} of ${dotSlides.length}`);
  button.setAttribute("aria-current", index === 0 ? "true" : "false");
  button.addEventListener("click", () => {
    dotSlides.forEach((item, i) => { item.hidden = i !== index; });
    [...pagination.children].forEach((item, i) => item.setAttribute("aria-current", String(i === index)));
  });
  pagination.append(button);
});
</script>
```

**Nuance / edge case:** Dots alone are poor controls when the collection is large or the item names are important. Use labels or a select/list-based navigation for long sequences.

### Pattern 5: Interruptible autoplay

**What it does:** Adds optional automatic rotation while allowing users to pause it and ensuring focus stops the timer.

**When to use it:** A marketing hero or brief showcase where rotation is genuinely useful and does not hide task-critical information.

**Complete copy-pasteable code:**

```html
<section class="rotating-carousel" aria-label="Highlights">
  <button type="button" data-toggle aria-pressed="false">Start slide rotation</button>
  <button type="button" data-prev>Previous</button>
  <button type="button" data-next>Next</button>
  <article data-slide>Highlight one</article>
  <article data-slide hidden>Highlight two</article>
</section>
<script>
const rotateRoot = document.querySelector(".rotating-carousel");
const rotateSlides = [...rotateRoot.querySelectorAll("[data-slide]")];
const toggle = rotateRoot.querySelector("[data-toggle]");
let rotateIndex = 0, timer = null, running = false;
function stop() { if (timer !== null) clearInterval(timer); timer = null; running = false; }
function render() { rotateSlides.forEach((s, i) => s.hidden = i !== rotateIndex); }
function start() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stop(); running = true;
  timer = setInterval(() => { rotateIndex = (rotateIndex + 1) % rotateSlides.length; render(); }, 6000);
}
toggle.addEventListener("click", () => {
  if (running) stop(); else start();
  toggle.setAttribute("aria-pressed", String(running));
  toggle.textContent = running ? "Pause slide rotation" : "Start slide rotation";
});
rotateRoot.addEventListener("focusin", () => {
  stop();
  toggle.setAttribute("aria-pressed", "false");
  toggle.textContent = "Start slide rotation";
});
render();
</script>
```

**Nuance / edge case:** A real implementation should distinguish a user-requested pause from a pause caused by focus, visibility, or reduced-motion settings, so it does not restart against the user's intention.

### Pattern 6: Native numeric range slider

**What it does:** Provides an accessible numeric control with browser-managed keyboard and pointer behavior.

**When to use it:** Volume, price, brightness, zoom, and other single-value ranges.

**Complete copy-pasteable code:**

```html
<div class="price-filter">
  <label for="max-price">Maximum price</label>
  <input id="max-price" type="range" min="100" max="2000" step="100" value="800">
  <output id="max-price-output" for="max-price">₹800</output>
</div>
<script>
const priceRange = document.getElementById("max-price");
const priceOutput = document.getElementById("max-price-output");
function updatePrice() {
  priceOutput.value = `₹${Number(priceRange.value).toLocaleString("en-IN")}`;
}
priceRange.addEventListener("input", updatePrice);
priceRange.addEventListener("change", () => applyFilter(Number(priceRange.value)));
function applyFilter(maxPrice) {
  document.dispatchEvent(new CustomEvent("price-filter-change", { detail: { maxPrice } }));
}
updatePrice();
</script>
```

**Nuance / edge case:** If filtering a large dataset is expensive, update the displayed value during `input` but debounce or commit the expensive filtering operation at a deliberate point.

### Pattern 7: Failure-aware lazy image carousel

**What it does:** Loads slide images as needed and presents a meaningful fallback when a media request fails.

**When to use it:** Image-heavy portfolios, ecommerce galleries, and editorial image sequences where loading every image immediately is wasteful.

**Complete copy-pasteable code:**

```html
<section class="image-carousel" aria-label="Workspace gallery">
  <button type="button" data-prev disabled>Previous image</button>
  <figure data-slide>
    <img src="workspace-one.jpg" alt="Minimal desk beside a window" loading="eager">
    <figcaption>Workspace overview</figcaption>
  </figure>
  <figure data-slide hidden>
    <img src="workspace-two.jpg" alt="Close-up of the desk surface" loading="lazy">
    <figcaption>Material detail</figcaption>
  </figure>
  <button type="button" data-next>Next image</button>
  <p data-status role="status" aria-live="polite"></p>
</section>
<script>
document.querySelectorAll(".image-carousel img").forEach(img => {
  img.addEventListener("error", () => {
    const fallback = document.createElement("span");
    fallback.className = "image-fallback";
    fallback.textContent = `Image unavailable: ${img.alt || "gallery image"}`;
    img.replaceWith(fallback);
  }, { once: true });
});
</script>
```

**Nuance / edge case:** Lazy loading does not guarantee a visible slide is loaded in time. Consider preloading the next image, and preserve descriptive alternative text when the image fails.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using a carousel for a numeric value | The design vocabulary is confused with the interaction contract. | Use a native range input for a numeric value and a carousel for content navigation. |
| Building a carousel without a state model | Each control manipulates a separate DOM detail. | Keep one active index or page state and derive the UI from it. |
| Assuming the collection is never empty | The first demo uses hard-coded sample items. | Render an empty state and disable navigation when no items exist. |
| Showing “1 of 0” | Position text is rendered before checking the collection count. | Branch explicitly for zero items and avoid invalid position labels. |
| Advancing by one item in a page-based rail | The developer has not defined whether the index means item or page. | Use a documented page model and calculate the visible range from it. |
| Hard-coding transform distances | The prototype uses one fixed card width. | Measure offsets or use CSS Scroll Snap for variable-width content. |
| Leaving hidden slides focusable | Visual movement is mistaken for interaction removal. | Use `hidden`, `inert`, or a tested focusability strategy for fully inactive slides. |
| Marking a partially visible card inert | The implementation equates “not active” with “not visible.” | Define visibility based on the actual viewport and interaction design. |
| Using unlabeled icon buttons | The icon looks obvious to the designer. | Add meaningful accessible names and visible keyboard focus. |
| Letting autoplay run while users read | Timer behavior is implemented without an interruption policy. | Provide pause controls and pause rotation on focus or user interaction. |
| Restarting rotation after a manual pause | Pause reasons are represented by one ambiguous Boolean. | Track user pause separately from temporary environmental pauses. |
| Ignoring reduced-motion settings | The visual effect is treated as mandatory. | Disable nonessential animation and use immediate state changes when reduced motion is requested. |
| Preventing all touch movement | Dragging support is added by blocking native gestures. | Preserve vertical scrolling and use a drag threshold with a button alternative. |
| Swallowing clicks after tiny pointer movement | Drag suppression does not distinguish a click from a drag. | Track movement distance and suppress activation only after a genuine drag. |
| Leaving a custom slider pointer-only | The track and thumb look interactive, so keyboard behavior is forgotten. | Prefer `<input type="range">` or implement the complete slider keyboard and ARIA contract. |
| Failing to clamp range values | External values are trusted without validation. | Normalize values against min, max, and step before applying them. |
| Forgetting units in a range output | The displayed number is technically correct but context-free. | Include units and a clear label, such as “₹800 maximum price.” |
| Allowing stale indexes after data updates | The data list changes but carousel state does not. | Clamp the index and update controls after every collection change. |
| Failing to update active slide labels | Accessibility metadata is static while content moves. | Recompute slide positions and status text after a navigation or collection update. |
| Testing only with a mouse | The demo appears functional with pointer input. | Test keyboard, touch, screen-reader announcements, reduced motion, and empty/error states. |

### Before/after: fragile index updates

**Before — state can exceed the collection:**

```js
next.addEventListener("click", () => {
  currentIndex += 1;
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
});
```

**After — state is constrained by the current collection:**

```js
function moveBy(direction) {
  if (slides.length === 0) return;
  currentIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + direction));
  renderCarouselState(currentIndex);
}
```

### Before/after: custom numeric slider

**Before — pointer-only interaction:**

```html
<div class="fake-range"><div class="fake-thumb"></div></div>
```

**After — native semantics and keyboard support:**

```html
<label for="brightness">Brightness</label>
<input id="brightness" type="range" min="0" max="100" value="70">
<output for="brightness">70%</output>
```

---

## Mental Models

1. **A carousel is content navigation:** Its state identifies which content is in view, not a numeric value the user is setting.
2. **A slider is a constrained value:** Every position maps to a valid value in a known range, with clear units and a defined step.
3. **One state, many outputs:** Active content, disabled controls, pagination, status text, and ARIA labels should derive from one state model.
4. **Offscreen is not automatically unavailable:** CSS can move content outside the viewport without removing it from keyboard navigation or the accessibility tree.
5. **Motion must be interruptible:** The user should be able to pause, stop, or bypass nonessential movement and still reach every item.
6. **Latency determines activation strategy:** Expensive panel changes and media loads need deliberate timing, status feedback, and cancellation or stale-response handling.
7. **Responsive layout changes geometry, not the contract:** The visible-item count may change, but every item and control remains reachable.
8. **Native controls are a reliability multiplier:** Use built-in browser semantics whenever they meet the requirement instead of recreating them.
9. **Every collection has boundaries:** Empty, one-item, last-page, changed-data, and failed-media cases should be designed before launch.
10. **Drag is an enhancement, not a gate:** Previous/next controls and keyboard operation must remain available even when gestures are supported.

---

## Quick Reference

| Need | Recommended approach | Verify |
|---|---|---|
| Browse content items | Carousel pattern | Current item and collection position are clear |
| Select a numeric value | Native `<input type="range">` | Label, min, max, step, and current value are correct |
| Show a horizontal card rail | CSS Scroll Snap | All cards remain reachable by touch and keyboard |
| Show one slide at a time | Single active index | Previous/next and position status agree |
| Show multiple cards per page | Page-based state model | Last-page alignment and visible count are correct |
| Disable navigation at ends | Native button `disabled` state | Visual and behavioral state match |
| Add pagination dots | Named buttons with current state | Each control has a useful accessible name |
| Describe the active slide | Position label or concise status region | Announcements are helpful rather than repetitive |
| Hide inactive slides | `hidden` or tested `inert` strategy | Hidden descendants cannot receive focus |
| Support variable card widths | Measured offsets or Scroll Snap | Movement aligns to actual card positions |
| Add touch gestures | Pointer handling with thresholds | Vertical page scrolling still works |
| Add autoplay | Visible pause/start control | Rotation stops on focus and respects user choice |
| Honor reduced motion | CSS media query and JS preference check | No essential interaction depends on animation |
| Handle image failures | Error fallback with descriptive text | Broken media does not leave an unexplained blank |
| Update a changing collection | Clamp active index and rerender | No stale index or invalid status remains |
| Normalize range values | Clamp to min/max and step | Values from URLs/APIs are validated |
| Build a custom slider | Full ARIA and keyboard implementation | Pointer, keyboard, touch, and screen-reader tests pass |
| Test responsive behavior | Real narrow viewport and zoom | No controls or labels become unreachable |

---

## Build Challenge

Build a “Featured Work and Budget Estimator” section for a creative agency website. The page must include a responsive case-study carousel and a numeric budget slider. The carousel should work with buttons, keyboard input, and touch where supported. The budget control should remain understandable and usable without a pointer.

### Requirements

1. Build a semantic carousel region with a meaningful accessible name and at least five case-study items.
2. Use native buttons for previous, next, and pagination controls.
3. Define whether the carousel wraps at the ends; make control states and behavior match that policy.
4. Show a clear current position, such as “2 of 5,” without announcing every offscreen item.
5. Provide meaningful alternative text for informative images and empty alternative text for purely decorative images.
6. Ensure hidden slides do not leave links or buttons in the keyboard tab order.
7. Make the carousel work with keyboard-only navigation and visible focus styling.
8. Use a responsive layout that shows multiple cards at desktop widths and fewer cards on mobile, or document why a single-slide layout is preferable.
9. Handle changes in item count without leaving an invalid active index.
10. Render a proper empty state when the case-study collection has no items.
11. Add an image-loading failure fallback that preserves context and avoids a broken-image icon as the only feedback.
12. Respect `prefers-reduced-motion` for transforms and smooth scrolling.
13. If autoplay is implemented, provide a visible pause/start control and pause rotation when focus enters the carousel.
14. Keep autoplay disabled by default unless a clear content reason justifies it.
15. Add a native range input for the budget estimator with a label, minimum, maximum, and sensible step.
16. Show the selected budget with currency formatting and keep it synchronized with the range value.
17. Separate rapid `input` feedback from expensive committed filtering or calculation when performance requires it.
18. Validate any externally supplied slider value before applying it.
19. Test the layout at 320 CSS pixels and at increased browser zoom.
20. Test keyboard focus order across the carousel controls, slide content, and budget control.
21. Test touch gestures without blocking vertical page scrolling.
22. Verify that dragging does not accidentally activate a link and that ordinary taps still work.
23. Test zero, one, and many carousel items, including a last page with fewer items than the visible count.
24. Test a rejected image request and a reduced-motion environment.
25. Document the component API, wrap policy, visible-item model, autoplay policy, and slider value constraints.
26. Add automated tests for index clamping, page count, and range normalization.
27. Perform a manual screen-reader check for labels, current-slide status, and range value.
28. Confirm that all controls have accessible names and a visible focus state.
29. Ensure the component does not create console errors or duplicate IDs when rendered more than once.
30. Add a short README describing known limitations, supported browsers, and the test steps used.

### Failure scenarios to inject

- Remove the final slide while it is active and verify the active index is clamped.
- Load an empty list and verify there is no “Slide 1 of 0” status.
- Make an image request fail and confirm the fallback remains understandable.
- Resize from desktop to mobile while the carousel is on its last page.
- Enable reduced motion and verify navigation still updates content immediately.
- Focus a link inside a slide, then navigate away; confirm focus is not left in hidden content.
- Drag a card that contains a link and verify a true drag does not activate the link, while a normal tap still does.
- Supply an out-of-range slider value and verify it is normalized to a valid step.
- Test a range where the minimum equals the maximum and show a fixed-value state instead of a misleading movable control.
- Start autoplay, focus a control, and verify rotation pauses without restarting against the user's explicit pause choice.

### Definition of done

- [ ] The carousel has a clear accessible name and every navigation control is a native button.
- [ ] The active index, visible item, control disabled state, and position announcement remain synchronized.
- [ ] Empty and changing collections never produce invalid indexes or misleading status messages.
- [ ] Offscreen content cannot unexpectedly receive keyboard focus.
- [ ] The interface works at 320 CSS pixels and with long content.
- [ ] Reduced-motion preferences disable nonessential motion without breaking navigation.
- [ ] Any autoplay is interruptible, has a visible control, and does not override the user's pause choice.
- [ ] The numeric slider has a label, valid constraints, keyboard behavior, and a contextual output with units.
- [ ] Pointer and touch support do not block ordinary page scrolling or taps.
- [ ] Media failures produce useful fallback content.
- [ ] Automated and manual tests cover keyboard, screen-reader, responsive, and failure states.
- [ ] No duplicate IDs, console errors, or stale carousel state remains.

### Suggested test matrix

| Scenario | Action | Expected result |
|---|---|---|
| First slide | Activate Previous | Index remains at the first item; control remains disabled if non-wrapping |
| Last slide | Activate Next | Index remains at the last item; no invalid state appears |
| Empty list | Render zero items | Empty message appears; no “1 of 0” status |
| Collection shrinks | Remove active final item | Index is clamped to a valid item |
| Keyboard carousel | Use all controls without a mouse | Focus remains visible and content is reachable |
| Hidden slide | Navigate away from a slide containing a link | Hidden link is not reachable by Tab |
| Reduced motion | Enable OS/browser reduced-motion preference | Content changes without nonessential animation |
| Failed image | Return an image error | Descriptive fallback appears |
| Range input | Use arrow keys on the range control | Value changes by the valid step |
| Invalid range value | Supply a value above maximum | Value is clamped and formatted correctly |
| Touch gesture | Swipe horizontally over the rail | Carousel responds without blocking vertical scrolling |
| Autoplay | Focus carousel controls while rotating | Rotation pauses and does not surprise the user |
