# SKILL: design-to-code-handoff

**Layer:** 43 — UI/UX Design

**Goal:** Turn approved UI designs into implementation-ready specifications that help developers reproduce layout, typography, tokens, assets, states, responsive behavior, and interaction intent accurately—while making uncertainty visible instead of hiding it in screenshots.

---

## Why This Matters (Senior Perspective)

A design-to-code handoff is not the moment when a designer sends a Figma link and assumes the work is finished. It is a transfer of intent, constraints, and decisions from one working environment into another. The designer is responsible for making the intended experience understandable; the developer is responsible for implementing it within the actual application architecture and verifying runtime behavior. The strongest handoffs make that collaboration explicit.

A screenshot communicates what one screen looks like at one moment and one viewport. It does not reliably communicate the spacing system, how the layout responds to narrower widths, what happens when a form field is invalid, whether an icon is decorative or meaningful, how a menu behaves on keyboard input, or what content should happen when a list is empty. If those decisions remain implicit, developers must guess. Different developers may make different guesses, producing inconsistent pages even when they use the same screenshot.

The cost is not limited to visual mismatch. Ambiguous handoffs cause rework, accessibility defects, broken responsive layouts, incorrect loading and error behavior, duplicated tokens, and late-stage arguments about what the design “really meant.” A developer may reproduce the Figma frame perfectly at 1440 pixels but discover that a longer translated heading overflows at 390 pixels. A designer may specify a hover color but forget keyboard focus. A team may use a decorative image as an interactive button because the interaction contract was never stated.

Senior handoff practice does not attempt to prescribe every line of code. It separates the design decisions that must remain consistent from implementation choices that engineers can make safely. It identifies what is fixed, what is flexible, which behaviors are required, and which details need discussion. It provides enough context to implement the experience without turning the design file into a rigid implementation script.

This skill is useful for product teams, agency projects, freelance delivery, design-system work, and portfolio projects. A polished design is only part of a credible deliverable; a clear handoff shows that the designer understands constraints, edge cases, accessibility, and the practical route from concept to functioning interface. It also improves the designer’s ability to review implementation constructively: feedback can point to a defined requirement rather than a vague feeling that something looks wrong.

**Senior perspective:** optimize for shared understanding and fewer implementation surprises. A good handoff makes critical decisions explicit, gives developers room to solve technical details, and provides a repeatable way to validate the result.

---

## Core Concepts

### 1. Define the scope and source of truth

Start by identifying exactly what is being handed off: pages, components, flows, breakpoints, states, assets, and known exclusions. Name the approved Figma file or page and clarify whether a frame is final, exploratory, or deprecated. Without this boundary, developers may implement an abandoned variation or combine inconsistent states from different frames.

```text
Handoff scope
Product area: Account settings
Included: Profile form, save confirmation, validation states, responsive layout
Excluded: Account deletion flow, billing screens
Source of truth: Approved Figma page and linked component library
Open questions: Server-side validation copy; final empty-state illustration
```

Make ownership explicit. If a screen contains a placeholder asset or unresolved copy, label it rather than allowing the placeholder to become accidental production content.

**Gotcha:** “Use the latest Figma” is not a reliable source-of-truth rule when the file contains explorations, experiments, and older frames. Mark approved frames and identify the version or section developers should follow.

### 2. Communicate intent, not only pixels

A design handoff should explain the purpose behind important constraints. “The primary action remains visible at the bottom of the mobile form” is more useful than a screenshot alone because it communicates a behavioral requirement. “The content column has a readable maximum width” is more durable than a single measured width.

```text
Requirement:
The form content must remain readable on wide screens.
Design intent:
Keep the form centered and constrain its maximum width.
Implementation flexibility:
Use the project's layout utilities or CSS grid/flexbox, provided the result follows the approved behavior.
```

Separate outcomes that must be preserved from techniques that are open to engineering choice. This avoids prescribing an implementation unnecessarily while still protecting the experience.

### 3. Specify responsive behavior

A single desktop frame does not define a responsive system. Provide representative viewport sizes and explain how layout changes between them. Identify what stacks, hides, wraps, scrolls, or reorders. If the design depends on a breakpoint, describe the intended behavior on both sides of it.

```text
Responsive behavior
Wide: sidebar and main content sit side by side.
Medium: sidebar narrows; content keeps its minimum readable width.
Small: sidebar becomes a compact navigation control; form fields stack.
At every width: actions remain reachable, text does not overlap, and content order remains logical.
```

Avoid specifying a breakpoint solely because a device has a familiar name. Choose breakpoints where the content stops working well. Developers should verify actual intermediate widths rather than testing only the exact Figma frame dimensions.

**Gotcha:** responsive behavior is not simply “desktop becomes mobile.” Tablet and intermediate widths often expose the most fragile combinations of navigation, columns, and long content.

### 4. Document layout rules and sizing

Communicate the relationships that create the layout: maximum widths, flexible regions, fixed-size controls, alignment, gaps, and overflow behavior. Distinguish between a fixed dimension and a value that should grow with content.

```text
Main content
- Width: fill available space, capped at a readable maximum
- Horizontal alignment: centered in the page region
- Internal layout: vertical stack
- Section gap: semantic spacing token
- Small screens: reduce outer padding; preserve field width
- Overflow: no horizontal page scrolling for ordinary content
```

Use Auto Layout in Figma to make these relationships visible. Annotate exceptions that are difficult to infer from the file. A developer should not need to measure every gap manually if the design system already defines a spacing scale.

### 5. Use design tokens as shared vocabulary

Tokens connect design values to implementation values. Use semantic names for color, spacing, typography, radius, elevation, and motion where the project has a token system. The handoff should identify whether a value is a token or a one-off exception.

```text
Color / Text / Primary       -> var(--color-text-primary)
Color / Surface / Raised     -> var(--color-surface-raised)
Space / 3                    -> var(--space-3)
Radius / Control             -> var(--radius-control)
Type / Body / Medium         -> typography.bodyMedium
```

These names are illustrative; use the project's real token names and mapping. Do not invent a token name in the handoff and imply that it already exists. If a design needs a new token, flag it as a proposed addition.

**Gotcha:** a Figma variable and a CSS custom property do not automatically map to each other. Agree on naming, export, and ownership rather than assuming synchronization.

### 6. Specify typography and content behavior

Typography includes more than font size. Include font family or role, weight, line height, letter spacing when meaningful, text color, and content behavior. State whether text wraps, truncates, or remains on one line. Mention approved font files or existing typography tokens.

```text
Page title
- Role: Display / Page title
- Weight: Semibold
- Line height: token-defined
- Width: constrained by content column
- Wrapping: allowed on small screens
- Overflow: never overlap the adjacent action
```

Use real or realistic copy whenever possible. Placeholder text can hide line-length and localization problems. If copy is not final, label it and provide the expected content length or behavior so the implementation is not accidentally optimized around temporary wording.

### 7. Define asset delivery and ownership

Identify which assets are production-ready, where they live, how they should be exported, and whether they need different resolutions or formats. Distinguish raster images, SVG icons, illustrations, logos, and fonts. State whether an image is decorative or conveys information.

```text
Asset specification
Name: account-security-illustration
Format: SVG preferred if the artwork remains vector-safe
Use: decorative beside explanatory content
Accessible treatment: empty alt text if implemented as decorative
Source: approved Assets page
Do not: recreate from a screenshot or use the Figma canvas export as a substitute for the source asset
```

For meaningful images, provide the intended alternative text or the information the image conveys. For decorative imagery, state that it should not add redundant screen-reader output. Verify licensing and asset provenance before shipping.

### 8. Specify interactions and state transitions

A visual state is not the same as an interaction specification. Describe the trigger, resulting state, feedback, and recovery behavior. For a save button, specify what happens during submission, success, and failure—not only the default and hover appearance.

```text
Save profile interaction
1. User activates Save.
2. Validate required fields.
3. If invalid, focus or otherwise clearly identify the first invalid field and show a specific message.
4. If valid, show a pending state and prevent duplicate submission.
5. On success, show confirmation and preserve the updated values.
6. On failure, show a recoverable error and retain the user's entered data.
```

Figma prototypes can communicate intended flows, but implementation must still handle real network delays, duplicate requests, and errors. Include the states that are visible to users and the conditions that trigger them.

### 9. Include keyboard and focus behavior

Document keyboard expectations for interactive elements. A developer should know how users reach and activate a control without a pointer, where focus moves after a dialog opens or closes, and whether a menu supports arrow-key navigation. Include focus styling for components, not only hover styling.

```css
.action:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

This is an implementation illustration, not a claim that the project's token already exists. Use semantic HTML such as `<button>` for actions and `<a>` for navigation. A clickable `<div>` is not a substitute for a button unless the necessary semantics and keyboard behavior are implemented deliberately.

**Gotcha:** focus order should follow a meaningful reading and interaction order. Do not rearrange visual elements in a way that creates a confusing keyboard sequence without a clear reason and implementation plan.

### 10. Specify validation and error recovery

Forms need a state model that covers more than a red border. Identify validation timing, error copy, field association, submission behavior, and recovery. Some errors appear while typing, some after blur, and some only after submission; the design should make the intended approach clear.

```text
Email field
- Initial: label and optional hint
- On submit with missing value: required message
- On blur with malformed value: format message, if that is the agreed validation policy
- On correction: clear the error when the value becomes valid
- On server rejection: show the server-provided or mapped message without erasing the value
```

Do not claim that client-side validation replaces server-side validation. Handoff should describe the user experience; engineering must still enforce data rules at the trusted boundary.

### 11. Cover loading, empty, success, and failure states

Every asynchronous or data-driven screen needs states beyond the ideal populated view. Specify what users see while data is loading, when no results exist, when a request fails, and when an action succeeds. Empty and error states should explain what happened and what the user can do next.

```text
Results panel states
Loading: preserve panel geometry and show an appropriate progress treatment.
Empty: explain that no results match and offer a useful next step where possible.
Success: render the result list and its count.
Failure: show a recoverable message and retry action when retry is safe.
```

Avoid fake loading animations that imply progress when none can be measured. Do not use the same empty state for “no data exists” and “the filter returned no matches” if the next action differs.

### 12. Define content and data constraints

Developers need to know how the interface handles real-world data. Specify minimum and maximum lengths where they matter, optional fields, date and currency formats, long names, missing images, and empty values. These details are especially important for dashboards, tables, cards, and account profiles.

```text
Customer row
- Name: may be long; wraps to two lines before truncation is considered
- Email: may overflow; preserve the full value through an accessible strategy
- Avatar: use initials fallback when no image is available
- Status: label and visual treatment both communicate the state
- Missing optional metadata: omit the region without leaving a blank gap
```

Do not invent product rules if they are not known. Mark unresolved decisions as questions and identify who should decide them.

### 13. Make accessibility requirements explicit

Include accessibility requirements in the handoff checklist. Identify semantic roles, accessible names, labels, focus behavior, status announcements, reduced-motion behavior, contrast requirements, and text scaling considerations as relevant. The visual design file cannot prove all of these requirements have been met.

```text
Accessibility notes
- Interactive controls have clear accessible names.
- Form fields have programmatically associated labels.
- Error text is associated with the relevant field.
- Status is not conveyed by color alone.
- Focus is visible and not obscured.
- Motion respects the user's reduced-motion preference.
- Text remains usable when enlarged.
```

Use semantic HTML in the implementation and test with keyboard navigation and assistive technology where appropriate. Check color combinations in actual theme values rather than relying on the appearance of a Figma swatch.

### 14. Explain motion and reduced-motion behavior

If animation is part of the design, document its purpose, trigger, duration or timing token, easing, and whether it affects layout. Distinguish decorative motion from motion needed to understand state changes. Include a reduced-motion alternative when movement could be distracting or uncomfortable.

```css
.panel-enter {
  transition: opacity 180ms ease, transform 180ms ease;
}

@media (prefers-reduced-motion: reduce) {
  .panel-enter {
    transition: none;
    transform: none;
  }
}
```

The exact values should come from the product’s motion system. Do not use animation to hide a delay or make a control feel interactive when it is not.

### 15. Communicate responsive assets and image behavior

For images, clarify whether the asset is cropped, contained, stretched, or used as a background. Explain aspect ratio behavior and focal-point priorities. A portrait image in a card may need a consistent crop, while a product screenshot may need to remain fully visible.

```text
Image card
- Container ratio: consistent across cards
- Fit: cover
- Focal point: keep the subject visible near the upper third
- Small viewport: preserve the crop intent, not the desktop pixel dimensions
- Missing image: use the approved fallback, not a broken-image icon
```

Avoid stretching images to force them into a frame. Check actual source dimensions and compression needs. If art direction changes by viewport, provide separate assets or explicit cropping rules.

### 16. Document navigation, routing, and overlays

Navigation, menus, drawers, modals, and popovers have behavior that screenshots rarely communicate. Specify opening triggers, dismissal rules, focus movement, layering, scroll behavior, and what happens on small screens.

```text
Confirmation dialog
- Opens after the user selects Delete.
- Initial focus goes to the safest sensible action or follows the product's dialog policy.
- Escape closes only when dismissal is safe and permitted.
- Background content is not interactive while modal.
- Closing returns focus to the control that opened the dialog.
- On narrow screens, dialog content remains within the viewport and actions remain reachable.
```

The implementation must use appropriate dialog semantics and focus management. Do not assume a Figma overlay automatically produces accessible runtime behavior.

### 17. Clarify component reuse and exceptions

Point developers to approved shared components and tokens. If a screen intentionally deviates, explain why. Without this information, developers may create near-duplicate controls or “correct” an intentional exception to match the wrong component.

```text
Component reuse
- Use the shared Button component for standard actions.
- Use the shared Text field for form controls.
- Exception: the compact table action uses the icon-button size variant.
- Do not create a new button family solely to match one page's local spacing.
```

A handoff should distinguish approved reuse from accidental visual similarity. If no shared component exists, identify whether a new component is intended or whether a local composition is acceptable.

### 18. Provide measurements without encouraging pixel worship

Measurements are useful for key dimensions, but implementation should use the system’s layout rules and tokens where possible. A screenshot can make a margin look like 23 pixels when the actual design uses a 24-pixel spacing token. Record the token or relationship rather than overemphasizing accidental pixel readings.

```text
Prefer:
Section gap = Space / 6 token
Content max width = 72rem, subject to project convention
Button height = Medium control token

Avoid:
Every observed gap is copied as a unique hard-coded number
```

If a dimension is truly fixed, state that explicitly. If it is fluid or content-driven, communicate the rule. The goal is fidelity to the design system, not blind transcription of a rendered frame.

### 19. Use annotations that answer real questions

Annotations should resolve ambiguity, not restate what is already obvious. Useful notes explain conditions, exceptions, content limits, state transitions, and unresolved questions. Too many annotations can obscure the design and make it harder to identify the important decisions.

```text
Useful annotation:
When the save request fails, preserve the entered form values and show the error above the actions.

Low-value annotation:
This is a blue button with white text.
```

Keep notes close to the relevant frame or component. Use a consistent notation for requirements, assumptions, and open questions so reviewers can distinguish a decision from a proposal.

### 20. Establish a handoff question log

Unresolved details should be visible, owned, and tracked. Do not bury questions in comments or leave developers to infer answers from silence. A question log can include the decision needed, options, owner, priority, and status.

```text
Question: Should the table sort state persist after navigation?
Options: Reset to default / Persist per user session
Owner: Product
Priority: Medium
Status: Open
Implementation impact: Sorting state and URL/session behavior
```

Resolve high-impact questions before implementation reaches the dependent area. If a decision must be deferred, document a temporary assumption and its consequences.

### 21. Use a repeatable handoff checklist

A checklist prevents a handoff from depending on memory. It should cover scope, assets, tokens, layout, interactions, responsive behavior, accessibility, edge cases, and ownership.

```text
Handoff checklist
[ ] Approved frames and source of truth identified
[ ] Desktop, intermediate, and mobile behavior specified
[ ] Tokens and shared components referenced
[ ] Assets and licenses verified
[ ] States and interaction transitions documented
[ ] Error, empty, loading, and success states included
[ ] Keyboard and accessibility requirements stated
[ ] Content constraints and fallbacks described
[ ] Open questions assigned
[ ] Validation plan and reviewer identified
```

Tailor the checklist to the project. A static marketing page may not need the same state coverage as a payment form, but every interactive page still needs clear behavior and responsive intent.

### 22. Review implementation against intent

Implementation review should compare the running product with the agreed design contract. Check at representative viewport sizes, not only the original frame. Separate visual defects from behavior defects and system-level issues so feedback is actionable.

```text
Review categories
Visual: hierarchy, spacing, type, colors, assets
Responsive: wrapping, stacking, overflow, order
Behavior: triggers, state transitions, error recovery
Accessibility: keyboard, focus, names, contrast, motion
System: tokens, shared components, duplicate patterns
```

Use browser DevTools to inspect computed styles, layout boxes, network-loaded assets, console warnings, and responsive behavior. When a mismatch appears, first determine whether the design, implementation, or shared assumption is wrong; do not automatically force the code to match a mistaken annotation.

**Gotcha:** a visual difference may be caused by a missing font, a different browser rendering engine, or an uninitialized token rather than a developer ignoring the design. Diagnose the cause before prescribing a fix.

### 23. Make acceptance criteria observable

A requirement should be testable. “Feels polished” is not enough by itself. Convert subjective goals into observable checks such as “the heading wraps without overlapping the action,” “the dialog can be operated by keyboard,” or “the save error preserves entered values.”

```text
Acceptance criteria
- At 390px viewport width, no page-level horizontal overflow occurs.
- The primary action remains reachable without obscuring form content.
- A failed save shows an actionable message and retains user input.
- Keyboard focus is visible on every interactive control.
- The empty state distinguishes no data from no matching results.
```

Not every aesthetic judgment can be reduced to a numeric rule. Pair measurable checks with a visual review, and record any accepted deviations.

### 24. Account for browser and platform differences

Figma is not a browser rendering engine. Fonts, line-height rounding, native form controls, scrollbar behavior, and rendering differences can change the result. The handoff should identify critical requirements while allowing reasonable implementation adjustments for platform behavior.

```text
Cross-browser review
- Test the supported browser matrix.
- Verify font loading and fallback behavior.
- Check native input and select appearance.
- Inspect sticky or fixed elements during scrolling.
- Verify focus outlines and reduced-motion behavior.
- Confirm that unsupported features have an acceptable fallback.
```

Use the project's actual support policy; do not claim compatibility with every browser by default. Where a visual technique depends on newer CSS, discuss support and fallback with engineering.

### 25. Close the loop after implementation

A handoff is complete only when the design and engineering team have resolved critical questions and verified the delivered experience. Capture deviations, update the source design when decisions change, and feed repeated problems back into the design system.

```text
Closeout
1. Review the implemented page at representative viewports.
2. Confirm interaction and error states.
3. Record accepted deviations and why they exist.
4. Update design annotations or components when the contract changed.
5. Capture reusable lessons for future handoffs.
```

Do not treat every implementation difference as a defect. Some differences are required by platform constraints or accessibility. The important thing is that they are deliberate, understood, and approved.

---

## Relevant Patterns

### Pattern 1: Intent / flexibility / constraint annotation

**What it does:** separates required user outcomes from the details engineers can choose.

**When to use it:** when a design has a layout or behavior that matters but should not dictate a particular framework or implementation technique.

```text
Intent: Keep the form readable on wide screens.
Constraint: Content width stays within the approved maximum.
Flexibility: Use grid, flexbox, or existing layout utilities.
Acceptance: At supported widths, fields remain readable and actions stay reachable.
```

### Pattern 2: Responsive behavior matrix

**What it does:** describes the behavior at several width ranges rather than relying on a single desktop and mobile screenshot.

**When to use it:** for navigation, dashboards, multi-column layouts, forms, and pages with complex content.

```text
Wide: sidebar + main content
Medium: compact sidebar + flexible content
Narrow: stacked content + compact navigation
All widths: logical reading order, no unintended overlap, reachable actions
```

Tie the matrix to content-driven breakpoints and verify intermediate widths.

### Pattern 3: State-transition specification

**What it does:** maps user actions and system outcomes to visible states and recovery behavior.

**When to use it:** for forms, data fetching, uploads, authentication, saving, and destructive actions.

```text
Idle -> Submitting -> Success
                  -> Recoverable error
Invalid input -> Validation message -> Corrected input
```

Include triggers, focus behavior, persistence of entered data, and whether retries are safe.

### Pattern 4: Asset manifest

**What it does:** records the source, format, intended use, fallback, and accessibility treatment for each production asset.

**When to use it:** for brand-heavy pages, image-led landing pages, illustrations, product screenshots, and multi-platform delivery.

```text
Asset: account-security-illustration
Source: approved design asset library
Format: SVG where appropriate
Use: decorative support for explanatory content
Fallback: omit decoration without removing essential content
Accessibility: empty alt if decorative
```

### Pattern 5: Open-question register

**What it does:** prevents unresolved decisions from disappearing into comments or assumptions.

**When to use it:** whenever implementation depends on product, content, analytics, or technical decisions that are not final.

```text
Question | Owner | Priority | Status | Impact
Sort persistence | Product | Medium | Open | Table state behavior
Error wording | Content | High | Open | Validation feedback
```

### Pattern 6: Design QA pass

**What it does:** compares the running interface with the agreed contract across visuals, responsive behavior, interactions, accessibility, and system reuse.

**When to use it:** before release, after a major component change, or when a page has accumulated implementation differences.

```text
QA pass:
Visual -> Responsive -> Interaction -> Accessibility -> Tokens/components
Record each issue with a reproduction step, expected behavior, actual behavior, and severity.
```

### Pattern 7: Handoff readiness gate

**What it does:** prevents ambiguous work from being labeled ready simply because the main screen looks finished.

**When to use it:** before work enters a development sprint or is passed to an external implementation team.

```text
Ready when:
- Approved frames are identified
- Critical states and responsive behavior are defined
- Assets and tokens are available
- Open questions are owned or explicitly accepted
- Acceptance criteria are testable
```

### Pattern 8: Accepted-deviation record

**What it does:** distinguishes intentional implementation differences from defects and keeps design intent synchronized with reality.

**When to use it:** when browser behavior, accessibility, performance, or platform conventions require an approved adjustment.

```text
Deviation: Native select styling differs slightly from Figma.
Reason: Platform usability and native behavior.
Impact: No change to information hierarchy or selection behavior.
Owner: Design + Engineering
Action: Update design note if the difference is permanent.
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Sending only a screenshot | The handoff is treated as a visual delivery | Include the source file, responsive rules, states, tokens, assets, and acceptance criteria |
| Using an ambiguous “latest design” link | Exploration frames and approved work coexist | Mark the approved page and identify the source of truth |
| Assuming desktop defines mobile | Responsive behavior is left implicit | Document stacking, hiding, wrapping, and navigation changes |
| Copying every measured pixel | Measurements are treated as the system | Prefer existing tokens and layout relationships; mark true fixed dimensions |
| Inventing token names | The design spec is written without checking the system | Use actual token names or label proposed tokens as new work |
| Omitting loading and failure states | Only the ideal success path is designed | Include loading, empty, success, validation, and failure behavior |
| Leaving error recovery unspecified | A red field is mistaken for a complete error design | State validation timing, message behavior, focus, and value preservation |
| Documenting hover but not focus | Pointer interaction is the default mental model | Specify keyboard focus and verify `:focus-visible` in implementation |
| Treating a prototype as production behavior | Prototype transitions look convincing | Document runtime conditions, network failure, duplicate action, and focus behavior |
| Ignoring real content lengths | Placeholder copy is short and uniform | Add long strings, missing data, localization, and text-scaling cases |
| Exporting screenshots instead of source assets | Asset ownership is unclear | Provide approved source assets, formats, fallbacks, and provenance |
| Forgetting accessible image treatment | All images are treated as decoration or all as content | Mark each asset meaningful or decorative and define its accessible treatment |
| Giving vague animation guidance | Motion is described as “smooth” | Specify trigger, purpose, timing token, easing, and reduced-motion behavior |
| Ignoring dialog focus management | The overlay is considered only visually | Specify initial focus, dismissal, background interaction, and focus return |
| Over-annotating obvious visuals | Notes are added without a decision test | Annotate conditions, constraints, exceptions, and open questions |
| Hiding unresolved questions in comments | No decision log exists | Track owner, priority, status, options, and implementation impact |
| Reviewing only at Figma frame dimensions | The exact design viewport becomes the only test | Review representative and intermediate widths in the running interface |
| Blaming engineering for every mismatch | The design is assumed infallible | Diagnose fonts, tokens, browser behavior, source assets, and assumptions first |
| Ignoring semantic HTML | Visual layers are assumed to define semantics | Specify buttons, links, labels, headings, and appropriate interactive roles |
| Using color alone for state | Visual distinction substitutes for accessible communication | Pair color with text, iconography, or another clear cue |
| Failing to document content fallbacks | Only complete data is considered | Define missing-image, missing-value, and empty-list behavior |
| Duplicating shared components | The developer cannot identify the approved library | Link to shared components and document legitimate exceptions |
| Making requirements subjective only | Acceptance criteria say “looks good” | Add observable checks and keep a separate visual review |
| Assuming all browsers render identically | Figma is mistaken for a browser | Test the supported browser matrix and specify fallbacks for critical features |
| Treating every deviation as a defect | The handoff is interpreted as pixel law | Record accepted differences and their rationale |
| Failing to update the design after decisions change | Design and implementation drift apart | Update annotations, components, and source-of-truth status during closeout |
| Forgetting asset licensing | Visual assets are copied from convenient sources | Verify usage rights and record approved asset provenance |
| Making no owner responsible for questions | Cross-functional decisions fall between teams | Assign each open question to a role or named project owner |
| Skipping post-implementation review | Handoff is treated as the finish line | Review the running interface and feed lessons back into the system |

---

## Mental Models

1. **Handoff is a contract, not a screenshot** — It transfers intended outcomes, constraints, and states, not just a picture of a screen.
2. **Specify outcomes, leave implementation room** — Preserve product intent while letting engineers choose appropriate technical approaches.
3. **Every visible state has a trigger** — A state design is incomplete until the condition that produces it is understood.
4. **Responsive design is behavior** — Breakpoints describe how content adapts, not merely which device category is in use.
5. **Tokens are shared vocabulary** — They connect visual decisions to implementation without forcing every value to be copied manually.
6. **Open questions are project work** — An unresolved decision should have an owner and a status, not live as an invisible assumption.
7. **Acceptance criteria must be observable** — Teams should be able to tell whether a requirement passed without guessing what “polished” means.
8. **Figma is not the runtime** — Real browser behavior, keyboard interaction, accessibility, and failure recovery require implementation-level verification.
9. **Deviations need reasons** — An intentional difference can be correct, but it should be understood and recorded.
10. **QA closes the loop** — The handoff becomes useful when the implemented product is reviewed and the design system learns from the result.

---

## Quick Reference

| Handoff area | Include | Verify |
|---|---|---|
| Scope | Included screens, exclusions, approved source | Developers can identify the correct frames |
| Layout | Sizing rules, alignment, gaps, overflow | Content adapts without accidental clipping |
| Responsive behavior | Wide, medium, narrow rules | Intermediate widths also work |
| Tokens | Actual semantic token names | No accidental raw-value duplication |
| Typography | Roles, weights, line behavior, copy constraints | Long text and font loading |
| Assets | Source, format, licensing, fallback | Correct asset and accessible treatment |
| Interactions | Trigger, transition, feedback, recovery | Happy path and failure path |
| Forms | Validation timing and error behavior | Values persist and errors are actionable |
| Data states | Loading, empty, success, failure | Each state gives a useful next step |
| Accessibility | Semantics, names, focus, non-color cues | Keyboard and assistive technology checks |
| Motion | Trigger, purpose, timing, reduced-motion option | Motion does not block or confuse use |
| Navigation/overlays | Focus, dismissal, scroll, routing | Keyboard behavior and narrow screens |
| Open questions | Owner, priority, status, impact | Critical decisions are resolved or explicitly accepted |
| Acceptance | Observable criteria and review plan | Actual implementation can be checked |
| Closeout | Accepted deviations and updates | Design and implementation remain aligned |

---

## Build Challenge

Create a complete design-to-code handoff for a responsive account settings page with a profile form, save action, validation feedback, and a confirmation dialog. The objective is to deliver enough information that another designer or developer can implement and review the page without relying on undocumented assumptions.

### Requirements

1. **Identify the source of truth.** Name the approved Figma page and component library, list included screens, and identify excluded flows and placeholder assets.
2. **Write a responsive behavior matrix.** Describe wide, medium, and narrow layouts, including navigation, field stacking, action placement, and overflow rules.
3. **Document layout relationships.** Identify content maximum width, outer padding behavior, section spacing, and which regions are fixed, flexible, or content-driven.
4. **Map design tokens.** List the actual color, spacing, typography, radius, and focus tokens used. Clearly label any proposed token that does not yet exist.
5. **Create an asset manifest.** Record asset source, format, use, fallback, and whether each image is meaningful or decorative.
6. **Specify every relevant state.** Include initial, focused, invalid, submitting, success, and recoverable failure states for the profile form.
7. **Write the save interaction contract.** Define validation timing, duplicate-submission prevention, focus behavior, value preservation, success feedback, and retry behavior.
8. **Document the confirmation dialog.** Define opening trigger, initial focus, dismissal rules, background interaction, focus return, and narrow-screen behavior.
9. **Add accessibility requirements.** Specify semantic HTML, labels, accessible names, visible focus, non-color error cues, reduced-motion behavior, and any needed status announcements.
10. **Define content constraints.** Test long names, long email addresses, missing profile images, translated labels, and enlarged text.
11. **Create observable acceptance criteria.** Include measurable responsive and behavior checks plus a visual review checklist.
12. **Build an open-question register.** Include at least three plausible unresolved decisions, their owners, priorities, status, and implementation impact.
13. **Review a running implementation.** Use browser DevTools to inspect layout, computed styles, font loading, overflow, console warnings, and interactive states.
14. **Record accepted deviations.** Document at least one legitimate difference between the Figma design and browser output, or explicitly state that none were accepted after review.
15. **Complete a closeout report.** List defects fixed, remaining known limitations, approved exceptions, and design-system improvements discovered during implementation.

### Failure and edge conditions

The handoff fails review if it relies only on screenshots, omits narrow-screen behavior, leaves save failure behavior undefined, has no visible focus specification, erases form values after a failed request, or leaves critical open questions without owners. It also fails if the implementation is reviewed only at the exact Figma viewport or if a design deviation is silently accepted without explanation.

### Definition of Done

- The approved design source, scope, exclusions, and assets are unambiguous.
- Layout and responsive behavior are documented across representative width ranges.
- Actual tokens and shared components are referenced accurately, with proposed additions clearly marked.
- Interactive states include triggers, transitions, feedback, and recovery behavior.
- Accessibility requirements cover semantic controls, labels, focus, error communication, and reduced motion where relevant.
- Content stress cases and fallback behavior are documented.
- Open questions have owners, priorities, and statuses.
- Acceptance criteria are observable and have been checked against the running interface.
- Browser review includes responsive behavior and relevant DevTools inspection.
- Accepted deviations and remaining limitations are recorded, and the design source is updated when the implementation contract changes.
