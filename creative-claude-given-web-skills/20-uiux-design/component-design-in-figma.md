# SKILL: component-design-in-figma

**Layer:** 43 — UI/UX Design

**Goal:** Design robust, reusable, accessible, and understandable Figma components with deliberate properties, variants, nesting, variables, documentation, and governance so teams can build consistent interfaces without turning the component library into an inflexible maze.

---

## Why This Matters (Senior Perspective)

A Figma component is not simply a rectangle with an icon and a label that someone can duplicate. It is a small interface contract. It communicates which decisions are fixed, which decisions can vary, what content belongs inside the component, what behavior a consumer can expect, and how the component should evolve without breaking existing designs. A button component, for example, should make its intent, size, visual state, icon options, and label-editing behavior clear. If every instance requires a designer to detach it, hunt for hidden layers, or override arbitrary properties, the component is not serving its purpose.

The cost of a poor component often appears later than the original design work. A team may build a large library quickly, then discover that two button families have different spacing rules, that changing a nested icon unexpectedly affects dozens of screens, or that a component set has so many variants that nobody knows which combination is valid. Product designers start detaching instances to meet deadlines. Engineers receive ambiguous handoffs. Accessibility details disappear between visual states. The library becomes a catalogue of objects rather than a reliable system.

Senior component design starts with use cases and constraints. It asks what is genuinely shared, which dimensions represent meaningful design decisions, what content should remain editable, and what a consumer needs to understand at a glance. It distinguishes a stable component API from internal implementation. A well-designed component is intentionally boring to consume: designers can find it, configure it, and trust it without needing to understand every layer inside it.

This matters in product work, agency work, and portfolio projects alike. A portfolio can show beautiful screens, but a thoughtful component system demonstrates that the designer can support more than one polished frame. Freelance teams need components that remain understandable after a handoff. Growing products need libraries that can absorb new requirements without multiplying near-duplicate controls. Cross-functional teams need component names and properties that translate into clear implementation conversations.

Do not confuse maximum reuse with good reuse. A component that tries to represent every possible card, menu, status label, and data row usually has a confusing API. A component that is too specific creates duplication and drift. The objective is a useful boundary: share what has stable structure and behavior, expose the choices consumers legitimately need, and keep exceptional composition outside the component until a real repeated pattern justifies bringing it in.

**Senior perspective:** optimize for predictable use and safe change, not for the largest possible component set. Measure quality by how often designers can use an instance correctly without detaching it, how clearly variants express intent, and how safely the library can evolve.

---

## Core Concepts

### 1. Start with a component contract

Before creating layers, describe the component’s purpose, required content, allowed variations, states, and constraints. A contract prevents the component from becoming a container for unrelated visual patterns.

For a primary action button, the contract might say: it represents one action; its label is required; it may optionally show a leading or trailing icon; it supports primary, secondary, and destructive intent; it supports compact, regular, and large sizes; and it has default, hover, pressed, focused, disabled, and loading states where relevant. It should not also become a navigation tab, a checkbox, and a link simply because all of them contain text.

```text
Component: Button
Purpose: Trigger an action
Required: Label
Optional: Leading icon, trailing icon
Intent: Primary | Secondary | Destructive | Tertiary
Size: Small | Medium | Large
State: Default | Hover | Pressed | Focused | Disabled | Loading
Constraints: One line by default; long labels need a defined wrapping or truncation rule
```

Why this matters: a contract makes omissions visible before the component is published. It also gives design and engineering a shared starting point for implementation and testing.

**Gotcha:** a component contract describes intended use, not every imaginable use. If the requirements keep expanding into unrelated behavior, split the component rather than adding another property by reflex.

### 2. Identify the stable structure

A good component has a recognizable internal structure that remains consistent across its intended variants. Identify the invariant parts before deciding which properties to expose. A button may always contain an auto-layout frame and a label, while icon slots are optional. A profile row may always contain an avatar region, identity text, and a trailing action region even if some are hidden.

```text
Button
└── Content (Auto layout: horizontal)
    ├── Leading icon (optional)
    ├── Label
    └── Trailing icon (optional)
```

Use clear layer names that describe purpose rather than appearance. `Label` is usually more durable than `Text 14 White`; `Leading icon` is more useful than `Star 2`; `Content` is clearer than `Frame 43`. Visual styling should generally come from variables and component properties rather than being encoded in layer names.

A stable structure makes instances easier to inspect and reduces the risk that a visual change will require rebuilding the component from scratch.

### 3. Choose component boundaries by responsibility

Create a component when a pattern has repeated structure, a shared meaning, or a need for centrally managed behavior. Do not turn every decorative group into a library component. A small brand flourish used once may be a local group; a repeated form field with consistent label, helper text, validation, and focus behavior is a strong component candidate.

A useful boundary test asks:
- Does this pattern recur or need consistency?
- Does it have a stable purpose?
- Can its consumer understand it without inspecting internals?
- Is there a meaningful set of options?
- Would a change to it reasonably be managed centrally?

```text
Good boundary:
Form field = label + control + helper/error message + validation semantics

Weak boundary:
Universal content box = any shape + any text + any icon + arbitrary padding + arbitrary behavior
```

The first represents a recognizable product pattern. The second is a generic container that hides design intent and encourages inconsistent use.

### 4. Name components for their role

Names are part of the library’s interface. Prefer names that match the vocabulary of the product and team. Group related components with slash-based paths when useful, such as `Actions/Button`, `Forms/Text field`, or `Navigation/Tab item`. Keep the naming scheme consistent and avoid mixing visual descriptions, implementation details, and business labels without a rule.

```text
Actions/Button
Actions/Icon button
Forms/Text field
Forms/Select
Feedback/Inline alert
Navigation/Breadcrumb item
Data display/Status badge
```

A component named `Blue Rectangle 3` becomes misleading after a rebrand. A component named `Primary action` may be ambiguous if “primary” describes a page-level priority rather than a button’s visual intent. Use terms that distinguish purpose from styling.

**Gotcha:** component paths help organization, but excessively deep paths can make browsing slower. Add hierarchy only when it improves discovery.

### 5. Use variants for meaningful visual or behavioral dimensions

Variants combine related component options into a component set. They are useful when the alternatives share the same core structure but differ in a controlled way. A button may vary by intent, size, and state. A badge might vary by semantic status and emphasis.

```text
Button
Properties:
  Intent = Primary | Secondary | Destructive | Tertiary
  Size = Small | Medium | Large
  State = Default | Hover | Pressed | Focused | Disabled | Loading
```

Use variant properties for dimensions that designers will intentionally select and that affect the component’s defined appearance or state. Avoid using a variant for every arbitrary text value, user name, icon glyph, or content string. Content belongs in text properties or nested instances when possible.

The number of combinations grows quickly. Four intents × three sizes × six states produces 72 theoretical combinations. Not all must necessarily be authored as separate manual drawings, but every supported combination needs a clear rule and reliable visual behavior.

**Gotcha:** a visually different state is not automatically a valid variant if it represents a different component responsibility. A selected navigation tab and a disabled action button have different semantics and should not be forced into one set.

### 6. Keep the variant matrix manageable

Variants are a design API, so every property should earn its place. If two properties always change together, consider whether they represent one dimension. If a combination is invalid, document or model the constraint rather than exposing it as a seemingly valid option.

```text
Status badge
Tone = Neutral | Success | Warning | Danger | Info
Emphasis = Subtle | Solid
Size = Small | Medium

Avoid:
Color = Red | Green | Yellow | Blue | Purple | Orange | ...
Random radius = 0 | 2 | 3 | 4 | 5 | 6 | 7 | 8
```

The first set describes design decisions. The second exposes low-level styling controls that make consistency difficult to maintain.

A variant matrix review should ask:
1. Does each property represent a real design choice?
2. Is every combination supported?
3. Can a consumer infer the result from the property name?
4. Would a separate component be clearer?
5. Are any properties redundant with variables or text overrides?

### 7. Use component properties for consumer-facing options

Component properties let consumers configure an instance without digging through internal layers. Common options include text, visibility, instance swaps, and variant selection. Use them to expose meaningful choices such as label text, whether a leading icon appears, or which approved icon instance is used.

```text
Button properties:
  Label: Text property
  Show leading icon: Boolean property
  Leading icon: Instance swap property
  Intent: Variant property
  Size: Variant property
  State: Variant property
```

This is clearer than requiring a designer to expand a nested layer list and manually toggle visibility. Keep property names short, consistent, and user-oriented. If a property only makes sense to the component author, it may belong in the internal structure rather than the public API.

In current Figma workflows, property capabilities and labels can vary as the product evolves. Confirm exact controls in the version of Figma your team uses rather than relying on an outdated menu path.

### 8. Treat text as content, not as a variant

Labels, titles, helper text, and user-provided strings should normally be editable text properties or text overrides. Making each possible label a separate variant multiplies the library without adding useful structure.

```text
Good:
Button / Intent=Primary / Size=Medium
Label property = "Save changes"

Poor:
Button / Save
Button / Continue
Button / Create account
Button / Submit
Button / Download report
```

Content changes often; structural and stylistic choices should change deliberately. Keeping the two separate helps designers test realistic copy, longer translations, and different product terminology without creating new component definitions.

A component should still define how content behaves. Decide whether labels wrap, truncate, or force a minimum width. Define how the component handles long words and localization. Do not assume that a short placeholder label proves the component is robust.

### 9. Use boolean properties for optional structure

Boolean properties are useful for optional elements with a stable role: a leading icon, helper text, a divider, or a trailing action. They should not become a substitute for a well-designed component boundary.

```text
Notification row
  Show avatar = true | false
  Show timestamp = true | false
  Show trailing action = true | false
```

If every combination is valid, booleans may be appropriate. If certain options depend on one another, document the relationship. For example, hiding a form label may be allowed only when an accessible name is supplied through a separate implementation requirement. The design file cannot enforce every semantic requirement, so note constraints explicitly.

**Gotcha:** many independent booleans create a combinatorial interface. If consumers can switch six optional regions on and off, there are 64 theoretical combinations. Split the component or define presets when most combinations are not meaningful.

### 10. Use instance swaps for approved nested components

Instance-swap properties allow a consumer to replace one nested component with another approved option, such as changing an icon while preserving the surrounding layout. They are useful when the outer structure remains stable and the replacement belongs to a known family.

```text
Button
└── Leading icon: Icon/Plus (instance swap property)
```

Provide sensible defaults and restrict swaps to compatible component families where the tooling permits it. A 16-pixel search icon and a 40-pixel illustration are not interchangeable merely because both are components. Document sizing and alignment expectations.

When a nested component is swapped, check padding, baseline alignment, optical balance, and accessible meaning. A replacement icon can be geometrically centered yet look visually off-center because of its silhouette.

### 11. Build nested components around stable responsibilities

Nesting is valuable when a subpattern has independent meaning and is reused elsewhere. A field component might include a label component, input control, and message component. A navigation item may contain an icon component and a text label. But nesting every tiny shape adds indirection and makes instance behavior harder to understand.

```text
Text field
├── Field label
├── Input control
│   ├── Leading icon (optional)
│   ├── Placeholder / value
│   └── Trailing action (optional)
└── Supporting message
```

Ask whether the nested component has an independent lifecycle, consistent use, or useful configuration. If not, keeping it as a clearly named internal layer may be simpler. Avoid deeply nested structures where a designer must open five levels to find the editable label.

**Gotcha:** nested components can inherit unexpected sizing or overrides when the parent changes. After modifying a nested component, inspect representative parent instances—not just the child in isolation.

### 12. Use auto layout and constraints to protect structure

Components should respond to content and frame changes without manual repositioning. Auto layout is useful for consistent gaps, padding, alignment, and content-driven sizing. Resizing rules and constraints should reflect the component’s actual behavior.

```text
Button frame:
  Auto layout: horizontal
  Alignment: center
  Gap: 8
  Horizontal padding: 16
  Vertical padding: 10
  Width: Hug contents (with documented minimum if needed)
  Height: Hug contents or a defined size token
```

Do not use absolute coordinates for content that should move when a label changes or an icon is hidden. Test short labels, long labels, missing optional elements, and localized text. A component that looks correct only at the original frame size is a static drawing, not a robust reusable part.

### 13. Connect components to variables and design tokens

Variables help centralize colors, spacing, radii, and other reusable values. Components should use semantic tokens where practical rather than repeating raw values across many definitions. This makes theme changes and global refinements safer.

```text
Color / Action / Primary / Background
Color / Action / Primary / Foreground
Color / Border / Subtle
Space / 2 = 8
Space / 3 = 12
Radius / Control = 8
```

Semantic names communicate purpose. `Color / Action / Primary / Background` is usually more useful than `Blue 600` because the semantic token can be remapped to a different color in a new theme while preserving intent. A raw palette token may still be appropriate at the foundational layer, but components should generally consume semantic tokens.

**Gotcha:** tokens do not automatically guarantee accessible contrast. Check the actual resolved color combinations in each theme and state.

### 14. Model states with purpose and consistency

Interactive components need a state model. A button’s default, hover, pressed, focus, disabled, and loading appearances should be intentional and aligned with the product’s interaction language. Do not treat hover as the only state that matters.

```text
State contract:
Default: available action
Hover: pointer feedback
Pressed: active activation feedback
Focused: keyboard focus is visible
Disabled: unavailable; contrast and semantics considered
Loading: action in progress; duplicate activation prevented in implementation
```

Figma can represent state visuals and prototype transitions, but it does not by itself guarantee production behavior. Document behavior such as whether loading preserves the label, whether width stays stable, and whether the disabled state is actually disabled in code.

For web implementations, ensure keyboard focus is visible. A corresponding implementation might use `:focus-visible`:

```css
.button:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
}
```

Do not remove focus indicators without providing an equally clear alternative.

### 15. Design for content stress, not just ideal copy

A component must handle realistic content boundaries. Test long labels, empty values, multiple lines, large text settings, translations, and different data lengths. In a data table, one unusually long customer name should not destroy the entire row. In a button, a translated label may need more width than the original language.

```text
Stress-test set:
- Short label: "Save"
- Typical label: "Save changes"
- Long label: "Continue to payment and review"
- Translation: a longer locale string
- Empty or missing optional icon
- Maximum supported text size
```

Choose wrapping, truncation, minimum widths, and overflow rules intentionally. If truncation is used, the full content should remain available through an appropriate accessible or interaction pattern in the implementation. Do not rely on the visual file to solve every runtime content issue.

### 16. Make accessibility part of the component definition

Accessibility is not a final polish step. A component’s semantics, states, focus behavior, and content constraints should be discussed when its contract is written. A visual icon button needs a meaningful accessible name in code. A form field needs an associated label or equivalent accessible naming mechanism. Error and success messages need clear meaning, not color alone.

```text
Icon button specification:
Purpose: perform a named action
Visible content: icon
Required implementation contract:
- Accessible name describes the action
- Keyboard activation works
- Focus indicator is visible
- Disabled behavior is explicit
- Tooltip is supplemental, not the only name
```

Use semantic HTML in implementation: `<button>` for actions, `<a>` for navigation, `<label>` associated with form controls, and suitable heading levels for document structure. A Figma layer named `Button` does not automatically become a semantic button in the browser.

**Gotcha:** a red border and red text may not be enough to communicate an error. Include explicit error wording and ensure status is not conveyed by color alone.

### 17. Plan for themes and modes

If the product supports light and dark themes, use variables and semantic component contracts to keep behavior consistent. Avoid duplicating the entire component library for each theme unless the visual or structural differences genuinely require separate definitions.

```text
Semantic roles:
Surface / Canvas
Surface / Raised
Text / Primary
Text / Muted
Border / Default
Action / Primary / Background
Action / Primary / Foreground
Focus / Ring
```

Test states in each mode. A border that is visible on a light surface may disappear on a dark one; a subtle disabled color may become unreadable. Theme support is not complete merely because the default state has been recolored.

### 18. Document component usage and misuse

A component’s name and properties cannot communicate every design rule. Add concise usage guidance where consumers can find it: purpose, when to use it, when not to use it, supported variants, content limits, accessibility notes, and examples.

```text
Button — usage guidance
Use for: triggering an action
Do not use for: navigating to another page; use a link instead
Label: begin with a clear action verb
Icon: add only when it improves recognition or meaning
Loading: use while the action is actively processing
Destructive: reserve for actions that remove or irreversibly change data
```

Documentation should be close to the component and written in the same vocabulary as the design system. Avoid pages of vague principles that do not help someone decide between two controls.

### 19. Treat component properties as a public API

A component API includes the properties, names, defaults, valid combinations, and content rules that consumers see. Like a software API, it should be stable enough for teams to use and clear enough to evolve.

```text
Public API review:
- Are property names understandable?
- Are defaults safe?
- Are invalid combinations excluded or documented?
- Can content be edited without detaching?
- Are nested swaps limited to compatible options?
- Can the component be changed without surprising existing instances?
```

Do not expose every internal detail. If consumers can override a low-level padding value, they may create dozens of subtly inconsistent instances. Provide a controlled size property instead when the system has defined sizes.

### 20. Manage overrides deliberately

Overrides allow an instance to vary from its main component while retaining the shared structure. Text changes and approved nested swaps are often intentional. Detaching an instance or overriding many low-level properties can signal that the component does not expose the right choice.

When reviewing a library, look for repeated patterns of overrides. If many designers keep changing the same padding or hiding the same layer, the component may need a new supported property or a revised default. Do not blindly remove overrides; they may be legitimate one-off needs. Understand the pattern first.

```text
Override review:
1. Identify recurring overrides across instances.
2. Determine whether they represent a real product requirement.
3. Add a property or variant only if the choice is valid and reusable.
4. Preserve one-off composition outside the shared component.
5. Test existing instances after changing the source component.
```

A component library is healthy when most overrides are intentional content choices, not repairs for structural defects.

### 21. Publish and maintain the library responsibly

Publishing a component library makes it available to others; it also creates expectations about stability. Before publishing, verify names, descriptions, variants, default values, accessibility notes, and representative instance behavior. Communicate significant changes and avoid silently changing component meaning.

```text
Release checklist:
- Names and paths are consistent
- Properties have clear defaults
- Supported combinations are reviewed
- Auto layout works with realistic content
- Themes and states are checked
- Documentation is discoverable
- Breaking changes are communicated
- Duplicate or deprecated components have a migration path
```

Do not publish every experiment to the shared library. Keep exploration local until a pattern is stable enough to support. Teams need confidence that a component is approved, not just available.

### 22. Version components and handle deprecation

Design systems evolve. A component may need a replacement because its API is confusing, its visual design changed, or the product no longer uses its pattern. Deprecation should be explicit and supported by a migration path.

```text
Deprecation note:
Old: Actions/Primary button v1
Replacement: Actions/Button
Reason: unified intent and size properties
Migration: replace instances, map old size values, review destructive actions
Support: legacy component remains available during the agreed transition
```

Avoid deleting a component while teams still rely on it. Equally, do not keep every historical version forever without a policy. Define who approves changes, how consumers are informed, and when old components can be removed.

### 23. Audit for duplication and drift

Near-duplicate components are often a sign that the library’s boundaries or governance are unclear. Two components may look alike but differ for a valid reason, so compare purpose and behavior rather than merging based only on appearance.

```text
Audit dimensions:
- Purpose and user outcome
- Structure and content slots
- Variant dimensions
- Spacing and typography
- States and accessibility contract
- Ownership and usage frequency
```

When consolidation is appropriate, map old names and properties to the new component and test representative screens. If differences are intentional, document the distinction so the library does not re-create the same ambiguity later.

### 24. Test components in realistic compositions

Components should be tested alone and in context. A field may look correct in isolation but fail when placed in a narrow modal. A menu item may appear balanced in a component page but misalign in a dense navigation rail. A button may look fine until placed next to a long secondary action.

```text
Context test:
- Form with label, hint, error, and disabled field
- Toolbar with multiple buttons and an icon button
- Modal with long heading and two actions
- Dense table row with long and missing values
- Light and dark theme
- Keyboard focus and high text scaling in implementation
```

Use Figma frames as test fixtures. Keep a page of stress cases and representative compositions so future edits can be checked quickly. In browser implementation, use DevTools to inspect computed styles, focus behavior, overflow, and responsive layout rather than assuming the Figma rendering proves the result.

### 25. Separate design representation from runtime behavior

A component in Figma describes intended visuals, properties, and some prototype interactions. It does not prove that the final implementation has correct keyboard semantics, screen-reader announcements, network behavior, form validation, or responsive behavior at every viewport. Those need implementation specifications and testing.

```text
Figma communicates:
- Visual hierarchy and spacing
- Approved variants and states
- Content rules
- Intended interactions
- Token usage

Implementation must verify:
- Semantic HTML and accessible names
- Keyboard and assistive technology behavior
- Responsive layout and overflow
- Validation and loading behavior
- Browser support and runtime failures
```

This distinction prevents false confidence. Use the design file as a source of intent and contract, then verify the actual component in its implementation environment.

---

## Relevant Patterns

### Pattern 1: Intent-first component API

**What it does:** exposes choices in terms of product meaning rather than raw visual styling.

**When to use it:** when the same structural component serves a few distinct purposes, such as primary, secondary, and destructive actions.

```text
Actions/Button
  Intent = Primary | Secondary | Destructive
  Size = Small | Medium | Large
  State = Default | Hover | Pressed | Focused | Disabled | Loading
```

A consumer chooses intent, not an arbitrary fill color. The design system can later change the palette without changing every instance.

### Pattern 2: Content-slot composition

**What it does:** separates stable structure from optional or replaceable content.

**When to use it:** when a component has a consistent frame but needs controlled options for icons, helper messages, avatars, or trailing actions.

```text
Notification item
├── Avatar slot (optional)
├── Content slot
│   ├── Title
│   └── Description
└── Trailing action slot (optional)
```

Use boolean properties for simple visibility choices and instance swaps for compatible nested components. Avoid unrestricted combinations when some arrangements are not supported.

### Pattern 3: Token-backed styling

**What it does:** makes shared visual decisions centrally maintainable.

**When to use it:** when colors, spacing, radii, or typography need to stay consistent across a family of components or themes.

```text
Component style:
  Background -> Color / Action / Primary / Background
  Foreground -> Color / Action / Primary / Foreground
  Radius -> Radius / Control
  Horizontal padding -> Space / 4
```

Token names should express roles. Review actual contrast and state behavior after changing token values.

### Pattern 4: State-complete control

**What it does:** ensures an interactive component has a deliberate visual and behavioral contract for its supported states.

**When to use it:** for buttons, fields, menus, tabs, toggles, and other controls that communicate availability or interaction.

```text
Required state review:
Default / Hover / Pressed / Focused / Disabled
Additional states when relevant:
Loading / Error / Success / Selected
```

Not every component needs every state. Define states based on its actual behavior and test them in context.

### Pattern 5: Stress-test fixture page

**What it does:** collects edge cases and representative compositions in one place for repeatable component review.

**When to use it:** when a component library is growing, a major refactor is underway, or multiple designers contribute to shared components.

```text
Fixture page:
- Short and long labels
- Optional elements on and off
- Narrow and wide containers
- Light and dark themes
- Default and error states
- Dense and spacious compositions
```

Keep the fixture page updated as the component contract changes. It is a practical regression tool for visual design, though it cannot replace browser and accessibility tests.

### Pattern 6: Safe deprecation and migration

**What it does:** replaces confusing or outdated components without leaving consumers uncertain.

**When to use it:** when consolidating duplicates, renaming a component family, or changing property structure.

```text
Migration record:
Old component -> New component
Old property -> New property
Unsupported combination -> Approved alternative
Required review -> Screens using legacy behavior
Removal condition -> Consumers migrated and owners notified
```

Treat deprecation as a product change. Provide a clear replacement and a realistic transition plan.

### Pattern 7: Override signal audit

**What it does:** uses recurring instance overrides as evidence about missing API choices or broken defaults.

**When to use it:** during library maintenance, after a major product launch, or when designers often detach instances.

```text
Repeated override -> Investigate cause
Same padding changed repeatedly -> Review size/property model
Same layer hidden repeatedly -> Review optional content
Many detached copies -> Review component boundary and discovery
```

Do not convert every override into a property. Add a property only when the choice is meaningful and supported.

### Pattern 8: Theme-aware component family

**What it does:** keeps component structure and semantic roles stable while token values adapt to different themes.

**When to use it:** when a product supports light/dark modes, brand themes, or multiple customer configurations.

```text
Stable component:
  Text / Primary
  Surface / Raised
  Border / Default
  Focus / Ring

Mode values:
  Light -> light surface, dark text
  Dark -> dark surface, light text
```

Test all important states in every supported mode. Do not assume semantic token names guarantee visual contrast.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Creating a component for every layer | Reuse is mistaken for maximum component count | Promote a pattern only when it has stable meaning, reuse, or centrally managed behavior |
| One universal component for unrelated patterns | Designers want one place for everything | Split by responsibility and publish distinct APIs |
| Naming by color or position | The initial screen drives naming | Use role-based names that remain true after redesign |
| Making every label a variant | Content and styling are conflated | Keep labels as editable text properties or overrides |
| Adding variants for arbitrary padding values | Low-level styling is exposed as a choice | Define a small set of semantic size variants |
| Exposing every internal layer | Property API is not designed | Expose only consumer decisions that are valid and reusable |
| Too many boolean properties | Optional structure is added without constraints | Reduce combinations or split into clearer components |
| Invalid combinations are selectable | Variant matrix was not reviewed | Enumerate supported combinations and document constraints |
| Deep nesting hides editable content | Reuse is applied at too small a scale | Nest only independently meaningful, reusable patterns |
| Raw colors are copied across components | Tokens were skipped for speed | Replace repeated values with semantic variables and verify resolved colors |
| Auto layout is incomplete | Component was tested only at one label length | Test content extremes, optional elements, and narrow containers |
| Icon swaps break alignment | Swap compatibility was assumed | Restrict to compatible icon families and inspect optical alignment |
| Disabled state is conveyed only by opacity | Visual dimming is used as a shortcut | Define disabled semantics and test contrast and implementation behavior |
| Focus state is omitted | Only pointer interaction was considered | Specify a visible focus state and verify `:focus-visible` in code |
| Error state uses color alone | Visual styling substitutes for clear messaging | Add explicit error text and non-color cues |
| Components are published before review | Availability is prioritized over stability | Run a release checklist and test representative instances first |
| Existing instances are broken by source edits | Impact on overrides was not checked | Test parent instances and communicate breaking changes |
| Duplicate components are merged by appearance | Similarity is judged visually only | Compare purpose, behavior, content structure, and usage before consolidation |
| Every override becomes a new property | Individual requests are treated as system rules | Look for repeated, valid needs before expanding the API |
| Instances are detached as the default workaround | The component lacks a needed option or is hard to find | Investigate the reason and improve API or discovery where justified |
| Theme support covers only the default state | Theme review is too shallow | Inspect hover, focus, disabled, loading, error, and selected states per mode |
| Documentation is vague | Guidance describes principles but not decisions | State when to use the component, when not to, and the supported options |
| A Figma prototype is treated as accessibility proof | Visual behavior is confused with runtime semantics | Verify semantic HTML, keyboard interaction, names, and assistive technology behavior |
| Deprecated components disappear without migration | Cleanup is treated as file organization | Publish replacements, map properties, and agree on a removal condition |
| Component names use inconsistent vocabulary | Different contributors use personal conventions | Maintain a naming guide and review new entries against it |
| Layer names include styling values | Layers are named from current appearance | Name by purpose and use tokens/properties for styling |
| Long localized content is ignored | Only the source language was tested | Include translation and large-text stress cases in the fixture page |
| Nested changes are tested in isolation | Parent instances are forgotten | Inspect representative compositions after nested component edits |
| Component API exposes implementation details | Internal convenience is mistaken for user need | Hide internal choices and provide semantic properties with safe defaults |
| No owner is assigned to the library | The library is treated as a static file | Define ownership, review cadence, release notes, and contribution rules |

---

## Mental Models

1. **Component as a contract** — A component promises a stable purpose, supported options, and predictable behavior; its internals are secondary to that promise.
2. **Properties as an API** — Every exposed property is a decision the consumer is invited to make, so each one should be clear, valid, and worth maintaining.
3. **Variants as a matrix** — Variant dimensions multiply combinations; design the matrix intentionally rather than adding dimensions without checking their interaction.
4. **Reuse has a boundary** — Reuse stable structure and behavior, but leave genuinely unique composition outside the library.
5. **Overrides are evidence** — Repeated overrides can reveal missing properties, confusing defaults, or incorrect component boundaries.
6. **Tokens separate intent from value** — A semantic token says why a value exists, allowing the actual value to evolve without losing meaning.
7. **The fixture page is a regression suite** — Stress cases make visual quality repeatable and reduce accidental breakage during library changes.
8. **Figma is a specification, not the runtime** — Design intent informs implementation, but browser behavior and accessibility must be verified in the real interface.
9. **Documentation is part of usability** — A component is not easy to use if its purpose and constraints are hidden.
10. **Governance protects trust** — Publishing, deprecation, and migration rules let teams evolve the system without surprising its consumers.

---

## Quick Reference

| Decision | Recommended approach | Watch out for |
|---|---|---|
| Component boundary | Stable purpose, structure, or behavior | Generic containers with arbitrary options |
| Naming | Role-based and consistent paths | Color-based or temporary names |
| Variants | Meaningful visual/behavioral dimensions | Combinatorial explosion |
| Text content | Editable text property or override | One variant per label |
| Optional element | Boolean property where combinations are valid | Too many independent booleans |
| Replaceable nested item | Instance swap with compatible options | Unrelated component families |
| Styling | Semantic variables/tokens | Repeated raw values |
| Layout | Auto layout and appropriate resizing rules | Fixed coordinates for dynamic content |
| State design | Explicit state contract | Hover-only state coverage |
| Accessibility | Semantics, visible focus, non-color cues | Treating a visual mock as proof |
| Documentation | Purpose, use, misuse, options, constraints | Vague generic principles |
| Publishing | Review and communicate changes | Publishing unstable experiments |
| Maintenance | Audit overrides and duplication | Merging by appearance alone |
| Deprecation | Replacement and migration path | Deleting components without notice |
| Quality testing | Stress fixtures and real compositions | Reviewing only the component’s default state |

---

## Build Challenge

Design a reusable Figma component family for a realistic account-management interface. The library must include a button, text field, status badge, and notification row. The challenge is to create a system that other designers can use without detaching instances for normal configuration.

### Requirements

1. **Write component contracts.** For each of the four components, document its purpose, required content, optional content, supported properties, and unsupported use cases.
2. **Create a consistent naming scheme.** Use role-based paths such as `Actions/Button`, `Forms/Text field`, `Data display/Status badge`, and `Feedback/Notification row`.
3. **Define a button variant matrix.** Include intent, size, and state dimensions. Explain which combinations are supported and how loading and disabled states differ.
4. **Create an editable text field.** Include label, input region, helper/error message, and a clearly defined focus/error/disabled visual treatment. Use auto layout for responsive content.
5. **Create a semantic status badge.** Support neutral, success, warning, danger, and informational tones without relying on color alone in the usage guidance.
6. **Create a notification row.** Define optional avatar, title, description, timestamp, and trailing action behavior. Reduce or constrain combinations that are not meaningful.
7. **Connect reusable styles to variables.** Define semantic color, spacing, radius, and typography tokens. Demonstrate how light and dark modes resolve the same semantic roles.
8. **Expose consumer-facing properties.** Use text properties, boolean visibility properties, variant properties, and instance swaps only where they improve normal use.
9. **Build a stress-test page.** Include long labels, translated-length text, missing optional elements, narrow containers, multiple states, and both themes.
10. **Document accessibility and handoff requirements.** Specify semantic HTML expectations, accessible names, visible keyboard focus, error communication, and behavior that must be verified in code.
11. **Audit instance overrides.** Create at least three deliberate examples of a recurring override and decide whether each calls for an API change, a new component, or a one-off exception.
12. **Create a migration note.** Describe how a hypothetical old button component would map to the new API, including property changes and unsupported legacy combinations.
13. **Review in context.** Place the components into an account settings form, a confirmation modal, and a notification list. Check spacing, alignment, and realistic content.
14. **Write a contribution guide.** Define who can add components, how names and properties are reviewed, what must pass before publishing, and how deprecations are announced.
15. **Verify the library’s discoverability.** Ask another designer to find and configure each component without verbal guidance; record points of confusion and revise the API or documentation.

### Failure and edge conditions

The challenge fails review if the button has no visible keyboard-focus specification, if the field communicates errors through color alone, if the notification row breaks when optional content is hidden, if dark-mode states have unresolved contrast issues, or if normal use requires detaching an instance. Also treat unexplained invalid variant combinations, repeated raw color values, and a missing migration plan as release blockers.

### Definition of Done

- All four components have clear contracts, role-based names, and discoverable documentation.
- Variants and properties express meaningful choices without exposing unnecessary internal details.
- Auto layout and resizing rules survive short and long content, optional elements, and narrow compositions.
- Semantic tokens support the documented themes, and important states have been reviewed in each mode.
- Accessibility requirements include semantic implementation guidance, visible focus, accessible names, and non-color status communication.
- A stress-test page and three realistic compositions are available for regression review.
- Repeated overrides have been analyzed, and any API changes are justified by recurring valid needs.
- A migration note and contribution/deprecation process are documented.
- A second designer can configure common instances correctly without detaching or needing a walkthrough.
- Implementation handoff clearly separates Figma intent from runtime behavior that must be tested in code.
