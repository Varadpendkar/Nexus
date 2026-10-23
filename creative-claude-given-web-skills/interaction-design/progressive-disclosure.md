# SKILL: progressive-disclosure

**Layer:** 28 --- Interaction Design

**Goal:** Reveal information and controls in stages so users can focus
on the current task while retaining clear access to advanced options and
details.

## Why This Matters (Senior Perspective)

Interfaces often become difficult not because any one feature is
especially complicated, but because every feature, setting, and
explanation is presented at once. A screen that exposes all
configuration options imposes a high scanning cost, makes priorities
harder to recognize, and forces users to understand details before they
know whether those details matter. Progressive disclosure manages this
complexity by presenting the information needed for the current decision
and revealing additional detail when the user asks for it or reaches the
point where it becomes relevant.

A beginner may interpret progressive disclosure as hiding things behind
menus. A senior designer treats it as an information-architecture
decision: what must be visible now, what can wait, how will users
discover the hidden content, and how can they return without losing
context? Hiding an option is not automatically simplification. If users
need a critical setting but cannot predict where it lives, the interface
has merely traded visual clutter for search cost. Good disclosure uses
meaningful labels, recognizable patterns, clear expanded states,
sensible defaults, and stable locations for advanced controls.

This principle is especially valuable in creative tools, dashboards,
configuration flows, and responsive interfaces. A portfolio editor can
show the essential title and image fields first while keeping metadata
in an advanced section. A dashboard can display the main metric and
reveal its breakdown on demand. A settings page can group rarely used
options without concealing essential consequences. The right level of
disclosure depends on user expertise, task frequency, risk, and screen
space. The goal is not the fewest visible controls; it is the least
unnecessary complexity while preserving discoverability, confidence, and
control.

## Core Concepts

### 1. Distinguish Essential from Advanced Information

Start by identifying what users need for the current task. Essential
controls should be visible at the moment of decision. Advanced options
can be grouped or deferred when they are infrequent, optional, or
meaningful only to experienced users. Do not hide information that
changes the consequence of the primary action.

``` html
<form>
  <label for="title">Project title</label>
  <input id="title" name="title" required>

  <details>
    <summary>Advanced project settings</summary>
    <label for="slug">Custom URL slug</label>
    <input id="slug" name="slug">
    <label for="description">Search description</label>
    <textarea id="description" name="description"></textarea>
  </details>

  <button type="submit">Create project</button>
</form>
```

``` css
details { margin-block: 1rem; border-top: 1px solid #444454; padding-top: 1rem; }
summary { cursor: pointer; font-weight: 650; }
details[open] summary { margin-bottom: .8rem; }
```

**Naive/Wrong:** Hide a setting because it makes the page look crowded,
without considering whether users need it to make an informed choice.

**Correct:** Classify information by task relevance, frequency, risk,
and user expertise before deciding what to disclose.

**Gotcha:** A setting that seems "advanced" to the product team may be
essential for a specific user group. Validate the hierarchy with real
tasks.

### 2. Use Clear Disclosure Triggers

A disclosure trigger should tell users what will become visible.
"Advanced settings," "View details," "Show filters," and "Read full
description" are more predictable than vague labels such as "More." The
trigger should also expose its state to assistive technology.

``` html
<button type="button" aria-expanded="false" aria-controls="filter-panel" id="filter-toggle">
  Show filters
</button>
<section id="filter-panel" hidden>
  <!-- Filter controls -->
</section>
```

``` js
const toggle = document.querySelector("#filter-toggle");
const panel = document.querySelector("#filter-panel");

toggle.addEventListener("click", () => {
  const expanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!expanded));
  panel.hidden = expanded;
  toggle.textContent = expanded ? "Show filters" : "Hide filters";
});
```

**Naive/Wrong:** Use a plus icon with no label, no accessible name, and
no state indication.

**Correct:** Name the content that will appear and keep `aria-expanded`
synchronized with visibility.

**Gotcha:** `aria-controls` provides a relationship but does not itself
expand or collapse the panel. The actual behavior must be implemented.

### 3. Use Native Disclosure When It Fits

The HTML `<details>` and `<summary>` elements provide built-in
disclosure behavior for simple sections. They are suitable for FAQs,
advanced options, and supplementary information when the interaction
does not require a custom state model.

``` html
<details>
  <summary>What happens when I publish?</summary>
  <p>Your project becomes visible according to the visibility setting you choose.</p>
</details>
```

``` css
details {
  border-bottom: 1px solid #3d3d4f;
  padding-block: .9rem;
}
summary { cursor: pointer; padding: .25rem 0; }
summary:focus-visible { outline: 3px solid #a99cff; outline-offset: 4px; }
```

**Naive/Wrong:** Build a custom accordion with clickable `div` elements
and reimplement keyboard behavior unnecessarily.

**Correct:** Prefer native disclosure when its behavior meets the
requirement; use a custom pattern only when the interaction genuinely
needs it.

**Gotcha:** Native details elements do not automatically enforce "only
one panel open at a time" in every implementation context. If exclusive
accordion behavior is required, define and test it deliberately.

### 4. Preserve Context When Revealing Details

When users open a panel, they should understand how it relates to the
current task and should not lose their place. Avoid sending them to a
different screen for a small piece of optional information unless that
detail needs its own workspace. Inline expansion is useful when the user
needs a brief explanation or a small set of controls.

``` html
<article class="metric-card">
  <h2>Monthly sign-ups</h2>
  <p class="metric-value">1,248</p>
  <button type="button" aria-expanded="false" aria-controls="metric-breakdown">
    View breakdown
  </button>
  <div id="metric-breakdown" hidden>
    <p>Organic: 730 · Referral: 318 · Paid: 200</p>
  </div>
</article>
```

``` css
.metric-card { padding: 1.25rem; border: 1px solid #414154; border-radius: 1rem; }
.metric-value { font-size: 2.5rem; font-weight: 750; }
```

**Naive/Wrong:** Navigate away from a dashboard to show one small detail
and force the user to reconstruct their previous context.

**Correct:** Expand small, related details inline when doing so
preserves the user's mental map.

**Gotcha:** Large expanded content can push important controls
off-screen. Consider a side panel or dialog when the detail is
substantial.

### 5. Make Hidden Content Discoverable

Hidden content is useful only if users can predict where to find it. Use
consistent grouping, descriptive headings, and recognizable disclosure
affordances. Avoid scattering important settings across unrelated menus
because each one individually looked cleaner there.

``` html
<section aria-labelledby="sharing-heading">
  <h2 id="sharing-heading">Sharing</h2>
  <details>
    <summary>Link and access settings</summary>
    <label><input type="checkbox" name="allowComments"> Allow comments</label>
    <label><input type="checkbox" name="allowDownload"> Allow downloads</label>
  </details>
</section>
```

``` css
section h2 { font-size: 1.2rem; }
details summary { padding-block: .65rem; }
details label { display: block; margin-block: .6rem; }
```

**Naive/Wrong:** Hide frequently used actions inside an unlabeled
overflow menu because the toolbar looks cleaner.

**Correct:** Group related controls under predictable headings and keep
frequent actions easy to discover.

**Gotcha:** If users repeatedly open a section to perform a common task,
the hierarchy may be wrong. Re-evaluate what should be visible by
default.

### 6. Progressive Disclosure in Forms

Long forms can be split into meaningful stages or reveal conditional
fields only when they apply. This reduces the initial cognitive load,
but the user must understand how many stages exist and what information
will be needed. Preserve values when moving backward and avoid
surprising jumps.

``` html
<label for="account-type">Account type</label>
<select id="account-type">
  <option value="individual">Individual</option>
  <option value="team">Team</option>
</select>

<div id="team-fields" hidden>
  <label for="team-name">Team name</label>
  <input id="team-name" name="teamName">
</div>
```

``` js
const accountType = document.querySelector("#account-type");
const teamFields = document.querySelector("#team-fields");

accountType.addEventListener("change", () => {
  teamFields.hidden = accountType.value !== "team";
});
```

**Naive/Wrong:** Reveal extra fields without indicating why they
appeared or whether they are required.

**Correct:** Make the condition understandable, preserve relevant input,
and update validation based on the active path.

**Gotcha:** Hidden required fields can block submission if validation
rules are not updated. Ensure inactive conditional fields are not
incorrectly required.

### 7. Use Accordions for Related Content, Not Everything

Accordions can reduce the visible height of pages with several related
sections, such as FAQs or settings categories. They are not a universal
solution for all content. If people need to compare several pieces of
information simultaneously, collapsing them can make the task harder.

``` html
<section class="faq">
  <details>
    <summary>Can I change the project URL later?</summary>
    <p>Yes. Changing it may affect existing links, so review redirects before publishing.</p>
  </details>
  <details>
    <summary>Can I keep a project private?</summary>
    <p>Yes. Choose private visibility in the publishing settings.</p>
  </details>
</section>
```

``` css
.faq details { padding: 1rem 0; border-bottom: 1px solid #424254; }
.faq summary { font-weight: 650; cursor: pointer; }
.faq p { max-width: 65ch; line-height: 1.65; }
```

**Naive/Wrong:** Collapse a comparison table into accordions even though
users need to compare options side by side.

**Correct:** Use accordions for independent, related sections whose
details are not always needed together.

**Gotcha:** Search engines and assistive technologies may handle hidden
content differently depending on implementation. Ensure the content
remains accessible and useful when expanded.

### 8. Reveal Advanced Controls Without Hiding Consequences

Advanced settings should be deferred when they are optional, but
consequences that affect privacy, cost, deletion, or sharing must be
clear before the user commits. A "More options" panel is not a reason to
conceal a meaningful risk.

``` html
<label for="visibility">Who can see this project?</label>
<select id="visibility" name="visibility">
  <option value="private">Only me</option>
  <option value="unlisted">Anyone with the link</option>
  <option value="public">Everyone</option>
</select>
<p id="visibility-help">Public projects may appear on your profile and in search.</p>
```

``` css
#visibility-help { max-width: 55ch; color: #c6c6d5; font-size: .9rem; }
```

**Naive/Wrong:** Put public-sharing implications in a hidden advanced
section while defaulting to public.

**Correct:** Keep important consequences adjacent to the decision, even
if secondary configuration remains collapsed.

**Gotcha:** Disclosure is not a substitute for informed consent.
High-impact choices may require explicit confirmation.

### 9. Choose Between Inline Expansion, Popover, Drawer, and Dialog

The container should match the size and urgency of the revealed
information. Inline expansion works for short details; a popover suits
brief contextual controls; a drawer supports a larger side task while
retaining page context; a dialog is appropriate when the user must focus
on a bounded decision. Avoid using a modal for every small detail.

``` html
<button type="button" aria-expanded="false" aria-controls="advanced-panel">
  Advanced options
</button>
<section id="advanced-panel" hidden>
  <h3>Advanced options</h3>
  <p>Configure metadata and publishing preferences.</p>
</section>
```

``` css
#advanced-panel {
  margin-top: 1rem;
  padding: 1rem;
  border: 1px solid #4a4a60;
  border-radius: .8rem;
}
```

**Naive/Wrong:** Open a blocking dialog to show one sentence of
explanatory copy.

**Correct:** Use the lightest-weight container that preserves
comprehension, task context, and accessibility.

**Gotcha:** Popovers and drawers need dismissal behavior, focus handling
where appropriate, and positioning that works near viewport edges.

### 10. Keep Disclosure State Predictable

Users should be able to tell which sections are open and how to close
them. The trigger label, icon, expanded state, and panel visibility must
agree. If a user opens a panel and then navigates away, decide whether
the state should reset or persist based on task continuity.

``` html
<button type="button" aria-expanded="false" aria-controls="details-panel" id="details-toggle">
  Show technical details
</button>
<div id="details-panel" hidden>
  <p>Rendering mode: WebGL. Texture quality: high.</p>
</div>
```

``` js
const trigger = document.querySelector("#details-toggle");
const panel = document.querySelector("#details-panel");

trigger.addEventListener("click", () => {
  const open = trigger.getAttribute("aria-expanded") === "true";
  trigger.setAttribute("aria-expanded", String(!open));
  panel.hidden = open;
  trigger.textContent = open ? "Show technical details" : "Hide technical details";
});
```

**Naive/Wrong:** Update the chevron icon but forget to change the panel
visibility or expanded state.

**Correct:** Drive all disclosure cues from one state and test open,
close, and repeated toggling.

**Gotcha:** If the trigger text changes, keep it meaningful and stable
enough that users can understand the action. Do not leave stale
`aria-expanded` values.

### 11. Respect Keyboard and Assistive Technology

A disclosure is not complete if it can only be operated by a pointer.
Use buttons for custom toggles, preserve keyboard focus, and expose
state using `aria-expanded`. Ensure hidden content is actually removed
from the accessibility tree when collapsed, rather than only made
transparent or moved off-screen.

``` html
<button type="button" aria-expanded="false" aria-controls="notes-panel" id="notes-trigger">
  Show notes
</button>
<div id="notes-panel" hidden>
  <p>Additional context for this project.</p>
</div>
```

``` css
#notes-trigger:focus-visible {
  outline: 3px solid #b4a8ff;
  outline-offset: 3px;
}
```

**Naive/Wrong:** Make a heading clickable with a pointer handler and no
keyboard semantics.

**Correct:** Use a button as the trigger and keep visibility and
accessibility state synchronized.

**Gotcha:** `visibility: hidden` and the `hidden` attribute affect
layout and accessibility differently from opacity alone. Do not leave
visually invisible controls focusable.

### 12. Integrate Disclosure with Real Product State

In production, disclosure may be tied to selected filters, permissions,
form state, or server data. Ensure that revealing a panel does not
accidentally reset values, duplicate requests, or create inconsistent
validation. State should be predictable and scoped to the correct
component.

``` js
const editorState = {
  advancedOpen: false,
  slug: "",
  description: ""
};

function setAdvancedOpen(open) {
  editorState.advancedOpen = open;
  renderAdvancedPanel(editorState);
}
```

``` html
<button id="advanced-trigger" type="button" aria-expanded="false" aria-controls="advanced-fields">
  Advanced settings
</button>
<div id="advanced-fields" hidden>
  <label for="slug">URL slug</label>
  <input id="slug">
</div>
```

**Naive/Wrong:** Recreate the panel contents every time it opens, losing
input and resetting validation.

**Correct:** Keep form state separate from visibility state and render
the panel from a stable source of truth.

**Gotcha:** Hiding a panel does not necessarily mean its values should
be discarded. Define whether collapsed values remain part of the
submitted form.

## Named Patterns

### Pattern 1: Native Details Disclosure

**What it does:** Uses browser-native disclosure behavior to reveal a
small block of supplementary content.

**When to use it:** FAQs, advanced settings, supporting explanations,
and optional metadata.

``` html
<details>
  <summary>Show technical details</summary>
  <p>Rendering uses a responsive canvas with reduced-motion fallbacks.</p>
</details>
```

Nuance: choose native disclosure when its default interaction is
sufficient; add custom behavior only for a real requirement.

### Pattern 2: Conditional Form Fields

**What it does:** Reveals fields that apply only to a selected option.

**When to use it:** Account type, shipping method, billing options, and
project configuration.

``` js
const type = document.querySelector("#account-type");
const company = document.querySelector("#company-fields");

type.addEventListener("change", () => {
  company.hidden = type.value !== "business";
});
```

Nuance: update required rules and preserve values deliberately when
users switch options.

### Pattern 3: Expandable Metric

**What it does:** Shows a headline metric first and reveals its
breakdown on demand.

**When to use it:** Dashboards, analytics cards, and compact summary
views.

``` html
<button aria-expanded="false" aria-controls="metric-detail">View breakdown</button>
<div id="metric-detail" hidden>Organic: 730; Referral: 318; Paid: 200.</div>
```

Nuance: if comparing multiple breakdowns is the task, a visible table
may be more efficient than repeated expansion.

### Pattern 4: Advanced Settings Group

**What it does:** Collects low-frequency configuration into a clearly
labeled section.

**When to use it:** Editors, publishing flows, search settings, and
preference screens.

``` html
<details>
  <summary>Advanced publishing settings</summary>
  <label for="canonical">Canonical URL</label>
  <input id="canonical">
</details>
```

Nuance: do not hide consequential decisions such as privacy, payment,
deletion, or public visibility.

### Pattern 5: Progressive Form Steps

**What it does:** Divides a long task into meaningful stages while
showing the user where they are in the flow.

**When to use it:** Multi-step onboarding, application forms, and
complex setup.

``` html
<p id="step-status">Step 2 of 4: Project details</p>
<progress aria-labelledby="step-status" value="2" max="4">2 of 4</progress>
```

Nuance: preserve entered values when moving backward and make the total
path understandable.

### Pattern 6: Contextual Side Panel

**What it does:** Reveals substantial related controls in a side panel
while preserving the main task's context.

**When to use it:** Design editors, map filters, property inspectors,
and dashboards.

``` html
<button type="button" aria-controls="inspector" aria-expanded="false">Open inspector</button>
<aside id="inspector" hidden>
  <h2>Selected layer</h2>
  <p>Adjust size, opacity, and alignment.</p>
</aside>
```

Nuance: a production drawer needs a clear close control, responsive
placement, and appropriate focus management.

## Common Mistakes

  -----------------------------------------------------------------------
  Mistake                 Why It Happens          Fix
  ----------------------- ----------------------- -----------------------
  Hiding essential        Visual simplicity is    Keep high-frequency and
  controls                prioritized over task   high-impact controls
                          completion              visible

  Vague trigger label     The trigger is treated  Name the content or
                          as decoration           action that will be
                                                  revealed

  Stale expanded state    Visibility and ARIA     Drive both from the
                          state are updated       same state value
                          separately              

  Clickable heading with  A custom handler is     Use a button or native
  no semantics            faster to prototype     disclosure element

  Overusing accordions    Collapsing content is   Keep
                          mistaken for reducing   comparison-critical
                          complexity              information visible
                                                  together

  Important consequences  "Advanced" becomes a    Place privacy, cost,
  are hidden              dumping ground          and destructive
                                                  consequences near the
                                                  decision

  Conditional fields      Validation is not       Update required rules
  remain required         updated when fields     and validate only
                          hide                    active fields

  Hidden content loses    Panel contents are      Preserve form state
  input                   recreated on each open  independently of
                                                  visibility

  Too many layers of      Controls are moved away Keep frequent actions
  menus                   to reduce clutter       one predictable step
                                                  away

  Popover used for large  Small overlay is chosen Use a drawer or
  workflows               for visual compactness  dedicated page for
                                                  substantial tasks

  Invisible controls      Opacity is used to hide Use proper hidden-state
  remain focusable        the panel               behavior and test focus
                                                  order

  Disclosure trigger has  The design omits        Expose state with text,
  no state cue            expanded/collapsed      icon, and
                          feedback                `aria-expanded`

  User cannot return to   Panel location is not   Keep triggers in
  collapsed content       stable or labeled       predictable groups and
                                                  positions

  Fake progress is used   Percentages look        Show actual steps or
  for multi-step flow     polished                measurable progress

  Every user sees         Expert and novice needs Set sensible defaults
  advanced details by     are not separated       and reveal advanced
  default                                         options on demand

  Responsive layout hides Breakpoint rules remove Keep the trigger
  disclosure trigger      the control             visible and test narrow
                                                  screens

  No keyboard operation   Pointer interaction was Use semantic triggers
                          tested only with a      and test keyboard
                          mouse                   activation

  Hiding is confused with State behavior is not   Decide whether
  deleting                defined                 collapsed values
                                                  persist and document
                                                  the behavior
  -----------------------------------------------------------------------

## Mental Models

1.  **Reveal, do not conceal:** Progressive disclosure should reduce
    immediate complexity without making useful features hard to find.
2.  **The relevance test:** Keep information visible when it is
    essential to the current decision, frequent, or consequential.
3.  **The predictability contract:** A trigger should make clear what
    will appear and how to close it.
4.  **State is unified:** Visual visibility, trigger text, icons, and
    accessibility attributes must agree.
5.  **Context is a resource:** Keep related details near the task when
    the information is small enough to understand inline.
6.  **Consequence outranks clutter:** Privacy, cost, deletion, and other
    high-impact details should not be hidden merely to simplify the
    screen.
7.  **Defaults reduce decisions:** Good defaults help users move forward
    while remaining safe and reversible.
8.  **Recognition beats memory:** A consistent label and location are
    easier to find than an unexplained icon in an arbitrary menu.
9.  **Disclosure is not deletion:** Collapsing content should not
    silently erase the user's work.
10. **Use the lightest sufficient container:** Inline expansion,
    popover, drawer, and dialog have different costs; match the
    container to the task.

## Quick Reference

  -----------------------------------------------------------------------
  Situation               Pattern                 Key implementation
                                                  detail
  ----------------------- ----------------------- -----------------------
  FAQ or short            Native details          Use `<details>` and
  explanation             disclosure              `<summary>`

  Optional metadata       Advanced settings group Keep consequential
                                                  settings visible

  Field depends on        Conditional form fields Update validation for
  selection                                       active fields

  Dashboard summary       Expandable metric       Preserve context and
                                                  comparison needs

  Long setup flow         Progressive form steps  Show real step count
                                                  and preserve input

  Many related editor     Contextual side panel   Provide close behavior
  controls                                        and responsive
                                                  placement

  Custom disclosure       Button with controlled  Synchronize
  trigger                 panel                   `aria-expanded` and
                                                  visibility

  Keyboard navigation     Semantic control and    Do not rely on pointer
                          focus style             handlers

  Public sharing choice   Inline consequence      Do not bury risk in
                          explanation             advanced options

  High-frequency control  Keep visible            Avoid repeated
                                                  navigation into nested
                                                  menus

  Hidden input panel      Stable state model      Preserve or
                                                  intentionally discard
                                                  values

  Small viewport          Responsive disclosure   Keep the trigger and
                                                  its label discoverable
  -----------------------------------------------------------------------

## Build Challenge: Simplify a Crowded Project Editor

Build a responsive editor for a portfolio project. The initial view
should expose the essential title, cover image, and publishing action
while allowing users to reveal optional metadata, technical details, and
sharing settings.

### Requirements

1.  Identify which fields are essential to create a project and keep
    them visible.
2.  Group optional metadata under a descriptive "Advanced project
    details" disclosure.
3.  Use a semantic button or native `<details>` element for every custom
    disclosure.
4.  Keep the disclosure trigger label understandable without relying on
    an icon alone.
5.  Synchronize expanded state with `aria-expanded` when using custom
    controls.
6.  Preserve values when panels are collapsed and reopened.
7.  Make the public/private visibility decision and its consequences
    easy to understand.
8.  Include conditional fields that appear only for a selected project
    type.
9.  Ensure hidden conditional fields do not block form submission
    incorrectly.
10. Keep the most frequently used actions visible at desktop and mobile
    sizes.
11. Add visible keyboard focus styles and test the full editor without a
    mouse.
12. Use a side panel rather than a tiny popover if advanced controls
    become too substantial.
13. Ensure disclosure panels do not obscure the primary save/publish
    action on narrow screens.
14. Include a realistic failure state where saving fails but entered
    values remain.
15. Document which information is hidden, why it is safe to defer, and
    how users can find it.

### Failure scenarios to test

-   A user cannot find the custom URL field because the disclosure label
    says only "More."
-   A hidden required field blocks the form after the user changes
    project type.
-   A user collapses a panel and loses entered metadata.
-   A public visibility setting is selected without an explanation of
    its consequences.
-   A keyboard user activates a disclosure but cannot tell whether it
    opened.
-   A mobile layout pushes the save button below a long panel without
    preserving a clear task flow.
-   A custom disclosure shows the open icon while the panel remains
    hidden.
-   A user needs to compare two options but must open and close separate
    accordions repeatedly.

### Definition of Done / Success Criteria

-   [ ] The initial view contains the fields needed for the primary
    task.
-   [ ] Optional content is grouped under meaningful and predictable
    labels.
-   [ ] All disclosure triggers work by keyboard and pointer.
-   [ ] Expanded state and visible content remain synchronized.
-   [ ] Hidden fields do not create incorrect validation failures.
-   [ ] Collapsing a panel does not unexpectedly discard entered values.
-   [ ] Consequential settings remain visible at the decision point.
-   [ ] The editor remains understandable at desktop, tablet, and mobile
    widths.
-   [ ] Focus indicators remain visible and the tab order is logical.
-   [ ] The design uses the lightest appropriate disclosure container.
-   [ ] Save errors preserve the user's work and provide a recovery
    path.
-   [ ] Usability testing confirms that users can locate advanced
    options without guessing.

## Final Review Checklist

Before shipping, ask: Which information is essential for the current
task? Which options are genuinely infrequent or optional? Can users
predict what a disclosure trigger reveals? Is the trigger's state
accurate? Will users retain their place and entered values? Are privacy,
cost, deletion, and publishing consequences visible when they matter?
Can keyboard and assistive-technology users operate the controls? Does
the pattern still work at narrow widths? Would a visible table or direct
control be easier than another layer of disclosure?

Progressive disclosure should make the interface easier to understand,
not merely shorter. Hide only what can safely wait, label every doorway
clearly, and keep users in control of their task.
