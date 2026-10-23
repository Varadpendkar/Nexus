# Error Message Writing

**Layer:** 5 — Content Strategy  
**Skill directory:** `error-message-writing/`  
**Canonical skill file:** `error-message-writing/SKILL.md`

## Skill Goal

Design error messages that help people understand what happened, decide what to do next, and recover without losing work or confidence. This skill covers inline validation, form submission failures, network and server errors, permission problems, destructive-action safeguards, empty-result states caused by errors, accessibility announcements, and technical diagnostics.

The goal is not to make every error sound friendly. The goal is to make each error accurate, actionable, appropriately calm, and connected to a real recovery path.

---

# 1. Why This Matters

Error messages are part of the product's recovery system. They appear at moments when the user is already blocked, uncertain, or worried about losing progress. A weak message adds a second problem to the first: the original task has failed, and the interface now leaves the user to guess why.

Consider a checkout form that says “Invalid input.” The user may not know whether the card number, expiry date, billing address, or postal code is wrong. A more useful message names the field and explains the expected correction. Consider a document editor that reports “Something went wrong” after a save request times out. If the application cannot confirm whether the save completed, saying “Your document was not saved” may be false; saying “Saved successfully” may be dangerous. The correct message communicates the uncertainty and gives the user a safe next step.

Good error writing can reduce repeated submissions, support tickets, abandoned workflows, accidental data loss, and distrust. It also improves accessibility: users who rely on screen readers need errors to be programmatically associated with the relevant control and announced at the right time. People using keyboards need focus to move predictably. People with cognitive or language-processing constraints benefit from specific, plain-language instructions rather than vague technical explanations.

A junior approach often starts by choosing a tone—friendly, professional, or playful—and then writes a sentence. A senior approach starts with the failure state: what is known, what is unknown, what the user was trying to do, whether data was preserved, what action is safe, and how the interface will confirm recovery. Tone follows those decisions. No amount of polished copy can compensate for an incorrect claim about payment status, data persistence, permissions, or the success of an operation.

This skill matters in creative work as much as in enterprise software. A polished portfolio, agency site, ecommerce flow, dashboard, or mobile interface feels unreliable when errors are generic, inconsistent, inaccessible, or visually detached from the action that failed. Freelancers and product teams should treat error content as a designed component with rules, variants, states, and acceptance criteria—not as last-minute placeholder text.

**Core principle:** state only what the system knows, explain what the user can do, and never imply recovery has happened before it is confirmed.

> **Gotcha:** “Friendly” does not mean vague, jokey, or falsely reassuring. In a payment or data-loss scenario, calm precision is kinder than cheerfulness.

---

# 2. Core Concepts

## Concept 1 — Describe the Failure, Not the Person

Errors should describe the state of the task or the input, not blame the user. Avoid language such as “You entered this wrong” or “You failed to provide a valid value.” State the condition and explain the correction.

```text
Avoid: You entered an invalid email.
Prefer: Enter an email address in the format name@example.com.
```

```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email"
       aria-describedby="email-error">
<p id="email-error" class="field-error">
  Enter an email address in the format name@example.com.
</p>
```

**Why it works:** it makes the correction about the field, not the user's competence.

**Naive approach:** “You did it wrong.”

**Better approach:** “The email address needs an @ symbol.”

> **Gotcha:** Avoid implying that every invalid value is a user mistake. Validation rules can be unclear, overly strict, or broken.

## Concept 2 — Make the Message Actionable

A useful message includes a next step whenever a next step exists. “Request failed” identifies a failure but does not help the user recover. “We couldn’t upload the file. Check your connection and try again” provides a plausible action—provided connectivity is actually a likely cause.

```text
Weak: Upload failed.
Better: We couldn't upload report.pdf. Check your connection and try again.
```

```js
function getUploadErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "The upload was canceled. Choose the file again to restart it.";
  }

  if (error?.code === "FILE_TOO_LARGE") {
    return "This file is too large. Choose a file smaller than 10 MB.";
  }

  return "We couldn't upload the file. Try again.";
}
```

**Why it works:** the user can make progress without interpreting internal system language.

**Naive approach:** expose the exception string.

**Better approach:** map known failure categories to clear recovery instructions.

> **Gotcha:** Do not recommend “check your connection” for every failure. If the server rejected a file type, network advice is a distraction.

## Concept 3 — Separate What Happened from What to Do

A message is easier to scan when it identifies the outcome first and then gives a specific next step. This is especially important for destructive actions, payment attempts, and long-running operations.

```text
The report couldn't be exported.
Choose CSV or try again in a moment.
```

```html
<div role="alert" aria-labelledby="export-error-title">
  <h2 id="export-error-title">The report couldn't be exported</h2>
  <p>Choose CSV or try again in a moment.</p>
</div>
```

Use a sentence or short heading for the failure and a second sentence for recovery when the situation needs both. For small inline errors, one concise sentence may be enough.

**Naive approach:** combine every detail into one long sentence.

**Better approach:** lead with the state, then provide the recovery action.

## Concept 4 — Match Specificity to Evidence

Be precise only when the system has evidence. If a server response confirms that a username is already taken, the interface can say so. If a request times out and the application does not know whether the server completed it, the interface must communicate uncertainty.

```text
Known: This username is already in use. Try another username.
Unknown outcome: We couldn't confirm whether the change was saved. Check the current value before trying again.
```

```js
function getSaveFailureMessage({ outcomeKnown, retrySafe }) {
  if (!outcomeKnown) {
    return retrySafe
      ? "We couldn't confirm the save. Check the document, then try again if needed."
      : "We couldn't confirm whether the save completed. Check the document before repeating the action.";
  }

  return "The changes couldn't be saved. Try again.";
}
```

**Why it works:** it avoids false certainty and unsafe retries.

**Naive approach:** use “failed” for every exception.

**Better approach:** distinguish confirmed failure, confirmed success, and unknown outcome.

> **Gotcha:** A network timeout does not prove that the server did not process the request.

## Concept 5 — Preserve User Work

When a form submission fails, retain entered values whenever it is safe and technically possible. Do not make users reconstruct a long application, message, or checkout form because one field needs correction.

```html
<form>
  <label for="company">Company name</label>
  <input id="company" name="company" value="Northstar Studio">
  <p id="company-error" class="field-error">
    Enter a company name with at least 2 characters.
  </p>
</form>
```

```js
const formState = {
  values: {
    company: "Northstar Studio",
    contactEmail: "hello@example.com"
  },
  errors: {
    company: ""
  }
};

// On a recoverable submission error, preserve values and update only errors.
```

**Why it works:** it reduces frustration and supports recovery.

**Naive approach:** reset the entire form after any failed request.

**Better approach:** preserve inputs, identify the fields that need attention, and explain whether the operation was completed.

**Security note:** do not preserve sensitive values such as passwords, one-time codes, or payment security codes in unsafe storage or after a security-sensitive failure.

## Concept 6 — Use Field-Level Validation at the Right Time

Inline errors are useful when the user can correct a specific field. Avoid displaying every possible error before the user has interacted with the form. A common pattern is to validate after blur or submission, then clear the message when the value becomes valid.

```js
function validateEmail(value) {
  if (!value.trim()) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter an email address in the format name@example.com.";
  }
  return "";
}
```

```html
<label for="contact-email">Email address</label>
<input id="contact-email" type="email" name="email"
       aria-invalid="true" aria-describedby="contact-email-error">
<p id="contact-email-error">Enter an email address in the format name@example.com.</p>
```

**Naive approach:** show a red error while the user is still typing a normal intermediate value.

**Better approach:** choose a consistent validation trigger, support correction, and keep the message associated with the field.

## Concept 7 — Explain Requirements Before They Become Errors

Preventable errors are often better solved with helpful instructions near the input. If a password requires a minimum length and a number, explain that before submission instead of making the user discover the rules through repeated failures.

```html
<label for="new-password">New password</label>
<p id="password-hint">Use at least 12 characters.</p>
<input id="new-password" type="password"
       aria-describedby="password-hint">
```

```text
Before submission: Use at least 12 characters.
After submission: Your password needs at least 12 characters.
```

**Why it works:** it shifts the experience from punishment to guidance.

**Naive approach:** hide requirements until the form is rejected.

**Better approach:** provide clear constraints early and use error messages for unmet requirements.

## Concept 8 — Distinguish Validation, System, and Permission Errors

Different causes require different wording and recovery paths.

- **Validation error:** the provided value does not meet a requirement.
- **Authentication error:** the user needs to sign in or reauthenticate.
- **Authorization error:** the signed-in user lacks permission for the action.
- **Network error:** the client could not complete communication.
- **Server error:** the service could not complete the request.
- **Conflict error:** the requested change conflicts with current state.
- **Unknown outcome:** the request may have completed, but confirmation was lost.

```js
const messages = {
  validation: "Enter a valid project name.",
  authentication: "Your session has expired. Sign in again to continue.",
  authorization: "You don't have permission to edit this project.",
  conflict: "This project changed in another tab. Refresh to review the latest version.",
  server: "We couldn't complete the request. Try again shortly."
};
```

**Naive approach:** display “Something went wrong” for every failure.

**Better approach:** map meaningful error categories to the correct next step.

> **Gotcha:** Do not disclose sensitive details about accounts, permissions, or system internals to an unauthorized user.

## Concept 9 — Avoid False Reassurance

Do not claim that data is safe, a payment failed, or an action was undone unless the system can confirm that state. In uncertain cases, explain what is known and what the user should check.

```text
Unsafe: Your payment failed. Try again.
Safer when outcome is unknown: We couldn't confirm the payment status. Check your order history before trying again.
```

```js
function paymentMessage(status) {
  if (status === "confirmed_failed") {
    return "The payment wasn't completed. You can try another payment method.";
  }
  if (status === "confirmed_success") {
    return "Payment received. Your order is confirmed.";
  }
  return "We couldn't confirm the payment status. Check your order history before trying again.";
}
```

**Naive approach:** optimize for a reassuring sentence.

**Better approach:** optimize for a truthful sentence that prevents a harmful next action.

## Concept 10 — Make Recovery Controls Clear

If an error offers a button, its label should describe the action. “OK” and “Continue” can be ambiguous when the user needs to retry, sign in, review a change, or return to safety.

```html
<div role="alert">
  <p>We couldn't load your projects.</p>
  <button type="button">Try again</button>
</div>
```

```text
Prefer: Try again
Prefer: Sign in again
Prefer: Review changes
Prefer: Return to dashboard
Avoid: Click here
Avoid: Proceed (when the result is unclear)
```

**Why it works:** the action is understandable without rereading the error.

**Naive approach:** use a generic button label everywhere.

**Better approach:** use a verb and a specific object when needed.

## Concept 11 — Use Calm, Plain Language

Prefer familiar words and short sentences. Do not expose stack traces, status codes, database table names, or implementation details as the primary user-facing message.

```text
Technical: HTTP 503 from /v2/records; upstream dependency unavailable.
User-facing: We couldn't load your records right now. Try again shortly.
```

```js
function presentApiError(error) {
  // Log technical details to the approved diagnostics system.
  // Show a safe, useful message in the interface.
  return "We couldn't load your records right now. Try again shortly.";
}
```

**Naive approach:** assume technical detail equals transparency.

**Better approach:** explain the user-visible impact and next step; provide technical diagnostics separately to authorized support staff.

## Concept 12 — Make Errors Accessible

Color alone is not enough. Use text, semantic relationships, keyboard-accessible controls, and appropriate live-region behavior. Associate field errors using `aria-describedby`, and use `aria-invalid="true"` when a field is invalid.

```html
<label for="postal-code">Postal code</label>
<input id="postal-code" name="postalCode"
       aria-invalid="true"
       aria-describedby="postal-code-hint postal-code-error">
<p id="postal-code-hint">Enter the postal code for your billing address.</p>
<p id="postal-code-error" class="field-error">
  Enter a valid postal code.
</p>
```

For a submission-level error, a `role="alert"` region can announce a newly inserted message assertively. Do not attach `role="alert"` to every field error during every keystroke; excessive announcements can make the form difficult to use.

**Naive approach:** show a red border and assume everyone will understand.

**Better approach:** provide text, relationships, and announcements that match the urgency of the error.

> **Gotcha:** Test with keyboard navigation and screen readers; valid-looking markup alone does not prove the experience is usable.

## Concept 13 — Use Error Summaries for Long Forms

For forms with many fields, a summary near the top can tell users how many issues need attention and link to each affected field. Keep inline messages too; the summary does not replace field-level guidance.

```html
<div role="alert" aria-labelledby="form-errors-title">
  <h2 id="form-errors-title">There are 3 issues to review</h2>
  <ul>
    <li><a href="#email">Enter a valid email address.</a></li>
    <li><a href="#start-date">Choose a start date.</a></li>
    <li><a href="#postal-code">Enter a valid postal code.</a></li>
  </ul>
</div>
```

```js
function buildErrorSummary(errors) {
  return errors.map(({ field, message }) => ({ field, message }));
}
```

**Naive approach:** display only a banner that says “Please correct the form.”

**Better approach:** list the issues and make each one a direct route to the corresponding field.

## Concept 14 — Design Retry Behavior as Part of the Copy

A retry message should match the operation's idempotency and risk. Repeating a read request is usually safer than repeating a payment, sending an invitation, or creating a record. The interface should not invite duplicate actions when the previous result is uncertain.

```text
Safe read retry: We couldn't load your activity. Try again.
Potential duplicate: We couldn't confirm whether the invitation was sent. Check the member list before sending another.
```

```js
function retryInstruction({ operation, outcomeKnown }) {
  if (operation === "read") {
    return "We couldn't load this information. Try again.";
  }
  if (!outcomeKnown) {
    return "We couldn't confirm whether this action completed. Check its current status before repeating it.";
  }
  return "The action wasn't completed. Try again.";
}
```

**Naive approach:** put “Retry” on every error.

**Better approach:** determine whether retrying is safe before offering it.

## Concept 15 — Distinguish Empty Results from Errors

An empty result is not always an error. “No projects yet” is different from “We couldn't load your projects.” The first can be a normal state with a creation action; the second indicates that the system failed to retrieve data.

```text
Empty: No projects yet. Create your first project to get started.
Error: We couldn't load your projects. Try again.
```

```js
function getProjectsState({ loading, error, projects }) {
  if (loading) return "loading";
  if (error) return "error";
  if (projects.length === 0) return "empty";
  return "success";
}
```

**Naive approach:** show an empty state whenever a request fails.

**Better approach:** model loading, success-with-data, success-with-no-data, and failure as separate states.

## Concept 16 — Explain Conflicts and Concurrent Changes

When data changes elsewhere, users need to know that their view may be stale. Do not silently overwrite newer changes or blame the user for a conflict they could not see.

```text
This project changed in another tab. Refresh to review the latest version before saving again.
```

```html
<div role="alert">
  <h2>This project has changed</h2>
  <p>Someone updated it while you were editing. Review the latest version before saving again.</p>
  <button type="button">Review latest version</button>
</div>
```

**Naive approach:** “Update failed.”

**Better approach:** explain the conflict and protect the user's edits while they resolve it.

## Concept 17 — Separate User Copy from Diagnostic Details

Technical diagnostics help developers and support teams investigate. They should be recorded through approved logging channels, not exposed indiscriminately in the UI. Avoid leaking tokens, private data, internal hostnames, query strings, or raw server responses.

```js
function handleFailure(error, context) {
  // Pseudocode: use the application's approved logger and redaction rules.
  logSafeDiagnostic({
    category: classifyError(error),
    operation: context.operation,
    requestId: context.requestId
  });

  return "We couldn't complete that action. Try again, or contact support if the problem continues.";
}
```

```text
User-facing: We couldn't export the report. Try CSV or try again later.
Support-facing: Export operation failed; request ID 7F2A...; category=timeout.
Never display: access tokens, full stack traces, database credentials, or private payloads.
```

**Naive approach:** show raw exceptions because they are convenient during development.

**Better approach:** keep user guidance safe and diagnostics useful, minimal, and access-controlled.

---

# 3. Error-message Patterns / Integration Patterns

## Pattern 1 — Inline Field Error

**Use when:** one input fails a known validation rule.

**Structure:** field label → requirement hint when useful → invalid state → concise correction.

```html
<label for="website">Website</label>
<input id="website" name="website" type="url"
       aria-invalid="true" aria-describedby="website-error">
<p id="website-error">Enter a full website address, such as https://example.com.</p>
```

```text
Bad: Invalid URL.
Good: Enter a full website address, such as https://example.com.
```

**Implementation notes:**
- Keep the message next to its field.
- Do not rely on color alone.
- Clear or update the error when the field becomes valid.
- Avoid changing layout so dramatically that users lose their place.

**Gotcha:** If the input format is genuinely flexible, do not impose an unnecessary format restriction just to make validation easier.

## Pattern 2 — Form Submission Summary

**Use when:** submission reveals multiple errors or an error is not tied to a single field.

```html
<section aria-labelledby="submission-error-title" role="alert">
  <h2 id="submission-error-title">We couldn't submit the form</h2>
  <p>Review the highlighted fields and try again.</p>
</section>
```

For a long form, add linked field-level issues. For a server-side failure unrelated to individual fields, avoid marking every field invalid.

```text
Bad: There are errors.
Good: We couldn't submit your application. Review the highlighted fields and try again.
```

**Gotcha:** Do not move focus to a summary that is not visible or is hidden behind a sticky header.

## Pattern 3 — Network or Service Failure

**Use when:** a request cannot be completed and the exact cause may not be known.

```html
<div role="alert" aria-labelledby="load-error-title">
  <h2 id="load-error-title">We couldn't load your activity</h2>
  <p>Try again. Your saved items haven't been changed by this request.</p>
  <button type="button">Try again</button>
</div>
```

Only include the sentence about saved items if the application can guarantee it.

```text
Bad: Network error: fetch failed.
Good: We couldn't load your activity. Try again.
```

**Gotcha:** A generic service error should not claim a particular cause unless telemetry or the response confirms it.

## Pattern 4 — Unknown Outcome for a High-Risk Action

**Use when:** the request may have reached the server but the client did not receive confirmation.

```text
We couldn't confirm whether your payment completed. Check your order history before trying again.
```

```html
<div role="alert">
  <h2>Payment status isn't confirmed</h2>
  <p>Check your order history before attempting another payment.</p>
  <a href="/orders">View order history</a>
</div>
```

**Implementation notes:**
- Do not label the action “failed” unless failure is confirmed.
- Provide a status-check route if available.
- Avoid offering an immediate repeat action when it may create a duplicate.
- Use server-side idempotency protections where the architecture supports them.

**Gotcha:** Copy cannot make a non-idempotent operation safe. The backend and interaction design must support safe recovery.

## Pattern 5 — Permission or Authentication Error

**Use when:** a user must sign in again or lacks access.

```text
Authentication: Your session has expired. Sign in again to continue.
Authorization: You don't have permission to edit this project. Ask a project admin for access.
```

```html
<div role="alert">
  <h2>You don't have access to this project</h2>
  <p>Ask a project administrator to grant you access.</p>
  <a href="/help/access">Learn about project access</a>
</div>
```

**Implementation notes:**
- Distinguish session expiry from missing permission.
- Preserve safe drafts before redirecting to sign-in.
- Avoid confirming whether a private account or resource exists to an unauthorized person.
- Explain the next step without exposing access-control internals.

**Gotcha:** “Contact your administrator” is not helpful if the user has no idea who that is. Name the role or offer a help route when possible.

## Pattern 6 — Conflict or Stale Data

**Use when:** the user's action conflicts with a newer server state.

```text
This item changed while you were editing. Review the latest version before saving again.
```

```html
<div role="alert">
  <h2>This item has changed</h2>
  <p>Your edits are still available. Review the latest version before deciding what to keep.</p>
  <button type="button">Review changes</button>
</div>
```

Only promise that edits remain available if they really are preserved.

**Gotcha:** Never imply that refreshing is harmless if unsaved edits will be lost.

## Pattern 7 — Destructive Action Failure

**Use when:** a delete, archive, or cancellation action fails or has an uncertain result.

```text
We couldn't confirm whether the project was deleted. Check the project list before trying again.
```

```text
Confirmed failure: The project wasn't deleted. Try again.
Confirmed success: Project deleted.
Unknown result: We couldn't confirm whether the project was deleted. Check the project list.
```

**Gotcha:** Do not use the same copy for confirmed failure and unknown outcome. They imply different safe actions.

## Pattern 8 — Upload and File Validation

**Use when:** file size, file type, processing, or upload transfer fails.

```text
Type: This file type isn't supported. Choose a PDF or DOCX file.
Size: This file is too large. Choose a file smaller than 10 MB.
Transfer: We couldn't upload the file. Check your connection and try again.
Processing: The file uploaded, but we couldn't read its contents. Try a clearer file.
```

```html
<label for="document">Upload document</label>
<input id="document" name="document" type="file" accept=".pdf,.docx"
       aria-describedby="document-help document-error">
<p id="document-help">PDF or DOCX, up to 10 MB.</p>
<p id="document-error">This file is too large. Choose a file smaller than 10 MB.</p>
```

**Gotcha:** Use server-side validation too. Client-side `accept` hints do not guarantee the uploaded content is safe or valid.

## Pattern 9 — Search Failure vs No Results

**Use when:** search fails to execute or returns zero matching records.

```text
No results: No results for “invoice 2025”. Try a different keyword.
Search failure: We couldn't complete your search. Try again.
```

```html
<section aria-labelledby="search-error-title" role="alert">
  <h2 id="search-error-title">Search isn't available right now</h2>
  <p>Try again in a moment.</p>
  <button type="button">Retry search</button>
</section>
```

**Gotcha:** Do not display “No results” when the query never completed successfully.

## Pattern 10 — Autosave and Background Sync

**Use when:** work is saved in the background and the user needs an accurate status.

```text
Saving…
Saved at 2:41 PM.
Changes couldn't be saved. Check your connection; your local draft is still available.
```

The final sentence is valid only if the draft is actually preserved locally.

```html
<p role="status" aria-live="polite">Saving changes…</p>
<p role="status" aria-live="polite">Changes saved.</p>
<p role="alert">Changes couldn't be saved. Try again.</p>
```

**Implementation notes:**
- Use polite announcements for routine status changes.
- Reserve assertive alerts for urgent failures that need immediate attention.
- Avoid announcing every autosave keystroke.
- Indicate whether the content is saved remotely, locally, or not at all.

**Gotcha:** “Saved” should refer to a defined persistence boundary. A local draft is not the same as a confirmed server save.

## Pattern 11 — Rate Limit or Temporary Lockout

**Use when:** a request is temporarily blocked by a limit or security control.

```text
You've tried too many times. Wait a few minutes before trying again.
```

If the system provides a trustworthy retry time, state it. If it does not, do not invent one.

```js
function rateLimitMessage(retryAfterMinutes) {
  if (Number.isFinite(retryAfterMinutes) && retryAfterMinutes > 0) {
    return `Please wait about ${retryAfterMinutes} minutes before trying again.`;
  }
  return "You've tried too many times. Wait a little before trying again.";
}
```

**Gotcha:** Do not reveal sensitive anti-abuse thresholds or create a message that helps attackers optimize attempts.

## Pattern 12 — Unexpected Error with Support Route

**Use when:** an unknown failure prevents progress and the user may need assistance.

```html
<div role="alert">
  <h2>Something unexpected happened</h2>
  <p>We couldn't complete this action. Try again. If it continues, contact support and include reference ID ABC123.</p>
</div>
```

Use a real, generated reference ID and a real support path. Never invent a ticket number or imply that a support request has been filed automatically.

```text
Bad: Error 500. Contact support.
Better: We couldn't complete this action. Try again. If it continues, contact support and share reference ID ABC123.
```

**Gotcha:** A reference ID is useful only if support can actually look it up.

---

# 4. Common Mistakes and Distinct Fixes

| Mistake | Why it fails | Distinct fix |
|---|---|---|
| 1. “Something went wrong” everywhere | Hides the failure category and next step | Use a specific message for known validation, permission, conflict, or service states |
| 2. Blaming the user | Creates friction and shame | Describe the field or task state neutrally |
| 3. Exposing raw exception text | Leaks internals and overwhelms people | Map exceptions to approved user-facing copy; log safe diagnostics separately |
| 4. Saying “failed” when outcome is unknown | Can trigger duplicate payments or actions | State that the outcome could not be confirmed and offer a status check |
| 5. Offering retry for every operation | Repeated action may create duplicates | Determine retry safety and idempotency before presenting retry |
| 6. Clearing the whole form | Causes avoidable data loss | Preserve safe inputs and focus correction on affected fields |
| 7. Showing errors too early | Interrupts typing and creates noise | Use consistent validation timing, such as blur or submit |
| 8. Using color without text | Excludes users who cannot perceive the color distinction | Add visible text and programmatic error relationships |
| 9. Missing field associations | Screen-reader users may not hear the relevant error | Connect input and error with `aria-describedby` and `aria-invalid` |
| 10. Announcing every error assertively | Produces a noisy screen-reader experience | Match live-region urgency to the importance and timing of the message |
| 11. Confusing empty state and failure | Suggests there is no data when data could not be retrieved | Model loading, empty success, populated success, and error separately |
| 12. Vague action labels | Users cannot predict what the button does | Use action-specific labels such as “Retry upload” or “Review changes” |
| 13. False reassurance about saved work | Can cause irreversible loss | Make persistence claims only when confirmed by the system |
| 14. Overexplaining technical causes | Makes the user parse irrelevant implementation details | Explain impact and recovery in plain language |
| 15. Giving impossible advice | “Contact your administrator” may be unusable without a contact route | Name the role, provide a route, or state the available alternative |
| 16. Hiding the message after a rerender | User may miss the failure and repeat the action | Keep the error visible until resolved or explicitly dismissed |
| 17. Failing to move focus after submit | Keyboard users may remain far from the errors | Focus a visible summary or the first invalid field according to a consistent pattern |
| 18. Not preventing duplicate submission | Users may create duplicate records while waiting | Disable or guard repeated submissions while the request is pending; restore safely on failure |
| 19. Treating client validation as security | Malicious or modified clients can bypass it | Validate on the server and keep messages aligned with authoritative responses |
| 20. Using vague time estimates | “Back in a second” may be false | Give a time only when supported; otherwise say “Try again shortly” |
| 21. Reusing the same copy for all file errors | File-type, size, transfer, and processing failures need different actions | Map each known category to its own correction |
| 22. Showing inaccessible toast-only errors | Toasts may disappear before users can read or navigate to them | Use persistent inline feedback for important failures and announce it appropriately |
| 23. Exposing account existence | Can reveal private information to unauthenticated users | Use privacy-preserving wording where resource enumeration is a risk |
| 24. Making recovery destructive | Refreshing or navigating away may erase unsaved changes | Explain data impact and preserve a draft before offering navigation |
| 25. No success confirmation after correction | User cannot tell whether recovery worked | Confirm the resulting state after the system reports success |
| 26. Writing copy without engineering states | Text can contradict actual API or persistence behavior | Define state contracts and test each copy branch with product and engineering |

## Before-and-After Examples

### Example A — Login

```text
Before: Invalid credentials.
After: Email or password doesn't match. Check your details and try again.
```

Use privacy-preserving wording where appropriate. Some authentication flows should avoid revealing whether a particular email address has an account.

### Example B — Payment

```text
Before: Payment failed. Retry.
After: We couldn't confirm the payment status. Check your order history before trying again.
```

Use the second version only when the outcome is unknown. If failure is confirmed, say so accurately.

### Example C — Form

```text
Before: Error in form.
After: We couldn't submit your application. Review the highlighted fields and try again.
```

For long forms, include a linked summary and inline messages.

### Example D — Upload

```text
Before: Upload error 413.
After: This file is too large. Choose a file smaller than 10 MB.
```

Only use the size limit if 10 MB is the actual limit.

### Example E — Permission

```text
Before: 403 Forbidden.
After: You don't have permission to edit this project. Ask a project administrator for access.
```

Provide a real access request route when the product supports one.

### Example F — Autosave

```text
Before: Sync error.
After: Changes couldn't be saved. Your latest edits may not be on the server yet; copy them somewhere safe before leaving this page.
```

Use this cautious version only when the persistence state is genuinely uncertain and copying the content is a useful safeguard.

---

# 5. Mental Models

## Model 1 — Error = State + Evidence + Action

Every message should be derived from three questions:

1. **State:** What happened from the user's point of view?
2. **Evidence:** What does the system actually know?
3. **Action:** What can the user safely do next?

```text
State: The export did not complete.
Evidence: The service returned a confirmed processing failure.
Action: Try CSV or retry the export.
Copy: We couldn't export this report. Try CSV or try again.
```

If evidence is missing, reduce certainty rather than inventing a cause.

## Model 2 — The Recovery Ladder

Use the least disruptive recovery path that solves the problem.

1. Correct a field.
2. Retry a safe read or idempotent operation.
3. Refresh or reauthenticate after preserving work.
4. Review current state before repeating a risky operation.
5. Contact support with a useful reference.

```text
Prefer: Correct this field.
Then: Try again.
Then: Review current status.
Finally: Contact support with a reference ID.
```

Do not send users to support when they can solve a simple validation issue themselves.

## Model 3 — Certainty Has Three Levels

Classify outcomes before writing copy:

- **Confirmed success:** say the action completed.
- **Confirmed failure:** say it did not complete and provide a recovery path.
- **Unknown outcome:** say confirmation is unavailable and help the user check status safely.

```js
function outcomeCopy(outcome) {
  switch (outcome) {
    case "success":
      return "Your changes were saved.";
    case "failure":
      return "Your changes weren't saved. Try again.";
    default:
      return "We couldn't confirm whether your changes were saved. Check the latest version before repeating the action.";
  }
}
```

This model is especially important for payments, invitations, uploads, deletions, and autosave.

## Model 4 — Copy Is Part of the State Machine

Error content should correspond to explicit application states, not just a catch-all exception handler.

```text
idle → submitting → success
                 ↘ validation_error
                 ↘ confirmed_failure
                 ↘ outcome_unknown
```

```js
const viewForState = {
  idle: null,
  submitting: "Submitting…",
  success: "Your application was submitted.",
  validation_error: "Review the highlighted fields.",
  confirmed_failure: "We couldn't submit your application. Try again.",
  outcome_unknown: "We couldn't confirm submission. Check your applications before submitting again."
};
```

The message, controls, and available actions must agree with the state.

## Model 5 — The Error Budget of Attention

Each error consumes attention. A message should be as short as possible while preserving the information needed to recover. Do not show multiple banners, repeated field messages, and a toast for the same failure unless each serves a distinct purpose.

```text
Too much: Request failed due to an unexpected issue. This may be because of connectivity, server availability, or an unknown cause. Please attempt the request again later.
Better: We couldn't load your activity. Try again shortly.
```

For high-risk actions, additional detail is justified if it prevents a harmful retry.

## Model 6 — Progressive Disclosure

Give the user the immediate explanation first. Place technical details, troubleshooting steps, and support diagnostics behind a secondary path when they are useful but not necessary for everyone.

```html
<div role="alert">
  <p>We couldn't connect to the service. Try again.</p>
  <details>
    <summary>Technical details</summary>
    <p>Reference ID: ABC123. Share this ID with support if the issue continues.</p>
  </details>
</div>
```

Only include technical details that are safe for the current audience.

## Model 7 — Prevention Beats Recovery

Some errors are symptoms of unclear requirements or poor interaction design. If users repeatedly enter a date in the wrong format, improve the input, example, picker, or helper text instead of endlessly rewriting the error.

```text
Observed: Users repeatedly submit an unsupported file type.
Recovery-only fix: This file type isn't supported.
Prevention fix: Show supported formats beside the upload control and validate the selected file immediately.
```

Measure recurring errors and treat high-volume errors as product feedback.

## Model 8 — Trust Is Built by Accurate Boundaries

The interface should be explicit about what it can and cannot confirm. Trust is not achieved by sounding confident; it is achieved by being reliably accurate.

```text
Known: The file was received, but parsing failed.
Say: The file uploaded, but we couldn't read its contents. Try a clearer file.
Unknown: The upload response was lost.
Say: We couldn't confirm whether the file uploaded. Check your files before uploading it again.
```

---

# 6. Quick Reference

## Message Construction Checklist

| Question | Rule |
|---|---|
| What failed? | Name the task or field |
| What is known? | State only evidence-backed facts |
| What is unknown? | Be transparent about uncertainty |
| What should the user do? | Give one clear next step |
| Is retry safe? | Check for duplicate or irreversible effects |
| Is work preserved? | Say so only when confirmed |
| Is the message plain? | Prefer familiar language over internal terms |
| Is the action label clear? | Use a specific verb |
| Is it accessible? | Associate errors with fields and announce important changes |
| Is the message persistent enough? | Keep important errors visible until resolved |
| Is the state really empty? | Distinguish no results from failed retrieval |
| Are diagnostics safe? | Keep secrets and raw internals out of user copy |

## Common Error Categories

| Category | Recommended direction | Avoid |
|---|---|---|
| Required field | “Enter your [field].” | “Missing value.” |
| Invalid format | “Enter [expected format].” | “Malformed input.” |
| Length requirement | “Use at least [N] characters.” | “Too short.” |
| Unsupported file | “Choose a PDF or DOCX file.” | “Invalid MIME type.” |
| File too large | “Choose a file smaller than [limit].” | “413 Payload Too Large.” |
| Session expired | “Your session has expired. Sign in again to continue.” | “401 Unauthorized.” |
| Missing permission | “You don't have permission to [action].” | “Forbidden.” |
| Conflict | “This item changed. Review the latest version.” | “409 Conflict.” |
| Temporary service issue | “We couldn't complete that request. Try again shortly.” | “500 Internal Server Error.” |
| Unknown payment status | “Check your order history before trying again.” | “Payment failed. Retry.” |
| Empty search | “No results for [query]. Try another keyword.” | “Search failed.” |
| Search service failure | “We couldn't complete your search. Try again.” | “No results.” |

## Useful Copy Templates

```text
Validation:
[Field] needs [requirement]. [Correction action].

Confirmed failure:
We couldn't [complete action]. [Safe next step].

Unknown outcome:
We couldn't confirm whether [action] completed. [Status check] before trying again.

Permission:
You don't have permission to [action]. [Request-access route or role].

Conflict:
[Item] changed while you were editing. [Review path] before saving again.

Temporary issue:
We couldn't [load/submit/export] [item] right now. [Safe retry instruction].

Support:
We couldn't complete this action. Try again. If it continues, contact support and share reference ID [real ID].
```

## Accessibility Quick Reference

```html
<!-- Field-level error -->
<label for="display-name">Display name</label>
<input id="display-name" name="displayName"
       aria-invalid="true" aria-describedby="display-name-error">
<p id="display-name-error">Use at least 2 characters.</p>
```

```html
<!-- Submission-level alert -->
<div role="alert" aria-labelledby="submit-error-title">
  <h2 id="submit-error-title">We couldn't submit your application</h2>
  <p>Review the highlighted fields and try again.</p>
</div>
```

```html
<!-- Non-urgent status -->
<p role="status" aria-live="polite">Changes saved.</p>
```

**Remember:** `role="alert"` is assertive and should be used sparingly. `role="status"` is generally suitable for non-urgent status changes. Test the actual interaction with assistive technology.

---

# 7. Build Challenge

## Challenge — Create a Complete Error System for a Project Dashboard

Design and implement error states for a dashboard where users can create projects, upload documents, edit project details, and export reports. Do not write isolated sentences only; connect each message to the state and recovery behavior that produces it.

### Required scenarios

1. A required project name is missing.
2. The project name conflicts with an existing project name.
3. The session expires during editing.
4. The user lacks permission to edit a project.
5. A document exceeds the actual upload-size limit.
6. The file type is unsupported.
7. The upload request times out and completion is unknown.
8. A report export fails with a confirmed service error.
9. A save request times out and the server outcome is unknown.
10. A project was changed in another tab.
11. A search completes successfully with no results.
12. A search request fails before results are known.
13. A rate limit blocks repeated requests.
14. An unexpected failure needs a support reference.
15. A user submits a long form with multiple field errors.

### Deliverables

- A message inventory with scenario, known facts, unknown facts, user-facing copy, and next action.
- Inline field errors and an accessible form-level summary.
- Error states for loading, empty success, populated success, confirmed failure, and unknown outcome.
- A retry policy that distinguishes safe retries from risky repeated actions.
- A short explanation of what data is preserved in each failure state.
- A technical logging plan that avoids exposing secrets in the UI.
- A test checklist covering keyboard use, screen readers, narrow viewports, and long messages.

### Example state matrix

| Scenario | Known state | Safe next action | Message direction |
|---|---|---|---|
| Missing project name | Validation failure | Enter a name | Name the requirement |
| Duplicate name | Conflict confirmed | Choose a different name | Explain that the name is already in use |
| Session expiry | Authentication required | Reauthenticate after preserving draft | Explain sign-in is needed |
| Missing permission | Authorization denied | Request access | Name the access path |
| Upload too large | Size rejection confirmed | Choose smaller file | State the actual limit |
| Upload timeout | Completion unknown | Check uploaded files | Do not imply upload definitely failed |
| Export failure | Failure confirmed | Retry or choose another format | Name the export task |
| Save timeout | Persistence unknown | Check latest version | Avoid blind repeated saves |
| Search empty | Successful zero-result response | Change query | Say no results were found |
| Search failure | Request failed | Retry search | Do not claim zero results |

### Evaluation rubric

Score each item from 0 to 2:

- **Accuracy:** does the message reflect confirmed state?
- **Actionability:** is the next step clear and safe?
- **Specificity:** does it name the task or field?
- **Accessibility:** is it associated and announced appropriately?
- **Consistency:** does it follow the product's tone and vocabulary?
- **Resilience:** does it handle retry, repeated submission, and unknown outcomes?
- **Privacy:** does it avoid exposing sensitive information?
- **Recovery:** can the user return to a valid state without losing work?

A strong solution scores at least 13 out of 16 and has no critical safety error involving payments, permissions, secrets, or data loss.

---

# 8. Definition of Done

An error-message system is ready for production when all of the following are true:

- [ ] Each known failure category has specific, approved user-facing copy.
- [ ] The message distinguishes confirmed failure from an unknown outcome.
- [ ] Every recoverable error offers a safe, realistic next step.
- [ ] Retry behavior accounts for duplicate and irreversible operations.
- [ ] Form inputs are preserved when safe and technically possible.
- [ ] Sensitive values are not retained or exposed inappropriately.
- [ ] Inline errors are connected to their fields with accessible relationships.
- [ ] Submission-level errors are announced without overwhelming assistive technology.
- [ ] Long forms provide a useful summary with links to affected fields.
- [ ] Error text does not rely on color alone.
- [ ] Empty states are not used to disguise failed data retrieval.
- [ ] Buttons describe the recovery action accurately.
- [ ] Claims about saved, uploaded, deleted, or paid states are evidence-backed.
- [ ] Technical diagnostics are separated from user-facing copy.
- [ ] Logs and support references follow privacy and redaction rules.
- [ ] The interface remains usable on narrow screens and at high zoom.
- [ ] Keyboard focus remains predictable after validation and submission.
- [ ] Screen-reader behavior is tested with representative failure states.
- [ ] Engineers can map application states to the corresponding message variants.
- [ ] Copy is reviewed alongside the actual interaction and backend behavior.
- [ ] Repeated errors are tracked so prevention improvements can be prioritized.

## Final Review Questions

Before shipping, ask:

1. Could a user misinterpret this message and take a harmful action?
2. Does the message claim more than the system knows?
3. Is the next step possible in the current state?
4. Will the user lose work if they follow the instruction?
5. Can a keyboard or screen-reader user find and understand the error?
6. Is this truly an error, or is it an empty, loading, or informational state?
7. Can support use the diagnostic reference without seeing private data?
8. Does the message help prevent the same error from recurring?

If any answer reveals uncertainty, fix the state model or recovery behavior before polishing the wording.

---

## One-Sentence Rule

**An excellent error message is truthful about the failure, specific about the next step, safe about uncertainty, and accessible to the person who needs to recover.**
