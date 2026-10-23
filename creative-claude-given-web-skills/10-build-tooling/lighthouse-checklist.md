# Lighthouse Checklist

## Skill Metadata
- **Skill:** `lighthouse-checklist`
- **Layer:** `layer-10-build-tooling`
- **Focus:** Repeatable Lighthouse audits, Core Web Vitals interpretation, performance budgets, accessibility, SEO, and production release verification
- **Primary tools:** Chrome DevTools Lighthouse, PageSpeed Insights, Chrome UX Report where available, browser Performance panel, CI automation, and application-specific test suites
- **Audience:** Front-end engineers, designers, QA engineers, and teams maintaining production websites

## Goal
Create a dependable Lighthouse audit process that catches real regressions, prioritizes user impact, and verifies fixes across repeatable test conditions. A checklist is valuable only when each item has an observable result, a clear owner, and a safe way to verify it. The goal is not to chase a perfect score at the expense of the actual user experience.

## Why This Matters
Lighthouse can reveal important problems, but careless use of its score can lead teams to optimize the wrong thing. A developer may run one audit on a warm local server and treat the score as a production guarantee. A team may remove a useful feature to improve a synthetic metric, or compress an image while leaving the page's largest content element blocked by a font or server delay. An accessibility score can miss keyboard flows that were never exercised, and a passing SEO audit cannot prove that search engines will index every page correctly.

Common failure modes include:
- **Unrepeatable lab runs:** CPU contention, browser extensions, server startup, and network variability change results between runs.
- **Metric confusion:** Lighthouse lab measurements are treated as if they were field Core Web Vitals collected from real users.
- **Score chasing:** a single aggregate score replaces analysis of LCP, CLS, INP-related responsiveness, accessibility, and task completion.
- **Wrong page state:** an audit is run before a cookie banner, route content, authentication state, or lazy-loaded content reaches the state real users see.
- **False pass conditions:** a threshold is checked against one noisy run instead of repeated samples or a representative CI environment.
- **Desktop-only validation:** mobile constraints, touch behavior, viewport differences, and smaller CPU budgets are ignored.
- **Accessibility shortcuts:** automated checks are treated as a replacement for keyboard, focus, screen-reader, and content review.
- **SEO assumptions:** passing metadata checks is mistaken for proof of crawlability, canonical correctness, or indexation.
- **Production mismatch:** a development server or staging configuration differs from the deployed site in compression, caching, redirects, or third-party scripts.
- **Unverified fixes:** a recommendation is implemented without rerunning the same audit or checking that functionality still works.

Use Lighthouse as one source of evidence in a broader verification loop. Lab audits help reproduce problems under controlled conditions. Field data, when available and sufficiently populated, describes experiences from real users. Browser traces explain what work happened. Functional and accessibility tests prove that the fix did not damage the experience. No one score replaces these other forms of evidence.

## Operating Principles
1. Audit the production build or a staging environment that matches production behavior.
2. Record the exact URL, viewport, device mode, authentication state, browser version, and test date.
3. Run multiple audits when a result is near a threshold or visibly unstable.
4. Separate Lighthouse lab metrics from field Core Web Vitals.
5. Prioritize user-facing bottlenecks, not just the lowest-scoring audit category.
6. Fix root causes before suppressing audits or adding broad exceptions.
7. Preserve accessibility and feature behavior while optimizing.
8. Keep thresholds explicit, owned, and appropriate for the tested route.
9. Retest the same scenario after every material change.
10. Document known limitations, especially for authenticated, personalized, or third-party-dependent pages.

## 1. Understand the Metrics Before Acting

Lighthouse reports a score for several categories, but the category scores are not interchangeable with individual metrics. Performance includes measurements such as Largest Contentful Paint (LCP), Total Blocking Time (TBT), and Cumulative Layout Shift (CLS), alongside other diagnostics. Interaction to Next Paint (INP) is a Core Web Vital measured from real user interactions in field data; Lighthouse lab runs do not directly provide the same field INP measurement. TBT can help diagnose main-thread blocking in a lab run, but it is not a direct substitute for field INP.

Use these target values as common Core Web Vitals “good” thresholds:
- **LCP:** 2.5 seconds or less.
- **INP:** 200 milliseconds or less.
- **CLS:** 0.1 or less.

For field Core Web Vitals, the standard assessment is based on the 75th percentile of page visits or navigations, segmented by device where appropriate. A single Lighthouse run does not prove that the field threshold is met. For a lab release gate, define explicit repeatable thresholds for lab metrics such as LCP and TBT, and explain why those thresholds are appropriate for the environment.

| Metric | Typical meaning | Important caveat |
|---|---|---|
| LCP | Time until the largest visible content element is rendered | Depends on server response, resource discovery, load delay, resource duration, and render delay |
| CLS | Unexpected layout movement during the page lifecycle | The lab capture may not reproduce all real user interactions or delayed content |
| INP | Responsiveness across user interactions in the field | Lab Lighthouse is not a direct field INP measurement |
| TBT | Main-thread blocking between first contentful paint and time to interactive in lab context | Useful diagnostic signal, not a direct substitute for INP |
| FCP | Time until first content is painted | Does not prove the primary content is ready |
| Speed Index | How quickly visible content is populated | Sensitive to visual content and capture conditions |
| TTFB | Time to first byte from the server | Depends on hosting, caching, redirects, geography, and request conditions |
| Accessibility score | Weighted automated accessibility audits | Does not replace manual assistive-technology testing |
| SEO score | A set of technical SEO checks | Does not guarantee indexing, ranking, or correct search presentation |
| Best Practices score | A set of browser and security-related checks | Does not constitute a complete security audit |

**Gotcha:** Never write “INP passed in Lighthouse” based solely on a Lighthouse lab score. State whether you reviewed field data, lab diagnostics, or both.

## 2. Prepare a Reproducible Audit

A useful checklist begins before opening Lighthouse. Choose a URL that represents a real user journey, and record whether it is public or authenticated. Confirm that the build is deployed, that the server is healthy, and that the audit is not accidentally measuring a development server's source transforms. Remove browser extensions that may interfere, close unrelated heavy workloads, and keep the browser version and device mode consistent for comparisons.

Create an audit record with:
- URL and route name
- commit or release identifier
- production or staging environment
- browser and Lighthouse version
- mobile or desktop mode
- viewport and network/CPU simulation settings
- authentication and consent state
- cache condition, where known
- date and number of repeated runs
- known third-party or personalization dependencies

```yaml
audit:
  route: /portfolio
  environment: staging
  commit: "<replace-with-commit-sha>"
  mode: mobile
  runs: 5
  metrics:
    lcp_lab_seconds: "<measured-value>"
    cls_lab: "<measured-value>"
    tbt_ms: "<measured-value>"
  notes:
    auth_state: public
    consent_banner: accepted
```

The example is a template. Replace placeholders with measurements from the actual audit; never report illustrative values as real findings.

Run a baseline before changing code. If a result varies significantly, do not select the best run as the truth. Investigate variability, use repeated runs and a median or other documented summary, and preserve the raw reports so reviewers can see the spread.

## 3. Prioritize Findings by User Impact

A Lighthouse report may list dozens of opportunities. Prioritization should combine the metric involved, the number of users affected, the route's importance, confidence in the diagnosis, the implementation cost, and the risk of breaking behavior. A small improvement to the critical LCP resource may be more valuable than a large theoretical savings on a resource that is rarely loaded.

Use this order as a starting point, not an inflexible law:
1. Correct broken navigation, inaccessible critical controls, severe rendering problems, and route failures.
2. Address the critical rendering path and the resource responsible for LCP.
3. Reduce unexpected layout shifts and reserve space for late content.
4. Reduce long main-thread tasks and expensive synchronous initialization.
5. Fix high-impact accessibility barriers and keyboard/focus failures.
6. Fix important metadata, canonical, crawlability, and structured content issues.
7. Optimize lower-impact assets and non-critical diagnostics.
8. Reassess after each meaningful change to see whether the bottleneck moved.

A warning is not automatically an action item. Some audits are informational, some depend on page type, and some can be false positives for unusual but valid implementations. Record why a finding is applicable, what evidence confirms it, and how the fix will be tested.

## 4. Core Concepts

### 1. Lab data versus field data
Lab data is generated under a controlled test setup and is useful for debugging reproducible bottlenecks. Field data reflects actual visits across a population of users, devices, networks, and interactions. The two can differ because a lab run does not reproduce every real user journey, cache state, geography, or interaction pattern. Use lab data to diagnose and field data to understand real-world outcomes when field data is available.

```text
Lab audit -> reproduce and investigate a cause
Field data -> assess real-user distribution and Core Web Vitals
Browser trace -> inspect timing and main-thread work
Functional test -> prove the page still behaves correctly
```

### 2. Largest Contentful Paint
LCP measures when the largest eligible content element in the viewport is rendered. The element may be an image, text block, or other eligible content depending on the page. To improve it, determine which element was selected and inspect the stages contributing to its timing: time to first byte, resource load delay, resource duration, and render delay. Do not assume every LCP issue is an image compression issue.

```html
<!-- If this is the real LCP image, ensure it is discoverable early. -->
<img
  src="/images/hero.avif"
  width="1600"
  height="900"
  alt="Mountain landscape"
  fetchpriority="high"
/>
```

Use `fetchpriority="high"` only for the genuinely critical image; marking every image high priority can compete with other important resources. Confirm the browser's actual LCP element and waterfall before making the change.

### 3. Cumulative Layout Shift
CLS measures unexpected visual movement. Common causes include images without reserved dimensions, advertisements or embeds inserted without space, late font swaps, and content added above existing content. Reserve space for content whose dimensions are known, use stable layout constraints, and avoid inserting banners above content after the user has begun reading.

```css
.hero-media {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}

.hero-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

Do not hide useful content or disable animation merely to improve a synthetic number. Confirm whether movement is unexpected, and test with real interactions and late-loading content.

### 4. TBT and main-thread work
Total Blocking Time in lab audits estimates blocking from long tasks during a defined loading window. It helps identify JavaScript that delays responsiveness. Inspect long tasks in the Performance panel, then determine whether the work comes from parsing, framework initialization, hydration, rendering, event handlers, or third-party scripts. A lower TBT can be useful evidence, but it is not a guarantee that field INP improved.

```js
// Yield between chunks of non-critical work rather than doing everything at once.
async function processItems(items, processOne) {
  for (let i = 0; i < items.length; i++) {
    processOne(items[i]);
    if (i % 100 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}
```

This is a simplified illustration, not a universal scheduling strategy. For production work, choose an appropriate task scheduler or worker architecture and test the behavior under realistic data volumes.

### 5. Resource discovery and priority
A browser cannot fetch a resource before it discovers it. A CSS background image may be discovered later than an `<img>` element; a hero image referenced by client-rendered code may be discovered after JavaScript executes. Ensure critical content is discoverable in the initial document where possible. Avoid excessive preload hints: a preload is a priority claim, and too many claims can compete with the LCP resource.

```html
<link
  rel="preload"
  as="image"
  href="/images/hero.avif"
  fetchpriority="high"
/>
```

Use a preload only after confirming the target resource is critical and the browser would otherwise discover it too late. Keep the URL, responsive source selection, and `as` type consistent with the eventual request.

### 6. Image sizing and modern formats
Large images are often a major transfer cost, but the right fix is usually to deliver the correct dimensions and responsive variant rather than applying a single aggressive compression setting. Use `srcset` and `sizes` for responsive images, choose formats supported by the delivery pipeline, and reserve dimensions to prevent shifts. Decorative images should not have misleading alternative text, while meaningful images need useful text alternatives.

```html
<img
  src="/images/card-800.webp"
  srcset="/images/card-400.webp 400w, /images/card-800.webp 800w"
  sizes="(max-width: 600px) 100vw, 50vw"
  width="800"
  height="600"
  alt="Product displayed on a desk"
/>
```

Verify that the selected image is appropriate for the actual rendered slot. A responsive image configuration that always selects the largest file is not an optimization.

### 7. Font loading and text rendering
Fonts can delay text rendering or cause layout shifts when fallback and final font metrics differ. Subset fonts carefully, serve only the weights and character sets needed, and use `font-display` intentionally. Preload only fonts that are truly needed above the fold. A preload for a font that is not used on the audited route wastes bandwidth.

```css
@font-face {
  font-family: "Portfolio Sans";
  src: url("/fonts/portfolio-sans-latin.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

Variable font declarations must match the font file's actual supported axes. Test fallback metrics, multilingual content, and font loading under a slow connection. If a late swap moves content, evaluate `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` where appropriate.

### 8. JavaScript delivery and code splitting
A large initial JavaScript payload can increase download, parse, compile, and execution work. Split code around meaningful routes and features, not arbitrary file boundaries. A dynamic import is useful when the feature can be loaded later and the loading delay is acceptable. Always include loading and error states for asynchronously loaded features and verify direct route loads.

```js
export async function openVisualization(root) {
  const { mountVisualization } = await import("./visualization.js");
  return mountVisualization(root);
}
```

Measure whether the split actually reduces the initial route's payload. Some bundlers place shared dependencies into another eager chunk, so a dynamic import may not reduce the metric you intended to change.

### 9. Server response, caching, and delivery
Slow server response delays every later rendering stage. Check redirects, cache behavior, server-side rendering, CDN configuration, and backend work before focusing solely on front-end assets. Static hashed assets can usually be cached for a long time when deployment and HTML cache policies are coordinated. HTML often needs a different policy because it references the current hashed assets.

```http
# Example policy for versioned, content-hashed static assets:
Cache-Control: public, max-age=31536000, immutable
```

This header is appropriate only when the URL changes whenever the content changes. Do not apply it indiscriminately to mutable HTML, API responses, or user-specific content.

### 10. Accessibility audits and manual verification
Automated accessibility audits detect some common issues, including missing names, contrast problems, and invalid relationships. They cannot prove that a full user journey is accessible. Test keyboard navigation, visible focus, focus order, dialogs, error messages, zoom, reduced motion, and screen-reader output. An accessibility score is a useful checklist, not a certification.

```html
<button type="button" aria-expanded="false" aria-controls="menu-panel">
  Open menu
</button>
<div id="menu-panel" hidden>
  <!-- Menu content -->
</div>
```

The example requires JavaScript that keeps `aria-expanded` and `hidden` synchronized and manages focus correctly. Do not copy the markup without implementing and testing the complete interaction.

### 11. SEO and indexability
SEO audits can check some metadata and technical conditions, but a passing score cannot guarantee crawling or ranking. Verify status codes, redirects, canonical URLs, robots directives, sitemap inclusion, internal links, meaningful titles and descriptions, and rendered content. For client-rendered pages, ensure critical content is discoverable by the intended crawler and that direct route requests work.

```html
<head>
  <title>Selected Projects | Studio Name</title>
  <meta
    name="description"
    content="A selection of product, interaction, and web design projects."
  />
  <link rel="canonical" href="https://example.com/projects" />
</head>
```

Replace example URLs and descriptions with the real canonical route and unique page content. Avoid copying the same title and description across every route.

### 12. Repeatability and threshold policy
Lighthouse timing results vary. Use a documented number of runs and summarize results consistently, particularly when near a threshold. Keep raw reports and compare the same device mode, URL, browser version, network conditions, and release build. Do not use a single unusually good run to justify a release.

For stable file-size budgets, CI can often use a hard threshold. For noisy lab timing metrics, use a controlled environment, repeated samples, and a documented tolerance. Keep separate policy for field Core Web Vitals, which use real-user data and a different aggregation process.

```js
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
```

The helper assumes a non-empty array of numeric values. Validate the input and report the spread as well as the median when variability is material.

## 5. Named Patterns

### Pattern: One-route baseline
**What it does:** Defines a stable URL, page state, device mode, and run procedure before making changes.

**When to use:** At the start of an optimization task or when a route's score changes unexpectedly.

```text
URL -> fixed state -> repeated audits -> saved reports -> baseline summary
```

**Review check:** Another engineer should be able to repeat the audit without asking what page state or settings were used.

### Pattern: LCP resource trace
**What it does:** Connects the LCP element to the request and timing stage that delayed it.

**When to use:** When LCP is above target or the page appears visually ready later than expected.

```text
LCP element -> discovery point -> request priority -> response timing -> render delay
```

**Review check:** The fix targets the measured bottleneck, not a generic image or caching recommendation.

### Pattern: Layout reservation
**What it does:** Reserves stable space for images, embeds, banners, and asynchronous components.

**When to use:** When CLS is elevated or the page shifts after content becomes visible.

```css
.embed-slot {
  min-height: 18rem;
  aspect-ratio: 16 / 9;
}
```

**Review check:** The reserved space reflects actual content dimensions and does not create a large blank area on small screens.

### Pattern: Main-thread task isolation
**What it does:** Identifies and reduces long synchronous work during load or interaction.

**When to use:** When TBT is high, interaction feels delayed, or a Performance trace shows long tasks.

```text
long task -> call stack -> owner -> smallest safe change -> repeat trace
```

**Review check:** Functional behavior remains correct and the work is not merely shifted into another blocking task.

### Pattern: Responsive asset verification
**What it does:** Checks that the browser receives an appropriate image or font variant for the actual viewport.

**When to use:** When transfer size is high or a mobile audit downloads desktop-sized assets.

```html
<img src="/media/work-800.webp"
     srcset="/media/work-400.webp 400w, /media/work-800.webp 800w"
     sizes="(max-width: 640px) 100vw, 50vw"
     width="800" height="600" alt="Work sample" />
```

**Review check:** Inspect the selected currentSrc and actual response size at multiple viewport widths.

### Pattern: Accessibility journey
**What it does:** Supplements automated audit output with a scripted manual path through critical controls.

**When to use:** For navigation menus, dialogs, forms, media controls, and other interactive components.

```text
keyboard-only -> visible focus -> operate control -> read state -> recover from error
```

**Review check:** The user can complete the task without a pointer and without losing focus unexpectedly.

### Pattern: Controlled regression gate
**What it does:** Converts a stable, meaningful measurement into an automated check.

**When to use:** When a team repeatedly ships regressions on the same route or asset budget.

```js
const budgets = {
  lcpLabSeconds: 2.5,
  clsLab: 0.1,
  tbtMilliseconds: 200
};
```

These are illustrative thresholds, not universal guarantees. Choose and document the actual CI thresholds based on the target environment, route, and metric. Do not treat the lab LCP and CLS values as proof of field Core Web Vitals.

### Pattern: Before-and-after evidence
**What it does:** Preserves comparable reports and summarizes the impact of a single change.

**When to use:** For every significant performance or accessibility optimization.

```text
same route + same settings + same build mode
before measurements -> isolated change -> after measurements
```

**Review check:** The report names the exact metric, run count, environment, and trade-offs.

## 6. Common Mistakes

| Mistake | Why it fails | Fix |
|---|---|---|
| A. Chasing a perfect score | The score can distract from real user problems and functional requirements. | Prioritize route impact, field data, and the actual bottleneck. |
| B. Treating lab INP as field INP | Lighthouse lab diagnostics do not directly represent field INP. | Label lab metrics accurately and inspect field data when available. |
| C. Auditing a development server | Dev output and runtime behavior differ from production. | Audit a production build served in a production-like environment. |
| D. Trusting a single timing run | CPU and network variability can distort results. | Use repeated runs and a documented summary method. |
| E. Preloading every image | Too many high-priority requests compete with critical resources. | Preload only confirmed critical resources. |
| F. Compressing an image without checking dimensions | A small file may still be far larger than the rendered slot needs. | Use responsive variants and verify the browser-selected source. |
| G. Setting every image to high priority | Priority contention can delay the actual LCP resource. | Give high priority only to genuinely critical assets. |
| H. Removing content to improve CLS | It can make the experience incomplete instead of fixing the movement. | Reserve space and correct the cause of the shift. |
| I. Treating TBT as a direct INP replacement | Lab blocking and field responsiveness are different measurements. | Use TBT to diagnose and field INP to assess real-user responsiveness. |
| J. Applying long immutable caching to HTML | HTML can keep pointing at old asset hashes after deployment. | Use separate cache policies for HTML and content-hashed assets. |
| K. Preloading an unused font | The browser spends bandwidth on a resource that does not help the route. | Preload only fonts needed early on the audited page. |
| L. Ignoring font fallback metrics | Late font swaps can cause visible movement. | Test fallback behavior and adjust font metrics where justified. |
| M. Assuming accessibility score proves accessibility | Automated tools cannot test every keyboard and assistive-technology journey. | Add manual keyboard and screen-reader checks. |
| N. Assuming SEO score guarantees indexation | Crawling and indexing depend on many factors beyond the audit. | Verify status, canonical, robots, sitemap, and rendered content. |
| O. Fixing warnings without applicability review | Some diagnostics may not apply to the page or may be false positives. | Record evidence and explain why the recommendation applies. |
| P. Comparing different URLs or page states | The results do not describe the same experience. | Lock the route, query parameters, consent state, and authentication state. |
| Q. Testing only desktop | Mobile CPU, viewport, and touch constraints may reveal different failures. | Include representative mobile audits and device testing. |
| R. Ignoring third-party scripts | Analytics, widgets, and embeds may dominate blocking or network cost. | Attribute their cost and use approved loading or removal strategies. |
| S. Hiding an audit finding with a broad exception | The underlying problem remains and future regressions become invisible. | Fix the root cause or document a narrowly scoped exception with an owner. |
| T. Treating one good run as proof | The best sample can be an outlier. | Preserve multiple runs and inspect the spread. |
| U. Forgetting direct route navigation | Client-side navigation can work while a fresh URL request fails. | Test direct entry and server fallback for every important route. |
| V. Testing only the happy path | Lazy-loaded features can fail on weak networks or deployment races. | Test failed requests and recoverable error states. |
| W. Making several unrelated changes together | It becomes difficult to attribute the result or find regressions. | Isolate changes and rerun the same measurements after each one. |
| X. Assuming a smaller payload always means a faster page | Parse, execution, server, rendering, and layout costs may dominate. | Use browser traces and real user metrics alongside bytes. |
| Y. Publishing private audit artifacts | Reports or source maps may reveal internal paths and code. | Restrict report access and review deployment contents. |
| Z. Ignoring the report version and environment | Changes in tooling can alter results independently of application code. | Record browser, Lighthouse, build, and environment versions. |

## 7. Mental Models

1. **A Lighthouse report is a diagnostic snapshot, not a guarantee.** It represents a particular page state and test environment.
2. **Field and lab measurements answer different questions.** Lab results help reproduce; field data helps describe real-user experience.
3. **The bottleneck moves.** Once one resource is optimized, another stage may become dominant.
4. **Critical path matters more than total inventory.** A huge resource loaded after a deliberate user action may not harm the first view.
5. **A score compresses many signals.** Always inspect the individual metrics and failing audits.
6. **Accessibility is a journey, not a number.** A user must be able to navigate, understand state, and recover from errors.
7. **SEO checks are evidence, not ranking promises.** Crawlability, content quality, and indexing are broader than a score.
8. **Reproducibility is part of correctness.** Without consistent settings, comparisons are weak.
9. **Optimization must preserve semantics.** A faster page that loses useful functionality is not a successful result.
10. **Thresholds need owners.** A budget without an enforcement path and exception policy quickly becomes decorative.
11. **The browser is the final authority on loading behavior.** Inspect actual requests, selected assets, and execution traces.
12. **A fix needs verification at the point of risk.** Image changes need visual checks; interaction changes need keyboard and failure checks.

## 8. Topic-Specific Gotchas

> **Gotcha — Lighthouse does not directly measure field INP.** Use lab blocking metrics as diagnostic evidence, and consult field data for real-user INP when available.

> **Gotcha — mobile simulation is not a physical low-end phone.** It is useful for consistency, but device-specific behavior still needs representative testing.

> **Gotcha — LCP can be delayed after the request finishes.** Render delay, CSS, font readiness, and main-thread work can matter even when the image download is fast.

> **Gotcha — a passing accessibility score is not a manual audit.** Keyboard, focus, screen-reader, zoom, and reduced-motion behavior still require verification.

> **Gotcha — SEO audits do not guarantee indexing.** Check canonical URLs, robots directives, status codes, sitemap entries, and actual rendered content.

> **Gotcha — preload is a priority decision.** A wrong or unnecessary preload can compete with the resources that matter most.

> **Gotcha — field data may be unavailable for low-traffic or new routes.** Absence of field data is not proof of good performance; use lab tests and monitor as traffic accumulates.

> **Gotcha — third-party behavior changes outside your release.** Track consent, tag-manager, and embedded-widget changes because they can alter results without an application code change.

## 9. Build Challenge: Audit and Improve a Real Portfolio

1. Select a real route and record the commit, environment, URL, browser version, viewport, device mode, and authentication state.
2. Run at least five comparable Lighthouse audits and preserve the raw reports.
3. Record median LCP, CLS, TBT, FCP, and Speed Index, clearly identifying them as lab metrics.
4. Inspect the selected LCP element and document the resource and timing stage responsible for delay.
5. Inspect layout movement and identify whether any images, embeds, banners, or fonts lack stable space.
6. Review JavaScript execution and identify at least one long task or expensive initialization path.
7. Inspect image requests and verify that the browser selects appropriate responsive sources.
8. Review font requests, weights, subsets, and preload decisions for the audited route.
9. Run keyboard-only navigation through the main navigation and one interactive component.
10. Inspect page title, description, canonical URL, robots behavior, status code, and direct route loading.
11. Implement one focused change based on evidence, not a generic recommendation.
12. Repeat the same audit settings and compare the same metrics.
13. Verify the feature still works, including an error or weak-network condition relevant to the change.
14. Test at a mobile viewport and confirm the visual layout remains stable.
15. Create a small release checklist or CI gate for at least one stable metric.
16. Record any field data consulted and explain how it differs from the lab results.
17. Document third-party scripts or external conditions that may affect repeatability.
18. Confirm that reports and source maps are not accidentally exposed in the deployment.
19. Write a decision note with the finding, hypothesis, change, measured result, and trade-off.
20. State what remains unverified, including any missing field data or manual accessibility coverage.

### Required failure-condition test
The challenge is incomplete until at least one real failure or edge condition is tested. Examples include a lazy-loaded chunk failing to download, a direct route request returning an error, a consent banner appearing late and moving content, a font failing to load, or a dialog failing to restore focus after closing. The test must explain the expected behavior, observed result, and how the user recovers.

## 10. Definition of Done / Success Criteria

- [ ] The audit uses a documented production or production-like build.
- [ ] URL, viewport, browser version, state, and audit settings are recorded.
- [ ] Multiple runs are preserved when timing variability matters.
- [ ] LCP, CLS, TBT, and other lab values are clearly labelled.
- [ ] Field INP is not claimed from a lab Lighthouse score.
- [ ] The main performance finding is linked to an actual resource or execution trace.
- [ ] At least one focused change is verified with a comparable before-and-after audit.
- [ ] Keyboard and focus behavior are manually checked for critical interactions.
- [ ] Direct route and relevant failure conditions are tested.
- [ ] The final note distinguishes measured results, assumptions, and remaining limitations.

## 11. Quick Reference

| Symptom | First investigation |
|---|---|
| LCP is slow | Identify the LCP element and separate server, load-delay, resource, and render-delay contributions. |
| CLS is high | Inspect late content, missing dimensions, font swaps, and inserted banners. |
| TBT is high | Use the Performance panel to locate long tasks and their call stacks. |
| Mobile score is much worse | Compare image selection, JavaScript execution, viewport layout, and CPU-sensitive work. |
| Font causes movement | Inspect fallback metrics, font display strategy, and preload correctness. |
| Image transfer is high | Check rendered dimensions, responsive sources, format, and compression. |
| Accessibility score is low | Fix applicable automated findings, then run manual keyboard and assistive-technology checks. |
| SEO score is low | Check metadata, status, canonical, robots, sitemap, and rendered content. |
| Scores fluctuate | Stabilize environment and page state, repeat runs, and compare distributions. |
| Third-party script is costly | Attribute its requests and execution; consider delaying or removing only with product approval. |
| Route fails on refresh | Verify server fallback, base path, redirects, and direct URL handling. |
| Fix improves score but breaks UI | Revert or correct the change and add a functional regression test. |
| Field data is missing | Use lab diagnosis and gather field evidence over time; do not infer a pass. |
| Release gate is noisy | Separate stable artifact checks from timing tests and document tolerances. |

## 12. Troubleshooting Decision Tree

1. **The audit cannot load the page.** Check deployment health, URL redirects, authentication, consent, server errors, and whether the audit environment can reach required assets.
2. **The score changes substantially between runs.** Compare CPU and network settings, browser version, background load, cache state, and page personalization. Repeat and preserve all reports.
3. **LCP points to an unexpected element.** Confirm the viewport and content state, then inspect whether the selected element is representative. Do not optimize a different element based on intuition.
4. **The hero image loads quickly but LCP remains slow.** Inspect render delay, blocking styles, font readiness, hydration, and main-thread work.
5. **CLS appears only in later interactions.** Test delayed embeds, consent banners, expandable content, and font swaps. Capture the full relevant lifecycle instead of relying only on the initial screenshot.
6. **TBT improves but interaction still feels slow.** Profile the actual interaction and consult field INP when available. The blocking work may occur outside Lighthouse's measured loading window.
7. **Accessibility checks pass but keyboard use fails.** Treat the manual failure as a real issue; add a test and correct focus, semantics, or state synchronization.
8. **The audit passes locally but fails in CI.** Compare build versions, deployment configuration, browser versions, environment variables, and the exact URL/page state. Make the gate deterministic before weakening it.

## 13. Security and Operational Considerations

Performance work must not expose private information or compromise controls. Audit reports can contain URLs, query parameters, internal route names, or environment details. Use test accounts and synthetic data for authenticated routes, redact sensitive values from shared artifacts, and control access to stored reports. Do not publish source maps or internal reports without a deliberate policy.

Do not remove consent controls, authentication checks, or meaningful content solely to improve a score. Third-party scripts should be delayed or removed only when the product and legal requirements permit it. A performance change should preserve security, privacy, accessibility, and correct behavior.

For operational reliability, keep audit commands and environment assumptions documented. Pin CI browser and tooling versions where practical, but plan controlled updates so the checks do not become stale. A report that silently stops running is worse than an explicit failure: make missing data and skipped audits visible.

## 14. Further Practice

- Compare an image-based hero and a CSS-background hero, then explain which resource discovery behavior is appropriate for the actual design.
- Create a stable layout slot for a late-loaded embed and verify movement on mobile and desktop.
- Find a long main-thread task and connect the call stack to an actionable source change.
- Audit a custom font's weight and subset usage and confirm the selected font file is actually used.
- Run a keyboard-only interaction test for a menu, dialog, or form and record the expected focus path.
- Compare lab metrics to field Core Web Vitals when data is available and explain the limits of each source.
- Introduce a controlled regression in a test branch and verify that the CI gate fails with a useful message.
- Test a delayed resource or failed chunk and ensure the interface remains understandable and recoverable.

The purpose of a Lighthouse checklist is to make the audit repeatable, the finding actionable, and the fix safe. A score can guide attention, but real improvement comes from understanding the cause, testing the actual user journey, and recording evidence that the application is faster and still works.

## Audit Scope Matrix

An audit scope matrix prevents teams from mixing evidence from unrelated routes or page states. A marketing landing page, authenticated dashboard, project gallery, and checkout flow can have different content, scripts, rendering paths, and success criteria. Choose a scope for each release-critical route instead of assuming that one representative page describes the whole application.

For each route, identify the primary user task, initial viewport, important interaction, expected asset set, authentication state, and failure path. Then identify which audit categories apply. For example, a page with a large hero image may need careful LCP analysis; a data-heavy dashboard may need more attention to main-thread work and interactions; a form may require keyboard and error-state checks; a content route may need canonical and crawlability verification.

The matrix should also identify what cannot be tested in the current environment. If field data is unavailable, mark it unavailable rather than treating the missing signal as a pass. If a route requires a test account, record the account role without storing credentials in the report. If third-party content changes unpredictably, note that dependency and isolate the first-party behavior where possible.

## LCP Investigation Worksheet

When LCP is above the desired threshold, write down the actual LCP element and inspect each phase instead of jumping to a generic recommendation. Start with server response. If TTFB is slow, inspect redirects, server work, cache misses, and geographic delivery. If the resource is discovered late, inspect whether it is hidden behind client rendering or CSS discovery. If download duration dominates, inspect the selected asset size, responsive source, compression, and network conditions. If render delay dominates, inspect blocking styles, fonts, JavaScript tasks, and visibility conditions.

A worksheet should include: selected element, resource URL or content type, request priority, discovery point, request start, response completion, render timing, and the proposed change. Record which phase the change is expected to improve. After the change, confirm that the selected LCP element did not change in a way that makes the comparison misleading.

Do not blindly add preload hints or high fetch priority. A preload should match the final resource URL and type, and should be justified by late discovery of a critical resource. If the browser already discovers the resource early, a preload may offer no benefit and can compete with other important requests.

## CLS Investigation Worksheet

For layout shift, identify which elements moved and when. Check images and videos without dimensions, ad slots, third-party embeds, web fonts, client-rendered content inserted above existing content, and transitions that change layout rather than visual properties. Determine whether the movement occurred during initial loading or after an interaction. The remediation should match the cause: dimensions or aspect ratio for media, stable placeholders for embeds, font metric tuning for font swaps, or layout changes that preserve the user's reading position.

A useful test records the page before and after the suspected event at a fixed viewport. Repeat with a slow network and with cache disabled to expose delayed content. Then verify the fix at a narrow viewport and with longer text, because a fixed-height placeholder can create a different problem on mobile or with localization.

Avoid hiding the shifting element, removing content, or forcing an arbitrary height that creates excessive whitespace. The objective is stable presentation while preserving content and responsive behavior.

## Accessibility Manual Test Script

Create a small manual script for the critical user journey. Start with a fresh page load and keep hands off the pointer. Use Tab and Shift+Tab to move through interactive controls, Enter or Space to activate appropriate controls, and Escape where a dialog or menu is expected to close. Observe visible focus, logical order, state changes, and whether focus moves into and returns from overlays. Confirm that form errors are associated with their fields and can be discovered without relying only on color.

For screen-reader checks, verify accessible names, roles, states, headings, landmarks, dialog announcements, and status messages. Test zoom and text resizing where applicable. Check reduced-motion preferences if the page uses animation. The exact assistive technology and browser combination should be recorded because behavior can differ.

Automated Lighthouse accessibility findings remain useful, but manual test failures should not be dismissed because the score is high. Convert recurring checks into automated tests where feasible, while preserving a manual test for behaviors that cannot be reliably inferred by static rules.

## Release Gate Design

A good release gate is narrow enough to be stable and meaningful enough to prevent real regressions. Stable artifact sizes, required metadata, status codes, and selected accessibility assertions can often be checked deterministically. Lab timing scores may be more sensitive to environment variation; use controlled runners, repeated runs, and a documented tolerance. Field Core Web Vitals are population-level measurements and should not be represented as a per-commit lab test.

Each gate needs an owner, a failure message, a documented threshold, and an exception process. The exception should explain why the threshold is exceeded, which user-facing benefit justifies it, who accepts the risk, and when the decision will be reviewed. Avoid permanent unexplained exceptions.

When a gate fails, the CI output should name the route, metric, observed value, threshold, and report artifact. It should not simply say “Lighthouse failed.” Keep raw reports so maintainers can distinguish a genuine regression from a test-environment problem.

## Third-Party Script Review

Third-party scripts can change without an application release and can affect performance, privacy, accessibility, and stability. Inventory analytics, tag managers, chat widgets, embedded video, social widgets, experimentation tools, and advertising scripts. For each script, record the product purpose, owner, consent requirements, loading strategy, and fallback behavior.

If a script blocks rendering or creates long tasks, first establish whether it is necessary for the initial view. Use approved asynchronous or deferred loading when compatible with the vendor and legal requirements. Do not remove consent checks or load a non-essential tracker before the required consent state. Test the page when the vendor is slow or unavailable and confirm that first-party content remains usable.

A third-party script should not be blamed solely because its URL appears in the report. Use the network waterfall and performance trace to attribute requests and execution. Distinguish the script's own work from first-party callbacks it triggers.

## Report Retention and Privacy

Audit reports can expose route names, query strings, request URLs, internal source paths, console output, and screenshots of personalized content. Use synthetic accounts and data wherever possible. Before sharing a report outside the team, inspect it for credentials, personal information, private URLs, and source-map content. Keep artifacts only as long as they support the team's debugging and release needs.

Do not put access tokens or secrets into build variables that are compiled into client assets. If a test URL includes a token, redact it before saving or sharing the report. Limit access to authenticated-route reports and follow the project's data-retention rules. A performance audit should not create a new privacy incident.

## Change Attribution

The strongest optimization experiment changes one logical cause at a time. If image format, font strategy, code splitting, caching, and third-party loading all change in one pull request, a better score does not tell you which change helped or which change introduced a regression. Separate changes when practical, or clearly state that the result is attributable to a combined intervention.

For each change, record the hypothesis, expected metric, risk, functional tests, and observed result. If the expected metric does not change, revisit the diagnosis rather than claiming success based on a different metric. If the metric improves but the user journey regresses, the change is not complete. This discipline builds a history of reliable performance decisions instead of a collection of unexplained score tweaks.

## Additional Named Patterns

### Pattern: Cache-policy split

What it does: separates mutable HTML policy from immutable content-hashed assets.

When to use: when repeat visits are slow or deployments produce stale asset references.

```text
HTML: revalidate or short-lived according to deployment design
Hashed assets: long-lived immutable cache where URL changes with content
```

**Review check:** Document the scope, verify the intended behavior, and keep the corresponding evidence with the change.

### Pattern: Consent-aware third-party loading

What it does: loads optional vendor scripts only after the required consent state and at an appropriate point in the journey.

When to use: when tags or embeds affect performance and privacy requirements govern their loading.

```js
if (consent.analytics === true) {
  loadApprovedAnalytics();
}
```

**Review check:** Document the scope, verify the intended behavior, and keep the corresponding evidence with the change.

### Pattern: Direct-route verification

What it does: tests a page opened by URL rather than only through client-side navigation.

When to use: for static hosting, history-based routing, and lazy-loaded route chunks.

```bash
curl -I https://example.com/projects
```

**Review check:** Document the scope, verify the intended behavior, and keep the corresponding evidence with the change.

### Pattern: Repeat-run summary

What it does: reports a central value and variability from repeated audits rather than choosing the best run.

When to use: when lab timing is unstable or a result sits near a threshold.

```js
const sorted = [...runs].sort((a, b) => a - b);
const median = sorted[Math.floor(sorted.length / 2)];
```

**Review check:** Document the scope, verify the intended behavior, and keep the corresponding evidence with the change.


## Production Audit Checklist

- [ ] Confirm the exact production build and commit.
- [ ] Record the route, viewport, device mode, and page state.
- [ ] Run repeated audits when lab metrics are unstable.
- [ ] Label lab metrics and field metrics distinctly.
- [ ] Identify the actual LCP element and its critical resource.
- [ ] Inspect layout shifts and reserve space for delayed content.
- [ ] Review main-thread tasks and script execution.
- [ ] Verify responsive image selection and asset dimensions.
- [ ] Review font loading, subsets, and fallback behavior.
- [ ] Test keyboard navigation and visible focus.
- [ ] Check form errors, dialog behavior, and state announcements.
- [ ] Verify title, description, canonical, status, and robots directives.
- [ ] Test direct navigation to important routes.
- [ ] Test a relevant weak-network or failed-resource condition.
- [ ] Review third-party scripts and consent requirements.
- [ ] Verify caching behavior for HTML and versioned assets.
- [ ] Preserve reports without exposing private information.
- [ ] Record the exact change, measured result, and remaining risks.

## Review Rubric

A reviewer should be able to answer:
- What real user task does this route support?
- Which metric or accessibility behavior is the concern?
- What evidence identifies the cause?
- Which change addresses that cause?
- How were the same conditions reproduced before and after?
- What functionality, accessibility, or security risk could the change introduce?
- Which tests demonstrate that the user journey still works?
- Which claims are based on lab measurements, field data, or inference?
- What remains unknown or outside the test environment?
- Who owns the remaining follow-up?

## Example Release Note

```text
Route:
Commit:
Audit environment:
Runs:
Finding:
Evidence:
Change:
Before:
After:
Functional verification:
Accessibility verification:
Failure condition tested:
Field data reviewed:
Trade-offs:
Known limitations:
Owner:
```

Fill this note with measured data from the actual project. Never fabricate values to make a release note look complete.

## Scenario-Based Diagnosis

### A hero image is the LCP element but LCP remains slow

Confirm the selected source and request priority, then split the timeline into server response, discovery delay, resource duration, and render delay. If download time is already low, focus on discovery or rendering rather than recompressing the same asset.

### A web font creates a layout shift

Compare fallback and final font metrics and identify when the font is requested. Limit font variants, use an intentional display strategy, and test metric overrides where justified. Repeat with cache disabled and long text.

### The score is good but the interface feels sluggish

Capture a browser Performance trace around the interaction. Inspect event handlers, rendering, layout, and tasks that occur after the initial loading window. Consult field INP if available.

### A keyboard user cannot reach the main action

Reproduce without a pointer, inspect the tab order and focus visibility, and check whether a custom widget has native semantics. Fix the interaction and add a regression test; the aggregate score does not override the observed failure.

### The route passes SEO checks but is not indexed

Inspect status codes, canonical destination, robots directives, sitemap, internal links, and rendered content. Lighthouse cannot prove indexing or ranking; use the relevant search-engine tools and logs where available.

### A third-party widget causes long tasks

Attribute the long task and network requests, check the widget's purpose and consent requirements, then test an approved loading strategy or placeholder. Confirm the page remains useful when the vendor is unavailable.

### Lighthouse results vary widely

Compare browser and tooling versions, machine load, network settings, cache state, server state, and page personalization. Save all runs and use a documented summary instead of selecting the highest score.

### A performance fix breaks the page after refresh

Open the route directly in a new tab and inspect redirects, base path, server fallback, and chunk URLs. Add a direct-route test to the release process.

### The mobile audit downloads desktop-sized images

Inspect `currentSrc`, `srcset`, `sizes`, CSS constraints, and the actual request. Correct responsive selection and confirm the chosen source at multiple viewport widths.

### A CI gate fails intermittently

Separate stable assertions from noisy timing tests. Pin the environment, use repeated runs for lab metrics, report the exact route and metric, and document a narrow tolerance rather than disabling the gate.

## Extended Practice Exercises

### Exercise A: LCP resource investigation
Capture the LCP element and request waterfall. Identify the stage that dominates the delay, make one focused change, and confirm the same element or explain why it changed.

### Exercise B: Layout stability
Find a delayed image, embed, banner, or font that causes movement. Reserve space or correct metrics, then test on a narrow viewport, with a slow network, and with longer content.

### Exercise C: Keyboard journey
Complete the primary page task without a pointer. Record focus order, visible focus, dialog entry and exit, and form error discovery. Convert stable expectations into automated tests where possible.

### Exercise D: Field versus lab comparison
If field data is available, compare the population-level result with lab diagnostics. Explain why the data can differ and do not infer a field pass from a lab score.

### Exercise E: Repeatability
Run the same route at least five times under documented settings. Preserve raw results, summarize them consistently, and investigate any large spread.

### Exercise F: Regression gate
Choose one meaningful stable metric or check, define an owner and threshold, and deliberately create a failing test branch. Confirm that the failure message names the route and metric.

### Exercise G: Failure recovery
Simulate a failed image, font, or async chunk request. Confirm that the page remains understandable and that the user can retry or continue where appropriate.

### Exercise H: Report privacy
Inspect the saved report for query tokens, personal content, private paths, and source maps. Redact or restrict the report according to the project's policy.

## Closing Principle

A Lighthouse checklist should turn an audit into a reproducible engineering decision. The team should know what was tested, what the evidence showed, what changed, and what remains uncertain. A high score is not a substitute for accessible interaction, correct routing, safe data handling, or a reliable experience under imperfect network conditions.
