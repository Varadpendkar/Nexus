---
# SKILL: cta-placement
**Layer:** 16 — SEO / Conversion
**Goal:** Place calls to action where visitor intent is highest, with clear language, accessible interaction, and measurement that reflects qualified outcomes.
---
## Why This Matters (Senior Perspective)
A call to action is the bridge between interest and the next useful step. A portfolio can attract attention but still lose potential clients or recruiters if the next action is hidden, vague, repeated without context, or presented before visitors understand the work. Placement must follow the user's decision process rather than a designer's preference for a visually balanced page.

Conversion work is not a license to manipulate visitors. The strongest CTA explains what happens next, sets realistic expectations, and preserves user control. Measure the quality of actions—completed contact forms, meaningful project inquiries, or booked conversations—not just button clicks. A click can indicate curiosity, accidental activation, or confusion, so it is only one part of the funnel.
---
## Core Concepts
### 1. Intent and information scent
Match the CTA to the visitor's current question. A hero CTA may offer selected work; a detailed case study can invite a conversation about a similar problem.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “intent and information scent” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Match the CTA to the visitor's current question. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Intent and information scent is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 2. Primary and secondary actions
Give the page one dominant action and use secondary links for lower-commitment exploration. Equal visual weight creates a choice problem when actions have different business value.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “primary and secondary actions” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Give the page one dominant action and use secondary links for lower-commitment exploration. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Primary and secondary actions is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 3. Copy that sets expectations
Use verbs and concrete outcomes: 'Discuss a project' is clearer than 'Let's go'. Avoid false urgency, unsupported response-time claims, or wording that implies a commitment the user has not made.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “copy that sets expectations” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use verbs and concrete outcomes: 'Discuss a project' is clearer than 'Let's go'. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Copy that sets expectations is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 4. Placement by page section
Place CTAs after context has answered the likely objection. Repeat an action when the page introduces a new decision point, not mechanically after every section.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “placement by page section” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Place CTAs after context has answered the likely objection. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Placement by page section is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 5. Form friction and qualification
Ask only for information needed for the next step. Explain why required fields exist and allow a visitor to submit without being forced to reveal unnecessary personal data.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “form friction and qualification” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Ask only for information needed for the next step. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Form friction and qualification is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 6. Responsive and sticky CTAs
A fixed mobile action can help when it stays out of the way of content, browser controls, and keyboard focus. Test short viewports and safe-area insets.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “responsive and sticky ctas” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** A fixed mobile action can help when it stays out of the way of content, browser controls, and keyboard focus. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Responsive and sticky CTAs is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 7. Accessibility and semantics
Use anchors for navigation and buttons for in-page actions. Ensure focus visibility, accessible names, sufficient target size, and status messages after form submission.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “accessibility and semantics” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use anchors for navigation and buttons for in-page actions. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Accessibility and semantics is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 8. Trust and evidence
Place proof near consequential actions: relevant case study, role, process, or a truthful expectation of the response. Do not manufacture testimonials or client logos.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “trust and evidence” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Place proof near consequential actions: relevant case study, role, process, or a truthful expectation of the response. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Trust and evidence is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 9. Event measurement
Track CTA exposure, click, form start, validation error, and successful submission separately. Use a consistent event schema and avoid sending personal information to analytics.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “event measurement” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Track CTA exposure, click, form start, validation error, and successful submission separately. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Event measurement is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 10. Experiment design
Change one meaningful variable at a time where possible, define a primary metric before launch, and avoid declaring a winner from a handful of visits.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “experiment design” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Change one meaningful variable at a time where possible, define a primary metric before launch, and avoid declaring a winner from a handful of visits. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Experiment design is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 11. Failure and loading states
Prevent duplicate submissions and show useful progress and error feedback. A CTA that visually responds but loses the request damages trust.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “failure and loading states” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Prevent duplicate submissions and show useful progress and error feedback. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Failure and loading states is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 12. Ethical conversion
Make dismissals and opt-outs easy, avoid deceptive button styling, and ensure secondary choices remain visible and understandable.


```html
<section class="project-next-step" aria-labelledby="next-step-title">
  <h2 id="next-step-title">Have a similar product challenge?</h2>
  <p>I can help scope the problem and explore practical next steps.</p>
  <a class="button button--primary" href="/contact/">Discuss a project</a>
</section>
```

**Before / after.** Before: the implementation treats “ethical conversion” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Make dismissals and opt-outs easy, avoid deceptive button styling, and ensure secondary choices remain visible and understandable. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Ethical conversion is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

---
## Relevant Patterns
### Pattern 1: Hero CTA pair
Use a clear primary contact or work-discovery action plus a lower-emphasis alternative, with one sentence of context.


```text
Trigger: a route or visitor reaches the hero cta pair workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 2: Case-study end CTA
Connect the project outcome to a relevant next step, such as discussing a similar challenge or viewing related work.


```text
Trigger: a route or visitor reaches the case-study end cta workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 3: Contact form CTA
Name the action precisely, disable duplicate submission while pending, and announce success or recoverable failure accessibly.


```text
Trigger: a route or visitor reaches the contact form cta workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 4: Mobile action bar
Show only when it adds value, respect safe areas, and hide it when it obscures focused fields or the footer.


```text
Trigger: a route or visitor reaches the mobile action bar workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 5: Event funnel
Use stable event names and non-sensitive parameters to distinguish view, click, start, validation, and success.


```text
Trigger: a route or visitor reaches the event funnel workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 6: CTA review checklist
Evaluate hierarchy, placement, copy, keyboard behavior, responsive overlap, and truthful expectations before shipping.


```text
Trigger: a route or visitor reaches the cta review checklist workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

---
## Common Mistakes
| Mistake | Why It Happens | Fix |
|---|---|---|
| Every button has equal prominence | Visual hierarchy fails to express the next best action | Reserve filled high-contrast treatment for the primary action and style exploration links as secondary. |
| CTA appears before any context | Visitors are asked to commit before understanding value | Add a concise value statement or proof point immediately before the action. |
| Vague button label | Visitors cannot predict what will happen | Replace abstract copy with a verb and expected destination or outcome. |
| Sticky bar covers focused field | Mobile layout ignores keyboard and viewport changes | Use visual viewport-aware behavior or hide the bar while form controls are focused. |
| Click is counted as conversion | Analytics reports intent as completed outcome | Record success only after the server confirms the action and keep click events separate. |
| Form asks for unnecessary personal data | Friction and privacy exposure increase without business benefit | Remove fields that do not change the next response or explain a legitimate requirement. |
| Submit button has no pending state | Repeated clicks create duplicate requests | Set an in-flight state, enforce server-side idempotency where appropriate, and restore controls on failure. |
| CTA promises an exact reply time without capacity | Expectation can be broken during busy periods | Use a realistic, maintained service expectation or omit the promise entirely. |
| Secondary action is visually hidden | Visitors who are not ready to convert lose a useful path | Keep a clear lower-commitment route such as selected work or process details. |
| Focus ring removed for aesthetics | Keyboard users lose their location | Design a visible focus indicator that fits the visual system instead of removing it. |
| Error appears only by color | Some visitors cannot identify what needs fixing | Pair color with text and programmatic field association. |
| A/B test runs with no hypothesis | Results encourage random design churn | Write the expected behavior change, primary metric, guardrails, and decision rule before starting. |
| Success message is not announced | Screen-reader users may not know submission completed | Use an appropriate live region and move focus only when doing so improves the flow. |
| CTA appears after irrelevant content | The next step is detached from visitor intent | Place the action beside the proof or explanation that makes it relevant. |

---
## Mental Models
1. **Intent before implementation:** A page or event exists to answer a visitor question or a product decision.
2. **HTML is the source of meaning:** Visual effects should enhance content rather than hide the page's essential purpose.
3. **Evidence beats certainty:** Measurement supports a decision; it does not guarantee rankings or prove causation by itself.
4. **One URL, one canonical purpose:** Consistent URLs and links reduce ambiguity for users, crawlers, and analytics.
5. **Failures need a designed path:** Missing data, blocked scripts, and network errors must not erase the useful experience.
6. **Privacy is a product requirement:** Collect only the information needed to improve the experience and protect it deliberately.
7. **Ship a reversible change:** A launch is safer when verification and rollback are planned before release.

---
## Quick Reference
| Area | Check | Expected result |
|---|---|---|
| Primary action | One dominant next step per view | Verified in the production-like route or documented as not applicable |
| Label | Specific, truthful, action-oriented | Verified in the production-like route or documented as not applicable |
| Hierarchy | Secondary actions remain distinct | Verified in the production-like route or documented as not applicable |
| Context | Value and proof precede commitment | Verified in the production-like route or documented as not applicable |
| Placement | Matches page intent | Verified in the production-like route or documented as not applicable |
| Mobile | No overlap with content or keyboard | Verified in the production-like route or documented as not applicable |
| Semantics | Correct anchor/button element | Verified in the production-like route or documented as not applicable |
| Keyboard | Visible focus and logical order | Verified in the production-like route or documented as not applicable |
| Contrast | Text and controls remain legible | Verified in the production-like route or documented as not applicable |
| Form | Only necessary fields | Verified in the production-like route or documented as not applicable |
| Pending | Duplicate submissions prevented | Verified in the production-like route or documented as not applicable |
| Errors | Textual and programmatically associated | Verified in the production-like route or documented as not applicable |
| Success | Confirmed and announced | Verified in the production-like route or documented as not applicable |
| Analytics | Click separated from completion | Verified in the production-like route or documented as not applicable |
| Ethics | No fake urgency or hidden opt-outs | Verified in the production-like route or documented as not applicable |

---
## Build Challenge
Build a production-ready implementation for a creative portfolio with a homepage, three case studies, a contact route, and responsive navigation. The challenge is complete only when the following requirements are satisfied:

- [ ] Create a clear route model with unique page data and a documented fallback.
- [ ] Keep essential text, headings, and navigation in semantic HTML.
- [ ] Use meaningful names and comments that explain why a non-obvious decision exists.
- [ ] Validate required inputs at build time or before a request is processed.
- [ ] Support narrow mobile viewports and keyboard-only interaction.
- [ ] Handle missing assets and optional data without breaking the page.
- [ ] Keep personal information out of analytics event payloads.
- [ ] Define a verification step for generated metadata, previews, events, or experiment assignment.
- [ ] Document the release checks and a practical rollback procedure.
- [ ] Record one primary success metric and at least one quality or accessibility guardrail.

### Implementation starter

```html
<form action="/api/contact" method="post">
  <label for="project-email">Email address</label>
  <input id="project-email" name="email" type="email" autocomplete="email" required>
  <button type="submit">Send project inquiry</button>
</form>
```


```js
button.disabled = true;
button.textContent = "Sending…";
// Restore the button on recoverable failure; show a textual status message.
```


```css
.button:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
.button--primary { min-height: 44px; padding-inline: 1.25rem; }
```

### Definition of done / Success criteria
- The implementation has no broken links, missing required fields, or console errors on the supported routes.
- The relevant output is verified: search metadata, generated image, CTA completion, analytics event, or experiment assignment.
- Keyboard interaction and narrow viewport behavior are checked, not assumed.
- No personal data is exposed through public metadata or analytics events.
- The fallback and rollback path are documented and tested.
- The owner can explain the metric, its denominator, and what evidence would change the next decision.

### Production review notes
Treat platform behavior as something to verify against current official documentation. Search engines and social networks may rewrite titles, cache previews, or change reporting interfaces. Do not promise ranking positions, guaranteed social preview refresh times, statistical certainty from inadequate samples, or a specific conversion lift. For legal/privacy questions, document the implementation and seek qualified advice where required; this skill is technical guidance, not a legal guarantee.
