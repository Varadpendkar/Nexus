# SKILL: form-design-validation

**Layer:** 15 — UI Components

**Goal:** Design and implement accessible, resilient forms with clear labels, appropriate input types, inline validation, server-side error handling, and a predictable submission experience.

---

## Why This Matters (Senior Perspective)

Forms are where interface design becomes a commitment: a user provides information, asks a system to act on it, and expects the result to be understandable. A form that looks polished but loses input, hides validation errors, or gives no indication that submission is in progress can undermine trust more quickly than a visually weak page. Senior engineers treat form design as a complete interaction contract, not a collection of fields. That contract includes what data is requested, why it is needed, how it is formatted, what is required, what happens when input is invalid, what happens when a server rejects the request, and how the user knows the operation succeeded.

The first decision is to choose native HTML semantics before reaching for custom components. Labels should be programmatically associated with controls. Required state should be clear. Inputs should use meaningful types such as `email`, `tel`, `url`, `date`, or `number` when those types fit the data. Related controls belong in `fieldset` and `legend`; instructions and errors should be connected using `aria-describedby`; and buttons must declare their type so an unrelated button does not submit the form accidentally. Native browser validation is useful, but it is not a replacement for server validation or thoughtful error messages. Client-side validation improves feedback; server-side validation protects data integrity and security.

Validation should help a user recover, not punish them for making a mistake. An error message should identify the field, describe the problem in plain language, and tell the user how to fix it. Avoid showing errors before the user has had a reasonable opportunity to enter information, and do not rely on color alone. For long forms, summarize errors near the top and provide links to the relevant fields. On failed submission, focus management should move attention to the summary or first invalid field in a deliberate way. If the server rejects a request, preserve the user's entered values wherever it is safe to do so.

Form state becomes more complex when there are asynchronous checks, multi-step flows, file uploads, dependent fields, autosave, or optimistic UI. An email availability check can return after the user has already typed a newer value; a submit button can be clicked twice; a network error can leave the user unsure whether an operation happened; and a disabled control can accidentally be omitted from the submitted payload. Model states explicitly: idle, editing, validating, submitting, success, and failure are often enough for a simple form. Ensure stale asynchronous responses cannot overwrite newer results, prevent duplicate submissions, and distinguish validation errors from infrastructure failures.

The right amount of validation depends on context. A checkout form, account registration, support request, and internal admin form do not have identical risk. Do not demand data the product does not need, and do not expose detailed server internals in errors. Use autocomplete tokens for common personal information, make password requirements discoverable before submission, and ensure forms work with keyboard navigation, zoom, screen readers, mobile keyboards, and assistive technologies. If a field is conditional, make the relationship obvious and ensure hidden controls are not still treated as required. For a creative portfolio or freelance inquiry form, the goal is to reduce friction while collecting enough information to respond effectively. For high-impact forms, add deliberate confirmation, auditability, and safe recovery from failure.

---

## Core Concepts

### 1. Start with semantic form structure

**Explanation:** Use a real `form` element to group controls and define submission behavior. Use buttons for actions and labels for controls. Semantic HTML improves keyboard behavior, browser integration, and assistive-technology interpretation.

**Semantic HTML example:**

```html
<form action="/inquiries" method="post">
  <label for="full-name">Full name</label>
  <input id="full-name" name="fullName" autocomplete="name" required>
  <button type="submit">Send inquiry</button>
</form>
```

**Working CSS/JS example:**

```css
form { display: grid; gap: 1rem; max-width: 42rem; }
label { display: block; font-weight: 600; }
input, select, textarea, button { font: inherit; }
```

```js
document.querySelector("form").addEventListener("submit", event => {
  // Let the browser submit normally unless the app intentionally handles it.
  if (!event.currentTarget.reportValidity()) event.preventDefault();
});
```

**Naive vs. correct:** Naive: a set of styled `div` elements with click handlers. Correct: native form controls with explicit labels and a submit button.

**Gotcha:** A button inside a form defaults to submit in HTML unless `type="button"` is specified; declare button types deliberately.

### 2. Associate labels and help text

**Explanation:** Every control needs an accessible name. A visible `label` is usually best; placeholder text is only a hint and disappears when users type. Supplemental instructions and error messages should be programmatically associated with the field.

**Semantic HTML example:**

```html
<label for="project-email">Work email</label>
<input id="project-email" name="email" type="email"
       aria-describedby="email-help email-error">
<p id="email-help">Use an address where we can reach you.</p>
<p id="email-error" class="field-error" hidden></p>
```

**Working CSS/JS example:**

```css
.field-error { color: #b42318; font-size: .9rem; }
input[aria-invalid="true"] { border-color: #b42318; }
```

```js
function setFieldError(input, errorNode, message) {
  input.setAttribute("aria-invalid", "true");
  errorNode.textContent = message;
  errorNode.hidden = false;
}
```

**Naive vs. correct:** Naive: use “Email address” as the only placeholder. Correct: use a persistent label and connect helper/error text through `aria-describedby`.

**Gotcha:** Every `aria-describedby` ID must exist and be unique within the document; missing or duplicate IDs can make the association unreliable.

### 3. Choose suitable input types and autocomplete tokens

**Explanation:** Input types influence validation, mobile keyboard layout, and browser autofill. Use `email`, `tel`, `url`, `date`, and other types when they accurately represent the data. Use autocomplete tokens for common values to reduce effort.

**Semantic HTML example:**

```html
<label for="contact-email">Email</label>
<input id="contact-email" name="email" type="email" autocomplete="email" required>
<label for="phone">Phone</label>
<input id="phone" name="phone" type="tel" autocomplete="tel">
<label for="website">Website</label>
<input id="website" name="website" type="url" autocomplete="url">
```

**Working CSS/JS example:**

```js
const email = document.querySelector('input[type="email"]');
email.addEventListener("input", () => {
  email.setCustomValidity("");
});
```

```html
<label for="birth-date">Date</label>
<input id="birth-date" name="date" type="date">
```

**Naive vs. correct:** Naive: use `type="text"` for every field. Correct: select the type that matches the expected value and add the appropriate `autocomplete` token.

**Gotcha:** Browser support and formatting vary for date and number inputs; do not assume every user sees the same visual control.

### 4. Make required and optional fields clear

**Explanation:** Required state should be communicated in visible text and reflected in HTML. If most fields are required, label the optional fields; if only a few are required, mark those clearly. Do not rely on a red asterisk without an explanation.

**Semantic HTML example:**

```html
<form>
  <p>Fields marked “Required” must be completed.</p>
  <label for="company">Company <span>(Optional)</span></label>
  <input id="company" name="company">
  <label for="topic">Project topic <span>(Required)</span></label>
  <input id="topic" name="topic" required>
</form>
```

**Working CSS/JS example:**

```css
[aria-required="true"], :required { scroll-margin-block: 6rem; }
.optional-label { color: #626b78; font-size: .875rem; }
```

```js
const requiredFields = [...document.querySelectorAll("form [required]")];
requiredFields.forEach(field => field.setAttribute("aria-required", "true"));
```

The native `required` attribute already communicates requiredness; redundant ARIA is usually unnecessary, so keep the example's extra attribute only when a custom component specifically needs it.

**Naive vs. correct:** Naive: users must guess whether an unmarked field is mandatory. Correct: define a consistent required/optional convention and use native constraints.

**Gotcha:** A disabled required field is not validated like an enabled field; conditional forms must update requiredness when visibility changes.

### 5. Use fieldsets and legends for related controls

**Explanation:** `fieldset` and `legend` group related controls, especially radio buttons and checkboxes. A group-level question should be available to screen-reader users as they move through its options.

**Semantic HTML example:**

```html
<fieldset>
  <legend>How should we contact you?</legend>
  <label><input type="radio" name="contactMethod" value="email" required> Email</label>
  <label><input type="radio" name="contactMethod" value="phone"> Phone</label>
</fieldset>
```

**Working CSS/JS example:**

```css
fieldset { border: 1px solid #c8ced8; padding: 1rem; border-radius: .5rem; }
fieldset label { display: flex; align-items: center; gap: .5rem; }
```

```js
const methods = document.querySelectorAll('input[name="contactMethod"]');
methods.forEach(input => input.addEventListener("change", () => {
  document.querySelector("#contact-summary").textContent = `Selected: ${input.value}`;
}));
```

```html
<p id="contact-summary" aria-live="polite"></p>
```

**Naive vs. correct:** Naive: display a question above a set of ungrouped radios. Correct: use `fieldset` with a meaningful `legend`.

**Gotcha:** Do not use `fieldset` for unrelated controls merely to get a border; its group semantics should match the relationship.

### 6. Validate at the right time

**Explanation:** Validation can occur while typing, on blur, and on submit. Each timing choice has tradeoffs. Avoid flashing errors on an untouched field, but do not delay critical feedback until after a user has completed a long form.

**Semantic HTML example:**

```html
<label for="project-name">Project name</label>
<input id="project-name" name="projectName" required minlength="3">
<p id="project-name-error" hidden></p>
```

**Working CSS/JS example:**

```js
const nameField = document.querySelector("#project-name");
const nameError = document.querySelector("#project-name-error");
let nameTouched = false;
nameField.addEventListener("blur", () => {
  nameTouched = true;
  validateName();
});
nameField.addEventListener("input", () => {
  if (nameTouched) validateName();
});
function validateName() {
  const invalid = !nameField.checkValidity();
  nameField.setAttribute("aria-invalid", String(invalid));
  nameError.hidden = !invalid;
  nameError.textContent = invalid ? "Enter at least 3 characters." : "";
}
```

**Naive vs. correct:** Naive: show red errors on every empty field immediately at page load. Correct: validate on submit and use touched state for earlier corrective feedback.

**Gotcha:** If custom validation differs from native constraints, the browser may block submission before your custom error summary runs; coordinate `checkValidity`, `reportValidity`, and custom messages.

### 7. Write actionable, field-specific errors

**Explanation:** An error should say what went wrong and what the user can do next. “Invalid input” is vague; “Enter an email address in the format name@example.com” is more useful. Avoid blaming language and avoid exposing backend internals.

**Semantic HTML example:**

```html
<label for="budget">Estimated budget</label>
<input id="budget" name="budget" type="number" min="1000" step="500"
       aria-describedby="budget-help budget-error">
<p id="budget-help">Enter an amount in rupees.</p>
<p id="budget-error" role="alert" hidden></p>
```

**Working CSS/JS example:**

```js
function showBudgetError(input, error, message) {
  input.setAttribute("aria-invalid", "true");
  error.textContent = message;
  error.hidden = false;
}
function clearBudgetError(input, error) {
  input.removeAttribute("aria-invalid");
  error.textContent = "";
  error.hidden = true;
}
```

```js
if (Number(budget.value) < 1000) {
  showBudgetError(budget, budgetError, "Enter a budget of at least ₹1,000.");
}
```

**Naive vs. correct:** Naive: “Something went wrong.” Correct: identify the field, explain the constraint, and state the next action.

**Gotcha:** Do not put a large, changing form-wide error into an assertive live region on every keystroke; announcements can become noisy.

### 8. Build an error summary for long forms

**Explanation:** A summary helps users recover when a form contains many fields. It should appear near the start of the form, explain the number or nature of errors, and link to each invalid control. Focus it after failed submission when that is the clearest recovery path.

**Semantic HTML example:**

```html
<div id="form-errors" tabindex="-1" hidden>
  <h2>Check the following fields</h2>
  <ul id="form-error-list"></ul>
</div>
```

**Working CSS/JS example:**

```js
function showErrorSummary(summary, list, errors) {
  list.replaceChildren();
  errors.forEach(({ input, message }) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${input.id}`;
    link.textContent = `${input.labels?.[0]?.textContent || input.name}: ${message}`;
    item.append(link);
    list.append(item);
  });
  summary.hidden = errors.length === 0;
  if (errors.length) summary.focus();
}
```

```js
document.querySelector("#form-errors").addEventListener("click", event => {
  if (event.target.matches("a")) {
    const target = document.querySelector(event.target.getAttribute("href"));
    target?.focus();
  }
});
```

**Naive vs. correct:** Naive: place one generic error at the bottom of a long form. Correct: summarize errors near the top and link to each relevant field.

**Gotcha:** If the summary is rebuilt, preserve meaningful focus behavior and avoid creating links to missing or duplicate IDs.

### 9. Keep client and server validation aligned

**Explanation:** Client validation improves usability but can be bypassed. The server must validate all untrusted input independently. The client should translate known server field errors into field-level messages and distinguish them from general request failures.

**Semantic HTML example:**

```html
<form id="signup-form">
  <label for="signup-email">Email</label>
  <input id="signup-email" name="email" type="email" required>
  <p id="signup-email-error" hidden></p>
  <p id="form-server-error" role="alert" hidden></p>
  <button type="submit">Create account</button>
</form>
```

**Working CSS/JS example:**

```js
async function submitSignup(payload) {
  const response = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 422) return { kind: "validation", errors: body.errors || {} };
  if (!response.ok) return { kind: "failure", message: "We could not submit the form. Try again." };
  return { kind: "success", data: body };
}
```

```js
// Never treat client-side validation as an authorization or security boundary.
const result = await submitSignup({ email: emailInput.value });
```

**Naive vs. correct:** Naive: trust that the browser's `required` attribute protects the API. Correct: validate at the server boundary and present safe, understandable responses in the client.

**Gotcha:** Server field names and client IDs often differ; use an explicit mapping rather than constructing selectors from arbitrary server strings.

### 10. Prevent duplicate submission and represent progress

**Explanation:** A slow request can tempt users to click submit repeatedly. Model submission as a state, disable or guard duplicate attempts, and communicate progress without destroying the user's context. Restore the action when a retry is safe.

**Semantic HTML example:**

```html
<form id="inquiry-form">
  <label for="inquiry-message">How can we help?</label>
  <textarea id="inquiry-message" name="message" required></textarea>
  <button type="submit" id="submit-inquiry">Send inquiry</button>
  <p id="submit-status" role="status" aria-live="polite"></p>
</form>
```

**Working CSS/JS example:**

```js
let submitting = false;
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (submitting || !form.reportValidity()) return;
  submitting = true;
  submitButton.disabled = true;
  status.textContent = "Sending your inquiry…";
  try {
    await sendInquiry(new FormData(form));
    status.textContent = "Your inquiry was sent.";
  } catch {
    status.textContent = "We couldn't send it. Your entries are still here; try again.";
  } finally {
    submitting = false;
    submitButton.disabled = false;
  }
});
```

**Naive vs. correct:** Naive: allow every click to launch a request. Correct: guard submission and expose progress, success, and failure states.

**Gotcha:** Disabling the submit button is not enough if the submit handler can be triggered programmatically; retain a state guard in the handler itself.

### 11. Handle asynchronous validation without stale responses

**Explanation:** Availability checks and remote suggestions may resolve out of order. A result for an old value must not overwrite feedback for the current value. Debounce requests when appropriate and use `AbortController` or a request sequence token.

**Semantic HTML example:**

```html
<label for="username">Username</label>
<input id="username" name="username" autocomplete="username" aria-describedby="username-status">
<p id="username-status" role="status" aria-live="polite"></p>
```

**Working CSS/JS example:**

```js
let checkVersion = 0;
async function checkUsername(value) {
  const version = ++checkVersion;
  usernameStatus.textContent = "Checking availability…";
  const result = await fetchUsernameAvailability(value);
  if (version !== checkVersion) return;
  usernameStatus.textContent = result.available ? "Username is available." : "That username is taken.";
}
```

```js
usernameInput.addEventListener("change", () => {
  const value = usernameInput.value.trim();
  if (value) checkUsername(value);
});
```

**Naive vs. correct:** Naive: every response writes to the same status node regardless of request order. Correct: cancel or ignore stale requests.

**Gotcha:** A request sequence protects UI state but does not replace server-side uniqueness checks at final submission.

### 12. Treat file uploads as a separate interaction

**Explanation:** File inputs need constraints, progress feedback, and error recovery. The client can check size and declared type for immediate guidance, but the server must inspect uploaded content and enforce limits. Do not assume the filename or MIME type supplied by the browser is trustworthy.

**Semantic HTML example:**

```html
<label for="brief-file">Project brief (PDF, up to 10 MB)</label>
<input id="brief-file" name="brief" type="file" accept=".pdf,application/pdf">
<p id="file-status" role="status" aria-live="polite"></p>
```

**Working CSS/JS example:**

```js
fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    fileStatus.textContent = "Choose a file smaller than 10 MB.";
    fileInput.value = "";
    return;
  }
  fileStatus.textContent = `${file.name} selected (${Math.ceil(file.size / 1024)} KB).`;
});
```

```js
// Server-side validation is still required for file size, content, and authorization.
```

**Naive vs. correct:** Naive: trust `accept=".pdf"` as a security guarantee. Correct: use it as a chooser hint and validate the actual upload on the server.

**Gotcha:** Do not display an untrusted filename as raw HTML; assign it with `textContent` to avoid interpreting markup.

### 13. Design conditional and multi-step forms deliberately

**Explanation:** Conditional fields should appear only when relevant and should not remain required while hidden. Multi-step forms need clear progress, preservation of entered values, and validation at step boundaries as well as final submission.

**Semantic HTML example:**

```html
<label for="has-company">Do you represent a company?</label>
<select id="has-company" name="hasCompany">
  <option value="no">No</option>
  <option value="yes">Yes</option>
</select>
<div id="company-fields" hidden>
  <label for="company-name">Company name</label>
  <input id="company-name" name="companyName">
</div>
```

**Working CSS/JS example:**

```js
const companySelect = document.querySelector("#has-company");
const companyFields = document.querySelector("#company-fields");
const companyName = document.querySelector("#company-name");
function syncCompanyFields() {
  const visible = companySelect.value === "yes";
  companyFields.hidden = !visible;
  companyName.required = visible;
  if (!visible) companyName.setCustomValidity("");
}
companySelect.addEventListener("change", syncCompanyFields);
syncCompanyFields();
```

```js
function goToStep(step) {
  if (!validateCurrentStep()) return;
  saveStepValues();
  renderStep(step);
  document.querySelector("[data-step-heading]")?.focus();
}
```

**Naive vs. correct:** Naive: hide a field visually but leave it required and focusable. Correct: synchronize visibility, requiredness, and submission data.

**Gotcha:** If hidden values should not be submitted, explicitly clear or exclude them according to product rules; do not silently discard data users may expect to retain.

### 14. Preserve user input and recover from network failure

**Explanation:** When submission fails, the default should usually be to preserve the user's work. Distinguish validation errors, authentication failures, network failures, and successful completion. For actions that may have succeeded despite a lost response, avoid blindly repeating a non-idempotent operation.

**Semantic HTML example:**

```html
<form id="contact-form">
  <label for="contact-message">Message</label>
  <textarea id="contact-message" name="message" required></textarea>
  <p id="network-status" role="status" aria-live="polite"></p>
  <button type="submit">Send message</button>
</form>
```

**Working CSS/JS example:**

```js
try {
  await sendContact(new FormData(contactForm));
  contactForm.reset();
  networkStatus.textContent = "Message sent successfully.";
} catch (error) {
  // Preserve the values; do not reset on failure.
  networkStatus.textContent = "We couldn't confirm delivery. Your message remains here.";
}
```

```js
function setSubmitting(form, busy) {
  form.setAttribute("aria-busy", String(busy));
  form.querySelector('[type="submit"]').disabled = busy;
}
```

**Naive vs. correct:** Naive: clear the form before the request finishes. Correct: clear only after confirmed success and preserve recoverable state after failure.

**Gotcha:** If the server might have completed an action but the response was lost, communicate uncertainty and use an idempotency key or status lookup where appropriate.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Accessible field with help and error text

**What it does:** Connects a visible label, helper text, and field-specific error to one control.

**When to use it:** Any form field with formatting guidance, constraints, or custom validation feedback.

**Complete copy-pasteable code:**

```html
<div class="field">
  <label for="work-email">Work email</label>
  <input id="work-email" name="email" type="email" autocomplete="email"
         required aria-describedby="work-email-help work-email-error">
  <p id="work-email-help">We will use this address to reply to your inquiry.</p>
  <p id="work-email-error" class="error" hidden></p>
</div>
<style>
.field { display: grid; gap: .4rem; margin-block: 1rem; }
.field input { font: inherit; padding: .7rem; border: 1px solid #87909e; border-radius: .4rem; }
.error { color: #b42318; }
input[aria-invalid="true"] { border-color: #b42318; }
</style>
<script>
const emailField = document.querySelector("#work-email");
const emailError = document.querySelector("#work-email-error");
emailField.addEventListener("blur", () => {
  const message = emailField.validity.valueMissing ? "Enter your email address."
    : emailField.validity.typeMismatch ? "Enter an email address such as name@example.com." : "";
  emailField.setAttribute("aria-invalid", String(Boolean(message)));
  emailError.textContent = message;
  emailError.hidden = !message;
});
</script>
```

**Nuance / edge case:** When an error clears, remove or update `aria-invalid` and make sure the error node remains referenced only if it exists.

### Pattern 2: Error summary with links to invalid fields

**What it does:** Provides a central recovery point for long forms and directs users to each field that needs attention.

**When to use it:** Registration, onboarding, applications, checkout, and multi-section forms where several errors can occur at once.

**Complete copy-pasteable code:**

```html
<form id="brief-form" novalidate>
  <div id="brief-errors" tabindex="-1" hidden>
    <h2>There are problems with your submission</h2>
    <ul></ul>
  </div>
  <label for="brief-name">Name</label>
  <input id="brief-name" name="name" required>
  <label for="brief-email">Email</label>
  <input id="brief-email" name="email" type="email" required>
  <button type="submit">Submit</button>
</form>
<script>
const briefForm = document.querySelector("#brief-form");
const summary = document.querySelector("#brief-errors");
briefForm.addEventListener("submit", event => {
  event.preventDefault();
  const fields = [...briefForm.querySelectorAll("input")];
  const invalid = fields.filter(field => !field.checkValidity());
  const list = summary.querySelector("ul");
  list.replaceChildren();
  invalid.forEach(field => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${field.id}`;
    link.textContent = `${field.labels[0].textContent}: ${field.validationMessage}`;
    item.append(link);
    list.append(item);
  });
  summary.hidden = invalid.length === 0;
  if (invalid.length) summary.focus();
});
</script>
```

**Nuance / edge case:** This pattern uses native constraint messages, which vary by browser language. For a consistent product voice, map known validity states to your own concise messages.

### Pattern 3: Submission state with duplicate-request guard

**What it does:** Blocks repeated submit attempts while an operation is in progress and exposes the current state to users.

**When to use it:** Contact forms, account creation, checkout, and any form that triggers a network mutation.

**Complete copy-pasteable code:**

```html
<form id="request-form">
  <label for="request-detail">Request details</label>
  <textarea id="request-detail" name="detail" required></textarea>
  <button type="submit">Send request</button>
  <p id="request-status" role="status" aria-live="polite"></p>
</form>
<script>
const requestForm = document.querySelector("#request-form");
const requestButton = requestForm.querySelector('[type="submit"]');
const requestStatus = document.querySelector("#request-status");
let inFlight = false;
requestForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (inFlight || !requestForm.reportValidity()) return;
  inFlight = true;
  requestButton.disabled = true;
  requestForm.setAttribute("aria-busy", "true");
  requestStatus.textContent = "Sending…";
  try {
    const response = await fetch("/api/requests", {
      method: "POST",
      body: new FormData(requestForm)
    });
    if (!response.ok) throw new Error("Request failed");
    requestStatus.textContent = "Request sent.";
    requestForm.reset();
  } catch {
    requestStatus.textContent = "Unable to send. Your entries are still available; please retry.";
  } finally {
    inFlight = false;
    requestButton.disabled = false;
    requestForm.setAttribute("aria-busy", "false");
  }
});
</script>
```

**Nuance / edge case:** For a non-idempotent operation, the server should support idempotency or duplicate detection; a client guard alone cannot guarantee exactly-once processing.

### Pattern 4: Server field errors mapped to controls

**What it does:** Converts a structured validation response into safe field-level feedback without trusting server-provided selectors or HTML.

**When to use it:** Forms backed by APIs that return errors such as “email already registered” or “budget is outside the permitted range.”

**Complete copy-pasteable code:**

```html
<form id="api-form">
  <label for="api-email">Email</label>
  <input id="api-email" name="email" type="email">
  <p id="api-email-error" hidden></p>
  <label for="api-budget">Budget</label>
  <input id="api-budget" name="budget" type="number">
  <p id="api-budget-error" hidden></p>
</form>
<script>
const fieldMap = {
  email: { input: document.querySelector("#api-email"), error: document.querySelector("#api-email-error") },
  budget: { input: document.querySelector("#api-budget"), error: document.querySelector("#api-budget-error") }
};
function applyServerErrors(errors) {
  Object.values(fieldMap).forEach(({ input, error }) => {
    input.removeAttribute("aria-invalid");
    error.textContent = "";
    error.hidden = true;
  });
  for (const [name, message] of Object.entries(errors)) {
    const field = fieldMap[name];
    if (!field || typeof message !== "string") continue;
    field.input.setAttribute("aria-invalid", "true");
    field.error.textContent = message;
    field.error.hidden = false;
  }
}
</script>
```

**Nuance / edge case:** Validate the response shape and keep messages as text; never inject server-provided strings using `innerHTML`.

### Pattern 5: Conditional field group

**What it does:** Shows a related group only when a user's answer makes it relevant and synchronizes requiredness.

**When to use it:** Company details, shipping address, alternate contact method, and other conditional branches.

**Complete copy-pasteable code:**

```html
<label for="business-type">Are you contacting us for a business?</label>
<select id="business-type" name="businessType">
  <option value="personal">Personal</option>
  <option value="business">Business</option>
</select>
<fieldset id="business-details" hidden>
  <legend>Business details</legend>
  <label for="business-name">Business name</label>
  <input id="business-name" name="businessName">
</fieldset>
<script>
const businessType = document.querySelector("#business-type");
const businessDetails = document.querySelector("#business-details");
const businessName = document.querySelector("#business-name");
function updateBusinessFields() {
  const show = businessType.value === "business";
  businessDetails.hidden = !show;
  businessName.required = show;
  if (!show) businessName.setCustomValidity("");
}
businessType.addEventListener("change", updateBusinessFields);
updateBusinessFields();
</script>
```

**Nuance / edge case:** Decide whether switching a branch off should clear its values. The correct behavior depends on whether the user may switch back and expect their entries to remain.

### Pattern 6: File input with client-side size guidance

**What it does:** Gives immediate feedback when a selected file exceeds the stated size limit.

**When to use it:** Inquiry forms that accept briefs, screenshots, or supporting documents.

**Complete copy-pasteable code:**

```html
<label for="attachment">Attach a brief (maximum 10 MB)</label>
<input id="attachment" name="attachment" type="file" accept=".pdf,.doc,.docx">
<p id="attachment-status" role="status" aria-live="polite"></p>
<script>
const attachment = document.querySelector("#attachment");
const attachmentStatus = document.querySelector("#attachment-status");
attachment.addEventListener("change", () => {
  const file = attachment.files?.[0];
  if (!file) { attachmentStatus.textContent = ""; return; }
  if (file.size > 10 * 1024 * 1024) {
    attachmentStatus.textContent = "This file is larger than 10 MB. Choose a smaller file.";
    attachment.value = "";
    return;
  }
  attachmentStatus.textContent = `${file.name} selected.`;
});
</script>
```

**Nuance / edge case:** The client-side size check is convenience only. The server must enforce the limit and validate content type, file signature, and authorization.

### Pattern 7: Multi-step form with step-boundary validation

**What it does:** Divides a long workflow into smaller steps while retaining entered values and validating before advancing.

**When to use it:** Project briefs, onboarding, applications, and structured intake forms with logically distinct sections.

**Complete copy-pasteable code:**

```html
<form id="steps-form">
  <section data-step="0" aria-labelledby="step-one-title">
    <h2 id="step-one-title" tabindex="-1">1. Contact details</h2>
    <label for="step-name">Name</label>
    <input id="step-name" name="name" required>
    <button type="button" data-next>Continue</button>
  </section>
  <section data-step="1" aria-labelledby="step-two-title" hidden>
    <h2 id="step-two-title" tabindex="-1">2. Project details</h2>
    <label for="step-goal">Project goal</label>
    <textarea id="step-goal" name="goal" required></textarea>
    <button type="button" data-back>Back</button>
    <button type="submit">Submit brief</button>
  </section>
</form>
<script>
const stepsForm = document.querySelector("#steps-form");
const steps = [...stepsForm.querySelectorAll("[data-step]")];
function showStep(index) {
  steps.forEach((step, i) => step.hidden = i !== index);
  steps[index].querySelector("h2").focus();
}
stepsForm.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", () => {
  const fields = [...steps[0].querySelectorAll("input, select, textarea")];
  if (fields.every(field => field.checkValidity())) showStep(1);
  else fields.find(field => !field.checkValidity())?.reportValidity();
}));
stepsForm.querySelector("[data-back]").addEventListener("click", () => showStep(0));
</script>
```

**Nuance / edge case:** Validate all steps again on final submission, including server-side rules. A step-level check is not a substitute for final validation.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using placeholders as labels | The design emphasizes a minimal field appearance. | Add a persistent `label` and keep placeholder text supplemental. |
| Omitting `name` attributes | Developers test visual behavior without inspecting submitted payloads. | Give every submitted control a stable `name` that matches the API contract. |
| Using `type="text"` for every value | Input types are treated as styling choices only. | Select a semantic type and suitable autocomplete token for each field. |
| Showing errors on every untouched field at page load | Validation is triggered before the user has context to act. | Validate on submit and use touched state for earlier feedback. |
| Relying only on client-side validation | Browser constraints are mistaken for a security boundary. | Validate all untrusted input on the server and map safe errors back to fields. |
| Using vague error text | Error messages describe system failure rather than user recovery. | State the specific problem and the next corrective action. |
| Indicating errors only with color | Visual styling is used as the only signal. | Add text feedback, `aria-invalid`, and a programmatic association. |
| Failing to focus an error summary | The summary appears but keyboard users remain elsewhere. | Focus the summary or first invalid field after a failed submission. |
| Building error links from untrusted strings | Dynamic selectors are assembled without a known mapping. | Use a fixed field map and validate the response structure. |
| Allowing duplicate submit requests | The UI has no in-flight state guard. | Guard the handler, show progress, and use server idempotency where needed. |
| Clearing values before confirmed success | Reset behavior is tied to button activation rather than completion. | Preserve values on failure and clear only after confirmed success. |
| Treating disabled controls as submitted values | Disabled UI state is confused with payload inclusion. | Use `readonly` where appropriate or explicitly include the intended value in the payload. |
| Leaving hidden conditional fields required | Visual visibility and validation rules are managed separately. | Synchronize `hidden`, `required`, and payload inclusion. |
| Trusting file extensions or `accept` as security | File chooser filtering is mistaken for server verification. | Validate file size, content, signature, and authorization on the server. |
| Letting stale async checks overwrite newer feedback | Responses are applied in arrival order, not request order. | Abort obsolete requests or use a monotonically increasing request token. |
| Making a form impossible to submit without JavaScript | The application assumes scripts always load and run. | Use a valid server form action where progressive enhancement is appropriate. |
| Using a generic `div` for a related radio group | Grouping is treated as a visual-only concern. | Use `fieldset` and `legend` for semantically related controls. |
| Hiding server errors in the console | Developer diagnostics are mistaken for user feedback. | Show a safe message in the UI and log technical details separately. |
| Resetting the submit button before state is settled | UI cleanup occurs in several branches and becomes inconsistent. | Centralize busy-state cleanup in `finally` and represent success separately. |
| Using unstable or duplicate IDs | Components are copied without unique ID generation. | Generate unique IDs per instance and keep label/error references synchronized. |

### Before/after: label and error association

**Before — the placeholder disappears:**

```html
<input type="email" placeholder="Email address">
```

**After — persistent name and linked error:**

```html
<label for="email-address">Email address</label>
<input id="email-address" type="email" aria-describedby="email-error">
<p id="email-error" hidden></p>
```

### Before/after: submission recovery

**Before — the user loses work on failure:**

```js
form.reset();
await sendForm(new FormData(form));
```

**After — preserve values until success is confirmed:**

```js
const payload = new FormData(form);
await sendForm(payload);
form.reset(); // Only after confirmed success.
```

---

## Mental Models

1. **A form is a contract:** Every field, constraint, error, and submission state communicates what the system expects and what the user can do next.
2. **Labels name; placeholders hint:** A placeholder cannot replace a persistent accessible name.
3. **Client validation guides; server validation protects:** Browser feedback improves usability but never establishes trust in submitted data.
4. **Errors are recovery instructions:** A good message names the problem and the next action without blaming the user.
5. **Submission is a state machine:** Idle, validating, submitting, success, and failure are distinct states with distinct behavior.
6. **Preserve work by default:** Do not clear user input until success is confirmed or the user explicitly chooses to reset.
7. **Async results can become stale:** The most recent response is not necessarily the response for the most recent value.
8. **Hidden is not the same as inactive:** Conditional fields must leave validation and interaction flow when they are not relevant.
9. **Native HTML reduces custom failure modes:** Prefer built-in controls unless a real product requirement justifies custom behavior.
10. **Security lives at the boundary:** The server must revalidate data, enforce permissions, and treat files and values as untrusted.

---

## Quick Reference

| Requirement | Recommended approach | Verify |
|---|---|---|
| Name a field | Visible `<label for>` linked to a unique ID | Clicking the label focuses the control |
| Add instructions | Connect helper text with `aria-describedby` | Screen reader can discover the guidance |
| Show validation errors | Field-specific text plus `aria-invalid` | Error explains a correction |
| Mark required fields | Native `required` and visible convention | Requiredness is not communicated by color alone |
| Group radio/checkbox choices | `<fieldset>` and `<legend>` | Group question is announced with choices |
| Choose email/phone/URL input | Correct input type and autocomplete token | Mobile keyboard and autofill are helpful |
| Validate a long form | Error summary with field links | Summary receives focus after failure |
| Handle API validation | Map known server fields to known controls | No server string is injected as HTML |
| Prevent repeated submits | In-flight guard and busy status | Repeated activation launches no duplicate client request |
| Show progress | Status region and disabled submit action | User understands the request is underway |
| Recover from network failure | Preserve values and offer retry guidance | Failed request does not erase user work |
| Validate file upload | Client guidance plus server enforcement | Size and actual content are checked on server |
| Display conditional controls | Sync visibility, requiredness, and payload rules | Hidden fields do not block submission unexpectedly |
| Handle remote validation | Abort or ignore stale requests | Old responses cannot overwrite current feedback |
| Build multi-step flow | Validate at step boundaries and final submit | Back navigation preserves entries |
| Prevent duplicate IDs | Generate per-instance identifiers | Multiple form instances keep label links correct |
| Support keyboard users | Native controls and visible focus | Every action can be reached and activated without a pointer |
| Handle server failures safely | User-safe status text, technical logs separately | No internal stack trace or secret appears in the UI |

---

## Build Challenge

Build a **creative-agency project inquiry form** that collects contact information, project type, budget, timeframe, a project description, and an optional attachment. The form should minimize friction while still producing useful structured information for a team that will respond to the inquiry.

### Requirements

1. Use a semantic `form` element and native controls; define a real submission path or a clear API contract.
2. Provide a visible label for every input, select, textarea, and file control.
3. Use appropriate input types and autocomplete tokens for name, email, phone, website, and other applicable fields.
4. Group related radio buttons or checkboxes with `fieldset` and `legend`.
5. Establish a consistent required/optional convention and explain it to users.
6. Add helper text for fields where format, purpose, or privacy expectations may not be obvious.
7. Connect helper and error text with `aria-describedby` and unique IDs.
8. Implement field-level validation that does not overwhelm users before they have interacted with the form.
9. Use actionable error messages that explain the issue and how to correct it.
10. Add an error summary with links to invalid fields for submission failures involving multiple fields.
11. On failed submission, move focus to the summary or first invalid field in a deliberate and tested way.
12. Validate all data on the server and return a structured, safe response for field errors and general failures.
13. Map server errors through an explicit field map; do not build selectors from untrusted server values.
14. Guard against duplicate submission and provide a visible submitting state.
15. Preserve all entered values when validation or network submission fails.
16. Clear or reset the form only after success is confirmed.
17. Add one asynchronous validation check, such as project-code availability or email verification, and ignore stale results.
18. Include a conditional field group whose visibility and requiredness stay synchronized.
19. Include an optional file upload with clear size guidance and client-side feedback.
20. Treat file chooser restrictions as convenience only and enforce upload rules on the server.
21. Support keyboard-only completion with visible focus indicators and a logical tab order.
22. Test at a narrow mobile viewport and with browser zoom increased.
23. Ensure status messages communicate progress and completion without announcing every keystroke.
24. Handle network failure, server validation failure, and confirmed success as distinct states.
25. Verify IDs are unique when two instances of the form appear on the same page.
26. Include automated tests for validation helpers, server error mapping, and duplicate-submit protection.
27. Test empty, malformed, overly long, and out-of-range inputs.
28. Confirm the server never trusts client-supplied permissions or client-only validation.
29. Document the payload shape, validation rules, error response format, and retry behavior.
30. Add a short accessibility checklist and manual test record.

### Failure scenarios to inject

- Submit an empty form and verify errors are actionable and associated with the right fields.
- Return a server validation response for an email that already exists and verify the message appears next to the email field.
- Make the network request fail and verify all entered values remain available.
- Trigger two rapid submissions and verify the client prevents duplicate requests.
- Return an old asynchronous validation response after a newer one and verify it is ignored.
- Hide a conditional field group and verify its hidden required field no longer blocks submission.
- Select a file over the stated limit and verify immediate feedback, then test server-side rejection independently.
- Render two form instances and verify no label or error points to the other form's control.
- Return a malformed API error payload and verify the UI shows a safe general message rather than crashing.
- Simulate a request that may have succeeded but whose response was lost; verify the UI does not confidently claim failure or automatically repeat a non-idempotent action.

### Definition of done

- [ ] Every control has a persistent accessible name and unique ID.
- [ ] Helper and error text are programmatically associated with the relevant field.
- [ ] Requiredness is clear in text and enforced by both client and server rules.
- [ ] Validation timing supports recovery without flooding users with premature errors.
- [ ] Error summaries link to invalid fields and receive appropriate focus.
- [ ] Submission has distinct validating, submitting, success, and failure behavior.
- [ ] Duplicate activation is guarded in the client and safely handled at the server boundary.
- [ ] User input remains intact after validation and network errors.
- [ ] Conditional fields update visibility, requiredness, and payload behavior together.
- [ ] File validation is enforced by the server, not just the browser.
- [ ] Asynchronous results cannot overwrite newer form state.
- [ ] Keyboard, screen-reader, mobile, and zoom checks have been completed.
- [ ] IDs remain unique across multiple component instances.
- [ ] Tests cover malformed responses and uncertain network outcomes.
- [ ] Documentation explains the data contract, recovery path, and known limitations.

### Suggested test matrix

| Scenario | Action | Expected result |
|---|---|---|
| Empty submission | Submit without required values | Error summary and actionable field errors appear |
| Invalid email | Enter malformed email | Email field receives a useful message |
| Server validation | API returns a field error | Correct field is marked invalid and explains recovery |
| Network failure | Reject request | Values remain intact and retry is available |
| Duplicate activation | Submit twice quickly | Only one client request is initiated |
| Stale async result | Resolve older check after newer check | Current field status remains correct |
| Conditional field | Hide the related field group | Hidden field no longer blocks validation |
| Oversized file | Select file above limit | User gets immediate guidance and invalid selection is cleared |
| Duplicate instances | Render form twice | Labels and error descriptions point to matching controls |
| Unknown server error | Return unexpected payload | Safe general error appears without a runtime exception |
