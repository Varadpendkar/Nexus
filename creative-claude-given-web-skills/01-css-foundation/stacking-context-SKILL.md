# SKILL: stacking-context
**Layer:** 01 — CSS Foundation  
**Goal:** Predict, debug, and deliberately control the paint order of overlapping interface elements without relying on arbitrary `z-index` escalation.

---

## Why This Matters (Senior Perspective)

A page can have perfectly chosen colors, typography, spacing, and animation and still feel broken because the wrong thing sits on top of the right thing. A dropdown disappears behind a hero image, a sticky navigation bar covers a modal, a decorative gradient blocks a button, or a tooltip appears beneath the card that triggered it. These are not usually “z-index bugs” in isolation. They are paint-order bugs caused by the browser's stacking rules and the boundaries created by stacking contexts.

Senior developers do not respond by changing `z-index: 10` to `z-index: 999999`. They identify which elements participate in which stacking contexts, find the nearest ancestor that traps the element, and choose the smallest structural correction. A stacking context is a local paint-order system: a child can be the highest layer inside its context and still lose to a sibling context painted above the whole group. Once you understand that, CSS layering becomes predictable rather than superstitious.

This matters especially in creative portfolio and freelance work. Motion-heavy hero sections often use transforms, opacity, filters, blend modes, and positioned overlays; all of these can affect stacking behavior. Client sites add sticky headers, mega menus, consent banners, chat widgets, dialogs, and third-party embeds. If those layers are improvised, every new component can destabilize the old ones. A deliberate layer architecture reduces regressions, improves keyboard and screen-reader workflows, and makes visual polish maintainable across breakpoints.

---

## Core Concepts

### 1. Painting Order Is More Than `z-index`

The browser does not simply sort every element on the page by one global number. It paints backgrounds, borders, in-flow content, positioned elements, and stacking contexts according to a set of rules. `z-index` influences a particular part of that process; it does not replace the entire painting algorithm.

Start with a small reproducible page. The positioned card is painted above ordinary content because it participates in a later positioned layer, even though the paragraph has no `z-index`.

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Paint order lab</title>
  <style>
    .stage { position: relative; min-height: 15rem; padding: 2rem; background: #f2f0ec; }
    .copy { width: 17rem; padding: 1rem; background: white; }
    .floating-card {
      position: absolute;
      top: 4rem;
      left: 10rem;
      width: 12rem;
      padding: 1rem;
      background: #d8f0e6;
      border: 2px solid #176b55;
      /* This card must overlap the copy intentionally, not by accident. */
      z-index: 1;
    }
  </style>
</head>
<body>
  <main class="stage">
    <p class="copy">Editorial copy that occupies normal document flow.</p>
    <aside class="floating-card">A positioned card that overlaps the copy.</aside>
  </main>
</body>
</html>
```

**Naive mental model:** “The biggest `z-index` always wins.”  
**Correct mental model:** The browser first decides the relevant stacking context and painting phase; `z-index` only orders items within the scope where it applies.

Gotcha: changing DOM order can change paint order for elements in the same relevant painting phase, but it cannot make a deeply trapped child leap over a separate ancestor stacking context.

### 2. What a Stacking Context Actually Is

A stacking context is a self-contained group of painted layers. The browser treats that group as a single unit when comparing it with other stacking contexts in its parent. Descendants are ordered inside the group, but their values are not compared directly against descendants of a competing group.

Consider two sibling cards. The left card creates a stacking context; its tooltip has a very large `z-index`. The right card has a higher parent-level `z-index`. The tooltip cannot escape the left card's context.

```html
<div class="comparison">
  <article class="card card--left">
    <h2>Project Alpha</h2>
    <button class="tooltip-trigger" aria-describedby="alpha-tip">Details</button>
    <span class="tooltip" id="alpha-tip" role="tooltip">Alpha tooltip</span>
  </article>
  <article class="card card--right">
    <h2>Project Beta</h2>
    <p>Beta is intentionally above Alpha's entire context.</p>
  </article>
</div>
```

```css
.comparison { position: relative; display: flex; gap: 1rem; }
.card { position: relative; width: 15rem; padding: 1.25rem; border: 1px solid #bbb; }
.card--left { z-index: 1; transform: translateZ(0); }
.card--right { z-index: 2; background: #fff; }
.tooltip { position: absolute; left: 1rem; top: 5rem; z-index: 9999; padding: .75rem; background: #151515; color: white; }
```

The `transform` on `.card--left` creates a stacking context. The entire left card is at stack level 1 relative to the comparison; the right card is at level 2. The tooltip's `9999` is only meaningful inside the left card's context.

### 3. `z-index` and Positioning

For classic positioned layout, `z-index` applies to positioned elements (`position: relative`, `absolute`, `fixed`, or `sticky`). A positioned element with `z-index: auto` generally does not create a stacking context merely because it is positioned; a positioned element with an integer `z-index` does. Flex and grid items are a useful exception: a flex/grid item can use `z-index` even when its `position` is `static`.

```html
<div class="layer-demo">
  <div class="layer layer--one">Layer one</div>
  <div class="layer layer--two">Layer two</div>
</div>
```

```css
.layer-demo { position: relative; min-height: 10rem; }
.layer { position: absolute; inset: 1rem auto auto 1rem; padding: 1rem; }
.layer--one { left: 1rem; top: 1rem; background: #e7b9a7; z-index: 4; }
.layer--two { left: 5rem; top: 3rem; background: #b7d8ed; z-index: 2; }
```

The first layer paints above the second because both belong to the same stacking context and both have integer stack levels. If you remove `position: absolute` but leave the same `z-index`, do not assume the result will remain identical in ordinary block layout.

### 4. Common Stacking-Context Creators

A stacking context can be created by more than `position` plus `z-index`. Important triggers include:

- The root element (`html`).
- A positioned element with a `z-index` other than `auto`.
- A flex or grid item with a non-`auto` `z-index`.
- `position: fixed` and `position: sticky` elements.
- `opacity` below `1`.
- A `transform` other than `none`.
- `filter` or `backdrop-filter` values other than `none`.
- `mix-blend-mode` other than `normal`.
- `isolation: isolate`.
- Certain containment values, including paint containment.
- `will-change` when it names a property that would create a stacking context when changed.
- Some top-layer and browser-managed rendering situations, which do not behave like ordinary `z-index` layers.

Do not memorize this as a trivia list. Use it as a debugging checklist when a `z-index` change appears to do nothing.

```css
.hero-art {
  /* The animation's transform can establish a new stacking context. */
  transform: translate3d(0, 0, 0);
}

.hero-art--still {
  /* Prefer no transform when no transform is needed. */
  transform: none;
}

.translucent-panel {
  /* Opacity groups descendants as a single composited layer. */
  opacity: .98;
}
```

Gotcha: some triggers are added for visual effects or performance experiments and later forgotten. A harmless-looking `filter: blur(0)` or `transform: translateZ(0)` can change layering semantics even if the visible appearance barely changes.

### 5. Stacking Contexts Are Atomic to Their Parent

Imagine each stacking context as a sealed folder. The parent compares the folder's stack level against neighboring folders; it does not open the folder and compare every grandchild with everything outside it. This explains why `z-index: 100000` on a tooltip may lose to `z-index: 2` on a sibling context.

```css
/* Fragile: the child number is large, but its parent context is low. */
.product-card { position: relative; z-index: 1; transform: scale(1); }
.product-card__menu { position: absolute; z-index: 100000; }
.site-header { position: sticky; top: 0; z-index: 5; }

/* Structural fix: keep the interactive menu in a layer that can compete
   with the header, or render it in a shared overlay root. */
.overlay-root { position: relative; z-index: 20; }
```

The fix depends on ownership. If the menu should be constrained to the card, keep it there and correct the card's context ordering. If it must overlap unrelated page regions, place it in an overlay layer or use a suitable top-layer primitive. Avoid promoting every card to a huge stack level: that only moves the collision elsewhere.

### 6. `transform` Changes More Than Pixels

A transform changes the coordinate space used to render an element and creates a stacking context. For many transformed elements, it also establishes a containing block for positioned descendants that would otherwise be viewport-relative. This is why a `position: fixed` tooltip inside a transformed ancestor may behave as if fixed to that ancestor rather than to the viewport.

```html
<section class="hero-shell">
  <div class="hero-shell__art" aria-hidden="true"></div>
  <div class="hero-shell__content">
    <h1>Interfaces with a point of view</h1>
    <p>Art direction, motion, and useful software.</p>
  </div>
  <div class="hero-shell__notice">This notice is fixed-looking, but is nested.</div>
</section>
```

```css
.hero-shell { position: relative; min-height: 22rem; overflow: visible; }
.hero-shell__art {
  position: absolute; inset: 0;
  background: radial-gradient(circle at 75% 35%, #f3b39b, transparent 35%), #20202a;
  transform: scale(1.01); /* Creates a context and containing-block side effects. */
}
.hero-shell__content { position: relative; z-index: 1; color: white; padding: 4rem; }
.hero-shell__notice { position: fixed; right: 1rem; bottom: 1rem; z-index: 10; }
```

If the notice must truly be viewport-fixed, move it outside the transformed subtree or render it through an overlay mechanism. Do not remove the transform blindly if it is essential to the hero animation; correct the DOM/layer architecture instead.

### 7. Opacity Groups Descendants

`opacity` applies to the rendered element as a group, including its descendants. It is not the same as applying a translucent background color to the element itself. Because opacity below `1` creates a stacking context, descendants cannot be independently lifted outside that group.

```css
/* Naive: this fades the button and its text along with the panel. */
.dialog-panel { opacity: .92; }

/* Better: only the panel surface is translucent; controls remain crisp. */
.dialog-panel {
  background: rgb(255 255 255 / 92%);
  color: #171717;
}
```

Use element opacity when you intentionally want the entire rendered subtree to fade during a transition. For translucent surfaces, prefer alpha in the background color. If animating opacity, account for the temporary stacking context and ensure the completed state does not leave unexpected styles behind.

### 8. `isolation: isolate` Creates an Intentional Boundary

`isolation: isolate` creates a stacking context without needing a visible transform, opacity change, or artificial `z-index`. It is especially useful for cards that use `mix-blend-mode`, decorative layers, and local effects. It says: keep this visual composition grouped within its own stacking system.

```html
<article class="case-study-card">
  <div class="case-study-card__glow" aria-hidden="true"></div>
  <div class="case-study-card__body">
    <p class="eyebrow">Selected work</p>
    <h2>Signal / Noise</h2>
    <a href="/work/signal-noise">Explore the case study</a>
  </div>
</article>
```

```css
.case-study-card {
  position: relative;
  isolation: isolate; /* Contains blend effects without a fake transform. */
  overflow: hidden;
  border-radius: 1.25rem;
  background: #11131a;
  color: white;
}
.case-study-card__glow {
  position: absolute; inset: -30%; z-index: -1;
  background: radial-gradient(circle, #6e5cff 0, transparent 55%);
  filter: blur(2rem);
}
.case-study-card__body { position: relative; padding: 2rem; }
```

Gotcha: a negative `z-index` layer is still constrained by its stacking context and may paint behind the card background if the context structure is wrong. Test the full component, not only the decorative element.

### 9. Negative `z-index` Is Not a Universal Background Trick

Negative stack levels place an element behind certain content within its stacking context. They do not mean “behind everything but still visible.” If the containing context paints a background above the child, the decorative layer can disappear. A negative child can also end up behind content that should remain unrelated to it.

```css
/* Risky: this can disappear behind the ancestor's painted background. */
.feature-card { position: relative; background: #14151a; }
.feature-card::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #5f5bff; }

/* Safer: use a defined internal layer and put content above it. */
.feature-card { position: relative; isolation: isolate; background: #14151a; }
.feature-card::before { content: ""; position: absolute; inset: 0; z-index: -1; background: #5f5bff; }
.feature-card > * { position: relative; }
```

An even simpler solution is often to use a background, pseudo-element at `z-index: 0`, and content at `z-index: 1`. Use negative levels only when their relationship to the ancestor's background is intentional and verified.

### 10. `isolation`, `overflow`, and Clipping Are Different Problems

Stacking order decides which painted thing is in front. Clipping decides which parts can be seen. `overflow: hidden`, `clip-path`, masks, and paint containment can clip descendants regardless of how high their `z-index` is. A menu may be correctly above its siblings but still be cut off by an ancestor's overflow boundary.

```css
/* A dropdown cannot escape this clipping box just by raising z-index. */
.project-grid { overflow: hidden; }
.project-card__dropdown { position: absolute; z-index: 999; }

/* If the grid needs rounded clipping, keep the dropdown outside that box
   or use an overlay layer whose ancestors do not clip it. */
.project-grid__viewport { overflow: clip; border-radius: 1rem; }
.project-grid__overlay-root { position: relative; z-index: 10; }
```

Use `overflow: hidden` for deliberate image cropping and rounded media. Do not place an interactive menu inside a clipped region unless it is designed to be clipped. `overflow: visible` is not always sufficient because another ancestor may still clip the element.

### 11. Flex and Grid Items Have a Useful `z-index` Exception

Flex and grid items can be assigned a non-`auto` `z-index` even when their own `position` is `static`. This is useful for overlapping grid tiles without adding positioning to every child. It does not eliminate stacking-context boundaries caused by other properties.

```html
<div class="work-grid">
  <article class="work-tile work-tile--featured">Featured project</article>
  <article class="work-tile work-tile--supporting">Supporting project</article>
</div>
```

```css
.work-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.work-tile { min-height: 12rem; padding: 1.5rem; border-radius: 1rem; }
.work-tile--featured { z-index: 2; background: #d9e9ff; }
.work-tile--supporting { z-index: 1; background: #f7d8c9; margin-left: -2rem; }
```

This works because the tiles are grid items. If the same elements are moved out of the grid or changed to ordinary block children, verify the new behavior rather than assuming `z-index` still applies the same way.

### 12. `position: sticky` and `position: fixed` Need a Layer Plan

Sticky and fixed elements commonly create stacking contexts, so they should be assigned deliberate roles in the interface. A sticky header should usually sit above ordinary page content, but not above a modal dialog that is supposed to own the user's attention. A fixed support button should not cover form submit controls or focus indicators.

```css
:root {
  /* Centralized layer tokens make the hierarchy reviewable. */
  --layer-content: 0;
  --layer-header: 20;
  --layer-popover: 40;
  --layer-toast: 60;
}
.site-header { position: sticky; top: 0; z-index: var(--layer-header); }
.filter-popover { position: absolute; z-index: var(--layer-popover); }
.toast-region { position: fixed; right: 1rem; bottom: 1rem; z-index: var(--layer-toast); }
```

The numbers are not magic. They are an agreed hierarchy within the relevant context. A modal that needs to appear above the header should use the browser's top layer or an overlay architecture that is not trapped below the header's context.

### 13. The Browser Top Layer Is Separate From Ordinary Stacking

Some browser-managed UI is placed in the **top layer**, above ordinary document stacking contexts. Native modal dialogs opened with `showModal()` and shown popovers can use this mechanism. A normal element with `z-index: 999999999` cannot reliably out-rank a top-layer element because the top layer is not simply another child in the document's normal stack.

```html
<button id="open-contact-dialog" type="button">Contact us</button>
<dialog id="contact-dialog" aria-labelledby="contact-title">
  <form method="dialog">
    <h2 id="contact-title">Start a project</h2>
    <p>Tell us what you are building.</p>
    <label for="project-email">Email address</label>
    <input id="project-email" name="email" type="email" autocomplete="email" required>
    <button value="cancel">Cancel</button>
    <button value="submit">Continue</button>
  </form>
</dialog>
<script>
  const contactDialog = document.querySelector('#contact-dialog');
  const openContactDialog = document.querySelector('#open-contact-dialog');

  openContactDialog.addEventListener('click', () => {
    // Native modal behavior provides a top-layer dialog and modal semantics.
    if (!contactDialog.open) contactDialog.showModal();
  });
</script>
```

Use the top layer for UI that should truly overlay the page, but do not assume that showing a dialog automatically solves every accessibility detail. Give it an accessible name, ensure the content is usable with keyboard and touch, provide an obvious close/cancel path, and test focus behavior in the browsers you support.

### 14. Diagnose the Ancestor Chain, Not Just the Target

When a layer is hidden, inspect the target and then walk upward through every ancestor. Look for `transform`, `opacity`, `filter`, `isolation`, positioned `z-index`, containment, and clipping. The nearest ancestor that creates a stacking context is often the boundary that explains the failure. Also inspect the competing element's ancestor chain; the bug may be in the sibling group rather than the target.

A practical debugging sequence:

1. Reproduce the overlap in a minimal viewport and note which element should win.
2. Inspect the hidden element in DevTools and confirm its computed `position`, `z-index`, `opacity`, `transform`, and `filter`.
3. Walk up its ancestors and record stacking-context triggers.
4. Inspect the competing element and identify the two contexts compared at their common ancestor.
5. Temporarily disable one suspected trigger at a time. Do not change five properties at once.
6. Check whether the issue is actually clipping, a containing block, or pointer-event interception rather than paint order.
7. Make the smallest structural fix and test at narrow and wide breakpoints.

```js
// Paste into DevTools Console after selecting the element in the Elements panel.
// The report is intended to reveal suspicious ancestors, not to prove every
// browser-specific stacking rule automatically.
function inspectLayerAncestors(element) {
  const report = [];
  let currentElement = element;

  while (currentElement instanceof HTMLElement) {
    const styles = getComputedStyle(currentElement);
    const createsLikelyContext =
      (styles.position !== 'static' && styles.zIndex !== 'auto') ||
      Number(styles.opacity) < 1 ||
      styles.transform !== 'none' ||
      styles.filter !== 'none' ||
      styles.backdropFilter !== 'none' ||
      styles.isolation === 'isolate' ||
      styles.mixBlendMode !== 'normal' ||
      styles.contain.includes('paint');

    report.push({
      element: currentElement,
      position: styles.position,
      zIndex: styles.zIndex,
      opacity: styles.opacity,
      transform: styles.transform,
      filter: styles.filter,
      isolation: styles.isolation,
      overflow: `${styles.overflowX} / ${styles.overflowY}`,
      likelyStackingContext: createsLikelyContext
    });

    currentElement = currentElement.parentElement;
  }

  console.table(report);
  return report;
}

// Select the obscured menu in Elements, then run:
// inspectLayerAncestors($0);
```

The helper is a diagnostic aid, not a standards-complete stacking-context detector. Browser engines add special cases, and computed styles alone do not expose the full paint tree. Use it to find candidates, then verify by toggling properties and inspecting actual behavior.

---

## Advanced Patterns

### Pattern 1: A Small, Documented Layer Scale

**What it does:** Establishes a consistent vocabulary for normal content, sticky navigation, popovers, toast notifications, and other recurring layers.  
**When to use it:** Multi-page sites, design systems, client sites with reusable UI, or any project where components are built by more than one person.

A layer scale prevents each component author from inventing a new number. The numbers below express intended roles, not a promise that every element on the site can compete globally. Context boundaries still apply.

```css
:root {
  /* Keep the scale sparse; gaps leave room for future component classes. */
  --z-base: 0;
  --z-raised-card: 5;
  --z-sticky-header: 20;
  --z-dropdown: 30;
  --z-tooltip: 40;
  --z-toast: 60;
}

.site-header { position: sticky; top: 0; z-index: var(--z-sticky-header); }
.project-card--raised { position: relative; z-index: var(--z-raised-card); }
.navigation-menu { position: absolute; z-index: var(--z-dropdown); }
.tooltip { position: absolute; z-index: var(--z-tooltip); }
.toast-region { position: fixed; z-index: var(--z-toast); inset: auto 1rem 1rem auto; }
```

**Integration rule:** Define where these layers are allowed to compete. A dropdown inside a transformed card may still be trapped. Put cross-page overlays in a dedicated overlay root or use a browser top-layer primitive rather than increasing every token.

### Pattern 2: A Dedicated Overlay Root

**What it does:** Gives menus, custom tooltips, and lightweight overlays a predictable ancestor outside common clipping and transform boundaries.  
**When to use it:** A custom dropdown must escape a card's `overflow: hidden`, or an element inside animated artwork must overlay unrelated page content.

```html
<body>
  <main id="page-content">
    <button id="share-project" type="button" aria-expanded="false" aria-controls="share-menu">
      Share project
    </button>
  </main>

  <!-- Kept outside transformed/clipped content so the menu can layer predictably. -->
  <div id="overlay-root"></div>

  <script>
    const shareButton = document.querySelector('#share-project');
    const overlayRoot = document.querySelector('#overlay-root');
    const shareMenu = document.createElement('div');
    shareMenu.id = 'share-menu';
    shareMenu.className = 'share-menu';
    shareMenu.setAttribute('role', 'group');
    shareMenu.innerHTML = `
      <a href="mailto:?subject=Project%20portfolio">Share by email</a>
      <button type="button" data-copy-link>Copy project link</button>
    `;

    shareButton.addEventListener('click', () => {
      const isOpen = shareButton.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        shareMenu.remove();
        shareButton.setAttribute('aria-expanded', 'false');
        shareButton.focus();
        return;
      }

      overlayRoot.append(shareMenu);
      const buttonRect = shareButton.getBoundingClientRect();
      shareMenu.style.left = `${Math.round(buttonRect.left)}px`;
      shareMenu.style.top = `${Math.round(buttonRect.bottom + 8)}px`;
      shareButton.setAttribute('aria-expanded', 'true');
      shareMenu.querySelector('a').focus();
    });

    overlayRoot.addEventListener('click', async (event) => {
      const copyButton = event.target.closest('[data-copy-link]');
      if (!copyButton) return;

      try {
        await navigator.clipboard.writeText(window.location.href);
        copyButton.textContent = 'Link copied';
      } catch (error) {
        // Clipboard access can fail outside secure contexts or without permission.
        copyButton.textContent = 'Copy unavailable — use the address bar';
        console.error('Could not copy project URL:', error);
      }
    });
  </script>
</body>
```

```css
#overlay-root { position: relative; z-index: 30; }
.share-menu {
  position: fixed;
  display: grid;
  gap: .5rem;
  min-width: 13rem;
  padding: .75rem;
  border: 1px solid #d4d4d8;
  border-radius: .75rem;
  background: white;
  color: #171717;
  box-shadow: 0 1rem 3rem rgb(0 0 0 / 18%);
}
.share-menu a, .share-menu button { padding: .6rem; text-align: left; }
.share-menu :focus-visible { outline: 3px solid #6558f5; outline-offset: 2px; }
```

This is a compact illustration of the architecture, not a complete production menu primitive. A production component must also handle Escape, outside click, viewport-edge collision, scroll/resize repositioning, touch targets, focus return, and robust keyboard navigation. For complex menus, prefer a well-tested accessible component library or native popover/dialog behavior over hand-rolling the entire interaction.

### Pattern 3: A Local Decorative Layer Stack

**What it does:** Keeps a card's glow, image, gradient, and text in a self-contained stacking context.  
**When to use it:** Awwwards-style project cards, editorial hero panels, hover art, or blend-mode effects that must not leak into neighboring components.

```html
<article class="portfolio-tile">
  <img class="portfolio-tile__image" src="/images/architecture-study.webp" alt="Concrete architecture model in afternoon light">
  <div class="portfolio-tile__wash" aria-hidden="true"></div>
  <div class="portfolio-tile__copy">
    <p class="portfolio-tile__category">Digital experience</p>
    <h2>Quiet Structures</h2>
    <a href="/work/quiet-structures">View project</a>
  </div>
</article>
```

```css
.portfolio-tile {
  position: relative;
  isolation: isolate; /* All visual layers are intentionally local. */
  display: grid;
  min-height: 24rem;
  overflow: hidden;
  border-radius: 1.25rem;
  background: #252525;
  color: white;
}
.portfolio-tile__image,
.portfolio-tile__wash,
.portfolio-tile__copy { grid-area: 1 / 1; }
.portfolio-tile__image { width: 100%; height: 100%; object-fit: cover; transition: transform 700ms cubic-bezier(.2,.7,.2,1); }
.portfolio-tile__wash { z-index: 1; background: linear-gradient(0deg, rgb(0 0 0 / 78%), transparent 72%); }
.portfolio-tile__copy { z-index: 2; align-self: end; padding: clamp(1.25rem, 4vw, 2.5rem); }
.portfolio-tile:hover .portfolio-tile__image { transform: scale(1.04); }
.portfolio-tile a { color: inherit; text-underline-offset: .25em; }
.portfolio-tile a:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) {
  .portfolio-tile__image { transition: none; }
}
```

The `isolation` boundary keeps the composition's blend and stack behavior local. The `overflow` is intentional because the image zoom should be clipped to the card. Interactive elements stay above the visual wash and retain a visible focus outline.

### Pattern 4: A Reliable Modal Layer With Native `<dialog>`

**What it does:** Uses the browser top layer for a modal instead of trying to out-number every other `z-index`.  
**When to use it:** Contact forms, project inquiry flows, image detail dialogs, or a focused confirmation step.

```html
<button id="launch-inquiry" type="button">Discuss a project</button>
<dialog id="inquiry-dialog" aria-labelledby="inquiry-heading">
  <form id="inquiry-form" method="dialog">
    <button class="dialog-close" value="cancel" aria-label="Close project inquiry">×</button>
    <h2 id="inquiry-heading">Tell me about your project</h2>
    <label for="inquiry-name">Your name</label>
    <input id="inquiry-name" name="name" autocomplete="name" required>
    <label for="inquiry-email">Work email</label>
    <input id="inquiry-email" name="email" type="email" autocomplete="email" required>
    <button value="cancel">Not now</button>
    <button id="submit-inquiry" value="default">Continue</button>
  </form>
</dialog>
<script>
  const inquiryDialog = document.querySelector('#inquiry-dialog');
  const inquiryLaunch = document.querySelector('#launch-inquiry');
  const inquiryName = document.querySelector('#inquiry-name');

  inquiryLaunch.addEventListener('click', () => {
    inquiryDialog.showModal();
    // Focus the first meaningful field instead of leaving focus behind the modal.
    inquiryName.focus();
  });

  inquiryDialog.addEventListener('close', () => {
    // Return focus to the control that opened the dialog after it closes.
    inquiryLaunch.focus();
  });
</script>
```

```css
dialog {
  width: min(34rem, calc(100vw - 2rem));
  max-width: none;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 1rem;
  background: #17171d;
  color: #f8f8fb;
}
dialog::backdrop { background: rgb(7 8 14 / 68%); backdrop-filter: blur(4px); }
dialog form { display: grid; gap: .85rem; }
dialog input { width: 100%; padding: .75rem; }
dialog :focus-visible { outline: 3px solid #a8a0ff; outline-offset: 3px; }
```

Do not use `dialog.show()` when the intent is modal behavior; `showModal()` places it in the top layer and establishes modal interaction behavior. Still test validation, Escape, focus restoration, and the exact browser support required by the project.

### Pattern 5: A Popover for Non-Modal Menus

**What it does:** Uses the HTML Popover API to place a lightweight surface in the top layer without creating a modal dialog.  
**When to use it:** A small help panel, a share menu, a filter panel, or contextual actions that should overlay content without making the rest of the page inert.

```html
<button type="button" popovertarget="project-actions" aria-controls="project-actions">
  Project actions
</button>
<div id="project-actions" popover>
  <a href="/work/quiet-structures">Open case study</a>
  <button type="button" id="copy-case-study">Copy link</button>
  <p id="copy-status" role="status" aria-live="polite"></p>
</div>
<script>
  const copyCaseStudyButton = document.querySelector('#copy-case-study');
  const copyStatus = document.querySelector('#copy-status');

  copyCaseStudyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(new URL('/work/quiet-structures', location.origin).href);
      copyStatus.textContent = 'Case study link copied.';
    } catch (error) {
      // Give the user a useful fallback instead of failing silently.
      copyStatus.textContent = 'Copy failed. Copy the page URL from your browser address bar.';
      console.error('Project link copy failed:', error);
    }
  });
</script>
```

```css
[popover] {
  max-width: min(22rem, calc(100vw - 2rem));
  padding: 1rem;
  border: 1px solid #d4d4d8;
  border-radius: .85rem;
  box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 18%);
}
[popover] a, [popover] button { display: block; padding: .65rem; }
[popover] :focus-visible { outline: 3px solid #6558f5; outline-offset: 2px; }
```

The popover is not automatically a full keyboard menu widget. If you use menu semantics, implement the expected arrow-key behavior. For ordinary links and buttons in a popover, preserve their native semantics and test focus movement. Check browser support and provide a fallback if your client’s support matrix requires one.

### Pattern 6: Animated Layers Without Permanent Layer Pollution

**What it does:** Keeps animation-related stacking changes intentional and avoids adding transforms to every element as a superstition-based performance trick.  
**When to use it:** Scroll-revealed cards, hero artwork, image hover transitions, and GSAP-driven motion.

```css
.reveal-card {
  opacity: 1;
  transform: none;
  transition: opacity 450ms ease, transform 450ms cubic-bezier(.2,.7,.2,1);
}
.reveal-card[data-state="hidden"] {
  opacity: 0;
  transform: translateY(1rem);
}
.reveal-card[data-state="visible"] {
  opacity: 1;
  transform: translateY(0);
}
@media (prefers-reduced-motion: reduce) {
  .reveal-card { transition: none; transform: none; }
}
```

```js
const revealCards = document.querySelectorAll('.reveal-card');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (reducedMotion.matches) {
  // Avoid a hidden initial state when the visitor has requested reduced motion.
  revealCards.forEach((card) => card.dataset.state = 'visible');
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.state = 'visible';
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });

  revealCards.forEach((card) => {
    card.dataset.state = 'hidden';
    revealObserver.observe(card);
  });
}
```

An animated transform can create a stacking context while active and may continue to do so if the final style retains a transform such as `translateY(0)`. That is not automatically wrong, but it is a real architectural choice. Avoid `translateZ(0)` on every card unless profiling demonstrates a reason; forced compositing can consume memory and complicate layer behavior.

### Pattern 7: A Layer Debugging Harness

**What it does:** Creates a repeatable test scene that exposes the difference between a high child `z-index`, a low parent context, and clipping.  
**When to use it:** Before rewriting a complex production page, or when a bug only appears inside an animation-heavy component.

```html
<main class="layer-lab">
  <h1>Layer debugging lab</h1>
  <div class="lab-row">
    <section class="lab-card lab-card--trapped">
      <h2>Trapped context</h2>
      <p>The tooltip has a high number but its parent context is lower.</p>
      <span class="lab-tooltip">Tooltip: z-index 9999</span>
    </section>
    <section class="lab-card lab-card--front">
      <h2>Front context</h2>
      <p>This entire card paints above the first card.</p>
    </section>
  </div>
  <button id="toggle-context" type="button">Toggle parent transform</button>
  <button id="toggle-clip" type="button">Toggle clipping</button>
</main>
<script>
  const trappedCard = document.querySelector('.lab-card--trapped');
  const layerLab = document.querySelector('.layer-lab');

  document.querySelector('#toggle-context').addEventListener('click', () => {
    // Removing the transform lets you test whether it created the boundary.
    trappedCard.classList.toggle('without-transform');
  });

  document.querySelector('#toggle-clip').addEventListener('click', () => {
    layerLab.classList.toggle('clip-lab');
  });
</script>
```

```css
.layer-lab { padding: 2rem; font: 1rem/1.5 system-ui, sans-serif; }
.lab-row { position: relative; display: flex; gap: 1rem; align-items: start; }
.lab-card { position: relative; width: min(19rem, 45vw); min-height: 13rem; padding: 1rem; border: 1px solid #777; border-radius: .75rem; }
.lab-card--trapped { z-index: 1; transform: translateZ(0); background: #e5efff; }
.lab-card--front { z-index: 2; background: #f8dfd4; }
.lab-card--trapped.without-transform { transform: none; }
.lab-tooltip { position: absolute; top: 7rem; left: 9rem; z-index: 9999; padding: .75rem; background: #171717; color: white; }
.layer-lab.clip-lab { overflow: hidden; }
@media (max-width: 38rem) { .lab-row { flex-direction: column; } .lab-card { width: 100%; } }
```

Use the harness to isolate one variable at a time. A reliable debugging harness is more useful than adding random numbers to the production stylesheet because it helps establish the cause before the fix.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---------|---------------|-----|
| Setting `z-index: 999999` on the hidden child | It feels like a global priority number. | Compare the parent stacking contexts at their nearest common ancestor; raise or restructure the correct parent, not the child number. |
| Assuming every positioned element creates a context | `position` and `z-index` are often taught as one rule. | Check whether `z-index` is `auto`; remember fixed/sticky and several non-position triggers have separate rules. |
| Adding `transform: translateZ(0)` to “fix” layering | GPU folklore treats transforms as a universal optimization. | Remove unnecessary transforms and re-test; use transforms for actual motion, and profile before adding promotion hints. |
| Fading a whole panel with `opacity` when only its surface should be translucent | The visual result initially looks close enough. | Use an alpha background color when text and controls must remain fully opaque. |
| Putting a dropdown inside an ancestor with `overflow: hidden` | The clipping is added for rounded images and the dropdown is added later. | Move the dropdown outside the clipped subtree or render it in an overlay root/popover. |
| Treating clipping as a z-index problem | A clipped menu looks like it is behind something. | Inspect ancestor `overflow`, `clip-path`, masks, and containment; stacking cannot reveal pixels that are clipped. |
| Using negative `z-index` for every decoration | It seems like an easy way to send art “behind” content. | Define an explicit local layer stack with `isolation: isolate`, then verify the element remains above the intended background. |
| Raising the sticky header above every other component | Header layering is solved locally without considering dialogs. | Reserve a layer token for the header and use top-layer dialogs/popovers for UI that must supersede it. |
| Assuming a child can escape a parent's stacking context | Descendant values are mistaken for global values. | Move the overlay to a sibling context or change the parent context's relative order. |
| Using `filter: blur(0)` as a harmless visual no-op | A zero-looking effect is assumed to have no layout or paint side effects. | Remove unused filter declarations; treat any non-`none` filter as a potential context trigger and containing-block influence. |
| Using `will-change` permanently on many elements | It is copied from a performance tip without measurement. | Apply it only shortly before a real animation when profiling supports it, and remove it afterward. |
| Confusing DOM order with global layer order | Later markup often paints above earlier markup in simple examples. | Identify the relevant context and painting phase first; DOM order only resolves some ties inside that system. |
| Giving every card its own `z-index` | Local fixes accumulate until components overlap unpredictably. | Start with `z-index: auto`; add stack levels only where overlap is a deliberate part of the component contract. |
| Putting a fixed child inside a transformed hero and expecting viewport positioning | `transform` can establish the containing block for fixed descendants. | Move the viewport-fixed UI outside the transformed ancestor or use an overlay/top-layer primitive. |
| Forgetting keyboard focus when overlays visually overlap | The visual layer is tested only with a mouse. | Test tab order, focus visibility, Escape/cancel behavior, and focus return; visual priority must match interaction priority. |
| Treating a debugging script's heuristic as a browser specification | Computed-style checks are easier than understanding the full paint tree. | Use diagnostics to generate hypotheses, then confirm by toggling styles and testing the target browsers. |

### Before → After: A Typical Portfolio Bug

**Wrong:** a project card creates a context for its hover animation, and its dropdown is trapped below the sticky header.

```css
.project-card { position: relative; z-index: 0; transform: scale(1); }
.project-card__menu { position: absolute; z-index: 99999; }
.site-header { position: sticky; top: 0; z-index: 20; }
```

**Better when the menu belongs to the card:** make the card's intended group order explicit and keep the menu within the card's visual bounds.

```css
.project-card { position: relative; z-index: 1; transform: none; }
.project-card__menu { position: absolute; z-index: 2; }
.site-header { position: sticky; top: 0; z-index: 20; }
```

**Better when the menu must overlay the whole page:** render the menu in an overlay root or use the Popover API. The correct fix depends on the intended interaction, not on which CSS number is larger.

---

## Mental Models

1. **A stacking context is a sealed group** — the parent compares the group as a unit; its descendants do not compete globally.
2. **`z-index` is local, not absolute** — a large number only matters within the stacking relationship where it participates.
3. **Paint order and clipping are separate** — an element can be in front and still be clipped by an ancestor.
4. **Transforms are structural CSS** — they affect coordinate systems and stacking, not just the visible position of pixels.
5. **Opacity groups the subtree** — use alpha backgrounds for translucent surfaces when child text and controls must stay crisp.
6. **Overlay intent determines architecture** — card-local details belong inside the card; page-wide menus and dialogs need an overlay strategy.
7. **Debug the boundary, not the symptom** — inspect ancestor contexts and competing siblings before changing the target's `z-index`.

---

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|-------------------|-------------|-------|
| Positioned item that needs an explicit layer | `position: relative; z-index: 1` | Creates a stacking context when `z-index` is a non-`auto` integer. |
| Positioned item with default stack participation | `z-index: auto` | Does not create a stacking context solely because it is positioned. Other properties can still create one. |
| Flex/grid child overlap | `z-index: 1` on the item | A non-`auto` `z-index` can apply to flex/grid items even with `position: static`. |
| Local blend/decoration boundary | `isolation: isolate` | Creates an explicit stacking context without a fake transform. |
| Translucent panel surface | `background: rgb(255 255 255 / 90%)` | Keeps child content fully opaque. |
| Fade the whole component | `opacity: 0` to `1` | The subtree is composited as a group; it creates a context below `1`. |
| Animated element | `transform: translateY(...)` | Creates a stacking context; can affect containing blocks for positioned descendants. |
| Fixed page control | `position: fixed` | Commonly creates a context; beware transformed ancestors. |
| Sticky navigation | `position: sticky; top: 0` | Plan its relationship to menus, dialogs, and notifications. |
| Local dropdown | Positioned child with modest `z-index` | Works only if the ancestor chain does not trap or clip it. |
| Menu escaping a clipped card | Overlay root or Popover API | A higher `z-index` cannot undo clipping. |
| Modal dialog | `dialog.showModal()` | Uses the browser top layer; provide accessible naming and focus handling. |
| Non-modal popover | `popover` attribute / Popover API | Uses the top layer but does not make the rest of the page modal. |
| Suspicious ancestor | `transform`, `opacity`, `filter`, `isolation`, `contain` | Inspect computed styles upward from the obscured element. |
| Performance hint | `will-change` only when justified | Do not permanently promote large numbers of elements without profiling. |
| Layer scale | CSS custom properties such as `--z-header` | Tokens express intent; they do not bypass context boundaries. |

---

## Build Challenge

### Build a Layer-Safe Portfolio Case Study Card

**Build exactly this:** a responsive portfolio section with three overlapping case-study cards, a sticky site header, a card-local visual treatment, a share popover, and a native modal inquiry form. The goal is not merely to make the overlap look correct on your machine; the goal is to make the paint order explainable and stable.

#### Requirements

1. Create a semantic page with a `<header>`, `<main>`, a labelled `<section>` for selected work, three `<article>` cards, and a footer. Use meaningful headings and links rather than clickable generic containers.
2. Make the header sticky and assign it a documented CSS layer token. It must sit above normal content while scrolling, but it must not cover the modal dialog.
3. Each card must use a local stacking strategy for image, gradient, and text. Use `isolation: isolate` where appropriate and make the image clipping intentional.
4. Add a hover/focus treatment that scales or shifts the artwork without accidentally trapping the card's interactive content. Include a reduced-motion alternative.
5. Add a share control to at least one card. Use the Popover API or a dedicated overlay root. It must not be clipped by the card's image viewport.
6. Add a “Discuss a project” action that opens a native `<dialog>` with an accessible title, labelled form fields, cancel/close behavior, and visible focus styles.
7. Demonstrate one deliberate stacking-context failure in a temporary lab state: put a child with a very large `z-index` inside a low-level transformed parent, then document why the child loses. Do not leave the broken state enabled in the final UI.
8. Demonstrate one clipping failure separately from a stacking failure. Show that raising the menu's `z-index` does not restore content clipped by `overflow: hidden`.
9. Use a small, documented layer scale. Avoid unexplained values such as `999999`; each non-default layer must have a named role.
10. Test keyboard operation: tab through links and buttons, activate the share control, open and close the dialog, and confirm focus remains visible and returns to a sensible control.
11. Test at a narrow mobile width and a wide desktop width. Check card overlap, menu position, header behavior, and modal sizing.
12. Use DevTools to inspect the computed styles and ancestor chain for each overlay. Write a short comment in the code explaining the cause of each intentional stacking context.

#### Expected output

A polished portfolio section where the cards can overlap without random layer escalation, the share surface appears above the expected page content, the modal reliably appears above the sticky header, and no interactive control is clipped or obscured. Your implementation should contain a short `LAYERING.md` note that lists the layer tokens, identifies the stacking-context triggers in the cards, and explains the difference between the reproduced stacking bug and clipping bug.

#### Definition of done

- No unexplained extreme `z-index` values.
- No dropdown clipped by a rounded-image container.
- No page-wide overlay trapped inside a transformed card.
- Dialog has an accessible name, usable keyboard flow, and a visible close/cancel route.
- Reduced-motion preference is respected.
- Layering works at mobile and desktop widths.
- You can explain which ancestor context decides each important overlap without guessing.

---
