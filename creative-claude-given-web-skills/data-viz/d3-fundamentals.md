# d3-fundamentals

**Layer:** 19 — Data Visualization  
**Goal:** Build reliable, accessible, responsive, and testable visualizations with D3.js using sound data joins, scales, axes, SVG, interaction, updates, and performance practices.

## When to use this skill

Use this skill when a chart needs more control than a high-level chart component provides: custom axes, unusual encodings, interactive network or geographic views, coordinated brushing, animated transitions, or a visual design that must map precisely to data. D3 is a toolkit for binding data to the DOM and calculating visual encodings; it does not automatically choose the right chart for you.

## Why This Matters

D3 visualizations fail in production in ways that screenshots may not reveal. A join keyed by array position can silently attach the wrong tooltip to a point after sorting. A scale that is not updated after filtering can place marks outside the plot. An SVG that never responds to container resizing can clip labels on a narrow screen. A tooltip that only appears on hover excludes keyboard and touch users. A transition interrupted by rapid filter changes can leave a chart half-updated. Thousands of SVG nodes can make scrolling sluggish, and a misleading truncated axis can exaggerate differences.

The job is to keep the relationship between data, encoding, and rendered marks explicit. Validate input data, select scales that match field meaning, use stable keys, update axes and marks from the same state, and provide a readable alternative when interaction is unavailable. D3 offers precise control, which also means responsibility for correctness, accessibility, and maintenance. Treat each chart as a small rendering system with input contracts, update rules, failure states, and a clear statement of what the viewer should conclude.

## Core workflow

1. Define the question before choosing a mark.
2. Document the schema, units, missing-value policy, and expected range.
3. Parse and validate raw values at the boundary.
4. Create a stable SVG structure with a plot region and margins.
5. Build scales from current data and available dimensions.
6. Join data with stable keys, then update marks and axes.
7. Add keyboard and touch alternatives to pointer interactions.
8. Test empty, malformed, duplicate, extreme, and rapidly changing data.
9. Profile large datasets and reduce unnecessary DOM work.
10. Verify the chart at desktop and mobile sizes.

## Setup

```bash
npm install d3
```

```js
import * as d3 from "d3";

const svg = d3.select("#chart").append("svg")
  .attr("role", "img")
  .attr("aria-labelledby", "chart-title chart-description");
svg.append("title").attr("id", "chart-title").text("Monthly revenue");
svg.append("desc").attr("id", "chart-description")
  .text("Revenue increased from January through June.");
```

The examples use modern D3 module APIs (D3 v7 style). Pin dependencies and check the installed version before copying examples. D3 v3 code differs from current versions, particularly around event handling and modules. Browser support depends on the DOM and platform APIs used alongside D3.


### 1. Data contracts and parsing

**What it solves:** Validate field names, units, dates, finite numeric values, missing values, and duplicate identifiers before rendering. Raw API strings should not flow directly into scales.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const parseDate = d3.timeParse("%Y-%m-%d");
const rows = rawRows.flatMap((row, index) => {
  const date = parseDate(row.date);
  const value = Number(row.value);
  if (!date || !Number.isFinite(value)) {
    console.warn("Invalid chart row", { index, row });
    return [];
  }
  return [{ id: String(row.id), date, value }];
});
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 2. SVG coordinate system and viewBox

**What it solves:** Keep a clear plot group translated by margins. SVG viewBox coordinates scale with the graphic, so labels may need responsive layout rather than pure scaling.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const width = 720, height = 420;
const margin = { top: 24, right: 28, bottom: 54, left: 64 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const svg = d3.select("#chart").append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("role", "img");
const plot = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 3. Scale selection

**What it solves:** Use linear scales for continuous numbers, time scales for dates, band scales for category widths, point scales for discrete positions, and ordinal scales for categories. Domains affect interpretation.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const x = d3.scaleTime()
  .domain(d3.extent(rows, d => d.date))
  .range([0, innerWidth]);
const y = d3.scaleLinear()
  .domain([0, d3.max(rows, d => d.value) ?? 0]).nice()
  .range([innerHeight, 0]);
const color = d3.scaleOrdinal()
  .domain(["actual", "forecast"])
  .range(["#2563eb", "#d97706"]);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 4. Data joins and stable keys

**What it solves:** Use a unique stable key whenever records can be sorted, filtered, inserted, or removed. Index-based joins can attach the wrong state or tooltip to a mark after reordering.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const marks = plot.selectAll("circle.point")
  .data(rows, d => d.id)
  .join("circle")
  .attr("class", "point")
  .attr("cx", d => x(d.date))
  .attr("cy", d => y(d.value))
  .attr("r", 4);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 5. Enter, update, and exit

**What it solves:** Make element creation, update, and removal intentional. The join helper merges enter and update selections, while callbacks allow distinct behavior for each lifecycle.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
plot.selectAll("rect.bar")
  .data(rows, d => d.id)
  .join(
    enter => enter.append("rect").attr("class", "bar"),
    update => update,
    exit => exit.remove()
  )
  .attr("x", d => xBand(d.category))
  .attr("width", xBand.bandwidth())
  .attr("y", d => y(d.value))
  .attr("height", d => innerHeight - y(d.value));
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 6. Axes and tick formatting

**What it solves:** Axes explain units and magnitude. Format currency and percentages explicitly, tune tick density to available width, and regenerate axes whenever their scale changes.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const xAxis = d3.axisBottom(x).ticks(Math.max(2, Math.floor(innerWidth / 90)));
const yAxis = d3.axisLeft(y).ticks(5)
  .tickFormat(d => `$${d3.format(",.0f")(d)}`);
plot.append("g")
  .attr("transform", `translate(0,${innerHeight})`).call(xAxis);
plot.append("g").call(yAxis);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 7. Responsive layout

**What it solves:** A responsive chart recomputes geometry, margins, and tick density when its container changes. Disconnect observers during teardown and observe a stable container.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const container = document.querySelector("#chart");
const observer = new ResizeObserver(entries => {
  const width = Math.max(280, entries[0].contentRect.width);
  renderChart({ width, height: Math.min(460, width * 0.62) });
});
observer.observe(container);
function destroyChart() {
  observer.disconnect();
  d3.select(container).selectAll("svg").remove();
}
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 8. Missing values and empty states

**What it solves:** A zero is a measurement; null may mean missing or unavailable. Preserve that distinction and provide a clear empty state when filtering leaves no valid records.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const line = d3.line()
  .defined(d => Number.isFinite(d.value))
  .x(d => x(d.date))
  .y(d => y(d.value));
plot.append("path").datum(rows)
  .attr("fill", "none").attr("stroke", "#2563eb")
  .attr("d", line);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 9. Color and visual encoding

**What it solves:** Use sequential palettes for ordered values, diverging palettes around a meaningful midpoint, and qualitative palettes for categories. Do not rely on color alone.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const seriesColor = d3.scaleOrdinal()
  .domain(["Revenue", "Cost", "Profit"])
  .range(["#2563eb", "#b45309", "#047857"]);
legend.selectAll("li").data(seriesNames).join("li")
  .text(name => name)
  .style("border-inline-start", name => `4px solid ${seriesColor(name)}`);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 10. Tooltips and interaction

**What it solves:** Hover must not be the only way to inspect a chart. Support keyboard focus and touch selection; avoid flicker when the pointer moves between a mark and its tooltip.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
marks.attr("tabindex", 0)
  .attr("aria-label", d => `${d.date.toLocaleDateString()}: ${d.value}`)
  .on("pointerenter", (event, d) => showTooltip(event, d))
  .on("pointermove", (event, d) => moveTooltip(event, d))
  .on("pointerleave", hideTooltip)
  .on("focus", (event, d) => showTooltip(event, d))
  .on("blur", hideTooltip);
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 11. Transitions and interruption

**What it solves:** Animation can explain changes but should not delay urgent information. Interrupt prior transitions when new filters arrive and respect reduced-motion preferences.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
marks.interrupt("update")
  .transition("update")
  .duration(reduced ? 0 : 220)
  .attr("cy", d => y(d.value));
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 12. Filtering and derived domains

**What it solves:** Use one visible dataset to update marks, axes, counts, and summaries. Decide whether filtering preserves the original domain for comparison or recalculates it.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
function updateChart(allRows, predicate) {
  const visible = allRows.filter(predicate);
  y.domain([0, d3.max(visible, d => d.value) ?? 1]).nice();
  plot.select(".y-axis").call(d3.axisLeft(y));
  plot.selectAll("circle.point")
    .data(visible, d => d.id)
    .join("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.value))
    .attr("r", 4);
  renderSummary(visible.length);
}
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 13. Performance and large datasets

**What it solves:** SVG is suitable for many charts, but dense mark counts can make DOM updates expensive. Aggregate or sample where appropriate, use Canvas for very dense marks, and profile before optimizing.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const start = performance.now();
updateChart(rows, () => true);
console.debug(`Chart update: ${(performance.now() - start).toFixed(1)}ms`);
console.table(rows.slice(0, 5));
// For dense plots, centralize pointer handling instead of attaching
// complex handlers to every mark.
plot.on("pointermove", event => {
  const [px] = d3.pointer(event, plot.node());
  updateSharedTooltip(x.invert(px));
});
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 14. Accessibility and alternatives

**What it solves:** Give the SVG an accessible name and description, use visible focus, sufficient contrast, keyboard operation, and a data table or summary for dense charts.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
const svg = d3.select("#chart svg")
  .attr("role", "img")
  .attr("aria-labelledby", "chart-title chart-desc");
svg.append("title").attr("id", "chart-title")
  .text("Quarterly customer growth");
svg.append("desc").attr("id", "chart-desc")
  .text("Customers grew each quarter, with the largest increase in Q4.");
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


### 15. Testing and debugging

**What it solves:** Test parsing and state rules separately from browser rendering. Include empty arrays, one record, duplicate keys, invalid dates, negative values, rapid filtering, and resize behavior.

**Implementation guidance:** Keep this behavior tied to the chart's data contract. Check normal records and edge cases; do not let rendering code silently guess at missing units, invalid values, or ambiguous identities. The same rule should apply during initial rendering and later updates. If the chart receives new data, recompute dependent scales and axes and keep the summary, tooltip, and table consistent with the marks.

```js
function assertRows(rows) {
  const ids = new Set();
  for (const row of rows) {
    if (!row.id || ids.has(row.id)) throw new Error(`Duplicate id: ${row.id}`);
    ids.add(row.id);
    if (!(row.date instanceof Date) || !Number.isFinite(+row.date)) {
      throw new Error(`Invalid date for ${row.id}`);
    }
    if (!Number.isFinite(row.value)) throw new Error(`Invalid value for ${row.id}`);
  }
}
assertRows(rows);
console.table(rows.slice(0, 5));
```

**Review questions:** Does it still work after sorting, filtering, resizing, and receiving an empty dataset? Does it preserve the meaning of the data? Can a keyboard user obtain the same essential information?


## Production Patterns


### Pattern: Margin convention

What it does: reserves room for labels and keeps marks in a local plot coordinate system.

When to use: nearly every Cartesian chart, especially when axes must update consistently.

```js
const margin = { top: 20, right: 24, bottom: 48, left: 58 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
const plot = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);
```


### Pattern: Keyed join

What it does: keeps DOM elements associated with stable record identities.

When to use: live data, sorting, filtering, transitions, or per-mark state.

```js
plot.selectAll("circle")
  .data(rows, d => d.id)
  .join("circle")
  .attr("cx", d => x(d.date))
  .attr("cy", d => y(d.value));
```


### Pattern: Shared scale domain

What it does: derives geometry and axis labels from the same domain.

When to use: any data update, so marks and tick labels do not disagree.

```js
const extent = d3.extent(visibleRows, d => d.date);
x.domain(extent[0] && extent[1] ? extent : [fallbackStart, fallbackEnd]);
plot.select(".x-axis").call(d3.axisBottom(x));
```


### Pattern: Line gaps

What it does: breaks a line at missing observations rather than inventing continuity.

When to use: time series with null or unavailable measurements.

```js
const line = d3.line()
  .defined(d => d.value != null && Number.isFinite(d.value))
  .x(d => x(d.date)).y(d => y(d.value));
path.attr("d", line(rows));
```


### Pattern: Shared tooltip

What it does: reuses one tooltip element instead of creating one per mark.

When to use: dense scatterplots or charts where tooltip DOM churn is costly.

```js
const tooltip = d3.select("#chart-tooltip");
function showTooltip(event, d) {
  tooltip.text(`${d.label}: ${d.value}`).attr("hidden", null)
    .style("left", `${event.clientX + 12}px`)
    .style("top", `${event.clientY + 12}px`);
}
```


### Pattern: Responsive observer

What it does: updates geometry when the parent container changes size.

When to use: dashboard cards, resizable panels, sidebars, embedded charts.

```js
const observer = new ResizeObserver(entries => {
  const width = entries[0].contentRect.width;
  renderChart({ width, height: Math.max(240, width * 0.6) });
});
observer.observe(document.querySelector("#chart"));
```


### Pattern: Reduced-motion transition

What it does: preserves data updates while disabling unnecessary movement for users who request less motion.

When to use: every animated chart update, especially frequent refreshes.

```js
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
marks.interrupt().transition().duration(reduce ? 0 : 180)
  .attr("opacity", 1);
```


## Mental Models

1. **A scale is a translation contract.** It maps a defined data domain to a visual range; changing either means dependent marks and axes need reconsideration.
2. **A join is identity reconciliation.** The key says which element represents which record, not which row currently occupies an index.
3. **An axis is part of the encoding.** Ticks communicate units and magnitude; an axis mismatch can make correct geometry tell a false story.
4. **A chart is a state machine.** Loading, ready, empty, filtered-empty, error, and stale states should be explicit.
5. **Interaction is a second reading path.** Hover may reveal detail, but it must not be the only way to understand data.
6. **Responsive means semantic adaptation.** A small chart may need fewer ticks, a new legend position, or a table—not merely a smaller SVG.
7. **Animation is explanatory.** Motion should show what changed, not delay or obscure the answer.
8. **Performance is a budget.** Measure parsing, joins, layout, paint, and event handling separately.
9. **Missing is not zero.** A null value represents absence or uncertainty; converting it to zero changes the claim.
10. **Every visual claim needs a test.** Validate expected positions, labels, and summaries, not only whether the chart renders.

## Gotchas

- **Gotcha:** D3 v6+ passes the event first and datum second to listeners. Old examples using `d3.event` may fail; use `(event, datum)`.
- **Gotcha:** A band scale's range is not the bar width. Use `bandwidth()` rather than a hardcoded width.
- **Gotcha:** `d3.extent` can return undefined endpoints for empty data. Provide a fallback domain and empty-state UI.
- **Gotcha:** Index joins can move per-record state after sorting. Use a stable unique key.
- **Gotcha:** `pointerleave` may fire while moving from a mark to an overlay. Use a shared hit region or containment strategy.
- **Gotcha:** `viewBox` scales labels too. Adapt tick density if text becomes too small.
- **Gotcha:** An implicit ordinal domain can change category colors as data order changes. Define the domain explicitly.
- **Gotcha:** A ResizeObserver can create a feedback loop if render changes the observed element's size. Observe a stable parent.

## Common Mistakes and Unique Fixes

| Mistake | Why it fails | Specific fix |
|---|---|---|
| INDEX JOIN | Sorting can reassign marks to different records | Bind data with a unique immutable `id` key |
| RAW STRINGS | Numeric strings may sort or scale incorrectly | Parse and validate numeric fields before rendering |
| EMPTY EXTENT | Empty data produces unusable scale domains | Provide a documented fallback domain and empty-state UI |
| ZERO CONFUSION | Missing values become false measurements | Preserve `null` and use `.defined()` to create gaps |
| STALE AXIS | Marks update but ticks retain old values | Re-call the axis generator whenever its scale changes |
| FIXED WIDTH | Chart clips in narrow dashboard cards | Observe the parent and recompute dimensions |
| HOVER ONLY | Keyboard and touch users cannot inspect details | Add focusable interaction and a data-table alternative |
| COLOR ONLY | Meaning disappears in grayscale or color-vision differences | Pair colors with labels, shapes, line styles, or patterns |
| UNBOUNDED DOMAIN | Outliers compress useful variation | Document and test the domain policy |
| TRANSITION RACE | Rapid updates leave partially animated marks | Interrupt the named transition before starting another |
| DUPLICATE KEYS | Records compete for the same DOM identity | Validate uniqueness and reject or normalize duplicates |
| TOOLTIP PER MARK | Many tooltip nodes increase DOM overhead | Use one shared tooltip and a centralized update function |
| BAD DATE PARSE | Dates shift or become invalid | Parse the known input format explicitly and test timezone rules |
| HIDDEN ERROR | Failed fetch looks like an empty dataset | Represent loading, empty, and error states separately |
| UNTESTED RESIZE | Labels overlap on mobile | Test narrow containers and adjust tick density |
| NO CLEANUP | Observers and handlers survive teardown | Disconnect observers and remove listeners during cleanup |
| MISLEADING BASELINE | Bar lengths exaggerate differences | Start quantitative bar axes at zero unless justified otherwise |
| UNSTABLE COLORS | Categories change color after refresh | Set a fixed ordinal domain and palette mapping |

## Quick Reference

| Need | D3 tool or technique | Rule |
|---|---|---|
| Numeric position | `scaleLinear` | Check domain and units |
| Time position | `scaleTime` | Parse dates explicitly |
| Category position | `scaleBand` | Use `bandwidth()` |
| Discrete point position | `scalePoint` | Use for positions without widths |
| Category color | `scaleOrdinal` | Define domain and palette |
| Ordered numeric color | `scaleSequential` | Choose a perceptual palette |
| Domain boundaries | `extent`, `min`, `max` | Handle empty data |
| Axis labels | `axisBottom`, `axisLeft` | Match tick format to units |
| Stable DOM identity | `.data(data, key)` | Use immutable unique IDs |
| Add/update/remove | `.join()` | Make lifecycle intentional |
| Missing line values | `line().defined()` | Preserve gaps honestly |
| Container resize | `ResizeObserver` | Disconnect during teardown |
| Pointer coordinates | `d3.pointer(event, node)` | Use the right coordinate space |
| Tooltip accessibility | ARIA, focus, table | Never rely on hover alone |
| Motion preference | `prefers-reduced-motion` | Disable or shorten transitions |
| Dense marks | Canvas, aggregation | Profile before switching renderer |
| Debug geometry | DevTools SVG attributes | Inspect coordinates and domains |
| Verify data | `console.table`, assertions | Test edge cases before drawing |
| Chart title | SVG `<title>` | Give the graphic a concise name |
| Chart description | SVG `<desc>` | Explain takeaway and units |

## Build Challenge: Interactive Revenue Explorer

Build a responsive time-series chart comparing monthly revenue across at least two categories. Include date and numeric scales, formatted axes, stable keyed joins, filtering, a shared tooltip, keyboard-accessible details, a summary, and a table fallback.

### Requirements

1. Create a semantic `<main>` region with a heading and explanatory paragraph.
2. Add a labeled `<section>` containing the chart and controls.
3. Provide at least 24 observations across 12 months and two categories.
4. Validate record ID, date, category, and finite numeric value.
5. Reject duplicate IDs with a clear error.
6. Parse dates using a known format.
7. Use a time scale horizontally and linear scale vertically.
8. Format the vertical axis as currency and label the currency.
9. Use a fixed ordinal color domain.
10. Use keyed joins for marks that persist between updates.
11. Update marks, axes, count, and summary from one filtered dataset.
12. Include a reset control.
13. Render an empty state when a filter returns no rows.
14. Render an error state when parsing fails.
15. Display category, month, and value in a tooltip.
16. Prevent tooltip flicker between marks and tooltip.
17. Provide keyboard access to essential details.
18. Include a table or equivalent non-visual representation.
19. Connect SVG title and description through ARIA attributes.
20. Keep focus indicators visible.
21. Use ResizeObserver or document another responsive strategy.
22. Keep labels readable at 320 CSS pixels.
23. Avoid one tooltip node per mark.
24. Respect `prefers-reduced-motion`.
25. Interrupt transitions before applying newer filters.
26. Do not use color as the only category signal.
27. Provide a no-JavaScript explanatory fallback.
28. Test empty data, invalid dates, duplicate IDs, and negative values.
29. Use DevTools to verify that marks and axes share current domains.
30. Measure update time with `performance.now()` on a larger dataset.
31. Explain the baseline and domain policy.
32. Verify resizing does not create duplicate SVG nodes or observers.
33. Remove listeners and disconnect observers during teardown.
34. Confirm table and chart values agree after filtering.
35. Document supported browsers and reproduction steps.

### Failure-injection tests

- **Duplicate identity:** Insert two rows with the same ID. Reject the input or show a clear data-quality error; do not silently reuse one mark.
- **Empty filter:** Select a category with no matching records. Show an empty state rather than invalid ticks or stale marks.
- **Invalid date:** Replace a date with `2026-99-42`. Parsing must fail safely and report the rejected row.
- **Rapid filtering:** Toggle filters during active transitions. Final marks and axes must match the final selected filter.
- **Narrow viewport:** Resize to 320 CSS pixels. Labels remain legible and controls usable without horizontal overflow.
- **Reduced motion:** Enable the operating-system preference. Updates finish without unnecessary animation.
- **Keyboard-only:** Navigate with Tab and Enter/Space. No essential value requires mouse hover.
- **Fetch failure:** Simulate a failed request. Show an error and retry path rather than pretending the data is empty.

## Definition of done

- [ ] Schema, units, parsing, missing-value policy, and duplicate-key policy are documented.
- [ ] Core concepts and relevant production patterns are implemented.
- [ ] Empty, malformed, duplicate, filtered-empty, and extreme inputs are tested.
- [ ] Marks, axes, summaries, and tables use the same visible data state.
- [ ] Keyboard, touch, screen-reader naming, focus visibility, and contrast are checked.
- [ ] Responsive behavior is verified on desktop, tablet, and mobile.
- [ ] Reduced-motion preferences are respected.
- [ ] DevTools shows no duplicate SVG trees, stale marks, or console errors.
- [ ] Performance is measured on representative data before changing renderers.
- [ ] Browser support and fallback strategy are documented.
- [ ] Failure-injection tests pass and another developer can reproduce the build.

## Debugging checklist

1. Confirm the data schema before inspecting SVG.
2. Log the filtered data count and active domain.
3. Check that IDs are unique and stable.
4. Inspect generated SVG attributes in DevTools.
5. Verify scale ranges match current inner dimensions.
6. Verify axes are called after scale domains change.
7. Check tooltip coordinate space.
8. Inspect console warnings and network failures separately from empty states.
9. Profile a slow interaction in the Performance panel.
10. Re-run failure tests after changing parsing, joins, or resizing.

## Browser support and maintenance

D3's SVG and DOM fundamentals work in current evergreen browsers, but platform APIs used beside D3 have their own support requirements. Check `ResizeObserver`, pointer events, SVG accessibility exposure, and newer CSS features against the project's browser matrix. Test Safari, Firefox, and Chromium-based browsers when in scope. Feature-detect optional APIs and provide a window-resize fallback if ResizeObserver is unavailable. Pin the D3 major version and review migration notes before upgrading.


## Practice Lab 1: Data parsing

**Objective:** Create fixtures with valid dates, invalid dates, blank strings, duplicate IDs, and negative numbers. Assert which records are accepted and explain the policy.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 2: Scale correctness

**Objective:** Choose known input values and assert expected coordinates. Verify that the domain and range are correct after filtering and resizing.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 3: Join identity

**Objective:** Render records, reorder them, and update their values. Confirm that the same record retains its mark identity and associated details.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 4: Empty and error states

**Objective:** Test a successful empty response separately from a network error and a response with only invalid rows. The UI must distinguish these conditions.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 5: Responsive geometry

**Objective:** Resize the container from desktop to 320 CSS pixels. Check tick density, label overlap, clipping, and observer cleanup.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 6: Keyboard and touch

**Objective:** Inspect essential values without a mouse. Test focus, selected states, tap-to-reveal details, dismissal, and the table alternative.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 7: Transition interruption

**Objective:** Start a transition and immediately change filters again. Confirm the last state wins and no stale marks remain.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?


## Practice Lab 8: Performance budget

**Objective:** Measure parsing, join/update, and pointer interactions separately. Record row count and device/browser so results are reproducible.

**Steps**
1. Write a small fixture representing the expected normal case.
2. Record the expected mark count, domain, axis labels, and summary.
3. Introduce one boundary case and repeat the interaction.
4. Inspect the rendered SVG and console using browser DevTools.
5. Confirm keyboard access and the text alternative.
6. Record reproduction steps and the expected outcome.

```js
function expectFiniteGeometry(selection, attributes = ["cx", "cy"]) {
  selection.each(function () {
    for (const attribute of attributes) {
      const value = Number(d3.select(this).attr(attribute));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid ${attribute} geometry: ${value}`);
      }
    }
  });
}
```

**Review questions:** Is the chart's meaning unchanged? Does a record keep its identity after sorting? Does the chart distinguish zero from missing? Can a user understand the data without hover? Does resize leave stale marks or duplicate observers?

## Review Scenario: Timezone boundary

Use two timestamps around midnight and state whether the axis represents local time or UTC. Verify that the labels match the declared rule. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Duplicate category

Provide duplicate category names with distinct IDs. Confirm that the category legend remains stable and the records remain separate. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Large outlier

Add one unusually large value. Explain whether the axis should expand, whether a log scale is appropriate, and how the choice affects interpretation. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Stale tooltip

Open a tooltip, then remove its datum through a filter. Confirm the tooltip closes or updates to a valid record. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Unavailable ResizeObserver

Disable or stub ResizeObserver and verify that the documented fallback keeps the chart usable. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Unsafe label

Supply a label containing HTML-like text. Confirm it is rendered as text and never interpreted as executable markup. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Rapid data response

Resolve an older request after a newer request. Ensure stale data cannot overwrite the latest selected state. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Color consistency

Shuffle category order between refreshes. Confirm every category retains its assigned color. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Keyboard focus

Navigate controls and data details using only the keyboard. Confirm focus is visible and follows a logical order. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Review Scenario: Table parity

Compare values in the chart tooltip, summary, and table after filtering. All must derive from the same visible dataset. Keep the expected behavior written next to the test fixture. A screenshot can show that a chart rendered, but it cannot prove that data identity, domain policy, or accessibility is correct. Re-run this scenario whenever parsing, filtering, transitions, or layout logic changes.

```js
function checkVisibleRows(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (row.id == null || seen.has(row.id)) {
      throw new Error("Chart rows require unique, stable IDs");
    }
    seen.add(row.id);
    if (!Number.isFinite(row.value)) {
      throw new Error(`Non-finite value in row ${row.id}`);
    }
  }
  return rows;
}
```

## Implementation Note: Choosing marks before APIs

Choose marks according to the question. Bars compare magnitudes, lines show change over ordered time, dots show distributions and relationships, and areas are appropriate only when filled magnitude is meaningful. Write the viewer takeaway in one sentence before selecting the mark.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Data provenance and units

Clarify whether values are nominal or inflation-adjusted, whether dates represent local time or UTC, and whether percentages are fractions or already multiplied by 100. A correct path with the wrong unit is still a wrong chart.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Stable component lifecycle

One component should own creating the SVG root and one owner should destroy it. Repeated initialization must not append a second SVG. Keep observers and selections inside the component lifecycle and expose a clear update method.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Security and untrusted labels

Treat labels from APIs as untrusted text. Prefer `.text()` over inserting untrusted HTML with `.html()`. Avoid building CSS selectors from raw identifiers and sanitize rich content before display.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Testing visual correctness

Unit tests should validate parsing, scales, aggregation, and state rules. Browser tests should validate marks, labels, and interactions. Screenshot tests help catch layout regressions but cannot prove data correctness.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Mobile and touch constraints

Touch devices do not have hover. Support tap-to-select and dismissal, keep targets usable, and avoid tiny circles as the only interaction affordance. If a chart is too dense on mobile, provide a summary and table.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Chart state architecture

Represent loading, success, empty, and error explicitly. Abort old requests or track request identity so a late response cannot overwrite newer filters. Rendering should receive one coherent state object.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```

## Implementation Note: Browser compatibility

Check the actual support matrix for ResizeObserver, pointer events, SVG accessibility, and CSS features. Safari, Firefox, and Chromium can differ in details; feature-detect optional APIs and document fallbacks.

```js
function normalizeState(state) {
  if (state.status === "loading") return { status: "loading", rows: [] };
  if (state.status === "error") return { status: "error", rows: [], error: state.error };
  const rows = (state.rows || []).filter(row =>
    row && row.id != null && Number.isFinite(row.value)
  );
  return { status: rows.length ? "ready" : "empty", rows };
}
```
