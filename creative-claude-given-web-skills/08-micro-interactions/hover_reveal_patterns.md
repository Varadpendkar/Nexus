---
name: hover-reveal-patterns
layer: layer-08-micro-interactions
filename: hover_reveal_patterns.md
description: Create polished hover and focus reveals that remain accessible, responsive, and robust across input types.
---

# Hover Reveal Patterns

## Why This Matters

Hover reveals are a common way to add depth without permanently crowding a layout. A project card can reveal a title and action, an image can expose supporting metadata, and a navigation item can uncover a submenu. Done well, the reveal adds useful context while keeping the initial interface calm. Done poorly, it hides important information from touch users, makes keyboard navigation confusing, causes layout shifts, or creates content that cannot be reached at all.

The key distinction is between **decorative enhancement** and **essential content**. If a reveal contains information or an action required to understand or use the page, that information must also be available without a mouse hover. Hover is only one input state; focus, touch, and reduced-motion preferences need deliberate behavior too.

This skill covers:
- CSS transitions and transforms that avoid layout shifts.
- Semantic hover targets and keyboard focus parity.
- Touch-friendly alternatives for hover-only content.
- Staggered reveals that remain restrained and performant.
- Image overlays, cards, menus, tooltips, and navigation patterns.
- Reduced-motion behavior and contrast-aware overlays.
- Debugging clipped, flickering, inaccessible, or unresponsive reveals.

## Core Concepts

### 1. Hover Is a State, Not an Action

The `:hover` pseudo-class describes when a pointing device is over an element. It does not mean the user has clicked, selected, or intentionally activated it. A hover reveal should not perform a destructive action, submit a form, navigate unexpectedly, or imply that a hidden control has already been activated.

```css
.project-card:hover .project-card__overlay {
  opacity: 1;
}
```

**Why:** Hover is transient. The pointer may pass over a card accidentally, and touchscreens may not have a meaningful hover state. Use hover to preview, emphasize, or expose supplementary information—not as the only way to trigger an essential action.

### 2. Pair Hover with Keyboard Focus

If a reveal is available when a user hovers a card, provide a comparable state when the interactive card or its control receives keyboard focus.

```css
.project-card:hover .project-card__overlay,
.project-card:focus-within .project-card__overlay {
  opacity: 1;
  visibility: visible;
}
```

**Why:** Keyboard users move focus, not a mouse pointer. `:focus-within` is useful when a card contains a link or button: the reveal remains visible while focus is anywhere inside the card.

Do not remove focus outlines to make the visual transition look cleaner. Design the focus indicator as part of the interaction.

### 3. Keep Essential Content Available by Default

A title, product name, price, required instruction, or only action should not exist exclusively in a hover reveal. If the information is essential, show it by default or provide a robust equivalent for touch and keyboard input.

**Why:** Touch users cannot reliably hover, and assistive technology does not expose CSS hover as a dependable interaction. A hidden CTA can become unreachable on a touchscreen if the design has no tap state.

A good rule: use hover to add emphasis and optional detail; do not use it to conceal the only route to completion.

### 4. Animate Visual Properties, Not Layout

Prefer opacity and transforms for reveal motion. Animating `height`, `margin`, or `top` can trigger layout recalculation and shift nearby content.

```css
.card__detail {
  opacity: 0;
  transform: translateY(0.5rem);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.card:hover .card__detail,
.card:focus-within .card__detail {
  opacity: 1;
  transform: translateY(0);
}
```

**Why:** A card should not push its neighbors around just because the pointer moved over it. Transform-based motion keeps the layout stable and usually produces smoother results.

There are legitimate cases where expanding height is the correct interaction, such as an accordion. In that case, treat it as a content expansion with appropriate semantics rather than disguising it as a decorative hover.

### 5. Understand `opacity`, `visibility`, and `pointer-events`

These properties solve different problems:
- `opacity: 0` makes an element transparent but does not remove it from hit testing or keyboard navigation.
- `visibility: hidden` hides the element and normally prevents it from being focused or hit-tested.
- `pointer-events: none` prevents pointer targeting but does not, by itself, remove an element from keyboard focus order.

**Why:** A visually hidden link can still receive keyboard focus or an invisible overlay can still intercept clicks. Choose a state model that accounts for both visibility and interaction.

For a decorative overlay, `pointer-events: none` may be appropriate. For an overlay containing real controls, it must become interactive when revealed, and the focus model must be designed deliberately.

### 6. Make the Entire Intended Target Hoverable

A reveal that disappears while the pointer moves from a card image to its overlay is often caused by a gap between the trigger and revealed content. Put the reveal inside the same hoverable component, or use a stable parent as the state owner.

```html
<article class="project-card">
  <img src="/images/project.jpg" alt="Preview of the project">
  <div class="project-card__overlay">
    <a href="/projects/atlas">View project</a>
  </div>
</article>
```

**Why:** The pointer should not have to cross a non-hoverable gap to reach the action. This is especially important for menus, tooltips, and popovers where a small gap can cause flicker.

### 7. Use Input-Capability Queries for Touch Fallbacks

Do not rely on user-agent sniffing or assume every device has a mouse. CSS media features can describe whether the primary input can hover and whether it is coarse or fine.

```css
@media (hover: hover) and (pointer: fine) {
  .card__overlay {
    /* Optional hover-specific enhancement */
  }
}
```

**Why:** Hybrid laptops and tablets may have both a touchscreen and a trackpad. A capability query allows the interface to enhance hover where it exists without making it a requirement.

If a reveal contains important actions, make those actions visible on small screens or provide a clear tap interaction. Merely forcing `:hover` styles onto touch devices is not a dependable design.

### 8. Avoid Hover-Only Menus

Navigation menus are especially sensitive because a user must be able to open the menu, move into it, and activate an item. A CSS-only hover menu can be suitable for a simple enhancement, but complex menus often need explicit open/close state and keyboard handling.

**Why:** If the submenu closes as the pointer leaves the parent before reaching the submenu, the user cannot access it. Keyboard users also need predictable focus order, Escape behavior where appropriate, and visible focus states.

Use semantic links and buttons. A button that opens a submenu should communicate its expanded state, and the menu must not depend on hover alone.

### 9. Stagger with Restraint

A small delay between related items can make a gallery or list feel choreographed. Large delays can make the interface feel slow, and long transitions can make a reveal seem broken.

```css
.card__detail {
  transition-delay: 40ms;
}

.card:hover .card__detail {
  transition-delay: 0ms;
}
```

**Why:** The motion should reinforce grouping, not hold content hostage. Stagger only a few related elements and keep the total sequence short enough that the user can act immediately.

For CSS lists, use a bounded set of delays or a CSS custom property rather than generating arbitrary inline styles for every item.

### 10. Respect Reduced Motion

Hover reveals can still be useful without sliding, scaling, or staggering. Remove unnecessary motion when `prefers-reduced-motion: reduce` is active.

```css
@media (prefers-reduced-motion: reduce) {
  .card__detail {
    transition: none;
    transform: none;
  }
}
```

**Why:** A hover effect should not require movement to communicate its state. The same content can appear immediately or use a subtle opacity change.

Do not hide the reveal entirely in reduced-motion mode if it contains useful content. Simplify the animation, not the availability of information.

### 11. Keep Contrast Stable Across Images

Text that appears over an image must remain readable across the image's light and dark regions. Do not rely on a lucky photo crop to provide contrast.

```css
.card__overlay {
  background:
    linear-gradient(
      to top,
      rgb(0 0 0 / 78%),
      rgb(0 0 0 / 8%)
    );
  color: white;
}
```

**Why:** Images vary. A gradient or solid surface behind the text provides more predictable contrast than white text placed directly over arbitrary pixels.

Check the actual rendered text and background, including the lightest and darkest image variants. Keep a visible fallback if images fail to load.

### 12. Distinguish Reveals from Tooltips

A tooltip provides a short explanation for a control. A card reveal may include multiple links, metadata, or a larger action panel. These patterns have different accessibility and interaction needs.

**Why:** Treating every overlay as a tooltip can lead to incorrect ARIA usage or poor focus behavior. If the revealed content contains interactive controls, it is not a simple tooltip.

Use the right component model: tooltip for brief noninteractive help, disclosure for content that expands, menu for navigation choices, and a card overlay for supplementary card content.

## Patterns

### Pattern 1: Image Card Overlay

**Use when:** A project gallery should reveal a title, category, and action over an image on hover or focus.

Keep the image and overlay in the same positioned card. The overlay fades and moves a little without changing the card's dimensions.

```html
<article class="project-card">
  <img
    class="project-card__image"
    src="/images/architecture-study.jpg"
    alt="Contemporary building with a curved facade"
  >
  <div class="project-card__overlay">
    <p class="project-card__category">Architecture</p>
    <h2 class="project-card__title">Curved Forms</h2>
    <a class="project-card__link" href="/projects/curved-forms">
      View project
    </a>
  </div>
</article>
```

```css
.project-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 1rem;
  background: #222;
}

.project-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  transition: transform 400ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.project-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: clamp(1rem, 3vw, 2rem);
  color: white;
  background: linear-gradient(
    to top,
    rgb(0 0 0 / 82%),
    rgb(0 0 0 / 0%) 75%
  );
  opacity: 0;
  transform: translateY(0.5rem);
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}

.project-card:hover .project-card__overlay,
.project-card:focus-within .project-card__overlay {
  opacity: 1;
  transform: translateY(0);
}

.project-card:hover .project-card__image,
.project-card:focus-within .project-card__image {
  transform: scale(1.035);
}

.project-card__link:focus-visible {
  outline: 2px solid white;
  outline-offset: 4px;
}

@media (hover: none), (pointer: coarse) {
  .project-card__overlay {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card__image,
  .project-card__overlay {
    transition: none;
    transform: none;
  }
}
```

**Design notes:**
- The mobile rule keeps the action available without requiring hover. If that makes the card too crowded, redesign the mobile card rather than hiding its only action.
- `overflow: hidden` clips the image scale to the rounded card. Avoid putting focus outlines on an element that gets clipped; use an outer wrapper or another focus treatment if necessary.
- The overlay's gradient protects text contrast against changing image content.
- If the whole card is a link, avoid nesting another anchor inside it. Choose one semantic interaction model.

### Pattern 2: Underline and Label Reveal for Navigation

**Use when:** A navigation link needs a refined underline or small supporting label on hover and focus.

```html
<nav aria-label="Primary">
  <a class="nav-link" href="/work">
    <span class="nav-link__label">Work</span>
    <span class="nav-link__meta" aria-hidden="true">Selected projects</span>
  </a>
  <a class="nav-link" href="/about">
    <span class="nav-link__label">About</span>
    <span class="nav-link__meta" aria-hidden="true">Studio and story</span>
  </a>
</nav>
```

```css
.nav-link {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  gap: 0.2rem;
  color: inherit;
  text-decoration: none;
}

.nav-link__label::after {
  content: "";
  display: block;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}

.nav-link:hover .nav-link__label::after,
.nav-link:focus-visible .nav-link__label::after {
  transform: scaleX(1);
}

.nav-link__meta {
  opacity: 0;
  transform: translateY(0.25rem);
  transition: opacity 160ms ease, transform 160ms ease;
}

.nav-link:hover .nav-link__meta,
.nav-link:focus-visible .nav-link__meta {
  opacity: 1;
  transform: translateY(0);
}

.nav-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 5px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-link__label::after,
  .nav-link__meta {
    transition: none;
    transform: none;
  }
}
```

**Why it works:** The underline is a decorative pseudo-element, while the actual link remains a normal anchor. The label is supplementary; the link text itself is always present and usable.

If the metadata affects the layout, reserve space for it or position it carefully so hovering does not cause adjacent navigation items to jump.

### Pattern 3: Card Detail Reveal Without Layout Shift

**Use when:** A card has a secondary description that should appear on hover or focus, but the grid must remain stable.

```html
<article class="service-card">
  <h3>Digital strategy</h3>
  <p class="service-card__summary">
    Research, positioning, and product direction.
  </p>
  <a href="/services/strategy">Explore service</a>
</article>
```

```css
.service-card {
  position: relative;
  padding: 1.5rem;
  border: 1px solid rgb(0 0 0 / 14%);
  border-radius: 1rem;
  background: white;
  color: #171717;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.service-card__summary {
  opacity: 0.7;
  transform: translateY(0);
  transition: opacity 180ms ease, transform 180ms ease;
}

.service-card:hover,
.service-card:focus-within {
  border-color: currentColor;
  box-shadow: 0 12px 32px rgb(0 0 0 / 10%);
}

.service-card:hover .service-card__summary,
.service-card:focus-within .service-card__summary {
  opacity: 1;
  transform: translateY(-2px);
}
```

This version keeps the summary present and merely emphasizes it. That is often a better design than making meaningful text invisible until hover. Use a true reveal only when the information is supplementary and there is a reliable non-hover equivalent.

### Pattern 4: CSS-Only Disclosure for a Small Content Panel

**Use when:** A compact card has a secondary panel that can be expanded, and a full JavaScript interaction is unnecessary.

For a disclosure that contains essential information, prefer a real button and an explicit open state. CSS `:focus-within` alone does not create a reliable disclosure control. The following native `<details>` pattern provides keyboard and touch support without custom event handling.

```html
<details class="info-disclosure">
  <summary>
    <span>Delivery details</span>
    <span class="info-disclosure__icon" aria-hidden="true">+</span>
  </summary>
  <div class="info-disclosure__content">
    <p>Standard delivery usually takes three to five business days.</p>
    <a href="/shipping">Read shipping policy</a>
  </div>
</details>
```

```css
.info-disclosure {
  border: 1px solid #d5d5d5;
  border-radius: 0.75rem;
  padding: 1rem;
}

.info-disclosure summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  list-style: none;
}

.info-disclosure summary::-webkit-details-marker {
  display: none;
}

.info-disclosure__icon {
  transition: transform 180ms ease;
}

.info-disclosure[open] .info-disclosure__icon {
  transform: rotate(45deg);
}

.info-disclosure__content {
  padding-top: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .info-disclosure__icon {
    transition: none;
  }
}
```

**Important distinction:** This is a disclosure, not a hover-only reveal. Use it when the user should intentionally open and close content. Native semantics provide a more dependable foundation than trying to make a hover state act like a button.

### Pattern 5: Staggered Reveal for a Grid

**Use when:** A gallery or list should reveal a few related elements in sequence.

```html
<article class="work-card">
  <div class="work-card__reveal">
    <p class="work-card__eyebrow">Case study</p>
    <h3>Northstar</h3>
    <a href="/work/northstar">Read case study</a>
  </div>
</article>
```

```css
.work-card__reveal > * {
  opacity: 0;
  transform: translateY(0.5rem);
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.work-card:hover .work-card__reveal > *,
.work-card:focus-within .work-card__reveal > * {
  opacity: 1;
  transform: translateY(0);
}

.work-card__reveal > *:nth-child(1) {
  transition-delay: 0ms;
}

.work-card__reveal > *:nth-child(2) {
  transition-delay: 35ms;
}

.work-card__reveal > *:nth-child(3) {
  transition-delay: 70ms;
}

@media (prefers-reduced-motion: reduce) {
  .work-card__reveal > * {
    transition: none;
    transform: none;
  }
}
```

**Why:** A small stagger adds hierarchy, but the sequence remains short. Avoid long delays that make the action feel unavailable.

If these children contain keyboard-focusable controls, ensure they are not focusable while visually hidden. Either keep the content visible by default, use a carefully controlled visibility state, or use a component with explicit open state. Opacity alone does not remove links from the tab order.

### Pattern 6: Touch-Safe Card Actions

**Use when:** The desktop design reveals a CTA on hover, but the mobile design needs a reliable visible action.

```css
.project-card__action {
  opacity: 0;
  transform: translateY(0.4rem);
  transition: opacity 180ms ease, transform 180ms ease;
}

.project-card:hover .project-card__action,
.project-card:focus-within .project-card__action {
  opacity: 1;
  transform: translateY(0);
}

@media (hover: none), (pointer: coarse) {
  .project-card__action {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card__action {
    transition: none;
    transform: none;
  }
}
```

**Why:** The action is available on coarse-pointer devices without a first tap being consumed merely to simulate hover. If the card itself navigates, keep the interaction model clear and avoid nesting interactive elements incorrectly.

### Pattern 7: Menu Trigger with Explicit State

**Use when:** A navigation submenu must be available to pointer and keyboard users. Use a button to control the menu rather than depending exclusively on `:hover`.

```html
<div class="nav-disclosure">
  <button
    class="nav-disclosure__trigger"
    type="button"
    aria-expanded="false"
    aria-controls="services-menu"
  >
    Services
  </button>
  <div class="nav-disclosure__panel" id="services-menu" hidden>
    <a href="/services/design">Design</a>
    <a href="/services/development">Development</a>
    <a href="/services/strategy">Strategy</a>
  </div>
</div>
```

```js
function mountNavDisclosure(root) {
  const trigger = root.querySelector(".nav-disclosure__trigger");
  const panel = root.querySelector(".nav-disclosure__panel");
  if (!trigger || !panel) return () => {};

  function setOpen(open) {
    trigger.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  }

  function onClick() {
    setOpen(trigger.getAttribute("aria-expanded") !== "true");
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      trigger.focus();
    }
  }

  function onDocumentClick(event) {
    if (!root.contains(event.target)) setOpen(false);
  }

  trigger.addEventListener("click", onClick);
  root.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onDocumentClick);

  return () => {
    trigger.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("click", onDocumentClick);
  };
}

const navRoot = document.querySelector(".nav-disclosure");
if (navRoot) {
  const unmountNav = mountNavDisclosure(navRoot);
}
```

This is a simple disclosure pattern for ordinary site navigation, not a full application menu or ARIA menu widget. If the design needs arrow-key navigation, nested menu semantics, or complex focus management, use a tested accessible menu implementation rather than expanding this minimal pattern ad hoc.

### Pattern 8: Reduced-Motion and No-Hover Baseline

**Use when:** You need one predictable baseline that can be applied across a design system.

```css
.reveal {
  opacity: 1;
  transform: none;
}

@media (hover: hover) and (pointer: fine) {
  .reveal--hover {
    opacity: 0;
    transform: translateY(0.4rem);
    transition: opacity 180ms ease, transform 180ms ease;
  }

  .reveal-card:hover .reveal--hover,
  .reveal-card:focus-within .reveal--hover {
    opacity: 1;
    transform: none;
  }
}

@media (hover: none), (pointer: coarse) {
  .reveal--hover {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal--hover {
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }
}
```

The baseline is visible. Only fine-pointer devices receive the hidden-then-reveal enhancement. This is a strong default for design systems because content availability does not depend on hover support.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Hiding essential text until hover | Touch and keyboard users may not discover it | Keep important content visible or provide a deliberate disclosure |
| Supporting `:hover` but not focus | Keyboard users do not receive equivalent feedback | Pair with `:focus-visible` or `:focus-within` |
| Using opacity alone for hidden controls | Invisible links may remain in the tab order or intercept input | Model visibility and interactivity together |
| Removing focus outlines | Keyboard navigation becomes hard to track | Add a designed `:focus-visible` indicator |
| Animating height for a decorative reveal | Causes layout recalculation and layout shift | Prefer opacity and transforms |
| Creating a pointer gap between trigger and overlay | Reveal flickers before the pointer reaches the content | Keep trigger and panel within a stable parent |
| Making a hover-only CTA on mobile | Touch users may have no reliable way to reveal it | Show the CTA on coarse-pointer devices |
| Nesting anchors or buttons incorrectly | Creates invalid or confusing interaction semantics | Choose one clear semantic interaction model |
| Treating a card overlay as a tooltip | Interactive content may have incorrect semantics | Use a card overlay, disclosure, or menu according to purpose |
| Adding long stagger delays | Makes controls feel slow or unresponsive | Keep the sequence short and focused |
| Forgetting contrast over images | Text becomes unreadable on bright or busy regions | Use a tested gradient or solid surface |
| Using user-agent sniffing for touch | Fails on hybrid devices and future platforms | Use `hover` and `pointer` media features |
| Disabling all motion but also hiding content | Reduced-motion users lose access to information | Remove animation while preserving visibility |
| Letting hidden panels cover other controls | Overlay can block unrelated actions | Manage stacking, hit testing, and dismissal deliberately |
| Using hover to trigger navigation immediately | Pointer travel can cause accidental navigation | Use hover for preview and explicit activation for navigation |
| Making the entire card focusable without a clear purpose | Can create duplicate or confusing tab stops | Make the real link or button the interactive target |
| Forgetting focus behavior in menus | Submenu can close before keyboard users reach it | Keep focus handling and open state explicit |
| Using `pointer-events: none` on a panel with real controls | The controls cannot be clicked | Enable pointer interaction when the panel is active |
| Relying on color alone for state | Some users may not perceive the distinction | Combine color with underline, shape, text, or other cues |
| Ignoring reduced-motion preferences | Repeated movement can distract or cause discomfort | Simplify transitions and remove nonessential movement |
| Clipping focus rings with `overflow: hidden` | Focus can be technically present but visually invisible | Place the focus treatment on an unclipped wrapper |
| Using hover as a substitute for disclosure state | The panel closes unpredictably and cannot be operated reliably | Use a button and explicit expanded state for intentional content expansion |
| Failing to test failed image loads | Text may sit on an unexpected background | Supply a fallback background and verify contrast |
| Assuming `:focus-within` alone solves keyboard access | It reveals content but does not fix hidden focusable controls | Ensure tab order and visibility state agree |

## Mental Models

1. **Hover is optional enhancement.** The interface must remain understandable and operable when hover does not exist.
2. **Visibility and focusability are separate concerns.** A transparent element may still be interactive, so the state model must account for both.
3. **The trigger owns the reveal.** The pointer or focus should be able to move into the revealed content without the state collapsing.
4. **Stable layout makes interaction feel deliberate.** Animate opacity and transforms for decorative effects; reserve size changes for intentional disclosures.
5. **Focus is a first-class interaction state.** A hover design is incomplete until keyboard focus has been considered.
6. **Essential content should not be hidden behind a pointer.** Use hover for emphasis and optional detail, not the only way to access information.
7. **Reduced motion changes the transition, not the meaning.** The same information and actions should remain available.

## Quick Reference

### State selector baseline

```css
/* Pointer users */
.card:hover .card__reveal,

/* Keyboard users */
.card:focus-within .card__reveal {
  opacity: 1;
  transform: none;
}

/* Touch/coarse pointer */
@media (hover: none), (pointer: coarse) {
  .card__reveal {
    opacity: 1;
    transform: none;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card__reveal {
    transition: none;
    animation: none;
    transform: none;
  }
}
```

### Choose the correct pattern

| Need | Pattern |
|---|---|
| Reveal a title and CTA over an image | Image card overlay |
| Add a line or supporting label to a link | Navigation underline reveal |
| Emphasize card metadata without hiding it | Detail emphasis |
| Expand important supporting content | Native disclosure or explicit state |
| Sequence a few related elements | Short stagger |
| Make desktop hover actions usable on mobile | Always-visible coarse-pointer fallback |
| Open a submenu reliably | Button-controlled disclosure |
| Establish a safe design-system default | Visible baseline with conditional enhancement |

### Debugging sequence

1. Test with a mouse, keyboard, touch input, and reduced motion.
2. Confirm the trigger and reveal share a stable hover/focus region.
3. Inspect `opacity`, `visibility`, `pointer-events`, and `z-index`.
4. Tab through the component and check whether hidden links receive focus.
5. Confirm focus rings are not clipped by `overflow: hidden`.
6. Check for layout shifts while revealing content.
7. Verify text contrast over the brightest and darkest image regions.
8. Test at narrow viewport widths and on a hybrid device if available.
9. Check menu dismissal, Escape behavior, and focus restoration where applicable.
10. Confirm no essential action is available only through hover.

### Production checklist

- [ ] Essential content is visible or has a dependable non-hover equivalent.
- [ ] Hover reveals have keyboard-focus parity.
- [ ] Hidden controls have a deliberate focus and interaction model.
- [ ] Focus indicators remain visible and are not clipped.
- [ ] Touch and coarse-pointer users can access all actions.
- [ ] Reduced-motion mode preserves content and simplifies motion.
- [ ] Decorative reveals avoid unnecessary layout shifts.
- [ ] Overlays do not intercept unrelated controls.
- [ ] Image text contrast is tested with realistic assets.
- [ ] Menu and disclosure patterns use suitable semantics.
- [ ] Nested links and buttons are avoided.
- [ ] The component works if images fail or JavaScript is unavailable where relevant.

## Build Challenge

Create a responsive project gallery with image overlays, a navigation reveal, and one expandable details panel.

### Requirements

1. Each project card has a meaningful image alternative, title, category, and real project link.
2. Desktop fine-pointer users see a subtle overlay reveal on hover.
3. Keyboard users receive the same reveal through focus.
4. Touch and coarse-pointer devices see all essential actions without a hover gesture.
5. The overlay uses a contrast-safe gradient or solid background.
6. Reveal motion uses opacity and transforms without changing grid dimensions.
7. Reduced-motion mode removes nonessential transitions and transforms.
8. A details panel uses a native disclosure or explicit button-controlled state.
9. A navigation submenu can be opened and closed with a button, not hover alone.
10. Hidden links do not create invisible keyboard focus stops.
11. Focus rings remain visible around clipped cards.
12. Test at desktop, mobile, keyboard-only, and reduced-motion settings.

### Acceptance criteria

- Every project can be opened with mouse, keyboard, and touch.
- No essential action depends on hover.
- Grid layout remains stable during card reveals.
- Keyboard focus is visible and reveals relevant content.
- Touch users do not need a first tap just to expose a required CTA.
- Text remains readable on light, dark, and busy images.
- Reduced-motion mode preserves content and removes unnecessary movement.
- Menus and disclosures have clear expanded states and predictable dismissal.
- The page contains no invalid nested interactive elements.
- The experience remains usable when images fail to load.

### Review questions

1. Why is hover an unreliable place to hide essential content?
2. What does `:focus-within` provide that `:hover` does not?
3. Why can `opacity: 0` be insufficient for hiding a focusable link?
4. When should you use a disclosure instead of a hover reveal?
5. Why are opacity and transforms usually preferable for decorative transitions?
6. How should hover-specific designs adapt to coarse-pointer devices?
7. What makes a hover menu flicker as the pointer enters its panel?
8. Why must image overlays be tested for contrast across different images?
9. How should reduced-motion preferences affect a reveal?
10. What should be verified before shipping a hover-reveal component?
