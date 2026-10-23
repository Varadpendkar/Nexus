# SKILL: skeleton-loading-states

**Layer:** 15 — UI Components

**Goal:** Design and implement skeleton loading states that communicate genuine content loading, preserve layout stability, respect accessibility preferences, and transition cleanly to success, empty, and error states.

---

## Why This Matters (Senior Perspective)

A skeleton is a temporary representation of content that has not arrived yet. It can make an interface feel responsive by preserving the shape of a page while data is loading, but it is not automatically faster, clearer, or more accessible than a spinner. A senior developer chooses a loading pattern based on what the user is waiting for, how predictable the final layout is, how long the operation typically takes, and whether the loading state adds useful information. A skeleton is most effective when the structure is known: a row of cards, a profile header, a product image with a title, or a table with stable columns. If the application has no reasonable idea what the eventual content will look like, a compact progress indicator or plain status message may be more honest.

The primary engineering benefit is layout stability. If the page reserves approximately the same space as the final content, content insertion causes less layout shift and reduces accidental clicks caused by moving controls. But an inaccurate skeleton can make the experience worse. If a placeholder is much shorter than the final text, the page still jumps. If every card is represented by identical gray rectangles while the real layout varies significantly, the placeholder misleads users about what is coming. Build skeletons from the same layout primitives, grid rules, aspect ratios, and responsive breakpoints as the loaded content. Avoid hard-coding a desktop-only placeholder that overflows on mobile.

Loading is a state machine, not a decorative overlay. A data request can be idle, loading, successful with results, successful with no results, failed, cancelled, or stale while a refresh is in progress. A skeleton should appear only when the UI is genuinely waiting for content and should be replaced by the correct terminal state. An empty result is not a loading state. A failed request is not an empty state. A stale-while-revalidate interface may keep existing data visible while showing a subtle refresh indicator instead of replacing everything with skeletons. When a user changes filters quickly, an old response must not overwrite a newer request's results or leave the skeleton displayed forever.

Accessibility requires deliberate choices. Decorative skeleton shapes should generally be hidden from assistive technology, while a single nearby status can announce that content is loading. Marking every placeholder as a live region causes excessive announcements. Do not make the entire page assertive just because a request takes time. If a region is busy, `aria-busy="true"` can communicate that state, but it should be applied to the relevant region and cleared when the update completes. Ensure that the loaded content becomes available in a predictable order and that the skeleton does not trap focus or masquerade as interactive controls. A skeleton should never use disabled fake buttons that look actionable but cannot be used.

Motion needs restraint. A shimmer can draw attention to loading, but it can also distract, consume GPU resources, and cause discomfort. A static skeleton is often sufficient. If you animate, keep the movement subtle, avoid large flashing gradients, and respect `prefers-reduced-motion`. Do not animate every placeholder independently if a shared background animation can achieve the same effect. The loading treatment should not obscure real data during refresh or imply a percentage of completion when no progress measurement exists.

Timing matters as well. For an operation that completes in a few milliseconds, showing a skeleton can cause flicker and make the interface feel slower. Some products delay the appearance of loading UI briefly, then keep it visible for a minimum duration to prevent a flash when the response is extremely fast. These thresholds should be measured and tested rather than copied blindly. A minimum display time can also delay the actual result if implemented incorrectly; never hold back useful content longer than necessary just to satisfy animation polish. Prefer preventing a flash on entry while rendering completed data immediately.

Skeletons are also part of system design. The same component should be usable in cards, lists, tables, profile panels, and media areas without being so generic that it stops matching the final geometry. Shared tokens for color, radius, spacing, and motion help keep loading states consistent with the design system. Server-rendered and client-rendered pages need careful hydration behavior so a placeholder does not flash unnecessarily or create markup mismatch warnings. Image-heavy pages should reserve image aspect ratios even if the image itself is not ready. Testing should cover slow responses, empty results, errors, rapid filter changes, offline conditions, reduced motion, keyboard navigation, and narrow viewports. A good skeleton makes waiting understandable while ensuring that the real content—not the placeholder—remains the focus of the experience.

---

## Core Concepts

### 1. Match placeholder geometry to the final content

**Explanation:** A skeleton should preserve the approximate size and rhythm of the content it represents. Use the same grid, aspect ratio, spacing, and responsive rules where possible.

**Semantic HTML example:**

```html
<section aria-labelledby="projects-heading">
  <h2 id="projects-heading">Recent projects</h2>
  <ul class="project-grid" aria-hidden="true">
    <li class="project-card skeleton-card"><span class="skeleton skeleton--media"></span><span class="skeleton skeleton--line"></span></li>
    <li class="project-card skeleton-card"><span class="skeleton skeleton--media"></span><span class="skeleton skeleton--line"></span></li>
  </ul>
</section>
```

**Working CSS/JS example:**

```css
.project-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
.project-card { min-width: 0; }
.skeleton--media { display: block; aspect-ratio: 16 / 9; border-radius: .75rem; }
.skeleton--line { display: block; width: 68%; height: .9rem; margin-top: .75rem; }
@media (max-width: 48rem) { .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 32rem) { .project-grid { grid-template-columns: 1fr; } }
```

```js
function renderProjectCards(projects) {
  return projects.map(project => createProjectCard(project));
}
```

**Naive vs. correct:** Naive: use one generic 200-pixel rectangle for every card. Correct: reserve the same responsive geometry the loaded card will use.

**Gotcha:** Placeholder height must account for realistic title wrapping and metadata; matching only the image ratio may still leave a large layout jump.

### 2. Represent loading as an explicit state

**Explanation:** Model loading, success, empty, error, and cancellation separately. Do not infer that an empty array means a request is still loading.

**Semantic HTML example:**

```html
<section id="results" aria-busy="true" aria-labelledby="results-title">
  <h2 id="results-title">Search results</h2>
  <p class="loading-status" role="status">Loading results…</p>
  <div class="skeleton-list" aria-hidden="true"></div>
</section>
```

**Working CSS/JS example:**

```js
const initialState = { status: "idle", data: [], error: null };
function reducer(state, action) {
  switch (action.type) {
    case "loading": return { ...state, status: "loading", error: null };
    case "success": return { status: action.data.length ? "success" : "empty", data: action.data, error: null };
    case "error": return { ...state, status: "error", error: action.error };
    case "cancel": return { ...state, status: "idle" };
    default: return state;
  }
}
```

```css
[aria-busy="true"] { cursor: progress; }
```

**Naive vs. correct:** Naive: render skeletons whenever `data.length === 0`. Correct: use a dedicated status value to distinguish initial loading, empty results, and errors.

**Gotcha:** A refresh may have old data available; do not erase useful content unless the interaction genuinely requires a full replacement.

### 3. Hide decorative skeleton shapes from assistive technology

**Explanation:** Skeleton bars are visual placeholders, not content. Hide decorative shapes and provide one concise loading status if users need to know that the region is updating.

**Semantic HTML example:**

```html
<section aria-busy="true" aria-labelledby="activity-title">
  <h2 id="activity-title">Activity</h2>
  <p role="status">Loading activity…</p>
  <div class="activity-skeleton" aria-hidden="true">
    <span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span>
  </div>
</section>
```

**Working CSS/JS example:**

```js
function setLoading(region, isLoading) {
  region.setAttribute("aria-busy", String(isLoading));
  const status = region.querySelector("[role='status']");
  if (status) status.hidden = !isLoading;
}
```

```css
.activity-skeleton[aria-hidden="true"] { pointer-events: none; }
```

**Naive vs. correct:** Naive: expose every gray bar as a named item. Correct: hide decorative shapes and expose meaningful status text.

**Gotcha:** Do not hide the real content container from assistive technology after data loads; clear the busy state and ensure the loaded content is exposed.

### 4. Use `aria-busy` only on the region that is updating

**Explanation:** `aria-busy="true"` indicates that a region is being updated. Apply it to the affected region, not the whole application, unless the whole application truly is unavailable.

**Semantic HTML example:**

```html
<main>
  <nav aria-label="Primary">...</nav>
  <section id="dashboard-panel" aria-busy="true">
    <h2>Revenue</h2>
    <p role="status">Loading revenue data…</p>
  </section>
</main>
```

**Working CSS/JS example:**

```js
function finishLoading(region) {
  region.setAttribute("aria-busy", "false");
  region.querySelector("[role='status']")?.remove();
}
```

```css
.panel[aria-busy="true"] { min-height: 14rem; }
```

**Naive vs. correct:** Naive: set `aria-busy` on `body` for one small widget request. Correct: scope it to the region that is actually changing.

**Gotcha:** Busy state is not a replacement for a loading announcement or visible feedback; use both where appropriate, without announcing the same event repeatedly.

### 5. Avoid flicker on very fast requests

**Explanation:** If loading UI appears and disappears almost immediately, users may perceive a flash. Delay showing the skeleton briefly while allowing completed content to render immediately.

**Semantic HTML example:**

```html
<section id="feed" aria-busy="false">
  <p class="loading-status" role="status" hidden>Loading feed…</p>
  <div class="feed-content"></div>
</section>
```

**Working CSS/JS example:**

```js
async function loadFeed() {
  let showTimer;
  const region = document.querySelector("#feed");
  showTimer = setTimeout(() => {
    region.dataset.loading = "true";
    region.setAttribute("aria-busy", "true");
    region.querySelector(".loading-status").hidden = false;
  }, 150);
  try {
    const data = await fetchFeed();
    renderFeed(data);
  } finally {
    clearTimeout(showTimer);
    region.dataset.loading = "false";
    region.setAttribute("aria-busy", "false");
    region.querySelector(".loading-status").hidden = true;
  }
}
```

```css
#feed[data-loading="true"] .feed-content { visibility: hidden; }
```

**Naive vs. correct:** Naive: show skeletons immediately for every request. Correct: use a measured delay for loading UI and reveal completed content as soon as it is ready.

**Gotcha:** The sample hides the content only when the loading flag becomes true; ensure an initial state and error state are also rendered, and do not leave stale content hidden after an exception.

### 6. Respect reduced-motion preferences

**Explanation:** Shimmer is decorative and should not be required to understand the loading state. Offer a static placeholder when the user requests reduced motion.

**Semantic HTML example:**

```html
<div class="skeleton skeleton--text" aria-hidden="true"></div>
<p role="status">Loading article…</p>
```

**Working CSS/JS example:**

```css
.skeleton {
  background: linear-gradient(90deg, #e7eaf0 25%, #f4f5f8 50%, #e7eaf0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}
@keyframes shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; background: #e7eaf0; }
}
```

```js
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.dataset.reducedMotion = String(reduceMotion);
```

**Naive vs. correct:** Naive: animate every placeholder continuously. Correct: use restrained motion and provide a static treatment when reduced motion is requested.

**Gotcha:** Avoid making the shimmer contrast so strong that it resembles flashing content; also test contrast in dark mode and high-contrast settings.

### 7. Keep the skeleton from pretending to be interactive

**Explanation:** A placeholder should not resemble a working button, link, or input that users can focus and activate. Keep skeleton elements non-interactive and hidden from assistive technology.

**Semantic HTML example:**

```html
<div class="profile-skeleton" aria-hidden="true">
  <span class="skeleton skeleton--avatar"></span>
  <span class="skeleton skeleton--line"></span>
  <span class="skeleton skeleton--line-short"></span>
</div>
```

**Working CSS/JS example:**

```css
.profile-skeleton { pointer-events: none; user-select: none; }
.skeleton { display: block; border-radius: .4rem; background: #e5e7eb; }
.skeleton--avatar { width: 3rem; height: 3rem; border-radius: 50%; }
.skeleton--line { width: 70%; height: .9rem; margin-top: .75rem; }
.skeleton--line-short { width: 40%; height: .75rem; margin-top: .5rem; }
```

```js
function replaceSkeleton(container, contentNode) {
  container.replaceChildren(contentNode);
  container.setAttribute("aria-busy", "false");
}
```

**Naive vs. correct:** Naive: render disabled fake buttons that still enter the tab order. Correct: render decorative shapes and keep focus on meaningful, available controls.

**Gotcha:** `pointer-events: none` does not remove keyboard focus from real interactive descendants; do not put actual buttons inside the decorative skeleton in the first place.

### 8. Preserve image and media aspect ratios

**Explanation:** Media placeholders should reserve space before the image loads. This prevents the surrounding content from shifting as the browser learns the image dimensions.

**Semantic HTML example:**

```html
<article class="story-card">
  <div class="story-media skeleton" aria-hidden="true"></div>
  <h3>Loading headline</h3>
</article>
```

**Working CSS/JS example:**

```css
.story-media { aspect-ratio: 16 / 9; overflow: hidden; border-radius: .75rem; }
.story-media img { display: block; width: 100%; height: 100%; object-fit: cover; }
```

```js
function createStoryImage(src, alt) {
  const img = document.createElement("img");
  img.src = src;
  img.alt = alt;
  img.loading = "lazy";
  return img;
}
```

**Naive vs. correct:** Naive: let image dimensions determine card height after load. Correct: reserve the media box using an aspect ratio or known width/height.

**Gotcha:** An image may fail to load; preserve the reserved space and provide a fallback instead of leaving a broken-image icon in a layout that appears complete.

### 9. Handle stale responses when users change filters quickly

**Explanation:** A slow response for an old filter must not replace the results for a newer filter. Abort previous requests or associate each request with a sequence number.

**Semantic HTML example:**

```html
<section id="search-results" aria-busy="false">
  <h2>Results</h2>
  <p role="status" hidden>Loading results…</p>
  <div class="results-content"></div>
</section>
```

**Working CSS/JS example:**

```js
let requestSequence = 0;
async function search(query) {
  const sequence = ++requestSequence;
  setResultsLoading(true);
  try {
    const data = await fetchResults(query);
    if (sequence !== requestSequence) return;
    renderResults(data);
  } catch (error) {
    if (sequence !== requestSequence) return;
    renderResultsError(error);
  } finally {
    if (sequence === requestSequence) setResultsLoading(false);
  }
}
```

```js
// Prefer AbortController when the fetch layer supports cancellation.
```

**Naive vs. correct:** Naive: every response renders when it arrives. Correct: only the latest relevant request may update the current results.

**Gotcha:** An old request's `finally` block must not clear the loading state for a newer request; guard the state update with the same request identity check.

### 10. Keep existing content visible during refresh when useful

**Explanation:** A refresh is different from the initial load. If the existing data remains valid, keep it visible and add a small refresh indicator rather than replacing the entire panel with skeletons.

**Semantic HTML example:**

```html
<section id="revenue-panel" aria-busy="false">
  <h2>Revenue</h2>
  <p class="refresh-status" role="status" hidden>Refreshing revenue…</p>
  <p class="revenue-value">$42,500</p>
</section>
```

**Working CSS/JS example:**

```js
async function refreshRevenue() {
  const panel = document.querySelector("#revenue-panel");
  panel.setAttribute("aria-busy", "true");
  panel.querySelector(".refresh-status").hidden = false;
  try {
    const latest = await fetchRevenue();
    renderRevenue(latest);
  } catch {
    showInlineRefreshError("Revenue could not be refreshed. Showing the last loaded value.");
  } finally {
    panel.setAttribute("aria-busy", "false");
    panel.querySelector(".refresh-status").hidden = true;
  }
}
```

```css
.refresh-status { font-size: .875rem; color: #596579; }
```

**Naive vs. correct:** Naive: replace the panel with skeletons on every refresh. Correct: preserve usable stale data and indicate that a refresh is in progress.

**Gotcha:** If old data is potentially dangerous or misleading, such as account balances after a failed transaction, label its freshness or choose a stricter presentation.

### 11. Distinguish empty, error, and loading states

**Explanation:** These states need different content and recovery actions. An empty state says the request succeeded but returned no items; an error says the request did not complete successfully.

**Semantic HTML example:**

```html
<section aria-labelledby="orders-heading">
  <h2 id="orders-heading">Orders</h2>
  <div data-state="empty">
    <p>No orders yet.</p>
    <a href="/catalog">Browse products</a>
  </div>
</section>
```

**Working CSS/JS example:**

```js
function renderState(state, data) {
  if (state === "loading") return renderSkeleton();
  if (state === "error") return renderErrorWithRetry();
  if (state === "empty") return renderEmptyState();
  return renderItems(data);
}
```

```css
[data-state="empty"] { padding: 2rem; text-align: center; }
```

**Naive vs. correct:** Naive: show a skeleton forever when the result array is empty. Correct: transition explicitly to empty, error, or populated states.

**Gotcha:** A legitimate empty result can be a success; do not tell users to retry when there is nothing to retry.

### 12. Reuse design tokens and component primitives

**Explanation:** Shared skeleton primitives make loading states consistent across cards, lists, and detail pages. Keep shape variants specific enough to represent real geometry.

**Semantic HTML example:**

```html
<div class="skeleton-profile" aria-hidden="true">
  <span class="skeleton skeleton--circle"></span>
  <span class="skeleton skeleton--heading"></span>
  <span class="skeleton skeleton--body"></span>
</div>
```

**Working CSS/JS example:**

```css
:root {
  --skeleton-base: #e5e9f0;
  --skeleton-highlight: #f5f7fa;
  --skeleton-radius: .5rem;
}
.skeleton { background: var(--skeleton-base); border-radius: var(--skeleton-radius); }
.skeleton--circle { width: 3rem; aspect-ratio: 1; border-radius: 50%; }
.skeleton--heading { width: 55%; height: 1.2rem; }
.skeleton--body { width: 85%; height: .8rem; }
```

```js
function skeletonVariant(type) {
  return ["profile", "card", "table-row"].includes(type) ? type : "card";
}
```

**Naive vs. correct:** Naive: duplicate one-off gray boxes in every feature. Correct: compose a small set of tokens and geometry variants.

**Gotcha:** A shared primitive should not force every content shape into the same template; reusable tokens are good, but misleading geometry is not.

### 13. Avoid hydration and rendering mismatches

**Explanation:** In server-rendered applications, the initial HTML and client render should agree. Avoid generating random skeleton counts or browser-only state during server rendering when that changes markup on hydration.

**Semantic HTML example:**

```html
<section aria-busy="true" data-state="loading">
  <h2>Recent projects</h2>
  <ul aria-hidden="true">
    <li class="skeleton-card"></li>
    <li class="skeleton-card"></li>
    <li class="skeleton-card"></li>
  </ul>
</section>
```

**Working CSS/JS example:**

```js
const INITIAL_SKELETON_COUNT = 3;
function renderInitialSkeletons() {
  return Array.from({ length: INITIAL_SKELETON_COUNT }, () => createSkeletonCard());
}
```

```css
[data-state="loading"] { min-height: 18rem; }
```

**Naive vs. correct:** Naive: use random client-only values to determine the initial number of skeleton nodes. Correct: keep initial markup deterministic and transition after hydration.

**Gotcha:** Framework-specific suspense and hydration behavior differs; follow the framework's supported data-fetching and streaming model instead of forcing a second loading layer over it.

### 14. Integrate loading, success, empty, and error in a complete component

**Explanation:** A production skeleton is only one state in a component lifecycle. The component should replace it with the appropriate content and recover cleanly from failures.

**Semantic HTML example:**

```html
<section id="project-panel" aria-labelledby="projects-title" aria-busy="true">
  <h2 id="projects-title">Projects</h2>
  <p id="projects-status" role="status">Loading projects…</p>
  <div id="projects-content" aria-hidden="true" class="project-skeletons"></div>
</section>
```

**Working CSS/JS example:**

```js
const panel = document.querySelector("#project-panel");
const status = document.querySelector("#projects-status");
const content = document.querySelector("#projects-content");

async function loadProjects() {
  panel.setAttribute("aria-busy", "true");
  status.hidden = false;
  status.textContent = "Loading projects…";
  content.setAttribute("aria-hidden", "true");
  content.replaceChildren(makeSkeletonCards(3));

  try {
    const projects = await fetchProjects();
    content.removeAttribute("aria-hidden");
    if (!projects.length) {
      content.replaceChildren(makeEmptyMessage("No projects yet."));
      status.textContent = "No projects found.";
    } else {
      content.replaceChildren(...projects.map(makeProjectCard));
      status.textContent = `${projects.length} projects loaded.`;
    }
  } catch {
    content.removeAttribute("aria-hidden");
    content.replaceChildren(makeRetryPanel(loadProjects));
    status.textContent = "Projects could not be loaded.";
  } finally {
    panel.setAttribute("aria-busy", "false");
  }
}
```

```css
.project-skeletons { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 42rem) { .project-skeletons { grid-template-columns: 1fr; } }
```

**Naive vs. correct:** Naive: remove the skeleton only on success. Correct: every request path transitions to success, empty, or error and clears the busy state.

**Gotcha:** This example uses helper functions to keep the lifecycle readable; ensure helpers return safe DOM nodes, and ensure the retry panel cannot start overlapping requests without cancellation or request identity guards.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Card grid skeleton

**What it does:** Reserves the shape and spacing of a card grid while data is loading.

**When to use it:** Project galleries, product listings, editorial cards, or dashboards where the final card geometry is predictable.

**Complete copy-pasteable code:**

```html
<section aria-labelledby="gallery-title" aria-busy="true">
  <h2 id="gallery-title">Projects</h2>
  <p role="status">Loading projects…</p>
  <ul class="gallery" aria-hidden="true">
    <li class="card-skeleton"><span></span><span></span><span></span></li>
    <li class="card-skeleton"><span></span><span></span><span></span></li>
    <li class="card-skeleton"><span></span><span></span><span></span></li>
  </ul>
</section>
<style>
.gallery { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; padding:0; list-style:none; }
.card-skeleton { display:grid; gap:.7rem; }
.card-skeleton span { display:block; height:.85rem; border-radius:.4rem; background:#e5e9f0; }
.card-skeleton span:first-child { aspect-ratio:16/9; height:auto; }
.card-skeleton span:last-child { width:55%; }
@media(max-width:48rem) { .gallery { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:32rem) { .gallery { grid-template-columns:1fr; } }
</style>
```

**Nuance / edge case:** The number of skeleton cards should be close to the likely visible result count without implying that the exact number of results is known.

### Pattern 2: Table row skeleton

**What it does:** Reserves column widths and row rhythm for a data table.

**When to use it:** Admin dashboards, transaction lists, and reports with stable column structure.

**Complete copy-pasteable code:**

```html
<table aria-label="Recent transactions" aria-busy="true">
  <thead><tr><th scope="col">Date</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col">Amount</th></tr></thead>
  <tbody aria-hidden="true">
    <tr><td><span class="skeleton"></span></td><td><span class="skeleton"></span></td><td><span class="skeleton short"></span></td><td><span class="skeleton"></span></td></tr>
    <tr><td><span class="skeleton"></span></td><td><span class="skeleton"></span></td><td><span class="skeleton short"></span></td><td><span class="skeleton"></span></td></tr>
  </tbody>
</table>
<style>
table { width:100%; border-collapse:collapse; }
th,td { padding:.8rem; text-align:start; border-bottom:1px solid #d8dee8; }
.skeleton { display:block; height:.8rem; width:85%; background:#e5e9f0; border-radius:.3rem; }
.skeleton.short { width:45%; }
</style>
```

**Nuance / edge case:** On narrow screens, use the same responsive overflow or column-hiding strategy as the real table. A skeleton table that overflows when the loaded table does not creates a misleading loading experience.

### Pattern 3: Profile panel skeleton

**What it does:** Reserves the avatar, name, supporting details, and actions area of a profile panel.

**When to use it:** User profiles, account pages, team members, and detail panels with stable content structure.

**Complete copy-pasteable code:**

```html
<section class="profile" aria-busy="true" aria-labelledby="profile-title">
  <h2 id="profile-title">Profile</h2>
  <p role="status">Loading profile…</p>
  <div class="profile-skeleton" aria-hidden="true">
    <span class="avatar"></span>
    <div><span class="line line-wide"></span><span class="line"></span><span class="line line-short"></span></div>
  </div>
</section>
<style>
.profile-skeleton { display:flex; align-items:center; gap:1rem; }
.avatar { width:4rem; aspect-ratio:1; border-radius:50%; background:#e5e9f0; flex:none; }
.line { display:block; width:12rem; max-width:70vw; height:.8rem; margin:.55rem 0; border-radius:.3rem; background:#e5e9f0; }
.line-wide { width:17rem; }
.line-short { width:8rem; }
</style>
```

**Nuance / edge case:** Real profile names can wrap or include long internationalized text; ensure the loaded component can grow without overlapping actions.

### Pattern 4: Delayed skeleton for fast requests

**What it does:** Prevents a flash of placeholder UI when data is likely to arrive almost immediately.

**When to use it:** Fast local requests or cached data paths where a loading flash is more distracting than useful.

**Complete copy-pasteable code:**

```js
async function loadWithDelayedSkeleton({ request, showSkeleton, hideSkeleton, render }) {
  let visible = false;
  const timer = setTimeout(() => {
    visible = true;
    showSkeleton();
  }, 160);
  try {
    const data = await request();
    render(data);
  } finally {
    clearTimeout(timer);
    if (visible) hideSkeleton();
  }
}
```

```html
<section id="content" aria-busy="false">
  <p id="loading-status" role="status" hidden>Loading content…</p>
  <div id="content-body"></div>
</section>
```

**Nuance / edge case:** Render the response immediately even if the skeleton has just appeared. Do not add an artificial minimum display delay that holds back useful data solely to make the animation look smooth.

### Pattern 5: Stale-while-revalidate indicator

**What it does:** Keeps usable content visible during refresh and shows a small indication that newer data is being requested.

**When to use it:** Dashboards and list views where old data is still useful and a full skeleton replacement would be disruptive.

**Complete copy-pasteable code:**

```html
<section id="summary" aria-busy="false">
  <h2>Monthly summary</h2>
  <p id="refreshing" role="status" hidden>Refreshing summary…</p>
  <div id="summary-data">Last loaded summary appears here.</div>
</section>
<script>
async function refreshSummary() {
  const region = document.querySelector("#summary");
  const status = document.querySelector("#refreshing");
  region.setAttribute("aria-busy", "true");
  status.hidden = false;
  try {
    const data = await fetchSummary();
    renderSummary(data);
  } catch {
    showInlineMessage("Refresh failed. Showing the last loaded summary.");
  } finally {
    status.hidden = true;
    region.setAttribute("aria-busy", "false");
  }
}
</script>
```

**Nuance / edge case:** If stale information can cause a high-impact decision, display a timestamp or stale label and consider blocking the action that depends on fresh data.

### Pattern 6: Abortable search skeleton

**What it does:** Cancels obsolete requests and prevents an earlier query from replacing newer results.

**When to use it:** Search fields, filter panels, autocomplete, and rapidly changing sort controls.

**Complete copy-pasteable code:**

```js
let controller;
async function runSearch(query) {
  controller?.abort();
  controller = new AbortController();
  const current = controller;
  setSearchLoading(true);
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: current.signal });
    if (!response.ok) throw new Error("Search failed");
    const data = await response.json();
    if (current !== controller) return;
    renderSearchResults(data);
  } catch (error) {
    if (error.name !== "AbortError" && current === controller) renderSearchError();
  } finally {
    if (current === controller) setSearchLoading(false);
  }
}
```

```html
<section id="search-panel" aria-busy="false">
  <label for="query">Search projects</label>
  <input id="query" type="search">
  <p role="status" id="search-status" hidden>Searching…</p>
  <div id="search-results"></div>
</section>
```

**Nuance / edge case:** Aborting the browser request does not guarantee that server-side work was cancelled. Keep server operations safe and guard UI state using request identity.

### Pattern 7: Loading-to-error recovery

**What it does:** Ensures a failed request transitions out of the skeleton state and offers a useful recovery action.

**When to use it:** Any data panel that can fail due to network, permission, or server errors.

**Complete copy-pasteable code:**

```html
<section id="report" aria-busy="true">
  <h2>Report</h2>
  <p id="report-status" role="status">Loading report…</p>
  <div id="report-content" aria-hidden="true"></div>
</section>
<script>
async function loadReport() {
  const panel = document.querySelector("#report");
  const status = document.querySelector("#report-status");
  const content = document.querySelector("#report-content");
  panel.setAttribute("aria-busy", "true");
  status.textContent = "Loading report…";
  content.setAttribute("aria-hidden", "true");
  content.replaceChildren(makeReportSkeleton());
  try {
    const report = await fetchReport();
    content.replaceChildren(renderReport(report));
    content.removeAttribute("aria-hidden");
    status.textContent = report.items.length ? "Report loaded." : "No report data available.";
  } catch {
    content.replaceChildren(makeRetryButton(loadReport));
    content.removeAttribute("aria-hidden");
    status.textContent = "Report could not be loaded.";
  } finally {
    panel.setAttribute("aria-busy", "false");
  }
}
</script>
```

**Nuance / edge case:** Prevent repeated clicks from starting unbounded overlapping requests; disable or guard Retry while the request is active, and ensure the retry control itself is keyboard accessible.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Using a skeleton for every wait | Skeletons are mistaken for a universally superior spinner. | Match the pattern to the task; use a simple status indicator when the future geometry is unknown. |
| Rendering skeletons for an empty result | Loading is inferred from a missing array. | Model loading, success, empty, error, and cancellation as distinct states. |
| Replacing existing content on every refresh | Initial load and refresh are treated as identical. | Preserve useful stale content and show a subtle refresh status when appropriate. |
| Making placeholders much shorter than loaded content | Skeleton dimensions are guessed separately from the final component. | Reuse layout primitives, aspect ratios, spacing, and responsive breakpoints. |
| Exposing every skeleton bar to screen readers | Decorative shapes are treated as meaningful elements. | Hide placeholder shapes and provide one concise loading status. |
| Setting `aria-busy` on the whole page for one widget | The state is applied at the wrong scope. | Mark only the region being updated and clear it on every terminal path. |
| Showing a skeleton for extremely fast requests | Loading state is rendered synchronously for every request. | Consider a measured delay before showing the skeleton. |
| Adding a minimum display time that delays real data | Animation polish is prioritized over actual content. | Allow loaded content to appear immediately; prevent entry flicker instead of withholding results. |
| Animating every placeholder aggressively | Motion is used to make the screen look active. | Use restrained shimmer or static shapes and respect reduced-motion preferences. |
| Forgetting the error path | Only successful requests are considered. | Transition to an error state with a useful retry or recovery action. |
| Letting an old response overwrite new filter results | Requests race and all responses are rendered. | Abort obsolete requests or guard rendering with a sequence/request identity. |
| Letting an old `finally` clear a newer loading state | Cleanup runs without request ownership checks. | Only the current request may clear the current loading state. |
| Using random skeleton counts during hydration | Client-only randomness changes initial markup. | Keep initial server and client markup deterministic. |
| Letting images cause layout shift | Media dimensions are not reserved. | Set width/height or use an aspect-ratio container before image load. |
| Using fake disabled controls as placeholders | The skeleton is built by disabling real controls. | Render decorative non-interactive shapes outside the tab order. |
| Reusing one generic skeleton for every content type | Reuse is optimized at the expense of fidelity. | Provide small geometry variants for cards, tables, profiles, and media. |
| Failing to account for dark mode | Placeholder colors are hard-coded for one theme. | Use theme tokens and verify contrast in supported themes. |
| Treating `aria-busy` as the only loading feedback | Busy semantics are mistaken for visible progress. | Add a visible and accessible status where waiting needs explanation. |
| Leaving the region busy after an exception | Only the success branch clears state. | Use `finally` or a state reducer that guarantees terminal transitions. |
| Hiding loaded content from assistive technology | `aria-hidden` remains after replacement. | Remove the attribute on every success and error path where content should be available. |

### Before/after: distinguish loading from empty

**Before — an empty array creates endless skeletons:**

```js
if (!items.length) renderSkeletons();
```

**After — status controls presentation:**

```js
if (state.status === "loading") renderSkeletons();
else if (state.status === "empty") renderEmptyState();
else if (state.status === "error") renderError();
else renderItems(state.data);
```

### Before/after: prevent stale results

**Before — every response updates the page:**

```js
async function search(query) {
  const data = await fetchResults(query);
  renderResults(data);
}
```

**After — only the current request can render:**

```js
let latestRequest = 0;
async function search(query) {
  const requestId = ++latestRequest;
  const data = await fetchResults(query);
  if (requestId !== latestRequest) return;
  renderResults(data);
}
```

---

## Mental Models

1. **A skeleton is a shape contract:** It promises the user roughly where the real content will appear; keep the geometry honest.
2. **Loading is a state, not a decoration:** The request lifecycle determines whether to show skeleton, content, empty state, or error.
3. **A refresh is not a first load:** If current data remains useful, preserve it and communicate freshness instead of blanking the screen.
4. **Accessibility needs one meaningful signal:** Hide decorative bars and announce the actual loading status without flooding the live region.
5. **Motion is optional information:** The placeholder must still make sense when animation is disabled.
6. **The newest request owns the screen:** Older responses and cleanup handlers must not overwrite newer intent.
7. **Reserve space before media arrives:** Layout stability starts before the browser receives the image.
8. **A failed request must leave loading:** Every path must transition to a meaningful terminal state.
9. **Reusable does not mean identical:** Share tokens and layout primitives while matching the geometry of each component.
10. **Do not make the placeholder more important than the content:** Never delay real data solely to complete a loading animation.

---

## Quick Reference

| Situation | Recommended approach | Verify |
|---|---|---|
| Predictable card grid | Match card geometry and responsive columns | Loaded content causes minimal layout shift |
| Unknown future layout | Use a simple status or progress indicator | Skeleton does not invent misleading structure |
| Initial request | Skeleton plus concise loading status | Busy state is cleared on success and error |
| Empty result | Explicit empty state | No skeleton remains visible |
| Failed request | Error state with recovery action | User can retry or understand next steps |
| Refresh with useful old data | Keep data visible with refresh indicator | Freshness is communicated where relevant |
| Screen-reader support | Hide decorative skeleton and announce status | No repeated placeholder announcements |
| Fast request | Delay showing skeleton briefly | Loaded content is not artificially delayed |
| Reduced motion | Static placeholder or restrained animation | Content remains understandable without motion |
| Image placeholder | Set aspect ratio or dimensions | No major image-induced layout shift |
| Rapid filter changes | Abort or identify stale requests | Old responses cannot overwrite current results |
| Server rendering | Deterministic initial skeleton markup | No hydration mismatch or random node count |
| Interactive controls | Keep placeholders out of tab order | No fake button appears actionable |
| Shared component library | Reuse tokens and shape variants | Variants reflect actual content geometry |
| Narrow viewport | Apply same responsive rules as loaded UI | No horizontal overflow or sudden height change |
| Dark theme | Use theme-aware skeleton tokens | Placeholder is visible without excessive contrast |
| Busy region | Scope `aria-busy` to updating content | Busy state resets in every terminal path |
| Loading duration | Measure actual request behavior | No flicker or needless delay of results |

---

## Build Challenge

Build a reusable skeleton-loading system for a project dashboard. The dashboard includes a project-card grid, a transaction table, a profile summary, and a searchable activity list. Requests may be fast, slow, cancelled, empty, or failed.

### Requirements

1. Create shared skeleton primitives for text lines, circles, media, cards, and table cells.
2. Create component-specific skeleton layouts for cards, tables, profiles, and activity rows.
3. Match each skeleton's grid, spacing, and media aspect ratio to the loaded component.
4. Model idle, loading, success, empty, error, and cancelled states explicitly.
5. Add a concise loading status and scope `aria-busy` to the updating region.
6. Hide decorative placeholder shapes from assistive technology.
7. Avoid exposing fake buttons, links, or form controls in the tab order.
8. Delay skeleton appearance for fast requests using a measured threshold.
9. Never delay successful content merely to satisfy a minimum animation duration.
10. Support reduced-motion preferences and a static placeholder mode.
11. Reserve media dimensions before image content loads.
12. Keep existing data visible during refresh when stale data remains useful.
13. Cancel or ignore obsolete search/filter requests.
14. Ensure an obsolete request cannot clear the loading state for a newer request.
15. Provide separate empty and error states with appropriate wording.
16. Provide a retry action that can be activated by keyboard and is guarded against overlapping requests.
17. Make the system work in narrow viewports and at 200% zoom.
18. Use design tokens for placeholder color, radius, spacing, and motion.
19. Ensure initial server and client markup is deterministic if server rendering is used.
20. Clean up timers, listeners, and abort controllers when the component is destroyed.
21. Test loading and loaded states for layout shift and unexpected content jumps.
22. Document when a skeleton is not appropriate and a status indicator is better.
23. Add automated tests for state transitions, cancellation, and stale-response protection.
24. Add manual accessibility checks for screen-reader announcement and reduced motion.
25. Verify that loading states never block access to unrelated page navigation or controls.

### Failure scenarios to inject

- Resolve a request in less than 100 ms and verify a skeleton flash is avoided.
- Delay a request for several seconds and verify the loading status is announced appropriately.
- Return an empty list and verify the empty state replaces the skeleton.
- Reject a request and verify the region is no longer busy and a recovery action is shown.
- Change a filter twice quickly and return the first response last; verify stale data is ignored.
- Start a second request before the first request's `finally` handler runs; verify the newer busy state remains active.
- Load an image with delayed dimensions and verify the reserved media box prevents layout shift.
- Enable reduced motion and verify all loading animation is removed or restrained.
- Render the page at a narrow width with long titles and verify no horizontal overflow.
- Simulate component unmount while a request and timer are active; verify cleanup prevents stale updates.
- Run the component with an empty dataset and verify no fake interactive controls are exposed.
- Test the page with a screen reader and verify placeholder shapes are not announced individually.

### Definition of done

- [ ] Shared skeleton primitives are reusable but allow component-specific geometry.
- [ ] Loading, success, empty, error, and cancellation are distinct states.
- [ ] Decorative skeleton elements are hidden from assistive technology.
- [ ] The relevant region exposes a correct busy state during loading.
- [ ] Fast requests do not produce distracting placeholder flicker.
- [ ] Completed data is never delayed solely for animation polish.
- [ ] Skeleton geometry matches loaded layout at supported breakpoints.
- [ ] Images reserve their space before loading.
- [ ] Reduced-motion preferences are respected.
- [ ] Stale requests cannot overwrite newer results or clear newer loading state.
- [ ] Error and empty states replace skeletons reliably.
- [ ] Retry controls are functional, keyboard accessible, and protected against duplicate requests.
- [ ] Timers, listeners, and abort controllers are cleaned up.
- [ ] Automated tests cover success, empty, error, cancellation, and request races.
- [ ] Manual checks cover screen readers, keyboard navigation, zoom, mobile widths, and reduced motion.
- [ ] Product documentation explains when to use skeletons and when not to.

### Suggested test matrix

| Scenario | Action | Expected result |
|---|---|---|
| Fast success | Resolve before skeleton delay | Real content appears without a visible skeleton flash |
| Slow success | Resolve after delay | Skeleton and status appear, then are replaced |
| Empty success | Return no records | Explicit empty state appears |
| Request error | Reject the request | Error/retry UI appears and busy state clears |
| Request cancellation | Cancel a search | Cancelled request cannot update the current UI |
| Stale response | Resolve older query after newer query | Older result is ignored |
| Refresh | Refresh with existing data | Existing content remains available when appropriate |
| Image load | Delay media response | Reserved aspect ratio prevents major layout shift |
| Reduced motion | Enable OS reduced-motion setting | Skeleton remains static or minimally animated |
| Narrow viewport | Test mobile width and long content | No overflow or misleading fixed geometry |
| Component teardown | Unmount while loading | Timers and callbacks are cleaned up |
| Screen reader | Navigate through loading state | One meaningful status is announced, not every skeleton shape |
