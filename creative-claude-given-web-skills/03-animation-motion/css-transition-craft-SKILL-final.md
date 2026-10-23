# CSS Transition Craft — Production Skill

## Skill Name
`css-transition-craft`

## Layer
Layer 03 — Animation & Motion

## Goal
Design, implement, debug, and ship intentional CSS transitions that make interface state changes understandable, responsive, accessible, and performant. Build a reusable transition system rather than adding arbitrary `transition: all` declarations.

## Why This Matters

CSS transitions are often treated as a finishing touch, then become a source of production bugs. A menu fades out but remains keyboard-focusable. A card animates `width` and causes layout jank. A hover effect works with a mouse but fails on touch. A component changes state before its exit animation finishes and leaves an invisible overlay blocking clicks. A reduced-motion preference removes the transition but accidentally leaves the element at `opacity: 0`. A global `transition: all` animates properties nobody intended to animate, including values that affect layout.

A robust transition system separates **state**, **visual interpolation**, and **interaction semantics**. The browser should be able to render the correct final state even if transitions are disabled, interrupted, or unsupported. Motion should help users understand what changed, where it happened, and what they can do next. It must never be required to access content, complete an action, or understand a status message.

## Core Concepts

### 1. Transition Model: Start, Target, Interpolation

A transition interpolates a property's computed value when a style change occurs and the property is transitionable. The browser needs a starting value, a changed target value, and a matching `transition-property` declaration. The state change is immediate in CSS terms; only visual interpolation takes time.

```css
.card { opacity: 1; transform: translateY(0); transition: opacity 180ms ease-out, transform 180ms ease-out; }
.card[data-state="entering"] { opacity: 0; transform: translateY(8px); }
```

For a progressive entrance, make sure the element has rendered its starting style before changing the target. If both states are applied before the browser paints, it may skip the transition. A framework lifecycle hook or deliberate frame boundary can establish the initial state, but avoid arbitrary timeouts without understanding rendering.

**Gotcha:** A transition does not run merely because a rule contains `transition`. It needs a change between compatible computed values while the element participates in rendering.

### 2. Choose Properties Deliberately

Avoid `transition: all` as a default. It animates unintended changes, makes refactors unpredictable, and can include expensive properties. List the properties that should interpolate.

```css
.button {
  color: white; background-color: #2457e6; transform: translateY(0);
  transition: color 120ms ease-out, background-color 120ms ease-out, transform 120ms ease-out;
}
.button:hover { background-color: #1743bd; }
.button:active { transform: translateY(1px); }
```

Prefer `transform` and `opacity` for simple movement and fading because they often avoid layout recalculation. Color properties are suitable for short state feedback. `width`, `height`, `top`, `left`, `margin`, and `padding` can trigger reflow or repaint; animate them only when necessary and after profiling.

### 3. Duration: Match the Task

Duration changes perceived character. Tiny control feedback should feel immediate; a drawer can take longer because it covers more distance. Treat these values as starting tokens, not universal laws.

```css
:root { --transition-fast: 120ms; --transition-standard: 200ms; --transition-emphasized: 300ms; }
.icon-button { transition: transform var(--transition-fast) ease-out; }
.dialog-surface { transition: opacity var(--transition-standard) ease-out, transform var(--transition-emphasized) ease-out; }
```

A delay is not duration: a 200 ms transition with a 300 ms delay makes the interface wait before acknowledging an action. Use delays for deliberate sequencing, not to disguise slow application logic. Report loading and completion based on actual application state.

### 4. Timing Functions and Velocity

`linear` has constant progress, `ease-in` accelerates from rest, `ease-out` decelerates toward the end, and `ease-in-out` accelerates then decelerates. Cubic Bézier values should be named and chosen intentionally.

```css
:root {
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
.panel { transition: transform 220ms var(--ease-enter), opacity 180ms var(--ease-standard); }
```

Ease-out often suits entering elements because they arrive quickly and settle; ease-in often suits exits because they accelerate away. These are conventions, not laws. Inspect real distances and speeds rather than choosing curves by name alone.

### 5. Shorthand and Longhand

The transition shorthand can include property, duration, timing function, delay, and newer behavior values. Make declarations readable when several properties need different durations.

```css
.notice { transition: opacity 160ms ease-out, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1); }
```

Each comma-separated item describes one property. When property and timing lists have different lengths, CSS repeats list values as needed. This is valid but can be hard to maintain, so prefer explicit per-property entries. Verify support for newer features such as `transition-behavior: allow-discrete`.

### 6. Transitionable and Discrete Values

Many numeric values, colors, and transforms interpolate. Some properties, including `display` in conventional transition behavior, are discrete. Newer CSS can allow discrete transitions in specific cases, but this does not replace correct visibility and focus management.

```css
.popover { opacity: 0; transform: translateY(4px); display: none; }
.popover[data-open="true"] { display: block; opacity: 1; transform: translateY(0); }
```

This may not animate as expected because `display` switches discretely and the start style may never render. If using `@starting-style` or `transition-behavior: allow-discrete`, verify support. Otherwise use a stable mounted element with a clear state policy or another animation strategy.

**Gotcha:** Opacity zero is not the same as hidden. An invisible element can still receive pointer events and keyboard focus unless its interaction state is managed.

### 7. State Selectors

Use the selector that matches the interaction: hover for pointer feedback, focus for keyboard navigation, active for pressed feedback, and explicit attributes for application state. Hover must not be the only way to reveal information or access a control.

```css
.control { transition: background-color 120ms ease-out, transform 120ms ease-out; }
.control:hover { background-color: #e8edff; }
.control:focus-visible { outline: 3px solid #2457e6; outline-offset: 3px; }
.control:active { transform: translateY(1px); }
.control[aria-expanded="true"] { background-color: #dbe4ff; }
```

Keep `:focus-visible` clear and unclipped. Test hover behavior on coarse pointers, and ensure functionality is reachable through click, touch, keyboard, and programmatic interaction where appropriate.

### 8. Accessibility and Reduced Motion

Use `prefers-reduced-motion` to reduce unnecessary travel, scaling, and long sequences. Do not hide essential content when motion is reduced. A component must reach the correct final state even if transitions are removed.

```css
.panel { opacity: 1; transform: none; transition: opacity 180ms ease-out, transform 180ms ease-out; }
@media (prefers-reduced-motion: reduce) { .panel { transition: none; } }
```

This assumes visibility is already represented correctly. If closed state uses opacity or transforms, reduced-motion rules must resolve the correct open or closed style. Avoid blanket rules that force every element visible. Preserve semantics, focus behavior, and status announcements independently from motion.

### 9. Transition Events and Lifecycle

`transitionend` fires when a transition completes for a property. It does not fire if there is no transition, if the transition is canceled, or if the property is removed before completion. It can fire for multiple properties, so filter by `event.propertyName` and target.

```js
const panel = document.querySelector(".panel");
if (panel) {
  panel.addEventListener("transitionend", (event) => {
    if (event.target !== panel || event.propertyName !== "opacity") return;
    console.debug("Panel opacity transition completed");
  });
  panel.addEventListener("transitioncancel", (event) => {
    if (event.target === panel) console.debug("Panel transition canceled");
  });
}
```

Never make correctness depend solely on `transitionend`. Reduced motion may remove the transition, and rapid input may cancel it. Define how a closing panel becomes non-interactive and when it is removed from the accessibility tree.

### 10. Reversals, Interruptions, and Rapid Input

CSS transitions can reverse smoothly when a target changes during interpolation, but behavior depends on properties and state. Hover-out can happen before hover-in finishes; a disclosure can open and close rapidly. The latest semantic state should win.

```css
.disclosure__panel { opacity: 0; transform: translateY(-4px); transition: opacity 160ms ease-out, transform 160ms ease-out; }
.disclosure[data-open="true"] .disclosure__panel { opacity: 1; transform: translateY(0); }
```

Also manage visibility, focus, and pointer behavior. If a panel remains mounted for exit motion, make it non-interactive at the correct point and ensure hidden links cannot be tabbed to. Test rapid toggling and preference changes during active motion.

### 11. Performance: Layout, Paint, and Compositing

Transform and opacity are usually good starting choices. Changes to `width`, `height`, `top`, `left`, `margin`, and `padding` can trigger layout and cause jank, particularly in long lists. Shadows and filters can require expensive paint work even when layout is stable.

```css
.card { opacity: 1; transform: translateY(0); transition: opacity 180ms ease-out, transform 180ms ease-out; }
.card:hover { transform: translateY(-2px); }
```

Use `will-change` only when profiling indicates a benefit. Promoting many elements to separate layers can increase GPU memory use. Use the DevTools Performance panel to inspect long frames, reflow, repaint, paint, and compositor activity. Profile realistic page content on lower-powered devices.

### 12. Debugging Computed Values

Inspect computed styles rather than guessing. Confirm that a starting value exists, the state change occurs, the property is listed in `transition-property`, and no competing rule overrides it.

```js
function inspectTransition(selector) {
  const element = document.querySelector(selector);
  if (!element) { console.warn("No element found for selector:", selector); return null; }
  const style = getComputedStyle(element);
  const result = {
    opacity: style.opacity, transform: style.transform,
    transitionProperty: style.transitionProperty,
    transitionDuration: style.transitionDuration,
    transitionDelay: style.transitionDelay,
    transitionTimingFunction: style.transitionTimingFunction
  };
  console.table(result);
  return result;
}
```

Use the Elements panel to toggle classes and attributes, inspect `:hover` and `:focus-visible`, and disable declarations one at a time. Use Performance tools to distinguish timing problems from rendering bottlenecks. Check reduced-motion overrides, specificity conflicts, stale inline styles, and missing initial paints.

### 13. Progressive Enhancement and Browser Support

Basic transitions, transforms, and opacity are broadly supported, but newer discrete-transition behavior and `@starting-style` need target-browser validation. Check current browser support and caniuse for Safari, Firefox, Chromium-based browsers, and embedded webviews.

```css
.surface { opacity: 1; transform: none; }
@supports (transition: opacity 150ms ease) {
  .surface { transition: opacity 150ms ease, transform 150ms ease; }
}
@media (prefers-reduced-motion: reduce) { .surface { transition: none; } }
```

The static style is the fallback; transition is an enhancement. `@supports` checks syntax support, not user preference or performance. If a browser skips the effect, the interface must still communicate state and keep content available.

### 14. Transition Tokens and Governance

Shared tokens make motion consistent and easier to tune. Define duration, easing, and distance separately so components can choose a suitable combination.

```css
:root {
  --duration-fast: 120ms; --duration-standard: 200ms; --duration-emphasis: 300ms;
  --ease-enter: cubic-bezier(0, 0, 0.2, 1); --ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --distance-small: 4px; --distance-medium: 8px;
}
```

Document when a token should be used and which exceptions are allowed. Consistency does not require every component to use the same duration: a toast, tooltip, dialog, and route transition have different purposes. Review tokens when the design system changes and test high-frequency interactions for cumulative delay.

## Practical Patterns

### Pattern: Button Feedback
**What it does:** Adds fast feedback for hover, keyboard focus, and press without changing layout.
**When to use it:** Primary and secondary buttons that need immediate acknowledgement.
```css
.button { transition: background-color 120ms ease-out, transform 120ms ease-out; }
.button:active { transform: translateY(1px); }
.button:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
```

### Pattern: Disclosure Panel
**What it does:** Interpolates opacity and a small offset while application state controls whether a panel is open.
**When to use it:** Accordions and menus with separately managed visibility and focus.
```css
.disclosure__panel { opacity: 0; transform: translateY(-4px); transition: opacity 160ms ease-out, transform 160ms ease-out; }
.disclosure[data-open="true"] .disclosure__panel { opacity: 1; transform: translateY(0); }
```

### Pattern: Color-Only Feedback
**What it does:** Changes a border or background without spatial movement.
**When to use it:** Dense tables, forms, and interfaces where motion would distract.
```css
.field { border-color: #9ca3af; transition: border-color 120ms ease-out, background-color 120ms ease-out; }
.field[aria-invalid="true"] { border-color: #b91c1c; }
```

### Pattern: Reduced-Motion Transition
**What it does:** Removes interpolation while preserving state-specific final styles.
**When to use it:** Every component using movement, especially entrances and drawers.
```css
@media (prefers-reduced-motion: reduce) { .transitioning { transition: none; } }
```

### Pattern: Safe Transition Completion
**What it does:** Filters lifecycle events so unrelated properties and descendants do not trigger cleanup.
**When to use it:** Exit cleanup that has a fallback for cancellation and no-motion cases.
```js
const element = document.querySelector(".toast");
element?.addEventListener("transitionend", (event) => {
  if (event.target !== element || event.propertyName !== "opacity") return;
  console.debug("Toast opacity transition ended");
});
```

### Pattern: Motion Token System
**What it does:** Centralizes timing and easing across related components.
**When to use it:** Shared component libraries and multi-page applications.
```css
:root { --motion-fast: 120ms; --motion-standard: 200ms; --ease-ui: cubic-bezier(0.2, 0, 0, 1); }
```

### Pattern: Stable Entrance
**What it does:** Keeps the final state visible by default and adds an explicit entering state only when needed.
**When to use it:** Non-critical cards, notices, and panels.
```css
.notice { opacity: 1; transform: none; }
.notice[data-entering="true"] { opacity: 0; transform: translateY(6px); transition: opacity 180ms ease-out, transform 180ms ease-out; }
```

### Pattern: Hover Enhancement With Touch Fallback
**What it does:** Applies hover motion only on hover-capable fine pointers.
**When to use it:** Cards and non-essential visual affordances.
```css
@media (hover: hover) and (pointer: fine) { .card:hover { transform: translateY(-2px); } }
.card { transition: transform 160ms ease-out; }
```

### Pattern: Discrete-Transition Feature Check
**What it does:** Separates progressive enhancement from baseline state handling.
**When to use it:** Experiments with newer discrete visibility transitions.
```css
@supports (transition-behavior: allow-discrete) {
  .popover { transition: opacity 160ms ease-out, display 160ms allow-discrete; }
}
```

## JavaScript Integration

Use JavaScript to change state, not to recreate CSS interpolation unnecessarily. The component should update semantic state immediately, then let CSS interpolate visual properties.

```html
<section class="disclosure" data-open="false">
  <h2><button type="button" aria-expanded="false" aria-controls="details-panel">Details</button></h2>
  <div id="details-panel" hidden><p>Additional information appears here.</p></div>
</section>
```

```js
const disclosure = document.querySelector(".disclosure");
const toggle = disclosure?.querySelector("button");
const panel = disclosure?.querySelector("#details-panel");
if (disclosure && toggle && panel) {
  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    const nextOpen = !isOpen;
    toggle.setAttribute("aria-expanded", String(nextOpen));
    disclosure.dataset.open = String(nextOpen);
    panel.hidden = !nextOpen;
  });
}
```

This example updates semantic state, but `hidden` makes visibility switch immediately, so opacity alone will not animate an exit. Use a deliberate visibility strategy that supports the required exit behavior, or keep content mounted while preventing focus and interaction when closed. Do not remove `hidden` from the correctness model just to make a demo animate.

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Using `transition: all` everywhere | Unrelated and expensive properties animate | List only intended properties |
| Expecting a transition without a state change | No computed-value difference exists | Verify starting style and state mutation |
| Applying both states before first paint | The browser may never render the start state | Establish a rendered start state |
| Animating layout properties by default | Reflow and paint can cause jank | Prefer transform and opacity, then profile exceptions |
| Assuming opacity zero hides an element | Invisible content may remain focusable | Manage visibility, pointer behavior, and focus |
| Relying only on `transitionend` | Canceled or disabled transitions may not emit it | Handle cancellation and no-motion paths |
| Ignoring `transitioncancel` | Rapid input interrupts lifecycle assumptions | Define interruption behavior |
| Using hover as the only affordance | Touch and keyboard users may miss it | Provide focus and activation states |
| Removing `:focus-visible` | Keyboard users lose location feedback | Keep a visible, contrasted focus outline |
| Forcing all content visible in reduced motion | Intentionally closed content can be exposed | Resolve each component state explicitly |
| Forgetting JavaScript-driven motion | CSS media rules do not stop every timeline | Update the animation owner on preference changes |
| Using arbitrary delays | The interface feels unresponsive | Delay only for purposeful sequencing |
| Overusing `will-change` | Extra layers consume memory | Apply narrowly after profiling |
| Using advanced CSS without fallback | Older browsers may skip the effect | Check support and preserve static functionality |
| Leaving stale inline styles | Inline values override state styles | Reset inline properties at lifecycle boundaries |
| Animating every property | Unrelated changes compete and cost more | Define a small motion surface |
| Making visual state the source of truth | Skipped motion can break semantics | Keep application state authoritative |
| Forgetting rapid toggles | Old completion logic may override current state | Make latest semantic state win |
| Clipping focus outlines | Keyboard focus becomes hard to see | Adjust overflow and outline offset |
| Testing only with a desktop mouse | Touch and keyboard differ | Test coarse pointers, keyboard, and touch |
| Using delay to simulate loading | Timing misrepresents actual work | Tie completion to operation state |
| Ignoring high-frequency events | Repeated motion becomes noisy | Reduce motion for repeated updates |
| Animating large shadows without profiling | Paint work may exceed frame budget | Profile and simplify expensive effects |
| Confusing `@supports` with preference | Capability and user preference differ | Use feature queries and media queries separately |
| Leaving an exiting panel interactive | Users can tab into departing content | Define inertness and focus movement |

## Build Challenge: Transition Audit

Build a page with a button, disclosure, toast, dialog, and card list. Use transitions only where they clarify state changes.

1. Define duration, easing, and distance tokens in `:root`.
2. Replace broad `transition: all` declarations with explicit property lists.
3. Add hover, active, and `:focus-visible` feedback to the button.
4. Implement a disclosure whose `aria-expanded` matches its open state.
5. Ensure hidden disclosure content cannot receive focus while closed.
6. Give the toast a visible static state if animation is disabled.
7. Define an explicit dialog exit strategy and restore focus to its trigger.
8. Add a `prefers-reduced-motion` path without exposing closed content.
9. Use transform and opacity for simple spatial transitions.
10. Profile realistic content and record reflow, repaint, paint, and jank.
11. Test rapid repeated clicks while transitions run.
12. Handle `transitioncancel`; no essential cleanup depends only on `transitionend`.
13. Test keyboard navigation, touch input, and coarse pointers.
14. Verify Safari, Firefox, and Chromium-based browsers.
15. Add a helper that reports computed transition values.
16. Simulate JavaScript initialization failure; core content remains visible and understandable.
17. Toggle reduced motion during an active transition and verify the final state.
18. Document the purpose of every animated property and its regression test.

## Definition of Done

- [ ] Every transition has a named purpose and explicit property list.
- [ ] No broad `transition: all` remains without a documented reason.
- [ ] Duration and easing use shared tokens or justified local values.
- [ ] Essential actions respond immediately; animation creates no artificial delay.
- [ ] Static states remain correct when transitions are disabled.
- [ ] Reduced motion preserves semantics and correct visibility.
- [ ] `:focus-visible` remains clear and unclipped.
- [ ] Menus, disclosures, and dialogs manage keyboard focus correctly.
- [ ] Lifecycle code handles cancellation and no-motion cases.
- [ ] Rapid input resolves to the latest semantic state.
- [ ] Transform and opacity are preferred where suitable.
- [ ] Layout-triggering properties have a measured justification.
- [ ] DevTools profiling shows acceptable paint and frame timing.
- [ ] Supported browsers have been tested.
- [ ] Failure cases in the build challenge pass.

## Quick Reference

| Need | Recommended technique | Watch out for |
|---|---|---|
| Fast control feedback | 100–150 ms transition | Do not delay the action |
| Panel entrance | Opacity plus small transform | Ensure start style is rendered |
| Exit animation | Explicit mounted/visibility strategy | Avoid focusable hidden content |
| Consistent motion | Shared duration and easing tokens | Do not force uniformity |
| Accessible focus | `:focus-visible` outline | Prevent clipping and low contrast |
| Reduced motion | State-aware media query | Do not expose closed content |
| Completion event | Filtered `transitionend` | Account for cancellation |
| Rapid interaction | Latest state wins | Avoid stale callbacks |
| Performance | Transform and opacity | Profile filters and shadows |
| Compatibility | Progressive enhancement | Check discrete transitions |
| Debugging | Computed style inspection | Check specificity and inline overrides |
| Hover feedback | Hover-capability media query | Provide touch and keyboard equivalents |
| Loading feedback | Actual operation state | Do not fake completion with delay |
| Hidden content | Visibility and focus policy | Opacity alone is not hiding |
| Large list updates | Minimal color feedback | Avoid layout shifts |
| Motion inventory | Document each property | Remove effects without user benefit |

## Further Review Checklist

- Confirm component state is independent from animation progress.
- Confirm initial and final computed values are valid.
- Confirm animation is not required to reveal essential content.
- Confirm reduced-motion rules cover all states, not only the default selector.
- Confirm multiple viewport widths and input modalities are tested.
- Confirm browser support matches the project's actual matrix.
- Confirm expensive rendering properties were evaluated in the Performance panel.
- Confirm event listeners are scoped to lifecycle and cleaned up where needed.
- Confirm every interactive element retains an understandable name, role, state, and focus indication.
- Confirm interruptions do not create invisible overlays or stale UI.



### 15. Initial Rendering and `@starting-style`

Transitions normally need a rendered before-state. Newly inserted elements do not always have a prior rendered style to interpolate from, so an entrance can appear instantly even when a transition is declared. Modern CSS provides `@starting-style` for supported cases, but treat it as progressive enhancement.

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}
@starting-style {
  .toast { opacity: 0; transform: translateY(6px); }
}
```

Verify support in target browsers and keep a static fallback. Do not assume `@starting-style` solves exit behavior or semantic visibility. A toast that disappears visually still needs a lifecycle: when it stops being announced, whether it can be dismissed, and whether focus should move.

**Gotcha:** A first-paint transition failure is often a rendering-order issue, not an easing problem. Check whether the browser ever had a distinct start value.

### 16. Transition Delays and Staggering

A delay can sequence related elements, but it also postpones feedback. Use it for secondary elements after the primary state is clear, not for controls whose acknowledgement should be immediate. A large list with a delay on every row creates a long tail before the last item appears.

```css
.result-card {
  opacity: 1;
  transform: none;
  transition: opacity 160ms ease-out, transform 160ms ease-out;
}
.result-card[data-entering="true"] {
  opacity: 0;
  transform: translateY(5px);
}
.result-card:nth-child(2) { transition-delay: 20ms; }
.result-card:nth-child(3) { transition-delay: 40ms; }
.result-card:nth-child(4) { transition-delay: 60ms; }
@media (prefers-reduced-motion: reduce) {
  .result-card, .result-card[data-entering="true"] {
    transition: none; transition-delay: 0ms; opacity: 1; transform: none;
  }
}
```

This stagger is illustrative, not a rule to animate every list. Consider the total time until the last item is available and whether the user is trying to scan or compare information. For frequently updated results, one concise highlight may be better than replaying an entrance sequence.

### 17. Transitioning Custom Properties

Custom properties do not automatically interpolate in every situation. An unregistered custom property is generally treated as a token sequence rather than a typed numeric value. If a design needs an animatable custom property, use `@property` where supported and provide a fallback.

```css
@property --reveal-progress {
  syntax: "<percentage>";
  inherits: false;
  initial-value: 0%;
}
.reveal-meter {
  --reveal-progress: 0%;
  background: linear-gradient(to right, currentColor var(--reveal-progress), transparent var(--reveal-progress));
  transition: --reveal-progress 220ms ease-out;
}
.reveal-meter[data-complete="true"] { --reveal-progress: 100%; }
```

Do not use custom-property animation as a shortcut for every visual effect. If the property changes a large gradient or shadow, it may still incur paint work. Check browser support for `@property`, profile the actual rendering, and keep the final state meaningful if registration is unsupported.

### 18. Color Contrast During Transitions

A color transition can pass contrast checks at its endpoints but pass through combinations that are difficult to read. This matters for text, focus indicators, error borders, and status badges. If foreground and background both transition, test intermediate states rather than inspecting only the final screenshot.

```css
.alert { color: #1f2937; background-color: #fef3c7; transition: background-color 140ms ease-out; }
.alert[data-severity="error"] { color: #ffffff; background-color: #b91c1c; }
```

For high-priority statuses, consider switching to a known accessible color pair immediately instead of interpolating through ambiguous shades. Never make color the only signal: include clear text, icons with accessible names when needed, and semantic status. Keep `:focus-visible` outlines distinct from animated borders.

### 19. Transitions and Scroll Position

Transitions can affect scroll behavior indirectly when layout changes, content expands, or a focused element moves. Avoid smooth scrolling as an automatic side effect of every state change. Preserve the user's scroll position unless moving focus or revealing content requires a deliberate adjustment.

```css
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

This is a site-level choice, not a universal default. If code calls `scrollIntoView()`, account for reduced motion there as well; CSS alone does not guarantee every JavaScript-triggered scroll becomes instant. Test keyboard focus, sticky headers, and narrow viewports.

### 20. When CSS Transitions Are the Wrong Tool

Use transitions for interpolation between a small number of state-driven styles. Prefer keyframes when the effect needs multiple named stages or repeated motion. Consider the Web Animations API or a motion library when you need explicit cancellation, sequencing, timeline control, or coordinated exit presence. Avoid choosing a more complex tool simply because it offers more knobs.

```css
.spinner { animation: spin 900ms linear infinite; }
@keyframes spin { to { transform: rotate(1turn); } }
```

A continuous spinner is an animation, not a state-to-state transition. It should be accompanied by a meaningful loading label where appropriate and respect reduced motion. If decorative, remove it under reduced motion; if it communicates ongoing work, preserve a non-motion status indicator.

## Additional Practical Patterns

### Pattern: First-Paint Entrance With Fallback
**What it does:** Uses `@starting-style` to establish a start state for a newly rendered element in supporting browsers.
**When to use it:** Short, non-critical notices or popovers where a small entrance improves orientation.
```css
.notice { opacity: 1; transform: none; transition: opacity 180ms ease-out, transform 180ms ease-out; }
@starting-style { .notice { opacity: 0; transform: translateY(5px); } }
```

### Pattern: Zero-Delay Primary Feedback
**What it does:** Ensures the main action acknowledges activation without a transition delay.
**When to use it:** Submit, save, navigation, and other actions where latency perception matters.
```css
.primary-action { transition: background-color 120ms ease-out, transform 120ms ease-out; transition-delay: 0ms; }
.primary-action:active { transform: translateY(1px); }
```

### Pattern: Reduced-Motion Stagger Reset
**What it does:** Removes movement and accumulated delay from a sequence.
**When to use it:** Staggered cards, list rows, and decorative multi-element entrances.
```css
@media (prefers-reduced-motion: reduce) {
  .staggered-item { transition: none; transition-delay: 0ms; opacity: 1; transform: none; }
}
```

### Pattern: Contrast-Safe Status Change
**What it does:** Changes a status to a known readable color pair without relying on an animated color journey.
**When to use it:** Error, success, warning, and validation feedback.
```css
.status { color: #1f2937; background: #f3f4f6; }
.status[data-kind="error"] { color: #fff; background: #b91c1c; }
```

### Pattern: CSS Feature Enhancement
**What it does:** Enables a modern feature only when the browser supports its syntax.
**When to use it:** Discrete visibility transitions or registered custom properties.
```css
@supports (transition-behavior: allow-discrete) {
  .popover { transition: opacity 160ms ease-out, display 160ms allow-discrete; }
}
```

### Pattern: Stable Focus During Motion
**What it does:** Keeps a strong focus indicator visible even when the control changes color or position.
**When to use it:** Keyboard-accessible controls with animated hover or active feedback.
```css
.control:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 3px; }
```

## Transition Testing Matrix

| Scenario | Expected result | Evidence to collect |
|---|---|---|
| First render | Essential content is visible | Initial screenshot and computed styles |
| Pointer hover | Helpful feedback, no layout shift | Hover state and layout metrics |
| Keyboard focus | Clear focus indicator | Keyboard-only walkthrough |
| Press and release quickly | Latest state wins | Repeatable interaction test |
| Transition canceled | No stale cleanup or hidden overlay | Console logs and component state |
| Reduced motion on | Correct final state without travel | Emulated preference and screenshot |
| Preference changes mid-transition | Component settles safely | Before-and-after state |
| Slow device | No severe frame drops | Performance trace |
| Long list | Scanning remains quick | Trace at realistic item count |
| Unsupported feature | Static fallback works | Browser without feature |
| JavaScript initialization fails | Core content remains usable | Disable script or force error |
| Zoom and narrow viewport | Focus and content remain visible | Responsive viewport test |

A transition can pass visual review and still fail interaction testing. Keep a regression test for each failure mode found during implementation. Record browser version and preference setting when reporting a defect so the team can reproduce it.

## Additional Debugging Checklist

1. Confirm the selector matches the element and the expected state attribute changes.
2. Inspect computed `transition-property`, `transition-duration`, `transition-delay`, and `transition-timing-function`.
3. Confirm the property can interpolate between actual computed values.
4. Check whether the start state was painted before the target state was applied.
5. Temporarily disable transitions to identify underlying layout or stacking problems.
6. Look for higher-specificity declarations and inline styles.
7. Check whether `display`, `hidden`, or `visibility` changes prevent interpolation.
8. Inspect `transitionend` and `transitioncancel` events separately.
9. Confirm reduced-motion styles do not expose closed content or hide essential content.
10. Use the Performance panel to identify reflow, repaint, expensive paint, or layer churn.
11. Check browser support and test the static fallback.
12. Re-test after removing debug declarations.

## Further Mental Models

1. **A transition is a presentation layer.** It should not own application truth or accessibility semantics.
2. **No motion is a valid outcome.** Users can disable motion, browsers can skip it, and reduced-motion rules can remove it.
3. **Every delay spends user patience.** A delay must justify its cost by improving sequencing or comprehension.
4. **A visual exit is not semantic removal.** Focus, pointer access, and accessibility-tree exposure need their own policy.
5. **Performance is contextual.** A property that looks smooth on one card may be expensive across hundreds of rows.
6. **Progressive enhancement starts with a correct static state.** Animation is an improvement, not a prerequisite.
7. **The most recent state should win.** Rapid input must not let stale completion callbacks reverse the latest choice.
8. **Debugging starts with computed reality.** Source CSS expresses intent; computed styles reveal what the browser applied.




## Review Scenarios That Catch Real Bugs

### Scenario A: The element never transitions

A button's background changes immediately even though the stylesheet includes a transition. First inspect the computed `transition-property` and duration. Confirm the changed property is listed, then verify the selector is active and no later rule overrides the transition. If the element was inserted and its start and target styles were applied before the first paint, test an explicit initial-render strategy. Do not add a delay until you know which condition failed.

### Scenario B: The closing panel blocks the page

A panel has `opacity: 0` after closing, but clicking where it used to be still hits the panel. This is expected if the element remains in the hit-testing tree. Set a deliberate closed interaction state, using an appropriate visibility strategy, `inert`, or removal after the exit completes. If focus is inside the panel, move focus to a meaningful destination before making its descendants unavailable.

### Scenario C: Reduced motion leaves an awkward intermediate state

A user enables reduced motion while a transition is running. The media query removes the transition, but an inline transform written by JavaScript remains. Identify which system owns the animated property. Reset that inline value or settle the timeline in the animation owner, then ensure future state changes use the reduced-motion path. Test preference changes while motion is active, not only before page load.

### Scenario D: A long list feels slow despite short transitions

Every row has a staggered entrance and each row animates a shadow and transform. Individually, the animation looks smooth; together, they create paint work and delay scanning. Remove nonessential motion, reduce the number of simultaneous effects, and profile realistic content in the Performance panel. A concise color highlight or static update indicator may communicate the same change more efficiently.

**Gotcha:** The transition's duration is only one part of perceived delay. Stagger offsets, event handling, layout work, and waiting for application data can all affect how quickly the user can act.

## Ownership and Maintenance

Each transition should have an owner: a component, design-system token, or documented interaction pattern. Avoid placing one-off motion rules in unrelated global selectors where future changes can affect controls unexpectedly. If a component's state changes, review its entrance, exit, interruption, reduced-motion behavior, and keyboard behavior together.

For design-system work, document:
- the semantic state that triggers the transition;
- the properties allowed to interpolate;
- duration and easing tokens;
- whether the effect is optional or essential to orientation;
- reduced-motion behavior;
- the policy for focus and pointer interaction during exit;
- expected behavior when transitions are canceled;
- target browsers and the regression test.

When refactoring, do not change a token based on one isolated component. Compare the effect across buttons, menus, popovers, dialogs, and status messages. A token can be consistent yet inappropriate for a high-frequency interaction. Prefer a small number of intentional variants over a single value used everywhere or a large catalog of nearly identical values.

## Final QA Pass

Before merging a transition change, ask a reviewer to operate the page without a mouse, then with reduced motion enabled. Repeat the primary interaction rapidly, interrupt the transition, and test the same component at a narrow viewport. Inspect computed values in DevTools and check a performance trace if the change affects many elements or uses paint-heavy properties.

A good review should be able to answer three questions: what semantic state changed, what visual cue communicates that change, and what happens if the visual cue never runs? If any answer is unclear, simplify the transition or improve the state model before shipping.

## Final Principle

A transition should make a state change easier to understand without making the interface slower, less accessible, or less reliable. Keep semantic state authoritative, choose properties deliberately, test interruptions and reduced motion, and make sure the interface remains correct when the animation never runs.
