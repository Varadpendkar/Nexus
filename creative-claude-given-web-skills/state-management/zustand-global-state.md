# SKILL: zustand-global-state
**Layer:** 16 — State Management
**Goal:** Design small, typed, testable Zustand stores that coordinate shared UI state without turning every component into a subscriber to everything.

---

## Why This Matters (Senior Perspective)
Zustand is useful because shared UI state often starts innocently—a theme toggle, active project, cart, cursor mode, or open command palette—and then quietly becomes a source of coupling. In production, the failure is rarely that a store cannot hold a value. The failure is that unrelated components re-render on every update, stale async requests overwrite newer choices, persisted data restores an obsolete shape, or a component subscribes to an entire object and makes an animation feel sluggish. A store that is technically working can still create expensive, confusing behavior across a portfolio or client application.

A senior developer treats a store as a boundary with an explicit contract. They decide which state is truly shared, which state belongs in a component, which values are derived, and which updates must be atomic. They use selectors to limit subscriptions, actions to keep transitions understandable, and persistence only for durable preferences or drafts that can safely survive a reload. They also consider hydration, schema changes, server rendering, tests, and debugging before a store spreads across the app.

For creative sites, Zustand can coordinate global theme, gallery selection, menu state, or 3D scene controls without forcing every pointer movement through React's broad component tree. That does not mean every transient value belongs in the store: frame-by-frame pointer coordinates and animation internals often belong in refs or the rendering engine. The goal is not “global state everywhere.” It is a small shared contract with predictable updates, bounded subscriptions, and recovery behavior when storage or async work fails.

## Core Concepts

### 1. Choose local versus shared state

Start with ownership, not with a library. A text field used by one form should usually stay local; a cart count read by the header and checkout can be shared. Globalizing ephemeral state adds indirection and makes tests harder. The store should represent a domain boundary, not a dumping ground.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
// Local state is enough for a private input.
function SearchBox() {
  const [query, setQuery] = React.useState("");
  return <label>Search projects
    <input value={query} onChange={event => setQuery(event.target.value)} />
  </label>;
}
```

**Gotcha:** If two distant components must stay consistent, duplicating local state creates drift; lift only that shared contract.

**Before/after check:** Before the change, reproduce the failure for “choose local versus shared state.” After the change, verify both the normal path and the edge case described above.

### 2. Create a small typed store

Keep state and actions together, name actions by intent, and define a state type. A clear action such as `setActiveProject` explains why state changed better than exposing arbitrary object mutation. Zustand's `create` API creates a hook that components can call directly.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { create } from "zustand";

type ProjectState = {
  activeProjectId: string | null;
  setActiveProject: (id: string | null) => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  activeProjectId: null,
  setActiveProject: (id) => set({ activeProjectId: id }),
}));
```

**Gotcha:** Avoid storing duplicate display data when an ID plus canonical project data can derive the label and details.

**Before/after check:** Before the change, reproduce the failure for “create a small typed store.” After the change, verify both the normal path and the edge case described above.

### 3. Subscribe with selectors

A component should select the smallest value it needs. Selecting the entire state means any update may cause it to render again. Selectors make the subscription contract visible and reduce unnecessary work in large interfaces.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function ActiveProjectLabel() {
  const activeProjectId = useProjectStore(state => state.activeProjectId);
  return <output>{activeProjectId ?? "No project selected"}</output>;
}

function ProjectActions() {
  const setActiveProject = useProjectStore(state => state.setActiveProject);
  return <button onClick={() => setActiveProject("project-42")}>Open project</button>;
}
```

**Gotcha:** Returning a new object from a selector on every read can defeat equality checks; select primitives or use an appropriate shallow comparison.

**Before/after check:** Before the change, reproduce the failure for “subscribe with selectors.” After the change, verify both the normal path and the edge case described above.

### 4. Keep actions atomic

When one user intention changes multiple fields, update them in one `set` call. Intermediate states can briefly violate invariants, especially when the UI renders between separate updates or middleware observes each update.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type CartState = {
  itemIds: string[];
  checkoutOpen: boolean;
  beginCheckout: () => void;
};

const useCartStore = create<CartState>((set) => ({
  itemIds: [],
  checkoutOpen: false,
  beginCheckout: () => set(state => ({
    checkoutOpen: state.itemIds.length > 0,
  })),
}));
```

**Gotcha:** State updater functions should remain pure; do network requests and analytics outside the updater.

**Before/after check:** Before the change, reproduce the failure for “keep actions atomic.” After the change, verify both the normal path and the edge case described above.

### 5. Derive instead of duplicating

Store the minimum facts needed to represent the domain. Totals, filtered lists, labels, and boolean flags that can be calculated from existing state should usually be derived, otherwise one update path will eventually forget to synchronize a duplicate.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
const useCartTotal = () => useCartStore(state =>
  state.itemIds.reduce((total, id) => total + (priceById[id] ?? 0), 0)
);
```

**Gotcha:** If a derived computation is expensive, memoize or precompute deliberately; do not store a second source of truth just to avoid a tiny calculation.

**Before/after check:** Before the change, reproduce the failure for “derive instead of duplicating.” After the change, verify both the normal path and the edge case described above.

### 6. Split stores by domain

A single store for unrelated menu, billing, animation, and profile state creates accidental coupling. Split stores when ownership, lifecycle, persistence policy, or update frequency differs. Keep stores together when invariants must change atomically.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
export const useThemeStore = create<{theme: "light" | "dark"; toggle: () => void}>(
  set => ({ theme: "dark", toggle: () => set(s => ({theme: s.theme === "dark" ? "light" : "dark"})) })
);

export const useGalleryStore = create<{index: number; select: (index: number) => void}>(
  set => ({ index: 0, select: index => set({index}) })
);
```

**Gotcha:** Splitting every field into a separate store can make workflows harder to coordinate; split by domain boundaries, not by fashion.

**Before/after check:** Before the change, reproduce the failure for “split stores by domain.” After the change, verify both the normal path and the edge case described above.

### 7. Use slices for a cohesive large store

Slices let a store grow by feature while retaining a single store when features share atomic transitions. Define slice types and compose creator functions; avoid circular imports between slices.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import type { StateCreator } from "zustand";

type ThemeSlice = { theme: "light" | "dark"; setTheme: (theme: "light" | "dark") => void };
type GallerySlice = { selectedIndex: number; selectIndex: (index: number) => void };
type AppState = ThemeSlice & GallerySlice;

const createThemeSlice: StateCreator<AppState, [], [], ThemeSlice> = set => ({
  theme: "dark",
  setTheme: theme => set({ theme }),
});
const createGallerySlice: StateCreator<AppState, [], [], GallerySlice> = set => ({
  selectedIndex: 0,
  selectIndex: selectedIndex => set({ selectedIndex }),
});
export const useAppStore = create<AppState>()((...args) => ({
  ...createThemeSlice(...args),
  ...createGallerySlice(...args),
}));
```

**Gotcha:** Slice composition does not automatically make unrelated updates atomic; design the action where cross-slice invariants live.

**Before/after check:** Before the change, reproduce the failure for “use slices for a cohesive large store.” After the change, verify both the normal path and the edge case described above.

### 8. Add devtools with useful action names

The devtools middleware gives a timeline of state transitions. Name actions so the timeline says what happened, and keep development-only diagnostics out of production bundles when your build setup supports it.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { create } from "zustand";
import { devtools } from "zustand/middleware";

type PanelState = { open: boolean; setOpen: (open: boolean) => void };
export const usePanelStore = create<PanelState>()(devtools(
  set => ({ open: false, setOpen: open => set({ open }, false, "panel/setOpen") }),
  { name: "panel-store" }
));
```

**Gotcha:** Devtools history can expose user-entered data in development; do not treat it as a safe place for secrets.

**Before/after check:** Before the change, reproduce the failure for “add devtools with useful action names.” After the change, verify both the normal path and the edge case described above.

### 9. Persist only durable state

Persistence is appropriate for theme preference, dismissed onboarding, or a draft with a clear recovery story. It is usually wrong for temporary hover, modal animation progress, or data that should be fetched from a server. Use an explicit storage key and a versioned migration strategy.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Preferences = { theme: "light" | "dark"; setTheme: (theme: "light" | "dark") => void };
export const usePreferences = create<Preferences>()(persist(
  set => ({ theme: "dark", setTheme: theme => set({ theme }) }),
  { name: "site-preferences-v1", storage: createJSONStorage(() => localStorage),
    partialize: state => ({ theme: state.theme }) }
));
```

**Gotcha:** `partialize` limits what is saved, but it does not encrypt data or make local storage trustworthy.

**Before/after check:** Before the change, reproduce the failure for “persist only durable state.” After the change, verify both the normal path and the edge case described above.

### 10. Handle hydration and SSR

On server-rendered pages, browser storage is not available during server execution and persisted state may arrive after the first render. Design a hydration gate or a deterministic initial UI when a preference changes markup. Avoid reading `window` at module initialization.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { persist, createJSONStorage } from "zustand/middleware";

export const useUiPreferences = create<Preferences>()(persist(
  set => ({ theme: "dark", setTheme: theme => set({ theme }) }),
  { name: "ui-preferences", storage: createJSONStorage(() =>
      typeof window === "undefined" ? undefined : localStorage
    ), skipHydration: true }
));

// In a client-only root effect, call useUiPreferences.persist.rehydrate()
// and render preference-dependent UI after the chosen hydration policy is satisfied.
```

**Gotcha:** `skipHydration` requires you to trigger rehydration; forgetting it leaves the store at defaults.

**Before/after check:** Before the change, reproduce the failure for “handle hydration and ssr.” After the change, verify both the normal path and the edge case described above.

### 11. Guard asynchronous actions against races

When a user changes filters twice quickly, the older request may finish last and replace newer results. Track request identity or use AbortController in the service layer; do not assume completion order matches start order.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type ResultsState = { results: string[]; requestId: number; load: (query: string) => Promise<void> };
export const useResults = create<ResultsState>((set, get) => ({
  results: [], requestId: 0,
  load: async query => {
    const requestId = get().requestId + 1;
    set({ requestId });
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error(`Search failed: ${response.status}`);
    const results = await response.json() as string[];
    if (get().requestId === requestId) set({ results });
  },
}));
```

**Gotcha:** Production code should catch and represent errors; a request ID prevents stale success but does not cancel wasted network work.

**Before/after check:** Before the change, reproduce the failure for “guard asynchronous actions against races.” After the change, verify both the normal path and the edge case described above.

### 12. Test state transitions independently

Because a Zustand store can be read and updated without rendering a component, test its actions as domain transitions. Reset state between tests and assert observable behavior rather than private implementation details.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
import { beforeEach, expect, it } from "vitest";
import { useProjectStore } from "./project-store";

beforeEach(() => {
  useProjectStore.setState({ activeProjectId: null });
});

it("selects a project", () => {
  useProjectStore.getState().setActiveProject("project-42");
  expect(useProjectStore.getState().activeProjectId).toBe("project-42");
});
```

**Gotcha:** Persist middleware can leak data between tests if storage is not cleared or mocked.

**Before/after check:** Before the change, reproduce the failure for “test state transitions independently.” After the change, verify both the normal path and the edge case described above.

### 13. Integrate state with accessible UI

Global state should drive semantic controls, not replace them. A theme toggle remains a button with an accessible name; a selected tab communicates its state through appropriate attributes. Keyboard users must be able to produce the same transitions.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
function ThemeToggle() {
  const theme = usePreferences(state => state.theme);
  const setTheme = usePreferences(state => state.setTheme);
  return <button type="button" aria-pressed={theme === "dark"}
    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
    Dark theme
  </button>;
}
```

**Gotcha:** `aria-pressed` describes a toggle button; do not use it as a substitute for tab or menu semantics.

**Before/after check:** Before the change, reproduce the failure for “integrate state with accessible ui.” After the change, verify both the normal path and the edge case described above.

### 14. Build a complete shared-state workflow

Combine domain ownership, selectors, persistence, race handling, accessible controls, and tests into one feature. A gallery may persist the preferred layout, but should not persist transient hover state or blindly trust a saved index after the item list changes.

**Naive approach:** put the value wherever it is easiest to reach and assume it remains correct.

**Correct approach:** define ownership, validation, lifecycle, and the failure behavior before wiring the UI.

```tsx
type GalleryState = { selectedId: string | null; select: (id: string | null) => void };
export const useGallery = create<GalleryState>()(persist(
  set => ({ selectedId: null, select: selectedId => set({ selectedId }) }),
  { name: "gallery-selection-v1", partialize: state => ({ selectedId: state.selectedId }) }
));

function GalleryCard({ id, title }: { id: string; title: string }) {
  const selected = useGallery(state => state.selectedId === id);
  const select = useGallery(state => state.select);
  return <article>
    <h2>{title}</h2>
    <button type="button" aria-pressed={selected} onClick={() => select(selected ? null : id)}>
      {selected ? "Selected" : "Select project"}
    </button>
  </article>;
}
```

**Gotcha:** Validate persisted IDs against current data before treating them as selected; saved state can outlive the record.

**Before/after check:** Before the change, reproduce the failure for “build a complete shared-state workflow.” After the change, verify both the normal path and the edge case described above.

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Selector-first subscriptions

**What it does:** limits a component subscription to the value it renders. **When to use it:** whenever a component needs one field from a shared store, especially in lists or frequently updated UI.

```tsx
const theme = usePreferences(s => s.theme);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 2: Action-oriented store API

**What it does:** exposes meaningful transitions instead of letting every component invent update logic. **When to use it:** whenever several components can perform the same domain action.

```tsx
const addItem = useCartStore(s => s.addItem);
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 3: Persisted preference slice

**What it does:** saves only durable preferences and avoids serializing ephemeral fields. **When to use it:** theme, layout choice, dismissed onboarding, or a recoverable draft.

```tsx
partialize: state => ({ theme: state.theme, density: state.density })
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 4: Request identity guard

**What it does:** prevents stale async results from winning after a newer request. **When to use it:** typeahead, filters, rapidly switchable dashboards, and search panels.

```tsx
if (get().requestId === requestId) set({ results });
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 5: Store composition with slices

**What it does:** organizes a cohesive store into feature creators. **When to use it:** when one domain is large but still needs atomic cross-feature actions.

```tsx
const createGallerySlice: StateCreator<AppState, [], [], GallerySlice> = set => ({ selectedIndex: 0, selectIndex: selectedIndex => set({ selectedIndex }) });
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 6: Hydration-aware persistence

**What it does:** makes the timing of persisted state explicit. **When to use it:** SSR or any UI where the stored preference changes initial markup.

```tsx
await useUiPreferences.persist.rehydrate();
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

### Pattern 7: Testable transition boundary

**What it does:** verifies store actions without coupling every test to component rendering. **When to use it:** business rules, race guards, and regression tests for previous bugs.

```tsx
useProjectStore.getState().setActiveProject("project-42");
```

Keep the pattern narrow: it solves the named problem, not every state concern in the application. Add a test for the contract at the point where this pattern meets the rest of the system.

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| Selecting the whole store | Every store update can trigger unrelated renders. | Select only the fields or actions consumed by the component. |
| Persisting hover state | Reload restores a meaningless pointer condition. | Keep hover and animation progress in local state or refs. |
| Saving sensitive data | Browser storage is readable by scripts running on the origin. | Keep secrets and authorization decisions on the server. |
| Duplicating derived totals | Cart total drifts from item changes. | Compute the total from canonical item IDs and prices. |
| Starting fetches inside set | Updater logic becomes impure and hard to replay. | Run effects before/after the state transition in an action or service. |
| Ignoring stale responses | Old search results overwrite newer results. | Compare a request sequence token before committing results. |
| Using unstable object selectors | New object identity causes avoidable updates. | Select primitives or apply a stable shallow equality strategy. |
| Assuming storage always exists | Private mode, SSR, or policy settings can break storage access. | Inject a safe storage adapter and handle exceptions. |
| Persisting the full store | Actions and transient fields complicate migrations. | Use `partialize` to save a deliberately small data shape. |
| No migration version | Old JSON shape can break new releases. | Version the persisted schema and migrate known older shapes. |
| Cross-store invariants | Two stores briefly disagree about a workflow. | Keep invariant-related state together or centralize the transaction. |
| No test reset | Tests depend on execution order. | Reset state and clear persisted storage in test setup. |
| Ignoring hydration mismatch | Server and client render different initial content. | Gate preference-dependent rendering or use deterministic defaults. |
| Unlabelled toggle | Screen readers cannot infer what the button changes. | Give the control a stable accessible name and correct pressed state. |

## Mental Models

1. **A store is a contract, not a junk drawer.** Every field must have an owner and a reason to be shared.
2. **Selectors are subscriptions.** The smaller the selected value, the smaller the render blast radius.
3. **Persisted state is untrusted input.** It may be old, malformed, or refer to deleted records.
4. **Actions are domain language.** `beginCheckout` says more than `setOpen(true)` scattered everywhere.
5. **Async completion order is not guaranteed.** The latest intent must win even when it does not finish first.
6. **Fast state is not always global state.** Frame-rate data belongs close to the rendering loop.
7. **One invariant, one transition boundary.** Related fields should change together.

## Quick Reference

| Situation | Decision | Implementation cue |
|---|---|---|
| Local component state | One component owns it | `useState/useReducer` |
| Shared domain state | Several distant components need it | `Zustand store` |
| High-frequency pointer values | Updates every frame | `useRef or animation engine` |
| Small subscription | Render one field | `Selector` |
| Multi-field invariant | Fields must change together | `Single action/set call` |
| Durable preference | Should survive reload | `persist + partialize` |
| Sensitive data | Must not be exposed to JS | `Server-side storage` |
| Async search | Requests can finish out of order | `Request ID / AbortController` |
| Large cohesive store | Features share transitions | `Slices` |
| Debugging timeline | Need inspectable transitions | `devtools middleware` |
| SSR preference | Storage arrives after render | `Hydration strategy` |
| Derived value | Can be computed from canonical state | `Selector/derived function` |
| Regression test | State transition is the contract | `Store-level unit test` |
| Cross-tab preference | Multiple tabs must stay aligned | `Storage event or explicit sync` |

## Build Challenge

### Build: Build a production-ready project gallery state layer for a portfolio with 40+ cards. Users can select a project, switch grid/list density, toggle theme, and search remotely. Persist only theme and density. Make selection invalid when a deleted project is no longer present. Simulate a slow first search and a fast second search, proving the stale first response never replaces the newer result. Include accessible buttons, unit tests, a DevTools debugging note, and a fallback when browser storage throws.

#### Requirements

1. Define a typed store contract and explain why each field is global.
2. Keep a single-card hover state out of the global store.
3. Use selectors for every component subscription.
4. Use action names that describe user intent.
5. Persist only theme and density; exclude transient selection and request status.
6. Add a versioned storage key and document migration behavior.
7. Guard asynchronous search results against out-of-order completion.
8. Handle HTTP errors and expose a recoverable error state.
9. Validate the selected project ID against the current project collection.
10. Provide keyboard-accessible controls with meaningful accessible names.
11. Test state transitions and clear storage between tests.
12. Demonstrate the failure scenario where the oldest request resolves last.

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

- **Gotcha:** If two distant components must stay consistent, duplicating local state creates drift; lift only that shared contract.
- **Gotcha:** Avoid storing duplicate display data when an ID plus canonical project data can derive the label and details.
- **Gotcha:** Returning a new object from a selector on every read can defeat equality checks; select primitives or use an appropriate shallow comparison.
- **Gotcha:** State updater functions should remain pure; do network requests and analytics outside the updater.

#### Review checklist

- [ ] At least one unit test covers a normal transition.
- [ ] At least one integration test covers the failure scenario.
- [ ] State is validated at every external boundary.
- [ ] No component subscribes to more state than it needs.
- [ ] The app behaves predictably after refresh, direct entry, or storage failure.
- [ ] Error messages explain the next action without exposing internal details.

## Production Review Notes

### Store boundary review

A store boundary should be reviewed the same way as a public module API. Write down who can update each field, who reads it, whether it survives navigation, whether it survives a reload, and whether an update must be coordinated with another field. If the answer is unclear, the state model is not ready for production. Keep actions named after user intent and avoid generic setters for domain transitions that have invariants.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Selector stability

Zustand selectors are evaluated as part of subscription updates. Returning a primitive is naturally stable when the value is unchanged. Returning a newly allocated object or array can create avoidable notifications depending on the equality strategy. When a component needs several values, either use separate selectors or a deliberate shallow comparison. Do not memoize every selector by reflex; measure the component that is actually rendering too often.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Persistence threat model

Persist middleware serializes data into browser storage; it does not provide confidentiality, integrity, or authorization. Users can edit values through DevTools, extensions can access the origin, and injected scripts may read the payload. Treat persisted values like request input. Never trust a saved role, price, permission, or checkout total. Recalculate sensitive values on the server and validate any restored record identifier against current data.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Reset and logout behavior

A store often needs an explicit reset path for logout, account switching, or workspace changes. Reset only the relevant domain state and clear persisted values that belong to the old identity. If persisted preferences are account-specific, namespace them by a non-secret account identifier or clear them on identity changes. Never leave the previous account's private drafts visible after switching users.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Testing middleware and persistence

Unit tests should isolate the store from browser storage and should reset both in-memory state and persisted keys. Middleware can change initialization timing, especially when rehydration is asynchronous. Test the public behavior users rely on: a preference restores, a bad record falls back, and a write failure does not block the interaction. Avoid tests that depend on execution order or on a previous test's storage.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Production diagnostics

Use the browser console and React Profiler to confirm the actual render problem before changing selector code. If a component renders too often, log the selected value and identify which action changed it. Zustand DevTools can help inspect transitions, but avoid logging sensitive payloads. A useful diagnostic records the action name, request identity, and outcome—not an entire user object.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Cross-tab and cross-component ownership

Cross-component sharing and cross-tab synchronization are separate problems. A Zustand store is normally in-memory per JavaScript runtime; a second tab does not automatically share that memory. If the product requires theme or layout synchronization across tabs, use storage events or another explicit channel. Decide how to handle simultaneous edits instead of assuming last-write-wins is always correct.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Server rendering and per-request isolation

For server-rendered applications, avoid a single mutable module-level store that can accidentally leak state between requests. Use the framework's recommended per-request or provider-scoped store pattern when user-specific state is involved. Do not read browser globals during server module evaluation. Confirm the initial server and client render are compatible and that hydration has a deliberate policy.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### High-frequency values

Cursor coordinates, scroll progress, and frame-by-frame 3D transforms can change dozens of times per second. Sending every sample through broad global state may trigger unnecessary React work and hurt animation smoothness. Keep hot-path values in refs, requestAnimationFrame loops, or the rendering engine, then publish coarse semantic state such as `isDragging` or `selectedObjectId` when React needs to react.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Migration policy

A versioned persisted key is a promise to handle old data. Define which versions are supported, what transformations are safe, and when data should be discarded. Migrations should be pure, bounded, and tolerant of missing fields. If migration fails, recover to a safe default and optionally report a non-sensitive diagnostic; do not keep retrying a corrupt record on every render.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Selector and action API review

Before a store is widely imported, review its API for accidental escape hatches. Exposing raw `setState` throughout the application makes it easy for components to bypass invariants. Prefer exported hooks, action creators, and carefully chosen selectors. Keep internal implementation details private so a future refactor can change the store shape without rewriting every consumer.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

### Failure rehearsal

A resilient store must survive missing browser storage, stale persisted identifiers, a request that resolves out of order, a rejected network response, and logout during an in-flight request. For each scenario, decide whether to ignore, cancel, reset, or display an error. Then test that behavior. The right choice depends on the feature, but accidental behavior is not an acceptable policy.

**Review check:** reproduce one failure, record the expected behavior, and verify the fix with a test or browser inspection. Keep the recovery path explicit rather than relying on the happy path.

```ts
// Example review assertion: external state must be validated before it is committed.
function isUsableValue(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 120;
}
```

