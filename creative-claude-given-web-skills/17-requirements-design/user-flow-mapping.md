# SKILL: user-flow-mapping
**Layer:** 17 — Requirements & Design
**Goal:** Map a user’s end-to-end journey as explicit states, decisions, transitions, and recovery paths so teams can design, build, and test both successful and failed outcomes.

---

## Why This Matters (Senior Perspective)

Requirements and design process is where delivery risk is either reduced cheaply or pushed into implementation, where it becomes expensive. A polished screen can still solve the wrong problem; a well-estimated sprint can still deliver a feature nobody needs. This skill treats evidence, decisions, and verification as a connected system rather than paperwork performed before “real work” starts.

For creative web and freelance work, unclear expectations are especially costly: clients often describe a visual solution before the audience, content, operating constraints, or success measure is clear. The senior approach is to make assumptions visible, test risky choices early, record decisions, and translate the agreed outcome into artifacts that design, engineering, QA, and the client can all inspect.

## Core Concepts

### 1. Define boundaries, actor, and outcome

Start each flow with a specific actor, trigger, and completion condition. A flow that starts at “home” and ends at “success” may omit the actual user goal, external dependencies, or the moment the system has truly completed its work.

**Working pattern**

```text
flow_scope = {
    "actor": "Prospective client",
    "trigger": "Needs to discuss a project similar to a case study",
    "start": "Opens relevant project detail",
    "success": "Enquiry accepted and confirmation displayed",
    "out_of_scope": "Sales negotiation after submission",
}
# A clear boundary stops diagrams from becoming an entire business universe.
```

**Gotcha:** A confirmation screen is not proof that a downstream CRM or email delivery succeeded.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 2. Nodes, transitions, and decision rules

Represent user actions, system actions, decisions, and terminal states distinctly. Label decision branches with conditions that can actually be evaluated. Every transition should have a trigger and destination; avoid arrows that mean “somehow continue.”

**Working pattern**

```text
flow = [
    ("Project detail", "Select Contact", "User action"),
    ("Contact form", "Validate fields", "System action"),
    ("Validation result", "Valid?", "Decision"),
    ("Valid", "Submit enquiry", "System action"),
    ("Invalid", "Show field errors", "Recovery state"),
]
# Name transitions so engineering and QA can derive test cases.
```

**Gotcha:** A diamond labelled “OK?” is ambiguous unless the decision condition and both branches are documented.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 3. Happy path and alternate paths

The happy path describes successful completion; alternate paths capture legitimate variation such as optional fields, existing accounts, or different content routes. Keep the main path readable, but link alternate paths to the exact point where they branch.

**Working pattern**

```text
paths = {
    "happy": ["Open project", "Start enquiry", "Submit valid details", "See confirmation"],
    "alternate": ["Open project", "Start enquiry", "Choose not to share budget", "Submit valid details"],
}
# Optional information should not accidentally block a valid user journey.
```

**Gotcha:** A diagram with only the happy path leaves designers inventing behavior when real users deviate.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 4. Error states: failed form and validation

Define field-level errors, form-level failures, retained values, retry behavior, and focus management. A failed form should explain what happened and how to recover. Distinguish invalid user input from server rejection and network failure because the remedies differ.

**Working pattern**

```text
error_states = {
    "required_field": "Show a field-specific message and focus the first invalid field",
    "server_rejection": "Explain that the request was not accepted; preserve safe input",
    "network_timeout": "Keep entered data and offer retry without duplicate submission",
}
# Never claim the enquiry was sent when the server has not confirmed acceptance.
```

**Gotcha:** A generic “Something went wrong” message gives no actionable recovery and can cause duplicate submissions.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 5. Empty states, 404, and missing content

Map empty state and 404 behavior as real states, not visual afterthoughts. Explain whether no results are expected, filters are too restrictive, or a resource no longer exists. Provide a safe next action without implying that deleted or inaccessible content is available.

**Working pattern**

```text
empty_state = {
    "no_filter_matches": "No projects match these filters. Clear one or more filters.",
    "empty_collection": "Projects are being prepared. Explore our services meanwhile.",
    "not_found": "This project may have moved. Return to all projects.",
}
# Different causes require different language and recovery links.
```

**Gotcha:** Showing “No results” for a server failure misleads users into changing filters when the system is broken.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 6. Timeouts and asynchronous dependencies

External services can be slow or unavailable. Model loading, timeout, retry, and terminal failure states. Choose retry behavior carefully: repeat safe reads automatically when appropriate, but avoid silently replaying non-idempotent writes such as creating an enquiry unless the server supports deduplication.

**Working pattern**

```text
async_flow = {
    "pending": "Show progress and prevent accidental repeated activation",
    "timeout": "Explain that confirmation is delayed",
    "retry": "Reuse a request idempotency key for the same submission",
    "terminal_failure": "Offer a safe alternate contact route",
}
# The server must own deduplication; disabling a button alone is not enough.
```

**Gotcha:** A frontend timeout does not prove the server did not process the request.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 7. Authentication, authorization, and session expiry

For flows requiring accounts, distinguish unauthenticated, authenticated, and unauthorized states. Decide what happens when a session expires mid-task and preserve only data that can be stored safely. Hiding a button is not authorization; server endpoints must enforce permissions.

**Working pattern**

```text
session_policy = {
    "expired_before_submit": "Prompt sign-in and preserve non-sensitive draft where approved",
    "forbidden_resource": "Show an access-denied state without leaking private details",
    "server_rule": "Authorize every protected request on the server",
}
# Client-side route guards improve UX but do not replace server checks.
```

**Gotcha:** A 404 can be appropriate for private resources when revealing existence would leak sensitive information; choose policy deliberately.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 8. Accessibility and alternate input paths

Map keyboard focus, screen-reader announcements, touch behavior, and reduced-motion alternatives into transitions. A modal flow must define focus entry, focus containment, close behavior, and focus return. Error recovery should not rely on color or pointer-only gestures.

**Working pattern**

```text
dialog_flow = [
    "User activates Contact",
    "Dialog opens and focus moves to its heading or first field",
    "Escape closes the dialog when safe",
    "Focus returns to the Contact trigger",
]
# Ensure each transition can be completed with keyboard and assistive technology.
```

**Gotcha:** A visually obvious drawer can still trap users if focus moves behind it or never returns to its trigger.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 9. Analytics and privacy-aware event points

Choose events that answer product questions: project viewed, filter applied, enquiry started, validation failed, submission accepted. Avoid sending form content, email addresses, or other personal data in analytics payloads. Define event names and success semantics consistently.

**Working pattern**

```text
analytics_events = [
    "project_viewed",
    "project_filter_applied",
    "enquiry_started",
    "enquiry_validation_failed",
    "enquiry_accepted",
]
# Track state transitions, not sensitive field values or raw form payloads.
```

**Gotcha:** Counting button clicks as successful enquiries inflates conversion when validation or server delivery fails.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 10. Flow ownership and system boundaries

Identify which transitions are controlled by the browser, backend, CMS, CRM, email provider, or human operator. Mark external dependencies and what the user sees if they fail. A flow map should expose operational handoffs instead of hiding them behind “system processes request.”

**Working pattern**

```text
system_boundary = {
    "browser": "Collects and validates for immediate feedback",
    "application_server": "Validates, authorizes, and persists enquiry",
    "crm": "Receives a retryable integration event",
    "sales_team": "Reviews and follows up",
}
# Assign a failure owner and monitoring signal to every external boundary.
```

**Gotcha:** If CRM failure is omitted from the diagram, the team may build a UI that reports success while losing leads.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 11. State tables and flow-to-test translation

Convert important nodes and transitions into a state table with preconditions, action, expected result, and recovery. This exposes missing branches and gives QA a test matrix. Use identifiers so the diagram, story, and test case can be traced together.

**Working pattern**

```text
test_case = {
    "id": "FLOW-ENQ-06",
    "given": "Valid form data and CRM unavailable",
    "when": "Visitor submits enquiry",
    "then": "Server records accepted request and queues delivery retry",
    "recovery": "Visitor sees truthful confirmation; operations receives alert if retries exhaust",
}
# Test the user-visible contract and the operational recovery path.
```

**Gotcha:** A diagram is not testable when its nodes use subjective labels like “good response” or “handle issue.”

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 12. Complexity control and diagram layering

Use a top-level map for the primary journey and separate subflows for forms, authentication, payment, or integrations. Keep each diagram focused on one decision space and use stable IDs for cross-references. A giant map may technically include every state but be impossible to review.

**Working pattern**

```text
flow_layers = {
    "L1": "Discover project -> evaluate work -> contact studio",
    "L2": "Enquiry form validation and submission",
    "L3": "Server persistence, CRM delivery, retry and alerting",
}
# Link layers by named entry and exit states rather than duplicating every detail.
```

**Gotcha:** Over-splitting can also hide dependencies; each subflow needs a clear contract with its parent.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 13. Validate the flow with users and delivery teams

Walk through the map with a user or representative and with engineering, QA, content, and operations. Ask each role to identify missing states. Test the riskiest branches with a prototype or technical spike before treating the map as approved.

**Working pattern**

```text
review_questions = [
    "What does the user believe happened at this point?",
    "What if the network drops after the server receives the request?",
    "Can the user recover without losing entered information?",
    "Who sees the alert if retries are exhausted?",
]
# A flow is a shared model to challenge, not a diagram to defend.
```

**Gotcha:** Stakeholders often approve a flow because the happy path is familiar; deliberately review the failure branches.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 14. Portfolio enquiry journey from project to CRM

Map the visitor’s route from discovering a relevant project to evaluating evidence, submitting a contact form, receiving confirmation, and having the enquiry delivered to the CRM. Include no-results, 404, validation failure, timeout, duplicate submission, and CRM outage states.

**Working pattern**

```text
journey = [
    "Project index -> filter projects",
    "No matches -> clear filters or browse all",
    "Project detail -> review role and outcomes",
    "Contact form -> validate fields",
    "Invalid -> show linked errors and preserve values",
    "Valid -> persist request with idempotency key",
    "CRM delayed -> queue retry and alert operations",
    "Accepted -> show truthful confirmation",
]
# Success means the user understands the result and the business can reliably follow up.
```

**Gotcha:** The final flow must represent user experience and backend truth together; otherwise conversion metrics and user trust diverge.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### Field Guide: Field guide: turn diagrams into reliable behavior

#### Field note 1: Use states that reflect system truth

A state describes what is actually true, not merely what the interface looks like. “Submitting” means a request is in progress; “accepted” means the application has confirmed the defined acceptance condition. If a third-party CRM is asynchronous, the user-facing system may accept and persist the enquiry before CRM delivery completes. Make that distinction explicit in the diagram and in the product copy.

**Applied example and review check**

Do not show “Email sent” when the server only queued a job. Prefer truthful language such as “Your enquiry has been received” only when the application has durably accepted it. Operational delivery can be monitored and retried separately.

#### Field note 2: Model retry and duplicate protection

A timeout can occur after the server processed a request but before the browser received a response. Retrying a write can therefore create duplicates unless the operation is idempotent. The flow should specify how the client reuses a request identifier, how the server detects duplicates, and what the user sees while status is uncertain.

**Applied example and review check**

Disabling the submit button prevents some accidental clicks but does not protect against refreshes, multiple tabs, or network retries. Deduplication belongs in the server-side contract and should be tested under realistic failure conditions.

#### Field note 3: Design recovery, not just error copy

A recovery path needs an understandable message and a safe next action. For invalid fields, associate errors with the inputs and focus an appropriate location. For a network timeout, preserve input where safe and clarify whether retry is safe. For a 404, offer a relevant navigation route. For a permissions failure, avoid leaking details about protected resources.

**Applied example and review check**

A generic error dialog that closes the form can destroy user input and increase support cost. Define which values remain, which actions are available, and whether the user needs to repeat any work.

#### Field note 4: Connect flow events to operations

For external integrations, map not only the visitor journey but also the operational path: persistence, queueing, retries, alert thresholds, and manual recovery. Assign an owner for exhausted retries and define what evidence appears in logs. Do not put personal form contents into analytics events or general-purpose logs unless a reviewed policy explicitly permits necessary, protected handling.

**Applied example and review check**

A diagram is a good place to expose responsibility gaps. If nobody owns an alert, the path is incomplete even if every UI screen has been drawn.

#### Field note 5: Keep the map testable and maintainable

Give important nodes and transitions stable identifiers and link them to acceptance criteria and test cases. Use a readable top-level map with linked subflows for complex details. When the flow changes, update the affected tests and note the decision. Review the map with design, engineering, QA, and operations because each role sees different failure modes.

**Applied example and review check**

Do not use diagrams as a substitute for detailed interface or API contracts. The flow explains sequence and state; other artifacts may define payloads, validation schemas, permissions, and timing requirements.

### Operational Review Notes

#### Review note 1: Distinguish user state from service state

A visitor can see a confirmation while an asynchronous downstream service is still pending. Model the user-facing state and operational state separately where they have different truth conditions. Define what the application promises at each point: received, accepted, queued, delivered, or completed. These words should match the system contract and support messages that remain accurate during outages.

#### Review note 2: Failure recovery should be observable

For each important failure, specify what evidence proves recovery succeeded. A retry button being clicked is not proof that the request succeeded. Record whether a retry was accepted, whether the queue drained, and whether an alert cleared. Use appropriate monitoring and avoid exposing internal system details to users. This makes the flow useful to both product teams and operators.

#### Review note 3: Review accessibility transitions

Check where focus moves after opening a dialog, submitting a form, receiving validation errors, navigating to a new page, or closing an overlay. Screen-reader announcements should communicate meaningful state changes without repeating the entire page. Ensure the user can reach the same important outcomes without pointer-only gestures or motion-dependent timing. Test with keyboard navigation and assistive technology rather than relying only on diagram review.

#### Review note 4: Keep diagrams synchronized

A flow map becomes dangerous when it describes behavior the product no longer has. Include an owner, revision date, and links to the related requirements and tests. When implementation reveals an unanticipated branch, update the flow if it affects user behavior, operations, or acceptance. Treat the diagram as a maintained product artifact, not a one-time deliverable for a presentation.

## Relevant Patterns

The following patterns are reusable workflows. Each is designed for a real trigger and includes a practical implementation sketch.

### Pattern 1: Explicit decision branches

**What it does:** Explicit decision branches in a repeatable form.

**When to use it:** Use when behavior depends on validation, permissions, or service results.

```python
branches = {"valid": "Continue to submit", "invalid": "Show linked field errors", "unknown": "Show safe retry path"}
# Label every branch with an evaluable condition.
```

A diagram that uses unlabeled arrows leaves behavior open to interpretation.

### Pattern 2: Error and recovery path

**What it does:** Error and recovery path in a repeatable form.

**When to use it:** Use for forms or external integrations.

```python
failure = {"message": "We could not confirm submission", "preserve_input": True, "retry": "Safe idempotent retry", "fallback": "Alternative contact route"}
# Make the recovery action match the actual failure cause.
```

Never show a success state before the server confirms the request was accepted.

### Pattern 3: Empty and not-found handling

**What it does:** Empty and not-found handling in a repeatable form.

**When to use it:** Use for filtered lists, deleted content, and CMS gaps.

```python
states = {"empty_filter": "Clear filters", "empty_collection": "Explore services", "404": "Return to project index"}
# Distinguish a valid empty result from a broken request.
```

Do not label a network error as an empty list.

### Pattern 4: External system boundary

**What it does:** External system boundary in a repeatable form.

**When to use it:** Use when the journey crosses a CRM, payment, email, or CMS service.

```python
owners = {"browser": "Input and feedback", "server": "Validation and persistence", "CRM": "Lead delivery", "operations": "Retry exhaustion alert"}
# Assign an owner and failure signal to each boundary.
```

“System sends data” hides retries, duplicates, and ownership.

### Pattern 5: Flow-to-test matrix

**What it does:** Flow-to-test matrix in a repeatable form.

**When to use it:** Use before QA planning or acceptance review.

```python
test = {"given": "CRM unavailable", "when": "Valid enquiry submitted", "then": "Request persists and retry is queued", "recovery": "Alert if retries exhaust"}
# Give each important transition a traceable test identifier.
```

A flow node is not adequately specified by a subjective phrase such as “handled properly.”

### Pattern 6: Accessibility state path

**What it does:** Accessibility state path in a repeatable form.

**When to use it:** Use when dialogs, menus, or multi-step forms are involved.

```python
dialog = ["Open and move focus in", "Operate controls by keyboard", "Close safely", "Return focus to trigger"]
# Include focus and announcement transitions alongside visual state changes.
```

A modal flow can appear correct while keyboard focus remains behind the overlay.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Only happy path shown | Real users encounter validation, service, and content failures. | Add alternate, error, empty, timeout, and recovery branches. |
| Decision branch unlabeled | The condition cannot be implemented or tested. | Name the condition and each outcome explicitly. |
| UI success confused with backend success | A screen claims submission before persistence. | Define the server-confirmed state and use truthful messaging. |
| No empty state | Valid filters can produce a dead end. | Explain why the list is empty and offer a clear recovery action. |
| 404 treated like empty results | Missing content and no matches have different causes. | Give not-found pages a distinct state and navigation recovery. |
| Retry duplicates a write | The original request may have succeeded despite timeout. | Use server-side idempotency and a stable request key. |
| CRM boundary hidden | Leads can be lost after the UI reports success. | Model persistence, queued retry, retry exhaustion, and operations alert. |
| Focus order omitted | Keyboard users cannot follow modal or error transitions. | Specify focus entry, containment, return, and error focus. |
| Analytics counts clicks as outcomes | Clicks include failed and invalid submissions. | Track validated and accepted state transitions separately. |
| Sensitive data in event payload | Analytics becomes a privacy risk. | Send event names and non-sensitive context, never raw form values. |
| One giant diagram | The map becomes unreadable and hard to maintain. | Separate top-level journey from detailed subflows and link them by IDs. |
| No actor or boundary | The flow includes unrelated processes and no clear completion. | Define actor, trigger, start, success, and exclusions. |
| No test traceability | Flow changes are not reflected in QA coverage. | Give critical transitions stable identifiers linked to tests. |
| Client-side authorization only | Protected endpoints can still be called directly. | Enforce authorization on the server for every protected action. |
| Timeout lacks honest status | Users may resubmit because they do not know what happened. | Distinguish pending, accepted, and failed; offer safe recovery. |
| No owner for failure | Operations cannot resolve repeated integration problems. | Assign a monitoring signal, owner, and escalation threshold. |
| Accessibility modeled separately | Visual flow differs from keyboard reality. | Include keyboard and assistive-technology transitions in the same flow. |

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

1. **A flow is a state model** — Nodes describe states or actions; transitions describe conditions and events.
2. **Success must be truthful** — UI confirmation should match what the server actually accepted.
3. **Every failure needs recovery** — A message without a next action is an incomplete state.
4. **External systems are part of UX** — A CRM outage can affect user trust even if it is not visible.
5. **Retry changes correctness** — Timeouts can happen after the server processed a request.
6. **Accessibility is a path** — Focus and announcements change as the flow changes.
7. **A diagram should generate tests** — If transitions cannot be checked, clarify them.

## Quick Reference Table

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Actor | Person/system initiating flow | Name role and goal |
| Trigger | Event that starts journey | Make start boundary explicit |
| Decision | Evaluable condition | Label both branches |
| Happy path | Successful expected route | Never use alone |
| Validation error | Invalid input feedback | Associate message with field |
| Empty state | No available content/results | Offer recovery |
| 404 | Resource unavailable | Different from empty results |
| Timeout | No timely response | May not mean request failed |
| Idempotency | Safe repeat of same write | Server enforces deduplication |
| External boundary | CRM/API/email/CMS | Assign failure owner |
| Analytics | State transition event | Never send raw personal data |
| Focus transition | Keyboard focus entry/return | Model modal behavior |
| State table | Given/action/result/recovery | Link to test ID |
| Subflow | Detailed part of journey | Keep entry/exit contracts |
| Authorization | Server-enforced access | UI hiding is insufficient |
| Operations alert | Threshold and escalation | Own retry exhaustion |

## Build Challenge

### Build: User Flow Mapping for a Creative Studio Portfolio

Create a decision-ready artifact set for a fictional creative studio redesign. The work must connect audience evidence to a tested user journey and a release boundary. The goal is not to produce documentation for its own sake; the output should let a small team begin design and implementation without guessing about the core outcome or failure behavior.

**Requirements**

1. Define actor, trigger, start state, success state, and scope exclusions.
2. Map the primary project-to-enquiry journey.
3. Include labeled decisions for valid and invalid form data.
4. Add empty-state and 404 recovery paths.
5. Add network timeout and duplicate-submission behavior.
6. Map CRM failure, queued retry, and operations alert.
7. Define session or authorization behavior if any private route exists.
8. Annotate keyboard focus and assistive-technology transitions.
9. Name analytics events without sending personal form data.
10. Create a state table for at least eight transitions.
11. Link critical transitions to acceptance tests.
12. Review with design, engineering, QA, and operations and record unresolved risks.

**Expected output / definition of success**

- A reviewable user flow mapping artifact set tied to the studio’s stated business outcome.
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
