---
name: number-countup
layer: layer-08-micro-interactions
filename: number_countup.md
description: Build accessible, performant count-up number animations for metrics, dashboards, and landing pages.
---

# Number Count-Up

## Why This Matters

A number count-up animates a value from a starting point to a final value. It can make a statistic feel responsive, help draw attention to a milestone, or give a dashboard a subtle sense of progression. Common uses include revenue totals, completed projects, performance metrics, user counts, percentages, and campaign results.

The technique is simple to demonstrate and easy to misuse. A counter that animates every time it enters the viewport can distract users, imply that a real value is changing when it is not, or make assistive technology announce dozens of intermediate numbers. A counter that uses floating-point arithmetic carelessly can display the wrong final value. A counter that runs forever after a component is removed wastes work.

A production-ready count-up should:
- Show a truthful final value when motion is disabled or JavaScript is unavailable.
- Animate only when the effect adds meaning, not merely because a number exists.
- Format values consistently, including decimals, grouping, currency, percentages, and locale.
- Respect reduced-motion preferences and avoid excessive announcements to assistive technology.
- Clean up timers, observers, and animation frames when no longer needed.

This guide covers deterministic count-up math, viewport triggering, formatting, accessibility, React integration, lifecycle cleanup, and testing.

## Core Concepts

### 1. The Final Value Is the Source of Truth

The final number must be present in the markup or rendered immediately when the component initializes. Animation should progressively reveal the same value, not replace the underlying meaning with a decorative approximation.

```html
<span class="count-up" data-count-to="1250">1,250</span>
```

**Why:** If JavaScript is blocked, fails, or is disabled, the user should still see the correct information. For server-rendered interfaces, render the final value as the initial content to avoid blank metrics and hydration mismatch.

### 2. Interpolate from a Fixed Start to a Fixed End

Use elapsed time to calculate progress. Do not increment the displayed number by an arbitrary amount on each frame, because frame rates differ between devices and tabs can be throttled.

```js
function interpolate(start, end, progress) {
  return start + (end - start) * progress;
}
```

**Why:** A time-based animation reaches the target in the intended duration regardless of frame rate. It also makes the final state deterministic.

### 3. Use `requestAnimationFrame` for Visual Updates

A count-up changes pixels on screen, so `requestAnimationFrame` is generally the appropriate scheduling mechanism. Use the timestamp supplied to the callback instead of assuming a fixed frame interval.

```js
function tick(now) {
  const progress = Math.min(1, (now - startedAt) / duration);
  render(interpolate(start, end, progress));

  if (progress < 1) {
    frameId = requestAnimationFrame(tick);
  }
}
```

**Why:** The browser can align visual updates with painting. A fixed increment in `setInterval` can drift, produce uneven motion, and continue when the tab is throttled.

### 4. Clamp Progress and Handle Zero Duration

Progress should always be between zero and one. A duration of zero should render the target immediately rather than divide by zero or create a stalled loop.

```js
const progress = duration <= 0
  ? 1
  : Math.min(1, Math.max(0, elapsed / duration));
```

**Why:** Animation code must handle edge cases explicitly. Clamping protects against late frames and ensures the exact endpoint is eventually rendered.

### 5. Separate Numeric Interpolation from Formatting

The animation engine should calculate a numeric value. A formatter should decide how that value appears to users.

```js
const formatInteger = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

formatInteger.format(1250000); // "1,250,000"
```

**Why:** Formatting is locale-sensitive. Grouping separators, decimal separators, currency placement, and numeral conventions should not be manually assembled from strings.

### 6. Round Only for Display

Intermediate values can be fractional even when the target is an integer. Format or round at the display boundary, and always render the exact target at completion.

```js
function renderCount(value, formatter) {
  return formatter.format(value);
}
```

**Why:** Repeatedly rounding the internal value can create uneven stepping or prevent a decimal target from being represented accurately. Keep calculation and presentation separate.

### 7. Make Easing Optional and Predictable

Linear progress is easy to reason about. An easing function changes the perceived acceleration without changing the start or end values.

```js
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
```

**Why:** Easing can make a short count-up feel polished, but it should not obscure the actual value or create a long, distracting pause near the endpoint. Always clamp the input and preserve exact completion.

### 8. Trigger on Visibility, Not on Every Render

A page with many metrics should not animate every counter immediately on load. `IntersectionObserver` can trigger a count-up when a metric enters the viewport.

```js
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      startCounter(entry.target);
      observer.unobserve(entry.target);
    }
  }
});
```

**Why:** Visibility-based triggering avoids spending animation work on content the user has not reached. Decide whether a counter should animate once, on every re-entry, or only after a user action; do not let observer callbacks decide the product behavior accidentally.

### 9. Reduced Motion Should Show the Final Value

When `prefers-reduced-motion: reduce` is active, skip the count-up and render the final number immediately.

```js
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (reduceMotion) {
  render(end);
} else {
  startAnimation();
}
```

**Why:** The information does not depend on motion. Reduced-motion support should preserve the metric and remove only the decorative transition.

### 10. Do Not Announce Every Frame to Screen Readers

A counter may update dozens of times per second. Putting the changing number in a live region can cause excessive announcements.

```html
<span class="metric-value" aria-hidden="true">1,250</span>
<span class="sr-only">1,250 projects completed</span>
```

**Why:** Assistive technology should receive the meaningful result, not a stream of intermediate values. Keep a stable accessible value and update it intentionally when the underlying data changes.

### 11. Avoid Layout Shift

Changing the width of a number as it grows can shift nearby labels and cards. Reserve enough space when practical, or use tabular numerals.

```css
.metric-value {
  font-variant-numeric: tabular-nums;
}
```

**Why:** Tabular numerals have consistent digit widths in supported fonts. For metrics with widely varying digit counts, consider a fixed-width region or a layout that tolerates the change.

### 12. Lifecycle Cleanup Is Part of the Animation

Cancel the pending frame when an animation is stopped or a component unmounts. Disconnect observers and remove event listeners when their job is complete.

```js
function stopCounter() {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = 0;
}
```

**Why:** An animation is a temporary process. Without cleanup, detached elements can keep receiving updates, repeated mounts can attach duplicate observers, and route changes can leave work running unnecessarily.

## Patterns

### Pattern 1: Minimal Vanilla JavaScript Count-Up

**Use when:** You need a single numeric animation without framework dependencies.

```html
<p>
  Projects delivered:
  <strong class="count-up" data-from="0" data-to="128" data-duration="900">128</strong>
</p>
```

```js
function animateCount(element, {
  from = 0,
  to,
  duration = 900,
  easing = (t) => t,
  formatter = (value) => Math.round(value).toLocaleString(),
} = {}) {
  if (!element || !Number.isFinite(to) || !Number.isFinite(from)) {
    return () => {};
  }

  let frameId = 0;
  let stopped = false;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function render(value) {
    element.textContent = formatter(value);
  }

  if (reduceMotion || duration <= 0 || from === to) {
    render(to);
    return () => {};
  }

  const startedAt = performance.now();

  function tick(now) {
    if (stopped) return;

    const rawProgress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    const progress = Math.min(1, Math.max(0, easing(rawProgress)));
    const value = from + (to - from) * progress;

    render(rawProgress >= 1 ? to : value);

    if (rawProgress < 1) {
      frameId = requestAnimationFrame(tick);
    } else {
      frameId = 0;
    }
  }

  frameId = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
  };
}

const element = document.querySelector(".count-up");

if (element) {
  const from = Number(element.dataset.from ?? 0);
  const to = Number(element.dataset.to);
  const duration = Number(element.dataset.duration ?? 900);

  const stop = animateCount(element, {
    from,
    to,
    duration,
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });

  // Call stop() if the owning view is removed before the animation ends.
}
```

**Important:** The example uses `dataset.to` as the target and renders the final value when complete. In a server-rendered page, keep the initial text as the final value so it remains truthful before JavaScript runs. If you need an animated start value, initialize it only after the component is ready and only when that behavior is intentional.

### Pattern 2: Viewport-Triggered Metrics

**Use when:** Several metrics appear lower on a landing page or dashboard.

```html
<section class="metrics" aria-label="Studio metrics">
  <article class="metric">
    <p class="metric__label">Projects completed</p>
    <p class="metric__value">
      <span class="count-up" data-to="128">128</span>
    </p>
  </article>

  <article class="metric">
    <p class="metric__label">Client satisfaction</p>
    <p class="metric__value">
      <span class="count-up" data-to="96">96</span>%
    </p>
  </article>
</section>
```

```js
const counterCleanups = new WeakMap();

function startElementCounter(element) {
  const target = Number(element.dataset.to);
  if (!Number.isFinite(target)) return;

  const cleanup = animateCount(element, {
    from: 0,
    to: target,
    duration: 1000,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    formatter: (value) => Math.round(value).toLocaleString(),
  });

  counterCleanups.set(element, cleanup);
}

const counters = document.querySelectorAll(".count-up");
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  counters.forEach((element) => {
    const target = Number(element.dataset.to);
    if (Number.isFinite(target)) element.textContent = target.toLocaleString();
  });
} else {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      startElementCounter(entry.target);
      currentObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.35,
    rootMargin: "0px 0px -5% 0px",
  });

  counters.forEach((element) => observer.observe(element));

  // Disconnect observer when the containing view is removed.
  // observer.disconnect();
}
```

**Design decision:** This pattern animates once. If the user scrolls away and back, the counter stays at the final value. Replaying on every re-entry should be an explicit design choice, not an accidental consequence of observer setup.

### Pattern 3: Locale-Aware Formatting

**Use when:** Values include grouping, decimals, currency, or percentages.

```js
const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function formatMetric(value, kind) {
  switch (kind) {
    case "decimal":
      return decimalFormatter.format(value);
    case "currency":
      return currencyFormatter.format(value);
    default:
      return integerFormatter.format(value);
  }
}
```

To animate ₹12,50,000, interpolate the numeric value from the chosen start to `1250000`, then pass each frame's value to the currency formatter. Do not interpolate a string such as `"₹0"` to `"₹12,50,000"` character by character; string interpolation is not numeric interpolation.

For a percentage, decide whether the numeric target represents `0.96` or `96` and use that convention consistently. If the target is `96`, append `%` outside the formatter or use a formatter that explicitly formats a percentage according to the expected input scale.

### Pattern 4: Decimal Precision Without Floating-Point Surprises

**Use when:** A metric should animate to a decimal such as `4.8`, `98.5`, or `2.75`.

```js
function createDecimalFormatter(locale = "en-US", digits = 1) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const formatter = createDecimalFormatter("en-IN", 1);

function renderDecimal(value) {
  return formatter.format(value);
}
```

The internal calculation can use floating-point numbers, but the display should use a consistent precision. On completion, render the exact target through the formatter. If the displayed number must follow a fixed increment such as tenths, round the display value to that increment; do not change the underlying final target.

### Pattern 5: React Hook with Cleanup

**Use when:** The counter is driven by React props and should cancel when the component unmounts or its target changes.

```jsx
import { useEffect, useState } from "react";

function useCountUp(target, {
  from = 0,
  duration = 900,
  reduceMotion = false,
} = {}) {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!Number.isFinite(target) || !Number.isFinite(from)) return;

    if (reduceMotion || duration <= 0 || from === target) {
      setValue(target);
      return;
    }

    let frameId = 0;
    let cancelled = false;
    const startedAt = performance.now();

    setValue(from);

    function tick(now) {
      if (cancelled) return;

      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(progress >= 1 ? target : from + (target - from) * eased);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [target, from, duration, reduceMotion]);

  return value;
}
```

A component can format the returned value:

```jsx
function Metric({ value, label }) {
  const count = useCountUp(value, { duration: 900 });
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(count);

  return (
    <div className="metric">
      <p className="metric__label">{label}</p>
      <p className="metric__value">
        <span aria-hidden="true">{formatted}</span>
        <span className="sr-only">{new Intl.NumberFormat("en-IN").format(value)}</span>
      </p>
    </div>
  );
}
```

**Implementation note:** The hook above accepts a `reduceMotion` boolean from its caller. In a complete application, derive it from `matchMedia` in a dedicated hook and listen for preference changes. Keep the server-rendered output stable to avoid hydration mismatches; the initial state and animation start policy should be chosen deliberately.

### Pattern 6: Accessible Metric with a Stable Spoken Value

**Use when:** A metric is decorative during its animation but important as information.

```html
<div class="metric" aria-label="Projects completed: 1,250">
  <span class="metric__value" aria-hidden="true">1,250</span>
  <span class="metric__label">Projects completed</span>
</div>
```

In a framework, keep the accessible text tied to the final value rather than the per-frame visual value. Avoid `aria-live="polite"` on a span that updates every animation frame.

For a dashboard where the underlying data genuinely updates, announce meaningful data changes separately from the decorative count-up. A one-time count-up from zero is not the same as a live metric update.

### Pattern 7: Cancel and Restart Safely

**Use when:** A metric can change because of new data, route changes, or a repeated component mount.

```js
function createCounterController(element) {
  let stopCurrent = () => {};

  return {
    start(options) {
      stopCurrent();
      stopCurrent = animateCount(element, options);
    },
    stop() {
      stopCurrent();
      stopCurrent = () => {};
    },
  };
}

const valueElement = document.querySelector(".count-up");

if (valueElement) {
  const controller = createCounterController(valueElement);

  controller.start({ from: 0, to: 250, duration: 900 });
  // On updated data:
  // controller.start({ from: 250, to: 310, duration: 700 });
  // On teardown:
  // controller.stop();
}
```

**Why:** A controller ensures that a new animation cancels the previous one rather than competing to write to the same element. When the target changes, define whether the new animation starts from the previous target or the currently displayed value; either can be correct, but the choice should be explicit.

### Pattern 8: Progressive Enhancement with a Final-Value Fallback

**Use when:** The counter is part of server-rendered content and must remain correct before JavaScript executes.

```html
<span class="metric-value" data-count-to="1250">1,250</span>
```

```js
function enhanceCounter(element) {
  const target = Number(element.dataset.countTo);
  if (!Number.isFinite(target)) return;

  // The final value is already visible.
  // Only start an animation if the product design explicitly wants
  // an initial count-up after the element becomes visible.
  element.dataset.countEnhanced = "true";
}
```

This pattern makes the fallback intentional. If the design requires a zero-to-target animation, change the text only after the enhancement code is ready to run. Do not leave an empty element waiting for JavaScript.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Incrementing by a fixed amount per frame | Duration depends on frame rate | Interpolate from elapsed time |
| Using `setInterval` as a visual clock | Can drift and produce uneven motion | Use `requestAnimationFrame` |
| Not clamping progress | Late frames can overshoot the target | Clamp progress to 0–1 |
| Dividing by a zero duration | Produces invalid values | Render the target immediately |
| Formatting the string before interpolation | Numeric values become meaningless text | Interpolate numbers, then format |
| Manually adding grouping separators | Locale formatting becomes fragile | Use `Intl.NumberFormat` |
| Updating a live region every frame | Screen readers may announce excessive changes | Keep a stable accessible value |
| Starting every counter on page load | Wastes attention and motion | Trigger when visible when appropriate |
| Replaying on every viewport entry unintentionally | Can become repetitive and distracting | Unobserve after the first start or define replay policy |
| Leaving the final value hidden without JavaScript | Content becomes unavailable | Render the final value in the initial markup |
| Forgetting animation-frame cleanup | Work can continue after teardown | Cancel pending frames |
| Forgetting observer cleanup | Detached views may retain observation work | Unobserve or disconnect the observer |
| Ignoring reduced motion | Forces nonessential animation | Show the final value immediately |
| Animating a metric that implies a false live change | Can mislead users | Use motion only as a presentation effect |
| Allowing width changes to shift the layout | Nearby content jumps as digits change | Use tabular numerals or reserve space |
| Resetting a counter whenever it rerenders | Animation restarts unexpectedly | Tie animation to meaningful target changes |
| Using `aria-live` for decorative frames | Creates noisy announcements | Announce only meaningful updates |
| Failing to validate numeric inputs | `NaN` or infinite values leak into the UI | Check `Number.isFinite` |

## Mental Models

1. **Animate the presentation, not the truth.** The final metric is the information; the count-up is only a way of revealing it.
2. **Time determines progress.** The current frame is a sample of elapsed time, not a fixed step in a counter.
3. **Numbers and strings are different layers.** Calculate numeric values first, then format them for the user's locale.
4. **Visibility is a trigger, not a requirement.** Use viewport observation when it serves the experience, but never make the final information depend on scrolling.
5. **Accessibility should not inherit every animation frame.** Keep spoken content stable and announce actual data changes intentionally.
6. **Every animation has a lifecycle.** Start, finish, cancel, and cleanup are all explicit states.
7. **Reduced motion keeps the result.** The user loses only the transition, never the metric.

## Quick Reference

### Animation formula

For start \(s\), target \(e\), normalized progress \(t\), and easing function \(E\):

\[
v(t) = s + (e - s) E(t)
\]

Clamp \(t\) to the interval from zero to one. At completion, render \(e\) exactly.

### State checklist

| State | Expected behavior |
|---|---|
| Before enhancement | Correct final value is visible |
| Animating | Value moves smoothly toward target |
| Complete | Exact final target is rendered |
| Reduced motion | Final target appears immediately |
| Invalid target | Existing content remains; no animation starts |
| Target changes | Previous animation is cancelled before replacement |
| Component unmounts | Pending frame and observer work are cleaned up |
| Screen-reader output | Meaningful final value, not every intermediate frame |

### Useful CSS

```css
.metric-value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Debugging sequence

1. Verify the final value is present before animation starts.
2. Confirm `from`, `to`, and `duration` are finite and intentional.
3. Test duration zero and equal start/target values.
4. Verify progress is clamped and the exact target is rendered at completion.
5. Check locale formatting for large values, decimals, and currency.
6. Toggle reduced motion and confirm the transition is skipped.
7. Test a slow device and background-tab throttling.
8. Inspect screen-reader output for repeated announcements.
9. Change the target mid-animation and verify the old frame is cancelled.
10. Unmount the component and confirm no observer or frame continues.
11. Check whether changing digit count causes layout shift.
12. Verify the no-JavaScript state remains truthful.

### Production checklist

- [ ] Final value is visible without JavaScript.
- [ ] Inputs are validated with `Number.isFinite`.
- [ ] Progress is clamped to 0–1.
- [ ] Animation uses elapsed time and `requestAnimationFrame`.
- [ ] Zero duration and equal endpoints are handled.
- [ ] Exact target is rendered on completion.
- [ ] Formatting uses `Intl.NumberFormat` where appropriate.
- [ ] Reduced-motion preference is respected.
- [ ] Screen readers are not flooded with frame-by-frame values.
- [ ] Viewport observers are cleaned up.
- [ ] Pending frames are cancelled on stop or unmount.
- [ ] Target updates have an explicit restart policy.
- [ ] Layout remains stable as digit widths change.
- [ ] The effect has been tested with keyboard and assistive technology.

## Build Challenge

Create a metrics strip for a studio or product landing page with three values: completed projects, customer satisfaction, and total revenue. Each counter should animate once when it becomes visible.

### Requirements

1. Render each final value in the initial HTML.
2. Use elapsed-time interpolation with `requestAnimationFrame`.
3. Clamp progress and render the exact target on completion.
4. Format values with `Intl.NumberFormat` and an explicit locale.
5. Support integer, decimal, and currency formatting.
6. Trigger each counter once using `IntersectionObserver`.
7. Render final values immediately when reduced motion is enabled.
8. Provide a fallback when `IntersectionObserver` is unavailable.
9. Avoid frame-by-frame screen-reader announcements.
10. Use tabular numerals or a stable layout to reduce layout shift.
11. Cancel active frames and disconnect observers during teardown.
12. Test changing targets and rapid unmount/remount cycles.

### Acceptance criteria

- Metrics remain correct with JavaScript disabled.
- Every counter reaches the exact target in its configured duration.
- Frame rate does not determine the animation duration.
- Invalid values do not render `NaN` or start an animation.
- Locale-specific separators and currency formatting are correct.
- Reduced motion skips the animation but preserves the result.
- Screen readers receive the meaningful value without repeated frame announcements.
- Each counter animates once unless replay is explicitly designed.
- No pending frame or observer work remains after teardown.
- The layout remains readable as values change.

### Review questions

1. Why is elapsed-time interpolation more reliable than fixed increments?
2. What should happen when duration is zero?
3. Why should formatting be separated from interpolation?
4. How does `Intl.NumberFormat` improve locale support?
5. Why should the final value be present before JavaScript runs?
6. When is `IntersectionObserver` useful for count-up metrics?
7. Why should a counter not use an `aria-live` region for every frame?
8. What cleanup is required when the component unmounts?
9. How should an active animation respond when its target changes?
10. How can you prevent a metric animation from misleading users about live data?
