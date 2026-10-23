# Performance Budget — Build Tooling Skill

## Skill Metadata

- **Skill name:** `performance-budget`
- **Layer:** `layer-10-build-tooling`
- **Primary domain:** Web performance engineering, measurable constraints, CI enforcement, and release governance
- **Audience:** Frontend engineers, creative developers, technical leads, and teams shipping interactive portfolio or marketing sites
- **Outcome:** Define, measure, enforce, and maintain performance budgets that reflect user experience rather than arbitrary file-size targets
- **Applies to:** Vite, Next.js, Astro, component-based frontends, static sites, and client-heavy interactive experiences

## Goal

Build a performance-budget system that turns performance goals into explicit, testable constraints. The system must define what is measured, where the measurement runs, which route or page class it applies to, how failures are reported, and who can approve an exception. A useful budget does not merely say “make the site fast.” It connects technical measurements to the experience people actually receive: meaningful content appearing quickly, stable layout, responsive interaction, and a restrained transfer and execution cost.

The deliverable is more than a spreadsheet. It is a maintained set of budgets, measurement scripts, CI checks, exception rules, and review habits. It should detect regressions before they reach production while remaining realistic about noisy lab measurements and differences between laboratory and field data.

## Why This Matters

Performance regressions often arrive through individually reasonable changes: a large hero image, an additional analytics package, a new animation library, a client-side chart, an oversized font, a route that imports an entire component registry, or a third-party embed that starts several network requests. Each change may appear small in a pull request, but the combined effect can delay the largest visible element, increase layout movement, make interactions feel sluggish, or consume a mobile user's data allowance.

A budget creates an explicit trade-off. It gives reviewers a shared basis for asking whether a feature is worth its cost and helps engineers identify which cost is growing. Without a budget, teams may optimize the metric that is easiest to see—often minified JavaScript bytes—while ignoring image transfer, render-blocking resources, long tasks, server response time, or unstable layout. They may also treat a single Lighthouse score as the whole truth, even though scores vary with test conditions and do not describe every route or every real user.

The failure modes this skill targets are concrete: a route silently exceeds its JavaScript ceiling; a hero image becomes the LCP element but is lazy-loaded; a font swap shifts the page; a third-party script creates long main-thread tasks; a client-only widget blocks useful content; a CI threshold is so noisy that engineers ignore it; or a team celebrates a passing score while real-user INP deteriorates. Budgets are useful only when the measurements are meaningful and the enforcement is trusted.

## Core Concepts

### 1. Define the experience before selecting a number

A performance target should correspond to a user-visible outcome. For common Core Web Vitals, use these good thresholds as the baseline: **LCP ≤ 2.5 seconds**, **INP ≤ 200 milliseconds**, and **CLS ≤ 0.1**. These are field-oriented thresholds evaluated at the 75th percentile, segmented by mobile and desktop where the data supports it. They are not a promise that every lab run will hit the same number. Use them as experience goals and pair them with engineering budgets that help the team influence them.

LCP describes when the largest visible content element is rendered. INP reflects responsiveness across interactions, including input delay, processing time, and presentation delay. CLS measures unexpected visual movement. None of these metrics independently describes the entire experience: a page can have a good LCP while shipping excessive JavaScript, or a small bundle while having poor INP due to long tasks.

```js
// Keep experience targets in a checked-in, reviewable source of truth.
export const experienceTargets = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
  percentile: 75,
  segments: ['mobile', 'desktop'],
};
```

**Gotcha:** Do not describe a single Lighthouse lab score as proof that field Core Web Vitals are good. Lab diagnostics are useful for controlled comparisons; field data shows what users actually experience across devices, networks, and sessions.

### 2. Separate field goals from lab guardrails

Field metrics and lab measurements answer different questions. Field data aggregates real visits over a period and includes device, network, cache, and interaction diversity. Lab tests run a controlled scenario that is easier to reproduce and compare in a pull request. A performance budget normally needs both: field goals for user outcomes and lab guardrails for fast feedback during development.

A lab test can enforce route-level JavaScript transfer, total resource weight, image policy, LCP element discovery, and selected timing thresholds. It cannot perfectly predict field INP, because the scripted interaction set may not match the actual interactions people perform. Conversely, field data may arrive too late to identify which commit caused a regression. Record the role of every metric in the budget documentation.

```text
Field goal: p75 mobile LCP <= 2.5 s over the reporting window
Lab guardrail: representative route LCP <= 2.8 s in the pinned CI environment
Transfer guardrail: initial JS <= 180 KiB compressed for the route class
Review signal: any increase above 10% in JS or image transfer requires explanation
```

The lab guardrail can be slightly looser than the field target because the test environment and metric distributions differ. It should still be strict enough to catch meaningful regressions. Calibrate it from stable baselines, not wishful thinking.

### 3. Budget by route class, not just by application

An application-wide number hides differences between page types. A text-first article, a product landing page, a dashboard, and a WebGL portfolio scene have different cost profiles. Define a small number of route classes and give each class a realistic budget. Shared shell costs should be measured separately where possible, and route-specific costs should be visible rather than averaged away.

A route class can specify compressed initial JavaScript, CSS, image transfer, font transfer, total initial transfer, request count, LCP, and interaction scenarios. For example, a content page may have a strict JavaScript ceiling, while an interactive showcase can have a larger optional scene budget that is loaded only after the primary content is available. Any exception should state which user benefit justifies it and what fallback exists for slower devices.

```js
export const budgets = {
  content: { jsKiB: 150, cssKiB: 45, imagesKiB: 450, totalKiB: 750 },
  marketing: { jsKiB: 180, cssKiB: 55, imagesKiB: 700, totalKiB: 1050 },
  interactive: { jsKiB: 260, cssKiB: 65, imagesKiB: 900, totalKiB: 1450 },
};
```

These example values are starting points, not universal standards. Replace them with measurements from the project's route classes and audience. State whether values are compressed transfer sizes or uncompressed disk sizes; do not mix the two in one table.

### 4. Distinguish initial-route cost from total application cost

A large application can still deliver a fast first view if it sends only the code needed for that route and loads optional features on demand. Conversely, a small repository can create a slow page if the entry chunk imports everything. Track initial route cost and deferred feature cost separately. Include shared framework runtime and application code consistently, and be explicit about whether the report includes preloaded chunks, CSS, web fonts, and third-party scripts.

Initial route cost usually has the strongest relationship to first-load performance. Deferred code still matters: it can create long tasks when activated, increase memory pressure, and delay interaction. A budget should therefore include both initial transfer constraints and a rule for when optional code is permitted to load.

```js
// Load an expensive optional feature only when a user opens it.
const openInspector = async () => {
  const { InspectorPanel } = await import('./InspectorPanel.js');
  mountInspector(InspectorPanel);
};
```

**Gotcha:** Code splitting is not a free win if every chunk is eagerly preloaded, or if the new loading waterfall delays a feature the user needs immediately. Inspect actual network behavior in the production build.

### 5. Choose transfer metrics carefully

“Bundle size” can mean source size, minified size, gzip size, Brotli size, total downloaded resources, or the bytes used by a particular route. These are not interchangeable. Define a unit and compression rule for every budget. For web delivery, compressed transfer size is often a useful guardrail; for runtime memory and parse costs, compressed bytes alone are insufficient.

A budget report should identify the resource type and route. It should also distinguish cacheable static assets from requests that cannot be reused. A repeat visit with a warm cache may behave differently from a cold visit. Use cold-cache testing for first-load budgets and separate cache-aware testing if repeat visits are important to the product.

```text
Initial JavaScript: 178 KiB Brotli, cold cache, route /work/
Initial CSS: 34 KiB Brotli, cold cache, route /work/
Images: 512 KiB transferred before first interaction
Total initial transfer: 814 KiB, excluding browser cache hits
```

Do not compare a gzip number from one build with a Brotli number from another. Do not add uncompressed image dimensions to compressed JavaScript and call the sum “download size.”

### 6. LCP is a resource-discovery and rendering problem

LCP depends on server response, resource discovery, download time, and render delay. If the largest element is a hero image, the browser must discover it early, fetch it efficiently, and render it without waiting on unnecessary work. An image can be optimized but still contribute to poor LCP if it is hidden behind client-side rendering, CSS background discovery, lazy loading, or a chain of JavaScript dependencies.

For a likely LCP image, use an appropriate responsive image, explicit dimensions or aspect ratio, and eager loading when it is genuinely above the fold. `fetchpriority="high"` may be appropriate for the main image, but should not be added to every image. If text is the LCP element, investigate font loading, CSS delivery, and server rendering. Measure the actual LCP element in traces rather than assuming the hero is always responsible.

```html
<img
  src="/images/hero-1280.avif"
  srcset="/images/hero-640.avif 640w, /images/hero-1280.avif 1280w"
  sizes="(max-width: 700px) 100vw, 1200px"
  width="1280"
  height="720"
  fetchpriority="high"
  alt=""
/>
```

**Gotcha:** Do not apply `loading="lazy"` to the likely LCP image. Lazy loading can postpone the very resource the browser needs to render the main content.

### 7. INP is about the full interaction path

INP can be affected by input delay, event processing, style and layout work, and the time until the next frame is presented. A button handler that synchronously filters thousands of records or parses a large JSON payload may create a long task even when the initial bundle is small. Heavy animation, expensive DOM updates, and third-party callbacks can also make interactions feel delayed.

Budgets for responsiveness should include representative interactions, not only a page-load score. Identify the interaction that matters to the user, script it in a repeatable test, and inspect the long task and rendering work. Keep event handlers small, split expensive work, yield to the browser where appropriate, and move suitable CPU-heavy computation to a worker. Use `requestAnimationFrame` for visual updates rather than repeatedly forcing synchronous layout.

```js
button.addEventListener('click', async () => {
  button.disabled = true;
  await new Promise((resolve) => setTimeout(resolve, 0));
  const result = await computeInWorker(payload);
  renderResult(result);
  button.disabled = false;
});
```

The `setTimeout` yield shown here is illustrative; production code should use an intentional scheduling strategy and handle cancellation, errors, and state changes. Do not treat an artificial yield as a substitute for reducing the amount of work.

### 8. CLS requires stable geometry

Unexpected layout movement commonly comes from images without reserved dimensions, ads or embeds inserted without space, late font swaps, content injected above existing content, and animations that change layout-affecting properties. A CLS budget should be supported by implementation rules: reserve media space, use stable placeholders, avoid inserting content above the current viewport without user intent, and prefer transform/opacity for animation where appropriate.

```css
.project-card__media {
  aspect-ratio: 16 / 10;
  overflow: clip;
}

.project-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

A page can have a low initial CLS and still shift later after a user interaction. Investigate the shift source and whether it was expected. Do not suppress measurement or add arbitrary fixed heights simply to make a test pass; reserve geometry that reflects the actual design.

### 9. Establish reproducible test conditions

Budgets are only actionable when test conditions are sufficiently stable. Pin the browser version where possible, use a consistent viewport and device profile, define network and CPU throttling, use a clean build, and record whether caches are cold or warm. Run the same representative route and interaction steps on each pull request. Store enough metadata to compare results across runs.

One noisy run should not necessarily block a release. For a metric with variance, use a defined retry policy or multiple samples and a statistic appropriate to the metric. A median can reduce outlier influence for some lab measurements, while percentile-based field goals answer a different question. Never choose a statistic after seeing a result simply to make the build pass.

```json
{
  "viewport": { "width": 390, "height": 844 },
  "deviceScaleFactor": 1,
  "cpuSlowdownMultiplier": 4,
  "networkProfile": "documented-mobile-profile",
  "cache": "cold",
  "samples": 3,
  "aggregation": "median"
}
```

The configuration above is an example schema, not a browser-tool configuration accepted by every runner. Map it to the exact options supported by your chosen tool and document those options in the repository.

### 10. Treat budget failures as diagnostic evidence

A useful failure report states the route, measured value, threshold, baseline, delta, resource or timing contributor, and the next debugging action. “Performance budget failed” is insufficient. Show whether the failure came from JavaScript transfer, images, LCP, CLS, or an interaction test. Attach a trace or report artifact when possible.

```text
FAIL /work/: initial JS 196 KiB > 180 KiB (+16 KiB)
Largest increase: charting chunk +22 KiB Brotli
Suggested review: inspect imports in WorkAnalyticsPanel and confirm route-level lazy loading
Artifact: performance-report/work/index.html
```

A failed budget should lead to a specific decision: optimize, remove, defer, justify an exception, or revise a target with evidence. It should not trigger blind code minification or random dependency replacement.

### 11. Manage exceptions explicitly

Budgets evolve as product needs change. A team may need a rich map, a 3D scene, a video hero, or a complex editor. That is not an automatic reason to abandon the budget. Define a time-limited exception with a named owner, rationale, measured cost, route scope, user benefit, fallback behavior, and review date. Prefer optional loading, reduced-quality modes, or user-initiated activation when the extra cost is not required for the first view.

```yaml
# Example exception record; validate it with your own schema.
route: /showcase/immersive/
metric: initial-js-kib
limit: 260
measured: 284
owner: frontend-platform
reason: interactive 3D editor required on this route
mitigation: defer editor chunk until activation; provide static preview
reviewDate: 2026-12-01
```

This YAML is a record format for a repository, not a standard consumed automatically by Lighthouse or the bundler. Exceptions must be visible to reviewers and must not silently become permanent.

### 12. Keep the budget aligned with production evidence

Revisit budgets when field data, product requirements, framework versions, or audience devices change. A budget that never changes can become irrelevant; a budget changed for every failure loses meaning. Review it on a regular cadence and after major redesigns or dependency migrations. Compare real-user metrics by route class and device segment, and check whether lab guardrails actually predict regressions seen in the field.

Use a decision record when changing a threshold: the previous value, proposed value, evidence, routes affected, user impact, and compensating controls. A healthy system can tighten a budget when improvements create room or relax a specific limit when a feature earns the cost. It should not loosen all limits merely because the current application is over budget.

```md
## Budget change record
- Metric and route class:
- Previous threshold:
- Proposed threshold:
- Evidence and sample window:
- User-facing trade-off:
- Alternatives considered:
- Owner and review date:
```

## Named Patterns

### Pattern 1 — Route-class budget map

**What it does:** Assigns budgets to meaningful route categories so the content pages, marketing pages, and interactive experiences are not judged by one arbitrary global limit.

**When to use:** Use when a site has distinct experiences with different technical requirements, or when one expensive route hides regressions in a site-wide average.

**Implementation:** Keep the route-to-class mapping explicit and test that every production route belongs to a known class. Treat unknown routes as a configuration error rather than silently assigning a generous default.

```js
export const routeClass = (pathname) => {
  if (pathname.startsWith('/journal/')) return 'content';
  if (pathname.startsWith('/showcase/')) return 'interactive';
  return 'marketing';
};
```

### Pattern 2 — Dual field-and-lab budget

**What it does:** Pairs real-user experience goals with controlled lab thresholds. Field data tells the team whether users are experiencing the target outcome; lab checks provide a repeatable regression signal in CI.

**When to use:** Use for production applications where CrUX or first-party RUM data is available and pull-request feedback must be faster than the field reporting window.

**Implementation:** Name the metric source in the report. Do not merge field p75 values and lab single-run values into a single unlabeled column. Make clear which threshold blocks CI and which one triggers investigation.

```text
Field: mobile p75 LCP <= 2.5 s, rolling 28-day window
Lab: cold-cache route LCP <= 2.8 s, three-run median
CI: initial JS <= route-class budget; report all timing deltas
```

### Pattern 3 — Compressed-transfer budget

**What it does:** Tracks network cost consistently using a declared compression format and resource scope.

**When to use:** Use when route weight is increasing or teams compare outputs across bundlers, image formats, or build pipelines.

**Implementation:** Measure the production output with the same transfer-size rule on every build. Include initial CSS and JS and define how images, fonts, preload requests, and third-party resources are counted.

```js
const budget = {
  jsBrotliBytes: 180 * 1024,
  cssBrotliBytes: 45 * 1024,
  fontTransferBytes: 120 * 1024,
};
```

### Pattern 4 — LCP resource ownership

**What it does:** Assigns a named owner and checklist to the resource most likely to control LCP, commonly a hero image, headline font, or server-rendered content block.

**When to use:** Use when LCP misses despite reasonable total bundle size or when a redesign changes the largest visible element.

**Implementation:** Capture the LCP element in a trace, verify discovery timing, ensure the resource is not accidentally lazy-loaded, and review response time and render delay separately.

```html
<link rel="preload" as="image" href="/media/hero.avif" fetchpriority="high">
```

Only preload a resource when evidence shows it is important and not already discovered early. Duplicate or incorrect preloads waste bandwidth.

### Pattern 5 — Interaction scenario budget

**What it does:** Defines repeatable interaction paths, such as opening navigation, filtering a list, switching a tab, or launching a 3D scene, and measures the work those paths trigger.

**When to use:** Use for apps with significant client-side behavior, especially when initial-load scores are healthy but interactions feel sluggish.

**Implementation:** Automate realistic actions, collect traces, and inspect long tasks and presentation delay. Keep the interaction script stable and version-controlled.

```js
await page.goto('/work/');
await page.getByRole('button', { name: 'Filter projects' }).click();
await page.getByRole('checkbox', { name: 'WebGL' }).check();
await page.getByRole('button', { name: 'Apply filters' }).click();
```

### Pattern 6 — Budget exception with expiry

**What it does:** Allows a measured, justified exception without hiding the cost or turning it into a permanent exemption.

**When to use:** Use when a feature has a defensible user benefit that cannot currently fit the standard budget.

**Implementation:** Require an owner, rationale, measured delta, route scope, mitigation, and review date. Fail CI when an exception is expired or its route scope does not match.

```json
{
  "id": "immersive-showcase-js",
  "route": "/showcase/immersive/",
  "owner": "frontend-platform",
  "expires": "2026-12-01",
  "mitigation": "load scene only after user activation"
}
```

### Pattern 7 — Regression percentage plus hard ceiling

**What it does:** Uses both a maximum acceptable value and a relative regression rule. A percentage rule catches deterioration in a metric that is still below the absolute ceiling; a hard ceiling prevents gradual creep.

**When to use:** Use for stable transfer metrics such as route-level JavaScript, where a 15% increase is worth review even before the final cap is exceeded.

**Implementation:** Calculate the delta against a known baseline and show both values in the failure message. Do not let a moving baseline automatically bless every regression.

```js
function exceedsBudget(value, baseline, ceiling, maxGrowth = 0.1) {
  return value > ceiling || value > baseline * (1 + maxGrowth);
}
```

### Pattern 8 — Production-build verification

**What it does:** Tests the actual production build and served assets instead of relying only on development-server behavior.

**When to use:** Use for every application with bundling, minification, code splitting, asset hashing, compression, or framework-specific production behavior.

**Implementation:** Build using the production command, serve the built output or preview server, and measure the same route paths that users visit. Development servers have different chunking, error overlays, source maps, and caching behavior.

```bash
npm run build
npm run preview -- --host 127.0.0.1
# Run the project's pinned browser/performance test against the preview URL.
```

## Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| A. Treating Lighthouse score as the only budget | A score combines multiple signals and can hide the cause of a regression. | Track explicit route-level metrics and retain the Lighthouse report as diagnostic evidence. |
| B. Mixing gzip and Brotli sizes | The same asset can have different transfer sizes under different compression. | Declare one compression method per budget and report it with the value. |
| C. Counting source bytes as transfer bytes | Source size does not represent minification, compression, or network behavior. | Measure the built production assets using a consistent compression method. |
| D. Setting one budget for every route | Heavy interactive routes and text-first routes have different cost profiles. | Define route classes and test each production route against its assigned class. |
| E. Lazy-loading the LCP image | The browser may discover the most important image too late. | Identify the LCP element and load it eagerly when it is above the fold. |
| F. Preloading every image or font | Unnecessary preloads compete with critical resources. | Preload only resources proven to be critical and not discovered promptly. |
| G. Assuming a small JS bundle guarantees good INP | Main-thread work, rendering, and third-party callbacks can still block input. | Test representative interactions and inspect long tasks and presentation delay. |
| H. Ignoring image dimensions | Layout shifts occur as the browser discovers intrinsic image size. | Set width and height or reserve the correct aspect ratio in layout. |
| I. Using arbitrary fixed heights to suppress CLS | Content can clip or overflow at different viewport sizes. | Reserve geometry that matches the design and verify responsive variants. |
| J. Blocking every PR on one noisy timing run | Environmental variance creates false failures and erodes trust. | Pin the environment, use a documented sampling strategy, and separate noisy diagnostics from hard gates. |
| K. Using a moving baseline without limits | Repeated small regressions can become the new normal. | Keep a hard ceiling and require explicit approval for baseline changes. |
| L. Exempting a route without an expiry | Exceptions become permanent and budgets lose credibility. | Require owner, rationale, mitigation, route scope, and review date. |
| M. Testing only the development server | Dev mode does not match production chunking or caching. | Build and serve the production output before measuring. |
| N. Ignoring third-party resources | Embedded scripts can dominate network and main-thread cost. | Include third parties in route reports and define ownership or loading policy. |
| O. Optimizing only total page weight | One critical resource can still delay LCP or interaction. | Track resource classes and timing contributors independently. |
| P. Counting cached assets as if they were cold transfers | Results no longer represent a first visit. | Define cold-cache and warm-cache scenarios separately. |
| Q. Changing thresholds after seeing a failed run | The target becomes outcome-driven rather than evidence-driven. | Require a documented budget-change record reviewed with the same criteria. |
| R. Ignoring font loading | Late font swaps can delay text rendering and shift layout. | Subset fonts, use appropriate `font-display`, and reserve text geometry where needed. |
| S. Shipping a chart or editor in the entry chunk by default | Optional capability imposes cost on users who never activate it. | Split the feature and load it on demand, preserving a usable fallback. |
| T. Hiding the failed report | Engineers cannot identify the resource or timing contributor. | Attach an HTML report, trace, and route-level delta to CI artifacts. |

## Mental Models

1. **A budget is a product constraint, not a vanity score.** Every threshold should correspond to a user outcome or a meaningful technical cost.
2. **Field data describes the experience; lab data helps explain and prevent regressions.** Use both for their intended roles.
3. **The route is the unit of experience.** A site-wide average can conceal one painfully slow page.
4. **Transfer size is only one dimension of cost.** Parsing, execution, rendering, and memory matter too.
5. **The critical resource deserves more attention than the total.** A single late LCP image can matter more than several small assets combined.
6. **Interaction performance starts before the handler and ends after the next frame.** Input delay and rendering work both matter.
7. **A stable budget is more valuable than a strict but noisy budget.** False positives teach teams to ignore the system.
8. **Exceptions must remain visible and temporary.** A justified cost is still a cost.
9. **Every metric needs a scope and unit.** An unlabeled “200 KB” value is not a reliable engineering requirement.
10. **Production output is the artifact users receive.** Measure the built site, not assumptions from source code.
11. **A baseline is evidence, not permission.** Do not let gradual deterioration silently reset expectations.
12. **Performance is a shared feature requirement.** Product, design, engineering, and analytics should understand the trade-offs.

## Build Challenge

Build a performance-budget system for a multi-route portfolio with content pages, marketing pages, and an interactive showcase. The result must be reproducible, reviewable, and useful in CI.

1. Define at least three route classes and map every production route to one class.
2. Set explicit budgets for initial JavaScript, CSS, image transfer, font transfer, and total initial transfer; state units and compression method.
3. Record Core Web Vitals targets of LCP ≤ 2.5 seconds, INP ≤ 200 milliseconds, and CLS ≤ 0.1 as experience goals, with field percentile and segment definitions.
4. Document which lab measurements block CI and which measurements produce a warning or diagnostic artifact.
5. Pin the browser/test tool version and define viewport, CPU/network conditions, cache state, and sample aggregation.
6. Build and serve the production output before running the checks.
7. Generate a report that lists route, metric, measured value, threshold, baseline, delta, and failure explanation.
8. Identify the LCP element for the marketing route and verify its discovery and loading behavior.
9. Script at least one representative interaction on the interactive route and capture evidence of main-thread or rendering cost.
10. Verify that media reserves stable geometry and that the tested route does not introduce unexpected layout shifts.
11. Add a hard ceiling and a relative regression rule for at least one stable transfer metric.
12. Create an exception record for an intentionally expensive feature, including owner, rationale, mitigation, and expiry.
13. Ensure an expired exception or an unmapped route causes a clear configuration failure.
14. Include a failure simulation: increase an entry chunk beyond its budget and confirm CI reports the offending route and resource.
15. Include a second failure simulation: mark the LCP image as lazy-loaded or remove its reserved dimensions and demonstrate that the relevant check or review process detects the risk.
16. Upload the performance report and any trace as CI artifacts so a reviewer can inspect the evidence.
17. Document how a developer reproduces a failed run locally.
18. Record the process for changing a threshold without silently moving the baseline.
19. Verify that the budget checks do not rely on a development server or unbuilt source estimates.
20. Provide a final summary that separates user-experience goals, technical guardrails, known limitations, and approved exceptions.

## Definition of Done / Success Criteria

- [ ] Every production route belongs to an explicit route class; unknown routes fail visibly.
- [ ] Every budget has a unit, measurement scope, compression rule where relevant, and owner.
- [ ] Core Web Vitals goals are stated as LCP ≤ 2.5 s, INP ≤ 200 ms, and CLS ≤ 0.1, with field percentile and segment context documented.
- [ ] Lab guardrails and field goals are not presented as interchangeable measurements.
- [ ] CI measures a production build with documented and repeatable conditions.
- [ ] The report identifies the failing route, value, threshold, delta, and useful diagnostic evidence.
- [ ] The system includes at least one realistic interaction test, not only a page-load score.
- [ ] At least one regression simulation proves the budget can fail correctly.
- [ ] Exceptions have owners, rationale, mitigation, and expiry dates.
- [ ] Threshold changes require evidence and a recorded review rather than automatic baseline drift.
- [ ] The team can reproduce a failure locally and explain the next debugging step.

## Quick Reference

| Concern | Recommended rule | Verify with |
|---|---|---|
| LCP | Good field target ≤ 2.5 s at p75 | Field data plus lab trace |
| INP | Good field target ≤ 200 ms at p75 | Field data plus scripted interactions |
| CLS | Good field target ≤ 0.1 at p75 | Field data plus layout-shift trace |
| JavaScript | Route-class compressed transfer ceiling | Production bundle/network report |
| CSS | Route-class compressed transfer ceiling | Production network report |
| Images | Count actual transferred image bytes for initial view | Network trace and responsive-image audit |
| Fonts | Budget font transfer and font count | Network trace and font loading review |
| CI conditions | Pin browser, viewport, throttling, cache state | Test configuration and run metadata |
| Regression rule | Hard ceiling plus relative change threshold | Baseline comparison report |
| Exceptions | Owner, rationale, mitigation, expiry | Repository exception registry |
| Release validation | Measure production output | Build and preview/deployment smoke test |
| Failure report | Route, value, threshold, delta, artifact | CI output and uploaded trace |

## Troubleshooting Workflow

1. **Confirm the failure is real.** Check whether the correct production build and route were tested, the browser version is expected, and the run used the documented network and CPU profile. Compare repeat samples only according to the predeclared aggregation rule.
2. **Classify the failing dimension.** Separate transfer-size regressions from LCP, CLS, or interaction regressions. A size failure needs an asset or import investigation; a timing failure needs a trace and phase analysis.
3. **Find the owning resource or work.** Inspect the route's chunk graph, network waterfall, LCP element, layout-shift source, or long task. Do not start by changing random minifier options.
4. **Choose the lowest-risk mitigation.** Remove unused code, split optional features, optimize the actual LCP asset, reserve layout geometry, reduce synchronous work, or defer third-party code when it is not needed immediately.
5. **Retest the same scenario.** Keep test conditions constant so the before/after result is meaningful. Confirm that the mitigation does not introduce a loading waterfall, visual regression, or broken fallback.
6. **Update documentation only when the requirement truly changed.** If the product now needs more capability, record the user benefit and trade-off. Do not increase the threshold solely to make a red build green.

## Practical Implementation Notes

### A minimal budget file

Store the project's initial budgets in version control. The exact schema is a project decision; the following is intentionally simple and does not imply that a specific bundler or Lighthouse plugin reads it automatically.

```json
{
  "version": 1,
  "compression": "brotli",
  "routeClasses": {
    "content": { "jsKiB": 150, "cssKiB": 45, "imagesKiB": 450, "totalKiB": 750 },
    "marketing": { "jsKiB": 180, "cssKiB": 55, "imagesKiB": 700, "totalKiB": 1050 },
    "interactive": { "jsKiB": 260, "cssKiB": 65, "imagesKiB": 900, "totalKiB": 1450 }
  },
  "coreWebVitals": { "lcpMs": 2500, "inpMs": 200, "cls": 0.1, "fieldPercentile": 75 }
}
```

The numeric route limits are examples that must be calibrated against the project. The Core Web Vitals thresholds are experience targets; do not infer that a single lab run proves field p75 compliance.

### CI gate design

Use hard gates for stable, deterministic measurements such as output file size and route-to-class mapping. Use controlled repeated runs for more variable timing measures. A common mistake is to give every metric the same failure behavior. A robust system can fail a pull request for an objectively oversized entry chunk while publishing a diagnostic warning for a timing metric that has known variance, then promote that timing check to a hard gate once its stability has been demonstrated.

```yaml
# Pseudocode: translate to your CI provider's actual syntax.
steps:
  - run: npm ci
  - run: npm run build
  - run: npm run preview -- --host 127.0.0.1 &
  - run: npm run perf:budget
  - upload: performance-report/
```

This snippet describes the workflow, not a drop-in valid pipeline for every CI provider. A real implementation must wait for the preview server to be ready, stop background processes, retain artifacts on failure, and pass the correct base URL to the runner.

### Calibrating a budget

Start with a representative production build and capture multiple runs under stable conditions. Measure the route classes, inspect the largest contributors, and choose limits that are demanding but achievable. If the current baseline is already poor, do not simply encode it as an eternal standard. Create a staged plan: record the baseline, set a ceiling that prevents further regression, prioritize the largest contributors, and tighten the limit as the application improves. The first budget should create visibility and prevent new waste, not punish every developer for historical debt they did not create.

A route budget should also include design intent. If a showcase page requires a 3D scene, the policy might allow a larger deferred chunk while maintaining a strict initial transfer limit and a static poster fallback. The same exception should not allow that chunk to load on article pages. Explicit scope is the difference between an intentional trade-off and an application-wide performance decline.

### Review questions for a pull request

- Which user experience does this feature improve?
- What new bytes, requests, main-thread tasks, or layout risks does it introduce?
- Is the cost required for the first view, or can it be deferred until intent is clear?
- Which route class owns the feature and which budget applies?
- Does the change alter the LCP element, font loading, image dimensions, or interaction path?
- Is there a trace or report showing the measured difference?
- If the budget is exceeded, is there a specific mitigation or a time-limited exception?

## Additional Gotchas

- **A passing transfer budget can coexist with poor rendering.** A compressed asset may still parse slowly, trigger heavy hydration, or cause layout work. Keep runtime and experience checks alongside transfer limits.
- **A good Lighthouse result can hide a weak route.** Run representative routes individually and do not average away the page that matters most.
- **Third-party scripts are part of the user's experience.** If the team cannot modify the vendor code, it can still control whether the script loads immediately, whether it blocks content, and whether the feature is necessary on every route.
- **A preload is a scheduling hint, not a free optimization.** Wrong preloads compete with more important resources and can increase bandwidth contention.
- **Mobile is not a single device.** Use documented representative profiles and monitor field data by device segment where sample size permits.
- **A metric without an owner will decay.** Assign responsibility for the budget file, CI checks, and exception review process.

## Release Checklist

- [ ] Production build completed without build warnings that indicate missing or duplicated assets.
- [ ] Route map covers all user-facing production paths, including important query or locale variants where relevant.
- [ ] Initial transfer metrics were calculated using the declared compression method.
- [ ] The LCP element and its resource-discovery path were checked on representative routes.
- [ ] Images and embeds reserve layout space.
- [ ] Representative interactions were exercised and obvious long tasks investigated.
- [ ] CI artifacts are available for review and failures explain the next debugging action.
- [ ] Exceptions are in scope, owned, justified, and unexpired.
- [ ] Any threshold change has a written evidence-based rationale.
- [ ] The release note records meaningful performance trade-offs and remaining limitations.

## Final Principle

A performance budget is successful when it changes engineering decisions before users pay the cost. The numbers are not the product; they are a way to protect responsiveness, stability, and access as the application evolves. Measure the real production experience, use repeatable checks where possible, keep exceptions honest, and make every regression understandable enough to fix.
