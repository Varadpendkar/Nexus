# SKILL: modal-dialog-patterns
**Layer:** 15 — UI Components
**Goal:** Build accessible, resilient modal dialogs that manage focus, dismissal, scroll locking, responsive layout, asynchronous states, and lifecycle cleanup without trapping users or corrupting the page behind them.

---

## Why This Matters (Senior Perspective)

A modal is a temporary change in the user's interaction context, not merely a card placed above a dark overlay. It takes ownership of keyboard focus, changes what assistive technology should perceive as active, often prevents background scrolling, and introduces a second lifecycle beside the page itself. If any of those responsibilities are only half implemented, the defect can be severe: keyboard users tab into controls behind the dialog, a screen reader announces the page instead of the confirmation, Escape closes a payment flow unexpectedly, a mobile keyboard pushes the primary action off-screen, or closing the dialog leaves `overflow: hidden` on the document. These are production failures, not polish issues.

A beginner often starts with a high `z-index`, a black translucent backdrop, and a Boolean such as `isOpen`. A senior developer asks what opening means, which element receives focus, where focus returns, whether the dialog is modal or non-modal, what happens when content changes, and who owns cleanup if the component unmounts while an animation or request is in progress. The implementation is designed around state transitions and user expectations before it is styled. Native `<dialog>` and `showModal()` are useful because the browser supplies important modal behavior, but they do not remove the need for accessible names, focus policy, sensible close rules, and cross-browser testing.

Creative portfolio sites and freelance projects commonly use dialogs for project details, image previews, contact forms, booking flows, pricing explanations, cookie preferences, and destructive confirmations. A visually impressive portfolio can still feel amateur if a lightbox cannot be closed with Escape or a form dialog loses its contents after a validation error. A client may judge the whole experience by one interrupted interaction. Treat dialogs as small, stateful systems: make their behavior predictable, their visual treatment consistent with the design system, their focus behavior testable, and their failure states explicit. The goal is not to add complexity everywhere; it is to make the simplest correct behavior the default and reserve custom behavior for a documented need.

## Core Concepts

### 1. Choose the Right Interaction: Modal or Non-Modal

A modal blocks interaction with the rest of the page until it is resolved or dismissed. A non-modal panel allows the user to keep working elsewhere. The visual shape does not decide the semantics; the interaction contract does. Use a modal for a confirmation that must be answered before continuing, a focused form, or a lightbox. Use a non-modal popover or side panel for supplementary controls that should not interrupt the current task.

```html
<main>
  <section aria-labelledby="project-heading">
    <h1 id="project-heading">Selected work</h1>
    <button type="button" id="open-project-details">View project details</button>
  </section>
  <dialog id="project-dialog" aria-labelledby="project-dialog-title">
    <header>
      <h2 id="project-dialog-title">Project details</h2>
    </header>
    <p>Campaign strategy, visual identity, and launch results.</p>
    <form method="dialog">
      <button type="submit">Close details</button>
    </form>
  </dialog>
</main>
```

```js
const dialog = document.querySelector("#project-dialog");
const openButton = document.querySelector("#open-project-details");

openButton.addEventListener("click", () => {
  if (!dialog.open) dialog.showModal();
});
```

`showModal()` puts the native dialog in the top layer and makes the rest of the document inert for modal interaction. Calling `dialog.show()` instead creates a non-modal dialog. Do not simulate modality by adding only an overlay; an overlay does not itself stop keyboard focus or communicate the correct semantics.

**Naive approach:** Use a generic `<section>` and a backdrop, then assume the darkened page is inaccessible.

**Correct approach:** Pick native `<dialog>` for a true modal where supported, or implement the complete focus, inertness, keyboard, and dismissal contract if a custom primitive is unavoidable.

**Gotcha:** A `<dialog>` opened with `show()` is not modal. The presence of a `dialog` element alone does not guarantee modal behavior.

### 2. Give the Dialog an Accessible Name and Useful Description

A dialog needs a concise accessible name, usually through `aria-labelledby` pointing to a visible heading. Longer instructions can be connected with `aria-describedby`, but avoid referencing an entire complex body as one description; screen readers may announce too much before users can act. Keep the title visible and meaningful. Do not use a generic name like “Popup” when the task is “Delete draft invoice?”

```html
<dialog id="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-help">
  <form method="dialog">
    <h2 id="delete-title">Delete this draft invoice?</h2>
    <p id="delete-help">This removes the draft from this workspace. Sent invoices are not affected.</p>
    <div class="dialog-actions">
      <button value="cancel">Keep invoice</button>
      <button value="delete" class="button-danger">Delete draft</button>
    </div>
  </form>
</dialog>
```

The label answers “what is this interaction?” The description gives relevant context or consequences. The visible title should not be omitted just because an `aria-label` is available; visible text benefits sighted users and makes the interface easier to understand.

**Naive approach:** `aria-label="Dialog"` on every modal.

**Correct approach:** Use a visible, task-specific heading and point `aria-labelledby` at its ID. Add `aria-describedby` only for concise supporting text.

**Gotcha:** IDs must be unique in the document. Duplicated modal instances can make an accessible name point at the wrong heading.

### 3. Model the Dialog as a State Machine

A Boolean is enough for a simple open/closed panel, but real dialogs may have opening, editing, submitting, success, and error states. Avoid deriving all behavior from several unrelated Booleans that can conflict—for example, `isOpen`, `isLoading`, `hasError`, and `isSuccess` all becoming true at once. Name the allowed states and define transitions.

```js
const states = new Set(["closed", "open", "submitting", "success", "error"]);
let state = "closed";

function transition(nextState) {
  if (!states.has(nextState)) throw new Error(`Unknown dialog state: ${nextState}`);
  const allowed = {
    closed: ["open"],
    open: ["closed", "submitting"],
    submitting: ["success", "error", "closed"],
    success: ["closed", "open"],
    error: ["submitting", "closed", "open"]
  };

  if (!allowed[state].includes(nextState)) {
    throw new Error(`Invalid transition: ${state} -> ${nextState}`);
  }

  state = nextState;
  document.querySelector("#dialog-status").textContent = state;
}
```

This example makes impossible transitions visible during development. In a framework, state can be held in a reducer or a finite-state machine library; the principle is the same. Define which events are legal in each state, and make loading and error behavior deliberate.

**Naive approach:** Set `isLoading = true` and forget to reset it when a request rejects.

**Correct approach:** Represent submission as a transition and always move to `success` or `error` in a `try/catch/finally` path.

**Gotcha:** Closing during an in-flight request does not necessarily cancel the request. Use an `AbortController` if cancellation is part of the product contract.

### 4. Open and Close with Explicit Lifecycle Functions

Keep open/close behavior in named functions instead of duplicating class changes across multiple click handlers. One place should own opening, focus intent, scroll lock if required, and cleanup. Another should own dismissal policy. Native dialog already handles many browser details; a custom wrapper should not accidentally fight them.

```html
<button type="button" id="open-contact">Contact the studio</button>
<dialog id="contact-dialog" aria-labelledby="contact-title">
  <h2 id="contact-title">Contact the studio</h2>
  <button type="button" id="close-contact" aria-label="Close contact dialog">×</button>
  <p>Tell us about your project.</p>
</dialog>
```

```js
const contactDialog = document.querySelector("#contact-dialog");
const contactTrigger = document.querySelector("#open-contact");
const closeContact = document.querySelector("#close-contact");

function openContactDialog() {
  if (!contactDialog.open) contactDialog.showModal();
}

function closeContactDialog() {
  if (contactDialog.open) contactDialog.close();
}

contactTrigger.addEventListener("click", openContactDialog);
closeContact.addEventListener("click", closeContactDialog);
contactDialog.addEventListener("close", () => contactTrigger.focus());
```

The close event is a useful place to restore focus after a native dialog closes. For component frameworks, make sure listeners are removed when the component unmounts. If the dialog is controlled by framework state, keep the DOM and state synchronized rather than mixing imperative calls with unrelated state updates.

**Naive approach:** Add a new anonymous listener every time the dialog opens.

**Correct approach:** Register stable listeners once, or use a component lifecycle effect with a cleanup function.

**Gotcha:** Calling `showModal()` while the dialog is already open throws an `InvalidStateError`; guard repeated opens.

### 5. Place Initial Focus According to the Task

The first focus target should support the user's next action, not blindly be the first element in DOM order. For a short confirmation, focus the least destructive action or the dialog container/title when the content needs to be read first. For a form, focus the first required field only when that does not skip important context. Native dialogs generally move focus into the dialog, but the exact initial target may need explicit control.

```html
<dialog id="newsletter-dialog" aria-labelledby="newsletter-title">
  <h2 id="newsletter-title" tabindex="-1">Get the monthly studio notes</h2>
  <p>One concise email each month. Unsubscribe at any time.</p>
  <form>
    <label for="newsletter-email">Email address</label>
    <input id="newsletter-email" name="email" type="email" autocomplete="email" required>
    <button type="submit">Subscribe</button>
  </form>
</dialog>
```

```js
const newsletterDialog = document.querySelector("#newsletter-dialog");
const newsletterTitle = document.querySelector("#newsletter-title");

function showNewsletterDialog() {
  newsletterDialog.showModal();
  newsletterTitle.focus();
}
```

Focusing a heading with `tabindex="-1"` allows programmatic focus without adding it to the normal Tab sequence. Test the chosen target with keyboard and screen-reader users; a giant dialog may be better entered at its heading than halfway down the form.

**Naive approach:** Always focus the first button, even when it is “Delete permanently.”

**Correct approach:** Choose focus based on risk, reading order, and the primary task. For destructive confirmations, consider focusing the safe action.

**Gotcha:** If opening is animated, avoid delaying focus so long that users believe the control did not respond. Coordinate animation and focus without making focus dependent on an unreliable timeout.

### 6. Restore Focus to the Trigger or a Sensible Fallback

When a dialog closes, users should return to the control that opened it. This preserves location and reduces disorientation. The trigger may have been removed—for example, a dialog deletes the card containing its own trigger—so restoration needs a fallback.

```js
let lastDialogTrigger = null;

function openDialog(dialog, trigger) {
  lastDialogTrigger = trigger;
  dialog.showModal();
}

function restoreDialogFocus(fallbackSelector = "main h1") {
  if (lastDialogTrigger?.isConnected) {
    lastDialogTrigger.focus();
    return;
  }

  document.querySelector(fallbackSelector)?.focus();
}
```

A fallback target may need `tabindex="-1"` if it is not normally focusable. In component code, store the trigger reference when opening rather than querying for “the first button” after closing. The fallback should be close to the user's previous context, not necessarily the top of the page.

**Naive approach:** Focus `document.body` after every close.

**Correct approach:** Restore to the opener if it still exists; otherwise focus a deliberate, meaningful fallback.

**Gotcha:** Focus restoration can fail silently when the target is hidden, disabled, detached, or inside an inert subtree. Test those conditions.

### 7. Keep Keyboard Interaction Predictable

Escape is the conventional dismissal key for a dismissible modal. Tab and Shift+Tab should remain within a custom modal's focusable controls. Native modal dialogs provide much of this behavior; custom overlays must implement it carefully and should avoid a homemade focus trap unless the component architecture requires one. Do not intercept keys globally when the dialog is closed.

```js
const settingsDialog = document.querySelector("#settings-dialog");

settingsDialog.addEventListener("cancel", (event) => {
  // Prevent dismissal only when the current workflow must not be interrupted.
  if (settingsDialog.dataset.preventEscape === "true") {
    event.preventDefault();
  }
});

settingsDialog.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    // Native <dialog> handles normal focus containment.
    // Keep this hook for diagnostics or a documented custom policy only.
    console.debug("Tab navigation inside settings dialog");
  }
});
```

Prefer the native `cancel` event for Escape policy with `<dialog>`. Do not block Escape merely because a form is dirty unless you provide a clear, accessible confirmation flow. Users need a reliable exit route. If a custom focus trap is truly necessary, account for radio groups, disabled controls, hidden controls, shadow DOM, and dynamically inserted content.

**Naive approach:** `document.addEventListener("keydown", closeEverything)`.

**Correct approach:** Scope keyboard handling to the open dialog and define which keys are handled and why.

**Gotcha:** Escape behavior differs when nested widgets such as a combobox or date picker are open. The innermost active interaction should usually consume Escape first.

### 8. Decide Whether Backdrop Click Dismisses the Dialog

Backdrop dismissal is a product decision, not a default that should be added casually. It is useful for low-risk previews and lightweight panels; it can be harmful for a multi-step form or destructive confirmation. Native `<dialog>` does not automatically close merely because any click lands on its backdrop. If you implement this behavior, ensure the click began and ended on the backdrop rather than on a child that happens to bubble.

```js
const previewDialog = document.querySelector("#preview-dialog");

previewDialog.addEventListener("click", (event) => {
  // The dialog element itself represents the backdrop click target here.
  if (event.target === previewDialog) {
    previewDialog.close("backdrop");
  }
});
```

For native dialogs, style the backdrop with `::backdrop`. Test pointer, touch, and keyboard behavior. Provide a visible close button even when backdrop dismissal is enabled; relying on an invisible outside click is not discoverable.

**Naive approach:** Close on every click that bubbles to the dialog.

**Correct approach:** Check `event.target === dialog` and only enable dismissal where losing unsaved work is acceptable.

**Gotcha:** Clicking a child can bubble to the dialog, so a broad listener without a target check closes the modal while users interact with content.

### 9. Prevent Background Scroll Without Breaking the Page

Native modal dialogs generally prevent interaction with the rest of the document, but visual scroll behavior and mobile browser details still deserve testing. Custom overlays often lock scrolling by changing document overflow. If you do this manually, remember the prior inline value and restore it exactly; do not blindly set it to an empty string if another component owns a scroll lock.

```js
let previousOverflow = "";

function lockPageScroll() {
  previousOverflow = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";
}

function unlockPageScroll() {
  document.documentElement.style.overflow = previousOverflow;
}
```

If multiple overlays can exist, a single Boolean is not enough: closing one overlay must not unlock the page while another remains open. Use a centralized lock manager or reference count. On mobile, test long content, the virtual keyboard, orientation changes, and browser chrome resizing.

**Naive approach:** Always set `body.style.overflow = "auto"` when any modal closes.

**Correct approach:** Restore the previous style or release a shared lock token that only unlocks when all owners have released it.

**Gotcha:** Scroll locking `body` alone behaves differently across browsers and embedded scroll containers. Validate on real iOS Safari and Android Chrome, not only desktop emulation.

### 10. Make Dialog Layout Work on Small Screens

Dialogs must fit short viewports and large text. Avoid fixed heights that clip the footer behind a mobile keyboard. Use a bounded block size, internal scrolling for long content, and a sticky or otherwise visible action area when appropriate. Respect safe areas on devices with display cutouts.

```css
.dialog-panel {
  box-sizing: border-box;
  inline-size: min(42rem, calc(100vw - 2rem));
  max-block-size: min(44rem, calc(100dvh - 2rem));
  overflow: auto;
  padding: clamp(1rem, 3vw, 2rem);
  border: 0;
  border-radius: 1rem;
}

.dialog-panel::backdrop {
  background: rgb(8 12 24 / 0.68);
}

.dialog-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-block-start: 1.25rem;
}

@media (max-width: 36rem) {
  .dialog-panel {
    inline-size: calc(100vw - 1rem);
    max-block-size: calc(100dvh - 1rem);
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .dialog-actions > button {
    flex: 1 1 100%;
  }
}
```

`dvh` tracks the dynamic viewport on browsers that support it, while `vh` can be a fallback. Keep a fallback for older browsers and test zoom at 200%. If the dialog contains a long legal document, use a deliberate internal scroll region rather than shrinking text or hiding actions.

**Naive approach:** `height: 700px` and `overflow: hidden`.

**Correct approach:** Constrain with `max-block-size`, allow content to scroll, and ensure action buttons remain reachable.

**Gotcha:** `100vh` may not match the visible viewport when mobile browser controls or the software keyboard are present. Check dynamic viewport support and provide a robust fallback.

### 11. Handle Submission, Validation, and Errors In Place

A form dialog should not close just because the submit button was clicked. Keep it open when validation fails, expose errors next to fields, and announce asynchronous outcomes. Disable duplicate submission while a request is in flight, but do not remove the only visible feedback that something is happening.

```html
<dialog id="invite-dialog" aria-labelledby="invite-title">
  <form id="invite-form" novalidate>
    <h2 id="invite-title">Invite a collaborator</h2>
    <label for="invite-email">Work email</label>
    <input id="invite-email" name="email" type="email" required aria-describedby="invite-error">
    <p id="invite-error" role="alert"></p>
    <p id="invite-status" role="status" aria-live="polite"></p>
    <button type="submit">Send invitation</button>
    <button type="button" id="cancel-invite">Cancel</button>
  </form>
</dialog>
```

```js
const inviteForm = document.querySelector("#invite-form");
const inviteEmail = document.querySelector("#invite-email");
const inviteError = document.querySelector("#invite-error");
const inviteStatus = document.querySelector("#invite-status");

inviteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  inviteError.textContent = "";
  inviteStatus.textContent = "";

  if (!inviteEmail.validity.valid) {
    inviteError.textContent = "Enter a valid email address.";
    inviteEmail.focus();
    return;
  }

  const submitButton = inviteForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  inviteStatus.textContent = "Sending invitation…";

  try {
    const response = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.value.trim() })
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    inviteStatus.textContent = "Invitation sent.";
  } catch (error) {
    inviteError.textContent = "We couldn't send the invitation. Check your connection and try again.";
    console.error("Invitation request failed", error);
  } finally {
    submitButton.disabled = false;
  }
});
```

The endpoint is an example contract and must be implemented by the application. In production, handle server validation, rate limits, authorization, and safe error messages. Do not expose stack traces or internal response bodies to users.

**Naive approach:** Close the modal immediately, then show a generic toast even if the server rejects the request.

**Correct approach:** Preserve form state, connect error text to the relevant field, announce status, and close only when the workflow has a confirmed success policy.

**Gotcha:** `aria-live` announcements can be missed if text is inserted before the live region exists. Keep the live region mounted and update its content.

### 12. Animate Entry and Exit Without Losing Functionality

Motion should communicate that a layer has appeared, not delay the task. Animate opacity and transform where possible to avoid repeated layout work. Respect `prefers-reduced-motion`, and do not make focus depend on an animation finishing. With native dialogs, opening and closing transitions require care because the element can leave the top layer when closed; modern CSS supports discrete transitions in some browsers, but feature support varies.

```css
dialog.dialog-motion {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
  transition: opacity 180ms ease, transform 180ms ease, display 180ms allow-discrete, overlay 180ms allow-discrete;
}

dialog.dialog-motion[open] {
  opacity: 1;
  transform: translateY(0) scale(1);
}

dialog.dialog-motion::backdrop {
  background: rgb(8 12 24 / 0);
  transition: background 180ms ease;
}

dialog.dialog-motion[open]::backdrop {
  background: rgb(8 12 24 / 0.68);
}

@starting-style {
  dialog.dialog-motion[open] {
    opacity: 0;
    transform: translateY(0.75rem) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog.dialog-motion,
  dialog.dialog-motion::backdrop {
    transition: none;
  }
}
```

Use feature detection or a simpler non-animated fallback where discrete transitions are unsupported. Test Safari, Firefox, and Chromium versions relevant to the project's support policy. Never hide a close control until an animation completes, and do not use `setTimeout` as the only guarantee that cleanup happens.

**Naive approach:** Animate `top`, `left`, and `height` for a large overlay on every frame.

**Correct approach:** Prefer `transform` and `opacity`, provide reduced-motion behavior, and make the static open/close path correct without animation.

**Gotcha:** `@starting-style` and discrete transitions are not universally supported in older browsers. Unsupported animation must degrade to a usable immediate transition, not an invisible dialog.

### 13. Protect Against Stacking, Nested Layers, and Duplicate Opens

A modal may compete with sticky navigation, floating widgets, tooltips, and other overlays. Native modal dialogs enter the browser top layer, avoiding many ordinary `z-index` conflicts. Custom overlays live in the document stacking system and can be trapped inside a stacking context created by `transform`, `filter`, `opacity`, or `isolation`. Avoid solving every conflict by raising `z-index` to a larger arbitrary number.

```css
.site-header {
  position: sticky;
  inset-block-start: 0;
  z-index: 20;
}

.dialog-layer {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.dialog-layer[hidden] {
  display: none;
}

.dialog-layer__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(8 12 24 / 0.68);
}

.dialog-layer__panel {
  position: relative;
  z-index: 1;
  max-inline-size: 42rem;
  max-block-size: calc(100dvh - 2rem);
  overflow: auto;
}
```

For custom overlays, mount the layer near the document root rather than inside a transformed card. Maintain one overlay manager if multiple modal types can open. Define whether opening a second modal replaces, nests, or is prohibited by the current one.

**Naive approach:** Put a modal inside a transformed project card and keep increasing `z-index`.

**Correct approach:** Use native top-layer behavior when suitable, or render custom modal layers in a root-level portal with an explicit stacking policy.

**Gotcha:** `z-index` only compares within the relevant stacking context. A child with `z-index: 999999` can still appear behind a sibling stacking context.

### 14. Integrate the Whole Dialog Lifecycle

Production dialogs combine semantics, focus management, responsive layout, asynchronous feedback, and cleanup. The final design should have one clear open path and one clear close path, with no orphaned listeners, stale requests, scroll locks, or focus references. This concept brings the earlier rules together into a confirmation dialog that cannot be opened twice, gives the user a safe default, and returns focus to the trigger after closure.

```html
<main>
  <section aria-labelledby="assets-heading">
    <h1 id="assets-heading" tabindex="-1">Project assets</h1>
    <button type="button" id="delete-asset-trigger">Delete selected asset</button>
  </section>

  <dialog id="delete-asset-dialog" aria-labelledby="delete-asset-title" aria-describedby="delete-asset-description">
    <form method="dialog" class="dialog-panel">
      <h2 id="delete-asset-title">Delete selected asset?</h2>
      <p id="delete-asset-description">This action removes the asset from this project. You cannot undo it here.</p>
      <div class="dialog-actions">
        <button value="cancel" id="keep-asset">Keep asset</button>
        <button value="confirm" class="button-danger">Delete asset</button>
      </div>
    </form>
  </dialog>
</main>
```

```js
const deleteTrigger = document.querySelector("#delete-asset-trigger");
const deleteDialog = document.querySelector("#delete-asset-dialog");
const keepAssetButton = document.querySelector("#keep-asset");
let opener = null;

function openDeleteDialog() {
  if (deleteDialog.open) return;
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : deleteTrigger;
  deleteDialog.showModal();
  keepAssetButton.focus();
}

function closeDeleteDialog() {
  if (deleteDialog.open) deleteDialog.close();
}

deleteTrigger.addEventListener("click", openDeleteDialog);
deleteDialog.addEventListener("close", () => {
  if (opener?.isConnected) opener.focus();
  else document.querySelector("#assets-heading")?.focus();
  opener = null;
});

deleteDialog.addEventListener("close", () => {
  if (deleteDialog.returnValue === "confirm") {
    // Call the application's deletion workflow here and handle its errors.
    console.info("User confirmed asset deletion");
  }
});
```

This sample separates the confirmation decision from the destructive operation. In a real application, show a pending state if deletion is asynchronous and close only according to the product's success policy. A native form with `method="dialog"` closes the dialog and sets `returnValue`; it does not submit a network request by itself.

**Naive approach:** Delete the asset on the initial button click, then ask for confirmation afterward.

**Correct approach:** Open a clearly labeled confirmation, capture the result, perform the operation after confirmation, handle failure, and restore focus to a surviving location.

**Gotcha:** A dialog's `close` event can fire after the opener's card has been removed. Check `isConnected` before focusing the saved element.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Native Dialog with Safe Focus Restoration

**What it does:** Uses the browser's modal dialog behavior and restores keyboard focus to the control that launched it.

**When to use it:** Use for a contact form, project details, or a short confirmation when native `<dialog>` meets the product's interaction requirements.

```html
<button type="button" id="open-brief">Open project brief</button>
<dialog id="brief-dialog" aria-labelledby="brief-title">
  <h2 id="brief-title">Project brief</h2>
  <p>Review scope, deliverables, and timeline.</p>
  <button type="button" id="close-brief">Close brief</button>
</dialog>
<script>
  const briefDialog = document.querySelector("#brief-dialog");
  const briefTrigger = document.querySelector("#open-brief");
  document.querySelector("#close-brief").addEventListener("click", () => briefDialog.close());
  briefTrigger.addEventListener("click", () => {
    if (!briefDialog.open) briefDialog.showModal();
  });
  briefDialog.addEventListener("close", () => briefTrigger.focus());
</script>
```

Native behavior is preferable to re-implementing focus containment. Do not use this pattern if the interface genuinely needs multiple simultaneous modal layers without a carefully defined policy.

### Pattern 2: Destructive Confirmation with Explicit Return Value

**What it does:** Separates the user's decision from the destructive side effect.

**When to use it:** Use before deleting a draft, removing a collaborator, or discarding unsaved work.

```html
<dialog id="remove-member-dialog" aria-labelledby="remove-member-title">
  <form method="dialog">
    <h2 id="remove-member-title">Remove this collaborator?</h2>
    <p>The collaborator will lose access to this workspace.</p>
    <button value="cancel">Cancel</button>
    <button value="confirm">Remove collaborator</button>
  </form>
</dialog>
<script>
  const removeDialog = document.querySelector("#remove-member-dialog");
  removeDialog.addEventListener("close", async () => {
    if (removeDialog.returnValue !== "confirm") return;
    try {
      await fetch("/api/workspace/members/current", { method: "DELETE" });
    } catch (error) {
      console.error("Could not remove collaborator", error);
      // In production, announce an error and offer retry.
    }
  });
</script>
```

The server must still authorize the operation; a client-side confirmation is not a security boundary. For important data, consider a pending state and keep the dialog open until the result is known.

### Pattern 3: Form Dialog with Validation and Persistent Error Region

**What it does:** Keeps the form and its entered values available when client-side validation or the server rejects submission.

**When to use it:** Use for newsletter signup, invite flows, short booking forms, and lead-capture dialogs.

```html
<dialog id="lead-dialog" aria-labelledby="lead-title">
  <form id="lead-form">
    <h2 id="lead-title">Request a project consultation</h2>
    <label for="lead-email">Email</label>
    <input id="lead-email" name="email" type="email" required>
    <p id="lead-error" role="alert"></p>
    <button type="submit">Send request</button>
  </form>
</dialog>
<script>
  const leadForm = document.querySelector("#lead-form");
  const leadEmail = document.querySelector("#lead-email");
  const leadError = document.querySelector("#lead-error");
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    leadError.textContent = "";
    if (!leadEmail.validity.valid) {
      leadError.textContent = "Enter a valid email address.";
      leadEmail.focus();
      return;
    }
    // Submit to the real application service and handle non-2xx responses.
  });
</script>
```

Client validation improves usability but cannot replace server validation. Avoid clearing fields after every error; preserving input reduces frustration and prevents rework.

### Pattern 4: Mobile-Safe Full-Height Dialog

**What it does:** Uses a bounded viewport-aware panel and internal scrolling so the content and actions remain usable on narrow screens.

**When to use it:** Use when a dialog contains a multi-field form, terms, or a long project brief that cannot fit in a small viewport.

```css
dialog.mobile-safe {
  box-sizing: border-box;
  inline-size: min(44rem, calc(100vw - 1rem));
  max-block-size: calc(100vh - 1rem);
  max-block-size: calc(100dvh - 1rem);
  overflow: auto;
  margin: auto;
  padding: 1rem;
  border: 0;
  border-radius: 1rem;
}

dialog.mobile-safe .dialog-actions {
  position: sticky;
  inset-block-end: 0;
  display: flex;
  gap: 0.75rem;
  padding-block: 1rem 0.25rem;
  background: Canvas;
}

@media (max-width: 36rem) {
  dialog.mobile-safe .dialog-actions {
    flex-direction: column-reverse;
  }
}
```

Sticky actions should not cover the final field or error text; use padding and verify with browser zoom. If `dvh` is unavailable, the preceding `vh` declaration remains a fallback.

### Pattern 5: Dialog State with Abortable Async Work

**What it does:** Prevents stale asynchronous results from updating a dialog after it closes or a newer request replaces the old one.

**When to use it:** Use for search-in-dialog, loading project previews, checking availability, or submitting a request that users may cancel.

```js
let requestController = null;

async function loadProjectPreview(projectId, statusElement) {
  requestController?.abort();
  requestController = new AbortController();
  statusElement.textContent = "Loading project preview…";

  try {
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/preview`, {
      signal: requestController.signal
    });
    if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
    const project = await response.json();
    statusElement.textContent = `Loaded ${project.title}`;
  } catch (error) {
    if (error.name === "AbortError") return;
    statusElement.textContent = "Preview could not be loaded. Try again.";
    console.error(error);
  }
}

function cancelProjectPreview() {
  requestController?.abort();
  requestController = null;
}
```

`AbortController` cancels the client-side fetch operation, not necessarily work already performed by the server. Always handle the abort path separately from a real error so users do not see a false failure message when they cancel intentionally.

### Pattern 6: Centralized Scroll-Lock Ownership

**What it does:** Ensures one dialog closing cannot release a scroll lock still needed by another overlay.

**When to use it:** Use in an application with a modal, image lightbox, mobile navigation drawer, and other overlays that can overlap or open in sequence.

```js
const scrollLockOwners = new Set();
let originalOverflow = "";

function acquireScrollLock(owner) {
  if (scrollLockOwners.has(owner)) return;
  if (scrollLockOwners.size === 0) {
    originalOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
  }
  scrollLockOwners.add(owner);
}

function releaseScrollLock(owner) {
  if (!scrollLockOwners.delete(owner)) return;
  if (scrollLockOwners.size === 0) {
    document.documentElement.style.overflow = originalOverflow;
    originalOverflow = "";
  }
}
```

Each overlay must release the same stable owner token it acquired. A centralized manager avoids competing components overwriting each other's styles. Native modal dialogs may make manual locking unnecessary; do not add a second lock system without testing its effects.

### Pattern 7: Feature-Detected Motion with a Useful Fallback

**What it does:** Adds a short entrance transition where supported while preserving an immediate, functional dialog path elsewhere.

**When to use it:** Use for branded portfolio dialogs where motion reinforces depth but must not delay interaction or exclude reduced-motion users.

```css
dialog.branded-dialog {
  opacity: 1;
  transform: none;
}

@supports (transition-behavior: allow-discrete) {
  dialog.branded-dialog {
    opacity: 0;
    transform: translateY(0.5rem);
    transition:
      opacity 160ms ease,
      transform 160ms ease,
      display 160ms allow-discrete,
      overlay 160ms allow-discrete;
  }

  dialog.branded-dialog[open] {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog.branded-dialog {
    transition: none !important;
    transform: none;
  }
}
```

The unsupported-browser path should still show the dialog normally. Do not use motion to communicate critical status; provide visible text and semantic announcements.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Building a modal from a styled `<div>` without modal semantics | The developer equates visual dimming with interaction control | Prefer `<dialog>.showModal()` or implement focus containment, inert background, and keyboard behavior explicitly |
| Giving every dialog the accessible name “Popup” | Accessibility is treated as a label added at the end | Connect `aria-labelledby` to a visible, task-specific heading |
| Opening the same native dialog twice | Click handlers assume the user cannot double-click | Guard with `if (!dialog.open)` before calling `showModal()` |
| Closing a form dialog before the server responds | UI state is optimized for the happy path only | Model submitting/success/error states and close only under the agreed success policy |
| Restoring focus to `document.body` | Focus return was not included in the component design | Store the trigger element and restore focus to it when it remains connected |
| Restoring focus to a deleted trigger | The dialog removes the element that opened it | Check `isConnected` and focus a meaningful fallback such as the surviving section heading |
| Closing on every click that bubbles through the dialog | Event bubbling is mistaken for a backdrop-only click | Check `event.target === dialog` before backdrop dismissal |
| Locking scroll without restoring the previous style | Cleanup assumes the component is the only owner of overflow | Save the original value or use a centralized owner-based scroll-lock manager |
| Unlocking scroll when one of several overlays closes | A Boolean cannot represent multiple lock owners | Use a `Set` of stable owners or a reference-counted overlay manager |
| Using fixed pixel height for a mobile dialog | The layout was tested only on a desktop viewport | Use `max-block-size`, `dvh` with `vh` fallback, and internal scrolling |
| Hiding the close button during an entrance animation | Motion timing is allowed to control basic usability | Keep controls available and make focus independent of animation completion |
| Blocking Escape for every form | Unsaved changes are treated as a reason to remove the exit route | Permit Escape unless there is a justified interruption policy and an accessible confirmation |
| Attaching global key listeners every time the modal opens | Lifecycle ownership is unclear | Register once and remove listeners during teardown, or use an effect cleanup |
| Using an arbitrary huge `z-index` | Stacking contexts are misunderstood | Use the top layer or mount the custom overlay in a root-level portal |
| Showing raw server errors to users | Debug information is reused as UI copy | Log technical details privately and announce a safe, actionable message |
| Forgetting reduced-motion preferences | Animation is added as a purely visual flourish | Add `@media (prefers-reduced-motion: reduce)` and verify the no-motion path |
| Assuming client-side confirmation authorizes deletion | UI validation is confused with security | Re-check identity, permissions, and resource ownership on the server |
| Failing to cancel stale requests | A closed dialog is assumed to stop asynchronous work | Use `AbortController`, ignore stale results, and handle `AbortError` separately |

### Before → After: Backdrop Dismissal

**Before — any bubbled click closes the dialog:**

```js
dialog.addEventListener("click", () => dialog.close());
```

**After — only a click directly on the dialog backdrop closes it:**

```js
dialog.addEventListener("click", (event) => {
  if (event.target === dialog && dialog.dataset.dismissible === "true") {
    dialog.close("backdrop");
  }
});
```

## Mental Models

1. **A modal borrows the user's attention.** It must return the user to the exact context they left, not merely disappear.
2. **Focus is part of state.** Opening and closing are incomplete until focus enters the dialog and later returns to a sensible target.
3. **The backdrop is not the boundary.** Semantics, keyboard handling, and background inertness define the interaction boundary.
4. **Every side effect needs an owner.** Scroll locks, event listeners, requests, and timers must have explicit acquisition and cleanup.
5. **Close is a policy, not a click handler.** Escape, backdrop clicks, close buttons, submission, and navigation may have different rules.
6. **Failure is a normal state.** Network rejection, invalid input, and cancellation should be designed before the happy path ships.
7. **Native behavior is a starting advantage.** Use browser primitives where they fit, then add only the behavior the product actually needs.
8. **Motion cannot hold functionality hostage.** The dialog must work with reduced motion, slow devices, and unsupported transition features.
9. **The safest default is visible and reversible.** Destructive dialogs should make consequences clear and give the user an obvious safe action.
10. **A dialog is a miniature application.** It has state, transitions, focus, errors, responsive layout, and teardown—not just a box and shadow.

## Quick Reference

| Need | Preferred approach | Verify |
|---|---|---|
| True modal | `dialog.showModal()` | Background interaction is blocked |
| Non-modal supplemental panel | `dialog.show()` or popover pattern | Page remains usable |
| Accessible name | `aria-labelledby` linked to visible heading | Name is task-specific |
| Additional context | Concise `aria-describedby` | No excessive announcement |
| Open guard | `if (!dialog.open)` | Repeated clicks do not throw |
| Close control | Visible `type="button"` or `method="dialog"` form button | Keyboard and pointer both work |
| Escape policy | Native `cancel` event | Escape behavior matches workflow |
| Backdrop close | `event.target === dialog` | Inner clicks do not close it |
| Focus on open | Focus task-appropriate control or heading | No destructive default focus |
| Focus on close | Return to connected trigger | Fallback exists if trigger is removed |
| Form errors | Field-associated text and persistent live region | Error is announced and remains visible |
| Async state | Explicit submitting/success/error states | Duplicate submit is prevented |
| Request cancellation | `AbortController` | Abort is not shown as a failure |
| Scroll lock | Native modal behavior or shared lock manager | No stuck page after close |
| Responsive size | `max-block-size` and internal overflow | Short screens and zoom work |
| Dynamic viewport | `100dvh` with fallback | Mobile browser chrome is tested |
| Overlay stacking | Native top layer or root portal | Sticky headers do not cover modal |
| Motion | `transform` and `opacity` | No layout-heavy animation |
| Reduced motion | `prefers-reduced-motion` media query | Dialog remains immediate and usable |
| Cleanup | Remove listeners, abort requests, release locks | Reopen/close cycles do not accumulate effects |
| Security | Server-side authorization | Client cannot authorize destructive actions |
| Debugging | DevTools accessibility tree, focus inspection, console | Name, role, focus, and errors are correct |

### Browser Support and Debugging Notes

Native `<dialog>`, `showModal()`, `::backdrop`, dynamic viewport units, `@starting-style`, and discrete transitions do not share identical support across every browser version. Check current browser compatibility data for the project's supported matrix instead of assuming that modern CSS works everywhere. The baseline should be a usable dialog without animation; enhancement can be feature-detected with `@supports`. Test Chromium, Firefox, and Safari, including iOS Safari and Android Chrome when mobile traffic matters.

In DevTools, inspect the accessibility tree for the dialog's role and accessible name. With the keyboard, open the dialog, record the focused element, press Tab and Shift+Tab through all controls, try Escape, and confirm focus returns correctly. Use the Elements panel to inspect `open`, `aria-labelledby`, `aria-describedby`, computed `max-block-size`, `overflow`, and stacking contexts. Watch the console for repeated `showModal()` errors. Test at 200% zoom, with a narrow viewport, with long content, and with a simulated slow network. A useful debug helper is:

```js
function logDialogState(dialog) {
  console.table({
    open: dialog.open,
    returnValue: dialog.returnValue,
    activeElement: document.activeElement?.tagName,
    activeElementId: document.activeElement?.id || "(no id)",
    viewportHeight: window.innerHeight,
    dialogHeight: Math.round(dialog.getBoundingClientRect().height),
    scrollHeight: dialog.scrollHeight
  });
}
```

Call the helper before opening, after opening, and after closing. If focus escapes, determine whether the dialog is actually modal, whether another overlay stole focus, and whether hidden or disabled controls are being considered by a custom trap. If the page stays locked, inspect the ownership and release path for every scroll lock rather than manually changing overflow in DevTools and declaring the bug fixed.

## Build Challenge

### Build: Studio Project Confirmation Dialog

Build a production-ready modal used to confirm removal of a project asset from a creative studio dashboard. The dialog must look consistent with a polished dark or light design system, but functional behavior takes priority over decoration.

#### Requirements

1. Use a native `<dialog>` and open it with `showModal()`; explain any reason you choose a custom overlay instead.
2. Give the dialog a visible heading and connect it with `aria-labelledby`.
3. Connect concise consequence text with `aria-describedby`.
4. Provide a visible close or cancel action that is keyboard reachable.
5. Ensure Escape behavior is deliberate and does not accidentally delete the asset.
6. Ensure backdrop clicks do not close the dialog unless the product explicitly allows it.
7. Capture the triggering element and restore focus to it when the dialog closes.
8. Add a fallback focus target for the case where the triggering asset card is removed.
9. Make the panel usable at 320 CSS pixels wide and at 200% browser zoom.
10. Ensure long dialog content can scroll without hiding the final action.
11. Use semantic buttons with explicit `type` values where needed.
12. Model the confirmation result separately from the destructive network operation.
13. Prevent duplicate submissions while a delete request is pending.
14. Display an accessible loading status while the request is running.
15. Display a user-safe error if the server rejects the operation; preserve context and offer retry.
16. Use `AbortController` if the workflow permits the user to cancel an in-flight request.
17. Ensure every event listener has a clear lifecycle and is not registered repeatedly on each open.
18. Do not leave document scroll locked after close, error, navigation, or component teardown.
19. Use `:focus-visible` styling so keyboard focus is visible without forcing identical styling for every pointer click.
20. Include a `prefers-reduced-motion` rule if the dialog animates.
21. Prefer `transform` and `opacity` for motion and avoid animating layout properties such as `top`, `left`, `width`, or `height`.
22. Verify the accessibility tree exposes a dialog role and the expected accessible name.
23. Test in Chromium, Firefox, and Safari; note any support-dependent enhancements and fallbacks.
24. Add a diagnostic helper that logs open state, active element, dialog dimensions, and return value.
25. Test repeated open-close cycles and rapid repeated clicks.
26. Test closing after the original trigger has been removed from the DOM.
27. Test a slow request, a failed request, an invalid session, and a successful deletion.
28. Confirm server-side authorization is enforced and that client-side confirmation is not treated as security.
29. Verify the page's original scroll style is restored and that a second overlay cannot be accidentally unlocked.
30. Write a short README section describing the state transitions and dismissal policy.

#### Failure-Injection Tests

- **Rapid open:** Double-click the trigger and confirm there is no `InvalidStateError` and only one dialog is open.
- **Focus return:** Open the dialog, cancel it, and confirm focus returns to the trigger.
- **Removed trigger:** Remove the trigger while the dialog is open, close it, and confirm focus moves to the fallback heading.
- **Network failure:** Force the delete request to return a non-2xx status. The dialog must not claim success.
- **Slow network:** Delay the request and confirm duplicate deletion is impossible.
- **Mobile viewport:** Use a short viewport and open the software keyboard. The action buttons must remain reachable.
- **Reduced motion:** Enable the operating system's reduced-motion setting and confirm the dialog remains fully usable without transitions.
- **Stacking conflict:** Add a sticky header with a high `z-index`; verify the modal remains above it.
- **Cleanup:** Open and close the dialog ten times. Confirm listeners do not multiply and scroll behavior remains normal.

#### Definition of Done

- The dialog has a correct accessible name, role, and useful description.
- Keyboard focus enters the dialog, remains appropriately contained, and returns to a valid location after closing.
- Escape, cancel, backdrop, and confirmation actions follow documented policy.
- Validation and asynchronous failures are visible and announced without losing user context.
- The dialog remains usable on narrow screens, at zoom, and with reduced motion enabled.
- No scroll lock, event listener, pending request, or focus reference is left in a broken state.
- Browser testing and failure-injection results are documented.
- The destructive action is authorized by the server and cannot be triggered by opening the dialog alone.
