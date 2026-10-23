---
name: css-keyframe-patterns
layer: 03-animation-motion
description: Production-grade CSS keyframe animation patterns for expressive, accessible, performant interfaces.
---

# CSS Keyframe Patterns

## Why This Matters

CSS keyframes are useful when an interface needs a motion sequence that is not adequately described by a single state transition: a loading shimmer, a breathing status indicator, a reveal sequence, a looping decorative element, a notification entrance, or a progress treatment. A keyframe animation describes named points along a timeline; the browser interpolates values between those points according to the timing function and iteration rules.

Poorly designed keyframes cause specific production failures. A skeleton shimmer can create a large paint region on every frame. A notification can animate from a position that does not match its layout, then jump when the animation ends. A decorative loop can run forever in a background tab and consume battery. A loading indicator can be the only indication of progress, yet have no accessible label. A reveal can leave text permanently invisible when CSS loads but the animation never starts. A reduced-motion preference can be ignored even though the animation is nonessential. These are not cosmetic details: they affect responsiveness, accessibility, perceived reliability, and whether the interface remains understandable when animation fails.

This skill focuses on **CSS `@keyframes` patterns** and the design decisions around them. It does not treat animation as decoration added after layout. It treats motion as a timed change to an interface whose semantic meaning, fallback state, rendering cost, browser support, and interruption behavior must all be deliberate.

Use keyframes when the motion has a timeline or repeats independently of a user changing a property. Use transitions when the motion is primarily a change between two states, such as a button moving from idle to hover. Use JavaScript or a dedicated animation library when timing depends on application state, scroll position, dynamic sequencing, physics, or complex interruption. A good implementation chooses the smallest tool that fully expresses the behavior.

## Learning Outcomes

After studying this skill, you should be able to:

- Explain how keyframe offsets, timing functions, delays, fill modes, iteration counts, and direction interact.
- Compose multiple animations without accidentally overriding another animation or transform.
- Design loading, entrance, attention, progress, and decorative patterns with a meaningful static fallback.
- Animate `transform` and `opacity` by default, and justify other properties when necessary.
- Respect `prefers-reduced-motion`, keyboard interaction, focus visibility, and semantic status announcements.
- Diagnose missing, stuck, flickering, or expensive animations with browser DevTools.
- Validate syntax and behavior across Chromium, Firefox, and Safari rather than assuming support.
- Build a small animation system with tokens, reusable classes, documented contracts, and testable failure states.

## Core Concepts

### 1. Keyframe timelines and offsets

A `@keyframes` rule defines property values at timeline offsets. `from` is equivalent to `0%`; `to` is equivalent to `100%`. Intermediate offsets describe waypoints. The browser calculates values between keyframes when the property is interpolable. If a property is omitted at one offset, the browser does not automatically reset it to an assumed default; it interpolates from surrounding applicable values according to the animation model.

```css
@keyframes card-enter {
  0% {
    opacity: 0;
    transform: translateY(1rem);
  }

  70% {
    opacity: 1;
    transform: translateY(-0.125rem);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-enter {
  animation: card-enter 520ms cubic-bezier(0.2, 0.75, 0.25, 1) both;
}
```

The 70% waypoint creates a small overshoot before the final resting position. This is useful when the entrance should feel responsive rather than mechanical. Keep the overshoot small: exaggerated movement can look like a layout error, particularly on dense dashboards.

**Gotcha:** An element with `opacity: 0` in its base stylesheet remains invisible if the animation rule fails to load or the animation name is misspelled. Prefer a visible base state and animate into it when possible. If a reveal requires a hidden initial state, ensure the no-animation and reduced-motion states explicitly restore visibility.

### 2. The `animation` shorthand and its longhands

The shorthand combines name, duration, timing function, delay, iteration count, direction, fill mode, and play state. Shorthand values can be hard to audit in a large stylesheet. For complicated behavior, use custom properties or longhands to make intent clear.

```css
.status-pulse {
  animation-name: status-pulse;
  animation-duration: 1.8s;
  animation-timing-function: ease-in-out;
  animation-delay: 0ms;
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-fill-mode: both;
  animation-play-state: running;
}

@keyframes status-pulse {
  from { opacity: 0.55; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```

The shorthand parser accepts time values in a defined order-sensitive way: the first time is duration and the second time is delay. When a rule contains several comma-separated animations, each list of longhand values is matched by position; shorter lists repeat their values. This can produce surprising results when an animation is added to an existing comma-separated list.

**Gotcha:** `animation: status-pulse 1s` resets unspecified animation longhands to their initial values. Appending a shorthand in a component can therefore erase a fill mode or play state declared earlier. Inspect the final computed animation properties in DevTools.

### 3. Timing functions and interpolation

Timing functions control progress between keyframes, not the keyframe positions themselves. `linear` advances at a constant rate. `ease`, `ease-in`, `ease-out`, and `ease-in-out` are predefined curves. `cubic-bezier()` lets you shape acceleration and deceleration. `steps()` creates discrete jumps, which is appropriate for frame-by-frame sprite effects or a deliberate ticker, but usually not for a smooth interface entrance.

```css
@keyframes ticker-step {
  from { transform: translateX(0); }
  to   { transform: translateX(-100%); }
}

.ticker-track {
  animation: ticker-step 12s steps(12, end) infinite;
}
```

Use `steps()` only when discontinuity is part of the design. A stepped animation on a large object may look broken, and the number of steps should match the intended visual rhythm. For interface motion, define a small set of named easing tokens so that buttons, cards, menus, and overlays share a coherent motion language.

```css
:root {
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-enter: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

A timing function is applied to the interval between keyframes. When a rule has several segments, each segment may use its own easing by placing `animation-timing-function` on a keyframe. Avoid unexplained numeric values in animation APIs: CSS expects a keyword, a valid timing function, or another supported timing definition, not a bare number.

### 4. Duration, delay, and the perception of responsiveness

Duration is the time spent moving; delay is the wait before movement begins. They should be chosen according to meaning, not copied blindly. A small hover response should usually feel immediate. A hero sequence can afford a deliberate entrance if it does not block access to content. A status pulse can be slow and subtle. Long delays can make a control appear broken, especially when users are waiting for feedback after clicking.

```css
.button-confirmed {
  animation: confirmation-pop 260ms var(--ease-enter) both;
}

@keyframes confirmation-pop {
  0% { transform: scale(0.98); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}
```

Do not use a long animation as a substitute for real loading feedback. A fake progress loop can imply work is advancing when the application has stalled. Pair animation with accurate status text and actual progress when available. If a sequence includes multiple delays, compute the total time to first meaningful content and test it on a slow device.

**Gotcha:** A negative delay starts an animation partway through its timeline. This can be useful for offsetting repeated decorative items, but it can also cause elements to appear in an unexpected intermediate state on first paint. Document negative delays and test reloads, route transitions, and reduced-motion behavior.

### 5. Fill modes and the resting state

`animation-fill-mode` controls how animated values apply before and after the active interval. `none` leaves the element at its normal styles outside the animation. `forwards` retains the values from the last keyframe. `backwards` applies the first relevant keyframe during a delay. `both` combines backwards and forwards behavior.

```css
.toast-enter {
  animation: toast-enter 320ms var(--ease-enter) both;
}

@keyframes toast-enter {
  from { opacity: 0; transform: translateY(0.75rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

Fill mode is not a substitute for a well-defined base style. When a filled animation ends, the animated property may continue to affect the element until the animation is removed or the animation effect stops applying. This matters when changing classes, reusing DOM nodes, or switching to a different state. If the final style is a permanent application state, express that state in the component’s normal styling and use animation only to communicate the transition.

**Gotcha:** `forwards` can preserve a transformed state that conflicts with a later hover transform. Prefer a single transform composition strategy or switch to a final class/state that defines the resting transform.

### 6. Iteration count and direction

An animation may run once, a fixed number of times, or forever. `alternate` reverses direction on every other iteration. `reverse` runs the timeline backward, and `alternate-reverse` changes the initial direction before alternating. Infinite animation is appropriate for an indeterminate loading indicator or subtle ambient detail, not for every decorative object.

```css
.pulse-dot {
  animation: pulse-dot 1.6s ease-in-out infinite alternate;
}

@keyframes pulse-dot {
  from { opacity: 0.45; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1.08); }
}
```

Use infinite loops sparingly. Repeated motion can compete with reading, become tiring, and create accessibility barriers. If a loop is only decorative, hide it from assistive technology with `aria-hidden="true"`. If it communicates status, provide a text equivalent. Do not rely on color or movement alone to convey a state.

### 7. Multiple animations on one element

CSS allows multiple animations separated by commas. Each animation can target different properties, but when two animations affect the same property, composition rules and ordering matter. A common failure occurs when one animation moves an element and another animation also writes `transform`; one effect may override the other rather than adding to it.

```css
.avatar {
  animation:
    avatar-float 3s ease-in-out infinite alternate,
    avatar-fade-in 500ms ease-out both;
}

@keyframes avatar-float {
  from { transform: translateY(-0.25rem); }
  to { transform: translateY(0.25rem); }
}

@keyframes avatar-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

This works because the animations target separate properties. If two independent motions must both influence translation, put them on nested elements or define a single keyframe sequence that includes both effects. Nested wrappers are often the most predictable composition mechanism: the outer wrapper owns position, while the inner element owns scale or rotation.

```html
<article class="card-float">
  <div class="card-enter">
    <h2>Project title</h2>
    <p>Project description</p>
  </div>
</article>
```

```css
.card-float {
  animation: float-y 4s ease-in-out infinite alternate;
}

.card-enter {
  animation: enter-up 480ms var(--ease-enter) both;
}
```

Use semantic HTML for the actual content structure. Wrappers should have a clear styling or behavior purpose, not be added as arbitrary layers without ownership rules.

### 8. CSS custom properties as animation parameters

Custom properties let a component expose controlled animation values such as duration, distance, delay, and accent color. They improve reuse when the property is consumed by a normal CSS declaration or a keyframe value. Custom properties themselves do not automatically interpolate as typed numeric values unless registered with `@property` using a suitable syntax and initial value.

```css
@property --orbit-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

.orbit {
  --orbit-duration: 8s;
  animation: orbit-turn var(--orbit-duration) linear infinite;
}

@keyframes orbit-turn {
  from { --orbit-angle: 0deg; transform: rotate(0deg); }
  to   { --orbit-angle: 360deg; transform: rotate(360deg); }
}
```

Registration is useful when a custom property must interpolate as an angle, number, length, or color. However, avoid creating a custom property just to rename a value that has no meaningful variation. Define tokens at the system level, and component-level overrides only when a real use case exists.

**Gotcha:** An unregistered custom property is generally treated as a token sequence and does not interpolate like a typed number. If a custom property jumps rather than animates smoothly, check whether it has been registered and whether the browser supports the registration feature.

### 9. Shimmer and skeleton loading patterns

A shimmer is a moving highlight across a placeholder while real content is loading. The most efficient common implementation animates a pseudo-element with `transform`, rather than continuously animating `background-position` over a large area. The placeholder should preserve the approximate geometry of the eventual content to reduce layout shift.

```html
<section class="profile-skeleton" aria-busy="true" aria-label="Loading profile">
  <span class="skeleton-avatar" aria-hidden="true"></span>
  <span class="skeleton-line skeleton-line--wide" aria-hidden="true"></span>
  <span class="skeleton-line skeleton-line--short" aria-hidden="true"></span>
</section>
```

```css
.profile-skeleton {
  display: grid;
  grid-template-columns: 3rem 1fr;
  gap: 0.75rem;
  max-width: 28rem;
}

.skeleton-avatar,
.skeleton-line {
  position: relative;
  overflow: hidden;
  background: #e7e9ed;
  border-radius: 0.5rem;
}

.skeleton-avatar {
  grid-row: span 2;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
}

.skeleton-line {
  height: 0.85rem;
}

.skeleton-line--wide { width: 100%; }
.skeleton-line--short { width: 62%; }

.skeleton-line::after,
.skeleton-avatar::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, rgb(255 255 255 / 65%) 50%, transparent 80%);
  transform: translateX(-100%);
  animation: skeleton-sweep 1.4s ease-in-out infinite;
}

@keyframes skeleton-sweep {
  to { transform: translateX(100%); }
}
```

A real implementation should also include a reduced-motion override and a meaningful state transition when content is available. Do not leave `aria-busy="true"` forever. Update the status from application logic and remove skeletons once the content is ready. Skeletons should not impersonate actual text for screen readers; they are placeholders, not data.

### 10. Entrance and reveal animations

Entrance animation should support hierarchy. A heading may enter before supporting copy, followed by the primary action. However, avoid hiding essential content until an animation completes. If the animation is interrupted, disabled, or unsupported, the content must still be visible and usable.

```css
.hero-title {
  animation: hero-title-in 560ms var(--ease-enter) both;
}

.hero-copy {
  animation: hero-copy-in 480ms ease-out 100ms both;
}

.hero-actions {
  animation: hero-actions-in 440ms ease-out 180ms both;
}

@keyframes hero-title-in {
  from { opacity: 0; transform: translateY(0.8rem); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-copy-in {
  from { opacity: 0; transform: translateY(0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-actions-in {
  from { opacity: 0; transform: translateY(0.35rem); }
  to { opacity: 1; transform: translateY(0); }
}
```

Staggered entrance is appropriate for a short, bounded sequence. Large page sections should not force users to wait through a long cascade. Use CSS delays for small, fixed groups. For a dynamic list, scroll-triggered entrance, or sequence that depends on user input, use a more suitable orchestration tool rather than generating hundreds of static delay rules.

**Gotcha:** If content is hidden with `opacity: 0`, it may still be focusable and present in the accessibility tree. Avoid animating focusable controls from an inaccessible hidden state without a deliberate visibility and focus strategy. `opacity` alone does not remove an element from keyboard navigation.

### 11. Attention cues and notification motion

A brief attention cue can guide users to a newly available feature, but repeated shaking, flashing, or pulsing is distracting. Prefer one short entrance or a small change in scale over an endless urgent loop. Never use rapid flashing that could trigger photosensitive reactions.

```css
.notification {
  animation: notification-enter 360ms var(--ease-enter) both;
}

@keyframes notification-enter {
  0% { opacity: 0; transform: translateY(0.6rem); }
  75% { opacity: 1; transform: translateY(-0.08rem); }
  100% { opacity: 1; transform: translateY(0); }
}
```

For important alerts, use appropriate semantic markup and status announcements. An animated notification should not be the only means of communicating an error or success. Ensure it can be read at normal speed, does not disappear before a user can understand it, and does not steal focus unexpectedly. If it is dismissible, provide a real button with an accessible name and visible keyboard focus.

### 12. Progress, loading, and indeterminate states

Determinate progress has a measurable value. Indeterminate progress means the application cannot report a reliable percentage. Do not display a fake percentage just to make a wait appear shorter. A CSS loop can animate a bar or spinner, but application state must decide when loading begins and ends.

```html
<div class="upload-status" role="status" aria-live="polite">
  <span class="upload-spinner" aria-hidden="true"></span>
  <span>Uploading document…</span>
</div>
```

```css
.upload-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-inline-end-color: transparent;
  border-radius: 50%;
  animation: spinner-turn 700ms linear infinite;
}

@keyframes spinner-turn {
  to { transform: rotate(360deg); }
}
```

The accessible status text should be updated when the operation completes or fails. If the spinner is decorative because the status text already explains the state, mark it `aria-hidden="true"`. If a real progress value is available, prefer native `<progress>` or a correctly implemented progressbar with a value and accessible name. A loading animation is not a substitute for a timeout, retry action, or error state.

### 13. Performance, rendering pipeline, and compositor-friendly motion

The browser typically performs style calculation, layout, paint, and compositing as needed. Animating `transform` and `opacity` often allows work to be handled at the compositing stage, reducing repeated layout and paint. This is a useful default, not a guarantee: filters, clipping, large layers, blending, image content, and device constraints can still be expensive.

```css
/* Prefer moving a visual layer instead of repeatedly changing layout. */
.drawer-panel {
  transform: translateX(100%);
  opacity: 0;
  animation: drawer-enter 280ms var(--ease-enter) forwards;
}

@keyframes drawer-enter {
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

Avoid animating `top`, `left`, `width`, `height`, margin, or other layout-affecting properties on every frame unless the design genuinely requires layout to change and profiling shows it is acceptable. If an element needs to expand its actual layout footprint, a height animation may be justified, but it should be measured and tested rather than assumed cheap.

Use `will-change` only after profiling identifies a problem or a browser benefits from a known upcoming change. It can allocate memory and promote layers unnecessarily when applied to every card. Remove it when the animation is over if it is set dynamically. Inspect the Performance panel and paint flashing in DevTools to see whether a motion causes repeated paint or layout.

**Gotcha:** A transform animation can still be janky if it moves a huge, high-resolution layer, triggers expensive filters, or creates too many compositor layers. “Uses transform” is not the same as “free.”

### 14. Accessibility, reduced motion, and resilient fallbacks

Motion should respect the operating-system preference expressed by `prefers-reduced-motion`. For nonessential animation, disable looping and large movement, and restore any hidden content. A reduced-motion alternative may use a short opacity change or no animation at all. Do not assume that all users who prefer reduced motion want every transition removed; the appropriate response depends on whether motion conveys necessary information.

```css
@media (prefers-reduced-motion: reduce) {
  .profile-skeleton::after,
  .profile-skeleton *,
  .upload-spinner,
  .decorative-orbit,
  .ambient-float {
    animation: none !important;
  }

  .hero-title,
  .hero-copy,
  .hero-actions,
  .notification,
  .drawer-panel {
    animation: none !important;
    opacity: 1;
    transform: none;
  }
}
```

```css
/* Preserve a visible keyboard indicator regardless of animation. */
button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 3px solid #245fe8;
  outline-offset: 3px;
}
```

Test the page with reduced motion enabled in the operating system or browser emulation. Also test with CSS disabled, animation names deliberately misspelled, slow CPU throttling, and a keyboard-only path. The interface must remain usable if the animation never starts.

## Six Named Patterns

### Pattern 1 — One-shot entrance

**What it does:** Reveals a new, already available element with a short opacity and translation sequence.

**When to use:** Hero copy, a newly inserted card, a non-blocking notification, or a dialog that has already been made available to the user.

```css
@keyframes entrance-up {
  from { opacity: 0; transform: translateY(0.75rem); }
  to { opacity: 1; transform: translateY(0); }
}

.entrance-up {
  animation: entrance-up 420ms var(--ease-enter) both;
}

@media (prefers-reduced-motion: reduce) {
  .entrance-up {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

Keep the base state visible wherever possible. If the component is hidden before insertion, make visibility part of component state rather than relying only on animation fill mode.

### Pattern 2 — Skeleton shimmer

**What it does:** Moves a highlight across a placeholder to suggest that content is being fetched.

**When to use:** Only while a real loading state is active and the placeholder approximates the final content geometry.

```css
.skeleton {
  position: relative;
  overflow: hidden;
  background: #e8eaf0;
  border-radius: 0.5rem;
}

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent, rgb(255 255 255 / 70%), transparent);
  transform: translateX(-100%);
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  to { transform: translateX(100%); }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; }
}
```

Keep the static skeleton visible if motion is disabled. The shimmer is optional decoration; the placeholder’s shape provides the loading cue.

### Pattern 3 — Breathing status indicator

**What it does:** Gently changes opacity or scale to indicate a continuing state without a high-energy flash.

**When to use:** A live connection or ongoing background process when the state is also described in text.

```css
@keyframes status-breathe {
  from { opacity: 0.65; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}

.status-indicator {
  animation: status-breathe 1.8s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .status-indicator { animation: none; opacity: 1; transform: none; }
}
```

Do not communicate the state by color or animation alone. Pair it with a visible label such as “Connected” or “Syncing.”

### Pattern 4 — Staggered fixed group

**What it does:** Gives a small group of related elements a coordinated entrance.

**When to use:** Three to six fixed hero elements or a compact feature list whose sequence is part of the visual hierarchy.

```css
.feature-item {
  animation: entrance-up 420ms var(--ease-enter) both;
}

.feature-item:nth-child(1) { animation-delay: 0ms; }
.feature-item:nth-child(2) { animation-delay: 70ms; }
.feature-item:nth-child(3) { animation-delay: 140ms; }
.feature-item:nth-child(4) { animation-delay: 210ms; }

@media (prefers-reduced-motion: reduce) {
  .feature-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

Do not create a delay of several seconds for later items. For dynamic or long lists, use JavaScript or a motion library only if the choreography materially improves the experience.

### Pattern 5 — Spinner for indeterminate work

**What it does:** Rotates a simple ring while an operation is underway and its percentage is unknown.

**When to use:** A short request, upload, or navigation action with an adjacent status label.

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  width: 1rem;
  aspect-ratio: 1;
  border: 2px solid currentColor;
  border-inline-end-color: transparent;
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}
```

Provide a static ring or another non-motion indication when reduced motion is active. Ensure the status changes to success or failure, and avoid infinite loading when the request has timed out.

### Pattern 6 — Attention entrance with restrained overshoot

**What it does:** Adds a small, controlled overshoot at the end of an entrance so the element feels less rigid.

**When to use:** A toast, a small confirmation badge, or a lightweight decorative element—not a persistent warning or a critical error.

```css
@keyframes soft-pop {
  0% { opacity: 0; transform: scale(0.96); }
  78% { opacity: 1; transform: scale(1.015); }
  100% { opacity: 1; transform: scale(1); }
}

.soft-pop {
  animation: soft-pop 360ms var(--ease-enter) both;
}

@media (prefers-reduced-motion: reduce) {
  .soft-pop { animation: none; opacity: 1; transform: none; }
}
```

Keep the overshoot small and the sequence short. Avoid repeated shaking, rapid flashing, or motion that obscures the message.

## Reusable Implementation Example

The following example combines a visible loading state, a skeleton, a reduced-motion fallback, and a success state. The JavaScript is intentionally small: CSS owns the visual timeline, while application state owns whether content is loading or available.

```html
<section class="profile-panel" aria-labelledby="profile-heading">
  <h2 id="profile-heading">Account profile</h2>

  <div id="profile-loading" class="profile-skeleton" aria-busy="true">
    <span class="skeleton skeleton-avatar" aria-hidden="true"></span>
    <span class="skeleton skeleton-line" aria-hidden="true"></span>
    <span class="skeleton skeleton-line skeleton-line--short" aria-hidden="true"></span>
    <p class="sr-only" role="status">Loading account profile…</p>
  </div>

  <article id="profile-content" class="profile-content" hidden>
    <h3>Varad</h3>
    <p>Profile loaded successfully.</p>
  </article>
</section>
```

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.profile-skeleton {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr);
  gap: 0.75rem;
}

.skeleton {
  position: relative;
  overflow: hidden;
  display: block;
  min-height: 0.9rem;
  background: #e8eaf0;
  border-radius: 0.5rem;
}

.skeleton-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  grid-row: span 2;
}

.skeleton-line--short { width: 60%; }

.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent, rgb(255 255 255 / 70%), transparent);
  transform: translateX(-100%);
  animation: shimmer 1.5s ease-in-out infinite;
}

.profile-content:not([hidden]) {
  animation: entrance-up 400ms var(--ease-enter) both;
}

@keyframes shimmer {
  to { transform: translateX(100%); }
}

@keyframes entrance-up {
  from { opacity: 0; transform: translateY(0.5rem); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton::after,
  .profile-content:not([hidden]) {
    animation: none;
  }

  .profile-content:not([hidden]) {
    opacity: 1;
    transform: none;
  }
}

.profile-panel button:focus-visible,
.profile-panel a:focus-visible {
  outline: 3px solid #245fe8;
  outline-offset: 3px;
}
```

```js
const loadingPanel = document.querySelector("#profile-loading");
const profileContent = document.querySelector("#profile-content");

function showProfileLoaded() {
  loadingPanel.hidden = true;
  loadingPanel.setAttribute("aria-busy", "false");
  profileContent.hidden = false;
}

function showProfileError(message) {
  loadingPanel.hidden = true;
  loadingPanel.setAttribute("aria-busy", "false");

  const status = document.createElement("p");
  status.setAttribute("role", "alert");
  status.textContent = message;
  profileContent.replaceChildren(status);
  profileContent.hidden = false;
}

console.info("Profile animation states", {
  loadingExists: Boolean(loadingPanel),
  contentExists: Boolean(profileContent),
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
});
```

In a production application, call `showProfileLoaded()` only after the real request succeeds, and call `showProfileError()` for an actual failure. Do not simulate success using an arbitrary timer. If the request can be cancelled, ensure the UI does not reveal stale content after cancellation. For a single-page application, tie these state changes to the framework’s data lifecycle and clean up subscriptions when the component unmounts.

## Debugging Workflow

1. Reproduce the issue in a minimal page with the same animation rule and the same element dimensions.
2. Inspect the element in browser DevTools and verify that the expected class is present.
3. Check the computed `animation-name`, `animation-duration`, `animation-delay`, `animation-iteration-count`, `animation-fill-mode`, and `animation-play-state`.
4. Confirm the keyframe name matches exactly and the stylesheet containing the rule has loaded.
5. Check whether a later shorthand declaration resets a longhand property.
6. Inspect whether another animation or transition writes the same property.
7. Temporarily remove filters, shadows, blending, and large background images to isolate paint costs.
8. Record a Performance trace while the animation runs; inspect long frames, style recalculation, layout, paint, and compositing activity.
9. Enable paint flashing or layer visualization where available to identify large repaint regions and excessive compositor layers.
10. Emulate reduced motion and confirm content remains visible and controls remain usable.
11. Test keyboard navigation while entrance animations are active; verify focus indicators are not clipped or covered.
12. Repeat in current Chromium, Firefox, and Safari, including a narrow viewport and a touch device.

A small diagnostic helper can make the computed state easier to inspect:

```js
function inspectAnimation(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    console.warn(`No element found for selector: ${selector}`);
    return null;
  }

  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  const report = {
    selector,
    animationName: style.animationName,
    animationDuration: style.animationDuration,
    animationDelay: style.animationDelay,
    animationIterationCount: style.animationIterationCount,
    animationFillMode: style.animationFillMode,
    animationPlayState: style.animationPlayState,
    opacity: style.opacity,
    transform: style.transform,
    width: rect.width,
    height: rect.height
  };

  console.table(report);
  return report;
}

inspectAnimation(".profile-content");
```

Use the helper after the page has loaded and after the relevant state change. A computed style tells you the resolved declaration, not necessarily whether the animation is progressing or visually performant. Use the Animations panel or a Performance trace for timeline and frame diagnostics.

## Mistakes and Fixes

| Mistake | Why it fails | Specific fix |
|---|---|---|
| Animating `top` for a simple entrance | It can trigger layout on every frame. | Replace positional movement with `transform: translateY()`. |
| Hiding base content with `opacity: 0` | Content can remain invisible when animation fails. | Keep the base state visible and define a reduced-motion fallback. |
| Using `animation-fill-mode: forwards` as permanent state | The effect may conflict with later component states. | Apply the final state through the component class after the entrance. |
| Reusing `transform` in unrelated animations | One animation can overwrite another transform. | Put each motion on a nested wrapper or combine the transforms in one keyframe rule. |
| Setting `animation: ...` after longhands | The shorthand resets omitted longhand values. | Declare the shorthand first or explicitly include every required value. |
| Running every decorative loop forever | Continuous movement distracts and consumes resources. | Use one-shot animation or stop the loop when it is not meaningful. |
| Applying `will-change` to every card | It can allocate too many compositor layers. | Add it only after profiling and remove it when no longer needed. |
| Animating a huge shimmering background | Large paint regions can produce frame drops. | Use a bounded pseudo-element translated with `transform`. |
| Using a spinner without status text | Users and assistive technology may not know what is happening. | Add a live status message with a clear action description. |
| Showing fake percentage progress | It communicates false information. | Use an indeterminate indicator until real progress data exists. |
| Ignoring reduced-motion preferences | Nonessential motion can cause discomfort. | Add a topic-specific `prefers-reduced-motion` rule and test it. |
| Making a focused control transparent | It may still receive focus while appearing absent. | Keep focusable elements visible and coordinate visibility with state. |
| Using long entrance delays | Users can interpret the page as unresponsive. | Keep delays short and ensure content is available immediately. |
| Using rapid flashing for attention | It can create accessibility and safety risks. | Use one restrained opacity/transform entrance instead. |
| Assuming transform guarantees 60 FPS | Large layers and effects can still be expensive. | Profile on target devices and simplify costly layers or filters. |
| Never testing Safari | Timing, rendering, and newer feature support can differ. | Test current Safari, Firefox, and Chromium and use feature detection where needed. |
| Leaving `aria-busy="true"` after loading | Assistive technology may receive a permanently busy state. | Update the attribute when loading succeeds, fails, or is cancelled. |
| Animating hidden content into view without checking state | A stale animation may reveal outdated content. | Tie visibility to the current request or component state. |

## Mental Models

1. **A keyframe is a waypoint, not a command to teleport.** The browser interpolates between specified values according to the timeline and easing. When motion looks wrong, inspect the values and timing of each segment.
2. **The base style is the fallback contract.** An animation can be disabled, unsupported, interrupted, or delayed. The interface must still communicate the correct state.
3. **One property needs one clear owner.** If several effects write `transform`, define a composition strategy instead of hoping the cascade will combine them.
4. **Motion has a rendering cost.** Transform and opacity are good defaults, but the actual cost depends on layer size, effects, device, and surrounding rendering work.
5. **Infinite motion needs a reason.** A loop should communicate ongoing status or add meaningful ambient character. Otherwise, prefer a finite animation.
6. **Accessibility is part of the animation design.** Reduced-motion preferences, semantic status, keyboard focus, and visible fallbacks are not post-launch patches.
7. **CSS owns presentation; application state owns truth.** CSS can animate a loading indicator, but JavaScript or the application framework must decide whether the operation is loading, successful, failed, or cancelled.
8. **A smooth desktop recording is not proof of production readiness.** Test slower devices, different browsers, touch input, zoom, and reduced motion.
9. **The end state should be explicit.** Fill mode can hold a final frame, but a component’s normal styles should describe its resting state.
10. **Animation should never be the only signal.** Status, error, success, and progress need text or semantic equivalents that survive stillness.
11. **Shorter is usually clearer.** A motion sequence should help users understand a change, not make them wait for the interface.
12. **Measure before optimizing.** Use DevTools traces and paint diagnostics to locate the actual bottleneck rather than adding `will-change` everywhere.

## Browser Support and Compatibility

`@keyframes`, the `animation` shorthand, transforms, opacity, and `prefers-reduced-motion` are broadly supported in modern Chromium, Firefox, and Safari. More specialized capabilities, such as typed custom properties registered with `@property`, can have different support histories and edge cases. Verify current compatibility data on Can I Use and test the actual browser versions supported by the project.

Use feature detection for optional enhancements:

```css
@supports (animation-timeline: view()) {
  /* Optional scroll-driven enhancement belongs here, not in a required keyframe fallback. */
}
```

The feature-detection example above is for an optional scroll-driven enhancement, not a replacement for ordinary keyframe animation. Keep required information visible when an enhancement is unsupported. For `@property`, test the registered property in the target browsers and provide a simpler transform or opacity animation as a fallback. Avoid adding vendor-prefixed declarations without a demonstrated target-browser need; validate support requirements against your audience and project policy.

Browser-support checklist:

- Current Chromium: verify keyframe timing, computed styles, compositing, and reduced-motion emulation.
- Current Firefox: verify animation fill behavior, layout interactions, focus indicators, and any registered custom properties.
- Current Safari on macOS and iOS: verify first paint, touch behavior, animation lifecycle during tab changes, and viewport changes.
- Narrow viewports: ensure transformed content does not become clipped or overlap essential controls.
- Zoom and text scaling: verify the animated element still fits and remains readable.
- Background tabs: ensure the application does not depend on an animation callback as the sole way to finish important work.
- Unsupported enhancements: preserve visible content and a meaningful nonanimated state.

## Build Challenge — Production Motion Kit

Build a reusable CSS keyframe motion kit for a fictional account dashboard. It must include a profile skeleton, a one-shot entrance for loaded content, a notification entrance, a status indicator, and a spinner. The goal is not to add as much motion as possible; the goal is to make each motion explain a state while preserving performance, accessibility, and fallback behavior.

### Requirements

1. Create a `motion.css` file with named easing and duration custom properties.
2. Implement at least five keyframe animations with descriptive names.
3. Implement a skeleton shimmer using a pseudo-element and transform-based movement.
4. Implement a one-shot entrance that ends in a stable visible state.
5. Implement a restrained notification entrance without rapid flashing or repeated shaking.
6. Implement an indeterminate spinner paired with accessible status text.
7. Add a status indicator whose meaning is also expressed in text.
8. Provide a `prefers-reduced-motion: reduce` media query that disables nonessential loops and restores visible content.
9. Include at least two `:focus-visible` code rules for interactive controls.
10. Use semantic HTML such as `main`, `section`, `article`, `h1` or `h2`, `button`, and `p` where appropriate; do not build the whole interface from generic containers.
11. Ensure decorative animation layers are marked `aria-hidden="true"` and status content uses an appropriate semantic announcement.
12. Keep base content usable if animation CSS fails to load.
13. Use transform and opacity for routine motion; justify and profile any exception.
14. Write a JavaScript helper that reports computed animation properties and element dimensions.
15. Test the implementation in Chromium, Firefox, and Safari, recording any compatibility differences.
16. Test keyboard-only navigation and verify focus indicators remain visible during and after motion.
17. Test reduced-motion behavior and confirm no essential information disappears.
18. Simulate a loading failure and ensure the UI shows a useful error instead of an endless spinner.
19. Simulate a request completing before the entrance sequence ends and verify stale loading content does not remain visible.
20. Profile the shimmer on a throttled CPU and remove unnecessary effects if frame time degrades.

### Required failure scenarios

- Rename one keyframe incorrectly. Confirm the content remains visible and diagnose the computed `animation-name`.
- Enable reduced motion. Confirm loops stop and hidden content is restored.
- Force a request failure. Confirm the spinner ends and an accessible error is announced.
- Add a second animation that also writes `transform`. Identify the conflict and resolve it using nested elements or a unified keyframe rule.
- Apply a deliberately expensive filter to the shimmer, record the performance trace, then remove it and compare the result.

### Definition of Done

- [ ] All five motion components have a meaningful nonanimated state.
- [ ] Every animation name is defined and all durations and easing values are intentional.
- [ ] No routine animation causes unnecessary layout work.
- [ ] Reduced-motion mode removes nonessential movement without hiding content.
- [ ] Keyboard focus remains visible and operable.
- [ ] Loading, success, failure, and cancellation states are distinguishable.
- [ ] Decorative elements do not create redundant screen-reader output.
- [ ] The debug helper reports the relevant computed values without throwing when an element is absent.
- [ ] Browser and mobile checks are documented.
- [ ] Performance has been measured on at least one throttled run.
- [ ] The failure scenarios have been tested and their outcomes recorded.
- [ ] The stylesheet contains no invented CSS properties or invalid animation syntax.

## Quick Reference

| Situation | Recommended approach | Watch out for |
|---|---|---|
| Element appears for the first time | Short opacity and transform keyframes | Hidden base state if animation fails |
| Placeholder while fetching data | Pseudo-element shimmer | Large repaint area and endless loading |
| Small live status | Gentle opacity/scale pulse | Animation as the only status signal |
| Small fixed group enters | Short stagger delays | Excessive total wait time |
| Unknown-duration operation | Spinner plus live status | Fake progress percentages |
| Confirmation toast | One-shot soft entrance | Stealing focus or disappearing too soon |
| Motion must stop for accessibility | `prefers-reduced-motion` override | Forgetting to restore visibility |
| Two animations affect transform | Nested wrappers or one timeline | Transform override conflicts |
| Animation ends in the wrong position | Review fill mode and base style | Permanent reliance on `forwards` |
| Animation is janky | Performance trace and paint diagnostics | Assuming transform makes everything free |
| Animation does not start | Inspect class, stylesheet, name, and computed values | Shorthand resetting longhands |
| Custom property jumps | Register a typed property where supported | Assuming all custom properties interpolate |
| A status spinner never ends | Tie UI to success, error, and cancellation | CSS animation mistaken for operation state |
| Keyboard focus seems absent | Inspect opacity, clipping, and focus rules | Invisible but focusable elements |
| Safari behaves differently | Test target Safari versions directly | Relying on desktop Chromium only |
| Long decorative loop distracts | Prefer a finite sequence or static state | Infinite motion without user benefit |

## Delivery Notes

Treat this document as an implementation guide, not a mandate to animate every component. For a production project, document the motion tokens, the owner of each animated property, the reduced-motion behavior, and the failure fallback. Keep each effect small enough to understand in isolation, then test the combined page because several individually inexpensive animations can become expensive when they run together.

Before shipping, review the page at normal speed, with reduced motion, with keyboard navigation, on a touch viewport, and under CPU throttling. Inspect DevTools for unexpected layout or paint work. If a keyframe sequence does not improve comprehension, hierarchy, or feedback, remove it. The best motion system is not the one with the most effects; it is the one whose effects remain intentional, predictable, accessible, and fast.
