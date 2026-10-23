# Lenis Setup — Production Skill

## Why This Matters

Smooth scrolling can make a site feel cohesive, but a careless implementation can break native expectations, interfere with keyboard navigation, create a mismatch between scroll position and animation timing, or make a page feel sluggish on touch devices. Production failures often come from initializing the scroll controller more than once, forgetting to stop its animation frame loop, combining multiple smooth-scroll libraries, or applying scroll effects without respecting reduced-motion preferences.

Lenis is a smooth-scrolling library that coordinates scroll input and visual interpolation. It should enhance scrolling, not replace the browser's navigation model or hide content from assistive technology. This skill covers setup, lifecycle, framework integration, anchor links, GSAP synchronization, reduced motion, performance, and debugging. Always verify API details against the version installed in the project; Lenis APIs and integration guidance can evolve.

### 1. Mental Models

1. **Native scroll remains the source of truth.** Lenis smooths how scrolling progresses; it should not make page content unreachable or remove normal document semantics.
2. **One scroll owner per page.** Do not run Lenis and another smooth-scroll engine on the same scrolling surface unless the integration explicitly supports it.
3. **The animation frame loop has an owner.** If your app starts a loop, it must stop or be disposed when the owning page or component is removed.
4. **Scroll position and animation progress are related but not identical.** Scroll-driven effects need a reliable update path and must not assume that a wheel event immediately equals the final scroll position.
5. **Anchors remain navigation.** A link to `#section` should still be a real link, work without JavaScript, and respect focus and URL behavior.
6. **Reduced motion changes interpolation.** When users request reduced motion, avoid long easing and unnecessary smooth travel while preserving access to destinations.
7. **Performance is end-to-end.** A smooth scroll library cannot compensate for heavy scroll handlers, expensive layout reads, oversized images, or animations that trigger repeated paint.
8. **Cleanup is part of correctness.** Event listeners, RAF loops, observers, and third-party integrations must have a clear teardown path.

### 2. Install and Verify the Package

Install Lenis using the package manager used by the repository. Review the package version and its official README before copying configuration from a different project.

```bash
npm install lenis
```

A typical module import is:

```js
import Lenis from "lenis";

const lenis = new Lenis();
```

Current Lenis versions commonly use the `lenis` package name. Older examples may use different packages, APIs, or CSS class conventions. Do not install multiple similarly named packages to resolve an import mismatch. Inspect `package.json`, the lockfile, and the official documentation for the version actually installed.

**Gotcha:** If an old tutorial uses a deprecated constructor option or a different import path, copying it verbatim may compile incorrectly or silently behave differently. Confirm the installed version first.

### 3. Initialize a Single Lenis Instance

Create one instance for the intended scrolling surface. For a standard document page, a single app-level instance is usually the right starting point. Avoid creating it inside a component that rerenders frequently unless the lifecycle is explicitly controlled.

```js
import Lenis from "lenis";

const lenis = new Lenis({
  smoothWheel: true,
  lerp: 0.1
});

lenis.on("scroll", event => {
  console.log("Scroll position:", event.scroll);
});
```

Configuration options can change between releases, so verify options such as `smoothWheel`, `lerp`, and duration behavior in the installed version's documentation. Start with defaults, then tune only when you can explain the desired behavior. Keep scroll listeners lightweight and avoid reading or writing many layout properties inside them.

### 4. Drive Lenis with `requestAnimationFrame`

In a basic manual setup, call `lenis.raf(time)` from a `requestAnimationFrame` loop. The timestamp should be passed through. Store the frame ID so the loop can be canceled.

```js
let rafId = 0;

function frame(time) {
  lenis.raf(time);
  rafId = requestAnimationFrame(frame);
}

rafId = requestAnimationFrame(frame);

function stopLenis() {
  cancelAnimationFrame(rafId);
  lenis.destroy();
}
```

Use one animation loop for one instance. Do not create a new recursive loop each time a route changes. In apps with a central animation scheduler, integrate Lenis into that scheduler instead of starting a duplicate loop.

**Gotcha:** If `requestAnimationFrame` is started but never canceled, route changes and hot reloads can leave duplicate loops that make scrolling accelerate, jitter, or consume resources.

### 5. Use the Recommended Integration for Your Framework

Framework integrations differ. In React, initialize Lenis in an effect and clean it up. In Next.js or another server-rendered framework, keep browser-dependent setup inside a client component or client-side effect. Do not instantiate browser-only behavior during server rendering.

```jsx
"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis();
    let rafId = 0;

    function frame(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return children;
}
```

This is a manual-loop pattern. If the installed Lenis version recommends a different integration or an official React wrapper, follow the current documented approach. Avoid mixing a wrapper-owned RAF loop with your own loop.

### 6. Prefer the Supported Auto-Raf Option When Appropriate

Some Lenis versions provide an `autoRaf` option that manages its own animation frame loop. If available in your installed version, it can simplify setup by removing the need for a custom loop. Do not combine `autoRaf: true` with an additional manual `lenis.raf()` loop.

```js
import Lenis from "lenis";

const lenis = new Lenis({
  autoRaf: true
});

// Later, when the owner is removed:
lenis.destroy();
```

Verify `autoRaf` support and cleanup behavior against the installed version. If you use the manual-loop approach, keep the RAF cancellation and instance destruction together. Choose one approach and document the owner.

### 7. Integrate with GSAP ScrollTrigger

When GSAP ScrollTrigger needs to respond to Lenis-managed scroll updates, use the documented integration pattern for your versions. A common integration updates ScrollTrigger on Lenis scroll and connects Lenis to GSAP's ticker. Exact APIs can vary, so compare against current official documentation before shipping.

```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis();

lenis.on("scroll", ScrollTrigger.update);

const tick = time => {
  lenis.raf(time * 1000);
};

gsap.ticker.add(tick);
gsap.ticker.lagSmoothing(0);

// Cleanup:
function destroyScroll() {
  gsap.ticker.remove(tick);
  lenis.destroy();
}
```

GSAP ticker time is commonly expressed in seconds while Lenis `raf` expects milliseconds, so the conversion matters in this integration pattern. Verify the current official integration guidance for the versions in use. If the ticker and a separate `requestAnimationFrame` loop both drive Lenis, the page may jitter or progress at the wrong speed.

**Gotcha:** `gsap.ticker.lagSmoothing(0)` changes global GSAP ticker behavior. If the application depends on default lag smoothing elsewhere, consider the side effects and restore the prior configuration where appropriate.

### 8. Make Anchor Links Work Correctly

Keep anchor links as native links with valid IDs. Lenis can provide smooth navigation when integrated through its supported anchor-link behavior or `scrollTo` API, but the link should still identify a destination and be meaningful if JavaScript is unavailable.

```html
<nav aria-label="On this page">
  <a href="#features">Features</a>
  <a href="#pricing">Pricing</a>
</nav>

<main>
  <section id="features" tabindex="-1">
    <h2>Features</h2>
    <p>Feature information.</p>
  </section>
  <section id="pricing" tabindex="-1">
    <h2>Pricing</h2>
    <p>Pricing information.</p>
  </section>
</main>
```

If you intercept anchor clicks to call `lenis.scrollTo`, preserve modifier-key behavior, open-in-new-tab semantics, URL hash updates, and focus behavior. Avoid calling `preventDefault()` for every link. Respect fixed headers with an appropriate scroll offset or CSS `scroll-margin-top`.

```css
main section[id] {
  scroll-margin-top: 6rem;
}

main section[id]:focus {
  outline: none;
}

main section[id]:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
}
```

Only remove a default outline when a clear, visible focus treatment is supplied. Keyboard users should be able to navigate the page without relying on pointer scrolling.

### 9. Respect Reduced Motion Preferences

Smooth scrolling is movement over time. Use the user's `prefers-reduced-motion` preference to disable or reduce interpolation, and test the behavior at runtime. Verify the correct Lenis option for your installed version; some versions support disabling smooth wheel behavior or using an immediate scroll mode.

```js
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function createLenis() {
  return new Lenis({
    smoothWheel: !motionQuery.matches,
    lerp: motionQuery.matches ? 1 : 0.1
  });
}

let lenis = createLenis();

motionQuery.addEventListener("change", () => {
  lenis.destroy();
  lenis = createLenis();
});
```

This illustrates the policy rather than guaranteeing every option is valid in every version. For production, check the current Lenis API and ensure that recreating the instance also reconnects the RAF loop or ticker. If possible, use the library's documented way to change behavior without destroying the instance.

**Gotcha:** Disabling smooth scrolling at initial page load is not enough if the user changes their system preference while the page is open. Decide whether to listen for changes and verify the active instance actually adopts the new policy.

### 10. Preserve Keyboard and Assistive-Technology Navigation

Smooth scrolling should not delay or obscure focus changes. Ensure all content remains in normal document flow unless there is a strong, tested reason to do otherwise. Avoid replacing native scroll containers with inaccessible custom surfaces. When a control navigates to a section, make the destination and focus behavior understandable.

```js
function focusAnchorTarget(target) {
  if (!target) return;

  if (!target.hasAttribute("tabindex")) {
    target.setAttribute("tabindex", "-1");
  }

  target.focus({ preventScroll: true });
}
```

Use focus management only where it matches the navigation design. A normal in-page anchor can often rely on native browser behavior. If you use custom `scrollTo`, test whether the browser updates the URL hash and whether focus follows the destination as expected. Accessibility includes `:focus-visible`, meaningful link text, semantic landmarks, sufficient contrast, and ensuring that reduced-motion users can reach every destination.

### 11. Avoid Multiple Scroll Controllers

Do not combine Lenis, a custom wheel handler, CSS scroll snapping, and another smooth-scroll library on the same region without a documented reason. Multiple controllers can fight over wheel deltas, momentum, anchor behavior, and scroll position. Native CSS features such as `scroll-behavior: smooth` may also overlap with custom smooth scrolling for programmatic navigation.

```css
html {
  scroll-behavior: auto;
}

/* Use native CSS scroll behavior only if it is part of the chosen strategy. */
```

The CSS above is not a universal requirement; it illustrates that the scroll strategy should be explicit. If Lenis owns programmatic smoothing, avoid layering another smooth-scroll behavior on top of it unless the official integration documents how the two interact. Keep CSS scroll snap and custom interpolation separate until the combined behavior is tested.

### 12. Handle Nested Scroll Areas and Modals

A page may contain a modal, code panel, chat log, or menu with its own scrollable content. Decide whether Lenis should control the page, the nested region, or both through a documented configuration. Prevent background scrolling when a modal is open if the modal pattern requires it, and restore the prior behavior on close.

```css
.dialog-content {
  max-height: min(70vh, 42rem);
  overflow: auto;
  overscroll-behavior: contain;
}

.dialog-content:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}
```

Do not make nested scroll regions impossible to reach by touch or keyboard. Test wheel and trackpad input over the modal content, at its top and bottom edges, and after the modal closes. Ensure focus is contained by a true dialog pattern where needed; Lenis itself does not implement dialog semantics.

### 13. Keep Scroll Event Handlers Lightweight

Scroll events can fire frequently. Do not run expensive selectors, layout measurements, state updates, or synchronous network work on every scroll event. Prefer the library's event data, cached references, and small updates. If the UI only needs to react to section thresholds, consider an `IntersectionObserver` or ScrollTrigger rather than manually measuring every element continuously.

```js
const header = document.querySelector(".site-header");

lenis.on("scroll", event => {
  if (!header) return;

  header.classList.toggle("is-scrolled", event.scroll > 24);
});
```

If a handler writes styles and reads layout repeatedly, it can cause reflow and jank. Profile the page in DevTools Performance. Use `requestAnimationFrame` to coalesce work only when needed; do not add another frame loop for a task Lenis or GSAP already schedules.

### 14. Coordinate with Native CSS and Scroll-Driven Animations

Modern CSS offers `scroll-behavior`, scroll snapping, and scroll-driven animation features in some browsers. Lenis may still be useful for input interpolation, but adding more scroll behavior can create competing sources of timing. Choose a primary owner for each effect and use `@supports` for optional CSS features.

```css
@supports (animation-timeline: scroll()) {
  .reading-progress {
    animation: progress-grow linear both;
    animation-timeline: scroll(root block);
  }
}

@keyframes progress-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

Check browser support and caniuse before relying on scroll-driven CSS in a production-critical feature. Test whether the effect follows the actual scroll position in the presence of Lenis, and provide a static or JavaScript fallback when necessary. Do not assume a CSS animation timeline automatically synchronizes with every third-party virtual or interpolated scrolling strategy.

### 15. Clean Up Event Listeners and Instances

When the page or component that owns Lenis is removed, destroy the instance, cancel the manual RAF loop, remove ticker callbacks, and disconnect any observers. Keep setup and cleanup together so they cannot drift apart during maintenance.

```js
function mountSmoothScroll() {
  const lenis = new Lenis();
  let rafId = 0;

  function frame(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(frame);
  }

  rafId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(rafId);
    lenis.destroy();
  };
}

const unmountSmoothScroll = mountSmoothScroll();
// Call unmountSmoothScroll() when the owner is removed.
```

If you use `autoRaf`, do not also cancel a manual loop that was never created. If you integrate with GSAP ticker, remove exactly the callback you added. Hot module replacement can make duplicate instances especially visible in development, so confirm that cleanup runs during remounts.

### 16. React and Component Lifecycle

In React, keep the Lenis instance in an effect or a ref, not in the render path. Development Strict Mode can intentionally run setup and cleanup more than once to reveal lifecycle issues. The setup must be safe to repeat, and cleanup must stop the exact loop and destroy the exact instance it created.

```jsx
"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({ children }) {
  const instanceRef = useRef(null);

  useEffect(() => {
    const instance = new Lenis();
    instanceRef.current = instance;
    let rafId = 0;

    const frame = time => {
      instance.raf(time);
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      instance.destroy();
      if (instanceRef.current === instance) {
        instanceRef.current = null;
      }
    };
  }, []);

  return children;
}
```

For an application-wide provider, mount it once near the app shell. Avoid mounting a separate provider inside every route unless each route truly owns a distinct scrolling surface. If your version offers a documented React integration, compare its lifecycle behavior before building a custom wrapper.

### 17. Tune Scrolling for Content and Device

Avoid choosing parameters based only on a short hero section. Long-form articles, touch screens, trackpads, low-powered devices, and pages with sticky headers can all feel different. A very low interpolation value may feel delayed; a very high value may feel nearly immediate. Test realistic scroll distances and users' ability to stop precisely.

```js
const lenis = new Lenis({
  lerp: 0.1
});

// Tune the value by testing real interactions, not by copying a preset.
```

Keep the motion predictable and avoid excessive easing that makes the page continue moving long after the user expects it to stop. If the site relies on native momentum or platform-specific scrolling behavior, compare Lenis against the native experience before deciding to use it.

### 18. Debug with DevTools

When scrolling jitters, jumps, or stops responding, inspect the number of active loops, event listeners, computed styles, and any other scroll library in the project. Check the exact Lenis instance and confirm that it is receiving frame updates.

```js
function inspectScrollState(lenis, rafId) {
  const report = {
    scroll: lenis?.scroll,
    limit: lenis?.limit,
    progress: lenis?.progress,
    rafId,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    bodyOverflow: getComputedStyle(document.body).overflow,
    htmlScrollBehavior: getComputedStyle(document.documentElement).scrollBehavior
  };

  console.table(report);
  return report;
}
```

Debug sequence:
1. Verify the package version and constructor options.
2. Confirm there is only one Lenis instance for the page surface.
3. Confirm exactly one RAF loop or ticker integration is driving the instance.
4. Check that cleanup cancels the loop and calls `destroy()`.
5. Inspect `overflow`, `scroll-behavior`, sticky headers, and nested scroll containers.
6. Test anchor navigation with JavaScript enabled and disabled.
7. Test `prefers-reduced-motion: reduce` and change the preference while the page is open.
8. Record a Performance trace and look for long tasks, layout, paint, and duplicate callbacks.

Use DevTools Elements and Computed panels to inspect scroll-related CSS, the Performance panel to look for jank, and the Console to detect missing imports or repeated initialization. Test Safari, Firefox, and Chromium-based browsers on actual touch devices where possible. Check current browser support and caniuse for CSS features used alongside Lenis.

### 19. Performance and Compositor Considerations

Lenis changes the feel of scrolling but does not make every scroll-linked effect free. Prefer transforms and opacity for decorative effects, avoid animating layout-triggering properties such as `top`, `left`, `width`, and `height` on every scroll update, and measure before adding `will-change`. Compositor layers can improve some transitions, but excessive layers use memory and may hurt mobile performance.

```js
const progressBar = document.querySelector(".reading-progress");

lenis.on("scroll", event => {
  if (!progressBar) return;
  const progress = event.limit > 0 ? event.scroll / event.limit : 0;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
});
```

The transform example keeps the visual update lightweight. Ensure the bar has `transform-origin: left` in CSS, and avoid rebuilding the full page from the scroll callback. Profile the result on representative devices and confirm that the update does not force repeated layout reads.

### 20. Build a Failure-Oriented Test Matrix

A smooth-scroll implementation is not complete when the first scroll feels pleasant. Test teardown, nested areas, route changes, reduced motion, and anchor navigation. The important cases are often the ones that happen after a few interactions rather than on the initial page load.

```js
const scrollCases = [
  "route remount does not duplicate RAF",
  "anchor target remains reachable",
  "nested dialog scroll reaches its end",
  "reduced-motion change updates policy",
  "keyboard navigation reaches all content",
  "GSAP ticker and manual RAF are not both active",
  "touch scrolling remains responsive",
  "cleanup stops scroll callbacks"
];

console.table(scrollCases.map(test => ({ test, status: "to verify" })));
```

Run the same checks with reduced motion enabled, with JavaScript disabled for basic anchor behavior, and after hot reload or route remount. Confirm that scrolling does not trap focus, hide the active target behind a fixed header, or continue moving after the user expects it to stop.

**Gotcha:** If a scroll handler is registered during setup and the instance is recreated after a preference change, make sure the old listener is removed or the old instance is destroyed before attaching the new handler. Otherwise a stale callback may update detached UI.

## Named Patterns

### Pattern: Manual RAF Loop

**What it does:** Advances one Lenis instance using a single animation frame loop.

**When to use it:** Applications that need explicit control over the frame lifecycle.

```js
let rafId = 0;
function frame(time) {
  lenis.raf(time);
  rafId = requestAnimationFrame(frame);
}
rafId = requestAnimationFrame(frame);
```

### Pattern: Auto-Raf Instance

**What it does:** Lets Lenis manage its own animation frame loop when supported by the installed version.

**When to use it:** Small setups where an external ticker is unnecessary.

```js
const lenis = new Lenis({ autoRaf: true });
// Cleanup:
lenis.destroy();
```

### Pattern: React-Owned Lifecycle

**What it does:** Creates the instance after mount and destroys it during cleanup.

**When to use it:** React or Next.js client-side interfaces.

```jsx
useEffect(() => {
  const instance = new Lenis();
  return () => instance.destroy();
}, []);
```

Add the RAF or documented auto-Raf strategy appropriate to the installed version.

### Pattern: GSAP Ticker Integration

**What it does:** Connects Lenis frame updates to GSAP's ticker and forwards scroll events to ScrollTrigger.

**When to use it:** Sites that intentionally combine Lenis with GSAP scroll effects.

```js
lenis.on("scroll", ScrollTrigger.update);
const tick = time => lenis.raf(time * 1000);
gsap.ticker.add(tick);
// Cleanup:
gsap.ticker.remove(tick);
lenis.destroy();
```

Use one driver and verify current integration guidance.

### Pattern: Anchor Navigation with Focus

**What it does:** Preserves real links while making the target reachable and focus behavior understandable.

**When to use it:** Long landing pages and documentation sites.

```html
<a href="#details">Jump to details</a>
<section id="details" tabindex="-1">
  <h2>Details</h2>
</section>
```

### Pattern: Reduced-Motion Policy

**What it does:** Adapts smoothness when the user requests reduced motion.

**When to use it:** Any site that interpolates scroll movement over time.

```js
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const options = { smoothWheel: !reduceMotion };
```

Verify the option against the installed Lenis version.

### Pattern: Lightweight Scroll Progress

**What it does:** Updates a progress indicator using a transform rather than changing layout dimensions.

**When to use it:** Reading progress or scroll-linked status indicators.

```js
lenis.on("scroll", ({ scroll, limit }) => {
  progressBar.style.transform = `scaleX(${limit ? scroll / limit : 0})`;
});
```

### Pattern: Cleanup-First Mount Helper

**What it does:** Returns one teardown function that cancels the frame loop and destroys the instance.

**When to use it:** Plain JavaScript pages, route handlers, and test fixtures.

```js
function mount() {
  const instance = new Lenis();
  let id = 0;
  const frame = time => {
    instance.raf(time);
    id = requestAnimationFrame(frame);
  };
  id = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(id);
    instance.destroy();
  };
}
```

### Pattern: Native-First Fallback

**What it does:** Keeps anchor navigation and document scrolling useful if Lenis does not initialize.

**When to use it:** Marketing sites and content pages where navigation must remain robust.

```html
<nav aria-label="Sections">
  <a href="#story">Story</a>
  <a href="#contact">Contact</a>
</nav>
```

### Pattern: Single Scroll Owner

**What it does:** Documents which library or browser mechanism controls each scroll surface.

**When to use it:** Apps that combine Lenis, GSAP, scroll snap, and nested panels.

```js
const scrollOwner = "lenis"; // One declared owner for the document surface.
console.info("Document scroll owner:", scrollOwner);
```

**Gotcha:** A fixed header can obscure an anchor target even when the scroll animation reaches the correct coordinate. Verify the actual visible heading position, not just the final numeric scroll value.

## Common Mistakes and Fixes

| Mistake | Why it fails | Fix |
|---|---|---|
| Creating a new instance on every render | Multiple controllers compete for input | Initialize once in an owned lifecycle |
| Starting multiple RAF loops | Scroll updates may jitter or run too quickly | Use one loop or one supported auto-Raf path |
| Forgetting to cancel RAF | A stale loop survives route changes | Store the frame ID and cancel it on cleanup |
| Forgetting `destroy()` | Listeners and internal state can persist | Destroy the exact instance during teardown |
| Mixing Lenis and another smooth-scroll library | Input and scroll positions compete | Choose one owner for each scrolling surface |
| Using an outdated API from a tutorial | Options may be unsupported or changed | Check the installed version's documentation |
| Double-driving Lenis with GSAP and RAF | Timing becomes unstable | Use one documented ticker integration |
| Ignoring ticker time units | Scroll interpolation runs at the wrong rate | Convert GSAP seconds to Lenis milliseconds where required |
| Intercepting every anchor click | Modifier keys and normal link behavior break | Intercept only intended same-page navigation |
| Using meaningless anchor targets | Keyboard and URL navigation become unclear | Keep real `href` values and unique target IDs |
| Forgetting fixed-header offsets | Target headings hide beneath the header | Use `scroll-margin-top` or a supported offset |
| Ignoring reduced motion | Smooth travel may be uncomfortable | Adapt or disable interpolation when requested |
| Recreating without reconnecting the loop | New instance never receives frame updates | Rebuild the full lifecycle or update options in place |
| Running expensive work in scroll handlers | Causes jank and dropped frames | Keep callbacks lightweight and profile |
| Applying `will-change` to everything | Too many layers consume memory | Use only after profiling demonstrates value |
| Breaking nested scroll areas | Dialogs or code panels become hard to use | Test nested scrolling and boundary behavior |
| Ignoring keyboard focus | Destination may move without a clear focus path | Preserve native navigation or manage focus deliberately |
| Relying on a scroll library for dialog semantics | Focus can escape a modal | Implement the full dialog accessibility pattern |
| Assuming CSS scroll timelines always synchronize | Scroll-linked effects can drift | Test with the chosen scrolling owner and provide fallback |
| Failing to test hot reload | Development can accumulate duplicate instances | Verify cleanup during remount and hot reload |
| Using fixed pixel assumptions | Responsive layouts shift the destination | Measure or use CSS scroll margins |
| Animating `top` and `left` on every update | Can trigger layout and paint | Prefer transform-based decorative updates |
| Forgetting no-JavaScript behavior | Anchor navigation stops working | Preserve native links and document flow |
| Never testing touch devices | Trackpad behavior hides mobile issues | Test real touch and nested-scroll scenarios |
| Leaving scroll callbacks after teardown | Detached UI continues receiving updates | Remove listeners or destroy the instance and verify cleanup |

## Quick Reference

| Need | Starting point | Notes |
|---|---|---|
| Install | `npm install lenis` | Confirm the current package version |
| Import | `import Lenis from "lenis"` | Check the project's installed version |
| Create instance | `new Lenis(options)` | Use one owner per scroll surface |
| Manual update | `lenis.raf(time)` | Pass the RAF timestamp in milliseconds |
| Auto loop | `autoRaf: true` if supported | Do not also start a manual loop |
| Destroy | `lenis.destroy()` | Pair with loop/ticker cleanup |
| Scroll event | `lenis.on("scroll", callback)` | Keep callback work light |
| GSAP update | `lenis.on("scroll", ScrollTrigger.update)` | Follow current integration docs |
| GSAP ticker | `gsap.ticker.add(callback)` | Convert seconds to milliseconds when needed |
| Anchor target | Real `href="#id"` | Preserve browser navigation |
| Header offset | `scroll-margin-top` | Helps keep headings visible |
| Reduced motion | `prefers-reduced-motion` | Verify the correct Lenis option |
| CSS fallback | `@supports` | Use for optional CSS features |
| Debug geometry | `getBoundingClientRect()` | Inspect target and sticky header |
| Inspect style | `getComputedStyle()` | Check overflow and scroll behavior |
| Debug output | `console.table()` | Report active state compactly |
| Profile | DevTools Performance | Look for long tasks and jank |
| Browser matrix | Safari, Firefox, Chromium | Include real touch devices |
| Cleanup | Cancel RAF, remove ticker, destroy | Use only the cleanup for the chosen driver |

**Gotcha:** Browser DevTools emulation is useful, but it does not fully reproduce real trackpad momentum or all touch gesture behavior. Validate the final interaction on at least one physical touch device when the product supports mobile.

## Browser Support and Compatibility

Lenis is a JavaScript library, but its behavior interacts with browser scrolling, CSS overflow, sticky positioning, scroll timelines, and input device differences. Test Safari, Firefox, and Chromium-based browsers. Check current browser support and caniuse for optional CSS features such as `animation-timeline`, `overflow: clip`, and newer media-query APIs. Use `@supports` when a CSS enhancement needs a fallback, and keep native document navigation available.

```css
.anchor-section {
  scroll-margin-top: 5rem;
}

@supports (overflow: clip) {
  .decorative-scroll-frame {
    overflow: clip;
  }
}
```

The fallback should preserve content and focus visibility. Do not clip active focus rings, and do not assume that every browser has the same trackpad momentum, touch gesture, or scroll-timeline behavior. Test real devices and the browser versions supported by the product.

## Build Challenge: Accessible Smooth-Scroll Landing Page

Build a multi-section landing page with an in-page navigation bar, a fixed header, a reading-progress indicator, and an optional GSAP ScrollTrigger animation.

1. Install and document the Lenis version used by the project.
2. Create exactly one Lenis instance for the document scroll surface.
3. Choose either manual RAF, supported `autoRaf`, or a documented GSAP ticker integration—never drive the same instance through two loops.
4. If using a manual loop, pass the RAF timestamp to `lenis.raf()` and cancel the last frame ID during cleanup.
5. If using GSAP ticker, convert the ticker timestamp correctly and remove the exact callback during cleanup.
6. Keep navigation links as real `<a href="#...">` elements with unique target IDs.
7. Account for the fixed header using `scroll-margin-top` or a supported scroll offset.
8. Ensure keyboard navigation and focus visibility work without relying on pointer scrolling.
9. Adapt smoothness or disable interpolation for `prefers-reduced-motion: reduce`.
10. Keep scroll callbacks lightweight and update the progress indicator using `transform: scaleX(...)`.
11. Test nested scrollable content in a dialog or code panel.
12. Avoid competing scroll libraries and document which system owns the page's scroll behavior.
13. Provide a graceful native-scroll fallback if Lenis fails to initialize.
14. Test Safari, Firefox, and Chromium-based browsers on both desktop and touch devices.
15. Include a failure test where the user changes the reduced-motion preference while the page is open.
16. Include a failure test where a route unmounts and remounts; confirm no duplicate RAF loops remain.
17. Test anchor navigation with JavaScript disabled and verify that the destination remains reachable.
18. Profile a long page and confirm scroll handlers do not cause obvious jank or repeated layout work.
19. Check that the target heading is not hidden behind the fixed header and that focus remains visible.
20. Document any version-specific Lenis options and verify them against the installed package.

## Definition of Done

- [ ] One scroll controller owns the document surface.
- [ ] One RAF or ticker integration drives the Lenis instance.
- [ ] The selected driver and instance are cleaned up on unmount.
- [ ] Native anchor links remain meaningful and usable without JavaScript.
- [ ] Fixed-header offsets keep target content visible.
- [ ] Reduced-motion preferences change the scrolling policy.
- [ ] Keyboard focus remains visible and all content remains reachable.
- [ ] Nested scroll regions work on touch, trackpad, and keyboard.
- [ ] GSAP integration uses the correct time units and removes its callback.
- [ ] Performance checks show no obvious scroll-handler jank.
- [ ] Failure tests for preference changes and route remounts pass.
- [ ] The implementation is verified across the supported browser matrix.



## Scroll Restoration and Route Changes

Single-page applications often preserve the document while changing the route. Decide whether navigation should preserve the current scroll position, restore a prior position, or move to the top. Lenis should not accidentally override the router's scroll-restoration policy. Coordinate scroll restoration with the routing layer and avoid running multiple scroll commands for one navigation event.

```js
function scrollToRouteStart(lenis) {
  // Use this only when the route policy explicitly says to start at the top.
  lenis.scrollTo(0, {
    immediate: true,
    force: true
  });
}
```

Verify the option names and behavior in the installed Lenis version. Some routes, such as a long article with a table of contents, may need to preserve position, while a new top-level route may need to start at the beginning. Do not apply one global rule to every route without considering the user's task. Test browser Back and Forward, direct deep links, and a route that returns to a previously visited section.

**Gotcha:** A route transition and a scroll-restoration handler can both call `scrollTo`. The last call may win, causing a visible jump after the page appears settled. Assign one owner for route-level scroll decisions and make the order explicit.

## Fixed, Sticky, and Transformed Headers

Headers commonly use `position: sticky` or `position: fixed`, and they can change height after scrolling. An anchor target may reach the correct document coordinate while remaining hidden behind the header. Use CSS `scroll-margin-top` for a stable header height, or use the supported offset mechanism if the header size is dynamic. When the header shrinks, test both the expanded and compact states.

```css
:root {
  --header-offset: 5.5rem;
}

section[id],
article[id] {
  scroll-margin-top: var(--header-offset);
}

@media (max-width: 40rem) {
  :root {
    --header-offset: 4.5rem;
  }
}
```

A transformed ancestor can create a containing block or stacking context that changes how fixed-position elements behave. If a sticky header appears to move unexpectedly, inspect its ancestors for `transform`, `filter`, `perspective`, and overflow settings. Use DevTools to inspect the actual layout rather than guessing from the source CSS.

## Prevent Scroll-Linked Work from Becoming a Bottleneck

A scroll-linked animation should be proportional to the amount of visible work. Avoid updating a large React tree on every Lenis scroll event if only a tiny progress bar needs to change. Keep the mutable visual update local, or use the documented integration for the animation library that owns the effect. For expensive section activation, an `IntersectionObserver` can often replace repeated geometry reads.

```js
const sections = [...document.querySelectorAll("main section[id]")];

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      console.log("Visible section:", entry.target.id);
    }
  }
}, {
  root: null,
  rootMargin: "-20% 0px -60% 0px",
  threshold: 0
});

sections.forEach(section => observer.observe(section));

// In cleanup:
function disconnectSectionObserver() {
  observer.disconnect();
}
```

The observer's `rootMargin` is an example threshold strategy, not a universal configuration. Tune it based on section size and the navigation behavior. Disconnect observers when the page is removed. If the page contains hundreds of sections, observe only the relevant elements and avoid rebuilding the observer on every render.

## Operational Checklist for Integrations

When combining Lenis with a component library, analytics, or animation engine, write down which system owns each responsibility. This small contract prevents subtle regressions:
- Lenis owns document scroll interpolation.
- The router owns whether navigation restores or resets scroll.
- Native anchors own destination identity and URL semantics.
- GSAP ScrollTrigger owns its own trigger measurements and receives Lenis updates through the documented integration.
- React owns component lifetime and application state.
- CSS owns focus styling, responsive offsets, and static fallbacks.
- The reduced-motion policy determines whether optional interpolation is enabled.
- Teardown removes only the listeners, ticker callbacks, observers, and frame loops created by that integration.

```js
const scrollIntegrationContract = {
  documentScroll: "Lenis",
  routeRestoration: "router",
  anchorSemantics: "native links",
  scrollEffects: "ScrollTrigger integration",
  lifecycle: "React effect cleanup",
  motionPreference: "prefers-reduced-motion"
};

console.table(
  Object.entries(scrollIntegrationContract).map(([responsibility, owner]) => ({
    responsibility,
    owner
  }))
);
```

Keep this contract close to the provider or integration module. When debugging, it quickly reveals whether two systems are both trying to own the same behavior. Revisit it when adding a carousel, nested scroll container, modal, or new scroll-linked effect.

## Failure Recovery and Safe Defaults

If the smooth-scroll initialization fails, the content should still be readable and ordinary document scrolling should remain possible. Avoid hiding the page until Lenis is ready. Keep the CSS and HTML useful by default, and make the JavaScript enhancement optional. Log initialization failures in development and ensure a partially initialized instance is cleaned up before falling back.

```js
function createOptionalLenis() {
  try {
    return new Lenis();
  } catch (error) {
    console.error("Smooth scrolling unavailable; using native scrolling.", error);
    return null;
  }
}

const lenis = createOptionalLenis();
```

If the instance is `null`, do not start an RAF loop that calls `lenis.raf`. Guard the driver and keep links functional. A try/catch is not a substitute for correct imports or version checking, but it can prevent an optional enhancement from taking down unrelated page behavior. Avoid silently swallowing errors; report useful diagnostics in development.

**Gotcha:** A fallback is incomplete if it only catches constructor errors but the frame loop still assumes a valid instance. Treat instance creation, frame scheduling, event subscription, and teardown as one lifecycle unit.


## Final Principle

Lenis should make scrolling feel intentional without taking control away from the browser or the user. Keep one clear owner, preserve native navigation, adapt motion to user preferences, and treat lifecycle cleanup and device testing as core parts of the implementation.
