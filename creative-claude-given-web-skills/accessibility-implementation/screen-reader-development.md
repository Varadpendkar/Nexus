# SKILL: screen-reader-development
**Layer:** 29 — Accessibility Implementation
**Goal:** Build interfaces whose structure, names, state, updates, and task outcomes are reliably understandable through screen-reader output.

---

## Why This Matters (Senior Perspective)
Screen-reader failures are often invisible in a visual review: an icon button is announced as “button” with no name, a custom select exposes no expanded state, a toast appears visually but is never announced, or a form error is shown in red without being associated with its field. These defects can block purchases, hide security warnings, and make polished portfolio projects unusable. Screen readers consume browser semantics, accessible names, relationships, and state—not the designer’s intended visual hierarchy. Senior implementation starts with native HTML and adds ARIA only where native semantics cannot express the interaction. Validate real browser/assistive-technology combinations and task completion, not just automated scores.

---

## Core Concepts

### 1 Accessible names
Controls need concise names describing purpose. Prefer visible text, then `aria-labelledby`, then `aria-label` when visible text is impractical.

**Implementation pattern**

```html
<button type="button" aria-label="Close project details">×</button>
<label for="project-search">Search projects</label>
<input id="project-search" type="search" aria-describedby="search-help">
<p id="search-help">Search by title or technology.</p>
```

**Gotcha:** `aria-label` can override visible text. Keep the spoken name aligned with words users see.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 2 Native semantics
Native buttons, links, labels, headings, lists, and fields already supply role and behavior. Generic elements require extra implementation and testing.

**Implementation pattern**

```html
<nav aria-label="Primary navigation"><a href="/work">Work</a></nav>
<main><h1>Selected work</h1><button type="button">Save case study</button></main>
```

**Gotcha:** ARIA changes the accessibility tree; it does not add keyboard behavior.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 3 Landmarks and headings
Landmarks provide quick navigation; headings create a useful outline. Structure must describe content hierarchy rather than visual font size.

**Implementation pattern**

```html
<header><a href="/">Northstar Studio</a></header>
<nav aria-label="Primary"><a href="/work">Work</a></nav>
<main><h1>Selected work</h1><section aria-labelledby="identity-title"><h2 id="identity-title">Identity systems</h2></section></main>
<footer>© Northstar Studio</footer>
```

**Gotcha:** Repeated navigation landmarks need distinct names.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 4 Forms and instructions
Associate every field with a persistent label. Connect extra instructions and errors using `aria-describedby`; placeholder text is not a replacement label.

**Implementation pattern**

```html
<label for="email">Email address</label>
<p id="email-help">Use the address linked to your account.</p>
<input id="email" type="email" autocomplete="email" aria-describedby="email-help">
```

**Gotcha:** A nearby but unassociated label may not be announced as the field name.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 5 Error recovery
Identify the field, explain the problem in text, and give a recovery path. Mark invalid fields and connect their message programmatically.

**Implementation pattern**

```html
<label for="postal">Postal code</label>
<input id="postal" aria-invalid="true" aria-describedby="postal-error">
<p id="postal-error">Enter a 6-digit postal code.</p>
```

**Gotcha:** A visible error without a discoverable destination can leave users unsure where to act.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 6 Dynamic status
Routine asynchronous updates should be announced without stealing focus. Keep the live region mounted before updating its text.

**Implementation pattern**

```javascript
<p id="save-status" role="status" aria-live="polite" aria-atomic="true"></p>
<script>
const saveStatus = document.querySelector("#save-status");
function announceSaved() { saveStatus.textContent = "Changes saved."; }
</script>
```

**Gotcha:** Assertive live regions can interrupt reading; reserve them for urgent messages.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 7 Disclosure state
A disclosure button must expose its expanded state and keep that state synchronized with visible content.

**Implementation pattern**

```javascript
<button id="details-toggle" aria-expanded="false" aria-controls="details-panel">Plan details</button>
<section id="details-panel" hidden><h2>Plan details</h2><p>Coverage terms.</p></section>
<script>
const toggle = document.querySelector("#details-toggle");
const panel = document.querySelector("#details-panel");
toggle.addEventListener("click", () => {
 const open = toggle.getAttribute("aria-expanded") === "true";
 toggle.setAttribute("aria-expanded", String(!open)); panel.hidden = open;
});
</script>
```

**Gotcha:** A stale `aria-expanded` value announces the wrong state.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 8 Tables and relationships
Use tables for tabular data, not layout. Captions and scoped header cells preserve relationships when users navigate by cell.

**Implementation pattern**

```html
<table><caption>Annual costs by plan</caption>
<thead><tr><th scope="col">Plan</th><th scope="col">Premium</th><th scope="col">Deductible</th></tr></thead>
<tbody><tr><th scope="row">Essential</th><td>₹8,400</td><td>₹15,000</td></tr></tbody></table>
```

**Gotcha:** Responsive visual transformations must preserve labels and reading relationships.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 9 Alternative text
Write alt text according to purpose. Informative images need a useful equivalent; decorative images should be ignored; complex charts need a summary or data table.

**Implementation pattern**

```html
<img src="/images/workshop.webp" alt="Designers reviewing a prototype on a large screen">
<img src="/images/grain.webp" alt="">
<figure><img src="/charts/retention.png" alt="Retention rises from 42% in January to 68% in June."><figcaption>Monthly retained users.</figcaption></figure>
```

**Gotcha:** Do not put essential text only inside an image.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 10 Custom widgets
Custom tabs, comboboxes, menus, and grids require roles, states, relationships, and the full keyboard contract. Follow WAI-ARIA APG rather than inventing behavior.

**Implementation pattern**

```html
<div role="tablist" aria-label="Project information">
<button role="tab" id="overview-tab" aria-selected="true" aria-controls="overview-panel" tabindex="0">Overview</button>
<button role="tab" id="details-tab" aria-selected="false" aria-controls="details-panel" tabindex="-1">Details</button>
</div>
```

**Gotcha:** Adding `role=tab` alone does not implement arrow-key navigation.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 11 Reading order
The accessibility tree generally follows DOM order. CSS ordering can create a visual sequence that conflicts with speech and keyboard sequence.

**Implementation pattern**

```html
<ol class="case-study-steps"><li>Discover the problem</li><li>Prototype a solution</li><li>Validate with users</li></ol>
<style>.case-study-steps{display:grid;gap:1rem}</style>
```

**Gotcha:** Avoid using visual `order` to tell a different story from the DOM.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 12 Screen-reader QA
Automated audits find detectable classes of errors but cannot determine whether announcements are useful or a workflow is understandable.

**Implementation pattern**

```javascript
const unnamed = [...document.querySelectorAll('button,a[href],input,select,textarea')]
.filter((el) => !(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.labels?.[0]?.textContent || el.textContent).trim());
console.table(unnamed);
```

**Gotcha:** A clean axe report is not proof of task accessibility.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 13 Icon-only controls
Give icon-only actions a meaningful name and hide decorative SVG internals from the accessibility tree.

**Implementation pattern**

```html
<button type="button" aria-label="Download project report">
<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M12 3v12m-5-5 5 5 5-5M4 20h16"/></svg>
</button>
```

**Gotcha:** Hover-only tooltip text may not name a button or help touch users.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

### 14 Live-region restraint
Announce useful changes, not every keystroke or decorative counter. Debounce search status and keep messages short.

**Implementation pattern**

```html
<section id="results" aria-busy="false" aria-labelledby="results-title">
<h2 id="results-title">Search results</h2><p id="results-status" role="status" aria-live="polite"></p><ul id="results-list"></ul>
</section>
```

**Gotcha:** Replacing the entire live-region node can make announcements unreliable.

**Before / after:** Before, the interaction relies on visual inference or accidental browser behavior. After, it exposes a predictable semantic contract that can be checked with keyboard and assistive technology.

---

## Relevant Patterns / Integration Patterns

### Pattern 1 — Labelled icon action
What it does and when to use it: Names an icon-only action. Use for close, download, copy, and favorite controls.

```html
<button type="button" aria-label="Copy share link"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 8h11v13H8zM5 16H3V3h12v2"/></svg></button>
```

### Pattern 2 — Persistent status region
What it does and when to use it: Announces routine async outcomes without moving focus. Use for saves, filters, and completion.

```html
<p id="action-status" role="status" aria-live="polite" aria-atomic="true"></p>
<script>const actionStatus=document.querySelector("#action-status");function reportSave(){actionStatus.textContent="Changes saved."}</script>
```

### Pattern 3 — Error summary
What it does and when to use it: Makes validation failures discoverable and navigable. Use for long forms.

```html
<section id="error-summary" tabindex="-1" aria-labelledby="error-title"><h2 id="error-title">There are 2 errors</h2><ul><li><a href="#email">Enter a valid email</a></li><li><a href="#phone">Enter a phone number</a></li></ul></section>
```

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Unnamed icon | Icon has no text equivalent. | Add a concise action-and-object `aria-label`. |
| Placeholder as label | Placeholder disappears and may be poorly announced. | Associate a persistent `<label for>` with the field. |
| Live region inserted with text | Assistive technology may miss the initial update. | Mount an empty live region before updating it. |
| Every update assertive | Announcements interrupt current reading. | Use polite status for routine changes. |
| Heading level by font size | Visual style is confused with document structure. | Choose levels by content outline and style separately. |
| Repeated landmark names | Users cannot distinguish navigation regions. | Give each repeated landmark a unique concise label. |
| Role without behavior | ARIA is mistaken for an implementation. | Use native controls or implement the complete pattern. |
| Alt duplicates caption | Information is announced twice. | Make redundant imagery decorative with empty alt. |
| Error conveyed by color | No text explains recovery. | Add a field-specific message and associate it. |
| Table lacks scope | Header relationships depend on position. | Add captions and appropriate `scope` attributes. |
| Toast steals focus | Notification is treated as a modal task. | Use a status region and leave focus in place. |
| Stale ARIA state | Visual and programmatic state diverge. | Update attributes and content in one handler. |
| Repeated generic names | Actions sound identical in lists. | Include the related object in the name. |
| One AT tested | Browser and AT output varies. | Test core tasks with two supported combinations. |

---

## Mental Models

1. **The accessibility tree is the interface** — pixels are only one output.
2. **Native semantics are borrowed behavior** — a real button brings a keyboard contract.
3. **Announce change, not noise** — status should be concise and non-interruptive.
4. **A label is part of the API** — names identify actions to users and speech input.
5. **Order is meaning** — DOM order shapes reading and navigation.
6. **Automated passes are a floor** — task tests still matter.
7. **ARIA describes state, not behavior** — roles do not implement keyboard interaction.

---

## Quick Reference

| Situation | Recommended implementation | Verification note |
|---|---|---|
| Icon button | Accessible name | Name action and object |
| Field | Label + `for` | Label is persistent |
| Instructions | `aria-describedby` | Extra context is connected |
| Routine update | `role=status` | Focus stays put |
| Urgent alert | `role=alert` sparingly | Only truly urgent |
| Disclosure | `aria-expanded` | State matches visibility |
| Page region | `<main>` | Meaningful landmark |
| Repeated nav | Unique landmark label | Distinguishable |
| Decorative image | `alt=""` | No redundant announcement |
| Informative image | Purposeful alt | Meaning preserved |
| Data table | Caption + scoped headers | Relationships preserved |
| Invalid field | Error relationship | Recovery is discoverable |
| Custom tabs | Follow APG | Full keyboard model |
| Async results | Polite status | Avoid noisy updates |
| Audit | Automated + manual | Test tasks |

---

## Build Challenge

Build an accessible project search and comparison page whose names, states, status updates, errors, and tables remain understandable through a screen reader.

### Numbered requirements

1. Use semantic landmarks and a logical heading outline.
2. Give every control a meaningful accessible name.
3. Associate field labels, instructions, and errors with fields.
4. Use a persistent polite status region for routine async updates.
5. Avoid duplicate or noisy live announcements.
6. Use native disclosures for simple expandable details.
7. Add table captions and header relationships.
8. Write useful alt text and empty alt for decorative images.
9. Provide an error summary with links to invalid fields.
10. Test with at least one real screen-reader/browser combination.
11. Run an automated audit and resolve critical findings.
12. Inject a request failure and provide an announced retry path.

### Definition of done

- [ ] All core tasks work with keyboard only.
- [ ] Focus order and visibility remain predictable at zoom and mobile widths.
- [ ] Names, roles, states, and relationships are checked with assistive technology.
- [ ] No critical automated accessibility findings remain unresolved.
- [ ] The injected failure case has a documented recovery path.
- [ ] Semantic HTML is preferred over unnecessary ARIA.
- [ ] WCAG 2.1 AA criteria are reviewed against the actual experience.
- [ ] A manual test log records browser, assistive technology, and outcomes.

---

## Browser Support and Debugging

Test current Chromium, Firefox, and Safari where supported; include iOS Safari and Android Chrome when mobile is in scope. Browser and assistive-technology combinations expose different details, so one browser is not universal proof. Use DevTools Accessibility panes to inspect computed roles, names, states, and relationships. Inspect `document.activeElement` for focus defects and `getComputedStyle()` for color and motion. For animation, profile the Performance panel and check dropped frames, long tasks, paint, and compositing. Use `@supports` only for real CSS capability differences; it cannot verify semantic behavior.

```javascript
function inspectAccessibilityState(selector) {
  const elements = [...document.querySelectorAll(selector)];
  console.table(elements.map((element) => ({
    tag: element.tagName.toLowerCase(), id: element.id,
    role: element.getAttribute('role') || '(native)',
    label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 50),
    expanded: element.getAttribute('aria-expanded'), invalid: element.getAttribute('aria-invalid'),
    focused: element === document.activeElement, visible: element.getClientRects().length > 0
  })));
}
inspectAccessibilityState('button, a[href], input, select, textarea, [role]');
```

## Production Checklist

- Review WCAG 2.1 AA as a minimum target; consider AAA where appropriate.
- Prefer native HTML before ARIA and follow WAI-ARIA 1.2 and the Authoring Practices Guide for custom widgets.
- Check keyboard navigation, screen-reader announcements, focus, contrast, and reduced motion together.
- Confirm browser support and graceful fallback for custom interactions.
- Document limitations and test real tasks rather than relying on audit scores.

## Further Reading

- W3C Web Content Accessibility Guidelines (WCAG) 2.2.
- WAI-ARIA 1.2 specification and WAI-ARIA Authoring Practices Guide.
- MDN documentation for semantic HTML, `:focus-visible`, `prefers-reduced-motion`, and the accessibility tree.
- axe-core and browser DevTools accessibility inspectors.


### Advanced field note — Production implementation

Accessible names are product copy. For a project grid, “View case study: MEDPAY” is more useful than “View” repeated twelve times. Avoid embedding long prose in `aria-label`; long instructions belong in visible content or a referenced description. Do not include the role in the name because assistive technology announces the role separately. Keep visible labels and accessible names aligned so voice-control users can say the words they see.

### Advanced field note — Production implementation

When state changes, update the native state or ARIA property in the same transaction as the visual state. A disclosure should not visually open while `aria-expanded` remains false. A selected tab should not leave two tabs announced as selected. An invalid field should not remain invalid after correction. A single source of application state makes visual and programmatic state easier to synchronize.

### Advanced field note — Production implementation

Live regions are a communication channel, not a logging console. Announce only information that changes a user’s decision or confirms an action. A search result count can be announced after a debounce; a decorative counter ticking every frame should not be. Do not place an entire result list into a live region because that causes large repetitive announcements. Keep status messages short, stable, and close to the task in DOM order.

### Advanced field note — Production implementation

Use a screen-reader test script with expected outcomes. Example: “When I activate Compare, I hear that the plan was added and the count is two. Focus remains on the Compare button.” This is more actionable than “screen reader works.” Test empty, populated, failure, and recovery states. Include keyboard access because many users combine speech output with keyboard navigation.

### Advanced field note — Production implementation

Visually hidden text is appropriate when the visual design cannot fit a label, but a field’s important instructions should often be visible to everyone. A visually-hidden utility must clip content accessibly rather than use `display:none` or `visibility:hidden`, which remove it from the accessibility tree. Audit the utility at browser zoom and in forced-colors mode.

### Practice scenario 1 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 2 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 3 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 4 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 5 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 6 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 7 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 8 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 9 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 10 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 11 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 12 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 13 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

### Practice scenario 14 — Failure-resistant delivery

A portfolio search returns asynchronous cards. Keep the search input labelled and stable, expose a concise status such as “8 projects found,” and do not announce every card’s complete text. If the request fails, announce failure in a persistent polite region and keep a visible Retry button near results. Confirm action names are unique, headings form a useful outline, and result count is not the only way to discover content. Use keyboard navigation to reach cards and the screen reader’s heading or link list to scan them. This combines naming, reading order, dynamic status, error recovery, and task completion.

Verification record: name the browser and version, note whether keyboard-only mode and assistive technology or reduced-motion preference were enabled, list the steps to reproduce, and record the expected and observed result. Repeat after changing shared components, CSS ordering, route lifecycle, design tokens, or animation timing. These changes can alter the accessibility tree and focus behavior even when screenshots look identical. If the result differs between Chromium, Firefox, and Safari, identify whether the difference is native behavior, implementation timing, or unsupported styling before adding a workaround. Prefer a semantic fallback over browser-specific hacks. Make the recovery action visible and keep the user’s entered data whenever safe.

## Self-review notes

This file is scoped to Layer 29 accessibility implementation. Run the project review script against the saved file before release and manually verify thresholds, code accuracy, unique fixes, and every applicable criterion. Automated checks support review but do not replace task-based keyboard and assistive-technology testing.
