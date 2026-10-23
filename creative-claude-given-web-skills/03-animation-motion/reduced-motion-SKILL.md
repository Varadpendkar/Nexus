# Reduced Motion — Production Skill

## Why This Matters

Motion can clarify state, direct attention, and make interactions feel responsive. It can also trigger discomfort, distraction, vestibular symptoms, or cognitive overload for some users. A production interface must not assume that every person wants movement, and it must not make content or functionality depend on animation completing.

Reduced motion is not a request to remove all feedback or make an interface feel broken. It is a design mode that preserves meaning and usability while reducing unnecessary travel, parallax, large-scale movement, auto-playing motion, and prolonged transitions. In many cases, a short opacity change or an immediate state change is sufficient. The right decision depends on the interaction, user preference, and whether motion conveys essential information.

This skill covers the `prefers-reduced-motion` media feature, JavaScript animation libraries, system settings, focus and scroll behavior, motion-heavy interfaces, testing, performance, and graceful fallback. The core rule is simple: the final state must remain correct, readable, and interactive when motion is removed.

### 1. Mental Models

1. **Preference is input, not an afterthought.** Motion policy should be considered while designing the interaction, not added after the animation is complete.
2. **Reduce movement, preserve meaning.** A menu can still open, a result can still appear, and progress can still be communicated without large spatial motion.
3. **No animation may mean immediate state change.** It must not mean hidden content, delayed functionality, or missing feedback.
4. **CSS and JavaScript are separate control surfaces.** A CSS media query does not necessarily override inline animation values set by a library.
5. **The system preference is a default, not a personal diagnosis.** Respect it without inferring medical information or asking users to explain why.
6. **Essential information must not depend on movement.** A chart, warning, or status change should be understandable in a static view.
7. **Timing and travel are different.** A user may benefit from a shorter duration, no spatial travel, no stagger, or an immediate final state.
8. **Reduced motion applies to the whole experience.** Scroll behavior, video, canvas, SVG, page transitions, carousels, and decorative backgrounds all need review.
9. **A preference change should be safe.** Switching the setting while a page is open should not leave elements stuck in intermediate states.
10. **Test the rendered outcome.** A media query appearing in source code does not prove the actual interface is accessible.

### 2. CSS `prefers-reduced-motion`

Use the `prefers-reduced-motion` media feature to adapt CSS animation and transition behavior. A common approach is to provide the normal motion by default and override non-essential movement for users who request reduced motion.

```css
.card {
  opacity: 1;
  transform: translateY(0);
  transition:
    transform 180ms ease-out,
    opacity 180ms ease-out;
}

.card[data-entering="true"] {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card[data-entering="true"] {
    opacity: 1;
    transform: none;
    transition: none;
    animation: none;
  }
}
```

Be careful with initial styles. If a component begins at `opacity: 0`, removing the animation alone can leave it invisible. The reduced-motion rule should set the final visible state, or the base state should remain visible until the animation enhancement is activated.

Use the media feature for non-essential motion, not as a way to remove visible focus, hover affordances, or other important interaction feedback. Reduced motion does not mean remove every transition in every case; it means make movement choices that respect the preference and preserve usability.

**Gotcha:** `animation: none` does not automatically reset opacity or transforms. Inspect the final computed style and ensure content is visible.

### 3. Reduce Travel Before Removing All Feedback

Large spatial movement often contributes more to motion load than a subtle state change. Replace full-screen slides, parallax, zooms, or large translations with immediate state changes, restrained opacity, or a static layout. For many interfaces, removing travel and long delays is more useful than eliminating every small visual response.

```css
.dialog {
  opacity: 1;
  transform: none;
  transition: opacity 140ms ease-out;
}

.dialog[data-opening="true"] {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .dialog,
  .dialog[data-opening="true"] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

The normal mode can use modest travel, but the reduced-motion mode removes the spatial change and exposes the final state immediately. For a real dialog, also manage focus, `aria-modal`, the accessible name, and background inertness according to the dialog pattern.

### 4. JavaScript Preference Detection

JavaScript-driven animation needs an equivalent policy. `window.matchMedia("(prefers-reduced-motion: reduce)")` provides the current match and a way to observe changes. In component frameworks, use the framework or animation library's supported hook where possible.

```js
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyMotionPreference() {
  document.documentElement.dataset.motionPreference =
    motionQuery.matches ? "reduce" : "full";
}

applyMotionPreference();
motionQuery.addEventListener("change", applyMotionPreference);
```

If the listener is installed inside a component or a short-lived page module, remove it during cleanup. A global listener can be appropriate for a central motion service, but it should be registered once rather than every time a child component renders. Test the exact listener API in the browsers supported by the application.

```js
function subscribeToMotionPreference(onChange) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handleChange = event => onChange(event.matches);

  onChange(query.matches);
  query.addEventListener("change", handleChange);

  return () => query.removeEventListener("change", handleChange);
}
```

Do not store or log a user's preference unless there is a clear product need and an appropriate privacy basis. It is usually enough to use the setting locally to choose the presentation.

### 5. Framer Motion / Motion for React

Animation libraries may offer a reduced-motion hook or configuration. For Framer Motion, `useReducedMotion` is a common option; API details can differ by package version and whether the project uses the `framer-motion` or `motion` package. Verify the installed version's documentation.

```jsx
import { motion, useReducedMotion } from "framer-motion";

export function MotionCard({ children }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.18,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.article>
  );
}
```

The initial state is disabled when reduced motion is requested, so the component does not begin hidden and wait for a transition. For larger applications, a central motion configuration can make the policy consistent, but test whether the installed library updates its preference dynamically and whether existing animations are adjusted when the setting changes.

**Gotcha:** Setting a transition duration to zero is not sufficient if the component's initial variant still places it at opacity zero or far off-screen.

### 6. GSAP and Imperative Animations

GSAP timelines are often authored imperatively, so the application must choose how to build or run them when reduced motion is active. A useful pattern is to create the timeline only for full motion, and otherwise apply the final state immediately. If the preference changes while a timeline is running, kill or finish the timeline and set the final state.

```js
const query = window.matchMedia("(prefers-reduced-motion: reduce)");
let timeline;

function renderEntrance() {
  timeline?.kill();

  if (query.matches) {
    gsap.set(".feature", { clearProps: "all" });
    gsap.set(".feature", { opacity: 1, y: 0 });
    return;
  }

  timeline = gsap.timeline();
  timeline.from(".feature", {
    opacity: 0,
    y: 12,
    duration: 0.18,
    stagger: 0.04,
    ease: "power2.out"
  });
}

renderEntrance();
query.addEventListener("change", renderEntrance);
```

In production, scope selectors to the component instance, clean up listeners and timelines on unmount, and avoid `clearProps: "all"` if it removes styles owned by another system. The sample illustrates policy, not a universal selector or lifecycle strategy. Use the framework integration and context cleanup recommended by the installed GSAP version.

### 7. Smooth Scrolling and Scroll-Driven Motion

Smooth scrolling can create prolonged motion even when component animations respect reduced motion. CSS `scroll-behavior: smooth`, JavaScript `scrollTo({ behavior: "smooth" })`, and third-party smooth-scroll libraries should all be considered.

```css
html {
  scroll-behavior: smooth;
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
}
```

If JavaScript explicitly requests smooth scrolling, a CSS override may not be sufficient. Check the preference before requesting smooth behavior and choose `"auto"` when reduced motion is active. For scroll-driven animations, avoid large parallax and scale effects; use static or restrained states when motion is reduced.

A smooth-scroll library may own a requestAnimationFrame loop. Disable or configure that loop using the library's documented API, rather than assuming the CSS media query controls it.

### 8. Stagger, Carousels, and Auto-Playing Content

A long stagger can make important content appear slowly, and autoplaying carousels or background loops can create continuous movement. Under reduced motion, remove unnecessary stagger, stop autoplay where appropriate, and expose all content without requiring the user to wait for a sequence.

```css
.result-item {
  animation: result-in 160ms ease-out both;
  animation-delay: calc(var(--item-index, 0) * 30ms);
}

@media (prefers-reduced-motion: reduce) {
  .result-item {
    animation: none;
    animation-delay: 0ms;
    opacity: 1;
    transform: none;
  }
}
```

For carousels, provide manual controls with clear accessible names and state. Avoid moving focus automatically when a slide changes. If autoplay exists, provide a way to pause or stop it and consider disabling automatic movement for reduced-motion users. Keep text and controls usable when animation is skipped.

### 9. SVG, Canvas, and Decorative Backgrounds

CSS media queries may not stop animation loops implemented in JavaScript, canvas, WebGL, or SVG SMIL. Each animation system needs an explicit reduced-motion path. For canvas, stop or simplify the frame loop; for SVG, remove or disable animated transforms and preserve a static representation.

```js
const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let frameId = 0;

function drawFrame() {
  // Draw a single frame using the current application state.
}

function startCanvasMotion() {
  cancelAnimationFrame(frameId);
  if (reduceQuery.matches) {
    drawFrame();
    return;
  }

  const tick = () => {
    drawFrame();
    frameId = requestAnimationFrame(tick);
  };
  frameId = requestAnimationFrame(tick);
}

startCanvasMotion();
reduceQuery.addEventListener("change", startCanvasMotion);
```

This sample is intentionally minimal. A real animation loop should use elapsed time, clean up on unmount, and ensure that a preference change cancels any scheduled frame. Do not create multiple concurrent loops after repeated calls. Decorative motion should never be the only carrier of essential status or information.

### 10. Video, GIFs, and Embedded Motion

A CSS media query cannot reliably stop a GIF or every embedded video. For motion-heavy video, provide user controls and consider a static poster or alternative content. Autoplay should be avoided unless there is a clear reason and the behavior is appropriate for the product. Never rely on a moving visual alone to communicate information.

```html
<figure>
  <video controls muted playsinline poster="/media/preview.jpg">
    <source src="/media/overview.mp4" type="video/mp4">
    <track kind="captions" src="/media/overview-en.vtt" srclang="en" label="English">
  </video>
  <figcaption>Product overview. Captions are available.</figcaption>
</figure>
```

For reduced-motion users, consider not autoplaying the video and provide a static preview. The exact behavior should match the content and user controls. Captions and an accessible name are important for media, but they do not replace a static alternative when the motion itself is the problem.

### 11. Focus, Hover, and Interaction Feedback

Reduced motion should preserve feedback that helps users understand interaction. A button can change color, border, or shadow without sliding across the screen. Keep keyboard focus visible with `:focus-visible`; do not remove outlines as part of a global motion reset.

```css
.button {
  border: 2px solid currentColor;
  transition: background-color 120ms ease, color 120ms ease;
}

.button:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }
}
```

Ensure hover is not the only signal of interactivity. Touch devices may not have hover, and keyboard users need a visible focus indicator. Do not move focus automatically because an animation begins or completes. If a dialog or menu changes state, update its semantics and focus policy independently of motion.

### 12. React Lifecycle and Cleanup

Preference listeners and animation instances have lifecycles. A component should not leave behind event listeners, requestAnimationFrame loops, or timelines after unmounting. In React, use an effect with cleanup or the library's recommended hook.

```jsx
import { useEffect, useState } from "react";

export function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = event => setReduced(event.matches);

    setReduced(query.matches);
    query.addEventListener("change", update);

    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}
```

For server-rendered applications, the browser's `window` is not available during server rendering. Initialize with a safe default, then synchronize after mount, or use a library hook designed for server rendering. Avoid rendering essential content hidden based on a client-only preference before the preference is known.

**Gotcha:** Development Strict Mode may mount, clean up, and mount effects again. Cleanup must be complete so listeners and animation loops are not duplicated.

### 13. Runtime Preference Changes

Users can change operating-system accessibility preferences while the page is open. A robust interface listens for changes and updates future animation behavior. For an active timeline, decide whether to finish it immediately, stop it at a safe final state, or replace it with a static representation.

```js
function attachMotionPolicy(query, { finish, restart }) {
  const onChange = event => {
    if (event.matches) {
      finish();
    } else {
      restart();
    }
  };

  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
```

The callbacks must be supplied by the animation owner. Do not restart a decorative animation just because the user switches from reduced motion to full motion; restarting may surprise them. Usually, apply the new policy to future interactions and settle any current animation safely.

### 14. CSS Architecture for Motion Policy

Avoid scattering contradictory reduced-motion overrides throughout a large stylesheet. Define a small policy layer with clear tokens and component-specific overrides. A global reset can be useful as a last line of defense, but it cannot solve every hidden initial state or JavaScript-driven animation.

```css
:root {
  --motion-duration-fast: 120ms;
  --motion-duration-standard: 180ms;
  --motion-distance-small: 6px;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-standard: 0ms;
    --motion-distance-small: 0px;
  }
}

.motion-enter {
  transition:
    opacity var(--motion-duration-standard) ease-out,
    transform var(--motion-duration-standard) ease-out;
}
```

Tokens can reduce the number of places that need editing, but a zero duration token does not override every keyframe, inline style, third-party library, or animated media element. Audit the actual motion inventory and test each category. Keep the static final state explicit.

### 15. Avoid Motion-Heavy Patterns by Default

Large parallax, scroll-jacking, full-screen zooms, looping backgrounds, and long staggered entrances can be costly and distracting. If these effects are essential to a brand or narrative, offer a static alternative and make the reduced-motion path deliberate. Prefer motion that communicates a change in state over motion that exists only to attract attention.

```css
.hero-art {
  transform: none;
}

@media (prefers-reduced-motion: no-preference) {
  .hero-art.is-active {
    animation: hero-drift 8s ease-in-out infinite alternate;
  }
}

@keyframes hero-drift {
  from { transform: translateY(-4px); }
  to { transform: translateY(4px); }
}
```

The `no-preference` query makes the decorative loop opt-in for users whose settings allow motion. A loop still needs a product reason, and its duration and distance should be restrained. Avoid adding `will-change` without measuring; too many compositor layers can increase memory usage.

### 16. Browser Support and Progressive Enhancement

The `prefers-reduced-motion` media feature is supported in modern browsers, but test the project's actual support matrix. Check current browser support and caniuse when older devices or embedded webviews are in scope. Keep a functional static interface if the preference query is unavailable or ignored by a third-party animation system.

```css
@supports (transition: opacity 100ms) {
  .enhanced-motion {
    transition: opacity 100ms ease-out;
  }
}

@media (prefers-reduced-motion: reduce) {
  .enhanced-motion {
    transition: none;
  }
}
```

`@supports` checks CSS feature support, not whether a user prefers reduced motion. Keep these responsibilities distinct. Verify behavior in Safari, Firefox, and Chromium-based browsers, especially when CSS and JavaScript animation systems share the same component.

### 17. Debugging the Actual Rendered State

Debug the rendered interface, not only the source. In DevTools, inspect computed opacity, transform, animation name, transition duration, and delay. Toggle reduced motion and confirm that content is visible, focus remains meaningful, and scroll behavior is immediate where expected. For JavaScript animations, inspect active timelines and pending requestAnimationFrame callbacks.

```js
function auditMotionState(element, label = "motion element") {
  if (!element) {
    console.warn(`${label}: element not found`);
    return null;
  }

  const style = getComputedStyle(element);
  const report = {
    label,
    opacity: style.opacity,
    transform: style.transform,
    animationName: style.animationName,
    animationDuration: style.animationDuration,
    transitionDuration: style.transitionDuration
  };

  console.table(report);
  return report;
}
```

Debug sequence:
1. Toggle the operating system or DevTools reduced-motion setting.
2. Inspect the element's computed style and check whether an inline style wins.
3. Confirm that the final state is visible with animation disabled.
4. Check JavaScript listeners and library-specific reduced-motion settings.
5. Verify that no requestAnimationFrame loop continues unnecessarily.
6. Test keyboard focus during open, close, route change, and content removal.
7. Use the Performance panel to check paint, reflow, layers, and jank.
8. Test Safari, Firefox, and Chromium-based browsers.

**Gotcha:** A CSS media query may correctly disable a transition while a JavaScript library continues writing transform values every frame. Test each animation owner independently.

### 18. Performance and Motion Budget

Reduced motion is an accessibility preference, while performance is a separate concern. A performant animation can still be uncomfortable, and a reduced-motion mode can still be computationally wasteful if a canvas loop continues drawing off-screen. Handle both requirements.

Prefer transform and opacity for necessary motion. Avoid animating `top`, `left`, `width`, or `height` every frame unless the design requires layout changes and the cost has been measured. Watch for reflow, repaint, GPU layer proliferation, and jank in DevTools Performance. `will-change` should be applied sparingly and only when profiling justifies it.

```js
let frameId = 0;
let running = false;

function tick() {
  if (!running) return;
  // Update only the state needed for this frame.
  frameId = requestAnimationFrame(tick);
}

function startLoop() {
  if (running) return;
  running = true;
  frameId = requestAnimationFrame(tick);
}

function stopLoop() {
  running = false;
  cancelAnimationFrame(frameId);
}
```

The loop has an explicit running flag to avoid creating duplicate frame chains. Production code must also connect the loop to the component lifecycle and reduced-motion preference. Stop work when the visual is not needed, not merely when it is off-screen in the DOM.

### 19. Motion Inventory and Team Governance

A product with many components needs a motion inventory. List each animation, its purpose, its owner, its reduced-motion behavior, and how it is tested. This makes it possible to find forgotten video loops, scroll libraries, CSS keyframes, SVG effects, and third-party widgets.

A practical inventory can include:
- Component or route.
- Trigger and expected final state.
- Animation owner: CSS, Web Animations API, GSAP, Framer Motion, canvas, video, or another system.
- Normal duration and travel.
- Reduced-motion behavior.
- Focus and scroll impact.
- Performance risk.
- Test coverage and browser support.
- Cleanup behavior on unmount or route change.

Review the inventory when adding a new motion dependency or changing a shared animation token. Do not assume a global CSS override covers a third-party library. A named owner and a reproducible test case make maintenance much easier.

### 20. Build Challenge: Reduced-Motion Audit Kit

Build a small demo application containing a modal, a staggered result list, a smooth-scroll link, and a decorative canvas effect. Add a motion policy that preserves functionality while reducing unnecessary movement.

1. Implement a CSS `prefers-reduced-motion: reduce` path for transitions and keyframes.
2. Ensure the base content is visible if animation classes are never applied.
3. Use `useReducedMotion` or an equivalent supported hook for library-driven motion.
4. Disable stagger delays and large translations when reduced motion is requested.
5. Stop or simplify the canvas requestAnimationFrame loop in reduced-motion mode.
6. Listen for runtime preference changes and clean up the listener.
7. Ensure the animation loop cannot create duplicate requestAnimationFrame chains.
8. Keep a visible `:focus-visible` indicator on all interactive controls.
9. Preserve semantic HTML and accessible names for modal, list, and navigation controls.
10. Keep keyboard focus inside a modal while it is open and restore it to the trigger when closed.
11. Make smooth-scroll links use immediate scrolling when reduced motion is active.
12. Provide a static alternative for any motion-heavy video or decorative visual.
13. Verify that CSS overrides do not conflict with inline styles from the animation library.
14. Test the interface with motion enabled and reduced motion enabled.
15. Change the preference while an animation is running and confirm it settles safely.
16. Test unmounting a component during an active animation and confirm cleanup.
17. Use DevTools Computed styles to inspect opacity, transform, delay, and duration.
18. Use the Performance panel to identify jank, repaint, reflow, and excess layers.
19. Test Safari, Firefox, and Chromium-based browsers supported by the project.
20. Add a failure test where JavaScript fails before an entrance animation is initialized.
21. Add a failure test where the reduced-motion preference changes during a stagger.
22. Confirm that no essential status, warning, or content is communicated only through movement.

## Definition of Done

- [ ] All motion-heavy components are listed in a motion inventory.
- [ ] Reduced-motion behavior is defined before shipping new animations.
- [ ] Essential content is visible and interactive without animation.
- [ ] CSS and JavaScript animation systems both respect the preference.
- [ ] Runtime preference changes do not leave intermediate visual states.
- [ ] Smooth scrolling and scroll-driven motion have a reduced-motion path.
- [ ] Canvas, SVG, video, and decorative loops are reviewed.
- [ ] Keyboard focus and `:focus-visible` indicators remain usable.
- [ ] Modal and menu state changes do not depend on animation completion.
- [ ] Event listeners, timelines, and frame loops are cleaned up.
- [ ] Performance has been checked independently from motion accessibility.
- [ ] Safari, Firefox, and Chromium-based behavior has been verified.
- [ ] Failure tests cover JavaScript failure, unmounting, and preference changes.
- [ ] The team can explain the purpose and reduced-motion behavior of each animation.

## Named Patterns

### Pattern: Static Base, Animated Enhancement

**What it does:** Keeps the component visible by default and adds animation only when the enhancement is active.

**When to use it:** Content that must remain readable when JavaScript fails or motion is disabled.

```css
.card { opacity: 1; transform: none; }
.card.is-entering { animation: card-in 160ms ease-out both; }
```

### Pattern: Reduced Travel

**What it does:** Removes spatial movement while preserving the final visual state.

**When to use it:** Dialogs, cards, and route content that normally slide or scale into place.

```css
@media (prefers-reduced-motion: reduce) {
  .dialog { transform: none; transition: none; opacity: 1; }
}
```

### Pattern: Preference Subscription

**What it does:** Observes the system preference and returns a cleanup function.

**When to use it:** A central motion service or imperative animation owner.

```js
const query = matchMedia("(prefers-reduced-motion: reduce)");
const onChange = event => updatePolicy(event.matches);
query.addEventListener("change", onChange);
```

### Pattern: Immediate Final State

**What it does:** Applies the completed state without running an entrance timeline.

**When to use it:** GSAP timelines, canvas effects, or interfaces where an animation could leave content hidden.

```js
if (reduceMotion) gsap.set(targets, { opacity: 1, y: 0 });
```

### Pattern: Reduced Stagger

**What it does:** Removes per-item delays while preserving the list's order and visibility.

**When to use it:** Search results, menus, and short lists.

```css
@media (prefers-reduced-motion: reduce) {
  .item { animation: none; animation-delay: 0ms; }
}
```

### Pattern: Immediate Scroll

**What it does:** Avoids prolonged smooth scrolling when reduced motion is requested.

**When to use it:** Anchor navigation and programmatic scroll actions.

```js
const behavior = reduceMotion ? "auto" : "smooth";
window.scrollTo({ top: targetY, behavior });
```

### Pattern: Single Frame for Canvas

**What it does:** Draws a static frame instead of continuously scheduling animation frames.

**When to use it:** Decorative particle effects, animated backgrounds, and canvas illustrations.

```js
if (reduceMotion) {
  cancelAnimationFrame(frameId);
  drawFrame();
}
```

### Pattern: Runtime Safe Finish

**What it does:** Finishes or resets an active animation when the preference changes to reduced motion.

**When to use it:** Long-running timelines or animations that can be interrupted.

```js
if (event.matches) {
  timeline?.progress(1).pause();
}
```

### Pattern: Motion Token Layer

**What it does:** Centralizes durations and travel distances to make policy consistent.

**When to use it:** Design systems with many motion-enabled components.

```css
:root { --motion-duration: 180ms; --motion-distance: 6px; }
@media (prefers-reduced-motion: reduce) {
  :root { --motion-duration: 0ms; --motion-distance: 0px; }
}
```

### Pattern: Explicit Loop Cleanup

**What it does:** Prevents frame callbacks from continuing after a component is no longer active.

**When to use it:** Canvas, custom animation loops, or imperative visuals.

```js
return () => {
  running = false;
  cancelAnimationFrame(frameId);
};
```

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Setting `animation: none` without restoring opacity | Content can remain invisible at the initial keyframe | Set the reduced-motion state to the visible final values |
| Assuming CSS controls JavaScript animation | Inline styles and library timelines can continue moving elements | Add a JavaScript preference policy for each animation owner |
| Disabling every transition globally without review | Important state feedback may become abrupt or unclear | Remove unnecessary movement while preserving clear state changes |
| Keeping long stagger delays | Important content appears slowly | Set stagger delay to zero or use a capped sequence |
| Ignoring smooth scrolling | Navigation can still create prolonged motion | Check the preference before requesting smooth behavior |
| Leaving canvas loops active | CPU and GPU work continues even when motion is reduced | Cancel frame requests and draw a static frame |
| Forgetting preference changes at runtime | Active animations can remain in intermediate states | Subscribe to changes and settle the current animation safely |
| Adding listeners on every render | Duplicate handlers cause repeated updates | Register once in a lifecycle and remove during cleanup |
| Skipping cleanup on unmount | Timelines or frame loops continue after removal | Kill timelines and cancel pending frame callbacks |
| Using `opacity: 0` as a hidden-state strategy | Content can disappear if animation initialization fails | Keep static content visible until enhancement starts |
| Removing focus outlines | Keyboard users lose their location | Preserve a strong `:focus-visible` indicator |
| Treating reduced motion as a medical label | It makes an unsupported assumption about the user | Respect the preference without inferring a diagnosis |
| Forgetting animated video and GIFs | CSS rules cannot stop every media format | Provide controls, static alternatives, and sensible autoplay behavior |
| Applying `will-change` everywhere | Excess layers increase memory and compositing cost | Profile first and scope `will-change` narrowly |
| Animating layout properties | Reflow and repaint can cause jank | Prefer transform and opacity for necessary motion |
| Testing only CSS | JavaScript, canvas, SVG, and third-party motion may remain active | Audit each animation system separately |
| Testing only initial preference | Runtime changes can expose cleanup bugs | Change the preference while the page is active |
| Failing to test JavaScript failure | Entrance code can leave a blank region | Verify the static base state without scripts |
| Using smooth scroll from JavaScript unconditionally | CSS overrides may not change an explicit JS request | Choose `"auto"` when reduced motion is active |
| Hiding motion but removing context | Users may not understand what changed | Preserve labels, state text, and other non-motion cues |
| Replaying animation when preference switches back | Unexpected movement can surprise users | Apply full motion to future interactions rather than replaying completed ones |
| Leaving a modal focus trap active after close | Keyboard users cannot return to the page | Restore focus and deactivate the trap as part of closing state |
| Forgetting Safari or embedded webviews | Support and lifecycle behavior may differ | Test the actual target browser matrix |
| Using `@supports` as preference detection | It tests CSS capability, not user settings | Use `prefers-reduced-motion` for preference and runtime JS checks for libraries |
| Failing to profile large effects | A visually subtle effect can still consume resources | Measure paint, reflow, frame rate, and layer count |

## Quick Reference

| Situation | Default approach | Verify |
|---|---|---|
| CSS transitions | Override with `prefers-reduced-motion` | Final opacity and transform are visible |
| CSS keyframes | Disable animation and reset initial styles | No hidden first frame remains |
| Framer Motion | Use supported reduced-motion hook/configuration | Initial and animate states agree |
| GSAP | Skip timeline or set final state | Timeline and listeners are cleaned up |
| Smooth scrolling | Use `behavior: "auto"` | Anchor target still receives focus/scroll correctly |
| Staggered list | Remove delays and large travel | All items appear immediately |
| Canvas animation | Draw static frame and stop loop | No pending frame chain remains |
| SVG animation | Provide static SVG state | Information remains understandable |
| Video or GIF | Avoid automatic motion and provide controls | Static alternative is available |
| Modal | Preserve focus and semantics | Focus returns to trigger on close |
| Focus styles | Keep `:focus-visible` | Keyboard focus remains obvious |
| Preference change | Settle active animation safely | No intermediate state remains |
| Runtime listener | Add and remove listener | No duplicate handlers |
| Performance | Prefer transform and opacity | No unnecessary reflow or repaint |
| Debugging | Use DevTools Computed and Performance panels | Actual rendered state matches policy |
| Browser support | Check caniuse and target browsers | Safari, Firefox, Chromium tested |
| Static fallback | Visible base state | JavaScript failure leaves content usable |
| Motion tokens | Centralize duration and distance | CSS and JS units are documented |
| Loop lifecycle | Cancel `requestAnimationFrame` | No off-screen or unmounted loop remains |
| Product review | Maintain a motion inventory | Each effect has a purpose and fallback |



## Component-by-Component Audit

Do not audit reduced motion only at the page level. Build a checklist for every component category because each uses a different animation mechanism and has different failure modes.

- **Navigation:** route fades, shared-element transitions, scroll restoration, focus after navigation.
- **Overlays:** dialogs, drawers, popovers, and menus that may combine movement with focus trapping.
- **Collections:** card grids, result lists, notifications, and staggered entrances.
- **Feedback:** success confirmations, error banners, progress indicators, and loading skeletons.
- **Media:** videos, GIFs, animated SVGs, canvas, WebGL, and third-party embeds.
- **Backgrounds:** looping gradients, particles, parallax, and decorative movement.
- **Input controls:** hover effects, pressed states, drag handles, sliders, and expanding fields.
- **Scrolling:** smooth anchors, scroll-linked effects, sticky transitions, and virtualized lists.

For each component, record the normal behavior, reduced-motion behavior, final state, focus implications, and test method. An audit is complete only when the static state is meaningful and the interaction still works. A decorative animation may be removed entirely; an interaction feedback state may need a different, non-motion cue such as a color, border, label, or icon change.

## Avoiding Hidden Content During Hydration

Server-rendered applications need special care because the server may not know the user's current media preference. If the server emits a component with `opacity: 0` and the client later decides whether to animate it, a flash or permanently hidden state can occur. Prefer visible markup by default, then apply animation only after the client has deliberately activated the enhancement.

```jsx
import { useEffect, useState } from "react";

export function ProgressiveEntrance({ children }) {
  const [enhanced, setEnhanced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setEnhanced(!query.matches);
  }, []);

  return (
    <section className={enhanced ? "entrance-ready" : ""}>
      {children}
    </section>
  );
}
```

```css
.entrance-ready .entrance-item {
  animation: item-enter 160ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  .entrance-ready .entrance-item {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

This approach intentionally leaves the base content visible before hydration. Adapt the class and selector to the component's real structure, and avoid assuming that every client render should replay an entrance. Check for layout shift and content flashes in the Performance and Rendering tools.

**Gotcha:** A client-only preference check can arrive after the first paint. Do not make essential content invisible while waiting to learn the preference.

## Choosing Alternatives to Motion

When removing an animation, replace its informational purpose if necessary. If a panel slides in to communicate that it opened, the `aria-expanded` state and visible panel already communicate the state. If a loading animation implies ongoing work, a concise text status may be clearer. If a success animation celebrates completion, a persistent confirmation label can provide the same information without requiring movement.

Use alternatives that fit the task:
- State changes: visible labels, `aria-expanded`, selected-state semantics, or a changed icon with an accessible name.
- Loading: concise status text and a progress indicator that does not continuously sweep across the screen.
- Success and errors: persistent text, an appropriate live region, and a clear next action.
- Navigation: a stable heading and clear route context.
- Data visualization: labels, values, legends, and static comparison states.
- Drag interactions: keyboard-operable alternatives and buttons for actions that otherwise require dragging.
- Hover details: content that can also be reached with focus or explicit activation.

Do not make a color change the only cue if the state has meaning beyond decoration. Ensure contrast remains sufficient and text remains understandable. The goal is not to replace movement with a less accessible effect; it is to preserve the same information through a robust combination of semantics, text, layout, and visible state.

## Testing with Automation and Manual Review

Automated tests can confirm that the reduced-motion preference is applied, but they cannot fully judge whether the resulting experience feels calm or remains understandable. Combine deterministic assertions with manual review. In browser automation, emulate the media preference if the tool supports it, then assert that the content is visible and controls remain actionable.

Example test strategy:
1. Load a page with normal motion and assert that the destination content exists.
2. Emulate `prefers-reduced-motion: reduce`.
3. Trigger the same interaction and assert the final state without waiting for a long animation.
4. Confirm the relevant button's `aria-expanded` or selected state changes immediately.
5. Assert that no essential element remains at `opacity: 0`.
6. Navigate with keyboard only and inspect the `:focus-visible` indicator.
7. Repeat after changing the preference while the component is mounted.
8. Run a manual pass with real content, realistic list sizes, and target devices.

Do not make tests depend on exact animation frame timing unless timing itself is the feature under test. A test that sleeps for a fixed duration can become flaky on slower CI machines. Prefer waiting for semantic state, element visibility, and stable route identity.

## Practical Decision Guide

Use this guide when deciding how to adapt a specific effect.

| Effect | Typical reduced-motion choice | Keep in mind |
|---|---|---|
| Small button color transition | Remove or shorten transition | Preserve hover, pressed, and focus cues |
| Large modal slide | Show final position immediately | Maintain focus trap and return focus |
| Route transition | Skip movement or use a quiet fade | Preserve destination focus and scroll |
| Long stagger | Remove delay and travel | Make all content available at once |
| Parallax hero | Use static positioning | Do not make content depend on scroll movement |
| Autoplay carousel | Stop autoplay or require manual control | Keep slide controls and labels accessible |
| Canvas particles | Draw a static composition | Cancel pending animation frames |
| Smooth anchor scroll | Use immediate scroll | Ensure target is not obscured by sticky UI |
| Success confetti | Omit confetti and show confirmation text | Do not make success understandable only through the effect |
| Animated chart | Render a stable chart immediately | Preserve labels, values, and data relationships |

These are defaults, not universal mandates. Consider the purpose of the movement, the user's preference, and the context in which the component is used. A small opacity change can be appropriate in one context and unnecessary in another. When in doubt, preserve functionality and reduce spatial travel, repetition, and delay.


## Final Principle

Reduced motion is a supported presentation mode, not a degraded application. Preserve meaning, content, focus, and functionality; remove unnecessary travel and delay; and verify that every component reaches a correct final state when motion is disabled.
