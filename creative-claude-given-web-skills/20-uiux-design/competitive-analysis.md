# SKILL: competitive-analysis
**Layer:** 20 — UI/UX Design
**Goal:** Conduct a traceable, task-based comparison of relevant alternatives and turn observed patterns into differentiated, testable design opportunities.

---

## Why This Matters (Senior Perspective)

Competitive analysis is not a screenshot collection or a ranking of which website feels prettiest. It is a structured investigation of how alternatives serve the same audience, communicate value, support tasks, and differentiate their experience. A weak analysis copies a competitor's hero section, calls a gradient a trend, and sends the client a deck full of unconnected observations. That often produces a derivative website that inherits the competitor's usability problems while failing to communicate the client's own strengths.

The production cost of shallow research appears later: the landing page promises the wrong thing, a mobile menu hides a conversion path, pricing language creates objections, a lead form asks for information before trust has been earned, or the team spends weeks implementing a feature that users do not value. Competitive analysis helps reduce those risks by identifying patterns across several alternatives, noticing where competitors leave user needs unresolved, and translating observations into testable opportunities. It does not prove what users want; it helps the team ask better questions and decide what to validate.

A senior designer separates evidence, interpretation, and recommendation. Evidence is what can be observed or sourced: the competitor offers a comparison table, places a demo CTA above the fold, or explains cancellation terms. Interpretation is a cautious explanation of why that choice might exist. Recommendation is a decision for the project, supported by audience needs and constraints. Beginners often collapse all three into “we should do this too.” Seniors ask which audience, which task, what trade-off, what proof, and what would make the pattern inappropriate for this product.

For portfolio, agency, and freelance work, this skill is especially useful before discovery workshops, proposals, redesigns, and positioning decisions. It gives a client a reasoned landscape view instead of subjective taste, helps scope the work around genuine gaps, and prevents a visual direction from being chosen before the market and audience context are understood. Treat the analysis as a dated snapshot: competitor offers, interfaces, prices, and messaging change. Record what was inspected, when it was inspected, and what remains unknown.

## Core Concepts


### 1. Define the competitive set

**Working model.** Competitors should be selected by the job customers are trying to complete, not only by industry labels. A direct competitor sells a similar solution; an indirect competitor solves the same problem another way; a substitute may be a spreadsheet, agency service, manual process, or doing nothing.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — A local project marketplace is competing not only with other marketplaces but also with student groups, college repositories, and self-built projects.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Define the competitive set</h2>
  <p>Choose alternatives that compete for the same audience's time, budget, trust, or workflow.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** List direct, indirect, and substitute alternatives, then explain the relevance of each in one sentence.

**Decision check.** Would a target user genuinely consider this alternative for the same job, budget, or outcome?

**Gotcha:** Gotcha: A famous brand is not automatically a relevant competitor if its audience, price, or business model is fundamentally different.


### 2. Choose an analysis question

**Working model.** A comparison without a question produces a long inventory. Pick the decision that the research must support: positioning, information architecture, conversion, trust, feature prioritisation, or visual direction.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — A redesign question might be: “What prevents a first-time visitor from understanding the offer and taking the next step?”:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Choose an analysis question</h2>
  <p>Write one decision question before opening the first competitor tab.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Convert the question into a checklist of observable evidence and a clear decision owner.

**Decision check.** Could two reviewers independently identify the evidence needed to answer the question?

**Gotcha:** Gotcha: Do not use a conversion question to justify collecting visual references only; inspect the complete path to conversion.


### 3. Separate evidence from interpretation

**Working model.** Observed facts and explanations must live in different fields. This distinction prevents a team from treating assumptions about business strategy as confirmed truth.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Record “pricing is linked from the main navigation” as an observation; record “the company may want price transparency to qualify leads” as an interpretation.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Separate evidence from interpretation</h2>
  <p>Use separate fields for observation, interpretation, confidence, and implication.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Label interpretations as hypotheses and state which additional evidence could confirm or reject them.

**Decision check.** Can a reader tell which sentence is observed fact and which is a hypothesis?

**Gotcha:** Gotcha: A screenshot can prove a visible placement, not the reason the company chose it or whether it works.


### 4. Build a comparable scorecard

**Working model.** Use shared criteria and consistent scales. A scorecard makes differences easier to discuss, but only if the definitions are stable and the scores do not pretend to be more objective than the evidence.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Evaluate every competitor on onboarding clarity, proof, CTA clarity, mobile navigation, and task completion using anchored 1–5 definitions.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Build a comparable scorecard</h2>
  <p>Define what a low, medium, and high score mean before scoring any site.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Score with anchored definitions, cite examples, and preserve important exceptions outside the total.

**Decision check.** Would the same evidence receive a similar score if another reviewer applied the rubric?

**Gotcha:** Gotcha: A single total score can hide a critical failure; preserve category-level notes and evidence.


### 5. Inspect the whole user journey

**Working model.** The homepage is only one part of the experience. Follow a realistic task through navigation, detail pages, forms, error states, confirmation, and support content where accessible.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — For a booking service, inspect search, filtering, detail, availability, checkout, validation, and confirmation—not only the hero.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Inspect the whole user journey</h2>
  <p>Follow one realistic task from entry point to completion or a documented stopping point.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Document each step, the next action offered, any blocked path, and the point where inspection ended.

**Decision check.** Have you noted where the journey could not be completed without unsafe or unauthorised actions?

**Gotcha:** Gotcha: Never submit real personal data, create unwanted accounts, or make purchases just to complete a benchmark.


### 6. Evaluate value proposition

**Working model.** Look for audience, problem, promised outcome, mechanism, and proof. Competitors may use similar words while targeting different users or reducing different risks.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Map each homepage headline to who it serves, the job it promises to solve, and the evidence that makes the promise credible.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Evaluate value proposition</h2>
  <p>Summarise the promise in one sentence and attach visible proof or mark proof as missing.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Compare the promise with the proof and the audience's likely questions before proposing new copy.

**Decision check.** Can a new visitor identify the audience, outcome, and reason to believe the promise?

**Gotcha:** Gotcha: Do not confuse a bold claim with a differentiated or believable value proposition.


### 7. Compare information architecture

**Working model.** Record navigation labels, grouping, page depth, search, and whether people can predict where important information lives.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Compare whether “Pricing,” “How it works,” “Case studies,” and “Support” are visible where a new visitor expects them.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Compare information architecture</h2>
  <p>Map labels and paths to user tasks rather than copying navigation labels.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Create a task-based sitemap and flag labels that are ambiguous, hidden, or inconsistent.

**Decision check.** Can users predict where to find the next piece of information from the label alone?

**Gotcha:** Gotcha: Matching competitor navigation item-for-item can reproduce their information architecture without matching your own content.


### 8. Audit conversion paths

**Working model.** Trace the primary and secondary calls to action, their destinations, and the friction encountered before a meaningful commitment.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Note CTA wording, destination, form length, trust cues, validation feedback, and whether a lower-commitment path exists.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Audit conversion paths</h2>
  <p>Record the action, destination, friction, trust support, and fallback path.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Recommend the smallest change that reduces a documented point of friction.

**Decision check.** Does every primary CTA have a clear destination and an understandable next step?

**Gotcha:** Gotcha: A visible CTA is not proof of conversion effectiveness; actual analytics or user testing is needed.


### 9. Review visual language in context

**Working model.** Assess hierarchy, type, colour, imagery, density, motion, and consistency as a system connected to brand positioning and task demands.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — A high-trust financial product may use restrained motion and explicit disclosure rather than copying a playful consumer app.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Review visual language in context</h2>
  <p>Connect each visual choice to brand intent, audience expectations, and usability.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Extract principles and constraints, not pixel-level copies of a competitor's signature design.

**Decision check.** Does the visual direction support comprehension and credibility instead of competing with them?

**Gotcha:** Gotcha: A competitor's polished aesthetic may be expensive, inaccessible, or unsuitable for your audience.


### 10. Inspect mobile and accessibility

**Working model.** Test narrow widths, keyboard navigation, visible focus, zoom, contrast, target size, and content order. Desktop screenshots conceal many important failures.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Use responsive browser tools and keyboard-only navigation to see whether menus, comparison tables, and forms remain usable.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Inspect mobile and accessibility</h2>
  <p>Test at narrow widths and with keyboard interaction before judging the design complete.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Record the viewport, input method, browser, and specific failure so another reviewer can reproduce it.

**Decision check.** Can the key task be completed without a mouse and at a narrow viewport?

**Gotcha:** Gotcha: Automated accessibility scores do not replace manual keyboard and screen-reader checks.


### 11. Analyse trust and risk reduction

**Working model.** Look for evidence that reduces uncertainty: transparent pricing, policies, testimonials with context, security explanations, author credentials, or clear support routes.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — A service that handles sensitive documents may need privacy details and process transparency before a user uploads a file.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Analyse trust and risk reduction</h2>
  <p>Record which uncertainty each trust element addresses and whether its source is credible.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Match each trust cue to a concrete user concern and verify its source before recommending it.

**Decision check.** Is the trust signal relevant, verifiable, current, and close to the decision it supports?

**Gotcha:** Gotcha: A badge or testimonial can be decorative rather than credible when its source, date, or relevance is unclear.


### 12. Identify feature and content gaps

**Working model.** A gap is a user need or task poorly served across alternatives, not merely a feature absent from a competitor.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — If competitors list capabilities but do not explain which plan fits which use case, a guided comparison may be an opportunity.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Identify feature and content gaps</h2>
  <p>Describe the unmet user need first, then consider a feature or content response.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Check whether the gap matters to the target audience before turning it into roadmap scope.

**Decision check.** Is the opportunity supported by more than one competitor omission or personal preference?

**Gotcha:** Gotcha: An absent feature may be intentionally excluded because it creates cost, risk, or complexity.


### 13. Interpret positioning and brand voice

**Working model.** Compare audience, tone, proof, promises, price framing, and category conventions. Look for meaningful contrast, not difference for its own sake.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — A premium service might distinguish itself through expert guidance and clear service levels rather than louder visuals.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Interpret positioning and brand voice</h2>
  <p>Compare audience, promise, tone, and proof as one positioning system.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Write a differentiated positioning hypothesis and check it against audience needs and proof.

**Decision check.** Can the proposed difference be explained without saying only “more modern” or “cleaner”?

**Gotcha:** Gotcha: A distinctive voice can still fail if users cannot understand the offer quickly.


### 14. Prioritise opportunities and validate

**Working model.** Rank recommendations by user impact, confidence, implementation effort, and strategic fit. State what experiment or research would change your mind.

In practice, treat this as a decision that needs evidence rather than a taste-based guess. Start by stating the user or business question, identify the observable signal that would answer it, and record the source and date. A design decision becomes more reliable when another person can reproduce the reasoning without having to agree with the designer's personal preferences.

**Applied example — Prototype a clearer pricing comparison and test whether users can choose the right plan before committing engineering time.:**

```html
<section class="research-panel" aria-labelledby="research-panel-title">
  <h2 id="research-panel-title">Prioritise opportunities and validate</h2>
  <p>Choose the next test based on impact, confidence, cost, and reversibility.</p>
  <button class="research-panel__action" type="button">Review evidence</button>
</section>
```

```css
.research-panel {
  max-inline-size: 72rem;
  margin-inline: auto;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  border: 1px solid var(--line, #d8dce3);
  border-radius: 1rem;
  background: var(--surface, #fff);
  color: var(--text, #202735);
}

.research-panel__action {
  min-block-size: 2.75rem;
  padding-inline: 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: var(--accent, #315ee8);
  color: white;
  font: inherit;
  cursor: pointer;
}

.research-panel__action:focus-visible {
  outline: 3px solid var(--focus, #f0a500);
  outline-offset: 3px;
}
```

The markup uses a named section and a real button rather than making a generic container behave like a control. The CSS gives the review surface a bounded reading width, responsive padding, and an explicit keyboard focus state. In a real project, replace the sample copy with the actual evidence or reference being reviewed; keep the underlying structure if it supports the task.

**Naive approach / wrong:** “This looks more modern to me, so it must be the better direction.” That statement has no observable criterion, no evidence trail, and no connection to the audience's task.

**Correct approach:** Turn each priority into a testable change with a success signal and a fallback decision.

**Decision check.** What result would cause the team to abandon or revise this recommendation?

**Gotcha:** Gotcha: Competitor analysis generates hypotheses; it does not establish causation or replace user research.


## Relevant Patterns / Integration Patterns / Advanced Patterns


### Pattern 1: Task-based benchmark

**What it does:** Compare alternatives while completing the same defined task, so differences are tied to user outcomes rather than arbitrary browsing.

**When to use it:** When evaluating search, onboarding, pricing, lead generation, checkout, or account setup.

```text
Pattern: Task-based benchmark
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Keep task scope and test conditions consistent across alternatives.


### Pattern 2: Evidence ledger

**What it does:** Store observations, screenshots, source URLs, dates, and confidence in one traceable record.

**When to use it:** When multiple reviewers or stakeholders need to audit the analysis later.

```text
Pattern: Evidence ledger
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Do not store private user data or bypass access controls to obtain evidence.


### Pattern 3: Opportunity matrix

**What it does:** Plot user impact against confidence and implementation effort to prioritise next steps.

**When to use it:** When the audit produces more ideas than the project can responsibly implement.

```text
Pattern: Opportunity matrix
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Use the matrix to support discussion, not to manufacture false numerical precision.


### Pattern 4: Positioning map

**What it does:** Compare two meaningful dimensions such as self-serve versus guided and low-cost versus specialist.

**When to use it:** When a client needs a market narrative or a distinct brand direction.

```text
Pattern: Positioning map
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Do not use arbitrary axes that make the client look best by design.


### Pattern 5: Friction-path audit

**What it does:** Trace the user's path and mark ambiguity, unnecessary steps, missing reassurance, and blocked states.

**When to use it:** When conversion or task completion is the main project concern.

```text
Pattern: Friction-path audit
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Do not infer real conversion rates from the visible interface.


### Pattern 6: Design-pattern synthesis

**What it does:** Group recurring interface patterns and identify where a convention helps or harms the target audience.

**When to use it:** When the team needs inspiration without copying competitors.

```text
Pattern: Design-pattern synthesis
1. State the question this pattern must answer.
2. Gather comparable evidence from the same audience/task context.
3. Separate observation from interpretation.
4. Record the implication and the next validation step.
```

**Operational note:** Avoid copying proprietary assets, exact copy, or distinctive branded compositions.


## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|

| Choosing only famous competitors | Brand awareness is mistaken for audience relevance | Include direct, indirect, and substitute solutions selected by the same user job. |

| Comparing different tasks | The analysis confuses product differences with task differences | Define one task script and use it consistently for every alternative. |

| Treating screenshots as proof of performance | Visual evidence is mistaken for analytics | Label conversion and retention claims as unknown unless reliable data supports them. |

| Mixing facts and opinions | The reviewer writes interpretation as if it were observable | Use separate observation, hypothesis, and recommendation fields. |

| Using an undefined scoring scale | Scores reflect personal taste and vary between reviewers | Write anchored score definitions before inspecting competitors. |

| Overweighting the homepage | The most visible page crowds out critical task steps | Inspect the same end-to-end journey on each alternative. |

| Ignoring indirect substitutes | The analysis misses the workflow users already rely on | Ask what users do if every direct competitor disappears. |

| Copying competitor UI literally | Surface similarity replaces strategic differentiation | Extract the underlying principle and design a distinct implementation. |

| Assuming missing means needed | A competitor's absent feature becomes an untested roadmap item | Validate the user need and operational cost before proposing the feature. |

| Ignoring mobile behaviour | Desktop screenshots conceal collapsed navigation and overflow | Repeat priority tasks at narrow widths and record viewport details. |

| Skipping keyboard testing | Mouse-only inspection misses focus and interaction failures | Navigate the core path with Tab, Shift+Tab, Enter, Space, and Escape where relevant. |

| Recording stale information | Pricing, messaging, and product flows change over time | Timestamp each capture and re-check high-impact claims before delivery. |

| Using unverified testimonials | Trust elements are treated as automatically credible | Record source, context, date, and whether the claim can be independently checked. |

| Confusing novelty with opportunity | Unusual design is valued without evidence of usefulness | Tie each opportunity to an audience need and a measurable next test. |

| Writing recommendations without owners | The deck creates discussion but no action | Assign an owner, expected outcome, effort range, and review date to every priority. |

| Treating analysis as user research | Competitor behaviour is assumed to represent customer preference | Validate the highest-risk hypotheses with target users or behavioural data. |


## Mental Models


1. **Alternatives compete for a job** — The relevant landscape is defined by what users are trying to accomplish, not by company category alone.

2. **Evidence is not explanation** — A visible pattern is observable; its motive and effectiveness require additional evidence.

3. **Similarity is a clue, not a mandate** — Repeated conventions may signal expectations, but they still need to fit your product and audience.

4. **Gaps need demand** — An absent feature becomes an opportunity only when a meaningful user need exists.

5. **Confidence should be visible** — A recommendation with weak evidence should be labelled as a hypothesis and tested cheaply.

6. **Analysis is a dated snapshot** — Competitor interfaces, prices, and offers evolve; every important claim needs a capture date.

7. **Differentiate at the value level** — Meaningful differentiation comes from audience, promise, proof, and service—not decoration alone.

8. **Prioritise learning before build cost** — A prototype or short test can reduce uncertainty before engineering commits to a large solution.


## Quick Reference

| Situation | Recommended move | Evidence to capture |
|---|---|---|

| Starting a client redesign | Define audience, business objective, and analysis question | One-page brief with decision owner |

| Too many competitors | Select a representative set of direct, indirect, and substitute options | Inclusion rationale per competitor |

| Conflicting stakeholder opinions | Apply a shared scorecard with anchored definitions | Scores plus source examples |

| Need a differentiated message | Compare audience, outcome, mechanism, and proof | Positioning matrix |

| Low landing-page conversion | Trace CTA and form friction across alternatives | Journey map with uncertainty points |

| Feature prioritisation | Identify user need before naming a feature | Opportunity matrix |

| Mobile redesign | Repeat task-based benchmark at narrow width | Viewport and interaction notes |

| Trust-sensitive product | Audit disclosure, support, policies, and verifiable proof | Trust cue ledger |

| Design inspiration requested | Cluster patterns and explain why they work | Pattern synthesis with original adaptation |

| Client asks to copy competitor | Translate reference into principles and constraints | Non-copying design brief |

| Stakeholders question a claim | Open the evidence ledger and source capture | URL, date, observation, confidence |

| Audit is getting stale | Re-check high-impact facts before presentation | Updated timestamp and change notes |


## Build Challenge

### Build: Competitive Landscape and Opportunity Report

Create a competitive landscape report for a fictional subscription-based service that helps small teams organise client projects. Include three direct alternatives, two indirect substitutes, and a clearly scoped target audience. The report must inform the first version of the service website; it must not pretend to know private analytics or invent customer research.

Deliver a review-ready artifact, not a pile of screenshots. The work should make the reasoning legible to a client, developer, or another designer who did not participate in the research. Use clear headings, meaningful labels, accessible semantic structure, and visible source notes. When presenting the result, distinguish facts from hypotheses and recommendations.

**Requirements**


1. Write a one-paragraph research brief naming the audience, business decision, and exclusions.

2. Choose five alternatives and explain why each belongs in the set.

3. Create a dated evidence ledger with at least four comparable observations per alternative.

4. Inspect the same user task on every alternative and document the path, key choices, and stopping point.

5. Compare value proposition, proof, information architecture, conversion path, mobile behaviour, and trust signals.

6. Use an anchored scorecard and preserve category-level notes instead of relying on one aggregate score.

7. Include at least six screenshots or written capture descriptions with source URLs and dates.

8. Separate observations, interpretations, and recommendations using visible labels.

9. Identify at least three user-needs gaps and explain why each may matter to the target audience.

10. Prioritise five opportunities by impact, confidence, effort, and strategic fit.

11. Write one positioning hypothesis that differentiates the service without copying competitor language or visuals.

12. Design a low-cost validation plan for the two highest-risk recommendations.

13. Run the failure drill: challenge one recommendation and mark what evidence would change it.

14. Present the report with semantic headings, readable tables, descriptive links, and keyboard-visible focus states.


### Definition of Done / Success Criteria


- [ ] Every competitor is relevant to a named audience job and has an inclusion rationale.

- [ ] Evidence includes dates and sources; unsupported assumptions are clearly labelled.

- [ ] All alternatives are compared using the same task and scorecard definitions.

- [ ] Recommendations connect to a user need, a strategic implication, and a next validation step.

- [ ] At least one conclusion is revised or explicitly downgraded after the failure drill if evidence is weak.

- [ ] The report distinguishes competitor interface observations from actual business-performance claims.

- [ ] The final presentation is readable on mobile and keyboard operable.

- [ ] The client can identify the top three actions, owners, and unresolved questions within five minutes.


### Failure drill

Ask a teammate to challenge one of the strongest recommendations. Remove the visual polish from the presentation and check whether the evidence still supports the conclusion. If the recommendation collapses when the style is stripped away, label it as a hypothesis, collect the missing evidence, and revise the artifact rather than defending a weak claim.

### Debug checklist

- Can every important conclusion be traced to a source, observation, or explicit hypothesis?
- Are comparisons made on equivalent tasks, devices, content types, and audience needs?
- Have you checked the actual interface in browser DevTools at desktop and narrow viewport widths where a website is part of the review?
- Are links, buttons, headings, and form controls semantic and keyboard reachable, with visible `:focus-visible` states?
- Does the artifact explain what should be done next, who should do it, and what evidence would confirm success?
- Are image rights, source credits, dates, and assumptions visible enough for a client handoff?

### Browser and tooling notes

Use browser DevTools to inspect responsive behaviour, typography, image crops, interaction states, and contrast when reviewing live sites. Browser support varies for newer CSS features; test the actual target browsers rather than assuming that a reference screenshot proves compatibility. Figma, a spreadsheet, a shared document, and a simple screenshot archive can all work, provided the method is consistent and evidence is traceable.

## Fieldwork Protocol: Make the Comparison Reproducible

### Practice Note 1: Sampling and scope

Choose a practical sample that represents different ways of solving the job. A set of five carefully selected alternatives is often more useful than twenty loosely relevant names. Explain why the sample is sufficient for the current decision, and state what it does not represent. If the client operates in multiple countries or segments, avoid pretending that one local sample represents every market.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 2: Capture protocol

For each alternative, record the exact URL, date, viewport, browser, input method, and task script. Save screenshots only where they help explain a finding. Keep the notes readable enough that another reviewer can repeat the inspection. If a page is inaccessible, record the limitation instead of filling the gap with an assumption.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 3: Evidence confidence

Use a simple confidence vocabulary: high means the claim is directly visible or supported by a reliable public source; medium means the interpretation is plausible but incomplete; low means important context is missing. Confidence refers to the claim, not to the reviewer's general confidence or seniority. A low-confidence insight can still be worth testing if the potential impact is high.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 4: Ethical boundaries

Use public information and normal user-facing flows. Do not circumvent authentication, scrape personal data, impersonate customers, or violate terms of access. Do not publish sensitive information accidentally visible in a screenshot. Competitive research should improve your own decisions, not expose private information.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 5: From findings to requirements

Phrase a requirement as a user outcome, not a competitor feature. “Help first-time visitors compare the service tiers without opening five pages” is more durable than “copy Competitor C's pricing cards.” Include acceptance criteria and an explicit non-goal to protect scope.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 6: Communicating uncertainty

Use labels such as observed, inferred, unknown, and validate. Stakeholders should be able to see where the team has strong evidence and where it is making a strategic bet. Uncertainty is not a flaw in the report; hiding uncertainty is.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 7: Designing a follow-up experiment

For a high-priority opportunity, choose a small test that can disconfirm the idea. A five-person moderated task test, a clickable prototype, a copy comparison, or a content comprehension check may be enough to uncover major confusion before implementation. Define the success signal and decision rule in advance.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 8: Reporting to different audiences

Executives need the decision, business implication, and risk. Designers need patterns, examples, and constraints. Developers need states, content requirements, and acceptance criteria. Keep one evidence base but tailor the presentation layer to the audience.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Practice Note 9: Maintaining the benchmark

Revisit the report when the product, market, pricing, or major competitor changes. Do not rerun everything on a fixed schedule without reason; update the evidence that could change a current decision. Mark older findings as stale rather than silently presenting them as current.

**Apply it:** Write down the decision, the evidence that supports it, the assumption that remains, and the smallest next action that could resolve the uncertainty. For this skill, a complete note should be usable by someone who was not in the original meeting.

### Review meeting agenda

1. Restate the project question and the audience affected.
2. Review evidence and its limitations before discussing recommendations.
3. Identify the two most important opportunities or direction principles.
4. Name risks, constraints, and unresolved questions.
5. Agree on an owner, next step, and validation signal for each decision.

### Documentation standard

Every exported report or board should include a title, project context, author or owner, version, date, source notes, and a short decision summary. Avoid relying on colour alone to communicate status. Use meaningful headings, descriptive links, semantic lists, and visible keyboard focus where the artifact is interactive. If the document is a static PDF, preserve readable contrast and ensure labels remain legible when viewed on a laptop screen or printed at ordinary size.

