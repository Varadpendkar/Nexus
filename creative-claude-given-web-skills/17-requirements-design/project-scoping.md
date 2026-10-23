# SKILL: project-scoping
**Layer:** 17 — Requirements & Design
**Goal:** Define a feasible project boundary, prioritize outcomes transparently, and manage trade-offs using evidence, estimates, dependencies, and explicit acceptance conditions.

---

## Why This Matters (Senior Perspective)

Requirements and design process is where delivery risk is either reduced cheaply or pushed into implementation, where it becomes expensive. A polished screen can still solve the wrong problem; a well-estimated sprint can still deliver a feature nobody needs. This skill treats evidence, decisions, and verification as a connected system rather than paperwork performed before “real work” starts.

For creative web and freelance work, unclear expectations are especially costly: clients often describe a visual solution before the audience, content, operating constraints, or success measure is clear. The senior approach is to make assumptions visible, test risky choices early, record decisions, and translate the agreed outcome into artifacts that design, engineering, QA, and the client can all inspect.

## Core Concepts

### 1. Problem statement and measurable outcome

Scope starts with a problem and desired result, not a list of screens. Define the audience, current pain, target behavior, constraints, and how success will be observed. If the outcome cannot be measured directly, choose a credible proxy and state its limitations.

**Working pattern**

```text
project_brief = {
    "problem": "Qualified prospects struggle to identify relevant studio work",
    "audience": "Marketing leads evaluating a creative partner",
    "outcome": "More qualified enquiries from case-study visitors",
    "measure": "Qualified enquiry rate and completion rate",
    "guardrail": "No increase in inaccessible interactions or page failures",
}
# Outcome and guardrail prevent scope from optimizing one metric at any cost.
```

**Gotcha:** “Build a modern website” does not define a boundary or a test of success.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 2. In-scope, out-of-scope, and assumptions

Write explicit inclusions and exclusions. State what the first release will do, what it will not do, and what assumptions could change the estimate. Out-of-scope items are not unimportant; they are consciously deferred and can be reconsidered through change control.

**Working pattern**

```text
scope = {
    "in": ["Project index and filters", "Case-study templates", "Accessible enquiry form"],
    "out": ["Client portal", "Automated proposal generation", "Multilingual CMS"],
    "assumptions": ["Client supplies approved copy and project images"],
}
# Explicit exclusions reduce accidental commitments during reviews.
```

**Gotcha:** “We will see if there is time” is not a scope decision; it creates an unpriced promise.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 3. MoSCoW prioritization with a worked example

MoSCoW classifies work as Must have, Should have, Could have, or Won’t have for this release. A Must have is necessary for the release outcome or a binding constraint, not merely the stakeholder’s favorite feature. Revisit categories when budget or evidence changes.

**Working pattern**

```text
moscow = {
    "Must have": ["Responsive project pages", "Accessible enquiry submission"],
    "Should have": ["Service filters", "Related project links"],
    "Could have": ["Subtle decorative motion"],
    "Won't have this release": ["Interactive 3D configurator"],
}
# The 3D configurator may be valuable later, but it is not required to validate enquiry demand.
```

**Gotcha:** If every item is Must have, the framework has not helped the team make a trade-off.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 4. RICE and confidence-aware ranking

RICE estimates Reach, Impact, Confidence, and Effort to compare candidates. Scores are only useful when definitions and time horizons are consistent. Keep confidence visible; uncertain high-impact ideas often deserve research or a prototype rather than immediate full implementation.

**Working pattern**

```text
candidate = {"reach": 600, "impact": 2, "confidence": 0.7, "effort": 3}
rice_score = candidate["reach"] * candidate["impact"] * candidate["confidence"] / candidate["effort"]
# Compare candidates with the same units; document assumptions and confidence source.
```

**Gotcha:** A decimal score is not precise evidence. Avoid ranking ideas from estimates that use incompatible scales.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 5. Effort, uncertainty, and risk buffers

Estimate work with engineering, design, QA, content, and operations input. Separate known implementation effort from discovery uncertainty and external dependency risk. Use ranges when details are unknown; do not disguise uncertainty with a single exact date.

**Working pattern**

```text
estimate = {
    "design_and_validation_days": (3, 5),
    "implementation_days": (6, 10),
    "qa_and_accessibility_days": (2, 4),
    "external_risk": "CRM credentials and delivery contract not yet confirmed",
}
# Re-estimate when the dependency is resolved rather than treating the range as a guarantee.
```

**Gotcha:** Adding an arbitrary percentage buffer cannot compensate for an unknown integration contract.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 6. Dependencies and critical path

List decisions, assets, systems, and approvals that must arrive before work can finish. Identify dependencies on the critical path and assign an owner and required-by date. If a dependency slips, choose a fallback or explicitly revise the milestone.

**Working pattern**

```text
dependencies = [
    {"item": "Approved case-study metrics", "owner": "Client marketing", "needed_by": "Before hi-fi review"},
    {"item": "CRM sandbox credentials", "owner": "Client IT", "needed_by": "Before integration test"},
    {"item": "Privacy notice approval", "owner": "Client legal", "needed_by": "Before launch"},
]
# Track the actual dependency status, not only the date an email was sent.
```

**Gotcha:** A schedule that assumes all external approvals arrive instantly is a wish, not a plan.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 7. Release slices and minimum viable scope

Choose a release that delivers a complete user outcome and tests the key assumption. A minimum viable release is not a half-finished interface; it is the smallest coherent path that provides value and yields evidence. Keep quality and security requirements intact when cutting optional features.

**Working pattern**

```text
release_one = [
    "Find a relevant project",
    "Understand the studio's role and outcome",
    "Submit an accessible enquiry",
    "Receive truthful confirmation",
    "Ensure the team can recover failed CRM delivery",
]
# Cut decorative extras before cutting the reliability of the core journey.
```

**Gotcha:** Shipping only the project grid without a credible contact path does not validate the business outcome.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 8. Change requests and scope negotiation

For each change, record the desired benefit, urgency, effort, dependencies, risks, and what would move out if it enters scope. A change is a trade-off, not a free addition. Get the accountable decision-maker to approve revised scope, cost, or timing.

**Working pattern**

```text
change = {
    "request": "Add an interactive 3D hero",
    "benefit": "Increase differentiation",
    "unknowns": ["Mobile performance", "Reduced-motion alternative", "Asset pipeline"],
    "tradeoff": "Would displace service filters or extend launch",
    "decision": "Prototype only after core journey passes validation",
}
# Offer options rather than saying yes to every new request.
```

**Gotcha:** A change log without impact analysis records churn but does not protect delivery.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 9. Acceptance, exclusions, and definition of done

Define completion in terms of agreed outcomes, requirements, and quality. Include supported viewports, accessibility, content approvals, analytics semantics, error handling, deployment, and handover where applicable. Explicitly identify what is not being certified, such as third-party uptime beyond your control.

**Working pattern**

```text
definition_of_done = [
    "Must-have acceptance criteria pass",
    "Responsive and keyboard behavior reviewed",
    "Form failure and CRM retry paths tested",
    "Approved content and privacy copy published",
    "Monitoring, rollback, and handover notes complete",
]
# Release readiness is a product decision backed by evidence, not a feeling.
```

**Gotcha:** “Looks finished on my laptop” is not an acceptance test for a public client site.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 10. Scope by constraints and non-functional requirements

Budget, deadline, platform, browser support, accessibility, privacy, security, performance, and maintainability are scope constraints. Make them visible before estimation. Cutting quality attributes late often produces expensive rework or unacceptable risk.

**Working pattern**

```text
constraints = {
    "platform": "Existing CMS and hosting",
    "accessibility": "Keyboard-operable core journey and reviewed semantics",
    "performance": "Documented image and script budgets",
    "privacy": "Collect only enquiry data required for follow-up",
    "motion": "Provide reduced-motion behavior and non-WebGL fallback",
}
# Constraints guide the solution space; they are not optional polish tasks.
```

**Gotcha:** If a performance target appears only at QA, the chosen hero architecture may already make it difficult to meet.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 11. Stakeholder alignment and decision log

Use a decision log to capture the question, options, evidence, decision owner, rationale, date, and revisit trigger. This reduces repeated debates and helps new team members understand why a tempting feature was deferred. Escalate conflicts according to agreed decision rights.

**Working pattern**

```text
decision = {
    "question": "Should the first release include WebGL?",
    "options": ["Static editorial hero", "Lightweight motion", "Full 3D scene"],
    "evidence": "Core conversion path is not yet validated",
    "decision_owner": "Product owner",
    "decision": "Start with lightweight motion and measure",
    "revisit_when": "After baseline conversion and performance data exist",
}
# Revisit based on a trigger, not because the same preference is raised again.
```

**Gotcha:** A decision without a rationale tends to be reopened whenever a new stakeholder joins.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 12. Budget and vendor boundaries

Scope third-party tools, licenses, hosting, maintenance, and ongoing operating costs. Clarify who owns accounts, billing, renewal, credentials, and support. A feature that fits development time may still be out of scope if its ongoing cost or operational burden is unacceptable.

**Working pattern**

```text
ownership = {
    "domain_and_hosting": "Client-owned accounts",
    "analytics": "Client-approved property and access policy",
    "fonts_and_images": "License checked before launch",
    "maintenance": "Separate post-launch agreement",
}
# Avoid tying a client asset or account to a personal account without an explicit plan.
```

**Gotcha:** A launch estimate that omits recurring service costs can create a surprise immediately after handover.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 13. Risk register and contingency choices

Track risks with probability, impact, owner, mitigation, and trigger. Use a fallback that protects the core outcome. For example, if WebGL performance is poor on mobile, provide a static poster and keep navigation and project content usable.

**Working pattern**

```text
risk = {
    "event": "3D hero exceeds mobile performance budget",
    "impact": "Slow first interaction and reduced accessibility",
    "mitigation": "Limit scene complexity and defer non-critical assets",
    "fallback": "Use optimized poster image and CSS motion",
    "owner": "Technical lead",
}
# A risk without a trigger and fallback is only a worry written down.
```

**Gotcha:** A mitigation that says “optimize later” is not actionable because it names no threshold or owner.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 14. Scope review at milestones

Review scope after discovery, prototype testing, technical spikes, and release readiness. Compare assumptions with evidence and adjust before more work accumulates. Keep the original baseline visible so changes are understood rather than quietly rewritten.

**Working pattern**

```text
milestone_review = {
    "discovery": "Confirm audience, outcome, exclusions",
    "prototype": "Validate the core journey and highest-risk interaction",
    "technical_spike": "Verify CMS and CRM integration assumptions",
    "release": "Confirm acceptance, accessibility, fallback, and operations",
}
# Each review should produce a decision or an owned follow-up.
```

**Gotcha:** Repeated status meetings that do not compare evidence to scope create activity without control.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 15. End-to-end scope for a creative studio portfolio

Use MoSCoW to protect the first release: Must have project discovery, case-study evidence, accessible enquiry, and reliable follow-up; Should have filtering and related work; Could have lightweight decorative motion; Won’t have a full interactive 3D configurator until evidence supports it. Define dependencies, acceptance criteria, and fallback behavior.

**Working pattern**

```text
scope_baseline = {
    "must": ["Responsive case studies", "Accessible enquiry", "Reliable submission status"],
    "should": ["Service filters", "Related work"],
    "could": ["Subtle motion with reduced-motion support"],
    "wont_this_release": ["Full 3D configurator", "Client portal"],
    "success": "Visitors find relevant proof and complete the enquiry path reliably",
}
# This is a decision-ready boundary that can be estimated, tested, and changed transparently.
```

**Gotcha:** A good scope statement makes the next trade-off easier; it does not pretend that all desirable ideas fit the first release.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### Field Guide: Field guide: make delivery trade-offs explicit

#### Field note 1: Anchor scope in a release outcome

Write the outcome in terms of the audience and the behavior that should change. A project can ship every requested feature and still fail if the audience cannot complete the task. Define a measure and a guardrail before prioritizing solutions. For example, a portfolio refresh might target more qualified enquiries while guarding against worse mobile performance or accessibility.

**Applied example and review check**

When the outcome is uncertain, scope discovery and a prototype test before committing to a large build. A small learning milestone can prevent spending the whole budget on an unvalidated interaction.

#### Field note 2: Use MoSCoW with discipline

Must-have work is required to meet the release outcome or a binding constraint. Should-have work is important but can be negotiated; Could-have work is optional; Won’t-have-this-release work is explicitly deferred. Every Must should have a reason. If everything is Must, the group has not prioritized. Revisit categories when evidence or constraints change.

**Applied example and review check**

MoSCoW should be applied to a specific release, not to the product forever. A deferred feature can become a Must in a later release if evidence, market conditions, or operating needs change.

#### Field note 3: Estimate ranges and uncertainty

Break estimates into design, implementation, integration, QA, content, and release work. Identify which parts are understood and which depend on unresolved questions. Use a range and state the assumptions. A technical spike is appropriate when an unknown architecture or API contract could materially change the estimate.

**Applied example and review check**

A range is not indecision; it is a truthful representation of incomplete knowledge. Update the estimate when evidence changes and explain why, rather than treating the first number as a guarantee.

#### Field note 4: Negotiate change with options

When a new request arrives, summarize the benefit, effort, dependencies, risks, and choices. Options might include adding the feature and moving the date, replacing lower-priority work, or prototyping the idea before full implementation. Record the decision owner and update the baseline, acceptance criteria, and schedule after approval.

**Applied example and review check**

Avoid saying “yes, we can fit it in” before understanding the impact. A seemingly small visual request can add asset preparation, accessibility, responsive, performance, and QA work.

#### Field note 5: Protect the quality floor

Do not cut security, privacy, accessibility, or the reliability of the core user journey to preserve decorative extras. If the project uses WebGL or advanced motion, scope a non-WebGL fallback, reduced-motion behavior, and performance checks. Include deployment, monitoring, ownership, and handover so the launch is operable after the freelancer leaves.

**Applied example and review check**

The quality floor should be agreed before estimates. If constraints cannot be met, surface the risk and seek a decision; do not silently lower the standard.

### Operational Review Notes

#### Review note 1: Define what estimates exclude

State whether estimates include content migration, asset licensing, stakeholder review cycles, analytics, accessibility testing, deployment, training, and post-launch support. These activities often fall between design and engineering and can become surprise work. Exclusions should be visible in the proposal and handoff plan. If an excluded item becomes necessary to meet the outcome, raise a change request rather than absorbing it invisibly.

#### Review note 2: Use evidence to revisit priorities

Priorities are hypotheses that should change when new evidence arrives. If prototype testing shows that visitors cannot understand project outcomes, content hierarchy may outrank a decorative animation. If the CMS cannot support a planned filter without significant rework, a simpler taxonomy may be the responsible first release. Record the evidence, updated trade-off, and owner so reprioritization is transparent rather than perceived as arbitrary.

#### Review note 3: Plan operational ownership

A launch is not the end of the project boundary. Identify who owns the domain, hosting, analytics, CMS, integrations, design assets, and credentials. Define where errors are reported, who handles content updates, and what support is included after launch. Do not imply a service-level guarantee unless it has been explicitly agreed. Clear ownership reduces the risk that a technically successful delivery becomes unmaintainable.

#### Review note 4: Review release readiness honestly

Before launch, confirm that Must-have acceptance criteria pass, the critical journey works on supported devices, failure paths are tested, accessibility has been reviewed, content and privacy copy are approved, and monitoring or rollback is available where appropriate. Record known limitations and who accepts them. A release decision should be based on evidence and risk ownership, not on sunk cost or pressure to announce a date.

## Relevant Patterns

The following patterns are reusable workflows. Each is designed for a real trigger and includes a practical implementation sketch.

### Pattern 1: MoSCoW boundary

**What it does:** MoSCoW boundary in a repeatable form.

**When to use it:** Use when stakeholders have more desired features than budget or time.

```python
priority = {"Must have": ["Enquiry works"], "Should have": ["Project filters"], "Could have": ["Decorative motion"], "Won't have this release": ["3D configurator"]}
# Must-have means required for the release outcome or a binding constraint.
```

If everything is Must have, ask what can be removed without breaking the outcome.

### Pattern 2: RICE with assumptions

**What it does:** RICE with assumptions in a repeatable form.

**When to use it:** Use to compare several candidate enhancements.

```python
score = reach * impact * confidence / effort
# Record each input and its unit; a score is a discussion aid, not a promise.
```

Never compare scores built from different time horizons or inconsistent scales.

### Pattern 3: Trade-off change request

**What it does:** Trade-off change request in a repeatable form.

**When to use it:** Use when a late feature is proposed.

```python
change = {"benefit": "", "effort": "", "risk": "", "what_moves_out": "", "approver": ""}
# Require a named trade-off before accepting additional scope.
```

A change log without cost or schedule impact cannot support a decision.

### Pattern 4: Dependency gate

**What it does:** Dependency gate in a repeatable form.

**When to use it:** Use when a deliverable depends on client assets, credentials, or approval.

```python
dependency = {"owner": "Client IT", "needed_by": "Before integration test", "fallback": "Use contract-tested mock for UI work", "risk_if_late": "Integration date moves"}
# Define the fallback and consequence before the due date is missed.
```

A mock allows UI work but does not prove the real integration works.

### Pattern 5: Risk-based fallback

**What it does:** Risk-based fallback in a repeatable form.

**When to use it:** Use when a visual or technical feature may exceed performance or delivery limits.

```python
fallback = {"trigger": "Mobile scene exceeds agreed budget", "action": "Serve optimized static poster", "owner": "Technical lead", "retest": "Documented mobile profile"}
# Make the trigger measurable and the fallback usable.
```

“Optimize later” names neither a threshold nor a responsible person.

### Pattern 6: Milestone scope baseline

**What it does:** Milestone scope baseline in a repeatable form.

**When to use it:** Use at discovery, prototype, technical spike, and launch reviews.

```python
baseline_review = ["What changed in evidence?", "Which requirements are affected?", "What trade-off is approved?", "Who owns unresolved risks?"]
# Keep the previous baseline and decision rationale available for comparison.
```

Quietly replacing the baseline makes scope creep impossible to distinguish from planned work.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Everything marked Must have | Prioritization has avoided the hard trade-off. | Require each Must to map to release outcome, legal constraint, or critical dependency. |
| Feature list without outcome | Delivery can succeed while the business problem remains. | Write the problem, audience, measurable outcome, and guardrails first. |
| Exclusions omitted | Discussed ideas become assumed commitments. | Publish explicit in-scope, out-of-scope, and deferred lists. |
| Estimate hides uncertainty | A precise date disguises unknown APIs or content. | Use ranges, confidence, risk owners, and discovery spikes. |
| Dependencies have no owner | Approvals and credentials arrive late. | Assign a named owner, needed-by date, and fallback. |
| RICE inputs inconsistent | Scores compare incompatible assumptions. | Standardize scales and time horizons; retain confidence and rationale. |
| Change accepted without trade-off | Scope grows while date and cost remain fixed. | Show what moves out or what changes in cost/timing before approval. |
| Cutting quality to save time | Accessibility, security, or reliability becomes unacceptable. | Cut optional features before binding quality constraints. |
| MVP is a broken fragment | No user can complete the intended outcome. | Preserve a coherent end-to-end journey in the first release. |
| Risk has no trigger | Team cannot tell when mitigation should activate. | Define measurable trigger, owner, mitigation, and fallback. |
| Third-party costs ignored | Recurring licenses or operations surprise the client. | Include ownership, billing, renewals, and maintenance in scope. |
| Sign-off has no version | Teams disagree about which baseline was approved. | Record date, version, decision owner, exclusions, and change route. |
| Status meetings do not change plan | Risk is discussed but not acted on. | Tie milestone reviews to evidence, decisions, and owned follow-ups. |
| No acceptance criteria | Completion depends on personal opinion. | Define testable success and the conditions under which it is evaluated. |
| No fallback for creative tech | A heavy effect blocks mobile performance. | Set a budget and implement an optimized non-WebGL fallback. |
| Budget ignores handover | The site launches without usable credentials or docs. | Scope asset ownership, account transfer, training, and operational notes. |
| Deferred work disappears | Stakeholders assume the feature was forgotten. | Keep a prioritized deferred list with evidence and a revisit trigger. |

### Before → After: make the decision testable

**Before**

```text
Requirement: Make the website engaging and easy to use.
```

**After**

```text
Requirement: A prospective client can find a case study matching a service, identify the studio role and outcome, and reach an enquiry form using keyboard or pointer. If no projects match, the interface explains how to clear filters. Verify with a task-based prototype test and keyboard audit.
```

The revised statement identifies a user, a task, evidence needed, a failure state, and verification. It still leaves implementation choices open until the team has enough evidence.

## Mental Models

1. **Scope is a trade-off contract** — New work must change priority, cost, time, or another item.
2. **Outcomes anchor cuts** — Remove optional features before breaking the core user journey.
3. **Must means necessary** — A favorite idea is not a Must unless it protects the release outcome or a binding constraint.
4. **Precision is not certainty** — Ranges and confidence are more honest than invented exactness.
5. **Dependencies need owners** — A date without a responsible person is not a plan.
6. **Risk needs a trigger** — Define when a mitigation or fallback becomes active.
7. **Deferred is not forgotten** — Preserve a reason and a condition for reconsideration.

## Quick Reference Table

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Outcome | Problem and measurable target | Avoid feature-only brief |
| In scope | Committed deliverables | Map to acceptance |
| Out of scope | Explicit exclusions | Prevents implied promises |
| MoSCoW Must | Required for outcome or constraint | Keep list short |
| MoSCoW Should | Important but not release-blocking | Can trade if necessary |
| MoSCoW Could | Optional enhancement | Cut before quality |
| Won’t this release | Deferred deliberately | Record revisit trigger |
| RICE | Reach × Impact × Confidence ÷ Effort | Standardize scales |
| Estimate range | Low/high effort and confidence | Expose uncertainty |
| Dependency | Owner and needed-by date | Define fallback |
| Change request | Benefit and impact | Name what moves out |
| Risk trigger | Measurable condition | Assign owner and fallback |
| Acceptance | Observable definition of done | Include quality attributes |
| Critical path | Dependencies that control finish | Track external approvals |
| Handover | Accounts, assets, documentation | Include ongoing ownership |
| Milestone review | Evidence, decision, owner | Not just status reporting |

## Build Challenge

### Build: Project Scoping for a Creative Studio Portfolio

Create a decision-ready artifact set for a fictional creative studio redesign. The work must connect audience evidence to a tested user journey and a release boundary. The goal is not to produce documentation for its own sake; the output should let a small team begin design and implementation without guessing about the core outcome or failure behavior.

**Requirements**

1. Write a measurable outcome and a guardrail.
2. List scope inclusions, exclusions, and assumptions.
3. Use MoSCoW with at least two items in each applicable category.
4. Explain one RICE comparison with consistent scales and confidence.
5. Estimate design, build, QA, and integration as ranges.
6. Identify critical dependencies, owners, and required-by dates.
7. Define a coherent minimum viable end-to-end journey.
8. Create a change request and identify what would move out.
9. Record at least five risks with triggers, owners, mitigations, and fallbacks.
10. Include accessibility, privacy, security, performance, and reduced-motion constraints.
11. Define acceptance and release readiness criteria.
12. Document account ownership, handover, and post-launch responsibilities.

**Expected output / definition of success**

- A reviewable project scoping artifact set tied to the studio’s stated business outcome.
- At least one traceable path from evidence or assumption to requirement, design decision, and verification.
- Failure, empty, accessibility, privacy, and operational cases represented where relevant.
- A decision log that identifies owner, rationale, exclusions, and unresolved risks.
- A teammate can explain what is included, what is deferred, how success is checked, and who owns the next decision without asking the author to interpret the artifact.

**Suggested focused-session plan**

1. 15 minutes — define audience, outcome, constraints, and source evidence.
2. 25 minutes — create the main artifact and map the critical path.
3. 20 minutes — add error states, acceptance criteria, and dependencies.
4. 15 minutes — review with another role and identify ambiguous language.
5. 10 minutes — revise, assign owners, and record the baseline.

**Definition of done**

The artifact is internally consistent, specific to the portfolio project, testable, accessible by design, and explicit about failure recovery. All Must-have items have acceptance criteria. Open questions are owned rather than hidden. No unsupported claim is presented as a confirmed fact.
