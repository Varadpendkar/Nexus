# SKILL: user-story-writing
**Layer:** 17 — Requirements & Design
**Goal:** Translate validated user needs into small, testable stories with explicit value, boundaries, and acceptance criteria that guide design, implementation, and verification.

---

## Why This Matters (Senior Perspective)

Requirements and design process is where delivery risk is either reduced cheaply or pushed into implementation, where it becomes expensive. A polished screen can still solve the wrong problem; a well-estimated sprint can still deliver a feature nobody needs. This skill treats evidence, decisions, and verification as a connected system rather than paperwork performed before “real work” starts.

For creative web and freelance work, unclear expectations are especially costly: clients often describe a visual solution before the audience, content, operating constraints, or success measure is clear. The senior approach is to make assumptions visible, test risky choices early, record decisions, and translate the agreed outcome into artifacts that design, engineering, QA, and the client can all inspect.

## Core Concepts

### 1. Story format as a compact contract

Use the consistent structure “As a [role], I want [goal], so that [benefit].” The role identifies whose need matters, the goal names a capability, and the benefit explains why it is worth building. The sentence is a summary, not a substitute for context and criteria.

**Working pattern**

```text
story = {
    "title": "Compare related case studies",
    "statement": "As a prospective client, I want to compare projects by service, so that I can judge whether the studio has relevant experience.",
    "source": "Portfolio discovery interviews",
}
# A real role and outcome make prioritization more meaningful than a technical task title.
```

**Gotcha:** “As a user, I want a filter, so that I can filter” repeats the feature without stating the user benefit.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 2. Personas, roles, and evidence

Derive roles from actual goals and permissions, not decorative persona biographies. A prospective client, returning client, editor, and administrator may interact with the same site differently. Cite the interview, observation, support ticket, or product data behind a story so the team can revisit weak assumptions.

**Working pattern**

```text
story_metadata = {
    "role": "Content editor",
    "evidence": "Editorial workflow interview 04",
    "confidence": "Medium",
    "open_question": "Does the editor need scheduled publishing?",
}
# Mark uncertain needs instead of presenting assumptions as research findings.
```

**Gotcha:** A persona with a name and stock-photo biography is not evidence of a requirement.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 3. Acceptance criteria with Given–When–Then

Write criteria as observable scenarios: Given the starting context, when the actor performs an action, then the system produces a visible outcome. Include successful behavior, validation, permissions, and failure recovery. Criteria should be specific enough for independent testers to agree on pass or fail.

**Working pattern**

```text
**Acceptance criteria**
- Given a visitor is viewing the project index, when they select “Brand identity”, then only matching projects are shown.
- Given no projects match the selected filters, when results load, then an empty state explains how to clear filters.
- Given the filter request fails, when the visitor retries, then the selected filters remain available.
# These outcomes can be checked without guessing what “good filtering” means.
```

**Gotcha:** “Given the user clicks filter, then filtering works” omits context, expected result, and failure behavior.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 4. Story slicing and vertical value

A useful story delivers a thin but complete user outcome across UI, logic, and data. Slice by behavior or user journey, not by technical layer alone. “Build database” is usually a task; “editor can save a draft project” is a user-visible increment with testable value.

**Working pattern**

```text
# Better slices for a project publishing workflow
stories = [
    "As an editor, I can save a project draft so that incomplete work is not public.",
    "As an editor, I can preview a draft so that I can review its presentation.",
    "As an editor, I can publish an approved project so that visitors can discover it.",
]
# Each slice should be independently reviewable and have a clear acceptance boundary.
```

**Gotcha:** Splitting “frontend”, “API”, and “database” into separate stories can leave no end-to-end value until the end.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 5. INVEST quality checks

Evaluate stories for Independent, Negotiable, Valuable, Estimable, Small, and Testable qualities. INVEST is a diagnostic, not a scoring ritual. If a story is too large, identify the distinct user outcomes; if it is not testable, clarify the behavior and observable result.

**Working pattern**

```text
invest_review = {
    "independent": "Can be delivered without waiting for unrelated CMS work",
    "negotiable": "Solution details remain open until design",
    "valuable": "Helps a visitor judge relevant studio experience",
    "estimable": "Content and filter rules are known",
    "small": "Fits the team's normal delivery slice",
    "testable": "Visible result and empty/error cases are defined",
}
# Use the weakest dimension to drive refinement, not a numeric score alone.
```

**Gotcha:** Marking every story “small” does not fix hidden dependencies or missing decisions.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 6. Story mapping and journey order

Arrange stories along the user’s journey from discovery to completion, then identify a minimum viable walking skeleton. A story map shows sequence and gaps better than a flat backlog. Prioritize the core journey first, then deepen it with secondary paths and enhancements.

**Working pattern**

```text
journey = {
    "discover": ["Browse services", "Open a case study"],
    "evaluate": ["Review role and outcomes", "Compare related work"],
    "contact": ["Start enquiry", "Submit details", "See confirmation"],
}
# Slice a first release across the whole journey instead of perfecting only the hero.
```

**Gotcha:** A list sorted by department can hide the fact that the visitor cannot complete the journey.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 7. Dependencies, assumptions, and technical tasks

Attach dependencies to stories explicitly: content approval, API access, design tokens, or legal review. Keep technical tasks linked to the story they enable. When an assumption changes, update the story and criteria rather than letting implementation silently diverge.

**Working pattern**

```text
story = {
    "statement": "As a visitor, I want to submit an enquiry, so that the studio can follow up.",
    "dependencies": ["CRM endpoint credentials", "Approved privacy notice"],
    "technical_tasks": ["Validate payload server-side", "Add delivery retry logging"],
}
# A dependency is not done merely because somebody has been emailed about it.
```

**Gotcha:** A ticket that says “integrate CRM” is not a user story and often hides multiple failure states.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 8. Non-functional stories and quality attributes

Performance, accessibility, privacy, security, localization, and reliability need acceptance conditions too. They may be represented as quality criteria shared by multiple stories or as explicit enabler stories when work is substantial. State the device, network, data, and measurement conditions for performance checks.

**Working pattern**

```text
quality_criteria = [
    "All primary actions work with keyboard only",
    "Form errors are associated with their fields and announced to assistive technology",
    "Project images have appropriate alternative text or are marked decorative",
    "The agreed performance budget is tested on a documented device profile",
]
# Quality conditions should be measurable and attached to the affected journey.
```

**Gotcha:** “Make it accessible” cannot be verified without concrete keyboard, semantics, and feedback criteria.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 9. Story examples for edge and error cases

A story’s scope includes what happens when inputs are invalid, data is absent, permissions fail, or a service is unavailable. Avoid forcing every edge case into the main sentence; use separate acceptance scenarios and link them to the same user outcome.

**Working pattern**

```text
**Acceptance criteria**
- Given a required enquiry field is blank, when the form is submitted, then the field is identified and submission is blocked.
- Given the CRM is unavailable, when the visitor submits valid data, then the UI explains the next step and the server records a safe retryable failure.
- Given the visitor has already submitted, when they refresh the confirmation page, then a duplicate enquiry is not created.
# Failure criteria protect the journey from real operational conditions.
```

**Gotcha:** Testing only the happy path makes a story look complete while its real-world behavior remains undefined.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 10. Definition of Ready and Definition of Done

Definition of Ready is a team agreement for starting work; it is not a bureaucratic gate for every idea. Definition of Done defines the quality required for a story to count as complete, including review, tests, accessibility, documentation, and deployment conditions relevant to the project.

**Working pattern**

```text
definition_of_done = [
    "Acceptance criteria demonstrated",
    "Automated and relevant manual tests pass",
    "Keyboard and responsive behavior checked",
    "Errors and analytics events reviewed",
    "Changes reviewed and documented",
]
# Tailor this list to the product; do not claim work is done because code was merged.
```

**Gotcha:** A vague “QA approved” can hide untested mobile behavior or unhandled production errors.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 11. Prioritization by value, risk, and cost

Rank stories by user value, urgency, risk reduction, dependencies, and effort. RICE or MoSCoW can help, but the team must explain its assumptions. A low-confidence, high-impact story may deserve a quick prototype before committing to a large build.

**Working pattern**

```text
candidate = {
    "story": "Show project outcomes near the title",
    "reach": 8, "impact": 3, "confidence": 0.8, "effort": 2,
}
rice = candidate["reach"] * candidate["impact"] * candidate["confidence"] / candidate["effort"]
# Compare scores only when scales are applied consistently; discuss dependencies separately.
```

**Gotcha:** A prioritization score is a conversation aid, not an objective truth when estimates are uncertain.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 12. Story refinement and splitting workshop

Refine a small set of upcoming stories with design, engineering, and QA together. Ask what is known, what could fail, what data is needed, and what is out of scope. Split stories when they have multiple user outcomes, large uncertainty, or too many independent acceptance scenarios.

**Working pattern**

```text
refinement_questions = [
    "Which user outcome is the story intended to change?",
    "What must be true before work starts?",
    "What does the user see when the service fails?",
    "Which behavior can be delivered and verified first?",
    "What evidence would make us change the story?",
]
# Record unresolved questions as owned follow-ups, not hidden meeting notes.
```

**Gotcha:** Refinement is not a demand to specify every pixel before the team learns from a prototype.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 13. End-to-end story set for a portfolio enquiry

Use connected stories to cover discovery, evaluation, contact, and operational follow-up. For a creative portfolio, ensure the visitor can find relevant work, understand outcomes, submit an accessible form, receive confirmation, and recover if the CRM fails.

**Working pattern**

```text
portfolio_stories = [
    "As a prospective client, I want to filter case studies by service, so that I can find relevant work.",
    "As a prospective client, I want to see project outcomes, so that I can judge the studio's impact.",
    "As a prospective client, I want to submit an enquiry, so that I can discuss a similar project.",
    "As a sales coordinator, I want failed CRM delivery flagged, so that no qualified enquiry is lost.",
]
# Each story receives its own acceptance criteria and traces back to discovery evidence.
```

**Gotcha:** A strong story set connects the visitor-facing promise to the operational system that must fulfill it.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### Field Guide: Field guide: maintain a backlog that guides delivery

#### Field note 1: Write stories from validated needs

Do not write the backlog by copying meeting notes. Start with a need supported by research or an explicit business constraint, then identify the role, goal, and benefit. A story should preserve the user’s problem while leaving room for design and engineering to discover the best implementation. If the requirement is mandated by security or infrastructure rather than a user role, record it as an enabler or constraint and link it to the affected outcomes.

**Applied example and review check**

For a portfolio, “As a prospective client, I want to see the studio’s role in a project, so that I can judge whether its experience is relevant” is stronger than “As a user, I want a role field.” It explains why the information matters and gives content design a useful direction.

#### Field note 2: Make acceptance criteria precise without overdesign

Acceptance criteria define observable behavior, not every implementation detail. Include the starting condition, user or system action, and expected outcome. Use concrete labels and data conditions when they matter. Avoid encoding pixel-level decisions in story criteria unless they are a genuine requirement; link to the design artifact for visual specifications.

**Applied example and review check**

A useful criterion might say that selecting a service updates the result set, announces the result count accessibly, and preserves the selection when the visitor opens a project and returns. The criterion should also define what happens when no results match. It need not prescribe the exact JavaScript filtering algorithm.

#### Field note 3: Handle story dependencies honestly

A story may depend on approved copy, a CMS field, API credentials, a design token, or legal review. Record each dependency with an owner and required-by date. If it is a risk to the delivery date, make it visible during planning. Use a mock to unblock interface work only when everyone understands that a mock does not validate the real integration.

**Applied example and review check**

When a dependency is unresolved, the team can split work into a discovery spike, implement a safe stub, or move the story out of the current slice. Do not mark a story ready merely because the dependency has been mentioned in a comment.

#### Field note 4: Use estimation as a conversation

Estimate only after the team understands the outcome, major acceptance conditions, and significant dependencies. Relative sizing can help compare work, but a number is not a promise. If estimates vary widely, ask what each person assumes about content, edge cases, integration, or test coverage. Resolve the assumption or explicitly preserve a range.

**Applied example and review check**

A technically small visual change may have broad regression risk if it touches shared navigation. Conversely, a complex-looking page can be inexpensive when a well-tested component already exists. Estimate the change in its real system context, not by visual appearance alone.

#### Field note 5: Review the backlog continuously

Backlog refinement is ongoing product work. Revisit stories when research changes, a dependency fails, an integration contract becomes known, or usage data contradicts assumptions. Close obsolete stories rather than keeping an ever-growing queue of ideas. Record why an item is deferred and what evidence would justify reopening it.

**Applied example and review check**

A story should not remain “almost ready” indefinitely. Give open questions owners and dates, and ensure the team can distinguish committed work from speculative ideas. The backlog should be a decision tool, not a storage bin for every suggestion.

### Operational Review Notes

#### Review note 1: Avoid acceptance-criteria overload

Acceptance criteria should cover meaningful behavior, not become a complete implementation specification. If a story needs many unrelated scenarios, it may represent multiple outcomes and should be split. If a criterion is shared by every form, consider a shared quality standard and reference it from relevant stories. Keep story-level criteria focused enough that a reviewer can see whether the user outcome is delivered.

#### Review note 2: Keep acceptance test data realistic

Use realistic names, title lengths, service categories, and form conditions in examples. Avoid using only perfect data that fits a developer’s local setup. Include a long project title, missing optional metric, empty result set, and a failure response where relevant. Never use actual client personal data in public examples or test fixtures. Seed synthetic data that represents edge cases without exposing real people.

#### Review note 3: Track story changes through delivery

When acceptance criteria change after implementation begins, record why and identify which design, code, and tests are affected. A new criterion can change scope even if the story title stays the same. Review the impact with the person who owns prioritization and update the acceptance baseline. Do not silently amend the criterion after a failed test to make the current implementation pass.

#### Review note 4: Close the feedback loop

After release, review whether the story’s expected benefit occurred. A completed story may have delivered the specified behavior but failed to improve the outcome because the original hypothesis was wrong. Capture the result, usage context, and next decision. This is especially important for creative features, where a visually impressive interaction can receive attention without improving comprehension or qualified enquiries.

## Relevant Patterns

The following patterns are reusable workflows. Each is designed for a real trigger and includes a practical implementation sketch.

### Pattern 1: Story and criteria pair

**What it does:** Story and criteria pair in a repeatable form.

**When to use it:** Use when a user goal needs to become a verifiable backlog item.

```python
story = "As a prospective client, I want to filter projects by service, so that I can find relevant work."
criteria = ["Given the project index, when a service is selected, then matching projects are shown", "Given no matches, when results load, then clear filters is offered"]
# The story communicates value; criteria define observable behavior.
```

Keep technical implementation choices out of the story unless they are genuine constraints.

### Pattern 2: INVEST refinement

**What it does:** INVEST refinement in a repeatable form.

**When to use it:** Use when a story is too large, vague, or hard to estimate.

```python
review = {"independent": True, "valuable": True, "estimable": False, "small": False, "testable": True}
# Split by distinct user outcome and resolve the missing integration assumptions before estimating.
```

A checklist cannot replace conversation about dependencies and risk.

### Pattern 3: Journey-based slicing

**What it does:** Journey-based slicing in a repeatable form.

**When to use it:** Use when a backlog is organized by technical layer.

```python
slices = ["Visitor finds project", "Visitor understands outcomes", "Visitor submits enquiry", "Team can recover failed delivery"]
# Deliver a thin path across UI, data, and operations before deepening optional features.
```

Do not slice so thinly that no increment can be reviewed by a user.

### Pattern 4: Failure criteria expansion

**What it does:** Failure criteria expansion in a repeatable form.

**When to use it:** Use when the story touches forms, network calls, permissions, or external systems.

```python
criteria = ["Given invalid input, then field errors are linked", "Given timeout, then entered data is preserved", "Given repeated submission, then duplicate record is prevented"]
# Include only failure scenarios relevant to this story, but include the real ones.
```

Avoid vague “error handled” criteria.

### Pattern 5: Story map release slice

**What it does:** Story map release slice in a repeatable form.

**When to use it:** Use when deciding what belongs in the first release.

```python
map = {"discover": ["Browse projects"], "evaluate": ["Read outcomes"], "contact": ["Submit enquiry", "See confirmation"]}
# Choose a complete journey slice before adding lower-priority enhancements.
```

A feature list sorted by stakeholder can obscure gaps between discovery and completion.

### Pattern 6: Quality criteria attachment

**What it does:** Quality criteria attachment in a repeatable form.

**When to use it:** Use when accessibility, privacy, or performance spans multiple stories.

```python
quality = ["Keyboard-operable primary journey", "No personal form data in analytics", "Performance tested on documented mobile profile"]
# Link shared quality conditions to all affected stories and the release definition of done.
```

A global checklist can be forgotten unless it is visible in the affected work.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Role is just “user” | Different roles have different goals and permissions. | Name the meaningful role, such as prospective client, editor, or sales coordinator. |
| No user benefit | The sentence describes a control but not why it matters. | Complete the “so that” clause with an outcome that can guide prioritization. |
| Acceptance criteria say “works” | Subjective language cannot produce repeatable tests. | Use Given–When–Then scenarios with observable results. |
| Technical task disguised as story | “Create API endpoint” does not identify user value. | Link the technical task to the user outcome it enables. |
| Story too large | Multiple outcomes and unknowns make estimates unreliable. | Split by user-visible outcome or decision branch, not only by technology layer. |
| Only happy-path criteria | Failures are left for implementation to invent. | Add relevant validation, empty, timeout, permission, and retry scenarios. |
| Unverified persona assumptions | A role label is treated as research. | Attach source evidence and mark confidence or open questions. |
| Dependencies hidden | Story cannot start despite appearing ready. | List assets, access, approvals, and cross-team dependencies with owners. |
| INVEST used as a score only | A checklist can mask substantive uncertainty. | Discuss the weakest dimension and agree a concrete refinement action. |
| Quality requirements omitted | Accessibility and performance are treated as separate polish. | Attach measurable quality criteria to affected stories and release DoD. |
| Story map ignores end-to-end value | Backlog is organized by team and no journey works early. | Slice a thin path across discovery, evaluation, action, and confirmation. |
| Priority score treated as truth | Inputs may be guesses with incompatible scales. | Record assumptions and confidence; discuss dependencies alongside score. |
| No definition of done | Merged code is mistaken for completed user value. | Define test, review, accessibility, documentation, and deployment expectations. |
| Stories duplicate each other | Different tickets describe the same outcome with different words. | Map each story to a unique user outcome and identify shared acceptance behavior. |
| Prototype limitations unmarked | Testers blame users for nonfunctional mock interactions. | Annotate simulated behavior and exclude it from claims about production feasibility. |
| Analytics captures personal data | Teams instrument raw form values to debug conversion. | Track state events and identifiers only; never send sensitive field content. |
| No refinement cadence | Unresolved questions surface during implementation. | Refine the next delivery slice with design, engineering, and QA together. |

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

1. **Value before implementation** — Start with the user outcome; link technical work to it.
2. **The “so that” clause earns priority** — If the benefit is unclear, the story may not deserve delivery yet.
3. **Criteria are executable language** — Given–When–Then should lead to a repeatable test.
4. **Slice vertically** — Deliver a small user outcome across the stack rather than a disconnected technical layer.
5. **INVEST is a conversation** — A weak dimension identifies what to clarify or split.
6. **Failure is behavior too** — Validation, timeout, and permission cases are part of the contract.
7. **Quality travels with the story** — Accessibility, privacy, and performance belong where they affect user value.

## Quick Reference Table

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Story format | As a [role], I want [goal], so that [benefit] | Use role-specific needs |
| Acceptance criteria | Given / When / Then | Observable pass/fail outcomes |
| INVEST | Independent, Negotiable, Valuable, Estimable, Small, Testable | Diagnostic, not score worship |
| Story slicing | Split by user outcome | Avoid technical-layer-only tickets |
| Definition of Ready | Team-agreed entry conditions | Do not over-specify unknowns |
| Definition of Done | Tests, review, quality, documentation | Merge is not completion |
| Story map | Sequence tasks along a journey | Slice a complete first release |
| Dependency | Owner, date, impact | A message sent is not resolved |
| RICE | Reach × Impact × Confidence ÷ Effort | Use consistent scales |
| Quality story | Accessibility, privacy, performance | Attach to affected flows |
| Error criteria | Validation, timeout, permission, retry | Choose relevant real failures |
| Source evidence | Interview, observation, analytics | Mark uncertainty |
| Technical task | Implementation work linked to story | Does not replace user outcome |
| Analytics event | State transition, not sensitive payload | Count accepted outcomes |
| Refinement | Design, engineering, QA together | Record unresolved questions |
| Acceptance owner | Named approver and evidence | Avoid subjective sign-off |

## Build Challenge

### Build: User Story Writing for a Creative Studio Portfolio

Create a decision-ready artifact set for a fictional creative studio redesign. The work must connect audience evidence to a tested user journey and a release boundary. The goal is not to produce documentation for its own sake; the output should let a small team begin design and implementation without guessing about the core outcome or failure behavior.

**Requirements**

1. Write at least eight stories using the exact “As a [role], I want [goal], so that [benefit]” structure.
2. Attach at least two Given–When–Then acceptance scenarios to each core story.
3. Include success, invalid-input, empty-state, and timeout behavior where relevant.
4. Map stories into discover, evaluate, contact, and operations activities.
5. Apply INVEST to three stories and explain the weakest dimension.
6. Split one oversized story into independently reviewable user outcomes.
7. Prioritize the backlog using MoSCoW or RICE with assumptions shown.
8. Identify dependencies and assign owners to the top three.
9. Define a team Definition of Done including accessibility and testing.
10. Link quality requirements to affected stories.
11. Specify privacy-safe analytics events for the enquiry path.
12. Review the backlog with design, engineering, and QA and record open questions.

**Expected output / definition of success**

- A reviewable user story writing artifact set tied to the studio’s stated business outcome.
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
