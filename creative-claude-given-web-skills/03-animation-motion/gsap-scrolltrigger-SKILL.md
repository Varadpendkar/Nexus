# GSAP ScrollTrigger — Scroll-Synchronized Motion

> **Skill file:** `gsap-scrolltrigger/SKILL.md`
> **Layer:** 03 — Animation & Motion
> **Scope:** ScrollTrigger setup, trigger geometry, scrub, pinning, snapping, timelines, responsive behavior, accessibility, cleanup, and performance.
> **Use this skill when:** an animation must respond to scroll position, a section should pin during a narrative sequence, or a timeline needs to synchronize with a page’s scroll progress.
> **Do not use this skill when:** a native CSS scroll-driven animation or a simple intersection-based reveal is sufficient.

## Why This Matters

Scroll-linked motion can make a long page feel coherent, but it is also one of the easiest ways to break navigation, reading order, and page geometry. Common production failures include a pinned section covering the footer, a trigger firing at the wrong point after images load, a mobile layout inheriting desktop pin spacing, an animation that becomes impossible to understand when reduced motion is enabled, and a scroll position that jumps after a route transition. These are not cosmetic defects: they affect access to content and the user’s sense of control.

GSAP ScrollTrigger connects an animation to scroll position. A trigger defines where the relationship begins and ends; `scrub` links animation progress to scrolling; `pin` temporarily holds an element in place; `snap` can settle progress at meaningful points. Each option changes page behavior, so it needs a deliberate layout model and a test plan.

The safest baseline is to keep the page readable without animation, use semantic HTML, prefer transform and opacity for visual motion, and introduce pinning only when it improves comprehension. Avoid animating layout-triggering properties such as `top`, `left`, `width`, and `height` for decorative movement unless that layout change is truly required and has been profiled. ScrollTrigger’s calculations depend on document geometry; anything that changes the geometry—late fonts, responsive content, accordions, images, or route changes—may require refresh or a different layout strategy.

## 1. Understand the ScrollTrigger Model

A ScrollTrigger instance watches a scroller, a trigger element, and a start/end interval. The interval maps a range of scroll positions to a normalized progress value from 0 to 1. A tween or timeline can use that progress directly with `scrub`, or the trigger can run callbacks when the start and end boundaries are crossed.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const section = document.querySelector("[data-story-section]");
const title = section?.querySelector("[data-story-title]");

if (section && title) {
  gsap.from(title, {
    y: 18,
    autoAlpha: 0,
    duration: 0.6,
    ease: "power3.out",
    scrollTrigger: {
      trigger: section,
      start: "top 80%",
      toggleActions: "play none none reverse"
    }
  });
}
```

The example plays when the section reaches the trigger boundary and reverses when it leaves in the reverse direction. `toggleActions` controls actions at enter, leave, enter-back, and leave-back. Its four values correspond to those events. Use it when the animation should play or reverse at boundary crossings. Use `scrub` when the animation should continuously track the scroll position instead.

ScrollTrigger does not replace semantic or application state. A reveal should not be the only mechanism that makes a section available. A pinned visual should not be the only representation of information. If the trigger fails to initialize, content must remain understandable.

**Gotcha:** ScrollTrigger measures document geometry. If the page layout changes after initialization, trigger positions can become stale. Understand when to refresh, and do not hide layout shifts behind arbitrary timeout calls.

## 2. Register the Plugin and Keep Setup Predictable

In a bundler-based application, import GSAP and ScrollTrigger from the installed package and register the plugin once in a suitable module or application setup. Avoid registering a plugin repeatedly inside a frequently rendered component unless the framework integration explicitly expects that pattern.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
```

Keep package versions consistent and consult the documentation for the installed GSAP version. Many examples online assume a particular bundler, framework, or older syntax. Confirm whether the project uses ESM imports, a CDN script, or a framework adapter before copying code. A missing plugin import can make `scrollTrigger` configuration ineffective or produce a runtime error.

When building reusable components, keep registration in a shared animation module where possible. Component-specific code should create triggers for its own root and clean them up when the component is removed. Avoid broad global selectors that can animate multiple copies of a component.

## 3. Define Start and End with Clear Geometry

The `start` and `end` properties describe the alignment of a point on the trigger with a point in the scroller. For example, `start: "top 80%"` means the top of the trigger meets a point 80% down the viewport. `start: "top top"` means the trigger’s top reaches the viewport top. An end value such as `"bottom top"` means the trigger’s bottom reaches the viewport top.

```js
gsap.to("[data-parallax-image]", {
  yPercent: -8,
  ease: "none",
  scrollTrigger: {
    trigger: "[data-parallax-section]",
    start: "top bottom",
    end: "bottom top",
    scrub: true
  }
});
```

Use `markers: true` during development to see trigger boundaries. Markers are diagnostic aids, not production UI. When the trigger appears early or late, inspect its measured geometry, the chosen scroller, the start/end expressions, and any transforms on ancestor elements. Do not fix every mismatch by adding arbitrary pixels. First determine which geometry is wrong.

Numeric positions can be useful when the design intentionally needs a fixed distance, but strings based on element/viewport alignment are often more robust across viewport sizes. Function-based start/end values can support dynamic geometry; remember that their values may need recalculation after layout changes.

## 4. Choose `toggleActions` or `scrub` Intentionally

`toggleActions` defines how a tween behaves when the trigger enters and leaves the active region. Common values include `play`, `pause`, `resume`, `reverse`, `restart`, `reset`, `complete`, and `none`. Four values correspond to enter, leave, enter-back, and leave-back. Choose the sequence based on whether the animation should persist, reverse, or replay.

```js
gsap.from("[data-reveal]", {
  y: 14,
  autoAlpha: 0,
  duration: 0.45,
  ease: "power2.out",
  scrollTrigger: {
    trigger: "[data-reveal]",
    start: "top 85%",
    toggleActions: "play none none reverse"
  }
});
```

`scrub: true` makes the animation progress follow scroll progress. A numeric scrub value, such as `scrub: 0.4`, adds smoothing so the animation catches up to the scroll position over time. This can feel more fluid, but it also means the visual progress may lag behind the scrollbar. Use it only when that lag is intentional and test on touch devices.

A scrubbed animation should normally use `ease: "none"` for its child tweens when the visual movement must map proportionally to scroll progress. Otherwise the tween’s easing changes how movement is distributed across the scroll range. A timeline can still contain different eases where a particular segment intentionally needs them, but understand the mapping before using them.

**Gotcha:** Scrubbed motion is not the same as a play-once reveal. A user scrolling upward should see the animation respond in reverse unless you intentionally choose another interaction model.

## 5. Use Pinning Only When It Improves the Story

`pin: true` holds the trigger element in place while the scroll position advances through the configured interval. Pinning can be useful for a visual that remains steady while supporting text or illustrations change. It can also make the page feel trapped when overused or when the pinned distance is too long.

```js
const story = gsap.timeline({
  scrollTrigger: {
    trigger: "[data-pinned-story]",
    start: "top top",
    end: "+=900",
    scrub: true,
    pin: true,
    anticipatePin: 1
  }
});

story
  .to("[data-story-visual]", { scale: 1.04, ease: "none" })
  .to("[data-story-caption='one']", { autoAlpha: 0.3, ease: "none" }, 0)
  .to("[data-story-caption='two']", { autoAlpha: 1, ease: "none" }, 0.35);
```

The end distance controls how long the pin lasts. `anticipatePin` can reduce a brief jump in some situations, but it is not a universal fix for bad geometry. Test the pin with actual content lengths and responsive breakpoints. Ensure that the pinned element does not cover important controls or create a scroll trap.

Pinning may add spacing to preserve the document flow. Nested pins and transformed ancestors can complicate behavior. Keep pinned structures simple, avoid nesting pinned elements unless there is a clear reason, and inspect the resulting page height after initialization.

## 6. Make Pinned Content Work on Small Screens

A desktop pinned narrative can be unusable on a phone. The viewport is shorter, the text may wrap into more lines, and the scroll distance may be disproportionate. Use `gsap.matchMedia()` to create different animation strategies for different media conditions and revert the old context when conditions stop matching.

```js
const mm = gsap.matchMedia();

mm.add("(min-width: 800px)", () => {
  gsap.timeline({
    scrollTrigger: {
      trigger: "[data-story]",
      start: "top top",
      end: "+=700",
      scrub: true,
      pin: true
    }
  }).to("[data-story-visual]", {
    scale: 1.05,
    ease: "none"
  });
});

mm.add("(max-width: 799px)", () => {
  gsap.from("[data-story-visual]", {
    y: 10,
    autoAlpha: 0,
    duration: 0.35,
    ease: "power2.out",
    scrollTrigger: {
      trigger: "[data-story-visual]",
      start: "top 88%"
    }
  });
});
```

This example uses a pinned desktop narrative and a simple mobile reveal. The breakpoint is illustrative; choose it from the design’s actual content constraints. `gsap.matchMedia()` records animations created in each matching handler and reverts them when the condition changes. If a handler creates listeners or other non-GSAP resources, clean those separately.

Do not assume that a breakpoint alone guarantees a good mobile experience. Test a narrow viewport, landscape orientation, browser zoom, long localized strings, and dynamic font loading. A pinned section should not make the primary call to action unreachable.

## 7. Use Timeline Labels for Scroll Chapters

A scrubbed timeline can represent a sequence of chapters. Labels give the sequence readable names and can be used as snap destinations. Keep the number of chapters small enough that users can understand the relationship between scroll and content.

```js
const chapterTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "[data-chapter-wrapper]",
    start: "top top",
    end: "+=1200",
    pin: true,
    scrub: 0.35,
    snap: {
      snapTo: "labels",
      duration: { min: 0.15, max: 0.5 },
      delay: 0.05,
      ease: "power1.inOut"
    }
  }
});

chapterTimeline
  .addLabel("overview")
  .to("[data-chapter-visual]", { xPercent: -10, ease: "none" })
  .addLabel("details")
  .to("[data-chapter-visual]", { scale: 1.08, ease: "none" })
  .addLabel("summary");
```

Snap is a design choice, not a default. It can help a chapter-based presentation settle at a meaningful point, but it can also override a user’s intended scroll position or feel like the page is pulling against them. Keep snap durations modest, test touch and trackpad behavior, and avoid snapping long reading content unless the interaction clearly benefits from it.

**Gotcha:** Snap should never make a user feel that ordinary scrolling has been taken away. If the content is primarily for reading, prefer natural scrolling and use motion as a secondary layer.

## 8. Refresh After Meaningful Layout Changes

ScrollTrigger calculates start and end positions from layout. Images without reserved dimensions, web fonts that change line wrapping, asynchronous content, accordions, and route transitions can change the geometry after triggers are created. Use `ScrollTrigger.refresh()` when a known layout change requires measurements to be recalculated, not as a repeated timer-based workaround.

```js
function onContentExpanded() {
  // Update application state and let the DOM reflect the new layout first.
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}
```

If a framework schedules DOM changes asynchronously, call refresh after the update has committed. The exact lifecycle hook depends on the framework. For images, reserve aspect ratio or dimensions in HTML/CSS so the page does not shift after loading. For web fonts, consider refreshing after `document.fonts.ready` if the layout depends on the final font metrics.

Do not call `refresh()` every scroll frame. Refresh can trigger layout measurement and is not a substitute for stable document geometry. For debugging, compare marker positions before and after refresh and identify which element changed size.

## 9. Handle Route Changes and Component Cleanup

A ScrollTrigger attached to an element that has been removed can leave stale animation state, pin spacers, or event references if it is not cleaned up correctly. Use `gsap.context()` or a framework integration such as `useGSAP()` to group animations and revert them when the component unmounts. If you create triggers outside a context, retain their references and kill them explicitly.

```js
function mountStory(root) {
  const context = gsap.context(() => {
    gsap.from("[data-story-heading]", {
      y: 16,
      autoAlpha: 0,
      duration: 0.45,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "[data-story-heading]",
        start: "top 82%"
      }
    });
  }, root);

  return () => context.revert();
}
```

For a route-based application, confirm that navigation away and back does not duplicate triggers or retain pin spacers. If a smooth-scrolling library is used, follow the integration instructions for that library and ScrollTrigger. Do not create a custom scroll loop without understanding how it affects native scroll position and refresh calculations.

Cleanup should cover more than ScrollTrigger. Remove event listeners, disconnect observers, and clear timers created by your code. `context.revert()` handles animations recorded in the context; it does not automatically release every resource created elsewhere.

## 10. React Integration and Strict Mode

React components should create scroll animations in an effect or `useGSAP()` hook rather than during render. The root scope prevents selectors from matching other instances, and context reversion makes cleanup predictable.

```jsx
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function StorySection() {
  const root = useRef(null);

  useGSAP(() => {
    gsap.from("[data-story-heading]", {
      y: 18,
      autoAlpha: 0,
      duration: 0.45,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "[data-story-heading]",
        start: "top 84%"
      }
    });
  }, { scope: root });

  return (
    <section ref={root} aria-labelledby="story-heading">
      <h2 id="story-heading" data-story-heading>Make the next step clear</h2>
      <p>Scroll-linked motion should support the content, not hide it.</p>
    </section>
  );
}
```

React Strict Mode can mount, clean up, and mount effects again during development to expose lifecycle mistakes. Do not disable Strict Mode to hide duplicate animations. Verify that cleanup reverts GSAP work and that any custom listener or observer is separately removed. When props change the animation setup, use documented dependency behavior and avoid stale closures.

If a component is conditionally rendered, ensure the animation is created only after its root exists. If a list changes length, decide whether to rebuild the trigger, refresh geometry, or animate newly inserted items. A one-size-fits-all effect dependency array can be wrong for all three cases.

## 11. Reduced Motion for Scroll-Linked Experiences

Scroll-driven motion can be more disorienting than a short entrance because movement follows a user’s own scrolling. Respect `prefers-reduced-motion` and provide a content-equivalent path. For reduced motion, remove pinning and large parallax distances where possible, and make the full content flow naturally in document order.

```js
const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.to("[data-parallax-art]", {
    yPercent: -10,
    ease: "none",
    scrollTrigger: {
      trigger: "[data-parallax-section]",
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
});

// In the baseline markup/CSS, keep the artwork and its meaning available
// even when no ScrollTrigger animation is created.
```

This pattern creates the parallax effect only when the user has not requested reduced motion. The baseline content must remain visible and useful. For a pinned narrative, the reduced-motion path should remove the pin and present each chapter in normal document flow, not simply set the tween duration to zero while leaving the pin spacer or constrained layout in place.

Use the media-query listener behavior provided by `gsap.matchMedia()` and test a preference change while the page is open. Also ensure that controls do not depend on hover or movement to communicate state. Keep `:focus-visible` indicators visible while elements are pinned or transformed.

**Gotcha:** Setting every duration to zero is not always sufficient. Pinning, snap, sticky positioning, and transformed layout can still alter how users navigate. Build a genuinely simpler path.

## 12. Performance and Geometry

ScrollTrigger is designed to avoid naïve per-scroll event work, but the animations it controls can still be expensive. Prefer `transform` and `opacity` for continuous movement. Avoid changing `top`, `left`, `width`, or `height` on every scroll update unless layout interpolation is intentional and measured. Use the Performance panel to identify long tasks, layout, paint, and dropped frames.

Large blur filters, complex shadows, full-screen layers, and many simultaneously animated SVG paths can still cause jank. `will-change` can help in limited cases but may increase memory use and layer count. Do not add it to every target. Inspect the Layers panel and test on mobile hardware.

Do not call `getBoundingClientRect()` repeatedly in a custom scroll handler or in a tween update callback. ScrollTrigger already measures geometry during its lifecycle. If custom measurement is needed, cache values and refresh at meaningful layout boundaries. Avoid running both a separate `requestAnimationFrame` scroll loop and ScrollTrigger updates for the same properties.

## 13. Use `containerAnimation` Only for a Real Nested Motion Model

`containerAnimation` lets a ScrollTrigger watch an element whose position is controlled by another animation, such as a horizontally moving panel that itself is driven by vertical scroll. It is an advanced pattern and imposes constraints on the container animation. Keep the container animation linear where required by the documented setup, and avoid pinning or snapping the container animation in unsupported ways.

```js
const horizontal = gsap.to("[data-horizontal-track]", {
  xPercent: -50,
  ease: "none",
  scrollTrigger: {
    trigger: "[data-horizontal-section]",
    start: "top top",
    end: "+=1000",
    pin: true,
    scrub: true
  }
});

gsap.to("[data-horizontal-card='three']", {
  rotation: 2,
  scrollTrigger: {
    trigger: "[data-horizontal-card='three']",
    containerAnimation: horizontal,
    start: "left center",
    end: "right center",
    scrub: true
  }
});
```

The example is schematic: the track width, card count, and travel distance must be calculated for the actual layout. Do not copy `xPercent: -50` as a universal distance. Measure the content, test responsive states, and verify that the horizontal experience remains usable with keyboard navigation and reduced motion.

## 14. Debug with Markers and a Repeatable Sequence

Start by enabling `markers: true` on the specific trigger. Confirm the trigger element, scroller, start/end boundaries, and actual document geometry. If the marker appears in the wrong place, inspect the layout before adjusting values. Check whether the page has a transformed ancestor, nested scroller, late-loading font, image shift, or content expansion.

Use `ScrollTrigger.getAll()` in development to inspect the number of active triggers. `ScrollTrigger.getById()` can locate a trigger when you give it an `id`. Do not leave broad debugging output in production. For each issue, verify initialization count, current scroll position, progress, and whether refresh has run after a known layout change.

```js
function reportScrollTriggers() {
  const triggers = ScrollTrigger.getAll().map((trigger) => ({
    id: trigger.vars.id ?? "(no id)",
    start: trigger.start,
    end: trigger.end,
    progress: Number(trigger.progress.toFixed(3)),
    active: trigger.isActive,
    pinned: Boolean(trigger.pin)
  }));

  console.table(triggers);
  return triggers;
}
```

Use DevTools to inspect the DOM around pin spacers and check whether route transitions left extra wrappers behind. Pause JavaScript at the setup function to catch duplicate creation. Record performance during the scroll range that feels slow. A repeatable sequence is more useful than repeatedly changing `start` values until the symptom disappears.

## 15. Browser Support and Progressive Enhancement

Check the project’s supported browser baseline and the installed GSAP version. ScrollTrigger works with common modern browsers, but layout, SVG, touch, and nested-scroller behavior should be tested in the actual browser matrix. Test Safari, Firefox, and Chromium where relevant. Use caniuse to validate platform features such as media queries or CSS scroll behavior; use official GSAP documentation for ScrollTrigger-specific options.

`@supports` can choose a CSS fallback for a platform feature, but it cannot confirm that ScrollTrigger has loaded. Core content should remain available if the script or plugin fails. Do not make a page’s only navigation path depend on a pinned animation. For content-heavy pages, natural document flow is the strongest fallback.

If using a smooth-scrolling library, follow its official ScrollTrigger integration and ensure the scroll update and refresh hooks are coordinated. A custom scroller requires correct `scroller` configuration; a trigger watching the window will not necessarily measure the intended container.

## 16. Patterns for Common Scroll Behaviors

### Pattern 1 — One-Time Section Reveal

**What it does:** Plays a small entrance as a section reaches the viewport.
**When to use:** A short content block or a small set of feature cards.
**Implementation:**

```js
function revealSection(root) {
  return gsap.from(root.querySelectorAll("[data-reveal-item]"), {
    y: 12,
    autoAlpha: 0,
    duration: 0.4,
    stagger: 0.05,
    ease: "power2.out",
    scrollTrigger: {
      trigger: root,
      start: "top 82%",
      once: true
    }
  });
}
```

Use `once: true` only if replaying on reverse scroll is not part of the intended interaction. Keep the content visible in the no-JavaScript baseline.

### Pattern 2 — Scrubbed Parallax Accent

**What it does:** Moves a decorative visual proportionally to scroll progress.
**When to use:** A restrained background or illustration that adds depth without carrying essential information.
**Implementation:**

```js
function createParallax(target, section) {
  return gsap.to(target, {
    yPercent: -7,
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
}
```

Keep the travel distance small, avoid large fixed backgrounds that create mobile performance problems, and omit this pattern when reduced motion is requested.

### Pattern 3 — Pinned Chapter Narrative

**What it does:** Holds a visual steady while the timeline moves through a few content phases.
**When to use:** A short, carefully designed explanatory story—not ordinary long-form reading.
**Implementation:**

```js
const chapters = gsap.timeline({
  scrollTrigger: {
    trigger: "[data-chapters]",
    start: "top top",
    end: "+=900",
    pin: true,
    scrub: true
  }
});

chapters
  .addLabel("first")
  .to("[data-chapter-visual]", { scale: 1.03, ease: "none" })
  .addLabel("second")
  .to("[data-chapter-visual]", { xPercent: 4, ease: "none" })
  .addLabel("third");
```

Keep each chapter understandable without the movement and provide a natural-flow mobile/reduced-motion alternative. Test the actual scroll distance and page footer position.

### Pattern 4 — Pin on Desktop, Flow on Mobile

**What it does:** Uses a pinned composition only where there is enough space.
**When to use:** Desktop storytelling that would overwhelm a short viewport.
**Implementation:**

```js
const media = gsap.matchMedia();

media.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
  gsap.timeline({
    scrollTrigger: {
      trigger: "[data-responsive-story]",
      start: "top top",
      end: "+=750",
      pin: true,
      scrub: true
    }
  }).to("[data-responsive-visual]", {
    scale: 1.04,
    ease: "none"
  });
});
```

The mobile baseline remains a normal-flow section. Choose the breakpoint from content fit, not a device label. Verify cleanup when resizing across the breakpoint.

### Pattern 5 — Label-Based Snap

**What it does:** Settles a scrubbed timeline near named chapters.
**When to use:** A small sequence where distinct stops are meaningful and users benefit from a clear chapter position.
**Implementation:**

```js
const snapTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: "[data-snap-story]",
    start: "top top",
    end: "+=1000",
    pin: true,
    scrub: 0.25,
    snap: {
      snapTo: "labels",
      duration: { min: 0.1, max: 0.35 },
      ease: "power1.inOut"
    }
  }
});

snapTimeline
  .addLabel("intro")
  .to("[data-snap-art]", { xPercent: -5, ease: "none" })
  .addLabel("middle")
  .to("[data-snap-art]", { scale: 1.05, ease: "none" })
  .addLabel("end");
```

Test trackpad, wheel, and touch interactions. If snap feels like it fights the user, remove it.

### Pattern 6 — Refresh After Content Changes

**What it does:** Recalculates trigger positions after the document geometry changes.
**When to use:** An accordion expands, an image region changes dimensions, or async content is inserted.
**Implementation:**

```js
function refreshAfterLayoutChange() {
  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}
```

Call this after the DOM has updated. Reserve image space and avoid using repeated timeouts as a substitute for understanding the layout lifecycle.

### Pattern 7 — Scoped Component Trigger

**What it does:** Keeps a component’s triggers inside a root and reverts them on teardown.
**When to use:** Repeated cards, article modules, or route-specific story sections.
**Implementation:**

```js
function mountReveal(root) {
  const ctx = gsap.context(() => {
    gsap.from("[data-module-title]", {
      y: 10,
      autoAlpha: 0,
      duration: 0.32,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "[data-module-title]",
        start: "top 88%"
      }
    });
  }, root);

  return () => ctx.revert();
}
```

Use one root per component instance. Confirm cleanup on route change and when the same module is mounted more than once.

### Pattern 8 — Reduced-Motion Natural Flow

**What it does:** Avoids scroll-linked motion while preserving content order and meaning.
**When to use:** Any nonessential parallax or pinned narrative.
**Implementation:**

```js
const media = gsap.matchMedia();

media.add("(prefers-reduced-motion: reduce)", () => {
  // Do not create pinning or parallax here.
  // Keep all content in the normal document flow.
});
```

The no-motion path is primarily a layout and content decision, not a zero-duration animation. Ensure headings, links, and controls remain accessible in their natural order.

## 17. Mistakes and Corrective Actions

| Mistake | Why it fails | Corrective action |
|---|---|---|
| Using `scrub` for every reveal | Scroll position controls motion even when a simple reveal was intended | Choose `toggleActions` for boundary-triggered motion |
| Pinning long reading content | Can trap the reader in a constrained sequence | Keep reading content in normal document flow |
| Hiding content until ScrollTrigger runs | Script failure can leave blank content | Keep baseline content visible and usable |
| Ignoring late-loading images | Trigger geometry can shift after initialization | Reserve dimensions and refresh after known layout changes |
| Calling refresh on every scroll | Adds unnecessary measurement work | Refresh only after meaningful geometry changes |
| Using desktop pin distances on mobile | Content can overflow or become difficult to navigate | Create responsive behavior with `gsap.matchMedia()` |
| Using large parallax distances | Can disorient users and expose edges | Reduce distance or remove the effect |
| Forgetting `ease: "none"` on scrubbed movement | Easing distorts the scroll-to-motion mapping | Use linear easing when proportional mapping is intended |
| Leaving markers enabled | Debug markers leak into the interface | Enable markers only during development |
| Creating triggers during React render | Re-renders can duplicate animation setup | Create inside `useGSAP()` or a lifecycle effect |
| Forgetting context cleanup | Old triggers and inline styles can persist | Revert the owning context on unmount |
| Relying on `onComplete` for application state | Skipped or killed animation may bypass the callback | Keep business state separate from motion |
| Nesting pins without a layout plan | Pin spacing and geometry become difficult to predict | Flatten the structure or validate nested pin behavior carefully |
| Using snap on a long article | Can override the reader’s desired scroll position | Reserve snap for short, meaningful chapters |
| Animating layout properties during scroll | Can cause reflow and jank | Prefer transform/opacity and profile unavoidable layout changes |
| Adding `will-change` everywhere | Can increase layer count and memory | Add hints only after performance evidence |
| Forgetting reduced motion | Scroll-linked movement can be uncomfortable | Provide a natural-flow no-motion path |
| Ignoring keyboard focus in pinned content | Focus can move into obscured or offscreen regions | Keep focus order logical and test keyboard-only use |
| Using a window trigger for a nested scroller | Start/end calculations use the wrong scroll context | Set the correct `scroller` and test its geometry |
| Recreating event listeners on every render | Causes duplicate actions and memory leaks | Store handlers and remove them during cleanup |
| Treating `@supports` as a JS check | CSS feature detection cannot verify plugin loading | Handle script/plugin failures separately |
| Assuming transforms never paint | Filters and large layers can still be expensive | Profile with Performance and Layers tools |

## 18. Mental Models for ScrollTrigger

1. **ScrollTrigger maps geometry to progress.** Start and end are measured boundaries, not arbitrary moments.
2. **A trigger is a contract with layout.** When layout changes, the contract may need a refresh.
3. **Scrub means scroll owns progress.** The animation follows the user’s scroll position rather than running independently.
4. **Pinning changes the page experience.** It is a structural interaction, not a decorative toggle.
5. **Natural flow is the fallback.** Content should remain useful when JavaScript or motion is unavailable.
6. **A responsive animation is a separate design.** A smaller viewport may need a different interaction, not just smaller values.
7. **A timeline label is a chapter name.** It gives code and snap behavior a meaningful point of reference.
8. **Reduced motion changes the model.** Remove unnecessary movement and pinning, not only duration.
9. **Refresh is a measurement operation.** Call it after meaningful layout changes, not as a magic fix.
10. **One component owns its triggers.** Scope selectors and clean up on unmount.
11. **Performance is evidence-based.** Inspect layout, paint, layers, and long tasks instead of guessing.
12. **Scroll should remain under user control.** Snapping and pinning must not make ordinary navigation feel hijacked.

## 19. Build Challenge: Create a Scroll Story That Degrades Gracefully

Build a three-chapter product story with a visual, headings, descriptions, and a final call to action. Use ScrollTrigger to synchronize the visual with scroll progress on wide screens, but keep the content useful in natural flow.

1. Create a semantic `<main>` with a `<section>` for the story and a heading for each chapter.
2. Include a visual region with meaningful alternative text if the image conveys information; use empty alternative text if it is purely decorative.
3. Keep all chapter copy visible and readable without JavaScript.
4. Register ScrollTrigger once and scope animation selectors to the story root.
5. Create a timeline with three named labels.
6. Use `scrub` for the visual sequence and `ease: "none"` for movement that should map proportionally to scroll.
7. Use `pin` only at a breakpoint where the content fits comfortably.
8. Provide a normal-flow mobile layout using `gsap.matchMedia()`.
9. Honor `prefers-reduced-motion` by removing pinning, snap, and large parallax movement.
10. Preserve keyboard navigation and visible `:focus-visible` indicators for every link and button.
11. Ensure pinned content never covers the footer or traps focus.
12. Reserve image dimensions and refresh only after meaningful layout changes.
13. Add a development-only `reportScrollTriggers()` helper using `console.table`.
14. Clean up contexts, triggers, listeners, and observers when the component unmounts.
15. Test the story after a route change and confirm there are no duplicate triggers or pin spacers.
16. Test rapid resizing across the breakpoint and verify the layout remains stable.
17. Test with reduced motion enabled and confirm all chapter content remains available.
18. Test the failure case where the visual selector is missing; the story text and final action must remain usable.
19. Record a Performance profile and check for layout churn, expensive paint, and dropped frames.
20. Verify Safari, Firefox, and Chromium where supported by the product.

### Test matrix

| Scenario | Expected result |
|---|---|
| JavaScript disabled | Story remains readable in document order |
| Reduced motion enabled | No pinning or large scroll-linked movement |
| Wide desktop | Pinned sequence aligns with chapter progression |
| Narrow mobile | Natural flow, no clipped copy or unreachable action |
| Rapid breakpoint resize | Old media context reverts and new layout initializes cleanly |
| Late image load | Layout remains stable because dimensions are reserved |
| Route away and back | No duplicate triggers or stale pin spacers |
| Missing visual target | Copy and links still work |
| Keyboard navigation | Focus order remains logical and visible |
| Performance recording | No avoidable repeated layout work or severe jank |
| Trackpad and touch | Scroll remains predictable; snap does not fight the user |
| Browser matrix | Trigger positions and final states remain consistent |

## Definition of Done

- [ ] Each ScrollTrigger has a clear trigger, scroller, start, and end model.
- [ ] `scrub`, `toggleActions`, `pin`, and `snap` are used only when they match the intended interaction.
- [ ] Content remains readable if JavaScript or the animation setup fails.
- [ ] Pinning is tested at realistic content lengths and does not cover navigation or the footer.
- [ ] Responsive behavior uses a deliberate mobile strategy, not only smaller desktop values.
- [ ] Reduced-motion mode removes unnecessary scroll-linked movement and preserves natural content flow.
- [ ] Component cleanup reverts animations and releases non-GSAP resources.
- [ ] Layout changes are handled with stable dimensions and targeted refreshes.
- [ ] Frequent motion favors `transform` and `opacity`; layout properties are avoided unless justified.
- [ ] DevTools markers, trigger reports, and Performance/Layers panels have been used during validation.
- [ ] Keyboard navigation, semantic HTML, accessible names, and `:focus-visible` remain intact.
- [ ] The story passes missing-target, route-change, resize, reduced-motion, and JavaScript-disabled tests.

## Quick Reference

| Need | Use | Watch out for |
|---|---|---|
| Register ScrollTrigger | `gsap.registerPlugin(ScrollTrigger)` | Register from the installed package version |
| Trigger at a boundary | `start: "top 80%"` | Confirm the geometry with markers |
| Define scroll interval | `end: "bottom top"` or `end: "+=700"` | Fixed distances may fail at other sizes |
| Play on entry | `toggleActions: "play none none reverse"` | Four values map to four boundary events |
| Link progress to scroll | `scrub: true` | Reverse scrolling reverses the visual |
| Smooth scrub response | `scrub: 0.4` | Adds lag behind scroll progress |
| Hold an element | `pin: true` | Pinning changes page structure and spacing |
| Reduce pin jump | `anticipatePin: 1` | Not a replacement for correct geometry |
| Snap to chapters | `snap: { snapTo: "labels" }` | Can feel like scroll hijacking |
| Change animation by viewport | `gsap.matchMedia()` | Revert media contexts on changes |
| Recalculate geometry | `ScrollTrigger.refresh()` | Use after meaningful layout changes |
| Inspect active triggers | `ScrollTrigger.getAll()` | Keep diagnostic output development-only |
| Find a trigger by id | `ScrollTrigger.getById()` | Assign stable IDs when needed |
| Scope and revert work | `gsap.context()` | Remove non-GSAP resources separately |
| Handle React lifecycle | `useGSAP()` | Verify Strict Mode cleanup |
| Skip motion for preference | `prefers-reduced-motion` media query | Preserve content in natural flow |
| Debug boundaries | `markers: true` | Remove markers before release |
| Diagnose jank | Performance and Layers panels | Check layout, paint, JS, and layer count |
| Animate visual movement | `transform` and `opacity` | Complex filters can still be expensive |
| Test browser feature | `@supports` / caniuse | Does not test JavaScript plugin loading |

## Final Operating Rule

ScrollTrigger should make the relationship between content and scrolling clearer, not take control away from the reader. Start with natural-flow semantic content, add only the scroll-linked behavior that improves understanding, and validate geometry, interruption, reduced motion, browser behavior, and cleanup before shipping.


## Field Notes: Scroller ownership

A ScrollTrigger normally watches the window, but applications can use a nested scrolling element. When a nested scroller is involved, set the `scroller` option on each relevant trigger and confirm that the element actually owns the scroll position. A common bug is to animate content inside a panel while the trigger still measures the window. Markers and start/end values will look inconsistent because the wrong coordinate space is being used.

If a smooth-scroll library virtualizes or intercepts scrolling, follow its documented integration with ScrollTrigger. Do not assume that changing `scroller` alone is enough. The scroll library may need to notify ScrollTrigger on updates, and ScrollTrigger may need to refresh after the library updates its measurements. Avoid maintaining two competing systems that both try to set scroll position.

Test wheel, trackpad, touch, keyboard scrolling, and scrollbar dragging. The same interaction should remain understandable across input methods. If the experience only works when a user scrolls slowly with a mouse wheel, the motion model is too fragile.


## Field Notes: Refresh, refreshInit, and layout stability

`ScrollTrigger.refresh()` recalculates trigger positions and may involve style/layout measurement. It is appropriate after known layout changes, not after every animation update. Reserve image dimensions, use stable aspect ratios, and avoid inserting large content above existing triggers without accounting for the changed geometry. If the page uses accordions, tabs, or async-loaded panels, refresh after the panel’s final layout is committed.

A refresh can expose rather than fix layout problems. If a section changes height repeatedly due to animation, font loading, or CSS transitions, trigger positions may keep moving. First stabilize the layout. If the animation itself changes the geometry, decide whether that is the intended effect and whether a different transform-based approach would keep the document flow stable.

Use lifecycle events such as `refreshInit` only when there is a concrete need to coordinate measurement. Keep handlers light, avoid mutating layout in a loop, and remove custom listeners during teardown. Do not call refresh recursively from a refresh callback.


## Field Notes: Pin spacing and document flow

Pinning often creates or uses a spacer to preserve the page’s scrollable height while the pinned element is fixed or otherwise held. This is why pinning can affect following sections even though the pinned visual appears stationary. Inspect the DOM around the pin and verify that the page height and subsequent sections behave as intended.

`pinSpacing` can be configured, but turning it off is not a general fix for extra whitespace. Without spacing, following content may move underneath the pinned section or overlap it. Choose based on the composition, then test the footer and every section after the pin. Multiple pins should have a clear order and should not depend on accidental DOM nesting.

Keep pinned elements structurally simple. Avoid animating the pinned element’s own layout dimensions while it is being pinned. Animate a child visual instead, leaving the pin container’s geometry stable. This separation makes refresh calculations and responsive behavior easier to reason about.


## Field Notes: Snap and user control

Snapping is most defensible when each snap point represents a discrete, meaningful state such as a short presentation chapter. It is less appropriate for long editorial pages, documentation, product specifications, or dense forms where readers may want to stop anywhere. If snap is used, keep it modest and test natural input, fast flicks, and small scroll adjustments.

Use label-based snapping when timeline labels match the content chapters. This avoids hand-maintaining an unrelated list of numeric progress values. If the number of labels changes dynamically, rebuild the timeline and its trigger deliberately. Do not let a snap configuration become stale when the content changes.

A user should always understand where they are and how to leave the pinned region. Provide ordinary navigation and links, preserve browser scroll affordances, and do not combine long pinning, aggressive snapping, and large parallax in one interaction unless testing demonstrates a clear benefit.


## Field Notes: Testing responsive motion

Test responsive motion as a set of distinct experiences. Desktop may support a pinned chapter with a large visual; mobile may need a vertical sequence with no pinning. Tablet and landscape states can be more difficult than either endpoint because the content fits neither layout comfortably. Choose breakpoints based on content and viewport height as well as width when appropriate.

When a media query stops matching, revert the animations and pinning created inside that context. Verify that no pin spacer or inline transform remains from the previous mode. Resize repeatedly across the breakpoint rather than testing only one change. Test browser zoom and longer text, because localization and zoom can change the available content area without changing the device itself.

If the animation depends on viewport height, account for mobile browser chrome and changing visual viewport dimensions. Avoid a fixed pin distance that assumes every mobile browser exposes the same usable height. The natural-flow fallback should remain complete and coherent even if measurements are unavailable.


## Field Notes: Accessibility validation for scroll narratives

A pinned section can create a mismatch between visual order and DOM order. Keyboard focus may advance into content that is visually covered, or the user may tab to a link while its chapter is not currently visible. Keep DOM order logical and ensure all focusable content remains visible when focused. Do not hide non-current chapters from assistive technology merely to make the visual scene look simpler unless the interaction model genuinely treats them as inactive content and correctly manages focus and semantics.

Use headings to expose the chapter structure. Give buttons accessible names and update expanded state when content is shown or hidden. If an image is decorative, use empty alt text; if it communicates information, provide an appropriate alternative. Avoid conveying chapter progression through color or movement alone.

Test with keyboard-only navigation, a screen reader where available, zoom, and reduced motion. Check `:focus-visible` styling when a focused element is inside a pinned container. Accessibility is not validated by a screenshot of the animation alone.


## Field Notes: Performance triage for scroll-linked effects

When a scroll experience feels sluggish, isolate whether the cost comes from the browser’s layout/paint pipeline or from JavaScript. Record a scroll interaction in DevTools Performance. Look for repeated layout, expensive paint, long tasks, and frame drops. Use the Layers panel to inspect compositing. Check if the same property is written by ScrollTrigger and another event loop.

Transforms and opacity are good defaults for visual movement, but an element with a large blur filter or huge shadow can still require expensive rasterization. `will-change` can increase layer memory; apply it only after measurement and remove it when it is no longer needed. Avoid animating `top`, `left`, `width`, or `height` on every scroll update unless the layout transition is essential.

Do not run `console.log()` or `console.table()` for every scroll update. Use a diagnostic helper that you call manually, and remove noisy instrumentation before production. Do not introduce a separate `requestAnimationFrame` loop to duplicate ScrollTrigger’s own updates. If custom work is required, batch reads and writes and profile the result.


## Field Notes: Graceful failure and no-JavaScript baseline

A scroll animation should be an enhancement to a page that already has meaning. Keep headings, text, links, and controls in the document flow. Avoid CSS rules that set all story sections to `opacity: 0` until a script toggles a class. If the plugin fails to import or a selector changes during refactoring, the user should still be able to read the content and use the site.

If a visual chapter is only meaningful when a specific script runs, consider whether the underlying content structure is too dependent on presentation. The data should be represented in HTML and application state; the animation should coordinate visual emphasis. Use `hidden` only when content is intentionally unavailable, and synchronize it with state and focus management.

Test the missing-selector case, JavaScript-disabled case, and a runtime error during setup. A defensive null check is helpful, but the fallback design is what prevents a blank section.
