# SKILL: focus-management-patterns
**Layer:** 29 — Accessibility Implementation
**Goal:** Control focus intentionally across navigation, dialogs, async updates, route changes, and errors without losing users or creating traps.

---

## Why This Matters (Senior Perspective)
Focus is the keyboard user’s location. When a route changes but focus remains on a removed link, a dialog opens behind the current focus, or validation errors appear without a usable destination, the interface can look correct while the user is lost. Single-page apps make this common because the URL and visible content change but browser focus does not automatically move to the new page heading. Senior focus management is deliberate and minimal: preserve focus when the task continues; move it when context changes; restore it when a temporary layer closes; and provide a fallback if the original target no longer exists.

---

## Core Concepts

### 1 Focus as a location contract
Each state transition should decide whether focus remains, moves to a new context, or returns to a trigger. Do not move focus just because a render happened.

**Implementation pattern**

```javascript
function focusPageHeading() {
 const heading = document.querySelector("main h1");
 heading?.setAttribute("tabindex","-1"); heading?.focus();
}
```

**Gotcha:** Repeatedly focusing the heading on every update disrupts reading.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 2 SPA route focus
After client-side navigation, update the document title and focus a stable new heading after it is rendered.

**Implementation pattern**

```javascript
function announceRouteChange(pageTitle) {
 document.title = `${pageTitle} | Northstar Studio`;
 const heading = document.querySelector("main h1");
 heading?.setAttribute("tabindex","-1"); heading?.focus();
}
```

**Gotcha:** Focusing before the new DOM exists targets a missing or stale element.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 3 Dialog lifecycle
Store the opener, focus inside the dialog, and restore focus on close only if the invoker remains usable.

**Implementation pattern**

```javascript
const dialog = document.querySelector("#project-dialog");
let invoker = null;
function openDialog(trigger) { invoker = trigger; dialog.showModal(); dialog.querySelector("button,input")?.focus(); }
function restoreDialogFocus() { if (invoker?.isConnected && !invoker.disabled) invoker.focus(); }
```

**Gotcha:** A detached or disabled trigger cannot be a reliable restoration target.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 4 Focus containment
A modal must prevent Tab from reaching background content. Native `showModal()` provides useful built-in behavior.

**Implementation pattern**

```javascript
<dialog id="newsletter-dialog" aria-labelledby="newsletter-title"><form method="dialog">
<h2 id="newsletter-title">Newsletter signup</h2><label for="newsletter-email">Email address</label><input id="newsletter-email" type="email"><button value="cancel">Close</button>
</form></dialog>
<script>document.querySelector("#open-newsletter").addEventListener("click",()=>document.querySelector("#newsletter-dialog").showModal());</script>
```

**Gotcha:** `aria-modal=true` alone does not make the background inert.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 5 Initial focus target
Choose the first target based on the task: first field for a short form, explanatory heading for long content, or safe cancel action for destructive confirmation.

**Implementation pattern**

```javascript
function focusDialogStart(dialog) {
 const target = dialog.querySelector("[data-initial-focus]") || dialog.querySelector("h2");
 if (target && !target.matches("button,input,a[href],select,textarea")) target.setAttribute("tabindex","-1");
 target?.focus();
}
```

**Gotcha:** Automatically focusing a destructive action increases accidental activation risk.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 6 Validation focus
After failed submission, focus the error summary or first invalid field only after error content is rendered.

**Implementation pattern**

```javascript
function focusFirstInvalidField(form) {
 const firstInvalid = form.querySelector('[aria-invalid="true"]');
 if (firstInvalid) firstInvalid.focus();
 else form.querySelector("#error-summary")?.focus();
}
```

**Gotcha:** Focusing before the render completes can lose the focus request.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 7 Async content
Keep focus stable during background refreshes. If a focused node must be replaced, restore focus to its equivalent.

**Implementation pattern**

```javascript
async function refreshProjects() {
 const status = document.querySelector("#results-status");
 status.textContent = "Refreshing projects…";
 try { await loadProjects(); status.textContent = "Projects updated."; }
 catch { status.textContent = "Could not refresh projects. Try again."; }
}
```

**Gotcha:** Rebuilding the entire list can detach the focused search field.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 8 Toasts do not steal focus
Routine confirmations should use a status region while focus stays in the active task.

**Implementation pattern**

```javascript
<p id="toast-status" role="status" aria-live="polite"></p>
<script>function confirmSave(){document.querySelector("#toast-status").textContent="Draft saved.";}</script>
```

**Gotcha:** Focusing every toast interrupts typing.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 9 Skip link focus
Make the main target programmatically focusable so subsequent keyboard navigation starts from the destination.

**Implementation pattern**

```html
<a href="#main-content">Skip to main content</a>
<main id="main-content" tabindex="-1"><h1>Project archive</h1></main>
```

**Gotcha:** `tabindex=-1` allows programmatic focus but does not add a normal Tab stop.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 10 Deletion successor
When the focused item is removed, focus the next action, previous action, or list heading if the list is empty.

**Implementation pattern**

```javascript
function removeProjectRow(row) {
 const next = row.nextElementSibling?.querySelector("button") || row.previousElementSibling?.querySelector("button");
 row.remove();
 if (next?.isConnected) next.focus(); else document.querySelector("#projects-heading")?.focus();
}
```

**Gotcha:** A reference captured before re-render may be detached.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 11 Nested layers
Define which layer owns Escape, focus containment, and restoration. The top layer closes first.

**Implementation pattern**

```javascript
const layerStack = [];
function registerLayer(layer){layerStack.push(layer)}
function closeTopLayer(){const top=layerStack.pop();if(top){top.close();top.returnFocusTarget?.focus()}}
```

**Gotcha:** A global Escape listener can close a parent while a child is still active.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 12 Shadow DOM
Web components may expose internal focus differently. Test the public focus contract and do not assume `document.activeElement` is always the deepest node.

**Implementation pattern**

```javascript
class SearchBox extends HTMLElement {
 constructor(){super();const root=this.attachShadow({mode:"open",delegatesFocus:true});
 root.innerHTML='<label>Search <input type="search"></label>';}
}
customElements.define("search-box",SearchBox);
```

**Gotcha:** Closed shadow roots limit inspection; test the component as a consumer.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 13 Scroll visibility
Programmatic focus should not leave the target hidden under sticky chrome. Use scroll margins and manage scroll behavior intentionally.

**Implementation pattern**

```html
html{scroll-padding-block-start:5rem}
main h1:focus{outline:3px solid #005fcc;outline-offset:4px}
```

**Gotcha:** `focus({preventScroll:true})` can leave the target off-screen.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 14 Debugging focus
Inspect active element, event timing, and whether the target remains connected. Avoid logging sensitive values.

**Implementation pattern**

```javascript
function logFocusState(label) {
 const active=document.activeElement;
 console.debug(label,{tag:active?.tagName,id:active?.id,connected:active?.isConnected,role:active?.getAttribute("role")});
}
document.addEventListener("focusin",event=>logFocusState(`focusin: ${event.target.id||event.target.tagName}`));
```

**Gotcha:** Debug logs must never include passwords or personal field contents.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

---

## Relevant Patterns / Integration Patterns

### Pattern 1 — Modal lifecycle
What it does and when to use it: Stores opener, focuses dialog, restores focus. Use for confirmation and settings.

```html
const dialog=document.querySelector("#confirm-dialog");let opener;
function showDialog(trigger){opener=trigger;dialog.showModal();dialog.querySelector("button")?.focus()}
dialog.addEventListener("close",()=>{if(opener?.isConnected)opener.focus()});
```

### Pattern 2 — Route heading focus
What it does and when to use it: Orients users after client-side navigation. Use when no full document navigation occurs.

```html
function onRouteRendered(title){document.title=`${title} | Northstar Studio`;const heading=document.querySelector("main h1");heading?.setAttribute("tabindex","-1");heading?.focus()}
```

### Pattern 3 — Focus successor
What it does and when to use it: Prevents focus loss when a focused row is deleted. Use in project boards and task lists.

```html
function removeRow(row){const successor=row.nextElementSibling?.querySelector("button")||row.previousElementSibling?.querySelector("button");row.remove();if(successor?.isConnected)successor.focus();else document.querySelector("#list-heading")?.focus()}
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Focus on removed route link | SPA navigation leaves focus stale. | Focus the new main heading after render. |
| No dialog restoration | Invoker was not stored. | Store opener and restore when still connected. |
| Focus waits for animation | Transition event gates access. | Focus as soon as the dialog exists. |
| Toast steals focus | Status is treated as a dialog. | Announce politely without moving focus. |
| Detached target | Re-render removed the node. | Check `isConnected` and select a fallback. |
| Selector-only trap | Dynamic and shadow content are missed. | Prefer native dialog or maintained tested library. |
| Every render refocuses | Focus logic is attached to generic rendering. | Move focus only on explicit context changes. |
| Summary not focusable | Error summary cannot receive focus. | Add `tabindex=-1` and focus after render. |
| Wrong nested restoration | No ownership stack exists. | Track opener per layer and restore per close. |
| Target scrolls under chrome | Sticky header covers destination. | Set scroll margins and manage scroll intentionally. |
| Empty list loses focus | No successor is defined. | Focus list heading or empty-state action. |
| Debug logs field data | Sensitive values enter logs. | Log identity and role, never user input. |
| Shadow focus assumed global | Host may be activeElement. | Test component internals and public contract. |
| First button always focused | Task context is ignored. | Choose initial focus by task and risk. |

---

## Mental Models

1. **Focus is location, not decoration** — it determines where input goes.
2. **Move focus only for context change** — routine updates do not steal place.
3. **Every modal has a lifecycle** — open, focus, close, restore, fallback.
4. **Detached nodes cannot orient users** — check that targets still exist.
5. **Async rendering changes timing** — focus after the destination commits.
6. **The top layer owns Escape** — nested overlays need clear ownership.
7. **Fallbacks are part of design** — define a successor when targets vanish.

---

## Quick Reference

| Situation | Recommended implementation | Verification note |
|---|---|---|
| SPA route | Focus new main heading | Title updated |
| Dialog open | Focus useful target | Immediate |
| Dialog close | Restore invoker | Fallback if removed |
| Validation | Focus summary/field | Errors rendered first |
| Toast | Keep focus | Use status region |
| Delete row | Focus successor | No detached focus |
| Nested overlay | Layer stack | Top layer owns Escape |
| Skip link | Main `tabindex=-1` | Target focusable |
| Sticky chrome | Scroll margin | Target visible |
| Async refresh | Stable nodes | Current task preserved |
| Debug focus | `activeElement` | No sensitive logs |
| Shadow DOM | Test host/internal focus | Contract documented |
| Initial target | Task-specific choice | Not always first button |
| Render | No automatic refocus | Only intentional moves |
| Fallback | Stable heading | Used when needed |

---

## Build Challenge

Build a single-page portfolio flow with route changes, modal contact form, validation, item deletion, and asynchronous save status.

### Numbered requirements

1. Update document title after route-like transitions.
2. Focus the new main heading only after render.
3. Store modal invoker and restore focus on close.
4. Provide fallback if invoker was removed.
5. Choose useful initial focus in the dialog.
6. Keep toast focus-neutral.
7. Focus an error summary or first invalid field after failed submit.
8. Preserve focus during background refresh.
9. Choose a successor when focused content is deleted.
10. Define top-layer Escape ownership.
11. Add development-only focus instrumentation without values.
12. Remove modal trigger before close and focus a stable fallback.

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

Focus changes should be rare enough to be predictable and strong enough to orient the user when context changes. Route transitions, opening a modal, moving to an error summary, and deleting the focused item are legitimate. Updating a timestamp, showing a toast, changing a sort label, or refreshing a background count usually is not. This distinction prevents focus management becoming an intrusive stream of jumps.

### Advanced field note — Production implementation

Framework lifecycle timing matters. In React, focus effects should run after the target is committed and should not run on every unrelated render. In Vue, use an appropriate post-flush lifecycle. In vanilla JavaScript, update the DOM before calling focus. Avoid arbitrary timeouts to “let the browser catch up”; they hide lifecycle dependencies and fail intermittently on slower devices.

### Advanced field note — Production implementation

A focus trap must account for first and last focusable elements, dynamically added controls, disabled controls, hidden content, nested dialogs, and the possibility that no ordinary focusable element exists. Native dialog is usually a better starting point. If custom containment is unavoidable, use a maintained library, document why native dialog is insufficient, and test the complete close/restoration path.

### Advanced field note — Production implementation

Focus restoration must account for changed state. If a dialog edits a record and the trigger remains, return to it. If the dialog deletes the record or the trigger disappears, focus a meaningful successor such as the next row’s action, list heading, or empty-state action. A blanket `trigger.focus()` without checking connection and disabled state is not robust.

### Advanced field note — Production implementation

Use focus instrumentation only in development. Capture target identity, role, and whether the node remains connected. Do not log form values or personal data. When debugging a disappearing focus target, inspect component keys, conditional rendering, portal ownership, and event order. The correct fix is usually a clearer lifecycle or stable target, not another timeout.

### Practice scenario 1 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 2 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 3 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 4 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 5 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 6 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 7 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 8 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 9 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 10 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 11 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 12 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 13 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 14 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 15 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 16 — Failure-resistant delivery

An editor saves a project, opens a preview dialog, and deletes the project from inside the dialog. On open, focus enters the dialog. On save, routine status does not steal focus. On delete, the dialog closes and focus moves to the next project action or list heading if no items remain. If the request fails, the dialog stays open, input is preserved, and the error is exposed near the control. This tests lifecycle ownership, async timing, restoration fallbacks, and recovery.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

## Self-review notes

This file is scoped to Layer 29 accessibility implementation. Run the project review script against the saved file before release and manually verify thresholds, code accuracy, unique fixes, and every applicable criterion. Automated checks support review but do not replace task-based keyboard and assistive-technology testing.
