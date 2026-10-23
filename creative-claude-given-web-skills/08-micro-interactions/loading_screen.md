---
name: loading-screen
layer: layer-08-micro-interactions
filename: loading_screen.md
description: Build intentional loading screens with truthful progress, accessible status communication, cancellation, and reliable completion states.
---

# Loading Screen

## Why This Matters

A loading screen communicates that an application is working while content or a task is not yet ready. It can protect the user from confusing blank states, explain what is happening, and create a coherent transition into the experience. It can also become a source of frustration when it blocks the interface unnecessarily, invents progress, hides errors, or continues spinning after the work has finished.

A production loading screen is not simply a spinner. It is a stateful interface that distinguishes between waiting, measurable progress, completion, failure, and cancellation. It should communicate only what the application knows, preserve access to useful context, and avoid motion that is unnecessary or inaccessible.

A reliable loading experience should:
- Show a loading state only when work is actually pending.
- Prefer inline progress when the rest of the interface can remain usable.
- Report determinate progress only when the underlying work provides meaningful measurements.
- Avoid fake percentages and indefinite animations that imply false precision.
- Provide accessible status updates without announcing every visual frame.
- Respect reduced-motion preferences.
- Handle errors, cancellation, timeouts, retries, and unmounting deliberately.
- Prevent duplicate submissions and stale asynchronous results.
- Remove the loading UI when the operation reaches a terminal state.

This skill covers loading-state modeling, spinners, skeletons, determinate progress, React and vanilla JavaScript patterns, accessibility, network requests, cancellation, and testing.

## Core Concepts

### 1. Model Loading as a State, Not a Decoration

A loading indicator should reflect an actual operation. Define the states the operation can occupy instead of toggling a spinner independently from the request.

```js
const state = {
  status: "idle", // idle | loading | success | error | cancelled
  data: null,
  error: null,
};
```

**Why:** A state model prevents the interface from getting stuck in a loading state after an error or from displaying success before the work has completed. It also makes retries and cancellation easier to reason about.

### 2. Choose the Smallest Appropriate Loading Surface

Use a small inline indicator for a local action, a skeleton for a content region whose shape is known, and a full-screen loading screen only when the entire experience genuinely cannot be used.

```text
Button action       → button-level progress
Card or table       → local skeleton or inline status
Route transition    → page-level progress
Application startup → startup screen only if necessary
```

**Why:** A full-screen overlay blocks access to unrelated content. Keep the scope of the loading UI proportional to the scope of the work.

### 3. Distinguish Determinate and Indeterminate Progress

Determinate progress has a meaningful measurement, such as bytes downloaded or records processed. Indeterminate progress means the duration or amount of work is not known.

```html
<progress value="42" max="100">42%</progress>
```

```html
<div role="status">Loading report…</div>
```

**Why:** A percentage should represent actual progress. Do not animate a made-up percentage from 0 to 100 just to make waiting appear productive. For unknown durations, use a clear status and a restrained indeterminate indicator.

### 4. Keep Progress Truthful

Progress is a statement about the task, not a decorative animation. If the operation provides stages rather than percentages, communicate the current stage.

```js
const stages = [
  "Preparing data…",
  "Processing records…",
  "Finalizing report…",
];
```

**Why:** Users make decisions based on progress. A truthful stage label is more useful than a fake percentage that reaches 95% and stalls.

### 5. Communicate State Changes Accessibly

Use a concise status message and appropriate semantics. A visual spinner by itself may provide no useful information to a screen reader.

```html
<div role="status" aria-live="polite" aria-atomic="true">
  Loading account details…
</div>
```

**Why:** A status announcement should communicate a meaningful state change. Avoid placing rapidly changing percentages or animation frames in a live region unless those updates are genuinely useful and throttled.

### 6. Keep the Final Content Available Where Possible

For content that can be progressively rendered, preserve the page shell and replace only the pending region. Skeletons can communicate expected structure, but they should not pretend to be real content.

**Why:** Keeping navigation, headings, and surrounding context visible reduces disorientation and makes the interface feel more responsive. Full-screen blocking is justified only when the app cannot safely expose the rest of the UI.

### 7. Respect Reduced Motion

A loading indicator should still communicate pending work when animation is reduced or disabled. Use a static indicator or text label instead of removing the only indication that work is happening.

```css
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-top-color: currentColor;
  }
}
```

**Why:** Reduced motion should remove unnecessary movement, not remove state information. Always retain an understandable loading label or status.

### 8. Prevent Duplicate Actions

A loading action should usually disable or otherwise guard the trigger that started it. However, disabling every control in the interface is often excessive.

```js
if (state.status === "loading") return;
state.status = "loading";
```

**Why:** Duplicate form submissions can create duplicate orders, uploads, or requests. Guard the operation itself, not just the visual button state.

### 9. Handle Errors and Cancellation as Terminal States

Loading should end when work succeeds, fails, or is cancelled. A spinner must not remain visible simply because an error path forgot to clear it.

```js
try {
  await performTask();
  setStatus("success");
} catch (error) {
  setStatus("error");
}
```

**Why:** Every asynchronous operation needs a defined completion path. Cancellation is not the same as success, and errors should provide a clear next action when possible.

### 10. Cancel Stale Work

When a user changes a search query, navigates away, or starts a new operation, the previous request may no longer be relevant. Use cancellation when supported and ignore stale results when cancellation is not possible.

```js
const controller = new AbortController();

fetch("/api/report", { signal: controller.signal });
// Later, when the request is no longer needed:
controller.abort();
```

**Why:** Without cancellation or stale-result protection, an older response can overwrite newer data or update a component that has already been removed.

### 11. Avoid Layout Shift

Reserve the expected space for loading content, especially in cards, tables, media, and page transitions.

```css
.report-skeleton {
  min-height: 16rem;
}
```

**Why:** If the loading region has no reserved dimensions, the page can jump when content arrives. Match the skeleton's geometry to the final content rather than adding arbitrary blocks.

### 12. Use Timeouts Carefully

A timeout can prevent an operation from appearing to run forever, but it must reflect a real application policy. A timeout should lead to a useful state, not silently claim the request failed when the outcome is uncertain.

**Why:** Network requests can finish late, and a client-side timeout does not always mean the server did not process the operation. For critical mutations, distinguish a confirmed failure from an unknown outcome and provide safe retry guidance.

## Patterns

### Pattern 1: Accessible CSS Spinner

**Use when:** A short operation needs an indeterminate visual indicator.

```html
<div class="loading-inline" role="status" aria-live="polite">
  <span class="spinner" aria-hidden="true"></span>
  <span>Loading account details…</span>
</div>
```

```css
.loading-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  color: #444;
  font-size: 0.9375rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-rotate 700ms linear infinite;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    border-right-color: currentColor;
    border-top-color: transparent;
  }
}
```

**Notes:**
- Keep the status label visible when possible.
- Avoid adding `aria-live` to every nested element; one concise status region is usually enough.
- If the operation is very brief, consider avoiding a flashing indicator by applying a small, intentional delay before showing it. Do not delay the actual work.

### Pattern 2: Button-Level Loading State

**Use when:** A user submits a form or triggers a single action.

```html
<button type="button" id="export-button">
  <span class="button-label">Export report</span>
  <span class="button-spinner" aria-hidden="true" hidden></span>
</button>
<p id="export-status" role="status" aria-live="polite"></p>
```

```js
const button = document.querySelector("#export-button");
const label = button?.querySelector(".button-label");
const spinner = button?.querySelector(".button-spinner");
const status = document.querySelector("#export-status");

async function exportReport() {
  if (!button || button.dataset.loading === "true") return;

  button.dataset.loading = "true";
  button.disabled = true;
  if (label) label.textContent = "Exporting…";
  if (spinner) spinner.hidden = false;
  if (status) status.textContent = "Export started.";

  try {
    await performExport();
    if (status) status.textContent = "Export complete.";
    if (label) label.textContent = "Export report";
  } catch (error) {
    if (status) status.textContent = "Export failed. Try again.";
    if (label) label.textContent = "Retry export";
  } finally {
    button.dataset.loading = "false";
    button.disabled = false;
    if (spinner) spinner.hidden = true;
  }
}

button?.addEventListener("click", exportReport);
```

Replace `performExport()` with the real operation. Keep the operation guard even if the button is disabled, since other code paths may invoke the same function. If the export returns a file, handle the actual download and failure cases rather than treating any resolved promise as proof that the file was saved.

### Pattern 3: Determinate Progress Bar

**Use when:** The underlying task provides a meaningful current value and total.

```html
<div class="progress-block">
  <div class="progress-heading">
    <span id="progress-label">Uploading files…</span>
    <span id="progress-value">0%</span>
  </div>
  <progress id="upload-progress" value="0" max="100" aria-labelledby="progress-label">
    0%
  </progress>
</div>
```

```js
function updateProgress(progressElement, valueElement, value, max = 100) {
  const safeMax = Math.max(1, Number(max) || 100);
  const safeValue = Math.max(0, Math.min(safeMax, Number(value) || 0));

  progressElement.max = safeMax;
  progressElement.value = safeValue;
  valueElement.textContent = `${Math.round((safeValue / safeMax) * 100)}%`;
}
```

**Notes:**
- Update progress from real upload, download, or processing measurements.
- If the amount of work is unknown, use an indeterminate progress element by omitting `value`, or use a status indicator instead.
- Do not announce every percentage change in a live region. If a spoken progress update is required, throttle it to meaningful increments.

### Pattern 4: Skeleton for a Content Region

**Use when:** The final content has a predictable layout and the rest of the page can remain usable.

```html
<section aria-busy="true" aria-describedby="report-loading">
  <p id="report-loading" role="status">Loading report data…</p>
  <div class="report-skeleton" aria-hidden="true">
    <div class="skeleton-line skeleton-line--wide"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-chart"></div>
  </div>
</section>
```

```css
.report-skeleton {
  display: grid;
  gap: 1rem;
  min-height: 16rem;
}

.skeleton-line,
.skeleton-chart {
  border-radius: 0.5rem;
  background: #e8e8e8;
}

.skeleton-line {
  width: 65%;
  height: 0.85rem;
}

.skeleton-line--wide {
  width: 90%;
}

.skeleton-chart {
  min-height: 10rem;
}

@media (prefers-reduced-motion: no-preference) {
  .skeleton-line,
  .skeleton-chart {
    background-image: linear-gradient(
      100deg,
      transparent 20%,
      rgb(255 255 255 / 55%) 50%,
      transparent 80%
    );
    background-size: 220% 100%;
    animation: skeleton-shimmer 1.6s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    to {
      background-position: -220% 0;
    }
  }
}
```

When the content is ready, replace the skeleton with actual content and set `aria-busy="false"` on the region. Ensure the skeleton is hidden from assistive technology and the status message is removed or updated.

### Pattern 5: Full-Screen Startup Screen

**Use when:** The application cannot be used until essential startup work finishes.

```html
<div id="app-loading" class="app-loading" role="status" aria-live="polite">
  <span class="spinner" aria-hidden="true"></span>
  <p>Preparing your workspace…</p>
</div>
<main id="app-content" hidden></main>
```

```css
.app-loading {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 1rem;
  text-align: center;
}
```

```js
async function startApplication() {
  const loading = document.querySelector("#app-loading");
  const content = document.querySelector("#app-content");

  try {
    const initialData = await loadInitialData();
    renderApplication(content, initialData);
    content.hidden = false;
    loading.hidden = true;
  } catch (error) {
    loading.innerHTML = `
      <p>We couldn't load your workspace.</p>
      <button type="button" id="retry-startup">Try again</button>
    `;
    document.querySelector("#retry-startup")?.addEventListener(
      "click",
      startApplication,
      { once: true }
    );
  }
}
```

Replace `loadInitialData()` and `renderApplication()` with application functions. In production, avoid replacing markup with `innerHTML` if content may be untrusted; use DOM creation or framework rendering. Prefer a page shell with inline loading states if the application can safely render useful navigation before the data arrives.

### Pattern 6: Abortable Fetch with Stale-Result Protection

**Use when:** A request can be cancelled because the user navigated away or changed the query.

```js
async function loadReport(url, render, showError) {
  const controller = new AbortController();

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    render(data);
  } catch (error) {
    if (error.name === "AbortError") return;
    showError(error);
  }

  return () => controller.abort();
}
```

A practical API often needs the cleanup function before the asynchronous operation settles. Return a controller immediately or let the caller own it:

```js
function createReportRequest(url, { onData, onError }) {
  const controller = new AbortController();
  let active = true;

  const promise = fetch(url, { signal: controller.signal })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      if (active) onData(data);
    })
    .catch((error) => {
      if (active && error.name !== "AbortError") onError(error);
    });

  return {
    promise,
    cancel() {
      active = false;
      controller.abort();
    },
  };
}
```

This controller allows cancellation before the promise settles and prevents stale callbacks after cancellation.

### Pattern 7: React Loading State with Error Handling

**Use when:** A component loads data and should distinguish pending, success, and error states.

```jsx
import { useEffect, useState } from "react";

export function ReportPanel({ url }) {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({ status: "loading", data: null, error: null });

    async function load() {
      try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }

        const data = await response.json();
        if (active) setState({ status: "success", data, error: null });
      } catch (error) {
        if (!active || error.name === "AbortError") return;
        setState({ status: "error", data: null, error });
      }
    }

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, [url]);

  if (state.status === "loading") {
    return <p role="status">Loading report…</p>;
  }

  if (state.status === "error") {
    return (
      <div role="alert">
        <p>We couldn't load the report.</p>
        <p>{state.error.message}</p>
      </div>
    );
  }

  return <Report data={state.data} />;
}
```

**Implementation notes:**
- Replace `Report` with the real content component.
- The effect aborts the previous request when `url` changes or the component unmounts.
- In production, avoid exposing raw server error messages if they can contain sensitive details.
- Add a retry control when the user can reasonably recover from the failure.
- For data that should remain visible during refresh, model `refreshing` separately from the initial `loading` state rather than clearing useful content unnecessarily.

### Pattern 8: Minimum Display Time Without Delaying the Work

**Use when:** A very fast operation causes a spinner to flash, making the interface look unstable.

```js
async function runWithMinimumIndicator(task, show, hide, minimumMs = 180) {
  const startedAt = performance.now();
  show();

  try {
    return await task();
  } finally {
    const elapsed = performance.now() - startedAt;
    const remaining = Math.max(0, minimumMs - elapsed);

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    hide();
  }
}
```

**Notes:**
- The task starts immediately; only the indicator's dismissal is delayed.
- Use this sparingly. A minimum display time can make fast operations feel slower if set too high.
- If the component unmounts during the delay, clear the timer in the component's lifecycle or use an abortable delay helper.
- Do not apply minimum display time to critical status, security, or emergency feedback.

## Common Mistakes

| Mistake | Why It Fails | Better Approach |
|---|---|---|
| Showing a full-screen overlay for a small task | Blocks unrelated work | Use button-level or inline progress |
| Inventing a percentage | Misrepresents task state | Use measured progress or indeterminate status |
| Leaving the spinner active after failure | Makes the app appear stuck | Model success, error, and cancellation explicitly |
| Disabling every control | Blocks unrelated actions | Disable only controls affected by the operation |
| Updating a live region every frame | Creates noisy announcements | Announce meaningful state changes only |
| Using a skeleton with unrelated geometry | Causes layout shift when content arrives | Match the final content structure |
| Ignoring reduced motion | Forces unnecessary animation | Keep status visible with a static indicator |
| Allowing duplicate submissions | Can create duplicate mutations | Guard the action and operation |
| Ignoring stale requests | Old data may overwrite new results | Abort requests and guard callbacks |
| Hiding the only loading status from assistive technology | Users may not know work is happening | Provide concise status semantics |
| Assuming a timeout means the server did nothing | Can lead to unsafe retries | Distinguish confirmed failure from unknown outcome |
| Forgetting retry behavior | Leaves users stuck after recoverable failure | Provide a clear recovery action |
| Starting multiple timers or requests on every render | Causes duplicate work | Start and clean up work in lifecycle boundaries |
| Making the spinner the only indication of progress | Spinner communicates no task details | Add a short label when useful |
| Keeping stale content without indicating refresh | Users may assume old data is current | Distinguish initial loading from refreshing |
| Using a minimum indicator duration that is too long | Makes fast work feel slow | Keep the delay short and evidence-based |

## Mental Models

1. **Loading is a state machine.** Every operation needs explicit pending, success, error, and cancellation behavior.
2. **The loading surface should match the work.** Block only the region that cannot yet be used.
3. **Progress is a factual claim.** Use percentages only when the underlying task supplies meaningful measurements.
4. **The indicator is not the operation.** Hiding a spinner does not cancel a request; disabling a button does not guarantee deduplication.
5. **Accessibility communicates state, not animation frames.** Provide concise status updates and avoid noisy live announcements.
6. **Cancellation protects relevance.** Old work should not overwrite a newer request or update a removed view.
7. **Reduced motion keeps information and removes unnecessary movement.** The user should still understand that work is pending.

## Quick Reference

### State checklist

| State | Expected behavior |
|---|---|
| Idle | No unnecessary loading indicator |
| Loading | Clear, proportionate status |
| Determinate progress | Real value and total |
| Success | Indicator ends and content is available |
| Error | Clear message and recovery path |
| Cancelled | Pending state ends; no stale update |
| Refreshing | Existing content may remain with an update status |
| Reduced motion | Static or non-animated status remains |
| Unmount | Requests, timers, and animation work are cleaned up |

### Debugging sequence

1. Identify the real asynchronous operation that owns the loading state.
2. Confirm that every success, failure, cancellation, and timeout path exits loading.
3. Trigger the operation repeatedly and check for duplicate requests.
4. Navigate away while a request is pending and check for stale updates.
5. Test slow, fast, failed, and offline network conditions.
6. Verify that progress values reflect real measurements.
7. Inspect live-region announcements with a screen reader.
8. Enable reduced motion and confirm that status remains clear.
9. Check layout shift when skeletons are replaced with content.
10. Test retries and ambiguous network outcomes.
11. Verify timers and event listeners are removed on unmount.
12. Confirm that full-screen blocking is genuinely necessary.

### Production checklist

- [ ] Loading state is tied to the real operation.
- [ ] The smallest useful loading surface is used.
- [ ] Progress is truthful and measured.
- [ ] Initial HTML or fallback content remains understandable.
- [ ] Status text is concise and accessible.
- [ ] Live announcements are not excessively frequent.
- [ ] Reduced-motion behavior retains state information.
- [ ] Duplicate actions are guarded.
- [ ] Errors have a clear recovery path.
- [ ] Cancellation and stale-result behavior are defined.
- [ ] Timers, requests, and listeners are cleaned up.
- [ ] Skeleton geometry matches the final content.
- [ ] Timeout behavior reflects the risk of the operation.
- [ ] Refreshing is distinguished from initial loading where appropriate.
- [ ] The loading UI disappears in every terminal state.

## Build Challenge

Build a report dashboard with an initial data-loading state, a refresh action, determinate upload progress for a CSV import, and a recoverable error state.

### Requirements

1. Keep the dashboard shell visible whenever it is safe to do so.
2. Use a skeleton for the report region and reserve its dimensions.
3. Provide a concise accessible status message.
4. Use real progress measurements for the CSV upload.
5. Prevent duplicate imports.
6. Abort or ignore stale requests when the report URL changes.
7. Distinguish initial loading from background refresh.
8. Support cancellation where the operation allows it.
9. Provide a retry path for recoverable failures.
10. Respect reduced-motion preferences.
11. Clean up timers and requests on component teardown.
12. Test fast, slow, failed, and interrupted operations.

### Acceptance criteria

- No fake percentage is displayed.
- The correct content appears after successful completion.
- A failed request leaves loading state and exposes a useful error message.
- Retrying does not create overlapping operations.
- A stale request cannot replace newer data.
- Reduced-motion users still receive a clear pending status.
- The skeleton does not cause a noticeable layout jump.
- The dashboard remains usable outside the pending region.
- All timers and requests are cleaned up when the view is removed.
- The loading indicator ends for success, failure, and cancellation.

### Review questions

1. Why is loading best modeled as a state machine?
2. When is a full-screen loading screen justified?
3. What distinguishes determinate from indeterminate progress?
4. Why is a fake percentage harmful?
5. How should loading status be exposed to assistive technology?
6. How do you prevent duplicate submissions?
7. Why should stale requests be cancelled or ignored?
8. What is the difference between initial loading and refreshing?
9. Why does a client timeout not always prove that a server-side mutation failed?
10. How would you test loading behavior under reduced motion and poor network conditions?
