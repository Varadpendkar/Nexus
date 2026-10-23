# SKILL: accessible-animation
**Layer:** 29 — Accessibility Implementation
**Goal:** Create motion that supports comprehension and feedback while respecting reduced-motion preferences, vestibular sensitivity, keyboard use, and performance constraints.

---

## Why This Matters (Senior Perspective)
Motion can make a creative site feel responsive, but can also trigger dizziness, nausea, migraines, distraction, or loss of context. Production failures include parallax heroes that cannot be reduced, auto-playing loops that continue indefinitely, scroll-jacking that blocks navigation, and animated content that moves focus or flashes rapidly. Senior motion implementation separates meaning from spectacle: essential state changes remain understandable without animation; transitions never delay content access; and users requesting reduced motion receive a deliberate alternative. Respect `prefers-reduced-motion`, provide pause/stop controls for qualifying moving content, avoid hazardous flashing, keep focus stable, and profile performance because jank makes interaction less predictable.

---

## Core Concepts

### 1 Reduced motion
Use `prefers-reduced-motion: reduce` to remove nonessential travel, parallax, zoom, and loops while retaining clear state feedback.

**Implementation pattern**

```html
 .hero-art{animation:float 8s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-1rem)}}
@media (prefers-reduced-motion:reduce){.hero-art{animation:none;transform:none}}
```

**Gotcha:** Reducing duration to a tiny value may preserve unnecessary complexity; remove the effect explicitly.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 2 State before motion
Make content available and expose its state before animation begins. Motion is presentation, not a prerequisite for interaction.

**Implementation pattern**

```javascript
function revealDetails(panel,trigger){
 trigger.setAttribute("aria-expanded","true");panel.hidden=false;
 // State is available immediately; the transition is optional presentation.
 panel.classList.add("is-visible");
}
```

**Gotcha:** If content stays hidden until an animation completes, cancelled scripts can block access.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 3 Safe transition properties
Prefer `transform` and `opacity` for routine motion because they often avoid layout recalculation. Measure exceptions that animate layout.

**Implementation pattern**

```html
 .project-card{opacity:1;transform:translateY(0);transition:transform 180ms ease-out,opacity 180ms ease-out}
.project-card.is-entering{opacity:0;transform:translateY(.5rem)}
@media (prefers-reduced-motion:reduce){.project-card{transition:none}}
```

**Gotcha:** Excess `will-change` layers consume memory and can worsen mobile performance.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 4 Flashing hazards
Avoid rapid high-contrast flashing and strobe effects. Assess frequency, area, and contrast for unavoidable flashing content.

**Implementation pattern**

```html
@keyframes notification-pulse{0%,100%{opacity:1}50%{opacity:.75}}
.notification{animation:notification-pulse 1.2s ease-in-out 2}
@media (prefers-reduced-motion:reduce){.notification{animation:none}}
```

**Gotcha:** Rapid saturated color changes can be hazardous even when each transition is short.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 5 Pause and stop controls
Long-running automatic motion may require a pause, stop, or hide mechanism. Controls must be keyboard-operable and persistent.

**Implementation pattern**

```javascript
<section><h2>Latest updates</h2><button id="ticker-toggle" aria-pressed="false">Pause updates</button><p id="ticker-content">New case study published.</p></section>
<script>
let paused=false;
document.querySelector("#ticker-toggle").addEventListener("click",event=>{
 paused=!paused;event.currentTarget.setAttribute("aria-pressed",String(paused));
 event.currentTarget.textContent=paused?"Resume updates":"Pause updates";
});
</script>
```

**Gotcha:** A pause button that only hides visuals while timers continue is not a real pause.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 6 Scroll reveals
Content should be visible by default; animation can progressively decorate it when JavaScript runs.

**Implementation pattern**

```html
 .reveal{opacity:1;transform:none}
.js .reveal.is-pending{opacity:0;transform:translateY(1rem)}
@media (prefers-reduced-motion:reduce){.js .reveal.is-pending{opacity:1;transform:none}}
```

**Gotcha:** A failed script must not leave content permanently invisible.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 7 Parallax
Large foreground/background movement can cause discomfort. Remove parallax under reduced motion and consider making it opt-in.

**Implementation pattern**

```html
@media (prefers-reduced-motion:no-preference){.parallax-layer{transform:translate3d(0,var(--parallax-offset,0),0)}}
@media (prefers-reduced-motion:reduce){.parallax-layer{transform:none!important}}
```

**Gotcha:** Scroll-linked movement may feel stronger on touch devices and nested scroll areas.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 8 GSAP preference handling
Use `gsap.matchMedia()` to scope timelines to motion preferences and clear animation-specific styles in the reduced branch.

**Implementation pattern**

```javascript
const motionScope=gsap.matchMedia();
motionScope.add("(prefers-reduced-motion: no-preference)",()=>{gsap.from(".case-study-title",{y:24,opacity:0,duration:.5,ease:"power2.out"})});
motionScope.add("(prefers-reduced-motion: reduce)",()=>{gsap.set(".case-study-title",{clearProps:"all"})});
```

**Gotcha:** A timeline created before preference checks may still run.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 9 Focus and overlays
Set focus when a dialog becomes available, not after an entrance animation ends. Restore focus after close.

**Implementation pattern**

```javascript
function openAnimatedDialog(dialog,trigger){
 dialog.showModal();
 // Keyboard access begins immediately; visual movement must not gate it.
 dialog.querySelector("[data-initial-focus]")?.focus();
 dialog.addEventListener("close",()=>{if(trigger.isConnected)trigger.focus()},{once:true});
}
```

**Gotcha:** Cancelled animations can prevent an `animationend`-based focus routine from running.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 10 Media
Video needs controls, captions when speech is meaningful, and a poster or text alternative. Avoid autoplay with sound.

**Implementation pattern**

```html
<video controls muted playsinline poster="/media/demo-poster.webp">
<source src="/media/product-demo.mp4" type="video/mp4">
<track kind="captions" src="/media/product-demo.en.vtt" srclang="en" label="English">
Your browser does not support embedded video.</video>
```

**Gotcha:** Muted autoplay is not a substitute for user control over long-running motion.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 11 Canvas and WebGL
Provide a text alternative for meaningful visuals and a pause control for continuous decorative rendering.

**Implementation pattern**

```html
<figure><canvas id="network-visual" aria-hidden="true"></canvas><figcaption>Illustration of connected research topics.</figcaption></figure>
<button id="pause-motion" aria-pressed="false">Pause background animation</button>
```

**Gotcha:** `aria-hidden=true` is suitable only if the canvas is decorative or its meaning is supplied elsewhere.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 12 Performance and jank
Keep frame callbacks lightweight, cap canvas pixel ratio, and avoid repeated layout reads/writes inside animation loops.

**Implementation pattern**

```javascript
let frameId=0;
function renderFrame(){canvasContext.clearRect(0,0,canvas.width,canvas.height);drawNetworkFrame();frameId=requestAnimationFrame(renderFrame)}
function stopNetworkAnimation(){cancelAnimationFrame(frameId)}
```

**Gotcha:** Continuous work in hidden tabs wastes CPU and battery.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 13 Preference testing
Test reduced motion before load, after load, and during interaction. Include hover, loading, carousels, page transitions, and background loops.

**Implementation pattern**

```javascript
const motionPreference=window.matchMedia("(prefers-reduced-motion: reduce)");
function applyMotionPreference(event){document.documentElement.dataset.motion=event.matches?"reduced":"full"}
applyMotionPreference(motionPreference);
motionPreference.addEventListener("change",applyMotionPreference);
```

**Gotcha:** A hero-only media query misses other animation systems.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 14 Essential motion alternatives
Preserve useful progress and state information using text, labels, or immediate state changes when motion is removed.

**Implementation pattern**

```html
<div class="upload-status"><progress id="upload-progress" value="45" max="100">45%</progress>
<p id="upload-copy" role="status">Uploading document: 45% complete.</p></div>
```

**Gotcha:** A spinner alone communicates neither progress nor recovery.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

---

## Relevant Patterns / Integration Patterns

### Pattern 1 — Reduced-motion CSS branch
What it does and when to use it: Removes nonessential movement. Use for reveals and hover effects.

```html
.reveal{opacity:1;transform:none;transition:opacity .2s ease,transform .2s ease}
@media (prefers-reduced-motion:reduce){.reveal{transition:none;transform:none}}
```

### Pattern 2 — Preference-aware GSAP
What it does and when to use it: Creates motion only when the preference allows it. Use for title entrances.

```html
const motionContext=gsap.matchMedia();motionContext.add("(prefers-reduced-motion: no-preference)",()=>{gsap.from(".project-title",{y:20,opacity:0,duration:.45,ease:"power2.out"})});motionContext.add("(prefers-reduced-motion: reduce)",()=>gsap.set(".project-title",{clearProps:"all"}));
```

### Pattern 3 — Pauseable canvas
What it does and when to use it: Gives users control over continuous motion. Use for WebGL backgrounds.

```html
let paused=false;function frame(){if(!paused)drawFrame();requestAnimationFrame(frame)}document.querySelector("#pause-motion").addEventListener("click",event=>{paused=!paused;event.currentTarget.setAttribute("aria-pressed",String(paused))});
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Reduced motion only slows | Unwanted travel still occurs. | Remove parallax and present final state directly. |
| Hidden until JS reveals | Failed script leaves content invisible. | Make content visible by default. |
| Focus waits for animation | Cancelled event blocks access. | Focus immediately and animate independently. |
| Loop has no pause | Decorative motion competes with reading. | Add a persistent pause control or remove the loop. |
| Layout properties animate | Repeated layout causes jank. | Prefer transform/opacity and profile exceptions. |
| Parallax ignores preference | Only author’s setup was tested. | Remove travel in reduced-motion branch. |
| Spinner has no status | Movement carries all progress meaning. | Add text status and recovery instructions. |
| Stale reduced styles | Setup and cleanup are separate. | Use scoped matchMedia cleanup or clear properties. |
| Canvas cannot pause | Loop has no state control. | Store pause state and cancel scheduled frames. |
| Flash not assessed | Smoothness is mistaken for safety. | Remove strobes and assess frequency, area, contrast. |
| Video lacks captions | Visual design omitted media needs. | Provide captions, controls, poster, and alternative. |
| Hidden tab keeps animating | Loop ignores page visibility. | Suspend expensive frames while hidden. |
| Transition gates content | Motion is treated as prerequisite. | Expose semantic state before transition. |
| Preference checked only once | Runtime changes ignored. | Listen to media-query changes and update safely. |

---

## Mental Models

1. **State first, motion second** — tasks must work without transitions.
2. **Reduced motion is an alternate design** — remove unnecessary travel, not just duration.
3. **Focus must not wait for pixels** — access starts when semantic UI exists.
4. **Continuous motion needs ownership** — users should control distracting loops.
5. **Performance is usability** — jank makes interaction unpredictable.
6. **Progressive enhancement keeps content available** — animation failure cannot hide content.
7. **Decorative canvas needs a semantic neighbor** — meaningful visuals need alternatives.

---

## Quick Reference

| Situation | Recommended implementation | Verification note |
|---|---|---|
| Preference | Reduced-motion media query | Every component |
| Transition | Transform/opacity | Profile performance |
| Parallax | Remove travel | OS preference |
| Long motion | Pause/stop/hide | Keyboard accessible |
| Reveal | Visible by default | Works without JS |
| GSAP | `gsap.matchMedia()` | Scoped cleanup |
| Dialog | Focus immediately | No animation gate |
| Video | Controls/captions/poster | No autoplay sound |
| Canvas | Text alternative or decorative | Pause loop |
| Flashing | Avoid strobes | Assess risk |
| Hidden tab | Pause frames | Resume safely |
| Progress | Text + progress element | Spinner insufficient |
| Preference change | Listen to media query | No stale state |
| DevTools | Performance profile | Find jank |
| Fallback | Immediate final state | Task still works |

---

## Build Challenge

Build a portfolio hero and case-study reveal system with CSS/GSAP motion, looping decorative canvas, and a modal that remains usable with reduced motion.

### Numbered requirements

1. Keep content visible if animation setup fails.
2. Provide reduced-motion branches for animated components.
3. Remove nonessential parallax under reduced motion.
4. Prefer transform/opacity and profile jank.
5. Set dialog focus immediately.
6. Provide pause/stop for continuous decorative motion.
7. Pause expensive work when document is hidden.
8. Provide captions and controls for meaningful video.
9. Avoid hazardous flashing patterns.
10. Provide semantic alternative for meaningful canvas/WebGL.
11. Test preference before load and at runtime.
12. Cancel entrance animation and verify content remains usable.

### Definition of done

- [ ] All core tasks work with keyboard only.
- [ ] Focus order and visibility remain predictable at zoom and mobile widths.
- [ ] Names, roles, states, and relationships are checked with assistive technology.
- [ ] No critical automated accessibility findings remain unresolved.
- [ ] The injected failure case has a documented recovery path.
- [ ] Semantic HTML is preferred over unnecessary ARIA.
- [ ] WCAG 2.1 AA criteria are reviewed against the actual experience.
- [ ] A manual test log records browser, assistive technology, and outcomes.

---

## Browser Support and Debugging

Test current Chromium, Firefox, and Safari where supported; include iOS Safari and Android Chrome when mobile is in scope. Browser and assistive-technology combinations expose different details, so one browser is not universal proof. Use DevTools Accessibility panes to inspect computed roles, names, states, and relationships. Inspect `document.activeElement` for focus defects and `getComputedStyle()` for color and motion. For animation, profile the Performance panel and check dropped frames, long tasks, paint, and compositing. Use `@supports` only for real CSS capability differences; it cannot verify semantic behavior.

```javascript
function inspectAccessibilityState(selector) {
  const elements = [...document.querySelectorAll(selector)];
  console.table(elements.map((element) => ({
    tag: element.tagName.toLowerCase(), id: element.id,
    role: element.getAttribute('role') || '(native)',
    label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 50),
    expanded: element.getAttribute('aria-expanded'), invalid: element.getAttribute('aria-invalid'),
    focused: element === document.activeElement, visible: element.getClientRects().length > 0
  })));
}
inspectAccessibilityState('button, a[href], input, select, textarea, [role]');
```

## Production Checklist

- Review WCAG 2.1 AA as a minimum target; consider AAA where appropriate.
- Prefer native HTML before ARIA and follow WAI-ARIA 1.2 and the Authoring Practices Guide for custom widgets.
- Check keyboard navigation, screen-reader announcements, focus, contrast, and reduced motion together.
- Confirm browser support and graceful fallback for custom interactions.
- Document limitations and test real tasks rather than relying on audit scores.

## Further Reading

- W3C Web Content Accessibility Guidelines (WCAG) 2.2.
- WAI-ARIA 1.2 specification and WAI-ARIA Authoring Practices Guide.
- MDN documentation for semantic HTML, `:focus-visible`, `prefers-reduced-motion`, and the accessibility tree.
- axe-core and browser DevTools accessibility inspectors.


### Advanced field note — Production implementation

Create a motion inventory before implementation: trigger, purpose, duration, travel distance, repetition, and reduced-motion alternative. Mark which motion communicates state and which is decorative. If an animation has no user-facing purpose, remove it. If it communicates state, make that state available immediately in semantics and content. If decorative, make it suppressible and keep it from interfering with focus or reading.

### Advanced field note — Production implementation

Reduced-motion behavior should be designed, not bolted on. A parallax scene can become a static layered composition. A route transition can become an immediate content swap. A progress animation should preserve textual progress. A 3D object can provide a static poster and direct controls. Users who request reduced motion may still benefit from non-moving feedback; remove unnecessary movement while retaining understandable state.

### Advanced field note — Production implementation

Use animation libraries with lifecycle cleanup. GSAP contexts and matchMedia helpers scope animations to components and preference branches. On unmount, revert timelines and listeners; do not leave scroll triggers running for removed nodes. For CSS, make the default state visible and let JavaScript classes decorate the transition. If a script fails, content remains available.

### Advanced field note — Production implementation

Continuous animation needs a control and performance strategy. For canvas and WebGL, pause the frame loop when paused, when the page is hidden, and when the component is not visible where appropriate. Cap device pixel ratio for decorative rendering and avoid expensive full-screen blur. Lower CPU/GPU load improves battery life and can make interaction more stable on mobile.

### Advanced field note — Production implementation

Test the full experience with reduced motion before load, after load, and during route changes. Include hover transitions, loading indicators, carousels, text reveals, page transitions, and background visuals. Inspect whether content remains at opacity zero, focus depends on `transitionend`, or JavaScript continues drawing after motion is disabled. One media query on the hero is not enough.

### Practice scenario 1 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 2 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 3 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 4 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 5 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 6 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 7 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 8 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 9 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 10 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 11 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 12 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 13 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 14 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 15 — Failure-resistant delivery

A portfolio uses scroll reveals, a looping network canvas, and an animated modal. With reduced motion enabled, reveal content must be visible without waiting for an observer, canvas should pause or render a static frame, and modal must receive focus immediately. Cancel the animation event in DevTools and verify no content stays transparent or keyboard-inaccessible. Profile mobile performance and suspend frame loops while hidden. If animation communicates progress, replace movement with text and a semantic progress element. This tests reduced motion, graceful failure, focus timing, and performance.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

## Self-review notes

This file is scoped to Layer 29 accessibility implementation. Run the project review script against the saved file before release and manually verify thresholds, code accuracy, unique fixes, and every applicable criterion. Automated checks support review but do not replace task-based keyboard and assistive-technology testing.
