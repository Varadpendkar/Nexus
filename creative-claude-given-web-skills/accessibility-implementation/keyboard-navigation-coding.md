# SKILL: keyboard-navigation-coding
**Layer:** 29 — Accessibility Implementation
**Goal:** Make every interactive task operable with a keyboard, with predictable tab order, visible focus, and no keyboard traps.

---

## Why This Matters (Senior Perspective)
Keyboard defects often appear after custom UI is added: a card looks clickable but is a non-focusable section, a dropdown works only on hover, a drag interaction has no alternative, or a modal lets Tab escape behind it. These failures block people with motor disabilities, switch devices, voice control, or temporary injuries. Senior developers use native controls first, then implement an intentional keyboard contract for custom widgets. WCAG 2.2 AA is a practical baseline. Test from a fresh page using Tab, Shift+Tab, Enter, Space, widget-specific arrow keys, and Escape where dismissal is expected. Receiving focus does not prove that an element is operable.

---

## Core Concepts

### 1 Native controls
Use anchors for navigation and buttons for actions; generic click targets do not inherit focus, activation, or disabled behavior.

**Implementation pattern**

```javascript
<a href="/case-studies/medpay">Read the MEDPAY case study</a>
<button type="button" id="copy-link">Copy case study link</button>
<script>
document.querySelector("#copy-link").addEventListener("click", async () => {
 await navigator.clipboard.writeText(location.origin + "/case-studies/medpay");
});
</script>
```

**Gotcha:** A clickable article is not automatically keyboard-operable.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 2 Logical tab order
Tab follows focusable DOM order. Avoid positive `tabindex`; fix source order to match visual reading order.

**Implementation pattern**

```html
<nav aria-label="Main navigation"><a href="/work">Work</a><a href="/services">Services</a><a href="/contact">Contact</a></nav>
<style>a:focus-visible{outline:3px solid #005fcc;outline-offset:3px}</style>
```

**Gotcha:** Positive tabindex creates a second ordering system that breaks as pages evolve.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 3 Visible focus
A keyboard user must see the current location. Preserve browser styles or create a high-contrast outline that is not clipped.

**Implementation pattern**

```html
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible {
 outline:3px solid #005fcc; outline-offset:3px; box-shadow:0 0 0 2px #fff;
}
```

**Gotcha:** Removing outline without replacement removes the keyboard location cue.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 4 Focus-visible behavior
`:focus-visible` uses browser heuristics to show focus where appropriate; never suppress all focus styles to avoid pointer rings.

**Implementation pattern**

```html
 :where(a,button,input,select,textarea,[tabindex]):focus-visible {
 outline:3px solid #ffbf47; outline-offset:3px;
}
```

**Gotcha:** Heuristics differ across browsers; test keyboard use directly.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 5 Disclosure navigation
Use a button to reveal links, with Tab reaching each revealed link and the trigger closing the panel.

**Implementation pattern**

```html
<button id="services-trigger" aria-expanded="false" aria-controls="services-panel">Services</button>
<ul id="services-panel" hidden><li><a href="/design">Design</a></li><li><a href="/development">Development</a></li></ul>
```

**Gotcha:** Ordinary website navigation usually does not need the complex ARIA menu role.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 6 Modal keyboard behavior
A modal needs focus inside, containment, dismissal when expected, and focus restoration. Native `<dialog>` is a strong starting point.

**Implementation pattern**

```javascript
<button id="open-contact">Contact studio</button>
<dialog id="contact-dialog" aria-labelledby="contact-title"><form method="dialog">
<h2 id="contact-title">Contact the studio</h2><label for="contact-email">Email</label><input id="contact-email" type="email">
<button value="cancel">Cancel</button><button value="send">Continue</button></form></dialog>
<script>
const dialog = document.querySelector("#contact-dialog");
document.querySelector("#open-contact").addEventListener("click", () => dialog.showModal());
</script>
```

**Gotcha:** A visual overlay that allows background interaction is not truly modal.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 7 Escape dismissal
Scope Escape handling to the active component; do not close every open layer globally.

**Implementation pattern**

```javascript
document.addEventListener("keydown", (event) => {
 const activeDialog = document.querySelector("dialog[open]");
 if (event.key === "Escape" && activeDialog) activeDialog.close();
});
```

**Gotcha:** Nested overlays need explicit ownership of Escape.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 8 Composite widget keys
Tabs, radio groups, listboxes, and grids may use arrow keys internally. Implement the exact pattern rather than mixing keyboard models.

**Implementation pattern**

```javascript
const tabs = [...document.querySelectorAll('[role="tab"]')];
tabs.forEach((tab, index) => tab.addEventListener("keydown", (event) => {
 if (!["ArrowRight","ArrowLeft"].includes(event.key)) return;
 event.preventDefault();
 const step = event.key === "ArrowRight" ? 1 : -1;
 const next = (index + step + tabs.length) % tabs.length;
 tabs.forEach((item, i) => { item.tabIndex = i === next ? 0 : -1; item.setAttribute("aria-selected", String(i === next)); });
 tabs[next].focus();
}));
```

**Gotcha:** Arrow-key support alone is not a complete tabs pattern.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 9 Skip links
A skip link bypasses repeated navigation and should become visible on focus.

**Implementation pattern**

```html
<a class="skip-link" href="#main-content">Skip to main content</a>
<main id="main-content" tabindex="-1"><h1>Selected work</h1></main>
<style>.skip-link{position:absolute;top:-5rem}.skip-link:focus-visible{top:1rem;z-index:1000}</style>
```

**Gotcha:** A skip link pointing to a missing ID silently fails.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 10 Drag alternatives
Provide Move up/down controls or another non-drag workflow for sortable interfaces.

**Implementation pattern**

```html
<li class="playlist-item"><span>Intro animation</span>
<button type="button" aria-label="Move Intro animation up">Move up</button>
<button type="button" aria-label="Move Intro animation down">Move down</button></li>
```

**Gotcha:** A hidden shortcut is not a complete alternative if users cannot discover it.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 11 Focus obscured by sticky UI
Focused controls must not be entirely hidden behind fixed headers or toolbars.

**Implementation pattern**

```html
html{scroll-padding-block-start:6rem}
:where(h1,h2,a,button,input,select,textarea){scroll-margin-block-start:6rem}
```

**Gotcha:** A correct focus ring is useless if the target is covered.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 12 Pointer parity
Essential behavior must not depend only on hover or drag events. Use semantic activation and equivalent touch/keyboard controls.

**Implementation pattern**

```html
document.querySelector("#preview-project").addEventListener("click", () => {
 document.querySelector("#project-preview").hidden = false;
});
```

**Gotcha:** `pointerdown` can fire before a user has a chance to cancel an action.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 13 Manual keyboard audits
Test the whole task, including errors, empty results, zoom, overlays, and dynamic list changes.

**Implementation pattern**

```javascript
const targets = [...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
console.table(targets.map((el,index)=>({order:index+1,tag:el.tagName,name:el.getAttribute("aria-label")||el.textContent.trim()})));
```

**Gotcha:** A focusable inventory cannot prove the sequence is logical.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 14 Keyboard shortcut scope
Shortcuts should not hijack typing in editable fields or conflict with browser/assistive technology conventions.

**Implementation pattern**

```javascript
document.addEventListener("keydown", (event) => {
 const target = event.target;
 const editing = target.matches("input,textarea,[contenteditable='true']");
 if (editing) return;
 if (event.key === "/" && !event.ctrlKey && !event.metaKey) {
  event.preventDefault(); document.querySelector("#site-search").focus();
 }
});
```

**Gotcha:** Global key handlers must ignore editable targets unless specifically designed for them.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

---

## Relevant Patterns / Integration Patterns

### Pattern 1 — Skip link
What it does and when to use it: Bypasses repeated navigation. Use on pages with shared headers.

```html
<a class="skip-link" href="#main">Skip to main content</a>
<main id="main" tabindex="-1"><h1>Work</h1></main>
<style>.skip-link{position:absolute;top:-5rem}.skip-link:focus-visible{top:1rem;z-index:10}</style>
```

### Pattern 2 — Native disclosure
What it does and when to use it: Provides keyboard-operable expandable content. Use for FAQs and filters.

```html
<button type="button" aria-expanded="false" aria-controls="filters">Filters</button>
<section id="filters" hidden><label><input type="checkbox"> Featured</label></section>
```

### Pattern 3 — Drag alternative
What it does and when to use it: Provides non-drag reordering. Use for playlists and sortable boards.

```html
<li>Hero animation <button type="button" aria-label="Move Hero animation up">Move up</button><button type="button" aria-label="Move Hero animation down">Move down</button></li>
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Generic click target | Pointer handler has no keyboard contract. | Replace with `<button>` or `<a>` based on intent. |
| Focus ring removed | Current keyboard location is hidden. | Add a high-contrast `:focus-visible` outline. |
| Positive tabindex | Manual order becomes fragile. | Remove positive values and repair DOM order. |
| Hover-only submenu | Keyboard and touch cannot open it. | Use a button disclosure with expanded state. |
| Background tabbable in modal | Overlay is visual only. | Use native dialog or tested focus containment. |
| Escape closes all layers | Nested layer ownership is ignored. | Let the topmost layer handle Escape. |
| Custom button only clicks | Native activation was not implemented. | Use a real button for Enter and Space behavior. |
| Drag-only sorting | Requires pointer precision. | Add Move up/down or select-destination controls. |
| Focus hidden by header | Fixed chrome covers the target. | Use scroll padding and test small viewport heights. |
| Incomplete tab keys | Keyboard model is mixed. | Follow the relevant APG interaction pattern. |
| Custom disabled mismatch | Behavior differs from native controls. | Use native `disabled` or a deliberate aria-disabled pattern. |
| Shortcut hijacks typing | Global listener captures field input. | Ignore editable targets unless intended. |
| Visual/DOM order mismatch | CSS ordering rearranges meaning. | Align source order with intended reading order. |
| No keyboard regression | Mouse testing masks defects. | Complete a keyboard-only end-to-end pass. |

---

## Mental Models

1. **Tab moves between tasks** — reserve arrow keys for patterns that define them.
2. **Focus is a visible cursor** — users need to see the next action target.
3. **DOM order is the default contract** — avoid positive tabindex mazes.
4. **Native controls reduce custom code** — fewer edge cases need testing.
5. **No trap without an escape** — modal containment needs predictable exit.
6. **Pointer parity is not keyboard parity** — generic click targets are incomplete.
7. **Alternatives matter more than gestures** — offer another path for drag.

---

## Quick Reference

| Situation | Recommended implementation | Verification note |
|---|---|---|
| Navigation | `<a href>` | Enter activates |
| Action | `<button>` | Enter/Space activate |
| Focus | `:focus-visible` | Visible at zoom |
| Repeated nav | Skip link | Target exists |
| Disclosure | Button + expanded state | Links tabbable |
| Modal | Native dialog | Focus contained |
| Dismissal | Escape as expected | Top layer closes |
| Tabs | Arrow keys + roving tabindex | Panel matches |
| Sorting | Move up/down | No drag required |
| Sticky header | Scroll padding | Target visible |
| Disabled field | Native disabled | Expected behavior |
| Shortcut | Scoped handler | Does not hijack typing |
| Visual order | Match DOM | Tab order logical |
| Manual audit | Keyboard-only task | No mouse |
| Automated audit | axe/Lighthouse | Not sufficient alone |

---

## Build Challenge

Build a keyboard-complete project archive with filters, sortable cards, a details dialog, and skip navigation.

### Numbered requirements

1. Provide a visible skip link.
2. Use anchors for navigation and buttons for actions.
3. Keep focus order logical and aligned with DOM order.
4. Provide high-contrast `:focus-visible` styles.
5. Make filters usable without hover.
6. Make disclosures keyboard-operable.
7. Use native dialog or tested focus containment.
8. Support Escape without closing unrelated layers.
9. Provide non-drag sorting controls.
10. Prevent sticky headers obscuring focus.
11. Test at 200% zoom and narrow viewport.
12. Remove a focused card and move focus to a valid successor.

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

Keyboard accessibility starts at the design system boundary. Buttons, links, fields, and dialogs should have reusable focus styling and state handling. Component APIs should make disabled and expanded state explicit, and custom widgets should document their keyboard map. A defect in a shared primitive becomes a system-wide defect, so test the primitive before polishing every use.

### Advanced field note — Production implementation

Avoid shortcuts that override browser or assistive technology conventions unless there is a strong product reason and a way to disable or remap them. Shortcuts should not fire while users type in input, textarea, or contenteditable regions unless designed for those fields. Use `event.key`, prevent default only when the component consumes the key, and scope listeners so unrelated widgets do not compete.

### Advanced field note — Production implementation

A focus ring needs more than color. Give it enough thickness and offset, ensure overflow containers do not clip it, and test on light and dark surfaces. If a component has selected and focused states, both should remain understandable. Hover must never be the only affordance because touch and keyboard users may not trigger it.

### Advanced field note — Production implementation

Keyboard parity on creative websites does not mean copying pointer movement. For a draggable 3D object, provide named controls to rotate, zoom, reset, or select. For a sortable board, offer move controls. For a magnetic CTA, keep the real button stable and let the magnetic effect remain decorative. Do not hide the system cursor globally if location becomes ambiguous.

### Advanced field note — Production implementation

When building composite widgets, choose a known pattern and test its complete keyboard contract. Tabs commonly keep one tab in the Tab sequence and use arrow keys among tabs; radio groups and listboxes have different expectations. Do not mix pieces just because they feel convenient. If the product only needs show/hide, a disclosure is often safer than a complex menu.

### Practice scenario 1 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 2 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 3 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 4 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 5 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 6 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 7 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 8 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 9 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 10 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 11 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 12 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 13 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 14 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 15 — Failure-resistant delivery

A creative portfolio uses custom filters and an animated preview. The filter must be a native select, checkbox group, or documented custom widget with a complete keyboard model. The preview may animate on hover, but its project link and primary action must be reachable with Tab and activated with native keys. When filtering removes the focused card, preserve focus on the filter or move it by a documented rule. Test narrow viewports where sticky navigation may cover the target. This combines pointer parity, focus order, responsive behavior, and dynamic state.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

## Self-review notes

This file is scoped to Layer 29 accessibility implementation. Run the project review script against the saved file before release and manually verify thresholds, code accuracy, unique fixes, and every applicable criterion. Automated checks support review but do not replace task-based keyboard and assistive-technology testing.
