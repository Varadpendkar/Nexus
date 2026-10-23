# SKILL: client-requirements-gathering
**Layer:** 17 — Requirements & Design
**Goal:** Turn ambiguous stakeholder requests into validated, testable requirements and explicit decisions before design or implementation begins.

---

## Why This Matters (Senior Perspective)

Requirements and design process is where delivery risk is either reduced cheaply or pushed into implementation, where it becomes expensive. A polished screen can still solve the wrong problem; a well-estimated sprint can still deliver a feature nobody needs. This skill treats evidence, decisions, and verification as a connected system rather than paperwork performed before “real work” starts.

For creative web and freelance work, unclear expectations are especially costly: clients often describe a visual solution before the audience, content, operating constraints, or success measure is clear. The senior approach is to make assumptions visible, test risky choices early, record decisions, and translate the agreed outcome into artifacts that design, engineering, QA, and the client can all inspect.

## Core Concepts

### 1. Business outcome before feature requests

Separate the result a client wants from their proposed solution. A request for a “3D homepage” may actually mean stronger product understanding or more qualified leads. Capture baseline, target, audience, and measurement before choosing a UI.

**Working pattern**

```text
# Intake record: a creative studio portfolio refresh
project = {
    "business_outcome": "Increase qualified project enquiries",
    "primary_audience": "Marketing leads at mid-sized SaaS companies",
    "current_signal": "Visitors browse work but rarely contact the studio",
    "success_measure": "Qualified enquiry rate, segmented by traffic source",
    "requested_solution": "Add a WebGL hero",
}
# Treat the requested solution as a hypothesis, not an approved requirement.
```

**Gotcha:** A feature can be delivered while the business problem remains untouched. Keep outcome and solution in separate fields.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 2. Stakeholder mapping and decision rights

Identify who uses the product, funds it, approves it, operates it, and can block launch. The loudest person is not automatically the decision owner. Record a named role for each decision and a route for resolving conflicting needs.

**Working pattern**

```text
stakeholders = [
    {"role": "Marketing lead", "need": "Explain services clearly", "authority": "Content approval"},
    {"role": "Studio founder", "need": "Distinctive visual identity", "authority": "Final creative sign-off"},
    {"role": "Sales coordinator", "need": "Reliable lead notifications", "authority": "Operational acceptance"},
]
# Ask each person to validate the responsibilities attributed to their role.
```

**Gotcha:** A stakeholder list without decision rights creates late-stage approval surprises.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 3. Interview preparation and probing

Use semi-structured interviews to discover actual work, language, exceptions, and pain. Ask for a recent incident rather than opinions about an imagined future. Follow “why” with evidence: what happened, what was tried, what was costly, and how success was recognized.

**Working pattern**

```text
interview_guide = [
    "Walk me through the last enquiry that was a good fit.",
    "Where did the visitor hesitate or ask for clarification?",
    "What evidence tells you an enquiry is qualified?",
    "What happens when a form submission fails?",
    "Which decisions must be made by a person?",
]
# Keep prompts neutral; do not lead the participant toward your preferred feature.
```

**Gotcha:** “Would you use an animated hero?” invites a yes/no preference, not evidence about the underlying problem.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 4. Facilitated discovery workshops

A workshop aligns people around shared facts and trade-offs. Separate silent idea generation from discussion so senior voices do not anchor the room. Timebox activities, make assumptions visible, and end each topic with a decision, owner, or unresolved question.

**Working pattern**

```text
workshop_agenda = [
    ("10 min", "Agree on outcome and constraints"),
    ("12 min", "Silent write: user problems and evidence"),
    ("15 min", "Affinity mapping and theme naming"),
    ("15 min", "Prioritize risks and open questions"),
    ("8 min", "Confirm decisions, owners, and due dates"),
]
# Silent-first work reduces anchoring and gives quieter specialists equal input.
```

**Gotcha:** A meeting that ends with a long idea list but no owners is not a requirements workshop.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 5. Observation and contextual inquiry

Watch real users perform representative tasks in their environment. Record actions, workarounds, interruptions, and artifacts separately from your interpretation. Ask questions after a task when possible so the participant’s behavior is not distorted by constant narration.

**Working pattern**

```text
observation_note = {
    "observed": "User copied project details into a separate email before submitting",
    "interpretation": "The form may not support the information they need to send",
    "follow_up": "Ask whether the email is required by their workflow",
    "evidence": "Observed twice with two participants",
}
# Keep evidence and interpretation separate to avoid treating a guess as fact.
```

**Gotcha:** A demo of a clean happy path cannot reveal interruptions, accessibility barriers, or manual workarounds.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 6. Card sorting and information architecture

Use open card sorting to learn how people group content and closed sorting to test an existing category model. Recruit participants representative of the audience, avoid ambiguous labels, and interpret patterns rather than treating one sort as a final sitemap.

**Working pattern**

```text
content_cards = [
    "Brand identity", "Web design", "Web development",
    "Motion experiments", "Client outcomes", "Studio process",
]
# In an open sort, participants create their own groups and name them.
# In a closed sort, they place these cards into predefined categories.
```

**Gotcha:** Card sorting reveals mental models; it does not by itself validate navigation labels in context.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 7. Affinity mapping and evidence synthesis

Cluster individual observations into themes only after collecting evidence. Keep source notes visible, label themes with user language, and distinguish frequency from severity. A rare accessibility blocker may outrank a frequently mentioned cosmetic preference.

**Working pattern**

```text
evidence = [
    {"note": "Could not tell which work was a case study", "source": "Interview 02"},
    {"note": "Expected project outcomes near the project title", "source": "Observation 01"},
    {"note": "Could not submit with keyboard only", "source": "Usability test 03"},
]
# Cluster by the underlying problem, not by the screen where it occurred.
```

**Gotcha:** Grouping notes by page can hide one problem repeated across multiple journeys.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 8. Prototype testing as elicitation

Use a prototype to test risky assumptions before expensive implementation. Give participants a task, observe whether they can complete it, and ask what they expected. A prototype is evidence about comprehension and flow—not proof of backend feasibility or production performance.

**Working pattern**

```text
test_task = {
    "scenario": "You need to compare two studio projects before contacting the team.",
    "success_signal": "Participant finds relevant outcomes and reaches the contact path",
    "observe": ["first click", "hesitation", "misread labels", "recovery attempts"],
}
# Do not explain the interface before the task; that would mask discoverability issues.
```

**Gotcha:** A prototype test can fail because the prototype is incomplete; record tool limitations separately from user difficulty.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 9. Functional, non-functional, and content requirements

Functional requirements state behavior; non-functional requirements define qualities and constraints such as accessibility, speed, privacy, reliability, and supported devices. Content requirements specify information needed to make a design credible. Make each requirement observable and assign a verification method.

**Working pattern**

```text
requirements = [
    {"id": "FR-04", "statement": "A visitor can filter case studies by service", "verify": "Functional test"},
    {"id": "NFR-02", "statement": "Core navigation is operable by keyboard", "verify": "Keyboard audit"},
    {"id": "CR-03", "statement": "Each case study includes role and measurable outcome", "verify": "Content review"},
]
# IDs make change requests and test results traceable.
```

**Gotcha:** “The site should be fast and beautiful” cannot be objectively accepted. Define thresholds and evaluation conditions.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 10. Constraints, assumptions, and dependencies

Capture hard constraints separately from assumptions. A constraint is known and binding; an assumption is an unverified belief; a dependency is something the project needs from another person or system. Each uncertainty should have an owner, due date, and consequence if unresolved.

**Working pattern**

```text
risk_register = [
    {"type": "Constraint", "item": "Must use the existing CMS", "owner": "Technical lead"},
    {"type": "Assumption", "item": "Client can supply approved case-study metrics", "owner": "Account lead"},
    {"type": "Dependency", "item": "CRM webhook credentials", "owner": "Client IT", "due": "Before integration sprint"},
]
# Revisit assumptions before they silently become implementation commitments.
```

**Gotcha:** An assumption copied into a proposal can be mistaken for a confirmed promise.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 11. Acceptance criteria and requirement traceability

Write acceptance criteria that a designer, developer, client, and tester interpret the same way. Link each requirement to its source, design artifact, implementation task, and test. Traceability is especially useful when scope changes: it shows which outcomes are affected.

**Working pattern**

```text
requirement = {
    "id": "FR-07",
    "source": "Sales coordinator interview 2026-10-20",
    "statement": "A visitor can submit a project enquiry",
    "acceptance": [
        "Given valid required fields, when submitted, then a confirmation is shown",
        "Given a network failure, when submitted, then entered data remains available for retry",
    ],
    "design": "Contact flow v2",
    "test": "QA-ENQUIRY-04",
}
# Link evidence to delivery so a late request can be evaluated rather than guessed.
```

**Gotcha:** Criteria that only say “works correctly” do not guide implementation or testing.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 12. Validation, sign-off, and change control

Review a concise requirements baseline with stakeholders. Confirm priorities, exclusions, acceptance criteria, and unresolved decisions. Sign-off means agreement on the current baseline—not that requirements can never change. New requests should be assessed for value, cost, risk, and schedule impact.

**Working pattern**

```text
change_request = {
    "request": "Add a multilingual case-study CMS",
    "benefit": "Serve two additional markets",
    "impact_to_estimate": "Needs content model and translation workflow analysis",
    "decision": "Defer pending localization evidence",
    "approver": "Product owner",
}
# Record the decision and rationale, including deferred ideas, to prevent repeated debate.
```

**Gotcha:** “Approved” is ambiguous unless stakeholders know exactly which version and exclusions were approved.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 13. Accessibility, privacy, and ethical elicitation

Recruit and listen without collecting unnecessary personal data. Explain the purpose of research, obtain informed consent, allow withdrawal, and anonymize notes where practical. Include users with disabilities in discovery; do not treat accessibility as a late visual polish pass.

**Working pattern**

```text
research_notice = {
    "purpose": "Understand how visitors find and compare project work",
    "recording": "Audio recording only with explicit consent",
    "retention": "Delete identifiable raw recordings after synthesis window",
    "withdrawal": "Participant may stop at any time",
}
# Follow applicable privacy rules and the client's approved research process.
```

**Gotcha:** A consent form does not justify collecting information unrelated to the research question.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 14. End-to-end discovery for a creative portfolio

Combine interviews, observation, affinity mapping, card sorting, and prototype testing into a coherent loop. For a portfolio redesign, interview sales and past clients, inspect enquiry behavior, test project-category labels, then validate a low-cost prototype before committing to WebGL, animation, or CMS architecture.

**Working pattern**

```text
discovery_plan = [
    "Interview founder, sales coordinator, and two recent clients",
    "Observe the current enquiry workflow and review analytics",
    "Affinity-map evidence into user problems and risks",
    "Card-sort project content and test category language",
    "Prototype the project-to-enquiry journey",
    "Baseline requirements, acceptance criteria, and exclusions",
]
# Choose technology only after the outcome and user journey are supported by evidence.
```

**Gotcha:** The final artifact is not a feature wishlist; it is a decision-ready, traceable requirements baseline.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### Field Guide: Field guide: run discovery as a decision loop

#### Field note 1: Prepare the research

Before contacting participants, state the decision the research must inform. Write what is already known, what is assumed, and what evidence would change the plan. Recruit people who actually experience the workflow; a convenient internal colleague is not a substitute for a prospective client. Prepare consent language, a note-taking structure, and a neutral task. Avoid promising that every suggestion will be built.

**Applied example and review check**

For a portfolio redesign, research should answer whether visitors can recognize the studio’s relevant work and trust its outcomes—not whether participants personally like a gradient. Choose a task such as “Find work similar to a product launch you are planning” and observe what evidence they use.

#### Field note 2: Conduct interviews without leading

Ask broad questions first, then probe for a specific incident. “Tell me about the last time you compared agencies” produces richer evidence than “Would filters help you?” Follow the sequence: context, action, obstacle, workaround, consequence, and evidence of success. If the participant proposes a feature, ask what problem it would solve and how they handle it today.

**Applied example and review check**

Do not debate, defend the existing site, or turn the interview into a sales presentation. Silence is useful: it gives participants time to recall details. Mark quotes accurately and separate verbatim evidence from your interpretation.

#### Field note 3: Synthesize conflicting evidence

Not every stakeholder will agree, and disagreement is useful information. One stakeholder may optimize visual differentiation while another optimizes lead quality. Preserve both needs, identify the underlying trade-off, and test the assumptions that matter. Do not average opinions into a requirement that satisfies nobody.

**Applied example and review check**

A decision matrix can compare alternatives against user value, evidence strength, delivery risk, accessibility, and operating cost. The weights should be agreed and documented; do not tune them after seeing which option wins.

#### Field note 4: Turn findings into a baseline

A good baseline includes the problem statement, audiences and roles, prioritized requirements, acceptance criteria, quality constraints, content dependencies, assumptions, exclusions, risks, and decisions. Keep the document navigable with stable IDs. Store evidence references where the team can find them, but avoid copying sensitive raw research into broadly accessible project tickets.

**Applied example and review check**

Review the baseline in a meeting where stakeholders can challenge meaning, not merely approve a PDF. Read ambiguous requirements aloud. Ask a developer and tester to explain how they would implement and verify each Must-have. Differences in interpretation are a signal to improve the wording.

#### Field note 5: Measure outcomes after launch

Requirements do not end at handoff. Define the event or observation that will tell the team whether the outcome improved, the baseline period, and any guardrail metric. Segment results where appropriate, because aggregate conversion can hide a failure on mobile or for keyboard users. Plan a review date and decide who owns follow-up.

**Applied example and review check**

A small traffic sample may not support strong causal claims. Report sample size, time window, known changes, and uncertainty. Use qualitative feedback and task success alongside analytics rather than treating a single metric as the whole truth.

### Operational Review Notes

#### Review note 1: Interview note quality

A useful research note lets another person understand what happened without needing the note-taker to explain it. Include task context, participant role, observed action or exact quote, outcome, and timestamp or source identifier. Avoid vague summaries such as “user was confused”; describe the behavior that supports that interpretation. Mark whether a statement is a direct quote, an observation, or a hypothesis. When evidence is contradictory, preserve the contradiction and identify what additional evidence would resolve it. Do not erase an inconvenient finding because it conflicts with the preferred design direction.

#### Review note 2: Recruitment and sampling limits

Recruit participants whose context matches the intended audience and workflow. For a business portfolio, a current client, a prospective buyer, and an internal sales coordinator can reveal different failure points. Do not claim that a handful of formative interviews represents the whole market. Use small rounds to identify usability problems, then choose broader research or quantitative measurement if a prevalence estimate is needed. Record recruitment limitations and avoid extrapolating from people who are convenient but unlike the target audience.

#### Review note 3: Decision-ready requirement review

For each Must-have requirement, ask the team to identify the source, intended user outcome, observable acceptance condition, verification method, and important failure state. If a developer can implement it in two incompatible ways and both appear compliant, the requirement needs clarification. If a tester cannot decide pass or fail, improve the criterion. The goal is not exhaustive specification; it is enough shared precision to start work safely while leaving legitimate design decisions open.

#### Review note 4: After sign-off

Store the approved baseline with a version and date. Keep a visible change log that identifies the request, rationale, affected requirements, cost or timing impact, decision owner, and status. When new research contradicts an assumption, update the baseline rather than hiding the discovery in meeting notes. At project close, compare the original outcome hypothesis with actual behavior and record what should be carried into the next iteration.

## Relevant Patterns

The following patterns are reusable workflows. Each is designed for a real trigger and includes a practical implementation sketch.

### Pattern 1: Evidence-to-requirement trace

**What it does:** Evidence-to-requirement trace in a repeatable form.

**When to use it:** Use when a stakeholder request needs validation before it becomes committed scope.

```python
requirement = {"id": "REQ-12", "source": "Interview 03", "evidence": "Two visitors could not identify relevant work", "need": "Find projects by service", "acceptance": "Selecting a service shows matching projects and a clear empty state"}
# Preserve the source so a later disagreement can be resolved against evidence.
```

Do not confuse the observed problem with the first proposed solution.

### Pattern 2: Assumption burn-down

**What it does:** Assumption burn-down in a repeatable form.

**When to use it:** Use when a proposal depends on unverified content, APIs, approvals, or user behavior.

```python
assumptions = [{"item": "Client can provide project metrics", "owner": "Marketing", "due": "Before hi-fi review", "status": "Open"}]
# Review open assumptions at each milestone and record what changes if one fails.
```

Escalate assumptions with schedule impact before the team builds around them.

### Pattern 3: Workshop decision capture

**What it does:** Workshop decision capture in a repeatable form.

**When to use it:** Use when several roles disagree about priorities or acceptance.

```python
decision_log = [{"question": "Add 3D hero now?", "evidence": "No conversion baseline", "decision": "Prototype later", "owner": "Product owner", "revisit": "After core-flow test"}]
# A decision must include an owner and a reason to revisit, if any.
```

Do not let workshop notes substitute for a confirmed baseline.

### Pattern 4: Prototype-first risk test

**What it does:** Prototype-first risk test in a repeatable form.

**When to use it:** Use when an expensive interaction has uncertain user value.

```python
test = {"task": "Find a relevant project and contact the studio", "participants": 5, "observe": ["first click", "hesitation", "recovery"], "decision_rule": "Fix repeated blockers before visual polish"}
# Treat the small round as formative evidence, not a statistically representative survey.
```

Prototype tests validate comprehension and flow, not production throughput.

### Pattern 5: Requirement change assessment

**What it does:** Requirement change assessment in a repeatable form.

**When to use it:** Use when a new request arrives after sign-off.

```python
impact = {"benefit": "New market reach", "effort": "Needs localization model", "risk": "Content operations unknown", "tradeoff": "Defer filters or move launch", "approver": "Product owner"}
# Present options with explicit trade-offs rather than silently adding work.
```

Every accepted change should update affected requirements and tests.

### Pattern 6: Research consent and minimization

**What it does:** Research consent and minimization in a repeatable form.

**When to use it:** Use when interviews or observation involve identifiable participants.

```python
consent = {"purpose": "Evaluate project discovery", "recording": "Only with opt-in", "retention": "Defined deletion date", "withdrawal": "Participant may stop"}
# Store only what the research question requires and follow the approved privacy process.
```

Avoid copying personal details into broadly accessible synthesis boards.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Accepting the first solution request | Stakeholders naturally describe familiar solutions, not always the underlying problem. | Record the desired outcome and evidence separately; test the solution hypothesis with a prototype. |
| Interviewing only the sponsor | The sponsor may not operate the workflow or represent users. | Map decision-makers, operators, users, and blockers; interview roles that experience the process. |
| Leading questions | Suggestive wording biases answers toward the interviewer’s preferred feature. | Ask about the last real occurrence and request a walkthrough before asking for opinions. |
| Treating assumptions as facts | Repeated statements can sound confirmed without evidence. | Tag assumptions, confidence, owner, and a date to validate them. |
| Recording features without acceptance | A feature name leaves multiple interpretations open. | Add observable outcomes and a verification method to every committed requirement. |
| Ignoring non-functional needs | Teams focus on screens and forget speed, accessibility, privacy, and reliability. | Add quality requirements with thresholds, context, and a named test method. |
| Skipping observation | People may omit workarounds or fail to remember task details. | Observe representative tasks and distinguish observed behavior from interpretation. |
| Using card sorting as final proof | Sorting shows grouping patterns but not navigation performance in context. | Validate labels and structure with task-based prototype testing. |
| Ending workshops without decisions | Ideas are easy to collect; ownership is easy to lose. | Close each topic with a decision, owner, due date, or explicit unresolved status. |
| Missing error paths | Requirements describe only the ideal case. | Ask what happens on invalid input, empty data, timeout, permission denial, and recovery. |
| Collecting excessive research data | Teams gather personal details that do not serve the question. | Minimize collection, obtain consent, define retention, and restrict access. |
| No traceability | Requests become disconnected from tests and implementation. | Assign stable IDs and link source evidence, design, work item, and acceptance test. |
| Assuming sign-off freezes reality | New evidence and constraints can emerge after approval. | Use a change process that evaluates benefit, cost, risk, and displaced work. |
| Generic success metric | Traffic or clicks may rise without better qualified outcomes. | Define a business-aligned measure and guardrails before implementation. |
| No explicit exclusions | Stakeholders infer that every discussed idea is included. | Publish in-scope, out-of-scope, assumptions, and deferred items in the baseline. |
| Prototype mistaken for production proof | A mock can hide data, performance, and integration constraints. | Label simulated behavior and run technical spikes for material feasibility risks. |
| Accessibility deferred | Late changes can require structural redesign. | Include keyboard, semantics, contrast, motion, and assistive-technology needs in discovery. |

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

1. **Outcome before output** — A feature is a hypothesis about how to create value, not the value itself.
2. **Evidence has a source** — Every important claim should point to an interview, observation, metric, constraint, or explicit decision.
3. **Uncertainty is work** — If an assumption can change cost or direction, assign a test and an owner.
4. **A requirement must be observable** — If two people cannot agree whether it passed, it is not ready for acceptance.
5. **Decisions need a boundary** — Sign-off covers a named baseline, version, exclusions, and assumptions.
6. **Failure is part of the journey** — Requirements that omit empty, invalid, timeout, and recovery states are incomplete.
7. **Research minimizes harm** — Collect only useful information, obtain consent, and define retention.

## Quick Reference Table

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Stakeholder interview | Semi-structured, recent real incident | Avoid leading questions |
| Workshop | Silent-first, timeboxed synthesis | Finish with owners and decisions |
| Card sorting | Open for grouping; closed for taxonomy test | Validate with task testing |
| Affinity map | Cluster evidence before naming themes | Separate observation from interpretation |
| Prototype test | Neutral task and observable success | Does not prove backend feasibility |
| Requirement ID | Stable ID linked to source and test | Preserves traceability |
| Functional requirement | Observable behavior | Include acceptance criteria |
| Non-functional requirement | Quality plus test conditions | Avoid “fast” without a threshold |
| Assumption | Unverified belief with owner/date | Do not silently commit to it |
| Dependency | External input or decision needed | Define fallback and consequence |
| Sign-off | Baseline version and exclusions approved | Changes still use change control |
| Privacy | Purpose, consent, minimization, retention | Follow applicable rules |
| Accessibility | Keyboard, semantics, contrast, motion | Include during discovery |
| Success metric | Outcome-aligned measure and guardrail | Avoid vanity metrics |
| Change request | Benefit, effort, risk, trade-off | Update affected tests |
| Evidence confidence | High/medium/low with rationale | Low confidence can trigger research |

## Build Challenge

### Build: Client Requirements Gathering for a Creative Studio Portfolio

Create a decision-ready artifact set for a fictional creative studio redesign. The work must connect audience evidence to a tested user journey and a release boundary. The goal is not to produce documentation for its own sake; the output should let a small team begin design and implementation without guessing about the core outcome or failure behavior.

**Requirements**

1. Define the business outcome and one guardrail metric.
2. Map sponsor, operator, audience, approver, and technical blocker roles.
3. Write a neutral interview guide with at least five prompts.
4. Document one observation separately from its interpretation.
5. Run a card-sorting or affinity-mapping exercise using real content labels.
6. Create a prototype test task with an observable success signal.
7. Write at least eight functional and non-functional requirements.
8. Give each requirement a stable ID, source, acceptance criteria, and verification method.
9. Maintain an assumption and dependency register with owners.
10. Document privacy, consent, accessibility, and retention considerations.
11. Publish scope inclusions, exclusions, and unresolved decisions.
12. Review the baseline with a decision owner and log changes.

**Expected output / definition of success**

- A reviewable client requirements gathering artifact set tied to the studio’s stated business outcome.
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
