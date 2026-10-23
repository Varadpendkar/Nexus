# SKILL: conversational-ui-patterns

**Layer:** 28 --- Interaction Design

**Goal:** Design conversational interfaces that help users express
intent, understand system capabilities, recover from errors, and
complete tasks through clear, accessible dialogue.

## Why This Matters (Senior Perspective)

Conversational interfaces can make complex workflows feel approachable
because people can express a goal in their own words, ask follow-up
questions, and refine a request incrementally. But a chat interface is
not automatically intuitive just because it resembles human
conversation. If the system misunderstands an input, hides available
actions, forgets context, or responds with vague language, users can
become stuck faster than they would in a well-designed form. The
interface must communicate what it can do, what information it needs,
what it has understood, and what will happen next.

A beginner often focuses on the message bubble, typing indicator, and
friendly tone. A senior designer treats the conversation as a stateful
product workflow. They define the system's capabilities, the information
required for each task, the confirmation needed before consequential
actions, the behavior when an answer is ambiguous, and the route back
from an error. They also consider whether a conversational interface is
the right control at all. A date picker is usually better than asking
users to type an uncertain date format; a table is better than a long
stream of numbers; a confirmation screen is better than silently
executing a destructive request. Good conversational UI combines
dialogue with structured controls when those controls improve accuracy.

This matters in AI products, support assistants, onboarding guides,
search experiences, and creative tools. Users need clear expectations
about uncertainty and limitations, and they should not have to repeat
information that the interface can safely retain within the current
task. At the same time, context must be handled carefully: the system
should make assumptions visible, avoid pretending to know missing facts,
and ask concise clarification questions when an answer depends on them.
Design for successful task completion, not for the illusion of a human
personality. The best conversational interface is predictable,
transparent, respectful of user effort, and easy to leave or correct.

## Core Concepts

### 1. Start with the User's Goal, Not the Chat Bubble

Define the task that conversation helps users complete. A conversational
interface is a means to an outcome, not the outcome itself. Before
designing the message layout, map the user's goal, required information,
success state, and fallback route.

``` html
<section aria-labelledby="assistant-title">
  <h1 id="assistant-title">Project assistant</h1>
  <p>Ask for help planning, reviewing, or organizing a project.</p>
  <button type="button">Plan a project</button>
  <button type="button">Review a draft</button>
</section>
```

The suggested actions reduce the burden of inventing a first prompt
while still allowing free-form input.

**Naive/Wrong:** Launch into a blank chat with no indication of
supported tasks.

**Correct:** State the assistant's useful capabilities and provide
example starting points connected to real user goals.

**Gotcha:** Do not list capabilities that the system cannot reliably
perform. An impressive-looking prompt suggestion creates frustration if
the workflow does not exist.

### 2. Set Expectations About Capabilities and Limits

Users should understand what the interface can help with and where it
needs clarification or a different tool. Explain capabilities in plain
language, and avoid broad claims such as "Ask me anything" when the
system is task-specific.

``` html
<aside class="assistant-scope">
  <h2>What I can help with</h2>
  <ul>
    <li>Summarize a project brief</li>
    <li>Draft a task list</li>
    <li>Identify missing project details</li>
  </ul>
  <p>I may ask a question when required details are missing.</p>
</aside>
```

``` css
.assistant-scope {
  max-width: 42rem;
  padding: 1rem;
  border: 1px solid #d4d4dc;
  border-radius: .75rem;
}
```

**Naive/Wrong:** Claim the assistant can handle every possible task and
allow users to discover limits only through failure.

**Correct:** Communicate a useful scope, provide examples, and make
unsupported requests easy to redirect.

**Gotcha:** Capability text should reflect actual behavior and be
maintained as features change. Outdated promises undermine trust.

### 3. Keep Each Turn Focused

A conversational turn should have a clear purpose. If several
independent details are needed, ask for them in a compact, structured
way when that reduces effort. If only one essential detail is missing,
ask one direct question rather than presenting a long form.

``` html
<form aria-labelledby="booking-heading">
  <h2 id="booking-heading">Choose a time</h2>
  <label for="meeting-date">Date</label>
  <input id="meeting-date" type="date">
  <label for="meeting-time">Preferred time</label>
  <select id="meeting-time">
    <option value="">Select a time</option>
    <option>Morning</option>
    <option>Afternoon</option>
  </select>
  <button type="submit">Continue</button>
</form>
```

**Naive/Wrong:** Ask a long sequence of questions one at a time even
when users could answer them together, or ask ten unrelated questions in
one dense paragraph.

**Correct:** Match the interaction to the information need: concise
dialogue for a single clarification, structured controls for independent
fields.

**Gotcha:** Do not ask users to repeat information already available and
relevant in the current task. Confirm it only when ambiguity or
consequences justify doing so.

### 4. Preserve Context Without Hiding Assumptions

Conversation feels coherent when the system uses relevant information
from earlier turns. But it should distinguish known facts from
assumptions and should not silently carry an uncertain value into a
consequential action.

``` html
<div class="assistant-summary">
  <h2>Here is what I understood</h2>
  <dl>
    <dt>Task</dt><dd>Prepare a project timeline</dd>
    <dt>Deadline</dt><dd>30 November</dd>
    <dt>Team size</dt><dd>Not provided yet</dd>
  </dl>
  <button type="button">Edit details</button>
</div>
```

**Naive/Wrong:** Treat a guess as confirmed information and build the
rest of the workflow on top of it.

**Correct:** Reuse clear context, expose important assumptions, and ask
only about information that changes the result.

**Gotcha:** Context can become stale when the user changes goals.
Confirm critical details after a meaningful shift rather than blindly
reusing earlier values.

### 5. Ask Clarifying Questions That Reduce Real Ambiguity

Clarification is useful when different interpretations would lead to
materially different results. Ask the smallest question that resolves
the uncertainty. Avoid vague prompts such as "Can you elaborate?" when a
concrete choice is available.

``` html
<fieldset>
  <legend>Which report should I summarize?</legend>
  <label><input type="radio" name="report" value="sales"> Sales report</label>
  <label><input type="radio" name="report" value="support"> Support report</label>
  <label><input type="radio" name="report" value="project"> Project report</label>
</fieldset>
```

**Naive/Wrong:** Ask users to restate their entire request because one
small detail is missing.

**Correct:** Ask a focused question, provide useful choices when
appropriate, and preserve the rest of the request.

**Gotcha:** Do not offer false choices when the user may have another
valid answer. Include "Other" or a free-text path when the option set is
not exhaustive.

### 6. Show Progress for Multi-Step Tasks

For tasks that take time, users need to know whether the system is
working, waiting for input, or finished. Progress feedback should be
truthful and meaningful; a decorative typing indicator is not a
substitute for status when the operation has several stages.

``` html
<section aria-labelledby="task-status">
  <h2 id="task-status">Preparing your report</h2>
  <ol>
    <li>Collecting the selected data</li>
    <li aria-current="step">Analyzing results</li>
    <li>Preparing the summary</li>
  </ol>
  <p role="status" aria-live="polite">Analysis is in progress.</p>
</section>
```

**Naive/Wrong:** Show a spinner indefinitely with no explanation or
indication of whether the task is still active.

**Correct:** Communicate the current state, disclose delays when
possible, and offer cancellation or a safe way to continue when
appropriate.

**Gotcha:** Do not display a percentage unless it reflects real
measurable progress. Fake precision damages credibility.

### 7. Design Error Messages for Recovery

An error should explain what happened in language users can understand
and identify a next step. Avoid blaming the user or returning a
technical error code as the entire response. Preserve the original input
when retrying is safe.

``` html
<div role="alert" class="error-message">
  <h2>We couldn’t save your changes</h2>
  <p>Your text is still here. Check your connection and try again.</p>
  <button type="button">Try again</button>
</div>
```

``` css
.error-message {
  border-inline-start: .25rem solid #b42318;
  padding: 1rem;
}
```

**Naive/Wrong:** Respond with "Something went wrong" and clear the
conversation input.

**Correct:** Explain the failure at the level the user needs, preserve
work, and offer a clear recovery action.

**Gotcha:** Retrying an operation may create duplicates if the original
request partially succeeded. The interface should distinguish safe
retries from actions that need status verification.

### 8. Confirm Consequential Actions Before Execution

Actions such as sending a message, deleting data, making a purchase, or
publishing content may need a confirmation step. Show the action and its
important parameters before execution. Do not ask for confirmation for
every harmless operation, because excessive confirmation trains users to
click through.

``` html
<section aria-labelledby="confirm-title">
  <h2 id="confirm-title">Send this message?</h2>
  <p>To: Project team</p>
  <blockquote>Tomorrow’s review starts at 10:00 AM.</blockquote>
  <button type="button">Edit message</button>
  <button type="button">Send message</button>
  <button type="button">Cancel</button>
</section>
```

**Naive/Wrong:** Execute a consequential action based on an ambiguous
conversational instruction with no review step.

**Correct:** Confirm the material details when risk or irreversibility
warrants it, and provide edit and cancel paths.

**Gotcha:** Confirmation should be proportional to the impact. Requiring
a confirmation for every minor navigation step creates friction without
improving safety.

### 9. Combine Conversation with Structured UI

Free-form language is useful for expressing goals and context, while
structured controls are better for constrained values, comparisons, and
exact selections. The strongest interface often combines the two rather
than forcing every task into a chat transcript.

``` html
<div class="assistant-turn">
  <p>Which priority should the plan optimize for?</p>
  <div role="group" aria-label="Plan priority">
    <button type="button">Lowest cost</button>
    <button type="button">Fastest delivery</button>
    <button type="button">Highest quality</button>
  </div>
</div>
```

**Naive/Wrong:** Ask users to type exact dates, categories, or
enumerated choices when a control would be faster and less error-prone.

**Correct:** Use dialogue to understand intent and structured UI for
precise, constrained input.

**Gotcha:** Buttons should represent real options and have clear labels.
Do not turn every possible reply into a button; retain a free-form route
when users need flexibility.

### 10. Make Message Hierarchy Easy to Scan

Conversation histories can become long and visually repetitive.
Differentiate user messages, system responses, tool results, warnings,
and completed actions without relying on color alone. Keep long answers
scannable with headings, short paragraphs, lists, and expandable
details.

``` html
<ol class="conversation" aria-label="Conversation history">
  <li class="message message-user">
    <p>Summarize the project risks.</p>
  </li>
  <li class="message message-assistant">
    <p>There are three main risks.</p>
    <ul>
      <li>Unclear ownership</li>
      <li>Limited testing time</li>
      <li>External dependency</li>
    </ul>
  </li>
</ol>
```

**Naive/Wrong:** Render every answer as one huge paragraph in identical
message bubbles.

**Correct:** Use semantic structure and visual hierarchy so users can
scan, revisit, and act on important information.

**Gotcha:** Do not rely on bubble alignment or color alone to
communicate who said what. Include a meaningful accessible structure.

### 11. Manage Streaming and Partial Responses

When an answer appears progressively, the interface must communicate
that it is still being generated and avoid making partial content look
final. If a user interrupts or changes the request, define whether the
current response stops, completes, or is replaced.

``` html
<section aria-labelledby="answer-heading">
  <h2 id="answer-heading">Draft answer</h2>
  <div id="answer-content">The first section is ready…</div>
  <p role="status" aria-live="polite">Response is still being generated.</p>
  <button type="button">Stop response</button>
</section>
```

**Naive/Wrong:** Let partial output look complete, or leave the stop
control active after generation has ended.

**Correct:** Show a truthful generating state, make interruption
behavior clear, and distinguish draft output from completed output.

**Gotcha:** Avoid announcing every streamed token to assistive
technology. Use restrained status announcements and test how updates are
exposed to screen readers.

### 12. Provide Conversation Controls and User Agency

Users need to correct a previous answer, stop generation, clear a draft,
restart a flow, or leave the conversation. These controls should be easy
to find and should not require users to know a special phrase.

``` html
<nav aria-label="Conversation actions">
  <button type="button">Stop response</button>
  <button type="button">Edit last message</button>
  <button type="button">Start new conversation</button>
</nav>
```

**Naive/Wrong:** Force users to continue a mistaken workflow because no
visible edit, cancel, or restart action exists.

**Correct:** Keep the user in control with clear actions for stopping,
correcting, retrying, and restarting.

**Gotcha:** A restart action may discard user work. Warn about unsaved
content or preserve it when possible.

### 13. Handle Empty States and First-Run Experience

A blank chat history can feel intimidating. Provide a concise
explanation of the system's purpose and a few useful example tasks.
Suggestions should reflect real supported tasks and should not overwhelm
the user with a wall of sample prompts.

``` html
<section class="empty-chat" aria-labelledby="welcome-title">
  <h2 id="welcome-title">What would you like to work on?</h2>
  <p>Start with a question or choose a common task.</p>
  <button type="button">Summarize a document</button>
  <button type="button">Draft a project plan</button>
</section>
```

**Naive/Wrong:** Display an empty transcript and expect users to guess
what they can ask.

**Correct:** Set expectations and provide a small number of useful
starting points while allowing free input.

**Gotcha:** Example prompts should not imply access to data or
capabilities the system does not have.

### 14. Make Long Conversations Navigable

Long histories need ways to find earlier information and return to
important results. Depending on the product, useful features may include
search, pinned outputs, conversation titles, summaries, or links to
completed artifacts.

``` html
<div class="conversation-tools">
  <label for="search-history">Search conversation</label>
  <input id="search-history" type="search" placeholder="Find a message">
  <button type="button">Search</button>
</div>
```

**Naive/Wrong:** Treat a long transcript as an endless scroll with no
way to recover important information.

**Correct:** Provide navigation appropriate to the conversation's length
and the value of its outputs.

**Gotcha:** Search results should identify context and allow users to
return to the original message, not just display an isolated fragment.

### 15. Communicate Uncertainty Without Becoming Vague

When the system is uncertain, it should explain the uncertainty and help
the user choose a next step. It should not present guesses as facts, but
it should also avoid generic disclaimers that provide no actionable
guidance.

``` html
<div class="uncertainty-note">
  <p>I found two possible interpretations of “the latest report.”</p>
  <button type="button">Monthly report</button>
  <button type="button">Quarterly report</button>
</div>
```

**Naive/Wrong:** Silently select one interpretation and act as if it
were certain.

**Correct:** Make consequential ambiguity visible and ask a focused
question or label the assumption clearly.

**Gotcha:** Do not ask for clarification when the ambiguity has no
meaningful effect on the result. Unnecessary questions increase effort
without improving accuracy.

### 16. Respect Privacy and Sensitive Input

A conversational interface can encourage people to share more
information than a task requires. Ask only for necessary information,
explain why it is needed when that is not obvious, and avoid displaying
sensitive details unnecessarily in history or summaries.

``` html
<div class="privacy-guidance">
  <label for="support-question">Describe the issue</label>
  <textarea id="support-question" rows="4"></textarea>
  <p>Do not include passwords or full payment-card details.</p>
</div>
```

**Naive/Wrong:** Ask users to paste all personal records into the
conversation when a limited description would suffice.

**Correct:** Minimize requested data, provide relevant privacy guidance,
and avoid repeating sensitive information in unnecessary places.

**Gotcha:** A privacy notice is not a substitute for appropriate data
handling. Product behavior, retention, and access controls must match
the promises shown in the interface.

## Named Patterns

### Pattern 1: Suggested Starter Tasks

**What it does:** Gives first-time users concrete examples of supported
tasks.

**When to use it:** Empty states, onboarding, task-focused assistants,
and help experiences.

``` html
<div class="starter-tasks" role="group" aria-label="Suggested tasks">
  <button type="button">Summarize a brief</button>
  <button type="button">Create a checklist</button>
  <button type="button">Review a draft</button>
</div>
```

Nuance: keep suggestions few, task-specific, and aligned with actual
system capabilities. A starter task should lead to a real working flow,
not merely insert a decorative prompt.

### Pattern 2: Focused Clarification

**What it does:** Resolves one important ambiguity without making the
user repeat the whole request.

**When to use it:** Missing dates, unclear references, multiple possible
records, and requests with materially different interpretations.

``` html
<fieldset>
  <legend>Which version should I use?</legend>
  <label><input type="radio" name="version" value="draft"> Draft</label>
  <label><input type="radio" name="version" value="final"> Final</label>
</fieldset>
```

Nuance: preserve all confirmed details and allow a free-form answer when
the choices are not exhaustive.

### Pattern 3: Structured Choice in Conversation

**What it does:** Embeds buttons, selectors, or other controls in a
conversational flow.

**When to use it:** Constrained choices, preference selection,
categories, and options that are easier to compare visually.

``` html
<div role="group" aria-label="Output format">
  <button type="button">Summary</button>
  <button type="button">Detailed report</button>
  <button type="button">Checklist</button>
</div>
```

Nuance: keep labels distinct, show the selected state when appropriate,
and provide an alternate input path if the user's answer may fall
outside the listed options.

### Pattern 4: Confirm Before Consequential Action

**What it does:** Shows the material details of an action and allows the
user to edit, confirm, or cancel.

**When to use it:** Sending, publishing, deleting, purchasing,
submitting, or other consequential operations.

``` html
<section aria-labelledby="send-confirmation">
  <h2 id="send-confirmation">Ready to send?</h2>
  <p>Recipient: Project team</p>
  <button type="button">Edit</button>
  <button type="button">Confirm send</button>
  <button type="button">Cancel</button>
</section>
```

Nuance: confirm proportionally to risk. Too many low-value confirmations
create fatigue, while too few high-impact confirmations can cause harm.

### Pattern 5: Recoverable Error Turn

**What it does:** Explains a failure, preserves the user's work where
possible, and offers a next action.

**When to use it:** Network failures, unsupported input, incomplete
data, unavailable services, and failed task execution.

``` html
<div role="alert">
  <p>The report could not be loaded. Your question is still saved.</p>
  <button type="button">Try again</button>
  <button type="button">Choose another report</button>
</div>
```

Nuance: retry only when safe. If the first request might have partially
succeeded, check its status before repeating a consequential operation.

### Pattern 6: Progress with Honest Status

**What it does:** Shows which stage a multi-step task has reached and
whether the user needs to act.

**When to use it:** Document analysis, long-running searches,
generation, imports, and multi-step workflows.

``` html
<ol aria-label="Report progress">
  <li>Collecting data</li>
  <li aria-current="step">Analyzing</li>
  <li>Preparing results</li>
</ol>
<p role="status" aria-live="polite">Analysis is in progress.</p>
```

Nuance: communicate real stages rather than fake percentages. Include a
cancellation path when the task can be safely stopped.

## Common Mistakes

  -----------------------------------------------------------------------
  Mistake                 Why It Happens          Fix
  ----------------------- ----------------------- -----------------------
  Blank first-run screen  The team assumes users  Add a short scope
                          know what to ask        statement and relevant
                                                  starter tasks

  Overpromising           Marketing language is   Describe only supported
  capabilities            written separately from tasks and keep copy
                          product behavior        synchronized with
                                                  features

  Asking too many         The flow is designed    Ask one essential
  questions               around internal fields  question at a time
                          rather than user effort unless a compact
                                                  structured input is
                                                  easier

  Repeating known details Context is not carried  Reuse confirmed details
                          forward through the     and ask only when
                          task                    ambiguity matters

  Hiding assumptions      The system chooses a    State consequential
                          default silently        assumptions and let
                                                  users correct them

  Vague clarification     The system asks "Can    Identify the ambiguous
                          you clarify?" without   detail and offer useful
                          guidance                choices

  Fake progress indicator A spinner is easier     Show real stages or a
                          than modeling task      clear waiting state
                          states                  without invented
                                                  percentages

  Generic error message   Error handling is       Explain what happened
                          written for developers  and give a concrete
                                                  recovery action

  Clearing user input on  The implementation      Preserve text and
  failure                 resets the form too     selected values when
                          early                   retrying is safe

  Executing consequential The design optimizes    Preview important
  actions immediately     for speed alone         parameters and offer
                                                  edit, confirm, and
                                                  cancel

  Confirming every tiny   The product treats all  Scale confirmation to
  action                  actions as equally      impact, reversibility,
                          risky                   and ambiguity

  Chat-only constrained   Everything is forced    Use date pickers,
  input                   into free-form text     buttons, selectors, or
                                                  tables where they
                                                  improve precision

  Unstructured long       Message bubbles are     Use headings, lists,
  answers                 treated as plain text   summaries, and
                          containers              expandable details

  Streaming output        Live rendering is not   Use restrained status
  announced token by      tested with assistive   announcements and test
  token                   technology              screen-reader behavior

  No stop or edit         The conversation is     Add controls to stop,
  controls                modeled as one-way      correct, retry, and
                          output                  restart

  Stale conversation      Earlier details are     Detect task changes and
  context                 reused after the goal   reconfirm critical
                          changes                 parameters

  Repeated sensitive data The interface echoes    Minimize collection and
                          the full prompt by      avoid unnecessary
                          default                 repetition of sensitive
                                                  content

  Unclear completion      The final response      Show when the task is
  state                   looks like another      complete and surface
                          partial turn            the useful output or
                                                  next step

  Retry creates duplicate The first request may   Verify action status or
  actions                 have partially          use idempotent
                          succeeded               operation design

  Suggestions do not work Starter prompts were    Connect every
                          added as visual filler  suggestion to a tested,
                                                  supported workflow
  -----------------------------------------------------------------------

## Mental Models

1.  **Conversation is a workflow:** Treat turns as steps toward an
    outcome, with state, dependencies, and a completion condition.
2.  **Ask for the missing variable:** Preserve what is already known and
    clarify only the detail that changes the answer.
3.  **Dialogue and controls are complementary:** Use natural language
    for intent and structured UI for precise selections.
4.  **Honesty beats theatrical confidence:** Show uncertainty and
    limitations when they affect the user's decision.
5.  **Recovery is part of the happy path:** A retry, edit, or undo route
    is a core part of the interaction, not an afterthought.
6.  **Confirmation should scale with risk:** Add friction when it
    protects users from consequential mistakes, not by default
    everywhere.
7.  **Context is useful only when current:** Reuse relevant confirmed
    details, but do not carry stale assumptions into a new task.
8.  **Progress must be truthful:** Status should reflect a real stage or
    real waiting condition, not invented precision.
9.  **The transcript is not the whole interface:** Search, tables,
    buttons, previews, and saved artifacts may serve the task better
    than another paragraph.
10. **User agency must remain visible:** Users should be able to stop,
    correct, cancel, or leave a flow without knowing hidden commands.

## Quick Reference

  -----------------------------------------------------------------------
  Situation               Recommended approach    Important detail
  ----------------------- ----------------------- -----------------------
  First visit             Suggested starter tasks Make examples concrete
                                                  and supported

  Missing one critical    Focused clarification   Do not make the user
  detail                                          restate everything

  Exact date or category  Structured control      Reduce format errors
  selection                                       and ambiguity

  Long-running operation  Honest progress status  Never invent percentage
                                                  completion

  Failed request          Recoverable error turn  Preserve user work and
                                                  explain next steps

  Sending or deleting     Consequential-action    Show parameters and
                          confirmation            allow cancel/edit

  Long answer             Structured message      Use headings, lists,
                          hierarchy               and concise summaries

  Streaming answer        Partial-response state  Make generation and
                                                  interruption behavior
                                                  clear

  Ambiguous reference     Clarify or state        Ask only when the
                          assumption              result changes
                                                  materially

  Sensitive request       Data minimization       Collect only what is
                                                  needed

  Long transcript         Search or saved results Make important outputs
                                                  recoverable

  User changes their mind Stop/edit/restart       Preserve work when
                          controls                possible
  -----------------------------------------------------------------------

## Build Challenge: Create a Task-Oriented Conversational Assistant

Build a conversational interface that helps a user create a project plan
from an initial request. The interface should guide the user through
ambiguity, show progress, preserve context, and recover from failure
without pretending to understand information it does not have.

### Requirements

1.  Create an empty state that explains the assistant's purpose in plain
    language.
2.  Add three starter tasks that each lead to a supported workflow.
3.  Provide a message input with a clear label and keyboard-accessible
    submit action.
4.  Render user and assistant messages with semantic structure and clear
    hierarchy.
5.  Ask a focused clarification when a required project detail is
    missing.
6.  Preserve all confirmed details across follow-up turns in the same
    task.
7.  Display a compact summary of the current task assumptions and allow
    the user to edit them.
8.  Use structured controls for at least one constrained choice, such as
    priority or deadline.
9.  Show truthful progress for a multi-step operation.
10. Include a stop or cancel control for work that can be safely
    interrupted.
11. Design a recoverable error state that preserves the user's request.
12. Add a confirmation step before a simulated consequential action,
    such as publishing the plan.
13. Distinguish partial output from a completed response.
14. Include an edit or restart path without requiring a secret command.
15. Provide a useful final artifact, such as a checklist or timeline,
    rather than only a chat transcript.
16. Ensure all controls have accessible names and visible focus states.
17. Test the interface at narrow mobile and desktop widths.
18. Test keyboard navigation and a screen-reader pass for message and
    status announcements.
19. Include a privacy hint that discourages unnecessary sensitive
    information.
20. Document what happens when the user changes the goal mid-flow.

### Failure scenarios to test

-   The user asks for a project plan but gives no deadline, and the
    system invents one.
-   The user corrects the team size, but the summary continues to show
    the old value.
-   The user presses submit twice and the same consequential action runs
    twice.
-   A network error clears the message the user wrote.
-   The progress indicator says "80%" even though no measurable progress
    exists.
-   The user cannot stop a response that is taking too long.
-   The user is forced to type a date in an undocumented format.
-   The final result is presented as complete while a background step is
    still running.
-   The user changes the task and the assistant silently reuses
    incompatible assumptions.
-   A keyboard user cannot access a suggested task or confirmation
    control.

### Definition of Done / Success Criteria

-   [ ] Users can identify what the assistant supports before starting.
-   [ ] Starter tasks lead to real, functioning workflows.
-   [ ] Clarification questions target only information that materially
    affects the outcome.
-   [ ] Confirmed context is reused and important assumptions remain
    editable.
-   [ ] Structured controls are used where they reduce input errors.
-   [ ] Progress and completion states accurately reflect task status.
-   [ ] Errors preserve user work and provide a useful next step.
-   [ ] Consequential actions can be reviewed, edited, cancelled, or
    confirmed.
-   [ ] Users can stop or restart a flow without relying on hidden
    commands.
-   [ ] The final output is easy to scan, reuse, or export.
-   [ ] Keyboard focus is visible and the core flow is operable without
    a mouse.
-   [ ] Status announcements are useful and not excessively noisy.
-   [ ] The layout works at mobile and desktop sizes.
-   [ ] Privacy guidance and actual product behavior are consistent.
-   [ ] The flow has been tested against every listed failure scenario.

## Final Review Checklist

Before shipping, verify that the interface makes its scope clear, starts
users with useful options, asks only necessary questions, distinguishes
facts from assumptions, preserves work through errors, and provides
honest progress. Check whether structured controls would make a task
safer or easier than free-form text. Review confirmation steps against
actual risk. Ensure that users can stop, edit, retry, restart, and
recover. Finally, test the entire workflow with keyboard navigation,
assistive technology, small screens, ambiguous input, and simulated
failures.

A strong conversational interface is not simply a chat window with
polished messages. It is a reliable task experience that uses
conversation where language helps and uses structure where precision
matters. Keep the user informed, preserve their agency, and make the
next step clear.
