# GSAP Core — Production-Grade Animation Foundations

> **Skill file:** `gsap-core/SKILL.md`
> **Layer:** 03 — Animation & Motion
> **Scope:** GSAP 3 tweens, timelines, easing, stagger, callbacks, lifecycle, responsive animation, accessibility, debugging, and framework cleanup.
> **Use this skill when:** an interface needs coordinated motion that is difficult to express reliably with a small set of CSS transitions or keyframes.
> **Do not use this skill when:** a simple hover/focus transition is enough, CSS scroll-driven animation is sufficient, or motion adds no meaningful value.

## Why This Matters

Production animation failures rarely look like a syntax error. They look like a hero title that flashes before animating, a timeline that plays twice after a React rerender, cards that remain invisible when JavaScript fails, a menu that animates out but still traps keyboard focus, or a mobile layout whose animation covers the primary action. These failures harm usability, accessibility, perceived performance, and trust.

GSAP is powerful because it gives a consistent timing model for tweening properties and coordinating sequences. That power is also a responsibility: a timeline can own many targets, callbacks can mutate application state, and animation state can conflict with CSS or a component framework. Good GSAP code makes ownership, lifecycle, timing, and final state explicit.

The central production rule is simple: **animate intentionally, keep the final UI usable, and make every animation safe to create, interrupt, clean up, and skip.** Prefer `transform` and `opacity` for frequent motion. Avoid animating layout-triggering properties such as `top`, `left`, `width`, and `height` unless layout interpolation is the actual design requirement and profiling shows it is acceptable. A transform-based visual move does not change document flow; that difference matters for menus, cards, and responsive layouts.

## 1. Choose GSAP Only When It Solves a Real Coordination Problem

GSAP is most useful when several elements must follow one timing plan: a heading reveals line by line, supporting copy enters afterward, a button follows, and a background accent moves on a different track. It also helps when an animation must be paused, reversed, sought to a label, restarted, or synchronized with a user action. CSS remains the simpler default for isolated state transitions.

Before writing code, describe the interaction in one sentence: “When the panel opens, the panel fades and rises into view, the content follows with a short stagger, and the close control remains available.” This statement defines trigger, targets, sequence, and usable end state. If the description is only “make it move,” the design intent is not specific enough.

A GSAP implementation should have a clear trigger and a clear owner. A component should own the timeline that animates its descendants; a page-level orchestration layer may own a sequence that spans multiple sections. Avoid having two unrelated systems animate the same property on the same target. CSS hover rules, a framework state update, and a GSAP tween all writing `transform` can overwrite one another in confusing ways.

**Gotcha:** GSAP does not automatically make an animation meaningful or accessible. A polished entrance that delays access to navigation or hides essential content until a callback runs is still a poor interaction.

```js
import { gsap } from "gsap";

const intro = document.querySelector("[data-intro]");
if (intro) {
  gsap.fromTo(
    intro,
    { autoAlpha: 0, y: 16 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.55,
      ease: "power2.out",
      clearProps: "transform"
    }
  );
}
```

The example is deliberately small. In a real application, decide whether the content should be visible when JavaScript is unavailable, whether reduced motion should skip the entrance, and whether the target can be animated again without creating duplicate tweens.

## 2. Understand the Tween Contract

A tween describes how target properties change over time. The most common forms are `gsap.to()`, `gsap.from()`, and `gsap.fromTo()`. `to()` animates from the current value toward the specified value. `from()` animates from the supplied values toward the current values. `fromTo()` declares both ends explicitly.

```js
gsap.to(".notice", {
  x: 0,
  autoAlpha: 1,
  duration: 0.4,
  ease: "power2.out"
});

gsap.from(".feature-card", {
  y: 18,
  autoAlpha: 0,
  duration: 0.5,
  stagger: 0.08,
  ease: "power3.out"
});

gsap.fromTo(
  ".progress-indicator",
  { scaleX: 0, transformOrigin: "left center" },
  { scaleX: 1, duration: 0.7, ease: "power1.inOut" }
);
```

Use `from()` with care. The starting values are applied immediately when the tween initializes, and GSAP may render its start state before the animation progresses. This can produce a flash when a page first paints. If a target must never flash, control its initial state intentionally and test with a throttled CPU and a cold page load. `immediateRender` and lazy initialization behavior are useful to understand, but should not be used as a substitute for designing a safe initial state.

A tween’s `duration` is measured in seconds. `delay` postpones its start. `repeat` controls additional repetitions; `repeat: -1` repeats indefinitely and therefore needs a clear lifecycle and stop condition. `yoyo: true` alternates direction between repeats. `repeatDelay` adds a pause between repeats. These options should be chosen from the user experience, not by trial and error alone.

Avoid treating animation properties as arbitrary CSS strings. GSAP supports many CSS properties and special properties, but unit compatibility still matters. Moving from `10px` to `3rem` may require meaningful conversion context. Prefer consistent units and stable layout assumptions, especially for responsive components.

## 3. Choose Between `to`, `from`, and `fromTo` Deliberately

Use `to()` for interaction states where the browser’s current visual state is the correct starting point. For example, a button can move a few pixels when pressed and return when released. Use `from()` for reveal effects where the destination is already defined by layout styles. Use `fromTo()` when both endpoints are part of the design contract, such as a progress bar that must always start at zero.

```js
const panel = document.querySelector("[data-panel]");

if (panel) {
  const openPanel = () => gsap.to(panel, {
    y: 0,
    autoAlpha: 1,
    duration: 0.32,
    ease: "power2.out",
    overwrite: "auto"
  });

  const closePanel = () => gsap.to(panel, {
    y: -8,
    autoAlpha: 0,
    duration: 0.22,
    ease: "power1.in",
    overwrite: "auto"
  });
}
```

The panel’s hidden state should be represented in a way that matches the product’s interaction model. `autoAlpha` combines opacity and visibility, which can help prevent an invisible element from remaining pointer-interactive. It does not replace proper semantic state. For a disclosure, synchronize `aria-expanded`, the controlled element, and keyboard behavior. For a modal, manage focus and inert background content as part of the component, not as an incidental animation callback.

When multiple tweens may target the same element, decide how they interact. `overwrite: "auto"` can resolve conflicting property tweens, but it is not a substitute for clear state ownership. If an opening animation and closing animation can run rapidly, test repeated clicks, keyboard activation, and interrupted motion.

## 4. Use Timelines for Relationships, Not Just Longer Code

A timeline coordinates child tweens on a shared playhead. It can express sequence, overlap, labels, pause points, reverse playback, and time seeking. A timeline is usually easier to reason about than multiple independent tweens with hand-calculated delays.

```js
const heroTimeline = gsap.timeline({
  defaults: {
    duration: 0.55,
    ease: "power3.out"
  }
});

heroTimeline
  .from("[data-hero-eyebrow]", { y: 12, autoAlpha: 0 })
  .from("[data-hero-title]", { y: 28, autoAlpha: 0 }, "-=0.28")
  .from("[data-hero-copy]", { y: 14, autoAlpha: 0 }, "-=0.22")
  .from("[data-hero-actions]", { y: 10, autoAlpha: 0 }, "-=0.18");
```

A timeline position can be an absolute time, a label, or a relative expression. `"-=0.2"` starts the next child 0.2 seconds before the current end; `"+=0.2"` leaves a gap. `"<"` aligns with the start of the previous child; `">"` aligns with its end. These concise expressions are powerful, but excessive position arithmetic can make the sequence hard to review. Use labels when a sequence has meaningful phases.

```js
const sequence = gsap.timeline({ paused: true });

sequence
  .addLabel("intro")
  .from("[data-step='intro']", { autoAlpha: 0, y: 20, duration: 0.4 })
  .addLabel("details")
  .from("[data-step='details']", { autoAlpha: 0, y: 14, duration: 0.35 }, "-=0.1")
  .addLabel("complete")
  .from("[data-step='complete']", { autoAlpha: 0, scale: 0.98, duration: 0.3 });
```

Labels give other code a stable vocabulary: `sequence.play("details")` is easier to understand than `sequence.play(0.73)`. Do not assume a timeline automatically waits for asynchronous work. If an animation depends on a network response or application state, coordinate that state explicitly rather than hiding network logic inside a motion callback.

**Gotcha:** A timeline with no explicit lifecycle can continue running after its component disappears. Store the timeline where its owner can kill or revert it, and clean it up when the owner is removed.

## 5. Read the Position Parameter as a Timing Language

The timeline position parameter is one of GSAP’s most valuable features. Use it to communicate relationships, not to create a puzzle. Absolute positions are useful when the composition has a fixed rhythm. Relative positions are useful when one event should overlap another. Labels are useful when a scene has named phases.

| Position | Meaning | Typical use |
|---|---|---|
| `0` | Start at timeline time zero | Align the first movement |
| `1.2` | Start at 1.2 seconds | Deliberate fixed timing |
| `"+=0.2"` | Start 0.2 seconds after the timeline end | Breathing room between phases |
| `"-=0.2"` | Start 0.2 seconds before the current end | Overlap two entrances |
| `"<"` | Align to the start of the previous child | Parallel motion |
| `">"` | Align to the end of the previous child | Explicit sequential motion |
| `"intro"` | Start at a named label | Jump to a semantic phase |
| `"intro+=0.3"` | Start 0.3 seconds after a label | Offset within a named phase |

A frequent mistake is to add arbitrary delays to every tween and then struggle to change the sequence. Start with a timeline, establish the major beats, and add offsets only when the overlap is intentional. Review the timeline with the animation paused and ask whether each movement contributes to hierarchy or comprehension.

## 6. Build Easing from Intent

Easing controls how a tween distributes change over time. A linear ease has constant rate; it often feels mechanical for interface motion. `power1.out`, `power2.out`, and `power3.out` decelerate toward the end and work well for arrivals. `power1.in` and similar `in` variants accelerate away from rest and are useful for exits. `power1.inOut` eases at both ends and is useful for reversible or continuous movements.

```js
const motionTokens = {
  enter: "power3.out",
  exit: "power2.in",
  move: "power2.inOut",
  linear: "none"
};

gsap.to("[data-drawer]", {
  x: 0,
  duration: 0.38,
  ease: motionTokens.enter
});
```

Do not choose a stronger ease simply because it looks more dramatic. A dashboard with repeated interactions benefits from restrained motion; a one-off brand moment can support more expressive timing. Back and elastic eases can overshoot or oscillate. Use them only when that behavior is part of the visual language and does not imply that a control is unstable.

Name eases in a token object when multiple components should feel related. That makes tuning consistent and reviewable. Duration and easing should be treated as design decisions. If every component uses a different duration and a different ease, the interface can feel assembled rather than composed.

**Gotcha:** Avoid using bounce, elastic, or large back overshoots for important status messages, error indicators, or motion-sensitive contexts. They can make an otherwise serious interface feel noisy and can be uncomfortable for some users.

## 7. Use Stagger to Reveal Groups with Hierarchy

`stagger` offsets the start time of each target. It can be a number or an object with options such as `each`, `amount`, `from`, `grid`, and `ease`. A simple numeric stagger is usually enough for a small list. An object is useful when the reveal should originate from a specific item or move across a grid.

```js
gsap.from("[data-result-card]", {
  y: 16,
  autoAlpha: 0,
  duration: 0.42,
  ease: "power2.out",
  stagger: {
    each: 0.07,
    from: "start"
  }
});
```

Stagger should support the information hierarchy. If all items are equally important, a short stagger can establish sequence without making the user wait too long. If a group contains many items, use a bounded total amount so the last item does not arrive seconds after the first. For a grid, test both wide and narrow breakpoints because the perceived order may change when the layout reflows.

Stagger does not make a large list cheap to animate by itself. Hundreds of DOM nodes can still cost time, particularly when each item triggers text splitting, filters, shadows, or layout work. Animate a meaningful subset, use virtualization where the product needs it, and profile on representative hardware.

## 8. Use Callbacks for Small Lifecycle Hooks

GSAP callbacks include `onStart`, `onUpdate`, `onComplete`, `onRepeat`, `onReverseComplete`, and others. They are useful for synchronizing small UI effects with an animation lifecycle. Keep callbacks deterministic and lightweight. A callback that triggers a state update, mutates the DOM, and starts another timeline can make control flow difficult to trace.

```js
const status = document.querySelector("[data-status]");

const progressTween = gsap.to("[data-progress-fill]", {
  scaleX: 1,
  transformOrigin: "left center",
  duration: 0.8,
  ease: "power1.out",
  onComplete() {
    if (status) status.textContent = "Complete";
  }
});
```

If the UI is driven by React, Vue, or another framework, prefer changing framework state when the animation reaches a meaningful lifecycle point rather than mutating framework-owned markup directly. A callback can call a supplied function such as `onFinished()`, but the parent should own what that state change means.

Do not put essential application correctness only in `onComplete`. Users can skip motion, browsers can suspend background tabs, and the tween can be killed. The final application state must still be correct if the animation never finishes. Animation completion is a visual event, not a reliable substitute for a transaction or business process.

## 9. Handle Interruptions and Repeated Input

Interfaces are interactive while animations are running. Users may click open, click close, press Escape, navigate away, or change routes before the current motion completes. Decide whether each action should reverse, restart, finish immediately, or cancel. Do not leave the result to accidental tween conflicts.

```js
const drawer = document.querySelector("[data-drawer]");
let drawerTimeline;

function setDrawerOpen(isOpen) {
  if (!drawer) return;

  drawerTimeline?.kill();

  drawerTimeline = gsap.timeline();
  drawerTimeline.to(drawer, {
    x: isOpen ? 0 : 24,
    autoAlpha: isOpen ? 1 : 0,
    duration: isOpen ? 0.32 : 0.22,
    ease: isOpen ? "power2.out" : "power1.in",
    overwrite: "auto"
  });
}
```

This example explicitly kills the prior timeline before creating a replacement. Another valid design is a persistent timeline that plays forward and reverses. Choose one model and document it. A persistent timeline is often ideal for a single reversible disclosure. Recreating a short tween can be fine for a simple state change if target ownership is clear.

Test fast repeated input, not only a single click. A robust animation should not accumulate timelines, attach duplicate listeners, leave inline styles behind, or produce a different end state depending on click timing. Use DevTools to inspect active DOM state and console output; add temporary logging around the action handler and callback if the state sequence is unclear.

## 10. Make Animation Lifecycle Explicit

Every animation should have an owner, a start condition, a stop condition, and a cleanup policy. A one-shot intro can finish and leave its final visual state in place. A looping decorative animation needs an explicit pause or kill when the element is removed or no longer visible. An interaction timeline may be paused until the user activates it.

Use `kill()` to stop a tween or timeline and remove it from GSAP’s active work. Use `pause()` when you intend to resume it later. Use `revert()` when you want to undo GSAP-applied inline changes and restore the target’s pre-animation state where supported by the animation/context setup. These are different intents: killing does not necessarily restore original styles, and pausing does not clean up anything.

```js
const root = document.querySelector("[data-feature]");
let featureTimeline;

if (root) {
  featureTimeline = gsap.timeline({ paused: true });
  featureTimeline.from(root.querySelectorAll("[data-feature-item]"), {
    y: 12,
    autoAlpha: 0,
    duration: 0.35,
    stagger: 0.06,
    ease: "power2.out"
  });
}

function destroyFeatureAnimation() {
  featureTimeline?.revert();
  featureTimeline = undefined;
}
```

Do not rely on the browser to clean up your intent. A removed DOM node may no longer be visible, but event listeners, observers, and references can still be retained elsewhere. Cleanup should cover the animation and any resources created to drive it, including event listeners, observers, and timers.

## 11. Use `gsap.context()` to Scope and Revert Work

`gsap.context()` is useful for scoping selector text to a root and reverting animations together. It is particularly helpful in component-based applications where a component creates several tweens and timelines. The context can collect GSAP animations created while its callback runs.

```js
const root = document.querySelector("[data-profile]");
let profileContext;

if (root) {
  profileContext = gsap.context(() => {
    gsap.from("[data-profile-title]", {
      y: 18,
      autoAlpha: 0,
      duration: 0.45,
      ease: "power2.out"
    });

    gsap.from("[data-profile-stat]", {
      y: 10,
      autoAlpha: 0,
      duration: 0.35,
      stagger: 0.06,
      ease: "power2.out"
    });
  }, root);
}

function cleanupProfile() {
  profileContext?.revert();
  profileContext = undefined;
}
```

The scope root makes selector strings less likely to animate another component that happens to use the same class. It also communicates ownership. In frameworks, create the context when the component mounts and revert it when the component unmounts. Animations created later in event handlers may need to be added to the context intentionally or handled with their own lifecycle.

**Gotcha:** `gsap.context()` is not a universal resource manager. It does not automatically remove every event listener, clear arbitrary application state, or disconnect observers you create outside the context. Clean up those resources explicitly.

## 12. React Integration: Create, Scope, Revert

In React, animations should not be created as an unguarded side effect during render. Use a lifecycle hook and clean up. GSAP provides `useGSAP()` through the `@gsap/react` package, which wraps common context setup and cleanup patterns. If that package is not part of the project, a `useLayoutEffect` or `useEffect` can manage a context directly, depending on whether pre-paint setup is required and how the application renders.

```jsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function FeatureIntro() {
  const root = useRef(null);

  useGSAP(() => {
    gsap.from("[data-feature-title]", {
      y: 20,
      autoAlpha: 0,
      duration: 0.5,
      ease: "power3.out"
    });

    gsap.from("[data-feature-copy]", {
      y: 12,
      autoAlpha: 0,
      duration: 0.4,
      delay: 0.12,
      ease: "power2.out"
    });
  }, { scope: root });

  return (
    <section ref={root} aria-labelledby="feature-heading">
      <p className="eyebrow">A considered workflow</p>
      <h2 id="feature-heading" data-feature-title>Move from idea to outcome</h2>
      <p data-feature-copy>Keep the sequence clear, quick, and easy to skip.</p>
    </section>
  );
}
```

For responsive or prop-dependent animations, use the hook’s dependency options as documented for the installed `@gsap/react` version, and ensure reruns do not accumulate stale timelines. If a dependency changes the animation setup, decide whether to revert and rebuild or update an existing timeline. Do not use a dependency array casually; stale closures can cause callbacks to use old state.

React Strict Mode can intentionally exercise mount and cleanup behavior in development. If an animation runs twice, first verify cleanup and context reversion rather than disabling Strict Mode. A correct component should tolerate mount-cleanup-mount cycles. Keep semantic HTML in the component: a section, heading, paragraph, button, or list should reflect content meaning, not be replaced with generic wrappers solely for animation.

## 13. Reduced Motion Is a Runtime Requirement

Honor `prefers-reduced-motion` for users who request reduced motion. The preference does not mean every animation must be removed; it means the experience should reduce or replace nonessential movement. A quick opacity change or immediate state transition may be suitable where a large spatial sweep is not.

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function createIntroTimeline(root) {
  const timeline = gsap.timeline({ paused: true });

  if (reduceMotion.matches) {
    timeline.set(root.querySelectorAll("[data-intro-item]"), {
      clearProps: "transform,opacity,visibility"
    });
    return timeline;
  }

  timeline.from(root.querySelectorAll("[data-intro-item]"), {
    y: 16,
    autoAlpha: 0,
    duration: 0.42,
    stagger: 0.06,
    ease: "power2.out"
  });

  return timeline;
}
```

This illustrates the decision point, not a universal reset strategy. `clearProps` removes inline values; if CSS intentionally defines an initial hidden state, removing those values may not make content visible. The application should choose a final state that remains usable. For robust behavior, either skip building the motion and render the final state, or use a dedicated no-motion path that sets the intended visible state explicitly.

If the preference can change while the page is open, listen for the media query’s `change` event and clean up the listener. Do not assume that the user’s preference is fixed for the life of the page. Accessibility testing should include keyboard navigation, screen-reader-friendly semantic structure, and reduced-motion behavior—not only visual inspection.

## 14. Keep Initial Content Safe

An animation often starts from `autoAlpha: 0` or `visibility: hidden`. If JavaScript fails to load, the selector does not match, a bundle throws, or a user disables scripts, the content may remain unavailable. Essential content should not require successful animation initialization to become visible.

A safer approach is to leave content visible by default and apply an animation-ready class only after the script is ready. Another approach is to use `from()` without hiding content in CSS, while testing for first-frame flashes. The right choice depends on the layout and rendering sequence, but the principle is constant: no animation failure should block core information.

```html
<section class="feature" aria-labelledby="feature-title">
  <h2 id="feature-title" data-feature-title>Designed for real work</h2>
  <p data-feature-copy>Important content remains available even if motion is skipped.</p>
  <a href="/features" class="feature__link">Explore features</a>
</section>
```

The semantic section, heading, paragraph, and link are useful without GSAP. A decorative animation can enhance this content, but should not determine whether it exists. When using a hidden initial state for a deliberate staging effect, establish a fallback class and ensure it is applied and removed predictably.

**Gotcha:** Do not hide the entire page in CSS and rely on an animation callback to reveal it. A JavaScript exception or a selector mismatch can turn a decorative failure into a blank page.

## 15. Debug with a Repeatable Sequence

Animation bugs become easier to solve when you isolate the owner, target, timing, and lifecycle. Start by confirming that the expected target exists. Then inspect computed values, active inline styles, the tween’s progress, and the timeline’s labels and duration. Use DevTools to check whether another stylesheet or script also writes the animated property.

```js
function inspectAnimationTarget(selector) {
  const target = document.querySelector(selector);

  if (!target) {
    console.warn("Animation target not found:", selector);
    return null;
  }

  const style = getComputedStyle(target);
  const report = {
    selector,
    opacity: style.opacity,
    visibility: style.visibility,
    transform: style.transform,
    display: style.display
  };

  console.table([report]);
  return target;
}

const titleTarget = inspectAnimationTarget("[data-feature-title]");
```

For a timeline you can inspect `progress()`, `time()`, `duration()`, `isActive()`, and `paused()`. Use the GSAP ticker only when you need to understand frame-level behavior; adding a permanent ticker callback for casual logging can itself create noise or overhead. `requestAnimationFrame` is useful for custom frame work, but GSAP already owns its animation loop for GSAP tweens. Avoid running a separate per-frame loop that writes the same property.

A practical DevTools sequence is: reproduce the failure from a clean reload; confirm the target and its computed style; pause execution or add a breakpoint to the event handler; inspect the tween or timeline state; check duplicate listeners and duplicate component mounts; test the interrupted path; then remove temporary logs and retest. Keep a minimal reproduction when the behavior remains unclear.

## 16. Performance: Animate the Smallest Useful Surface

The browser must calculate styles, layout, paint, and composite frames. Transform and opacity animations are commonly the least expensive because they can often be handled by compositing, but this is not a guarantee. Filters, large blur regions, huge shadows, masks, SVG complexity, and many simultaneous layers can still be expensive. Profile on real target devices rather than assuming every transform is free.

Avoid animating `top`, `left`, `width`, and `height` for decorative movement unless the layout change is intentional. Those properties can trigger reflow and repaint. Use `x`, `y`, `scale`, or `rotation` when you only need visual movement. If an element must genuinely change layout dimensions, test that exact behavior and consider whether a layout transition or measured FLIP-style approach is more appropriate.

Do not add `will-change: transform` to every card preemptively. It can encourage layer creation and increase memory usage. Use it sparingly, only after profiling shows a benefit, and remove it when the animation is finished if the element no longer needs it. Large numbers of promoted layers can reduce performance rather than improve it.

```js
const cards = gsap.utils.toArray("[data-card]");

gsap.from(cards, {
  y: 14,
  autoAlpha: 0,
  duration: 0.35,
  stagger: 0.04,
  ease: "power2.out",
  onComplete() {
    cards.forEach((card) => card.style.removeProperty("will-change"));
  }
});
```

In this example, the code only removes `will-change`; it does not add it. That is intentional: do not add a hint unless you have measured a reason. Check the Performance panel for long frames, paint activity, layout work, and dropped frames. Check the Layers panel when the page has too many composited layers. A low frame rate can also come from expensive JavaScript callbacks or excessive DOM updates, not only CSS properties.

## 17. Respect Semantic HTML and Keyboard Interaction

Animation should decorate a meaningful interaction. Use a `<button>` for an action, an `<a>` for navigation, a `<nav>` for navigation landmarks, a `<section>` with a heading for a meaningful region, and a `<ul>`/`<li>` for a list. Do not use a clickable `<div>` where a button already provides keyboard activation and expected semantics.

If an animated drawer opens from a button, synchronize `aria-expanded` and `aria-controls`, and make sure Escape closes it if that is the expected interaction. If it is a modal dialog, use appropriate dialog semantics, move focus into the dialog, trap focus where required, and restore focus to the trigger on close. The animation timeline must not be the only mechanism that enforces those behaviors.

```html
<button type="button"
        data-menu-trigger
        aria-expanded="false"
        aria-controls="site-menu">
  Menu
</button>

<nav id="site-menu" data-menu hidden aria-label="Primary navigation">
  <ul>
    <li><a href="/work">Work</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>
```

The `hidden` attribute removes the menu from rendering and accessibility exposure. If the menu must animate closed, do not apply `hidden` until the exit motion completes; instead, synchronize the animation lifecycle and accessibility state carefully. For opening, remove `hidden` before animating, then make the visible state explicit. Ensure keyboard focus never lands inside a hidden subtree.

Accessibility also includes avoiding motion that is essential to understanding a status. Do not encode success, failure, or selection only by movement. Pair motion with text, color contrast, semantic state, and accessible announcements where needed. Keep `:focus-visible` styling intact when animation code changes outlines or transforms.

## 18. Browser Support and Progressive Enhancement

GSAP supports a broad set of modern browsers, but exact behavior depends on the CSS properties, SVG features, browser version, and plugin being used. Check the GSAP documentation and browser support notes for the installed version and any plugin. For platform APIs such as `matchMedia`, verify support or provide a fallback if the project’s browser baseline requires one. `@supports` can test CSS capabilities, but it does not test whether a JavaScript animation library loaded successfully.

Test in Safari, Firefox, and Chromium-based browsers when they are part of the product’s supported matrix. Verify touch input, reduced-motion preference, viewport changes, font loading, and page navigation. SVG transforms and transform origins deserve extra testing because their behavior can differ from HTML elements. Use caniuse for platform CSS/JS features, and use the GSAP documentation for library-specific support; do not infer GSAP support solely from a CSS support table.

A graceful fallback is a page whose core content remains visible and whose controls still work without the animation. Motion should improve the experience rather than be the only route to a working state. If an animation plugin is optional, load it only where needed and ensure missing-plugin behavior is understood rather than silently breaking the page.

## 19. Pattern Library: Use Named, Reusable Animation Intent

A reusable pattern should define target selection, timing, accessibility expectations, and cleanup. Do not build a universal helper with dozens of boolean options before a real need appears. A small set of named patterns is easier to maintain and tune than duplicated ad hoc values.

### Pattern 1 — Calm Entrance

**What it does:** Reveals content with a small vertical offset and fade.
**When to use:** A hero heading, a short feature section, or a limited set of cards entering the viewport.
**Implementation:**

```js
function animateEntrance(targets) {
  return gsap.from(targets, {
    y: 14,
    autoAlpha: 0,
    duration: 0.42,
    stagger: 0.05,
    ease: "power2.out"
  });
}
```

Keep the distance modest and the duration short. Avoid using the pattern on every element in a long page. If the page has many repeated sections, use viewport-aware orchestration and make sure users who scroll quickly are not forced to wait for content to appear.

### Pattern 2 — Reversible Disclosure

**What it does:** Opens and closes a panel using a persistent timeline.
**When to use:** A menu, a compact details panel, or a non-modal disclosure.
**Implementation:**

```js
const disclosure = document.querySelector("[data-disclosure]");
let disclosureTimeline;

if (disclosure) {
  disclosureTimeline = gsap.timeline({ paused: true });
  disclosureTimeline.fromTo(
    disclosure,
    { y: -6, autoAlpha: 0 },
    { y: 0, autoAlpha: 1, duration: 0.24, ease: "power2.out" }
  );
}

function setDisclosureOpen(open) {
  if (!disclosureTimeline) return;
  if (open) {
    disclosure.hidden = false;
    disclosureTimeline.play();
  } else {
    disclosureTimeline.reverse();
  }
}
```

In production, coordinate the `hidden` attribute after reverse completion and ensure the trigger’s `aria-expanded` reflects the actual state. The example shows the timeline shape; it does not replace a complete disclosure component.

### Pattern 3 — Staggered List Arrival

**What it does:** Gives a list a shared entrance rhythm.
**When to use:** A short result set, onboarding steps, or a compact card group.
**Implementation:**

```js
function revealList(listRoot) {
  const items = listRoot.querySelectorAll(":scope > li");
  return gsap.from(items, {
    y: 10,
    autoAlpha: 0,
    duration: 0.3,
    stagger: { each: 0.045, from: "start" },
    ease: "power2.out"
  });
}
```

Scope the selector to the list root, not the whole document. Keep DOM order and visual order aligned so the animation does not imply a different reading sequence. Do not animate hundreds of list items at once.

### Pattern 4 — Progress Fill

**What it does:** Animates a progress indicator from empty to a defined value.
**When to use:** A known, completed transition where the visual fill reinforces a status already available to the application.
**Implementation:**

```js
function animateProgress(fill, ratio) {
  const safeRatio = Math.min(1, Math.max(0, ratio));

  return gsap.to(fill, {
    scaleX: safeRatio,
    transformOrigin: "left center",
    duration: 0.45,
    ease: "power1.out"
  });
}
```

The semantic progress value must be available independently of the animation. For a real progress bar, provide an accessible name and `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` or use the native `<progress>` element when appropriate. Do not use a decorative tween to imply progress that the underlying task has not made.

### Pattern 5 — Interrupted State Transition

**What it does:** Replaces an in-flight tween with the latest requested state.
**When to use:** Fast toggles, hoverable controls, or compact components where users can change their mind mid-motion.
**Implementation:**

```js
function createStateAnimator(target) {
  let activeTween;

  return function animateTo(isActive) {
    activeTween?.kill();
    activeTween = gsap.to(target, {
      y: isActive ? 0 : 4,
      autoAlpha: isActive ? 1 : 0.72,
      duration: isActive ? 0.22 : 0.18,
      ease: isActive ? "power2.out" : "power1.out",
      overwrite: "auto"
    });
  };
}
```

The returned function keeps ownership of the active tween. If the component is removed, provide a cleanup path that kills the active tween. Do not confuse the visual active state with application state; the caller remains responsible for storing and exposing the actual state.

### Pattern 6 — Labeled Sequence

**What it does:** Groups multiple phases behind readable labels.
**When to use:** A multi-part hero, onboarding sequence, or a short branded reveal.
**Implementation:**

```js
function createOnboardingSequence(root) {
  const timeline = gsap.timeline({ paused: true });

  timeline
    .addLabel("heading")
    .from(root.querySelector("[data-heading]"), {
      y: 18, autoAlpha: 0, duration: 0.4, ease: "power3.out"
    })
    .addLabel("body")
    .from(root.querySelector("[data-body]"), {
      y: 10, autoAlpha: 0, duration: 0.32, ease: "power2.out"
    }, "-=0.12")
    .addLabel("actions")
    .from(root.querySelectorAll("[data-action]"), {
      y: 8, autoAlpha: 0, duration: 0.28, stagger: 0.05,
      ease: "power2.out"
    }, "-=0.08");

  return timeline;
}
```

Validate that selectors return the intended elements before building the sequence. A missing target should not cause the application to hide content. Labels should represent meaningful phases rather than every tiny movement.

### Pattern 7 — Reduced-Motion Immediate State

**What it does:** Chooses a no-motion path while keeping the same final UI state.
**When to use:** Decorative entrances, onboarding movement, or a large spatial transition that is unnecessary for comprehension.
**Implementation:**

```js
function showItems(root, reduceMotion) {
  const items = root.querySelectorAll("[data-reveal-item]");

  if (reduceMotion) {
    gsap.set(items, { clearProps: "transform,opacity,visibility" });
    return null;
  }

  return gsap.from(items, {
    y: 12,
    autoAlpha: 0,
    duration: 0.36,
    stagger: 0.04,
    ease: "power2.out"
  });
}
```

Before using this pattern, confirm the stylesheet’s baseline state. If CSS leaves elements hidden, clearing inline properties is not enough. The no-motion path must render visible, usable content and preserve keyboard access.

### Pattern 8 — Scoped Component Animation

**What it does:** Keeps selector matching and animation cleanup inside one component root.
**When to use:** Reusable cards, widgets, and component trees that may appear more than once.
**Implementation:**

```js
function mountCardMotion(root) {
  const context = gsap.context(() => {
    gsap.from("[data-card-heading]", {
      y: 8,
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.out"
    });
  }, root);

  return () => context.revert();
}
```

Call the returned cleanup function when the component is removed. This pattern prevents broad selectors from matching unrelated cards and gives the component a predictable lifecycle.

## 20. Mistakes and Corrective Actions

| Mistake | Why it fails | Corrective action |
|---|---|---|
| Hiding content in CSS before GSAP loads | A script failure can leave a blank section | Keep semantic content visible by default or add a deliberate animation-ready fallback |
| Creating a new timeline on every render | Duplicate timelines compete and leak work | Create in a lifecycle hook and revert on cleanup |
| Animating `top` for a visual nudge | Can trigger layout work | Prefer `y`/`transform` and profile the actual result |
| Animating `width` for a decorative reveal | Can cause reflow and change surrounding layout | Use `scaleX` when only the visual fill needs to change |
| Using `from()` without checking first paint | The target may flash or jump | Test cold loads and choose a safe initial-state strategy |
| Using selectors scoped to the whole document | Multiple components may animate together | Use a root and `gsap.context()` |
| Starting independent tweens for the same property | The result depends on timing and overwrite behavior | Give one owner the state transition and define interruption rules |
| Using `onComplete` as business logic | Killed or skipped animation may prevent the callback | Make application state independent of animation completion |
| Repeating a tween forever with no stop condition | Wastes work and can distract users | Define pause/kill conditions and respect reduced motion |
| Adding `will-change` to every target | Can create excessive compositing layers | Add it only after profiling demonstrates a benefit |
| Using a giant stagger on a long list | Delays access to later content | Bound total stagger time or animate only a meaningful subset |
| Ignoring reduced-motion preference | Creates avoidable motion for sensitive users | Use `matchMedia` and a real no-motion state |
| Removing focus outlines during motion | Keyboard users lose location feedback | Preserve visible `:focus-visible` indicators |
| Making a `<div>` act like a button | Keyboard and semantic behavior are incomplete | Use `<button>` or `<a>` according to the action |
| Applying `hidden` before exit finishes | The element disappears before the animation can run | Apply `hidden` after reverse completion and sync ARIA state |
| Forgetting listener cleanup | Repeated mounts can add duplicate handlers | Remove listeners or use abortable listeners in the component cleanup |
| Treating `kill()` as style restoration | Inline styles may remain on the target | Use `revert()` or explicitly restore the intended state |
| Ignoring SVG transform origins | SVG movement can differ across browsers | Test SVG targets in Safari, Firefox, and Chromium |
| Logging on every animation frame | Console output can distort performance | Log lifecycle milestones or sample selectively |
| Assuming a transform is always free | Large layers, filters, or complex paints can still jank | Profile in DevTools and inspect paint and layer activity |

## 21. Production Debugging Checklist

Use this sequence whenever an animation looks wrong, does not finish, or behaves differently after navigation.

1. **Reproduce from a clean reload.** Confirm whether the issue occurs on first load, after a route change, or only after repeated interaction.
2. **Confirm the target exists.** Inspect the selector result and count. If it is missing, fail safely instead of hiding the component.
3. **Inspect computed styles.** Use DevTools and `getComputedStyle()` to check opacity, visibility, transform, display, and any competing CSS.
4. **Inspect the timeline.** Check `progress()`, `duration()`, `time()`, `paused()`, and `isActive()`.
5. **Check ownership.** Search the codebase for other tweens, CSS transitions, state updates, or event handlers that write the same property.
6. **Check interruption behavior.** Test rapid open-close-open sequences and confirm the final state is deterministic.
7. **Check cleanup.** Navigate away and back, inspect duplicate listeners, and confirm context reversion or timeline killing.
8. **Check accessibility state.** Confirm `aria-expanded`, `hidden`, focus placement, Escape behavior, and visible `:focus-visible` styling.
9. **Check reduced motion.** Change the operating-system preference or emulate it in DevTools and verify that content remains usable.
10. **Profile the expensive frame.** Use the Performance panel and Layers panel; identify layout, paint, JavaScript, or layer pressure rather than guessing.
11. **Test browser differences.** Verify Safari, Firefox, and Chromium where supported, particularly for SVG and responsive layout.
12. **Remove debug instrumentation.** Keep reusable diagnostics only if they are safe and genuinely useful in development.

## 22. Mental Models for Reliable GSAP Work

1. **The timeline is a clock.** Child tweens are scheduled against a shared time axis; labels name meaningful moments.
2. **A tween has an owner.** The component or orchestration layer that creates it is responsible for interruption and cleanup.
3. **Animation is presentation, not state.** A button’s open state, a task’s completion, or a progress value must exist independently of the tween.
4. **The final state matters more than the entrance.** Users may arrive late, skip motion, navigate back, or have JavaScript fail.
5. **A selector is a boundary.** Scoped selectors prevent one instance of a reusable component from animating another.
6. **Interruption is normal input.** Users do not wait politely for an animation to finish before changing their minds.
7. **Reduced motion is another supported mode.** It should preserve the same information and available actions, not merely shorten every duration mechanically.
8. **Performance is measured.** A transform is a good starting point, not a guarantee that the whole frame is cheap.
9. **Callbacks are lifecycle hooks, not transactions.** They should not be the only place where important application state becomes correct.
10. **Cleanup restores predictability.** Revert or kill owned animations and separately release listeners, observers, and timers.
11. **Semantics survive decoration.** A heading remains a heading, a button remains a button, and keyboard focus remains visible while things move.
12. **Timing tokens create consistency.** Shared durations and named easing choices make motion feel like one system rather than unrelated effects.

## 23. Build Challenge: Create an Accessible Animated Feature Panel

Build a reusable feature panel with a title, descriptive copy, a list of three benefits, a progress indicator, and an action button. The implementation must use GSAP 3 and semantic HTML.

1. Create a `<section>` with an accessible heading, paragraph, `<ul>` list, progress indicator, and real `<button>`.
2. Keep content readable if GSAP fails to load; do not hide the whole panel in a stylesheet.
3. Animate the heading, paragraph, and list with a short, coherent timeline.
4. Use a named ease token rather than unexplained easing values.
5. Use a bounded stagger so the last list item appears promptly.
6. Add a labeled timeline phase for the main copy and another for the action area.
7. Make the action interrupt or reverse motion safely when activated repeatedly.
8. Update the button’s accessible state when it toggles the panel, including `aria-expanded` and `aria-controls` if the panel is collapsible.
9. Honor `prefers-reduced-motion` and make the no-motion path render the same useful final state.
10. Scope all selectors to the component root so two panels can exist on the same page.
11. Provide cleanup that reverts GSAP-owned inline styles and removes event listeners.
12. Preserve a visible `:focus-visible` indicator and confirm all controls work with keyboard only.
13. Use DevTools to verify the animation in Safari, Firefox, and Chromium if those browsers are within the project’s support matrix.
14. Profile the animation and verify that frequent movement uses `transform` and `opacity` where suitable.
15. Verify the panel with JavaScript disabled, with reduced motion enabled, and after rapid repeated activation.
16. Test the failure case where one expected data attribute is missing; the panel must remain visible and usable.
17. Confirm there are no duplicate timelines or listeners after repeatedly mounting and unmounting the component.
18. Document which properties animate, which component owns the timeline, how interruptions are handled, and what cleanup restores.

### Suggested test matrix

| Scenario | Expected result |
|---|---|
| Fresh page load | Panel content remains available; motion enhances rather than gates it |
| Keyboard-only interaction | Button receives focus and has visible `:focus-visible` styling |
| Reduced motion enabled | No large spatial entrance; all content and actions remain available |
| Rapid repeated activation | Final panel state matches the latest user action |
| Missing target attribute | No fatal error or permanently hidden content |
| Component unmount/remount | No duplicate listeners or active stale timelines |
| Narrow viewport | No clipped heading or action; visual and reading order remain aligned |
| Safari / Firefox / Chromium | Motion and final state remain functionally consistent |
| Performance recording | No unexplained long task or avoidable layout churn |
| JavaScript failure | Semantic content is still readable and navigable |

## Definition of Done

- [ ] Every tween and timeline has an identifiable owner and cleanup strategy.
- [ ] Timelines use labels or clear position relationships where coordination is needed.
- [ ] Duration and easing choices are named, intentional, and consistent with the product.
- [ ] Interrupted and repeated interactions reach a deterministic final state.
- [ ] No essential content depends on a successful animation callback to become visible.
- [ ] Reduced-motion behavior is implemented and tested.
- [ ] Semantic HTML, keyboard behavior, accessible state, and `:focus-visible` styling remain intact.
- [ ] Frequent motion favors `transform` and `opacity`; layout properties are used only when justified.
- [ ] Performance is checked in DevTools on a representative device or throttled profile.
- [ ] Browser support assumptions are documented and tested against the project’s baseline.
- [ ] Component cleanup reverts GSAP changes and removes separately created listeners or observers.
- [ ] The feature passes the build challenge’s missing-target, rapid-interaction, reduced-motion, and JavaScript-failure tests.

## Quick Reference

| Need | Use | Watch out for |
|---|---|---|
| Animate toward a target state | `gsap.to()` | Another system may own the same property |
| Reveal from an initial state | `gsap.from()` | First-frame flash and initial visibility |
| Specify both endpoints | `gsap.fromTo()` | Keep units compatible |
| Coordinate multiple steps | `gsap.timeline()` | Define owner and cleanup |
| Add overlap | Position parameter such as `"-=0.2"` | Avoid unreadable timing arithmetic |
| Name sequence phases | `addLabel()` | Labels should express meaningful stages |
| Reveal a group | `stagger` | Keep total reveal time bounded |
| Use a shared default | Timeline `defaults` | Override only when there is a reason |
| Stop active work | `kill()` | Does not mean restore original inline styles |
| Restore GSAP changes | `revert()` / context `revert()` | Other resources still need cleanup |
| Scope selectors | `gsap.context(callback, root)` | Explicitly manage non-GSAP resources |
| React lifecycle | `useGSAP()` or a lifecycle hook with context | Verify cleanup and dependencies |
| Reduced motion | `matchMedia("(prefers-reduced-motion: reduce)")` | No-motion path must still show content |
| Debug target state | `getComputedStyle()` and DevTools | Check competing writers and selector scope |
| Diagnose frame cost | Performance and Layers panels | Transform does not guarantee zero paint cost |
| Avoid conflicting tweens | Clear ownership and `overwrite` policy | Overwrite does not replace state design |
| Smooth repeated input | Persistent reversible timeline or kill-and-replace | Test rapid toggles |
| Express easing | Named ease token | Avoid inconsistent one-off timing |
| Handle completion | `onComplete` for visual synchronization | Never make it the only business-state update |
| Maintain focus | Semantic controls and `:focus-visible` | Animation must not erase keyboard location |

## Final Operating Rule

Treat GSAP as a coordinated motion system with explicit ownership, timing, state, accessibility, and cleanup. Build the simplest animation that communicates the intended change; test the interrupted and reduced-motion paths as carefully as the happy path; and use browser profiling to validate performance rather than relying on assumptions.


## Field Notes: Tween property and value strategy

When animating CSS properties, use GSAP's documented CSSPlugin behavior rather than assuming every CSS declaration is interchangeable with a JavaScript property. Transform aliases such as `x`, `y`, `scale`, and `rotation` are convenient and readable. They also make intent clearer than manually building a transform string. Avoid mixing a hand-authored `transform` declaration with GSAP transform aliases on the same element unless you understand how the transform is composed. If CSS owns the baseline transform, inspect it in DevTools before choosing the animation values.

For colors, use consistent color formats and confirm contrast at the final state. For numeric CSS custom properties, register typed properties when browser support and the design system call for interpolation, or animate a concrete CSS property instead. For SVG, test `transformOrigin`, scaling, and rotation in target browsers. Do not assume an SVG group and an HTML element calculate their coordinate systems in exactly the same way.

Use `invalidate()` only when a tween must re-read dynamic start/end values before a later playback. It is useful for a timeline that measures a target and then replays after layout changes, but it does not automatically solve every responsive measurement problem. If the target dimensions change, remeasure deliberately and decide whether the animation should rebuild, invalidate, or use a different responsive approach.


## Field Notes: Timeline architecture and maintainability

Treat a long timeline like a small program. It needs a readable entry point, named phases, a known final state, and a cleanup policy. Split unrelated interactions into separate timelines instead of creating a single global timeline that owns the entire page. A page-level timeline is appropriate when the page itself is a single orchestrated scene; it is not automatically appropriate for every independently interactive card.

A useful architecture separates three concerns: state decides what should be shown, the timeline describes how the visual transition happens, and lifecycle code decides when the timeline is created and destroyed. That separation makes it easier to skip animation for reduced motion, tests, or a user action that needs an immediate result. It also makes it possible to replace the motion implementation without rewriting the product state model.

Use labels to make a sequence legible to other developers. Name labels for phases such as `intro`, `details`, `actions`, or `complete`. Avoid names like `phase2` if the phase has a clear meaning. When a timeline needs dozens of tiny offsets to appear right, reconsider the sequence: it may contain too many independent events or lack a clear hierarchy.


## Field Notes: Stagger design and reading order

Stagger can make a list feel directed, but it should not make reading order ambiguous. The visual reveal should normally follow DOM order. A grid stagger can originate from a center point or a corner, but the final layout should still communicate the same relationships to users who do not perceive the motion. When cards wrap at different widths, a stagger configuration designed for a desktop grid may feel odd on mobile; test the responsive layouts separately.

For long lists, use a small, bounded total duration. A fixed `each` value means total time grows as the item count grows. An `amount` value can be better when you want the group to complete in a defined time window. Measure the number of items in realistic data, not only the three-card mockup. If the user must act immediately, avoid delaying the action behind a large stagger.

Do not attach expensive per-item callbacks unless the interaction genuinely needs them. A callback for every item can produce a large amount of work and noisy logs. If the application only needs to know when the entire group is complete, use the parent timeline’s completion callback instead.


## Field Notes: Callbacks and application state

Callbacks should be idempotent where practical. If a timeline is restarted, reversed, or killed, consider whether the callback could run more than once or not run at all. Avoid firing analytics events from a generic `onUpdate`; it may run many times per second. If analytics needs a meaningful event, send it from the user action or a well-defined one-time lifecycle event, not from every rendered frame.

`onUpdate` is appropriate for syncing a small visual readout with progress when that readout truly must follow the animation. Keep the work small, and avoid forcing a framework to rerender an entire tree on every frame. If a number must be announced to assistive technology, do not update a live region every frame; announce meaningful milestones instead.

Do not assume callbacks run in a particular order across unrelated tweens unless the timeline explicitly establishes that order. If multiple actions need to occur at a precise point, place them on a single timeline and use a callback or label there. Keep network requests and business transactions outside the animation lifecycle whenever possible.


## Field Notes: Responsive and dynamic layouts

A responsive animation should be designed around the layout that exists at the moment it runs. Hard-coded pixel offsets may look correct on a large screen but clip content on a narrow screen or after a font loads. Prefer small relative movement where appropriate, and remeasure if the animation depends on actual dimensions. Use `gsap.matchMedia()` when the motion design changes across media conditions, and revert the animations created within a media condition when that condition stops matching.

When the layout changes during an active tween, decide whether the tween should finish, restart from the new geometry, or be canceled. There is no single correct choice. A decorative entrance can usually finish; a drawer measured against viewport width may need to rebuild when the viewport changes. Test orientation changes, browser zoom, late-loading fonts, and dynamic content length.

Do not use viewport-relative values as a substitute for responsive design. A translation of `100vw` may overshoot when scrollbars or nested containers change the effective space. Use the actual container or measured target when the design depends on local geometry. Keep the fallback state understandable if measurement fails.


## Field Notes: Accessibility and motion meaning

Reduced motion should be treated as a supported presentation mode, not a last-minute CSS patch. Consider which parts of the animation communicate state and which parts are decorative. The state change must remain obvious without movement. If a menu opens, its expanded state and content availability should change immediately even if the visual transition is omitted. If a progress indicator animates, the accessible value should represent actual progress rather than the tween's current frame unless the tween is itself representing a real measured task.

Avoid repeated large zooms, spinning, parallax, and long travel distances for routine controls. Motion that follows every pointer movement can also be distracting or difficult for some users. Provide stable controls and ensure hover-only effects have equivalent focus behavior. Keep `:focus-visible` styling visually distinct from animation transforms and do not animate focus rings in a way that obscures them.

For users who pause, reduce, or disable motion at the operating-system level, the application should not punish them with missing information or inaccessible controls. Test keyboard and screen-reader behavior independently from the visual animation. A successful animation is not accessible simply because it has a short duration.


## Field Notes: Performance testing and profiling

A performance issue should be tied to evidence. In DevTools, record the slow interaction, identify long tasks, inspect layout and paint activity, and compare before and after a change. If the browser spends time recalculating layout, check for layout-affecting properties and synchronous reads followed by writes. If paint is expensive, look for large shadows, blur, masks, filters, and oversized elements. If the main thread is busy, inspect callbacks, repeated DOM queries, state updates, and other JavaScript work.

Use `requestAnimationFrame` for custom work that must be synchronized with a browser frame, but do not create a second animation loop when GSAP already owns the animation. Avoid calling `getComputedStyle()` repeatedly in an `onUpdate` callback. Read computed values before the animation when possible, then write a small set of properties. If measurement is necessary, batch reads before writes to reduce layout thrashing.

`will-change` is a hint, not a magic performance switch. Excessive hints can increase memory use and layer count. Verify compositor behavior with browser tooling and test on representative mobile hardware. The goal is a stable frame budget and a responsive interface, not the largest possible number of animated elements.


## Field Notes: Debugging duplicate initialization

Duplicate initialization is common in route-based applications, hot reload, and component development modes. Symptoms include an entrance replaying unexpectedly, multiple callbacks firing, repeated event handlers, or a tween that seems to fight itself. Search for every place that creates the animation and confirm that each creation is paired with cleanup. Log component mount and cleanup events temporarily and inspect whether the sequence repeats.

Use a development-only diagnostic that records target count, active timeline state, and the component root. Avoid logging every frame. If an event listener is responsible for starting an animation, ensure it is not attached each time the render function runs. Store the handler reference or use an abortable event listener so cleanup can remove it reliably.

When debugging a timeline, reduce the sequence to one target and one property. Once the single tween behaves, add the next target or phase. This isolates property conflicts and selector problems. Keep a minimal reproduction with the smallest relevant DOM and styles when a browser-specific issue persists.


## 24. A Complete Lifecycle Example

The following example demonstrates a small, reversible feature region with a timeline, keyboard support, reduced-motion handling, and cleanup. It is intentionally framework-neutral. A production modal or navigation system may need additional focus management and application-specific state handling.

```html
<section data-feature-root aria-labelledby="feature-title">
  <h2 id="feature-title">A faster review workflow</h2>
  <p data-feature-copy>Review the important details before continuing.</p>
  <button type="button" data-feature-toggle
          aria-expanded="false" aria-controls="feature-details">
    Show details
  </button>
  <div id="feature-details" data-feature-details hidden>
    <ul>
      <li>Keep the next action visible.</li>
      <li>Make changes easy to review.</li>
      <li>Preserve a predictable final state.</li>
    </ul>
  </div>
</section>
```

```js
function mountFeature(root) {
  const trigger = root.querySelector("[data-feature-toggle]");
  const details = root.querySelector("[data-feature-details]");
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!trigger || !details) {
    console.warn("Feature animation could not initialize: required target missing.");
    return () => {};
  }

  let timeline;
  let isOpen = false;

  function buildTimeline() {
    timeline?.revert();

    timeline = gsap.timeline({
      paused: true,
      onReverseComplete() {
        details.hidden = true;
      }
    });

    timeline.fromTo(
      details,
      { y: 8, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.24,
        ease: "power2.out"
      }
    );
  }

  function renderState(open) {
    isOpen = open;
    trigger.setAttribute("aria-expanded", String(open));
    trigger.textContent = open ? "Hide details" : "Show details";

    if (reduceQuery.matches) {
      timeline?.pause(0);
      gsap.set(details, { clearProps: "transform,opacity,visibility" });
      details.hidden = !open;
      return;
    }

    if (open) {
      details.hidden = false;
      timeline?.play();
    } else {
      timeline?.reverse();
    }
  }

  function onToggle() {
    renderState(!isOpen);
  }

  function onMotionPreferenceChange() {
    // Re-render the current state so the visible result matches the new preference.
    renderState(isOpen);
  }

  buildTimeline();
  trigger.addEventListener("click", onToggle);
  reduceQuery.addEventListener("change", onMotionPreferenceChange);

  return function cleanup() {
    trigger.removeEventListener("click", onToggle);
    reduceQuery.removeEventListener("change", onMotionPreferenceChange);
    timeline?.revert();
  };
}
```

The example deliberately includes a missing-target guard and an explicit cleanup function. In a real application, call `mountFeature(root)` after the root exists and retain its returned cleanup function. Verify that closing the panel does not leave keyboard focus inside hidden content. If the details include interactive elements, consider moving focus back to the trigger before hiding the panel when closing would otherwise strand focus.

**Gotcha:** `clearProps` only removes inline values owned by the animation; it does not override an intentionally hidden CSS rule. The component’s no-motion state must still set the correct visibility and `hidden` state.

## 25. Practical Browser and DevTools Notes

Use current GSAP documentation for version-specific API details, especially when plugins or framework adapters are involved. Check the project’s lockfile before copying examples from a tutorial; older GSAP snippets may use outdated plugin registration patterns or different package imports. `gsap.registerPlugin()` should register the plugins actually used by the application, not serve as an unexplained ritual.

For browser support, test the exact set of browsers that the product promises to support. Safari can expose SVG and compositing differences; Firefox can reveal differences in rendering and timing behavior; Chromium-based browsers are useful but should not be treated as the only validation target. Use caniuse for browser platform features and the official GSAP documentation for library behavior. `@supports` can help with CSS fallbacks, but it does not verify that a JavaScript module loaded correctly.

In DevTools, inspect the element’s computed transform and inline style, not only the authored stylesheet. GSAP often writes inline styles as part of the animation. If the computed style changes unexpectedly, pause the timeline and identify whether another tween, framework render, or CSS transition is also writing the same property. A breakpoint in the interaction handler can reveal repeated activation or stale closure values. A Performance recording can reveal long tasks and paint pressure. A Layers inspection can reveal whether too many elements have been promoted.

For custom diagnostics, prefer a function that runs on demand. Avoid a permanent `requestAnimationFrame` loop that logs every frame. GSAP already advances its own animation ticker; duplicating the loop can add noise and make the performance problem harder to understand.

## 26. Additional Gotchas Worth Remembering

- **Gotcha:** A timeline’s `onComplete` may not run if the timeline is killed or never reaches the end. Keep application state correct without it.
- **Gotcha:** A reverse animation cannot display an exit if the target has already been removed from the DOM. Delay removal until the visual exit completes, or use a framework transition strategy.
- **Gotcha:** `overwrite: "auto"` can resolve conflicting active tweens but cannot decide which state the product should represent.
- **Gotcha:** A responsive breakpoint change can invalidate assumptions about offsets and target geometry. Use `gsap.matchMedia()` or rebuild the relevant animation.
- **Gotcha:** `will-change` may increase layer memory and compositing cost. Profile before adding it.
- **Gotcha:** A `from()` tween can apply its start state during initialization. Test the first paint and fallback state.
- **Gotcha:** A `hidden` attribute is stronger than opacity zero. The browser will not render the element for an exit animation while it remains hidden.
- **Gotcha:** A motion preference change during an active animation needs a deterministic policy: finish immediately, rebuild, or retain the current state.
