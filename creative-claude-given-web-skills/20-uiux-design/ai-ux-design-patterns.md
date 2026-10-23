# SKILL: ai-ux-design-patterns

**Layer:** 43 — UI/UX Design

**Goal:** Design user experiences for AI-powered products that communicate capability and uncertainty honestly, preserve user agency, support correction and recovery, and make model behavior understandable without overwhelming people with technical detail.

---

## Why This Matters (Senior Perspective)

AI interfaces introduce a different kind of interaction contract. In a conventional interface, a button usually triggers a relatively deterministic operation: opening a page, saving a record, or filtering a list. In an AI product, the same action may produce variable results, take an uncertain amount of time, misunderstand intent, or generate a confident-sounding answer that is incomplete or wrong. The design must help users understand what the system is doing, what it can and cannot reliably do, and how to recover when the output is not useful.

The senior designer's responsibility is not to make AI feel magical. It is to make the product legible and controllable. Users should know when they are interacting with a model, which information the model can access, whether an action will change external data, and what evidence supports an answer. The interface should distinguish generated suggestions from verified facts, drafts from sent messages, and a proposed action from a completed action. This distinction matters most in workflows involving money, health, employment, education, legal decisions, or private information.

Good AI UX also accounts for the user's mental workload. A chat box is not the right interaction for every AI capability. A structured form may be better for a repeated task; a review queue may be better for approving many generated items; an inline suggestion may be better for writing; and a comparison view may be better when the user needs to evaluate alternatives. The design should match the user's task rather than forcing every feature into a conversational interface.

AI products need meaningful loading states, progressive disclosure, citations or source inspection when relevant, edit and retry controls, undo for reversible actions, and clear boundaries around automation. When the system uses tools, retrieves documents, or modifies records, users need a comprehensible account of the steps and the resulting state. If the system is uncertain, the design should expose uncertainty in a way that helps the user decide what to do—not add a generic disclaimer that users quickly ignore.

In portfolio work, AI UX is demonstrated through the entire interaction loop: user intent, model response, inspection, correction, approval, execution, and recovery. A polished prompt box alone is not a complete AI product. Senior-level work shows how the interface remains trustworthy when the model refuses, times out, hallucinates, retrieves irrelevant context, or proposes an action outside the user's intent.

---

## Core Concepts

### 1. Begin with the user's job, not with a chat interface

Identify the task, desired outcome, constraints, and cost of error before deciding how AI should appear. A chat interface is appropriate when intent is open-ended or iterative. Structured controls are often better when users repeat a known workflow or must provide exact fields.

```text
Task: Prepare a customer-support reply
Inputs: Customer message, order status, support policy
AI output: Draft reply with source references
User control: Edit, regenerate, or discard
External action: Send only after explicit confirmation
Success: Accurate response sent to the right customer
```

Map where AI genuinely adds value. If a normal filter or deterministic rule is faster, more predictable, and easier to explain, use that instead of adding AI for novelty.

**Gotcha:** Do not force users to phrase an exact structured operation as a prompt when a direct control would be clearer and safer.

### 2. Make the AI boundary visible

Users should understand which parts of the experience are AI-generated, which are retrieved from trusted sources, and which are confirmed application data. Use concise labels, provenance, and interaction states instead of relying on a generic “AI-powered” badge.

```html
<section aria-labelledby="answer-title">
  <h2 id="answer-title">Suggested answer</h2>
  <p>This draft was generated from the current support policy and order record.</p>
  <button type="button">Review sources</button>
  <button type="button">Edit draft</button>
</section>
```

The language must match the actual system behavior. Do not say “verified” if the model merely generated a plausible response, and do not imply a human reviewed content when no human did.

### 3. Communicate uncertainty in a useful way

A model can be fluent while being wrong. The interface should help users identify uncertainty where it affects decisions. Use source links, confidence explanations grounded in calibrated system behavior, missing-information prompts, or a clear request to verify a key detail.

```text
Instead of: “This is definitely the correct policy.”
Prefer: “The policy document says the deductible is ₹10,000. Review the linked clause before making a claim decision.”
```

Do not display a numeric confidence percentage unless it has a meaningful, validated interpretation. A model's self-reported confidence is not automatically a calibrated probability.

**Gotcha:** A small “AI may make mistakes” disclaimer does not make a high-risk recommendation safe. Put verification support next to the specific claim or action that needs it.

### 4. Separate generated content from verified facts

Make the source and status of information clear. A generated summary, a database value, a retrieved quotation, and a user-entered note are different kinds of content. They should not silently merge into a single undifferentiated paragraph.

```html
<article>
  <h2>Account summary</h2>
  <p><strong>Account status:</strong> Active <span>From account records</span></p>
  <section aria-labelledby="summary-heading">
    <h3 id="summary-heading">AI-generated summary</h3>
    <p>The customer may need help updating billing details.</p>
  </section>
</article>
```

Use provenance labels that are specific enough to answer “where did this come from?” A source panel should show the actual document, record, or reference when available, not merely repeat that AI was used.

### 5. Design citations and source inspection around the claim

When an answer depends on documents or web sources, let users inspect the evidence relevant to each important claim. Citation affordances should be easy to find, open the correct source, and preserve context when possible.

```text
Claim: The return window is 30 days.
Source: Returns policy, section “Eligibility”
Action: Open the exact section
```

Do not decorate every sentence with meaningless citations. A citation should support the claim it accompanies, and the interface should distinguish source material from model interpretation. If the source is unavailable, stale, or does not actually support the claim, say so.

### 6. Set expectations for latency

AI tasks may involve generation, retrieval, tool calls, or multiple steps. Users need feedback that the request is being handled without receiving false progress information. Use an immediate acknowledgement, stable layout, and stage-specific messages only when those stages correspond to real system events.

```html
<section aria-live="polite" aria-busy="true">
  <p>Searching the connected documents…</p>
</section>
```

Do not display fabricated progress percentages or claim that a tool is running if the application has not confirmed that state. For long tasks, provide cancellation where possible and preserve the user's original request.

### 7. Make the interaction loop explicit

A useful AI workflow usually includes input, output, inspection, correction, and a next action. Users should not be trapped in a one-shot exchange if the result needs adjustment.

```text
Ask → Generate → Inspect → Edit or retry → Approve → Apply → Confirm outcome
```

The loop can be conversational or structured. The key is that users can correct an interpretation, provide missing context, compare outputs, and recover without starting over.

### 8. Preserve the user's original input

When the model fails, times out, or returns an irrelevant result, the user's prompt and supplied data should not disappear. Keep inputs available for retry and allow users to edit the request before resubmitting.

```html
<form>
  <label for="request">What would you like to summarize?</label>
  <textarea id="request" name="request">Summarize the Q3 support trends and cite the source reports.</textarea>
  <button type="submit">Generate summary</button>
</form>
```

If a request contains sensitive content, communicate where it will be processed and avoid retaining it beyond the product's stated policy. Do not expose private input in shared or public UI surfaces.

### 9. Give users control over generated output

Provide controls that match the task: edit, retry, compare, shorten, expand, change tone, copy, export, or discard. Do not offer an endless row of generic actions that makes the interface harder to scan.

```text
Generated email:
[Edit] [Try again] [Copy]
Before sending:
[Review recipient] [Review content] [Send email]
```

For a high-impact external action, keep review and execution separate. The interface must not make a generated suggestion appear already applied.

### 10. Require explicit confirmation for consequential actions

Sending an email, deleting a record, making a purchase, changing access permissions, or submitting a payment should not happen merely because the user asked the AI to “prepare” something. The UI should show the action, target, relevant details, and consequences before execution.

```html
<section aria-labelledby="send-review-title">
  <h2 id="send-review-title">Review before sending</h2>
  <p>To: customer@example.com</p>
  <p>Subject: Your replacement order</p>
  <button type="button">Edit draft</button>
  <button type="button">Send email</button>
</section>
```

The example address is illustrative; production interfaces must use the actual intended recipient and avoid inventing destinations. For destructive or costly actions, include a clear cancellation route and confirmation appropriate to the risk.

**Gotcha:** “The user asked the agent to do it” is not sufficient evidence that the user approved the exact target and final action.

### 11. Design transparent tool-use states

When an AI system searches files, queries an account, or invokes an external tool, communicate the action in user-understandable terms. Show the outcome and meaningful failures without dumping implementation logs or exposing secrets.

```text
Activity:
1. Found three policy documents
2. Opened the current returns policy
3. Drafted a response using the relevant section

Result: Draft ready for review
```

Only show steps that actually happened. A plan is not a completed action, and a tool call that failed should not be represented as success. Offer detail on demand for users who need to inspect the workflow.

### 12. Use progressive disclosure for technical details

Most users need the result and the next action first. Advanced users may need retrieved passages, model settings, tool activity, or detailed provenance. Put secondary technical information behind a clear inspection control without hiding evidence required for a consequential decision.

```html
<details>
  <summary>How this answer was prepared</summary>
  <p>The answer used the current policy document and the order record last updated today.</p>
</details>
```

Do not hide limitations, fees, permissions, or material uncertainty behind a collapsed section. Progressive disclosure should reduce clutter, not obscure risk.

### 13. Design empty, refusal, and unsupported-request states

AI systems can have no relevant data, refuse a request, or lack the capability the user expects. Explain the boundary briefly and offer an appropriate next step when one exists.

```text
No relevant documents found.
Try selecting another workspace, uploading the policy, or broadening the search.
```

For a refusal, avoid shaming the user or revealing internal policy machinery. If a safe alternative is available, make it concrete. Do not fabricate an answer simply to avoid an empty state.

### 14. Make retry behavior understandable

A retry can mean rerunning the same prompt, changing model parameters, using a different source set, or repeating a failed external operation. The interface should communicate what will happen and protect users from duplicate side effects.

```text
Generation failed before a result was returned.
[Retry generation]

Payment status could not be confirmed.
Check transaction status before trying again.
```

Never present a “Retry” button for a payment or other irreversible action if the system cannot determine whether the first attempt succeeded. Provide a status-check path first.

### 15. Handle hallucinations as product failures, not user failures

A hallucination is not corrected by blaming the user for trusting the interface. Design the system to make unsupported claims easier to detect, report, and correct. Offer source inspection, clear feedback, and recovery that preserves the user's work.

```text
Report this answer:
- A source does not support the claim
- The answer used outdated information
- The answer misunderstood my request
- Other issue
```

Feedback options should route to a real product process if they are presented as reporting mechanisms. Do not imply that a report will be reviewed or change the model unless that is true.

### 16. Use feedback controls that capture actionable information

A simple thumbs-up or thumbs-down can indicate satisfaction but rarely explains what needs fixing. Use lightweight follow-up reasons for important product decisions, and make free-text feedback optional unless necessary.

```text
Was this summary useful?
[Yes] [No]

If no:
[Missing key details] [Incorrect claim] [Poor source] [Wrong format]
```

Avoid repeatedly interrupting the user for feedback. Collect only what is needed, explain the purpose where appropriate, and treat submitted feedback as potentially sensitive.

### 17. Make memory and personalization controllable

If the product remembers preferences or past information, explain what is remembered, how it affects the result, and how the user can review or change it. Do not silently infer highly sensitive traits or imply persistent memory when context is temporary.

```text
Personalization used:
- Preferred report format: concise summary
- Default language: English

[Review preferences] [Change settings]
```

Distinguish session context, saved preferences, and records retrieved from connected accounts. The UI should not blur those categories into a vague claim that the assistant “knows you.”

### 18. Show boundaries for connected data

Users need to know which files, accounts, or workspaces the AI can access. Make connection scope visible and allow users to select or change the source set when appropriate.

```text
Sources included:
- Current project folder
- Approved support policy
- Selected customer record

Sources not included:
- Other workspaces
- Personal files outside the connected folder
```

Do not imply access to information that is not connected or authorized. Handle expired access, revoked permissions, and missing documents as explicit states.

### 19. Support multimodal input with clear affordances

If the interface accepts images, documents, audio, or video, show which input types are supported, the upload state, and any limits that matter to the task. Let users inspect or remove attachments before submission.

```text
Attachments
- invoice-october.pdf — uploaded
- damaged-package.jpg — ready

[Remove invoice] [Add attachment] [Analyze selected files]
```

Do not imply that an image was inspected if processing failed. For sensitive documents, explain how the input will be used and avoid unnecessarily exposing previews in shared environments.

### 20. Design for accessibility in generated interfaces

AI-generated text can be long, irregular, and structurally inconsistent. Use proper heading hierarchy, lists, tables only where appropriate, descriptive links, and semantic controls. Make streamed content and updates understandable without announcing every token.

```html
<article aria-labelledby="generated-title">
  <h2 id="generated-title">Generated report</h2>
  <p>Three themes appeared across the selected feedback.</p>
  <ul>
    <li>Users struggled to find billing settings.</li>
    <li>Several users reported slow confirmation emails.</li>
    <li>Mobile navigation labels were unclear.</li>
  </ul>
</article>
```

Use `:focus-visible`, ensure contrast, preserve keyboard navigation, and test screen-reader output. If content streams in, avoid moving focus unexpectedly or repeatedly interrupting assistive technology.

### 21. Protect privacy at the point of input

AI input fields invite users to paste customer records, personal documents, and confidential material. Explain relevant processing and retention facts at the point they matter. Avoid placing sensitive prompts into shared history, analytics, or public URLs.

```html
<label for="private-notes">Notes for this draft</label>
<textarea id="private-notes" name="private-notes"></textarea>
<p id="privacy-note">Include only information needed for this task. Follow your organization's data-handling rules.</p>
```

This example is a reminder, not a substitute for a real privacy policy or data-protection controls. Do not claim that information is never stored unless the product's actual behavior supports that statement.

### 22. Avoid anthropomorphic overclaiming

Friendly language can make a product approachable, but implying human understanding, feelings, or guaranteed judgment can distort user expectations. Describe capabilities precisely and avoid pretending that the system has performed a human review.

```text
Prefer: “I found two matching passages in the selected documents.”
Avoid: “I personally checked every fact and guarantee this is correct.”
```

The right tone depends on the product, but clarity must remain. A personable interface should not imply certainty or authority the system does not have.

### 23. Match the UI to uncertainty and risk

The more consequential the outcome, the more important it is to show evidence, limitations, and human review. Low-risk creative suggestions may need quick iteration. A medical or financial recommendation may need source context, missing-information prompts, and a clear boundary that the output is not a verified decision.

```text
Low risk: Generate a headline → edit or regenerate
Medium risk: Summarize policy → inspect sources and confirm applicability
High risk: Recommend a financial action → show assumptions, source date, limitations, and route to qualified review
```

Do not use a single generic disclaimer as the only safety mechanism. Build risk handling into the workflow, the content, and the action boundary.

### 24. Evaluate the whole experience, including failure

AI UX quality is not measured only by answer satisfaction. Test whether users understand what the system did, detect wrong outputs, recover from failures, and avoid accidental external actions.

```text
Evaluation questions:
- Did the user know the answer was generated?
- Could the user inspect the source?
- Did the user recognize a missing or unsupported claim?
- Could the user edit or discard the result?
- Did the system clearly distinguish draft from completed action?
- Could the user recover without losing their input?
```

Combine task-based usability testing with quality measures appropriate to the product. Keep model accuracy evaluation separate from interface usability, while recognizing that both affect user outcomes.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Draft, review, then execute

**What it does:** Separates AI-generated content from a consequential external action.

**When to use it:** Sending emails, submitting forms, creating tickets, changing records, or publishing content.

```html
<section aria-labelledby="draft-title">
  <h2 id="draft-title">Draft ready for review</h2>
  <p>Review the recipient and message before sending.</p>
  <button type="button">Edit draft</button>
  <button type="button">Discard</button>
  <button type="button">Send after review</button>
</section>
```

Use the actual target and final content in the review step. After execution, show a confirmed result from the connected system rather than assuming that a click means success.

### Pattern 2: Evidence panel beside a generated answer

**What it does:** Lets users inspect the sources that support an answer without losing their place.

**When to use it:** Document search, enterprise knowledge assistants, policy summaries, and research tools.

```text
Answer
“The return period is 30 days.”

Evidence
- Returns policy
- Section: Eligibility
- Last updated: 14 October
[Open source section]
```

The panel should show the actual source and relevant passage. Make unsupported or conflicting evidence visible instead of presenting citations as decoration.

### Pattern 3: Inline suggestion with explicit acceptance

**What it does:** Offers AI help in the user's existing workflow without replacing the user's work.

**When to use it:** Writing assistance, code completion, form drafting, and content editing.

```html
<div class="editor">
  <label for="announcement">Announcement</label>
  <textarea id="announcement" name="announcement"></textarea>
  <div class="suggestion">
    <p>Suggested revision: clarify the launch date and next action.</p>
    <button type="button">Insert suggestion</button>
    <button type="button">Dismiss</button>
  </div>
</div>
```

Acceptance should be deliberate and reversible. Do not overwrite existing user content without a clear review or undo path.

### Pattern 4: Clarify before generating

**What it does:** Collects missing constraints before the model produces a likely-misleading result.

**When to use it:** Ambiguous requests, multi-format generation, or tasks with consequential requirements.

```text
User: “Prepare a report.”
Clarification:
- Audience: executive team or technical team?
- Period: current quarter or full year?
- Output: one-page summary or detailed analysis?
[Generate report]
```

Ask only for information that materially affects the result. Too many clarification questions create friction; offer sensible defaults when the cost of a wrong assumption is low.

### Pattern 5: Transparent tool activity

**What it does:** Makes real external operations understandable and separates plan, progress, and outcome.

**When to use it:** AI agents that search files, query systems, or update external records.

```text
Activity
1. Searching the selected project folder
2. Reading two relevant documents
3. Drafting a summary

Status: Draft ready
Next: Review sources and edit summary
```

Show only verified activity. If a step fails, state which step failed and whether the final output is incomplete. Do not expose secrets, raw credentials, or confusing implementation logs.

### Pattern 6: Recoverable generation failure

**What it does:** Preserves user work and makes retry behavior predictable.

**When to use it:** Long generations, document processing, uploads, or tasks that may time out.

```text
We couldn't finish the summary. Your request is still available.
[Edit request] [Retry] [Cancel]
```

Keep the original input, show whether attachments are still available, and distinguish a retryable generation from an external action whose outcome is unknown.

### Pattern 7: Source scope selector

**What it does:** Lets users understand and adjust the set of documents or records that may influence the answer.

**When to use it:** Enterprise assistants, connected-drive search, customer support, and research workspaces.

```text
Using 3 sources
[✓] Current project folder
[✓] Approved policy
[ ] Archived customer records

[Update sources]
```

Respect access permissions and make the active scope visible near the result. A source selector must not expose records the user is not authorized to access.

### Pattern 8: Uncertainty with next-step guidance

**What it does:** Communicates a limitation alongside a concrete way to verify or continue.

**When to use it:** Incomplete retrieval, conflicting sources, ambiguous user requests, or time-sensitive information.

```text
Two documents disagree about the warranty period.
- Product guide: 1 year
- Current policy: 2 years

Review the current policy or contact the support team before advising the customer.
```

Do not collapse conflicting evidence into a confident single answer. Explain which source appears current only when the system has reliable metadata to support that conclusion.

### Pattern 9: Human approval queue

**What it does:** Lets a reviewer process many AI-generated items efficiently while keeping control over final decisions.

**When to use it:** Moderation, support replies, catalog enrichment, and bulk document classification.

```text
Pending review: 18 items
Each row includes:
- Generated result
- Source or input record
- Risk or exception indicator
- Edit, approve, reject actions

Bulk approval is available only for items that meet explicit review rules.
```

Provide clear selection state, review filters, and an audit trail where required. Do not make bulk approval the default for high-risk or low-confidence items.

### Pattern 10: User-controlled memory

**What it does:** Makes personalization visible, inspectable, and changeable.

**When to use it:** Assistants that retain preferences or use prior user-provided information.

```text
Preferences used for this response
- Default language: English
- Preferred output: concise summary

[Review preferences] [Change preferences]
```

Separate persistent preferences from current conversation context and connected data. Explain the scope and effect of changes accurately; do not promise deletion or retention behavior that the product does not provide.

### Pattern 11: Multimodal attachment review

**What it does:** Gives users a chance to confirm which files or media will be analyzed.

**When to use it:** Document extraction, image understanding, voice transcription, and video summarization.

```text
Ready to analyze
- invoice-october.pdf — 2 pages
- damaged-package.jpg — image

[Preview] [Remove file] [Analyze selected]
```

Show upload and processing failures clearly. Confirm that the attachment was actually processed before describing a result as based on it.

### Pattern 12: High-risk recommendation review

**What it does:** Presents assumptions, evidence, limitations, and human review before a consequential decision.

**When to use it:** Health, finance, employment, legal, or eligibility workflows.

```text
Recommendation summary
- Inputs used
- Sources and dates
- Important assumptions
- Missing information
- Potential consequences
- What requires independent verification

[Review details] [Ask a qualified professional] [Continue]
```

The design should not create a false sense of authority. A review panel is not a substitute for domain-specific validation, appropriate safeguards, or qualified judgment.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Making every AI feature a chat box | Chat is the most visible AI interaction pattern | Match the UI to the task; use structured forms, inline suggestions, review queues, or comparison views when they fit better |
| Presenting generated text as verified fact | Fluent wording appears authoritative | Label generated content and provide inspectable evidence for important claims |
| Showing uncalibrated confidence percentages | Numeric scores look precise | Use a percentage only when it is validated and meaningful; otherwise explain missing evidence or uncertainty in plain language |
| Using citations as decoration | The interface rewards a scholarly appearance | Ensure each citation supports its nearby claim and opens the relevant source passage |
| Hiding source scope | Users assume the assistant sees more or less than it does | Show active files, workspaces, and records, and make scope changes understandable |
| Treating a planned tool call as completed | Progress copy is written before system results exist | Update activity states only from confirmed events and report failures honestly |
| Sending or publishing generated content immediately | Automation is optimized for speed | Separate draft, review, approval, execution, and confirmation for consequential actions |
| Providing only a generic AI disclaimer | Legal copy is easier than interaction design | Put evidence, limitations, and verification paths next to the specific high-risk claim |
| Losing the prompt after a timeout | Error state replaces the input view | Preserve the request and attachments where safe, then offer edit, retry, and cancel |
| Repeating a payment after an ambiguous result | Retry UI assumes the first attempt failed | Check transaction status before retrying and use idempotency protections in the underlying system |
| Offering meaningless feedback buttons | Thumbs-down is easy to add | Offer concise, actionable reason categories when feedback can improve the product |
| Claiming feedback will train the model | Product copy overstates what the feedback pipeline does | Describe only the actual use of feedback and set expectations accurately |
| Using anthropomorphic claims of certainty | Human-like language feels engaging | Describe observed system behavior and avoid implying human review or guaranteed correctness |
| Hiding limitations in a collapsed panel | The interface aims for visual simplicity | Keep material uncertainty and consequential limitations visible at the decision point |
| Ignoring refusal and no-result states | Designers focus on successful demonstrations | Design clear boundary messages and useful alternatives without fabricating results |
| Streaming every token to assistive technology | Streaming is treated as inherently accessible | Announce meaningful milestones and avoid repeated interruptions or focus jumps |
| Exposing raw tool logs to all users | Technical transparency is confused with implementation detail | Present understandable actions and outcomes, with advanced detail available on demand |
| Making personalization invisible | Memory is treated as an implementation detail | Show what preference or context affected the result and offer a way to review or change it |
| Implying access to unconnected data | Copy suggests the assistant “knows everything” | State the actual source scope and handle revoked or missing access explicitly |
| Overloading the screen with AI controls | Every possible capability is surfaced at once | Prioritize the few actions that support the current task and place secondary options in context |
| Failing to show attachment processing state | Upload completion is mistaken for analysis completion | Distinguish selected, uploading, uploaded, processing, processed, and failed states |
| Using one disclaimer for every risk level | Safety is treated as a universal footer | Match review depth and action constraints to the consequences of error |
| Making generated output hard to edit | The result is styled as a finished artifact | Provide an editable representation, compare/retry controls, and a safe discard path |
| Confusing a draft with a completed action | Status labels are vague | Use explicit states such as “Draft ready,” “Awaiting approval,” “Sending,” and “Sent” only when confirmed |
| Collecting sensitive prompts without context | Input is optimized for convenience | Explain relevant processing and retention facts and minimize unnecessary collection |
| Measuring only user satisfaction | A liked answer may still be wrong or unsafe | Test source inspection, error detection, task completion, recovery, and unintended actions separately |

---

## Mental Models

1. **AI is a probabilistic collaborator, not an oracle** — The interface should make variation and uncertainty manageable instead of pretending every output is correct.
2. **The interaction contract is the product** — Users need to understand what the system will do, what it has done, and what remains under their control.
3. **A draft is not an action** — Generated content and external side effects must have distinct states and approval boundaries.
4. **Evidence belongs beside the claim** — Users should not need to search elsewhere to understand the basis of a consequential answer.
5. **Transparency should answer a user question** — Show the sources, steps, and limits that help a decision; do not dump technical noise.
6. **Retry semantics depend on side effects** — Re-running generation differs from repeating a payment or sending a message.
7. **Human agency is a design feature** — Edit, reject, undo, scope selection, and approval are not optional decoration in consequential workflows.
8. **A refusal is still an interface state** — Explain the boundary and provide a safe next step where possible.
9. **Personalization must be legible** — Users should understand which saved preference or context influenced the result.
10. **A citation is a promise** — It should lead to evidence that genuinely supports the claim.
11. **Risk changes the interaction depth** — Higher-consequence decisions require more verification and stronger action boundaries.
12. **AI UX includes recovery** — A product is not complete until users can handle irrelevant output, missing data, timeouts, and uncertain outcomes.

---

## Quick Reference

| Design concern | Recommended practice | Verify |
|---|---|---|
| Interaction model | Match chat, form, inline suggestion, or queue to the task | Users can complete the task without unnecessary prompting |
| AI labeling | Distinguish generated content from system data and verified facts | Users understand what was generated |
| Evidence | Link important claims to relevant source passages | Citations support the claim and open the right context |
| Uncertainty | Explain missing evidence or conflicting sources | Users know what needs verification |
| Latency | Show real activity and stable loading states | No fabricated percentages or false progress |
| User input | Preserve prompts and attachments across recoverable failures | Retry does not require re-entering work unnecessarily |
| External actions | Separate draft, review, approval, execution, and confirmation | No consequential action occurs without appropriate approval |
| Tool use | Show confirmed steps and outcomes | Failed calls are not presented as success |
| Retry | Distinguish generation retry from side-effect retry | Ambiguous payments or sends are checked before repeating |
| Feedback | Offer actionable reason categories where useful | Feedback is not promised to train or fix anything unless true |
| Memory | Show personalization used and provide controls | Session context and persistent memory are not conflated |
| Connected data | Display the active source scope | Access matches actual permissions |
| Attachments | Show selected, uploaded, processing, and failed states | Results are not attributed to unprocessed files |
| Accessibility | Use semantic HTML, keyboard support, `:focus-visible`, and meaningful announcements | Screen readers are not overwhelmed by streaming updates |
| Privacy | Explain relevant processing and minimize data collection | Sensitive input is handled according to actual policy |
| High-risk decisions | Show assumptions, evidence, limitations, and review steps | Interface does not imply unwarranted authority |
| Evaluation | Test correctness awareness, task completion, and recovery | Satisfaction is not the only success measure |

---

## Build Challenge

Design an AI assistant for a customer-support team that drafts replies using an approved policy library and selected customer records. The assistant must help agents work faster while keeping the agent responsible for the final response.

### Requirements

1. Define the primary support task, user roles, and cost of a wrong answer. Identify which steps are deterministic and which genuinely benefit from AI.
2. Create a structured input experience that allows an agent to choose the customer record, relevant policy sources, desired reply purpose, and tone. Include a conversational path only where it adds value.
3. Clearly label the output as an AI-generated draft and distinguish it from verified customer data and quoted policy content.
4. Provide citations that open the relevant source section. Include a state for missing, stale, or conflicting source material.
5. Define loading and activity states for retrieval and generation. Do not display progress claims that are not tied to actual system events.
6. Preserve the agent's request and selected sources if generation fails. Include edit, retry, and cancel paths.
7. Provide controls for editing, regenerating, comparing, copying, and discarding the draft without losing existing work.
8. Separate review from sending. The review screen must show the actual recipient, subject, full message, and any material source caveat before the agent sends.
9. Define explicit states for draft ready, awaiting review, sending, sent, send failed, and send outcome unknown.
10. Prevent duplicate sends when a request times out or the response from the sending service is ambiguous. Provide a status-check path before retry.
11. Make connected-data scope visible and ensure the agent cannot access records outside their authorization.
12. Add a lightweight feedback flow that records actionable issues such as unsupported claims, outdated policy, or incorrect tone without promising an unverified model-training effect.
13. Ensure the interface is keyboard-operable and uses semantic HTML, visible `:focus-visible` styling, proper labels, and appropriate status announcements.
14. Test long responses, missing citations, refusal, no relevant documents, revoked access, and slow or failed tool calls.
15. Conduct usability tests that measure whether agents detect unsupported claims, edit incorrect drafts, and understand when a message has actually been sent.

### Definition of Done

- Agents can identify which parts of a result are generated, retrieved, or confirmed application data.
- Every important policy claim has a working, relevant source reference or is explicitly marked as unsupported.
- The interface never claims that a message was sent until the sending system confirms the outcome.
- A failed generation preserves the original request and selected source scope.
- The review step exposes the recipient and full content before a consequential action.
- An ambiguous send outcome cannot be blindly retried in a way that duplicates a message.
- Users can edit, reject, or discard generated output without losing their own content.
- Source access respects permissions, and the interface does not imply access to unconnected records.
- Keyboard and screen-reader testing confirms that controls, states, and source links are understandable.
- Evaluation includes task completion, source checking, error detection, and recovery—not only agent satisfaction.

### Review Checklist

- [ ] Confirm that AI is used where it adds value rather than replacing a deterministic control.
- [ ] Inspect every claim-source relationship and open the actual cited passage.
- [ ] Verify that generated, retrieved, and application-confirmed content are distinguishable.
- [ ] Trigger slow, empty, refused, failed, and conflicting-source responses.
- [ ] Confirm that the original prompt and attachments survive recoverable failures.
- [ ] Test editing, comparison, retry, discard, and cancellation.
- [ ] Verify that send approval shows the real target and final content.
- [ ] Simulate an ambiguous send response and confirm the interface checks status before retry.
- [ ] Test keyboard operation, visible focus, semantic labels, and screen-reader announcements.
- [ ] Review privacy copy against the product's actual processing and retention behavior.
- [ ] Verify source permissions and behavior when access is revoked.
- [ ] Record usability findings about trust, uncertainty, and recovery, not just visual preferences.
