---
# SKILL: portfolio-ab-test
**Layer:** 16 — SEO / Conversion
**Goal:** Run disciplined portfolio experiments that test a clear hypothesis, protect visitor trust, and use valid evidence to choose a design or content change.
---
## Why This Matters (Senior Perspective)
Portfolio redesigns often rely on personal taste: a different hero headline, project order, CTA label, or contact form is shipped because it feels stronger. Experiments can replace opinion with evidence, but only when the test has enough traffic, a meaningful outcome, and an implementation that does not introduce performance or accessibility regressions. Low traffic is common for personal portfolios, so a formal A/B test is not always the right method.

An experiment should not optimize clicks at the expense of qualified inquiries, clarity, or user trust. Define the hypothesis, primary metric, guardrails, exposure rules, and stopping criteria before seeing results. Randomization, sample size, repeated peeking, seasonality, and instrumentation errors can all create false winners. When volume is too low, use structured usability tests, moderated feedback, or sequential qualitative evidence rather than pretending a handful of conversions is statistically decisive.
---
## Core Concepts
### 1. Hypothesis and mechanism
State the audience, change, expected behavior, and reason. 'Variant B is prettier' is not a testable hypothesis; 'placing role and outcome above the fold will help recruiters identify relevance sooner' is.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “hypothesis and mechanism” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** State the audience, change, expected behavior, and reason. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Hypothesis and mechanism is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 2. Primary metric and guardrails
Choose one primary metric linked to the hypothesis and add guardrails for performance, accessibility, form errors, and lead quality. Avoid selecting whichever metric looks favorable after the test.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “primary metric and guardrails” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Choose one primary metric linked to the hypothesis and add guardrails for performance, accessibility, form errors, and lead quality. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Primary metric and guardrails is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 3. Random assignment
Assign visitors consistently to variants using a supported experiment platform or a carefully designed server-side method. Avoid flicker and avoid storing unnecessary identifiers.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “random assignment” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Assign visitors consistently to variants using a supported experiment platform or a carefully designed server-side method. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Random assignment is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 4. Exposure and denominator
Define whether the denominator is eligible visitors, visitors exposed to the element, or sessions. Keep the same definition for both variants and exclude internal test traffic.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “exposure and denominator” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Define whether the denominator is eligible visitors, visitors exposed to the element, or sessions. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Exposure and denominator is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 5. Sample size and uncertainty
Estimate the required sample using baseline rate, minimum detectable effect, significance level, and power. If traffic cannot support it, use a different research method.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “sample size and uncertainty” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Estimate the required sample using baseline rate, minimum detectable effect, significance level, and power. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Sample size and uncertainty is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 6. Duration and seasonality
Run through representative weekdays and traffic sources when possible. Do not stop early merely because one variant briefly leads.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “duration and seasonality” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Run through representative weekdays and traffic sources when possible. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Duration and seasonality is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 7. Instrumentation QA
Confirm that both variants fire the same events, that assignment is recorded correctly, and that success is measured after server confirmation.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “instrumentation qa” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Confirm that both variants fire the same events, that assignment is recorded correctly, and that success is measured after server confirmation. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Instrumentation QA is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 8. Accessibility and performance guardrails
Both variants must meet the same accessibility baseline and avoid materially slower rendering. A conversion lift does not justify a keyboard trap or a heavy layout shift.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “accessibility and performance guardrails” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Both variants must meet the same accessibility baseline and avoid materially slower rendering. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Accessibility and performance guardrails is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 9. Novelty and returning visitors
Consider whether visitors may see both variants or return during the test. Persist assignment only as needed and follow applicable consent and privacy requirements.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “novelty and returning visitors” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Consider whether visitors may see both variants or return during the test. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Novelty and returning visitors is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 10. Segment analysis
Predefine meaningful segments such as device class or landing page. Post-hoc slicing creates false discoveries when many comparisons are made.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “segment analysis” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Predefine meaningful segments such as device class or landing page. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Segment analysis is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 11. Decision rules
Define what counts as a win, loss, or inconclusive result before launch. An inconclusive test is a result, not a reason to pick the preferred design.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “decision rules” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Define what counts as a win, loss, or inconclusive result before launch. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Decision rules is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

### 12. Low-traffic alternatives
Use task-based usability sessions, structured interviews, click-path review, and before/after observation when a valid randomized test is infeasible.


```ts
type Variant = "control" | "treatment";

function recordExposure(variant: Variant) {
  // Record only a stable variant label, never form content or personal data.
  window.va?.("event", { name: "portfolio_experiment_exposure",
    data: { experiment: "hero-copy-v1", variant } });
}
```

**Before / after.** Before: the implementation treats “low-traffic alternatives” as a cosmetic checkbox and leaves its behavior implicit. After: the page model, markup, and release checks make the intended outcome explicit and testable.

**Gotcha.** Use task-based usability sessions, structured interviews, click-path review, and before/after observation when a valid randomized test is infeasible. Verify the behavior in the real production-like route, not only in an isolated component preview.


```text
Before: Low-traffic alternatives is assumed to work because the page looks correct.
After: test the rendered route, inspect the relevant output or event, and record the expected result.
```

---
## Relevant Patterns
### Pattern 1: Pre-registration note
Record hypothesis, audience, variants, primary metric, guardrails, sample estimate, duration, and stopping rule before launch.


```text
Trigger: a route or visitor reaches the pre-registration note workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 2: Feature-flag assignment
Serve a stable variant at the appropriate layer and ensure both variants preserve semantic structure and accessible behavior.


```text
Trigger: a route or visitor reaches the feature-flag assignment workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 3: Event parity check
Compare exposure and success event counts between variants before interpreting performance.


```text
Trigger: a route or visitor reaches the event parity check workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 4: Low-volume usability test
Give representative participants a task, observe whether they understand the next step, and record issues without leading them.


```text
Trigger: a route or visitor reaches the low-volume usability test workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 5: Experiment readout
Report sample, period, metric definition, effect estimate, uncertainty, guardrails, limitations, and decision.


```text
Trigger: a route or visitor reaches the experiment readout workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

### Pattern 6: Rollback plan
Define the kill switch and return to the control if errors, accessibility issues, or performance regressions exceed guardrails.


```text
Trigger: a route or visitor reaches the rollback plan workflow.
Action: validate required inputs, execute the smallest reliable implementation, and verify the observable output.
Failure path: log the route or variant and preserve a usable fallback.
```

---
## Common Mistakes
| Mistake | Why It Happens | Fix |
|---|---|---|
| Hypothesis is just a preference | The change has no predicted user behavior | Rewrite it to name the audience, expected action, mechanism, and measurable outcome. |
| Test stopped when favorite leads | Repeated peeking inflates false-positive risk | Follow the predeclared stopping rule and report any deviations explicitly. |
| Primary metric chosen after results | Analyst cherry-picks the best-looking outcome | Lock the primary metric and guardrails in the experiment note before assignment begins. |
| Too little traffic for inference | Noise dominates the observed difference | Estimate sample needs first; switch to qualitative testing if the portfolio cannot reach a useful sample. |
| Variants render with different delays | Flicker or loading time affects user behavior | Render the chosen variant consistently at the server or early app boundary and measure performance parity. |
| Success event fires on click | Abandoned or invalid submissions count as wins | Count success only after the backend confirms completion. |
| Many segments searched after launch | Chance findings appear significant | Limit confirmatory segments in advance and label exploratory analysis as exploratory. |
| Returning visitors see random variants | Experience becomes inconsistent and contaminates comparison | Use a privacy-appropriate stable assignment strategy and define its duration. |
| Accessibility is a secondary metric | A variant wins by making the experience harder to use | Set accessibility as a release gate, not an optional trade-off. |
| No rollback path exists | A broken variant stays live while the team investigates | Prepare a feature-flag off switch and test rollback before exposure. |
| Lead quantity ignores lead quality | Variant attracts low-fit or spam submissions | Use a predefined quality rubric and review qualified inquiries alongside volume. |
| Seasonal traffic is ignored | Different traffic sources are mistaken for variant effect | Run across representative periods or document the seasonal limitation. |
| Test changes multiple unrelated things | Cause of the outcome cannot be isolated | Test one coherent hypothesis at a time or use a properly designed factorial experiment. |
| Inconclusive result forced into a winner | Uncertainty is hidden by subjective judgment | Keep the control or choose using usability evidence, and document that statistical evidence was inconclusive. |

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
| Hypothesis | Audience, change, mechanism, outcome | Verified in the production-like route or documented as not applicable |
| Primary metric | Chosen before launch | Verified in the production-like route or documented as not applicable |
| Guardrails | Accessibility, performance, lead quality | Verified in the production-like route or documented as not applicable |
| Assignment | Stable and consistent | Verified in the production-like route or documented as not applicable |
| Exposure | Denominator defined | Verified in the production-like route or documented as not applicable |
| Sample | Estimate and feasibility checked | Verified in the production-like route or documented as not applicable |
| Duration | Stopping rule predeclared | Verified in the production-like route or documented as not applicable |
| Instrumentation | Events validated for both variants | Verified in the production-like route or documented as not applicable |
| Privacy | Identifiers minimized | Verified in the production-like route or documented as not applicable |
| Performance | No harmful flicker or layout shift | Verified in the production-like route or documented as not applicable |
| Accessibility | Both variants pass baseline | Verified in the production-like route or documented as not applicable |
| Segments | Confirmatory slices predeclared | Verified in the production-like route or documented as not applicable |
| Rollback | Kill switch tested | Verified in the production-like route or documented as not applicable |
| Readout | Uncertainty and limitations reported | Verified in the production-like route or documented as not applicable |
| Decision | Win, loss, or inconclusive handled honestly | Verified in the production-like route or documented as not applicable |

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

```ts
const experiment = {
  id: "hero-copy-v1",
  primaryMetric: "contact_submission_success",
  guardrails: ["lcp", "keyboard_access", "lead_quality"],
  stopRule: "Use the precomputed sample and duration; do not stop on a temporary lead."
};
```


```text
Hypothesis: showing role and outcome beside the hero project link will help hiring visitors identify relevance faster.
Primary metric: qualified contact submissions per eligible visitor.
Guardrails: accessibility, performance, and spam rate.
```


```js
function chooseVariant(stableAssignment) {
  return stableAssignment === "treatment" ? "treatment" : "control";
}
// Assignment must be stable for the defined experiment window.
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
