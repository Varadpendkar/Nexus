# SKILL: ux-writing
**Layer:** 25 — Content Strategy
**Goal:** Write clear, inclusive, context-aware interface language that helps people understand what a product does, make informed choices, complete tasks, and recover from errors.

---

## Why This Matters (Senior Perspective)

UX writing is the language of a product at the exact moment a person is trying to do something. It includes button labels, field labels, helper text, navigation, onboarding, confirmations, notifications, empty states, validation, permissions, and failure messages. When this language is vague, the product can be technically functional yet operationally confusing. A visitor clicks “Continue” without knowing whether they are saving a draft or paying for an order. A customer enters a billing address into a field labelled “Address” and later discovers the field expected a shipping address. A user receives “Something went wrong” after a long form submission and has no idea whether their work was saved. These are not cosmetic copy problems: they create support tickets, abandoned tasks, duplicate submissions, incorrect data, and lost trust.

A beginner often treats interface text as the final layer after the screen has been designed. A senior UX writer starts with the user’s task, the system state, the information the user needs at that moment, and the consequences of acting. They ask what the product knows, what it cannot know, what action is possible, and what will happen next. They coordinate with design, engineering, product, accessibility, support, privacy, and legal stakeholders so that the interface’s promises match its actual behaviour. The same label must mean the same thing across similar screens, while different states—loading, success, partial failure, permission denied, offline, and expired session—must not be collapsed into one generic message. Good UX writing is systematic: it is designed, tested, maintained, and connected to the product’s state model.

This skill matters for portfolio sites, e-commerce flows, SaaS dashboards, mobile apps, and freelance product work because small strings have disproportionate influence. A button may be only two words, but it can determine whether someone understands a commitment. A form label may be visually minor, but it affects keyboard users, screen-reader users, translation, and data quality. A well-written empty state can help a first-time user begin; a poorly written one can make a product appear broken. In creative work, tone and personality still matter, but they must never obscure the task, hide a cost, blame the user, or make an inaccessible interface harder to use. The objective is not to make every screen sound clever. It is to make the next correct action understandable, safe, and achievable.

---

## Core Concepts

### 1. Start with the user’s task and context

UX writing begins by identifying what the person is trying to accomplish, what they already know, and what decision the interface asks them to make. “Manage your account” may be a useful page title, but it does not tell a person which action to take when they are trying to change a billing email. Task-oriented language makes the next step visible. Before writing, record the user goal, current state, expected outcome, and likely uncertainty. Then write the smallest amount of text that resolves the uncertainty without removing necessary context.

```html
<section aria-labelledby="billing-heading">
  <h1 id="billing-heading">Change billing email</h1>
  <p>Invoices and billing notices will be sent to this address.</p>
  <form action="/settings/billing-email" method="post">
    <label for="billing-email">Billing email address</label>
    <input id="billing-email" name="billingEmail" type="email" autocomplete="email" required>
    <button type="submit">Save billing email</button>
  </form>
</section>
```

The heading, explanation, label, and button all support the same task. The copy also reveals a consequence: future billing notices go to the updated address. The implementation must still confirm that the server actually saves the change and handle errors. A UX writer should not describe an action as complete merely because a button was clicked.

**Naive approach:** Use “Settings,” “Address,” and “Save” because the surrounding screen seems obvious to the designer.

**Correct approach:** Name the task and field specifically, then explain the consequence that could change the user’s decision.

**Gotcha:** A task that sounds simple may have a hidden consequence. Changing an email used for sign-in, billing, and notifications may require separate explanations and confirmation.

**Implementation example:**

```html
<p class="task-context">You can update this address without changing your sign-in email.</p>
```

### 2. Use plain language without losing precision

Plain language reduces the effort needed to understand a message. Prefer familiar verbs, concrete nouns, short sentences, and a clear order. Plain language does not mean oversimplifying technical concepts or removing important conditions. If a term has a specific meaning in the product, define it at first use and then use it consistently. Replace internal terminology with the language customers use unless the technical term is necessary for an informed decision.

```html
<section class="export-help" aria-labelledby="export-heading">
  <h2 id="export-heading">Export your report</h2>
  <p>Download a CSV file containing the records visible in this report.</p>
  <button type="button">Download CSV</button>
</section>
```

The explanation specifies the file format and the scope of the export. “Generate a portable data artifact” may sound sophisticated but creates unnecessary interpretation work. Plain language is especially important when users are tired, under time pressure, using a small screen, or working in a second language.

**Naive approach:** “Initiate the generation of a downloadable data artifact.”

**Correct approach:** “Download a CSV file.”

**Gotcha:** Shorter is not always clearer. “Reset” may be shorter than “Reset all filters,” but the longer label may be essential when several reset operations exist.

**Implementation example:**

```js
function sentenceCase(message) {
  return message.trim().replace(/^\w/, (first) => first.toUpperCase());
}
```

### 3. Write labels that remain understandable out of context

Labels should tell people what a control represents, not merely look tidy inside a visual layout. A field label needs to remain meaningful after the user enters a value, when a screen reader announces it, and when a validation error points back to it. A placeholder is temporary example text, not a persistent label. Buttons should name the action and, where necessary, its object or consequence.

```html
<form action="/profile" method="post">
  <label for="display-name">Display name</label>
  <input id="display-name" name="displayName" autocomplete="nickname" required>
  <label for="public-profile">
    <input id="public-profile" name="publicProfile" type="checkbox">
    Make my profile visible to other members
  </label>
  <button type="submit">Save profile changes</button>
</form>
```

The labels communicate the field’s meaning and the checkbox’s consequence. The button is more informative than “Go.” Use consistent terminology for the same concept throughout the product; switching between “workspace,” “team space,” and “project area” without a meaningful distinction creates uncertainty.

**Naive approach:** Use placeholder text such as “Name” without a visible label, then rely on the user to remember what the field means.

**Correct approach:** Use a persistent `<label>` and reserve placeholders for examples such as `name@example.com`.

**Gotcha:** A label that is visually nearby is not automatically programmatically associated with an input. Use a matching `for` and `id`, or correctly nest the input inside the label.

**Implementation example:**

```html
<label for="company-site">Company website</label>
<input id="company-site" name="companySite" type="url" autocomplete="url">
```

### 4. Make actions and consequences explicit

An action label should describe what happens when the control is activated. “Continue” can be appropriate in a clearly structured multi-step flow, but it is weak when the user is making a consequential choice. “Pay ₹1,499,” “Send invitation,” and “Delete project” expose different commitments. Where the action is destructive or irreversible, name the object and explain the consequence before activation. Avoid labels that promise an outcome the system cannot guarantee.

```html
<section aria-labelledby="delete-heading">
  <h2 id="delete-heading">Delete this project?</h2>
  <p>Deleting the project removes its tasks and shared notes for every member. This cannot be undone.</p>
  <button type="button">Keep project</button>
  <button type="button">Delete project</button>
</section>
```

The text explains the consequence, and the action labels are distinguishable. The example is a confirmation pattern; in a real product, the dialog needs correct focus management, keyboard behaviour, and an accessible name. The default or visually prominent action should not accidentally encourage an irreversible action.

**Naive approach:** Use “OK” for both cancellation and deletion.

**Correct approach:** Name each outcome, such as “Keep project” and “Delete project.”

**Gotcha:** Do not add a confirmation dialog to every routine action. Unnecessary confirmation creates friction and trains people to dismiss warnings without reading them.

**Implementation example:**

```html
<button type="button" aria-describedby="delete-warning">Delete workspace</button>
<p id="delete-warning">All workspace members will lose access.</p>
```

### 5. Design helper text for the moment of need

Helper text explains a requirement, format, consequence, or decision that cannot be communicated by the label alone. It should be close to the relevant control and specific enough to change the user’s next action. Avoid repeating the label in a longer sentence. If a rule is predictable and important—such as an upload size limit—state it before the user chooses a file, not only after a failed upload.

```html
<div class="upload-field">
  <label for="brand-file">Brand guidelines</label>
  <p id="brand-file-help">Upload a PDF up to 10 MB. You can skip this if you do not have a file.</p>
  <input id="brand-file" name="brandFile" type="file" accept="application/pdf" aria-describedby="brand-file-help">
</div>
```

The helper text provides format, size, and an optionality note. The `accept` attribute can guide the file picker but does not replace server-side validation. In production, the server must check file type and size safely.

**Naive approach:** Show “Invalid file” only after a user spends time selecting and uploading a large unsupported file.

**Correct approach:** Explain accepted types and limits beside the input before selection, then provide a specific error if validation still fails.

**Gotcha:** Helper text can be missed if it is too faint, too far away, or announced in an unexpected order. Verify contrast, layout, and screen-reader association.

**Implementation example:**

```html
<p id="password-help">Use at least 12 characters. A passphrase is fine.</p>
<input id="new-password" type="password" aria-describedby="password-help">
```

### 6. Treat errors as part of the task flow

An error message should answer three questions where possible: what happened, what the user can do, and whether their work was preserved. “Something went wrong” may be an honest fallback for an unknown failure, but it should not be the entire recovery design. Distinguish invalid input, permission problems, unavailable services, network failures, conflicts, and expired sessions. Each requires a different next step.

```html
<form action="/account/recovery" method="post">
  <label for="recovery-email">Email address</label>
  <input id="recovery-email" name="email" type="email" aria-describedby="recovery-error" aria-invalid="true" required>
  <p id="recovery-error" role="alert">Enter an email address in the format name@example.com.</p>
  <button type="submit">Send recovery link</button>
</form>
```

This field-level message identifies the issue and gives a repair instruction. The server must validate the value and return the appropriate state. For security-sensitive flows, such as account recovery, avoid revealing whether a particular email address has an account if that would enable account enumeration.

**Naive approach:** “Oops! You did something wrong.”

**Correct approach:** “Enter an email address in the format name@example.com.”

**Gotcha:** Do not blame the user for a system failure. If the network is unavailable, say the request could not be sent and explain whether retrying is safe.

**Implementation example:**

```js
const fieldMessage = {
  required: "Enter your work email.",
  format: "Check the email format and try again."
};
```

### 7. Write success and confirmation messages that match system state

A success message must correspond to a confirmed outcome. A button press, animation, or optimistic local state does not prove that a server saved data. If the request is pending, say it is being processed. If the server confirms success, say what happened and what comes next. If an operation partly succeeds, explain the completed and incomplete parts instead of reporting total success.

```html
<section class="save-status" role="status" aria-live="polite">
  <h2>Profile saved</h2>
  <p>Your display name has been updated.</p>
</section>
```

This message should only be rendered after the save operation succeeds. `role="status"` and `aria-live="polite"` allow assistive technology to announce the update without unnecessarily interrupting the user. A status message should not disappear before a person has a reasonable chance to perceive it.

**Naive approach:** Immediately show “Saved!” as soon as the user clicks, even if the request later fails.

**Correct approach:** Show a pending state while saving, then success or a recoverable error based on the server response.

**Gotcha:** If the app retries a request automatically, avoid implying that the operation happened exactly once unless the backend guarantees that behaviour.

**Implementation example:**

```js
const status = response.ok ? "success" : "failed";
console.info("Save result:", status);
```

### 8. Make loading and waiting states informative

A loading state should tell users that work is happening and, where useful, what is being loaded or how to proceed while waiting. A generic spinner provides little information and may look like a frozen interface if it lasts too long. Avoid inventing precise time estimates when the system cannot support them. For long operations, provide progress only when it reflects real measured progress.

```html
<section aria-labelledby="import-heading" aria-busy="true">
  <h2 id="import-heading">Importing contacts</h2>
  <p role="status" aria-live="polite">Checking the file and preparing the import.</p>
  <progress aria-label="Import progress" value="35" max="100">35%</progress>
</section>
```

The progress value must come from the actual process. If the system cannot measure progress, use an indeterminate status instead of displaying a fabricated percentage. The interface should also explain whether the user can safely leave the page or whether the operation must remain open.

**Naive approach:** Display “99%” for an unknown duration because it looks reassuring.

**Correct approach:** Show a real progress value or a truthful status such as “Preparing your import.”

**Gotcha:** A live region that announces every tiny progress increment can overwhelm screen-reader users. Announce meaningful milestones rather than every update.

**Implementation example:**

```html
<p role="status" aria-live="polite">Preparing your download. This may take a moment.</p>
```

### 9. Ask for permissions with context

Permission prompts work better when users understand why access is requested, what the product will do with the permission, and whether there is an alternative. A system prompt alone often lacks enough context. Explain the value before triggering the native permission request, and respect a denial. Do not repeatedly nag people or block unrelated functionality when an alternative path is possible.

```html
<section aria-labelledby="calendar-access-title">
  <h2 id="calendar-access-title">Connect your calendar</h2>
  <p>Calendar access lets the app show your scheduled project reviews. You can enter review dates manually instead.</p>
  <button type="button">Connect calendar</button>
  <a href="/reviews/manual">Enter dates manually</a>
</section>
```

The interface explains the purpose and provides an alternative. The actual system permission request should be triggered only after the user chooses to connect. Privacy disclosures must match the implementation, including storage, sharing, retention, and revocation behaviour.

**Naive approach:** Trigger a permission dialog on page load without explaining why it is needed.

**Correct approach:** Explain the capability and data use, then ask at the moment the user requests that capability.

**Gotcha:** Do not claim data stays on the device or is never shared unless the architecture and policy substantiate that statement.

**Implementation example:**

```html
<p>We use your location to show nearby pickup points. You can also enter a postcode.</p>
<a href="/pickup/postcode">Enter a postcode instead</a>
```

### 10. Empty, no-results, and first-use states

An empty state is a meaningful product state, not necessarily an error. Distinguish first use, no matching search results, a cleared list, missing permissions, and a failed load. Each state needs different guidance. A first-use state should explain how to begin; a no-results state should help the user broaden or correct the search; a cleared state should confirm the absence of items without pretending the user has never used the feature.

```html
<section class="empty-projects" aria-labelledby="empty-projects-title">
  <h2 id="empty-projects-title">No projects yet</h2>
  <p>Create a project to organise tasks, files, and decisions in one place.</p>
  <a class="button" href="/projects/new">Create your first project</a>
</section>
```

This state names the condition and gives a useful first action. It should not be used when the list failed to load; a network failure needs an error state with a retry path. Empty states should not shame users or invent urgency to force activation.

**Naive approach:** Use the same “Nothing here!” message for first use, no search matches, and server failure.

**Correct approach:** Identify the exact state, explain it, and offer an action that can actually resolve it.

**Gotcha:** If a list is empty because a filter is active, a “Create item” CTA may be less useful than “Clear filters.” Determine the cause before choosing the recovery action.

**Implementation example:**

```html
<section aria-labelledby="filter-empty-title">
  <h2 id="filter-empty-title">No items match these filters</h2>
  <button type="button">Clear filters</button>
</section>
```

### 11. Accessibility, screen readers, and keyboard use

UX writing and accessibility are inseparable. A visually clear instruction can become ambiguous when announced out of context. Link text should communicate its destination, form controls need persistent labels, errors should be associated with the relevant field, and dynamic status updates should be announced appropriately. Use semantic HTML before adding ARIA. ARIA supplements semantics; it does not repair poor interaction design or missing behaviour.

```html
<main>
  <h1>Export report</h1>
  <p id="export-description">Download the current report as a CSV file.</p>
  <button type="button" aria-describedby="export-description">Download CSV</button>
  <a href="/reports">Return to reports</a>
</main>
```

The page uses a meaningful heading, description, action, and destination link. Test with keyboard navigation and the accessibility tree in browser DevTools. Confirm that focus is visible, link purpose makes sense, controls have accessible names, and status changes are announced without taking focus unexpectedly.

**Naive approach:** Use “Click here” repeatedly and rely on colour to show which action is important.

**Correct approach:** Use descriptive link text, semantic controls, visible focus, and clear text labels for state.

**Gotcha:** Do not put long explanatory paragraphs into `aria-label` when visible text already labels the control. Duplicate or conflicting accessible names can make the interface harder to understand.

**Implementation example:**

```css
a:focus-visible,
button:focus-visible,
input:focus-visible {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
```

### 12. Consistency, terminology, and content systems

Consistent terminology reduces the need to relearn the interface. If a product calls a collection a “workspace” on one screen and a “team folder” on another without a real distinction, users may assume the concepts differ. Build a terminology list with the preferred term, definition, prohibited alternatives, capitalisation, plural form, and examples. Pair it with reusable string patterns for buttons, errors, and confirmations. Consistency does not mean every string must be identical; it means similar situations follow the same logic.

```html
<nav aria-label="Primary navigation">
  <ul>
    <li><a href="/workspaces">Workspaces</a></li>
    <li><a href="/projects">Projects</a></li>
    <li><a href="/settings">Settings</a></li>
  </ul>
</nav>
```

Use the same nouns throughout navigation, page headings, breadcrumbs, help content, and notifications. In a content system, store strings in a central resource file rather than duplicating them in unrelated components. Include context comments for translators when a string could be ambiguous.

**Naive approach:** Let each developer invent button labels and names for the same object.

**Correct approach:** Maintain a product glossary and reusable string patterns, then review new strings against them.

**Gotcha:** Consistency should not preserve an incorrect term forever. When terminology changes, plan a coordinated migration across UI, help articles, emails, analytics events, and support scripts.

**Implementation example:**

```js
const terms = {
  workspace: "A shared area for projects and members.",
  project: "A set of tasks with one defined outcome."
};
```

### 13. Internationalisation and text expansion

Interface language may be translated, localised, read aloud, or rendered in scripts with different direction and length. Avoid string concatenation that assumes English word order, idioms that do not translate cleanly, and labels that only work at one fixed width. Give translators context, preserve placeholders safely, and let layout adapt to longer text. Dates, numbers, currencies, plural forms, and units should follow locale-aware formatting rather than hand-written English rules.

```html
<section aria-labelledby="invite-title">
  <h2 id="invite-title">Invite a teammate</h2>
  <label for="invite-email">Teammate’s email address</label>
  <input id="invite-email" name="email" type="email" autocomplete="email" required>
  <button type="submit">Send invitation</button>
</section>
```

The string is a complete phrase rather than a concatenation of “Invite” plus a guessed suffix. For a production application, use the framework’s internationalisation library and message format support for pluralisation and interpolation. Test pseudo-localised text and right-to-left layouts.

**Naive approach:** Build “You have ” + count + “ new message(s)” in code and assume every language follows English grammar.

**Correct approach:** Use a locale-aware message formatter with plural rules and a complete translatable message.

**Gotcha:** Text expansion can break buttons, cards, and navigation. Avoid fixed heights and test with longer strings rather than assuming translation will fit.

**Implementation example:**

```js
const countMessage = new Intl.NumberFormat("en-IN").format(1200);
console.log(countMessage);
```

### 14. Privacy, security, and sensitive disclosures

UX copy should explain data collection and consequential actions without making unsupported privacy promises. Users need to understand why information is requested, whether it is required, who can see it, and what happens when they proceed. Security-sensitive messages need special care: account recovery should not reveal whether an email exists; permission errors should not expose internal system details; and payment or deletion confirmations should accurately describe the effect.

```html
<section aria-labelledby="data-use-title">
  <h2 id="data-use-title">Why we ask for your phone number</h2>
  <p>We use this number to send delivery updates for this order. It is not required for browsing the catalogue.</p>
  <label for="phone-number">Phone number (optional)</label>
  <input id="phone-number" name="phone" type="tel" autocomplete="tel">
</section>
```

Only use this wording if it accurately reflects the product’s data practices. If the number is shared with a courier or retained for a specific period, disclose that when relevant and follow the applicable policy. Work with privacy and legal reviewers for regulated or sensitive flows.

**Naive approach:** “Your data is 100% safe and will never be shared” without evidence or control over every downstream processor.

**Correct approach:** State the actual purpose, optionality, and relevant sharing or retention details in language approved by the responsible team.

**Gotcha:** Copy cannot compensate for a privacy practice that contradicts it. Keep product behaviour, privacy documentation, and UI disclosures aligned.

**Implementation example:**

```html
<p>We use this information to process your booking and send confirmation details.</p>
```

### 15. Dynamic content, truncation, and responsive layouts

Interface strings may be longer than expected because of names, titles, translations, user-generated content, or assistive technology settings. Do not assume that every message fits the prototype. Test long names, missing values, plural forms, and narrow viewports. If text is truncated, preserve a way to access the full value and avoid clipping critical instructions, prices, consent terms, or error details.

```html
<article class="notification">
  <h2 class="notification__title">Project review scheduled</h2>
  <p class="notification__body">The review for “Mobile onboarding refresh and account recovery improvements” is scheduled for Thursday.</p>
  <a href="/calendar">View project calendar</a>
</article>
```

```css
.notification__body {
  overflow-wrap: anywhere;
  line-height: 1.5;
}

.notification__title {
  margin-block: 0 0.5rem;
}
```

The CSS allows long content to wrap rather than overflow its container. If the design intentionally truncates a preview, provide a detail view or accessible expansion control. Use browser DevTools to test long strings, 200% zoom, and narrow widths.

**Naive approach:** Set a fixed card height and hide overflow, causing a validation instruction to disappear.

**Correct approach:** Let content expand where possible; if truncation is essential, provide a discoverable way to access the complete message.

**Gotcha:** CSS ellipsis does not necessarily make hidden content discoverable to all users. Ensure the full text is available through a sensible interaction and in the accessibility tree.

**Implementation example:**

```css
.form-error {
  max-inline-size: 65ch;
  overflow-wrap: anywhere;
}
```

### 16. System states and truthful language

A product’s state model should drive the words it displays. At minimum, distinguish idle, submitting, success, validation failure, server failure, permission denied, offline, conflict, and partial success where relevant. UX writers should work with developers to map each state to a message, action, and recovery path. Avoid wording that implies certainty when the state is unknown. “Your file is uploaded” is different from “Upload started,” and “Your payment is complete” is different from “Payment is processing.”

```js
function getUploadMessage(state) {
  const messages = {
    idle: "Choose a file to upload.",
    uploading: "Uploading your file…",
    success: "File uploaded successfully.",
    offline: "You are offline. Reconnect, then try again.",
    failed: "We could not upload the file. Your original file is still available to retry."
  };

  return messages[state] ?? "Upload status is unavailable. Check your connection and try again.";
}
```

The function maps known states to specific language and includes a truthful fallback. In production, the fallback must reflect what the application actually knows; do not promise the original file is preserved unless it is. Log unexpected states for debugging without exposing stack traces or secrets to users.

**Naive approach:** Reuse “Done!” for queued, processing, completed, and partially failed operations.

**Correct approach:** Define a copy map for each meaningful state and make it agree with the backend’s actual status.

**Gotcha:** A fallback message is not a substitute for observability. If the application frequently reaches an unknown state, investigate the underlying system and improve the state model.

**Implementation example:**

```js
const message = getUploadMessage("offline");
document.querySelector("[data-upload-status]").textContent = message;
```

### 17. Full-flow integration: invitation and recovery

A complete UX-writing solution must work across the entire journey, not only on the first screen. Consider a team invitation flow: the inviter enters an email, the system validates it, sends an invitation, and displays confirmation. The invitee may open an expired link, already belong to the team, lack permission, or encounter a network failure. Each state requires distinct language and a real recovery route. The same principle applies to password reset, checkout, file upload, and account deletion.

```html
<main>
  <section aria-labelledby="invite-heading">
    <h1 id="invite-heading">Invite a teammate</h1>
    <p>They will receive an email with a link to join this workspace.</p>
    <form action="/invitations" method="post">
      <label for="invite-address">Teammate’s email address</label>
      <input id="invite-address" name="email" type="email" autocomplete="email" required>
      <button type="submit">Send invitation</button>
    </form>
  </section>
  <section aria-labelledby="invite-help-heading">
    <h2 id="invite-help-heading">Having trouble?</h2>
    <p>If the invitation link has expired, ask a workspace admin to send a new invitation.</p>
  </section>
</main>
```

This is the content structure, not a complete backend implementation. The server must verify permission, validate the email, avoid leaking sensitive membership information, and return a meaningful state. The UI should preserve the entered email after a recoverable failure, prevent duplicate submissions when appropriate, and not claim delivery merely because the request was accepted. In a real system, “Invitation sent” should mean the service accepted the invitation request, while the copy should not imply the recipient has read it.

**Naive approach:** Build only the successful invitation screen and leave expired links, duplicates, permission failures, and offline behaviour undefined.

**Correct approach:** Create a state matrix before finalising copy, then test each state against actual backend outcomes and user recovery options.

**Gotcha:** “Invitation sent” cannot guarantee inbox delivery. Prefer “Invitation request sent” only if that phrase is accurate and understandable, and provide a way to resend or check the invitation status.

**Implementation example:**

```html
<section aria-labelledby="invite-failed-title">
  <h2 id="invite-failed-title">Invitation not sent</h2>
  <p>Check your connection. Your email address is still in the field.</p>
  <button type="submit">Try again</button>
</section>
```

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Verb + object action label

**What it does:** Makes a control’s action explicit by naming both the verb and the object.

**When to use it:** Use it when a button could otherwise be confused with another action on the same screen.

```html
<button type="button">Save billing address</button>
<button type="button">Cancel changes</button>
```

The labels remain understandable when scanned quickly. Do not force an object into a label when context is completely unambiguous and the longer text would become awkward; consistency and clarity matter more than a rigid word count.

### Pattern 2: Field label + helper + validation

**What it does:** Gives a field a persistent name, explains its requirement, and provides a repair instruction if validation fails.

**When to use it:** Use it for forms where format, eligibility, or data consequences are not obvious.

```html
<div class="field">
  <label for="invoice-email">Invoice email</label>
  <p id="invoice-email-help">Invoices will be sent to this address.</p>
  <input id="invoice-email" type="email" aria-describedby="invoice-email-help invoice-email-error" aria-invalid="true">
  <p id="invoice-email-error">Enter a valid email address.</p>
</div>
```

Only expose the error element and set `aria-invalid="true"` when the field is invalid. Do not show errors before the user has had a reasonable opportunity to enter a value unless early validation is necessary and non-disruptive.

### Pattern 3: Consequence-first destructive action

**What it does:** Explains the result before asking a user to confirm a high-impact action.

**When to use it:** Use it for deletion, revocation, cancellation, or actions that remove access or data.

```html
<section aria-labelledby="remove-member-title">
  <h2 id="remove-member-title">Remove this member?</h2>
  <p>They will lose access to this workspace. Their previously shared comments will remain visible.</p>
  <button type="button">Keep member</button>
  <button type="button">Remove member</button>
</section>
```

Explain what changes and what remains. Do not use threatening language or make the safe action difficult to find. A destructive confirmation should also support keyboard and screen-reader interaction.

### Pattern 4: Error + next step + data status

**What it does:** Gives a useful recovery action and explains whether the user’s work is safe.

**When to use it:** Use it after network failures, uploads, long forms, and save operations where retry behaviour matters.

```html
<section role="alert" aria-labelledby="save-error-title">
  <h2 id="save-error-title">We couldn’t save your changes</h2>
  <p>Your edits are still on this page. Check your connection and try again.</p>
  <button type="button">Try saving again</button>
</section>
```

Only state that edits remain if the application really preserves them. If the state is uncertain, say what is known and offer a safe recovery path rather than inventing reassurance.

### Pattern 5: Empty state with a useful next action

**What it does:** Explains why a content area is empty and provides a relevant route forward.

**When to use it:** Use it for first-use screens, no-results states, and filtered lists after confirming the actual cause.

```html
<section aria-labelledby="no-matches-title">
  <h2 id="no-matches-title">No matching invoices</h2>
  <p>Try a wider date range or clear the current filters.</p>
  <a href="/invoices">Clear filters and view invoices</a>
</section>
```

The action matches the no-results cause. If the service failed to load invoices, show a loading or error state instead of suggesting there are no invoices.

### Pattern 6: Progressive disclosure with clear labels

**What it does:** Keeps secondary explanation available without forcing every user to read it before acting.

**When to use it:** Use it for optional policy details, uncommon settings, or explanations that are helpful to some users but not required for the main task.

```html
<details>
  <summary>How will this setting affect existing members?</summary>
  <p>The change applies to new invitations. Current members keep their existing access until an admin updates it.</p>
</details>
```

Native disclosure provides a keyboard-operable control in modern browsers. Do not hide material costs, consent requirements, or consequences that a person must understand before making a decision.

### Pattern 7: State-driven message map

**What it does:** Ensures each meaningful system state has copy that matches what the application actually knows.

**When to use it:** Use it for asynchronous operations such as payment, upload, invitation, export, and account recovery.

```js
const statusCopy = {
  idle: { title: "Ready to export", body: "Choose the report format." },
  pending: { title: "Preparing your export", body: "Keep this page open while the file is prepared." },
  complete: { title: "Export ready", body: "Your file is ready to download." },
  failed: { title: "Export failed", body: "We could not prepare the file. Try again." }
};

function messageFor(state) {
  return statusCopy[state] ?? {
    title: "Export status unavailable",
    body: "Refresh the page or try again later."
  };
}
```

The state map reduces accidental reuse of a success message for a pending operation. Ensure every string is accurate for the backend and that the fallback does not promise that a retry will succeed.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using placeholder text as the only label | The design optimises for a minimal visual form and ignores persistent identification. | Add a visible `<label>` associated with the input’s `id`. |
| Writing “Something went wrong” for every failure | The system’s distinct failure states were not mapped before copy was written. | Define a state-specific message with a recovery action for each known failure. |
| Showing success before confirmation | The UI responds to a click rather than the actual server outcome. | Render success only after the relevant operation is confirmed by the application state. |
| Naming every button “Continue” | The flow was designed visually without reviewing commitment or destination. | Use a verb-and-object label that reflects the next action and its consequence. |
| Hiding important conditions in helper links | Conversion pressure pushes material information away from the decision point. | Place essential costs, scope, privacy, and eligibility details beside the relevant action. |
| Using humour in a serious error | Brand voice is applied uniformly without considering user stress. | Use calm, direct language for failures, payments, privacy, and access loss. |
| Blaming users for validation errors | Error copy describes the person instead of the field requirement. | State the invalid value or missing requirement and explain how to correct it. |
| Announcing every progress update | Live-region behaviour is added without considering announcement frequency. | Announce meaningful milestones and avoid frequent repetitive screen-reader interruptions. |
| Triggering permission prompts immediately | The product asks for access before users understand its value. | Explain the capability first and request permission when the user chooses that feature. |
| Treating no results as a server error | Distinct states share one generic component. | Separate empty, filtered, loading, offline, and failed states in the interface model. |
| Using inconsistent product nouns | Teams create strings independently without a shared glossary. | Maintain an approved terminology list and review new copy against it. |
| Concatenating translatable fragments | English word order is assumed to apply in every locale. | Use complete messages with locale-aware interpolation and plural rules. |
| Truncating instructions in fixed-height cards | The prototype uses sample text shorter than real or translated content. | Allow content to wrap and provide access to full text when truncation is necessary. |
| Adding ARIA instead of semantic HTML | Accessibility is treated as an attribute patch rather than a structure requirement. | Use native headings, labels, buttons, links, and landmarks first; add ARIA only when needed. |
| Promising data safety without evidence | Reassuring language is written without verifying product and vendor behaviour. | State only reviewed data-use facts and align UI copy with privacy practices. |
| Reusing one empty state everywhere | The team models visual components but not the reason the state occurred. | Select copy and actions from the actual cause: first use, filters, no matches, or load failure. |
| Showing a fake progress percentage | A spinner feels insufficient, so the interface invents precision. | Use measured progress or an honest indeterminate status. |
| Failing to preserve user input after an error | Recovery was not included in the original flow design. | Preserve entered values when safe and explain whether the request was submitted. |

**Before → After example**

Before:

```html
<div>
  <p>Oops!</p>
  <input placeholder="Email">
  <button>Go</button>
  <p>Something went wrong.</p>
</div>
```

After:

```html
<form action="/account/recovery" method="post">
  <h1>Recover your account</h1>
  <p>Enter the email address associated with your account to request a recovery link.</p>
  <label for="account-email">Email address</label>
  <input id="account-email" name="email" type="email" autocomplete="email" required>
  <button type="submit">Send recovery link</button>
  <p role="status">If the request is accepted, instructions will be sent according to the account recovery process.</p>
</form>
```

The revised version uses semantic structure, a persistent label, a task-specific action, and language that can be aligned with a security-conscious recovery process. In production, show the status only after the server returns an appropriate response and use wording reviewed for account-enumeration risk.

---

## Mental Models

1. **Every string is part of a task.** Judge interface copy by whether it helps the user understand or complete the current task, not by whether it sounds polished in isolation.
2. **The label is a promise.** A button or link label creates an expectation about the next state; the product must fulfil that expectation or explain the difference.
3. **State before sentence.** Identify what the system knows and what state it is in before choosing the wording for loading, success, or failure.
4. **Recoverability is part of clarity.** A good error message does not merely name a problem; it helps the person decide what to do next and whether retrying is safe.
5. **Context can disappear.** Write labels and links so they remain understandable when scanned, translated, announced by assistive technology, or viewed outside the original layout.
6. **Consistency reduces cognitive load.** Stable terminology lets people transfer learning from one screen to another, while meaningful distinctions should remain explicit.
7. **Permission is a conversation.** Explain why access is useful before asking for it, and respect refusal by providing alternatives where possible.
8. **Trust depends on truthful state.** Never claim that data was saved, a payment completed, or an invitation delivered unless the system can support that claim.

---

## Quick Reference

| UI situation | Recommended wording approach | Avoid |
|---|---|---|
| Primary button | Verb + object or explicit outcome | “Go” or “Click here” |
| Form label | Persistent, specific label | Placeholder-only instruction |
| Helper text | Explain format, requirement, or consequence | Restating the label |
| Validation error | Name the field issue and repair action | “You entered it wrong” |
| Network failure | Explain the request failed and whether retry is safe | “Oops!” without guidance |
| Success state | State the confirmed outcome and next step | Success before server confirmation |
| Loading state | Describe the operation honestly | Fake time estimates or progress |
| Destructive action | Name the object and consequence | Ambiguous “OK” |
| Permission request | Explain purpose and alternative | Immediate system prompt without context |
| First-use empty state | Explain how to begin | “Nothing here” alone |
| No search results | Suggest a relevant search change | Treating no results as a system failure |
| Expired session | Explain sign-in and preserve work where possible | Vague “Access denied” |
| Link text | Name destination or action | Repeated “Read more” with no context |
| Privacy disclosure | State real purpose and relevant sharing | Unsupported “100% safe” claims |
| Internationalisation | Complete locale-aware messages | Concatenated English fragments |
| Long content | Allow wrapping or provide a full-text route | Clipping essential instructions |
| Screen-reader status | Announce meaningful state changes | Repeated noisy live-region updates |
| Terminology | Use approved product glossary | Unexplained synonyms for one concept |
| Confirmation dialog | Explain consequence and clear choices | Confirming every harmless action |
| Debug review | Inspect labels, state mapping, focus, and console | Relying only on visual appearance |

---

## Build Challenge

### Build: Accessible Account Settings and Recovery Flow

Build a small account-settings experience that allows a user to update a display name, change a billing email, and request account recovery. The goal is to demonstrate task-focused labels, helper text, truthful system states, accessible error handling, and consistent terminology. Use mock data for the prototype and do not collect real personal information.

**Requirements**

1. Define the user goal and expected outcome for each task: update display name, change billing email, and request recovery.
2. Create a semantic page structure using `<main>`, headings, `<section>`, `<form>`, `<label>`, `<input>`, `<button>`, and meaningful links.
3. Write a visible label and, where needed, helper text for every input. Do not rely on placeholder text as the only label.
4. Use explicit button labels that describe the action, such as “Save display name” and “Send recovery link.”
5. Implement client-side validation for basic usability and server-side validation in a real backend. Do not treat client validation as a security control.
6. Model at least six states: idle, submitting, success, validation failure, network failure, and permission or session failure.
7. Ensure the success message is displayed only when the operation reports success. A pending state must not be worded as a completed state.
8. For each failure state, write a message that says what happened, what the user can do next, and whether the entered data is preserved—only when that is known.
9. Use `aria-describedby` to associate relevant help and error text with fields, and set `aria-invalid` when a field is invalid.
10. Provide a visible keyboard focus indicator with `:focus-visible` for interactive elements.
11. Create a terminology list for account, billing email, recovery link, save, and cancel. Use the terms consistently across headings, buttons, messages, and help content.
12. Include a permission or privacy explanation for any sensitive data request. Do not make unsupported promises about retention or sharing.
13. Test long labels and error messages at mobile widths and 200% zoom. Confirm that no essential text or controls are clipped.
14. Inspect the accessibility tree in browser DevTools and test the flow using only the keyboard. Verify label association, focus order, focus visibility, and status announcements.
15. Simulate an offline request and a rejected save. Confirm that the interface does not claim success and that it provides a recovery path.
16. Write at least one state-driven message map in JavaScript and include a fallback for an unexpected state.
17. Document the exact server outcomes that each status message represents. If the backend is not implemented, label those states as simulated and do not present them as production behaviour.
18. Conduct a comprehension check with at least three people if feasible: ask what each action will do, what data is being requested, and what happens after a failure. If testing is not feasible, write a test plan instead of inventing findings.

### Definition of done

- [ ] Each task has a clear heading, explanatory context where needed, and an action label that matches the real outcome.
- [ ] Every form control has a persistent accessible name; helper and error text are associated with the correct field.
- [ ] Loading, success, validation, network, and permission/session states are distinguishable and truthful.
- [ ] Error messages provide a concrete next step without blaming the user or exposing sensitive system details.
- [ ] The interface preserves user input after recoverable failures where safe, and accurately explains when it cannot.
- [ ] Keyboard focus is visible, focus order is logical, and dynamic status messages are announced appropriately.
- [ ] The page uses semantic HTML and does not depend on colour, position, or icons alone to communicate state.
- [ ] Long copy, zoom, and narrow viewports do not hide essential instructions, consent details, or controls.
- [ ] Product terminology remains consistent across forms, headings, buttons, errors, and confirmation states.
- [ ] Browser DevTools checks show no broken labels, invalid links, console errors, or unexpected overflow.
- [ ] Privacy and security language matches the actual data flow and has not been invented to sound reassuring.
- [ ] The test plan covers both a successful task and at least two failure or edge scenarios.

**Failure scenario to test:** Disconnect the network after a user has completed the form but before the save response arrives. The interface must not display “Saved” unless the server confirms success. It should explain that the save could not be confirmed, preserve the user’s entries when safe, and offer a retry action whose behaviour is understood. Also test an invalid email and an expired session. The user must be told how to correct the input or sign in again without being blamed or losing work unnecessarily.
