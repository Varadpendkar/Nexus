# Bundle Analyzer

## Skill Metadata
- **Skill:** `bundle-analyzer`
- **Layer:** `layer-10-build-tooling`
- **Focus:** Measuring, explaining, and reducing JavaScript and CSS bundles in modern web applications
- **Primary tools:** Vite/Rollup visualizers, webpack Bundle Analyzer, source-map-explorer, browser DevTools, package-manager dependency inspection, and CI budget checks
- **Audience:** Front-end engineers who need evidence-based bundle decisions rather than guesswork

## Goal
Build a repeatable workflow that identifies what ships to users, explains why it ships, distinguishes compressed transfer size from parsed and executed cost, and turns findings into safe, testable changes. The output of analysis is not a colourful treemap by itself; it is a defensible decision about which bytes and modules should be removed, deferred, shared, or accepted.

## Why This Matters
A production page can feel slow even when its source code looks small. A dependency may pull in locale data, polyfills, adapters, worker code, CSS, or a second copy of a framework. A developer may see a 400 KB source module and assume it is the main problem, while the actual bottleneck is a small but expensive module that executes during startup. Another team may celebrate a smaller minified bundle while accidentally shipping more requests, duplicating shared chunks, or moving work into a long main-thread task.

Bundle analysis helps expose these failure modes:
- **Dependency fan-out:** one convenient import brings in a large graph of transitive modules.
- **Duplicate packages:** incompatible version ranges create multiple copies of the same library.
- **Accidental eager loading:** a route-specific chart, editor, map, or animation package is included in the initial route.
- **Tree-shaking failure:** CommonJS packages, side-effectful modules, barrel exports, or package metadata prevent unused code from being removed.
- **Chunk fragmentation:** excessive splitting creates request overhead and duplicated runtime or shared dependencies.
- **Misleading size comparisons:** raw bytes, minified bytes, gzip bytes, Brotli bytes, and parsed JavaScript are treated as interchangeable.
- **Source-map confusion:** an analyzer is fed the wrong build output or a source map that does not match the generated artifact.
- **Budget drift:** each pull request adds a small amount until the release has a substantial regression.
- **False attribution:** the largest rectangle in a treemap is blamed even though it is cached, deferred, or not part of the route being measured.
- **Production mismatch:** measurements are made against development output, which has different wrappers, module boundaries, transforms, and dependency behavior.

The correct practice is to connect three kinds of evidence: the build artifact, the import graph, and the browser experience. A bundle report answers “what was emitted?” A dependency trace answers “why did it get there?” A browser trace answers “what did the user pay for it?” Keep these questions separate until the evidence links them.

## Operating Principles
1. Analyze a reproducible production build, not a development server.
2. Record the exact command, commit, environment, and analyzer configuration for every comparison.
3. Compare the same routes, features, and compression settings.
4. Separate initial-route assets from lazy-loaded assets and assets shared across routes.
5. Fix the cause in the import graph before adding fragile chunk-name rules.
6. Verify both bundle metrics and user-facing behavior after each change.
7. Treat visualizations as evidence, not as automatic optimization instructions.
8. Never publish secrets, private source maps, or proprietary code through an external analysis service.

## 1. Establish the Measurement Contract

A bundle report is only useful when its scope is explicit. Before running an analyzer, write down the application entry point, production mode, build command, output directory, target browser assumptions, and the metric being optimized. “Reduce the bundle” is not a testable goal. “Reduce Brotli-compressed JavaScript loaded before the dashboard becomes interactive by 80 KB without increasing request count by more than three” is a testable goal.

The contract should distinguish at least these values:

| Metric | What it means | What it does not mean |
|---|---|---|
| Source size | Original source text or source modules | Actual bytes sent to the browser |
| Emitted size | Built file size on disk | Compressed transfer size |
| Minified size | Size after minification | Runtime execution cost |
| Gzip size | Approximate transfer size using gzip | Exact size for every CDN and request |
| Brotli size | Approximate transfer size using Brotli | Parsed heap or CPU cost |
| Parsed JavaScript | Engine's parsing workload and representation | Network transfer |
| Executed JavaScript | Work performed by running code | Entire page load time |
| Initial chunk set | Assets needed by the initial entry or route | All assets a user might later load |
| Route chunk set | Assets needed by a specific route | Assets shared across every route |
| Coverage | Code observed as used during a capture | Proof that other code is never needed |

**Gotcha:** A report that shows “bundle size: 300 KB” is incomplete unless it says whether the number is emitted, gzip, Brotli, initial-route, all-route, or JavaScript-only. Never compare unlike numbers.

### A reproducible baseline
Run the project's documented production build, preserve the build log, and record the commit SHA. If the project supports several deployment modes, analyze the mode that actually ships. Build once without analyzer plugins to ensure the baseline represents the normal production pipeline; then enable the analyzer without changing minification, chunking, target, or environment flags. If adding the analyzer changes the artifact, document that difference and use the normal artifact as the size source of truth.

```bash
# Use the package manager selected by the repository.
npm ci
npm run build

# Inspect available scripts instead of guessing a script name.
npm run
```

Do not copy commands from another framework blindly. A Vite project may use Rollup output options, a webpack project may use webpack stats, and a framework may hide its bundler behind a wrapper. Read the repository's actual scripts and configuration before adding commands.

## 2. The Analysis Loop

Use the same loop for each optimization so the team can learn from outcomes rather than accumulate unexplained config.

1. **Baseline:** capture current emitted files, compressed sizes, route asset lists, and a browser performance trace.
2. **Locate:** find the largest relevant modules and chunks, not merely the largest source files.
3. **Trace:** follow imports backward from the emitted module to the application import that introduced it.
4. **Classify:** decide whether the bytes are required, duplicated, eagerly loaded, poorly tree-shaken, or incorrectly configured.
5. **Choose:** select the smallest intervention that addresses the root cause.
6. **Change:** make one logically isolated change and preserve existing behavior.
7. **Rebuild:** use the same production command and target conditions.
8. **Compare:** measure absolute and percentage change for relevant chunks and the initial route.
9. **Validate:** test the affected feature, error paths, accessibility, and browser performance.
10. **Record:** note the reason, evidence, trade-offs, and whether the budget was met.

```js
// Example of a simple comparison record kept in a PR description.
const comparison = {
  route: "/dashboard",
  metric: "brotli-js-initial-route",
  beforeBytes: 286_000,
  afterBytes: 211_000,
  deltaBytes: -75_000,
  behaviorVerified: true,
  browserTraceReviewed: true,
};
```

The numeric values above are illustrative only. Replace them with measurements from the repository; never present sample numbers as project results.

## 3. Core Concepts

### 1. Emitted modules versus source modules

An analyzer may show original source modules, transformed modules, or emitted chunk membership. These are different representations. Source modules help answer which import introduced code; emitted chunks show the actual deployment artifacts. Minification, transforms, and tree shaking can combine or remove source constructs, so a source file's line count is not a reliable measure of shipping cost.

Use source-level views to trace ownership, then return to the emitted artifact to verify that the proposed fix changes what users receive. A large source module can disappear almost entirely after tree shaking. A tiny import can pull in a large transitive dependency graph.

```js
// app.js: the visible import is small, but its dependency graph may not be.
import { renderChart } from "./charts/index.js";

renderChart(document.querySelector("#chart"));

// charts/index.js may re-export several chart types and helper modules.
// Inspect the emitted graph before assuming every re-export was removed.
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 2. Minification, gzip, and Brotli

Minification removes syntax and shortens identifiers; compression finds repeated byte patterns in the resulting output. A package with a large readable source representation may compress efficiently, while another with many unique strings may compress poorly. gzip and Brotli results depend on the final emitted file and compression settings. Compression is not a proxy for parse time, execution time, memory use, or long tasks.

Keep each metric labelled in reports. When your CDN uses Brotli for supported browsers and gzip as fallback, compare using the appropriate representation and verify content-encoding in the browser network panel. Avoid multiplying a single measured ratio across every chunk because compression ratios differ by file.

```bash
# Example: compare emitted files with local compression tools.
# Run from the actual production output directory.
find dist -type f -name '*.js' -print
gzip -c dist/assets/index-example.js | wc -c
brotli -c dist/assets/index-example.js | wc -c
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 3. Entry points and route reachability

A package can be present in the build without being loaded on the first view. Entry points, dynamic imports, route manifests, and shared chunks determine what a user downloads for a given navigation. The total size of all files in dist is therefore not equivalent to initial-load JavaScript. Analyze the asset set reachable from the entry and route you care about, then separately analyze later interactions that load deferred features.

This distinction prevents teams from removing useful code that is correctly lazy-loaded merely because it looks large in an all-assets report. Conversely, a route that is rarely used may still be expensive if its modules are imported eagerly from a shared top-level file.

```js
// Eager: the editor dependency becomes reachable during initial module loading.
import { Editor } from "heavy-editor";
export function openEditor(node) {
  return new Editor(node);
}

// Deferred: the dependency is requested only when the feature is used.
export async function openEditor(node) {
  const { Editor } = await import("heavy-editor");
  return new Editor(node);
}
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 4. Tree shaking and side-effect metadata

Tree shaking removes exports that the bundler can prove are unused. It depends on static analyzability, module format, export shape, side-effect assumptions, and the exact production configuration. A package declaring that files have no side effects when they actually register custom elements, inject styles, or patch globals can break runtime behavior. A package with conservative metadata may retain code that could otherwise be removed.

Do not set a broad sideEffects flag simply to make a report smaller. Inspect package documentation and source, identify the specific modules that are safe to prune, and add a regression test for any import that must remain. Prefer ESM entry points when supported and avoid namespace imports if they defeat useful static analysis.

```json
{
  "sideEffects": [
    "**/*.css",
    "./src/register-custom-elements.js"
  ]
}
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 5. Duplicate dependency copies

Two versions of the same library can be included when dependencies require incompatible ranges, when a package bundles a dependency instead of declaring it as external, or when import paths resolve to separate physical copies. Duplicates increase download and parse costs and may cause runtime identity problems: two copies of a state library may not share context, and classes from different copies may fail instanceof checks.

Inspect the package manager's dependency tree and the analyzer's resolved module paths together. Do not force a single version until compatibility is verified; a package may rely on a breaking API difference. Test all dependent features after deduplication and lockfile changes.

```bash
npm ls react
npm ls date-fns
npm explain some-package
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 6. Dynamic imports and async chunks

Dynamic import creates a split point that can defer a feature's code. It is not automatically beneficial: splitting a small module may add request overhead, duplicate shared dependencies, or delay an interaction that must feel immediate. Choose boundaries around user-visible features, route transitions, expensive editors, maps, charts, or optional admin workflows rather than splitting every file.

Validate loading state, error handling, cancellation where relevant, and behavior when a chunk fails to download. For a feature used immediately on most sessions, a dynamic import may move the cost later without reducing total work. The objective is to improve the critical path, not to minimize the initial chunk at any cost.

```js
const loadMap = () => import("./features/map/map-view.js");

button.addEventListener("click", async () => {
  button.disabled = true;
  try {
    const { mountMap } = await loadMap();
    mountMap(document.querySelector("#map"));
  } catch (error) {
    showMapLoadError(error);
  } finally {
    button.disabled = false;
  }
});
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 7. Barrel exports and import paths

Barrel files re-export symbols from many modules to make imports convenient. With well-structured ESM and accurate side-effect metadata, a bundler can often eliminate unused exports. In other packages, barrel files may eagerly evaluate modules, expose CommonJS boundaries, or lead to larger dependency graphs than a direct import. The analyzer can reveal whether a convenience import creates unexpected reachability.

Do not ban barrels as a universal rule. Compare the emitted result and use supported public entry points. Deep imports into a package's private implementation can reduce size today but break on upgrades, so prefer documented modular entry points where available.

```js
// Public modular entry point, when documented by the package:
import { format } from "date-fns/format";

// Avoid relying on undocumented internal paths merely to shrink a report:
// import format from "date-fns/_lib/private-file.js";
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 8. Chunk boundaries and shared chunks

Chunking trades request count, cache reuse, and parallel loading against duplicated code and cache invalidation. A shared chunk can prevent multiple routes from carrying the same dependency, but a very broad shared chunk can make every route download code it does not need. A route-specific chunk may be ideal for an uncommon feature but inefficient for code used on nearly every navigation.

Read chunk membership alongside route manifests and browser requests. Configure manual chunks only after understanding natural import boundaries and actual sharing. Chunk names are not a stable contract for tests; emitted contents and the user's route experience are more meaningful.

```js
// Vite/Rollup example: use only after confirming the dependency boundary.
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/node_modules/chart-library/")) {
            return "charts";
          }
        }
      }
    }
  }
};
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 9. Source maps and attribution

Source maps let analyzers attribute minified output to original modules, but only if the map matches the exact generated file. A stale map can create misleading labels or missing module data. Source maps can also reveal source code and paths, so publishing them publicly is a security and licensing decision rather than a harmless debugging default.

Generate maps for the analysis build using the framework's documented option. Keep the normal production build configuration otherwise identical. Verify that the analyzer consumes the correct file-map pairs, and decide deliberately whether maps should be uploaded privately to monitoring services or deployed to public origins.

```js
// Vite example. Confirm the option against the project's installed Vite version.
export default {
  build: {
    sourcemap: true
  }
};
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 10. CommonJS and module interop

CommonJS packages are often harder to tree-shake because their exports and side effects may be determined at runtime. Bundlers can transform CommonJS, but the result may retain more code than a native ESM build. Some libraries offer separate browser, module, or ESM entry points. Inspect the package's exports map and the bundler's resolved path before concluding that a package is inherently large.

Do not hand-edit dependency output or assume every CommonJS package is unusable. Prefer a maintained ESM entry where officially supported, and measure compatibility in the target browser environment. An apparent size improvement that changes behavior or introduces an unsupported module path is not a valid optimization.

```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 11. CSS and non-JavaScript payloads

JavaScript treemaps do not show the whole page payload. CSS, fonts, images, worker files, WASM, JSON data, and dynamically imported assets can all affect performance. A bundle report may be JavaScript-only while the largest route cost comes from a font family or a large data file imported into the module graph. Use the relevant build output report and the browser network panel together.

When a JSON catalogue is imported into JavaScript, it may become part of a chunk or be transformed in ways that change caching and parsing. For large data, consider an endpoint, static JSON asset, or feature-specific loading strategy. Verify that moving data out of JavaScript does not create a new blocking request or expose private information.

```js
// A large catalogue can be fetched only when its feature is opened.
export async function loadCatalogue() {
  const response = await fetch("/data/catalogue.json");
  if (!response.ok) throw new Error(`Catalogue request failed: ${response.status}`);
  return response.json();
}
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 12. Analyzer configuration and trustworthy reports

Analyzers differ in what they display, how they calculate sizes, and whether they inspect source modules, generated chunks, or compressed bytes. Treat their output as a model of the build, not as an interchangeable universal score. Record the analyzer version and configuration, and keep it separate from the production output settings when possible.

A visualization plugin can generate HTML or JSON reports as an extra build artifact. Do not accidentally ship a report, source map, stats JSON, or analyzer runtime to end users. Place reports in a controlled output path, exclude them from deployment when appropriate, and make CI artifacts available only to the intended audience.

```js
// Example Vite/Rollup visualizer configuration pattern.
// Install and import the analyzer plugin using its documented package API.
import { visualizer } from "rollup-plugin-visualizer";

export default {
  plugins: [
    visualizer({
      filename: "artifacts/bundle-report.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ]
};
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 13. Budgets and regression gates

A one-time report helps with diagnosis; a budget protects the project over time. Budgets should be tied to user impact and route scope. An initial-route budget might limit Brotli JavaScript, while an all-assets budget may be appropriate for a self-contained microsite. Choose metrics that can be reproduced in CI and define how exceptions are approved.

Avoid setting a threshold based on one machine's noisy timing measurement. File sizes are usually deterministic enough for CI; performance timings need controlled environments and repeated samples. Keep hard gates for stable artifact metrics and use lab or field metrics with an explicit tolerance and review policy.

```js
// Illustrative budget policy data; connect it to a real CI check.
const budgets = {
  initialRouteBrotliJsBytes: 180_000,
  initialRouteCssBytes: 45_000,
  largestChunkBrotliBytes: 120_000
};
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

### 14. Bundle size versus runtime cost

Bytes are only one part of the cost. A compact package can perform heavy initialization, parse a large data structure, register many handlers, or create thousands of DOM nodes. A larger deferred package may be harmless to the first view, while a small synchronous dependency can create a long task on every navigation. Use performance traces, coverage, and interaction testing to understand the user cost.

Do not claim that a 10% size reduction yields a 10% improvement in responsiveness. Network conditions, cache state, device CPU, parse behavior, and app architecture all influence the result. State precisely what changed and which measurements support the claim.

```js
// Example: defer non-critical initialization until the feature is requested.
let searchModulePromise;

export function openSearch() {
  searchModulePromise ??= import("./search/search-feature.js");
  return searchModulePromise.then(({ mountSearch }) => mountSearch());
}
```

**Verification:** Compare the relevant production artifact before and after the change, then check the browser network panel or performance trace to ensure the intended route and interaction still behave correctly.

## 4. Named Patterns

### Pattern: Feature-level dynamic import

What it does: moves a self-contained, non-critical feature behind an asynchronous import so its code is not part of the initial path unless requested.

When to use: editors, maps, visualizations, complex dialogs, or admin-only tools that are not required for first paint.

```js
export async function mountReport(node) {
  const { createReport } = await import("./report/create-report.js");
  return createReport(node);
}
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Route-scoped dependency audit

What it does: maps emitted chunks to routes and marks which chunks are required on the initial navigation versus a later route.

When to use: multi-route apps where a whole-build total hides which page is expensive.

```js
const routeAssets = {
  "/": ["entry.js", "shared.js"],
  "/analytics": ["entry.js", "shared.js", "analytics.js"],
  "/editor": ["entry.js", "shared.js", "editor.js"]
};
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Duplicate package investigation

What it does: combines analyzer evidence with the package manager's dependency explanation to identify multiple physical copies or incompatible versions.

When to use: when the same library appears in multiple treemap regions or the lockfile shows divergent versions.

```bash
npm ls some-library
npm explain some-library
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Import-surface reduction

What it does: replaces an unnecessarily broad import with a documented modular public entry point, allowing the bundler to include only required exports.

When to use: when analysis shows that an import brings unrelated modules into the emitted graph and the package supports modular imports.

```js
// Prefer a documented module entry point when available.
import { parseDate } from "some-library/date";
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Controlled manual chunking

What it does: groups a stable, coherent dependency boundary into a predictable async or shared chunk without forcing unrelated packages together.

When to use: only after natural code splitting and duplicate analysis reveal a repeatable chunking problem.

```js
manualChunks(id) {
  if (id.includes("/node_modules/chart-library/")) return "charts";
}
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Artifact size ledger

What it does: records per-route emitted and compressed sizes for each release so the team can identify when and where growth occurred.

When to use: products with recurring releases and strict initial-load budgets.

```json
{
  "route": "/dashboard",
  "metric": "brotli-js",
  "limitBytes": 180000,
  "owner": "dashboard"
}
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Analyzer report as CI artifact

What it does: creates a report for each pull request and preserves it for inspection without publishing it to the production site.

When to use: teams that need reviewable evidence for changes to dependencies or build configuration.

```js
visualizer({
  filename: "artifacts/bundle-report.html",
  open: false,
  gzipSize: true,
  brotliSize: true
});
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

### Pattern: Before-and-after verification

What it does: captures comparable production builds and reports the absolute and percentage delta for the targeted metric.

When to use: every bundle optimization, especially dependency replacement and code-splitting changes.

```js
const delta = afterBytes - beforeBytes;
const percent = beforeBytes === 0 ? null : (delta / beforeBytes) * 100;
```

**Review check:** The pattern is accepted only when the production artifact changes in the intended way, the feature still works, and the trade-off is written down.

## 5. Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| A. Comparing source bytes with Brotli bytes | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: comparing source bytes with brotli bytes. | Label each metric and compare only equivalent measurements. |
| B. Analyzing a development server | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: analyzing a development server. | Build and inspect the same production configuration used for deployment. |
| C. Optimizing the largest source file by line count | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: optimizing the largest source file by line count. | Trace emitted chunk membership and measure compressed output. |
| D. Treating the all-assets total as initial route cost | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: treating the all-assets total as initial route cost. | Resolve the entry and route asset graph before prioritizing work. |
| E. Adding manual chunks before tracing imports | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: adding manual chunks before tracing imports. | Identify the root import and natural split points first. |
| F. Assuming dynamic import always improves performance | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: assuming dynamic import always improves performance. | Measure first-route cost, request overhead, and interaction delay together. |
| G. Marking every package file as side-effect-free | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: marking every package file as side-effect-free. | Declare only verified side-effect behavior and test required registrations. |
| H. Deep-importing undocumented package internals | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: deep-importing undocumented package internals. | Use documented modular entry points and pin compatibility with tests. |
| I. Ignoring duplicate dependency versions | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: ignoring duplicate dependency versions. | Use analyzer paths plus package-manager explain output to verify duplication. |
| J. Comparing reports from different build flags | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: comparing reports from different build flags. | Keep target, minifier, environment, and route scope constant. |
| K. Using a stale source map | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: using a stale source map. | Regenerate maps from the exact build artifact being analyzed. |
| L. Publishing analyzer HTML with private source maps | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: publishing analyzer html with private source maps. | Store reports as access-controlled CI artifacts and exclude them from deployment. |
| M. Removing a library based only on its treemap size | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: removing a library based only on its treemap size. | Check feature use, runtime cost, accessibility, and behavior before replacing it. |
| N. Ignoring CSS and fonts | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: ignoring css and fonts. | Include route CSS, font requests, images, workers, and data assets in the payload audit. |
| O. Setting an arbitrary strict CI budget | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: setting an arbitrary strict ci budget. | Derive thresholds from a baseline and document exception ownership. |
| P. Using a noisy timing result as a hard gate | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: using a noisy timing result as a hard gate. | Gate stable byte metrics and use repeated controlled runs for timing. |
| Q. Forcing one dependency version without compatibility checks | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: forcing one dependency version without compatibility checks. | Inspect peer ranges and test all consumers before deduplication. |
| R. Assuming tree shaking removed unused exports | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: assuming tree shaking removed unused exports. | Inspect emitted modules and verify the production build with a representative import. |
| S. Ignoring cache behavior | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: ignoring cache behavior. | Compare cold and warm navigation and inspect content hashes and cache headers. |
| T. Splitting every module into its own chunk | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: splitting every module into its own chunk. | Choose feature and route boundaries that balance reuse and request overhead. |
| U. Ignoring async chunk failure | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: ignoring async chunk failure. | Add loading and error states and test a failed chunk request. |
| V. Removing polyfills without checking the browser target | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: removing polyfills without checking the browser target. | Align the build target with the supported browser matrix. |
| W. Using package size websites as the only evidence | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: using package size websites as the only evidence. | Inspect the exact version, entry point, transitive graph, and actual app output. |
| X. Claiming bytes equal responsiveness | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: claiming bytes equal responsiveness. | Validate parse, execute, and interaction costs in browser traces. |
| Y. Keeping a report only on one developer's machine | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: keeping a report only on one developer's machine. | Attach reproducible analyzer output to CI or the pull request. |
| Z. Changing several variables in one experiment | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: changing several variables in one experiment. | Make one isolated change so the result can be attributed. |
| AA. Leaving analyzer plugin output in the deploy directory | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: leaving analyzer plugin output in the deploy directory. | Write reports outside the deploy root or explicitly exclude them. |
| AB. Forgetting generated worker or WASM assets | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: forgetting generated worker or wasm assets. | Inspect all emitted file types and network requests, not only .js files. |
| AC. Ignoring route-specific feature usage | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: ignoring route-specific feature usage. | Capture realistic route and interaction flows before deciding what is unused. |
| AD. Using a minified treemap to infer source ownership | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: using a minified treemap to infer source ownership. | Use matching source maps and trace ownership back to imports. |
| AE. Treating a green budget as proof of good UX | This can lead to misleading bundle conclusions or a regression because the analysis no longer matches the actual build and route behavior: treating a green budget as proof of good ux. | Pair artifact budgets with browser performance and functional tests. |


## 6. Mental Models

1. **A bundle report is a map, not a verdict.** It shows relationships in one build; it does not decide whether code is required.
2. **The import graph explains reachability.** A module is shipped because the graph and build rules make it reachable, not because the treemap rectangle looks large.
3. **Initial cost is route-specific.** The sum of every emitted file is not what every visitor downloads before interacting.
4. **Compression measures transport, not computation.** Brotli size cannot predict parse time or main-thread work by itself.
5. **A split point moves cost; it does not erase cost.** Lazy loading can improve the first route while making a later interaction slower.
6. **One change should have one testable hypothesis.** Isolated changes make before-and-after results interpretable.
7. **The package manager and bundler answer different questions.** One describes declared and resolved dependency relationships; the other shows what was emitted.
8. **Budget policy is product policy.** Thresholds should reflect real route priorities and device constraints, not arbitrary round numbers.
9. **A green report can hide a bad experience.** The app can pass size checks while executing expensive code or blocking an interaction.
10. **Caching changes the economics of chunking.** Stable shared chunks can help repeat visits, but overly broad chunks can penalize first-time visitors.
11. **Reproducibility is part of correctness.** Without the same command, target, and scope, size deltas are not reliable evidence.
12. **A safe optimization preserves semantics.** Smaller output is not a win if feature behavior, accessibility, or supported browsers regress.

## 7. Topic-Specific Gotchas

> **Gotcha — analyzer output can change the build.** Some plugins participate in the build pipeline. Confirm the normal production artifact and make sure enabling analysis does not silently change minification, splitting, or target settings.

> **Gotcha — a treemap can overstate visual importance.** Large rectangles attract attention, but a deferred route chunk may be less important than a small synchronous module that executes on every page. Use route scope and browser traces to prioritize.

> **Gotcha — source-map availability is not automatically safe.** Source maps can reveal source paths and code. Keep them private or deploy them intentionally according to the team's security and debugging policy.

> **Gotcha — package names are not module identities.** Two copies may resolve to different versions, paths, or nested installs. Confirm resolved paths before declaring a duplicate.

> **Gotcha — “unused” depends on the test flow.** Coverage collected on the landing page cannot prove that a settings dialog, checkout path, or error state never needs a module. Capture the real feature flows.

> **Gotcha — compression must match delivery.** Local gzip output is a useful estimate, but actual transfer depends on server configuration, content encoding, and CDN behavior. Check response headers in the deployed environment.

> **Gotcha — manual chunking can create cache churn.** A broad shared chunk may change whenever any dependency in the group changes, invalidating caches for unrelated routes. Keep groups coherent and inspect emitted hashes across releases.

> **Gotcha — a package can be small and expensive.** Initialization loops, locale parsing, large object creation, or synchronous DOM work may dominate user experience even when transfer size is modest.

## 8. Practical Analyzer Workflow

### Vite and Rollup projects
Use the installed version's documented plugin API. A common workflow is to create a report during a production build and save it under an artifacts directory. Keep the analyzer optional if it is not needed for every local build, and do not let the report be deployed accidentally.

```js
import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    visualizer({
      filename: "artifacts/bundle-report.html",
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ]
});
```

The exact plugin options may vary by installed version. Confirm the package documentation and lockfile rather than copying configuration blindly. Ensure the `artifacts` directory exists or that the plugin can create it. Run the regular production build and inspect the emitted report.

### Webpack projects
Webpack Bundle Analyzer commonly consumes webpack stats or runs as a plugin. For CI, generating a stats JSON file can separate build execution from report rendering. Keep stats files private if they reveal module paths or source details.

```bash
npx webpack --profile --json > artifacts/webpack-stats.json
```

The command is valid only when the repository exposes the relevant webpack CLI setup. Framework wrappers may use different commands. Use the project's real build entry point and preserve the same mode and environment.

### Package-level diagnosis
Use the package manager to identify why a dependency is present. For npm projects:

```bash
npm ls some-library
npm explain some-library
```

For pnpm or Yarn, use the equivalent commands supported by the installed version. Inspect peer dependency warnings and lockfile changes before applying overrides. A dedupe command can change dependency resolution and should be reviewed like any other dependency update.

### Browser verification
After the artifact investigation, open the deployed or locally served production build. Use the Network panel to record which scripts load for the target route, whether they are compressed, and whether later chunks load only after the relevant interaction. Use Performance to inspect parse, compile, evaluate, and long-task activity. Repeat with cache disabled and enabled when both first-visit and repeat-visit behavior matter.

## 9. Build Challenge: Audit and Improve a Real Application

Build a small multi-route application or audit an existing portfolio. The challenge must prove that you can trace bundle composition, make a justified change, and verify the result rather than merely produce a treemap.

1. Create a production build from a clean install and record the commit, command, Node version, package-manager version, and target environment.
2. Generate an analyzer report and retain it as a review artifact.
3. Record emitted size, gzip or Brotli size, and initial-route JavaScript size separately.
4. Identify the five largest relevant emitted modules or chunks and explain which route or feature reaches each one.
5. Trace one surprising dependency to the source import that introduces it.
6. Inspect the package manager's dependency graph for duplicate versions of a library.
7. Identify one route-specific feature that can reasonably be deferred.
8. Implement the smallest suitable code-splitting or import-surface change.
9. Add a loading state and a visible error state for a deferred chunk.
10. Test the feature with the network throttled and simulate a failed chunk request.
11. Rebuild with the same production command and compare the same metrics.
12. Verify that the initial-route payload changed in the intended direction.
13. Confirm that the deferred feature still works when requested and does not load prematurely.
14. Check that no required CSS, registration side effect, worker, font, or polyfill disappeared.
15. Run the project's functional tests and add a regression test for the changed feature.
16. Record whether the change affects repeat visits, cache reuse, request count, or interaction delay.
17. Add a budget for at least one stable artifact metric and make CI fail when it is exceeded.
18. Include an exception process that names an owner, reason, and expiry or review date.
19. Confirm that analyzer reports and private source maps are not accidentally published to the production asset root.
20. Write a concise decision note: finding, evidence, change, before/after metrics, user impact, and known trade-off.

### Required failure conditions
The challenge is incomplete unless it tests at least one real failure condition. At minimum, simulate a failed dynamic chunk request and confirm that the user receives a recoverable error state rather than a blank screen or unhandled rejection. Also verify one edge condition such as a route loaded directly by URL, a feature opened twice, a stale cached chunk after deployment, or an unsupported browser target. Explain what the test proves and what it does not prove.

### Deliverables
- Analyzer report or machine-readable stats file
- Before/after metric table with labelled units and build configuration
- Dependency trace for one oversized or duplicated module
- Code change with tests
- CI budget check
- Failure-condition test evidence
- Short decision note explaining trade-offs

## 10. Definition of Done / Success Criteria

- [ ] The report comes from a reproducible production build with documented command and environment.
- [ ] Every reported metric is labelled as emitted, minified, gzip, Brotli, initial-route, or total output.
- [ ] The report can be traced to a real route, import, or emitted chunk.
- [ ] At least one optimization is justified by evidence rather than visual guesswork.
- [ ] Before-and-after builds use the same target and comparable configuration.
- [ ] A functional test proves that the affected feature still behaves correctly.
- [ ] A real chunk or route failure condition is tested and handled.
- [ ] A stable size budget is checked in CI or an equivalent automated gate.
- [ ] Private source maps and analyzer reports are not accidentally published.
- [ ] The final decision note states the result, user-facing impact, and remaining trade-offs.

## 11. Quick Reference

| Question | Best next step |
|---|---|
| Which output is largest? | Inspect emitted chunks and labelled compression metrics. |
| Why is this dependency present? | Trace imports and use package-manager explanation commands. |
| Is the initial route too large? | Resolve route entry assets and inspect the network waterfall. |
| Why did tree shaking fail? | Inspect ESM/CommonJS boundaries and side-effect metadata. |
| Why is a package duplicated? | Compare resolved module paths and dependency versions. |
| Should this feature be lazy-loaded? | Compare initial-route benefit against interaction delay and request overhead. |
| Did compression improve? | Compare the same final files with the same compression method. |
| Is the source map trustworthy? | Confirm it was generated for the exact artifact. |
| Is the report safe to publish? | Review source exposure and deployment output paths. |
| Did the change improve UX? | Inspect browser traces and test the actual user flow. |
| Can CI catch regressions? | Add stable artifact-size thresholds and a reviewable report. |
| Is manual chunking needed? | First establish the import graph and natural split points. |
| Did the route load all required code? | Exercise route and feature flows, including error states. |
| Is the optimization complete? | Verify artifacts, behavior, failure handling, and documented trade-offs. |

## 12. Troubleshooting Decision Tree

1. **The analyzer report is empty.** Confirm the build completed, the plugin ran in the production configuration, and the report path is writable. Inspect the build log before changing chunk settings.
2. **The report does not match the deployed files.** Compare output directories, build modes, environment variables, and commit SHA. Confirm that the deployment did not rebuild with different settings.
3. **The compressed size looks unexpectedly small or large.** Check the exact file list, compression tool and algorithm, content encoding, and whether source maps or non-JavaScript assets are included.
4. **A module appears twice.** Compare full resolved paths and versions. Determine whether the duplication is real, a visualization artifact, or separate code that happens to share a package name.
5. **A change reduces the first chunk but makes navigation slower.** Inspect the deferred chunk request and interaction trace. Consider prefetching, better route boundaries, or a different shared-chunk strategy rather than undoing the analysis.
6. **A feature breaks after tree shaking.** Check side effects, CSS imports, custom-element registration, global setup, and package entry points. Restore required effects and add a regression test.
7. **CI budget failures are noisy.** Check build reproducibility, lockfile consistency, environment drift, and whether the gate measures stable file sizes or noisy runtime timings.
8. **A smaller bundle does not improve responsiveness.** Use a browser trace to locate parsing, execution, layout, or rendering work. Bundle size alone does not identify every main-thread bottleneck.

## 13. Security and Operational Considerations

Treat reports and source maps as build artifacts with an owner and retention policy. They may contain original source paths, module names, internal package structure, or snippets depending on configuration. Avoid sending proprietary artifacts to third-party services without approval. If an external analyzer is used, confirm its data handling and retention terms.

Do not expose secrets through build-time variables or report metadata. Anything compiled into a browser bundle should be treated as public, even if its name suggests that it is private. Bundle analysis is a useful way to discover accidental inclusion of server-oriented packages or configuration strings, but it is not a substitute for secret scanning or security review.

For operational reliability, pin the analyzer version through the lockfile, document how to reproduce the report, and ensure a failed report generation does not silently skip the actual production build checks. Reports should help reviewers understand changes, not become a fragile dependency that blocks every local development task.

## 14. Further Practice

- Analyze a route that contains a charting library and decide whether it belongs in the initial chunk.
- Compare a broad package import with a documented modular import.
- Find a duplicated dependency and document the compatibility risks before attempting deduplication.
- Compare gzip and Brotli sizes for several emitted files and explain why their ratios differ.
- Build a CI artifact report that is accessible to reviewers but absent from the production deploy.
- Capture a browser trace before and after a bundle optimization and state whether the evidence supports a user-facing improvement.
- Add a budget for initial-route JavaScript and verify that a deliberate regression causes a visible CI failure.
- Simulate a missing async chunk after a deployment and confirm that the UI offers a recoverable path.

The goal of bundle analysis is not to make the treemap look tidy. It is to make shipping decisions traceable, reproducible, and aligned with the experience the application promises its users.

## Import tracing checklist

Start from the application entry and follow the import chain until the oversized dependency is reached. Record each boundary: application module, local barrel, third-party package entry, and transitive dependency. If the chain passes through a shared utility module, check whether that utility is imported by every route or only by the feature under investigation. Avoid attributing the whole cost to the nearest visible import when an intermediate package re-exports other modules.

For each trace, capture the exact import path, resolved file path, package version, emitted chunk, and whether the module is included in the initial route. This small record makes the analysis repeatable when a package upgrade changes its exports map or dependency graph.

## A useful pull-request explanation

A good pull-request explanation names the original symptom, the evidence used to find the cause, the intervention, and the verification. For example, write that the report showed a route's initial chunk included a chart engine that was only used after a button click; the code was changed to load that feature asynchronously; the production build showed a measured reduction in the same labelled metric; and a test confirmed that clicking the button still loads the chart. Do not say “performance improved by 30%” unless a relevant controlled measurement supports that exact statement.

Include the analyzer report or a machine-readable stats artifact where reviewers can inspect it. If the change adds a new request or moves cost to an interaction, call that trade-off out explicitly. A smaller initial chunk may still be the right decision, but reviewers should not have to infer the consequences.

## How to handle package upgrades

A package upgrade can increase or decrease output because its entry points, dependencies, ESM build, side-effect metadata, or implementation changed. Compare the old and new dependency trees, inspect release notes for major-version changes, and build both revisions with the same production settings. Avoid assuming a minor version is always size-neutral or that a package marketed as lightweight will be small in your specific import pattern.

If the upgrade changes the chunk graph, inspect whether the difference comes from the package itself, a new transitive dependency, or a changed bundler resolution. Test critical behavior and supported browser targets. When size increases for a needed feature, record the reason and decide whether the new capability is worth the cost rather than blindly pinning the old version.

## What not to optimize first

Do not start by shaving bytes from a tiny utility when the initial route is dominated by an eagerly loaded editor or duplicated framework package. Do not spend time renaming chunks while leaving the import graph unchanged. Do not remove code that users rely on simply because coverage did not observe it during one narrow session. Do not optimize a route with no meaningful traffic while a critical route has a clear and reproducible regression, unless the project has a deliberate strategic reason.

Prioritization should consider route reachability, frequency of use, device constraints, parse and execution cost, cache behavior, and risk of change. The highest-value fix is often the smallest structural change that removes a large dependency from a critical path without creating a new failure mode.

## Working with flaky CI environments

If reports vary between runs, first compare the actual artifact hashes and size metrics. If output files are byte-identical but timing measurements vary, the instability is in the timing environment rather than the bundle. If files differ, inspect lockfile changes, nondeterministic generated content, timestamps embedded in output, environment variables, and tool versions. Pinning versions and using a clean install are usually more effective than widening every threshold.

Do not respond to a flaky budget by disabling it. Make the measurement deterministic, choose a stable metric, or separate a noisy performance test from a deterministic artifact-size check. Document any tolerance and review it periodically so the gate remains useful.

## Scenario-Based Diagnosis

### The charting package is the largest rectangle

Check whether the charting package is needed on the initial route. If only a later interaction uses it, test a feature-level dynamic import. Confirm the chart still initializes, renders correctly, responds to resizing, and handles a failed chunk request. Do not remove the library just because it is visually large.

### The analyzer says there are two framework copies

Inspect resolved paths and package versions. Check whether a linked local package has its own dependency installation, whether peer dependencies are declared correctly, and whether the application lockfile resolves compatible ranges. Test context, hooks, and component identity after any dependency-tree change.

### The output is smaller but the page is slower

Compare the browser trace and network waterfall. The change may have moved work to the interaction path, increased request latency, caused repeated module initialization, or altered caching. Re-evaluate the target metric instead of assuming the bundle result is the UX result.

### A direct route load fails after code splitting

Test route entry from a fresh browser tab, not only navigation from the home page. Check the server's history fallback, emitted asset paths, base path configuration, and whether the route's chunk is referenced correctly.

### A deployment causes stale chunk errors

Content-hashed filenames and correct cache policy should allow old pages to use old assets for an appropriate window. Check whether HTML is cached too long, old assets are deleted immediately, or service-worker caches are inconsistent. Provide a user-visible recovery path for chunk-load errors.

### The visualizer shows many tiny chunks

Inspect the number of requests and shared dependency duplication. Tiny chunks are not automatically bad, but excessive boundaries can create overhead and make caching less effective. Group coherent features only when measurements justify it.

### The analyzer report cannot map modules to source

Check that the source maps were generated from the same build and are accessible to the analyzer. Verify path handling, build output paths, and whether the production build uses a transform that drops mapping data.

### The bundle budget fails after a dependency update

Compare dependency graph, lockfile, emitted chunks, and compressed sizes. Determine whether the increase is required functionality, a duplicate copy, a changed import path, or a bundler-resolution change. Make the decision explicit and update the budget only with review.

### A package is listed but no code appears in the final output

The package may be removed by tree shaking, externalized, represented only in a separate asset, or absent from the selected route. Verify emitted files and runtime network requests before treating the listing as a shipping cost.

### The report differs between local and CI

Compare Node and package-manager versions, lockfile installation, environment variables, build mode, operating system-specific resolution, and generated files. Reproduce CI with the same command before adjusting analyzer settings.

## Review Rubric

A reviewer should be able to answer these questions without guessing:

- **Scope:** Which route, interaction, or application entry is under analysis?
- **Artifact:** Which exact production build and commit produced the report?
- **Metric:** Are sizes labelled as emitted, gzip, Brotli, initial route, or total output?
- **Attribution:** Which import path caused the module to be included?
- **Hypothesis:** What concrete behavior is expected to change?
- **Implementation:** Does the fix address the root cause instead of merely changing chunk names?
- **Correctness:** Are side effects, CSS, worker files, and browser targets preserved?
- **Failure handling:** Does a deferred feature recover when its chunk fails to load?
- **Evidence:** Are before-and-after values comparable and reproducible?
- **Trade-offs:** Has request count, cache behavior, and interaction delay been considered?
- **Security:** Are private source maps and reports handled appropriately?
- **Maintenance:** Is the chosen budget owned, automated, and documented?

A report that cannot answer these questions is a useful starting point, not a completed analysis.

## Final Reminder

The analyzer is a diagnostic instrument. The engineer remains responsible for selecting the metric, interpreting the import graph, preserving semantics, testing real user flows, and explaining trade-offs. A strong result combines a smaller or better-shaped critical payload with clear evidence that the application still works under normal, slow-network, and failure conditions.

## Extended Practice Exercises

### Exercise A: Eager editor dependency

Find an editor, code viewer, or rich-text dependency. Prove which route loads it initially, move it behind an appropriate feature boundary if justified, then test opening, closing, reopening, and failed-load behavior.

**Evidence to save:** a report, the exact command, the relevant artifact sizes, and a short note describing what the experiment established. Separate measured results from expectations and assumptions.
### Exercise B: Duplicated utility library

Find repeated copies of a utility or framework package. Trace each resolved path to the dependency that requests it, inspect peer and version ranges, and make a compatibility-safe change. Do not force a version solely to make the chart smaller.

**Evidence to save:** a report, the exact command, the relevant artifact sizes, and a short note describing what the experiment established. Separate measured results from expectations and assumptions.
### Exercise C: Tree-shaking audit

Select a package with multiple exports. Compare a broad import and a documented modular import, then inspect emitted output. Confirm side effects such as CSS, registration, and global initialization remain correct.

**Evidence to save:** a report, the exact command, the relevant artifact sizes, and a short note describing what the experiment established. Separate measured results from expectations and assumptions.
### Exercise D: Cache and chunking

Compare a route with a shared chunk against a version with a coherent route-specific chunk. Record first-visit requests, repeat-visit cache behavior, and the impact of changing one dependency.

**Evidence to save:** a report, the exact command, the relevant artifact sizes, and a short note describing what the experiment established. Separate measured results from expectations and assumptions.
### Exercise E: Budget enforcement

Choose one stable emitted-size metric, set a threshold based on the current baseline and product needs, then deliberately exceed it in a test branch. Confirm the CI failure identifies the metric and route.

**Evidence to save:** a report, the exact command, the relevant artifact sizes, and a short note describing what the experiment established. Separate measured results from expectations and assumptions.
### Exercise F: Report hygiene

Generate analyzer HTML and source maps. Inspect the deployment directory and verify that only intended public assets are deployed. Document where reports are stored and who can access them.

**Evidence to save:** a report, the exact command, the relevant artifact sizes, and a short note describing what the experiment established. Separate measured results from expectations and assumptions.

### Review prompts for concept 1: Emitted modules versus source modules

- What is the exact artifact or import graph evidence related to emitted modules versus source modules?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 2: Minification, gzip, and Brotli

- What is the exact artifact or import graph evidence related to minification, gzip, and brotli?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 3: Entry points and route reachability

- What is the exact artifact or import graph evidence related to entry points and route reachability?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 4: Tree shaking and side-effect metadata

- What is the exact artifact or import graph evidence related to tree shaking and side-effect metadata?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 5: Duplicate dependency copies

- What is the exact artifact or import graph evidence related to duplicate dependency copies?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 6: Dynamic imports and async chunks

- What is the exact artifact or import graph evidence related to dynamic imports and async chunks?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 7: Barrel exports and import paths

- What is the exact artifact or import graph evidence related to barrel exports and import paths?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 8: Chunk boundaries and shared chunks

- What is the exact artifact or import graph evidence related to chunk boundaries and shared chunks?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 9: Source maps and attribution

- What is the exact artifact or import graph evidence related to source maps and attribution?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 10: CommonJS and module interop

- What is the exact artifact or import graph evidence related to commonjs and module interop?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 11: CSS and non-JavaScript payloads

- What is the exact artifact or import graph evidence related to css and non-javascript payloads?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 12: Analyzer configuration and trustworthy reports

- What is the exact artifact or import graph evidence related to analyzer configuration and trustworthy reports?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 13: Budgets and regression gates

- What is the exact artifact or import graph evidence related to budgets and regression gates?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?

### Review prompts for concept 14: Bundle size versus runtime cost

- What is the exact artifact or import graph evidence related to bundle size versus runtime cost?
- Which route or user interaction is affected, and how was that flow reproduced?
- What result would falsify the current hypothesis?
- Which correctness risk needs a regression test before the change is accepted?
- Which size metric will be compared before and after, and why is it the right metric?
