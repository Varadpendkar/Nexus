# SKILL: feedback-response-patterns

**Layer:** 28 --- Interaction Design

**Goal:** Design timely, understandable, accessible feedback that tells
users what the system is doing, what changed, and how to recover when an
action fails.

## Why This Matters (Senior Perspective)

Interfaces are conversations between a person and a system. A user
clicks Save, uploads a file, submits a form, changes a setting, or
triggers an animation; the system must respond in a way that confirms
whether the request was received, whether work is still happening, and
whether the desired result was achieved. Without feedback, even a
successful action can feel broken. People click again, submit duplicate
forms, abandon a flow, or lose trust because the interface leaves them
guessing.

Junior implementations often treat feedback as a decorative toast added
after the main feature works. Senior implementations design feedback as
part of the state model. They distinguish idle, pending, success, empty,
validation, recoverable failure, and unrecoverable failure states. They
decide which feedback belongs inline, which needs an announcement for
assistive technology, which deserves a persistent record, and which
should not interrupt the user. They also consider asynchronous timing,
network delays, retries, optimistic updates, duplicate submissions, and
race conditions. A green success message is not truthful if the server
rejected the operation.

For creative sites and product interfaces, feedback can support a
polished visual language without sacrificing clarity. A portfolio
contact form can use subtle motion and branded colors, but it still
needs to show progress, confirm delivery only after confirmation, and
preserve the visitor's message if the request fails. A 3D configurator
can animate a selection, but it must also communicate whether the
selected configuration was saved. Well-designed feedback reduces
uncertainty, prevents repeated work, improves accessibility, and makes
the interface feel reliable even when the underlying system is slow or
imperfect.

## Core Concepts

### 1. Feedback Is Part of the Interaction Contract

Every meaningful action should produce an appropriate response. That
response may be immediate visual state, a changed label, a status
message, navigation, or an error. The key question is not "Should we
show a toast?" but "What does the user need to know after this action?"

``` html
<button id="copy-link" type="button">Copy project link</button>
<p id="copy-status" role="status" aria-live="polite"></p>
```

``` js
const copyButton = document.querySelector("#copy-link");
const copyStatus = document.querySelector("#copy-status");

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyStatus.textContent = "Project link copied.";
  } catch {
    copyStatus.textContent = "Could not copy automatically. Select and copy the URL from your address bar.";
  }
});
```

The status explains the result rather than relying only on a brief color
flash. The error provides a next step.

**Naive/Wrong:** Change the button color on click and assume that
confirms success.

**Correct:** Communicate the outcome in a way that remains
understandable after the visual transition ends.

**Gotcha:** Browser APIs can fail because of permissions or security
context. Always handle rejection rather than assuming success.

### 2. Model Interaction States Explicitly

For asynchronous actions, define the states before designing the UI. A
common model is idle → pending → success or error. Some actions also
need validation, cancellation, retrying, or partial success. Explicit
states prevent contradictory messages and controls.

``` js
const state = {
  status: "idle", // idle | pending | success | error
  message: ""
};

function setStatus(status, message = "") {
  state.status = status;
  state.message = message;
  renderStatus();
}
```

``` html
<p id="save-status" role="status" aria-live="polite"></p>
<button id="save" type="button">Save changes</button>
```

**Naive/Wrong:** Add unrelated booleans such as `isLoading`, `isDone`,
`hasError`, and `isSaving` without defining which combinations are
valid.

**Correct:** Use a clear state model and render the UI from it, so
impossible combinations cannot occur.

**Gotcha:** State updates should reflect the actual operation. Do not
move to success before the operation has confirmed success.

### 3. Choose the Right Feedback Channel

Different messages belong in different places. Inline feedback is best
when the user needs it to complete a field or understand a local
component. A toast is useful for short, non-blocking confirmation. A
dialog is appropriate when the user must make a consequential decision.
A persistent activity area is useful for long-running jobs or multiple
uploads.

``` html
<form>
  <label for="email">Email address</label>
  <input id="email" type="email" aria-describedby="email-error">
  <p id="email-error" class="field-error">Enter a valid email address.</p>
</form>
```

``` css
.field-error {
  margin-block: .35rem 0;
  color: #ff9caa;
  font-size: .9rem;
}
```

**Naive/Wrong:** Send every event to a toast, including field errors and
important decisions.

**Correct:** Put feedback close to the affected control unless the
message is global or needs to persist beyond the current view.

**Gotcha:** A toast that disappears quickly may be missed by users who
need more time to read. Important instructions should not depend on
transient notices.

### 4. Distinguish Pending from Success

A request being sent is not the same as a request succeeding. Pending
feedback should indicate that work is underway; success feedback should
only appear after confirmation. Keep the user's context visible when
possible.

``` html
<button id="send" type="submit">
  <span class="button-label">Send message</span>
  <span class="button-progress" hidden>Sending…</span>
</button>
```

``` js
async function submitMessage(formData) {
  setPending(true);
  try {
    await sendToServer(formData);
    showSuccess("Your message was sent.");
  } catch {
    showError("We couldn't send your message. Your draft is still available.");
  } finally {
    setPending(false);
  }
}
```

**Naive/Wrong:** Display "Message sent!" as soon as the user presses the
button.

**Correct:** Display "Sending..." while waiting and show success only
when the server confirms the operation.

**Gotcha:** If the backend can accept a request but the response is
lost, the client may not know whether it succeeded. Design retry
behavior to avoid duplicate actions.

### 5. Make Loading States Informative

A spinner indicates activity but rarely explains what is happening or
how long it might take. Use a spinner for short waits, skeletons when
content structure is known, and progress indicators when meaningful
progress is measurable. For longer tasks, include a description and
allow cancellation when safe.

``` html
<section aria-busy="true" aria-describedby="report-loading">
  <p id="report-loading" role="status">Generating your report…</p>
  <div class="skeleton skeleton--line"></div>
  <div class="skeleton skeleton--block"></div>
</section>
```

``` css
.skeleton {
  border-radius: .5rem;
  background: linear-gradient(90deg, #242432, #343447, #242432);
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
}
```

**Naive/Wrong:** Put an indefinite spinner on the entire page with no
label and no recovery path.

**Correct:** Identify what is loading, preserve stable layout where
possible, and explain prolonged work.

**Gotcha:** Do not invent a percentage unless the system can measure
real progress. A fake progress bar can undermine trust.

### 6. Make Errors Actionable

A useful error explains what happened at the level the user needs, what
remains safe, and what to do next. Avoid blame, unexplained codes, and
generic "Something went wrong" messages when a more specific message is
possible. Do not expose internal stack traces or secrets.

``` html
<div class="error-message" role="alert">
  <p>We couldn't upload the image because it exceeds the 10 MB limit.</p>
  <button type="button">Choose a smaller image</button>
</div>
```

``` css
.error-message {
  border-inline-start: 4px solid #ff7388;
  padding: .9rem 1rem;
  background: #271a23;
  border-radius: .5rem;
}
```

**Naive/Wrong:** Show "Error 500" and leave the user to guess how to
recover.

**Correct:** Explain the actionable cause where known, preserve user
input, and offer a recovery step.

**Gotcha:** Be honest about uncertainty. If the system cannot determine
the cause, say the operation failed and provide a safe retry or support
route rather than inventing a reason.

### 7. Validate at the Right Time

Validation can happen while typing, on blur, or on submit. Choose timing
based on the cost of an error and the user's need for immediate
guidance. Avoid showing an error before the user has had a reasonable
chance to enter a value. For complex fields, combine a concise rule with
a specific correction.

``` html
<label for="handle">Username</label>
<input id="handle" name="handle" aria-describedby="handle-help handle-error">
<p id="handle-help">3–20 letters, numbers, or underscores.</p>
<p id="handle-error" hidden role="alert">Use 3–20 letters, numbers, or underscores.</p>
```

``` js
const handle = document.querySelector("#handle");
const error = document.querySelector("#handle-error");

handle.addEventListener("blur", () => {
  const valid = /^[a-zA-Z0-9_]{3,20}$/.test(handle.value);
  error.hidden = valid || handle.value.length === 0;
  handle.setAttribute("aria-invalid", String(!valid && handle.value.length > 0));
});
```

**Naive/Wrong:** Mark every empty field invalid as soon as the form
renders.

**Correct:** Use an appropriate validation moment, explain the rule, and
connect the error to the field.

**Gotcha:** Client-side validation improves feedback but cannot replace
server-side validation. Treat submitted values as untrusted.

### 8. Use Optimistic Updates Carefully

Optimistic UI updates the interface before the server confirms success.
It can make low-risk interactions feel immediate, such as liking a post
or favoriting a project. It must include rollback or reconciliation if
the request fails. Use it only when the temporary state will not mislead
users about a consequential operation.

``` js
async function toggleFavorite(projectId, nextValue) {
  const previousValue = favorites.has(projectId);
  setFavorite(projectId, nextValue); // optimistic update

  try {
    await api.setFavorite(projectId, nextValue);
  } catch {
    setFavorite(projectId, previousValue); // rollback
    announce("Favorite could not be updated. Please try again.");
  }
}
```

**Naive/Wrong:** Change the UI immediately and never reconcile it with
the server response.

**Correct:** Save the prior state, apply the optimistic change, and roll
back or update to the authoritative result on failure.

**Gotcha:** Rapid repeated toggles can race. Use request identifiers,
cancellation, or server-side ordering where necessary.

### 9. Prevent Duplicate Submissions

Users may click twice because a request appears slow, because they did
not notice the first click, or because they are using assistive
technology. Prevent accidental duplicate submissions without trapping
users. Disable or guard the action while a single-flight operation is in
progress, and provide clear pending feedback.

``` js
let submitting = false;

async function handleSubmit(event) {
  event.preventDefault();
  if (submitting) return;

  submitting = true;
  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";

  try {
    await submitForm(new FormData(event.currentTarget));
    showSuccess("Submission received.");
  } catch {
    showError("Submission failed. Your entries are still available.");
  } finally {
    submitting = false;
    submitButton.disabled = false;
    submitButton.textContent = "Submit";
  }
}
```

**Naive/Wrong:** Depend on users to click only once, even when the UI
gives no immediate response.

**Correct:** Guard against duplicate in-flight requests and restore the
control after completion.

**Gotcha:** Client-side guards do not guarantee exactly-once processing.
For payments or other consequential operations, use server-side
idempotency as well.

### 10. Announce Dynamic Feedback Accessibly

A message that appears visually may not be announced by a screen reader.
Use live regions for status messages and alerts for urgent errors, while
avoiding excessive announcements. Ensure the announcement text is
updated in a predictable way and that the user's focus is not moved
unnecessarily.

``` html
<p id="status-region" role="status" aria-live="polite" aria-atomic="true"></p>
<div id="urgent-error" role="alert" aria-atomic="true"></div>
```

``` js
function announceStatus(message) {
  document.querySelector("#status-region").textContent = message;
}
function announceError(message) {
  document.querySelector("#urgent-error").textContent = message;
}
```

**Naive/Wrong:** Render a visual toast without any accessible status
semantics.

**Correct:** Use an appropriate live region and concise announcement
text.

**Gotcha:** Repeatedly replacing the same text with identical content
may not trigger a new announcement in every assistive technology. Test
the actual implementation rather than assuming the attribute guarantees
behavior.

### 11. Preserve User Work During Failure

If an upload, form submission, or save fails, preserve the input
wherever safe. Users should not have to reconstruct a long message or
repeat a complex configuration because a network request timed out.
Clearly distinguish local draft state from server-confirmed saved state.

``` js
const draft = {
  message: "",
  lastSavedAt: null
};

messageField.addEventListener("input", () => {
  draft.message = messageField.value;
  localStorage.setItem("contact-draft", draft.message);
});

function restoreDraft() {
  const saved = localStorage.getItem("contact-draft");
  if (saved !== null) messageField.value = saved;
}
```

**Naive/Wrong:** Clear every field as soon as submit is clicked.

**Correct:** Clear the form only after confirmed success; retain or
restore a draft when submission fails.

**Gotcha:** Local storage can be shared on a device and may contain
sensitive information. Avoid storing sensitive form content without a
clear need and appropriate safeguards.

### 12. Integrate Feedback with Real Product State

Feedback should be derived from the operation's actual lifecycle. A
saved indicator, upload progress, or success toast should not be a
separate animation disconnected from the underlying result. Make state
transitions explicit and test slow, failed, and repeated requests.

``` js
async function saveSettings(settings) {
  setSaveState({ status: "pending", message: "Saving settings…" });

  try {
    await api.updateSettings(settings);
    setSaveState({ status: "success", message: "Settings saved." });
  } catch (error) {
    setSaveState({
      status: "error",
      message: "Settings couldn't be saved. Your changes remain in this form."
    });
  }
}
```

``` html
<p id="save-feedback" role="status" aria-live="polite"></p>
```

**Naive/Wrong:** Trigger a success animation on click regardless of
whether the network operation completed.

**Correct:** Make the state machine the source of truth for labels,
disabled states, progress, and announcements.

**Gotcha:** Handle stale responses. A slow earlier request should not
overwrite the feedback for a newer operation.

## Named Patterns

### Pattern 1: Pending → Outcome

**What it does:** Shows that an operation started and then reports its
confirmed result.

**When to use it:** Form submissions, saves, uploads, publishing, and
network-backed actions.

``` js
async function runAction(action) {
  setFeedback({ status: "pending", message: "Working…" });
  try {
    const result = await action();
    setFeedback({ status: "success", message: "Changes saved." });
    return result;
  } catch {
    setFeedback({ status: "error", message: "Couldn't save changes. Try again." });
    throw new Error("Action failed");
  }
}
```

Nuance: success wording must match what the server actually guarantees.
"Request received" is not necessarily "processed."

### Pattern 2: Inline Field Recovery

**What it does:** Places validation feedback next to the input that
needs attention and explains how to fix it.

**When to use it:** Sign-up, contact, checkout, search filters, and
settings forms.

``` html
<label for="site-url">Website URL</label>
<input id="site-url" aria-describedby="site-url-error">
<p id="site-url-error" role="alert">Enter a complete URL, such as https://example.com.</p>
```

Nuance: avoid announcing every keystroke as an error. Use a sensible
validation moment and preserve the user's value.

### Pattern 3: Optimistic Change with Rollback

**What it does:** Updates the interface immediately and reverts if the
server rejects the change.

**When to use it:** Low-risk actions such as favorites, reactions, and
reversible preferences.

``` js
const oldState = isFavorite;
setIsFavorite(true);
try {
  await saveFavorite(true);
} catch {
  setIsFavorite(oldState);
  announceStatus("Favorite wasn't saved.");
}
```

Nuance: do not use optimism for actions where a temporary false claim
could cause financial, legal, or safety harm.

### Pattern 4: Persistent Job Status

**What it does:** Keeps long-running tasks visible after the user
navigates around the page or starts other work.

**When to use it:** Video rendering, large uploads, report generation,
exports, and batch operations.

``` html
<section aria-labelledby="job-title">
  <h3 id="job-title">Exporting portfolio</h3>
  <p role="status">Preparing files. You can continue editing.</p>
  <button type="button">Cancel export</button>
</section>
```

Nuance: offer cancellation only if the backend can safely cancel or stop
the job. Otherwise, explain that the operation cannot be cancelled.

### Pattern 5: Toast for Low-Interruption Confirmation

**What it does:** Briefly confirms a low-risk action without
interrupting the current task.

**When to use it:** Copying a link, changing a reversible preference, or
adding an item to a lightweight list.

``` html
<div class="toast" role="status" aria-live="polite">
  Link copied to clipboard.
</div>
```

Nuance: do not use an auto-dismissing toast as the only place for
critical information or a required next step.

### Pattern 6: Recovery-First Error

**What it does:** Explains the failure, protects user work, and gives a
clear recovery action.

**When to use it:** Upload failures, save errors, network interruptions,
and rejected operations.

``` html
<div role="alert" class="error-panel">
  <p>Your image wasn't uploaded. Your project edits are still here.</p>
  <button type="button">Retry upload</button>
</div>
```

Nuance: retry should be safe and should not duplicate a consequential
action. If the result is unknown, explain that uncertainty.

## Common Mistakes

  -----------------------------------------------------------------------
  Mistake                 Why It Happens          Fix
  ----------------------- ----------------------- -----------------------
  Success shown before    Click event is confused Tie success to the
  confirmation            with operation          resolved operation
                          completion              

  Spinner with no context Loading indicator is    Add a short label
                          treated as sufficient   describing the work

  Fake progress           Designers want motion   Use indeterminate
  percentage              during an unknown wait  progress unless real
                                                  progress exists

  Generic error message   Error states are added  Explain known cause and
                          late                    provide a recovery step

  Form clears before      UI reset is placed      Clear only after
  request finishes        directly in the submit  confirmed success
                          handler                 

  Duplicate submissions   Slow responses make     Guard in-flight
                          users click again       requests and use server
                                                  idempotency for
                                                  critical actions

  Every message is a      One feedback component  Match the channel to
  toast                   is reused everywhere    the scope and urgency

  Error only indicated by Color is treated as     Add explanatory text
  red                     enough information      and semantic
                                                  association

  Toast disappears too    Temporary UI is         Keep important
  quickly                 prioritized over        information persistent
                          reading time            or user-dismissable

  Optimistic state never  Failure path was not    Save previous state and
  rolls back              implemented             reconcile on failure

  Loading state blocks    Whole page is treated   Scope busy state to the
  all navigation          as one operation        affected region when
                                                  possible

  Live region announces   Every tiny state update Reserve announcements
  too much                is announced            for meaningful changes

  Client validation       Browser checks are      Validate again on the
  trusted as security     mistaken for authority  server

  Retry blindly repeats a Retry is implemented    Use idempotency keys
  payment or order        without operation       and communicate
                          semantics               uncertain outcomes

  Stale response          Concurrent requests are Track request identity
  overwrites new state    not considered          and ignore stale
                                                  responses

  Disabled button has no  Disabled appearance is  Explain the unmet
  explanation             assumed to be           requirement beside the
                          self-explanatory        control
  -----------------------------------------------------------------------

## Mental Models

1.  **Feedback closes the loop:** An action is not fully understood
    until the system communicates its result.
2.  **Pending is not success:** Starting work and completing work are
    different states and deserve different language.
3.  **The state machine owns the UI:** Labels, spinners, disabled
    states, and messages should derive from the operation state.
4.  **Errors need a next step:** A useful error reduces uncertainty and
    helps the user recover.
5.  **Preserve the user's investment:** Keep entered information and
    configuration safe when an operation fails.
6.  **Optimism creates a debt:** Immediate UI changes must be reconciled
    with the authoritative server result.
7.  **Channel follows consequence:** The location, persistence, and
    urgency of feedback should match the user's need.
8.  **Accessible feedback is real feedback:** Dynamic changes must be
    perceivable without relying only on sight.
9.  **Retry is a product decision:** A retry button is safe only when
    the operation can be repeated or its identity is tracked.
10. **Truth beats polish:** A subtle, honest pending state is better
    than a beautiful but misleading success animation.

## Quick Reference

  -----------------------------------------------------------------------
  Situation               Feedback pattern        Key detail
  ----------------------- ----------------------- -----------------------
  Short save              Pending label, then     Confirm only after
                          success                 completion

  Long task               Persistent job status   Use measurable progress
                          and progress            only

  Field validation        Inline error and helper Associate message with
                          text                    field

  Recoverable failure     Error explanation and   Preserve user input
                          retry                   

  Copy action             Short status            Handle clipboard
                          confirmation            failure

  Favorite toggle         Optimistic state with   Keep state semantic and
                          rollback                visual

  Duplicate submission    In-flight guard         Add server idempotency
  risk                                            for critical work

  Unknown request outcome Honest uncertainty      Avoid unsafe blind
                          message                 retries

  Background upload       Persistent activity     Allow safe cancellation
                          item                    if supported

  Urgent failure          Alert semantics and     Avoid excessive alert
                          visible message         announcements

  Empty result            Helpful empty state     Explain how to create
                                                  or find content

  Saved draft             Clear local-vs-server   Do not imply server
                          status                  persistence prematurely
  -----------------------------------------------------------------------

## Build Challenge: Create a Reliable Contact Form

Build a polished contact form for a creative studio portfolio. It must
handle validation, slow network responses, successful submission,
failure, duplicate clicks, and recovery without losing the visitor's
message.

### Requirements

1.  Use semantic form controls with persistent labels.
2.  Validate required fields at a sensible time and explain errors
    beside the relevant field.
3.  Show a pending state when submission begins.
4.  Prevent duplicate in-flight submissions.
5.  Show success only after the server confirms receipt.
6.  On failure, preserve all entered values and provide an actionable
    retry.
7.  Announce status changes to assistive technology without excessive
    announcements.
8.  Keep feedback visually consistent with the site's design system.
9.  Distinguish field-level errors from form-level/network errors.
10. Handle a request that takes several seconds without leaving the user
    uncertain.
11. Simulate a server failure and confirm that the draft remains intact.
12. Consider an uncertain outcome where the request may have succeeded
    but the response was lost.
13. Ensure the submit button returns to an appropriate state after
    either success or failure.
14. Test keyboard-only interaction and narrow mobile layouts.
15. Document which actions are safe to retry and why.

### Failure scenarios to test

-   The network request takes five seconds and the user clicks Submit
    repeatedly.
-   The server rejects the request after the visitor has typed a long
    message.
-   The server accepts the request but the response times out.
-   A validation error is shown visually but is not associated with the
    field.
-   A success toast disappears before the visitor can read it.
-   The form displays "Sent" even though the request failed.
-   A stale response from an earlier attempt overwrites the current
    status.

### Definition of Done / Success Criteria

-   [ ] Every state is explicit: idle, pending, success, and error.
-   [ ] Pending feedback appears promptly and does not falsely imply
    completion.
-   [ ] Success is shown only after confirmed acceptance.
-   [ ] Duplicate submissions are prevented at the UI layer.
-   [ ] Critical operations have a server-side idempotency strategy
    where appropriate.
-   [ ] Errors explain the issue and a useful recovery action.
-   [ ] User-entered content survives failed submission.
-   [ ] Status messages are accessible to screen-reader users.
-   [ ] The form works with keyboard, touch, and responsive layouts.
-   [ ] Slow, failed, and ambiguous outcomes have been tested.
-   [ ] No message claims more than the system knows.

## Final Review Checklist

For every important interaction, ask: What does the user expect to
happen? What state appears immediately? How do they know work is still
underway? What confirms success? What happens on failure? Is retry safe?
Is the user's work preserved? Does the message appear in the right place
and remain available long enough? Can assistive technology announce it?
Could concurrent requests or stale responses produce a misleading state?

Feedback is not decoration added after implementation. It is the
system's side of the interaction. Design it deliberately, tie it to real
state, and make every outcome understandable and recoverable.
