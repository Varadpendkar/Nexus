# SKILL: wireframing-workflow
**Layer:** 17 — Requirements & Design
**Goal:** Move from task evidence to progressively precise wireframes and prototypes, validating structure and behavior before visual polish or implementation locks in expensive assumptions.

---

## Why This Matters (Senior Perspective)

Requirements and design process is where delivery risk is either reduced cheaply or pushed into implementation, where it becomes expensive. A polished screen can still solve the wrong problem; a well-estimated sprint can still deliver a feature nobody needs. This skill treats evidence, decisions, and verification as a connected system rather than paperwork performed before “real work” starts.

For creative web and freelance work, unclear expectations are especially costly: clients often describe a visual solution before the audience, content, operating constraints, or success measure is clear. The senior approach is to make assumptions visible, test risky choices early, record decisions, and translate the agreed outcome into artifacts that design, engineering, QA, and the client can all inspect.

## Core Concepts

### 1. Choose fidelity to answer a question

Lo-fi, mid-fi, and hi-fi wireframes are levels of commitment, not a linear ceremony. Lo-fi explores structure and hierarchy cheaply; mid-fi clarifies layout, content, and interaction; hi-fi validates visual direction and realistic prototype behavior. Pick the least expensive artifact that answers the current risk.

**Working pattern**

```text
wireframe_plan = {
    "lo_fi": "Compare two project page structures",
    "mid_fi": "Validate content hierarchy, filters, and contact flow",
    "hi_fi": "Test brand styling, responsive behavior, and motion cues",
}
# Fidelity should rise when uncertainty falls and a decision needs greater realism.
```

**Gotcha:** Polishing a high-fidelity screen before validating its information architecture makes changes expensive.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 2. Start from tasks and content

Build the frame around the user’s task and required content, not around empty rectangles. For a case study, identify the project context, role, constraints, process, outcome, and next action before arranging modules. Missing content creates false confidence in a layout.

**Working pattern**

```text
case_study_content = [
    "Project title and client-safe summary",
    "Challenge and constraints",
    "Studio role and deliverables",
    "Process decisions",
    "Measured outcome or honest qualitative result",
    "Related work and contact action",
]
# If real content cannot fit, revise the hierarchy before reducing legibility.
```

**Gotcha:** Placeholder text is often shorter than real copy and can conceal wrapping, density, and accessibility problems.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 3. Lo-fi wireframes for divergent exploration

Use quick sketches, grayscale blocks, and simple labels to compare alternatives. Avoid detailed colors and typography while testing structure. Make alternatives meaningfully different—such as editorial case-study navigation versus filter-first discovery—rather than creating cosmetic variants.

**Working pattern**

```text
lo_fi_options = {
    "A": ["Service-led index", "Project cards", "Persistent contact action"],
    "B": ["Featured case study", "Outcome-led stories", "Related projects"],
}
# Review both against user tasks and content evidence, not personal taste alone.
```

**Gotcha:** Lo-fi does not mean careless: hierarchy, grouping, labels, and task completion still need to be understandable.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 4. Mid-fi wireframes for behavior and content

Mid-fi wireframes should settle key layout proportions, realistic content lengths, responsive rearrangement, component states, and navigation behavior. Include selected, disabled, loading, empty, and error states wherever a user can encounter them.

**Working pattern**

```text
filter_states = ["default", "selected", "no-results", "loading", "failed"]
# Draw each state and document how a user returns to a useful result.
# The state inventory prevents a static screen from hiding interaction work.
```

**Gotcha:** A mid-fi prototype that only shows the default state is not sufficient for complex filters or forms.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 5. Hi-fi wireframes and visual validation

Hi-fi artifacts apply real typography, color, spacing, imagery, and component styling to test brand direction and realistic perception. They should use approved assets and plausible content, while marking any interaction that is simulated rather than implemented.

**Working pattern**

```text
hi_fi_review = {
    "brand": "Uses approved color and type tokens",
    "content": "Uses representative case-study copy and image crops",
    "states": "Shows focus, hover, error, and success",
    "prototype_limits": "CRM delivery is simulated; backend is not connected",
}
# Explicitly label simulation so stakeholders do not mistake a prototype for a working system.
```

**Gotcha:** A clickable prototype can create a false impression of feasibility when its data and integrations are mocked.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 6. Responsive wireframes and breakpoints

Design the information hierarchy across narrow, medium, and wide viewports. Do not merely shrink a desktop frame. Decide which content stacks, reorders, collapses, or becomes horizontally scrollable; verify touch targets and ensure no critical action disappears on mobile.

**Working pattern**

```text
responsive_rules = {
    "wide": "Three-column project grid; filter rail visible",
    "medium": "Two-column grid; filters open in a panel",
    "narrow": "Single-column cards; filters use a labelled disclosure",
}
# Describe behavior at ranges, not just three static widths.
```

**Gotcha:** A mobile frame can look fine while the actual content order creates a confusing reading sequence.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 7. Interaction annotations and states

Wireframes need enough annotation to explain behavior that the drawing cannot show. Specify trigger, resulting state, persistence, keyboard behavior, validation, and failure recovery. Keep annotations concise and link them to a component or story ID for traceability.

**Working pattern**

```text
interaction_spec = {
    "control": "Service filter",
    "trigger": "User activates checkbox or presses Space while focused",
    "result": "Project list updates and result count changes",
    "empty": "Explain no matches and provide Clear filters",
    "failure": "Keep selected values and offer retry",
}
# An annotation should resolve implementation ambiguity, not narrate obvious visuals.
```

**Gotcha:** A note like “filter works” leaves keyboard behavior, empty results, and errors undefined.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 8. Prototype paths and usability tasks

Prototype the critical path, not every decorative click. Create realistic tasks that start from a user goal and have an observable success condition. Avoid coaching the participant through the intended navigation; watch where they hesitate and record whether the prototype itself limited the task.

**Working pattern**

```text
usability_task = {
    "prompt": "Find a project that demonstrates ecommerce experience and contact the studio about similar work.",
    "success": "Participant identifies relevant evidence and reaches a usable enquiry form",
    "observe": ["misclicks", "backtracking", "label interpretation", "confidence"],
}
# Keep task wording neutral so the test measures discoverability.
```

**Gotcha:** Asking “Can you click the Ecommerce filter?” tests execution after guidance, not whether users find the filter.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 9. Accessibility annotations

Use semantic intent even in a visual artifact: heading hierarchy, labels, landmarks, focus order, error associations, and alternative text decisions. The final implementation must be tested with keyboard and assistive technology; a wireframe can surface requirements but cannot certify accessibility.

**Working pattern**

```text
accessibility_notes = {
    "page_title": "Unique and descriptive",
    "heading_order": "Sections follow meaningful hierarchy",
    "form_errors": "Inline text linked to the relevant field",
    "keyboard": "Focus order follows reading and task order",
}
# Design for accessible behavior before colors and micro-interactions are finalized.
```

**Gotcha:** A red error border without text or programmatic association is not adequate error feedback.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 10. Designing for real content and localization

Use realistic lengths, translated strings where relevant, and actual image ratios. Plan for long headings, missing optional fields, and content editors who do not control exact copy length. Wireframes should show how components adapt instead of assuming all cards are uniform.

**Working pattern**

```text
content_variants = [
    "Short title: Studio identity refresh",
    "Long title: A multi-market digital experience for a growing commerce platform",
    "No metric: Outcome described qualitatively with client approval",
]
# Test content stress cases before component dimensions become fixed.
```

**Gotcha:** A rigid card height often clips real editorial content or forces inconsistent truncation.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 11. Design handoff and decision log

Handoff should include source file, frame naming, responsive rules, reusable components, interaction notes, assets, open questions, and acceptance criteria. Record why major decisions were made so a later developer does not recreate rejected options.

**Working pattern**

```text
handoff_checklist = [
    "Frames named by page, viewport, and state",
    "Components linked to design-system definitions",
    "Interactions and failure states annotated",
    "Assets exported with clear names and licenses",
    "Open questions assigned to an owner",
]
# A handoff is successful when implementation can proceed without guessing key behavior.
```

**Gotcha:** A screenshot-only handoff loses responsive rules, focus states, component reuse, and rationale.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 12. Evaluate wireframes against requirements

Map frames and prototype paths to the requirement baseline. Check that each important user goal is supported and each acceptance criterion has a visible design response. Missing requirements should become explicit gaps, not quietly disappear because a screen looks polished.

**Working pattern**

```text
coverage = {
    "FR-04_filter_projects": "Project index / filter states",
    "FR-07_submit_enquiry": "Contact form / validation / confirmation",
    "NFR-02_keyboard": "Focus order annotations / keyboard prototype test",
}
# Review coverage with product, design, engineering, and QA before sign-off.
```

**Gotcha:** Reviewing screens one by one can miss a requirement that spans the whole journey.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 13. Prototype testing and iteration

Run a small, focused usability round, identify repeated breakdowns, and revise the design. Separate observed evidence from recommendations. Re-test the changed critical path rather than assuming a visual tweak fixed the underlying comprehension issue.

**Working pattern**

```text
finding = {
    "observation": "Three participants missed the related-work link",
    "impact": "Could not compare relevant evidence",
    "hypothesis": "Link is visually subordinate to decorative metadata",
    "change": "Move related work into a labelled section near outcomes",
    "retest": "Repeat the compare-project task with new participants",
}
# Tie every change to a finding or a clearly stated design hypothesis.
```

**Gotcha:** Changing a color because one participant disliked it is weaker than tracing a repeatable task failure.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### 14. Creative portfolio wireframe workflow end to end

For a studio portfolio, move from task and content inventory to lo-fi alternatives, mid-fi behavior, hi-fi visual direction, then prototype testing. Validate project discovery and enquiry conversion before investing in a complex animated hero. Ensure reduced-motion, mobile fallback, loading, and failure behavior are represented.

**Working pattern**

```text
workflow = [
    "Inventory content, audience tasks, and requirements",
    "Sketch two structurally different lo-fi options",
    "Select one based on evidence and map key user flows",
    "Build mid-fi responsive layouts and all critical states",
    "Apply design tokens and real assets for hi-fi validation",
    "Test project discovery and enquiry with representative users",
    "Record decisions, accessibility requirements, and handoff gaps",
]
# The deliverable is a tested design direction, not merely a gallery of screens.
```

**Gotcha:** A portfolio succeeds when visitors understand the work and can act—not when every frame looks impressive in isolation.

**Naive approach:** Commit to the first plausible interpretation and let downstream roles fill in missing behavior.

**Correct approach:** Preserve the evidence, decision, and observable result together; validate uncertainty before it becomes expensive work.

### Field Guide: Field guide: validate structure before visual polish

#### Field note 1: Build the content inventory first

List the content and actions users need to complete their tasks. For each module, record source, owner, expected length, required fields, optional fields, and what happens when content is missing. Use real or representative content in the wireframe. A card with a two-word title behaves differently from one with a long title and a two-line outcome statement.

**Applied example and review check**

For case studies, identify whether outcome metrics are always available, whether clients can be named, and whether project imagery can be shown. If these facts are unknown, design a graceful alternative rather than assuming every case study has identical assets.

#### Field note 2: Use fidelity deliberately

Lo-fi work is ideal when comparing information architecture, page structure, and alternative task paths. Mid-fi is appropriate when content density, responsive layout, component states, and interaction rules need review. Hi-fi is useful for validating visual identity, image treatment, typography, and a realistic prototype. Fidelity should rise as important uncertainty falls—not because a stakeholder asks for more polish.

**Applied example and review check**

Maintain a short decision statement for each prototype: “This round tests whether visitors understand the service categories.” If the artifact cannot answer that question, simplify it or change the test.

#### Field note 3: Review responsive behavior as a system

Create rules for how the layout changes, not just a screenshot at each width. Specify whether the reading order changes, filters become a disclosure, navigation collapses, and secondary content moves below the primary action. Check zoom and text enlargement as well as nominal viewport sizes.

**Applied example and review check**

Do not hide a critical contact action just to preserve a visual composition. When a layout changes, preserve the task hierarchy and make sure focus order follows the visible and meaningful sequence.

#### Field note 4: Test prototypes with realistic tasks

Give participants a goal that reflects the real audience. Observe the first click, misinterpretations, backtracking, confidence, and recovery. Ask what they expected after they complete or abandon the task. Record the difference between a user problem and a prototype limitation. Avoid asking participants to rank visual variants without understanding the task each variant supports.

**Applied example and review check**

Formative usability rounds are useful for finding recurring problems but do not automatically produce statistically representative conclusions. Explain how many people participated and what the evidence can and cannot support.

#### Field note 5: Prepare an implementation-ready handoff

The handoff should identify frames, breakpoints, components, states, asset locations, typography, interaction rules, accessibility expectations, and unresolved questions. Link requirements and stories to the frames that satisfy them. Mark what is intentionally omitted from the prototype. Include error, empty, loading, and success states where the user can reach them.

**Applied example and review check**

Before sign-off, ask a developer and tester to walk through the critical journey without oral explanation from the designer. Any unanswered implementation question should become an annotation, an agreed design decision, or a tracked open question.

### Operational Review Notes

#### Review note 1: Frame naming and source control

Name frames by page, viewport, and state so a reviewer can locate the correct artifact without searching through ambiguous “final-v3” files. Keep obsolete directions marked as rejected or archived instead of leaving multiple competing versions that look approved. Link a frame to its requirement or story identifier when the mapping is important. For teams using shared design files, agree who can approve changes and how handoff status is signaled.

#### Review note 2: Prototype realism boundaries

A prototype may simulate loading, validation, or successful submission without actually running the underlying service. Mark these boundaries clearly in the artifact and in research notes. If a participant cannot complete a task because a link is not wired, classify it as a prototype limitation; if the participant cannot find the link, classify it as a potential usability issue. Keep these categories separate so findings lead to the right fix.

#### Review note 3: Designing motion without hiding content

If a portfolio uses scroll effects or a WebGL hero, wireframe the initial content, loading state, reduced-motion behavior, and fallback. The primary project information and contact route should remain accessible if the effect is delayed, disabled, or unsupported. Avoid making navigation dependent on an animation completing. A visual transition can enrich hierarchy, but it should not be the only way a user discovers a control.

#### Review note 4: Handoff quality check

Ask a developer to implement one representative component and ask QA to derive tests from the prototype. If either role needs repeated verbal clarification, update the handoff. Verify asset rights and export sizes, note font loading requirements, document responsive behavior, and identify content that still needs approval. A handoff is complete when important decisions are discoverable and testable—not when the design file is merely shared.

## Relevant Patterns

The following patterns are reusable workflows. Each is designed for a real trigger and includes a practical implementation sketch.

### Pattern 1: Fidelity ladder

**What it does:** Fidelity ladder in a repeatable form.

**When to use it:** Use when choosing what to prototype for a design question.

```python
artifact = {"lo-fi": "Compare structure", "mid-fi": "Resolve content and behavior", "hi-fi": "Validate brand and realistic interaction"}
# Use the lowest fidelity that can answer the current question reliably.
```

Do not increase fidelity to impress stakeholders before resolving major uncertainty.

### Pattern 2: Content-first frame

**What it does:** Content-first frame in a repeatable form.

**When to use it:** Use when a page layout is being designed with incomplete copy.

```python
modules = ["Project challenge", "Studio role", "Process", "Outcome", "Related work", "Contact action"]
# Put representative lengths into each module before fixing card heights and spacing.
```

Placeholder copy routinely hides real wrapping and hierarchy problems.

### Pattern 3: State-complete component wireframe

**What it does:** State-complete component wireframe in a repeatable form.

**When to use it:** Use when a component has filters, forms, asynchronous data, or permissions.

```python
states = ["default", "focus", "loading", "empty", "invalid", "failed", "success"]
# Sketch the states that users can reach, not only the ideal screenshot.
```

Do not create impossible states just to inflate the deliverable; ground them in system behavior.

### Pattern 4: Responsive behavior specification

**What it does:** Responsive behavior specification in a repeatable form.

**When to use it:** Use when a desktop composition must work across viewport sizes.

```python
rules = {"wide": "3-column grid", "medium": "2-column grid and filter panel", "narrow": "single-column list and filter disclosure"}
# Specify content order, control behavior, and what remains available at each range.
```

Static viewport mockups alone do not specify transitions between sizes.

### Pattern 5: Task-based prototype test

**What it does:** Task-based prototype test in a repeatable form.

**When to use it:** Use when the team needs evidence about discoverability.

```python
task = "Find a project with relevant commerce experience and contact the studio"
observe = ["first click", "hesitation", "backtracking", "task success"]
# Do not tell participants which control to use.
```

A guided demo measures whether users can follow instructions, not discover the interface.

### Pattern 6: Handoff contract

**What it does:** Handoff contract in a repeatable form.

**When to use it:** Use when design is moving into implementation.

```python
handoff = ["Named frames and states", "Responsive rules", "Component links", "Assets and licenses", "Acceptance criteria", "Open decisions and owners"]
# Include behavior and constraints that are invisible in a screenshot.
```

A design link without annotations can still leave engineering to guess about failure behavior.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| High fidelity too early | Polish increases attachment to an unvalidated structure. | Start lo-fi and increase fidelity only to answer a specific question. |
| Placeholder content too short | Real text causes wrapping and layout failure. | Use representative copy and stress-test long titles and missing content. |
| Desktop simply shrunk | Mobile hierarchy and interactions differ. | Specify reordering, stacking, disclosure behavior, and touch targets. |
| Only default state drawn | Loading, empty, error, and focus behavior remain unknown. | Create a state inventory for every interactive component. |
| Unlabelled interactions | Developers infer triggers and persistence. | Annotate trigger, result, validation, keyboard behavior, and recovery. |
| Prototype guides participants | The test measures compliance rather than discoverability. | Use neutral tasks and avoid naming the control they should click. |
| Screenshot-only handoff | Responsive behavior and state logic are missing. | Deliver source frames, component links, annotations, assets, and open questions. |
| Accessibility only visual | Focus order and semantics are invisible in a screenshot. | Annotate landmarks, labels, keyboard flow, and error associations. |
| Content hierarchy based on aesthetics | Decorative modules displace evidence users need. | Rank content by user task and business outcome before visual styling. |
| Mock mistaken for real integration | Clickable prototype appears production-ready. | Mark simulation boundaries and validate risky integrations separately. |
| No design rationale | Rejected options are repeatedly proposed. | Keep a concise decision log with evidence and trade-offs. |
| Overly complex single diagram | Reviewers cannot follow branches. | Use a top-level journey and linked subflows with stable IDs. |
| No real image crops | Image ratios and focal points break the grid later. | Test representative approved assets and responsive crop behavior. |
| Fixed heights clip localization | Long strings or translated text overflow. | Use content-driven sizing and test long labels and zoom. |
| Color-only error cues | Some users cannot perceive the difference. | Pair color with text, iconography, and programmatic field association. |
| Prototype covers every click but not task | Decorative interactions consume time while critical journey is absent. | Prototype the highest-risk end-to-end task first. |
| No requirement coverage review | A screen looks complete while a requirement is absent. | Map requirements to frames, states, and prototype tests before sign-off. |

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

1. **Fidelity follows uncertainty** — Use the cheapest artifact that answers the current question.
2. **Content is structure** — Real content lengths reveal hierarchy and layout stress.
3. **A screen is a state, not a system** — Design loading, focus, empty, error, and success states.
4. **Responsive is behavior** — Specify how order and controls change, not only viewport dimensions.
5. **Prototype the risk** — Test the path whose failure would cause the most rework.
6. **A screenshot is not a handoff** — Behavior, constraints, assets, and open decisions need a home.
7. **Evidence beats taste** — Iterate from observed task breakdowns, not isolated preference.

## Quick Reference Table

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Lo-fi | Structure and hierarchy | Use for divergent alternatives |
| Mid-fi | Content, layout, behavior | Show important states |
| Hi-fi | Brand, real assets, realistic prototype | Mark simulations |
| Content inventory | Required story evidence and actions | Use representative copy |
| Responsive rules | Order, stacking, control changes | Do not just shrink desktop |
| Interaction annotation | Trigger, state, recovery, keyboard | Avoid “works” notes |
| Prototype task | Neutral scenario and success signal | Do not coach participants |
| Focus order | Reading and task order | Test keyboard navigation |
| Empty state | Explain cause and recovery | Distinguish from failure |
| Handoff | Frames, assets, rules, criteria | Screenshot alone is insufficient |
| Localization | Long strings and translated content | Avoid fixed-height clipping |
| State inventory | Default, focus, loading, empty, error | Only include reachable states |
| Visual test | Real font, content, viewport | Wait for assets to load |
| Design rationale | Decision and evidence log | Prevents repeated debates |
| Coverage map | Requirement to frame/test | Find omissions before sign-off |
| Prototype limitation | Label mocked behavior | Separate UX proof from feasibility |

## Build Challenge

### Build: Wireframing Workflow for a Creative Studio Portfolio

Create a decision-ready artifact set for a fictional creative studio redesign. The work must connect audience evidence to a tested user journey and a release boundary. The goal is not to produce documentation for its own sake; the output should let a small team begin design and implementation without guessing about the core outcome or failure behavior.

**Requirements**

1. Create two meaningfully different lo-fi structures for project discovery.
2. Use representative content lengths and approved or realistic image ratios.
3. Build mid-fi desktop and narrow-screen layouts with responsive rules.
4. Show default, focus, loading, empty, invalid, failed, and success states for relevant components.
5. Annotate triggers, transitions, keyboard behavior, and recovery.
6. Create a hi-fi frame using the design system and realistic assets.
7. Prototype the task of finding relevant work and submitting an enquiry.
8. Write a neutral usability test prompt and success condition.
9. Record at least three findings as observation, impact, hypothesis, and proposed change.
10. Annotate landmarks, heading hierarchy, form labels, and focus order.
11. Map requirements to frames and prototype tests.
12. Prepare a handoff package with frame names, assets, open questions, and decisions.

**Expected output / definition of success**

- A reviewable wireframing workflow artifact set tied to the studio’s stated business outcome.
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
