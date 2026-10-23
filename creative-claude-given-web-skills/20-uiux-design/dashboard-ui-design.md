# SKILL: dashboard-ui-design

**Layer:** 43 — UI/UX Design

**Goal:** Design dashboards that help people monitor performance, investigate changes, compare metrics, and take action through clear information hierarchy, reliable data visualization, consistent interaction patterns, and accessible responsive layouts.

---

## Why This Matters (Senior Perspective)

A dashboard is not a decorative wall of cards. It is a decision-support interface. People open it because they need to understand what is happening, identify what changed, find the cause, or decide what to do next. A dashboard that looks polished but hides the important metric, makes comparisons difficult, or leaves the user uncertain about data freshness is not successful. The design must connect the user's questions to the information and actions that answer them.

The first design task is to understand the decisions the dashboard supports. An executive overview may prioritize trends, targets, and exceptions. An operations dashboard may prioritize current status, bottlenecks, and urgent work. An analytics workspace may prioritize filters, comparisons, segmentation, and drill-down. These are different jobs, even if they all use cards and charts. Choose components only after the questions, users, update cadence, and available data are understood.

Visual hierarchy is especially important because dashboards have high information density. The most important metric should be identifiable quickly, but not every metric should be large or brightly colored. Users need a stable relationship between summary, context, trend, and detail. A KPI without a time period, unit, baseline, or target can be misleading. A chart without clear axes or labels can look attractive while making comparison harder. A red indicator without a defined meaning may cause unnecessary alarm. The interface should show what is known, what is estimated, when it was updated, and what the user can do next.

Senior dashboard design also treats uncertainty and failure as first-class states. Data may be delayed, partial, missing, stale, filtered to an empty result, or unavailable because a service failed. A loading skeleton is not an answer to every state. The user needs a clear distinction between loading, no data, no matching results, access denied, and a failed request. When possible, explain the next action: change a filter, retry, inspect a source, or contact an administrator. Never fill missing values with invented numbers simply to preserve a visual layout.

A dashboard is an operational product, so accessibility and responsive behavior are not optional. Tables need meaningful headers; charts need summaries or data alternatives where appropriate; keyboard focus must remain visible; and status cannot rely on color alone. Dense layouts must reflow at narrow widths without turning every card into a tiny unreadable panel. On touch devices, hover-only interactions and tiny filter targets fail. Performance matters too: dashboards often load multiple datasets, charts, and filters, so prioritize critical information and avoid rendering expensive visualizations unnecessarily.

**Senior perspective:** design the dashboard around decisions and evidence. Every metric, chart, filter, and action should answer a real question, expose its context, or help the user move from observation to action.

---

## Core Concepts

### 1. Start with user questions and decisions

Before sketching cards, list the questions the dashboard should answer. Each question should map to a metric, visualization, table, or action. If a component does not support a user question, it may be unnecessary.

```text
User question: Are we on track this month?
Evidence: current result, target, previous period, trend
User question: What caused the change?
Evidence: segment breakdown and drill-down
User question: What needs attention now?
Evidence: prioritized exceptions with next actions
```

Separate monitoring questions from investigation questions. Monitoring needs fast recognition; investigation needs filters, comparisons, and access to details.

### 2. Define each KPI completely

A metric is not just a number. It needs a name, value, unit, time window, comparison or target where relevant, and a clear definition. Context prevents users from comparing incompatible periods or misreading an absolute value as a rate.

```text
Metric: Completed requests
Value: 1,284
Period: 1–31 October
Comparison: 8% above the previous month
Definition: Requests marked completed in the selected period
```

Use realistic units and explain calculated metrics when the definition is not obvious. If a metric is estimated, label it as an estimate. If data is delayed, show the last updated time.

### 3. Establish a stable hierarchy

A useful default hierarchy is summary, trend, explanation, and detail. The order can change depending on the user's job, but it should be deliberate and consistent.

```text
Top: page title, time range, freshness, key filters
First region: primary KPIs and major exceptions
Middle: trend and comparison charts
Lower region: breakdowns, detailed tables, supporting actions
```

Do not give every chart equal size. Size and placement should reflect importance, frequency of use, and the space needed to interpret the data.

### 4. Use grid and alignment consistently

A dashboard grid helps users compare components and scan between them. Use consistent card padding, heading placement, spacing, and alignment. Allow components to span more columns when the data needs space.

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.25rem;
}

.kpi-card {
  grid-column: span 3;
  min-width: 0;
}

.trend-panel {
  grid-column: span 8;
  min-width: 0;
}

.breakdown-panel {
  grid-column: span 4;
  min-width: 0;
}
```

The `min-width: 0` rule helps grid children shrink rather than overflow because of long intrinsic content. Adjust the grid for the real content and viewport, not just the ideal desktop mockup.

### 5. Make time range and freshness explicit

Metrics often change meaning depending on the selected period. Display the active time range and make it easy to understand how comparisons are calculated. Show when the data was last updated when freshness affects decisions.

```html
<section aria-labelledby="revenue-title">
  <h2 id="revenue-title">Revenue</h2>
  <p>1–31 October · Compared with 1–30 September</p>
  <p>Last updated 10:42 IST</p>
  <strong>₹18.4 lakh</strong>
</section>
```

Avoid implying real-time accuracy if data is batch-updated. Use an accurate timezone and make stale-data warnings visible without obscuring the metric.

### 6. Choose chart types for the question

Use a line chart for change over time, bars for category comparisons, a scatter plot for relationships, and a table when exact values or sorting matter. Pie and donut charts can be difficult to compare when categories are numerous or similar. Choose the simplest representation that answers the question.

```text
Question: How did this metric change each day?
Good fit: line chart with time on the x-axis

Question: Which five categories have the most requests?
Good fit: sorted horizontal bar chart

Question: What are the exact values and owners?
Good fit: sortable table
```

Do not choose a chart because it looks visually impressive. Consider the number of series, data distribution, label density, and whether users need exact comparisons.

### 7. Label charts for interpretation

A chart should communicate its metric, unit, time range, axes, and relevant comparison. Avoid relying on hover tooltips as the only way to understand the visualization, because touch and keyboard users may not be able to access them consistently.

```text
Title: Daily completed requests
Y-axis: Number of requests
X-axis: Day in October
Legend: Current month / Previous month
Caption: Counts include requests completed within the selected date range
```

Use readable labels and sensible tick intervals. If the scale is truncated or uses a logarithmic axis, make that choice explicit where it could change interpretation.

### 8. Use color semantically and redundantly

Color can communicate status or distinguish series, but it should not be the only signal. Pair status colors with labels, icons, patterns, or shape. Keep the meaning of success, warning, and error consistent across the dashboard.

```html
<p class="status status-warning">
  <span aria-hidden="true">!</span>
  <span>Data is delayed. Last successful refresh: 10:42 IST.</span>
</p>
```

Do not use red and green as the sole way to compare values. Test chart palettes for contrast and color-vision accessibility. Avoid using the same accent for unrelated meanings.

### 9. Design filters that explain their scope

Filters should make it clear which data they affect, what values are selected, and how to reset the selection. If several charts share filters, communicate that scope. If a filter applies only to one panel, place it near that panel or label it accordingly.

```text
Global filters: date range, region, business unit
Chart-specific filter: request category
Visible active filters: Region = West, Status = Open
Reset action: Clear all filters
```

Preserve filter state when users drill into details or return from a related view, unless there is a clear reason not to. Avoid controls that change data silently without visible indication.

### 10. Distinguish no data from no matching results

“No data available” may mean the source has not supplied data; “No results match your filters” means data exists but the current selection excludes it. These states need different guidance.

```html
<section aria-labelledby="empty-title">
  <h2 id="empty-title">No results match these filters</h2>
  <p>Try widening the date range or clearing the status filter.</p>
  <button type="button">Clear filters</button>
</section>
```

Do not show a blank chart without explanation. Offer a useful next step when one exists, and avoid claiming that no data exists if the query failed.

### 11. Design loading states around expected work

Loading feedback should tell users that the system is working without making the page feel broken. Skeletons can preserve layout for predictable content, while a compact progress indicator may suit a small refresh. Do not use endless skeletons when a request has failed or timed out.

```html
<section aria-busy="true" aria-labelledby="trend-heading">
  <h2 id="trend-heading">Request trend</h2>
  <p role="status">Loading request trend…</p>
</section>
```

Remove the busy state when loading completes. If a chart takes longer than expected, provide meaningful feedback and a retry option after a failure rather than leaving the user waiting indefinitely.

### 12. Show errors with recovery options

An error state should identify what failed, how much of the dashboard is affected, and what the user can do. A panel-level failure should not necessarily blank unrelated panels.

```html
<section aria-labelledby="trend-error-title">
  <h2 id="trend-error-title">Trend could not be loaded</h2>
  <p>Your KPI summary is still available. Try loading the trend again.</p>
  <button type="button">Retry trend</button>
</section>
```

Keep the last known value only when it is safe and clearly labeled with its timestamp. Never present stale information as current.

### 13. Make tables usable for exact detail

Charts support pattern recognition; tables support precise lookup, sorting, and comparison. Use semantic table markup with captions and headers. Make sort state clear and ensure controls are accessible.

```html
<table>
  <caption>Requests requiring review</caption>
  <thead>
    <tr>
      <th scope="col">Request</th>
      <th scope="col">Owner</th>
      <th scope="col">Status</th>
      <th scope="col">Updated</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">REQ-2048</th>
      <td>Operations team</td>
      <td>Awaiting review</td>
      <td>10:30 IST</td>
    </tr>
  </tbody>
</table>
```

Avoid using spacing characters to simulate columns. Test horizontal overflow on small screens and choose whether to wrap, scroll, or prioritize columns based on user needs.

### 14. Make drill-down predictable

A dashboard should let users move from summary to explanation without losing context. A click on a metric might open a detail page, filter a table, or open a panel; the behavior should be consistent and discoverable.

```text
Summary KPI -> segment breakdown -> filtered records -> record detail
```

Preserve selected date range and other relevant filters during navigation. Use real links for navigation and buttons for in-place actions. Do not make a whole card clickable if it contains nested controls with conflicting actions.

### 15. Design KPI cards with context, not decoration

KPI cards should communicate the value, unit, period, and interpretation. A decorative sparkline is useful only if it accurately represents a meaningful trend. Avoid a large number with no context or a percentage change with no baseline.

```text
Completed requests
1,284
October
↑ 8% compared with September
```

If the comparison is not statistically meaningful or periods differ in length, explain the limitation. Keep number formatting consistent across the dashboard.

### 16. Handle responsive density intentionally

A desktop dashboard may show four KPI cards in a row, while a narrow layout may stack or horizontally scroll them. Preserve reading order and make critical metrics easy to find. Avoid compressing charts until their labels become unreadable.

```css
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 900px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
```

Test real chart libraries at each breakpoint. A chart that simply scales down may need fewer ticks, a summary, or an alternate table view on mobile.

### 17. Make keyboard interaction visible

Every interactive element needs a clear focus state. Dashboard users often rely on keyboard navigation for speed, so focus order should follow the visual workflow and avoid trapping users inside filters or menus.

```css
.dashboard a:focus-visible,
.dashboard button:focus-visible,
.dashboard input:focus-visible,
.dashboard select:focus-visible {
  outline: 3px solid var(--focus-ring, #8bb8ff);
  outline-offset: 3px;
}
```

Do not remove the browser outline without replacing it. Test tab order, Enter and Space behavior, Escape in menus and dialogs, and focus restoration after closing an overlay.

### 18. Make filter controls understandable

Date pickers, multi-selects, search fields, and dropdowns can become complex when combined. Give each control a visible label, preserve selected values, and make clear when results are updated. Avoid placeholder-only labels.

```html
<label for="region-filter">Region</label>
<select id="region-filter" name="region">
  <option value="all">All regions</option>
  <option value="west">West</option>
  <option value="north">North</option>
</select>
```

If applying filters requires a submit action, label it clearly. If filters apply immediately, communicate that behavior and avoid excessive network requests while the user is still choosing values.

### 19. Keep units, formatting, and definitions consistent

Use consistent currency, date, decimal, and percentage formatting. A metric should not switch between lakh, million, and raw values without a reason. Definitions should be available when terms are ambiguous.

```text
₹18.4 lakh — Indian currency format
18.4% — percentage, not a raw count
1,284 requests — count with thousands separator
1–31 October — explicit date window
```

Use locale-aware formatting in code when the product supports multiple locales. Explain derived metrics such as conversion rate or utilization when users could interpret them differently.

### 20. Make refresh and data freshness transparent

Refresh controls should indicate whether they refresh one panel or the entire dashboard. Automatic refresh should not unexpectedly reset filters, scroll position, or active selections.

```text
Updated 10:42 IST
[Refresh data]
```

If a refresh fails, retain the last successful timestamp and explain that the data may be stale. Avoid implying that a refresh button makes data real-time if the upstream source updates only periodically.

### 21. Use tooltips carefully

Tooltips can explain definitions or reveal secondary information, but they should not contain essential instructions or be the only way to read a chart value. Provide equivalent access on touch and keyboard.

```html
<button type="button" aria-describedby="rate-help">
  Conversion rate
</button>
<p id="rate-help">Completed conversions divided by eligible visits.</p>
```

The example uses persistent explanatory text; a production tooltip may use a different interaction pattern, but it must still be accessible. Avoid tooltips that disappear before users can move the pointer onto them.

### 22. Design dashboard navigation around tasks

Group navigation by user goals rather than internal department names when possible. Current location should be clear, and labels should remain meaningful outside the context of a sidebar.

```html
<nav aria-label="Main navigation">
  <a href="/overview" aria-current="page">Overview</a>
  <a href="/requests">Requests</a>
  <a href="/reports">Reports</a>
</nav>
```

Use semantic links for destinations and buttons for expandable controls. At narrow widths, make the navigation toggle accessible and ensure the expanded menu does not obscure important content without a clear way to close it.

### 23. Avoid misleading chart scales and comparisons

A chart can mislead without containing incorrect numbers. Truncated axes, inconsistent periods, mixed units, and unexplained normalization change the visual meaning of a comparison. Make the scale choice deliberate and label unusual choices.

```text
Before publishing a chart:
- Confirm the unit and time range
- Check axis minimum and maximum
- Verify comparable periods
- Label estimates and missing values
- Confirm aggregation and timezone
```

A zero baseline is important for many bar charts, especially when comparing magnitudes. Other chart types may use a different scale when justified, but the choice should not obscure the interpretation.

### 24. Build a design system for dashboard components

A reusable dashboard system should include KPI cards, filters, chart frames, table states, alerts, empty states, and loading patterns. Each component needs documented states, responsive behavior, and accessibility expectations.

```css
:root {
  --dashboard-gap: 1.25rem;
  --panel-padding: 1.25rem;
  --panel-radius: 0.875rem;
  --panel-border: #d7dce3;
  --focus-ring: #245bd7;
}

.dashboard-panel {
  min-width: 0;
  padding: var(--panel-padding);
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-radius);
}
```

Tokens should be semantic and shared. Avoid local hard-coded variants that gradually cause the same component to look different across pages.

### 25. Consider permission and partial-data states

Some users may not have access to every dataset. Others may have partial results because one source is unavailable. Distinguish permission errors from empty data and service failures.

```text
Permission state: “You do not have access to this report.”
Partial state: “Two of five sources loaded. Values may be incomplete.”
Empty state: “No records exist for this period.”
Failure state: “The report could not be loaded. Retry.”
```

Do not reveal sensitive record details in an access-denied state. Offer a legitimate next step, such as requesting access, when the product supports it.

### 26. Debug dashboards in DevTools

Dashboard bugs often arise from overflowing content, incorrect chart container dimensions, stale network responses, or CSS specificity conflicts. Inspect the rendered page rather than relying on the design file.

```text
DevTools checklist
1. Inspect computed dimensions and overflow on each grid child.
2. Check console errors and failed network requests.
3. Inspect chart container width after filters open.
4. Verify focus styles and keyboard order.
5. Test zoom and narrow viewports.
6. Confirm the selected filter matches the displayed query.
7. Check timestamps and timezone formatting.
8. Inspect stale data and retry behavior.
```

Use realistic datasets. Long labels, empty series, large values, negative values, and slow requests often expose problems that a demo dataset hides.

### 27. Make dashboards resilient to real data

Production data is not always tidy. Labels can be long, values can be zero or negative, series may be missing, and records can arrive late. Components should have explicit behavior for these cases.

```text
Edge-case test data:
- zero results
- missing comparison period
- negative variance
- very large value
- long category label
- null timestamp
- delayed source
- partial response
```

Do not replace missing data with zero unless zero is the true value. Use “not available” or a defined missing-value representation and explain what the gap means.

### 28. Evaluate whether every component earns its space

A dashboard accumulates components over time as stakeholders request more metrics. Periodically ask whether each panel supports a recurring decision, provides necessary context, or enables a useful action. Remove or demote components that no longer serve the user.

```text
For each panel, ask:
- Who uses this information?
- What decision does it support?
- How often is it used?
- Is the same information shown elsewhere?
- What happens if it is removed?
```

Do not remove rare but critical operational information solely because it receives fewer clicks. Combine quantitative usage with risk, user interviews, and the importance of the task.

---

## Relevant Patterns

### Pattern 1: KPI with context

**What it does:** presents a metric alongside its unit, period, comparison, and definition.

**When to use it:** executive overviews, operational summaries, and recurring performance reports.

```text
Completed requests
1,284 requests
October
8% above September
Definition: requests completed within the selected period
```

Use consistent formatting and ensure the comparison uses equivalent periods.

### Pattern 2: Summary-to-detail flow

**What it does:** lets users move from a high-level signal to the records or segments that explain it.

**When to use it:** dashboards used for investigation rather than passive monitoring.

```text
KPI -> trend -> segment breakdown -> filtered table -> record detail
```

Preserve relevant filters and period context throughout navigation.

### Pattern 3: Global filter contract

**What it does:** makes the scope of shared filters explicit across panels.

**When to use it:** dashboards where date, region, team, or status affects multiple visualizations.

```text
Selected filters:
Date: October
Region: West
Status: Open
Scope: All panels except the separately labeled service-health widget
```

Make exceptions visible. Do not let panels silently disagree about the active filter state.

### Pattern 4: Explicit data-state panel

**What it does:** distinguishes loading, empty, no-match, stale, denied, and failed states.

**When to use it:** every dashboard panel that depends on asynchronous data.

```text
Loading -> show progress
No records -> explain the empty result
No filter matches -> offer filter reset
Stale -> show last successful update
Denied -> explain access limitation
Failed -> explain and offer retry
```

Keep the state specific to the affected panel when other data remains usable.

### Pattern 5: Chart plus accessible summary

**What it does:** gives users a concise textual interpretation and, where appropriate, a data table alternative to the visual chart.

**When to use it:** charts containing meaningful trends or comparisons that must be accessible beyond visual inspection.

```html
<figure>
  <figcaption>Daily completed requests increased from 82 to 109.</figcaption>
  <div aria-label="Daily completed requests chart">
    <!-- Render the chart using an accessible charting approach. -->
  </div>
</figure>
```

Do not claim that a generic `aria-label` makes a complex chart fully accessible. Provide a useful summary and an accessible way to inspect the underlying values.

### Pattern 6: Independent panel failure

**What it does:** lets unaffected parts of a dashboard remain usable when one data source fails.

**When to use it:** dashboards combining several APIs or independent report queries.

```text
KPI summary: loaded
Trend chart: failed, retry available
Requests table: loaded
Source freshness: displayed per panel where necessary
```

Do not present a partial dashboard as fully current. Make the failed panel and any affected conclusions explicit.

### Pattern 7: Responsive density shift

**What it does:** changes grid density and visualization treatment based on available space rather than merely shrinking desktop components.

**When to use it:** dashboards used on laptops, tablets, and phones.

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 850px) {
  .dashboard-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 540px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}
```

At small widths, simplify chart ticks and provide alternate detail access rather than shrinking labels until they become unreadable.

### Pattern 8: Dashboard regression suite

**What it does:** protects important layouts and data states from accidental changes.

**When to use it:** shared component libraries, frequent releases, and data-heavy products.

```text
Test baseline -> test realistic data -> test edge cases
-> test keyboard and responsive behavior -> compare output
-> record and verify fixes
```

Include zero, missing, stale, delayed, and error states—not only the ideal populated view.

---

## Common Mistakes

| Mistake | Why It Happens | Fix |
|---|---|---|
| Building cards before defining decisions | Dashboard conventions are copied without a user question | Map every panel to a specific question or action |
| Showing a KPI without a period | The number looks self-explanatory | Add time range, unit, and relevant comparison |
| Using too many equally prominent charts | Stakeholders request equal visibility | Rank panels by decision importance and frequency |
| Choosing charts for visual novelty | Chart aesthetics are prioritized over comparison | Select the simplest chart type that answers the question |
| Relying on color alone | Status colors seem fast to scan | Pair colors with text, icons, shape, or direct labels |
| Hiding data freshness | The page appears cleaner without timestamps | Show last-updated context when freshness affects decisions |
| Treating missing values as zero | Zero keeps chart layouts simple | Use an explicit missing-value state unless zero is accurate |
| Showing a blank panel after failure | Error handling is left until implementation | Design error, retry, and partial-data states up front |
| Confusing no data with no filter matches | All empty results look similar | Explain the actual condition and provide a relevant recovery action |
| Making hover the only chart interaction | Desktop pointer use is assumed | Provide accessible labels, summaries, and alternative value access |
| Using tiny tables on mobile | Desktop layouts are scaled down | Reflow, allow controlled horizontal scrolling, or prioritize columns |
| Making every card clickable | Whole-card interaction seems convenient | Use explicit links and buttons with unambiguous action boundaries |
| Using inconsistent number formats | Components are built by separate teams | Define locale, unit, rounding, and date-formatting rules |
| Truncating axes without explanation | Small differences become more visible | Use an appropriate baseline and label unusual scales |
| Resetting filters during drill-down | Navigation state is not modeled | Preserve relevant filters and period context |
| Overloading the dashboard with filters | Every stakeholder requests a control | Prioritize high-value filters and group advanced options |
| Ignoring partial source failures | The page is treated as one request | Isolate panel states and disclose incomplete data |
| Removing focus outlines | Browser defaults do not match the visual style | Implement and test a visible `:focus-visible` state |
| Forgetting accessible table semantics | Tables are styled as generic grids | Use captions, headers, and appropriate scope attributes |
| Using tooltips for essential information | They reduce visual clutter in mockups | Keep core meaning visible and make supplementary details accessible |
| Letting auto-refresh disrupt the user | Refresh behavior is implemented globally | Preserve filters, selection, and scroll context where possible |
| Using a decorative sparkline without meaning | Cards appear more polished with charts | Include a sparkline only when it conveys a real trend |
| Ignoring realistic data extremes | Design review uses ideal sample values | Test long labels, large numbers, nulls, negative values, and zero |
| Making all warnings red | Color is used as a universal alert | Use semantic severity levels and explain the consequence |
| Treating a visual scan as an accessibility audit | The layout looks clear to the designer | Test keyboard, semantic structure, contrast, and non-color cues |
| Failing to inspect network and console errors | The mock data path works locally | Test actual requests and document failure recovery |
| Using local hard-coded component colors | Tokens are bypassed under deadline pressure | Centralize semantic tokens and audit component variants |
| Hiding access restrictions as empty data | Permission state is not modeled | Distinguish denied, empty, stale, and failed states |
| Removing rarely used but critical information | Click counts are used as the only priority metric | Include task risk and operational importance in the review |
| Declaring success from a screenshot | Runtime behavior is assumed to match the design | Verify live data, focus, filters, loading, and responsive states |

---

## Mental Models

1. **A dashboard is a decision instrument** — Every panel should support a question, interpretation, or action.
2. **A number without context is an incomplete claim** — Period, unit, baseline, definition, and freshness determine its meaning.
3. **Summary and detail serve different cognitive jobs** — Recognition surfaces the signal; drill-down helps explain it.
4. **Hierarchy is a budget** — The most prominent components should correspond to the most important decisions.
5. **Data states are part of the interface** — Loading, empty, stale, partial, denied, and failed are distinct user experiences.
6. **Filters define a contract** — Users should know which information changes when a filter changes.
7. **Charts are arguments about data** — Scales, labels, aggregation, and time windows influence interpretation.
8. **Color is a redundant signal** — Text, icons, patterns, and labels should preserve meaning when color is not perceived.
9. **Responsive design changes density, not purpose** — Mobile layouts must retain the user's priority and access to detail.
10. **Freshness is part of truthfulness** — Stale data must not masquerade as current data.
11. **A dashboard is only as reliable as its edge states** — Missing and failed data are inevitable production conditions.
12. **Measurement must connect to decisions** — Usage data should be combined with risk, research, and task importance.
13. **Accessibility is functional quality** — Semantic tables, keyboard access, focus, and chart alternatives make the dashboard usable.
14. **Every panel must earn its space** — More visible metrics do not automatically create better decisions.

---

## Quick Reference

| Area | Check | Evidence |
|---|---|---|
| Purpose | Does each panel answer a user question? | Panel-to-question map |
| KPI | Is value paired with unit and period? | Metric specification |
| Freshness | Is last update visible when relevant? | Timestamp and stale state |
| Hierarchy | Are primary metrics and exceptions prioritized? | Scan test |
| Grid | Do panels align and avoid overflow? | Responsive layout review |
| Charts | Does the type match the question? | Rationale for each visualization |
| Labels | Are axes, units, periods, and series clear? | Chart audit |
| Filters | Is scope and selected state visible? | Filter-state review |
| Empty state | Is no data distinct from no matching results? | State test |
| Failure | Can users recover from a failed panel? | Retry and partial-data behavior |
| Tables | Are headers and row labels semantic? | Keyboard and screen-reader review |
| Drill-down | Are relevant filters preserved? | Navigation test |
| Color | Is meaning reinforced beyond hue? | Non-color state review |
| Focus | Is keyboard focus visible? | `:focus-visible` audit |
| Responsive | Does information remain readable on small screens? | Viewport test |
| Data integrity | Are missing and extreme values handled honestly? | Edge-case dataset |
| Performance | Are charts and requests efficient? | DevTools network and rendering review |
| Governance | Are tokens and definitions consistent? | Design-system documentation |

---

## Build Challenge

Design a dashboard for an operations team that monitors request completion, backlog, response time, and work requiring attention. The dashboard should support both quick monitoring and deeper investigation. Use realistic example data, clearly label any synthetic data, and document what would need to be connected to production sources.

### Requirements

1. **Write the user-question brief.** Identify the primary user, the decisions they make, and the questions the dashboard must answer.
2. **Define four to six KPIs.** Specify each metric's name, unit, period, definition, and comparison or target where relevant.
3. **Create a clear hierarchy.** Put high-priority signals and exceptions first, followed by trends, breakdowns, and detailed records.
4. **Build a responsive grid.** Ensure cards and charts do not overflow when labels and values are long.
5. **Add a time-range control.** Show the active range and comparison period, and make the filter scope clear.
6. **Build two meaningful visualizations.** Choose chart types based on the question and label axes, units, series, and time windows.
7. **Create a semantic detail table.** Include a caption, column headers, row identifiers, and meaningful status text.
8. **Implement summary-to-detail navigation.** Allow a user to move from a KPI or chart to filtered records while preserving relevant context.
9. **Design all data states.** Include loading, empty, no-match, stale, partial, denied, and failed states where applicable.
10. **Make filters accessible.** Use visible labels, understandable defaults, a clear reset action, and predictable application behavior.
11. **Build keyboard focus states.** Ensure links, buttons, filters, menus, and dialogs have visible focus indicators.
12. **Test non-color signals.** Make status, selected state, and chart meaning understandable without relying only on hue.
13. **Test realistic data edges.** Include zero, negative variance, large numbers, long labels, missing timestamps, and delayed sources.
14. **Review responsive behavior.** Test wide, medium, and narrow viewports; decide how charts and tables remain useful.
15. **Inspect runtime behavior.** Use DevTools to check console errors, failed requests, layout overflow, and computed styles.
16. **Document metric definitions.** Make clear how each metric is calculated and what source or update cadence it depends on.
17. **Define a regression checklist.** Include data states, filters, keyboard use, responsive behavior, and freshness.
18. **Separate synthetic from production data.** Label sample data clearly and identify the source integrations required before launch.

### Failure and edge conditions

The challenge fails if a KPI lacks its unit or time period, charts use misleading scales, or missing data is silently represented as zero. It also fails if one failed data source blanks unrelated panels, filter scope is unclear, focus is invisible, chart values are available only through hover, or mobile layout makes critical information unreadable. A dashboard that looks polished but misrepresents freshness or partial data is not production-ready.

### Definition of Done

- The primary user and decisions are documented.
- Each KPI has a definition, unit, period, and relevant comparison.
- Hierarchy reflects decision importance rather than card uniformity.
- Chart type, axes, labels, and scales support accurate interpretation.
- Filters expose selected values and scope.
- Summary-to-detail navigation preserves relevant context.
- Loading, empty, no-match, stale, partial, denied, and failure states are distinct.
- Table markup uses semantic captions and headers.
- Status and selection remain understandable without color alone.
- Keyboard focus is visible and follows a logical order.
- Responsive layouts preserve the usefulness of charts and tables.
- Edge-case values are tested without inventing or hiding data.
- DevTools review covers console, network, overflow, and computed styles.
- Metric definitions and data freshness are documented.
- Synthetic sample data is clearly labeled.
- A regression checklist and production integration plan are included.
