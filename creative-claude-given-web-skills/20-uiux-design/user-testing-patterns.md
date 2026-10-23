# SKILL: user-testing-patterns

**Layer:** 43 — UI/UX Design

**Goal:** Design, moderate, analyze, and report usability tests that reveal whether people can complete meaningful tasks with an interface, while minimizing moderator bias and turning observed problems into actionable product improvements.

---

## Why This Matters (Senior Perspective)

User testing is one of the most direct ways to discover whether an interface supports the tasks it was designed to support. A screen can look polished in a design review and still fail when a person tries to use it without the designer's explanation. Labels may reflect internal product language rather than the user's mental model. A primary action may be visually prominent but difficult to reach by keyboard. A form may work with ideal sample data but break when the user enters a long name or receives an error. Testing exposes these gaps before they become expensive production problems.

A usability test is not a vote on whether participants like a design. Nor is it a demonstration in which the moderator teaches participants how the interface works. It is a structured observation of people attempting realistic tasks in a defined context. The team learns from task success, navigation paths, errors, hesitation, recovery, comprehension, and participant comments. Preferences and satisfaction can be useful supporting evidence, but they should not replace observation of actual behavior.

Good testing begins with a question and a plan. The team defines what it needs to learn, chooses realistic tasks, recruits people whose context fits the question, and decides what will count as evidence before the first session. During the session, the moderator avoids leading participants, gives them room to work, and records observable behavior separately from interpretation. Afterward, the team identifies patterns, considers counterexamples, assesses severity, and connects findings to a decision or follow-up test.

Senior practice also recognizes that a usability test has boundaries. Five sessions can uncover meaningful interaction issues, but they do not automatically estimate how common those issues are in the entire customer base. A prototype may reveal navigation problems while concealing network latency, permissions, or real-data complexity. A moderated study may not reflect how people behave under everyday interruptions. These limits do not make testing weak; they make careful framing essential.

Testing should include accessibility, edge cases, and failure recovery rather than treating them as later polish. Participants need clear consent, a safe environment, and the ability to stop. Recordings and notes should be handled according to approved privacy practices. The strongest test report does not merely list problems. It explains what happened, who or what context was affected, why the issue matters, how confident the team is, and what should happen next.

**Senior perspective:** test the user's ability to accomplish a goal, not the team's ability to explain a design. A useful session creates evidence that can change a product decision, and a useful report preserves the distinction between what was observed and what the team believes it means.

---

## Core Concepts

### 1. Define the research objective

Start with a focused objective that names the experience, task, and uncertainty. “Test the new dashboard” is not specific enough to guide task design or analysis. “Determine whether first-time users can locate a saved report and understand its current status” gives the team something observable to investigate.

```text
Objective:
Evaluate whether first-time users can locate a previously saved report and identify its status.

Key questions:
- Can participants find the report without help?
- Which labels or navigation paths do they try?
- Do they correctly interpret the status?
- What errors or uncertainty prevent completion?
```

Keep the objective small enough to address in the available session time. If the study needs to answer unrelated questions about onboarding, pricing, and long-term retention, split those questions or identify a primary objective and secondary observations.

**Gotcha:** if the team cannot describe what evidence would change the design decision, the test may be a demo disguised as research.

### 2. Define success before testing

Decide what task success means before observing participants. Success may be binary, graded, or measured across multiple dimensions, but the definition must be consistent enough to compare sessions.

```text
Task outcome rubric
- Success without assistance: completes the task and identifies the correct report.
- Success with minor difficulty: completes the task after a self-corrected detour.
- Assisted success: needs a moderator hint.
- Failure: cannot complete or identifies the wrong report.
```

You may also track time, errors, confidence, or path efficiency when those measures are relevant. Do not choose a success definition after seeing the results simply because it makes the design look better.

### 3. Recruit relevant participants

Recruit people whose experience and context match the study question. For a first-use flow, include people who have not already learned the interface. For a specialist workflow, domain familiarity may matter. Document recruiting criteria and exclusions before sessions begin.

```text
Study: Find a completed report
Include:
- People who regularly use digital productivity tools
- A mix of first-time and occasional users of similar products
- People who have not seen the tested prototype

Exclude or flag:
- Product team members familiar with internal terminology
- Anyone who has already been coached on the tested path
```

The criteria should reflect the population the team wants to understand. A convenience sample can be useful for early formative testing, but the report must not imply that it represents all customers.

### 4. Choose moderated or unmoderated testing

Moderated testing lets a facilitator observe behavior, ask follow-up questions, and investigate unexpected paths. Unmoderated testing can reach more participants efficiently and may better reflect independent task attempts, but the researcher has less control over context and cannot clarify confusion in real time.

```text
Choose moderated when:
- The task is complex or exploratory.
- You need to understand unexpected behavior.
- The prototype has limitations that require careful observation.

Choose unmoderated when:
- Tasks and success criteria are clear.
- The product can be tested reliably without intervention.
- You need broader directional evidence efficiently.
```

Neither format is automatically more rigorous. Select based on the question, participant needs, test environment, and quality of the instrumentation.

### 5. Create realistic task scenarios

A task should describe a goal in the participant's world, not reveal the interface path. The scenario should provide enough context to make the task meaningful without telling the participant which control to use.

```text
Weak:
Click Reports, choose Saved, and open the June report.

Better:
Your manager needs the report you saved last month. Find it and tell me whether it is ready to share.
```

Avoid tasks that depend on knowledge participants could not reasonably have. If a task requires a particular date, record, or account condition, ensure that the test environment contains it. Pilot tasks to catch ambiguity before formal sessions.

**Gotcha:** if the task wording contains the same label the interface is meant to test, it can unintentionally give away the answer.

### 6. Write a moderator guide

A guide creates consistency while leaving room to follow useful evidence. Include the introduction, consent, warm-up, task prompts, neutral probes, wrap-up, and notes on what to observe. A guide should be usable by another trained moderator without losing the study's intent.

```text
Session outline
1. Welcome, purpose, consent, and recording agreement
2. Brief context questions
3. Task prompt without interface instructions
4. Silent observation with neutral probes only when needed
5. Follow-up about expectations and difficult moments
6. Confidence or ease rating if relevant
7. Closing question and thanks
```

Keep the core prompts consistent across participants if comparison matters. Record any changes to task wording or moderation that could affect interpretation.

### 7. Establish a neutral moderation style

The moderator should not praise a correct path, express surprise at a wrong path, or rescue participants too quickly. Reassure people that the interface is being tested, not their intelligence. Neutral language reduces pressure to please the moderator.

```text
Useful:
"What were you expecting to happen?"
"What would you try next?"
"Tell me what you are looking for."

Avoid:
"Great, that's correct."
"Try the menu on the left."
"Didn't you see the blue button?"
```

If the participant is stuck, allow reasonable time, then use the least-leading probe permitted by the protocol. If assistance becomes necessary, record exactly what was said and classify the outcome as assisted rather than unaided success.

### 8. Use think-aloud without overloading participants

Think-aloud prompts can reveal what a participant notices and expects, but constant narration can slow the task or make people uncomfortable. Ask participants to share their thinking naturally and use brief reminders when they become silent.

```text
Opening prompt:
"As you work, please tell me what you're noticing and what you expect to happen. There are no right or wrong answers."

Neutral reminder:
"What are you considering right now?"
```

Do not treat a lack of narration as proof of confusion. Some people think quietly or find verbalization difficult. Observe their actions and ask follow-up questions after the task.

### 9. Observe behavior systematically

Record actions, errors, detours, hesitation, task outcome, and recovery. Avoid interpreting a facial expression or pause as a fact about the participant's mental state. If interpretation matters, ask a neutral question and label the answer as participant-reported evidence.

```text
Observation log
Timestamp | Task | Action | Outcome | Moderator intervention | Note
02:14 | Find report | Opened Activity | Wrong section | None | Searched for "completed"
02:39 | Find report | Opened Search | Found result | None | Correct report selected
```

Use a consistent observation template across sessions. If multiple observers take notes, align on definitions before testing so “error,” “hesitation,” and “assistance” do not mean different things to different people.

### 10. Track task completion and assistance

Task completion should distinguish unaided success from success that depends on hints. Assistance can change the outcome and must be recorded. A participant who succeeds after being told where to click has not demonstrated the same level of discoverability as someone who finds the path independently.

```text
Outcome codes
U = Unaided success
D = Success after self-corrected detour
A = Assisted success
F = Failure
N/A = Task not attempted or invalidated by test setup
```

Define the codes before the sessions. If you calculate a completion rate, state which outcomes count as completion and how invalid sessions are handled. Do not collapse all outcomes into a single success number without explaining the rubric.

### 11. Measure time and errors with context

Time-on-task and error counts can help compare variants or locate friction, but they are not self-explanatory. A fast task may reflect prior familiarity, and a longer task may reflect careful reading rather than failure. Define start and end points consistently.

```text
Timing rule:
Start when the moderator finishes reading the task.
Stop when the participant identifies the correct report and its status.
Exclude time spent resolving a documented prototype failure.
Record self-corrected detours separately from unrecovered errors.
```

Use time measures when speed matters to the user or business outcome. For exploratory studies, observed path and task outcome may be more informative than a precise stopwatch value.

### 12. Test prototypes honestly

Prototypes can evaluate hierarchy, labels, navigation, and interaction concepts, but they may not reproduce backend behavior, realistic data, latency, permissions, or all keyboard interactions. Explain the prototype's boundaries to participants without giving away the intended path.

```text
Prototype limitations
- Search results are preloaded.
- Save action is simulated.
- Network delay is not represented.
- Some controls are visual-only and are not part of the tested task.
```

Record any limitation that could have influenced a result. If a task depends on a behavior the prototype cannot simulate, redesign the task, improve the prototype, or choose another method.

### 13. Test the full state range

A happy-path prototype can hide important usability problems. Include relevant loading, empty, error, validation, success, permission, and recovery states. Select states based on the user task and product risk rather than trying to test every imaginable variation in one session.

```text
Save action states
Idle -> Submitting -> Success
                  -> Recoverable failure
Invalid form -> Field-level errors -> Corrected form
```

Check whether the interface explains what happened and what the participant can do next. For critical workflows, test interruption and recovery, not just a clean first attempt.

### 14. Include accessibility and input-method checks

Usability is not limited to mouse use on a desktop. Include keyboard navigation, visible focus, meaningful labels, text enlargement, contrast, and relevant assistive technology in the study plan. For specialized accessibility questions, recruit participants with relevant access needs and use appropriate protocols.

```css
.primary-action:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

The CSS is illustrative; use the project's actual token. Test semantic controls in the running implementation, because a prototype's visual focus state does not prove the production control is keyboard operable. Use real buttons for actions and links for navigation.

**Gotcha:** a screen that works with a mouse can still fail completely for keyboard users if focus is invisible, trapped, or moved unpredictably.

### 15. Avoid confirmation bias

Researchers and stakeholders may interpret ambiguous behavior in ways that support their preferred design. Before testing, write down the hypothesis and the evidence that would challenge it. During analysis, actively look for counterexamples and alternative explanations.

```text
Hypothesis:
The "History" label is difficult for first-time users to interpret.

Evidence supporting:
Several participants search under "Activity" and ask where completed tasks are stored.

Evidence challenging:
Experienced users consistently find History without hesitation.

Alternative explanation:
The issue may affect first-time users more than experienced users.
```

Do not dismiss contradictory evidence as a participant mistake. It may reveal a segment difference or a flaw in the study setup.

### 16. Use a consistent severity rubric

Prioritize issues by impact on task completion, frequency within the sample, persistence, and recovery cost. Keep severity separate from confidence: one observed issue can be severe even if the team needs more research to understand its scope.

```text
Critical: blocks a core task with no viable recovery.
High: causes major delay, wrong outcome, or repeated failure.
Medium: creates confusion or detours but users can recover.
Low: minor friction with limited task impact.
```

Define the rubric before analysis and apply it consistently. Do not use a severity label as a substitute for explaining the observed problem and its context.

### 17. Distinguish usability problems from preference

A participant may dislike a color or prefer a different layout without being unable to complete the task. Preference can matter for brand perception or comfort, but it should be reported separately from task failures and comprehension issues.

```text
Usability observation:
Participant selected the wrong export format because the labels were unclear.

Preference comment:
Participant said the card layout looked less modern than the previous version.

Report separately:
Task barrier with observed consequence; visual preference with no demonstrated task impact.
```

Use preference evidence when it relates to the research question. Do not let a strong opinion dominate a more consequential behavioral problem.

### 18. Compare variants fairly

When comparing two designs, control task wording, participant context, test environment, and success definitions as much as practical. Decide whether participants will see one variant or both. If participants test both, account for order and learning effects.

```text
Variant comparison plan
- Same task goal and data
- Same success rubric
- Counterbalance order where participants see both variants
- Record prior familiarity
- Define the primary outcome before reviewing results
```

Do not claim a variant is universally superior based on a tiny or imbalanced sample. Report directional findings and the limitations of the comparison.

### 19. Analyze sessions with an evidence trail

Synthesis should connect each issue to specific sessions, tasks, and observed behavior. Cluster related issues, note exceptions, and identify whether a problem appears to come from wording, hierarchy, interaction, system feedback, or test setup.

```text
Finding record
Issue: Participants do not notice the saved-report filter.
Evidence: Session IDs, task steps, and exact relevant observations.
Impact: Longer path to the correct report.
Severity: Medium, based on the agreed rubric.
Confidence: Moderate; more first-time participants may be needed.
Next step: Test a clearer label and more visible placement.
```

Keep the raw notes available to the team under appropriate privacy controls. Do not turn a synthesis board into a collection of anonymous opinions without links back to evidence.

### 20. Turn findings into design actions

Each significant finding should lead to a concrete decision: change the design, test a variant, improve the instrumentation, gather more evidence, or consciously accept the issue. A recommendation should include the reason, expected outcome, and a way to check whether the change worked.

```text
Finding: Users overlook the saved-report filter.
Action: Test a more descriptive label and move it closer to the search field.
Success measure: More participants locate the correct report without assistance.
Guardrail: No meaningful increase in errors finding other report controls.
```

Do not redesign an entire screen in response to one unclear finding. Choose the smallest change that addresses the likely cause, then test it where risk warrants.

### 21. Protect participant dignity and privacy

Explain the study, recording, data use, and voluntary nature of participation. Make it clear that the interface is being evaluated, not the participant's competence. Minimize collection of identifiable information and follow the organization's approved retention and access rules.

```text
Before session:
- Explain purpose and duration.
- Describe any recording and who can access it.
- Obtain consent before recording.
- Explain the participant can pause or stop.
- Collect only data relevant to the research question.
```

Avoid sharing raw recordings or identifiable quotes beyond the agreed audience. A pseudonym does not guarantee anonymity if a quote includes unique workplace or personal details.

### 22. Run remote sessions deliberately

Remote testing can include participants from varied locations, but it adds risks: connectivity, device differences, screen-sharing problems, distractions, and difficulty seeing physical context. Prepare a fallback plan and record technical issues that affect task performance.

```text
Remote session checklist
- Confirm device and browser expectations.
- Test the meeting and screen-sharing flow.
- Provide a non-sensitive test account.
- Explain how to pause recording or stop.
- Keep a backup task path if the prototype fails.
- Mark technical interruptions separately from usability issues.
```

Do not treat a participant's network failure as a product usability issue unless network resilience is itself being tested.

### 23. Facilitate stakeholder observation safely

Stakeholders can observe sessions, but the moderator should protect the participant from interruptions and leading comments. Brief observers in advance and ask them to record observations rather than solutions.

```text
Observer rules
- No direct coaching.
- Write down what happened before proposing why.
- Avoid judging the participant.
- Send questions to the moderator.
- Join the debrief after the participant leaves.
```

Debrief around evidence, task impact, confidence, and next steps. Avoid stakeholder voting on which participant was correct.

### 24. Report results with appropriate limits

A strong report states the study objective, method, participant criteria, tasks, outcomes, key findings, severity, evidence, limitations, and recommendations. Distinguish counts within the sample from claims about the broader population.

```text
Result:
Four of six participants in this formative study needed a detour to locate saved reports.

Interpretation:
The current navigation may not match the language some first-time users expect.

Limit:
The sample was small and recruited from a convenience pool; the result is diagnostic, not a population estimate.
```

Use counts where they are meaningful, but avoid false precision. Include the most consequential counterexample or uncertainty if it could change the recommendation.

### 25. Close the loop with implementation QA

After changes are implemented, verify that the fix addresses the observed issue and has not created a new problem. Test the relevant task at representative viewport sizes, with keyboard input where applicable, and with realistic data. Update the design source if the accepted behavior has changed.

```text
Post-fix verification
- Repeat the original task with the revised interface.
- Check for new errors or confusing side effects.
- Verify keyboard and focus behavior.
- Test narrow and intermediate widths.
- Record remaining limitations and accepted deviations.
```

Do not declare a problem solved because the code changed. Verify the user outcome that motivated the change.

---

## Relevant Patterns

### Pattern 1: Task-based usability session

**What it does:** observes whether participants can complete a realistic goal without being taught the interface.

**When to use it:** evaluating navigation, forms, settings, dashboards, and core product flows.

```text
Consent -> Context -> Neutral task -> Observation -> Follow-up -> Debrief
Record task outcome, detours, errors, moderator help, and recovery.
```

### Pattern 2: Neutral moderator prompt set

**What it does:** provides non-leading probes that reveal expectations without steering the participant.

**When to use it:** whenever participants hesitate, explain a choice, or reach an unexpected path.

```text
"What are you looking for?"
"What did you expect to happen?"
"What would you try next?"
"What, if anything, was unclear?"
```

### Pattern 3: Task outcome rubric

**What it does:** distinguishes unaided success, self-corrected detours, assisted success, and failure.

**When to use it:** comparing sessions, documenting task completion, or assessing whether a change improves discoverability.

```text
U = Unaided success
D = Self-corrected detour
A = Assisted success
F = Failure
N/A = Invalid or unattempted task
```

### Pattern 4: Severity and confidence matrix

**What it does:** keeps user impact separate from certainty about the explanation.

**When to use it:** prioritizing findings after a small formative study.

```text
Issue: User cannot complete a core task.
Severity: High
Confidence: Moderate
Action: Address the blocker while gathering evidence about its scope.
```

### Pattern 5: Variant comparison protocol

**What it does:** reduces avoidable differences when testing two design options.

**When to use it:** comparing labels, navigation structures, forms, or layout variants.

```text
Same task -> Same success rubric -> Controlled context
Counterbalance order if both variants are seen
Record prior familiarity and test limitations
```

### Pattern 6: Evidence-backed finding

**What it does:** connects an issue to specific observations and an actionable next step.

**When to use it:** writing reports, creating tickets, and aligning product stakeholders.

```text
Finding -> Evidence -> Impact -> Scope -> Confidence -> Recommendation
```

### Pattern 7: Remote-session contingency plan

**What it does:** separates technical interruptions from actual product usability problems.

**When to use it:** moderated remote sessions, prototype testing, and participant studies across devices.

```text
Check device and connection
Prepare a safe test account
Define a fallback if the prototype fails
Mark interruptions in notes
Resume only when the task context is clear
```

### Pattern 8: Post-fix validation loop

**What it does:** checks whether the implemented change resolves the user problem without causing a new one.

**When to use it:** after fixing a high-impact usability finding or changing a core interaction.

```text
Original task -> Revised implementation -> Repeat task
Check outcome, recovery, accessibility, responsive behavior, and side effects
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Testing a screen without a clear objective | The team wants general feedback | Define one primary task and the uncertainty it should resolve |
| Telling participants where to click | The moderator wants them to finish | Use a goal-based scenario and record any necessary assistance |
| Using leading task wording | The expected control label appears in the prompt | Pilot the task and remove terms that reveal the intended path |
| Praising the correct path | The moderator unintentionally rewards behavior | Use neutral acknowledgements and save evaluation for analysis |
| Treating assisted success as unaided success | Completion is recorded without context | Track intervention level using a predefined outcome rubric |
| Recruiting only internal colleagues | They are easy to schedule | Recruit against explicit criteria and disclose convenience-sample limits |
| Assuming a small sample estimates prevalence | Counts are treated as population statistics | Present findings as formative evidence and avoid broad percentages |
| Measuring time without a consistent rule | Start and end points are ambiguous | Define task timing boundaries and record interruptions |
| Treating all pauses as confusion | Behavior is interpreted without context | Record observable actions and ask neutral follow-up questions |
| Ignoring prototype limitations | Simulated behavior looks realistic | Document unavailable states and exclude invalid task time |
| Testing only the happy path | The ideal flow is easiest to prototype | Include relevant validation, loading, empty, and failure states |
| Ignoring keyboard access | Sessions default to pointer use | Include keyboard checks and visible `:focus-visible` states |
| Letting stakeholders coach participants | Observers want to help | Brief observers and route questions through the moderator |
| Treating preference as task performance | Aesthetic opinions are vivid | Report preference separately from observed usability barriers |
| Hiding counterexamples | The team prefers a simple story | Include contradictory evidence and alternative explanations |
| Assigning severity after choosing a solution | The desired fix influences judgment | Define severity criteria before synthesis |
| Treating a severity label as explanation | A category seems sufficient | Describe the behavior, impact, and recovery cost |
| Comparing variants with different tasks | Test conditions drift | Keep tasks and success criteria consistent |
| Ignoring order effects | Participants learn from the first variant | Counterbalance variant order where practical |
| Overgeneralizing from a prototype | Simulated states omit production constraints | State what the prototype can and cannot establish |
| Recording without informed consent | Recording feels routine | Explain recording and obtain consent before capture |
| Sharing identifying participant details | Reports prioritize vivid quotes | Minimize identifiers and review re-identification risk |
| Confusing technical failure with usability failure | Remote testing has interruptions | Log technical issues separately and repeat invalidated tasks |
| Writing findings without evidence links | Synthesis becomes opinion-based | Reference session, task, and observation records |
| Recommending a large redesign from one clue | The team jumps from symptom to solution | Test the smallest plausible change or gather more evidence |
| Measuring only preference | It is easy to ask whether users like something | Measure task success, comprehension, and recovery where relevant |
| Skipping post-fix validation | A code change is mistaken for an outcome | Repeat the original task and inspect side effects |
| Reviewing only the original viewport | The Figma frame becomes the only test size | Verify intermediate and narrow widths in the running interface |
| Failing to record limitations | The readout sounds more certain | State sample, context, prototype fidelity, and unresolved questions |
| Treating user testing as a one-time event | Testing is seen as a release gate | Re-test important changes and feed lessons into the design system |

---

## Mental Models

1. **Test the experience, not the participant** — The interface and task are under evaluation; participant difficulty is useful evidence, not a personal failure.
2. **A task prompt is not a tutorial** — Give people a meaningful goal without revealing the path being evaluated.
3. **Completion has levels** — Unaided success, self-corrected detours, assisted success, and failure should not be collapsed without explanation.
4. **Observed behavior is not motive** — Record what happened before proposing why it happened.
5. **Severity and confidence are different** — A serious blocker can deserve action even when its broader prevalence is uncertain.
6. **Prototype fidelity defines the evidence boundary** — Do not infer production performance from behavior the prototype could not represent.
7. **Neutrality is an active skill** — Moderator wording, reactions, and timing can influence participant behavior.
8. **Accessibility belongs in usability** — Keyboard, focus, labels, contrast, and assistive technology are part of the experience, not finishing touches.
9. **Counterexamples improve the model** — Conflicting observations may reveal different contexts or an incomplete hypothesis.
10. **Fixes must be verified through outcomes** — A changed component is not proof that the user problem is solved.

---

## Quick Reference

| Area | Check | Evidence to record |
|---|---|---|
| Objective | Is the research question tied to a decision? | Primary question and plausible outcomes |
| Recruitment | Do participants fit the target context? | Criteria, source, exclusions, limitations |
| Task design | Is the task goal-based and neutral? | Exact prompt and pilot feedback |
| Moderation | Did the facilitator avoid coaching? | Intervention wording and timing |
| Completion | Is success defined before sessions? | Outcome code and task result |
| Errors | Are detours and failures recorded consistently? | Path, error, recovery, consequence |
| Timing | Are start and stop points defined? | Time plus interruptions |
| Prototype | Are limitations documented? | Simulated or unavailable behavior |
| Accessibility | Are keyboard and focus included? | Focus path, labels, input method |
| Synthesis | Can findings be traced to sessions? | Evidence references and counterexamples |
| Severity | Is impact separated from confidence? | Rubric, rationale, scope |
| Privacy | Is data collected and shared responsibly? | Consent, access, retention practice |
| Reporting | Are claims limited to the sample and method? | Sample, context, limitations |
| Follow-up | Is the next decision or test explicit? | Owner, success measure, guardrail |
| QA | Was the original task repeated after the fix? | Outcome, regressions, accepted deviations |

---

## Build Challenge

Plan and conduct a usability test for a fictional project-management interface. Participants must locate a previously completed task, identify its status, and recover from a simulated failed save. The deliverable is a study plan, evidence record, findings report, and follow-up validation plan.

### Requirements

1. **Write the objective and decision.** State what the team needs to decide and what uncertainty the study should resolve.
2. **Define participant criteria.** Identify relevant experience levels, exclusions, recruitment method, and sample limitations.
3. **Create a neutral task scenario.** Participants should locate a completed task without being told which navigation label or control to use.
4. **Write the moderator guide.** Include consent, context questions, task prompt, neutral probes, and closing questions.
5. **Define outcome codes.** Distinguish unaided success, self-corrected detour, assisted success, failure, and invalidated task.
6. **Create an observation sheet.** Record action sequence, errors, detours, recovery, moderator intervention, and relevant participant comments.
7. **Test a failure state.** Simulate a save failure and observe whether the participant understands the problem and can recover without losing entered information.
8. **Include accessibility checks.** Test keyboard operation, visible focus, semantic controls, and relevant text or viewport constraints.
9. **Analyze findings.** Produce at least three findings linked to observations, with impact, severity, confidence, scope, and counter-evidence.
10. **Recommend a targeted change.** Tie the change to a finding and define a success measure plus a guardrail.
11. **Write a concise readout.** Include method, participants, tasks, key results, limitations, and next steps without claiming population-wide prevalence.
12. **Protect participant data.** State how consent, recording, anonymization, access, and retention will be handled.
13. **Validate the fix.** Repeat the original task against the revised implementation and check for regressions.
14. **Record remaining uncertainty.** Identify what the study did not establish and how the team could investigate it next.

### Failure and edge conditions

The challenge fails if the moderator tells participants which controls to use, records assisted success as unaided, interprets pauses as proven motives, ignores prototype failures, omits keyboard behavior, or makes broad population claims from a small formative sample. It also fails if the save-error state loses user input without being recorded as a defect, or if recommendations cannot be traced to observed evidence.

### Definition of Done

- The objective is tied to a concrete decision and a defined uncertainty.
- Participants fit documented criteria and receive a clear consent explanation.
- Task wording is neutral and does not reveal the intended path.
- Outcome definitions and observation fields are established before sessions.
- Moderator interventions and prototype limitations are recorded.
- Findings link to observations and separate impact, severity, and confidence.
- Counterexamples and alternative explanations are included where relevant.
- The report states sample limitations and protects participant privacy.
- Recommendations have observable success measures and guardrails.
- The revised interface is re-tested for task outcome, accessibility, responsive behavior, and regressions.
