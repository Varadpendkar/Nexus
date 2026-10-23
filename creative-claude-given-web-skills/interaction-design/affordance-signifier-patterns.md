# SKILL: affordance-signifier-patterns

**Layer:** 28 --- Interaction Design

**Goal:** Design interfaces whose controls communicate what they do, how
they can be used, and what will happen when people interact with them.

## Why This Matters (Senior Perspective)

Affordances and signifiers are foundational to interaction design
because users do not arrive with a complete mental model of an
interface. They infer behavior from visual appearance, placement,
wording, and feedback. A control that looks clickable but does nothing
creates distrust; a useful action hidden behind an unexplained icon
creates hesitation; a drag interaction with no visible handle is
effectively undiscoverable. These failures are often mistaken for user
error when the real problem is that the interface failed to communicate
its rules.

A beginner often focuses on making a control visually attractive and
assumes that people will understand it. A senior designer or engineer
treats every interactive element as a small contract: the interface
signals an available action, the user performs it, and the system
responds in a way that confirms the result. The contract must hold
across mouse, keyboard, touch, assistive technology, loading states,
errors, and responsive layouts. Visual affordances alone are not enough;
semantic HTML, focus styles, accessible names, and predictable state
transitions make the same intent available to more people.

This skill is especially important for creative websites, portfolios,
product interfaces, and freelance work. A dramatic visual treatment can
accidentally obscure navigation or make decorative elements look
interactive. The goal is not to make every control look like a default
browser button. The goal is to make hierarchy and behavior legible while
preserving the art direction. Strong affordance design gives visual
experimentation a reliable interaction foundation: visitors can explore
confidently, understand the next step, and recover when an action does
not work as expected.

## Core Concepts

### 1. Affordance, Signifier, and Feedback

An **affordance** is an action an environment makes possible. A
**signifier** is the cue that communicates where or how to perform that
action. **Feedback** communicates what happened after the action. These
concepts are related but not interchangeable: a card may technically be
clickable, but without a link-like treatment or clear label, its
clickability may not be obvious.

``` html
<a class="project-link" href="/work/orbit">
  <span class="project-link__title">Orbit identity</span>
  <span class="project-link__hint">View case study →</span>
</a>
```

``` css
.project-link {
  display: block;
  padding: 1.25rem;
  border: 1px solid #343444;
  border-radius: 1rem;
  color: inherit;
  text-decoration: none;
  transition: border-color 180ms ease, transform 180ms ease;
}
.project-link:hover {
  border-color: #9a8cff;
  transform: translateY(-2px);
}
.project-link:focus-visible {
  outline: 3px solid #b9b0ff;
  outline-offset: 4px;
}
```

The link's semantic element establishes navigation behavior; its label
explains the destination; its hover and focus treatments signal
interactivity. Hover is supplementary, not the only signal.

**Naive/Wrong:** Make a `div` clickable and rely on a cursor change to
teach the behavior.

**Correct:** Use the correct interactive element and give it a visible
label or established visual treatment.

**Gotcha:** A visual affordance does not automatically make an element
keyboard accessible. Semantics and focus behavior still matter.

### 2. Match the Element to the User's Intent

Choose controls by the outcome the user expects. Use a link to navigate,
a button to perform an action, a checkbox to toggle an independent
option, a radio group to select one option from a set, and a switch for
an immediate on/off setting. The browser's native behavior is part of
the interaction design.

``` html
<nav aria-label="Primary">
  <a href="/services">Services</a>
  <a href="/work">Work</a>
</nav>

<button type="button" id="save-button">Save draft</button>
```

``` js
const saveButton = document.querySelector("#save-button");

saveButton.addEventListener("click", () => {
  saveDraft();
});
```

**Naive/Wrong:** Use `<a href="#">` for every clickable element because
links are easy to style.

**Correct:** Use anchors for destinations and buttons for actions. This
preserves expected keyboard and browser behavior.

**Gotcha:** A button inside a form submits by default unless its type is
set. Set `type="button"` for non-submit actions.

### 3. Make Clickability Discoverable

Controls should look interactive in a way consistent with the
interface's visual language. Common cues include underlines for text
links, button-like surfaces for primary actions, recognizable
iconography, borders around input fields, and clear hover/focus states.
Consistency lets users learn a pattern once and reuse that knowledge.

``` html
<a class="text-link" href="/pricing">Explore pricing</a>
```

``` css
.text-link {
  color: #b8adff;
  text-decoration: underline;
  text-underline-offset: 0.22em;
  text-decoration-thickness: 0.08em;
}
.text-link:hover {
  color: #fff;
}
```

**Naive/Wrong:** Remove every underline and use the same color for links
and body text without another cue.

**Correct:** Preserve an underline or provide another reliable,
consistent distinction.

**Gotcha:** Do not rely on color alone to distinguish an action,
especially when surrounding text uses a similar hue.

### 4. Establish a Clear Action Hierarchy

A screen may contain primary, secondary, and tertiary actions. Their
visual weight should reflect importance, not simply the order in which
they were implemented. A primary action should be easy to locate;
secondary actions should remain available without competing; destructive
actions should be distinguishable without being accidentally prominent.

``` html
<div class="actions">
  <button class="button button--primary" type="submit">Publish project</button>
  <button class="button button--secondary" type="button">Save draft</button>
  <button class="button button--quiet" type="button">Cancel</button>
</div>
```

``` css
.actions { display: flex; flex-wrap: wrap; gap: .75rem; }
.button { min-height: 2.75rem; padding: .7rem 1rem; border-radius: .7rem; }
.button--primary { background: #7866ff; color: white; border: 1px solid transparent; }
.button--secondary { background: transparent; color: white; border: 1px solid #656578; }
.button--quiet { background: transparent; color: #c4c4d2; border: 1px solid transparent; }
```

**Naive/Wrong:** Style every button with the same bright fill, making
the page feel like a row of equally urgent choices.

**Correct:** Reserve the strongest visual emphasis for the most
important action in the current context.

**Gotcha:** On mobile, wrapping can change the apparent order of
actions. Check the sequence at narrow widths.

### 5. Make Labels Describe Outcomes

Good action labels tell users what will happen. "Continue" can be
appropriate in a clearly staged flow, but "Continue to payment" is more
informative when the next step matters. Avoid vague labels such as
"Click here," "Submit" when a more specific verb is available, or
icon-only controls with no accessible name.

``` html
<button type="button" aria-label="Close project preview" class="icon-button">
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
</button>
```

``` css
.icon-button {
  inline-size: 2.75rem;
  block-size: 2.75rem;
  display: inline-grid;
  place-items: center;
  border-radius: 50%;
}
```

**Naive/Wrong:** Use an unlabeled "×" glyph and assume everyone
understands whether it closes a dialog, removes an item, or dismisses a
notice.

**Correct:** Provide an accessible name and, where needed, visible
context that explains the effect.

**Gotcha:** `aria-label` is useful for icon-only controls, but visible
text is usually clearer when the control's purpose is not universally
understood.

### 6. Design Hover, Focus, Active, and Disabled States

Each state communicates a different thing. Hover indicates a pointer is
over a target; focus identifies the current keyboard or programmatic
target; active indicates a press or activation; disabled communicates
that the action is unavailable. These states should be distinguishable
and consistent.

``` css
.button {
  transition: background-color 160ms ease, transform 160ms ease;
}
.button:hover { background-color: #8d7fff; }
.button:focus-visible { outline: 3px solid #d5d0ff; outline-offset: 3px; }
.button:active { transform: translateY(1px); }
.button:disabled { opacity: .5; cursor: not-allowed; }
```

**Naive/Wrong:** Remove the browser outline and implement no
replacement.

**Correct:** Style `:focus-visible` so keyboard users can track their
position.

**Gotcha:** Disabled controls may be skipped by keyboard navigation. If
users need to understand why an action is unavailable, explain the
missing requirement nearby.

### 7. Make Touch Targets and Hit Areas Forgiving

Small icons can be visually compact while retaining a generous
interactive hit area. Touch interfaces need enough space for fingers;
desktop interfaces also benefit from targets that are easy to select.
Increase the clickable region rather than requiring pixel-perfect
accuracy.

``` html
<button class="toolbar-icon" type="button" aria-label="Open settings">
  <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/></svg>
</button>
```

``` css
.toolbar-icon {
  min-inline-size: 44px;
  min-block-size: 44px;
  display: inline-grid;
  place-items: center;
  padding: 10px;
  border: 0;
  background: transparent;
  border-radius: 12px;
}
```

**Naive/Wrong:** Make the icon itself the only clickable area because
the visual glyph is 16 pixels wide.

**Correct:** Give the button a comfortably sized hit area and preserve
spacing between adjacent controls.

**Gotcha:** Enlarging the target must not cause overlapping hit areas
that make neighboring actions ambiguous.

### 8. Communicate Drag and Drop

Drag-and-drop is often undiscoverable when no handle, movement cue, or
alternative is provided. Make draggable items recognizable, provide a
clear target, and support a non-drag alternative when the operation
matters. Keyboard users should not be forced to perform a pointer-only
gesture.

``` html
<li class="sortable-item">
  <button class="drag-handle" type="button" aria-label="Move Quarterly report">
    ⠿
  </button>
  <span>Quarterly report</span>
  <button type="button">Move to…</button>
</li>
```

``` css
.drag-handle { cursor: grab; touch-action: none; min-width: 44px; min-height: 44px; }
.drag-handle:active { cursor: grabbing; }
.sortable-item { display: flex; align-items: center; gap: .75rem; }
```

**Naive/Wrong:** Assume a user will discover dragging by trying to move
an ordinary-looking card.

**Correct:** Show a handle or movement cue and provide a menu or
button-based alternative.

**Gotcha:** The `cursor: grab` style is only a pointer hint; it does not
implement drag behavior or make it accessible.

### 9. Make Inputs Look Editable and Explain Constraints

Inputs should be visually distinct from static text. Labels, hints,
required indicators, and validation messages help people understand what
is expected before they submit. Do not rely on placeholder text as the
only label because it disappears when the user types.

``` html
<label for="project-name">Project name</label>
<input id="project-name" name="projectName" required
       aria-describedby="project-name-hint">
<p id="project-name-hint">Use 3–60 characters.</p>
```

``` css
input {
  inline-size: 100%;
  min-height: 2.75rem;
  padding: .75rem;
  border: 1px solid #77778a;
  border-radius: .6rem;
  background: #15151f;
  color: white;
}
input:focus-visible { outline: 3px solid #a79bff; outline-offset: 2px; }
```

**Naive/Wrong:** Put the label in the placeholder and leave the field
unexplained after input begins.

**Correct:** Associate a persistent `<label>` with the field and connect
relevant help text.

**Gotcha:** If the field has a format requirement, explain it before an
error occurs whenever possible.

### 10. Use Motion as a Signifier, Not a Distraction

Motion can communicate relationships: a panel expanding from a button, a
card lifting on hover, or a menu sliding from its trigger. Motion should
reinforce the action and preserve a clear relationship between cause and
effect. Avoid animations that make controls feel delayed or move targets
away from the pointer.

``` css
.card {
  transition: transform 180ms ease, box-shadow 180ms ease;
}
.card:hover { transform: translateY(-3px); }
@media (prefers-reduced-motion: reduce) {
  .card { transition: none; }
  .card:hover { transform: none; }
}
```

**Naive/Wrong:** Add elaborate movement to every clickable element
regardless of purpose or user settings.

**Correct:** Use short, restrained motion that reinforces the control's
state and honor reduced-motion preferences.

**Gotcha:** Motion must not be the only cue that an action is available;
it is absent before hover and may be reduced or disabled.

### 11. Keep Affordances Consistent Across Responsive Layouts

A control can become ambiguous when its presentation changes at a
breakpoint. A desktop hover label may disappear on touch; a sidebar
action may move into an overflow menu; a three-column card grid may
collapse into a single column. Preserve the action's meaning and
discoverability as the layout changes.

``` css
.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}
@media (max-width: 800px) {
  .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 520px) {
  .project-grid { grid-template-columns: 1fr; }
}
```

**Naive/Wrong:** Hide the only label at small widths because it does not
fit the desktop composition.

**Correct:** Keep labels visible, shorten them carefully, or provide a
clearly named alternative control.

**Gotcha:** Never make hover the only way to reveal essential
instructions on touch devices.

### 12. Integrate Signifiers with State and Real Behavior

A control's appearance must reflect its actual state. A "Saved"
indicator should only appear after a successful save; a disabled button
should be disabled in behavior, not merely faded; a selected tab should
expose its selected state semantically. Visual state and application
state must not drift apart.

``` html
<button id="favorite" type="button" aria-pressed="false">
  Add to favorites
</button>
<p id="favorite-status" aria-live="polite"></p>
```

``` js
const favorite = document.querySelector("#favorite");
const status = document.querySelector("#favorite-status");

favorite.addEventListener("click", () => {
  const selected = favorite.getAttribute("aria-pressed") === "true";
  favorite.setAttribute("aria-pressed", String(!selected));
  favorite.textContent = selected ? "Add to favorites" : "Remove from favorites";
  status.textContent = selected ? "Removed from favorites." : "Added to favorites.";
});
```

**Naive/Wrong:** Change a button's color on click without updating its
state or communicating the result.

**Correct:** Connect visual styling, semantic state, and the underlying
action to one source of truth.

**Gotcha:** This simple example changes local state only. A production
favorite action must also handle persistence, errors, and possible
server-state conflicts.

## Named Patterns

### Pattern 1: The Recognizable Action Surface

**What it does:** Uses a consistent surface, border, contrast, and label
to distinguish an action from surrounding content.

**When to use it:** Primary calls to action, form submission, card
actions, and high-value next steps.

``` css
.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  min-height: 44px;
  padding: .75rem 1rem;
  border-radius: .75rem;
  border: 1px solid transparent;
  background: #7866ff;
  color: #fff;
  font-weight: 650;
}
.action:hover { background: #8b7cff; }
.action:focus-visible { outline: 3px solid #cfc8ff; outline-offset: 3px; }
```

Nuance: keep the pattern visually consistent, but vary emphasis
according to hierarchy. Not every action should use the primary
treatment.

### Pattern 2: The Text-Link Signal

**What it does:** Makes navigation distinguishable from body copy
through a stable link treatment.

**When to use it:** Inline navigation, supporting information, legal
text, and content-heavy pages.

``` css
.content a {
  color: #b9adff;
  text-decoration: underline;
  text-underline-offset: .2em;
}
.content a:hover { color: white; }
```

Nuance: if the design removes underlines, provide another persistent cue
and verify contrast and discoverability.

### Pattern 3: The Icon-Plus-Label Control

**What it does:** Combines a familiar icon with text to improve
recognition and reduce ambiguity.

**When to use it:** Toolbars, editing controls, navigation items, and
actions with multiple possible interpretations.

``` html
<button type="button" class="tool-button">
  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
  <span>Open menu</span>
</button>
```

Nuance: the icon should support the label rather than replace it. If the
UI must be icon-only, provide an accessible name and a tooltip where
useful.

### Pattern 4: The State-Revealing Control

**What it does:** Changes its label, selected state, or visual treatment
to show the current state and available next action.

**When to use it:** Favorites, toggles, play/pause controls, expanded
sections, and selection tools.

``` css
[aria-pressed="true"] {
  background: #30285e;
  border-color: #a99bff;
}
```

Nuance: keep the label's meaning aligned with the state. For toggle
buttons, "Mute" often describes the action to take, while `aria-pressed`
describes whether the toggle is currently active.

### Pattern 5: The Visible Drag Handle

**What it does:** Signals that an item can be reordered and identifies
the intended grab area.

**When to use it:** Sortable lists, kanban boards, layer panels, and
editor timelines.

``` css
.drag-handle {
  cursor: grab;
  border-radius: .4rem;
  color: #bdbdce;
}
.drag-handle:hover { background: #292938; color: #fff; }
.drag-handle:active { cursor: grabbing; }
```

Nuance: provide a keyboard-accessible move action or reorder controls.
The handle's visual style alone does not create an accessible drag
operation.

### Pattern 6: The Constraint-Explaining Field

**What it does:** Places a persistent label and short helper text near
an input to communicate the expected value.

**When to use it:** Forms with character limits, file requirements,
formatting rules, or important validation constraints.

``` html
<label for="slug">Project URL slug</label>
<input id="slug" name="slug" aria-describedby="slug-help">
<p id="slug-help">Lowercase letters and hyphens; no spaces.</p>
```

Nuance: helper text should be concise and actionable. Validation errors
should identify the problem and explain how to fix it.

## Common Mistakes

  -----------------------------------------------------------------------
  Mistake                 Why It Happens          Fix
  ----------------------- ----------------------- -----------------------
  Clickable `div` with no Styling is treated as   Use a button or anchor
  semantics               behavior                appropriate to the
                                                  action

  Link styled exactly     Minimalism is           Add an underline or
  like body copy          prioritized over        another persistent cue
                          discoverability         

  Hover-only instructions Desktop pointer         Provide visible labels
                          behavior is assumed to  and touch-compatible
                          be universal            alternatives

  No focus indicator      Browser outline is      Add a clear
                          removed for aesthetics  `:focus-visible` style

  Icon-only action        The icon seems          Add visible text or an
  without a name          self-explanatory to its accessible name
                          creator                 

  Every action has        Components are designed Define primary,
  primary styling         in isolation            secondary, and quiet
                                                  action tiers

  Placeholder used as the The form looks visually Add a persistent,
  only label              compact                 programmatically
                                                  associated label

  Tiny hit area           The visual glyph is     Increase the button's
                          mistaken for the target minimum dimensions and
                                                  padding

  Dragging is the only    Pointer interaction is  Add a menu or
  move method             the default mental      keyboard-operable move
                          model                   controls

  Disabled action has no  Disabled styling is     Explain the missing
  explanation             treated as sufficient   requirement next to the
                                                  control

  Decorative card looks   Hover and elevation are Reserve interactive
  clickable               applied                 styling for actual
                          indiscriminately        interactive surfaces

  State changes only by   Visual styling is used  Add text, icon, and
  color                   as the sole signal      semantic state where
                                                  appropriate

  Motion is the only      Animation is mistaken   Add a static cue and
  affordance              for discoverability     honor reduced-motion
                                                  settings

  Button submits          Native form defaults    Set `type="button"` or
  unexpectedly            are overlooked          `type="submit"`
                                                  explicitly

  Responsive layout hides Desktop composition     Retain labels or expose
  action labels           drives the design       a clearly named
                                                  alternative

  Success styling appears UI feedback is          Distinguish pending,
  before success          optimistic without      success, and failure
                          recovery                states
  -----------------------------------------------------------------------

## Mental Models

1.  **The interaction contract:** A control promises an outcome. Its
    semantics, appearance, and behavior must agree.
2.  **The three-part loop:** Signifier tells users what is possible;
    action expresses intent; feedback confirms what happened.
3.  **Recognition beats recall:** Prefer visible, understandable options
    over hidden gestures users must remember.
4.  **The semantic foundation:** Native elements provide keyboard,
    focus, and assistive-technology behavior that custom styling cannot
    replace by itself.
5.  **State is a source of truth:** The visual appearance should be
    derived from the real interaction state, not managed as an unrelated
    decoration.
6.  **Consistency compounds:** Repeated visual and behavioral patterns
    reduce the amount users must relearn.
7.  **Forgiving targets:** Users should not need perfect motor precision
    to activate a control.
8.  **Progressive clarity:** Show enough information to make the next
    action understandable without crowding the interface.
9.  **Motion is supporting evidence:** Animation can reinforce a cue,
    but it should not be the only way to discover behavior.
10. **Accessibility is interaction quality:** Keyboard operation, names,
    focus, contrast, and alternatives make the interface usable by more
    people.

## Quick Reference

  -----------------------------------------------------------------------
  Situation               Preferred signifier     Implementation note
  ----------------------- ----------------------- -----------------------
  Navigate to another     Link styling and        Use `<a href="…">`
  page                    meaningful destination  
                          text                    

  Perform an action       Button surface and      Use `<button>`
                          action verb             

  Toggle a state          Stable toggle treatment Consider `aria-pressed`
                          and state cue           

  Choose one option       Radio controls or a     Group related choices
                          clearly labeled select  

  Enter text              Persistent label, field Associate label and
                          border, helper text     description

  Drag to reorder         Visible handle and      Include a non-drag
                          clear target feedback   alternative

  Keyboard focus          High-contrast focus     Use `:focus-visible`
                          ring                    

  Disabled action         Disabled treatment plus Disable behavior, not
                          explanation if needed   just appearance

  Expand content          Disclosure icon and     Keep `aria-expanded`
                          changing expanded state synchronized

  Touch action            Generous target and     Avoid hover-only cues
                          spacing                 

  Save or publish         Outcome-specific label  Reflect actual
                          and pending/result      operation state
                          feedback                

  Destructive action      Explicit destructive    Confirm only when risk
                          wording and appropriate warrants it
                          emphasis                
  -----------------------------------------------------------------------

## Build Challenge: Design an Affordance-Complete Project Card

Build a responsive project-card interface for a creative portfolio.
Users must be able to open a case study, favorite a project, and access
a project-specific menu. The card should look polished without relying
on hover alone.

### Requirements

1.  Create a semantic card structure with a meaningful project title and
    summary.
2.  Use an anchor for navigation to the case study and a button for the
    favorite action.
3.  Give each icon-only control an accessible name, or pair it with
    visible text.
4.  Define primary and secondary action styles that match the hierarchy
    of the card.
5.  Add hover, focus-visible, active, selected, and disabled states
    where relevant.
6.  Ensure the favorite button communicates its current state both
    visually and semantically.
7.  Keep all essential labels and actions discoverable on touch screens
    without hover.
8.  Make interactive hit areas comfortably large and prevent neighboring
    targets from overlapping.
9.  Support keyboard navigation in a logical order and preserve a
    visible focus indicator.
10. Use restrained motion and respect `prefers-reduced-motion`.
11. At narrow widths, preserve the meaning and visibility of the card's
    actions.
12. Include a state in which an action is unavailable and explain why.
13. Verify that decorative elements do not falsely imply clickability.
14. Test the card with a keyboard, a touch viewport, and a screen
    reader's accessible-name inspection.
15. Document which element is the main navigation target and why the
    remaining actions are separate controls.

### Failure scenarios to test

-   A visitor tries to navigate using only the keyboard and cannot see
    which control has focus.
-   A mobile visitor cannot discover the favorite action because it only
    appears on hover.
-   The favorite icon changes color but does not expose its selected
    state.
-   A click on the menu accidentally navigates to the case study because
    the entire card is one oversized link.
-   Reduced-motion preferences are ignored and the card continues to
    animate.
-   A disabled action looks active and gives no explanation.

### Definition of Done / Success Criteria

-   [ ] Links navigate and buttons perform actions; semantics match the
    intent.
-   [ ] Every interactive control has an understandable visible or
    accessible name.
-   [ ] Focus indicators are visible and not clipped by card overflow.
-   [ ] Essential behavior is discoverable on touch and keyboard, not
    only with a mouse.
-   [ ] Visual states accurately reflect the current application state.
-   [ ] The layout remains clear at desktop, tablet, and mobile widths.
-   [ ] Motion is restrained and reduced-motion preferences are
    respected.
-   [ ] The favorite action exposes its state to assistive technology.
-   [ ] No decorative element misleadingly appears to be an active
    control.
-   [ ] Failure scenarios have been manually tested and corrected.

## Final Review Checklist

Before shipping, inspect each control and ask: What can the user do
here? What tells them that action is available? Is the control's
semantic element correct? Does its label describe the outcome? Can it be
found and activated by keyboard and touch? Is its state visible? Does
feedback confirm the result? Is there an alternative for gestures that
are difficult to discover or perform? Does the design remain
understandable when hover, animation, or color cues are unavailable?

The standard is not that every control must look like a default browser
control. The standard is that visual originality must not make behavior
mysterious. Use signifiers deliberately, keep behavior consistent, and
ensure the interface communicates its interaction contract across input
methods and states.
