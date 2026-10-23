# Recharts and Chart.js Patterns

## Skill Metadata

- **Skill name:** `recharts-chartjs-patterns`
- **Layer:** `layer-19-data-viz`
- **Primary focus:** Build trustworthy, accessible, responsive, testable data visualizations with Recharts or Chart.js.
- **Use when:** A React application needs charts for trends, comparisons, distributions, composition, operational metrics, or dashboards.
- **Do not use as:** A reason to add a chart where a concise number, table, or explanation communicates the data better.
- **Core principle:** Choose the chart and library based on the question, preserve the meaning of the data, and make uncertainty, missingness, and interaction behavior explicit.

## Goal

Create chart components that communicate a clear analytical message without hiding data quality problems or making unsupported visual claims. Recharts is a React-oriented component API that fits naturally into React composition and declarative state. Chart.js is a canvas-based charting library with a configurable dataset-and-options model and a plugin system. Both can produce useful charts, but they are not interchangeable in every implementation detail.

This skill teaches the developer to select an appropriate library, define a data contract, transform data safely, choose meaningful encodings, make charts responsive and accessible, implement interactions, test the result, and keep the chart maintainable in production.

## Why This Matters

A chart is an interface to evidence. A visually polished graph can still be wrong if it silently drops records, sorts dates lexicographically, compares incompatible units, truncates an axis in a misleading way, or presents missing values as zero. A chart can also be technically correct but unusable when labels are clipped, colors are indistinguishable, tooltips are inaccessible, or the visual does not answer the user's actual question.

A strong implementation has four properties:

1. **Semantic correctness:** the selected chart, scale, grouping, and labels match the data and question.
2. **Operational correctness:** loading, empty, error, and partial-data states are handled deliberately.
3. **Interaction clarity:** hover, focus, click, filtering, legends, and drill-down behavior are consistent.
4. **Maintainability:** chart options, formatting, transformations, and component boundaries are understandable and testable.

## 1. Start With the Question, Not the Library

Before writing chart code, state the question in one sentence. Examples:

- How has monthly revenue changed over the past year?
- Which product categories account for the most orders?
- How do actual values compare with the target?
- What is the distribution of response times?
- Which segment contributes most to the total?
- Did the conversion rate change after a release?

The question narrows the chart choice. A time trend usually needs a line or area chart. Category comparisons often work best with bars. Part-to-whole comparisons may use a stacked bar or, when there are few categories, a pie or donut. Distributions may need a histogram, box plot, or dot plot. Relationships between two numeric variables may call for a scatter plot.

Do not pick a chart because it is easy to implement or looks impressive. A 3D chart, decorative gradient, or animated transition does not improve analytical accuracy by itself.

### A decision checklist

- What is the primary question?
- What are the observations?
- Which fields define time, category, group, or value?
- What units are used?
- Is the comparison absolute, relative, cumulative, or normalized?
- Is the dataset small enough for individual marks to remain meaningful?
- What should the reader notice first?
- What is the appropriate fallback if the data cannot answer the question?

If the question cannot be stated clearly, pause and clarify the intended analysis before building the visualization.

## 2. Choose Recharts or Chart.js Deliberately

### Recharts is a good fit when

- The application is already built with React.
- The chart should be composed from React components such as `LineChart`, `XAxis`, `YAxis`, `Tooltip`, `Legend`, `Line`, and `ResponsiveContainer`.
- React props and state should directly control chart structure.
- The team prefers declarative component composition and straightforward customization.
- The chart needs to fit the surrounding React component architecture.

### Chart.js is a good fit when

- The application benefits from a canvas-based chart renderer.
- The team wants to define chart data as labels and datasets, then configure behavior through options.
- The desired chart type or plugin exists in the Chart.js ecosystem.
- A canvas renderer is appropriate for the expected number of marks and visual requirements.
- The team is comfortable managing registration, dataset objects, options, and plugin behavior.

### Selection rules

| Consideration | Recharts | Chart.js |
|---|---|---|
| Main model | React component composition | Data/configuration objects rendered to canvas |
| React integration | Direct and declarative | Commonly through a React wrapper such as `react-chartjs-2` |
| Custom chart structure | Compose supported chart elements | Configure supported types, options, plugins, or custom drawing |
| DOM semantics | SVG-based chart elements are inspectable in the DOM | Canvas pixels do not expose individual marks as ordinary DOM nodes |
| Styling | Component props, SVG attributes, CSS, and custom components | Options, plugins, canvas drawing, and wrapper props |
| Accessibility approach | Still needs deliberate labels and keyboard support | Needs a textual/DOM alternative because canvas alone is not a complete accessible representation |
| Best first question | Does component composition fit the app? | Does the canvas/configuration model fit the chart? |

This table is a guide, not a universal benchmark. Performance depends on chart type, data volume, rendering frequency, device, and implementation. Measure with representative data before making performance claims.

## 3. Define a Stable Data Contract

Do not pass arbitrary API responses directly into chart components. Separate transport data, validated application data, chart-ready data, and presentation.

A chart-ready record should use predictable field names and explicit units. For example:

```ts
type MonthlyRevenue = {
  month: string;       // ISO date such as "2026-01-01"
  revenue: number;     // amount in the documented currency
  target?: number | null;
};
```

The contract should answer:

- Is `month` a date, a month label, or an arbitrary string?
- Does `revenue` represent dollars, rupees, thousands, or millions?
- Is a missing `target` unknown, not applicable, or intentionally omitted?
- Are negative values valid?
- Are duplicate months allowed?
- Is the series already aggregated?
- Does the server return sorted records?
- What timezone defines the reporting period?

Do not infer these semantics from field names alone. Document them at the boundary where the API response is transformed.

### Validate at the boundary

```ts
type ApiRevenueRow = {
  month: string;
  revenue: number | string;
  target?: number | string | null;
};

type RevenuePoint = {
  month: string;
  revenue: number;
  target: number | null;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeRevenue(rows: ApiRevenueRow[]): RevenuePoint[] {
  return rows.flatMap((row) => {
    const revenue = toFiniteNumber(row.revenue);
    if (revenue === null) return [];

    const target =
      row.target === null || row.target === undefined
        ? null
        : toFiniteNumber(row.target);

    return [{
      month: row.month,
      revenue,
      target,
    }];
  });
}
```

This example demonstrates a boundary transformation; a production implementation should also validate the date format, report rejected rows, and decide whether invalid values should fail the whole request or be excluded with a visible data-quality warning. Silently dropping invalid records can mislead readers.

## 4. Parse, Sort, and Aggregate Data Safely

### Parse dates as dates

Strings such as `"Jan"`, `"Feb"`, and `"Mar"` are labels, not reliable chronological keys across years. ISO dates are easier to validate and sort. If the chart uses a date axis, convert values into the representation expected by the chart library and specify the intended timezone and granularity.

Never rely on locale-dependent string sorting for dates. `"2026-10-01"` and `"2026-2-01"` may sort incorrectly if values are not consistently formatted.

### Sort explicitly

```ts
const sortedPoints = [...points].sort(
  (a, b) => Date.parse(a.month) - Date.parse(b.month)
);
```

Copy before sorting if the array may be shared with React state or another consumer. Mutating an array in place can create difficult-to-diagnose rendering bugs.

### Aggregate at the right level

When the source has transaction-level rows but the chart asks for monthly revenue, group by month and sum the relevant numeric field. Do not sum rates or averages indiscriminately. The correct aggregation depends on the metric:

- Revenue: usually sum.
- Number of orders: usually count or sum of order counts.
- Conversion rate: calculate from the underlying numerator and denominator, not by averaging rates unless that average is explicitly intended.
- Average response time: preferably derive from total response time divided by count, when available.
- Unique users: requires distinct counting, not summing daily unique-user counts.
- Percentages: specify the denominator and aggregation rule.

### Avoid accidental double aggregation

If the API already returns monthly totals, summing the monthly rows again is usually wrong. A data contract should indicate the grain of each row: transaction, user, day, month, account, or another unit.

## 5. Handle Missing, Invalid, and Zero Values Differently

Zero is a valid measurement in many domains. Missing data means a measurement is unavailable or not reported. Invalid data fails validation. These are not equivalent.

- `0`: known value of zero.
- `null` or absent field: unknown, unavailable, or not applicable, depending on the contract.
- `NaN` or infinity: invalid numeric value for most chart scales.
- Empty array: no observations are available for the requested query.
- Partial series: some expected observations are missing.

Do not replace every missing value with zero simply to make a chart render. That invents data and can create false drops or false stability.

For a time series, decide whether a missing point should create a visible gap, be omitted, be interpolated, or be treated as zero. Interpolation is a domain decision, not a styling convenience. If the chart bridges missing intervals, make that behavior clear.

### Missing-data checklist

1. Determine whether missingness is expected.
2. Decide whether to show a gap, annotation, or explicit “not reported” state.
3. Preserve valid zero values.
4. Avoid drawing a line across a gap unless the analytical interpretation supports it.
5. Explain partial coverage when it materially affects interpretation.
6. Test the chart with missing values at the beginning, middle, and end of a series.

## 6. Select the Correct Chart Type

### Line chart

Use for trends across ordered values, most often time. Keep the x-axis ordering meaningful and avoid connecting unrelated categories as if they were continuous.

### Bar chart

Use for comparing categories. Bars should generally share a meaningful baseline; for ordinary magnitude comparisons, zero is usually the safest baseline. Horizontal bars help when category names are long.

### Stacked bar or area chart

Use when both total magnitude and composition matter. A normalized 100% stacked chart compares composition but hides total size, so label that tradeoff.

### Scatter plot

Use for relationships between two numeric variables. Dense point clouds may need transparency, aggregation, sampling, or a density representation. Do not infer causation from correlation.

### Pie or donut chart

Use only when there are few mutually exclusive categories that add up to a meaningful whole. Many slices, similar values, and long labels make comparisons difficult. For precise ranking, a sorted bar chart is usually clearer.

### Histogram

Use to understand a numeric distribution. Bin size affects the apparent shape; document or justify the binning rule when it matters.

### KPI card

A KPI card is appropriate when the primary question is “what is the current value?” Add context such as a comparison period, target, or sparkline only when it helps interpretation. Do not turn every number into a chart.

## 7. Recharts: A Clean Declarative Pattern

Install the package using the package manager and version policy already used by the project. Keep chart code within the application's existing React and TypeScript conventions.

A minimal responsive line chart:

```tsx
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = {
  month: string;
  revenue: number;
};

type RevenueChartProps = {
  data: Point[];
};

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <section aria-labelledby="revenue-title">
      <h2 id="revenue-title">Monthly revenue</h2>
      <p>Revenue by reporting month, in the configured currency.</p>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 12, right: 20, bottom: 8, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
```

This is a starting point, not a complete production component. It assumes `data` is validated and already sorted. Production code should add meaningful tick formatting, a useful tooltip, loading/empty/error states, and an accessible textual summary or data table. It should also avoid a fixed-height layout that breaks the page's responsive rules.

### Recharts composition principles

- Keep chart data transformations outside the visual markup when they can be unit-tested independently.
- Give each axis a clear data key and a label or nearby explanation when the units are not obvious.
- Use `name` and formatting functions to present domain language rather than raw field names.
- Keep gridlines subtle enough not to compete with the data.
- Use `dot={false}` for dense time series when dots create clutter; use visible points when individual observations matter.
- Choose interpolation deliberately. Smooth curves can imply values between measurements that were never observed.
- Use stable React keys when rendering custom elements or related lists.
- Avoid creating a new transformed dataset on every render when it is expensive; use memoization when profiling or data size justifies it.
- Keep responsive container dimensions valid. A parent with no measurable height can cause the chart to render at zero height.

## 8. Recharts Axes and Formatting

Axis labels should communicate units and scale. A tick such as `2.5M` is useful only if the reader knows what is being measured. If the chart uses a shortened scale, make the unit explicit in the axis label, subtitle, or nearby explanatory text.

```tsx
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat("en-IN", {
  notation: "compact",
  maximumFractionDigits: 1,
});
```

Example use:

```tsx
<YAxis
  tickFormatter={(value: number) => compactFormatter.format(value)}
  width={72}
/>
```

The exact formatter should follow the product's locale and currency requirements. Do not hardcode `INR` just because the developer is in India if the chart represents another market.

### Domain and baseline

For a bar chart, a truncated axis can exaggerate small differences. For a line chart, a non-zero baseline can be appropriate when showing variation around a meaningful operating range, but the chart must make that choice legible and avoid implying a larger absolute change than occurred.

Do not force the same domain across unrelated charts unless comparability is a real requirement. Conversely, when comparing the same metric across small multiples, inconsistent scales can hide or exaggerate differences. Decide based on the analytical task and label the choice.

## 9. Recharts Tooltips, Legends, and Custom Content

A tooltip should answer: what observation is this, what is its value, and what units apply? For a multi-series chart, it should make the series names and values unambiguous.

Avoid showing raw timestamps, raw database keys, or unformatted decimals if the product language uses readable dates and domain-specific units. For financial metrics, use the correct currency. For rates, include percent signs and clarify whether values are fractions or percentages.

Custom tooltip components should handle the inactive state and incomplete payload safely. Do not assume every tooltip invocation has a non-empty payload. If a custom tooltip includes interactive controls, ensure the user can reach and operate them with a keyboard; hover-only controls are insufficient.

A legend is useful when the reader needs to distinguish multiple series. It becomes noise when there is only one series with a clear label. If clicking legend entries hides a series, reflect that state visually and make the behavior discoverable. Do not make a legend appear clickable if it is merely descriptive.

## 10. Chart.js: Register What You Use

Chart.js is modular. In a typical application, register the chart elements, scales, and plugins required by the selected chart type. Keep registration in a shared chart setup module rather than repeating it unpredictably in multiple components.

Example with a React wrapper:

```tsx
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);
```

The exact registration set depends on the chart type. A bar chart needs bar elements; time scales may need an appropriate date adapter; a chart using filler behavior needs the relevant plugin. Consult the installed library version's documentation when the API differs.

### Chart.js data model

```tsx
const data = {
  labels: ["Jan", "Feb", "Mar", "Apr"],
  datasets: [
    {
      label: "Revenue",
      data: [12000, 15000, 14200, 17800],
      borderColor: "#2563eb",
      backgroundColor: "rgba(37, 99, 235, 0.12)",
      tension: 0.2,
    },
  ],
};
```

This is illustrative sample data only. Real values should come from a validated data source. Keep labels and dataset values aligned: a mismatched array can create missing or misleading points.

## 11. Chart.js Options and Component Boundaries

A maintainable chart separates data, options, and presentation. Avoid a single component with hundreds of inline options mixed with API parsing, filtering, and business logic.

```tsx
const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: "bottom" as const,
    },
    tooltip: {
      intersect: false,
      mode: "index" as const,
    },
  },
  scales: {
    x: {
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
    },
  },
};
```

The example uses `maintainAspectRatio: false` because the surrounding container is expected to define a height. Without a valid container height, the chart may collapse or render unexpectedly. Use the options that match the chart's analytical purpose; `beginAtZero` is a choice that is usually appropriate for bar comparisons but not a universal rule for every chart.

### Keep options stable when appropriate

React wrappers may update the underlying chart when data or options references change. Creating large nested option objects on every render can trigger avoidable work. Use stable module-level options for static configuration or memoize options that depend on props. Do not add memoization automatically to every object; confirm that it improves the real component.

## 12. Responsive Layout and Small Screens

Charts must remain useful in narrow containers, not merely shrink without overflowing. On small screens:

- Reduce the number of visible ticks rather than allowing labels to overlap.
- Use horizontal bars for long category labels.
- Consider a scrollable plot only when preserving detail is more useful than fitting the entire plot.
- Keep tooltip content concise and avoid placing it offscreen.
- Provide a summary or table when dense marks are not readable.
- Ensure the chart does not push primary controls below an unreasonable amount of content.
- Check landscape and portrait layouts, not just one desktop screenshot.
- Avoid relying on hover as the only way to reveal values on touch devices.

Recharts commonly uses `ResponsiveContainer`; Chart.js commonly uses `responsive: true` with a parent container whose dimensions are intentionally managed. Both approaches depend on a sound layout around the chart.

## 13. Accessibility Is Part of the Chart

A canvas or SVG chart is not automatically accessible just because the surrounding page is built with React. The implementation should provide a concise accessible title, an explanation of what the chart shows, and an alternative way to understand the values.

Minimum practices:

1. Put the chart in a named section or region when it is a meaningful page landmark.
2. Add a visible heading and a short description that states the metric, period, and units.
3. Use labels that make series distinctions understandable without color alone.
4. Provide a data table or an equivalent textual summary for important values.
5. Ensure the key conclusion does not depend exclusively on color, hover, or animation.
6. Respect reduced-motion preferences when transitions are substantial.
7. Test keyboard navigation and screen-reader output with the actual implementation.
8. Ensure custom controls have visible focus styles and accessible names.
9. Do not place essential explanatory text only inside a tooltip.
10. If the chart is decorative, mark it accordingly and avoid exposing meaningless duplicate content.

### Do not use color as the only signal

A red and green series may be difficult to distinguish for some users and can have different cultural meanings. Combine color with direct labels, line styles, symbols, or textual values where practical. Use adequate contrast for marks and labels against their backgrounds.

### Text alternative

A chart summary might say: “Revenue rose from ₹1.2 lakh in January to ₹1.8 lakh in April, with a dip in March.” This summary should be generated from actual data or written carefully by the application logic. Do not hardcode a narrative that can become stale when data changes.

## 14. Loading, Empty, Error, and Partial States

A production chart is more than its successful render.

### Loading

Show a stable skeleton or loading message that preserves layout. If the chart occupies a large region, avoid a sudden page shift when data arrives. Use a live region only when announcing the update is genuinely useful; repeatedly announcing rapid refreshes can become disruptive.

### Empty

Explain that there are no observations for the selected filters or reporting period. Do not show a blank axis with no explanation. Offer a next step if the user can change filters or expand the date range.

### Error

Display a useful error message and a retry path where appropriate. Do not render fabricated sample values as if they were live results. Development-only fallback data should be clearly isolated from production behavior.

### Partial data

If some records failed validation or the backend reports incomplete coverage, communicate the limitation. A chart that renders the remaining points without warning may be technically convenient but analytically misleading.

### State model

```ts
type ChartState<T> =
  | { status: "loading" }
  | { status: "success"; data: T[] }
  | { status: "empty" }
  | { status: "error"; message: string };
```

This discriminated union makes it harder to accidentally treat a failed request as a successful empty dataset. In a real application, partial-data metadata may be a separate field on the success state.

## 15. Filtering and Coordinated Charts

Dashboard filters should have clear scope. A date range might affect all charts on a page, while a local category filter may affect only one panel. State the scope in the interface and keep filter behavior consistent.

- Store the canonical filter state in one place when multiple charts share it.
- Derive each chart's dataset from that state.
- Avoid having separate charts independently reinterpret the same filter.
- Keep the current filters visible when users drill into details.
- Make reset behavior predictable.
- Preserve a clear distinction between global filters and chart-specific selection.
- Ensure filters update the chart's textual summary and data table too.

For cross-filtering, clicking a category in one chart may narrow other charts. That can be powerful, but the selection should be visible, reversible, and communicated to assistive technology. Provide a clear “clear selection” control when the user can get stuck in a narrowed state.

## 16. Tooltips, Hover, Focus, and Click Behavior

Define interaction behavior before implementing it. Common patterns include:

- Hover or focus to inspect a point.
- Click a bar to open a detail view.
- Click a legend item to toggle a series.
- Brush or drag to select a time range.
- Select a category to cross-filter other panels.
- Use a keyboard-operable control to switch metrics.

Do not overload one gesture with conflicting meanings. For example, if clicking a point both filters the page and navigates away, users may not know what to expect. Use affordances and labels to make interactive marks look interactive, and do not imply that noninteractive marks are buttons.

Touch devices do not have reliable hover. Make important inspection or navigation available through click/tap or a nearby table. Avoid hover-only details for values that are necessary to complete a task.

## 17. Color, Contrast, and Visual Hierarchy

Use a consistent palette across charts in the same product. Assign colors to semantic series where possible so “Actual” does not switch color from panel to panel. Keep decorative backgrounds and gradients from overpowering the data.

- Use neutral gridlines and axis text.
- Reserve the strongest color for the primary series or a meaningful highlight.
- Avoid assigning many similar hues to numerous categories.
- Use direct labels when category-color mapping becomes difficult.
- Check contrast in both light and dark themes.
- Do not use red/green alone to convey good/bad.
- Avoid 3D perspective for quantitative charts because it can distort apparent magnitude.
- Use animation sparingly and do not animate values in a way that suggests data changes that did not occur.

Color tokens should be part of the design system when multiple charts share a visual language. If themes are supported, verify chart colors against each theme rather than assuming CSS text colors automatically affect canvas-rendered marks.

## 18. Performance and Large Datasets

Performance depends on the number of points, number of series, update frequency, chart type, device, and renderer. Avoid unsupported blanket statements such as “canvas is always faster” or “SVG cannot handle large datasets.” Profile with representative data and the target device range.

Useful techniques include:

- Aggregate data to the visual resolution when fine-grained marks cannot be perceived.
- Downsample a dense time series carefully, preserving extrema or domain-relevant events.
- Avoid repeatedly parsing and aggregating the full dataset during every render.
- Memoize expensive transformations when measurements justify it.
- Reduce unnecessary chart updates when only unrelated UI state changes.
- Avoid rendering thousands of labels or markers that overlap.
- Consider server-side aggregation for large datasets.
- Use windowing or range queries for very long time series.
- Keep event handlers stable when required by the wrapper or chart library.
- Measure memory and responsiveness on lower-powered devices.

Downsampling must not silently remove important anomalies. If a user needs exact values for analysis, provide drill-down or raw data access rather than pretending a simplified plot contains every observation.

## 19. Avoid Misleading Visual Encodings

Chart correctness includes the visual encoding, not just the values.

- Use a zero baseline for ordinary bar magnitude comparisons unless there is a clear, explicitly communicated reason not to.
- Label normalized or indexed values.
- Do not compare percentages with different denominators without explaining the denominator.
- Do not put unrelated units on the same axis just to fit one panel.
- Be cautious with dual axes; they can create a false visual relationship through arbitrary scale choices.
- Avoid smoothing that implies measurements between sparse observations.
- Do not imply that correlation proves causation.
- Show uncertainty intervals when they are relevant and supported by the data.
- Keep sample size and coverage visible when they materially change interpretation.
- Distinguish actual values from forecasts and targets.
- Label cumulative totals as cumulative.
- Explain whether the x-axis is linear, categorical, or logarithmic when it is not obvious.

## 20. Testing Chart Components

Charts should be tested at several levels.

### Unit tests for transformations

Test parsing, aggregation, sorting, grouping, and formatting independently from the rendering library. Include malformed values, duplicate keys, missing dates, zero values, negative values, and empty inputs.

### Component tests

Check that the chart region has a useful heading, that empty and error states appear correctly, and that filter controls expose the selected values. Avoid relying solely on implementation details such as a specific internal SVG path count unless that is a stable product requirement.

### Visual regression tests

Capture representative charts with fixed data and a deterministic viewport. Check label clipping, legend overlap, tooltip placement, light/dark themes, and responsive breakpoints. Avoid tests that depend on live API values.

### Browser-level tests

Verify that filters change the intended charts, reset works, clicking an interactive mark performs the documented action, and keyboard users can operate the chart's surrounding controls. Test on touch-like viewports where hover is unavailable.

### Data-quality tests

Test that invalid values do not become zero, date sorting is chronological, percentages are formatted correctly, and totals reconcile with the underlying source.

## 21. Reusable Architecture

A maintainable chart implementation commonly has these layers:

1. **API/data access:** fetches raw records and exposes loading/error metadata.
2. **Validation and transformation:** validates field types, aggregates data, and returns chart-ready records.
3. **Formatting utilities:** formats dates, currency, percentages, counts, and compact labels.
4. **Chart component:** renders a specific chart with a clear prop contract.
5. **Dashboard composition:** arranges charts and owns shared filters.
6. **Alternative representation:** provides a summary, table, or export where needed.

Do not create a generic chart abstraction before at least a few real use cases establish common requirements. An abstraction with dozens of optional props is harder to reason about than a small set of well-named chart components.

### Example directory layout

```text
src/
  charts/
    RevenueTrend.tsx
    OrdersByCategory.tsx
    ChartState.tsx
    chartFormatters.ts
    chartColors.ts
  data/
    revenueSchema.ts
    revenueTransform.ts
  dashboard/
    RevenueDashboard.tsx
```

Adapt the names to the repository's conventions. The goal is separation of responsibilities, not a mandatory folder structure.

## 22. Common Mistakes and Better Alternatives

| Mistake | Why it fails | Better approach |
|---|---|---|
| Passing raw API records into the chart | API fields may be inconsistent or malformed | Validate and transform at the boundary |
| Replacing missing values with zero | Invents observations | Preserve missingness and choose a documented visual treatment |
| Sorting dates as labels | Produces incorrect chronology | Parse and sort by date |
| Using a pie chart for many categories | Makes comparisons difficult | Use a sorted bar chart |
| Showing every marker on a dense series | Creates clutter | Reduce markers or aggregate responsibly |
| Using color alone for series identity | Excludes some readers and weakens clarity | Combine color with labels, shapes, or line styles |
| Omitting empty/error states | Looks broken or implies zero | Render explicit state components |
| Building tooltip content from raw keys | Confuses users | Format names, dates, and units |
| Ignoring container height | Chart may collapse | Give the parent intentional dimensions |
| Rebuilding expensive transforms every render | Adds avoidable work | Profile and memoize where appropriate |
| Treating a canvas as fully accessible | Essential values may be unavailable to assistive technology | Provide text and tabular alternatives |
| Overusing animation | Distracts and can imply false movement | Animate only meaningful transitions and respect reduced motion |
| Mixing business logic into chart options | Makes code hard to test | Separate transformation, formatting, and rendering |
| Using fake fallback data in production | Misrepresents system state | Keep demo data isolated and labeled |
| Making a legend look interactive when it is not | Creates a false affordance | Style and label interaction honestly |

## 23. Debugging Checklist

When a chart looks wrong, inspect the pipeline in order.

1. **Input:** Did the request return the expected number of records?
2. **Validation:** Were values parsed or rejected as expected?
3. **Grain:** Does each row represent the intended observation?
4. **Aggregation:** Are sums, counts, averages, and rates computed correctly?
5. **Ordering:** Are time and category keys sorted intentionally?
6. **Units:** Are values and labels in compatible units?
7. **Scale:** Is the axis domain appropriate for the question?
8. **Layout:** Does the parent have a valid size?
9. **Formatting:** Are dates, currency, and percentages displayed correctly?
10. **Interaction:** Are tooltips, legend toggles, and filters synchronized?
11. **Accessibility:** Can users understand the chart without color or hover alone?
12. **State:** Are loading, empty, partial, and error cases distinguished?
13. **Performance:** Does the chart remain responsive with realistic data?
14. **Environment:** Is the installed library version consistent with the API used?

Debug the data before adjusting the visual styling. A prettier axis cannot fix an incorrect aggregation.

## 24. Practical Review Scenarios

### Scenario A: Revenue appears to fall to zero

Inspect the API response for missing months. Determine whether the transformation replaced null values with zero. Confirm whether a month with no record means no revenue or missing reporting. Update the data contract and chart behavior accordingly.

### Scenario B: The chart order changes after filtering

Check whether the filtered dataset is sorted by the original date key after filtering. If the chart uses categorical labels, ensure the category order is derived from a stable domain rather than incidental response order.

### Scenario C: Chart.js renders blank

Check that the relevant chart type, scales, and elements were registered. Confirm the data arrays align, the parent container has dimensions, and no invalid numeric values have entered the dataset. Check the console and the installed version's API.

### Scenario D: Recharts renders at zero height

Check the `ResponsiveContainer` parent dimensions and ensure the layout gives the parent a measurable height. Inspect flex/grid constraints and do not assume `height: 100%` works when the ancestor has no defined height.

### Scenario E: Tooltip numbers disagree with a table

Check whether the tooltip formats the same underlying values as the table, whether the table uses a different aggregation, and whether rounding is applied before or after aggregation. Share the same formatter and transformation rules where appropriate.

### Scenario F: Users cannot compare two dashboard charts

Check whether both charts use compatible periods, units, aggregation grain, and axis domains. Add labels that state the comparison basis. Do not force identical scales if doing so makes one chart unreadable; instead explain the scale difference.

## 25. Build Challenge: A Trustworthy Revenue Dashboard

Build a small dashboard that compares monthly revenue with a target. The challenge is complete only when the visual is correct, the data contract is explicit, and all states are handled.

### Requirements

1. Define a typed input record.
2. Validate date keys.
3. Parse numeric values without converting invalid values to zero.
4. Preserve null target values.
5. Sort observations chronologically.
6. Decide how duplicate months are handled.
7. Document whether revenue is a sum or a pre-aggregated value.
8. Render actual revenue and target as distinct series.
9. Format values in the correct currency.
10. Make the chart responsive.
11. Provide a meaningful title.
12. Explain the reporting period.
13. Add an accessible textual summary.
14. Provide a data table or equivalent value access.
15. Render a loading state.
16. Render an empty state.
17. Render an error state.
18. Communicate partial-data conditions.
19. Ensure zero revenue is displayed as zero.
20. Ensure missing revenue does not silently become zero.
21. Test a negative value if the domain allows it.
22. Test a target value of zero.
23. Test a malformed date.
24. Test an empty response.
25. Test a single observation.
26. Test a long date range.
27. Test a narrow viewport.
28. Test light and dark themes if both are supported.
29. Verify that labels do not overlap.
30. Verify tooltip values against the table.
31. Confirm the legend labels are human-readable.
32. Make series distinguishable without color alone.
33. Respect reduced-motion preferences if animation is used.
34. Avoid expensive transformations on every unrelated render.
35. Record the assumptions and tradeoffs in a short README.

### Suggested review questions

- Why is a line chart appropriate for this data?
- What does a missing target mean?
- How would the implementation change if revenue were returned in paise rather than rupees?
- How do you know the chart is sorted chronologically?
- What could make the visual comparison between actual and target misleading?
- Which parts of the component can be unit-tested without rendering the chart?
- How can a screen-reader user inspect the values?
- What would you measure before deciding that one library performs better?

## 26. Failure-Injection Tests

Do not test only the happy path. Deliberately inject conditions that commonly reveal hidden assumptions.

- Send `"1,200"` as a numeric string and decide whether comma-formatted strings are accepted by the API contract.
- Send an empty string for a required value.
- Send `null` for a target.
- Send `NaN` or infinity in a local test fixture.
- Send dates out of order.
- Send two rows for the same month.
- Send a month with no observation.
- Send a negative revenue value.
- Send a value much larger than the other observations.
- Return no rows.
- Return one row.
- Return a partial series with a warning.
- Render inside a hidden tab and then reveal the chart.
- Resize the parent container after the first render.
- Switch theme while the chart is visible.
- Apply a filter that removes every record.
- Toggle all series off if the legend supports that behavior.
- Use a very long category label.
- Use a locale that formats decimal separators differently.
- Simulate a failed network request.
- Test with reduced motion enabled.
- Navigate the surrounding controls using only a keyboard.
- Use a mobile viewport with no hover.
- Compare the tooltip against a known expected value.

For every failure case, document whether the expected outcome is an error, warning, omitted point, explicit gap, or valid rendered value. That makes the chart's behavior intentional rather than accidental.

## 27. Definition of Done

A chart is ready for review when:

- The visual answers a clearly stated question.
- The chart type matches the data and comparison.
- The data contract and units are documented.
- Validation and aggregation are tested.
- Dates and categories are ordered intentionally.
- Missing, zero, invalid, and partial values are treated differently.
- Axes, labels, and tooltips use correct domain language.
- The chart remains readable at supported viewport sizes.
- Loading, empty, and error states are implemented.
- Keyboard and non-hover access paths are considered.
- A textual or tabular alternative exists for important values.
- Color is not the sole carrier of meaning.
- Performance has been checked with representative data.
- No fake data is presented as production data.
- The chart can be maintained without reverse-engineering a large block of options.

## 28. Quick Reference

### Recharts checklist

- Compose chart primitives declaratively.
- Use `ResponsiveContainer` within a parent with measurable dimensions.
- Keep transformation logic outside JSX where possible.
- Use explicit data keys, readable names, and formatted ticks.
- Handle custom tooltip payloads defensively.
- Provide textual context and alternative value access.
- Verify installed-version API details.

### Chart.js checklist

- Register the elements, scales, and plugins the chart uses.
- Keep labels and dataset values aligned.
- Separate chart data from options and data transformations.
- Use a container with intentional dimensions for responsive charts.
- Consider canvas accessibility limitations and provide a textual alternative.
- Profile realistic data rather than assuming performance.
- Verify installed-version API details.

### Universal checklist

- Question first, chart second.
- Validate before visualizing.
- Do not turn unknown into zero.
- Use the correct aggregation.
- Make units explicit.
- Test the unhappy path.
- Make interactions discoverable and reversible.
- Treat accessibility as part of correctness.
- Keep visual emphasis proportional to evidence.

## 29. Implementation Notes for Teams

Agree on a small set of conventions before many charts are built: how currency is formatted, how dates are labeled, how missing points are represented, what loading skeletons look like, which colors identify semantic series, and where chart alternatives live. A shared convention prevents every dashboard from inventing a different meaning for the same visual element.

Keep library-specific concerns inside chart components. Business logic should not need to know whether a chart is rendered through Recharts or Chart.js. If the product later changes libraries, a clean transformation layer reduces migration risk. Do not build a speculative cross-library abstraction for every possible chart type; abstract only stable shared needs such as formatting, state handling, and data contracts.

When a chart is used to support a consequential decision, include provenance and reporting context. The user should know the source, date range, refresh time, and important caveats when those details affect interpretation. A visualization should not imply a level of precision or completeness the underlying source does not provide.

## 30. Final Mental Model

Treat a chart as a pipeline:

**Question → Data contract → Validation → Transformation → Visual encoding → Interaction → Accessible alternative → Tests → Monitoring**

Every stage can introduce errors. A chart can render perfectly while representing the wrong aggregation, or have correct values while being impossible to interpret. Review the pipeline end to end. The objective is not merely to draw a line or a bar; it is to make the data understandable, inspectable, and trustworthy.


## Recipe: A Recharts Bar Chart for Category Comparison

Use a bar chart when the task is to compare discrete categories. Sort categories by value when rank is the main question; preserve a meaningful business order when the order itself carries meaning. For example, weekdays should usually remain Monday through Sunday rather than being alphabetized.

A production implementation should:
- Choose vertical bars for short labels and horizontal bars for long labels.
- Format ticks and tooltips with the same unit.
- Decide how ties are ordered.
- Handle a category with a zero value without dropping it unexpectedly.
- Show a useful empty state when filters exclude all categories.
- Avoid excessive bar rounding or gradients that make comparison harder.
- Explain whether values are totals, averages, or rates.

Do not sort alphabetically in one chart and by value in another if the panels are intended to be compared. If the sort order changes in response to a filter, consider whether users will lose their place. Stable sorting can be more useful for operational dashboards; value sorting can be more useful for ranking tasks.

## Recipe: Multiple Series Without Visual Noise

Multi-series charts are useful only while the series remain distinguishable. Start with the fewest series that answer the question. If there are many groups, prefer small multiples, a filter, or a ranking table instead of putting every group into one legend.

Keep series order stable across filter changes. Name each series in business language, and use consistent colors for the same semantic series across the dashboard. A custom legend should reflect the current visibility state and provide a keyboard-accessible way to change it if toggling is supported. When a series is hidden, make that state obvious and provide a quick reset.

For stacked charts, ensure every series uses a compatible unit and aggregation. A stacked chart is not appropriate for unrelated quantities merely because stacking saves space. For normalized stacks, explicitly label that the chart shows percentage composition rather than absolute volume.

## Recipe: Formatting Dates and Reporting Periods

Date formatting is part of the data contract. Decide whether the data represents a calendar date, an instant, or a reporting period. A timestamp such as midnight UTC can display as the previous local date in some timezones. If the source represents a month rather than an instant, do not accidentally shift it by converting it through a local timezone.

Use a consistent locale and timezone for axis labels, tooltips, exports, and tables. For long periods, show a readable subset of ticks rather than every date. For short periods, use enough precision to distinguish observations. When a chart groups by month, labels should include the year when the displayed range crosses year boundaries.

Test daylight-saving transitions when the product spans timezones that observe them. A time-series chart can have repeated or missing local clock labels around a transition; this should not be mistaken for duplicated or missing observations.

## Recipe: Rates, Percentages, and Denominators

A percentage is incomplete without a denominator. “Conversion rate: 4%” may mean conversions divided by visits, sessions, qualified leads, or another population. Record the numerator, denominator, and reporting window in the data definition. When comparing groups of different sizes, consider showing the sample size or count alongside the rate.

Never average percentages casually. If one group has 2 conversions from 10 opportunities and another has 50 from 1,000, the simple average of 20% and 5% is not the same as the combined rate of 52 / 1,010. Choose the calculation that answers the business question and label it accordingly.

For percentages, decide whether the underlying API returns `0.04` or `4`. Format only once. Applying a percent formatter to `4` when the intended representation is already percent points may show 400%, while displaying `0.04` without formatting may confuse readers. Add unit tests for the exact convention.

## Recipe: Forecasts and Targets

Actuals, targets, and forecasts have different meanings. Use distinct labels and visual treatments, and do not make forecast values appear as observed facts. A dashed line or muted treatment may distinguish a forecast, but the legend and explanatory text should still state what it means.

If a target is missing for some periods, do not extend the target line by assumption unless the business rule explicitly says the target carries forward. If forecasts include uncertainty intervals, show them only when the source provides them and explain their interpretation. A forecast point estimate without uncertainty can appear more certain than the model warrants.

For variance charts, calculate the difference using a documented sign convention. “Actual minus target” means a positive value is above target; “target minus actual” means the opposite. Label the convention and use colors that do not imply positive is always good, since the meaning of a variance depends on the metric.

## Recipe: Safe Drill-Down

A chart can be an entry point into a detailed view, but the action should be predictable. Make interactive marks discoverable, preserve filters when navigating, and ensure the destination describes which point or category was selected. Avoid sending users to a generic detail page that loses the chart context.

If clicking a bar filters the dashboard, show the selected category and offer a clear way to remove the selection. If clicking navigates to another route, provide a semantic link or button rather than relying on a canvas coordinate. For SVG-based marks, add appropriate interaction support only where the library and component architecture allow it. For canvas charts, use the library's supported event model and provide accessible controls outside the canvas for critical actions.

Test edge cases such as clicking a zero-height bar, selecting a category that disappears after a filter, and using browser back navigation. Do not leave the dashboard in a stale state after the data changes.

## Recipe: Export and Data Provenance

If users can export a chart's data, export the filtered data that the chart actually represents, not a different raw dataset without explanation. Include column names and units. If the chart uses aggregation or sampling, make that visible in the export or provide a separate raw-data export when appropriate.

Display a last-updated timestamp when freshness matters. Distinguish “updated at” from “data through”; a query may finish now while its underlying source is only complete through yesterday. When data is cached, communicate refresh behavior if it affects decisions.

Keep provenance close enough to the visualization that users can find it. A small source note, reporting period, and coverage note can prevent misinterpretation without overwhelming the chart. Avoid claiming real-time freshness unless the data pipeline supports it.

## Review rubric: Data integrity

Score data integrity by inspecting the complete transformation path. Can the reviewer explain the grain of a row? Are invalid records detected? Are date keys parsed and sorted correctly? Are duplicate observations handled by a documented rule? Are totals reconciled with the source? Are nulls, zeros, and rejected values distinct? Are rate denominators documented? Are units consistent from API to axis and tooltip?

A chart should not pass review merely because it looks plausible. Use a tiny hand-checkable fixture with known answers. For example, if three category values are 10, 20, and 30, the displayed total should be 60 only if summing those categories is semantically valid. If the source is daily unique-user counts, summing them may double-count users. The reviewer should challenge the aggregation rather than accept a familiar-looking total.

## Review rubric: Visual integrity

Inspect the baseline, scale, tick density, label placement, and visual emphasis. Is the selected chart type appropriate? Does a bar chart begin at a meaningful baseline? Are dual axes avoided or justified? Are missing intervals visible? Do line curves imply unsupported interpolation? Does the legend order match the series order? Are labels readable at narrow widths? Are target and actual visually distinct without relying only on color?

Compare the same data in a table for a few known points. A visual regression can detect layout changes, but it cannot prove that the visual encoding is truthful. The reviewer must assess whether the design could cause a reasonable reader to draw a false conclusion.

## Review rubric: Accessibility and interaction

Verify that the chart has a visible title and a concise description. Confirm that essential values are available without hovering and that color is not the only signal. Test keyboard navigation for surrounding filters, tabs, legend controls, and drill-down actions. Test the interface at a touch viewport. Confirm focus is visible and controls have meaningful accessible names.

Do not claim that a chart is accessible solely because the container has an `aria-label`. A label can identify a graphic but does not communicate every plotted value or interaction. Provide a textual summary or table when the values matter. For complex charts, test with assistive technology and review the actual output rather than relying on assumptions about how SVG or canvas will be announced.

## Review rubric: Performance and maintainability

Use representative data and a realistic device. Measure initial render, filter changes, resize behavior, and refresh behavior. Record the number of points and series, because a benchmark without workload context is not meaningful. Check whether transformations repeat unnecessarily and whether the chart updates when unrelated state changes.

Review the component boundary. A chart component should not secretly fetch data, apply undocumented business filters, parse arbitrary API shapes, and navigate the application all in one place. Separate concerns enough to test them, but do not create a complex abstraction before the product has repeated needs. Prefer a few explicit components to a configuration engine that is harder to debug than the charts it creates.

## Operational notes: Monitoring and change safety

For dashboards used regularly, monitor the data pipeline as well as the UI. A chart may be visually healthy while a scheduled data job has stopped updating. Surface data freshness and coverage where important, and instrument errors that prevent chart data from loading or being parsed.

When changing an aggregation or API field, update transformation tests and chart fixtures. Review downstream charts that consume the same normalized data. Keep example fixtures representative of real edge cases while removing sensitive records. If the chart supports multiple tenants or accounts, verify that filtering and caching cannot mix their data.

Use feature flags or staged rollout for high-impact changes when the surrounding application warrants them. Compare the new chart against a known reference dataset and have domain owners validate the interpretation before removing the old version.

## 31. Further Practice Labs

### Lab 1: Recharts trend with missing periods
Create a line chart with a month missing in the middle of the series. Compare the library's default missing-value behavior with a deliberate gap strategy. Write a test proving that the transformation did not replace the missing observation with zero. Document whether the series should break or continue and why.

### Lab 2: Chart.js bar chart with long labels
Use categories with long names and uneven values. Test vertical and horizontal bars at desktop and mobile widths. Ensure that axis labels remain readable, tooltips use the same formatted values as the table, and sorting remains stable. Record the tradeoff between fitting all categories and preserving text readability.

### Lab 3: One metric, two libraries
Implement the same small dataset in Recharts and Chart.js. Keep the title, units, order, domain, and tooltip meaning equivalent. Do not assume the libraries' defaults are equivalent. Compare accessibility alternatives, configuration complexity, and responsiveness. The purpose is not to crown a universal winner but to understand how library choice affects implementation.

### Lab 4: Data quality warning
Create a fixture with valid values, missing values, malformed dates, and an invalid number. Decide which failures are fatal and which permit partial rendering. Show a warning that describes the limitation without exposing confusing implementation details. Verify that the warning is visible and not only logged to the console.

### Lab 5: Filtered dashboard
Build two charts controlled by one date-range filter. Confirm that the filter has the same meaning for both panels and that their summaries and tables update together. Add a reset action and verify that it restores the default range. Test a filter that returns no records.

### Lab 6: Accessibility review
Use the keyboard to reach all filter controls and any legend or drill-down actions. Disable hover in your mental model and ask whether the essential values are still available. Add a textual summary and table. Inspect contrast, focus, headings, and accessible names, then ask another person to interpret the chart without being told the intended conclusion.

## 32. Troubleshooting Decision Tree

When the chart does not appear, first distinguish a data problem from a layout problem. Inspect the normalized data before changing visual properties. If the dataset is empty, check the request, filter state, and transformation. If the dataset is nonempty, verify that the chart container has a nonzero size and that the library has the required elements and scales registered.

When the chart appears but values look wrong, compare the raw response, normalized data, aggregated data, and displayed tooltip value. Check for percentage conversion, currency scaling, date grouping, duplicate records, and accidental aggregation. Avoid “fixing” a displayed value with a label formatter if the underlying number is wrong.

When the chart appears correct but is difficult to read, inspect the number of series, label density, axis scale, color contrast, tooltip content, and small-screen layout. Reduce visual clutter before adding decorative styling. If the chart is still too dense, aggregate or filter the data and provide a route to inspect details.

When the chart works with a mouse but not on a phone, identify any hover-only information or interaction. Add tap behavior or an adjacent control/table for critical details. When the chart works visually but is inaccessible, add a meaningful title, description, data alternative, and keyboard-operable surrounding controls, then test the actual result.

## 33. Final Review Questions

Before merging a chart implementation, a reviewer should be able to answer these questions without guessing:

1. What exact question does this chart answer?
2. What does one input row represent?
3. What are the units and reporting period?
4. Which aggregation was applied and why?
5. How are duplicates and missing observations handled?
6. What do zero and null mean in this dataset?
7. How are dates sorted and formatted?
8. Why was this chart type selected?
9. Is the scale appropriate for the comparison?
10. Could the encoding exaggerate or conceal a difference?
11. Can users understand the chart without color or hover alone?
12. What happens when there is no data or the request fails?
13. How is partial or stale data communicated?
14. How does the chart behave on narrow screens?
15. Which transformations have automated tests?
16. Has the chart been checked with representative volume?
17. Are export and drill-down actions consistent with the displayed data?
18. What assumptions remain unresolved?

If the team cannot answer these questions, the implementation is not necessarily unusable, but its assumptions are not yet sufficiently explicit for a dependable production chart.

## 34. Closing Principle

A reliable chart is the visible end of a disciplined data pipeline. The library draws marks; the developer is responsible for the meaning of those marks. Select the simplest visualization that answers the question, validate and document the data, preserve missingness and units, make interaction and alternatives accessible, and test the states that occur outside the happy path. The best chart is not the most elaborate one. It is the one that helps the reader reach a sound conclusion with the least ambiguity.
