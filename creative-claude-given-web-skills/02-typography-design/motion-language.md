# Motion Language — Production Skill Guide

## Why This Matters

Motion is part of interface behavior, not a layer of decoration added after layout is finished. A transition can explain where a panel came from, make a state change easier to understand, or help users keep their place while content updates. The same animation can also slow down a task, obscure a status change, trigger vestibular discomfort, or make an interface feel unpredictable when it is applied without a clear purpose.

A motion language defines when movement is used, how it behaves, how long it lasts, and how it responds to user preferences. It includes timing tokens, easing curves, distance, hierarchy, choreography, interruption rules, focus behavior, and reduced-motion alternatives. It also describes when motion should not be used. A consistent system makes interactions feel related without making every component move in the same way.

This guide focuses on production CSS and JavaScript patterns for web interfaces. It covers transitions, keyframes, transform-based motion, layout animation trade-offs, animation lifecycle, accessibility, performance, and debugging. Examples are deliberately small enough to adapt to a real codebase.

## Outcomes

After completing this skill, you should be able to:

- Decide whether motion improves understanding or merely adds noise.
- Define reusable duration, easing, and distance tokens.
- Choose transitions, keyframes, or Web Animations API based on the behavior required.
- Animate transform and opacity where possible instead of repeatedly triggering layout.
- Respect `prefers-reduced-motion` without removing essential state feedback.
- Keep focus, keyboard interaction, and accessible state aligned with animated visuals.
- Prevent stale animations, race conditions, and overlapping transition states.
- Debug motion using DevTools, computed styles, performance traces, and reduced-motion emulation.
- Document a small motion system that designers and engineers can use consistently.

## 1. Start with a behavioral reason

Every animation should have a job. Common jobs include showing continuity, indicating hierarchy, confirming an action, revealing a relationship, or communicating a state change. If removing the motion does not make the interaction harder to understand, it may not need to exist. A loading spinner that never resolves is not useful motion; it is evidence that the system has failed to communicate progress.

Write the behavior in plain language before writing CSS. For example: “When the disclosure opens, its content becomes visible and the trigger updates its expanded state.” This sentence defines the user-visible change and makes it easier to decide which parts should animate.

```html
<section class="faq">
  <h2>Shipping</h2>
  <button class="faq__trigger" aria-expanded="false" aria-controls="shipping-answer">
    When will my order arrive?
  </button>
  <div id="shipping-answer" hidden>
    <p>Most orders arrive within three to five business days.</p>
  </div>
</section>
```

## 2. Establish a small token scale

Motion tokens make timing and distance consistent across components. Use a small scale rather than inventing a duration for every interaction. A short duration suits a small control response; a longer duration may suit a large panel or a spatial transition. The exact values depend on the product, but the relationship between values should be deliberate.

Tokens should describe purpose, not only raw numbers. `--motion-duration-enter` is easier to reason about than an unexplained `--duration-275`. Avoid turning every duration into a token; a system with too many nearly identical values is difficult to maintain.

```css
:root {
  --motion-duration-instant: 80ms;
  --motion-duration-fast: 140ms;
  --motion-duration-standard: 220ms;
  --motion-duration-emphasized: 360ms;
  --motion-distance-sm: 4px;
  --motion-distance-md: 12px;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

## 3. Select easing based on intent

Easing controls the distribution of movement over time. A standard ease can make a control feel responsive; an enter curve may accelerate an element into view; an exit curve may let it leave quickly. Do not select a curve merely because it looks fashionable. The movement should support the interaction's direction and urgency.

Avoid using a spring-like or elastic curve for every element. Overshoot can suggest physicality, but it can also make enterprise interfaces feel unstable or distract from dense information. Test curves at the actual distance and duration because the same easing feels different when applied to a 4-pixel shift versus a full-screen panel.

```css
.panel {
  transition:
    opacity var(--motion-duration-standard) var(--motion-ease-standard),
    transform var(--motion-duration-standard) var(--motion-ease-standard);
}
```

## 4. Prefer transform and opacity for simple transitions

Changing width, height, top, left, margin, or other layout-affecting properties can trigger layout recalculation. For movement that does not need to reflow surrounding content, `transform` and `opacity` are often more efficient. This is not an absolute rule: some state changes genuinely require layout to change, and browsers may optimize different properties differently.

Do not translate an element to simulate a layout change when the surrounding content should move with it. Use transform for visual movement, not as a substitute for correct document flow. Confirm performance in the browser instead of relying on property folklore.

```css
.toast {
  opacity: 0;
  transform: translateY(var(--motion-distance-sm));
  transition:
    opacity var(--motion-duration-fast) var(--motion-ease-standard),
    transform var(--motion-duration-fast) var(--motion-ease-standard);
}

.toast[data-visible="true"] {
  opacity: 1;
  transform: translateY(0);
}
```

## 5. Use transitions for state changes

Transitions are ideal when an element moves between a small number of states, such as idle and expanded, inactive and active, or hidden and visible. The transition is declared on the element and runs when the relevant property changes. Keep the state itself separate from the transition definition.

Avoid defining unrelated properties in a single broad `transition: all`. It can animate properties you did not intend to move and make future changes produce surprising behavior. List the properties that should transition and keep the duration short enough to preserve responsiveness.

```css
.button {
  background-color: var(--button-bg);
  color: var(--button-fg);
  transform: translateY(0);
  transition:
    background-color var(--motion-duration-fast),
    color var(--motion-duration-fast),
    transform var(--motion-duration-fast);
}

.button:active {
  transform: translateY(1px);
}
```

## 6. Use keyframes for sequences, not ordinary state changes

Keyframes define multiple points along a timeline. They are useful for a deliberate sequence such as a brief attention cue, a progress indicator, or a looping ambient effect. A keyframe animation can repeat, reverse, delay, and control fill behavior. Each of those options should have a reason.

Avoid using a looping animation to compensate for a missing product state. A continuously pulsing save icon is not a substitute for communicating whether saving succeeded. Infinite movement can distract users, consume resources, and become uncomfortable. Prefer finite animations and a clear final state.

```css
@keyframes progress-indeterminate {
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
}

.progress__bar {
  animation: progress-indeterminate 1.2s var(--motion-ease-standard) infinite;
}
```

## 7. Keep animation state aligned with semantics

The visual state and the accessible state must change together. If a disclosure is open, its trigger should reflect that state with `aria-expanded`; if a dialog is closed, it should not remain focusable or interactive merely because its opacity is zero. Hiding an element visually is not always the same as removing it from keyboard navigation or the accessibility tree.

Choose the semantic behavior first, then animate it. For elements that must be removed from interaction, coordinate the exit animation with the point at which focus and accessibility state change. Do not leave invisible controls reachable by keyboard.

```html
<button aria-expanded="true" aria-controls="details-panel">
  Hide details
</button>
<section id="details-panel" aria-labelledby="details-heading">
  <h2 id="details-heading">Details</h2>
  <p>Current plan information.</p>
</section>
```

## 8. Respect reduced-motion preferences

Some users request reduced motion because movement can cause discomfort, distraction, or loss of orientation. Use the `prefers-reduced-motion` media feature to reduce or remove nonessential animation. Do not remove meaningful feedback without providing another cue; the state change should remain perceivable through text, color, shape, or immediate visibility.

Reduced motion should be part of the system rather than a patch added after a complaint. Test the experience with the operating system preference enabled and with browser DevTools emulation. Consider both CSS transitions and JavaScript-driven animations, because a CSS media query cannot automatically stop every animation started in JavaScript.

```css
.card {
  transition: transform 180ms ease, opacity 180ms ease;
}

.card:hover {
  transform: translateY(-3px);
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
  .card:hover {
    transform: none;
  }
}
```

## 9. Avoid motion as the only signal

Do not communicate error, success, selection, or availability through movement alone. A shake animation may draw attention to a validation error, but the error message and field state must still be available without animation. A pulsing notification may attract attention, but it must not be the only way users know that a new item exists.

Use a combination of text, iconography, color, and semantic state. Make the final state clear if animation is skipped, interrupted, or disabled. A user should not have to watch the animation to understand what happened.

```html
<label for="email">Email address</label>
<input id="email" type="email" aria-describedby="email-error" aria-invalid="true">
<p id="email-error" role="alert">Enter a valid email address.</p>
```

## 10. Coordinate entry and exit motion

Entry and exit animations serve different purposes. Entry can establish where an element came from; exit can help explain where it is going. They do not necessarily need identical easing or duration. A menu may enter gently but close more quickly so it does not slow the user down.

Avoid leaving an element in an intermediate visual state after the transition finishes. Ensure the base style represents the stable state and that transition classes or data attributes are removed when no longer needed. Test rapid open-close sequences because they expose stale state more readily than a single click.

```css
.popover {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
  pointer-events: none;
  transition: opacity 160ms ease-in, transform 160ms ease-in;
}

.popover[data-open="true"] {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
  transition-timing-function: cubic-bezier(0, 0, 0.2, 1);
}
```

## 11. Animate overlays without trapping invisible content

Dialogs, drawers, and menus often combine opacity and transform. However, opacity zero does not make an element non-interactive. A closed dialog should be closed semantically and should not allow focus to move into hidden controls. When using native `<dialog>`, coordinate the open/close lifecycle with the dialog API and the desired animation.

Do not put `display: none` on an element before its exit animation can run. Conversely, do not leave a visually hidden panel in the tab order after the animation ends. Use a deliberate state machine or an animation-end callback where needed, and account for interrupted transitions.

```html
<dialog class="modal" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm changes</h2>
  <p>Your draft will be saved.</p>
  <form method="dialog">
    <button>Cancel</button>
    <button value="confirm">Save</button>
  </form>
</dialog>
```

## 12. Keep choreography short and purposeful

Choreography is the order and relationship of multiple animated elements. A small stagger can help users scan a list, but long sequences delay access to the content. Use stagger for a meaningful group and keep the delay proportional to the number of elements. Avoid animating every child in a long table or feed.

If the content is already visible in the DOM, consider whether animation is necessary at all. For large lists, a simple container transition may be more efficient and less distracting than dozens of per-item animations. If elements are inserted dynamically, make sure their initial styles do not flash before the animation starts.

```css
.list-item {
  animation: item-enter 180ms var(--motion-ease-enter) both;
}

.list-item:nth-child(2) { animation-delay: 30ms; }
.list-item:nth-child(3) { animation-delay: 60ms; }
.list-item:nth-child(4) { animation-delay: 90ms; }

@keyframes item-enter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .list-item { animation: none; }
}
```

## 13. Use the Web Animations API when lifecycle control matters

CSS is usually enough for simple hover, focus, and state transitions. The Web Animations API can be useful when JavaScript needs to start, cancel, reverse, or await an animation. Its returned animation object can be controlled directly, which is often clearer than dynamically generating many CSS classes.

Avoid creating untracked animations on every event. Cancel or reuse active animations, and handle rejected promises when an animation is canceled. Keep the reduced-motion preference in mind before starting a programmatic animation.

```js
function animateNotice(element, reducedMotion) {
  if (reducedMotion) {
    element.style.opacity = "1";
    element.style.transform = "none";
    return Promise.resolve();
  }

  const animation = element.animate(
    [
      { opacity: 0, transform: "translateY(8px)" },
      { opacity: 1, transform: "translateY(0)" }
    ],
    { duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)", fill: "both" }
  );

  return animation.finished.catch(() => undefined);
}
```

## 14. Avoid layout thrashing in JavaScript

Reading layout values and writing styles repeatedly in the same loop can force the browser to recalculate layout multiple times. Batch reads before writes, avoid measuring elements unnecessarily, and use transform-based motion for visual movement when appropriate. A single `getBoundingClientRect()` call is not inherently bad; repeated interleaved reads and writes are the common problem.

Do not assume that `requestAnimationFrame` automatically makes any animation efficient. It can align work with the next frame, but expensive calculations still consume the frame budget. Profile the interaction in DevTools Performance and look for repeated layout and style recalculation events.

```js
function shiftCards(cards, offset) {
  const measurements = cards.map((card) => card.getBoundingClientRect());
  cards.forEach((card, index) => {
    card.style.transform = `translateY(${offset + measurements[index].top * 0}px)`;
  });
}
```

## 15. Use `will-change` as a measured hint

`will-change` can help a browser prepare for a property that is about to animate, but it may consume extra memory and create additional compositing layers. It is not a general performance switch. Apply it only after profiling identifies a benefit, and remove it when the animation is complete if the element will remain idle.

Avoid placing `will-change: transform` on every card in a large grid. That can increase memory use and make performance worse on lower-powered devices. Test on representative hardware rather than assuming a desktop GPU tells the whole story.

```css
.drawer[data-animating="true"] {
  will-change: transform, opacity;
}
```

## 16. Design focus behavior around motion

Focus movement must be understandable and visible. If a button opens a dialog, move focus into the dialog according to the interaction pattern and restore it to the trigger when the dialog closes. If a menu item causes navigation or removes itself, do not leave focus attached to a detached element. Visual movement should not create unexpected keyboard movement.

Use `:focus-visible` to provide a clear focus indicator without requiring a pointer hover. Do not animate the outline itself in a way that makes it difficult to locate. Check that transformed ancestors do not clip the focus ring and that a moving panel does not obscure the focused control.

```css
.action:focus-visible {
  outline: 3px solid var(--focus-ring, #1769e0);
  outline-offset: 3px;
}

.drawer__link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

## 17. Keep state transitions robust under rapid input

Users can click repeatedly, press Escape during an opening transition, or navigate away before an animation completes. Treat motion as a visual consequence of state, not as the state itself. The application should know whether a panel is open even if its animation is canceled.

Use explicit state and guard against stale callbacks. Avoid using a fixed timeout as the only proof that a CSS transition finished; transitions can be canceled or have different durations under reduced-motion settings. Prefer transition events or a controlled animation object, and make sure cleanup is reliable.

```js
let activeAnimation;

function transitionElement(element, keyframes, options) {
  activeAnimation?.cancel();
  activeAnimation = element.animate(keyframes, options);
  return activeAnimation.finished.catch(() => undefined);
}
```

## 18. Handle content that changes during animation

Dynamic content can change an element's height while it is animating. Animating from `height: 0` to `height: auto` is not directly supported in older common patterns, and a measured pixel height can become stale if content wraps differently after a resize. Consider a grid-based reveal, opacity plus clipping, or a measured height that updates when content changes.

Do not hard-code a height that truncates translated or user-generated content. Test with longer strings, zoom, and narrow widths. When the content is important, an immediate expansion can be more robust than a fragile height animation.

```css
.disclosure__content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 220ms ease;
}

.disclosure[data-open="true"] .disclosure__content {
  grid-template-rows: 1fr;
}

.disclosure__inner {
  min-height: 0;
  overflow: hidden;
}
```

## 19. Use loading motion only when it reflects real work

A progress indicator should correspond to an actual loading or processing state. Indeterminate motion is appropriate when the duration is unknown; determinate progress should communicate a meaningful percentage or step. A skeleton can suggest the structure of incoming content, but it should not remain after the content is available.

Avoid fake progress that loops forever after the request has failed. Announce meaningful status changes where appropriate, and ensure users can still understand the state when motion is reduced or disabled. If the task is taking unusually long, provide a status or recovery action.

```html
<section aria-busy="true" aria-describedby="loading-status">
  <p id="loading-status" role="status">Loading account details…</p>
  <div class="skeleton" aria-hidden="true"></div>
</section>
```

## 20. Debug animation using DevTools

Start by identifying the property that changes, the element that owns it, and the state that triggers it. Inspect computed styles before and during the animation. Use the Animations panel to slow, pause, and replay timelines. In Performance, look for long tasks, repeated layout, paint costs, and dropped frames. Emulate reduced motion and test with CPU throttling when the animation feels fine on a powerful development machine but sluggish elsewhere.

Do not change several variables at once. Reduce the animation to one element and one property, then reintroduce timing, easing, and choreography in steps. Check whether a transition is failing because the starting and ending values are not interpolable or because the element is removed before the transition can finish.

```js
function inspectMotion(element) {
  const style = getComputedStyle(element);
  console.table({
    opacity: style.opacity,
    transform: style.transform,
    transitionProperty: style.transitionProperty,
    transitionDuration: style.transitionDuration,
    transitionTimingFunction: style.transitionTimingFunction,
    animationName: style.animationName,
    animationDuration: style.animationDuration,
    willChange: style.willChange
  });
}
```

## 21. Build a reusable motion language

A motion system should define a small vocabulary of durations, easing curves, distances, and behavioral patterns. Document what each token is for and provide examples. A token should be changed centrally when the system evolves; individual components should not override it casually.

Keep interaction motion distinct from storytelling or marketing animation. A button press should be immediate, while a large narrative sequence may take longer if it does not delay task completion. The system should make the distinction explicit so a component author does not reuse a dramatic scroll effect for an everyday control.

```css
:root {
  --motion-quick: 120ms;
  --motion-ui: 200ms;
  --motion-panel: 280ms;
  --motion-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-exit: cubic-bezier(0.4, 0, 1, 1);
  --motion-distance: 8px;
}
```

## 22. Set a motion budget for complex screens

A screen can become noisy when many elements move at once. Set limits on how many simultaneous animations are active, how long a sequence may delay interaction, and how much distance an element travels. These limits are especially useful for dashboards, feeds, and applications where users repeatedly perform the same task.

Avoid treating a motion budget as a rigid number detached from context. The important questions are whether movement competes with the primary task, whether users can interact immediately, and whether the animation remains comfortable. Measure and review the experience with real content and real devices.

```css
/* Keep repeated UI feedback restrained and short. */
.inline-feedback {
  animation: feedback-in 140ms var(--motion-ease-enter) both;
}

@keyframes feedback-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .inline-feedback { animation: none; }
}
```

## 23. Validate motion across environments

Check the system at mobile and desktop sizes, with reduced motion enabled, with keyboard-only navigation, and under slower CPU conditions. Browser rendering differences can expose timing assumptions, particularly when a transition depends on a dynamically inserted element or a layout measurement. Do not rely only on a video recording; inspect the live behavior.

A release review should cover normal operation, rapid interaction, cancellation, and failure. Verify that a state is understandable when animation is skipped, and that the interface remains usable if the browser drops frames. The animation is an enhancement to a correct interaction, not the foundation of the interaction.

```js
const motionReview = {
  keyboardPath: true,
  reducedMotion: true,
  rapidToggle: true,
  cancelAndRestart: true,
  narrowViewport: true,
  slowCpu: true,
  finalStateReadable: true
};
console.table(Object.entries(motionReview).map(([test, passed]) => ({ test, passed })));
```

## 24. Make motion reviewable in code review

A pull request that adds animation should explain its purpose, the state transition, the reduced-motion behavior, and how it was tested. Reviewers should be able to tell whether the motion is required for understanding, what property changes, and what happens if the animation is interrupted. Keep keyframes and tokens close to the relevant component or in a clearly named shared layer.

Do not approve a motion effect only because it looks polished in a screen recording. Confirm that the underlying semantics and state are correct, that the effect does not block interaction, and that keyboard and reduced-motion behavior are intentional.

```css
.notice {
  opacity: 0;
  transform: translateY(6px);
  transition: opacity var(--motion-ui) var(--motion-enter),
              transform var(--motion-ui) var(--motion-enter);
}

.notice[data-state="visible"] {
  opacity: 1;
  transform: translateY(0);
}

.notice:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
```

## Named Implementation Patterns

### Pattern 1 — State transition with explicit properties

**What it does:** Defines a small set of animated properties and avoids the unpredictable effects of `transition: all`.

**When to use it:** Use for hover, pressed, selected, or expanded states where the final state is known.

```css
.control {
  transform: translateY(0);
  background: var(--surface);
  transition: transform 140ms ease, background-color 140ms ease;
}
.control:active { transform: translateY(1px); }
.control:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
```

### Pattern 2 — Reduced-motion-safe hover

**What it does:** Provides a visual hover/focus response and removes the nonessential movement when reduced motion is requested.

**When to use it:** Use for cards, image links, and small decorative movement that does not communicate essential state.

```css
.card { transition: transform 180ms ease; }
.card:hover, .card:focus-visible { transform: translateY(-2px); }
.card:focus-visible { outline: 3px solid currentColor; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover, .card:focus-visible { transform: none; }
}
```

### Pattern 3 — Finite confirmation animation

**What it does:** Briefly confirms an action and then returns to a stable state.

**When to use it:** Use for a small save confirmation or a newly added item, not as a replacement for status text.

```css
@keyframes confirm-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.confirmation { animation: confirm-in 160ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .confirmation { animation: none; }
}
```

### Pattern 4 — Drawer entry and exit

**What it does:** Separates the open state from the visual transition and makes the intended properties explicit.

**When to use it:** Use for drawers and popovers when interaction and accessibility state are managed separately from the animation.

```css
.drawer {
  opacity: 0;
  transform: translateX(12px);
  transition: opacity 180ms ease, transform 180ms ease;
}
.drawer[data-open="true"] { opacity: 1; transform: translateX(0); }
.drawer:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

### Pattern 5 — Staggered short list

**What it does:** Adds a restrained sequential reveal to a small group of items.

**When to use it:** Use for a short onboarding list or a small menu, not a long data table.

```css
.list-item { animation: list-in 160ms ease-out both; }
.list-item:nth-child(2) { animation-delay: 25ms; }
.list-item:nth-child(3) { animation-delay: 50ms; }
@keyframes list-in {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) { .list-item { animation: none; } }
```

### Pattern 6 — Web Animations API with cancellation

**What it does:** Allows a new animation to replace an old one without leaving several competing animations active.

**When to use it:** Use when the application must explicitly start, cancel, reverse, or await an animation.

```js
let running;
function play(element) {
  running?.cancel();
  running = element.animate(
    [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }],
    { duration: 180, fill: "both", easing: "ease-out" }
  );
  return running.finished.catch(() => undefined);
}
```

### Pattern 7 — Reduced-motion-aware programmatic animation

**What it does:** Checks the user's preference before starting a JavaScript animation.

**When to use it:** Use when motion is driven by JavaScript rather than only by CSS.

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
function reveal(element) {
  if (reduceMotion.matches) {
    element.style.opacity = "1";
    element.style.transform = "none";
    return;
  }
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "both" });
}
```

### Pattern 8 — Focus-safe animated control

**What it does:** Keeps the keyboard focus indicator visible and independent of decorative movement.

**When to use it:** Use for any interactive component with transform, clipping, or overflow behavior.

```css
.motion-control { transition: transform 140ms ease; }
.motion-control:hover { transform: translateY(-1px); }
.motion-control:focus-visible { outline: 3px solid #145dcc; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) { .motion-control { transition: none; } }
```

### Pattern 9 — Motion token layer

**What it does:** Centralizes duration and easing choices so related components share the same interaction feel.

**When to use it:** Use in a multi-component product with repeated state changes and multiple contributors.

```css
:root {
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --motion-panel: 280ms;
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
```

### Pattern 10 — Status change without motion dependence

**What it does:** Makes the status clear through semantics and text even if animation is disabled.

**When to use it:** Use for errors, save outcomes, upload state, and other consequential feedback.

```html
<p role="status" aria-live="polite" id="save-status">Changes saved.</p>
<button type="button" aria-describedby="save-status">Save changes</button>
```

## Mental Models

1. **Motion serves a behavior.** If it does not clarify continuity, hierarchy, feedback, or state, question whether it belongs.
2. **The stable state is the truth.** An animation can be skipped or canceled; the interface must still end in a correct state.
3. **State and presentation are separate.** Opacity zero does not mean a component is closed, disabled, or absent from keyboard navigation.
4. **Shorter is usually safer for repeated UI.** Frequent actions should not wait for a long sequence to complete.
5. **Reduced motion is an alternate path, not a broken version.** Preserve meaning and feedback while removing unnecessary movement.
6. **Animate the property that matches the intent.** Transform can move an element visually; layout properties should change when surrounding flow must change.
7. **Easing communicates character.** The same distance with different easing can feel urgent, calm, heavy, or playful.
8. **Cancellation is normal input.** Rapid toggles, Escape, navigation, and state updates can interrupt an animation.
9. **A motion system is a budget.** Too many simultaneous movements compete for attention and frame time.
10. **Measure before optimizing.** DevTools traces and real-device testing are more reliable than assumptions about compositing.
11. **Accessibility is part of the animation contract.** Keyboard focus, screen reader state, and reduced-motion behavior must agree with the visual state.
12. **A final state must remain legible.** Users should understand what happened even if they never see the transition.

## Quick Reference

| Situation | Recommended default | Notes |
|---|---|---|
| Button press | Short transform or color transition | Keep response immediate |
| Hover on a card | Small transform or color change | Mirror on `:focus-visible` |
| Disclosure opens | Transition opacity/clip or grid track | Keep `aria-expanded` synchronized |
| Dialog closes | Controlled exit then semantic close | Do not leave hidden controls tabbable |
| Loading is unknown | Indeterminate indicator | Explain long-running work |
| Progress is measurable | Determinate progress | Communicate current value |
| User requests reduced motion | Remove nonessential transforms and sequences | Preserve status feedback |
| Large panel enters | Transform + opacity | Check focus and stacking |
| Long list appears | No stagger or very short limited stagger | Avoid delaying scan and interaction |
| Animation is interrupted | Cancel or replace active animation | Keep state authoritative |
| Jank appears | Profile before changing properties | Inspect layout, paint, and scripting |
| CSS transition fails | Compare computed start/end values | Check whether properties interpolate |
| JS animation is canceled | Handle `finished` rejection | Prevent stale async work |
| Focus outline is clipped | Inspect overflow and stacking | Move outline or adjust wrapper |
| Content height changes | Avoid stale hard-coded height | Test wrap and localization |
| Ambient loop | Avoid unless it communicates useful state | Respect reduced motion and attention |
| Animation feels sluggish | Reduce duration or distance | Confirm task speed, not just aesthetics |
| Many elements move | Apply a motion budget | Prioritize the primary action |
| State is consequential | Add text/semantic feedback | Motion alone is insufficient |
| Review request | Document purpose and test matrix | Include reduced motion and keyboard path |

## Common Mistakes and Specific Fixes

| Mistake | Why It Happens | Specific Fix |
|---|---|---|
| Using `transition: all` | It is concise but animates future properties unintentionally. | List only properties that should transition and review computed transition-property. |
| Making everything springy | Dramatic motion is mistaken for polish. | Reserve overshoot for a justified expressive pattern and use standard easing for routine controls. |
| Using animation as the only feedback | The visual effect is mistaken for communication. | Add a visible state, text message, or semantic status that remains when motion is disabled. |
| Forgetting reduced motion | Motion is tested only with the developer's default system preference. | Add a `prefers-reduced-motion` branch and test with browser emulation. |
| Animating width for a simple slide | Layout properties seem intuitive even when only visual movement is needed. | Use transform for visual translation; keep layout changes when surrounding flow must change. |
| Leaving an invisible panel focusable | Opacity is confused with semantic closure. | Coordinate `hidden`, inertness, dialog state, and focus with the animation lifecycle. |
| Using long stagger delays | The sequence looks elegant in a prototype. | Cap the delay and ensure the user can interact immediately. |
| Starting a new animation without canceling the old one | Event handlers assume input arrives only once. | Track the active Animation object and cancel or replace it before starting another. |
| Setting `will-change` everywhere | It is treated as a universal performance fix. | Profile first and limit hints to elements that benefit from them. |
| Reading and writing layout in a loop | Each measurement may force style or layout work after a write. | Batch measurements before writes and profile with the Performance panel. |
| Hiding focus during transitions | The focus style is treated as a decorative detail. | Keep a stable `:focus-visible` indicator and check clipping and stacking. |
| Relying on a timeout for completion | A hard-coded duration is assumed to match every environment. | Use transition/animation events or a controlled animation object and handle cancellation. |
| Animating every list item | Choreography is applied without considering content volume. | Restrict stagger to small groups or animate the container instead. |
| Ignoring content resizing | The initial measured height is assumed to remain valid. | Test responsive wrapping and dynamic content; avoid stale pixel heights. |
| Making the reduced-motion path silent | The motion was carrying all visible feedback. | Keep the state change immediate and add explicit text or styling cues. |
| Ignoring keyboard users | Interaction is tested with a pointer only. | Test the full flow with keyboard navigation and verify focus return. |
| Looping a spinner after failure | Loading and failure states are not distinguished. | Stop the indicator, communicate failure, and offer a recovery action. |
| Optimizing without profiling | Property folklore replaces actual evidence. | Capture a Performance trace and identify layout, paint, scripting, or compositing costs. |

## Build Requirements

1. Document the purpose of each nontrivial animation in plain language.
2. Define a small set of duration, easing, and distance tokens.
3. Avoid broad `transition: all` declarations for production components.
4. Prefer transform and opacity for visual movement when layout does not need to change.
5. Keep application state authoritative even if animations are canceled or skipped.
6. Coordinate semantic state, focus management, and visual visibility for overlays.
7. Implement a `prefers-reduced-motion` alternative for nonessential movement.
8. Ensure keyboard focus remains visible and is not clipped by animated containers.
9. Keep repeated interaction animations short enough not to delay tasks.
10. Use finite animations unless an infinite loop communicates an ongoing state.
11. Avoid `will-change` until a measurable benefit is established.
12. Test rapid input, cancellation, reopening, and navigation during animation.
13. Profile performance using DevTools on realistic content and hardware.
14. Include keyboard-only and screen reader state checks in review.
15. Ensure essential state is communicated without relying on motion, color, or position alone.
16. Document animation lifecycle and cleanup for JavaScript-driven effects.
17. Verify loading indicators stop or change when the underlying operation resolves or fails.
18. Test dynamic content, long text, localization, and narrow viewports.
19. Keep animation tokens and component patterns discoverable in the codebase.
20. Capture a before/after recording or reproducible test case for complex motion changes.

## Topic-Specific Gotchas

> **Gotcha — `opacity: 0` is still present.** Unless another rule removes it from interaction, an invisible element may still receive focus or pointer events.

> **Gotcha — reduced motion does not automatically cancel JavaScript animations.** Programmatic animation must check the preference and react if it changes during a session.

> **Gotcha — a transition needs two renderable states.** If an element is inserted with its final styles already applied, the browser may have no initial state to interpolate from.

> **Gotcha — `display: none` cannot provide a visible exit transition.** Delay semantic removal until the exit completes, but do not leave the hidden element interactive.

> **Gotcha — `will-change` has a cost.** Persistent layer promotion can consume memory, especially when applied to many elements in a large list.

> **Gotcha — transforms can affect stacking and clipping.** Inspect ancestor overflow and stacking contexts if the animated element appears behind content or its focus ring is cut off.

> **Gotcha — `animation.finished` can reject when canceled.** Catch cancellation and make sure the application does not interpret it as a failed user action.

> **Gotcha — a visually smooth desktop animation can jank on mobile.** Use CPU throttling and a representative device before accepting performance claims.

## Build Challenge — Repair a drawer that gets stuck

### Scenario

A drawer is animated from `translateX(100%)` to `translateX(0)`. A developer adds `display: none` as soon as the close button is clicked. The exit animation never appears. After removing that rule, keyboard users can still tab into the drawer while it is visually offscreen. Rapidly clicking open and close can also leave an old callback hiding the drawer after it has reopened.

### Step 1: Identify the competing responsibilities

Separate the application state (`open` or `closed`), the visual transition (`entering`, `entered`, `exiting`), and the interaction state (whether the drawer can receive focus). Do not use the animated transform as the only representation of state.

### Step 2: Reproduce the issue

1. Open the drawer.
2. Close it and observe whether the exit transition runs.
3. Press Tab while it is visually closed.
4. Reopen it quickly before the previous transition finishes.
5. Enable reduced motion and repeat the sequence.

### Step 3: Inspect computed styles

Use the Elements panel to watch `transform`, `opacity`, `display`, `visibility`, `pointer-events`, and `transition-duration`. In the Animations panel, slow the timeline and determine whether the element is removed before the exit can finish. Use `getComputedStyle()` to inspect the effective rules rather than relying only on the stylesheet source.

```js
function inspectDrawer(drawer) {
  const style = getComputedStyle(drawer);
  console.table({
    transform: style.transform,
    opacity: style.opacity,
    display: style.display,
    visibility: style.visibility,
    pointerEvents: style.pointerEvents,
    transitionDuration: style.transitionDuration,
    inert: drawer.inert,
    hidden: drawer.hidden
  });
}
```

### Step 4: Fix the state sequence

Keep the drawer rendered during the exit transition. On close, immediately prevent interaction and move focus appropriately, then wait for the transition to finish before applying `hidden` or removing it. If the drawer reopens, cancel the pending close operation. With reduced motion, close immediately without waiting for a transition event.

```js
let closeToken = 0;

async function closeDrawer(drawer) {
  const token = ++closeToken;
  drawer.inert = true;
  drawer.dataset.open = "false";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    drawer.hidden = true;
    return;
  }

  await new Promise((resolve) => {
    const finish = (event) => {
      if (event.target !== drawer || event.propertyName !== "transform") return;
      drawer.removeEventListener("transitionend", finish);
      resolve();
    };
    drawer.addEventListener("transitionend", finish);
  });

  if (token === closeToken && drawer.dataset.open === "false") {
    drawer.hidden = true;
  }
}

function openDrawer(drawer) {
  closeToken++;
  drawer.hidden = false;
  drawer.inert = false;
  requestAnimationFrame(() => {
    drawer.dataset.open = "true";
  });
}
```

### Step 5: Validate the repair

- Confirm the exit animation is visible under normal motion settings.
- Confirm reduced motion closes the drawer without waiting for an event.
- Confirm the drawer cannot receive keyboard focus while closed.
- Confirm reopening during an exit cancels the stale close operation.
- Confirm focus enters the drawer on open and returns to the trigger on close.
- Confirm the implementation still works if a transition is canceled or its duration is overridden.

## Definition of Done / Success Criteria

- [ ] Each animation has a documented purpose and stable final state.
- [ ] Duration and easing values use a small, documented token scale.
- [ ] Reduced-motion behavior preserves essential feedback while removing unnecessary movement.
- [ ] Keyboard focus remains visible and follows the expected interaction pattern.
- [ ] Hidden overlays cannot receive focus or pointer input.
- [ ] Rapid toggles and canceled animations do not corrupt application state.
- [ ] Performance has been inspected with DevTools rather than guessed.
- [ ] Loading and status motion corresponds to real application state.
- [ ] Common components follow documented motion patterns.
- [ ] Reviewers can reproduce and verify the animation behavior.

## Final Operating Principle

Use motion to explain a state change, preserve continuity, or confirm an action. Keep the stable state correct, keep movement short and purposeful, and make the interaction understandable when motion is reduced, interrupted, or never seen. A good motion language is consistent enough to feel coherent and restrained enough to let users focus on their work.


## Production Integration Notes

### CSS layer organization

Keep motion tokens and reduced-motion defaults in a predictable layer. Component styles should reference the shared tokens rather than repeat timing curves. If the codebase uses cascade layers, place global defaults and component-specific rules in a documented order so a component cannot accidentally override a critical accessibility rule.

```css
@layer tokens, base, components, accessibility;

@layer tokens {
  :root {
    --motion-fast: 120ms;
    --motion-standard: 200ms;
    --motion-ease: cubic-bezier(0.2, 0, 0, 1);
  }
}

@layer accessibility {
  @media (prefers-reduced-motion: reduce) {
    html:focus-within { scroll-behavior: auto; }
  }
}
```

### Scroll-linked motion

Scroll-linked effects can create a strong sense of depth, but they should not make content difficult to read or cause the page to move independently of the user's intent. Prefer restrained effects and progressive enhancement. If the effect is essential to understanding, provide a non-motion equivalent. Test performance on mobile and ensure the effect does not create large repaints across the viewport.

```css
@media (prefers-reduced-motion: no-preference) {
  .decorative-orbit {
    animation: orbit 18s linear infinite;
  }
}

@media (prefers-reduced-motion: reduce) {
  .decorative-orbit { animation: none; }
}
```

### Transitioning color and contrast

Color transitions can make hover and selected states feel smoother, but the final contrast must be sufficient and immediate enough to interpret. Do not animate text through low-contrast intermediate colors if users need to read it during the transition. For high-priority validation and alert states, prefer clear state changes over elaborate color choreography.

```css
.nav-link {
  color: var(--text-muted);
  transition: color 120ms ease;
}
.nav-link[aria-current="page"] {
  color: var(--text-strong);
}
.nav-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}
```

### Native scrolling and focus

Smooth scrolling can be useful for short in-page navigation, but it can be disorienting for some users and should respect reduced-motion preferences. When moving focus to a new section, ensure the target can receive focus if necessary and is not obscured by a sticky header. Do not use a long scroll animation to hide the fact that focus has moved.

```css
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

### Motion in forms

Form validation should make the error easy to find without forcing the user to watch a shake animation. Use field labels, descriptive error text, `aria-describedby`, and appropriate invalid-state semantics. If the form scrolls to the first error, keep the movement short and focus the relevant control according to the form's interaction design.

```html
<form>
  <label for="account-email">Email</label>
  <input id="account-email" type="email" aria-invalid="true" aria-describedby="account-email-error">
  <p id="account-email-error" role="alert">Enter an email address in the expected format.</p>
  <button type="submit">Continue</button>
</form>
```

### Motion and dialogs

A dialog's animation should not undermine the modal interaction model. The dialog must become the active interaction context when opened, and focus should be restored to the invoking control when it closes. Coordinate visual exit with semantic closure so a disappearing dialog does not remain reachable by keyboard or screen reader navigation.

```css
dialog[open] {
  animation: dialog-enter 180ms ease-out both;
}
@keyframes dialog-enter {
  from { opacity: 0; transform: translateY(8px) scale(0.99); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  dialog[open] { animation: none; }
}
```

### Code review questions

- What user-facing purpose does this animation serve?
- What is the stable state if the animation is skipped?
- Does the motion delay the primary action or reading?
- Is reduced motion supported in both CSS and JavaScript paths?
- Can the animation be interrupted by Escape, navigation, or a second click?
- Does the component remain keyboard-operable while entering and exiting?
- Are semantic state and visual state synchronized?
- Has performance been inspected on a representative device?
