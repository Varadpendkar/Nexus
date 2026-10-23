# GSAP Text Animations — Typography in Motion

> **Skill file:** `gsap-text-animations/SKILL.md`
> **Layer:** 03 — Animation & Motion
> **Scope:** Text reveal choreography, line and word splitting, stagger timing, accessible text, responsive reflow, cleanup, and performance.
> **Use this skill when:** typography needs a deliberate entrance, emphasis, or transition that supports the content hierarchy.
> **Do not use this skill when:** motion adds no information, harms reading speed, or a simple CSS transition is sufficient.

## Why This Matters

Text animation is highly visible and easy to overdo. A heading that reveals line by line can establish hierarchy; a paragraph that animates every character can make a simple message exhausting to read. Production problems include split text that no longer reflows after a viewport change, screen readers encountering fragmented words, duplicate accessible text, animation that starts before fonts load, and cleanup that leaves inline styles behind.

The reliable approach is to treat text animation as a progressive enhancement. The semantic text must remain understandable if JavaScript fails, motion is reduced, the font changes, or the animation is interrupted. Choose a reveal unit—whole block, line, word, or character—based on meaning and reading effort. Then make the split structure temporary, measurable, accessible, and easy to rebuild.

GSAP can animate DOM elements and its SplitText plugin can create line, word, and character wrappers. Use the current official GSAP documentation for the exact SplitText API supported by the installed version. Do not invent line breaks by counting characters: actual lines depend on font metrics, available width, language, and browser layout.

## 1. Choose the Correct Reveal Unit

Start with the content’s role. A short hero heading may benefit from line reveals. A small label may use a subtle opacity change. A paragraph should usually appear as a whole block or in a small number of meaningful groups. Character-by-character animation is a stylistic effect, not a default for ordinary reading content.

```js
const heading = document.querySelector("[data-hero-title]");

if (heading) {
  gsap.from(heading, {
    autoAlpha: 0,
    y: 18,
    duration: 0.55,
    ease: "power2.out"
  });
}
```

Choose movement that reinforces hierarchy rather than competing with it. Keep distance modest, preserve contrast, and avoid animating text in a way that makes users wait to read the primary message. For repeated elements, stagger by a small amount instead of giving each item a large independent delay.

**Gotcha:** An elaborate reveal can conceal the most important content during the first seconds of a page. Ensure the page remains useful if the animation is skipped, delayed, or disabled.

## 2. Register GSAP Plugins and Keep Imports Explicit

Use the plugin imports supported by the project’s build system. For a bundled project, import GSAP and SplitText from the installed package and register the plugin once in a shared animation module or at the component setup boundary.

```js
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);
```

Do not assume a plugin is available because a code sample from another environment uses it. Verify the package version, import path, license/access requirements if applicable, and build output. Keep plugin setup close enough to the application entry point that the import is testable, but avoid registering it repeatedly during every render.

If SplitText is not available in the installed environment, use whole-element animation or a purpose-built accessible text structure. Do not build a fragile character-splitting system from raw `innerHTML` replacement as a shortcut.

## 3. Split Lines, Words, and Characters Deliberately

SplitText can generate wrappers for lines, words, and characters. Use the smallest split that produces a real communication benefit. Line-based reveals tend to preserve word integrity better than character-based effects. Word-based reveals may be appropriate for a short title, while per-character motion is best reserved for brief decorative text.

```js
const split = SplitText.create("[data-animated-heading]", {
  type: "lines,words",
  linesClass: "text-line",
  wordsClass: "text-word"
});

gsap.from(split.lines, {
  yPercent: 110,
  autoAlpha: 0,
  duration: 0.65,
  ease: "power3.out",
  stagger: 0.08
});
```

The exact SplitText setup should match the installed GSAP version. If the heading uses nested inline elements, test the generated wrappers carefully so emphasis and links retain their meaning. Do not split a sentence into many independent characters if the user needs to scan it quickly.

The `yPercent` reveal needs an appropriate clipping wrapper or overflow strategy so the moving line is masked at the intended edge. Avoid applying `overflow: hidden` to a large ancestor if it clips focus outlines, menus, or other content.

## 4. Keep the Original Text Semantically Intact

Animation wrappers can affect how assistive technology reads text. Inspect the generated DOM and accessibility tree. Keep the original wording in a meaningful semantic structure, and use the SplitText accessibility features supported by the installed version where appropriate. Do not add a second visible copy solely to make the animation easier.

```html
<section aria-labelledby="intro-title">
  <h1 id="intro-title" data-animated-heading>
    Build useful things with care.
  </h1>
  <p>Readable content should not depend on animation.</p>
</section>
```

If a decorative duplicate is necessary for a particular visual technique, hide that duplicate from assistive technology with `aria-hidden="true"` and ensure the meaningful text is exposed exactly once. Avoid hiding the only semantic heading and replacing it with a pile of unrelated spans. Check screen-reader output rather than assuming the DOM is accessible because it looks correct.

Keep link and button text as a single understandable accessible name. Avoid splitting interactive labels into independently focusable characters. The control should remain one control, with one keyboard stop and a stable name.

## 5. Animate Lines with a Clipping Wrapper

A line reveal often moves each line vertically from below its final position. Use a line wrapper with controlled overflow, but keep the clipping local to the animated line. A broad clipping region can hide focus indicators or content that should remain visible.

```css
.text-line-mask {
  display: block;
  overflow: clip;
}

.text-line {
  display: block;
  will-change: transform, opacity;
}
```

```js
gsap.from(split.lines, {
  yPercent: 105,
  autoAlpha: 0,
  duration: 0.6,
  ease: "power3.out",
  stagger: 0.075
});
```

The `will-change` hint should be applied only to the elements that are about to animate and removed when the transition is complete if the effect is short-lived. Excessive layer promotion can increase memory use. Check the Layers panel and Performance panel instead of assuming `will-change` is always an optimization.

Make sure the clipping wrapper’s height and line height behave correctly after the font loads. If a line’s baseline is cut off, adjust the wrapper or animation offset instead of hiding more of the page.

## 6. Build a Word Reveal

Word reveals are useful for a short phrase or title when the sequence itself reinforces the message. Use SplitText’s word targets rather than manually splitting spaces. Whitespace, punctuation, non-Latin scripts, and line wrapping make hand-built splitting brittle.

```js
const split = SplitText.create("[data-word-reveal]", {
  type: "words",
  wordsClass: "reveal-word"
});

gsap.from(split.words, {
  y: 14,
  autoAlpha: 0,
  duration: 0.45,
  ease: "power2.out",
  stagger: 0.035
});
```

Avoid a delay so long that the end of a heading arrives after the user has already moved on. Keep the whole phrase readable quickly, and provide a nonanimated path for reduced motion. If the phrase is a link or button, preserve the original interactive element and accessible name.

For paragraphs, consider a whole-block fade or a modest line stagger instead. Word-by-word animation can be especially difficult for people with cognitive or reading-related disabilities when it slows comprehension or repeatedly shifts visual attention.

## 7. Character Animation Requires Restraint

Character-level motion is appropriate for short decorative headings, logo-like wordmarks, or a deliberate typographic accent. It is rarely appropriate for long sentences, forms, error messages, or instructions. Characters should not become independent focusable elements.

```js
const split = SplitText.create("[data-short-wordmark]", {
  type: "chars",
  charsClass: "reveal-char"
});

gsap.from(split.chars, {
  yPercent: 70,
  autoAlpha: 0,
  duration: 0.32,
  ease: "power2.out",
  stagger: 0.018
});
```

The wrapper structure may affect selection, copying, ligatures, and assistive technology. Test the actual text, font, and browser. If the visual effect breaks text selection or causes screen readers to pronounce each letter separately, use a simpler animation. Prefer semantic correctness over a more elaborate reveal.

**Gotcha:** Character animation can make a word appear as separate letters to assistive technology or copy/paste tools. Validate the accessibility tree and actual text selection behavior.

## 8. Re-split When Fonts or Layout Change

Line splitting depends on the rendered font and available width. If the web font loads after splitting, the line boundaries can change. If the container resizes, a line may wrap differently while the generated wrappers still reflect the old layout. Use the current SplitText API’s `autoSplit` or re-splitting support where available, and make sure animations are recreated safely after a split refresh.

```js
const split = SplitText.create("[data-responsive-title]", {
  type: "lines,words",
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.lines, {
      yPercent: 100,
      autoAlpha: 0,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.06
    });
  }
});
```

Check the current plugin documentation for supported options and lifecycle behavior. Avoid running a custom `resize` listener that repeatedly splits text on every pixel of a drag. Debounce or use the plugin’s supported refresh behavior, and remove custom listeners on cleanup.

For custom handling, wait for fonts to be ready before the initial split when the experience depends on exact line boundaries. The `document.fonts.ready` promise can help, but the page should still remain readable while waiting. Test responsive breakpoints, browser zoom, orientation changes, and late-loading fonts.

## 9. Use Stagger as Choreography, Not Decoration

Stagger controls the delay between target animations. A small stagger can create a cohesive wave; a large stagger can make the content feel slow or disjointed. The total reveal time is approximately the animation duration plus the accumulated stagger delay, so calculate the overall time rather than tuning only the duration.

```js
gsap.from(split.lines, {
  autoAlpha: 0,
  y: 16,
  duration: 0.5,
  ease: "power2.out",
  stagger: {
    each: 0.06,
    from: "start"
  }
});
```

Use a consistent timing hierarchy: the primary heading appears first, supporting copy follows quickly, and controls become available without waiting for decorative details. Avoid delaying essential navigation, consent actions, error messages, or validation feedback. The interaction must remain usable even while nonessential motion is in progress.

A stagger can also be applied to words or cards, but do not animate every element on the page in a single continuous sequence. Group related items into a coherent scene and keep the sequence short.

## 10. Establish a Stable Animation Lifecycle

Animation setup should have an owner. In a framework component, use a GSAP context or the official React integration so animations can be reverted when the component unmounts. For vanilla JavaScript, retain references to the split instance, animation, and any event listeners so they can be cleaned up.

```js
const root = document.querySelector("[data-hero]");
let split;
let animation;

function initTextMotion() {
  if (!root) return;

  split = SplitText.create(root.querySelector("[data-title]"), {
    type: "lines"
  });

  animation = gsap.from(split.lines, {
    yPercent: 100,
    autoAlpha: 0,
    duration: 0.55,
    ease: "power2.out",
    stagger: 0.06
  });
}

function destroyTextMotion() {
  animation?.kill();
  split?.revert();
  animation = null;
  split = null;
}
```

Use `split.revert()` to restore the original text structure when the SplitText instance is no longer needed. Killing a tween does not automatically restore all split markup. Conversely, reverting the split while an animation is still running can leave the animation targeting detached wrappers. Stop or revert the animation before restoring the original markup.

**Gotcha:** Repeated initialization without cleanup creates nested wrappers and duplicate animations. Make initialization idempotent or ensure every setup path has a matching teardown.

## 11. Integrate with React Without Animating During Render

Do not create GSAP timelines or mutate the DOM inside React’s render function. Use a lifecycle hook such as `useGSAP()` or `useLayoutEffect()` according to the project’s integration pattern. Scope selectors to the component root and revert the GSAP context on teardown.

```jsx
import { useRef } from "react";
import gsap from "gsap";
import SplitText from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, useGSAP);

function AnimatedHeading({ title }) {
  const root = useRef(null);

  useGSAP(() => {
    const heading = root.current?.querySelector("[data-title]");
    if (!heading) return;

    const split = SplitText.create(heading, {
      type: "lines",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 100,
          autoAlpha: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.06
        });
      }
    });
  }, { scope: root, dependencies: [title], revertOnUpdate: true });

  return (
    <section ref={root} aria-label="Introduction">
      <h1 data-title>{title}</h1>
    </section>
  );
}
```

Treat this as an integration pattern and verify the exact SplitText import and `autoSplit` lifecycle supported by the installed version. A title prop change must trigger a safe refresh or rebuild. If a component can unmount while an animation is active, the cleanup must revert the generated wrappers and animation context.

React Strict Mode can run setup and cleanup more than once during development. If text doubles or animations restart unexpectedly, investigate lifecycle ownership and cleanup rather than disabling Strict Mode. Use stable component boundaries and do not let multiple animation systems own the same heading.

## 12. Respect Reduced Motion and Content Availability

Check `prefers-reduced-motion` before starting a nonessential text reveal. If reduced motion is requested, show the text in its final readable state immediately. Keep the content in the DOM and avoid making the primary message depend on an animation finishing.

```js
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

function revealHeading(targets) {
  if (motionPreference.matches) {
    gsap.set(targets, { clearProps: "all" });
    return null;
  }

  return gsap.from(targets, {
    autoAlpha: 0,
    y: 12,
    duration: 0.4,
    ease: "power2.out"
  });
}
```

The cleanup strategy must match the actual setup. If split wrappers have been created, revert the split instance as well. Do not rely on `clearProps` alone to restore semantic markup or remove generated spans. If the preference changes while the page is open, listen for the media query’s `change` event and switch to a stable visible state.

Use reduced motion as a first-class rendering path, not an afterthought. Keep keyboard focus visible with `:focus-visible`, preserve accessible names, and ensure text is not hidden by a clipping wrapper when animation is disabled.

## 13. Choose Easing and Distance by Content Role

Easing communicates how the motion begins and ends. For a restrained reveal, `power2.out` often provides a clear deceleration. For a layout-like entrance, `power2.inOut` may feel more balanced. Avoid springy or elastic easing on long text unless the design explicitly calls for it; bouncing letters can reduce readability.

```js
const revealTiming = {
  duration: 0.48,
  ease: "power2.out",
  stagger: 0.045
};

gsap.from(split.words, {
  y: 12,
  autoAlpha: 0,
  ...revealTiming
});
```

The numeric values are starting points, not universal constants. Tune for reading speed, viewport size, and the number of targets. Check the total sequence length and reduce the stagger for a long heading. Do not use a bare numeric ease value that has no clear meaning; name the easing curve.

Use transform and opacity for the main motion. Animating font size, line height, or width each frame can trigger layout work and create jank. If the design requires a true typographic size change, consider a discrete state change or profile the cost in DevTools.

## 14. Debug Text Animation with DevTools

When a reveal fails, inspect the generated DOM first. Confirm that the target selector returns the expected element, that SplitText produced the expected number of lines or words, and that the animation targets are connected to the document. Inspect computed styles for opacity, transform, overflow, and visibility. Then record the interaction in the Performance panel and check for layout, paint, and long tasks.

```js
function inspectSplit(target, split) {
  const style = getComputedStyle(target);
  const rect = target.getBoundingClientRect();

  console.table([{
    connected: target.isConnected,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    opacity: style.opacity,
    transform: style.transform,
    overflow: style.overflow,
    lineCount: split?.lines?.length ?? 0,
    wordCount: split?.words?.length ?? 0
  }]);
}
```

Call the helper manually during development. Do not poll layout and computed styles on every animation frame unless a profile shows a real need. In DevTools, use the Elements panel to check wrappers, the Accessibility pane to inspect the accessible name and text, and the Performance panel to identify layout churn. The Layers panel can reveal excessive compositing layers.

Test at several viewport widths and after font loading. If the split is wrong only at one width, check whether the line layout was refreshed. If text is invisible after an animation, inspect whether the tween was interrupted before opacity and transforms were restored.

## 15. Use a Semantic, Progressive Baseline

Keep semantic text in normal document flow and animate it only after the page is ready. A good baseline is a real heading and paragraph, not a set of spans with `aria-label` used to compensate for broken markup. If JavaScript fails, the user should still see and understand the text.

```html
<main>
  <section class="hero" aria-labelledby="hero-title">
    <p class="eyebrow">Independent digital studio</p>
    <h1 id="hero-title" data-animated-heading>
      Design with intent. Build with care.
    </h1>
    <p class="hero__summary">
      Thoughtful interfaces for useful products.
    </p>
    <a class="hero__link" href="/work">Explore selected work</a>
  </section>
</main>
```

Do not hide the heading in CSS before JavaScript initializes. If you need an initial hidden state for a reveal, apply it only after confirming that motion is allowed and the animation setup has succeeded. If the script fails, restore visibility. Avoid hiding the main heading indefinitely while waiting for a remote font or plugin.

Keep interactive text as one link or button. Do not add `tabindex` to every character wrapper. Use `aria-hidden="true"` only for truly decorative duplicate content, not for the sole readable version.

## 16. Patterns for Production Text Motion

### Pattern 1 — Line Reveal

**What it does:** Reveals each heading line from below its final position.
**When to use:** A short hero heading whose hierarchy benefits from a controlled entrance.
**Implementation:**

```js
const split = SplitText.create(heading, {
  type: "lines",
  linesClass: "text-line"
});

const tween = gsap.from(split.lines, {
  yPercent: 100,
  autoAlpha: 0,
  duration: 0.55,
  ease: "power3.out",
  stagger: 0.07
});
```

Pair the line wrappers with a local clipping strategy. Confirm the line height and baseline are not cut off, and ensure the animation is skipped for reduced motion.

### Pattern 2 — Word Stagger

**What it does:** Reveals a short phrase word by word.
**When to use:** A brief display title or a decorative statement, not long body copy.
**Implementation:**

```js
const split = SplitText.create(heading, { type: "words" });

gsap.from(split.words, {
  y: 10,
  autoAlpha: 0,
  duration: 0.42,
  ease: "power2.out",
  stagger: 0.04
});
```

Keep the sequence short enough that the phrase becomes readable quickly. Test screen-reader output and text selection.

### Pattern 3 — Whole-Block Entrance

**What it does:** Fades and slightly translates a whole text block.
**When to use:** Paragraphs, supporting copy, labels, and instructional content.
**Implementation:**

```js
gsap.from("[data-supporting-copy]", {
  autoAlpha: 0,
  y: 8,
  duration: 0.35,
  ease: "power2.out"
});
```

This pattern avoids fragmenting the text into many wrappers and is usually preferable when reading speed matters more than typographic spectacle.

### Pattern 4 — Font-Ready Line Split

**What it does:** Waits for the document’s fonts before measuring line boundaries.
**When to use:** A title whose exact line layout is part of the art direction.
**Implementation:**

```js
await document.fonts.ready;
const split = SplitText.create(heading, {
  type: "lines",
  autoSplit: true
});
```

Keep the semantic heading visible while waiting. Confirm that the chosen SplitText version supports the options used and that a late font change does not leave stale wrappers.

### Pattern 5 — Reduced-Motion Fallback

**What it does:** Leaves text readable without a spatial reveal.
**When to use:** Any nonessential animated heading or word sequence.
**Implementation:**

```js
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!reduceMotion.matches) {
  gsap.from(targets, {
    autoAlpha: 0,
    y: 10,
    duration: 0.35,
    ease: "power2.out"
  });
}
```

Ensure the default CSS is visible and that the reduced-motion path does not leave hidden styles from an earlier initialization.

### Pattern 6 — Cleanup-Safe Split Lifecycle

**What it does:** Restores original text markup after the component is removed or rebuilt.
**When to use:** Framework components, route transitions, or dynamic headings.
**Implementation:**

```js
let split;
let tween;

function teardown() {
  tween?.kill();
  split?.revert();
  tween = null;
  split = null;
}
```

Call teardown before recreating wrappers. Confirm no animation still targets nodes after the split is reverted.

### Pattern 7 — Short Wordmark Accent

**What it does:** Adds a brief character-level entrance to a short decorative wordmark.
**When to use:** A logo-like display element where character motion is central to the identity.
**Implementation:**

```js
const split = SplitText.create(wordmark, { type: "chars" });

gsap.from(split.chars, {
  yPercent: 55,
  autoAlpha: 0,
  duration: 0.28,
  ease: "power2.out",
  stagger: 0.016
});
```

Use only for brief text. Verify selection and assistive technology behavior, and keep the meaningful accessible name intact.

### Pattern 8 — Responsive Re-split

**What it does:** Rebuilds line wrappers when the rendered line layout changes.
**When to use:** A title whose line breaks change substantially across responsive widths.
**Implementation:**

```js
const split = SplitText.create(heading, {
  type: "lines",
  autoSplit: true,
  onSplit(self) {
    return gsap.from(self.lines, {
      yPercent: 100,
      autoAlpha: 0,
      duration: 0.42,
      ease: "power2.out",
      stagger: 0.05
    });
  }
});
```

Use the documented lifecycle behavior for the installed plugin version. Do not attach an unbounded resize listener or re-run splitting for every tiny viewport change without a refresh strategy.

## 17. Mistakes and Corrective Actions

| Mistake | Why it fails | Corrective action |
|---|---|---|
| Splitting a long paragraph into characters | Reading becomes slow and attention is fragmented | Animate the whole block or a few lines |
| Hiding text before plugin initialization | A failed script leaves content invisible | Keep baseline text visible and add motion progressively |
| Splitting before fonts load | Line wrappers no longer match actual line breaks | Wait for fonts or use documented auto-splitting |
| Ignoring resize changes | Stale wrappers clip or misalign text | Re-split safely when layout changes |
| Creating wrappers on every render | Markup becomes nested and animation repeats | Own the split lifecycle and revert before rebuilding |
| Killing only the tween | Generated wrappers and inline styles may remain | Kill/revert animation and call `split.revert()` |
| Animating every character by default | Text is difficult to scan | Choose the largest reveal unit that works |
| Giving character spans focus | Keyboard navigation becomes unusable | Keep one semantic heading or control |
| Duplicating visible accessible text | Assistive technology may read content twice | Expose one semantic copy and hide only decorative duplicates |
| Clipping the entire hero | Focus rings or adjacent content disappear | Clip only the animated line wrapper |
| Using excessive stagger | The message arrives too slowly | Calculate total sequence duration and shorten delays |
| Animating width or font size per frame | Layout work can cause jank | Prefer transform/opacity or profile the requirement |
| Applying `will-change` permanently | Extra layers consume memory | Apply only around measured animation needs |
| Using a global selector on multiple headings | Unrelated components animate together | Scope selectors to a component root |
| Ignoring reduced motion | Movement can be uncomfortable | Skip spatial motion and show final content |
| Leaving opacity at zero after interruption | Text remains hidden | Restore final styles during cleanup |
| Replacing a heading with span fragments | Semantics and accessible name may break | Preserve the original heading and inspect the accessibility tree |
| Ignoring link/button semantics | Interactive labels become fragmented | Keep one control with a stable accessible name |
| Assuming `autoSplit` exists in every version | Unsupported options may be ignored or fail | Verify the installed SplitText API |
| Rebuilding on every resize pixel | Excessive work and visual flicker | Use documented refresh behavior or a controlled resize strategy |
| Not testing text selection | Generated wrappers can alter selection behavior | Test copy/paste and choose a simpler reveal if needed |
| Using unexplained numeric easing | Motion tuning becomes difficult to reason about | Name the easing curve explicitly |
| Hiding content while fonts load | Slow network delays meaningful content | Keep the semantic baseline visible |
| Ignoring font-weight changes | Text may reflow after the split | Test the actual final font family and weight |
| Treating a visual reveal as status feedback | Users may miss state changes | Use semantic status text or announcements when needed |

## 18. Mental Models

1. **Reveal the idea, not every glyph.** Choose a split unit based on content and reading effort.
2. **Semantic text is the source of truth.** Generated wrappers are temporary animation scaffolding.
3. **Motion is progressive enhancement.** The content must work if JavaScript or the plugin fails.
4. **Font metrics define lines.** Character counts cannot predict rendered line breaks.
5. **Stagger is total time.** Duration and delay accumulate into a reading delay.
6. **The component owns the animation.** Setup and teardown must be paired.
7. **A hidden heading is a failure mode.** Keep the baseline visible until the animation can safely run.
8. **Focus belongs to controls.** Character wrappers are not extra keyboard stops.
9. **Reduced motion changes the path.** It should not change whether the content exists.
10. **Transform is a visual bridge.** Avoid per-frame layout changes unless profiling justifies them.
11. **Responsive splitting is lifecycle work.** Refresh wrappers when line layout truly changes.
12. **Accessibility must be tested.** Inspect the accessibility tree, not only the visual DOM.
13. **Motion should not gate interaction.** Navigation and essential actions remain available.
14. **Cleanup restores content.** Kill active tweens before reverting split markup.

## 19. Build Challenge: Create an Accessible Animated Hero

Build a hero with a heading, supporting copy, and a call-to-action. The heading uses a line reveal on standard motion settings; the paragraph appears as a whole block; the link remains immediately usable.

1. Use semantic `<main>`, `<section>`, `<h1>`, `<p>`, and `<a>` elements.
2. Keep the complete heading visible in the initial HTML and CSS.
3. Import and register GSAP and SplitText from the installed version.
4. Scope selectors to the hero component root.
5. Wait for fonts or use supported automatic splitting before relying on line boundaries.
6. Animate the heading by line rather than character.
7. Animate the paragraph as a whole block or keep it static.
8. Use a named ease such as `power2.out` or `power3.out`.
9. Calculate the full reveal time including stagger delays.
10. Keep the call-to-action reachable and usable during the reveal.
11. Add a reduced-motion path that displays the final state without spatial movement.
12. Preserve a visible `:focus-visible` indicator on the link.
13. Revert SplitText wrappers during teardown or when the heading changes.
14. Test a late-loading font and a responsive breakpoint that changes line count.
15. Test browser zoom and a narrow viewport.
16. Inspect the accessibility tree to confirm the heading is exposed once.
17. Test selecting and copying the heading text.
18. Test a missing target selector without throwing a fatal error.
19. Use DevTools to inspect generated wrappers and computed opacity/transform.
20. Record a Performance trace and check for layout churn or excessive layer creation.
21. Verify behavior in supported Safari, Firefox, and Chromium versions.
22. Confirm that the hero remains readable if GSAP or SplitText fails to load.

### Test matrix

| Scenario | Expected result |
|---|---|
| JavaScript disabled | All text remains visible |
| SplitText import fails | No blank heading or paragraph |
| Reduced motion enabled | Text is readable without spatial reveal |
| Font loads late | Line boundaries refresh safely |
| Viewport width changes | Text reflows without stale clipping |
| Component unmounts | Generated wrappers are reverted |
| Title prop changes | Previous split and tween are cleaned up |
| Keyboard-only use | Link remains reachable and visibly focused |
| Screen reader use | Heading is exposed as meaningful text once |
| Copy/paste | Heading text remains coherent |
| Rapid route change | No stale animation targets remain |
| Performance trace | No avoidable layout churn or severe jank |

## Definition of Done

- [ ] The original semantic text remains meaningful before, during, and after animation.
- [ ] The reveal unit is chosen for the content’s reading effort.
- [ ] Plugin imports and options match the installed GSAP version.
- [ ] Split wrappers are reverted during cleanup and before unsafe reinitialization.
- [ ] Late fonts and responsive line changes are handled.
- [ ] Reduced-motion preferences produce a complete, readable final state.
- [ ] Keyboard focus, accessible names, and text selection are tested.
- [ ] Essential links and controls do not wait for decorative motion.
- [ ] Selectors are scoped to the component and no duplicate animation owners exist.
- [ ] DevTools confirms correct wrappers, styles, and performance.
- [ ] Missing-target and plugin-failure cases leave the content visible.
- [ ] Supported Safari, Firefox, and Chromium versions have been tested.

## Quick Reference

| Need | Use | Caution |
|---|---|---|
| Animate whole heading | `gsap.from(heading, vars)` | Keep the baseline visible |
| Split lines | `SplitText.create(target, { type: "lines" })` | Lines depend on actual font metrics |
| Split words | `type: "words"` | Best for short phrases |
| Split characters | `type: "chars"` | Use sparingly and test accessibility |
| Register plugin | `gsap.registerPlugin(SplitText)` | Verify package and version |
| Stagger targets | `stagger: 0.05` | Calculate total sequence duration |
| Use named easing | `ease: "power2.out"` | Tune for reading comfort |
| Re-split responsively | Supported `autoSplit` / refresh lifecycle | Verify installed API |
| Wait for fonts | `document.fonts.ready` | Keep content visible while waiting |
| Revert wrappers | `split.revert()` | Stop active tween first |
| Stop an animation | `tween.kill()` | Killing does not restore split markup |
| Scope a component | `root.querySelector(...)` | Avoid global selector collisions |
| Reduced motion | `matchMedia("(prefers-reduced-motion: reduce)")` | Keep final content available |
| Focus styling | `:focus-visible` | Do not clip the focus ring |
| Inspect dimensions | `getBoundingClientRect()` | Use for debugging, not per-frame polling |
| Inspect computed CSS | `getComputedStyle()` | Check opacity, transform, overflow |
| Diagnose DOM | DevTools Elements panel | Confirm wrappers and semantics |
| Diagnose accessibility | DevTools Accessibility pane | Check the accessible name and text |
| Diagnose jank | Performance panel | Look for layout and paint |
| Inspect layers | Layers panel | Avoid unnecessary layer promotion |
| CSS feature fallback | `@supports` | Does not verify GSAP availability |
| Browser coverage | Safari, Firefox, Chromium, caniuse | Test the actual supported matrix |

## Final Operating Rule

Animate text to clarify hierarchy and guide attention, not to delay reading. Keep semantic content visible, choose a reveal unit that suits the message, refresh splits when font metrics change, respect reduced motion, and restore the original DOM when the animation lifecycle ends.


## Field Notes: Font Loading, Layout Stability, and Localization

Typography is geometry. A font family, font weight, variable-font axis, letter spacing, and available inline size all influence where words wrap. A line split created before the final font is active can become invalid when the font loads. If the page animates a line wrapper based on stale measurements, the result may include clipped descenders, unexpected extra lines, or text that crosses its mask.

For a hero where exact line composition is part of the design, await `document.fonts.ready` before creating the split, but do not hide the semantic text while waiting. Treat the wait as a measurement prerequisite, not a content prerequisite. If a font request fails, the fallback font must still display a complete heading. If the design uses variable fonts, test the actual weight and axis values that will be applied at runtime.

Localization changes the shape and length of text. A title that fits in two lines in English may need four lines in another language. Do not hard-code a fixed number of line wrappers or assume every word has a space separator. Test languages and writing systems relevant to the product, and choose a whole-block reveal if the split behavior is not robust enough.

Browser zoom and text-only zoom can also change line count. A reliable implementation responds to the rendered geometry instead of relying on a single desktop screenshot. Validate the layout after changing viewport width, font loading order, zoom level, and text content.

## Field Notes: Interaction and Content Timing

The text animation should not block the user’s ability to act. A call-to-action in a hero can be visually secondary to the heading, but it should not be disabled for the duration of a decorative reveal. If the interface has a meaningful loading state, represent that state explicitly. Do not use hidden text as a substitute for loading or readiness semantics.

For a text label inside a button, keep the accessible name stable while animating a decorative layer. A button whose visible characters appear independently may still be one keyboard stop, but its accessible name and text selection must be checked. Do not put `aria-hidden="true"` on the only meaningful label. If a duplicate layer is used for a special visual effect, ensure the duplicate is genuinely decorative and does not create a second accessible name.

When an animation is interrupted, the final visual state must remain readable. Decide whether to complete, kill, or replace the tween, and then restore styles if the target will not be animated again. Avoid a setup where a second click creates a new SplitText instance around markup that has not been reverted.

## Field Notes: Choosing Between CSS and GSAP

Use CSS transitions or keyframes when the text element can animate as a whole and the state is simple. Use GSAP when a coordinated timeline, stagger, interruption policy, or integration with other animation systems is genuinely valuable. Use SplitText only when line, word, or character targets are needed. The plugin is not required for every heading entrance.

Avoid animating layout properties such as `width`, `height`, `top`, and `left` every frame. Prefer `transform` and `opacity` for the visual movement. This is not an absolute rule: the browser may need to calculate layout for certain typographic effects, but that cost should be measured. A large amount of text with many individually animated characters can create substantial DOM and style work even when each tween uses transform.

Do not apply `will-change` to every character in a long sentence. It may promote many elements to layers, increasing memory pressure. Use DevTools Performance and Layers panels to understand the actual cost. If the animation causes jank, first reduce the number of animated targets and simplify the effect before adding optimization hints.

## Field Notes: Debugging Sequence

When text disappears or wraps incorrectly, debug in a stable order:

1. Confirm the semantic heading exists in the Elements panel and contains the expected text.
2. Confirm the target selector returns exactly one intended heading.
3. Confirm the SplitText instance produced the expected number of lines, words, or characters.
4. Inspect computed `opacity`, `visibility`, `transform`, `overflow`, `display`, and `line-height`.
5. Confirm the intended font has loaded and the container width is correct.
6. Check whether a resize or font change happened after the split was created.
7. Check whether the tween was killed, interrupted, or reverted before completion.
8. Confirm reduced-motion logic did not leave initial hidden styles applied.
9. Inspect the accessibility tree to confirm the heading is exposed once.
10. Record a Performance trace if the animation is slow, and check for repeated layout and paint.

A small helper can report the relevant state without changing it. Keep it behind a development-only action and do not log every frame.

```js
function diagnoseTextTarget(target, split) {
  if (!target) {
    console.warn("Text animation target is missing");
    return null;
  }

  const style = getComputedStyle(target);
  const rect = target.getBoundingClientRect();
  const result = {
    connected: target.isConnected,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    font: style.font,
    lineHeight: style.lineHeight,
    opacity: style.opacity,
    transform: style.transform,
    overflow: style.overflow,
    lines: split?.lines?.length ?? 0,
    words: split?.words?.length ?? 0
  };

  console.table([result]);
  return result;
}
```

## Field Notes: Browser Support and Failure Modes

Check the current GSAP SplitText documentation for the version in use, especially for automatic splitting, accessibility-related behavior, and responsive refreshes. A sample written for a newer version may include options not supported by an older package. Pin the package version and test the production build rather than relying only on a development server.

Test in Safari, Firefox, and Chromium when those browsers are in the support matrix. Inspect actual text rendering and line wrapping rather than assuming a plugin issue whenever a screenshot differs. Browser support for CSS features can be checked through caniuse or `@supports`, but neither confirms that GSAP and SplitText have been imported, registered, and initialized correctly.

The fallback should be ordinary visible text. If a plugin fails to load, a target selector is missing, or the component unmounts mid-animation, the page should still communicate the heading and its supporting content. Treat animation as a visual enhancement that can fail safely.
