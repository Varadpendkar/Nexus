# SKILL: data-table-patterns

**Layer:** 15 — UI Components

**Goal:** Build data tables that remain understandable, accessible, responsive, and performant as datasets, columns, user preferences, and interaction requirements grow.

---

## Why This Matters (Senior Perspective)

A data table is not simply a grid of text. It is a structured comparison tool, and users rely on its relationships: which value belongs to which column, which row represents a particular record, how sorting changes order, and how selection affects bulk actions. A table can look polished and still fail when a header is not associated with its cells, a sort indicator is visual only, a row click conflicts with an embedded link, or a narrow viewport makes important data impossible to reach. Senior table work starts with the data task: what users need to compare, identify, sort, filter, select, edit, or export. The HTML structure and interaction model follow from those needs.

Use native table semantics when the information is genuinely tabular. `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` communicate relationships that a collection of styled `div` elements does not. Set `scope="col"` for column headers and `scope="row"` for row headers where appropriate. More complex multi-level headers may need explicit `id` and `headers` associations. Do not add `role="grid"` merely because cells have hover styles or sortable columns. A grid is a richer keyboard interaction pattern, usually with managed focus and arrow-key navigation; if you do not implement that contract, retain native table behavior.

The data model and rendered table must agree. Sorting should operate on typed values, not on formatted strings. Sorting `"100"` and `"20"` lexicographically gives the wrong numerical order. Dates should be compared as timestamps or normalized date values; localized display strings are for people, not for the sort algorithm. Null values, equal values, and mixed data types need deliberate behavior. A stable sort keeps the original relative order of records with equal keys, which prevents rows from seeming to jump unpredictably. Sorting should update both the displayed order and the accessible description of the active sort.

Responsive tables require a decision rather than a universal CSS trick. If comparing columns is the core task, a horizontally scrollable table may be the most honest design. If only a subset of fields matters on mobile, provide a deliberate compact view or a card representation that preserves labels and actions. Avoid hiding a column without a way to discover its value. A sticky header can help with long datasets, but it must not cover focused controls or collide with sticky columns. At high zoom, the table should still provide a workable path to every essential value.

Selection and bulk actions need precise semantics. A row checkbox should have a name that identifies its record. A “select all” checkbox often means all visible rows, not every record in the database; label that scope clearly. When pagination or server-side filtering is involved, the application must distinguish selected visible IDs from a global selection token. A bulk delete action should not accidentally apply to hidden records because the UI's selection model was vague. Keep row actions as real links or buttons and do not make an entire row clickable in a way that swallows them.

Large tables introduce performance and state problems. Sorting and filtering thousands of records on every keystroke can block the main thread. Rendering tens of thousands of DOM rows can make scrolling and accessibility navigation painful. Use server-side operations, debouncing, pagination, or virtualization based on dataset size and interaction needs. Virtualization reduces DOM nodes but complicates screen-reader navigation, browser find, row counts, and focus retention. It is not a free optimization; validate it with actual data and accessibility requirements. Preserve table state in a way users expect: a sort change may reset pagination, a filter should update the result count, and an edit should not silently disappear because a stale query response replaced the current dataset.

Loading, empty, error, and partial states are part of table design. A loading skeleton should preserve the table's column geometry. An empty state should say whether no records exist or the current filters matched none. An error state should offer a retry or explain the unavailable data. If a cell is being updated, show that local state without making the entire table appear unavailable. For editable tables, define validation, optimistic update rollback, keyboard operation, and what happens when the server rejects a change. A table is reliable when users can trust the data relationships, understand the current view, and complete the task without surprise—not merely when it fits a screenshot.

---

## Core Concepts

### 1. Use native table semantics for tabular information

**Explanation:** Native table markup communicates row and column relationships to browsers and assistive technologies. Do not substitute generic containers unless the information is not truly tabular.

**Semantic HTML example:**

```html
<table>
  <caption>Recent project invoices</caption>
  <thead>
    <tr><th scope="col">Invoice</th><th scope="col">Client</th><th scope="col">Amount</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">INV-204</th><td>Northwind Studio</td><td>$1,250.00</td></tr>
  </tbody>
</table>
```

**Working CSS/JS example:**

```css
table { width: 100%; border-collapse: collapse; }
th, td { padding: .75rem 1rem; border-bottom: 1px solid #d7dde6; text-align: start; }
th { font-weight: 650; }
```

```js
const rows = [...document.querySelectorAll("tbody tr")];
console.log(`Rendered ${rows.length} invoice rows`);
```

**Naive vs. correct:** Naive: build the table from styled `div` elements without roles. Correct: use native table elements and add ARIA only where native semantics are insufficient.

**Gotcha:** Do not apply `role="grid"` unless you also implement the expected keyboard and focus model.

### 2. Associate headers with their cells

**Explanation:** Simple tables usually need `scope="col"` and, where a row identifies a record, `scope="row"`. Complex headers need explicit associations.

**Semantic HTML example:**

```html
<table>
  <caption>Quarterly sales</caption>
  <thead><tr><th scope="col">Region</th><th scope="col">Q1</th><th scope="col">Q2</th></tr></thead>
  <tbody><tr><th scope="row">West</th><td>$42,000</td><td>$48,000</td></tr></tbody>
</table>
```

**Working CSS/JS example:**

```css
caption { text-align: start; font-weight: 700; margin-block-end: .75rem; }
th { text-align: start; }
```

```js
function createHeader(label) {
  const th = document.createElement("th");
  th.scope = "col";
  th.textContent = label;
  return th;
}
```

**Naive vs. correct:** Naive: rely on bold styling to indicate a header. Correct: use `<th>` with an appropriate scope and explicit associations for complex header structures.

**Gotcha:** When headers span multiple levels, `scope` alone may not fully express the relationships; use stable IDs and `headers` attributes where needed.

### 3. Sort typed values, not display strings

**Explanation:** Display formatting is for humans. Sorting should use the underlying numeric, date, or categorical value rather than the localized text shown in a cell.

**Semantic HTML example:**

```html
<table>
  <thead><tr><th scope="col" aria-sort="none"><button type="button">Amount</button></th></tr></thead>
  <tbody><tr><td data-sort-value="20">$20.00</td></tr><tr><td data-sort-value="100">$100.00</td></tr></tbody>
</table>
```

**Working CSS/JS example:**

```js
const invoices = [
  { id: "a", amount: 100, label: "$100.00" },
  { id: "b", amount: 20, label: "$20.00" }
];
const sorted = [...invoices].sort((a, b) => a.amount - b.amount);
```

```css
th button { font: inherit; background: none; border: 0; cursor: pointer; }
```

**Naive vs. correct:** Naive: sort currency strings alphabetically. Correct: sort numeric values and format them only when rendering.

**Gotcha:** `NaN`, null values, and mixed types can break comparator assumptions; normalize input data before sorting.

### 4. Implement stable sorting and clear sort state

**Explanation:** A stable sort preserves the previous relative order of records whose sort values are equal. Expose the active sort direction on the relevant header.

**Semantic HTML example:**

```html
<th scope="col" aria-sort="ascending">
  <button type="button">Customer name</button>
</th>
```

**Working CSS/JS example:**

```js
function stableSort(items, compare) {
  return items.map((item, index) => ({ item, index }))
    .sort((a, b) => compare(a.item, b.item) || a.index - b.index)
    .map(entry => entry.item);
}
```

```js
function ariaSort(direction) {
  return direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none";
}
```

**Naive vs. correct:** Naive: change the arrow icon but leave row order unchanged or leave stale `aria-sort`. Correct: update data order, visible indicator, and accessibility state together.

**Gotcha:** Put `aria-sort` on the active header cell, not on every sort button or every column.

### 5. Keep row identity stable

**Explanation:** Use a stable record ID for rendering, selection, editing, and focus restoration. Array positions are not identities because sorting and filtering change them.

**Semantic HTML example:**

```html
<tr data-row-id="invoice-204">
  <th scope="row">INV-204</th><td>Northwind Studio</td><td>$1,250.00</td>
</tr>
```

**Working CSS/JS example:**

```js
const selectedIds = new Set();
function toggleSelection(id) {
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
}
```

```css
tr[data-selected="true"] { background: #eef5ff; }
```

**Naive vs. correct:** Naive: store selection as row indexes such as `selected.add(2)`. Correct: store stable record IDs so selection survives sorting and pagination.

**Gotcha:** IDs must remain unique across the dataset; a page-local index is not a substitute for a database or domain identifier.

### 6. Define what “select all” means

**Explanation:** In a paginated table, “select all” may mean all rows on the current page, all filtered rows, or every matching record on the server. The UI must make that scope explicit.

**Semantic HTML example:**

```html
<label><input type="checkbox" id="select-visible"> Select all 25 rows on this page</label>
```

**Working CSS/JS example:**

```js
function setVisibleSelection(visibleIds, checked, selectedIds) {
  const next = new Set(selectedIds);
  for (const id of visibleIds) checked ? next.add(id) : next.delete(id);
  return next;
}
```

```css
.selection-toolbar { display: flex; align-items: center; gap: .75rem; }
```

**Naive vs. correct:** Naive: a header checkbox silently selects only the current page while its label says “Select all records.” Correct: name the scope and model page selection separately from server-wide selection.

**Gotcha:** A mixed state should use the checkbox's indeterminate property and be recalculated when visible rows or selected IDs change.

### 7. Use a deliberate responsive strategy

**Explanation:** Tables need all essential values to remain discoverable on small screens. Horizontal scrolling, column prioritization, and card transformation are different product choices.

**Semantic HTML example:**

```html
<div class="table-scroll" tabindex="0" role="region" aria-label="Invoices table, horizontally scrollable">
  <table>
    <caption>Invoices</caption>
    <thead><tr><th scope="col">Invoice</th><th scope="col">Client</th><th scope="col">Due date</th><th scope="col">Amount</th></tr></thead>
    <tbody><tr><th scope="row">INV-204</th><td>Northwind Studio</td><td>18 Oct 2026</td><td>$1,250.00</td></tr></tbody>
  </table>
</div>
```

**Working CSS/JS example:**

```css
.table-scroll { max-width: 100%; overflow-x: auto; }
.table-scroll:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
table { min-width: 42rem; }
```

```js
const needsScroll = tableWrapper.scrollWidth > tableWrapper.clientWidth;
tableWrapper.dataset.scrollable = String(needsScroll);
```

**Naive vs. correct:** Naive: shrink every column until text becomes unreadable. Correct: choose an explicit mobile strategy and keep all essential data accessible.

**Gotcha:** A scrollable wrapper needs a discoverable focus path for keyboard users and must not create nested horizontal scrolling unnecessarily.

### 8. Add sticky headers without hiding content

**Explanation:** Sticky headers help users understand columns in long tables, but they can cover focused controls or interact poorly with sticky columns and overflow ancestors.

**Semantic HTML example:**

```html
<div class="table-scroll">
  <table class="sticky-table">
    <thead><tr><th scope="col">Date</th><th scope="col">Status</th><th scope="col">Amount</th></tr></thead>
    <tbody><tr><td>18 Oct</td><td>Paid</td><td>$250</td></tr></tbody>
  </table>
</div>
```

**Working CSS/JS example:**

```css
.table-scroll { max-height: 28rem; overflow: auto; }
.sticky-table thead th { position: sticky; top: 0; z-index: 2; background: #fff; }
.sticky-table th, .sticky-table td { padding: .8rem; }
```

```js
// If a fixed app header exists, account for its height in the table scroll container.
```

**Naive vs. correct:** Naive: apply `position: sticky` without checking the overflow ancestor. Correct: define the scroll container, background, stacking order, and focus visibility together.

**Gotcha:** Sticky behavior is constrained by ancestor overflow and containing blocks; verify the actual scrolling element in the target layout.

### 9. Filter with explicit state and debouncing where needed

**Explanation:** Filters should update the visible rows and result count. For expensive client-side filtering or server requests, debounce text input while allowing immediate changes for small local datasets.

**Semantic HTML example:**

```html
<label for="customer-filter">Filter customers</label>
<input id="customer-filter" type="search" autocomplete="off">
<p id="result-count" role="status">Showing all customers</p>
```

**Working CSS/JS example:**

```js
let filterTimer;
filterInput.addEventListener("input", () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => applyFilter(filterInput.value.trim()), 180);
});
```

```js
function filterRows(rows, query) {
  const normalized = query.toLocaleLowerCase();
  return rows.filter(row => row.customer.toLocaleLowerCase().includes(normalized));
}
```

**Naive vs. correct:** Naive: run a large server query on every keystroke with no request coordination. Correct: debounce where beneficial and guard against stale responses.

**Gotcha:** Debouncing must not make keyboard interaction feel laggy; use a measured delay and announce result counts without flooding the live region.

### 10. Paginate with clear state transitions

**Explanation:** Pagination changes the visible slice and should preserve the sort/filter context. When a filter reduces the result count, clamp or reset the current page to a valid page.

**Semantic HTML example:**

```html
<nav aria-label="Table pagination">
  <button type="button" id="previous-page">Previous</button>
  <span id="page-status">Page 1 of 4</span>
  <button type="button" id="next-page">Next</button>
</nav>
```

**Working CSS/JS example:**

```js
function getPage(items, page, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return { page: safePage, pageCount, items: items.slice((safePage - 1) * pageSize, safePage * pageSize) };
}
```

```css
nav[aria-label="Table pagination"] { display: flex; gap: .75rem; align-items: center; }
```

**Naive vs. correct:** Naive: remain on page 8 after filtering the result down to one page. Correct: recalculate page count and move to a valid page.

**Gotcha:** Server-side pagination needs total-count semantics and request identity; do not imply that the visible page contains every matching record.

### 11. Use virtualization only when it solves a measured problem

**Explanation:** Virtualization reduces the number of rendered rows, but it complicates screen-reader navigation, row count, browser find, and focus retention. It is not the default for every table.

**Semantic HTML example:**

```html
<div class="virtual-table-viewport" aria-label="Large results table">
  <table>
    <caption>Large results</caption>
    <thead><tr><th scope="col">ID</th><th scope="col">Name</th></tr></thead>
    <tbody id="visible-rows"></tbody>
  </table>
</div>
```

**Working CSS/JS example:**

```js
const ROW_HEIGHT = 40;
function visibleRange(scrollTop, viewportHeight, totalRows, overscan = 5) {
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const end = Math.min(totalRows, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + overscan);
  return { start, end, topSpacer: start * ROW_HEIGHT, bottomSpacer: (totalRows - end) * ROW_HEIGHT };
}
```

```css
.virtual-table-viewport { overflow: auto; max-height: 32rem; }
```

**Naive vs. correct:** Naive: virtualize immediately because the dataset is “large.” Correct: profile first and verify keyboard and assistive-technology requirements before choosing virtualization.

**Gotcha:** Spacer rows and ARIA row counts must match the virtualized structure; an incomplete implementation can make the table appear to contain only the currently rendered rows.

### 12. Make inline editing robust

**Explanation:** Editable cells need clear entry, validation, save, cancel, and error behavior. Preserve the original value until the update is accepted or make rollback explicit.

**Semantic HTML example:**

```html
<td>
  <label class="visually-hidden" for="budget-204">Budget for INV-204</label>
  <input id="budget-204" type="number" min="0" step="0.01" value="1250.00">
</td>
```

**Working CSS/JS example:**

```js
async function saveCell(input, originalValue, persist) {
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) {
    input.setCustomValidity("Enter a non-negative amount.");
    input.reportValidity();
    return false;
  }
  input.setCustomValidity("");
  try {
    await persist(value);
    input.dataset.savedValue = String(value);
    return true;
  } catch {
    input.value = originalValue;
    showInlineError("The value could not be saved.");
    return false;
  }
}
```

```css
input[aria-invalid="true"] { border-color: #b42318; }
```

**Naive vs. correct:** Naive: update the cell visually and never roll back if the server rejects it. Correct: define optimistic-update behavior and restore or reconcile the original value on failure.

**Gotcha:** Inline editing must not depend on a mouse-only double-click; provide an obvious keyboard-accessible way to enter edit mode and a clear Escape/Enter policy.

### 13. Support loading, empty, and error table states

**Explanation:** The table should communicate whether data is loading, unavailable, or genuinely absent. Keep the column structure stable when possible.

**Semantic HTML example:**

```html
<table aria-busy="true">
  <caption>Recent payments</caption>
  <thead><tr><th scope="col">Date</th><th scope="col">Customer</th><th scope="col">Amount</th></tr></thead>
  <tbody><tr><td colspan="3"><p role="status">Loading payments…</p></td></tr></tbody>
</table>
```

**Working CSS/JS example:**

```js
function renderTableState(tbody, state, columnCount) {
  tbody.replaceChildren();
  if (state === "loading") tbody.append(makeStateRow(columnCount, "Loading…"));
  else if (state === "empty") tbody.append(makeStateRow(columnCount, "No matching records."));
  else if (state === "error") tbody.append(makeRetryRow(columnCount));
}
```

```css
td[colspan] { padding: 2rem 1rem; text-align: center; }
```

**Naive vs. correct:** Naive: show an empty table on network failure. Correct: distinguish loading, no results, and failure with a meaningful recovery path.

**Gotcha:** If an error occurs during filtering, preserve the user's query and explain whether the displayed rows are stale or unavailable.

### 14. Integrate sorting, filtering, selection, and pagination

**Explanation:** These interactions must compose instead of overwriting each other's state. Derive visible rows from canonical data plus sort/filter/page state, and store selection by record ID.

**Semantic HTML example:**

```html
<section aria-labelledby="invoice-heading">
  <h2 id="invoice-heading">Invoices</h2>
  <label for="invoice-search">Search invoices</label>
  <input id="invoice-search" type="search">
  <table>
    <caption>Invoice results</caption>
    <thead><tr><th scope="col">Invoice</th><th scope="col">Client</th><th scope="col">Amount</th></tr></thead>
    <tbody id="invoice-rows"></tbody>
  </table>
</section>
```

**Working CSS/JS example:**

```js
function deriveRows({ data, query, sortKey, direction, page, pageSize }) {
  const filtered = data.filter(row =>
    `${row.invoice} ${row.client}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );
  const sorted = [...filtered].sort((a, b) => {
    const result = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
    return direction === "asc" ? result : -result;
  });
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  return { rows: sorted.slice((safePage - 1) * pageSize, safePage * pageSize), total: sorted.length, page: safePage, pageCount };
}
```

```css
table { width: 100%; border-collapse: collapse; }
```

**Naive vs. correct:** Naive: each control independently mutates the DOM and loses other state. Correct: derive the rendered view from one canonical state model.

**Gotcha:** This simplified comparator assumes comparable values; production code needs typed comparators, null handling, stable ordering, and server-side equivalents for large datasets.

---

## Relevant Patterns / Integration Patterns / Advanced Patterns

### Pattern 1: Native sortable table

**What it does:** Sorts one column while keeping semantic table structure and exposing the active direction.

**When to use it:** Small and medium client-side datasets with a limited set of sortable columns.

**Complete copy-pasteable code:**

```html
<table id="orders-table">
  <caption>Orders</caption>
  <thead><tr>
    <th scope="col" data-key="customer" aria-sort="none"><button type="button">Customer</button></th>
    <th scope="col" data-key="amount" aria-sort="none"><button type="button">Amount</button></th>
  </tr></thead>
  <tbody></tbody>
</table>
<script>
const data = [{customer:"Mira",amount:220},{customer:"Ari",amount:95},{customer:"Noah",amount:140}];
let activeKey = "customer", direction = "asc";
const table = document.querySelector("#orders-table");
function render() {
  const sorted = [...data].sort((a,b) => {
    const x = a[activeKey], y = b[activeKey];
    const result = typeof x === "number" ? x-y : String(x).localeCompare(String(y));
    return direction === "asc" ? result : -result;
  });
  table.tBodies[0].replaceChildren(...sorted.map(row => {
    const tr = document.createElement("tr");
    for (const value of [row.customer, `$${row.amount}`]) {
      const td = document.createElement("td"); td.textContent = value; tr.append(td);
    }
    return tr;
  }));
  table.querySelectorAll("thead th").forEach(th => th.setAttribute("aria-sort",
    th.dataset.key !== activeKey ? "none" : direction === "asc" ? "ascending" : "descending"));
}
table.querySelectorAll("thead button").forEach(button => button.addEventListener("click", () => {
  const key = button.closest("th").dataset.key;
  if (key === activeKey) direction = direction === "asc" ? "desc" : "asc";
  else { activeKey = key; direction = "asc"; }
  render();
}));
render();
</script>
```

**Nuance / edge case:** The example is intentionally small. Production sorting should use typed comparators, stable ties, null handling, and server-side sorting when the dataset is too large for responsive client-side work.

### Pattern 2: Select visible rows by stable ID

**What it does:** Keeps selection attached to records instead of their current row positions.

**When to use it:** Bulk operations, paginated tables, and tables where sorting or filtering can change row order.

**Complete copy-pasteable code:**

```html
<label><input type="checkbox" id="select-visible"> Select all visible rows</label>
<table><thead><tr><th scope="col">Select</th><th scope="col">Name</th></tr></thead><tbody id="people"></tbody></table>
<p id="selection-count" role="status">0 selected</p>
<script>
const people = [{id:"u-11",name:"Ari"},{id:"u-12",name:"Mira"}];
const selected = new Set();
const body = document.querySelector("#people");
function renderPeople() {
  body.replaceChildren(...people.map(person => {
    const tr = document.createElement("tr");
    const checkboxCell = document.createElement("td");
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox"; checkbox.checked = selected.has(person.id);
    checkbox.setAttribute("aria-label", `Select ${person.name}`);
    checkbox.addEventListener("change", () => {
      checkbox.checked ? selected.add(person.id) : selected.delete(person.id);
      updateSelection();
    });
    label.append(checkbox); checkboxCell.append(label);
    const name = document.createElement("th"); name.scope = "row"; name.textContent = person.name;
    tr.append(checkboxCell, name); return tr;
  }));
  updateSelection();
}
function updateSelection() {
  document.querySelector("#selection-count").textContent = `${selected.size} selected`;
  const all = people.length > 0 && people.every(person => selected.has(person.id));
  const some = people.some(person => selected.has(person.id));
  const master = document.querySelector("#select-visible");
  master.checked = all; master.indeterminate = some && !all;
}
document.querySelector("#select-visible").addEventListener("change", event => {
  for (const person of people) event.target.checked ? selected.add(person.id) : selected.delete(person.id);
  renderPeople();
});
renderPeople();
</script>
```

**Nuance / edge case:** This sample's master checkbox applies to all records in the local `people` array. In a paginated or server-filtered table, use only visible IDs and label the selection scope explicitly.

### Pattern 3: Accessible horizontal scrolling

**What it does:** Keeps all columns available when they cannot fit without sacrificing legibility.

**When to use it:** Financial, operational, or comparison tables where users need to inspect multiple columns on small screens.

**Complete copy-pasteable code:**

```html
<div class="table-scroll" role="region" aria-label="Invoices table; scroll horizontally" tabindex="0">
  <table>
    <caption>Invoices</caption>
    <thead><tr><th scope="col">Invoice</th><th scope="col">Client</th><th scope="col">Due date</th><th scope="col">Amount</th></tr></thead>
    <tbody><tr><th scope="row">INV-204</th><td>Northwind Studio</td><td>18 Oct 2026</td><td>$1,250.00</td></tr></tbody>
  </table>
</div>
<style>
.table-scroll { max-width:100%; overflow:auto; }
.table-scroll:focus-visible { outline:3px solid #2563eb; outline-offset:2px; }
.table-scroll table { min-width:42rem; width:100%; border-collapse:collapse; }
.table-scroll th,.table-scroll td { padding:.75rem 1rem; border-bottom:1px solid #d9dee8; white-space:nowrap; }
</style>
```

**Nuance / edge case:** Keep the table wrapper's label concise and avoid nested scroll containers. Test keyboard scrolling and visible focus at high zoom.

### Pattern 4: Filter with a debounced input

**What it does:** Filters a local dataset without running expensive work on every keystroke.

**When to use it:** Moderate client-side tables where filtering can be completed quickly but repeated keystroke work is measurable.

**Complete copy-pasteable code:**

```html
<label for="filter">Filter customers</label>
<input id="filter" type="search">
<p id="count" role="status"></p>
<table><thead><tr><th scope="col">Customer</th><th scope="col">City</th></tr></thead><tbody id="rows"></tbody></table>
<script>
const data = [{name:"Mira",city:"Pune"},{name:"Ari",city:"Mumbai"},{name:"Noah",city:"Pune"}];
const input = document.querySelector("#filter"), body = document.querySelector("#rows");
let timer;
function render(query) {
  const q = query.toLocaleLowerCase();
  const filtered = data.filter(item => `${item.name} ${item.city}`.toLocaleLowerCase().includes(q));
  body.replaceChildren(...filtered.map(item => {
    const tr = document.createElement("tr");
    for (const value of [item.name,item.city]) { const td=document.createElement("td"); td.textContent=value; tr.append(td); }
    return tr;
  }));
  document.querySelector("#count").textContent = `${filtered.length} results`;
}
input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => render(input.value.trim()), 150); });
render("");
</script>
```

**Nuance / edge case:** A short debounce may help expensive filtering, but don't add delay by habit to a tiny local dataset. For server searches, also guard against out-of-order responses.

### Pattern 5: Pagination that stays within valid bounds

**What it does:** Keeps the current page valid when filters or data changes alter the number of pages.

**When to use it:** Client-side pagination or as the UI layer around a server-side pagination API.

**Complete copy-pasteable code:**

```js
function paginate(items, requestedPage, pageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);
  return { page, pageCount, rows: items.slice((page - 1) * pageSize, page * pageSize) };
}
function onFilterChanged(filteredRows) {
  const result = paginate(filteredRows, currentPage, pageSize);
  currentPage = result.page;
  renderPage(result.rows, result.page, result.pageCount);
}
```

```html
<nav aria-label="Results pages">
  <button type="button" id="prev">Previous</button>
  <span id="page-label">Page 1 of 1</span>
  <button type="button" id="next">Next</button>
</nav>
```

**Nuance / edge case:** When filters change, resetting to page one is often less surprising than clamping, especially if the user expects the first matching records. Choose and document one policy.

### Pattern 6: Loading, empty, and error rows

**What it does:** Keeps the table's structure understandable while data is pending or unavailable.

**When to use it:** Any table populated asynchronously.

**Complete copy-pasteable code:**

```html
<table>
  <caption>Recent activity</caption>
  <thead><tr><th scope="col">Date</th><th scope="col">Activity</th><th scope="col">Status</th></tr></thead>
  <tbody id="activity-body"><tr><td colspan="3"><p role="status">Loading activity…</p></td></tr></tbody>
</table>
<script>
const body = document.querySelector("#activity-body");
function showState(message, action) {
  const cell = document.createElement("td"); cell.colSpan = 3;
  const paragraph = document.createElement("p"); paragraph.textContent = message; cell.append(paragraph);
  if (action) cell.append(action);
  const row = document.createElement("tr"); row.append(cell); body.replaceChildren(row);
}
</script>
```

**Nuance / edge case:** If the table previously had valid data, consider retaining it during refresh and displaying a separate status rather than replacing useful rows with a loading message.

### Pattern 7: Inline editing with rollback

**What it does:** Makes a cell editable while preserving validation and a recovery path if persistence fails.

**When to use it:** Admin tools or operations dashboards where editing a value in context is materially faster than opening a separate form.

**Complete copy-pasteable code:**

```html
<label for="limit-7">Monthly limit</label>
<input id="limit-7" type="number" min="0" step="1" value="500">
<button type="button" id="save-limit">Save</button>
<p id="edit-status" role="status"></p>
<script>
const input = document.querySelector("#limit-7");
const status = document.querySelector("#edit-status");
document.querySelector("#save-limit").addEventListener("click", async () => {
  const previous = input.defaultValue;
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) {
    input.setAttribute("aria-invalid", "true");
    status.textContent = "Enter a valid non-negative limit.";
    return;
  }
  input.removeAttribute("aria-invalid");
  try {
    await persistLimit(value);
    input.defaultValue = String(value);
    status.textContent = "Limit saved.";
  } catch {
    input.value = previous;
    status.textContent = "Save failed. The previous value has been restored.";
  }
});
</script>
```

**Nuance / edge case:** For production, track dirty state separately from `defaultValue`, support cancel and keyboard activation, and avoid rolling back over a newer server update.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Building a table from generic `div` elements | Styling flexibility seems easier than native markup. | Use native table elements for tabular relationships and add ARIA only when required. |
| Using bold text instead of header semantics | Visual hierarchy is confused with document structure. | Use `<th>` and appropriate `scope` or explicit header associations. |
| Sorting formatted strings | Display labels are reused as data values. | Sort normalized typed values, then format for display. |
| Leaving stale `aria-sort` attributes | Only the arrow icon is updated. | Update row order and the active header's `aria-sort` together. |
| Tracking selection by row index | The current array order is mistaken for identity. | Store stable record IDs in the selection model. |
| Calling a page-level checkbox “select all” | Selection scope is undocumented. | Label whether it selects visible, filtered, or all server-side records. |
| Hiding columns without a discovery path | Mobile fit is prioritized over information access. | Use horizontal scrolling, an explicit compact view, or a detail disclosure. |
| Applying `role="grid"` without grid keyboard behavior | ARIA role is treated as a styling label. | Keep native table semantics unless implementing managed focus and grid navigation. |
| Making the entire row clickable | A card-like interaction is copied into a table. | Use explicit links or buttons and preserve embedded control behavior. |
| Sorting unstable ties | Equal values have no tie-breaking policy. | Use stable sorting or a deterministic secondary key. |
| Filtering on every keystroke without measuring | Filtering logic grows without performance review. | Debounce costly work or move large operations to the server. |
| Keeping an invalid page after filtering | Page state is not derived from the result count. | Reset or clamp pagination when result count changes. |
| Virtualizing without accessibility testing | Fewer DOM nodes are assumed to be universally better. | Profile first and test row counts, keyboard behavior, and screen-reader navigation. |
| Losing focus after inline edit rerender | The whole table is rebuilt without focus restoration. | Update the affected row/cell or restore focus to a stable control after rendering. |
| Showing an empty table on request failure | Error and empty states share one fallback. | Render a distinct error message and recovery action. |
| Ignoring stale server responses | Requests complete in a different order than they start. | Abort obsolete requests or use request IDs before committing state. |
| Hiding selection state on a filtered page | Selected IDs and visible rows are conflated. | Define whether hidden selections persist and show the selected count/scope. |
| Using a sticky header without a proper scroll container | Sticky positioning is tested only in a simple page. | Define overflow ownership, z-index, background, and focus visibility. |
| Allowing formatted dates to determine order | Localized date strings are compared lexically. | Sort canonical timestamps or normalized date values. |
| Replacing useful data with skeletons during every refresh | Initial load and refresh are treated identically. | Keep stale-but-useful data visible and mark the refresh state. |
| Rendering untrusted cell content with `innerHTML` | String interpolation is used for convenience. | Use `textContent` or a framework's safe text rendering. |

### Before/after: safe cell rendering

**Before — dynamic content is parsed as markup:**

```js
cell.innerHTML = row.customerName;
```

**After — dynamic content is rendered as text:**

```js
cell.textContent = row.customerName;
```

### Before/after: typed sorting

**Before — numeric strings sort incorrectly:**

```js
rows.sort((a, b) => a.amountLabel.localeCompare(b.amountLabel));
```

**After — compare numeric values:**

```js
rows.sort((a, b) => a.amount - b.amount);
```

---

## Mental Models

1. **A table is a relationship map:** Each cell needs an understandable relationship to its row and column headers.
2. **Identity survives movement:** Record IDs survive sorting and filtering; row indexes do not.
3. **Sort the data, not the decoration:** Formatted strings are display output, not necessarily the correct comparison values.
4. **Selection has a scope:** “All” must say whether it means visible, filtered, or globally matching records.
5. **A grid is a keyboard contract:** Do not claim grid semantics unless the full keyboard interaction model exists.
6. **Responsive means discoverable:** If a column is hidden, users still need a way to find its information.
7. **Every asynchronous result needs ownership:** Old requests must not overwrite newer user intent.
8. **Virtualization spends complexity to save DOM work:** Use it only when measurements justify the cost.
9. **Empty and error are different truths:** No matching records is not the same as being unable to retrieve records.
10. **Bulk actions must match the selection model:** The action's scope should be visible before it runs.

---

## Quick Reference

| Need | Recommended approach | Verify |
|---|---|---|
| Tabular relationships | Native `<table>` and associated headers | Screen reader identifies row and column context |
| Column header | `<th scope="col">` | Header semantics are not only visual |
| Row header | `<th scope="row">` | Record identity is understandable in context |
| Sorting | Typed comparator and `aria-sort` | Display order and announced direction agree |
| Stable row identity | Unique domain ID | Selection survives sorting/filtering |
| Select all | Explicit selection scope | Label matches actual records affected |
| Responsive behavior | Scroll, compact view, or card strategy | Every essential value remains discoverable |
| Sticky header | Defined scroll container and z-index | Header does not obscure focused controls |
| Filtering | Explicit state; debounce expensive work | Result count and rows remain synchronized |
| Pagination | Clamp/reset page after filtering | Current page is valid |
| Large dataset | Server operations or measured virtualization | Performance and accessibility remain acceptable |
| Inline editing | Validation, save/cancel, rollback | Failed saves do not silently change data |
| Loading state | Busy indicator or skeleton with stable columns | Loading always transitions to a terminal state |
| Empty result | Explicit empty state | User understands that request succeeded |
| Request failure | Error state with retry/recovery | User can distinguish failure from no records |
| Dynamic content | Safe text rendering | Cell strings cannot inject markup |
| Async race | AbortController or request identity | Stale responses cannot replace current results |

---

## Build Challenge

Build an invoice-management table for a production-style dashboard. It must support sorting, filtering, pagination, selection, and clear loading/error/empty states while preserving native semantics.

### Requirements

1. Use native `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th>`, and `<td>` elements.
2. Add appropriate column and row header associations.
3. Support sorting by at least three columns using typed values.
4. Keep sort direction synchronized with the displayed rows and `aria-sort`.
5. Use stable record IDs for selection, editing, and row updates.
6. Implement a select-visible checkbox with correct indeterminate behavior.
7. Explain the selection scope in visible UI text.
8. Add a filter input with an accessible label and visible result count.
9. Preserve the filter and sort context while paginating.
10. Reset or clamp the current page when filtering changes the result count.
11. Use a responsive strategy that keeps all essential values discoverable.
12. Ensure keyboard users can reach and scroll the table wrapper if it overflows.
13. Provide loading, empty, and error states that are not visually or semantically conflated.
14. Ensure a failed refresh does not falsely imply that no records exist.
15. Add inline editing with validation and a clear save/cancel path.
16. Roll back or reconcile optimistic edits when the server rejects an update.
17. Prevent stale async responses from overwriting newer filter results.
18. Add bulk actions that act only on the intended selected records.
19. Avoid `role="grid"` unless implementing its full keyboard interaction model.
20. Render untrusted cell content as text rather than HTML.
21. Test with keyboard navigation and at least one screen reader.
22. Profile realistic dataset sizes before choosing virtualization.
23. Add tests for sorting, selection scope, pagination bounds, and async races.
24. Document the chosen mobile table strategy and its trade-offs.
25. Include a manual test checklist for 200% zoom, long content, and narrow viewports.

### Failure scenarios to inject

- Sort a numeric currency column containing `20`, `100`, and `9`; verify numeric order rather than lexical order.
- Select records, sort the table, and verify the same record IDs remain selected.
- Select all visible rows, move to another page, and verify the selection scope matches the label.
- Apply a filter that reduces the result to fewer pages; verify the current page becomes valid.
- Start two filter requests and return the older response last; verify it cannot overwrite the current view.
- Fail an inline edit after optimistic rendering; verify the previous value is restored or reconciled.
- Trigger an error while data is already visible; verify stale content is labeled or retained according to the documented policy.
- Navigate the horizontally scrollable table using only the keyboard.
- Use a screen reader to inspect column and row context.
- Inject a cell value containing HTML-like text and verify it is displayed literally.
- Test a long client name at 200% zoom and verify it remains readable.
- Simulate a large dataset and compare performance before and after virtualization.

### Definition of done

- [ ] Native table semantics communicate the data relationships.
- [ ] Sort behavior works for typed values and exposes the active direction.
- [ ] Selection uses stable IDs and clearly states its scope.
- [ ] Filtering, sorting, and pagination compose without losing state.
- [ ] Pagination remains valid after data changes.
- [ ] Responsive behavior keeps essential values discoverable.
- [ ] Loading, empty, and error states are distinct.
- [ ] Failed edits have a clear rollback or reconciliation behavior.
- [ ] Old async requests cannot overwrite newer user intent.
- [ ] Bulk actions operate on exactly the selected records.
- [ ] Dynamic text is rendered safely.
- [ ] Keyboard focus and screen-reader table navigation are tested.
- [ ] Virtualization is used only when measurements justify it.
- [ ] Automated tests cover sorting, selection, filtering, and request races.
- [ ] The mobile strategy and known trade-offs are documented.

### Suggested test matrix

| Scenario | Action | Expected result |
|---|---|---|
| Numeric sorting | Sort amounts with different digit lengths | Values are sorted numerically |
| Stable ties | Sort records with equal values | Equal-key records retain deterministic order |
| Selection persistence | Select then sort | The same record IDs remain selected |
| Select visible | Use master checkbox on one page | Only the visible scope changes |
| Filter shrinks pages | Apply a restrictive filter on a later page | Page is reset or clamped to a valid value |
| Request race | Resolve old filter request after new request | Old result is ignored |
| Empty results | Search for no matches | Explicit empty state is shown |
| Server error | Fail the data request | Error and recovery UI are shown |
| Edit failure | Reject a cell update | Previous value is restored or reconciled |
| Keyboard overflow | Focus and scroll the wrapper | All columns can be reached without a mouse |
| Untrusted cell | Provide HTML-like text | It appears as literal text |
| High zoom | View at 200% zoom | Table remains usable and information is discoverable |
