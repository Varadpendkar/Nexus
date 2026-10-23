# SKILL: drag-drop-ui
**Layer:** 15 — UI Components
**Goal:** Build robust drag-and-drop interactions with stable identity, accessible non-pointer alternatives, clear target feedback, safe cancellation, and reliable persistence.

---

## Why This Matters (Senior Perspective)

Drag and drop looks simple because the visible interaction is familiar: pick something up, move it, and release it. The engineering contract is much broader. A production implementation must coordinate pointer or native drag events, hit testing, target eligibility, keyboard behavior, touch scrolling, visual previews, persistence, rollback, and concurrent application state. If these concerns are mixed into one event handler, the component tends to work only in the developer's preferred browser and only on the happy path.

Senior engineers define the operation before choosing the gesture. Is the user reordering an item, moving it between containers, copying content, or uploading a file? Each action has different data integrity and security implications. A reorder needs a stable ordering model; a cross-container move needs source and destination validation; a file drop needs untrusted-payload handling. The interaction should produce one explicit domain operation that can be called from pointer input, keyboard controls, or a regular Move menu.

The key separation is between preview and commit. While the pointer moves, the UI can show a ghost, insertion marker, and eligible target. Those are temporary signals, not persistent state. The actual move should happen once, at a clearly defined commit boundary, after resolving current item and target identities and checking current rules. If persistence fails, the interface must recover without erasing newer changes.

Accessibility is part of the feature contract, not an optional enhancement. A user who cannot perform precise dragging still needs to accomplish the same action. Provide keyboard interaction or explicit movement controls, maintain focus, and announce meaningful outcomes. On touch devices, protect normal scrolling and zoom instead of turning the entire card into a drag surface.

Finally, drag-and-drop is a performance-sensitive interaction. Pointer movement can occur many times per frame, target geometry can change during scrolling, and overlays can be clipped by stacking contexts. Use a lifecycle controller, coalesce visual updates, centralize cleanup, and test cancellation, server rejection, concurrent changes, and every supported input modality. The result should feel direct while remaining predictable, secure, and recoverable.

## Core Concepts

### 1. Define the operation before the gesture

Distinguish reorder, cross-container move, copy, file upload, and marker placement. Each action has different persistence, validation, cancellation, and recovery semantics.

**Implementation approach:** Model the domain operation explicitly, for example item ID, source container ID, target container ID, and destination item ID. Keep gesture-specific details out of the business operation so pointer, keyboard, and menu controls can reuse it.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** The visible preview is not proof that the operation is allowed or saved.


### 2. Use stable identity rather than indexes

Indexes describe a temporary rendering order. They become stale when items are filtered, sorted, inserted, deleted, or changed by another user.

**Implementation approach:** Capture stable source and container IDs at activation, then resolve the current entities at drop time. Prefer an intent such as 'move A before B in column C' over 'move index 2 to index 5'.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** If the same record can appear in multiple containers, include container identity in the operation.


### 3. Represent the interaction as a state machine

A drag has distinct phases: idle, pressed, dragging, target preview, committing, completed, and canceled. A single boolean cannot express all cleanup and persistence cases.

**Implementation approach:** Use a reducer or controller with explicit transitions. Define how pointerup, pointercancel, Escape, lost pointer capture, blur, route change, and unmount terminate the interaction. Keep persistent request status separate from transient gesture status.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Cleanup must be idempotent because several termination events may occur for one gesture.


### 4. Separate preview from commit

The ghost, insertion marker, and highlighted target are temporary visual feedback. Mutating the data model during hover creates repeated writes and difficult rollback.

**Implementation approach:** Update a lightweight candidate target while moving. On drop, resolve current IDs, validate once more, and dispatch a single domain operation. If the operation is optimistic, track it by operation ID and reconcile the server result.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Do not make network requests or reorder the entire dataset in a high-frequency pointermove handler.


### 5. Make target feedback truthful

Users need to distinguish a valid destination, an invalid destination, and a target that is merely under the pointer. A decorative hover state can promise an operation that will later fail.

**Implementation approach:** Show an insertion line for reordering, a destination highlight for transfers, and concise reasons for blocked targets. Combine shape, text, and iconography rather than relying on color alone.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Target eligibility can become stale if permissions, capacity, or workflow state changes; validate again at drop.


### 6. Treat cancellation as a normal outcome

Users cancel drags by pressing Escape, releasing outside a target, interrupting a touch gesture, leaving the page, or losing the source item. Without a cancellation path, overlays and scroll loops can remain active.

**Implementation approach:** Restore the source presentation, remove the preview, release pointer capture, cancel animation frames, stop auto-scroll, and clear temporary selection suppression. Route all termination paths through shared cleanup.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Never assume pointerup will always reach the original element.


### 7. Support touch without hijacking scrolling

Touch gestures compete with page scrolling, browser zoom, and tapping. Starting a drag on every touch makes cards difficult to browse.

**Implementation approach:** Use a dedicated handle, optional long-press activation, and a non-drag alternative such as Move controls or a destination menu. Limit touch-action changes to the handle and preserve normal gestures elsewhere.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Test on actual mobile browsers; desktop emulation does not reproduce every native drag behavior.


### 8. Provide keyboard and assistive-technology alternatives

Precise pointer movement cannot be the only way to reorder or transfer an item. Keyboard users need an equivalent domain action and clear feedback.

**Implementation approach:** Offer documented pickup, arrow-key movement, drop, and cancel keys, or explicit Move up/down and Move to controls. Announce meaningful state transitions and preserve focus by stable item identity.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Do not announce every pixel-level pointer change or force focus to jump during automatic preview updates.


### 9. Make optimistic updates reversible

Immediate visual movement feels responsive, but server rejection must not leave a false saved state. Restoring a stale full-array snapshot can erase other updates.

**Implementation approach:** Represent the move as an operation with an ID. Apply it optimistically, reconcile canonical server data on success, and use operation-aware rollback or refetch on failure. Show a useful error and a retry path.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** A whole-list snapshot rollback is unsafe when unrelated mutations may have occurred since the snapshot.


### 10. Validate on the client and enforce on the server

Client validation provides fast feedback but can be bypassed by modifying browser state or calling APIs directly.

**Implementation approach:** Validate obvious target rules in the UI, then send structured IDs and intent to the server. The server must re-check identity, permissions, source state, target constraints, and concurrency rules before persisting.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** A client-side disabled target is not an authorization boundary.


### 11. Handle concurrent ordering changes

Two users can reorder the same collection at once. A stale index can produce a surprising move or overwrite newer order.

**Implementation approach:** Use intent-based operations, versions/ETags, or a documented conflict policy. Reconcile with canonical order returned by the server and explain when the client needs to refresh.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** For collaborative boards, decide whether to queue, reject, or merge overlapping moves.


### 12. Keep pointer rendering smooth

Pointer movement can fire many times per frame. Frequent layout reads, array mutations, and large component renders cause lag and inaccurate aiming.

**Implementation approach:** Coalesce visual updates with requestAnimationFrame, move overlays with transforms, cache target geometry, and invalidate it when scrolling or resizing. Profile before adding memoization or virtualization.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Transforms create stacking contexts and can change how fixed-position descendants behave.


### 13. Implement auto-scroll deliberately

Users need to reach targets beyond the visible viewport, but naive edge scrolling may move the wrong container or accelerate uncontrollably.

**Implementation approach:** Identify the nearest eligible scroll container, calculate bounded velocity from pointer distance to the edge, and run one animation loop. Stop it on every completion and cancellation path.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Define a priority rule for nested scroll containers and prevent multiple scroll loops from running together.


### 14. Choose native drag-and-drop when it fits

HTML Drag and Drop is useful for desktop file drops and simple transfers, but its event model and touch support differ from custom pointer interactions.

**Implementation approach:** For native drops, inspect DataTransfer types, prevent default on accepted dragover targets, validate at drop, and keep the operation layer separate. For complex sortable UI, compare a maintained library or pointer controller.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** Filenames and MIME labels are untrusted metadata, not proof that a file is safe.


### 15. Tie drag state to application lifecycle

A source can be deleted, permissions can change, or the user can switch workspaces while a drag is active.

**Implementation approach:** Cancel on unmount, route changes, and relevant context changes. Before commit, resolve current source and target entities and revalidate the operation. Detach listeners and cancel animation work.

```html
<section aria-labelledby="board-heading">
  <h2 id="board-heading">Sprint tasks</h2>
  <ol class="task-list" aria-label="Tasks in this sprint">
    <li data-item-id="task-42">
      <article>
        <button type="button" class="drag-handle" aria-label="Move Prepare release notes">
          <span aria-hidden="true">⠿</span>
        </button>
        <h3>Prepare release notes</h3>
        <p>Draft the customer-facing release summary.</p>
        <button type="button">Move to…</button>
      </article>
    </li>
  </ol>
  <p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
</section>
```

```js
function createMoveOperation(itemId, sourceContainerId, targetContainerId, beforeItemId = null) {
  if (!itemId || !sourceContainerId || !targetContainerId) {
    throw new TypeError('A move requires an item and source/target containers.');
  }
  return {
    operationId: crypto.randomUUID(),
    itemId,
    sourceContainerId,
    targetContainerId,
    beforeItemId
  };
}

async function commitMove(operation, context) {
  const validation = validateMove(operation, context);
  if (!validation.ok) throw new Error(validation.reason);
  // The server must independently validate identity, authorization, and current state.
  return api.moveItem(operation);
}
```

The markup gives the draggable item a named handle and a non-drag Move action. The JavaScript models the change as an operation with stable identities rather than a visual index. In a complete implementation, the operation is produced by a tested interaction controller and reconciled with authoritative server state.

**Naive vs correct:** Naive code mutates the array on every pointer move and sends the new order immediately. Correct code updates transient preview state during movement, validates the latest source and target at drop time, and dispatches one operation that can be confirmed or rolled back.

**Gotcha:** Pointerup, pointercancel, lost pointer capture, Escape, and component unmount can all end an interaction. Route all endings through idempotent cleanup so the overlay, listeners, scroll lock, and pending animation frame cannot remain active.

**Edge/system-level consideration:** A drag that was valid at start is not guaranteed to remain valid at drop.


## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Handle-first activation

**What it does:** Starts movement from a dedicated handle while leaving card links, buttons, and text selection usable.

**When to use it:** Sortable rows and cards containing other controls.

**Implementation:**

```js
<article class="task-card">
  <button type="button" class="drag-handle" aria-label="Move Prepare release notes"><span aria-hidden="true">⠿</span></button>
  <h3><a href="/tasks/42">Prepare release notes</a></h3>
  <button type="button">Move to…</button>
</article>
```

**Nuance / edge case:** Provide a non-drag alternative and include the item's identity in the accessible name.


### Pattern 2: Intent-based reorder

**What it does:** Expresses a move with stable IDs instead of indexes that can become stale.

**When to use it:** Persistent ordering and collaborative lists.

**Implementation:**

```js
function moveBefore(items, movingId, beforeId) {
  if (movingId === beforeId) return items;
  const moving = items.find((item) => item.id === movingId);
  if (!moving) return items;
  const rest = items.filter((item) => item.id !== movingId);
  const index = beforeId == null ? rest.length : rest.findIndex((item) => item.id === beforeId);
  if (index < 0) return items;
  rest.splice(index, 0, moving);
  return rest;
}
```

**Nuance / edge case:** Resolve identities against current state at commit time; do not assume the target still exists.


### Pattern 3: Pointer updates with animation frames

**What it does:** Coalesces high-frequency pointer updates into a single visual write per frame.

**When to use it:** Custom overlays or precise pointer-based interactions.

**Implementation:**

```js
let frameId = 0;
let latest = null;
function onPointerMove(event) {
  latest = { x: event.clientX, y: event.clientY };
  if (frameId) return;
  frameId = requestAnimationFrame(() => {
    frameId = 0;
    if (latest) preview.style.transform = `translate3d(${latest.x}px, ${latest.y}px, 0)`;
  });
}
function stopPreview() {
  if (frameId) cancelAnimationFrame(frameId);
  frameId = 0;
  latest = null;
}
```

**Nuance / edge case:** Pair with pointercancel, lostpointercapture, and unmount cleanup.


### Pattern 4: Optimistic move with operation ID

**What it does:** Correlates a temporary move with its server confirmation or rejection.

**When to use it:** When instant feedback matters and persistence may fail.

**Implementation:**

```js
const operation = { id: crypto.randomUUID(), itemId, targetContainerId, beforeItemId };
dispatch({ type: 'move/optimistic', operation });
try {
  const canonical = await api.moveItem(operation);
  dispatch({ type: 'move/confirmed', operationId: operation.id, canonical });
} catch (error) {
  dispatch({ type: 'move/rejected', operationId: operation.id, message: safeMessage(error) });
}
```

**Nuance / edge case:** Ignore late responses for superseded operations and avoid restoring an obsolete whole-list snapshot.


### Pattern 5: Keyboard pickup and placement

**What it does:** Provides a keyboard-operated path for choosing an item, moving it, dropping it, or canceling.

**When to use it:** Reorderable lists where position matters.

**Implementation:**

```js
function onHandleKeyDown(event, itemId) {
  if (event.key === ' ' && !state.active) {
    event.preventDefault();
    startKeyboardMove(itemId);
  } else if (state.active && event.key === 'ArrowDown') {
    event.preventDefault();
    moveKeyboardTarget(1);
  } else if (state.active && event.key === 'Escape') {
    event.preventDefault();
    cancelKeyboardMove();
  } else if (state.active && event.key === 'Enter') {
    event.preventDefault();
    commitKeyboardMove();
  }
}
```

**Nuance / edge case:** Document the key model and announce the final position. Explicit Move controls are also a valid alternative.


### Pattern 6: Drop validation pipeline

**What it does:** Centralizes target checks and gives the user consistent feedback.

**When to use it:** Targets depend on item type, permissions, capacity, or workflow state.

**Implementation:**

```js
function validateDrop({ item, target, context }) {
  if (!item || !target) return { ok: false, reason: 'The item or destination no longer exists.' };
  if (!context.canMove(item, target)) return { ok: false, reason: 'You cannot move this item there.' };
  if (!target.accepts(item)) return { ok: false, reason: 'This destination does not accept this item.' };
  return { ok: true };
}
```

**Nuance / edge case:** The server must repeat validation using current data; client checks only improve the interaction.


### Pattern 7: Accessible outcome announcements

**What it does:** Announces meaningful state transitions without making the whole list a live region.

**When to use it:** Moves that change order or container membership.

**Implementation:**

```js
<p id="move-status" role="status" aria-live="polite" aria-atomic="true"></p>
<script>
function announceMove(message) {
  document.querySelector('#move-status').textContent = message;
}
</script>
```

**Nuance / edge case:** Keep the status node mounted and announce success, cancellation, or error—not every pointer movement.


## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|

| Mutating data during pointer movement | Preview and persistence become coupled. | Keep candidate placement transient and commit once on drop. |

| Using indexes as stable identity | Indexes shift when collections change. | Use item and container IDs and resolve them at commit. |

| Starting a drag from the entire card | Links, buttons, text selection, and touch scrolling become awkward. | Use a dedicated handle and independent controls. |

| Ignoring pointercancel | Interrupted gestures can leave stale overlays. | Route cancellation through centralized idempotent cleanup. |

| Assuming pointerup reaches the source | The pointer may leave the source or viewport. | Use pointer capture where appropriate and define lifecycle-level cleanup. |

| Committing on hover | Moving across targets causes unintended changes. | Use hover for preview and commit at one validated boundary. |

| Using color as the only target signal | The state may be inaccessible or ambiguous. | Combine insertion markers, text, icons, and shape changes. |

| Omitting keyboard alternatives | The action requires precise pointer movement. | Provide keyboard movement or equivalent explicit controls. |

| Disabling touch scrolling globally | Normal browsing and zoom gestures are blocked. | Restrict gesture changes to the handle only. |

| Trusting client permissions | Client state can be manipulated. | Enforce authorization and business rules on the server. |

| Rolling back a stale array snapshot | Rollback can erase newer unrelated changes. | Use operation-aware rollback or refetch canonical state. |

| Ignoring deleted targets | The operation references stale entities. | Resolve current IDs and cancel with a recovery message. |

| Measuring every target on every pointer event | Synchronous layout work causes jank. | Cache geometry and invalidate it on scroll or resize. |

| Leaving auto-scroll active after cancellation | A loop continues after the drag ends. | Tie the loop to lifecycle state and stop it in shared cleanup. |

| Trusting DataTransfer metadata | Payload labels can be fabricated. | Validate file content and authorization on the server. |

| Losing focus after keyboard movement | DOM reordering can detach the focused node. | Restore focus by stable item ID and announce the new position. |

| Showing a valid hover for an invalid operation | Visual feedback becomes misleading. | Validate at drop and explain a rejected operation. |

| Allowing duplicate commits | Several end events can fire for one gesture. | Use an idempotent transition and operation ID. |

| Clipping the preview under overlays | Overflow and stacking contexts constrain descendants. | Use a suitable overlay layer or portal and test real layouts. |

| Testing only with a mouse | Touch, keyboard, and cancellation differ. | Test every supported modality and failure path. |


### Before / after: commit once, at the operation boundary

Incorrect:

```js
// Wrong: hover events mutate persistent order repeatedly.
function onDragOver(targetIndex) {
  setItems((items) => reorder(items, draggedIndex, targetIndex));
  saveOrder(items);
}
```

Correct:

```js
function onDragOver(target) {
  setPreviewTarget(validateCandidate(dragState.itemId, target.id));
}

async function onDrop(target) {
  const operation = buildOperationFromCurrentIds(dragState.itemId, target.id);
  const validation = validateDrop(operation, getCurrentContext());
  if (!validation.ok) {
    announceMove(validation.reason);
    cancelDrag();
    return;
  }
  await dispatchMoveOnce(operation);
}
```

The corrected flow keeps pointer movement cheap and makes the persistent transition auditable. It also gives the application one place to handle duplicate completion events, authorization feedback, optimistic updates, and server reconciliation.

## Mental Models


### Pointer means intent, not truth

Pointer position suggests a destination; current data and validation decide whether the operation is allowed.


### Move identities, not indexes

Stable IDs survive sorting, filtering, and concurrent updates.


### Preview is not commit

The ghost and insertion marker are temporary feedback; persistence happens at one explicit boundary.


### Every start needs an end

Success, Escape, cancellation, blur, unmount, and invalid targets all require cleanup.


### A handle is a promise

If a drag is offered, the same action must be possible without precise pointer movement.


### Optimism needs a reverse path

Immediate movement is safe only when failure can be reconciled without erasing newer state.


### Client validation is UX; server validation is security

The browser can explain a blocked drop, but the server must authorize the mutation.


### Geometry is temporary

Scrolling, resizing, sticky elements, and virtualization can invalidate cached target positions.


## Quick Reference

| Concern | Recommended default | Watch out for |
|---|---|---|

| Identity | Stable item/container IDs | Indexes are temporary presentation data |

| Activation | Dedicated handle | Do not hijack text selection or card controls |

| Lifecycle | Explicit state machine | Cleanup must be idempotent |

| Preview | Transient state | Do not persist during hover |

| Hit testing | Cache geometry and invalidate deliberately | Avoid layout reads on every event |

| Touch | Preserve scrolling outside the handle | Do not disable gestures globally |

| Keyboard | Pickup, move, drop, cancel—or explicit Move controls | Document the interaction model |

| Validation | Check on hover and again on drop | Server remains authoritative |

| Optimism | Operation IDs and reversible transitions | Avoid stale snapshot rollback |

| Concurrency | Intent-based operations or versions | Indexes can become stale |

| Auto-scroll | Bounded velocity, one loop | Stop on every termination path |

| Native DnD | Use for suitable file/desktop cases | DataTransfer is untrusted |

| Announcements | Announce meaningful transitions | Do not flood the live region |

| Performance | requestAnimationFrame for visuals | Keep network work out of pointermove |

| Testing | Keyboard, touch, cancellation, rollback, concurrency | Happy path is not enough |


## Build Challenge

Build a reorderable task board with at least two columns, persistent item ordering, a custom drag preview, and a non-drag way to move each task. Use stable task and column IDs. The board must handle pointer cancellation, server rejection, keyboard movement, and changes that occur while a drag is in progress.

### Requirements

1. Define the domain operation for moving an item, including item ID, source container ID, target container ID, and destination identity.
2. Use a dedicated drag handle so links, buttons, text selection, and ordinary card interaction remain usable.
3. Implement an explicit interaction lifecycle with start, preview, drop, commit, and cancel states.
4. Keep pointer movement in transient preview state; do not persist the move on hover.
5. Use requestAnimationFrame or an equivalent mechanism to coalesce high-frequency visual updates.
6. Handle pointercancel, lost pointer capture, Escape, blur, unmount, and route/context changes.
7. Resolve current source and target by stable IDs at drop time.
8. Validate destination eligibility before committing and repeat authorization checks on the server.
9. Provide keyboard pickup, destination selection, drop, and cancellation or equivalent Move controls.
10. Announce meaningful pickup, destination, completion, and failure states without flooding assistive technology.
11. Preserve focus on the same logical item after keyboard movement.
12. Implement an optimistic update with operation-aware rollback or canonical server reconciliation.
13. Prevent duplicate commits if multiple lifecycle events attempt to finalize the same drag.
14. Handle a source or destination that disappears during the interaction.
15. Support auto-scroll near container edges with bounded velocity and centralized cleanup.
16. Test overlay stacking, clipping, sticky headers, and nested scroll containers.
17. Keep normal touch scrolling available outside the drag handle and provide a non-drag touch alternative.
18. Validate file or native DataTransfer payloads if file dropping is included.
19. Add unit tests for operation creation, target validation, ordering, and rollback.
20. Add integration tests for keyboard-only use, touch cancellation, concurrency, and server rejection.

### Failure scenarios

- **Pointer cancellation:** the user begins a drag and the browser emits pointercancel. The overlay and auto-scroll loop must stop without changing persistent order.
- **Stale destination:** another user removes the destination column while the drag is active. The drop must be rejected safely with a recoverable message.
- **Server rejection:** the UI previews and optimistically applies a move, but the server denies it. The client must reconcile without erasing unrelated newer changes.
- **Duplicate finalization:** pointerup and a later cleanup event both run. The move must commit at most once.
- **Keyboard reordering:** a user moves an item without a pointer. Focus remains on the logical item and the new position is announced.
- **Touch scrolling:** the user swipes the list outside the handle. The page scrolls normally rather than starting a drag.
- **Concurrent reorder:** another user changes the list order before this move commits. The client follows a documented conflict policy and does not trust stale indexes.
- **Clipped preview:** the drag overlay crosses a container with overflow hidden and a sticky header. It remains visible in the intended layer.
- **Source removal:** the item is deleted while being dragged. The operation cancels and all temporary listeners are removed.
- **Untrusted file drop:** a file has a misleading extension or MIME label. The server validates actual content before processing.

### Definition of Done / Success Criteria

- [ ] Drag behavior is implemented as a state machine with centralized, idempotent cleanup.
- [ ] Persistent changes occur only at one explicit, validated commit boundary.
- [ ] Operations use stable item and container identities rather than indexes as permanent identity.
- [ ] The feature is usable with a keyboard and has an equivalent non-drag action.
- [ ] Touch scrolling and zoom remain available outside the intended drag handle.
- [ ] Focus and concise status announcements remain correct after movement and cancellation.
- [ ] Optimistic failures reconcile without overwriting unrelated newer state.
- [ ] Server-side authorization and domain validation are enforced independently of client feedback.
- [ ] Auto-scroll, overlay stacking, and geometry updates are tested in realistic layouts.
- [ ] Unit and integration tests cover cancellation, duplicate events, stale targets, and concurrency.
- [ ] Any DataTransfer payload is treated as untrusted input.
- [ ] The implementation can explain its conflict policy and rollback strategy during review.


## Production Review Notes

### Lifecycle transition table

| Current state | Event | Next state | Required behavior |
|---|---|---|---|
| Idle | Handle activated | Pressed | Capture source identity and origin |
| Pressed | Movement threshold crossed | Dragging | Create overlay and suppress accidental click |
| Dragging | Eligible target entered | Preview | Validate and show feedback |
| Preview | Target changes | Preview | Recompute candidate without data mutation |
| Dragging | Release on valid target | Committing | Revalidate and dispatch one operation |
| Committing | Server confirms | Completed | Reconcile canonical result and announce |
| Committing | Server rejects | Recovered | Roll back safely and show recovery message |
| Any active state | Escape or pointercancel | Canceled | Remove overlay and stop auxiliary loops |
| Any active state | Route change or source removal | Canceled | Release listeners and stale references |

### Input modality matrix

| Modality | Start | Move | Complete | Cancel |
|---|---|---|---|---|
| Mouse | Handle press | Pointer movement | Release on valid target | Escape or invalid release |
| Touch | Long press or explicit affordance | Touch movement | Release on target | Gesture cancellation |
| Keyboard | Focus handle and pickup key | Arrow keys or destination controls | Enter/Space | Escape |
| File drop | Browser file drag | Native drag events | Drop on accepted zone | Drop elsewhere |

Native HTML Drag and Drop and Pointer Events are different interaction systems. Do not assume their lifecycle events overlap. Choose a model for each use case and keep the domain operation underneath both models consistent.

### Geometry, overlays, and scrolling

Capture the offset between the pointer and the dragged item's origin so the preview does not jump. Use transforms for movement and avoid repeatedly changing layout-affecting properties. Target geometry becomes stale when a scroll container moves, a sticky header changes, a panel resizes, or virtualized content mounts. Recalculate at meaningful boundaries rather than on every pointer event.

For auto-scroll, select the nearest eligible scroll container under the pointer. Compute a bounded velocity based on distance from the edge and update it in one animation loop. Recalculate the target after scroll movement. Stop the loop immediately when the drag ends, the pointer leaves the activation region, or the interaction is canceled. Nested containers need an explicit priority rule so the page and inner panel do not scroll at the same time unexpectedly.

### Persistence and conflict policy

Define what the server operation means. “Move item A to index 4” is ambiguous if the list changes before commit. “Move A before B in container C” expresses intent more clearly. Include a version or ETag when stale writes must be rejected. If the server returns canonical ordering, reconcile to that ordering instead of assuming the client preview is final.

For optimistic updates, retain enough information to reverse the specific operation. Do not blindly restore a full list snapshot if another user or another component may have changed data since the snapshot was taken. Operation IDs let the client correlate a pending move with its success or failure. If two moves overlap, define whether the later operation supersedes, queues behind, or conflicts with the earlier operation.

### Accessibility verification

Test without a mouse. A keyboard user must identify the item, initiate a move, choose a destination, confirm it, and cancel it. Announcements should describe the item and its resulting position or destination. Avoid announcing every intermediate pointer target. If Move up/down buttons or a Move to menu are clearer than a simulated drag interaction, prefer those controls.

After reordering, verify that focus remains on the same logical item. A DOM node may move or remount, so restore focus using a stable ID rather than an old element reference. A visual insertion marker should not be the only indication of the destination. Ensure focus rings and target feedback remain visible in high contrast and in both light and dark themes.

### Security and privacy

Treat native drag payloads as untrusted. Filenames, MIME labels, custom text, and IDs can be fabricated. Validate type and size client-side for immediate feedback, then validate file content, authorization, and business rules on the server. Never evaluate dropped text as code or inject it through unsafe HTML APIs.

Telemetry should record an operation category, outcome, and duration only where approved. Avoid logging private filenames or dragged text by default. Distinguish canceled attempts from rejected commits; they are different product signals. Keep error messages actionable without revealing protected resources or sensitive server details.

### Release checklist

Test with a mouse, trackpad, touch device, keyboard-only navigation, and supported assistive technologies. Include pointercancel, Escape, lost pointer capture, route transition, source deletion, target deletion, server rejection, duplicate completion events, and concurrent list updates. Test sticky headers, nested scroll areas, overflow clipping, long lists, and narrow viewports. Check reduced-motion behavior if the preview animates.

Ask someone unfamiliar with the implementation to move an item and recover from a failed move without coaching. Observe whether the target is clear, the outcome is understandable, and the alternative to dragging is discoverable. A reliable component is defined by correct state transitions and recovery, not by the smoothness of its demo animation.
