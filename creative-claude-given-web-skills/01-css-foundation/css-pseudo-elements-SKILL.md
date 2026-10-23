# SKILL: css-pseudo-elements

## Layer
Layer 01 — CSS Foundation

## Goal
Use CSS pseudo-elements confidently to add decorative visuals, markers, overlays, and carefully controlled generated content without compromising semantics, accessibility, layout, or maintainability.

## Why This Matters (Senior Perspective)
Pseudo-elements let a component own visual details without adding meaningless wrapper elements to the DOM. Used well, they reduce markup noise and centralize styling. Used carelessly, they create invisible dependencies: important text exists only in CSS, stacking becomes difficult to reason about, hit targets get blocked, or a decorative layer covers keyboard focus.

A senior engineer distinguishes between **content** and **presentation**. Real content belongs in HTML. CSS-generated content is appropriate for decoration, visual markers, and supplemental presentation when the meaning remains available without it. Pseudo-elements are not general-purpose DOM nodes and cannot replace semantic structure, interactive controls, or accessible labels.

Use this skill when:
- Adding decorative underlines, badges, dots, dividers, or background shapes.
- Creating quotation marks, icons, or small visual markers.
- Building overlays without extra markup.
- Styling list markers or form states.
- Debugging why `::before` or `::after` does not appear.
- Preventing generated content from breaking layout or accessibility.

---

## Core Concepts

### 1. What a Pseudo-Element Is
A pseudo-element styles a specific part of an element or creates a generated box associated with it. Common examples include `::before`, `::after`, `::first-letter`, `::first-line`, `::marker`, `::selection`, and `::placeholder` (with browser-specific history and support considerations).

Pseudo-elements are written with a double colon in modern CSS:

```css
.notice::before {
  content: "!";
}
```

The older single-colon syntax for some pseudo-elements remains supported for compatibility, but use the double-colon form for current code.

### 2. `::before` and `::after`
`::before` and `::after` create generated content as the first and last child-like generated boxes of the originating element's content, when their `content` value is not `none`.

```css
.link::after {
  content: "";
  display: inline-block;
  inline-size: 0.4em;
  block-size: 0.4em;
  border-inline-end: 0.12em solid currentColor;
  border-block-end: 0.12em solid currentColor;
  transform: rotate(45deg);
}
```

An empty string is useful when the pseudo-element is purely decorative. The element still needs a layout box, so `display`, dimensions, borders, backgrounds, and positioning determine what appears.

**Gotcha:** `::before` and `::after` do not render when `content` is `normal` or `none` in the usual generated-content model. If the pseudo-element seems missing, inspect `content` first.

### 3. Generated Content Is Not Semantic HTML
The `content` property can insert text, strings, images, counters, and other generated content forms. But generated text should not be the sole source of essential information.

Good uses:
- Decorative quotation marks.
- A nonessential arrow beside a link.
- A visual required-field marker when the field is already programmatically labelled.
- A decorative separator.
- A badge whose meaning is also represented in the real DOM.

Avoid:
- Putting the only label of a button in `::before`.
- Using generated text as the only error message.
- Conveying status only through a CSS icon or color.
- Replacing a semantic list or heading with pseudo-element text.

**Gotcha:** Assistive technology exposure of generated content varies by browser and screen reader. Treat generated text as presentation, not as the only carrier of meaning.

### 4. The `content` Property
For `::before` and `::after`, `content` is typically required for the generated box to appear. Common values include `""`, quoted text, `attr(data-label)`, `url(...)`, and `counter(...)` or `counters(...)`.

```css
.external-link::after {
  content: " ↗";
}
```

Use strings sparingly and account for localization. A decorative arrow can be useful; a generated phrase such as “opens in a new tab” should not be relied upon as the only accessible disclosure.

`content: normal` and `content: none` generally suppress generated content for these pseudo-elements. The property has other behavior for elements and other pseudo-elements, so do not assume one universal meaning in every context.

### 5. Empty Content and Visual Boxes
An empty `content: ""` can create a box that is styled with dimensions, borders, and background. It is a common technique for decorative shapes.

```css
.card {
  position: relative;
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  border: 1px solid currentColor;
  border-radius: inherit;
  pointer-events: none;
}
```

This can add a border without a wrapper, but consider whether a normal `border` would be simpler. Pseudo-elements should solve a real styling problem, not merely demonstrate cleverness.

### 6. Positioning and Containing Blocks
An absolutely positioned pseudo-element is positioned relative to its containing block, commonly established by `position: relative` on the originating element.

```css
.card {
  position: relative;
}

.card::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-block-end: 0;
  inline-size: 3rem;
  block-size: 0.2rem;
  background: currentColor;
}
```

Use logical inset properties where appropriate. If the pseudo-element appears in an unexpected place, inspect the nearest positioned ancestor and containing block rather than changing offsets randomly.

**Gotcha:** An absolutely positioned pseudo-element may be positioned relative to an ancestor rather than the element you expected if the originating element does not establish the relevant containing block.

### 7. Stacking and `z-index`
Pseudo-elements participate in painting and stacking according to their originating element, positioning, stacking contexts, and other CSS rules. A `z-index` value does not automatically lift an element above every unrelated stacking context.

```css
.card {
  position: relative;
  isolation: isolate;
}

.card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: #f3f4f6;
}
```

`isolation: isolate` can create a local stacking context that makes this pattern more predictable, but test the component against its actual ancestors. Often a normal background is simpler than a negative-z pseudo-element.

### 8. Pointer Events and Hit Testing
A decorative overlay can intercept pointer input unless it is excluded from hit testing.

```css
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.55));
  pointer-events: none;
}
```

Use `pointer-events: none` for a purely decorative layer that must not block links, buttons, selection, or drag interactions. Do not apply it blindly to an interactive pseudo-element intended to respond to pointer events.

**Gotcha:** A decorative overlay that looks transparent can still block clicks if it has a box and participates in hit testing.

### 9. `::marker`
`::marker` styles the marker box of list items and some other marker-generating elements.

```css
.steps li::marker {
  color: currentColor;
  font-weight: 700;
}
```

It is often preferable to replacing native list markers with custom pseudo-elements. Support for which properties apply to `::marker` is limited compared with ordinary boxes, so keep styling to supported marker properties and test target browsers.

If a list needs custom numbering, CSS counters may help, but preserve list semantics in HTML.

### 10. `::first-letter` and `::first-line`
`::first-letter` styles the initial letter or typographic unit of a block container; `::first-line` styles the first formatted line. Their exact scope depends on layout, language, punctuation, and formatting rules.

```css
.article-intro::first-letter {
  font-size: 3.5em;
  font-weight: 700;
  float: left;
  line-height: 0.9;
  margin-inline-end: 0.12em;
}
```

Use editorial effects only when they support the reading experience. Test the first letter with opening quotes, accented letters, and different languages.

**Gotcha:** `::first-line` is not a stable selector for a particular phrase or fixed set of words. Its contents change with width, font loading, and text size.

### 11. `::selection`
`::selection` styles the portion of text currently selected by the user.

```css
::selection {
  color: #fff;
  background: #2457d6;
}
```

Keep selected text readable with adequate contrast. Browser support for which properties can be applied is intentionally limited; avoid depending on complex layout or arbitrary properties on selection.

### 12. `::placeholder`
`::placeholder` styles placeholder text in form controls. Placeholder text is not a replacement for a visible or programmatic label.

```css
input::placeholder {
  color: #666;
  opacity: 1;
}
```

Set placeholder color with sufficient contrast and ensure the real label remains visible. Placeholder text disappears as the user types and may be announced inconsistently.

**Gotcha:** A placeholder that looks like a label is not a robust form-label strategy. Use a `<label>` associated with the input.

### 13. Attribute-Driven Content with `attr()`
The `attr()` function can expose an attribute value through generated content:

```html
<span class="status" data-label="In review">Review</span>
```

```css
.status::after {
  content: " — " attr(data-label);
}
```

This is useful for small supplemental presentation or debugging, but avoid duplicating essential visible text in a way that creates confusing repetition. Support for typed `attr()` values outside `content` is evolving; do not assume advanced forms are available in every target browser.

**Gotcha:** If the attribute is missing or empty, the generated text may disappear or look incomplete. Treat the attribute as an input that needs validation.

### 14. Counters and `counter()`
CSS counters can number repeated elements without adding literal numbering to the markup.

```css
.steps {
  counter-reset: step;
}

.steps li {
  counter-increment: step;
}

.steps li::before {
  content: counter(step);
  display: inline-grid;
  place-items: center;
  inline-size: 2rem;
  aspect-ratio: 1;
  border: 1px solid currentColor;
  border-radius: 50%;
}
```

Use counters for decorative numbering where native ordered-list markers do not fit the design. Keep the actual `<ol>` and `<li>` structure. Verify that the numbers are not the only way users can understand sequence or relationships.

### 15. `counters()` for Nested Structures
`counters(name, separator)` can display nested counter values such as `2.3.1`. It can be useful for styled outlines or legal-document sections.

```css
.outline {
  counter-reset: section;
}

.outline > li {
  counter-increment: section;
}

.outline > li::before {
  content: counters(section, ".") " ";
}
```

Counter scope can become confusing in nested lists. Define reset and increment rules intentionally and verify the result when lists contain nested levels, repeated components, or reordered content.

### 16. Pseudo-Elements and Inline Layout
Pseudo-elements participate in layout according to their `display` and generated content. An inline pseudo-element follows inline formatting rules; an absolutely positioned pseudo-element is removed from normal flow.

Use `inline-block` when a decorative shape needs dimensions but should remain in the text flow. Use absolute positioning when the decoration should not affect layout. Avoid setting fixed dimensions on inline content and expecting them to behave like block boxes.

### 17. Decorative Underlines
Pseudo-elements can create custom underlines that animate or sit away from glyph descenders.

```css
.nav-link {
  position: relative;
  text-decoration: none;
}

.nav-link::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  inset-block-end: -0.25rem;
  block-size: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 180ms ease;
}

.nav-link:hover::after,
.nav-link:focus-visible::after {
  transform: scaleX(1);
}
```

For bidirectional layouts, consider transform origin and logical direction. Preserve a visible focus indication even if the underline animation is disabled.

**Gotcha:** A custom underline can animate beautifully but still remove the familiar link cue. Keep sufficient contrast and ensure keyboard focus is obvious.

### 18. Respect Reduced Motion
If pseudo-element decorations animate, support users who prefer reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  .nav-link::after {
    transition: none;
  }
}
```

A reduced-motion alternative should preserve the information and interaction state. Do not make the only indicator of selection a motion effect.

### 19. Pseudo-Elements and Accessibility
Pseudo-elements can be decorative, but their accessibility-tree exposure is not uniform enough to make them a reliable source of essential content. For icons that convey meaning, provide a text label or accessible name in HTML. For state, use actual text and appropriate ARIA or native semantics where needed.

A decorative icon can be safely hidden from assistive technology when it adds no independent meaning, but pseudo-elements themselves do not have ordinary HTML attributes such as `aria-hidden`. Put accessible names and relationships on the real element.

### 20. Form Controls and Replaced Elements
`::before` and `::after` are generally not available as ordinary generated children of replaced elements such as `img`, and behavior on form controls varies. If a decoration needs to sit over an image, put the image inside a wrapper and attach the pseudo-element to that wrapper.

```html
<div class="image-frame">
  <img src="cover.jpg" alt="Book cover" />
</div>
```

```css
.image-frame {
  position: relative;
}

.image-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.3));
  pointer-events: none;
}
```

**Gotcha:** If a pseudo-element does not render on an image or control, attach it to a wrapper rather than fighting the element's rendering model.

### 21. `::backdrop` and Top-Layer Contexts
`::backdrop` styles the backdrop behind elements displayed in the top layer, such as modal dialogs and fullscreen elements where applicable.

```css
dialog::backdrop {
  background: rgb(10 12 18 / 0.65);
  backdrop-filter: blur(3px);
}
```

The backdrop is not the same as an ordinary `::before` overlay. Use native dialog or other appropriate platform behavior when you need a modal; do not imitate a modal solely with a pseudo-element that blocks the page without proper focus management.

### 22. `::file-selector-button`
`::file-selector-button` styles the button portion of file inputs in supporting browsers.

```css
input[type="file"]::file-selector-button {
  margin-inline-end: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  font: inherit;
}
```

Test native keyboard behavior, focus, and platform differences. Styling should not make the file picker harder to discover or operate.

### 23. `::before`/`::after` vs. Real Elements
Choose a pseudo-element when the content is purely visual, tightly coupled to the host, and does not need independent semantics or interaction. Choose a real element when it needs focus, event handling, accessible attributes, independent layout ownership, or meaningful content.

A small arrow after a link is a good pseudo-element. A clickable menu button, tooltip with essential instructions, or validation message is not.

### 24. Performance and Maintainability
Pseudo-elements are not automatically faster than markup in a meaningful user-visible way. Use them to keep the component model clear, not to avoid every wrapper at all costs. A deeply layered design with many pseudo-elements can be harder to debug than explicit markup.

Name the intent in CSS classes, scope selectors to components, and avoid broad selectors that unexpectedly decorate every button or link. When a component needs multiple independent layers, consider whether a dedicated wrapper or actual element communicates the structure more clearly.

### 25. Debugging Missing or Misplaced Pseudo-Elements
When a pseudo-element is missing or incorrect, inspect:

1. Whether the selector matches the intended element.
2. The computed `content` value.
3. Whether the pseudo-element has a visible box (`display`, dimensions, border, background).
4. The containing block and position offsets.
5. `overflow` clipping on ancestors.
6. Stacking contexts and `z-index`.
7. `opacity`, `visibility`, `transform`, and `clip-path`.
8. `pointer-events` if interaction is blocked.
9. Font availability when the generated content is a glyph.
10. Reduced-motion styles if the element depends on an animation.

**Gotcha:** A pseudo-element may exist in DevTools but remain invisible because it has no dimensions, its color matches the background, or an ancestor clips it.

### 26. Internationalization and Direction
Pseudo-elements should work with different writing directions and languages. Prefer logical properties such as `inset-inline-start`, `inset-inline-end`, `margin-inline-start`, and `border-inline-start` rather than hardcoding left and right.

Generated words and punctuation may not localize automatically. Keep generated strings decorative, and use real localized text for meaning. Test arrows, underlines, counters, and icon placement in RTL layouts.

### 27. `::marker` vs. Custom Counter Markers
Use `::marker` when native list numbering or bullets are appropriate and only styling needs to change. Use counters and pseudo-elements when the design needs a custom shape or more elaborate marker. In both cases, preserve semantic list markup and ensure the marker is not the only signal of state.

### 28. Selection, Printing, and High Contrast
Test pseudo-element decorations in print styles, forced-colors/high-contrast environments, and text selection. A background-only marker may disappear when background colors are suppressed. Where the decoration conveys a nonessential distinction, disappearance is acceptable; where it carries meaning, provide an equivalent in real text or semantics.

```css
@media print {
  .decorative-badge::before,
  .decorative-badge::after {
    content: none;
  }
}
```

Use print overrides only when they improve the printed document. Do not remove important information from print output simply because it originated in CSS.

---

## Reusable Patterns

### Pattern A — A decorative external-link arrow

```css
.external-link::after {
  content: " ↗";
  font-size: 0.85em;
  text-decoration: none;
}
```

Keep any essential disclosure in real text or an accessible description, not only in generated content.

### Pattern B — A custom underline

```css
.link {
  position: relative;
  text-decoration: none;
}

.link::after {
  content: "";
  position: absolute;
  inset-inline: 0;
  inset-block-end: -0.2em;
  block-size: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 160ms ease;
}

.link:hover::after,
.link:focus-visible::after {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: reduce) {
  .link::after {
    transition: none;
  }
}
```

Keep another clear focus indicator if the underline alone is insufficient.

### Pattern C — A decorative image overlay

```css
.media-frame {
  position: relative;
  overflow: clip;
}

.media-frame::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.4));
  pointer-events: none;
}
```

Attach the pseudo-element to a wrapper, not directly to a replaced image.

### Pattern D — A numbered process list

```css
.process {
  counter-reset: step;
  list-style: none;
  padding: 0;
}

.process > li {
  counter-increment: step;
}

.process > li::before {
  content: counter(step);
  display: inline-grid;
  place-items: center;
  inline-size: 2rem;
  aspect-ratio: 1;
  margin-inline-end: 0.75rem;
  border: 1px solid currentColor;
  border-radius: 50%;
}
```

Retain the actual ordered-list semantics and check nested-list counter scope.

### Pattern E — A quotation mark decoration

```css
blockquote {
  position: relative;
  padding-inline-start: 2.5rem;
}

blockquote::before {
  content: "“";
  position: absolute;
  inset-inline-start: 0;
  inset-block-start: -0.25em;
  font-size: 3rem;
  line-height: 1;
  opacity: 0.65;
  pointer-events: none;
}
```

The quote text must remain real HTML content. Adjust punctuation for the language where necessary.

### Pattern F — A required-field visual marker

```css
.field-label[data-required="true"]::after {
  content: " *";
  color: #b42318;
}
```

Also expose required state with the actual form control (for example, the `required` attribute). Do not rely on the asterisk alone to communicate validation rules.

### Pattern G — A local corner badge

```css
.card {
  position: relative;
}

.card[data-featured="true"]::after {
  content: "Featured";
  position: absolute;
  inset-block-start: 0.75rem;
  inset-inline-end: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  background: #111827;
  color: white;
  pointer-events: none;
}
```

If “Featured” is important information, render it in the DOM instead of relying on generated content. This pattern is appropriate only for purely visual decoration or when the status is also represented elsewhere.

### Pattern H — A first-letter editorial treatment

```css
.article-intro::first-letter {
  float: left;
  font-size: 3.25em;
  line-height: 0.9;
  font-weight: 700;
  margin-inline-end: 0.12em;
}
```

Test opening quotation marks, diacritics, and the selected font before adopting it site-wide.

### Pattern I — Custom list marker with a marker element

```css
.checklist li::marker {
  color: currentColor;
  font-weight: 700;
}
```

Use native list markers whenever possible. For elaborate icon markers, consider whether real markup is clearer than a generated glyph.

### Pattern J — Selection styling

```css
::selection {
  color: white;
  background: #2347c5;
}
```

Check contrast and avoid depending on complex styles that are not supported for selection pseudo-elements.

### Pattern K — File input button styling

```css
input[type="file"]::file-selector-button {
  font: inherit;
  padding: 0.5rem 0.75rem;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  margin-inline-end: 0.75rem;
}
```

Keep the native control operable and test across target browsers.

### Pattern L — A modal backdrop

```css
dialog::backdrop {
  background: rgb(0 0 0 / 0.6);
}
```

Use with a real dialog and correct focus management; a backdrop alone does not make a page modal or accessible.

---

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Forgetting `content` on `::before` or `::after` | The generated box does not appear | Set `content: ""` for decoration or a meaningful string when appropriate |
| Putting essential instructions only in generated text | Assistive technology exposure varies | Put meaningful text in HTML |
| Creating a clickable pseudo-element | It lacks normal DOM semantics and focus behavior | Use a real button or link |
| Adding pseudo-elements to `img` expecting ordinary children | Replaced-element behavior differs | Attach decoration to a wrapper |
| Using `z-index` without understanding stacking contexts | Layering remains constrained by ancestors | Inspect the stacking context chain |
| Using a negative `z-index` without a local stacking context | Decoration can disappear behind ancestors | Consider `isolation: isolate` or simpler background styling |
| Forgetting `pointer-events: none` on a decorative overlay | Overlay blocks clicks or text selection | Exclude the decorative layer from hit testing |
| Putting the only required marker in CSS | Required state may not be communicated programmatically | Use native `required` and a visible label |
| Replacing a semantic list with generated numbers | List structure is lost | Keep `<ol>`/`<li>` and style markers |
| Assuming all `::marker` properties work | Marker styling supports a restricted property set | Use supported properties and test |
| Using `::first-line` to target a fixed phrase | The first line changes with layout | Use markup for editorially specific spans |
| Using `::first-letter` without testing punctuation | Initial glyph selection varies with text | Test quotes, diacritics, and languages |
| Styling placeholders instead of labels | Placeholder disappears and is not a robust label | Associate a visible `<label>` with the control |
| Using generated English words in localized UI | Generated text is not automatically translated | Use real localized content |
| Assuming `attr()` is universally typed | Advanced `attr()` forms have varying support | Use supported forms and test target browsers |
| Duplicating a real label with `attr()` | Screen and visual output can become repetitive | Generate only supplemental information |
| Animating the only state indicator | Reduced-motion users may miss the state | Provide a stable non-motion indicator |
| Removing focus styles when adding underlines | Keyboard focus becomes ambiguous | Keep visible `:focus-visible` styling |
| Hardcoding `left`/`right` for decorations | RTL layouts become inconsistent | Use logical inset and margin properties |
| Making a pseudo-element overlay cover controls | Pointer and focus interaction can be blocked | Keep overlays decorative and use `pointer-events: none` |
| Using a pseudo-element for a tooltip with essential content | Content and interaction are difficult to expose accessibly | Use a real tooltip/popover implementation |
| Treating CSS-generated content as guaranteed screen-reader text | Exposure differs by browser/AT | Keep essential meaning in HTML |
| Using counters without defining reset scope | Nested lists can get unexpected numbering | Define reset/increment levels intentionally |
| Using a pseudo-element where a border would work | CSS becomes harder to maintain | Prefer the simplest property that meets the design |
| Relying on a generated icon font glyph without fallback | Missing glyphs render as boxes or nothing | Use a robust icon strategy and accessible text |
| Ignoring forced-colors mode | Background-only markers may disappear | Provide semantic equivalents for meaningful state |
| Removing all generated content in print | Important information can be lost | Remove only decorative output |
| Using a pseudo-element for a badge's only status label | Status may be invisible to some users | Put important status in the DOM |
| Forgetting `position: relative` on the intended host | Absolute decoration anchors to the wrong ancestor | Establish the intended containing block |
| Using a large pseudo-element without checking overflow | Decoration can cause clipping or scrollbars | Bound its geometry and inspect ancestors |
| Assuming pseudo-elements are always faster than markup | Complexity can exceed any benefit | Choose based on component clarity |
| Applying broad `a::after` styles globally | Unrelated links get unexpected decoration | Scope selectors to a component class |
| Using an arrow as the only external-link warning | Meaning may be ambiguous | Add real text or accessible disclosure if necessary |
| Ignoring reduced motion | Animation may cause discomfort | Respect `prefers-reduced-motion` |
| Forgetting contrast for `::selection` | Selected text becomes hard to read | Choose contrasting foreground and background |
| Styling `::placeholder` with very low contrast | Hints become difficult to read | Meet contrast needs and keep visible labels |
| Using `pointer-events: none` on an intended interactive layer | The interaction cannot receive pointer input | Reserve it for purely decorative layers |
| Assuming `content: none` is the same as empty text | It suppresses generated content | Use `content: ""` for an empty decorative box |
| Forgetting font loading for generated symbols | Symbol may render differently or be missing | Prefer robust Unicode/CSS shapes and test fallbacks |
| Using pseudo-elements to create complex component structure | Styling logic becomes opaque | Add explicit semantic markup where it clarifies ownership |

---

## Mental Models

1. **Pseudo-elements are presentation hooks.** They are not replacements for semantic HTML.
2. **Meaning belongs in the DOM.** Generated content should not be the only source of important information.
3. **Empty content can still make a box.** `content: ""` plus dimensions and styling creates decorative geometry.
4. **Stacking and hit testing are separate concerns.** `z-index` controls painting order within contexts; `pointer-events` affects pointer targeting.
5. **A clipping ancestor still clips.** A pseudo-element cannot escape overflow clipping just because its `z-index` is high.
6. **Use the simplest tool.** A border or background is often better than a pseudo-element.
7. **Logical properties support direction changes.** Avoid assuming all content flows left to right.
8. **Native semantics are valuable.** Style list markers before replacing them.
9. **Pseudo-elements have limited interaction affordances.** Use real controls for focus, events, and accessible naming.
10. **Decorative layers should not block the interface.** Keep them out of hit testing when appropriate.
11. **Content changes across widths.** `::first-line` and balanced wrapping are layout-dependent.
12. **Generated text is not automatically localized.** Keep strings in the proper content system.
13. **A visual indicator is not always a programmatic state.** Use native attributes and real text where needed.
14. **Maintainability beats cleverness.** A clear wrapper is better than a fragile stack of pseudo-elements.

---

## Quick Reference

| Task | Technique | Caution |
|---|---|---|
| Add a decorative shape | `::before`/`::after` with `content: ""` | Give the box dimensions and a clear purpose |
| Add an arrow after a link | `content: " ↗"` | Keep essential disclosure elsewhere |
| Animate an underline | Positioned pseudo-element and transform | Preserve visible keyboard focus |
| Overlay a gradient on media | Pseudo-element on a wrapper | Use `pointer-events: none` |
| Style native list marker | `li::marker` | Supported properties are limited |
| Style initial letter | `::first-letter` | Test punctuation and diacritics |
| Style selected text | `::selection` | Keep contrast high |
| Style placeholder | `::placeholder` | Never replace the input label |
| Display attribute text | `content: attr(data-label)` | Missing attributes can produce incomplete output |
| Number steps | CSS counters | Keep semantic ordered-list markup |
| Style modal backdrop | `dialog::backdrop` | Use real dialog behavior and focus management |
| Style file input button | `::file-selector-button` | Test native control behavior |
| Keep decorative layer click-through | `pointer-events: none` | Only for noninteractive decoration |
| Support RTL | Logical inset/margin/border properties | Test direction and transform origin |
| Disable decorative motion | `prefers-reduced-motion` | Preserve a stable state indicator |
| Debug missing pseudo-element | Check selector, `content`, box, position, clipping, stack | Inspect computed styles before rewriting |

---

## Build Challenge — Pseudo-Element Component Lab

Create a reusable component set for a documentation site: navigation links, an article quotation, numbered steps, image cards, a file input, a form field, and a modal dialog. Use pseudo-elements only where they improve presentation without hiding meaningful content.

### Requirements

1. Use semantic HTML for navigation, article, lists, form controls, and dialog.
2. Create a decorative arrow after external links.
3. Keep any essential external-link disclosure in real text or accessible description.
4. Add an animated underline to navigation links.
5. Provide visible `:focus-visible` styling.
6. Respect `prefers-reduced-motion`.
7. Ensure underline animation does not remove the default link affordance without replacement.
8. Add a gradient overlay to an image wrapper, not directly to the image.
9. Set `pointer-events: none` on the purely decorative overlay.
10. Verify that links and buttons remain clickable beneath decorative layers.
11. Create a quotation-mark decoration for a blockquote.
12. Keep the quote itself as real HTML text.
13. Create a numbered step list with CSS counters.
14. Preserve `<ol>` and `<li>` semantics.
15. Test counter reset behavior with nested lists.
16. Style native list markers with `::marker` in a separate example.
17. Keep marker styling within supported properties.
18. Add a custom required-field marker.
19. Use the real `required` attribute on the input.
20. Associate every form control with a visible label.
21. Style placeholder text without relying on it as a label.
22. Style text selection with readable contrast.
23. Test selection styles in the target browsers.
24. Style a file input using `::file-selector-button`.
25. Verify native keyboard operation and focus behavior.
26. Style a real dialog's `::backdrop`.
27. Do not treat the backdrop as a replacement for dialog semantics or focus management.
28. Use logical inset properties for decorative positioning.
29. Test the interface in an RTL layout.
30. Test accented letters and punctuation in the first-letter example.
31. Confirm generated content is not the sole source of status or instructions.
32. Verify every pseudo-element has the intended computed `content` value.
33. Inspect the containing block for each positioned pseudo-element.
34. Inspect ancestor overflow and stacking contexts.
35. Confirm decorative layers do not create unwanted scrollbars.
36. Test forced-colors or high-contrast settings where available.
37. Test print output and preserve any meaningful information.
38. Scope pseudo-element selectors to component classes.
39. Prefer normal borders/backgrounds when they are simpler.
40. Document why each pseudo-element exists and what would change if it were removed.

### Acceptance checklist

- [ ] Essential content and labels exist in semantic HTML.
- [ ] Pseudo-elements are used for decoration or supplemental presentation.
- [ ] Interactive controls are real focusable DOM elements.
- [ ] Decorative overlays do not block clicks or selection.
- [ ] Keyboard focus is visible.
- [ ] Motion preferences are respected.
- [ ] Counters and list markers preserve semantics.
- [ ] RTL, localization, contrast, and print behavior are considered.
- [ ] All pseudo-elements render as intended in computed styles.
- [ ] Every pseudo-element has a clear maintainability justification.

## Final Engineering Checklist

Before shipping pseudo-element styling, ask:

- Is this visual detail truly decorative or supplemental?
- Would a normal border, background, or real element be clearer?
- Is essential text or status available in the DOM?
- Does the pseudo-element need focus, interaction, or accessible attributes?
- Is `content` set correctly?
- Is the containing block the one intended?
- Can an ancestor clip the decoration?
- Can the layer block pointer input or text selection?
- Does the stacking order behave inside the actual component context?
- Are logical properties used where direction can change?
- Does the design remain usable with reduced motion, forced colors, and print?
- Have target browsers and assistive technology behavior been considered?
- Can another developer understand why this pseudo-element exists?

Use pseudo-elements to remove visual noise from markup, not to hide meaningful structure. The best implementation is the one that keeps the DOM honest, the CSS understandable, and the interface accessible.
