# SKILL: redux-toolkit-patterns
**Layer:** 16 — State Management
**Goal:** Build predictable Redux Toolkit state with slices, typed hooks, async workflows, and RTK Query while keeping reducers pure and server data cached coherently.

---

## Why This Matters (Senior Perspective)
Redux Toolkit is most valuable when an application has many contributors, complex state transitions, and a need for a consistent debugging story. The production failures it helps prevent are subtle: two screens implement the same business rule differently, reducers mutate state outside Immer's supported patterns, async thunks race and overwrite newer data, normalized entities become inconsistent, or a hand-built cache refetches too often and displays stale records. Redux should make these rules visible, not add ceremony for every boolean.

A senior developer separates client-owned workflow state from server-owned data. Slices model domain transitions; selectors derive view values; thunks handle one-off async workflows; RTK Query handles most API cache lifecycle concerns. They keep reducers deterministic and free of network calls, use typed hooks so action and selector contracts are checked, and write tests around behavior and failure states. Middleware and DevTools help explain what happened, but neither replaces a clear state model.

In creative portfolio and client work, Redux Toolkit is often appropriate for a larger admin dashboard, multi-step editor, inventory workflow, or app shared by multiple teams. It is usually unnecessary for a single theme toggle. The decision is about the complexity of the domain and the value of consistent conventions. Use RTK Query for cacheable remote data, avoid copying the same server response into several slices, and define how loading, empty, error, retry, and stale data appear to the user.

## Core Concepts

### 1. Choose Redux only when its structure pays off

Redux Toolkit provides conventions for shared client state, but it is not automatically superior to local state or a small store. Choose it when many features share transitions, debugging history matters, or the team benefits from explicit actions.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
// A local disclosure does not need a Redux slice.
function DetailsDisclosure() {
  const [open, setOpen] = React.useState(false);
  return <section>
    <button type="button" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      Project details
    </button>
    {open && <p>Technical notes for the project.</p>}
  </section>;
}
```

**Gotcha:** Adding a global store for every component creates more files without improving correctness.

**Before/after check:** Before the change, reproduce the failure for “choose redux only when its structure pays off.” After the change, verify both the normal path and the edge case described above.

### 2. Configure the store once

Use `configureStore` to combine reducers and keep Redux Toolkit's development checks. Export `RootState` and `AppDispatch` from the store module so typed hooks can be defined centrally.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "./projectsSlice";

export const store = configureStore({
  reducer: { projects: projectsReducer },
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**Gotcha:** Do not import the store into arbitrary feature modules just to read state; use selectors and thunks to preserve dependency boundaries.

**Before/after check:** Before the change, reproduce the failure for “configure the store once.” After the change, verify both the normal path and the edge case described above.

### 3. Create slices with intent-based reducers

`createSlice` generates action creators and reducer logic from a cohesive domain. Immer lets reducer code look mutative while producing immutable updates, but the reducer must either mutate the draft or return a replacement—not both.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type Project = { id: string; title: string };
type ProjectsState = { items: Project[]; selectedId: string | null };
const initialState: ProjectsState = { items: [], selectedId: null };

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    projectSelected(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    projectsReplaced(state, action: PayloadAction<Project[]>) {
      state.items = action.payload;
    },
  },
});
export const { projectSelected, projectsReplaced } = projectsSlice.actions;
export default projectsSlice.reducer;
```

**Gotcha:** `state.items.push(item); return state.items` mixes draft mutation and return semantics; choose one update style.

**Before/after check:** Before the change, reproduce the failure for “create slices with intent-based reducers.” After the change, verify both the normal path and the edge case described above.

### 4. Use typed hooks at the UI boundary

Typed hooks reduce repeated annotations and ensure dispatch accepts the application's action/thunk types. In modern React Redux, define hooks with `useDispatch.withTypes` and `useSelector.withTypes` when supported by the installed version.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Gotcha:** Confirm the installed React Redux version supports `.withTypes`; older versions need explicit typed wrapper functions.

**Before/after check:** Before the change, reproduce the failure for “use typed hooks at the ui boundary.” After the change, verify both the normal path and the edge case described above.

### 5. Derive view state with selectors

Selectors keep components focused on what they render and prevent duplicated calculations. Memoize expensive derived collections with Reselect; do not memoize every primitive selector without a reason.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const selectProjects = (state: RootState) => state.projects.items;
const selectQuery = (state: RootState) => state.search.query;
export const selectMatchingProjects = createSelector(
  [selectProjects, selectQuery],
  (projects, query) => projects.filter(project =>
    project.title.toLowerCase().includes(query.trim().toLowerCase())
  )
);
```

**Gotcha:** A selector that allocates a new array on every call can trigger unnecessary renders if it is not memoized where needed.

**Before/after check:** Before the change, reproduce the failure for “derive view state with selectors.” After the change, verify both the normal path and the edge case described above.

### 6. Normalize relational entities

When many views update the same entities, normalized state avoids duplicated nested copies. `createEntityAdapter` provides reducers and selectors for IDs and entity maps.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
type Project = { id: string; title: string; status: "draft" | "published" };
const projectsAdapter = createEntityAdapter<Project>();
const projectsSlice = createSlice({
  name: "projects",
  initialState: projectsAdapter.getInitialState(),
  reducers: {
    projectsReceived: projectsAdapter.setAll,
    projectUpserted: projectsAdapter.upsertOne,
  },
});
export default projectsSlice.reducer;
```

**Gotcha:** Normalization helps canonical entity data; it does not mean every transient UI flag belongs in the entity record.

**Before/after check:** Before the change, reproduce the failure for “normalize relational entities.” After the change, verify both the normal path and the edge case described above.

### 7. Use createAsyncThunk for command-like workflows

A thunk is useful when a user action triggers an operation with pending, fulfilled, and rejected states. Handle expected failures explicitly and avoid storing raw Error instances because Redux state should remain serializable.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const publishProject = createAsyncThunk(
  "projects/publish",
  async (id: string, { rejectWithValue }) => {
    const response = await fetch(`/api/projects/${encodeURIComponent(id)}/publish`, { method: "POST" });
    if (!response.ok) return rejectWithValue({ status: response.status });
    return await response.json() as { id: string; status: "published" };
  }
);
```

**Gotcha:** A rejected thunk does not automatically produce a user-friendly message; map the rejection to a stable UI error model.

**Before/after check:** Before the change, reproduce the failure for “use createasyncthunk for command-like workflows.” After the change, verify both the normal path and the edge case described above.

### 8. Handle thunk lifecycle in reducers

Use `extraReducers` to represent pending and terminal states. Keep request status explicit so the UI can distinguish idle, loading, succeeded, and failed. If multiple requests can overlap, identify which request owns the visible result.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
builder
  .addCase(publishProject.pending, state => {
    state.publishStatus = "loading";
    state.publishError = null;
  })
  .addCase(publishProject.fulfilled, (state, action) => {
    state.publishStatus = "succeeded";
    state.publishError = null;
    state.entities[action.payload.id] = action.payload;
  })
  .addCase(publishProject.rejected, (state, action) => {
    state.publishStatus = "failed";
    state.publishError = action.payload ?? { message: action.error.message ?? "Publish failed" };
  });
```

**Gotcha:** If two publish operations can target the same entity, track `meta.requestId` or prevent duplicate commands.

**Before/after check:** Before the change, reproduce the failure for “handle thunk lifecycle in reducers.” After the change, verify both the normal path and the edge case described above.

### 9. Prefer RTK Query for server data

RTK Query manages request lifecycle, caching, subscriptions, invalidation, and generated hooks. Use it for server-owned lists and details rather than duplicating API data into hand-written slices without a concrete reason.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const projectsApi = createApi({
  reducerPath: "projectsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Project"],
  endpoints: builder => ({
    getProjects: builder.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Project"],
    }),
  }),
});
export const { useGetProjectsQuery } = projectsApi;
```

**Gotcha:** RTK Query must be registered in both the reducer map and middleware chain or its cache lifecycle will not work correctly.

**Before/after check:** Before the change, reproduce the failure for “prefer rtk query for server data.” After the change, verify both the normal path and the edge case described above.

### 10. Invalidate cache after mutations

Tag invalidation tells RTK Query which cached queries may be stale after a write. Prefer targeted entity tags when possible; invalidating every query after every mutation can create unnecessary network traffic.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
updateProject: builder.mutation<Project, Partial<Project> & Pick<Project, "id">>({
  query: ({ id, ...body }) => ({ url: `projects/${id}`, method: "PATCH", body }),
  invalidatesTags: (_result, _error, { id }) => [{ type: "Project", id }],
})
```

**Gotcha:** A mutation that changes server data without invalidating or updating the relevant cache can leave the interface stale.

**Before/after check:** Before the change, reproduce the failure for “invalidate cache after mutations.” After the change, verify both the normal path and the edge case described above.

### 11. Model optimistic updates with rollback

Optimistic updates make interfaces feel immediate, but they must have a rollback plan. RTK Query's `onQueryStarted` can patch a cached query and undo the patch if the server rejects the change.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
async onQueryStarted({ id, title }, { dispatch, queryFulfilled }) {
  const patch = dispatch(projectsApi.util.updateQueryData("getProjects", undefined, draft => {
    const project = draft.find(item => item.id === id);
    if (project) project.title = title;
  }));
  try {
    await queryFulfilled;
  } catch {
    patch.undo();
  }
}
```

**Gotcha:** Overlapping optimistic patches can make rollback order tricky; prefer invalidation/refetch when concurrency makes patches unsafe.

**Before/after check:** Before the change, reproduce the failure for “model optimistic updates with rollback.” After the change, verify both the normal path and the edge case described above.

### 12. Keep serializable state and actions

Redux DevTools and persistence rely on inspectable values. Store IDs, plain objects, arrays, and explicit status values. Keep DOM nodes, Promises, class instances, functions, and AbortControllers out of ordinary state.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type EditorState = {
  selectedId: string | null;
  status: "idle" | "saving" | "saved" | "error";
  errorMessage: string | null;
};
```

**Gotcha:** Middleware warnings are signals; do not silence serializability checks globally just to hide one badly modeled value.

**Before/after check:** Before the change, reproduce the failure for “keep serializable state and actions.” After the change, verify both the normal path and the edge case described above.

### 13. Test reducers, thunks, and UI behavior

Reducer tests are fast and deterministic; integration tests should verify the user's visible outcome and async states. Mock network boundaries instead of coupling tests to implementation details.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { expect, it } from "vitest";
import reducer, { projectSelected } from "./projectsSlice";

it("selects a project", () => {
  const next = reducer(undefined, projectSelected("p-7"));
  expect(next.selectedId).toBe("p-7");
});
```

**Gotcha:** A reducer unit test alone cannot prove that loading, error, and retry states are rendered accessibly.

**Before/after check:** Before the change, reproduce the failure for “test reducers, thunks, and ui behavior.” After the change, verify both the normal path and the edge case described above.

### 14. Plan production debugging and failure recovery

Use DevTools to inspect actions and state diffs, but pair that with request IDs, error telemetry, and a reproducible failure case. The user should see a retry path rather than a blank panel when a request fails.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function ProjectStatus({ isLoading, error, retry }: {
  isLoading: boolean; error?: string; retry: () => void;
}) {
  if (isLoading) return <p role="status">Loading projects…</p>;
  if (error) return <section role="alert">
    <p>{error}</p><button type="button" onClick={retry}>Try again</button>
  </section>;
  return <p>Projects are ready.</p>;
}
```

**Gotcha:** Do not announce every background cache refresh as a blocking error; preserve usable stale data when the query library provides it.

**Before/after check:** Before the change, reproduce the failure for “plan production debugging and failure recovery.” After the change, verify both the normal path and the edge case described above.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Feature slice boundary

**What it does:** groups actions and transitions for one domain. **When to use it:** a feature has multiple screens and rules that must remain consistent.

```tsx
const slice = createSlice({ name: "editor", initialState, reducers: { draftChanged(state, action) { state.draft = action.payload; } } });
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 2: Typed application hooks

**What it does:** centralizes RootState and AppDispatch typing. **When to use it:** every component that reads or dispatches app state.

```tsx
const useAppSelector = useSelector.withTypes<RootState>();
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 3: Normalized entity adapter

**What it does:** stores entities by ID and provides standard CRUD helpers. **When to use it:** many screens share and update the same records.

```tsx
const adapter = createEntityAdapter<Project>();
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 4: Thunk lifecycle state

**What it does:** represents pending, fulfilled, and rejected command outcomes. **When to use it:** a user-triggered workflow such as publish, export, or submit.

```tsx
builder.addCase(saveDraft.pending, state => { state.status = "saving"; });
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 5: RTK Query cache tags

**What it does:** connects mutations to affected query cache entries. **When to use it:** server data is fetched in several components and must stay fresh.

```tsx
providesTags: result => result ? result.map(({ id }) => ({ type: "Project" as const, id })) : ["Project"]
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 6: Optimistic patch with undo

**What it does:** updates cached UI before the server responds and rolls back on failure. **When to use it:** low-risk edits where immediate feedback matters.

```tsx
const patch = dispatch(api.util.updateQueryData("getProjects", undefined, draft => { /* targeted change */ }));
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 7: Reducer-first regression test

**What it does:** locks down a state transition that previously failed. **When to use it:** pure domain logic or a reported state inconsistency.

```tsx
expect(reducer(state, action)).toEqual(expectedState);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Putting fetch calls in reducers | Reducers become nondeterministic and untestable. | Move I/O into thunks, RTK Query endpoints, or a service boundary. |
| Duplicating RTK Query data in a slice | Two caches disagree after a mutation. | Use query cache as the server-data source or document a deliberate normalized cache. |
| Mutating and returning a new value | Immer receives conflicting update instructions. | Either mutate the draft or return a replacement, never both. |
| Ignoring rejected thunk state | A failed operation looks like endless loading. | Handle rejected actions and expose a retryable error state. |
| Storing Error objects | State may fail serializability checks. | Map errors to plain fields such as status and message. |
| Over-invalidating every query | One small edit causes a request storm. | Use entity-level tags and invalidate only affected queries. |
| Unsafe optimistic rollback | An older rollback erases a newer successful change. | Use targeted patches with concurrency awareness or invalidate and refetch. |
| Untyped dispatch | Async action contracts lose compiler checking. | Export AppDispatch and use a typed dispatch hook. |
| Selector allocates on every read | Components rerender despite unchanged domain data. | Use a memoized selector for derived arrays and objects. |
| No request identity | An older request wins a race. | Track requestId or let RTK Query own request lifecycle. |
| Using Redux for a local toggle | Simple UI gains unnecessary global complexity. | Keep private interaction state local until sharing is real. |
| Silencing middleware warnings | Bad state shapes remain hidden. | Fix the non-serializable value or isolate an intentional exception. |
| No loading semantics | Screen readers and users cannot tell if work is happening. | Use role=status and clear pending labels for relevant operations. |
| Testing only reducers | Network and UI failure paths remain untested. | Add integration tests for loading, failure, retry, and success. |

## Mental Models

1. **Reducers describe transitions; they do not perform I/O.** Pure updates remain replayable and testable.
2. **Server data has a cache lifecycle.** Fetching, subscribing, invalidating, and refetching are one system.
3. **One canonical entity prevents disagreement.** Duplicate copies create synchronization bugs.
4. **Async state is a state machine.** Idle, pending, fulfilled, and rejected are different user experiences.
5. **Optimistic UI is a promise with a rollback.** Never ship the fast path without a failure path.
6. **Serializability buys observability.** Plain data makes DevTools and tests trustworthy.
7. **Choose the smallest adequate tool.** Redux is a deliberate architecture, not a default checkbox.

## Quick Reference

| Situation | Decision | Implementation cue |
|---|---|---|
| Simple local disclosure | One component only | `useState` |
| Shared client workflow | Many features share transitions | `Redux Toolkit slice` |
| Server list/detail data | Cache, subscriptions, invalidation | `RTK Query` |
| One-off command | Publish/export/submit | `createAsyncThunk` |
| Derived collection | Filter/sort computed view | `createSelector` |
| Relational records | Shared canonical entities | `createEntityAdapter` |
| Type safety | Store state and dispatch | `RootState/AppDispatch` |
| Optimistic edit | Immediate feedback with rollback | `onQueryStarted + patch.undo` |
| Stale query after write | Cache may no longer match server | `Targeted tag invalidation` |
| Async error | Request failed | `Rejected state + retry UI` |
| Non-serializable value | DevTools/persistence risk | `Store plain data only` |
| Concurrent commands | Out-of-order completion | `requestId or RTK Query` |
| Regression | A previous transition broke | `Reducer + integration test` |
| Accessible progress | User needs status feedback | `role=status / role=alert` |

## Build Challenge

### Build: Build a project publishing dashboard using Redux Toolkit and RTK Query. The list and detail view must share server data, publishing must expose pending/success/failure states, and a failed optimistic title edit must roll back without erasing a newer successful edit. Demonstrate a rejected HTTP response, targeted cache invalidation, typed hooks, and tests for the failure path.

#### Requirements

1. Configure store with slice reducers and RTK Query reducer/middleware.
2. Export RootState and AppDispatch and use typed hooks.
3. Keep reducers pure and serializable.
4. Use RTK Query for project list/detail server data.
5. Define cache tags and targeted invalidation after writes.
6. Expose pending, success, and failure states for publishing.
7. Handle HTTP failure with a user-readable message and retry.
8. Use optimistic updates only with a rollback plan.
9. Simulate overlapping edits and prove rollback does not clobber newer state.
10. Test reducer behavior and visible async UI behavior.
11. Include loading and error semantics for assistive technology.
12. Document why a specific value is local, client-global, or server-owned.

#### Failure scenarios you must reproduce

1. Start from a clean browser context and confirm the initial state is deterministic.
2. Inject malformed or obsolete persisted input and confirm the application recovers without a blank screen.
3. Trigger two competing updates and prove that the older intent cannot overwrite the latest one.
4. Disable or break the persistence/network boundary and verify that the core interaction remains usable.
5. Navigate with keyboard only and confirm that controls expose their current state and error feedback.

#### Definition of done

- [ ] All state has a named owner and the source of truth is documented.
- [ ] The main user journey works from a clean load and after refresh.
- [ ] Malformed, stale, or failed external input is handled without an uncaught exception.
- [ ] The required race/failure scenario is reproduced by an automated test.
- [ ] Controls have accessible names, keyboard behavior, and meaningful status feedback.
- [ ] No secret or authorization decision is trusted from client-controlled state.
- [ ] The quick reference choices are reflected in the implementation.
- [ ] A short debugging note explains how to inspect the failure and verify the fix.

#### Debugging sequence

1. Reproduce the bug with a fixed test case rather than random clicking.
2. Inspect the actual URL/store/storage payload and compare it with the declared schema.
3. Trace the event from the UI control to the state transition and persistence boundary.
4. Check browser DevTools console and storage/network panels for the first failing operation.
5. Add a regression test for the exact failure before considering the work complete.

#### Browser and runtime compatibility

Browser storage, History API, SSR behavior, and framework router integrations vary by runtime. Verify the target browsers and the exact library version in the project. Provide a deterministic fallback when the browser feature or persistence adapter is unavailable. Do not rely on development-only behavior as proof of production correctness.

#### Performance and accessibility review

Measure before optimizing. Avoid broad subscriptions, repeated synchronous writes, or navigation updates that trigger unnecessary work. Keep keyboard access, focus visibility, semantic controls, and clear loading/error feedback in the acceptance criteria. Test reduced-motion preferences if the feature includes transitions, and ensure state changes do not depend on animation finishing.

#### Gotchas to revisit

- **Gotcha:** Adding a global store for every component creates more files without improving correctness.
- **Gotcha:** Do not import the store into arbitrary feature modules just to read state; use selectors and thunks to preserve dependency boundaries.
- **Gotcha:** `state.items.push(item); return state.items` mixes draft mutation and return semantics; choose one update style.
- **Gotcha:** Confirm the installed React Redux version supports `.withTypes`; older versions need explicit typed wrapper functions.

#### Review checklist

- [ ] At least one unit test covers a normal transition.
- [ ] At least one integration test covers the failure scenario.
- [ ] State is validated at every external boundary.
- [ ] No component subscribes to more state than it needs.
- [ ] The app behaves predictably after refresh, direct entry, or storage failure.
- [ ] Error messages explain the next action without exposing internal details.

## Production Review Notes

### Store ownership and feature boundaries

A slice should own a coherent domain's transitions, not simply mirror the component tree. A component is a rendering boundary; a slice is a state ownership boundary. Keep reducers small enough to reason about, and avoid importing UI components or browser objects into slice modules. Cross-feature workflows should be represented by explicit actions or thunks rather than hidden component sequencing.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Immer update semantics

Redux Toolkit uses Immer for reducer drafts. You may write `state.status = 'saved'` because the argument is a draft, but ordinary objects outside reducers are still immutable data. A reducer must not mutate an unrelated object captured from outside the draft. If a reducer returns a replacement state, do not also mutate the draft. These rules matter because confusing a draft with a normal object can cause state changes that DevTools cannot explain.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Async cancellation and identity

Thunks can receive an AbortSignal and expose request metadata such as requestId. For workflows where a newer request should supersede an older one, store the active request ID and ignore stale completions. For RTK Query, let the query lifecycle handle subscriptions and cache identity where possible. Do not build a second request manager in a slice when the query layer already owns the problem.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### RTK Query cache design

A query cache key is based on the endpoint and its arguments. Make arguments reflect the data identity: page, filter, locale, or entity ID when those affect the response. Tags connect mutations to cached queries. Use broad tags only when the data relationship is broad; overly broad invalidation can refetch every mounted screen and make a small edit expensive.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Mutation error policy

Distinguish validation errors, authorization errors, transient network failures, and unexpected server failures. The UI should not show raw stack traces. A validation failure should explain what can be corrected; a transient error should offer retry; an authorization failure should not loop indefinitely. Keep error data serializable and avoid leaking sensitive request payloads into DevTools.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Optimistic update tradeoffs

Optimistic UI is best when the action is likely to succeed and the client can confidently predict the resulting state. If the server applies complex business rules, a refetch may be safer than a speculative patch. If multiple mutations overlap, rollback order becomes important. Rehearse a failure after a second update has already succeeded; a simple `undo()` may not represent the user's latest intent.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Selector performance and memoization

Selectors should encode derived meaning, not become a second state store. Reselect memoization is useful for expensive transformations or referential stability. Keep input selectors narrow and avoid creating fresh input objects inside them. If a selector is cheap and returns a primitive, memoization may add complexity without a measurable benefit.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Serializable state as an operational tool

Serializable state makes action history inspectable, replayable, and easier to persist or report. Dates can be represented as ISO strings or epoch numbers, and errors can be mapped to plain status/message fields. Keep files, DOM nodes, promises, functions, and controller instances in component refs or service scope. Do not turn off all serializability checks because one value is awkward.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Testing the full lifecycle

Reducer tests verify transition logic; thunk tests verify orchestration; integration tests verify that a user can recover from a failed operation. Use network mocks at the request boundary and await visible conditions rather than arbitrary timeouts. Test that loading clears on both success and failure and that a retry can succeed after an earlier rejection.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### DevTools and observability

Action history is most useful when actions have stable, descriptive names and payloads are not unnecessarily large. In production, telemetry should capture request IDs, endpoint, status, and a correlation identifier while excluding secrets and sensitive form content. A debugging story should let an engineer reproduce the state transition without collecting the entire Redux state from a user.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### SSR and store lifecycle

A server-rendered app needs a clear store creation lifecycle. Avoid shared mutable singleton state across requests if it can contain user-specific information. Ensure server state and client initialization are compatible, and do not assume browser storage exists on the server. Framework-specific hydration recommendations change, so check the installed framework and Redux integration versions.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### When not to use Redux

A small settings page with one local toggle may not benefit from Redux. A remote list may need RTK Query but little handwritten slice state. Use Redux Toolkit where shared transitions, debugging, team conventions, or complex workflows justify it. The quality of an architecture is not proportional to the number of abstractions it contains.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

