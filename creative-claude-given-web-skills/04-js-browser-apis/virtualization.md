# Virtualization — Production-Grade Rendering of Large Collections

> **Layer:** 04 — JavaScript & Browser APIs  
> **Skill:** `virtualization`  
> **Use when:** A gallery, feed, table, menu, timeline, or long list contains enough items that mounting every DOM node creates measurable startup, layout, paint, memory, or interaction costs. The Master Skill Reference calls out galleries with 50+ items, infinite scroll, long lists, and node recycling as primary use cases.

## Why This Matters

Rendering a large collection is not free simply because each row looks small. Every mounted element can participate in style calculation, accessibility-tree construction, layout, paint invalidation, event targeting, and memory retention. A list of 8,000 compact rows may still create tens of thousands of nodes once each row contains labels, icons, controls, and metadata. The result can be a slow initial render, long tasks, scroll hitching, high memory usage, and delayed interaction feedback.

Virtualization changes the rendering strategy: keep the complete data model, but mount only the subset of items that can affect the current viewport, plus a controlled overscan region. The scroll container preserves the apparent size and position of the collection while the DOM represents only a small window. It is a performance technique, not a data-fetching strategy and not a substitute for correct semantic structure.

Production failures usually come from incorrect geometry rather than from the basic idea. If the estimated row height differs from the real row height, the scroll thumb may jump, items may overlap, or the wrong record may appear at a given scroll position. If a recycled row retains state from its previous item, a checkbox, focus state, or image can appear on the wrong record. If keyboard navigation assumes every item exists in the DOM, users may become stranded at the end of the mounted window. If an infinite loader confuses the last rendered row with the last record in the data source, it can repeatedly fetch the same page or stop before the user reaches the end.

A robust virtualizer therefore needs an explicit geometry model, a stable identity model, a windowing policy, a focus strategy, and clear integration boundaries with data loading. It also needs a graceful fallback for small collections and an escape hatch for cases where virtualization is not worth the complexity.

### 1. The Virtualization Contract

Virtualization separates three things that are often accidentally conflated: the full collection, the visible window, and the physical DOM. The full collection owns the records and their stable identifiers. The visible window is derived from scroll position and geometry. The DOM is only a temporary rendering of that window. Never use the current DOM as the authoritative source of collection state.

A useful contract defines what the virtualizer promises: which indexes are mounted, where each mounted item is positioned, how much total scrollable space is represented, how overscan is selected, and what happens when the collection changes. Consumers should not need to know the internal recycling mechanism. They should receive stable item identity, a render position, and lifecycle hooks only when those hooks are genuinely necessary.

This separation matters in framework and vanilla JavaScript implementations alike. A component can use React, Vue, or plain DOM nodes, but the geometry rules are still the same. Avoid embedding data fetching, row business logic, selection policy, and scroll restoration into one giant function. Keep the virtualizer focused on mapping geometry to a bounded set of rendered records.

```js
function getWindow({ scrollTop, viewportHeight, rowHeight, count, overscan = 4 }) {
  const firstVisible = Math.floor(scrollTop / rowHeight);
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const start = Math.max(0, firstVisible - overscan);
  const end = Math.min(count, firstVisible + visibleCount + overscan);
  return { start, end, totalHeight: count * rowHeight };
}
```

For fixed-height rows, this contract is deterministic and inexpensive. For variable-height rows, the contract needs a height index or another way to map offsets to item indexes. That is a different algorithmic problem; do not hide it behind a `rowHeight` value that is only an average.

**Gotcha:** Virtualization reduces the number of mounted nodes, but it does not automatically reduce the cost of filtering, sorting, formatting, image decoding, or fetching the full dataset. Profile the whole pipeline.

### 2. Fixed-Height Geometry

Fixed-height virtualization is the best starting point because it makes index-to-offset and offset-to-index conversion constant-time. If every row is exactly `rowHeight` pixels high, the top offset for index `i` is `i * rowHeight`, and the first visible index is `floor(scrollTop / rowHeight)`. The total spacer height is `count * rowHeight`.

The phrase “exactly rowHeight” is a real constraint, not an approximation. Padding, borders, line wrapping, browser zoom, font loading, responsive widths, and user text-size settings can change measured dimensions. Use border-box sizing and a layout that prevents content from silently expanding the row. If text can wrap, either define a reliable line clamp or choose a variable-height strategy. A CSS height declaration alone does not guarantee that content cannot overflow or affect neighboring layout.

Avoid adding a large spacer as a single ordinary child with a height beyond browser layout limits. Browsers have practical limits for extremely large scrollable dimensions, and precision can degrade at very large offsets. For truly enormous datasets, consider segmented scrolling or a logical scroll coordinate that is decoupled from the physical scroll range.

```css
.virtual-list {
  position: relative;
  overflow: auto;
  block-size: 32rem;
  contain: strict;
}

.virtual-list__spacer {
  position: relative;
  inline-size: 100%;
}

.virtual-row {
  position: absolute;
  inset-inline: 0;
  block-size: var(--row-height);
  box-sizing: border-box;
  overflow: hidden;
}
```

```js
function fixedRowTop(index, rowHeight) {
  if (!Number.isInteger(index) || index < 0) throw new RangeError("Invalid index");
  if (!(rowHeight > 0)) throw new RangeError("rowHeight must be positive");
  return index * rowHeight;
}
```

**Gotcha:** If a list uses `border-bottom: 1px solid` and `box-sizing: content-box`, the actual outer height may be one pixel larger than the assumed height. That tiny error accumulates into a large scroll-position mismatch.

### 3. Calculating the Visible Window

The visible window must include all rows that intersect the viewport and, usually, a buffer around them. Given `scrollTop`, `viewportHeight`, and a fixed row height, calculate the first visible index and number of visible rows. Clamp start and end indexes to the valid collection range. Use an exclusive end index so slicing and loop bounds remain consistent.

Overscan reduces blank flashes when scrolling quickly, but mounting too many extra rows reduces the performance benefit. A fixed overscan of three to six rows is a reasonable starting point for many lists, not a universal answer. A fast-moving scroll position may justify a larger forward buffer than backward buffer. Tune from real traces and device performance rather than picking a large number “for safety.”

Scroll events can fire many times in a frame. Store the latest scroll position synchronously, then schedule one render update per animation frame. Do not create a new animation frame request for every event without tracking the pending request. If the framework already batches updates appropriately, avoid layering another scheduler that makes state timing harder to reason about.

```js
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateWindow(scrollTop, viewportHeight, rowHeight, count, overscan = 4) {
  const safeTop = Math.max(0, scrollTop);
  const first = Math.floor(safeTop / rowHeight);
  const visible = Math.ceil(viewportHeight / rowHeight);
  const start = clamp(first - overscan, 0, count);
  const end = clamp(first + visible + overscan, start, count);
  return { start, end, firstVisible: clamp(first, 0, Math.max(0, count - 1)) };
}
```

An empty collection is a legitimate state. A viewport taller than the entire collection is also legitimate. Ensure calculations return an empty range when `count === 0`, and do not assume that the last index is valid when there are no items.

### 4. Spacer and Positioning Strategies

The user needs to perceive the full list length even though only a small window is mounted. Common strategies include a single spacer whose height equals the full logical list, absolutely positioned rows within that spacer, or a translated inner window with top and bottom spacers. Each strategy has trade-offs.

Absolute positioning makes the geometry explicit and keeps rows out of normal flow, but it means row content must not determine the virtual layout height. Top/bottom spacers can integrate more naturally with normal flow, though their heights and DOM structure must be updated consistently. A translated window can reduce the number of layout-affecting elements, but transforms create stacking contexts and may affect fixed-position descendants. Choose one strategy and document its assumptions.

```html
<section class="virtual-list" aria-label="Search results">
  <div class="virtual-list__spacer">
    <!-- Only the active window is mounted here. -->
    <article class="virtual-row" style="top: 2400px">
      <h3>Example result</h3>
      <p>Rendered at its logical collection offset.</p>
    </article>
  </div>
</section>
```

When setting inline offsets, prefer assigning a CSS custom property or a `transform: translateY(...)` based on a validated numeric value. Do not concatenate untrusted text into style strings. A virtualizer should also avoid changing row width during scroll; width changes can alter text wrapping and invalidate height measurements.

**Gotcha:** A transform on the window can create a new containing block for descendants. A tooltip or menu that was positioned as if it lived in the page may be clipped or positioned relative to the transformed ancestor. Portal overlays when appropriate.

### 5. Variable-Height Items

Variable-height rows invalidate the simple formula `index * rowHeight`. To find the item at a scroll offset, the virtualizer needs cumulative heights. A basic approach measures rendered rows and stores their heights. The prefix sum of heights tells the top offset of each item; searching that prefix structure maps an offset back to an index.

A naïve implementation recomputes every prefix sum whenever one row changes height, which can become expensive for long lists. More scalable approaches use a Fenwick tree, segment tree, or a maintained prefix-sum structure that supports updates and offset queries in logarithmic time. The correct choice depends on list size, how frequently heights change, and how complex the implementation can reasonably be.

Measurement must happen after the DOM has laid out the row. `ResizeObserver` can help detect changes caused by images, fonts, or responsive width. Avoid synchronously forcing layout for every item during a scroll event. Batch measurement updates, then correct the virtual geometry in a controlled render phase.

```js
const heights = new Map();

function recordHeight(itemId, measuredHeight) {
  if (!Number.isFinite(measuredHeight) || measuredHeight <= 0) return;
  heights.set(itemId, measuredHeight);
}
```

For dynamic content, keep a stable estimate for unmeasured rows and replace it when a real measurement arrives. When an earlier row changes height, preserve the user's visual anchor: if the reader is looking at item 500, an image loading above that item should not unexpectedly push the reading position down. Capture the anchor item and its offset before applying measurement corrections, then restore that relative offset.

### 6. Stable Identity and Recycling

A row's index is not its identity. Sorting, filtering, inserting, deleting, or prepending records changes indexes. If a checkbox state is stored against index 12, then a new record inserted at the top can make that state appear to belong to another record. Use stable keys such as record IDs and store selection, expansion, and edits in data keyed by those IDs.

Node recycling can reuse an existing DOM element for another record. This can reduce allocations, but it increases the risk of stale state. Every item-dependent attribute must be updated: text, labels, `aria-*` properties, image source, selected state, event-handler closure, dataset fields, and any pending asynchronous result. If an image request for item A completes after the recycled node now represents item B, item A's image must not be displayed in B's row.

A safe default is to let the framework reconcile rows by stable keys or to rebuild the small active window with explicit cleanup. Optimize to manual recycling only after profiling shows that node creation is a meaningful bottleneck.

```js
function renderRow(node, item) {
  node.dataset.itemId = item.id;
  node.querySelector("[data-title]").textContent = item.title;
  const checkbox = node.querySelector("input[type=checkbox]");
  checkbox.checked = selectedIds.has(item.id);
  checkbox.setAttribute("aria-label", `Select ${item.title}`);
}
```

Avoid capturing the original item in a long-lived listener when the node is recycled. Either replace the listener with each render, use event delegation and read the current stable ID from the node, or keep a controlled reference that is updated with the item.

### 7. Scroll Position, Anchoring, and Restoration

Scroll position is a coordinate, not a durable description of what the user is reading. A raw `scrollTop` becomes misleading when items are inserted above the viewport, rows are remeasured, the collection is sorted, or the viewport changes size. For user-facing feeds, preserve a logical anchor: a stable item ID plus the pixel offset between that item's top and the viewport top.

When a new page is prepended, capture the anchor item and its offset, insert the new data, recalculate geometry, then restore the anchor to the same relative position. For a chat interface, the desired behavior may differ: if the user is already at the bottom, keep the latest message visible; if the user has scrolled up to read history, do not yank them to the bottom when new messages arrive.

Browser scroll anchoring may already adjust some layout shifts. If the virtualizer also applies a correction, the two systems can overcompensate. Test with browser anchoring enabled and decide whether the virtualized region needs `overflow-anchor: none`. Do not disable it globally without a measured reason.

```js
function captureAnchor(container, row) {
  return {
    itemId: row.dataset.itemId,
    offset: row.getBoundingClientRect().top - container.getBoundingClientRect().top
  };
}
```

After rendering, locate the anchor by ID, measure its new position, and adjust `scrollTop` by the difference between current and desired offsets. If the anchor record was deleted, choose a documented fallback such as the nearest surviving item.

### 8. Keyboard and Assistive-Technology Navigation

A virtual list presents a challenge for keyboard navigation because most logical items do not exist in the DOM at a given moment. Native Tab navigation can only move through mounted focusable elements. If a user presses ArrowDown at the last mounted row, the next logical row may not exist yet. A virtualizer for an interactive list must therefore define how focus moves across the window boundary.

For simple lists of links, keeping focus on the scroll container and using a documented keyboard interaction model can work. For grid-like widgets, use the relevant ARIA pattern only when the widget truly behaves like a grid. Roving `tabindex` can keep a single item in the tab order, but the focused item must be mounted before calling `.focus()`. Track logical focus by stable item ID, not by DOM node alone.

Use semantic HTML first. A collection of articles can be represented by `<ul>` and `<li>`, while a data table should remain a table when its relationships are tabular. Do not add `role="grid"` simply because rows are positioned with JavaScript. If using `aria-setsize` and `aria-posinset`, make sure values describe the logical collection and are accurate when filtering or paging changes the collection.

```js
async function focusLogicalIndex(index, ensureRendered, getNode) {
  await ensureRendered(index);
  const node = getNode(index);
  if (!node) return false;
  node.focus();
  return true;
}
```

Test with keyboard-only navigation and screen readers. Verify that focused nodes are not removed unexpectedly, focus is not silently reset to the body, item counts and positions are understandable, and selection changes are announced when needed. Virtualization is not permission to make content undiscoverable.

### 9. Focus Retention and DOM Removal

Removing a focused element can move focus to the document body or create a confusing focus state. A virtualizer must know whether the focused item is about to leave the mounted range. Possible policies include keeping the focused row mounted, moving focus to a stable container, or rendering the next logical target before transferring focus. The right choice depends on the interaction pattern.

Do not force-scroll the page whenever focus moves unless that behavior is part of the interaction contract. For a searchable list, moving focus to a result should scroll the virtual container, not accidentally scroll the entire document. Use `scrollIntoView` carefully because its default behavior can affect ancestor scroll containers. Often it is better to compute the target offset and update the intended container directly.

Avoid hiding the focused row with `display: none` while retaining a stale reference. Also avoid applying `aria-hidden="true"` to a subtree that still contains keyboard focus. These mistakes make the accessibility tree disagree with the actual focus state.

A robust focus algorithm is a small state machine: identify the intended logical target, ensure it is in the data model, compute the required window, render, focus the actual node, then announce or update selection state. If any step fails, retain a safe focus target and report the failure during development rather than leaving the user stranded.

**Gotcha:** A row can be visible but not mounted yet when a keyboard event is handled. Schedule rendering and focus in a predictable sequence; don't assume that changing a start index instantly creates the node synchronously in every framework.

```js
function chooseFocusFallback(container, nextItem) {
  const target = nextItem ?? container;
  target.focus({ preventScroll: true });
  return target;
}
```

### 10. Infinite Loading Is a Separate Concern

Virtualization decides which loaded records need DOM nodes. Infinite loading decides when and how to fetch additional records. They often work together, but they should not be the same subsystem. The virtualizer should request a range or report that the visible window is approaching the loaded boundary. A data loader should deduplicate requests, handle failures, and update the data model.

Do not infer the end of the dataset from the number of mounted rows. A window of 20 mounted rows may represent the middle of 100,000 loaded records. Likewise, do not request a new page on every scroll event when the loader is already pending. Maintain a loading state and a cursor or page token, and ensure retries don't duplicate records.

A sentinel element observed by `IntersectionObserver` can trigger a fetch, but virtualized lists often unmount the sentinel when it is outside the active window. A range-based callback is often simpler: if `end >= items.length - preloadThreshold`, ask the data loader to fetch more. The loader should know whether more records exist and whether a request is already in flight.

```js
function shouldLoadMore({ end, loadedCount, preload = 8, hasMore, loading }) {
  return hasMore && !loading && end >= loadedCount - preload;
}
```

Include loading, empty, and error states in the accessible UI. A failed request should offer a retry action. If an automatic retry is used, bound it and back off rather than creating a rapid request loop. Preserve the user's current anchor when new records are appended or prepended.

### 11. Filtering, Sorting, and Dataset Changes

Filtering and sorting change the logical sequence, often while the user is in the middle of the list. A virtualizer must receive the new collection and recalculate its window against the new count. If the current scroll position is beyond the new maximum, clamp it. If the current focused item remains in the filtered result, consider preserving focus by ID; if not, move focus according to an explicit policy.

Do not retain a cached index-to-ID mapping after sorting without invalidating it. For variable-height rows, heights can be keyed by item ID if the same record's rendering is stable, but the offset index must be rebuilt because item order changed. If row height depends on column width, the cache must also be invalidated when width changes.

For expensive filtering, use a worker or incremental strategy when profiling indicates the main thread is blocked. Virtualization only lowers DOM cost; it does not make an O(n) search free. Debounce user input when it improves interaction, but do not introduce so much delay that the interface feels unresponsive. Provide a clear empty state when filtering yields no results.

```js
function updateCollection(nextItems, container, maxScrollTop) {
  const oldTop = container.scrollTop;
  items = nextItems;
  rebuildIndexById(items);
  container.scrollTop = Math.min(oldTop, maxScrollTop(items));
  scheduleRender();
}
```

### 12. Overscan and Adaptive Windows

Overscan is a controlled buffer of rows beyond the visible viewport. Too little overscan can show blank space during rapid scrolling, slow image decoding, or delayed framework commits. Too much overscan mounts unnecessary elements and can bring back the cost virtualization was intended to avoid.

A symmetric overscan is simple and often sufficient. An adaptive strategy can use scroll direction and velocity to bias the buffer toward the direction of travel. Keep the algorithm bounded: a flick on a trackpad should not cause thousands of rows to mount. Use a minimum and maximum, and consider reducing overscan on slower devices when memory or rendering time is constrained.

Do not treat scroll velocity as perfect intent. Touchpad momentum and browser scheduling can change quickly. A conservative forward bias is usually better than a highly reactive window that oscillates on every small change. Measure blank-window incidents and frame time in representative tests before adding adaptive complexity.

```js
function directionalOverscan(direction, base = 4, forward = 10, backward = 3) {
  return direction === "forward"
    ? { before: backward, after: forward }
    : { before: forward, after: backward };
}
```

The best overscan is the smallest buffer that avoids visible gaps on the target devices and workloads. Keep the values configurable so product teams can tune them without rewriting geometry code.

### 13. Large Scroll Ranges and Segmented Scrolling

Browsers can represent very large scroll heights, but practical layout and precision limits vary. A list with millions of fixed-height records can imply a spacer hundreds of millions of pixels tall. At extreme offsets, scroll precision and platform behavior may become problematic. Browser-specific behavior, device pixel ratios, and compositing details all matter.

For extremely large logical datasets, use a segmented or recentered scroll coordinate. Keep a logical base offset separate from the physical scroll position, and periodically shift the physical content while preserving the user's perceived location. This is more complex than ordinary windowing and should only be introduced after testing proves the simple spacer approach inadequate.

Segmented scrolling needs special care with browser history, scroll restoration, anchors, keyboard focus, and external code that reads `scrollTop`. Expose logical positions through an API rather than encouraging every consumer to inspect raw physical coordinates. If the user needs deep links to a specific record, use record IDs or stable logical indexes in the URL rather than serializing an implementation-specific physical scroll offset.

**Gotcha:** Re-centering a scroll container can trigger another scroll event. Guard internal corrections and distinguish them from user-originated scrolling to avoid a feedback loop.

### 14. Framework Integration and Lifecycle

In a framework, the virtualizer should integrate with the framework's rendering lifecycle rather than directly mutating nodes that the framework believes it owns. A React implementation may use a maintained library and stable keys; a Vue implementation may use keyed loops and reactive window bounds. In vanilla JavaScript, explicit DOM creation and disposal can be appropriate, but event listeners and observers still need clear ownership.

Avoid state updates from measurement callbacks that repeatedly cause layout and measurement in an unbounded cycle. Batch measurement data, compare it to the prior value with a tolerance, and update only when the geometry meaningfully changes. During unmount, disconnect observers, cancel pending animation frames, remove listeners, and abort in-flight work that belongs to the list instance.

Prefer a mature library when requirements include variable row heights, grids, sticky headers, RTL, dynamic columns, or complicated focus management. Reimplementing a simple fixed-height list can be educational and perfectly valid. Reimplementing an entire virtualization ecosystem to avoid one dependency is often a poor trade if the component is business-critical.

```js
function disposeVirtualizer() {
  observer?.disconnect();
  container.removeEventListener("scroll", onScroll);
  if (frameId) cancelAnimationFrame(frameId);
  frameId = 0;
}
```

### 15. Testing and Performance Validation

A virtualizer should be tested as a geometry engine, not only by looking at a page and deciding that it scrolls. Unit tests should cover empty collections, one item, viewport taller than the content, first and last windows, negative or invalid input, very large indexes, and updates to the item count. Property-based tests can assert that the range is bounded, start never exceeds end, and all visible indexes are included.

Browser tests should cover actual scrolling, responsive resizing, keyboard navigation, focus retention, image loading, sorting, filtering, and errors from the data loader. Run at different viewport sizes and device pixel ratios. Include slow CPU throttling and reduced network conditions when the list loads remote images or pages.

Use the Performance panel to compare a non-virtualized baseline with the virtualized version. Track mounted node count, scripting time, layout and paint activity, long tasks, scroll responsiveness, and memory. A virtualizer that renders fewer nodes but introduces expensive forced layouts or repeated full-array work may not be a win.

The target is not a specific magic frame rate on every machine. The target is to reduce measured cost while preserving correct behavior. Record the dataset size, hardware profile, browser version, viewport, and test steps so future regressions can be compared honestly.

```js
function assertValidWindow({ start, end }, count) {
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    throw new TypeError("Window boundaries must be integers");
  }
  if (start < 0 || end < start || end > count) {
    throw new RangeError("Window is outside the collection");
  }
}
```

### 16. Production Observability and Diagnostics

Expose enough diagnostics to understand the active window without shipping noisy logs to every user. In development, report the visible range, total logical count, mounted count, estimated and measured heights, pending data request, and current anchor. A debug overlay can show whether blank regions are caused by window calculations, rendering latency, or missing data.

Instrument slow paths sparingly. Performance marks can bracket window calculation, measurement application, and render completion. Avoid logging every scroll event in production; logging itself can affect timing. Prefer aggregated counters or sampled diagnostics, and never include sensitive row content in telemetry.

When an issue is reported, reproduce it with a stable dataset and a recorded sequence: initial viewport, scroll positions, filtering/sorting operations, and any resize or data changes. A screenshot alone cannot reveal whether the wrong row was rendered because of a key collision, stale measurement, or scroll-anchor correction.

**Gotcha:** If diagnostics themselves retain DOM nodes or item objects, they can prevent garbage collection and distort memory measurements. Store scalar snapshots and dispose debug observers when the panel is closed.

```js
performance.mark("virtual-window-start");
const range = calculateWindow(scrollTop, viewportHeight, rowHeight, items.length);
renderRange(range);
performance.mark("virtual-window-end");
performance.measure("virtual-window", "virtual-window-start", "virtual-window-end");
```

### 17. Semantic Structure and Accessible Status

Use the semantic element that matches the content. A collection of independent results can use `<ul>` and `<li>`. A data grid should use table semantics when rows and columns represent data relationships. Articles can be grouped with headings. Do not convert everything to `div` elements because absolute positioning seems easier.

Provide a stable label for the collection, meaningful names for row actions, and an understandable status for loading and empty results. Use a live region only for meaningful updates, not for every scroll position change. A live region that announces every newly mounted row can overwhelm screen-reader users. Announce a result count after filtering or a concise message when additional results finish loading.

Focus indicators must remain visible on interactive rows and controls. `:focus-visible` can provide a clear keyboard focus treatment without forcing the same outline on every pointer interaction. Do not remove the outline without an equivalent replacement. For touch, ensure interactive targets have sufficient size and that scrolling gestures are not accidentally intercepted by custom drag handlers.

```html
<p class="sr-only" role="status" aria-live="polite" data-results-status>
  240 results available.
</p>
<ul aria-label="Search results" data-virtual-list></ul>
```

### 18. Memory, Images, and Expensive Row Content

Virtualization limits DOM count, but row components can still retain large image bitmaps, subscriptions, timers, observers, and cached objects. When a row leaves the active window, release resources that are owned by that row and are no longer needed. Shared data caches should have an explicit lifetime and size limit rather than retaining every record indefinitely.

Use lazy image loading when it is useful, but do not assume `loading="lazy"` alone solves all image costs inside a virtualizer. Images may be mounted and unmounted repeatedly during fast scrolls, and decoding can still compete with rendering. Provide dimensions or aspect ratios to prevent layout shifts. For variable-height lists, image dimensions must be accounted for in the estimate or the geometry updated after load.

Avoid expensive date formatting, syntax highlighting, charts, and markdown parsing during every scroll-driven render. Cache pure transformations by stable item identity and relevant input version, or precompute them outside the hot path. Cache invalidation must be explicit when the underlying data changes. Do not cache rendered DOM across different records unless all item-specific state is reset.

```js
function releaseRowResources(row) {
  row.querySelectorAll("video, audio").forEach(media => media.pause());
  row.querySelectorAll("[data-row-owned-timer]").forEach(node => {
    const timerId = Number(node.dataset.rowOwnedTimer);
    if (Number.isFinite(timerId)) clearTimeout(timerId);
  });
}
```

### 19. Choosing a Library or a Custom Implementation

A custom virtualizer is reasonable when the requirement is narrow: fixed-height rows, simple scroll behavior, a modest interaction model, and a small maintenance surface. A library is usually preferable when the product needs variable heights, grid virtualization, sticky rows, dynamic measurements, robust accessibility, RTL, scroll restoration, or extensive framework integration.

Evaluate a library by its behavior under your actual requirements, not just its benchmark chart. Verify how it handles item keys, variable heights, focus, nested scroll containers, resize, SSR/hydration, and very large collections. Confirm active maintenance and compatibility with your framework version. A library that is fast but cannot preserve the current reading anchor during updates may be the wrong fit for a chat feed or log viewer.

Do not build a generic abstraction before the product requirements are known. Start with a small, explicit API and extend only when real use cases demand it. Document assumptions such as fixed row height, one scroll container, and whether the list can prepend records. Clear constraints are safer than pretending a narrow implementation supports every collection.

```js
function shouldUseVirtualization({ count, estimatedRowCost, threshold = 100 }) {
  return count >= threshold || count * estimatedRowCost > 8;
}
```

### 20. Mental Models

1. **The data model is the source of truth.** The DOM is a temporary viewport-sized projection of the collection.
2. **Geometry is a contract.** The virtualizer must accurately map logical indexes and offsets to physical layout.
3. **An index is a position, not an identity.** Store durable selection and edits by stable record ID.
4. **Overscan is a budget.** Every extra mounted row spends rendering and memory capacity to reduce blank-window risk.
5. **Scroll position is contextual.** A stable item anchor is often more meaningful than a raw pixel value.
6. **Virtualization and loading are different systems.** One bounds rendering; the other manages data availability.
7. **Focus is part of state.** Unmounting a focused row is a user-visible behavior that needs a deliberate policy.
8. **Measure before optimizing.** A smaller DOM is useful only if total interaction performance improves.

```js
function assertVirtualizerInvariants({ start, end, count, mountedCount, maxMounted }) {
  console.assert(start >= 0 && start <= end && end <= count, "Invalid window");
  console.assert(mountedCount <= maxMounted, "Mounted node budget exceeded");
}
```

## Implementation Patterns

### Pattern 1 — Fixed-Height Window Calculator

**What it does:** Maps scroll geometry to a bounded range of item indexes.  
**When to use it:** Use for lists whose rows have a reliable, invariant height.

```js
export function getFixedWindow(scrollTop, viewportHeight, rowHeight, count, overscan = 4) {
  if (rowHeight <= 0 || !Number.isFinite(rowHeight)) throw new RangeError("Invalid row height");
  if (count <= 0) return { start: 0, end: 0 };
  const first = Math.floor(Math.max(0, scrollTop) / rowHeight);
  const visible = Math.ceil(Math.max(0, viewportHeight) / rowHeight);
  return {
    start: Math.max(0, first - overscan),
    end: Math.min(count, first + visible + overscan)
  };
}
```

Test the empty list, the final window, and a viewport larger than the entire collection. Use an exclusive end index consistently.

### Pattern 2 — Frame-Coalesced Scroll Updates

**What it does:** Converts many scroll events into at most one window calculation per animation frame.  
**When to use it:** Use when scroll handlers update rendering state and profiling shows redundant work.

```js
let frameId = 0;
let latestTop = 0;

function onScroll() {
  latestTop = container.scrollTop;
  if (frameId) return;
  frameId = requestAnimationFrame(() => {
    frameId = 0;
    updateWindow(latestTop);
  });
}

container.addEventListener("scroll", onScroll, { passive: true });
function dispose() {
  container.removeEventListener("scroll", onScroll);
  if (frameId) cancelAnimationFrame(frameId);
}
```

Do not schedule a frame per event without checking whether one is already pending. Cleanup must cancel the pending frame.

### Pattern 3 — Stable-ID Row Rendering

**What it does:** Updates row content and interactive state based on the current record ID.  
**When to use it:** Use when rows can be reused or when collection order changes.

```js
function updateRow(row, item, selectedIds) {
  row.dataset.itemId = item.id;
  row.querySelector("[data-title]").textContent = item.title;
  const checkbox = row.querySelector("input");
  checkbox.checked = selectedIds.has(item.id);
  checkbox.setAttribute("aria-label", `Select ${item.title}`);
}
```

Use `textContent` for untrusted text, reset every item-dependent attribute, and avoid stale closures over previous items.

### Pattern 4 — Range-Based Infinite Loading

**What it does:** Requests additional data as the visible window approaches the loaded boundary.  
**When to use it:** Use when virtualized data arrives in pages or cursor-based chunks.

```js
function maybeLoadMore({ end, count, hasMore, loading, threshold = 8, loadMore }) {
  if (hasMore && !loading && end >= count - threshold) {
    return loadMore();
  }
}
```

The loader must deduplicate requests, handle errors, and decide whether more data exists. Do not trigger loads from every scroll event.

### Pattern 5 — Variable-Height Measurement

**What it does:** Stores measured heights for rows whose dimensions can change.  
**When to use it:** Use when content wraps, images load, or rows contain dynamic content.

```js
const measuredHeights = new Map();

const observer = new ResizeObserver(entries => {
  for (const entry of entries) {
    const id = entry.target.dataset.itemId;
    if (!id) continue;
    const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
    if (height > 0) measuredHeights.set(id, height);
  }
  scheduleGeometryUpdate();
});
```

Batch updates and maintain an anchor when earlier rows change height. For very large lists, avoid rebuilding every prefix sum after each measurement.

### Pattern 6 — Logical Focus Across the Window

**What it does:** Renders the intended item before focusing it.  
**When to use it:** Use for keyboard-operable virtual lists and grids.

```js
async function moveFocusTo(index) {
  const item = items[index];
  if (!item) return;
  setLogicalFocus(item.id);
  await ensureIndexRendered(index);
  const node = findRenderedNode(item.id);
  node?.focus();
}
```

Define a fallback when the item disappears or rendering fails. Never rely on an off-screen logical item already existing in the DOM.

### Pattern 7 — Preserve a Reading Anchor

**What it does:** Maintains the user's relative position while earlier rows are inserted or remeasured.  
**When to use it:** Use for chat histories, logs, feeds, and prepend pagination.

```js
function adjustForHeightChange(container, previousAnchorTop, nextAnchorTop) {
  const delta = nextAnchorTop - previousAnchorTop;
  if (Number.isFinite(delta) && delta !== 0) container.scrollTop += delta;
}
```

Capture the anchor by stable ID before applying changes. Test interaction with browser scroll anchoring so two correction systems do not fight each other.

### Pattern 8 — Bounded Overscan

**What it does:** Keeps a limited number of extra rows around the visible range.  
**When to use it:** Use to reduce blank flashes without mounting an excessive number of nodes.

```js
function getOverscan(direction, base = 4, max = 12) {
  const forward = Math.min(max, base * 2);
  return direction === "down"
    ? { before: base, after: forward }
    : { before: forward, after: base };
}
```

Start with a small fixed buffer, then tune with traces. Any adaptive policy should be bounded and should not oscillate wildly.

## Common Mistakes

| ID | Mistake | Why it fails | Fix |
|---|---|---|---|
| A | Treating an index as a stable key | Reordering moves state to another record | Key selection and edits by immutable item ID |
| B | Using an average height as a fixed height | Offset error accumulates through the list | Use true fixed-height layout or variable-height geometry |
| C | Forgetting to clamp the range | Out-of-range indexes cause undefined items | Clamp start and end against the current count |
| D | Mounting the whole list during startup | Defeats the purpose of windowing | Render only the initial viewport and overscan |
| E | Choosing excessive overscan | Raises DOM, layout, and memory costs | Measure and cap the buffer |
| F | Rendering too little overscan | Fast scrolling exposes blank gaps | Tune a bounded buffer on target devices |
| G | Keeping selection on row index | Selection changes after sorting or insertion | Store selected IDs in a `Set` or equivalent keyed store |
| H | Reusing a node without resetting state | Stale labels or checkbox state leak across records | Reset every item-dependent property during render |
| I | Allowing late async results to overwrite a recycled row | Data for an old record appears in a new record's node | Check the current item ID or abort stale work |
| J | Removing a focused row without a policy | Keyboard focus can be lost | Preserve focus or transfer it to a stable target |
| K | Combining data loading with window math | Fetching becomes coupled to scroll timing | Keep a separate loader with deduplication and error state |
| L | Rebuilding all height prefixes for every measurement | Creates unnecessary O(n) work | Batch measurements and use an indexed height structure when needed |
| M | Correcting scroll position twice | Browser anchoring and app logic can overcompensate | Test anchoring behavior and assign one correction owner |
| N | Using `scrollIntoView` without checking ancestors | The page may scroll instead of the list | Adjust the intended container or specify the desired scroll behavior |
| O | Ignoring width changes in a height cache | Text wraps differently and invalidates measurements | Invalidate affected height measurements when width changes |
| P | Assuming virtualization makes filtering cheap | Filtering still processes the dataset | Profile data processing separately and optimize it when necessary |
| Q | Announcing every mounted row to a live region | Assistive technology receives excessive announcements | Announce meaningful result-count and loading changes only |
| R | Retaining observers after unmount | Leaks targets and callbacks | Disconnect observers and remove listeners in cleanup |
| S | Ignoring huge physical scroll heights | Precision and browser behavior may degrade | Test limits and consider segmented logical scrolling |
| T | Trusting screenshots as the only test | Geometry and focus regressions remain hidden | Add range, scroll, keyboard, resize, and data-change tests |

## Quick Reference

| Requirement | Recommendation |
|---|---|
| Stable identity | Use a unique, immutable item ID |
| Fixed-height row | Calculate offset as `index * rowHeight` |
| Window boundaries | Use a start-inclusive, end-exclusive range |
| Empty collection | Return `{ start: 0, end: 0 }` |
| Scroll events | Coalesce updates with one pending animation frame |
| Overscan | Start small; measure and cap it |
| Dynamic row height | Measure and maintain cumulative geometry |
| Recycled DOM | Reset all item-dependent state |
| Infinite loading | Trigger from loaded-range proximity and deduplicate |
| Focus | Track the logical focused item by ID |
| Data prepended above viewport | Preserve a stable reading anchor |
| Responsive width change | Invalidate height measurements as needed |
| Image rows | Reserve aspect ratio or dimensions |
| Large datasets | Measure processing cost beyond DOM rendering |
| Cleanup | Cancel frames, disconnect observers, remove listeners |
| Debugging | Inspect mounted count, range, geometry, and performance trace |

## Production Build Challenge

Build a virtualized collection explorer for a dataset large enough that rendering every row creates a measurable performance problem. The interface must remain understandable and operable when the data changes.

### Requirements

1. Render at least 20,000 logical records while keeping mounted row count bounded by viewport size plus configured overscan.
2. Use stable, unique record IDs independent of current indexes.
3. Implement a fixed-height window calculator with clamped, exclusive-end range boundaries.
4. Represent the total logical scroll height accurately for the supported dataset range.
5. Coalesce scroll-driven rendering updates and cancel pending frames during teardown.
6. Provide a search field and filter results without retaining stale index mappings.
7. Preserve selected records by ID when the user filters, sorts, or inserts records.
8. Add a variable-height mode or document and enforce the fixed-height contract explicitly.
9. Handle images and late-loading content without exposing overlapping or mispositioned rows.
10. Add a paginated or cursor-based data loader with deduplicated requests.
11. Implement a visible loading state, a recoverable error state, and a meaningful empty state.
12. Support keyboard navigation across window boundaries without losing focus.
13. Use semantic list or table structure appropriate to the actual content.
14. Give the collection an accessible label and controls descriptive names.
15. Ensure keyboard focus is visible using `:focus-visible` or an equivalent accessible treatment.
16. Respect reduced-motion preferences for any animated scroll or row transition behavior.
17. Handle container resizing and viewport changes without stale geometry.
18. Provide a development diagnostic that reports the visible range, mounted count, and total record count.
19. Measure performance on a representative browser and dataset; record node count and scroll responsiveness.
20. Document the geometry assumptions, overscan policy, identity policy, and focus policy.
21. Include a test for an empty collection and a test for one record.
22. Include a test where filtering reduces the collection below the current scroll position.
23. Include a failure test where a data request rejects and a retry succeeds without duplicate records.
24. Include a failure test where the currently focused item is about to leave the rendered window.
25. Include a failure test where an earlier variable-height row changes size while the user is reading lower in the list.

### Definition of Done / Success Criteria

- The mounted DOM remains bounded as the logical collection grows.
- Every visible logical item is represented by the correct record and position.
- Filtering, sorting, and insertions never transfer selection state to another record.
- Scroll position remains predictable when data or measured heights change.
- Keyboard users can reach logical items without focus disappearing.
- Loading failures are recoverable and do not create duplicate pages.
- Automated tests cover boundaries, data updates, focus, and geometry.
- A browser performance trace demonstrates that the virtualized implementation reduces the measured bottleneck.
- Debug diagnostics can be disabled without affecting the virtualizer's behavior.
- Cleanup releases event listeners, animation frames, observers, and row-owned resources.

## Debugging Checklist

1. Inspect the calculated window at the current `scrollTop`; verify the first visible index and exclusive end index.
2. Compare actual row heights with the geometry model in the browser's computed styles.
3. Confirm the spacer's logical height and the physical position of each mounted row.
4. Check whether filtering or sorting invalidated the ID-to-index mapping.
5. Confirm that each recycled node reflects the current record ID and state.
6. Check for forced synchronous layout and repeated measurement in the Performance panel.
7. Test keyboard focus at the first and last mounted rows.
8. Inspect loading state and request deduplication at the loaded-data boundary.
9. Resize the container and verify the window and height cache update.
10. Reproduce any scroll jump with a deterministic dataset and a recorded interaction sequence.

## Browser Support and Progressive Enhancement

Modern evergreen browsers support the core primitives needed for a virtualizer, but the details of large scroll ranges, scroll anchoring, image decoding, and accessibility behavior can vary. Test the actual supported browser matrix rather than assuming that the same geometry behaves identically everywhere. If a supported environment cannot run the virtualizer reliably, a bounded pagination strategy or ordinary list rendering for small result sets can be a valid fallback.

A virtualized collection must not be the only way users can reach essential data if the implementation fails. Provide meaningful loading and error states, preserve the underlying data model, and keep navigation behavior documented. When server rendering is used, avoid hydration mismatches caused by the server and client calculating different initial windows. Use a deterministic initial viewport strategy and measure after hydration.

## Performance Rules of Thumb

- Keep window calculation cheap and independent of expensive item formatting.
- Batch measurements; do not force layout for every item in a scroll handler.
- Prefer stable keys and small row components.
- Avoid mounting expensive charts or editors until the corresponding row is needed.
- Keep image dimensions stable to reduce layout shifts.
- Avoid unbounded caches for records, measurements, and rendered output.
- Profile slow scrolling and fast flick scrolling separately.
- Compare a real baseline with the virtualized version; do not optimize based on DOM count alone.

## Final Review Checklist

- [ ] The collection's semantics match the content.
- [ ] Geometry assumptions are explicit and tested.
- [ ] Start/end indexes remain valid for every count and scroll position.
- [ ] Stable IDs control item state.
- [ ] Recycled rows cannot display stale data.
- [ ] Focus remains predictable across unmount and mount operations.
- [ ] Loading, error, empty, and retry states are accessible.
- [ ] Variable-height behavior is either supported correctly or explicitly excluded.
- [ ] Measurements are batched and stale caches are invalidated.
- [ ] Browser behavior is tested at target viewport sizes and dataset scale.
- [ ] Performance evidence demonstrates a real improvement.
- [ ] All observers, listeners, pending frames, and row-owned resources are cleaned up.
