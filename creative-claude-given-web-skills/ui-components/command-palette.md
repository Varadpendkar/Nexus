# SKILL: command-palette
**Layer:** 15 — UI Components
**Goal:** Build a production-ready command palette that is fast to search, fully keyboard-accessible, permission-aware, resilient to asynchronous failures, and consistent with the application's command architecture.

---

## Why This Matters (Senior Perspective)

A command palette looks small in a screenshot, which is why teams often underestimate it. In production it is an interaction hub: it connects navigation, creation flows, workspace switching, search, destructive actions, permissions, keyboard shortcuts, telemetry, and asynchronous APIs. If each result is implemented as a one-off click handler, the first demo may work, but the feature becomes fragile as soon as the command list grows or a user changes workspace while the overlay is open.

Senior engineers begin by defining the behavior contract. What opens the palette? Which keys belong to it? Where does focus move? Does Escape close a nested confirmation first or dismiss the whole surface? What happens when filtering removes the active result? Can a command still execute after the user's permissions change? Does the palette close when a network request starts, or only after the server confirms success? These questions are product behavior, not finishing touches.

For an agency site or freelance product, a command palette can make a complex dashboard feel deliberate and premium. But visual polish does not compensate for an interface that loses focus, announces confusing options to a screen reader, runs an action twice, or silently hides a failure. A customer should be able to use the palette without a mouse, at zoom, on a narrow screen, and under imperfect network conditions. The implementation should be testable independently from the overlay so the action layer remains reusable by buttons, menus, and shortcuts.

A good palette also protects the application. It never treats client-side filtering as authorization, never evaluates user-entered text as code, and never logs sensitive query content without a reviewed purpose. It revalidates context when a command is dispatched because the world may have changed since the result was displayed. It gives the user a clear recovery path after no results, stale data, cancellation, or a failed request.

The practical standard is simple: the palette should make the next action easier without becoming a second, inconsistent application hidden inside a modal. Build a small, explicit state machine around a single command registry, a tested keyboard model, and a centralized executor. Then validate it with real workflows rather than judging success from a static screenshot.

## Core Concepts

### 1. Define the command palette as a task launcher

A command palette is a focused overlay that lets people discover and execute actions through a short query. It is not merely a search input placed over the page. A reliable implementation has a trigger, query state, result model, active-result state, keyboard model, execution contract, dismissal rules, and recovery behavior. Keep those responsibilities explicit so adding a new command does not require rewriting interaction logic.

**Implementation approach:** Use a semantic button to open the palette and a labelled search input inside the dialog. Each command should have a stable identifier, a human-readable label, optional keywords, a group, and an execute function. Keep presentation metadata separate from execution so commands can be tested without rendering the interface.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** A command can navigate, mutate data, open a modal, or start an asynchronous workflow. Model these as actions with a clear result rather than arbitrary strings interpreted by UI code. Validate required context at execution time because permissions or page state may have changed since the result was rendered.


### 2. Choose an accessible dialog and focus strategy

The palette temporarily interrupts the current task, so the user must know where they are and how to leave. A native dialog or a well-tested dialog primitive is usually safer than a hand-built div with a high z-index. The dialog needs an accessible name, an initial focus target, a predictable close path, and focus restoration to the trigger after dismissal.

**Implementation approach:** Use a real button for the trigger, a dialog container, and a search input with a visible or programmatic label. If you use a custom dialog, implement focus containment and inert background behavior rather than assuming aria-modal alone blocks interaction. Test with keyboard and a screen reader; ARIA attributes do not create behavior by themselves.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Avoid focusing the input before it exists, restoring focus to a removed trigger, or trapping focus in a palette that has visually closed. On close, restore focus only when the original trigger is still connected and usable; otherwise move focus to a logical page landmark.


### 3. Build a stable command registry

The registry is the product contract for what the palette can do. A central, typed list makes commands discoverable, searchable, permission-aware, and testable. It also prevents the interface from accumulating scattered conditional branches such as if the query says settings then navigate. Use IDs that remain stable when labels are edited or translated.

**Implementation approach:** A useful command record contains id, label, description, keywords, group, availability predicate, optional shortcut, and execute. Keep availability synchronous and cheap where possible. Keep execution separate because execution may require network requests, confirmation, telemetry, or error reporting.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Do not let remote data or user-generated text become executable code. Treat command definitions as trusted application configuration. For plugin-like commands, validate the returned shape and apply an allowlist of supported action types.


### 4. Normalize and tokenize queries safely

Users type fragments, partial words, accents, punctuation, and sometimes extra spaces. Query normalization should improve recall without damaging the original display string. Trim surrounding whitespace, normalize case for comparison, and consider Unicode normalization for accented text. Keep the visible input exactly as the user typed it; derive a separate search representation.

**Implementation approach:** A small normalization function should be deterministic and unit-tested. Search should match labels and aliases, not arbitrary serialized command objects. Avoid stripping all punctuation blindly because shortcuts, paths, and identifiers may legitimately contain punctuation.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Do not build a regular expression from raw user input without escaping it. For most command palettes, token inclusion or a fuzzy-search library is safer than dynamically compiling arbitrary patterns.


### 5. Rank results instead of only filtering

When the registry grows, result ordering becomes part of usability. Exact label matches should usually outrank prefix matches, which should outrank keyword and description matches. Fuzzy matching is useful for imperfect typing, but should not bury an exact match or make results appear random. Keep ranking deterministic so the same query produces the same order.

**Implementation approach:** Use a transparent score function or a well-maintained fuzzy-search package. Add small, documented score bonuses for exact label, prefix, token coverage, and recent use. Sort by score and then stable label or registration order to break ties.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Do not use recency as an invisible override that places unrelated commands above exact matches. Personalization should be a modest tie-breaker and should never override permissions or safety constraints.


### 6. Group and describe results without visual noise

Groups help people scan commands when the palette contains navigation, creation, workspace, and help actions. Group labels should describe meaningful categories rather than mirror implementation modules. Descriptions clarify ambiguous actions, while excessive metadata makes every row harder to scan. Establish a visual hierarchy between command name, supporting text, shortcut, and group heading.

**Implementation approach:** Render groups only when they contain results, and preserve result order inside each group. Use a list-like structure for options and make each result's accessible name include the action label; avoid adding decorative icons to the spoken name unless they communicate meaning.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** A result group should not create nested keyboard stops. Keep the active option model simple: one active result at a time, with a visible highlight that is also conveyed to assistive technology.


### 7. Implement keyboard navigation as a state machine

Keyboard support is the core interaction, not an enhancement. The user should be able to open, type, move through results, execute, and close without touching a pointer. Define how ArrowDown and ArrowUp wrap or stop, what Home and End do, how Enter behaves when there are no results, and whether Escape closes a nested view before the entire palette.

**Implementation approach:** Track the active result by stable command ID rather than array index alone. If filtering removes the active item, select the first valid result or set active state to none. Prevent default browser behavior only for keys the palette owns, and do not intercept ordinary text editing keys.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Do not implement keyboard handlers independently on every row. Centralize the navigation rules so mouse hover, result updates, and keyboard input cannot leave the visual highlight and active ID out of sync.


### 8. Choose an ARIA interaction pattern deliberately

A palette often behaves like a dialog containing a combobox and listbox, but exact semantics depend on the UI primitive and interaction design. Do not combine roles from different patterns casually. If the input controls a listbox, use a coherent combobox/listbox relationship, announce the number of results when useful, and expose the active option through aria-activedescendant when focus remains in the input.

**Implementation approach:** A listbox pattern is appropriate when results are selectable options. A dialog containing ordinary buttons may be more appropriate when each result behaves like a full command control with embedded actions. Follow one tested pattern and inspect the resulting accessibility tree.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** ARIA role names do not replace keyboard behavior, focus management, or state updates. A role=option with a nested interactive button is usually a sign that the interaction model needs to be redesigned.


### 9. Handle zero results, loading, and errors

Empty results are a normal state, not an exceptional blank screen. Explain that nothing matched and provide a way to edit the query or clear filters. If commands are loaded remotely, show a loading state and keep the input responsive. If loading fails, give a recoverable message rather than silently treating a network error as zero matches.

**Implementation approach:** Represent states explicitly: idle, loading, results, empty, and error. Keep the query available during loading, cancel stale requests, and ignore responses whose query version is no longer current. Do not show a loading spinner for every local keystroke when filtering is synchronous.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** A stale response can overwrite newer results if requests race. Use AbortController or a monotonically increasing request ID when remote search is involved.


### 10. Support permissions and context-aware availability

A command may be valid only for an administrator, a selected record, or a particular workspace. Filter unavailable commands before they become executable, but do not rely on client-side visibility as authorization. The server must still check permission at the point of mutation. Explain unavailable actions when discoverability is important, but avoid advertising actions users can never access.

**Implementation approach:** Separate command visibility, enabled state, and execution authorization. A command's availability predicate should be cheap and based on current app context. If the relevant context changes while the palette is open, recalculate availability and remove or disable stale results.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Never trust a role or permission value supplied by the browser as proof of authorization. The UI can improve experience; the API remains the security boundary.


### 11. Run asynchronous commands with pending and error states

Execution can fail, take several seconds, or require confirmation. Disable duplicate submission while an action is in progress, show a clear pending affordance, and define whether the palette closes immediately or remains open until completion. For destructive actions, ask for confirmation in a separate step and make the consequence specific.

**Implementation approach:** Treat execute as a promise-returning function when necessary. Catch errors at a boundary, log diagnostic details safely, and show a user-readable message with a recovery path. Do not display raw server traces or secrets. For idempotent operations, consider retry support; for non-idempotent operations, make duplicate execution difficult.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Closing the palette should not necessarily cancel an already-started server mutation. Decide explicitly whether closing only dismisses the UI or also aborts the task, and communicate that behavior.


### 12. Persist recent commands and shortcuts responsibly

Recent commands reduce repeated work, but persistence can expose private activity on shared devices. Store only what is needed, scope history to the signed-in user and workspace, and provide a clear retention policy. Keyboard shortcuts should be discoverable and should not conflict with browser, operating-system, or assistive-technology shortcuts.

**Implementation approach:** Use local storage only for non-sensitive preferences when that fits the threat model; use server-side preferences when state must follow the account across devices. Keep shortcut definitions in one registry and render the same source in help UI and command rows.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Do not persist sensitive search queries, document titles, or private resource IDs by default. Clear account-scoped state on logout and avoid recording command arguments in analytics unless reviewed.


### 13. Make the palette responsive and robust to overlays

The palette must work on a narrow phone viewport, zoomed text, touch, and pages with existing sticky headers or dialogs. Use a constrained width, viewport-relative maximum height, and an independently scrollable results region. Avoid positioning assumptions that fail when the mobile virtual keyboard appears.

**Implementation approach:** Use a portal or top-level overlay root when stacking contexts would otherwise clip the palette. Respect safe-area insets on mobile and ensure the close button remains reachable. Touch targets should be large enough, while pointer hover should never be the only way to discover the active result.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** A huge z-index cannot escape an ancestor's clipping or stacking context. Put overlays in a deliberate layer system and test with transformed parents and nested dialogs.


### 14. Instrument usage and test real workflows

Analytics can show whether the palette helps people complete tasks, but logging every keystroke creates noise and privacy risk. Measure opening, successful execution, cancellation, empty-query recovery, and failures using coarse events. Pair metrics with task-based usability testing: a command palette can have excellent event counts while users still cannot predict command labels.

**Implementation approach:** Write unit tests for normalization and ranking, component tests for keyboard and focus behavior, and end-to-end tests for real commands. Include permission changes, no-results behavior, asynchronous failure, and focus restoration. Use accessible queries in tests so tests reflect user-facing semantics.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** Do not assert only implementation details such as internal state variables. Test observable behavior and make sure at least one full keyboard-only journey works in a real browser.


### 15. Integrate the palette into a production workflow

A production palette joins routing, user permissions, telemetry, error handling, and the visual system. For example, a project-management app might expose Create task, Search projects, Open settings, Switch workspace, and Invite member. The palette should not duplicate business logic from page buttons; both entry points should call the same tested action layer.

**Implementation approach:** Define a command registry, query pipeline, active selection model, and execution boundary. Add a command only when it has a clear label, an owner, a permission rule, and an error path. Keep navigation commands distinct from mutations so confirmation and telemetry policies can differ.

```html
<button type="button" id="open-palette" aria-haspopup="dialog" aria-controls="command-palette">Open commands <kbd>⌘K</kbd></button>
<dialog id="command-palette" aria-labelledby="palette-title">
  <h2 id="palette-title">Quick actions</h2>
  <label for="palette-query">Search commands</label>
  <input id="palette-query" type="search" autocomplete="off" />
  <ul id="palette-results" role="listbox" aria-label="Commands"></ul>
  <p id="palette-status" role="status" aria-live="polite"></p>
</dialog>
```

```js
const normalizeQuery = (value) => value.normalize('NFKC').trim().toLocaleLowerCase();
const commands = [
  { id: 'home', label: 'Go to dashboard', keywords: ['start', 'overview'], execute: () => location.assign('/dashboard') },
  { id: 'settings', label: 'Open settings', keywords: ['preferences'], execute: () => location.assign('/settings') }
];
function searchCommands(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return commands;
  return commands.filter((command) => {
    const haystack = normalizeQuery([command.label, ...(command.keywords || [])].join(' '));
    return normalized.split(/\s+/).every((token) => haystack.includes(token));
  });
}
```

The markup gives the feature a semantic entry point and a labelled query field. The JavaScript keeps comparison normalization separate from the text displayed to the user. In a real app, replace direct navigation calls with the application's router/action layer and add stable option IDs, focus management, permissions, and error handling.

**Naive vs correct:** Naive code listens for Enter and runs `commands[0]`, assuming the first item is always the user's intent. Correct code resolves the currently active stable command ID from the current result set, checks that it is still available, then calls a centralized executor.

**Gotcha:** `dialog.showModal()` provides useful native modal behavior in supported browsers, but it does not define your search ranking, result selection, command authorization, or asynchronous lifecycle. Test those behaviors separately.

**Edge/system-level consideration:** A command that works in a demo may fail in a real application when the current workspace changes or the target record is deleted. Revalidate context at execution and provide a useful error instead of assuming the result is still valid.


## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Registry + executor separation

**What it does:** Keep command metadata separate from command behavior. This makes the palette searchable and lets actions be tested without mounting the UI.

**When to use it:** Use when several pages need the same commands or when actions need permission checks, telemetry, and error handling.

**Implementation:**

```js
// Registry + executor separation
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** If the registry imports page components, circular dependencies can appear. Keep command definitions close to the application action layer and inject routing/context dependencies.


### Pattern 2: Combobox with active descendant

**What it does:** Keep DOM focus in the search input while exposing which result is active to assistive technology.

**When to use it:** Use when arrow keys navigate a result list while the user continues typing in the same input.

**Implementation:**

```js
// Combobox with active descendant
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** Do not point `aria-activedescendant` at an element that has been filtered out or is not mounted. Virtualized lists need special care.


### Pattern 3: Deterministic scoring pipeline

**What it does:** Turn the query into a ranked set of matches using documented rules and stable tie-breaking.

**When to use it:** Use when the command count is large enough that plain substring filtering becomes frustrating.

**Implementation:**

```js
// Deterministic scoring pipeline
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** Fuzzy scoring can be expensive on large registries. Precompute normalized searchable strings and debounce only expensive remote requests, not basic local input feedback.


### Pattern 4: Nested confirmation step

**What it does:** Represent destructive or irreversible actions as a separate confirmation state with a specific summary.

**When to use it:** Use for deleting a workspace, revoking access, archiving a project, or other high-impact commands.

**Implementation:**

```js
// Nested confirmation step
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** If the target changes or disappears, stop and ask the user to refresh rather than confirming against stale data.


### Pattern 5: Async command lifecycle

**What it does:** Track pending, success, and failure outcomes for commands that call an API or perform longer work.

**When to use it:** Use when a command can fail due to network, permission, validation, or server-side conditions.

**Implementation:**

```js
// Async command lifecycle
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** Do not mark a command successful just because the request was sent. Await the meaningful server response and account for eventual consistency.


### Pattern 6: Recent commands without leaking data

**What it does:** Offer a short recent list that helps repeat common actions while limiting stored information.

**When to use it:** Use for frequent navigation or generic actions in an authenticated productivity tool.

**Implementation:**

```js
// Recent commands without leaking data
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** A command ID can itself reveal sensitive activity if it encodes a resource or patient name. Keep IDs generic and evaluate whether history belongs on shared devices.


### Pattern 7: Mobile-safe overlay shell

**What it does:** Constrain the palette to the visible viewport and keep the input and dismissal action reachable.

**When to use it:** Use for responsive apps where the palette may be opened on small screens or with a virtual keyboard visible.

**Implementation:**

```js
// Mobile-safe overlay shell
const commandPolicy = {
  isAvailable(command, context) {
    return Boolean(command && context && (!command.requiresAdmin || context.user?.isAdmin));
  },
  async dispatch(command, context) {
    if (!this.isAvailable(command, context)) throw new Error('This action is no longer available.');
    if (context.pendingCommandId) throw new Error('An action is already running.');
    return await command.execute(context);
  }
};

async function runSelectedCommand(command, context, setStatus) {
  setStatus({ kind: 'pending', message: `Running ${command.label}…` });
  try {
    const result = await commandPolicy.dispatch(command, context);
    setStatus({ kind: 'success', message: 'Action completed.' });
    return result;
  } catch (error) {
    setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Action failed. Try again.' });
    throw error;
  }
}
```

**Nuance / edge case:** Dynamic viewport units vary across older browsers. Provide a fallback and test on actual target devices, not only desktop responsive mode.


## Common Mistakes

The following table is intended as a code-review checklist. A fix should address the cause, not only make the screenshot look right.

| Mistake | Why It Happens | Fix |

| Using a clickable div as the trigger | It lacks native keyboard and button behavior. | Use a `<button type="button">` with a clear accessible name and visible focus style. |

| Treating aria-modal as focus management | ARIA communicates semantics but does not trap focus or disable background interaction. | Use a tested dialog primitive or implement focus containment, inert background, Escape, and focus restoration. |

| Leaving focus behind the overlay | Keyboard users can tab into hidden page controls. | Move focus into the dialog on open and restore it to the trigger or a logical fallback on close. |

| Using array index as command identity | Filtering and ranking reorder results, so the active row can jump. | Track stable command IDs and derive the active row from the current result set. |

| Compiling a regex from raw input | Special characters can change the expression or cause pathological matching. | Escape user input or use token/fuzzy matching with a bounded algorithm. |

| Showing stale async results | A slow response for an old query can overwrite newer results. | Abort previous requests or compare request sequence IDs before committing results. |

| Running a command twice on rapid Enter | Repeated key events can dispatch duplicate mutations. | Guard the executor with pending state and make server operations idempotent where possible. |

| Hiding unauthorized actions only in the UI | Client state can be modified and requests can be sent directly. | Re-check authorization on the server at execution time; treat client availability as convenience only. |

| Putting interactive buttons inside an option | Nested controls conflict with listbox keyboard and accessibility semantics. | Choose either a selectable listbox option or a dialog containing ordinary buttons; do not mix patterns. |

| Closing after every selection before success is known | Users may lose context when an operation fails. | Define close-on-start versus close-on-success per command class and preserve a clear error recovery route. |

| Rendering an empty blank panel | Users cannot tell whether search is broken or no results matched. | Show a concise empty message and preserve the query so it can be refined. |

| Announcing every keystroke with excessive live-region text | Screen reader output becomes noisy and interrupts typing. | Announce meaningful result-count changes and execution status, not redundant per-character narration. |

| Persisting full query history by default | Queries may contain confidential names or resource identifiers. | Persist generic command IDs only when useful; document retention and clear scoped history on logout. |

| Using z-index as the only overlay strategy | Ancestor stacking contexts and overflow clipping can still hide the palette. | Use a dedicated overlay root and a documented layer scale. |

| Using hover as the only active-state cue | Touch and keyboard users cannot rely on hover. | Keep active selection state explicit and visible; support click/tap and keyboard equally. |

| Assuming a command remains valid after it appears | Workspace, target record, or permissions may change before execution. | Revalidate the command and target at dispatch time and provide a stale-context message. |

| Logging raw arguments to analytics | Arguments may contain sensitive identifiers or free-form text. | Emit coarse event names and generic command IDs; review telemetry fields for privacy. |

| Testing only the happy path | Focus bugs, permission changes, and request races appear only in edge flows. | Test keyboard-only use, empty results, async failure, stale requests, permission changes, and focus restoration. |

| Using labels that describe implementation names | Users cannot predict terms like `syncEntityV2` or `route-admin`. | Write action-first labels in the user's vocabulary and add concise descriptions for ambiguous actions. |

| Ignoring reduced motion and zoom | Animated overlays and fixed-height panels can become unusable under accessibility settings. | Honor reduced-motion preferences, use flexible sizing, and verify at 200% zoom and narrow widths. |


### Before / after: avoid dispatching an arbitrary first result

Naive implementation:

```js
// Wrong: the first item may not be the highlighted item, and the list may be empty.
function onEnter(results) {
  results[0].execute();
}
```

Safer implementation:

```js
function findActiveCommand(results, activeId) {
  if (!activeId) return null;
  return results.find((command) => command.id === activeId) ?? null;
}

async function onEnter(results, activeId, context, setStatus) {
  const command = findActiveCommand(results, activeId);
  if (!command) {
    setStatus({ kind: 'empty', message: 'Choose a command first.' });
    return;
  }
  if (command.isAvailable && !command.isAvailable(context)) {
    setStatus({ kind: 'error', message: 'This command is no longer available.' });
    return;
  }
  return runSelectedCommand(command, context, setStatus);
}
```

The corrected version handles the empty state, resolves stable identity, checks current availability, and routes through the shared executor. Production code should also prevent duplicate dispatch, map known API errors to actionable messages, and revalidate authorization on the server.

## Mental Models


### The palette is a small application

Treat it as a complete interaction surface with state, navigation, permissions, errors, and accessibility—not as a search box with a dropdown.


### One source of truth for actions

The same command definition should power search metadata, shortcut display, availability, and execution. Duplicated command logic drifts.


### Focus is a resource

Every open/close transition must answer where focus starts, where it can move, and where it returns.


### Selection is not execution

A highlighted row is only a candidate. Enter, click, or an explicit confirmation performs the action.


### Results are a contract

The result list must stay consistent with the current query, current permissions, and current application context.


### The server is the security boundary

Hiding a command improves the UI; only server-side authorization protects the data.


### Recovery is part of the feature

No-results, network failure, stale context, and cancellation need designed paths, not blank panels.


### Stable IDs beat array positions

Filtering and sorting change positions. Stable identifiers keep active selection, React keys, and analytics coherent.


## Quick Reference

| Concern | Recommended default | Watch out for |
|---|---|---|

| Open palette | Global shortcut plus visible button | Avoid overriding browser/OS shortcuts without a fallback |

| Close palette | Escape and explicit close control | Restore focus to trigger when it still exists |

| Query normalization | Trim, case-fold, Unicode-normalize comparison text | Keep displayed input unchanged |

| Exact match | Highest relevance score | Do not let recency outrank an exact label |

| Active selection | Stable command ID | Reset if filtering removes the active item |

| No results | Explain empty state and keep query editable | Do not show a blank result panel |

| Async search | Abort or sequence requests | Old responses must not replace newer results |

| Permissions | Client availability plus server authorization | Never treat UI filtering as access control |

| Execution | Central dispatcher with pending guard | Catch errors and prevent accidental duplicates |

| Destructive actions | Specific confirmation step | Highlighting a row is not consent |

| ARIA listbox | Consistent combobox/listbox relationship | Active descendant must point to a mounted option |

| Mobile sizing | Viewport-constrained panel and scroll region | Test virtual keyboard and safe-area insets |

| History | Store minimal stable IDs if required | Clear scoped state at logout |

| Telemetry | Open, execute, cancel, failure, recovery | Avoid raw queries and sensitive arguments |

| Testing | Keyboard, focus, async, permission, failure cases | Assert observable behavior, not private implementation |


## Build Challenge

Build a command palette for a multi-workspace project management dashboard. The palette must expose navigation commands, creation actions, a workspace switcher, and at least one destructive action. Use a central command registry; do not duplicate action behavior in each UI row.

### Requirements

1. Add a visible “Open commands” button with an accessible name and keyboard focus indicator.
2. Support a documented global shortcut, but retain the visible trigger as an alternative.
3. Open a modal dialog with a labelled search input and a predictable initial focus target.
4. Implement query normalization and deterministic ranking for labels, descriptions, and keywords.
5. Support ArrowUp, ArrowDown, Enter, and Escape without breaking normal text editing keys.
6. Keep active selection tied to stable command IDs and reset it safely when filtering removes the active result.
7. Render useful group labels and descriptions while avoiding decorative keyboard stops.
8. Include a zero-results message that preserves the current query and makes recovery obvious.
9. Implement at least one asynchronous command with pending, success, and failure states.
10. Prevent duplicate execution from repeated Enter presses or rapid clicks.
11. Make one destructive command require a confirmation step that names the target and consequence.
12. Apply client-side availability rules and re-check authorization at the server boundary.
13. Restore focus to the trigger after dismissal, with a fallback if the trigger no longer exists.
14. Ensure the overlay fits narrow viewports, supports scrolling, and remains usable at 200% zoom.
15. Add tests for normalization, ranking, keyboard-only operation, focus restoration, empty results, request races, and failure recovery.
16. Instrument coarse usage events without recording raw query strings or sensitive arguments.
17. Document command IDs, labels, ownership, permission requirements, and failure behavior.
18. Verify that the same command action can be called from a page button and the palette without duplicating business logic.

### Failure scenarios to test

- **Out-of-order search:** query `set` triggers a slow request; the user changes it to `settings`; the old response must not overwrite the newer results.
- **Permission changes:** the user loses workspace-admin rights while the palette is open; an admin command must not execute based on stale UI state.
- **Deleted target:** a command refers to a project that was deleted in another tab; execution should explain the stale context and offer a refresh path.
- **Double submission:** Enter is pressed twice while an invite request is pending; only one mutation should be sent.
- **Focus loss:** the trigger is removed after a route transition; closing the palette must not attempt to focus a detached node.
- **Mobile viewport:** the virtual keyboard reduces visible space; the query and close control remain reachable while results scroll.
- **Network failure:** a command fails after the user selects it; show a safe message and a meaningful retry or cancellation path.
- **No matches:** the query has no results; do not leave a blank list or move focus to an invisible option.

### Definition of Done / Success Criteria

- [ ] A user can open, search, navigate, execute, and close the palette using only the keyboard.
- [ ] Focus enters the palette on open and returns to a sensible location on close.
- [ ] Every result has a stable ID, useful label, and explicit execution path.
- [ ] Search ordering is deterministic and has unit tests for exact, prefix, token, and no-match cases.
- [ ] No result can execute when current availability checks fail; the server independently enforces authorization.
- [ ] Async operations cannot be dispatched twice by rapid keyboard or pointer input.
- [ ] Empty, loading, success, and error states are understandable and accessible.
- [ ] The destructive action requires an explicit confirmation with target-specific wording.
- [ ] The layout works on mobile, at 200% zoom, and with reduced-motion preferences.
- [ ] Telemetry contains no raw query text or sensitive command arguments by default.
- [ ] Automated tests cover keyboard flow, focus restoration, stale results, permissions, and failed execution.
- [ ] A reviewer can add a new command by updating the registry and action layer without rewriting the palette component.


## Production Review Notes

### State ownership checklist

Keep each kind of state in the smallest appropriate place. The open/closed state belongs to the palette shell. The query belongs to the input/search controller. The active command belongs to the current result model. Execution status belongs to the dispatcher or operation state. Authentication and authorization context belong to the application, not to the palette itself. This separation prevents a common failure in which closing the dialog clears an in-flight request's status, or a result component tries to infer permissions from a CSS class.

Avoid having multiple sources of truth for the active result. If both `activeIndex` and `activeCommandId` are independently updated, they can diverge after sorting. Prefer the ID and derive the index from the current filtered array. If the current active ID is missing, choose a documented fallback such as the first result or no active result. Do not let the browser's DOM focus and the UI's highlighted item silently disagree.

### Suggested test matrix

| Area | Test | Expected outcome |
|---|---|---|
| Opening | Activate trigger with keyboard | Dialog opens and focus moves to query |
| Closing | Press Escape from query | Dialog closes and focus returns |
| Search | Type exact label | Exact result ranks first |
| Search | Type with extra spaces and different case | Equivalent matches remain available |
| Selection | Arrow through results then press Enter | Only the highlighted command runs |
| Empty | Type a nonsense query | Helpful empty message is shown |
| Permissions | Change role while open | Restricted command cannot execute |
| Async | Resolve old request after new request | Old results are ignored |
| Execution | Press Enter twice while pending | One execution occurs |
| Error | Reject command promise | Error is visible and safe |
| Destructive | Select delete command | Confirmation is required |
| Responsive | Use a narrow viewport | Input and close control remain usable |
| Accessibility | Inspect accessible tree | Name, role, expanded state, and active option are coherent |
| Privacy | Inspect telemetry payload | No raw query or sensitive arguments are present |

### Search quality guidance

Start with simple ranking rules and evaluate them with realistic command vocabulary. A palette with thirty commands does not necessarily need a sophisticated fuzzy library. Exact match, prefix match, token coverage, and aliases may be sufficient. Add fuzzy matching only after observing genuine misspellings or recall problems. If you adopt a library, understand whether it normalizes accents, how it scores substrings, and whether it can produce expensive worst-case work for long input.

Do not rank commands solely by how often they were used. Popularity can bury a rare but exact command and create a feedback loop where the already prominent command becomes more prominent. Use recency as a secondary signal, and consider whether personalized ranking is appropriate for the product. Stable ordering matters because users build spatial memory: if two equally relevant commands swap positions on every render, the palette feels unreliable.

### Shortcut design guidance

A global shortcut should be documented, should have a visible alternative, and should avoid interfering with text entry. If the chosen shortcut includes a modifier, account for platform differences such as Command on macOS and Control on Windows/Linux. Do not capture the shortcut while the user is typing in an unrelated input or when a higher-priority modal owns keyboard interaction. A shortcut handler should inspect the current target and application state before opening the palette.

Shortcuts shown in result rows must match the actual handler. Store shortcut metadata in the registry rather than separately hardcoding a label and event listener. If a shortcut cannot be registered because it conflicts with another command, make the conflict visible in development and choose a different mapping.

### Accessibility review guidance

Keyboard access is necessary but not sufficient. Verify the dialog name, input label, active option announcement, result-count feedback, pending state, and error state with assistive technology. Keep focus indicators visible in both light and dark themes. Ensure the active result is distinguishable without color alone, and preserve sufficient contrast for secondary descriptions. If the list updates after asynchronous search, avoid announcing a large list of full result names on every keystroke.

A screen reader user should not have to infer that a highlighted item is selected. The semantics must match the behavior. If you use a combobox/listbox pattern, follow the established keyboard contract. If the result is better represented as a list of buttons inside a dialog, use that pattern consistently instead. Do not sprinkle ARIA roles onto markup until the accessible tree appears complicated; choose the simplest coherent interaction model.

### Security and data integrity review

Commands are entry points to privileged actions. Treat each as a request to perform a business operation, not as permission to bypass the application's usual rules. The API should validate the current identity, workspace, target, and requested operation. A command definition can hide or disable actions to reduce confusion, but a modified browser can still call an endpoint directly. For destructive commands, confirmation is a usability safeguard rather than an authorization mechanism.

Avoid placing raw query strings in logs by default. Queries can include names, project identifiers, or other sensitive details. Prefer event names, generic command IDs, timing, success/failure category, and a correlation ID. If product analytics needs query-quality information, aggregate or redact it under an explicit privacy policy. Never place secrets, authorization tokens, or full server error payloads in status text.

### Performance and rendering guidance

For a small local registry, synchronous filtering on each input event is usually the simplest and most responsive approach. Measure before adding debounce or virtualization. Debouncing local search can make the palette feel laggy because the user sees a delay after every keystroke. For remote search, debounce network requests if needed, abort obsolete requests, and keep the input responsive. Virtualization is useful only when result volume justifies its complexity; it introduces extra requirements for active-descendant validity and scrolling the active item into view.

Memoization is not automatically a performance improvement. It can obscure state dependencies and leave stale command availability if context is omitted from dependencies. Precompute stable searchable text when the registry changes, not on every render, and make invalidation rules explicit. Keep command execution out of render functions and do not use side effects to infer which result is active.

### Release checklist

Before release, test the feature against the actual app shell: global navigation, sticky headers, nested dialogs, workspace changes, page transitions, and route-level error boundaries. Verify that the overlay layer sits above application content without escaping system-level browser UI. Test on a real mobile browser with its virtual keyboard. Confirm reduced-motion behavior, focus ring visibility, and long translated labels. Run the keyboard-only journey on a clean session, a session with saved recent commands, and a session with restricted permissions.

Finally, ask a teammate who did not implement the feature to complete a realistic task without coaching. Observe whether they understand command names, can predict what Enter will do, and recover from an empty result. A successful palette is not measured by the elegance of its component tree; it is measured by whether people can safely and confidently complete actions faster.
