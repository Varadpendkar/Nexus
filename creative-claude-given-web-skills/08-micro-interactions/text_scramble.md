---
name: text-scramble
layer: layer-08-micro-interactions
filename: text_scramble.md
description: Create controlled text-scramble effects with readable fallbacks, deterministic completion, and accessible motion behavior.
---

# Text Scramble

## Why This Matters

A text-scramble effect briefly replaces characters with changing symbols or letters before revealing a final phrase. It can suggest a terminal, a signal resolving, a digital interface, or a moment of discovery. Used sparingly, it can add personality to a hero heading, a short label, or a deliberate transition between two pieces of copy.

The effect is easy to make noisy. If every heading scrambles on page load, the interface becomes harder to scan. If the animation never resolves, the text stops communicating. If the DOM is overwritten carelessly, inline markup and accessible names can be lost. If a screen reader is exposed to every frame, it may announce a stream of meaningless characters.

A production-ready text scramble should:
- Preserve the final phrase as the source of truth.
- Finish deterministically, including when interrupted or reduced motion is requested.
- Keep semantic and accessible text stable while visual characters animate.
- Avoid unnecessary layout shifts and excessive per-frame DOM work.
- Clean up animation frames, timers, and event listeners when the effect ends.

This skill covers character pools, deterministic reveal schedules, safe DOM structure, accessibility, reduced motion, viewport triggers, React lifecycle, and debugging.

## Core Concepts

### 1. Keep the Final Phrase Separate from the Animation State

The target text is content; scrambled characters are temporary decoration. Store the target phrase separately and always have a reliable path to render it exactly.

```js
const target = "SYSTEM READY";
const symbols = "!<>-_\\\\/[]{}—=+*^?#________";
```

**Why:** If the animation is interrupted, the target can still be rendered without trying to infer the original text from a scrambled frame. This also makes testing and content updates straightforward.

### 2. Scramble Characters, Not the Whole Meaning

A useful scramble changes a small portion of the target at any moment and reveals stable characters progressively. It should not randomly generate a different-length string that causes the layout to jump.

```js
function scrambleFrame(target, revealedCount, randomSymbol) {
  return [...target].map((character, index) => {
    if (character === " " || index < revealedCount) return character;
    return randomSymbol();
  }).join("");
}
```

**Why:** Keeping the target length and spaces stable makes the effect easier to read and reduces visual movement. This simple index-based version works best for plain text; more advanced scheduling can reveal characters at different times.

### 3. Use a Bounded Character Pool

A curated pool of symbols creates a consistent visual language. Avoid arbitrary Unicode ranges that can include emoji, combining marks, wide glyphs, or characters that render inconsistently across fonts.

```js
const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!<>-_+=*";
function randomCharacter() {
  return SCRAMBLE_CHARS[
    Math.floor(Math.random() * SCRAMBLE_CHARS.length)
  ];
}
```

**Why:** A bounded pool makes the effect predictable and visually coherent. Excluding ambiguous letters can help if the design resembles a technical status display.

### 4. Prefer Elapsed-Time Scheduling Over Frame Counts

A scramble should progress according to elapsed time, not a hard-coded number of frames. Frame counts behave differently at different refresh rates and can slow dramatically in background tabs.

```js
const progress = Math.min(1, (now - startedAt) / duration);
```

**Why:** A time-based schedule is more reliable across devices. It also allows the animation to reach the final phrase after a delayed frame without replaying every missed frame.

### 5. Reveal by Stable Character Positions

Build a reveal schedule for each character position. Once a position has resolved, keep it resolved. The final frame must be exactly the target string.

```js
function revealThreshold(index, length) {
  return length <= 1 ? 0 : index / (length - 1);
}
```

**Why:** Stable positions make the phrase progressively readable. Avoid reshuffling already resolved characters; doing so can make the effect feel broken rather than intentional.

### 6. Handle Unicode Deliberately

JavaScript string indexing uses UTF-16 code units, which do not always correspond to user-perceived characters. For simple English text, spreading a string into code points is often sufficient. For languages or text with combining marks, use grapheme segmentation.

```js
function splitGraphemes(text) {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return [...segmenter.segment(text)].map((item) => item.segment);
  }

  return Array.from(text);
}
```

**Why:** A scramble should not split a composed character or surrogate pair into invalid fragments. The fallback is code-point-aware, but it is not a full replacement for grapheme segmentation in every writing system.

### 7. Keep the Accessible Name Stable

For a visual effect, the changing symbols should usually be hidden from assistive technology while a stable final phrase remains available.

```html
<span class="scramble" aria-label="SYSTEM READY">
  <span class="scramble__visual" aria-hidden="true">SYSTEM READY</span>
</span>
```

**Why:** Screen readers need the meaningful phrase, not the visual noise. For ordinary text content, verify that the chosen markup exposes the correct accessible name in the target browser and assistive-technology combinations.

### 8. Respect Reduced Motion

When reduced motion is requested, skip the scramble and show the target immediately. Do not substitute a faster scramble; the intent is to reduce nonessential movement, not merely shorten it.

```js
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (reduceMotion) {
  renderTarget();
} else {
  startScramble();
}
```

**Why:** The final content should be equally available regardless of motion preference. Reduced motion is a first-class rendering path, not a late CSS patch.

### 9. Avoid Layout Shifts

Random characters may have different widths from the target letters. Use a suitable font, stable container dimensions where practical, and a character pool that resembles the target's visual metrics.

```css
.scramble__visual {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  white-space: pre-wrap;
}
```

**Why:** A text effect should not push nearby content around. Monospace fonts are often a good fit for terminal-style effects, while proportional fonts need more careful visual testing.

### 10. Keep Animation Work Local

Update only the text node or dedicated visual span. Do not rebuild a large section of the page on every frame, and do not query the whole document repeatedly inside the animation loop.

```js
function renderFrame(node, value) {
  node.textContent = value;
}
```

**Why:** A small, isolated update is easier for the browser to render and easier to maintain. Keep element lookups and configuration outside the frame callback.

### 11. Define Interruption Behavior

A second trigger can arrive while the first scramble is running. Choose whether to finish the old phrase, cancel it and start the new target, or continue from the current visual state. The simplest robust behavior is to cancel the previous run and render the new target after its own animation.

**Why:** Without a policy, multiple animation loops can compete to update the same element, causing flicker or a final string that never stabilizes.

### 12. Use Randomness for Texture, Not Correctness

Random symbols can change each frame, but the target phrase and completion schedule should remain deterministic. If the animation finishes at a fixed time, the final frame must not depend on a random branch.

**Why:** Randomness should affect only the temporary visual treatment. Tests, accessibility, and application state must not depend on the random symbol sequence.

## Patterns

### Pattern 1: Minimal Vanilla Text Scramble

**Use when:** You need a one-shot scramble for a short phrase in a static page.

```html
<h1 class="scramble" data-scramble="DESIGN IN MOTION">
  DESIGN IN MOTION
</h1>
```

```js
const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!<>-_+=*";

function splitGraphemes(text) {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return [...segmenter.segment(text)].map((part) => part.segment);
  }
  return Array.from(text);
}

function scrambleText(element, {
  target = element?.dataset.scramble ?? element?.textContent ?? "",
  duration = 900,
  characters = SCRAMBLE_CHARS,
  onComplete,
} = {}) {
  if (!element) return () => {};

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const targetChars = splitGraphemes(target);
  let frameId = 0;
  let cancelled = false;

  function renderFinal() {
    element.textContent = target;
    onComplete?.();
  }

  if (reduceMotion || duration <= 0 || targetChars.length === 0) {
    renderFinal();
    return () => {};
  }

  const startedAt = performance.now();
  const total = targetChars.length;

  function randomCharacter() {
    return characters[Math.floor(Math.random() * characters.length)];
  }

  function tick(now) {
    if (cancelled) return;

    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    const resolvedCount = Math.floor(progress * total);
    const frame = targetChars.map((character, index) => {
      if (character === " " || index < resolvedCount || progress >= 1) {
        return character;
      }
      return randomCharacter();
    }).join("");

    element.textContent = frame;

    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
    } else {
      frameId = 0;
      renderFinal();
    }
  }

  frameId = requestAnimationFrame(tick);

  return () => {
    cancelled = true;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    renderFinal();
  };
}

const heading = document.querySelector(".scramble");
if (heading) {
  const stopScramble = scrambleText(heading);
  // Call stopScramble() when the owning view is removed or the effect is interrupted.
}
```

**Notes:**
- The cleanup function intentionally resolves to the final phrase. If your product requires cancellation to preserve the current frame, implement that as a separate explicit option.
- Keep the target in `data-scramble` so the effect does not have to recover it from an intermediate frame.
- For content that must be visible before JavaScript runs, keep the target phrase in the initial markup.

### Pattern 2: Deterministic Reveal with Per-Character Delays

**Use when:** The phrase should resolve from left to right with a slightly staggered rhythm.

```js
function revealAt(index, progress, total, stagger = 0.55) {
  if (total <= 1) return progress >= 1;
  const localStart = (index / total) * stagger;
  const localDuration = Math.max(0.001, 1 - localStart);
  return (progress - localStart) / localDuration >= 1;
}

function createScrambleFrame(targetChars, progress, symbols) {
  const total = targetChars.length;

  return targetChars.map((character, index) => {
    if (character === " " || revealAt(index, progress, total)) {
      return character;
    }

    return symbols[Math.floor(Math.random() * symbols.length)];
  }).join("");
}
```

This pattern is useful when the first characters should settle earlier and the last characters resolve near the end. The schedule should be tested at short durations and with very short strings so the reveal does not look instantaneous or stall.

### Pattern 3: Accessible Visual Layer and Stable Text

**Use when:** The scramble is decorative and the final phrase must be available immediately to assistive technology.

```html
<h2 class="scramble-heading">
  <span class="sr-only">SYSTEM READY</span>
  <span class="scramble__visual" aria-hidden="true">SYSTEM READY</span>
</h2>
```

```css
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

.scramble__visual {
  display: inline-block;
  white-space: pre-wrap;
}
```

Animate only `.scramble__visual`. The screen-reader-only phrase stays stable. Do not add `aria-live` to the visual span. If the text is meaningful page content, verify heading semantics and accessible output with a screen reader instead of assuming the hidden duplicate is automatically the right pattern for every context.

### Pattern 4: Start Once When Visible

**Use when:** A heading appears below the fold and should scramble once when it enters view.

```js
function mountScrambleOnVisible(element) {
  if (!element) return () => {};

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    element.textContent = element.dataset.scramble ?? element.textContent;
    return () => {};
  }

  let cleanup = () => {};
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;

      cleanup = scrambleText(element);
      observer.unobserve(element);
    }
  }, { threshold: 0.25 });

  observer.observe(element);

  return () => {
    observer.disconnect();
    cleanup();
  };
}

const heading = document.querySelector("[data-scramble]");
if (heading) {
  const unmount = mountScrambleOnVisible(heading);
  // Call unmount() when the page section is removed.
}
```

**Why:** The effect starts when it can actually be seen and runs once. The observer is disconnected during teardown, and the animation cleanup resolves the target phrase.

### Pattern 5: React Component with Cancellation

**Use when:** A React component should animate a phrase when its target changes or when the component mounts.

```jsx
import { useEffect, useRef } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789!<>-_+=*";

function splitGraphemes(text) {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return [...segmenter.segment(text)].map((part) => part.segment);
  }
  return Array.from(text);
}

export function ScrambleText({ text, duration = 900, className = "" }) {
  const visualRef = useRef(null);

  useEffect(() => {
    const node = visualRef.current;
    if (!node) return;

    const targetChars = splitGraphemes(text);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion || duration <= 0) {
      node.textContent = text;
      return;
    }

    let frameId = 0;
    let cancelled = false;
    const startedAt = performance.now();

    function tick(now) {
      if (cancelled) return;

      const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
      const revealCount = Math.floor(progress * targetChars.length);

      node.textContent = targetChars.map((character, index) => {
        if (character === " " || index < revealCount || progress >= 1) {
          return character;
        }
        return SCRAMBLE_CHARS[
          Math.floor(Math.random() * SCRAMBLE_CHARS.length)
        ];
      }).join("");

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        node.textContent = text;
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [text, duration]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={visualRef} aria-hidden="true">{text}</span>
    </span>
  );
}
```

**Implementation notes:**
- The accessible text is not updated on every frame.
- The effect is restarted when `text` or `duration` changes.
- The cleanup cancels the pending frame. The next render supplies the new target text.
- If the visual text must resolve immediately when the component unmounts, it is no longer relevant to the removed view; cleanup should focus on stopping work rather than manipulating detached DOM.
- For a preference that can change while the component is mounted, create a dedicated `matchMedia` hook that listens for changes and include its value in the effect dependencies.

### Pattern 6: Button-Triggered Scramble

**Use when:** A user action changes a short label or status phrase.

```html
<button type="button" id="status-toggle">Run sequence</button>
<p>
  <span class="sr-only" id="status-accessible">Waiting</span>
  <span aria-hidden="true" id="status-visual">Waiting</span>
</p>
```

```js
const trigger = document.querySelector("#status-toggle");
const visual = document.querySelector("#status-visual");
const accessible = document.querySelector("#status-accessible");

let stopCurrent = () => {};

trigger?.addEventListener("click", () => {
  stopCurrent();

  const target = "SEQUENCE COMPLETE";
  accessible.textContent = target;
  stopCurrent = scrambleText(visual, {
    target,
    duration: 700,
  });
});
```

This pattern updates the accessible status once, then animates only the decorative visual layer. If the status communicates a real asynchronous result, update the stable accessible text when the result is actually known; do not announce “complete” before the operation completes.

### Pattern 7: Restartable Controller

**Use when:** Multiple triggers may target the same text element.

```js
function createScrambleController(element) {
  let stopCurrent = () => {};

  return {
    play(target, options = {}) {
      stopCurrent();
      stopCurrent = scrambleText(element, { ...options, target });
    },
    stop() {
      stopCurrent();
      stopCurrent = () => {};
    },
  };
}

const element = document.querySelector(".scramble");
if (element) {
  const controller = createScrambleController(element);
  controller.play("INITIALIZING", { duration: 600 });
  // Later: controller.play("READY", { duration: 800 });
  // On teardown: controller.stop();
}
```

**Why:** A single controller prevents multiple animation loops from writing to the same node. It also centralizes the policy for interruption and cleanup.

### Pattern 8: Progressive Enhancement and Fallback

**Use when:** The text is important content and should never disappear if JavaScript fails.

```html
<p class="scramble" data-scramble="WELCOME BACK">
  WELCOME BACK
</p>
```

```js
function enhanceScramble(element) {
  const target = element.dataset.scramble ?? element.textContent ?? "";
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion || !target) {
    element.textContent = target;
    return () => {};
  }

  return scrambleText(element, { target, duration: 850 });
}
```

The initial HTML already contains the final phrase. The animation is an enhancement and must never be the only way to reveal the content.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Losing the target after the first frame | The original phrase can no longer be recovered | Store the target separately |
| Randomizing the string length | Causes layout movement and unreadable frames | Preserve character positions and spaces |
| Using arbitrary Unicode ranges | Can produce inconsistent glyph widths or broken graphemes | Use a curated symbol pool |
| Revealing by frame count | Duration varies by refresh rate | Use elapsed time |
| Allowing multiple loops on one node | Animations compete and flicker | Cancel the previous run before starting another |
| Updating semantic text every frame | Assistive technology may receive visual noise | Keep a stable accessible phrase |
| Adding `aria-live` to the animated span | Can trigger excessive announcements | Announce meaningful state changes separately |
| Omitting reduced-motion handling | Forces decorative movement | Show the target immediately |
| Removing the initial text from HTML | Content may be blank when scripts fail | Render the final phrase first |
| Animating a large parent subtree | Creates unnecessary DOM work | Update one dedicated text node |
| Forgetting to cancel animation frames | Work continues after teardown | Cancel the pending frame |
| Starting before the element is visible | Motion can finish offscreen | Use a one-time visibility trigger when appropriate |
| Splitting grapheme clusters | Characters may render incorrectly | Use `Intl.Segmenter` when available |
| Assuming `Array.from` handles all graphemes | Combining sequences may still split | Use grapheme segmentation for multilingual content |
| Scrambling every heading | Makes the page difficult to scan | Reserve it for meaningful focal text |
| Using random symbols to imply real status | Can mislead users | Animate only presentation, not the underlying truth |

## Mental Models

1. **The target phrase is immutable content.** The scramble is a temporary rendering of that phrase, not a replacement for it.
2. **A character has a stable destination.** Once resolved, it should stay resolved for the remainder of the run.
3. **Elapsed time is the clock.** Frames are visual samples; the animation must finish even when frames are delayed.
4. **Randomness is surface texture.** It should never decide what the final content says.
5. **Accessibility follows meaning, not noise.** Assistive technology should receive the final phrase or meaningful status, not every symbol frame.
6. **One element, one active animation.** Starting a new run cancels or replaces the previous run deliberately.
7. **Motion is optional; content is not.** Reduced-motion mode and no-JavaScript fallback still show the full phrase.

## Quick Reference

### State checklist

| State | Expected behavior |
|---|---|
| Initial page render | Final phrase is visible |
| Animating | Unresolved positions change; resolved positions stay stable |
| Complete | Exact target phrase is rendered |
| Reduced motion | Target appears immediately |
| Interrupted | Previous run stops; new target policy is applied |
| Target changes | Old run is cancelled before the new run starts |
| Component unmounts | Pending animation frame is cancelled |
| Screen reader | Stable phrase or meaningful status is available |
| Observer unsupported | Content remains visible and functional |

### Useful CSS

```css
.scramble__visual {
  display: inline-block;
  white-space: pre-wrap;
}

.scramble--terminal {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .scramble__visual {
    animation: none;
  }
}
```

CSS alone does not stop a JavaScript animation loop; the JavaScript path must check reduced-motion preferences and skip or cancel the effect.

### Debugging sequence

1. Verify the final phrase exists in initial markup.
2. Confirm the target is stored separately from the visual frame.
3. Test empty strings, spaces, punctuation, and short phrases.
4. Verify the animation ends at the exact target after a delayed frame.
5. Test `prefers-reduced-motion: reduce`.
6. Inspect accessible output while the visual layer changes.
7. Trigger the effect twice rapidly and verify only one loop remains active.
8. Unmount the component and verify the frame is cancelled.
9. Test multilingual text with combining marks and emoji if supported by the product.
10. Check layout stability using the actual production font.
11. Test visibility fallback when `IntersectionObserver` is unavailable.
12. Verify that a status label does not claim an operation completed before it did.

### Production checklist

- [ ] Final phrase is present before JavaScript starts.
- [ ] Target text is stored separately from the changing frame.
- [ ] Character pool is curated and bounded.
- [ ] Progress is based on elapsed time.
- [ ] Final frame is exactly the target phrase.
- [ ] Reduced-motion mode skips the animation.
- [ ] Accessible text remains stable.
- [ ] Animation does not emit per-frame live announcements.
- [ ] Only one animation can update a node at a time.
- [ ] Frames and observers are cleaned up.
- [ ] Unicode handling matches the supported language set.
- [ ] Layout remains stable with the chosen font.
- [ ] The effect is used selectively, not on every text node.
- [ ] Real status information remains truthful.

## Build Challenge

Create a hero heading for a digital studio. The heading should scramble once when it enters the viewport, resolve from left to right, and remain accessible to keyboard and screen-reader users.

### Requirements

1. Render the final heading in initial HTML.
2. Store the target phrase separately from the animated frame.
3. Use a bounded character pool.
4. Use elapsed time rather than a frame counter.
5. Reveal characters progressively and keep resolved positions stable.
6. Use grapheme segmentation where supported.
7. Skip the animation when reduced motion is enabled.
8. Trigger once with `IntersectionObserver` and provide a fallback.
9. Keep accessible text stable while visual characters change.
10. Support cancellation and safe restart.
11. Clean up observers and animation frames on teardown.
12. Test rapid retriggers, empty strings, punctuation, and multilingual text as required.

### Acceptance criteria

- The heading is readable before JavaScript executes.
- The final phrase is exact after completion or cancellation.
- The animation duration is not tied to display refresh rate.
- Reduced-motion mode shows the phrase immediately.
- Screen readers do not announce every changing symbol.
- Rapid retriggers do not create competing animation loops.
- The effect runs once when the heading becomes visible.
- Cleanup leaves no pending animation frame or observer.
- The effect does not cause noticeable layout shifts.
- The final heading remains meaningful without the effect.

### Review questions

1. Why should the target phrase be stored separately?
2. How does elapsed-time scheduling improve reliability?
3. Why should resolved characters remain stable?
4. What limitations does `Array.from` have for multilingual text?
5. How should reduced-motion preferences affect the animation?
6. Why should the visual layer be hidden from assistive technology?
7. What is the safest default behavior when an animation is interrupted?
8. How do you avoid competing animation loops?
9. Why should the final phrase exist in initial HTML?
10. How would you test the effect for both visual quality and accessible output?
