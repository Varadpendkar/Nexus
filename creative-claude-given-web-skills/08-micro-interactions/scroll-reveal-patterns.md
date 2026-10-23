# SKILL: scroll-reveal-patterns
**Layer:** 08 — Micro-Interactions
**Goal:** Build scroll-triggered reveals that communicate hierarchy, preserve reading flow, remain accessible without motion, and perform reliably across devices and navigation states.

---

## Why This Matters (Senior Perspective)

Scroll reveals are a way to direct attention as a visitor moves through a page: a project image can enter softly, a case-study heading can establish a section, and a group of cards can appear in a deliberate sequence. On a portfolio or agency website, these transitions can make a long page feel authored rather than assembled. But the same technique can damage the experience when every element animates, content stays invisible until JavaScript succeeds, or mobile users are forced to wait for decorative motion before reading.

A beginner often adds an animation class to every section and checks whether it looks impressive on their own laptop. A senior developer decides which content genuinely benefits from staging, defines a no-JavaScript and reduced-motion baseline, then tests the page with keyboard navigation, slow devices, deep links, browser back/forward navigation, and content that arrives asynchronously. That difference matters in production: a visitor may land halfway down a case study, use a screen reader, have reduced motion enabled, or scroll quickly past an element before an observer callback runs. If the reveal system depends on a fragile initial viewport assumption, important content can remain hidden.

The practical rule is that **content must be available before decoration**. Use CSS for the visual transition and `IntersectionObserver` to detect when a target enters the viewport. Avoid scroll handlers that repeatedly measure every element, avoid animating layout-heavy properties, and do not use scroll reveal as a substitute for information architecture. For creative portfolio work, motion should reinforce the story: reveal a meaningful project group, emphasize a change in section, or guide attention to a key visual. It should not make every paragraph compete for attention or slow down visitors who came to inspect the work.

---

## Core Concepts

### 1. Start with Visible Content and Progressive Enhancement

The default HTML must be readable if JavaScript fails, is blocked, or runs late. Only opt elements into hidden-before-reveal styling after the enhancement script is ready.

**Semantic markup:**

```html
<section class="case-study" aria-labelledby="case-study-title">
  <h2 id="case-study-title">A faster checkout experience</h2>
  <p>We reduced friction across the purchase flow.</p>
  <figure class="case-study__visual">
    <img src="/images/checkout.webp" alt="Checkout interface on a mobile device">
    <figcaption>New checkout flow across mobile breakpoints.</figcaption>
  </figure>
</section>
```

**Correct baseline:**

```css
/* Content is visible by default. */
.reveal {
  opacity: 1;
  transform: none;
}

/* Applied only after JS explicitly enables the enhancement. */
.js-reveal .reveal[data-reveal-state="pending"] {
  opacity: 0;
  transform: translateY(1.25rem);
}
```

**Naive approach:**

```css
/* Wrong: content can remain invisible forever if the observer never runs. */
.reveal {
  opacity: 0;
}
```

The correct approach keeps the document usable and lets JavaScript opt in only when it has initialized successfully.

**Gotcha:** Do not add the root enhancement class in the document head before you know the reveal system can initialize. If your app uses server rendering, ensure hydration failures cannot leave essential content hidden.

### 2. Use IntersectionObserver Instead of Continuous Scroll Measurements

`IntersectionObserver` lets the browser notify your code when a target crosses a visibility threshold. It is usually a better fit than manually measuring every target on every `scroll` event.

```html
<section class="work-grid" aria-label="Selected projects">
  <article class="project-card reveal" data-reveal>
    <h3>Atlas Commerce</h3>
    <p>Commerce experience and design system.</p>
  </article>
  <article class="project-card reveal" data-reveal>
    <h3>Northstar Analytics</h3>
    <p>Data-heavy workflow redesigned for clarity.</p>
  </article>
</section>
```

```js
const revealObserver = new IntersectionObserver((entries, observer) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;

    entry.target.dataset.revealState = "visible";
    observer.unobserve(entry.target);
  }
}, {
  root: null,
  rootMargin: "0px 0px -8% 0px",
  threshold: 0.12,
});

document.querySelectorAll("[data-reveal]").forEach((element) => {
  element.dataset.revealState = "pending";
  revealObserver.observe(element);
});
```

**Why:** The browser manages intersection tracking and your callback runs only when visibility changes meaningfully. Unobserving one-time reveals avoids needless work after the animation has completed.

**Naive approach:**

```js
// Wrong: repeated layout reads for every element on every scroll tick.
window.addEventListener("scroll", () => {
  document.querySelectorAll("[data-reveal]").forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight) element.classList.add("visible");
  });
});
```

**Gotcha:** `IntersectionObserver` callbacks are asynchronous. Do not assume an element is already revealed on the same line that calls `observe()`.

### 3. Animate Transform and Opacity First

Transform and opacity are generally the safest starting point for entrance motion because they avoid repeatedly changing document layout. They are not guaranteed to be free, but they are usually cheaper than animating dimensions or positional layout properties.

```css
.reveal {
  opacity: 1;
  transform: none;
}

.js-reveal .reveal[data-reveal-state="pending"] {
  opacity: 0;
  transform: translate3d(0, 1.5rem, 0);
}

.js-reveal .reveal[data-reveal-state="visible"] {
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    opacity 600ms cubic-bezier(0.2, 0.7, 0.2, 1),
    transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

**Naive approach:**

```css
/* Wrong for a repeated entrance animation: these properties can trigger layout. */
.reveal {
  height: 0;
  margin-top: 4rem;
  transition: height 600ms, margin-top 600ms;
}
```

**Correct approach:** Keep the element's layout footprint stable and animate its visual presentation.

**Gotcha:** Large blurred shadows, filters, and oversized transformed elements can still be expensive. Profile the actual page on a mid-range phone rather than assuming every transform is free.

### 4. Define a Motion Token System

A consistent duration and easing scale makes reveals feel like part of the same design language. Tokens also make global adjustments and reduced-motion overrides easier.

```css
:root {
  --reveal-duration: 600ms;
  --reveal-distance: 1.5rem;
  --reveal-ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  --reveal-stagger-step: 90ms;
}

.js-reveal [data-reveal-state="pending"] {
  opacity: 0;
  transform: translateY(var(--reveal-distance));
}

.js-reveal [data-reveal-state="visible"] {
  opacity: 1;
  transform: translateY(0);
  transition:
    opacity var(--reveal-duration) var(--reveal-ease),
    transform var(--reveal-duration) var(--reveal-ease);
}
```

**Naive approach:** Give each component unrelated hard-coded durations and easing values.

**Correct approach:** Define a small system: short for controls, medium for content reveals, and longer only for large editorial transitions.

**Gotcha:** CSS custom properties can be overridden by nested scopes. Inspect computed styles if one section behaves differently from the rest.

### 5. Make One-Time and Repeatable Reveals Explicit

Most content reveals should happen once. Replaying the entrance every time a user scrolls a few pixels can become distracting and can repeatedly hide content they have already read.

```js
function createRevealObserver({ repeat = false } = {}) {
  return new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      entry.target.dataset.revealState = "visible";
      if (!repeat) observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
}
```

**Naive approach:** Toggle the same hidden class on every enter/leave event without defining whether replay is intentional.

**Correct approach:** Use one-time reveals for paragraphs, project cards, and case-study sections. Use repeatable behavior only for a deliberate interaction whose state is expected to follow viewport visibility.

**Gotcha:** If a repeatable reveal hides content when it leaves the viewport, it can cause accessibility and orientation problems. Prefer leaving content visible after its first reveal.

### 6. Stagger Groups Without Creating a Slow Queue

A stagger creates a sequence across related items, such as a row of project cards. Keep the delay short and cap it so a long list does not make the final item wait excessively.

```html
<ul class="project-grid" data-reveal-group>
  <li class="project-card reveal" data-reveal>Project one</li>
  <li class="project-card reveal" data-reveal>Project two</li>
  <li class="project-card reveal" data-reveal>Project three</li>
</ul>
```

```js
document.querySelectorAll("[data-reveal-group]").forEach((group) => {
  [...group.querySelectorAll("[data-reveal]")].forEach((item, index) => {
    const delay = Math.min(index * 70, 280);
    item.style.setProperty("--reveal-delay", `${delay}ms`);
  });
});
```

```css
.js-reveal [data-reveal-state="visible"] {
  transition-delay: var(--reveal-delay, 0ms);
}
```

**Naive approach:** Apply `index * 250ms` to every card. A grid of twelve items would delay the last one by nearly three seconds.

**Correct approach:** Use a modest step and a maximum delay, or stagger by row for larger grids.

**Gotcha:** A DOM-order stagger may not match visual order in a responsive grid. Test the mobile layout, where the number of columns changes.

### 7. Use `rootMargin` to Tune the Trigger Point

The observer's `rootMargin` changes the effective viewport used to calculate intersections. It can make a reveal begin slightly before an element is fully visible or wait until it is further into view.

```js
const observer = new IntersectionObserver(onEntries, {
  root: null,
  rootMargin: "0px 0px -10% 0px",
  threshold: 0.08,
});
```

A negative bottom margin shrinks the effective root near the bottom edge; a positive margin expands it and can trigger earlier.

**Naive approach:** Use a large positive margin everywhere so every element appears long before the visitor reaches it.

**Correct approach:** Tune the trigger for the intended reading pace and element size. Use earlier triggers for large images that need time to settle and later triggers for small decorative details.

**Gotcha:** `threshold` is the proportion of the target intersecting the root, not a pixel distance. Very tall sections may behave differently from small cards at the same threshold.

### 8. Respect Reduced Motion Without Hiding Content

When the visitor requests reduced motion, remove movement and delays while keeping the content visible and the hierarchy intact.

```css
@media (prefers-reduced-motion: reduce) {
  .js-reveal [data-reveal-state="pending"],
  .js-reveal [data-reveal-state="visible"] {
    opacity: 1;
    transform: none;
    transition: none;
    animation: none;
  }
}
```

```js
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function applyMotionPreference() {
  document.documentElement.classList.toggle("reduce-motion", reducedMotion.matches);
}

applyMotionPreference();
reducedMotion.addEventListener?.("change", applyMotionPreference);
```

**Naive approach:** Disable the animation but leave pending elements at `opacity: 0`.

**Correct approach:** Reduced motion must override the hidden state itself, not only the transition duration.

**Gotcha:** The preference can change while the page is open. For long-lived applications, listen for changes and clean up the listener when the app unmounts.

### 9. Account for Deep Links, Back Navigation, and Restored Scroll Positions

A visitor may load a URL with a fragment, return to a page with a restored scroll position, or refresh while halfway down a case study. Do not assume every reveal target starts below the fold.

```js
function revealAlreadyVisibleTargets(observer) {
  const viewportHeight = window.innerHeight;

  document.querySelectorAll("[data-reveal]").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const alreadyInView = rect.bottom > 0 && rect.top < viewportHeight;

    if (alreadyInView) {
      element.dataset.revealState = "visible";
      observer.unobserve(element);
    }
  });
}
```

**Naive approach:** Hide all targets, then wait for the first observer callback without accounting for a deep-linked or restored viewport.

**Correct approach:** Initialize the observer promptly, reveal targets already in the viewport, and ensure fragment destinations are not hidden from the user.

**Gotcha:** Browser scroll restoration and framework hydration can race with reveal initialization. Keep content visible by default until the enhancement is ready, and test back/forward navigation.

### 10. Avoid Layout Shift and Scroll Jank

Reveal effects should change the visual appearance of an element without changing the layout around it. Use reserved image ratios, stable card heights where appropriate, and transforms rather than animating margins.

```html
<figure class="project-visual reveal" data-reveal>
  <img
    src="/images/project-dashboard.webp"
    width="1600"
    height="1000"
    alt="Analytics dashboard with a dark interface"
  >
</figure>
```

```css
.project-visual {
  aspect-ratio: 8 / 5;
  overflow: clip;
}

.project-visual img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

**Naive approach:** Let the image load without dimensions and animate its container's height on reveal.

**Correct approach:** Reserve geometry before the image arrives and animate opacity/transform only.

**Gotcha:** `overflow: clip` is not supported identically in every legacy browser. Use `overflow: hidden` if your browser support policy requires a broader fallback.

### 11. Handle Dynamically Inserted Content

A page may add cards after a filter change, search response, or infinite-scroll request. An observer attached only during initial page load will not automatically watch newly inserted nodes.

```js
function observeRevealTargets(root, observer) {
  root.querySelectorAll("[data-reveal]:not([data-reveal-state])").forEach((element) => {
    element.dataset.revealState = "pending";
    observer.observe(element);
  });
}
```

**Naive approach:** Recreate every observer after each render and observe every existing element again.

**Correct approach:** Reuse one observer for the same configuration and register only new targets. Unobserve targets when they are removed if the framework lifecycle does not already handle it.

**Gotcha:** If a framework reuses DOM nodes for different list items, reset reveal state when the item identity changes; otherwise new content may inherit an old item's visible state.

### 12. Avoid Hiding Focused or Interactive Content

Opacity does not remove an element from keyboard navigation or the accessibility tree. A focusable button can be keyboard-focused while visually transparent, which creates a confusing experience.

```css
/* Keep interactive reveal regions visible when focus enters them. */
.js-reveal [data-reveal-state="pending"]:focus-within {
  opacity: 1;
  transform: none;
  transition: none;
}
```

**Naive approach:** Make an entire navigation menu invisible with opacity while its links remain tabbable.

**Correct approach:** Avoid scroll-reveal hiding for navigation and controls that can receive focus before they enter the viewport. Use focus-aware overrides for appropriate content regions.

**Gotcha:** `:focus-within` helps visually reveal a focused region, but it does not replace sensible tab order or correct semantic structure.

### 13. Use `content-visibility` Carefully Alongside Reveals

`content-visibility: auto` can let the browser skip rendering work for off-screen content, but it is a separate optimization from a reveal animation. Combining both without testing can make layout and intersection behavior harder to reason about.

```css
.case-study-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 48rem;
}
```

**Naive approach:** Add `content-visibility: auto`, `display: none`, and an opacity reveal to every section without checking measurement behavior.

**Correct approach:** Use `content-visibility` only for substantial off-screen sections, reserve an estimated intrinsic size, and test observer callbacks and scroll position on target browsers.

**Gotcha:** The intrinsic-size estimate affects scrollbar geometry. Large inaccuracies can cause scroll jumps as real content is rendered.

### 14. Integrate Reveals into a Real Creative Portfolio

Use a small set of purposeful reveal roles: a section heading, a hero visual, and a project-card group. Keep navigation, body copy, and critical actions readable without waiting for animation.

```html
<main>
  <section class="work-intro" aria-labelledby="work-title">
    <p class="eyebrow">Selected work</p>
    <h1 id="work-title" data-reveal>Interfaces built for momentum.</h1>
    <p>Digital products, brand systems, and interactive experiences.</p>
  </section>

  <section class="work-grid" aria-label="Selected projects" data-reveal-group>
    <article class="project-card reveal" data-reveal>
      <img src="/images/atlas.webp" width="1200" height="900" alt="Atlas Commerce product page">
      <h2>Atlas Commerce</h2>
    </article>
    <article class="project-card reveal" data-reveal>
      <img src="/images/northstar.webp" width="1200" height="900" alt="Northstar analytics interface">
      <h2>Northstar Analytics</h2>
    </article>
  </section>
</main>
```

**Naive approach:** Animate every child, icon, paragraph, and image independently so the entire page is constantly entering.

**Correct approach:** Reveal semantic groups and use hierarchy to decide where motion adds meaning. Keep the content's normal reading order unchanged.

**Gotcha:** If a project image contains important text, provide that information in actual HTML rather than relying on the image or the animation to communicate it.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: One-Time Reveal Observer

**What it does:** Reveals an element when it enters the viewport and then stops observing it.

**When to use it:** Editorial sections, project cards, and case-study images that should animate once during the visit.

```js
export function observeOneTimeReveals(root = document) {
  const targets = [...root.querySelectorAll("[data-reveal]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    targets.forEach((target) => {
      target.dataset.revealState = "visible";
    });
    return () => {};
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.revealState = "visible";
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  targets.forEach((target) => {
    target.dataset.revealState = "pending";
    observer.observe(target);
  });

  return () => observer.disconnect();
}
```

This helper includes a reduced-motion and unsupported-browser fallback. Call the returned cleanup function when the view is removed or replaced.

### Pattern 2: Staggered Grid with a Delay Cap

**What it does:** Adds a short, capped delay to a group of related reveal items.

**When to use it:** A portfolio grid with two to six cards visible in a group, where the sequence supports visual hierarchy.

```js
export function setStaggerDelays(group, { step = 70, cap = 280 } = {}) {
  const items = group.querySelectorAll("[data-reveal]");
  items.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${Math.min(index * step, cap)}ms`);
  });
}
```

Use smaller values on dense mobile layouts. Do not use a long stagger for content that users need to scan quickly.

### Pattern 3: Reveal Images Without Animating Their Layout

**What it does:** Fades and lifts a media frame while the image's aspect ratio reserves space.

**When to use it:** Large project thumbnails or editorial images that load after the surrounding copy.

```css
.project-media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #171717;
}

.project-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.js-reveal .project-media[data-reveal-state="pending"] {
  opacity: 0;
  transform: translateY(1rem);
}

.js-reveal .project-media[data-reveal-state="visible"] {
  opacity: 1;
  transform: none;
  transition: opacity 550ms ease, transform 550ms ease;
}
```

Do not animate the frame's height to create a reveal. If the image is a link, ensure its focus state is visible even before the visual transition finishes.

### Pattern 4: Reduced-Motion and No-Observer Fallback

**What it does:** Makes all content visible immediately when motion is reduced or the browser lacks `IntersectionObserver`.

**When to use it:** Any reusable reveal utility that must work across a broad range of user preferences and browser capabilities.

```js
export function revealFallback(targets) {
  const shouldSkipMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window);

  if (!shouldSkipMotion) return false;

  targets.forEach((target) => {
    target.dataset.revealState = "visible";
  });

  return true;
}
```

Treat fallback behavior as a first-class path, not a degraded afterthought. Avoid feature detection that leaves the document in its hidden state.

### Pattern 5: Dynamically Added Cards

**What it does:** Registers only new reveal targets after a filter or asynchronous content update.

**When to use it:** A portfolio with client-side category filters or a “load more projects” action.

```js
export function createRevealRegistry() {
  if (!("IntersectionObserver" in window)) {
    return {
      observe(root) {
        root.querySelectorAll("[data-reveal]").forEach((item) => {
          item.dataset.revealState = "visible";
        });
      },
      disconnect() {},
    };
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.revealState = "visible";
      currentObserver.unobserve(entry.target);
    }
  }, { threshold: 0.1 });

  return {
    observe(root = document) {
      root.querySelectorAll("[data-reveal]:not([data-reveal-state])").forEach((item) => {
        item.dataset.revealState = "pending";
        observer.observe(item);
      });
    },
    disconnect() {
      observer.disconnect();
    },
  };
}
```

Call `registry.observe(container)` after inserting new items. If you reuse nodes for different records, clear their old reveal state before registering them again.

### Pattern 6: React Hook with Cleanup

**What it does:** Observes elements inside a component and cleans up when the component unmounts.

**When to use it:** React and Next.js client components that need a local reveal system without a global observer singleton.

```jsx
"use client";

import { useEffect, useRef } from "react";

export function RevealSection({ children, className = "" }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const targets = root.querySelectorAll("[data-reveal]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      targets.forEach((target) => {
        target.dataset.revealState = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.dataset.revealState = "visible";
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    targets.forEach((target) => {
      target.dataset.revealState = "pending";
      observer.observe(target);
    });

    return () => observer.disconnect();
  }, []);

  return <section ref={sectionRef} className={className}>{children}</section>;
}
```

The CSS baseline must still keep content visible before enhancement. If the child list changes after mount, add a deliberate re-registration strategy instead of assuming the initial effect sees future elements.

### Pattern 7: Reveal a Section Heading and Its Supporting Content

**What it does:** Uses a clear sequence to establish the section title before revealing supporting copy or visuals.

**When to use it:** Long-form agency pages, case studies, and portfolio sections with a strong editorial rhythm.

```html
<section class="case-study-intro" aria-labelledby="case-study-heading">
  <p class="eyebrow" data-reveal>Case study / 01</p>
  <h2 id="case-study-heading" data-reveal>From complexity to clarity</h2>
  <p data-reveal>We reorganized the core workflow around the user's primary task.</p>
</section>
```

Apply a short stagger, but preserve natural reading order and avoid delaying the actual text for several seconds. Do not use the sequence to conceal missing or unfinished content.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Setting every reveal element to `opacity: 0` by default | Motion is treated as a required rendering step | Keep content visible by default; hide only after JavaScript enhancement initializes |
| Using a `scroll` listener that measures every target on every event | The developer assumes manual checks are more direct | Use `IntersectionObserver` with a meaningful threshold and root margin |
| Animating height or margins to create the entrance | The visual movement is confused with layout movement | Animate `transform` and `opacity`; reserve final layout dimensions |
| Replaying every reveal on every viewport entry | Repeat behavior was added without a product reason | Unobserve after first reveal unless repeat behavior is an explicit requirement |
| Applying a 250ms stagger to every card | The sequence is tuned for one item, not the whole group | Use a short step and cap the maximum delay |
| Hiding focusable links while they remain tabbable | Opacity is mistaken for removing an element from navigation | Avoid hiding interactive navigation; add focus-aware visibility where appropriate |
| Ignoring `prefers-reduced-motion` | Animation is considered purely visual decoration | Override opacity, transform, transition, and delay so content is immediately visible |
| Assuming every target starts below the fold | Only a fresh top-of-page load was tested | Reveal targets already in the viewport and test restored scroll positions |
| Creating a new observer for each item | The observer API is misunderstood as one-instance-per-target | Reuse one observer for targets sharing the same options |
| Never disconnecting observers in component code | Cleanup is omitted from the lifecycle design | Return a cleanup function or call `disconnect()` on unmount |
| Registering only initial DOM nodes | Dynamic filters and async content were not considered | Observe newly inserted targets through a shared registry |
| Using large blur filters on every reveal | Visual polish is prioritized over rendering cost | Prefer opacity/transform and profile expensive filters on mobile |
| Allowing images to change layout when loaded | Intrinsic dimensions were not reserved | Add `width`/`height` or `aspect-ratio` to media frames |
| Hiding fragment destinations during initial load | Deep-link navigation was not tested | Keep content visible until enhancement is ready; reveal in-viewport targets promptly |
| Using the same trigger threshold for every target size | A single configuration is assumed to fit all geometry | Tune thresholds and root margins for the element and composition |
| Combining `content-visibility` and hidden reveal states without testing | Two independent rendering optimizations interact | Test intrinsic sizing, intersection timing, and scroll restoration before combining them |
| Making every paragraph animate independently | Motion is used everywhere rather than hierarchically | Reveal meaningful groups and preserve calm reading sections |

**Before → After**

```css
/* Before: layout changes and content is hidden without a JS fallback. */
.project-card {
  opacity: 0;
  height: 0;
  margin-top: 3rem;
  transition: height 500ms, margin-top 500ms;
}

/* After: content has stable geometry and is visible by default. */
.project-card {
  opacity: 1;
  transform: none;
}

.js-reveal .project-card[data-reveal-state="pending"] {
  opacity: 0;
  transform: translateY(1rem);
}

.js-reveal .project-card[data-reveal-state="visible"] {
  opacity: 1;
  transform: none;
  transition: opacity 500ms ease, transform 500ms ease;
}
```

---

## Mental Models

1. **Content first, choreography second** — the page should still communicate when scripts or animations fail.
2. **Reveal by meaning, not by element count** — animate sections and groups that benefit from a clear entrance; do not make every node perform.
3. **Visibility is a contract** — never leave essential content hidden because an observer failed, a route changed, or motion was reduced.
4. **The browser should do the measuring** — prefer intersection observation over continuous custom geometry checks.
5. **Layout is structure; transform is presentation** — reserve space first, then animate the visual layer.
6. **A stagger is a budget** — the total delay matters more than the delay assigned to one item.
7. **Focus beats choreography** — keyboard and assistive-technology users must never encounter invisible interactive content.
8. **One-time means one-time** — once the visitor has seen the content, do not repeatedly hide it unless replay is a deliberate interaction.
9. **Fallbacks are part of the design** — reduced motion, unsupported APIs, and JavaScript failure should produce a complete experience.
10. **Test where users land, not just where the page starts** — deep links and restored scroll positions are normal browser behavior.

---

## Quick Reference

| Need | Recommended approach |
|---|---|
| Detect viewport entry | `IntersectionObserver` |
| One-time reveal | Set visible state, then `unobserve(target)` |
| Stop observing a whole component | `observer.disconnect()` |
| Start reveal motion | Transition `opacity` and `transform` |
| Avoid layout shift | Reserve dimensions with `aspect-ratio`, `width`, and `height` |
| Trigger a little earlier | Positive `rootMargin` expands the root |
| Trigger later near bottom | Negative bottom `rootMargin` shrinks the root |
| Avoid too many stagger delays | `Math.min(index * step, cap)` |
| Support reduced motion | `@media (prefers-reduced-motion: reduce)` |
| Support missing API | Reveal all targets immediately |
| Support dynamic content | Register new targets after insertion |
| Support React cleanup | Disconnect observer in `useEffect` cleanup |
| Avoid invisible focus targets | Do not hide navigation; use `:focus-within` fallback for content regions |
| Debug hidden content | Inspect `data-reveal-state`, computed opacity, transform, and root enhancement class |
| Debug layout shifts | Check image dimensions and changing height/margin |
| Debug mobile jank | Remove expensive filters, reduce simultaneous animation, profile a real device |
| Deep-link safety | Reveal targets already in viewport and preserve fragment visibility |
| Large off-screen sections | Evaluate `content-visibility` separately and reserve intrinsic size |
| Keep screen readers informed | Keep meaningful text in semantic HTML; do not rely on animation |
| Keep code maintainable | Share one observer for a common configuration |

---

## Build Challenge

### Build: Editorial Portfolio Scroll-Reveal System

Build a responsive creative portfolio page with an intro, a selected-work grid, and two case-study sections. Use purposeful reveals to establish hierarchy without making the page dependent on animation.

**Requirements**

1. Use semantic HTML for headings, sections, articles, figures, images, and captions.
2. Keep all content visible when JavaScript is disabled.
3. Initialize reveals only after the enhancement script is ready.
4. Use one `IntersectionObserver` for targets with the same configuration.
5. Animate only `opacity` and `transform` for the default reveal.
6. Add a short stagger to the project grid and cap the total delay.
7. Use intrinsic image dimensions or `aspect-ratio` to prevent layout shift.
8. Make reduced-motion and unsupported-observer paths show all content immediately.
9. Test a deep link to a case-study heading and a restored mid-page scroll position.
10. Add a dynamic “load more projects” action and register newly added cards.
11. Ensure keyboard focus never lands on visually hidden interactive content.
12. Disconnect observers and remove any listeners during teardown.
13. Test with a slow mobile CPU and check that the reveal system does not delay reading.
14. Confirm that every image has appropriate alternative text and every section has a meaningful heading.

**Acceptance criteria**

- The page remains readable with JavaScript disabled.
- No target can remain hidden indefinitely.
- Reveals happen once unless a repeat behavior is explicitly required.
- Reduced-motion mode shows content without movement or delay.
- No fake progress or long stagger blocks content.
- The layout does not jump when images load or reveals run.
- Dynamic cards receive the same reveal behavior as initial cards.
- Deep links and browser back/forward navigation remain reliable.
- Keyboard and screen-reader users can access content in natural document order.
- Observer cleanup occurs when the page or component is removed.

**Review questions**

1. Why should content be visible by default?
2. When is `IntersectionObserver` preferable to a `scroll` event listener?
3. What do `threshold` and `rootMargin` control?
4. Why are transform and opacity good starting properties for reveal motion?
5. Why should a stagger have a maximum delay?
6. How can opacity-hidden content still interfere with keyboard navigation?
7. What changes when the visitor enables reduced motion?
8. How do you handle targets inserted after initial page load?
9. Why must deep links and restored scroll positions be tested?
10. What is the difference between unobserving one target and disconnecting an observer?
11. When might `content-visibility` complicate reveal behavior?
12. How would you decide whether an element deserves a reveal at all?
