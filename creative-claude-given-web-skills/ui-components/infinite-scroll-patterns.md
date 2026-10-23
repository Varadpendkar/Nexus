# SKILL: infinite-scroll-patterns
**Layer:** 15 — UI Components
**Goal:** Implement infinite scrolling with reliable cursor pagination, guarded loading, stale-request protection, accessible status updates, stable scroll position, and bounded resource use.

---

## Why This Matters (Senior Perspective)

Infinite scroll is often introduced as a visual effect: place a sentinel at the bottom, observe it, and fetch another page. That is only the trigger. The production problem is coordinating pagination, network requests, query changes, record identity, accessibility, and memory without losing the user's place. A feed can look smooth in a short demo and still duplicate records after a retry, append results from an old filter, repeatedly call an endpoint because the cursor stopped advancing, or trap a screen reader in a growing live region.

Senior engineers begin with the data contract. What identifies the next page? Is the cursor stable while new records are inserted? How does the API indicate exhaustion? What happens if a page is empty but includes a continuation token? These questions cannot be solved by CSS or IntersectionObserver. The UI must preserve the backend's pagination semantics and commit the records and cursor consistently.

The second concern is control. An observer may fire repeatedly while the sentinel remains visible. A manual Load more button may be clicked at the same time, and a retry may overlap an unfinished request. All paths need one authoritative loader. Filters, sorting, workspace changes, and route transitions need to invalidate old requests so their responses cannot contaminate the current feed. A request that succeeds after the user changes context is not a success for the currently visible list.

Accessibility and resilience are equally important. Automatic loading should not steal focus, and it should announce meaningful updates without re-reading the entire feed. A manual continuation control helps keyboard users, people using assistive technology, and users who prefer control over data usage. On failure, preserve the items already displayed and offer a local retry. Do not turn a network problem into a blank screen.

Finally, infinite scroll has a cost. DOM growth, image decoding, layout shifts, and long-lived event handlers can degrade performance over a long session. Virtualization may help, but it complicates focus and screen-reader navigation. Measure first, choose the simplest architecture that meets the workload, and test the feed under slow networks, changing filters, repeated cursors, and narrow viewports. The goal is not endless loading; it is continuous browsing that remains predictable, accessible, and correct.

## Core Concepts

### 1. Treat infinite scroll as a pagination contract

Infinite scroll changes how users discover the next page; it does not remove pagination from the data model. The backend still needs a stable way to identify the next slice, and the UI still needs to know whether more data exists. Prefer cursor pagination for feeds whose contents can change while a user is browsing. Offset pagination can work for stable, bounded collections, but inserts and deletes can cause repeated or skipped records.

**Implementation approach:** Represent the feed state explicitly: items, nextCursor, hasMore, loading, error, and an optional retry state. The server response should include a cursor or continuation token and a clear indication that the result set is exhausted. Do not infer exhaustion from a page being short unless the API contract guarantees that behavior.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** A cursor is not automatically stable merely because it is opaque. The server should define what it encodes and how it behaves when records are deleted, permissions change, or ranking changes during traversal.


### 2. Use IntersectionObserver as a sentinel trigger

A sentinel at the end of the rendered list is usually the cleanest way to detect that the user is approaching the end. IntersectionObserver lets the browser coordinate visibility observation without a high-frequency scroll handler. A positive rootMargin can begin loading before the sentinel is fully visible, hiding network latency behind the user's continued reading.

**Implementation approach:** Observe one sentinel within the intended scroll root. Use a rootMargin tuned to the expected response time and row height, and disconnect or unobserve when the component is no longer active. The callback should call a guarded loadMore function, not implement fetching and state mutation inline.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** If the sentinel stays visible after a page is appended, the observer may fire again immediately. The load guard must prevent overlapping requests, and the design must decide whether to auto-fill the viewport with additional pages or require an explicit user action.


### 3. Define one authoritative loading guard

Observer callbacks can fire repeatedly, a user can click Load more, and a retry button can be activated while a request is in flight. All entry points must share the same guard. A disabled button alone is not enough because the observer can still request data. The guard belongs in the loading controller or data layer.

**Implementation approach:** Before starting a request, check that more data exists and that no request is already active. Set the loading state synchronously before awaiting network work. On completion, release the guard in a finally block so success and failure paths both clean up correctly.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** React state updates are asynchronous and a stale closure can observe an old loading value. For robust deduplication, use a query library's request deduplication, a synchronous ref, or a single-flight promise in addition to visible loading state.


### 4. Make cursor progression explicit

Each successful page must advance the cursor according to the API contract. If a response returns the same cursor repeatedly, the UI can request the same page forever. If the cursor is updated before a request succeeds, a transient failure may permanently skip a page. Keep the cursor associated with the last successfully committed page.

**Implementation approach:** Treat the page response as a transaction: validate it, deduplicate or merge its records, commit items and nextCursor together, then clear loading. Track prior cursors in development or production telemetry to detect loops. Do not invent a next cursor from the number of items unless the API explicitly requires that.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** An empty page with a non-empty next cursor can be valid for some filtered APIs, but repeated empty pages should be bounded. Define a loop-prevention policy instead of assuming every empty page means end-of-feed.


### 5. Deduplicate items by stable identity

Feeds can return overlapping records because of backend ranking changes, retries, or imperfect pagination. Appending every response blindly creates duplicate cards, repeated IDs, and confusing reading order. Deduplication should use a stable record ID, not object reference or array position.

**Implementation approach:** Merge each page through a map keyed by stable ID, preserving the original order for existing items unless the product intentionally supports reordering. Decide whether an updated duplicate replaces the old record in place or moves to a new position. Keep that rule deterministic and tested.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** If IDs are only unique within a tenant or content type, use a composite key. Do not deduplicate on title or URL text; different records can legitimately share those fields.


### 6. Prevent stale and out-of-order requests

A feed can change filters, sort order, search terms, account, or route while a request is running. A response for the old query must not append into the new feed. The same issue appears when a retry races a slow request or when a component unmounts during fetch.

**Implementation approach:** Associate requests with a query key or generation token. Abort obsolete requests when supported, and ignore results whose generation no longer matches the active feed. On filter changes, reset items and cursor as one coordinated transition instead of clearing only the visible cards.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** AbortController is cooperative: a client can stop waiting, but the server may still process the request. The important UI guarantee is that obsolete responses cannot mutate the current feed.


### 7. Choose an intentional prefetch distance

The sentinel should trigger early enough to avoid a visible pause, but not so early that the browser downloads many unseen pages. The correct distance depends on scroll speed, row height, device performance, network latency, and response size. A fixed value is a starting point, not a universal truth.

**Implementation approach:** Begin with a moderate rootMargin such as a few hundred pixels and measure time-to-next-page, blank loading gaps, and pages fetched without being viewed. Tune for mobile separately if your layout or latency differs. Keep the sentinel inside the relevant scroll root so the distance is measured against the correct viewport.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** A very large rootMargin can produce a chain of automatic loads if the viewport remains underfilled. Cap automatic consecutive page fetches or require a user gesture after a defined threshold.


### 8. Keep the scroll container and sentinel aligned

IntersectionObserver observes intersections relative to its root. If the page scrolls normally, use the viewport root. If a feed lives in a fixed-height panel, pass that panel as root. A mismatched root can cause callbacks that never fire or fire at surprising times.

**Implementation approach:** Give the scroll region a deliberate height and overflow behavior, and keep the sentinel inside the content area being observed. Ensure that CSS transforms, overflow clipping, sticky headers, and nested scroll containers are understood and tested.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** Do not use a nested scrolling panel just to make infinite scroll work. A second scroll bar can harm accessibility and usability; use the page viewport unless the product has a clear reason for an internal scroller.


### 9. Provide an explicit fallback control

IntersectionObserver is widely supported in modern browsers, but users also need a clear path when automatic loading is disabled, fails, or does not suit their preferences. A Load more button makes the behavior discoverable, supports keyboard and switch users, and gives people control over data usage.

**Implementation approach:** Keep a semantic button near the end of the list. It can coexist with the sentinel: the observer starts loading when appropriate, while the button gives manual control and retry. Disable it while loading and change its label or status text in a clear way.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** Do not hide the only way to continue behind a sentinel that may be unreachable due to layout bugs or assistive technology. Manual pagination is also a valid product choice for search results, admin tables, and task-oriented workflows.


### 10. Announce changes without flooding assistive technology

Appending content changes the page but should not force a screen reader to re-read the entire feed. Announce meaningful status such as “12 more results loaded” or “Could not load more results” in a polite live region. Avoid making the entire growing list a live region.

**Implementation approach:** Use a stable status element with role=status or aria-live=polite. Keep newly loaded cards in a semantic list or article structure. If the product needs to move focus after a manual Load more action, define that behavior deliberately; automatic loading should generally not steal focus.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** Repeated observer callbacks can generate repeated announcements even if the item list did not change. Announce only after a successful commit that adds meaningful new content.


### 11. Handle errors and retries without losing position

Network failure is inevitable. If loading the next page fails, preserve the items already on screen and show a local retry affordance near the end of the feed. Do not reset the entire list unless the data is no longer valid. A retry should use the last successfully committed cursor.

**Implementation approach:** Model error separately from loading and exhaustion. After a failure, let the user retry or continue using the current items. Ensure the retry path enters the same single-flight guard as automatic loading and clears its error only when a new attempt begins or succeeds, according to your UI convention.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** A retry loop driven by an always-visible sentinel can hammer a failing endpoint. After a failure, pause automatic attempts and require a user action or use a bounded backoff strategy.


### 12. Control memory and DOM growth

Infinite scroll can make a page appear endless while the DOM, event handlers, image memory, and accessibility tree grow without bound. Long sessions can become slow even if each individual page is lightweight. Decide whether old records remain mounted, are virtualized, or are removed with a way to restore reading context.

**Implementation approach:** Use list virtualization when item counts justify it, and keep stable keys and item heights predictable. If you remove old content, preserve scroll anchoring and provide a way to navigate back to earlier records. Lazy-load images and reserve their dimensions to reduce layout shifts.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** Virtualization complicates focus, find-in-page, screen-reader browse mode, and active item tracking. Measure the real cost before adopting it, and test the chosen library with your accessibility requirements.


### 13. Preserve scroll position and layout stability

Appending items should not make the user jump unexpectedly. Image dimensions, web fonts, content expansion, and inserted records above the viewport can shift scroll position. Reserve image aspect ratios and avoid prepending new content to a feed the user is reading unless scroll anchoring is handled.

**Implementation approach:** Give cards stable geometry where possible, set width and height or aspect-ratio on media, and avoid replacing the entire list array in a way that remounts every item. If content is inserted above the current position, record a stable anchor and restore its visual offset after the update.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** Browser scroll anchoring can help, but it is not a substitute for a stable layout. Explicitly test image loading, expanded cards, and changes to sticky headers.


### 14. Make loading states reflect actual work

A spinner at the bottom is useful only if it corresponds to a real request. If the request is very fast, a flickering spinner adds noise; if it is slow, users need a status and perhaps a retry path. Skeletons can reserve space for initial loading, but for append loading they should not replace existing content.

**Implementation approach:** Use a short delay before showing a spinner if fast requests are common, but never delay the actual request. For the initial page, skeletons should approximate final geometry. For subsequent pages, show a compact loading row and a polite status announcement.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** Do not show “Loading more” after hasMore has become false or when a request was canceled because the query changed. Derive visible state from the authoritative request lifecycle.


### 15. Integrate filters, sorting, and refresh safely

A feed's cursor is valid only for the query, sort, filters, and user context that produced it. When any of those inputs change, reset pagination and start a new feed generation. Keeping old items while new results load can be a useful stale-while-revalidate design, but label the transition and prevent mixed datasets.

**Implementation approach:** Create a stable query key from all feed-defining inputs. On change, abort old work, clear or mark stale the prior results, reset cursor, and request the first page. Do not reuse the old cursor for a new sort order.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** If filter changes preserve scroll position, consider whether that is intuitive. Usually a new result set should return to its start, while refresh of the same result set can preserve an anchor.


### 16. Use a complete production feed lifecycle

The final system combines pagination, observer lifecycle, deduplication, stale-request protection, accessibility, retries, and performance. Each mechanism should be independently understandable, then tested together. The most important integration rule is that one successful response commits items and cursor as one consistent update, while every failure path releases the loading guard.

**Implementation approach:** Build a feed controller with `loadNextPage`, `resetFeed`, `retry`, and explicit states. Keep rendering focused on showing items, status, error, sentinel, and manual control. Use an established data-fetching library when it already provides infinite queries, cancellation, cache keys, and retry policies.

```html
<section aria-labelledby="feed-heading">
  <h2 id="feed-heading">Recent activity</h2>
  <ol id="activity-feed">
    <li>
      <article>
        <h3>Example activity</h3>
        <p>A meaningful record appears here.</p>
      </article>
    </li>
  </ol>
  <p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
  <div id="feed-sentinel" aria-hidden="true"></div>
  <button id="load-more" type="button">Load more results</button>
</section>
```

```js
async function loadNextPage() {
  if (!hasMore || inFlight) return;
  inFlight = true;
  setLoading(true);
  try {
    const page = await fetchPage(nextCursor);
    if (!isCurrentFeedGeneration()) return;
    const mergedItems = mergeByStableId(items, page.items);
    commitFeed({ items: mergedItems, cursor: page.nextCursor, hasMore: page.hasMore });
    announce(`${page.items.length} more results loaded`);
  } catch (error) {
    if (!isAbortError(error)) setAppendError('More results could not be loaded.');
  } finally {
    inFlight = false;
    setLoading(false);
  }
}
```

The HTML uses meaningful list and article structure, a separate status region, and a real manual control. The JavaScript illustrates the central invariant: every trigger calls the same guarded loader, and a response is committed only if it belongs to the current feed generation. The example assumes helper functions are implemented in the data controller.

**Naive vs correct:** Naive code calls `fetchPage()` inside every observer callback and blindly appends the response. Correct code uses one loader, validates the active generation, merges by stable identity, commits cursor and items together, and handles both success and failure.

**Gotcha:** An observer callback can fire multiple times while a sentinel remains visible. Do not treat the callback as a one-time event; make loading idempotent and guard it at the data layer.

**Edge/system-level consideration:** An infinite query library still needs correct query keys, stable page parameters, and sensible UI behavior. Abstraction does not remove the need to test the product contract.


## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Sentinel observer with manual fallback

**What it does:** Automatically request another page when the end sentinel approaches the visible scroll root while retaining a real Load more button.

**When to use it:** Use for feeds, galleries, activity streams, and content discovery pages where continuous browsing is appropriate.

**Implementation:**

```js
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) void loadNextPage('observer');
}, { root: scrollRoot ?? null, rootMargin: '0px 0px 480px 0px', threshold: 0 });

observer.observe(sentinel);
return () => observer.disconnect();
```

**Nuance / edge case:** The observer is only a trigger. `loadNextPage` must own the single-flight guard, hasMore check, cancellation rules, and error handling. Keep the button available as a fallback.


### Pattern 2: Cursor-based query key

**What it does:** Bind the loaded pages to a stable query key that includes every filter and sort input.

**When to use it:** Use when feed results can change between requests or when users can switch workspaces, search terms, or sort orders.

**Implementation:**

```js
const queryKey = ['activity-feed', workspaceId, filter, sort, searchTerm];
const pageParam = nextCursor ?? null;
// Every filter/sort change creates a new query identity.
// Never append a response from an obsolete query key to the current feed.
```

**Nuance / edge case:** Normalize query parameters consistently. Avoid including unstable object identities in cache keys unless the query library serializes them deterministically.


### Pattern 3: Single-flight load controller

**What it does:** Make observer, retry, and manual button calls share one in-flight request.

**When to use it:** Use whenever more than one interaction can initiate page loading.

**Implementation:**

```js
let inFlight = null;
async function loadNextPage() {
  if (!hasMore || inFlight) return inFlight;
  inFlight = fetchPage(nextCursor);
  try {
    const page = await inFlight;
    commitPageAtomically(page);
    return page;
  } finally {
    inFlight = null;
  }
}
```

**Nuance / edge case:** A closure-local promise is useful in a controller but must be scoped to the active feed generation. Resetting filters should invalidate the old promise rather than letting it commit.


### Pattern 4: Generation token for stale responses

**What it does:** Ignore responses started for a previous filter, sort, or route context.

**When to use it:** Use when requests can overlap or be canceled imperfectly.

**Implementation:**

```js
let generation = 0;
async function resetAndLoad() {
  const requestGeneration = ++generation;
  const page = await fetchFirstPage();
  if (requestGeneration !== generation) return;
  replaceFeed(page.items, page.nextCursor);
}
```

**Nuance / edge case:** Also abort requests when possible to save bandwidth. The generation check remains valuable because cancellation is not guaranteed to prevent all completion paths.


### Pattern 5: Accessible append status

**What it does:** Announce only meaningful successful appends and recoverable failures without moving focus automatically.

**When to use it:** Use on content feeds that append records while a person keeps reading.

**Implementation:**

```js
<p id="feed-status" role="status" aria-live="polite" aria-atomic="true"></p>
<button type="button" id="load-more">Load more results</button>
<div id="feed-error" hidden>
  <p>More results could not be loaded.</p>
  <button type="button" id="retry-load">Try again</button>
</div>
```

**Nuance / edge case:** Update the live region after a page has committed, and announce the number of newly added records rather than every observer event.


### Pattern 6: Bounded automatic fill

**What it does:** Stop repeated automatic fetches when the viewport remains underfilled or the API returns suspicious pages.

**When to use it:** Use for short first pages, large screens, or APIs that can return empty pages with continuation tokens.

**Implementation:**

```js
const MAX_AUTO_PAGES_PER_TRIGGER = 3;
let autoPages = 0;
function onAutomaticPageCommitted() {
  autoPages += 1;
  if (autoPages >= MAX_AUTO_PAGES_PER_TRIGGER) {
    setAutomaticLoadingPaused(true);
  }
}
function onManualLoad() {
  autoPages = 0;
  setAutomaticLoadingPaused(false);
  return loadNextPage();
}
```

**Nuance / edge case:** Tune the cap based on content geometry and user expectations. Never use the cap as a substitute for detecting a repeated cursor.


### Pattern 7: Virtualized long feed

**What it does:** Render only the visible window plus overscan when thousands of records would overwhelm the DOM.

**When to use it:** Use after profiling shows DOM size or rendering cost is harming responsiveness.

**Implementation:**

```js
// Conceptual integration: keep stable item keys and use the virtualizer's
// end-of-range callback as a trigger for the same guarded loadNextPage().
const itemKey = (index) => items[index]?.id ?? `loader-${index}`;
const overscan = 6;
```

**Nuance / edge case:** Virtualization affects keyboard focus, screen-reader navigation, and browser find-in-page. Validate those trade-offs and keep an explicit manual continuation control.


## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|

| Fetching directly inside the observer callback | It bypasses shared guards and lifecycle rules. | Call a single guarded `loadNextPage` controller from every trigger. |

| Using offset pagination for a rapidly changing feed without safeguards | New or deleted records can shift offsets and duplicate or skip content. | Prefer stable cursors or document and test the consistency guarantees of offsets. |

| Updating the cursor before the request succeeds | A failed request can skip a page on retry. | Commit the next cursor only with the successful page response. |

| Appending duplicate records | Pages can overlap after retries or ranking changes. | Merge by stable ID and define whether updated duplicates retain position. |

| Allowing old filter responses to append | Requests can finish out of order after query changes. | Use query keys or generation tokens and ignore stale responses. |

| Relying only on React loading state for deduplication | State updates may not be visible to repeated callbacks immediately. | Use a synchronous in-flight guard or query library deduplication. |

| Making the sentinel the only continuation control | The observer can fail, be misconfigured, or be difficult to discover. | Provide a semantic Load more button and a retry path. |

| Using the wrong observer root | The sentinel is measured against the wrong viewport or panel. | Set `root` to the actual scrolling element or use null for the document viewport. |

| Setting an enormous rootMargin | The feed may fetch many pages the user never views. | Tune the prefetch distance and cap automatic consecutive loads. |

| Retrying automatically forever after errors | A visible sentinel can hammer a failing API. | Pause automatic retries and require a user gesture or bounded backoff. |

| Making the entire feed a live region | Assistive technology may re-announce large amounts of content. | Announce concise append counts and errors in a separate status element. |

| Moving focus to every appended card | Keyboard and screen-reader users lose their current place. | Keep focus stable for automatic loads; define explicit behavior for manual loads. |

| Ignoring image dimensions | Late image layout shifts can move the reading position. | Reserve aspect ratio or dimensions before images load. |

| Removing old items without preserving an anchor | Users can jump to a different place in the feed. | Virtualize carefully or preserve an anchor and its offset when pruning. |

| Using array indexes as record keys | Insertions and deduplication can attach state to the wrong card. | Use stable record IDs, including composite IDs when required. |

| Treating a short page as end-of-feed without API guarantees | Some APIs return partial pages while more results remain. | Follow the server's explicit `hasMore` or continuation contract. |

| Ignoring repeated cursors | A backend loop can request the same page indefinitely. | Detect cursor repetition and stop with a safe error or telemetry event. |

| Resetting items but not cursor on filter changes | New results continue from an old query's position. | Reset items, cursor, error, and request generation together. |

| Replacing the entire list on every append | Unnecessary remounts lose local state and can cause visual jumps. | Append or reconcile records by stable identity and preserve unchanged nodes. |

| Using a spinner as the only error feedback | Users cannot distinguish slow work from a permanently failed request. | Render an explicit error message and retry button near the feed end. |


### Before / after: cursor must advance only after a successful page

Incorrect:

```js
// Wrong: a failed request has already moved the cursor forward.
const cursorForRequest = nextCursor;
nextCursor = guessNextCursor(nextCursor);
const page = await fetchPage(cursorForRequest);
items = [...items, ...page.items];
```

Correct:

```js
async function requestAndCommitPage() {
  const cursorUsed = nextCursor;
  const page = await fetchPage(cursorUsed);
  validatePageResponse(page);
  const merged = mergeByStableId(items, page.items);
  // Commit the data and the continuation state together after success.
  commitFeed({
    items: merged,
    nextCursor: page.nextCursor,
    hasMore: Boolean(page.hasMore)
  });
}
```

The response owns the next cursor. If the request fails, keep the last successfully committed cursor so retry requests the same logical page. If the API returns a repeated cursor, stop automatic loading and surface a recoverable issue rather than creating an infinite request loop.

## Mental Models


### Pagination is still there

Infinite scroll changes when the next page is requested, not the need for a consistent page boundary and continuation contract.


### The sentinel rings a doorbell

Visibility asks the loader to consider fetching; it does not itself authorize or perform a request.


### One request, one commit

Validate a response, merge its items, and advance its cursor as one coherent transaction.


### The query defines the feed

A cursor belongs to a specific filter, sort, search, workspace, and identity context.


### Keep the old content useful

A failed next-page request should not erase the records the user is already reading.


### Every automatic behavior needs a brake

Bound auto-fill, pause after errors, and keep a manual continuation path.


### DOM size is a product constraint

A feed that never ends must still control memory, focus, layout shifts, and assistive-technology cost.


### Focus is not a scroll position

Appending content should generally not move keyboard focus; preserve reading position separately.


## Quick Reference

| Concern | Recommended default | Watch out for |
|---|---|---|

| Pagination | Cursor or explicit continuation token | Do not assume short page means exhausted |

| Observer root | Viewport for document scrolling; element for panel scrolling | Root must match the actual scroll container |

| Prefetch | Start with a measured positive rootMargin | Avoid fetching many unseen pages |

| Request guard | One in-flight request per active feed generation | Observer and button share the same guard |

| Cursor commit | Advance only after successful page validation | Retry from the last committed cursor |

| Deduplication | Stable record ID or composite key | Never dedupe on title alone |

| Stale results | Abort and/or use generation tokens | Old responses must not mutate new query state |

| Empty page | Follow API continuation contract and bound loops | Detect repeated cursors |

| Errors | Preserve existing items and show retry | Pause automatic retry after failure |

| Accessibility | Separate polite status announcement | Do not make the entire feed a live region |

| Manual fallback | Semantic Load more button | Do not rely only on visibility callbacks |

| Layout stability | Reserve image/media dimensions | Watch late fonts and expanding cards |

| Large feed | Profile, then virtualize if justified | Test focus and screen-reader behavior |

| Filter changes | Reset query identity, cursor, and request generation | Never reuse old cursor for new sorting |

| Testing | Test races, duplicates, failure, and scroll position | Happy-path-only tests miss production bugs |


## Build Challenge

Build an infinite activity feed for a multi-workspace project dashboard. Each activity has a stable ID, title, timestamp, and optional media. The backend uses cursor pagination. The feed must continue smoothly while protecting against duplicate records, stale requests, repeated cursors, and network errors.

### Requirements

1. Use a semantic ordered or unordered list with meaningful card/article structure.
2. Implement cursor pagination using the server's continuation contract.
3. Use IntersectionObserver with the correct root and a measured prefetch margin.
4. Keep a visible, keyboard-accessible Load more button as a fallback.
5. Route observer, button, and retry triggers through one guarded loader.
6. Prevent overlapping requests with a synchronous in-flight guard or a query library's equivalent.
7. Merge records by stable ID and document the duplicate-update policy.
8. Advance the cursor only after a successful validated response.
9. Reset items, cursor, error, and request generation when filters or sorting change.
10. Ignore or abort responses from obsolete feed generations.
11. Detect repeated cursors and prevent unbounded automatic fetch loops.
12. Preserve existing content when a later page fails and show a retry action.
13. Announce successful appends and errors in a concise polite status region.
14. Keep keyboard focus stable during automatic loading.
15. Reserve image dimensions and test layout stability during media loading.
16. Add a bounded auto-fill policy for cases where the viewport remains underfilled.
17. Profile long sessions and document whether virtualization is necessary.
18. Test mobile viewport behavior, internal scroll roots if supported, and 200% zoom.
19. Emit privacy-conscious telemetry for requested, committed, failed, and retried pages.
20. Add tests for duplicates, stale responses, repeated cursors, request races, failures, and end-of-feed.

### Failure scenarios

- **Repeated observer callback:** the sentinel remains visible while the first page request is pending. Only one request may be active for that feed generation.
- **Cursor loop:** the API returns the same continuation token twice. Automatic fetching must stop and record a diagnosable failure.
- **Stale filter:** a request for the old filter completes after a new filter has loaded. Its records must not appear in the new feed.
- **Retry after failure:** the next-page request fails. Existing records remain visible, and retry uses the last committed cursor.
- **Overlapping pages:** two responses include the same record ID. The rendered feed contains one record with the documented update policy.
- **Short but non-final page:** the server returns fewer records than requested but indicates that more data exists. The feed continues.
- **Mobile keyboard:** the visible viewport shrinks. The user can still reach the loading status, results, and manual continuation control.
- **Long session:** hundreds of records are loaded. Scrolling, focus, and rendering remain acceptable, or virtualization is introduced with tested accessibility behavior.
- **Navigation during fetch:** the user leaves the page. The observer is disconnected and the old response cannot mutate a different route's feed.
- **Assistive technology:** an append completes. Only a concise status is announced; the entire list is not re-read.

### Definition of Done / Success Criteria

- [ ] The feed uses the backend's documented cursor and exhaustion semantics.
- [ ] All triggers share one loader and no duplicate concurrent page request occurs.
- [ ] Cursor and items are committed consistently only after a valid successful response.
- [ ] Stable record IDs prevent duplicate cards across overlapping pages.
- [ ] Filter or sort changes invalidate stale requests and reset pagination state.
- [ ] Repeated cursors and suspicious empty-page sequences cannot create an unbounded loop.
- [ ] A failed append preserves existing items and offers a usable retry.
- [ ] A semantic manual Load more control remains available.
- [ ] Status updates are concise, polite, and do not steal focus.
- [ ] Images and other media reserve layout space to reduce scroll jumps.
- [ ] The feed is tested on a slow network, a narrow viewport, and a long session.
- [ ] Virtualization decisions are based on measurement and include accessibility checks.
- [ ] Telemetry avoids raw queries and sensitive record content by default.
- [ ] Unit and integration tests cover stale responses, duplicates, failures, and end-of-feed.
- [ ] A reviewer can explain the cursor lifecycle, loading guard, and reset behavior without reading UI markup.


## Production Integration Checklist

### API contract review

Before writing the observer, write down the API response contract. Identify the item identity field, continuation field, exhaustion signal, sort stability, permission behavior, and error model. Confirm whether the continuation token is opaque and whether it is valid only for a particular query. Decide what the client should do if the token repeats, the response shape is malformed, or the API returns an empty page that still advertises another page.

A strong client does not guess at server semantics. If the API does not return a reliable exhaustion signal, document the assumption and add tests around it. If records can be inserted while the user scrolls, ask whether the cursor represents a stable snapshot, a keyset position, or a moving ranking. Those choices affect duplicates and missing records. A UI can deduplicate records it sees, but it cannot recover a record the server never returns.

### State transition table

| Current state | Event | Next state | Required behavior |
|---|---|---|---|
| Initial | First request starts | Initial loading | Reserve geometry and expose loading status |
| Initial loading | First request succeeds | Ready | Commit items and cursor together |
| Ready | Sentinel intersects | Loading next page | Start only if hasMore and not pending |
| Loading next page | Request succeeds | Ready or exhausted | Merge by ID and advance cursor |
| Loading next page | Request fails | Append error | Keep existing records and offer retry |
| Append error | Retry activated | Loading next page | Use last committed cursor |
| Any active state | Query changes | New generation | Invalidate prior results and cursor |
| Any active state | Component unmounts | Inactive | Disconnect observer and abort where possible |
| Ready | Repeated cursor detected | Safe stop/error | Prevent unbounded request loop |

### Observer lifecycle and cleanup

Create the observer when the sentinel and intended root exist. Disconnect it when the feed unmounts, when the root changes, or when the feature is disabled. Avoid creating a new observer on every render without cleanup. In component frameworks, ensure dependencies represent the actual sentinel and root nodes, not freshly created wrapper objects. A disconnected observer should not be able to start a request for an obsolete feed generation.

The observer callback should remain intentionally small. It should check whether the entry is intersecting and call the same guarded loader used by the manual button. It should not merge data, mutate cursors, announce status, and manage retries on its own. Those responsibilities belong to the controller, where all triggers share the same invariants.

### Query library integration

A query library with an infinite-query primitive can provide caching, page parameters, request deduplication, cancellation, and retry policy. It does not decide your query key, deduplication rule, accessible status, or visual fallback. Include workspace, filters, sort, and search in the query key. Return the next page parameter from the API's continuation contract, and make `getNextPageParam` return the library's documented exhausted value when no page remains.

Do not copy flattened pages into a second state array unless you have a concrete need. Duplicating cache state creates synchronization problems when a page is refetched or a record is updated. Derive the rendered list from cached pages and perform a stable merge only when the backend contract requires overlapping pages to be reconciled.

### Performance budget

Measure initial render, append duration, item count, DOM node count, image decode pressure, memory use after a long session, and the number of pages fetched but never viewed. On low-end mobile devices, large card images and expensive per-item effects often dominate before the list itself becomes the bottleneck. Reserve media dimensions, lazy-load below-the-fold images, and avoid repeatedly recalculating expensive derived data for every existing record.

Virtualization should be driven by evidence. If the feed only contains a few dozen cards, it can introduce more complexity than value. If thousands of rows remain mounted, virtualization can be necessary, but it changes the behavior of focus, browser search, and screen-reader navigation. Include those constraints in the decision rather than treating virtualization as a purely performance-only improvement.

### Privacy and analytics

Do not send full search queries or private record titles to analytics by default. Useful events often include `feed_page_requested`, `feed_page_committed`, `feed_page_failed`, `feed_end_reached`, and `feed_retry_clicked`, with page size, duration, and a non-sensitive query category. Avoid emitting a separate event for every observer callback because observers may fire repeatedly without an actual page request.

Track both successful continuation and unnecessary fetches. A feed that loads ten pages in the background but has users read only the first two may be wasting bandwidth. Use measurements to tune rootMargin and automatic-fill caps. Aggregate metrics and review identifiers before sending them to third-party analytics.

### Accessibility and user control

Keep the content structure meaningful: lists for homogeneous results, articles for independent stories, headings for sections, and buttons for actions. Do not make the sentinel focusable merely because it is observed. A visible Load more button is a practical continuation mechanism and provides a user-controlled alternative to automatic loading. If the button starts a request, its state should communicate that request is pending and it should not permit duplicate activation.

Automatic append should generally preserve keyboard focus. A polite status region can announce that additional results loaded without moving the user's virtual cursor. After a manual button activation, do not automatically focus the first new card unless user research and the interaction contract justify that behavior. Screen reader users may prefer to continue browsing from the button or use the feed's normal reading order.

### Release review

Test on a real phone, a slow network, a long feed, an empty feed, and a feed with mixed media. Test scrolling in both the document viewport and any supported internal panel. Change filters while a request is in flight, navigate away during loading, retry a failed request, and simulate a backend response that repeats its cursor. Check that no stale page appears in the new query and that the current reading position does not jump after images load.

Finally, review whether infinite scroll is actually the best pattern for the task. It works well for exploratory feeds, but can be poor for comparison tables, search results where users need a stable result count, or workflows that require reaching a footer. Provide a clear end state, keep a manual continuation control, and consider a “Back to top” or saved-position affordance when the page is very long.
