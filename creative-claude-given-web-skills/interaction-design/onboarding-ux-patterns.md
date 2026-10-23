# SKILL: onboarding-ux-patterns

**Layer:** 28 --- Interaction Design

**Goal:** Help new users reach their first meaningful outcome through
clear, contextual, low-friction guidance that builds confidence without
overwhelming them.

## Why This Matters (Senior Perspective)

Onboarding is not a tour of the interface; it is the process of helping
a person understand why a product matters and how to get value from it.
A sequence of tooltips can show where buttons are, but it does not
guarantee that a new user can complete a meaningful task. Effective
onboarding reduces uncertainty, makes the next step obvious, and helps
people experience the product's core benefit as early as possible. When
onboarding is confusing, users may abandon the product before
discovering what it can do.

A beginner often designs onboarding as a fixed series of screens that
everyone must complete. A senior designer starts with the user's goal,
the knowledge they already have, and the smallest useful action that can
produce a real result. The experience is then tailored to context: a new
account may need a short setup checklist, a complex editor may need
progressive hints near relevant controls, and an advanced user may
prefer to skip introductory guidance. Onboarding also needs an exit
path, persistence, accessibility, and a way to resume after
interruption. Guidance that cannot be dismissed or that repeatedly
reappears after completion can turn help into friction.

For creative websites and product experiences, onboarding must balance
personality with clarity. A distinctive animation or narrative can make
the first visit memorable, but it should not delay the user from
understanding the value proposition or performing the main task. The
strongest onboarding is measured by user progress, not by how many tips
were viewed. It helps people create, publish, configure, or complete
something meaningful; it avoids asking for unnecessary information
before value is demonstrated; and it uses product behavior to reveal the
next useful step. Treat onboarding as a product capability that evolves
through evidence, not a one-time welcome modal.

## Core Concepts

### 1. Start with the User's First Meaningful Outcome

The first meaningful outcome is the smallest result that lets a user
experience the product's value. For a design tool, it might be creating
a first canvas; for a portfolio builder, publishing a project card; for
a booking service, finding a suitable appointment. Onboarding should
move toward this outcome instead of explaining every feature.

``` html
<section class="welcome">
  <p class="eyebrow">Welcome to Studio</p>
  <h1>Turn your ideas into a portfolio.</h1>
  <p>Start with one project. You can customize the details later.</p>
  <a class="button" href="/projects/new">Create your first project</a>
</section>
```

``` css
.welcome { max-width: 42rem; margin-inline: auto; padding: clamp(2rem, 7vw, 5rem); }
.welcome h1 { max-width: 14ch; font-size: clamp(2.25rem, 6vw, 4.5rem); line-height: 1.02; }
.eyebrow { color: #a99cff; text-transform: uppercase; letter-spacing: .12em; }
```

The screen explains the product's value and offers one clear first
action. It does not require the user to understand the entire workspace
before starting.

**Naive/Wrong:** Open with a long list of features, settings, and
product terminology.

**Correct:** Identify the smallest meaningful task and make it the
primary next step.

**Gotcha:** A first action that requires too much setup may not feel
like progress. Remove optional decisions until the user has a reason to
care about them.

### 2. Design Onboarding Around User Intent

Not all new users arrive with the same goal. One person may want to
explore, another may need to import existing work, and a third may be
evaluating whether the product fits their team. A small intent choice
can personalize the first experience, but only when the choice changes
what happens next.

``` html
<fieldset>
  <legend>What would you like to do first?</legend>
  <label><input type="radio" name="goal" value="create"> Create something new</label>
  <label><input type="radio" name="goal" value="import"> Bring in existing work</label>
  <label><input type="radio" name="goal" value="explore"> Explore examples</label>
</fieldset>
```

``` js
const goalRoutes = {
  create: "/projects/new",
  import: "/projects/import",
  explore: "/examples"
};

function continueOnboarding(form) {
  const selected = new FormData(form).get("goal");
  if (selected && goalRoutes[selected]) location.assign(goalRoutes[selected]);
}
```

**Naive/Wrong:** Ask new users a long questionnaire whose answers do not
meaningfully affect the experience.

**Correct:** Ask only questions that enable a useful change in the path,
defaults, or guidance.

**Gotcha:** Provide a sensible default or "skip" route when intent is
unclear. Do not turn personalization into a gate that blocks
exploration.

### 3. Reduce Time to Value

Time to value is the time between starting and experiencing a useful
outcome. Reduce unnecessary account fields, configuration choices, and
explanations before the first result. If users can preview a template
before registering, or create a draft before choosing advanced settings,
let them do so where product constraints allow.

``` html
<form class="quick-start">
  <label for="project-title">Name your project</label>
  <input id="project-title" name="title" required placeholder="e.g. Aurora campaign">
  <button type="submit">Create project</button>
  <p>You can add images and details after creation.</p>
</form>
```

``` css
.quick-start { display: grid; gap: .75rem; max-width: 32rem; }
.quick-start input { min-height: 2.75rem; padding: .75rem; }
.quick-start button { justify-self: start; min-height: 2.75rem; }
```

**Naive/Wrong:** Require profile photo, team size, notification
preferences, theme, and billing details before a user can try the core
task.

**Correct:** Ask for information only when it is needed for the next
meaningful step, and defer optional setup.

**Gotcha:** Some information is genuinely required for safety, billing,
or service delivery. Do not remove necessary requirements; explain why
they are needed.

### 4. Use Checklists for Multi-Step Setup

A checklist makes progress visible when users need to complete several
independent setup tasks. It should distinguish required steps from
optional recommendations and provide direct actions from each row. Avoid
showing a checklist for a task that only needs one simple action.

``` html
<section aria-labelledby="setup-title">
  <h2 id="setup-title">Set up your workspace</h2>
  <ol class="setup-list">
    <li><span aria-hidden="true">✓</span> Create your workspace</li>
    <li><span aria-hidden="true">2</span> <a href="/profile">Add your profile details</a></li>
    <li><span aria-hidden="true">3</span> <a href="/projects/new">Create your first project</a></li>
  </ol>
</section>
```

``` css
.setup-list { list-style: none; padding: 0; display: grid; gap: .8rem; }
.setup-list li { display: flex; align-items: center; gap: .75rem; }
.setup-list li > span { inline-size: 1.8rem; block-size: 1.8rem; display: grid; place-items: center; border: 1px solid #777; border-radius: 50%; }
```

**Naive/Wrong:** Show a checklist with no indication of what each step
accomplishes or where to complete it.

**Correct:** Make each item actionable, show completion accurately, and
distinguish essential from optional steps.

**Gotcha:** A checklist that remains at 80% forever can make a product
feel unfinished. Let users dismiss optional tasks or mark the setup
complete when the core outcome is achieved.

### 5. Use Contextual Guidance Instead of a Feature Dump

Contextual guidance appears near the feature it explains and when it
becomes relevant. A hint about exporting is more useful when the user
has created something than during the first minute of onboarding. This
timing reduces cognitive load and connects instruction to action.

``` html
<section class="canvas-panel">
  <h2>Your canvas</h2>
  <p class="context-hint">Tip: add a frame to organize related elements.</p>
  <button type="button">Add frame</button>
</section>
```

``` css
.context-hint {
  max-width: 38rem;
  padding: .75rem 1rem;
  border-inline-start: 3px solid #9b8cff;
  background: #211f32;
  color: #e3e0ff;
}
```

**Naive/Wrong:** Show every tip in a mandatory slideshow before users
can interact with the product.

**Correct:** Introduce help at the point of need and keep the relevant
action immediately available.

**Gotcha:** Contextual hints should not obscure the control they explain
or repeatedly appear after a user has dismissed them.

### 6. Make Progress and Completion Honest

Progress indicators help users understand how much remains, but only if
they represent real progress. A step-based setup can show completed,
current, and remaining stages. A long-running operation may need a
progress bar or an indeterminate state. Do not use a percentage simply
because it looks reassuring.

``` html
<div class="progress-copy">
  <p id="progress-label">Step 2 of 4: Add your first project</p>
  <progress aria-labelledby="progress-label" value="2" max="4">2 of 4</progress>
</div>
```

``` css
progress { display: block; width: 100%; height: .6rem; accent-color: #8876ff; }
.progress-copy { max-width: 30rem; }
```

**Naive/Wrong:** Show "90% complete" while several required steps remain
and no meaningful progress can be calculated.

**Correct:** Use a step count for discrete onboarding stages and
measurable progress only when the underlying work supports it.

**Gotcha:** If the user can skip a stage, update the progress model so
it does not suggest that skipped work is still required.

### 7. Offer Skip, Back, and Resume

Onboarding should respect different levels of familiarity and
interrupted sessions. Let users skip optional tours, go back when
choices are reversible, and resume unfinished setup without starting
from the beginning. These controls should be clearly labeled and should
not look like accidental escape hatches.

``` html
<nav class="onboarding-controls" aria-label="Onboarding navigation">
  <button type="button" id="back">Back</button>
  <button type="button" id="skip">Skip tour</button>
  <button type="button" id="next">Next</button>
</nav>
```

``` js
const tourState = { step: 0, completed: false };

function skipTour() {
  tourState.completed = true;
  localStorage.setItem("onboarding-complete", "true");
  renderWorkspace();
}
```

**Naive/Wrong:** Force everyone through every tooltip and provide no way
to leave.

**Correct:** Allow users to skip nonessential education and return to
help later.

**Gotcha:** Do not mark a required safety, consent, or billing step as
completed merely because the user skipped a tour. Separate optional
education from required tasks.

### 8. Use Defaults to Reduce Decision Burden

Good defaults help people make progress without forcing them to
understand every setting. Defaults should be sensible, reversible, and
appropriate for the most likely context. If a default has important
consequences, explain it instead of silently choosing it.

``` html
<label for="visibility">Project visibility</label>
<select id="visibility" name="visibility">
  <option value="private" selected>Private — only you can see it</option>
  <option value="unlisted">Unlisted — anyone with the link</option>
  <option value="public">Public — visible on your profile</option>
</select>
```

``` css
select, input, button { font: inherit; }
select { min-height: 2.75rem; padding: .65rem .8rem; border-radius: .6rem; }
```

**Naive/Wrong:** Choose a public visibility setting by default because
it reduces onboarding steps.

**Correct:** Use a safe default and explain the implications of changing
it.

**Gotcha:** "Most common" is not always "best." Consider privacy,
reversibility, and the cost of an incorrect choice.

### 9. Make Empty States Teach the First Action

An empty state is often the first real product screen a user sees. It
should explain what belongs here, why it matters, and how to create the
first item. Decorative illustrations can support the message but should
not replace it.

``` html
<section class="empty-state" aria-labelledby="empty-title">
  <div aria-hidden="true" class="empty-state__art">✦</div>
  <h2 id="empty-title">Your project library is empty</h2>
  <p>Create a project to collect images, notes, and published work in one place.</p>
  <a href="/projects/new">Create a project</a>
</section>
```

``` css
.empty-state { max-width: 34rem; margin: 4rem auto; text-align: center; }
.empty-state__art { font-size: 3rem; color: #a99cff; }
.empty-state p { color: #bdbdce; line-height: 1.6; }
```

**Naive/Wrong:** Show a blank panel with only an icon and expect users
to infer the next step.

**Correct:** Describe the empty state and give one primary action.

**Gotcha:** Returning users may have an empty state because content
failed to load. Distinguish a genuine empty collection from an error
state.

### 10. Design Tours That Teach, Not Interrupt

A product tour is useful when spatial relationships matter or a user
needs a brief overview of a complex workspace. Keep steps short, focus
each step on one concept, and let users exit. Do not cover the entire
screen with a sequence of tooltips just because the product has many
features.

``` html
<section class="tour-card" aria-labelledby="tour-heading">
  <p>2 of 3</p>
  <h2 id="tour-heading">Organize with collections</h2>
  <p>Group related projects so they are easier to find later.</p>
  <button type="button">Next tip</button>
  <button type="button">End tour</button>
</section>
```

``` css
.tour-card {
  max-width: 22rem;
  padding: 1.25rem;
  border: 1px solid #47465b;
  border-radius: 1rem;
  background: #171722;
  box-shadow: 0 1rem 3rem #0005;
}
```

**Naive/Wrong:** Make every tour step mandatory and explain multiple
features in one tooltip.

**Correct:** Teach one idea per step and offer an obvious exit.

**Gotcha:** If the interface changes after the tour is authored, the
highlighted target may disappear or move. Test the tour across
responsive breakpoints and realistic account states.

### 11. Make Onboarding Accessible

Onboarding often uses dialogs, overlays, step navigation, and dynamic
messages. These can disrupt keyboard focus or screen-reader context if
not designed carefully. Use semantic headings, buttons, clear focus
order, and an accessible way to close optional overlays. When a modal is
open, manage focus appropriately and return focus to the trigger when it
closes.

``` html
<dialog id="welcome-dialog" aria-labelledby="welcome-title">
  <h2 id="welcome-title">Welcome to the workspace</h2>
  <p>Create a project to get started. You can explore the tour later.</p>
  <button id="start-project" type="button">Create project</button>
  <button id="close-welcome" type="button">Close</button>
</dialog>
```

``` js
const dialog = document.querySelector("#welcome-dialog");
dialog.showModal();

document.querySelector("#close-welcome").addEventListener("click", () => {
  dialog.close();
});
```

**Naive/Wrong:** Place a visual overlay on top of the page without
managing focus or providing a keyboard-accessible close route.

**Correct:** Use appropriate dialog behavior, keep focus inside a modal
while open, and return focus when it closes.

**Gotcha:** Native dialog behavior helps but does not remove the need to
test labels, focus order, escape behavior, and the surrounding
experience.

### 12. Persist Progress Without Becoming Intrusive

Onboarding state should survive navigation and, where appropriate, a
later session. Persist only what is needed: completed steps, dismissed
tips, or the current stage. Avoid repeatedly showing a welcome modal
after the user has dismissed it. Provide a way to find guidance again
through help or settings.

``` js
const onboardingKey = "studio-onboarding-v1";

function loadOnboarding() {
  try {
    return JSON.parse(localStorage.getItem(onboardingKey)) ?? {
      completedSteps: [],
      dismissedTips: []
    };
  } catch {
    return { completedSteps: [], dismissedTips: [] };
  }
}

function saveOnboarding(state) {
  localStorage.setItem(onboardingKey, JSON.stringify(state));
}
```

**Naive/Wrong:** Store onboarding completion only in a component
variable so it resets on every page load.

**Correct:** Persist the relevant state using a deliberate versioned
schema and handle invalid or unavailable storage safely.

**Gotcha:** Local storage is browser-specific and may be cleared. If
onboarding must follow an account across devices, persist suitable state
on the server.

## Named Patterns

### Pattern 1: One Clear First Action

**What it does:** Presents one primary task that leads to the product's
first meaningful outcome.

**When to use it:** New account landing pages, empty dashboards, and
first-run experiences.

``` html
<section>
  <h1>Make your first collection</h1>
  <p>Collect related projects in one place.</p>
  <a class="primary-action" href="/collections/new">Create collection</a>
</section>
```

Nuance: keep secondary exploration available, but do not give every
option equal emphasis. The primary action should be both understandable
and reversible when possible.

### Pattern 2: Setup Checklist

**What it does:** Shows a finite set of setup tasks and communicates
which ones are complete.

**When to use it:** Products where users need several independent steps
before reaching full value.

``` html
<ol>
  <li><span aria-hidden="true">✓</span> Create workspace</li>
  <li><a href="/profile">Add profile details</a></li>
  <li><a href="/projects/new">Create a project</a></li>
</ol>
```

Nuance: keep checklist items actionable and remove or label optional
tasks so completion does not feel impossible.

### Pattern 3: Contextual Tip

**What it does:** Introduces one relevant capability near the moment a
user can apply it.

**When to use it:** Complex editors, dashboards, creative tools, and
interfaces with discoverable advanced features.

``` html
<aside class="tip">
  <p><strong>Tip:</strong> Use collections to group related projects.</p>
  <button type="button">Got it</button>
</aside>
```

Nuance: persist dismissal when appropriate and do not let the hint cover
the control it describes.

### Pattern 4: Progressive Tour

**What it does:** Guides a user through a small number of related
concepts, one step at a time.

**When to use it:** Workspaces where understanding the spatial layout is
important.

``` html
<div role="group" aria-label="Workspace tour">
  <p>Step 1 of 3</p>
  <h2>Navigation lives here</h2>
  <button type="button">Next</button>
  <button type="button">Skip tour</button>
</div>
```

Nuance: provide back/skip controls and test whether highlighted targets
remain present across device sizes.

### Pattern 5: Intent-Based Routing

**What it does:** Uses one small preference choice to direct a user
toward a relevant first task.

**When to use it:** Products with distinct entry goals such as create,
import, or explore.

``` html
<form action="/start" method="get">
  <label><input type="radio" name="goal" value="create"> Create</label>
  <label><input type="radio" name="goal" value="import"> Import</label>
  <button type="submit">Continue</button>
</form>
```

Nuance: ask only if the answer changes the route or setup. Always
provide a reasonable default or skip path.

### Pattern 6: Resumable Setup

**What it does:** Saves completed steps so users can leave and return
without repeating work.

**When to use it:** Multi-step setup, long profile completion, import
workflows, and complex configuration.

``` js
function markStepComplete(stepId) {
  const steps = new Set(JSON.parse(localStorage.getItem("done-steps") || "[]"));
  steps.add(stepId);
  localStorage.setItem("done-steps", JSON.stringify([...steps]));
}
```

Nuance: version stored state and recover gracefully if it becomes
invalid. Do not store sensitive data casually.

## Common Mistakes

  -----------------------------------------------------------------------
  Mistake                 Why It Happens          Fix
  ----------------------- ----------------------- -----------------------
  Long feature tour       Teams want every        Start with one
  before any task         capability discovered   meaningful outcome and
                                                  defer advanced tips

  Mandatory tour with no  Completion metrics are  Add a visible
  exit                    prioritized over        skip/close path for
                          autonomy                optional guidance

  Asking too many setup   Personalization is      Keep only questions
  questions               mistaken for value      that change the next
                                                  step

  Requiring optional      Completion is confused  Defer optional profile
  profile details         with activation         fields until they
                                                  matter

  No clear first action   Several actions compete Choose one primary task
                          for attention           and demote secondary
                                                  choices

  Empty dashboard with no Empty state is treated  Explain what belongs
  explanation             as missing data only    there and how to add it

  Tips appear too early   Guidance is triggered   Trigger tips when the
                          by page load alone      feature becomes
                                                  relevant

  Tips keep reappearing   Dismissal state is not  Store dismissed-tip
                          persisted               identifiers and respect
                                                  them

  Fake progress           A progress bar is used  Use step counts or real
  percentage              for visual reassurance  measurable progress

  Checklist never reaches Optional tasks are      Separate optional tasks
  completion              presented as required   and allow checklist
                                                  dismissal

  No resume behavior      State exists only in    Persist completed
                          the current component   stages and restore them
                                                  safely

  Tour target is missing  Tour was tested only on Test every step across
  on mobile               desktop                 responsive breakpoints

  Modal traps the user    Focus and close         Manage focus, provide a
                          behavior are overlooked close path, and restore
                                                  focus

  Default exposes private Conversion speed        Use privacy-aware
  content                 overrides user safety   defaults and explain
                                                  visibility

  Onboarding says a task  UI state is not tied to Mark completion only
  is done too early       actual completion       after confirmed success

  First task requires too Form fields were        Ask only for the
  much information        designed around         minimum information
                          internal data needs     needed to begin

  Guidance blocks         The flow assumes every  Make optional education
  exploration             user is inexperienced   discoverable from help

  Empty state hides a     Empty and error states  Distinguish no content
  loading failure         share the same UI       from failed content
                                                  retrieval
  -----------------------------------------------------------------------

## Mental Models

1.  **First value before full education:** Help users achieve something
    useful before teaching every capability.
2.  **Onboarding is a path, not a slideshow:** The experience should
    move the user toward an outcome, not merely expose screens.
3.  **One step, one decision:** Each onboarding moment should ask for a
    small, understandable action.
4.  **Progress must be truthful:** Completion indicators should reflect
    actual completed work.
5.  **Context beats interruption:** Teach a feature when it becomes
    relevant to the task.
6.  **Autonomy builds trust:** Users should be able to skip optional
    guidance and return to it later.
7.  **Defaults are product decisions:** A default can save time, but it
    must be safe and appropriate.
8.  **State must survive interruption:** Long onboarding flows need a
    way to resume without repeated work.
9.  **Empty states are teaching moments:** A blank screen can explain
    the next useful action.
10. **Measure outcomes, not exposure:** Finishing a tour is less
    meaningful than completing the first useful task.

## Quick Reference

  -----------------------------------------------------------------------
  Situation               Recommended pattern     Important detail
  ----------------------- ----------------------- -----------------------
  New user lands in       One clear first action  Make the product value
  workspace                                       concrete

  Several setup tasks are Checklist               Distinguish required
  required                                        and optional tasks

  Advanced feature        Contextual tip          Trigger near the moment
  becomes relevant                                of need

  Workspace layout is     Progressive tour        Keep it short and
  unfamiliar                                      skippable

  Users have different    Intent-based routing    Ask only if the route
  goals                                           changes

  Setup can be            Resumable setup         Persist progress and
  interrupted                                     validate stored state

  No projects exist yet   Helpful empty state     Explain the next action

  User already knows the  Skip or dismiss         Do not force redundant
  product                                         education

  Long process has        Step indicator          Show accurate step
  discrete stages                                 count

  Onboarding uses a modal Accessible dialog       Manage and restore
                          behavior                focus

  Defaults affect privacy Safe default with       Avoid surprising
                          explanation             exposure

  User returns later      Resume checklist        Do not repeat completed
                                                  steps
  -----------------------------------------------------------------------

## Build Challenge: Create a First-Run Experience for a Creative Workspace

Build a first-run onboarding flow for a portfolio-building workspace. A
new user should be able to create a first project quickly, choose an
alternate route if they already have work, and resume optional setup
later.

### Requirements

1.  Present the product's core value in plain language.
2.  Provide one primary first action that creates a meaningful outcome.
3.  Offer an alternate route to import existing work without making it
    compete visually with the primary action.
4.  Ask no more than one intent question before the user begins, and
    only if the answer changes the experience.
5.  Include a setup checklist with direct links to each relevant task.
6.  Distinguish required setup from optional improvements.
7.  Add at least one contextual tip that appears when the related
    feature is first encountered.
8.  Let users dismiss the tip and avoid showing it again after
    dismissal.
9.  Provide an optional tour with next and skip controls.
10. Save progress so a user can leave and resume later.
11. Ensure the empty state tells users what belongs in the workspace and
    how to add it.
12. Use safe defaults for visibility and sharing.
13. Include accurate progress feedback; do not fabricate percentages.
14. Support keyboard navigation and accessible headings, labels, and
    dialog behavior.
15. Keep the experience usable at narrow mobile widths.
16. Test the flow for a returning user who has already completed some
    steps.
17. Include a failure state when project creation fails, preserving
    entered project details.
18. Provide a help route so users can reopen guidance after skipping it.

### Failure scenarios to test

-   A user skips the tour and later cannot find any help.
-   A visitor refreshes the page and loses all onboarding progress.
-   The first project action fails, but the interface still marks it
    complete.
-   A user chooses "import" but is routed to the create screen.
-   A mobile tooltip points to a control that is no longer visible.
-   A user closes the welcome dialog, but keyboard focus disappears
    behind the overlay.
-   A returning user sees the same introductory modal on every visit.
-   A private project is made public by an unexplained default.

### Definition of Done / Success Criteria

-   [ ] The first screen explains the value of the product and provides
    a clear primary action.
-   [ ] A user can reach a meaningful first outcome without completing
    unnecessary profile fields.
-   [ ] Intent choices change the next step and can be skipped when
    appropriate.
-   [ ] Checklist state reflects real task completion.
-   [ ] Optional tips and tours can be dismissed and reopened from a
    help location.
-   [ ] Onboarding progress survives a refresh or interruption where
    persistence is expected.
-   [ ] Failed operations do not falsely mark a step complete.
-   [ ] Defaults are understandable and do not unexpectedly expose user
    content.
-   [ ] Dialogs and controls are operable by keyboard and have clear
    accessible names.
-   [ ] The flow works at desktop and mobile widths.
-   [ ] Empty, loading, and error states are distinguishable.
-   [ ] The experience measures successful first-task completion rather
    than tour completion alone.

## Final Review Checklist

Before shipping onboarding, ask: What outcome should a new user achieve
first? What is the minimum information required to get there? Does every
question change the route or result? Can experienced users skip
introductory guidance? Are the next steps clear? Does each checklist
item link to the task? Can a user resume after interruption? Are empty,
loading, and failure states distinct? Are privacy-sensitive defaults
safe? Does the experience work with keyboard and screen-reader
navigation? Can users find the help again later?

Onboarding succeeds when users understand enough to make progress and
feel confident doing so. Keep guidance purposeful, contextual, and
optional wherever possible. Measure whether people reach value, and
improve the path based on where they hesitate or abandon it.
