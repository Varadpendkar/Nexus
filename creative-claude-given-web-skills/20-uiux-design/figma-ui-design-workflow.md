# SKILL: figma-ui-design-workflow

**Layer:** 43 — UI/UX Design

**Goal:** Build a reliable Figma workflow for translating product requirements into clear, reusable, responsive UI designs with structured files, components, variants, variables, prototyping, accessibility checks, and developer-ready handoff.

---

## Why This Matters (Senior Perspective)

Figma is not just a canvas for arranging rectangles until a screen looks finished. It is a collaborative product-design environment where decisions about structure, components, naming, layout behavior, variables, interaction states, and handoff affect the speed and quality of the entire team. A screen can look excellent in a static frame but be difficult to maintain if layers are unnamed, repeated controls are detached copies, spacing values drift, and developers cannot tell which behavior is intended. The workflow matters because a design file is both a visual artifact and a communication contract.

Beginners often start drawing immediately. They create a large frame, add text, duplicate buttons, and tune each screen independently. This may be fast for a single mockup, but it becomes expensive when a product needs multiple routes, responsive variants, loading and error states, or a change to a shared component. A senior workflow starts by understanding the user goal, defining the information architecture, establishing the file structure, and deciding which decisions should become reusable system rules. It still allows exploration, but it avoids making every screen a separate invention.

A useful Figma workflow balances speed and structure. Too little structure creates duplication and inconsistency; too much abstraction creates a component library that is harder to understand than the product itself. Not every one-off illustration needs a component, and not every tiny variation needs a variant property. The goal is to abstract repeated behavior and meaningful variation, not to turn every layer into a configurable system.

A design file also needs to communicate behavior that a screenshot cannot show. Buttons have hover, focus, pressed, disabled, and loading states. Forms have validation rules. Navigation may change on mobile. Empty states differ from loading states. A modal has focus and dismissal behavior. These details should be represented in components, prototypes, annotations, or supporting documentation so the developer does not have to guess.

The workflow in this skill covers project setup, pages and sections, naming, frames, auto layout, constraints, grids, styles, variables, components, variants, properties, interactive components, prototyping, responsive exploration, accessibility review, versioning, and developer handoff. It also includes a practical file structure and review checklist. The intent is to help designers create files that remain understandable after several iterations, support collaboration, and reduce the gap between the designed interface and the shipped product.

---

## Core Concepts

### 1. Start with the product question, not the frame

Before opening a new design frame, clarify the user, task, context, and success condition. A product brief should explain who the screen is for, what the person is trying to do, what information is needed, and what constraints exist. Without this context, designers tend to begin with a familiar layout pattern and force the content into it.

Translate the brief into a small list of user goals, key content, actions, and edge states. This gives the first wireframe a reason to exist. A good workflow keeps the initial structure flexible until the information hierarchy and task sequence are clear.

```text
Screen: Project overview
User goal: Understand current project health and identify the next action.
Primary information: Status, owner, next milestone, unresolved blockers.
Primary action: Open the milestone details.
Edge states: No milestones, delayed milestone, loading data, access restricted.
```

Use this short statement to evaluate later design choices. If a decorative panel does not support the goal, it may not deserve the space.

### 2. Organize the file around the work

A Figma file should be understandable to someone who did not create it. Use a small number of predictable pages, named sections, and a clear distinction between exploration, reusable system assets, and approved screens. Avoid leaving dozens of frames on one canvas with names such as “Frame 42 copy 3.”

A practical page structure might include an overview, research and flows, wireframes, design system, final screens, prototype, and archive. Adapt the structure to the project's scale rather than copying a large-team workflow into a tiny experiment.

```text
00 — Cover & Overview
01 — Research & Flows
02 — Wireframes
03 — Components & Variables
04 — Final UI
05 — Prototype & States
99 — Archive
```

Keep the most current approved work easy to find. Mark exploratory and deprecated work clearly so developers do not implement an outdated frame by accident.

### 3. Name layers and components by meaning

Layer names should explain what an object is or what role it plays. Meaningful names improve navigation, selection, inspection, and handoff. A frame called `Card / Billing summary` is more useful than `Frame 68`; a component called `Button / Primary` is more useful than `Blue Button`.

Use a consistent naming convention across components, variants, variables, and pages. Names should describe function rather than only appearance, because colors and layouts may change over time.

```text
Button / Primary
Button / Secondary
Field / Text / Default
Field / Text / Error
Navigation / Sidebar / Item
Card / Project Summary
Status / Warning
```

Do not over-name every decorative vector path if the structure is already clear, but do name meaningful containers and reusable components. Naming is part of the design system, not an administrative chore performed at the end.

### 4. Use frames to express layout behavior

Frames provide structure for layout, constraints, clipping, and auto layout. Groups are useful for lightweight visual grouping, but they are not a replacement for a frame when the content needs responsive behavior or reusable layout rules.

Use frames for page sections, cards, buttons, form fields, and other meaningful containers. Set resizing behavior deliberately. A design that relies on manually positioned layers may look correct at one width but break when text changes or the viewport becomes narrow.

```text
Page frame
└── Main content frame
    ├── Page heading frame
    ├── Summary grid frame
    │   ├── Summary card
    │   └── Summary card
    └── Recent activity frame
```

Think in terms of parent-child relationships and layout responsibility. Each container should have a reason to control padding, spacing, alignment, or clipping.

### 5. Use Auto Layout for repeated and content-driven structures

Auto Layout is appropriate when a component's size or spacing should respond to its content. Buttons, navigation items, form rows, badges, cards, lists, and toolbars often benefit from it. It reduces the need to manually reposition objects when labels change or new content appears.

Set direction, gap, padding, alignment, and resizing behavior intentionally. Use hug contents when the frame should fit its children, fill container when it should consume available space, and fixed dimensions only when the design requires them. Avoid using Auto Layout blindly for every decorative composition; some freeform artwork is better managed with constraints or a dedicated frame.

```text
Button / Primary
Auto Layout: Horizontal
Padding: 16 left/right, 10 top/bottom
Gap: 8
Alignment: Center
Width: Hug contents
Height: Hug contents
```

Test with longer labels and larger text. If the button clips or expands unpredictably, inspect its resizing settings rather than adding manual spacing layers.

### 6. Define constraints and responsive behavior

Constraints describe how elements behave when their parent frame changes size. They should reflect intended layout behavior: left-aligned content stays anchored to the left, a full-width control stretches horizontally, and a centered illustration remains centered until a breakpoint or layout change is needed.

Do not treat constraints as a substitute for responsive design decisions. A desktop sidebar may need to collapse or become a drawer on mobile. A three-column dashboard may become one column. Some changes require a separate frame or component variant rather than merely resizing the desktop design.

```text
Desktop:
Sidebar | Main content | Optional detail panel

Tablet:
Collapsed sidebar | Main content

Mobile:
Top bar
Main content
Bottom navigation or menu, if appropriate
```

Design multiple representative widths and explain what changes between them. A responsive file should communicate the rule, not only display three screenshots.

### 7. Establish a grid and alignment system

A grid helps organize content and maintain consistent alignment. Define margins, columns, gutters, and spacing based on the product's content and responsive needs. Avoid choosing a grid because it looks sophisticated in a design tutorial; it should support the actual layout.

Use the grid as a guide, not as a rigid rule that overrides readability. A long-form article, a dense table, and a marketing hero may need different content widths even when they share the same overall page grid.

```text
Desktop content grid:
12 columns
Consistent outer margins
Flexible gutters
Main content constrained to a readable maximum width

Mobile content grid:
4 columns
Smaller outer margins
Compact but usable gutters
Single-column content where appropriate
```

Review alignment across page title, content edges, form fields, cards, and actions. Small repeated misalignments can make an interface feel careless even when each component is attractive on its own.

### 8. Build reusable components when repetition is meaningful

Components are valuable when an element repeats or when a design rule needs to stay synchronized across screens. Common candidates include buttons, inputs, navigation items, alerts, cards, tables, dialogs, and status indicators. Reuse reduces drift and makes global changes safer.

Do not componentize every one-off shape. A component with no reuse, no meaningful variants, and no shared behavior may add indirection without value. Start with repeated patterns and promote them into components when repetition or maintenance needs justify it.

```text
Component: Button
Properties:
- Variant: Primary / Secondary / Tertiary
- Size: Small / Medium / Large
- State: Default / Hover / Disabled / Loading
- Icon: None / Leading / Trailing
```

A good component API exposes meaningful design choices without requiring users to understand internal construction details.

### 9. Use variants for meaningful state and appearance differences

Variants group related component options under a common component set. They are useful when a component has predictable states or styles, such as primary and secondary buttons or default and error fields. Variant properties should express meaningful choices, not arbitrary combinations that create a confusing matrix.

Keep the property names concise and consistent. Consider whether a difference should be a variant, a component property, or a separate component. A button's visual type is often a variant; optional icon content may be a property; a complex navigation system may deserve separate components.

```text
Button
  Type = Primary | Secondary | Tertiary
  Size = Small | Medium | Large
  State = Default | Hover | Disabled | Loading
```

Do not create dozens of combinations without a use case. If a component set becomes difficult to browse or maintain, reduce the exposed combinations and document the rules.

### 10. Use variables and styles for design tokens

Variables and styles allow shared decisions to be reused and updated. Use them for colors, spacing values where appropriate, typography, effects, and theme modes. A token system makes it easier to maintain consistency and create dark or high-contrast themes without manually editing every screen.

Name tokens by semantic role where possible. `Text / Primary` communicates intent better than `Dark Gray 900`. Semantic naming lets the actual color change while the meaning remains stable.

```text
Color / Text / Primary
Color / Text / Secondary
Color / Surface / Default
Color / Surface / Raised
Color / Action / Primary
Color / Border / Subtle
Color / Status / Danger
```

Avoid creating a token for every one-off value. Too many tokens can make the system hard to understand. Use tokens for repeated decisions and semantic roles that are expected to evolve.

### 11. Separate primitive tokens from semantic tokens

Primitive tokens represent raw values such as a palette step or spacing unit. Semantic tokens express how the value is used in the product. The distinction makes theme changes and brand evolution safer.

For example, a primitive blue may be used by a semantic primary-action token. Components should generally reference the semantic token rather than the raw palette value. That way, a brand or accessibility adjustment can update the role without changing every component.

```text
Primitive:
Blue / 600 = #3157D5
Gray / 900 = #172033

Semantic:
Action / Primary = Blue / 600
Text / Primary = Gray / 900
```

Do not create semantic tokens that merely duplicate primitive names without adding meaning. The goal is to decouple a component's role from a particular color value.

### 12. Create component properties with clear intent

Component properties make instances configurable without detaching them. Boolean properties can show or hide an icon, text properties can set labels, and instance-swap properties can select a compatible nested component. Use these properties to expose choices that designers actually need.

A property should be named from the consumer's perspective. `Show leading icon` is clearer than an internal layer name such as `Vector 14 visibility`. Too many properties can turn a simple component into a complicated control panel.

```text
Button properties:
Label: Save changes
Show leading icon: false
Show trailing icon: false
Type: Primary
Size: Medium
State: Default
```

Audit component properties from the perspective of another designer. If they cannot predict what a property changes, simplify the API or improve its naming.

### 13. Build interactive components for reusable behavior

Interactive components can represent local behaviors such as a toggle, tab selection, accordion trigger, or menu button. They are useful when the interaction pattern repeats and the prototype needs to communicate the expected behavior.

Keep interaction logic understandable. Avoid building a complicated prototype state machine when a short annotation can communicate the intended behavior more clearly. The goal is to demonstrate the product experience, not to simulate every backend detail inside the design tool.

```text
Toggle component:
Default: Off
On click: Change to On
On state: Show selected indicator and updated label
Keyboard note: Production implementation must support Space and native toggle semantics
```

Prototyping does not replace implementation requirements. Record accessibility and behavior details that the prototype cannot reliably express.

### 14. Prototype the critical path first

A prototype should answer a question: can users understand the flow, find the next action, and recover from likely mistakes? Begin with the primary path and add branches only where they affect the product decision. A prototype with every button linked to a random screen may look interactive but teaches little.

Use meaningful start points, consistent navigation, realistic content, and clear overlays. Make back navigation and dismissal behavior predictable. Include failure and empty states when they change the user's next step.

```text
Project list
  → Create project
  → Enter project details
  → Review
  → Project created
```

Run the prototype from the user's perspective rather than only clicking through the designer's intended route. Observe where the flow becomes ambiguous.

### 15. Design the full state model

A screen is not complete because its default state looks polished. Production interfaces need loading, empty, success, error, disabled, selected, permission-limited, and sometimes offline states. Figma should communicate the states that materially affect layout, copy, and behavior.

Create a state matrix before final handoff. Not every component needs every state, but each meaningful state should be specified. A form field may need default, focus, error, and disabled states; a data table may need loading, empty, error, and populated states.

```text
Component: Search results
- Loading: Show skeleton or progress indicator
- Populated: Show results and result count
- Empty: Explain no matches and offer filter reset
- Error: Explain retrieval failed and offer retry
- Offline: Explain connection issue when relevant
```

Do not use a skeleton state that implies the page is ready when the data is unavailable. State design should match the actual product behavior.

### 16. Use sections and annotations for handoff clarity

A handoff file should make approved screens, reusable components, and behavior notes easy to locate. Use sections to group related frames and annotations to explain non-obvious rules. Avoid relying on a verbal walkthrough as the only source of truth.

Annotate responsive changes, validation rules, loading behavior, empty states, content limits, and interaction consequences. Keep annotations concise and close to the relevant design. Mark exploratory work and outdated versions so they cannot be mistaken for approved specifications.

```text
Handoff note:
At widths below 768 px, move filters into the Filter panel.
Selected filters remain visible as removable chips.
Applying filters updates the result count.
When no results remain, show the no-results state with a Clear filters action.
```

An annotation is useful when it prevents a reasonable but incorrect implementation assumption.

### 17. Use realistic content instead of placeholder copy

Text length affects line wrapping, card height, button width, and page rhythm. Repeated “Lorem ipsum” hides real layout constraints and makes it harder to assess whether the information hierarchy works.

Use representative content, including long names, empty values, error messages, and localization-sensitive strings. When exact copy is unknown, document a plausible range or content rule instead of leaving every frame with generic filler.

```text
Project title: Regional inventory reconciliation
Owner: Operations and Finance
Status: Needs review
Empty message: No reports match the selected period.
Error message: We couldn't load reports. Check your connection and try again.
```

Realistic content reveals fragile auto layout and makes handoff more accurate.

### 18. Validate accessibility in the design file

Accessibility should be considered during design, not left entirely to engineering. Check contrast, text size, target size, focus visibility, labels, status communication, and whether information depends only on color. Figma cannot prove conformance by itself, but it can make problems visible early.

Document focus and error states for interactive controls. Make sure icons have labels when their meaning is unclear, and verify that disabled states remain understandable. Use the relevant accessibility standard and product context to decide contrast and target-size requirements.

```text
Accessibility review:
- Text contrast checked on every semantic surface
- Focus state specified for interactive controls
- Status includes text or shape in addition to color
- Form errors identify the field and explain correction
- Small targets reviewed for practical touch use
```

Do not treat a single plugin score as a complete accessibility audit. Review semantics, keyboard behavior, content, and real implementation separately.

### 19. Use design review and version history deliberately

A review should focus on user goals, hierarchy, consistency, edge states, and implementation risk—not only whether reviewers like the colors. Share a specific prototype or section and ask focused questions. Capture the decision and rationale when a significant direction changes.

Use version history or clearly marked checkpoints before major restructures. Avoid keeping multiple indistinguishable “final” pages. Archive obsolete directions in a way that preserves useful history without cluttering the current workflow.

```text
Review question:
Can a first-time user identify the primary action within five seconds?

Evidence to inspect:
- Initial viewport
- Primary and secondary action contrast
- Label clarity
- Keyboard focus order
- No-data and error states
```

A useful review produces a decision, owner, and next action. Unstructured feedback can create endless visual churn without improving the product.

### 20. Prepare the file for implementation and maintenance

A developer-ready file describes the intended layout, component variants, tokens, responsive changes, and behavior states. It should reduce uncertainty without pretending that every pixel is a rigid instruction. Developers may need to adapt the design to content, platform conventions, or technical constraints, and the design system should support that conversation.

Before handoff, remove obsolete experiments from the primary flow, check component instances, verify names, and ensure assets are available in a predictable format. Explain non-obvious behavior and agree on how deviations will be reviewed.

```text
Handoff checklist:
- Approved screens marked clearly
- Components use shared instances where appropriate
- Tokens and themes documented
- Responsive rules specified
- Loading, empty, error, and disabled states covered
- Exportable assets named and available
- Open questions recorded with owners
```

The file is successful when another designer or developer can understand the intended experience without needing the original creator to narrate every decision.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Product-first file structure

**What it does:** Organizes a design file around the stages and artifacts of product work.

**When to use it:** Use it for projects with multiple screens, research artifacts, shared components, and implementation handoff.

```text
00 — Overview
01 — Research & Flows
02 — Wireframes
03 — Design System
04 — Final UI
05 — Prototype
99 — Archive
```

Keep approved work easy to find and mark deprecated directions clearly. Adapt the structure to the size of the team instead of imposing unnecessary ceremony on a small project.

### Pattern 2: Auto Layout component contract

**What it does:** Defines how a reusable component grows, shrinks, and spaces its children.

**When to use it:** Use it for buttons, fields, cards, badges, navigation items, and repeated content groups.

```text
Button / Primary
Direction: Horizontal
Alignment: Center
Gap: 8
Horizontal padding: 16
Vertical padding: 10
Width: Hug contents
Height: Hug contents
```

Test long labels, optional icons, and larger text. If the component only works with the shortest label, its layout contract is incomplete.

### Pattern 3: Semantic token mapping

**What it does:** Separates raw design values from the role they serve in the interface.

**When to use it:** Use it when multiple screens share colors, spacing, typography, borders, or theme behavior.

```text
Primitive: Blue / 600
Semantic: Action / Primary
Component use: Button / Primary
```

Use semantic references in components where possible so a theme or brand change does not require editing every instance.

### Pattern 4: Variant matrix with limited dimensions

**What it does:** Represents the important visual and behavioral variations of a component without creating an unmanageable number of combinations.

**When to use it:** Use it for buttons, inputs, status badges, navigation items, and other reusable controls.

```text
Button:
Type = Primary | Secondary | Tertiary
Size = Small | Medium | Large
State = Default | Hover | Disabled | Loading
```

Only expose combinations that have a real use case. If the matrix becomes hard to inspect, reconsider whether some differences belong in separate components or properties.

### Pattern 5: State coverage matrix

**What it does:** Prevents the team from designing only the default appearance while ignoring production conditions.

**When to use it:** Use it for forms, tables, dashboards, search, and multi-step workflows.

```text
Search results:
Loading | Populated | Empty | Error | Offline
Form field:
Default | Focus | Error | Disabled | Success
```

Connect each state to a specific message or behavior. Do not use a generic empty state for errors or failed network requests.

### Pattern 6: Responsive frame set

**What it does:** Communicates how layout relationships change across representative viewport sizes.

**When to use it:** Use it for pages with columns, navigation, data tables, hero layouts, or content that changes order on small screens.

```text
Wide: Sidebar + main content + optional details
Medium: Collapsed navigation + main content
Narrow: Compact header + single-column content
```

Add annotations where the layout changes structurally. Three screenshots alone do not explain the breakpoint rule or what happens between the examples.

### Pattern 7: Prototype critical path

**What it does:** Makes the primary task testable without requiring a fully simulated product.

**When to use it:** Use it for usability reviews, stakeholder alignment, and early flow validation.

```text
Overview → Create item → Enter details → Review → Confirmation
```

Include branches only when they answer a meaningful question, such as validation failure, cancellation, or recovery after an error.

### Pattern 8: Handoff annotation contract

**What it does:** Records implementation decisions that cannot be reliably inferred from the static design.

**When to use it:** Use it for responsive changes, complex forms, conditional content, overlays, and stateful components.

```text
Below 768 px:
- Filters move into a drawer.
- Applied filters remain visible as removable chips.
- Empty results provide a Clear filters action.
```

Keep annotations specific, concise, and close to the relevant component. Record unresolved questions rather than silently assuming a behavior.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Designing before clarifying the task | Visual exploration feels more productive than requirements work | Write the user goal, primary action, key content, and edge states before creating final screens |
| Keeping every frame on one page | File structure is postponed until the project grows | Create a small, predictable page structure at the start |
| Leaving default layer names | Renaming is treated as optional cleanup | Name meaningful frames and components as soon as their purpose is known |
| Using groups instead of layout-aware frames | Grouping is faster during initial drawing | Use frames for reusable or responsive structures that need layout behavior |
| Manually positioning every child | The first screenshot is treated as the only required size | Use Auto Layout and constraints for content-driven and repeated components |
| Applying Auto Layout to every artwork layer | A feature is used without considering whether it fits the structure | Use Auto Layout for flow-based content and constraints or freeform frames for artwork |
| Creating a component for every object | Reuse is confused with abstraction for its own sake | Componentize repeated patterns or elements with shared behavior and maintenance needs |
| Creating too many variants | Every minor visual difference becomes a property | Keep only meaningful, supported combinations and document the component contract |
| Using raw colors in every component | Tokens are created too late or not at all | Map component colors to semantic tokens and theme modes |
| Naming tokens by appearance only | The current palette is treated as permanent | Prefer semantic roles for values used by components |
| Designing only default states | The happy path is the easiest to present | Build a state matrix for loading, empty, error, disabled, selected, and permission-limited cases |
| Using unrealistic placeholder copy | Layout is evaluated without real content constraints | Add representative text lengths, error messages, and long names |
| Making a prototype with random links | Clickability is mistaken for meaningful validation | Prototype the critical path and the branches that answer a product question |
| Using annotations to explain everything | The file lacks clear component structure or visual hierarchy | Fix the design structure first and annotate only non-obvious behavior |
| Hiding outdated work without marking it | Old frames remain visually similar to approved work | Archive obsolete directions and clearly mark the current source of truth |
| Ignoring accessibility in design review | Accessibility is assumed to be an engineering-only task | Specify focus, contrast, target size, status cues, and error behavior during design |
| Treating three viewport screenshots as a responsive system | Intermediate behavior is undocumented | State the breakpoint rules and structural changes between representative frames |
| Sharing an unfinished file without context | Reviewers cannot tell what feedback is needed | Identify the approved scope, prototype entry point, open questions, and requested decisions |
| Making all component properties visible | The component API exposes implementation details | Keep properties task-oriented and hide irrelevant internal structure |
| Failing to validate the handoff | The creator assumes developers can infer intent | Run a handoff walkthrough and record remaining questions with owners |

---

## Mental Models

1. **The file is a communication contract** — Structure, naming, states, and annotations tell other people how the intended product should behave.
2. **Start with the user's task** — A frame is useful only when its content and actions support a clear goal.
3. **Abstract repetition, not everything** — Components should reduce drift and maintenance cost rather than create needless indirection.
4. **Layout is behavior** — Auto Layout and constraints describe how the design responds to content and viewport changes.
5. **Tokens separate role from value** — Semantic tokens let themes and brand decisions evolve without rewriting every component.
6. **A screenshot is not a specification** — State behavior, responsive changes, and accessibility expectations need explicit representation.
7. **Real content reveals weak systems** — Long labels, errors, and empty data expose layout problems that placeholder copy hides.
8. **Prototype to answer a question** — Interaction should validate the critical path, not merely make every object clickable.
9. **Accessibility starts in design** — Focus, contrast, labels, and state cues should be visible in the design decisions before implementation.
10. **Handoff is successful when ambiguity shrinks** — The next person should understand the approved design, rules, and open questions without guessing.

---

## Quick Reference

| Task | Figma approach | Validate |
|---|---|---|
| Start a new product design | Clarify user goal and primary action first | Every major frame supports a stated task |
| Organize a file | Use predictable pages, sections, and approved-work markers | A teammate can find the current screen quickly |
| Build reusable controls | Use components for repeated patterns and shared behavior | Global changes update instances consistently |
| Define visual variations | Use variants for meaningful states and styles | The variant matrix remains understandable |
| Handle optional content | Use clear component properties | Property names describe designer-facing choices |
| Build responsive layouts | Use Auto Layout, constraints, and representative frames | Content remains usable at narrow and wide sizes |
| Create a token system | Separate primitive values from semantic roles | Theme changes do not require manual component edits |
| Prototype a workflow | Link the critical path and meaningful branches | A reviewer can complete the intended task |
| Cover production states | Create a state matrix | Loading, empty, error, and disabled states are specified |
| Prepare handoff | Annotate non-obvious behavior and responsive changes | Developers have fewer unresolved assumptions |
| Review accessibility | Check contrast, focus, labels, and status cues | Keyboard and assistive-technology behavior is considered |
| Manage iterations | Use version history and a clear archive | Old explorations are not mistaken for approved work |

---

## Build Challenge

### Project: Design a production-ready project management workspace in Figma

Create a responsive workspace for **Northstar Projects**, a fictional product used by small teams to organize milestones, tasks, owners, and project health. Your file must be structured, reusable, interactive enough to validate the main flow, and clear enough for a developer to implement without relying on a verbal explanation.

### Requirements

1. **Write a product brief.** Identify the target user, primary task, key content, and success condition.
2. **Map the information architecture.** Show the main destinations, hierarchy, and critical path before creating final UI.
3. **Organize the Figma file.** Create pages for overview, research and flows, wireframes, design system, final UI, prototype, and archive.
4. **Name meaningful layers.** Replace default frame names on approved screens and reusable components with purpose-based names.
5. **Create a token system.** Define semantic colors, typography, spacing, radii, borders, and elevation.
6. **Build reusable components.** Include primary and secondary buttons, text fields, status indicators, navigation items, a project card, and a dialog.
7. **Define component variants and properties.** Include only meaningful sizes, states, and optional content.
8. **Use Auto Layout and constraints.** Ensure buttons, fields, cards, and repeated lists respond to content changes.
9. **Design three viewport sizes.** Include wide desktop, medium tablet, and narrow mobile frames, and document structural changes between them.
10. **Cover important states.** Include loading, populated, empty, error, disabled, and permission-limited states where relevant.
11. **Prototype the critical path.** Let a reviewer open a project, create a milestone, review details, and reach a confirmation state.
12. **Specify interaction behavior.** Document focus, validation, dismissal, cancellation, and recovery behavior that the prototype cannot fully express.
13. **Review accessibility.** Check contrast, focus visibility, target sizes, labels, status communication, and readable text.
14. **Use realistic content.** Include long project names, empty fields, error messages, and a no-results state.
15. **Prepare handoff annotations.** Explain responsive behavior, validation, conditional content, and unresolved implementation questions.
16. **Run a peer review.** Ask another person to locate the approved screens and complete the prototype without guidance.
17. **Fix at least five issues.** Record each issue, its user impact, the change made, and the validation method.

### Failure condition

The challenge fails if a developer cannot identify the approved screens, if repeated controls drift instead of using shared components, if responsive behavior is represented only by shrinking the desktop frame, or if the prototype cannot demonstrate the primary task. It also fails if important states are missing, focus and error behavior are unspecified, or unresolved questions are hidden rather than recorded.

### Definition of Done / Success Criteria

- [ ] The product goal and primary task are documented.
- [ ] Pages, sections, and approved frames are easy to locate.
- [ ] Repeated controls use reusable components where justified.
- [ ] Component variants and properties have clear, limited meanings.
- [ ] Semantic tokens support consistent styling and theme changes.
- [ ] Auto Layout and constraints handle realistic content changes.
- [ ] Desktop, tablet, and mobile layouts express intentional behavior.
- [ ] Important loading, empty, error, and permission states are represented.
- [ ] The prototype demonstrates the primary user flow.
- [ ] Accessibility considerations are recorded and reviewed.
- [ ] Handoff annotations answer likely implementation questions.
- [ ] A peer can navigate the file and complete the prototype independently.
- [ ] At least five review findings have been fixed and documented.

---

## Production Debugging Checklist

1. Confirm the frame is approved and the intended viewport and state are clear.
2. Inspect layer names, parent-child structure, and whether repeated elements use shared components.
3. Check Auto Layout direction, gap, padding, hug/fill settings, and constraints.
4. Compare component instances with the source component to detect local overrides or detached copies.
5. Inspect semantic token usage and check for hard-coded values that should be shared.
6. Test long text, missing content, error messages, and optional icons.
7. Review responsive frames and document structural changes between widths.
8. Check contrast, focus, accessible naming, status cues, and target-size expectations.
9. Run the prototype from its intended starting point and test cancellation and recovery.
10. Review the handoff with a developer or peer and record remaining questions.

### Topic-specific gotchas

- **Gotcha:** Auto Layout can make a component responsive, but it cannot decide whether a desktop navigation should become a drawer or bottom navigation. That is a product and information-architecture decision.
- **Gotcha:** A component with dozens of variants can be technically reusable yet practically unusable. Keep the exposed component API focused on meaningful design choices.
- **Gotcha:** A prototype may appear complete while hiding validation, keyboard behavior, loading, and recovery requirements that need explicit handoff notes.
- **Gotcha:** Semantic token names only help when components actually reference them; a token page does not prevent drift if values are still hard-coded across frames.
- **Gotcha:** Three viewport frames do not define the full responsive system unless the transition rules between them are documented.
- **Gotcha:** Detaching an instance may seem like a quick visual fix but can create long-term inconsistency. Prefer a justified variant or an explicit exception documented in the design system.

### Tooling and collaboration notes

Figma features and labels can change over time, so verify current behavior in the product rather than relying on a remembered menu location. Use components, variants, variables, Auto Layout, constraints, prototyping, and version history where they solve a real design problem. Pair the file with browser-based implementation review and accessibility testing; a Figma canvas cannot prove runtime behavior, keyboard semantics, or browser compatibility. Keep feedback focused on user goals, hierarchy, states, and implementation risk, and record decisions that affect future screens.
