# SKILL: css-selectors-advanced

## Layer
01 — CSS Foundation

## Goal
Select elements precisely and maintainably with advanced CSS selectors, without adding unnecessary classes, over-specifying components, or making styles brittle.

## Why This Matters (Senior Perspective)

Selectors are part of a component's public styling interface. A selector can be technically correct today and still become a maintenance problem when markup changes, when a component is reused in a different context, or when another rule has to override it. Senior CSS work is not about writing the most clever selector. It is about expressing the intended relationship clearly, keeping specificity predictable, and making the cascade easy to reason about.

Advanced selectors are especially valuable when they describe a real relationship in the document: a field with invalid state, a card that contains a particular control, a heading followed by supporting text, or a navigation item that is the current page. They are less valuable when they reconstruct a component's entire DOM path or depend on incidental markup such as the fourth wrapper inside a page.

Use a selector because it communicates a stable rule—not because it saves one class at the cost of future debugging.

## Core Concepts

### 1. Selector anatomy and matching

A selector is a pattern matched against elements in the document tree. A compound selector combines simple selectors without a combinator; a complex selector combines compounds with relationships.

```css
/* Compound: one element that satisfies all conditions */
.card.featured[data-state="ready"] {}

/* Complex: a featured card that contains a title descendant */
.card.featured .card__title {}
```

A compound selector such as `button.primary[aria-pressed="true"]` matches a single button that has all three characteristics. The selector `.toolbar button` describes a relationship between two elements: a button somewhere inside a toolbar.

**Gotcha:** A space is a descendant combinator. It does not mean “direct child.” If the markup gains another wrapper, `.toolbar button` still matches; ` .toolbar > button` does not cross that wrapper.

### 2. Specificity is a three-column comparison

Specificity is commonly represented as `(ID, CLASS, TYPE)`. Count ID selectors in the first column, class/attribute/pseudo-class selectors in the second, and type/pseudo-element selectors in the third. Combinators and the universal selector do not add specificity.

```css
/* (0, 1, 1) */
input.field {}

/* (1, 0, 0) */
#checkout-email {}

/* (0, 2, 1) */
form.checkout input[required] {}
```

Compare columns from left to right; do not add the columns into one score. An ID selector beats any number of class selectors under ordinary specificity comparison because the first column is compared before the second.

Specificity is only one part of the cascade. Origin, importance, cascade layers, and scope/order can matter too. A selector with lower specificity can win when cascade layers or importance make it take precedence.

**Gotcha:** Specificity is not a complete explanation of every conflict. First inspect whether declarations are important, which origin they come from, and whether cascade layers are involved.

### 3. The descendant combinator

The descendant combinator (a space) matches an element anywhere below another element.

```css
.article p {}

/* Matches paragraphs at any depth inside .article */
```

This is flexible, but it can leak into nested components. If a card contains a quoted article with its own paragraphs, `.card p` may style both the card's summary and the quote's content. Prefer component-specific classes or a more meaningful relationship when nested structures are possible.

### 4. Child combinator (`>`)

The child combinator matches only direct children.

```css
.menu > .menu__item {}
```

Use it when direct parent-child structure is genuinely part of the design contract, such as a list component whose immediate list items define its layout. Avoid using it merely to increase specificity or to compensate for poor naming.

**Gotcha:** `>` makes selectors sensitive to wrapper changes. Before using it, decide whether an extra wrapper should legitimately change the styling behavior.

### 5. Adjacent sibling (`+`) and general sibling (`~`)

The adjacent sibling combinator selects the immediately following sibling that shares the same parent.

```css
.field-label + .field-control {}
```

The general sibling combinator selects matching later siblings under the same parent.

```css
.validation-message ~ .help-link {}
```

Use sibling selectors for real sequence relationships, such as spacing after a heading or changing a label when a control follows. Remember that `+` only targets the next element sibling, while `~` can target any later matching sibling.

```css
/* Every paragraph immediately after another paragraph */
p + p {
  margin-block-start: 1rem;
}
```

This pattern can create rhythm without requiring a utility class on every paragraph, but it should be scoped to the content component whose rhythm it defines.

### 6. Attribute selectors

Attribute selectors target the presence or value of attributes.

```css
/* Presence */
input[required] {}

/* Exact value */
button[data-state="loading"] {}

/* Begins with */
a[href^="https://"] {}

/* Ends with */
a[href$=".pdf"] {}

/* Contains a substring */
a[href*="docs"] {}

/* Space-separated token */
[aria-describedby~="email-error"] {}

/* Hyphen-separated prefix */
[lang|="en"] {}
```

The operators are not interchangeable. `~=` matches a whole whitespace-separated token; `|=` matches an exact value or a value followed by a hyphen; `^=`, `$=`, and `*=` match string patterns. Attribute matching can be case-sensitive depending on the attribute and selector flags.

Attribute selectors are especially useful for native states and machine-readable component states, but avoid selecting presentation from arbitrary content values unless the attribute is a stable contract.

**Gotcha:** `[class*="icon"]` is a substring match, not a class-token match. It may match `iconic`, `no-icon`, or unrelated values. Prefer `.icon` when the class itself is the intended API.

### 7. Attribute selector flags (`i` and `s`)

CSS supports flags that control case sensitivity for attribute-value matching in supporting browsers.

```css
/* ASCII case-insensitive matching */
a[href$=".pdf" i] {}

/* Explicit case-sensitive matching */
[data-code="AbC" s] {}
```

Use `i` when the data is intended to be compared without ASCII case sensitivity. Use `s` only when you need to make case-sensitive intent explicit and support is appropriate for the project. Do not add flags reflexively; first understand the attribute's defined matching behavior.

### 8. Class-token and attribute-state selectors

Class selectors such as `.is-open` are often clearer than broad substring matching. Attribute state can also be useful when the state is represented semantically:

```css
[aria-expanded="true"] {}
[aria-current="page"] {}
[aria-invalid="true"] {}
[data-status="error"] {}
```

Choose one consistent component state API. Avoid maintaining the same state independently in a class, a data attribute, and an ARIA attribute unless each has a distinct purpose. ARIA attributes must reflect the real accessible state, not be added solely to make CSS convenient.

**Gotcha:** Do not set `aria-invalid="true"` merely to color a field red. Set it only when the control is actually invalid according to the interface's validation logic.

### 9. Structural pseudo-classes: `:first-child`, `:last-child`, and `:only-child`

These pseudo-classes describe an element's position among element siblings.

```css
.list-item:first-child {}
.list-item:last-child {}
.empty-state:only-child {}
```

They are useful for list edge treatment, removing trailing borders, and special single-item states. They do not mean “first element of this class” if a different element appears before it. `:first-of-type` and `:last-of-type` answer a different question based on element type.

### 10. `:nth-child()` and `:nth-of-type()`

`:nth-child()` selects by sibling position; `:nth-of-type()` selects by position among siblings of the same element type.

```css
/* Every other direct child */
.grid > :nth-child(2n) {}

/* Third paragraph among paragraph siblings */
.article p:nth-of-type(3) {}
```

The `An+B` formula is a sequence: `2n` selects even positions, `2n+1` odd positions, `3n` every third, `n+4` positions four onward, and `-n+3` the first three.

```css
/* First three items */
.results > .result:nth-child(-n + 3) {}

/* Every third item, starting at the third */
.results > .result:nth-child(3n) {}
```

Selectors count element siblings, not text nodes or whitespace. `:nth-child()` counts all element types among siblings, while `:nth-of-type()` counts only the same element type.

**Gotcha:** A selector like `.card:nth-child(3)` means “a `.card` that is the third element child,” not “the third `.card`.” Intervening sibling elements affect the result.

### 11. The `of S` filter in `:nth-child()`

Modern selector syntax allows filtering the sibling set before applying the position formula:

```css
/* Third .card among siblings that match .card */
:nth-child(3 of .card) {}

/* Every other enabled option */
.option:nth-child(2n of .option:not([aria-disabled="true"])) {}
```

This differs from `.card:nth-child(3)`: the `of S` syntax counts only elements matching `S` for the positional calculation. Use it when a list mixes element types or state variants and the position should be measured within a subset. Confirm the browser support target for the application.

### 12. Negation with `:not()`

`:not()` excludes elements that match its argument.

```css
button:not(:disabled) {}
.card:not(.is-muted) {}
input:not([type="hidden"]) {}
```

Use it for simple exceptions, but keep the positive intent obvious. A chain of exclusions often becomes difficult to understand and may hide a missing base class.

```css
/* Usually clearer than a long chain of exclusions */
.button {}
.button--primary {}
.button--danger {}
```

**Gotcha:** `:not()` contributes specificity based on its most specific argument (with modern selector-list behavior). It is not a specificity reset. Use `:where()` when a low-specificity grouping is the goal.

### 13. `:is()` for selector grouping

`:is()` groups alternatives inside a selector.

```css
:is(h1, h2, h3, h4) {
  text-wrap: balance;
}

.article :is(ul, ol) {
  padding-inline-start: 1.5rem;
}
```

It can remove repetition and make complex relationships easier to scan. Its specificity is the specificity of the most specific selector in its argument list, not the specificity of whichever branch happened to match.

**Gotcha:** A high-specificity alternative inside `:is()` can raise the specificity of every match. Keep its argument list intentional.

### 14. `:where()` for zero-specificity grouping

`:where()` behaves like `:is()` for matching, but the pseudo-class and its arguments contribute zero specificity.

```css
:where(.article, .documentation) h2 {
  margin-block-start: 2em;
}
```

This is valuable for defaults and design-system base rules that consumers should be able to override with ordinary component classes. It is also useful for scoping styles without creating specificity debt.

```css
/* Low-specificity base rules */
:where(.prose) :where(h1, h2, h3) {
  line-height: 1.15;
}
```

**Gotcha:** Zero specificity is a deliberate trade-off. If two low-specificity rules conflict, source order and other cascade dimensions decide the winner. Keep the rules organized rather than relying on accidental order.

### 15. Relational selector `:has()`

`:has()` matches an element when its relative selector argument matches in relation to it. It can express parent-like or previous-sibling-dependent conditions that used to require a class maintained by JavaScript.

```css
/* A card containing a media element */
.card:has(.card__media) {}

/* A form field containing an invalid control */
.form-field:has(:invalid) {}

/* A heading followed by a subtitle */
.section:has(> h2 + .section__subtitle) {}
```

Use it to reflect a meaningful content relationship, such as a form group that contains an invalid input or a card that includes media. Keep the relationship narrow and test realistic page sizes. Avoid broad page-wide relational selectors that repeatedly inspect huge subtrees without a clear need.

**Gotcha:** `:has()` is powerful but can make the styling contract less obvious if used everywhere. Prefer a component state class when the state is explicit, shared across multiple behaviors, or needs to be set by application logic.

### 16. `:has()` with sibling relationships

`:has()` can inspect following or preceding siblings relative to an element.

```css
/* Style a label when the next sibling input is checked */
.choice:has(+ input:checked) {}

/* A heading section with a later callout */
.section:has(~ .callout) {}
```

The exact selector depends on the DOM relationship. In many forms, placing the input and label in a predictable order—or wrapping them in a label—makes the markup and accessible interaction clearer than relying on a complicated selector. Do not restructure accessible markup only to satisfy a selector trick.

### 17. Form-state pseudo-classes

Form pseudo-classes represent browser-recognized control states.

```css
input:required {}
input:optional {}
input:valid {}
input:invalid {}
input:disabled {}
input:enabled {}
input:checked {}
input:indeterminate {}
```

They can support progressive enhancement, but native validity is not the same as whether the user has attempted to submit a form. Styling every untouched required field as invalid can create a noisy interface.

```css
/* A common pattern when the design tracks attempted interaction */
form[data-submitted="true"] :invalid {
  border-color: var(--color-danger);
}
```

If JavaScript sets `data-submitted`, ensure it is synchronized with actual form submission and validation. For accessibility, pair color with text or other non-color cues and provide understandable error messages.

**Gotcha:** `:invalid` may match an empty required field before the user interacts with it. Decide whether the product wants immediate, on-blur, or submit-time feedback.

### 18. `:focus`, `:focus-visible`, and `:focus-within`

`:focus` matches the focused element. `:focus-visible` lets the browser determine when a visible focus indicator is especially needed, often for keyboard navigation. `:focus-within` matches an element when it or a descendant has focus.

```css
.button:focus-visible,
.link:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.field:focus-within {
  border-color: var(--color-focus);
}
```

Never remove focus indication without replacing it with a clearly visible alternative. A parent highlight from `:focus-within` supplements rather than replaces a visible indicator on the control itself.

**Gotcha:** Do not use `outline: none` as a cosmetic reset unless a strong, accessible replacement is implemented for every relevant focus state.

### 19. Link and navigation states

Use link pseudo-classes to style interaction and current location. Keep link states distinguishable and ensure contrast.

```css
a:link {}
a:visited {}
a:hover {}
a:active {}
a:focus-visible {}
[aria-current="page"] {}
```

`:visited` has privacy-related styling restrictions, so it cannot expose arbitrary state through every CSS property. For application navigation, `aria-current="page"` is often a robust way to represent the current page when the application sets it correctly.

### 20. `:empty` and content-sensitive matching

`:empty` matches elements that have no child elements and no text nodes. Whitespace text nodes can affect matching behavior depending on the exact markup and current selector support. Use it cautiously for optional placeholders, but do not rely on it as a substitute for explicit empty-state logic.

```css
/* Only if truly empty content is part of the component contract */
.status-message:empty {
  display: none;
}
```

A deliberate empty-state element is often better because it communicates to users what happened and can include helpful next actions.

### 21. Pseudo-elements are not pseudo-classes

Pseudo-classes select elements in a state or relationship; pseudo-elements style a specific part or generated content of an element.

```css
.button::before {}
.input::placeholder {}
.selection::selection {}
```

Use double-colon syntax for pseudo-elements. Some legacy single-colon forms remain supported, but modern code should use `::before`, `::after`, and `::placeholder`.

### 22. Selector lists and forgiving parsing

A comma-separated selector list means “match any of these selectors,” but an invalid selector in an ordinary selector list can invalidate the entire rule. `:is()` and `:where()` have forgiving selector-list parsing behavior for many invalid arguments, while other contexts may have different rules.

```css
:is(.card, .panel) {}

/* Keep separate rules when compatibility differs */
.card {}
.panel {}
```

When supporting a broad browser matrix, avoid putting a selector with limited support into a selector list that would otherwise work in older browsers. Verify support rather than assuming that all modern selector features are universal.

### 23. Cascade layers and selector design

Cascade layers provide a way to organize precedence independent of selector specificity across layers.

```css
@layer reset, base, components, utilities;

@layer base {
  :where(h1, h2, h3) {
    line-height: 1.15;
  }
}

@layer components {
  .card__title {
    line-height: 1.2;
  }
}
```

Within the same origin and importance category, layer order can decide which declarations win before specificity is compared. This means selector architecture and layer architecture should be designed together. Do not keep escalating specificity to defeat a rule that belongs in a different layer.

**Gotcha:** For normal declarations, later layers generally outrank earlier layers; important declarations reverse layer precedence. Check the cascade rules before debugging a specificity conflict.

### 24. Scope and component boundaries

A selector should communicate where a rule belongs. Scope a content rule to a component or content region rather than styling every matching element globally.

```css
.article-content > :where(h2, h3) {
  margin-block-start: 1.5em;
}

.product-card:has(.product-card__badge) {
  /* badge-present variation */
}
```

Use stable component classes for the primary contract, and use relational selectors for genuine variations within that contract. Avoid coupling a reusable component to page-level wrappers such as `.page main .layout > div:nth-child(2) .card`.

### 25. Specificity management with `:where()`

One effective design-system strategy is to keep foundational selectors at zero or low specificity and reserve stronger selectors for meaningful states.

```css
@layer base {
  :where(button, input, select, textarea) {
    font: inherit;
  }
}

@layer components {
  .button {}
  .button:focus-visible {}
}
```

This allows a component class to override the base without a specificity arms race. Use IDs rarely for styling. Prefer a small set of documented state classes and semantic attributes over deep selector chains.

### 26. CSS nesting and selector readability

Native CSS nesting can reduce repeated parent selectors, but it does not make an unclear selector clearer.

```css
.card {
  & .card__title {
    font-weight: 700;
  }

  &:has(.card__media) {
    grid-template-rows: auto 1fr;
  }
}
```

Keep nesting shallow and make the generated selector easy to infer. Be careful with nesting selectors inside `:is()`-like grouping constructs because specificity follows the rules of the resulting selector structure. If a nested rule hides a long selector or raises specificity unexpectedly, flatten it.

### 27. Selector performance: prioritize clarity, then measure

Modern browsers optimize selector matching, and a simplistic “right-to-left means every attribute selector is slow” rule is not a useful reason to avoid expressive CSS. More important concerns are broad matching scope, invalidation cost when DOM or state changes, and maintainability.

Prefer a clear component-scoped selector:

```css
.checkout-form:has(input:invalid) {}
```

over a global relationship that reaches across the whole document:

```css
body:has(.checkout-form input:invalid) {}
```

Measure actual performance if a large dynamic interface exhibits a problem. Do not trade away correctness or semantic clarity based on folklore.

**Gotcha:** Selector speed micro-optimizations without profiling often create brittle markup dependencies while solving no measurable issue.

### 28. Testing selectors with realistic markup

Test selectors against more than the happy-path DOM. Include missing optional elements, nested components, disabled controls, multiple instances, mixed sibling types, and dynamically changing states.

```html
<section class="card">
  <h2 class="card__title">Plan A</h2>
  <p class="card__summary">Summary</p>
</section>

<section class="card">
  <div class="card__media" aria-hidden="true"></div>
  <h2 class="card__title">Plan B</h2>
</section>
```

Ask: Does the selector match only the intended component? Does it still work when a wrapper is introduced? Does it accidentally style a nested card? Is the state represented accurately in the DOM?

### 29. Debugging a selector mismatch

Use browser developer tools to inspect the element, view matched rules, toggle declarations, and check computed styles. For selectors that fail to match, reduce the selector gradually until the failing relationship becomes clear.

A reliable debugging sequence:

1. Confirm the element exists in the rendered DOM.
2. Test the simplest type or class selector.
3. Add one attribute or pseudo-class at a time.
4. Check the exact sibling/parent relationship.
5. Inspect specificity, cascade layers, importance, and source order only after confirming the selector matches.
6. Test the relevant state (focus, checked, invalid, current page) in the browser.
7. Re-check after JavaScript updates the DOM or attributes.

**Gotcha:** A rule that appears in DevTools but is crossed out has matched; the problem is likely the cascade. A rule absent from the matched-rules list is more likely a selector or stylesheet-loading problem.

### 30. Choosing between a selector and a class

Use a selector when the style follows a stable relationship or browser state. Use a class or explicit state attribute when the application owns a named state or when the relationship is important enough to be a documented API.

| Situation | Prefer | Reason |
|---|---|---|
| Keyboard focus indicator | `:focus-visible` | Browser focus modality |
| Current navigation item | `[aria-current="page"]` | Semantic current-page state |
| Parent card contains optional media | `.card:has(.card__media)` or a variant class | Choose based on support and whether the variant is explicit |
| A named loading state | `.is-loading` or `[data-state="loading"]` | Clear component contract |
| Every second sibling | `:nth-child(2n)` | Position is the rule |
| A reusable button variant | `.button--primary` | Explicit design-system API |
| A form field contains invalid input | `.field:has(:invalid)` | Relationship-based presentation, if interaction timing is suitable |
| A special page section | `.page-section--featured` | Named product intent, not incidental structure |

The most maintainable selector is the one that makes the reason for the style obvious to the next developer.

## Reusable Patterns

### Pattern 1 — Low-specificity content defaults

```css
@layer base {
  :where(.prose) :where(h1, h2, h3, p, ul, ol) {
    margin-block: 0;
  }

  :where(.prose) :where(h1, h2, h3) {
    line-height: 1.15;
    text-wrap: balance;
  }
}
```

Use for content regions with predictable baseline rules. Keep these declarations in a base layer so component-specific styles can override them without escalating selector specificity.

### Pattern 2 — Spacing between adjacent content blocks

```css
.prose > * + * {
  margin-block-start: var(--prose-flow-space, 1em);
}
```

This applies spacing to each direct child after the first, including mixed element types. It avoids styling every possible element type separately. Exclude special elements with a documented modifier when needed.

### Pattern 3 — Form field state with accessible feedback

```css
.form-field:has(input:focus-visible),
.form-field:has(select:focus-visible),
.form-field:has(textarea:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.form-field [aria-invalid="true"] {
  border-color: var(--color-danger);
}

.form-field__error {
  color: var(--color-danger);
}
```

This illustrates a relationship-based wrapper state and a semantic invalid state. Ensure that the field control itself retains a visible focus indicator and that the error message is associated with the control using `aria-describedby`.

### Pattern 4 — Navigation current state

```css
.primary-nav a[aria-current="page"] {
  font-weight: 700;
  text-decoration-thickness: 0.15em;
  text-underline-offset: 0.2em;
}
```

The application should set `aria-current="page"` only on the current page's link. Keep a non-color distinction so the current location is not communicated through color alone.

### Pattern 5 — Robust list edge styling

```css
.list > :first-child {
  border-block-start: 0;
}

.list > :last-child {
  border-block-end: 0;
}

.list > :nth-child(2n) {
  background: var(--color-row-alternate);
}
```

Use only when the element order is part of the component's design. If the list may contain headings, separators, or non-row elements, constrain the selector to a specific item class or use `of S` where supported.

### Pattern 6 — Cards with optional media

```css
.product-card {
  display: grid;
  grid-template-columns: 1fr;
}

.product-card:has(> .product-card__media) {
  grid-template-columns: minmax(0, 8rem) minmax(0, 1fr);
}
```

The selector expresses the real condition: a direct media child exists. Check narrow layouts and browser support. If the media-present state is already known by the component renderer and drives several styles, a variant class may be clearer.

### Pattern 7 — State-driven button styling

```css
.button[aria-pressed="true"] {
  background: var(--color-selected);
}

.button:disabled,
.button[aria-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.65;
}
```

Use native `disabled` when a native button truly cannot be activated. `aria-disabled` communicates a state but does not itself prevent activation; JavaScript must enforce that behavior where appropriate.

### Pattern 8 — Interaction-safe focus-within

```css
.search-box:focus-within {
  border-color: var(--color-focus);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-focus) 25%, transparent);
}

.search-box input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

The wrapper helps users see which composite control is active; the input still has a clear focus indicator. Verify contrast in every theme.

### Pattern 9 — Target only links with a file extension

```css
a[href$=".pdf" i]::after {
  content: " (PDF)";
  font-size: 0.875em;
}
```

This is a simple illustration of attribute matching. For a production interface, consider whether the file type should also be announced in the link text or accessible name, and do not rely on generated content alone for essential information.

### Pattern 10 — Progressive enhancement with relational selectors

```css
@supports selector(.card:has(.card__media)) {
  .card:has(> .card__media) {
    grid-template-columns: 10rem minmax(0, 1fr);
  }
}
```

Keep a useful default layout outside the feature query. Use a feature query when the fallback is meaningful and the support matrix requires it; do not wrap every modern selector reflexively.

### Pattern 11 — Exception handling without specificity escalation

```css
.notice {
  padding: 1rem;
}

.notice--compact {
  padding: 0.5rem;
}
```

When an exception represents a named design variant, express it with a variant class rather than an increasingly complex `:not()` chain. This makes intent discoverable and easier to test.

### Pattern 12 — Group related states without hiding intent

```css
:is(.button, .link-button):focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

Use grouping to share genuinely identical behavior. If one alternative has much higher specificity, remember that it raises the specificity of the entire `:is()` selector; `:where()` may be preferable for low-priority defaults.

## Common Mistakes

| Mistake | Why it fails | Better approach |
|---|---|---|
| Using a descendant selector for a direct-child contract | Nested elements are matched unintentionally | Use `>` when direct structure is genuinely required |
| Using `>` only to boost specificity | Couples styles to markup without expressing intent | Use component classes or layers to control the cascade |
| Treating specificity as an additive score | Hides the left-to-right column comparison | Compare ID, class/attribute/pseudo-class, then type/pseudo-element columns |
| Assuming specificity always decides the winner | Ignores origin, importance, and cascade layers | Inspect the complete cascade |
| Styling with IDs | Makes overrides unnecessarily difficult | Use class-based component APIs |
| Using `[class*="icon"]` | Substring matches unrelated class values | Use `.icon` or a token-aware approach |
| Confusing `~=` with `*=` | Token matching differs from substring matching | Choose the operator that matches the attribute format |
| Assuming `:nth-child(3)` means third matching class | Position is among all element siblings | Use `:nth-child(3 of .item)` where supported, or a deliberate class |
| Confusing `:nth-of-type()` with class-based position | It counts tag names, not classes | Use `of S` or explicit item classes |
| Overusing `:not()` | Long exclusion chains obscure positive intent | Prefer named variants and simple base rules |
| Forgetting `:not()` specificity | Exclusions can raise specificity | Use `:where()` for zero-specificity grouping |
| Putting high-specificity branches in `:is()` | The highest argument specificity affects the group | Keep grouped selectors specificity-compatible |
| Using `:has()` for every state | Creates hidden and difficult-to-discover component logic | Use it for genuine relationships; use named state APIs for explicit states |
| Applying `:has()` to the whole page without need | Broad relationships complicate reasoning and may increase invalidation work | Scope relational selectors to the component |
| Assuming `:has()` is supported in every target browser | May break the intended styling on older targets | Check support and provide a useful fallback |
| Styling `:invalid` immediately without considering UX | Empty required controls may look broken before interaction | Align validation visuals with the product's feedback timing |
| Using ARIA attributes only for styling | Creates inaccurate accessibility semantics | Reflect the actual state and use classes for purely visual variants |
| Removing outlines | Keyboard users can lose their position | Provide a strong `:focus-visible` indicator |
| Relying on color alone for current or error states | State may be missed by users with color-vision differences | Add text, iconography, shape, or other non-color cues |
| Using `:empty` as business logic | Whitespace or placeholder content can change the match | Render an explicit empty state when the state matters |
| Combining unsupported selectors in a plain selector list | One invalid selector can invalidate the rule | Separate compatibility-sensitive rules or use supported forgiving grouping |
| Deeply nesting selectors | Hides the effective selector and makes refactors risky | Keep nesting shallow and selectors readable |
| Using a selector based on incidental wrapper order | Small markup changes silently break styles | Select a named component or meaningful relationship |
| Assuming all selector-performance folklore is true | Leads to needless complexity without evidence | Profile real bottlenecks before optimizing |
| Fixing cascade problems with increasingly long selectors | Creates specificity debt | Review layer order, component boundaries, and rule ownership |
| Styling all paragraphs inside a card when only the summary is intended | Nested quotes and widgets inherit unintended styles | Use `.card__summary` or a clearly scoped child relationship |
| Using generated content as the only accessible label | Essential meaning may not be exposed consistently | Put essential text in the document and use generated content decoratively |
| Using `aria-disabled` without preventing activation | ARIA does not implement disabled behavior | Enforce interaction logic or use native `disabled` |
| Forgetting dynamic state updates | CSS reflects stale attributes or classes | Keep application state and DOM attributes synchronized |
| Failing to test mixed siblings | Positional selectors can shift unexpectedly | Test realistic DOM variations and use `of S` or item classes |
| Using `:focus-within` as a replacement for control focus | Parent highlighting may not clearly identify the focused control | Keep a visible indicator on the focused control |
| Overusing attribute selectors for application state | Attribute strings become undocumented styling APIs | Define and document stable state conventions |
| Assuming `:visited` permits arbitrary styling | Browsers restrict visited-link styling for privacy | Use only supported visited styles and avoid state leaks |
| Misreading a crossed-out DevTools declaration | The selector matched but lost in the cascade | Inspect the winning declaration, layer, importance, and source order |
| Debugging specificity before checking whether the selector matches | Solves the wrong problem | Verify DOM relationships and matched rules first |
| Forgetting that `:where()` has zero specificity | Assumes the grouped selector will override component rules | Treat it as a low-priority base rule and organize layers |
| Using `:nth-child()` for semantic meaning | Layout position may change as content changes | Represent semantic variants in markup |
| Selecting all external links by substring alone | Values such as internal URLs or query strings may be misclassified | Use reliable URL conventions and clear link text |
| Adding `!important` to patch selector design | Makes future overrides harder | Correct layer/order/specificity and reserve importance for justified global constraints |
| Using a class and data attribute for the same state with no contract | State can drift and styles become unpredictable | Choose one canonical state representation |
| Writing a clever selector that teammates cannot explain | Raises maintenance cost | Prefer a straightforward class or state API |
| Skipping keyboard and screen-reader review | Visual correctness can mask accessibility errors | Test focus, names, state announcements, and error associations |
| Ignoring browser support for newer selector syntax | A modern rule may not apply on the target platform | Define the browser matrix and use feature queries or fallbacks |
| Treating a selector as a substitute for component architecture | CSS becomes coupled to accidental document structure | Design stable component boundaries and explicit variants |
| Using `:has()` when the app already knows the variant | Duplicates state logic | Use a variant class if it is the canonical, reusable state |
| Applying global `:nth-child()` to a list with separators | Alternation follows all siblings, not just data rows | Restrict the selector to rows or filter with `of S` |
| Relying on generated PDF labels without meaningful link text | File type may be missed in some contexts | Include the file type in accessible link text when important |
| Not checking browser support for `of S` | Position filtering may not work on all targets | Verify support or use explicit classes as fallback |
| Letting selector cleverness dictate HTML structure | Can harm semantics and accessibility | Start from correct HTML and select its meaningful relationships |

## Mental Models

1. **Selectors are queries over a tree.** Ask which node you want and which relationship makes it eligible.
2. **Combinators are relationship contracts.** A space, `>`, `+`, and `~` encode different DOM assumptions.
3. **Specificity is a tuple, not a score.** Compare its columns from left to right.
4. **The cascade has multiple dimensions.** Origin, importance, layer, specificity, scope, and order all contribute.
5. **`:where()` is a specificity valve.** It lets a rule describe context without adding specificity weight.
6. **`:is()` is a matching convenience with a specificity cost.** Its most specific argument determines the grouping's specificity.
7. **`:has()` describes a relationship from the subject outward.** Use it when that relationship is genuinely the rule.
8. **Position is not identity.** `:nth-child()` says where an element sits, not what it means.
9. **Semantic attributes should tell the truth.** ARIA is for accessibility semantics, not merely styling hooks.
10. **State should have one owner.** Avoid duplicate, drifting class and attribute states.
11. **A component selector is part of its API.** Markup changes should be evaluated against that contract.
12. **A useful fallback is better than a blank enhancement.** Modern selector features should improve the experience without making the base unusable.
13. **Accessibility is part of selector correctness.** A rule that hides focus or misrepresents state is not a good rule.
14. **Readability beats selector cleverness.** If the rule needs a paragraph to explain why it works, a named class may be better.
15. **Measure performance; don't guess.** Profile before making selectors less expressive.
16. **DevTools separates matching from winning.** First establish that the selector matches, then debug the cascade.
17. **Structure should follow semantics.** Do not damage the HTML just to make a selector convenient.
18. **Prefer stable intent over incidental layout.** A named component variant is more robust than “the third div in this wrapper.”

## Quick Reference

| Need | Selector or technique | Notes |
|---|---|---|
| Direct child | `.parent > .child` | One level only |
| Next sibling | `.label + input` | Immediately following element sibling |
| Later sibling | `.error ~ .help` | Any later matching sibling |
| Attribute exists | `[required]` | Attribute presence |
| Exact attribute | `[data-state="ready"]` | Exact value |
| Starts with | `[href^="https"]` | Prefix match |
| Ends with | `[href$=".pdf" i]` | Suffix match; `i` is ASCII case-insensitive |
| Contains substring | `[data-name*="plan"]` | Not token-aware |
| Contains token | `[class~="active"]` | Whitespace-separated token |
| First element child | `:first-child` | All element types count |
| First of type | `p:first-of-type` | Same element type |
| Every other child | `:nth-child(2n)` | Even positions |
| First three | `:nth-child(-n + 3)` | Positions 1–3 |
| Position within filtered set | `:nth-child(3 of .item)` | Check browser support |
| Exclude match | `:not(.disabled)` | Argument affects specificity |
| Group alternatives | `:is(h2, h3)` | Highest argument specificity |
| Zero-specificity grouping | `:where(h2, h3)` | Arguments add zero specificity |
| Match a parent by content | `.card:has(.media)` | Relationship-based selection |
| Focus indicator | `:focus-visible` | Preserve visible keyboard focus |
| Focused composite | `.field:focus-within` | Does not replace control indicator |
| Current page | `[aria-current="page"]` | Must reflect actual state |
| Invalid field wrapper | `.field:has(:invalid)` | Consider validation timing |
| Empty element | `:empty` | Whitespace/content caveats |
| Organize cascade | `@layer base, components, utilities` | Layer precedence matters |
| Check matching | Browser DevTools matched rules | Separate matching from cascade conflicts |

## Build Challenge

Build a small **checkout form and product-card listing** that uses advanced selectors intentionally. The result must remain understandable to another developer and accessible to keyboard and assistive-technology users.

### Requirements

1. Define `@layer reset, base, components, utilities` in a deliberate order.
2. Use `:where()` for at least one base rule that should be easy to override.
3. Use `:is()` to group at least two heading or control types.
4. Document the specificity implications of the selector grouped with `:is()`.
5. Use `>` for a relationship that genuinely depends on direct-child structure.
6. Use `+` for a real adjacent-sibling relationship.
7. Use `~` for a later-sibling relationship only if the markup expresses that sequence.
8. Include at least three attribute-selector operators.
9. Include an exact attribute-value selector for a component state.
10. Include an attribute-presence selector for a native form constraint.
11. Include a case-insensitive attribute selector where the data format supports it.
12. Use `:first-child` or `:last-child` for a justified edge treatment.
13. Use `:nth-child()` for a positional pattern.
14. Explain the difference between `:nth-child()` and `:nth-of-type()` in a code comment or project note.
15. Use `:nth-child(… of S)` only if the browser-support target allows it, and provide an alternative if required.
16. Use `:not()` for a simple, readable exception.
17. Use `:has()` to express one genuine component relationship.
18. Scope the `:has()` selector to the smallest reasonable component.
19. Add a useful fallback for any selector feature not supported by the target browsers.
20. Use `:focus-visible` to create a strong, visible keyboard focus indicator.
21. Keep a focus indicator on the actual focused control.
22. Use `:focus-within` only as a supplementary composite-control treatment.
23. Style `[aria-current="page"]` or an equivalent semantic current-state attribute accurately.
24. Use a form validity selector without showing every untouched required field as an error by default.
25. Ensure `aria-invalid` is set only when the control is genuinely invalid.
26. Associate each validation message with its control using `aria-describedby` or an equivalent appropriate mechanism.
27. Include an error cue that does not depend on color alone.
28. Use native `disabled` where appropriate; do not assume `aria-disabled` blocks activation.
29. Use meaningful component classes for named variants instead of long exclusion chains.
30. Keep selectors shallow and avoid IDs for routine styling.
31. Avoid styling nested card content unintentionally.
32. Test the selector set against at least two card variations and one nested-content variation.
33. Test mixed sibling elements where positional selectors are used.
34. Test missing optional media and empty data states.
35. Inspect matched rules in DevTools before changing specificity.
36. Explain one case where a class is preferable to `:has()`.
37. Confirm the target browser support for advanced selector syntax.
38. Verify that all visible states have sufficient contrast.
39. Verify that current, disabled, selected, and invalid states are not communicated by color alone.
40. Test the interface with keyboard-only navigation.
41. Confirm generated content does not carry essential information by itself.
42. Check that link labels communicate the destination and file type where relevant.
43. Remove any selector that depends on an incidental wrapper index.
44. Add a short selector contract note for each reusable component.
45. Demonstrate one case where a selector matches but loses in the cascade.
46. Explain which cascade dimension caused that conflict.
47. Confirm dynamic attributes and classes update when application state changes.
48. Ensure every advanced selector improves clarity or removes meaningful duplication.
49. Ask another developer to explain the most complex selector without reading your comments.
50. Refactor any selector that requires cleverness instead of expressing stable intent.

### Definition of done

- [ ] The page works with the supported browser matrix.
- [ ] The form has correct labels, instructions, and associated error messages.
- [ ] Keyboard focus is visible and never removed without replacement.
- [ ] Selectors are scoped, intentional, and documented where their contract is non-obvious.
- [ ] Specificity is manageable without routine `!important`.
- [ ] No selector relies on incidental wrapper order.
- [ ] Positional selectors are tested with realistic sibling mixtures.
- [ ] `:has()` is limited to genuine component relationships.
- [ ] ARIA attributes represent real application state.
- [ ] Another developer can maintain the CSS without reverse-engineering it.
