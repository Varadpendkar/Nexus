# SKILL: custom-scrollbar

## Layer
**Layer 01 — CSS Foundation**

## Goal
Design scrollbars that fit a product's visual system without hiding essential controls, breaking native interaction, creating cross-browser surprises, or reducing accessibility. Learn when to style a scrollbar, how browser engines expose different styling APIs, how to scope the change, and how to test real scrolling behavior across pointer, touch, keyboard, and assistive-technology use.

## Why This Matters (Senior Perspective)

Scrollbar styling is a small surface with outsized product impact. It communicates polish, but it also sits at the boundary between content, navigation, and operating-system behavior. A scrollbar is not merely a decorative strip: it is a discoverability cue, a drag target, a position indicator, and sometimes the only visible sign that more content exists.

Senior engineers treat scrollbar customization as progressive enhancement. The default browser scrollbar is already integrated with platform conventions, accessibility settings, overlay behavior, input methods, and user expectations. A custom appearance should improve visual coherence without making the control harder to find or use. The correct question is not “How do we remove the scrollbar?” but “Can a modest, scoped style make this scrollable surface clearer while preserving native behavior?”

This skill focuses on standards-based CSS, practical browser differences, and the decisions around where customization is appropriate. It does not assume that every browser draws scrollbars the same way or that a CSS declaration guarantees an identical result on every operating system.

---

## Core Concepts

### 1. Scrollbars are browser and operating-system UI

The rendered scrollbar depends on more than your stylesheet. Browser engine, operating system, input device, user preferences, and whether the system uses overlay scrollbars can all affect its appearance.

On some systems, the scrollbar occupies layout space. On others, it overlays content and may fade until the user scrolls or interacts. A design that appears perfect in one screenshot may behave differently on a trackpad, touchscreen, or another operating system.

**Gotcha:** Do not use a screenshot from one machine as proof that scrollbar styling is consistent everywhere. Verify actual behavior in the browsers and operating systems your product supports.

### 2. Know the two main CSS styling families

There are two common families of scrollbar styling:

- The standardized CSS Scrollbars properties: `scrollbar-width` and `scrollbar-color`.
- The WebKit/Blink pseudo-element family, such as `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`, and `::-webkit-scrollbar-track`.

They are not interchangeable, and browser support and precedence can differ. Use the standardized properties where supported, then add engine-specific styling only when the product needs it and testing confirms the result. Avoid assuming that a complete set of WebKit pseudo-elements will translate to Firefox.

```css
/* Standards-based baseline */
.scroll-panel {
  scrollbar-width: thin;
  scrollbar-color: #737b8c #e9edf3;
}

/* Optional enhancement for engines that support these pseudo-elements */
.scroll-panel::-webkit-scrollbar {
  width: 0.75rem;
  height: 0.75rem;
}

.scroll-panel::-webkit-scrollbar-track {
  background: #e9edf3;
}

.scroll-panel::-webkit-scrollbar-thumb {
  background: #737b8c;
  border: 0.2rem solid #e9edf3;
  border-radius: 999px;
}
```

The snippet illustrates the two families; it is not a promise that every engine will apply every declaration in the same way. Test the target browser matrix and avoid overly elaborate assumptions about fallback precedence.

### 3. `scrollbar-width` is intentionally limited

The standardized `scrollbar-width` property supports `auto`, `thin`, and `none`. `auto` preserves the browser's normal width; `thin` requests a narrower scrollbar; `none` hides the visible scrollbar while leaving the element scrollable.

Use `thin` only when the scrollbar remains discoverable and comfortably usable in the target environment. The standardized property does not let you choose an arbitrary pixel width.

```css
.scroll-panel {
  scrollbar-width: thin;
}
```

**Gotcha:** `scrollbar-width: none` is not a safe shortcut for removing an ugly scrollbar. Users may not know the content scrolls, and some people rely on the scrollbar as a visual position indicator. Prefer a visible native or thin scrollbar unless there is a strong, tested reason otherwise.

### 4. `scrollbar-color` controls thumb and track colors

The property accepts two colors: thumb first, track second.

```css
.scroll-panel {
  scrollbar-color: #5b6475 #f2f4f8;
}
```

Pick colors with enough distinction that the thumb can be identified against the track. A translucent thumb can work in some visual systems, but test it against every background that can appear behind the scrollable surface.

**Gotcha:** A thumb that blends into the track may look minimal in a mockup and disappear in use. Visual subtlety is not a reason to remove the only position cue.

### 5. WebKit scrollbar pseudo-elements

The commonly used pseudo-elements include:

- `::-webkit-scrollbar` — the overall scrollbar area.
- `::-webkit-scrollbar-thumb` — the draggable thumb.
- `::-webkit-scrollbar-track` — the track behind the thumb.
- `::-webkit-scrollbar-track-piece` — a portion of the track, where supported.
- `::-webkit-scrollbar-corner` — the corner where horizontal and vertical scrollbars meet.
- `::-webkit-scrollbar-button` — scrollbar buttons on platforms that expose them.
- `::-webkit-resizer` — a resize control in relevant contexts.

These are non-standard, engine-specific hooks. Keep them isolated in one stylesheet section, document why they exist, and do not make critical layout or interaction depend on them.

### 6. Style the scroll container, not every element by default

A global rule such as `*::-webkit-scrollbar` can affect text areas, code blocks, menus, dialogs, sidebars, and nested panels. That can create inconsistent controls and surprise users in places where native scrollbars are important.

Prefer an explicit component class:

```css
.activity-feed {
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.activity-feed::-webkit-scrollbar {
  width: 0.7rem;
  height: 0.7rem;
}
```

**Gotcha:** Global scrollbar styling often starts as a quick polish pass and becomes a cross-component regression. Scope it to components whose behavior and contrast you have tested.

### 7. Scrolling and scrollbar visibility are separate concerns

`overflow` defines how overflowing content behaves. Scrollbar styling changes the visual presentation of the scrollbar. Do not confuse the two.

- `overflow: auto` allows scrolling when needed.
- `overflow: scroll` requests scrolling mechanisms even when not currently needed, though rendering is platform-dependent.
- `overflow: hidden` clips content and generally prevents users from scrolling that element with ordinary scroll input.
- `overflow: clip` clips content without creating a scroll container in the same way as `hidden`.
- `overflow-x` and `overflow-y` control each axis independently, subject to CSS overflow interaction rules.

```css
.panel {
  max-block-size: 24rem;
  overflow: auto;
}
```

**Gotcha:** Hiding a scrollbar is not equivalent to preventing overflow, and hiding overflow is not equivalent to making a polished scroll region. Choose the behavior first, then style its affordance.

### 8. Prefer logical sizing and explicit axis decisions

When using WebKit pseudo-elements, `width` commonly controls the vertical scrollbar's thickness and `height` the horizontal scrollbar's thickness. Treat this as engine-specific behavior, not a universal cross-browser contract.

```css
.data-table-scroll {
  overflow: auto;
}

.data-table-scroll::-webkit-scrollbar {
  width: 0.75rem;
  height: 0.75rem;
}
```

Test horizontal overflow separately. Horizontal scrollbars are easy to overlook and can be particularly important for wide tables, timelines, and code samples.

### 9. Scrollbars are interaction affordances

A scrollbar communicates that more content exists and where the viewport sits within it. A draggable thumb is a control with a target size and visual state, even when the browser owns the actual interaction.

A custom scrollbar should preserve:

- A distinguishable thumb and track.
- A visible boundary between the scrollable viewport and surrounding layout where needed.
- Enough room to use the scrollbar with the input methods supported by the product.
- Clear overflow behavior when content changes.
- Native keyboard and touch scrolling behavior.

**Gotcha:** Do not replace a browser scrollbar with a tiny decorative indicator that cannot be dragged or does not reflect the actual scroll position.

### 10. Contrast and visual state

Contrast is not only about text. A thumb that is indistinguishable from its track is hard to locate. Consider the scrollable surface's background, theme, hover states, and any translucency.

```css
:root {
  --scrollbar-thumb: #737b8c;
  --scrollbar-track: #edf0f5;
}

[data-theme="dark"] {
  --scrollbar-thumb: #8b94a7;
  --scrollbar-track: #252a34;
}
```

Use distinct tokens rather than embedding colors in many component selectors. Check both light and dark themes, high-contrast modes, and forced-colors behavior. In environments where users request forced colors, prefer preserving the platform's accessible rendering over insisting on a branded scrollbar.

### 11. Dark mode should use semantic tokens

Scrollbar colors are part of a theme, but they usually do not need an entire independent theming system. Define tokens for thumb and track, then change the token values with the same theme mechanism used elsewhere.

```css
:root {
  color-scheme: light;
  --scrollbar-thumb: #737b8c;
  --scrollbar-track: #edf0f5;
}

[data-theme="dark"] {
  color-scheme: dark;
  --scrollbar-thumb: #9099ab;
  --scrollbar-track: #272d38;
}

.scroll-panel {
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
```

**Gotcha:** Do not set `color-scheme` casually on an isolated element just to force a particular scrollbar look. It can affect other native controls and rendering. Align it with the component's actual color scheme and test the whole component.

### 12. Respect forced-colors and high-contrast settings

Some users configure the operating system to replace author colors with a high-contrast palette. Do not assume a branded thumb color is more important than a user's chosen contrast scheme.

```css
@media (forced-colors: active) {
  .scroll-panel {
    scrollbar-color: auto;
  }
}
```

The exact behavior varies by browser and platform. The key principle is to avoid overriding accessibility preferences without a compelling reason. Test the experience with forced colors enabled when your supported platform allows it.

**Gotcha:** A `forced-colors` media query is not a substitute for testing. It is one part of a resilient styling strategy.

### 13. Touch devices do not behave like desktop pointer devices

Touch interfaces may not show persistent scrollbars at all. Users generally scroll by swiping rather than dragging a thumb. A scrollbar style should not be the only cue that a panel can scroll.

For a horizontally scrollable collection, communicate the pattern through layout and content, not only through a scrollbar. Keep the content reachable with touch and avoid adding unnecessary nested scroll regions.

```css
.horizontal-rail {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scroll-snap-type: inline proximity;
}
```

**Gotcha:** Never assume that a visible desktop scrollbar means a touch user will see the same cue. Provide clear content affordances and preserve natural gestures.

### 14. Nested scroll containers require deliberate design

Nested scroll areas can be valid—such as a code editor inside a documentation page—but can also trap wheel or touch input and make navigation confusing. Keep the number of nested scroll containers low and give each one a clear purpose.

```css
.code-example {
  max-block-size: 22rem;
  overflow: auto;
  scrollbar-width: thin;
}
```

Use `overscroll-behavior` only when the intended interaction calls for it. `overscroll-behavior: contain` can prevent scroll chaining at the boundary; it can also surprise users if applied indiscriminately.

### 15. Avoid fake scrollbars

A custom `<div>` that visually imitates a scrollbar usually creates unnecessary work: it must track scroll position, map drag movement to content position, respond to resizing, support keyboard and pointer interactions, handle zoom, and expose appropriate semantics. Native scrolling already solves these problems.

Build a bespoke scrollbar only when a real product requirement cannot be met with native controls and the team can implement and test the full interaction contract. A visual mockup is not enough.

**Gotcha:** If the requirement is only “match our brand,” start with native styling and tokens. A custom JavaScript scrollbar is a high-maintenance last resort, not the default approach.

### 16. `scrollbar-gutter` can stabilize layouts

When supported, `scrollbar-gutter` can reserve space for a scrollbar so content does not shift when a classic scrollbar appears. `stable` reserves the gutter for a box that uses classic scrollbars; `both-edges` can reserve symmetrical space.

```css
.results-panel {
  overflow: auto;
  scrollbar-gutter: stable;
}
```

This is especially relevant to dialogs, sidebars, and panels where content alignment should not jump when overflow begins. Overlay scrollbars do not consume layout space in the same way, so the visible effect can differ by platform.

**Gotcha:** Do not add `scrollbar-gutter` without checking the layout. On a system using overlay scrollbars, it may not produce the same visual result as on a system with classic scrollbars.

### 17. Accessibility includes discoverability

The browser's scrollbar is often part of the scroll affordance. Hiding it can affect people who do not use a mouse wheel or who need a visual indicator of position. Do not rely on a single modality.

A good scrollable component should:

- Make overflow apparent where possible.
- Remain reachable by keyboard when appropriate to the component.
- Preserve content at browser zoom and text enlargement.
- Avoid clipping focus indicators.
- Avoid requiring precise pointer movement to discover content.
- Work with touch, trackpad, wheel, and keyboard scrolling.

Do not add `tabindex="0"` to every scroll container mechanically. Add it when the component needs independent keyboard focus and verify the resulting tab order and accessible naming.

### 18. Focus styling is adjacent, not a scrollbar replacement

The scrollable container may receive focus, and focus indicators must remain visible. Use `:focus-visible` for keyboard-oriented focus styling when appropriate.

```css
.scroll-panel:focus-visible {
  outline: 3px solid var(--focus-ring, #245fe8);
  outline-offset: 2px;
}
```

**Gotcha:** An `overflow: hidden` ancestor can clip an outline or other focus indicator. Inspect focus at the edges of the scroll region and ensure the focused control remains visible.

### 19. Keep horizontal scrolling intentional

Wide tables, code snippets, timelines, and data grids may legitimately need horizontal scrolling. Make that behavior clear and keep the scrollbar usable. Do not force all page content into a tiny width merely to avoid a horizontal scrollbar.

```css
.table-viewport {
  max-inline-size: 100%;
  overflow-x: auto;
}

.table-viewport table {
  min-inline-size: 42rem;
}
```

For data tables, preserve meaningful column relationships and avoid making users lose the row or column context. On smaller screens, consider responsive summaries or carefully chosen sticky headers where appropriate.

### 20. Scrollbar styling is not a performance feature

CSS scrollbar styling is generally a small presentation concern. Avoid claiming it improves performance. Performance issues usually come from excessive DOM size, expensive scroll-linked JavaScript, large repaint regions, sticky/fixed effects, or event handlers that block the main thread.

Prefer native scrolling and avoid JavaScript that repeatedly reads and writes scroll position. If you need scroll-linked visuals, profile them in realistic conditions and use browser-supported CSS features where appropriate.

### 21. Avoid brittle browser hacks

Do not use user-agent sniffing to decide whether a scrollbar should be visible. Prefer feature support and progressive enhancement. Avoid piling on browser-specific selectors without a documented reason.

Keep the standard properties as the baseline and isolate non-standard pseudo-element styling. When support requirements are unclear, use a conservative native scrollbar rather than inventing complex fallback rules.

**Gotcha:** A browser-specific fix that works today may be unnecessary or overridden in a future browser release. Retest it and remove dead CSS instead of accumulating permanent compatibility folklore.

### 22. Test the actual scroll behavior

Visual inspection should include more than the scrollbar itself. Check:

- Content shorter than the viewport.
- Content just over the viewport.
- Long content with a small thumb.
- Dynamic content added or removed.
- Resizing and browser zoom.
- Light and dark themes.
- Keyboard navigation and focus visibility.
- Touch and trackpad scrolling.
- Horizontal overflow.
- Forced-colors or high-contrast settings.
- Classic and overlay scrollbar environments when available.

A scrollbar can look correct while the scroll container has a broken height, clipped content, or unexpected nested scrolling.

### 23. Use a progressive-enhancement architecture

Start with correct semantic structure and overflow behavior. Add standardized styling. Add engine-specific appearance only when useful. Then test and refine.

```css
.scroll-region {
  max-block-size: 30rem;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

@supports selector(::-webkit-scrollbar) {
  .scroll-region::-webkit-scrollbar {
    width: 0.75rem;
    height: 0.75rem;
  }

  .scroll-region::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border: 0.2rem solid var(--scrollbar-track);
    border-radius: 999px;
  }

  .scroll-region::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
  }
}
```

Feature queries can help isolate optional styling, but they do not guarantee identical appearance or behavior across all engines. Keep the result useful even if the enhancement is ignored.

**Gotcha:** `@supports` answers whether a browser recognizes a feature, not whether its visual implementation matches your design exactly.

### 24. Use component-level contracts

A reusable scroll component should document the behavior it promises: maximum size, overflow axes, keyboard interaction, whether it intentionally contains scroll chaining, and whether it opts into custom scrollbar styling.

```css
/* Contract: a bounded region with native two-axis scrolling. */
.log-viewer {
  max-block-size: 28rem;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
```

Do not let scrollbar styles silently alter unrelated behavior. Keep overflow decisions near the component and visual tokens near the theme system.

### 25. Debug from the scroll container outward

When a scrollbar is missing or behaves unexpectedly, check the underlying box before changing scrollbar CSS:

1. Does the content actually exceed the container's scrollport?
2. Does the container have a constrained block or inline size where needed?
3. Is `overflow` set as intended?
4. Is an ancestor clipping or constraining the content?
5. Is the platform using overlay scrollbars?
6. Is the scrollbar hidden by an author rule?
7. Is the browser applying the expected styling API?
8. Is a nested container the actual scrolling element?

**Gotcha:** A missing scrollbar is often a layout or overflow issue, not a pseudo-element issue. Fix the scroll container before adjusting its decoration.

### 26. Prefer native behavior for controls and editors

Textareas, code editors, terminal panes, and data grids often have specialized scrolling needs. A global scrollbar style can reduce contrast or make the control look inconsistent with the operating system. Treat these as separate component decisions.

A design system can offer a `scrollbar-style` utility or component class, but it should be opt-in and tested in the contexts where it will be used.

### 27. Use restrained radius and borders

Rounded thumbs and track borders can help a scrollbar fit a visual system. Keep the styling modest. Large borders reduce the visible thumb's effective width, and exaggerated rounding may look odd on narrow scrollbars.

```css
.scroll-region::-webkit-scrollbar-thumb {
  border: 2px solid var(--scrollbar-track);
  border-radius: 999px;
}
```

**Gotcha:** If the track border consumes too much of a thin scrollbar, the thumb can become difficult to grab or see. Check at the actual rendered size, not only in source code.

### 28. Do not make hover the only state

Some platforms show scrollbars only during interaction, but your authored styling should not depend on a hover-only affordance. Touch users do not hover, and keyboard users may not interact with a scrollbar using a pointer.

Use hover styling as a small enhancement only when the target pseudo-element and browser support it. Keep the default thumb visible enough for the environment and avoid relying on a color change that is invisible to some users.

### 29. Avoid changing scrollbar geometry unexpectedly

Changing scrollbar thickness can alter layout in environments where the scrollbar consumes space. It may also affect the amount of content visible in a fixed-width panel. Verify alignment with neighboring components and avoid changing the width dynamically on hover unless you have tested the resulting layout.

### 30. Treat the scrollbar as part of a coherent design system

Define a small set of tokens, use one opt-in class, and document exceptions. The goal is consistency, not forcing every scrollable element into the same visual treatment. A code editor, a full-page document, and a compact carousel may deserve different behavior.

A useful default is:
- Native scrollbar on the page.
- Opt-in subtle styling for bounded panels.
- Explicit review for text inputs, editors, menus, and dialogs.
- Native or user-preferred colors in forced-colors environments.
- No hidden scrollbar unless the use case has been tested for discoverability and alternative input methods.

---

## Reusable Patterns

### Pattern 1: Standards-based subtle scrollbar

Use for bounded panels where a narrower scrollbar is appropriate and supported.

```css
:root {
  --scrollbar-thumb: #737b8c;
  --scrollbar-track: #edf0f5;
}

.scroll-panel {
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
```

**Why it works:** It uses a small, maintainable set of standard properties and keeps colors in tokens.

**Trade-off:** The browser controls the actual width and may render a different visual result across platforms.

### Pattern 2: Progressive enhancement for WebKit-style controls

Use only when the target browser matrix benefits from more control over the appearance.

```css
.scroll-panel {
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.scroll-panel::-webkit-scrollbar {
  width: 0.75rem;
  height: 0.75rem;
}

.scroll-panel::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.scroll-panel::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border: 0.2rem solid var(--scrollbar-track);
  border-radius: 999px;
}
```

**Why it works:** The base remains useful without the optional engine-specific rules.

**Trade-off:** Different engines can implement and prioritize scrollbar styling differently. Verify rather than assuming.

### Pattern 3: Theme-aware tokens

```css
:root {
  --scrollbar-thumb: #687386;
  --scrollbar-track: #eef1f6;
}

[data-theme="dark"] {
  --scrollbar-thumb: #929bad;
  --scrollbar-track: #252b35;
}

.scroll-panel {
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
```

**Why it works:** Components do not need their own duplicated light/dark colors.

**Trade-off:** The tokens must be tested against the real surface backgrounds and theme transitions.

### Pattern 4: Preserve user high-contrast preferences

```css
.scroll-panel {
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

@media (forced-colors: active) {
  .scroll-panel {
    scrollbar-color: auto;
  }
}
```

**Why it works:** The design does not insist on branded colors when a user has requested a high-contrast system palette.

**Trade-off:** Forced-color behavior depends on the browser and platform, so test the complete experience.

### Pattern 5: Stable panel layout

```css
.results-panel {
  max-block-size: 32rem;
  overflow: auto;
  scrollbar-gutter: stable;
}
```

**Why it works:** In classic-scrollbar environments, reserved gutter space can reduce layout shifts when overflow changes.

**Trade-off:** Overlay scrollbars and browser support affect the visible result.

### Pattern 6: Horizontal table viewport

```css
.table-viewport {
  max-inline-size: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
}

.table-viewport table {
  min-inline-size: 42rem;
}
```

**Why it works:** The table retains usable column widths instead of compressing every column beyond recognition.

**Trade-off:** Horizontal navigation must remain discoverable and usable on touch and keyboard devices.

### Pattern 7: Accessible focus on a keyboard-scrollable region

Use only if the region needs its own focus stop. A `tabindex` choice should follow the interaction design rather than being applied automatically.

```html
<section class="scroll-panel" tabindex="0" aria-label="Recent activity">
  <!-- Scrollable activity content -->
</section>
```

```css
.scroll-panel:focus-visible {
  outline: 3px solid var(--focus-ring, #245fe8);
  outline-offset: 2px;
}
```

**Why it works:** When the container is intentionally focusable, keyboard users can identify the focused region.

**Trade-off:** An unnecessary tab stop adds friction. Confirm that the region is independently useful and has a meaningful accessible name.

### Pattern 8: Native page scrollbar, custom component scrollbar

```css
/* No global scrollbar override: page scrolling stays native. */
.activity-feed {
  max-block-size: 26rem;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
```

**Why it works:** The visual treatment is confined to the component where it has been reviewed.

**Trade-off:** Different parts of the interface may retain different native scrollbar appearances. That is often preferable to a global regression.

### Pattern 9: Touch-friendly horizontal rail

```css
.card-rail {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-snap-type: inline proximity;
  overscroll-behavior-inline: contain;
}

.card-rail > * {
  flex: 0 0 min(82vw, 22rem);
  scroll-snap-align: start;
}
```

**Why it works:** The rail remains naturally scrollable and its partially visible next item can suggest additional content.

**Trade-off:** Do not use a partial card as the only indication of content if the layout does not reliably reveal it at all viewport sizes.

### Pattern 10: Debuggable scroll region

```css
.debug-scroll-region {
  max-block-size: 24rem;
  overflow: auto;
  outline: 1px dashed currentColor;
}
```

**Why it works:** A temporary outline helps identify the actual scroll container and its dimensions.

**Trade-off:** Remove diagnostic styles before shipping. Do not “fix” a layout by permanently adding arbitrary heights without understanding the content contract.

### Pattern 11: Intentional one-axis scrolling

```css
.code-sample {
  overflow-x: auto;
  overflow-y: hidden;
  white-space: pre;
}
```

**Why it works:** Long code lines can scroll horizontally without creating a second vertical scroll region for the same content.

**Trade-off:** Ensure the code sample remains reachable at zoom and narrow widths, and do not clip content that should wrap.

### Pattern 12: Conservative fallback

```css
.scroll-panel {
  overflow: auto;
  /* No scrollbar-specific rules: keep native browser UI. */
}
```

**Why it works:** Native controls are the correct default when styling adds little value or support is uncertain.

**Trade-off:** The scrollbar may not match the rest of the visual system exactly, but it preserves familiar platform behavior.

---

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Hiding all scrollbars globally | Reduces discoverability and position feedback | Keep native scrollbars by default; customize only a reviewed component |
| Using `scrollbar-width: none` for visual polish | Scrollable content can become undiscoverable | Prefer `auto` or `thin`; hide only after accessibility testing |
| Assuming WebKit pseudo-elements work everywhere | The API is non-standard and engine-specific | Use standard properties as a baseline and test the browser matrix |
| Assuming all browsers render identical widths | OS and overlay behavior affect geometry | Validate on actual supported platforms |
| Styling `*::-webkit-scrollbar` | Unintentionally affects controls, menus, editors, and dialogs | Use a component class |
| Making the thumb the same color as the track | Position indicator becomes hard to locate | Maintain visible thumb/track distinction |
| Using low-opacity gray on every background | Contrast changes with surface color and theme | Test actual composited colors against each surface |
| Setting arbitrary scrollbar widths with standard properties | `scrollbar-width` has a limited keyword set | Use supported values or a carefully scoped engine-specific enhancement |
| Forgetting horizontal scrollbars | Wide content can become hard to navigate | Test both axes and make horizontal overflow intentional |
| Using `overflow: hidden` to hide a scrollbar | May prevent ordinary user scrolling and clip content | Set overflow behavior separately from scrollbar styling |
| Treating `overflow: clip` like `auto` | It does not create the same scroll container behavior | Choose overflow values based on intended interaction |
| Adding `tabindex="0"` to every panel | Creates too many keyboard stops | Make only independently useful regions focusable |
| Forgetting accessible names on focusable regions | Users may not know what the focused region contains | Provide a meaningful label or native semantic structure |
| Using hover as the only indication | Touch and keyboard users may not receive it | Keep default states perceivable |
| Building a fake scrollbar for a simple design request | Requires custom dragging, sync, keyboard, resize, and zoom support | Prefer native scrolling and CSS styling |
| Adding JavaScript listeners just to change scrollbar color | Adds complexity without improving native behavior | Use CSS tokens and supported properties |
| Overusing nested scroll regions | Makes wheel, touch, and keyboard movement confusing | Minimize nesting and define each region's purpose |
| Applying `overscroll-behavior: contain` everywhere | Can stop expected scroll chaining | Apply only where containment is intentional |
| Using `scrollbar-gutter` without checking platform | Overlay scrollbar systems may show no expected gutter | Test classic and overlay behavior |
| Ignoring dynamic content | Thumb size and scroll range change as content changes | Test loading, filtering, expansion, and removal |
| Styling only the light theme | Thumb may disappear in dark mode | Define semantic tokens and test both themes |
| Overriding forced-colors settings for branding | Can reduce user-selected contrast | Let the platform colors take precedence where appropriate |
| Using `color-scheme` only to manipulate scrollbars | Can change native controls beyond the scrollbar | Align `color-scheme` with the component's real theme |
| Assuming a feature query guarantees visual parity | Syntax support does not promise identical rendering | Treat the rule as enhancement and test the output |
| Forgetting focus outlines at clipped edges | Keyboard focus may be hard to locate | Check outline offsets and ancestor overflow |
| Increasing scrollbar width on hover without testing | Can shift content in classic-scrollbar layouts | Keep geometry stable or validate the interaction carefully |
| Using excessive thumb borders | Reduces effective thumb area | Keep borders modest and inspect rendered dimensions |
| Treating scrollbar styling as performance optimization | Does not address the likely source of jank | Profile layout, paint, and scroll-linked scripts |
| Keeping dead browser hacks forever | Adds maintenance burden and obscures intent | Document and periodically remove obsolete compatibility rules |
| Assuming a desktop screenshot proves touch usability | Touch platforms may hide or alter scrollbars | Test swipes and content discoverability on actual devices |
| Forgetting browser zoom | Narrow scroll areas and focus outlines may clip | Test at enlarged zoom and text settings |
| Making every component visually identical | Some components need different native behavior | Use opt-in styles with documented exceptions |
| Using a tiny scrollbar in a critical navigation pane | The drag target may be hard to use | Prefer native sizing where usability is critical |
| Styling the scrollbar before confirming overflow | The scrollbar may be missing because the box never scrolls | Inspect dimensions and overflow first |
| Setting `overflow: scroll` everywhere | Can show unnecessary scroll mechanisms and alter layout | Prefer `auto` unless always-on scrolling is an intentional requirement |
| Forgetting to test empty and short content | A panel can look odd when no scrolling is needed | Check empty, short, and overflowing states |
| Failing to test pointer dragging | A thumb may be visually present but hard to grab | Verify native dragging and track interaction where available |
| Adding custom arrows that duplicate native controls | Can create inconsistent or redundant UI | Avoid pseudo-element decoration that implies unsupported interaction |
| Depending on scrollbars to explain a carousel | Overlay scrollbars may disappear | Add layout cues, labels, or controls where needed |
| Applying the same colors over translucent surfaces | Background compositing changes contrast | Test each actual surface and opacity combination |
| Ignoring RTL layouts | Horizontal content and logical flow may differ | Test direction-aware layouts and avoid assumptions about scrollbar side |
| Assuming scrollbar side is controllable uniformly | Platform conventions and direction affect placement | Respect native placement unless a verified requirement exists |
| Not documenting the exception | Future refactors may reintroduce global rules | Record why the component opts in and what was tested |
| Shipping debug outlines | Diagnostic styles leak into production | Remove temporary diagnostics and validate the final build |
| Skipping real-device validation | Emulation cannot fully reproduce OS scrollbar preferences | Test on supported platform/browser combinations |

---

## Mental Models

1. **Native first, customize second.** The browser already implements a robust scrolling control. Author styling should enhance it, not replace its behavior.
2. **Overflow is behavior; scrollbar CSS is presentation.** Determine whether content should scroll before adjusting its visual indicator.
3. **The thumb is a position signal.** It tells users that more content exists and approximately where they are within it.
4. **Progressive enhancement beats browser uniformity.** A useful native baseline is better than a brittle attempt to make every engine pixel-identical.
5. **Scope is a safety mechanism.** Component-level styling limits regressions in text inputs, editors, menus, dialogs, and page-level scrolling.
6. **Platform conventions are part of the interface.** Overlay scrollbars, touch behavior, and user preferences are not bugs to erase.
7. **Contrast must survive real surfaces.** A token pair must be checked where it is actually rendered, not only on a palette page.
8. **Discoverability matters more than minimalism.** A scrollbar that disappears completely may look clean but make overflow harder to notice.
9. **Every custom control creates a maintenance contract.** Fake scrollbars require interaction, keyboard, resize, zoom, and accessibility work.
10. **A screenshot is not a test plan.** Validate content states, input modes, themes, zoom, and operating systems.
11. **Feature support is not visual equivalence.** A recognized selector or property can still render differently across engines.
12. **Fix the box before the decoration.** Missing scrollbars often originate in dimensions, overflow rules, or ancestor clipping.
13. **User preferences outrank brand polish.** Forced-colors and high-contrast settings should remain usable.
14. **Consistency means coherent decisions, not identical styling everywhere.** Some scroll surfaces should stay native.
15. **A good exception is documented.** If a component needs custom styling, record why and which conditions were tested.

---

## Quick Reference

| Need | Recommended starting point |
|---|---|
| Keep native behavior and ordinary width | `scrollbar-width: auto` or no scrollbar styling |
| Request a thinner scrollbar where supported | `scrollbar-width: thin` |
| Set standard thumb and track colors | `scrollbar-color: <thumb> <track>` |
| Style more detailed scrollbar parts in supported engines | `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-track` |
| Keep content scrollable when needed | `overflow: auto` |
| Enable a horizontal table viewport | `overflow-x: auto` |
| Reserve space for classic scrollbar layouts | `scrollbar-gutter: stable` where supported |
| Respect forced-colors settings | `@media (forced-colors: active)` and native colors |
| Prevent unwanted scroll chaining in a specific panel | Consider `overscroll-behavior` after testing |
| Ensure a focusable scroll panel has a visible keyboard indicator | `:focus-visible` |
| Avoid unexpected global effects | Scope styling to a component class |
| Debug a missing scrollbar | Check content size, container size, overflow, ancestors, and platform behavior |

### Minimal starting recipe

```css
:root {
  --scrollbar-thumb: #737b8c;
  --scrollbar-track: #edf0f5;
}

.scroll-panel {
  max-block-size: 30rem;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

@media (forced-colors: active) {
  .scroll-panel {
    scrollbar-color: auto;
  }
}
```

Add engine-specific styling only when it produces a meaningful improvement for the supported browser matrix. Keep the default page scrollbar native unless the design system has a tested reason to do otherwise.

---

## Build Challenge

### Project: Accessible, theme-aware scroll component

Build a reusable scrollable panel for a dashboard activity feed or log viewer. The component should look considered without losing native scrolling behavior.

#### Requirements

1. Use semantic HTML appropriate to the content, such as a labelled section or list.
2. Give the component a clear, documented class name.
3. Constrain its size using logical properties such as `max-block-size`.
4. Set overflow behavior deliberately rather than using scrollbar styling to solve layout.
5. Use `overflow: auto` when the panel should scroll only when necessary.
6. Define semantic tokens for the scrollbar thumb and track.
7. Provide light-theme token values.
8. Provide dark-theme token values.
9. Ensure the thumb and track are visually distinguishable in both themes.
10. Use `scrollbar-width` with a supported value where appropriate.
11. Use `scrollbar-color` in thumb-then-track order.
12. Decide whether WebKit pseudo-element styling adds meaningful value.
13. If using engine-specific pseudo-elements, keep them scoped to the component.
14. Keep page-level scrolling native unless there is a tested reason to change it.
15. Avoid a global `*::-webkit-scrollbar` rule.
16. Preserve horizontal scrolling when the content requires it.
17. Test a short content state where no scrollbar is necessary.
18. Test a long content state with a small thumb.
19. Test dynamic content insertion and removal.
20. Test resizing the viewport and the panel.
21. Test browser zoom and text enlargement.
22. Test mouse-wheel or trackpad scrolling.
23. Test touch scrolling on a touch-capable device.
24. Test horizontal scrolling if the component contains wide content.
25. Check that any focusable scroll region has a useful accessible name.
26. Use `:focus-visible` for an appropriate keyboard focus indicator.
27. Ensure focus indicators are not clipped by an ancestor.
28. Avoid adding `tabindex="0"` without a clear keyboard interaction reason.
29. Respect forced-colors or high-contrast settings.
30. Verify that theme tokens are applied to the actual component surface.
31. Check that translucent colors do not become indistinguishable on the rendered background.
32. Avoid unnecessary nested scroll containers.
33. Use `overscroll-behavior` only if scroll containment is intentional.
34. Decide whether `scrollbar-gutter: stable` helps the target layout.
35. Confirm behavior in a classic-scrollbar environment if available.
36. Confirm behavior in an overlay-scrollbar environment if available.
37. Confirm the component still works if scrollbar styling is ignored.
38. Inspect a code editor, textarea, menu, or dialog to ensure styles did not leak into it.
39. Remove temporary debugging outlines and test styles.
40. Document browser and platform combinations tested.
41. Document any browser-specific styling and why it exists.
42. Check RTL layout if the product supports right-to-left languages.
43. Avoid claiming that styling improves scroll performance without evidence.
44. Verify that the thumb remains identifiable without relying on hover.
45. Verify that the final design retains native drag and scroll behavior.
46. Keep the CSS maintainable by centralizing shared tokens.
47. Review the component for keyboard, pointer, and touch usability.
48. Record any known differences across browsers and operating systems.
49. Remove obsolete compatibility rules rather than retaining untested hacks.
50. Confirm that the final component remains usable at narrow widths and enlarged zoom.

### Acceptance checklist

- [ ] The content scrolls correctly before custom styling is added.
- [ ] The scrollbar is visible or discoverable enough for the use case.
- [ ] The standard CSS baseline works when engine-specific rules are ignored.
- [ ] Light and dark themes retain a clear thumb/track distinction.
- [ ] Forced-colors settings are not unnecessarily overridden.
- [ ] Keyboard focus is visible when the scroll region is focusable.
- [ ] Horizontal overflow remains usable where required.
- [ ] No global scrollbar rule unintentionally changes unrelated controls.
- [ ] Touch, trackpad, and pointer behavior have been checked.
- [ ] The browser/platform test notes are documented.

### Suggested review questions

1. What user problem does the custom scrollbar solve that native styling does not?
2. Which parts of the appearance are standardized and which are engine-specific?
3. How does the component behave when the browser ignores all scrollbar styling?
4. Can a user discover and navigate overflow without hovering?
5. Does the thumb remain distinguishable in every supported theme and surface?
6. What changes under forced-colors or high-contrast settings?
7. Are any nested scroll areas necessary, and what happens at their boundaries?
8. What evidence supports adding `scrollbar-gutter`?
9. How have touch and keyboard users been considered?
10. Which tested browsers and operating systems are covered by the component contract?

---

## Final Principles

- Start with correct overflow behavior, then style the scrollbar.
- Prefer native controls and standards-based properties.
- Keep non-standard pseudo-element styling optional and scoped.
- Never hide scrollbars solely to make a screenshot look cleaner.
- Treat discoverability, contrast, keyboard access, and touch behavior as core requirements.
- Test real platform behavior instead of promising pixel-identical rendering.
- Keep theme tokens centralized and honor user-selected contrast preferences.
- Document exceptions and remove compatibility hacks when they are no longer needed.
