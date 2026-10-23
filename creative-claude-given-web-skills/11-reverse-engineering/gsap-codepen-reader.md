---
# SKILL: gsap-codepen-reader
**Layer:** 11 — Reverse Engineering
**Goal:** Analyze an interactive CodePen or browser demo, identify the GSAP timeline and trigger patterns that explain its behavior, and document a reliable implementation recipe without confusing observation with assumption.

---

## Why This Matters (Senior Perspective)

Creative developers often discover useful motion ideas in CodePen demos, award-site references, and isolated experiments. The difficult part is not recognizing that an animation looks good; it is understanding the structure that makes it work. A demo may combine GSAP timelines, ScrollTrigger, SplitText, custom easing, DOM measurements, resize handling, and CSS states. Copying one visible code fragment without understanding the surrounding lifecycle can produce an effect that works only at the original viewport or only after a specific scroll sequence.

A senior developer reads an animation demo as a small system. The HTML identifies targets and semantic structure; CSS defines initial presentation, clipping, layout, and responsive behavior; JavaScript or GSAP defines timing, orchestration, and input; plugins define specialized behaviors; and lifecycle code connects the pieces. The first task is to identify what is actually being animated, what triggers the animation, how progress is controlled, and which values are measured at runtime. The second is to determine what the demo assumes: fixed markup, a particular font, a plugin, a viewport size, a scroll container, or a specific browser state.

This skill helps you extract reusable knowledge rather than blindly cloning a demo. The result should be a concise technical reading: observed behavior, likely timeline structure, target selection, trigger configuration, dependencies, responsive risks, reduced-motion plan, and a minimal reproducible implementation. You do not need to reproduce the author's private intent or claim certainty about code you cannot inspect. You need to understand enough to implement the behavior cleanly in your own portfolio or client project, while preserving accessibility, performance, and maintainability.

---

## Core Concepts

### 1. Read the demo in layers before reading it line by line

Start with the visible behavior and file structure. Identify the entry state, final state, trigger, and any repeated choreography. Then map the visible effect to likely HTML targets, CSS initial styles, and GSAP calls. This avoids getting lost in helper functions before you know what the demo is trying to do.

```html
<section class="intro-scene" aria-labelledby="intro-title">
  <p class="intro-scene__eyebrow">Independent digital studio</p>
  <h1 class="intro-scene__title" id="intro-title">
    Built for curious minds
  </h1>
  <a class="intro-scene__link" href="#selected-work">Explore the work</a>
</section>
```

```js
const introTimeline = gsap.timeline({
  defaults: {
    duration: 0.8,
    ease: "power3.out"
  }
});

introTimeline
  .from(".intro-scene__eyebrow", { y: 14, autoAlpha: 0 })
  .from(".intro-scene__title", { yPercent: 105, autoAlpha: 0 }, "-=0.45")
  .from(".intro-scene__link", { y: 10, autoAlpha: 0 }, "-=0.35");
```

The timeline suggests a sequence with overlaps: the title begins before the eyebrow animation finishes, and the link begins before the title completes. The visible result should be compared with the actual demo; the snippet is an illustrative reading pattern, not evidence about any specific author's source.

**Naive approach:** Copy the first `gsap.to()` call that resembles the effect.

**Correct approach:** Identify targets, initial and final states, trigger, timeline relationships, dependencies, and lifecycle before extracting code.

**Gotcha:** CSS may already set opacity, transform, overflow, or visibility. GSAP's runtime values only make sense when read alongside those styles.

### 2. Distinguish `to`, `from`, `fromTo`, and `set`

These methods communicate different assumptions. `to()` animates from the current rendered state to a destination. `from()` animates from supplied values toward the current state. `fromTo()` specifies both endpoints, useful when a stable initial state is important. `set()` applies values immediately and is not a timed transition.

```js
const projectImage = document.querySelector(".project-card__image");

if (projectImage) {
  gsap.set(projectImage, {
    transformOrigin: "50% 50%",
    scale: 1.06
  });

  gsap.to(projectImage, {
    scale: 1,
    duration: 0.9,
    ease: "power2.out"
  });
}
```

Use explicit endpoints when a demo must remain predictable across CSS changes or repeated initialization. Use `to()` when the current state is intentionally the source of truth, such as a reversible interaction.

**Naive approach:** Use `from()` everywhere because it is concise.

**Correct approach:** Choose the method based on whether the starting state is explicit, inherited from CSS, or intentionally captured at runtime.

**Gotcha:** `from()` animations may render immediately and can create surprising states if `immediateRender` behavior interacts with timelines or ScrollTrigger. Inspect the first frame and the timeline's initialization order.

### 3. Read a timeline as a choreography, not a list of independent animations

A GSAP timeline coordinates multiple tweens. Position parameters such as `"-=0.3"`, labels, and absolute positions express relationships. A demo with carefully overlapped motion can often be understood by reconstructing those relationships rather than copying each tween independently.

```js
const caseStudyTimeline = gsap.timeline({
  paused: true,
  defaults: { ease: "power3.out" }
});

caseStudyTimeline
  .addLabel("enter")
  .from(".case-study__number", {
    y: 18,
    autoAlpha: 0,
    duration: 0.35
  }, "enter")
  .from(".case-study__heading", {
    yPercent: 110,
    autoAlpha: 0,
    duration: 0.75
  }, "enter+=0.08")
  .from(".case-study__description", {
    y: 16,
    autoAlpha: 0,
    duration: 0.5
  }, "enter+=0.28");
```

Labels create named moments. Relative positions express overlap without requiring every tween to be rewritten when a previous duration changes. A useful reverse-engineering note should identify the main labels and what visual event they represent.

**Naive approach:** Add arbitrary delays to every tween until the animation looks close.

**Correct approach:** Model the choreography with labels and relative positions, then tune durations and easing after the sequence makes sense.

**Gotcha:** Timeline time is not necessarily wall-clock time when it is controlled by ScrollTrigger, a scrub value, playback rate, or another parent timeline.

### 4. Identify the trigger: load, hover, click, or scroll

A demo may start immediately, respond to pointer interaction, run after a click, or be controlled by scroll progress. These triggers are not interchangeable. Inspect the event listeners, timeline state, and any ScrollTrigger configuration to determine what actually starts or scrubs the animation.

```js
const detailTimeline = gsap.timeline({ paused: true });

detailTimeline
  .to(".project-card__detail", {
    autoAlpha: 1,
    y: 0,
    duration: 0.3
  });

const detailCard = document.querySelector(".project-card");

if (detailCard) {
  detailCard.addEventListener("pointerenter", () => detailTimeline.play());
  detailCard.addEventListener("pointerleave", () => detailTimeline.reverse());
}
```

For an interaction, inspect how the demo handles repeated entry, pointer exit, keyboard focus, and interruption. If a timeline is reversed while still playing, GSAP can handle that transition smoothly, but the design must still account for focus and touch input.

**Naive approach:** Reproduce the visual state but omit the trigger and reset behavior.

**Correct approach:** Document the trigger, state transitions, reversal behavior, and fallback for input types that do not have hover.

**Gotcha:** Pointer events alone do not cover every keyboard interaction. For essential reveal content, provide focus behavior and avoid making touch users discover content through a hover-only state.

### 5. Read ScrollTrigger configuration as geometry plus timing

ScrollTrigger links an animation to scroll position. Its `trigger`, `start`, `end`, `scrub`, `pin`, `toggleActions`, and refresh behavior describe different aspects of the interaction. Do not treat a string such as `"top 80%"` as an arbitrary magic value: it expresses the relationship between an element edge and a viewport position.

```js
const featureTimeline = gsap.timeline({
  scrollTrigger: {
    trigger: ".feature-section",
    start: "top 78%",
    end: "bottom 30%",
    scrub: 0.6,
    invalidateOnRefresh: true
  }
});

featureTimeline
  .from(".feature-section__image", {
    yPercent: 18,
    scale: 0.94,
    ease: "none"
  })
  .from(".feature-section__heading", {
    y: 24,
    autoAlpha: 0,
    ease: "none"
  }, 0.15);
```

With `scrub`, scroll progress drives animation progress; the tween duration becomes a relative timeline duration rather than a simple wall-clock duration. With `scrub: 0.6`, the playhead can catch up smoothly rather than following the scroll position instantly. Confirm the actual configuration in the demo and test the start/end positions at different viewport heights.

**Naive approach:** Copy `start: "top center"` from a demo and assume it works for every layout.

**Correct approach:** Read the trigger element, start/end relationship, scrub/pin settings, and refresh assumptions as one system.

**Gotcha:** Font loading, responsive image dimensions, expanded content, and late layout changes can invalidate measured scroll positions. Use refresh-aware setup and reserve space for media.

### 6. Distinguish a scrubbed timeline from a triggered entrance

A scroll-triggered entrance plays when an element crosses a boundary and may continue independently. A scrubbed timeline maps scroll position to progress. A pinned section may hold the viewport while the page scrolls through a timeline. The visual can look similar in a single screenshot but requires a different implementation.

```js
// Triggered entrance: play once when the section becomes visible.
gsap.from(".quote-block", {
  y: 28,
  autoAlpha: 0,
  duration: 0.7,
  scrollTrigger: {
    trigger: ".quote-block",
    start: "top 82%",
    once: true
  }
});

// Scrubbed progression: animation progress follows scroll.
gsap.to(".gallery-track", {
  xPercent: -35,
  ease: "none",
  scrollTrigger: {
    trigger: ".gallery-section",
    start: "top top",
    end: "+=900",
    scrub: true
  }
});
```

The first is an entrance animation. The second maps vertical scroll to horizontal movement. Choose based on the observed relationship between scrolling and animation progress.

**Naive approach:** Use `scrub: true` for every scroll effect because the page scrolls.

**Correct approach:** Test whether reversing the scroll reverses the effect continuously or whether the animation plays after crossing a trigger threshold.

**Gotcha:** A horizontal gallery tied to vertical scroll needs a clear mobile fallback. On touch devices, a native horizontal scroller may be more usable than a long pinned sequence.

### 7. Understand selector strategy and target scope

CodePen demos often use short selectors because the example contains one component. Production code may render multiple cards, repeated sections, or route-specific content. Read whether selectors target one element, a group, or the entire document. Scope animation setup to the component instance to avoid unintended cross-component effects.

```js
const projectCards = gsap.utils.toArray(".project-card");

projectCards.forEach((projectCard) => {
  const image = projectCard.querySelector(".project-card__image");
  const title = projectCard.querySelector(".project-card__title");

  if (!image || !title) return;

  const cardTimeline = gsap.timeline({ paused: true });

  cardTimeline
    .to(image, { scale: 1.04, duration: 0.45, ease: "power2.out" }, 0)
    .to(title, { x: 6, duration: 0.3, ease: "power2.out" }, 0);

  projectCard.addEventListener("pointerenter", () => cardTimeline.play());
  projectCard.addEventListener("pointerleave", () => cardTimeline.reverse());
});
```

This pattern scopes each timeline to a card and avoids animating every title when any card is hovered. For frameworks or repeated mounts, also clean up event listeners and GSAP contexts during teardown.

**Naive approach:** Use a broad selector such as `.title` and assume it refers to the intended element.

**Correct approach:** Inspect target counts, scope to the component, and confirm which element each tween actually affects.

**Gotcha:** A selector that returns no elements may fail silently enough to make debugging confusing. Check the target count during investigation, especially when class names are generated or nested.

### 8. Inspect the CSS initial state and clipping structure

Many text and image effects rely on a wrapper with `overflow: hidden`, an inner element translated beyond the wrapper, a mask, or a clip path. GSAP may only animate the inner element. If you copy the tween without the wrapper or its styles, the result will not match.

```html
<h2 class="reveal-heading">
  <span class="reveal-heading__window">
    <span class="reveal-heading__text">A quieter kind of motion</span>
  </span>
</h2>
```

```css
.reveal-heading__window {
  display: block;
  overflow: clip;
}

.reveal-heading__text {
  display: inline-block;
  transform: translateY(110%);
}
```

```js
gsap.to(".reveal-heading__text", {
  yPercent: 0,
  duration: 0.85,
  ease: "power4.out"
});
```

The wrapper defines the clipping boundary; the inner span provides the moving content. In a real critique, inspect whether the demo uses `overflow: hidden`, `clip-path`, `mask-image`, or a parent transform before choosing a substitute.

**Naive approach:** Animate the heading directly without reconstructing the wrapper hierarchy.

**Correct approach:** Read markup and CSS together, then identify which element clips and which element moves.

**Gotcha:** Inline text nodes, line wrapping, and nested spans can change the behavior of transforms. Test long headings and narrow widths, not just the demo's short sample.

### 9. Recognize stagger and text-splitting plugins

Text effects may split a heading into lines, words, or characters, then stagger individual elements. GSAP's SplitText is a plugin; it should not be assumed available just because a demo uses it. If the demo depends on SplitText, verify how the split is created, how accessibility is preserved, and whether the DOM is reverted or rebuilt on resize.

```js
// Illustrative pattern when the licensed SplitText plugin is available.
const headingElement = document.querySelector(".statement-heading");

if (headingElement) {
  const splitHeading = SplitText.create(headingElement, {
    type: "lines,words",
    linesClass: "split-line",
    wordsClass: "split-word",
    aria: "auto"
  });

  gsap.from(splitHeading.words, {
    yPercent: 110,
    autoAlpha: 0,
    duration: 0.7,
    stagger: 0.035,
    ease: "power3.out",
    scrollTrigger: {
      trigger: headingElement,
      start: "top 82%",
      once: true
    }
  });
}
```

Treat plugin use as a dependency to document, not an invisible assumption. If SplitText is unavailable or unnecessary, use a simpler element-level reveal or a carefully implemented CSS approach.

**Naive approach:** Copy a `SplitText` example without checking whether the plugin is included or licensed for the project.

**Correct approach:** Record the plugin dependency, initialization and cleanup behavior, accessibility implications, and resize strategy.

**Gotcha:** Text splitting can create awkward reading order or broken line grouping if the layout changes after splitting. Re-split or revert on relevant resize changes, and test screen-reader output.

### 10. Read easing as part of the motion's character

Easing determines how velocity changes through a tween. `power2.out` decelerates toward the end; `power2.in` accelerates from rest; `power2.inOut` eases both ends. `none` is linear and is often appropriate for scrubbed motion where progress should track scroll directly. Custom cubic-bezier-like GSAP eases or spring-like behavior may need closer inspection.

```js
const easingExamples = [
  { label: "quick settle", ease: "power2.out", duration: 0.45 },
  { label: "expressive entrance", ease: "power4.out", duration: 0.9 },
  { label: "balanced movement", ease: "power2.inOut", duration: 0.7 },
  { label: "scroll-linked motion", ease: "none", duration: 1 }
];

console.table(easingExamples);
```

Compare the same movement using two or three candidate eases rather than adjusting duration and easing simultaneously. This isolates which parameter makes the motion feel too floaty, too abrupt, or too mechanical.

**Naive approach:** Replace the reference easing with a default ease because it is familiar.

**Correct approach:** Observe acceleration and deceleration, test a small candidate set, and preserve linear mapping for genuinely scrubbed effects when appropriate.

**Gotcha:** The easing label alone does not describe the complete motion. Distance, duration, overlap, and triggering context all affect perceived character.

### 11. Identify responsive measurements and refresh logic

Demos may measure element bounds, viewport dimensions, text line counts, or image sizes during setup. These measurements become stale when fonts load, content changes, or the viewport resizes. Inspect resize listeners, `invalidateOnRefresh`, `ScrollTrigger.refresh()`, `ResizeObserver`, and any cached values.

```js
const horizontalTrack = document.querySelector(".horizontal-gallery__track");

function createGalleryAnimation() {
  if (!horizontalTrack) return null;

  const distance = Math.max(
    0,
    horizontalTrack.scrollWidth - horizontalTrack.parentElement.clientWidth
  );

  return gsap.to(horizontalTrack, {
    x: -distance,
    ease: "none",
    scrollTrigger: {
      trigger: ".horizontal-gallery",
      start: "top top",
      end: () => `+=${Math.max(distance, window.innerHeight)}`,
      scrub: true,
      invalidateOnRefresh: true
    }
  });
}
```

The distance is derived from actual content width instead of a hard-coded translation. A production implementation should guard the parent element, rebuild or refresh when geometry changes, and offer a usable native horizontal layout at small widths if pinning becomes awkward.

**Naive approach:** Copy a measured pixel distance from a CodePen's desktop viewport.

**Correct approach:** Determine whether measurements are fixed or derived, then verify the effect after resize and font/image load.

**Gotcha:** `invalidateOnRefresh` helps invalidate GSAP tween values during refresh, but it does not automatically make every custom cached measurement correct. Recalculate values when the underlying geometry changes.

### 12. Read lifecycle, cleanup, and repeat initialization

An isolated demo often runs once on page load. In a routed application or component framework, the same code may mount more than once. Duplicate listeners, timelines, ScrollTriggers, and inline styles can accumulate. Read the initialization boundary and find out how the demo kills, reverts, or recreates animation state.

```js
const motionContext = gsap.context(() => {
  gsap.from(".feature-heading", {
    y: 24,
    autoAlpha: 0,
    duration: 0.65,
    scrollTrigger: {
      trigger: ".feature-section",
      start: "top 80%",
      once: true
    }
  });
}, document.querySelector(".feature-section"));

// Call this during component teardown.
function disposeFeatureMotion() {
  motionContext.revert();
}
```

`gsap.context()` groups animations and allows cleanup through `revert()`. This is especially helpful when moving a demo into React or another component-based setup. If the original code uses direct event listeners, make sure your extracted implementation removes them on teardown too.

**Naive approach:** Paste initialization into a component render path and assume it will run only once.

**Correct approach:** Initialize in the appropriate lifecycle, scope animations, and clean up timelines, ScrollTriggers, listeners, and split DOM when the component is removed.

**Gotcha:** Killing a timeline and reverting inline styles are different operations. Decide whether the component should return to its original CSS state or retain its final visual state.

### 13. Check accessibility and reduced-motion behavior in the demo

A CodePen may be a visual experiment rather than a complete product. The reverse-engineered version must not inherit every omission. Check whether content starts hidden, whether controls are keyboard-accessible, whether the effect depends on hover, and whether reduced motion is honored.

```js
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const accessibleIntroTimeline = gsap.timeline({
  paused: prefersReducedMotion,
  defaults: { ease: "power3.out" }
});

accessibleIntroTimeline.from(".intro-copy", {
  y: 18,
  autoAlpha: prefersReducedMotion ? 1 : 0,
  duration: prefersReducedMotion ? 0 : 0.7
});

if (prefersReducedMotion) {
  gsap.set(".intro-copy", { clearProps: "transform,opacity,visibility" });
} else {
  accessibleIntroTimeline.play();
}
```

This illustrates the intent, but be careful with the exact initial state: the static page should be complete and readable even before the animation initializes. In a real project, keep content visible by default and apply hidden animation states only when the motion system is ready.

**Naive approach:** Copy a demo whose heading remains at `opacity: 0` if JavaScript fails.

**Correct approach:** Make motion progressive enhancement, support keyboard equivalents, and define a complete reduced-motion state.

**Gotcha:** A reduced-motion preference can change while the page is open. For long-running interactions, consider responding to preference changes instead of reading the media query only once.

### 14. Reconstruct the smallest reliable implementation

The objective is not to preserve every line from a demo. Remove unrelated styling, debug logs, unused dependencies, and assumptions that do not serve the observed effect. Keep the essential markup, target selection, trigger, timeline, responsive measurements, and fallback. Then compare your implementation against the original across multiple states.

```js
function createHeadingReveal(headingElement) {
  if (!headingElement) return () => {};

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches) {
    gsap.set(headingElement, { clearProps: "all" });
    return () => {};
  }

  const revealTimeline = gsap.fromTo(
    headingElement,
    { y: 24, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.75,
      ease: "power3.out",
      paused: true
    }
  );

  revealTimeline.play();

  return () => revealTimeline.kill();
}

const headingElement = document.querySelector(".case-study__heading");
const cleanupHeadingReveal = createHeadingReveal(headingElement);

// In a component lifecycle, call cleanupHeadingReveal() when unmounting.
```

This small function demonstrates the principle of isolating the effect, though production code should account for changing reduced-motion preferences and restore styles according to the component's lifecycle. The recipe should state what has been simplified and what behavior was intentionally not reproduced.

**Naive approach:** Copy the whole demo including unused libraries and incidental styling.

**Correct approach:** Keep only the behavior needed to explain the observation and document the trade-offs.

**Gotcha:** Simplifying too early can remove a crucial dependency, such as a clipping wrapper or a refresh callback. Compare behavior after each removal rather than deleting code in bulk.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: CodePen reading worksheet

**What it does:** Captures the evidence needed to understand a demo before rewriting it.

**When to use it:** Use this when a pen combines multiple files, plugins, scroll triggers, and responsive states.

```js
const demoReadingNotes = {
  visibleEffect: "heading reveals line by line as the section enters view",
  trigger: "scroll position",
  progressModel: "appears to play once, not continuously scrub",
  targets: [".heading-line", ".heading-word"],
  renderingSurface: "DOM text",
  dependencies: ["GSAP", "ScrollTrigger", "SplitText"],
  measuredValues: {
    start: "top 80%",
    durationSeconds: 0.8,
    staggerSeconds: 0.04
  },
  unknowns: [
    "whether split markup is rebuilt on resize",
    "whether reduced motion is supported"
  ],
  nextTests: [
    "disable each plugin in isolation",
    "resize after font load",
    "test keyboard and reduced motion"
  ]
};

console.log(JSON.stringify(demoReadingNotes, null, 2));
```

Treat the values as notes for the demo you are actually reading; do not copy these illustrative values as findings. Explicit unknowns are better than invented certainty.

### Pattern 2: Rebuild a timeline with labels

**What it does:** Converts a long sequence of unrelated tweens into a readable choreography.

**When to use it:** Use this when the demo contains overlapping title, eyebrow, media, and caption animations.

```js
const portfolioIntro = gsap.timeline({
  defaults: { ease: "power3.out" }
});

portfolioIntro
  .addLabel("intro")
  .from(".portfolio-hero__eyebrow", {
    y: 12,
    autoAlpha: 0,
    duration: 0.35
  }, "intro")
  .from(".portfolio-hero__title", {
    yPercent: 105,
    autoAlpha: 0,
    duration: 0.8
  }, "intro+=0.08")
  .from(".portfolio-hero__media", {
    clipPath: "inset(0 0 100% 0)",
    duration: 0.9
  }, "intro+=0.2")
  .from(".portfolio-hero__summary", {
    y: 14,
    autoAlpha: 0,
    duration: 0.45
  }, "intro+=0.42");
```

Labels help communicate intention to a future maintainer. If a timeline is scroll-controlled, place labels around meaningful visual milestones so the scroll mapping can be reasoned about.

### Pattern 3: ScrollTrigger with a responsive fallback

**What it does:** Uses a scroll-linked animation on wider layouts and a simpler layout on narrow screens.

**When to use it:** Use this when a desktop horizontal pinning effect becomes awkward on a phone.

```js
const mediaQuery = gsap.matchMedia();

mediaQuery.add("(min-width: 800px)", () => {
  const galleryTrack = document.querySelector(".gallery-track");
  if (!galleryTrack) return;

  const galleryDistance = () =>
    Math.max(0, galleryTrack.scrollWidth - window.innerWidth);

  gsap.to(galleryTrack, {
    x: () => -galleryDistance(),
    ease: "none",
    scrollTrigger: {
      trigger: ".gallery-section",
      start: "top top",
      end: () => `+=${galleryDistance()}`,
      scrub: true,
      pin: true,
      invalidateOnRefresh: true
    }
  });
});

mediaQuery.add("(max-width: 799px)", () => {
  gsap.set(".gallery-track", { clearProps: "transform" });
});

// Call mediaQuery.revert() when the owning component is disposed.
```

The mobile CSS should provide a normal stacked or horizontally scrollable gallery. Do not leave the narrow-screen layout dependent on the desktop timeline's transformed state.

### Pattern 4: Reusable hover timeline with keyboard support

**What it does:** Shares the same motion between pointer hover and keyboard focus.

**When to use it:** Use this for project cards with decorative image movement or a caption that remains meaningful without motion.

```js
document.querySelectorAll("[data-project-card]").forEach((card) => {
  const image = card.querySelector("[data-project-image]");
  if (!image) return;

  const cardMotion = gsap.to(image, {
    scale: 1.045,
    duration: 0.45,
    ease: "power2.out",
    paused: true
  });

  const activate = () => cardMotion.play();
  const deactivate = () => cardMotion.reverse();

  card.addEventListener("pointerenter", activate);
  card.addEventListener("pointerleave", deactivate);
  card.addEventListener("focusin", activate);
  card.addEventListener("focusout", (event) => {
    if (!card.contains(event.relatedTarget)) deactivate();
  });
});
```

For a reusable component, keep references to the event listeners and timeline so they can be removed during teardown. The visible project title and link should not depend on the animation to exist.

### Pattern 5: Reduced-motion-safe timeline setup

**What it does:** Keeps the no-motion state visible and skips nonessential entrance movement.

**When to use it:** Use this for hero sequences, page introductions, and long staggered reveals.

```js
const introMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const introHeading = document.querySelector(".portfolio-hero__title");

function renderIntroMotion() {
  if (!introHeading) return;

  if (introMotionQuery.matches) {
    gsap.set(introHeading, { clearProps: "all" });
    return;
  }

  gsap.fromTo(
    introHeading,
    { y: 20, autoAlpha: 0 },
    {
      y: 0,
      autoAlpha: 1,
      duration: 0.7,
      ease: "power3.out",
      overwrite: "auto"
    }
  );
}

renderIntroMotion();
introMotionQuery.addEventListener("change", renderIntroMotion);
```

In production, track and kill the previous tween before creating a new one on preference changes. This pattern shows the state decision, but lifecycle-safe code must avoid duplicate animations when the media query changes repeatedly.

### Pattern 6: Cleanup through a GSAP context

**What it does:** Groups animation work and reverts it as one unit.

**When to use it:** Use this when migrating a demo into a component that can mount and unmount.

```js
function mountFeatureMotion(rootElement) {
  if (!rootElement) return () => {};

  const featureContext = gsap.context(() => {
    gsap.from(".feature-title", {
      y: 22,
      autoAlpha: 0,
      duration: 0.65,
      scrollTrigger: {
        trigger: ".feature-section",
        start: "top 82%",
        once: true
      }
    });

    gsap.to(".feature-artwork", {
      rotate: 2,
      duration: 0.8,
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".feature-section",
        start: "top 70%",
        toggleActions: "play none none reverse"
      }
    });
  }, rootElement);

  return () => featureContext.revert();
}

const featureRoot = document.querySelector("[data-feature-root]");
const unmountFeatureMotion = mountFeatureMotion(featureRoot);
```

Keep selectors scoped to the component root when possible. Verify whether the original demo uses global selectors and adapt them rather than carrying that assumption into a page with repeated sections.

### Pattern 7: Compare the extracted effect with the reference

**What it does:** Makes visual validation repeatable across states rather than relying on memory.

**When to use it:** Use this when tuning a recreated effect for a portfolio or client page.

```js
const comparisonChecklist = [
  "initial state matches the intended composition",
  "trigger occurs at a comparable point",
  "motion distance is similar",
  "easing and overlap feel consistent",
  "final state matches without clipping",
  "resize does not leave stale measurements",
  "keyboard and touch behavior remain understandable",
  "reduced motion keeps content visible"
];

comparisonChecklist.forEach((item, index) => {
  console.log(`${index + 1}. [ ] ${item}`);
});
```

Compare the same viewport, scroll position, input, and content state. If exact pixel parity is not necessary, document which differences are intentional improvements rather than silent mismatches.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Copying only a tween | The visible code is easier to understand than the whole system | Read markup, CSS, trigger configuration, dependencies, and cleanup together |
| Assuming a plugin is included | The demo hides external resources in settings or imports | Check dependency settings, license requirements, and plugin initialization |
| Treating scrub as ordinary duration | Timeline time is confused with wall-clock playback | Identify whether scroll position controls progress and test reverse scrolling |
| Reusing a desktop `x` value | The original demo was tuned for one viewport | Derive movement from measured geometry and refresh when it changes |
| Using broad selectors in a multi-card layout | The demo only contains one instance | Scope each timeline to the component and inspect target counts |
| Ignoring CSS initial states | GSAP code is read without its stylesheet | Inspect transforms, opacity, clipping, overflow, and visibility before rewriting |
| Assuming `from()` is harmless | Immediate rendering and captured states are overlooked | Test the first frame and use explicit endpoints when stability matters |
| Forgetting hover reversal | Only the activation state was reproduced | Test enter, leave, repeated entry, focus, and interrupted motion |
| Leaving content hidden on failure | The hidden animation state became the default state | Keep content visible by default and add motion as progressive enhancement |
| Splitting text without resize logic | The demo's initial line breaks are assumed permanent | Revert or rebuild splits after relevant layout and font changes |
| Omitting teardown | A one-shot pen is copied into a repeated component lifecycle | Revert contexts, kill timelines, remove listeners, and dispose plugin state |
| Adding `ScrollTrigger.refresh()` indiscriminately | Refresh is used as a universal repair | Find which layout measurement became stale and refresh at the correct lifecycle point |
| Treating all motion as scroll-linked | The page scrolls, so the effect is assumed to scrub | Check whether the effect reverses continuously or plays after crossing a threshold |
| Ignoring reduced motion | The source demo prioritizes visual experimentation | Provide a complete static state and skip nonessential movement |
| Making mobile inherit desktop pinning | Responsive behavior was not part of the original demo | Use matchMedia and an intentional small-screen composition |
| Measuring performance by intuition | A smooth desktop run seems conclusive | Record a repeatable trace on a representative device and inspect frame cost |
| Copying an entire CodePen | Unused styles and dependencies appear to be required | Remove one dependency at a time and retest the behavior |
| Claiming the author's intent as fact | A plausible reading is mistaken for certainty | Label observed behavior, inferred technique, and unresolved questions separately |

**Before → after: document uncertainty instead of inventing certainty.**

```text
Before:
"The original uses a pinned GSAP horizontal gallery with a 900px scroll distance."

After:
"Observed: the gallery remains fixed while vertical scrolling advances the image track.
Inferred: a pinned ScrollTrigger timeline is a likely implementation.
Unverified: the exact end distance and whether the original uses a custom scroller.
Next test: inspect the ScrollTrigger configuration and compare the effect at two viewport heights."
```

The second version is useful even before the source has been fully inspected. It records the evidence and the next action needed to raise confidence.

---

## Mental Models

1. **Read the system, not just the tween** — HTML, CSS, dependencies, triggers, and cleanup jointly explain the result.
2. **A timeline is choreography** — labels and relative positions communicate relationships better than unrelated delays.
3. **Scroll progress is a different clock** — a scrubbed timeline is controlled by scroll geometry, not simply elapsed seconds.
4. **Targets have scope** — a selector that works in a one-card demo may affect every card in a real portfolio.
5. **Measurements expire** — fonts, images, content, and viewport changes can invalidate cached geometry.
6. **The demo is evidence, not a specification** — preserve the observed behavior while improving accessibility and resilience.
7. **A recipe includes teardown** — a motion effect is not complete if it leaks listeners or leaves stale styles after unmount.

---

## Quick Reference

| What you observe | Inspect first | Likely implementation family | Important test |
|---|---|---|---|
| Elements overlap in a reveal | Timeline positions and labels | GSAP timeline | Compare overlap and total sequence |
| Heading moves upward into view | Wrapper overflow and inner transform | GSAP tween + CSS clipping | Long heading and narrow viewport |
| Motion reverses with scroll | `scrub`, `start`, and `end` | ScrollTrigger scrub | Reverse scroll slowly |
| Section stays pinned | `pin`, trigger, and end distance | ScrollTrigger pin | Mobile fallback and layout spacing |
| Effect runs once at entry | `toggleActions`, `once`, trigger | Scroll-triggered entrance | Re-enter viewport and refresh |
| Words animate separately | SplitText dependency and stagger | Text splitting + GSAP | Plugin availability, resize, screen reader |
| Every card animates together | Selector scope and target count | Broad selector issue | Inspect multiple component instances |
| Animation breaks after resize | Cached measurements and refresh hooks | Responsive timeline | Resize after fonts and images load |
| Effect runs twice | Initialization and lifecycle | Duplicate mount or listener | Re-mount and inspect active triggers |
| Hidden content stays hidden | CSS initial state and JS failure | Non-progressive enhancement | Disable JS and enable reduced motion |
| Desktop works, mobile does not | Fixed values and pinning assumptions | Missing responsive branch | Test touch and narrow viewport |
| Demo requires a premium plugin | Pen resources and imports | Plugin-dependent animation | Verify access, license, and fallback |
| Motion feels too mechanical | Ease, duration, distance, overlap | Tween tuning | Change one parameter at a time |
| Frame rate drops | DOM count, layout, paint, shader work | Runtime performance issue | Capture a Performance trace |
| Need to recreate only one effect | Dependency graph and essential markup | Minimal isolated recipe | Remove unrelated code incrementally |

---

## Build Challenge

### Build: CodePen-to-Production Motion Recipe

Choose a public CodePen or browser demo that contains a visible GSAP interaction. Reconstruct one effect in a small local page, then document how you determined the implementation. Do not claim that an inferred technique is confirmed unless you have inspected the relevant source or runtime evidence.

**Requirements**

1. Record the demo URL, date reviewed, viewport dimensions, browser, and the exact state you inspected.
2. Write an observation-only description of the effect before naming any library or technique.
3. Identify the target elements, initial and final states, trigger, timeline relationships, easing, and duration or scroll range.
4. Record all external dependencies and identify whether any plugin requires separate access or licensing.
5. Determine whether the effect is a triggered entrance, a scrubbed timeline, a pinned section, or a pointer/click interaction.
6. Rebuild the smallest useful version with semantic HTML, scoped selectors, and clear CSS initial states.
7. If a timeline contains multiple steps, use labels or relative positions to represent the choreography.
8. If the effect depends on scroll measurements, test it at two viewport heights and after a resize.
9. Add a reduced-motion state and ensure content remains visible if JavaScript fails.
10. Add keyboard behavior for any interaction that would otherwise depend on hover.
11. Add cleanup for timelines, ScrollTriggers, and event listeners when the effect is removed or reinitialized.
12. Compare the recreated effect with the reference using the same viewport and trigger state.
13. Write down at least three observed differences and decide whether to correct them or intentionally preserve them.
14. Include a short note separating confirmed facts, inferred techniques, and unknowns.
15. Create a reusable `motion-recipe.md` containing target structure, dependencies, timing values, trigger, responsive rules, fallback, cleanup, and validation steps.

**Expected output**

- A small working page with one recreated GSAP effect.
- A `motion-recipe.md` file that documents the reasoning and implementation.
- A dependency list and lifecycle cleanup note.
- A comparison checklist with observed differences and follow-up tests.

**Definition of done / Success criteria**

- [ ] The initial description states only observable behavior.
- [ ] The recipe separates observations from implementation hypotheses.
- [ ] The trigger and progress model are correctly identified.
- [ ] Target selectors are scoped and work with the intended number of instances.
- [ ] Responsive geometry is derived or refreshed instead of copied blindly.
- [ ] The page remains readable without JavaScript and with reduced motion enabled.
- [ ] Keyboard and touch interactions remain usable.
- [ ] Timelines, triggers, and listeners are cleaned up when appropriate.
- [ ] The recreated effect is compared at matching viewport and interaction states.
- [ ] A future developer can understand and tune the effect from the recipe without rereading the original demo.
