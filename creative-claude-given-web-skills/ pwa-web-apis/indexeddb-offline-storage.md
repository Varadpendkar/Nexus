# IndexedDB Offline Storage

**Layer:** 18 — PWA & Web APIs  
**Skill:** `indexeddb-offline-storage`  
**Focus:** Durable structured client-side storage, indexes, transactions, schema upgrades, and reliable offline-first data flows.

## Goal

Build browser storage that can hold structured application data, query it efficiently, survive page reloads, and remain consistent when users edit data offline. Use IndexedDB as a database—not as a larger `localStorage`—and design for asynchronous operations, transaction boundaries, schema evolution, quota limits, and multi-tab behavior.

## Why This Matters

Creative sites increasingly include project planners, saved case studies, product configurators, editorial tools, offline forms, and dashboards. A user may lose connectivity while editing a project brief or return to a portfolio configurator days later. If data exists only in component state, it disappears on reload; if every object is serialized into one `localStorage` string, updates become coarse, synchronous, and difficult to query.

IndexedDB provides a browser-managed object database. It stores structured-clone-compatible values, supports indexes and key ranges, and performs reads and writes asynchronously. That makes it useful for offline-first experiences, but it does not remove the need to plan data shape, handle failures, or coordinate writes. Browser storage is best-effort in many contexts and can be cleared by users or evicted under storage pressure; never treat it as the only copy of irreplaceable data.

Use this skill when a site needs more than a handful of preferences: cached records, drafts, offline queues, local search, saved design state, or structured data that should be queried without downloading everything on each load.

## Core Concepts

### 1. IndexedDB Is an Asynchronous Object Database

IndexedDB stores records in object stores. Each record has a key, either supplied explicitly or derived from a key path. Calls are asynchronous and complete through request events or promises; they do not return a record immediately.

```js
const request = indexedDB.open("studio-workspace", 1);

request.onsuccess = () => {
  const db = request.result;
  console.log("Database ready:", db.name);
  db.close();
};

request.onerror = () => {
  console.error("Could not open database:", request.error);
};
```

The open request can trigger an upgrade when the database does not exist or the requested version is newer. The connection becomes usable only after `onsuccess`.

**Naive approach:** `const db = indexedDB.open("studio-workspace", 1); db.transaction(...)` immediately assumes the open request is already a database.

**Correct approach:** Wait for `onsuccess`, or wrap the request in a promise-based helper and expose the resolved database.

**Gotcha:** `indexedDB.open()` returns an `IDBOpenDBRequest`, not an `IDBDatabase`. Confusing the two causes errors that can look like a transaction problem.

### 2. Choose a Stable Database and Object-Store Model

Object stores are roughly analogous to tables, but their records are JavaScript values rather than rows with a fixed SQL schema. Design stores around entities with clear identity and access patterns.

```js
// Example record stored in the "projects" object store.
const project = {
  id: "case-study-042",
  title: "Aurora Commerce Redesign",
  status: "draft",
  updatedAt: Date.now(),
  tags: ["commerce", "webgl"]
};
```

A useful store key is stable across edits. Avoid using an array index or a title that users may change as the primary key.

**Naive approach:** Store every record in one `settings` object and rewrite the entire object whenever one project changes.

**Correct approach:** Give projects their own object store, identify each project by `id`, and create indexes for real query needs.

**Gotcha:** IndexedDB does not enforce an application-level schema for every property. Validate incoming values yourself; older records may not contain fields added by a later app version.

### 3. Open a Database with an Explicit Version

The version number controls schema upgrades. A higher requested version fires `upgradeneeded`, where stores and indexes can be created or modified.

```js
const request = indexedDB.open("studio-workspace", 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;
  if (!db.objectStoreNames.contains("projects")) {
    db.createObjectStore("projects", { keyPath: "id" });
  }
};
```

Keep schema changes deliberate and incremental. Do not increase the version for ordinary record updates; that is data work, not a schema migration.

**Naive approach:** Open the database at version `1` forever and attempt to create stores every time the app starts.

**Correct approach:** Use `upgradeneeded` only for schema changes, check whether stores exist, and bump the version when the schema genuinely changes.

**Gotcha:** Creating an object store is only allowed during a version-change transaction, such as the one available in `upgradeneeded`.

### 4. Wrap Requests in Promises Carefully

Promise wrappers make application code easier to read, but request completion and transaction completion are separate events. A request may succeed while the transaction later aborts.

```js
function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

async function getProject(db, id) {
  const tx = db.transaction("projects", "readonly");
  const request = tx.objectStore("projects").get(id);
  return requestToPromise(request);
}
```

For read-only helpers, the request result is often enough for a simple query. For writes, resolve only after the transaction completes so the caller knows the change committed.

**Naive approach:** Treat the `put()` request's success as proof that a write is durably committed.

**Correct approach:** Listen for the transaction's `complete`, `error`, and `abort` events for write operations.

**Gotcha:** A promise around a request is not a promise around the whole transaction. Build both abstractions where needed.

### 5. Read with `get()` and `getAll()`

Use `get(key)` when the key is known. `getAll()` is convenient for small stores, but it materializes every matching value in memory and should not be the default for unbounded data.

```js
async function listRecentProjects(db) {
  const tx = db.transaction("projects", "readonly");
  const store = tx.objectStore("projects");
  const records = await requestToPromise(store.getAll());
  return records.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
}
```

This is acceptable for a small portfolio editor. For a large local library, use an index, key range, or cursor so the browser does less work.

**Naive approach:** Call `getAll()` for 80,000 cached documents and filter them in JavaScript on every search keystroke.

**Correct approach:** Design indexes around the fields that the interface actually filters and sort by them where possible.

**Gotcha:** `getAll()` returns a snapshot array. Mutating an object in that array does not update the database; write the changed object back with `put()`.

### 6. Use `put()` for Insert-or-Update and `add()` for Insert-Only

`put()` inserts a record or replaces the record with the same key. `add()` fails if the key already exists. Pick the operation based on the desired invariant.

```js
async function saveProject(db, project) {
  const tx = db.transaction("projects", "readwrite");
  tx.objectStore("projects").put({
    ...project,
    updatedAt: Date.now()
  });
  await transactionToPromise(tx);
}

async function createUniqueProject(db, project) {
  const tx = db.transaction("projects", "readwrite");
  tx.objectStore("projects").add(project);
  await transactionToPromise(tx);
}
```

Use `put()` for autosaved drafts and `add()` when duplicate identity should be rejected, such as adding a new record with a generated ID.

**Naive approach:** Use `add()` for every autosave and treat `ConstraintError` as an intermittent failure.

**Correct approach:** Use `put()` when the operation is intentionally an upsert; use `add()` when duplicate keys indicate a real conflict.

**Gotcha:** A key-path field must be present when the store uses an inline key path, unless the store is configured to generate one.

### 7. Transactions Define Atomic Work

A transaction groups requests. If it completes, its changes commit together; if it aborts, the transaction's changes are rolled back. Keep transactions focused and short.

```js
async function renameProjectAndLog(db, id, title) {
  const tx = db.transaction(["projects", "activity"], "readwrite");
  const projects = tx.objectStore("projects");
  const activity = tx.objectStore("activity");
  const project = await requestToPromise(projects.get(id));

  if (!project) {
    tx.abort();
    throw new Error(`Project not found: ${id}`);
  }

  projects.put({ ...project, title, updatedAt: Date.now() });
  activity.add({ projectId: id, action: "rename", at: Date.now() });
  await transactionToPromise(tx);
}
```

The project update and activity entry should either both commit or both roll back. Transactions are not a place for network calls or long-running computation.

**Naive approach:** Update a project in one transaction and create its audit record in a second transaction, assuming they cannot get out of sync.

**Correct approach:** Include both stores in one `readwrite` transaction when the two changes form a single logical operation.

**Gotcha:** Do not `await` unrelated network requests inside a transaction. IndexedDB transactions can become inactive when control returns to the event loop without pending database requests.

### 8. Wait for Transaction Completion

A small helper makes write behavior consistent. Attach handlers immediately after creating the transaction, before queuing work that might fail.

```js
function transactionToPromise(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
    tx.onerror = () => reject(tx.error ?? new Error("Transaction failed"));
  });
}
```

A transaction's `error` event can bubble from a request and may be followed by abort. Handle both without pretending the operation succeeded.

**Naive approach:** `await requestToPromise(store.put(record))` and show “Saved” immediately.

**Correct approach:** Queue the write, then await `transactionToPromise(tx)` before updating the UI to a committed state.

**Gotcha:** Set transaction listeners before awaiting request promises; otherwise a very fast transaction could complete before your completion handler is attached.

### 9. Indexes Turn Access Patterns into Queries

An index maps a record property to its primary key, allowing lookup without scanning every record. Add indexes for actual filter and ordering needs, not every property in the object.

```js
const request = indexedDB.open("studio-workspace", 2);
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const tx = event.target.transaction;
  const projects = db.objectStoreNames.contains("projects")
    ? tx.objectStore("projects")
    : db.createObjectStore("projects", { keyPath: "id" });

  if (!projects.indexNames.contains("by-status")) {
    projects.createIndex("by-status", "status", { unique: false });
  }
  if (!projects.indexNames.contains("by-updatedAt")) {
    projects.createIndex("by-updatedAt", "updatedAt", { unique: false });
  }
};
```

An index costs storage and makes writes do more work, so index fields that the UI repeatedly queries.

**Naive approach:** Add an index for every field “just in case.”

**Correct approach:** Map each index to a concrete query such as “all drafts” or “recently updated projects.”

**Gotcha:** An index only includes records with valid indexable key values. Records missing the indexed property will not appear in that index's results.

### 10. Query with Key Ranges and Cursors

`IDBKeyRange` expresses bounded queries. Cursors are useful when you need to process records incrementally rather than materializing the entire result set.

```js
async function getProjectsUpdatedBetween(db, start, end) {
  const tx = db.transaction("projects", "readonly");
  const index = tx.objectStore("projects").index("by-updatedAt");
  const range = IDBKeyRange.bound(start, end);
  return requestToPromise(index.getAll(range));
}
```

For very large sets, use a cursor and stop when the needed page size is reached. Remember that cursors iterate in index-key order, not necessarily the order your UI expects.

**Naive approach:** Load all records, sort them in memory, then keep 20.

**Correct approach:** Query an index or cursor with a bounded range, and implement pagination at the data layer.

**Gotcha:** If multiple records share an index key, the index also uses primary-key ordering to distinguish them. Define the ordering expectations before relying on it for pagination.

### 11. Schema Migrations Must Preserve Existing Data

A schema migration runs during a version change. It can create stores, create indexes, and transform old records. Make migrations repeatable within their intended version and safe for real user data.

```js
const request = indexedDB.open("studio-workspace", 3);
request.onupgradeneeded = (event) => {
  const db = event.target.result;
  const tx = event.target.transaction;

  if (event.oldVersion < 2 && db.objectStoreNames.contains("projects")) {
    const projects = tx.objectStore("projects");
    if (!projects.indexNames.contains("by-status")) {
      projects.createIndex("by-status", "status", { unique: false });
    }
  }

  if (event.oldVersion < 3 && !db.objectStoreNames.contains("drafts")) {
    db.createObjectStore("drafts", { keyPath: "id" });
  }
};
```

For record transformations, use the upgrade transaction's object-store requests. Test upgrades from every supported prior version, not just from a clean install.

**Naive approach:** Delete the database whenever the schema changes so development starts clean.

**Correct approach:** Increment the version and migrate old records without discarding user work.

**Gotcha:** If a migration throws or its transaction aborts, the schema change does not complete. Report the failure and avoid entering a broken “ready” state.

### 12. Handle `versionchange` and Blocked Upgrades

A tab can keep an old database connection open while another tab tries to upgrade the schema. The old connection must close so the upgrade can proceed.

```js
function watchDatabaseConnection(db) {
  db.onversionchange = () => {
    db.close();
    window.dispatchEvent(new CustomEvent("database-version-change"));
  };
}

const request = indexedDB.open("studio-workspace", 4);
request.onblocked = () => {
  console.warn("Close other open tabs to finish the database update.");
};
```

In a production UI, show a clear refresh prompt if an old tab blocks a migration. Keep the app from silently continuing against a stale schema.

**Naive approach:** Ignore `onblocked` and tell users the app is frozen.

**Correct approach:** Close connections on `versionchange`, show a non-destructive “refresh this tab” message, and retry only after the old connection is gone.

**Gotcha:** A blocked upgrade is often caused by another tab, window, or worker that still has a connection open—not by a bad version number.

### 13. Store Structured-Clone-Compatible Values

IndexedDB can store many values beyond JSON, including arrays, objects, dates, blobs, and typed arrays, using the structured clone algorithm. Functions and DOM nodes are not valid stored records. Prefer plain, versionable data objects for application records.

```js
const draft = {
  id: crypto.randomUUID(),
  title: "Studio homepage",
  savedAt: new Date(),
  thumbnail: new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" })
};

const tx = db.transaction("drafts", "readwrite");
tx.objectStore("drafts").put(draft);
```

For binary assets, consider whether storing the full asset locally is justified by size, licensing, cache policy, and eviction behavior.

**Naive approach:** Attempt to store a React component, DOM element, or function as a record.

**Correct approach:** Store the serializable state needed to recreate the view; keep behavior and live UI objects in code.

**Gotcha:** Structured cloning is not the same as JSON serialization. Values that work in IndexedDB may not round-trip through `JSON.stringify()` with the same type.

### 14. Quota, Persistence, and Storage Pressure

Browser storage is subject to quotas and browser-specific eviction rules. A successful write today is not a guarantee that the data will remain forever. Ask for persistent storage only when the app has a legitimate need and can explain the value to users.

```js
async function inspectStorage() {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return {
    usageBytes: estimate.usage ?? 0,
    quotaBytes: estimate.quota ?? 0
  };
}

async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}
```

Use quota estimates for diagnostics and user guidance, not as a precise prediction of how much a particular write can safely consume.

**Naive approach:** Assume all saved data is permanent because the app uses IndexedDB.

**Correct approach:** Handle quota errors, let users export important data, and keep server backups for records that must not be lost.

**Gotcha:** Persistence grants and quota policies vary by browser. Do not make the core app unusable when `persist()` is unavailable or denied.

### 15. Coordinate Multiple Tabs and Concurrent Edits

Multiple tabs may read and write the same database. IndexedDB transactions provide atomicity, but your app still needs a conflict policy when two tabs edit the same logical record.

```js
async function saveWithRevision(db, incoming) {
  const tx = db.transaction("projects", "readwrite");
  const store = tx.objectStore("projects");
  const current = await requestToPromise(store.get(incoming.id));

  if (current && current.revision !== incoming.baseRevision) {
    tx.abort();
    throw new Error("This project changed in another tab. Reload before saving.");
  }

  store.put({ ...incoming, revision: (current?.revision ?? 0) + 1 });
  await transactionToPromise(tx);
}
```

The revision check and write must happen within one transaction to avoid a race between the read and the write. For richer collaboration, consider server-side conflict resolution or an explicit merge UI.

**Naive approach:** Let every tab overwrite the latest project without noticing that another tab changed it.

**Correct approach:** Add revision metadata or a timestamp policy and show a conflict state when edits cannot be merged safely.

**Gotcha:** A last-write-wins policy is simple but can silently erase work. Pick it intentionally rather than accepting it accidentally.

### 16. Build an Offline Write Queue Without Confusing It with Sync

IndexedDB can persist operations while offline. A queue is only the local record of intended work; a separate synchronization process must send it, retry safely, and resolve server conflicts.

```js
async function enqueueOperation(db, operation) {
  const tx = db.transaction("outbox", "readwrite");
  tx.objectStore("outbox").put({
    ...operation,
    id: operation.id ?? crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
    status: "pending"
  });
  await transactionToPromise(tx);
}
```

Use stable operation IDs so a server can deduplicate retries. Mark an operation complete only after the server confirms it; remove or archive it after a committed acknowledgement.

**Naive approach:** Delete an outbox item as soon as a network request begins.

**Correct approach:** Keep the operation pending until the server acknowledges success, and record enough metadata to retry safely.

**Gotcha:** `navigator.onLine` is only a hint. A device may report online while DNS, captive portals, authentication, or the server itself are unavailable.

### 17. Design for Privacy, Logout, and Data Ownership

Local data is still sensitive data. Browser profiles can be shared, devices can be lost, and XSS can read application data available to the page. Do not store secrets, access tokens, or payment credentials in IndexedDB just because it is structured storage.

```js
async function clearUserWorkspace(db) {
  const tx = db.transaction(["projects", "drafts", "outbox"], "readwrite");
  tx.objectStore("projects").clear();
  tx.objectStore("drafts").clear();
  tx.objectStore("outbox").clear();
  await transactionToPromise(tx);
}
```

Scope user-owned records with an account identifier when multiple accounts can use one browser profile. On logout, apply the product's explicit policy: clear private data, retain only intentionally device-local drafts, or offer export first.

**Naive approach:** Store private drafts globally and leave them visible after account switching.

**Correct approach:** Define data ownership, scope records, clear or isolate them on logout, and avoid storing credentials in the database.

**Gotcha:** Client-side encryption does not protect data from malicious JavaScript running in the same origin if that code can access the decryption key.

### 18. Test Failure Modes and Browser Differences

A local database is part of the app's persistence layer, so test it like one. Include fresh installs, upgrades, blocked connections, transaction aborts, quota failures, private browsing limitations, and multi-tab editing.

```js
async function saveDraftSafely(db, draft) {
  try {
    const tx = db.transaction("drafts", "readwrite");
    tx.objectStore("drafts").put(draft);
    await transactionToPromise(tx);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
```

The interface should distinguish “saved locally,” “waiting to sync,” and “synced to account.” Those are different states and should not be represented by the same green checkmark.

**Naive approach:** Test only in a development browser with an empty database.

**Correct approach:** Seed old-version databases, simulate failures, and verify the UI never claims a save succeeded when the transaction aborted.

**Gotcha:** Browser storage behavior and quota differ across engines and modes. Test the browsers your users actually use; do not rely on one machine's observed quota.

### 19. Use a Small Data Layer Instead of Scattering Database Calls

Components should call domain-specific functions such as `saveDraft()` or `listRecentProjects()`, not each construct their own transactions. A small repository layer centralizes store names, error handling, and migrations.

```js
const projectRepository = {
  async get(db, id) {
    const tx = db.transaction("projects", "readonly");
    return requestToPromise(tx.objectStore("projects").get(id));
  },
  async save(db, project) {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").put(project);
    await transactionToPromise(tx);
  }
};
```

Keep this layer focused. It should make the app easier to test without becoming a generic abstraction that hides transaction boundaries.

**Naive approach:** Let every button handler call `indexedDB.open()` and write raw request callbacks.

**Correct approach:** Open one managed connection, expose named repository functions, and keep UI concerns outside the persistence layer.

**Gotcha:** A repository should not silently swallow errors. Return or throw meaningful errors so the interface can show retry, export, or conflict options.

### 20. Real-World Integration: Offline Creative Project Planner

Combine stable IDs, indexed records, autosave, transactions, an outbox, and visible sync states in a project planner. The user can create a project, edit its title and notes without a connection, reload the page, and later sync the changes when connectivity returns.

```js
async function saveProjectDraft(db, draft) {
  const tx = db.transaction(["projects", "outbox"], "readwrite");
  const now = Date.now();
  const project = { ...draft, updatedAt: now, syncState: "pending" };
  tx.objectStore("projects").put(project);
  tx.objectStore("outbox").put({
    id: crypto.randomUUID(),
    entityId: project.id,
    type: "project-upsert",
    payload: project,
    createdAt: now,
    status: "pending",
    attempts: 0
  });
  await transactionToPromise(tx);
  return project;
}
```

The local project and its outbox operation commit together. A sync worker or page-level coordinator can later transmit pending operations, update sync state after acknowledgement, and preserve failures for retry.

**Naive approach:** Update the project locally, then separately enqueue sync work; a crash between those operations leaves a draft that never syncs.

**Correct approach:** Write the project and its outbox operation in the same transaction, then sync with idempotent server operations.

**Gotcha:** The local database can guarantee atomicity inside the browser, but it cannot guarantee server acceptance. Keep local persistence and remote synchronization as separate states.

## Patterns

### Pattern 1: Promise-Based Database Bootstrap

**What it does:** Opens a database once, applies schema changes during version upgrades, and exposes a reusable promise.

**When to use it:** When multiple screens need the same database and you want one consistent place for upgrade and connection errors.

```js
let databasePromise;

function openWorkspaceDatabase() {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("studio-workspace", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => console.warn("Database upgrade is blocked by another connection.");
  }).catch((error) => {
    databasePromise = undefined;
    throw error;
  });

  return databasePromise;
}
```

Resetting the cached promise on failure allows a later retry. Do not cache a rejected promise forever. For applications with explicit connection shutdown or multiple independent databases, manage lifecycle deliberately rather than using a global singleton blindly.

### Pattern 2: Transaction-Safe Upsert

**What it does:** Writes a record and resolves only when the transaction commits.

**When to use it:** For autosaved drafts, preferences that have grown into structured data, and edits where the UI should not claim success early.

```js
async function putRecord(db, storeName, record) {
  const tx = db.transaction(storeName, "readwrite");
  const done = transactionToPromise(tx);
  tx.objectStore(storeName).put(record);
  await done;
}
```

Attach the completion promise before queuing the write. Keep the helper simple; operations that need multiple stores or validation should use a domain-specific function rather than passing a long list of callbacks.

### Pattern 3: Indexed Filter for a Project Dashboard

**What it does:** Queries records through a status index instead of loading the entire store and filtering it in JavaScript.

**When to use it:** When the dashboard has tabs such as All, Drafts, Published, and Archived.

```js
async function listByStatus(db, status) {
  const tx = db.transaction("projects", "readonly");
  const store = tx.objectStore("projects");
  if (!store.indexNames.contains("by-status")) {
    throw new Error("Database schema is missing by-status index");
  }
  return requestToPromise(store.index("by-status").getAll(status));
}
```

Create the index in a versioned migration. Do not attempt to add it at runtime from a regular transaction. If the dataset is large, use cursor-based pagination rather than returning every record in one array.

### Pattern 4: Atomic Local Edit Plus Outbox

**What it does:** Saves a local record and the matching synchronization operation together.

**When to use it:** When offline edits must eventually reach a server and it would be incorrect for one half of the operation to persist without the other.

```js
async function saveAndQueue(db, record) {
  const tx = db.transaction(["projects", "outbox"], "readwrite");
  const now = Date.now();
  const saved = { ...record, updatedAt: now, syncState: "pending" };
  tx.objectStore("projects").put(saved);
  tx.objectStore("outbox").put({
    id: crypto.randomUUID(),
    entityId: saved.id,
    operation: "upsert",
    payload: saved,
    status: "pending",
    attempts: 0,
    createdAt: now
  });
  await transactionToPromise(tx);
}
```

Use a server-recognized idempotency key to make retries safe. Avoid storing an unbounded history of every autosave; coalesce pending operations for the same entity if the product's sync semantics allow it.

### Pattern 5: Cursor-Based Batch Processing

**What it does:** Iterates through records without creating one huge in-memory array.

**When to use it:** When cleaning expired cache records, migrating a large set of records, or exporting a sizeable local library.

```js
function deleteExpiredDrafts(db, cutoff) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    const store = tx.objectStore("drafts");
    const request = store.openCursor();
    let removed = 0;

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      if ((cursor.value.updatedAt ?? 0) < cutoff) {
        cursor.delete();
        removed += 1;
      }
      cursor.continue();
    };
    tx.oncomplete = () => resolve(removed);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Cleanup aborted"));
  });
}
```

Keep cursor callbacks synchronous and queue database requests while the transaction is active. For a large maintenance task, consider processing in bounded batches so one long transaction does not block other work.

### Pattern 6: Graceful Quota Failure

**What it does:** Converts a storage write failure into an explicit UI state rather than silently losing the user's work.

**When to use it:** When users can attach large assets, save many offline documents, or generate local previews.

```js
async function saveWithStatus(db, storeName, value) {
  try {
    await putRecord(db, storeName, value);
    return { status: "saved-locally" };
  } catch (error) {
    const quotaFailure = error?.name === "QuotaExceededError";
    return {
      status: quotaFailure ? "storage-full" : "save-failed",
      message: quotaFailure
        ? "Browser storage is full. Export or remove local items, then retry."
        : "The change could not be saved locally.",
      error
    };
  }
}
```

Do not automatically delete user-created records to make room unless the product has a clearly disclosed cache-only eviction policy. Distinguish regenerable cache from user-authored content.

### Pattern 7: Detect a Stale Record Before Overwriting

**What it does:** Uses revision metadata to detect conflicting edits from another tab or an older copy of a record.

**When to use it:** When a user can open the same project in multiple tabs or edit a draft on one device while another version is being imported.

```js
async function updateIfRevisionMatches(db, incoming) {
  const tx = db.transaction("projects", "readwrite");
  const done = transactionToPromise(tx);
  const store = tx.objectStore("projects");
  const current = await requestToPromise(store.get(incoming.id));

  if (current && current.revision !== incoming.baseRevision) {
    tx.abort();
    throw new Error("Stale revision; reload or merge before saving.");
  }

  store.put({ ...incoming, revision: (current?.revision ?? 0) + 1 });
  await done;
}
```

The read and write must remain inside the same read-write transaction. In production, make sure an intentional abort is handled as a conflict in the UI, not logged as an unexplained database crash.

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using the open request as the database | The request object and resolved connection have different APIs | Wait for `onsuccess` and use `request.result` |
| Creating stores outside `upgradeneeded` | Schema changes are restricted to version-change transactions | Increment the database version and migrate in `onupgradeneeded` |
| Recreating a store on every startup | Store creation is mistaken for ordinary initialization | Check `objectStoreNames.contains()` before creation |
| Resolving writes on request success | A request can succeed before the transaction commits | Await transaction `complete` and reject on abort |
| Using `add()` for autosave | Duplicate keys are expected during repeated edits | Use `put()` for intentional insert-or-update behavior |
| Using `put()` when duplicates must be rejected | Upsert semantics silently replace an existing record | Use `add()` and handle `ConstraintError` as a conflict |
| Loading every record for a small filter | Query needs were not modeled in the schema | Add an index and query it with `getAll(key)` or a cursor |
| Adding indexes for every property | Indexes seem free once defined | Add indexes only for measured query paths; account for write/storage overhead |
| Forgetting to bump the version | Schema code is present but never reruns | Increase the version and test upgrades from old schemas |
| Deleting the database to fix migrations | Clean-install testing hides migration defects | Write versioned, data-preserving migrations and test populated databases |
| Ignoring `onblocked` | Developers test with only one tab open | Close old connections on `versionchange` and show a refresh message |
| Keeping stale connections open | Every page assumes it owns the only connection | Handle `db.onversionchange` and close the connection promptly |
| Awaiting fetch inside a transaction | Transactions are mistaken for arbitrary async scopes | Complete database work first; perform network work outside the transaction |
| Mutating a returned object without `put()` | A retrieved value looks like a live database entity | Write the updated object back in a read-write transaction |
| Treating `navigator.onLine` as proof of service health | Link status is confused with server reachability | Attempt the real request and handle network/server failures |
| Assuming local data is permanent | IndexedDB feels like a server database | Handle quota/eviction, offer export, and back up irreplaceable data remotely |
| Storing auth secrets in IndexedDB | Structured storage is mistaken for a security boundary | Keep credentials out of client storage and defend against XSS |
| Clearing the outbox before acknowledgement | Request start is mistaken for successful remote commit | Retain operations until the server confirms an idempotent result |
| Ignoring multi-tab conflicts | Transactions are mistaken for application-level collaboration | Add revision checks or an explicit merge policy |
| Showing “synced” after a local write | Local persistence and remote acceptance are conflated | Model `saved-locally`, `pending-sync`, and `synced` as separate states |

### Before → After: Incorrect Save Confirmation

**Before — request success is not transaction completion:**

```js
const tx = db.transaction("drafts", "readwrite");
tx.objectStore("drafts").put(draft).onsuccess = () => {
  showToast("Saved permanently");
};
```

**After — report local commit accurately:**

```js
async function saveDraftAndConfirm(db, draft) {
  const tx = db.transaction("drafts", "readwrite");
  const done = transactionToPromise(tx);
  tx.objectStore("drafts").put(draft);
  await done;
  showToast("Saved on this device");
}
```

Even after the corrected local transaction commits, “Saved on this device” is more accurate than “Saved permanently.” Remote synchronization, if present, should be communicated separately.

## Mental Models

1. **A database is not a variable** — a value returned from IndexedDB is a copy; mutate it in memory, then explicitly write the new value back.
2. **Requests are steps; transactions are the promise** — individual request success is not the same as a committed unit of work.
3. **Indexes follow questions** — create an index because the interface asks a recurring query, not because a property exists.
4. **Offline means locally durable, not remotely delivered** — local save, queued sync, and server acknowledgement are three distinct states.
5. **A schema version is a migration contract** — once users have data, upgrades must preserve and transform it rather than assume a clean install.
6. **Browser storage is a cache of trust, not a vault** — treat local records as sensitive and potentially evictable; do not store secrets.
7. **Atomicity has a boundary** — IndexedDB can atomically update local stores, but it cannot atomically commit a local write and a remote HTTP request.
8. **Every retry needs identity** — stable operation IDs and idempotent server handling prevent network retries from creating duplicate effects.

## Quick Reference

| Property/Situation | Value/Answer | Notes |
|---|---|---|
| Open a database | `indexedDB.open("name", version)` | Returns an open request, not a connection |
| Read resolved connection | `request.result` in `onsuccess` | Wait until the request succeeds |
| Schema migration hook | `request.onupgradeneeded` | Only place for versioned schema changes |
| Check for a store | `db.objectStoreNames.contains("projects")` | Prevent duplicate creation |
| Create a store | `db.createObjectStore("projects", { keyPath: "id" })` | Run during version change |
| Start a read transaction | `db.transaction("projects", "readonly")` | Use for non-mutating reads |
| Start a write transaction | `db.transaction(["projects"], "readwrite")` | Keep scope short |
| Read one record | `store.get(id)` | Returns a request |
| Read all records | `store.getAll()` | Avoid for unbounded datasets |
| Insert or replace | `store.put(record)` | Upsert by key |
| Insert only | `store.add(record)` | Duplicate key causes a constraint error |
| Delete one record | `store.delete(id)` | Queue inside a write transaction |
| Clear a store | `store.clear()` | Destructive; confirm product intent |
| Add an index | `store.createIndex("by-status", "status")` | During schema upgrade only |
| Query an index | `store.index("by-status").getAll("draft")` | Index must already exist |
| Bound a numeric/date key | `IDBKeyRange.bound(start, end)` | Inclusive endpoints by default |
| Iterate incrementally | `store.openCursor()` | Use for large result sets or batch work |
| Detect duplicate key | Handle `ConstraintError` | Common with `add()` or unique indexes |
| Detect quota failure | Check `error.name === "QuotaExceededError"` | Provide recovery/export guidance |
| Inspect storage usage | `navigator.storage.estimate()` | Approximate, browser-managed values |
| Request persistent storage | `navigator.storage.persist()` | May be unavailable or denied |
| Handle another tab's upgrade | `db.onversionchange` and `request.onblocked` | Close stale connections and explain refresh |
| Signal local commit | Transaction `complete` event | Does not imply remote sync |
| Signal local rollback | Transaction `abort` event | Preserve user input for retry if possible |
| Handle offline queue retries | Stable operation ID + idempotent endpoint | `navigator.onLine` is only a hint |
| Clear user-specific data | One read-write transaction over relevant stores | Apply explicit logout/account-switch policy |

## Build Challenge

### Build: Offline-Ready Creative Project Library

Build a small project library for a creative studio portfolio. Users should be able to create and edit project cards, search or filter saved projects, reload the page while offline and recover their drafts, and queue updates for later synchronization. This challenge proves you understand IndexedDB's asynchronous lifecycle, versioned schema, indexing, transaction boundaries, failure handling, and the difference between local persistence and remote sync.

**Requirements**

1. Create a database named `studio-workspace` with a versioned upgrade strategy.
2. Create a `projects` object store with `id` as its stable key path.
3. Create a `drafts` store for unfinished edits.
4. Create an `outbox` store for pending remote operations.
5. Add a `by-status` index to filter draft, published, and archived projects.
6. Add a `by-updatedAt` index to query recent edits.
7. Implement a single managed database bootstrap function that exposes a promise and resets after failure.
8. Implement `getProject`, `listByStatus`, `saveProject`, and `deleteProject` repository functions.
9. Ensure write helpers await transaction completion rather than only request success.
10. Implement autosave using `put()` and debounce UI-triggered writes to avoid unnecessary churn.
11. Save the local project and matching outbox operation atomically in one transaction.
12. Add stable operation IDs and an `attempts` counter to outbox entries.
13. Display separate states for “Saved on this device,” “Waiting to sync,” and “Synced.”
14. Implement retry logic that retains outbox entries until server acknowledgement.
15. Handle request errors, transaction aborts, and quota errors with recoverable UI messages.
16. Add `versionchange` handling that closes old connections and prompts stale tabs to refresh.
17. Handle a blocked upgrade without deleting the database or user records.
18. Implement a migration from version 1 to version 2 that adds an index without losing existing projects.
19. Test a populated database upgrade, not only a fresh install.
20. Add a revision field or another explicit policy for conflicting edits across tabs.
21. Add an export option for user-authored records before destructive reset or account removal.
22. Scope private records by account or clear them according to a documented logout policy.
23. Use cursor-based processing for at least one maintenance operation.
24. Inspect approximate storage usage and handle unavailable Storage Manager APIs.
25. Provide a visible empty state, loading state, local-save error state, and offline state.
26. Avoid storing credentials, session secrets, or unnecessary sensitive data in the database.
27. Test the project library after a full page reload with network access disabled.
28. Test duplicate IDs and invalid record shapes.
29. Document which data is user-authored, which is regenerable cache, and which is pending sync.
30. Include a README explaining schema versions, indexes, transaction boundaries, conflict handling, and limitations.

**Expected output / definition of success**

- A working local project library that survives reloads and works without a network connection for local CRUD operations.
- No success UI is shown before the relevant write transaction commits.
- Existing records survive a schema upgrade.
- A failed remote request does not delete the corresponding outbox item.
- The UI never calls a locally committed draft “synced” before the server confirms it.
- The application can recover from a failed save without silently discarding the user's typed content.
- The README documents the chosen migration and conflict policy.

**Suggested time plan**

| Phase | Time | Deliverable |
|---|---:|---|
| Data model and bootstrap | 45 min | Database, stores, indexes, and open lifecycle |
| Repository layer | 60 min | CRUD helpers and transaction completion handling |
| Offline UI and autosave | 60 min | Local CRUD, loading/empty/error states, reload test |
| Outbox and sync states | 60 min | Atomic local write + queue, retries, acknowledgement |
| Migrations and multi-tab behavior | 45 min | Version upgrade, blocked upgrade, revision conflict |
| Failure testing and documentation | 45 min | Quota/error cases, test matrix, README |

## Acceptance Test Matrix

| Scenario | Action | Expected result |
|---|---|---|
| Fresh install | Open the app with no existing database | Stores and indexes are created once |
| Reload persistence | Save a project and reload | Project is still available locally |
| Offline read | Disable network and open saved projects | Local records render without a network request |
| Offline edit | Change a title while offline | Local transaction commits and state says waiting to sync |
| Transaction abort | Force a write failure in a test path | UI does not report a successful save |
| Duplicate insert | Add an existing ID using `add()` | Constraint error is surfaced as a conflict |
| Upsert | Save a modified existing draft using `put()` | The stored record reflects the latest edit |
| Indexed filter | Filter projects by status | Only matching indexed records are returned |
| Schema migration | Upgrade a populated version-1 database | Existing projects remain and the new index is available |
| Blocked upgrade | Keep an older connection open in another tab | App reports that another tab must refresh/close |
| Multi-tab conflict | Edit one record from two tabs | Revision policy detects or deliberately resolves conflict |
| Server unavailable | Attempt to sync an outbox item while server is down | Item remains pending and attempts/error metadata update |
| Successful sync | Server acknowledges an operation | Item is marked complete or removed according to policy |
| Quota exceeded | Simulate a quota exception | User sees a recovery path; authored data is not silently purged |
| Storage API missing | Run where `navigator.storage.estimate` is absent | Main CRUD features still work |
| Logout/account switch | Change accounts | Private records follow the documented isolation/clearing policy |
| Large dataset | Populate many records and filter | Queries avoid unnecessary full-store scans |
| Page reload during editing | Reload after committed autosave | Last committed local draft is restored |

## Debugging Sequence

1. **Confirm the connection exists.** Verify `indexedDB.open()` reached `onsuccess`; inspect `request.error` if it did not.
2. **Check the actual schema version.** A missing index usually means the migration did not run or the database version was not incremented.
3. **Check transaction mode and store names.** Writes require `readwrite`; every named store must exist in the transaction's scope.
4. **Attach transaction listeners early.** Register `complete`, `error`, and `abort` handlers before queuing work.
5. **Inspect request and transaction errors separately.** A request can fail and abort the surrounding transaction.
6. **Look for transaction lifetime mistakes.** Do not perform a fetch or long async computation while expecting an IndexedDB transaction to remain active.
7. **Check key-path data.** Ensure the record includes the configured key and that unique-index values do not collide.
8. **Check blocked connections.** Close stale tabs and workers; use `versionchange` and `blocked` handlers.
9. **Reproduce with real old data.** Test migrations from a populated earlier version, not only after deleting site data.
10. **Separate local save from remote sync.** Inspect the stored record and outbox separately when a UI status seems wrong.

## Production Checklist

- [ ] Database name and schema versions are documented.
- [ ] Schema changes happen only during version-change upgrades.
- [ ] Migrations preserve records and are tested from supported previous versions.
- [ ] Object stores and indexes match real query patterns.
- [ ] Read and write transactions are short and correctly scoped.
- [ ] Write operations await transaction completion.
- [ ] Errors are surfaced to the UI without discarding user input.
- [ ] Blocked upgrades and stale connections are handled.
- [ ] Large result sets use indexes, key ranges, or cursors rather than unbounded `getAll()`.
- [ ] Offline outbox operations use stable IDs and idempotent remote handling.
- [ ] Local commit, pending sync, and remote acknowledgement are distinct states.
- [ ] Quota failure and missing Storage Manager APIs are handled.
- [ ] User-authored records have an export or recovery strategy where appropriate.
- [ ] Logout and account switching follow a documented data ownership policy.
- [ ] Sensitive credentials are not stored in IndexedDB.
- [ ] Fresh install, upgrade, offline reload, transaction abort, and multi-tab scenarios are tested.
- [ ] Browser-specific behavior is verified in the supported browser matrix.

## Definition of Done

This skill is complete when you can explain the difference between a request and a transaction, build a versioned database without erasing existing data, query records through indexes, recover from failed writes, and implement an offline queue that does not confuse local storage with server synchronization. Your implementation should make persistence visible and honest: the user knows what is saved on the device, what is waiting to sync, and what the server has confirmed.
