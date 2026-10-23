# SKILL: ux-research-methods

**Layer:** 43 — UI/UX Design

**Goal:** Plan and conduct ethical, focused UX research that reduces uncertainty about users, their contexts, needs, and behavior, then translate evidence into product decisions without overstating what a small or biased sample can prove.

---

## Why This Matters (Senior Perspective)

UX research is not a ceremonial step before design, and it is not a way to collect quotes that support a decision the team has already made. Its purpose is to reduce meaningful uncertainty. A product team may believe that people abandon a setup flow because it is too long, when the real obstacle is that users do not trust the permissions being requested. A dashboard may look clear to its designers but fail because the labels match internal team language rather than the way customers describe their work. Research helps distinguish a plausible story from evidence about what people actually need and do.

The quality of research depends on the question, the method, the participants, the context, and the interpretation. A usability test can show where people struggle with a prototype, but it cannot by itself establish the size of a market. A survey can quantify answers from its respondents, but a convenience sample does not automatically represent every customer. Analytics can reveal a pattern in behavior, but they rarely explain the reason behind it. Interviews can uncover motivations and vocabulary, but people’s recollections and stated intentions are not the same as observed behavior. Senior researchers choose methods according to the uncertainty they need to resolve rather than defaulting to the method they enjoy most.

Research also carries responsibility. Participants should understand what they are agreeing to, what will be recorded, how information will be used, and whether their participation is voluntary. Sensitive information should be minimized, stored appropriately, and reported without unnecessary identifying details. Research should include people whose contexts differ from the team’s assumptions, not only the easiest colleagues to recruit. Findings should distinguish direct observations from interpretations and recommendations so stakeholders can challenge reasoning without dismissing the underlying evidence.

For product designers, developers, founders, and freelancers, practical research improves both design quality and delivery efficiency. A short, well-designed study can prevent weeks of polishing the wrong workflow. A clear research readout helps a team decide whether to redesign, run another test, change copy, or leave a working pattern alone. A portfolio case study becomes more credible when it shows the question asked, method selected, evidence gathered, limitations acknowledged, and decision changed—not just a convenient quote beside a finished screen.

**Senior perspective:** research is a disciplined way to make decisions under uncertainty. The goal is not to prove that the team was right; it is to learn what would change the decision, gather evidence capable of answering that question, and communicate the limits of that evidence honestly.

---

## Core Concepts

### 1. Begin with a decision, not a method

Before booking interviews or writing survey questions, identify the decision the team needs to make. “We need to understand users” is too broad to guide a study. “Should account setup ask for all profile details at once or progressively?” is actionable because the answer can change a product decision.

```text
Decision: Should onboarding collect profile details in one step or several?
Current uncertainty: Which details are necessary at first use?
Evidence needed: User goals, perceived effort, and observed completion barriers
Possible outcomes: Keep one step, split the flow, or defer optional fields
```

Write down what you would do if the evidence supports each plausible outcome. If no possible finding would change the plan, the work may be validation theatre rather than research.

**Gotcha:** a stakeholder’s preferred solution is not the research question. Reframe the request around the user problem or decision that the proposed solution is meant to address.

### 2. Turn assumptions into research questions

Assumptions are unavoidable, but invisible assumptions are dangerous. List what the team believes about user goals, context, language, constraints, and current workarounds. Then rank assumptions by uncertainty and impact.

```text
Assumption: New users understand the phrase "workspace."
Risk if wrong: People cannot find their team area.
Question: What words do new users use for the place where they manage team work?
Method candidate: Contextual interview or usability test with realistic navigation tasks
```

A useful question is neutral, answerable, and connected to a decision. Avoid leading questions such as “Wouldn’t a simpler dashboard help you?” Ask about a recent experience, observed behavior, and the circumstances around it.

### 3. Choose the method to match the uncertainty

Different methods answer different kinds of questions. Interviews explore experiences and mental models. Usability tests reveal interaction problems. Surveys measure reported patterns among respondents. Analytics reveal behavior at scale. Field studies expose context and workarounds. Card sorting and tree testing help evaluate information architecture.

```text
Question -> Suitable method
Why do users abandon a workflow? -> Interviews + behavioral analytics
Can users find a report? -> Usability test or tree test
How common is a stated preference in a defined population? -> Carefully sampled survey
What happens in the real work environment? -> Contextual inquiry / field observation
Which navigation structure is easier to understand? -> Comparative tree test or usability study
```

Use multiple methods when they answer complementary questions. Do not combine methods merely to make a project look rigorous; each method should contribute evidence that changes the decision.

### 4. Distinguish discovery, evaluative, and generative research

Discovery research explores a problem space and helps identify needs or constraints. Generative research helps produce new concepts, opportunity areas, or design directions. Evaluative research examines a specific design or experience. The categories overlap, but the distinction helps prevent a mismatch between the question and the study.

```text
Discovery: What makes a first-time setup difficult?
Generative: What alternative ways could help people complete setup confidently?
Evaluative: Can people complete the revised setup flow without assistance?
```

A study can include more than one purpose, but be clear about the primary one. A usability test designed to evaluate a prototype should not be treated as a comprehensive discovery study about a market the prototype only touches briefly.

### 5. Recruit participants for relevance

Recruit based on the behaviors, contexts, experience levels, and constraints relevant to the research question—not merely on demographic categories or convenience. Define inclusion and exclusion criteria before recruiting so the team does not quietly change the target after seeing the first participants.

```text
Study: First-time setup for a team collaboration product
Recruiting criteria:
- Has joined a new collaboration tool within the past six months
- Has completed or attempted initial setup
- Includes both frequent and occasional software users
- Excludes employees who already know the product's internal terminology
```

Recruitment criteria should reflect the population the team wants to understand. For a specialized workflow, relevant experience may matter more than broad demographic matching. For accessibility research, include participants whose assistive technology or access needs are relevant to the experience being evaluated.

**Gotcha:** recruiting only friends, coworkers, or existing power users can produce useful early feedback, but it cannot silently stand in for a broader user population.

### 6. Use sample size appropriate to the claim

Qualitative research often uses small, purposefully selected samples to understand patterns, not to estimate population percentages. Quantitative work needs a sampling and analysis plan that supports its intended claims. There is no universal participant count that makes every study valid.

```text
Qualitative usability study:
Purpose: identify major task barriers and explain why they occur
Sample logic: recruit participants across relevant experience types; continue or adjust if important new patterns emerge

Survey:
Purpose: estimate a defined response pattern
Sample logic: define target population, sampling method, expected uncertainty, and analysis before collecting responses
```

Do not claim “80% of users” based on a handful of interviews. Report the sample and method clearly. When a sample is small, describe observed patterns and examples, not false precision.

### 7. Write neutral interview questions

Good interview questions invite participants to describe actual experiences without steering them toward the team’s hypothesis. Ask about recent events, actions, decisions, and constraints. Follow up when a response is vague or abstract.

```text
Leading: "Would you use an automatic reminder feature?"
Neutral: "Tell me about the last time you forgot or delayed this task. What happened next?"

Leading: "Is the dashboard easy to understand?"
Neutral: "Imagine you need to find last month's report. What would you do first?"
```

Avoid asking participants to predict behavior in a hypothetical future when a recent real example is available. Hypothetical questions can still be useful for concept exploration, but should not be mistaken for reliable forecasts of adoption.

### 8. Build an interview guide, not a script prison

An interview guide keeps the study focused while allowing follow-up questions. Include a short introduction, consent, warm-up, core topics, probes, and a closing question. The guide should be flexible enough to explore unexpected but relevant evidence.

```text
Interview guide
1. Explain the purpose, duration, recording, and voluntary nature of participation.
2. Ask about the participant's recent workflow.
3. Explore goals, steps, workarounds, and decision points.
4. Probe specific incidents and consequences.
5. Ask what was difficult or surprising.
6. Invite anything important that was not covered.
```

Use the same core topics across sessions when comparison matters, but do not interrupt a valuable account simply to preserve exact wording. Record deviations from the guide when they affect comparability.

### 9. Conduct usability tests around tasks

A usability test asks participants to attempt realistic tasks while the researcher observes. The task should describe a goal without telling the participant which controls to use. The researcher should avoid teaching the interface during the attempt unless the protocol explicitly studies assisted use.

```text
Weak task: Click Settings, open Billing, and select Download invoice.
Stronger task: You need a copy of last month's invoice for your records. Show me what you would do.
```

Observe completion, errors, hesitation, detours, confidence, and recovery. Ask follow-up questions after the task so questions do not continuously interrupt behavior. A prototype can be tested, but clearly state which interactions are simulated or unavailable.

**Gotcha:** a participant’s silence is not proof of ease or confusion. Observe behavior, then ask a neutral follow-up rather than interpreting facial expression as a finding.

### 10. Use think-aloud carefully

Think-aloud methods invite participants to verbalize what they are noticing or expecting while completing a task. They can expose interpretation and uncertainty, but talking changes the task slightly and may be uncomfortable for some participants.

```text
Moderator prompt:
"As you work, please tell me what you are looking at and what you expect to happen. There is no right or wrong answer."

If the participant goes quiet:
"What are you considering right now?"
```

Do not demand constant narration or treat every spoken thought as a stable belief. Some participants are better at articulating their reasoning than others. Combine verbal data with observed behavior and follow the study protocol consistently.

### 11. Observe context and workarounds

Contextual inquiry and field observation help reveal how work actually happens, including tools, interruptions, handoffs, and unofficial workarounds. People may forget to mention routine behavior in an interview because it feels obvious to them.

```text
Observation record
Context: Where and when the task occurs
Trigger: What starts the task
Actions: Steps and tools observed
Workaround: What the person does when the official path fails
Constraint: Time, policy, device, environment, or collaboration limitation
Interpretation: Researcher's hypothesis, kept separate from raw notes
```

Ask permission before observing private or sensitive work. Do not record confidential information simply because it appears on screen. Contextual work can reveal organizational constraints that an interface redesign alone cannot solve.

### 12. Design surveys around one clear construct at a time

A survey should measure something specific: frequency of a behavior, awareness of a feature, satisfaction with a recent task, or a defined preference. Avoid double-barrelled questions, leading wording, unexplained jargon, and answer choices that omit common responses.

```text
Double-barrelled:
"Was the search fast and easy to use?"

Better separated:
"How would you rate the time it took to get search results?"
"How easy or difficult was it to use search to find the item?"
```

Offer balanced response options and a reasonable “not applicable” or “not sure” option when appropriate. Pilot the survey with a few people to identify confusing wording before wide distribution.

### 13. Treat survey scales and wording consistently

When using rating scales, keep labels and direction consistent. Explain what the endpoints mean. Do not assume that a numerical score has a universal interpretation across products or populations.

```text
Example scale:
1 = Very difficult
2 = Difficult
3 = Neither easy nor difficult
4 = Easy
5 = Very easy
```

If a question asks about frequency, use frequency options rather than agreement options. Randomizing answer order may be appropriate for some lists, but not for ordered scales or choices where order is meaningful. Document changes to survey wording because small wording changes can alter responses.

### 14. Use analytics to locate behavior, not infer motives automatically

Product analytics can reveal where people exit a flow, which features are used, and how behavior changes over time. Analytics usually cannot explain why a pattern occurs without additional evidence. Instrumentation also has limitations: missing events, identity errors, sampling, privacy restrictions, and changes in the product can distort interpretation.

```text
Observed: A large share of sessions exit after the permissions screen.
Not established: Users do not trust the product.
Next step: Check event quality, segment by relevant context, and investigate with interviews or usability tests.
```

Define events and metrics before launching an analysis. Confirm that the event actually represents the intended action. Follow privacy policy and data minimization principles; do not collect sensitive data merely because it might be interesting later.

### 15. Combine methods through triangulation

Triangulation compares evidence from different sources to see whether they converge, complement one another, or conflict. A usability test might reveal that people miss a filter; analytics might show that few users use it; interviews might explain that the filter labels are unfamiliar. Each source contributes a different piece of the explanation.

```text
Evidence:
- Analytics: low filter usage
- Usability sessions: participants overlook the filter
- Interviews: label does not match users' terminology

Interpretation: Discoverability and language may be contributing factors.
Next test: Revise label and placement, then evaluate task success and usage.
```

Do not force every source to agree. Conflicting evidence may reveal different user segments, different contexts, or a flaw in the measurement. Report the conflict and design a targeted follow-up.

### 16. Take notes that separate observation from interpretation

Research notes should distinguish what happened from what the researcher thinks it means. This helps teams avoid turning an inference into a supposed fact.

```text
Observation:
Participant opened the help menu, closed it, then searched the page for the billing date.

Interpretation:
The billing date may not be visible or the label may be unclear.

Question:
Did the participant expect the date to appear in the summary or the invoice details?
```

Use timestamps or task references when useful. Record exact quotes only when they are accurate and appropriate to retain. Avoid rewriting participants' words to make them sound more polished or to strengthen a point.

### 17. Analyze qualitative data systematically

After sessions, group observations into patterns using affinity mapping, thematic analysis, or another explicit method. Start with evidence, cluster related observations, name themes, and examine exceptions. Avoid jumping directly from one dramatic quote to a broad recommendation.

```text
Evidence snippets:
- Three participants looked under "Activity" for completed tasks.
- Two participants expected the history filter to be near the date range.
- One participant found the correct page immediately.

Candidate theme:
The current navigation labels do not match the language some users use for task history.

Counter-evidence:
One participant's successful path may indicate that experience level or prior knowledge matters.
```

Themes should explain multiple pieces of evidence, not merely summarize the interface. Keep an evidence trail from raw notes to themes and recommendations so another person can understand how the conclusion was reached.

### 18. Prioritize findings by impact and evidence strength

Not every finding deserves immediate design work. Consider task impact, frequency within the observed sample, confidence in the interpretation, severity, and the cost or risk of a change. Keep sample frequency distinct from population prevalence.

```text
Finding assessment
Impact: What user or business outcome is affected?
Evidence strength: How direct and repeated is the evidence?
Scope: Which participants or contexts does it apply to?
Confidence: What alternative explanations remain?
Action: Fix now, investigate further, monitor, or accept intentionally
```

A severe accessibility barrier may deserve attention even if observed once. A minor preference repeated in several sessions may still be low priority. Use judgment and explain the rationale rather than relying on an opaque score alone.

### 19. Write findings as evidence-backed statements

A useful finding describes a user problem, the evidence that supports it, its impact, and its scope. Avoid statements like “users hate the dashboard” when the study only observed a few people struggling to find one report.

```text
Finding:
Several first-time participants looked under "Activity" for completed work and did not notice the current "History" entry.

Evidence:
Observed navigation paths in the usability sessions and participant comments about terminology.

Impact:
Users may take longer to locate completed work.

Scope and limitation:
This pattern occurred in the tested first-time group; it does not establish prevalence across all customers.
```

Use quotes to illuminate a pattern, not as a substitute for analysis. Include counter-evidence or uncertainty where it could change the decision.

### 20. Convert findings into decisions and experiments

Research does not end at the readout. Connect each important finding to a product decision, a proposed change, or a follow-up study. Sometimes the correct action is to do nothing because the evidence is weak or the cost of change is high.

```text
Finding: People overlook the history entry.
Decision: Test a clearer label and a more visible location.
Experiment: Compare the current and revised navigation in a task-based study.
Success measure: More participants find completed work without assistance.
Guardrail: No meaningful increase in errors finding other navigation items.
```

State what would count as evidence that the change helped. Avoid designing an experiment whose only success criterion is that users prefer the new version.

### 21. Make research ethical and consent-based

Participants should understand the purpose, expected duration, activities, recording, data use, voluntary nature, and how to stop participation. Obtain consent before recording or collecting identifiable information. Follow applicable organizational policy and legal requirements.

```text
Consent checklist
- Purpose and expected duration explained
- Activities and recording described
- Data use and access explained
- Participation is voluntary
- Participant can pause or stop
- Questions answered before starting
```

Do not treat a signed form as permission to collect unrelated data. Minimize collection, limit access, and establish retention or deletion practices. If a participant discloses sensitive information, follow the study protocol and avoid recording details that are not necessary to the research question.

### 22. Protect privacy and anonymize reporting

Research data may contain names, workplace details, health information, account data, or other sensitive material. Collect only what is necessary and report findings in a way that does not expose participants unnecessarily. A pseudonym alone may not protect someone if the quote contains unique identifying context.

```text
Safer report:
"Participant 04, an experienced administrator, described difficulty locating the export setting."

Avoid:
A full name, employer, account identifier, and verbatim quote when those details are not necessary.
```

Store recordings and notes in approved systems with appropriate access controls. Do not paste sensitive participant information into unapproved AI tools or external services. Confirm whether a recording may be shared with stakeholders before distributing it.

### 23. Include accessibility and underrepresented contexts

A study that only includes people who use the product in the same way as the design team can miss major barriers. Include relevant variations in experience, device, language, environment, connectivity, and access needs. Accessibility research should be planned respectfully and should not assume one participant represents everyone with a particular disability.

```text
Context coverage
- First-time and experienced users
- Relevant device sizes and input methods
- Different levels of familiarity with the domain
- Language and literacy considerations
- Relevant assistive technology and access needs
- Realistic network, time, or environmental constraints
```

Recruit people whose contexts are relevant to the question, and make accommodations where possible. Avoid asking participants to disclose personal or medical details that are not needed for the study.

### 24. Facilitate stakeholder observation without biasing the study

Stakeholders can learn from observing research, but their presence should not make participants feel evaluated or pressured. Set expectations before sessions: observers should remain quiet, use a structured note format, and avoid intervening unless safety or protocol requires it.

```text
Observer guidance
- Record what happened before interpreting it.
- Do not coach or rescue the participant.
- Avoid commenting on a participant's ability.
- Submit questions through the moderator.
- Separate evidence from solution suggestions.
```

A debrief should compare evidence and implications, not vote on which participant was “right.” The moderator protects the participant experience and the integrity of the session.

### 25. Communicate limitations and confidence

Every method has limits. Report the sample, recruitment source, context, prototype fidelity, task wording, missing data, and any other factor that could affect interpretation. Use calibrated language such as “suggests,” “in this sample,” or “requires further validation” when appropriate.

```text
Study limitations
- Participants were recruited from existing customers.
- The prototype did not include real server delays.
- The study tested one language and two viewport ranges.
- Findings identify observed usability issues, not population prevalence.
- Follow-up needed: test with new users and real data.
```

Limitations do not make research useless. They help the team understand what the evidence supports and what should be tested next.

---

## Relevant Patterns

### Pattern 1: Decision-first research brief

**What it does:** ties the study to a concrete product decision and identifies evidence that could change it.

**When to use it:** before any study where the team is tempted to begin with a favorite method or a broad goal.

```text
Decision:
Current uncertainty:
Target participants:
Research questions:
Method:
Evidence to collect:
Possible outcomes:
Known limitations:
Owner and timeline:
```

The brief should be short enough to guide the team and specific enough to prevent scope drift.

### Pattern 2: Assumption-to-evidence map

**What it does:** makes uncertain beliefs visible and connects them to a method capable of testing them.

**When to use it:** at project kickoff, before redesign, or when stakeholder opinions conflict.

```text
Assumption -> Risk if wrong -> Research question -> Method -> Decision affected
"Users understand 'workspace'" -> Navigation failure -> What words do they use? -> Interview/test -> Navigation labels
```

Prioritize assumptions with high impact and low confidence. Do not spend research time proving details that cannot affect the product decision.

### Pattern 3: Task-based usability session

**What it does:** observes whether people can achieve a realistic goal with a design.

**When to use it:** evaluating a prototype, comparing interaction patterns, or diagnosing a known task barrier.

```text
Welcome and consent
-> Context questions
-> Neutral task prompt
-> Observe without coaching
-> Record errors, paths, hesitation, completion
-> Neutral follow-up
-> Debrief and limitations
```

Use consistent tasks when comparing participants, and note prototype limitations that affect the observed result.

### Pattern 4: Evidence / interpretation / action chain

**What it does:** prevents recommendations from being detached from what was actually observed.

**When to use it:** during synthesis, readout writing, and stakeholder decision meetings.

```text
Evidence: What happened?
Interpretation: What might explain it?
Impact: Why does it matter?
Action: What decision or test follows?
Limitation: What is not established?
```

Keep the chain visible in the report. If the evidence does not support the recommendation, collect more evidence or lower the confidence.

### Pattern 5: Mixed-method triangulation

**What it does:** compares behavioral, qualitative, and quantitative evidence to build a more complete explanation.

**When to use it:** when a pattern is visible in analytics but its cause is unclear, or when interview claims need behavioral context.

```text
Analytics identifies where -> Usability observes how -> Interview explores why
Compare agreement and conflict
Choose a targeted next test
```

Do not treat different methods as interchangeable or assume they must agree.

### Pattern 6: Research readout with confidence

**What it does:** communicates findings, evidence, impact, limitations, and recommended action without overstating certainty.

**When to use it:** when sharing findings with product, design, engineering, leadership, or external clients.

```text
Finding
Evidence and examples
Impact
Who/context it applies to
Confidence and alternative explanations
Recommendation
Next validation step
```

Use quotes selectively and preserve participant privacy.

### Pattern 7: Ethical session setup

**What it does:** ensures participants understand the study and that the team handles information responsibly.

**When to use it:** before interviews, usability tests, field studies, surveys, or recorded sessions.

```text
Explain purpose and duration
Describe activities and recording
Obtain consent
Collect minimum necessary data
Provide a way to pause or stop
Store and report data safely
```

Follow the organization's approved protocol and applicable rules; this pattern is not a replacement for legal or ethics review where required.

### Pattern 8: Findings-to-experiment loop

**What it does:** turns a research insight into a testable product change and a measurable next step.

**When to use it:** after a study identifies a plausible, addressable usability or comprehension issue.

```text
Finding -> Hypothesis -> Change -> Success measure -> Guardrail -> Follow-up
```

Choose measures that reflect the intended user outcome. A preference rating alone may not show that the revised interface improves task success.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Starting with a favorite method | The team confuses activity with learning | Define the decision and uncertainty before selecting a method |
| Asking broad questions without a decision | The research goal is too vague | Write one primary decision and list plausible evidence-driven outcomes |
| Leading participants toward a solution | The team wants reassurance | Ask about recent behavior and use neutral prompts |
| Recruiting only convenient participants | Speed overrides relevance | Define inclusion criteria and record recruitment limitations |
| Treating a small qualitative sample as representative | Quotes feel persuasive | Report observed patterns without population percentages |
| Using a universal participant-count rule | Sample size is treated as a formula | Match sample logic to method, population, and claim |
| Asking hypothetical adoption questions only | It is easier than discussing actual behavior | Start with a recent concrete incident and use hypothetical questions cautiously |
| Reading a usability task as a script | The moderator confuses consistency with instruction | Describe the goal without telling participants where to click |
| Coaching participants during the task | The moderator wants the session to succeed | Observe first; provide help only if the protocol calls for it |
| Treating silence as evidence | Nonverbal behavior is overinterpreted | Record observable actions and ask neutral follow-up questions |
| Writing interpretations as raw facts | Notes are made too quickly | Separate observation, interpretation, and open question in notes |
| Turning one quote into a broad finding | Memorable language dominates synthesis | Seek patterns across evidence and record counterexamples |
| Assuming analytics explain motivation | Behavior is mistaken for cause | Combine analytics with methods that investigate context and reasoning |
| Forcing conflicting evidence to agree | The team wants one simple story | Report the conflict and investigate segments or measurement issues |
| Writing double-barrelled survey questions | Multiple ideas are compressed into one item | Measure one construct per question |
| Using inconsistent rating scales | Questions are assembled without a survey plan | Define scale direction and endpoint labels consistently |
| Ignoring survey piloting | The wording seems clear to the author | Pilot with relevant respondents and revise confusing items |
| Overstating a finding's scope | Limitations are omitted from the readout | State sample, context, method, and confidence beside the finding |
| Making recommendations without an evidence trail | Synthesis jumps directly to solutions | Link each recommendation to observations and explain alternative causes |
| Collecting unnecessary sensitive data | Data is gathered “just in case” | Minimize collection and define access and retention |
| Recording without clear consent | Recording is treated as routine | Explain recording and obtain consent before starting |
| Sharing identifiable participant quotes | Reports prioritize vivid detail | Remove unnecessary identifiers and check re-identification risk |
| Excluding relevant access needs | Recruitment favors the default user | Include relevant contexts and plan accommodations respectfully |
| Letting observers coach participants | Stakeholders want to help | Brief observers and route questions through the moderator |
| Treating preference as usability | Participants say they like a design | Observe task performance and comprehension as well as preference |
| Reporting only positive findings | The team wants to celebrate the redesign | Include failures, counter-evidence, and limitations |
| Treating research as a one-time gate | Research is separated from product iteration | Connect findings to decisions and follow-up validation |
| Using opaque prioritization scores | A numeric rank appears objective | Explain impact, evidence strength, scope, and uncertainty separately |
| Ignoring prototype limitations | Simulated behavior is mistaken for production | Record what the prototype could and could not represent |
| Failing to assign research questions | Findings are shared without ownership | Assign an owner and status to each open decision or follow-up |
| Using unapproved AI tools for raw data | Convenience overrides data governance | Follow approved tooling and privacy rules; minimize sensitive data |
| Treating a consent form as unlimited permission | Consent is interpreted too broadly | Collect only what was explained and needed for the study |

---

## Mental Models

1. **Research reduces decision uncertainty** — The study should answer a question that could change what the team does next.
2. **Method follows question** — Choose interviews, observation, testing, surveys, or analytics based on the evidence needed.
3. **Behavior and explanation are different evidence** — Analytics may show what happened; interviews and observation can help explain why.
4. **Observation is not interpretation** — Preserve the distinction so a hypothesis does not become an invented fact.
5. **A sample defines the claim** — The recruitment and method determine how far a finding can reasonably be generalized.
6. **Triangulation adds perspective, not automatic truth** — Different sources can complement or contradict one another.
7. **Consent is an ongoing responsibility** — Participants should understand the study and retain meaningful control over participation.
8. **Findings need an evidence trail** — A stakeholder should be able to trace a recommendation back to observed data.
9. **Limitations are useful information** — They tell the team what the study supports and what remains unknown.
10. **Research ends in a decision loop** — Findings should lead to a product choice, a follow-up question, or an explicit decision not to change.

---

## Quick Reference

| Need | Method or practice | Important limitation |
|---|---|---|
| Explore a recent user experience | Interview | Recall and stated intention may differ from behavior |
| Observe task difficulty | Usability test | Prototype and task wording shape what can be observed |
| Understand real-world context | Contextual inquiry | Requires consent and care around sensitive environments |
| Measure reported patterns | Survey | Sample and wording affect the claims |
| Locate behavior drop-off | Product analytics | Does not automatically explain motivation |
| Evaluate navigation labels | Tree test or task-based test | Test context and information architecture affect results |
| Generate opportunity areas | Discovery and generative methods | Findings require interpretation, not automatic solutions |
| Analyze qualitative sessions | Thematic or affinity analysis | Keep an evidence trail and inspect counterexamples |
| Prioritize findings | Impact + evidence strength + scope | Avoid false precision from opaque scores |
| Write a research question | Decision-first framing | Avoid broad goals with no possible action |
| Recruit participants | Purposeful criteria | Convenience samples limit generalization |
| Protect participants | Consent, minimization, access control | Follow approved policies and applicable requirements |
| Share findings | Evidence, impact, limitation, action | Avoid unsupported population claims |
| Validate a design change | Follow-up task test or experiment | Define success and guardrails before running it |
| Handle uncertainty | Open-question register | Assign owners and statuses instead of hiding assumptions |

---

## Build Challenge

Conduct a small, ethical research study to investigate why users may struggle to find a previously completed task in a fictional team productivity application. You are not expected to prove a population-wide trend. The goal is to gather structured evidence, identify plausible causes, and recommend a testable next step.

### Requirements

1. **Write a decision-first brief.** Define the product decision, current uncertainty, target participants, and what evidence could change the decision.
2. **List at least five assumptions.** Rank them by impact and confidence, then choose the highest-risk assumption to investigate first.
3. **Select a suitable method.** Explain why a task-based usability study, interview, analytics review, or combination is appropriate for the specific question.
4. **Define participant criteria.** Include relevant experience levels and recruitment exclusions; document how the recruitment method limits generalization.
5. **Prepare a consent introduction.** Explain purpose, duration, activities, recording, data use, voluntary participation, and the ability to stop.
6. **Write a neutral task prompt.** Ask participants to locate a previously completed task without telling them which menu or label to use.
7. **Create a moderator guide.** Include warm-up questions, task instructions, neutral probes, observation fields, and closing questions.
8. **Record evidence separately from interpretation.** For every session, capture the participant's observable path, errors or hesitation, exact relevant wording where appropriate, and a separate hypothesis about why the behavior occurred.
9. **Analyze patterns and counterexamples.** Group evidence into themes, identify at least one alternative explanation, and avoid treating the sample as representative of all users.
10. **Write at least three evidence-backed findings.** Each finding must include evidence, user impact, scope, confidence, and limitations.
11. **Prioritize the findings.** Explain which issue should be addressed first and why, using impact and evidence strength rather than a score alone.
12. **Recommend a testable change.** Define a hypothesis, proposed change, success measure, and guardrail that protects other navigation tasks.
13. **Create a privacy-conscious readout.** Remove unnecessary identifying information, summarize participant context safely, and state how notes or recordings should be retained or deleted under the study protocol.
14. **List follow-up questions.** Identify what the study did not establish and which method could answer the most important remaining question.
15. **Present a concise stakeholder readout.** Summarize the decision, method, strongest evidence, recommendation, limitations, and next step without exaggerating certainty.

### Failure and edge conditions

The challenge fails review if questions lead participants toward a preferred answer, the task tells participants where to click, observations are presented as proven motives, a small sample is used to claim population percentages, consent and data handling are omitted, or recommendations cannot be traced to evidence. It also fails if contradictory evidence is hidden or the study ends with findings but no decision or follow-up plan.

### Definition of Done

- The study is connected to a concrete decision and a clearly stated uncertainty.
- Method and participant criteria are appropriate to the question and their limitations are documented.
- Participants receive a clear consent introduction and can pause or stop.
- Tasks and questions are neutral and do not teach the intended solution.
- Notes separate observation, interpretation, and open questions.
- Findings include evidence, impact, scope, confidence, and counter-evidence where relevant.
- The recommendation is traceable to findings and includes a testable success measure and guardrail.
- Sensitive data is minimized and reporting avoids unnecessary identifiers.
- The readout distinguishes what the study supports from what remains unknown.
- The next product decision or research step is explicit and assigned.
