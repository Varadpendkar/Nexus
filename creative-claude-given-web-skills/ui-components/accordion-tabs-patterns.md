# SKILL: accordion-tabs-patterns

**Layer:** 15 — UI Components

**Goal:** Design and implement accessible, robust accordion and tab interfaces with clear interaction models, keyboard support, responsive behavior, and predictable state management.

---

## Why This Matters (Senior Perspective)

Accordions and tabs look small, but they sit at the intersection of information architecture, accessibility, state management, and responsive design. They decide which information is visible, how a user navigates it, and whether the interface remains understandable when content changes. A weak implementation can appear correct in a screenshot while failing for keyboard users, screen-reader users, mobile users, or people who arrive through a deep link.

An accordion progressively discloses content. A tab interface switches between related panels while keeping one panel active. These patterns are not interchangeable. If users need to compare several sections or expand more than one answer, an accordion is often appropriate. If users need to move quickly between mutually exclusive views of the same subject, tabs may fit better. Using tabs for unrelated destinations, hiding essential instructions behind collapsed content, or making every item look like a clickable heading can create confusion even when the CSS is polished.

Production failures usually come from mismatched semantics and behavior. A clickable `div` may not be keyboard-operable. A tab that updates its color but not its panel creates a false active state. An accordion may set `aria-expanded="true"` while its content remains hidden. A tab strip can become impossible to navigate on a narrow screen when labels overflow. An asynchronous panel may announce an empty region and never expose its loading or error state. A component can also lose its state after a rerender because its active index is tied to an array position that changes when items are inserted.

Senior implementation starts with the interaction contract. Decide whether multiple accordion panels may remain open, whether tabs use automatic or manual activation, whether the first tab is always selected, and how disabled or dynamically removed items behave. Then define the semantic structure, state transitions, focus behavior, responsive strategy, and failure states. Accessibility is not a finishing pass; it is part of the component model. Native buttons, stable IDs, ARIA relationships, visible focus indicators, and keyboard rules should be designed together.

A good component also respects the content. Headings should be meaningful, panels should not hide content users must see to complete a task, and the interface should work without decorative motion. If animation is used, it should not delay interaction or leave collapsed content focusable. Reduced-motion preferences need a real implementation, not a note in a design ticket.

For a creative portfolio or freelance project, these components often carry real business content: service descriptions, pricing details, case-study sections, FAQs, filters, settings, and dashboards. A refined accordion or tab system can make a dense page feel intentional. A fragile one makes the whole site feel unreliable. Build the smallest coherent interaction model, test it with a keyboard and screen reader, and treat state, semantics, layout, and content as one system.

---

## Core Concepts

### 1. Choose the pattern by the user's task

**Explanation:** An accordion reveals or hides sections within a page. Tabs select one panel from a related set. Use an accordion when users may want to inspect several sections, when the page has a question-and-answer structure, or when vertical space matters. Use tabs when the views are parallel, mutually exclusive, and benefit from quick switching. Do not use tabs as a substitute for navigation between separate pages.

**Semantic HTML example:**

```html
<section aria-labelledby="faq-title">
  <h2 id="faq-title">Frequently asked questions</h2>
  <div class="accordion">
    <h3>
      <button type="button" aria-expanded="false" aria-controls="faq-billing">
        How does billing work?
      </button>
    </h3>
    <div id="faq-billing" hidden>
      <p>Billing is monthly and can be changed in account settings.</p>
    </div>
  </div>
</section>
```

**Working CSS/JS example:**

```css
.accordion button {
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 1rem;
  text-align: left;
}
.accordion [hidden] { display: none; }
```

```js
const trigger = document.querySelector(".accordion button");
const panel = document.getElementById(trigger.getAttribute("aria-controls"));

trigger.addEventListener("click", () => {
  const open = trigger.getAttribute("aria-expanded") === "true";
  trigger.setAttribute("aria-expanded", String(!open));
  panel.hidden = open;
});
```

The button exposes its action, and the panel's visibility follows the same state. In an application, encapsulate this behavior rather than relying on one global selector.

**Naive vs. correct:** Naive: choose tabs because they look compact. Correct: choose the pattern that matches whether users need to reveal multiple sections or switch among mutually exclusive views.

**Gotcha:** A page can contain both patterns, but do not nest interactive disclosure controls without a clear focus and reading-order plan.

### 2. Use native buttons for accordion triggers

**Explanation:** A trigger that changes visibility is an action, so a `<button>` is usually the right control. It brings keyboard activation, focus behavior, and accessible role by default. A heading can contain the button so the section outline remains meaningful.

**Semantic HTML example:**

```html
<h3 class="accordion__heading">
  <button
    class="accordion__trigger"
    type="button"
    aria-expanded="false"
    aria-controls="shipping-panel">
    Shipping information
  </button>
</h3>
<div id="shipping-panel" hidden>
  <p>Orders usually ship within two business days.</p>
</div>
```

**Working CSS/JS example:**

```css
.accordion__trigger {
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.accordion__trigger:focus-visible {
  outline: 3px solid #5b8cff;
  outline-offset: 3px;
}
```

```js
function setDisclosure(trigger, panel, expanded) {
  trigger.setAttribute("aria-expanded", String(expanded));
  panel.hidden = !expanded;
}
```

The helper makes the state transition explicit. The application should call it from its event handler or state framework.

**Naive vs. correct:** Naive: add `onclick` to a `<div>` and assume it behaves like a button. Correct: use a button and style it to fit the design.

**Gotcha:** Do not place another button or link inside the accordion trigger; nested interactive elements produce invalid and confusing interaction.

### 3. Keep visual state, ARIA state, and panel visibility synchronized

**Explanation:** Three representations must agree: the trigger's visible appearance, its `aria-expanded` value, and the panel's visibility. If one changes without the others, assistive technology and sighted users receive contradictory information.

**Semantic HTML example:**

```html
<button
  id="account-trigger"
  type="button"
  aria-expanded="true"
  aria-controls="account-panel">
  Account details
</button>
<section id="account-panel" aria-labelledby="account-trigger">
  <p>Your account is active.</p>
</section>
```

**Working CSS/JS example:**

```css
button[aria-expanded="true"] .chevron { transform: rotate(180deg); }
.chevron { transition: transform 160ms ease; }
@media (prefers-reduced-motion: reduce) {
  .chevron { transition: none; }
}
```

```js
function togglePanel(trigger, panel) {
  const nextOpen = trigger.getAttribute("aria-expanded") !== "true";
  trigger.setAttribute("aria-expanded", String(nextOpen));
  panel.hidden = !nextOpen;
}
```

The attribute is the single state signal used by the styling and the behavior. A framework component should derive both attributes and visibility from one state variable.

**Naive vs. correct:** Naive: toggle a CSS class only. Correct: update semantic state and visibility in the same transition.

**Gotcha:** CSS animations may temporarily show a panel after `aria-expanded` has changed; if animating height, also manage focusability and the final hidden state.

### 4. Give every control and panel a stable relationship

**Explanation:** `aria-controls` associates a trigger with its panel, while `aria-labelledby` can name the panel from its trigger. IDs must be unique within the document. A component rendered multiple times must generate distinct IDs and preserve them across rerenders.

**Semantic HTML example:**

```html
<div class="faq-item">
  <h3>
    <button id="faq-shipping-trigger"
            aria-expanded="false"
            aria-controls="faq-shipping-panel"
            type="button">
      Shipping
    </button>
  </h3>
  <div id="faq-shipping-panel"
       aria-labelledby="faq-shipping-trigger"
       hidden>
    <p>Shipping options appear at checkout.</p>
  </div>
</div>
```

**Working CSS/JS example:**

```js
function createPanelIds(prefix, stableKey) {
  const safeKey = String(stableKey).replace(/[^a-zA-Z0-9_-]/g, "-");
  return {
    triggerId: `${prefix}-${safeKey}-trigger`,
    panelId: `${prefix}-${safeKey}-panel`
  };
}
```

```html
<!-- In a templating system, use its stable ID facility rather than a random ID per render. -->
<button id="plan-basic-trigger" aria-controls="plan-basic-panel">
  Basic plan
</button>
<div id="plan-basic-panel" aria-labelledby="plan-basic-trigger" hidden>
  <p>Includes essential features.</p>
</div>
```

Use a framework's stable ID hook or a deterministic component-level ID mechanism. Avoid deriving IDs from mutable array positions.

**Naive vs. correct:** Naive: use `id="panel"` for every accordion item. Correct: generate one stable trigger-panel pair per item.

**Gotcha:** Random IDs generated on every render can break hydration, automated tests, and relationships that depend on stable DOM references.

### 5. Implement the accordion's open-state policy deliberately

**Explanation:** Common policies are single-open (opening one item closes the previous one), multi-open (items toggle independently), and one-required-open (at least one item remains open). The policy changes state shape and should be explicit in the component API.

**Semantic HTML example:**

```html
<div class="accordion" data-mode="single">
  <section>
    <h3><button type="button" aria-expanded="true" aria-controls="panel-profile">Profile</button></h3>
    <div id="panel-profile"><p>Profile settings.</p></div>
  </section>
  <section>
    <h3><button type="button" aria-expanded="false" aria-controls="panel-security">Security</button></h3>
    <div id="panel-security" hidden><p>Security settings.</p></div>
  </section>
</div>
```

**Working CSS/JS example:**

```js
function nextOpenKeys(openKeys, key, mode) {
  const isOpen = openKeys.has(key);
  if (mode === "single") return isOpen ? new Set() : new Set([key]);
  const next = new Set(openKeys);
  isOpen ? next.delete(key) : next.add(key);
  return next;
}
```

```js
const openKeys = new Set(["profile"]);
const multiOpenKeys = nextOpenKeys(openKeys, "security", "multiple");
// Result contains "profile" and "security".
```

Use stable item keys, not titles that may be duplicated or localized.

**Naive vs. correct:** Naive: use a single Boolean for a list of panels. Correct: represent the state in a way that matches the chosen policy.

**Gotcha:** “One panel must always remain open” requires a distinct close rule; do not accidentally let the user close the final open panel.

### 6. Make tab semantics explicit

**Explanation:** A tab interface uses a container with `role="tablist"`, individual `role="tab"` controls, and matching `role="tabpanel"` elements. Native buttons remain useful for tab controls, but ARIA roles and relationships are needed because buttons alone do not describe a tab set.

**Semantic HTML example:**

```html
<div class="tabs">
  <div role="tablist" aria-label="Project details">
    <button id="tab-overview" role="tab" aria-selected="true"
            aria-controls="panel-overview" tabindex="0" type="button">Overview</button>
    <button id="tab-files" role="tab" aria-selected="false"
            aria-controls="panel-files" tabindex="-1" type="button">Files</button>
  </div>
  <section id="panel-overview" role="tabpanel"
           aria-labelledby="tab-overview" tabindex="0">
    <p>Project summary.</p>
  </section>
  <section id="panel-files" role="tabpanel"
           aria-labelledby="tab-files" tabindex="0" hidden>
    <p>Project files.</p>
  </section>
</div>
```

**Working CSS/JS example:**

```css
[role="tablist"] { display: flex; gap: .5rem; border-bottom: 1px solid #ccc; }
[role="tab"][aria-selected="true"] { border-bottom: 3px solid currentColor; }
[role="tabpanel"]:focus-visible { outline: 2px solid #5b8cff; }
```

```js
function showTab(tab, panel, selected) {
  tab.setAttribute("aria-selected", String(selected));
  tab.tabIndex = selected ? 0 : -1;
  panel.hidden = !selected;
}
```

A complete implementation must update all tabs and panels as a set, not call this helper for one element in isolation.

**Naive vs. correct:** Naive: a row of buttons with colored active state and unrelated content below. Correct: use a coherent tablist, tab, and tabpanel structure.

**Gotcha:** `aria-selected` does not automatically hide sibling panels or move focus; those behaviors must be implemented.

### 7. Support the complete keyboard interaction model

**Explanation:** For a tablist, Left/Right Arrow commonly moves among horizontal tabs, Up/Down among vertical tabs, Home to the first tab, and End to the last. Tab moves focus into or out of the tablist; it should not tab through every inactive tab in sequence. Accordion triggers are regular buttons and should work with Enter and Space through native behavior.

**Semantic HTML example:**

```html
<div role="tablist" aria-label="Account sections">
  <button role="tab" aria-selected="true" tabindex="0" type="button">Profile</button>
  <button role="tab" aria-selected="false" tabindex="-1" type="button">Privacy</button>
  <button role="tab" aria-selected="false" tabindex="-1" type="button">Notifications</button>
</div>
```

**Working CSS/JS example:**

```js
function getNextTabIndex(current, key, count, vertical = false) {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  const forward = vertical ? "ArrowDown" : "ArrowRight";
  const backward = vertical ? "ArrowUp" : "ArrowLeft";
  if (key === forward) return (current + 1) % count;
  if (key === backward) return (current - 1 + count) % count;
  return current;
}
```

```js
tablist.addEventListener("keydown", event => {
  const index = tabs.indexOf(document.activeElement);
  const vertical = tablist.getAttribute("aria-orientation") === "vertical";
  const next = getNextTabIndex(index, event.key, tabs.length, vertical);
  if (next === index || index < 0) return;
  event.preventDefault();
  tabs[next].focus();
});
```

This is the navigation core; the component still needs to decide whether moving focus also activates a tab or whether Enter/Space does activation.

**Naive vs. correct:** Naive: rely on browser Tab navigation to reach every tab. Correct: implement arrow-key navigation and a single tab stop.

**Gotcha:** Do not intercept arrow keys when focus is inside an input nested in a panel; handle keyboard events at the tablist and verify the active element is a tab.

### 8. Choose automatic or manual tab activation

**Explanation:** With automatic activation, moving focus to a tab also displays its panel. This works well when panels are available instantly. With manual activation, arrows move focus and Enter or Space activates the focused tab. Manual activation is preferable when panel switching triggers expensive work, network requests, or noticeable delays.

**Semantic HTML example:**

```html
<div role="tablist" aria-label="Analytics views" data-activation="manual">
  <button role="tab" aria-selected="true" tabindex="0" type="button">Summary</button>
  <button role="tab" aria-selected="false" tabindex="-1" type="button">Forecast</button>
</div>
```

**Working CSS/JS example:**

```js
function shouldActivateOnFocus(activationMode) {
  return activationMode === "automatic";
}
```

```js
tabs.forEach(tab => {
  tab.addEventListener("focus", () => {
    if (shouldActivateOnFocus(activationMode)) activateTab(tab);
  });
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", event => {
    if (activationMode === "manual" && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      activateTab(tab);
    }
  });
});
```

In a production component, ensure Space activation does not cause page scrolling and that native button click semantics remain intact.

**Naive vs. correct:** Naive: fire a costly API request on every arrow-key movement. Correct: choose activation behavior based on panel latency and expected navigation.

**Gotcha:** Automatic activation can be frustrating if each tab takes time to load; keyboard navigation should not feel like a sequence of forced waits.

### 9. Preserve focus when content changes

**Explanation:** Focus should remain on the tab or accordion trigger after activation. If a panel closes while focus is inside it, move focus to a logical visible control before hiding it. When a tab is removed dynamically, choose a neighboring enabled tab and focus it instead of allowing focus to fall to the document body.

**Semantic HTML example:**

```html
<div class="settings-accordion">
  <h3><button id="billing-toggle" aria-expanded="true"
              aria-controls="billing-content" type="button">Billing</button></h3>
  <div id="billing-content">
    <label for="billing-email">Billing email</label>
    <input id="billing-email" type="email" />
  </div>
</div>
```

**Working CSS/JS example:**

```js
function closePanelSafely(trigger, panel) {
  if (panel.contains(document.activeElement)) trigger.focus();
  trigger.setAttribute("aria-expanded", "false");
  panel.hidden = true;
}
```

```js
function removeActiveTab(activeTab, enabledTabs) {
  const index = enabledTabs.indexOf(activeTab);
  const fallback = enabledTabs[Math.min(index, enabledTabs.length - 1)];
  if (fallback) {
    fallback.focus();
    activateTab(fallback);
  }
}
```

The fallback must be selected from the updated list, not a stale collection.

**Naive vs. correct:** Naive: hide a panel while focus remains on an input inside it. Correct: move focus to a stable, visible control before hiding the focused subtree.

**Gotcha:** Never move focus unnecessarily on every content update; focus management should respond to an actual removal or hide operation that would strand focus.

### 10. Handle disabled tabs and unavailable sections consistently

**Explanation:** A disabled tab is unavailable for selection. Decide whether disabled tabs are skipped by arrow navigation and ensure their visual and semantic states agree. Native `disabled` buttons are removed from normal focus order, but some ARIA tab patterns keep disabled tabs discoverable with `aria-disabled="true"` while preventing activation. Pick one strategy and test it with assistive technology.

**Semantic HTML example:**

```html
<div role="tablist" aria-label="Report views">
  <button role="tab" aria-selected="true" tabindex="0" type="button">Overview</button>
  <button role="tab" aria-selected="false" aria-disabled="true"
          tabindex="-1" type="button">Export preview</button>
  <button role="tab" aria-selected="false" tabindex="-1" type="button">History</button>
</div>
```

**Working CSS/JS example:**

```js
function isSelectable(tab) {
  return tab.getAttribute("aria-disabled") !== "true" && !tab.disabled;
}
```

```js
function findEnabledIndex(tabs, start, step) {
  for (let i = 0; i < tabs.length; i++) {
    const index = (start + step * (i + 1) + tabs.length * 2) % tabs.length;
    if (isSelectable(tabs[index])) return index;
  }
  return -1;
}
```

Test the all-disabled and one-enabled cases rather than assuming a selectable tab always exists.

**Naive vs. correct:** Naive: style a tab as disabled but allow clicks and keyboard activation. Correct: block activation and keep navigation rules consistent with the chosen accessibility pattern.

**Gotcha:** Do not disable the only selected tab without choosing a valid replacement; the tablist needs a clear active state.

### 11. Design responsive tab strips without hiding options

**Explanation:** Tabs can overflow when labels are long, translated, or shown on narrow screens. Decide whether the tablist wraps, scrolls horizontally, becomes a vertical list, or changes to another control. Avoid shrinking labels until they become unreadable. If the strip scrolls, provide visible affordance and make the active tab discoverable.

**Semantic HTML example:**

```html
<div class="tabs-shell">
  <div class="tabs-scroll" role="tablist" aria-label="Product sections">
    <button role="tab" aria-selected="true" tabindex="0" type="button">Overview</button>
    <button role="tab" aria-selected="false" tabindex="-1" type="button">Specifications</button>
    <button role="tab" aria-selected="false" tabindex="-1" type="button">Reviews and ratings</button>
  </div>
</div>
```

**Working CSS/JS example:**

```css
.tabs-scroll {
  display: flex;
  gap: .25rem;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}
.tabs-scroll [role="tab"] { flex: 0 0 auto; white-space: nowrap; }
```

```js
function revealActiveTab(tab, scroller) {
  const tabRect = tab.getBoundingClientRect();
  const scrollRect = scroller.getBoundingClientRect();
  if (tabRect.left < scrollRect.left) scroller.scrollLeft -= scrollRect.left - tabRect.left;
  if (tabRect.right > scrollRect.right) scroller.scrollLeft += tabRect.right - scrollRect.right;
}
```

Use this after activation or focus movement, while respecting reduced motion if smooth scrolling is enabled.

**Naive vs. correct:** Naive: hide overflowing tabs with `overflow: hidden`. Correct: make all tabs reachable and communicate the overflow behavior.

**Gotcha:** A scrollable tab strip should not create two competing horizontal scroll regions on touch devices.

### 12. Treat loading, empty, and error panels as first-class states

**Explanation:** Tabs often switch between data views. A panel can be loading, empty, failed, or ready. Each state needs visible content and a stable panel container. Do not leave the panel blank while a request runs, and do not silently swallow errors. If the panel is updated asynchronously, announce meaningful status changes without flooding screen readers.

**Semantic HTML example:**

```html
<section role="tabpanel" aria-labelledby="tab-activity" tabindex="0">
  <p role="status" aria-live="polite">Loading activity…</p>
  <div class="activity-results" hidden></div>
</section>
```

**Working CSS/JS example:**

```js
async function loadPanel({ status, results, load }) {
  status.hidden = false;
  status.textContent = "Loading…";
  results.hidden = true;
  try {
    const items = await load();
    results.replaceChildren(...items.map(createActivityRow));
    status.textContent = items.length ? "" : "No activity yet.";
    status.hidden = items.length > 0;
    results.hidden = items.length === 0;
  } catch {
    status.textContent = "Activity could not be loaded. Try again.";
    status.hidden = false;
    results.hidden = true;
  }
}
```

`createActivityRow` should create DOM nodes and assign text with `textContent`, not interpolate untrusted values into HTML.

**Naive vs. correct:** Naive: show a spinner forever when the request rejects. Correct: provide loading, empty, and recoverable error states.

**Gotcha:** An `aria-live` region should announce useful status text, not repeatedly announce the entire panel after every small change.

### 13. Support deep links and state restoration where useful

**Explanation:** Some tabbed interfaces are useful as shareable destinations. A URL hash or query parameter can identify the active tab, and browser history can restore the state. Use this only when a tab represents a meaningful navigable view; do not create noisy history entries for every incidental click.

**Semantic HTML example:**

```html
<div role="tablist" aria-label="Documentation sections">
  <button id="tab-install" role="tab" aria-selected="true"
          aria-controls="panel-install" type="button">Install</button>
  <button id="tab-config" role="tab" aria-selected="false"
          aria-controls="panel-config" type="button">Configure</button>
</div>
<section id="panel-install" role="tabpanel" aria-labelledby="tab-install">
  <p>Install the package.</p>
</section>
<section id="panel-config" role="tabpanel" aria-labelledby="tab-config" hidden>
  <p>Configure your environment.</p>
</section>
```

**Working CSS/JS example:**

```js
function tabFromHash(tabs) {
  const key = location.hash.slice(1);
  return tabs.find(tab => tab.dataset.key === key && isSelectable(tab)) ?? tabs[0];
}
```

```js
function activateAndSyncUrl(tab, { push = false } = {}) {
  activateTab(tab);
  const url = `#${encodeURIComponent(tab.dataset.key)}`;
  if (push) history.pushState(null, "", url);
  else history.replaceState(null, "", url);
}
```

Listen for `hashchange` or `popstate` if the component promises browser-back restoration. Use a URL-safe key and avoid duplicate IDs.

**Naive vs. correct:** Naive: set a hash but do not listen for browser navigation. Correct: define how initial URL, user activation, and history traversal synchronize.

**Gotcha:** Do not overwrite unrelated query parameters or hashes owned by the surrounding page.

### 14. Build the component as a complete, failure-aware system

**Explanation:** A real component needs an API, state policy, semantics, styling, keyboard behavior, responsive rules, and tests. The following miniature tab component demonstrates the main pieces. It uses manual activation to keep focus movement separate from panel switching, skips disabled tabs, and synchronizes selection and panel visibility.

**Semantic HTML example:**

```html
<div class="tabs" data-tabs>
  <div class="tabs__list" role="tablist" aria-label="Service details">
    <button id="service-design-tab" data-tab="design" role="tab"
      aria-controls="service-design-panel" aria-selected="true"
      tabindex="0" type="button">Design</button>
    <button id="service-build-tab" data-tab="build" role="tab"
      aria-controls="service-build-panel" aria-selected="false"
      tabindex="-1" type="button">Build</button>
    <button id="service-support-tab" data-tab="support" role="tab"
      aria-controls="service-support-panel" aria-selected="false"
      aria-disabled="true" tabindex="-1" type="button">Support (coming soon)</button>
  </div>
  <section id="service-design-panel" role="tabpanel"
    aria-labelledby="service-design-tab" tabindex="0">
    <h3>Design</h3><p>Research, structure, and interface design.</p>
  </section>
  <section id="service-build-panel" role="tabpanel"
    aria-labelledby="service-build-tab" tabindex="0" hidden>
    <h3>Build</h3><p>Implementation, testing, and performance.</p>
  </section>
  <section id="service-support-panel" role="tabpanel"
    aria-labelledby="service-support-tab" tabindex="0" hidden>
    <h3>Support</h3><p>Maintenance plans are being prepared.</p>
  </section>
</div>
```

**Working CSS/JS example:**

```css
.tabs__list { display: flex; gap: .25rem; overflow-x: auto; }
[role="tab"] { flex: 0 0 auto; padding: .75rem 1rem; border: 0; background: transparent; }
[role="tab"][aria-selected="true"] { box-shadow: inset 0 -3px currentColor; font-weight: 700; }
[role="tab"]:focus-visible, [role="tabpanel"]:focus-visible { outline: 3px solid #5b8cff; outline-offset: 2px; }
[role="tabpanel"][hidden] { display: none; }
```

```js
document.querySelectorAll("[data-tabs]").forEach(root => {
  const list = root.querySelector('[role="tablist"]');
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panelFor = tab => root.querySelector(`#${CSS.escape(tab.getAttribute("aria-controls"))}`);

  function activate(tab) {
    if (tab.getAttribute("aria-disabled") === "true" || tab.disabled) return;
    tabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.setAttribute("aria-selected", String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      const panel = panelFor(candidate);
      if (panel) panel.hidden = !selected;
    });
  }

  function moveFocus(from, key) {
    const vertical = list.getAttribute("aria-orientation") === "vertical";
    const forward = vertical ? "ArrowDown" : "ArrowRight";
    const backward = vertical ? "ArrowUp" : "ArrowLeft";
    const current = tabs.indexOf(from);
    const enabled = tabs.map((tab, index) => ({ tab, index }))
      .filter(({ tab }) => tab.getAttribute("aria-disabled") !== "true" && !tab.disabled);
    if (!enabled.length) return;
    let target;
    if (key === "Home") target = enabled[0].tab;
    else if (key === "End") target = enabled[enabled.length - 1].tab;
    else if (key === forward || key === backward) {
      const step = key === forward ? 1 : -1;
      for (let offset = 1; offset <= tabs.length; offset++) {
        const index = (current + step * offset + tabs.length) % tabs.length;
        if (enabled.some(item => item.index === index)) { target = tabs[index]; break; }
      }
    }
    if (target) { from.blur(); target.focus(); }
  }

  list.addEventListener("keydown", event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !tabs.includes(tab)) return;
    if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      const vertical = list.getAttribute("aria-orientation") === "vertical";
      const relevant = vertical
        ? ["ArrowDown", "ArrowUp", "Home", "End"]
        : ["ArrowRight", "ArrowLeft", "Home", "End"];
      if (!relevant.includes(event.key)) return;
      event.preventDefault();
      moveFocus(tab, event.key);
    } else if (event.key === "Enter" || event.key === " ") {
      if (list.dataset.activation !== "automatic") {
        event.preventDefault();
        activate(tab);
      }
    }
  });

  list.addEventListener("click", event => {
    const tab = event.target.closest('[role="tab"]');
    if (tab && tabs.includes(tab)) activate(tab);
  });

  const initial = tabs.find(tab => tab.getAttribute("aria-selected") === "true" &&
    tab.getAttribute("aria-disabled") !== "true" && !tab.disabled);
  if (initial) activate(initial);
});
```

The example illustrates a system, not a drop-in universal library. Production code should add tests for vertical orientation, dynamic updates, no enabled tabs, multiple component instances, and focus behavior. Avoid assuming `CSS.escape` exists in every target environment unless browser support is defined.

**Naive vs. correct:** Naive: build the demo interaction first and add ARIA after bugs appear. Correct: define the interaction contract and derive markup, state, focus, and visibility from it.

**Gotcha:** If the active tab can be removed asynchronously, the component must repair selection and focus rather than leaving every tab unselected.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Independent multi-open accordion

**What it does:** Allows users to open several panels simultaneously.

**When to use it:** FAQs, troubleshooting guides, product specifications, and reference content where users may compare answers without losing their place.

**Complete copy-pasteable code:**

```html
<div class="faq" data-accordion="multiple">
  <section class="faq__item">
    <h3><button type="button" aria-expanded="false" aria-controls="faq-one">Returns</button></h3>
    <div id="faq-one" hidden><p>Returns are accepted within 30 days.</p></div>
  </section>
  <section class="faq__item">
    <h3><button type="button" aria-expanded="false" aria-controls="faq-two">Shipping</button></h3>
    <div id="faq-two" hidden><p>Shipping estimates appear at checkout.</p></div>
  </section>
</div>
<script>
document.querySelectorAll('[data-accordion="multiple"] button[aria-controls]').forEach(button => {
  const panel = document.getElementById(button.getAttribute("aria-controls"));
  button.addEventListener("click", () => {
    const open = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!open));
    panel.hidden = open;
  });
});
</script>
```

**Nuance / edge case:** Ensure each `aria-controls` value resolves to exactly one panel. For multiple accordions on the same page, use component-scoped queries and unique IDs.

### Pattern 2: Single-open accordion

**What it does:** Opening one section closes any previously open section.

**When to use it:** Compact settings panels or step-by-step information where simultaneous open panels would overwhelm the page.

**Complete copy-pasteable code:**

```html
<div class="single-accordion" data-accordion="single">
  <section><h3><button type="button" aria-expanded="true" aria-controls="s-one">Profile</button></h3>
    <div id="s-one"><p>Profile settings are here.</p></div></section>
  <section><h3><button type="button" aria-expanded="false" aria-controls="s-two">Security</button></h3>
    <div id="s-two" hidden><p>Security settings are here.</p></div></section>
</div>
<script>
document.querySelectorAll('[data-accordion="single"]').forEach(root => {
  root.addEventListener("click", event => {
    const button = event.target.closest('button[aria-controls]');
    if (!button || !root.contains(button)) return;
    root.querySelectorAll('button[aria-controls]').forEach(other => {
      const panel = document.getElementById(other.getAttribute("aria-controls"));
      const selected = other === button && other.getAttribute("aria-expanded") !== "true";
      other.setAttribute("aria-expanded", String(selected));
      panel.hidden = !selected;
    });
  });
});
</script>
```

**Nuance / edge case:** This implementation permits all sections to be closed. If one section must always stay open, encode that policy explicitly and test the last-open-item case.

### Pattern 3: Manual-activation tabs

**What it does:** Arrow keys move focus; Enter or Space selects the focused tab. Click still activates a tab.

**When to use it:** Tabs with expensive chart rendering, remote requests, large embedded editors, or costly panel initialization.

**Complete copy-pasteable code:**

```html
<div class="manual-tabs">
  <div role="tablist" aria-label="Report views" data-activation="manual">
    <button id="r-a" role="tab" aria-controls="p-a" aria-selected="true" tabindex="0" type="button">Summary</button>
    <button id="r-b" role="tab" aria-controls="p-b" aria-selected="false" tabindex="-1" type="button">Details</button>
  </div>
  <section id="p-a" role="tabpanel" aria-labelledby="r-a" tabindex="0"><p>Summary content.</p></section>
  <section id="p-b" role="tabpanel" aria-labelledby="r-b" tabindex="0" hidden><p>Detailed content.</p></section>
</div>
<script>
const root = document.querySelector(".manual-tabs");
const tabs = [...root.querySelectorAll('[role="tab"]')];
function activate(tab) {
  tabs.forEach(t => {
    const active = t === tab;
    t.setAttribute("aria-selected", String(active));
    t.tabIndex = active ? 0 : -1;
    root.querySelector(`#${CSS.escape(t.getAttribute("aria-controls"))}`).hidden = !active;
  });
}
tabs.forEach(tab => tab.addEventListener("click", () => activate(tab)));
root.querySelector('[role="tablist"]').addEventListener("keydown", event => {
  const current = tabs.indexOf(event.target);
  if (current < 0) return;
  const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
  if (delta) {
    event.preventDefault();
    tabs[(current + delta + tabs.length) % tabs.length].focus();
  }
  if (event.key === "Home") { event.preventDefault(); tabs[0].focus(); }
  if (event.key === "End") { event.preventDefault(); tabs[tabs.length - 1].focus(); }
  if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(event.target); }
});
</script>
```

**Nuance / edge case:** This abbreviated example does not skip disabled tabs; add that rule if the interface includes unavailable views.

### Pattern 4: Automatic-activation tabs

**What it does:** Focus movement immediately changes the selected panel.

**When to use it:** Lightweight panels whose content is already available and changes without noticeable delay.

**Complete copy-pasteable code:**

```html
<div class="automatic-tabs">
  <div role="tablist" aria-label="Plan information" data-activation="automatic">
    <button id="plan-a" role="tab" aria-controls="plan-panel-a" aria-selected="true" tabindex="0" type="button">Starter</button>
    <button id="plan-b" role="tab" aria-controls="plan-panel-b" aria-selected="false" tabindex="-1" type="button">Pro</button>
  </div>
  <section id="plan-panel-a" role="tabpanel" aria-labelledby="plan-a" tabindex="0"><p>Starter plan details.</p></section>
  <section id="plan-panel-b" role="tabpanel" aria-labelledby="plan-b" tabindex="0" hidden><p>Pro plan details.</p></section>
</div>
<script>
const tabsRoot = document.querySelector(".automatic-tabs");
const tabButtons = [...tabsRoot.querySelectorAll('[role="tab"]')];
function activatePlan(tab) {
  tabButtons.forEach(item => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    tabsRoot.querySelector(`#${CSS.escape(item.getAttribute("aria-controls"))}`).hidden = !active;
  });
}
tabButtons.forEach((tab, index) => {
  tab.addEventListener("click", () => activatePlan(tab));
  tab.addEventListener("focus", () => activatePlan(tab));
  tab.addEventListener("keydown", event => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    tabButtons[(index + step + tabButtons.length) % tabButtons.length].focus();
  });
});
</script>
```

**Nuance / edge case:** Do not use automatic activation if focus movement causes network requests or lengthy transitions. In that case, use manual activation.

### Pattern 5: Responsive horizontally scrollable tab strip

**What it does:** Keeps all tab labels reachable on small screens without compressing them into unreadable widths.

**When to use it:** Product detail views, pricing sections, analytics dashboards, and translated interfaces with labels of different lengths.

**Complete copy-pasteable code:**

```html
<div class="responsive-tabs">
  <div class="responsive-tabs__list" role="tablist" aria-label="Product information">
    <button role="tab" aria-selected="true" tabindex="0" type="button">Overview</button>
    <button role="tab" aria-selected="false" tabindex="-1" type="button">Specifications</button>
    <button role="tab" aria-selected="false" tabindex="-1" type="button">Customer reviews</button>
  </div>
</div>
<style>
.responsive-tabs__list {
  display: flex; gap: .5rem; overflow-x: auto;
  padding: .25rem; scroll-padding-inline: .5rem;
  overscroll-behavior-inline: contain;
}
.responsive-tabs__list [role="tab"] { flex: 0 0 auto; white-space: nowrap; }
.responsive-tabs__list [role="tab"]:focus-visible { outline: 3px solid #3867ff; }
</style>
<script>
const tabScroller = document.querySelector(".responsive-tabs__list");
tabScroller.addEventListener("focusin", event => {
  const tab = event.target.closest('[role="tab"]');
  if (tab) tab.scrollIntoView({ block: "nearest", inline: "nearest" });
});
</script>
```

**Nuance / edge case:** Check that the page itself remains vertically scrollable and that focusing a tab does not unexpectedly move the entire document horizontally.

### Pattern 6: Lazy-loaded tab panel with status states

**What it does:** Loads remote content only when a tab is activated, while showing loading, success, empty, and error feedback.

**When to use it:** Large reports, activity histories, data-heavy dashboards, and panels that would be wasteful to load before the user opens them.

**Complete copy-pasteable code:**

```html
<div class="lazy-panel">
  <button id="activity-tab" type="button" aria-controls="activity-panel" aria-expanded="false">
    Activity
  </button>
  <section id="activity-panel" aria-labelledby="activity-tab" hidden>
    <p id="activity-status" role="status" aria-live="polite"></p>
    <ul id="activity-list" hidden></ul>
    <button id="activity-retry" type="button" hidden>Try again</button>
  </section>
</div>
<script>
const activityTrigger = document.getElementById("activity-tab");
const activityPanel = document.getElementById("activity-panel");
const activityStatus = document.getElementById("activity-status");
const activityList = document.getElementById("activity-list");
const retry = document.getElementById("activity-retry");
let loaded = false;

async function loadActivity() {
  activityStatus.textContent = "Loading activity…";
  activityList.hidden = true;
  retry.hidden = true;
  try {
    // Replace with a real request and validate its response shape.
    const items = await Promise.resolve(["Created project", "Updated profile"]);
    activityList.replaceChildren();
    items.forEach(text => {
      const li = document.createElement("li");
      li.textContent = text;
      activityList.append(li);
    });
    activityList.hidden = items.length === 0;
    activityStatus.textContent = items.length ? "" : "No activity yet.";
    loaded = true;
  } catch {
    activityStatus.textContent = "Could not load activity.";
    retry.hidden = false;
  }
}
activityTrigger.addEventListener("click", async () => {
  const open = activityTrigger.getAttribute("aria-expanded") === "true";
  activityTrigger.setAttribute("aria-expanded", String(!open));
  activityPanel.hidden = open;
  if (!open && !loaded) await loadActivity();
});
retry.addEventListener("click", loadActivity);
</script>
```

**Nuance / edge case:** Add request cancellation or stale-response protection if users can switch away and the request may resolve after the component unmounts.

### Pattern 7: URL-addressable tabs

**What it does:** Allows users to share a meaningful tab state and restore it on page load or browser navigation.

**When to use it:** Documentation, product comparison pages, onboarding sections, or dashboard views where the selected panel changes the meaning of the URL.

**Complete copy-pasteable code:**

```html
<div class="url-tabs">
  <div role="tablist" aria-label="Guide sections">
    <button data-key="setup" role="tab" aria-selected="true" tabindex="0"
      aria-controls="setup-panel" id="setup-tab" type="button">Setup</button>
    <button data-key="deploy" role="tab" aria-selected="false" tabindex="-1"
      aria-controls="deploy-panel" id="deploy-tab" type="button">Deploy</button>
  </div>
  <section id="setup-panel" role="tabpanel" aria-labelledby="setup-tab"><p>Setup steps.</p></section>
  <section id="deploy-panel" role="tabpanel" aria-labelledby="deploy-tab" hidden><p>Deployment steps.</p></section>
</div>
<script>
const urlRoot = document.querySelector(".url-tabs");
const urlTabs = [...urlRoot.querySelectorAll('[role="tab"]')];
function activateUrlTab(tab, updateUrl = true) {
  urlTabs.forEach(item => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    urlRoot.querySelector(`#${CSS.escape(item.getAttribute("aria-controls"))}`).hidden = !active;
  });
  if (updateUrl) history.replaceState(null, "", `#${encodeURIComponent(tab.dataset.key)}`);
}
function restoreUrlTab() {
  const key = decodeURIComponent(location.hash.slice(1));
  activateUrlTab(urlTabs.find(tab => tab.dataset.key === key) || urlTabs[0], false);
}
urlTabs.forEach(tab => tab.addEventListener("click", () => activateUrlTab(tab)));
window.addEventListener("hashchange", restoreUrlTab);
restoreUrlTab();
</script>
```

**Nuance / edge case:** If the page already uses hashes for section anchors, use a query parameter or a namespaced URL convention instead of taking over the global hash.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using a clickable `div` as a trigger | The developer thinks visual clickability is enough and forgets native keyboard behavior. | Use a `<button type="button">` and style it to match the design. |
| Choosing tabs for unrelated destinations | Tabs look like a compact navigation bar, so information architecture is ignored. | Use links for navigation and reserve tabs for related peer panels on the same page. |
| Setting `aria-expanded` without changing visibility | Semantic state and DOM state are implemented by separate code paths. | Update the attribute and panel visibility from one state transition. |
| Hiding panels without updating `aria-selected` | The visual implementation was written first and ARIA was added later. | Derive selection, tabindex, and panel visibility from the same active-tab value. |
| Reusing the same panel ID | A copied component was not made instance-safe. | Generate unique stable IDs per rendered component instance. |
| Using array indexes as durable keys | The initial list appears static, so index-based identity seems harmless. | Use stable item IDs and keep active state keyed to those IDs. |
| Making every tab a normal tab stop | The author relies on default browser navigation instead of the tab interaction pattern. | Keep only the selected tab at `tabindex="0"` and use arrow-key navigation. |
| Omitting Home and End behavior | Only the common left/right case was tested. | Add first/last-tab shortcuts and test them with both orientations. |
| Activating every tab on focus despite slow content | Automatic activation was copied without considering latency. | Use manual activation when panel changes are expensive or asynchronous. |
| Leaving focus inside a panel that is hidden | The component hides content without checking `document.activeElement`. | Move focus to the trigger or another visible, logical control before hiding the panel. |
| Styling a tab as disabled but allowing activation | CSS is mistaken for a behavioral contract. | Enforce disabled state in click, keyboard, and state-transition logic. |
| Disabling the active tab without a replacement | Dynamic feature flags or permissions change after initialization. | Select the nearest enabled tab and repair focus and panel state. |
| Clipping overflowing tab labels | A fixed-width mockup is treated as the final responsive behavior. | Wrap, scroll, or intentionally change the layout while keeping all tabs reachable. |
| Leaving an asynchronous panel blank | The happy path was tested, but loading and failure paths were not. | Render explicit loading, empty, and error states with a retry strategy where appropriate. |
| Announcing the entire panel after every update | A live region is placed around too much content. | Use a small status region for concise updates and avoid redundant announcements. |
| Using smooth motion without reduced-motion support | Animation is considered decoration rather than a user preference. | Disable or simplify transitions under `prefers-reduced-motion: reduce`. |
| Closing a required-open accordion's final section | The interaction policy is not represented in the state model. | Reject the close transition when it would violate the one-open invariant. |
| Using `innerHTML` for untrusted panel data | String concatenation seems faster than DOM construction. | Create elements and assign `textContent`, or sanitize data with a trusted, reviewed sanitizer. |
| Updating the URL but ignoring browser Back | URL synchronization is implemented only in the click handler. | Listen for `hashchange` or `popstate` and restore selected state consistently. |
| Testing only with a mouse | The visual demo works, so keyboard and assistive technology checks are skipped. | Test keyboard-only operation, focus visibility, screen-reader names, and narrow viewports. |

### Before/after: semantic state

**Before — visually toggles only:**

```html
<div class="fake-accordion-title" onclick="toggleVisual()">Shipping</div>
<div class="panel">Shipping details</div>
```

**After — actionable and stateful:**

```html
<h3><button type="button" aria-expanded="false" aria-controls="shipping-info">Shipping</button></h3>
<div id="shipping-info" hidden><p>Shipping details</p></div>
```

```js
const shippingButton = document.querySelector('[aria-controls="shipping-info"]');
const shippingPanel = document.getElementById("shipping-info");
shippingButton.addEventListener("click", () => {
  const open = shippingButton.getAttribute("aria-expanded") === "true";
  shippingButton.setAttribute("aria-expanded", String(!open));
  shippingPanel.hidden = open;
});
```

### Before/after: tab selection

**Before — active class without panel contract:**

```js
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(item => item.classList.remove("active"));
  tab.classList.add("active");
}));
```

**After — selection and visibility are synchronized:**

```js
function selectTab(activeTab, tabs, panelsByTab) {
  tabs.forEach(tab => {
    const active = tab === activeTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panelsByTab.get(tab).hidden = !active;
  });
}
```

---

## Mental Models

1. **Disclosure is a contract:** An accordion trigger promises that a particular region can be shown or hidden. The trigger, expanded state, and panel visibility must tell the same story.
2. **Tabs are one selection, many destinations:** A tablist has one active tab at a time. If users need multiple simultaneously open regions, consider an accordion or another selection pattern.
3. **Focus is state, not decoration:** When a focused element disappears, the component must decide where the user's interaction continues. Never let focus be an accidental side effect of hiding DOM.
4. **One source of truth:** Keep one authoritative state value for the active tab or open accordion keys, then derive ARIA attributes, classes, and visibility from it.
5. **Keyboard rules are part of the component API:** Arrow keys, Tab, Enter, Space, Home, and End are not optional polish. They define how the control works without a pointer.
6. **Latency chooses activation mode:** If changing a panel is immediate, automatic activation can feel natural. If it is slow or expensive, separate focus movement from activation.
7. **Stable identity beats position:** An item is a specific section, not “whatever happens to be second in the array.” Use stable keys and IDs when content can reorder.
8. **Responsive means reachable:** A narrow viewport may change layout, but it must not remove options, truncate meaning, or create an unusable scroll trap.
9. **Every asynchronous path needs a visible state:** Loading, empty, error, and success are part of the panel's design, not exceptional afterthoughts.
10. **Semantics should survive styling:** If all CSS is removed, a user should still encounter understandable headings, buttons, labels, and content relationships.

---

## Quick Reference

| Need | Recommended approach | Verify |
|---|---|---|
| Reveal a single content section | Button plus controlled panel | `aria-expanded` matches visibility |
| Let several accordion items stay open | Track a set of open stable keys | Opening one does not close another |
| Enforce one-open accordion | Track one active key | Closing behavior matches the policy |
| Name accordion sections | Heading containing the trigger button | Heading levels follow document outline |
| Connect trigger and panel | Unique `aria-controls` and `aria-labelledby` IDs | Every reference resolves to the intended element |
| Build a tab interface | `tablist`, `tab`, and `tabpanel` roles | Exactly one tab is selected |
| Keep keyboard tab stops efficient | Selected tab gets `tabindex="0"`; others `-1` | Tab key enters/leaves the tablist as expected |
| Navigate tabs horizontally | Left/Right Arrow, Home, End | Disabled tabs follow the declared policy |
| Navigate tabs vertically | Up/Down Arrow, Home, End | `aria-orientation="vertical"` is set |
| Choose activation mode | Automatic for instant panels, manual for expensive panels | Arrow navigation does not trigger unwanted requests |
| Keep focus visible | `:focus-visible` styling | Focus is clear in keyboard-only use |
| Hide an active panel safely | Move focus before hiding if needed | Focus never remains in hidden content |
| Support narrow screens | Wrap or horizontally scroll the tablist | Every tab remains reachable and readable |
| Handle remote content | Loading, empty, error, retry, success states | Failed requests do not leave a blank panel |
| Respect reduced motion | Disable or simplify transitions | `prefers-reduced-motion` is tested |
| Share a selected view | URL hash or query parameter, with restoration | Browser Back/Forward behavior is defined |
| Prevent duplicate DOM IDs | Stable, unique ID generation | Multiple component instances work together |
| Test component state | Unit tests for state transitions plus browser tests | State, ARIA, and visibility remain aligned |

---

## Build Challenge

Build a production-ready “Service Details” component for a fictional digital agency. The page should include an FAQ accordion and a tabbed service panel. The component must be useful on desktop and mobile, and its behavior must remain correct when content changes or a panel fails to load.

### Requirements

1. Create a semantic FAQ region with a meaningful heading and at least five question items.
2. Use native buttons for all accordion triggers; do not use clickable generic containers.
3. Support multi-open accordion behavior and make that policy explicit in the component code.
4. Connect every accordion trigger to its panel with unique, stable IDs and `aria-controls`.
5. Keep each trigger's `aria-expanded` value synchronized with the actual panel visibility.
6. Add visible focus styling that meets the design's contrast needs and remains visible against light and dark surfaces.
7. Create a tablist with at least three related service views, such as Design, Development, and Maintenance.
8. Give the tablist an accessible name and implement matching tab and tabpanel relationships.
9. Implement arrow-key navigation plus Home and End; only the selected tab should be in the normal Tab sequence.
10. Choose automatic or manual activation and document why that choice fits the panel's loading behavior.
11. Include at least one disabled tab and ensure it cannot be activated by mouse or keyboard.
12. Make the active tab visible when the tab strip overflows horizontally on a narrow viewport.
13. Include responsive styling for a viewport width of 320 CSS pixels without clipping important labels.
14. Add loading, empty, and error states for one tab panel that fetches or simulates fetching data.
15. Add a retry action after the error state and make the retry keyboard accessible.
16. Use DOM APIs or a safe rendering method for dynamic text; do not inject untrusted strings through `innerHTML`.
17. Ensure hiding a panel cannot leave keyboard focus inside hidden content.
18. Support reduced-motion preferences for all nonessential transitions or scrolling animations.
19. If tabs are URL-addressable, synchronize initial state and browser navigation; otherwise explain why the URL should not change.
20. Test two component instances on the same page to prove IDs and event handling do not collide.
21. Write unit tests for the accordion's open-state policy and tab selection transitions.
22. Test keyboard-only operation from the first trigger through every accordion item and tab.
23. Test with a screen reader or accessibility tree inspection to confirm names, roles, states, and panel relationships.
24. Test a failed asynchronous request, an empty response, and a successful response.
25. Test dynamic removal of the active tab and confirm selection and focus move to a valid alternative.
26. Test long translated labels and zoomed text without hiding or overlapping controls.
27. Document the public component API: open-state policy, activation mode, disabled-item behavior, and loading strategy.
28. Add a short README section explaining the interaction model and known limitations.
29. Capture automated accessibility-test results and manually verify keyboard behavior; automated tools do not replace manual testing.
30. Ensure no console errors, duplicate IDs, orphaned ARIA references, or invisible focus indicators remain.

### Failure scenarios to inject

- Remove the currently active tab after initial render.
- Make every tab disabled and verify the component degrades safely without throwing.
- Return a rejected promise from the lazy panel request.
- Return an empty array from the request and confirm an informative empty state.
- Place focus inside an accordion panel, then trigger an action that closes that panel.
- Render two copies of the component with the same item keys but different instance IDs.
- Resize the viewport to 320 pixels and use a keyboard to reach the last tab.
- Enable reduced motion and verify that no required interaction depends on animation completion.

### Definition of done

- [ ] Every trigger is a native, keyboard-operable button with a meaningful accessible name.
- [ ] Accordion state, ARIA attributes, and panel visibility remain synchronized under every supported state transition.
- [ ] The tablist has one selected enabled tab whenever at least one enabled tab exists.
- [ ] Arrow-key navigation, Home, End, and normal Tab entry/exit work as specified.
- [ ] Focus is never stranded in hidden or removed content.
- [ ] Loading, empty, success, and failure states are visible and understandable.
- [ ] Layout remains usable at 320 CSS pixels, at browser zoom, and with long labels.
- [ ] Reduced-motion preferences are honored without breaking state changes.
- [ ] Multiple instances do not create duplicate IDs or cross-control one another.
- [ ] Automated tests, manual keyboard tests, and accessibility checks are documented.
- [ ] The README describes the component's policy choices and limitations.
- [ ] No uncaught exceptions or console errors occur during the failure scenarios.

### Suggested test matrix

| Scenario | Action | Expected result |
|---|---|---|
| Accordion, closed | Activate a trigger with Enter | Panel opens; expanded state becomes true |
| Accordion, open | Activate same trigger with Space | Panel closes; expanded state becomes false |
| Multi-open policy | Open two different items | Both panels remain visible |
| Tab navigation | Focus selected tab, press Right Arrow | Focus moves to next enabled tab |
| Manual activation | Move focus, then press Enter | Focused tab becomes selected and its panel appears |
| Disabled tab | Click and navigate toward disabled tab | Disabled tab is not activated |
| Error state | Reject panel request | Error message and retry action appear |
| Empty state | Resolve request with no items | Empty-state message appears |
| Focus safety | Hide a panel containing active focus | Focus moves to the trigger or a documented visible fallback |
| Small viewport | Resize to 320 CSS pixels | All tabs remain reachable and text remains readable |
| Multiple instances | Render two components | IDs are unique and interactions remain scoped |
| Browser history | Navigate Back after URL state change | The expected tab is restored if URL syncing is enabled |

