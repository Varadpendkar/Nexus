# SKILL: microinteraction-design

**Layer:** 43 — UI/UX Design

**Goal:** Design small, purposeful interface responses that make actions understandable, provide timely feedback, communicate state changes, and support recovery without adding distracting motion or unnecessary complexity.

---

## Why This Matters (Senior Perspective)

Microinteractions are the small moments in which an interface responds to a user's action or communicates a change in state. A button shows that it has been pressed, a form explains why an entry is invalid, a save operation confirms completion, a menu opens with a clear focus target, and a switch communicates whether a setting is enabled. Each moment may be brief, but together they shape whether a product feels reliable, understandable, and responsive.

The quality of a microinteraction is not measured by how much animation it contains. A springy button can feel delightful in the right context, but it can also slow down a frequent workflow, obscure the result, or make an interface feel unserious. A subtle state change that prevents a duplicate payment is often more valuable than an elaborate transition. Good microinteraction design begins with a user need: confirm an action, explain progress, show a relationship, prevent an error, guide attention, or help someone recover.

These moments sit at the intersection of visual design, interaction design, accessibility, and engineering. The designer needs to specify what triggers the response, what state changes, what the user should perceive, how long the response lasts, and what happens if the operation fails. Engineering needs a deterministic state model, cancellation behavior, reduced-motion support, and clear boundaries between visual feedback and actual application success. If the design only specifies a motion curve, it is incomplete.

Microinteractions are particularly important in asynchronous interfaces. A user may press Save and wait for a server response, upload a file, change a filter, or submit a form. A button animation cannot prove that the server accepted the request. The interface must distinguish a local interaction state from a confirmed business outcome. It should prevent duplicate submissions when appropriate, preserve entered data after failure, and provide a useful next step. These behaviors build trust more effectively than cosmetic polish.

Accessibility is not an optional layer. Motion can trigger discomfort, focus can be lost when a dialog opens, a success state may be conveyed only by color, and an animated notification may disappear before a screen-reader user can perceive it. Respect reduced-motion preferences, maintain visible keyboard focus, use semantic controls, announce important status changes appropriately, and never rely on animation as the only carrier of meaning.

Senior designers treat microinteractions as part of the product's interaction language. Reusable tokens and patterns create consistency, but the same animation should not be applied blindly to every component. A destructive action, a low-risk hover state, a long-running upload, and a critical validation error have different needs. The design should communicate the right amount of information at the right time, at a speed that respects the task.

**Senior perspective:** every microinteraction should answer a practical question: what happened, what is happening, what can I do next, and can I trust the result? If the response does not improve comprehension, confidence, control, or recovery, it may be unnecessary.

---

## Core Concepts

### 1. Define the trigger, response, and outcome

A microinteraction needs a clear trigger and a meaningful response. The trigger may be a click, keyboard activation, pointer entry, focus change, form submission, or system event. The response should communicate a state or support the task rather than animate for its own sake.

```text
Trigger: User activates Save
Immediate response: Button enters a pending state
Confirmed response: Server accepts the update; success message appears
Failure response: Error is announced; entered values remain available
```

Specify the response for success, failure, and cancellation. A design that only describes the happy path leaves engineering to invent behavior under pressure.

### 2. Distinguish interaction state from business state

A control can show that it received input before the underlying operation has completed. A spinner means work is in progress; it does not mean a save succeeded. A checked switch may represent a local selection or a server-confirmed setting, and the distinction must be clear.

```text
idle -> pending -> confirmed
               -> failed -> retryable
               -> cancelled
```

For critical operations, show success only after the system confirms it. If an optimistic UI updates immediately, define how rollback and error recovery work when the request fails.

**Gotcha:** never show “Payment complete” merely because the user pressed the payment button. Confirm the outcome from the authoritative transaction response.

### 3. Give immediate acknowledgment to input

People need to know that their action registered. Provide a prompt response to activation, even when the underlying operation takes longer. A subtle pressed state or immediate pending indicator can reduce repeated clicks and uncertainty.

```css
.action-button {
  transition: transform 120ms ease, background-color 160ms ease;
}

.action-button:active {
  transform: translateY(1px);
}

.action-button:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

The interaction response should not make the control appear disabled before it has accepted the action. For long operations, communicate progress and prevent accidental duplicate requests where appropriate.

### 4. Choose duration based on task context

Duration should support perception, not delay the user. Small state changes usually need less time than transitions that explain spatial relationships. Repeated actions should feel quick; complex transitions may need more time to remain understandable.

```text
Pressed acknowledgment: brief
Tooltip appearance: short, with no surprise delay for keyboard focus
Panel transition: long enough to communicate movement, short enough not to block work
Background upload: persistent progress feedback, not a decorative timer
```

Use a consistent timing scale as a starting point, then evaluate the actual interface. Do not use animation duration to conceal slow system performance.

### 5. Use easing to communicate physical character

Easing changes how motion accelerates and decelerates. A restrained ease-out can make an element appear to settle quickly; a linear curve may suit continuous progress. The curve should reflect the purpose of the movement rather than a fashionable default.

```css
:root {
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}

.panel {
  transition:
    opacity var(--motion-standard) var(--ease-standard),
    transform var(--motion-standard) var(--ease-standard);
}
```

Avoid over-bouncy motion for serious, high-frequency tasks. Keep motion tokens documented so different teams do not invent unrelated curves for similar interactions.

### 6. Make state changes visible and understandable

A state change should communicate more than a color shift when the outcome matters. Use label changes, icons with accessible names, supporting text, or status messages as appropriate. Ensure the change is perceivable in high-contrast conditions and does not rely on color alone.

```html
<button type="button" aria-pressed="false">
  Pin report
</button>
```

For a toggle button, update `aria-pressed` when the state changes and ensure the visible label's behavior is consistent. For navigation, use a link rather than a button that imitates navigation. Select semantics based on the actual interaction.

### 7. Design loading feedback for meaningful waits

Use a loading indicator when a user needs to wait and cannot infer progress from the interface. For very short operations, a persistent spinner may flicker and add noise; for longer operations, an indefinite spinner may leave people unsure whether anything is happening.

```text
Short operation:
Acknowledge the action and update the result as soon as confirmed.

Long operation:
Show a clear pending state, progress when measurable, and an explanation if the wait is unusual.

Unknown duration:
Use a stable loading indicator and avoid inventing a percentage.
```

Do not fabricate progress values. If progress cannot be measured, use an honest indeterminate state and provide cancellation when the operation supports it.

### 8. Use progress indicators only when they are truthful

A determinate progress bar should represent measured or reliably estimated progress. An indeterminate indicator should communicate that work continues without implying a precise percentage. Progress should not jump backward unexpectedly unless the system explains a phase change.

```html
<div
  role="progressbar"
  aria-label="Uploading project files"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow="42">
  Uploading files: 42%
</div>
```

Update `aria-valuenow` only when the value represents actual progress. For an indeterminate progress indicator, omit `aria-valuenow` and ensure the status remains understandable without animation.

### 9. Design validation feedback at the right moment

Validation should help people correct an issue without punishing them for trying. Decide whether to validate on blur, during input, or after submission based on the field and consequences. Avoid announcing an error before the user has had a fair chance to enter a value.

```html
<label for="workspace-name">Workspace name</label>
<input
  id="workspace-name"
  name="workspaceName"
  aria-describedby="workspace-name-help workspace-name-error"
  aria-invalid="true">
<p id="workspace-name-help">Use a name your team will recognize.</p>
<p id="workspace-name-error">Enter a workspace name.</p>
```

In a real implementation, set `aria-invalid` and expose the error only when validation determines it is appropriate. Keep the entered value intact and place the message where the user can associate it with the field.

### 10. Preserve focus during dynamic changes

When a dialog opens, a menu expands, or content is inserted, keyboard focus should move or remain in a predictable place. If focus stays behind an overlay, the visual and keyboard experiences diverge. When a modal closes, focus generally returns to the element that opened it, unless that element no longer exists.

```text
Open dialog:
- Move focus into the dialog.
- Keep keyboard interaction within a true modal dialog.
- Provide a visible close control and Escape behavior where appropriate.
Close dialog:
- Restore focus to the invoking control.
- If it no longer exists, move focus to a sensible nearby target.
```

Test focus with a keyboard, not just by looking at the animation. Motion and focus management are separate responsibilities even when they occur at the same time.

### 11. Use toasts and transient messages carefully

A toast can confirm a low-risk action or provide brief status information, but it is a poor place for complex instructions or critical errors that require a response. Transient messages should not disappear before users can perceive them, and important content should remain available elsewhere if it must be revisited.

```html
<div role="status" aria-live="polite">
  Changes saved.
</div>
```

Choose live-region behavior based on urgency. Do not make every tiny visual change an assertive announcement, because excessive announcements can overwhelm screen-reader users. For critical errors that require action, use a persistent message or a focused dialog when appropriate.

### 12. Prevent duplicate submissions without trapping users

A pending submit control can prevent repeated activation while the request is in flight. The application should also protect against duplicate requests where the operation has significant consequences; disabling the button alone is not a reliable server-side safeguard.

```js
async function savePreferences() {
  if (state.status === "pending") return;

  setState({ status: "pending" });

  try {
    await persistPreferences();
    setState({ status: "success" });
  } catch {
    setState({ status: "error" });
  }
}
```

This is a conceptual example: production code should use the framework's actual state management and handle cancellation, stale responses, and request identity. Keep the form values available after an error so the user can retry.

### 13. Use optimistic updates with rollback rules

Optimistic updates make an interface feel immediate by reflecting an action before the server confirms it. They work best when the action is reversible and failure is uncommon or easy to recover from. Define what happens if the request fails or the user makes another change before the first request resolves.

```text
User pins report
-> UI shows report as pinned
-> Request sent
-> Success: retain pinned state
-> Failure: restore previous state and explain how to retry
```

Avoid optimistic feedback for irreversible or high-consequence operations unless the product has a robust reconciliation model. Never let the visual state quietly disagree with the authoritative state.

### 14. Design hover and focus as related but distinct states

Hover is useful for pointer discovery, but it does not exist for every input method. Focus must be visible for keyboard users, and the interface should not hide essential information behind hover-only controls.

```css
.help-link:hover {
  text-decoration-thickness: 2px;
}

.help-link:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 3px;
}
```

Avoid removing the browser outline without providing an equivalent. Test pointer, keyboard, touch, and any supported assistive input separately. A hover animation may be decorative, but the same action must remain discoverable and operable without it.

### 15. Respect reduced-motion preferences

Some users experience vestibular discomfort or distraction from unnecessary movement. Respect the operating system preference and reduce nonessential motion while preserving meaningful state changes and feedback.

```css
.card {
  transition: transform 180ms ease, opacity 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .card {
    transition: none;
  }
}
```

Do not remove the information that an animation communicated. Replace movement with a clear static state, text label, or immediate visual update. Test the reduced-motion experience rather than assuming that disabling transitions is always sufficient.

**Gotcha:** a reduced-motion preference should not remove a loading state, confirmation, or focus indicator. Remove unnecessary movement, not essential information.

### 16. Design interactions for touch and coarse pointers

Tiny hover-only affordances can be inaccessible on touch devices. Provide adequate target sizes, clear pressed states, and enough separation to avoid accidental activation. Touch feedback should not depend on a pointer hover state.

```css
.icon-button {
  min-width: 44px;
  min-height: 44px;
  display: inline-grid;
  place-items: center;
}

.icon-button:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

The 44-pixel target is a practical design guideline, not a universal substitute for checking the applicable accessibility standard and platform conventions. Test real devices and account for zoom, spacing, and adjacent destructive actions.

### 17. Make destructive actions explicit

Destructive actions need feedback that communicates consequence and supports a deliberate choice. Confirmation dialogs are not required for every deletion; they are useful when the action is consequential, hard to undo, or likely to be triggered accidentally. Where possible, provide undo rather than forcing an interruption.

```text
Low-risk reversible action:
Delete item -> brief confirmation with Undo

High-impact irreversible action:
Delete workspace -> explicit confirmation with the workspace name
                 -> clear explanation of consequences
                 -> deliberate final action
```

Do not use a confirmation dialog as a substitute for clear button labels. “Continue” is less informative than “Delete workspace” when the action is destructive.

### 18. Build undo and recovery into the interaction

Undo is valuable when an action is reversible and users may make mistakes. The recovery window should be long enough to notice the result, but it must not imply that the action is reversible after the underlying system has permanently committed it.

```text
Archive project
-> Project leaves the active list
-> Status message: "Project archived. Undo"
-> Undo restores the project if the operation is still reversible
-> If undo expires, communicate the final state accurately
```

Undo should be keyboard accessible, clearly named, and compatible with screen-reader announcements. For irreversible operations, offer an appropriate recovery path such as support, restore from archive, or a documented limitation.

### 19. Use microinteractions to explain relationships

Motion can show that a panel belongs to a control, that an item moved to a new location, or that a selection affects a result. This is most useful when movement preserves context rather than simply adding flair.

```text
User selects a filter
-> Filter chip appears near the result list
-> Results update
-> Result count and active-filter state change together
```

The motion should reinforce the relationship and remain understandable when reduced motion is enabled. Avoid moving large areas of the interface if a small, local change communicates the same thing.

### 20. Make motion resilient to interruption

Users can navigate away, submit another action, resize the viewport, or change a preference while an animation is running. Define how transitions behave when state changes quickly. Do not let stale animations reveal an obsolete state or block input.

```text
State changes: closed -> opening -> open
If user closes during opening:
- Cancel or reverse the transition cleanly.
- Keep focus consistent with the resulting state.
- Do not leave the overlay visually open but semantically closed.
```

Use the animation and framework APIs appropriate to the implementation. Avoid starting unmanaged timers or event listeners that outlive the component. Test rapid repeated input and navigation away during pending work.

### 21. Keep microinteractions consistent through tokens

A small motion system makes related controls feel like they belong to the same product. Define durations, easing, and common behavior by purpose, not by component whim. Allow exceptions when the interaction has a different consequence or perceptual need.

```css
:root {
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --motion-slow: 280ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

Document which components use each token and when an exception is justified. Check browser support for newer CSS features before making them critical to the interaction; core feedback should still work when advanced motion is unsupported.

### 22. Test browser behavior and implementation details

A design-file animation does not prove the browser implementation behaves correctly. Inspect focus, layout shifts, reduced-motion behavior, console errors, and timing under realistic conditions. DevTools can help reproduce the issue and examine computed styles, event handlers, network timing, and accessibility-related DOM structure.

```text
Debug checklist
1. Reproduce with a keyboard and pointer.
2. Inspect the actual state before and after activation.
3. Check focus order and :focus-visible styling.
4. Simulate slow network or failed requests where relevant.
5. Enable reduced motion and repeat the interaction.
6. Check console and network errors.
7. Test narrow viewports and touch input.
8. Verify the displayed state matches the confirmed application state.
```

Prefer well-supported CSS transitions for simple state changes. Use JavaScript animation when the interaction needs sequencing or precise control, and clean up listeners and animations when components unmount or state changes.

### 23. Measure whether the interaction helps

Microinteractions should be evaluated against the problem they are intended to solve. A loading state may reduce duplicate submissions; clearer validation may improve correction rates; a success message may reduce uncertainty or support contacts. Define the expected outcome and guardrail before release.

```text
Hypothesis:
Showing a pending state after Save will reduce repeated activation.

Primary measure:
Duplicate activation attempts during the request window.

Guardrails:
No increase in failed saves, abandoned forms, or inaccessible focus states.
```

Do not assume that an animation is effective because stakeholders find it attractive. Use usability observations, error rates, task completion, support signals, and performance measurements as appropriate.

### 24. Avoid motion that competes with the task

Movement can draw attention away from the content users need to read or act on. High-frequency workflows usually benefit from restrained feedback. Reserve stronger motion for moments where it helps explain a change, marks an important event, or supports a deliberate brand expression.

```text
Before adding motion, ask:
- What information does this movement communicate?
- Is the state change already clear without it?
- Can it interrupt reading or precision work?
- Does it remain usable with reduced motion?
- Does it create a performance or battery cost?
```

If the answer is only “it looks more impressive,” consider removing it. Restraint is part of interaction craft.

### 25. Make status feedback perceivable to assistive technology

Visual feedback is not sufficient if the status is not exposed through appropriate semantics. Use live regions carefully, associate errors with controls, and preserve a meaningful reading order. Do not announce every frame of a progress animation.

```html
<p id="save-status" role="status" aria-live="polite">
  Changes saved.
</p>

<label for="display-name">Display name</label>
<input id="display-name" aria-describedby="display-name-error" aria-invalid="true">
<p id="display-name-error">Enter a display name.</p>
```

In production, ensure the status is updated at the appropriate time and the error is only exposed when it applies. Check announcements with relevant screen readers; automated accessibility scans cannot validate every timing or announcement problem.

### 26. Design empty, success, and failure feedback as one system

The same action may result in success, no change, validation failure, network failure, or cancellation. Keep message language consistent and help the user understand what happened and what to do next.

```text
Success: "Preferences saved."
Validation: "Choose a notification frequency."
Network failure: "We couldn't save your preferences. Your changes are still here; try again."
Cancellation: "Upload cancelled."
```

Messages should be specific without exposing sensitive technical details. If data may have been partially saved, do not claim it was not saved; reconcile the state and explain the uncertainty.

### 27. Account for latency and perceived performance

Perceived speed is influenced by acknowledgment, progress feedback, stable layout, and the time until a meaningful result appears. A skeleton may help when content structure is predictable, but it should not flash for every short request. Avoid fake progress that races to a high percentage and then stalls.

```text
Fast response:
Update immediately when the confirmed result arrives.

Slow response:
Show a pending state, preserve context, and offer cancel if supported.

Long-running task:
Show measured progress or an honest indeterminate state, plus a way to leave safely.
```

Use network throttling in DevTools to evaluate slow conditions. Measure actual latency rather than using animation to disguise a backend performance issue.

### 28. Document interaction behavior for implementation

A useful specification defines trigger, state, timing, visual response, semantics, keyboard behavior, reduced-motion behavior, error handling, and acceptance criteria. This reduces ambiguity between design and engineering.

```text
Component: Save preferences
Trigger: Submit button activation
Pending: Button remains named; duplicate submission prevented
Success: Confirmed status message announced politely
Failure: Inline or page-level error; values preserved; retry available
Keyboard: Native button activation; visible focus
Reduced motion: No nonessential movement
Acceptance: Failure does not clear values or claim success
```

Treat the specification as a contract that can be tested. If the behavior cannot be described clearly, the interaction is probably not fully designed.

---

## Relevant Patterns

### Pattern 1: Immediate acknowledgment, delayed confirmation

**What it does:** separates the immediate response to user input from the later confirmation of a server-backed result.

**When to use it:** saving, uploading, filtering, or submitting work that may take more than a brief moment.

```text
Activate -> Show pending state -> Await response
                                -> Confirm success
                                -> Explain failure and preserve work
```

### Pattern 2: Inline validation and recovery

**What it does:** places corrective feedback close to the input that needs attention and explains how to recover.

**When to use it:** forms with required fields, format constraints, or rules that users can correct.

```html
<label for="team-name">Team name</label>
<input id="team-name" aria-describedby="team-name-error" aria-invalid="true">
<p id="team-name-error">Enter a team name.</p>
```

Only expose the invalid state when validation determines it applies. Preserve user-entered values and ensure the error can be understood without color alone.

### Pattern 3: Undo for reversible actions

**What it does:** lets users recover from a low-risk action without an interruptive confirmation dialog.

**When to use it:** archiving, removing a list item, or changing a reversible preference.

```text
Action completes -> Status message with Undo
Undo activated -> Restore prior state if still reversible
Undo expires -> Keep final state accurate
```

Do not offer Undo if the operation cannot actually be reversed.

### Pattern 4: Focus-managed dialog

**What it does:** keeps keyboard and assistive-technology users oriented when a dialog opens or closes.

**When to use it:** critical confirmation, editing in a modal, or an interruption that genuinely requires a response.

```text
Open -> Move focus into dialog
While open -> Keep focus within true modal
Close -> Return focus to invoking control
Fallback -> Focus a logical nearby target if invoker no longer exists
```

### Pattern 5: Honest progress

**What it does:** communicates ongoing work without fabricating completion estimates.

**When to use it:** uploads, exports, imports, or other long-running tasks.

```text
Known progress -> Determinate progress value
Unknown progress -> Indeterminate status
Failure -> Explain and provide recovery
Cancellation -> Confirm cancellation only after it occurs
```

### Pattern 6: Reduced-motion equivalent

**What it does:** preserves the meaning of an interaction when movement is reduced or removed.

**When to use it:** any transition that communicates state, position, expansion, or confirmation.

```css
.panel {
  transition: opacity 180ms ease, transform 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .panel {
    transition: none;
  }
}
```

The nonanimated state must remain clear. Reduced motion should not remove essential status information.

### Pattern 7: Optimistic update with rollback

**What it does:** reflects a reversible action immediately while defining how the interface returns to a truthful state if the request fails.

**When to use it:** low-risk actions such as pinning or favoriting an item.

```text
Save previous state -> Apply optimistic state -> Send request
Request succeeds -> Keep state
Request fails -> Restore previous state and explain retry
```

Use request identity or equivalent safeguards so an old response cannot overwrite a newer user action.

### Pattern 8: State-based motion tokens

**What it does:** creates consistent timing and easing for common interaction categories.

**When to use it:** design systems shared across multiple product teams or component libraries.

```css
:root {
  --motion-fast: 120ms;
  --motion-standard: 200ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

Use tokens as a default, not as a reason to force every interaction into the same duration.

### Pattern 9: Failure-preserving form

**What it does:** communicates submission failure while retaining the user's work and offering a clear next action.

**When to use it:** forms where re-entry is costly or data loss would be harmful.

```text
Submit -> Pending -> Request fails
                  -> Show specific safe error
                  -> Keep field values
                  -> Offer retry
```

Verify the actual persistence behavior before claiming that data is retained.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Animating without a user purpose | Motion is treated as polish | Name the information or confidence the motion should provide |
| Showing success before confirmation | The interface optimizes for instant gratification | Tie success feedback to an authoritative result |
| Using a spinner for every operation | Loading states are applied as a template | Avoid flicker for short work and show persistent feedback only when useful |
| Fabricating a progress percentage | A determinate bar looks reassuring | Use measured progress or an honest indeterminate state |
| Clearing a form after a failed save | Failure state was not designed | Preserve values and provide a retry path |
| Disabling a control without explanation | Preventing duplicate input is the only concern | Show a clear pending state and retain understandable status |
| Relying on color alone | Visual styling carries all the meaning | Add text, iconography, semantics, or shape cues |
| Removing the focus outline | Default focus is considered unattractive | Design a visible `:focus-visible` treatment and test keyboard paths |
| Making hover the only discovery mechanism | Desktop pointer behavior is assumed | Provide keyboard and touch alternatives |
| Ignoring reduced-motion settings | Motion is considered harmless | Remove nonessential movement while preserving the state information |
| Overusing toast messages | Toasts are easy to implement | Keep critical instructions persistent and place feedback near the affected task |
| Announcing every state assertively | Live regions are added without a plan | Match announcement urgency to the importance of the update |
| Losing focus when a dialog opens | Visual overlay is treated as sufficient | Move focus into the dialog and restore it on close |
| Using confirmation dialogs for every action | The team wants to avoid all accidental changes | Prefer undo for reversible low-risk actions |
| Offering Undo for irreversible work | The pattern is copied without checking system behavior | Ensure the operation can genuinely be reversed before exposing Undo |
| Applying optimistic UI to risky actions | Immediate feedback appears faster | Use optimistic updates only with safe reconciliation and rollback |
| Allowing stale responses to overwrite new state | Async requests resolve out of order | Track request identity and reconcile current state deliberately |
| Letting animation block input | Transitions control interaction timing | Keep input responsive and define interruption behavior |
| Ignoring network failure | The prototype always succeeds | Test slow and failed requests in a realistic environment |
| Treating visual prototype behavior as production proof | The animation looks complete in a design file | Verify real DOM, state, network, and focus behavior |
| Using tiny touch targets | The design is optimized for mouse precision | Provide comfortable target dimensions and separation |
| Making destructive actions vague | Generic labels seem concise | Name the consequence and provide deliberate confirmation when warranted |
| Designing only the happy path | Success states are easier to demonstrate | Specify validation, failure, cancellation, and recovery states |
| Over-animating frequent controls | Delight is prioritized over task speed | Keep high-frequency interactions restrained and quick |
| Using unsupported browser features without fallback | A modern browser is assumed | Check compatibility and preserve core behavior when enhancements are unsupported |
| Forgetting semantic HTML | Custom elements seem easier to style | Use native buttons, links, inputs, and appropriate status semantics |
| Treating an animation as an accessibility feature | Motion is assumed to explain everything | Provide semantic and textual state information |
| Testing only at one viewport | Desktop is the default review environment | Test narrow, intermediate, and wide layouts |
| Ignoring actual performance | Animation masks latency | Measure request duration and test with network throttling |
| Failing to verify a fix | A code change is mistaken for success | Repeat the original task and inspect regressions |

---

## Mental Models

1. **Feedback is a promise** — The interface must not claim a result that the underlying system has not confirmed.
2. **A trigger is not an outcome** — Receiving a click does not mean the requested work succeeded.
3. **Every state needs a recovery story** — Failure, cancellation, and interruption are part of the interaction, not exceptions outside it.
4. **Motion should carry information** — Movement earns its place by clarifying change, location, relationship, or consequence.
5. **Accessibility changes the interaction contract** — Keyboard focus, reduced motion, semantic status, and touch input are part of the design.
6. **Truthful feedback builds trust** — Honest pending and failure states are better than reassuring but false success.
7. **Reversibility determines the recovery pattern** — Undo suits reversible actions; irreversible actions need stronger prevention and explanation.
8. **Focus is a form of orientation** — Dynamic visual changes must not leave keyboard users behind the interface.
9. **Consistency should not erase context** — Tokens unify the product, but high-risk and high-frequency actions may need different responses.
10. **Perceived performance is not fake progress** — Acknowledgment and stable layout can improve experience without inventing measurements.
11. **The state model comes before the animation** — A beautiful transition cannot repair ambiguous application state.
12. **Verification closes the loop** — A microinteraction is successful when it improves a measurable or observable user outcome.

---

## Quick Reference

| Interaction | Design check | Implementation check |
|---|---|---|
| Button activation | Is the action acknowledged immediately? | Visible pressed state and keyboard focus |
| Save | Is success confirmed by the system? | Pending, success, failure, and retry states |
| Form validation | Can users identify and fix the field? | Label, associated error, appropriate `aria-invalid` |
| Loading | Is the wait communicated honestly? | Measured or indeterminate progress semantics |
| Toast | Is the message brief and noncritical? | Appropriate live-region behavior and sufficient persistence |
| Dialog | Is focus moved and restored? | Keyboard containment, Escape where appropriate, return focus |
| Hover | Is the same information available without hover? | Focus-visible and touch behavior |
| Reduced motion | Does the state remain understandable? | `prefers-reduced-motion` handling |
| Destructive action | Is the consequence clear? | Confirmation or undo based on reversibility |
| Optimistic update | Can the UI reconcile failure? | Rollback and stale-response protection |
| Upload | Can users understand progress and cancellation? | Truthful progress and cancellation state |
| Touch control | Is it easy to activate accurately? | Adequate target size and separation |
| Responsive UI | Does the interaction still work at narrow widths? | Test intermediate breakpoints and dynamic states |
| Accessibility | Is feedback perceivable without color or movement? | Semantic controls, focus, and status announcements |
| Debugging | Can the failure be reproduced? | DevTools, console, network, and keyboard checks |
| Evaluation | Did the response improve the task? | Predefined success measure and guardrail |

---

## Build Challenge

Build and evaluate a settings form that allows a user to update notification preferences. The form should acknowledge submission, prevent accidental duplicate requests, preserve entered values on failure, and announce confirmed success accessibly. Include a simulated slow request and a simulated failure so that the full interaction model can be tested.

### Requirements

1. **Define the interaction contract.** Document the trigger, pending state, success state, failure state, cancellation behavior, and expected recovery.
2. **Use semantic HTML.** Use a real form, associated labels, native controls, and a real submit button.
3. **Provide visible focus.** Add a clear `:focus-visible` treatment and verify it using keyboard-only navigation.
4. **Prevent duplicate submissions.** Ensure repeated activation does not start conflicting saves while the current request is pending.
5. **Show truthful pending feedback.** Make it clear that the save is in progress without claiming success.
6. **Confirm success only after the simulated request resolves.** Announce the completed state using suitable status semantics.
7. **Preserve values after failure.** Show a useful error, retain the user's selections, and provide a retry path.
8. **Handle stale responses.** Ensure a delayed response cannot overwrite a newer state or a later action.
9. **Respect reduced motion.** Remove nonessential movement while retaining clear state changes and feedback.
10. **Test touch and responsive behavior.** Verify target sizes, spacing, focus, and message placement at narrow and intermediate widths.
11. **Test assistive-technology semantics.** Check labels, invalid states, status announcements, and focus order.
12. **Create a failure-state matrix.** Include slow network, rejected request, repeated activation, cancellation if supported, and a response arriving after the user navigates away.
13. **Measure the interaction.** Define how you will assess duplicate activation, successful completion, recovery after failure, and user understanding.
14. **Document browser support.** Check the CSS and JavaScript features used and ensure core feedback remains available if an enhancement is unsupported.
15. **Write an implementation handoff.** Include state transitions, timing tokens, accessibility behavior, acceptance criteria, and known limitations.

### Failure and edge conditions

The challenge fails if the interface reports success before the request completes, loses form values after failure, allows repeated submissions to create conflicting saves, hides focus, or relies only on color or motion to communicate state. It also fails if reduced-motion mode removes essential feedback, an error message disappears before it can be understood, or an outdated response overwrites a newer user choice.

### Definition of Done

- The interaction contract covers success, pending, failure, and recovery.
- Native semantic controls and associated labels are used.
- Keyboard focus is visible and predictable.
- Pending feedback is immediate and does not imply confirmed success.
- Duplicate submissions are controlled at the UI layer and important operations are protected appropriately by the application.
- Failure preserves user input and provides a clear retry path.
- Status announcements are appropriate and not excessively noisy.
- Reduced-motion behavior preserves essential information.
- Responsive and touch layouts remain usable.
- Slow, failed, repeated, and stale-response scenarios are tested.
- Browser console and network behavior are checked with DevTools.
- Evaluation measures and guardrails are defined before testing.
- Implementation notes make state transitions and accessibility requirements unambiguous.
