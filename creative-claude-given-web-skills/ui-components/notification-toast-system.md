# SKILL: notification-toast-system

**Layer:** 15 — UI Components

**Goal:** Build notification toasts that communicate transient status clearly, remain accessible, avoid interrupting critical tasks, and handle timing, stacking, dismissal, and asynchronous outcomes predictably.

---

## Why This Matters (Senior Perspective)

A toast is a small message with a deceptively large responsibility: it tells the user that something happened, is happening, or needs attention without taking over the entire interface. A toast system that is implemented as an isolated styled box may work in a screenshot and fail in a real product. It can disappear before a screen-reader user hears it, cover a primary action on mobile, stack indefinitely, announce every minor event, or claim that a request succeeded before the server has confirmed it. A senior implementation begins by deciding which information deserves a toast at all, which messages need to persist inline, and which situations require a blocking dialog or a dedicated page.

Use toasts for brief, non-blocking feedback such as “Settings saved,” “Link copied,” or “Unable to refresh; try again.” Do not use them as the only place for essential instructions, complex error recovery, or information that users must read before proceeding. A destructive-action failure may need an inline message near the affected control. A form with multiple invalid fields needs a summary and field-level errors. A session-expiry warning may require a persistent dialog. Choosing the right presentation is more important than adding more toast variants.

Accessibility is part of the behavior, not a final styling pass. A polite status announcement is generally appropriate for routine success messages; assertive announcements should be reserved for urgent messages that genuinely need immediate attention. `role="status"` and `role="alert"` have different announcement semantics. Avoid placing an entire changing toast stack into an assertive live region, which can make every new message interrupt ongoing speech. A toast should be understandable without color, use readable contrast, and expose its action and dismissal control to keyboard and assistive-technology users. If it disappears automatically, give users enough time to read it and consider pausing the timer while it is hovered or focused.

Timing is a product decision. Short-lived toasts are appropriate for low-risk confirmations, but there is no universal timeout that fits every message. A longer message needs more reading time. Messages containing an action, such as Undo, should stay available long enough for a realistic response and may need to persist until dismissed. Do not make a critical recovery action vanish on a timer. When several messages arrive together, define a queue or stack policy and a maximum visible count. A toast system without a limit can obscure content, create a wall of announcements, and make the newest important feedback hard to find.

The system should model lifecycle states explicitly: queued, visible, paused, dismissing, and removed. Timers need cleanup when a toast is dismissed or the component unmounts. Duplicate messages may need to be coalesced, especially when a retry loop produces repeated failures. Actions should be safe to activate more than once or guarded when they are not. If a network operation fails, the message should explain what the user can do next; if the outcome is uncertain, do not claim either success or definite failure. A “Retry” action must actually retry the relevant operation, not simply close the toast.

Visual design should communicate category without relying on color alone. Use a short title or message, an optional supporting sentence, and an optional action. Success, info, warning, and error are useful categories, but avoid treating every backend response as an error toast. Keep spacing, type, iconography, motion, and placement consistent with the broader design system. On small screens, ensure the toast does not cover the submit button, navigation, or other important controls. Respect reduced-motion preferences and use stable layout behavior so toast appearance does not cause page content to jump unexpectedly.

Finally, a toast system should be testable. Test the timer, hover/focus pause behavior, manual dismissal, queue overflow, repeated messages, keyboard operation, screen-reader announcements, reduced motion, and the relationship between toast actions and the underlying operation. Measure whether users notice useful feedback rather than counting how many toasts the application emits. The best toast is often the one that confirms a meaningful result and then gets out of the user's way.

---

## Core Concepts

### 1. Separate the toast API from its presentation

**Explanation:** Application code should request a notification using a small, stable API. A central host controls rendering, stacking, timers, and dismissal. This avoids every feature inventing its own markup and timing behavior.

**Semantic HTML example:**

```html
<section class="toast-region" aria-label="Notifications" aria-live="polite" aria-relevant="additions">
  <article class="toast" role="status">
    <p>Settings saved.</p>
    <button type="button" aria-label="Dismiss notification">Dismiss</button>
  </article>
</section>
```

**Working CSS/JS example:**

```css
.toast-region {
  position: fixed;
  inset: auto 1rem 1rem auto;
  z-index: 1000;
  display: grid;
  gap: .75rem;
  width: min(24rem, calc(100vw - 2rem));
}
.toast { padding: 1rem; border-radius: .75rem; background: #17202c; color: white; }
```

```js
function createToast(message, kind = "info") {
  return { id: crypto.randomUUID(), message, kind, createdAt: Date.now() };
}
```

**Naive vs. correct:** Naive: each button appends its own toast DOM. Correct: features call a shared notification API and one host applies consistent rules.

**Gotcha:** A shared host must not become a dumping ground for every message; define which kinds of events are appropriate for transient notifications.

### 2. Choose the correct live-region semantics

**Explanation:** Routine status updates should generally be announced politely. Urgent, time-sensitive messages may need assertive treatment, but `role="alert"` can interrupt screen-reader speech. Keep live regions focused on the message that changed.

**Semantic HTML example:**

```html
<div id="toast-status" role="status" aria-live="polite" aria-atomic="true"></div>
<div id="toast-alert" role="alert" aria-atomic="true" hidden></div>
```

**Working CSS/JS example:**

```js
function announceToast(node, message) {
  node.textContent = "";
  requestAnimationFrame(() => { node.textContent = message; });
}
```

```css
.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
```

**Naive vs. correct:** Naive: put the whole toast stack inside `role="alert"`. Correct: use polite announcements for ordinary status and reserve assertive alerts for truly urgent information.

**Gotcha:** Screen-reader behavior differs by browser and assistive technology; test the real combinations your product supports rather than assuming ARIA guarantees identical speech.

### 3. Make dismissal controls accessible

**Explanation:** A toast that can be dismissed should provide a real button with an accessible name. Do not use a clickable `span` or an icon without a label. Keyboard focus should remain predictable when a toast disappears.

**Semantic HTML example:**

```html
<article class="toast" role="status">
  <p>Your changes were saved.</p>
  <button type="button" aria-label="Dismiss: Your changes were saved">×</button>
</article>
```

**Working CSS/JS example:**

```js
dismissButton.addEventListener("click", () => removeToast(toast.id));
```

```css
.toast button {
  min-width: 2.75rem;
  min-height: 2.75rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.toast button:focus-visible { outline: 3px solid currentColor; outline-offset: 2px; }
```

**Naive vs. correct:** Naive: use an unlabeled “×” character with a click handler. Correct: use a button and a meaningful accessible name.

**Gotcha:** If a focused toast is removed, focus can fall back to the document body; avoid stealing focus for routine toasts and define a recovery strategy for focused interactive notifications.

### 4. Set timeouts based on message complexity

**Explanation:** A short confirmation can disappear sooner than a detailed warning. The timeout should be long enough to read and act on, and action-bearing toasts may need a longer or indefinite lifetime.

**Semantic HTML example:**

```html
<article class="toast" data-duration="6000" role="status">
  <p>Copied the project link to your clipboard.</p>
</article>
```

**Working CSS/JS example:**

```js
function scheduleDismiss(toast, duration, onDismiss) {
  const timer = setTimeout(() => onDismiss(toast.id), duration);
  return () => clearTimeout(timer);
}
```

```js
const durationFor = toast => {
  if (toast.action) return 12000;
  if (toast.kind === "error") return 10000;
  return Math.min(9000, Math.max(4000, toast.message.length * 55));
};
```

**Naive vs. correct:** Naive: hard-code a 1.5-second timeout for every message. Correct: choose a sensible default, adapt for complexity, and avoid timing out critical recovery options.

**Gotcha:** Character count is only a rough estimate; language, reading ability, and screen-reader output vary. Treat computed durations as a starting point, not a guarantee.

### 5. Pause timers while the toast is hovered or focused

**Explanation:** Users should not lose a message while interacting with it. Pause automatic dismissal while the pointer is over the toast or keyboard focus is inside it, then resume with the remaining duration.

**Semantic HTML example:**

```html
<article class="toast" tabindex="-1" role="status">
  <p>Export is ready.</p>
  <button type="button">Download</button>
  <button type="button" aria-label="Dismiss notification">×</button>
</article>
```

**Working CSS/JS example:**

```js
let remaining = 6000;
let startedAt = performance.now();
let timer;
function startTimer() {
  startedAt = performance.now();
  timer = setTimeout(dismiss, remaining);
}
function pauseTimer() {
  clearTimeout(timer);
  remaining = Math.max(0, remaining - (performance.now() - startedAt));
}
toast.addEventListener("pointerenter", pauseTimer);
toast.addEventListener("pointerleave", () => { if (!toast.matches(":focus-within")) startTimer(); });
toast.addEventListener("focusin", pauseTimer);
toast.addEventListener("focusout", event => {
  if (!toast.contains(event.relatedTarget) && !toast.matches(":hover")) startTimer();
});
startTimer();
```

**Naive vs. correct:** Naive: the timeout continues while a user tries to activate the action. Correct: pause and resume using remaining time.

**Gotcha:** Do not restart the full duration on every pointer movement; track elapsed time so the toast does not remain forever unintentionally.

### 6. Limit stack size and define queue behavior

**Explanation:** A burst of notifications can overwhelm the interface. Define the maximum visible count and decide whether new messages queue, replace older low-priority messages, or coalesce duplicates.

**Semantic HTML example:**

```html
<div class="toast-region" aria-label="Notifications">
  <article role="status">Saved profile.</article>
  <article role="status">Copied share link.</article>
</div>
```

**Working CSS/JS example:**

```js
const MAX_VISIBLE = 3;
function addToQueue(queue, toast) {
  return [...queue, toast];
}
function getVisible(queue) {
  return queue.slice(-MAX_VISIBLE);
}
```

```css
.toast-region { display: flex; flex-direction: column; gap: .65rem; }
.toast { max-width: 100%; overflow-wrap: anywhere; }
```

**Naive vs. correct:** Naive: render every event and let the stack grow indefinitely. Correct: cap visible messages and define what happens to queued or lower-priority messages.

**Gotcha:** Dropping an important failure because the queue is full can be harmful; prioritize or persist critical errors in the page.

### 7. Prevent duplicate notification spam

**Explanation:** Retries, polling, and repeated clicks can emit the same message many times. A deduplication key can update or suppress repeated notifications during a defined window.

**Semantic HTML example:**

```html
<article class="toast" role="status">
  <p>Connection restored.</p>
  <span aria-label="Repeated 3 times">×3</span>
</article>
```

**Working CSS/JS example:**

```js
function upsertToast(toasts, incoming) {
  const existing = toasts.find(toast => toast.dedupeKey === incoming.dedupeKey);
  if (!existing) return [...toasts, incoming];
  return toasts.map(toast => toast.id === existing.id
    ? { ...toast, count: (toast.count || 1) + 1, message: incoming.message }
    : toast);
}
```

```js
notify({
  dedupeKey: "sync-failed",
  kind: "error",
  message: "Sync failed. Check your connection and retry."
});
```

**Naive vs. correct:** Naive: every retry creates another identical toast. Correct: coalesce repeated events or rate-limit the notification source.

**Gotcha:** Deduplication keys should represent the event meaning, not just the visible text; two unrelated operations may legitimately produce identical wording.

### 8. Design category styling without color-only meaning

**Explanation:** Category can be communicated through a short label, icon, title, and color. Users should not need to distinguish red from green to understand the message.

**Semantic HTML example:**

```html
<article class="toast toast--success" role="status">
  <strong class="toast__title">Saved</strong>
  <p>Your profile changes are live.</p>
</article>
```

**Working CSS/JS example:**

```css
.toast--success { border-inline-start: .3rem solid #17803d; }
.toast--warning { border-inline-start: .3rem solid #9a6700; }
.toast--error { border-inline-start: .3rem solid #c02d28; }
.toast__title { display: block; margin-bottom: .25rem; }
```

```js
const allowedKinds = new Set(["success", "info", "warning", "error"]);
function normalizeKind(kind) {
  return allowedKinds.has(kind) ? kind : "info";
}
```

**Naive vs. correct:** Naive: a colored dot is the only indication of severity. Correct: provide readable text and consistent iconography alongside color.

**Gotcha:** Color contrast must be checked for text, icons, borders, and focus indicators in every theme, not only the default dark or light theme.

### 9. Make toast actions real and safe

**Explanation:** An action such as Undo, Retry, or View details must do the promised thing. Its handler should have clear success/failure behavior, and the action should not be silently removed before the user can reasonably use it.

**Semantic HTML example:**

```html
<article class="toast" role="status">
  <p>Item archived.</p>
  <button type="button">Undo</button>
  <button type="button" aria-label="Dismiss notification">×</button>
</article>
```

**Working CSS/JS example:**

```js
undoButton.addEventListener("click", async () => {
  undoButton.disabled = true;
  try {
    await restoreArchivedItem(itemId);
    notify({ kind: "success", message: "Item restored." });
    dismissToast(toastId);
  } catch {
    notify({ kind: "error", message: "Could not restore the item. Open the archive to retry." });
  } finally {
    undoButton.disabled = false;
  }
});
```

```js
function retryRefresh() {
  return refreshData(); // Call the actual operation, not just dismissToast().
}
```

**Naive vs. correct:** Naive: an “Undo” button only closes the toast. Correct: connect the action to a real operation and report its outcome.

**Gotcha:** Undo may be impossible after another operation has changed the same data; define server semantics and expiry rather than assuming a local UI reversal is enough.

### 10. Handle asynchronous outcomes honestly

**Explanation:** A toast should reflect confirmed state. If a request is pending, say it is pending; if a request fails, say what is known and how to recover. A lost response may leave the outcome uncertain.

**Semantic HTML example:**

```html
<div id="notification-status" role="status" aria-live="polite"></div>
```

**Working CSS/JS example:**

```js
async function savePreferences(payload) {
  notify({ dedupeKey: "preferences-saving", kind: "info", message: "Saving preferences…" });
  try {
    await apiSavePreferences(payload);
    dismissByKey("preferences-saving");
    notify({ kind: "success", message: "Preferences saved." });
  } catch {
    dismissByKey("preferences-saving");
    notify({ kind: "error", message: "We couldn't confirm the save. Check your settings before retrying." });
  }
}
```

```js
// Avoid claiming “saved” until the server confirms the operation.
```

**Naive vs. correct:** Naive: show success immediately on click. Correct: announce success only after confirmation and distinguish uncertainty from a definite rejection.

**Gotcha:** If retrying can duplicate a non-idempotent operation, use an idempotency key or a status-check endpoint instead of blindly replaying the request.

### 11. Support reduced motion and stable layout

**Explanation:** Toasts should not trigger excessive motion or cause content to jump. Prefer a restrained opacity/transform transition and respect `prefers-reduced-motion`.

**Semantic HTML example:**

```html
<div class="toast-region" aria-label="Notifications">
  <article class="toast toast--entering" role="status">Changes saved.</article>
</div>
```

**Working CSS/JS example:**

```css
.toast { opacity: 1; transform: translateY(0); transition: opacity 180ms ease, transform 180ms ease; }
.toast--entering { opacity: 0; transform: translateY(.4rem); }
@media (prefers-reduced-motion: reduce) {
  .toast { transition: none; }
}
```

```js
requestAnimationFrame(() => toast.classList.remove("toast--entering"));
```

**Naive vs. correct:** Naive: use a large spring animation for every toast regardless of preferences. Correct: keep motion brief, avoid layout shifts, and honor reduced-motion settings.

**Gotcha:** Do not hide the only message content during an animation that can be interrupted; the toast should remain readable if motion is reduced or transitions are disabled.

### 12. Place the toast safely across screen sizes

**Explanation:** Fixed-position notifications must avoid covering important controls, browser safe areas, and the on-screen keyboard. Placement should adapt to available viewport space.

**Semantic HTML example:**

```html
<div class="toast-region" aria-label="Notifications">
  <article class="toast" role="status">Link copied.</article>
</div>
```

**Working CSS/JS example:**

```css
.toast-region {
  position: fixed;
  inset-inline-end: max(1rem, env(safe-area-inset-right));
  inset-block-end: max(1rem, env(safe-area-inset-bottom));
  width: min(26rem, calc(100vw - 2rem));
  z-index: 1000;
}
@media (max-width: 36rem) {
  .toast-region { inset-inline: .75rem; width: auto; }
}
```

```js
const isNarrow = matchMedia("(max-width: 36rem)").matches;
toastRegion.dataset.layout = isNarrow ? "compact" : "desktop";
```

**Naive vs. correct:** Naive: place a fixed 400px toast in the bottom-right on every viewport. Correct: constrain width, account for safe areas, and test mobile interaction overlays.

**Gotcha:** A toast may overlap a sticky bottom action or virtual keyboard even if it fits within the viewport; test actual workflows, not just isolated screenshots.

### 13. Clean up timers and lifecycle resources

**Explanation:** Timers, event listeners, and asynchronous work need cleanup when notifications are removed. Otherwise, a timer may attempt to remove a nonexistent toast, and stale callbacks can update a new component instance.

**Semantic HTML example:**

```html
<div id="toast-root" aria-label="Notifications"></div>
```

**Working CSS/JS example:**

```js
function createTimedToast(node, duration, onRemove) {
  const timer = window.setTimeout(onRemove, duration);
  return () => {
    window.clearTimeout(timer);
    node.remove();
  };
}
```

```js
const controller = new AbortController();
window.addEventListener("resize", updateToastLayout, { signal: controller.signal });
// When the host is destroyed:
controller.abort();
```

**Naive vs. correct:** Naive: create a timeout on every render and never clear it. Correct: own each timer and abortable listener in the toast lifecycle.

**Gotcha:** Cleanup must be idempotent; manual dismissal and timeout expiry can race, so removal should safely handle an already-removed notification.

### 14. Integrate toast feedback with a real feature workflow

**Explanation:** The final concept combines event source, shared notification API, accessible host, deduplication, and honest network state. Notifications should describe outcomes, not substitute for the feature's actual state.

**Semantic HTML example:**

```html
<button id="copy-link" type="button">Copy project link</button>
<div id="toast-region" class="toast-region" aria-label="Notifications"></div>
```

**Working CSS/JS example:**

```js
const region = document.querySelector("#toast-region");
const active = new Map();

function notify({ message, kind = "info", key = message, duration = 5000 }) {
  if (active.has(key)) return active.get(key);
  const toast = document.createElement("article");
  toast.className = `toast toast--${normalizeKind(kind)}`;
  toast.setAttribute("role", kind === "error" ? "alert" : "status");
  const text = document.createElement("p");
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Dismiss";
  close.addEventListener("click", remove);
  toast.append(text, close);
  region.append(toast);
  const timer = setTimeout(remove, duration);
  function remove() {
    clearTimeout(timer);
    toast.remove();
    active.delete(key);
  }
  active.set(key, toast);
  return toast;
}

document.querySelector("#copy-link").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    notify({ message: "Project link copied.", kind: "success", key: "copy-link" });
  } catch {
    notify({ message: "Couldn't copy the link. Copy the URL from your address bar.", kind: "error", key: "copy-link-error", duration: 9000 });
  }
});
```

**Naive vs. correct:** Naive: announce “Copied!” before the clipboard operation completes. Correct: show success only after the operation resolves and provide a useful fallback on failure.

**Gotcha:** The Clipboard API generally requires a secure context and can be denied; treat rejection as an expected outcome and keep the fallback instructions usable.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Minimal shared notification API

**What it does:** Gives features a consistent way to request notifications while keeping markup and lifecycle policy centralized.

**When to use it:** Applications with multiple independent features that need consistent feedback.

**Complete copy-pasteable code:**

```html
<div id="toast-region" class="toast-region" aria-label="Notifications"></div>
<style>
.toast-region { position: fixed; inset: auto 1rem 1rem auto; z-index: 1000; display: grid; gap: .75rem; width: min(25rem, calc(100vw - 2rem)); }
.toast { background: #182230; color: #fff; padding: 1rem; border-radius: .65rem; box-shadow: 0 8px 28px #0003; display: flex; gap: 1rem; justify-content: space-between; }
.toast button { color: inherit; background: transparent; border: 1px solid currentColor; border-radius: .3rem; padding: .35rem .55rem; }
</style>
<script>
const toastRegion = document.querySelector("#toast-region");
function notify(message, kind = "info") {
  const item = document.createElement("article");
  item.className = `toast toast--${kind}`;
  item.setAttribute("role", kind === "error" ? "alert" : "status");
  const text = document.createElement("p");
  text.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.textContent = "Dismiss";
  const timer = setTimeout(remove, 6000);
  close.addEventListener("click", remove);
  item.append(text, close);
  toastRegion.append(item);
  function remove() { clearTimeout(timer); item.remove(); }
}
</script>
```

**Nuance / edge case:** Validate the category against a fixed allowlist before using it in class names, and add a visible-count policy before using this in a busy production application.

### Pattern 2: Persistent toast with Undo

**What it does:** Presents a reversible action without forcing the user to navigate away from the current task.

**When to use it:** Archiving, dismissing, or removing an item when the product supports a genuine undo operation.

**Complete copy-pasteable code:**

```html
<article class="toast" role="status">
  <p>Task archived.</p>
  <button id="undo-archive" type="button">Undo</button>
  <button id="dismiss-archive" type="button" aria-label="Dismiss notification">Dismiss</button>
</article>
<script>
const undo = document.querySelector("#undo-archive");
const toast = undo.closest(".toast");
undo.addEventListener("click", async () => {
  undo.disabled = true;
  try {
    await restoreTask();
    toast.remove();
    announce("Task restored.");
  } catch {
    announce("Could not restore the task. Open Archived tasks to recover it.");
    undo.disabled = false;
  }
});
document.querySelector("#dismiss-archive").addEventListener("click", () => toast.remove());
function announce(message) {
  document.querySelector("#toast-status")?.replaceChildren(document.createTextNode(message));
}
</script>
<div id="toast-status" role="status" aria-live="polite"></div>
```

**Nuance / edge case:** Keep the toast available long enough for the undo action. If undo has a deadline, communicate it and enforce it on the server as well as the client.

### Pattern 3: Queue with a maximum visible count

**What it does:** Prevents bursts from filling the screen by showing a limited number of messages at once.

**When to use it:** Dashboards, background task interfaces, and apps where multiple operations can complete concurrently.

**Complete copy-pasteable code:**

```js
const MAX_VISIBLE = 3;
const pending = [];
const visible = new Map();

function enqueueToast(toast) {
  pending.push(toast);
  pumpQueue();
}
function pumpQueue() {
  while (visible.size < MAX_VISIBLE && pending.length) {
    const item = pending.shift();
    visible.set(item.id, item);
    renderToast(item, () => {
      visible.delete(item.id);
      pumpQueue();
    });
  }
}
function renderToast(item, onRemove) {
  const node = document.createElement("article");
  node.className = "toast";
  node.setAttribute("role", item.urgent ? "alert" : "status");
  node.textContent = item.message;
  toastRegion.append(node);
  setTimeout(() => { node.remove(); onRemove(); }, item.duration ?? 5000);
}
```

```html
<div id="toast-region" aria-label="Notifications"></div>
```

**Nuance / edge case:** In production, track and clear each timer, pause for focus/hover, and ensure queue overflow does not discard critical errors that require persistent page-level recovery.

### Pattern 4: Deduplicate repeated messages

**What it does:** Coalesces notifications from retry loops or repeated triggers.

**When to use it:** Network status, autosave, polling, or batch processes that may emit the same event repeatedly.

**Complete copy-pasteable code:**

```js
const recent = new Map();
function notifyOnce(key, message, cooldownMs = 8000) {
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < cooldownMs) return false;
  recent.set(key, now);
  showToast(message);
  return true;
}
function showToast(message) {
  const node = document.createElement("article");
  node.setAttribute("role", "status");
  node.textContent = message;
  toastRegion.append(node);
  setTimeout(() => node.remove(), 5000);
}
```

```js
notifyOnce("sync-network-error", "Sync paused. Check your connection.");
```

**Nuance / edge case:** Prune old keys if the set of keys can grow without bound, and avoid suppressing a materially changed failure state.

### Pattern 5: Pause dismissal while the toast is in use

**What it does:** Allows users to read or interact with a notification without racing its timeout.

**When to use it:** Toasts with links, Undo buttons, Retry actions, or longer supporting copy.

**Complete copy-pasteable code:**

```js
function attachPausableTimer(node, duration, dismiss) {
  let remaining = duration;
  let startedAt = performance.now();
  let timer;
  function start() {
    clearTimeout(timer);
    startedAt = performance.now();
    timer = setTimeout(dismiss, remaining);
  }
  function pause() {
    clearTimeout(timer);
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
  }
  node.addEventListener("pointerenter", pause);
  node.addEventListener("pointerleave", () => {
    if (!node.matches(":focus-within")) start();
  });
  node.addEventListener("focusin", pause);
  node.addEventListener("focusout", event => {
    if (!node.contains(event.relatedTarget) && !node.matches(":hover")) start();
  });
  start();
  return () => {
    clearTimeout(timer);
    node.removeEventListener("pointerenter", pause);
    node.removeEventListener("focusin", pause);
  };
}
```

```html
<article class="toast" role="status">
  <p>Export is ready.</p>
  <button type="button">Download export</button>
</article>
```

**Nuance / edge case:** The returned cleanup should remove every listener, including the anonymous leave handlers; in production, retain named handler references so teardown is complete.

### Pattern 6: Honest async operation feedback

**What it does:** Replaces a temporary “working” message with a confirmed result and provides a useful recovery message if the operation fails.

**When to use it:** Save, upload, export, refresh, or copy actions whose outcomes are asynchronous.

**Complete copy-pasteable code:**

```js
async function runExport() {
  const key = "export-operation";
  notify({ key, kind: "info", message: "Preparing your export…", duration: 0 });
  try {
    const result = await exportReport();
    dismissByKey(key);
    notify({ kind: "success", message: `Export ready: ${result.filename}` });
  } catch {
    dismissByKey(key);
    notify({
      kind: "error",
      message: "We couldn't prepare the export. Check your connection and retry.",
      duration: 10000
    });
  }
}
```

```html
<button type="button" onclick="runExport()">Export report</button>
```

**Nuance / edge case:** Avoid embedding untrusted server strings into HTML. If an operation may have completed while its response was lost, show an uncertainty message and offer a status check rather than asserting it failed.

### Pattern 7: Mobile-safe toast placement

**What it does:** Keeps notifications within the usable viewport while accounting for narrow screens and safe-area insets.

**When to use it:** Responsive web apps, installable web apps, and mobile layouts with fixed bottom navigation.

**Complete copy-pasteable code:**

```html
<div class="toast-region" aria-label="Notifications">
  <article class="toast" role="status">Changes saved.</article>
</div>
<style>
.toast-region {
  position: fixed;
  z-index: 1000;
  inset-inline-end: max(.75rem, env(safe-area-inset-right));
  inset-block-end: max(.75rem, env(safe-area-inset-bottom));
  width: min(25rem, calc(100vw - 1.5rem));
  display: grid;
  gap: .6rem;
}
.toast { overflow-wrap: anywhere; padding: 1rem; border-radius: .65rem; background: #17202c; color: white; }
@media (max-width: 36rem) {
  .toast-region { inset-inline: .75rem; width: auto; }
}
@media (prefers-reduced-motion: reduce) {
  .toast, .toast * { animation: none !important; transition: none !important; }
}
</style>
```

**Nuance / edge case:** Test against sticky footers and virtual keyboards. A toast that fits the viewport can still cover the primary action the user needs next.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Showing every event as a toast | Toasts are easy to implement and seem universally useful. | Decide which outcomes are transient; use inline feedback for information tied to a specific control. |
| Using `role="alert"` for all notifications | Assertive announcements are mistaken for better accessibility. | Use polite status semantics for routine updates and reserve alerts for urgent messages. |
| Depending on color alone | Visual styling is treated as the full message. | Include a title, text, or recognizable icon alongside category color. |
| Dismissing every toast after a tiny fixed delay | One timeout is easier than lifecycle policy. | Choose duration by complexity and keep important action-bearing messages available. |
| Letting timers run during interaction | Timer logic is detached from pointer and keyboard behavior. | Pause on hover/focus and resume with remaining time. |
| Rendering an unlimited stack | Each event is rendered independently. | Set a visible cap and define queue, coalescing, and overflow behavior. |
| Repeating the same failure dozens of times | Retry or polling logic emits one toast per event. | Deduplicate by semantic event key or rate-limit repeated messages. |
| Creating success feedback before the request resolves | The click is confused with successful completion. | Announce success only after the operation confirms it. |
| Making Retry only dismiss the toast | The action is implemented visually, not functionally. | Connect Retry to the original operation and report its result. |
| Removing a focused toast without a focus plan | Dismissal is implemented as simple DOM removal. | Avoid unnecessary focus stealing and test keyboard focus when interactive toasts disappear. |
| Putting the whole stack in an assertive live region | Developers assume all messages should be announced immediately. | Use appropriately scoped live regions and test announcement behavior with target screen readers. |
| Forgetting timer cleanup | The timer is created without lifecycle ownership. | Store timer IDs and clear them on manual dismissal and host teardown. |
| Trusting category strings in class names | Dynamic presentation values are not validated. | Normalize category values through a fixed allowlist. |
| Using `innerHTML` for notification text | String interpolation seems convenient. | Set message content with `textContent` or safe framework text rendering. |
| Covering the primary mobile action | Placement is tuned only for desktop screenshots. | Test real workflows with sticky bars, safe areas, and on-screen keyboards. |
| Ignoring reduced-motion preferences | Animation is added without user preference support. | Use `prefers-reduced-motion` to reduce or remove transitions. |
| Hiding important instructions in a transient toast | The toast is used as a universal message surface. | Keep essential information inline or in a persistent recovery UI. |
| Allowing stale async outcomes to overwrite newer state | Responses are applied without operation identity. | Associate responses with request IDs and ignore obsolete results. |
| Failing to define queue overflow | A maximum is added but no policy decides what is dropped. | Preserve critical errors and route persistent issues to a page-level surface. |
| Treating uncertain network outcome as definite failure | A timeout is interpreted as proof that the server did nothing. | Explain uncertainty and use idempotency or status lookup when duplicate action is risky. |

### Before/after: truthful operation feedback

**Before — reports success immediately:**

```js
button.addEventListener("click", () => {
  notify({ kind: "success", message: "Saved!" });
  saveSettings();
});
```

**After — reports the confirmed outcome:**

```js
button.addEventListener("click", async () => {
  try {
    await saveSettings();
    notify({ kind: "success", message: "Settings saved." });
  } catch {
    notify({ kind: "error", message: "We couldn't confirm the save. Check your settings before retrying." });
  }
});
```

### Before/after: safe text rendering

**Before — treats message content as markup:**

```js
toast.innerHTML = message;
```

**After — displays the string as text:**

```js
toast.textContent = message;
```

---

## Mental Models

1. **A toast is a notification channel, not a source of truth:** The underlying page and server state remain authoritative.
2. **The click is not the outcome:** A user action may fail, time out, or remain uncertain; report what the system actually knows.
3. **Transient means recoverable:** If the information is essential for completing a task, it probably belongs inline or in a persistent surface.
4. **A timer is part of the interaction:** Hover, focus, duration, manual dismissal, and cleanup must be designed together.
5. **Every announcement has an attention cost:** Reserve assertive interruptions for genuinely urgent information.
6. **A queue needs a policy:** Define visible limits, priority, deduplication, and overflow rather than letting event volume dictate the UI.
7. **Actions must honor their labels:** Retry retries; Undo reverses the operation; Dismiss only dismisses.
8. **Mobile space is shared space:** A toast must coexist with navigation, safe areas, keyboards, and primary controls.
9. **Cleanup is correctness:** Timers and callbacks that outlive a notification can mutate the wrong UI state.
10. **The message should improve recovery:** A good notification tells users what happened and what they can do next.

---

## Quick Reference

| Need | Recommended approach | Verify |
|---|---|---|
| Routine success | `role="status"` / polite announcement | Announcement does not unnecessarily interrupt speech |
| Urgent alert | Use `role="alert"` selectively | Urgency justifies interruption |
| Dismissal | Native button with an accessible name | Keyboard and screen reader identify the action |
| Timeout | Duration based on complexity and action | User has a reasonable chance to read and act |
| Interactive toast | Pause while hovered or focused | Timer resumes with remaining time |
| Many events | Queue and maximum visible count | Important errors are not silently discarded |
| Repeated messages | Deduplicate by semantic key | New meaningful state is still announced |
| Action button | Connect to the actual operation | Action outcome is confirmed and communicated |
| Network request | Show pending, success, failure, or uncertainty | No premature success claim |
| Safe text | Use `textContent` or framework escaping | Message text cannot inject markup |
| Mobile placement | Responsive width and safe-area insets | Toast does not cover required controls |
| Motion | Respect `prefers-reduced-motion` | UI remains understandable without animation |
| Lifecycle | Clear timers and listeners | Dismissal and timeout races are harmless |
| Category styling | Text/icon plus color | Meaning remains clear without color perception |
| Critical instruction | Use persistent inline content | User can find it after the toast disappears |
| Uncertain mutation | Idempotency key or status check | Retry cannot accidentally duplicate a dangerous action |

---

## Build Challenge

Build a reusable notification system for a creative agency dashboard. It should confirm actions such as saving settings, copying a project link, finishing an export, or failing to refresh a dashboard. The system must not become the only place where users can recover from important errors.

### Requirements

1. Create one shared notification host with a stable `notify()` API.
2. Support success, info, warning, and error categories with text or icon cues in addition to color.
3. Use polite announcements for routine messages and reserve assertive announcements for truly urgent alerts.
4. Provide a native, accessible dismissal button for each visible toast.
5. Use a default timeout that can be overridden by message complexity or action requirements.
6. Pause automatic dismissal while a toast is hovered or contains keyboard focus.
7. Resume with the remaining time rather than restarting the full timeout.
8. Limit the visible stack to a documented maximum.
9. Define queue overflow behavior and ensure important failures are not silently discarded.
10. Deduplicate repeated messages by a semantic key.
11. Ensure Undo, Retry, and View actions invoke real operations.
12. Represent pending, success, failure, and uncertain network outcomes honestly.
13. Use safe text rendering for all dynamic message content.
14. Make layout responsive and account for mobile safe-area insets.
15. Respect reduced-motion preferences.
16. Clean up timers and event listeners on manual dismissal and host teardown.
17. Prevent stale async outcomes from overwriting newer notification state.
18. Add an action-bearing toast and test that its action remains usable.
19. Include a failure path where a network timeout does not prove the server did nothing.
20. Verify the toast never obscures a primary mobile action in the target workflow.
21. Test keyboard navigation and focus behavior when a toast disappears.
22. Test screen-reader announcements with the supported browser and assistive-technology combinations.
23. Add automated tests for queue limits, deduplication, timer cleanup, and action behavior.
24. Document when the application should use inline errors instead of a toast.
25. Add a short manual test checklist for desktop, mobile, reduced motion, and keyboard-only use.

### Failure scenarios to inject

- Trigger the same sync failure repeatedly and verify notifications are deduplicated or coalesced.
- Queue more messages than the visible limit and verify the overflow policy is followed.
- Focus a toast action and wait longer than the configured duration; verify it does not disappear while focused.
- Dismiss a toast just as its timeout fires; verify cleanup is safe and no unrelated toast is removed.
- Make a save request time out after the server may have committed it; verify the message does not falsely claim a definite failure.
- Force the clipboard API to reject and verify the UI offers a practical manual-copy fallback.
- Use a very long message on a narrow viewport and verify it wraps without horizontal overflow.
- Enable reduced motion and verify the toast remains understandable without animated transitions.
- Return an unexpected notification category and verify it falls back to a safe default.
- Remove the notification host while timers are pending and verify no stale callback updates detached UI.

### Definition of done

- [ ] Notifications are emitted through one consistent API.
- [ ] Routine messages use non-interruptive announcement semantics.
- [ ] Each dismiss action is keyboard-accessible and has an understandable name.
- [ ] Toasts remain available while the user interacts with them.
- [ ] Queue size, overflow, and deduplication policies are explicit and tested.
- [ ] Success messages follow confirmed operation outcomes.
- [ ] Retry and Undo actions perform real, safe operations.
- [ ] Dynamic text is rendered safely.
- [ ] Mobile placement respects the usable viewport and important controls.
- [ ] Reduced-motion preferences are honored.
- [ ] Timers and listeners are cleaned up correctly.
- [ ] Critical errors remain recoverable outside the toast channel.
- [ ] Tests cover async uncertainty, queue overflow, duplicate events, and dismissal races.
- [ ] Keyboard and screen-reader behavior is manually verified.
- [ ] Documentation explains notification categories and when not to use a toast.

### Suggested test matrix

| Scenario | Action | Expected result |
|---|---|---|
| Routine save | Complete a successful save | Polite success message appears after confirmation |
| Server failure | Reject the save request | Useful failure message appears; no false success |
| Duplicate event | Emit the same event repeatedly | Duplicate policy prevents notification spam |
| Queue overflow | Emit more messages than the visible limit | Documented overflow behavior is followed |
| Focused action | Focus an action inside the toast | Auto-dismiss pauses until focus leaves |
| Manual/timeout race | Dismiss as timer expires | Toast is removed safely once |
| Clipboard denial | Reject clipboard write | Manual-copy guidance is shown |
| Narrow viewport | Use a small screen and long text | Toast fits and does not cover the required action |
| Reduced motion | Enable reduced-motion setting | Transitions are removed or reduced |
| Invalid category | Pass an unknown category | Safe default styling is used |
| Host teardown | Remove host with active timers | No stale updates or uncaught errors |
| Uncertain mutation | Simulate lost response | UI communicates uncertainty and avoids unsafe blind retry |
