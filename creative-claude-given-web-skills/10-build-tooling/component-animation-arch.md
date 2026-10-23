# Component Animation Architecture

**Layer:** 10 — Build Tooling / Architecture  
**Skill slug:** `component-animation-arch`  
**Focus:** Designing reusable, accessible, testable animation behavior at the component and application-architecture levels.

## Goal

Build an animation architecture in which motion is a deliberate part of a component contract rather than scattered imperative code. The system should make animation states explicit, keep lifecycle cleanup reliable, preserve interaction semantics, support reduced-motion preferences, and remain maintainable as components are reused across pages and routes.

## Why This Matters

Poorly designed component animation tends to fail in specific, expensive ways: exit animations never run because a component is unmounted immediately; repeated mounts create duplicate timelines or event listeners; route transitions leave the page visually frozen; two animation libraries compete for the same `transform`; a modal becomes invisible to assistive technology while it is still interactive; and reduced-motion settings are ignored because the preference was checked only once at application startup. These are architecture failures, not merely easing-choice problems. A shared animation contract makes the states, ownership, timing, cancellation, and accessibility behavior visible to the whole team.

A useful architecture also prevents accidental coupling. A button should not need to know whether a parent page uses CSS transitions, Web Animations API, or a timeline library. A route shell should not reach into a child component's private DOM. A list component should be able to animate insertion and removal without every caller reimplementing index calculations. At the same time, abstraction must not hide the important details: who owns the element, which property is animated, what happens when a new interaction arrives, and what completion means.

This skill focuses on the seam between design-system components and application orchestration. It covers state modeling, animation ownership, lifecycle integration, composable variants, interruption, list identity, route transitions, accessibility, testing, performance, and failure handling. Examples use React-style components and browser APIs where useful, but the principles apply to other component frameworks too.

## Operating Principles

- Model motion as a transition between named states, not as a loose collection of callbacks.
- Give each animated property one clear owner at a time.
- Treat mount, update, unmount, cancellation, and route change as distinct lifecycle events.
- Keep semantic state and visual interpolation related but not identical: a closing dialog may be visually exiting while its semantic close behavior is already controlled.
- Make reduced-motion behavior an explicit supported path.
- Prefer transform and opacity for frequent movement; measure before optimizing less common effects.
- Make interruption and cleanup ordinary cases, not exceptional afterthoughts.
- Keep component APIs small and composable; expose intent rather than implementation internals.

## Reference Architecture

A practical system has four cooperating layers:

1. **Tokens:** durations, easing curves, distances, spring presets, and reduced-motion policy.
2. **Primitives:** low-level wrappers for entrance, exit, presence, stagger, and gesture feedback.
3. **Components:** dialogs, menus, cards, tabs, accordions, and lists that declare semantic states and select primitives.
4. **Orchestration:** page-level sequences, route transitions, and coordinated multi-component choreography.

The layers should communicate through documented state and lifecycle contracts. Tokens should not import page components. A primitive should not decide product meaning. A component should not secretly manage a global route timeline. Orchestration may coordinate components, but it should not bypass their cleanup or accessibility rules.

## 1. Model Animation States Explicitly

An animation is easiest to reason about when its meaningful states are named. For a disclosure component, those might be `closed`, `opening`, `open`, and `closing`; for a notification, `entering`, `visible`, `leaving`, and `removed`. The distinction between a semantic state and a transition phase is important. A dialog can be semantically closing while its pixels are still fading out. If one boolean is used to represent both meanings, code tends to race: setting `open` to false immediately removes the element, so the exit animation cannot complete.

Define the legal transitions before writing effects. Identify which events trigger them, which transitions can be interrupted, and what should happen if a second event arrives before the first animation completes. For example, if a user reopens a panel during its closing phase, the system should reverse or cancel the close transition rather than continue to remove it. If a route changes during a long page sequence, the route transition should have an explicit cancellation policy. State modeling makes these decisions reviewable and testable.

```tsx
type Phase = 'closed' | 'opening' | 'open' | 'closing';

type Event =
  | { type: 'OPEN' }
  | { type: 'OPEN_FINISHED' }
  | { type: 'CLOSE' }
  | { type: 'CLOSE_FINISHED' };

function transition(phase: Phase, event: Event): Phase {
  switch (`${phase}:${event.type}`) {
    case 'closed:OPEN': return 'opening';
    case 'opening:OPEN_FINISHED': return 'open';
    case 'open:CLOSE': return 'closing';
    case 'closing:CLOSE_FINISHED': return 'closed';
    case 'closing:OPEN': return 'opening';
    default: return phase;
  }
}
```

The example intentionally ignores events that are invalid for the current phase. In production, log or assert unexpected transitions in development if they indicate a caller bug. Avoid creating a state machine for every one-off hover; use explicit phases when a component has asynchronous completion, exit presence, interruption, or multiple coordinated states. The objective is not complexity for its own sake. It is to stop asynchronous visual behavior from becoming an implicit, untestable state machine hidden in scattered effects.

**Gotcha — completion is not guaranteed:** an animation may be canceled, its element may be detached, or a browser may skip work because of reduced motion. Do not assume every start event will be followed by a successful finish event. Provide a cancellation and fallback path that restores a valid state.

## 2. Separate Semantic State from Visual Presence

A component often needs to remain mounted briefly after its semantic state changes. This is the presence problem. A menu that is no longer open should stop accepting input immediately, but it may need to remain in the DOM long enough to animate its exit. A toast should be removed after its exit transition, not before. A dialog requires more care: focus, inertness, escape handling, and background interaction must follow the accessibility contract, not simply the opacity value.

Use a small presence layer that accepts a desired `present` value and reports when exit completion permits removal. Keep this layer independent from the component's business meaning. A toast can use it to fade out; a list item can use it to collapse; a modal can use it while separately managing focus and modal semantics. The presence layer should handle cancellation: if `present` becomes true again while an exit is in progress, it should cancel removal and return to the entered state.

```tsx
function usePresence(present: boolean, exitMs: number) {
  const [mounted, setMounted] = React.useState(present);
  React.useEffect(() => {
    if (present) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const id = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(id);
  }, [present, mounted, exitMs]);
  return mounted;
}
```

This timer-based example is a minimal illustration, not a universal production solution. A real primitive should prefer the actual animation completion or a robust timeout fallback, because CSS duration can change through tokens or media queries. If `animationend` is used, account for events bubbling from descendants and for canceled animations. If the browser's Web Animations API is used, handle the rejected `finished` promise when an animation is canceled. The key is that presence removal is coordinated with the visual lifecycle and remains safe under rapid state changes.

**Gotcha — hiding is not the same as removing:** `opacity: 0` does not automatically remove an element from keyboard navigation, pointer hit testing, or the accessibility tree. Apply the correct semantic and interaction behavior for the component while it exits.

## 3. Define an Animation Token Contract

Animation tokens are the shared vocabulary of the system. They should express intent such as `fast`, `standard`, `emphasis`, `enter`, and `exit`, not encode a particular component name into every token. A token set usually includes durations, easing curves, travel distances, and occasionally spring presets. Keep the list small enough that teams can learn it and specific enough that changes remain meaningful. Avoid a sprawling set of near-identical values that makes consistency impossible.

Tokens need a policy for reduced motion. Some transitions can become nearly instantaneous; others should be replaced with a non-spatial cue; some decorative sequences should be removed entirely. Centralizing the policy prevents a component author from needing to invent a separate accessibility interpretation. Use CSS custom properties for CSS-driven effects and a typed object for JavaScript-driven effects, while keeping their names and values synchronized through one source of truth or a documented generation step.

```css
:root {
  --motion-duration-fast: 120ms;
  --motion-duration-standard: 220ms;
  --motion-duration-emphasis: 360ms;
  --motion-ease-standard: cubic-bezier(.2, .8, .2, 1);
  --motion-ease-enter: cubic-bezier(0, 0, .2, 1);
  --motion-distance-small: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 1ms;
    --motion-duration-standard: 1ms;
    --motion-duration-emphasis: 1ms;
  }
}
```

A one-millisecond duration is a pragmatic way to keep transition events predictable in some systems, but it is not the only policy. If application code depends on a CSS transition event, instant transitions may still need a deterministic fallback. Do not use the token layer to hide motion that should be eliminated for reduced-motion users. For example, a large parallax effect should usually be disabled rather than compressed to a one-millisecond flash. Document which tokens are appropriate for feedback, content transitions, and decorative choreography.

**Gotcha — token drift:** if JavaScript has a 220 ms duration while CSS uses a 300 ms duration, cleanup may occur before the pixels finish moving. Prefer shared tokens or derive completion from the animation itself instead of duplicating magic numbers.

## 4. Give Animated Properties a Single Owner

The same DOM property should not be controlled concurrently by unrelated systems. A common conflict is CSS changing `transform` while a JavaScript timeline library also writes `transform`. The result may be jumpy motion, unexpected matrix composition, or one system overwriting the other's output. Similar conflicts happen when layout classes set opacity while an entrance primitive animates opacity, or when a gesture handler and a page transition both write the same element's translation.

Choose a clear ownership model. One option is nested wrappers: the outer wrapper owns route-level translation, while the inner component owns local hover scale. Another is a single timeline that composes all required transforms. A third is to use CSS custom properties for independent components of a transform, provided every browser target and animation engine supports the chosen composition strategy. The most maintainable approach is usually to make ownership visible in markup and document which layer controls each property.

```tsx
function CardMotionShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="route-motion-layer">
      <div className="card-interaction-layer">{children}</div>
    </div>
  );
}
```

```css
.route-motion-layer { transform: translateX(var(--route-x, 0)); }
.card-interaction-layer { transform: scale(var(--hover-scale, 1)); }
```

This wrapper strategy gives the route and card different elements to control. It does add DOM structure, so apply it deliberately and avoid wrapping every element without a clear reason. When using a motion library, check whether it supports variants, layout animation, or transform composition before creating custom machinery. The architectural rule remains the same: each property needs a documented owner, and ownership must be stable during transitions.

**Gotcha — inherited animation assumptions:** a child may look correct in isolation but break when a parent introduces a transform, stacking context, clipping, or containing block. Test motion in the actual composition, not only in a component gallery.

## 5. Integrate with Component Lifecycles Safely

Animation setup is a resource allocation operation. Timelines, observers, event listeners, animation frames, and subscriptions all need an owner and a cleanup path. In React, an effect may run more than once during development checks, and components may mount, unmount, or rerender while an animation is in flight. A primitive that creates a timeline on every render can accumulate duplicate work or leave stale callbacks referencing outdated state.

Create imperative animation resources in an effect or a framework-specific lifecycle hook. Store handles in refs when they must be controlled by later events. Clean up listeners and cancel or revert animations when the owner is disposed. Make setup idempotent where possible, and avoid suppressing framework lifecycle checks merely to make an animation appear to run once. If the animation needs the DOM to be measured before paint, use the framework's appropriate layout effect carefully; do not make every animation synchronous by default.

```tsx
function useFadeIn(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  React.useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    const animation = element.animate(
      [{ opacity: 0, transform: 'translateY(6px)' },
       { opacity: 1, transform: 'translateY(0)' }],
      { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'both' }
    );
    return () => animation.cancel();
  }, [ref, enabled]);
}
```

The Web Animations API returns an animation object that should be canceled or otherwise finalized when the component no longer owns it. If the component should preserve the final visual style, ensure the underlying CSS has the final state; do not rely indefinitely on `fill: 'both'` to cover an incorrect base style. For libraries with context or scoped selectors, use the library's context cleanup mechanism. Also avoid putting mutable objects into dependency arrays unless their identity behavior is understood; a stable ref is often appropriate for a DOM node.

**Gotcha — Strict Mode reveals real defects:** duplicate animation starts during development often indicate missing cleanup or non-idempotent setup. Do not treat development lifecycle checks as a reason to disable cleanup.

## 6. Handle Interruption and Reversal

Users rarely wait for an animation to finish before acting again. They reopen menus, rapidly switch tabs, resize windows, navigate away, and click a toggle repeatedly. The architecture must define what happens when an animation is interrupted. Typical policies are: reverse from the current rendered value, cancel and snap to the new state, finish the current transition before accepting a new one, or replace the current sequence with a new sequence. The right choice depends on interaction semantics and perceived responsiveness.

Avoid relying on fixed delays to serialize interactions. A delay can outlive the animation it was intended to represent and may become incorrect when reduced motion changes duration. Prefer animation handles, state transitions, and completion promises with cancellation handling. If a transition is reversible, use the current computed or animation-controlled value as the new start rather than restarting from a hard-coded initial value that causes a visible jump.

```js
let currentAnimation;

function animateTo(element, keyframes, options) {
  currentAnimation?.cancel();
  const animation = element.animate(keyframes, options);
  currentAnimation = animation;
  animation.finished.catch(() => {
    // Cancellation is an expected outcome when a newer state wins.
  });
  return animation;
}
```

This small example assumes one animation owner per element and should be wrapped in a component-scoped controller in real code. A module-global handle would incorrectly couple multiple component instances. Use a ref or controller object owned by the component. If the previous animation's cancellation handler updates state, make sure it cannot overwrite the newer animation's state. A generation counter or identity check can help reject stale completion callbacks. Test fast repeated interaction, not only the ideal single click.

**Gotcha — stale completion:** an old animation may finish after a newer state has begun. Completion handlers should verify that they still belong to the current transition before mutating state or removing elements.

## 7. Animate Lists with Stable Identity

List animation requires stable identity. An index is not a reliable identity when items are inserted, removed, filtered, or reordered. If keys are derived from positions, the framework may reuse a DOM node for a different logical item, producing an animation that appears attached to the wrong content. Give each item a stable key based on its domain identity and keep the visual presence layer aware of insertion and removal separately from array order.

For reorder animations, decide whether the layout change is animated through measurement, FLIP (First, Last, Invert, Play), or a framework primitive. FLIP measures an element's initial and final geometry, applies an inverse transform to visually preserve its old position, then animates that transform to identity. It works well for many layout changes but needs careful handling of removed elements, resized containers, nested transforms, and reduced motion. Avoid measuring every element on every frame; take measurements at state boundaries and batch reads before writes to reduce layout thrashing.

```tsx
items.map(item => (
  <AnimatedListItem key={item.id} item={item} />
))
```

The key must be stable across reordering and should not be a freshly generated random value. When a list item exits, keep its old identity and content until its exit completes; do not simply filter it out of the rendered tree before the presence system can observe the removal. If the list is virtualized, offscreen elements may not exist in the DOM, so animation policy must account for virtualization boundaries. In many data-heavy interfaces, subtle animation on visible changes is better than attempting to animate every item in a large collection.

**Gotcha — index keys and exit state:** using an index key can make the wrong row animate out after a deletion. Include a test that removes the first, middle, and last items from a list with distinct labels.

## 8. Coordinate Stagger and Choreography

Staggered motion creates a temporal relationship between sibling elements. It can help a user understand grouping or reading order, but it can also slow down access to content if every item waits for the previous item. Set a maximum delay and decide whether the sequence is decorative or functional. A list of three cards may benefit from a short stagger; a list of fifty search results should not require a long cascade before all content becomes usable.

Keep choreography at the layer that understands the relationship between components. A page-level sequence can coordinate the title, summary, and content grid; each card should still own its own local hover or focus feedback. Do not make a low-level card primitive aware of its position in every page. Provide a parent-level stagger context or explicit index-based delay when the relationship is genuinely part of the layout contract.

```css
.stagger-item {
  animation: item-enter 220ms var(--motion-ease-enter) both;
  animation-delay: calc(var(--stagger-index, 0) * 35ms);
}

@keyframes item-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .stagger-item { animation: none; }
}
```

If CSS variables are set from data, clamp or validate the index so unexpectedly large lists do not create multi-second delays. Use `animation-delay` for simple CSS choreography, and use a timeline only when sequencing, overlap, reversal, or orchestration complexity justifies it. Do not animate content in a way that changes reading order or makes screen-reader users wait for a visual sequence. The content should remain semantically available according to the component's interaction model.

**Gotcha — delayed usability:** do not hide essential controls until their decorative entrance finishes. Motion should explain hierarchy, not gate access to the interface.

## 9. Architect Route Transitions

Route transitions sit above individual components because they coordinate outgoing and incoming page trees. The router may unmount the old page as soon as navigation completes, so a transition layer needs a supported way to retain the outgoing view or use a framework-specific view-transition capability. Do not try to solve route exit animation by adding a timeout to a component that the router has already destroyed. The transition architecture must be integrated with the routing lifecycle.

Define the navigation contract: when does the URL change, when does focus move, which page title is announced, how are scroll restoration and browser back/forward handled, and what happens if another navigation starts before the current transition finishes? In most applications, navigation semantics should not wait for a long decorative exit. Focus and announcement behavior should remain predictable, and reduced motion should remove or greatly simplify the visual transition. Route animation must not create duplicate IDs by keeping two full page trees active without an intentional strategy.

```tsx
function RouteMotionFrame({ children }: { children: React.ReactNode }) {
  return <main className="route-motion-frame">{children}</main>;
}
```

The wrapper is only a styling boundary; the actual route-presence coordination belongs to the router integration or a dedicated transition manager. Verify the chosen framework's current navigation APIs before implementing this layer, because route lifecycle capabilities vary by router and version. Keep the default route experience functional without animation, and ensure failed data loading or canceled navigation does not leave a stale outgoing page permanently on top. Test direct URL entry, refresh, browser back, browser forward, and rapid navigation in addition to client-side link clicks.

**Gotcha — route transition deadlock:** a transition manager that waits forever for an event that never fires can block navigation. Add a fallback and ensure cancellation resolves the manager to a valid state.

## 10. Make Reduced Motion a First-Class Path

Reduced motion is an input to the design contract, not a late CSS patch. Users may enable the operating-system preference before loading the page or change it while the page is open. CSS media queries handle style-driven animation; JavaScript-driven motion should observe the preference when needed and react to changes. Avoid checking the preference only once and assuming it never changes. For complex sequences, provide a clear reduced-motion variant that removes spatial travel, parallax, auto-rotation, and unnecessary looping while preserving feedback and state clarity.

```js
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

function subscribeToMotionPreference(callback) {
  callback(motionQuery.matches);
  const onChange = event => callback(event.matches);
  motionQuery.addEventListener('change', onChange);
  return () => motionQuery.removeEventListener('change', onChange);
}
```

A React hook or framework adapter should subscribe and clean up with the component lifecycle. Keep the callback's state update local to the owning application scope, and avoid adding one listener per list item when a shared preference provider is more appropriate. For server-rendered applications, remember that `window` does not exist during server rendering; read the preference in a client-only effect or use a CSS-first approach that avoids a hydration mismatch. Reduced motion does not mean all state changes must be silent: a short opacity change, immediate state update, or non-motion cue may still be appropriate.

**Gotcha — SSR access:** reading `window.matchMedia` during server render throws. Keep browser-only APIs behind a client boundary or an effect.

## 11. Preserve Accessibility During Motion

Animation should never be the only signal that a state changed. Menus need correct expanded state, dialogs need focus management, tabs need correct selection semantics, and accordions need button controls with `aria-expanded` and relationships to their panels. An element that is visually fading out may still be focusable; an element that is visually moving in may be announced before it is ready for interaction. Define the semantic state and the interaction state explicitly, and make the visual timeline follow those contracts.

Do not move focus simply because a decorative animation completed. Focus changes should follow user intent and component semantics. For modal dialogs, trap or manage focus according to the chosen dialog implementation, restore focus on close, and prevent background interaction while the modal is active. For live regions and notifications, avoid announcing every animation frame. For auto-playing sequences, provide pause or stop controls where the motion is nonessential and persistent. Test with keyboard navigation and at least one screen reader in the target environment; visual inspection alone cannot validate accessible state.

```tsx
<button
  type="button"
  aria-expanded={open}
  aria-controls="filters-panel"
  onClick={() => setOpen(value => !value)}
>
  Filters
</button>
<div id="filters-panel" hidden={!open}>
  {/* panel content */}
</div>
```

This simple example demonstrates semantic state but does not itself implement an exit animation, because `hidden` removes the visible transition immediately. A production component should combine semantic state with a presence mechanism and ensure the exiting panel is no longer an unintended keyboard target. This is exactly why accessibility and animation architecture must be designed together instead of adding ARIA attributes after the animation is complete.

**Gotcha — invisible focus target:** if a closing element can still receive focus after becoming transparent, keyboard users can lose track of where they are. Make focusability and visibility transition together according to the component contract.

## 12. Test Motion as State and Behavior

Animation tests should not depend entirely on wall-clock timing. A test that sleeps for 500 ms is slow and flaky, and it may fail on a busy runner even when the component is correct. Prefer testing state transitions, accessible attributes, presence removal, cancellation, and the fact that an animation was configured with the intended properties. Where visual timing is important, use a controlled clock, deterministic animation mock, or browser-level test with explicit completion signals.

Build a test matrix around the failure cases the architecture is meant to prevent: opening and closing quickly; unmounting during animation; changing reduced-motion preference; rendering two instances simultaneously; list reorder and deletion; route navigation interrupted by another route; animation cancellation; and browser back/forward. Add visual regression tests for complex choreographies, but do not use screenshots as the only proof of accessibility or lifecycle correctness. Instrumentation in development can expose active timeline counts or warn when an element is controlled by conflicting systems.

```tsx
it('does not keep an exiting item after completion', async () => {
  render(<Toast open={false} message="Saved" />);
  // Use the project's controlled animation helper to resolve the exit.
  await act(async () => finishPendingAnimations());
  expect(screen.queryByText('Saved')).not.toBeInTheDocument();
});
```

The helper in this example is project-specific; it must be implemented in the test harness rather than assumed to exist in React Testing Library. Document how animation promises, CSS events, or timers are controlled in tests. Keep at least one browser-level test for behavior that depends on actual CSS transitions or layout measurements. The goal is a deterministic suite that catches lifecycle defects without requiring every test to wait for real motion.

**Gotcha — fake timers are not a complete animation engine:** advancing timers does not automatically dispatch CSS transition events or resolve Web Animations API promises. Mock the abstraction the component actually uses.

## 13. Protect Runtime Performance

The animation architecture should make expensive behavior difficult to introduce accidentally. Frequent animations of `top`, `left`, `width`, or `height` can trigger layout and paint work; transform and opacity are often better choices for movement and fading, though they still need profiling on real devices. Avoid reading layout after writing styles in the same loop, which can force synchronous layout. Batch measurements first, then apply writes. Use `requestAnimationFrame` only when a custom frame loop is justified, and always cancel it when its owner is disposed.

Do not create hundreds of simultaneous animations by default. Virtualized lists should animate visible items selectively. Respect battery and low-power constraints on mobile. Avoid infinite decorative loops that continue while offscreen or when the tab is hidden, unless there is a strong product reason. Intersection Observer can pause nonessential animation when an element leaves the viewport, but do not use visibility as a reason to suspend meaningful state updates. Performance is an empirical property: profile on representative hardware, inspect dropped frames, and measure layout, paint, and scripting costs rather than assuming that a transform is always free.

```js
let frameId = 0;
let disposed = false;

function tick(now) {
  if (disposed) return;
  updateVisualState(now);
  frameId = requestAnimationFrame(tick);
}

frameId = requestAnimationFrame(tick);
function dispose() {
  disposed = true;
  cancelAnimationFrame(frameId);
}
```

A custom loop should compute from elapsed time rather than incrementing a fixed amount per frame, because frame rate varies. It should also handle visibility changes if the animation should pause in a background tab. Prefer native CSS or Web Animations API for simple transitions; custom loops are appropriate for simulation-like motion or continuously changing values that cannot be expressed declaratively. Do not build a homegrown timeline engine for a fade and slide.

**Gotcha — `will-change` everywhere:** promoting every element can increase memory use and compositing overhead. Add it only when measurement shows a benefit and remove it when the animation ends if appropriate.

## 14. Document the Component Animation API

A reusable component should expose intent in its public API. Prefer props such as `open`, `reducedMotion`, `variant`, or `presence` over props that leak internal library handles or require callers to coordinate CSS classes manually. Avoid a generic `animateEverything` flag that has unclear semantics. Document whether a component supports exit animation, whether it can be interrupted, what happens when duration changes, and whether callers can disable motion. Keep the default behavior sensible and accessible.

A primitive can expose lifecycle callbacks such as `onEntered`, `onExited`, or a promise-based controller, but these callbacks need a clear guarantee: do they fire when the animation completes, when it is canceled, or whenever the component reaches the target state? Naming and documentation should distinguish those cases. Do not promise a callback will always run if a component unmounts unexpectedly unless the implementation can guarantee it. If an imperative API is necessary, scope it to the component instance and provide a disposal contract.

```tsx
type MotionProps = {
  present: boolean;
  duration?: number;
  reducedMotion?: boolean;
  onExited?: () => void;
};
```

This type is only the start of an API. Documentation must also specify duration units, default token mapping, precedence between an explicit `reducedMotion` prop and the system preference, and what occurs if `present` changes during an exit. Avoid making every token configurable by every caller; excessive knobs undermine design consistency. Use a small escape hatch for genuinely exceptional cases and measure how often it is used. The architecture is successful when component consumers can express product intent without understanding the animation engine's internal bookkeeping.

**Gotcha — ambiguous callbacks:** if `onExited` can run twice because both a timeout and an animation event fire, the API is not safe. Make completion idempotent and test the competing completion paths.

## 15. Establish Ownership Boundaries for Third-Party Libraries

A motion library can provide excellent primitives, but its ownership should be explicit. Decide whether the library owns element transforms, layout measurement, presence, gestures, and route choreography. Mixing two libraries is sometimes reasonable, but it multiplies the number of interactions that need testing. If one library owns component transitions and another owns page-level timelines, establish wrapper boundaries and avoid attaching both to the same element.

Hide third-party-specific details behind a small internal adapter when the application needs a stable design-system API. The adapter can map semantic variants to library options and centralize reduced-motion behavior. Do not wrap every library feature in a massive generic abstraction; expose only the stable subset the product uses. Pin compatible versions, review major-version migration notes, and ensure server-rendering behavior is understood. Animation libraries often have specific constraints around layout effects, refs, portals, and cleanup.

```tsx
interface MotionDriver {
  enter(element: HTMLElement): () => void;
  exit(element: HTMLElement): Promise<void>;
}
```

An adapter interface like this is useful only if the application genuinely needs replaceable drivers or deterministic tests. For a small project, a direct library API may be clearer. If an abstraction is introduced, define cancellation semantics: does the cleanup function cancel the active animation, restore original styles, or merely stop future work? Promise resolution should represent a documented outcome and should not leave callers waiting forever after cancellation. Keep the adapter narrow enough that it does not reproduce the entire third-party library poorly.

**Gotcha — hidden inline styles:** some animation engines leave inline styles behind unless explicitly reverted. Verify that unmount, route changes, and interrupted transitions restore the expected baseline styles.

## 16. Choose Between CSS, Web Animations API, and a Timeline Library

CSS transitions are strong for state-driven changes that map naturally to classes or attributes. CSS keyframes are useful for declarative, repeating or multi-step sequences. The Web Animations API is useful when JavaScript must create, pause, reverse, cancel, or await a specific animation without importing a full timeline engine. A timeline library becomes valuable when multiple elements need precise sequencing, overlap, labels, scrubbing, or complex choreography. Choose the smallest mechanism that satisfies the requirements.

The choice should consider lifecycle integration, cancellation, reduced-motion policy, testing, bundle size, team familiarity, and browser support. Do not choose a library solely because a demo looks impressive. If the application only needs an accordion to expand, CSS may be sufficient. If it needs a route transition coordinated with a complex hero sequence and scroll scrubbing, a timeline may be justified. If a library is already a core dependency, use its supported patterns rather than writing a competing abstraction.

```js
const animation = element.animate(
  [{ transform: 'translateY(8px)', opacity: 0 },
   { transform: 'translateY(0)', opacity: 1 }],
  { duration: 220, easing: 'ease-out' }
);

// The owner can later pause, reverse, or cancel this exact animation.
animation.pause();
```

The example shows a direct animation handle. In component code, create it at the right lifecycle boundary, retain the handle in an instance-scoped ref, and cancel it during cleanup. CSS remains easier to inspect in simple cases and can respond directly to media queries. A library should earn its dependency cost through clearer orchestration or capabilities that are otherwise costly to maintain.

**Gotcha — animation engine sprawl:** two animation libraries often duplicate easing, scheduling, and cleanup concerns. Require a documented reason for introducing a second engine.

## 17. Named Patterns

### Pattern 1 — Presence Boundary

**What it does:** keeps a component mounted while its exit animation runs, then removes it after completion. **When to use:** menus, toasts, disclosure panels, list rows, and other components whose visual exit must outlive their semantic state change. Keep focus and input behavior separate from visual presence. Use a completion signal plus a timeout fallback, and cancel pending removal if the component becomes present again.

```tsx
<PresenceBoundary present={visible} onExited={removeFromQueue}>
  <ToastContent />
</PresenceBoundary>
```

The `PresenceBoundary` name represents an internal primitive, not a built-in React component. Its contract should define how it handles canceled animations, unmounts, reduced motion, and duplicate completion signals. Do not implement exit removal as an untracked timeout inside every consumer.

### Pattern 2 — Variant Contract

**What it does:** maps named semantic variants to a consistent set of initial, active, and exit styles. **When to use:** repeated component families such as cards, drawers, and menus where motion should be consistent but context may select a different variant. Keep variants finite and typed; avoid arbitrary caller-supplied objects unless there is a clear extension use case.

```ts
const variants = {
  subtle: { distance: 4, duration: 140 },
  standard: { distance: 8, duration: 220 },
  emphasis: { distance: 14, duration: 320 },
} as const;
```

Map these values to design tokens rather than duplicating values across CSS and JavaScript. Document whether variants change only timing or also change spatial distance and easing.

### Pattern 3 — Nested Transform Ownership

**What it does:** separates transform responsibilities onto nested wrappers so route movement and local interaction scale do not overwrite each other. **When to use:** cards inside animated pages, draggable elements with hover feedback, and components that participate in both local and global motion.

```html
<div class="route-layer"><div class="interaction-layer">Card</div></div>
```

Use wrappers where each layer has a real responsibility. Avoid uncontrolled wrapper proliferation; the markup should make ownership easier to understand.

### Pattern 4 — Interruptible Controller

**What it does:** gives a component-instance controller authority to cancel or reverse the current animation before starting a new one. **When to use:** toggles, drawers, menus, and gestures where users can change their mind mid-transition.

```js
function createController(element) {
  let active = null;
  return {
    play(frames, options) {
      active?.cancel();
      active = element.animate(frames, options);
      active.finished.catch(() => {});
      return active;
    },
    dispose() { active?.cancel(); active = null; },
  };
}
```

Create one controller per owned element or component instance. A shared global controller causes unrelated components to cancel each other's motion.

### Pattern 5 — FLIP Layout Transition

**What it does:** preserves perceived position while layout changes by measuring First and Last geometry, applying an inverse transform, and playing back to identity. **When to use:** sortable cards, compact list reorder, and grid rearrangement where a smooth spatial explanation helps. Avoid it for huge lists or layouts where measuring geometry is too expensive.

```js
const first = element.getBoundingClientRect();
// Apply state change and measure the final layout in the appropriate frame.
const last = element.getBoundingClientRect();
const dx = first.left - last.left;
const dy = first.top - last.top;
element.animate(
  [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
  { duration: 220, easing: 'ease-out' }
);
```

In production, ensure the two measurements occur on opposite sides of the layout update and that existing transforms are composed rather than overwritten. Handle scale changes, scroll position, nested transforms, and reduced motion.

### Pattern 6 — Reduced-Motion Adapter

**What it does:** translates the system preference into a stable policy consumed by CSS and JavaScript animation primitives. **When to use:** any application with multiple animation mechanisms or persistent choreography. Centralize subscription and cleanup instead of adding separate `matchMedia` listeners to every leaf component.

```ts
type MotionPolicy = { reduce: boolean; durationScale: number };
const reducedPolicy: MotionPolicy = { reduce: true, durationScale: 0 };
```

The adapter should update if the preference changes during the session and should not access browser globals during server rendering.

### Pattern 7 — Route Transition Coordinator

**What it does:** owns outgoing/incoming route presence, transition cancellation, and navigation completion signals. **When to use:** applications with meaningful page-level transitions. Keep routing semantics, focus management, scroll restoration, and visual choreography in a documented sequence rather than unrelated component effects.

```ts
type RoutePhase = 'idle' | 'exiting' | 'entering';
function canStartNavigation(phase: RoutePhase) {
  return phase !== 'exiting' || true; // Replace with the chosen interruption policy.
}
```

This sketch intentionally highlights a design decision rather than providing production logic. Replace the policy with a real rule such as cancel-and-replace, queue, or immediate navigation. Do not copy the placeholder expression as an implementation.

### Pattern 8 — Animation Test Driver

**What it does:** gives tests deterministic control over start, finish, cancellation, and preference changes. **When to use:** components whose correctness depends on asynchronous completion or exit presence. Test the public behavior rather than asserting implementation-specific frame counts.

```ts
interface TestAnimationDriver {
  finishAll(): Promise<void>;
  cancelAll(): void;
  setReducedMotion(reduced: boolean): void;
}
```

Keep the test driver aligned with the abstraction used by production code. If the component uses native CSS events directly, the test harness must simulate those events or use browser tests.

## 18. Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| A. Unmounting before exit | The browser has no element to animate. | Add a presence boundary that delays removal until exit completion. |
| B. Using one boolean for all phases | Semantic state and visual presence race each other. | Model desired presence separately from transition phase. |
| C. No cancellation cleanup | Timelines and listeners survive their owner. | Store handles and cancel/dispose them in lifecycle cleanup. |
| D. Starting animation during render | Render may repeat and should remain side-effect free. | Create animation resources in a lifecycle effect or event handler. |
| E. Using array indexes as keys | Reorder can animate the wrong logical item. | Use stable domain identifiers as keys. |
| F. Sharing one animation handle globally | One component can cancel another component's animation. | Scope controllers to component instances or elements. |
| G. Two systems write `transform` | The last writer overwrites or composes values unexpectedly. | Assign ownership by wrapper or one orchestration engine. |
| H. Hard-coding durations in several places | Exit removal and visual timing drift apart. | Use shared tokens or actual animation completion. |
| I. Assuming `finished` never rejects | Cancellation can reject the promise. | Handle cancellation as an expected outcome. |
| J. Ignoring reduced motion in JS | CSS and JavaScript behavior diverge for users. | Centralize preference and provide an explicit JS policy. |
| K. Reading `window` during SSR | Server rendering has no browser global. | Access browser APIs after hydration or inside client-only code. |
| L. Hiding focusable content with opacity | Invisible controls can remain keyboard reachable. | Coordinate semantic visibility, focusability, and presence. |
| M. Delaying all content in a stagger | Large lists become slow to access. | Cap stagger duration and keep content usable immediately. |
| N. Animating layout on every frame | Repeated layout work can cause jank. | Prefer transform/opacity and batch geometry reads and writes. |
| O. Applying `will-change` everywhere | Extra layers can increase memory and compositing cost. | Add hints only after profiling and remove when no longer needed. |
| P. Relying on only `animationend` | Canceled or removed elements may never emit the expected event. | Add cancellation handling and a bounded fallback path. |
| Q. Using untracked timeouts | Stale timeout can remove a reopened component. | Retain and clear timeout handles when state changes. |
| R. Testing with arbitrary sleeps | Tests become slow and nondeterministic. | Use controlled animation completion and targeted browser tests. |
| S. Animating route without router integration | The outgoing tree may already be unmounted. | Integrate presence with the router lifecycle. |
| T. Leaving inline styles behind | Later states inherit stale animation output. | Revert or cancel library-owned styles and define a correct CSS baseline. |
| U. Making a callback fire twice | Both event and fallback paths can report completion. | Make completion idempotent and verify active transition identity. |
| V. Treating every hover as a state machine | Abstraction cost exceeds the problem. | Reserve explicit phases for asynchronous, interruptible, or presence-sensitive motion. |
| W. Using random keys to force re-entry | Every render remounts components and destroys continuity. | Keep stable keys and model re-entry explicitly. |

## 19. Mental Models

1. **An animation is a state transition with a visual interpolation.** The target state is authoritative; the pixels are an intermediate representation.
2. **Presence is a lifecycle contract.** An element may be visually present after it is semantically closed, but it must not remain interactable by accident.
3. **Every animated property needs one owner.** Multiple writers are a coordination bug waiting to happen.
4. **Cancellation is a normal result.** New user intent often supersedes old motion, so cleanup must work for canceled animations as well as completed ones.
5. **Stable identity is the foundation of list motion.** The system needs to know which logical item is moving, leaving, or entering.
6. **Accessibility semantics should not be inferred from opacity.** Visual appearance and interaction state are related but distinct.
7. **Tokens encode design decisions.** A small motion vocabulary is easier to audit than scattered numbers and one-off curves.
8. **The simplest capable engine is usually best.** CSS, the Web Animations API, and timeline libraries serve different levels of complexity.
9. **A route is an orchestration boundary.** Page-level motion belongs with navigation lifecycle, not inside arbitrary leaf effects.
10. **Test transitions, not elapsed time alone.** Deterministic completion and cancellation tests are more reliable than sleeping and hoping.
11. **Performance is measured, not assumed.** Transform and opacity are often good defaults, but profiling decides whether a design works on target devices.
12. **Reduced motion is a supported mode.** It should preserve state clarity and interaction, not merely shorten every animation.

## 20. Build Challenge: Create an Animation Architecture

Build a small design-system package for a portfolio or product interface. It must contain an animation token layer, a presence primitive, at least two animated components, and a page-level orchestration example. The objective is not to produce the most elaborate motion; it is to prove that the architecture remains correct when users interrupt it and when the browser environment changes.

### Requirements

1. Define named duration and easing tokens for fast feedback, standard transitions, and emphasis transitions.
2. Define and document a reduced-motion policy that works for CSS and JavaScript-driven animation.
3. Implement a presence boundary that supports entry, exit, cancellation, and re-entry before exit completion.
4. Build an accessible disclosure or menu component with accurate semantic state and keyboard behavior.
5. Build a toast or notification component whose exit animation completes before removal from the queue.
6. Build a reorderable list with stable item identity and a documented behavior for deletion during animation.
7. Demonstrate local component motion and route-level motion without both systems writing the same element's transform.
8. Include a controller or adapter that handles canceled Web Animations API promises safely.
9. Ensure every animation resource, listener, observer, timeout, and frame loop has a cleanup path.
10. Ensure browser-only APIs are not read during server rendering.
11. Provide a reduced-motion version that does not rely on large spatial movement or long stagger delays.
12. Add automated tests for normal entry and exit, rapid open-close-open, and unmount during animation.
13. Add a test that removes the first list item while another item is entering, verifying the correct item remains.
14. Add a test that changes reduced-motion preference while the component is mounted.
15. Add a test with two simultaneous instances to detect shared-controller bugs.
16. Add a route-navigation test that performs a second navigation before the first transition completes.
17. Verify keyboard focus cannot remain on an invisible exiting control.
18. Add a fallback for an animation that is canceled or never emits its expected completion event.
19. Profile one representative animation on a target mobile device or browser emulation and record observed bottlenecks.
20. Document which parts use CSS, the Web Animations API, or a timeline library and why.
21. Document public component props, completion callback semantics, duration units, and interruption policy.
22. Include a no-motion path that preserves the same final component state and access to content.
23. Confirm that route refresh, direct URL entry, back, and forward navigation still work.
24. Add a development diagnostic or test assertion that detects duplicate completion and stale callbacks.
25. Record one real failure reproduced during testing, the conditions that trigger it, and the regression test that prevents its return.

### Failure Scenarios to Reproduce

- Click a disclosure open, close it immediately, and reopen it before the exit completes.
- Remove the first item in a list while the list is reordering.
- Navigate to page B and then page C before page B's entrance has finished.
- Unmount a component while its Web Animations API promise is pending.
- Toggle reduced motion while a long-running animation is active.
- Mount two copies of the same component and verify that controlling one does not cancel the other.
- Force the normal completion event not to arrive and verify the UI still reaches a valid state.

## 21. Quick Reference

| Need | Preferred approach | Verify |
|---|---|---|
| Simple state change | CSS transition | Correct final style and reduced-motion path |
| Multi-step CSS sequence | CSS keyframes | No essential content is delayed |
| JS-controlled single animation | Web Animations API | Handle cancellation and cleanup |
| Complex coordinated sequence | Timeline library | One owner per animated property |
| Enter/exit lifecycle | Presence boundary | Re-entry cancels pending removal |
| List reorder | Stable keys plus FLIP or framework primitive | Correct identity after insert/delete/reorder |
| Route transition | Router-integrated coordinator | Back/forward, refresh, and interruption work |
| Reduced-motion support | Shared policy plus media query | Preference changes while mounted |
| Dialog animation | Accessible dialog state plus presence | Focus, escape, and background interaction remain correct |
| Stagger | Parent-level choreography | Delay is capped and content remains usable |
| Performance issue | Profile layout, paint, and scripting | Test on representative hardware |
| Flaky timing test | Controlled animation driver | No arbitrary sleep required |
| Duplicate animation | Lifecycle cleanup and ownership diagnostics | Active handles return to baseline |
| Inline style residue | Cancel/revert and baseline CSS | Re-entering component starts from a known state |
| Infinite loop | Visibility-aware pause or removal | Offscreen work is not wasteful |
| Animation callback | Idempotent completion contract | Event and fallback cannot complete twice |

## 22. Definition of Done / Success Criteria

- [ ] Animation states, interruption rules, and presence semantics are documented for every component that supports exit animation.
- [ ] Tokens are centralized, named by intent, and consistent across CSS and JavaScript consumers.
- [ ] Every imperative animation resource has a cleanup path, and cancellation does not produce unhandled promise rejections.
- [ ] Each animated property has a clear owner; nested wrappers or a single orchestration system prevent competing writes.
- [ ] Lists use stable keys and correctly animate insertion, deletion, and reorder without transferring motion to the wrong item.
- [ ] Reduced-motion behavior is implemented for both CSS and JavaScript animation and can update during a session.
- [ ] Semantic state, keyboard focus, and accessibility attributes remain correct throughout visual transitions.
- [ ] Route transitions preserve navigation, focus, refresh, and browser history behavior.
- [ ] Automated tests cover interruption, unmount, duplicate instances, preference changes, and at least one missing-completion failure.
- [ ] Browser-level validation covers real layout or CSS behavior that unit tests cannot faithfully simulate.
- [ ] Performance has been measured on a representative target and unnecessary layout work has been addressed.
- [ ] The public API exposes product intent rather than internal timeline machinery, and its callback guarantees are documented.
- [ ] The architecture works without animation and leaves all essential content and controls accessible.
- [ ] The build passes type checks, linting, unit tests, and the application's production build.

## Final Review Checklist

Before merging, review the actual rendered page at normal speed and with reduced motion enabled. Repeat the interactions quickly enough to interrupt every transition. Inspect console output for rejected promises and duplicate listeners. Test with keyboard-only navigation. Confirm the outgoing route cannot remain as an invisible overlay. Confirm a toast that is reopened or requeued cannot be removed by an old timeout. Inspect list behavior after filtering and sorting. Check that multiple instances do not share mutable controller state. Finally, verify that the chosen abstraction reduces duplication without hiding state transitions, cancellation, and ownership from maintainers.


### Implementation Review 1: State-machine review prompts

For every named phase, record its entry condition, exit condition, allowed events, and visual representation. Decide whether a repeated event is ignored, reverses the current transition, or queues a new one. Make the default branch intentional. A transition reducer is often easier to test than a set of loosely coupled booleans because impossible combinations become harder to represent. Review state models with product and accessibility requirements in view: a visually closing panel may no longer be available for interaction, and a route can be semantically active before its entrance motion finishes. Keep the phase count proportionate to the behavior; a simple hover should not need a five-state controller.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 2: Presence verification

Inspect the DOM at three points: immediately after the desired state changes, while the exit is running, and after completion. The element should remain only for the visual interval that requires it, and its interaction behavior should match the semantic state. Re-entry must clear pending removal. A timeout is a fallback, not the source of truth where a real completion signal is available. If both a native event and a fallback can fire, route them through one idempotent completion function. Verify that a descendant animation event does not accidentally finish the parent transition.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 3: Token governance

Review token changes as design-system changes. A token should have a name, unit, intended use, reduced-motion behavior, and a known set of consumers. Avoid separate copies of the same value in TypeScript, CSS, and storybook examples. If code generation is used, make the generation step repeatable and fail the build when generated files are stale. Ensure tokens have sensible defaults if a component is rendered outside the expected theme provider. Tokens are a contract between design and engineering, so renaming or changing their semantics deserves migration notes.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 4: Ownership review

For each animated element, list the systems that can write opacity, transform, dimensions, clip path, and filter. If more than one system writes a property, explain the composition mechanism and order. Use browser developer tools to inspect computed styles and active animations during an interrupted transition. Nested wrappers are a practical isolation technique, but they can change stacking contexts and containing blocks, so check fixed-position descendants, clipping, and z-index behavior. The architecture should make ownership obvious from the component structure or an explicit controller.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 5: Lifecycle verification

Mount and unmount the component repeatedly and inspect whether active animation handles, event listeners, observers, and timers return to baseline. Test development lifecycle behavior as well as production behavior. Ensure cleanup is safe if the animation has already finished, been canceled, or never started. Avoid callbacks that close over stale props and then mutate state after a newer transition begins. If a library offers scoped contexts, use its documented cleanup mechanism and keep that detail inside the adapter rather than duplicating it across components.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 6: Interruption policy review

A transition should have a defined answer for each competing event. Reversing is often best for a toggle because it tracks the user's latest intent; cancel-and-snap may be appropriate for an urgent navigation or dismissal; queueing is suitable only when preserving order matters. Test rapid interaction with a controlled driver and on a real browser. When a new animation replaces an old one, only the current animation may finalize state. A generation token, identity check, or state-machine event can reject stale completion callbacks without relying on timing assumptions.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 7: List identity checks

Test insertions at the beginning and middle, deletions at each position, reorder after filtering, and updates that preserve item identity while changing content. Use a stable domain key, not an index or random key. When exit presence temporarily retains removed items, ensure they cannot collide with a newly inserted item that happens to have the same visual position. Virtualization adds another boundary: items outside the rendered window may not have measurable DOM geometry, so define a policy rather than forcing animation for every offscreen record.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 8: Choreography limits

A stagger should reinforce hierarchy without creating a queue for access. Set a maximum delay independent of item count, and consider disabling stagger for long lists or reduced-motion users. The sequence should not reorder semantic reading order. Keep choreography at the parent that understands the group; individual children should remain reusable in isolation. When a sequence is interrupted, decide whether remaining children start immediately, stop, or follow a replacement sequence. Do not allow old delayed callbacks to run after the parent has unmounted.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 9: Route lifecycle checks

Validate navigation from direct links, client-side links, back/forward buttons, and refresh. Define which page receives focus and when the title or route announcement occurs. Ensure the outgoing page cannot trap keyboard focus after the incoming route becomes active. If both route trees coexist for animation, avoid duplicate IDs and duplicate landmark announcements. Use router-supported transition integration and test error routes and loading boundaries, not only successful navigation between two fully loaded pages.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 10: Reduced-motion audit

Audit CSS transitions, keyframes, Web Animations API calls, timeline-library defaults, auto-playing loops, and scroll-linked effects. A media query alone does not affect JavaScript-created animations unless the JavaScript policy also checks the preference. Test preference changes while the app is open and ensure a running animation can be canceled or simplified. Server-rendered components should not read browser APIs during render. Reduced motion should preserve meaning, state, and interaction while removing unnecessary movement and long delays.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 11: Accessibility review

Use keyboard navigation to test focus order before, during, and after entry and exit. Verify expanded and selected states update with user intent rather than at an arbitrary animation frame. Confirm transparent elements are not unexpectedly tabbable and that dialogs manage focus correctly. Do not use motion as the only indication of validation, selection, or success. Test with a screen reader for components whose semantics are complex, and check that decorative sequences do not flood live regions with repeated announcements.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 12: Deterministic test strategy

Create a test abstraction that can finish, cancel, or hold animations. Prefer assertions on visible presence, accessible attributes, callback counts, and final state over assertions on a specific number of milliseconds. Use browser tests for geometry and actual CSS behavior. Include regression tests for the exact edge condition that previously failed. Make test setup restore global animation mocks and media-query listeners so one test cannot contaminate the next. If the production abstraction uses promises, test both resolution and cancellation rejection.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 13: Performance review

Profile representative interactions on target devices, not only on a high-end development laptop. Check whether animation causes layout, paint, compositing, scripting, or garbage-collection pressure. Batch geometry reads before writes and avoid per-frame DOM queries. Use requestAnimationFrame for custom loops only when declarative animation cannot express the behavior, and derive values from timestamps rather than assumed frame counts. Pause nonessential continuous effects when offscreen or when the document is hidden. Avoid broad `will-change` declarations unless profiling demonstrates a benefit.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 14: Public API review

Document units, defaults, token precedence, callback semantics, cancellation behavior, and whether exit presence is supported. Keep public props semantic and avoid leaking third-party timeline objects unless imperative control is a real requirement. Ensure callbacks are idempotent and cannot fire twice from competing event and fallback paths. Provide a sensible default motion behavior, an accessible no-motion path, and a limited escape hatch for exceptional use cases. If consumers repeatedly override a token, revisit the token design rather than adding unlimited component props.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 15: Library boundary review

Keep third-party library usage behind the narrowest useful boundary. Verify version compatibility, server-rendering constraints, ref requirements, cleanup APIs, and whether inline styles are reverted after cancellation. Do not allow two libraries to animate the same property on the same element. An adapter is justified when it stabilizes a public API or makes tests deterministic; it is not justified merely to rename every library method. If a second engine is introduced, document which capabilities require it and how the two systems are isolated.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.


### Implementation Review 16: Engine selection review

Choose CSS for declarative state transitions, CSS keyframes for simple multi-step sequences, the Web Animations API for imperative control of individual animations, and a timeline library for genuine orchestration complexity. Evaluate cancellation, reduced motion, testing, bundle impact, team familiarity, and browser support. Do not introduce a dependency for a simple fade. Conversely, do not maintain a fragile homegrown scheduler when a well-supported timeline library would reduce complexity. Keep the chosen engine consistent within an ownership boundary.

Use this review note during implementation and code review. Record the expected behavior before testing so that the result is judged against a real contract rather than an aesthetic preference. For components with asynchronous motion, test both the ideal path and at least one interrupted path. For shared primitives, test more than one instance at the same time. For any behavior tied to browser state, test the state changing while the component remains mounted. These checks keep the architecture understandable when requirements or timing values change.
