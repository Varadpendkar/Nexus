# Custom Events & EventTarget — Production Skill

> **Scope:** Browser-native event contracts for decoupling JavaScript modules with `EventTarget`, `Event`, and `CustomEvent`. This skill covers event naming, payload design, bubbling and cancellation, event buses, lifecycle ownership, error handling, testing, instrumentation, and migration away from tightly coupled callbacks. It does not treat a global event bus as a substitute for clear architecture.

## Why This Matters

Poor event architecture creates production failures that are difficult to reproduce: a checkout panel updates before pricing has finished recalculating; a modal emits “closed” twice after a component is mounted twice; a stale listener retains a detached view and leaks memory; a form submits because a cancellation event was dispatched but its result was ignored; or two unrelated modules use the same generic event name and accidentally react to one another. These failures often appear only after navigation, partial page updates, feature-flag changes, or repeated open/close cycles.

Native events can reduce direct dependencies, but they do not make dependencies disappear. An event name is an API. Its payload is a schema. Its dispatch timing is a consistency guarantee. Its listener lifetime is a resource obligation. Its cancellation behavior is a control-flow contract. Treat these details as production interfaces, document them, and test them.

Use this skill when independent page modules need to communicate without importing each other, when a component should announce a meaningful state transition, when a DOM subtree needs delegated events, or when integrating browser-native APIs with application code. Prefer direct function calls for synchronous, local, one-to-one operations. Prefer a small explicit event surface when one producer may have multiple independent consumers or when ownership boundaries are intentionally separate.

## Core Contract

- Emit domain-specific events, not vague notifications such as `update` or `change`.
- Define payload shape, timing, cancellation, propagation, and ownership before adding listeners.
- Use `CustomEvent` for application payloads; use `Event` when no payload is needed.
- Keep dispatch synchronous unless an explicit asynchronous boundary is part of the contract.
- Keep listener lifetimes shorter than or equal to the lifetime of the object that owns them.
- Never rely on listener registration order as a hidden coordination mechanism.
- Treat event payloads as read-only by convention unless mutation is explicitly designed.
- Test duplicate dispatch, missing consumers, stale listeners, and cancellation behavior.

## 1. EventTarget Is a Contract, Not a Global Variable

`EventTarget` is the browser primitive for registering listeners and dispatching events. DOM elements, `document`, and `window` implement it, and application code can create its own instances. A dedicated target is often safer than placing every event on `window`: it narrows the audience and makes the dependency visible. A target has no built-in concept of domain, ownership, persistence, or replay. Those are architectural decisions that your code must supply.

A useful default is one target per bounded subsystem. For example, a gallery controller may own a target that emits `gallery:selection-change`; the cart subsystem should not have to hear that event unless a deliberate integration forwards it. A single process-wide bus can be justified for a small app, but it should expose a typed, documented event catalog rather than accepting arbitrary strings from every module.

```js
export const galleryEvents = new EventTarget();

export function announceSelection(itemId) {
  galleryEvents.dispatchEvent(new CustomEvent('gallery:selection-change', {
    detail: { itemId },
  }));
}

galleryEvents.addEventListener('gallery:selection-change', (event) => {
  renderSelection(event.detail.itemId);
});
```

The target is deliberately named for the subsystem. This makes imports communicate architecture and helps tests isolate the event surface. Avoid exporting a generic `bus` from a miscellaneous utilities file without documenting which modules are allowed to publish and subscribe.

**Gotcha:** `dispatchEvent()` runs listeners synchronously. It does not queue work for later, and it does not wait for promises returned by listeners. If a listener is `async`, the dispatcher still returns before its awaited work completes.

## 2. Choosing Event, CustomEvent, or a Direct Call

Use `Event` for a signal with no application payload, such as a lifecycle marker whose meaning is entirely in its name. Use `CustomEvent` when consumers need structured data in `detail`. Use a direct function call when the producer requires a return value, an immediate result, or a strongly ordered operation. Events are usually a poor fit for queries such as “what is the current price?” because dispatch does not aggregate listener return values.

```js
// Signal only
panel.dispatchEvent(new Event('panel:ready'));

// Structured application data
panel.dispatchEvent(new CustomEvent('cart:item-added', {
  detail: { sku: 'SKU-42', quantity: 2 },
}));

// A query should remain a function call
const total = pricing.calculateTotal(cartItems);
```

Do not dispatch an event merely to hide a function call behind a string. The caller then loses the function's return type, error path, and explicit dependency. Events work best for announcements: “this happened” or “the user requested this transition.” Commands that require an authoritative answer should usually stay explicit.

## 3. Naming Events as Stable API Surface

Use names that describe a domain event or intent, such as `cart:item-added`, `dialog:close-requested`, or `profile:save-succeeded`. A useful name tells the listener what occurred or what was requested without requiring it to inspect unrelated state. Avoid names that are too broad (`update`, `done`, `change`) and names that encode implementation details (`button-3-clicked`, `component-rendered-v2`) unless that detail is truly the public contract.

Namespacing reduces collisions when several modules share a target. A colon is a convention, not a browser requirement; consistency matters more than punctuation. Document whether an event reports a completed fact (`payment:authorized`) or requests a transition (`dialog:close-requested`). The distinction affects cancellation: a completed fact should not be cancellable retroactively, while a request may intentionally allow listeners to veto it.

```js
export const EVENTS = Object.freeze({
  ITEM_ADDED: 'cart:item-added',
  ITEM_REMOVED: 'cart:item-removed',
  CHECKOUT_REQUESTED: 'checkout:submit-requested',
});
```

Constants help prevent spelling drift, but do not mistake constants for a schema. A name registry should point to documentation that specifies the payload, dispatch timing, target, cancellation rules, and allowed publishers. Renaming an event is a breaking change for all consumers, even if the compiler cannot detect it.

## 4. Payload Design and the `detail` Field

`CustomEvent.detail` carries the application-defined payload. Prefer a small, explicit object with stable property names. Include identifiers and facts that consumers need; avoid passing a giant component instance, an entire mutable application store, or a DOM node when a stable identifier would do. Large payloads couple consumers to producer internals and make event logs hard to inspect.

```js
function publishSearchResults({ query, items, source }) {
  searchEvents.dispatchEvent(new CustomEvent('search:results', {
    detail: {
      query,
      itemIds: items.map((item) => item.id),
      source,
      resultCount: items.length,
    },
  }));
}
```

The payload above shares identifiers and summary facts instead of a mutable list of complex objects. This is not a universal rule: if consumers need the actual result data and the data is immutable, passing it can be appropriate. The important point is to make the choice explicit. Treat payloads as read-only by convention. `Object.freeze()` is shallow and does not deeply freeze nested values; do not rely on it as a security boundary.

For public or cross-team events, version the schema deliberately if incompatible changes are likely. Prefer additive optional fields over renaming or changing the meaning of existing fields. Validate external payloads at boundaries, especially when events are created from plugin code, browser extensions, embedded widgets, or third-party scripts. An event is not inherently trusted just because it is dispatched in the same page.

## 5. Dispatch Timing and Synchronous Reentrancy

`dispatchEvent()` invokes listeners synchronously before it returns. If a listener dispatches another event, the nested event can run before remaining code in the original call resumes. This is reentrancy, and it can create subtle state transitions when listeners mutate the producer or trigger rendering.

```js
const target = new EventTarget();

target.addEventListener('state:changed', () => {
  console.log('listener start');
  target.dispatchEvent(new Event('state:observed'));
  console.log('listener end');
});
target.addEventListener('state:observed', () => console.log('nested event'));

target.dispatchEvent(new Event('state:changed'));
// listener start
// nested event
// listener end
```

Do not use nested dispatch as an undocumented workflow engine. If a sequence needs strict ordering, model it as an explicit function or state machine. If you intentionally need asynchronous delivery, schedule it explicitly and document the semantics, for example with `queueMicrotask()` or a promise-based task queue. That changes when observers see state and can change exception behavior, so it must not be a silent implementation detail.

**Gotcha:** an async listener's rejected promise is not automatically propagated back through `dispatchEvent()`. Catch and report failures inside the listener or route asynchronous work through an explicit coordinator.

## 6. Bubbling, Composed Events, and DOM Boundaries

DOM events can bubble through ancestors and, when configured, cross shadow DOM boundaries. `EventTarget` instances created with `new EventTarget()` do not form a DOM tree and do not provide bubbling through an application hierarchy. For DOM components, `bubbles`, `composed`, and `cancelable` are deliberate choices.

```js
const event = new CustomEvent('account:updated', {
  detail: { accountId: 'acct-17' },
  bubbles: true,
  composed: true,
});
component.dispatchEvent(event);
```

Bubbling supports delegated listeners on a parent. `composed: true` allows a composed event to cross a shadow root boundary; it should be enabled only when consumers outside that boundary are intended to observe the event. Keep internal component events private when possible. Do not dispatch everything on `document` simply because it is convenient; doing so makes the event's audience broad and may expose internal details.

When handling a bubbled event, distinguish `event.target` from `event.currentTarget`. The target is where the event originated, while currentTarget is the object whose listener is currently running. With shadow DOM, retargeting can make the visible target differ from the internal origin. Use `composedPath()` only when the component's public contract permits inspecting the path, and avoid depending on internal shadow-tree nodes.

## 7. Cancellation and `preventDefault()`

Set `cancelable: true` only when listeners are permitted to veto the proposed action. Then inspect `dispatchEvent()`'s boolean result or the event's `defaultPrevented` state. If the event is not cancelable, calling `preventDefault()` has no effect on the cancellation result. A completed fact such as `upload:finished` should generally not be cancelable; a request such as `dialog:close-requested` may be.

```js
function requestClose(dialog) {
  const request = new CustomEvent('dialog:close-requested', {
    detail: { reason: 'escape-key' },
    cancelable: true,
  });

  const allowed = dialog.dispatchEvent(request);
  if (allowed) dialog.close();
}

dialog.addEventListener('dialog:close-requested', (event) => {
  if (hasUnsavedChanges()) event.preventDefault();
});
```

Cancellation is synchronous. It cannot wait for a server confirmation or an asynchronous listener. If the decision depends on asynchronous validation, expose an explicit async method that returns a promise, or create a request coordinator that collects promises. Do not imply that `preventDefault()` can cancel work after it has already started.

## 8. Listener Lifetimes and AbortSignal

Every listener has an owner and a lifetime. A listener attached to `window`, `document`, or a long-lived event bus can retain a closure that references a view, controller, or DOM subtree after it is no longer needed. The simplest robust strategy is to use an `AbortController` per component instance and pass its signal to every listener that belongs to that instance.

```js
class SearchPanel {
  #abort = new AbortController();

  mount(target) {
    target.addEventListener('search:results', this.#onResults, {
      signal: this.#abort.signal,
    });
  }

  #onResults = (event) => this.render(event.detail);

  destroy() {
    this.#abort.abort();
  }
}
```

AbortSignal-based cleanup is easier to reason about than storing many anonymous callbacks and trying to remove them later. It does not remove listeners that were registered without that signal, and aborting a controller is one-way: create a new controller for a new lifecycle. A component that can mount more than once should either recreate its controller on mount or make the lifecycle explicitly single-use.

Use `{ once: true }` for genuinely one-time subscriptions, not as a substitute for lifecycle design. A one-shot listener that never receives its event still exists until its target or signal is cleaned up. For custom event buses, consider exposing a subscription function that returns an unsubscribe function, even if it internally uses native listeners.

## 9. Listener Identity, `this`, and Removal

`removeEventListener()` matches the event type, callback identity, and relevant capture setting. Two textually identical arrow functions are two different function objects. Registering an inline anonymous callback and later writing a new anonymous callback to remove it will not work. Event listeners also receive the event object as an argument; arrow functions do not bind `this` to the target, whereas ordinary functions typically do.

```js
function onSelection(event) {
  updateSelection(event.detail.itemId);
}

target.addEventListener('gallery:selection-change', onSelection);
// Later:
target.removeEventListener('gallery:selection-change', onSelection);
```

Prefer stable method references or an `AbortSignal` for cleanup. Avoid storing listeners in global arrays without a clear owner. If a listener needs component state, make the ownership explicit so it cannot accidentally update a newly mounted instance using stale data. Use DevTools heap snapshots and detached-node inspection when repeated navigation appears to grow memory use.

## 10. Building a Small Event Bus Without Overengineering

A minimal event bus can wrap `EventTarget` with a stable event catalog and typed helper methods. Keep the wrapper small: validation, subscription ownership, and documented names can be useful; adding a second event propagation system, implicit wildcard routing, hidden priorities, or a plugin registry usually makes behavior harder to debug.

```js
const bus = new EventTarget();

export const appEvents = Object.freeze({
  emit(type, detail) {
    bus.dispatchEvent(new CustomEvent(type, { detail }));
  },
  on(type, listener, options = {}) {
    bus.addEventListener(type, listener, options);
    return () => bus.removeEventListener(type, listener, options.capture ?? false);
  },
});
```

The example is intentionally simple. In production, ensure the returned unsubscribe function matches the original registration options and consider using an `AbortSignal` when subscriptions are grouped by lifecycle. The wrapper should not silently swallow exceptions, convert all events to asynchronous delivery, or create a hidden global singleton in tests. Make the bus injectable where isolation matters.

A bus should have clear boundaries. If all modules can publish arbitrary event names, the event catalog is not actually governing the architecture. Document which module owns each event, which modules may consume it, and whether the event is a fact or a request. When an event has one known consumer and the call is synchronous, a direct function call may be simpler and safer.

## 11. Error Handling and Failure Isolation

`dispatchEvent()` does not provide a useful aggregate result for listener failures. Browser event listener exceptions are generally reported by the host rather than thrown back to the caller as a normal dispatch failure. That means `try/catch` around `dispatchEvent()` is not a reliable way to catch exceptions from every listener. Each listener should handle its own expected failure modes, and critical asynchronous work should be invoked through a coordinator that can observe promises and results.

```js
bus.addEventListener('report:requested', (event) => {
  void generateReport(event.detail).catch((error) => {
    reportError(error, { operation: 'generate-report' });
  });
});
```

Do not let a non-critical analytics listener block a critical user transition, and do not let a critical transition depend on an analytics listener completing. Separate responsibilities into distinct events or explicit orchestration. If listener execution order matters for correctness, the design is too dependent on incidental registration order and should be refactored.

## 12. Security and Trust Boundaries

An event is not a security boundary. Any script running in the same page may be able to dispatch an event on an accessible target or observe events exposed on `window` or `document`. Do not use a custom event as authorization for a privileged action. Validate permissions and data at the point where the action is performed, not merely at the event publisher.

Avoid including authentication tokens, session secrets, full payment data, or unnecessary personal data in event payloads. Payloads may appear in debugging tools, telemetry, logging wrappers, or third-party instrumentation. For events received from embedded frames or cross-origin messaging bridges, validate origin and schema at the bridge before turning the message into an internal event. Never assume that a plausible-looking `detail` object is trustworthy.

## 13. Testing Event Contracts

Test the observable contract rather than private implementation details. Confirm that the expected event name is emitted once, that its payload contains the agreed fields, that no unrelated fields are required by consumers, that cancellation works when enabled, and that subscriptions stop after teardown. Use a real DOM test environment for bubbling and composed-path behavior; a plain `EventTarget` test does not prove DOM propagation semantics.

```js
const target = new EventTarget();
let observed;
target.addEventListener('cart:item-added', (event) => {
  observed = event.detail;
});

target.dispatchEvent(new CustomEvent('cart:item-added', {
  detail: { sku: 'SKU-42', quantity: 2 },
}));

console.assert(observed.sku === 'SKU-42');
console.assert(observed.quantity === 2);
```

Also test duplicate mounts, abort-before-dispatch, dispatch after destroy, nested dispatch, cancellation of requests, and asynchronous listener rejection. For high-value events, add integration tests that exercise the real producer and consumer together. A unit test that manually dispatches an event can pass even if the production publisher never emits it.

## 14. Observability Without Creating Noise

Event instrumentation is useful when it answers a real debugging question: which module emitted the event, when it happened, and which operation or entity it concerned. A debug wrapper can log event name, timestamp, and a safe summary of the payload. Avoid serializing entire DOM trees or large application objects. Logging every event in a busy animation or pointer interaction path can itself create performance problems.

Use feature flags or development-only instrumentation for verbose tracing. Include correlation identifiers when one user action creates a sequence of related events. Redact sensitive payload fields before telemetry. Avoid relying on event logs as durable audit records unless the system explicitly persists them with appropriate reliability and privacy guarantees.

## 15. Migration and Architecture Decisions

When replacing direct imports with events, do not convert every function call mechanically. Start with a clear coupling problem: a producer has multiple independent consumers, or the producer should not know the consumers' implementation. Define the event contract first, then introduce the event at a boundary. Keep direct calls for operations that need a return value or strict sequence.

A safe migration often has three steps: publish the event alongside the existing call, verify that the new consumer observes the expected payload, then remove the old coupling after tests and telemetry confirm parity. Avoid dual publication indefinitely; it can cause duplicate work. Include a rollback plan for events that drive critical user flows. Document the point at which the event becomes authoritative so two paths cannot compete.

### Mental Models

1. **An event name is an API endpoint.** Renaming it or changing its meaning can break distant consumers.
2. **A payload is a schema.** Keep it small, explicit, stable, and safe to inspect.
3. **Dispatch is synchronous by default.** The browser will not wait for async listeners to finish.
4. **A listener is a resource.** Its lifetime must be tied to an owner or an abort signal.
5. **Cancellation is a synchronous veto.** It is not a general-purpose async cancellation protocol.
6. **A bus removes direct imports, not dependencies.** The event catalog still defines coupling.
7. **A completed fact differs from a requested action.** Name and cancellation behavior should make that distinction clear.
8. **The target defines the audience.** Prefer a narrow subsystem target over a global target when possible.

### Quick Reference

| Need | Recommended approach | Important constraint |
|---|---|---|
| Signal without payload | `new Event(name)` | Keep meaning in the name |
| Structured payload | `new CustomEvent(name, { detail })` | Document payload schema |
| Local one-to-one call | Direct function | Best for return values and ordering |
| DOM delegation | Bubbling event | Check `target` and `currentTarget` |
| Shadow DOM public event | Consider `composed: true` | Expose only intended details |
| Veto a transition | `cancelable: true` | Cancellation is synchronous |
| One-time observer | `{ once: true }` | Still define cleanup if never fired |
| Component teardown | `AbortController` signal | Recreate controller for remount |
| Isolated subsystem | Dedicated `EventTarget` | Avoid an unbounded global bus |
| Async consumer | Catch promise failures locally | Dispatcher does not await it |
| Event contract test | Assert name, payload, count | Test real publisher in integration tests |
| Memory investigation | Heap snapshot and detached nodes | Check repeated mount/unmount cycles |
| Sensitive data | Minimize payload | Events are not a security boundary |
| Debug tracing | Safe summary + correlation ID | Avoid hot-path logging |

### Browser and Platform Notes

`EventTarget`, `Event`, and `CustomEvent` are broadly available in modern browsers. The exact behavior of DOM propagation depends on using a DOM node as the target; a standalone `EventTarget` does not bubble through a tree. For legacy environments, test the actual browser versions in your support matrix rather than adding a polyfill by reflex. In Node.js, `EventTarget` support and event classes depend on the Node version; do not assume every browser-specific DOM behavior is present in a server test environment.

Use browser DevTools to set event-listener breakpoints where supported, inspect event payloads, and take heap snapshots after repeated component teardown. When debugging duplicate events, log a stable correlation ID and lifecycle instance ID rather than only the event name. When debugging missed events, verify the exact target object, event spelling, listener registration timing, and whether an abort signal was already aborted.

### Accessibility and User Interaction

Custom events do not create accessible interaction semantics by themselves. A custom clickable element still needs the correct semantic HTML element or a complete keyboard and focus model. Prefer `<button>` for actions and `<a>` for navigation rather than inventing a clickable `<div>`. Ensure state changes announced through events are reflected in the DOM and, when appropriate, exposed through accessible names, roles, live regions, and focus management. Do not assume assistive technology will hear a custom event; it generally observes the accessibility tree and platform events, not arbitrary JavaScript event names.

Keyboard and pointer handlers should converge on the same domain operation where possible. For example, a button's click handler can call `requestClose()`, which emits a cancelable close request; do not implement separate keyboard-only and pointer-only event protocols that drift over time. Use `:focus-visible` to preserve a clear keyboard focus indicator, and verify that modal close vetoes do not trap users without an announced explanation.

### Performance Guidelines

Events are usually cheap, but a broad bus with hundreds of listeners, high-frequency pointer dispatch, heavy synchronous subscribers, and verbose logging can become expensive. Keep event frequency aligned with semantic meaning. Emit `drag:started`, `drag:ended`, or `selection:changed` rather than a generic event on every pointer movement unless consumers truly need every sample. For high-frequency updates, coalesce visual work through `requestAnimationFrame` and keep the authoritative event contract explicit.

Avoid creating a new event target for every transient operation without need, but do not over-centralize just to reduce object count. The primary performance risk is usually listener work and broad coupling, not the cost of constructing one `CustomEvent`. Profile real workloads with Performance tools before optimizing. Do not use events as a substitute for batching DOM writes or for controlling expensive rendering loops.

### Pattern 1: Domain Event With Explicit Payload

**What it does:** Announces a completed state transition with a compact, documented payload.

**When to use it:** When several independent consumers may react to a fact without the producer knowing their identities.

```js
const cartEvents = new EventTarget();

export function addItem(sku, quantity) {
  cartStore.add(sku, quantity);
  cartEvents.dispatchEvent(new CustomEvent('cart:item-added', {
    detail: { sku, quantity },
  }));
}
```

Keep the event name stable and payload minimal. Consumers should not need to import the cart store to interpret the event.

### Pattern 2: Cancellable Request Event

**What it does:** Lets synchronous listeners veto a proposed transition.

**When to use it:** Before a local UI action such as closing a dialog or leaving an editor with unsaved changes.

```js
function requestClose(target, reason) {
  const event = new CustomEvent('editor:close-requested', {
    detail: { reason },
    cancelable: true,
  });
  if (target.dispatchEvent(event)) closeEditor();
}
```

Do not use this pattern for asynchronous authorization or network validation. Those need a promise-based API.

### Pattern 3: Abortable Subscription Group

**What it does:** Ties multiple subscriptions to a single component lifecycle.

**When to use it:** For modules that mount and unmount repeatedly, especially in client-side navigation.

```js
function mountToolbar(bus) {
  const controller = new AbortController();
  bus.addEventListener('document:saved', onSaved, { signal: controller.signal });
  bus.addEventListener('document:dirty', onDirty, { signal: controller.signal });
  return () => controller.abort();
}
```

The teardown function is idempotent from the caller's perspective. Create a fresh controller for a new mount.

### Pattern 4: Narrow Subsystem Target

**What it does:** Limits the audience for events to modules that intentionally depend on a subsystem.

**When to use it:** When a page has several independent widgets or domains.

```js
export function createSearchModule() {
  const events = new EventTarget();
  return {
    events,
    publishResults(detail) {
      events.dispatchEvent(new CustomEvent('search:results', { detail }));
    },
  };
}
```

Do not expose the target globally if only a small group of modules needs it.

### Pattern 5: DOM Event Delegation

**What it does:** Uses one listener on a stable ancestor to handle events from many descendants.

**When to use it:** For dynamic lists where children are inserted and removed frequently.

```js
list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action="remove"]');
  if (!button || !list.contains(button)) return;
  removeItem(button.dataset.itemId);
});
```

Use semantic buttons, verify the target belongs to the intended root, and keep the delegated handler small.

### Pattern 6: Async Work With Explicit Error Handling

**What it does:** Keeps promise failures visible when an event triggers asynchronous work.

**When to use it:** When an event announces a request that starts a background task but dispatch itself must remain synchronous.

```js
bus.addEventListener('export:requested', (event) => {
  void exportFile(event.detail).catch((error) => {
    reportError(error, { operation: 'export-file' });
  });
});
```

If callers need to await completion, use an explicit async coordinator instead of relying on the event bus.

### Pattern 7: Development-Only Event Tracing

**What it does:** Adds safe metadata to help diagnose event ordering and duplicate publication.

**When to use it:** During integration debugging across independently owned modules.

```js
function traceEvent(type, detail, correlationId) {
  if (!import.meta.env?.DEV) return;
  console.debug('[app-event]', { type, correlationId, keys: Object.keys(detail ?? {}) });
}
```

Adapt the environment check to the bundler. Do not log secrets or dump large payloads.

### Pattern 8: Contract-Test Helper

**What it does:** Makes event assertions concise and repeatable in tests.

**When to use it:** For important producer contracts and regressions involving duplicate dispatch.

```js
function captureOne(target, type) {
  return new Promise((resolve) => {
    target.addEventListener(type, resolve, { once: true });
  });
}

const observed = captureOne(bus, 'profile:saved');
publishProfileSaved({ profileId: 'p-7' });
const event = await observed;
console.assert(event.detail.profileId === 'p-7');
```

A promise helper is appropriate when the test controls when the event is emitted. Add timeouts in the test framework to avoid hanging when the event is never published.

### Common Mistakes

| ID | Mistake | Why it fails | Fix |
|---|---|---|---|
| A | Dispatching every event on `window` | Unrelated modules hear internal signals | Use a dedicated subsystem target |
| B | Naming events `update` or `done` | Meaning is ambiguous and collisions grow | Use domain-qualified event names |
| C | Passing an entire store in `detail` | Consumers depend on private mutable state | Publish a compact documented payload |
| D | Expecting async listeners to be awaited | Dispatch returns before promise work finishes | Use an explicit async coordinator |
| E | Wrapping dispatch in `try/catch` to catch listeners | Listener exceptions are not aggregated by dispatch | Catch failures inside each listener |
| F | Using `preventDefault()` without `cancelable` | The veto has no effect | Set `cancelable: true` for request events |
| G | Trying to cancel a completed fact | Cancellation cannot undo completed work | Emit request before action or use compensation |
| H | Removing a newly created anonymous callback | Callback identity differs | Store the callback or use an abort signal |
| I | Forgetting teardown on a global target | Detached components remain referenced | Group subscriptions with `AbortController` |
| J | Reusing an aborted controller after remount | Its signal remains aborted | Create a fresh controller for each mount |
| K | Depending on listener registration order | Order becomes hidden coupling | Coordinate critical sequences explicitly |
| L | Mutating `detail` in one consumer | Other listeners observe surprising state | Treat payloads as immutable by convention |
| M | Using a custom event as authorization | Any accessible script may dispatch it | Re-check authorization at the action boundary |
| N | Setting `composed: true` on all events | Internal details cross shadow boundaries | Expose only deliberate public events |
| O | Confusing `target` and `currentTarget` | Delegated handlers act on the wrong element | Check both and validate containment |
| P | Assuming a plain EventTarget bubbles | It has no DOM ancestor chain | Use a DOM node when propagation is required |
| Q | Logging entire payloads in production | Sensitive data and performance costs leak | Log a redacted summary and correlation ID |
| R | Testing only manual dispatch | Publisher may never emit in real use | Add integration tests around the producer |
| S | Using events for queries | No return-value aggregation exists | Use a direct function or query API |
| T | Publishing the old and new paths forever | Consumers may perform work twice | Define a migration window and remove the old path |

### Gotcha Callouts

- **Gotcha:** `dispatchEvent()` is synchronous, but it does not await a promise returned by a listener.
- **Gotcha:** `preventDefault()` only affects a cancelable event and only while synchronous dispatch is running.
- **Gotcha:** `removeEventListener()` requires the same callback identity and matching capture setting.
- **Gotcha:** A custom `EventTarget` is not a DOM node; it does not bubble through ancestors.
- **Gotcha:** An `AbortSignal` cannot be reset after abort. Create a new controller for a new lifecycle.
- **Gotcha:** Custom event names are not access-control checks. Validate permission where the action occurs.
- **Gotcha:** `Object.freeze()` is shallow and should not be treated as deep immutability or security.

### Production Challenge: Decoupled Profile Editor

Build a profile editor that emits a documented event contract and can be mounted, unmounted, and mounted again without duplicate listeners.

1. Create a dedicated `EventTarget` for profile-domain events.
2. Define constants for `profile:dirty`, `profile:save-requested`, `profile:saved`, and `profile:save-failed`.
3. Document each event's payload, timing, publisher, consumers, and cancellation behavior.
4. Use a compact payload with profile ID, operation ID, and safe status metadata.
5. Emit `profile:save-requested` before starting the save operation.
6. Keep asynchronous save orchestration in an explicit function that returns a promise.
7. Emit `profile:saved` only after the authoritative save succeeds.
8. Emit `profile:save-failed` with a safe error code rather than credentials or raw sensitive data.
9. Use an `AbortController` for all component-owned subscriptions.
10. Abort all subscriptions when the editor unmounts.
11. Ensure remount creates a fresh controller and does not register duplicate handlers.
12. Use a cancelable request only for synchronous vetoes such as unsaved-change confirmation.
13. Ensure keyboard activation and pointer activation call the same domain operation.
14. Use semantic form controls, labels, buttons, and an accessible status region.
15. Include a visible `:focus-visible` indicator for keyboard users.
16. Add tests for payload shape and exactly-once publication.
17. Add tests proving a destroyed editor no longer responds to bus events.
18. Add tests for save success, save rejection, and retry behavior.
19. Add a failure test where the event is dispatched after teardown and must not update the detached view.
20. Add a failure test where a listener throws or rejects and verify that the failure is surfaced without falsely reporting the save as successful.
21. Use DevTools to inspect listener counts or heap snapshots after repeated mount/unmount cycles.
22. Add a debug trace that records event name and correlation ID while redacting sensitive fields.
23. Explain why any direct function call remains direct instead of being converted into an event.
24. Verify that browser event behavior used by the implementation matches the supported runtime matrix.
25. Write a short event catalog for future maintainers.

### Definition of Done / Success Criteria

- [ ] Event names and payload schemas are documented and domain-specific.
- [ ] Completed facts and requested actions are distinguishable.
- [ ] Cancellation is used only where synchronous veto semantics are valid.
- [ ] Async work has explicit success and error handling.
- [ ] Listener lifetime is tied to component or subsystem ownership.
- [ ] Repeated mount/unmount cycles do not duplicate listeners or retain detached UI.
- [ ] Payloads contain no unnecessary secrets or personal data.
- [ ] Tests cover publisher behavior, consumer behavior, cancellation, and teardown.
- [ ] Failure tests prove that stale events and rejected async work do not produce false success states.
- [ ] Accessibility semantics and keyboard behavior are preserved independently of custom event names.
- [ ] DevTools investigation steps are documented for duplicate events and memory leaks.
- [ ] A reviewer can explain why each event exists and why a direct call would not be simpler.

### Final Review Checklist

Before shipping, inspect each event like a public API. Confirm who owns its name, who publishes it, which consumers are permitted, and whether the event can be observed outside the subsystem. Confirm the event is emitted at a consistent point relative to state mutation. Check whether any listener can trigger a nested dispatch and whether that reentrancy is safe. Verify that the UI is not relying on subscriber registration order. Confirm that cleanup happens on every exit path, including failed mount, route change, aborted operation, and component replacement.

Use the browser's event listener inspection and Performance panel to investigate unexpected event volume. Use heap snapshots if memory rises after repeated navigation. Add correlation identifiers when a single user action produces multiple events. Keep logs redacted and concise. If an event must be replayed after a consumer mounts, a plain `EventTarget` is insufficient by itself; explicitly retain state or use a store rather than assuming events are durable.

The final architectural test is simple: a new consumer should be able to subscribe using the documented contract without importing producer internals, and a producer should not need to know which consumers are present. If that is not true, either the event contract is incomplete or the interaction should remain a direct call.

### 16. Event Contracts and Ownership

An event contract should state the publisher, intended audience, target, event type, payload fields, dispatch timing, whether it bubbles, whether it is composed, whether it is cancelable, and what consumers may assume about state. A contract is incomplete if it only lists the event name. Ownership means one module is accountable for preserving the meaning of that event across releases. Consumers may rely on documented fields, but should not inspect private producer state to reconstruct missing meaning. Use a lightweight catalog in source control so reviews can compare code against the contract.

```js
const contract = {
  type: 'invoice:approved',
  owner: 'billing',
  payload: ['invoiceId', 'approvedAt'],
  timing: 'after persisted approval',
  cancelable: false,
};
console.table(contract);
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 17. Domain Facts Versus UI Signals

Domain facts describe something that has happened and remains true even if no UI is listening: an invoice was approved, a search completed, or an upload failed. UI signals often describe a local interaction such as a menu opening. Keep these categories separate because domain facts may be useful to analytics, other panels, and state synchronization, while ephemeral UI events may not deserve global visibility. Avoid using a UI animation completion event as the authoritative source of business state. A visual transition can be interrupted, reduced, or skipped while the domain operation still succeeds.

```js
publish('invoice:approved', { invoiceId });
// Separate local presentation concern:
playSuccessAnimation({ reducedMotion: prefersReducedMotion() });
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 18. Schema Evolution

Consumers tend to survive additive payload fields more easily than semantic changes. If `count` once meant visible rows and later means all rows, the field name is unchanged but the contract has broken. Prefer precise names and additive optional fields. When an incompatible change is unavoidable, introduce a new event name or an explicit version field with a migration plan. Do not silently support two meanings in one property based on which module happens to publish it. Keep tests for the old contract until all old consumers are removed.

```js
dispatchEvent(new CustomEvent('search:results-v2', {
  detail: { query, visibleCount, totalCount },
}));
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 19. Reentrancy and State Invariants

Because event listeners run synchronously, listeners may observe partially completed transitions if the producer dispatches too early. Decide whether state should be updated before the event is emitted. For a completed-fact event, update authoritative state first, then publish. For a request event, publish before the transition and only proceed if it is not vetoed. Do not call arbitrary listeners while a complex object is in an inconsistent intermediate state. If state mutation and publication must be atomic from consumers' perspective, keep them inside a single coordinator and emit only after the invariant is restored.

```js
function setExpanded(next) {
  state.expanded = next;
  assertStateInvariant(state);
  events.dispatchEvent(new CustomEvent('panel:expanded-changed', {
    detail: { expanded: next },
  }));
}
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 20. Event Boundaries in Shadow DOM

A component can use internal DOM events for implementation details and separately emit public composed events for consumers outside its shadow root. Public payloads should expose stable values rather than internal nodes. Retargeting and composed paths exist to support encapsulation, so avoid building consumers that depend on the internal shape of a shadow tree. Test with an actual shadow root when behavior across the boundary matters; a plain EventTarget test will not model it.

```js
this.dispatchEvent(new CustomEvent('date-picker:value-change', {
  detail: { value: this.value },
  bubbles: true,
  composed: true,
}));
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 21. Delegation and Dynamic DOM

Delegated listeners are useful when child elements are frequently inserted or removed. Attach one listener to a stable ancestor and use a narrow selector to determine which action was requested. Always verify containment, because `closest()` can find an element outside the intended subtree when code is refactored or a nested widget is involved. Keep the domain operation separate from selector parsing so keyboard, pointer, and programmatic activation can share it. Remove or abort the delegated listener when the ancestor itself is discarded.

```js
root.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const action = event.target.closest('[data-action]');
  if (!action || !root.contains(action)) return;
  dispatchAction(action.dataset.action, action.dataset.id);
});
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 22. AbortSignal and Subscription APIs

Passing an AbortSignal to `addEventListener` creates a convenient cleanup group. A higher-level subscription API can return an unsubscribe function to keep call sites independent of the underlying target. Choose one ownership convention and use it consistently. If both unsubscribe and abort are supported, make repeated cleanup safe. Avoid mixing lifecycle-owned subscriptions with long-lived subscriptions in the same controller because one teardown could accidentally remove listeners that should persist.

```js
function subscribe(target, type, listener, signal) {
  target.addEventListener(type, listener, { signal });
  return () => target.removeEventListener(type, listener);
}
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 23. Event Ordering and Coordination

If consumer B must run after consumer A, that is a workflow dependency and should not be hidden in registration order. `EventTarget` does not provide priorities, dependency declarations, or promise aggregation. Move ordered work into a coordinator, then emit events at meaningful milestones. A fan-out event should be safe for consumers to process independently. If consumers need to report completion, define an explicit coordination API with timeouts and failure policy rather than waiting for side effects that happen to be attached as listeners.

```js
async function saveProfile(input) {
  const profile = await repository.save(input);
  await refreshSearchIndex(profile);
  events.dispatchEvent(new CustomEvent('profile:saved', {
    detail: { profileId: profile.id },
  }));
  return profile;
}
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 24. Testing With Realistic Lifecycle

Event tests often pass in isolation but fail after repeated mounting because duplicate listeners accumulate. Exercise lifecycle sequences, not only one dispatch: mount, publish, unmount, publish again, remount, publish again. Verify exact call counts and that stale views are not mutated. When testing asynchronous listeners, control the promise and await the explicit operation that owns it. Do not use arbitrary sleep delays to guess when work is complete. For DOM bubbling and shadow behavior, use a DOM-capable test environment and supplement it with browser tests for platform-sensitive behavior.

```js
const cleanup = mountPanel(bus);
bus.dispatchEvent(new Event('panel:refresh'));
cleanup();
bus.dispatchEvent(new Event('panel:refresh'));
// Assert that the removed panel did not refresh a second time.
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 25. Telemetry and Correlation

When a user action produces several events, a correlation ID makes the sequence easier to inspect without logging entire objects. Keep identifiers opaque and avoid embedding personal information. Development tracing can record event name, module owner, correlation ID, and timestamp. Production telemetry should be sampled or limited to events that answer a concrete operational question. Do not treat console logs as a durable event store. If durable auditability is required, use a server-side system designed for persistence, access control, and retention.

```js
function emit(type, detail, correlationId) {
  if (debugEvents) console.debug(type, { correlationId });
  bus.dispatchEvent(new CustomEvent(type, { detail: { ...detail, correlationId } }));
}
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 26. Interop With Browser APIs

Native browser APIs often already emit events, such as `input`, `change`, `submit`, `pointerdown`, and `visibilitychange`. Prefer those native events when their semantics match the need. Wrap them into domain events only at an intentional boundary where the application meaning becomes clearer. Do not emit a custom event that duplicates a native event with no added semantics, or consumers may subscribe to both and perform work twice. Document whether a wrapper event represents the original input or a completed domain operation.

```js
form.addEventListener('submit', (event) => {
  event.preventDefault();
  events.dispatchEvent(new CustomEvent('profile:save-requested', {
    detail: { profileId },
  }));
});
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

### 27. When Not to Use an Event Bus

An event bus is not always the cleanest solution. Avoid it for local parent-child calls with one known consumer, queries requiring return values, multi-step transactions, and flows where failure must immediately reach the caller. Events can make dependencies less visible in an editor and harder to follow in a stack trace. If a codebase has many event names but no clear catalog or ownership, the bus may have become a hidden service locator. Refactor critical workflows into explicit functions and keep events for independent announcements.

```js
// Direct and explicit is often better for a query:
const permissions = await permissionService.getForUser(userId);
// Publish a fact only after the action succeeds:
emit('permissions:loaded', { userId, count: permissions.length });
```

**Review question:** Can a new consumer implement this contract without importing the publisher's private state? If not, either document the missing field or simplify the boundary. Consider the failure path, repeated lifecycle, and the exact point at which the event becomes observable. Verify the behavior in DevTools and add a regression test for the most likely integration failure.

## Implementation Playbook

### Step 1: Map the communication boundary

Write down the producer, the consumer or consumers, the state owner, and the expected timing. If a caller needs a return value, use a direct function. If a consumer must veto synchronously, define a cancellable request. If several consumers need to know a fact after a successful transition, publish a non-cancelable fact event. Do not begin with “we need a bus”; begin with the coupling problem.

### Step 2: Specify the payload before the listener

Use a short interface-like description in the event catalog. Include required and optional fields, units, nullability, and whether values are identifiers, snapshots, or mutable references. State whether consumers may retain the payload after the handler returns. Prefer primitive values and stable identifiers for cross-module events. If a consumer needs additional data, consider a documented query method rather than expanding every event payload with unrelated state.

### Step 3: Decide target and propagation

For an application module, a dedicated `EventTarget` is usually the narrowest option. For a custom element's public interface, dispatch on the element and deliberately choose `bubbles` and `composed`. For delegated interactions, attach to a stable DOM ancestor. Use `window` or `document` only when the event is intentionally page-wide. A broad target is not inherently wrong, but its audience should be explicit.

### Step 4: Establish cleanup ownership

Every subscription should have a clear owner. Component subscriptions should usually stop at component teardown. Application-level subscriptions may live for the app's lifetime, but should still be created in a well-defined bootstrap path. Prefer `AbortController` for groups of related listeners. Ensure partial initialization failures also run cleanup. Test cleanup by dispatching after unmount and asserting that no stale view or controller is touched.

### Step 5: Instrument the smallest useful metadata

When debugging, record event type, module, timestamp, and correlation ID. Avoid payload dumps by default. For duplicate dispatch, record the publisher call site or operation ID. For missed dispatch, inspect exact target identity, event spelling, listener registration timing, and abort state. Use heap snapshots when repeated navigation increases retained memory. Remove verbose instrumentation or gate it after the incident is resolved.

### Step 6: Review the contract during code review

A reviewer should be able to answer: what does the event mean, who owns it, when is it emitted, can it be cancelled, what data is safe to expose, and how is the listener removed? Ask whether a direct call would be clearer. Ask whether the consumer depends on listener order or private DOM structure. Ask whether the event can fire twice and whether that is safe. Ask what happens if no consumer is listening.

## Troubleshooting Matrix

| Symptom | Likely cause | Investigation | Durable fix |
|---|---|---|---|
| Handler never runs | Wrong target or spelling | Log target identity and event type | Centralize event constants and test the publisher |
| Handler runs twice | Duplicate mount or dual publication | Add instance and operation IDs | Abort prior lifecycle and remove migration duplicate |
| Handler runs after unmount | Listener attached to long-lived target | Inspect signal and heap snapshot | Tie subscription to lifecycle owner |
| `preventDefault()` appears ignored | Event is not cancelable | Inspect `event.cancelable` | Use a cancelable request event |
| Caller proceeds before async work ends | Async listener assumed to be awaited | Trace promise lifecycle | Use explicit async orchestration |
| Events appear out of order | Nested dispatch or hidden ordering dependency | Add timestamps and correlation IDs | Move workflow to a coordinator |
| Shadow consumer sees no event | `composed` or bubbling contract is wrong | Test actual shadow DOM | Expose a deliberate public composed event |
| Memory grows after navigation | Listener retains old view | Heap snapshot and detached-node inspection | Abort or unsubscribe on teardown |
| Telemetry contains sensitive fields | Full payload logging | Inspect logger and event wrapper | Redact and whitelist fields |
| Test passes but production misses event | Test manually dispatched the event | Exercise actual publisher | Add producer-consumer integration test |

## Accessibility Checklist for Event-Driven Interfaces

- Use native buttons for actions and anchors for navigation.
- Provide a visible `:focus-visible` indicator for keyboard navigation.
- Ensure pointer and keyboard paths call the same domain operation.
- Do not assume assistive technology observes arbitrary custom events.
- Reflect state changes in semantic DOM and accessible status text where needed.
- Keep focus management explicit when a dialog opens or closes.
- If a requested action is vetoed, explain why in visible and accessible UI.
- Ensure events do not create duplicate announcements through multiple live regions.
- Support reduced motion independently of the event contract.
- Test with keyboard-only interaction and at least one screen-reader/browser combination when the interface is important.

## Review Rubric

Score each area as pass, needs work, or not applicable, and explain any exception.

1. **Meaning:** event names describe stable domain facts or requests.
2. **Payload:** detail is documented, minimal, and safe to expose.
3. **Timing:** dispatch occurs at a consistent point in the state transition.
4. **Target:** audience and propagation are intentionally constrained.
5. **Cancellation:** cancelable events have synchronous veto semantics only.
6. **Async behavior:** promises and failures are managed outside dispatch semantics.
7. **Ownership:** every listener has a lifecycle and cleanup path.
8. **Isolation:** unrelated modules do not subscribe to internal events by accident.
9. **Observability:** debugging metadata is useful, redacted, and bounded.
10. **Testing:** publisher, consumer, teardown, duplicate events, and failure paths are covered.
11. **Accessibility:** semantic controls and keyboard behavior do not depend on custom event names.
12. **Maintainability:** a new engineer can find the event catalog and understand why each event exists.

A passing review does not mean every interaction must use custom events. A direct call is often the best architecture for a synchronous operation with one known caller and one known result. The goal is intentional communication, not maximum event usage.

## Advanced Considerations

### Event Replay Is Not Built In

A plain event target is ephemeral: if a consumer subscribes after an event has already fired, it does not receive the old event. This behavior is often correct for transient UI signals. It is not sufficient for state synchronization where late subscribers need the current state. Do not work around this by retaining every event in an ad hoc array unless you are intentionally designing a log with ordering, retention, and replay semantics. For current state, use a state store or expose a query function. For durable history, use an explicit event log with a persistence contract.

### Idempotency and Duplicate Delivery

Browser `EventTarget` dispatch itself does not spontaneously duplicate a single dispatch, but application architecture can publish the same semantic event from multiple paths. A form handler may publish on both `submit` and a button `click`; a migration may emit both old and new events; or remounting can register duplicate listeners. Critical consumers should be robust against accidental duplicates where practical. Include an operation ID when useful, and make server-side mutations idempotent independently of frontend events. Do not use a timestamp alone as a unique identifier.

### Ordering, Nested Dispatch, and Microtasks

Synchronous dispatch gives predictable ordering within one call stack, but nested events can create surprising call graphs. A listener can dispatch another event, mutate shared state, or synchronously trigger a second component render. Moving dispatch into a microtask changes the point at which state is observed and can allow more code to run before listeners execute. Moving work into a task or animation frame changes timing even further. Choose the timing intentionally, document it, and test the actual boundary. Do not use arbitrary timeouts to paper over ordering problems.

### Framework Integration

In component frameworks, register listeners at a lifecycle boundary and clean them up in the corresponding teardown. Avoid module-level subscriptions that capture component state unless the subscription truly belongs to the application lifetime. Framework state updates may be batched or scheduled, while native event dispatch is synchronous; consumers should not assume the DOM has been committed by the time a custom event listener runs. If the event announces a completed render, emit it from the framework's post-commit lifecycle rather than immediately after scheduling a state update. Keep framework-specific scheduling outside the generic event contract where possible.

### Server Rendering and Hydration

A browser event target does not provide server-side rendering semantics. Code that creates browser-only globals during module evaluation may fail in a server environment. Create DOM listeners in browser-only lifecycle code, and avoid assuming `window` or `document` exists when importing an event module. Hydration can also cause duplicate subscriptions if setup runs twice without cleanup. Test client initialization and teardown explicitly, and keep event bus construction injectable for unit tests.

### Security, Privacy, and Third-Party Code

Events on globally accessible targets can be observed or dispatched by other scripts executing in the page. Keep sensitive details out of payloads, validate event data at module boundaries, and re-check authorization at the action itself. A publisher's identity is not authenticated by the event name. If third-party widgets can access the target, do not use event presence as proof that a trusted operation occurred. Cross-origin frames should use validated messaging boundaries, including origin checks and schema validation, before data becomes an internal application event.

### Browser DevTools Workflow

When an event is missing, inspect the exact target and listener registration before changing the event name. Add a temporary trace at the publishing site and at the subscribing site, with the same correlation ID. When an event fires twice, record the component instance ID and the source operation to determine whether there are two publishers or two listeners. For memory issues, repeat mount/unmount cycles, take heap snapshots, and inspect retained paths to detached elements. When debugging event propagation, test the real DOM hierarchy and shadow boundary; a unit test on a plain EventTarget cannot reveal those platform details.

### Performance and Backpressure

A semantic event stream should generally represent meaningful transitions, not every low-level sample. For pointermove, scroll, or resize-driven activity, separate raw input handling from semantic publication. Coalesce expensive rendering through `requestAnimationFrame`, debounce or throttle only when the product semantics permit it, and avoid doing heavy work in multiple synchronous subscribers. If a producer can emit faster than consumers can process, `EventTarget` has no built-in backpressure or queue limit. Build an explicit queue or sampling policy rather than assuming dispatch will slow the producer.

### Compatibility and Polyfills

`EventTarget`, `Event`, and `CustomEvent` are available in modern browsers, but support details can differ in older browser versions and non-browser runtimes. Verify the project's actual support matrix before introducing a polyfill. Some server-side runtimes provide `EventTarget` without a full DOM, so bubbling, `composedPath()`, or element-specific behavior may not exist. Keep browser integration tests for the features the app relies on, and avoid using a passing Node unit test as proof of shadow DOM or DOM propagation behavior.

### Naming Review Examples

Prefer `cart:item-added` over `cart:update` because the former tells consumers what happened. Prefer `dialog:close-requested` over `dialog:close` when listeners can veto the transition. Prefer `document:saved` over `save:done` because it names the domain entity and completed fact. Prefer `search:results-received` over `search:update` if the event specifically reports arrival of a result set. Names are not prose decoration; they are the first layer of documentation and should distinguish facts, requests, and UI-only signals.


## Skill Navigation

- Foundations: sections 1–15.
- Advanced numbered concepts: sections 16–27.
- Implementation patterns: patterns 1–8.
- Failure catalog: Common Mistakes table.
- Validation workflow: Production Challenge and Definition of Done.
