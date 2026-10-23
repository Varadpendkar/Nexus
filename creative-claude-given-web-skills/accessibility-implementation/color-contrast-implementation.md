# SKILL: color-contrast-implementation
**Layer:** 29 — Accessibility Implementation
**Goal:** Implement readable text, meaningful controls, focus indicators, and non-text information that meet measurable contrast requirements across themes and states.

---

## Why This Matters (Senior Perspective)
Contrast defects survive visual review because the interface looks attractive on one calibrated monitor. Light gray body text, translucent labels over photography, subtle focus rings, gradient buttons, and status colors can become unreadable in bright environments or for people with low vision or color-vision differences. Senior implementation treats contrast as measurable, not subjective. WCAG 2.1 AA requires at least 4.5:1 for normal text and 3:1 for large text; meaningful UI components and graphical objects generally need 3:1 against adjacent colors under non-text contrast guidance. Evaluate rendered colors including opacity, gradients, hover states, borders, focus indicators, and dark themes. Color must not be the only way to communicate status.

---

## Core Concepts

### 1 Contrast ratio
Contrast compares relative luminance; the ratio ranges from 1:1 to 21:1. Use a trusted checker rather than estimating from hue.

**Implementation pattern**

```html
:root{--text-primary:#172033;--surface-primary:#ffffff;--text-muted:#4b5563;--link:#0645ad}
body{color:var(--text-primary);background:var(--surface-primary)}
a{color:var(--link)}
```

**Gotcha:** Saturated colors can still have poor contrast against similar-luminance backgrounds.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 2 Text thresholds
Use 4.5:1 for normal text and 3:1 for large text at WCAG AA. Large text is generally at least 24 CSS px regular or about 18.66 CSS px bold.

**Implementation pattern**

```html
 .card-description{color:#4b5563;font-size:1rem;line-height:1.6}
.hero-title{color:#fff;font-size:clamp(2.5rem,6vw,4.5rem)}
```

**Gotcha:** Bold text does not automatically qualify as large; verify actual size.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 3 Non-text controls
Meaningful boundaries, selected states, icons, and focus indicators generally need 3:1 against adjacent colors when they communicate information.

**Implementation pattern**

```html
button{color:#fff;background:#174ea6;border:2px solid #174ea6}
button:focus-visible{outline:3px solid #111827;outline-offset:3px}
```

**Gotcha:** Readable button text does not guarantee a distinguishable button boundary.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 4 Color redundancy
Pair color with text, shape, icon, pattern, or position. Errors need explicit wording and selected filters need more than a hue change.

**Implementation pattern**

```html
<p class="field-error" id="email-error"><strong>Error:</strong> Enter a valid email address.</p>
<style>.field-error{color:#9b1c1c;border-inline-start:4px solid #9b1c1c;padding-inline-start:.75rem}</style>
```

**Gotcha:** A red border alone may be indistinguishable and gives no recovery instruction.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 5 Opacity and compositing
Opacity blends foreground with the surface behind it. A token that passes on white may fail over photography or a tinted surface.

**Implementation pattern**

```html
 .hero-caption{color:#fff;background:rgb(8 12 24 / 92%);padding:.5rem .75rem;border-radius:.25rem}
```

**Gotcha:** `opacity` affects descendants and makes contrast dependent on the background.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 6 Image overlays
Use a stable scrim or solid text surface so responsive crops do not change the contrast behind text.

**Implementation pattern**

```html
<section class="hero"><img src="/images/studio-team.webp" alt="">
<div class="hero-copy"><h1>Digital experiences with purpose</h1><p>Research, design, engineering.</p></div></section>
<style>.hero{position:relative;color:#fff;isolation:isolate}.hero img{width:100%;height:32rem;object-fit:cover}
.hero-copy{position:absolute;inset:auto 0 0;padding:clamp(1rem,5vw,4rem);background:linear-gradient(transparent,rgb(0 0 0 / 88%))}</style>
```

**Gotcha:** The focal point and crop can move a bright patch behind the headline.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 7 Semantic tokens
Validate foreground/background combinations rather than isolated palette swatches. Dark themes require their own tested pairings.

**Implementation pattern**

```html
 :root{--surface:#fff;--surface-raised:#f3f4f6;--text:#111827;--text-secondary:#374151;--link:#0645ad}
[data-theme="dark"]{--surface:#111827;--surface-raised:#1f2937;--text:#f9fafb;--text-secondary:#d1d5db;--link:#93c5fd}
```

**Gotcha:** A token swap can create contrast failures even if each color looks plausible.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 8 Focus indicators
Focus indicators need contrast against adjacent surfaces and component borders. Use enough thickness and offset to remain visible.

**Implementation pattern**

```html
 :where(a,button,input,select,textarea):focus-visible{outline:3px solid #ffbf47;outline-offset:3px;box-shadow:0 0 0 2px #111827}
```

**Gotcha:** Check focus ring contrast against both the page and the control.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 9 Placeholder and disabled states
Placeholder text still communicates instructions and needs adequate contrast. Use explicit colors because browser opacity varies.

**Implementation pattern**

```html
input::placeholder{color:#595959;opacity:1}
button:disabled{color:#374151;background:#e5e7eb;border:1px solid #9ca3af;cursor:not-allowed}
```

**Gotcha:** Disabled exemptions do not make illegibility good design.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 10 Status colors
Use status colors with labels; avoid green/red-only distinctions. Keep meaning consistent across themes.

**Implementation pattern**

```html
<ul><li><span class="status-dot" aria-hidden="true"></span><span>Success — payment confirmed</span></li>
<li><span class="status-dot" aria-hidden="true"></span><span>Warning — review your details</span></li></ul>
```

**Gotcha:** A colored dot without text leaves meaning dependent on color perception.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 11 Charts
Use direct labels, patterns, symbols, and data tables when color distinguishes series or states.

**Implementation pattern**

```html
<figure><figcaption>Monthly active users rise from 120 to 210.</figcaption>
<svg role="img" aria-labelledby="users-title users-desc" viewBox="0 0 320 120">
<title id="users-title">Monthly active users</title><desc id="users-desc">Values rise from 120 in January to 210 in June.</desc>
<path d="M10 90 L70 78 L130 62 L190 50 L250 30 L310 12" fill="none" stroke="#0645ad" stroke-width="3"/></svg></figure>
```

**Gotcha:** Lines that differ only by hue may merge for color-blind users or grayscale output.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 12 Contrast debugging
Inspect computed styles and sample effective backgrounds; automated audits may not resolve gradients or image overlays.

**Implementation pattern**

```javascript
function readContrastInputs(selector){return [...document.querySelectorAll(selector)].map(el=>{const s=getComputedStyle(el);return {tag:el.tagName.toLowerCase(),text:el.textContent.trim().slice(0,50),color:s.color,background:s.backgroundColor,fontSize:s.fontSize,fontWeight:s.fontWeight}})}
console.table(readContrastInputs("p,a,button,label,h1,h2"));
```

**Gotcha:** Transparent computed backgrounds mean ancestor surfaces must be inspected.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 13 Forced colors
Support operating-system high-contrast modes and avoid global opt-outs from user color choices.

**Implementation pattern**

```html
@media (forced-colors: active){
.status-dot{forced-color-adjust:auto}
button:focus-visible{outline:2px solid Highlight}
}
```

**Gotcha:** Broad `forced-color-adjust:none` can suppress user-selected colors.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 14 State coverage
Audit default, hover, focus, active, selected, error, success, loading, and disabled states at each theme and breakpoint.

**Implementation pattern**

```html
button{background:#174ea6;color:#fff}
button:hover{background:#123d83}
button:active{background:#0b2b60}
button:focus-visible{outline:3px solid #ffbf47;outline-offset:3px}
```

**Gotcha:** Hover-only contrast checks miss keyboard focus and selected states.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

---

## Relevant Patterns / Integration Patterns

### Pattern 1 — Semantic contrast tokens
What it does and when to use it: Pairs text and surfaces. Use in light/dark themes.

```html
:root{--surface:#fff;--text:#172033;--muted:#4b5563;--link:#0645ad}body{color:var(--text);background:var(--surface)}a{color:var(--link)}
```

### Pattern 2 — Stable hero scrim
What it does and when to use it: Protects text contrast over changing image crops. Use for hero headings.

```html
.hero-copy{color:#fff;background:linear-gradient(transparent,rgb(0 0 0 / 90%));padding:2rem}
```

### Pattern 3 — Non-color status
What it does and when to use it: Adds text alongside color. Use for forms and dashboards.

```html
<p class="error"><strong>Error:</strong> Enter a valid email address.</p>
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Contrast judged by eye | Hue and display mislead judgment. | Calculate relative-luminance ratio with a checker. |
| Muted text too light | Hierarchy prioritized over readability. | Darken the secondary token and remeasure. |
| Hero text over photo | Responsive crop changes background pixels. | Add a stable scrim or opaque text surface. |
| Opacity for disabled state | Composited colors vary unpredictably. | Set explicit foreground and background tokens. |
| Ring blends into border | Only one adjacent surface was checked. | Use outline offset and test both boundaries. |
| Color-only error | Red perception is required to detect failure. | Add error copy plus border or icon cue. |
| Dark theme not audited | Token swap assumed safe. | Run the contrast matrix for every theme. |
| Chart series only hue | Color-vision users may merge series. | Add labels, patterns, symbols, or line styles. |
| Placeholder ignored | Placeholder considered decoration. | Set explicit color and test browser opacity. |
| Gradient checked once | Responsive text position shifts. | Test final rendered region at each breakpoint. |
| Thin control border | Boundary disappears against surface. | Increase boundary contrast or add filled state. |
| Forced colors disabled globally | Brand CSS overrides user palette. | Support forced colors and avoid broad opt-outs. |
| Only hover checked | Focus and selected states omitted. | Audit all interactive states. |
| Token reused everywhere | One color assumed safe on all surfaces. | Define validated semantic foreground/surface pairs. |

---

## Mental Models

1. **Contrast belongs to a pair** — a color cannot pass alone.
2. **Test pixels, not palette names** — opacity and images change output.
3. **Semantic tokens encode relationships** — validate intended foreground/surface pairs.
4. **Color is one channel** — text and shape add redundancy.
5. **Focus is part of the design system** — rings deserve intentional styling.
6. **Every state is a new combination** — audit themes and interaction states.
7. **Comfortable margin beats edge passing** — rendering varies.

---

## Quick Reference

| Situation | Recommended implementation | Verification note |
|---|---|---|
| Normal text | 4.5:1 AA | Actual colors |
| Large text | 3:1 AA | Verify size |
| UI graphics | Generally 3:1 | Adjacent colors |
| Palette | Semantic pairs | Not isolated swatches |
| Hero image | Scrim/surface | Every crop |
| Focus ring | Contrast + offset | Both surfaces |
| Error | Text + visual cue | Never red alone |
| Chart | Labels/patterns | Grayscale works |
| Placeholder | Explicit color | Browser opacity |
| Dark theme | Repeat matrix | All combinations |
| Forced colors | Support OS palette | Avoid opt-out |
| Hover/active | Audit each | Touch users differ |
| Computed style | Inspect ancestry | Transparent matters |
| Contrast tool | Trusted checker | Scanner is partial |
| Design margin | Above threshold | Rendering varies |

---

## Build Challenge

Build a light/dark component gallery with cards, forms, focus rings, status messages, and a text-over-image hero that meets contrast thresholds.

### Numbered requirements

1. Create semantic foreground/background tokens for both themes.
2. Verify normal text at 4.5:1 or better.
3. Verify large text at 3:1 or better.
4. Check meaningful non-text components at 3:1 where applicable.
5. Audit hover, active, selected, disabled, and error states.
6. Provide visible contrasting focus indicators.
7. Add a stable scrim behind hero text.
8. Use text or shape alongside status colors.
9. Add labels or patterns to chart series.
10. Test placeholder text in supported browsers.
11. Support forced-colors mode.
12. Change theme and hero crop; fix any failing pair.

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

Contrast is evaluated on the colors that reach the user. Opacity, alpha channels, blend modes, filters, images, and nested backgrounds can change the final result. White text does not guarantee readable white text over a photograph because the background behind each glyph varies. Add a predictable overlay or text surface when photography is involved, and verify each breakpoint where crop or layout changes.

### Advanced field note — Production implementation

Keep text hierarchy through font size, weight, spacing, and layout rather than relying on pale colors. Secondary text can be quiet and readable. Placeholder text should not carry essential instructions because it disappears during typing; if present, it still needs sufficient contrast. Disabled controls should remain understandable, and the reason for an unavailable action should be explained when it matters to task completion.

### Advanced field note — Production implementation

Contrast checks belong in design token review. Each approved semantic pair should have a documented ratio and intended use. When a brand color changes, rerun the pair matrix. A dark theme needs its own matrix because a color that works on one surface may not work on raised cards. Include hover, active, focus, selected, invalid, success, and forced-colors states.

### Advanced field note — Production implementation

For non-text elements, identify whether the visual is needed to understand a control or information. A decorative divider differs from an input boundary. A selected checkbox mark, focus ring, graph line, or essential icon may be the only cue for a state and deserves stronger treatment. When uncertain, add a textual label and visible shape rather than relying on hue alone.

### Advanced field note — Production implementation

Automated contrast scanners are useful but incomplete. They may not resolve image backgrounds, gradients, pseudo-elements, canvas, or overlapping layers. Use DevTools to inspect computed styles, sample the rendered background, and verify with a contrast checker. For complex charts or hero imagery, document the tested viewport and crop so later design changes do not invalidate the result silently.

### Practice scenario 1 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 2 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 3 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 4 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 5 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 6 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 7 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 8 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 9 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 10 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 11 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 12 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 13 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 14 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 15 — Failure-resistant delivery

A client requests a pale brand accent for captions over photography and a dark theme with muted labels. Test final rendered pairs rather than accepting palette approval alone. Place text over the brightest image region at mobile and desktop widths, inspect composited background, and calculate normal-text ratio. If it fails, retain the brand accent for decorative elements while using a darker token for small copy, or add a stable surface. Recheck focus rings, placeholders, error borders, and selected filters in both themes. Solve through token roles and composition, not by flattening the visual identity.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

## Self-review notes

This file is scoped to Layer 29 accessibility implementation. Run the project review script against the saved file before release and manually verify thresholds, code accuracy, unique fixes, and every applicable criterion. Automated checks support review but do not replace task-based keyboard and assistive-technology testing.
